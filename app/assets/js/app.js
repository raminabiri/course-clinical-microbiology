/* Clinical Microbiology interactive handbook. Plain JS, runs from file:// with no server. */
(function () {
  "use strict";

  const D = window.CM_DATA;
  const VIDEOS = (window.CM_VIDEOS && window.CM_VIDEOS.modules) || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const main = $("#main");
  const MODS = Object.fromEntries(D.modules.map((m) => [m.id, m]));
  const DAY = 86400000;

  /* ---------- helpers ---------- */
  const faDigits = (x) => String(x).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s || "").toLowerCase().replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/[‌ً-ٟ]/g, "").replace(/[ۀة]/g, "ه").replace(/[أإآ]/g, "ا");
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const modTitle = (m) => (m.title || m.id).replace(/^ماژول\s*[۰-۹0-9]+\s*[:：]\s*/, "").replace(/\s*\([^)]*\)\s*$/, "");
  const modNum = (m) => (m.num != null ? faDigits(String(m.num).padStart(2, "0")) : m.id === "AST" ? "AST" : "★");
  const imgUrl = (repoPath) => "../" + repoPath.split("/").map(encodeURIComponent).join("/");
  const inline = (md) => (window.marked ? marked.parseInline(md || "") : esc(md));
  const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 2200); }

  /* ---------- storage (per-computer; wrapped so a blocked storage never breaks the app) ---------- */
  const KEY = "cm.state.v1";
  const S = (() => {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { s = {}; }
    return Object.assign({ read: {}, last: null, bookmarks: {}, notes: {}, quiz: {}, quizLog: [], cases: {}, settings: {} }, s);
  })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } };
  const getKey = () => { try { return localStorage.getItem("cm.apikey") || ""; } catch (e) { return ""; } };
  const setKey = (k) => { try { k ? localStorage.setItem("cm.apikey", k) : localStorage.removeItem("cm.apikey"); } catch (e) { /* ignore */ } };

  /* ---------- theme & font ---------- */
  function applyTheme() {
    const t = S.settings.theme || "auto";
    if (t === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);
    document.documentElement.style.setProperty("--fs", (S.settings.fs || 16) + "px");
  }
  const isDark = () => { const t = S.settings.theme || "auto"; return t === "dark" || (t === "auto" && matchMedia("(prefers-color-scheme: dark)").matches); };
  function initMermaid() {
    if (!window.mermaid) return;
    mermaid.initialize({ startOnLoad: false, securityLevel: "loose", theme: isDark() ? "dark" : "neutral",
      fontFamily: "Vazirmatn, Tahoma, sans-serif", flowchart: { htmlLabels: true, curve: "basis", useMaxWidth: true } });
  }

  /* ---------- markdown rendering ---------- */
  if (window.marked) marked.setOptions({ gfm: true, breaks: false });
  function resolvePath(base, rel) {
    const u = new URL(rel, "https://h/" + base.split("/").map(encodeURIComponent).join("/"));
    return decodeURIComponent(u.pathname.slice(1));
  }
  function renderMd(md, baseDoc) {
    const wrap = document.createElement("div");
    wrap.className = "md";
    wrap.innerHTML = marked.parse(md);
    // mermaid blocks
    $$("pre > code.language-mermaid", wrap).forEach((code) => {
      const box = document.createElement("div");
      box.className = "mermaid-wrap";
      const m = document.createElement("div");
      m.className = "mermaid";
      m.textContent = code.textContent;
      box.appendChild(m);
      code.parentElement.replaceWith(box);
    });
    // tables
    $$("table", wrap).forEach((t) => {
      if ($("img", t)) { t.classList.add("figs"); return; }
      if (t.parentElement.classList.contains("tbl")) return;
      const w = document.createElement("div"); w.className = "tbl"; t.replaceWith(w); w.appendChild(t);
    });
    // links & images
    $$("img", wrap).forEach((img) => {
      const src = img.getAttribute("src") || "";
      if (/^(https?:|data:)/.test(src)) return;
      const repo = resolvePath(baseDoc, src);
      img.setAttribute("src", imgUrl(repo));
      img.dataset.repo = repo;
      img.loading = "lazy";
    });
    $$("a[href]", wrap).forEach((a) => {
      const href = a.getAttribute("href");
      if (/^https?:/.test(href)) { a.target = "_blank"; a.rel = "noopener"; return; }
      if (href.startsWith("#") || href.startsWith("mailto:")) { a.removeAttribute("href"); return; }
      const [path] = href.split("#");
      let repo = resolvePath(baseDoc, path);
      if (repo.endsWith("/")) repo += "README.md";
      if (!/\.[a-z0-9]+$/i.test(repo) && D.docs[repo + "/README.md"]) repo += "/README.md";
      if (D.docs[repo]) a.setAttribute("href", "#/d/" + encodeURIComponent(repo));
      else { a.setAttribute("href", imgUrl(repo)); a.target = "_blank"; }
    });
    return wrap;
  }
  async function runMermaid(root) {
    const nodes = $$(".mermaid", root).filter((n) => !n.dataset.processed);
    if (!nodes.length || !window.mermaid) return;
    try { await mermaid.run({ nodes }); } catch (e) { /* leave source visible */ }
    $$(".mermaid-wrap", root).forEach((w) => w.addEventListener("click", () => {
      const svg = $("svg", w); if (svg) openLightbox({ node: svg.cloneNode(true), caption: "فلوچارت" });
    }));
  }
  function wireImages(root) {
    $$("img", root).forEach((img) => img.addEventListener("click", () => {
      const f = D.figures[img.dataset.repo];
      openLightbox({ src: img.src, fig: f, alt: img.alt });
    }));
  }

  /* ---------- lightbox with zoom & pan ---------- */
  const lb = { el: $("#lightbox"), stage: $("#lbStage"), cap: $("#lbCap"), s: 1, x: 0, y: 0 };
  function figCredit(f) {
    if (!f) return "";
    const src = f.source ? `<a href="${esc(f.source)}" target="_blank" rel="noopener">منبع</a>` : "";
    return `<div class="credit">شکل ${esc(f.num)} · ${esc(f.artist)} · ${esc(f.license)} ${src ? "· " + src : ""}</div>`;
  }
  function openLightbox({ src, node, fig, caption, alt }) {
    lb.stage.innerHTML = "";
    let target;
    if (node) { target = node; target.removeAttribute("style"); target.style.maxWidth = "92vw"; target.style.maxHeight = "80vh"; target.style.background = isDark() ? "#181e27" : "#fff"; target.style.padding = "16px"; }
    else { target = new Image(); target.src = src; target.alt = alt || ""; if (fig && !fig.svg) target.className = "photo"; }
    lb.stage.appendChild(target);
    lb.cap.innerHTML = (fig ? inline(fig.caption) + figCredit(fig) : esc(caption || alt || "")) +
      (fig && fig.doc ? ` <a href="#/d/${encodeURIComponent(fig.doc)}" data-close>مشاهده در متن ←</a>` : "");
    lb.s = 1; lb.x = 0; lb.y = 0; lbApply();
    lb.el.classList.add("open"); lb.el.setAttribute("aria-hidden", "false");
  }
  function lbApply() { const t = lb.stage.firstElementChild; if (t) t.style.transform = `translate(${lb.x}px, ${lb.y}px) scale(${lb.s})`; }
  function closeLightbox() { lb.el.classList.remove("open"); lb.el.setAttribute("aria-hidden", "true"); lb.stage.innerHTML = ""; }
  lb.stage.addEventListener("wheel", (e) => { e.preventDefault(); lb.s = Math.min(8, Math.max(0.5, lb.s * (e.deltaY < 0 ? 1.15 : 0.87))); lbApply(); }, { passive: false });
  lb.stage.addEventListener("dblclick", () => { lb.s = lb.s > 1 ? 1 : 2.2; lb.x = lb.y = 0; lbApply(); });
  let drag = null;
  lb.stage.addEventListener("pointerdown", (e) => { drag = { x: e.clientX - lb.x, y: e.clientY - lb.y }; lb.stage.setPointerCapture(e.pointerId); });
  lb.stage.addEventListener("pointermove", (e) => { if (drag) { lb.x = e.clientX - drag.x; lb.y = e.clientY - drag.y; lbApply(); } });
  lb.stage.addEventListener("pointerup", () => { drag = null; });
  $("#lbClose").addEventListener("click", closeLightbox);
  lb.el.addEventListener("click", (e) => { if (e.target === lb.el || e.target.hasAttribute("data-close")) closeLightbox(); });

  /* ---------- progress helpers ---------- */
  const docsOf = (mid) => (MODS[mid] ? MODS[mid].docs : []);
  const readCount = (mid) => docsOf(mid).filter((d) => S.read[d]).length;
  function ring(p, size = 38) {
    const r = 15, c = 2 * Math.PI * r;
    return `<svg class="ring" viewBox="0 0 38 38" width="${size}" height="${size}"><circle class="bgc" cx="19" cy="19" r="${r}"/><circle class="fgc" cx="19" cy="19" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p / 100)}"/><text x="19" y="22.5" text-anchor="middle">${faDigits(p)}</text></svg>`;
  }
  const quizStats = () => { const v = Object.values(S.quiz); const r = v.reduce((a, x) => a + (x.right || 0), 0), w = v.reduce((a, x) => a + (x.wrong || 0), 0); return { seen: v.length, acc: pct(r, r + w) }; };
  const dueItems = () => { const now = Date.now(); return D.quiz.filter((q) => S.quiz[q.id] && S.quiz[q.id].due <= now); };
  function updateDue() { const n = dueItems().length; const b = $("#dueBadge"); b.hidden = !n; b.textContent = faDigits(n); }

  /* ---------- router ---------- */
  const routes = {};
  function route() {
    const h = decodeURIComponent(location.hash.slice(2) || "");
    const [name, ...rest] = h.split("/");
    const arg = rest.join("/");
    closeDrawer(true);
    $("#sidenav").classList.remove("open");
    $$(".sidenav a").forEach((a) => a.classList.toggle("active", a.dataset.nav === (name || "home") || (name === "m" && a.dataset.nav === "library") || (name === "d" && a.dataset.nav === "library")));
    removeFab();
    (routes[name || "home"] || routes.home)(arg);
    main.scrollTop = 0;
    main.focus({ preventScroll: true });
    updateDue();
  }
  window.addEventListener("hashchange", route);
  function view(html) { main.innerHTML = `<div class="view">${html}</div>`; return $(".view", main); }

  /* ---------- home ---------- */
  routes.home = () => {
    const totalDocs = D.modules.reduce((a, m) => a + m.docs.length, 0);
    const read = Object.keys(S.read).length;
    const qs = quizStats();
    const casesDone = Object.keys(S.cases).length;
    const due = dueItems().length;
    const last = S.last && D.docs[S.last.doc] ? D.docs[S.last.doc] : null;
    const hour = new Date().getHours();
    const greet = hour < 12 ? "صبح بخیر" : hour < 18 ? "روز بخیر" : "عصر بخیر";
    const groups = D.groups.map(([gid, gt]) => {
      const ms = D.modules.filter((m) => m.group === gid);
      if (!ms.length) return "";
      return `<div class="section-title"><h2>${esc(gt)}</h2></div><div class="grid modules">${ms.map(modCard).join("")}</div>`;
    }).join("");
    view(`
      <section class="hero">
        <div class="eyebrow" style="color:#d8b878">${greet}</div>
        <h1>میکروب‌شناسی بالینی تشخیصی</h1>
        <p>درس‌نامهٔ تعاملی باکتری‌شناسی تشخیصی برای دستیاران: از نمونه تا گزارش، با آزمون تصویری، سناریوهای بالینی و پرسش از Claude در هر بخش.</p>
        <div class="hero-actions">
          ${last ? `<a class="btn gold" href="#/d/${encodeURIComponent(last.id)}">ادامهٔ مطالعه</a>` : `<a class="btn gold" href="#/library">شروع مطالعه</a>`}
          <a class="btn" href="#/quiz">آزمون تصویری</a>
          <a class="btn" href="#/cases/random">یک سناریوی تصادفی</a>
        </div>
      </section>
      <div class="stats">
        <div class="card stat"><div class="k">صفحه‌های خوانده‌شده</div><div class="v">${faDigits(read)} <small>از ${faDigits(totalDocs)}</small></div><div class="bar"><i style="width:${pct(read, totalDocs)}%"></i></div></div>
        <div class="card stat"><div class="k">دقت آزمون تصویری</div><div class="v">${qs.seen ? faDigits(qs.acc) + "٪" : "—"} <small>${faDigits(qs.seen)} پرسش</small></div><div class="bar"><i style="width:${qs.acc}%"></i></div></div>
        <div class="card stat"><div class="k">سناریوهای حل‌شده</div><div class="v">${faDigits(casesDone)} <small>از ${faDigits(D.cases.length)}</small></div><div class="bar"><i style="width:${pct(casesDone, D.cases.length)}%"></i></div></div>
        <a class="card stat" href="#/review" style="color:inherit;text-decoration:none"><div class="k">مرورهای امروز</div><div class="v">${faDigits(due)} <small>پرسش</small></div><div class="bar"><i style="width:${due ? 100 : 0}%"></i></div></a>
      </div>
      ${last ? `<div class="card continue"><div><div class="eyebrow">آخرین صفحه</div><div class="t">${esc(last.title)}</div><div class="muted" style="font-size:13px">${esc(modTitle(MODS[last.module] || {}))}</div></div><a class="btn primary" href="#/d/${encodeURIComponent(last.id)}">ادامه</a></div>` : ""}
      ${groups}`);
  };
  function modCard(m) {
    const p = pct(readCount(m.id), m.docs.length);
    const nCases = D.cases.filter((c) => c.module === m.id).length;
    return `<a class="card mod-card" href="#/m/${encodeURIComponent(m.id)}">${ring(p)}
      <div class="mod-num">${m.num != null ? "ماژول " + modNum(m) : modNum(m)}</div>
      <div class="mod-title">${esc(modTitle(m))}</div>
      <div class="mod-meta"><span>${faDigits(m.docs.length)} صفحه</span>${m.figures ? `<span>${faDigits(m.figures)} تصویر</span>` : ""}${nCases ? `<span>${faDigits(nCases)} سناریو</span>` : ""}</div></a>`;
  }

  /* ---------- library ---------- */
  routes.library = () => {
    view(`<h1 class="page">درس‌ها</h1><p class="lede">۲۴ ماژول به‌همراه بخش آنتی‌بیوگرام (AST) و منابع مشترک.</p>
      ${D.groups.map(([gid, gt]) => { const ms = D.modules.filter((m) => m.group === gid); return ms.length ? `<div class="section-title"><h2>${esc(gt)}</h2></div><div class="grid modules">${ms.map(modCard).join("")}</div>` : ""; }).join("")}`);
  };

  /* ---------- module ---------- */
  function docLabel(id, m) {
    const d = D.docs[id];
    const sub = id.slice(m.id.length + 1).split("/");
    const folder = sub.length > 1 ? sub[0].replace(/^\d+_/, "").replace(/_/g, " ") : "";
    return { title: id.endsWith(m.id + "/README.md") ? "معرفی ماژول" : d.title.replace(/^ماژول\s*[۰-۹0-9]+\s*[:：—-]\s*/, ""), folder };
  }
  routes.m = (mid) => {
    const m = MODS[mid]; if (!m) return routes.home();
    const p = pct(readCount(mid), m.docs.length);
    const figs = Object.values(D.figures).filter((f) => f.src.startsWith(mid + "/") && !f.svg);
    const pick = shuffle(figs).slice(0, 6);
    const nCases = D.cases.filter((c) => c.module === mid).length;
    const nQuiz = D.quiz.filter((q) => q.module === mid).length;
    const vids = VIDEOS[mid] || [];
    const rows = m.docs.map((id, i) => { const l = docLabel(id, m); return `<a class="doc-row ${S.read[id] ? "read" : ""}" href="#/d/${encodeURIComponent(id)}"><span class="idx">${S.read[id] ? "✓" : faDigits(i + 1)}</span><span><div>${esc(l.title)}</div>${l.folder ? `<div class="sub">${esc(l.folder)}</div>` : ""}</span><svg class="chev" viewBox="0 0 24 24"><path d="M14 6l-6 6 6 6"/></svg></a>`; }).join("");
    view(`<div class="crumbs"><a href="#/library">درس‌ها</a> / <span>${m.num != null ? "ماژول " + modNum(m) : esc(m.id)}</span></div>
      <div class="mod-head"><div><div class="eyebrow">${m.num != null ? "ماژول " + modNum(m) : ""}</div><h1 class="page">${esc(modTitle(m))}</h1><p class="lede">${faDigits(m.docs.length)} صفحه · ${faDigits(p)}٪ خوانده‌شده</p></div></div>
      <div class="two-col">
        <div class="card doc-list">${rows}</div>
        <div class="side-cards">
          ${pick.length ? `<div class="card mini"><h3>تصاویر این ماژول</h3><div class="strip">${pick.map((f) => `<img src="${imgUrl(f.src)}" data-repo="${esc(f.src)}" alt="" loading="lazy">`).join("")}</div><div class="row" style="margin-top:10px"><a class="btn sm" href="#/atlas/${encodeURIComponent(mid)}">همهٔ ${faDigits(figs.length)} تصویر</a>${nQuiz ? `<a class="btn sm primary" href="#/quiz/${encodeURIComponent(mid)}">آزمون این ماژول</a>` : ""}</div></div>` : ""}
          ${nCases ? `<div class="card mini"><h3>سناریوهای بالینی</h3><p class="muted" style="margin:0 0 10px;font-size:13.5px">${faDigits(nCases)} سناریو با پاسخ مرجع؛ پاسخ خود را بنویسید و با Claude ارزیابی کنید.</p><a class="btn sm" href="#/cases/${encodeURIComponent(mid)}">شروع</a></div>` : ""}
          ${vids.length ? `<div class="card mini"><h3>فیلم‌های مرتبط</h3>${vids.slice(0, 3).map((v) => `<a href="https://www.youtube.com/watch?v=${esc(v.id)}" target="_blank" rel="noopener" style="display:block;font-size:13px;direction:ltr;text-align:left;margin:4px 0">▶ ${esc(v.title)}</a>`).join("")}<a class="btn sm" style="margin-top:8px" href="#/videos/${encodeURIComponent(mid)}">همهٔ فیلم‌ها</a></div>` : ""}
        </div>
      </div>`);
    wireImages(main);
    addFab(() => ({ title: modTitle(m), text: D.docs[m.docs[0]].text }));
  };

  /* ---------- reader ---------- */
  routes.d = (id) => {
    const doc = D.docs[id]; if (!doc) return routes.home();
    const m = MODS[doc.module];
    const list = m ? m.docs : [id];
    const i = list.indexOf(id);
    const prev = i > 0 ? D.docs[list[i - 1]] : null, next = i >= 0 && i < list.length - 1 ? D.docs[list[i + 1]] : null;
    S.last = { doc: id, ts: Date.now() }; save();
    const v = view(`<div class="crumbs"><a href="#/library">درس‌ها</a>${m ? ` / <a href="#/m/${encodeURIComponent(m.id)}">${esc(modTitle(m))}</a>` : ""}</div>
      <div class="reader"><div>
        <div class="doc-toolbar">
          <button class="btn sm" id="bmBtn">${S.bookmarks[id] ? "★ نشان‌شده" : "☆ نشان کردن"}</button>
          <button class="btn sm" id="readBtn">${S.read[id] ? "✓ خوانده شد" : "علامت خوانده‌شده"}</button>
          <span class="spacer"></span>
          <button class="btn sm ghost" id="fsDown" title="متن کوچک‌تر">متن −</button><button class="btn sm ghost" id="fsUp" title="متن بزرگ‌تر">متن +</button>
          <button class="btn sm" id="printBtn" title="چاپ یا PDF">چاپ</button>
        </div>
        <article class="doc" id="docBody"></article>
        <div class="pager">${prev ? `<a class="card" href="#/d/${encodeURIComponent(prev.id)}"><div class="dir">→ قبلی</div>${esc(prev.title)}</a>` : "<span></span>"}${next ? `<a class="card next" href="#/d/${encodeURIComponent(next.id)}"><div class="dir">بعدی ←</div>${esc(next.title)}</a>` : ""}</div>
        <div class="card notes"><div class="eyebrow">یادداشت من</div><textarea id="noteBox" placeholder="یادداشت شخصی برای این صفحه (فقط روی همین رایانه ذخیره می‌شود)">${esc(S.notes[id] || "")}</textarea></div>
      </div><aside class="card toc" id="toc"></aside></div>`);
    const body = renderMd(doc.md, id);
    $("#docBody").appendChild(body);
    runMermaid(body); wireImages(body);
    // headings: ids, ask buttons, toc
    const hs = $$("h2, h3", body);
    hs.forEach((h, n) => {
      h.id = "h-" + n;
      const b = document.createElement("button");
      b.className = "ask-h"; b.type = "button"; b.innerHTML = "✦ بپرس";
      b.title = "پرسش از Claude دربارهٔ همین بخش";
      b.addEventListener("click", () => openDrawer({ title: h.textContent.replace("✦ بپرس", "").trim() + " — " + doc.title, text: sectionText(h) }));
      h.appendChild(b);
    });
    $("#toc").innerHTML = hs.length ? `<h4>در این صفحه</h4>` + hs.map((h) => `<a href="javascript:void 0" data-h="${h.id}" class="${h.tagName === "H3" ? "l3" : ""}">${esc(h.firstChild.textContent || h.textContent)}</a>`).join("") : "";
    $$("#toc a").forEach((a) => a.addEventListener("click", () => document.getElementById(a.dataset.h).scrollIntoView({ behavior: "smooth", block: "start" })));
    if (!hs.length) $("#toc").style.display = "none";
    const io = new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) { $$("#toc a").forEach((a) => a.classList.toggle("on", a.dataset.h === e.target.id)); } }), { root: main, rootMargin: "0px 0px -75% 0px" });
    hs.forEach((h) => io.observe(h));
    // toolbar
    $("#bmBtn").onclick = () => { if (S.bookmarks[id]) delete S.bookmarks[id]; else S.bookmarks[id] = Date.now(); save(); $("#bmBtn").textContent = S.bookmarks[id] ? "★ نشان‌شده" : "☆ نشان کردن"; toast(S.bookmarks[id] ? "به نشان‌ها افزوده شد" : "از نشان‌ها حذف شد"); };
    const markRead = (on) => { if (on) S.read[id] = Date.now(); else delete S.read[id]; save(); $("#readBtn").textContent = S.read[id] ? "✓ خوانده شد" : "علامت خوانده‌شده"; };
    $("#readBtn").onclick = () => markRead(!S.read[id]);
    $("#fsUp").onclick = () => { S.settings.fs = Math.min(20, (S.settings.fs || 16) + 1); save(); applyTheme(); };
    $("#fsDown").onclick = () => { S.settings.fs = Math.max(13, (S.settings.fs || 16) - 1); save(); applyTheme(); };
    $("#printBtn").onclick = () => window.print();
    let nt; $("#noteBox").addEventListener("input", (e) => { clearTimeout(nt); nt = setTimeout(() => { const t = e.target.value.trim(); if (t) S.notes[id] = t; else delete S.notes[id]; save(); }, 400); });
    const onScroll = () => { if (!S.read[id] && main.scrollTop + main.clientHeight >= main.scrollHeight - 260) { markRead(true); toast("این صفحه خوانده‌شده علامت خورد"); } };
    main.addEventListener("scroll", onScroll, { passive: true });
    routes.d.cleanup = () => main.removeEventListener("scroll", onScroll);
    addFab(() => ({ title: doc.title, text: doc.text }));
    return v;
  };
  function sectionText(h) {
    const level = +h.tagName[1];
    let t = h.textContent.replace("✦ بپرس", "") + "\n", n = h.nextElementSibling;
    while (n && !(/^H[1-6]$/.test(n.tagName) && +n.tagName[1] <= level)) { t += n.innerText + "\n"; n = n.nextElementSibling; }
    return t.trim();
  }

  /* ---------- quiz ---------- */
  const INTERVALS = [0, 1, 2, 4, 8, 16];
  function recordAnswer(q, ok) {
    const r = S.quiz[q.id] || { box: 0, right: 0, wrong: 0 };
    if (ok) { r.right++; r.box = Math.min(5, (r.box || 0) + 1); } else { r.wrong++; r.box = 1; }
    r.due = Date.now() + (ok ? INTERVALS[r.box] * DAY : 10 * 60000);
    S.quiz[q.id] = r; save();
  }
  let quizState = null;
  routes.quiz = (arg) => {
    const preset = arg && MODS[arg] ? [arg] : null;
    const withQ = D.modules.filter((m) => D.quiz.some((q) => q.module === m.id));
    const sel = new Set(preset || withQ.map((m) => m.id));
    let kind = "mixed", count = 10;
    const v = view(`<h1 class="page">آزمون تصویری</h1><p class="lede">${faDigits(D.quiz.length)} پرسش از ${faDigits(Object.keys(D.figures).length)} تصویر درس‌نامه. پاسخ‌های نادرست برای مرور هوشمند ذخیره می‌شوند.</p>
      <div class="card quiz-setup">
        <div><div class="lab">نوع پرسش</div><div class="chips" id="kindChips">
          <button class="chip on" data-k="mixed">ترکیبی</button><button class="chip" data-k="organism">شناسایی ارگانیسم</button><button class="chip" data-k="caption">تفسیر تصویر</button></div></div>
        <div><div class="lab">تعداد پرسش</div><div class="chips" id="cntChips">${[10, 20, 30].map((n) => `<button class="chip ${n === 10 ? "on" : ""}" data-n="${n}">${faDigits(n)}</button>`).join("")}</div></div>
        <div><div class="lab">ماژول‌ها <button class="btn sm ghost" id="allMods">همه</button><button class="btn sm ghost" id="noMods">هیچ</button></div>
          <div class="chips" id="modChips">${withQ.map((m) => `<button class="chip ${sel.has(m.id) ? "on" : ""}" data-m="${esc(m.id)}">${modNum(m)} · ${esc(modTitle(m))}</button>`).join("")}</div></div>
        <div class="row"><button class="btn primary" id="startQuiz">شروع آزمون</button><span class="muted" id="poolInfo"></span></div>
      </div>`);
    const pool = () => D.quiz.filter((q) => sel.has(q.module) && (kind === "mixed" || q.kind === kind));
    const info = () => { $("#poolInfo").textContent = faDigits(pool().length) + " پرسش در دسترس"; };
    $$("#kindChips .chip").forEach((c) => c.onclick = () => { kind = c.dataset.k; $$("#kindChips .chip").forEach((x) => x.classList.toggle("on", x === c)); info(); });
    $$("#cntChips .chip").forEach((c) => c.onclick = () => { count = +c.dataset.n; $$("#cntChips .chip").forEach((x) => x.classList.toggle("on", x === c)); });
    $$("#modChips .chip").forEach((c) => c.onclick = () => { const id = c.dataset.m; sel.has(id) ? sel.delete(id) : sel.add(id); c.classList.toggle("on"); info(); });
    $("#allMods").onclick = () => { withQ.forEach((m) => sel.add(m.id)); $$("#modChips .chip").forEach((c) => c.classList.add("on")); info(); };
    $("#noMods").onclick = () => { sel.clear(); $$("#modChips .chip").forEach((c) => c.classList.remove("on")); info(); };
    $("#startQuiz").onclick = () => { const p = pool(); if (!p.length) return toast("هیچ پرسشی انتخاب نشده"); startQuiz(shuffle(p).slice(0, count), "آزمون تصویری"); };
    info();
  };
  routes.review = () => {
    const due = dueItems();
    if (!due.length) {
      const seen = Object.keys(S.quiz).length;
      view(`<h1 class="page">مرور هوشمند</h1><p class="lede">پرسش‌هایی که اشتباه پاسخ داده‌اید یا زمان مرورشان رسیده، اینجا جمع می‌شوند (روش جعبهٔ لایتنر: ۱، ۲، ۴، ۸ و ۱۶ روز).</p>
        <div class="card empty"><div style="font-size:38px">✓</div><div>${seen ? "برای امروز مروری باقی نمانده است." : "هنوز پرسشی پاسخ نداده‌اید."}</div><a class="btn primary" style="margin-top:14px" href="#/quiz">آزمون تازه</a></div>`);
      return;
    }
    startQuiz(shuffle(due).slice(0, 30), "مرور هوشمند");
  };
  function startQuiz(list, title) {
    quizState = { list: list.map((q) => { const opts = shuffle(q.options.map((o, i) => ({ o, ok: i === q.answer }))); return Object.assign({}, q, { opts }); }), i: 0, right: 0, wrongs: [], title };
    renderQ();
  }
  function renderQ() {
    const st = quizState, q = st.list[st.i], f = D.figures[q.fig];
    view(`<div class="crumbs"><a href="#/quiz">آزمون</a> / <span>${esc(st.title)}</span></div>
      <div class="card qcard">
        <div class="qimg ${f.svg ? "svgbg" : ""}"><img src="${imgUrl(f.src)}" alt="تصویر پرسش" id="qImg"></div>
        <div class="qbody">
          <div class="qprog"><span>${faDigits(st.i + 1)} / ${faDigits(st.list.length)}</span><div class="bar"><i style="width:${pct(st.i, st.list.length)}%"></i></div><span>${faDigits(st.right)} درست</span></div>
          <div class="qprompt">${esc(q.prompt)}</div>
          <div class="opts">${q.opts.map((x, k) => `<button class="opt ${q.kind === "organism" ? "org" : ""}" data-k="${k}"><span class="key">${faDigits(k + 1)}</span><span>${q.kind === "organism" ? esc(x.o) : inline(x.o)}</span></button>`).join("")}</div>
          <div id="explain"></div>
          <div class="qactions" id="qact"></div>
        </div>
      </div>`);
    $("#qImg").onclick = () => openLightbox({ src: imgUrl(f.src), caption: "" }); // no caption before answering
    $$(".opt").forEach((b) => b.onclick = () => answerQ(+b.dataset.k));
  }
  function answerQ(k) {
    const st = quizState, q = st.list[st.i], f = D.figures[q.fig];
    if ($(".opt[disabled]")) return;
    const ok = q.opts[k].ok;
    if (ok) st.right++; else st.wrongs.push(q);
    recordAnswer(q, ok);
    $$(".opt").forEach((b, j) => { b.disabled = true; if (q.opts[j].ok) b.classList.add("right"); else if (j === k) b.classList.add("wrong"); });
    $("#explain").innerHTML = `<div class="explain"><div class="verdict ${ok ? "ok" : "no"}">${ok ? "درست است" : "نادرست"}</div>${inline(f.caption)}${figCredit(f)}</div>`;
    const last = st.i === st.list.length - 1;
    $("#qact").innerHTML = `<button class="btn primary" id="nextQ">${last ? "پایان و نتیجه" : "پرسش بعدی"} <span class="kbd">Enter</span></button>${f.doc ? `<a class="btn" href="#/d/${encodeURIComponent(f.doc)}" target="_blank">مشاهده در متن</a>` : ""}<button class="btn ghost" id="askQ">✦ بپرس</button>`;
    $("#qImg").onclick = () => openLightbox({ src: imgUrl(f.src), fig: f });
    $("#nextQ").onclick = nextQ; $("#nextQ").focus();
    $("#askQ").onclick = () => openDrawer({ title: "تصویر " + f.num, text: `پرسش آزمون: ${q.prompt}\nگزینه‌ها: ${q.opts.map((x) => x.o).join(" | ")}\nپاسخ درست: ${q.opts.find((x) => x.ok).o}\nزیرنویس تصویر در درس‌نامه: ${f.caption}`, suggest: ["چرا این پاسخ درست است؟", "ویژگی‌های افتراقی این تصویر را توضیح بده", "گزینه‌های دیگر را چطور رد کنم؟"] });
  }
  function nextQ() { const st = quizState; if (st.i < st.list.length - 1) { st.i++; renderQ(); } else quizResult(); }
  function quizResult() {
    const st = quizState, p = pct(st.right, st.list.length), r = 62, c = 2 * Math.PI * r;
    S.quizLog.push({ ts: Date.now(), n: st.list.length, right: st.right }); save();
    view(`<div class="card result">
      <svg class="score-ring" viewBox="0 0 150 150"><circle cx="75" cy="75" r="${r}" stroke="var(--bg-2)"/><circle cx="75" cy="75" r="${r}" stroke="var(--gold)" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p / 100)}" transform="rotate(-90 75 75)"/><text x="75" y="86" text-anchor="middle">${faDigits(p)}٪</text></svg>
      <h1 class="page" style="font-size:24px">${p >= 85 ? "عالی" : p >= 65 ? "خوب" : "نیاز به مرور"}</h1>
      <p class="lede">${faDigits(st.right)} پاسخ درست از ${faDigits(st.list.length)} پرسش. ${st.wrongs.length ? "پرسش‌های نادرست به «مرور هوشمند» رفتند." : ""}</p>
      <div class="row" style="justify-content:center"><a class="btn primary" href="#/quiz">آزمون تازه</a>${st.wrongs.length ? `<button class="btn" id="retryW">تکرار نادرست‌ها</button>` : ""}<a class="btn ghost" href="#/">پیشخوان</a></div></div>`);
    const b = $("#retryW"); if (b) b.onclick = () => startQuiz(st.wrongs, "تکرار نادرست‌ها");
  }

  /* ---------- cases ---------- */
  routes.cases = (arg) => {
    if (arg === "random") { const c = shuffle(D.cases)[0]; location.hash = "#/case/" + encodeURIComponent(c.id); return; }
    let mod = arg && MODS[arg] ? arg : "", lvl = 0, status = "all";
    const mods = D.modules.filter((m) => D.cases.some((c) => c.module === m.id));
    view(`<h1 class="page">سناریوهای بالینی</h1><p class="lede">${faDigits(D.cases.length)} سناریوی آزمایشگاهی با پاسخ مرجع. پاسخ خود را بنویسید، با پاسخ مرجع مقایسه کنید یا از Claude بخواهید آن را ارزیابی کند.</p>
      <div class="toolbar"><select class="select" id="cMod"><option value="">همهٔ ماژول‌ها</option>${mods.map((m) => `<option value="${esc(m.id)}" ${m.id === mod ? "selected" : ""}>${modNum(m)} · ${esc(modTitle(m))}</option>`).join("")}</select>
        <div class="chips" id="cLvl"><button class="chip on" data-l="0">همهٔ سطح‌ها</button><button class="chip" data-l="1">🟢 پایه</button><button class="chip" data-l="2">🟡 متوسط</button><button class="chip" data-l="3">🔴 پیشرفته</button></div>
        <div class="chips" id="cSt"><button class="chip on" data-s="all">همه</button><button class="chip" data-s="todo">حل‌نشده</button><button class="chip" data-s="done">حل‌شده</button></div>
        <a class="btn sm" href="#/cases/random" style="margin-inline-start:auto">سناریوی تصادفی</a></div>
      <div class="case-list" id="cList"></div>`);
    const draw = () => {
      const list = D.cases.filter((c) => (!mod || c.module === mod) && (!lvl || c.level === lvl) && (status === "all" || (status === "done") === !!S.cases[c.id]));
      $("#cList").innerHTML = list.length ? list.map((c) => { const r = S.cases[c.id]; return `<a class="card case-row" href="#/case/${encodeURIComponent(c.id)}"><span class="dot l${c.level}"></span><span><div style="font-weight:600">${inline(c.title)}</div><div class="muted" style="font-size:12px">${esc(modTitle(MODS[c.module]))} · سناریو ${faDigits(c.n)}</div></span><span class="st ${r ? (r.rate === 2 ? "lvl1" : r.rate === 1 ? "lvl2" : "lvl3") : "muted"}">${r ? ["نادرست", "نسبی", "کامل"][r.rate] : "حل‌نشده"}</span></a>`; }).join("") : `<div class="card empty">سناریویی با این فیلتر نیست.</div>`;
    };
    $("#cMod").onchange = (e) => { mod = e.target.value; draw(); };
    $$("#cLvl .chip").forEach((c) => c.onclick = () => { lvl = +c.dataset.l; $$("#cLvl .chip").forEach((x) => x.classList.toggle("on", x === c)); draw(); });
    $$("#cSt .chip").forEach((c) => c.onclick = () => { status = c.dataset.s; $$("#cSt .chip").forEach((x) => x.classList.toggle("on", x === c)); draw(); });
    draw();
  };
  routes.case = (id) => {
    const c = D.cases.find((x) => x.id === id); if (!c) return routes.cases();
    const m = MODS[c.module];
    const same = D.cases.filter((x) => x.module === c.module), i = same.indexOf(c);
    const prev = same[i - 1], next = same[i + 1];
    const draftKey = "case:" + c.id;
    view(`<div class="crumbs"><a href="#/cases">سناریوها</a> / <a href="#/cases/${encodeURIComponent(c.module)}">${esc(modTitle(m))}</a></div>
      <div class="card case-view">
        <div class="eyebrow">سناریو ${faDigits(c.n)} ${c.level ? ["", "· 🟢 پایه", "· 🟡 متوسط", "· 🔴 پیشرفته"][c.level] : ""}</div>
        <h1 class="page" style="font-size:24px">${inline(c.title)}</h1>
        <div class="q" id="caseQ"></div>
        <div class="field"><label for="caseAns">پاسخ شما</label><textarea class="case-answer" id="caseAns" placeholder="تفسیر، گام بعدی و گزارش خود را بنویسید…">${esc(S.notes[draftKey] || "")}</textarea></div>
        <div class="row" style="margin-top:12px"><button class="btn primary" id="showA">نمایش پاسخ مرجع</button><button class="btn" id="evalA">✦ ارزیابی پاسخ من با Claude</button></div>
        <div id="evalBox"></div>
        <div id="ansBox"></div>
      </div>
      <div class="pager">${prev ? `<a class="card" href="#/case/${encodeURIComponent(prev.id)}"><div class="dir">→ سناریوی قبلی</div>${inline(prev.title)}</a>` : "<span></span>"}${next ? `<a class="card next" href="#/case/${encodeURIComponent(next.id)}"><div class="dir">سناریوی بعدی ←</div>${inline(next.title)}</a>` : ""}</div>`);
    const q = renderMd(c.q, c.module + "/x.md"); $("#caseQ").appendChild(q); wireImages(q);
    let dt; $("#caseAns").addEventListener("input", (e) => { clearTimeout(dt); dt = setTimeout(() => { const t = e.target.value.trim(); if (t) S.notes[draftKey] = t; else delete S.notes[draftKey]; save(); }, 400); });
    $("#showA").onclick = () => {
      const box = $("#ansBox");
      if (box.innerHTML) { box.innerHTML = ""; return; }
      box.innerHTML = `<div class="answer-box"><div class="eyebrow">پاسخ مرجع</div><div id="ansMd"></div><div class="selfrate"><span class="muted">پاسخ من:</span><button class="btn sm" data-r="2">کامل</button><button class="btn sm" data-r="1">نسبی</button><button class="btn sm" data-r="0">نادرست</button></div></div>`;
      const a = renderMd(c.a, c.module + "/x.md"); $("#ansMd").appendChild(a); wireImages(a);
      $$(".selfrate .btn").forEach((b) => b.onclick = () => { S.cases[c.id] = { rate: +b.dataset.r, ts: Date.now() }; save(); toast("ثبت شد"); if (next) setTimeout(() => (location.hash = "#/case/" + encodeURIComponent(next.id)), 500); });
    };
    $("#evalA").onclick = async () => {
      const ans = $("#caseAns").value.trim();
      if (!ans) return toast("اول پاسخ خود را بنویسید");
      if (!getKey()) { toast("کلید API را در تنظیمات وارد کنید"); location.hash = "#/settings"; return; }
      const box = $("#evalBox");
      box.innerHTML = `<div class="claude-eval"><div class="eyebrow">✦ ارزیابی Claude</div><div class="md" id="evalOut"><span class="typing"><i></i><i></i><i></i> در حال ارزیابی…</span></div><div class="meta muted" id="evalMeta" style="font-size:12px"></div></div>`;
      const prompt = `سناریوی آزمایشگاهی:\n${c.q}\n\nپاسخ مرجع درس‌نامه:\n${c.a}\n\nپاسخ دستیار:\n${ans}\n\nپاسخ دستیار را با پاسخ مرجع مقایسه کن. به فارسی و کوتاه بنویس: (۱) نکات درست، (۲) نکات جاافتاده یا ناقص، (۳) خطاهای علمی یا ایمنی، (۴) نمره از ۱۰ با یک جمله دلیل. با لحن مربی دلسوز.`;
      await callClaude({ system: SYSTEM, context: null, messages: [{ role: "user", content: prompt }],
        onText: (t) => { $("#evalOut").innerHTML = marked.parse(t); },
        onDone: (u) => { $("#evalMeta").textContent = costLine(u); },
        onError: (e) => { $("#evalOut").innerHTML = `<div class="msg err">${esc(e)}</div>`; } });
    };
    addFab(() => ({ title: "سناریو " + faDigits(c.n) + " — " + c.title, text: c.q + "\n\nپاسخ مرجع (پیش از پرسش دستیار آن را فاش نکن مگر بخواهد):\n" + c.a }));
  };

  /* ---------- atlas ---------- */
  routes.atlas = (arg) => {
    let mod = arg && MODS[arg] ? arg : "", q = "";
    const all = Object.values(D.figures);
    const mods = D.modules.filter((m) => all.some((f) => f.src.startsWith(m.id + "/")));
    view(`<h1 class="page">اطلس تصاویر</h1><p class="lede">${faDigits(all.length)} عکس و دیاگرام با زیرنویس، منبع و مجوز. روی هر تصویر بزنید تا بزرگ شود (چرخ ماوس برای بزرگ‌نمایی).</p>
      <div class="toolbar"><select class="select" id="aMod"><option value="">همهٔ ماژول‌ها</option>${mods.map((m) => `<option value="${esc(m.id)}" ${m.id === mod ? "selected" : ""}>${modNum(m)} · ${esc(modTitle(m))}</option>`).join("")}</select>
      <input class="input" id="aQ" placeholder="جست‌وجو در زیرنویس‌ها… (مثلاً Klebsiella یا همولیز)" style="flex:1;min-width:220px"><span class="muted" id="aN"></span></div>
      <div class="grid atlas" id="aGrid"></div>`);
    const draw = () => {
      const nq = norm(q);
      const list = all.filter((f) => (!mod || f.src.startsWith(mod + "/")) && (!nq || norm(f.caption).includes(nq)));
      $("#aN").textContent = faDigits(list.length) + " تصویر";
      $("#aGrid").innerHTML = list.map((f) => `<div class="card tile ${f.svg ? "svg" : ""}" data-src="${esc(f.src)}"><div class="im"><img src="${imgUrl(f.src)}" loading="lazy" alt=""></div><div class="cap"><span class="num">شکل ${esc(f.num)}</span> ${inline(f.caption)}</div></div>`).join("");
      $$("#aGrid .tile").forEach((t) => t.onclick = () => { const f = D.figures[t.dataset.src]; openLightbox({ src: imgUrl(f.src), fig: f }); });
    };
    $("#aMod").onchange = (e) => { mod = e.target.value; draw(); };
    let t; $("#aQ").oninput = (e) => { clearTimeout(t); t = setTimeout(() => { q = e.target.value; draw(); }, 200); };
    draw();
  };

  /* ---------- videos ---------- */
  routes.videos = (arg) => {
    const ids = Object.keys(VIDEOS).filter((k) => VIDEOS[k].length && (!arg || k === arg));
    const total = Object.values(VIDEOS).reduce((a, v) => a + v.length, 0);
    view(`<h1 class="page">فیلم‌های آموزشی</h1><p class="lede">${faDigits(total)} فیلم از YouTube، بیشتر از CDC، سازندگان تجهیزات و دانشگاه‌ها. با کلیک، فیلم در مرورگر باز می‌شود و به اینترنت آزاد (در ایران: فیلترشکن) نیاز دارد. روش‌ها را با دستورالعمل آزمایشگاه خود تطبیق دهید.</p>
      ${arg ? `<p><a href="#/videos">← همهٔ ماژول‌ها</a></p>` : ""}
      ${ids.length ? ids.map((k) => `<div class="section-title"><h2>${MODS[k] ? (MODS[k].num != null ? "ماژول " + modNum(MODS[k]) + " · " : "") + esc(modTitle(MODS[k])) : esc(k)}</h2></div><div class="grid videos">${VIDEOS[k].map(vcard).join("")}</div>`).join("") : `<div class="card empty">فهرست فیلم‌ها هنوز خالی است.</div>`}`);
  };
  function vcard(v) {
    return `<a class="card vcard" href="https://www.youtube.com/watch?v=${esc(v.id)}" target="_blank" rel="noopener"><div class="vthumb" style="background-image:url('https://i.ytimg.com/vi/${esc(v.id)}/mqdefault.jpg')"></div><div class="vbody"><div class="vtitle">${esc(v.title)}</div><div class="vmeta">${esc(v.channel || "")}</div>${v.note ? `<div class="vnote">${esc(v.note)}</div>` : ""}</div></a>`;
  }

  /* ---------- search ---------- */
  routes.search = (q) => {
    $("#searchInput").value = q;
    const nq = norm(q).trim();
    if (nq.length < 2) { view(`<h1 class="page">جست‌وجو</h1><div class="card empty">دست‌کم دو حرف بنویسید.</div>`); return; }
    const terms = nq.split(/\s+/).filter(Boolean);
    const docs = Object.values(D.docs).map((d) => {
      const T = norm(d.title), X = norm(d.text);
      let score = 0;
      for (const t of terms) { if (!X.includes(t) && !T.includes(t)) return null; score += (T.includes(t) ? 20 : 0) + Math.min(10, X.split(t).length - 1); }
      return { d, score };
    }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 40);
    const figs = Object.values(D.figures).filter((f) => terms.every((t) => norm(f.caption).includes(t))).slice(0, 12);
    const cases = D.cases.filter((c) => terms.every((t) => norm(c.title + " " + c.q).includes(t))).slice(0, 12);
    const snip = (text) => {
      const n = norm(text), i = n.indexOf(terms[0]);
      const s = Math.max(0, i - 80), part = text.slice(s, s + 240);
      let h = esc(part);
      terms.forEach((t) => { const re = new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi"); h = h.replace(re, "<mark>$1</mark>"); });
      return (s ? "… " : "") + h + " …";
    };
    view(`<h1 class="page">نتایج «${esc(q)}»</h1><p class="lede">${faDigits(docs.length)} صفحه · ${faDigits(figs.length)} تصویر · ${faDigits(cases.length)} سناریو</p>
      ${figs.length ? `<div class="section-title"><h2>تصاویر</h2></div><div class="grid atlas">${figs.map((f) => `<div class="card tile ${f.svg ? "svg" : ""}" data-src="${esc(f.src)}"><div class="im"><img src="${imgUrl(f.src)}" loading="lazy" alt=""></div><div class="cap">${inline(f.caption)}</div></div>`).join("")}</div>` : ""}
      ${docs.length ? `<div class="section-title"><h2>صفحه‌ها</h2></div><div class="results">${docs.map(({ d }) => `<a class="card res" href="#/d/${encodeURIComponent(d.id)}"><div class="rm">${d.module ? esc(modTitle(MODS[d.module])) : ""}</div><div class="rt">${esc(d.title)}</div><div class="rs">${snip(d.text)}</div></a>`).join("")}</div>` : ""}
      ${cases.length ? `<div class="section-title"><h2>سناریوها</h2></div><div class="results">${cases.map((c) => `<a class="card res" href="#/case/${encodeURIComponent(c.id)}"><div class="rm">${esc(modTitle(MODS[c.module]))}</div><div class="rt">${inline(c.title)}</div></a>`).join("")}</div>` : ""}
      ${!docs.length && !figs.length && !cases.length ? `<div class="card empty">نتیجه‌ای پیدا نشد.</div>` : ""}`);
    $$(".tile").forEach((t) => t.onclick = () => { const f = D.figures[t.dataset.src]; openLightbox({ src: imgUrl(f.src), fig: f }); });
  };
  $("#searchForm").addEventListener("submit", (e) => { e.preventDefault(); const q = $("#searchInput").value.trim(); if (q) location.hash = "#/search/" + encodeURIComponent(q); });

  /* ---------- bookmarks ---------- */
  routes.bookmarks = () => {
    const bms = Object.entries(S.bookmarks).sort((a, b) => b[1] - a[1]).map(([id]) => D.docs[id]).filter(Boolean);
    const notes = Object.entries(S.notes).filter(([k]) => D.docs[k]);
    view(`<h1 class="page">نشان‌ها و یادداشت‌ها</h1><p class="lede">صفحه‌هایی که نشان کرده‌اید و یادداشت‌های شخصی شما.</p>
      <div class="section-title"><h2>نشان‌شده‌ها</h2></div>
      ${bms.length ? `<div class="results">${bms.map((d) => `<a class="card res" href="#/d/${encodeURIComponent(d.id)}"><div class="rm">${d.module ? esc(modTitle(MODS[d.module])) : ""}</div><div class="rt">★ ${esc(d.title)}</div></a>`).join("")}</div>` : `<div class="card empty">هنوز صفحه‌ای نشان نکرده‌اید (دکمهٔ ☆ بالای هر صفحه).</div>`}
      <div class="section-title"><h2>یادداشت‌ها</h2></div>
      ${notes.length ? `<div class="results">${notes.map(([id, t]) => `<a class="card res" href="#/d/${encodeURIComponent(id)}"><div class="rt">${esc(D.docs[id].title)}</div><div class="rs">${esc(t.slice(0, 300))}</div></a>`).join("")}</div>` : `<div class="card empty">یادداشتی ندارید.</div>`}`);
  };

  /* ---------- about ---------- */
  routes.about = () => {
    const v = view(`<div class="doc" id="aboutDoc"></div>`);
    $("#aboutDoc").appendChild(renderMd(D.docs["README.md"].md, "README.md"));
    $("#aboutDoc").insertAdjacentHTML("beforeend", `<hr><p class="muted" style="font-size:13px">نسخهٔ داده‌ها: ${esc(D.built)} · ${faDigits(Object.keys(D.docs).length)} صفحه · ${faDigits(Object.keys(D.figures).length)} تصویر · ${faDigits(D.quiz.length)} پرسش تصویری · ${faDigits(D.cases.length)} سناریو. قلم: Vazirmatn (SIL OFL). فلوچارت‌ها: Mermaid (MIT). نمایش Markdown: marked (MIT).</p>`);
    wireImages(v);
  };

  /* ---------- settings ---------- */
  const MODELS = [
    { id: "claude-opus-5-5", name: "Claude Opus 5.5", note: "دقیق‌ترین؛ پیش‌فرض", in: 4, out: 20, read: 0.2, fb: true },
    { id: "claude-sonnet-5-5", name: "Claude Sonnet 5.5", note: "سریع‌تر و ارزان‌تر", in: 2, out: 10, read: 0.2, fb: true },
    { id: "claude-haiku-5-5", name: "Claude Haiku 5.5", note: "ارزان‌ترین؛ برای پرسش‌های ساده", in: 0.1, out: 0.5, read: 0.01, fb: false },
  ];
  const model = () => MODELS.find((m) => m.id === S.settings.model) || MODELS[0];
  routes.settings = () => {
    const k = getKey();
    view(`<h1 class="page">تنظیمات</h1><p class="lede">همهٔ تنظیمات و پیشرفت شما فقط روی همین رایانه ذخیره می‌شود.</p>
      <div class="settings">
        <div class="card"><h2>✦ پرسش از Claude</h2>
          <p class="muted" style="margin:4px 0 0;font-size:14px">کنار هر عنوان در متن، دکمهٔ «✦ بپرس» هست؛ Claude با متن همان بخش به پرسش شما پاسخ می‌دهد. هزینه از حساب API خود شما کسر می‌شود و برنامه هزینهٔ تقریبی هر پاسخ را نشان می‌دهد.</p>
          <div class="field"><label for="apiKey">کلید API (Anthropic)</label>
            <div class="row"><input class="input" id="apiKey" type="password" dir="ltr" style="flex:1;min-width:260px" placeholder="sk-ant-..." value="${esc(k)}"><button class="btn primary" id="saveKey">ذخیره</button><button class="btn" id="testKey">آزمایش</button>${k ? `<button class="btn ghost" id="delKey">حذف</button>` : ""}</div>
            <div class="hint">کلید را از <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">console.anthropic.com</a> بسازید. کلید فقط در حافظهٔ همین برنامه روی این رایانه می‌ماند و مستقیم به Anthropic فرستاده می‌شود؛ در GitHub یا هیچ فایل دیگری ذخیره نمی‌شود. برای کنترل هزینه، در کنسول سقف مصرف ماهانه تعیین کنید.</div><div id="keyMsg" class="hint"></div></div>
          <div class="field"><label>مدل</label><div class="model-opts">${MODELS.map((m) => `<label class="model-opt"><input type="radio" name="model" value="${m.id}" ${model().id === m.id ? "checked" : ""}><span><div class="mn">${m.name}</div><div class="muted" style="font-size:12.5px">${m.note}</div></span><span class="mp">$${m.in} / $${m.out} per 1M tokens</span></label>`).join("")}</div>
            <div class="hint">هر پرسش معمولاً چند هزار توکن ورودی دارد (متن همان بخش)؛ با Opus 5.5 حدود ۱ تا ۵ سنت.</div></div>
        </div>
        <div class="card"><h2>نمایش</h2>
          <div class="field"><label>پوسته</label><div class="chips" id="thChips">${[["auto", "خودکار"], ["light", "روشن"], ["dark", "تیره"]].map(([v, t]) => `<button class="chip ${(S.settings.theme || "auto") === v ? "on" : ""}" data-t="${v}">${t}</button>`).join("")}</div></div>
          <div class="field"><label>اندازهٔ متن</label><div class="chips" id="fsChips">${[14, 15, 16, 17, 18, 19].map((n) => `<button class="chip ${(S.settings.fs || 16) === n ? "on" : ""}" data-f="${n}">${faDigits(n)}</button>`).join("")}</div></div>
        </div>
        <div class="card"><h2>پیشرفت و انتقال به رایانهٔ دیگر</h2>
          <p class="muted" style="margin:4px 0 0;font-size:14px">پیشرفت مطالعه، نشان‌ها، یادداشت‌ها و نتایج آزمون را در یک فایل ذخیره کنید و در رایانهٔ دیگر وارد کنید (کلید API منتقل نمی‌شود).</p>
          <div class="row" style="margin-top:14px"><button class="btn primary" id="exp">ذخیرهٔ فایل پیشرفت</button><label class="btn">وارد کردن فایل<input type="file" id="imp" accept="application/json" hidden></label><button class="btn ghost" id="reset" style="color:var(--bad)">پاک کردن همهٔ پیشرفت</button></div></div>
        <div class="card"><h2>میان‌برها</h2><p style="margin:6px 0 0;font-size:14px;line-height:2.2"><span class="kbd">/</span> جست‌وجو · <span class="kbd">۱–۴</span> انتخاب گزینه در آزمون · <span class="kbd">Enter</span> پرسش بعدی · <span class="kbd">Esc</span> بستن پنجره‌ها</p></div>
      </div>`);
    $("#saveKey").onclick = () => { const v = $("#apiKey").value.trim(); setKey(v); toast(v ? "کلید ذخیره شد" : "کلید حذف شد"); routes.settings(); };
    const del = $("#delKey"); if (del) del.onclick = () => { setKey(""); toast("کلید حذف شد"); routes.settings(); };
    $("#testKey").onclick = async () => {
      const v = $("#apiKey").value.trim(); const msg = $("#keyMsg");
      if (!v) { msg.textContent = "کلیدی وارد نشده است."; return; }
      msg.textContent = "در حال بررسی…";
      try {
        const r = await fetch("https://api.anthropic.com/v1/models?limit=1", { headers: apiHeaders(v) });
        msg.innerHTML = r.ok ? `<span style="color:var(--ok)">✓ کلید معتبر است و اتصال برقرار است.</span>` : `<span style="color:var(--bad)">خطا ${r.status}: ${r.status === 401 ? "کلید نامعتبر است." : "اتصال ناموفق."}</span>`;
      } catch (e) { msg.innerHTML = `<span style="color:var(--bad)">اتصال به اینترنت یا api.anthropic.com برقرار نشد.</span>`; }
    };
    $$('input[name="model"]').forEach((r) => r.onchange = () => { S.settings.model = r.value; save(); toast("مدل: " + model().name); });
    $$("#thChips .chip").forEach((c) => c.onclick = () => { S.settings.theme = c.dataset.t; save(); applyTheme(); initMermaid(); $$("#thChips .chip").forEach((x) => x.classList.toggle("on", x === c)); });
    $$("#fsChips .chip").forEach((c) => c.onclick = () => { S.settings.fs = +c.dataset.f; save(); applyTheme(); $$("#fsChips .chip").forEach((x) => x.classList.toggle("on", x === c)); });
    $("#exp").onclick = () => {
      const blob = new Blob([JSON.stringify({ app: "clinical-microbiology", version: 1, exported: new Date().toISOString(), state: S }, null, 1)], { type: "application/json" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "clinical-microbiology-progress.json"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    };
    $("#imp").onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then((t) => { const j = JSON.parse(t); if (!j.state) throw new Error(); Object.assign(S, j.state); save(); applyTheme(); toast("پیشرفت وارد شد"); routes.settings(); }).catch(() => toast("فایل معتبر نیست"));
    };
    $("#reset").onclick = () => { if (confirm("همهٔ پیشرفت، نشان‌ها، یادداشت‌ها و نتایج آزمون پاک شود؟")) { ["read", "bookmarks", "notes", "quiz", "cases"].forEach((k) => (S[k] = {})); S.quizLog = []; S.last = null; save(); toast("پاک شد"); } };
  };

  /* ---------- Claude (direct Messages API call with the reader's own key) ---------- */
  const SYSTEM = `You are a patient tutor for clinical microbiology residents who are studying a Persian (Farsi) handbook of diagnostic clinical bacteriology.
- Always answer in Persian (Farsi), clearly and concisely; use short paragraphs or bullet points.
- Treat the handbook section supplied with the question as your primary source. If the answer goes beyond it, say so briefly and answer from established knowledge.
- Keep organism names in Latin italics (e.g. *Staphylococcus aureus*). In Persian text, write genus names in full (استافیلوکوکوس، استرپتوکوکوس، انتروکوکوس، پنوموکوکوس، گونوکوکوس، مننگوکوکوس), never shortened forms such as «استاف» or «استرپ».
- For breakpoints, doses or other numbers that change between editions, advise checking the current CLSI M100 or EUCAST tables.
- Give laboratory and diagnostic reasoning; for treatment decisions remind the reader that the clinical team decides.
- Do not give instructions that would increase the danger of select agents beyond what is needed for safe recognition and referral.`;
  function apiHeaders(key, beta) {
    const h = { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2026-10-21", "anthropic-dangerous-direct-browser-access": "true" };
    if (beta) h["anthropic-beta"] = beta;
    return h;
  }
  function costOf(u, m = model()) {
    if (!u) return 0;
    return ((u.input_tokens || 0) * m.in + (u.cache_creation_input_tokens || 0) * m.in * 1.25 + (u.cache_read_input_tokens || 0) * m.read + (u.output_tokens || 0) * m.out) / 1e6;
  }
  const fmtUsd = (x) => "$" + (x < 0.01 ? x.toFixed(4) : x.toFixed(3));
  const costLine = (u) => u ? `هزینهٔ تقریبی این پاسخ: ${fmtUsd(costOf(u))} · ${model().name}` : "";
  async function callClaude({ system, context, messages, onText, onDone, onError, signal }, retryNoFallback) {
    const key = getKey();
    if (!key) { onError("کلید API وارد نشده است. از «تنظیمات» کلید خود را وارد کنید."); return; }
    const m = model();
    const sys = [{ type: "text", text: system }];
    if (context) sys.push({ type: "text", text: `<handbook_section title="${context.title.replace(/"/g, "'")}">\n${context.text.slice(0, 60000)}\n</handbook_section>`, cache_control: { type: "ephemeral" } });
    const body = { model: m.id, max_tokens: 16000, stream: true, system: sys, messages, output_config: { effort: "medium" } };
    const useFb = m.fb && !retryNoFallback;
    if (useFb) body.fallbacks = "default";
    let res;
    try {
      res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: apiHeaders(key, useFb ? "server-side-fallback-2026-07-01" : null), body: JSON.stringify(body), signal });
    } catch (e) { if (e.name !== "AbortError") onError("اتصال به api.anthropic.com برقرار نشد. اتصال اینترنت را بررسی کنید."); return; }
    if (!res.ok) {
      let msg = ""; try { msg = (await res.json()).error.message || ""; } catch (e) { /* no body */ }
      if (res.status === 400 && useFb && /fallback/i.test(msg)) return callClaude({ system, context, messages, onText, onDone, onError, signal }, true);
      const human = { 401: "کلید API نامعتبر است.", 403: "این کلید اجازهٔ دسترسی ندارد.", 429: "محدودیت تعداد درخواست؛ کمی بعد دوباره امتحان کنید.", 529: "سرور Anthropic موقتاً شلوغ است؛ کمی بعد دوباره امتحان کنید." }[res.status];
      onError((human || "خطا " + res.status) + (msg ? " — " + msg : "")); return;
    }
    const reader = res.body.getReader(), dec = new TextDecoder();
    let buf = "", text = "", usage = {}, stop = null;
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf("\n\n")) >= 0) {
          const chunk = buf.slice(0, i); buf = buf.slice(i + 2);
          const line = chunk.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue;
          let ev; try { ev = JSON.parse(line.slice(5)); } catch (e) { continue; }
          if (ev.type === "message_start") Object.assign(usage, ev.message.usage || {});
          else if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") { text += ev.delta.text; onText(text); }
          else if (ev.type === "message_delta") { Object.assign(usage, ev.usage || {}); stop = ev.delta && ev.delta.stop_reason; }
          else if (ev.type === "error") { onError("خطای سرور: " + (ev.error && ev.error.message)); return; }
        }
      }
    } catch (e) { if (e.name !== "AbortError") onError("ارتباط قطع شد."); return; }
    if (stop === "refusal" && !text) { onError("Claude به این پرسش پاسخ نداد. پرسش را به شکل دیگری بنویسید."); return; }
    if (stop === "max_tokens") text += "\n\n_(پاسخ به سقف طول رسید.)_";
    onDone(usage, text);
  }

  /* ---------- ask drawer ---------- */
  const ask = { ctx: null, msgs: [], total: 0, ctrl: null };
  function openDrawer(ctx) {
    if (!ask.ctx || ask.ctx.title !== ctx.title) { ask.ctx = ctx; ask.msgs = []; $("#askLog").innerHTML = ""; }
    $("#askCtx").textContent = "دربارهٔ: " + ctx.title.slice(0, 90);
    if (!ask.msgs.length) {
      const sug = ctx.suggest || ["این بخش را ساده و خلاصه توضیح بده", "مهم‌ترین نکات آزمونی این بخش چیست؟", "یک پرسش چندگزینه‌ای از این بخش از من بپرس"];
      $("#askLog").innerHTML = `<div class="msg bot md"><p>سلام! هر پرسشی دربارهٔ <b>${esc(ctx.title.slice(0, 80))}</b> دارید بنویسید. پاسخ بر پایهٔ متن همین بخش است.</p>${getKey() ? "" : `<p style="color:var(--bad)">برای استفاده، ابتدا <a href="#/settings">کلید API</a> را وارد کنید.</p>`}<div class="suggest">${sug.map((s) => `<button class="chip" type="button">${esc(s)}</button>`).join("")}</div></div>`;
      $$("#askLog .suggest .chip").forEach((c) => c.onclick = () => { $("#askInput").value = c.textContent; $("#askForm").requestSubmit(); });
    }
    $("#askDrawer").classList.add("open"); $("#askDrawer").setAttribute("aria-hidden", "false"); $("#scrim").classList.add("on");
    setTimeout(() => $("#askInput").focus(), 250);
  }
  function closeDrawer(silent) { $("#askDrawer").classList.remove("open"); $("#askDrawer").setAttribute("aria-hidden", "true"); $("#scrim").classList.remove("on"); if (!silent && ask.ctrl) { /* keep running answer */ } }
  $("#askClose").onclick = () => closeDrawer();
  $("#scrim").onclick = () => closeDrawer();
  $("#askInput").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("#askForm").requestSubmit(); } });
  $("#askForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = $("#askInput").value.trim(); if (!q || ask.busy) return;
    $("#askInput").value = "";
    const log = $("#askLog");
    log.insertAdjacentHTML("beforeend", `<div class="msg user">${esc(q)}</div><div class="msg bot md"><span class="typing"><i></i><i></i><i></i> Claude در حال فکر کردن است…</span></div>`);
    const out = log.lastElementChild; log.scrollTop = log.scrollHeight;
    ask.msgs.push({ role: "user", content: q });
    ask.busy = true; $("#askSend").disabled = true;
    let raf = 0;
    await callClaude({ system: SYSTEM, context: ask.ctx, messages: ask.msgs.slice(),
      onText: (t) => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { out.innerHTML = marked.parse(t); log.scrollTop = log.scrollHeight; }); },
      onDone: (u, t) => {
        cancelAnimationFrame(raf); out.innerHTML = marked.parse(t);
        ask.msgs.push({ role: "assistant", content: t });
        const c = costOf(u); ask.total += c;
        out.insertAdjacentHTML("beforeend", `<div class="meta">${costLine(u)}</div>`);
        $("#askCost").textContent = "جمع هزینهٔ این نشست: " + fmtUsd(ask.total);
      },
      onError: (m) => { ask.msgs.pop(); out.className = "msg err"; out.innerHTML = esc(m) + (/کلید/.test(m) ? ` <a href="#/settings">تنظیمات ←</a>` : ""); } });
    ask.busy = false; $("#askSend").disabled = false; log.scrollTop = log.scrollHeight;
  });

  /* floating "ask" button for pages with a context */
  function addFab(getCtx) {
    removeFab();
    const b = document.createElement("button");
    b.className = "fab"; b.id = "fab"; b.innerHTML = `<span class="spark">✦</span> پرسش از Claude`;
    b.onclick = () => openDrawer(getCtx());
    document.body.appendChild(b);
  }
  function removeFab() { const f = $("#fab"); if (f) f.remove(); if (routes.d.cleanup) { routes.d.cleanup(); routes.d.cleanup = null; } }

  /* ---------- global keys & chrome ---------- */
  document.addEventListener("keydown", (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if (e.key === "Escape") { closeLightbox(); closeDrawer(); return; }
    if (typing) return;
    if (e.key === "/") { e.preventDefault(); $("#searchInput").focus(); return; }
    if ($(".opt")) {
      const n = "1234۱۲۳۴".indexOf(e.key);
      if (n >= 0 && !$(".opt[disabled]")) { const k = n % 4; if ($$(".opt")[k]) answerQ(k); }
      else if (e.key === "Enter" && $("#nextQ")) { e.preventDefault(); nextQ(); }
    }
  });
  $("#themeToggle").onclick = () => { S.settings.theme = isDark() ? "light" : "dark"; save(); applyTheme(); initMermaid(); route(); };
  $("#navToggle").onclick = () => $("#sidenav").classList.toggle("open");
  if (matchMedia("(hover: none)").matches) document.documentElement.classList.add("touch");

  applyTheme(); initMermaid(); route();
})();
