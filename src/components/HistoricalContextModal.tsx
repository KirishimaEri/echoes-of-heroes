'use client';

import React from 'react';
import { X, ShieldAlert, Award, Landmark } from 'lucide-react';
import { CONTRIBUTE_ISSUE_URL, isPublished } from '@/lib/site';

interface HistoricalContextModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoricalContextModal: React.FC<HistoricalContextModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[88vh] bg-paper-2 border border-cinnabar/60 rounded-lg shadow-2xl flex flex-col overflow-hidden text-ink"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 bg-gradient-to-r from-cinnabar via-cinnabar to-cinnabar" />

        <div className="p-5 md:p-6 border-b border-line flex items-center justify-between bg-paper/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-cinnabar/20 border border-cinnabar/50 flex items-center justify-center text-cinnabar">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-serif font-bold text-ink tracking-wider">
                《山河同名》序志
              </h2>
              <p className="text-xs text-ink-3">
                历史档案与现代山河的对话 · 项目考据与立意
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-ink-3 hover:text-ink hover:bg-line transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 md:p-6 overflow-y-auto space-y-5 text-xs md:text-sm text-ink-2 leading-relaxed">
          {/* Section 1 */}
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-ink text-base flex items-center gap-2">
              <span className="w-1.5 h-4 bg-cinnabar rounded-full inline-block" />
              以身许国，山河铭名
            </h3>
            <p>
              1931 年“九一八事变”至 1945 年抗战胜利，中华民族历经了十四载艰苦卓绝的全民族浴血奋战。面对空前残暴的外敌入侵，无数中华儿女抛头颅、洒热血，在正面战场与敌后平原、在白山黑水与崇山峻岭间舍生取义。
            </p>
            <p>
              在抗战胜利前后及新中国成立初期，各地政府与人民为永志英雄功勋，将烈士牺牲处、战斗地或根据地中心城市以烈士姓名重新命名——吉林濛江更名**靖宇**、黑龙江珠河更名**尚志**、山西辽县更名**左权**、河北新海更名**黄骅**，北京、上海、武汉、天津将重要主干道改名为**张自忠路**、**佟麟阁路**、**赵登禹路**、**郝梦龄路**、**陈怀民路**。
            </p>
          </div>

          {/* Section 2: Aesthetics */}
          <div className="p-4 rounded-md bg-paper border border-line space-y-2">
            <h4 className="font-serif font-semibold text-cinnabar text-xs uppercase tracking-wider flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-cinnabar" />
              设计美学与视觉隐喻
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="flex items-start gap-2">
                <span className="w-3 h-3 rounded-full bg-paper border border-line shrink-0 mt-0.5" />
                <span>
                  <strong className="text-ink">深石板灰与深炭灰：</strong>
                  象征千锤百炼的历史碑石与厚重山河。
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-3 h-3 rounded-full bg-ink shrink-0 mt-0.5" />
                <span>
                  <strong className="text-ink">宣纸米白：</strong>
                  象征载入史册的真实档案与岁月信笺。
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-3 h-3 rounded-full bg-cinnabar shrink-0 mt-0.5" />
                <span>
                  <strong className="text-ink">朱砂红：</strong>
                  凝聚抗日烈士卫国捐躯的浩然热血与铁血气节。
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-3 h-3 rounded-full bg-cinnabar shrink-0 mt-0.5" />
                <span>
                  <strong className="text-ink">古铜金：</strong>
                  代表英雄用生命换来的今日盛世山河与和平曙光。
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Data Integrity */}
          <div className="p-3.5 rounded-md bg-cinnabar/10 border border-cinnabar/30 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-cinnabar">
              <ShieldAlert className="w-4 h-4" />
              <span>史料考据原则（严谨性声明）</span>
            </div>
            <p className="text-xs text-ink-2">
              本项目为完全开源的纯静态公益可视化项目。每条记录的人物生卒、牺牲战役、更名沿革与地理坐标，均由编者对照地名志、地方志与公开英烈名录交叉比对后录入，并逐条标注史料出处。我们不承诺绝无讹误——编者自查确认的口径问题与待核条目公开列于仓库根目录的
              <code className="mx-1 px-1 py-0.5 rounded bg-paper border border-line text-cinnabar font-mono text-[11px]">KNOWN_ISSUES.md</code>
              ；若您核实出不同结论，那将是对本项目最有价值的贡献。
            </p>
          </div>

          {/* Section 4: Contribution Entrance */}
          <div className="p-3.5 rounded-md bg-cinnabar/10 border border-cinnabar/30 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-cinnabar">
              <Landmark className="w-4 h-4" />
              <span>点亮家乡英雄地名 · 共同编纂档案</span>
            </div>
            <p className="text-xs text-ink-2 leading-relaxed">
              若您的家乡亦有以 1931–1945 年抗日英烈命名的现代县市、乡镇或城市街道尚未收录，欢迎提交 Issue 或 Pull Request。请一并附上：地名与所属区划、英烈姓名与生卒、命名主体与时间（谁、以何决议、何时命名），以及地方志或文献出处（能到卷页最佳）。数据字段与提交流程见仓库 README「参与贡献」一节。
            </p>
            {isPublished && (
              <a
                href={CONTRIBUTE_ISSUE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-cinnabar hover:text-cinnabar underline underline-offset-2"
              >
                以模板提交新增地名 →
              </a>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-line bg-paper/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded bg-cinnabar hover:bg-cinnabar text-white text-xs font-medium transition-colors cursor-pointer"
          >
            知悉并进入探索
          </button>
        </div>
      </div>
    </div>
  );
};
