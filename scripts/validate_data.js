/**
 * Data invariants for the archive. Exits non-zero on the first failure list.
 *
 * These checks exist because the 294-record expansion broke two things at once:
 * a viewer crash (fields the UI assumed were always present) and a source-of-truth
 * drift (places.json held 294 records while scripts/data/sector*.json still held
 * 100, so the next merge would have deleted the expansion). Run after every data
 * change:  npm run validate
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'scripts/data');
const PLACES = path.join(ROOT, 'src/data/places.json');

const CATEGORIES = new Set(['县市', '街道', '乡镇与村落', '历史曾用县名', '乡镇']);
/** Provinces sync_sectors.js knows how to bucket; anything else lands in `west` by default. */
const KNOWN_PROVINCES = new Set([
  '黑龙江省', '吉林省', '辽宁省', '内蒙古自治区',
  '河北省', '山西省', '山东省', '河南省', '北京市', '天津市',
  '江苏省', '浙江省', '安徽省', '上海市', '江西省', '福建省',
  '湖北省', '湖南省', '广东省', '广西壮族自治区',
  '四川省', '重庆市', '云南省', '贵州省', '陕西省', '甘肃省',
  '宁夏回族自治区', '新疆维吾尔自治区', '青海省', '海南省',
]);
const NOW_YEAR = new Date().getFullYear();

const fail = [];
const warn = [];
const err = (msg) => fail.push(msg);

const places = JSON.parse(fs.readFileSync(PLACES, 'utf8'));
if (!Array.isArray(places) || !places.length) {
  console.error('places.json is empty — nothing to validate.');
  process.exit(1);
}

/* ---- 1. sector files must reproduce places.json exactly ---------------- */
const sectorFiles = fs
  .readdirSync(DATA_DIR)
  .filter((f) => /^sector\d+.*\.json$/.test(f))
  .sort();
const sectorIds = new Set();
for (const f of sectorFiles) {
  const items = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8'));
  if (!Array.isArray(items)) err(`${f} is not an array`);
  else items.forEach((i) => sectorIds.add(i.id));
}
const placeIds = new Set(places.map((p) => p.id));
const onlyInSectors = [...sectorIds].filter((id) => !placeIds.has(id));
const onlyInPlaces = [...placeIds].filter((id) => !sectorIds.has(id));
if (onlyInSectors.length)
  err(`in sectors but not places.json (${onlyInSectors.length}): ${onlyInSectors.slice(0, 5).join(', ')}`);
if (onlyInPlaces.length)
  err(
    `in places.json but not in any sector file (${onlyInPlaces.length}): ${onlyInPlaces
      .slice(0, 5)
      .join(', ')}\n  → run "node scripts/sync_sectors.js"; a later merge_places.js would delete these`
  );

/* ---- 2. per-record field contracts ---------------------------------- */
const seen = new Set();
for (const p of places) {
  const at = p.id || p.modern_name || '(unidentified)';
  if (seen.has(p.id)) err(`duplicate id: ${p.id}`);
  seen.add(p.id);

  if (!/^[a-z0-9-]+$/.test(String(p.id))) err(`${at}: id is not a lowercase slug`);
  if (!CATEGORIES.has(p.category)) err(`${at}: unknown category "${p.category}"`);
  if (!p.modern_name || !String(p.modern_name).trim()) err(`${at}: empty modern_name`);
  if (!p.hero || !p.hero.name) err(`${at}: missing hero.name`);
  if (!Array.isArray(p.sources) || p.sources.length === 0) err(`${at}: no sources`);
  if (!p.province) err(`${at}: empty province`);
  else {
    String(p.province)
      .split('/')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((prov) => {
        if (!KNOWN_PROVINCES.has(prov)) warn.push(`${at}: province "${prov}" has no region mapping`);
      });
  }

  // coordinates: null (经纬待考) or a [lng, lat] pair inside China
  if (p.coordinates !== null && p.coordinates !== undefined) {
    if (!Array.isArray(p.coordinates) || p.coordinates.length !== 2) {
      err(`${at}: coordinates must be null or [lng, lat], got ${JSON.stringify(p.coordinates)}`);
    } else {
      const [lng, lat] = p.coordinates;
      if (![lng, lat].every(Number.isFinite)) err(`${at}: non-finite coordinate`);
      // Axis order is the project's standing trap: lng first, lat second.
      else if (lng < 73 || lng > 136 || lat < 3 || lat > 54)
        err(`${at}: coordinate outside China bbox — swapped axes or wrong gazetteer hit? (${lng}, ${lat})`);
    }
  }

  const h = p.hero || {};
  if (h.death_year !== null && h.death_year !== undefined) {
    if (!Number.isInteger(h.death_year) || h.death_year < 1895 || h.death_year > 1950)
      err(`${at}: implausible death_year ${h.death_year}`);
  }
  if (h.birth_year !== null && h.birth_year !== undefined) {
    // Floor is deliberately generous: the archive includes 韩国钧 (1857–1942, 紫石县),
    // a 晚清进士 who died resisting a puppet appointment in his mid-80s.
    if (!Number.isInteger(h.birth_year) || h.birth_year < 1840 || h.birth_year > 1945)
      err(`${at}: implausible birth_year ${h.birth_year}`);
  }
  if (h.sacrifice_age !== null && h.sacrifice_age !== undefined) {
    if (!(h.sacrifice_age > 5 && h.sacrifice_age < 90)) err(`${at}: implausible sacrifice_age ${h.sacrifice_age}`);
  }
  if (h.sacrifice_date && !/^\d{4}年(\d{1,2}月)?(\d{1,2}日)?/.test(String(h.sacrifice_date)))
    warn.push(`${at}: sacrifice_date is not 「YYYY年M月D日」 style — ${h.sacrifice_date}`);
  if (h.sacrifice_date && h.death_year && Number.isInteger(h.death_year)) {
    const y = parseInt(String(h.sacrifice_date), 10);
    if (y !== h.death_year) warn.push(`${at}: sacrifice_date year ${y} != death_year ${h.death_year}`);
  }
  // Renaming happened no earlier than the sacrifice and no later than today.
  const ry = Number(p.renamed_year);
  if (p.renamed_year !== null && p.renamed_year !== undefined && !Number.isNaN(ry)) {
    if (ry < 1931 || ry > NOW_YEAR) err(`${at}: renamed_year ${ry} outside 1931–${NOW_YEAR}`);
    if (Number.isInteger(h.death_year) && ry < h.death_year)
      warn.push(`${at}: renamed_year ${ry} precedes death_year ${h.death_year}`);
  } else if (p.renamed_year != null) {
    warn.push(`${at}: renamed_year is non-numeric text — ${p.renamed_year}`);
  }
}

/* ---- 3. duplicate detection (the expansion's own dedupe rule) -------- */
const byName = new Map();
for (const p of places) {
  const key = `${p.province}|${p.modern_name}|${p.category}`;
  byName.set(key, (byName.get(key) || 0) + 1);
}
[...byName.entries()].filter(([, n]) => n > 1).forEach(([k, n]) => err(`duplicate record shape ${k} × ${n}`));

/* ---- 4. headline report --------------------------------------------- */
const located = places.filter((p) => Array.isArray(p.coordinates) && p.coordinates.length === 2).length;
const undated = places.filter((p) => p.hero && p.hero.death_year == null).length;
console.log(
  `records ${places.length} · sector files ${sectorFiles.length} · located ${located} · 经纬待考 ${places.length - located} · 年月待考 ${undated}`
);
if (warn.length) {
  console.log(`\n${warn.length} warning(s):`);
  warn.slice(0, 25).forEach((w) => console.log('  ⚠ ' + w));
  if (warn.length > 25) console.log(`  … ${warn.length - 25} more`);
}
if (fail.length) {
  console.error(`\n${fail.length} error(s):`);
  fail.forEach((f) => console.error('  ✖ ' + f));
  process.exit(1);
}
console.log('\n✓ all data invariants hold');
