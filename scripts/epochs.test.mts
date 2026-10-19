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
const places: Array<{ id: string; hero: { name: string; death_year: number } }> =
  JSON.parse(
    readFileSync(join(here, '../src/data/places.json'), 'utf8')
  ) as unknown as Array<{
    id: string;
    hero: { name: string; death_year: number };
  }>;

test('every place in places.json falls into at least one timeline epoch', () => {
  const orphans = places.filter(
    (p) => !EPOCHS.some((epoch) => epoch.yearMatch(p.hero.death_year))
  );
  assert.deepEqual(
    orphans.map((p) => `${p.id} (${p.hero.death_year})`),
    [],
    'records whose death_year matches no epoch are silently hidden from the timeline'
  );
});

test('regression: 1925 (顾正红 / jiangsu-zhenghong-town) is covered by an epoch', () => {
  const record = places.find((p) => p.id === 'jiangsu-zhenghong-town');
  assert.ok(record, 'record must exist in places.json');
  assert.equal(record.hero.death_year, 1925);
  const covering = EPOCHS.filter((e) => e.yearMatch(record.hero.death_year));
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
