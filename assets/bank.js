(function (g) {
  const DIFF_RANK = { easy: 0, medium: 1, hard: 2 };

  function mulberry(seed) {
    let s = (seed >>> 0) || 1;
    return function () {
      s += 0x6d2b79f5;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(rng, arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function inUpto(section, upto) {
    if (!upto) return true;
    const m = String(upto).trim().match(/^(IGCSE|P1|P23|S1|S2)-(\d+)(?:\.(\d+))?$/);
    if (!m) return true;
    const sm = String(section).match(/^(IGCSE|P1|P23|S1|S2)-(\d+)\.(\d+)$/);
    if (!sm) return false;
    if (sm[1] !== m[1]) return false;
    const ch = Number(sm[2]);
    const sec = Number(sm[3]);
    const capCh = Number(m[2]);
    const capSec = m[3] == null ? Infinity : Number(m[3]);
    if (ch < capCh) return true;
    if (ch > capCh) return false;
    return sec <= capSec;
  }

  function largestRemainder(total, weights) {
    const keys = Object.keys(weights);
    const sum = keys.reduce((n, k) => n + Math.max(0, Number(weights[k]) || 0), 0) || 1;
    const raw = keys.map((k) => {
      const exact = (total * Math.max(0, Number(weights[k]) || 0)) / sum;
      return { k, floor: Math.floor(exact), frac: exact - Math.floor(exact) };
    });
    let used = raw.reduce((n, r) => n + r.floor, 0);
    raw.sort((a, b) => b.frac - a.frac);
    let i = 0;
    while (used < total && raw.length) {
      raw[i % raw.length].floor += 1;
      used += 1;
      i += 1;
    }
    const out = {};
    raw.forEach((r) => {
      out[r.k] = r.floor;
    });
    return out;
  }

  function matchesMix(rec, mix) {
    if (!mix || mix === "mixed") return true;
    if (mix === "pp") return rec.type === "pp";
    if (mix === "gen" || mix === "generators") return rec.type === "generator";
    if (mix === "fixed") return rec.type === "fixed";
    return true;
  }

  function matchesDiff(rec, band) {
    if (!band || band === "any") return true;
    return rec.difficulty === band;
  }

  function chapterOk(rec, chapters, sections) {
    if (sections && sections.length) return rec.subsections.some((s) => sections.indexOf(s) >= 0);
    if (chapters && chapters.length) return chapters.indexOf(rec.chapter) >= 0;
    return true;
  }

  function filterPool(records, opt) {
    return (records || []).filter((rec) => {
      if (opt.course && rec.course !== opt.course) return false;
      if (!chapterOk(rec, opt.chapters, opt.sections)) return false;
      if (!matchesMix(rec, opt.mix)) return false;
      if (!matchesDiff(rec, opt.difficulty)) return false;
      if (opt.upto && !rec.subsections.some((s) => inUpto(s, opt.upto))) return false;
      if (opt.papers && opt.papers.length) {
        return rec.subsections.some((s) => opt.papers.some((p) => s.indexOf(p + "-") === 0));
      }
      return true;
    });
  }

  function pickWithoutRepeat(pool, rng, wantCount, wantMarks) {
    const ranked = pool.slice().sort((a, b) => {
      const d = (DIFF_RANK[a.difficulty] || 1) - (DIFF_RANK[b.difficulty] || 1);
      if (d) return d;
      return a.marks - b.marks || String(a.id).localeCompare(String(b.id));
    });
    const picked = [];
    const used = new Set();
    let marks = 0;
    const shuffledEasy = shuffle(rng, ranked);
    const ordered = ranked;
    const source = wantCount ? ordered : shuffledEasy;
    for (const rec of source) {
      if (used.has(rec.id)) continue;
      if (wantCount && picked.length >= wantCount) break;
      if (wantMarks && marks + rec.marks > wantMarks && picked.length) {
        continue;
      }
      picked.push(rec);
      used.add(rec.id);
      marks += rec.marks;
      if (wantCount && picked.length >= wantCount) break;
      if (wantMarks && marks >= wantMarks) break;
    }
    if (wantMarks && marks !== wantMarks) {
      const rest = pool.filter((r) => !used.has(r.id));
      const hit = exactFill(rest, wantMarks - marks);
      hit.forEach((r) => {
        picked.push(r);
        marks += r.marks;
      });
    }
    picked.sort((a, b) => (DIFF_RANK[a.difficulty] || 1) - (DIFF_RANK[b.difficulty] || 1) || a.marks - b.marks);
    return picked;
  }

  function exactFill(pool, need) {
    if (need <= 0) return [];
    const items = pool.slice().sort((a, b) => a.marks - b.marks);
    const n = Math.min(items.length, 12);
    let best = [];
    function walk(i, left, acc) {
      if (left === 0) {
        best = acc.slice();
        return true;
      }
      if (i >= n || left < 0) return false;
      for (let j = i; j < n; j++) {
        if (items[j].marks > left) break;
        acc.push(items[j]);
        if (walk(j + 1, left - items[j].marks, acc)) return true;
        acc.pop();
      }
      return false;
    }
    walk(0, need, []);
    return best;
  }

  function chapterWeights(pool) {
    const w = {};
    for (const rec of pool) {
      w[rec.chapter] = (w[rec.chapter] || 0) + Math.max(1, rec.marks);
    }
    return w;
  }

  function pickForBudget(pool, budget, rng, preferType) {
    const ranked = shuffle(
      rng,
      pool.slice().sort((a, b) => {
        const pa = preferType && a.type === preferType ? 0 : 1;
        const pb = preferType && b.type === preferType ? 0 : 1;
        return pa - pb || a.marks - b.marks;
      })
    );
    const got = [];
    let marks = 0;
    const used = new Set();
    for (const rec of ranked) {
      if (used.has(rec.id)) continue;
      if (marks + rec.marks > budget) continue;
      got.push(rec);
      used.add(rec.id);
      marks += rec.marks;
      if (marks === budget) break;
    }
    if (marks < budget) {
      exactFill(
        pool.filter((r) => !used.has(r.id)),
        budget - marks
      ).forEach((r) => {
        got.push(r);
        marks += r.marks;
      });
    }
    return { items: got, marks };
  }

  function gMarks(g) {
    return (g.items || []).reduce((n, r) => n + Number(r.marks || 0), 0);
  }

  function uglyGenerated(s) {
    const t = String(s || "");
    const hits = [];
    if (/(?<![0-9A-Za-z\\])-?1x(?![0-9A-Za-z])/.test(t) || /−1x/.test(t)) hits.push("1x");
    if (/\+\s*[-−]/.test(t)) hits.push("+ -");
    if (/\\\(\(\d+(?:\.\d+)?\)\\\)/.test(t) || /(^|[\s,;:])\(\d+(?:\.\d+)?\)(?!\s*,)/.test(t)) hits.push("bare-parens");
    const frac = [...t.matchAll(/\\(?:d?frac)\{(\d+)\}\{(\d+)\}/g)];
    const slash = [...t.matchAll(/(?:^|[^0-9/])(\d{1,2})\/(\d{1,2})(?![0-9/])/g)];
    function gcd(a, b) {
      a = Math.abs(Number(a) || 0);
      b = Math.abs(Number(b) || 0);
      while (b) {
        const k = a % b;
        a = b;
        b = k;
      }
      return a || 1;
    }
    if (frac.concat(slash).some((m) => gcd(m[1], m[2]) > 1)) hits.push("unreduced-frac");
    return hits;
  }

  function polishGenerated(s) {
    let t = String(s || "");
    t = t.replace(/\\\(\((\d+(?:\.\d+)?)\)\\\)/g, "\\($1\\)");
    t = t.replace(/(^|[\s,;:])\((\d+(?:\.\d+)?)\)(?!\s*,)/g, "$1$2");
    t = t.replace(/([+\-−=])\s*1x\b/g, function (_, op) {
      if (op === "+") return "+x";
      if (op === "=") return "=x";
      return op + "x";
    });
    t = t.replace(/(^|[^0-9A-Za-z])1x\b/g, "$1x");
    t = t.replace(/\+\s*[-−]/g, "−");
    t = t.replace(/\\(?:d?frac)\{(\d+)\}\{(\d+)\}/g, function (_, a, b) {
      let x = Number(a),
        y = Number(b);
      let g = x,
        h = y;
      while (h) {
        const k = g % h;
        g = h;
        h = k;
      }
      g = g || 1;
      x /= g;
      y /= g;
      if (y === 1) return String(x);
      return "\\frac{" + x + "}{" + y + "}";
    });
    t = t.replace(/(\d+)\s*\/\s*(\d+)/g, function (m, a, b) {
      let x = Number(a),
        y = Number(b);
      let g = x,
        h = y;
      while (h) {
        const k = g % h;
        g = h;
        h = k;
      }
      if (!g || g === 1) return m;
      x /= g;
      y /= g;
      return y === 1 ? String(x) : x + "/" + y;
    });
    return t;
  }

  function shortPaperCode(raw) {
    let s = String(raw || "").replace(/\s+/g, " ").trim();
    s = s.replace(/\s*Question\s+/i, " Q");
    s = s.replace(/\s+only\b/i, "");
    s = s.replace(/\s*\(.*$/, "");
    return s.replace(/\s+/g, " ").trim();
  }

  function splitProvenance(stem) {
    const s = String(stem || "");
    const m = s.match(
      /^This question is\s+([\s\S]+?)(?:,|\.)\s*(?:taken from the official QP[^.]*\.\s*)?(?:The opening sentences[\s\S]*?\.\s*)?/i
    );
    if (!m) return { body: s, code: "" };
    return { body: s.slice(m[0].length).trim(), code: shortPaperCode(m[1]) };
  }

  function stripLeadingPartLabels(s) {
    return String(s || "").replace(/^(<p[^>]*>)?(?:\s|<br\s*\/?>|\n)*(?:\(([a-z]|[ivxl]+)\)\s*)+/i, "$1");
  }

  function partTokenRe() {
    return /\((i{1,3}|iv|vi{0,3}|ix|a|b|c|d)\)/gi;
  }

  function hasOrphanPartLabel(stem) {
    const body = splitProvenance(stem).body;
    const toks = [...body.matchAll(partTokenRe())].map((m) => m[1].toLowerCase());
    if (!toks.length) return false;
    const set = new Set(toks);
    const romans = ["i", "ii", "iii", "iv", "v", "vi"];
    const letters = ["a", "b", "c", "d"];
    const firstRom = romans.find((x) => set.has(x));
    const firstLet = letters.find((x) => set.has(x));
    if (firstRom && firstRom !== "i") return true;
    if (firstLet && firstLet !== "a") return true;
    return false;
  }

  function stripOrphanPartLabels(s) {
    if (!hasOrphanPartLabel(s)) return String(s || "");
    return String(s || "").replace(/(^|[\n>]|\s)\((?:ii|iii|iv|v|vi|b|c|d)\)\s+/gi, "$1");
  }

  function partRank(label) {
    const p = String(label || "").toLowerCase();
    const letters = { a: 1, b: 2, c: 3, d: 4 };
    if (letters[p]) return letters[p];
    const romans = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6 };
    if (romans[p]) return romans[p];
    return 99;
  }

  function paperParts(raw) {
    const s = String(raw || "");
    const m = s.match(/Q(\d+)\s*((?:\([^)]+\))+)?/i);
    if (!m) return { q: 0, parts: [] };
    const parts = [...String(m[2] || "").matchAll(/\(([^)]+)\)/g)].map((x) => x[1].toLowerCase());
    return { q: Number(m[1]), parts };
  }

  function cmpPpTasks(a, b) {
    const pa = paperParts((a.source && a.source.paper) || a.id);
    const pb = paperParts((b.source && b.source.paper) || b.id);
    if (pa.q !== pb.q) return pa.q - pb.q;
    const n = Math.max(pa.parts.length, pb.parts.length);
    for (let i = 0; i < n; i++) {
      const d = partRank(pa.parts[i]) - partRank(pb.parts[i]);
      if (d) return d;
    }
    return pa.parts.length - pb.parts.length;
  }

  function splitIntroPart(body) {
    const t = String(body || "");
    const m = partTokenRe().exec(t);
    partTokenRe().lastIndex = 0;
    if (!m) return { intro: t.trim(), part: "" };
    return { intro: t.slice(0, m.index).trim(), part: t.slice(m.index).trim() };
  }

  function expandPastPaperStem(task, taskById) {
    if (!task || task.kind !== "pastpaper") return String((task && (task.stem || task.title)) || "");
    const paper = (task.source && task.source.paper) || task.id || "";
    const key = paperQuestionKey(paper);
    const siblings = Object.keys(taskById || {}).map((id) => taskById[id]);
    const group = siblings
      .filter((s) => s && s.kind === "pastpaper" && paperQuestionKey((s.source && s.source.paper) || s.id) === key)
      .sort(cmpPpTasks);
    const mineIdx = group.findIndex((s) => s.id === task.id);
    const used = mineIdx >= 0 ? group.slice(0, mineIdx + 1) : [task];
    const pieces = used.map((s) => splitIntroPart(splitProvenance(s.stem || s.title || "").body));
    let intro = "";
    pieces.forEach((p) => {
      if (p.intro.length > intro.length) intro = p.intro;
    });
    const parts = [];
    const seen = new Set();
    pieces.forEach((p) => {
      if (!p.part || seen.has(p.part)) return;
      seen.add(p.part);
      parts.push(p.part);
    });
    const split = splitProvenance(task.stem || "");
    const body = [intro].concat(parts).filter(Boolean).join("\n\n");
    if (!split.code) return body;
    return "This question is " + split.code + ", taken from the official QP.\n\n" + body;
  }

  function stripMarkBrackets(s) {
    return String(s || "").replace(/\s*\[\d+\](?:\s*\[\d+\])*/g, "");
  }

  function stripSiteChrome(s) {
    let t = String(s || "");
    t = t.replace(/\s*Work on paper, then reveal the solution and self-mark[^.]*\.?/gi, "");
    t = t.replace(/\s*then reveal the solution and self-mark[^.]*\.?/gi, "");
    t = t.replace(/[;:]?\s*no typed numeric answer is used\.?/gi, "");
    t = t.replace(/\s*reveal the solution[^.]*\.?/gi, "");
    return t.replace(/[ \t]{2,}/g, " ").replace(/\s+\./g, ".").trim();
  }

  function cleanQuestionStem(stem) {
    const split = splitProvenance(stem);
    const body = stripOrphanPartLabels(stripSiteChrome(stripMarkBrackets(stripLeadingPartLabels(split.body)))).replace(/^\s+/, "");
    return { q: polishGenerated(body), code: split.code };
  }

  function paperQuestionKey(raw) {
    const s = String(raw || "");
    const m = s.match(/(\d{4}\/\d+)\/([A-Z])\/([A-Z])\/(\d+)\s*Q(\d+)/i);
    if (m) return m[1] + "/" + m[2] + "/" + m[3] + "/" + m[4] + " Q" + m[5];
    return shortPaperCode(s);
  }

  function secKey(r) {
    return (r.subsections && r.subsections[0]) || r.chapter || r.id;
  }

  function isIgPaper4(raw) {
    return /0580\/4\d/i.test(String(raw || ""));
  }

  function applyCleanOut(out, rec) {
    if (!out) return out;
    const cleaned = cleanQuestionStem(out.q || "");
    out.q = cleaned.q;
    out.sourceCode = cleaned.code || (rec && rec.source && rec.source.paper ? shortPaperCode(rec.source.paper) : "");
    if (rec && rec.type === "pp" && !out.sourceCode) out.sourceCode = shortPaperCode(rec.id);
    return out;
  }

  function extractAnswerHtml(block) {
    const m = String(block || "").match(/<p class="final">[\s\S]*?<strong>\s*Answer:<\/strong>\s*([\s\S]*?)<\/p>/i);
    return m ? m[1].trim() : "";
  }

  function lookTaskParas(block) {
    const paras = [...String(block || "").matchAll(/<p(?:\s+class="([^"]*)")?[^>]*>([\s\S]*?)<\/p>/gi)]
      .filter((p) => !/^(src|final|note|key-words|marks-key)$/.test(p[1] || ""))
      .map((p) => p[2]);
    const cue =
      /\b(find|calculate|show|solve|what|how|write|sketch|draw|determine|express|evaluate|prove|state|give|work out|change)\b/i;
    return paras.find((p) => /\?/.test(p) || cue.test(p)) || "";
  }

  function theoryHit(html, loc) {
    const weRe = /<div class="worked-example">([\s\S]*?)<\/div>/gi;
    let m;
    let n = 0;
    while ((m = weRe.exec(html))) {
      n += 1;
      const h4 = /<h4>[\s\S]*?Worked example\s+(\d+)/i.exec(m[1]);
      const num = h4 ? Number(h4[1]) : n;
      if (loc === "WE" + num) {
        const stem = lookTaskParas(m[1]);
        const answer = extractAnswerHtml(m[1]);
        if (stem && answer) return { stem, answer };
      }
    }
    const qcRe = /<div class="quick-check"[^>]*>([\s\S]*?)<\/div>/gi;
    n = 0;
    while ((m = qcRe.exec(html))) {
      n += 1;
      const h4 = /<h4>[^<]*Quick check\s+(\d+)/i.exec(m[1]);
      const num = h4 ? Number(h4[1]) : n;
      const qAttr = /data-q="([^"]+)"/.exec(m[0]);
      const qid = qAttr ? qAttr[1] : "QC" + num;
      if (loc === qid || loc === "QC" + num) {
        const stem = lookTaskParas(m[1]);
        const answer = extractAnswerHtml(m[1]);
        if (stem && answer) return { stem, answer };
      }
    }
    return null;
  }

  function recFamily(r) {
    return r.family || (r.source && r.source.kind === "generator" ? "gen:" + r.source.locator : r.id);
  }

  function isStructuredRec(r) {
    return !!r.structured;
  }

  function isGenRec(r) {
    return r.type === "generator" || String(recFamily(r)).indexOf("gen:") === 0;
  }

  function makeBundle(pool, used, need, rng, minMarks, usedFam) {
    const minP = Math.max(1, minMarks || 1);
    const avail = shuffle(
      rng,
      pool.filter((r) => {
        if (used.has(r.id) || isStructuredRec(r) || r.marks < minP || r.marks > need) return false;
        if (usedFam && isGenRec(r) && usedFam.has(recFamily(r))) return false;
        return true;
      })
    );
    const byCh = {};
    avail.forEach((r) => {
      const k = secKey(r);
      (byCh[k] = byCh[k] || []).push(r);
    });
    const chapters = shuffle(rng, Object.keys(byCh));
    for (const ch of chapters) {
      const items = [];
      let m = 0;
      for (const r of byCh[ch]) {
        if (items.length >= 3) break;
        if (m + r.marks > need) continue;
        if (items.some((it) => recFamily(it) === recFamily(r))) continue;
        if (usedFam && isGenRec(r) && usedFam.has(recFamily(r))) continue;
        items.push(r);
        m += r.marks;
        if (m >= minMarks && (items.length >= 2 || m >= 5 || need <= 3)) {
          return { items: items.slice() };
        }
      }
      if (items.length === 1 && items[0].marks >= Math.min(minMarks, need)) {
        return { items: items.slice() };
      }
    }
    const one =
      avail.find((r) => r.marks >= minMarks && r.marks <= need) || avail.find((r) => r.marks <= need);
    if (one) {
      return { items: [one] };
    }
    return null;
  }

  function commitGroup(g, used, usedFam) {
    (g.items || []).forEach((r) => {
      used.add(r.id);
      if (usedFam) usedFam.add(recFamily(r));
    });
    return g;
  }

  function isPurePp(g) {
    return (g.items || []).length === 1 && g.items[0].type === "pp";
  }

  function isLockedGroup(g) {
    return isPurePp(g) || (g.items || []).some(isStructuredRec);
  }

  function forceGroupTotal(groups, pool, used, target, rng, qMin, qMax, minPart, usedFam) {
    const mp = minPart == null ? 2 : minPart;
    const fam = usedFam || new Set();
    let guard = 0;
    while (groups.reduce((n, g) => n + gMarks(g), 0) !== target && guard++ < 100) {
      const cur = groups.reduce((n, g) => n + gMarks(g), 0);
      if (cur < target) {
        const need = target - cur;
        const bundle = makeBundle(pool, used, need, rng, mp, fam);
        if (bundle && groups.length < qMax) {
          groups.push(commitGroup(bundle, used, fam));
          continue;
        }
        const grow = groups
          .map((g, i) => ({ g, i, room: 12 - gMarks(g) }))
          .filter((x) => x.room > 0 && !isLockedGroup(x.g) && x.g.items.length < 3)
          .sort((a, b) => b.room - a.room)[0];
        if (grow) {
          const want = Math.min(need, grow.room);
          const ch0 = grow.g.items[0] && secKey(grow.g.items[0]);
          const extra = makeBundle(
            pool.filter((r) => r.type !== "pp" && !isStructuredRec(r) && r.marks >= 2 && (!ch0 || secKey(r) === ch0)),
            used,
            want,
            rng,
            2,
            fam
          );
          const take = extra ? extra.items.slice(0, 5 - grow.g.items.length) : [];
          let added = 0;
          take.forEach((r) => {
            if (secKey(r) !== ch0) return;
            if (gMarks(grow.g) + r.marks <= 12 && r.marks <= want - added) {
              grow.g.items.push(r);
              used.add(r.id);
              fam.add(recFamily(r));
              added += r.marks;
            }
          });
          if (added) continue;
          const any = pool
            .filter(
              (r) =>
                !used.has(r.id) &&
                r.type !== "pp" &&
                r.marks >= mp &&
                (!ch0 || secKey(r) === ch0) &&
                r.marks <= want &&
                gMarks(grow.g) + r.marks <= 12
            )
            .sort((a, b) => b.marks - a.marks)[0];
          if (any && secKey(any) === ch0) {
            grow.g.items.push(any);
            used.add(any.id);
            fam.add(recFamily(any));
            continue;
          }
        }
        if (groups.length < qMax + 1) {
          const extraQ = makeBundle(pool.filter((r) => r.type !== "pp" && !isStructuredRec(r) && r.marks >= mp), used, Math.min(10, Math.max(need, mp)), rng, mp, fam);
          if (extraQ) {
            groups.push(commitGroup(extraQ, used, fam));
            continue;
          }
        }
        const fill = exactFill(
          pool.filter((r) => !used.has(r.id) && r.type !== "pp" && r.marks >= mp && !(isGenRec(r) && fam.has(recFamily(r)))),
          need
        );
        if (fill.length === 1 && groups.length < qMax + 2) {
          groups.push(commitGroup({ items: fill }, used, fam));
          continue;
        }
        if (fill.length > 1) {
          const s0 = secKey(fill[0]);
          if (fill.every((r) => secKey(r) === s0) && groups.length < qMax + 2) {
            groups.push(commitGroup({ items: fill.slice(0, 3) }, used, fam));
            continue;
          }
          groups.push(commitGroup({ items: [fill[0]] }, used, fam));
          continue;
        }
        const last = pool.find((r) => !used.has(r.id) && r.marks === need && r.marks >= mp && !(isGenRec(r) && fam.has(recFamily(r))));
        if (last && groups.length < qMax + 2) {
          groups.push(commitGroup({ items: [last] }, used, fam));
          continue;
        }
        break;
      }
      const extra = cur - target;
      const dropG = groups.find((g) => gMarks(g) === extra);
      if (dropG && groups.length > qMin) {
        dropG.items.forEach((r) => used.delete(r.id));
        groups.splice(groups.indexOf(dropG), 1);
        continue;
      }
      let trimmed = false;
      for (const g of groups) {
        const last = g.items[g.items.length - 1];
        if (g.items.length > 1 && last.marks <= extra) {
          g.items.pop();
          used.delete(last.id);
          trimmed = true;
          break;
        }
      }
      if (trimmed) continue;
      if (groups.length > qMin) {
        groups.sort((a, b) => gMarks(a) - gMarks(b));
        const small = groups[0];
        if (gMarks(small) <= extra) {
          small.items.forEach((r) => used.delete(r.id));
          groups.shift();
          continue;
        }
      }
      break;
    }
    return groups;
  }

  function assembleStructured(pool, rng, template, spec) {
    const target = template.marks;
    const qMin = spec.qMin;
    const qMax = spec.qMax;
    const used = new Set();
    const usedFam = new Set();
    const groups = [];
    const pp = shuffle(
      rng,
      pool.filter((r) => r.type === "pp" && r.marks >= 4 && r.marks <= 12)
    );
    const whole = shuffle(
      rng,
      pool.filter((r) => isStructuredRec(r) && r.marks >= 4 && r.marks <= 12 && r.type !== "pp")
    );
    const ppSlots = Math.max(2, qMax - 4);
    const ppMarkCap = Math.round(target * 0.7);
    for (const rec of pp.concat(whole)) {
      if (used.has(rec.id)) continue;
      if (groups.length >= ppSlots) break;
      if (groups.reduce((n, g) => n + gMarks(g), 0) + rec.marks > ppMarkCap) break;
      groups.push({ items: [rec] });
      used.add(rec.id);
      usedFam.add(recFamily(rec));
    }
    const fillers = pool.filter((r) => r.type !== "pp" && !isStructuredRec(r) && r.marks >= 2);
    while (groups.length < qMin || groups.reduce((n, g) => n + gMarks(g), 0) < target) {
      if (groups.length >= qMax && groups.reduce((n, g) => n + gMarks(g), 0) >= target) break;
      const remain = target - groups.reduce((n, g) => n + gMarks(g), 0);
      if (remain <= 0 && groups.length >= qMin) break;
      const need = Math.max(1, Math.min(spec.maxItem || 10, remain > 0 ? remain : spec.maxItem || 10));
      const bundle = makeBundle(fillers, used, need, rng, spec.minItem || 3, usedFam);
      if (!bundle) break;
      if (groups.length >= qMax) break;
      groups.push(commitGroup(bundle, used, usedFam));
    }
    forceGroupTotal(groups, pool, used, target, rng, qMin, qMax, 2, usedFam);
    groups.sort((a, b) => {
      const da = Math.min.apply(
        null,
        a.items.map((r) => DIFF_RANK[r.difficulty] || 1)
      );
      const db = Math.min.apply(
        null,
        b.items.map((r) => DIFF_RANK[r.difficulty] || 1)
      );
      return da - db || gMarks(a) - gMarks(b);
    });
    while (groups.filter((g) => gMarks(g) < 3).length > (spec.shortMax || 2)) {
      const tiny = groups.find((g) => gMarks(g) < 3);
      if (!tiny) break;
      const mate = groups.find(
        (g) =>
          g !== tiny &&
          !isLockedGroup(g) &&
          g.items.length < 3 &&
          secKey(g.items[0]) === secKey(tiny.items[0]) &&
          gMarks(g) + gMarks(tiny) <= 10
      );
      if (!mate) break;
      tiny.items.forEach((r) => mate.items.push(r));
      groups.splice(groups.indexOf(tiny), 1);
    }
    return groups;
  }

  function assembleP4(pool, rng, template) {
    const target = template.marks;
    const used = new Set();
    const usedFam = new Set();
    const groups = [];
    const pp = shuffle(
      rng,
      pool.filter((r) => r.type === "pp" && isIgPaper4((r.source && r.source.paper) || r.id))
    );
    const byQ = {};
    pp.forEach((r) => {
      const k = paperQuestionKey((r.source && r.source.paper) || r.id);
      (byQ[k] = byQ[k] || []).push(r);
    });
    const qKeys = shuffle(rng, Object.keys(byQ));
    for (const k of qKeys) {
      const recs = byQ[k] || [];
      recs.filter(isStructuredRec).forEach((r) => {
        if (groups.length >= 12 || used.has(r.id)) return;
        groups.push({ items: [r] });
        used.add(r.id);
        usedFam.add(recFamily(r));
      });
      const rest = recs.filter((r) => !isStructuredRec(r) && !used.has(r.id));
      const items = [];
      const seenF = new Set();
      rest.forEach((r) => {
        const f = recFamily(r);
        if (seenF.has(f) || r.marks < 2) return;
        seenF.add(f);
        items.push(r);
      });
      if (!items.length || groups.length >= 12) continue;
      groups.push({ items: items.slice() });
      items.forEach((r) => {
        used.add(r.id);
        usedFam.add(recFamily(r));
      });
    }
    const leftoverP4 = pp.filter((r) => !used.has(r.id) && r.marks >= 4);
    for (const rec of leftoverP4) {
      if (groups.length >= 12) break;
      groups.push({ items: [rec] });
      used.add(rec.id);
      usedFam.add(recFamily(rec));
    }
    const fillers = pool.filter((r) => r.type !== "pp" && !isStructuredRec(r) && r.marks >= 2);
    while (groups.length < 10 || groups.reduce((n, g) => n + gMarks(g), 0) < target) {
      const remain = target - groups.reduce((n, g) => n + gMarks(g), 0);
      if (remain <= 0 && groups.length >= 10) break;
      if (groups.length >= 16) break;
      const bundle = makeBundle(fillers, used, Math.min(10, Math.max(4, remain)), rng, 4, usedFam);
      if (!bundle) break;
      groups.push(commitGroup(bundle, used, usedFam));
    }
    forceGroupTotal(groups, pool, used, target, rng, 10, 18, 4, usedFam);
    let mergeGuard = 0;
    while (groups.filter((g) => gMarks(g) <= 3).length > 4 && mergeGuard++ < 8) {
      const tiny = groups.filter((g) => gMarks(g) <= 3 && !g.items.some(isStructuredRec));
      if (tiny.length < 2) break;
      const a = tiny[0];
      const b = tiny.find((g) => g !== a && secKey(g.items[0]) === secKey(a.items[0]));
      if (!b) break;
      b.items.forEach((r) => a.items.push(r));
      groups.splice(groups.indexOf(b), 1);
    }
    groups.sort((a, b) => {
      const pa = a.items.some((r) => r.type === "pp" && isIgPaper4((r.source && r.source.paper) || r.id)) ? 0 : 1;
      const pb = b.items.some((r) => r.type === "pp" && isIgPaper4((r.source && r.source.paper) || r.id)) ? 0 : 1;
      return pa - pb || gMarks(b) - gMarks(a);
    });
    return groups;
  }

  function assembleIgP2(pool, rng, template) {
    const target = template.marks;
    const used = new Set();
    const usedFam = new Set();
    const groups = [];
    const short = shuffle(
      rng,
      pool.filter((r) => r.marks >= 1 && r.marks <= 3)
    );
    const medium = shuffle(
      rng,
      pool.filter((r) => r.marks >= 4 && r.marks <= 8)
    );
    for (const rec of short) {
      if (groups.filter((g) => gMarks(g) <= 3).length >= 10) break;
      if (groups.reduce((n, g) => n + gMarks(g), 0) + rec.marks > Math.round(target * 0.4)) break;
      if (isGenRec(rec) && usedFam.has(recFamily(rec))) continue;
      groups.push({ items: [rec] });
      used.add(rec.id);
      usedFam.add(recFamily(rec));
    }
    for (const rec of medium) {
      if (groups.length >= 22) break;
      if (groups.reduce((n, g) => n + gMarks(g), 0) + rec.marks > target) continue;
      if (isGenRec(rec) && usedFam.has(recFamily(rec))) continue;
      groups.push({ items: [rec] });
      used.add(rec.id);
      usedFam.add(recFamily(rec));
    }
    const rest = pool.filter((r) => !used.has(r.id));
    while (groups.length < 16 || groups.reduce((n, g) => n + gMarks(g), 0) < target) {
      const remain = target - groups.reduce((n, g) => n + gMarks(g), 0);
      if (remain <= 0 && groups.length >= 16) break;
      const bundle = makeBundle(rest, used, Math.max(1, remain), rng, remain >= 4 ? 4 : 1, usedFam);
      if (!bundle) break;
      if (groups.length >= 22) break;
      groups.push(commitGroup(bundle, used, usedFam));
    }
    forceGroupTotal(groups, pool, used, target, rng, 16, 22, 1, usedFam);
    groups.sort((a, b) => gMarks(a) - gMarks(b));
    return groups;
  }

  function pickMock(records, template, opt) {
    const rng = mulberry(opt.seed || 1);
    let pool = filterPool(records, {
      course: template.course,
      upto: opt.upto,
      papers: template.papers,
    });
    if (template.id !== "0580-P2") pool = pool.filter((r) => r.marks >= 2);
    if (template.id === "0580-P2") return assembleIgP2(pool, rng, template);
    if (template.id === "0580-P4") {
      return assembleP4(pool, rng, template);
    }
    return assembleStructured(pool, rng, template, {
      qMin: template.qMin || 9,
      qMax: template.qMax || 11,
      shortMax: 2,
      minItem: 4,
      maxItem: 10,
    });
  }

  function interp(s, env, fmt) {
    return polishGenerated(
      String(s || "").replace(/\{(\w+)\|(\w+)\}/g, function (_, name, f) {
        const v = env && env[name];
        if (v == null) return "";
        if (fmt) return fmt(v, f);
        return String(v);
      })
    );
  }

  function stemToHtml(html) {
    if (g.msDisplayFmt && typeof g.msDisplayFmt.stemToHtml === "function") return g.msDisplayFmt.stemToHtml(html);
    let s = String(html || "").replace(/<figcaption\b[^>]*>[\s\S]*?<\/figcaption>/gi, function (block) {
      const text = block.replace(/<[^>]+>/g, " ");
      return /static redraw|source diagram|only parts?\s+\([^)]+\)\s+(is|are) asked|printed diagram is also in the official|no figure field/i.test(text)
        ? ""
        : block;
    });
    const parts = [];
    const re = /<svg\b[\s\S]*?<\/svg>/gi;
    let last = 0;
    let m;
    while ((m = re.exec(s))) {
      parts.push(s.slice(last, m.index).replace(/\n/g, "<br>"));
      parts.push(m[0].replace(/\n+/g, " "));
      last = m.index + m[0].length;
    }
    parts.push(s.slice(last).replace(/\n/g, "<br>"));
    return parts.join("");
  }

  function packStatic(task, ctx) {
    const steps = task.steps || (task.parts || []).flatMap((p) => p.steps || []);
    const solution = steps.map((st) => ({
      part: st.name || "",
      answer: st.text_tex || st.note || "",
      marks: st.mark || "",
      guidance: st.note || "",
    }));
    const stem = stemToHtml(expandPastPaperStem(task, ctx && ctx.taskById));
    const cleaned = cleanQuestionStem(stem);
    return {
      q: cleaned.q,
      sourceCode: cleaned.code,
      answer: (task.answer && (task.answer.format || task.answer.expression)) || "See mark scheme",
      solution,
      marks: Number(task.marks) || 0,
    };
  }

  function packPractice(g, fmt) {
    if (!g) return null;
    const t = g.task;
    const env = g.env || {};
    const steps = t.steps || (t.parts || []).flatMap((p) => p.steps || []);
    const solution = steps.map((st) => ({
      part: st.name || "",
      answer: interp(st.text_tex || "", env, fmt),
      marks: st.mark || "",
      guidance: st.note || "",
    }));
    const ans = (g.parts || [])
      .map((p) => (p._value != null && isFinite(p._value) ? String(p._value) : ""))
      .filter(Boolean)
      .join(", ");
    const cleaned = cleanQuestionStem(stemToHtml(interp(t.stem || t.title || "", env, fmt)));
    return {
      q: cleaned.q,
      sourceCode: cleaned.code,
      answer: ans || "See mark scheme",
      solution,
      marks: Number(t.marks) || 0,
    };
  }

  function publicOut(out) {
    const pub = {};
    Object.keys(out || {}).forEach((k) => {
      if (k.charAt(0) !== "_") pub[k] = out[k];
    });
    return pub;
  }

  function materialize(rec, seed, ctx) {
    ctx = ctx || {};
    if (rec.source && rec.source.kind === "generator" && ctx.gens && ctx.gens[rec.source.locator]) {
      let start = (seed >>> 0) || 1;
      let out;
      const used = ctx.usedTexts || new Set();
      for (let t = 0; t < 64; t++) {
        out = publicOut(ctx.gens[rec.source.locator](ctx.mulberry ? ctx.mulberry(start) : mulberry(start)));
        if (out && out.q) out.q = polishGenerated(out.q);
        if (out && out.answer) out.answer = polishGenerated(out.answer);
        applyCleanOut(out, rec);
        if (out && out.q && uglyGenerated(out.q).length) continue;
        if (!used.has(out.q)) break;
        start = (start + 1) >>> 0 || 1;
      }
      if (ctx.strictUnique && used.has(out.q)) return null;
      if (ctx.usedTexts && out && out.q) ctx.usedTexts.add(out.q);
      return { out, seed: start };
    }
    if (rec.source && rec.source.kind === "tasks" && ctx.taskById) {
      const task = ctx.taskById[rec.source.locator];
      if (!task) return null;
      if (task.kind === "generated" && ctx.practice && ctx.practice.generate) {
        let start = typeof seed === "number" ? seed : 1;
        let packed;
        const used = ctx.usedTexts || new Set();
        for (let t = 0; t < 24; t++) {
          const g = ctx.practice.generate(task, start, "default");
          packed = packPractice(g, ctx.practice && ctx.practice.fmt);
          if (packed && packed.q && uglyGenerated(packed.q).length) continue;
          if (packed && !used.has(packed.q)) break;
          start += 1;
        }
        if (ctx.strictUnique && packed && used.has(packed.q)) return null;
        if (packed && ctx.usedTexts) ctx.usedTexts.add(packed.q);
        return packed ? { out: packed, seed: start } : null;
      }
      const packed = packStatic(task, ctx);
      if (ctx.strictUnique && ctx.usedTexts && ctx.usedTexts.has(packed.q)) return null;
      if (ctx.usedTexts) ctx.usedTexts.add(packed.q);
      return { out: packed, seed };
    }
    if (rec.source && rec.source.kind === "theory") {
      if (ctx.theoryText && ctx.theoryText[rec.id]) return { out: ctx.theoryText[rec.id], seed };
      let html = ctx.htmlByPath && ctx.htmlByPath[rec.source.path];
      if (!html && ctx.readFile) {
        try {
          html = ctx.readFile(rec.source.path);
        } catch (e) {
          html = "";
        }
      }
      if (html) {
        const loc = rec.source.locator || "";
        const hit = theoryHit(html, loc);
        if (!hit) return null;
        const cleaned = cleanQuestionStem(hit.stem);
        const packed = {
          q: cleaned.q,
          sourceCode: cleaned.code,
          answer: hit.answer || "See mark scheme",
          solution: [{ part: "", answer: hit.answer || "", marks: "", guidance: "" }],
          marks: rec.marks,
        };
        if (ctx.strictUnique && ctx.usedTexts && ctx.usedTexts.has(packed.q)) return null;
        if (ctx.usedTexts) ctx.usedTexts.add(packed.q);
        return { out: packed, seed };
      }
    }
    return null;
  }

  function markTokens(solution) {
    const bag = { M: 0, A: 0, B: 0 };
    (solution || []).forEach((row) => {
      const tokens = String(row.marks || "").match(/[MAB]\d+/g) || [];
      tokens.forEach((t) => {
        bag[t.charAt(0)] += Number(t.slice(1));
      });
    });
    return bag;
  }

  function schoolScale(raw, total) {
    const pct = total ? Math.round((1000 * raw) / total) / 10 : 0;
    let band = "U";
    if (pct >= 90) band = "A*";
    else if (pct >= 80) band = "A";
    else if (pct >= 70) band = "B";
    else if (pct >= 60) band = "C";
    else if (pct >= 50) band = "D";
    else if (pct >= 40) band = "E";
    return { pct, band, school10: Math.round((pct / 10) * 10) / 10 };
  }

  const api = {
    mulberry,
    filterPool,
    pickWithoutRepeat,
    pickMock,
    materialize,
    markTokens,
    schoolScale,
    inUpto,
    largestRemainder,
    packStatic,
    packPractice,
    polishGenerated,
    gMarks,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  g.msBank = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
