'use client';

import React from 'react';
import { HeroPlace } from '@/types/place';
import { MonumentCard } from './MonumentCard';
import { RotateCcw } from 'lucide-react';

interface MonumentGridProps {
  places: HeroPlace[];
  onSelectPlace: (place: HeroPlace) => void;
  onResetFilter?: () => void;
}

export const MonumentGrid: React.FC<MonumentGridProps> = ({
  places,
  onSelectPlace,
  onResetFilter,
}) => {
  if (places.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center p-6 max-w-xl mx-auto my-8 border-y border-line">
        <p className="epigraph-label">查无此碑</p>
        <p className="text-base font-serif text-ink mt-4">
          未检索到符合条件的英烈地名
        </p>
        <p className="text-xs text-ink-3 mt-1.5">
          请尝试调整搜索关键词、切换行政类型或选择全境各省
        </p>
        {onResetFilter && (
          <button
            onClick={onResetFilter}
            className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 bg-cinnabar hover:bg-cinnabar-dim text-paper text-xs font-serif tracking-wider transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>重置所有筛选条件</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-0 develop-stagger">
      {places.map((place) => (
        <MonumentCard key={place.id} place={place} onClick={onSelectPlace} />
      ))}
    </div>
  );
};
