# 技术说明（面向开发者）

> 本文件面向需要构建、扩展或审查代码的开发者。普通读者阅读主 [README](./README.md) 即可。

## 技术栈

| 模块 | 方案 |
| :--- | :--- |
| 前端框架 | Next.js 16（App Router，Turbopack） |
| 语言 | TypeScript 5 |
| 样式 | Tailwind CSS v4 |
| 地图 | Leaflet / React Leaflet（Canvas 渲染） |
| 动画 | Framer Motion |
| 图标 | lucide-react |

环境要求：**Node.js ≥ 20.9**（由 `next@16` 的 `engines` 字段强制；Node 18 无法构建）。

## 目录结构

```
src/
├── app/
│   ├── layout.tsx             # 全局元数据（系统字体栈，零 webfont）
│   ├── page.tsx               # 首页聚合视图（状态驱动：碑林 / 编年 / 山河）
│   └── globals.css            # 「碑拓」设计系统：纸墨朱三阶 token + 显影/落印动画
├── components/
│   ├── Header.tsx             # 印章化页头（与筛选栏合并为整体吸顶单元）
│   ├── HeroSection.tsx        # 碑拓首屏：巨字标题 + 竖排导语 + 碑刻式统计行
│   ├── FilterBar.tsx          # 无框工具条（下划线墨笔搜索 + 朱砂底笔切换）
│   ├── MonumentGrid.tsx       # 碑林名录网格（CSS 显影动画）
│   ├── MonumentCard.tsx       # 拓片条目卡片（无盒无影，hover 落朱砂竖笔）
│   ├── ChronologyTimeline.tsx # 碑额纪年时间轴（虚线脊柱 + 朱砂拓钉）
│   ├── PastPresentDialog.tsx  # 「古今对话」志书弹窗（墨签条 + 双栏界格）
│   ├── HistoricalContextModal.tsx # 史料考据说明与贡献入口弹窗
│   └── Map/
│       ├── index.tsx                # Next.js 动态载入（禁用 SSR）封装
│       ├── LeafletMap.tsx           # 核心地图（Canvas 渲染 + DivIcon 缓存池 + LOD 网格聚合）
│       ├── MapSideDetailPanel.tsx   # 左右分栏推拉式史料档案抽屉（含居中微脉冲）
│       ├── ThematicSpecialPanel.tsx # 城市空间微专题互动叙事抽屉
│       └── WuhanSpecialPanel.tsx    # 武汉四条平行英烈路专题抽屉
├── lib/
│   ├── places.ts              # 数据访问层：筛选、统计、年份边界派生
│   └── site.ts                # 站外 URL 单一来源（REPO_OWNER / SITE_URL）
├── types/
│   └── place.ts               # HeroPlace / FilterState 类型定义
└── data/
    ├── places.json            # 100 处考据地名主数据（由脚本生成）
    ├── epochs.ts              # 编年史 epoch 分段（回归测试守卫覆盖完整性）
    ├── thematics.ts           # 城市空间微专题坐标与叙事数据
    └── wuhanSpecial.ts        # 武汉英烈路专题数据
```

## 关键实现说明

### 1. Leaflet 图标缓存池

Leaflet 在处理大量自定义 `divIcon` 时，频繁的 DOM 创建与销毁会导致 React 微卡顿。`LeafletMap.tsx` 中构建了单例图标缓存池（`monumentIconCache` / `clusterIconCache`），使 100+ 标记点在平移与重渲染时复用同一 `L.DivIcon` 实例，不再重复构造图标对象与 DOM 片段。

### 2. HTML5 Canvas 硬件矢量加速

开启 `preferCanvas={true}`，所有专题路径、边界线均绘制于单个 Canvas 画布，避免 SVG 树节点爆炸。

### 3. LOD 智能空间聚合（Grid Clustering）

大尺度全国视角（Zoom < 8）下自动进行轻量级网格聚合显示片区徽章；放大时无缝散开为精确地标，兼顾宏观气势与微观精度。

### 4. 纯静态导出

`next.config.ts` 配置 `output: 'export'`，产物为纯静态 HTML/JS/CSS，无服务端依赖，可直接托管于 GitHub Pages、Cloudflare Pages 或任意静态服务器。

### 5. 离线能力边界（诚实说明）

代码与数据完全本地化（Leaflet 本体已打包进产物，无 CDN 依赖），因此**碑林名录与编年史视图离线可全功能使用**；地图视图的瓦片为运行时网络请求，断网时底图区域为空白，但标记、专题路径与档案抽屉的数据仍来自本地。底图仅保留高德（AutoNavi）两套，因其按官方画法渲染国界；不提供 OSM 等境外瓦片源，原因见 [`KNOWN_ISSUES.md`](./KNOWN_ISSUES.md) 第 5 条。

## 构建与验证

```bash
npm run typecheck   # 类型检查（独立于构建）
npm run lint        # ESLint
npm test            # 回归测试（时间轴 epoch 覆盖完整性）
npm run build       # 生成静态产物到 out/
npx serve out       # 本地预览（output: "export" 模式下 next start 不可用，须用静态服务器）
```

## 数据管线

- `scripts/data/sector1.json` … `sector5.json`：五大板块源数据（人工维护）
- `node scripts/merge_places.js`：合并生成 `src/data/places.json`
- `scripts/epochs.test.ts`：时间轴分段覆盖回归测试（`npm test` 运行）

⚠️ 不要直接修改 `src/data/places.json`——它是生成产物，任何人执行 merge 脚本都会用源文件整体覆盖它。字段说明与提交流程见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 已知边界

坐标轴序不一致、枚举取值未归一、无自动化 CI 等结构性问题，以及数据口径问题与待核条目，均公开列于 [`KNOWN_ISSUES.md`](./KNOWN_ISSUES.md)。
