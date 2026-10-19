/**
 * View-model tests over the real dataset.
 *
 * These exist because the 294-record expansion broke two views with no type error
 * and no build failure: 194 records carried `coordinates: []` and four carried
 * `sacrifice_date: null`. The map crashed inside Leaflet on an undefined LatLng and
 * the chronology crashed in `dateStr.match()`. Both were reachable only by clicking
 * a tab, so nothing caught them before deploy.
 *
 * What this file asserts instead: for the records that actually ship, normalisation,
 * chronology bucketing, spatial clustering and the headline statistics each either
 * work or degrade to 待考 — never throw, never silently lose a record.
 *
 * Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { normalizeAll, isGeoReferenced } from '../src/lib/normalize.ts';
import { computeClusters, assertPlottable } from '../src/lib/clustering.ts';
import { partitionByChronology, isUndated } from '../src/lib/chrono.ts';
import {
  computeCoreStats,
  computeYearBounds,
  sortPlacesBySacrificeDate,
  sacrificeSortKey,
} from '../src/lib/stats.ts';
import { EPOCHS } from '../src/data/epochs.ts';

const here = dirname(fileURLToPath(import.meta.url));
const places = normalizeAll(
  JSON.parse(readFileSync(join(here, '../src/data/places.json'), 'utf8'))
);

test('dataset loads and every record keeps its identity', () => {
  assert.ok(places.length > 100, `expected the full archive, got ${places.length}`);
  assert.equal(new Set(places.map((p) => p.id)).size, places.length, 'ids must be unique');
  assert.ok(
    places.every((p) => p.id && p.modern_name && p.hero.name),
    'every record needs id, place name and hero name'
  );
});

test('coordinates are either null or a valid [lng, lat] pair, never []', () => {
  for (const p of places) {
    if (p.coordinates === null) continue;
    const [lng, lat] = p.coordinates;
    assert.ok(Number.isFinite(lng) && Number.isFinite(lat), `${p.id}: non-finite coordinate`);
    assert.ok(lng >= 73 && lng <= 136, `${p.id}: longitude ${lng} outside China`);
    assert.ok(lat >= 3 && lat <= 54, `${p.id}: latitude ${lat} outside China`);
    // Inside China longitude is always greater than latitude, so a pair that
    // violates this has had its axes swapped — the archive's recurring trap.
    assert.ok(lng > lat, `${p.id}: coordinates look like [lat, lng] — axes swapped`);
  }
});

test('chronology loses no record: buckets + 待考 band == everything', () => {
  const { buckets, undated } = partitionByChronology(places, EPOCHS);
  const inBuckets = buckets.reduce((n, b) => n + b.items.length, 0);
  assert.equal(inBuckets + undated.length, places.length, 'every record must appear exactly once');

  const seen = new Map<string, number>();
  [...buckets.flatMap((b) => b.items), ...undated].forEach((p) =>
    seen.set(p.id, (seen.get(p.id) || 0) + 1)
  );
  const duplicated = [...seen.entries()].filter(([, n]) => n > 1).map(([id]) => id);
  assert.deepEqual(duplicated, [], 'a record in two epochs renders the same card twice');

  // Only genuinely undatable records may sit in the 待考 band.
  const wrong = undated.filter(
    (p) => p.hero.death_year !== null && EPOCHS.some((e) => e.yearMatch(p.hero.death_year as number))
  );
  assert.deepEqual(wrong.map((p) => p.id), [], 'a datable record was parked in 年月待考');
});

test('clustering never produces an un-plottable marker, at any zoom', () => {
  const located = places.filter(isGeoReferenced).length;
  for (const zoom of [3, 4, 5, 6, 7, 8, 10, 12, 16]) {
    for (const enabled of [true, false]) {
      const clusters = computeClusters(places, zoom, enabled);
      const bad = assertPlottable(clusters);
      assert.deepEqual(bad, [], `zoom ${zoom} (clustered=${enabled}): un-plottable cluster`);

      const covered = new Set(clusters.flatMap((c) => c.places.map((p) => p.id)));
      assert.equal(
        covered.size,
        located,
        `zoom ${zoom}: cluster layer must hold exactly the geocoded records`
      );
      assert.ok(
        clusters.every((c) => c.places.every((p) => isGeoReferenced(p))),
        `zoom ${zoom}: a record without coordinates reached the map layer`
      );
    }
  }
});

test('headline statistics are honest about missing ages', () => {
  const stats = computeCoreStats(places);
  assert.equal(stats.totalCount, places.length);
  assert.equal(stats.geocodedCount + stats.unlocatedCount, places.length);
  assert.equal(stats.countyAndTownCount + stats.streetCount, places.length);

  if (stats.avgSacrificeAge !== null) {
    assert.ok(
      stats.avgSacrificeAge > 15 && stats.avgSacrificeAge < 60,
      `average sacrifice age ${stats.avgSacrificeAge} is not believable — missing ages counted as 0?`
    );
  }
  if (stats.minSacrificeAge !== null) {
    assert.ok(stats.minSacrificeAge > 0, 'youngest age must never be 0');
    assert.ok(stats.youngestHeroName, 'the youngest record must be named, not hardcoded in a view');
    assert.ok(
      stats.minSacrificeAge <= (stats.avgSacrificeAge ?? 0),
      'youngest age cannot exceed the average'
    );
  }
  assert.ok(!stats.dataSpan.includes('NaN'), `data span "${stats.dataSpan}" contains NaN`);
});

test('year bounds ignore undated records rather than collapsing to 0', () => {
  const [min, max] = computeYearBounds(places);
  assert.ok(min >= 1900 && min <= 1931, `earliest year ${min} should not precede the archive's range`);
  assert.ok(max >= 1945 && max <= 1950, `latest year ${max} looks wrong`);
  // The two deliberate outliers the project documents: 顾正红 1925, 李兆麟 1946.
  const zhenghong = places.find((p) => p.id === 'jiangsu-zhenghong-town');
  assert.equal(zhenghong?.hero.death_year, 1925, '顾正红 must stay inside the reported span');
  assert.ok(min <= 1925, `bounds ${min} would hide 顾正红 (1925)`);
});

test('sorting tolerates the records with no sacrifice date at all', () => {
  const undated = places.filter((p) => !p.hero.sacrifice_date);
  assert.ok(undated.length > 0, 'fixture expects at least one record without a date');
  const sorted = sortPlacesBySacrificeDate(places);
  assert.equal(sorted.length, places.length);
  for (let i = 1; i < sorted.length; i++) {
    assert.ok(
      sacrificeSortKey(sorted[i - 1]) <= sacrificeSortKey(sorted[i]),
      'sort must be monotonic'
    );
  }
  // Records with no date sink to the end instead of floating to the top as 0.
  const lastKey = sacrificeSortKey(sorted[sorted.length - 1]);
  assert.equal(lastKey, 99999999, 'dateless records belong at the end of the chronology');
});

test('the two records the 方志 cannot date are flagged, not dropped', () => {
  const homeless = places.filter((p) => isUndated(p, EPOCHS));
  assert.ok(homeless.length >= 1);
  homeless.forEach((p) => {
    assert.equal(
      p.hero.death_year,
      null,
      `${p.id} has a year yet falls outside every epoch — extend EPOCHS rather than hide it`
    );
  });
});
