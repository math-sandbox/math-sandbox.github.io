/* pkg16 widget kinds. Registers on msWidget.kinds (the public registry
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
    if (W.kinds.__pkg16) {
      if (W.scan) W.scan(document);
      return;
    }
    var kinds = W.kinds;
    kinds.__pkg16 = true;

    function numStr(x, dp) {
      var s = Number(x).toFixed(dp);
      if (dp > 0) s = s.replace(/\.?0+$/, "");
      if (s === "-0") s = "0";
      return s;
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
    /* deterministic simple random sample: partial Fisher-Yates with a small LCG */
    function sample(N, n, seed) {
      var arr = [], i, s = (seed * 7919 + 104729) % 2147483647;
      for (i = 1; i <= N; i++) arr.push(i);
      for (i = 0; i < n; i++) {
        s = (s * 48271) % 2147483647;
        var j = i + (s % (N - i));
        var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
      }
      return arr.slice(0, n).sort(function (a, b) { return a - b; });
    }

    /* S2-5.1: a simple random sample of n from a population of N. */
    kinds["random-sample"] = function () {
      return {
        viewBox: "0 0 360 230",
        label: "A population of N numbered members with a random sample of n members shaded",
        sliders: [
          { id: "N", label: "Population size N", min: 10, max: 40, step: 1, value: 30 },
          { id: "n", label: "Sample size n", min: 1, max: 8, step: 1, value: 5 },
          { id: "seed", label: "New sample (draw number)", min: 1, max: 20, step: 1, value: 1 }
        ],
        metrics: function (st) {
          var N = Math.round(st.N), n = Math.min(Math.round(st.n), N), seed = Math.round(st.seed);
          return { N: N, n: n, chosen: sample(N, n, seed).join(", "), samples: comb(N, n), p: n / N };
        },
        formula: function (st) {
          var m = kinds["random-sample"]().metrics(st);
          return [
            "Sample chosen: " + m.chosen,
            "Each member has probability \\(\\dfrac{" + m.n + "}{" + m.N + "}=" + numStr(m.p, 3) + "\\) of being chosen",
            "Number of possible samples \\({}^{" + m.N + "}C_{" + m.n + "}=" + m.samples + "\\)"
          ];
        },
        draw: function (svg, st) {
          var m = kinds["random-sample"]().metrics(st);
          var add = adder(svg), chosen = {}, i;
          m.chosen.split(", ").forEach(function (c) { chosen[c] = true; });
          txt(add, 12, 16, "Sampling frame: members 1 to " + m.N + " (sample shaded)", { "font-size": "12" });
          for (i = 1; i <= m.N; i++) {
            var col = (i - 1) % 8, row = Math.floor((i - 1) / 8);
            var x = 14 + col * 42, y = 28 + row * 38;
            var on = !!chosen[String(i)];
            add("rect", { x: x, y: y, width: 36, height: 30, rx: 5, fill: on ? "#0b5cab" : "#f4f4f4", "fill-opacity": on ? "0.35" : "1", stroke: on ? "#0b5cab" : "#b0b0b0", "stroke-width": on ? "1.8" : "0.8" });
            txt(add, x + 18, y + 19, String(i < 10 ? "0" + i : i), { "text-anchor": "middle", "font-size": "12" });
          }
        }
      };
    };

    /* P1-6.5: partial sums of a geometric series approaching the sum to infinity. */
    kinds["gp-sum-to-infinity"] = function () {
      return {
        viewBox: "0 0 360 240",
        label: "Partial sums of a geometric series plotted against n, with the sum to infinity drawn as a dashed line",
        sliders: [
          { id: "a", label: "First term a", min: 1, max: 10, step: 1, value: 6 },
          { id: "r", label: "Common ratio r", min: -0.9, max: 0.9, step: 0.1, value: 0.5 },
          { id: "n", label: "Number of terms n", min: 1, max: 15, step: 1, value: 6 }
        ],
        metrics: function (st) {
          var a = Math.round(st.a), r = Math.round(st.r * 10) / 10, n = Math.round(st.n);
          var Sn = Math.abs(1 - r) < 1e-12 ? a * n : a * (1 - Math.pow(r, n)) / (1 - r);
          return { a: a, r: r, n: n, Sn: Sn, Sinf: a / (1 - r) };
        },
        formula: function (st) {
          var m = kinds["gp-sum-to-infinity"]().metrics(st);
          var rs = numStr(m.r, 1);
          return [
            "\\(S_{" + m.n + "}=\\dfrac{" + m.a + "\\bigl(1-(" + rs + ")^{" + m.n + "}\\bigr)}{1-(" + rs + ")}=" + numStr(m.Sn, 3) + "\\)",
            "\\(S_\\infty=\\dfrac{" + m.a + "}{1-(" + rs + ")}=" + numStr(m.Sinf, 3) + "\\)",
            "Difference \\(S_\\infty-S_{" + m.n + "}=" + numStr(m.Sinf - m.Sn, 3) + "\\)"
          ];
        },
        draw: function (svg, st) {
          var m = kinds["gp-sum-to-infinity"]().metrics(st);
          var add = adder(svg), L = 40, R = 345, T = 18, B = 205, k;
          var sums = [], s = 0, t = m.a;
          for (k = 1; k <= 15; k++) { s += t; sums.push(s); t *= m.r; }
          var ymax = Math.max(m.Sinf, Math.max.apply(null, sums)) * 1.1, ymin = Math.min(0, Math.min.apply(null, sums));
          function X(v) { return L + (v - 0.5) * (R - L) / 15; }
          function Y(v) { return B - (v - ymin) * (B - T) / (ymax - ymin); }
          var clipUrl = clipRect(add, "pkg16-gp", L, T - 4, R - L, B - T + 8);
          add("line", { x1: L, y1: B, x2: R, y2: B, stroke: "#1a1a1a", "stroke-width": "1.2" });
          add("line", { x1: L, y1: B, x2: L, y2: T, stroke: "#1a1a1a", "stroke-width": "1.2" });
          for (k = 1; k <= 15; k += 2) txt(add, X(k), B + 14, String(k), { "text-anchor": "middle", "font-size": "10" });
          txt(add, (L + R) / 2, B + 30, "Number of terms n", { "text-anchor": "middle", "font-size": "10" });
          txt(add, 4, T + 4, "S", { "font-size": "11", "font-style": "italic" });
          add("line", { x1: L, y1: Y(m.Sinf), x2: R, y2: Y(m.Sinf), stroke: "#c0392b", "stroke-width": "1.3", "stroke-dasharray": "5 3", "clip-path": clipUrl });
          txt(add, L + 4, Y(m.Sinf) - 4, "sum to infinity " + numStr(m.Sinf, 2), { "font-size": "10", fill: "#c0392b" });
          var pts = sums.map(function (v, i) { return X(i + 1).toFixed(2) + "," + Y(v).toFixed(2); });
          add("polyline", { points: pts.join(" "), fill: "none", stroke: "#9bb7d4", "stroke-width": "1", "clip-path": clipUrl });
          sums.forEach(function (v, i) {
            add("circle", { cx: X(i + 1), cy: Y(v), r: i + 1 === m.n ? 5 : 3, fill: i + 1 <= m.n ? "#0b5cab" : "#ffffff", stroke: "#0b5cab", "stroke-width": "1.2", "clip-path": clipUrl });
          });
        }
      };
    };

    /* IGCSE-21.4: speed-time graph, gradient = acceleration, area = distance. */
    kinds["speed-time-area"] = function () {
      return {
        viewBox: "0 0 360 240",
        label: "Speed-time graph with the area under it shaded; the gradients are the acceleration and deceleration",
        sliders: [
          { id: "V", label: "Top speed V (m/s)", min: 2, max: 30, step: 1, value: 20 },
          { id: "t1", label: "Time accelerating (s)", min: 1, max: 40, step: 1, value: 10 },
          { id: "t2", label: "Time at constant speed (s)", min: 0, max: 100, step: 5, value: 90 },
          { id: "t3", label: "Time decelerating (s)", min: 1, max: 40, step: 1, value: 30 }
        ],
        metrics: function (st) {
          var V = Math.round(st.V), t1 = Math.round(st.t1), t2 = Math.round(st.t2), t3 = Math.round(st.t3);
          var T = t1 + t2 + t3;
          return { V: V, t1: t1, t2: t2, t3: t3, T: T, acc: V / t1, dec: V / t3, dist: (t2 + T) * V / 2 };
        },
        formula: function (st) {
          var m = kinds["speed-time-area"]().metrics(st);
          return [
            "Acceleration \\(=\\dfrac{" + m.V + "}{" + m.t1 + "}=" + numStr(m.acc, 3) + "\\text{ m/s}^2\\)",
            "Deceleration \\(=\\dfrac{" + m.V + "}{" + m.t3 + "}=" + numStr(m.dec, 3) + "\\text{ m/s}^2\\)",
            "Distance \\(=\\dfrac{1}{2}(" + m.t2 + "+" + m.T + ")\\times" + m.V + "=" + numStr(m.dist, 1) + "\\text{ m}\\)"
          ];
        },
        draw: function (svg, st) {
          var m = kinds["speed-time-area"]().metrics(st);
          var add = adder(svg), L = 44, R = 345, T = 18, B = 200;
          function X(v) { return L + v * (R - L) / 180; }
          function Y(v) { return B - v * (B - T) / 32; }
          var a = X(m.t1), b = X(m.t1 + m.t2), c = X(m.T);
          add("path", { d: "M " + L + " " + B + " L " + a.toFixed(2) + " " + Y(m.V).toFixed(2) + " L " + b.toFixed(2) + " " + Y(m.V).toFixed(2) + " L " + c.toFixed(2) + " " + B + " Z", fill: "#0b5cab", "fill-opacity": "0.2", stroke: "#0b5cab", "stroke-width": "2" });
          add("line", { x1: L, y1: B, x2: R, y2: B, stroke: "#1a1a1a", "stroke-width": "1.2" });
          add("line", { x1: L, y1: B, x2: L, y2: T, stroke: "#1a1a1a", "stroke-width": "1.2" });
          var v;
          for (v = 0; v <= 180; v += 30) txt(add, X(v), B + 14, String(v), { "text-anchor": "middle", "font-size": "10" });
          for (v = 0; v <= 30; v += 10) txt(add, L - 6, Y(v) + 3, String(v), { "text-anchor": "end", "font-size": "10" });
          txt(add, (L + R) / 2, B + 30, "Time (s)", { "text-anchor": "middle", "font-size": "10" });
          txt(add, 4, T + 4, "Speed (m/s)", { "font-size": "10" });
          txt(add, (a + c) / 2, Y(m.V / 2) + 4, "area " + numStr(m.dist, 1) + " m", { "text-anchor": "middle", "font-size": "11" });
        }
      };
    };

    if (W.scan) W.scan(document);
  }

  register();
})(typeof window !== "undefined" ? window : this);
