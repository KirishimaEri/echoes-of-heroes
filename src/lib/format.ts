import { GeoPoint } from '@/types/place';

/**
 * Display helpers for archive fields that may legitimately be unrecorded.
 *
 * The tone follows the 碑志 register used across the site: an unknown value reads
 * 「待考」 (pending verification) rather than 0, `undefined` or `null`. Every helper
 * here exists because a component once rendered a missing value as a number and
 * either crashed the view or printed a false fact on a memorial page.
 */
export const PENDING = '待考';

export function formatCoord(coords: GeoPoint | null, digits = 4): string {
  if (!coords) return `经纬度${PENDING}`;
  return `${coords[0].toFixed(digits)}°E，${coords[1].toFixed(digits)}°N`;
}

/** Renaming year: accepts 1946, "1946年", "1945年秋" or null. */
export function formatRenamedYear(y: number | string | null): string {
  if (y === null || y === '') return `更名${PENDING}`;
  const s = String(y);
  return s.includes('年') ? s : `${s}年`;
}

/** Bare year, no unit — for places where the surrounding text already says 年. */
export function yearOr(y: number | string | null, fallback = PENDING): string {
  if (y === null || y === '') return fallback;
  return String(y).replace(/年$/, '');
}

/** "37岁" or 待考. Never "0岁" or "null岁". */
export function formatAge(age: number | null, withUnit = true): string {
  if (age === null) return PENDING;
  return withUnit ? `${age} 岁` : String(age);
}

/** "1904—1940" style lifespan; a missing side renders as 待考. */
export function formatLifespan(
  birth: number | null,
  death: number | null
): string {
  return `${yearOr(birth)} — ${yearOr(death)}`;
}

/** Sacrifice date, tolerating records where only the year survives. */
export function formatDateOrYear(date: string | null, death: number | null): string {
  if (date) return date;
  if (death !== null) return `${death}年`;
  return `年月${PENDING}`;
}

/** "1940年殉国" / "殉国年月待考". */
export function formatDeathYear(death: number | null): string {
  return death === null ? '殉国年月待考' : `${death}年殉国`;
}

/** "16 岁殉国" / "殉国年岁待考". */
export function formatSacrificeAgeLine(age: number | null): string {
  return age === null ? '殉国年岁待考' : `${age} 岁殉国`;
}
