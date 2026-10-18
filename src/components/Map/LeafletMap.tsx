'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import { HeroPlace } from '@/types/place';
import {
  THEMATIC_SPECIALS,
  ThematicSpecial,
  ThematicFeatureRoad,
} from '@/data/thematics';
import { ThematicSpecialPanel } from './ThematicSpecialPanel';
import { MapSideDetailPanel } from './MapSideDetailPanel';
import {
  ArrowRight,
  Shield,
  Layers,
  Check,
  Scroll,
  Sparkles,
  Grid,
  ChevronDown,
} from 'lucide-react';

// Configure Leaflet assets
if (typeof window !== 'undefined') {
  L.Icon.Default.imagePath = '/images/';
}

// Base map sources.
//
// Only AutoNavi (高德) tiles are offered: they render China's national boundaries
// as officially mapped, and the project is published for a domestic audience.
// Do NOT add third-party tile services (OSM and similar) whose boundary depictions
// differ from official claims in the South China Sea / Tibet / Aksai Chin.
export type TileSourceKey = 'gaode_dark' | 'gaode_std';

interface TileProviderConfig {
  id: TileSourceKey;
  name: string;
  tag: string;
  url: string;
  subdomains: string[];
  maxZoom: number;
  attribution: string;
}

export const TILE_PROVIDERS: Record<TileSourceKey, TileProviderConfig> = {
  gaode_dark: {
    id: 'gaode_dark',
    name: '高德暗夜',
    tag: '极速暗色',
    url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
    subdomains: ['1', '2', '3', '4'],
    maxZoom: 18,
    attribution: '&copy; 高德地图 AutoNavi (暗夜模式)',
  },
  gaode_std: {
    id: 'gaode_std',
    name: '高德标准',
    tag: '清晰路网',
    url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=7&x={x}&y={y}&z={z}',
    subdomains: ['1', '2', '3', '4'],
    maxZoom: 18,
    attribution: '&copy; 高德地图 AutoNavi',
  },
};

interface LeafletMapProps {
  places: HeroPlace[];
  selectedPlace: HeroPlace | null;
  onSelectPlace: (place: HeroPlace | null) => void;
  onOpenDetail?: (place: HeroPlace) => void;
  isWuhanSpecial?: boolean;
  onCloseWuhanSpecial?: () => void;
  onTriggerWuhanSpecial?: () => void;
  activeThematicId?: string | null;
  onSelectThematic?: (thematicId: string | null) => void;
  center?: [number, number];
  zoom?: number;
}

// Controller component for camera flyTo on place selection or thematic activation
function MapViewController({
  selectedPlace,
  activeThematic,
  targetRoad,
  isSideDetailOpen,
  focusTrigger,
  onZoomChange,
}: {
  selectedPlace: HeroPlace | null;
  activeThematic?: ThematicSpecial | null;
  targetRoad?: ThematicFeatureRoad | null;
  isSideDetailOpen?: boolean;
  focusTrigger?: number;
  onZoomChange?: (zoom: number) => void;
}) {
  const map = useMap();
  const prevIdRef = useRef<string | null>(null);
  const prevThematicRef = useRef<string | null>(null);
  const prevTriggerRef = useRef<number>(0);

  // Monitor zoom level change
  useMapEvents({
    zoomend: () => {
      onZoomChange?.(map.getZoom());
    },
  });

  // Auto invalidate map size when side panel opens or closes
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 80);
    const t2 = setTimeout(() => map.invalidateSize(), 240);
    const t3 = setTimeout(() => map.invalidateSize(), 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [map, isSideDetailOpen]);

  // Initial mount and resize listeners
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 400);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  // Handle Thematic Special camera lock
  useEffect(() => {
    const thematicId = activeThematic?.id || null;
    if (thematicId && thematicId !== prevThematicRef.current) {
      prevThematicRef.current = thematicId;
      map.invalidateSize();
      map.flyTo(activeThematic!.center, activeThematic!.zoom, {
        duration: 1.6,
        easeLinearity: 0.2,
      });
    } else if (!thematicId && prevThematicRef.current) {
      prevThematicRef.current = null;
      map.invalidateSize();
      map.flyTo([36.5, 114.5], 5, {
        duration: 1.4,
      });
    }
  }, [activeThematic, map]);

  // Handle clicking individual road inside Thematic Special
  useEffect(() => {
    if (targetRoad) {
      const midPoint = targetRoad.path[1] || targetRoad.path[0];
      map.flyTo(midPoint, 15, { duration: 1.2 });
    }
  }, [targetRoad, map]);

  // Handle regular place selection camera flyTo
  useEffect(() => {
    if (!selectedPlace || activeThematic) return;

    if (prevIdRef.current !== selectedPlace.id) {
      prevIdRef.current = selectedPlace.id;
      const targetZoom = selectedPlace.category === '街道' ? 14 : 10;
      const latLng: [number, number] = [
        selectedPlace.coordinates[1],
        selectedPlace.coordinates[0],
      ];

      const timer = setTimeout(() => {
        map.invalidateSize();
        map.flyTo(latLng, targetZoom, {
          duration: 1.3,
          easeLinearity: 0.25,
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [selectedPlace, activeThematic, isSideDetailOpen, map]);

  // Handle explicit re-focus trigger (e.g. clicking 居中地图视角 button in drawer)
  useEffect(() => {
    if (focusTrigger && focusTrigger !== prevTriggerRef.current && selectedPlace) {
      prevTriggerRef.current = focusTrigger;
      map.stop();
      map.invalidateSize({ animate: false });
      const currentZoom = map.getZoom();
      const targetZoom =
        selectedPlace.category === '街道'
          ? Math.max(currentZoom, 14)
          : Math.max(currentZoom, 10);
      const latLng: [number, number] = [
        selectedPlace.coordinates[1],
        selectedPlace.coordinates[0],
      ];

      const currCenter = map.getCenter();
      const dist = map.distance(currCenter, latLng);

      // If already within 50 meters, provide a tactile zoom pulse bounce
      if (dist < 50) {
        map.setZoom(targetZoom + 1, { animate: true });
        setTimeout(() => {
          map.setZoom(targetZoom, { animate: true });
        }, 320);
      } else {
        map.flyTo(latLng, targetZoom, {
          duration: 1.1,
          easeLinearity: 0.25,
        });
      }
    }
  }, [focusTrigger, selectedPlace, map]);

  return null;
}

// Spatial clustering data structure
interface PlaceCluster {
  id: string;
  isCluster: boolean;
  coordinates: [number, number]; // [lng, lat]
  places: HeroPlace[];
  count: number;
  primaryRegion: string;
  category: string;
}

// Pure client-side Spatial Grid Clustering
function computeClusters(
  places: HeroPlace[],
  zoom: number,
  isEnabled: boolean
): PlaceCluster[] {
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

  // Grid step in degrees
  const step =
    zoom <= 4
      ? 2.8
      : zoom === 5
      ? 1.6
      : zoom === 6
      ? 0.95
      : 0.55;

  const grid = new Map<string, HeroPlace[]>();

  for (const place of places) {
    const [lng, lat] = place.coordinates;
    const gridX = Math.round(lng / step);
    const gridY = Math.round(lat / step);
    const key = `${gridX}_${gridY}`;
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
    } else {
      const avgLng =
        list.reduce((acc, p) => acc + p.coordinates[0], 0) / list.length;
      const avgLat =
        list.reduce((acc, p) => acc + p.coordinates[1], 0) / list.length;

      const provs = list.map((p) =>
        p.province.replace('省', '').replace('市', '')
      );
      const counts: Record<string, number> = {};
      provs.forEach((pr) => (counts[pr] = (counts[pr] || 0) + 1));
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
    }
  });

  return result;
}

// Custom Cluster Marker Icon
function createClusterMarkerIcon(cluster: PlaceCluster) {
  const count = cluster.count;
  const size = count >= 20 ? 46 : count >= 10 ? 40 : 34;

  const html = `
    <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <div class="marker-pulsing" style="position: absolute; inset: -4px; border-radius: 9999px; background: radial-gradient(circle, rgba(164, 50, 31, 0.5) 0%, rgba(164, 50, 31, 0.18) 70%, transparent 100%); pointer-events: none;"></div>
      <div style="width: ${size}px; height: ${size}px; border-radius: 9999px; background-color: #141210; border: 2px solid #a4321f; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(0,0,0,0.9), 0 0 10px rgba(164, 50, 31, 0.4); transition: transform 0.2s;">
        <span style="font-family: serif; font-weight: 900; font-size: ${
          count >= 10 ? '13px' : '12px'
        }; color: #ede8dc; line-height: 1;">${count}</span>
        <span style="font-size: 8px; font-family: serif; color: #c9bfa9; margin-top: 1px; letter-spacing: -0.5px;">处地名</span>
      </div>
      <div style="position: absolute; top: ${
        size + 2
      }px; white-space: nowrap; background-color: #141210; color: #ede8dc; font-family: serif; font-size: 10px; padding: 1px 5px; border-radius: 3px; border: 1px solid rgba(164, 50, 31, 0.55); box-shadow: 0 2px 6px rgba(0,0,0,0.9); pointer-events: none;">
        ${cluster.primaryRegion} · ${count}处
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-monument-cluster-marker',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Custom Marker Icon Generator: Star for County, Road Sign for Street, Landmark for Town
function createCustomMarkerIcon(place: HeroPlace, isSelected: boolean) {
  const isCounty = place.category === '县市' || place.category === '历史曾用县名';
  const isStreet = place.category === '街道';
  const isTown = place.category === '乡镇' || place.category === '乡镇与村落';

  const ringColor = isSelected
    ? '#a4321f'
    : isCounty
    ? '#a4321f'
    : isStreet
    ? '#a4321f'
    : '#a4321f';

  const bgColor = isSelected ? '#3d1510' : '#141210';
  const pulseClass = isSelected ? 'marker-pulsing' : '';
  const size = isSelected ? 38 : isCounty ? 34 : 30;

  // Icon SVG inside center
  let iconSvg = '';
  if (isCounty) {
    iconSvg = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#ede8dc" stroke="#a4321f" stroke-width="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    `;
  } else if (isStreet) {
    iconSvg = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ede8dc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect width="18" height="14" x="3" y="3" rx="2"/>
        <path d="M12 17v4"/>
        <path d="m8 10 4-4 4 4"/>
      </svg>
    `;
  } else {
    iconSvg = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ede8dc" stroke-width="2">
        <path d="M3 21h18"/>
        <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/>
        <path d="M9 9h1"/><path d="M14 9h1"/><path d="M9 13h1"/><path d="M14 13h1"/>
      </svg>
    `;
  }

  const html = `
    <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <div class="${pulseClass}" style="position: absolute; inset: 0; border-radius: 9999px; background-color: ${ringColor}; opacity: ${
    isSelected ? '0.5' : '0.2'
  }; pointer-events: none;"></div>
      <div style="width: ${size - 6}px; height: ${
    size - 6
  }px; border-radius: 9999px; background-color: ${bgColor}; border: 2px solid ${ringColor}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.8); transition: transform 0.2s;">
        ${iconSvg}
      </div>
      ${
        isSelected || isCounty || isTown
          ? `<div style="position: absolute; top: ${
              size + 2
            }px; white-space: nowrap; background-color: #141210; color: #ede8dc; font-family: serif; font-size: 11px; padding: 1px 6px; border-radius: 3px; border: 1px solid ${ringColor}; box-shadow: 0 2px 6px rgba(0,0,0,0.85); pointer-events: none;">
              ${place.modern_name}
            </div>`
          : ''
      }
    </div>
  `;

  return L.divIcon({
    className: 'custom-monument-marker',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
}

// Memory Icon Cache to eliminate garbage collection and DOM recreation on re-render
const monumentIconCache = new Map<string, L.DivIcon>();

function getCustomMarkerIcon(place: HeroPlace, isSelected: boolean): L.DivIcon {
  const key = `${place.id}_${place.category}_${isSelected ? '1' : '0'}`;
  let icon = monumentIconCache.get(key);
  if (!icon) {
    icon = createCustomMarkerIcon(place, isSelected);
    monumentIconCache.set(key, icon);
  }
  return icon;
}

const clusterIconCache = new Map<string, L.DivIcon>();

function getClusterMarkerIcon(cluster: PlaceCluster): L.DivIcon {
  const key = `${cluster.id}_${cluster.count}`;
  let icon = clusterIconCache.get(key);
  if (!icon) {
    icon = createClusterMarkerIcon(cluster);
    clusterIconCache.set(key, icon);
  }
  return icon;
}

// Region preset quick fly buttons & Thematic Switcher inside map (Top Right)
function RegionPresetNav({
  activeThematicId,
  onSelectThematic,
  isClusterEnabled,
  onToggleCluster,
}: {
  activeThematicId?: string | null;
  onSelectThematic?: (id: string | null) => void;
  isClusterEnabled: boolean;
  onToggleCluster: () => void;
}) {
  const map = useMap();
  const [isThematicMenuOpen, setIsThematicMenuOpen] = useState(false);

  const presets = [
    { name: '全国全境', center: [36.5, 114.5] as [number, number], zoom: 5 },
    { name: '东北黑土', center: [43.8, 127.2] as [number, number], zoom: 6 },
    { name: '京津冀鲁', center: [38.5, 116.5] as [number, number], zoom: 7 },
    { name: '太行风雷', center: [37.1, 113.4] as [number, number], zoom: 7 },
    { name: '江汉楚天', center: [30.6, 114.3] as [number, number], zoom: 7 },
    { name: '淞沪抗战', center: [31.3, 121.5] as [number, number], zoom: 8 },
  ];

  const thematics = Object.values(THEMATIC_SPECIALS);

  return (
    <div className="leaflet-top leaflet-right" style={{ zIndex: 1000 }}>
      <div className="leaflet-control flex flex-wrap items-center gap-1.5 bg-paper/95 p-1.5 border border-line m-2">
        <span className="text-[10px] text-ink-3 px-1 py-1 font-mono uppercase">
          战区:
        </span>
        {presets.map((p) => (
          <button
            key={p.name}
            onClick={() => {
              onSelectThematic?.(null);
              map.flyTo(p.center, p.zoom, { duration: 1.2 });
            }}
            className="text-[11px] px-2 py-0.5 bg-paper-2 hover:bg-cinnabar/20 text-ink-2 hover:text-ink border border-line hover:border-cinnabar transition-all cursor-pointer font-serif"
          >
            {p.name}
          </button>
        ))}

        {/* Thematic Micro-Views Dropdown Selector */}
        <div className="relative">
          <button
            onClick={() => setIsThematicMenuOpen(!isThematicMenuOpen)}
            className={`text-[11px] px-2.5 py-0.5 border transition-all cursor-pointer font-serif font-bold flex items-center gap-1 ${
              activeThematicId
                ? 'bg-cinnabar text-white border-cinnabar'
                : 'bg-cinnabar/20 hover:bg-cinnabar/40 text-cinnabar border-cinnabar/50'
            }`}
            title="选择抗战城市与战区微专题导览"
          >
            <Sparkles className="w-3 h-3 text-cinnabar" />
            <span>
              {activeThematicId
                ? THEMATIC_SPECIALS[activeThematicId]?.title || '微专题'
                : '★ 抗战微专题'}
            </span>
            <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
          </button>

          {isThematicMenuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-60 bg-paper border border-cinnabar/40 p-1.5 space-y-1 z-50">
              <div className="text-[10px] text-ink-3 px-2 py-1 font-mono border-b border-line">
                选择抗战空间规划微专题
              </div>
              {thematics.map((th) => {
                const isActive = activeThematicId === th.id;
                return (
                  <button
                    key={th.id}
                    onClick={() => {
                      onSelectThematic?.(th.id);
                      setIsThematicMenuOpen(false);
                    }}
                    className={`w-full text-left p-1.5 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-cinnabar/30 text-ink border border-cinnabar'
                        : 'text-ink-2 hover:bg-paper-2 hover:text-cinnabar'
                    }`}
                  >
                    <div className="font-serif font-bold text-xs flex items-center justify-between">
                      <span>{th.title}</span>
                      {isActive && <Check className="w-3 h-3 text-cinnabar" />}
                    </div>
                    <div className="text-[10px] text-ink-3 truncate">
                      {th.region}
                    </div>
                  </button>
                );
              })}

              {activeThematicId && (
                <button
                  onClick={() => {
                    onSelectThematic?.(null);
                    setIsThematicMenuOpen(false);
                  }}
                  className="w-full text-center py-1 text-[10px] text-ink-3 hover:text-ink border-t border-line mt-1 cursor-pointer"
                >
                  ✕ 退出专题，返回全景
                </button>
              )}
            </div>
          )}
        </div>

        {/* LOD / Clustering Toggle */}
        <button
          onClick={onToggleCluster}
          className={`text-[10px] px-2 py-0.5 border transition-all cursor-pointer font-serif flex items-center gap-1 ${
            isClusterEnabled
              ? 'bg-paper-2 text-cinnabar border-cinnabar/40'
              : 'bg-paper text-ink-3 border-line hover:text-ink-2'
          }`}
          title={
            isClusterEnabled
              ? '智能聚合已开启（小比例尺下合并重叠点）'
              : '已展开全部独立标记点'
          }
        >
          <Grid className="w-3 h-3" />
          <span>{isClusterEnabled ? '智能聚合' : '全量展开'}</span>
        </button>
      </div>
    </div>
  );
}

// Tile Layer Selector Component (Bottom Left)
function TileLayerSwitcher({
  currentSource,
  onSelectSource,
}: {
  currentSource: TileSourceKey;
  onSelectSource: (source: TileSourceKey) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="leaflet-bottom leaflet-left" style={{ zIndex: 1000 }}>
      <div className="leaflet-control m-2.5">
        <div className="relative">
          <div className="flex items-center gap-1 bg-paper/95 border border-line p-1">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-ink hover:text-cinnabar bg-paper-2 border border-line transition-colors cursor-pointer"
              title="切换底图源"
            >
              <Layers className="w-3.5 h-3.5 text-cinnabar" />
              <span className="font-serif">底图: {TILE_PROVIDERS[currentSource].name}</span>
              <span className="text-[10px] text-cinnabar font-mono px-1 bg-cinnabar/15">
                {TILE_PROVIDERS[currentSource].tag}
              </span>
            </button>
          </div>

          {isOpen && (
            <div className="absolute bottom-full left-0 mb-1.5 w-48 bg-paper border border-line p-1.5 space-y-1">
              <div className="text-[10px] text-ink-3 px-2 py-0.5 font-mono">
                选择底图图层源
              </div>
              {(Object.keys(TILE_PROVIDERS) as TileSourceKey[]).map((key) => {
                const prov = TILE_PROVIDERS[key];
                const isCurrent = currentSource === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      onSelectSource(key);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1.5 text-xs transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-cinnabar/30 text-ink border border-cinnabar/60'
                        : 'text-ink-2 hover:bg-paper-2 hover:text-ink'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-serif">{prov.name}</span>
                      <span className="text-[9px] text-ink-3 font-mono">
                        ({prov.tag})
                      </span>
                    </div>
                    {isCurrent && <Check className="w-3 h-3 text-cinnabar" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  places,
  selectedPlace,
  onSelectPlace,
  onOpenDetail,
  isWuhanSpecial = false,
  onCloseWuhanSpecial,
  activeThematicId: propActiveThematicId,
  onSelectThematic: propOnSelectThematic,
  center = [36.5, 114.5],
  zoom = 5,
}) => {
  const [internalThematicId, setInternalThematicId] = useState<string | null>(null);
  const activeThematicId =
    propActiveThematicId !== undefined
      ? propActiveThematicId
      : isWuhanSpecial
      ? 'wuhan'
      : internalThematicId;

  const handleSelectThematic = (id: string | null) => {
    if (propOnSelectThematic) {
      propOnSelectThematic(id);
    } else {
      setInternalThematicId(id);
      if (!id && onCloseWuhanSpecial) onCloseWuhanSpecial();
    }
  };

  const activeThematic = activeThematicId
    ? THEMATIC_SPECIALS[activeThematicId] || null
    : null;

  const [targetRoad, setTargetRoad] = useState<ThematicFeatureRoad | null>(null);
  const [tileSource, setTileSource] = useState<TileSourceKey>('gaode_dark');
  // Derived, not stored: guarantees the rendered <TileLayer> can never drift
  // from the source the switcher selected.
  const activeTile = TILE_PROVIDERS[tileSource];
  const [isSideDetailOpen, setIsSideDetailOpen] = useState<boolean>(false);
  const [focusTrigger, setFocusTrigger] = useState<number>(0);
  const [currentZoom, setCurrentZoom] = useState<number>(zoom);
  const [isClusterEnabled, setIsClusterEnabled] = useState<boolean>(true);

  // Store information from previous renders to avoid synchronous setState in effects (React 19 / ESLint compliant)
  const [prevSelectedPlace, setPrevSelectedPlace] = useState(selectedPlace);
  const [prevActiveThematic, setPrevActiveThematic] = useState(activeThematic);

  if (selectedPlace !== prevSelectedPlace) {
    setPrevSelectedPlace(selectedPlace);
    if (selectedPlace) {
      setIsSideDetailOpen(true);
    }
  }

  if (activeThematic !== prevActiveThematic) {
    setPrevActiveThematic(activeThematic);
    if (activeThematic) {
      setIsSideDetailOpen(false);
      setTargetRoad(null);
    }
  }

  // Compute spatial clusters based on current zoom
  const clusters = useMemo(() => {
    return computeClusters(places, currentZoom, isClusterEnabled);
  }, [places, currentZoom, isClusterEnabled]);

  return (
    <div className="relative w-full h-[720px] bg-stone overflow-hidden flex flex-col lg:flex-row">
      {/* ================= 1. LEFT COLUMN: 交互式地图画布 (Flex-1) ================= */}
      {/* z-0 建立层叠上下文：Leaflet 内部图层 z-index 200–1000 被限制在本框内，
          不会逃逸盖住 sticky 页头（z-30）与贡献弹窗（z-50）及后续正文。 */}
      <div className="flex-1 h-[370px] lg:h-full relative z-0 min-w-0 order-1">
        <MapContainer
          center={center}
          zoom={zoom}
          preferCanvas={true}
          scrollWheelZoom={true}
          className="w-full h-full"
          style={{ height: '100%', width: '100%', backgroundColor: '#141210' }}
        >
          <MapViewController
            selectedPlace={selectedPlace}
            activeThematic={activeThematic}
            targetRoad={targetRoad}
            isSideDetailOpen={isSideDetailOpen}
            focusTrigger={focusTrigger}
            onZoomChange={setCurrentZoom}
          />

          <RegionPresetNav
            activeThematicId={activeThematicId}
            onSelectThematic={handleSelectThematic}
            isClusterEnabled={isClusterEnabled}
            onToggleCluster={() => setIsClusterEnabled(!isClusterEnabled)}
          />

          <TileLayerSwitcher
            currentSource={tileSource}
            onSelectSource={setTileSource}
          />

          {/* Quick reopen button if side detail was closed while a place is still selected */}
          {!isSideDetailOpen && selectedPlace && !activeThematic && (
            <div
              className="leaflet-top leaflet-right"
              style={{ zIndex: 1000, marginTop: '54px' }}
            >
              <div className="leaflet-control m-2">
                <button
                  onClick={() => {
                    setIsSideDetailOpen(true);
                    setFocusTrigger((n) => n + 1);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cinnabar hover:bg-cinnabar text-white text-xs font-serif font-bold border border-cinnabar/60 cursor-pointer transition-all"
                  title="重新展开史料档案右侧栏"
                >
                  <Scroll className="w-3.5 h-3.5 text-cinnabar" />
                  <span>展开【{selectedPlace.modern_name}】史料档案 ➔</span>
                </button>
              </div>
            </div>
          )}

          {/* Selected Tile Layer with dynamic key for clean remount */}
          <TileLayer
            key={'tile-layer-' + tileSource}
            url={activeTile.url}
            subdomains={activeTile.subdomains}
            maxZoom={activeTile.maxZoom}
            keepBuffer={4}
            updateWhenZooming={false}
            attribution={activeTile.attribution}
          />

          {/* ================= ACTIVE THEMATIC SPECIAL OVERLAYS ================= */}
          {activeThematic && (
            <>
              {/* 1. Cross Axis (e.g. Shengli Street) */}
              {activeThematic.crossAxis && (
                <Polyline
                  positions={activeThematic.crossAxis.path}
                  pathOptions={{
                    color: activeThematic.crossAxis.color,
                    weight: 7,
                    opacity: 0.95,
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                >
                  <Tooltip permanent direction="top" className="custom-gold-tooltip">
                    <span className="font-serif font-bold text-xs text-paper bg-cinnabar px-2 py-0.5 border border-cinnabar">
                      ★ {activeThematic.crossAxis.name}
                    </span>
                  </Tooltip>
                </Polyline>
              )}

              {/* 2. Thematic Hero Roads & Landmarks */}
              {activeThematic.roads.map((road) => (
                <Polyline
                  key={road.id}
                  positions={road.path}
                  pathOptions={{
                    color: road.color,
                    weight: road.id === targetRoad?.id ? 7 : 5,
                    opacity: road.id === targetRoad?.id ? 1 : 0.85,
                    lineCap: 'round',
                    dashArray: road.id === targetRoad?.id ? undefined : '6, 6',
                  }}
                >
                  <Tooltip permanent direction="right" className="custom-red-tooltip">
                    <span className="font-serif font-bold text-[11px] text-paper bg-cinnabar px-2 py-0.5 border border-cinnabar/60">
                      {road.name} · {road.heroName}
                    </span>
                  </Tooltip>
                </Polyline>
              ))}
            </>
          )}

          {/* Render Spatial Clusters or Individual Markers */}
          {!activeThematic &&
            clusters.map((cluster) => {
              const clusterPos: [number, number] = [
                cluster.coordinates[1],
                cluster.coordinates[0],
              ];

              if (cluster.isCluster) {
                const clusterIcon = getClusterMarkerIcon(cluster);
                return (
                  <Marker
                    key={cluster.id}
                    position={clusterPos}
                    icon={clusterIcon}
                    eventHandlers={{
                      click: (e) => {
                        const mapInstance = e.target._map;
                        mapInstance.setView(
                          clusterPos,
                          Math.min(currentZoom + 2, 9),
                          { animate: true }
                        );
                      },
                    }}
                  />
                );
              }

              // Single Place Marker
              const place = cluster.places[0];
              const isSelected = selectedPlace?.id === place.id;
              const icon = getCustomMarkerIcon(place, isSelected);

              return (
                <Marker
                  key={place.id}
                  position={clusterPos}
                  icon={icon}
                  eventHandlers={{
                    click: () => {
                      onSelectPlace(place);
                      setIsSideDetailOpen(true);
                      setFocusTrigger((n) => n + 1);
                    },
                  }}
                >
                  <Popup className="custom-dark-popup">
                    <div className="p-2 space-y-2 text-ink min-w-[210px]">
                      <div className="border-b border-line pb-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-serif font-bold text-base text-ink">
                            {place.modern_name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 border border-cinnabar/40 text-cinnabar font-mono">
                            {place.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-ink-3">
                          原名: {place.former_name} · {place.renamed_year}年命更
                        </div>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-cinnabar font-medium">
                          <Shield className="w-3 h-3" />
                          <span>
                            英烈: {place.hero.name} ({place.hero.death_year}年殉国)
                          </span>
                        </div>
                        <div className="text-[11px] text-ink-3">
                          阵营: {place.hero.force}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPlace(place);
                          setIsSideDetailOpen(true);
                          setFocusTrigger((n) => n + 1);
                          if (onOpenDetail) onOpenDetail(place);
                        }}
                        className="w-full mt-2 py-1 px-2 bg-cinnabar/20 hover:bg-cinnabar/40 border border-cinnabar/50 text-xs text-ink flex items-center justify-center gap-1.5 transition-colors cursor-pointer font-serif"
                      >
                        <Scroll className="w-3 h-3 text-cinnabar" />
                        <span>在右侧展开史料档案</span>
                        <ArrowRight className="w-3 h-3 text-cinnabar" />
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
        </MapContainer>

        {/* Floating Thematic Narrative Panel (Supporting all 5 Themes) */}
        {activeThematic && (
          <ThematicSpecialPanel
            special={activeThematic}
            onClose={() => handleSelectThematic(null)}
            onFocusRoad={(road) => setTargetRoad(road)}
          />
        )}
      </div>

      {/* ================= 2. RIGHT COLUMN: 史料长卷侧边抽屉 (Left-Right Split) ================= */}
      {isSideDetailOpen && selectedPlace && !activeThematic && (
        <MapSideDetailPanel
          place={selectedPlace}
          onClose={() => {
            setIsSideDetailOpen(false);
            onSelectPlace(null);
          }}
          onFlyToPlace={(p) => {
            onSelectPlace(p);
            setFocusTrigger((n) => n + 1);
          }}
        />
      )}
    </div>
  );
};

export default LeafletMap;
