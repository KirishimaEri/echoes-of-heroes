'use client';

import React, { useState, useMemo } from 'react';
import {
  places,
  getCoreStats,
  filterPlaces,
  createDefaultFilter,
} from '@/lib/places';
import { HeroPlace, FilterState } from '@/types/place';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { FilterBar } from '@/components/FilterBar';
import { MonumentGrid } from '@/components/MonumentGrid';
import { ChronologyTimeline } from '@/components/ChronologyTimeline';
import { PastPresentDialog } from '@/components/PastPresentDialog';
import { Map } from '@/components/Map';
import { HistoricalContextModal } from '@/components/HistoricalContextModal';
import { THEMATIC_SPECIALS } from '@/data/thematics';
import { YEAR_BOUNDS } from '@/lib/places';

export default function Home() {
  const [filter, setFilter] = useState<FilterState>(createDefaultFilter);

  const [dialogPlace, setDialogPlace] = useState<HeroPlace | null>(null);
  const [selectedMapPlace, setSelectedMapPlace] = useState<HeroPlace | null>(
    null
  );
  const [viewMode, setViewMode] = useState<'grid' | 'timeline' | 'map'>('grid');
  const [activeThematicId, setActiveThematicId] = useState<string | null>(null);
  const [bannerThematicId, setBannerThematicId] = useState<string>('wuhan');
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);

  // Compute Core Stats from places.json
  const stats = useMemo(() => getCoreStats(places), []);

  // Filtered places (only filtered by search query & category now)
  const filteredPlaces = useMemo(() => {
    return filterPlaces(places, filter);
  }, [filter]);

  const handleSelectMonument = (place: HeroPlace) => {
    setDialogPlace(place);
  };

  const handleFocusMap = (place: HeroPlace) => {
    setDialogPlace(null);
    setSelectedMapPlace(place);
    setActiveThematicId(null);
    setViewMode('map');
  };

  const handleTriggerThematic = (thematicId: string) => {
    setActiveThematicId(thematicId);
    setViewMode('map');
  };

  const handleResetFilter = () => {
    setFilter(createDefaultFilter());
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink font-sans selection:bg-cinnabar selection:text-white">
      {/* Sticky unit: header + filter bar move as one block — avoids a brittle
          pixel offset between two independently-sticky bars (B2 fix). */}
      <div className="sticky top-0 z-30">
        {/* 1. Top Header: Minimalist, only Contribution & GitHub */}
        <Header onOpenContribution={() => setIsContextModalOpen(true)} />

        {/* 4. Single-Row Filter & View Toolbar */}
        <FilterBar
          filter={filter}
          onChange={setFilter}
          totalResults={filteredPlaces.length}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>

      {/* 2. Hero Section: Monument Title & 4 Core Metric Indicators */}
      <HeroSection stats={stats} />

      {/* 3. Thematic Specials Guide (Switchable between 5 Themes) — 界格式题签行 */}
      {!activeThematicId && (
        <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 pb-4">
          <div className="border-y border-line py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: 题签 + 专题切换 + 标题 */}
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <span className="epigraph-label">抗战微专题</span>
                {Object.values(THEMATIC_SPECIALS).map((th) => (
                  <button
                    key={th.id}
                    onClick={() => setBannerThematicId(th.id)}
                    className={`relative py-0.5 text-[11px] font-serif tracking-wider transition-colors cursor-pointer ${
                      bannerThematicId === th.id
                        ? 'text-cinnabar font-bold'
                        : 'text-ink-2 hover:text-ink'
                    }`}
                  >
                    {th.title.split('，')[0].replace('《', '').replace('》', '')}
                    {bannerThematicId === th.id && (
                      <span
                        className="absolute left-0 right-0 -bottom-0.5 h-[3px] bg-cinnabar"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                ))}
              </div>

              <div>
                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-serif font-black text-ink tracking-[0.15em]">
                    《{THEMATIC_SPECIALS[bannerThematicId]?.title}》
                  </h3>
                  <span className="text-xs font-serif text-cinnabar tracking-widest border-l-2 border-cinnabar pl-2">
                    {THEMATIC_SPECIALS[bannerThematicId]?.region}
                  </span>
                </div>
                <p className="text-xs text-ink-3 leading-relaxed max-w-3xl pt-1">
                  {THEMATIC_SPECIALS[bannerThematicId]?.subtitle} ·{' '}
                  {THEMATIC_SPECIALS[bannerThematicId]?.significance}
                </p>
              </div>
            </div>

            {/* Right: 落印式入口 */}
            <button
              onClick={() => handleTriggerThematic(bannerThematicId)}
              className="shrink-0 self-start md:self-auto inline-flex items-center gap-3 px-4 py-2.5 bg-cinnabar hover:bg-cinnabar-dim text-paper text-xs font-serif font-bold tracking-[0.3em] transition-colors cursor-pointer"
            >
              <span className="font-black leading-none" aria-hidden="true">
                入
              </span>
              <span>进入微视图专题</span>
            </button>
          </div>
        </section>
      )}

      {/* 4. Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* View 1: 碑林名录 */}
        {viewMode === 'grid' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-line/50 text-xs text-ink-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-cinnabar" />
                <span className="font-serif text-ink">
                  碑林名录 · 现代地名卷 (共 {filteredPlaces.length} 处)
                </span>
                <span className="text-ink-3">· 点击卡片开启“古今对话”</span>
              </div>
            </div>

            {/* Monument Grid */}
            <MonumentGrid
              places={filteredPlaces}
              onSelectPlace={handleSelectMonument}
              onResetFilter={handleResetFilter}
            />
          </div>
        )}

        {/* View 2: 1931-1945 抗战编年史 */}
        {viewMode === 'timeline' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-line/50 text-xs text-ink-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-cinnabar" />
                <span className="font-serif text-ink">
                  抗战编年史 (共 {filteredPlaces.length} 处因果脉络 · 实录{' '}
                  {YEAR_BOUNDS[0]}–{YEAR_BOUNDS[1]})
                </span>
                <span className="text-ink-3">· 按英烈牺牲时间升序排列</span>
              </div>
            </div>

            {/* Chronology Timeline */}
            <ChronologyTimeline
              places={filteredPlaces}
              onSelectPlace={handleSelectMonument}
            />
          </div>
        )}

        {/* View 3: 山河地图 */}
        {viewMode === 'map' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-ink-3 pb-1">
              <div className="flex items-center gap-2">
                <span className="font-serif text-ink">
                  {activeThematicId
                    ? `${THEMATIC_SPECIALS[activeThematicId]?.region} · 抗战空间微视图专题：《${THEMATIC_SPECIALS[activeThematicId]?.title}》`
                    : '全景山河空间地图 (星标: 县市 / 路牌: 街道 / 聚合徽章: 区域群落)'}
                </span>
              </div>
            </div>

            <div className="bg-paper-2 p-2.5 border border-ink relative">
              <Map
                places={filteredPlaces}
                selectedPlace={selectedMapPlace}
                onSelectPlace={(p) => setSelectedMapPlace(p)}
                onOpenDetail={(p) => setSelectedMapPlace(p)}
                activeThematicId={activeThematicId}
                onSelectThematic={(id) => setActiveThematicId(id)}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer Solemn Inscription — 碑阴落款 */}
      <footer className="border-t border-line bg-paper-2 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-10 text-center">
          <div className="flex items-center justify-center gap-4 max-w-lg mx-auto">
            <div className="flex-1 h-px bg-line" aria-hidden="true" />
            <p className="font-serif font-black text-ink text-base tracking-[0.3em] whitespace-nowrap">
              山河无恙<span className="text-cinnabar mx-2.5">·</span>英雄永在
            </p>
            <div className="flex-1 h-px bg-line" aria-hidden="true" />
          </div>
          <p className="epigraph-label mt-3">抗战英烈现代地名志</p>
          <p className="max-w-xl mx-auto text-[11px] leading-relaxed text-ink-3 mt-5">
            本项目依据国家权威史志档案记载开发，致力于以现代开源可视化技术铭记中华民族先烈功绩。
          </p>
        </div>
      </footer>

      {/* ‘古今对话’ 核心详情弹窗 (只在非地图视图下弹出，地图视图专用左右分栏抽屉) */}
      {viewMode !== 'map' && (
        <PastPresentDialog
          place={dialogPlace}
          onClose={() => setDialogPlace(null)}
          onFocusMap={handleFocusMap}
        />
      )}

      {/* Historical Context & Contribution Modal */}
      <HistoricalContextModal
        isOpen={isContextModalOpen}
        onClose={() => setIsContextModalOpen(false)}
      />
    </div>
  );
}
