    const app = document.getElementById("app");
    const q = new URLSearchParams(location.search);
    const cls = msNav.classId();
    const rawTask = q.get("task") || msNav.firstTask(msNav.courseOf(cls) || "IGCSE");
    const task = /^(IGCSE|AS|A2)-\d+-\d+$/.test(rawTask) ? rawTask : "";
    function esc(s) {
      return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    }
    let seed = Number(q.get("seed") || 1) || 1;
    function go(s) {
      seed = s;
      const extra = cls ? "&class=" + encodeURIComponent(cls) : "";
      history.replaceState(null, "", "?task=" + encodeURIComponent(task) + "&seed=" + seed + extra);
      const gen = GENERATORS[task];
      const found = findTask(window.REVIEW_T1_FALLBACK, task);
      const label = found ? taskLabel(found.task, found.k) : "Question";
      if (!task || !gen) { app.innerHTML = "<p>Unknown task</p>"; return; }
      const t = gen(mulberry(seed));
      t.level = t.level || "Variant";
      const links = msNav.taskHrefs(task, cls);
      const more = links
        ? ' · <a href="' + links.review + '">Review this task</a> · <a href="' + links.sheet + '">Worksheet</a>'
        : "";
      app.innerHTML = "<p>Seed <b>" + seed + "</b> · <span title=\"" + esc(task) + "\">" + esc(label) + '</span> · <button class="tab" id="nv">New variant</button>' + more + "</p>" + taskCard(t, "v", "");
      document.getElementById("nv").onclick = () => go(seed + 1);
      bindReveal(app);
      if (window.MathJax?.typesetPromise) MathJax.typesetPromise([app]);
    }
    go(seed);
  
