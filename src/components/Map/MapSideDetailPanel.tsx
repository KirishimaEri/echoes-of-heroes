'use client';

import React, { useState } from 'react';
import { HeroPlace } from '@/types/place';
import {
  formatCoord,
  formatLifespan,
  formatAge,
  formatDateOrYear,
  yearOr,
} from '@/lib/format';
import {
  X,
  Shield,
  Scroll,
  BookOpen,
  MapPin,
  Landmark,
  Compass,
  Sparkles,
  Focus,
  Check,
} from 'lucide-react';

interface MapSideDetailPanelProps {
  place: HeroPlace;
  onClose: () => void;
  onFlyToPlace: (place: HeroPlace) => void;
}

export const MapSideDetailPanel: React.FC<MapSideDetailPanelProps> = ({
  place,
  onClose,
  onFlyToPlace,
}) => {
  const [activeTab, setActiveTab] = useState<'hero' | 'modern' | 'all'>('hero');
  const [isFlyActive, setIsFlyActive] = useState<boolean>(false);
  const { hero } = place;
  const hasCoords = place.coordinates !== null;

  const handleCenterMap = () => {
    if (!hasCoords) return;
    setIsFlyActive(true);
    onFlyToPlace(place);
    setTimeout(() => {
      setIsFlyActive(false);
    }, 1500);
  };

  // ESC key to close
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <aside className="w-full lg:w-[480px] xl:w-[520px] h-[350px] lg:h-full bg-paper-2 border-t lg:border-t-0 lg:border-l border-line flex flex-col shrink-0 z-20 shadow-2xl overflow-hidden text-ink order-2">
      {/* Top Tri-Color Accent Line */}
      <div className="h-1 bg-gradient-to-r from-cinnabar via-cinnabar to-cinnabar shrink-0" />

      {/* Top Header Bar */}
      <div className="px-4 py-3 bg-paper border-b border-line flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-cinnabar animate-pulse shrink-0" />
          <h3 className="font-serif font-bold text-sm text-ink tracking-wider truncate">
            古今对话 · 史料档案
          </h3>
          <span className="text-[11px] font-mono text-cinnabar border border-cinnabar/40 bg-cinnabar/10 px-1.5 py-0.2 rounded shrink-0">
            {place.modern_name} · {place.category}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleCenterMap}
            disabled={!hasCoords}
            className={`p-1.5 rounded transition-all ${
              !hasCoords
                ? 'text-ink-3 opacity-50 cursor-not-allowed'
                : isFlyActive
                ? 'cursor-pointer text-emerald-400 bg-emerald-900/40 ring-1 ring-emerald-500/50'
                : 'cursor-pointer text-ink-3 hover:text-cinnabar hover:bg-paper-2'
            }`}
            title={hasCoords ? '地图视角聚焦此地' : '经纬待考，无法聚焦'}
          >
            {isFlyActive ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Focus className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-ink-3 hover:text-ink hover:bg-paper-2 transition-colors cursor-pointer"
            title="收起档案 (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="px-4 py-2 bg-paper-2 border-b border-line flex items-center justify-between gap-1 text-xs shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('hero')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all cursor-pointer font-serif ${
              activeTab === 'hero'
                ? 'bg-cinnabar text-white font-medium shadow-sm'
                : 'text-ink-2 hover:text-ink hover:bg-paper-2'
            }`}
          >
            <Scroll className="w-3.5 h-3.5 text-cinnabar" />
            <span>英烈丰碑</span>
          </button>

          <button
            onClick={() => setActiveTab('modern')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all cursor-pointer font-serif ${
              activeTab === 'modern'
                ? 'bg-cinnabar text-white font-medium shadow-sm'
                : 'text-ink-2 hover:text-ink hover:bg-paper-2'
            }`}
          >
            <Landmark className="w-3.5 h-3.5 text-cinnabar" />
            <span>今日山河</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-paper-3 text-ink border border-line'
                : 'text-ink-3 hover:text-ink-2'
            }`}
          >
            通读全部
          </button>
        </div>

        <div className="text-[11px] text-ink-3 font-mono hidden sm:block">
          {place.province} · {place.city}
        </div>
      </div>

      {/* Scrollable Archive Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs leading-relaxed">
        {/* ================= HERO MARTYR SECTION ================= */}
        {(activeTab === 'hero' || activeTab === 'all') && (
          <div className="p-4 rounded-lg bg-gradient-to-b from-cinnabar-wash to-paper-2 border border-cinnabar/40 space-y-4 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-cinnabar/30">
              <div className="flex items-center gap-2 text-xs font-serif text-cinnabar font-semibold tracking-wider">
                <Scroll className="w-3.5 h-3.5 text-cinnabar" />
                <span>【历史回响 · 英烈丰碑】</span>
              </div>
              <span className="text-[10px] font-mono text-ink-3">
                1931–1945 抗战史实
              </span>
            </div>

            {/* Hero Profile Info */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-baseline gap-2.5">
                <h4 className="text-2xl font-serif font-black tracking-widest text-ink">
                  {hero.name}
                </h4>
                <span className="text-xs px-2 py-0.5 rounded bg-cinnabar/20 text-cinnabar border border-cinnabar/40 font-serif">
                  {hero.force}
                </span>
              </div>

              <p className="text-xs text-ink-2 font-serif leading-relaxed">
                {hero.title}
              </p>

              {/* Vital Statistics */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="p-2 rounded bg-paper/90 border border-cinnabar/30">
                  <span className="text-[10px] text-ink-3 block">生卒纪年</span>
                  <span className="font-mono text-ink font-medium text-xs">
                    {formatLifespan(hero.birth_year, hero.death_year)}
                  </span>
                </div>

                <div className="p-2 rounded bg-cinnabar/15 border border-cinnabar/40">
                  <span className="text-[10px] text-cinnabar block">殉国时年</span>
                  <span className="font-mono text-cinnabar font-bold text-sm">
                    仅 {formatAge(hero.sacrifice_age)}
                  </span>
                </div>
              </div>
            </div>

            {/* Battle Context */}
            <div className="p-2.5 rounded bg-paper/80 border border-cinnabar/30 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-cinnabar font-medium text-[11px]">
                <Shield className="w-3 h-3" />
                <span>殉国战役与时间</span>
              </div>
              <div className="text-ink font-serif text-xs leading-relaxed">
                {formatDateOrYear(hero.sacrifice_date, hero.death_year)} · {hero.battle}
              </div>
            </div>

            {/* Martyr Story */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-serif text-cinnabar tracking-wider uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>壮烈事迹与历史档案</span>
              </div>
              <div className="p-3.5 rounded bg-paper/95 border border-line text-xs text-ink leading-relaxed whitespace-pre-line font-serif shadow-inner">
                {hero.story}
              </div>
            </div>

            {/* Sources Bibliography */}
            <div className="space-y-1.5 pt-2 border-t border-cinnabar/20">
              <div className="flex items-center gap-1 text-[11px] text-ink-3 font-serif">
                <BookOpen className="w-3 h-3 text-ink-3" />
                <span>权威史料著录出处:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {place.sources.map((src, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-serif px-2 py-0.5 rounded bg-paper text-ink-2 border border-line"
                  >
                    {src}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= MODERN LANDSCAPE SECTION ================= */}
        {(activeTab === 'modern' || activeTab === 'all') && (
          <div className="p-4 rounded-lg bg-gradient-to-b from-paper-2 to-paper-2 border border-cinnabar/40 space-y-4 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-cinnabar/30">
              <div className="flex items-center gap-2 text-xs font-serif text-cinnabar font-semibold tracking-wider">
                <Landmark className="w-3.5 h-3.5 text-cinnabar" />
                <span>【今日山河 · 岁月长歌】</span>
              </div>
              <span className="text-[10px] font-mono text-ink-3">
                现代行政与今日风貌
              </span>
            </div>

            {/* Place Title & Evolution */}
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <h4 className="text-2xl font-serif font-black tracking-wider text-ink">
                  {place.modern_name}
                </h4>
                <span className="text-xs px-2 py-0.5 rounded bg-cinnabar/20 text-cinnabar border border-cinnabar/40 font-mono">
                  {place.category}
                </span>
              </div>

              {/* Former Name Evolution */}
              <div className="text-xs text-ink-3 flex items-center gap-1.5 font-serif pt-0.5">
                <span>历史原名:</span>
                <span className="line-through decoration-cinnabar decoration-2 text-ink-2 font-bold text-sm">
                  {place.former_name}
                </span>
                <span>→</span>
                <span className="text-cinnabar font-bold text-sm">
                  {place.modern_name}
                </span>
              </div>

              {/* Renamed Year & Administrative Area */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="p-2 rounded bg-paper/90 border border-cinnabar/30">
                  <span className="text-[10px] text-ink-3 block">正式更名年份</span>
                  <span className="font-mono text-cinnabar font-bold text-sm">
                    {yearOr(place.renamed_year)} 年
                  </span>
                </div>

                <div className="p-2 rounded bg-paper/90 border border-cinnabar/30">
                  <span className="text-[10px] text-ink-3 block">行政管辖</span>
                  <span className="text-ink font-medium text-xs line-clamp-1">
                    {place.province} · {place.city}
                  </span>
                </div>
              </div>
            </div>

            {/* Coordinates */}
            <div className="p-2.5 rounded bg-paper/80 border border-cinnabar/30 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-cinnabar font-medium text-[11px]">
                <MapPin className="w-3 h-3" />
                <span>地理坐标 (经度, 纬度)</span>
              </div>
              <div className="font-mono text-ink text-xs">
                {formatCoord(place.coordinates)}
              </div>
              {place.coordinate_note && (
                <p className="text-[10px] text-ink-3 font-sans leading-relaxed">
                  {place.coordinate_note}
                </p>
              )}
            </div>

            {/* Modern Status */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-serif text-cinnabar tracking-wider uppercase flex items-center gap-1">
                <Compass className="w-3 h-3" />
                <span>今日风貌与生生不息</span>
              </div>
              <div className="p-3.5 rounded bg-paper/95 border border-line text-xs text-ink-2 leading-relaxed font-sans shadow-inner">
                {place.modern_status}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="px-4 py-2.5 border-t border-line bg-paper flex items-center justify-between text-xs shrink-0">
        <button
          onClick={handleCenterMap}
          disabled={!hasCoords}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded font-serif text-xs transition-all shadow-md ${
            !hasCoords
              ? 'bg-paper-3 text-ink-3 border border-line cursor-not-allowed'
              : `cursor-pointer ${
                  isFlyActive
                    ? 'bg-emerald-700 text-white ring-2 ring-emerald-400/50'
                    : 'bg-cinnabar hover:bg-cinnabar text-white'
                }`
          }`}
        >
          {!hasCoords ? (
            <>
              <MapPin className="w-3.5 h-3.5" />
              <span>经纬待考，无法居中</span>
            </>
          ) : isFlyActive ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-200" />
              <span>已锁定居中视角</span>
            </>
          ) : (
            <>
              <Focus className="w-3.5 h-3.5" />
              <span>居中地图视角</span>
            </>
          )}
        </button>

        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded bg-paper-2 hover:bg-paper-3 text-ink-2 hover:text-ink border border-line transition-colors cursor-pointer font-serif"
        >
          收起史料档案
        </button>
      </div>
    </aside>
  );
};

export default MapSideDetailPanel;
