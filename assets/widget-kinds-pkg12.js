/* pkg12 widget kinds. Registers on msWidget.kinds (the public registry
   in assets/widget.js) without editing widget.js or widget.css. After
   registering, scan() is called again so mounts that were skipped on
   the first pass (script load is async) are picked up. */
(function (root) {
  "use strict";

  function fact(n) {
    var p = 1, i;
    for (i = 2; i <= n; i++) p *= i;
    return p;
  }

  /* Poisson P(X=x) in log space for stability. */
  function poissonP(lambda, x) {
    if (!(lambda > 0) || x < 0 || x !== Math.floor(x)) return NaN;
    if (lambda === 0) return x === 0 ? 1 : 0;
    var logp = -lambda + x * Math.log(lambda) - Math.log(fact(x));
    return Math.exp(logp);
  }

  function register() {
    var W = root.msWidget;
    if (!W || !W.kinds) {
      if (typeof document !== "undefined") setTimeout(register, 30);
      return;
    }
    if (W.kinds.__pkg12) {
      if (W.scan) W.scan(document);
      return;
    }
    var fmt = W.fmt;
    var kinds = W.kinds;
    kinds.__pkg12 = true;

    kinds.composition = function () {
      return {
        viewBox: "0 0 400 280",
        label: "Composition of functions fg and gf",
        sliders: [
          { id: "a", label: "a in f(x) = ax + 1", min: 0.5, max: 3, step: 0.1, value: 2 },
          { id: "x0", label: "x", min: -2.5, max: 2.5, step: 0.1, value: 1 }
        ],
        metrics: function (st) {
          var a = st.a, x = st.x0;
          var fx = a * x + 1;
          var gx = x * x;
          var fg = a * gx + 1;          /* f(g(x)) = a x^2 + 1 */
          var gf = (a * x + 1) * (a * x + 1); /* g(f(x)) = (ax+1)^2 */
          return { a: a, x: x, fx: fx, gx: gx, fg: fg, gf: gf };
        },
        formula: function (st) {
          var m = kinds.composition().metrics(st);
          return [
            "\\(f(x)=" + fmt(st.a, 1) + "x+1,\\ g(x)=x^2\\)",
            "\\((fg)(" + fmt(st.x0, 1) + ")=" + fmt(m.fg, 2) + "\\)",
            "\\((gf)(" + fmt(st.x0, 1) + ")=" + fmt(m.gf, 2) + "\\)"
          ];
        },
        draw: function (svg, st, el) {
          var Wd = 400, H = 280, pad = 28;
          var xmin = -4, xmax = 4, ymin = -2, ymax = 12;
          function X(x) { return pad + (x - xmin) / (xmax - xmin) * (Wd - 2 * pad); }
          function Y(y) { return H - pad - (y - ymin) / (ymax - ymin) * (H - 2 * pad); }
          svg.appendChild(el("line", { x1: X(xmin), y1: Y(0), x2: X(xmax), y2: Y(0), stroke: "#9ca3af", "stroke-width": 1 }));
          svg.appendChild(el("line", { x1: X(0), y1: Y(ymin), x2: X(0), y2: Y(ymax), stroke: "#9ca3af", "stroke-width": 1 }));
          function plot(fn, color) {
            var d = "", pen = false, i, x, y;
            for (i = 0; i <= 120; i++) {
              x = xmin + i * (xmax - xmin) / 120;
              y = fn(x);
              if (y < ymin - 0.5 || y > ymax + 0.5) { pen = false; continue; }
              d += (pen ? " L " : "M ") + X(x) + " " + Y(y);
              pen = true;
            }
            if (d) svg.appendChild(el("path", { d: d, fill: "none", stroke: color, "stroke-width": 2 }));
          }
          plot(function (x) { return st.a * x * x + 1; }, "#2563eb");
          plot(function (x) { var u = st.a * x + 1; return u * u; }, "#b91c1c");
          var fg = st.a * st.x0 * st.x0 + 1;
          var gf = (st.a * st.x0 + 1) * (st.a * st.x0 + 1);
          if (st.x0 >= xmin && st.x0 <= xmax) {
            if (fg >= ymin && fg <= ymax) {
              svg.appendChild(el("circle", { cx: X(st.x0), cy: Y(fg), r: 5, fill: "#2563eb" }));
            }
            if (gf >= ymin && gf <= ymax) {
              svg.appendChild(el("circle", { cx: X(st.x0), cy: Y(gf), r: 5, fill: "#b91c1c" }));
            }
          }
          var t1 = el("text", { x: X(2.1), y: Y(11.2), fill: "#2563eb", "font-size": 12, "font-family": "system-ui,sans-serif" });
          t1.textContent = "y = (fg)(x)";
          svg.appendChild(t1);
          var t2 = el("text", { x: X(2.1), y: Y(10.1), fill: "#b91c1c", "font-size": 12, "font-family": "system-ui,sans-serif" });
          t2.textContent = "y = (gf)(x)";
          svg.appendChild(t2);
        }
      };
    };

    kinds.inverse = function () {
      return {
        viewBox: "0 0 400 280",
        label: "Inverse as a reflection in the line y = x",
        sliders: [
          { id: "a", label: "Gradient a", min: 0.4, max: 3, step: 0.1, value: 2 },
          { id: "b", label: "Intercept b", min: -3, max: 3, step: 0.2, value: -1 },
          { id: "x0", label: "x on y = f(x)", min: -3, max: 3, step: 0.1, value: 1 }
        ],
        metrics: function (st) {
          var a = st.a, b = st.b, x = st.x0;
          var y = a * x + b;
          var invX = y;           /* reflection of (x, y) in y=x is (y, x) */
          var invY = x;
          var invAtY = (y - b) / a; /* f^{-1}(y) should equal x */
          return { a: a, b: b, x: x, y: y, invX: invX, invY: invY, check: invAtY };
        },
        formula: function (st) {
          var m = kinds.inverse().metrics(st);
          return [
            "\\(f(x)=" + fmt(st.a, 1) + "x+" + fmt(st.b, 1) + "\\)",
            "\\(f^{-1}(x)=\\dfrac{x-(" + fmt(st.b, 1) + ")}{" + fmt(st.a, 1) + "}\\)",
            "\\(f(" + fmt(st.x0, 1) + ")=" + fmt(m.y, 2) + "\\), reflected to \\((" + fmt(m.y, 2) + "," + fmt(st.x0, 1) + ")\\)"
          ];
        },
        draw: function (svg, st, el) {
          var Wd = 400, H = 280, pad = 28;
          var xmin = -6, xmax = 6, ymin = -6, ymax = 6;
          function X(x) { return pad + (x - xmin) / (xmax - xmin) * (Wd - 2 * pad); }
          function Y(y) { return H - pad - (y - ymin) / (ymax - ymin) * (H - 2 * pad); }
          svg.appendChild(el("line", { x1: X(xmin), y1: Y(0), x2: X(xmax), y2: Y(0), stroke: "#9ca3af", "stroke-width": 1 }));
          svg.appendChild(el("line", { x1: X(0), y1: Y(ymin), x2: X(0), y2: Y(ymax), stroke: "#9ca3af", "stroke-width": 1 }));
          /* y = x */
          svg.appendChild(el("line", {
            x1: X(xmin), y1: Y(xmin), x2: X(xmax), y2: Y(xmax),
            stroke: "#6b7280", "stroke-width": 1.5, "stroke-dasharray": "5 4"
          }));
          function clipLine(m, c, color, width) {
            /* y = m x + c, clip to window */
            var pts = [];
            function add(x, y) {
              if (x >= xmin - 1e-9 && x <= xmax + 1e-9 && y >= ymin - 1e-9 && y <= ymax + 1e-9) pts.push([x, y]);
            }
            add(xmin, m * xmin + c);
            add(xmax, m * xmax + c);
            if (Math.abs(m) > 1e-12) {
              add((ymin - c) / m, ymin);
              add((ymax - c) / m, ymax);
            } else {
              add(xmin, c); add(xmax, c);
            }
            pts.sort(function (p, q) { return p[0] - q[0] || p[1] - q[1]; });
            /* unique */
            var u = [];
            pts.forEach(function (p) {
              if (!u.length || Math.hypot(p[0] - u[u.length - 1][0], p[1] - u[u.length - 1][1]) > 1e-8) u.push(p);
            });
            if (u.length >= 2) {
              svg.appendChild(el("line", {
                x1: X(u[0][0]), y1: Y(u[0][1]), x2: X(u[u.length - 1][0]), y2: Y(u[u.length - 1][1]),
                stroke: color, "stroke-width": width
              }));
            }
          }
          clipLine(st.a, st.b, "#2563eb", 2);
          /* inverse: y = (x - b)/a = x/a - b/a */
          clipLine(1 / st.a, -st.b / st.a, "#b91c1c", 2);
          var y = st.a * st.x0 + st.b;
          if (st.x0 >= xmin && st.x0 <= xmax && y >= ymin && y <= ymax) {
            svg.appendChild(el("circle", { cx: X(st.x0), cy: Y(y), r: 5, fill: "#2563eb" }));
          }
          if (y >= xmin && y <= xmax && st.x0 >= ymin && st.x0 <= ymax) {
            svg.appendChild(el("circle", { cx: X(y), cy: Y(st.x0), r: 5, fill: "#b91c1c" }));
            /* light segment between a point and its reflection */
            if (st.x0 >= xmin && st.x0 <= xmax && y >= ymin && y <= ymax) {
              svg.appendChild(el("line", {
                x1: X(st.x0), y1: Y(y), x2: X(y), y2: Y(st.x0),
                stroke: "#9ca3af", "stroke-width": 1, "stroke-dasharray": "3 3"
              }));
            }
          }
          var t1 = el("text", { x: X(-5.6), y: Y(5.5), fill: "#2563eb", "font-size": 12, "font-family": "system-ui,sans-serif" });
          t1.textContent = "y = f(x)";
          svg.appendChild(t1);
          var t2 = el("text", { x: X(-5.6), y: Y(4.5), fill: "#b91c1c", "font-size": 12, "font-family": "system-ui,sans-serif" });
          t2.textContent = "y = f⁻¹(x)";
          svg.appendChild(t2);
          var t3 = el("text", { x: X(3.2), y: Y(4.4), fill: "#6b7280", "font-size": 11, "font-family": "system-ui,sans-serif" });
          t3.textContent = "y = x";
          svg.appendChild(t3);
        }
      };
    };

    kinds.histogram = function () {
      /* Three classes on [0, 20] with fixed frequencies 8, 16, 12 (total 36).
         Sliders move the two interior boundaries so class widths, and therefore
         frequency densities, change. The modal class is the one with the
         greatest frequency density. */
      var F = [8, 16, 12];
      var END = 20;
      return {
        viewBox: "0 0 400 280",
        label: "Histogram: class widths and frequency density",
        sliders: [
          { id: "a", label: "Boundary a (end of first class)", min: 3, max: 10, step: 0.5, value: 5 },
          { id: "b", label: "Boundary b (end of second class)", min: 11, max: 17, step: 0.5, value: 13 }
        ],
        metrics: function (st) {
          var a = st.a, b = st.b;
          var w = [a, b - a, END - b];
          var fd = [F[0] / w[0], F[1] / w[1], F[2] / w[2]];
          var modal = 0;
          if (fd[1] > fd[modal]) modal = 1;
          if (fd[2] > fd[modal]) modal = 2;
          return {
            a: a, b: b,
            w0: w[0], w1: w[1], w2: w[2],
            fd0: fd[0], fd1: fd[1], fd2: fd[2],
            modal: modal,
            f0: F[0], f1: F[1], f2: F[2]
          };
        },
        formula: function (st) {
          var m = kinds.histogram().metrics(st);
          var names = ["0 to " + fmt(st.a, 1), fmt(st.a, 1) + " to " + fmt(st.b, 1), fmt(st.b, 1) + " to 20"];
          return [
            "\\(\\text{frequency density}=\\dfrac{\\text{frequency}}{\\text{class width}}\\)",
            "\\(\\text{FD}= " + fmt(m.fd0, 2) + ",\\ " + fmt(m.fd1, 2) + ",\\ " + fmt(m.fd2, 2) + "\\)",
            "Modal class: " + names[m.modal] + " (greatest FD)"
          ];
        },
        draw: function (svg, st, el) {
          var m = kinds.histogram().metrics(st);
          var Wd = 400, H = 280, padL = 40, padR = 16, padT = 16, padB = 36;
          var xmax = 20, ymax = 6;
          function X(x) { return padL + x / xmax * (Wd - padL - padR); }
          function Y(y) { return H - padB - y / ymax * (H - padT - padB); }
          svg.appendChild(el("line", { x1: X(0), y1: Y(0), x2: X(xmax), y2: Y(0), stroke: "#9ca3af", "stroke-width": 1 }));
          svg.appendChild(el("line", { x1: X(0), y1: Y(0), x2: X(0), y2: Y(ymax), stroke: "#9ca3af", "stroke-width": 1 }));
          var edges = [0, st.a, st.b, END];
          var fds = [m.fd0, m.fd1, m.fd2];
          var i;
          for (i = 0; i < 3; i++) {
            var x1 = X(edges[i]), x2 = X(edges[i + 1]), y0 = Y(0), y1 = Y(fds[i]);
            var fill = i === m.modal ? "#93c5fd" : "#dbeafe";
            var stroke = i === m.modal ? "#1d4ed8" : "#2563eb";
            svg.appendChild(el("rect", {
              x: Math.min(x1, x2), y: Math.min(y0, y1),
              width: Math.max(1, Math.abs(x2 - x1)),
              height: Math.max(0, Math.abs(y0 - y1)),
              fill: fill, stroke: stroke, "stroke-width": 1.5
            }));
            var mid = (edges[i] + edges[i + 1]) / 2;
            var tx = el("text", {
              x: X(mid), y: Y(fds[i]) - 6,
              fill: "#1d2433", "font-size": 11, "font-family": "system-ui,sans-serif",
              "text-anchor": "middle"
            });
            tx.textContent = fmt(fds[i], 2);
            svg.appendChild(tx);
          }
          [0, st.a, st.b, END].forEach(function (v) {
            var lab = el("text", {
              x: X(v), y: Y(0) + 16,
              fill: "#6b7280", "font-size": 11, "font-family": "system-ui,sans-serif",
              "text-anchor": "middle"
            });
            lab.textContent = fmt(v, 1);
            svg.appendChild(lab);
          });
          var ylab = el("text", {
            x: 8, y: 14, fill: "#6b7280", "font-size": 11, "font-family": "system-ui,sans-serif"
          });
          ylab.textContent = "FD";
          svg.appendChild(ylab);
        }
      };
    };

    kinds.poisson = function () {
      var XMAX = 16;
      return {
        viewBox: "0 0 400 280",
        label: "Poisson distribution P(X = x) for a chosen λ",
        sliders: [
          { id: "lambda", label: "Mean λ", min: 0.5, max: 10, step: 0.1, value: 2.4 }
        ],
        metrics: function (st) {
          var lam = st.lambda, i, p, out = { lambda: lam };
          for (i = 0; i <= 8; i++) out["p" + i] = poissonP(lam, i);
          out.mean = lam;
          out.var = lam;
          return out;
        },
        formula: function (st) {
          var lam = st.lambda;
          var p0 = poissonP(lam, 0), p1 = poissonP(lam, 1), p2 = poissonP(lam, 2);
          return [
            "\\(P(X=x)=\\mathrm{e}^{-\\lambda}\\,\\lambda^x / x!\\)",
            "\\(\\lambda=" + fmt(lam, 1) + "\\)",
            "\\(P(X=0)=" + fmt(p0, 3) + ",\\ P(X=1)=" + fmt(p1, 3) + ",\\ P(X=2)=" + fmt(p2, 3) + "\\)"
          ];
        },
        draw: function (svg, st, el) {
          var lam = st.lambda;
          var Wd = 400, H = 280, padL = 36, padR = 12, padT = 16, padB = 32;
          var i, p, maxp = 0, probs = [];
          for (i = 0; i <= XMAX; i++) {
            p = poissonP(lam, i);
            probs.push(p);
            if (p > maxp) maxp = p;
          }
          var ymax = Math.max(0.4, Math.ceil(maxp * 10) / 10);
          function X(x) { return padL + (x + 0.5) / (XMAX + 1) * (Wd - padL - padR); }
          function Y(y) { return H - padB - y / ymax * (H - padT - padB); }
          var barW = (Wd - padL - padR) / (XMAX + 1) * 0.72;
          svg.appendChild(el("line", { x1: padL, y1: Y(0), x2: Wd - padR, y2: Y(0), stroke: "#9ca3af", "stroke-width": 1 }));
          svg.appendChild(el("line", { x1: padL, y1: Y(0), x2: padL, y2: Y(ymax), stroke: "#9ca3af", "stroke-width": 1 }));
          for (i = 0; i <= XMAX; i++) {
            p = probs[i];
            var cx = X(i), y0 = Y(0), y1 = Y(p);
            svg.appendChild(el("rect", {
              x: cx - barW / 2, y: Math.min(y0, y1),
              width: barW, height: Math.max(0, Math.abs(y0 - y1)),
              fill: "#93c5fd", stroke: "#2563eb", "stroke-width": 1
            }));
            if (i % 2 === 0) {
              var lab = el("text", {
                x: cx, y: y0 + 14,
                fill: "#6b7280", "font-size": 10, "font-family": "system-ui,sans-serif",
                "text-anchor": "middle"
              });
              lab.textContent = String(i);
              svg.appendChild(lab);
            }
          }
          var ylab = el("text", { x: 6, y: 14, fill: "#6b7280", "font-size": 11, "font-family": "system-ui,sans-serif" });
          ylab.textContent = "P(X=x)";
          svg.appendChild(ylab);
        }
      };
    };

    kinds.logs = function () {
      return {
        viewBox: "0 0 400 280",
        label: "y = a^x and y = log_a x, which are reflections in y = x",
        sliders: [
          { id: "a", label: "Base a", min: 1.2, max: 6, step: 0.1, value: 2 }
        ],
        metrics: function (st) {
          var a = st.a;
          var loga2 = Math.log(2) / Math.log(a);
          var apow2 = Math.pow(a, 2);
          return { a: a, loga2: loga2, apow2: apow2, check: Math.pow(a, loga2) };
        },
        formula: function (st) {
          var a = st.a;
          var loga2 = Math.log(2) / Math.log(a);
          return [
            "\\(y=a^x\\) and \\(y=\\log_a x\\) are inverses",
            "\\(a=" + fmt(a, 1) + "\\)",
            "\\(\\log_a 2=" + fmt(loga2, 2) + ",\\quad a^{\\log_a 2}=" + fmt(Math.pow(a, loga2), 2) + "\\)"
          ];
        },
        draw: function (svg, st, el) {
          var a = st.a;
          var Wd = 400, H = 280, pad = 28;
          var xmin = -3, xmax = 6, ymin = -3, ymax = 6;
          function X(x) { return pad + (x - xmin) / (xmax - xmin) * (Wd - 2 * pad); }
          function Y(y) { return H - pad - (y - ymin) / (ymax - ymin) * (H - 2 * pad); }
          svg.appendChild(el("line", { x1: X(xmin), y1: Y(0), x2: X(xmax), y2: Y(0), stroke: "#9ca3af", "stroke-width": 1 }));
          svg.appendChild(el("line", { x1: X(0), y1: Y(ymin), x2: X(0), y2: Y(ymax), stroke: "#9ca3af", "stroke-width": 1 }));
          svg.appendChild(el("line", {
            x1: X(Math.max(xmin, ymin)), y1: Y(Math.max(xmin, ymin)),
            x2: X(Math.min(xmax, ymax)), y2: Y(Math.min(xmax, ymax)),
            stroke: "#6b7280", "stroke-width": 1.5, "stroke-dasharray": "5 4"
          }));
          function plot(fn, color, x0, x1) {
            var d = "", pen = false, i, n = 160, x, y;
            for (i = 0; i <= n; i++) {
              x = x0 + (x1 - x0) * i / n;
              y = fn(x);
              if (!isFinite(y) || y < ymin - 0.5 || y > ymax + 0.5) { pen = false; continue; }
              d += (pen ? " L " : "M ") + X(x) + " " + Y(y);
              pen = true;
            }
            if (d) svg.appendChild(el("path", { d: d, fill: "none", stroke: color, "stroke-width": 2 }));
          }
          plot(function (x) { return Math.pow(a, x); }, "#2563eb", xmin, Math.min(xmax, Math.log(ymax + 0.5) / Math.log(a) + 0.2));
          plot(function (x) { return Math.log(x) / Math.log(a); }, "#b91c1c", Math.max(0.08, xmin), xmax);
          /* (0,1) on a^x and (1,0) on log */
          if (1 >= ymin && 1 <= ymax) svg.appendChild(el("circle", { cx: X(0), cy: Y(1), r: 4, fill: "#2563eb" }));
          if (1 >= xmin && 1 <= xmax) svg.appendChild(el("circle", { cx: X(1), cy: Y(0), r: 4, fill: "#b91c1c" }));
          var t1 = el("text", { x: X(-2.8), y: Y(5.4), fill: "#2563eb", "font-size": 12, "font-family": "system-ui,sans-serif" });
          t1.textContent = "y = aˣ";
          svg.appendChild(t1);
          var t2 = el("text", { x: X(3.4), y: Y(2.4), fill: "#b91c1c", "font-size": 12, "font-family": "system-ui,sans-serif" });
          t2.textContent = "y = logₐ x";
          svg.appendChild(t2);
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
    module.exports = { register: register, poissonP: poissonP };
  }
})(typeof window !== "undefined" ? window : global);
