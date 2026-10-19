/**
 * Sector source files -> src/data/places.json.
 *
 * scripts/data/sector*.json are the archive's source of truth; this script is the
 * only supported way to regenerate places.json.
 *
 * Two rules exist because of a real incident: the 294-record expansion was merged
 * straight into places.json while the sector files still held 100 records, so the
 * next run of this script would have deleted 194 records without complaint.
 *   1. every sector*.json in the directory is picked up (no hand-maintained list),
 *   2. a merge that would shrink places.json aborts unless --force is passed.
 *
 * Usage: node scripts/merge_places.js [--force] [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const TARGET_FILE = path.join(__dirname, '..', 'src', 'data', 'places.json');
const FORCE = process.argv.includes('--force');
const DRY_RUN = process.argv.includes('--dry-run');

/** natural order: sector1, sector2, … sector9, sector10 */
const sectorFiles = fs
  .readdirSync(DATA_DIR)
  .filter((f) => /^sector\d+.*\.json$/.test(f))
  .sort((a, b) => {
    const na = parseInt(a.match(/\d+/)[0], 10);
    const nb = parseInt(b.match(/\d+/)[0], 10);
    return na - nb || a.localeCompare(b);
  });

const allPlaces = [];
const seenIds = new Set();
let unlocated = 0;

for (const file of sectorFiles) {
  let items;
  try {
    items = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
  } catch (err) {
    console.error(`[Error] parsing ${file}:`, err.message);
    process.exit(1);
  }
  if (!Array.isArray(items)) {
    console.error(`[Error] ${file} is not a JSON array`);
    process.exit(1);
  }
  for (const item of items) {
    if (!item.id || !item.modern_name || !item.hero || !item.hero.name) {
      console.error(
        `[Error] invalid item in ${file}: missing id / modern_name / hero.name — ${JSON.stringify(item).slice(0, 160)}`
      );
      process.exit(1);
    }
    if (seenIds.has(item.id)) {
      console.error(`[Error] duplicate id "${item.id}" in ${file}`);
      process.exit(1);
    }
    // coordinates may legitimately be null (经纬待考); an empty array is the old
    // spelling of the same thing, normalised so downstream code sees one form.
    if (!Array.isArray(item.coordinates) || item.coordinates.length !== 2) {
      item.coordinates = null;
      unlocated++;
    }
    seenIds.add(item.id);
    allPlaces.push(item);
  }
  console.log(`[Loaded] ${file}: ${items.length} items`);
}

let previous = [];
if (fs.existsSync(TARGET_FILE)) {
  try {
    previous = JSON.parse(fs.readFileSync(TARGET_FILE, 'utf8'));
  } catch {
    previous = [];
  }
}

if (previous.length && allPlaces.length < previous.length && !FORCE) {
  console.error(
    `\n[Refused] merge yields ${allPlaces.length} records but places.json already holds ${previous.length}: ` +
      `${previous.length - allPlaces.length} records would be deleted, which means the sector files are out ` +
      `of sync with places.json.\nRun "node scripts/sync_sectors.js" first, or pass --force if the deletion is intended.`
  );
  process.exit(1);
}

console.log(
  `\n${allPlaces.length} records across ${sectorFiles.length} sector files · ${unlocated} 处经纬待考 (coordinates: null)`
);
if (DRY_RUN) {
  console.log('[dry run] places.json not modified');
} else {
  fs.writeFileSync(TARGET_FILE, JSON.stringify(allPlaces, null, 2) + '\n', 'utf8');
  console.log('[Success] wrote src/data/places.json');
}
