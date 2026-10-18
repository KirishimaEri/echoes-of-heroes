'use client';

import React, { useState } from 'react';
import { ThematicSpecial, ThematicFeatureRoad } from '@/data/thematics';
import { Sparkles, X, Award, MapPin, ChevronRight, Shield } from 'lucide-react';

interface ThematicSpecialPanelProps {
  special: ThematicSpecial;
  onClose: () => void;
  onFocusRoad?: (road: ThematicFeatureRoad) => void;
}

export const ThematicSpecialPanel: React.FC<ThematicSpecialPanelProps> = ({
  special,
  onClose,
  onFocusRoad,
}) => {
  const [selectedRoadId, setSelectedRoadId] = useState<string>(
    special.roads[0]?.id || ''
  );

  const activeRoad =
    special.roads.find((r) => r.id === selectedRoadId) || special.roads[0];

  return (
    <div className="absolute left-3 bottom-3 sm:left-4 sm:bottom-4 z-[1000] w-[calc(100%-24px)] sm:w-[440px] max-h-[85vh] bg-paper-2/95 backdrop-blur-md border border-cinnabar/60 rounded-lg shadow-2xl overflow-hidden flex flex-col text-ink">
      {/* Top Accent Gradient Bar */}
      <div
        className="h-1 bg-gradient-to-r from-cinnabar via-cinnabar to-cinnabar"
        style={{
          background: `linear-gradient(to right, #a4321f, ${special.accentColor}, #a4321f)`,
        }}
      />

      {/* Header */}
      <div className="p-3.5 sm:p-4 border-b border-line flex items-start justify-between bg-paper/70">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cinnabar/20 text-cinnabar border border-cinnabar/40">
              {special.badge}
            </span>
            <span className="text-[11px] text-ink-3 font-serif">
              {special.region}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-serif font-bold text-ink tracking-wider flex items-center gap-1.5 pt-0.5">
            <Sparkles className="w-4 h-4 text-cinnabar" />
            <span>《{special.title}》</span>
          </h3>
          <p className="text-[11px] text-ink-2 font-sans">
            {special.subtitle}
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-full text-ink-3 hover:text-ink hover:bg-line transition-colors cursor-pointer"
          title="退出微视图专题"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Content - Scrollable */}
      <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3.5 text-xs">
        {/* Core Architectural Significance Card */}
        <div className="p-3 rounded-md bg-paper-2 border border-cinnabar/40 space-y-1.5 text-xs text-ink-2 leading-relaxed">
          <div className="font-serif font-bold text-cinnabar flex items-center gap-1.5 text-xs">
            <Award className="w-3.5 h-3.5" />
            <span>【空间规划与历史寓意】</span>
          </div>
          <p className="text-[11px] text-ink/90 leading-relaxed font-sans">
            {special.narrative}
          </p>
        </div>

        {/* Cross Axis Info (if exists, e.g. Wuhan Shengli St) */}
        {special.crossAxis && (
          <div className="p-2.5 rounded bg-paper-2 border border-cinnabar/30 space-y-1 text-xs">
            <div className="flex items-center justify-between text-cinnabar font-serif font-bold">
              <span>★ 贯通主轴: {special.crossAxis.name}</span>
            </div>
            <p className="text-[11px] text-ink-2 leading-relaxed font-sans">
              {special.crossAxis.significance}
            </p>
          </div>
        )}

        {/* Feature Road / Monument Selection Tabs */}
        <div className="space-y-1.5">
          <div className="text-[11px] text-ink-3 font-serif">
            <span>核心地标与道路（点击视角聚焦）：</span>
          </div>

          <div
            className={`grid gap-1.5 ${
              special.roads.length > 2 ? 'grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {special.roads.map((road) => {
              const isActive = selectedRoadId === road.id;
              return (
                <button
                  key={road.id}
                  onClick={() => {
                    setSelectedRoadId(road.id);
                    onFocusRoad?.(road);
                  }}
                  className={`p-2 rounded text-left border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cinnabar/25 border-cinnabar text-ink shadow-md ring-1 ring-cinnabar/40'
                      : 'bg-paper border-line text-ink-2 hover:border-cinnabar/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-xs truncate">
                      {road.name}
                    </span>
                    <span className="text-[10px] text-cinnabar font-mono shrink-0 ml-1">
                      {road.heroName}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Hero Story Card */}
        {activeRoad && (
          <div className="p-3.5 rounded-lg bg-paper-2 border border-cinnabar/40 space-y-2 text-xs">
            <div className="flex items-start justify-between border-b border-line pb-2">
              <div>
                <h4 className="font-serif font-bold text-sm text-ink flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-cinnabar" />
                  <span>{activeRoad.heroName}</span>
                </h4>
                <div className="text-[10px] text-ink-3 font-sans mt-0.5">
                  {activeRoad.heroRank}
                </div>
              </div>

              <button
                onClick={() => onFocusRoad?.(activeRoad)}
                className="px-2 py-1 rounded bg-cinnabar/20 hover:bg-cinnabar/40 text-cinnabar border border-cinnabar/40 text-[10px] font-serif flex items-center gap-1 cursor-pointer transition-colors"
                title="聚焦到地图此路段"
              >
                <MapPin className="w-3 h-3" />
                <span>地图聚焦</span>
              </button>
            </div>

            <div className="text-[11px] text-cinnabar font-medium font-serif">
              牺牲战役: {activeRoad.sacrificeBattle}
            </div>

            <p className="text-[11px] text-ink-2 leading-relaxed font-sans whitespace-pre-line">
              {activeRoad.storyBrief}
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 bg-paper border-t border-line flex items-center justify-between text-[11px] text-ink-3 font-serif px-4">
        <span>山河同名 · 空间规划微专题</span>
        <button
          onClick={onClose}
          className="text-cinnabar hover:underline cursor-pointer flex items-center gap-0.5"
        >
          <span>返回全景山河地图</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default ThematicSpecialPanel;
