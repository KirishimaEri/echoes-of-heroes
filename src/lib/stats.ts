import type { HeroPlace } from '@/types/place';
import { isGeoReferenced } from './normalize.ts';

/**
 * Headline statistics and the date sort key, as pure functions over a record
 * array. They live here rather than in lib/places because lib/places binds the
 * JSON import, and a pure module can be exercised against the real dataset in a
 * plain `node --test` run (see scripts/view_model.test.ts).
 */

/**
 * The year span actually covered by the records that can be dated.
 *
 * The project's theme is the fourteen-year war of resistance (1931–1945), but the
 * archive deliberately retains a few martyrs whose sacrifice falls just outside that
 * window while the *naming act* happened during the war — 顾正红 (1925, named by the
 * New Fourth Army in 1943) and 李兆麟 (1946). See KNOWN_ISSUES.md.
 *
 * Any year filter must use these bounds. Hardcoding 1931–1945 silently drops those
 * records from every view while the headline still claims the full count. Nulls must
 * be excluded first: `Math.min(null)` coerces to 0 and once turned the chronology
 * header into "0–1946".
 */
export function computeYearBounds(data: HeroPlace[]): [number, number] {
  const years = data
    .map((p) => p.hero.death_year)
    .filter((y): y is number => typeof y === 'number');
  if (!years.length) return [1931, 1945];
  return [Math.min(...years), Math.max(...years)];
}

export interface CoreStats {
  totalCount: number;
  countyAndTownCount: number;
  streetCount: number;
  avgSacrificeAge: number | null;
  minSacrificeAge: number | null;
  youngestHeroName: string;
  /** Records whose sacrifice year is unrecorded, therefore shown under 年月待考. */
  undatedCount: number;
  /** Records with an established coordinate — what the map layer can actually draw. */
  geocodedCount: number;
  /** Records with no established coordinate. */
  unlocatedCount: number;
  /** Thematic span (fourteen-year war of resistance). */
  timeSpan: string;
  /** Actual span covered by the records — may exceed the thematic span. */
  dataSpan: string;
}

export function computeCoreStats(data: HeroPlace[]): CoreStats {
  const countyAndTown = data.filter(
    (p) =>
      p.category === '县市' ||
      p.category === '乡镇' ||
      p.category === '乡镇与村落' ||
      p.category === '历史曾用县名'
  );
  const streets = data.filter((p) => p.category === '街道');

  // Only records that actually carry an age feed the averages. Treating a missing
  // age as 0 dragged the headline average down and made 最年轻 report "0 岁".
  const aged = data.filter((p) => typeof p.hero.sacrifice_age === 'number');
  const avgAge = aged.length
    ? parseFloat(
        (
          aged.reduce((sum, p) => sum + (p.hero.sacrifice_age as number), 0) /
          aged.length
        ).toFixed(1)
      )
    : null;

  let youngest: HeroPlace | undefined;
  aged.forEach((p) => {
    const age = p.hero.sacrifice_age as number;
    if (!youngest || age < (youngest.hero.sacrifice_age as number)) youngest = p;
  });

  const bounds = computeYearBounds(data);

  return {
    totalCount: data.length,
    countyAndTownCount: countyAndTown.length,
    streetCount: streets.length,
    avgSacrificeAge: avgAge,
    minSacrificeAge: youngest ? (youngest.hero.sacrifice_age as number) : null,
    // Name only — the age is rendered separately as `minSacrificeAge`.
    // Consumers must read this field instead of hardcoding a name: the homepage
    // once asserted 陈怀民 (age 22) while the real minimum was 20.
    youngestHeroName: youngest ? youngest.hero.name : '',
    undatedCount: data.filter((p) => p.hero.death_year === null).length,
    geocodedCount: data.filter(isGeoReferenced).length,
    unlocatedCount: data.filter((p) => !isGeoReferenced(p)).length,
    timeSpan: '1931–1945',
    dataSpan: `${bounds[0]}–${bounds[1]}`,
  };
}

/** Parses "1940年5月24日" (month/day optional) into a sortable yyyymmdd integer. */
export function parseSacrificeDate(dateStr: string | null | undefined): number {
  const s = typeof dateStr === 'string' ? dateStr : '';
  const match = s.match(/(\d{4})年(?:(\d{1,2})月)?(?:(\d{1,2})日)?/);
  if (!match) return 0;
  const year = parseInt(match[1], 10);
  const month = match[2] ? parseInt(match[2], 10) : 1;
  const day = match[3] ? parseInt(match[3], 10) : 1;
  return year * 10000 + month * 100 + day;
}

/**
 * Sort key that never collapses unrecorded dates onto 0 — which used to float them
 * to the top of the chronology. Falls back to the death year, then to the end.
 */
export function sacrificeSortKey(p: HeroPlace): number {
  const parsed = parseSacrificeDate(p.hero.sacrifice_date);
  if (parsed) return parsed;
  if (typeof p.hero.death_year === 'number') return p.hero.death_year * 10000 + 101;
  return 99999999;
}

export function sortPlacesBySacrificeDate(items: HeroPlace[]): HeroPlace[] {
  return [...items].sort((a, b) => sacrificeSortKey(a) - sacrificeSortKey(b));
}
