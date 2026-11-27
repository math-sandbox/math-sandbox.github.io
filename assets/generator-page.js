    const app = document.getElementById("app");
    const q = new URLSearchParams(location.search);
    const cls = msNav.classId();
    const rawTask = q.get("task") || msNav.firstTask(msNav.courseOf(cls) || "IGCSE");
    const task = /^(IGCSE|AS|A2)-\d+-\d+$/.test(rawTask) ? rawTask : "";
    function esc(s) {
      return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    }
    function randomSeed() {
      return msAnswerAccept.randomSeed();
    }
    function polishTask(t) {
      const p = window.msBank && msBank.polishGenerated;
      if (!p || !t) return t;
      if (t.q) t.q = p(String(t.q));
      if (t.answer) t.answer = p(String(t.answer));
      if (Array.isArray(t.solution)) {
        t.solution = t.solution.map((row) => Object.assign({}, row, {
          answer: row.answer ? p(String(row.answer)) : row.answer,
          guidance: row.guidance ? p(String(row.guidance)) : row.guidance,
        }));
      }
      return t;
    }
    let seed = Number(q.get("seed")) || randomSeed();
    function go(s) {
      seed = s;
      const extra = cls ? "&class=" + encodeURIComponent(cls) : "";
      history.replaceState(null, "", "?task=" + encodeURIComponent(task) + "&seed=" + seed + extra);
      const gen = GENERATORS[task];
      const found = findTask(window.REVIEW_T1_FALLBACK, task);
      const label = found ? taskLabel(found.task, found.k) : "Question";
      if (!task || !gen) { app.innerHTML = "<p>Unknown task</p>"; return; }
      const t = polishTask(gen(mulberry(seed)));
      t.level = t.level || "Variant";
      const links = msNav.taskHrefs(task, cls);
      const more = links
        ? ' · <a href="' + links.review + '">Review this task</a> · <a href="' + links.sheet + '">Worksheet</a>'
        : "";
      app.innerHTML = "<p>Seed <b>" + seed + "</b> · <span title=\"" + esc(task) + "\">" + esc(label) + '</span> · <button class="tab" id="nv">New variant</button>' + more + "</p>" + taskCard(t, "v", "");
      document.getElementById("nv").onclick = () => {
        const prev = polishTask(gen(mulberry(seed))).q;
        let n = randomSeed();
        let i;
        for (i = 0; i < 30; i++) {
          if (polishTask(gen(mulberry(n))).q !== prev) break;
          n = randomSeed();
        }
        go(n);
      };
      bindReveal(app);
      if (window.MathJax?.typesetPromise) MathJax.typesetPromise([app]);
    }
    go(seed);
  
