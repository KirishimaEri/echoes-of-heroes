export type PlaceCategory = '县市' | '街道' | '乡镇与村落' | '历史曾用县名' | '乡镇';

/** [lng, lat] — the axis order used by `places.json` (note: `thematics.ts` reverses it). */
export type GeoPoint = [number, number];

export interface HeroInfo {
  name: string;
  /** Null when the archive records no birth year. */
  birth_year: number | null;
  /** Null when the source gives no year at all; such records cannot join the chronology. */
  death_year: number | null;
  /** Null when unrecorded. Never fabricated. */
  sacrifice_age: number | null;
  title: string;
  force: string; // 所属部队/阵营，如八路军、东北抗联、国民革命军第29军、中国空军等
  /** Free-form 中文纪年，e.g. "1940年5月24日". Null when unrecorded. */
  sacrifice_date: string | null;
  battle: string;
  story: string;
}

export interface HeroPlace {
  id: string;
  modern_name: string; // 今名
  former_name: string; // 原名
  category: PlaceCategory; // '县市' | '街道' | '乡镇' | '历史曾用县名'
  province: string;
  city: string;
  /**
   * Null when the coordinate has not been established from a reliable source.
   * Records without coordinates still appear in the name book and the
   * chronology; they are simply never plotted — see `isGeoReferenced`.
   */
  coordinates: GeoPoint | null;
  renamed_year: number | string | null; // 更名年份
  hero: HeroInfo;
  modern_status: string; // 今日风貌简述
  sources: string[]; // 史料出处数组
  /** How the coordinate was established, retained for auditability. */
  coordinate_source?: string;
  /** Provenance note, e.g. "高德地理编码 · 按今名与所属县市双重校验". */
  coordinate_note?: string;
}

export interface FilterState {
  searchQuery: string;
  category: 'all' | PlaceCategory;
  timeRange: [number, number]; // [startYear, endYear]
  selectedProvince: string;
  selectedForce: string;
}
