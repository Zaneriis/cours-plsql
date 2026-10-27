/* Cours PL/SQL — logique du site : navigation, progression, coloration, quiz, animations. */
(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ================= Progression ================= */
  const KEY = "plsql-cours-progress-v1";
  const store = {
    data: { done: {}, ex: {}, quiz: {}, visited: {}, flash: {}, last: null, updatedAt: 0 },
    db: null,
    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) Object.assign(this.data, JSON.parse(raw));
      } catch (e) { /* stockage indisponible : la page fonctionne sans */ }
    },
    save() {
      this.data.updatedAt = Date.now();
      try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) {}
      this.queueRemote();
      renderProgress();
    },
    // Synchronisation optionnelle quand la page tourne comme Artifact claude.ai (window.claude présent).
    timer: null,
    writing: false,
    queueRemote() {
      if (!this.db) return;
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.pushRemote(), 800);
    },
    async pushRemote() {
      if (!this.db || this.writing) { this.queueRemote(); return; }
      this.writing = true;
      try { await this.db.set(JSON.parse(JSON.stringify(this.data))); } catch (e) {}
      this.writing = false;
    },
    async initRemote() {
      if (!window.claude || typeof window.claude.use !== "function") return;
      try {
        const [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
        if (!db || !user || typeof user.id !== "function") return;
        const id = await user.id();
        if (!id) return;
        const ref = db.collection("data/users/" + id).doc("progression");
        const snap = await ref.get();
        if (snap.exists) {
          const remote = snap.data() || {};
          if ((remote.updatedAt || 0) > (this.data.updatedAt || 0)) {
            Object.assign(this.data, remote);
            try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) {}
            refreshAll();
          }
        }
        this.db = ref;
        if (!snap.exists || (snap.data() || {}).updatedAt < this.data.updatedAt) this.queueRemote();
      } catch (e) { /* pas de synchro : localStorage suffit */ }
    },
  };

  /* ================= Coloration PL/SQL ================= */
  const KW = new Set(("ACCESSIBLE ADD AFTER AGGREGATE ALL ALTER AND ANY ARRAY AS ASC AUTHID AUTONOMOUS_TRANSACTION BEFORE BEGIN BETWEEN BINARY_INTEGER BODY BOOLEAN BULK BULK_EXCEPTIONS BULK_ROWCOUNT BY BYTE CASCADE CASE CHAR CHECK CLOSE COLLECT COLUMN COMMIT COMPOUND CONSTANT CONSTRAINT CONTINUE CREATE CROSS CURRENT CURSOR DATE DAY DECLARE DEFAULT DEFINER DELETE DESC DETERMINISTIC DISTINCT DROP EACH EDITIONABLE ELSE ELSIF END ERRORS EXCEPTION EXCEPTION_INIT EXCEPTIONS EXECUTE EXISTS EXIT EXTEND FALSE FETCH FIRST FOR FORALL FOREIGN FROM FULL FUNCTION GRANT GROUP HAVING IF IMMEDIATE IN INDEX INDICES INNER INSERT INSTEAD INTEGER INTERVAL INTO INVOKER IS JOIN KEY LAST LEFT LIKE LIMIT LOOP MATCHED MERGE MINUS MONTH MULTISET NATURAL NOCOPY NOT NOTFOUND FOUND ISOPEN ROWCOUNT NULL NUMBER OF OLD NEW ON OPEN OR ORDER OTHERS OUT OUTER PACKAGE PARALLEL_ENABLE PARTITION PIPE PIPELINED PLS_INTEGER PRAGMA PRIMARY PRIOR PROCEDURE RAISE RANGE RECORD REF REFERENCES REFERENCING REPLACE RESULT_CACHE RETURN RETURNING REVERSE ROLLBACK ROW ROWTYPE ROWID SAVE SAVEPOINT SELECT SERIALLY_REUSABLE SET SIMPLE_INTEGER STATEMENT SUBTYPE SYS_REFCURSOR TABLE THEN TIMESTAMP TO TRIGGER TRUE TYPE UNION UNIQUE UPDATE USING VALUES VARCHAR2 VARCHAR VARRAY VIEW WHEN WHERE WHILE WITH YEAR CLOB BLOB NVARCHAR2 NCHAR RAW LONG ROWNUM FETCH NEXT ONLY OFFSET ROWS DISABLE ENABLE REPLACE FORCE NO_DATA_FOUND TOO_MANY_ROWS ZERO_DIVIDE VALUE_ERROR DUP_VAL_ON_INDEX INVALID_CURSOR CURSOR_ALREADY_OPEN INVALID_NUMBER COLLECTION_IS_NULL SUBSCRIPT_BEYOND_COUNT SUBSCRIPT_OUTSIDE_LIMIT LOGIN_DENIED TIMEOUT_ON_RESOURCE PROGRAM_ERROR STORAGE_ERROR ROWTYPE_MISMATCH CASE_NOT_FOUND SYSDATE SYSTIMESTAMP USER LEVEL CONNECT START PRIOR NOCYCLE").split(" "));
  const FN = /^(DBMS_OUTPUT|DBMS_UTILITY|DBMS_ASSERT|DBMS_SQL|DBMS_LOCK|DBMS_SESSION|DBMS_APPLICATION_INFO|DBMS_STATS|DBMS_XPLAN|DBMS_RANDOM|UTL_CALL_STACK|UTL_FILE|RAISE_APPLICATION_ERROR|SQLCODE|SQLERRM|NVL|NVL2|COALESCE|DECODE|TO_CHAR|TO_DATE|TO_NUMBER|TRUNC|ROUND|SUBSTR|INSTR|LENGTH|UPPER|LOWER|INITCAP|TRIM|LPAD|RPAD|COUNT|SUM|AVG|MIN|MAX|ADD_MONTHS|MONTHS_BETWEEN|LAST_DAY|EXTRACT|CAST|SQL|LISTAGG|ROW_NUMBER|RANK|DENSE_RANK|LAG|LEAD|MOD|ABS|GREATEST|LEAST|REPLACE|NULLIF|SYS_CONTEXT|CARDINALITY)$/i;

  function highlight(src) {
    let out = "";
    let i = 0;
    const n = src.length;
    while (i < n) {
      const c = src[i];
      const rest = src.slice(i);
      let m;
      if (rest.startsWith("--")) {
        const end = src.indexOf("\n", i);
        const t = end === -1 ? rest : src.slice(i, end);
        out += '<span class="tk-com">' + esc(t) + "</span>"; i += t.length; continue;
      }
      if (rest.startsWith("/*")) {
        const end = src.indexOf("*/", i + 2);
        const t = end === -1 ? rest : src.slice(i, end + 2);
        out += '<span class="tk-com">' + esc(t) + "</span>"; i += t.length; continue;
      }
      if (c === "'" || ((c === "q" || c === "Q") && src[i + 1] === "'")) {
        let j = i + (c === "'" ? 1 : 2);
        if (c !== "'") {
          const open = src[j]; const close = { "[": "]", "{": "}", "(": ")", "<": ">" }[open] || open;
          const end = src.indexOf(close + "'", j + 1);
          j = end === -1 ? n : end + 2;
        } else {
          while (j < n) { if (src[j] === "'") { if (src[j + 1] === "'") { j += 2; continue; } j++; break; } j++; }
        }
        out += '<span class="tk-str">' + esc(src.slice(i, j)) + "</span>"; i = j; continue;
      }
      if ((m = /^:(new|old|[a-z_]\w*)\b/i.exec(rest)) && (i === 0 || !/\w/.test(src[i - 1]))) {
        out += '<span class="tk-bind">' + esc(m[0]) + "</span>"; i += m[0].length; continue;
      }
      if ((m = /^\d+(\.\d+)?/.exec(rest)) && (i === 0 || !/\w/.test(src[i - 1]))) {
        out += '<span class="tk-num">' + m[0] + "</span>"; i += m[0].length; continue;
      }
      if ((m = /^[A-Za-z_][\w$#]*/.exec(rest))) {
        const w = m[0];
        const prev = src[i - 1];
        if (prev === "%") out += '<span class="tk-kw">' + esc(w) + "</span>";
        else if (KW.has(w.toUpperCase())) out += '<span class="tk-kw">' + esc(w) + "</span>";
        else if (FN.test(w)) out += '<span class="tk-fn">' + esc(w) + "</span>";
        else out += esc(w);
        i += w.length; continue;
      }
      out += esc(c); i++;
    }
    return out;
  }

  function dedent(s) {
    s = s.replace(/^\n+/, "").replace(/\s+$/, "");
    const lines = s.split("\n");
    const ind = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
    return lines.map((l) => l.slice(ind)).join("\n");
  }

  function buildCode(src, title) {
    const wrap = document.createElement("div");
    wrap.className = "code";
    const html = highlight(src).split("\n").map((l, k) => '<span class="ln" data-l="' + (k + 1) + '">' + (l || " ") + "</span>").join("");
    wrap.innerHTML = '<div class="code-head"><span class="t">' + esc(title || "PL/SQL") + '</span><button type="button" class="btn-copy">Copier</button></div><pre><code>' + html + "</code></pre>";
    $(".btn-copy", wrap).addEventListener("click", (ev) => {
      const b = ev.currentTarget;
      const done = () => { b.textContent = "Copié"; setTimeout(() => (b.textContent = "Copier"), 1400); };
      try {
        navigator.clipboard.writeText(src).then(done, () => selectCode(wrap));
      } catch (e) { selectCode(wrap); }
    });
    return wrap;
  }
  function selectCode(wrap) {
    const r = document.createRange(); r.selectNodeContents($("pre", wrap));
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    toast("Code sélectionné : Ctrl+C pour copier");
  }

  function renderCodeBlocks() {
    $$('script[type="text/plsql"]').forEach((s) => {
      const el = buildCode(dedent(s.textContent), s.dataset.title);
      s.replaceWith(el);
    });
  }

  /* ================= Chapitres & navigation ================= */
  let chapters = [];
  function collectChapters() {
    chapters = $$(".chapter").map((sec) => ({
      id: sec.id, el: sec, num: sec.dataset.num || "", title: sec.dataset.title, desc: sec.dataset.desc || "",
      min: +sec.dataset.min || 0, group: sec.dataset.group || "", course: sec.dataset.course !== "no",
    }));
  }
  const courseChapters = () => chapters.filter((c) => c.course);

  function exIds(ch) { return $$(".ex[data-ex]", ch.el).map((e) => e.dataset.ex); }
  function chapterStatus(ch) {
    const d = store.data;
    if (d.done[ch.id]) return "done";
    const ids = exIds(ch);
    const exDone = ids.filter((id) => d.ex[id]).length;
    if (d.visited[ch.id] || exDone || d.quiz[ch.id]) return "started";
    return "todo";
  }
  function chapterPct(ch) {
    const ids = exIds(ch);
    if (store.data.done[ch.id]) return 100;
    const q = store.data.quiz[ch.id];
    const parts = ids.length + 1;
    const got = ids.filter((id) => store.data.ex[id]).length + (q && q.answered === q.total ? 1 : 0);
    return Math.round((got / parts) * 100);
  }

  function buildToc() {
    const toc = $("#toc");
    let html = "";
    let lastGroup = null;
    chapters.forEach((ch) => {
      if (ch.group && ch.group !== lastGroup) { html += '<li class="toc-group">' + esc(ch.group) + "</li>"; lastGroup = ch.group; }
      html += '<li><a href="#' + ch.id + '" data-id="' + ch.id + '"><span class="num">' + esc(ch.num) + '</span><span>' + esc(ch.title) + '</span>' +
        (ch.course ? '<span class="st" data-st="' + ch.id + '"></span>' : "<span></span>") + "</a></li>";
    });
    toc.innerHTML = html;
  }

  function route() {
    let id = (location.hash || "").slice(1);
    if (!chapters.find((c) => c.id === id)) id = "accueil";
    chapters.forEach((c) => (c.el.hidden = c.id !== id));
    $$("#toc a").forEach((a) => { if (a.dataset.id === id) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    const ch = chapters.find((c) => c.id === id);
    document.title = (ch && ch.id !== "accueil" ? ch.title + " · " : "") + "Cours PL/SQL";
    if (ch && ch.course) {
      if (!store.data.visited[id] || store.data.last !== id) {
        store.data.visited[id] = true; store.data.last = id; store.save();
      }
    }
    $(".side").classList.remove("open");
    window.scrollTo(0, 0);
    renderMermaid(ch.el);
    if (id === "accueil") renderHome();
  }

  /* ================= Rendu de la progression ================= */
  function renderProgress() {
    const cc = courseChapters();
    const done = cc.filter((c) => store.data.done[c.id]).length;
    const allEx = cc.flatMap(exIds);
    const exDone = allEx.filter((id) => store.data.ex[id]).length;
    const pct = cc.length ? Math.round((done / cc.length) * 100) : 0;
    $$("[data-p='chapters']").forEach((e) => (e.textContent = done + " / " + cc.length));
    $$("[data-p='ex']").forEach((e) => (e.textContent = exDone + " / " + allEx.length));
    $$("[data-p='pct']").forEach((e) => (e.textContent = pct + " %"));
    $$("[data-p='bar']").forEach((e) => (e.style.width = pct + "%"));
    cc.forEach((ch) => {
      const st = $('[data-st="' + ch.id + '"]');
      if (!st) return;
      const s = chapterStatus(ch);
      st.className = "st " + (s === "todo" ? "" : s);
      st.style.setProperty("--p", Math.max(chapterPct(ch), 12) + "%");
      st.title = s === "done" ? "Terminé" : s === "started" ? "En cours (" + chapterPct(ch) + " %)" : "Pas commencé";
    });
    chapters.forEach(renderFoot);
    if (!$("#accueil").hidden) renderHome();
  }

  function renderHome() {
    const cc = courseChapters();
    const grid = $("#home-cards");
    if (!grid) return;
    grid.innerHTML = cc.map((ch) => {
      const s = chapterStatus(ch);
      const label = s === "done" ? "Terminé" : s === "started" ? "En cours · " + chapterPct(ch) + " %" : "À faire";
      const nEx = exIds(ch).length;
      return '<a class="card" href="#' + ch.id + '"><span class="n"><span>Chapitre ' + esc(ch.num) + '</span><span>' + ch.min + ' min</span></span><h3>' + esc(ch.title) + '</h3><p>' + esc(ch.desc) +
        '</p><span class="meta"><span class="chip ' + (s === "todo" ? "" : s) + '">' + label + "</span>" + (nEx ? "<span>" + nEx + " exercices</span>" : "") + "</span></a>";
    }).join("");
    // Bouton « reprendre »
    const next = cc.find((c) => store.data.last === c.id && !store.data.done[c.id]) || cc.find((c) => !store.data.done[c.id]);
    const r = $("#resume-btn");
    const rt = $("#resume-txt");
    if (next) {
      r.href = "#" + next.id; r.hidden = false;
      const started = chapterStatus(next) === "started";
      r.textContent = (started ? "Reprendre : " : "Commencer : ") + "chapitre " + next.num;
      rt.textContent = next.title;
    } else {
      r.hidden = true; rt.textContent = "Tout est terminé. Passe en revue les questions d'entretien !";
    }
  }

  function renderFoot(ch) {
    if (!ch.course) return;
    let foot = $(".ch-foot", ch.el);
    const idx = chapters.indexOf(ch);
    const prev = chapters[idx - 1], next = chapters[idx + 1];
    if (!foot) {
      foot = document.createElement("div");
      foot.className = "ch-foot";
      foot.innerHTML = '<div class="sum"></div><button type="button" class="btn done-btn"></button><div class="pager">' +
        (prev ? '<a class="btn" href="#' + prev.id + '">← ' + esc(prev.title) + "</a>" : "<span></span>") +
        (next ? '<a class="btn primary" href="#' + next.id + '">' + esc(next.title) + " →</a>" : "") + "</div>";
      ch.el.appendChild(foot);
      $(".done-btn", foot).addEventListener("click", () => {
        const v = !store.data.done[ch.id];
        if (v) store.data.done[ch.id] = Date.now(); else delete store.data.done[ch.id];
        store.save();
        toast(v ? "Chapitre " + ch.num + " marqué comme terminé" : "Chapitre " + ch.num + " remis en cours");
      });
    }
    const ids = exIds(ch);
    const exDone = ids.filter((id) => store.data.ex[id]).length;
    const q = store.data.quiz[ch.id];
    let sum = ids.length ? "Exercices faits : " + exDone + " / " + ids.length : "";
    if (window.QUIZ && window.QUIZ[ch.id]) sum += (sum ? " · " : "") + "Quiz : " + (q ? q.score + " / " + q.total : "pas encore fait");
    $(".sum", foot).textContent = sum;
    const b = $(".done-btn", foot);
    const isDone = !!store.data.done[ch.id];
    b.setAttribute("aria-pressed", String(isDone));
    b.textContent = isDone ? "✓ Chapitre terminé" : "Marquer le chapitre comme terminé";
  }

  /* ================= Exercices ================= */
  function initExercises() {
    $$(".ex[data-ex]").forEach((ex) => {
      const head = $(".ex-head", ex);
      const btn = document.createElement("button");
      btn.type = "button"; btn.className = "toggle-done";
      head.appendChild(btn);
      btn.addEventListener("click", () => {
        const id = ex.dataset.ex;
        if (store.data.ex[id]) delete store.data.ex[id]; else store.data.ex[id] = Date.now();
        store.save(); paintExercise(ex);
      });
      paintExercise(ex);
    });
  }
  function paintExercise(ex) {
    const on = !!store.data.ex[ex.dataset.ex];
    const b = $(".toggle-done", ex);
    b.setAttribute("aria-pressed", String(on));
    b.textContent = on ? "✓ Fait" : "Marquer comme fait";
    ex.classList.toggle("is-done", on);
  }

  /* ================= Quiz ================= */
  function initQuizzes() {
    $$("[data-quiz]").forEach((box) => {
      const id = box.dataset.quiz;
      const qs = (window.QUIZ || {})[id];
      if (!qs) return;
      box.classList.add("quiz");
      const answers = {};
      box.innerHTML = qs.map((q, k) =>
        '<div class="q" data-k="' + k + '"><p class="q-title">' + (k + 1) + ". " + q.q + '</p><div class="q-opts">' +
        q.o.map((o, j) => '<button type="button" class="q-opt" data-j="' + j + '">' + o + "</button>").join("") +
        '</div><p class="q-why" hidden></p></div>').join("") +
        '<div class="quiz-score" aria-live="polite"></div>';
      const score = $(".quiz-score", box);
      const saved = store.data.quiz[id];
      const paint = () => {
        const n = Object.keys(answers).length;
        const good = Object.values(answers).filter(Boolean).length;
        score.textContent = n ? "Score : " + good + " / " + qs.length + (n < qs.length ? " (" + (qs.length - n) + " restante(s))" : "") : (saved ? "Dernier score enregistré : " + saved.score + " / " + saved.total : "");
        if (n === qs.length) {
          store.data.quiz[id] = { score: good, total: qs.length, answered: n, at: Date.now() };
          store.save();
          score.innerHTML = "Score : " + good + " / " + qs.length + ' <button type="button" class="btn small" data-retry>Recommencer</button>';
          $("[data-retry]", score).addEventListener("click", () => { initOne(); });
        }
      };
      const initOne = () => {
        Object.keys(answers).forEach((k) => delete answers[k]);
        $$(".q", box).forEach((qel) => {
          $$(".q-opt", qel).forEach((b) => { b.disabled = false; b.classList.remove("right", "wrong"); });
          $(".q-why", qel).hidden = true;
        });
        score.textContent = "";
      };
      $$(".q", box).forEach((qel) => {
        const k = +qel.dataset.k, q = qs[k];
        $$(".q-opt", qel).forEach((b) => b.addEventListener("click", () => {
          const j = +b.dataset.j;
          answers[k] = j === q.a;
          $$(".q-opt", qel).forEach((x) => { x.disabled = true; if (+x.dataset.j === q.a) x.classList.add("right"); });
          if (j !== q.a) b.classList.add("wrong");
          const why = $(".q-why", qel); why.innerHTML = (j === q.a ? "✓ Exact. " : "✗ Pas tout à fait. ") + q.w; why.hidden = false;
          paint();
        }));
      });
      paint();
    });
  }

  /* ================= Pas-à-pas animé ================= */
  function initSteppers() {
    $$("[data-stepper]").forEach((box) => {
      const cfg = (window.STEPPERS || {})[box.dataset.stepper];
      if (!cfg) return;
      box.classList.add("stepper");
      box.innerHTML = '<div class="stepper-head"><strong>' + esc(cfg.title) + '</strong><div class="stepper-ctrl">' +
        '<button type="button" class="btn small" data-a="reset" title="Revenir au début">⟲</button>' +
        '<button type="button" class="btn small" data-a="prev">← Préc.</button><span class="count"></span>' +
        '<button type="button" class="btn small primary" data-a="next">Suiv. →</button>' +
        '<button type="button" class="btn small" data-a="play">▶ Lecture</button></div></div>' +
        '<div class="stepper-grid"><div class="code-slot"></div><div class="stepper-state"><div class="stepper-note"></div><div class="extra"></div><dl class="vars"></dl><div class="console"></div></div></div>';
      const code = buildCode(dedent(cfg.code), cfg.file || "Exécution pas à pas");
      $(".code-slot", box).replaceWith(code);
      let i = 0, timer = null, prevVars = {};
      const steps = cfg.steps;
      const show = () => {
        const s = steps[i];
        $$(".ln", code).forEach((l) => l.classList.toggle("on", (Array.isArray(s.l) ? s.l : [s.l]).includes(+l.dataset.l)));
        const on = $(".ln.on", code);
        if (on) { const pre = $("pre", code); const top = on.offsetTop - pre.clientHeight / 2; pre.scrollTop = Math.max(0, top); }
        $(".stepper-note", box).innerHTML = s.n;
        // Variables cumulées jusqu'à l'étape i
        const vars = {}; const out = [];
        for (let k = 0; k <= i; k++) { Object.assign(vars, steps[k].v || {}); if (steps[k].o) out.push(steps[k].o); }
        $(".vars", box).innerHTML = Object.keys(vars).map((k) => "<dt>" + esc(k) + '</dt><dd class="' + (prevVars[k] !== vars[k] && (steps[i].v || {})[k] !== undefined ? "changed" : "") + '">' + esc(vars[k]) + "</dd>").join("");
        prevVars = vars;
        $(".console", box).innerHTML = out.map((o) => (o.startsWith("!") ? '<span class="err">' + esc(o.slice(1)) + "</span>" : esc(o))).join("\n");
        // Jeu de résultats optionnel
        const extra = $(".extra", box);
        if (cfg.table) {
          let ptr = null;
          for (let k = 0; k <= i; k++) if (steps[k].p !== undefined) ptr = steps[k].p;
          extra.innerHTML = '<div class="table-wrap" style="margin:0"><table class="rs"><thead><tr>' + cfg.table.cols.map((c) => "<th>" + esc(c) + "</th>").join("") + "</tr></thead><tbody>" +
            cfg.table.rows.map((r, k) => '<tr class="' + (ptr === k ? "ptr" : "") + '">' + r.map((c) => "<td>" + esc(c) + "</td>").join("") + "</tr>").join("") + "</tbody></table></div>" +
            (cfg.table.caption ? '<div class="hint" style="margin-top:4px">' + esc(cfg.table.caption) + "</div>" : "");
        }
        $(".count", box).textContent = i + 1 + " / " + steps.length;
        $('[data-a="prev"]', box).disabled = i === 0;
        $('[data-a="next"]', box).disabled = i === steps.length - 1;
      };
      const stop = () => { clearInterval(timer); timer = null; $('[data-a="play"]', box).textContent = "▶ Lecture"; };
      box.addEventListener("click", (e) => {
        const a = e.target.closest("[data-a]"); if (!a) return;
        const act = a.dataset.a;
        if (act === "next" && i < steps.length - 1) { i++; show(); }
        if (act === "prev" && i > 0) { i--; show(); }
        if (act === "reset") { stop(); i = 0; prevVars = {}; show(); }
        if (act === "play") {
          if (timer) { stop(); return; }
          if (i === steps.length - 1) i = 0;
          a.textContent = "❚❚ Pause";
          timer = setInterval(() => { if (i >= steps.length - 1) { stop(); return; } i++; show(); }, 1700);
        }
        if (act !== "play" && timer && act !== "reset") stop();
      });
      show();
    });
  }

  /* ================= Course « ligne par ligne » vs FORALL ================= */
  function initRace() {
    $$("[data-race]").forEach((box) => {
      box.innerHTML = '<div class="fc-bar"><label for="race-n">Lignes à insérer :</label><select id="race-n" class="btn small"><option>10</option><option selected>25</option><option>50</option></select>' +
        '<button type="button" class="btn primary small" data-go>▶ Lancer la course</button></div>' +
        '<div class="race">' + lane("slow", "Boucle FOR + INSERT (ligne par ligne)") + lane("fast", "FORALL (un seul aller-retour)") + "</div>";
      function lane(k, t) {
        return '<div class="lane" data-lane="' + k + '"><div class="lane-top"><span>' + t + '</span><span>Changements de contexte : <b data-c>0</b> · lignes : <b data-r>0</b></span></div>' +
          '<div class="track"><div class="engine plsql">Moteur<br>PL/SQL</div><div class="wire"><span class="token" data-tok></span></div><div class="engine sql">Moteur<br>SQL</div></div></div>';
      }
      let running = false;
      $("[data-go]", box).addEventListener("click", async () => {
        if (running) return; running = true;
        const n = +$("select", box).value;
        const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
        const run = async (k, trips, perTrip, ms) => {
          const ln = $('[data-lane="' + k + '"]', box);
          const tok = $("[data-tok]", ln), wire = $(".wire", ln);
          const c = $("[data-c]", ln), r = $("[data-r]", ln);
          c.textContent = "0"; r.textContent = "0";
          for (let t = 0; t < trips; t++) {
            tok.textContent = perTrip > 1 ? perTrip : "1";
            const dist = wire.clientWidth - tok.offsetWidth;
            await anim(tok, 0, dist, reduce ? 0 : ms);
            c.textContent = String(t * 2 + 1);
            r.textContent = String(Math.min((t + 1) * perTrip, n));
            await anim(tok, dist, 0, reduce ? 0 : ms);
            c.textContent = String(t * 2 + 2);
          }
        };
        await Promise.all([run("slow", n, 1, 140), run("fast", 1, n, 700)]);
        running = false;
      });
    });
    function anim(el, from, to, ms) {
      return new Promise((res) => {
        if (!ms) { el.style.transform = "translateX(" + to + "px)"; return setTimeout(res, 20); }
        const t0 = performance.now();
        const f = (now) => {
          const p = Math.min(1, (now - t0) / ms);
          const e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
          el.style.transform = "translateX(" + (from + (to - from) * e) + "px)";
          if (p < 1) requestAnimationFrame(f); else res();
        };
        requestAnimationFrame(f);
      });
    }
  }

  /* ================= Flashcards entretien ================= */
  function initFlash() {
    const box = $("#flashcards");
    const cards = window.FLASH || [];
    if (!box || !cards.length) return;
    let order = cards.map((_, k) => k), pos = 0, onlyReview = false;
    box.innerHTML = '<div class="fc-bar"><button type="button" class="btn small" data-f="prev">←</button><span class="quiz-score" data-f="count"></span><button type="button" class="btn small" data-f="next">→</button>' +
      '<button type="button" class="btn small" data-f="shuffle">Mélanger</button><button type="button" class="btn small" data-f="filter" aria-pressed="false">Seulement « à revoir »</button></div>' +
      '<div class="flash"><div class="flash-inner" tabindex="0" role="button" aria-label="Retourner la carte"><div class="flash-face front"></div><div class="flash-face back"></div></div></div>' +
      '<div class="fc-bar"><button type="button" class="btn small" data-f="ko">À revoir</button><button type="button" class="btn small primary" data-f="ok">Je sais</button><span class="hint" data-f="stat"></span></div>';
    const flash = $(".flash", box);
    const list = () => (onlyReview ? order.filter((k) => store.data.flash[k] !== "ok") : order);
    const show = () => {
      const L = list();
      if (!L.length) { $(".front", box).innerHTML = '<div class="qtxt">Aucune carte à revoir. Bravo !</div>'; $(".back", box).innerHTML = ""; $('[data-f="count"]', box).textContent = "0 / 0"; return; }
      pos = (pos + L.length) % L.length;
      const k = L[pos], c = cards[k];
      flash.classList.remove("flipped");
      const st = store.data.flash[k];
      $(".front", box).innerHTML = '<span class="tag">' + esc(c.t) + (st ? " · " + (st === "ok" ? "su" : "à revoir") : "") + '</span><div class="qtxt">' + c.q + '</div><span class="hint">Clique ou Espace pour voir la réponse</span>';
      $(".back", box).innerHTML = '<span class="tag">Réponse</span><div class="prose">' + c.a + "</div>";
      $('[data-f="count"]', box).textContent = pos + 1 + " / " + L.length;
      const okN = cards.filter((_, j) => store.data.flash[j] === "ok").length;
      $('[data-f="stat"]', box).textContent = okN + " / " + cards.length + " cartes maîtrisées";
    };
    const flip = () => flash.classList.toggle("flipped");
    $(".flash-inner", box).addEventListener("click", flip);
    $(".flash-inner", box).addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); } });
    box.addEventListener("click", (e) => {
      const b = e.target.closest("[data-f]"); if (!b || b.tagName !== "BUTTON") return;
      const f = b.dataset.f; const L = list();
      if (f === "next") pos++;
      if (f === "prev") pos--;
      if (f === "shuffle") { order = order.sort(() => Math.random() - 0.5); pos = 0; }
      if (f === "filter") { onlyReview = !onlyReview; b.setAttribute("aria-pressed", String(onlyReview)); b.classList.toggle("primary", onlyReview); pos = 0; }
      if ((f === "ok" || f === "ko") && L.length) { store.data.flash[L[pos]] = f; store.save(); if (!(onlyReview && f === "ok")) pos++; }
      show();
    });
    show();
  }

  /* ================= Mermaid ================= */
  let mermaidReady = false;
  function isDark() {
    const t = document.documentElement.dataset.theme;
    if (t) return t === "dark";
    return matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function initMermaid() {
    if (!window.mermaid) return;
    $$(".mermaid").forEach((m) => { m.dataset.src = m.textContent; });
    window.mermaid.initialize({ startOnLoad: false, theme: isDark() ? "dark" : "neutral", fontFamily: "IBM Plex Sans, system-ui, sans-serif", securityLevel: "strict" });
    mermaidReady = true;
  }
  function renderMermaid(root) {
    if (!mermaidReady || !root) return;
    const nodes = $$(".mermaid:not([data-processed])", root);
    if (nodes.length) window.mermaid.run({ nodes }).catch(() => {});
  }
  function rerenderMermaid() {
    if (!mermaidReady) return;
    window.mermaid.initialize({ startOnLoad: false, theme: isDark() ? "dark" : "neutral", fontFamily: "IBM Plex Sans, system-ui, sans-serif", securityLevel: "strict" });
    $$(".mermaid").forEach((m) => { m.removeAttribute("data-processed"); m.innerHTML = esc(m.dataset.src); });
    const vis = chapters.find((c) => !c.el.hidden);
    if (vis) renderMermaid(vis.el);
  }

  /* ================= Thème, export, divers ================= */
  function initTheme() {
    const btns = $$("[data-theme-toggle]");
    let t = null;
    try { t = localStorage.getItem("plsql-theme"); } catch (e) {}
    const apply = () => {
      if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
      btns.forEach((b) => (b.textContent = t === "dark" ? "Thème : sombre" : t === "light" ? "Thème : clair" : "Thème : auto"));
    };
    btns.forEach((b) => b.addEventListener("click", () => {
      t = t === null ? "light" : t === "light" ? "dark" : null;
      try { if (t) localStorage.setItem("plsql-theme", t); else localStorage.removeItem("plsql-theme"); } catch (e) {}
      apply(); rerenderMermaid();
    }));
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (!t) rerenderMermaid(); });
    apply();
  }

  function modal(html, onReady) {
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = '<div class="modal" role="dialog" aria-modal="true">' + html + "</div>";
    document.body.appendChild(back);
    const close = () => back.remove();
    back.addEventListener("click", (e) => { if (e.target === back || e.target.closest("[data-close]")) close(); });
    document.addEventListener("keydown", function k(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", k); } });
    onReady && onReady(back, close);
  }

  function initTools() {
    $$("[data-export]").forEach((b) => b.addEventListener("click", () => {
      const json = JSON.stringify(store.data);
      modal('<h3>Sauvegarder ma progression</h3><p class="hint">Ta progression est enregistrée dans ce navigateur. Pour la transférer sur un autre appareil, copie ce texte puis colle-le dans « Importer » sur l’autre appareil.</p><textarea id="exp-txt" readonly>' + esc(json) +
        '</textarea><div class="row"><button type="button" class="btn" data-close>Fermer</button><button type="button" class="btn primary" id="exp-copy">Copier</button></div>', (m) => {
        $("#exp-copy", m).addEventListener("click", () => {
          const ta = $("#exp-txt", m); ta.select();
          try { navigator.clipboard.writeText(json).then(() => toast("Progression copiée"), () => toast("Texte sélectionné : Ctrl+C")); } catch (e) { toast("Texte sélectionné : Ctrl+C"); }
        });
      });
    }));
    $$("[data-import]").forEach((b) => b.addEventListener("click", () => {
      modal('<h3>Importer une progression</h3><p class="hint">Colle ici le texte copié depuis « Sauvegarder ». Il remplace la progression actuelle.</p><textarea id="imp-txt"></textarea><p class="hint" id="imp-err" hidden></p><div class="row"><button type="button" class="btn" data-close>Annuler</button><button type="button" class="btn primary" id="imp-go">Importer</button></div>', (m, close) => {
        $("#imp-go", m).addEventListener("click", () => {
          try {
            const d = JSON.parse($("#imp-txt", m).value);
            if (typeof d !== "object" || !d.done) throw new Error();
            store.data = Object.assign({ done: {}, ex: {}, quiz: {}, visited: {}, flash: {}, last: null }, d);
            store.save(); refreshAll(); close(); toast("Progression importée");
          } catch (e) { const er = $("#imp-err", m); er.hidden = false; er.textContent = "Ce texte n’est pas une sauvegarde valide. Recopie-le en entier depuis « Sauvegarder »."; }
        });
      });
    }));
    $$("[data-reset]").forEach((b) => b.addEventListener("click", () => {
      modal('<h3>Effacer toute la progression ?</h3><p>Chapitres terminés, exercices, quiz et flashcards seront remis à zéro. Cette action est définitive.</p><div class="row"><button type="button" class="btn" data-close>Annuler</button><button type="button" class="btn danger" id="rst-go">Tout effacer</button></div>', (m, close) => {
        $("#rst-go", m).addEventListener("click", () => {
          store.data = { done: {}, ex: {}, quiz: {}, visited: {}, flash: {}, last: null };
          store.save(); refreshAll(); close(); toast("Progression effacée");
        });
      });
    }));
    $$("[data-menu]").forEach((b) => b.addEventListener("click", () => $(".side").classList.toggle("open")));
    document.addEventListener("click", (e) => {
      const side = $(".side");
      if (side.classList.contains("open") && !e.target.closest(".side") && !e.target.closest("[data-menu]")) side.classList.remove("open");
    });
  }

  let toastTimer;
  function toast(msg) {
    let t = $(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  function refreshAll() {
    $$(".ex[data-ex]").forEach(paintExercise);
    renderProgress();
  }

  /* ================= Démarrage ================= */
  function start() {
    store.load();
    renderCodeBlocks();
    collectChapters();
    buildToc();
    initTheme();
    initMermaid();
    initExercises();
    initQuizzes();
    initSteppers();
    initRace();
    initFlash();
    initTools();
    window.addEventListener("hashchange", route);
    route();
    renderProgress();
    store.initRemote();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
