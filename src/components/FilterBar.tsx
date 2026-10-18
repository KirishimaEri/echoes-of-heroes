'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { PlaceCategory, FilterState } from '@/types/place';

interface FilterBarProps {
  filter: FilterState;
  onChange: (filter: FilterState) => void;
  totalResults: number;
  viewMode: 'grid' | 'timeline' | 'map';
  onViewModeChange: (mode: 'grid' | 'timeline' | 'map') => void;
}

/**
 * 无框工具条：搜索为下划线墨笔，切换项为纯文字 + 朱砂底笔。
 * 无圆角、无容器边框、无阴影 —— 像写在纸页天头的目录行。
 */
export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  onChange,
  totalResults,
  viewMode,
  onViewModeChange,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filter, searchQuery: e.target.value });
  };

  const handleCategoryChange = (category: 'all' | PlaceCategory) => {
    onChange({ ...filter, category });
  };

  const categories: Array<{ id: 'all' | PlaceCategory; label: string }> = [
    { id: 'all', label: '全部' },
    { id: '县市', label: '县市' },
    { id: '街道', label: '城市街道' },
    { id: '乡镇与村落', label: '乡镇与村落' },
    { id: '历史曾用县名', label: '历史曾用县名' },
  ];

  return (
    <div className="bg-paper border-b border-line px-4 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 text-xs">
        {/* Left: 搜索 + 分类 */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 flex-1 min-w-0">
          {/* 墨笔下划线搜索 */}
          <div className="relative min-w-[180px] max-w-xs flex-1">
            <Search className="w-3.5 h-3.5 absolute left-0 top-1/2 -translate-y-1/2 text-ink-4" />
            <input
              type="text"
              value={filter.searchQuery}
              onChange={handleSearchChange}
              placeholder="搜索地名、原名或英烈姓名…"
              className="w-full pl-6 pr-6 py-1.5 bg-transparent border-0 border-b border-line focus:border-cinnabar focus:outline-none text-ink placeholder:text-ink-4 text-xs transition-colors rounded-none"
            />
            {filter.searchQuery && (
              <button
                onClick={() => onChange({ ...filter, searchQuery: '' })}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-ink-3 hover:text-cinnabar p-0.5 cursor-pointer"
                title="清除搜索"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* 分类：纯文字 + 当前项朱砂底笔 */}
          <div className="flex items-center gap-3.5 flex-wrap">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => handleCategoryChange(c.id)}
                className={`relative py-1 font-serif tracking-wider transition-colors cursor-pointer ${
                  filter.category === c.id
                    ? 'text-cinnabar font-bold'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                {c.label}
                {filter.category === c.id && (
                  <span
                    className="absolute left-0 right-0 -bottom-0.5 h-[3px] bg-cinnabar"
                    aria-hidden="true"
                  />
                )}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-ink-3 hidden lg:inline font-mono whitespace-nowrap">
            已收录 {totalResults} 处
          </span>
        </div>

        {/* Right: 视图切换（纯文字 + 朱砂底笔） */}
        <div className="flex items-center gap-4 self-end md:self-auto shrink-0">
          {(
            [
              { id: 'grid', label: '碑林' },
              { id: 'timeline', label: '编年' },
              { id: 'map', label: '山河' },
            ] as const
          ).map((v) => (
            <button
              key={v.id}
              onClick={() => onViewModeChange(v.id)}
              className={`relative py-1 font-serif tracking-[0.3em] transition-colors cursor-pointer ${
                viewMode === v.id
                  ? 'text-cinnabar font-bold'
                  : 'text-ink-2 hover:text-ink'
              }`}
              title={`${v.label}视图`}
            >
              {v.label}
              {viewMode === v.id && (
                <span
                  className="absolute left-0 right-0 -bottom-0.5 h-[3px] bg-cinnabar"
                  aria-hidden="true"
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
