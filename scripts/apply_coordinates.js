/**
 * Applies resolved coordinates from a geocoding cache into the sector source files.
 *
 * The sector files stay the source of truth (this writes there, then re-runs
 * merge_places.js), so the pipeline is repeatable and a coordinate can never be
 * hand-edited into places.json where a later merge would erase it.
 *
 * Acceptance policy — deliberately narrow, because a wrong marker on a memorial map
 * is a false statement about where a martyr fell:
 *   matched      accepted
 *   approximate  accepted only with --allow-approximate (parent-administration seat)
 *   ambiguous    never accepted without --ids naming it explicitly (same-name hits)
 *   unresolved   left as null, stays 经纬待考
 *
 * Usage:
 *   node scripts/apply_coordinates.js --cache=scripts/data/geocode_amap_cache.json --dry-run
 *   node scripts/apply_coordinates.js --cache=scripts/data/geocode_amap_cache.json
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'scripts/data');
const PLACES = path.join(ROOT, 'src/data/places.json');

const arg = (n) => {
  const hit = process.argv.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.split('=').slice(1).join('=') : null;
};
const CACHE_FILE = arg('cache') || path.join(DATA_DIR, 'geocode_amap_cache.json');
const DRY_RUN = process.argv.includes('--dry-run');
const ALLOW_APPROX = process.argv.includes('--allow-approximate');
const ONLY = arg('ids') ? new Set(arg('ids').split(',')) : null;
const SOURCE_LABEL = arg('source') || 'amap';

const readJson = (f, fb) => {
  try {
    return JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch {
    return fb;
  }
};

const cache = readJson(CACHE_FILE, null);
if (!cache) {
  console.error(`No cache at ${CACHE_FILE}. Run the resolver first.`);
  process.exit(1);
}

const sectorFiles = fs
  .readdirSync(DATA_DIR)
  .filter((f) => /^sector\d+.*\.json$/.test(f))
  .sort();

const accepted = [];
const skipped = { ambiguous: 0, approximate: 0, unresolved: 0, error: 0, out_of_scope: 0 };

for (const file of sectorFiles) {
  const items = readJson(path.join(DATA_DIR, file), []);
  let changed = false;

  for (const item of items) {
    const r = cache[item.id];
    if (!r || r.status !== 'resolved' || !Array.isArray(r.coordinates)) {
      if (r) skipped[r.status] = (skipped[r.status] || 0) + 1;
      continue;
    }
    if (ONLY && !ONLY.has(item.id)) {
      skipped.out_of_scope++;
      continue;
    }
    if (r.confidence === 'ambiguous' && !(ONLY && ONLY.has(item.id))) {
      skipped.ambiguous++;
      continue;
    }
    if (r.confidence === 'approximate' && !ALLOW_APPROX) {
      skipped.approximate++;
      continue;
    }
    if (Array.isArray(item.coordinates) && item.coordinates.length === 2) {
      // Never overwrite an existing coordinate silently.
      skipped.out_of_scope++;
      continue;
    }

    item.coordinates = [+Number(r.coordinates[0]).toFixed(4), +Number(r.coordinates[1]).toFixed(4)];
    item.coordinate_source = r.source || SOURCE_LABEL;
    item.coordinate_note = [
      `${r.source || SOURCE_LABEL} 地理编码`,
      new Date().toISOString().slice(0, 10),
      r.confidence === 'approximate' ? '按所属政区治所示意，非地名精确点位' : '按今名与所属县市双重校验',
      r.detail ? `命中: ${r.detail.formatted_address || r.detail.poi_name || r.detail.district || ''}` : '',
    ]
      .filter(Boolean)
      .join(' · ');
    accepted.push({ id: item.id, confidence: r.confidence, coords: item.coordinates });
    changed = true;
  }

  if (changed && !DRY_RUN) {
    fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(items, null, 2) + '\n', 'utf8');
  }
}

console.log(
  `${DRY_RUN ? '[dry run] would apply' : 'applied'} ${accepted.length} coordinates · skipped ` +
    Object.entries(skipped)
      .filter(([, n]) => n)
      .map(([k, n]) => `${k}:${n}`)
      .join(' ')
);
accepted.slice(0, 12).forEach((a) => console.log(`  ${a.id} ${a.coords.join(',')} (${a.confidence})`));
if (accepted.length > 12) console.log(`  … ${accepted.length - 12} more`);

if (DRY_RUN) {
  console.log('\nnothing written; drop --dry-run to apply, then run:');
} else {
  console.log('\nnow run:');
}
console.log('  node scripts/merge_places.js && node scripts/validate_data.js && npm test');
