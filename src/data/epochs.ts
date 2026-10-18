/**
 * Chronological epochs for the timeline view (`ChronologyTimeline`).
 *
 * Every record in `places.json` MUST match at least one epoch, otherwise it is
 * silently dropped from the timeline while the view header still counts it —
 * exactly the class of bug fixed for `jiangsu-zhenghong-town` (1925) in
 * AUDIT-REPORT-2.md R1. `scripts/epochs.test.ts` guards this invariant.
 */
export interface EpochMilestone {
  yearRange: string;
  badge: string;
  title: string;
  epigraph: string;
  yearMatch: (year: number) => boolean;
}

export const EPOCHS: EpochMilestone[] = [
  {
    yearRange: '1924–1930',
    badge: '抗战前驱',
    title: '五卅惊雷 · 大地先记下他们的名字',
    epigraph:
      '九一八的炮声尚未响起，反帝抗争已先在1925年的五卅运动中流血。共产党员顾正红被日商纱厂枪杀，点燃了五卅风暴；抗战期间新四军在盐阜根据地将其故里命名为正红区（今正红镇），让大地在国难岁月里先刻下烈士之名。',
    yearMatch: (y) => y >= 1924 && y <= 1930,
  },
  {
    yearRange: '1931–1936',
    badge: '局部抗战',
    title: '九一八事变 · 白山黑水烽烟起',
    epigraph:
      '1931年九一八事变爆发，东三省沦陷。中国共产党率先发出抗日武装宣言，东北抗日联军与义勇军在零下四十度的茫茫雪原中打响了长达十四年抗战的第一枪。',
    yearMatch: (y) => y >= 1931 && y <= 1936,
  },
  {
    yearRange: '1937',
    badge: '全面抗战爆发',
    title: '卢沟桥事变与淞沪喋血 · 血肉筑长城',
    epigraph:
      '七七事变爆发，全国抗日战争全面展开。北平南苑保卫战二十九军高级将领裹伤死战；淞沪会战宝山城姚子青营六百壮士与城共存亡，彻底击碎日寇“三月灭华”狂言。',
    yearMatch: (y) => y === 1937,
  },
  {
    yearRange: '1938',
    badge: '武汉会战',
    title: '保卫大武汉 · 长空浩气与战略相持',
    epigraph:
      '日寇沿长江西进企图逼降。保卫大武汉战役中，中国空军健儿与敌血战长空，“四二九”空战陈怀民烈火中毅然加足马力撞向敌机，以身许国，威震东亚。',
    yearMatch: (y) => y === 1938 || y === 1939,
  },
  {
    yearRange: '1940',
    badge: '相持阶段与百团大战',
    title: '绝境孤忠与百团破袭 · 民族脊梁',
    epigraph:
      '抗战进入最艰难的战略相持阶段。东北抗联杨靖宇将军在严寒重围中断粮数日，以棉絮树皮裹腹战至最后一弹；枣宜会战张自忠上将渡襄河力战殉国；百团大战名扬四海。',
    yearMatch: (y) => y === 1940 || y === 1941,
  },
  {
    yearRange: '1942',
    badge: '太行反扫荡',
    title: '太行山血战与反扫荡 · 名将以身殉国家',
    epigraph:
      '日寇对敌后抗日根据地实行惨无人道的严密大扫荡。八路军副总参谋长左权血沃太行十字岭；东北抗联第二路军副总指挥赵尚志在松花江畔遭敌特偷袭誓死不屈。',
    yearMatch: (y) => y === 1942,
  },
  {
    yearRange: '1943–1944',
    badge: '黎明前的坚守',
    title: '平原敌后反扫荡 · 胜利曙光渐至',
    epigraph:
      '抗战进入战略反攻准备期。八路军冀鲁边黄骅烈士遭叛徒暗杀，冀鲁豫马本斋积劳成疾逝于前线，英烈热血汇聚成黎明破晓前最悲壮的火种。',
    yearMatch: (y) => y >= 1943 && y <= 1944,
  },
  {
    yearRange: '1945–1946+',
    badge: '抗战胜利与山河易名',
    title: '胜利凯歌高奏 · 山河同名世代相传',
    epigraph:
      '1945年8月抗日战争取得伟大胜利。为永志先烈功绩，人民与各级政府将英雄牺牲处、根据地首府及都会大道以其英名重新命名，山河以英雄为名，永不褪色。',
    yearMatch: (y) => y >= 1945,
  },
];
