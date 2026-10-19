/**
 * Regression tests for the timeline epoch coverage (AUDIT-REPORT-2.md R1).
 *
 * Bug being guarded against: `ChronologyTimeline` renders places by bucketing
 * them into EPOCHS via `yearMatch(death_year)`. A record whose death_year
 * falls into no epoch silently disappears from the timeline while the view
 * header still reports the full `filteredPlaces.length` — the exact failure
 * that hid 顾正红 (jiangsu-zhenghong-town, 1925) from the view.
 *
 * Run: npm test   (Node's built-in test runner, zero dependencies)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { EPOCHS } from '../src/data/epochs.ts';

const here = dirname(fileURLToPath(import.meta.url));
interface PlaceRecord {
  id: string;
  hero: { name: string; death_year: number | null; sacrifice_date: string | null };
}
const places: PlaceRecord[] = JSON.parse(
  readFileSync(join(here, '../src/data/places.json'), 'utf8')
) as unknown as PlaceRecord[];

/**
 * A record with no death year at all is legitimate (双徐村 and 杨蒋村 commemorate
 * martyrs the 方志 dates only to 「抗日战争期间」) — ChronologyTimeline lists those
 * under 年月待考 instead of dropping them. What must never happen is a record that
 * *does* have a year and matches no epoch: it disappears from the view while the
 * header still counts it.
 */
test('every dated place in places.json falls into exactly one timeline epoch', () => {
  const dated = places.filter((p) => p.hero.death_year !== null);
  assert.ok(
    dated.length > 0,
    'places.json must contain dated records — an empty filter would make this test vacuous'
  );
  const orphans = dated.filter((p) => {
    const hits = EPOCHS.filter((e) => e.yearMatch(p.hero.death_year as number));
    return hits.length !== 1;
  });
  assert.deepEqual(
    orphans.map((p) => `${p.id} (${p.hero.death_year})`),
    [],
    'records whose death_year matches no epoch (or several) are silently hidden or duplicated in the timeline'
  );
});

test('a record with no death_year must also have no sacrifice_date', () => {
  const misplaced = places.filter(
    (p) => p.hero.death_year === null && p.hero.sacrifice_date
  );
  assert.deepEqual(
    misplaced.map((p) => `${p.id} → ${p.hero.sacrifice_date}`),
    [],
    'a datable record is parked in the 年月待考 band; derive death_year from its sacrifice_date'
  );
});

test('regression: 1925 (顾正红 / jiangsu-zhenghong-town) is covered by an epoch', () => {
  const record = places.find((p) => p.id === 'jiangsu-zhenghong-town');
  assert.ok(record, 'record must exist in places.json');
  assert.equal(record.hero.death_year, 1925);
  const year = record.hero.death_year as number;
  const covering = EPOCHS.filter((e) => e.yearMatch(year));
  assert.equal(
    covering.length,
    1,
    'exactly one epoch must cover the pre-1931 record'
  );
});

test('epochs are ordered, non-overlapping, and yearMatch returns booleans', () => {
  const bounds = EPOCHS.map((e) => {
    const years: number[] = [];
    for (let y = 1900; y <= 2050; y++) {
      const hit = e.yearMatch(y);
      assert.equal(typeof hit, 'boolean', `${e.yearRange}.yearMatch must return a boolean`);
      if (hit) years.push(y);
    }
    assert.ok(years.length > 0, `${e.yearRange} must match at least one year`);
    return { range: e.yearRange, min: Math.min(...years), max: Math.max(...years) };
  });

  for (let i = 1; i < bounds.length; i++) {
    assert.ok(
      bounds[i].min > bounds[i - 1].max,
      `epochs must be ascending and non-overlapping: ${bounds[i - 1].range} ends ${bounds[i - 1].max}, ${bounds[i].range} starts ${bounds[i].min}`
    );
  }
});
