import placesData from '@/data/places.json';
import { HeroPlace, FilterState } from '@/types/place';

export const places: HeroPlace[] = placesData as HeroPlace[];

/**
 * The year span actually covered by the dataset, derived from the records.
 *
 * The project's theme is the fourteen-year war of resistance (1931–1945), but the
 * archive deliberately retains a few martyrs whose sacrifice falls just outside that
 * window while the *naming act* happened during the war — 顾正红 (1925, named by the
 * New Fourth Army in 1943) and 李兆麟 (1946). See KNOWN_ISSUES.md.
 *
 * Any year filter must use these bounds. Hardcoding 1931–1945 here silently drops
 * those records from every view while the headline still claims the full count.
 */
export const YEAR_BOUNDS: [number, number] = [
  Math.min(...places.map((p) => p.hero.death_year)),
  Math.max(...places.map((p) => p.hero.death_year)),
];

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

export interface CoreStats {
  totalCount: number;
  countyAndTownCount: number;
  streetCount: number;
  avgSacrificeAge: number;
  minSacrificeAge: number;
  youngestHeroName: string;
  /** Thematic span (fourteen-year war of resistance). */
  timeSpan: string;
  /** Actual span covered by the records — may exceed the thematic span. */
  dataSpan: string;
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
      provinces.add(prov.trim());
    });
  });
  return Array.from(provinces).sort();
}

export function getAllForces(): string[] {
  const forces = new Set(places.map((p) => p.hero.force));
  return Array.from(forces).sort();
}

export function getCoreStats(data: HeroPlace[] = places): CoreStats {
  const countyAndTown = data.filter(
    (p) =>
      p.category === '县市' ||
      p.category === '乡镇' ||
      p.category === '乡镇与村落' ||
      p.category === '历史曾用县名'
  );
  const streets = data.filter((p) => p.category === '街道');

  const totalAge = data.reduce((sum, p) => sum + p.hero.sacrifice_age, 0);
  const avgAge =
    data.length > 0 ? parseFloat((totalAge / data.length).toFixed(1)) : 0;

  let minAge = 999;
  let youngestHero = '';
  data.forEach((p) => {
    if (p.hero.sacrifice_age < minAge) {
      minAge = p.hero.sacrifice_age;
      // Name only — the age is rendered separately as `minSacrificeAge`.
      // Consumers must read this field instead of hardcoding a name: the
      // homepage used to assert 陈怀民 (age 22) while the real minimum is 20.
      youngestHero = p.hero.name;
    }
  });

  return {
    totalCount: data.length,
    countyAndTownCount: countyAndTown.length,
    streetCount: streets.length,
    avgSacrificeAge: avgAge,
    minSacrificeAge: minAge === 999 ? 0 : minAge,
    youngestHeroName: youngestHero,
    timeSpan: '1931–1945',
    dataSpan: `${YEAR_BOUNDS[0]}–${YEAR_BOUNDS[1]}`,
  };
}

export function parseSacrificeDate(dateStr: string): number {
  const match = dateStr.match(/(\d{4})年(?:(\d{1,2})月)?(?:(\d{1,2})日)?/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = match[2] ? parseInt(match[2], 10) : 1;
    const day = match[3] ? parseInt(match[3], 10) : 1;
    return year * 10000 + month * 100 + day;
  }
  return 0;
}

export function sortPlacesBySacrificeDate(items: HeroPlace[]): HeroPlace[] {
  return [...items].sort((a, b) => {
    return (
      parseSacrificeDate(a.hero.sacrifice_date) -
      parseSacrificeDate(b.hero.sacrifice_date)
    );
  });
}

export function filterPlaces(
  items: HeroPlace[],
  filter: FilterState
): HeroPlace[] {
  return items.filter((item) => {
    // 搜索匹配：地名、原名、省份、市、英雄姓名、战役、头衔、阵营、事迹
    if (filter.searchQuery.trim()) {
      const q = filter.searchQuery.trim().toLowerCase();
      const matchHero =
        item.hero.name.toLowerCase().includes(q) ||
        item.hero.battle.toLowerCase().includes(q) ||
        item.hero.title.toLowerCase().includes(q) ||
        item.hero.force.toLowerCase().includes(q) ||
        item.hero.story.toLowerCase().includes(q);

      const matchPlace =
        item.modern_name.toLowerCase().includes(q) ||
        item.former_name.toLowerCase().includes(q) ||
        item.province.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q);

      if (!matchHero && !matchPlace) return false;
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

    // 牺牲年份筛选
    const deathYear = item.hero.death_year;
    if (
      deathYear < filter.timeRange[0] ||
      deathYear > filter.timeRange[1]
    ) {
      return false;
    }

    return true;
  });
}
