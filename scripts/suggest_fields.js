/**
 * Proposes values for the archive fields the 294-record expansion left empty.
 *
 * Everything here is *extraction from the record's own text*, never invention:
 * each suggestion carries the sentence it came from, so a human can check the
 * evidence without re-opening the 方志. Unmatched fields stay empty on purpose —
 * the UI renders them as 待考, which is a true statement; a plausible-looking
 * year is not.
 *
 * Rules, in order of confidence:
 *   T1  sacrifice_age   explicit 「年仅/时年/年…岁」 in the story
 *   T2  sacrifice_age   death_year − birth_year, individuals only (collective
 *                       entries such as 七七抗战阵亡将士群体 deliberately break
 *                       that identity — see KNOWN_ISSUES.md)
 *   T3  sacrifice_date  a full 「YYYY年M月D日」 sitting in the same clause as a
 *                       sacrifice verb
 *   ---- report only ----
 *   T4  renamed_year    a 「YYYY年」 in the same clause as a naming verb. Not
 *                       auto-applied: clause proximity cannot tell the naming of
 *                       this place from another act mentioned beside it.
 *
 * Usage:
 *   node scripts/suggest_fields.js            # report only
 *   node scripts/suggest_fields.js --apply    # write tiers T1-T3 into places.json
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PLACES = path.join(ROOT, 'src/data/places.json');
const REPORT = path.join(ROOT, 'scripts/data/field_suggestions.md');
const JSON_OUT = path.join(ROOT, 'scripts/data/field_suggestions.json');
const APPLY = process.argv.includes('--apply');

/** Collective-entry markers: age arithmetic must not be applied to these. */
const COLLECTIVE = /(群体|全体|将士|烈士群|等\d*[余数]*人|阵亡将士|官兵)/;
/** Two or more names sharing one record: birth/death arithmetic is meaningless. */
const MULTI_PERSON = /[、，,]/;
const AGE_RE = /(年仅|时年|牺牲时|就义时|殉国时|牺牲年仅|年)\s*(\d{1,2})\s*岁/;
const SACRIFICE_VERB = /(殉国|牺牲|就义|遇害|战死|阵亡|中弹|被捕|捐躯|牺牲于|就义于|罹难)/;
const DATE_RE = /(19\d{2})年(\d{1,2})月(\d{1,2})日/g;
const YEAR_RE = /(19\d{2})年/g;
const NAMING_VERB = /(命名|更名|改名|改为|定名|易名|称其|誉为.*名|建…|设立?县|设区|置县)/;

const clauses = (text) => String(text || '').split(/(?<=[。；;!?])/).map((s) => s.trim()).filter(Boolean);

/** 1942 + 1907 -> 35; null when the arithmetic is not meaningful. */
function derivedAge(rec) {
  const b = rec.hero.birth_year;
  const d = rec.hero.death_year;
  if (typeof b !== 'number' || typeof d !== 'number') return null;
  if (COLLECTIVE.test(rec.hero.name) || MULTI_PERSON.test(rec.hero.name)) return null;
  const age = d - b;
  return age > 5 && age < 90 ? age : null;
}

function explicitAge(rec) {
  const m = rec.hero.story && rec.hero.story.match(AGE_RE);
  if (!m) return null;
  const age = parseInt(m[2], 10);
  return age > 5 && age < 90 ? { value: age, evidence: m[0] } : null;
}

function derivedDate(rec) {
  if (rec.hero.sacrifice_date) return null;
  for (const c of clauses(rec.hero.story)) {
    if (!SACRIFICE_VERB.test(c)) continue;
    DATE_RE.lastIndex = 0;
    const m = DATE_RE.exec(c);
    if (m) {
      return {
        value: `${m[1]}年${m[2]}月${m[3]}日`,
        evidence: c.slice(0, 60),
      };
    }
  }
  return null;
}

/** Naming year: single candidate, in a clause with a naming verb, after the death year. */
function derivedRenamedYear(rec) {
  if (rec.renamed_year) return null;
  const floor = typeof rec.hero.death_year === 'number' ? rec.hero.death_year : 1931;
  const candidates = [];
  for (const c of clauses(rec.hero.story || '') .concat(clauses(rec.modern_status))) {
    if (!NAMING_VERB.test(c)) continue;
    YEAR_RE.lastIndex = 0;
    let m;
    while ((m = YEAR_RE.exec(c))) {
      const y = parseInt(m[1], 10);
      if (y > floor && y <= 2026) candidates.push({ value: y, evidence: c.slice(0, 60) });
    }
  }
  const unique = [...new Set(candidates.map((c) => c.value))];
  if (unique.length === 0) return null;
  if (unique.length > 1) return { review: unique, candidates };
  return candidates[0];
}

const places = JSON.parse(fs.readFileSync(PLACES, 'utf8'));
const tiers = { T1_age: [], T2_age_arith: [], T3_date: [], review: [] };

for (const rec of places) {
  if (rec.hero.sacrifice_age == null) {
    const ex = explicitAge(rec);
    if (ex) {
      tiers.T1_age.push({ id: rec.id, name: rec.hero.name, ...ex });
      if (APPLY) rec.hero.sacrifice_age = ex.value;
    } else {
      const ar = derivedAge(rec);
      if (ar !== null) {
        tiers.T2_age_arith.push({
          id: rec.id,
          name: rec.hero.name,
          value: ar,
          evidence: `${rec.hero.birth_year} — ${rec.hero.death_year}`,
        });
        if (APPLY) rec.hero.sacrifice_age = ar;
      }
    }
  }
  if (!rec.hero.sacrifice_date) {
    const d = derivedDate(rec);
    if (d) {
      tiers.T3_date.push({ id: rec.id, name: rec.hero.name, ...d });
      if (APPLY) {
        rec.hero.sacrifice_date = d.value;
        if (rec.hero.death_year == null) rec.hero.death_year = parseInt(d.value, 10);
      }
    }
  }
  const ry = derivedRenamedYear(rec);
  // Report-only: a year next to a naming verb is not necessarily the naming of
  // *this* place (1948 改名翰章屯 / 1985 建王龙亭 / 1945 改名学勉公学 were all
  // false positives in the first run). A human confirms each against the 方志.
  if (ry && !ry.review) {
    tiers.review.push({
      id: rec.id,
      name: rec.hero.name,
      candidates: [ry.value],
      evidence: ry.evidence,
    });
  } else if (ry && ry.review) {
    tiers.review.push({
      id: rec.id,
      name: rec.hero.name,
      candidates: ry.review,
      evidence: ry.candidates.map((c) => c.evidence).join(' ⹂ '),
    });
  }
}

fs.writeFileSync(
  JSON_OUT,
  JSON.stringify({ generatedAt: new Date().toISOString(), applied: APPLY, tiers }, null, 2),
  'utf8'
);

const lines = ['# 字段补全建议（仅从条目自身文本提取，待人工复核）', ''];
const bucketLabels = {
  T1_age: 'T1 殉国年岁 —— 志文明确「年仅/时年 N 岁」',
  T2_age_arith: 'T2 殉国年岁 —— 卒年减生年（仅限单人条目）',
  T3_date: 'T3 殉国日期 —— 同句内含牺牲动词的完整日期',
  review: '待人工核对 —— 更名年份（句中年份未必指此地命名）',
};
for (const [key, label] of Object.entries(bucketLabels)) {
  const rows = tiers[key] || [];
  lines.push(`## ${label}（${rows.length} 条）`, '');
  if (!rows.length) {
    lines.push('_无_', '');
    continue;
  }
  if (key === 'review') {
    lines.push('| id | 英烈 | 候选年份 | 依据句 |', '| --- | --- | --- | --- |');
    rows.forEach((r) =>
      lines.push(
        `| ${r.id} | ${r.name} | ${r.candidates.join(' / ')} | ${String(r.evidence || '').replace(/\|/g, '\\|')} |`
      )
    );
  } else {
    lines.push('| id | 英烈 | 建议值 | 依据 |', '| --- | --- | --- | --- |');
    rows.forEach((r) =>
      lines.push(`| ${r.id} | ${r.name} | ${r.value} | ${String(r.evidence).replace(/\|/g, '\\|')} |`)
    );
  }
  lines.push('');
}
fs.writeFileSync(REPORT, lines.join('\n'), 'utf8');

if (APPLY) {
  fs.writeFileSync(PLACES, JSON.stringify(places, null, 2), 'utf8');
  console.log('applied tiers T1-T4 into src/data/places.json');
}
console.log(
  Object.entries(tiers)
    .map(([k, v]) => `${k}: ${v.length}`)
    .join(' · ')
  + `\nreport: ${REPORT}`
);
