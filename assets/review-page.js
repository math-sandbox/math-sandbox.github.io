    const app = document.getElementById("app");
    const tabs = document.getElementById("tabs");
    let data, cls;
    function esc(s) {
      return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    }
    function coursesFor(id) {
      return data.filter((c) => c.classes.includes(id));
    }
    function draw() {
      const courses = coursesFor(cls);
      tabs.innerHTML = [...new Set(data.flatMap((c) => c.classes))]
        .map((id) => `<button class="tab ${id === cls ? "active" : ""}" data-id="${esc(id)}">${esc(id)}</button>`)
        .join("");
      app.innerHTML = courses
        .map((c) =>
          c.blocks
            .map(
              (b, bi) =>
                `<div class="panel" id="topic-${c.course}-${bi}"><h2>${topicHeading(bi + 1, b.title)} <small class="badge">${b.section}</small></h2>${b.method}${b.tasks
                  .map((t, ti) => {
                    const id = c.course + "-" + bi + "-" + ti;
                    const extra = msNav.taskNav(id, cls);
                    return "<h3 id=\"t-" + id + "\" title=\"" + id + "\">" + taskLabel(t, ti + 1) + "</h3>" + taskCard(t, id, extra);
                  })
                  .join("")}</div>`
            )
            .join("")
        )
        .join("");
      if (typeof msNav !== "undefined") msNav.setClass(cls);
      if (window.MathJax?.typesetPromise) MathJax.typesetPromise([app]);
      const hash = location.hash.slice(1);
      if (hash && /^[A-Za-z0-9._-]+$/.test(hash)) {
        const el = document.getElementById(hash);
        if (el && el.scrollIntoView) el.scrollIntoView({ block: "start" });
      }
    }
    tabs.onclick = (e) => {
      const id = e.target.dataset.id;
      if (!id || !/^[A-Za-z0-9]+$/.test(id)) return;
      cls = id;
      localStorage.setItem("ms-class", cls);
      history.replaceState(null, "", "?class=" + encodeURIComponent(cls) + location.hash);
      draw();
    };
    bindReveal(app);
    (async () => {
      try {
        const r = await fetch("data/review-t1.json", { cache: "no-store" });
        if (r.ok) data = await r.json();
      } catch (e) {}
      if (!data) data = window.REVIEW_T1_FALLBACK;
      cls = new URLSearchParams(location.search).get("class") || localStorage.getItem("ms-class") || "11AS";
      if (!/^[A-Za-z0-9]+$/.test(cls || "") || !data.some((c) => c.classes.includes(cls))) cls = data[0].classes[0];
      draw();
    })();
  
