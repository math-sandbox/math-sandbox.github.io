/* pkg18 widget kinds. Registers on msWidget.kinds (the public registry
   in assets/widget.js) without editing widget.js or widget.css. After
   registering, scan() is called again so mounts that were skipped on the
   first pass (script load is async) are picked up. DOM is built with
   createElementNS and textContent only (no innerHTML, no eval). */
(function (root) {
  "use strict";

  function register() {
    var W = root.msWidget;
    if (!W || !W.kinds) {
      if (typeof document !== "undefined") setTimeout(register, 30);
      return;
    }
    if (W.kinds.__pkg18) {
      if (W.scan) W.scan(document);
      return;
    }
    var kinds = W.kinds;
    kinds.__pkg18 = true;

    function numStr(x, dp) {
      var s = Number(x).toFixed(dp);
      if (dp > 0) s = s.replace(/\.?0+$/, "");
      if (s === "-0") s = "0";
      return s;
    }
    function adder(svg) {
      return function (tag, attrs, parent) {
        var el = document.createElementNS("http://www.w3.org/2000/svg", tag);
        Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
        (parent || svg).appendChild(el);
        return el;
      };
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
    /* Standard normal cumulative probability (Abramowitz and Stegun 26.2.17, error below 1e-7). */
    function Phi(z) {
      var t = 1 / (1 + 0.2316419 * Math.abs(z));
      var d = 0.3989422804014327 * Math.exp(-z * z / 2);
      var p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
      return z >= 0 ? 1 - p : p;
    }
    function sgn(v) { return v < 0 ? "-" + numStr(-v, 2) : numStr(v, 2); }

    /* S1-7.2: geometric distribution Geo(p), bars for r = 1..12 with P(X = r) highlighted. */
    kinds["geometric-bars"] = function () {
      return {
        viewBox: "0 0 360 240",
        label: "Bar chart of the geometric distribution Geo(p) for r from 1 to 12, with the bar for the chosen value of r highlighted",
        sliders: [
          { id: "p", label: "Probability of success p", min: 0.05, max: 0.9, step: 0.05, value: 0.3 },
          { id: "r", label: "Trial of the first success r", min: 1, max: 12, step: 1, value: 3 }
        ],
        metrics: function (st) {
          var p = Math.round(st.p * 100) / 100, r = Math.max(1, Math.min(12, Math.round(st.r))), probs = [], k;
          for (k = 1; k <= 12; k++) probs.push(Math.pow(1 - p, k - 1) * p);
          return { p: p, r: r, probs: probs, P: probs[r - 1], gt: Math.pow(1 - p, r), mean: 1 / p };
        },
        formula: function (st) {
          var m = kinds["geometric-bars"]().metrics(st), ps = numStr(m.p, 2), qs = numStr(1 - m.p, 2);
          return [
            "\\(P(X=" + m.r + ")=(" + qs + ")^{" + (m.r - 1) + "}\\times" + ps + "=" + numStr(m.P, 4) + "\\)",
            "\\(P(X\\gt " + m.r + ")=(" + qs + ")^{" + m.r + "}=" + numStr(m.gt, 4) + "\\)",
            "\\(E(X)=\\dfrac{1}{p}=" + numStr(m.mean, 3) + "\\)"
          ];
        },
        draw: function (svg, st) {
          var m = kinds["geometric-bars"]().metrics(st);
          var add = adder(svg), L = 40, R = 345, T = 20, B = 200, k;
          var ymax = m.probs[0] * 1.15, w = (R - L) / 12;
          function X(v) { return L + (v - 0.5) * w; }
          function Y(v) { return B - v * (B - T) / ymax; }
          axes(add, L, R, T, B);
          txt(add, L - 6, Y(m.probs[0]) + 3, numStr(m.probs[0], 2), { "text-anchor": "end", "font-size": "10" });
          txt(add, L - 6, B + 3, "0", { "text-anchor": "end", "font-size": "10" });
          for (k = 1; k <= 12; k++) {
            var on = k === m.r;
            add("rect", { x: X(k) - w * 0.4, y: Y(m.probs[k - 1]), width: w * 0.8, height: B - Y(m.probs[k - 1]), fill: on ? "#c0392b" : "#0b5cab", "fill-opacity": on ? "0.7" : "0.35", stroke: on ? "#c0392b" : "#0b5cab" });
            txt(add, X(k), B + 14, String(k), { "text-anchor": "middle", "font-size": "10" });
          }
          txt(add, (L + R) / 2, B + 30, "Trial of the first success", { "text-anchor": "middle", "font-size": "10" });
        }
      };
    };

    /* S1-8.2: normal curve N(mu, sigma^2) with the area P(a < X < b) shaded. */
    kinds["normal-area"] = function () {
      return {
        viewBox: "0 0 360 240",
        label: "Normal curve with mean mu and standard deviation sigma, with the area between a and b shaded",
        sliders: [
          { id: "mu", label: "Mean mu", min: 20, max: 80, step: 1, value: 50 },
          { id: "s", label: "Standard deviation sigma", min: 2, max: 15, step: 0.5, value: 8 },
          { id: "a", label: "Lower value a", min: 0, max: 100, step: 1, value: 42 },
          { id: "b", label: "Upper value b", min: 0, max: 100, step: 1, value: 62 }
        ],
        metrics: function (st) {
          var mu = Math.round(st.mu), s = Math.round(st.s * 2) / 2, a = Math.round(Math.min(st.a, st.b)), b = Math.round(Math.max(st.a, st.b));
          var za = (a - mu) / s, zb = (b - mu) / s;
          return { mu: mu, s: s, a: a, b: b, za: za, zb: zb, P: Phi(zb) - Phi(za) };
        },
        formula: function (st) {
          var m = kinds["normal-area"]().metrics(st);
          return [
            "\\(z_a=\\dfrac{" + m.a + "-" + m.mu + "}{" + numStr(m.s, 1) + "}=" + sgn(m.za) + ",\\quad z_b=\\dfrac{" + m.b + "-" + m.mu + "}{" + numStr(m.s, 1) + "}=" + sgn(m.zb) + "\\)",
            "\\(P(" + m.a + "\\lt X\\lt " + m.b + ")=\\Phi(" + sgn(m.zb) + ")-\\Phi(" + sgn(m.za) + ")=" + numStr(m.P, 4) + "\\)"
          ];
        },
        draw: function (svg, st) {
          var m = kinds["normal-area"]().metrics(st);
          var add = adder(svg), L = 20, R = 345, T = 20, B = 200, x0 = 0, x1 = 100, i, d = "", sh = "";
          var fmax = 1 / (m.s * Math.sqrt(2 * Math.PI)), ymax = Math.max(fmax, 1 / (2 * Math.sqrt(2 * Math.PI))) * 1.1;
          function X(v) { return L + (v - x0) * (R - L) / (x1 - x0); }
          function f(v) { return Math.exp(-0.5 * Math.pow((v - m.mu) / m.s, 2)) * fmax; }
          function Y(v) { return B - v * (B - T) / ymax; }
          for (i = 0; i <= 200; i++) { var v = x0 + i * (x1 - x0) / 200; d += (i ? " L " : "M ") + X(v).toFixed(1) + " " + Y(f(v)).toFixed(1); }
          sh = "M " + X(m.a).toFixed(1) + " " + B;
          for (i = 0; i <= 80; i++) { var u = m.a + i * (m.b - m.a) / 80; sh += " L " + X(u).toFixed(1) + " " + Y(f(u)).toFixed(1); }
          sh += " L " + X(m.b).toFixed(1) + " " + B + " Z";
          add("path", { d: sh, fill: "#0b5cab", "fill-opacity": "0.3", stroke: "none" });
          add("line", { x1: L, y1: B, x2: R, y2: B, stroke: "#1a1a1a", "stroke-width": "1.2" });
          add("path", { d: d, fill: "none", stroke: "#1a1a1a", "stroke-width": "1.6" });
          add("line", { x1: X(m.mu), y1: B, x2: X(m.mu), y2: Y(fmax), stroke: "#c0392b", "stroke-width": "1.2", "stroke-dasharray": "5 3" });
          for (i = 0; i <= 100; i += 20) txt(add, X(i), B + 14, String(i), { "text-anchor": "middle", "font-size": "10" });
          txt(add, X(m.a), B + 28, "a", { "text-anchor": "middle", "font-size": "10", "font-style": "italic" });
          txt(add, X(m.b), B + 28, "b", { "text-anchor": "middle", "font-size": "10", "font-style": "italic" });
          txt(add, R - 4, T + 10, "mean (dashed)", { "text-anchor": "end", "font-size": "10" });
        }
      };
    };

    /* IGCSE-23.2: enlargement of a triangle with scale factor k (fractional or negative) and centre (cx, cy). */
    kinds["enlarge-grid"] = function () {
      var OBJ = [[2, 1], [4, 1], [2, 4]];
      return {
        viewBox: "0 0 360 300",
        label: "Coordinate grid (at least -8 to 8, widened to fit) showing a shaded triangle and its image after an enlargement with the chosen scale factor and centre",
        sliders: [
          { id: "k", label: "Scale factor k", min: -2, max: 2, step: 0.5, value: -0.5 },
          { id: "cx", label: "Centre x-coordinate", min: -3, max: 3, step: 1, value: 0 },
          { id: "cy", label: "Centre y-coordinate", min: -3, max: 3, step: 1, value: 0 }
        ],
        metrics: function (st) {
          var k = Math.round(st.k * 2) / 2, cx = Math.round(st.cx), cy = Math.round(st.cy);
          var img = OBJ.map(function (p) { return [cx + k * (p[0] - cx), cy + k * (p[1] - cy)]; });
          return { k: k, cx: cx, cy: cy, obj: OBJ, img: img };
        },
        formula: function (st) {
          var m = kinds["enlarge-grid"]().metrics(st);
          var pts = m.img.map(function (p) { return "(" + numStr(p[0], 2) + ", " + numStr(p[1], 2) + ")"; }).join(", ");
          return [
            "\\(\\text{Image point}=\\text{centre}+k\\times(\\text{object point}-\\text{centre}),\\ k=" + numStr(m.k, 2) + "\\)",
            "\\(\\text{Image vertices: }" + pts + "\\)"
          ];
        },
        draw: function (svg, st) {
          var m = kinds["enlarge-grid"]().metrics(st);
          var add = adder(svg), L = 20, R = 340, T = 10, B = 290, v, ext = 8;
          m.obj.concat(m.img, [[m.cx, m.cy]]).forEach(function (p) { ext = Math.max(ext, Math.ceil(Math.abs(p[0])) + 1, Math.ceil(Math.abs(p[1])) + 1); });
          var gs = ext > 10 ? 2 : 1, lab = ext > 10 ? 6 : 4;
          ext = Math.ceil(ext / (gs * lab / gs)) * lab;
          var lo = -ext, hi = ext;
          function X(a) { return L + (a - lo) * (R - L) / (hi - lo); }
          function Y(a) { return B - (a - lo) * (B - T) / (hi - lo); }
          for (v = lo; v <= hi; v += gs) {
            add("line", { x1: X(v), y1: Y(lo), x2: X(v), y2: Y(hi), stroke: "#cfcfcf", "stroke-width": "0.6" });
            add("line", { x1: X(lo), y1: Y(v), x2: X(hi), y2: Y(v), stroke: "#cfcfcf", "stroke-width": "0.6" });
          }
          add("line", { x1: X(lo), y1: Y(0), x2: X(hi), y2: Y(0), stroke: "#1a1a1a", "stroke-width": "1.2" });
          add("line", { x1: X(0), y1: Y(lo), x2: X(0), y2: Y(hi), stroke: "#1a1a1a", "stroke-width": "1.2" });
          for (v = lo; v <= hi; v += lab) if (v) {
            txt(add, X(v), Y(0) + 12, String(v), { "text-anchor": "middle", "font-size": "9" });
            txt(add, X(0) - 3, Y(v) + 3, String(v), { "text-anchor": "end", "font-size": "9" });
          }
          function poly(ps, fill, stroke) {
            add("polygon", { points: ps.map(function (p) { return X(p[0]).toFixed(1) + "," + Y(p[1]).toFixed(1); }).join(" "), fill: fill, "fill-opacity": "0.35", stroke: stroke, "stroke-width": "1.6" });
          }
          m.obj.forEach(function (p, i) {
            add("line", { x1: X(m.cx), y1: Y(m.cy), x2: X(p[0]), y2: Y(p[1]), stroke: "#7a7a7a", "stroke-width": "0.8", "stroke-dasharray": "3 3" });
            add("line", { x1: X(m.cx), y1: Y(m.cy), x2: X(m.img[i][0]), y2: Y(m.img[i][1]), stroke: "#7a7a7a", "stroke-width": "0.8", "stroke-dasharray": "3 3" });
          });
          poly(m.obj, "#0b5cab", "#0b5cab");
          poly(m.img, "#c0392b", "#c0392b");
          add("circle", { cx: X(m.cx), cy: Y(m.cy), r: 3.5, fill: "#1a1a1a" });
          txt(add, R - 4, T + 12, "object (blue), image (red)", { "text-anchor": "end", "font-size": "10" });
        }
      };
    };

    if (W.scan) W.scan(document);
  }

  register();
})(typeof window !== "undefined" ? window : this);
