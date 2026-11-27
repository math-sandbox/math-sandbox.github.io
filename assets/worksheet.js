(function (g) {
  const COURSES = [
    { id: "IGCSE", label: "IGCSE 0580" },
    { id: "AS", label: "9709 AS" },
    { id: "A2", label: "9709 A2" },
  ];

  function parseId(id) {
    const m = String(id).match(/^(IGCSE|AS|A2)-(\d+)-(\d+)$/);
    return m ? { course: m[1], chapter: Number(m[2]), task: Number(m[3]) } : null;
  }

  function idsFor(gens, course) {
    return Object.keys(gens)
      .filter((id) => (parseId(id) || {}).course === course)
      .sort((a, b) => {
        const x = parseId(a), y = parseId(b);
        return x.chapter - y.chapter || x.task - y.task;
      });
  }

  function taskMeta(review, id) {
    const p = parseId(id);
    if (!p) return null;
    const sheet = Array.isArray(review) ? review.find((s) => s.course === p.course) : null;
    const block = sheet && sheet.blocks && sheet.blocks[p.chapter];
    const task = block && block.tasks && block.tasks[p.task];
    return task ? { block, task, n: p.chapter + 1, k: p.task + 1 } : null;
  }

  function taskLabel(task, k) {
    return "Q" + k + " · " + String((task && task.title) || "").trim() + " [" + (task && task.marks) + "]";
  }

  function groups(gens, course, review) {
    const sheet = Array.isArray(review) ? review.find((s) => s.course === course) : null;
    const blocks = (sheet && sheet.blocks) || [];
    const map = new Map();
    for (const id of idsFor(gens, course)) {
      const p = parseId(id);
      if (!map.has(p.chapter)) {
        const b = blocks[p.chapter];
        map.set(p.chapter, {
          key: p.chapter,
          title: p.chapter + 1 + ". " + ((b && b.title) || ("Chapter " + (p.chapter + 1))),
          section: (b && b.section) || "",
          ids: [],
          labels: {},
        });
      }
      const g = map.get(p.chapter);
      const meta = taskMeta(review, id);
      g.ids.push(id);
      g.labels[id] = meta ? taskLabel(meta.task, meta.k) : id;
    }
    return [...map.values()];
  }

  function rowMarkSum(rows) {
    return (rows || []).reduce((sum, row) => {
      const tokens = String(row.marks || "").match(/[MAB]\d+/g) || [];
      return sum + tokens.reduce((n, t) => n + Number(t.slice(1)), 0);
    }, 0);
  }

  function itemSeed(base, version, index) {
    return ((base >>> 0) + version * 100003 + index * 97) >>> 0 || 1;
  }

  function localDate(now) {
    now = now || new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function versionIndex(letter) {
    const i = String(letter || "").toUpperCase().charCodeAt(0) - 65;
    return i >= 0 && i < 12 ? i : null;
  }

  function safeToken(s) {
    return /^[A-Za-z0-9]+(?:[.-][A-Za-z0-9]+)*$/.test(s) ? s : "";
  }

  function parseQuery(qs) {
    const p = new URLSearchParams(String(qs || "").replace(/^\?/, ""));
    const rawCourse = p.get("c") || "IGCSE";
    const course = COURSES.some((c) => c.id === rawCourse) ? rawCourse : "IGCSE";
    const versions = Math.max(1, Math.min(12, Number(p.get("n")) || 1));
    const seed = (Number(p.get("seed")) >>> 0) || 1;
    const only = versionIndex(p.get("v")) == null ? "" : String(p.get("v")).toUpperCase();
    const mode = ["topic", "mock"].includes(p.get("mode")) ? p.get("mode") : "classic";
    const items = String(p.get("sel") || "")
      .split(",")
      .filter(Boolean)
      .map((part) => {
        const [raw, c] = part.split("*");
        const id = /^(IGCSE|AS|A2)-/.test(raw) ? raw : course + "-" + raw;
        return { id, count: Math.min(20, Math.max(1, Number(c) || 1)) };
      })
      .filter((item) => /^(IGCSE|AS|A2)-\d+-\d+$/.test(item.id));
    const mix = ["mixed", "pp", "gen"].includes(p.get("mix")) ? p.get("mix") : "mixed";
    const difficulty = ["any", "easy", "medium", "hard"].includes(p.get("diff")) ? p.get("diff") : "any";
    const date = /^\d{4}-\d{2}-\d{2}$/.test(p.get("date") || "") ? p.get("date") : "";
    return {
      course,
      seed,
      versions,
      items,
      title: String(p.get("title") || "").slice(0, 200),
      className: String(p.get("class") || "").slice(0, 80),
      date,
      answers: p.get("ans") === "1",
      only,
      mode,
      sections: String(p.get("secs") || "").split(",").map(safeToken).filter(Boolean),
      chapters: String(p.get("ch") || "").split(",").map(safeToken).filter(Boolean),
      mix,
      difficulty,
      count: Math.max(0, Number(p.get("nq")) || 0),
      targetMarks: Math.max(0, Number(p.get("marks")) || 0),
      paper: safeToken(p.get("paper") || ""),
      upto: safeToken(p.get("upto") || ""),
    };
  }

  function toQuery(state) {
    const p = new URLSearchParams();
    p.set("c", state.course);
    p.set("seed", String(state.seed));
    if (state.versions > 1) p.set("n", String(state.versions));
    p.set(
      "sel",
      (state.items || [])
        .map((item) => item.id.replace(state.course + "-", "") + (item.count > 1 ? "*" + item.count : ""))
        .join(",")
    );
    if (state.title) p.set("title", state.title);
    if (state.className) p.set("class", state.className);
    if (state.date) p.set("date", state.date);
    if (state.answers) p.set("ans", "1");
    if (state.only) p.set("v", state.only);
    if (state.mode && state.mode !== "classic") p.set("mode", state.mode);
    if (state.sections && state.sections.length) p.set("secs", state.sections.join(","));
    if (state.chapters && state.chapters.length) p.set("ch", state.chapters.join(","));
    if (state.mix && state.mix !== "mixed") p.set("mix", state.mix);
    if (state.difficulty && state.difficulty !== "any") p.set("diff", state.difficulty);
    if (state.count) p.set("nq", String(state.count));
    if (state.targetMarks) p.set("marks", String(state.targetMarks));
    if (state.paper) p.set("paper", state.paper);
    if (state.upto) p.set("upto", state.upto);
    return p.toString();
  }

  function publicOut(out) {
    const pub = {};
    Object.keys(out).forEach((k) => {
      if (k.charAt(0) !== "_") pub[k] = out[k];
    });
    return pub;
  }

  function pickVariant(gen, mulberry, start, used, posUsed) {
    let seed = start;
    let out;
    for (let t = 0; t < 256; t++) {
      out = publicOut(gen(mulberry(seed)));
      if (!used.has(out.q) && !posUsed.has(out.q)) return { out, seed };
      seed = (seed + 1) >>> 0 || 1;
    }
    seed = (start + 10007) >>> 0 || 1;
    for (let t = 0; t < 256; t++) {
      out = publicOut(gen(mulberry(seed)));
      if (!used.has(out.q) && !posUsed.has(out.q)) return { out, seed };
      seed = (seed + 1) >>> 0 || 1;
    }
    return { out, seed };
  }

  function labelFor(rec) {
    const n = rec.subsections && rec.subsections[0] ? rec.subsections[0] : rec.id;
    return "Q · " + (rec.topic || n) + " [" + rec.marks + "]";
  }

  function asGroup(slot) {
    if (slot && Array.isArray(slot.items)) return slot;
    if (slot && slot.id) return { items: [slot] };
    return { items: [] };
  }

  function questionsFromPicks(picks, state, ctx, v) {
    const used = ctx.usedTexts || new Set();
    ctx.usedTexts = used;
    const usedIds = ctx.usedIds || new Set();
    ctx.usedIds = usedIds;
    const B = bankApi();
    const questions = [];
    const letters = "abcdefghijklmnopqrstuvwxyz";
    function normQ(s) {
      return String(s || "")
        .replace(/<[^>]+>/g, " ")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }
    function srcLine(code) {
      if (!code) return "";
      return '<p class="wq-src">' + String(code).replace(/</g, "") + "</p>";
    }
    picks.forEach((slot, index) => {
      const recs = asGroup(slot).items;
      if (!recs.length) return;
      const parts = [];
      recs.forEach((rec, j) => {
        if (usedIds.has(rec.id)) return;
        const start = itemSeed(state.seed, v, index * 10 + j);
        const got = B.materialize(rec, start, ctx);
        if (!got || !got.out || !got.out.q) return;
        const plain = String(got.out.q).replace(/<[^>]+>/g, " ");
        if (/using the same\b|as marked on (the )?(graph|diagram|table)|shown above|given above|the same conversion graph/i.test(plain)) return;
        usedIds.add(rec.id);
        parts.push({ rec, got });
      });
      if (!parts.length) return;
      const structuredBits = [];
      const flat = [];
      parts.forEach((p) => {
        const text = String(p.got.out.q || "");
        if (p.rec.structured || /\(a\)[\s\S]{0,500}\(b\)/i.test(text.replace(/<[^>]+>/g, " "))) {
          structuredBits.push(p);
        } else flat.push(p);
      });
      structuredBits.forEach((p) => {
        questions.push({
          n: questions.length + 1,
          id: p.rec.id,
          label: labelFor(p.rec),
          family: p.rec.family || "",
          section: (p.rec.subsections && p.rec.subsections[0]) || "",
          seed: p.got.seed,
          q: p.got.out.q + srcLine(p.got.out.sourceCode),
          answer: p.got.out.answer,
          solution: (p.got.out.solution || []).concat(
            p.got.out.sourceCode ? [{ part: "", answer: "", marks: "", guidance: p.got.out.sourceCode }] : []
          ),
          marks: Number(p.got.out.marks || p.rec.marks) || 0,
          type: p.rec.type,
          sourceCode: p.got.out.sourceCode || "",
        });
      });
      if (!flat.length) return;
      const sec0 = (flat[0].rec.subsections && flat[0].rec.subsections[0]) || "";
      if (flat.some((p) => ((p.rec.subsections && p.rec.subsections[0]) || "") !== sec0)) {
        flat.forEach((p) => {
          questions.push({
            n: questions.length + 1,
            id: p.rec.id,
            label: labelFor(p.rec),
            family: p.rec.family || "",
            section: (p.rec.subsections && p.rec.subsections[0]) || "",
            seed: p.got.seed,
            q: p.got.out.q + srcLine(p.got.out.sourceCode),
            answer: p.got.out.answer,
            solution: (p.got.out.solution || []).concat(
              p.got.out.sourceCode ? [{ part: "", answer: "", marks: "", guidance: p.got.out.sourceCode }] : []
            ),
            marks: Number(p.got.out.marks || p.rec.marks) || 0,
            type: p.rec.type,
            sourceCode: p.got.out.sourceCode || "",
          });
        });
        return;
      }
      if (flat.length === 1) {
        const rec = flat[0].rec;
        const got = flat[0].got;
        questions.push({
          n: questions.length + 1,
          id: rec.id,
          label: labelFor(rec),
          family: rec.family || "",
          section: (rec.subsections && rec.subsections[0]) || "",
          seed: got.seed,
          q: got.out.q + srcLine(got.out.sourceCode),
          answer: got.out.answer,
          solution: (got.out.solution || []).concat(
            got.out.sourceCode ? [{ part: "", answer: "", marks: "", guidance: got.out.sourceCode }] : []
          ),
          marks: Number(got.out.marks || rec.marks) || 0,
          type: rec.type,
          sourceCode: got.out.sourceCode || "",
        });
        return;
      }
      const q =
        flat
          .map((p, j) => {
            const letter = letters.charAt(j);
            const mk = Number(p.got.out.marks || p.rec.marks) || 0;
            return (
              '<p class="wq-part"><span class="wq-partlab">(' +
              letter +
              ")</span><span class=\"wq-partbody\">" +
              p.got.out.q +
              '</span><span class="wq-partmk">[' +
              mk +
              "]</span></p>"
            );
          })
          .join("") + srcLine(flat.map((p) => p.got.out.sourceCode).filter(Boolean)[0] || "");
      const solution = [];
      flat.forEach((p, j) => {
        const letter = letters.charAt(j);
        const src = p.got.out.sourceCode || "";
        (p.got.out.solution || []).forEach((row) => {
          solution.push(Object.assign({}, row, { part: "(" + letter + ")", guidance: (row.guidance || "") + (src ? " " + src : "") }));
        });
        if (!(p.got.out.solution || []).length) {
          solution.push({ part: "(" + letter + ")", answer: p.got.out.answer || "", marks: "", guidance: src });
        }
      });
      const marks = flat.reduce((n, p) => n + Number(p.got.out.marks || p.rec.marks || 0), 0);
      questions.push({
        n: questions.length + 1,
        id: flat.map((p) => p.rec.id).join("+"),
        label: labelFor(flat[0].rec),
        family: flat.map((p) => p.rec.family || p.rec.id).join("|"),
        section: sec0,
        seed: flat[0].got.seed,
        q,
        answer: flat.map((p, j) => "(" + letters.charAt(j) + ") " + (p.got.out.answer || "")).join(" "),
        solution,
        marks,
        type: flat.every((p) => p.rec.type === "pp") ? "pp" : "mixed",
        sourceCode: flat.map((p) => p.got.out.sourceCode).filter(Boolean)[0] || "",
      });
    });
    return questions;
  }

  function bankApi() {
    if (g.msBank) return g.msBank;
    if (typeof require === "function") return require("./bank.js");
    return null;
  }

  function buildTopicSheet(state, ctx) {
    const B = bankApi();
    const pool = B.filterPool(ctx.records || [], {
      course: state.course,
      chapters: state.chapters,
      sections: state.sections,
      mix: state.mix,
      difficulty: state.difficulty,
    });
    const nver = Math.max(state.versions || 1, 1);
    const versions = [];
    for (let v = 0; v < nver; v++) {
      const rng = B.mulberry(itemSeed(state.seed, v, 0));
      const picks = B.pickWithoutRepeat(pool, rng, state.count || 0, state.targetMarks || 0);
      ctx.usedTexts = new Set();
      ctx.usedIds = new Set();
      ctx.strictUnique = true;
      const questions = questionsFromPicks(picks, state, ctx, v);
      versions.push({
        letter: String.fromCharCode(65 + v),
        total: questions.reduce((s, q) => s + Number(q.marks), 0),
        questions,
      });
    }
    const only = versionIndex(state.only);
    return wrapSheet(state, only == null ? versions : versions.slice(only, only + 1), "topic");
  }

  function buildMockSheet(state, ctx) {
    const B = bankApi();
    const template = (ctx.templates || []).find((t) => t.id === state.paper) || (ctx.templates || [])[0];
    const nver = Math.max(state.versions || 1, 1);
    const versions = [];
    for (let v = 0; v < nver; v++) {
      const picks = B.pickMock(ctx.records || [], template, { seed: itemSeed(state.seed, v, 0), upto: state.upto });
      ctx.usedTexts = new Set();
      ctx.usedIds = new Set();
      ctx.strictUnique = false;
      const questions = questionsFromPicks(picks, state, ctx, v);
      const want = Number(template.marks) || 0;
      let total0 = questions.reduce((s, q) => s + Number(q.marks), 0);
      const qMax = template.qMax || 14;
      if (total0 !== want) {
        const B2 = bankApi();
        const extraPool = (ctx.records || []).filter((r) => {
          if (r.course !== template.course || ctx.usedIds.has(r.id)) return false;
          if (template.id !== "0580-P2" && r.marks < 2) return false;
          if (r.structured) return false;
          if (r.type === "pp" && template.id !== "0580-P2") return false;
          if (template.papers && template.papers.length) {
            return (r.subsections || []).some((s) => template.papers.some((p) => s.indexOf(p + "-") === 0));
          }
          return true;
        });
        function usedGenFam() {
          const s = new Set();
          questions.forEach((q) =>
            String(q.family || "")
              .split("|")
              .filter((f) => f.indexOf("gen:") === 0)
              .forEach((f) => s.add(f))
          );
          return s;
        }
        function extraOk(r) {
          const f = r.family || "";
          if ((r.type === "generator" || String(f).indexOf("gen:") === 0) && usedGenFam().has(f)) return false;
          return true;
        }
        let guard = 0;
        while (total0 < want && guard++ < 40) {
          const need = want - total0;
          const shorts = questions.filter((q) => q.marks <= 3).length;
          const minM = template.id === "0580-P4" ? (need >= 4 || shorts >= 4 ? 4 : 2) : 2;
          const capN = template.qMax || (template.id === "0580-P4" ? 22 : template.id === "0580-P2" ? 24 : 16);
          if (questions.length >= capN && need > 0 && extraPool.every((r) => r.marks !== need)) break;
          const rec = extraPool.find(
            (r) =>
              extraOk(r) &&
              !ctx.usedIds.has(r.id) &&
              r.marks <= need &&
              r.marks >= minM &&
              !r.structured &&
              (questions.length < capN || r.marks === need)
          );
          if (!rec) break;
          const got = B2.materialize(rec, itemSeed(state.seed, v, 800 + guard), ctx);
          if (!got || !got.out || !got.out.q) {
            ctx.usedIds.add(rec.id);
            continue;
          }
          ctx.usedIds.add(rec.id);
          const addMk = Number(got.out.marks || rec.marks) || 0;
          questions.push({
            n: questions.length + 1,
            id: rec.id,
            label: labelFor(rec),
            family: rec.family || "",
            section: (rec.subsections && rec.subsections[0]) || "",
            seed: got.seed,
            q: got.out.q + (got.out.sourceCode ? '<p class="wq-src">' + got.out.sourceCode + "</p>" : ""),
            answer: got.out.answer,
            solution: got.out.solution || [],
            marks: addMk,
            type: rec.type,
          });
          total0 += addMk;
        }
        let adj = 0;
        while (total0 !== want && adj++ < 30) {
          const need = want - total0;
          if (need === 1) {
            const q3 = questions.filter((q) => q.marks === 3).pop();
            if (q3 && questions.length > (template.qMin || 6)) {
              questions.splice(questions.indexOf(q3), 1);
              total0 -= 3;
              continue;
            }
          }
          if (need > 0) {
            const capN = template.qMax || (template.id === "0580-P4" ? 22 : 24);
            const rec =
              extraPool.find(
                (r) =>
                  extraOk(r) &&
                  !ctx.usedIds.has(r.id) &&
                  r.marks === need &&
                  r.marks >= 2 &&
                  !r.structured &&
                  (questions.length < capN || r.marks === need)
              ) ||
              extraPool.find(
                (r) =>
                  extraOk(r) &&
                  !ctx.usedIds.has(r.id) &&
                  r.marks <= need &&
                  r.marks >= 2 &&
                  !r.structured &&
                  questions.length < capN
              );
            if (!rec) break;
            const got = B2.materialize(rec, itemSeed(state.seed, v, 900 + adj), ctx);
            if (!got || !got.out || !got.out.q) {
              ctx.usedIds.add(rec.id);
              continue;
            }
            ctx.usedIds.add(rec.id);
            const addMk = Number(got.out.marks || rec.marks) || 0;
            questions.push({
              n: questions.length + 1,
              id: rec.id,
              label: labelFor(rec),
              family: rec.family || "",
              section: (rec.subsections && rec.subsections[0]) || "",
              seed: got.seed,
              q: got.out.q + (got.out.sourceCode ? '<p class="wq-src">' + got.out.sourceCode + "</p>" : ""),
              answer: got.out.answer,
              solution: got.out.solution || [],
              marks: addMk,
              type: rec.type,
            });
            total0 += addMk;
          } else if (need === -1) {
            const q4 = questions.filter((q) => q.marks === 4).pop();
            if (q4 && questions.length > (template.qMin || 6)) {
              questions.splice(questions.indexOf(q4), 1);
              total0 -= 4;
              continue;
            }
            break;
          } else {
            const hit = questions.filter((q) => q.marks === -need).pop();
            if (hit && questions.length > (template.qMin || 6)) {
              questions.splice(questions.indexOf(hit), 1);
              total0 -= hit.marks;
              continue;
            }
            break;
          }
        }
        questions.forEach((q, i) => {
          q.n = i + 1;
        });
      }
      if (template.id === "0580-P4") {
        let mg = 0;
        while (questions.filter((q) => q.marks <= 3).length > 4 && mg++ < 10) {
          const shorts = questions.filter((q) => q.marks <= 3 && String(q.q).indexOf("wq-part") < 0);
            if (shorts.length < 2) break;
            const a = shorts[0];
            const b = shorts.find((q) => q !== a && q.section && q.section === a.section);
            if (!b) break;
          const ia = questions.indexOf(a);
          const ib = questions.indexOf(b);
          const qhtml =
            '<p class="wq-part"><span class="wq-partlab">(a)</span><span class="wq-partbody">' +
            a.q +
            '</span><span class="wq-partmk">[' +
            a.marks +
            ']</span></p><p class="wq-part"><span class="wq-partlab">(b)</span><span class="wq-partbody">' +
            b.q +
            '</span><span class="wq-partmk">[' +
            b.marks +
            "]</span></p>";
            questions[ia] = {
              n: a.n,
              id: a.id + "+" + b.id,
              label: a.label,
              family: [a.family, b.family].filter(Boolean).join("|"),
              section: a.section,
              seed: a.seed,
            q: qhtml,
            answer: "(a) " + (a.answer || "") + " (b) " + (b.answer || ""),
            solution: (a.solution || []).concat(b.solution || []),
            marks: a.marks + b.marks,
            type: a.type === b.type ? a.type : "mixed",
          };
          questions.splice(ib, 1);
        }
        questions.forEach((q, i) => {
          q.n = i + 1;
        });
      }
      const tokens = questions.reduce(
        (bag, q) => {
          const t = B.markTokens(q.solution);
          bag.M += t.M;
          bag.A += t.A;
          bag.B += t.B;
          return bag;
        },
        { M: 0, A: 0, B: 0 }
      );
      const total = questions.reduce((s, q) => s + Number(q.marks), 0);
      versions.push({
        letter: String.fromCharCode(65 + v),
        total,
        questions,
        tokens,
        scale: B.schoolScale(total, template.marks),
        template,
      });
    }
    const only = versionIndex(state.only);
    return wrapSheet(state, only == null ? versions : versions.slice(only, only + 1), "mock");
  }

  function wrapSheet(state, versions, kind) {
    return {
      title: state.title || "",
      className: state.className || "",
      date: state.date || "",
      course: state.course,
      seed: state.seed,
      answers: !!state.answers,
      only: versionIndex(state.only) == null ? "" : String(state.only).toUpperCase(),
      versions,
      kind: kind || "classic",
      paper: state.paper || "",
      upto: state.upto || "",
    };
  }

  function buildSheet(state, gens, mulberry, review) {
    if (state && state.mode === "topic" && state.bankCtx) return buildTopicSheet(state, state.bankCtx);
    if (state && state.mode === "mock" && state.bankCtx) return buildMockSheet(state, state.bankCtx);
    review = review || state.review || (typeof REVIEW_T1_FALLBACK !== "undefined" ? REVIEW_T1_FALLBACK : null);
    const items = (state.items || []).filter((item) => gens[item.id]);
    const only = versionIndex(state.only);
    const n = Math.max(state.versions || 1, only == null ? 1 : only + 1);
    const versions = [];
    const atPos = [];
    for (let v = 0; v < n; v++) {
      const questions = [];
      const used = new Set();
      let index = 0;
      for (const item of items) {
        for (let k = 0; k < item.count; k++) {
          if (!atPos[index]) atPos[index] = new Set();
          const picked = pickVariant(gens[item.id], mulberry, itemSeed(state.seed, v, index), used, atPos[index]);
          const B = bankApi();
          if (B && B.polishGenerated) {
            picked.out.q = B.polishGenerated(picked.out.q);
            if (picked.out.answer) picked.out.answer = B.polishGenerated(picked.out.answer);
            if (Array.isArray(picked.out.solution)) {
              picked.out.solution.forEach((row) => {
                if (row && row.answer) row.answer = B.polishGenerated(row.answer);
                if (row && row.guidance) row.guidance = B.polishGenerated(row.guidance);
              });
            }
          }
          used.add(picked.out.q);
          atPos[index].add(picked.out.q);
          const meta = taskMeta(review, item.id);
          questions.push({
            n: index + 1,
            id: item.id,
            label: meta ? taskLabel(meta.task, meta.k) : item.id,
            seed: picked.seed,
            q: picked.out.q,
            answer: picked.out.answer,
            solution: picked.out.solution,
            marks: picked.out.marks,
          });
          index += 1;
        }
      }
      const total = questions.reduce((s, q) => s + Number(q.marks), 0);
      versions.push({
        letter: String.fromCharCode(65 + v),
        total,
        questions,
      });
    }
    return {
      title: state.title || "",
      className: state.className || "",
      date: state.date || "",
      course: state.course,
      seed: state.seed,
      answers: !!state.answers,
      only: only == null ? "" : String.fromCharCode(65 + only),
      versions: only == null ? versions : versions.slice(only, only + 1),
    };
  }

  function esc(s) {
    return String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  function schemeTable(rows) {
    const body = (rows || [])
      .map(
        (row) =>
          "<tr><td>" +
          (row.part || "") +
          "</td><td>" +
          (row.answer || "") +
          "</td><td>" +
          (row.marks || "") +
          "</td><td>" +
          (row.guidance || "") +
          "</td></tr>"
      )
      .join("");
    return (
      '<table class="ms"><thead><tr><th>Part</th><th>Answer</th><th>Marks</th><th>Guidance</th></tr></thead><tbody>' +
      body +
      "</tbody></table>"
    );
  }

  function coverPage(data, v) {
    const t = v.template;
    if (!t) return "";
    return (
      '<section class="cover version"><div class="sheet-head cambridge-cover">' +
      "<p class=\"exam-board\">Cambridge Assessment International Education</p>" +
      "<h2>" +
      esc(t.syllabus || "") +
      "</h2>" +
      "<p><strong>" +
      esc(t.code) +
      "</strong> · " +
      esc(t.title) +
      "</p>" +
      "<p>Time: " +
      esc(t.duration) +
      " · Total marks: " +
      t.marks +
      (t.calculator === false ? " · Calculators are not allowed" : " · A scientific calculator is required") +
      "</p>" +
      '<table class="ms cover-meta"><tbody>' +
      "<tr><th>Candidate name</th><td></td></tr>" +
      "<tr><th>Centre number</th><td></td></tr>" +
      "<tr><th>Candidate number</th><td></td></tr>" +
      "<tr><th>Class</th><td>" +
      esc(data.className || "") +
      "</td></tr>" +
      "</tbody></table>" +
      "<p>Answer all questions. You must show all necessary working clearly. The number of marks is given in brackets [ ] at the end of each question or part question.</p>" +
      (data.upto ? "<p>Content limited to published topics up to " + esc(data.upto) + ".</p>" : "") +
      (manyLetter(data, v) ? "<p>Version " + v.letter + " · Seed " + data.seed + "</p>" : "<p>Seed " + data.seed + "</p>") +
      "</div></section>"
    );
  }

  function manyLetter(data, v) {
    return data.versions.length > 1 || !!data.only;
  }

  function scoreSheet(v) {
    const tok = v.tokens || { M: 0, A: 0, B: 0 };
    const scale = v.scale || { pct: 0, band: "U", school10: 0 };
    return (
      '<section class="scorecard"><h2>Score sheet</h2>' +
      '<table class="ms"><thead><tr><th>M</th><th>A</th><th>B</th><th>Raw</th><th>Paper</th><th>%</th><th>School</th></tr></thead><tbody><tr>' +
      "<td>" +
      tok.M +
      "</td><td>" +
      tok.A +
      "</td><td>" +
      tok.B +
      "</td><td>" +
      v.total +
      "</td><td>" +
      ((v.template && v.template.marks) || v.total) +
      "</td><td>" +
      scale.pct +
      "</td><td>" +
      esc(scale.band) +
      " (" +
      scale.school10 +
      "/10)</td></tr></tbody></table>" +
      "<p>M = method, A = accuracy, B = independent. School scale reuses the stored raw / total as a percentage, then a 10-point mark.</p></section>"
    );
  }

  function render(data) {
    const many = data.versions.length > 1 || !!data.only;
    const sheets = data.versions
      .map((v) => {
        const qs = v.questions
          .map(
            (q) =>
              '<article class="wq"><div class="wq-head"><span class="wq-n">' +
              q.n +
              '.</span><div class="wq-q">' +
              q.q +
              "</div>" +
              (String(q.q).indexOf("wq-partmk") >= 0 ? "" : '<span class="wq-mk">[' + q.marks + "]</span>") +
              '</div><div class="wq-work" style="min-height:' +
              (40 + 16 * Number(q.marks || 0)) +
              'px"></div></article>'
          )
          .join("");
        const head =
          data.kind === "mock"
            ? coverPage(data, v)
            : '<div class="sheet-head"><h2>' +
              esc(data.title || "Worksheet") +
              (many ? " · Version " + v.letter : "") +
              "</h2><p>" +
              [data.className, data.date, "Seed " + data.seed + (many ? " · Version " + v.letter : "")].filter(Boolean).map(esc).join(" · ") +
              "</p></div>";
        return (
          '<section class="version">' +
          head +
          qs +
          '<p class="total">Total marks: ' +
          v.total +
          "</p>" +
          (data.kind === "mock" ? scoreSheet(v) : "") +
          "</section>"
        );
      })
      .join("");
    const betaNote =
      data.kind === "mock"
        ? '<p class="mock-beta noprint">Beta: mock papers are auto-assembled from published topics; check before use.</p>'
        : "";
    if (!data.answers) return betaNote + sheets;
    const scheme = data.versions
      .map((v) => {
        const body = v.questions
          .map(
            (q) =>
              '<div class="panel"><h3 title="' +
              esc(q.id) +
              '">' +
              esc(q.label || "Q" + q.n) +
              "</h3><p>" +
              q.answer +
              "</p>" +
              schemeTable(q.solution) +
              "</div>"
          )
          .join("");
        return (
          '<section class="scheme"><h2>Mark scheme' +
          (many ? " · Version " + v.letter : "") +
          "</h2>" +
          body +
          "</section>"
        );
      })
      .join("");
    return betaNote + sheets + scheme;
  }

  const api = {
    COURSES,
    parseId,
    idsFor,
    groups,
    taskMeta,
    taskLabel,
    rowMarkSum,
    itemSeed,
    parseQuery,
    toQuery,
    localDate,
    buildSheet,
    buildTopicSheet,
    buildMockSheet,
    render,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  g.worksheet = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
