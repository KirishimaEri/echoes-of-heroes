'use client';

import React from 'react';
import { HeroPlace } from '@/types/place';
import { formatAge, formatRenamedYear } from '@/lib/format';

interface MonumentCardProps {
  place: HeroPlace;
  onClick: (place: HeroPlace) => void;
}

/**
 * 拓片条目：无圆角、无边框、无阴影的纸面分块。
 * hover = 纸面下陷 + 左侧落下 4px 朱砂竖笔；不发光、不变色、不漂浮。
 */
export const MonumentCard: React.FC<MonumentCardProps> = ({ place, onClick }) => {
  return (
    <div
      onClick={() => onClick(place)}
      className="group relative pl-5 pr-4 py-6 border-b border-dashed border-line hover:bg-paper-2 transition-colors duration-200 cursor-pointer"
    >
      {/* 落笔：左侧 4px 朱砂竖笔，hover 时落下 */}
      <div
        className="absolute left-0 top-6 bottom-6 w-[4px] bg-cinnabar scale-y-0 group-hover:scale-y-100 origin-top transition-transform duration-300"
        aria-hidden="true"
      />

      {/* 眉行：类别题签 + 行政位置 */}
      <div className="flex items-baseline justify-between gap-2 text-[11px] text-ink-3">
        <span className="font-serif tracking-[0.35em]">{place.category}</span>
        <span className="font-sans tracking-wide whitespace-nowrap">
          {place.province} · {place.city}
        </span>
      </div>

      {/* 碑文主体：今名（巨字）与旧称（朱砂删除线） */}
      <div className="mt-3">
        <h3 className="font-monument text-4xl sm:text-[42px] leading-tight text-ink group-hover:translate-y-[1px] transition-transform duration-200">
          {place.modern_name}
        </h3>
        <div className="mt-2 text-xs font-serif text-ink-3 flex items-baseline gap-1.5 flex-wrap">
          <span>旧称</span>
          <span className="line-through decoration-cinnabar decoration-1 text-sm text-ink-2 tracking-wide">
            {place.former_name}
          </span>
          <span className="text-ink-3 font-mono text-[11px]">
            （{formatRenamedYear(place.renamed_year)}）
          </span>
        </div>
      </div>

      {/* 底行：英烈名讳 + 殉国年龄（虚线界格已由卡底线承担） */}
      <div className="mt-5 pt-4 flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-lg font-serif font-bold text-ink group-hover:text-cinnabar transition-colors truncate">
            {place.hero.name}
          </span>
          <span className="shrink-0 text-[11px] font-serif text-cinnabar tracking-wider">
            殉国时 {formatAge(place.hero.sacrifice_age)}
          </span>
        </div>
        <span className="shrink-0 text-xs font-serif text-ink-3 group-hover:text-cinnabar transition-colors tracking-wider">
          查阅古今档案 →
        </span>
      </div>
    </div>
  );
};
