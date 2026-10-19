/**
 * Resolves missing `coordinates` in src/data/places.json.
 *
 * Why two passes: a bare name query ("双龙村") returns hits from all over China.
 * We first anchor on the entry's own parent administration (省/市/县/镇 as given in
 * `province` + `city`), then search the target name inside a bounding box around
 * that anchor and require an exact name match plus a consistent province. Anything
 * that fails those checks is recorded as unresolved instead of being filled with a
 * plausible-looking guess — a wrong marker on a memorial map is worse than no marker.
 *
 * Source: photon.komoot.io (OSM/Nominatim backend, WGS84 — same datum as the
 * existing records and the OSM tile layer). Nominatim itself and the Overpass
 * mirrors are unreachable from this network.
 *
 * Usage:  node scripts/geocode_places.js [--dry-run] [--limit=N] [--force]
 * Writes a resumable cache to scripts/data/geocode_cache.json. It never touches
 * places.json — review the cache, then merge accepted hits with:
 *   node scripts/apply_coordinates.js --cache=scripts/data/geocode_cache.json --source="photon-osm (WGS84)"
 * Kept as the fallback/cross-check pass; scripts/geocode_amap.js is the primary
 * resolver because OSM coverage of Chinese villages is ~1/3 of what AMap returns.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PLACES = path.join(ROOT, 'src/data/places.json');
const CACHE = path.join(ROOT, 'scripts/data/geocode_cache.json');
const PHOTON = 'https://photon.komoot.io/api/';
const UA = 'echoes-of-heroes/0.1 (resolving hero-named place coordinates; contact github.com/kirishimaeri)';
const THROTTLE_MS = 1200;
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const LIMIT = Number((process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1]) || Infinity;
const ONLY_IDS = (process.argv.find((a) => a.startsWith('--ids=')) || '').split('=')[1];
const ID_SET = ONLY_IDS ? new Set(ONLY_IDS.split(',').filter(Boolean)) : null;

const PROV_SUFFIX = ['省', '市', '自治区', '壮族自治区', '回族自治区', '维吾尔自治区'];
const ADMIN_TYPES = new Set(['state', 'city', 'town', 'village', 'county', 'district', 'suburb', 'municipality', 'administrative']);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function loadJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

/** "聊城市莘县（朝城一带）" -> "聊城市莘县"; also normalises full-width brackets. */
function cleanAdmin(s) {
  return String(s || '')
    .replace(/[（(].*?[)）]/g, '')
    .replace(/\/.*$/g, '')
    .replace(/\s+/g, '')
    .trim();
}

/**
 * Specificity-ordered candidate queries for the parent administration.
 * "哈尔滨市五常市沙河子镇" -> ["黑龙江省五常市沙河子镇", "沙河子镇", "五常市", "哈尔滨市", "黑龙江省"]
 */
function adminCandidates(province, city) {
  const c = cleanAdmin(city);
  const prov = cleanAdmin(String(province).split('/')[0]);
  const provShort = prov.replace(new RegExp(`(${PROV_SUFFIX.join('|')})$`), '');
  const out = [];
  if (c) {
    out.push(prov + c);
    const tokens = c.match(/[^市县区镇乡]+[市县区镇乡]/g) || [];
    for (const t of tokens) out.push(prov + t, t);
  }
  out.push(prov, provShort);
  return [...new Set(out)].filter(Boolean);
}

/** Deepest token first — used to prefer a tight anchor over a coarse one. */
function adminTokens(city) {
  const c = cleanAdmin(city);
  return (c.match(/[^市县区镇乡]+[市县区镇乡]/g) || []).reverse();
}

function stripSuffix(n) {
  return String(n || '').replace(/[镇乡村路街道Section]+$/, '');
}

function nameMatches(expected, got) {
  const a = String(expected || '').trim();
  const b = String(got || '').trim();
  if (!a || !b) return false;
  if (a === b) return true;
  const core = stripSuffix(a);
  return core.length >= 2 && core === stripSuffix(b);
}

async function photon(query, bbox) {
  const params = new URLSearchParams({ q: query, limit: '10' });
  if (bbox) params.set('bbox', bbox.join(','));
  for (let attempt = 1; attempt <= 3; attempt++) {
    let res;
    try {
      res = await fetch(`${PHOTON}?${params}`, { headers: { 'User-Agent': UA } });
    } catch (e) {
      if (attempt === 3) return { error: `network: ${e.message}` };
      await sleep(THROTTLE_MS * attempt * 2);
      continue;
    }
    if (res.status === 429) {
      await sleep(THROTTLE_MS * attempt * 4);
      continue;
    }
    if (!res.ok) {
      if (attempt === 3) return { error: `HTTP ${res.status}` };
      await sleep(THROTTLE_MS * attempt * 2);
      continue;
    }
    let body;
    try {
      body = await res.json();
    } catch {
      return { error: 'bad json' };
    }
    if (body && body.error) return { error: String(body.error) };
    return { features: body.features || [] };
  }
  return { error: 'exhausted retries' };
}

/** Selects the anchor feature: an admin/place geometry whose name is one of our tokens. */
function pickAnchor(features, province, city) {
  const provShort = cleanAdmin(String(province).split('/')[0]).replace(
    new RegExp(`(${PROV_SUFFIX.join('|')})$`),
    ''
  );
  const tokens = adminTokens(city);
  const usable = (features || []).filter((f) => {
    const p = f.properties || {};
    const isArea = p.osm_key === 'place' || p.osm_key === 'boundary';
    if (!isArea || !ADMIN_TYPES.has(p.type)) return false;
    const inCountry = p.countrycode === 'CN' || p.country === '中国' || !p.countrycode;
    const provOk = !p.state || String(p.state).includes(provShort);
    return isArea && provOk;
  });
  // Prefer the deepest admin token that matched, then the most specific query order.
  for (const tok of tokens) {
    const hit = usable.find((f) => nameMatches(tok, f.properties.name));
    if (hit) return hit;
  }
  return usable[0] || null;
}

function bboxFor(lng, lat, type) {
  const deg = { state: 1.6, city: 1.0, county: 0.7, town: 0.35, village: 0.25, district: 0.35, suburb: 0.3, municipality: 0.7 }[
    type
  ] || 0.5;
  // Latitude degrees cover less ground distance than longitude in China (~35°N).
  return [lng - deg * 1.2, lat - deg, lng + deg * 1.2, lat + deg];
}

async function resolve(place) {
  const target = String(place.modern_name || '').trim();
  if (!target) return { status: 'skipped', reason: 'no modern_name' };

  let anchor = null;
  let anchorQuery = null;
  for (const q of adminCandidates(place.province, place.city)) {
    const r = await sleep(THROTTLE_MS).then(() => photon(q));
    if (r.error) continue;
    const a = pickAnchor(r.features, place.province, place.city);
    if (a) {
      anchor = a;
      anchorQuery = q;
      // A town/county-level anchor is tight enough; a bare province anchor is not.
      const t = a.properties.type;
      if (t !== 'state' && t !== 'city') break;
    }
  }
  if (!anchor) return { status: 'unresolved', reason: 'no parent-admin anchor' };

  const [alng, alat] = anchor.geometry.coordinates;
  const box = bboxFor(alng, alat, anchor.properties.type);
  const provShort = cleanAdmin(String(place.province).split('/')[0]).replace(
    new RegExp(`(${PROV_SUFFIX.join('|')})$`),
    ''
  );

  const queries = [`${cleanAdmin(place.province)}${cleanAdmin(place.city)}${target}`, target];
  const accepted = [];
  for (const q of queries) {
    const r = await sleep(THROTTLE_MS).then(() => photon(q, box));
    if (r.error) continue;
    for (const f of r.features || []) {
      const p = f.properties || {};
      const [lng, lat] = f.geometry.coordinates;
      if (lng < box[0] || lng > box[2] || lat < box[1] || lat > box[3]) continue;
      if (!nameMatches(target, p.name)) continue;
      if (p.countrycode && p.countrycode !== 'CN') continue;
      if (p.state && !String(p.state).includes(provShort) && !String(p.state).includes(provShort + '省')) continue;
      accepted.push({
        lng: +lng.toFixed(4),
        lat: +lat.toFixed(4),
        osm_type: p.osm_type,
        osm_id: p.osm_id,
        feature_type: p.type,
        display: [p.state, p.city, p.district, p.locality, p.name].filter(Boolean).join(' '),
        street: p.street || null,
      });
    }
    if (accepted.length) break;
  }

  if (!accepted.length) {
    return {
      status: 'unresolved',
      reason: 'name not found inside parent bbox',
      anchor: { query: anchorQuery, name: anchor.properties.name, type: anchor.properties.type, lng: +alng.toFixed(4), lat: +alat.toFixed(4) },
    };
  }

  const distinct = new Set(accepted.map((a) => `${a.lng},${a.lat}`));
  const best = accepted[0];
  // Historic counties no longer exist: whatever we find is the successor place's
  // seat, so the whole entry is approximated at its parent administration.
  const approxCategories = new Set(['历史曾用县名']);
  return {
    status: 'resolved',
    confidence: distinct.size > 1 ? 'ambiguous' : approxCategories.has(place.category) ? 'approximate' : 'matched',
    coordinates: [best.lng, best.lat],
    candidates: accepted.length,
    matches: distinct.size,
    anchor: { query: anchorQuery, name: anchor.properties.name, type: anchor.properties.type },
    match: best,
  };
}

async function main() {
  const places = loadJson(PLACES, []);
  const cache = loadJson(CACHE, {});
  const missing = places.filter(
    (p) => !Array.isArray(p.coordinates) || p.coordinates.length !== 2 || !isFinite(p.coordinates[0])
  );
  console.log(`places total ${places.length} · missing coordinates ${missing.length} · cached ${Object.keys(cache).length}`);

  const todo = missing
    .filter((p) => FORCE || !cache[p.id] || cache[p.id].status === 'error')
    .filter((p) => !ID_SET || ID_SET.has(p.id))
    .slice(0, LIMIT);
  console.log(`to resolve now: ${todo.length}${DRY_RUN ? ' (dry run, nothing written)' : ''}`);

  let i = 0;
  for (const place of todo) {
    i++;
    let res;
    try {
      res = await resolve(place);
    } catch (e) {
      res = { status: 'error', reason: e.message };
    }
    res.at = new Date().toISOString();
    res.query = { name: place.modern_name, province: place.province, city: place.city, category: place.category };
    cache[place.id] = res;
    process.stdout.write(
      `[${i}/${todo.length}] ${res.status.padEnd(10)} ${(res.confidence || res.reason || '').padEnd(11)} ${place.id}\n`
    );
    if (!DRY_RUN && i % 5 === 0) fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2));
  }
  if (!DRY_RUN) fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2));

  const summary = {};
  for (const v of Object.values(cache)) {
    const k = `${v.status}/${v.confidence || v.reason || ''}`;
    summary[k] = (summary[k] || 0) + 1;
  }
  console.log('\n=== summary ===');
  console.log(summary);
  console.log(`cache: ${CACHE}`);
}

main();
