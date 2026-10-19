/**
 * Resolves missing coordinates with amap.com's key-free suggestion endpoint.
 *
 * Why this instead of the Web服务 API: the map renders AMap *raster tiles*
 * (`webrd0{s}.is.autonavi.com/appmaptile`), which are plain public images and need
 * no key — Leaflet does the projection locally. The only step that ever needed
 * credentials was turning a place name into a coordinate. `www.amap.com/service/poiTips`
 * does that without a key and, unlike OSM's gazetteer, it knows Chinese villages:
 * measured on this dataset it matched 12 of 20 hard cases against photon.komoot.io's
 * 26%. Note `poiInfo` (the full search API) is captcha-gated from this network —
 * this endpoint is not, but it is still an undocumented one, so treat it as a
 * candidate generator, not an authority: every accepted value is re-checked against
 * the record's own parent administration before it reaches the data.
 *
 * Verification rule (deliberately strict):
 *   1. tip.name must equal modern_name (after stripping a trailing 镇/乡/村/路… only
 *      when both sides are otherwise identical);
 *   2. tip.district must contain the record's deepest parent unit (镇/乡 if the record
 *      names one, else 县/市/区) — 双龙村 exists seven times inside 哈尔滨市 alone,
 *      and the record says 五常市沙河子镇;
 *   3. exactly one tip may survive 1+2. Two survivors is 「ambiguous」, zero is
 *      「unresolved」; neither is ever written to the archive.
 * 历史曾用县名 (复程县, 康杰县…) cannot match at all — those counties were dissolved,
 * so no map service has them. They stay 经纬待考 rather than being pinned to their
 * successor county's seat, which would assert a location the record does not claim.
 *
 * Usage: node scripts/geocode_amap_web.js [--limit=N] [--ids=a,b] [--dry-run] [--force]
 * Cache: scripts/data/geocode_web_cache.json (resumable). Apply with:
 *   node scripts/apply_coordinates.js --cache=scripts/data/geocode_web_cache.json --source="amap poiTips (GCJ-02)"
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PLACES = path.join(ROOT, 'src/data/places.json');
const CACHE = path.join(ROOT, 'scripts/data/geocode_web_cache.json');
const ENDPOINT = 'https://www.amap.com/service/poiTips';
const THROTTLE_MS = 400;

const arg = (n) => {
  const hit = process.argv.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.split('=').slice(1).join('=') : null;
};
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
// Re-attempt records the previous run gave up on, without throwing away resolved ones.
const RETRY_UNRESOLVED = process.argv.includes('--retry-unresolved');
const LIMIT = Number(arg('limit')) || Infinity;
const ID_SET = arg('ids') ? new Set(arg('ids').split(',').filter(Boolean)) : null;

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
  Referer: 'https://www.amap.com/',
  Accept: 'application/json, text/plain, */*',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJson = (f, fb) => {
  try {
    return JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch {
    return fb;
  }
};

const cleanAdmin = (s) =>
  String(s || '')
    .replace(/[（(].*?[)）]/g, '')
    .replace(/\/.*$/g, '')
    .replace(/\s+/g, '');

/**
 * Administrative bar a candidate must clear, derived from the record's own text.
 *
 * The record's specificity is the gate: a record pinned to 五常市 must match at county
 * level and cannot be satisfied by a same-name place elsewhere in 哈尔滨市 — an
 * earlier "try each tier until something matches" version accepted 双龙村@阿城区 for a
 * record reading 五常市沙河子镇, a ~200 km error a naive check waved through.
 *
 * Tokenising Chinese administrative strings by regex is a minefield; each rule below
 * exists because a real record broke the simpler version:
 *   - a unit character only ends a token if ≥2 characters precede it in the run, so
 *     「新乡市」 is one 市 (name 新乡) and not a 乡 called 新;
 *   - multi-character units (自治州/自治县/地区/盟) are tried before single ones, so
 *     「延边朝鲜族自治州」 stays whole;
 *   - prefecture level is not just 「ends with 市」: 恩施土家族苗族自治州, 赤峰市 and
 *     大同地区 are all prefecture-level.
 * 镇/乡 names are kept as corroboration only — AMap's `district` string stops at 区县,
 * so a town can confirm a hit but can never be the gate.
 */
const UNITS_LONG = ['自治州', '自治县', '地区'];
const UNITS_SHORT = ['省', '市', '县', '区', '旗', '盟', '镇', '乡'];
const MIN_NAME = 2;

function adminUnits(s) {
  const out = [];
  let run = '';
  for (let i = 0; i < s.length; i++) {
    const long = UNITS_LONG.find((u) => s.startsWith(u, i));
    const unit = long || (UNITS_SHORT.includes(s[i]) ? s[i] : null);
    if (unit && run.length >= MIN_NAME) {
      out.push(run + unit);
      run = '';
      i += unit.length - 1;
      continue;
    }
    run += s[i];
  }
  if (run) out.push(run); // a name with no unit suffix, e.g. 「密云」
  return out;
}

const PREFECTURE_RE = /(自治州|地区|盟|市)$/;
const TOWN_RE = /(镇|乡)$/;

function parentTokens(province, city) {
  const all = adminUnits(cleanAdmin(city));
  const core = (t) => {
    const u = [...UNITS_LONG, ...UNITS_SHORT].find((x) => t.endsWith(x));
    const stripped = u ? t.slice(0, -u.length) : t;
    // 曹县 / 莘县 strip to one character, which the length guard below would drop,
    // silently losing the county gate — keep the full form, which `district` contains.
    return stripped.length >= 2 ? stripped : t;
  };

  // The leading token is the prefecture only if it looks like one: 直辖市 street
  // records carry a bare district ("西城区"), which must gate at county level rather
  // than degrade to province.
  const firstIsPrefecture = PREFECTURE_RE.test(all[0] || '') && !TOWN_RE.test(all[0]);
  const prefecture = firstIsPrefecture ? [core(all[0])] : [];
  const rest = firstIsPrefecture ? all.slice(1) : all;
  const towns = all.filter((t) => TOWN_RE.test(t)).map(core);
  const counties = rest
    .filter((t) => /(县|区|市|旗|自治县)$/.test(t) && !TOWN_RE.test(t))
    .map(core);

  const prov = cleanAdmin(province).replace(
    /(省|市|壮族自治区|回族自治区|维吾尔自治区|自治区)$/,
    ''
  );

  if (counties.length) return { gate: counties, gateLevel: 'county', town: towns };
  if (prefecture.length) return { gate: prefecture, gateLevel: 'prefecture', town: towns };
  return { gate: [prov].filter((t) => t.length >= 2), gateLevel: 'province', town: towns };
}

/** Candidates whose district clears the record's administrative gate. */
function withinParent(candidates, spec) {
  const gate = Array.isArray(spec) ? spec : spec.gate;
  return candidates.filter((t) => {
    const district = String(t.district || '');
    return gate.some((tok) => tok.length >= 2 && district.includes(tok));
  });
}
const normName = (n) =>
  String(n || '')
    .replace(/\s+/g, '')
    .replace(/(大街|大道|街|路|镇|乡|村|社区|区)$/, (m) => (m.length > 1 ? m : ''));

function isSameName(expected, got) {
  const a = String(expected || '').trim();
  const b = String(got || '').trim();
  if (!a || !b) return false;
  if (a === b) return true;
  // 「自忠路」 vs 「张自忠路」 is a different place name, not a spelling variant:
  // only trailing generic suffixes may differ (村/庄, 街/大街).
  const na = normName(a);
  const nb = normName(b);
  return na.length >= 2 && na === nb;
}

async function tips(words, city) {
  const params = { words, citylimit: 'true' };
  if (city) params.city = String(city);
  const qs = new URLSearchParams(params);
  for (let attempt = 1; attempt <= 3; attempt++) {
    await sleep(THROTTLE_MS * attempt);
    let res;
    try {
      res = await fetch(`${ENDPOINT}?${qs}`, { headers: HEADERS });
    } catch (e) {
      if (attempt === 3) return { error: `network: ${e.message}` };
      continue;
    }
    if (!res.ok) {
      if (attempt === 3) return { error: `HTTP ${res.status}` };
      continue;
    }
    const text = await res.text();
    if (!text.trim().startsWith('{')) {
      // Anti-bot interstitial instead of JSON.
      return { error: 'blocked (captcha interstitial)' };
    }
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      return { error: 'unparseable' };
    }
    const list = ((body.data || {}).tip_list || []).map((t) => t.tip).filter(Boolean);
    return { tips: list };
  }
  return { error: 'exhausted' };
}

function toPoint(t) {
  const lng = Number(t.x);
  const lat = Number(t.y);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  if (lng < 73 || lng > 136 || lat < 3 || lat > 54) return null;
  return [+lng.toFixed(4), +lat.toFixed(4)];
}

const adcodeCache = new Map();

/**
 * adcode of a record's deepest parent unit, e.g. 五常市 -> 230184.
 *
 * Scoping the query to it is what surfaces 五常市双龙村: an unfiltered 全国 query
 * returned ten same-name rows from 阿城/双城/延寿/呼兰 and never the 五常 one. The
 * adcode only narrows the search window — every hit still has to clear the district
 * gate, so a wrong county cannot be accepted by scoping alone.
 */
async function countyAdcode(spec, province) {
  const token = spec.gate[0];
  if (!token || spec.gateLevel === 'province') return null;
  const key = `${province}|${token}`;
  if (adcodeCache.has(key)) return adcodeCache.get(key);
  const probe = /[县区市旗]$/.test(token) ? token : `${token}市`;
  const r = await tips(probe);
  let code = null;
  for (const t of r.tips || []) {
    if (!t.adcode) continue;
    if (String(t.name || '').startsWith(token) || String(t.district || '').includes(token)) {
      code = String(t.adcode);
      break;
    }
  }
  adcodeCache.set(key, code);
  return code;
}

/**
 * Direct name match, or the administrative seat of that unit.
 *
 * Township and village tips frequently arrive without x/y while the coordinate lives
 * on the 「X镇人民政府」/「X村民委员会」 row — the seat. That is still a defensible
 * point for a 乡/镇/村 record, but it is a different claim from "this exact place",
 * so seat hits are recorded as `approximate` and the archive labels them 按治所定位.
 */
const SEAT_SUFFIX = /(人民政府|村民委员会|村委会|街道办事处|社区居委会|居民委员会)$/;
function classifyTip(target, tipName) {
  const t = String(target || '').trim();
  const n = String(tipName || '').trim();
  if (!t || !n) return null;
  if (isSameName(t, n)) return 'exact';
  if (SEAT_SUFFIX.test(n) && n.includes(t)) return 'seat';
  return null;
}

/**
 * Which seat row speaks for the unit itself.
 * 1 = 「X人民政府」 (the unit's own government = its seat),
 * 2 = 「X村民委员会 / X居委会 / X街道办事处」,
 * 3 = any other seat-suffixed row that merely contains the name.
 */
function seatRank(target, tipName) {
  const n = String(tipName || '');
  const t = String(target || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (new RegExp(`${t}人民政府$`).test(n)) return 1;
  if (new RegExp(`${t}(村民委员会|村委会|社区居委会|居民委员会|街道办事处)$`).test(n)) return 2;
  return 3;
}

async function resolve(place) {
  const name = String(place.modern_name || '').trim();
  if (!name) return { status: 'skipped', reason: 'no modern_name' };
  if (place.category === '历史曾用县名') {
    return {
      status: 'unresolved',
      reason: '战时设县后已撤销，公开地名服务无此名（不做按今属县治所填补）',
    };
  }

  const spec = parentTokens(place.province, place.city);
  const prefix = spec.town[0] || spec.gate[0] || '';
  const adcode = await countyAdcode(spec, place.province);

  // The suggestion list is capped at ~10 rows, so an unfiltered query can miss the
  // one place we want (全国「双龙村」 filled the window with 阿城、双城、延寿… and the
  // 五常市 record never appeared). Scoping to the county adcode brings it back; the
  // district gate below is unchanged, so a scoped hit still has to be in the right
  // administration to count.
  const queries = [];
  if (adcode) {
    queries.push({ words: name, city: adcode });
    if (prefix && prefix !== spec.gate[0]) queries.push({ words: `${prefix}${name}`, city: adcode });
  }
  queries.push({ words: name, city: null });
  if (prefix) queries.push({ words: `${prefix}${name}`, city: null });

  let pool = [];
  let survivors = [];
  const tried = [];
  for (const q of queries) {
    const r = await tips(q.words, q.city);
    if (r.error) return { status: 'error', reason: r.error };
    const matched = (r.tips || []).filter((t) => classifyTip(name, t.name));
    pool = pool.concat(matched);
    survivors = withinParent(pool, spec);
    tried.push(`${q.words}${q.city ? '@' + q.city : '@全国'} → 同名${matched.length} 合规${survivors.length}`);
    if (survivors.length) break;
  }
  if (survivors.length === 0) {
    return {
      status: 'unresolved',
      reason: pool.length ? `同名 ${pool.length} 处均不在所属政区` : '地名服务无同名结果',
      seen: [...new Set(pool.slice(0, 6).map((t) => `${t.district || '?'}·${t.name}`))],
      tried,
    };
  }

  // Prefer rows that speak for the place itself; then the administrative seat,
  // ranked: the unit's own 人民政府 outranks a village committee inside it, and a
  // co-located office (卫生院/东北门/村委会) is the same seat, not a contradiction.
  const exactHits = survivors.filter((t) => classifyTip(name, t.name) === 'exact');
  let picked = pickLocation(exactHits);
  let confidence = 'matched';
  if (!picked.chosen) {
    const seats = survivors.filter((t) => classifyTip(name, t.name) === 'seat');
    const rank1 = seats.filter((t) => seatRank(name, t.name) === 1);
    const rank2 = seats.filter((t) => seatRank(name, t.name) === 2);
    const seatSet = rank1.length ? rank1 : rank2.length ? rank2 : seats;
    const viaSeat = pickLocation(seatSet);
    if (viaSeat.chosen) {
      picked = viaSeat;
      confidence = 'approximate';
    } else if (seatSet.length) {
      // Surface the seat candidates as the deciding set, not the exact rows.
      picked = viaSeat;
    }
  }

  if (!picked.chosen) {
    // Seat rescue: some townships show up with an empty x/y while their
    // 「X人民政府」 row carries the coordinate (this is what recovered 平和县国强乡).
    // It does not help 朝阳县尚志乡 — no row for it carries a coordinate at all, so
    // that record stays 经纬待考 rather than being guessed.
    const rescue = await tips(`${name}人民政府`, adcode);
    if (!rescue.error) {
      const rows = withinParent(
        (rescue.tips || []).filter((t) => classifyTip(name, t.name) === 'seat'),
        spec
      );
      const viaRescue = pickLocation(rows.filter((t) => seatRank(name, t.name) <= 2));
      if (viaRescue.chosen) {
        picked = viaRescue;
        confidence = 'approximate';
      }
    }
  }

  if (!picked.chosen) {
    const plottableCount = picked.groups.length;
    return {
      status: 'unresolved',
      confidence: plottableCount > 1 ? 'ambiguous' : 'no-coordinates',
      reason:
        plottableCount > 1
          ? `所属政区内有 ${plottableCount} 处不同位置的同名结果，无法机械裁定`
          : '所属政区内的同名结果均未带坐标',
      seen: survivors.slice(0, 6).map((t) => `${t.district}·${t.name}·${t.x || '无坐标'}`),
    };
  }

  const t = picked.chosen.members[0].t;
  const corroborated = spec.town.some((tok) =>
    `${t.name || ''} ${t.district || ''} ${t.address || ''}`.includes(tok)
  );
  return {
    status: 'resolved',
    confidence,
    coordinates: picked.chosen.point,
    source: 'amap poiTips (GCJ-02)',
    detail: {
      name: t.name,
      district: t.district,
      adcode: t.adcode,
      address: t.address || '',
      via: confidence === 'approximate' ? 'seat-of-administration' : 'name',
      // 'town' = corroborated down to the record's 镇/乡; 'county'/'prefecture'/
      // 'province' = the deepest level the record itself specified.
      pinnedAt: corroborated ? 'town' : spec.gateLevel,
      mergedTips: picked.chosen.members.length,
    },
  };
}

/**
 * Narrows same-name candidates to one plottable location.
 *
 * Two adjustments matter in practice: township tips frequently arrive as a pair
 * where the first row is the name only (empty x/y) and the second carries the
 * coordinate — so un-plottable rows are dropped before counting; and a village plus
 * its 人民政府 are the same place ~200 m apart, which must not be read as a
 * contradiction. Distinct locations beyond that radius stay ambiguous by rule.
 */
function pickLocation(candidates) {
  const plottable = candidates
    .map((t) => ({ t, point: toPoint(t) }))
    .filter((x) => x.point !== null);

  const groups = [];
  for (const item of plottable) {
    // ~1.2 km. A seat's campus (政府 + 村委会 + 卫生院 + 门岗) is one place, and the
    // archive's precision is already kilometre-level; the protection against a wrong
    // match is the administrative-tier check above, not a tight radius.
    const near = groups.find(
      (g) =>
        Math.abs(g.point[0] - item.point[0]) < 0.014 &&
        Math.abs(g.point[1] - item.point[1]) < 0.011
    );
    if (near) near.members.push(item);
    else groups.push({ point: item.point, members: [item] });
  }

  if (groups.length !== 1) return { groups, chosen: null };
  return { groups, chosen: groups[0] };
}

async function main() {
  const places = readJson(PLACES, []);
  const cache = readJson(CACHE, {});
  const missing = places.filter(
    (p) => !Array.isArray(p.coordinates) || p.coordinates.length !== 2
  );
  const todo = missing
    .filter(
      (p) =>
        FORCE ||
        !cache[p.id] ||
        cache[p.id].status === 'error' ||
        (RETRY_UNRESOLVED && cache[p.id].status === 'unresolved')
    )
    .filter((p) => !ID_SET || ID_SET.has(p.id))
    .slice(0, LIMIT);

  console.log(`pending ${missing.length} · to query ${todo.length}${DRY_RUN ? ' (dry run)' : ''}`);
  let i = 0;
  for (const place of todo) {
    i++;
    let r;
    try {
      r = await resolve(place);
    } catch (e) {
      r = { status: 'error', reason: e.message };
    }
    r.at = new Date().toISOString();
    r.query = { name: place.modern_name, province: place.province, city: place.city, category: place.category };
    cache[place.id] = r;
    process.stdout.write(
      `[${i}/${todo.length}] ${r.status.padEnd(10)} ${(r.confidence || r.reason || '').padEnd(20)} ${place.id}\n`
    );
    if (!DRY_RUN && i % 10 === 0) fs.writeFileSync(CACHE, JSON.stringify(cache, null, 2));
    if (r.status === 'error' && /captcha|blocked/i.test(r.reason || '')) {
      console.error('\n[stopped] endpoint began returning the anti-bot interstitial; resume later.');
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

if (require.main === module) {
  main();
} else {
  // Requireable so `node -e` and tests can exercise one record without a full run.
  module.exports = {
    resolve,
    tips,
    parentTokens,
    withinParent,
    classifyTip,
    pickLocation,
    toPoint,
    isSameName,
  };
}
