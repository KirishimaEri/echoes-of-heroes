'use client';

import React from 'react';
import { REPO_URL, isPublished } from '@/lib/site';

interface HeaderProps {
  onOpenContribution: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenContribution }) => {
  return (
    <header className="border-b border-line bg-paper/95 backdrop-blur px-4 lg:px-6 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: brand — seal + wordmark + epigraph chip */}
        <div className="flex items-center gap-3 min-w-0">
          {/* 朱文方印「衆」 */}
          <div
            className="w-8 h-8 shrink-0 bg-cinnabar text-paper flex items-center justify-center select-none"
            aria-hidden="true"
          >
            <span className="font-serif font-black text-lg leading-none translate-y-[1px]">
              衆
            </span>
          </div>
          <div className="flex items-baseline gap-2.5 min-w-0">
            <span className="text-lg md:text-xl font-serif font-black text-ink tracking-[0.2em] whitespace-nowrap">
              山河同名
            </span>
            <span className="hidden sm:inline text-[10px] font-serif tracking-[0.5em] text-ink-3 whitespace-nowrap">
              抗战英烈命名地名档案
            </span>
          </div>
        </div>

        {/* Right: contribution seal-button + GitHub */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenContribution}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-cinnabar hover:bg-cinnabar-dim text-paper text-xs font-serif tracking-wider transition-colors cursor-pointer"
            title="点亮家乡英雄地名"
          >
            <span className="font-black leading-none" aria-hidden="true">
              衆
            </span>
            <span className="hidden sm:inline">点亮家乡英雄地名</span>
            <span className="sm:hidden">点亮家乡地名</span>
          </button>

          {isPublished && (
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-paper-2 hover:bg-paper-3 text-ink-2 hover:text-ink border border-line text-xs transition-colors cursor-pointer"
              title="查看 GitHub 开源仓库"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span className="font-mono text-xs">GitHub</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
};
