/* pkg14 widget kinds. Registers on msWidget.kinds (the public registry
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
    if (W.kinds.__pkg14) {
      if (W.scan) W.scan(document);
      return;
    }
    var kinds = W.kinds;
    kinds.__pkg14 = true;

    function degStr(x) {
      return String(Math.round(x));
    }

    function numStr(x, dp) {
      var n = Number(x);
      var s = n.toFixed(dp);
      if (dp > 0) s = s.replace(/\.?0+$/, "");
      if (s === "-0") s = "0";
      return s;
    }

    function coeffPrefix(a) {
      if (a === 1) return "";
      if (a === -1) return "-";
      return numStr(a, 1);
    }

    kinds["trig-graph-family"] = function () {
      return {
        viewBox: "0 0 400 280",
        label: "Family of trigonometric graphs y = a times sin, cos or tan of bx, plus a vertical shift",
        sliders: [
          { id: "fn", label: "Function (1 sine, 2 cosine, 3 tangent)", min: 1, max: 3, step: 1, value: 1 },
          { id: "a", label: "Amplitude or scale a", min: 1, max: 3, step: 0.5, value: 1 },
          { id: "b", label: "Coefficient b of x", min: 1, max: 3, step: 0.5, value: 1 },
          { id: "c", label: "Vertical translation c", min: -2, max: 2, step: 0.5, value: 0 }
        ],
        metrics: function (st) {
          var a = st.a, b = st.b, c = st.c, fn = Math.round(st.fn);
          var periodDeg = (fn === 3) ? (180 / b) : (360 / b);
          var yBound = (fn === 3) ? Math.max(4, Math.abs(c) + 2) : Math.max(2.5, Math.abs(a) + Math.abs(c) + 0.5);
          return { a: a, b: b, c: c, fn: fn, periodDeg: periodDeg, yBound: yBound };
        },
        formula: function (st) {
          var m = kinds["trig-graph-family"]().metrics(st);
          var name = m.fn === 1 ? "sin" : m.fn === 2 ? "cos" : "tan";
          var mid = (m.b === 1) ? " x" : (" " + numStr(m.b, 1) + "x");
          var expr;
          if (m.a === 0) {
            expr = "y = " + numStr(m.c, 1);
          } else {
            expr = "y = " + coeffPrefix(m.a) + name + mid;
            if (m.c > 0) expr += " + " + numStr(m.c, 1);
            else if (m.c < 0) expr += " − " + numStr(Math.abs(m.c), 1);
          }
          var amp = m.fn === 3 ? "no amplitude" : ("amplitude " + numStr(m.a, 1));
          return [
            expr,
            amp + ", period " + numStr(m.periodDeg, 1) + "°"
          ];
        },
        draw: function (svg, st) {
          var m = kinds["trig-graph-family"]().metrics(st);
          var x0 = 40, x1 = 370, yTop = 16, yBot = 230, y0;
          var px = (x1 - x0) / 360;
          var yBound = m.yBound;
          function X(deg) { return x0 + deg * px; }
          function Y(val) { return yTop + (yBound - val) * (yBot - yTop) / (2 * yBound); }
          y0 = Y(0);
          function add(tag, attrs) {
            var el = document.createElementNS("http://www.w3.org/2000/svg", tag);
            Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
            svg.appendChild(el);
            return el;
          }
          var defs = add("defs", {});
          var clip = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
          clip.setAttribute("id", "pkg14-trig-plot");
          var crect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
          crect.setAttribute("x", String(x0));
          crect.setAttribute("y", String(yTop));
          crect.setAttribute("width", String(x1 - x0));
          crect.setAttribute("height", String(yBot - yTop));
          clip.appendChild(crect);
          defs.appendChild(clip);
          add("rect", { x: x0, y: yTop, width: String(x1 - x0), height: String(yBot - yTop), fill: "#ffffff", stroke: "none" });
          add("line", { x1: x0, y1: y0, x2: x1, y2: y0, stroke: "#1a1a1a", "stroke-width": "1.2" });
          add("line", { x1: x0, y1: yBot, x2: x0, y2: yTop, stroke: "#1a1a1a", "stroke-width": "1.2" });
          // y-axis ticks at integers
          var yt, yv;
          for (yt = Math.ceil(-yBound); yt <= Math.floor(yBound); yt++) {
            yv = Y(yt);
            if (yv < yTop + 1 || yv > yBot - 1) continue;
            add("line", { x1: x0 - 4, y1: yv, x2: x0, y2: yv, stroke: "#1a1a1a", "stroke-width": "1" });
            if (yt !== 0) {
              add("text", { x: x0 - 6, y: yv + 3, "text-anchor": "end", "font-size": "10", "font-family": "sans-serif" }).textContent = String(yt);
            }
          }
          [0, 90, 180, 270, 360].forEach(function (d) {
            add("line", { x1: X(d), y1: y0 - 4, x2: X(d), y2: y0 + 4, stroke: "#1a1a1a", "stroke-width": "1" });
            var tx = X(d);
            var ty = y0 + 16;
            var label = d === 0 ? "O" : (degStr(d) + "°");
            if (d === 360) { tx = X(d) - 2; ty = y0 + 18; }
            add("text", { x: tx, y: ty, "text-anchor": d === 360 ? "end" : "middle", "font-size": "10", "font-family": "sans-serif" }).textContent = label;
          });
          add("text", { x: x1 + 4, y: y0 - 8, "font-size": "11", "font-family": "sans-serif" }).textContent = "x";
          add("text", { x: x0 + 6, y: yTop + 11, "font-size": "11", "font-family": "sans-serif" }).textContent = "y";
          if (m.fn === 3) {
            var period = 180 / m.b;
            var asx = [], k, ad;
            for (k = 0; k < 8; k++) {
              ad = period * (k + 0.5);
              if (ad > 0 && ad < 360) asx.push(ad);
            }
            asx.forEach(function (d) {
              add("line", { x1: X(d), y1: yTop, x2: X(d), y2: yBot, stroke: "#c0392b", "stroke-width": "1.3", "stroke-dasharray": "4 3", "clip-path": "url(#pkg14-trig-plot)" });
            });
          }
          function val(deg) {
            var arg = (m.b * deg) * Math.PI / 180;
            var u = m.fn === 1 ? Math.sin(arg) : m.fn === 2 ? Math.cos(arg) : Math.tan(arg);
            return m.a * u + m.c;
          }
          var pts = [], i, d, yv, br = [];
          for (i = 0; i <= 360; i++) {
            d = i;
            yv = val(d);
            if (!isFinite(yv) || Math.abs(yv) > yBound + 0.75) {
              if (pts.length > 1) br.push(pts);
              pts = [];
              continue;
            }
            pts.push(X(d).toFixed(2) + "," + Y(yv).toFixed(2));
          }
          if (pts.length > 1) br.push(pts);
          br.forEach(function (p) {
            add("polyline", { fill: "none", stroke: "#0b5cab", "stroke-width": "2", points: p.join(" "), "clip-path": "url(#pkg14-trig-plot)" });
          });
        }
      };
    };

    kinds["reflection-symmetry-2d"] = function () {
      return {
        viewBox: "0 0 360 240",
        label: "A flag shape and its image in a vertical or horizontal or diagonal line of symmetry",
        sliders: [
          { id: "mode", label: "Mirror (1 vertical, 2 horizontal, 3 diagonal)", min: 1, max: 3, step: 1, value: 1 }
        ],
        metrics: function (st) {
          return { mode: Math.round(st.mode) };
        },
        formula: function (st) {
          var m = Math.round(st.mode);
          var name = m === 1 ? "vertical line" : m === 2 ? "horizontal line" : "diagonal line at 45°";
          return ["Line of symmetry: " + name];
        },
        draw: function (svg, st) {
          var mode = Math.round(st.mode);
          function add(tag, attrs) {
            var el = document.createElementNS("http://www.w3.org/2000/svg", tag);
            Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
            svg.appendChild(el);
            return el;
          }
          var cx = 180, cy = 120;
          if (mode === 1) add("line", { x1: cx, y1: 20, x2: cx, y2: 220, stroke: "#c0392b", "stroke-width": "1.5", "stroke-dasharray": "5 3" });
          if (mode === 2) add("line", { x1: 30, y1: cy, x2: 330, y2: cy, stroke: "#c0392b", "stroke-width": "1.5", "stroke-dasharray": "5 3" });
          // Falling 45° line through the centre: this is the line (dx, dy) → (dy, dx) reflects in (SVG y down).
          if (mode === 3) add("line", { x1: cx - 100, y1: cy - 100, x2: cx + 100, y2: cy + 100, stroke: "#c0392b", "stroke-width": "1.5", "stroke-dasharray": "5 3" });
          function refl(x, y) {
            var dx = x - cx, dy = y - cy;
            if (mode === 1) return [cx - dx, cy + dy];
            if (mode === 2) return [cx + dx, cy - dy];
            return [cx + dy, cy + dx];
          }
          var pts = [[cx + 20, cy - 50], [cx + 70, cy - 50], [cx + 70, cy - 20], [cx + 45, cy - 20], [cx + 45, cy + 50], [cx + 20, cy + 50]];
          var pts2 = pts.map(function (p) { return refl(p[0], p[1]); });
          add("polygon", { points: pts.map(function (p) { return p[0] + "," + p[1]; }).join(" "), fill: "#0b5cab", "fill-opacity": "0.25", stroke: "#0b5cab", "stroke-width": "2" });
          add("polygon", { points: pts2.map(function (p) { return p[0] + "," + p[1]; }).join(" "), fill: "#2e7d32", "fill-opacity": "0.25", stroke: "#2e7d32", "stroke-width": "2" });
        }
      };
    };

    kinds["circle-angle-theorem"] = function () {
      return {
        viewBox: "0 0 360 260",
        label: "Angle at the centre and angle at the circumference standing on the same arc",
        sliders: [
          { id: "ang", label: "Angle at the circumference, in degrees", min: 20, max: 70, step: 1, value: 35 }
        ],
        metrics: function (st) {
          var a = st.ang;
          return { a: a, centre: 2 * a };
        },
        formula: function (st) {
          var m = kinds["circle-angle-theorem"]().metrics(st);
          return [
            "Angle at the circumference = " + degStr(m.a) + "°",
            "Angle at the centre = " + degStr(m.centre) + "°"
          ];
        },
        draw: function (svg, st) {
          var a = st.ang * Math.PI / 180;
          var cx = 180, cy = 130, r = 90;
          function add(tag, attrs) {
            var el = document.createElementNS("http://www.w3.org/2000/svg", tag);
            Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
            svg.appendChild(el);
            return el;
          }
          add("circle", { cx: cx, cy: cy, r: r, fill: "none", stroke: "#1a1a1a", "stroke-width": "1.5" });
          var mid = -Math.PI / 2;
          var A = { x: cx + r * Math.cos(mid - a), y: cy + r * Math.sin(mid - a) };
          var B = { x: cx + r * Math.cos(mid + a), y: cy + r * Math.sin(mid + a) };
          var P = { x: cx + r * Math.cos(Math.PI / 2 + 0.35), y: cy + r * Math.sin(Math.PI / 2 + 0.35) };
          function line(p, q, color) {
            add("line", { x1: p.x, y1: p.y, x2: q.x, y2: q.y, stroke: color || "#1a1a1a", "stroke-width": "1.5" });
          }
          line(A, { x: cx, y: cy }, "#c0392b");
          line(B, { x: cx, y: cy }, "#c0392b");
          line(A, P, "#0b5cab");
          line(B, P, "#0b5cab");
          add("circle", { cx: cx, cy: cy, r: 3, fill: "#1a1a1a" });
          add("text", { x: cx + 8, y: cy - 8, "font-size": "12", "font-family": "sans-serif" }).textContent = "O";
          add("text", { x: A.x - 14, y: A.y - 4, "font-size": "12", "font-family": "sans-serif" }).textContent = "A";
          add("text", { x: B.x + 6, y: B.y - 4, "font-size": "12", "font-family": "sans-serif" }).textContent = "B";
          add("text", { x: P.x - 4, y: P.y + 16, "font-size": "12", "font-family": "sans-serif" }).textContent = "P";
        }
      };
    };

    if (W.scan) W.scan(document);
  }

  register();
})(typeof window !== "undefined" ? window : this);
