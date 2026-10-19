'use client';

import React from 'react';
import { CoreStats } from '@/lib/places';
import { PENDING } from '@/lib/format';

interface HeroSectionProps {
  stats: CoreStats;
}

/**
 * 碑拓首屏：非对称碑刻版式。
 * 左：巨字标题（字即界面）；右：竖排导语（志书题签）。
 * 统计为碑刻式数据行 —— 巨型数字 + 细线分栏，无卡片无阴影。
 */
export const HeroSection: React.FC<HeroSectionProps> = ({ stats }) => {
  return (
    <section className="bg-paper border-b border-line px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* ---- 上半：非对称双栏（左巨字 / 右竖排导语） ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pt-10 lg:pt-16 pb-10 lg:pb-14">
          {/* 左 8 列：巨字 */}
          <div className="lg:col-span-8 develop">
            <p className="epigraph-label mb-4 lg:mb-6">
              一九三一 —— 一九四五
            </p>
            <h1 className="font-monument text-ink leading-[1.05] text-[clamp(72px,11vw,150px)]">
              山河同名
            </h1>
            <p className="mt-5 lg:mt-7 text-base sm:text-lg font-serif text-ink-2 tracking-[0.15em]">
              谨以此项目纪念牺牲在第二次中日战争中的烈士。
              <span className="block sm:inline sm:ml-2 text-sm sm:text-base text-ink-3 tracking-[0.08em]">
                In memory of those who sacrificed their lives in the Second
                Sino-Japanese War.
              </span>
            </p>
          </div>

          {/* 右 4 列：竖排导语（移动端横排） */}
          <div className="lg:col-span-4 flex lg:justify-end develop" style={{ animationDelay: '0.15s' }}>
            <div className="max-w-md lg:max-w-none">
              {/* 竖排：桌面端志书题签 */}
              <p
                className="hidden lg:block font-serif text-[15px] text-ink-2 leading-[2.2] tracking-[0.3em] border-l border-line pl-5 h-56"
                style={{ writingMode: 'vertical-rl' }}
              >
                从白山黑水到长城内外，以英雄忠烈之名，冠今日山河之邑。翻开这卷立体的现代方志，让每一次途经与伫立，都化为跨越时空的深深致敬。
              </p>
              {/* 横排：移动端 */}
              <p className="lg:hidden text-xs text-ink-3 leading-loose">
                从白山黑水到长城内外，以英雄忠烈之名，冠今日山河之邑。翻开这卷立体的现代方志，让每一次途经与伫立，都化为跨越时空的深深致敬。
              </p>
            </div>
          </div>
        </div>

        {/* ---- 下半：碑刻式数据行（无卡片：巨数字 + 细线分栏） ---- */}
        <div className="rule-line border-t-0 grid grid-cols-2 lg:grid-cols-4 gap-y-6 py-7 lg:py-9 develop-stagger">
          <div className="lg:border-l lg:border-line lg:pl-8">
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif font-black text-cinnabar text-4xl sm:text-5xl tracking-tight [font-variant-numeric:tabular-nums]">
                {stats.countyAndTownCount}
              </span>
              <span className="text-xs font-serif text-ink-3">处县市乡镇</span>
            </div>
            <p className="text-[11px] text-ink-3 mt-1.5">
              靖宇、尚志、左权、黄骅、本斋
            </p>
          </div>

          <div className="lg:border-l lg:border-line lg:pl-8">
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif font-black text-cinnabar text-4xl sm:text-5xl tracking-tight [font-variant-numeric:tabular-nums]">
                {stats.streetCount}
              </span>
              <span className="text-xs font-serif text-ink-3">条城市街道</span>
            </div>
            <p className="text-[11px] text-ink-3 mt-1.5">
              自忠路、佟麟阁路、陈怀民路
            </p>
          </div>

          <div className="lg:border-l lg:border-line lg:pl-8">
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif font-black text-cinnabar text-4xl sm:text-5xl tracking-tight [font-variant-numeric:tabular-nums]">
                {stats.avgSacrificeAge ?? PENDING}
              </span>
              <span className="text-xs font-serif text-ink-3">岁平均殉国</span>
            </div>
            <p className="text-[11px] text-ink-3 mt-1.5">
              {stats.minSacrificeAge === null ? (
                <span>殉国年岁待考</span>
              ) : (
                <>
                  最年轻{' '}
                  <span className="text-cinnabar font-serif font-bold">
                    {stats.minSacrificeAge}
                  </span>{' '}
                  岁（{stats.youngestHeroName}烈士）
                </>
              )}
            </p>
            {stats.unlocatedCount > 0 && (
              <p className="text-[10px] text-ink-3/80 mt-1 font-sans">
                已定位 {stats.geocodedCount} 处 · 余 {stats.unlocatedCount} 处经纬待考
              </p>
            )}
          </div>

          <div className="lg:border-l lg:border-line lg:pl-8">
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif font-black text-ink text-4xl sm:text-5xl tracking-tight [font-variant-numeric:tabular-nums]">
                {stats.timeSpan}
              </span>
            </div>
            <p className="text-[11px] text-ink-3 mt-1.5">
              十四载浴血抗战 · 实录覆盖 {stats.dataSpan}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
