# -*- coding: utf-8 -*-
"""
Echoes of Heroes 地名扩充合并脚本
加载 4 片 partial JSON -> 校验 schema -> 与基线去重 -> 跨片去重 -> 输出 new-places.json + expansion-report.md
用法: python merge_expansion.py
"""
import json
import os
import collections

BASE = r"E:\china"
OUT = r"E:\china\data-expansion"
BASELINE = os.path.join(BASE, ".baseline-names.txt")
def list_partials():
    import glob
    return sorted(glob.glob(os.path.join(OUT, "partial-*.json")))
NEW_JSON = os.path.join(OUT, "new-places.json")
REPORT = os.path.join(OUT, "expansion-report.md")

CATEGORIES = {"县市", "街道", "乡镇与村落", "历史曾用县名"}
REQUIRED = ["id", "modern_name", "former_name", "category", "province", "city",
            "coordinates", "renamed_year", "hero", "modern_status", "sources"]
HERO_REQUIRED = ["name", "birth_year", "death_year", "sacrifice_age", "title",
                 "force", "sacrifice_date", "battle", "story"]

PROVINCE_ORDER = ["黑龙江省", "吉林省", "辽宁省", "河北省", "山西省", "山东省", "北京市", "天津市",
                  "河南省", "江苏省", "安徽省", "上海市", "浙江省", "江西省", "福建省",
                  "湖北省", "湖南省", "广东省", "广西壮族自治区", "海南省", "云南省", "贵州省",
                  "四川省", "重庆市", "陕西省", "内蒙古自治区", "甘肃省", "宁夏回族自治区",
                  "青海省", "新疆维吾尔自治区", "西藏自治区", "跨省"]


def load_baseline():
    rows = []
    with open(BASELINE, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            parts = line.split("\t")
            if len(parts) >= 2:
                rows.append({"modern_name": parts[0], "province": parts[1],
                             "category": parts[2] if len(parts) > 2 else ""})
    return rows


def main():
    baseline = load_baseline()
    bkey = set((b["modern_name"], b["province"], b["category"]) for b in baseline)
    bname_prov = collections.defaultdict(list)
    for b in baseline:
        bname_prov[(b["modern_name"], b["province"])].append(b["category"])

    all_entries = []
    region_counts = {}
    for p in list_partials():
        if not os.path.exists(p):
            print("MISSING PARTIAL:", p)
            continue
        with open(p, encoding="utf-8") as f:
            data = json.load(f)
        region_counts[os.path.basename(p)] = len(data)
        all_entries.extend(data)
    print("partial counts:", json.dumps(region_counts, ensure_ascii=False))
    print("raw total:", len(all_entries))

    # ---------- 1. 校验 ----------
    issues = []
    valid = []
    for i, e in enumerate(all_entries):
        errs = []
        for k in REQUIRED:
            if k not in e:
                errs.append("missing:" + k)
        if "hero" in e:
            for k in HERO_REQUIRED:
                if k not in e["hero"]:
                    errs.append("hero.missing:" + k)
            if not e["hero"].get("name"):
                errs.append("hero.name empty")
        if e.get("category") not in CATEGORIES:
            errs.append("bad category:" + str(e.get("category")))
        if not e.get("modern_name"):
            errs.append("modern_name empty")
        if not e.get("province"):
            errs.append("province empty")
        coords = e.get("coordinates")
        if not (isinstance(coords, list) and (len(coords) == 0 or
                (len(coords) == 2 and all(isinstance(x, (int, float)) for x in coords)))):
            errs.append("bad coordinates")
        ry = e.get("renamed_year")
        if ry is not None and not isinstance(ry, int):
            errs.append("renamed_year not int/null")
        src = e.get("sources")
        if not isinstance(src, list) or len(src) == 0:
            errs.append("no sources")
        if errs:
            issues.append({"name": e.get("modern_name"), "province": e.get("province"), "errors": errs})
        else:
            valid.append(e)
    print("\n===== validation issues:", len(issues), "=====")
    for it in issues:
        print("  ", it)

    # ---------- 2. 与基线去重 (同省同名同类别) ----------
    kept = []
    dropped_baseline = []
    seen = set()
    dropped_cross = []
    for e in valid:
        key = (e["modern_name"], e["province"], e["category"])
        if key in bkey:
            dropped_baseline.append((e["modern_name"], e["province"]))
            continue
        if key in seen:
            dropped_cross.append((e["modern_name"], e["province"]))
            continue
        seen.add(key)
        kept.append(e)
    print("\ndropped vs baseline:", len(dropped_baseline), dropped_baseline)
    print("dropped cross-region:", len(dropped_cross), dropped_cross)
    print("kept after dedup:", len(kept))

    # ---------- 3. 跨层级同名复核 (同省同名不同类别, 允许但列出) ----------
    review = []
    name_prov_map = collections.defaultdict(list)
    for e in kept:
        name_prov_map[(e["modern_name"], e["province"])].append(e["category"])
    for (name, prov), cats in name_prov_map.items():
        if len(set(cats)) > 1:
            review.append("同省同名跨层级(新条目内): %s %s %s" % (name, prov, sorted(set(cats))))
    for (name, prov), bcats in bname_prov.items():
        if (name, prov) in name_prov_map:
            ncats = set(name_prov_map[(name, prov)])
            if not (set(bcats) & ncats):
                review.append("与基线同名但层级不同(允许保留): %s %s 基线%s 新增%s" % (name, prov, sorted(set(bcats)), sorted(ncats)))
    print("\n===== cross-level review:", len(review), "=====")
    for r in review:
        print("  ", r)

    # ---------- 4. id 唯一性 ----------
    ids = collections.Counter(e["id"] for e in kept)
    dup_ids = [k for k, v in ids.items() if v > 1]
    print("\nduplicate ids:", dup_ids)
    if dup_ids:
        used = set(e["id"] for e in kept)
        for d in dup_ids:
            n = 1
            for e in kept:
                if e["id"] == d:
                    while d + "-%d" % n in used:
                        n += 1
                    e["id"] = d + "-%d" % n
                    used.add(e["id"])
        print("ids fixed")

    # ---------- 5. 统计 ----------
    coords_empty = sum(1 for e in kept if len(e.get("coordinates") or []) == 0)
    year_null = sum(1 for e in kept if e.get("renamed_year") is None)
    src_counts = [len(e["sources"]) for e in kept]
    src_avg = round(sum(src_counts) / len(src_counts), 2) if src_counts else 0
    no_src = sum(1 for c in src_counts if c == 0)
    cat_counts = collections.Counter(e["category"] for e in kept)
    prov_counts = collections.Counter(e["province"] for e in kept)
    import re as _re
    date_month_only = 0
    date_missing = 0
    birth_missing = 0
    age_null = 0
    renamed_recent = 0
    for e in kept:
        sd = e["hero"].get("sacrifice_date")
        if not sd:
            date_missing += 1
        elif not _re.match(r"^\d{4}年\d{1,2}月\d{1,2}日", sd):
            date_month_only += 1
        if not e["hero"].get("birth_year"):
            birth_missing += 1
        if e["hero"].get("sacrifice_age") is None:
            age_null += 1
        if e.get("renamed_year") is not None and e["renamed_year"] > 1965:
            renamed_recent += 1
    print("\n===== stats =====")
    print("new total:", len(kept))
    print("coords empty:", coords_empty, " year null:", year_null, " src avg:", src_avg)
    print("category:", dict(cat_counts))
    print("province:", dict(prov_counts))

    # ---------- 6. 输出 new-places.json ----------
    with open(NEW_JSON, "w", encoding="utf-8") as f:
        json.dump(kept, f, ensure_ascii=False, indent=2)
    print("\nwritten:", NEW_JSON, "entries:", len(kept))

    # ---------- 7. 生成报告 ----------
    lines = []
    lines.append("# 抗战英烈命名中国地名档案 · 扩充结果报告\n")
    lines.append("> 项目：echoes-of-heroes（本地仓库 E:\\china） ｜ 生成日期：2026-10-19\n")
    lines.append("## 一、统计总览\n")
    lines.append("| 指标 | 数值 |")
    lines.append("|---|---|")
    lines.append("| 基线（原有条目） | %d 条 |" % len(baseline))
    lines.append("| 本次新增（去重后） | **%d 条** |" % len(kept))
    lines.append("| 去重后总计 | **%d 条** |" % (len(baseline) + len(kept)))
    lines.append("| 其中与基线重复被剔除 | %d 条 |" % len(dropped_baseline))
    lines.append("| 跨片区重复被剔除 | %d 条 |" % len(dropped_cross))
    lines.append("| schema 校验未通过 | %d 条 |" % len(issues))
    lines.append("")
    lines.append("**去重规则**：与基线 modern_name+province+category 完全相同者剔除；同省同名但层级不同（如县/街/村）允许保留；跨省同名允许保留（province 区分）。\n")
    gap = max(0, 300 - (len(baseline) + len(kept)))
    lines.append("**目标说明**：本次目标为扩充至 300 条。经按区域分片、多轮穷尽检索后，共核实新增 %d 条，总计 %d 条，距 300 条目标差 %d 条。缺口原因：① 严格执行“1931–1945 年对日作战/抗日工作中牺牲且官方认定烈士”的纳入标准，1946 年后解放战争/剿匪/抗美援朝时期以烈士命名的大量地名（如赵光镇、任民镇、家发镇、根思乡等）被排除；② 土地革命内战时期牺牲者（如刘志丹、谢子长）不属于抗日英烈范畴；③ 大量候选仅有纪念碑/陵园/学校而无以英烈个人姓名命名的现行或曾用建制地名，按 schema 不收；④ 部分候选命名依据无法从可追溯来源核实，按“宁缺毋滥”放弃。宁可如实缺额，不凑数编造。\n" % (len(kept), len(baseline) + len(kept), gap))

    lines.append("## 二、新增条目清单（按省份、类别分组）\n")
    by_prov = collections.defaultdict(list)
    for e in kept:
        by_prov[e["province"]].append(e)
    provs = [p for p in PROVINCE_ORDER if p in by_prov]
    provs += [p for p in by_prov if p not in PROVINCE_ORDER]
    for prov in provs:
        entries = by_prov[prov]
        entries.sort(key=lambda e: (e["category"], e["modern_name"]))
        lines.append("### %s（%d 条）\n" % (prov, len(entries)))
        cur_cat = None
        for e in entries:
            if e["category"] != cur_cat:
                cur_cat = e["category"]
                lines.append("**%s**\n" % cur_cat)
            hero = e["hero"]
            src_str = "；".join(e["sources"])
            ry = e["renamed_year"] if e["renamed_year"] is not None else "不详"
            lines.append("- **%s**（%s）｜旧称：%s｜地级市：%s｜更名年份：%s" % (
                e["modern_name"], e["category"], e["former_name"], e["city"] or "—", ry))
            lines.append("  - 英烈：%s（%s）｜部队：%s｜殉国日期：%s｜职务：%s" % (
                hero["name"], hero.get("birth_year", "") and str(hero["birth_year"]) or "生年不详",
                hero["force"], hero.get("sacrifice_date") or "不详", hero.get("title", "") or "—"))
            lines.append("  - 来源：%s" % src_str)
        lines.append("")
    lines.append("## 三、质量自检说明\n")
    lines.append("- 新增条目总数：%d 条" % len(kept))
    lines.append("- 坐标留空（未能核实经纬度，留空数组）：%d 条" % coords_empty)
    lines.append("- 更名年份不确定（null）：%d 条；其中 1966 年及以后的近年更名：%d 条" % (year_null, renamed_recent))
    lines.append("- 来源平均条数：%.2f 条/条；无来源条目：%d 条" % (src_avg, no_src))
    lines.append("- 类别分布：%s" % "、".join("%s %d 条" % (k, v) for k, v in cat_counts.items()))
    lines.append("- 殉国日期缺具体日（来源仅载月份/农历/年份精度）：%d 条；完全未载殉国日期：%d 条；生年不详：%d 条；殉国年龄不详：%d 条（以上均为来源史料所限，如实留空，未编造）" % (date_month_only, date_missing, birth_missing, age_null))
    if review:
        lines.append("\n**跨层级同名复核（均允许保留，请知悉）**：")
        for r in review:
            lines.append("- %s" % r)
    lines.append("\n## 四、原有 100 条基线清单（名称级）\n")
    base_by_prov = collections.defaultdict(list)
    for b in baseline:
        base_by_prov[b["province"]].append(b)
    for prov in [p for p in PROVINCE_ORDER if p in base_by_prov] + [p for p in base_by_prov if p not in PROVINCE_ORDER]:
        names = "、".join(b["modern_name"] for b in base_by_prov[prov])
        lines.append("- **%s**：%s" % (prov, names))
    lines.append("\n---\n*本报告由扩充数据自动生成；结构化数据见 new-places.json（可并入 src/data/places.json）。战争术语口径与仓库一致：抗日战争（第二次中日战争，1931–1945）。*")

    with open(REPORT, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print("written:", REPORT)
    print("final total:", len(baseline) + len(kept))


if __name__ == "__main__":
    main()
