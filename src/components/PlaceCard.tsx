'use client';

import React from 'react';
import { HeroPlace } from '@/types/place';
import {
  formatDeathYear,
  formatRenamedYear,
  formatSacrificeAgeLine,
} from '@/lib/format';
import { MapPin, ArrowRight } from 'lucide-react';

interface PlaceCardProps {
  place: HeroPlace;
  isSelected: boolean;
  onSelect: (place: HeroPlace) => void;
  onOpenDetail: (place: HeroPlace) => void;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  isSelected,
  onSelect,
  onOpenDetail,
}) => {
  const categoryStyles: Record<string, string> = {
    县市: 'border-cinnabar/60 text-cinnabar bg-cinnabar/10',
    乡镇: 'border-cinnabar/60 text-cinnabar bg-cinnabar/10',
    街道: 'border-ink-3/60 text-ink-2 bg-ink-3/10',
    历史曾用县名: 'border-cinnabar-dim/60 text-cinnabar bg-cinnabar-dim/15',
  };

  const badgeStyle = categoryStyles[place.category] || categoryStyles['县市'];

  return (
    <div
      onClick={() => onSelect(place)}
      className={`group relative p-4 rounded-md transition-all duration-200 cursor-pointer border ${
        isSelected
          ? 'bg-paper-3 border-cinnabar shadow-lg shadow-black/40 ring-1 ring-cinnabar/50'
          : 'bg-paper-2 border-line hover:border-cinnabar/40 hover:bg-paper-3'
      }`}
    >
      {/* Top indicator bar for active card */}
      {isSelected && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cinnabar via-cinnabar to-cinnabar rounded-t-md" />
      )}

      {/* Modern Place Title & Category Badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-serif font-bold text-ink tracking-wide group-hover:text-cinnabar transition-colors">
              {place.modern_name}
            </h3>
            <span
              className={`text-[11px] font-sans px-2 py-0.5 rounded border ${badgeStyle}`}
            >
              {place.category}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-ink-3 mt-0.5">
            <MapPin className="w-3 h-3 text-cinnabar" />
            <span>
              {place.province} · {place.city}
            </span>
            <span className="text-ink-3/50">|</span>
            <span className="text-ink-2">
              原名:{' '}
              <span className="line-through decoration-cinnabar/60">
                {place.former_name}
              </span>
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[11px] font-mono text-cinnabar block">
            {formatRenamedYear(place.renamed_year)}
          </span>
        </div>
      </div>

      {/* Hero Memorial Block */}
      <div className="mt-3 p-2.5 rounded bg-paper/70 border border-line space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-serif font-bold text-ink tracking-wider">
              {place.hero.name}
            </span>
            <span className="text-[11px] text-ink-3">
              {place.hero.force}
            </span>
          </div>
          <span className="text-[11px] font-mono text-cinnabar bg-cinnabar/10 px-1.5 py-0.5 rounded border border-cinnabar/30">
            {formatDeathYear(place.hero.death_year)}
          </span>
        </div>

        <div className="text-xs text-ink-2 leading-relaxed line-clamp-1">
          <span className="text-ink-3">战役: </span>
          {place.hero.battle}
        </div>

        <div className="text-[11px] text-ink-3 flex items-center justify-between pt-0.5 border-t border-line/40">
          <span className="truncate pr-2">{place.hero.title}</span>
          <span className="shrink-0">{formatSacrificeAgeLine(place.hero.sacrifice_age)}</span>
        </div>
      </div>

      {/* Modern Status Brief */}
      <div className="mt-2 text-[11px] text-ink-3 line-clamp-1 font-sans">
        <span className="text-ink-2/60">今日风貌: </span>
        {place.modern_status}
      </div>

      {/* Bottom Footer: Sources count & Detail CTA */}
      <div className="mt-3 flex items-center justify-between pt-2 border-t border-line/50 text-xs">
        <div className="flex items-center gap-1 text-[10px] text-ink-3">
          <span>史料文献: {place.sources.length} 处权威著录</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(place);
          }}
          className="inline-flex items-center gap-1 text-[11px] text-cinnabar hover:text-cinnabar font-medium transition-colors cursor-pointer group-hover:translate-x-0.5"
        >
          <span>查看史料档案</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
