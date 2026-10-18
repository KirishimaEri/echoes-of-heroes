'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { HeroPlace } from '@/types/place';
import { Compass } from 'lucide-react';

interface MapProps {
  places: HeroPlace[];
  selectedPlace: HeroPlace | null;
  onSelectPlace: (place: HeroPlace | null) => void;
  onOpenDetail?: (place: HeroPlace) => void;
  isWuhanSpecial?: boolean;
  onCloseWuhanSpecial?: () => void;
  onTriggerWuhanSpecial?: () => void;
  activeThematicId?: string | null;
  onSelectThematic?: (id: string | null) => void;
}

const DynamicLeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[450px] bg-paper flex flex-col items-center justify-center text-ink-3 border border-line">
      <Compass className="w-8 h-8 text-cinnabar animate-spin mb-3 duration-1000" />
      <span className="font-serif text-sm tracking-wider text-ink-2">
        山河地景测绘加载中...
      </span>
      <span className="text-xs text-ink-3 mt-1 font-mono">
        Loading Historical Geospatial Canvas
      </span>
    </div>
  ),
});

export const Map: React.FC<MapProps> = (props) => {
  return <DynamicLeafletMap {...props} />;
};

export default Map;
