/* pkg19 widget kinds. Registers on msWidget.kinds (the public registry
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
    if (W.kinds.__pkg19) {
      if (W.scan) W.scan(document);
      return;
    }
    var kinds = W.kinds;
    kinds.__pkg19 = true;

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
    /* Standard normal cumulative probability (Abramowitz and Stegun 26.2.17, error below 1e-7). */
    function Phi(z) {
      var t = 1 / (1 + 0.2316419 * Math.abs(z));
      var d = 0.3989422804014327 * Math.exp(-z * z / 2);
      var p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
      return z >= 0 ? 1 - p : p;
    }
    function sgn(v, dp) { return v < 0 ? "-" + numStr(-v, dp) : numStr(v, dp); }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    /* S1-8.4: B(n, p) bars with the N(np, npq) curve; P(X <= k) exact and by the normal approximation with a continuity correction. */
    kinds["normal-approx"] = function () {
      return {
        viewBox: "0 0 360 240",
        label: "Bar chart of the binomial distribution B(n, p) with the approximating normal curve, bars up to k shaded",
        sliders: [
          { id: "n", label: "Number of trials n", min: 10, max: 100, step: 1, value: 50 },
          { id: "p", label: "Probability of success p", min: 0.1, max: 0.9, step: 0.05, value: 0.4 },
          { id: "k", label: "Upper value k in P(X \u2264 k)", min: 0, max: 100, step: 1, value: 17 }
        ],
        metrics: function (st) {
          var n = clamp(Math.round(st.n), 10, 100), p = Math.round(st.p * 100) / 100, k = clamp(Math.round(st.k), 0, n);
          var q = 1 - p, probs = [], r, v = Math.pow(q, n), cum = 0;
          for (r = 0; r <= n; r++) {
            probs.push(v);
            if (r <= k) cum += v;
            v = v * (n - r) / (r + 1) * p / q;
          }
          var mu = n * p, va = n * p * q, sd = Math.sqrt(va), z = (k + 0.5 - mu) / sd;
          return { n: n, p: p, k: k, probs: probs, exact: Math.min(1, cum), mu: mu, va: va, sd: sd, z: z, approx: Phi(z), ok: mu > 5 && n * q > 5 };
        },
        formula: function (st) {
          var m = kinds["normal-approx"]().metrics(st);
          return [
            "\\(np=" + numStr(m.mu, 2) + ",\\quad npq=" + numStr(m.va, 3) + "\\)",
            "\\(P(X\\le " + m.k + ")\\approx\\Phi\\left(\\dfrac{" + m.k + ".5-" + numStr(m.mu, 2) + "}{\\sqrt{" + numStr(m.va, 3) + "}}\\right)=\\Phi(" + sgn(m.z, 3) + ")=" + numStr(m.approx, 4) + "\\)",
            "\\(\\text{Exact binomial: }P(X\\le " + m.k + ")=" + numStr(m.exact, 4) + "\\)",
            m.ok ? "\\(np\\gt 5\\text{ and }nq\\gt 5\\text{: the approximation is suitable}\\)" : "\\(np\\text{ or }nq\\text{ is not greater than 5: the approximation is not suitable}\\)"
          ];
        },
        draw: function (svg, st) {
          var m = kinds["normal-approx"]().metrics(st);
          var add = adder(svg), L = 30, R = 345, T = 20, B = 200, r;
          var lo = Math.max(0, Math.floor(m.mu - 4 * m.sd)), hi = Math.min(m.n, Math.ceil(m.mu + 4 * m.sd));
          var ymax = 0;
          for (r = lo; r <= hi; r++) ymax = Math.max(ymax, m.probs[r]);
          ymax = Math.max(ymax, 1 / (m.sd * Math.sqrt(2 * Math.PI))) * 1.12;
          var w = (R - L) / (hi - lo + 1);
          function X(v) { return L + (v - lo + 0.5) * w; }
          function Y(v) { return B - v * (B - T) / ymax; }
          add("line", { x1: L, y1: B, x2: R, y2: B, stroke: "#1a1a1a", "stroke-width": "1.2" });
          for (r = lo; r <= hi; r++) {
            var on = r <= m.k;
            add("rect", { x: X(r) - w / 2, y: Y(m.probs[r]), width: w, height: B - Y(m.probs[r]), fill: on ? "#0b5cab" : "#9a9a9a", "fill-opacity": on ? "0.45" : "0.25", stroke: "#ffffff", "stroke-width": "0.5" });
          }
          var d = "", i, N = 160;
          for (i = 0; i <= N; i++) {
            var x = lo - 0.5 + (hi - lo + 1) * i / N, y = Math.exp(-Math.pow(x - m.mu, 2) / (2 * m.va)) / (m.sd * Math.sqrt(2 * Math.PI));
            d += (i ? " L " : "M ") + X(x).toFixed(1) + " " + Y(y).toFixed(1);
          }
          add("path", { d: d, fill: "none", stroke: "#c0392b", "stroke-width": "1.8" });
          if (m.k >= lo - 1 && m.k <= hi) add("line", { x1: X(m.k + 0.5), y1: B, x2: X(m.k + 0.5), y2: T, stroke: "#c0392b", "stroke-width": "1", "stroke-dasharray": "4 3" });
          var step = Math.max(1, Math.ceil((hi - lo + 1) / 10));
          for (r = lo; r <= hi; r += step) txt(add, X(r), B + 14, String(r), { "text-anchor": "middle", "font-size": "10" });
          txt(add, (L + R) / 2, B + 30, "Number of successes", { "text-anchor": "middle", "font-size": "10" });
          txt(add, R, T, "dashed line at k + 0.5", { "text-anchor": "end", "font-size": "10" });
        }
      };
    };

    /* P23-11.3: the point z = a + bi on an Argand diagram with its modulus and argument. */
    kinds["argand-modarg"] = function () {
      return {
        viewBox: "0 0 300 300",
        label: "Argand diagram showing the point z = a + bi, the line from the origin of length |z| and the angle arg z",
        sliders: [
          { id: "a", label: "Real part a", min: -6, max: 6, step: 1, value: 3 },
          { id: "b", label: "Imaginary part b", min: -6, max: 6, step: 1, value: 4 }
        ],
        metrics: function (st) {
          var a = clamp(Math.round(st.a), -6, 6), b = clamp(Math.round(st.b), -6, 6);
          var r = Math.sqrt(a * a + b * b), th = (a === 0 && b === 0) ? null : Math.atan2(b, a);
          return { a: a, b: b, r: r, th: th };
        },
        formula: function (st) {
          var m = kinds["argand-modarg"]().metrics(st);
          var z = "z=" + m.a + (m.b < 0 ? "-" + (-m.b) : "+" + m.b) + "\\mathrm{i}";
          var out = ["\\(" + z + ",\\quad |z|=\\sqrt{(" + m.a + ")^2+(" + m.b + ")^2}=" + numStr(m.r, 3) + "\\)"];
          if (m.th === null) out.push("\\(z=0\\text{: the argument is not defined}\\)");
          else {
            out.push("\\(\\arg z=" + sgn(m.th, 3) + "\\text{ radians }(-\\pi\\lt\\theta\\le\\pi)\\)");
            out.push("\\(z=" + numStr(m.r, 3) + "\\left(\\cos(" + sgn(m.th, 3) + ")+\\mathrm{i}\\sin(" + sgn(m.th, 3) + ")\\right)=" + numStr(m.r, 3) + "\\mathrm{e}^{" + sgn(m.th, 3) + "\\mathrm{i}}\\)");
          }
          return out;
        },
        draw: function (svg, st) {
          var m = kinds["argand-modarg"]().metrics(st);
          var add = adder(svg), C = 150, u = 20, v;
          function X(x) { return C + x * u; }
          function Y(y) { return C - y * u; }
          for (v = -7; v <= 7; v++) {
            add("line", { x1: X(v), y1: Y(-7), x2: X(v), y2: Y(7), stroke: "#d0d0d0", "stroke-width": "0.6" });
            add("line", { x1: X(-7), y1: Y(v), x2: X(7), y2: Y(v), stroke: "#d0d0d0", "stroke-width": "0.6" });
          }
          add("line", { x1: X(-7), y1: C, x2: X(7), y2: C, stroke: "#1a1a1a", "stroke-width": "1.2" });
          add("line", { x1: C, y1: Y(-7), x2: C, y2: Y(7), stroke: "#1a1a1a", "stroke-width": "1.2" });
          txt(add, X(7) - 2, C - 5, "Re", { "text-anchor": "end", "font-size": "10" });
          txt(add, C + 5, Y(7) + 10, "Im", { "font-size": "10" });
          if (m.th !== null) {
            var rr = 22, n = 40, i, d = "M " + (C + rr) + " " + C;
            for (i = 1; i <= n; i++) {
              var t = m.th * i / n;
              d += " L " + (C + rr * Math.cos(t)).toFixed(1) + " " + (C - rr * Math.sin(t)).toFixed(1);
            }
            add("path", { d: d, fill: "none", stroke: "#c0392b", "stroke-width": "1.4" });
            add("line", { x1: C, y1: C, x2: X(m.a), y2: Y(m.b), stroke: "#0b5cab", "stroke-width": "2" });
          }
          add("circle", { cx: X(m.a), cy: Y(m.b), r: 4, fill: "#0b5cab" });
          /* Label sits on the side of the point away from the nearer vertical edge, so it never leaves the viewBox. */
          var left = m.a < 0 ? m.a > -4 : m.a >= 4;
          txt(add, X(m.a) + (left ? -6 : 6), Y(m.b) + (m.b < 0 ? 14 : -6), "(" + m.a + ", " + m.b + ")", { "text-anchor": left ? "end" : "start", "font-size": "10" });
        }
      };
    };

    /* P1-9.6: area between y = qx - x^2 and the x-axis from x = a to x = b. */
    kinds["area-under"] = function () {
      return {
        viewBox: "0 0 360 240",
        label: "Graph of y = qx minus x squared with the area under the curve between x = a and x = b shaded",
        sliders: [
          { id: "q", label: "Constant q", min: 2, max: 8, step: 1, value: 6 },
          { id: "a", label: "Lower limit a", min: 0, max: 8, step: 0.5, value: 1 },
          { id: "b", label: "Upper limit b", min: 0, max: 8, step: 0.5, value: 4 }
        ],
        metrics: function (st) {
          var q = clamp(Math.round(st.q), 2, 8);
          var a = clamp(Math.round(Math.min(st.a, st.b) * 2) / 2, 0, q), b = clamp(Math.round(Math.max(st.a, st.b) * 2) / 2, 0, q);
          function F(x) { return q * x * x / 2 - x * x * x / 3; }
          return { q: q, a: a, b: b, Fa: F(a), Fb: F(b), A: F(b) - F(a) };
        },
        formula: function (st) {
          var m = kinds["area-under"]().metrics(st);
          return [
            "\\(\\displaystyle\\int_{" + numStr(m.a, 1) + "}^{" + numStr(m.b, 1) + "}(" + m.q + "x-x^2)\\,dx=\\left[\\tfrac{" + m.q + "}{2}x^2-\\tfrac{1}{3}x^3\\right]_{" + numStr(m.a, 1) + "}^{" + numStr(m.b, 1) + "}\\)",
            "\\(=" + numStr(m.Fb, 4) + "-" + (m.Fa < 0 ? "(" + sgn(m.Fa, 4) + ")" : numStr(m.Fa, 4)) + "=" + numStr(m.A, 4) + "\\)"
          ];
        },
        draw: function (svg, st) {
          var m = kinds["area-under"]().metrics(st);
          var add = adder(svg), L = 30, R = 345, T = 20, B = 200, x0 = -0.5, x1 = m.q + 0.5, ymax = m.q * m.q / 4 * 1.15, i, N = 120;
          function X(v) { return L + (v - x0) * (R - L) / (x1 - x0); }
          function Y(v) { return B - v * (B - T) / ymax; }
          function f(x) { return m.q * x - x * x; }
          var sh = "M " + X(m.a).toFixed(1) + " " + B;
          for (i = 0; i <= N; i++) { var xs = m.a + (m.b - m.a) * i / N; sh += " L " + X(xs).toFixed(1) + " " + Y(f(xs)).toFixed(1); }
          sh += " L " + X(m.b).toFixed(1) + " " + B + " Z";
          if (m.b > m.a) add("path", { d: sh, fill: "#0b5cab", "fill-opacity": "0.3", stroke: "none" });
          add("line", { x1: L, y1: B, x2: R, y2: B, stroke: "#1a1a1a", "stroke-width": "1.2" });
          add("line", { x1: X(0), y1: B + 8, x2: X(0), y2: T - 6, stroke: "#1a1a1a", "stroke-width": "1.2" });
          var d = "";
          for (i = 0; i <= N; i++) { var x = m.q * i / N; d += (i ? " L " : "M ") + X(x).toFixed(1) + " " + Y(f(x)).toFixed(1); }
          add("path", { d: d, fill: "none", stroke: "#c0392b", "stroke-width": "1.8" });
          for (i = 0; i <= m.q; i++) txt(add, X(i), B + 14, String(i), { "text-anchor": "middle", "font-size": "10" });
          txt(add, R, B - 6, "x", { "text-anchor": "end", "font-size": "11", "font-style": "italic" });
          txt(add, X(0) + 6, T + 4, "y", { "font-size": "11", "font-style": "italic" });
        }
      };
    };

    if (W.scan) W.scan(document);
  }

  register();
})(typeof window !== "undefined" ? window : this);
