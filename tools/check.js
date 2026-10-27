// Vérifie le site dans Chromium : erreurs JS, quiz, animations, diagrammes Mermaid, blocs de code.
// Usage : node tools/check.js [chNN ...]   (sans argument : tous les chapitres)
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFileSync } = require("child_process");

(async () => {
  const root = path.resolve(__dirname, "..");
  // Construction dans un dossier temporaire pour ne pas gêner les autres rédacteurs
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "plsql-check-"));
  execFileSync("python3", [path.join(root, "tools/build.py"), tmp]);
  for (const f of ["style.css", "app.js"]) fs.copyFileSync(path.join(root, "assets", f), path.join(tmp, "assets", f));
  fs.mkdirSync(path.join(tmp, "assets/vendor"), { recursive: true });
  fs.copyFileSync(path.join(root, "assets/vendor/mermaid.min.js"), path.join(tmp, "assets/vendor/mermaid.min.js"));

  const wanted = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.text()) && !/ERR_/.test(m.text())) errors.push("console: " + m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto("file://" + path.join(tmp, "index.html"));
  await page.waitForTimeout(500);

  const ids = await page.$$eval(".chapter", (els) => els.map((e) => e.id));
  let problems = 0;
  for (const id of ids) {
    if (wanted.length && !wanted.includes(id)) continue;
    await page.evaluate((h) => (location.hash = h), id);
    await page.waitForTimeout(1200);
    const r = await page.evaluate((id) => {
      const sec = document.getElementById(id);
      const out = { issues: [] };
      sec.querySelectorAll("[data-quiz]").forEach((q) => { if (!q.querySelector(".q")) out.issues.push("quiz vide : " + q.dataset.quiz); });
      sec.querySelectorAll("[data-stepper]").forEach((s) => { if (!s.querySelector(".stepper-grid")) out.issues.push("animation absente : " + s.dataset.stepper); });
      sec.querySelectorAll(".mermaid").forEach((m, i) => {
        if (!m.querySelector("svg")) out.issues.push("mermaid non rendu #" + (i + 1));
        else if (/Syntax error/i.test(m.textContent)) out.issues.push("mermaid erreur de syntaxe #" + (i + 1));
      });
      sec.querySelectorAll('script[type="text/plsql"]').forEach(() => out.issues.push("bloc de code non transformé"));
      const exIds = [...sec.querySelectorAll(".ex[data-ex]")].map((e) => e.dataset.ex);
      const dup = exIds.filter((x, i) => exIds.indexOf(x) !== i);
      if (dup.length) out.issues.push("data-ex en double : " + dup.join(", "));
      out.ex = exIds.length;
      out.code = sec.querySelectorAll(".code").length;
      out.quiz = sec.querySelectorAll(".q").length;
      out.steppers = sec.querySelectorAll(".stepper-grid").length;
      out.mermaid = sec.querySelectorAll(".mermaid svg").length;
      return out;
    }, id);
    // Les animations : faire défiler toutes les étapes
    const nSteppers = await page.$$eval("#" + id + " .stepper", (s) => s.length);
    for (let k = 0; k < nSteppers; k++) {
      const ok = await page.evaluate(([id, k]) => {
        const s = document.querySelectorAll("#" + id + " .stepper")[k];
        const next = s.querySelector('[data-a="next"]');
        let guard = 0;
        while (!next.disabled && guard++ < 200) next.click();
        return guard < 200;
      }, [id, k]);
      if (!ok) r.issues.push("animation " + k + " ne se termine pas");
    }
    const flag = r.issues.length ? "✗" : "✓";
    if (r.issues.length) problems += r.issues.length;
    console.log(`${flag} ${id} : ${r.ex} exercices, ${r.code} blocs de code, ${r.quiz} questions de quiz, ${r.steppers} animations, ${r.mermaid} diagrammes${r.issues.length ? "\n    - " + r.issues.join("\n    - ") : ""}`);
  }
  if (errors.length) { problems += errors.length; console.log("Erreurs JavaScript :\n  " + [...new Set(errors)].join("\n  ")); }
  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(problems ? `\n${problems} problème(s)` : "\nAucun problème détecté");
  process.exit(problems ? 1 : 0);
})();
