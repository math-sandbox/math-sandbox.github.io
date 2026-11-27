(function (root) {
  var AA = typeof require === "function" ? require("./answer-accept.js") : root.msAnswerAccept;
  function money(n) {
    return Math.round(Number(n) * 100) / 100;
  }
  function commaInt(s) {
    return String(s).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  function bucks(n) {
    var v = money(n);
    var parts = Math.abs(v).toFixed(2).split(".");
    return (v < 0 ? "-$" : "$") + commaInt(parts[0]) + "." + parts[1];
  }
  function bucksAxis(n) {
    var v = money(n);
    if (Math.abs(v - Math.round(v)) < 0.005) {
      return (v < 0 ? "-$" : "$") + commaInt(Math.abs(Math.round(v)));
    }
    return bucks(n);
  }
  function weeklyPay(rate, normalH, ot15, ot2, commPct, sales, retainer) {
    var normal = Number(rate) * Number(normalH);
    var overtime15 = Number(rate) * 1.5 * Number(ot15);
    var overtime2 = Number(rate) * 2 * Number(ot2);
    var commission = Number(commPct) / 100 * Number(sales);
    var ret = Number(retainer) || 0;
    return {
      normal: money(normal),
      overtime15: money(overtime15),
      overtime2: money(overtime2),
      commission: money(commission),
      retainer: money(ret),
      total: money(normal + overtime15 + overtime2 + commission + ret)
    };
  }
  function simpleInterest(P, r, n) {
    return money(Number(P) * Number(r) * Number(n) / 100);
  }
  function compoundValue(P, r, n) {
    return money(Number(P) * Math.pow(1 + Number(r) / 100, Number(n)));
  }
  function interestRows(P, r, n) {
    var rows = [];
    var years = Math.max(0, Math.floor(Number(n) || 0));
    for (var y = 1; y <= years; y++) {
      rows.push({
        year: y,
        simple: money(Number(P) + Number(P) * Number(r) * y / 100),
        compound: money(Number(P) * Math.pow(1 + Number(r) / 100, y))
      });
    }
    return rows;
  }
  function percentChange(mode, value, pct) {
    var v = Number(value);
    var p = Number(pct);
    if (mode === "decrease") return money(v * (1 - p / 100));
    if (mode === "reverse") return money(v / (1 + p / 100));
    return money(v * (1 + p / 100));
  }
  function near(got, want, tol) {
    if (want == null || want === "") return false;
    var raw = typeof got === "string" ? String(got).replace(/\u2212/g, "-").trim() : "";
    var a = /^[+-]?\d+,\d+$/.test(raw) ? AA.parseNum(got) : Number(got);
    var b = Number(want);
    if (!isFinite(a) || !isFinite(b)) return false;
    return Math.abs(a - b) <= Number(tol);
  }
  function gradeNumeric(raw, spec, exact) {
    if (exact == null && spec) exact = spec.answer;
    if (AA.isOptIn(spec)) return AA.accept(raw, spec, exact);
    return near(raw, exact, spec && spec.tolerance);
  }
  function rowMarking(part) {
    if (!part) return "";
    if (part.marking === undefined || part.marking === "") return "";
    return part.marking;
  }
  function rowManual(part) {
    return rowMarking(part) === "manual";
  }
  function rowBlocked(part) {
    var m = rowMarking(part);
    if (m !== "" && m !== "manual") return true;
    if (rowManual(part)) return false;
    return part.answer == null || part.answer === "" || !isFinite(Number(part.answer));
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function html(tag, cls, inner) {
    var n = el(tag, cls);
    n.innerHTML = inner == null ? "" : String(inner);
    return n;
  }
  function svgNode(name, attrs) {
    var n = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }
  function jax(node) {
    if (typeof window !== "undefined" && window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise([node]);
    }
  }
  function numField(labelHtml, name, value, opts) {
    opts = opts || {};
    var wrap = el("label", "calc-field");
    wrap.appendChild(html("span", "", labelHtml));
    var input = document.createElement("input");
    input.type = "number";
    input.name = name;
    input.setAttribute("step", opts.step || "any");
    input.setAttribute("min", opts.min == null ? "0" : String(opts.min));
    if (opts.max != null) input.setAttribute("max", String(opts.max));
    input.value = String(value);
    wrap.appendChild(input);
    if (opts.range) {
      var s = document.createElement("input");
      s.type = "range";
      s.className = "calc-range";
      s.min = String(opts.min == null ? 0 : opts.min);
      s.max = String(opts.max == null ? 20 : opts.max);
      s.step = String(opts.step || "any");
      s.value = String(value);
      wrap.appendChild(s);
    }
    return wrap;
  }
  function readField(box, name, min, max, last, rewrite) {
    var inp = box.querySelector('[name="' + name + '"]');
    var raw = inp ? inp.value : "";
    var n = Number(raw);
    if (raw === "" || !isFinite(n)) return last;
    if (n < min) n = min;
    if (n > max) n = max;
    if (name === "n") n = Math.floor(n);
    if (rewrite && inp && inp.value !== String(n)) inp.value = String(n);
    var rng = inp && inp.parentElement.querySelector("input[type=range]");
    if (rng) rng.value = String(n);
    return n;
  }
  function bindCalc(box, run) {
    box.addEventListener("input", function (e) {
      var t = e.target;
      if (t && t.type === "range") {
        var num = t.parentElement.querySelector("input[type=number]");
        if (num) num.value = t.value;
        run(true);
        return;
      }
      if (t && t.type === "number") {
        var rng = t.parentElement.querySelector("input[type=range]");
        var n = Number(t.value);
        if (rng && t.value !== "" && isFinite(n)) rng.value = String(n);
      }
      run(false);
    });
    box.addEventListener("change", function () { run(true); });
    box.addEventListener("focusout", function () { run(true); });
  }
  function svgText(x, y, text, extra) {
    var t = svgNode("text", Object.assign({ x: String(x), y: String(y), "font-size": "18" }, extra || {}));
    t.textContent = text;
    return t;
  }
  function clearSvg(svg) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
  }
  function yTicks(lo, hi, count) {
    var span = Number(hi) - Number(lo);
    if (!isFinite(span) || span <= 0) span = 1;
    var n = count || 4;
    var raw = span / n;
    var mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var r = raw / mag;
    var step = r <= 1 ? mag : r <= 2 ? 2 * mag : r <= 5 ? 5 * mag : 10 * mag;
    var start = Math.ceil((Number(lo) - 1e-12) / step) * step;
    var end = Number(hi) + 1e-12;
    var out = [];
    var v;
    var k;
    for (k = 0; k < 40; k++) {
      v = Math.round((start + k * step) / step) * step;
      if (v > end) break;
      if (v >= Number(lo) - 1e-12) out.push(v);
    }
    if (!out.length) out.push(Number(lo), Number(hi));
    return out;
  }
  function field(label, attrs) {
    var wrap = el("label", "calc-field");
    wrap.appendChild(document.createTextNode(label));
    var input = document.createElement("input");
    input.type = attrs.type || "number";
    Object.keys(attrs).forEach(function (k) {
      if (k !== "type") input.setAttribute(k, attrs[k]);
    });
    wrap.appendChild(input);
    return wrap;
  }
  function val(node, name) {
    var inp = node.querySelector('[name="' + name + '"]');
    return inp ? inp.value : "";
  }
  function wirePay(host) {
    var box = el("div", "calc");
    box.innerHTML = "<h3>Weekly pay</h3>";
    var grid = el("div", "calc-grid");
    grid.appendChild(field("Hourly rate", { name: "rate", step: "any", min: "0", value: "14.40" }));
    grid.appendChild(field("Normal hours", { name: "normal", step: "any", min: "0", value: "38" }));
    grid.appendChild(field("Overtime hours at 1.5×", { name: "ot15", step: "any", min: "0", value: "0" }));
    grid.appendChild(field("Hours at 2×", { name: "ot2", step: "any", min: "0", value: "0" }));
    grid.appendChild(field("Commission %", { name: "cpct", step: "any", min: "0", value: "0" }));
    grid.appendChild(field("Sales", { name: "sales", step: "any", min: "0", value: "0" }));
    grid.appendChild(field("Retainer", { name: "ret", step: "any", min: "0", value: "0" }));
    box.appendChild(grid);
    var out = el("div", "calc-out");
    box.appendChild(out);
    function run() {
      var p = weeklyPay(val(box, "rate"), val(box, "normal"), val(box, "ot15"), val(box, "ot2"), val(box, "cpct"), val(box, "sales"), val(box, "ret"));
      out.innerHTML = "<table><tbody>" +
        "<tr><th>Normal</th><td>" + bucks(p.normal) + "</td></tr>" +
        "<tr><th>Overtime 1.5×</th><td>" + bucks(p.overtime15) + "</td></tr>" +
        "<tr><th>Overtime 2×</th><td>" + bucks(p.overtime2) + "</td></tr>" +
        "<tr><th>Commission</th><td>" + bucks(p.commission) + "</td></tr>" +
        "<tr><th>Retainer</th><td>" + bucks(p.retainer) + "</td></tr>" +
        "<tr><th>Total</th><td>" + bucks(p.total) + "</td></tr>" +
        "</tbody></table>";
    }
    box.addEventListener("input", run);
    run();
    host.appendChild(box);
  }
  function wireHpBar(host, d) {
    var box = el("div", "calc viz");
    box.appendChild(html("h3", "", d.caption));
    var grid = el("div", "calc-grid");
    grid.appendChild(numField(d.labels.principal, "P", d.defaults.P, { min: 0, step: "any" }));
    grid.appendChild(numField("r", "r", d.defaults.r, { min: 0, max: 20, step: "0.1", range: true }));
    grid.appendChild(numField(d.labels.x_axis, "n", d.defaults.n, { min: 1, max: 20, step: "1", range: true }));
    box.appendChild(grid);
    var read = el("div", "viz-read");
    box.appendChild(read);
    var leg = el("div", "viz-leg");
    leg.appendChild(html("span", "", "<i style=\"background:#2563eb\"></i>" + d.labels.principal));
    leg.appendChild(html("span", "", "<i style=\"background:#16a34a\"></i>" + d.labels.interest));
    box.appendChild(leg);
    var svg = svgNode("svg", { viewBox: "0 0 360 240", class: "viz-chart", role: "img", "aria-label": d.caption });
    box.appendChild(svg);
    box.appendChild(html("p", "", d.labels.x_axis));
    box.appendChild(html("p", "", d.labels.y_axis));
    d.explanation.forEach(function (line) { box.appendChild(html("p", "", line)); });
    var lastP = d.defaults.P;
    var lastR = d.defaults.r;
    var lastN = d.defaults.n;
    function run(rewrite) {
      var P = lastP = readField(box, "P", 0, 1e9, lastP, rewrite);
      var r = lastR = readField(box, "r", 0, 20, lastR, rewrite);
      var n = lastN = readField(box, "n", 1, 20, lastN, rewrite);
      var per = money(P * r / 100);
      var I = simpleInterest(P, r, n);
      var amt = money(P + I);
      read.innerHTML = "";
      [
        [d.labels.principal, bucks(P)],
        [d.labels.per_year, bucks(per)],
        [d.labels.interest, bucks(I)],
        [d.labels.total, bucks(amt)]
      ].forEach(function (pair) {
        read.appendChild(html("span", "", pair[0] + " " + pair[1]));
      });
      clearSvg(svg);
      var maxV = Math.max(amt, P, 1);
      var left = 96;
      var right = 352;
      var top = 16;
      var bot = 188;
      var gap = 6;
      var bw = Math.max(8, (right - left - gap * n) / n);
      function y(v) { return bot - (bot - top) * v / maxV; }
      svg.appendChild(svgNode("line", { x1: left, y1: top, x2: left, y2: bot, stroke: "#94a3b8", "stroke-width": "1" }));
      svg.appendChild(svgNode("line", { x1: left, y1: bot, x2: right, y2: bot, stroke: "#94a3b8", "stroke-width": "1" }));
      yTicks(0, maxV, 4).forEach(function (v) {
        svg.appendChild(svgNode("line", { x1: left - 4, y1: y(v), x2: left, y2: y(v), stroke: "#94a3b8", "stroke-width": "1" }));
        svg.appendChild(svgText(left - 8, y(v) + 5, bucksAxis(v), { "text-anchor": "end" }));
      });
      var yr;
      for (yr = 1; yr <= n; yr++) {
        var x = left + (yr - 1) * (bw + gap);
        var simple = P + P * r * yr / 100;
        var yP = y(P);
        var yS = y(simple);
        svg.appendChild(svgNode("rect", { x: x, y: yP, width: bw, height: Math.max(0, bot - yP), fill: "#2563eb" }));
        svg.appendChild(svgNode("rect", { x: x, y: yS, width: bw, height: Math.max(0, yP - yS), fill: "#16a34a" }));
        svg.appendChild(svgText(x + bw / 2, bot + 18, String(yr), { "text-anchor": "middle" }));
      }
      jax(box);
    }
    bindCalc(box, run);
    run(true);
    host.appendChild(box);
  }
  function wireLadder(host, d) {
    var box = el("div", "calc viz");
    box.appendChild(html("h3", "", d.caption));
    var grid = el("div", "calc-grid");
    grid.appendChild(numField("P", "P", d.defaults.P, { min: 0, step: "any" }));
    grid.appendChild(numField("r", "r", d.defaults.r, { min: 0, max: 20, step: "0.1", range: true }));
    grid.appendChild(numField(d.columns[0], "n", d.defaults.n, { min: 1, max: 20, step: "1", range: true }));
    box.appendChild(grid);
    var table = el("div", "calc-out viz-ladder");
    box.appendChild(table);
    var leg = el("div", "viz-leg");
    leg.appendChild(html("span", "", "<i style=\"background:#2563eb\"></i>" + d.columns[1]));
    leg.appendChild(html("span", "", "<i style=\"background:#16a34a\"></i>" + d.columns[2]));
    box.appendChild(leg);
    var svg = svgNode("svg", { viewBox: "0 0 360 250", class: "viz-chart", role: "img", "aria-label": d.caption });
    box.appendChild(svg);
    box.appendChild(html("p", "", d.columns[0]));
    d.explanation.forEach(function (line) { box.appendChild(html("p", "", line)); });
    var lastP = d.defaults.P;
    var lastR = d.defaults.r;
    var lastN = d.defaults.n;
    function run(rewrite) {
      var P = lastP = readField(box, "P", 0, 1e9, lastP, rewrite);
      var r = lastR = readField(box, "r", 0, 20, lastR, rewrite);
      var n = lastN = readField(box, "n", 1, 20, lastN, rewrite);
      var built = interestRows(P, r, n);
      var rows = [{ year: 0, simple: money(P), compound: money(P) }].concat(built).map(function (row) {
        return { year: row.year, simple: row.simple, compound: row.compound, difference: money(row.compound - row.simple) };
      });
      var head = "<table><thead><tr>" + d.columns.map(function (c) { return "<th>" + c + "</th>"; }).join("") + "</tr></thead><tbody>";
      rows.forEach(function (row) {
        head += "<tr><td>" + row.year + "</td><td>" + bucks(row.simple) + "</td><td>" + bucks(row.compound) + "</td><td>" + bucks(row.difference) + "</td></tr>";
      });
      table.innerHTML = head + "</tbody></table>";
      clearSvg(svg);
      var vals = rows.reduce(function (acc, row) { return acc.concat([row.simple, row.compound]); }, []);
      var lo = Math.min.apply(null, vals);
      var hi = Math.max.apply(null, vals);
      var span = hi - lo || 1;
      var left = 96;
      var right = 352;
      var top = 16;
      var bot = 188;
      function x(i) { return left + (right - left) * i / n; }
      function yy(v) { return bot - (bot - top) * (v - lo) / span; }
      function path(key) {
        var dth = "M " + x(0) + " " + yy(rows[0][key]);
        rows.forEach(function (row) { dth += " L " + x(row.year) + " " + yy(row[key]); });
        return dth;
      }
      svg.appendChild(svgNode("line", { x1: left, y1: top, x2: left, y2: bot, stroke: "#94a3b8", "stroke-width": "1" }));
      svg.appendChild(svgNode("line", { x1: left, y1: bot, x2: right, y2: bot, stroke: "#94a3b8", "stroke-width": "1" }));
      yTicks(lo, hi, 4).forEach(function (v) {
        svg.appendChild(svgNode("line", { x1: left - 4, y1: yy(v), x2: left, y2: yy(v), stroke: "#94a3b8", "stroke-width": "1" }));
        svg.appendChild(svgText(left - 8, yy(v) + 5, bucksAxis(v), { "text-anchor": "end" }));
      });
      var step = n > 10 ? 2 : 1;
      var i;
      for (i = 0; i <= n; i += step) {
        svg.appendChild(svgText(x(i), bot + 20, String(i), { "text-anchor": "middle" }));
      }
      svg.appendChild(svgNode("path", { d: path("simple"), fill: "none", stroke: "#2563eb", "stroke-width": "1.8" }));
      svg.appendChild(svgNode("path", { d: path("compound"), fill: "none", stroke: "#16a34a", "stroke-width": "1.8" }));
      jax(box);
    }
    bindCalc(box, run);
    run(true);
    host.appendChild(box);
  }
  function wireDeprec(host, d) {
    var box = el("div", "calc viz");
    box.appendChild(html("h3", "", d.caption));
    box.appendChild(html("p", "", d.formula));
    var svg = svgNode("svg", { viewBox: "0 0 360 250", class: "viz-chart", role: "img", "aria-label": d.caption });
    var left = 96;
    var right = 352;
    var top = 20;
    var bot = 188;
    var nMax = d.defaults.n_max;
    var vMax = d.defaults.a;
    function x(n) { return left + (right - left) * n / nMax; }
    function yy(v) { return bot - (bot - top) * v / vMax; }
    svg.appendChild(svgNode("line", { x1: left, y1: top, x2: left, y2: bot, stroke: "#94a3b8", "stroke-width": "1" }));
    svg.appendChild(svgNode("line", { x1: left, y1: bot, x2: right, y2: bot, stroke: "#94a3b8", "stroke-width": "1" }));
    yTicks(0, vMax, 4).forEach(function (v) {
      svg.appendChild(svgNode("line", { x1: left - 4, y1: yy(v), x2: left, y2: yy(v), stroke: "#94a3b8", "stroke-width": "1" }));
      svg.appendChild(svgText(left - 8, yy(v) + 5, bucksAxis(v), { "text-anchor": "end" }));
    });
    var k;
    for (k = 0; k <= nMax; k += 2) {
      svg.appendChild(svgText(x(k), bot + 20, String(k), { "text-anchor": "middle" }));
    }
    var pts = d.points.map(function (p) { return x(p.n) + "," + yy(p.V); }).join(" ");
    svg.appendChild(svgNode("polyline", { points: pts, fill: "none", stroke: "#2563eb", "stroke-width": "1.8" }));
    svg.appendChild(svgNode("line", { x1: left, y1: yy(d.threshold.value), x2: right, y2: yy(d.threshold.value), stroke: "#dc2626", "stroke-width": "1", "stroke-dasharray": "4 3" }));
    svg.appendChild(svgText(right, yy(d.threshold.value) - 6, d.threshold.label, { "text-anchor": "end", fill: "#dc2626" }));
    svg.appendChild(svgNode("circle", { cx: x(d.highlight.n), cy: yy(d.highlight.V), r: "5", fill: "#dc2626" }));
    box.appendChild(svg);
    var leg = el("div", "viz-leg");
    leg.appendChild(html("span", "", "<i style=\"background:#2563eb\"></i>" + d.formula));
    leg.appendChild(html("span", "", "<i style=\"background:#dc2626\"></i>" + d.threshold.label));
    box.appendChild(leg);
    box.appendChild(html("p", "", d.axis_labels.x));
    box.appendChild(html("p", "", d.axis_labels.y));
    box.appendChild(html("p", "", d.highlight.label));
    d.explanation.forEach(function (line) { box.appendChild(html("p", "", line)); });
    var qc = el("div", "viz-qc");
    qc.appendChild(html("p", "", d.quick_check.question));
    var det = document.createElement("details");
    var sum = document.createElement("summary");
    sum.textContent = "Show solution";
    det.appendChild(sum);
    var sol = el("div", "reveal on");
    d.quick_check.solution.forEach(function (line) { sol.appendChild(html("p", "", line)); });
    det.appendChild(sol);
    qc.appendChild(det);
    box.appendChild(qc);
    host.appendChild(box);
  }
  function wireFlow(host, d) {
    var box = el("div", "calc viz");
    box.appendChild(html("h3", "", d.caption));
    var flow = el("div", "viz-flow");
    flow.setAttribute("role", "group");
    flow.setAttribute("aria-label", d.caption);
    var byId = {};
    d.nodes.forEach(function (node) { byId[node.id] = node; });
    d.nodes.forEach(function (node) {
      var card = el("div", "viz-node " + node.kind);
      card.id = "viz172-" + node.id;
      card.tabIndex = 0;
      card.appendChild(html("div", "viz-node-lab", node.label));
      var outs = d.edges.filter(function (e) { return e.from === node.id; });
      if (outs.length) {
        var row = el("div", "viz-edges");
        outs.forEach(function (e) {
          var b = document.createElement("button");
          b.type = "button";
          if (e.label) b.innerHTML = e.label;
          var dest = byId[e.to];
          if (dest) b.setAttribute("aria-label", dest.label);
          b.addEventListener("click", function () {
            var t = document.getElementById("viz172-" + e.to);
            if (t) t.focus();
          });
          row.appendChild(b);
        });
        card.appendChild(row);
      }
      flow.appendChild(card);
    });
    box.appendChild(flow);
    host.appendChild(box);
  }
  function wireMistakes(host, items) {
    var box = el("div", "calc viz");
    items.forEach(function (item) {
      var det = el("details", "viz-miss");
      var sum = document.createElement("summary");
      sum.innerHTML = item.mistake;
      det.appendChild(sum);
      det.appendChild(html("p", "", item.why));
      det.appendChild(html("p", "", item.correct));
      box.appendChild(det);
    });
    host.appendChild(box);
  }
  function fmtN(n) {
    var v = Number(n);
    if (!isFinite(v)) return "—";
    var a = Math.abs(v);
    var s;
    if (a === 0) s = "0";
    else if (Math.abs(v - Math.round(v)) < 1e-9) s = String(Math.round(Math.abs(v)));
    else s = String(+(Math.abs(v).toFixed(a >= 10 ? 1 : 2)));
    return (v < 0 ? "\u2212" : "") + s;
  }
  function lerpPair(a, b, x, yk) {
    var span = b.x - a.x;
    var t = Math.abs(span) < 1e-12 ? 0 : (x - a.x) / span;
    return a[yk] + t * (b[yk] - a[yk]);
  }
  function samplePts(pts, x, yk) {
    yk = yk || "y";
    if (!pts || !pts.length) return null;
    if (x <= pts[0].x) return pts[0][yk];
    var i;
    for (i = 0; i < pts.length - 1; i++) {
      if (x <= pts[i + 1].x) return lerpPair(pts[i], pts[i + 1], x, yk);
    }
    return pts[pts.length - 1][yk];
  }
  function padRange(lo, hi) {
    var span = hi - lo || 1;
    return [lo - span * 0.08, hi + span * 0.08];
  }
  function chartMap(xMin, xMax, yMin, yMax) {
    var left = 56;
    var right = 352;
    var top = 16;
    var bot = 188;
    return {
      left: left,
      right: right,
      top: top,
      bot: bot,
      x: function (v) { return left + (right - left) * (v - xMin) / (xMax - xMin || 1); },
      y: function (v) { return bot - (bot - top) * (v - yMin) / (yMax - yMin || 1); }
    };
  }
  function drawAxes(svg, map, xMin, xMax, yMin, yMax) {
    svg.appendChild(svgNode("line", { x1: map.left, y1: map.top, x2: map.left, y2: map.bot, stroke: "#94a3b8", "stroke-width": "1" }));
    svg.appendChild(svgNode("line", { x1: map.left, y1: map.bot, x2: map.right, y2: map.bot, stroke: "#94a3b8", "stroke-width": "1" }));
    yTicks(yMin, yMax, 4).forEach(function (v) {
      svg.appendChild(svgNode("line", { x1: map.left - 4, y1: map.y(v), x2: map.left, y2: map.y(v), stroke: "#94a3b8", "stroke-width": "1" }));
      svg.appendChild(svgText(map.left - 6, map.y(v) + 5, fmtN(v), { "text-anchor": "end", "font-size": "14" }));
    });
    yTicks(xMin, xMax, 4).forEach(function (v) {
      svg.appendChild(svgText(map.x(v), map.bot + 18, fmtN(v), { "text-anchor": "middle", "font-size": "14" }));
    });
  }
  function polyPath(pts, map, yk) {
    yk = yk || "y";
    var dth = "";
    pts.forEach(function (p, i) {
      dth += (i ? " L " : "M ") + map.x(p.x) + " " + map.y(p[yk]);
    });
    return dth;
  }
  function clipTangent(map, x0, y0, m) {
    var x1 = x0 - 2;
    var x2 = x0 + 2;
    if (!isFinite(m) || Math.abs(m) > 1e6) {
      return { x1: map.x(x0), y1: map.top, x2: map.x(x0), y2: map.bot };
    }
    return {
      x1: map.x(x1),
      y1: map.y(y0 + m * (x1 - x0)),
      x2: map.x(x2),
      y2: map.y(y0 + m * (x2 - x0))
    };
  }
  function wireVizQc(box, qc) {
    if (!qc) return;
    var wrap = el("div", "viz-qc");
    wrap.appendChild(html("p", "", qc.question));
    var det = document.createElement("details");
    var sum = document.createElement("summary");
    sum.textContent = "Show solution";
    det.appendChild(sum);
    var sol = el("div", "reveal on");
    if (qc.working) sol.appendChild(html("p", "", qc.working));
    if (qc.answer != null) sol.appendChild(html("p", "", String(qc.answer)));
    det.appendChild(sol);
    wrap.appendChild(det);
    box.appendChild(wrap);
  }
  function wireExpl(box, d) {
    if (d.formula) box.appendChild(html("p", "", d.formula));
    if (d.derivative) box.appendChild(html("p", "", d.derivative));
    (d.explanation || []).forEach(function (line) { box.appendChild(html("p", "", line)); });
    if (d.axis_labels) {
      if (d.axis_labels.x) box.appendChild(html("p", "", d.axis_labels.x));
      if (d.axis_labels.y) box.appendChild(html("p", "", d.axis_labels.y));
    }
    wireVizQc(box, d.quick_check);
  }
  function wireTangentExplorer(host, d) {
    var box = el("div", "calc viz");
    box.appendChild(html("h3", "", d.caption));
    var def = d.defaults || {};
    var grid = el("div", "calc-grid");
    grid.appendChild(numField("\\(x\\)", "x", def.x0, { min: def.x_min, max: def.x_max, step: def.slider_step || "any", range: true }));
    box.appendChild(grid);
    var read = el("div", "viz-read");
    box.appendChild(read);
    var svg = svgNode("svg", { viewBox: "0 0 360 240", class: "viz-chart", role: "img", "aria-label": d.caption });
    box.appendChild(svg);
    var pts = d.points || [];
    var ys = pts.map(function (p) { return p.y; });
    var yR = padRange(Math.min.apply(null, ys), Math.max.apply(null, ys));
    var lastX = def.x0;
    function run(rewrite) {
      var x = lastX = readField(box, "x", def.x_min, def.x_max, lastX, rewrite);
      var y = samplePts(pts, x, "y");
      var g = samplePts(d.tangent_table, x, "gradient");
      read.innerHTML = "";
      read.appendChild(html("span", "", "\\(x=" + fmtN(x) + "\\)"));
      read.appendChild(html("span", "", "\\(y=" + fmtN(y) + "\\)"));
      read.appendChild(html("span", "", "gradient " + fmtN(g)));
      clearSvg(svg);
      var map = chartMap(def.x_min, def.x_max, yR[0], yR[1]);
      drawAxes(svg, map, def.x_min, def.x_max, yR[0], yR[1]);
      svg.appendChild(svgNode("path", { d: polyPath(pts, map, "y"), fill: "none", stroke: "#2563eb", "stroke-width": "1.8" }));
      var tg = clipTangent(map, x, y, g);
      svg.appendChild(svgNode("line", { x1: tg.x1, y1: tg.y1, x2: tg.x2, y2: tg.y2, stroke: "#dc2626", "stroke-width": "1.6" }));
      svg.appendChild(svgNode("circle", { cx: map.x(x), cy: map.y(y), r: "5", fill: "#dc2626" }));
      (d.stationary || []).forEach(function (p) {
        svg.appendChild(svgNode("circle", { cx: map.x(p.x), cy: map.y(p.y), r: "4", fill: "#16a34a" }));
      });
      jax(box);
    }
    bindCalc(box, run);
    if (d.tangent_table && d.tangent_table.length) {
      var table = el("div", "calc-out viz-table");
      var head = "<table><thead><tr><th>\\(x\\)</th><th>\\(y\\)</th><th>gradient</th></tr></thead><tbody>";
      d.tangent_table.forEach(function (row) {
        head += "<tr><td>" + fmtN(row.x) + "</td><td>" + fmtN(row.y) + "</td><td>" + fmtN(row.gradient) + "</td></tr>";
      });
      table.innerHTML = head + "</tbody></table>";
      box.appendChild(table);
    }
    wireExpl(box, d);
    run(true);
    host.appendChild(box);
  }
  function wireFnDeriv(host, d) {
    var box = el("div", "calc viz");
    box.appendChild(html("h3", "", d.caption));
    var def = d.defaults || {};
    var grid = el("div", "calc-grid");
    grid.appendChild(numField("\\(x\\)", "x", def.x0, { min: def.x_min, max: def.x_max, step: def.slider_step || "any", range: true }));
    box.appendChild(grid);
    var read = el("div", "viz-read");
    box.appendChild(read);
    var svg = svgNode("svg", { viewBox: "0 0 360 240", class: "viz-chart", role: "img", "aria-label": d.caption });
    box.appendChild(svg);
    var pts = d.points || [];
    var ys = pts.map(function (p) { return p.y; });
    if (def.show_derivative_curve) ys = ys.concat(pts.map(function (p) { return p.gradient; }));
    var yR = padRange(Math.min.apply(null, ys), Math.max.apply(null, ys));
    var lastX = def.x0;
    function run(rewrite) {
      var x = lastX = readField(box, "x", def.x_min, def.x_max, lastX, rewrite);
      var y = samplePts(pts, x, "y");
      var g = samplePts(pts, x, "gradient");
      read.innerHTML = "";
      read.appendChild(html("span", "", "\\(x=" + fmtN(x) + "\\)"));
      read.appendChild(html("span", "", "\\(y=" + fmtN(y) + "\\)"));
      read.appendChild(html("span", "", "gradient " + fmtN(g)));
      clearSvg(svg);
      var map = chartMap(def.x_min, def.x_max, yR[0], yR[1]);
      drawAxes(svg, map, def.x_min, def.x_max, yR[0], yR[1]);
      svg.appendChild(svgNode("path", { d: polyPath(pts, map, "y"), fill: "none", stroke: "#2563eb", "stroke-width": "1.8" }));
      if (def.show_derivative_curve) {
        svg.appendChild(svgNode("path", { d: polyPath(pts.map(function (p) { return { x: p.x, y: p.gradient }; }), map, "y"), fill: "none", stroke: "#16a34a", "stroke-width": "1.6", "stroke-dasharray": "4 3" }));
      }
      svg.appendChild(svgNode("circle", { cx: map.x(x), cy: map.y(y), r: "5", fill: "#dc2626" }));
      jax(box);
    }
    bindCalc(box, run);
    if (d.difference_quotient && d.difference_quotient.length) {
      var dq = el("div", "calc-out viz-table");
      var htm = "<table><thead><tr><th>\\(h\\)</th><th>value</th></tr></thead><tbody>";
      d.difference_quotient.forEach(function (row) {
        htm += "<tr><td>" + fmtN(row.h) + "</td><td>" + fmtN(row.value) + "</td></tr>";
      });
      dq.innerHTML = htm + "</tbody></table>";
      box.appendChild(dq);
    }
    (d.compare || []).forEach(function (c) {
      var pan = el("div", "viz-leg");
      pan.appendChild(html("span", "", c.formula || ""));
      pan.appendChild(html("span", "", c.derivative || ""));
      box.appendChild(pan);
    });
    wireExpl(box, d);
    run(true);
    host.appendChild(box);
  }
  function wireImplicit(host, d) {
    var box = el("div", "calc viz");
    box.appendChild(html("h3", "", d.caption));
    var snaps = d.snap_points || [];
    var start = 0;
    var defP = (d.defaults && d.defaults.point) || snaps[0] || { x: 0, y: 0 };
    snaps.forEach(function (p, i) {
      if (Math.abs(p.x - defP.x) < 1e-6 && Math.abs(p.y - defP.y) < 1e-6) start = i;
    });
    var grid = el("div", "calc-grid");
    grid.appendChild(numField("point", "i", start, { min: 0, max: Math.max(0, snaps.length - 1), step: "1", range: true }));
    box.appendChild(grid);
    var read = el("div", "viz-read");
    box.appendChild(read);
    var svg = svgNode("svg", { viewBox: "0 0 360 240", class: "viz-chart", role: "img", "aria-label": d.caption });
    box.appendChild(svg);
    var br = d.points || [];
    var xs = br.map(function (p) { return p.x; });
    var ys = [];
    br.forEach(function (p) { ys.push(p.y_upper, p.y_lower); });
    var xR = padRange(Math.min.apply(null, xs), Math.max.apply(null, xs));
    var yR = padRange(Math.min.apply(null, ys), Math.max.apply(null, ys));
    var lastI = start;
    function run(rewrite) {
      var i = lastI = Math.round(readField(box, "i", 0, Math.max(0, snaps.length - 1), lastI, rewrite));
      var p = snaps[i] || defP;
      read.innerHTML = "";
      read.appendChild(html("span", "", "\\((" + fmtN(p.x) + "," + fmtN(p.y) + ")\\)"));
      read.appendChild(html("span", "", "gradient " + fmtN(p.gradient)));
      clearSvg(svg);
      var map = chartMap(xR[0], xR[1], yR[0], yR[1]);
      drawAxes(svg, map, xR[0], xR[1], yR[0], yR[1]);
      svg.appendChild(svgNode("path", { d: polyPath(br.map(function (q) { return { x: q.x, y: q.y_upper }; }), map, "y"), fill: "none", stroke: "#2563eb", "stroke-width": "1.8" }));
      svg.appendChild(svgNode("path", { d: polyPath(br.map(function (q) { return { x: q.x, y: q.y_lower }; }), map, "y"), fill: "none", stroke: "#2563eb", "stroke-width": "1.8" }));
      (d.vertical_tangents || []).forEach(function (vt) {
        svg.appendChild(svgNode("line", { x1: map.x(vt.x), y1: map.top, x2: map.x(vt.x), y2: map.bot, stroke: "#ca8a04", "stroke-width": "1.2", "stroke-dasharray": "4 3" }));
      });
      var tg = clipTangent(map, p.x, p.y, p.gradient);
      svg.appendChild(svgNode("line", { x1: tg.x1, y1: tg.y1, x2: tg.x2, y2: tg.y2, stroke: "#dc2626", "stroke-width": "1.6" }));
      svg.appendChild(svgNode("circle", { cx: map.x(p.x), cy: map.y(p.y), r: "5", fill: "#dc2626" }));
      jax(box);
    }
    bindCalc(box, run);
    wireExpl(box, d);
    run(true);
    host.appendChild(box);
  }
  function vizUrls(secId) {
    var id = String(secId || "");
    if (id.indexOf("IGCSE-") === 0) {
      return ["data/viz-" + id.replace(/^IGCSE-/, "").replace(/\./g, "-") + ".json"];
    }
    return ["data/viz-" + id.replace(/\./g, "-") + ".json"];
  }
  function loadViz(secId) {
    var urls = vizUrls(secId);
    function next(i) {
      if (i >= urls.length) return Promise.resolve(null);
      return fetch(urls[i], { cache: "no-store" }).then(function (r) {
        if (!r.ok) return next(i + 1);
        return r.json();
      }).catch(function () { return next(i + 1); });
    }
    return next(0);
  }
  function dispatchViz(host, data) {
    if (!data) return;
    var widgets = {
      hp_bar: wireHpBar,
      compound_ladder: wireLadder,
      depreciation_curve: wireDeprec,
      decision_flowchart: wireFlow,
      tangent_explorer: wireTangentExplorer,
      function_and_derivative: wireFnDeriv,
      implicit_tangent: wireImplicit
    };
    Object.keys(data).forEach(function (k) {
      if (k === "section" || k === "source") return;
      var block = data[k];
      if (k === "common_mistakes") {
        wireMistakes(host, block);
        return;
      }
      if (!block || typeof block !== "object" || Array.isArray(block)) return;
      var w = block.widget || k;
      if (widgets[w]) widgets[w](host, block);
    });
  }
  function wirePercent(host) {
    var box = el("div", "calc");
    box.innerHTML = "<h3>Percentage change</h3>";
    var modes = el("div", "calc-modes");
    ["Increase", "Decrease", "Reverse"].forEach(function (name) {
      var b = el("button", "calc-mode" + (name === "Increase" ? " on" : ""), name);
      b.type = "button";
      b.setAttribute("data-mode", name.toLowerCase());
      modes.appendChild(b);
    });
    box.appendChild(modes);
    var grid = el("div", "calc-grid");
    var price = field("Original price", { name: "price", step: "any", min: "0", value: "84" });
    grid.appendChild(price);
    grid.appendChild(field("Percent", { name: "pct", step: "any", value: "20" }));
    box.appendChild(grid);
    var out = el("p", "calc-out");
    box.appendChild(out);
    var mode = "increase";
    function setMode(next) {
      mode = next;
      modes.querySelectorAll("button").forEach(function (b) {
        b.classList.toggle("on", b.getAttribute("data-mode") === mode);
      });
      price.firstChild.textContent = mode === "reverse" ? "Final price" : "Original price";
      run();
    }
    modes.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (b) setMode(b.getAttribute("data-mode"));
    });
    function run() {
      var result = percentChange(mode, val(box, "price"), val(box, "pct"));
      out.textContent = "Result: " + bucks(result);
    }
    box.addEventListener("input", run);
    run();
    host.appendChild(box);
  }
  function addCalc(host, secId) {
    if (secId === "IGCSE-17.1") {
      wirePay(host);
      return Promise.resolve();
    }
    if (secId === "IGCSE-17.3") {
      wirePercent(host);
      return Promise.resolve();
    }
    return loadViz(secId).then(function (data) {
      if (!data) return;
      dispatchViz(host, data);
    }).catch(function () {
      host.appendChild(el("p", "calc viz-fail", "Could not load the diagrams."));
    });
  }
  function wireChecks(host, secId, answers) {
    host.querySelectorAll(".quick-check").forEach(function (box) {
      if (box.querySelector(".qc-tools")) return;
      var title = (box.querySelector("h4") || {}).textContent || "";
      var n = (title.match(/(\d+)/) || [])[1];
      if (!n) return;
      var prefix = "QC" + n;
      var parts = answers.filter(function (a) {
        if (a.section !== secId) return false;
        if (a.q === prefix) return true;
        return a.q.indexOf(prefix) === 0 && /[a-z]$/i.test(a.q);
      });
      if (!parts.length) return;
      var q = box.querySelector("p");
      if (!q) return;
      var tools = el("span", "qc-tools");
      var machine = [];
      var blocked = false;
      var manual = false;
      parts.forEach(function (part) {
        if (rowManual(part)) manual = true;
        else if (rowBlocked(part)) blocked = true;
        else machine.push(part);
      });
      if (blocked && !machine.length) {
        var bmsg = el("span", "qc-msg bad");
        bmsg.textContent = "Not checkable";
        tools.appendChild(bmsg);
        q.appendChild(tools);
        box.setAttribute("data-qc", "blocked");
        return;
      }
      if (manual && !machine.length) {
        var smsg = el("span", "qc-msg self");
        smsg.textContent = "Self-marked (not machine-checked)";
        tools.appendChild(smsg);
        q.appendChild(tools);
        box.setAttribute("data-qc", "manual");
        return;
      }
      var showPartFb = manual && machine.length > 0;
      var partFb = {};
      machine.forEach(function (part) {
        var lab = /[a-z]$/i.test(part.q) && part.q !== prefix ? part.q.slice(-1) : "";
        var wrap = el("label", "qc-part");
        if (lab) wrap.appendChild(document.createTextNode(lab + " "));
        var inp = document.createElement("input");
        inp.type = "text";
        inp.inputMode = "text";
        inp.setAttribute("data-q", part.q);
        wrap.appendChild(inp);
        if (showPartFb) {
          var fb = el("span", "qc-part-fb");
          wrap.appendChild(fb);
          partFb[part.q] = fb;
        }
        tools.appendChild(wrap);
      });
      if (manual) {
        var mlab = el("span", "qc-self");
        mlab.textContent = "Not machine-checked";
        tools.appendChild(mlab);
      }
      var btn = el("button", "qc-check", "Check");
      btn.type = "button";
      var msg = el("span", "qc-msg");
      tools.appendChild(btn);
      tools.appendChild(msg);
      q.appendChild(tools);
      box.setAttribute("data-qc", manual ? "mixed" : "machine");
      btn.addEventListener("click", function () {
        machine.forEach(function (part) {
          var inp = tools.querySelector('[data-q="' + part.q + '"]');
          var okp = inp && gradeNumeric(inp.value, part, part.answer);
          var fb = partFb[part.q];
          if (fb) {
            fb.textContent = okp ? "Correct" : "Try again";
            fb.className = "qc-part-fb " + (okp ? "ok" : "bad");
          }
        });
        if (manual || blocked) {
          msg.textContent = "Self-marked (not machine-checked)";
          msg.className = "qc-msg self";
          return;
        }
        if (!machine.length) {
          msg.textContent = "Not checkable";
          msg.className = "qc-msg bad";
          return;
        }
        var ok = machine.every(function (part) {
          var inp = tools.querySelector('[data-q="' + part.q + '"]');
          return inp && gradeNumeric(inp.value, part, part.answer);
        });
        msg.textContent = ok ? "Correct" : "Try again";
        msg.className = "qc-msg " + (ok ? "ok" : "bad");
      });
    });
  }
  var caches = {};
  function answersUrl(secId) {
    var id = String(secId || "").replace(/\.\d+$/, "").replace(/-review$/, "");
    if (!id) return "";
    return "data/theory-answers/" + id + ".json";
  }
  function loadAnswers(secId) {
    var url = answersUrl(secId);
    if (!url) return Promise.resolve([]);
    if (!caches[url]) {
      caches[url] = fetch(url, { cache: "no-store" }).then(function (r) {
        if (!r.ok) throw new Error("answers");
        return r.json();
      }).catch(function () { return []; });
    }
    return caches[url];
  }
  function enhance(el, secId, answersOpt) {
    var calcP = addCalc(el.querySelector('[data-panel="learn"]') || el, secId);
    var checkP = (answersOpt ? Promise.resolve(answersOpt) : loadAnswers(secId)).then(function (answers) {
      wireChecks(el.querySelector('[data-panel="practice"]') || el, secId, answers);
    });
    return Promise.all([calcP, checkP]);
  }
  var api = {
    weeklyPay: weeklyPay,
    simpleInterest: simpleInterest,
    compoundValue: compoundValue,
    interestRows: interestRows,
    percentChange: percentChange,
    near: near,
    gradeNumeric: gradeNumeric,
    accept: AA.accept,
    parseNum: AA.parseNum,
    roundSf: AA.roundSf,
    enhance: enhance,
    rowManual: rowManual,
    rowBlocked: rowBlocked
  };
  root.msTheory = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : global);
