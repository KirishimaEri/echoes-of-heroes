/**
 * Post-build check for the static export — run after `npm run build`.
 *
 * Why this exists: the failure that took down the 编年 and 山河 views shipped
 * green through tsc, eslint and the build. The only signal that survives all three
 * is what the rendered page actually asserts, so this checks the rendered HTML
 * against the data file it was built from:
 *
 *   1. the export exists and is asset-addressed under the repo's basePath — a
 *      basePath regression 404s every chunk on GitHub Pages;
 *   2. the headline record count equals places.json's length, so a filter or a
 *      silently dropped record can no longer hide behind a confident "已收录 N 处";
 *   3. the visible text contains no `undefined`/`NaN` — the exact fingerprint of an
 *      unhandled nullable field reaching JSX. The check strips scripts, comments and
 *      tags first: Next's RSC payload legitimately contains the token `undefined`
 *      ~18 times in the raw file, and grepping the raw HTML would fail every run
 *      for the wrong reason.
 *
 * Usage: node scripts/check_export.js [--html=out/index.html]
 *
 * --html lets the same assertions run against a saved copy — used by the negative
 * test that proves this guard actually fails on a broken export.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const arg = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=').slice(1).join('=') : null;
};
const OUT = path.join(ROOT, 'out');
const INDEX = arg('html') ? path.resolve(ROOT, arg('html')) : path.join(OUT, 'index.html');
const PLACES = path.join(ROOT, 'src/data/places.json');

const failures = [];
const note = [];
const fail = (msg) => failures.push(msg);

if (!fs.existsSync(INDEX)) {
  console.error('✖ out/index.html 不存在——请先运行 npm run build');
  process.exit(1);
}

const places = JSON.parse(fs.readFileSync(PLACES, 'utf8'));
const raw = fs.readFileSync(INDEX, 'utf8');

// 1. basePath addressing
if (!raw.includes('/echoes-of-heroes/_next/')) {
  fail(
    '导出产物中没有 /echoes-of-heroes/_next/ 资源前缀：basePath 或 assetPrefix ' +
      '与仓库名不一致时，Pages 上会全站 404'
  );
}

// Visible text only — drop scripts (RSC payload), HTML comments and tags.
const visible = raw
  .replace(/<script[\s\S]*?<\/script>/g, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z#0-9]+;/gi, ' ')
  .replace(/\s+/g, ' ');

// 2. the headline count must match the archive it was built from
const headline = visible.match(/已收录\s*(\d+)\s*处/);
if (!headline) {
  fail('首页可见文本里找不到「已收录 N 处」——统计区块可能被改坏或未被预渲染');
} else if (Number(headline[1]) !== places.length) {
  fail(`首页宣称已收录 ${headline[1]} 处，但 src/data/places.json 有 ${places.length} 条`);
} else {
  note.push(`已收录 ${headline[1]} 处 = places.json ${places.length} 条`);
}

const grid = visible.match(/现代地名卷\s*\(共\s*(\d+)\s*处\)/);
if (grid && Number(grid[1]) !== places.length) {
  fail(`名录标题写「共 ${grid[1]} 处」，与 places.json 的 ${places.length} 条不符`);
}

// 3. no leaked placeholder values in what a visitor reads
const leak = visible.match(/\b(undefined|NaN|null)\b/);
if (leak) {
  const around = visible.slice(Math.max(0, leak.index - 60), leak.index + 40);
  fail(`可见文本出现 ${leak[1]}（上下文：…${around.trim()}…）——有空值未走「待考」降级`);
}

// Location coverage, reported rather than asserted: it is a data-completeness
// number that legitimately moves as records get geocoded.
const located = visible.match(/已定位\s*(\d+)\s*处\s*·\s*余\s*(\d+)\s*处经纬待考/);
if (located) {
  const plotted = Number(located[1]);
  const pending = Number(located[2]);
  note.push(`地图图层 ${plotted} 处 · 经纬待考 ${pending} 处`);
  if (plotted + pending !== places.length) {
    fail(`已定位 ${plotted} + 待考 ${pending} ≠ ${places.length}，首页披露与数据不一致`);
  }
} else {
  note.push('（未渲染「已定位/待考」披露行——首页统计块可能被改动）');
}

note.forEach((n) => console.log('  · ' + n));
if (failures.length) {
  failures.forEach((f) => console.error('  ✖ ' + f));
  process.exit(1);
}
console.log('✓ 导出产物与数据集一致');
