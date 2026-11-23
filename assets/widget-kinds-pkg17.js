/* pkg17 widget kinds. Registers on msWidget.kinds (the public registry
   in assets/widget.js) without editing widget.js or widget.css. After
   registering, scan() is called again so mounts that were skipped on the
   first pass (script load is async) are picked up. */
(function (root) {
  "use strict";

  function register() {
    var W = root.msWidget;
    if (!W || !W.kinds) {
      if (typeof document !== "undefined") setTimeout(register, 30);
      return;
    }
    if (W.kinds.__pkg17) {
      if (W.scan) W.scan(document);
      return;
    }
    var kinds = W.kinds;
    kinds.__pkg17 = true;

    function numStr(x, dp) {
      var s = Number(x).toFixed(dp);
      if (dp > 0) s = s.replace(/\.?0+$/, "");
      if (s === "-0") s = "0";
      return s;
    }
    function lin(m, c) {
      var ms = numStr(m, 3), cs = numStr(Math.abs(c), 3), t;
      if (ms === "0") t = "";
      else if (ms === "1") t = "x";
      else if (ms === "-1") t = "-x";
      else t = ms + "x";
      if (cs === "0") return t || "0";
      if (!t) return numStr(c, 3);
      return t + (c < 0 ? "-" : "+") + cs;
    }
    function comb(n, r) {
      if (r < 0 || r > n) return 0;
      var c = 1;
      for (var i = 1; i <= r; i++) c = c * (n - r + i) / i;
      return Math.round(c);
    }
    function adder(svg) {
      return function (tag, attrs, parent) {
        var el = document.createElementNS("http://www.w3.org/2000/svg", tag);
        Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
        (parent || svg).appendChild(el);
        return el;
      };
    }
    var clipSeq = 0;
    function clipRect(add, id, x, y, w, h) {
      id = id + "-" + (++clipSeq);
      var defs = add("defs", {});
      var clip = add("clipPath", { id: id }, defs);
      add("rect", { x: x, y: y, width: w, height: h }, clip);
      return "url(#" + id + ")";
    }
    function txt(add, x, y, s, extra) {
      var a = { x: x, y: y, "font-size": "11", "font-family": "sans-serif" };
      Object.keys(extra || {}).forEach(function (k) { a[k] = extra[k]; });
      add("text", a).textContent = s;
    }

    function axes(add, L, R, T, B) {
      add("line", { x1: L, y1: B, x2: R, y2: B, stroke: "#1a1a1a", "stroke-width": "1.2" });
      add("line", { x1: L, y1: B, x2: L, y2: T, stroke: "#1a1a1a", "stroke-width": "1.2" });
    }

    /* S1-6.3: a discrete distribution from four weights, with E(X) and Var(X). */
    kinds["discrete-ev"] = function () {
      return {
        viewBox: "0 0 360 240",
        label: "Bar chart of a probability distribution on the values 0, 1, 2 and 3, with the mean marked by a dashed line",
        sliders: [
          { id: "w0", label: "Weight for x = 0", min: 0, max: 10, step: 1, value: 3 },
          { id: "w1", label: "Weight for x = 1", min: 0, max: 10, step: 1, value: 4 },
          { id: "w2", label: "Weight for x = 2", min: 0, max: 10, step: 1, value: 2 },
          { id: "w3", label: "Weight for x = 3", min: 0, max: 10, step: 1, value: 1 }
        ],
        metrics: function (st) {
          var w = [Math.round(st.w0), Math.round(st.w1), Math.round(st.w2), Math.round(st.w3)];
          var s = w[0] + w[1] + w[2] + w[3];
          if (s === 0) { w = [1, 1, 1, 1]; s = 4; }
          var p = w.map(function (v) { return v / s; });
          var E = p[1] + 2 * p[2] + 3 * p[3], E2 = p[1] + 4 * p[2] + 9 * p[3];
          return { p: p, E: E, E2: E2, V: E2 - E * E };
        },
        formula: function (st) {
          var m = kinds["discrete-ev"]().metrics(st);
          var ps = m.p.map(function (v) { return numStr(v, 3); });
          return [
            "\\(P(X=x)\\): " + ps.join(", ") + " for \\(x=0, 1, 2, 3\\)",
            "\\(E(X)=\\sum xP(X=x)=" + numStr(m.E, 3) + "\\)",
            "\\(\\mathrm{Var}(X)=E(X^2)-\\bigl(E(X)\\bigr)^2=" + numStr(m.E2, 3) + "-" + numStr(m.E, 3) + "^2=" + numStr(m.V, 3) + "\\)"
          ];
        },
        draw: function (svg, st) {
          var m = kinds["discrete-ev"]().metrics(st);
          var add = adder(svg), L = 40, R = 340, T = 20, B = 200, k;
          function X(v) { return L + (v + 0.5) * (R - L) / 4; }
          function Y(v) { return B - v * (B - T); }
          axes(add, L, R, T, B);
          for (k = 0; k <= 4; k++) txt(add, L - 6, Y(k / 4) + 3, numStr(k / 4, 2), { "text-anchor": "end", "font-size": "10" });
          for (k = 0; k < 4; k++) {
            add("rect", { x: X(k) - 22, y: Y(m.p[k]), width: 44, height: B - Y(m.p[k]), fill: "#0b5cab", "fill-opacity": "0.35", stroke: "#0b5cab" });
            txt(add, X(k), B + 14, String(k), { "text-anchor": "middle", "font-size": "11" });
          }
          add("line", { x1: X(m.E), y1: T, x2: X(m.E), y2: B, stroke: "#c0392b", "stroke-width": "1.5", "stroke-dasharray": "5 3" });
          txt(add, X(m.E), T - 4, "mean " + numStr(m.E, 2), { "text-anchor": "middle", "font-size": "10", fill: "#c0392b" });
          txt(add, (L + R) / 2, B + 30, "x", { "text-anchor": "middle", "font-size": "11", "font-style": "italic" });
        }
      };
    };

    /* S1-7.1: binomial probabilities B(n, p) as bars, one value highlighted. */
    kinds["binomial-bars"] = function () {
      return {
        viewBox: "0 0 360 240",
        label: "Bar chart of the binomial distribution B(n, p) with the bar for the chosen value of r highlighted",
        sliders: [
          { id: "n", label: "Number of trials n", min: 1, max: 20, step: 1, value: 8 },
          { id: "p", label: "Probability of success p", min: 0.05, max: 0.95, step: 0.05, value: 0.25 },
          { id: "r", label: "Number of successes r", min: 0, max: 20, step: 1, value: 2 }
        ],
        metrics: function (st) {
          var n = Math.round(st.n), p = Math.round(st.p * 100) / 100, r = Math.min(Math.round(st.r), n), probs = [], k;
          for (k = 0; k <= n; k++) probs.push(comb(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k));
          return { n: n, p: p, r: r, probs: probs, P: probs[r], mean: n * p, v: n * p * (1 - p) };
        },
        formula: function (st) {
          var m = kinds["binomial-bars"]().metrics(st), ps = numStr(m.p, 2), qs = numStr(1 - m.p, 2);
          return [
            "\\(P(X=" + m.r + ")={}^{" + m.n + "}C_{" + m.r + "}\\,(" + ps + ")^{" + m.r + "}(" + qs + ")^{" + (m.n - m.r) + "}=" + numStr(m.P, 4) + "\\)",
            "\\(E(X)=np=" + numStr(m.mean, 3) + "\\)",
            "\\(\\mathrm{Var}(X)=np(1-p)=" + numStr(m.v, 3) + "\\)"
          ];
        },
        draw: function (svg, st) {
          var m = kinds["binomial-bars"]().metrics(st);
          var add = adder(svg), L = 40, R = 345, T = 20, B = 200, k;
          var ymax = Math.max.apply(null, m.probs) * 1.15, w = (R - L) / (m.n + 1);
          function X(v) { return L + (v + 0.5) * w; }
          function Y(v) { return B - v * (B - T) / ymax; }
          axes(add, L, R, T, B);
          txt(add, L - 6, Y(ymax / 1.15) + 3, numStr(ymax / 1.15, 2), { "text-anchor": "end", "font-size": "10" });
          txt(add, L - 6, B + 3, "0", { "text-anchor": "end", "font-size": "10" });
          for (k = 0; k <= m.n; k++) {
            var on = k === m.r;
            add("rect", { x: X(k) - w * 0.4, y: Y(m.probs[k]), width: w * 0.8, height: B - Y(m.probs[k]), fill: on ? "#c0392b" : "#0b5cab", "fill-opacity": on ? "0.7" : "0.35", stroke: on ? "#c0392b" : "#0b5cab" });
            if (m.n <= 10 || k % 2 === 0) txt(add, X(k), B + 14, String(k), { "text-anchor": "middle", "font-size": "10" });
          }
          txt(add, (L + R) / 2, B + 30, "Number of successes", { "text-anchor": "middle", "font-size": "10" });
        }
      };
    };

    /* P23-9.3: angle between two vectors in the plane from the scalar product. */
    kinds["vector-angle"] = function () {
      return {
        viewBox: "0 0 360 260",
        label: "Two vectors a and b drawn from the origin, with the angle between them found from the scalar product",
        sliders: [
          { id: "a1", label: "a: first component", min: -4, max: 4, step: 1, value: 3 },
          { id: "a2", label: "a: second component", min: -4, max: 4, step: 1, value: 1 },
          { id: "b1", label: "b: first component", min: -4, max: 4, step: 1, value: 1 },
          { id: "b2", label: "b: second component", min: -4, max: 4, step: 1, value: 3 }
        ],
        metrics: function (st) {
          var a1 = Math.round(st.a1), a2 = Math.round(st.a2), b1 = Math.round(st.b1), b2 = Math.round(st.b2);
          if (a1 === 0 && a2 === 0) a1 = 1;
          if (b1 === 0 && b2 === 0) b2 = 1;
          var dot = a1 * b1 + a2 * b2, ma = Math.sqrt(a1 * a1 + a2 * a2), mb = Math.sqrt(b1 * b1 + b2 * b2);
          var c = Math.max(-1, Math.min(1, dot / (ma * mb)));
          return { a1: a1, a2: a2, b1: b1, b2: b2, dot: dot, ma: ma, mb: mb, cos: c, deg: Math.acos(c) * 180 / Math.PI };
        },
        formula: function (st) {
          var m = kinds["vector-angle"]().metrics(st);
          return [
            "\\(\\mathbf{a}\\cdot\\mathbf{b}=(" + m.a1 + ")(" + m.b1 + ")+(" + m.a2 + ")(" + m.b2 + ")=" + m.dot + "\\)",
            "\\(\\cos\\theta=\\dfrac{" + m.dot + "}{" + numStr(m.ma, 3) + "\\times" + numStr(m.mb, 3) + "}=" + numStr(m.cos, 3) + "\\)",
            "\\(\\theta=" + numStr(m.deg, 1) + "^\\circ\\)" + (m.dot === 0 ? ": the vectors are perpendicular" : (m.dot < 0 ? ": obtuse" : ""))
          ];
        },
        draw: function (svg, st) {
          var m = kinds["vector-angle"]().metrics(st);
          var add = adder(svg), cx = 180, cy = 130, s = 26, k;
          for (k = -4; k <= 4; k++) {
            add("line", { x1: cx + k * s, y1: cy - 4 * s, x2: cx + k * s, y2: cy + 4 * s, stroke: "#e2e2e2", "stroke-width": "0.8" });
            add("line", { x1: cx - 4 * s, y1: cy + k * s, x2: cx + 4 * s, y2: cy + k * s, stroke: "#e2e2e2", "stroke-width": "0.8" });
          }
          add("line", { x1: cx - 4 * s, y1: cy, x2: cx + 4 * s, y2: cy, stroke: "#888", "stroke-width": "1" });
          add("line", { x1: cx, y1: cy - 4 * s, x2: cx, y2: cy + 4 * s, stroke: "#888", "stroke-width": "1" });
          function arrow(x, y, col, name) {
            var X2 = cx + x * s, Y2 = cy - y * s, ang = Math.atan2(Y2 - cy, X2 - cx);
            add("line", { x1: cx, y1: cy, x2: X2, y2: Y2, stroke: col, "stroke-width": "2.2" });
            var h = 8, p1 = (X2 - h * Math.cos(ang - 0.4)) + "," + (Y2 - h * Math.sin(ang - 0.4)), p2 = (X2 - h * Math.cos(ang + 0.4)) + "," + (Y2 - h * Math.sin(ang + 0.4));
            add("polygon", { points: X2 + "," + Y2 + " " + p1 + " " + p2, fill: col });
            txt(add, X2 + 6 * Math.cos(ang), Y2 + 6 * Math.sin(ang) + 4, name, { "font-size": "12", "font-weight": "bold", fill: col });
          }
          arrow(m.a1, m.a2, "#0b5cab", "a");
          arrow(m.b1, m.b2, "#c0392b", "b");
          txt(add, 8, 252, "angle " + numStr(m.deg, 1) + " degrees", { "font-size": "11" });
        }
      };
    };

    /* P1-7.3: tangent and normal to y = x^2 - 2x at a chosen point. */
    kinds["tangent-normal"] = function () {
      return {
        viewBox: "0 0 360 260",
        label: "The curve y = x squared minus 2x with the tangent and the normal drawn at a chosen point",
        sliders: [{ id: "x0", label: "x-coordinate of the point", min: -1, max: 3, step: 0.5, value: 2 }],
        metrics: function (st) {
          var x0 = Math.round(st.x0 * 2) / 2, y0 = x0 * x0 - 2 * x0, m = 2 * x0 - 2;
          return { x0: x0, y0: y0, m: m };
        },
        formula: function (st) {
          var q = kinds["tangent-normal"]().metrics(st);
          var c = q.y0 - q.m * q.x0;
          var out = ["\\(\\dfrac{\\mathrm{d}y}{\\mathrm{d}x}=2x-2=" + numStr(q.m, 2) + "\\) at \\((" + numStr(q.x0, 1) + ", " + numStr(q.y0, 2) + ")\\)",
                     "Tangent: \\(y=" + lin(q.m, c) + "\\)"];
          out.push(q.m === 0 ? "Normal: the vertical line \\(x=" + numStr(q.x0, 1) + "\\)" : "Normal: gradient \\(-\\dfrac{1}{" + numStr(q.m, 2) + "}=" + numStr(-1 / q.m, 3) + "\\), \\(y=" + lin(-1 / q.m, q.y0 + q.x0 / q.m) + "\\)");
          return out;
        },
        draw: function (svg, st) {
          var q = kinds["tangent-normal"]().metrics(st);
          var add = adder(svg), L = 20, R = 340, T = 15, B = 245;
          function X(v) { return L + (v + 2) * (R - L) / 6; }
          function Y(v) { return B - (v + 2) * (B - T) / 8; }
          add("line", { x1: L, y1: Y(0), x2: R, y2: Y(0), stroke: "#888", "stroke-width": "1" });
          add("line", { x1: X(0), y1: T, x2: X(0), y2: B, stroke: "#888", "stroke-width": "1" });
          var xa = -2, xb = 4, ya = -2, yb = 6;
          function seg(m, c) { /* the part of y = mx + c inside the box [xa, xb] x [ya, yb] */
            var t0 = xa, t1 = xb, lo, hi;
            if (Math.abs(m) < 1e-12) { if (c < ya || c > yb) return null; }
            else { lo = (ya - c) / m; hi = (yb - c) / m; if (lo > hi) { var tmp = lo; lo = hi; hi = tmp; } t0 = Math.max(t0, lo); t1 = Math.min(t1, hi); }
            if (t1 <= t0) return null;
            return { x1: X(t0), y1: Y(m * t0 + c), x2: X(t1), y2: Y(m * t1 + c) };
          }
          var run = [], v, yv;
          function flush() { if (run.length > 1) add("polyline", { points: run.join(" "), fill: "none", stroke: "#1a1a1a", "stroke-width": "1.6" }); run = []; }
          for (v = -2; v <= 4.001; v += 0.05) { yv = v * v - 2 * v; if (yv >= ya && yv <= yb) run.push(X(v).toFixed(1) + "," + Y(yv).toFixed(1)); else flush(); }
          flush();
          var tg = seg(q.m, q.y0 - q.m * q.x0);
          if (tg) add("line", { x1: tg.x1, y1: tg.y1, x2: tg.x2, y2: tg.y2, stroke: "#0b5cab", "stroke-width": "1.6" });
          if (q.m === 0) add("line", { x1: X(q.x0), y1: T, x2: X(q.x0), y2: B, stroke: "#c0392b", "stroke-width": "1.6", "stroke-dasharray": "5 3" });
          else { var nm = seg(-1 / q.m, q.y0 + q.x0 / q.m); if (nm) add("line", { x1: nm.x1, y1: nm.y1, x2: nm.x2, y2: nm.y2, stroke: "#c0392b", "stroke-width": "1.6", "stroke-dasharray": "5 3" }); }
          add("circle", { cx: X(q.x0), cy: Y(q.y0), r: 4, fill: "#1a1a1a" });
          txt(add, R - 4, T + 12, "tangent (solid), normal (dashed)", { "text-anchor": "end", "font-size": "10" });
        }
      };
    };

    if (W.scan) W.scan(document);
  }

  register();
})(typeof window !== "undefined" ? window : this);
