'use client';

import React, { useEffect } from 'react';
import { HeroPlace } from '@/types/place';
import { X } from 'lucide-react';

interface PastPresentDialogProps {
  place: HeroPlace | null;
  onClose: () => void;
  onFocusMap?: (place: HeroPlace) => void;
}

/**
 * 志书页：纸底、顶部墨色题签条（白文「古今对话」）、双栏之间竖向界格线。
 * 无渐变、无胶囊徽章、无脉冲圆点 —— 层级只靠字号与墨色深浅。
 */
export const PastPresentDialog: React.FC<PastPresentDialogProps> = ({
  place,
  onClose,
  onFocusMap,
}) => {
  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!place) return null;

  const { hero } = place;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 lg:p-8 bg-ink/55">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* 一页志书 */}
      <div
        className="relative w-full max-w-5xl max-h-[92vh] bg-paper border border-ink flex flex-col overflow-hidden text-ink z-10 develop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 墨色题签条：白文「古今对话」+ 落印 */}
        <div className="h-9 bg-ink flex items-center justify-between pl-4 sm:pl-5 pr-2 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-serif font-black text-paper text-sm tracking-[0.5em]">
              古今对话
            </span>
            <span className="hidden sm:inline font-serif text-[11px] text-paper/60 tracking-widest">
              历史档案 · 今日山河
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-paper/60 hover:text-paper transition-colors cursor-pointer"
            title="关闭 (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 双栏：左卷历史 / 右卷今日，中缝界格线 */}
        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-line">
          {/* ============ 左卷 · 历史（朱砂竖笔） ============ */}
          <div className="flex-1 p-5 sm:p-6 lg:p-7 space-y-5">
            <div className="flex items-baseline justify-between pb-3 border-b border-line">
              <span className="font-serif text-xs text-cinnabar font-bold tracking-[0.4em]">
                历史回响 · 英烈丰碑
              </span>
              <span className="text-[11px] font-mono text-ink-3">抗战史实</span>
            </div>

            {/* 名讳巨字 + 部别 */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-baseline gap-3">
                <h3 className="font-monument text-4xl text-ink leading-tight">
                  {hero.name}
                </h3>
                <span className="text-xs font-serif text-cinnabar tracking-widest border-l-2 border-cinnabar pl-2">
                  {hero.force}
                </span>
              </div>
              <p className="text-xs text-ink-2 font-serif leading-relaxed">
                {hero.title}
              </p>
            </div>

            {/* 生卒与殉国年龄：碑刻数据式 */}
            <div className="flex items-baseline gap-6 py-2 border-y border-dashed border-line">
              <div>
                <span className="text-[11px] text-ink-3 block font-sans">生卒纪年</span>
                <span className="font-serif text-ink font-bold text-lg [font-variant-numeric:tabular-nums]">
                  {hero.birth_year} – {hero.death_year}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-ink-3 block font-sans">殉国时年</span>
                <span className="font-serif text-cinnabar font-black text-lg [font-variant-numeric:tabular-nums]">
                  仅 {hero.sacrifice_age} 岁
                </span>
              </div>
            </div>

            {/* 殉国战役 */}
            <div className="space-y-1">
              <span className="text-[11px] font-serif text-ink-3 tracking-[0.3em]">
                殉国战役
              </span>
              <p className="font-serif text-ink text-sm leading-relaxed">
                {hero.sacrifice_date} · {hero.battle}
              </p>
            </div>

            {/* 事迹 */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-serif text-ink-3 tracking-[0.3em]">
                壮烈事迹与历史档案
              </span>
              <p className="text-xs sm:text-sm text-ink leading-[1.9] whitespace-pre-line font-serif border-l-2 border-cinnabar/50 pl-3">
                {hero.story}
              </p>
            </div>

            {/* 史料出处 */}
            <div className="space-y-2 pt-1 border-t border-line">
              <span className="text-[11px] font-serif text-ink-3 tracking-[0.3em]">
                权威史料著录
              </span>
              <ul className="space-y-1">
                {place.sources.map((src, idx) => (
                  <li
                    key={idx}
                    className="text-[11px] font-serif text-ink-2 leading-relaxed"
                  >
                    〔{idx + 1}〕{src}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ============ 右卷 · 今日（墨色竖笔） ============ */}
          <div className="flex-1 p-5 sm:p-6 lg:p-7 space-y-5">
            <div className="flex items-baseline justify-between pb-3 border-b border-line">
              <span className="font-serif text-xs text-ink font-bold tracking-[0.4em]">
                今日山河 · 岁月长歌
              </span>
              <span className="text-[11px] font-mono text-ink-3">现代行政</span>
            </div>

            {/* 今名巨字 + 类别 */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-baseline gap-3">
                <h3 className="font-monument text-4xl text-cinnabar leading-tight">
                  {place.modern_name}
                </h3>
                <span className="text-xs font-serif text-ink-2 tracking-widest border-l-2 border-ink pl-2">
                  {place.category}
                </span>
              </div>
              <div className="text-xs text-ink-3 font-serif flex items-baseline gap-1.5 flex-wrap">
                <span>更迭前原名</span>
                <span className="line-through decoration-cinnabar decoration-1 text-ink-2 font-bold text-sm">
                  {place.former_name}
                </span>
                <span className="text-ink-3">→</span>
                <span className="text-cinnabar font-bold text-sm">
                  {place.modern_name}
                </span>
              </div>
            </div>

            {/* 更名与管辖 */}
            <div className="flex items-baseline gap-6 py-2 border-y border-dashed border-line">
              <div>
                <span className="text-[11px] text-ink-3 block font-sans">正式更名</span>
                <span className="font-serif text-ink font-bold text-lg [font-variant-numeric:tabular-nums]">
                  {place.renamed_year} 年
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-ink-3 block font-sans">行政管辖</span>
                <span className="font-serif text-ink font-bold text-lg line-clamp-1">
                  {place.province} · {place.city}
                </span>
              </div>
            </div>

            {/* 坐标 */}
            <div className="space-y-1">
              <span className="text-[11px] font-serif text-ink-3 tracking-[0.3em]">
                地理经纬（经度，纬度）
              </span>
              <p className="font-mono text-ink text-sm tracking-wide">
                {place.coordinates[0].toFixed(4)}°E ，{place.coordinates[1].toFixed(4)}°N
              </p>
            </div>

            {/* 今日风貌 */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-serif text-ink-3 tracking-[0.3em]">
                今日风貌与生生不息
              </span>
              <p className="text-xs sm:text-sm text-ink-2 leading-[1.9] font-sans border-l-2 border-ink/40 pl-3">
                {place.modern_status}
              </p>
            </div>

            {/* 落印式定位按钮 */}
            {onFocusMap && (
              <button
                onClick={() => {
                  onFocusMap(place);
                  onClose();
                }}
                className="w-full py-2.5 px-4 bg-cinnabar hover:bg-cinnabar-dim text-paper text-xs font-serif font-bold tracking-[0.3em] transition-colors cursor-pointer flex items-center justify-center gap-3"
              >
                <span className="font-black leading-none" aria-hidden="true">
                  印
                </span>
                <span>在山河地图中定位此地</span>
              </button>
            )}
          </div>
        </div>

        {/* 志书页脚 */}
        <div className="px-5 py-2.5 border-t border-line flex items-center justify-between text-[11px] text-ink-3 shrink-0">
          <span className="font-serif tracking-[0.25em]">
            山河不老，英烈永存
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-line hover:border-cinnabar hover:text-cinnabar text-ink-2 text-xs font-serif tracking-wider transition-colors cursor-pointer"
          >
            合卷
          </button>
        </div>
      </div>
    </div>
  );
};
