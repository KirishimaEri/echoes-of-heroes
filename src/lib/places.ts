import placesData from '@/data/places.json';
import { HeroPlace, FilterState } from '@/types/place';
import { normalizeAll, isGeoReferenced, type LocatedPlace, type RawRecord } from '@/lib/normalize';
import {
  computeCoreStats,
  computeYearBounds,
  parseSacrificeDate,
  sacrificeSortKey,
  sortPlacesBySacrificeDate,
  type CoreStats,
} from '@/lib/stats';

/**
 * The read model: raw archive JSON (coerced once in lib/normalize) bound to the
 * dataset this site ships, plus the filters the toolbar drives.
 *
 * Normalisation, statistics and sort keys are re-exported from their pure modules
 * so call sites keep a single import path and `scripts/view_model.test.ts` can
 * exercise the same code over the real records without a bundler.
 */
export { isGeoReferenced } from '@/lib/normalize';
export type { LocatedPlace } from '@/lib/normalize';
export type { CoreStats } from '@/lib/stats';
export { parseSacrificeDate, sacrificeSortKey, sortPlacesBySacrificeDate };

export const places: HeroPlace[] = normalizeAll(placesData as RawRecord[]);

/** Records whose location is established — the only ones the map may plot. */
export function getGeoReferencedPlaces(data: HeroPlace[] = places): LocatedPlace[] {
  return data.filter(isGeoReferenced);
}

/** Records still awaiting a coordinate (经纬待考). */
export function getPlacesWithoutCoordinates(
  data: HeroPlace[] = places
): HeroPlace[] {
  return data.filter((p) => !isGeoReferenced(p));
}

/** The year span actually covered by the records that can be dated. */
export const YEAR_BOUNDS: [number, number] = computeYearBounds(places);

/** Single source of truth for the initial and reset filter state. */
export function createDefaultFilter(): FilterState {
  return {
    searchQuery: '',
    category: 'all',
    timeRange: [YEAR_BOUNDS[0], YEAR_BOUNDS[1]],
    selectedProvince: 'all',
    selectedForce: 'all',
  };
}

export function getAllPlaces(): HeroPlace[] {
  return places;
}

export function getPlaceById(id: string): HeroPlace | undefined {
  return places.find((p) => p.id === id);
}

export function getProvinces(): string[] {
  const provinces = new Set<string>();
  places.forEach((p) => {
    p.province.split('/').forEach((prov) => {
      const name = prov.trim();
      if (name) provinces.add(name);
    });
  });
  return Array.from(provinces).sort();
}

export function getAllForces(): string[] {
  const forces = new Set(places.map((p) => p.hero.force).filter(Boolean));
  return Array.from(forces).sort();
}

export function getCoreStats(data: HeroPlace[] = places): CoreStats {
  return computeCoreStats(data);
}

const text = (v: unknown): string =>
  typeof v === 'string' ? v.trim() : v == null ? '' : String(v);

export function filterPlaces(
  items: HeroPlace[],
  filter: FilterState
): HeroPlace[] {
  return items.filter((item) => {
    // 搜索匹配：地名、原名、省份、市、英雄姓名、战役、头衔、阵营、事迹
    if (filter.searchQuery.trim()) {
      const q = filter.searchQuery.trim().toLowerCase();
      const haystack = [
        item.hero.name,
        item.hero.battle,
        item.hero.title,
        item.hero.force,
        item.hero.story,
        item.modern_name,
        item.former_name,
        item.province,
        item.city,
      ]
        .map(text)
        .join('\n')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    // 类别筛选
    if (filter.category !== 'all') {
      if (filter.category === '乡镇与村落' || filter.category === '乡镇') {
        if (item.category !== '乡镇与村落' && item.category !== '乡镇') return false;
      } else if (item.category !== filter.category) {
        return false;
      }
    }

    // 省份筛选
    if (filter.selectedProvince && filter.selectedProvince !== 'all') {
      if (!item.province.includes(filter.selectedProvince)) return false;
    }

    // 部队阵营筛选
    if (filter.selectedForce && filter.selectedForce !== 'all') {
      if (item.hero.force !== filter.selectedForce) return false;
    }

    // 牺牲年份筛选 — undated records stay visible rather than vanishing.
    const deathYear = item.hero.death_year;
    if (deathYear !== null) {
      if (deathYear < filter.timeRange[0] || deathYear > filter.timeRange[1]) {
        return false;
      }
    }

    return true;
  });
}
