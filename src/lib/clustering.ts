import type { HeroPlace } from '@/types/place';
// Explicit .ts specifier: scripts/view_model.test.ts loads this module through
// `node --test`, whose ESM resolver needs the exact filename. tsconfig already
// sets allowImportingTsExtensions + moduleResolution: bundler.
import { isGeoReferenced, type LocatedPlace } from './normalize.ts';

/**
 * Grid clustering for the 山河 map layer.
 *
 * Extracted from LeafletMap.tsx so it can be tested against the real dataset: the
 * failure it now guards against was a `coordinates: []` record reaching
 * `Math.round(undefined / step)`, which produced NaN grid keys, NaN cluster
 * centroids and then an "Invalid LatLng object" throw that blanked the entire map
 * view — while nothing in the type system complained, because the JSON was cast
 * straight to HeroPlace[].
 */
export interface PlaceCluster {
  id: string;
  isCluster: boolean;
  coordinates: [number, number]; // [lng, lat]
  places: HeroPlace[];
  count: number;
  primaryRegion: string;
  category: string;
}

/** Degrees per grid cell, by zoom level. */
function gridStep(zoom: number): number {
  if (zoom <= 4) return 2.8;
  if (zoom === 5) return 1.6;
  if (zoom === 6) return 0.95;
  return 0.55;
}

export function computeClusters(
  allPlaces: HeroPlace[],
  zoom: number,
  isEnabled: boolean
): PlaceCluster[] {
  // 经纬待考的条目不进入空间图层（名录与编年照常收录）
  const places = allPlaces.filter(isGeoReferenced);

  if (!isEnabled || zoom >= 8) {
    return places.map((p) => ({
      id: p.id,
      isCluster: false,
      coordinates: p.coordinates,
      places: [p],
      count: 1,
      primaryRegion: p.city || p.province,
      category: p.category,
    }));
  }

  const step = gridStep(zoom);
  const grid = new Map<string, LocatedPlace[]>();

  for (const place of places) {
    const [lng, lat] = place.coordinates;
    const key = `${Math.round(lng / step)}_${Math.round(lat / step)}`;
    const list = grid.get(key) || [];
    list.push(place);
    grid.set(key, list);
  }

  const result: PlaceCluster[] = [];

  grid.forEach((list, key) => {
    if (list.length === 1) {
      const p = list[0];
      result.push({
        id: p.id,
        isCluster: false,
        coordinates: p.coordinates,
        places: [p],
        count: 1,
        primaryRegion: p.city || p.province,
        category: p.category,
      });
      return;
    }

    const avgLng = list.reduce((acc, p) => acc + p.coordinates[0], 0) / list.length;
    const avgLat = list.reduce((acc, p) => acc + p.coordinates[1], 0) / list.length;

    const counts: Record<string, number> = {};
    list
      .map((p) => p.province.replace('省', '').replace('市', ''))
      .forEach((pr) => (counts[pr] = (counts[pr] || 0) + 1));
    const topProv = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];

    result.push({
      id: `cluster-${key}-${list.length}`,
      isCluster: true,
      coordinates: [avgLng, avgLat],
      places: list,
      count: list.length,
      primaryRegion: `${topProv}片区`,
      category: '群落',
    });
  });

  return result;
}

/** Every cluster must be plottable: finite numbers inside China's bbox. */
export function assertPlottable(clusters: PlaceCluster[]): string[] {
  const bad: string[] = [];
  for (const c of clusters) {
    const [lng, lat] = c.coordinates;
    if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng < 73 || lng > 136 || lat < 3 || lat > 54) {
      bad.push(`${c.id} → [${lng}, ${lat}]`);
    }
  }
  return bad;
}
