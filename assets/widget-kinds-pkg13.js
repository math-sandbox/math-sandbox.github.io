/* pkg13 widget kinds. Registers on msWidget.kinds (the public registry
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
    if (W.kinds.__pkg13) {
      if (W.scan) W.scan(document);
      return;
    }
    var fmt = W.fmt;
    var kinds = W.kinds;
    kinds.__pkg13 = true;

    kinds["tangent-gradient"] = function () {
      return {
        viewBox: "0 0 400 280",
        label: "Tangent to y = x squared over 4, with gradient from rise over run",
        sliders: [
          { id: "x0", label: "x-coordinate of the point", min: 0.5, max: 3.5, step: 0.1, value: 2 }
        ],
        metrics: function (st) {
          var x = st.x0;
          var y = (x * x) / 4;
          var m = x / 2;
          return { x: x, y: y, m: m };
        },
        formula: function (st) {
          var m = kinds["tangent-gradient"]().metrics(st);
          return [
            "\\(y=x^2/4\\) at \\(x=" + fmt(m.x, 1) + "\\)",
            "\\(\\text{gradient}=" + fmt(m.m, 2) + "\\)"
          ];
        },
        draw: function (svg, st, el) {
          var Wd = 400, H = 280, pad = 32;
          var xmin = -0.4, xmax = 4.2, ymin = -0.4, ymax = 5.2;
          function X(x) { return pad + (x - xmin) / (xmax - xmin) * (Wd - 2 * pad); }
          function Y(y) { return H - pad - (y - ymin) / (ymax - ymin) * (H - 2 * pad); }
          svg.appendChild(el("line", { x1: X(xmin), y1: Y(0), x2: X(xmax), y2: Y(0), stroke: "#9ca3af", "stroke-width": 1 }));
          svg.appendChild(el("line", { x1: X(0), y1: Y(ymin), x2: X(0), y2: Y(ymax), stroke: "#9ca3af", "stroke-width": 1 }));
          var d = "", pen = false, i, x, y;
          for (i = 0; i <= 160; i++) {
            x = xmin + i * (xmax - xmin) / 160;
            y = (x * x) / 4;
            if (y < ymin - 0.3 || y > ymax + 0.3) { pen = false; continue; }
            d += (pen ? " L " : "M ") + X(x) + " " + Y(y);
            pen = true;
          }
          if (d) svg.appendChild(el("path", { d: d, fill: "none", stroke: "#1d4ed8", "stroke-width": 2 }));
          var mtr = kinds["tangent-gradient"]().metrics(st);
          var x1 = Math.max(xmin, mtr.x - 1.6), x2 = Math.min(xmax, mtr.x + 1.6);
          var y1 = mtr.y + mtr.m * (x1 - mtr.x), y2 = mtr.y + mtr.m * (x2 - mtr.x);
          svg.appendChild(el("line", { x1: X(x1), y1: Y(y1), x2: X(x2), y2: Y(y2), stroke: "#b91c1c", "stroke-width": 1.8 }));
          svg.appendChild(el("circle", { cx: X(mtr.x), cy: Y(mtr.y), r: 4, fill: "#111827" }));
          var run = 1;
          if (mtr.x + run <= xmax - 0.15 && mtr.y + mtr.m * run <= ymax - 0.15 && mtr.y + mtr.m * run >= ymin + 0.15) {
            var rx = mtr.x + run, ry0 = mtr.y, ry1 = mtr.y + mtr.m * run;
            svg.appendChild(el("line", { x1: X(mtr.x), y1: Y(ry0), x2: X(rx), y2: Y(ry0), stroke: "#047857", "stroke-width": 1.6 }));
            svg.appendChild(el("line", { x1: X(rx), y1: Y(ry0), x2: X(rx), y2: Y(ry1), stroke: "#047857", "stroke-width": 1.6 }));
            var tr = el("text", { x: (X(mtr.x) + X(rx)) / 2, y: Y(ry0) + 14, fill: "#047857", "font-size": 11, "font-family": "system-ui,sans-serif", "text-anchor": "middle" });
            tr.textContent = "run";
            svg.appendChild(tr);
            var ti = el("text", { x: X(rx) + 6, y: (Y(ry0) + Y(ry1)) / 2, fill: "#047857", "font-size": 11, "font-family": "system-ui,sans-serif" });
            ti.textContent = "rise";
            svg.appendChild(ti);
          }
        }
      };
    };

    kinds["cobweb-iteration"] = function () {
      return {
        viewBox: "0 0 400 300",
        label: "Cobweb diagram for the iteration x maps to (2x + 5) / (x + 1)",
        sliders: [
          { id: "x1", label: "Starting value x₁", min: 0.5, max: 5, step: 0.1, value: 2 },
          { id: "n", label: "Number of iterations", min: 1, max: 8, step: 1, value: 4 }
        ],
        metrics: function (st) {
          var xs = [st.x1], i, x = st.x1, n = Math.round(st.n);
          function F(t) { return (2 * t + 5) / (t + 1); }
          for (i = 0; i < n; i++) { x = F(x); xs.push(x); }
          return { xs: xs, last: xs[xs.length - 1], n: n };
        },
        formula: function (st) {
          var m = kinds["cobweb-iteration"]().metrics(st);
          return [
            "\\(x_{n+1}=\\dfrac{2x_n+5}{x_n+1}\\)",
            "\\(x_{" + (m.n + 1) + "}=" + fmt(m.last, 3) + "\\)"
          ];
        },
        draw: function (svg, st, el) {
          var Wd = 400, H = 300, pad = 32;
          var xmin = 0, xmax = 6, ymin = 0, ymax = 6;
          function X(x) { return pad + (x - xmin) / (xmax - xmin) * (Wd - 2 * pad); }
          function Y(y) { return H - pad - (y - ymin) / (ymax - ymin) * (H - 2 * pad); }
          svg.appendChild(el("line", { x1: X(xmin), y1: Y(0), x2: X(xmax), y2: Y(0), stroke: "#9ca3af", "stroke-width": 1 }));
          svg.appendChild(el("line", { x1: X(0), y1: Y(ymin), x2: X(0), y2: Y(ymax), stroke: "#9ca3af", "stroke-width": 1 }));
          svg.appendChild(el("line", { x1: X(0), y1: Y(0), x2: X(6), y2: Y(6), stroke: "#1d4ed8", "stroke-width": 1.6 }));
          /* y = (2x+5)/(x+1) */
          var d = "", pen = false, i, x, y;
          for (i = 0; i <= 160; i++) {
            x = 0.05 + i * (xmax - 0.05) / 160;
            y = (2 * x + 5) / (x + 1);
            if (y < ymin - 0.3 || y > ymax + 0.3) { pen = false; continue; }
            d += (pen ? " L " : "M ") + X(x) + " " + Y(y);
            pen = true;
          }
          if (d) svg.appendChild(el("path", { d: d, fill: "none", stroke: "#b91c1c", "stroke-width": 1.8 }));
          var m = kinds["cobweb-iteration"]().metrics(st);
          var xs = m.xs, path = "M " + X(xs[0]) + " " + Y(0), k;
          for (k = 0; k < xs.length - 1; k++) {
            path += " L " + X(xs[k]) + " " + Y(xs[k + 1]) + " L " + X(xs[k + 1]) + " " + Y(xs[k + 1]);
          }
          svg.appendChild(el("path", { d: path, fill: "none", stroke: "#047857", "stroke-width": 1.6 }));
          svg.appendChild(el("circle", { cx: X(xs[0]), cy: Y(0), r: 3, fill: "#047857" }));
        }
      };
    };

    kinds["unit-circle-angle"] = function () {
      return {
        viewBox: "0 0 400 320",
        label: "Rotating line OP on the unit circle, showing the quadrant and the basic angle",
        sliders: [
          { id: "deg", label: "Angle in degrees", min: -180, max: 360, step: 5, value: 120 }
        ],
        metrics: function (st) {
          var deg = st.deg;
          var twopi = 360;
          var red = ((deg % twopi) + twopi) % twopi; /* 0 to 360 */
          var quad, basic;
          if (red === 0 || red === 180 || red === 360) { quad = 0; basic = 0; }
          else if (red === 90 || red === 270) { quad = 0; basic = 90; }
          else if (red < 90) { quad = 1; basic = red; }
          else if (red < 180) { quad = 2; basic = 180 - red; }
          else if (red < 270) { quad = 3; basic = red - 180; }
          else { quad = 4; basic = 360 - red; }
          var rad = deg * Math.PI / 180;
          return { deg: deg, red: red, quad: quad, basic: basic, c: Math.cos(rad), s: Math.sin(rad) };
        },
        formula: function (st) {
          var m = kinds["unit-circle-angle"]().metrics(st);
          var qlab = m.quad === 0 ? "on an axis" : ("quadrant " + m.quad);
          function degStr(x) { return String(Math.round(x)); }
          return [
            "\\(\\theta=" + degStr(m.deg) + "^\\circ\\)",
            qlab + ", basic angle \\(" + degStr(m.basic) + "^\\circ\\)",
            "\\(\\cos\\theta=" + fmt(m.c, 2) + ",\\ \\sin\\theta=" + fmt(m.s, 2) + "\\)"
          ];
        },
        draw: function (svg, st, el) {
          var Wd = 400, H = 320, cx = 200, cy = 165, R = 110;
          svg.appendChild(el("circle", { cx: cx, cy: cy, r: R, fill: "none", stroke: "#9ca3af", "stroke-width": 1.3 }));
          svg.appendChild(el("line", { x1: cx - R - 24, y1: cy, x2: cx + R + 24, y2: cy, stroke: "#6b7280", "stroke-width": 1.2 }));
          svg.appendChild(el("line", { x1: cx, y1: cy + R + 24, x2: cx, y2: cy - R - 24, stroke: "#6b7280", "stroke-width": 1.2 }));
          var tx = el("text", { x: cx + R + 28, y: cy + 4, fill: "#111827", "font-size": 13, "font-family": "Times,serif", "font-style": "italic" });
          tx.textContent = "x";
          svg.appendChild(tx);
          var ty = el("text", { x: cx + 8, y: cy - R - 26, fill: "#111827", "font-size": 13, "font-family": "Times,serif", "font-style": "italic" });
          ty.textContent = "y";
          svg.appendChild(ty);
          var m = kinds["unit-circle-angle"]().metrics(st);
          var px = cx + R * m.c, py = cy - R * m.s;
          svg.appendChild(el("line", { x1: cx, y1: cy, x2: px, y2: py, stroke: "#1d4ed8", "stroke-width": 2.2 }));
          svg.appendChild(el("circle", { cx: px, cy: py, r: 4, fill: "#1d4ed8" }));
          var tp = el("text", { x: px + 8, y: py - 6, fill: "#1d4ed8", "font-size": 13, "font-family": "Times,serif", "font-style": "italic" });
          tp.textContent = "P";
          svg.appendChild(tp);
          /* basic-angle arc between OP and the nearer x-axis */
          if (m.basic > 0 && m.basic < 90) {
            var rA = 28, axisDeg;
            if (m.quad === 1) axisDeg = 0;
            else if (m.quad === 2 || m.quad === 3) axisDeg = 180;
            else axisDeg = 360;
            var a0 = Math.min(axisDeg, m.red) * Math.PI / 180;
            var a1 = Math.max(axisDeg, m.red) * Math.PI / 180;
            if (m.quad === 4) { a0 = m.red * Math.PI / 180; a1 = 2 * Math.PI; }
            var sx = cx + rA * Math.cos(a0), sy = cy - rA * Math.sin(a0);
            var ex = cx + rA * Math.cos(a1), ey = cy - rA * Math.sin(a1);
            var sweep = 0;
            if (m.quad === 2) { /* 120 to 180: start at 180 down to 120, clockwise in math? We'll start at axis and go to OP */
              sx = cx + rA * Math.cos(Math.PI); sy = cy - rA * Math.sin(Math.PI);
              ex = cx + rA * m.c; ey = cy - rA * m.s;
              sweep = 0;
            } else if (m.quad === 3) {
              sx = cx + rA * Math.cos(Math.PI); sy = cy - rA * Math.sin(Math.PI);
              ex = cx + rA * m.c; ey = cy - rA * m.s;
              sweep = 1;
            } else if (m.quad === 4) {
              sx = cx + rA; sy = cy;
              ex = cx + rA * m.c; ey = cy - rA * m.s;
              sweep = 1;
            } else {
              sx = cx + rA; sy = cy;
              ex = cx + rA * m.c; ey = cy - rA * m.s;
              sweep = 0;
            }
            svg.appendChild(el("path", { d: "M " + sx + " " + sy + " A " + rA + " " + rA + " 0 0 " + sweep + " " + ex + " " + ey, fill: "none", stroke: "#b45309", "stroke-width": 1.8 }));
          }
          /* CAST labels */
          function lab(x, y, s) {
            var t = el("text", { x: x, y: y, fill: "#6b7280", "font-size": 11, "font-family": "system-ui,sans-serif" });
            t.textContent = s;
            svg.appendChild(t);
          }
          lab(cx + 20, cy - 20, "All +");
          lab(cx - 70, cy - 20, "sin +");
          lab(cx - 70, cy + 28, "tan +");
          lab(cx + 20, cy + 28, "cos +");
        }
      };
    };

    if (W.scan && typeof document !== "undefined") W.scan(document);
  }

  if (typeof document !== "undefined" && document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", register);
  } else {
    register();
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { register: register };
  }
})(typeof window !== "undefined" ? window : global);
