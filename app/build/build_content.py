#!/usr/bin/env python3
"""Pack the handbook (Markdown + figure credits) into app/assets/js/content.js.

Run after editing any module:  python3 app/build/build_content.py
No third-party packages needed. The output is a plain <script> file so the app
works from file:// without a web server.
"""
import json
import os
import random
import re
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "app", "assets", "js", "content.js")

FA = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")
EN = str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789")

# Module groups shown on the home screen
GROUPS = [
    ("specimens", "نمونه‌ها", range(1, 10)),
    ("lab", "آزمایشگاه و کیفیت", range(10, 13)),
    ("organisms", "ارگانیسم‌ها", range(13, 25)),
]


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def rel(path):
    return os.path.relpath(path, ROOT).replace(os.sep, "/")


def title_of(md, fallback):
    m = re.search(r"^#\s+(.+)$", md, re.M)
    return strip_md(m.group(1)) if m else fallback


def strip_md(s):
    s = re.sub(r"<[^>]+>", "", s)
    s = re.sub(r"[*_`]", "", s)
    return s.strip()


def md_files(folder):
    out = []
    for dirpath, dirnames, filenames in os.walk(folder):
        dirnames[:] = sorted(d for d in dirnames if d != "Assets")
        for fn in sorted(filenames):
            if fn.endswith(".md"):
                out.append(os.path.join(dirpath, fn))
    readme = [f for f in out if os.path.basename(f) == "README.md" and os.path.dirname(f) == folder]
    rest = [f for f in out if f not in readme]
    # keep top-level files and sub-folders in natural numeric order
    rest.sort(key=lambda f: rel(f))
    return readme + rest


def plain_text(md):
    t = re.sub(r"```.*?```", " ", md, flags=re.S)
    t = re.sub(r"<[^>]+>", " ", t)
    t = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", t)
    t = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", t)
    t = re.sub(r"[#*_`>|]", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def module_list():
    mods = []
    for name in sorted(os.listdir(ROOT)):
        p = os.path.join(ROOT, name)
        if os.path.isdir(p) and re.match(r"^\d\d_", name):
            mods.append(name)
    mods.append("AST")
    mods.append("Shared")
    return mods


def parse_credits(module):
    path = os.path.join(ROOT, module, "Assets", "CREDITS.md")
    if not os.path.exists(path):
        return []
    figs = []
    for line in read(path).splitlines():
        if not re.match(r"^\| [۰-۹0-9]+\.[۰-۹0-9]+ \|", line):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) < 6:
            continue
        num, file_, caption, artist, source, lic = cells[:6]
        file_ = file_.strip("`")
        link = re.search(r"\]\(([^)]+)\)", source)
        licm = re.match(r"\[([^\]]+)\]", lic)
        figs.append({
            "num": num,
            "src": f"{module}/Assets/{file_}",
            "caption": caption,
            "artist": artist,
            "source": link.group(1) if link else "",
            "license": licm.group(1) if licm else lic,
            "svg": file_.endswith(".svg"),
        })
    return figs


ORG = re.compile(r"\*([A-Z][a-z]+(?: (?:[a-z]+|spp\.|sp\.))?)\*")


def organism(caption):
    names = []
    for m in ORG.finditer(caption):
        n = m.group(1)
        if n not in names:
            names.append(n)
    if len(names) != 1:
        return None
    n = names[0]
    return n if " " in n else None  # species-level only


# organism questions only for images that show colonies, stains or plates
IDABLE = re.compile(r"کلنی|رنگ‌آمیزی|گرم|آگار|روی محیط|اسمیر|گسترش")


def build_quiz(modules_figs, rng):
    by_mod = {}
    all_orgs = []
    for mod, figs in modules_figs.items():
        for f in figs:
            o = organism(f["caption"])
            if o and not f["svg"] and IDABLE.search(f["caption"]):
                f["organism"] = o
                by_mod.setdefault(mod, []).append(f)
                all_orgs.append(o)
    all_orgs = sorted(set(all_orgs))
    questions = []
    for mod, figs in modules_figs.items():
        for f in figs:
            fid = f["src"]
            if f.get("organism"):
                target = f["organism"]
                genus = target.split()[0]
                pool = [x for x in sorted({g["organism"] for g in by_mod.get(mod, [])}) if x != target]
                same_genus = [x for x in all_orgs if x.split()[0] == genus and x != target]
                pool = list(dict.fromkeys(same_genus + pool + [x for x in all_orgs if x != target]))
                distract = pool[:2] + rng.sample(pool[2:], min(1, len(pool[2:]))) if len(pool) > 3 else pool[:3]
                if len(distract) == 3:
                    opts = [target] + distract
                    rng.shuffle(opts)
                    questions.append({"id": "org:" + fid, "kind": "organism", "module": mod, "fig": fid,
                                      "prompt": "این تصویر مربوط به کدام ارگانیسم است؟",
                                      "options": opts, "answer": opts.index(target)})
            others = [g["caption"] for g in figs if g["caption"] != f["caption"]]
            if len(others) >= 3:
                opts = [f["caption"]] + rng.sample(others, 3)
                rng.shuffle(opts)
                questions.append({"id": "cap:" + fid, "kind": "caption", "module": mod, "fig": fid,
                                  "prompt": "کدام توضیح با این تصویر مطابقت دارد؟",
                                  "options": opts, "answer": opts.index(f["caption"])})
    return questions


LEVEL = {"🟢": 1, "🟡": 2, "🔴": 3}


def split_blocks(md, word):
    blocks = {}
    parts = re.split(r"^### ", md, flags=re.M)
    for p in parts[1:]:
        head, _, body = p.partition("\n")
        m = re.match(word + r" ([۰-۹0-9]+)\s*(🟢|🟡|🔴)?\s*[—-]?\s*(.*)", head)
        if not m:
            continue
        n = int(m.group(1).translate(EN))
        body = re.split(r"^(?:## |---\s*$|</div>)", body, flags=re.M)[0].strip()
        blocks[n] = {"title": strip_md(m.group(3)), "level": LEVEL.get(m.group(2), 0), "md": body}
    return blocks


def build_cases(mod):
    folder = os.path.join(ROOT, mod)
    scen = [f for f in os.listdir(folder) if "Scenarios" in f and f.endswith(".md")]
    ans = [f for f in os.listdir(folder) if "Answers" in f and f.endswith(".md")]
    if not scen or not ans:
        return []
    s = split_blocks(read(os.path.join(folder, scen[0])), "سناریو")
    a = split_blocks(read(os.path.join(folder, ans[0])), "پاسخ")
    out = []
    for n in sorted(s):
        if n in a:
            out.append({"id": f"{mod}#{n}", "module": mod, "n": n, "title": s[n]["title"],
                        "level": s[n]["level"], "q": s[n]["md"], "a": a[n]["md"]})
    return out


def main():
    rng = random.Random(42)
    modules, docs, figs_all, cases = [], {}, {}, []
    for mod in module_list():
        folder = os.path.join(ROOT, mod)
        files = md_files(folder)
        readme = os.path.join(folder, "README.md")
        mtitle = title_of(read(readme), mod) if os.path.exists(readme) else mod
        num = int(mod[:2]) if mod[:2].isdigit() else None
        group = next((g for g, _, r in GROUPS if num in r), "reference")
        doc_ids = []
        for f in files:
            md = read(f)
            did = rel(f)
            docs[did] = {"id": did, "module": mod, "title": title_of(md, os.path.basename(f)), "md": md,
                         "text": plain_text(md)}
            doc_ids.append(did)
        figs = parse_credits(mod)
        if figs:
            figs_all[mod] = figs
        cases += build_cases(mod)
        modules.append({"id": mod, "num": num, "title": mtitle, "group": group, "docs": doc_ids,
                        "figures": len(figs)})
    root_readme = os.path.join(ROOT, "README.md")
    docs["README.md"] = {"id": "README.md", "module": None, "title": title_of(read(root_readme), "README"),
                         "md": read(root_readme), "text": plain_text(read(root_readme))}
    # where each figure appears in the text
    for mod, figs in figs_all.items():
        for f in figs:
            base = os.path.basename(f["src"])
            f["doc"] = next((d for d in modules_docs(modules, mod) if base in docs[d]["md"]), None)
    quiz = build_quiz(figs_all, rng)
    figures = {f["src"]: f for figs in figs_all.values() for f in figs}
    data = {"built": __import__("datetime").date.today().isoformat(), "groups": [[g, t] for g, t, _ in GROUPS] + [["reference", "منابع مشترک"]],
            "modules": modules, "docs": docs, "figures": figures, "quiz": quiz, "cases": cases}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write("/* Generated by app/build/build_content.py; do not edit by hand. */\n")
        fh.write("window.CM_DATA = ")
        json.dump(data, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write(";\n")
    print(f"modules {len(modules)}, docs {len(docs)}, figures {len(figures)}, "
          f"quiz {len(quiz)}, cases {len(cases)}, {os.path.getsize(OUT) // 1024} KB")


def modules_docs(modules, mod):
    return next(m["docs"] for m in modules if m["id"] == mod)


if __name__ == "__main__":
    sys.exit(main())
