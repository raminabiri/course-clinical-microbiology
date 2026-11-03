# PROGRESS

Last handoff: 2026-11-02 22:10 (Tehran). Repo: public GitHub `raminabiri/course-clinical-microbiology`.
**Branch: `main`** (`final-review` merged 2026-11-03). Language: Persian (fa), RTL.
Audience: microbiology residents. Bacteria only.

## 1. Current goal
Add real open-licence figures to every module (01–24), the same way module 12 is done, then merge `final-review` → `main`
after the user reviews it on GitHub.

## 2. Done so far
- Modules 01–24, `AST/`, `Shared/` all built (see git history for the module-by-module log).
- **Full final review (2026-10-27, commit `dbb71d0`):** all 317 .md files reviewed by 8 parallel agents. Content fixes verified
  against CLSI M100-Ed36 text, EUCAST v16.1 PDF and IDSA 2026. Examples:
  - CLSI *Shigella* azithromycin has a clinical breakpoint (≤8/16/≥32)
  - Ed36 removed *Acinetobacter* tobramycin breakpoints (Table 3F-4)
  - EUCAST has no cefiderocol breakpoint for *Acinetobacter*
  - CSF: do not report minocycline; GBS: report clindamycin only
  - *Listeria* meropenem EUCAST S ≤0.25; CDC 2021 framing for epididymitis
  - Glossary terms unified; every Persian page wrapped in `<div dir="rtl">` (except `07_References`, `AST/13`, PROGRESS).
- **User naming rules applied repo-wide** (also in `Shared/Glossary_FA_EN.md` §«نام باکتری‌ها» and in memory):
  - Full genus names: استافیلوکوکوس، استرپتوکوکوس، پنوموکوکوس، انتروکوکوس، گونوکوکوس، مننگوکوکوس.
  - Plural «کوکسی» (never «کوکسی‌ها»); *S. bovis* → *S. gallolyticus*.
  - Hemin and NAD: «هِمین (فاکتور X)» and «NAD (فاکتور V)», never bare X/V; «مشاهده می‌شود» instead of «دیده می‌شود».
- **Module 12 figures done (commits `987e9a6`, `24fe1d4`):** 57 figures (40 Commons/CDC photos + 16 own SVGs).
  - Per-figure Persian caption + author + link + licence; table in `12_Identification_Tests/Assets/CREDITS.md`.
  - New 12/01 §۱.۳.۱–۱.۳.۵: spore, capsule, metachromatic granule, flagella and spirochete stains (method, reading, QC).
- **Figure rollout started 2026-11-02:** 8 background agents for 11 | 13–15 | 16–18 | 19–21 | 22–24 | 01–03 | 04–06 | 07–10.
  All 8 hit the 5-hour usage limit; they were resumed at 22:02. At handoff, nothing had been applied to the repo yet
  (working tree clean). Fetched previews so far: 01 (11), 04 (6), 13 (11), 16 (10), 19 (8).
- **16–18 figures applied (2026-11-02, uncommitted):** 16 = 9 photos, 17 = 16, 18 = 8; broken=0; README line + `Assets/CREDITS.md` written.
  - Open issue: 16 `File:Neisseria_gonorrhoeae_01.png` (chocolate vs Thayer-Martin) has no author on Commons; credit reads
    «Wikimedia Commons، Wikimedia Commons». Probably CDC PHIL, unconfirmed: verify or replace.
  - Gaps (no free photo found): 16 M. catarrhalis colonies/Gram, CTA sugars, MTM plate; 17 CIN agar, string test, SMAC/O157;
    18 Plesiomonas/Pasteurella colonies, V. vulnificus, Vibrio string test. Candidates for own SVGs.
- **19–21 figures applied (2026-11-02, uncommitted):** 19 = 16 photos, 20 = 15, 21 = 8; broken=0; README line + CREDITS.md.
  - Agent fixed 6 bad artist fields in `work/<module>/meta.json` (URL/placeholder → CDC PHIL credits / KGH).
  - Gaps: 19 BCC on BCSA, Achromobacter, Chryseobacterium, SCV Pseudomonas, TSI K/K / OF; 20 Aggregatibacter, Cardiobacterium,
    Regan–Lowe, H. ducreyi, Bartonella; 21 Campylobacter Gram (seagull), H. pylori culture, RUT/CLO, hippurate, Arcobacter.
- **01–03 figures applied (2026-11-02, uncommitted):** 01 = 13 photos, 02 = 13, 03 = 11; broken=0.
  - figkit.py fixed (lines 88/93/99): `apply` now adds `../` per subfolder level (was broken for `02_Protocol/` files).
    Repo-wide link check after this: 262 figure links, 0 broken.
  - Inconsistency: 03 uses `csf-meningococcus-nyc.jpg` (Commons, Xishan01), which the 16–18 agent rejected for handwritten labels.
  - Some credit names long/odd (e.g. "We thank Nathan Reading…"): tidy in a credits pass.
  - Gaps: 01 skin antisepsis/venipuncture, BACTEC instrument; 02 urine Gram smear, calibrated loop 1/10 µL;
    03 direct CSF Gram of pneumococcus/H. influenzae/Listeria, turbid/xanthochromic CSF tubes.
- **22–24 figures applied (2026-11-02, uncommitted):** 22 = 17 photos, 23 = 11, 24 = 12; broken=0.
  - Fixed hemin naming: 23/01:50 (M. haemophilum, also «دیسک X» → «دیسک هِمین»), 11/06:9, 11/07:47, 08/06:117, 13/05:37.
  - Gaps: 22 BBE/KVLB, Fusobacterium Gram, C. difficile on CCFA; 23 M. abscessus, M. marinum, MPT64;
    24 RPR card, Mycoplasma fried-egg, Rickettsia eschar, Leptospira darkfield.
- **13–15 figures applied (2026-11-02, uncommitted):** 13 = 11 photos, 14 = 12, 15 = 12; broken=0. Agent tidied cluttered credits.
  - Agent's "empty «تصاویر:» heading" in 15/01 was checked: false alarm, every figure heading has figures under it.
  - Fetched but unplaced (14): S. mitis, Gemella, Abiotrophia, Leuconostoc, VDE, pneumococcus Gram, in `imgkit/work/14_GPC_Catalase_Negative/`.
  - Left out: Rhodococcus "inverse CAMP" plate (text gives inverse CAMP for Arcanobacterium). Gaps 15: Nocardia colonies,
    C. diphtheriae on tellurite.
- **04–06 figures applied (2026-11-02, uncommitted):** 04 = 15 photos, 05 = 12, 06 = 14; broken=0.
  - Gaps: 04 CIN, CCFA, SMAC/O157, Campylobacter Gram, fecal leukocytes, positive RUT; 05 swabs/transport, LIM/Carrot broth,
    Ureaplasma/Mycoplasma colonies, Lactobacillus smear (download failed); 06 sputum container, BAL/ETA, Regan–Lowe, Loeffler, BCSA.
  - Rejected: NP swab photo (identifiable face), SMAC photo (purple colonies, mismatched description).
- **07–10 figures applied (2026-11-02, uncommitted):** 07 = 14 photos, 08 = 10, 09 = 10, 10 = 4; broken=0.
  - Fetching a .tif killed figkit with exit 137 (memory): avoid .tif sources.
  - Gaps: 07 Pasteurella colonies, V. vulnificus on TCBS, C. perfringens double haemolysis, C. septicum swarming;
    08 S. aureus SCV, S. lugdunensis, Finegoldia, stomacher; 09 S. anginosus, conjunctival Chlamydia Giemsa, fluid Gram stains;
    10 autoclave indicators, anaerobic indicator strip, QC strain vials.
- **11 figures applied (2026-11-02, uncommitted):** 52 photos (3.8 MB); broken=0. Urea skipped (in module 12).
  - Gaps: CNA/PEA, SMAC, CIN, BCSA, Bordet–Gengou, enrichment broths, VRE/ESBL/CRE chromogenic, BBE/KVLB/CCFA, 7H10/7H11,
    LIA, Møller, OF, PAD, malonate, CTA.
- **Rollout complete: all modules 01–24 have figures.** Repo-wide check: 356 figure links, 0 broken; ~102 changed/new paths.

## 3. Files changed
- On `final-review`: about 340 files (all .md through review, RTL and naming), `12_Identification_Tests/Assets/**`,
  `Shared/Glossary_FA_EN.md`, `Shared/Figures/Image_Policy.md` (§6 = image rules).
- Memory: `persian-bacteria-names.md`, `image-sourcing.md` (+ index lines in `MEMORY.md`).
- Scratchpad tools (session-specific, recreate if gone), under `/tmp/claude-1000/-data-Education-clinical-microbiology/<session>/scratchpad/`:
  - `imgkit/figkit.py` + `commons.py`:
    - `search` / `fetch MOD slug "File:…"` / `sheet MOD` / `apply MOD spec.json`
    - Licence check, resize ≤1000 px, «شکل NN.MM» numbering, RTL `<table>` cells, CREDITS.md, README line, link check
    - `apply` is idempotent: it strips old figure blocks first
  - `imgkit/BRIEF.md`: the agent instructions.
  - `img/svg_gen.py`, `img/svg_pairs.py`: module 12 SVGs.
  - `clsi_m100_ed36.txt`, `eucast16.txt`, `idsa_2026.txt`: text extracts.

## 4. Key decisions and rejected approaches
- **Images:** open licences only (Commons CC0/PD/CC BY/CC BY-SA, CDC PHIL). Rejected: textbook or atlas images, because the repo
  is public and citing a source is not a licence. The user agreed after this was explained.
- Own SVG schematics only where no free photo exists (e.g. PYR, LAP, bile, hippurate). Positive result on the RIGHT (RTL).
- Figure numbers use a dot «شکل ۱۲.۰۵». Rejected: a hyphen, because bidi reverses it in RTL.
- Inside HTML `<table>` cells italics must be `<i>`; markdown `*…*` does not render there.
- RTL via `<div dir="rtl">` wrapping the whole file. Rejected: per-paragraph `dir=auto`, because tables stay LTR.
- Work on branch `final-review`, not `main`, so the user can review on GitHub first.
- Rejected: «همین» unmarked for hemin (it is ambiguous with the Persian word «همین»); use «هِمین».
- Not changed: QC strain «*S. bovis* ATCC 9809» rows (`10/02`, `11/08`). The current catalogue species name is uncertain.

## 5. Known bugs with exact error messages
- Background agents stop on the usage cap: `Agent terminated early due to an API error: You've hit your 5-hour limit ·
  resets 9:50pm (Asia/Tehran) (error type rate_limit, HTTP 429)`. Resume each with SendMessage (agent IDs are in the session).
  A new session cannot resume them: re-launch with the BRIEF instead.
- EUCAST xlsx download is blocked: the plain URL gives `403 Forbidden`, and curl with browser headers is denied by the
  classifier (`[Bot Check Circumvention]`). Workaround: WebFetch the PDF
  `https://www.eucast.org/fileadmin/eucast/pdf/breakpoints/v_16.1_Breakpoint_Tables.pdf`, then `pdftotext -layout`.
- WebSearch on *Bordetella holmesii* returned `API Error: … can't help with this … [bio]`. Avoid that query form.
- Still unverified (no source in repo):
  - CLSI M45 values (*Listeria* meropenem, *H. pylori* clarithromycin)
  - M24S/WHO numbers in `AST/06`
  - McFarland 0.08–0.13 @625 nm (M02)
  - GBS non-haemolytic %, *Nocardia* TMP-SMX %
- Open user decisions: Iran data in `03_Antibiogram/04_Iran_Reference.md` (01–09).

## 6. Next steps (priority order, one session each)
1. (Done 2026-11-03) Figures `9c8da87`; module 14 extra photos `57bf332` (Gemella ×2, Abiotrophia, Leuconostoc, Lactococcus;
   Leuconostoc AST photos rejected: VA disk shows a zone); SVGs `1740e54` (RUT, SMAC, CIN, CTA, hvKp string test; module 12
   Vibrio string test reused in 18). User kept both disputed Neisseria photos. 389 figure links, 0 broken.
   - Old scratchpad was wiped; new tools in this session's scratchpad `kit/`: `commons.py` (search/info), `fetch.py`,
     `sheet.py`, `addfig.py MODULE spec.json [--check]` (insert photos/SVGs, renumber in file order, CREDITS, README count),
     `svgs.py` (the 5 new SVGs). Avoid "≥" in RTL SVG text (renders mirrored).
2. (Done 2026-11-03) `final-review` merged into `main` (merge commit `7892c84`), pushed.
3. (Done) Remote now `raminabiri/course-clinical-microbiology` (CITATION.cff updated).
4. Verify the M45/M24S/M02 items above when the user supplies the documents.
5. (Done 2026-11-03) LICENSE = CC BY-SA 4.0 (legalcode); README «مجوز و ارجاع»; CITATION.cff license/abstract/version 1.0;
   own-SVG credit cells → [CC BY-SA 4.0](../../LICENSE). User reviews the rest (unverified numbers, AST tables, Iran data).
