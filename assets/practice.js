(function (root) {
  var AA = typeof require === "function" ? require("./answer-accept.js") : root.msAnswerAccept;
  var DF = typeof require === "function" ? require("./display-fmt.js") : root.msDisplayFmt;
  var SCORE_KEY = "ms-task-score";
  var states = {};
  var byId = {};
  var hostSec = null;
  var showQpMs = false;
  var siteConfigP = null;
  function loadSiteConfig() {
    if (siteConfigP) return siteConfigP;
    if (typeof fetch !== "function") {
      siteConfigP = Promise.resolve({ showQpMs: false });
      return siteConfigP;
    }
    siteConfigP = fetch("data/site-config.json", { cache: "no-store" }).then(function (r) {
      if (!r.ok) return { showQpMs: false };
      return r.json();
    }).then(function (cfg) {
      showQpMs = !!(cfg && cfg.showQpMs);
      return cfg || {};
    }).catch(function () {
      showQpMs = false;
      return { showQpMs: false };
    });
    return siteConfigP;
  }
  function appendQpMsLinks(head, task) {
    if (!showQpMs) return;
    var src = task && task.source;
    if (!src || typeof src !== "object") return;
    if (!src.qp_url && !src.ms_url) return;
    var wrap = el("span", "pc-qpms");
    wrap.setAttribute("aria-label", "Official question paper and mark scheme");
    function addLink(href, label) {
      if (!href) return;
      var a = document.createElement("a");
      a.className = "pc-qpms-link";
      if (!/^https?:\/\//i.test(href)) return;
      a.href = href;
      a.textContent = label;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      wrap.appendChild(a);
    }
    addLink(src.qp_url, "QP");
    addLink(src.ms_url, "MS");
    head.appendChild(wrap);
  }

  var AUTHOR_NOTE_RE = /Original:|Independent:|Space the braces|TeX brace|tick total may differ|this M2 checkbox|checkbox records only|authoring note|static redraw/i;
  function studentNote(note) {
    var s = String(note || "");
    if (!s) return "";
    s = s.replace(/\s*Independent:\s*[\s\S]*/i, "");
    s = s.replace(/\s*Original:[^.]*\.?/gi, "");
    s = s.replace(/\s*Space the braces[^.]*\.?/gi, "");
    s = s.replace(/\s*this M2 checkbox[\s\S]*/gi, "");
    s = s.replace(/\s*Partial M1 is recorded on paper[\s\S]*/gi, "");
    s = s.trim();
    if (AUTHOR_NOTE_RE.test(s) && !/^Official MS|^MS:|^MS /i.test(s)) return "";
    return s;
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function markVal(m) {
    var x = String(m || "").match(/[MAB](\d)/);
    return x ? Number(x[1]) : 0;
  }
  function pyRound(x, n) {
    if (n == null) {
      var s = x < 0 ? -1 : 1;
      var ax = Math.abs(x);
      var fl = Math.floor(ax);
      var frac = ax - fl;
      var y;
      if (Math.abs(frac - 0.5) < 1e-12) y = fl % 2 === 0 ? fl : fl + 1;
      else y = Math.floor(ax + 0.5);
      return s * y;
    }
    var p = Math.pow(10, n);
    return pyRound(x * p) / p;
  }
  function trunc(x, k) {
    return Math.floor(x * Math.pow(10, k) + 1e-9) / Math.pow(10, k);
  }
  function sf3(x) {
    if (Math.abs(x) >= 100) {
      var g = Number(Number(x).toPrecision(3));
      return String(Math.round(g)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    var t = Number(x).toPrecision(3);
    return String(Number(t));
  }
  function fmt(v, f) {
    if (v == null) return "";
    if (f === "money") {
      var n = Number(v);
      var neg = n < 0;
      var parts = Math.abs(n).toFixed(2).split(".");
      return (neg ? "-" : "") + parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + parts[1];
    }
    if (f === "int") return String(Math.round(Number(v)));
    if (f === "cnt") return String(Math.round(Number(v))).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (f === "dp1") return Number(v).toFixed(1);
    if (f === "sf3") return sf3(Number(v));
    if (f === "sf3z") return DF.formatSf3z(v);
    if (f === "dp4") return DF.formatDp4(v);
    if (f === "num2") return Number(v).toFixed(2);
    if (f === "raw") {
      var r = Number(v);
      if (!isFinite(r)) return String(v);
      return Number(r.toPrecision(10)).toString();
    }
    if (typeof f === "string" && f.indexOf("num") === 0 && f.length > 3) {
      var k = Number(f.slice(3));
      return trunc(Number(v), k).toFixed(k);
    }
    if (f === "num") {
      var x = Number(v);
      if (typeof v === "number" && Number.isInteger(v)) return String(v);
      if (Math.abs(x - Math.round(x)) < 1e-9 && Math.abs(x) < 1e15) return String(Math.round(x));
      if (Math.abs(x * 100 - Math.round(x * 100)) < 1e-6) return x.toFixed(2);
      return x.toFixed(6);
    }
    return String(v);
  }
  function polishOut(s) {
    var bk = root.msBank;
    if (!bk && typeof require === "function") {
      try { bk = require("./bank.js"); } catch (e) { bk = null; }
    }
    return bk && bk.polishGenerated ? bk.polishGenerated(s) : s;
  }
  function render(t, env, kind) {
    var out = String(t || "").replace(/\{(\w+)\|(\w+)\}/g, function (_, name, f) {
      return fmt(env[name], f);
    });
    out = out.replace(/\{\{/g, "{").replace(/\}\}/g, "}");
    return kind === "generated" ? polishOut(out) : out;
  }
  function splitComma(s) {
    var parts = [];
    var cur = "";
    var d = 0;
    var i;
    for (i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      if (ch === "(" || ch === "[") d++;
      if (ch === ")" || ch === "]") d--;
      if (ch === "," && d === 0) {
        parts.push(cur);
        cur = "";
      } else cur += ch;
    }
    if (cur) parts.push(cur);
    return parts;
  }
  function arith(expr, env) {
    var i = 0;
    function skip() { while (expr.charAt(i) === " ") i++; }
    function peek() { skip(); return expr.charAt(i); }
    function eat(s) {
      skip();
      if (expr.slice(i, i + s.length) !== s) return false;
      i += s.length;
      return true;
    }
    function ident() {
      skip();
      var m = expr.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
      if (!m) throw new Error("name");
      i += m[0].length;
      return m[0];
    }
    function args() {
      var out = [];
      if (!eat(")")) {
        out.push(or());
        while (eat(",")) out.push(or());
        if (!eat(")")) throw new Error(")");
      }
      return out;
    }
    function postfix(v) {
      while (eat("[")) {
        var k = or();
        if (!eat("]")) throw new Error("]");
        v = v[k];
      }
      return v;
    }
    function primary() {
      var v;
      skip();
      if (eat("(")) {
        v = or();
        if (!eat(")")) throw new Error(")");
        return postfix(v);
      }
      if (eat("[")) {
        var arr = [];
        if (!eat("]")) {
          arr.push(or());
          while (eat(",")) arr.push(or());
          if (!eat("]")) throw new Error("]");
        }
        return postfix(arr);
      }
      var num = expr.slice(i).match(/^\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/);
      if (num) {
        i += num[0].length;
        return postfix(Number(num[0]));
      }
      var name = ident();
      if (name === "math") {
        if (!eat(".")) throw new Error("math");
        var member = ident();
        var table = { log: Math.log, floor: Math.floor, pow: Math.pow };
        if (!table[member] || peek() !== "(") throw new Error(member);
        eat("(");
        v = table[member].apply(null, args());
      } else if ((name === "abs" || name === "round") && peek() === "(") {
        eat("(");
        v = (name === "abs" ? Math.abs : pyRound).apply(null, args());
      } else if (Object.prototype.hasOwnProperty.call(env, name)) v = env[name];
      else throw new ReferenceError(name);
      return postfix(v);
    }
    function unary() {
      if (eat("+")) return +unary();
      if (eat("-")) return -unary();
      return primary();
    }
    function pow() {
      var v = unary();
      if (eat("**")) v = Math.pow(v, pow());
      return v;
    }
    function mul() {
      var v = pow();
      for (;;) {
        if (eat("*")) v = v * pow();
        else if (eat("/")) v = v / pow();
        else if (eat("%")) v = v % pow();
        else break;
      }
      return v;
    }
    function add() {
      var v = mul();
      for (;;) {
        if (eat("+")) v = v + mul();
        else if (eat("-")) v = v - mul();
        else break;
      }
      return v;
    }
    function cmp() {
      var v = add();
      for (;;) {
        if (eat("<=")) v = v <= add();
        else if (eat(">=")) v = v >= add();
        else if (eat("==")) v = v == add();
        else if (eat("!=")) v = v != add();
        else if (eat("<")) v = v < add();
        else if (eat(">")) v = v > add();
        else break;
      }
      return v;
    }
    function and() {
      var v = cmp();
      while (eat("&&")) v = v && cmp();
      return v;
    }
    function or() {
      var v = and();
      while (eat("||")) v = v || and();
      return v;
    }
    var out = or();
    skip();
    if (i !== expr.length) throw new Error("tail");
    return out;
  }
  function pyEval(src, env) {
    var expr = String(src || "").split("#")[0].trim();
    if (!expr || expr === "None") return null;
    var nx = expr.match(/^next\((\w+) for \1 in range\((.+),(.+)\) if (.+)\)$/);
    if (nx) {
      var a = pyEval(nx[2], env);
      var b = pyEval(nx[3], env);
      var j;
      for (j = a; j < b; j++) {
        var e2 = Object.assign({}, env);
        e2[nx[1]] = j;
        if (pyEval(nx[4], e2)) return j;
      }
      var err = new Error("StopIteration");
      err.name = "StopIteration";
      throw err;
    }
    if (expr.charAt(0) === "(" && expr.charAt(expr.length - 1) === ")") {
      var depth = 0;
      var wrapped = true;
      var k;
      for (k = 0; k < expr.length; k++) {
        var ch = expr.charAt(k);
        if (ch === "(" || ch === "[") depth++;
        if (ch === ")" || ch === "]") depth--;
        if (depth === 0 && k !== expr.length - 1) wrapped = false;
      }
      if (wrapped && depth === 0) {
        var bits = splitComma(expr.slice(1, -1));
        if (bits.length > 1) return bits.map(function (p) { return pyEval(p, env); });
      }
    }
    return arith(expr, env);
  }
  function Mulberry(seed) {
    var s = Number(seed) >>> 0;
    this.s = s >>> 0;
  }
  Mulberry.prototype.next = function () {
    this.s += 0x6D2B79F5;
    var t = Math.imul(this.s ^ (this.s >>> 15), 1 | this.s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  Mulberry.prototype.randint = function (a, b) {
    return a + Math.floor(this.next() * (b - a + 1));
  };
  function pickParams(rng, params) {
    var p = {};
    params.forEach(function (q) {
      var k = Math.round((q.max - q.min) / q.step);
      var v = Math.round((q.min + rng.randint(0, k) * q.step) * 1e10) / 1e10;
      if (Number.isInteger(v) && Number.isInteger(q.step)) p[q.name] = v | 0;
      else p[q.name] = v;
    });
    return p;
  }
  function applyCtx(task, ctx) {
    var t = Object.assign({}, task);
    ctx = ctx || {};
    if (ctx.stem) t.stem = ctx.stem;
    if (ctx.params) {
      var ov = {};
      ctx.params.forEach(function (q) { ov[q.name] = q; });
      t.params = (task.params || []).map(function (q) { return ov[q.name] || q; });
    }
    t.steps = (task.steps || []).map(function (s) {
      var tx = ctx.step_text && ctx.step_text[s.name];
      return tx ? Object.assign({}, s, { text_tex: tx }) : s;
    });
    if (ctx.answer_format && t.answer) t.answer = Object.assign({}, t.answer, { format: ctx.answer_format });
    t._ctx = ctx.id || "default";
    return t;
  }
  function runDerived(task, env) {
    var d = task.derived || {};
    Object.keys(d).forEach(function (k) {
      env[k] = pyEval(d[k], env);
    });
  }
  function constraintsOk(task, env) {
    var cs = task.constraints || [];
    var i;
    for (i = 0; i < cs.length; i++) {
      try {
        if (!pyEval(cs[i], env)) return false;
      } catch (e) {
        return false;
      }
    }
    return true;
  }
  function runSteps(steps, env) {
    (steps || []).forEach(function (s) {
      env[s.name] = pyEval(s.result, env);
    });
  }
  function allSteps(task) {
    if (task.parts) {
      var out = [];
      task.parts.forEach(function (p) {
        (p.steps || []).forEach(function (s) { out.push(s); });
      });
      return out;
    }
    return task.steps || [];
  }
  function isUnsetMark(v) {
    return v === undefined || v === "";
  }
  function combinePartMarking(outer, nested) {
    if (!isUnsetMark(outer) && outer !== "manual") return outer;
    if (!isUnsetMark(nested) && nested !== "manual") return nested;
    if (outer === "manual" || nested === "manual") return "manual";
    return "";
  }
  function answerParts(task) {
    if (task.parts) {
      return task.parts.map(function (p) {
        var ans = p.answer || {};
        var row = Object.assign({ part: p.part, stem: p.stem, marks: p.marks }, ans);
        row.marking = combinePartMarking(p.marking, ans.marking);
        return row;
      });
    }
    if (task.answer && task.answer.parts) return task.answer.parts;
    if (task.answer) return [task.answer];
    return [];
  }
  function generate(task, seed, ctxId) {
    var ctxs = task.contexts || [{ id: "default" }];
    var ctx = ctxs.filter(function (c) { return c.id === ctxId; })[0] || ctxs[0];
    var t = applyCtx(task, ctx);
    var p;
    var env;
    var attempt;
    if (seed === "orig" && task.original && (ctx.id || "default") === "default") {
      p = Object.assign({}, task.original);
      env = Object.assign({}, p);
      runDerived(t, env);
      if (!constraintsOk(t, env)) p = null;
    }
    if (!p) {
      var rng = new Mulberry(typeof seed === "number" ? seed : 1);
      for (attempt = 0; attempt < 8000; attempt++) {
        p = pickParams(rng, t.params || []);
        env = Object.assign({}, p);
        try {
          runDerived(t, env);
          if (constraintsOk(t, env)) break;
        } catch (e) {}
        p = null;
      }
    }
    if (!p) return null;
    env = Object.assign({}, p);
    runDerived(t, env);
    runSteps(t.steps || (t.parts ? [] : []), env);
    if (t.parts) t.parts.forEach(function (pt) { runSteps(pt.steps, env); });
    var parts = answerParts(t);
    parts.forEach(function (pa) {
      pa._value = pyEval(pa.expression, env);
    });
    return { task: t, env: env, parts: parts, ctx: t._ctx, seed: seed };
  }
  function questionVaries(task) {
    var bits = [task.stem || ""];
    (task.parts || []).forEach(function (p) { bits.push(p.stem || ""); });
    (task.contexts || []).forEach(function (c) { if (c && c.stem) bits.push(c.stem); });
    return /\{\w+\|\w+\}/.test(bits.join("\n"));
  }
  function randCtx(task) {
    var ctxs = task.contexts && task.contexts.length ? task.contexts : [{ id: "default" }];
    var c = ctxs[AA.randomSeed() % ctxs.length];
    return (c && c.id) || "default";
  }
  function paramSig(inst) {
    var o = {};
    ((inst.task && inst.task.params) || []).forEach(function (q) { o[q.name] = inst.env[q.name]; });
    return JSON.stringify(o);
  }
  function seenLoad(id) {
    try {
      var raw = sessionStorage.getItem("ms-seen:" + id);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }
  function seenSave(id, sig) {
    var arr = seenLoad(id).filter(function (s) { return s !== sig; });
    arr.push(sig);
    if (arr.length > 5) arr = arr.slice(arr.length - 5);
    try { sessionStorage.setItem("ms-seen:" + id, JSON.stringify(arr)); } catch (e) {}
  }
  function pickFresh(base, inst) {
    if (!base || base.kind !== "generated") return null;
    if (!questionVaries(base)) return { jump: true };
    var cur = inst ? paramSig(inst) : "";
    var seen = seenLoad(base.id);
    var loose = null;
    var i;
    for (i = 0; i < 30; i++) {
      var seed = AA.randomSeed();
      var ctx = randCtx(base);
      var next = generate(base, seed, ctx);
      if (!next) continue;
      var sig = paramSig(next);
      if (sig === cur) continue;
      loose = { inst: next, sig: sig };
      if (seen.indexOf(sig) < 0) return loose;
    }
    return loose || { jump: true };
  }
  function parseNum(s) {
    return AA.parseNum(s);
  }
  function accept(got, spec, exact) {
    return AA.accept(got, spec, exact);
  }
  function scores() {
    try { return JSON.parse(localStorage.getItem(SCORE_KEY) || "{}"); } catch (e) { return {}; }
  }
  function saveScore(id, score, total, kind, extra) {
    var all = scores();
    all[id] = Object.assign({ score: score, total: total, kind: kind || "machine" }, extra || {});
    try { localStorage.setItem(SCORE_KEY, JSON.stringify(all)); } catch (e) {}
  }
  function lastLine(id) {
    var s = scores()[id];
    if (!s) return "";
    if (s.kind === "mixed") return mixLine(s);
    if (s.kind === "self") return "Self-marked " + s.score + "/" + s.total + " (not machine-checked)";
    return "Last score: " + s.score + "/" + s.total;
  }
  function mixLine(s) {
    return "Auto " + s.autoScore + "/" + s.autoTotal + " · self " + s.selfScore + "/" + s.selfTotal;
  }
  function partMarks(pt, pa) {
    var n = Number(pt && pt.marks != null ? pt.marks : pa && pa.marks);
    return isFinite(n) && n > 0 ? n : 0;
  }
  function mixedTotals(task, parts) {
    var autoScore = 0;
    var autoTotal = 0;
    var selfScore = 0;
    var selfTotal = 0;
    (task.parts || []).forEach(function (pt, i) {
      var pa = (parts || [])[i] || {};
      var marks = partMarks(pt, pa);
      if (partMachine(task, pa)) {
        autoTotal += marks;
        var raw = pa._input ? pa._input.value : pa._typed;
        if (raw != null && accept(String(raw), pa, pa._value)) autoScore += marks;
      } else if (partManual(task, pa)) {
        selfTotal += marks;
        selfScore += tickScore(pt.steps || []);
      }
    });
    return { autoScore: autoScore, autoTotal: autoTotal, selfScore: selfScore, selfTotal: selfTotal };
  }
  function markingOf(task, part) {
    if (task && !isUnsetMark(task.marking)) return task.marking;
    if (part && !isUnsetMark(part.marking)) return part.marking;
    return "";
  }
  function isManualMark(m) {
    return m === "manual";
  }
  function isInvalidMark(m) {
    return !isUnsetMark(m) && m !== "manual";
  }
  function exactOk(pa) {
    return pa && pa._value != null && isFinite(Number(pa._value));
  }
  function partManual(task, pa) {
    if (isManualMark(markingOf(task, pa))) return true;
    var blob = ((pa && pa.stem) || "") + " " + ((task && task.stem) || "");
    if (/show that/i.test(blob) && pa && /show that/i.test(pa.stem || "")) return true;
    return false;
  }
  function partBlocked(task, pa) {
    return isInvalidMark(markingOf(task, pa)) || (!partManual(task, pa) && !exactOk(pa));
  }
  function partMachine(task, pa) {
    return !partManual(task, pa) && !partBlocked(task, pa);
  }
  function canAutoCorrect(task, parts) {
    if (!parts || !parts.length) return false;
    if (isInvalidMark(markingOf(task, null))) return false;
    if (isManualMark(markingOf(task, null))) return false;
    var i;
    for (i = 0; i < parts.length; i++) {
      if (!partMachine(task, parts[i])) return false;
    }
    return true;
  }
  function tickScore(steps) {
    var score = 0;
    (steps || []).forEach(function (s) {
      if (s._tick && s._tick.checked) score += markVal(s.mark);
    });
    return score;
  }
  function normPrompt(s) {
    return String(s || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\\\(|\\\)/g, "")
      .replace(/\\mathrm\{([^}]*)\}/g, "$1")
      .replace(/\\,/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  function partPromptCovered(stem, pt) {
    var stemN = normPrompt(stem);
    var body = normPrompt(pt && pt.stem).replace(/^(find|calculate|show that|determine|write down|work out)\s+/, "");
    if (body.length < 8) return false;
    return stemN.indexOf(body) !== -1;
  }
  function sourceLabel(task) {
    if (task.kind !== "pastpaper" || !task.source || !task.source.paper) return "";
    var raw = String(task.source.paper).trim();
    var m = raw.match(/^(\S+)\s+(Q\S.*)$/);
    if (!m) return "";
    return "Past paper " + m[1] + " · " + m[2];
  }
  function similarOf(id) {
    var m = String(id).match(/^(.*-PP-)0580-\d+-(.+)$/);
    return m ? m[1] + m[2] + "-similar" : "";
  }
  function jax(node) {
    if (root.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([node]).then(function () {
      if (root.msFitMath) root.msFitMath();
    });
  }
  var openedHash = null;
  function openedMap() {
    if (!openedHash) openedHash = readHashMap();
    return openedHash;
  }
  function mergedHash() {
    var map = {};
    var base = openedMap();
    Object.keys(base).forEach(function (id) { map[id] = base[id]; });
    Object.keys(states).forEach(function (id) {
      var st = states[id];
      if (!st) return;
      map[id] = { seed: st.seed, ctx: st.ctx || "default" };
    });
    return map;
  }
  function hashTail() {
    var map = mergedHash();
    var ids = Object.keys(map);
    if (!ids.length) return "";
    var bits = ids.map(function (id) {
      var st = map[id];
      return encodeURIComponent(id) + "." + String(st.seed) + "." + encodeURIComponent(st.ctx || "default");
    });
    return "&p=" + bits.join(",");
  }
  function readHashMap() {
    var raw = (location.hash || "").replace(/^#/, "");
    var parts = raw.split("&");
    var i;
    var map = {};
    for (i = 1; i < parts.length; i++) {
      if (parts[i].indexOf("p=") === 0) {
        parts[i].slice(2).split(",").forEach(function (bit) {
          var sp = bit.split(".");
          if (sp.length >= 3) {
            var ctxRaw = "";
            var seedRaw = "";
            var id = "";
            try {
              ctxRaw = decodeURIComponent(sp.pop());
              seedRaw = decodeURIComponent(sp.pop());
              id = decodeURIComponent(sp.join("."));
            } catch (e) {
              return;
            }
            if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,120}$/.test(id)) return;
            var ctx = /^[A-Za-z0-9_-]{1,64}$/.test(ctxRaw) ? ctxRaw : "default";
            var seed = seedRaw === "orig" ? "orig" : (/^\d{1,15}$/.test(seedRaw) ? Number(seedRaw) : 0);
            map[id] = { seed: seed, ctx: ctx };
          }
        });
      }
    }
    return map;
  }
  function writeHash() {
    var raw = (location.hash || "").replace(/^#/, "");
    var head = raw.split("&")[0] || "";
    if (!/practice$/.test(head)) return;
    history.replaceState(null, "", location.pathname + location.search + "#" + head + hashTail());
  }
  function paintCard(card, inst, base) {
    if (base.kind === "generated") seenSave(base.id, paramSig(inst));
    var task = inst.task;
    var env = inst.env;
    card.innerHTML = "";
    card.setAttribute("data-task", base.id);
    var head = el("div", "pc-head");
    head.appendChild(el("h4", "pc-title", task.title));
    head.appendChild(el("span", "pc-marks", "[" + task.marks + "]"));
    var lab = sourceLabel(base);
    if (lab) {
      var bits = lab.match(/^Past paper (\S+) · (Q[\s\S]*)$/);
      var badge = el("span", "pc-src src");
      badge.appendChild(document.createTextNode("Past paper "));
      var code = document.createElement("span");
      code.className = "pc-src-part";
      code.textContent = bits[1];
      badge.appendChild(code);
      badge.appendChild(document.createTextNode(" · "));
      var qn = document.createElement("span");
      qn.className = "pc-src-part";
      qn.textContent = bits[2];
      badge.appendChild(qn);
      head.appendChild(badge);
    }
    appendQpMsLinks(head, base);
    card.appendChild(head);
    var stem = el("div", "pc-stem");
    var stemRaw = render(task.stem, env, base.kind);
    if (task.kind === "pastpaper") {
      stemRaw = stemRaw.replace(/^This question is\s+[\s\S]+?(?:,|\.)\s*(?:taken from the official QP[^.]*\.\s*)?/i, "");
      stemRaw = stemRaw.replace(/^(?:\s)*(?:\(([a-z]|[ivxl]+)\)\s*)+/i, "");
      stemRaw = stemRaw.replace(/\s*\[\d+\](?:\s*\[\d+\])*/g, "");
      if (/\((ii|iii|iv|b|c|d)\)/i.test(stemRaw) && !/\(i\)/i.test(stemRaw) && !/\(a\)/i.test(stemRaw)) {
        stemRaw = stemRaw.replace(/(^|[\n>]|\s)\((?:ii|iii|iv|v|vi|b|c|d)\)\s+/gi, "$1");
      }
    }
    var stemHtml = DF.stemToHtml(stemRaw);
    stem.innerHTML = stemHtml;
    card.appendChild(stem);
    if (task.parts) {
      task.parts.forEach(function (pt) {
        if (partPromptCovered(stemRaw, pt)) return;
        if (!pt.stem) return;
        var ps = el("p", "pc-part-stem");
        ps.textContent = (pt.part ? pt.part + " " : "") + pt.stem;
        card.appendChild(ps);
      });
    }
    var tools = el("div", "pc-tools");
    var hasMachine = false;
    var hasManual = false;
    var hasBlocked = isInvalidMark(markingOf(task, null));
    inst.parts.forEach(function (pa) {
      if (partManual(task, pa)) hasManual = true;
      else if (partBlocked(task, pa) || hasBlocked) hasBlocked = true;
      else hasMachine = true;
    });
    var showPartFb = hasMachine && hasManual;
    inst.parts.forEach(function (pa, i) {
      var wrap = el("label", "pc-ans");
      var name = pa.part ? String(pa.part) : inst.parts.length > 1 ? String.fromCharCode(97 + i) : "Answer";
      wrap.appendChild(el("span", "", name));
      if (partManual(task, pa)) {
        wrap.appendChild(el("span", "pc-self", "Not machine-checked"));
      } else if (partBlocked(task, pa) || hasBlocked) {
        hasBlocked = true;
        wrap.appendChild(el("span", "pc-blocked", "Not checkable"));
      } else {
        var inp = document.createElement("input");
        inp.type = "text";
        inp.inputMode = "text";
        inp.setAttribute("aria-label", "Answer " + name);
        inp.autocomplete = "off";
        wrap.appendChild(inp);
        pa._input = inp;
        if (showPartFb) {
          var fb = el("span", "pc-part-fb");
          wrap.appendChild(fb);
          pa._fb = fb;
        } else pa._fb = null;
      }
      tools.appendChild(wrap);
    });
    if (!inst.parts.length) {
      if (isManualMark(markingOf(task, null))) hasManual = true;
      else {
        hasBlocked = true;
        tools.appendChild(el("span", "pc-blocked", "Not checkable"));
      }
    }
    var check = null;
    if (hasMachine) {
      check = el("button", "pc-btn qc-check", "Check");
      check.type = "button";
      tools.appendChild(check);
    }
    var msg = el("span", "qc-msg");
    if (hasManual && !hasMachine) {
      msg.textContent = "Self-marked (not machine-checked)";
      msg.className = "qc-msg self";
    }
    if (hasBlocked && !hasMachine) {
      msg.textContent = "Not checkable";
      msg.className = "qc-msg bad";
    }
    tools.appendChild(msg);
    card.appendChild(tools);
    card.setAttribute("data-marking", hasBlocked ? "blocked" : hasManual ? "manual" : "machine");
    var acts = el("div", "pc-acts");
    var show = el("button", "pc-btn show-sol", "Show solution");
    show.type = "button";
    acts.appendChild(show);
    if (base.kind === "generated") {
      var again = el("button", "pc-btn", "Another version");
      again.type = "button";
      again.addEventListener("click", function () {
        var picked = pickFresh(base, inst);
        if (!picked) return;
        if (picked.jump) {
          var cards = card.parentNode ? [].slice.call(card.parentNode.querySelectorAll(".practice-card")) : [];
          var others = cards.filter(function (n) { return n !== card; });
          if (!others.length) return;
          var dest = others[AA.randomSeed() % others.length];
          if (dest.focus) dest.focus();
          if (dest.scrollIntoView) dest.scrollIntoView({ block: "nearest" });
          return;
        }
        states[base.id] = { seed: picked.inst.seed, ctx: picked.inst.ctx };
        writeHash();
        paintCard(card, picked.inst, base);
        jax(card);
      });
      acts.appendChild(again);
    }
    if (base.kind === "pastpaper") {
      var sid = similarOf(base.id);
      if (byId[sid]) {
        var sim = el("button", "pc-btn", "Similar question");
        sim.type = "button";
        sim.addEventListener("click", function () {
          var t = document.querySelector('.practice-card[data-task="' + sid + '"]');
          if (t) {
            t.focus();
            t.scrollIntoView({ block: "nearest" });
          }
        });
        acts.appendChild(sim);
      }
    }
    card.appendChild(acts);
    var last = el("p", "pc-last");
    last.textContent = lastLine(base.id);
    card.appendChild(last);
    var sol = el("ol", "steps pc-sol");
    sol.hidden = true;
    var steps = allSteps(task);
    var revealed = 0;
    steps.forEach(function (s) {
      var li = el("li", "pc-step");
      li.hidden = true;
      var row = el("div", "pc-step-row");
      var tx = el("div", "pc-step-tex");
      tx.innerHTML = render(s.text_tex, env, base.kind);
      row.appendChild(tx);
      row.appendChild(el("span", "mark", s.mark));
      li.appendChild(row);
      if (studentNote(s.note)) li.appendChild(el("p", "pc-note", render(studentNote(s.note), env, base.kind)));
      var tick = el("label", "tick");
      var cb = document.createElement("input");
      cb.type = "checkbox";
      s._tick = cb;
      tick.appendChild(cb);
      tick.appendChild(document.createTextNode(" I got this"));
      li.appendChild(tick);
      sol.appendChild(li);
    });
    card.appendChild(sol);
    show.addEventListener("click", function () {
      if (revealed >= steps.length) {
        sol.hidden = true;
        revealed = 0;
        steps.forEach(function (s) {
          var li = s._tick && s._tick.closest("li");
          if (li) li.hidden = true;
        });
        show.textContent = "Show solution";
        return;
      }
      sol.hidden = false;
      var li = sol.children[revealed];
      if (li) li.hidden = false;
      revealed += 1;
      show.textContent = revealed >= steps.length ? "Hide solution" : "Next step";
      jax(sol);
    });
    function grade() {
      var total = task.marks;
      var auto = canAutoCorrect(task, inst.parts);
      inst.parts.forEach(function (pa) {
        if (!pa._fb || !pa._input) return;
        var ok = accept(pa._input.value, pa, pa._value);
        pa._fb.textContent = ok ? "Correct" : "Try again";
        pa._fb.className = "pc-part-fb " + (ok ? "ok" : "bad");
      });
      var okAll = false;
      if (auto) {
        okAll = inst.parts.every(function (pa) {
          return pa._input && accept(pa._input.value, pa, pa._value);
        });
      }
      var score;
      var kind;
      if (hasMachine && hasManual) {
        var mix = mixedTotals(task, inst.parts);
        kind = "mixed";
        score = mix.autoScore + mix.selfScore;
        saveScore(base.id, score, total, kind, mix);
        last.textContent = lastLine(base.id);
        msg.textContent = mixLine(mix);
        msg.className = "qc-msg self";
        return;
      }
      if (okAll) {
        score = total;
        kind = "machine";
      } else {
        score = tickScore(steps);
        kind = auto ? "machine" : "self";
      }
      saveScore(base.id, score, total, kind);
      last.textContent = lastLine(base.id);
      if (okAll) {
        msg.textContent = "Correct";
        msg.className = "qc-msg ok";
      } else if (kind === "self") {
        msg.textContent = "Self-marked " + score + "/" + total + " (not machine-checked)";
        msg.className = "qc-msg self";
      } else {
        msg.textContent = score + "/" + total;
        msg.className = "qc-msg bad";
      }
    }
    if (check) check.addEventListener("click", grade);
    inst.parts.forEach(function (pa) {
      if (!pa._input) return;
      pa._input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          grade();
        }
      });
    });
    steps.forEach(function (s) {
      if (s._tick) s._tick.addEventListener("change", grade);
    });
  }
  function mountPanel(panel, tasks) {
    panel.querySelectorAll(".practice-card").forEach(function (n) { n.remove(); });
    var soon = panel.querySelector(".soon");
    if (soon) soon.remove();
    var hash = openedMap();
    tasks.forEach(function (task) { byId[task.id] = task; });
    tasks.forEach(function (task) {
      var card = el("article", "practice-card");
      card.tabIndex = 0;
      var want = hash[task.id];
      var inst = null;
      if (task.kind === "pastpaper") {
        var env = {};
        runSteps(allSteps(task), env);
        var parts = answerParts(task);
        parts.forEach(function (pa) { pa._value = pyEval(pa.expression, env); });
        inst = { task: task, env: env, parts: parts, ctx: "default", seed: 0 };
      } else if (want) {
        inst = generate(task, want.seed, want.ctx);
      } else if (task.kind === "generated") {
        var tries = 0;
        while (!inst && tries < 30) {
          inst = generate(task, AA.randomSeed(), randCtx(task));
          tries++;
        }
      } else {
        inst = generate(task, 0, "default");
      }
      if (!inst) return;
      states[task.id] = { seed: inst.seed, ctx: inst.ctx };
      panel.appendChild(card);
      paintCard(card, inst, task);
    });
    writeHash();
    jax(panel);
  }
  function applyHash() {
    var map = readHashMap();
    Object.keys(byId).forEach(function (id) {
      var task = byId[id];
      if (task.kind !== "generated") return;
      var want = map[id];
      if (!want) return;
      var st = states[id] || {};
      if (String(st.seed) === String(want.seed) && String(st.ctx) === String(want.ctx)) return;
      var inst = generate(task, want.seed, want.ctx);
      if (!inst) return;
      states[id] = { seed: inst.seed, ctx: inst.ctx };
      var card = document.querySelector('.practice-card[data-task="' + id + '"]');
      if (card) {
        paintCard(card, inst, task);
        jax(card);
      }
    });
  }
  function mount(secEl, secId, url) {
    if (!url) return Promise.resolve();
    openedMap();
    hostSec = secEl;
    var panel = secEl.querySelector('[data-panel="practice"]') || secEl;
    return loadSiteConfig().then(function () {
      return fetch(url, { cache: "no-store" });
    }).then(function (r) {
      if (!r.ok) return;
      return r.json();
    }).then(function (list) {
      if (!list || !list.length) return;
      var secKey = String(secId).replace(/^[A-Za-z]+-/, "");
      var tasks = list.filter(function (t) { return t.section === secKey || t.section === secId; });
      if (!tasks.length) return;
      mountPanel(panel, tasks);
    }).catch(function () {});
  }
  var api = {
    mount: mount,
    hashTail: hashTail,
    applyHash: applyHash,
    generate: generate,
    pickFresh: pickFresh,
    mountPanel: mountPanel,
    fmt: fmt,
    parseNum: AA.parseNum,
    accept: AA.accept,
    roundSf: AA.roundSf,
    markingOf: markingOf,
    canAutoCorrect: canAutoCorrect,
    partMachine: partMachine,
    partManual: partManual,
    partBlocked: partBlocked,
    answerParts: answerParts,
    mixedTotals: mixedTotals,
    combinePartMarking: combinePartMarking,
    isUnsetMark: isUnsetMark,
    isInvalidMark: isInvalidMark,
    partPromptCovered: partPromptCovered,
    normPrompt: normPrompt,
    studentNote: studentNote,
    AUTHOR_NOTE_RE: AUTHOR_NOTE_RE,
    loadSiteConfig: loadSiteConfig
  };
  root.msPractice = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : global);
