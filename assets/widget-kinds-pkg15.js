/* pkg15 widget kinds. Registers on msWidget.kinds (the public registry
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
    if (W.kinds.__pkg15) {
      if (W.scan) W.scan(document);
      return;
    }
    var kinds = W.kinds;
    kinds.__pkg15 = true;

    function numStr(x, dp) {
      var s = Number(x).toFixed(dp);
      if (dp > 0) s = s.replace(/\.?0+$/, "");
      if (s === "-0") s = "0";
      return s;
    }
    function fact(n) { var r = 1; for (var i = 2; i <= n; i++) r *= i; return r; }
    function comb(n, r) {
      if (r < 0 || r > n) return 0;
      var c = 1;
      for (var i = 1; i <= r; i++) c = c * (n - r + i) / i;
      return Math.round(c);
    }
    function perm(n, r) { var p = 1; for (var i = 0; i < r; i++) p *= (n - i); return p; }
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

    /* S1-5.3: permutations and combinations of r objects from n. */
    kinds["perm-comb-counter"] = function () {
      return {
        viewBox: "0 0 360 200",
        label: "Choosing r objects from n: the number of arrangements and the number of selections",
        sliders: [
          { id: "n", label: "Number of objects n", min: 2, max: 8, step: 1, value: 5 },
          { id: "r", label: "Number chosen r", min: 1, max: 8, step: 1, value: 3 }
        ],
        metrics: function (st) {
          var n = Math.round(st.n), r = Math.min(Math.round(st.r), n);
          return { n: n, r: r, perm: perm(n, r), comb: comb(n, r), rfact: fact(r) };
        },
        formula: function (st) {
          var m = kinds["perm-comb-counter"]().metrics(st);
          return [
            "\\({}^{" + m.n + "}P_{" + m.r + "}=\\dfrac{" + m.n + "!}{" + (m.n - m.r) + "!}=" + m.perm + "\\)",
            "\\({}^{" + m.n + "}C_{" + m.r + "}=\\dfrac{" + m.perm + "}{" + m.r + "!}=" + m.comb + "\\)"
          ];
        },
        draw: function (svg, st) {
          var m = kinds["perm-comb-counter"]().metrics(st);
          var add = adder(svg);
          var gap = 330 / m.n, i, cx;
          txt(add, 16, 22, "Objects (chosen ones shaded)");
          for (i = 0; i < m.n; i++) {
            cx = 15 + gap * (i + 0.5);
            add("circle", { cx: cx, cy: 60, r: Math.min(18, gap / 2 - 3), fill: i < m.r ? "#0b5cab" : "#ffffff", "fill-opacity": i < m.r ? "0.35" : "1", stroke: "#1a1a1a", "stroke-width": "1.4" });
            txt(add, cx, 64, String.fromCharCode(65 + i), { "text-anchor": "middle", "font-size": "12" });
          }
          txt(add, 16, 112, "Ordered positions:");
          var bw = Math.min(40, 330 / Math.max(m.r, 1) - 6);
          for (i = 0; i < m.r; i++) {
            add("rect", { x: 16 + i * (bw + 6), y: 122, width: bw, height: 26, fill: "#ffffff", stroke: "#1a1a1a", "stroke-width": "1.2" });
            txt(add, 16 + i * (bw + 6) + bw / 2, 140, String(m.n - i), { "text-anchor": "middle" });
          }
          txt(add, 16, 172, "Each selection gives " + m.r + "! = " + m.rfact + (m.rfact === 1 ? " order, so" : " orders, so"), { "font-size": "12" });
          txt(add, 16, 190, "selections = " + m.perm + " ÷ " + m.rfact + " = " + m.comb, { "font-size": "12" });
        }
      };
    };

    /* P1-6.1: Pascal's triangle with one row highlighted. */
    kinds["pascal-triangle"] = function () {
      return {
        viewBox: "0 0 360 240",
        label: "Pascal's triangle with the row for (a + b) to the power n highlighted",
        sliders: [{ id: "n", label: "Power n", min: 1, max: 7, step: 1, value: 4 }],
        metrics: function (st) {
          var n = Math.round(st.n), row = [], k;
          for (k = 0; k <= n; k++) row.push(comb(n, k));
          return { n: n, row: row.join(","), total: Math.pow(2, n) };
        },
        formula: function (st) {
          var m = kinds["pascal-triangle"]().metrics(st);
          return [
            "Row " + m.n + ": " + m.row.split(",").join(", "),
            "Sum of the row \\(=2^{" + m.n + "}=" + m.total + "\\)"
          ];
        },
        draw: function (svg, st) {
          var n = Math.round(st.n), add = adder(svg), rr, k;
          for (rr = 0; rr <= 7; rr++) {
            for (k = 0; k <= rr; k++) {
              var x = 180 + (k - rr / 2) * 42, y = 22 + rr * 29;
              var on = rr === n;
              add("rect", { x: x - 19, y: y - 12, width: 38, height: 22, rx: 4, fill: on ? "#0b5cab" : "#f4f4f4", "fill-opacity": on ? "0.3" : "1", stroke: on ? "#0b5cab" : "#b0b0b0", "stroke-width": on ? "1.6" : "0.8" });
              txt(add, x, y + 4, String(comb(rr, k)), { "text-anchor": "middle", "font-size": "11" });
            }
          }
        }
      };
    };

    /* P1-6.3 and 6.4: terms of an arithmetic or geometric progression. */
    kinds["ap-gp-sequence"] = function () {
      return {
        viewBox: "0 0 360 240",
        label: "Bar chart of the first n terms of an arithmetic or a geometric progression, with their sum",
        sliders: [
          { id: "type", label: "Type (1 arithmetic, 2 geometric)", min: 1, max: 2, step: 1, value: 1 },
          { id: "a", label: "First term a", min: 1, max: 5, step: 1, value: 2 },
          { id: "k", label: "Common difference d or common ratio r", min: 1, max: 3, step: 0.5, value: 2 },
          { id: "n", label: "Number of terms n", min: 2, max: 8, step: 1, value: 5 }
        ],
        metrics: function (st) {
          var t = Math.round(st.type), a = st.a, k = st.k, n = Math.round(st.n), terms = [], i, s = 0;
          for (i = 0; i < n; i++) { var u = t === 1 ? a + i * k : a * Math.pow(k, i); terms.push(u); s += u; }
          return { type: t, a: a, k: k, n: n, last: terms[n - 1], sum: s, terms: terms.map(function (v) { return numStr(v, 2); }).join(",") };
        },
        formula: function (st) {
          var m = kinds["ap-gp-sequence"]().metrics(st);
          if (m.type === 1) {
            return [
              "\\(u_{" + m.n + "}=a+(n-1)d=" + numStr(m.a, 2) + "+" + (m.n - 1) + "\\times" + numStr(m.k, 2) + "=" + numStr(m.last, 2) + "\\)",
              "\\(S_{" + m.n + "}=\\tfrac{n}{2}(a+l)=" + numStr(m.sum, 2) + "\\)"
            ];
          }
          return [
            "\\(u_{" + m.n + "}=ar^{n-1}=" + numStr(m.a, 2) + "\\times" + numStr(m.k, 2) + "^{" + (m.n - 1) + "}=" + numStr(m.last, 2) + "\\)",
            m.k === 1 ? "\\(S_{" + m.n + "}=na=" + numStr(m.sum, 2) + "\\)" : "\\(S_{" + m.n + "}=\\dfrac{a(r^n-1)}{r-1}=" + numStr(m.sum, 2) + "\\)"
          ];
        },
        draw: function (svg, st) {
          var m = kinds["ap-gp-sequence"]().metrics(st), add = adder(svg);
          var x0 = 40, x1 = 345, yT = 16, yB = 205, terms = m.terms.split(",").map(Number);
          var mx = Math.max.apply(null, terms), i;
          var clipUrl = clipRect(add, "pkg15-apgp-plot", x0, yT - 2, x1 - x0, yB - yT + 2);
          add("line", { x1: x0, y1: yB, x2: x1, y2: yB, stroke: "#1a1a1a", "stroke-width": "1.2" });
          add("line", { x1: x0, y1: yB, x2: x0, y2: yT, stroke: "#1a1a1a", "stroke-width": "1.2" });
          var bw = (x1 - x0) / m.n;
          for (i = 0; i < m.n; i++) {
            var h = (yB - yT - 14) * terms[i] / mx;
            add("rect", { x: x0 + i * bw + 4, y: yB - h, width: bw - 8, height: h, fill: m.type === 1 ? "#0b5cab" : "#2e7d32", "fill-opacity": "0.35", stroke: m.type === 1 ? "#0b5cab" : "#2e7d32", "stroke-width": "1.2", "clip-path": clipUrl });
            txt(add, x0 + (i + 0.5) * bw, yB - h - 3, numStr(terms[i], 1), { "text-anchor": "middle", "font-size": "10" });
            txt(add, x0 + (i + 0.5) * bw, yB + 14, "u" + (i + 1), { "text-anchor": "middle", "font-size": "10" });
          }
        }
      };
    };

    /* IGCSE-20.1: unequal class widths, frequency density on the vertical axis. */
    kinds["fd-histogram"] = function () {
      var F = [12, 30, 24];
      return {
        viewBox: "0 0 360 250",
        label: "Histogram with unequal class widths: frequency density is frequency divided by class width",
        sliders: [
          { id: "w", label: "Width of the middle class", min: 5, max: 30, step: 5, value: 10 },
          { id: "f", label: "Frequency of the middle class", min: 10, max: 60, step: 5, value: 30 }
        ],
        metrics: function (st) {
          var w = Math.round(st.w), f = Math.round(st.f);
          return { w: w, f: f, fd: f / w, fd1: F[0] / 10, fd3: F[2] / 20 };
        },
        formula: function (st) {
          var m = kinds["fd-histogram"]().metrics(st);
          return [
            "Middle class \\(10\\lt x\\le" + (10 + m.w) + "\\): frequency density \\(=\\dfrac{" + m.f + "}{" + m.w + "}=" + numStr(m.fd, 2) + "\\)",
            "Area of the column \\(=" + numStr(m.fd, 2) + "\\times" + m.w + "=" + m.f + "\\)"
          ];
        },
        draw: function (svg, st) {
          var m = kinds["fd-histogram"]().metrics(st), add = adder(svg);
          var L = 50, R = 345, T = 14, B = 210, xmax = 60, ymax = Math.max(6, 2 * Math.ceil(m.fd / 2)), ystep = ymax > 6 ? 2 : 1;
          function X(v) { return L + v * (R - L) / xmax; }
          function Y(v) { return B - v * (B - T) / ymax; }
          var clipUrl = clipRect(add, "pkg15-fd-plot", L, T, R - L, B - T);
          var v;
          for (v = 0; v <= xmax; v += 10) {
            add("line", { x1: X(v), y1: T, x2: X(v), y2: B, stroke: "#dddddd", "stroke-width": "0.6" });
            txt(add, X(v), B + 14, String(v), { "text-anchor": "middle", "font-size": "10" });
          }
          for (v = 0; v <= ymax; v += ystep) {
            add("line", { x1: L, y1: Y(v), x2: R, y2: Y(v), stroke: "#dddddd", "stroke-width": "0.6" });
            txt(add, L - 6, Y(v) + 3, String(v), { "text-anchor": "end", "font-size": "10" });
          }
          add("line", { x1: L, y1: B, x2: R, y2: B, stroke: "#1a1a1a", "stroke-width": "1.2" });
          add("line", { x1: L, y1: B, x2: L, y2: T, stroke: "#1a1a1a", "stroke-width": "1.2" });
          txt(add, (L + R) / 2, B + 32, "x", { "text-anchor": "middle", "font-style": "italic", "font-family": "serif", "font-size": "13" });
          txt(add, 4, T + 4, "FD", { "font-size": "10" });
          var cls = [[0, 10, m.fd1], [10, 10 + m.w, m.fd], [10 + m.w, 30 + m.w, m.fd3]];
          cls.forEach(function (c, i) {
            add("rect", { x: X(c[0]), y: Y(Math.min(c[2], ymax)), width: X(c[1]) - X(c[0]), height: Y(0) - Y(Math.min(c[2], ymax)), fill: i === 1 ? "#0b5cab" : "#9e9e9e", "fill-opacity": "0.35", stroke: "#1a1a1a", "stroke-width": "1.3", "clip-path": clipUrl });
          });
        }
      };
    };

    /* IGCSE-20.2: cumulative frequency polygon with median and quartiles. */
    kinds["cumulative-frequency-curve"] = function () {
      var UB = [0, 20, 40, 60, 80, 100];
      return {
        viewBox: "0 0 360 250",
        label: "Cumulative frequency diagram with read-offs for the lower quartile, median and upper quartile",
        sliders: [
          { id: "f2", label: "Frequency of the class 20 to 40", min: 5, max: 40, step: 1, value: 22 },
          { id: "f3", label: "Frequency of the class 40 to 60", min: 5, max: 40, step: 1, value: 34 }
        ],
        metrics: function (st) {
          var fr = [8, Math.round(st.f2), Math.round(st.f3), 26, 10], cf = [0], i;
          for (i = 0; i < fr.length; i++) cf.push(cf[i] + fr[i]);
          var n = cf[cf.length - 1];
          function read(c) {
            for (var j = 1; j < cf.length; j++) {
              if (c <= cf[j]) return UB[j - 1] + (c - cf[j - 1]) * (UB[j] - UB[j - 1]) / (cf[j] - cf[j - 1]);
            }
            return UB[UB.length - 1];
          }
          var lq = read(n / 4), med = read(n / 2), uq = read(3 * n / 4);
          return { n: n, cf: cf.join(","), lq: Math.round(lq * 10) / 10, median: Math.round(med * 10) / 10, uq: Math.round(uq * 10) / 10, iqr: Math.round((uq - lq) * 10) / 10 };
        },
        formula: function (st) {
          var m = kinds["cumulative-frequency-curve"]().metrics(st);
          return [
            "\\(n=" + m.n + "\\): median read at \\(" + numStr(m.n / 2, 2) + "\\), about \\(" + numStr(m.median, 1) + "\\)",
            "Quartiles about \\(" + numStr(m.lq, 1) + "\\) and \\(" + numStr(m.uq, 1) + "\\), interquartile range about \\(" + numStr(m.iqr, 1) + "\\)"
          ];
        },
        draw: function (svg, st) {
          var m = kinds["cumulative-frequency-curve"]().metrics(st), add = adder(svg);
          var cf = m.cf.split(",").map(Number);
          var L = 50, R = 345, T = 14, B = 210, ymax = 140;
          function X(v) { return L + v * (R - L) / 100; }
          function Y(v) { return B - v * (B - T) / ymax; }
          var clipUrl = clipRect(add, "pkg15-cf-plot", L, T, R - L, B - T);
          var v;
          for (v = 0; v <= 100; v += 20) {
            add("line", { x1: X(v), y1: T, x2: X(v), y2: B, stroke: "#dddddd", "stroke-width": "0.6" });
            txt(add, X(v), B + 14, String(v), { "text-anchor": "middle", "font-size": "10" });
          }
          for (v = 0; v <= ymax; v += 20) {
            add("line", { x1: L, y1: Y(v), x2: R, y2: Y(v), stroke: "#dddddd", "stroke-width": "0.6" });
            txt(add, L - 6, Y(v) + 3, String(v), { "text-anchor": "end", "font-size": "10" });
          }
          add("line", { x1: L, y1: B, x2: R, y2: B, stroke: "#1a1a1a", "stroke-width": "1.2" });
          add("line", { x1: L, y1: B, x2: L, y2: T, stroke: "#1a1a1a", "stroke-width": "1.2" });
          txt(add, (L + R) / 2, B + 32, "Upper class boundary", { "text-anchor": "middle", "font-size": "10" });
          txt(add, 4, T + 4, "CF", { "font-size": "10" });
          [[m.n / 4, m.lq], [m.n / 2, m.median], [3 * m.n / 4, m.uq]].forEach(function (p) {
            add("path", { d: "M " + L + " " + Y(p[0]).toFixed(2) + " H " + X(p[1]).toFixed(2) + " V " + B, fill: "none", stroke: "#c0392b", "stroke-width": "1.1", "stroke-dasharray": "4 3", "clip-path": clipUrl });
          });
          var pts = cf.map(function (c, i) { return X(UB[i]).toFixed(2) + "," + Y(c).toFixed(2); });
          add("polyline", { points: pts.join(" "), fill: "none", stroke: "#0b5cab", "stroke-width": "2", "clip-path": clipUrl });
          cf.forEach(function (c, i) { if (i > 0) add("circle", { cx: X(UB[i]), cy: Y(c), r: 3, fill: "#0b5cab" }); });
        }
      };
    };

    if (W.scan) W.scan(document);
  }

  register();
})(typeof window !== "undefined" ? window : this);
