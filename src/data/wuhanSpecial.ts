export interface WuhanRoadFeature {
  id: string;
  name: string;
  heroName: string;
  heroRank: string;
  sacrificeBattle: string;
  storyBrief: string;
  color: string;
  path: [number, number][]; // [lat, lng] format for Leaflet
}

export const WUHAN_ROADS: WuhanRoadFeature[] = [
  {
    id: 'zhangzizhong-road-wuhan',
    name: '张自忠路',
    heroName: '张自忠',
    heroRank: '国民革命军第33集团军总司令 · 追赠陆军二级上将',
    sacrificeBattle: '1940年5月16日 · 湖北枣宜会战南瓜店激战',
    storyBrief:
      '同盟国牺牲最高将领之一。枣宜会战亲率特务营东渡襄河截敌主力，南瓜店遭重围中数弹仍挺立督战壮烈牺牲。毛泽东题词“尽忠报国”，周恩来誉其“英风足以动世界”。',
    color: '#a4321f',
    path: [
      [30.6038, 114.305],
      [30.601, 114.3082],
      [30.5985, 114.3108],
    ],
  },
  {
    id: 'haomengling-road-wuhan',
    name: '郝梦龄路',
    heroName: '郝梦龄',
    heroRank: '国民革命军第9军军长 · 追赠陆军上将',
    sacrificeBattle: '1937年10月16日 · 山西太原会战忻口战役',
    storyBrief:
      '全面抗战爆发后全国第一位壮烈殉国的军长。忻口战役南怀化争夺战中亲临距日军阵地仅200米第一线堑壕督战，反击组织冲锋中中弹殉国。出征遗书：“抱定牺牲决心，不能成功即成仁。”',
    color: '#a4321f',
    path: [
      [30.6008, 114.302],
      [30.5982, 114.3052],
      [30.5958, 114.3078],
    ],
  },
  {
    id: 'liujiaqi-road-wuhan',
    name: '刘家麒路',
    heroName: '刘家麒',
    heroRank: '国民革命军第9军第54师师长 · 追赠陆军少将',
    sacrificeBattle: '1937年10月16日 · 山西太原会战忻口战役',
    storyBrief:
      '湖北武昌人，与郝梦龄军长并肩战斗。忻口战役中率54师坚守南怀化主阵地同日寇血战数昼夜，10月16日凌晨在组织反击突破时与郝梦龄军长同日同地遭敌机枪射中壮烈殉国。',
    color: '#a4321f',
    path: [
      [30.6052, 114.3068],
      [30.6026, 114.3098],
      [30.6002, 114.3125],
    ],
  },
  {
    id: 'chenhuaimin-road-wuhan',
    name: '陈怀民路',
    heroName: '陈怀民',
    heroRank: '中国空军第四航空大队第23中队少尉 · 追赠空军中尉',
    sacrificeBattle: '1938年4月29日 · 武汉会战“四二九大空战”',
    storyBrief:
      '世界空战史上与敌机对撞殉国第一人。武汉空战中战机油箱中弹起火受重伤，在完全可以跳伞求生的危急时刻，毅然加足马力操纵烈焰战机对准敌长机猛烈撞击，与敌同归于尽。',
    color: '#a4321f',
    path: [
      [30.6072, 114.309],
      [30.6045, 114.312],
      [30.602, 114.3148],
    ],
  },
];

export const SHENGLI_STREET = {
  name: '胜利街 (Shengli Street)',
  significance:
    '1946年抗战胜利后收回汉口日租界，汉口市政府在城市规划中做出了极其庄严而深邃的命名设计：将四条平行的主要街道分别命名为张自忠路、郝梦龄路、刘家麒路、陈怀民路，而横切穿行其间、与这四条英烈路直角垂直交汇贯通的主干道命名为“胜利街”——寓意“中华将士以浩然碧血与英雄之躯开道，条条英雄之路，最终引向全民族抵抗侵略的伟大胜利”。',
  color: '#a4321f',
  path: [
    [30.595, 114.3015],
    [30.5982, 114.3052],
    [30.601, 114.3082],
    [30.6026, 114.3098],
    [30.6045, 114.312],
    [30.608, 114.316],
  ] as [number, number][],
};
