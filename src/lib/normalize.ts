import type { GeoPoint, HeroPlace, PlaceCategory } from '@/types/place';

/**
 * The one place raw archive JSON becomes a `HeroPlace`.
 *
 * Records arrive from scripts/data/sector*.json via places.json, and a record is
 * allowed to be incomplete: `coordinates: null` means "location not yet
 * established", a null `death_year` means "the 方志 dates it only to 抗战期间".
 * Components must never have to defend against that themselves — every crash this
 * module prevents was a real one, where a missing field reached `.toFixed()` or
 * `Math.min()` and took down a whole view.
 *
 * Kept free of any runtime import so `scripts/view_model.test.ts` can exercise the
 * real dataset under plain `node --test` (type-only imports are erased).
 */
export type RawRecord = {
  id?: unknown;
  modern_name?: unknown;
  former_name?: unknown;
  category?: unknown;
  province?: unknown;
  city?: unknown;
  coordinates?: unknown;
  renamed_year?: unknown;
  modern_status?: unknown;
  sources?: unknown;
  coordinate_source?: unknown;
  coordinate_note?: unknown;
  hero?: {
    name?: unknown;
    birth_year?: unknown;
    death_year?: unknown;
    sacrifice_age?: unknown;
    title?: unknown;
    force?: unknown;
    sacrifice_date?: unknown;
    battle?: unknown;
    story?: unknown;
  };
};

const str = (v: unknown): string =>
  typeof v === 'string' ? v.trim() : v == null ? '' : String(v);

/** A calendar year, or null. Rejects `null`, `""`, `"—"`, `0` and NaN. */
export function toYear(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) && v >= 1000 ? v : null;
  if (typeof v !== 'string') return null;
  const m = v.match(/(\d{4})/);
  if (!m) return null;
  const y = parseInt(m[1], 10);
  return y >= 1000 ? y : null;
}

/** An age in years, or null. */
export function toAge(v: unknown): number | null {
  const n = typeof v === 'number' ? v : parseFloat(str(v));
  return Number.isFinite(n) && n > 0 && n < 120 ? Math.round(n) : null;
}

/**
 * China's bounding box. A pair outside it (or `[]`, or `[0, 0]`) is treated as
 * "not established" rather than plotted at a wrong location — for a memorial map,
 * a misplaced marker is worse than a missing one. This also catches the axis-order
 * trap the archive has stepped in before: `places.json` stores [lng, lat], while
 * `thematics.ts` and `wuhanSpecial.ts` store [lat, lng].
 */
export function toGeoPoint(v: unknown): GeoPoint | null {
  if (!Array.isArray(v) || v.length < 2) return null;
  const lng = typeof v[0] === 'number' ? v[0] : parseFloat(str(v[0]));
  const lat = typeof v[1] === 'number' ? v[1] : parseFloat(str(v[1]));
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  if (lng < 73 || lng > 136 || lat < 3 || lat > 54) return null;
  return [lng, lat];
}

const KNOWN_CATEGORIES: readonly PlaceCategory[] = [
  '县市',
  '街道',
  '乡镇与村落',
  '历史曾用县名',
  '乡镇',
];

/** Unknown category strings fall back to the archive's largest bucket. */
export function heroCategory(v: unknown): PlaceCategory {
  const s = str(v);
  return (KNOWN_CATEGORIES as readonly string[]).includes(s)
    ? (s as PlaceCategory)
    : '乡镇与村落';
}

export function normalizePlace(raw: RawRecord): HeroPlace {
  const hero = raw.hero || {};
  return {
    id: str(raw.id),
    modern_name: str(raw.modern_name),
    former_name: str(raw.former_name),
    category: heroCategory(raw.category),
    province: str(raw.province),
    city: str(raw.city),
    coordinates: toGeoPoint(raw.coordinates),
    renamed_year: toYear(raw.renamed_year) ?? (str(raw.renamed_year) || null),
    modern_status: str(raw.modern_status),
    sources: Array.isArray(raw.sources) ? raw.sources.map(str).filter(Boolean) : [],
    coordinate_source: str(raw.coordinate_source) || undefined,
    coordinate_note: str(raw.coordinate_note) || undefined,
    hero: {
      name: str(hero.name),
      birth_year: toYear(hero.birth_year),
      death_year: toYear(hero.death_year),
      sacrifice_age: toAge(hero.sacrifice_age),
      title: str(hero.title),
      force: str(hero.force),
      sacrifice_date: str(hero.sacrifice_date) || null,
      battle: str(hero.battle),
      story: str(hero.story),
    },
  };
}

export function normalizeAll(raw: unknown): HeroPlace[] {
  return Array.isArray(raw) ? (raw as RawRecord[]).map(normalizePlace) : [];
}

/** A record whose location is established — the only kind safe to plot. */
export type LocatedPlace = HeroPlace & { coordinates: GeoPoint };

export function isGeoReferenced(p: HeroPlace): p is LocatedPlace {
  return p.coordinates !== null;
}
