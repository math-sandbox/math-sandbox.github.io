    const W = worksheet;
    const coursesEl = document.getElementById("courses");
    const pick = document.getElementById("pick");
    const out = document.getElementById("out");
    const title = document.getElementById("title");
    const klass = document.getElementById("klass");
    const date = document.getElementById("date");
    const seed = document.getElementById("seed");
    const nver = document.getElementById("nver");
    const ans = document.getElementById("ans");
    const mix = document.getElementById("mix");
    const diff = document.getElementById("diff");
    const nq = document.getElementById("nq");
    const tmarks = document.getElementById("tmarks");
    const paper = document.getElementById("paper");
    const upto = document.getElementById("upto");
    let course = "IGCSE";
    let only = "";
    let mode = "classic";
    let bank = { records: [], aliases: {} };
    let templates = [];
    let lastData = null;
    const taskCache = {};

    function randomSeed() {
      return msAnswerAccept.randomSeed();
    }

    function drawCourses() {
      coursesEl.innerHTML = W.COURSES.map(
        (c) => '<button class="tab' + (c.id === course ? " active" : "") + '" data-id="' + c.id + '">' + c.label + "</button>"
      ).join("");
    }

    function courseOfPaper(id) {
      const t = templates.find((p) => p.id === id);
      return t && t.course ? t.course : "";
    }

    function firstPaperFor(c) {
      const t = templates.find((p) => p.course === c);
      return t ? t.id : "";
    }

    function syncCourseFromPaper() {
      const next = courseOfPaper(paper.value);
      if (next) course = next;
      drawCourses();
    }

    function syncPaperFromCourse() {
      const t = templates.find((p) => p.id === paper.value);
      if (!t || t.course !== course) {
        const id = firstPaperFor(course);
        if (id) paper.value = id;
      }
    }

    function setMode(next) {
      mode = next || "classic";
      document.querySelectorAll("#modes .tab").forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
      document.getElementById("topic-opts").hidden = mode !== "topic";
      document.getElementById("mock-opts").hidden = mode !== "mock";
      drawPick();
    }

    function cmpSec(a, b) {
      const ra = { IGCSE: 0, P1: 1, S1: 2, P23: 3, S2: 4 };
      const ma = String(a).match(/^(IGCSE|P1|P23|S1|S2)-(\d+)(?:\.(\d+))?/);
      const mb = String(b).match(/^(IGCSE|P1|P23|S1|S2)-(\d+)(?:\.(\d+))?/);
      if (!ma || !mb) return String(a).localeCompare(String(b));
      return (ra[ma[1]] - ra[mb[1]]) || (Number(ma[2]) - Number(mb[2])) || (Number(ma[3] || 0) - Number(mb[3] || 0));
    }
    function drawTopicPick() {
      const recs = (bank.records || []).filter((r) => r.course === course);
      const ch = new Map();
      recs.forEach((r) => {
        if (!ch.has(r.chapter)) ch.set(r.chapter, { title: r.topic || r.chapter, secs: new Map() });
        r.subsections.forEach((s) => ch.get(r.chapter).secs.set(s, s));
      });
      pick.innerHTML = [...ch.entries()]
        .sort((a, b) => cmpSec(a[0], b[0]))
        .map(([id, g]) => {
          const rows = [...g.secs.keys()]
            .sort(cmpSec)
            .map((s) => '<label class="idrow"><input type="checkbox" data-sec="' + s + '"> ' + s + "</label>")
            .join("");
          return (
            '<h3><label><input type="checkbox" data-ch="' +
            id +
            '"> ' +
            id +
            " · " +
            g.title +
            "</label></h3><div class=\"pick-cols\">" +
            rows +
            "</div>"
          );
        })
        .join("");
    }

    function drawPick() {
      if (mode === "topic") {
        drawTopicPick();
        return;
      }
      if (mode === "mock") {
        pick.innerHTML = "<p class=\"note\">Uses only published (green) topics. Optional limit such as P1-5.</p>";
        return;
      }
      const review = window.REVIEW_T1_FALLBACK;
      const linkCls = msNav.classForCourse(course, msNav.classId());
      pick.innerHTML = W.groups(GENERATORS, course, review)
        .map((g) => {
          const rows = g.ids
            .map((id) => {
              const hrefs = msNav.taskHrefs(id, linkCls);
              return (
                '<div class="idrow"><label title="' +
                id +
                '"><input type="checkbox" data-id="' +
                id +
                '"> ' +
                (g.labels[id] || id) +
                '</label><input type="number" min="1" max="20" value="1" data-count="' +
                id +
                '"> <a href="' +
                hrefs.gen +
                '">New variant</a> · <a href="' +
                hrefs.review +
                '">Review</a></div>'
              );
            })
            .join("");
          return "<h3>" + g.title + (g.section ? ' <small class="badge">' + g.section + "</small>" : "") + "</h3>" + rows;
        })
        .join("");
    }

    function readState() {
      const items = [...pick.querySelectorAll("input[type=checkbox][data-id]:checked")].map((box) => {
        const countEl = pick.querySelector('[data-count="' + box.dataset.id + '"]');
        return { id: box.dataset.id, count: Math.min(20, Math.max(1, Number(countEl && countEl.value) || 1)) };
      });
      const sections = [...pick.querySelectorAll("input[data-sec]:checked")].map((b) => b.dataset.sec);
      const chapters = [...pick.querySelectorAll("input[data-ch]:checked")].map((b) => b.dataset.ch);
      return {
        course,
        seed: (Number(seed.value) >>> 0) || 1,
        versions: Math.max(1, Math.min(12, Number(nver.value) || 1)),
        items,
        title: title.value.trim(),
        className: klass.value.trim(),
        date: date.value,
        answers: ans.checked,
        only: Math.max(1, Number(nver.value) || 1) > 1 ? "" : only,
        mode,
        sections,
        chapters,
        mix: mix.value,
        difficulty: diff.value,
        count: Number(nq.value) || 0,
        targetMarks: Number(tmarks.value) || 0,
        paper: paper.value,
        upto: upto.value.trim(),
      };
    }

    function applyState(state) {
      course = state.course;
      title.value = state.title || title.value;
      klass.value = state.className || "";
      date.value = state.date || date.value;
      seed.value = String(state.seed);
      nver.value = String(state.versions);
      ans.checked = !!state.answers;
      only = state.only || "";
      mode = state.mode || "classic";
      mix.value = state.mix || "mixed";
      diff.value = state.difficulty || "any";
      if (state.count) nq.value = String(state.count);
      tmarks.value = String(state.targetMarks || 0);
      upto.value = state.upto || "";
      if (state.paper) paper.value = state.paper;
      else if (mode === "mock") syncPaperFromCourse();
      if (mode === "mock" && state.paper) syncCourseFromPaper();
      if (mode === "topic" && Number(nver.value) < 3 && !state.versions) nver.value = "3";
      drawCourses();
      setMode(mode);
      drawPick();
      for (const item of state.items) {
        const box = pick.querySelector('input[type=checkbox][data-id="' + item.id + '"]');
        const countEl = pick.querySelector('[data-count="' + item.id + '"]');
        if (box) box.checked = true;
        if (countEl) countEl.value = String(item.count);
      }
      for (const s of state.sections || []) {
        const box = pick.querySelector('input[data-sec="' + s + '"]');
        if (box) box.checked = true;
      }
      for (const c of state.chapters || []) {
        const box = pick.querySelector('input[data-ch="' + c + '"]');
        if (box) box.checked = true;
      }
    }

    function typesetOut(html) {
      if (window.MathJax && MathJax.typesetClear) MathJax.typesetClear([out]);
      out.innerHTML = html;
      if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([out]);
    }

    async function bankCtx(state) {
      const paths = [...new Set((bank.records || []).map((r) => r.source && r.source.path).filter((p) => p && p.indexOf("data/tasks") === 0))];
      const taskById = {};
      await Promise.all(
        paths.map(async (p) => {
          if (!taskCache[p]) {
            const res = await fetch(p);
            taskCache[p] = await res.json();
          }
          (taskCache[p] || []).forEach((t) => {
            taskById[t.id] = t;
          });
        })
      );
      const htmlByPath = {};
      const htmlPaths = [...new Set((bank.records || []).filter((r) => r.source && r.source.kind === "theory").map((r) => r.source.path))];
      await Promise.all(
        htmlPaths.map(async (p) => {
          try {
            htmlByPath[p] = await fetch(p).then((r) => r.text());
          } catch (e) {}
        })
      );
      return {
        records: bank.records,
        templates,
        gens: GENERATORS,
        mulberry,
        practice: window.msPractice,
        taskById,
        usedTexts: new Set(),
        htmlByPath,
      };
    }

    async function build() {
      const state = readState();
      history.replaceState(null, "", "?" + W.toQuery(state));
      if (state.mode === "classic" && !state.items.length) {
        out.innerHTML = '<p class="note">Tick at least one task.</p>';
        return;
      }
      if (state.mode !== "classic") state.bankCtx = await bankCtx(state);
      const data = W.buildSheet(state, GENERATORS, mulberry);
      lastData = data;
      typesetOut(W.render(data));
    }

    coursesEl.onclick = (e) => {
      const id = e.target.dataset.id;
      if (!id) return;
      course = id;
      if (mode === "mock") syncPaperFromCourse();
      drawCourses();
      drawPick();
      history.replaceState(null, "", "?" + W.toQuery(readState()));
    };
    paper.onchange = () => {
      if (mode === "mock") syncCourseFromPaper();
      history.replaceState(null, "", "?" + W.toQuery(readState()));
    };
    document.getElementById("build").onclick = build;
    document.getElementById("new-set").onclick = () => {
      seed.value = String(randomSeed());
      build();
    };
    document.getElementById("print").onclick = () => window.print();
    ans.onchange = () => {
      if (!lastData) {
        build();
        return;
      }
      lastData.answers = ans.checked;
      const state = readState();
      history.replaceState(null, "", "?" + W.toQuery(state));
      typesetOut(W.render(lastData));
    };
    document.getElementById("modes").onclick = (e) => {
      const m = e.target.dataset.mode;
      if (!m) return;
      if (m === "topic" && Number(nver.value) < 3) nver.value = "3";
      setMode(m);
    };
    pick.addEventListener("change", (e) => {
      if (e.target.dataset.ch) {
        const on = e.target.checked;
        pick.querySelectorAll('input[data-sec^="' + e.target.dataset.ch + '"]').forEach((b) => {
          b.checked = on;
        });
      }
    });

    const loaded = W.parseQuery(location.search);
    if (!location.search.includes("seed=")) loaded.seed = randomSeed();
    if (!loaded.date) loaded.date = W.localDate();
    if (!loaded.className) loaded.className = msNav.classId();
    if (!location.search.includes("c=") && msNav.courseOf(loaded.className)) loaded.course = msNav.courseOf(loaded.className);
    Promise.all([
      fetch("data/bank.json").then((r) => r.json()).catch(() => ({ records: [] })),
      fetch("data/paper-templates.json").then((r) => r.json()).catch(() => ({ templates: [] })),
    ]).then(([b, t]) => {
      bank = b;
      templates = t.templates || [];
      paper.innerHTML = templates.map((p) => '<option value="' + p.id + '">' + p.code + " · " + p.title + "</option>").join("");
      applyState(loaded);
      history.replaceState(null, "", "?" + W.toQuery(readState()));
      if (loaded.items.length || loaded.mode === "topic" || loaded.mode === "mock") build();
    });
  
