const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const TARGET_FILE = path.join(__dirname, '..', 'src', 'data', 'places.json');

const sectorFiles = [
  'sector1.json',
  'sector2.json',
  'sector3.json',
  'sector4.json',
  'sector5.json',
];

const allPlaces = [];
const seenIds = new Set();
let fileCount = 0;

for (const file of sectorFiles) {
  const filePath = path.join(DATA_DIR, file);
  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const items = JSON.parse(raw);
      if (!Array.isArray(items)) {
        throw new Error(`${file} is not a JSON array`);
      }
      for (const item of items) {
        if (!item.id || !item.modern_name || !item.hero || !item.coordinates) {
          throw new Error(`Invalid item in ${file}: missing required fields: ${JSON.stringify(item.modern_name || item)}`);
        }
        if (seenIds.has(item.id)) {
          throw new Error(`Duplicate id found in ${file}: "${item.id}"`);
        }
        seenIds.add(item.id);
        allPlaces.push(item);
      }
      fileCount++;
      console.log(`[Loaded] ${file}: ${items.length} items`);
    } catch (err) {
      console.error(`[Error] parsing ${file}:`, err.message);
      process.exit(1);
    }
  }
}

// Write to TARGET_FILE
fs.writeFileSync(TARGET_FILE, JSON.stringify(allPlaces, null, 2), 'utf8');
console.log(`[Success] Written ${allPlaces.length} validated places into src/data/places.json across ${fileCount} sector files.`);
