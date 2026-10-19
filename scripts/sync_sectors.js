/**
 * Writes the 194 expansion records back into the sector source files.
 *
 * The archive's source of truth is scripts/data/sector*.json; `src/data/places.json`
 * is generated from them by merge_places.js. The expansion was merged straight into
 * places.json, which left places.json (294) and the sectors (100) out of sync — the
 * next `node scripts/merge_places.js` would have silently deleted all 194 records.
 * This script closes that gap.
 *
 * Sector 1-5 are the original curated baseline and are never rewritten: this script
 * only creates `sector6-<region>.json` .. files for records absent from them, and
 * verifies at the end that every sector record still exists in places.json.
 *
 * Coordinates: an expansion record whose location has not been established is
 * written as `null`, not `[]`. "Empty array" and "no coordinate" read the same to a
 * human but not to the app, and `null` is what HeroPlace.coordinates now means.
 *
 * Usage: node scripts/sync_sectors.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'scripts', 'data');
const PLACES = path.resolve(ROOT, 'src/data/places.json');
const DRY_RUN = process.argv.includes('--dry-run');

/** province -> region slug. Mirrors the片区 grouping used by data-expansion. */
const REGION_OF_PROVINCE = {
  黑龙江省: 'northeast',
  吉林省: 'northeast',
  辽宁省: 'northeast',
  内蒙古自治区: 'northeast',
  河北省: 'north',
  山西省: 'north',
  山东省: 'north',
  河南省: 'north',
  北京市: 'north',
  天津市: 'north',
  江苏省: 'east',
  浙江省: 'east',
  安徽省: 'east',
  上海市: 'east',
  江西省: 'east',
  福建省: 'east',
  湖北省: 'centralsouth',
  湖南省: 'centralsouth',
  广东省: 'centralsouth',
  广西壮族自治区: 'centralsouth',
  四川省: 'west',
  重庆市: 'west',
  云南省: 'west',
  贵州省: 'west',
  陕西省: 'west',
  甘肃省: 'west',
  宁夏回族自治区: 'west',
  新疆维吾尔自治区: 'west',
  青海省: 'west',
  海南省: 'south',
};

/** Files owned by the baseline curator — read-only for this script. */
const BASELINE_FILES = ['sector1.json', 'sector2.json', 'sector3.json', 'sector4.json', 'sector5.json'];
const NEW_FILE_ORDER = ['northeast', 'north', 'east', 'centralsouth', 'west', 'south'];

const readJson = (f, fb) => {
  try {
    return JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch {
    return fb;
  }
};

const places = readJson(PLACES, []);
if (!places.length) {
  console.error('places.json is empty or unreadable — refusing to write sectors.');
  process.exit(1);
}

const baselineIds = new Set();
for (const f of BASELINE_FILES) {
  (readJson(path.join(DATA_DIR, f), []) || []).forEach((p) => baselineIds.add(p.id));
}

const expansion = places.filter((p) => !baselineIds.has(p.id));
console.log(
  `places.json ${places.length} · baseline sectors ${baselineIds.size} · to write back ${expansion.length}`
);

/** Splits "山东省/江苏省" style values on the first province for grouping. */
const regionOf = (p) => REGION_OF_PROVINCE[String(p.province).split('/')[0].trim()] || 'west';

const buckets = new Map();
for (const rec of expansion) {
  const region = regionOf(rec);
  if (!buckets.has(region)) buckets.set(region, []);
  const out = { ...rec };
  if (!Array.isArray(out.coordinates) || out.coordinates.length !== 2) out.coordinates = null;
  buckets.get(region).push(out);
}

// Number the new files after the baseline so merge_places glob order stays stable.
let index = 6;
const written = [];
for (const region of NEW_FILE_ORDER.concat([...buckets.keys()].filter((r) => !NEW_FILE_ORDER.includes(r)))) {
  const items = buckets.get(region);
  if (!items || !items.length) continue;
  const file = `sector${index++}-${region}.json`;
  const target = path.join(DATA_DIR, file);
  if (!DRY_RUN) fs.writeFileSync(target, JSON.stringify(items, null, 2) + '\n', 'utf8');
  written.push({ file, count: items.length });
  console.log(`${DRY_RUN ? '[would write]' : '[wrote]'} ${file}: ${items.length} items`);
}

// Integrity: every baseline record must still be present in places.json.
const liveIds = new Set(places.map((p) => p.id));
const orphaned = [...baselineIds].filter((id) => !liveIds.has(id));
if (orphaned.length) {
  console.error(`[FAIL] ${orphaned.length} baseline records are missing from places.json: ${orphaned.join(', ')}`);
  process.exit(1);
}

const total = baselineIds.size + written.reduce((a, w) => a + w.count, 0);
console.log(`\nsectors now cover ${total} records (baseline ${baselineIds.size} + new ${total - baselineIds.size})`);
if (total !== places.length) {
  console.error(`[FAIL] sector total ${total} != places.json ${places.length} — do not trust these files yet.`);
  process.exit(1);
}
console.log('run: node scripts/merge_places.js && node scripts/validate_data.js');
