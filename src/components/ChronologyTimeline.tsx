'use client';

import React from 'react';
import { HeroPlace } from '@/types/place';
import { sortPlacesBySacrificeDate } from '@/lib/places';
import { partitionByChronology } from '@/lib/chrono';
import { formatDateOrYear, formatAge, formatRenamedYear } from '@/lib/format';
import { EPOCHS } from '@/data/epochs';

interface ChronologyTimelineProps {
  places: HeroPlace[];
  onSelectPlace: (place: HeroPlace) => void;
}

/**
 * 一条因果脉络：左为殉国（朱砂水洗），右为山河易名（素纸面）。
 * Extracted so the dated epochs and the 纪年待考 band render identically.
 */
const CausalityEntry: React.FC<{
  place: HeroPlace;
  onSelectPlace: (place: HeroPlace) => void;
}> = ({ place, onSelectPlace }) => (
  <div
    onClick={() => onSelectPlace(place)}
    className="relative group cursor-pointer develop"
  >
    {/* 拓钉：中心线上的朱砂方点 */}
    <div
      className="absolute left-4 sm:left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-cinnabar group-hover:scale-150 transition-transform z-20"
      aria-hidden="true"
    />

    {/* 因果条目：纸面分块，无盒无影 */}
    <div className="ml-10 sm:ml-0 group-hover:bg-paper-2/60 transition-colors duration-200 p-1 sm:p-2">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Cause Block: 英烈牺牲（朱砂水洗面） */}
        <div className="flex-1 p-4 border-l-2 border-cinnabar space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-mono font-bold text-cinnabar tracking-wide">
              {formatDateOrYear(place.hero.sacrifice_date, place.hero.death_year)}
            </span>
            <span className="text-[11px] font-serif text-ink-3">
              {place.hero.force}
            </span>
          </div>

          <div className="text-sm sm:text-base font-serif font-bold text-ink leading-snug">
            <span className="text-cinnabar mr-1.5">{place.hero.name}</span>
            于{' '}
            <span className="text-cinnabar underline decoration-cinnabar/50 underline-offset-4">
              {place.former_name}
            </span>{' '}
            壮烈殉国
            {place.hero.sacrifice_age !== null && (
              <span className="text-xs font-mono text-cinnabar ml-1.5 font-normal">
                （年仅 {formatAge(place.hero.sacrifice_age, false)} 岁）
              </span>
            )}
          </div>

          <div className="text-xs text-ink-3 line-clamp-1 font-sans">
            战役：{place.hero.battle}
          </div>
        </div>

        {/* Bridge: 山河易名 */}
        <div className="shrink-0 flex lg:flex-col items-center justify-center gap-1 py-1 lg:py-0 px-2">
          <span className="text-[10px] font-serif text-ink-3 tracking-[0.35em]">
            山河易名
          </span>
          <span
            className="text-cinnabar font-bold group-hover:translate-x-1 transition-transform"
            aria-hidden="true"
          >
            →
          </span>
        </div>

        {/* Effect Block: 山河更名（素纸面） */}
        <div className="flex-1 p-4 border-l-2 border-cinnabar/40 space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-mono font-bold text-ink-2 tracking-wide">
              {formatRenamedYear(place.renamed_year)}
            </span>
            <span className="text-[11px] font-serif text-ink-3">
              {place.category}
            </span>
          </div>

          <div className="text-sm sm:text-base font-serif font-bold text-ink leading-snug">
            <span className="line-through decoration-cinnabar decoration-1 text-ink-3 mr-1">
              {place.former_name}
            </span>
            更名为{' '}
            <span className="text-cinnabar text-lg">{place.modern_name}</span>
            <span className="text-xs font-normal text-ink-3 ml-1">· 沿用至今</span>
          </div>

          <div className="text-xs text-ink-3 flex items-center justify-between font-sans gap-2">
            <span className="line-clamp-1 text-ink-2">
              {place.province} · {place.city}
            </span>
            <span className="text-[11px] text-ink-3 group-hover:text-cinnabar shrink-0 font-serif tracking-wider transition-colors">
              查看古今史料 →
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * 碑拓编年史：虚线界格脊柱 + 碑额纪年 + 拓钉方点。
 * 无胶囊徽章、无阴影卡片、无发光 —— 年份用朱砂，其余只用墨阶。
 */
export const ChronologyTimeline: React.FC<ChronologyTimelineProps> = ({
  places,
  onSelectPlace,
}) => {
  // Sort all places chronologically by hero.sacrifice_date
  const sortedPlaces = sortPlacesBySacrificeDate(places);
  const { buckets, undated } = partitionByChronology(sortedPlaces, EPOCHS);

  return (
    <div className="relative py-6 px-2 sm:px-4 max-w-5xl mx-auto">
      {/* Timeline Header Briefing */}
      <div className="text-center space-y-3 mb-14">
        <p className="epigraph-label">抗战编年史 · 山河以忠烈为名</p>
        <h2 className="text-2xl sm:text-3xl font-serif font-black text-ink tracking-[0.15em]">
          因果相承：从英烈殉国到山河同名
        </h2>
        <p className="text-xs sm:text-sm text-ink-3 max-w-2xl mx-auto font-sans leading-relaxed">
          按英烈为国捐躯的真实时间序列展开。每一处今天我们熟知的地名，其背后都是一段刻骨铭心的抗敌壮歌。
        </p>
        {undated.length > 0 && (
          <p className="text-[11px] text-ink-3 font-sans">
            其中 {undated.length} 处殉国年月待考，列于卷末，不与有年可稽者混编。
          </p>
        )}
      </div>

      {/* Main Continuous Timeline Vertical Spine: dashed 界格线 */}
      <div className="relative">
        <div
          className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-0 border-l-2 border-dashed border-line -translate-x-1/2 pointer-events-none"
          aria-hidden="true"
        />

        {/* Iterate Epochs */}
        <div className="space-y-16">
          {buckets.map(({ epoch, items: epochPlaces }) => {
            // If no places in this epoch and not 1931 or 1945 victory banner, still show epoch banner
            if (
              epochPlaces.length === 0 &&
              epoch.yearRange !== '1931–1936' &&
              epoch.yearRange !== '1945–1946+'
            ) {
              return null;
            }

            return (
              <div key={epoch.yearRange} className="relative space-y-8">
                {/* 碑额：两侧长横线 + 纪年（朱砂）+ 阶段名（墨） */}
                <EpochHeading epoch={epoch} />

                {/* Places linked to this epoch */}
                {epochPlaces.length > 0 && (
                  <div className="space-y-6">
                    {epochPlaces.map((place) => (
                      <CausalityEntry
                        key={place.id}
                        place={place}
                        onSelectPlace={onSelectPlace}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* 卷末：殉国年月待考者 —— 收录而不静默丢弃 */}
          {undated.length > 0 && (
            <div className="relative space-y-8">
              <div className="relative flex flex-col items-center justify-center text-center z-10">
                <div className="flex items-center gap-4 w-full max-w-2xl">
                  <div className="flex-1 h-px bg-line" aria-hidden="true" />
                  <div className="flex items-baseline gap-2.5 whitespace-nowrap">
                    <span className="font-serif font-black text-ink-3 text-lg sm:text-xl tracking-widest">
                      年月待考
                    </span>
                    <span className="font-serif font-bold text-ink text-sm sm:text-base tracking-[0.3em]">
                      {undated.length} 处
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-line" aria-hidden="true" />
                </div>
                <div className="mt-4 max-w-xl px-2">
                  <p className="text-[11px] sm:text-xs text-ink-3 mt-1.5 font-sans leading-relaxed">
                    方志与阵亡档案仅载地名与英烈姓氏，未载确切牺牲年月者，暂附卷末，俟考订后归入相应纪年。
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {undated.map((place) => (
                  <CausalityEntry
                    key={place.id}
                    place={place}
                    onSelectPlace={onSelectPlace}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Victory & Monument Epilogue */}
        <div className="relative mt-16 text-center z-10">
          <div className="flex items-center justify-center gap-4 max-w-md mx-auto">
            <div className="flex-1 h-px bg-line" aria-hidden="true" />
            <p className="font-serif font-bold text-ink text-sm tracking-[0.25em] whitespace-nowrap">
              天地英雄气<span className="text-cinnabar mx-2">·</span>千秋尚凛然
            </p>
            <div className="flex-1 h-px bg-line" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
};

const EpochHeading: React.FC<{ epoch: (typeof EPOCHS)[number] }> = ({ epoch }) => (
  <div className="relative flex flex-col items-center justify-center text-center z-10">
    <div className="flex items-center gap-4 w-full max-w-2xl">
      <div className="flex-1 h-px bg-line" aria-hidden="true" />
      <div className="flex items-baseline gap-2.5 whitespace-nowrap">
        <span className="font-serif font-black text-cinnabar text-lg sm:text-xl tracking-widest">
          {epoch.yearRange}
        </span>
        <span className="font-serif font-bold text-ink text-sm sm:text-base tracking-[0.3em]">
          {epoch.badge}
        </span>
      </div>
      <div className="flex-1 h-px bg-line" aria-hidden="true" />
    </div>

    <div className="mt-4 max-w-xl px-2">
      <h3 className="text-sm sm:text-base font-serif font-bold text-ink tracking-wide">
        {epoch.title}
      </h3>
      <p className="text-[11px] sm:text-xs text-ink-3 mt-1.5 font-sans leading-relaxed">
        {epoch.epigraph}
      </p>
    </div>
  </div>
);
