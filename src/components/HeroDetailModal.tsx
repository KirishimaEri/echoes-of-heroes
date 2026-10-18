'use client';

import React from 'react';
import { HeroPlace } from '@/types/place';
import {
  X,
  Shield,
  Award,
  Scroll,
  Landmark,
  Compass,
  BookOpen,
} from 'lucide-react';

interface HeroDetailModalProps {
  place: HeroPlace | null;
  onClose: () => void;
  onFocusMap: (place: HeroPlace) => void;
}

export const HeroDetailModal: React.FC<HeroDetailModalProps> = ({
  place,
  onClose,
  onFocusMap,
}) => {
  if (!place) return null;

  const { hero } = place;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-paper-2 border border-cinnabar/50 rounded-lg shadow-2xl flex flex-col overflow-hidden text-ink"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Border */}
        <div className="h-1.5 bg-gradient-to-r from-cinnabar via-cinnabar to-cinnabar" />

        {/* Modal Header */}
        <div className="p-5 md:p-6 border-b border-line flex items-start justify-between bg-paper/60">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 rounded text-xs border border-cinnabar text-cinnabar bg-cinnabar/15 font-mono">
                {place.category}
              </span>
              <span className="text-xs text-ink-3">
                {place.province} · {place.city}
              </span>
            </div>

            <div className="flex items-baseline gap-3 pt-1">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-ink tracking-wider">
                {place.modern_name}
              </h2>
              <span className="text-sm text-ink-2">
                (更迭前原名:{' '}
                <span className="text-cinnabar font-medium font-serif">
                  {place.former_name}
                </span>
                )
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-ink-3 hover:text-ink hover:bg-line transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-6 text-sm leading-relaxed">
          {/* Hero Profile Header Card */}
          <div className="bg-paper border border-line rounded-md p-4 md:p-5 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-radial from-cinnabar/10 to-transparent pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-line">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl md:text-2xl font-serif font-bold text-ink tracking-widest">
                    {hero.name}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-cinnabar/15 text-cinnabar border border-cinnabar/30">
                    {hero.force}
                  </span>
                </div>
                <p className="text-xs text-ink-2 mt-1 font-serif">
                  {hero.title}
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="bg-paper-2 border border-line px-3 py-1.5 rounded">
                  <span className="text-ink-3 block">生卒纪年</span>
                  <span className="font-mono text-cinnabar font-medium">
                    {hero.birth_year} – {hero.death_year}
                  </span>
                </div>
                <div className="bg-paper-2 border border-line px-3 py-1.5 rounded">
                  <span className="text-ink-3 block">殉国时年</span>
                  <span className="font-mono text-cinnabar font-medium">
                    {hero.sacrifice_age} 岁
                  </span>
                </div>
              </div>
            </div>

            {/* Battle & Military Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 text-xs">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-cinnabar shrink-0 mt-0.5" />
                <div>
                  <span className="text-ink-3">殉国战役与时间:</span>
                  <div className="text-ink font-medium mt-0.5">
                    {hero.sacrifice_date} · {hero.battle}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Award className="w-4 h-4 text-cinnabar shrink-0 mt-0.5" />
                <div>
                  <span className="text-ink-3">更名与命名年份:</span>
                  <div className="text-ink font-medium mt-0.5">
                    {place.renamed_year} 年正式命名更名
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Biography / Story Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-serif text-cinnabar tracking-wider uppercase">
              <Scroll className="w-4 h-4" />
              <span>英烈生平档案与壮烈事迹</span>
            </div>
            <div className="bg-paper p-4 rounded-md border border-line text-xs md:text-sm text-ink-2 leading-relaxed whitespace-pre-line">
              {hero.story}
            </div>
          </div>

          {/* Modern Status Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-serif text-cinnabar tracking-wider uppercase">
              <Landmark className="w-4 h-4" />
              <span>今日山河风貌</span>
            </div>
            <div className="bg-paper p-4 rounded-md border border-line text-xs md:text-sm text-ink-2 leading-relaxed">
              <p>{place.modern_status}</p>
            </div>
          </div>

          {/* Sources Section */}
          {place.sources && place.sources.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-serif text-cinnabar tracking-wider uppercase">
                <BookOpen className="w-4 h-4" />
                <span>权威史料著录出处</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {place.sources.map((src, index) => (
                  <div
                    key={index}
                    className="p-2.5 rounded bg-paper border border-line text-xs text-ink-2 flex items-center gap-2 font-serif"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-cinnabar shrink-0" />
                    <span>{src}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-line bg-paper/80 flex items-center justify-between gap-3">
          <div className="text-xs text-ink-3">
            空间地理坐标 (经度, 纬度):{' '}
            <span className="font-mono text-ink-2">
              {place.coordinates[0].toFixed(4)}°E,{' '}
              {place.coordinates[1].toFixed(4)}°N
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onFocusMap(place);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-cinnabar hover:bg-cinnabar text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>在地图上定位此地标</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-paper-3 hover:bg-line text-ink text-xs transition-colors cursor-pointer"
            >
              关闭档案
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
