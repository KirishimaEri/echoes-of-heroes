/**
 * AMap (高德) Web服务 resolver for the coordinates still missing in places.json.
 *
 * Why AMap and not OSM: this project renders AutoNavi tiles (see
 * `TileSources` in LeafletMap.tsx — chosen for its boundary depiction, not for
 * convenience), and AMap's gazetteer carries 乡镇/街道/村 coverage that OSM's
 * geocoder simply does not have in rural China. Measured on this dataset:
 * photon.komoot.io resolved 7 of the first 40 pending records; the same records
 * are exactly the village- and street-level ones OSM lacks.
 *
 * Datum: AMap returns GCJ-02, the same datum as the tile layer, so markers land
 * where the basemap draws them. Note that the older hand-entered records are
 * only accurate to ~2 decimal degrees anyway; `coordinate_source` records where
 * each value came from so a future single-datum pass is possible. See
 * KNOWN_ISSUES.md.
 *
 * Usage:
 *   AMAP_KEY=xxxx node scripts/geocode_amap.js [--limit=N] [--ids=a,b] [--dry-run]
 *   node scripts/geocode_amap.js --key=xxxx
 *
 * Never called without a key; it writes only scripts/data/geocode_amap_cache.json.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PLACES = path.join(ROOT, 'src/data/places.json');
const CACHE = path.join(ROOT, 'scripts/data/geocode_amap_cache.json');
const UA = 'echoes-of-heroes/0.1';
const THROTTLE_MS = 260; // AMap free tier allows well above 4 rps; stay polite.

const arg = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : null;
};
const KEY = arg('key') || process.env.AMAP_KEY || '';
const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = Number(arg('limit')) || Infinity;
const ID_SET = arg('ids') ? new Set(arg('ids').split(',').filter(Boolean)) : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const loadJson = (f, fb) => {
  try {
    return JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch {
    return fb;
  }
};

async function amap(pathname, params) {
  const qs = new URLSearchParams({ ...params, key: KEY });
  const url = `https://restapi.amap.com${pathname}?${qs}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    await sleep(THROTTLE_MS);
    let res;
    try {
      res = await fetch(url, { headers: { 'User-Agent': UA } });
    } catch (e) {
      if (attempt === 3) return { error: `network: ${e.message}` };
      continue;
    }
    if (!res.ok) {
      if (attempt === 3) return { error: `HTTP ${res.status}` };
      await sleep(THROTTLE_MS * attempt * 3);
      continue;
    }
    const body = await res.json().catch(() => null);
    if (!body) return { error: 'bad json' };
    // AMap reports failures in-band with status "0".
    if (body.status === '0') return { error: `${body.infocode || '?'} ${body.info}` };
    return body;
  }
  return { error: 'exhausted' };
}

const cleanAdmin = (s) =>
  String(s || '')
    .replace(/[（(].*?[)）]/g, '')
    .replace(/\/.*$/g, '')
    .replace(/\s+/g, '');

/** Deepest-first list of parent admin units, e.g. 哈尔滨市五常市沙河子镇 -> [沙河子镇, 五常市, 哈尔滨市] */
function adminChain(city) {
  const c = cleanAdmin(city);
  return (c.match(/[^市省]+市|[^县区旗]+[县区旗]|[^镇乡]+[镇乡]|[^区]+区/g) || []).reverse();
}

function parseLoc(s) {
  const [lng, lat] = String(s || '').split(',').map(Number);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  if (lng < 73 || lng > 136 || lat < 3 || lat > 54) return null;
  return [+lng.toFixed(4), +lat.toFixed(4)];
}

/**
 * Stage 1 — geocode the full address string. Accept only when AMap claims a
 * fine-grained match level (道路/路口/兴趣点/门牌/村庄), because a coarse match
 * ("市" or "区县") would silently place a village at its county seat.
 */
const FINE_LEVELS = ['兴趣点', '道路', '道路交叉口', '门牌号', '村庄', 'POI', '地名'];
async function byGeocode(place) {
  const address = `${cleanAdmin(place.province)}${cleanAdmin(place.city)}${place.modern_name}`;
  const body = await amap('/v3/geocode/geo', {
    address,
    city: cleanAdmin(place.province),
    output: 'JSON',
  });
  const first = (body.geocodes || [])[0];
  if (!first) return { miss: 'geocode: no result' };
  const level = String(first.level || '');
  const coords = parseLoc(first.location);
  if (!coords) return { miss: 'geocode: unusable location' };
  const nameOk = String(first.street || first.number || '').includes(place.modern_name) ||
    String(first.formatted_address || '').includes(place.modern_name);
  const fine = FINE_LEVELS.some((l) => level.includes(l));
  if (!fine && !nameOk) return { miss: `geocode level too coarse (${level})` };
  return {
    coordinates: coords,
    confidence: fine ? 'matched' : 'approximate',
    detail: { level, formatted_address: first.formatted_address, adcode: first.adcode },
    endpoint: '/v3/geocode/geo',
  };
}

/** Stage 2 — POI search restricted to the parent city, name must match. */
async function byPoi(place) {
  const region = adminChain(place.city)[0] || cleanAdmin(place.province);
  const body = await amap('/v5/place/text', {
    keywords: place.modern_name,
    region,
    city_limit: 'true',
    page_size: 25,
    types: '190000', // 地名地址信息
    output: 'JSON',
    show_fields: 'business',
  });
  const pois = body.pois || [];
  if (!pois.length) return { miss: 'poi: no result' };
  const wanted = String(place.modern_name).replace(/[省市区县镇乡村]$/g, '');
  const hit = pois.find((p) => {
    const nm = String(p.name || '');
    return nm.includes(place.modern_name) || (wanted.length >= 2 && nm.includes(wanted));
  });
  if (!hit) return { miss: `poi: no name match among ${pois.length}` };
  const coords = parseLoc(hit.location);
  if (!coords) return { miss: 'poi: unusable location' };
  return {
    coordinates: coords,
    confidence: 'matched',
    detail: {
      poi_name: hit.name,
      adname: hit.adname,
      cityname: hit.cityname,
      pname: hit.pname,
      type: hit.type,
    },
    endpoint: '/v5/place/text',
  };
}

/** Stage 3 — last resort: the parent administration's own centre, flagged approximate. */
async function byDistrict(place) {
  for (const unit of adminChain(place.city)) {
    const body = await amap('/v3/config/district', {
      keywords: unit,
      subdistrict: '0',
      output: 'JSON',
    });
    const d = (body.districts || [])[0];
    const coords = d ? parseLoc(d.center) : null;
    if (coords) {
      return {
        coordinates: coords,
        confidence: 'approximate',
        detail: { district: d.name, level: d.level, adcode: d.adcode },
        endpoint: '/v3/config/district',
      };
    }
  }
  return { miss: 'district: no anchor' };
}

async function resolve(place) {
  const attempts = [byGeocode, byPoi, byDistrict];
  const log = [];
  for (const attempt of attempts) {
    const r = await attempt(place);
    if (r.error) {
      log.push(`${attempt.name}: ${r.error}`);
      // A quota/auth error means every later call fails too — abort loudly.
      if (/10003|USER_DAILY|DAILY|QUOTA|INVALID_USER_KEY/i.test(r.error)) {
        return { status: 'error', reason: r.error, log };
      }
      continue;
    }
    if (r.miss) {
      log.push(`${attempt.name}: ${r.miss}`);
      continue;
    }
    return {
      status: 'resolved',
      confidence: r.confidence,
      coordinates: r.coordinates,
      source: `amap ${r.endpoint}`,
      detail: r.detail,
      tried: log,
    };
  }
  return { status: 'unresolved', reason: log[log.length - 1] || 'no candidate', log };
}

async function main() {
  if (!KEY) {
    console.error(
      'No AMap key. Run:  AMAP_KEY=your_key node scripts/geocode_amap.js\n' +
        '(Free 个人认证 key from https://console.amap.com — 需要“Web服务”类型，不是 JS API key。)'
    );
    process.exit(2);
  }

  const places = loadJson(PLACES, []);
  const cache = loadJson(CACHE, {});
  const missing = places.filter(
    (p) => !Array.isArray(p.coordinates) || p.coordinates.length !== 2
  );
  const todo = missing
    .filter((p) => !cache[p.id] || cache[p.id].status === 'error')
    .filter((p) => !ID_SET || ID_SET.has(p.id))
    .slice(0, LIMIT);

  console.log(`pending ${missing.length} · to query ${todo.length}`);
  let i = 0;
  for (const place of todo) {
    i++;
    const r = await resolve(place);
    r.at = new Date().toISOString();
    r.query = {
      name: place.modern_name,
      province: place.province,
      city: place.city,
      category: place.category,
    };
    cache[place.id] = r;
    process.stdout.write(
      `[${i}/${todo.length}] ${r.status.padEnd(11)} ${(r.confidence || r.reason || '').padEnd(12)} ${place.id}\n`
    );
    if (!DRY_RUN && i % 10 === 0) fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2));
    if (r.status === 'error') {
      console.error(`\nstopped: ${r.reason}`);
      break;
    }
  }
  if (!DRY_RUN) fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2));

  const tally = {};
  Object.values(cache).forEach((v) => {
    const k = `${v.status}/${v.confidence || ''}`;
    tally[k] = (tally[k] || 0) + 1;
  });
  console.log('\n=== summary ===', tally);
  console.log(`cache: ${CACHE}`);
}

main();
