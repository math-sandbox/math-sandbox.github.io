(function (root) {
  "use strict";
  var SVG_NS = "http://www.w3.org/2000/svg";
  var TAU = Math.PI * 2;

  function ns(name, attrs) {
    var el = document.createElementNS(SVG_NS, name);
    Object.keys(attrs || {}).forEach(function (k) {
      if (attrs[k] != null) el.setAttribute(k, String(attrs[k]));
    });
    return el;
  }
  function roundHalfUp(x, d) {
    d = d == null ? 0 : Number(d);
    if (!isFinite(x) || !isFinite(d) || d < 0) return NaN;
    var sign = x < 0 ? -1 : 1;
    var m = Math.pow(10, d);
    var t = Math.abs(Number(x)) * m;
    var i = Math.floor(t + 0.5 + 1e-10);
    return sign * i / m;
  }
  function fmt(x, d) {
    if (!isFinite(x)) return "—";
    d = d == null ? 2 : d;
    var r = roundHalfUp(x, d);
    if (!isFinite(r)) return "—";
    if (Math.abs(r) < Math.pow(10, -d) / 2) return "0";
    var s = Math.abs(r).toFixed(d).replace(/\.?0+$/, "");
    return (r < 0 ? "-" : "") + (s || "0");
  }
  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }
  function throttle(fn, ms) {
    var t = 0, last = 0;
    return function () {
      var now = Date.now();
      var wait = ms - (now - last);
      var ctx = this, args = arguments;
      if (wait <= 0) {
        last = now;
        fn.apply(ctx, args);
      } else {
        clearTimeout(t);
        t = setTimeout(function () {
          last = Date.now();
          fn.apply(ctx, args);
        }, wait);
      }
    };
  }
  function paintFormula(el, tex) {
    var parts = Array.isArray(tex) ? tex : [tex];
    el.innerHTML = "";
    var nodes = parts.filter(function (p) { return p != null && String(p) !== ""; }).map(function (p) {
      var s = document.createElement("span");
      s.className = "ms-w-formula-item";
      s.textContent = p;
      el.appendChild(s);
      return s;
    });
    if (!nodes.length) return Promise.resolve();
    if (window.msTypeset) return window.msTypeset(nodes);
    var MJ = window.MathJax;
    if (MJ && MJ.typesetPromise) {
      return MJ.typesetPromise(nodes).catch(function () {});
    }
    return Promise.resolve();
  }

  function mount(host, spec) {
    if (!host || host.getAttribute("data-mounted") === "1") return;
    host.setAttribute("data-mounted", "1");
    host.querySelectorAll(".ms-widget-fallback").forEach(function (f) { f.hidden = true; });
    var wrap = document.createElement("div");
    wrap.className = "ms-w";
    var stage = document.createElement("div");
    stage.className = "ms-w-stage";
    if (spec.label) {
      var cap = document.createElement("p");
      cap.className = "ms-w-caption";
      cap.textContent = spec.label;
      stage.appendChild(cap);
    }
    var svg = ns("svg", {
      viewBox: spec.viewBox || "0 0 400 300",
      role: "img",
      "aria-label": spec.label || "Interactive figure"
    });
    stage.appendChild(svg);
    var controls = document.createElement("div");
    controls.className = "ms-w-controls";
    var state = {};
    var inputs = {};
    (spec.sliders || []).forEach(function (s) {
      state[s.id] = Number(s.value != null ? s.value : s.min);
      var row = document.createElement("div");
      row.className = "ms-w-row";
      var lab = document.createElement("label");
      var inp = document.createElement("input");
      inp.type = "range";
      inp.min = s.min;
      inp.max = s.max;
      inp.step = s.step;
      inp.value = String(state[s.id]);
      inp.setAttribute("aria-label", s.label);
      var val = document.createElement("span");
      val.className = "ms-w-val";
      function show() {
        var u = s.unit ? " " + s.unit : "";
        val.textContent = (s.display ? s.display(state[s.id]) : fmt(state[s.id], s.digits)) + u;
      }
      var top = document.createElement("div");
      top.className = "ms-w-row-top";
      lab.textContent = s.label;
      top.appendChild(lab);
      top.appendChild(val);
      row.appendChild(top);
      row.appendChild(inp);
      controls.appendChild(row);
      inputs[s.id] = inp;
      show();
      inp.addEventListener("input", function () {
        state[s.id] = Number(inp.value);
        show();
        render();
      });
    });
    var formula = document.createElement("div");
    formula.className = "ms-w-formula";
    formula.setAttribute("aria-live", "polite");
    var actions = document.createElement("div");
    actions.className = "ms-w-actions";
    wrap.appendChild(stage);
    wrap.appendChild(controls);
    wrap.appendChild(formula);
    wrap.appendChild(actions);
    host.appendChild(wrap);

    var unwind = 0;
    var anim = 0;
    var setFormulaLater = throttle(function (tex) {
      paintFormula(formula, tex);
    }, 80);
    var formulaReady = false;
    function setFormula(tex) {
      if (!formulaReady) {
        formulaReady = true;
        paintFormula(formula, tex);
        return;
      }
      setFormulaLater(tex);
    }

    function snapshot() {
      host.setAttribute("data-state", JSON.stringify(state));
      if (spec.metrics) {
        var m = spec.metrics(state);
        Object.keys(m).forEach(function (k) {
          host.setAttribute("data-" + k, String(m[k]));
        });
      }
    }
    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      spec.draw(svg, Object.assign({}, state, { unwind: unwind }), ns);
      if (spec.formula) setFormula(spec.formula(state, unwind));
      snapshot();
    }
    function setSlider(id, v) {
      var s = (spec.sliders || []).find(function (x) { return x.id === id; });
      if (!s) return;
      var n = Math.min(Number(s.max), Math.max(Number(s.min), v));
      var step = Number(s.step) || 0.01;
      n = Math.round(n / step) * step;
      state[id] = n;
      if (inputs[id]) inputs[id].value = String(n);
      inputs[id] && inputs[id].dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (spec.drag) {
      var dragging = false;
      function ptr(ev) {
        var pt = svg.createSVGPoint();
        pt.x = ev.clientX; pt.y = ev.clientY;
        var ctm = svg.getScreenCTM();
        if (!ctm) return;
        var loc = pt.matrixTransform(ctm.inverse());
        spec.drag(loc, setSlider, state);
      }
      svg.addEventListener("pointerdown", function (ev) {
        dragging = true;
        svg.setPointerCapture(ev.pointerId);
        ptr(ev);
      });
      svg.addEventListener("pointermove", function (ev) { if (dragging) ptr(ev); });
      svg.addEventListener("pointerup", function () { dragging = false; });
      svg.addEventListener("pointercancel", function () { dragging = false; });
    }
    if (spec.unwind) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "Unwind";
      btn.setAttribute("aria-pressed", "false");
      btn.addEventListener("click", function () {
        var target = unwind > 0.5 ? 0 : 1;
        btn.setAttribute("aria-pressed", target ? "true" : "false");
        if (reducedMotion()) {
          unwind = target;
          render();
          return;
        }
        cancelAnimationFrame(anim);
        var from = unwind;
        var t0 = performance.now();
        function tick(now) {
          var p = Math.min(1, (now - t0) / 450);
          unwind = from + (target - from) * p;
          render();
          if (p < 1) anim = requestAnimationFrame(tick);
        }
        anim = requestAnimationFrame(tick);
      });
      actions.appendChild(btn);
    }
    host._msSet = setSlider;
    render();
    return { set: setSlider, state: state, svg: svg };
  }

  var ARC_CX = 132;
  var ARC_CY = 148;
  var ARC_RMAX = 108;
  var ARC_RSLIDER = 8;

  function polar(cx, cy, r, th) {
    return { x: cx + r * Math.cos(th), y: cy - r * Math.sin(th) };
  }

  function drawArcSector(svg, st, el, mode) {
    svg.setAttribute("viewBox", "0 0 400 300");
    var r = ARC_RMAX * (Number(st.r) / ARC_RSLIDER);
    if (!(r > 0)) r = 4;
    var th = Math.max(0, Math.min(TAU, Number(st.theta) || 0));
    var u = st.unwind || 0;
    var cx = ARC_CX, cy = ARC_CY;
    svg.appendChild(el("circle", { cx: cx, cy: cy, r: r, fill: "#fff", stroke: "#d1d5db", "stroke-width": 1.5 }));
    var p1 = polar(cx, cy, r, 0);
    var p2 = polar(cx, cy, r, th);
    var large = th > Math.PI ? 1 : 0;
    if (th > 0.001) {
      var dSec = "M " + cx + " " + cy + " L " + p1.x + " " + p1.y +
        " A " + r + " " + r + " 0 " + large + " 0 " + p2.x + " " + p2.y + " Z";
      svg.appendChild(el("path", { d: dSec, fill: "#dbeafe", stroke: "#2563eb", "stroke-width": 1.5 }));
      var dArc = "M " + p1.x + " " + p1.y + " A " + r + " " + r + " 0 " + large + " 0 " + p2.x + " " + p2.y;
      svg.appendChild(el("path", { d: dArc, fill: "none", stroke: "#b91c1c", "stroke-width": 3 }));
    }
    svg.appendChild(el("line", { x1: cx, y1: cy, x2: p1.x, y2: p1.y, stroke: "#1d2433", "stroke-width": 1.5 }));
    svg.appendChild(el("line", { x1: cx, y1: cy, x2: p2.x, y2: p2.y, stroke: "#1d2433", "stroke-width": 1.5 }));
    if (mode === "segment" && th > 0.001) {
      svg.appendChild(el("line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: "#16a34a", "stroke-width": 2 }));
    }
    svg.appendChild(el("circle", { cx: cx, cy: cy, r: 3, fill: "#1d2433" }));
    svg.appendChild(el("circle", { cx: p2.x, cy: p2.y, r: 6, fill: "#2563eb", stroke: "#fff", "stroke-width": 2 }));
    if (u > 0.02) {
      var x0 = 270, y0 = 250;
      var L = r * th;
      var room = 120;
      var sc = L > room && L > 0 ? room / L : 1;
      var rShow = r * sc;
      var shown = L * sc * u;
      svg.appendChild(el("line", { x1: x0, y1: y0, x2: x0, y2: y0 - rShow, stroke: "#1d2433", "stroke-width": 1.5 }));
      svg.appendChild(el("line", {
        x1: x0, y1: y0 - rShow, x2: x0 + Math.max(shown, 0), y2: y0 - rShow,
        stroke: "#b91c1c", "stroke-width": 3
      }));
      svg.appendChild(el("text", {
        x: x0, y: y0 + 16, fill: "#6b7280", "font-size": 11, "font-family": "system-ui,sans-serif"
      })).textContent = "unwind";
    }
  }

  function arcMetrics(st) {
    var s = st.r * st.theta;
    var A = 0.5 * st.r * st.r * st.theta;
    var seg = 0.5 * st.r * st.r * (st.theta - Math.sin(st.theta));
    return { s: s, area: A, segment: seg, r: st.r, theta: st.theta };
  }

  var kinds = {
    "arc-sector": function (host) {
      var mode = host.getAttribute("data-mode") || "arc";
      return {
        viewBox: "0 0 400 300",
        label: mode === "segment" ? "Sector and segment" : "Arc and sector",
        unwind: true,
        sliders: [
          { id: "r", label: "Radius r", min: 1, max: 8, step: 0.1, value: 4, unit: "" },
          { id: "theta", label: "Angle θ", min: 0, max: TAU, step: 0.01, value: 1.2, unit: "rad", digits: 2 }
        ],
        metrics: arcMetrics,
        formula: function (st) {
          var m = arcMetrics(st);
          var parts = [
            "\\(s=r\\theta=" + fmt(m.s, 2) + "\\)",
            "\\(A=\\tfrac12 r^2\\theta=" + fmt(m.area, 2) + "\\)"
          ];
          if (mode === "segment") {
            parts.push("\\(A_{\\mathrm{seg}}=\\tfrac12 r^2(\\theta-\\sin\\theta)=" + fmt(m.segment, 2) + "\\)");
          }
          return parts;
        },
        draw: function (svg, st, el) { drawArcSector(svg, st, el, mode); },
        drag: function (loc, set) {
          var th = Math.atan2(ARC_CY - loc.y, loc.x - ARC_CX);
          if (th < 0) th += TAU;
          set("theta", th);
        }
      };
    },
    radian: function () {
      return {
        viewBox: "0 0 400 300",
        label: "One radian",
        unwind: true,
        sliders: [
          { id: "theta", label: "Angle θ", min: 0, max: TAU, step: 0.01, value: 1, unit: "rad", digits: 2 }
        ],
        metrics: function (st) {
          return { s: st.theta, deg: st.theta * 180 / Math.PI, theta: st.theta, r: 1 };
        },
        formula: function (st) {
          return [
            "\\(r=1,\\ s=r\\theta=\\theta=" + fmt(st.theta, 2) + "\\)",
            "\\(\\theta=" + fmt(st.theta * 180 / Math.PI, 1) + "^\\circ\\)"
          ];
        },
        draw: function (svg, st, el) {
          drawArcSector(svg, { r: ARC_RSLIDER, theta: st.theta, unwind: st.unwind }, el, "arc");
        },
        drag: function (loc, set) {
          var th = Math.atan2(ARC_CY - loc.y, loc.x - ARC_CX);
          if (th < 0) th += TAU;
          set("theta", th);
        }
      };
    },
    parabola: function (host) {
      var a0 = Number(host.getAttribute("data-a") || 1);
      var b0 = Number(host.getAttribute("data-b") || 2);
      var c0 = Number(host.getAttribute("data-c") || -3);
      return {
        viewBox: "0 0 400 280",
        label: "Parabola y = ax² + bx + c",
        sliders: [
          { id: "a", label: "a", min: -2, max: 2, step: 0.1, value: a0 },
          { id: "b", label: "b", min: -6, max: 6, step: 0.2, value: b0 },
          { id: "c", label: "c", min: -6, max: 6, step: 0.2, value: c0 }
        ],
        metrics: function (st) {
          var a = st.a, b = st.b, c = st.c;
          var vx = a === 0 ? null : -b / (2 * a);
          var vy = a === 0 ? null : a * vx * vx + b * vx + c;
          var disc = b * b - 4 * a * c;
          return { a: a, b: b, c: c, vx: vx, vy: vy, disc: disc };
        },
        formula: function (st) {
          if (st.a === 0) {
            return ["\\(a=0:\\ y=" + fmt(st.b, 1) + "x+" + fmt(st.c, 1) + "\\)", "(a straight line)"];
          }
          var vx = -st.b / (2 * st.a);
          var d = st.b * st.b - 4 * st.a * st.c;
          return [
            "\\(y=" + fmt(st.a, 1) + "x^2+" + fmt(st.b, 1) + "x+" + fmt(st.c, 1) + "\\)",
            "\\(x=-\\dfrac{b}{2a}=" + fmt(vx, 2) + "\\)",
            "\\(\\Delta=" + fmt(d, 2) + "\\)"
          ];
        },
        draw: function (svg, st, el) {
          var W = 400, H = 280, pad = 24;
          var xmin = -6, xmax = 6, ymin = -8, ymax = 8;
          function X(x) { return pad + (x - xmin) / (xmax - xmin) * (W - 2 * pad); }
          function Y(y) { return H - pad - (y - ymin) / (ymax - ymin) * (H - 2 * pad); }
          svg.appendChild(el("line", { x1: X(xmin), y1: Y(0), x2: X(xmax), y2: Y(0), stroke: "#9ca3af", "stroke-width": 1 }));
          svg.appendChild(el("line", { x1: X(0), y1: Y(ymin), x2: X(0), y2: Y(ymax), stroke: "#9ca3af", "stroke-width": 1 }));
          var d = "";
          var pen = false;
          for (var i = 0; i <= 80; i++) {
            var x = xmin + i * (xmax - xmin) / 80;
            var y = st.a * x * x + st.b * x + st.c;
            if (y < ymin - 0.5 || y > ymax + 0.5) { pen = false; continue; }
            d += (pen ? " L " : "M ") + X(x) + " " + Y(y);
            pen = true;
          }
          if (d) svg.appendChild(el("path", { d: d, fill: "none", stroke: "#2563eb", "stroke-width": 2 }));
          if (st.a !== 0) {
            var vx = -st.b / (2 * st.a);
            var vy = st.a * vx * vx + st.b * vx + st.c;
            if (vx >= xmin && vx <= xmax) {
              svg.appendChild(el("line", { x1: X(vx), y1: Y(ymin), x2: X(vx), y2: Y(ymax), stroke: "#f59e0b", "stroke-width": 1.5, "stroke-dasharray": "4 3" }));
            }
            if (vx >= xmin && vx <= xmax && vy >= ymin && vy <= ymax) {
              svg.appendChild(el("circle", { cx: X(vx), cy: Y(vy), r: 5, fill: "#b91c1c" }));
            }
            if (st.c >= ymin && st.c <= ymax) {
              svg.appendChild(el("circle", { cx: X(0), cy: Y(st.c), r: 4, fill: "#16a34a" }));
            }
            var disc = st.b * st.b - 4 * st.a * st.c;
            if (disc >= 0) {
              var s = Math.sqrt(disc);
              var x1 = (-st.b - s) / (2 * st.a);
              var x2 = (-st.b + s) / (2 * st.a);
              if (x1 >= xmin && x1 <= xmax) svg.appendChild(el("circle", { cx: X(x1), cy: Y(0), r: 4, fill: "#1d2433" }));
              if (disc > 1e-9 && x2 >= xmin && x2 <= xmax) svg.appendChild(el("circle", { cx: X(x2), cy: Y(0), r: 4, fill: "#1d2433" }));
            }
          }
        }
      };
    },
    hyperbola: function () {
      return {
        viewBox: "0 0 400 280",
        label: "Hyperbola y = k/x",
        sliders: [
          { id: "k", label: "k", min: -12, max: 12, step: 0.5, value: 12 }
        ],
        metrics: function (st) { return { k: st.k }; },
        formula: function (st) {
          if (st.k === 0) return ["\\(k=0\\)", "no reciprocal graph."];
          return [
            "\\(y=\\dfrac{" + fmt(st.k, 1) + "}{x}\\)",
            "\\(xy=" + fmt(st.k, 1) + "\\)"
          ];
        },
        draw: function (svg, st, el) {
          var W = 400, H = 280, pad = 24;
          var xmin = -8, xmax = 8, ymin = -8, ymax = 8;
          function X(x) { return pad + (x - xmin) / (xmax - xmin) * (W - 2 * pad); }
          function Y(y) { return H - pad - (y - ymin) / (ymax - ymin) * (H - 2 * pad); }
          svg.appendChild(el("line", { x1: X(xmin), y1: Y(0), x2: X(xmax), y2: Y(0), stroke: "#9ca3af", "stroke-width": 1 }));
          svg.appendChild(el("line", { x1: X(0), y1: Y(ymin), x2: X(0), y2: Y(ymax), stroke: "#9ca3af", "stroke-width": 1 }));
          if (st.k === 0) return;
          function branch(x0, x1) {
            var d = "";
            var pen = false;
            var n = 80;
            for (var i = 0; i <= n; i++) {
              var x = x0 + (x1 - x0) * i / n;
              if (Math.abs(x) < 0.12) { pen = false; continue; }
              var y = st.k / x;
              if (y < ymin - 0.5 || y > ymax + 0.5) { pen = false; continue; }
              d += (pen ? " L " : "M ") + X(x) + " " + Y(y);
              pen = true;
            }
            if (d) svg.appendChild(el("path", { d: d, fill: "none", stroke: "#2563eb", "stroke-width": 2 }));
          }
          branch(xmin, -0.12);
          branch(0.12, xmax);
        }
      };
    },
    "line-circle": function () {
      return {
        viewBox: "0 0 400 280",
        label: "Line and circle",
        sliders: [
          { id: "m", label: "Gradient m", min: -3, max: 3, step: 0.1, value: 0.5 },
          { id: "c", label: "Intercept c", min: -4, max: 4, step: 0.1, value: 1 },
          { id: "R", label: "Radius R", min: 1, max: 6, step: 0.1, value: 4.5 }
        ],
        metrics: function (st) {
          var A = 1 + st.m * st.m;
          var B = 2 * st.m * st.c;
          var C = st.c * st.c - st.R * st.R;
          var disc = B * B - 4 * A * C;
          var n = disc > 1e-8 ? 2 : Math.abs(disc) <= 1e-8 ? 1 : 0;
          return { disc: disc, n: n, m: st.m, c: st.c, R: st.R };
        },
        formula: function (st) {
          var m = kinds["line-circle"]().metrics(st);
          var pts = m.n === 1 ? "1 point (tangent)" : m.n === 0 ? "0 points" : "2 points";
          return [
            "\\(y=" + fmt(st.m, 1) + "x+" + fmt(st.c, 1) + "\\)",
            "\\(x^2+y^2=" + fmt(st.R * st.R, 1) + "\\)",
            "\\(\\Delta=" + fmt(m.disc, 2) + "\\rightarrow\\text{ " + pts + "}\\)"
          ];
        },
        draw: function (svg, st, el) {
          var W = 400, H = 280, pad = 24;
          var xmin = -8, xmax = 8, ymin = -6, ymax = 6;
          function X(x) { return pad + (x - xmin) / (xmax - xmin) * (W - 2 * pad); }
          function Y(y) { return H - pad - (y - ymin) / (ymax - ymin) * (H - 2 * pad); }
          svg.appendChild(el("line", { x1: X(xmin), y1: Y(0), x2: X(xmax), y2: Y(0), stroke: "#9ca3af", "stroke-width": 1 }));
          svg.appendChild(el("line", { x1: X(0), y1: Y(ymin), x2: X(0), y2: Y(ymax), stroke: "#9ca3af", "stroke-width": 1 }));
          svg.appendChild(el("circle", {
            cx: X(0), cy: Y(0), r: Math.abs(X(st.R) - X(0)),
            fill: "none", stroke: "#2563eb", "stroke-width": 2
          }));
          var yL = st.m * xmin + st.c, yR = st.m * xmax + st.c;
          var x1 = xmin, x2 = xmax;
          if (Math.abs(st.m) > 1e-9) {
            var xLo = (ymin - st.c) / st.m, xHi = (ymax - st.c) / st.m;
            var lo = Math.min(xLo, xHi), hi = Math.max(xLo, xHi);
            x1 = Math.max(xmin, lo);
            x2 = Math.min(xmax, hi);
            yL = st.m * x1 + st.c;
            yR = st.m * x2 + st.c;
          }
          svg.appendChild(el("line", {
            x1: X(x1), y1: Y(yL),
            x2: X(x2), y2: Y(yR),
            stroke: "#b91c1c", "stroke-width": 1.8
          }));
          var A = 1 + st.m * st.m;
          var B = 2 * st.m * st.c;
          var C = st.c * st.c - st.R * st.R;
          var disc = B * B - 4 * A * C;
          if (disc >= -1e-8) {
            var s = Math.sqrt(Math.max(0, disc));
            var xs = [(-B - s) / (2 * A)];
            if (disc > 1e-8) xs.push((-B + s) / (2 * A));
            xs.forEach(function (x) {
              var y = st.m * x + st.c;
              svg.appendChild(el("circle", { cx: X(x), cy: Y(y), r: 5, fill: "#16a34a" }));
            });
          }
        }
      };
    }
  };

  function specFor(el) {
    var kind = el.getAttribute("data-widget");
    var make = kinds[kind];
    return make ? make(el) : null;
  }
  function scan(root) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll("[data-widget]").forEach(function (el) {
      var spec = specFor(el);
      if (spec) mount(el, spec);
    });
  }

  var api = { mount: mount, scan: scan, kinds: kinds, fmt: fmt, roundHalfUp: roundHalfUp };
  root.msWidget = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : global);
