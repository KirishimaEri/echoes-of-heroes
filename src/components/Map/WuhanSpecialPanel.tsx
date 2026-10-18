'use client';

import React, { useState } from 'react';
import { WUHAN_ROADS, SHENGLI_STREET, WuhanRoadFeature } from '@/data/wuhanSpecial';
import { Sparkles, X, Compass, Shield, Award, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WuhanSpecialPanelProps {
  onClose: () => void;
  onFocusRoad?: (road: WuhanRoadFeature) => void;
}

export const WuhanSpecialPanel: React.FC<WuhanSpecialPanelProps> = ({
  onClose,
  onFocusRoad,
}) => {
  const [selectedRoadId, setSelectedRoadId] = useState<string>(WUHAN_ROADS[0].id);

  const activeRoad = WUHAN_ROADS.find((r) => r.id === selectedRoadId) || WUHAN_ROADS[0];

  return (
    <div className="absolute left-3 bottom-3 sm:left-4 sm:bottom-4 z-[1000] w-[calc(100%-24px)] sm:w-[420px] max-h-[85vh] bg-paper-2/95 backdrop-blur-md border border-cinnabar/60 rounded-lg shadow-2xl overflow-hidden flex flex-col text-ink">
      {/* Top Gold Gradient Bar */}
      <div className="h-1 bg-gradient-to-r from-cinnabar via-cinnabar to-cinnabar" />

      {/* Header */}
      <div className="p-3.5 sm:p-4 border-b border-line flex items-start justify-between bg-paper/70">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cinnabar/20 text-cinnabar border border-cinnabar/40">
              抗战空间微视图专题
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-serif font-bold text-ink tracking-wider flex items-center gap-1.5 pt-0.5">
            <Sparkles className="w-4 h-4 text-cinnabar" />
            <span>《条条英雄路，通往胜利街》</span>
          </h3>
          <p className="text-[11px] text-ink-2 font-sans">
            武汉市江岸区原租界 · 城市抗战命名规划志
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
            <span>【走向胜利】的城市规划寓意</span>
          </div>
          <p className="text-[11px] text-ink/90 leading-relaxed">
            {SHENGLI_STREET.significance}
          </p>
        </div>

        {/* Four Parallel Hero Roads Selection Tabs */}
        <div className="space-y-1.5">
          <div className="text-[11px] text-ink-3 font-serif">
            <span>四条平行英烈路（点击聚焦）：</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {WUHAN_ROADS.map((road) => {
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
                    <span className="font-serif font-bold text-xs">
                      {road.name}
                    </span>
                    <span className="text-[10px] text-cinnabar font-mono">
                      {road.heroName}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Road Martyr Profile */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRoad.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="p-3 rounded-md bg-cinnabar-wash border border-cinnabar/40 space-y-2"
          >
            <div className="flex items-baseline justify-between border-b border-cinnabar/30 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-sm text-ink">
                  {activeRoad.heroName}
                </span>
                <span className="text-[11px] text-cinnabar font-mono">
                  {activeRoad.name}
                </span>
              </div>
              <span className="text-[10px] text-ink-3">
                交汇于胜利街
              </span>
            </div>

            <div className="text-[11px] text-ink-2 space-y-1">
              <div className="flex items-center gap-1.5 text-cinnabar">
                <Shield className="w-3 h-3 shrink-0" />
                <span className="font-medium">{activeRoad.heroRank}</span>
              </div>
              <div className="flex items-center gap-1.5 text-ink-3">
                <MapPin className="w-3 h-3 shrink-0 text-cinnabar" />
                <span>{activeRoad.sacrificeBattle}</span>
              </div>
              <p className="text-ink/90 leading-relaxed pt-1 text-[11px] font-serif border-t border-line/50">
                {activeRoad.storyBrief}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Legend Hint */}
        <div className="flex items-center justify-between text-[10px] text-ink-3 pt-1 border-t border-line/40">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-cinnabar rounded-full inline-block" />
            <span className="text-cinnabar">亮金色：胜利街主干道</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-cinnabar rounded-full inline-block" />
            <span className="text-cinnabar">朱砂红：四座将士路</span>
          </div>
        </div>
      </div>

      {/* Footer Return Button */}
      <div className="p-3 border-t border-line bg-paper flex items-center justify-between">
        <span className="text-[11px] text-ink-3">
          缩放级别: 15 (江岸街区)
        </span>
        <button
          onClick={onClose}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-paper-3 hover:bg-line text-xs text-ink border border-line transition-colors cursor-pointer"
        >
          <Compass className="w-3 h-3 text-cinnabar" />
          <span>退出微视图</span>
        </button>
      </div>
    </div>
  );
};
