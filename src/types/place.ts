export type PlaceCategory = '县市' | '街道' | '乡镇与村落' | '历史曾用县名' | '乡镇';

export interface HeroInfo {
  name: string;
  birth_year: number;
  death_year: number;
  sacrifice_age: number;
  title: string;
  force: string; // 所属部队/阵营，如八路军、东北抗联、国民革命军第29军、中国空军等
  sacrifice_date: string;
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
  coordinates: [number, number]; // 经纬度元组 [lng, lat]
  renamed_year: number | string; // 更名年份
  hero: HeroInfo;
  modern_status: string; // 今日风貌简述
  sources: string[]; // 史料出处数组
}

export interface FilterState {
  searchQuery: string;
  category: 'all' | PlaceCategory;
  timeRange: [number, number]; // [startYear, endYear]
  selectedProvince: string;
  selectedForce: string;
}
