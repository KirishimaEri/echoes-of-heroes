import type { HeroPlace } from '@/types/place';

/**
 * Bucketing for the 编年 view.
 *
 * Extracted from ChronologyTimeline.tsx because the original bug class here was
 * silent loss: `EPOCHS.filter(e => e.yearMatch(death_year))` drops any record whose
 * year matches no epoch, while the view header kept counting it. The archive now
 * states the rule explicitly — every record is either in exactly one epoch or in
 * the 年月待考 band, never in neither.
 */
export interface EpochLike {
  yearRange: string;
  yearMatch: (year: number) => boolean;
}

export interface ChronologyBucket<E> {
  /** The band's epoch. Records with no epoch at all come back as `undated`. */
  epoch: E;
  items: HeroPlace[];
}

/** True when the record cannot be dated at all. */
export function isUndated(p: HeroPlace, epochs: EpochLike[]): boolean {
  if (p.hero.death_year === null) return true;
  return !epochs.some((e) => e.yearMatch(p.hero.death_year as number));
}

/**
 * Splits records into one bucket per epoch plus a trailing 待考 band.
 * Guarantees `sum(bucket.items.length) === places.length`, which is what the
 * header count claims — see scripts/view_model.test.ts.
 */
export function partitionByChronology<E extends EpochLike>(
  places: HeroPlace[],
  epochs: E[]
): { buckets: ChronologyBucket<E>[]; undated: HeroPlace[] } {
  const buckets: ChronologyBucket<E>[] = epochs.map((epoch) => ({
    epoch,
    items: places.filter(
      (p) => p.hero.death_year !== null && epoch.yearMatch(p.hero.death_year as number)
    ),
  }));
  const undated = places.filter((p) => isUndated(p, epochs));
  return { buckets, undated };
}
