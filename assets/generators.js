(function (g) {
  function mulberry(seed) {
    let s = (seed >>> 0) || 1;
    return function () {
      s += 0x6d2b79f5;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function ir(r, a, b) { return a + Math.floor(r() * (b - a + 1)); }
  function pick(r, a) { return a[Math.floor(r() * a.length)]; }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; }
  function ord(n) { const m = n % 100; if (m >= 11 && m <= 13) return n + "th"; const k = n % 10; return n + (k === 1 ? "st" : k === 2 ? "nd" : k === 3 ? "rd" : "th"); }
  function nstr(n) {
    if (Object.is(n, -0)) n = 0;
    if (typeof n !== "number" || !Number.isFinite(n)) return String(n);
    if (Number.isInteger(n)) return String(n);
    for (let d = 1; d <= 120; d++) {
      const a = Math.round(n * d);
      if (Math.abs(n * d - a) < 1e-8) return d === 1 ? String(a) : frac(a, d);
    }
    return sf(n);
  }
  function term(c, v) {
    v = v || "x";
    if (c === 0) return "";
    if (c === 1) return "+" + v;
    if (c === -1) return "-" + v;
    return (c > 0 ? "+" : "") + nstr(c) + v;
  }
  function lin(a, b, v) {
    v = v || "x";
    let s;
    if (a === 0) s = nstr(b);
    else {
      s = a === 1 ? v : a === -1 ? "-" + v : nstr(a) + v;
      if (b > 0) s += "+" + nstr(b);
      else if (b < 0) s += nstr(b);
    }
    return s;
  }
  function quad(a, b, c) {
    let s = a === 1 ? "x^2" : a === -1 ? "-x^2" : nstr(a) + "x^2";
    s += term(b, "x");
    if (c > 0) s += "+" + nstr(c);
    else if (c < 0) s += nstr(c);
    return s;
  }
  function frac(a, b) {
    if (b < 0) { a = -a; b = -b; }
    const g = gcd(a, b); a /= g; b /= g;
    if (b === 1) return nstr(a);
    const sign = a < 0 ? "-" : "";
    return sign + "\\tfrac{" + Math.abs(a) + "}{" + b + "}";
  }
  function dfrac(a, b) {
    if (b < 0) { a = -a; b = -b; }
    const g = gcd(a, b); a /= g; b /= g;
    if (b === 1) return nstr(a);
    const sign = a < 0 ? "-" : "";
    return sign + "\\dfrac{" + Math.abs(a) + "}{" + b + "}";
  }
  function sf(x, n) {
    n = n || 3;
    if (x === 0) return "0";
    const sign = x < 0 ? "-" : "";
    const ax = Math.abs(x);
    const exp = Math.floor(Math.log10(ax) + 1e-12);
    const factor = Math.pow(10, exp - n + 1);
    const rnd = Math.round(ax / factor) * factor;
    if (rnd >= 1000) return sign + thin(Math.round(rnd));
    let s = Number(rnd).toPrecision(n);
    if (/e/i.test(s)) return sign + thin(Math.round(rnd));
    return sign + s;
  }
  function dots(x, d) {
    if (!Number.isFinite(x)) return String(x);
    if (Math.abs(x - Math.round(x)) < 1e-12) return nstr(Math.round(x));
    const m = Math.pow(10, d);
    const exact = Math.abs(x * m - Math.round(x * m)) < 1e-8;
    const t = exact ? Math.round(x * m) / m : (x < 0 ? Math.ceil(x * m - 1e-12) : Math.floor(x * m + 1e-12)) / m;
    if (exact || Math.abs(x - t) < 1e-12) {
      return String(t.toFixed(d)).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
    }
    return t.toFixed(d) + "\\ldots";
  }
  function decInt(c) {
    if (Number.isInteger(c)) return String(c);
    if (Math.abs(c * 2 - Math.round(c * 2)) < 1e-9) {
      const v = Math.round(c * 2) / 2;
      return Number.isInteger(v) ? String(v) : v.toFixed(1);
    }
    return nstr(c);
  }
  function dp1(x) { return Number(x).toFixed(1); }
  function pwr(b, e) { return b + "^{" + e + "}"; }
  function piC(k) { return k === 1 ? "\\pi" : k === -1 ? "-\\pi" : nstr(k) + "\\pi"; }
  function timesAC(a, c) { return nstr(a) + "\\times" + (c < 0 ? "(" + nstr(c) + ")" : nstr(c)); }
  function factorPair(A, B, C) {
    const g0 = gcd(gcd(Math.abs(A), Math.abs(B)), Math.abs(C)) || 1;
    A /= g0; B /= g0; C /= g0;
    const ds = [];
    for (let d = 1; d <= Math.abs(A); d++) if (A % d === 0) { ds.push(d, -d); }
    for (const d of ds) {
      const e = A / d;
      for (let p = -40; p <= 40; p++) {
        if (!p || C % p) continue;
        const q = C / p;
        if (d * q + e * p === B) return { g: g0, A, B, C, d, p, e, q };
      }
    }
    return null;
  }
  function facTex(fp) { return "(" + lin(fp.d, fp.p) + ")(" + lin(fp.e, fp.q) + ")"; }
  function money(x) { return Number(x).toFixed(2); }
  function moneyThin(x) { const s = money(x); const i = s.indexOf("."); return thin(Number(s.slice(0, i))) + s.slice(i); }
  function thin(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "\\,"); }
  function rad(d) { return d * Math.PI / 180; }
  function deg(x) { return x * 180 / Math.PI; }
  function pad3(n) { return String(n).padStart(3, "0"); }
  function until(r, fn) { for (let i = 0; i < 800; i++) { const v = fn(r); if (v) return v; } throw new Error("params"); }
  function sumtex(a, b) {
    if (b === 0) return nstr(a);
    if (b < 0) return nstr(a) + "+(" + nstr(b) + ")";
    return nstr(a) + "+" + nstr(b);
  }
  function kx(k) { return k === 1 ? "x" : k === -1 ? "-x" : nstr(k) + "x"; }
  function slopeX(m) {
    if (Math.abs(m - 1) < 1e-12) return "x";
    if (Math.abs(m + 1) < 1e-12) return "-x";
    return nstr(m) + "x";
  }
  function splits(A, C, B) {
    const ac = A * C;
    for (let i = -200; i <= 200; i++) if (i && ac % i === 0 && i + ac / i === B) return [i, ac / i];
    return null;
  }
  function group(A, n1, n2, C) {
    const g1 = gcd(A, n1);
    const a1 = A / g1, b1 = n1 / g1;
    let g2 = gcd(n2, C);
    if (n2 < 0) g2 = -g2;
    const a2 = n2 / g2, b2 = C / g2;
    const bin = lin(a1, b1);
    const left = (g1 === 1 ? "x" : nstr(g1) + "x") + "(" + bin + ")";
    const right = (g2 === 1 ? "+" : g2 === -1 ? "-" : (g2 > 0 ? "+" : "") + nstr(g2)) + "(" + lin(a2, b2) + ")";
    return left + right;
  }
  function R(part, answer, marks, guidance) { return { part: part || "", answer, marks: marks || "", guidance: guidance || "" }; }
  function wrapn(n) {
    const s = typeof n === "number" ? decInt(n) : String(n);
    return s.charAt(0) === "-" ? "(" + s + ")" : s;
  }
  function par(letter, v) {
    if (v === 0) return letter;
    return "(" + letter + (v > 0 ? "-" : "+") + nstr(Math.abs(v)) + ")";
  }
  function decs(n, d) {
    if (!Number.isFinite(n)) return String(n);
    if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
    if (d == null) {
      if (Math.abs(n * 10 - Math.round(n * 10)) < 1e-8) d = 1;
      else if (Math.abs(n * 100 - Math.round(n * 100)) < 1e-8) d = 2;
      else d = 3;
    }
    return String(Number(n.toFixed(d)));
  }
  function surd(n) {
    n = Math.round(n);
    if (n <= 0) return nstr(n);
    let k = 1, m = n;
    for (let i = Math.floor(Math.sqrt(n)); i >= 2; i--) if (n % (i * i) === 0) { k = i; m = n / (i * i); break; }
    if (m === 1) return nstr(k);
    return (k === 1 ? "" : nstr(k)) + "\\sqrt{" + m + "}";
  }
  function circEq(D, E, F) {
    let s = "x^2+y^2";
    s += term(D, "x") + term(E, "y");
    if (F > 0) s += "+" + nstr(F);
    else if (F < 0) s += nstr(F);
    return s + "=0";
  }
  function axbyc(a, b, c) {
    let g0 = gcd(gcd(Math.abs(a) || 0, Math.abs(b) || 0), Math.abs(c) || 0) || 1;
    a /= g0; b /= g0; c /= g0;
    if (a < 0 || (a === 0 && b < 0)) { a = -a; b = -b; c = -c; }
    let s = coff(a, "x") + term(b, "y") + add(c);
    if (s.charAt(0) === "+") s = s.slice(1);
    if (!s) s = "0";
    return s + "=0";
  }
  function medHalves(xs) {
    const s = xs.slice().sort((a, b) => a - b), n = s.length;
    const mid = (a) => a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
    const med = mid(s);
    const lo = s.slice(0, n % 2 ? (n - 1) / 2 : n / 2);
    const hi = s.slice(n % 2 ? (n + 1) / 2 : n / 2);
    return { med, q1: mid(lo), q3: mid(hi), iqr: mid(hi) - mid(lo) };
  }
  function polyQ(a, b, c) { return quad(a, b, c); }
  function add(n) {
    if (!n) return "";
    if (n > 0) return "+" + nstr(n);
    return nstr(n);
  }
  function coff(n, tok) {
    if (n === 0) return "";
    if (n === 1) return tok;
    if (n === -1) return "-" + tok;
    return nstr(n) + tok;
  }
  function nice(x) {
    if (!Number.isFinite(x)) return String(x);
    if (Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
    for (let d = 1; d <= 4; d++) {
      const t = Math.round(x * Math.pow(10, d)) / Math.pow(10, d);
      if (Math.abs(x - t) < 1e-8) return String(Number(t.toFixed(d)));
    }
    return sf(x);
  }
  function ptex(base, e) {
    if (e === 0) return "1";
    if (e === 1) return base;
    return base + "^{" + e + "}";
  }
  function sqrtRat(num, den) {
    num = Math.round(num); den = Math.round(den);
    if (den < 0) { num = -num; den = -den; }
    if (num < 0) return nstr(num / den);
    const g0 = gcd(num, den); num /= g0; den /= g0;
    function split(v) {
      let k = 1, m = v;
      for (let i = Math.floor(Math.sqrt(v)); i >= 2; i--) if (v % (i * i) === 0) { k = i; m = v / (i * i); break; }
      return [k, m];
    }
    const an = split(num), ad = split(den);
    let p = an[0], q = ad[0] * ad[1], m = an[1] * ad[1];
    const k2 = split(m);
    p *= k2[0]; m = k2[1];
    const g2 = gcd(p, q); p /= g2; q /= g2;
    if (m === 1) return q === 1 ? nstr(p) : frac(p, q);
    const core = (p === 1 ? "" : nstr(p)) + "\\sqrt{" + m + "}";
    if (q === 1) return core;
    if (p === 1) return "\\dfrac{\\sqrt{" + m + "}}{" + q + "}";
    return "\\dfrac{" + p + "\\sqrt{" + m + "}}{" + q + "}";
  }
  function tidyMath(s) {
    return String(s)
      .replace(/(\\times|\\div)-(\d+(?:\.\d+)?)/g, "$1(-$2)")
      .replace(/\+-(\d+(?:\.\d+)?)/g, "+(-$1)")
      .replace(/(\d)--(\d)/g, "$1-(-$2)");
  }
  function angD(x) {
    if (Math.abs(x - Math.round(x)) < 1e-8) return String(Math.round(x));
    return dp1(x);
  }
  function decn(n) {
    if (!Number.isFinite(n)) return String(n);
    if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
    for (let d = 1; d <= 6; d++) {
      const t = Math.round(n * Math.pow(10, d)) / Math.pow(10, d);
      if (Math.abs(n - t) < 1e-9) return t.toFixed(d);
    }
    return String(n);
  }
  function cubert(n) { return "\\sqrt[3]{" + n + "}"; }
  function pack(q, answer, solution, marks) {
    return {
      q: tidyMath(q),
      answer: tidyMath(answer),
      solution: (solution || []).map((row) => Object.assign({}, row, { answer: tidyMath(row.answer), guidance: tidyMath(row.guidance || "") })),
      marks
    };
  }

  function grid(xmax, ymax, opts) {
    const u = 18, ox = 28, oy = 18 + ymax * u;
    const W = ox + xmax * u + 28, H = 18 + ymax * u + 28;
    let s = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '" font-family="system-ui,sans-serif" font-size="11"><rect width="100%" height="100%" fill="#fff"/>';
    const X = (x) => ox + x * u, Y = (y) => oy - y * u;
    for (let x = 0; x <= xmax; x++) s += '<line x1="' + X(x) + '" y1="' + oy + '" x2="' + X(x) + '" y2="' + Y(ymax) + '" stroke="#e5e7eb"/><text x="' + X(x) + '" y="' + (oy + 14) + '" text-anchor="middle" fill="#6b7280">' + x + "</text>";
    for (let y = 1; y <= ymax; y++) s += '<line x1="' + ox + '" y1="' + Y(y) + '" x2="' + X(xmax) + '" y2="' + Y(y) + '" stroke="#e5e7eb"/><text x="' + (ox - 8) + '" y="' + (Y(y) + 4) + '" text-anchor="end" fill="#6b7280">' + y + "</text>";
    s += '<line x1="' + ox + '" y1="' + oy + '" x2="' + X(xmax) + '" y2="' + oy + '" stroke="#111" stroke-width="1.2"/><line x1="' + ox + '" y1="' + oy + '" x2="' + ox + '" y2="' + Y(ymax) + '" stroke="#111" stroke-width="1.2"/>';
    if (opts.poly) s += '<polygon points="' + opts.poly.map((p) => X(p[0]) + "," + Y(p[1])).join(" ") + '" fill="#93c5fd" fill-opacity="0.45" stroke="none"/>';
    (opts.lines || []).forEach((L) => {
      s += '<line x1="' + X(L.x1) + '" y1="' + Y(L.y1) + '" x2="' + X(L.x2) + '" y2="' + Y(L.y2) + '" stroke="#1d4ed8" stroke-width="1.6"' + (L.dash ? ' stroke-dasharray="5 4"' : "") + "/>";
    });
    if (opts.R) s += '<text x="' + X(opts.R[0]) + '" y="' + Y(opts.R[1]) + '" fill="#1e3a8a" font-weight="700">R</text>';
    return s + "</svg>";
  }

  function scatter(pts, xlab, ylab, xmax, ymax, xtick, ytick) {
    const L = 48, B = 28, T = 12, Rgt = 12;
    const W = L + 210 + Rgt, H = T + 140 + B;
    const X = (x) => Math.round((L + (x / xmax) * 210) * 100) / 100, Y = (y) => Math.round((T + 140 - (y / ymax) * 140) * 100) / 100;
    let s = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + (H + 12) + '" viewBox="0 0 ' + W + " " + (H + 12) + '" font-family="system-ui,sans-serif" font-size="10"><rect width="100%" height="100%" fill="#fff"/>';
    s += '<line x1="' + L + '" y1="' + (T + 140) + '" x2="' + (L + 210) + '" y2="' + (T + 140) + '" stroke="#111"/><line x1="' + L + '" y1="' + T + '" x2="' + L + '" y2="' + (T + 140) + '" stroke="#111"/>';
    for (let x = 0; x <= xmax; x += xtick) s += '<line x1="' + X(x) + '" y1="' + (T + 140) + '" x2="' + X(x) + '" y2="' + (T + 144) + '" stroke="#111"/><text x="' + X(x) + '" y="' + (T + 156) + '" text-anchor="middle" fill="#6b7280">' + x + "</text>";
    for (let y = 0; y <= ymax; y += ytick) s += '<line x1="' + (L - 4) + '" y1="' + Y(y) + '" x2="' + L + '" y2="' + Y(y) + '" stroke="#111"/><text x="' + (L - 6) + '" y="' + (Y(y) + 3) + '" text-anchor="end" fill="#6b7280">' + y + "</text>";
    s += '<text x="' + (L + 105) + '" y="' + (H + 8) + '" text-anchor="middle">' + xlab + "</text>";
    s += '<text transform="translate(11,' + (T + 70) + ') rotate(-90)" text-anchor="middle">' + ylab + "</text>";
    pts.forEach((p) => { s += '<circle cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="3" fill="#1d4ed8"/>'; });
    return s + "</svg>";
  }

  const G = {};

  function splitRow(A, n1, n2, C) {
    let s = (A === 1 ? "x^2" : nstr(A) + "x^2") + term(n1, "x") + term(n2, "x");
    if (C > 0) s += "+" + nstr(C); else if (C < 0) s += nstr(C);
    return s;
  }

  G["IGCSE-0-0"] = function (r) {
    const p = until(r, () => {
      const a = ir(r, 2, 7), u = pick(r, [1, 2, 3, 4, 5, 7]), v = pick(r, [1, 2, 3, 4, 5, 6, 7, 8]);
      if (!u || gcd(a, u) !== 1) return;
      const A = a, B = a * v + u, C = u * v;
      if (B < 3 || C < 1) return;
      const sp = splits(A, C, B); if (!sp) return;
      return { A, B, C, u, v, n1: sp[0], n2: sp[1] };
    });
    const fac = "(" + lin(p.A, p.u) + ")(" + lin(1, p.v) + ")";
    return pack("Factorise \\(" + quad(p.A, p.B, p.C) + "\\).", "\\(" + fac + "\\)", [
      R("", "\\(ac=" + p.A + "\\times" + p.C + "=" + (p.A * p.C) + "\\)"),
      R("", "numbers \\(" + p.n1 + "\\) and \\(" + p.n2 + "\\) (product \\(" + (p.A * p.C) + "\\), sum \\(" + p.B + "\\))"),
      R("", "\\(" + splitRow(p.A, p.n1, p.n2, p.C) + "\\)"),
      R("", "\\(" + group(p.A, p.n1, p.n2, p.C) + "\\)", "M1", "group"),
      R("", "\\(" + fac + "\\)", "A1", "cao")
    ], 2);
  };

  G["IGCSE-0-1"] = function (r) {
    const p = until(r, () => {
      const a = ir(r, 2, 7), u = pick(r, [1, 2, 3, 4, 5, 7]), v = pick(r, [-8, -7, -5, -4, -3, -2, 2, 3, 4, 5, 7, 8]);
      if (v > 0 && u > 0) return;
      if (gcd(a, u) !== 1) return;
      const A = a, B = a * v + u, C = u * v;
      const sp = splits(A, C, B); if (!sp) return;
      const root1 = -u / a, root2 = -v;
      if (root1 === root2) return;
      return { A, B, C, u, v, n1: sp[0], n2: sp[1], r1: root1, r2: root2 };
    });
    const fac = "(" + lin(p.A, p.u) + ")(" + lin(1, p.v) + ")";
    const x1 = p.u % p.A === 0 ? nstr(-p.u / p.A) : (p.u > 0 ? "-" : "") + frac(Math.abs(p.u), p.A);
    const x2 = nstr(-p.v);
    const a1 = p.r1 < p.r2 ? "\\(x=" + x1 + "\\) or \\(x=" + x2 + "\\)" : "\\(x=" + x2 + "\\) or \\(x=" + x1 + "\\)";
    if (-p.u / p.A > -p.v) { /* keep original order: fractional then integer if matches style */ }
    const ansX = "\\(x=" + (p.u > 0 ? "-" : "") + (Math.abs(p.u) % p.A === 0 ? nstr(Math.abs(p.u) / p.A) : "\\tfrac{" + Math.abs(p.u) + "}{" + p.A + "}") + "\\) or \\(x=" + nstr(-p.v) + "\\)";
    const o = pack("Solve \\(" + quad(p.A, p.B, p.C) + "=0\\) by factorising.", "\\(" + fac + "=0\\); " + ansX, [
      R("", "\\(ac=" + p.A + "\\times(" + nstr(p.C) + ")=" + nstr(p.A * p.C) + "\\)"),
      R("", "numbers \\(" + p.n1 + "\\) and \\(" + p.n2 + "\\) (product \\(" + nstr(p.A * p.C) + "\\), sum \\(" + nstr(p.B) + "\\))"),
      R("", "\\(" + splitRow(p.A, p.n1, p.n2, p.C) + "\\)"),
      R("", "\\(" + group(p.A, p.n1, p.n2, p.C) + "\\)", "M1", "group"),
      R("", "\\(" + fac + "=0\\)", "A1", "oe factors"),
      R("", ansX, "A1", "oe")
    ], 3);
    o._chk = { r1: Math.abs(p.A * p.r1 * p.r1 + p.B * p.r1 + p.C) < 1e-9, r2: Math.abs(p.A * p.r2 * p.r2 + p.B * p.r2 + p.C) < 1e-9 };
    return o;
  };

  G["IGCSE-0-2"] = function (r) {
    const p = until(r, () => {
      const k = pick(r, [2, 3, 4, 5]);
      const a = ir(r, 2, 4), u = pick(r, [1, 3, 5]), v = pick(r, [-5, -4, -3, -2, 2, 3, 4]);
      if (gcd(a, u) !== 1) return;
      const A = a, B = a * v + u, C = u * v;
      if (B === 0) return;
      const sp = splits(A, C, B); if (!sp) return;
      return { k, A, B, C, u, v, n1: sp[0], n2: sp[1], fa: k * A, fb: k * B, fc: k * C };
    });
    const inner = quad(p.A, p.B, p.C);
    const fac = p.k + "(" + lin(p.A, p.u) + ")(" + lin(1, p.v) + ")";
    return pack("Factorise completely \\(" + quad(p.fa, p.fb, p.fc) + "\\).", "\\(" + fac + "\\)", [
      R("", "\\(" + quad(p.fa, p.fb, p.fc) + "=" + p.k + "(" + inner + ")\\)", "M1", "common factor first"),
      R("", "\\(ac=" + timesAC(p.A, p.C) + "=" + nstr(p.A * p.C) + "\\)"),
      R("", "numbers \\(" + p.n1 + "\\) and \\(" + p.n2 + "\\)"),
      R("", "\\(" + splitRow(p.A, p.n1, p.n2, p.C) + "\\)"),
      R("", "\\(" + group(p.A, p.n1, p.n2, p.C) + "\\)"),
      R("", "\\(" + fac + "\\)", "A1", "completely, cao")
    ], 2);
  };

  G["IGCSE-0-3"] = function (r) {
    const p = until(r, () => {
      const a = pick(r, [-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]);
      const k = pick(r, [1, 2, 3, 4]);
      const p1 = ir(r, 2, 12), q1 = ir(r, 2, 12);
      const A = k, B = -k * a - p1 + q1, C = -q1 * a;
      if (gcd(gcd(Math.abs(A), Math.abs(B)), Math.abs(C)) !== 1) return;
      const fp = factorPair(A, B, C); if (!fp || fp.g !== 1) return;
      const sp = splits(A, C, B); if (!sp) return;
      const r1 = -fp.p / fp.d, r2 = -fp.q / fp.e;
      if (r1 === 0 || r2 === 0 || r1 === a || r2 === a || r1 === r2) return;
      return { a, k, p1, q1, A, B, C, n1: sp[0], n2: sp[1], r1, r2, fp };
    });
    function rs(x) { return nstr(x); }
    const factors = facTex(p.fp);
    const den = p.a < 0 ? "x+" + (-p.a) : "x-" + p.a;
    const roots = "\\(x=" + rs(p.r1) + "\\) or \\(x=" + rs(p.r2) + "\\)";
    const o = pack("Solve \\(\\dfrac{" + p.p1 + "}{" + den + "}-\\dfrac{" + p.q1 + "}{x}=" + p.k + "\\).", "\\(" + quad(p.A, p.B, p.C) + "=0\\Rightarrow" + factors + "=0\\); " + roots, [
      R("", "multiply by \\(x(" + den + ")\\)", "M1", "multiply by \\(x(" + den + ")\\)"),
      R("", "\\(" + p.p1 + "x-" + p.q1 + "(" + den + ")=" + kx(p.k) + "(" + den + ")\\)"),
      R("", "\\(" + p.p1 + "x-" + p.q1 + "x" + (p.q1 * p.a >= 0 ? "+" + (p.q1 * p.a) : nstr(p.q1 * p.a)) + "=" + (p.k === 1 ? "x^2" : p.k + "x^2") + term(-p.k * p.a, "x") + "\\)"),
      R("", "\\(" + quad(p.A, p.B, p.C) + "=0\\)", "M1", "quadratic \\(=0\\)"),
      R("", "\\(ac=" + nstr(p.A * p.C) + "\\); numbers \\(" + p.n1 + "\\) and \\(" + p.n2 + "\\)"),
      R("", "\\(" + splitRow(p.A, p.n1, p.n2, p.C) + "\\)"),
      R("", "\\(" + group(p.A, p.n1, p.n2, p.C) + "\\)", "M1", "group"),
      R("", "\\(" + factors + "=0\\)"),
      R("", roots, "A1", "oe"),
      R("", "neither makes a denominator zero")
    ], 4);
    o._chk = { fac: p.fp.d * p.fp.e === p.A && p.fp.p * p.fp.q === p.C && p.fp.d * p.fp.q + p.fp.e * p.fp.p === p.B, prim: gcd(gcd(Math.abs(p.A), Math.abs(p.B)), Math.abs(p.C)) === 1 };
    return o;
  };

  G["IGCSE-0-4"] = function (r) {
    const p = until(r, () => {
      const x = pick(r, [3, 4, 5, 6, 8, 10, 12]);
      const k = pick(r, [2, 3, 4, 5, 6, 8]);
      const d1 = pick(r, [6, 8, 9, 10, 12, 15, 16, 18, 20, 24]);
      const d2 = pick(r, [8, 10, 12, 15, 16, 18, 20, 24, 30, 36]);
      if (d1 % x) return;
      if (d2 % (x + k)) return;
      const T = d1 / x + d2 / (x + k);
      if (!Number.isInteger(T) || T < 2 || T > 6) return;
      const A = T, B = T * k - d1 - d2, C = -d1 * k;
      if (gcd(gcd(Math.abs(A), Math.abs(B)), Math.abs(C)) !== 1) return;
      const fp = factorPair(A, B, C); if (!fp || fp.g !== 1) return;
      const sp = splits(A, C, B); if (!sp) return;
      const x1 = -fp.p / fp.d, x2 = -fp.q / fp.e;
      const pos = [x1, x2].filter((z) => z > 0);
      if (pos.length !== 1 || Math.abs(pos[0] - x) > 1e-9) return;
      const tCyc = d2 / (x + k);
      return { T, k, d1, d2, A, B, C, n1: sp[0], n2: sp[1], x, x1, x2, tCyc, cyc: x + k, fp };
    });
    const qeq = quad(p.A, p.B, p.C);
    const factors = facTex(p.fp);
    function xs(x) { return nstr(x); }
    const rej = p.x1 === p.x ? p.x2 : p.x1;
    const tShow = nstr(p.tCyc);
    const o4 = pack(
      "Kim walks \\(" + p.d1 + "\\) km at \\(x\\) km/h and then cycles \\(" + p.d2 + "\\) km at \\((x+" + p.k + ")\\) km/h. The whole journey takes \\(" + p.T + "\\) hours. (a) Show that \\(" + qeq + "=0\\). (b) Solve the equation and find how long Kim spends cycling.",
      "(a) \\(\\frac{" + p.d1 + "}{x}+\\frac{" + p.d2 + "}{x+" + p.k + "}=" + p.T + "\\Rightarrow " + p.d1 + "(x+" + p.k + ")+" + p.d2 + "x=" + p.T + "x(x+" + p.k + ")\\Rightarrow " + qeq + "=0\\). (b) \\(" + factors + "=0\\); \\(x=" + nstr(p.x) + "\\) (reject \\(" + xs(rej) + "\\), a speed cannot be negative); cycling time \\(=\\frac{" + p.d2 + "}{" + nstr(p.cyc) + "}=" + tShow + "\\) " + (tShow === "1" ? "hour" : "hours"),
      [
        R("(a)", "\\(\\dfrac{" + p.d1 + "}{x}+\\dfrac{" + p.d2 + "}{x+" + p.k + "}=" + p.T + "\\)", "M1", "times as distance/speed"),
        R("(a)", "multiply by \\(x(x+" + p.k + ")\\)", "M1", "multiply through"),
        R("(a)", "\\(" + p.d1 + "(x+" + p.k + ")+" + p.d2 + "x=" + p.T + "x(x+" + p.k + ")\\)"),
        R("(a)", "\\(" + p.d1 + "x+" + (p.d1 * p.k) + "+" + p.d2 + "x=" + p.T + "x^2" + term(p.T * p.k, "x") + "\\)"),
        R("(a)", "\\(" + qeq + "=0\\)", "A1", "AG"),
        R("(b)", "\\(ac=" + nstr(p.A * p.C) + "\\); numbers \\(" + p.n1 + "\\) and \\(" + p.n2 + "\\)", "M1", "factorise"),
        R("(b)", "\\(" + splitRow(p.A, p.n1, p.n2, p.C) + "\\)"),
        R("(b)", "\\(" + group(p.A, p.n1, p.n2, p.C) + "\\)"),
        R("(b)", "\\(" + factors + "=0\\)"),
        R("(b)", "\\(x=" + xs(p.x1) + "\\) or \\(x=" + xs(p.x2) + "\\)", "A1", "\\(x=" + nstr(p.x) + "\\)"),
        R("(b)", "reject \\(x=" + xs(rej) + "\\) (speed cannot be negative)"),
        R("(b)", "cycling speed \\(=x+" + p.k + "=" + nstr(p.cyc) + "\\) km/h"),
        R("(b)", "time \\(=\\dfrac{" + p.d2 + "}{" + nstr(p.cyc) + "}=" + tShow + "\\) " + (tShow === "1" ? "hour" : "hours"), "A1", "FT their \\(x+" + p.k + "\\)")
      ], 6);
    o4._chk = { fac: p.fp.d * p.fp.e === p.A && p.fp.p * p.fp.q === p.C && p.fp.d * p.fp.q + p.fp.e * p.fp.p === p.B, prim: gcd(gcd(Math.abs(p.A), Math.abs(p.B)), Math.abs(p.C)) === 1 };
    return o4;
  };

  G["IGCSE-1-0"] = function (r) {
    const p = until(r, () => {
      const x = ir(r, 2, 8), y = ir(r, 1, 8);
      const a = ir(r, 2, 6), b = ir(r, 2, 6);
      const c = a + ir(r, 1, 4), d = b;
      const e1 = a * x + b * y, e2 = c * x - d * y;
      if (e1 <= 0 || e2 === 0) return;
      if (a === c) return;
      return { a, b, c, d, x, y, e1, e2, sx: a + c, se: e1 + e2 };
    });
    return pack("Solve the simultaneous equations \\(" + lin(p.a, 0) + term(p.b, "y") + "=" + p.e1 + "\\) and \\(" + lin(p.c, 0) + term(-p.d, "y") + "=" + nstr(p.e2) + "\\).",
      "\\(x=" + p.x + ",\\ y=" + p.y + "\\)", [
        R("", "\\(" + lin(p.a, 0) + term(p.b, "y") + "=" + p.e1 + "\\) …(1)"),
        R("", "\\(" + lin(p.c, 0) + term(-p.d, "y") + "=" + nstr(p.e2) + "\\) …(2)"),
        R("", "add: \\(" + (p.a + p.c) + "x=" + (p.e1 + p.e2) + "\\)", "M1", "eliminate"),
        R("", "\\(x=" + p.x + "\\)", "A1", "cao"),
        R("", "into (1): \\(" + (p.a * p.x) + term(p.b, "y") + "=" + p.e1 + "\\)"),
        R("", "\\(y=" + p.y + "\\)", "A1", "cao"),
        R("", "check (2): \\(" + (p.c * p.x) + (p.d * p.y ? (p.e2 === p.c * p.x - p.d * p.y ? "-" + (p.d * p.y) : "") : "") + "=" + nstr(p.e2) + "\\)")
      ], 3);
  };

  G["IGCSE-1-1"] = function (r) {
    const p = until(r, () => {
      const x = ir(r, 2, 7), y = ir(r, 2, 8);
      const a = ir(r, 2, 5), b = ir(r, 2, 5), c = ir(r, 2, 5), d = ir(r, 2, 5);
      if (a * d === b * c) return;
      const e1 = a * x - b * y, e2 = c * x + d * y;
      const m1 = d, m2 = b;
      if (m1 * b !== m2 * d) return;
      return { a, b, c, d, x, y, e1, e2, m1, m2 };
    });
    const t1a = p.a * p.m1, t1b = p.b * p.m1, t1e = p.e1 * p.m1;
    const t2a = p.c * p.m2, t2b = p.d * p.m2, t2e = p.e2 * p.m2;
    return pack("Solve the simultaneous equations \\(" + lin(p.a, 0) + term(-p.b, "y") + "=" + nstr(p.e1) + "\\) and \\(" + lin(p.c, 0) + term(p.d, "y") + "=" + p.e2 + "\\).",
      "\\(x=" + p.x + ",\\ y=" + p.y + "\\)", [
        R("", "\\(" + lin(p.a, 0) + term(-p.b, "y") + "=" + nstr(p.e1) + "\\) …(1)"),
        R("", "\\(" + lin(p.c, 0) + term(p.d, "y") + "=" + p.e2 + "\\) …(2)"),
        R("", "(1)\\(\\times" + p.m1 + "\\): \\(" + lin(t1a, 0) + term(-t1b, "y") + "=" + nstr(t1e) + "\\)"),
        R("", "(2)\\(\\times" + p.m2 + "\\): \\(" + lin(t2a, 0) + term(t2b, "y") + "=" + t2e + "\\)"),
        R("", "add: \\(" + (t1a + t2a) + "x=" + (t1e + t2e) + "\\)", "M1", "eliminate"),
        R("", "\\(x=" + p.x + "\\)", "A1", "cao"),
        R("", "into (2): \\(" + (p.c * p.x) + term(p.d, "y") + "=" + p.e2 + "\\)"),
        R("", "\\(y=" + p.y + "\\)", "A1", "cao")
      ], 3);
  };

  G["IGCSE-1-2"] = function (r) {
    const p = until(r, () => {
      const m = ir(r, 2, 5), k = ir(r, 1, 12), x = ir(r, 2, 8);
      const y = m * x - k;
      if (y === 0) return;
      const a = ir(r, 2, 5), b = ir(r, 2, 6);
      const rhs = a * x + b * y;
      return { m, k, x, y, a, b, rhs };
    });
    return pack("Solve the simultaneous equations \\(y=" + lin(p.m, -p.k) + "\\) and \\(" + lin(p.a, 0) + term(p.b, "y") + "=" + nstr(p.rhs) + "\\).",
      "\\(x=" + p.x + ",\\ y=" + nstr(p.y) + "\\)", [
        R("", "\\(" + p.a + "x+" + p.b + "(" + lin(p.m, -p.k) + ")=" + nstr(p.rhs) + "\\)", "M1", "substitute for \\(y\\)"),
        R("", "\\(" + p.a + "x+" + (p.b * p.m) + "x-" + (p.b * p.k) + "=" + nstr(p.rhs) + "\\)"),
        R("", "\\(" + (p.a + p.b * p.m) + "x=" + (p.rhs + p.b * p.k) + "\\)"),
        R("", "\\(x=" + p.x + "\\)", "A1", "cao"),
        R("", "\\(y=" + p.m + "\\times" + p.x + "-" + p.k + "\\)"),
        R("", "\\(y=" + nstr(p.y) + "\\)", "A1", "FT")
      ], 3);
  };

  G["IGCSE-1-3"] = function (r) {
    const p = until(r, () => {
      const a = ir(r, 8, 16), c = ir(r, 4, 9);
      if (a === c) return;
      const e1 = 2 * a + 3 * c, e2 = a + 4 * c;
      const bud = pick(r, [80, 90, 100, 120]);
      const left = bud - a;
      if (left / c < 4) return;
      const n = Math.floor(left / c);
      if (Number.isInteger(left / c)) return;
      return { a, c, e1, e2, bud, left, n, q: left / c };
    });
    return pack("Two adult tickets and three child tickets cost \\$" + p.e1 + ". One adult ticket and four child tickets cost \\$" + p.e2 + ". (a) Find the cost of one adult ticket and one child ticket. (b) A group must include exactly one adult. They have \\$" + p.bud + ". Find the greatest number of child tickets they can buy.",
      "(a) adult \\$" + p.a + ", child \\$" + p.c + " (b) \\((" + p.bud + "-" + p.a + ")\\div" + p.c + "=" + dots(p.q, 1) + "\\), so " + p.n,
      [
        R("(a)", "\\(2a+3c=" + p.e1 + "\\) …(1)", "M1", "form equations"),
        R("(a)", "\\(a+4c=" + p.e2 + "\\) …(2)"),
        R("(a)", "(2)\\(\\times2\\): \\(2a+8c=" + (2 * p.e2) + "\\)", "M1", "eliminate"),
        R("(a)", "subtract (1): \\(5c=" + (2 * p.e2 - p.e1) + "\\)"),
        R("(a)", "\\(c=" + p.c + "\\)"),
        R("(a)", "\\(a+" + (4 * p.c) + "=" + p.e2 + "\\)"),
        R("(a)", "\\(a=" + p.a + "\\)", "A1", "adult \\(\\$" + p.a + "\\), child \\(\\$" + p.c + "\\)"),
        R("(b)", "\\(" + p.bud + "-" + p.a + "=" + p.left + "\\)"),
        R("(b)", "\\(" + p.left + "\\div" + p.c + "=" + dots(p.q, 1) + "\\)"),
        R("(b)", "greatest whole number \\(=" + p.n + "\\)", "B1", "FT integer down")
      ], 4);
  };

  G["IGCSE-1-4"] = function (r) {
    const p = until(r, () => {
      const m = pick(r, [90, 110, 120, 130, 150]);
      const pine = pick(r, [200, 250, 280, 300, 350]);
      const n1 = 4, n2 = 3, n3 = 6, n4 = 5;
      const e1 = n1 * m + n2 * pine, e2 = n3 * m + n4 * pine;
      const have = pick(r, [2000, 2500, 3000]);
      const buyP = 2;
      const spentP = buyP * pine;
      const left = have - spentP;
      if (left / m < 5) return;
      if (Number.isInteger(left / m)) return;
      const nm = Math.floor(left / m);
      const spent = spentP + nm * m, ch = have - spent;
      return { m, pine, e1, e2, have, spentP, left, nm, spent, ch };
    });
    const md = money(p.m / 100), pd = money(p.pine / 100);
    const e1d = money(p.e1 / 100), e2d = money(p.e2 / 100);
    const hd = money(p.have / 100), spd = money(p.spentP / 100), ld = money(p.left / 100);
    const qdiv = p.left / p.m;
    const mspend = money((p.nm * p.m) / 100), tot = money(p.spent / 100), chd = money(p.ch / 100);
    return pack("At a market, 4 mangoes and 3 pineapples cost \\$" + e1d + ". 6 mangoes and 5 pineapples cost \\$" + e2d + ". (a) Find the cost of one mango and the cost of one pineapple. (b) Sara has \\$" + hd.replace(/\.00$/, "") + ". She buys 2 pineapples and then as many mangoes as possible. Find how many mangoes she buys and how much change she gets.",
      "(a) mango \\$" + md + ", pineapple \\$" + pd + " (b) \\(" + hd.replace(/\.00$/, "") + "-" + spd + "=" + ld + "\\); \\(" + ld + "\\div" + md + "=" + dots(qdiv, 1) + "\\): " + p.nm + " mangoes, change \\$" + chd,
      [
        R("(a)", "\\(4m+3p=" + e1d + "\\) …(1)", "M1", "form equations"),
        R("(a)", "\\(6m+5p=" + e2d + "\\) …(2)"),
        R("(a)", "(1)\\(\\times5\\): \\(20m+15p=" + money(p.e1 * 5 / 100) + "\\)", "M1", "eliminate"),
        R("(a)", "(2)\\(\\times3\\): \\(18m+15p=" + money(p.e2 * 3 / 100) + "\\)"),
        R("(a)", "subtract: \\(2m=" + money((p.e1 * 5 - p.e2 * 3) / 100) + "\\)"),
        R("(a)", "\\(m=" + md + "\\)", "A1", "mango"),
        R("(a)", "\\(" + money(4 * p.m / 100) + "+3p=" + e1d + "\\)"),
        R("(a)", "\\(p=" + pd + "\\)", "A1", "pineapple"),
        R("(b)", "\\(2\\times" + pd + "=" + spd + "\\)"),
        R("(b)", "\\(" + (p.have / 100 === Math.floor(p.have / 100) ? String(p.have / 100) : hd) + "-" + spd + "=" + ld + "\\)", "M1", "remaining then divide"),
        R("(b)", "\\(" + ld + "\\div" + md + "=" + dots(qdiv, 1) + "\\)"),
        R("(b)", "\\(" + p.nm + "\\) mangoes", "A1", p.nm + " mangoes"),
        R("(b)", "spent \\(" + spd + "+" + mspend + "=" + tot + "\\)"),
        R("(b)", "change \\(\\$" + chd + "\\)", "A1", "change")
      ], 7);
  };

  G["IGCSE-2-0"] = function (r) {
    const p = until(r, () => {
      const h = ir(r, 1, 7), v = ir(r, 2, 10), b = h;
      if (h + v > 14 || v < 2) return;
      return { h, v, b };
    });
    const h = p.h, v = p.v, b = p.b;
    const xmax = Math.max(9, v + 2), ymax = Math.max(9, v + b + 1);
    const svg = grid(xmax, ymax, {
      poly: [[0, h], [v, h], [v, v + b]],
      lines: [
        { x1: 0, y1: h, x2: xmax, y2: h },
        { x1: v, y1: 0, x2: v, y2: ymax, dash: 1 },
        { x1: 0, y1: b, x2: ymax - b, y2: ymax }
      ],
      R: [(2 * v) / 3, (3 * h + v) / 3]
    });
    const q = '<div class="flex"><div>Write down the three inequalities that define the region \\(R\\) (shaded).</div><div class="fig">' + svg + "</div></div>";
    const ans = "\\(y\\ge" + h + "\\), \\(x\\lt" + v + "\\), \\(y\\le x+" + b + "\\)";
    return pack(q, ans, [
      R("", "solid horizontal line \\(y=" + h + "\\); \\(R\\) above \\(\\Rightarrow y\\ge" + h + "\\)", "B1", "\\(y\\ge" + h + "\\)"),
      R("", "dashed vertical line \\(x=" + v + "\\); \\(R\\) to the left \\(\\Rightarrow x\\lt" + v + "\\)", "B1", "\\(x<" + v + "\\)"),
      R("", "oblique line through \\((0," + b + ")\\) with gradient \\(1\\): \\(y=x+" + b + "\\)"),
      R("", "\\(R\\) below the line \\(\\Rightarrow y\\le x+" + b + "\\)", "B1", "\\(y\\le x+" + b + "\\)"),
      R("", ans)
    ], 3);
  };

  G["IGCSE-2-1"] = function (r) {
    const p = until(r, () => {
      const a = ir(r, 2, 5), c = ir(r, 8, 22), xmin = pick(r, [1, 2]), ymin = pick(r, [1, 2]);
      const lists = [];
      let n = 0;
      for (let x = xmin; ; x++) {
        const ymax = c - a * x;
        if (ymax < ymin) break;
        const ys = [];
        for (let y = ymin; y <= ymax; y++) ys.push(y);
        lists.push({ x, ys });
        n += ys.length;
      }
      if (lists.length < 3 || lists.length > 6 || n < 6) return;
      return { a, c, xmin, ymin, lists, n };
    });
    return pack("How many points with integer coordinates satisfy \\(x\\ge" + p.xmin + "\\), \\(y\\ge" + p.ymin + "\\) and \\(" + p.a + "x+y\\le" + p.c + "\\)?",
      p.n + ": " + p.lists.map((L) => "\\((" + L.x + "," + L.ys[0] + ")\\)" + (L.ys.length > 1 ? "–\\((" + L.x + "," + L.ys[L.ys.length - 1] + ")\\)" : "")).join(", "),
      [
        R("", "\\(y\\le" + p.c + "-" + p.a + "x\\) with \\(x\\ge" + p.xmin + "\\), \\(y\\ge" + p.ymin + "\\) integers", "M1", "list integer points"),
        ...p.lists.map((L) => R("", "\\(x=" + L.x + "\\): \\(y=" + L.ys.join(",") + "\\)")),
        R("", "\\(x\\ge" + (p.lists[p.lists.length - 1].x + 1) + "\\): none"),
        R("", "\\(" + p.n + "\\) points", "A1", p.n + " cao")
      ], 2);
  };

  G["IGCSE-2-2"] = function (r) {
    const p = until(r, () => {
      const xint = ir(r, 3, 8), yint = ir(r, 4, 10);
      if (gcd(xint, yint) === Math.min(xint, yint) && xint !== 4) { /* ok */ }
      const g = gcd(yint, xint);
      const a = yint / g, b = xint / g, c = xint * yint / g;
      if (a * b * c === 0) return;
      return { xint, yint, a, b, c, g: -yint / xint };
    });
    const svg = grid(Math.max(6, p.xint + 2), Math.max(7, p.yint + 1), {
      poly: [[0, 0], [0, p.yint], [p.xint, 0]],
      lines: [{ x1: 0, y1: p.yint, x2: p.xint, y2: 0, dash: 1 }],
      R: [0.8, p.yint * 0.35]
    });
    const gf = frac(-p.yint, p.xint);
    const line = lin(p.a, 0) + (p.b === 1 ? "+y" : term(p.b, "y")) + "=" + p.c;
    const ineq = lin(p.a, 0) + (p.b === 1 ? "+y" : term(p.b, "y")) + "\\lt" + p.c;
    const q = '<div class="flex"><div>The region \\(R\\) is bounded by the axes and a dashed line through \\((0,' + p.yint + ")\\) and \\((" + p.xint + ',0)\\). Find the inequality, in the form \\(ax+by\\lt c\\), that the dashed line gives.</div><div class="fig">' + svg + "</div></div>";
    return pack(q, "gradient \\(" + gf + "\\), line \\(" + line + "\\); \\(" + ineq + "\\)", [
      R("", "gradient \\(=\\dfrac{0-" + p.yint + "}{" + p.xint + "-0}=" + gf + "\\)", "M1", "gradient"),
      R("", "\\(y-" + p.yint + "=" + slopeX(-p.yint / p.xint) + "\\)", "M1", "line equation"),
      R("", "\\(" + (p.b === 1 ? "y" : p.b + "y") + "-" + p.c + "=" + (p.a === 1 ? "-x" : nstr(-p.a) + "x") + "\\)"),
      R("", "\\(" + line + "\\)"),
      R("", "test \\((0,0)\\): \\(0\\lt" + p.c + "\\), true, and \\(R\\) includes the origin"),
      R("", "dashed line \\(\\Rightarrow\\) strict inequality"),
      R("", "\\(" + ineq + "\\)", "A1", "\\(" + ineq.replace("\\lt", "<") + "\\)")
    ], 3);
  };

  G["IGCSE-2-3"] = function (r) {
    const p = until(r, () => {
      const px = ir(r, 2, 5), py = ir(r, 1, 3);
      const ymin = 2, xmin = 1, cap = ir(r, 8, 14);
      const cy = ir(r, 2, 3);
      let best = -1, bx, by, alts = [];
      for (let y = ymin; y <= cap; y++) {
        const xmax = cap - cy * y;
        if (xmax < xmin) continue;
        const x = xmax;
        const v = px * x + py * y;
        alts.push({ y, v, x });
        if (v > best) { best = v; bx = x; by = y; }
      }
      if (best < 8) return;
      if (by !== ymin) return;
      const uniq = alts.filter((z) => z.v === best);
      if (uniq.length !== 1) return;
      return { px, py, ymin, xmin, cap, cy, best, bx, by, alts };
    });
    const a3 = p.alts.find((z) => z.y === p.ymin + 1);
    const a4 = p.alts.find((z) => z.y === p.ymin + 2);
    return pack("The integers \\(x\\) and \\(y\\) satisfy \\(x\\ge" + p.xmin + "\\), \\(y\\ge" + p.ymin + "\\) and \\(x+" + p.cy + "y\\le" + p.cap + "\\). Find the greatest possible value of \\(" + p.px + "x" + (p.py === 1 ? "+y" : term(p.py, "y")) + "\\).",
      p.best + ", at \\((" + p.bx + "," + p.by + ")\\)", [
        R("", "\\(x\\le" + p.cap + "-" + p.cy + "y\\) with \\(x\\ge" + p.xmin + "\\), \\(y\\ge" + p.ymin + "\\) integers", "M1", "rearrange"),
        R("", "\\(" + p.px + "x" + (p.py === 1 ? "+y" : term(p.py, "y")) + "\\) largest when \\(x\\) is largest, so \\(y=" + p.ymin + "\\)", "M1", "max at min \\(y\\)"),
        R("", "then \\(x\\le" + p.bx + "\\), take \\(x=" + p.bx + "\\)"),
        R("", "\\(" + p.px + "(" + p.bx + ")+" + p.py * p.by + "=" + p.best + "\\) at \\((" + p.bx + "," + p.by + ")\\)", "A1", "\\(" + p.best + "\\) at \\((" + p.bx + "," + p.by + ")\\)"),
        R("", "\\(y=" + (p.ymin + 1) + "\\): " + (a3 ? "max \\(" + a3.v + "\\)" : "no valid \\(x\\)") + "; \\(y=" + (p.ymin + 2) + "\\): " + (a4 ? "max \\(" + a4.v + "\\)" : "no valid \\(x\\)"))
      ], 3);
  };

  G["IGCSE-2-4"] = function (r) {
    const p = until(r, () => {
      const seatM = 12, seatC = 4, people = pick(r, [48, 52, 56, 60, 64]);
      const k = people / 4;
      if (!Number.isInteger(k)) return;
      const xmax = pick(r, [4, 5, 6]);
      const vmax = pick(r, [7, 8, 9]);
      const ymin = 1;
      const cm = pick(r, [80, 90, 100]), cc = pick(r, [30, 40, 50]);
      const pts = [];
      for (let x = 0; x <= xmax; x++) for (let y = ymin; y <= vmax; y++) {
        if (3 * x + y >= k && x <= xmax && x + y <= vmax && y >= ymin) pts.push([x, y]);
      }
      if (pts.length < 3 || pts.length > 8) return;
      const costs = pts.map((pt) => ({ pt, c: cm * pt[0] + cc * pt[1] }));
      costs.sort((a, b) => a.c - b.c);
      if (costs.length < 2 || costs[0].c === costs[1].c) return;
      return { people, k, xmax, vmax, ymin, cm, cc, pts, costs };
    });
    const pts = p.pts.map((z) => "(" + z[0] + "," + z[1] + ")").join(",");
    const clist = p.pts.map((z) => p.cm * z[0] + p.cc * z[1]).join(",");
    const best = p.costs[0];
    return pack("A club hires \\(x\\) minibuses (12 seats each) and \\(y\\) cars (4 seats each) for at least " + p.people + " people. It can hire at most " + p.xmax + " minibuses, at most " + p.vmax + " vehicles altogether, and at least 1 car. (a) Show that \\(3x+y\\ge" + p.k + "\\). (b) On the grid, draw \\(3x+y=" + p.k + "\\), \\(x+y=" + p.vmax + "\\), \\(x=" + p.xmax + "\\) and \\(y=1\\), and shade the unwanted region. (c) A minibus costs \\$" + p.cm + " and a car costs \\$" + p.cc + ". Find the cheapest choice and its cost.",
      "(a) \\(12x+4y\\ge" + p.people + "\\), divide by 4. (b) Integer points in \\(R\\): \\(" + pts + "\\). (c) " + best.pt[0] + " minibuses and " + best.pt[1] + " cars, \\$" + best.c,
      [
        R("(a)", "\\(12x+4y\\ge" + p.people + "\\)", "M1", "\\(12x+4y\\ge" + p.people + "\\)"),
        R("(a)", "divide by \\(4\\): \\(3x+y\\ge" + p.k + "\\)"),
        R("(b)", "also \\(x\\le" + p.xmax + "\\), \\(x+y\\le" + p.vmax + "\\), \\(y\\ge1\\)"),
        R("(b)", "draw \\(3x+y=" + p.k + "\\) (solid); test \\((0,0)\\): \\(0\\ge" + p.k + "\\) false, so shade the origin side (unwanted)", "B1", "\\(3x+y=" + p.k + "\\) drawn"),
        R("(b)", "draw \\(x+y=" + p.vmax + "\\) (solid); test \\((0,0)\\): \\(0\\le" + p.vmax + "\\) true, so shade the far side of the line (unwanted)", "B1", "\\(x+y=" + p.vmax + "\\) drawn"),
        R("(b)", "draw \\(x=" + p.xmax + "\\) (solid); \\(x\\le" + p.xmax + "\\) so shade \\(x&gt;" + p.xmax + "\\) (unwanted)", "B1", "\\(x=" + p.xmax + "\\) and \\(y=1\\) with correct shading"),
        R("(b)", "draw \\(y=1\\) (solid); \\(y\\ge1\\) so shade \\(y&lt;1\\) (unwanted)"),
        R("(b)", "label the unshaded region \\(R\\)"),
        R("(b)", "for small \\(x\\) we need \\(y\\ge" + p.k + "-3x\\) but \\(y\\le" + p.vmax + "-x\\)"),
        R("(b)", "integer points exist only for the listed pairs"),
        R("(b)", "integer points in \\(R\\): \\(" + pts + "\\)"),
        R("(c)", "cost \\(=" + p.cm + "x+" + p.cc + "y\\)", "M1", "cost \\(" + p.cm + "x+" + p.cc + "y\\)"),
        R("(c)", "\\(" + clist + "\\)"),
        R("(c)", "cheapest: \\(" + best.pt[0] + "\\) minibuses and \\(" + best.pt[1] + "\\) cars, \\(\\$" + best.c + "\\)", "A1", best.pt[0] + " minibuses and " + best.pt[1] + " cars, \\(\\$" + best.c + "\\)")
      ], 6);
  };

  G["IGCSE-3-0"] = function (r) {
    const b1 = pick(r, [100, 105, 110, 115, 120, 125, 130, 140, 145, 150, 155, 160, 170]);
    const b2 = pick(r, [240, 250, 255, 260, 270, 280, 290, 300, 310, 320, 330, 340]);
    const a = (b1 + 180) % 360, c = (b2 + 180) % 360;
    const a1 = b1 < 180 ? b1 + 180 : b1 - 180;
    const a2 = b2 < 180 ? b2 + 180 : b2 - 180;
    return pack("The bearing of B from A is \\(" + pad3(b1) + "^\\circ\\). The bearing of D from C is \\(" + pad3(b2) + "^\\circ\\). Write down (a) the bearing of A from B, (b) the bearing of C from D.",
      "(a) \\(" + pad3(a1) + "^\\circ\\) (b) \\(" + pad3(a2) + "^\\circ\\)", [
        R("", "back bearing: add or subtract \\(180^\\circ\\)"),
        R("(a)", "\\(" + pad3(b1) + "^\\circ" + (b1 < 180 ? "+" : "-") + "180^\\circ=" + pad3(a1) + "^\\circ\\)", "B1", "\\(" + pad3(a1) + "^\\circ\\)"),
        R("(b)", "\\(" + pad3(b2) + "^\\circ" + (b2 < 180 ? "+" : "-") + "180^\\circ=" + pad3(a2) + "^\\circ\\)", "B1", "\\(" + pad3(a2) + "^\\circ\\)")
      ], 2);
  };

  G["IGCSE-3-1"] = function (r) {
    const h = pick(r, [35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90]);
    const ang = pick(r, [18, 20, 22, 24, 25, 26, 28, 30, 32, 35, 38]);
    const d = h / Math.tan(rad(ang));
    return pack("From the top of a cliff " + h + " m high, the angle of depression of a boat is \\(" + ang + "^\\circ\\). Find the horizontal distance from the foot of the cliff to the boat.",
      "\\(" + h + "\\div\\tan" + ang + "^\\circ=" + dots(d, 2) + "\\approx" + sf(d) + "\\) m", [
        R("", "angle of elevation from the boat \\(=" + ang + "^\\circ\\)"),
        R("", "\\(\\tan" + ang + "^\\circ=\\dfrac{" + h + "}{d}\\)", "M1", "\\(\\tan\\)"),
        R("", "\\(d=\\dfrac{" + h + "}{\\tan" + ang + "^\\circ}=" + dots(d, 3) + "\\)", "M1", "unrounded"),
        R("", "\\(" + sf(d) + "\\) m (3 s.f.)", "A1", "3 s.f. or better")
      ], 3);
  };

  G["IGCSE-3-2"] = function (r) {
    const ab = pick(r, [5, 6, 7, 8, 9, 10, 11, 12]);
    const ang = pick(r, [28, 30, 32, 34, 35, 36, 38, 40, 42, 44, 48]);
    const bc = ab * Math.tan(rad(ang));
    const ac = ab / Math.cos(rad(ang));
    const bc2 = Number(bc.toFixed(2));
    return pack("Triangle ABC has a right angle at B, \\(AB=" + ab + "\\) cm and angle \\(BAC=" + ang + "^\\circ\\). (a) Show that \\(BC=" + bc2.toFixed(2) + "\\) cm, correct to 2 decimal places. (b) Using your unrounded value, find \\(AC\\).",
      "(a) \\(" + ab + "\\tan" + ang + "^\\circ=" + dots(bc, 4) + "=" + bc2.toFixed(2) + "\\) (b) \\(AC=" + ab + "\\div\\cos" + ang + "^\\circ=" + sf(ac) + "\\) cm", [
        R("(a)", "\\(\\tan" + ang + "^\\circ=\\dfrac{BC}{" + ab + "}\\)", "M1", "\\(\\tan\\) for \\(BC\\)"),
        R("(a)", "\\(BC=" + ab + "\\tan" + ang + "^\\circ=" + dots(bc, 4) + "\\)"),
        R("(a)", "\\(=" + bc2.toFixed(2) + "\\) cm (2 d.p.)", "A1", "2 d.p. AG"),
        R("(b)", "\\(\\cos" + ang + "^\\circ=\\dfrac{" + ab + "}{AC}\\)"),
        R("(b)", "\\(AC=\\dfrac{" + ab + "}{\\cos" + ang + "^\\circ}=" + dots(ac, 3) + "\\)"),
        R("(b)", "\\(" + sf(ac) + "\\) cm (3 s.f.)", "B1", "3 s.f. FT")
      ], 3);
  };

  G["IGCSE-3-3"] = function (r) {
    const east = pick(r, [5, 6, 7, 8, 9, 10, 12, 15, 16, 18]);
    const south = pick(r, [8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 24]);
    const pr = Math.hypot(east, south);
    const nice = Number.isInteger(pr);
    const th = deg(Math.atan(south / east));
    const bear = 90 + th;
    const back = (bear + 180) % 360;
    return pack("A ship sails " + east + " km due east from P to Q, then " + south + " km due south from Q to R. Find (a) the distance PR, (b) the bearing of R from P, (c) the bearing of P from R.",
      "(a) " + (nice ? pr + " km" : sf(pr) + " km") + " (b) \\(90^\\circ+\\tan^{-1}\\frac{" + south + "}{" + east + "}=" + dp1(bear) + "^\\circ\\) (c) \\(" + dp1(back) + "^\\circ\\)", [
        R("(a)", "\\(PR=\\sqrt{" + east + "^2+" + south + "^2}\\)"),
        R("(a)", "\\(=\\sqrt{" + (east * east) + "+" + (south * south) + "}=\\sqrt{" + (east * east + south * south) + "}\\)"),
        R("(a)", "\\(" + (nice ? nstr(pr) : sf(pr)) + "\\) km", "B1", "\\(" + (nice ? nstr(pr) : sf(pr)) + "\\) km"),
        R("(b)", "\\(\\tan^{-1}\\dfrac{" + south + "}{" + east + "}=\\tan^{-1}" + dots(south / east, 3) + "=" + dots(th, 3) + "^\\circ\\)", "M1", "\\(\\tan^{-1}(" + south + "/" + east + ")\\)"),
        R("(b)", "bearing \\(=90^\\circ+" + dots(th, 3) + "^\\circ=" + dp1(bear) + "^\\circ\\)", "A1", "\\(" + dp1(bear) + "^\\circ\\), 1 d.p."),
        R("(c)", "\\(" + dp1(bear) + "^\\circ+180^\\circ=" + dp1(back) + "^\\circ\\)", "B1", "FT \\(+180^\\circ\\)")
      ], 4);
  };

  G["IGCSE-3-4"] = function (r) {
    const AB = pick(r, [40, 50, 60, 80]);
    const CB = pick(r, [15, 20, 25, 30]);
    const ang = pick(r, [28, 30, 32, 35]);
    const h = AB * Math.tan(rad(ang));
    const hsf = sf(h);
    const th = deg(Math.atan(h / CB));
    const brg = pick(r, [62, 72, 85, 108]);
    const back = (brg + 180) % 360;
    return pack("TB is a vertical tower of height \\(h\\) m. A and C are on level ground in a straight line with B, with \\(AB=" + AB + "\\) m and \\(CB=" + CB + "\\) m. The angle of elevation of T from A is \\(" + ang + "^\\circ\\). (a) Show that \\(h=" + hsf + "\\), correct to 3 significant figures. (b) Find the angle of depression of C from T. (c) The bearing of B from A is \\(" + pad3(brg) + "^\\circ\\). Write down the bearing of A from B.",
      "(a) \\(" + AB + "\\tan" + ang + "^\\circ=" + dots(h, 3) + "=" + hsf + "\\) (b) \\(\\tan^{-1}\\frac{" + dots(h, 2) + "}{" + CB + "}=" + dp1(th) + "^\\circ\\) (c) \\(" + pad3(back) + "^\\circ\\)", [
        R("(a)", "\\(\\tan" + ang + "^\\circ=\\dfrac{h}{" + AB + "}\\)", "M1", "\\(\\tan\\)"),
        R("(a)", "\\(h=" + AB + "\\tan" + ang + "^\\circ=" + dots(h, 3) + "\\)"),
        R("(a)", "\\(=" + hsf + "\\) (3 s.f.)", "A1", "3 s.f. AG"),
        R("(b)", "\\(\\tan\\theta=\\dfrac{" + dots(h, 3) + "}{" + CB + "}=" + dots(h / CB, 4) + "\\)", "M1", "FT their \\(h\\)"),
        R("(b)", "\\(\\theta=\\tan^{-1}(" + dots(h / CB, 4) + ")=" + dots(th, 3) + "^\\circ\\)", "M1", "\\(\\tan^{-1}\\)"),
        R("(b)", "\\(" + dp1(th) + "^\\circ\\)", "A1", "1 d.p."),
        R("(c)", "\\(" + pad3(brg) + "^\\circ+180^\\circ=" + pad3(back) + "^\\circ\\)", "B1", "\\(" + pad3(back) + "^\\circ\\)")
      ], 6);
  };

  G["IGCSE-4-0"] = function (r) {
    const P = pick(r, [32, 40, 45, 50]), Rng = pick(r, [55, 65, 75, 80]);
    const Q = 180 - P - Rng;
    const PQ = pick(r, [10, 12, 14, 15]);
    const QR = PQ * Math.sin(rad(P)) / Math.sin(rad(Rng));
    return pack("In triangle PQR, angle \\(P=" + P + "^\\circ\\), angle \\(R=" + Rng + "^\\circ\\) and \\(PQ=" + PQ + "\\) cm. Find \\(QR\\).",
      "\\(QR=\\dfrac{" + PQ + "\\sin" + P + "^\\circ}{\\sin" + Rng + "^\\circ}=" + sf(QR) + "\\) cm", [
        R("", "angle \\(Q=180^\\circ-" + P + "^\\circ-" + Rng + "^\\circ=" + Q + "^\\circ\\)"),
        R("", "\\(\\dfrac{QR}{\\sin" + P + "^\\circ}=\\dfrac{" + PQ + "}{\\sin" + Rng + "^\\circ}\\)", "M1", "sine rule"),
        R("", "\\(QR=\\dfrac{" + PQ + "\\sin" + P + "^\\circ}{\\sin" + Rng + "^\\circ}=" + dots(QR, 3) + "\\)"),
        R("", "\\(" + sf(QR) + "\\) cm (3 s.f.)", "A1", "3 s.f. or better")
      ], 2);
  };

  G["IGCSE-4-1"] = function (r) {
    const p = until(r, () => {
      const a = ir(r, 3, 9), b = ir(r, a + 1, a + 4), c = ir(r, b + 1, b + 5);
      if (a + b <= c) return;
      const cos = (a * a + b * b - c * c) / (2 * a * b);
      if (cos >= 0) return;
      const th = deg(Math.acos(cos));
      return { a, b, c, cos, th };
    });
    const num = p.a * p.a + p.b * p.b - p.c * p.c, den = 2 * p.a * p.b;
    return pack("A triangle has sides " + p.a + " cm, " + p.b + " cm and " + p.c + " cm. Find the largest angle.",
      "\\(\\cos\\theta=\\frac{" + (p.a * p.a) + "+" + (p.b * p.b) + "-" + (p.c * p.c) + "}{" + den + "}=" + dfrac(num, den) + "\\); \\(\\theta=" + dp1(p.th) + "^\\circ\\)", [
        R("", "largest angle opposite \\(" + p.c + "\\) cm"),
        R("", "\\(\\cos\\theta=\\dfrac{" + p.a + "^2+" + p.b + "^2-" + p.c + "^2}{2\\times" + p.a + "\\times" + p.b + "}\\)", "M1", "cosine rule"),
        R("", "\\(=\\dfrac{" + (p.a * p.a) + "+" + (p.b * p.b) + "-" + (p.c * p.c) + "}{" + den + "}=" + dfrac(num, den) + "\\)"),
        R("", "\\(\\theta=\\cos^{-1}(" + dfrac(num, den) + ")=" + dots(p.th, 3) + "^\\circ\\)", "M1", "\\(\\cos^{-1}\\)"),
        R("", "\\(" + dp1(p.th) + "^\\circ\\)", "A1", "1 d.p.")
      ], 3);
  };

  G["IGCSE-4-2"] = function (r) {
    const p = until(r, () => {
      const A = pick(r, [22, 25, 28, 30, 32, 35, 38, 40, 42]);
      const AB = pick(r, [8, 9, 10, 11, 12, 14]);
      const BC = pick(r, [5, 6, 7, 8, 9]);
      const sC = AB * Math.sin(rad(A)) / BC;
      if (sC >= 0.97 || sC <= 0.5) return;
      const ac = deg(Math.asin(sC));
      const C = 180 - ac;
      const B = 180 - A - C;
      if (B < 15 || C <= 90) return;
      return { A, AB, BC, sC, ac, C, B };
    });
    return pack("In triangle ABC, \\(AB=" + p.AB + "\\) cm, \\(BC=" + p.BC + "\\) cm and angle \\(A=" + p.A + "^\\circ\\). Angle \\(C\\) is obtuse. Find angle \\(C\\) and angle \\(B\\).",
      "\\(\\sin C=" + dots(p.sC, 4) + "\\); \\(C=180^\\circ-" + dp1(p.ac) + "^\\circ=" + dp1(p.C) + "^\\circ\\); \\(B=" + dp1(p.B) + "^\\circ\\)", [
        R("", "\\(\\dfrac{\\sin C}{" + p.AB + "}=\\dfrac{\\sin" + p.A + "^\\circ}{" + p.BC + "}\\)", "M1", "sine rule"),
        R("", "\\(\\sin C=\\dfrac{" + p.AB + "\\sin" + p.A + "^\\circ}{" + p.BC + "}=" + dots(p.sC, 5) + "\\)"),
        R("", "acute angle \\(=\\sin^{-1}(" + dots(p.sC, 5) + ")=" + dots(p.ac, 3) + "^\\circ\\)"),
        R("", "\\(C\\) obtuse: \\(C=180^\\circ-" + dots(p.ac, 3) + "^\\circ=" + dots(p.C, 3) + "^\\circ\\)"),
        R("", "\\(C=" + dp1(p.C) + "^\\circ\\)", "A1", "\\(C=" + dp1(p.C) + "^\\circ\\)"),
        R("", "\\(B=180^\\circ-" + p.A + "^\\circ-" + dots(p.C, 3) + "^\\circ\\)"),
        R("", "\\(B=" + dp1(p.B) + "^\\circ\\)", "A1", "\\(B=" + dp1(p.B) + "^\\circ\\)")
      ], 3);
  };

  G["IGCSE-4-3"] = function (r) {
    const b1 = pick(r, [20, 30, 40, 50]);
    const b2 = b1 + pick(r, [70, 80, 90, 100]);
    const d1 = pick(r, [5, 6, 8, 10]);
    const d2 = pick(r, [8, 10, 12, 14]);
    const diff = b2 - b1;
    const interior = 180 - diff;
    const d2v = d1 * d1 + d2 * d2 - 2 * d1 * d2 * Math.cos(rad(interior));
    const d = Math.sqrt(d2v);
    return pack("A boat sails " + d1 + " km on a bearing of \\(" + pad3(b1) + "^\\circ\\) and then " + d2 + " km on a bearing of \\(" + pad3(b2) + "^\\circ\\). Find how far the boat is from its starting point.",
      "angle at the turn \\(=" + interior + "^\\circ\\); distance \\(=\\sqrt{" + (d1 * d1 + d2 * d2) + "-" + (2 * d1 * d2) + "\\cos" + interior + "^\\circ}=" + sf(d) + "\\) km", [
        R("", "angle between bearings \\(=" + b2 + "^\\circ-" + b1 + "^\\circ=" + diff + "^\\circ\\)"),
        R("", "interior angle at the turn \\(=180^\\circ-" + diff + "^\\circ=" + interior + "^\\circ\\)", "B1", "\\(" + interior + "^\\circ\\)"),
        R("", "\\(d^2=" + d1 + "^2+" + d2 + "^2-2\\times" + d1 + "\\times" + d2 + "\\cos" + interior + "^\\circ\\)", "M2", "M1 if one error"),
        R("", "\\(=" + (d1 * d1 + d2 * d2) + "-" + (2 * d1 * d2) + "\\cos" + interior + "^\\circ=" + dots(d2v, 3) + "\\)"),
        R("", "\\(d=\\sqrt{" + dots(d2v, 3) + "}=" + dots(d, 3) + "\\)"),
        R("", "\\(" + sf(d) + "\\) km (3 s.f.)", "A1", "3 s.f. or better")
      ], 4);
  };

  G["IGCSE-4-4"] = function (r) {
    const AB = pick(r, [6, 7, 8]), BC = pick(r, [8, 9, 10]), CD = pick(r, [7, 8, 9]);
    const ABC = pick(r, [100, 105, 110, 115]);
    const ACD = pick(r, [40, 44, 48, 52]);
    const AC2 = AB * AB + BC * BC - 2 * AB * BC * Math.cos(rad(ABC));
    const AC = Math.sqrt(AC2);
    const sBCA = AB * Math.sin(rad(ABC)) / AC;
    const BCA = deg(Math.asin(sBCA));
    const AD2 = AC * AC + CD * CD - 2 * AC * CD * Math.cos(rad(ACD));
    const AD = Math.sqrt(AD2);
    return pack("In quadrilateral ABCD, \\(AB=" + AB + "\\) cm, \\(BC=" + BC + "\\) cm, \\(CD=" + CD + "\\) cm, angle \\(ABC=" + ABC + "^\\circ\\) and angle \\(ACD=" + ACD + "^\\circ\\). (a) Find \\(AC\\). (b) Find angle \\(BCA\\). (c) Find \\(AD\\).",
      "(a) \\(AC=" + dots(AC, 2) + "\\approx" + sf(AC) + "\\) cm (b) \\(" + dp1(BCA) + "^\\circ\\) (c) \\(AD=" + sf(AD) + "\\) cm", [
        R("(a)", "\\(AC^2=" + AB + "^2+" + BC + "^2-2\\times" + AB + "\\times" + BC + "\\cos" + ABC + "^\\circ\\)", "M2", "M1 if one error"),
        R("(a)", "\\(=" + (AB * AB + BC * BC) + "-" + (2 * AB * BC) + "\\cos" + ABC + "^\\circ=" + dots(AC2, 3) + "\\)"),
        R("(a)", "\\(AC=\\sqrt{" + dots(AC2, 3) + "}=" + dots(AC, 3) + "\\)"),
        R("(a)", "\\(" + sf(AC) + "\\) cm (3 s.f.)", "A1", "3 s.f. or better"),
        R("(b)", "\\(\\dfrac{\\sin\\angle BCA}{" + AB + "}=\\dfrac{\\sin" + ABC + "^\\circ}{" + dots(AC, 3) + "}\\)", "M1", "sine rule FT their \\(AC\\)"),
        R("(b)", "\\(\\sin\\angle BCA=\\dfrac{" + AB + "\\sin" + ABC + "^\\circ}{" + dots(AC, 3) + "}=" + dots(sBCA, 5) + "\\)"),
        R("(b)", "\\(\\angle BCA=\\sin^{-1}(" + dots(sBCA, 5) + ")=" + dots(BCA, 3) + "^\\circ\\)"),
        R("(b)", "\\(" + dp1(BCA) + "^\\circ\\)", "A1", "1 d.p."),
        R("(c)", "\\(AD^2=(" + dots(AC, 3) + ")^2+" + CD + "^2-2(" + dots(AC, 3) + ")(" + CD + ")\\cos" + ACD + "^\\circ\\)", "M1", "cosine rule FT their \\(AC\\)"),
        R("(c)", "\\(=" + dots(AD2, 3) + "\\)"),
        R("(c)", "\\(AD=\\sqrt{" + dots(AD2, 3) + "}=" + dots(AD, 3) + "\\)"),
        R("(c)", "\\(" + sf(AD) + "\\) cm (3 s.f.)", "A1", "3 s.f. or better")
      ], 7);
  };

  G["IGCSE-5-0"] = function (r) {
    const a = pick(r, [6, 7, 8, 9, 10]), b = pick(r, [9, 10, 11, 12]), C = pick(r, [50, 55, 62, 70]);
    const area = 0.5 * a * b * Math.sin(rad(C));
    return pack("Find the area of a triangle with sides " + a + " cm and " + b + " cm and an included angle of \\(" + C + "^\\circ\\).",
      "\\(" + sf(area) + "\\) cm²", [
        R("", "area \\(=\\tfrac12\\times" + a + "\\times" + b + "\\times\\sin" + C + "^\\circ\\)", "M1", "\\(\\tfrac12 ab\\sin C\\)"),
        R("", "\\(=" + (0.5 * a * b) + "\\sin" + C + "^\\circ=" + dots(area, 3) + "\\)"),
        R("", "\\(" + sf(area) + "\\) cm\\(^2\\) (3 s.f.)", "A1", "3 s.f. or better")
      ], 2);
  };

  G["IGCSE-5-1"] = function (r) {
    const a = pick(r, [6, 7, 8]), b = pick(r, [8, 9, 10]);
    const area = until(r, () => {
      const ar = pick(r, [18, 20, 21, 24, 25, 27, 28, 30, 32]);
      const s0 = 2 * ar / (a * b);
      if (s0 >= 0.98 || s0 <= 0.35) return;
      const th0 = deg(Math.asin(s0));
      if ([30, 45, 60].some((sp) => Math.abs(th0 - sp) < 0.15)) return;
      if ([0.5, Math.SQRT1_2, Math.sqrt(3) / 2].some((sp) => Math.abs(s0 - sp) < 1e-9)) return;
      return ar;
    });
    const s = 2 * area / (a * b);
    const th = deg(Math.asin(s));
    const obt = 180 - th;
    return pack("A triangle has sides " + a + " cm and " + b + " cm and area " + area + " cm². The angle between these sides is acute. Find it.",
      "\\(\\sin\\theta=" + dfrac(2 * area, a * b) + "\\); \\(\\theta=" + dp1(th) + "^\\circ\\) (obtuse option \\(" + dp1(obt) + "^\\circ\\))", [
        R("", "\\(\\tfrac12\\times" + a + "\\times" + b + "\\times\\sin\\theta=" + area + "\\)", "M1", "\\(\\tfrac12 ab\\sin\\theta=" + area + "\\)"),
        R("", "\\(\\sin\\theta=" + dfrac(2 * area, a * b) + "=" + dots(s, 5) + "\\)"),
        R("", "\\(\\theta=\\sin^{-1}(" + dots(s, 5) + ")=" + dots(th, 3) + "^\\circ\\)"),
        R("", "\\(" + dp1(th) + "^\\circ\\) (acute)", "A1", "acute, 1 d.p."),
        R("", "obtuse option \\(180^\\circ-" + dots(th, 3) + "^\\circ=" + dp1(obt) + "^\\circ\\)")
      ], 2);
  };

  G["IGCSE-5-2"] = function (r) {
    const a = pick(r, [10, 12, 14, 15]), b = pick(r, [6, 8, 9, 10]), C = pick(r, [55, 65, 70, 75]);
    const area = a * b * Math.sin(rad(C));
    return pack("A parallelogram has sides " + a + " cm and " + b + " cm, and one angle of \\(" + C + "^\\circ\\). Find its area.",
      "\\(" + a + "\\times" + b + "\\times\\sin" + C + "^\\circ=" + sf(area) + "\\) cm² (two triangles)", [
        R("", "area \\(=ab\\sin C=" + a + "\\times" + b + "\\times\\sin" + C + "^\\circ\\)", "M1", "\\(ab\\sin C\\)"),
        R("", "\\(=" + (a * b) + "\\sin" + C + "^\\circ=" + dots(area, 3) + "\\)"),
        R("", "\\(" + sf(area) + "\\) cm\\(^2\\) (3 s.f.)", "A1", "3 s.f. or better")
      ], 2);
  };

  G["IGCSE-5-3"] = function (r) {
    const p = until(r, () => {
      const AB = pick(r, [6, 8, 10, 12, 14, 16, 18, 20, 24]), A = pick(r, [30, 45, 60]);
      const area = pick(r, [12, 18, 20, 24, 30, 36, 40, 48, 54, 60, 72, 80]);
      const s = Math.sin(rad(A));
      const AC = 2 * area / (AB * s);
      const h = 2 * area / AB;
      if (!Number.isInteger(h) || Math.abs(AC - Math.round(AC)) > 1e-9) return;
      return { AB, A, area, s, AC: Math.round(AC), h };
    });
    const AB = p.AB, A = p.A, area = p.area, s = p.s, AC = p.AC, h = p.h;
    return pack("Triangle ABC has area " + area + " cm², \\(AB=" + AB + "\\) cm and angle \\(A=" + A + "^\\circ\\). Find \\(AC\\) and the perpendicular height from C to AB.",
      "\\(AC=" + (Number.isInteger(AC) ? nstr(AC) : sf(AC)) + "\\) cm; height \\(=" + (Number.isInteger(h) ? nstr(h) : sf(h)) + "\\) cm", [
        R("", "\\(\\tfrac12\\times" + AB + "\\times AC\\times\\sin" + A + "^\\circ=" + area + "\\)", "M1", "\\(\\tfrac12 AB\\cdot AC\\sin A\\)"),
        R("", "\\(" + nstr(0.5 * AB) + "\\times AC\\times" + (A === 30 ? "\\tfrac12" : A === 45 ? "\\tfrac{\\sqrt2}{2}" : "\\tfrac{\\sqrt3}{2}") + "=" + area + "\\)"),
        R("", "\\(" + nstr(0.5 * AB * s) + "\\,AC=" + area + "\\)"),
        R("", "\\(AC=" + (Number.isInteger(AC) ? nstr(AC) : sf(AC)) + "\\) cm", "A1", "\\(" + (Number.isInteger(AC) ? nstr(AC) : sf(AC)) + "\\) cm"),
        R("", "\\(\\tfrac12\\times" + AB + "\\times h=" + area + "\\)"),
        R("", "\\(" + (0.5 * AB) + "h=" + area + "\\)"),
        R("", "\\(h=" + (Number.isInteger(h) ? nstr(h) : sf(h)) + "\\) cm", "A1", "\\(" + (Number.isInteger(h) ? nstr(h) : sf(h)) + "\\) cm")
      ], 3);
  };

  G["IGCSE-5-4"] = function (r) {
    const p = until(r, () => {
      const a = ir(r, 5, 10), b = ir(r, 5, 12), c = ir(r, 6, 13);
      if (a === b && b === c) return;
      if (a + b <= c) return;
      const num = a * a + b * b - c * c, den = 2 * a * b;
      if (num <= 0) return;
      const g = gcd(num, den);
      const th = deg(Math.acos(num / den));
      const area = 0.5 * a * b * Math.sin(rad(th));
      const h = 2 * area / c;
      return { a, b, c, num, den, th, area, h, ng: num / g, dg: den / g };
    });
    return pack("A triangle has sides " + p.a + " cm, " + p.b + " cm and " + p.c + " cm. (a) Find the angle between the " + p.a + " cm and " + p.b + " cm sides. (b) Find the area of the triangle. (c) Find the perpendicular height from the opposite vertex to the " + p.c + " cm side.",
      "(a) \\(\\cos\\theta=\\frac{" + p.ng + "}{" + p.dg + "}\\), \\(\\theta=" + dp1(p.th) + "^\\circ\\) (b) \\(" + sf(p.area) + "\\) cm² (c) \\(" + sf(p.h) + "\\) cm", [
        R("(a)", "\\(\\cos\\theta=\\dfrac{" + p.a + "^2+" + p.b + "^2-" + p.c + "^2}{2\\times" + p.a + "\\times" + p.b + "}\\)", "M1", "cosine rule"),
        R("(a)", "\\(=\\dfrac{" + (p.a * p.a) + "+" + (p.b * p.b) + "-" + (p.c * p.c) + "}{" + p.den + "}=" + (p.num === p.ng ? dfrac(p.ng, p.dg) : "\\dfrac{" + p.num + "}{" + p.den + "}=" + dfrac(p.ng, p.dg)) + "\\)"),
        R("(a)", "\\(\\theta=\\cos^{-1}" + dfrac(p.ng, p.dg) + "=" + dots(p.th, 3) + "^\\circ\\)"),
        R("(a)", "\\(" + dp1(p.th) + "^\\circ\\)", "A1", "1 d.p."),
        R("(b)", "\\(\\sin\\theta=\\sqrt{1-(" + dfrac(p.ng, p.dg) + ")^2}\\)"),
        R("(b)", "area \\(=\\tfrac12\\times" + p.a + "\\times" + p.b + "\\times\\sin\\theta=" + dots(p.area, 3) + "\\)", "M1", "\\(\\tfrac12 ab\\sin C\\)"),
        R("(b)", "\\(" + sf(p.area) + "\\) cm\\(^2\\) (3 s.f.)", "A1", "3 s.f. or better"),
        R("(c)", "\\(\\tfrac12\\times" + p.c + "\\times h=" + dots(p.area, 3) + "\\)", "M1", "\\(\\tfrac12\\times" + p.c + "\\times h\\)"),
        R("(c)", "\\(h=" + dots(p.h, 3) + "\\)"),
        R("(c)", "\\(" + sf(p.h) + "\\) cm (3 s.f.)", "A1", "3 s.f. or better")
      ], 6);
  };

  G["IGCSE-6-0"] = function (r) {
    const rad0 = ir(r, 2, 9), h = ir(r, 5, 16);
    const k = rad0 * rad0 * h;
    const v = k * Math.PI;
    return pack("Find the volume of a cylinder with radius " + rad0 + " cm and height " + h + " cm.",
      "\\(" + k + "\\pi=" + sf(v) + "\\) cm³", [
        R("", "\\(V=\\pi r^2 h=\\pi\\times" + rad0 + "^2\\times" + h + "\\)", "M1", "\\(\\pi r^2 h\\)"),
        R("", "\\(=" + k + "\\pi=" + dots(v, 3) + "\\)"),
        R("", "\\(" + sf(v) + "\\) cm\\(^3\\) (3 s.f.)", "A1", "3 s.f. or better")
      ], 2);
  };

  G["IGCSE-6-1"] = function (r) {
    const rad0 = ir(r, 2, 8), h = ir(r, 6, 18);
    const k = 2 * rad0 * h + 2 * rad0 * rad0;
    const a = k * Math.PI;
    return pack("Find the total surface area of a closed cylinder with radius " + rad0 + " cm and height " + h + " cm.",
      "\\(" + k + "\\pi=" + sf(a) + "\\) cm²", [
        R("", "\\(A=2\\pi rh+2\\pi r^2\\)", "M1", "\\(2\\pi rh+2\\pi r^2\\)"),
        R("", "\\(=2\\pi\\times" + rad0 + "\\times" + h + "+2\\pi\\times" + (rad0 * rad0) + "\\)"),
        R("", "\\(=" + (2 * rad0 * h) + "\\pi+" + (2 * rad0 * rad0) + "\\pi=" + k + "\\pi=" + dots(a, 3) + "\\)", "M1", "\\(" + k + "\\pi\\)"),
        R("", "\\(" + sf(a) + "\\) cm\\(^2\\) (3 s.f.)", "A1", "3 s.f. or better")
      ], 3);
  };

  G["IGCSE-6-2"] = function (r) {
    const rad0 = ir(r, 2, 7), h = ir(r, 6, 18);
    const k = 2 * rad0 * h + rad0 * rad0;
    return pack("A cylinder with radius " + rad0 + " cm is open at the top. Its outside surface area (curved surface and base) is \\(" + k + "\\pi\\) cm². Find its height.",
      "\\(" + (rad0 * rad0) + "\\pi+" + (2 * rad0) + "\\pi h=" + k + "\\pi\\Rightarrow h=" + h + "\\) cm", [
        R("", "\\(2\\pi rh+\\pi r^2=" + k + "\\pi\\)", "M1", "open: \\(2\\pi rh+\\pi r^2\\)"),
        R("", "\\(2\\pi\\times" + rad0 + "\\times h+\\pi\\times" + (rad0 * rad0) + "=" + k + "\\pi\\)"),
        R("", "\\(" + (2 * rad0) + "\\pi h+" + (rad0 * rad0) + "\\pi=" + k + "\\pi\\)", "M1", "divide by \\(\\pi\\)"),
        R("", "\\(" + (2 * rad0) + "h+" + (rad0 * rad0) + "=" + k + "\\)"),
        R("", "\\(" + (2 * rad0) + "h=" + (k - rad0 * rad0) + "\\)"),
        R("", "\\(h=" + h + "\\) cm", "A1", "cao")
      ], 3);
  };

  G["IGCSE-6-3"] = function (r) {
    const p = until(r, () => {
      const R0 = pick(r, [2, 3, 4, 5, 6, 8]), h = pick(r, [4, 5, 6, 8, 9, 10, 12, 15, 16, 18, 20, 24, 30]);
      const rs = 1;
      const n = (3 * R0 * R0 * h) / (4 * rs * rs * rs);
      if (!Number.isInteger(n)) return;
      const Rbig = Math.cbrt(0.75 * R0 * R0 * h);
      return { R0, h, n, Rbig, V: R0 * R0 * h };
    });
    return pack("A solid cylinder with radius " + p.R0 + " cm and height " + p.h + " cm is melted down. (a) How many spheres of radius 1 cm can be made? (b) Instead, it is made into one sphere. Find its radius.",
      "(a) \\(" + p.V + "\\pi\\div\\tfrac43\\pi=" + p.n + "\\) (b) \\(R^3=" + p.n + "\\), \\(R=" + sf(p.Rbig) + "\\) cm", [
        R("", "cylinder \\(V=\\pi\\times" + p.R0 + "^2\\times" + p.h + "=" + p.V + "\\pi\\)"),
        R("(a)", "sphere \\(V=\\tfrac43\\pi(1)^3=\\tfrac43\\pi\\)"),
        R("(a)", "number \\(=\\dfrac{" + p.V + "\\pi}{\\tfrac43\\pi}=" + p.V + "\\times\\dfrac{3}{4}\\)", "M1", "equal volumes"),
        R("(a)", "\\(" + p.n + "\\)", "A1", String(p.n)),
        R("(b)", "\\(\\tfrac43\\pi R^3=" + p.V + "\\pi\\)", "M1", "equal volumes"),
        R("(b)", "\\(R^3=" + p.n + "\\)"),
        R("(b)", "\\(R=\\sqrt[3]{" + p.n + "}=" + (Math.abs(p.Rbig - Math.round(p.Rbig)) < 1e-9 ? nstr(Math.round(p.Rbig)) : dots(p.Rbig, 3)) + "\\)"),
        R("(b)", "\\(" + sf(p.Rbig) + "\\) cm (3 s.f.)", "A1", "3 s.f. or better")
      ], 4);
  };

  G["IGCSE-6-4"] = function (r) {
    const p = until(r, () => {
      const radcm = pick(r, [8, 10, 12, 16, 20, 24, 30, 32, 40, 50]);
      const hm = pick(r, [0.8, 1, 1.2, 1.5]);
      const ball = pick(r, [1, 2]);
      const riseV = radcm * radcm;
      const n = (3 * riseV) / (4 * ball * ball * ball);
      if (!Number.isInteger(n) || n < 2) return;
      return { radcm, hm, ball, n, riseV };
    });
    const radcm = p.radcm, hm = p.hm, ball = p.ball, nNice = p.n, riseV = p.riseV;
    const hcm = Math.round(hm * 100);
    const V = radcm * radcm * hcm;
    const litres = V * Math.PI / 1000;
    const curve = 2 * Math.PI * (radcm / 100) * hm;
    const kside = 2 * (radcm / 100) * hm;
    const o64 = pack("A cylindrical water tank has radius " + radcm + " cm and height " + hm + " m. (a) Find its capacity in litres. (b) The tank contains some water. Metal balls of radius " + ball + " cm are dropped in and sink. How many balls raise the water level by exactly 1 cm? (c) Find the area of the curved surface of the tank in m².",
      "(a) \\(" + thin(V) + "\\pi\\) cm³ \\(=" + sf(litres) + "\\) litres (b) \\(" + riseV + "\\pi\\div\\frac{" + (4 * ball * ball * ball) + "\\pi}{3}=" + nNice + "\\) (c) \\(" + sf(curve) + "\\) m²", [
        R("(a)", "\\(" + hm + "\\) m \\(=" + hcm + "\\) cm"),
        R("(a)", "\\(V=\\pi\\times" + radcm + "^2\\times" + hcm + "=" + V + "\\pi\\) cm\\(^3\\)", "M1", "\\(\\pi r^2 h\\)"),
        R("(a)", "\\(1\\) litre \\(=1000\\) cm\\(^3\\)"),
        R("(a)", "\\(\\dfrac{" + V + "\\pi}{1000}=" + (V / 1000) + "\\pi=" + dots(litres, 3) + "\\)"),
        R("(a)", "\\(" + sf(litres) + "\\) litres (3 s.f.)", "A1", "3 s.f. or better"),
        R("(b)", "rise \\(1\\) cm: \\(\\pi\\times" + radcm + "^2\\times1=" + riseV + "\\pi\\)", "M1", "volume of \\(1\\) cm rise"),
        R("(b)", "one ball \\(\\tfrac43\\pi(" + ball + ")^3=\\tfrac{" + (4 * ball * ball * ball) + "\\pi}{3}\\)", "M1", "ball volume"),
        R("(b)", "number \\(=\\dfrac{" + riseV + "\\pi}{" + (4 * ball * ball * ball) + "\\pi/3}=" + riseV + "\\times\\dfrac{3}{" + (4 * ball * ball * ball) + "}\\)"),
        R("(b)", "\\(" + nNice + "\\)", "A1", nNice + " cao"),
        R("(c)", "\\(2\\pi rh=2\\pi\\times" + nstr(radcm / 100) + "\\times" + nstr(hm) + "=" + piC(Number(kside.toFixed(4))) + "=" + dots(curve, 4) + "\\)", "M1", "\\(2\\pi rh\\) in m"),
        R("(c)", "\\(" + sf(curve) + "\\) m\\(^2\\) (3 s.f.)", "A1", "3 s.f. or better")
      ], 7);
    o64._chk = { intN: Number.isInteger(nNice) && nNice >= 2 };
    return o64;
  };

  G["IGCSE-7-0"] = function (r) {
    const rate = pick(r, [4, 5, 6, 7, 8, 9, 10, 12]);
    const net = pick(r, [40, 50, 55, 60, 70, 75, 80, 85, 90, 95, 100, 120]);
    const gross = Number((net * (1 + rate / 100)).toFixed(2));
    return pack("A price including " + rate + "% tax is \\$" + money(gross) + ". Find the price before tax.",
      "\\$" + money(net), [
        R("", "\\(100\\%+" + rate + "\\%=" + (100 + rate) + "\\%\\), so divide by \\(" + (1 + rate / 100).toFixed(2) + "\\)"),
        R("", "\\(\\dfrac{" + money(gross) + "}{" + (1 + rate / 100).toFixed(2) + "}=" + net + "\\)", "M1", "divide by \\(" + (1 + rate / 100).toFixed(2) + "\\)"),
        R("", "\\(\\$" + money(net) + "\\)", "A1", "2 d.p.")
      ], 2);
  };

  G["IGCSE-7-1"] = function (r) {
    const usd = pick(r, [200, 300, 400, 500]);
    const rate = pick(r, [32.5, 35.2, 36.8, 40]);
    const comm = pick(r, [1, 1.5, 2]);
    const after = usd * (1 - comm / 100);
    const baht = after * rate;
    return pack("Ben changes \\$" + usd + " to Thai baht at \\$1 = " + rate.toFixed(2) + " baht. The bank charges " + comm + "% commission. How many baht does he get?",
      moneyThin(baht).replace(/\\,/g, " ") + " baht",
      [
        R("", "\\(" + usd + "\\times(1-" + (comm / 100) + ")=" + usd + "\\times" + (1 - comm / 100) + "=" + after + "\\)", "M1", "commission then convert"),
        R("", "\\(" + after + "\\times" + rate.toFixed(2) + "=" + money(baht) + "\\)"),
        R("", "\\(" + moneyThin(baht) + "\\) baht", "A1", "2 d.p.")
      ], 2);
  };

  G["IGCSE-7-2"] = function (r) {
    const p = until(r, () => {
      const kip = pick(r, [1500000, 2000000, 2500000, 3000000, 3500000, 4000000, 5000000]);
      const rate = pick(r, [18000, 20000, 21500, 22000, 25000, 28000]);
      const comm = pick(r, [1.5, 2, 2.5, 3, 4]);
      const after = kip * (1 - comm / 100);
      const dol = after / rate;
      const fracC = Math.abs(dol * 100 - Math.floor(dol * 100) - 0.5);
      if (fracC < 1e-6) return;
      return { kip, rate, comm, after, dol };
    });
    const { kip, rate, comm, after, dol } = p;
    return pack("Mina changes " + thin(kip).replace(/\\,/g, " ") + " kip to US dollars at \\$1 = " + thin(rate).replace(/\\,/g, " ") + " kip. The bank first takes " + comm + "% commission from the kip. How many dollars does she get, to the nearest cent?",
      "\\(" + thin(after) + "\\div" + thin(rate) + "=\\$" + money(dol) + "\\)", [
        R("", "\\(" + thin(kip) + "\\times" + (1 - comm / 100) + "=" + thin(after) + "\\) kip", "M1", "\\(" + comm + "\\%\\) off kip"),
        R("", "\\(\\dfrac{" + thin(after) + "}{" + thin(rate) + "}=" + dots(dol, 3) + "\\)", "M1", "divide by \\(" + thin(rate) + "\\)"),
        R("", "\\(\\$" + money(Number(dol.toFixed(2))) + "\\)", "A1", "nearest cent")
      ], 3);
  };

  G["IGCSE-7-3"] = function (r) {
    const P = pick(r, [3000, 4000, 4500, 5000, 6000, 7500, 8000, 10000]);
    const rate = pick(r, [4, 5, 6, 8, 10]);
    const years = pick(r, [1, 2, 3, 4]);
    const yearWord = years === 1 ? "year" : "years";
    const q = rate / 4 / 100;
    const n = years * 4;
    const A = P * Math.pow(1 + q, n);
    const interest = A - P;
    const simple = P * rate * years / 100;
    const more = interest - simple;
    return pack("\\$" + P + " is invested at " + rate + "% per year, compounded quarterly, for " + years + " " + yearWord + ". Find the interest earned. How much more is this than simple interest at " + rate + "% per year for " + years + " " + yearWord + "?",
      "\\(" + P + "\\times" + pwr(String(1 + q), n) + "=" + money(A) + "\\); interest \\$" + money(interest) + "; \\$" + money(more) + " more", [
        R("", "quarterly rate \\(=\\dfrac{" + rate + "}{4}=" + (rate / 4) + "\\%=" + q + "\\), \\(n=" + n + "\\)", "M1", "\\(\\frac{r}{4}\\) and \\(n=" + n + "\\)"),
        R("", "\\(A=" + P + "\\times" + pwr("(" + (1 + q) + ")", n) + "=" + dots(A, 3) + "\\)"),
        R("", "interest \\(=" + money(A) + "-" + P + "=\\$" + money(interest) + "\\)", "A1", "interest, 2 d.p."),
        R("", "simple interest \\(=\\dfrac{" + P + "\\times" + rate + "\\times" + years + "}{100}=\\$" + money(simple) + "\\)"),
        R("", "\\(\\$" + money(more) + "\\) more", "A1", "difference")
      ], 3);
  };

  G["IGCSE-7-4"] = function (r) {
    const p = until(r, () => {
      const rate = pick(r, [5, 8, 10]);
      const net = pick(r, [800, 850, 900]);
      const rY = pick(r, [4, 5, 6]);
      const q = rY / 4 / 100;
      const target = pick(r, [1000, 1100, 1200]);
      let n = 1;
      while (net * Math.pow(1 + q, n) <= target && n < 40) n++;
      if (n < 4 || n > 16) return;
      const comm = pick(r, [1, 2]);
      const fx = pick(r, [1.1, 1.2, 1.25]);
      const euros = target * (1 - comm / 100) / fx;
      return { rate, net, rY, q, target, n, comm, fx, euros };
    });
    const rate = p.rate, P = p.net, rY = p.rY, q = p.q, target = p.target, n = p.n, comm = p.comm, fx = p.fx, euros = p.euros;
    const gross = Number((P * (1 + rate / 100)).toFixed(2));
    const a = P * Math.pow(1 + q, n - 1), b = P * Math.pow(1 + q, n);
    const usd = target;
    return pack("(a) A laptop costs \\$" + money(gross).replace(/\.00$/, "") + " including " + rate + "% sales tax. Find the price before tax. (b) Ali invests \\$" + P + " at " + rY + "% per year, compounded quarterly (interest added at the end of each quarter). After how many quarters is the value first more than \\$" + target + "? (c) Ali changes \\$" + usd + " to euros at €1 = \\$" + fx.toFixed(2) + ". The bank takes " + comm + "% commission from the dollars. How many euros does he get?",
      "(a) \\$" + P + " (b) " + n + " quarters (\\(" + P + "\\times" + (1 + q) + "^{" + (n - 1) + "}=" + money(a) + "\\), \\(" + P + "\\times" + (1 + q) + "^{" + n + "}=" + money(b) + "\\)) (c) €" + (Number.isInteger(euros) ? nstr(euros) : money(euros)),
      [
        R("(a)", "\\(100\\%+" + rate + "\\%=" + (100 + rate) + "\\%\\), so divide by \\(" + (1 + rate / 100).toFixed(2) + "\\)"),
        R("(a)", "\\(\\dfrac{" + (Number.isInteger(gross) ? nstr(gross) : money(gross)) + "}{" + (1 + rate / 100).toFixed(2) + "}=" + P + "\\)", "M1", "divide by \\(" + (1 + rate / 100).toFixed(2) + "\\)"),
        R("(a)", "\\(\\$" + P + "\\)", "A1", "cao"),
        R("(b)", "rate per quarter \\(=" + (rY / 4) + "\\%=" + q + "\\)"),
        R("(b)", "\\(" + P + "\\times(" + (1 + q) + ")^{" + (n - 1) + "}=" + dots(a, 3) + "&lt;" + target + "\\)", "M1", "\\(" + P + "\\times" + (1 + q) + "^{" + (n - 1) + "}\\)"),
        R("(b)", "\\(" + P + "\\times(" + (1 + q) + ")^{" + n + "}=" + dots(b, 3) + "&gt;" + target + "\\)", "M1", "\\(" + P + "\\times" + (1 + q) + "^{" + n + "}\\)"),
        R("(b)", "\\(" + n + "\\) quarters", "A1", String(n)),
        R("(c)", "\\(" + usd + "\\times" + (1 - comm / 100) + "=" + (usd * (1 - comm / 100)) + "\\)", "M1", "\\(" + comm + "\\%\\) commission then divide"),
        R("(c)", "\\(\\dfrac{" + (usd * (1 - comm / 100)) + "}{" + fx.toFixed(2) + "}=" + (Number.isInteger(euros) ? nstr(euros) : money(euros)) + "\\)"),
        R("(c)", "€\\(" + (Number.isInteger(euros) ? nstr(euros) : money(euros)) + "\\)", "A1", "cao")
      ], 7);
  };

  function pearson(pts) {
    const n = pts.length;
    const mx = pts.reduce((s, p) => s + p[0], 0) / n;
    const my = pts.reduce((s, p) => s + p[1], 0) / n;
    let num = 0, dx = 0, dy = 0;
    for (const p of pts) {
      const a = p[0] - mx, b = p[1] - my;
      num += a * b; dx += a * a; dy += b * b;
    }
    if (dx < 1e-12 || dy < 1e-12) return 0;
    return num / Math.sqrt(dx * dy);
  }

  G["IGCSE-8-0"] = function (r) {
    const pos = r() < 0.5;
    const strength = pick(r, ["strong", "moderate", "weak"]);
    const band = strength === "strong" ? [0.9, 0.995] : strength === "moderate" ? [0.6, 0.85] : [0.3, 0.6];
    const ctxs = pos
      ? [
        { xlab: "Outside temperature (°C)", ylab: "Ice creams sold", mean: "as temperature rises, ice cream sales rise" },
        { xlab: "Hours studied", ylab: "Test score", mean: "as study time increases, test scores rise" },
        { xlab: "Rainfall (mm)", ylab: "Crop yield (kg)", mean: "as rainfall increases, crop yield rises" }
      ]
      : [
        { xlab: "Outside temperature (°C)", ylab: "Heating cost ($)", mean: "as temperature rises, heating cost falls" },
        { xlab: "Age of car (years)", ylab: "Price ($1000s)", mean: "as age increases, price falls" },
        { xlab: "Altitude (m)", ylab: "Temperature (°C)", mean: "as altitude increases, temperature falls" }
      ];
    const ctxp = pick(r, ctxs);
    const p80 = until(r, () => {
      const amp = strength === "strong" ? 8 : strength === "moderate" ? 28 : 55;
      const pts = [];
      const xs = [];
      for (let i = 0; i < 10; i++) xs.push(Number((4 + i * 2.4 + r() * 0.8).toFixed(1)));
      const mx = xs.reduce((s, x) => s + x, 0) / xs.length;
      for (let i = 0; i < 10; i++) {
        const x = xs[i];
        const signal = (pos ? 1 : -1) * 2.2 * (x - mx);
        const y = Number((50 + signal + (r() - 0.5) * amp).toFixed(1));
        pts.push([x, Math.max(5, Math.min(95, y))]);
      }
      const rr = pearson(pts);
      const ar = Math.abs(rr);
      if (ar < band[0] || ar > band[1]) return;
      if (pos ? rr < 0 : rr > 0) return;
      return pts;
    });
    const svg = scatter(p80, ctxp.xlab, ctxp.ylab, 30, 100, 5, 10);
    const kind = strength + " " + (pos ? "positive" : "negative");
    const q = '<div class="flex"><div>Describe the correlation in the scatter diagram and explain what it means in context.</div><div class="fig">' + svg + "</div></div>";
    const o80 = pack(q, kind.charAt(0).toUpperCase() + kind.slice(1) + ": " + ctxp.mean, [
      R("", "points slope " + (pos ? "up" : "down") + (strength === "strong" ? ", close to a straight line" : strength === "moderate" ? ", fairly close to a straight line" : ", quite spread out")),
      R("", kind + " correlation", "B1", kind),
      R("", ctxp.mean, "B1", "in context")
    ], 2);
    Object.defineProperty(o80, "_pts", { value: p80, enumerable: false });
    Object.defineProperty(o80, "_r", { value: pearson(p80), enumerable: false });
    return o80;
  };

  function meanData(r) {
    return until(r, () => {
      const n = 6;
      const xs = [];
      let x0 = ir(r, 12, 18);
      for (let i = 0; i < n; i++) { x0 += ir(r, 2, 4); xs.push(x0); }
      const sx = xs.reduce((a, b) => a + b, 0);
      if (sx % n) return;
      const mx = sx / n;
      const my = pick(r, [40, 48, 54, 60, 66, 72]);
      const m = pick(r, [2, 2.5, 3, 3.5, 4]);
      const c = my - m * mx;
      const ys = xs.map((x, i) => Math.round(m * x + c + (i === n - 1 ? 0 : (r() - 0.5) * 2)));
      let sy = ys.reduce((a, b) => a + b, 0);
      ys[n - 1] += n * my - sy;
      sy = ys.reduce((a, b) => a + b, 0);
      if (sy % n || ys[n - 1] < 1) return;
      return { xs, ys, m, c, mx: sx / n, my: sy / n, sx, sy, n };
    });
  }

  G["IGCSE-8-1"] = function (r) {
    const d = meanData(r);
    const rowx = d.xs.map((x) => "<td>" + x + "</td>").join("");
    const rowy = d.ys.map((y) => "<td>" + y + "</td>").join("");
    const q = "<table><tr><td>Temperature \\(x\\) (°C)</td>" + rowx + "</tr><tr><td>Ice creams sold \\(y\\)</td>" + rowy + "</tr></table>Find \\(\\bar x\\) and \\(\\bar y\\).";
    const o81 = pack(q, "\\(\\bar x=" + d.mx + "\\), \\(\\bar y=" + d.my + "\\)", [
      R("", "\\(\\sum x=" + d.xs.join("+") + "=" + d.sx + "\\)"),
      R("", "\\(\\bar x=\\dfrac{" + d.sx + "}{" + d.n + "}=" + d.mx + "\\)", "B1", "\\(" + d.mx + "\\)"),
      R("", "\\(\\sum y=" + d.ys.join("+") + "=" + d.sy + "\\)"),
      R("", "\\(\\bar y=\\dfrac{" + d.sy + "}{" + d.n + "}=" + d.my + "\\)", "B1", "\\(" + d.my + "\\)")
    ], 2);
    o81._chk = { intMean: Number.isInteger(d.mx) && Number.isInteger(d.my) };
    return o81;
  };

  G["IGCSE-8-2"] = function (r) {
    const p = until(r, () => {
      const mx = pick(r, [18, 20, 22, 24, 25, 26, 28, 30]);
      const my = pick(r, [48, 50, 55, 60, 65, 70, 72, 80]);
      const m = pick(r, [2, 2.5, 3, 3.5, 4, 4.5]);
      const c = my - m * mx;
      if (c === 0) return;
      if (!Number.isInteger(c) && Math.abs(c * 2 - Math.round(c * 2)) > 1e-9) return;
      const xq = mx - pick(r, [2, 3, 4, 5]);
      return { mx, my, m, c, xq, yq: m * xq + c };
    });
    const { mx, my, m, c, xq, yq } = p;
    const cs = (c < 0 ? "" : "+") + decInt(c);
    const line = "y=" + m + "x" + cs;
    const lo = Math.floor(yq), hi = Math.ceil(yq);
    const about = lo === hi ? String(lo) : lo + " or " + hi;
    return pack("For data with mean point \\((" + mx + "," + my + ")\\), the line of best fit is \\(" + line + "\\). (a) Show that the line passes through the mean point. (b) Use it to estimate the sales at \\(" + xq + "^\\circ\\)C.",
      "(a) \\(" + m + "(" + mx + ")" + cs + "=" + my + "\\) ✓ (b) \\(" + decInt(yq) + "\\), about " + about + " ice creams", [
        R("(a)", "\\(" + m + "\\times" + wrapn(mx) + cs + "=" + wrapn(m * mx) + cs + "=" + my + "\\)", "M1", "substitute mean \\(x\\)"),
        R("(a)", "equals \\(\\bar y\\), so the line passes through \\((" + mx + "," + my + ")\\)", "A1", "AG through mean point"),
        R("(b)", "\\(y=" + m + "\\times" + wrapn(xq) + cs + "=" + wrapn(m * xq) + cs + "=" + decInt(yq) + "\\)"),
        R("(b)", "about \\(" + about.replace(" or ", "\\) or \\(") + "\\) ice creams", "B1", "\\(" + about.replace(" or ", "\\) or \\(") + "\\)")
      ], 3);
  };

  G["IGCSE-8-3"] = function (r) {
    const p83 = until(r, () => {
      const mx = ir(r, 16, 32);
      const my = ir(r, 40, 80);
      const m = pick(r, [2, 2.5, 3, 3.5, 4, 4.5, 5]);
      let c = my - m * mx;
      if (c === 0) c = 2.5;
      if (!Number.isInteger(c) && Math.abs(c * 2 - Math.round(c * 2)) > 1e-9) c = Math.round(c * 2) / 2;
      const xmin = mx - ir(r, 6, 12), xmax = mx + ir(r, 6, 12);
      const xq = pick(r, [-8, -6, -5, -4, -2, -1, 0]);
      if (xq >= xmin && xq <= xmax) return;
      const yq = m * xq + c;
      if (!(yq < 0)) return;
      return { mx, my, m, c, xmin, xmax, xq, yq };
    });
    const { xmin, xmax, xq, yq, m, c } = p83;
    const cs = (c < 0 ? "" : "+") + decInt(c);
    return pack("The line of best fit is \\(y=" + m + "x" + cs + "\\) for data with \\(x\\) from \\(" + xmin + "\\) to \\(" + xmax + "\\). Use it to estimate the sales at \\(" + xq + "^\\circ\\)C. Explain why this estimate is not reliable.",
      "\\(" + decInt(yq) + "\\): " + (yq < 0 ? "impossible (negative sales); " : "") + "\\(" + xq + "^\\circ\\)C is outside the data range " + xmin + "–" + xmax + ", so it is extrapolation",
      [
        R("", "\\(y=" + m + "\\times" + wrapn(xq) + cs + "=" + wrapn(m * xq) + cs + "=" + decInt(yq) + "\\)"),
        R("", "\\(" + decInt(yq) + "\\)" + (yq < 0 ? " (impossible number of sales)" : ""), "B1", "\\(" + decInt(yq) + "\\)" + (yq < 0 ? ", impossible" : "")),
        R("", "\\(" + xq + "^\\circ\\)C is outside \\(" + xmin + "\\)–\\(" + xmax + "\\), so the estimate is extrapolation", "B1", "extrapolation")
      ], 2);
  };

  G["IGCSE-8-4"] = function (r) {
    const ages = [], prices = [], seen = new Set();
    let a = 1;
    while (ages.length < 10) {
      const age = a;
      const price = Math.max(4, 21 - 2 * age - ir(r, 0, 2));
      const key = age + "," + price;
      if (seen.has(key)) { a++; continue; }
      seen.add(key);
      ages.push(age);
      prices.push(price);
      a++;
    }
    const n = 10;
    const sa = ages.reduce((x, y) => x + y, 0), sp = prices.reduce((x, y) => x + y, 0);
    const ma = sa / n, mp = sp / n;
    const pts = ages.map((x, i) => [x, prices[i]]);
    const svg = scatter(pts, "Age (years)", "Price ($1000s)", 10, 20, 1, 2);
    const est = mp - (ma > 0 ? (18 - 5) * (18 - Math.min(...prices)) / 8 : 10);
    const slope = (prices[prices.length - 1] - prices[0]) / (ages[ages.length - 1] - ages[0]);
    const at5 = mp + slope * (5 - ma);
    const dollars = Math.round(at5 * 1000 / 500) * 500;
    const lo = dollars - 1000, hi = dollars + 1000;
    const amin = Math.min(...ages), amax = Math.max(...ages);
    const q = '<div class="flex"><div>The scatter diagram shows the age and price of 10 used cars of the same model.<table><tr><td>Age (years)</td>' + ages.map((x) => "<td>" + x + "</td>").join("") + "</tr><tr><td>Price (\\$1000s)</td>" + prices.map((x) => "<td>" + x + "</td>").join("") + "</tr></table>(a) State the type of correlation. (b) Find the mean age and the mean price. (c) Draw a line of best fit through the mean point. (d) Estimate the price of a 5-year-old car. (e) Explain why the line should not be used for a 15-year-old car.</div><div class=\"fig\">" + svg + "</div></div>";
    return pack(q, "(a) strong negative (b) " + ma + " years, \\$" + thin(mp * 1000).replace(/\\,/g, " ") + " (c) through \\((" + ma + ",\\," + mp + ")\\) (d) about \\$" + thin(dollars).replace(/\\,/g, " ") + " (accept \\$" + thin(lo).replace(/\\,/g, " ") + "–\\$" + thin(hi).replace(/\\,/g, " ") + ") (e) 15 years is outside the data range (" + amin + "–" + amax + "); the line would give a negative price",
      [
        R("(a)", "strong negative correlation", "B1", "strong negative"),
        R("(b)", "\\(\\sum\\text{age}=" + sa + "\\), \\(n=10\\)"),
        R("(b)", "mean age \\(=" + ma + "\\) years", "B1", "\\(" + ma + "\\) years"),
        R("(b)", "\\(\\sum\\text{price}=" + sp + "\\) (in \\(\\$1000\\)s)"),
        R("(b)", "mean price \\(\\$" + thin(mp * 1000) + "\\)", "B1", "\\(\\$" + thin(mp * 1000) + "\\)"),
        R("(c)", "line through \\((" + ma + ",\\," + mp + ")\\)", "B1", "through \\((" + ma + ",\\," + mp + ")\\)"),
        R("(d)", "about \\(\\$" + thin(dollars) + "\\) (accept \\(\\$" + thin(lo) + "\\)–\\(\\$" + thin(hi) + "\\))", "B1", "accept \\(\\$" + thin(lo) + "\\) to \\(\\$" + thin(hi) + "\\)"),
        R("(e)", "\\(15\\) years is outside the data range \\(" + amin + "\\)–\\(" + amax + "\\); the line would give a negative price", "B1", "outside range / negative price")
      ], 6);
  };

  G["IGCSE-9-0"] = function (r) {
    const p = until(r, () => {
      const x1 = ir(r, -4, 3), y1 = ir(r, -6, 2);
      const dx = pick(r, [4, 6, 8]), dy = pick(r, [3, 4, 6, 8]);
      const x2 = x1 + dx, y2 = y1 + dy;
      const g = gcd(dy, dx);
      const len2 = dx * dx + dy * dy;
      const len = Math.sqrt(len2);
      if (!Number.isInteger(len)) return;
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      return { x1, y1, x2, y2, dx, dy, g, len, mx, my };
    });
    const mg = dfrac(p.dy / p.g, p.dx / p.g);
    const mid = "(" + nstr(p.mx) + "," + nstr(p.my) + ")";
    return pack("P is \\((" + p.x1 + "," + p.y1 + ")\\) and Q is \\((" + p.x2 + "," + p.y2 + ")\\). Find the gradient of PQ, the midpoint of PQ and the length of PQ.",
      "\\(" + mg + "\\); \\(" + mid + "\\); \\(" + p.len + "\\)", [
        R("", "\\(m=\\dfrac{" + p.y2 + "-" + (p.y1 < 0 ? "(" + p.y1 + ")" : p.y1) + "}{" + p.x2 + "-" + (p.x1 < 0 ? "(" + p.x1 + ")" : p.x1) + "}=\\dfrac{" + p.dy + "}{" + p.dx + "}\\)"),
        R("", "\\(m=" + mg + "\\)", "B1", "\\(" + mg + "\\) oe"),
        R("", "midpoint \\(\\left(\\dfrac{" + sumtex(p.x1, p.x2) + "}{2},\\dfrac{" + sumtex(p.y1, p.y2) + "}{2}\\right)\\)"),
        R("", "\\(" + mid + "\\)", "B1", "\\(" + mid + "\\)"),
        R("", "length \\(\\sqrt{(" + p.x2 + "-" + (p.x1 < 0 ? "(" + p.x1 + ")" : p.x1) + ")^2+(" + p.y2 + "-" + (p.y1 < 0 ? "(" + p.y1 + ")" : p.y1) + ")^2}=\\sqrt{" + (p.dx * p.dx) + "+" + (p.dy * p.dy) + "}\\)"),
        R("", "\\(" + p.len + "\\)", "B1", "\\(" + p.len + "\\)")
      ], 3);
  };

  G["IGCSE-9-1"] = function (r) {
    const a = ir(r, 2, 6), b = ir(r, 3, 7);
    if (gcd(a, b) !== 1 && gcd(a, b) === 0) { }
    const c = a * ir(r, 2, 5);
    const g = frac(-a, b), gp = frac(b, a);
    return pack("Find the gradient of the line \\(" + a + "x+" + b + "y=" + c + "\\) and the gradient of a line perpendicular to it.",
      "\\(" + g + "\\); \\(" + gp + "\\)", [
        R("", "\\(" + b + "y=" + nstr(-a) + "x+" + c + "\\) so \\(y=" + slopeX(-a / b) + "+" + nstr(c / b) + "\\)"),
        R("", "gradient \\(=" + g + "\\)", "B1", "\\(" + g + "\\)"),
        R("", "perpendicular \\(=-1\\div(" + g + ")\\)"),
        R("", "\\(" + gp + "\\)", "B1", "\\(" + gp + "\\)")
      ], 2);
  };

  G["IGCSE-9-2"] = function (r) {
    const p = until(r, () => {
      const mx = ir(r, -2, 5), my = ir(r, -4, 3);
      const ax = ir(r, -5, 4), ay = ir(r, -3, 6);
      const bx = 2 * mx - ax, by = 2 * my - ay;
      const len = Math.hypot(bx - ax, by - ay);
      if (!Number.isInteger(len) || len < 5) return;
      if (bx === ax || by === ay) return;
      return { mx, my, ax, ay, bx, by, len };
    });
    return pack("The midpoint of AB is \\(M(" + p.mx + "," + p.my + ")\\) and A is \\((" + p.ax + "," + p.ay + ")\\). Find the coordinates of B and the length of AB.",
      "\\(B(" + p.bx + "," + p.by + ")\\); \\(AB=" + p.len + "\\)", [
        R("", "\\(\\dfrac{" + p.ax + "+x_B}{2}=" + p.mx + "\\)", "M1", "midpoint reverse"),
        R("", "\\(x_B=" + p.bx + "\\)"),
        R("", "\\(\\dfrac{" + p.ay + "+y_B}{2}=" + p.my + "\\)"),
        R("", "\\(y_B=" + p.by + "\\), so \\(B(" + p.bx + "," + p.by + ")\\)", "A1", "\\(B(" + p.bx + "," + p.by + ")\\)"),
        R("", "\\(AB=\\sqrt{(" + p.bx + "-" + (p.ax < 0 ? "(" + p.ax + ")" : p.ax) + ")^2+(" + p.by + "-" + (p.ay < 0 ? "(" + p.ay + ")" : p.ay) + ")^2}=\\sqrt{" + ((p.bx - p.ax) ** 2) + "+" + ((p.by - p.ay) ** 2) + "}\\)".replace("+0", "")),
        R("", "\\(" + p.len + "\\)", "A1", "\\(" + p.len + "\\)")
      ], 3);
  };

  G["IGCSE-9-3"] = function (r) {
    const m = ir(r, 2, 6);
    const px = ir(r, 1, 5), py = ir(r, 2, 8);
    const c0 = ir(r, 1, 5);
    const A = 1, B = m, C = -(px + m * py);
    return pack("Find the equation of the line through \\((" + px + "," + py + ")\\) that is perpendicular to \\(y=" + m + "x-" + c0 + "\\). Give it in the form \\(ax+by+c=0\\).",
      "\\(x+" + B + "y" + (C > 0 ? "+" : "") + C + "=0\\)", [
        R("", "given gradient \\(" + m + "\\), so perpendicular \\(=-\\tfrac{1}{" + m + "}\\)", "M1", "perpendicular gradient \\(-\\frac{1}{" + m + "}\\)"),
        R("", "\\(y-" + py + "=-\\tfrac{1}{" + m + "}(x-" + px + ")\\)", "M1", "point–gradient form"),
        R("", "\\(" + m + "y-" + (m * py) + "=-(x-" + px + ")\\)"),
        R("", "\\(" + m + "y-" + (m * py) + "=-x+" + px + "\\)"),
        R("", "\\(x+" + B + "y" + (C > 0 ? "+" : "") + C + "=0\\)", "A1", "\\(x+" + B + "y" + (C > 0 ? "+" : "") + C + "=0\\) oe integer")
      ], 3);
  };

  G["IGCSE-9-4"] = function (r) {
    const p = until(r, () => {
      const x1 = ir(r, -5, 0), y1 = ir(r, -4, 2);
      const dx = pick(r, [4, 6, 8]), dy = pick(r, [2, 3, 4]);
      const x2 = x1 + dx, y2 = y1 + dy;
      if (y2 === 0 && y1 === 0) return;
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const len = Math.hypot(dx, dy);
      const gradCD = dy / dx;
      const pgrad = -1 / gradCD;
      let Aa = dx, Bb = dy, Cc = -(dx * mx + dy * my);
      if (!Number.isInteger(Aa) || !Number.isInteger(Bb) || !Number.isInteger(Cc)) {
        Aa *= 2; Bb *= 2; Cc *= 2;
      }
      if (![Aa, Bb, Cc].every((z) => Number.isInteger(z))) return;
      const g3 = gcd(gcd(Math.abs(Aa), Math.abs(Bb)), Math.abs(Cc)) || 1;
      Aa /= g3; Bb /= g3; Cc /= g3;
      if (Aa < 0) { Aa = -Aa; Bb = -Bb; Cc = -Cc; }
      if (Bb === 0) return;
      const Ey = -Cc / Bb;
      if (!Number.isFinite(Ey)) return;
      return { x1, y1, x2, y2, dx, dy, mx, my, len, Aa, Bb, Cc, Ey, pgrad, gradCD };
    });
    const surd = p.dx * p.dx + p.dy * p.dy;
    const line = lin(p.Aa, 0) + term(p.Bb, "y") + (p.Cc > 0 ? "+" + p.Cc : p.Cc < 0 ? nstr(p.Cc) : "") + "=0";
    const o94 = pack("C is \\((" + p.x1 + "," + p.y1 + ")\\) and D is \\((" + p.x2 + "," + p.y2 + ")\\). (a) Find the length of CD. (b) Find the equation of the perpendicular bisector of CD in the form \\(ax+by+c=0\\), where \\(a\\), \\(b\\) and \\(c\\) are integers. (c) The perpendicular bisector meets the \\(y\\)-axis at E. Find the coordinates of E.",
      "(a) \\(\\sqrt{" + surd + "}=" + sf(p.len) + "\\) (b) midpoint \\((" + nstr(p.mx) + "," + nstr(p.my) + ")\\), gradient \\(" + nstr(p.pgrad) + "\\): \\(" + line + "\\) (c) \\(E(0," + nstr(p.Ey) + ")\\)", [
        R("(a)", "\\(CD=\\sqrt{(" + p.x2 + "-" + (p.x1 < 0 ? "(" + p.x1 + ")" : p.x1) + ")^2+(" + p.y2 + "-" + (p.y1 < 0 ? "(" + p.y1 + ")" : p.y1) + ")^2}\\)", "M1", "length formula"),
        R("(a)", "\\(=\\sqrt{" + (p.dx * p.dx) + "+" + (p.dy * p.dy) + "}=\\sqrt{" + surd + "}=" + dots(p.len, 3) + "\\)"),
        R("(a)", "\\(" + sf(p.len) + "\\) (3 s.f.)", "A1", "3 s.f. or surd"),
        R("(b)", "midpoint \\(\\left(\\dfrac{" + sumtex(p.x1, p.x2) + "}{2},\\dfrac{" + sumtex(p.y1, p.y2) + "}{2}\\right)=(" + nstr(p.mx) + "," + nstr(p.my) + ")\\)", "M1", "midpoint \\((" + nstr(p.mx) + "," + nstr(p.my) + ")\\)"),
        R("(b)", "gradient of \\(CD=\\dfrac{" + p.dy + "}{" + p.dx + "}=" + frac(p.dy, p.dx) + "\\)"),
        R("(b)", "perpendicular gradient \\(=" + nstr(p.pgrad) + "\\)", "M1", "perpendicular gradient \\(=" + nstr(p.pgrad) + "\\)"),
        R("(b)", "\\(y" + (p.my < 0 ? "+" + nstr(-p.my) : p.my === 0 ? "" : "-" + nstr(p.my)) + "=" + nstr(p.pgrad) + "(x" + (p.mx < 0 ? "+" + nstr(-p.mx) : p.mx === 0 ? "" : "-" + nstr(p.mx)) + ")\\)", "M1", "point–gradient form"),
        R("(b)", "\\(y" + (p.my < 0 ? "+" + nstr(-p.my) : p.my === 0 ? "" : "-" + nstr(p.my)) + "=" + (p.pgrad === -1 ? "-x" : p.pgrad === 1 ? "x" : nstr(p.pgrad) + "x") + (-p.pgrad * p.mx > 0 ? "+" + nstr(-p.pgrad * p.mx) : -p.pgrad * p.mx < 0 ? nstr(-p.pgrad * p.mx) : "") + "\\)"),
        R("(b)", "\\(" + line + "\\)", "A1", "oe"),
        R("(c)", "\\(x=0\\Rightarrow y=" + nstr(p.Ey) + "\\)"),
        R("(c)", "\\(E(0," + nstr(p.Ey) + ")\\)", "B1", "\\(E(0," + nstr(p.Ey) + ")\\)")
      ], 7);
    o94._chk = { ints: [p.Aa, p.Bb, p.Cc].every((z) => Number.isInteger(z)) };
    return o94;
  };

  function erf(x) {
    const s = x < 0 ? -1 : 1; x = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * x);
    return s * (1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x));
  }
  function Phi(z) { return 0.5 * (1 + erf(z / Math.SQRT2)); }
  function poP(l, k) { let t = Math.exp(-l); for (let i = 1; i <= k; i++) t *= l / i; return t; }
  function poC(l, k) { let s = 0; for (let i = 0; i <= k; i++) s += poP(l, i); return s; }
  function Cnk(n, k) { let t = 1; for (let i = 1; i <= k; i++) t = t * (n - k + i) / i; return t; }
  function pt(html, mk) { return '<div class="pt"><div>' + html + '</div><div class="mk">[' + mk + "]</div></div>"; }
  function partsQ(lead, arr) { return lead + arr.map((x) => pt((x.b ? "<b>(" + x.b + ")</b> " : "") + x.t, x.m)).join(""); }
  function ftab(hs, cells) {
    return '<div class="h-scroll" tabindex="0" role="region" aria-label="Frequency table"><table class="ft"><tr>' + hs.map((h) => "<th>" + h + "</th>").join("") + "</tr><tr>" + cells.map((c) => "<td>" + c + "</td>").join("") + "</tr></table></div>";
  }
  function stemTab(stems, key) {
    return '<table class="sl">' + stems.map((s) => '<tr><td class="st">' + s.s + "</td><td>" + s.l.join("  ") + "</td></tr>").join("") + "</table>" +
      '<div style="margin-left:18px;font-size:9.5pt">Key: ' + key + "</div>";
  }
  function qtile(xs, p) {
    const n = xs.length, k = (n + 1) * p;
    if (Math.abs(k - Math.round(k)) < 1e-9) return xs[Math.round(k) - 1];
    const k2 = n * p;
    if (Math.abs(k2 - Math.floor(k2) - 0.5) < 1e-9) return (xs[Math.floor(k2) - 1] + xs[Math.ceil(k2) - 1]) / 2;
    const a = Math.floor(k), f = k - a;
    return xs[a - 1] + f * (xs[a] - xs[a - 1]);
  }
  function histBars(cls, fd, xlab, opts) {
    opts = opts || {};
    const L = 48, T = 10, Wbar = 210, Hbar = 120;
    const xmax = cls[cls.length - 1].hi, ymax = Math.max(...fd) * 1.12;
    const Xn = (x) => L + (x / xmax) * Wbar, Yn = (y) => T + Hbar - (y / ymax) * Hbar;
    const X = (x) => Xn(x).toFixed(2), Y = (y) => Yn(y).toFixed(2);
    let s = '<svg xmlns="http://www.w3.org/2000/svg" width="280" height="170" viewBox="0 0 280 170" font-family="system-ui,sans-serif" font-size="10"><rect width="100%" height="100%" fill="#fff"/>';
    s += '<line x1="' + L + '" y1="' + (T + Hbar) + '" x2="' + (L + Wbar) + '" y2="' + (T + Hbar) + '" stroke="#111"/><line x1="' + L + '" y1="' + T + '" x2="' + L + '" y2="' + (T + Hbar) + '" stroke="#111"/>';
    cls.forEach((c, i) => {
      s += '<rect x="' + X(c.lo) + '" y="' + Y(fd[i]) + '" width="' + (Xn(c.hi) - Xn(c.lo)).toFixed(2) + '" height="' + (Yn(0) - Yn(fd[i])).toFixed(2) + '" fill="#93c5fd" stroke="#1d4ed8"/>';
      s += '<text x="' + X(c.lo) + '" y="' + (T + Hbar + 12) + '" text-anchor="middle">' + c.lo + "</text>";
    });
    s += '<text x="' + X(cls[cls.length - 1].hi) + '" y="' + (T + Hbar + 12) + '" text-anchor="middle">' + cls[cls.length - 1].hi + "</text>";
    if (!opts.hideY) {
      const ticks = [...new Set([0].concat(fd.map((d) => Number(decn(d)))))].sort((a, b) => a - b);
      ticks.forEach((v) => {
        s += '<line x1="' + (L - 3) + '" y1="' + Y(v) + '" x2="' + L + '" y2="' + Y(v) + '" stroke="#111"/>';
        s += '<text x="' + (L - 5) + '" y="' + (Y(v) + 3) + '" text-anchor="end">' + decn(v) + "</text>";
      });
    }
    s += '<text x="' + (L + Wbar / 2) + '" y="165" text-anchor="middle">' + xlab + "</text>";
    return s + "</svg>";
  }
  function boxSvg(q1, med, q3, w0, w1, outs) {
    const vals = [q1, med, q3, w0, w1].concat(outs || []);
    const mn = Math.min(...vals) - 8, mx = Math.max(...vals) + 8;
    const L = 24, y = 40, W = 360, sc = W / (mx - mn);
    const Xn = (v) => L + (v - mn) * sc, X = (v) => Xn(v).toFixed(2);
    let s = '<svg xmlns="http://www.w3.org/2000/svg" width="410" height="80" viewBox="0 0 410 80" font-family="system-ui,sans-serif" font-size="10"><rect width="100%" height="100%" fill="#fff"/>';
    s += '<line x1="' + X(w0) + '" y1="' + y + '" x2="' + X(q1) + '" y2="' + y + '" stroke="#111"/><line x1="' + X(q3) + '" y1="' + y + '" x2="' + X(w1) + '" y2="' + y + '" stroke="#111"/>';
    s += '<rect x="' + X(q1) + '" y="' + (y - 16) + '" width="' + (Xn(q3) - Xn(q1)).toFixed(2) + '" height="32" fill="#bfdbfe" stroke="#111"/>';
    s += '<line x1="' + X(med) + '" y1="' + (y - 16) + '" x2="' + X(med) + '" y2="' + (y + 16) + '" stroke="#111" stroke-width="2"/>';
    s += '<line x1="' + X(w0) + '" y1="' + (y - 8) + '" x2="' + X(w0) + '" y2="' + (y + 8) + '" stroke="#111"/><line x1="' + X(w1) + '" y1="' + (y - 8) + '" x2="' + X(w1) + '" y2="' + (y + 8) + '" stroke="#111"/>';
    (outs || []).forEach((o) => { s += '<text x="' + X(o) + '" y="' + (y + 4) + '" text-anchor="middle" font-size="14">×</text>'; });
    return s + "</svg>";
  }
  function sq(x) { return x * x; }
  function mid(a, b) { return (a + b) / 2; }

  G["AS-0-0"] = function (r) {
    const p = until(r, () => {
      const h = ir(r, 2, 8), b = ir(r, 2, 12);
      return { h, c: h * h + b, b };
    });
    const q = "Express \\(x^2+" + (2 * p.h) + "x+" + p.c + "\\) in the form \\((x+a)^2+b\\) and state the coordinates of the vertex of \\(y=x^2+" + (2 * p.h) + "x+" + p.c + "\\)." + pt("", 3);
    const o = pack(q, "\\((x+" + p.h + ")^2+" + p.b + "\\); vertex \\((-" + p.h + ",\\," + p.b + ")\\).", [
      R("", "\\(x^2+" + (2 * p.h) + "x=" + "(x+" + p.h + ")^2-" + (p.h * p.h) + "\\)", "M1", "complete the square"),
      R("", "\\((x+" + p.h + ")^2+" + p.b + "\\)", "A1", "cao"),
      R("", "vertex \\((-" + p.h + ",\\," + p.b + ")\\)", "A1", "vertex")
    ], 3);
    o._chk = { exp: Math.abs((0 + p.h) ** 2 + p.b - p.c) < 1e-9 };
    return o;
  };

  G["AS-0-1"] = function (r) {
    const p = until(r, () => {
      const a = ir(r, 2, 6), h = ir(r, 1, 5), qv = pick(r, [-9, -7, -5, -4, -3, 2, 3, 5]);
      const C = a * h * h + qv;
      if (C === 0) return;
      return { a, h, qv, B: -2 * a * h, C };
    });
    const q = "\\(f(x)=" + quad(p.a, p.B, p.C) + "\\) for \\(x\\in\\mathbb{R}\\)." + partsQ("", [{ b: "a", t: "Express \\(f(x)\\) in the form \\(a(x+b)^2+c\\).", m: 3 }, { b: "b", t: "State the range of \\(f\\).", m: 1 }]);
    const rng = p.a > 0 ? "f(x)\\ge " + nstr(p.qv) : "f(x)\\le " + nstr(p.qv);
    const o = pack(q, "(a) \\(" + p.a + "(x-" + p.h + ")^{2}" + add(p.qv) + "\\)   (b) \\(" + rng + "\\).", [
      R("(a)", "\\(" + p.a + "(x^2-" + (2 * p.h) + "x)" + add(p.C) + "\\)", "M1", "factor \\(a\\)"),
      R("(a)", "\\(" + p.a + "((x-" + p.h + ")^{2}-" + (p.h * p.h) + ")" + add(p.C) + "\\)", "M1", "complete square"),
      R("(a)", "\\(" + p.a + "(x-" + p.h + ")^{2}" + add(p.qv) + "\\)", "A1", "cao"),
      R("(b)", "\\(" + rng + "\\)", "B1", "range")
    ], 4);
            o._chk = { v: Math.abs(p.a * p.h * p.h + p.B * p.h + p.C - p.qv) < 1e-9 };
    return o;
  };

  G["AS-0-2"] = function (r) {
    const p = until(r, () => {
      const b = ir(r, 2, 5), c = ir(r, 1, 4), a = ir(r, 8, 20);
      const C = a - b * c * c;
      if (C === 0) return;
      return { a, b, c, B: 2 * b * c, C };
    });
    const q = "\\(g(x)=" + quad(-p.b, p.B, p.C) + "\\)." + partsQ("", [
      { b: "a", t: "Express \\(g(x)\\) in the form \\(a-b(x-c)^2\\), where \\(a\\), \\(b\\) and \\(c\\) are constants.", m: 3 },
      { b: "b", t: "State the greatest value of \\(g(x)\\) and the value of \\(x\\) where it happens.", m: 1 }
    ]);
    const o = pack(q, "(a) \\(" + p.a + "-" + p.b + "(x-" + p.c + ")^2\\)   (b) greatest value \\(" + p.a + "\\) when \\(x=" + p.c + "\\).", [
        R("(a)", "\\(-" + p.b + "(x^2-" + (2 * p.c) + "x)" + (p.C >= 0 ? "+" : "") + nstr(p.C) + "\\)", "M1", "factor"),
        R("(a)", "\\(-" + p.b + "((x-" + p.c + ")^2-" + (p.c * p.c) + ")" + (p.C >= 0 ? "+" : "") + nstr(p.C) + "\\)", "M1", "complete square"),
      R("(a)", "\\(" + p.a + "-" + p.b + "(x-" + p.c + ")^2\\)", "A1", "cao"),
      R("(b)", "greatest value \\(" + p.a + "\\) when \\(x=" + p.c + "\\)", "B1", "max")
    ], 4);
    o._chk = { mx: Math.abs(p.C + p.B * p.c - p.b * p.c * p.c - p.a) < 1e-9 };
    return o;
  };

  G["AS-0-3"] = function (r) {
    const p = until(r, () => {
      const h = ir(r, 2, 5), qv = pick(r, [-8, -5, -3, -2]);
      const L = h - ir(r, 3, 5), Rgt = h + ir(r, 1, 3);
      const fL = (L - h) ** 2 + qv, fR = (Rgt - h) ** 2 + qv;
      const hi = Math.max(fL, fR), lo = qv;
      if (hi === lo) return;
      return { h, qv, L, Rgt, fL, fR, hi, lo, B: -2 * h, C: h * h + qv };
    });
    const q = "\\(f(x)=" + quad(1, p.B, p.C) + "\\) for \\(" + p.L + "\\le x\\le " + p.Rgt + "\\). Find the range of \\(f\\)." + pt("", 4);
    const o = pack(q, "\\((x-" + p.h + ")^2" + nstr(p.qv) + "\\); vertex \\(x=" + p.h + "\\) is in the domain, \\(f(" + p.L + ")=" + p.fL + "\\), \\(f(" + p.Rgt + ")=" + p.fR + "\\). Range \\(" + p.lo + "\\le f(x)\\le " + p.hi + "\\).", [
      R("", "\\((x-" + p.h + ")^2" + nstr(p.qv) + "\\)", "M1", "complete the square"),
      R("", "vertex \\(x=" + p.h + "\\) lies in \\([" + p.L + "," + p.Rgt + "]\\)", "M1", "vertex in domain"),
      R("", "\\(f(" + p.L + ")=" + p.fL + "\\), \\(f(" + p.Rgt + ")=" + p.fR + "\\), \\(f(" + p.h + ")=" + p.qv + "\\)", "A1", "end values"),
      R("", "range \\(" + p.lo + "\\le f(x)\\le " + p.hi + "\\)", "A1", "range")
    ], 4);
    o._chk = { ends: p.fL === (p.L - p.h) ** 2 + p.qv && p.hi === Math.max(p.fL, p.fR) };
    return o;
  };

  G["AS-0-4"] = function (r) {
    const p = until(r, () => {
      const a = pick(r, [1, 3, 5]), minv = ir(r, 1, 4), d0 = ir(r, 1, 3);
      const k = minv + a * a;
      const f1 = (2 * d0 + a) ** 2 + k - a * a;
      return { a, minv, k, d0, f1 };
    });
    const q = "\\(f(x)=4x^2+" + (4 * p.a) + "x+k\\), where \\(k\\) is a constant." + partsQ("", [
      { b: "a", t: "Express \\(f(x)\\) in the form \\((2x+a)^2+b\\), giving \\(b\\) in terms of \\(k\\).", m: 2 },
      { b: "b", t: "The minimum value of \\(f(x)\\) is \\(" + p.minv + "\\). Find \\(k\\).", m: 1 },
      { b: "c", t: "With this value of \\(k\\), \\(f\\) has domain \\(x\\ge " + p.d0 + "\\). Find the range of \\(f\\), giving a reason.", m: 2 }
    ]);
    const vx = -p.a / 2;
    const o = pack(q, "(a) \\((2x+" + p.a + ")^2+k-" + (p.a * p.a) + "\\)   (b) \\(k=" + p.k + "\\)   (c) vertex at \\(x=" + nstr(vx) + "\\), so \\(f\\) is increasing for \\(x\\ge" + p.d0 + "\\); \\(f(" + p.d0 + ")=" + p.f1 + "\\), range \\(f(x)\\ge " + p.f1 + "\\).", [
      R("(a)", "\\((2x+" + p.a + ")^2=" + "4x^2+" + (4 * p.a) + "x+" + (p.a * p.a) + "\\)", "M1", "expand"),
      R("(a)", "\\((2x+" + p.a + ")^2+k-" + (p.a * p.a) + "\\)", "A1", "\\(b=k-" + (p.a * p.a) + "\\)"),
      R("(b)", "minimum \\(k-" + (p.a * p.a) + "=" + p.minv + "\\Rightarrow k=" + p.k + "\\)", "B1", "\\(k=" + p.k + "\\)"),
      R("(c)", "vertex \\(x=" + nstr(vx) + "\\) is left of \\(x=" + p.d0 + "\\), so \\(f\\) increasing on the domain", "M1", "compare vertex"),
      R("(c)", "\\(f(" + p.d0 + ")=" + p.f1 + "\\), range \\(f(x)\\ge " + p.f1 + "\\)", "A1", "range")
    ], 5);
    o._chk = { min: p.k - p.a * p.a === p.minv };
    return o;
  };

  G["AS-1-0"] = function (r) {
    const p = until(r, () => {
      const m = ir(r, 1, 5), b = ir(r, 2, 6), c = ir(r, 1, 8);
      const B = b - m;
      if (B === 0 || B === 1 || B === -1) return;
      return { m, b, c, B, cut: c - B * B / 4 };
    });
    const q = "Find the set of values of \\(k\\) for which the line \\(y=" + kx(p.m) + "+k\\) meets the curve \\(y=" + quad(1, p.b, p.c) + "\\) at two distinct points." + pt("", 3);
    const o = pack(q, "\\(" + quad(1, p.B, 0) + "+" + p.c + "-k=0\\); \\(" + (p.B * p.B) + "-4(" + p.c + "-k)>0\\Rightarrow k>" + nstr(p.cut) + "\\).", [
      R("", "\\(" + quad(1, p.B, 0) + "+(" + p.c + "-k)=0\\)", "M1", "eliminate \\(y\\)"),
      R("", "\\(D=" + (p.B * p.B) + "-4(" + p.c + "-k)\\)", "M1", "discriminant"),
      R("", "\\(D>0\\Rightarrow k>" + nstr(p.cut) + "\\)", "A1", "set of \\(k\\)")
    ], 3);
    o._chk = { two: p.B * p.B - 4 * (p.c - (p.cut + 1)) > 0 };
    return o;
  };

  G["AS-1-1"] = function (r) {
    const p = until(r, () => {
      const m = ir(r, 2, 9), c = ir(r, 2, 16);
      const A = 1, B = -(1 + m), C = 1 + c;
      const D = B * B - 4 * A * C;
      if (D >= 0) return;
      return { m, c, A, B, C, D };
    });
    const q = "Show that the line \\(y=" + p.m + "x-" + p.c + "\\) does not meet the curve \\(y=x^2-x+1\\)." + pt("", 3);
    const o = pack(q, "\\(" + quad(1, p.B, p.C) + "=0\\); \\(b^2-4ac=" + p.D + "<0\\), so no real roots and the line does not meet the curve.", [
      R("", "\\(x^2-x+1=" + p.m + "x-" + p.c + "\\)", "M1", "equate"),
      R("", "\\(" + quad(1, p.B, p.C) + "=0\\)", "A1", "quadratic"),
      R("", "\\(D=" + (p.B * p.B) + "-" + (4 * p.C) + "=" + p.D + "<0\\)", "A1", "no real roots")
    ], 3);
    o._chk = { neg: p.D < 0 };
    return o;
  };

  G["AS-1-2"] = function (r) {
    const p = until(r, () => {
      const a = ir(r, 2, 5), b = ir(r, 1, 8), c = ir(r, 5, 16);
      const A = a, B0 = b, C = c - 1;
      const discLin = 2 * Math.sqrt(A * C);
      if (!Number.isInteger(discLin)) return;
      return { a, b, c, C, lo: b - discLin, hi: b + discLin };
    });
    const q = "Find the set of values of \\(k\\) for which the line \\(y=kx+1\\) does <b>not</b> meet the curve \\(y=" + quad(p.a, p.b, p.c) + "\\)." + pt("", 4);
    const o = pack(q, "\\(" + p.a + "x^2+(" + p.b + "-k)x+" + p.C + "=0\\); \\((" + p.b + "-k)^2-" + (4 * p.a * p.C) + "<0\\Rightarrow " + p.lo + "\\lt k\\lt " + p.hi + "\\).", [
      R("", "\\(" + p.a + "x^2+(" + p.b + "-k)x+" + p.C + "=0\\)", "M1", "equate"),
      R("", "\\(D=(" + p.b + "-k)^2-" + (4 * p.a * p.C) + "\\)", "M1", "discriminant"),
      R("", "\\(D<0\\Rightarrow |k-" + p.b + "|<" + ((p.hi - p.lo) / 2) + "\\)", "M1", "inequality"),
      R("", "\\(" + p.lo + "<k<" + p.hi + "\\)", "A1", "set")
    ], 4);
    o._chk = { mid: (p.b - p.b) ** 2 - 4 * p.a * p.C < 0 };
    return o;
  };

  G["AS-1-3"] = function (r) {
    const p = until(r, () => {
      const a = pick(r, [2, 3, 4, 5, 6]), b = ir(r, -12, 12), c0 = ir(r, 1, 20);
      const A = a, B = b + 1, Cbase = c0;
      if (B === 0) return;
      const discNeed = B * B;
      const fourA = 4 * A;
      if (discNeed % fourA) return;
      const K = Cbase - discNeed / fourA;
      const x = -B / (2 * A);
      const y = -x + K;
      if (!Number.isInteger(x * 2) && !Number.isInteger(x)) return;
      return { a, b, c0, B, K, x, y };
    });
    const q = "The line \\(x+y=c\\) is a tangent to the curve \\(y=" + quad(p.a, p.b, p.c0) + "\\). Find the value of \\(c\\) and the coordinates of the point of contact." + pt("", 5);
    const o = pack(q, "\\(" + quad(p.a, p.B, p.c0) + "-c=0\\); \\(" + (p.B * p.B) + "-" + (4 * p.a) + "(" + p.c0 + "-c)=0\\Rightarrow c=" + nstr(p.K) + "\\); point \\(\\left(" + nstr(p.x) + ",\\," + nstr(p.y) + "\\right)\\).", [
      R("", "\\(y=c-x\\) into the curve", "M1", "substitute"),
      R("", "\\(" + quad(p.a, p.B, p.c0) + "-c=0\\)", "A1", "quadratic"),
      R("", "\\(D=0\\Rightarrow c=" + nstr(p.K) + "\\)", "M1", "tangent"),
      R("", "\\(x=" + nstr(p.x) + "\\)", "A1", "\\(x\\)"),
      R("", "point \\((" + nstr(p.x) + "," + nstr(p.y) + ")\\)", "A1", "contact")
    ], 5);
    o._chk = { on: Math.abs(p.x + p.y - p.K) < 1e-9 };
    return o;
  };

  G["AS-1-4"] = function (r) {
    const p = until(r, () => {
      const a = pick(r, [2, 3, 4, 5]), c0 = ir(r, 1, 10), lineC = ir(r, 1, 5);
      const lineB = 1;
      const C = c0 - lineC;
      if (4 * a * C <= 0) return;
      const s = Math.sqrt(4 * a * C);
      if (!Number.isInteger(s)) return;
      const kpos = s - lineB, kneg = -s - lineB;
      const k = kpos > 0 ? kpos : null;
      if (k == null) return;
      const x = (k + lineB) / (2 * a);
      const y = x + lineC;
      return { a, c0, C, s, kpos, kneg, k, x, y, lineC };
    });
    const q = "A curve has equation \\(y=" + p.a + "x^2-kx+" + p.c0 + "\\), where \\(k\\) is a constant, and a line has equation \\(y=x+" + p.lineC + "\\)." + partsQ("", [
      { b: "a", t: "Show that the \\(x\\)-coordinates of the points where the line meets the curve satisfy \\(" + p.a + "x^2-(k+1)x+" + p.C + "=0\\).", m: 1 },
      { b: "b", t: "Find the set of values of \\(k\\) for which the line meets the curve at two distinct points.", m: 3 },
      { b: "c", t: "Given that \\(k>0\\) and that the line is a tangent to the curve, find \\(k\\) and the coordinates of the point of contact.", m: 3 }
    ]);
    const o = pack(q, "(b) \\((k+1)^2-" + (4 * p.a * p.C) + ">0\\Rightarrow k<" + p.kneg + "\\) or \\(k>" + p.kpos + "\\).   (c) \\(k=" + p.k + "\\): point \\((" + nstr(p.x) + ",\\," + nstr(p.y) + ")\\).", [
      R("(a)", "\\(" + p.a + "x^2-kx+" + p.c0 + "=x+" + p.lineC + "\\Rightarrow " + p.a + "x^2-(k+1)x+" + p.C + "=0\\)", "B1", "AG"),
      R("(b)", "\\(D=(k+1)^2-" + (4 * p.a * p.C) + "\\)", "M1", "discriminant"),
      R("(b)", "\\(D>0\\Rightarrow |k+1|>" + p.s + "\\)", "M1", "solve"),
      R("(b)", "\\(k<" + p.kneg + "\\) or \\(k>" + p.kpos + "\\)", "A1", "set"),
      R("(c)", "\\((k+1)^2=" + (p.s * p.s) + "\\), \\(k>0\\Rightarrow k=" + p.k + "\\)", "M1", "tangent \\(k>0\\)"),
      R("(c)", "\\(x=" + nstr(p.x) + "\\)", "A1", "\\(x\\)"),
      R("(c)", "point \\((" + nstr(p.x) + "," + nstr(p.y) + ")\\)", "A1", "contact")
    ], 7);
    o._chk = { tang: Math.abs((p.k + 1) ** 2 - 4 * p.a * p.C) < 1e-9 };
    return o;
  };

  G["AS-2-0"] = function (r) {
    const p0 = until(r, () => {
      const a = ir(r, 2, 5), b = ir(r, 1, 6), x0 = ir(r, 2, 4);
      if (a === b) return;
      return { a, b, x0, f2: a * x0 - b, gf: (a * x0 - b) ** 2 + 1 };
    });
    const a = p0.a, b = p0.b, x0 = p0.x0, f2 = p0.f2, gf = p0.gf;
    const fg = quad(a, 0, a - b);
    const q = "\\(f(x)=" + lin(a, -b) + "\\) and \\(g(x)=x^2+1\\) for \\(x\\in\\mathbb{R}\\). Find \\(fg(x)\\) and the value of \\(gf(" + x0 + ")\\)." + pt("", 3);
    const o = pack(q, "\\(fg(x)=" + fg + "\\); \\(f(" + x0 + ")=" + f2 + "\\), \\(gf(" + x0 + ")=" + gf + "\\).", [
      R("", "\\(fg(x)=f(x^2+1)=" + a + "(x^2+1)-" + b + "\\)", "M1", "compose"),
      R("", "\\(fg(x)=" + fg + "\\)", "A1", "fg"),
      R("", "\\(f(" + x0 + ")=" + f2 + "\\), \\(g(" + f2 + ")=" + gf + "\\)", "A1", "gf")
    ], 3);
    o._chk = { gf: gf === (a * x0 - b) ** 2 + 1 };
    return o;
  };

  G["AS-2-1"] = function (r) {
    const p = until(r, () => {
      const n = ir(r, 2, 6), d = ir(r, 1, 4), s = ir(r, 1, 4);
      return { n, d, s };
    });
    const q = "\\(f(x)=\\dfrac{" + p.n + "}{x+" + p.d + "}+" + p.s + "\\) for \\(x>-" + p.d + "\\). Find \\(f^{-1}(x)\\) and state the domain of \\(f^{-1}\\)." + pt("", 4);
    const inv = "\\dfrac{" + p.n + "}{x-" + p.s + "}-" + p.d;
    const o = pack(q, "\\(f^{-1}(x)=" + inv + "\\); domain \\(x>" + p.s + "\\) (the range of \\(f\\)).", [
      R("", "\\(y=" + p.s + "+\\dfrac{" + p.n + "}{x+" + p.d + "}\\)", "M1", "set \\(y=f(x)\\)"),
      R("", "\\(y-" + p.s + "=\\dfrac{" + p.n + "}{x+" + p.d + "}\\)", "M1", "rearrange"),
      R("", "\\(f^{-1}(x)=" + inv + "\\)", "A1", "inverse"),
      R("", "domain \\(x>" + p.s + "\\)", "A1", "range of \\(f\\)")
    ], 4);
    o._chk = { asy: true };
    return o;
  };

  G["AS-2-2"] = function (r) {
    const h = ir(r, 2, 6), qv = ir(r, 1, 5);
    const q = "\\(f(x)=(x-" + h + ")^2+" + qv + "\\) for \\(x\\ge" + h + "\\)." + partsQ("", [
      { b: "a", t: "Explain why \\(f\\) has an inverse.", m: 1 },
      { b: "b", t: "Find \\(f^{-1}(x)\\), and state its domain and range.", m: 4 }
    ]);
    const o = pack(q, "(a) \\(f\\) is increasing for \\(x\\ge" + h + "\\), so it is one-one. (b) \\(f^{-1}(x)=" + h + "+\\sqrt{x-" + qv + "}\\); domain \\(x\\ge" + qv + "\\); range \\(f^{-1}(x)\\ge" + h + "\\).", [
      R("(a)", "\\(f\\) increasing on \\(x\\ge" + h + "\\), hence one-one", "B1", "one-one"),
      R("(b)", "\\(y=(x-" + h + ")^2+" + qv + "\\)", "M1", "set \\(y\\)"),
      R("(b)", "\\(x=" + h + "+\\sqrt{y-" + qv + "}\\) (positive root)", "M1", "positive root"),
      R("(b)", "\\(f^{-1}(x)=" + h + "+\\sqrt{x-" + qv + "}\\)", "A1", "expression"),
      R("(b)", "domain \\(x\\ge" + qv + "\\), range \\(x\\ge" + h + "\\)", "A1", "domain and range")
    ], 5);
    o._chk = { f: Math.abs(((h + 2) - h) ** 2 + qv - (4 + qv)) < 1e-9 };
    return o;
  };

  G["AS-2-3"] = function (r) {
    const p = until(r, () => {
      const a = ir(r, 2, 5), b = ir(r, 1, 6), x0 = 1;
      const f1 = a * x0 + b, ff = a * f1 + b;
      if (f1 === x0) return;
      return { a, b, f1, ff };
    });
    const xs = -p.b / (p.a - 1);
    const q = "\\(f(x)=ax+b\\), where \\(a\\) and \\(b\\) are constants. It is given that \\(f(1)=" + p.f1 + "\\) and \\(ff(1)=" + p.ff + "\\)." + partsQ("", [
      { b: "a", t: "Find \\(a\\) and \\(b\\).", m: 3 },
      { b: "b", t: "Solve \\(f(x)=f^{-1}(x)\\).", m: 2 }
    ]);
    const o = pack(q, "(a) \\(a=" + p.a + ",\\ b=" + p.b + "\\). (b) \\(f^{-1}(x)=\\dfrac{x-" + p.b + "}{" + p.a + "}\\); \\(x=" + nstr(xs) + "\\).", [
      R("(a)", "\\(a+b=" + p.f1 + "\\)", "M1", "\\(f(1)\\)"),
      R("(a)", "\\(f(" + p.f1 + ")=" + p.ff + "\\Rightarrow " + p.f1 + "a+b=" + p.ff + "\\)", "M1", "\\(ff(1)\\)"),
      R("(a)", "\\(a=" + p.a + ",\\ b=" + p.b + "\\)", "A1", "cao"),
      R("(b)", "\\(" + p.a + "x+" + p.b + "=\\dfrac{x-" + p.b + "}{" + p.a + "}\\)", "M1", "equate"),
      R("(b)", "\\(x=" + nstr(xs) + "\\)", "A1", "solve")
    ], 5);
    o._chk = { ff: p.a * p.f1 + p.b === p.ff };
    return o;
  };

  G["AS-2-4"] = function (r) {
    const p = until(r, () => {
      const c = ir(r, 3, 16), d = ir(r, 2, 7), e = ir(r, 1, 8);
      const gmin = e / d;
      const fgmin = gmin * gmin - c;
      const qa = 1, qb = 2 * e - d * d * d, qc = e * e - c * d * d + e * d * d;
      const D = qb * qb - 4 * qa * qc;
      if (D <= 1e-9 || Math.abs(Math.sqrt(D) - Math.round(Math.sqrt(D))) > 1e-9) return;
      const sd = Math.sqrt(D);
      const r1 = (-qb + sd) / 2, r2 = (-qb - sd) / 2;
      if (Math.abs(r1 - r2) < 1e-9) return;
      const acc = [r1, r2].filter((x) => x >= gmin - 1e-9);
      const rej = [r1, r2].filter((x) => x < gmin - 1e-9);
      if (acc.length !== 1) return;
      if (!(rej[0] < 0)) return;
      return { c, d, e, gmin, fgmin, r1, r2, acc, rej };
    });
    const q = "\\(f(x)=x^2-" + p.c + "\\) for \\(x\\in\\mathbb{R}\\) and \\(g(x)=\\dfrac{x+" + p.e + "}{" + p.d + "}\\) for \\(x\\ge0\\)." + partsQ("", [
      { b: "a", t: "Find an expression for \\(fg(x)\\) and state the range of \\(fg\\).", m: 3 },
      { b: "b", t: "Find \\(g^{-1}(x)\\) and state the domain of \\(g^{-1}\\).", m: 3 },
      { b: "c", t: "Solve the equation \\(fg(x)=g^{-1}(x)\\).", m: 4 }
    ]);
    const r1 = p.r1, r2 = p.r2, acc = p.acc;
    const fgtex = "\\dfrac{(x+" + p.e + ")^{2}}{" + (p.d * p.d) + "}-" + p.c;
    const rejNote = "\\(x=" + nstr(p.rej[0]) + "\\text{ rejected (not in the domain of }g^{-1})\\)";
    const o = pack(q, "(a) \\(fg(x)=" + fgtex + "\\); \\(fg(x)\\ge" + nstr(p.fgmin) + "\\). (b) \\(g^{-1}(x)=" + p.d + "x-" + p.e + "\\), domain \\(x\\ge" + nstr(p.gmin) + "\\). (c) " + rejNote + "; \\(x=" + nstr(acc[0]) + "\\).", [
      R("(a)", "\\(g(x)=\\dfrac{x+" + p.e + "}{" + p.d + "}\\)", "M1", "compose"),
      R("(a)", "\\(fg(x)=" + fgtex + "\\)", "A1", "expression"),
      R("(a)", "\\(g(x)\\ge" + nstr(p.gmin) + "\\) so \\(fg(x)\\ge" + nstr(p.fgmin) + "\\)", "A1", "range"),
      R("(b)", "\\(x=\\dfrac{y+" + p.e + "}{" + p.d + "}\\Rightarrow y=" + p.d + "x-" + p.e + "\\)", "M1", "swap"),
      R("(b)", "\\(g^{-1}(x)=" + p.d + "x-" + p.e + "\\)", "A1", "inverse"),
      R("(b)", "domain \\(x\\ge" + nstr(p.gmin) + "\\)", "A1", "domain"),
      R("(c)", "\\(" + fgtex + "=" + p.d + "x-" + p.e + "\\)", "M1", "equate"),
      R("(c)", "quadratic in \\(x\\)", "M1", "clear"),
      R("(c)", "roots \\(" + nstr(r1) + "\\), \\(" + nstr(r2) + "\\)", "A1", "solve"),
      R("(c)", rejNote + "; \\(x=" + nstr(acc[0]) + "\\)", "A1", "domain of \\(g^{-1}\\)")
    ], 10);
    function fgval(x) { return Math.pow((x + p.e) / p.d, 2) - p.c; }
    function ginv(x) { return p.d * x - p.e; }
    o._chk = {
      one: acc.length === 1 && p.rej.length === 1 && p.rej[0] < 0 && acc[0] >= p.gmin - 1e-9,
      eq: Math.abs(fgval(acc[0]) - ginv(acc[0])) < 1e-6,
      rej: p.rej[0] < p.gmin - 1e-9
    };
    return o;
  };

  G["AS-3-0"] = function (r) {
    const h = ir(r, 3, 8), qv = pick(r, [-20, -18, -12, -8, 3]);
    const B = 2 * h, C = h * h + qv;
    const q = "\\(f(x)=" + quad(1, B, C) + "\\) for \\(x\\ge k\\). Find the least value of \\(k\\) for which \\(f\\) is one-one." + pt("", 3);
    const o = pack(q, "\\((x+" + h + ")^{2}" + add(qv) + "\\); least \\(k=" + nstr(-h) + "\\).", [
      R("", "\\((x+" + h + ")^{2}" + add(qv) + "\\)", "M1", "complete square"),
      R("", "vertex at \\(x=" + nstr(-h) + "\\)", "A1", "vertex"),
      R("", "least \\(k=" + nstr(-h) + "\\)", "A1", "one-one")
    ], 3);
    o._chk = { v: -h * 2 + B === 0 };
    return o;
  };

  G["AS-3-1"] = function (r) {
    const h = ir(r, 1, 5), qv = ir(r, 2, 8);
    const q = "\\(f(x)=(x-" + h + ")^2+" + qv + "\\) for \\(x\\ge" + h + "\\). Find \\(f^{-1}(x)\\) and state its domain." + pt("", 3);
    const o = pack(q, "\\(f^{-1}(x)=" + h + "+\\sqrt{x-" + qv + "}\\), domain \\(x\\ge" + qv + "\\).", [
      R("", "\\(y=(x-" + h + ")^2+" + qv + "\\)", "M1", "set y"),
      R("", "\\(f^{-1}(x)=" + h + "+\\sqrt{x-" + qv + "}\\)", "A1", "positive root"),
      R("", "domain \\(x\\ge" + qv + "\\)", "A1", "range of f")
    ], 3);
    o._chk = { back: Math.abs((h + Math.sqrt((qv + 9) - qv) - h) ** 2 + qv - (qv + 9)) < 1e-9 };
    return o;
  };

  G["AS-3-2"] = function (r) {
    const h = ir(r, 1, 4), R0 = ir(r, 6, 12);
    const qv = R0 * R0;
    const C = qv - h * h;
    const q = "\\(f(x)=" + C + "+" + (2 * h) + "x-x^2\\) for \\(x\\le k\\)." + partsQ("", [
      { b: "a", t: "Find the greatest value of \\(k\\) for which \\(f\\) has an inverse.", m: 2 },
      { b: "b", t: "For this value of \\(k\\), find \\(f^{-1}(x)\\) and state its domain.", m: 3 }
    ]);
    const o = pack(q, "(a) \\(" + qv + "-(x-" + h + ")^2\\); greatest \\(k=" + h + "\\). (b) \\(f^{-1}(x)=" + h + "-\\sqrt{" + qv + "-x}\\); domain \\(x\\le" + qv + "\\).", [
      R("(a)", "\\(" + qv + "-(x-" + h + ")^2\\)", "M1", "complete square"),
      R("(a)", "greatest \\(k=" + h + "\\)", "A1", "vertex"),
      R("(b)", "\\(x=" + h + "-\\sqrt{" + qv + "-y}\\)", "M1", "left branch"),
      R("(b)", "\\(f^{-1}(x)=" + h + "-\\sqrt{" + qv + "-x}\\)", "A1", "inverse"),
      R("(b)", "domain \\(x\\le" + qv + "\\)", "A1", "range of f")
    ], 5);
    o._chk = { max: C + 2 * h * h - h * h === qv };
    return o;
  };

  G["AS-3-3"] = function (r) {
    const h = ir(r, 2, 10), a = ir(r, 2, 5), qv = pick(r, [-9, -8, -7, -6, -5, -4, -3, -2, 2, 3]);
    const kbad = h - 1;
    const x2 = 2 * h - kbad;
    const fbad = a * (kbad - h) ** 2 + qv;
    const B = -2 * a * h, C = a * h * h + qv;
    const q = "\\(f(x)=" + quad(a, B, C) + "\\)." + partsQ("", [
      { b: "a", t: "Using a numerical example, explain why \\(f\\) with domain \\(x\\ge" + kbad + "\\) does not have an inverse.", m: 2 },
      { b: "b", t: "Find the least value of \\(k\\) such that \\(f\\) with domain \\(x\\ge k\\) has an inverse.", m: 2 }
    ]);
    const o = pack(q, "(a) \\(f(" + kbad + ")=f(" + x2 + ")=" + fbad + "\\): two inputs give the same output, so not one-one. (b) \\(" + a + "(x-" + h + ")^{2}" + add(qv) + "\\); least \\(k=" + h + "\\).", [
      R("(a)", "\\(f(" + kbad + ")=" + fbad + "\\) and \\(f(" + x2 + ")=" + fbad + "\\)", "M1", "two inputs"),
      R("(a)", "not one-one, so no inverse", "A1", "not 1-1"),
      R("(b)", "\\(" + a + "(x-" + h + ")^{2}" + add(qv) + "\\)", "M1", "vertex"),
      R("(b)", "least \\(k=" + h + "\\)", "A1", "least k")
    ], 4);
    o._chk = { pair: fbad === a * (x2 - h) ** 2 + qv };
    return o;
  };

  G["AS-3-4"] = function (r) {
    const p34 = until(r, () => {
    const a = ir(r, 2, 4), h = ir(r, 1, 4), qv = pick(r, [-8, -7, -5, -4]);
    const B = 2 * a * h, C = a * h * h + qv;
    if (C === 0) return;
    return { a, h, qv, B, C };
    });
    const a = p34.a, h = p34.h, qv = p34.qv, B = p34.B, C = p34.C;
    const q = "\\(f:x\\mapsto " + quad(a, B, C) + "\\) for \\(x\\le k\\)." + partsQ("", [
      { b: "a", t: "Express \\(" + quad(a, B, C) + "\\) in the form \\(a(x+b)^2+c\\).", m: 3 },
      { b: "b", t: "State the greatest value of \\(k\\) for which \\(f\\) is one-one, and justify your answer.", m: 2 },
      { b: "c", t: "For this value of \\(k\\), find an expression for \\(f^{-1}(x)\\) and state the domain of \\(f^{-1}\\).", m: 4 }
    ]);
    const o = pack(q, "(a) \\(" + a + "(x+" + h + ")^{2}" + add(qv) + "\\). (b) \\(k=" + nstr(-h) + "\\). (c) \\(f^{-1}(x)=" + nstr(-h) + "-\\sqrt{\\dfrac{x" + (qv > 0 ? "-" : "+") + nstr(Math.abs(qv)) + "}{" + a + "}}\\), domain \\(x\\ge" + qv + "\\).", [
      R("(a)", "\\(" + a + "(x^2+" + (2 * h) + "x)" + add(C) + "\\)", "M1", "factor a"),
      R("(a)", "\\(" + a + "((x+" + h + ")^{2}-" + (h * h) + ")" + add(C) + "\\)", "M1", "square"),
      R("(a)", "\\(" + a + "(x+" + h + ")^{2}" + add(qv) + "\\)", "A1", "form"),
      R("(b)", "vertex \\(x=" + nstr(-h) + "\\); decreasing for \\(x\\le" + nstr(-h) + "\\)", "M1", "one-one left"),
      R("(b)", "greatest \\(k=" + nstr(-h) + "\\)", "A1", "k"),
      R("(c)", "\\(x=" + nstr(-h) + "-\\sqrt{(" + par("y", qv).slice(1, -1) + ")/" + a + "}\\)", "M1", "left branch"),
      R("(c)", "\\(f^{-1}(x)=" + nstr(-h) + "-\\sqrt{\\dfrac{x" + (qv > 0 ? "-" : "+") + nstr(Math.abs(qv)) + "}{" + a + "}}\\)", "A1", "inverse"),
      R("(c)", "domain \\(x\\ge" + qv + "\\)", "A1", "domain"),
      R("(c)", "range of inverse is \\(x\\le" + nstr(-h) + "\\)", "A1", "range")
    ], 9);
            o._chk = { v: Math.abs(a * (-h) * (-h) + B * (-h) + C - qv) < 1e-9 };
    return o;
  };

  G["AS-4-0"] = function (r) {
    const p = until(r, () => {
      const h = pick(r, [-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]), k = pick(r, [-5, -4, -3, -2, -1, 1, 2, 3, 4]);
      const rad = pick(r, [4, 9, 16, 25, 36, 49]);
      const F = h * h + k * k - rad;
      if (F === 0) return;
      return { h, k, rad, F };
    });
    const q = "Find the centre and radius of the circle \\(" + circEq(2 * p.h, 2 * p.k, p.F) + "\\)." + pt("", 3);
    const o = pack(q, "\\(" + par("x", -p.h) + "^2+" + par("y", -p.k) + "^2=" + p.rad + "\\): centre \\((" + nstr(-p.h) + "," + nstr(-p.k) + ")\\), radius \\(" + surd(p.rad) + "\\).", [
      R("", "complete the square in \\(x\\) and \\(y\\)", "M1", "complete square"),
      R("", "centre \\((" + nstr(-p.h) + "," + nstr(-p.k) + ")\\)", "A1", "centre"),
      R("", "radius \\(" + surd(p.rad) + "\\)", "A1", "radius")
    ], 3);
    o._chk = { r2: p.h * p.h + p.k * p.k - p.F === p.rad };
    return o;
  };

  G["AS-4-1"] = function (r) {
    const p = until(r, () => {
      const x1 = ir(r, -6, -1), y1 = ir(r, -2, 4), dx = pick(r, [6, 8, 10]), dy = pick(r, [6, 8]);
      const x2 = x1 + dx, y2 = y1 + dy;
      const len = Math.hypot(dx, dy);
      if (!Number.isInteger(len)) return;
      return { x1, y1, x2, y2, mx: (x1 + x2) / 2, my: (y1 + y2) / 2, r: len / 2, len };
    });
    const q = "The points \\(A(" + p.x1 + "," + p.y1 + ")\\) and \\(B(" + p.x2 + "," + p.y2 + ")\\) are the ends of a diameter of a circle. Find the equation of the circle." + pt("", 3);
    const o = pack(q,       "Centre \\((" + nstr(p.mx) + "," + nstr(p.my) + ")\\), \\(AB=" + p.len + "\\), \\(r=" + p.r + "\\): \\(" + par("x", p.mx) + "^2+" + par("y", p.my) + "^2=" + (p.r * p.r) + "\\).", [
      R("", "midpoint \\((" + nstr(p.mx) + "," + nstr(p.my) + ")\\)", "M1", "centre"),
      R("", "\\(r=" + p.r + "\\)", "A1", "radius"),
      R("", "\\(" + par("x", p.mx) + "^2+" + par("y", p.my) + "^2=" + (p.r * p.r) + "\\)", "A1", "equation")
    ], 3);
    o._chk = { diam: Math.abs(Math.hypot(p.x2 - p.x1, p.y2 - p.y1) - 2 * p.r) < 1e-9 };
    return o;
  };

  G["AS-4-2"] = function (r) {
    const p = until(r, () => {
      const h = ir(r, 1, 4), k = ir(r, 1, 4), m = 1, c = ir(r, 1, 5);
      const A = 1 + m * m, B = 2 * ((c - k) * m - h), C = h * h + (c - k) ** 2 - 0;
      const r2 = pick(r, [8, 10, 13, 18, 20, 25]);
      const Cc = h * h + (c - k) ** 2 - r2;
      const D = B * B - 4 * A * Cc;
      if (D <= 0 || Math.abs(Math.sqrt(D) - Math.round(Math.sqrt(D))) > 1e-9) return;
      const sd = Math.sqrt(D);
      if ((-B + sd) % (2 * A) || (-B - sd) % (2 * A)) return;
      const x1 = (-B + sd) / (2 * A), x2 = (-B - sd) / (2 * A);
      const y1 = m * x1 + c, y2 = m * x2 + c;
      const chord = Math.hypot(x1 - x2, y1 - y2);
      return { h, k, c, r2, x1, y1, x2, y2, chord };
    });
    const q = "The line \\(y=x+" + p.c + "\\) meets the circle \\(" + par("x", p.h) + "^2+" + par("y", p.k) + "^2=" + p.r2 + "\\) at \\(A\\) and \\(B\\)." + partsQ("", [
      { b: "a", t: "Find the coordinates of \\(A\\) and \\(B\\).", m: 4 },
      { b: "b", t: "Find the exact length of the chord \\(AB\\).", m: 1 }
    ]);
    const ch2 = Math.round(p.chord * p.chord);
    const o = pack(q, "(a) \\(A(" + nstr(p.x1) + "," + nstr(p.y1) + ")\\), \\(B(" + nstr(p.x2) + "," + nstr(p.y2) + ")\\). (b) \\(AB=" + surd(ch2) + "\\).", [
      R("(a)", "\\(y=x+" + p.c + "\\) into the circle", "M1", "substitute"),
      R("(a)", "quadratic in \\(x\\)", "M1", "expand"),
      R("(a)", "\\(x=" + nstr(p.x1) + "," + nstr(p.x2) + "\\)", "A1", "x"),
      R("(a)", "\\(A(" + nstr(p.x1) + "," + nstr(p.y1) + ")\\), \\(B(" + nstr(p.x2) + "," + nstr(p.y2) + ")\\)", "A1", "points"),
      R("(b)", "\\(AB=" + surd(ch2) + "\\)", "B1", "length")
    ], 5);
    o._chk = { on: Math.abs((p.x1 - p.h) ** 2 + (p.y1 - p.k) ** 2 - p.r2) < 1e-6, exact: Math.abs(p.chord * p.chord - ch2) < 1e-6 };
    return o;
  };

  G["AS-4-3"] = function (r) {
    const p = until(r, () => {
      const cx = ir(r, 1, 6), cy = pick(r, [-4, -3, -2, -1, 1, 2, 3]);
      const gx = pick(r, [2, 3, 4, 5, 6]), gy = pick(r, [-6, -5, -4, -3, 3, 4, 5, 6]);
      if (gcd(gx, gy) !== 1) return;
      const px = cx + gx, py = cy + gy;
      if (py === 0) return;
      const r2 = gx * gx + gy * gy;
      let a = gx, b = gy, c0 = -(gx * px + gy * py);
      const g2 = gcd(gcd(Math.abs(a), Math.abs(b)), Math.abs(c0)) || 1;
      a /= g2; b /= g2; c0 /= g2;
      if (a < 0) { a = -a; b = -b; c0 = -c0; }
      if (a === 0) return;
      const Qx = -c0 / a;
      if (!Number.isInteger(Qx) || Qx === 0) return;
      const radg = gy / gx, tg = -gx / gy;
      if (!Number.isFinite(tg)) return;
      return { cx, cy, px, py, r2, a, b, c0, Qx, radg, tg };
    });
    const line = axbyc(p.a, p.b, p.c0);
    const q = "A circle has centre \\(C(" + p.cx + "," + p.cy + ")\\) and passes through \\(P(" + p.px + "," + p.py + ")\\)." + partsQ("", [
      { b: "a", t: "Find the equation of the circle.", m: 2 },
      { b: "b", t: "Find the equation of the tangent at \\(P\\), in the form \\(ax+by+c=0\\).", m: 3 },
      { b: "c", t: "The tangent meets the \\(x\\)-axis at \\(Q\\). Find the coordinates of \\(Q\\).", m: 1 }
    ]);
    const o = pack(q, "(a) \\(" + par("x", p.cx) + "^2+" + par("y", p.cy) + "^2=" + p.r2 + "\\). (b) \\(" + line + "\\). (c) \\(Q(" + nstr(p.Qx) + ",0)\\).", [
      R("(a)", "\\(r^2=" + p.r2 + "\\)", "M1", "radius"),
      R("(a)", "\\(" + par("x", p.cx) + "^2+" + par("y", p.cy) + "^2=" + p.r2 + "\\)", "A1", "circle"),
      R("(b)", "radius gradient \\(" + frac(p.py - p.cy, p.px - p.cx) + "\\)", "M1", "radius"),
      R("(b)", "tangent gradient negative reciprocal", "M1", "perp"),
      R("(b)", "\\(" + line + "\\)", "A1", "tangent"),
      R("(c)", "\\(Q(" + nstr(p.Qx) + ",0)\\)", "B1", "Q")
    ], 6);
    o._chk = {
      t: p.a * p.px + p.b * p.py + p.c0 === 0,
      perp: p.a * (p.py - p.cy) - p.b * (p.px - p.cx) === 0,
      Q: p.a * p.Qx + p.c0 === 0
    };
    return o;
  };

  G["AS-4-4"] = function (r) {
    const p = until(r, () => {
      const pairs = [[5, 2], [8, 1], [10, 3], [18, 1], [20, 2], [50, 1], [45, 2], [4, 0]];
      const hk = pick(r, [[1, 2], [2, 1], [3, 2], [4, 1], [2, 3], [5, 2], [1, 4], [3, 1]]);
      const pr = pick(r, pairs);
      const h = hk[0], k = hk[1], r2 = pr[0], m = pr[1];
      if (m === 0) return;
      const root = Math.sqrt(r2 * (m * m + 1));
      if (Math.abs(root - Math.round(root)) > 1e-9) return;
      const F = h * h + k * k - r2;
      if (F === 0) return;
      const c1 = k - m * h + root, c2 = k - m * h - root;
      if (![c1, c2].every(Number.isInteger)) return;
      const cl = Math.max(c1, c2);
      const x = (m * (k - cl) + h) / (m * m + 1);
      const y = m * x + cl;
      return { h, k, r2, m, c1, c2, cl, x, y, F };
    });
    const q = "A circle has equation \\(" + circEq(-2 * p.h, -2 * p.k, p.F) + "\\)." + partsQ("", [
      { b: "a", t: "Find the centre and the exact radius of the circle.", m: 3 },
      { b: "b", t: "The line \\(y=" + kx(p.m) + "+c\\) is a tangent to the circle. Find the two possible values of \\(c\\).", m: 5 },
      { b: "c", t: "For the larger value of \\(c\\), find the coordinates of the point of contact.", m: 2 }
    ]);
    const o = pack(q, "(a) centre \\((" + p.h + "," + p.k + ")\\), radius \\(" + surd(p.r2) + "\\). (b) \\(c=" + nstr(p.c1) + "\\) or \\(" + nstr(p.c2) + "\\). (c) \\((" + nstr(p.x) + "," + nstr(p.y) + ")\\).", [
      R("(a)", "complete the square", "M1", "complete"),
      R("(a)", "centre \\((" + p.h + "," + p.k + ")\\)", "A1", "centre"),
      R("(a)", "radius \\(" + surd(p.r2) + "\\)", "A1", "radius"),
      R("(b)", "substitute \\(y=" + kx(p.m) + "+c\\)", "M1", "sub"),
      R("(b)", "quadratic in \\(x\\)", "M1", "expand"),
      R("(b)", "\\(D=0\\)", "M1", "tangent"),
      R("(b)", "\\(c=" + nstr(p.c1) + "\\)", "A1", "one c"),
      R("(b)", "\\(c=" + nstr(p.c2) + "\\)", "A1", "other c"),
      R("(c)", "\\(x=" + nstr(p.x) + "\\), point \\((" + nstr(p.x) + "," + nstr(p.y) + ")\\)", "A2", "contact")
    ], 10);
    o._chk = {
      intc: Number.isInteger(p.c1) && Number.isInteger(p.c2),
      on: Math.abs((p.x - p.h) ** 2 + (p.y - p.k) ** 2 - p.r2) < 1e-6
    };
    return o;
  };

  function grp(r, ncls) {
    return until(r, () => {
      const edges = [0];
      let e = 0;
      for (let i = 0; i < ncls; i++) { e += pick(r, [4, 10, 20]); edges.push(e); }
      const f = [];
      let n = 0;
      for (let i = 0; i < ncls; i++) { const fi = ir(r, 4, 18); f.push(fi); n += fi; }
      if (n < 20 || n > 80) return;
      const mids = [], w = [];
      for (let i = 0; i < ncls; i++) { w.push(edges[i + 1] - edges[i]); mids.push((edges[i] + edges[i + 1]) / 2); }
      let sfx = 0, sfx2 = 0;
      for (let i = 0; i < ncls; i++) { sfx += f[i] * mids[i]; sfx2 += f[i] * mids[i] * mids[i]; }
      const mean = sfx / n, sd = Math.sqrt(sfx2 / n - mean * mean);
      const dens = f.map((fi, i) => fi / w[i]);
      let mi = 0; dens.forEach((d, i) => { if (d > dens[mi]) mi = i; });
      if (dens.filter((d) => Math.abs(d - dens[mi]) < 1e-12).length !== 1) return;
      return { edges, f, n, mids, w, sfx, sfx2, mean, sd, dens, mi };
    });
  }

  G["AS-5-0"] = function (r) {
    const n = pick(r, [40, 50, 60]);
    const mean = pick(r, [20, 24, 25, 30, 32]);
    const sfx = n * mean;
    const v = pick(r, [16, 25, 36, 49, 64]);
    const sfx2 = n * (v + mean * mean);
    const q = "For a set of grouped data, \\(\\sum f=" + n + "\\), \\(\\sum fx=" + sfx + "\\) and \\(\\sum fx^2=" + thin(sfx2) + "\\), where \\(x\\) are the mid-points. Estimate the mean and the standard deviation." + pt("", 3);
    const o = pack(q, "\\(\\bar x=" + nstr(mean) + "\\); \\(\\sigma=\\sqrt{" + nstr(sfx2 / n) + "-" + nstr(mean * mean) + "}=" + nstr(Math.sqrt(v)) + "\\).", [
      R("", "\\(\\bar x=" + sfx + "\\div" + n + "=" + nstr(mean) + "\\)", "B1", "mean"),
      R("", "\\(\\sigma=\\sqrt{" + nstr(sfx2 / n) + "-" + nstr(mean * mean) + "}\\)", "M1", "formula"),
      R("", "\\(" + nstr(Math.sqrt(v)) + "\\)", "A1", "sd")
    ], 3);
    o._chk = { v: Math.abs(sfx2 / n - mean * mean - v) < 1e-9 };
    return o;
  };

  G["AS-5-1"] = function (r) {
    const g = grp(r, 4);
    const hs = ["Mass \\(m\\)"].concat(g.edges.slice(0, -1).map((e, i) => "\\(" + e + "\\le m<" + g.edges[i + 1] + "\\)"));
    const cells = ["Frequency"].concat(g.f);
    const q = "The masses, \\(m\\) kg, of " + g.n + " parcels are shown." + ftab(hs, cells) + partsQ("", [
      { b: "a", t: "Calculate an estimate of the mean mass.", m: 2 },
      { b: "b", t: "Find the modal class.", m: 2 }
    ]);
    const o = pack(q, "(a) mid-points " + g.mids.join(", ") + "; \\(\\sum fx=" + decn(g.sfx) + "\\); mean \\(" + nice(g.mean) + "\\) kg. (b) modal class \\(" + g.edges[g.mi] + "\\le m<" + g.edges[g.mi + 1] + "\\).", [
      R("(a)", "mid-points \\(" + g.mids.map(decn).join(",") + "\\)", "M1", "mids"),
      R("(a)", "mean \\(" + nice(g.mean) + "\\) kg", "A1", "mean"),
      R("(b)", "densities \\(" + g.dens.map((d) => decn(d)).join(",") + "\\)", "M1", "density"),
      R("(b)", "modal class \\(" + g.edges[g.mi] + "\\le m<" + g.edges[g.mi + 1] + "\\)", "A1", "modal")
    ], 4);
    o._chk = { n: g.f.reduce((a, b) => a + b, 0) === g.n, modal: g.dens.filter((d) => Math.abs(d - g.dens[g.mi]) < 1e-12).length === 1 };
    return o;
  };

  G["AS-5-2"] = function (r) {
    const g = grp(r, 4);
    const hs = ["Score"].concat(g.edges.slice(0, -1).map((e, i) => e + "–" + (g.edges[i + 1] - 1)));
    const cells = ["Frequency"].concat(g.f);
    const q = "The scores (whole numbers) of " + g.n + " players are shown. Calculate estimates of the mean and the standard deviation." + ftab(hs, cells) + pt("", 5);
    const mids = g.edges.slice(0, -1).map((e, i) => (e + g.edges[i + 1] - 1) / 2);
    let sfx = 0, sfx2 = 0;
    mids.forEach((m, i) => { sfx += g.f[i] * m; sfx2 += g.f[i] * m * m; });
    const mean = sfx / g.n, sd = Math.sqrt(sfx2 / g.n - mean * mean);
    const o = pack(q, "Mid-points " + mids.join(", ") + "; \\(\\sum fx=" + decn(sfx) + "\\); mean \\(" + sf(mean) + "\\); \\(\\sigma=" + sf(sd) + "\\).", [
      R("", "continuous mid-points \\(" + mids.map(decn).join(",") + "\\)", "M1", "mids"),
      R("", "\\(\\sum fx=" + decn(sfx) + "\\)", "M1", "sum"),
      R("", "mean \\(" + sf(mean) + "\\)", "A1", "mean"),
      R("", "\\(\\sum fx^2=" + decn(sfx2) + "\\)", "M1", "sum sq"),
      R("", "\\(\\sigma=" + sf(sd) + "\\)", "A1", "sd")
    ], 5);
    o._chk = { sd: sd > 0 };
    return o;
  };

  G["AS-5-3"] = function (r) {
    const p = until(r, () => {
      const edges = [0, 20, 30, 50, 80];
      const f0 = ir(r, 8, 14), f2 = ir(r, 12, 18), f3 = ir(r, 4, 8);
      const mids = [10, 25, 40, 65];
      const mean = 30;
      const sKnown = f0 * mids[0] + f2 * mids[2] + f3 * mids[3];
      const nKnown = f0 + f2 + f3;
      const pval = (mean * nKnown - sKnown) / (mids[1] - mean);
      if (pval <= 4 || !Number.isInteger(pval)) return;
      const f = [f0, pval, f2, f3], n = nKnown + pval;
      let sfx2 = 0; f.forEach((fi, i) => { sfx2 += fi * mids[i] * mids[i]; });
      const sd = Math.sqrt(sfx2 / n - mean * mean);
      const w = [20, 10, 20, 30];
      const dens = f.map((fi, i) => fi / w[i]);
      let mi = 0; dens.forEach((d, i) => { if (d > dens[mi]) mi = i; });
      if (dens.filter((d) => Math.abs(d - dens[mi]) < 1e-12).length !== 1) return;
      return { f, n, pval, sfx2, sd, dens, mi, edges, mids, mean };
    });
    const hs = ["\\(x\\)"].concat(p.edges.slice(0, -1).map((e, i) => "\\(" + e + "\\le x<" + p.edges[i + 1] + "\\)"));
    const cells = ["Frequency", p.f[0], "\\(p\\)", p.f[2], p.f[3]];
    const q = "The estimated mean of the data below is " + p.mean + "." + ftab(hs, cells) + partsQ("", [
      { b: "a", t: "Find \\(p\\).", m: 3 },
      { b: "b", t: "Estimate the standard deviation.", m: 2 },
      { b: "c", t: "Find the modal class.", m: 1 }
    ]);
    const o = pack(q, "(a) \\(p=" + p.pval + "\\). (b) \\(\\sigma=" + sf(p.sd) + "\\). (c) \\(" + p.edges[p.mi] + "\\le x<" + p.edges[p.mi + 1] + "\\).", [
      R("(a)", "\\(\\dfrac{" + (p.f[0] * p.mids[0] + p.f[2] * p.mids[2] + p.f[3] * p.mids[3]) + "+25p}{" + (p.n - p.pval) + "+p}=" + p.mean + "\\)", "M1", "mean eqn"),
      R("(a)", "solve for \\(p\\)", "M1", "rearrange"),
      R("(a)", "\\(p=" + p.pval + "\\)", "A1", "p"),
      R("(b)", "\\(\\sum fx^2=" + nstr(p.sfx2) + "\\)", "M1", "sum sq"),
      R("(b)", "\\(\\sigma=" + sf(p.sd) + "\\)", "A1", "sd"),
      R("(c)", "modal class \\(" + p.edges[p.mi] + "\\le x<" + p.edges[p.mi + 1] + "\\)", "B1", "modal")
    ], 6);
    o._chk = { p: p.pval > 0, modal: p.dens.filter((d) => Math.abs(d - p.dens[p.mi]) < 1e-12).length === 1 };
    return o;
  };

  G["AS-5-4"] = function (r) {
    const g = grp(r, 4);
    const hs = ["Mass \\(m\\)"].concat(g.edges.slice(0, -1).map((e, i) => "\\(" + e + "\\le m<" + g.edges[i + 1] + "\\)"));
    const cells = ["Frequency"].concat(g.f);
    const q = "The masses, \\(m\\) kg, of " + g.n + " bags of rice are shown." + ftab(hs, cells) + partsQ("", [
      { b: "a", t: "Calculate estimates of the mean and standard deviation of the masses.", m: 4 },
      { b: "b", t: "Find the modal class, showing your working.", m: 2 },
      { b: "c", t: "Explain why your answers in part (a) are only estimates.", m: 1 }
    ]);
    const o = pack(q, "(a) mean \\(" + sf(g.mean) + "\\) kg; \\(\\sigma=" + sf(g.sd) + "\\) kg. (b) modal class \\(" + g.edges[g.mi] + "\\le m<" + g.edges[g.mi + 1] + "\\). (c) Mid-points are used, not the actual masses.", [
      R("(a)", "mid-points \\(" + g.mids.map(decn).join(",") + "\\)", "M1", "mids"),
      R("(a)", "\\(\\sum fx=" + decn(g.sfx) + "\\)", "M1", "sum"),
      R("(a)", "\\(\\sum fx^2=" + decn(g.sfx2) + "\\)", "M1", "sum sq"),
      R("(a)", "mean \\(" + sf(g.mean) + "\\) kg; \\(\\sigma=" + sf(g.sd) + "\\) kg", "A1", "mean and sd"),
      R("(b)", "densities \\(" + g.dens.map((d) => decn(d)).join(",") + "\\)", "M1", "fd"),
      R("(b)", "modal class \\(" + g.edges[g.mi] + "\\le m<" + g.edges[g.mi + 1] + "\\)", "A1", "modal"),
      R("(c)", "mid-points are used, not the actual masses", "B1", "estimate")
    ], 7);
    o._chk = { n: g.n === g.f.reduce((a, b) => a + b, 0), modal: g.dens.filter((d) => Math.abs(d - g.dens[g.mi]) < 1e-12).length === 1 };
    return o;
  };

  G["AS-6-0"] = function (r) {
    const g = grp(r, 4);
    const fd = g.dens;
    const hs = ["Time \\(t\\) s"].concat(g.edges.slice(0, -1).map((e, i) => "\\(" + e + "\\le t<" + g.edges[i + 1] + "\\)"));
    const cells = ["Frequency"].concat(g.f);
    const q = "Calculate the frequency density for each class (the heights of the bars of a histogram)." + ftab(hs, cells) + pt("", 3);
    const o = pack(q, "\\(" + fd.map((d) => decn(d)).join(",\\ ") + "\\).", [
      R("", "frequency density \\(=f/\\text{width}\\)", "M1", "definition"),
      R("", "widths \\(" + g.w.join(",") + "\\)", "A1", "widths"),
      R("", "\\(" + fd.map((d) => decn(d)).join(",") + "\\)", "A1", "densities")
    ], 3);
    o._chk = { fd: Math.abs(fd[0] * g.w[0] - g.f[0]) < 1e-9 };
    return o;
  };

  G["AS-6-1"] = function (r) {
    const p = until(r, () => {
      const edges = [0];
      let e = 0;
      const w = [];
      for (let i = 0; i < 5; i++) { const wi = pick(r, [5, 10, 20]); w.push(wi); e += wi; edges.push(e); }
      const fd = [];
      const f = [];
      for (let i = 0; i < 5; i++) {
        const d = pick(r, [0.5, 1, 1.5, 2, 2.4, 3, 4, 5.2]);
        const fi = d * w[i];
        if (!Number.isInteger(fi)) return;
        fd.push(d); f.push(fi);
      }
      const tot = f.reduce((a, b) => a + b, 0);
      if (tot < 40 || tot > 160) return;
      const cls = w.map((wi, i) => ({ lo: edges[i], hi: edges[i + 1] }));
      return { cls, fd, f, tot, xlab: "Time (s)" };
    });
    const svg = histBars(p.cls, p.fd, p.xlab);
    const q = 'The histogram shows the times taken by some people to finish a task. Find the number of people in each class and the total number of people.<div class="fig">' + svg + "</div>" + pt("", 3);
    const o = pack(q, p.f.map((fi, i) => "\\(" + decn(p.fd[i]) + "\\times" + (p.cls[i].hi - p.cls[i].lo) + "=" + fi + "\\)").join(", ") + "; total \\(" + p.tot + "\\).", [
      R("", "frequency \\(=\\) density \\(\\times\\) width", "M1", "read"),
      R("", p.f.join(", "), "A1", "classes"),
      R("", "total \\(" + p.tot + "\\)", "A1", "total")
    ], 3);
    o._chk = { tot: p.f.reduce((a, b) => a + b, 0) === p.tot };
    return o;
  };

  G["AS-6-2"] = function (r) {
    const p = until(r, () => {
      const w = [5, 5, 10, 20];
      const h = [ir(r, 3, 6), ir(r, 4, 8), ir(r, 3, 6), ir(r, 2, 5)];
      const knownI = 1;
      const knownF = pick(r, [18, 24, 30, 36]);
      const unit = knownF / (w[knownI] * h[knownI]);
      if (Math.abs(unit * 10 - Math.round(unit * 10)) > 1e-9) return;
      const f = h.map((hi, i) => hi * w[i] * unit);
      if (!f.every((x) => Math.abs(x - Math.round(x)) < 1e-9)) return;
      const tot = f.reduce((a, b) => a + b, 0);
      const cls = [{ lo: 0, hi: 5 }, { lo: 5, hi: 10 }, { lo: 10, hi: 20 }, { lo: 20, hi: 40 }];
      return { w, h, knownF, unit, f: f.map(Math.round), tot, cls };
    });
    const svg = histBars(p.cls, p.h, "Length", { hideY: true });
    const q = 'The histogram shows the lengths of some leaves. The vertical scale is not labelled. There are ' + p.knownF + ' leaves in the class \\(5\\le x<10\\). Find the total number of leaves.<div class="fig">' + svg + "</div>" + pt("", 4);
    const o = pack(q, "scale \\(" + p.knownF + "\\div" + (p.w[1] * p.h[1]) + "=" + decn(p.unit) + "\\) leaves per unit; frequencies " + p.f.join(", ") + "; total \\(" + p.tot + "\\).", [
      R("", "areas proportional to frequency", "M1", "area"),
      R("", "known class gives the scale", "M1", "scale"),
      R("", "frequencies " + p.f.join(", "), "A1", "freq"),
      R("", "total \\(" + p.tot + "\\)", "A1", "total")
    ], 4);
    o._chk = { tot: p.f.reduce((a, b) => a + b, 0) === p.tot };
    return o;
  };

  G["AS-6-3"] = function (r) {
    const p = until(r, () => {
      const edges = [0, 4, 6, 10, 20];
      const f = [ir(r, 10, 16), ir(r, 14, 22), ir(r, 16, 24), ir(r, 8, 14)];
      const n = f.reduce((a, b) => a + b, 0);
      const a = 5, b = 12;
      const part = f[1] * (6 - a) / 2 + f[2] + f[3] * (b - 10) / 10;
      const wcm = 1, hcm = pick(r, [3, 4, 4.5, 5, 6]), wmin = 2, dens = f[1] / 2;
      const w4 = 10, wide = w4 / wmin * wcm, high = (f[3] / 10) / dens * hcm;
      return { edges, f, n, part, wide, high: Number(high.toFixed(2)), dens, hcm };
    });
    const hs = ["Time \\(t\\) min"].concat(p.edges.slice(0, -1).map((e, i) => "\\(" + e + "\\le t<" + p.edges[i + 1] + "\\)"));
    const q = "The waiting times of " + p.n + " customers are shown." + ftab(hs, ["Frequency"].concat(p.f)) + partsQ("", [
      { b: "a", t: "Estimate the number of customers who waited between 5 and 12 minutes.", m: 3 },
      { b: "b", t: "On a histogram, the bar for \\(4\\le t<6\\) is 1 cm wide and " + decn(p.hcm) + " cm high. Find the width and height of the bar for \\(10\\le t<20\\).", m: 2 }
    ]);
    const o = pack(q, "(a) \\(" + sf(p.part) + "\\). (b) width \\(" + decn(p.wide) + "\\) cm, height \\(" + decn(p.high) + "\\) cm.", [
      R("(a)", "half of class \\(4\\le t<6\\)", "M1", "split"),
      R("(a)", "all of \\(6\\le t<10\\) and \\(0.2\\) of last class", "M1", "parts"),
      R("(a)", "\\(" + sf(p.part) + "\\)", "A1", "estimate"),
      R("(b)", "10 min \\(\\leftrightarrow\\) " + decn(p.wide) + " cm wide", "B1", "width"),
      R("(b)", "height \\(" + decn(p.high) + "\\) cm", "B1", "height")
    ], 5);
    o._chk = { n: p.n === p.f.reduce((a, b) => a + b, 0) };
    return o;
  };

  G["AS-6-4"] = function (r) {
    const p = until(r, () => {
      const edges = [0, 10, 20, 30, 35, 50];
      const w = [10, 10, 10, 5, 15];
      const f = [ir(r, 8, 16), ir(r, 16, 26), ir(r, 18, 28), ir(r, 12, 22), 0];
      f[4] = 100 - f[0] - f[1] - f[2] - f[3];
      if (f[4] < 8 || f[4] > 30) return;
      const tot = 100;
      const fd = f.map((fi, i) => fi / w[i]);
      if (!fd.every((d) => Math.abs(d * 10 - Math.round(d * 10)) < 1e-9)) return;
      const cut = 32;
      const more = fd[3] * (35 - cut) + f[4];
      const med = 20 + (50 - (f[0] + f[1])) / f[2] * 10;
      if (f[0] + f[1] >= 50 || f[0] + f[1] + f[2] < 50) return;
      const cls = edges.slice(0, -1).map((e, i) => ({ lo: e, hi: edges[i + 1] }));
      return { cls, fd, f, tot, more, med, edges };
    });
    const svg = histBars(p.cls, p.fd, "Mass (kg)");
    const q = 'The histogram shows the masses of ' + p.tot + ' dogs.<div class="fig">' + svg + "</div>" + partsQ("", [
      { b: "a", t: "Find the frequency for each class.", m: 3 },
      { b: "b", t: "Estimate the number of dogs with mass more than 32 kg.", m: 3 },
      { b: "c", t: "Estimate the median mass.", m: 3 }
    ]);
    const o = pack(q, "(a) " + p.f.join(", ") + ". (b) \\(" + nice(p.more) + "\\). (c) \\(" + nice(p.med) + "\\) kg.", [
      R("(a)", "frequency \\(=\\) density \\(\\times\\) width", "M1", "read"),
      R("(a)", p.f.slice(0, 3).join(", "), "A1", "first"),
      R("(a)", p.f.slice(3).join(", "), "A1", "rest"),
      R("(b)", "from 32 to 35 in the 30–35 class", "M1", "split"),
      R("(b)", "add the last class", "M1", "add"),
      R("(b)", "\\(" + nice(p.more) + "\\)", "A1", "estimate"),
      R("(c)", "50th value in 20–30 class", "M1", "locate"),
      R("(c)", "interpolation", "M1", "interp"),
      R("(c)", "\\(" + nice(p.med) + "\\) kg", "A1", "median")
    ], 9);
    o._chk = { tot: p.f.reduce((a, b) => a + b, 0) === 100, med: p.med >= 20 && p.med <= 30 };
    return o;
  };

  G["AS-7-0"] = function (r) {
    const p = until(r, () => {
      const n = 11;
      const xs = [];
      let v = ir(r, 10, 16);
      for (let i = 0; i < n; i++) { v += ir(r, 2, 6); xs.push(v); }
      const med = qtile(xs, 0.5), q1 = qtile(xs, 0.25), q3 = qtile(xs, 0.75);
      if (![med, q1, q3].every(Number.isInteger)) return;
      const stems = {};
      xs.forEach((x) => { const s = Math.floor(x / 10); (stems[s] = stems[s] || []).push(x % 10); });
      const rows = Object.keys(stems).map(Number).sort((a, b) => a - b).map((s) => ({ s, l: stems[s] }));
      return { xs, med, q1, q3, iqr: q3 - q1, rows };
    });
    const q = "Find the median, quartiles and interquartile range." + stemTab(p.rows, "1 | 2 means 12") + pt("", 3);
    const o = pack(q, "\\(n=11\\): median \\(" + p.med + "\\); \\(Q_1=" + p.q1 + "\\), \\(Q_3=" + p.q3 + "\\); IQR \\(" + p.iqr + "\\).", [
      R("", "\\(n=11\\), median 6th value \\(" + p.med + "\\)", "B1", "median"),
      R("", "\\(Q_1=" + p.q1 + "\\), \\(Q_3=" + p.q3 + "\\)", "B1", "quartiles"),
      R("", "IQR \\(" + p.iqr + "\\)", "B1", "IQR")
    ], 3);
    o._chk = { order: p.xs[5] === p.med };
    return o;
  };

  G["AS-7-1"] = function (r) {
    const q1 = ir(r, 16, 24), iqr = ir(r, 8, 16), q3 = q1 + iqr;
    const loF = q1 - 1.5 * iqr, hiF = q3 + 1.5 * iqr;
    const small = Math.ceil(loF + ir(r, 1, 6)), large = Math.round(hiF + ir(r, 1, 8));
    const q = "For a data set, \\(Q_1=" + q1 + "\\), \\(Q_3=" + q3 + "\\), the smallest value is " + small + " and the largest value is " + large + ". Determine whether there are any outliers." + pt("", 3);
    const o = pack(q, "IQR \\(" + iqr + "\\); fences \\(" + decn(loF) + "\\) and \\(" + decn(hiF) + "\\). " + (small < loF ? small + " is an outlier" : small + " is not an outlier") + "; " + (large > hiF ? large + " is an outlier" : large + " is not an outlier") + ".", [
      R("", "IQR \\(" + iqr + "\\)", "B1", "IQR"),
      R("", "fences \\(" + decn(loF) + "\\) and \\(" + decn(hiF) + "\\)", "M1", "1.5 IQR"),
      R("", (large > hiF ? large + " is an outlier" : "no high outlier") + (small < loF ? "; " + small + " is an outlier" : ""), "A1", "conclusion")
    ], 3);
    o._chk = { fence: Math.abs(hiF - (q3 + 1.5 * iqr)) < 1e-9 };
    return o;
  };

  G["AS-7-2"] = function (r) {
    const p = until(r, () => {
      const n = 16;
      const xs = [];
      xs.push(ir(r, 2, 6));
      let v = ir(r, 18, 24);
      for (let i = 1; i < n; i++) { v += ir(r, 1, 3); xs.push(v); }
      xs.sort((a, b) => a - b);
      const qh = medHalves(xs);
      const med = qh.med, q1 = qh.q1, q3 = qh.q3, iqr = qh.iqr;
      const loF = q1 - 1.5 * iqr, hiF = q3 + 1.5 * iqr;
      const outs = xs.filter((x) => x < loF || x > hiF);
      if (outs.length !== 1) return;
      const w0 = xs.find((x) => x >= loF), w1 = [...xs].reverse().find((x) => x <= hiF);
      return { xs, med, q1, q3, iqr, loF, hiF, outs, w0, w1 };
    });
    const q = "The times (seconds) of 16 runners are:<br/>    " + p.xs.join(", ") + partsQ("", [
      { b: "a", t: "Find the median and quartiles.", m: 3 },
      { b: "b", t: "Determine whether there are any outliers.", m: 2 },
      { b: "c", t: "Draw a box plot to show the data.", m: 2 }
    ]);
    const o = pack(q, "(a) median \\(" + decn(p.med) + "\\), \\(Q_1=" + decn(p.q1) + "\\), \\(Q_3=" + decn(p.q3) + "\\). (b) IQR \\(" + decn(p.iqr) + "\\); outlier \\(" + p.outs[0] + "\\). (c) box from \\(" + decn(p.q1) + "\\) to \\(" + decn(p.q3) + "\\), median \\(" + decn(p.med) + "\\), whiskers to " + p.w0 + " and " + p.w1 + ", outlier at " + p.outs[0] + ".", [
      R("(a)", "median \\(" + decn(p.med) + "\\)", "B1", "median"),
      R("(a)", "\\(Q_1=" + decn(p.q1) + "\\)", "B1", "Q1"),
      R("(a)", "\\(Q_3=" + decn(p.q3) + "\\)", "B1", "Q3"),
      R("(b)", "IQR \\(" + decn(p.iqr) + "\\), fences \\(" + decn(p.loF) + "\\) and \\(" + decn(p.hiF) + "\\)", "M1", "fences"),
      R("(b)", "outlier \\(" + p.outs[0] + "\\)", "A1", "outlier"),
      R("(c)", "box from \\(" + decn(p.q1) + "\\) to \\(" + decn(p.q3) + "\\) with median \\(" + decn(p.med) + "\\), whiskers to " + p.w0 + " and " + p.w1 + ", cross at " + p.outs[0], "M1", "box"),
      R("(c)", "correct box plot", "A1", "plot")
    ], 7);
    o._chk = { one: p.outs.length === 1, halves: Math.abs(p.q1 - medHalves(p.xs).q1) < 1e-9 };
    return o;
  };

  G["AS-7-3"] = function (r) {
    const p = until(r, () => {
      function sample() {
        const n = 11, xs = [];
        let v = ir(r, 32, 42);
        for (let i = 0; i < n; i++) { v += ir(r, 2, 6); xs.push(v); }
        return xs;
      }
      const A = sample(), B = sample();
      const mA = qtile(A, 0.5), mB = qtile(B, 0.5);
      const q1A = qtile(A, 0.25), q3A = qtile(A, 0.75);
      const q1B = qtile(B, 0.25), q3B = qtile(B, 0.75);
      if (![mA, mB, q1A, q3A, q1B, q3B].every(Number.isInteger)) return;
      if (mA === mB) return;
      function rows(xs) {
        const st = {};
        xs.forEach((x) => { const s = Math.floor(x / 10); (st[s] = st[s] || []).push(x % 10); });
        return st;
      }
      return { A, B, mA, mB, q1A, q3A, q1B, q3B, iA: q3A - q1A, iB: q3B - q1B, stA: rows(A), stB: rows(B) };
    });
    const stems = [...new Set([...Object.keys(p.stA), ...Object.keys(p.stB)].map(Number))].sort((a, b) => a - b);
    const html = '<table class="sl"><tr><td style="text-align:right;font-family:Arial;font-weight:bold">Class A</td><td></td><td style="font-family:Arial;font-weight:bold">Class B</td></tr>' +
      stems.map((s) => {
        const la = (p.stA[s] || []).slice().sort((a, b) => b - a).join("  ");
        const lb = (p.stB[s] || []).slice().sort((a, b) => a - b).join("  ");
        return '<tr><td style="text-align:right">' + la + '</td><td class="st">' + s + "</td><td>" + lb + "</td></tr>";
      }).join("") + "</table>" +
      '<div style="margin-left:18px;font-size:9.5pt">Key: 1 | 4 | 6 means 41 for Class A and 46 for Class B</div>';
    const q = "The test marks of two classes, A and B, are shown." + html + partsQ("", [
      { b: "a", t: "Find the median and interquartile range for each class.", m: 4 },
      { b: "b", t: "Make two comparisons between the marks of the two classes.", m: 2 }
    ]);
    const cmpM = p.mA > p.mB ? "Class A has the higher median (" + p.mA + " against " + p.mB + "), so generally higher marks" : "Class B has the higher median (" + p.mB + " against " + p.mA + "), so generally higher marks";
    const cmpI = p.iA > p.iB ? "Class A has the larger IQR (" + p.iA + " against " + p.iB + "), so more spread" : p.iB > p.iA ? "Class B has the larger IQR (" + p.iB + " against " + p.iA + "), so more spread" : "both classes have the same IQR (" + p.iA + ")";
    const o = pack(q, "(a) A: median " + p.mA + ", IQR " + p.iA + ". B: median " + p.mB + ", IQR " + p.iB + ". (b) " + cmpM + "; " + cmpI + ".", [
      R("(a)", "A median \\(" + p.mA + "\\)", "B1", "A med"),
      R("(a)", "A IQR \\(" + p.iA + "\\)", "B1", "A IQR"),
      R("(a)", "B median \\(" + p.mB + "\\)", "B1", "B med"),
      R("(a)", "B IQR \\(" + p.iB + "\\)", "B1", "B IQR"),
      R("(b)", cmpM, "B1", "average"),
      R("(b)", cmpI, "B1", "spread")
    ], 6);
    o._chk = { iqr: p.iA === p.q3A - p.q1A };
    return o;
  };

  G["AS-7-4"] = function (r) {
    const p = until(r, () => {
      const n = 19, xs = [];
      let v = ir(r, 40, 70);
      for (let i = 0; i < n - 1; i++) { v += ir(r, 1, 5); xs.push(v); }
      xs.push(xs[xs.length - 1] + ir(r, 25, 45));
      xs.sort((a, b) => a - b);
      const qh = medHalves(xs);
      const med = qh.med, q1 = qh.q1, q3 = qh.q3;
      const iqr = q3 - q1, loF = q1 - 1.5 * iqr, hiF = q3 + 1.5 * iqr;
      const outs = xs.filter((x) => x < loF || x > hiF);
      if (outs.length !== 1) return;
      const w0 = xs.find((x) => x >= loF), w1 = [...xs].reverse().find((x) => x <= hiF);
      const stems = {};
      xs.forEach((x) => { const s = Math.floor(x / 10); (stems[s] = stems[s] || []).push(x % 10); });
      const smin = Math.min(...Object.keys(stems).map(Number)), smax = Math.max(...Object.keys(stems).map(Number));
      const rows = [];
      for (let s = smin; s <= smax; s++) rows.push({ s, l: stems[s] || [] });
      const mQ = med - ir(r, 4, 10), iQ = iqr + ir(r, 4, 10);
      return { xs, med, q1, q3, iqr, loF, hiF, outs, w0, w1, rows, mQ, iQ };
    });
    const q = "The times (seconds) taken by 19 students in Class P to solve a puzzle are shown." + stemTab(p.rows, "5 | 8 means 58 seconds") + partsQ("", [
      { b: "a", t: "Find the median and the quartiles.", m: 3 },
      { b: "b", t: "Show that there is exactly one outlier.", m: 3 },
      { b: "c", t: "Draw a box plot to show the data.", m: 3 },
      { b: "d", t: "In Class Q the median was " + p.mQ + " seconds and the IQR was " + p.iQ + " seconds. Compare the times of the two classes.", m: 2 }
    ]);
    const dMed = p.med > p.mQ ? "Class P has the higher median (" + p.med + " s against " + p.mQ + " s), so slower on average" : "Class Q has the higher median (" + p.mQ + " s against " + p.med + " s), so slower on average";
    const dI = p.iqr > p.iQ ? "Class P has the larger IQR (" + p.iqr + " against " + p.iQ + ")" : "Class Q has the larger IQR (" + p.iQ + " against " + p.iqr + ")";
    const o = pack(q, "(a) median " + p.med + ", \\(Q_1=" + p.q1 + "\\), \\(Q_3=" + p.q3 + "\\). (b) IQR " + p.iqr + ", fences " + decn(p.loF) + " and " + decn(p.hiF) + ", exactly one outlier " + p.outs[0] + ". (c) box " + p.q1 + " to " + p.q3 + ", whiskers " + p.w0 + " and " + p.w1 + ", outlier " + p.outs[0] + ". (d) " + dMed + "; " + dI + ".", [
      R("(a)", "median \\(" + p.med + "\\)", "B1", "median"),
      R("(a)", "\\(Q_1=" + p.q1 + "\\)", "B1", "Q1"),
      R("(a)", "\\(Q_3=" + p.q3 + "\\)", "B1", "Q3"),
      R("(b)", "IQR \\(" + p.iqr + "\\)", "M1", "IQR"),
      R("(b)", "fences \\(" + decn(p.loF) + "\\) and \\(" + decn(p.hiF) + "\\)", "M1", "fences"),
      R("(b)", "exactly one outlier \\(" + p.outs[0] + "\\)", "A1", "one outlier"),
      R("(c)", "box \\(" + p.q1 + "\\) to \\(" + p.q3 + "\\)", "B1", "box"),
      R("(c)", "whiskers \\(" + p.w0 + "\\) and \\(" + p.w1 + "\\)", "B1", "whiskers"),
      R("(c)", "outlier marked at \\(" + p.outs[0] + "\\)", "B1", "outlier"),
      R("(d)", dMed, "B1", "average"),
      R("(d)", dI, "B1", "spread")
    ], 11);
    o._chk = { one: p.outs.length === 1 };
    return o;
  };

  G["A2-0-0"] = function (r) {
    const p = until(r, () => {
      const a = ir(r, 2, 8), b = ir(r, 1, 7), c = 1, d = pick(r, [-9, -8, -7, -6, -5, -4, -3, 2, 3, 4, 5, 6, 7, 8]);
      const x1 = (d - b) / (a + c), x2 = (-d - b) / (a - c);
      if (a === c) return;
      if (![x1, x2].every(Number.isInteger)) return;
      if (x1 === x2) return;
      return { a, b, d, x1, x2 };
    });
    const inner = lin(1, -p.d);
    const q = "Solve the equation \\(|" + lin(p.a, p.b) + "|=|" + inner + "|\\).";
    const o = pack(q, "\\(x=" + p.x1 + "\\) or \\(x=" + p.x2 + "\\)", [
      R("", "\\(" + lin(p.a, p.b) + "=" + inner + "\\) or \\(" + lin(p.a, p.b) + "=-(" + inner + ")\\)", "M1", "cases"),
      R("", "\\(x=" + p.x1 + "\\)", "A1", "one"),
      R("", "\\(x=" + p.x2 + "\\)", "A1", "other")
    ], 3);
    o._chk = { eq: Math.abs(Math.abs(p.a * p.x1 + p.b) - Math.abs(p.x1 - p.d)) < 1e-9 };
    return o;
  };

  G["A2-0-1"] = function (r) {
    const p = until(r, () => {
      const h = ir(r, 2, 9), k = ir(r, 1, 6);
      const lo = -(h + k), hi = (h - k) / 3;
      if (hi <= lo) return;
      return { h, k, lo, hi };
    });
    const q = "Solve the inequality \\(|x-" + p.h + "|\\ge|2x+" + p.k + "|\\).";
    const mid = (p.lo + p.hi) / 2;
    const o = pack(q, "\\(" + nstr(p.lo) + "\\le x\\le " + nstr(p.hi) + "\\)", [
      R("", "square: \\((x-" + p.h + ")^2\\ge(2x+" + p.k + ")^2\\)", "M1", "boundaries"),
      R("", "\\((x+" + (p.h + p.k) + ")(3x" + nstr(p.k - p.h) + ")\\le0\\)", "M1", "factor"),
      R("", "critical values \\(x=" + nstr(p.lo) + "\\), \\(x=" + nstr(p.hi) + "\\)", "A1", "ends"),
      R("", "\\(" + nstr(p.lo) + "\\le x\\le " + nstr(p.hi) + "\\)", "A1", "set")
    ], 4);
    o._chk = {
      ends: Math.abs(Math.abs(p.lo - p.h) - Math.abs(2 * p.lo + p.k)) < 1e-8 && Math.abs(Math.abs(p.hi - p.h) - Math.abs(2 * p.hi + p.k)) < 1e-8,
      mid: Math.abs(mid - p.h) + 1e-9 >= Math.abs(2 * mid + p.k)
    };
    return o;
  };

  G["A2-0-2"] = function (r) {
    const p = until(r, () => {
      const h = ir(r, 1, 6), m = ir(r, 2, 5), k = ir(r, 3, 12);
      const ok = (h + k) / (m - 1), rej = (k - h) / (m + 1);
      if (Math.abs(ok) < 1e-9) return;
      if (m * ok - k < -1e-9) return;
      if (m * rej - k >= -1e-9 && Math.abs(Math.abs(rej + h) - (m * rej - k)) < 1e-9) return;
      if (Math.abs(Math.abs(ok + h) - (m * ok - k)) > 1e-9) return;
      return { h, m, k, ok, rej };
    });
    const q = "Solve the equation \\(|x+" + p.h + "|=" + p.m + "x-" + p.k + "\\).";
    const o = pack(q, "\\(x=" + nstr(p.ok) + "\\) (\\(x=" + nstr(p.rej) + "\\) rejected)", [
      R("", "RHS \\(\\ge0\\) so \\(x\\ge" + nstr(p.k / p.m) + "\\)", "M1", "domain"),
      R("", "\\(x=" + nstr(p.ok) + "\\) or \\(x=" + nstr(p.rej) + "\\)", "A1", "candidates"),
      R("", "reject \\(x=" + nstr(p.rej) + "\\); \\(x=" + nstr(p.ok) + "\\)", "A1", "check")
    ], 3);
    o._chk = { rhs: p.m * p.ok - p.k >= -1e-9, eq: Math.abs(Math.abs(p.ok + p.h) - (p.m * p.ok - p.k)) < 1e-8 };
    return o;
  };

  G["A2-0-3"] = function (r) {
    const p03 = until(r, () => {
    const a = ir(r, 3, 8), b = ir(r, 1, 4);
    const mid = (a - b) / 2;
    if (mid <= 0) return;
    const base = pick(r, [2, 3]);
    return { a, b, mid, base, xcut: Math.log(mid) / Math.log(base) };
    });
    const a = p03.a, b = p03.b, mid = p03.mid, base = p03.base, xcut = p03.xcut;
    const q = "(a) Solve the inequality \\(|u-" + a + "|<|u+" + b + "|\\). [3]<br/>(b) Hence solve the inequality \\(|" + base + "^x-" + a + "|<|" + base + "^x+" + b + "|\\), giving your answer correct to 3 significant figures. [2]";
    const o = pack(q, "(a) \\(u>" + nstr(mid) + "\\)   (b) \\(" + base + "^x>" + nstr(mid) + "\\Rightarrow x>" + nice(xcut) + "\\)", [
      R("(a)", "square or interpret as closer to " + a, "M1", "method"),
      R("(a)", "critical value \\(u=" + nstr(mid) + "\\)", "A1", "boundary"),
      R("(a)", "\\(u>" + nstr(mid) + "\\)", "A1", "inequality"),
      R("(b)", "\\(" + base + "^x>" + nstr(mid) + "\\)", "M1", "replace"),
      R("(b)", "\\(x>" + nice(xcut) + "\\)", "A1", "3 s.f.")
    ], 5);
    o._chk = { mid: Math.abs(Math.abs(mid - a) - Math.abs(mid + b)) < 1e-9 };
    return o;
  };

  G["A2-0-4"] = function (r) {
    const p = until(r, () => {
      const b = ir(r, 2, 8), c = ir(r, 3, 9);
      const lo = (b - c) > 0 ? (b - c) : (b - c) / 3;
      const hi = (b + c) / 3;
      if (hi - lo < 0.4) return;
      const mid = (lo + hi) / 2;
      if (!(Math.abs(2 * mid - b) < c - Math.abs(mid) - 1e-9)) return;
      if (c - Math.abs(lo) < -1e-9 || c - Math.abs(hi) < -1e-9) return;
      return { a: 2, b, c, lo, hi, v1: b / 2 };
    });
    const q = "(a) Sketch, on the same diagram, the graphs of \\(y=|" + p.a + "x-" + p.b + "|\\) and \\(y=" + p.c + "-|x|\\). [3]<br/>(b) Solve the inequality \\(|" + p.a + "x-" + p.b + "|<" + p.c + "-|x|\\). [4]";
    const o = pack(q, "(a) V at \\((" + nstr(p.v1) + ",0)\\); inverted V at \\((0," + p.c + ")\\). (b) \\(" + nstr(p.lo) + "<x<" + nstr(p.hi) + "\\)", [
      R("(a)", "vertex of \\(|" + p.a + "x-" + p.b + "|\\) at \\((" + nstr(p.v1) + ",0)\\)", "B1", "V"),
      R("(a)", "inverted V, vertex \\((0," + p.c + ")\\)", "B1", "inv V"),
      R("(a)", "intercepts shown", "B1", "axes"),
      R("(b)", "intersection of the graphs", "M1", "meet"),
      R("(b)", "solve on \\(x\\ge0\\) and \\(x<0\\)", "M1", "cases"),
      R("(b)", "end-points \\(" + nstr(p.lo) + "\\), \\(" + nstr(p.hi) + "\\)", "A1", "ends"),
      R("(b)", "\\(" + nstr(p.lo) + "<x<" + nstr(p.hi) + "\\)", "A1", "set")
    ], 7);
    o._chk = {
      order: p.lo < p.hi,
      ends: Math.abs(Math.abs(2 * p.lo - p.b) - (p.c - Math.abs(p.lo))) < 1e-8 && Math.abs(Math.abs(2 * p.hi - p.b) - (p.c - Math.abs(p.hi))) < 1e-8
    };
    return o;
  };

  G["A2-1-0"] = function (r) {
    const p0 = until(r, () => {
      const a = ir(r, 2, 9), b = ir(r, 2, 9), k = ir(r, 1, 5);
      if (a === b) return;
      const den = 2 * Math.log(a) - Math.log(b);
      if (Math.abs(den) < 1e-9) return;
      return { a, b, k, x: -k * Math.log(a) / den };
    });
    const a = p0.a, b = p0.b, k = p0.k, x = p0.x;
    const q = "Solve the equation \\(" + a + "^{2x+" + k + "}=" + b + "^{x}\\), giving your answer correct to 3 significant figures.";
    const o = pack(q, "\\(x=" + nice(x) + "\\)", [
      R("", "take ln: \\((2x+" + k + ")\\ln" + a + "=x\\ln" + b + "\\)", "M1", "ln"),
      R("", "\\(x(2\\ln" + a + "-\\ln" + b + ")=" + coff(-k, "\\ln" + a) + "\\)", "M1", "collect"),
      R("", "\\(x=" + nice(x) + "\\)", "A1", "3 s.f.")
    ], 3);
    o._chk = { pos: Math.abs(Math.pow(a, 2 * x + k) - Math.pow(b, x)) / Math.pow(b, x) < 1e-6 };
    return o;
  };

  G["A2-1-1"] = function (r) {
    const p = until(r, () => {
      const k = ir(r, 2, 40);
      const d = 1 + 2 * k;
      const x = 1 + Math.sqrt(d);
      if (x <= 0) return;
      return { k, x, d };
    });
    const q = "Solve the equation \\(2\\ln x=\\ln(x+" + p.k + ")+\\ln 2\\), giving your answer in exact form.";
    const xt = "1+" + surd(p.d);
    const o = pack(q, "\\(x=" + xt + "\\) (negative root rejected)", [
      R("", "\\(\\ln(x^2)=\\ln(2(x+" + p.k + "))\\)", "M1", "laws"),
      R("", "\\(x^2-2x-" + (2 * p.k) + "=0\\)", "M1", "quadratic"),
      R("", "\\(x=1\\pm" + surd(p.d) + "\\)", "A1", "roots"),
      R("", "reject negative; \\(x=" + xt + "\\)", "A1", "domain")
    ], 4);
    o._chk = { eq: Math.abs(2 * Math.log(p.x) - Math.log(p.x + p.k) - Math.log(2)) < 1e-8 };
    return o;
  };

  G["A2-1-2"] = function (r) {
    const p = until(r, () => {
      const a = pick(r, [2, 3, 4]), b = ir(r, 2, 9), c = pick(r, [4, 6, 8, 10, 12, 16, 18, 20, 24]);
      const D = b * b + 4 * a * c;
      const s = Math.sqrt(D);
      if (Math.abs(s - Math.round(s)) > 1e-9) return;
      const u = (b + s) / (2 * a);
      if (u <= 0) return;
      return { a, b, c, D, u };
    });
    const q = "Solve the equation \\(" + p.a + "e^{x}-" + p.b + "=" + p.c + "e^{-x}\\), giving your answer in exact form.";
    const o = pack(q, "\\(e^x=" + nstr(p.u) + "\\), \\(x=\\ln" + nstr(p.u) + "\\)", [
      R("", "multiply by \\(e^{x}\\)", "M1", "clear"),
      R("", "\\(" + p.a + "u^2-" + p.b + "u-" + p.c + "=0\\)", "M1", "quadratic"),
      R("", "\\(u=" + nstr(p.u) + "\\) (negative rejected)", "A1", "u"),
      R("", "\\(x=\\ln" + nstr(p.u) + "\\)", "A1", "exact")
    ], 4);
    o._chk = { u: p.u > 0 };
    return o;
  };

  G["A2-1-3"] = function (r) {
    const n = pick(r, [1.5, 2, 2.5, 3]);
    const x1 = pick(r, [0.4, 0.5, 0.8]), y1 = pick(r, [1.2, 2.0, 2.3]);
    const x2 = Number((x1 + pick(r, [1.2, 1.6, 2.0])).toFixed(1));
    const y2 = Number((y1 + n * (x2 - x1)).toFixed(1));
    const lnK = Number((y1 - n * x1).toFixed(2));
    const K = Math.exp(lnK);
    const yq = 100;
    const xq = Math.exp((Math.log(yq) - lnK) / n);
    const q = "The variables \\(x\\) and \\(y\\) satisfy \\(y=Kx^{n}\\). The graph of \\(\\ln y\\) against \\(\\ln x\\) is a straight line through \\((" + x1 + ",\\," + y1 + ")\\) and \\((" + x2 + ",\\," + y2 + ")\\).<br/>(a) Find \\(n\\) and \\(K\\). [3]<br/>(b) Find the value of \\(x\\) for which \\(y=100\\). [2]";
    const o = pack(q, "(a) \\(n=" + nstr(n) + "\\), \\(K=" + nice(K) + "\\)   (b) \\(x=" + nice(xq) + "\\)", [
      R("(a)", "gradient \\(n=\\dfrac{" + y2 + "-" + y1 + "}{" + x2 + "-" + x1 + "}=" + nstr(n) + "\\)", "M1", "gradient"),
      R("(a)", "\\(\\ln K=" + y1 + "-" + nstr(n) + "(" + x1 + ")=" + lnK + "\\)", "M1", "intercept"),
      R("(a)", "\\(K=" + nice(K) + "\\)", "A1", "K"),
      R("(b)", "\\(100=K x^{" + nstr(n) + "}\\)", "M1", "sub"),
      R("(b)", "\\(x=" + nice(xq) + "\\)", "A1", "x")
    ], 5);
    o._chk = { n: Math.abs((y2 - y1) / (x2 - x1) - n) < 1e-9 };
    return o;
  };

  G["A2-1-4"] = function (r) {
    const p = until(r, () => {
      const k = pick(r, [-1.2, -1, -0.8, -0.6, 0.4, 0.5, 0.8, 1.2]);
      const x1 = pick(r, [1, 2]), y1 = pick(r, [0.6, 0.8, 1.2, 1.5, 1.8, 2.15, 2.4]);
      const x2 = x1 + pick(r, [2, 3, 4, 5]);
      const y2 = y1 + (k / 2) * (x2 - x1);
      if (Math.abs(y1) < 1e-9 || Math.abs(y2) < 1e-9) return;
      const halfLnA = y1 - (k / 2) * x1;
      if (Math.abs(halfLnA) < 1e-9) return;
      const A = Math.exp(2 * halfLnA);
      const xq = -2 * halfLnA / k;
      return { k, x1, y1, x2, y2: Number(y2.toFixed(3)), halfLnA, A, xq };
    });
    const kt = decn(p.k);
    const q = "The variables \\(x\\) and \\(y\\) satisfy the equation \\(y^{2}=Ae^{kx}\\), where \\(A\\) and \\(k\\) are constants. The graph of \\(\\ln y\\) against \\(x\\) is a straight line passing through \\((" + p.x1 + ",\\," + p.y1 + ")\\) and \\((" + p.x2 + ",\\," + p.y2 + ")\\).<br/>(a) Show that \\(\\ln y=\\tfrac12\\ln A+\\tfrac12 kx\\). [1]<br/>(b) Find the values of \\(A\\) and \\(k\\), correct to 3 significant figures where appropriate. [4]<br/>(c) Find the value of \\(x\\) for which \\(y=1\\). [2]";
    const o = pack(q, "(a) take ln and halve   (b) \\(k=" + kt + "\\), \\(A=" + nice(p.A) + "\\)   (c) \\(x=" + nice(p.xq) + "\\)", [
      R("(a)", "\\(2\\ln y=\\ln A+kx\\) then divide by 2", "B1", "AG"),
      R("(b)", "gradient \\(=\\tfrac12 k=\\dfrac{" + p.y2 + "-" + p.y1 + "}{" + p.x2 + "-" + p.x1 + "}\\)", "M1", "gradient"),
      R("(b)", "\\(k=" + kt + "\\)", "A1", "k"),
      R("(b)", "intercept \\(\\tfrac12\\ln A=" + decn(p.halfLnA) + "\\)", "M1", "intercept"),
      R("(b)", "\\(A=" + nice(p.A) + "\\)", "A1", "A"),
      R("(c)", "\\(\\ln 1=\\tfrac12\\ln A+\\tfrac12 kx\\)", "M1", "y=1"),
      R("(c)", "\\(x=" + nice(p.xq) + "\\)", "A1", "x")
    ], 7);
    o._chk = { k: Math.abs(2 * (p.y2 - p.y1) / (p.x2 - p.x1) - p.k) < 1e-5 };
    return o;
  };

  G["A2-2-0"] = function (r) {
    const p = until(r, () => {
      const a = ir(r, 1, 6), b = ir(r, 1, 9), c = ir(r, 1, 10);
      const D = b * b - 4 * a * (a - c);
      if (D <= 0) return;
      const s = Math.sqrt(D);
      if (Math.abs(s - Math.round(s)) > 1e-9) return;
      const t1 = (b + s) / (2 * a), t2 = (b - s) / (2 * a);
      const angs = [];
      [t1, t2].forEach((t) => {
        let th = deg(Math.atan(t));
        if (th < 0) th += 180;
        if (th > 0 && th < 180) angs.push(th);
        const th2 = th + 180;
        if (th2 > 0 && th2 < 180) angs.push(th2);
      });
      const uniq = [...new Set(angs.map((x) => Number(x.toFixed(1))))].filter((x) => x > 0 && x < 180);
      if (uniq.length < 2) return;
      return { a, b, c, t1, t2, uniq };
    });
    const q = "Solve the equation \\(" + coff(p.a, "\\sec^2\\theta") + coff(-p.b, "\\tan\\theta") + add(-p.c) + "=0\\) for \\(0^\\circ<\\theta<180^\\circ\\).";
    const o = pack(q, "\\(\\tan\\theta=" + nstr(p.t1) + "\\) or \\(" + nstr(p.t2) + "\\): \\(\\theta=" + p.uniq.map((x) => dp1(x) + "^\\circ").join(",\\ ") + "\\)", [
      R("", "\\(" + coff(p.a, "(1+\\tan^2\\theta)") + coff(-p.b, "\\tan\\theta") + add(-p.c) + "=0\\)", "M1", "identity"),
      R("", "quadratic in \\(\\tan\\theta\\)", "M1", "quad"),
      R("", "\\(\\tan\\theta=" + nstr(p.t1) + "," + nstr(p.t2) + "\\)", "A1", "t"),
      R("", "\\(\\theta=" + p.uniq.map((x) => dp1(x) + "^\\circ").join(",\\ ") + "\\)", "A1", "angles")
    ], 4);
    o._chk = { t: p.uniq.length >= 2 };
    return o;
  };

  G["A2-2-1"] = function (r) {
    const u = pick(r, ["\\theta", "x", "A"]);
    const th = 0.7, s = Math.sin(th), c = Math.cos(th), t = Math.tan(th);
    const forms = [
      { q: "\\dfrac{1+\\sec " + u + "}{\\tan " + u + "+\\sin " + u + "}\\equiv\\operatorname{cosec}" + u, fact: "factor \\((1+\\cos " + u + ")\\)", ok: Math.abs((1 + 1 / c) / (t + s) - 1 / s) < 1e-8 },
      { q: "\\dfrac{\\sec " + u + "-1}{\\tan " + u + "-\\sin " + u + "}\\equiv\\operatorname{cosec}" + u, fact: "factor \\((1-\\cos " + u + ")\\)", ok: Math.abs((1 / c - 1) / (t - s) - 1 / s) < 1e-8 },
      { q: "\\tan " + u + "+\\cot " + u + "\\equiv\\sec " + u + "\\operatorname{cosec}" + u, fact: "common denominator \\(\\sin " + u + "\\cos " + u + "\\)", ok: Math.abs(t + 1 / t - 1 / (s * c)) < 1e-8 },
      { q: "\\dfrac{1-\\cos " + u + "}{\\sin " + u + "}\\equiv\\dfrac{\\sin " + u + "}{1+\\cos " + u + "}", fact: "multiply by \\(1+\\cos " + u + "\\)", ok: Math.abs((1 - c) / s - s / (1 + c)) < 1e-8 },
      { q: "\\dfrac{1+\\cos " + u + "}{\\sin " + u + "}\\equiv\\dfrac{\\sin " + u + "}{1-\\cos " + u + "}", fact: "multiply by \\(1-\\cos " + u + "\\)", ok: Math.abs((1 + c) / s - s / (1 - c)) < 1e-8 },
      { q: "\\dfrac{1+\\sin " + u + "}{\\cos " + u + "}\\equiv\\sec " + u + "+\\tan " + u, fact: "divide by \\(\\cos " + u + "\\)", ok: Math.abs((1 + s) / c - (1 / c + t)) < 1e-8 },
      { q: "\\dfrac{1-\\sin " + u + "}{\\cos " + u + "}\\equiv\\sec " + u + "-\\tan " + u, fact: "divide by \\(\\cos " + u + "\\)", ok: Math.abs((1 - s) / c - (1 / c - t)) < 1e-8 },
      { q: "(\\sec " + u + "+\\tan " + u + ")(\\sec " + u + "-\\tan " + u + ")\\equiv 1", fact: "difference of squares", ok: Math.abs((1 / c + t) * (1 / c - t) - 1) < 1e-8 },
      { q: "(\\operatorname{cosec}" + u + "+\\cot " + u + ")(\\operatorname{cosec}" + u + "-\\cot " + u + ")\\equiv 1", fact: "difference of squares", ok: Math.abs((1 / s + 1 / t) * (1 / s - 1 / t) - 1) < 1e-8 },
      { q: "\\sec " + u + "-\\cos " + u + "\\equiv\\tan " + u + "\\sin " + u, fact: "common denominator \\(\\cos " + u + "\\)", ok: Math.abs(1 / c - c - t * s) < 1e-8 },
      { q: "\\operatorname{cosec}" + u + "-\\sin " + u + "\\equiv\\cot " + u + "\\cos " + u, fact: "common denominator \\(\\sin " + u + "\\)", ok: Math.abs(1 / s - s - (c / s) * c) < 1e-8 },
      { q: "\\dfrac{1-\\cos 2" + u + "}{\\sin 2" + u + "}\\equiv\\tan " + u, fact: "double-angle formulae", ok: Math.abs((1 - Math.cos(2 * th)) / Math.sin(2 * th) - t) < 1e-8 }
    ];
    const f = pick(r, forms);
    const q = "Prove the identity \\(" + f.q + "\\).";
    const o = pack(q, "LHS reduces to RHS after writing in sin and cos", [
      R("", "write in sin and cos", "M1", "rewrite"),
      R("", f.fact, "M1", "factor"),
      R("", "LHS equals RHS", "A1", "identity")
    ], 3);
    o._chk = { id: f.ok };
    return o;
  };

  G["A2-2-2"] = function (r) {
    const p = until(r, () => {
      const cotk = pick(r, [2, 3, 4, 5]);
      const rhs = ir(r, -1, 8);
      const disc = 1 + 4 * cotk * (cotk + rhs);
      if (disc <= 0) return;
      const u1 = (1 + Math.sqrt(disc)) / (2 * cotk), u2 = (1 - Math.sqrt(disc)) / (2 * cotk);
      const sins = [u1, u2].filter((u) => Math.abs(u) >= 1).map((u) => 1 / u);
      if (!sins.length) return;
      const xs = [];
      sins.forEach((s) => {
        if (s > 1 + 1e-9 || s < -1 - 1e-9) return;
        s = Math.max(-1, Math.min(1, s));
        if (s >= 0) { const a = Math.asin(s); xs.push(a, Math.PI - a); }
        else { const a = Math.asin(s); xs.push(a + 2 * Math.PI, Math.PI - a); }
      });
      const uniq = [...new Set(xs.map((x) => Number(x.toPrecision(6))))].filter((x) => x > 1e-9 && x < 2 * Math.PI - 1e-9).sort((a, b) => a - b);
      if (uniq.length < 2) return;
      return { cotk, rhs, disc, u1, u2, sins, uniq };
    });
    function fmtX(x) {
      if (Math.abs(x - 3 * Math.PI / 2) < 1e-3) return "\\tfrac{3\\pi}{2}";
      if (Math.abs(x - Math.PI / 2) < 1e-3) return "\\tfrac{\\pi}{2}";
      return sf(x);
    }
    const q = "Solve the equation \\(" + p.cotk + "\\cot^2 x-\\operatorname{cosec}x=" + p.rhs + "\\) for \\(0<x<2\\pi\\), giving your answers in radians correct to 3 significant figures where not exact.";
    const o = pack(q, "\\(\\operatorname{cosec}x=" + nstr(p.u1) + "\\) or \\(" + nstr(p.u2) + "\\); \\(x=" + p.uniq.map(fmtX).join(",\\ ") + "\\)", [
      R("", "\\(" + p.cotk + "(\\operatorname{cosec}^2 x-1)-\\operatorname{cosec}x=" + p.rhs + "\\)", "M1", "identity"),
      R("", "quadratic in \\(\\operatorname{cosec}x\\)", "M1", "quadratic"),
      R("", "\\(\\operatorname{cosec}x=" + nstr(p.u1) + "\\) or \\(" + nstr(p.u2) + "\\)", "A1", "csc"),
      R("", "\\(x=" + fmtX(p.uniq[0]) + "\\)", "A1", "1"),
      R("", "\\(x=" + p.uniq.slice(1).map(fmtX).join(",\\ ") + "\\)", "A1", "rest")
    ], 5);
    o._chk = { inrange: p.uniq.every((x) => x > 0 && x < 2 * Math.PI), eq: p.uniq.every((x) => Math.abs(p.cotk / Math.pow(Math.tan(x), 2) - 1 / Math.sin(x) - p.rhs) < 5e-3) };
    return o;
  };

  G["A2-2-3"] = function (r) {
    const p = until(r, () => {
      const num = ir(r, 9, 40), den = ir(r, 2, 8);
      const val = num / den;
      if (val <= 4 + 1e-9) return;
      const s2 = 4 / val;
      if (s2 >= 1 - 1e-12 || s2 <= 0) return;
      const a = deg(Math.asin(Math.sqrt(s2))) / 2;
      const th = [];
      [a, 90 - a, 90 + a, 180 - a].forEach((t) => { if (t > 1e-6 && t < 180 - 1e-6) th.push(Number(t.toFixed(5))); });
      const uniq = [...new Set(th)].sort((a, b) => a - b);
      if (uniq.length < 2) return;
      const g = gcd(num, den);
      return { rhs: "\\tfrac{" + (num / g) + "}{" + (den / g) + "}", s2, uniq };
    });
    const q = "(a) Show that \\(\\sec^2\\theta+\\operatorname{cosec}^2\\theta\\equiv\\sec^2\\theta\\operatorname{cosec}^2\\theta\\). [2]<br/>(b) Hence solve \\(\\sec^2\\theta+\\operatorname{cosec}^2\\theta=" + p.rhs + "\\) for \\(0^\\circ<\\theta<180^\\circ\\). [4]";
    const listed = p.uniq.map((x) => angD(x) + "^\\circ").join(",\\ ");
    const o = pack(q, "(a) common denominator \\(\\cos^2\\theta\\sin^2\\theta\\)   (b) \\(\\theta=" + listed + "\\)", [
      R("(a)", "LHS \\(=\\dfrac{\\sin^2\\theta+\\cos^2\\theta}{\\sin^2\\theta\\cos^2\\theta}\\)", "M1", "combine"),
      R("(a)", "\\(=\\sec^2\\theta\\operatorname{cosec}^2\\theta\\)", "A1", "AG"),
      R("(b)", "\\(\\sin^2 2\\theta=" + nstr(p.s2) + "\\)", "M1", "double"),
      R("(b)", "\\(2\\theta\\) in range", "M1", "range"),
      R("(b)", "angles listed", "A1", "list"),
      R("(b)", "\\(\\theta=" + listed + "\\)", "A1", "cao")
    ], 6);
    o._chk = { uniq: new Set(p.uniq.map((x) => x.toFixed(2))).size === p.uniq.length };
    return o;
  };

  G["A2-2-4"] = function (r) {
    const p = until(r, () => {
      const num = ir(r, 1, 8), den = ir(r, num + 1, num + 8);
      const g = gcd(num, den);
      const n = num / g, d = den / g;
      const cos = (d - n) / (d + n);
      if (Math.abs(cos) >= 1) return;
      const th = deg(Math.acos(cos));
      if (th < 1 || th > 179) return;
      return { n, d, cos, th };
    });
    const q = "(a) Prove that \\((\\operatorname{cosec}\\theta-\\cot\\theta)^2\\equiv\\dfrac{1-\\cos\\theta}{1+\\cos\\theta}\\). [3]<br/>(b) Hence solve the equation \\((\\operatorname{cosec}\\theta-\\cot\\theta)^2=\\tfrac{" + p.n + "}{" + p.d + "}\\) for \\(0^\\circ<\\theta<360^\\circ\\). [3]";
    const o = pack(q, "(a) cancel \\((1-\\cos\\theta)\\)   (b) \\(\\cos\\theta=" + nstr(p.cos) + "\\): \\(\\theta=" + angD(p.th) + "^\\circ,\\ " + angD(360 - p.th) + "^\\circ\\)", [
      R("(a)", "write in sin and cos", "M1", "rewrite"),
      R("(a)", "\\(\\dfrac{(1-\\cos\\theta)^2}{1-\\cos^2\\theta}\\)", "M1", "num"),
      R("(a)", "cancel to RHS", "A1", "AG"),
      R("(b)", "\\(\\dfrac{1-\\cos\\theta}{1+\\cos\\theta}=\\tfrac{" + p.n + "}{" + p.d + "}\\)", "M1", "hence"),
      R("(b)", "\\(\\cos\\theta=" + nstr(p.cos) + "\\)", "A1", "cos"),
      R("(b)", "\\(\\theta=" + angD(p.th) + "^\\circ,\\ " + angD(360 - p.th) + "^\\circ\\)", "A1", "angles")
    ], 6);
    o._chk = { c: Math.abs((1 - p.cos) / (1 + p.cos) - p.n / p.d) < 1e-9 };
    return o;
  };

  G["A2-3-0"] = function (r) {
    const p = until(r, () => {
      const triples = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [9, 12, 15], [20, 21, 29], [12, 35, 37], [9, 40, 41], [11, 60, 61], [28, 45, 53]];
      const A = pick(r, triples), B = pick(r, triples);
      if (A === B) return;
      const sA = A[0] / A[2], cA = A[1] / A[2], sB = B[1] / B[2], cB = B[0] / B[2];
      const sAB = sA * cB + cA * sB;
      if (sAB >= 1 - 1e-9 || sAB <= 0) return;
      const tA = sA / cA, tB = sB / cB;
      if (Math.abs(1 + tA * tB) < 1e-9) return;
      const tAmB = (tA - tB) / (1 + tA * tB);
      return { A, B, sAB, tAmB };
    });
    const q = "Angles \\(A\\) and \\(B\\) are acute with \\(\\sin A=\\tfrac{" + p.A[0] + "}{" + p.A[2] + "}\\) and \\(\\cos B=\\tfrac{" + p.B[0] + "}{" + p.B[2] + "}\\). Find the exact values of \\(\\sin(A+B)\\) and \\(\\tan(A-B)\\).";
    const tn = Math.round(p.tAmB * p.A[1] * p.B[0] * p.A[2] * p.B[2] * 1000) / 1000;
    const tnum = Math.round((p.A[0] / p.A[1] - p.B[1] / p.B[0]) * p.A[1] * p.B[0]);
    const tden = Math.round((1 + (p.A[0] / p.A[1]) * (p.B[1] / p.B[0])) * p.A[1] * p.B[0]);
    const o = pack(q, "\\(\\sin(A+B)=" + frac(Math.round(p.sAB * p.A[2] * p.B[2]), p.A[2] * p.B[2]) + "\\), \\(\\tan(A-B)=" + frac(tnum, tden) + "\\)", [
      R("", "\\(\\cos A=\\tfrac{" + p.A[1] + "}{" + p.A[2] + "}\\), \\(\\sin B=\\tfrac{" + p.B[1] + "}{" + p.B[2] + "}\\)", "B1", "complements"),
      R("", "expansion of \\(\\sin(A+B)\\)", "M1", "compound"),
      R("", "\\(\\sin(A+B)\\) exact", "A1", "sin"),
      R("", "\\(\\tan(A-B)\\) exact", "A1", "tan")
    ], 4);
    o._chk = { sin: p.sAB > 0 && p.sAB < 1, tan: Math.abs(p.tAmB - tnum / tden) < 1e-9 };
    return o;
  };

  G["A2-3-1"] = function (r) {
    const a = pick(r, [3, 5, 8, 7, 20, 9, 12, 15, 4, 6, 10, 16, 18, 21, 24, 28, 11, 13, 33, 36, 39, 48, 60]), b = ({ 3: 4, 5: 12, 8: 15, 7: 24, 20: 21, 9: 12, 12: 5, 15: 8, 4: 3, 6: 8, 10: 24, 16: 30, 18: 24, 21: 20, 24: 7, 28: 45, 11: 60, 13: 84, 33: 56, 36: 77, 39: 80, 48: 55, 60: 11 })[a];
    const R0 = Math.hypot(a, b);
    const al = deg(Math.atan(b / a));
    const th = (360 - al + 360) % 360;
    const q = "Express \\(" + a + "\\cos\\theta-" + b + "\\sin\\theta\\) in the form \\(R\\cos(\\theta+\\alpha)\\), where \\(R>0\\) and \\(0^\\circ<\\alpha<90^\\circ\\). Hence state the greatest value of \\(" + a + "\\cos\\theta-" + b + "\\sin\\theta\\) and the value of \\(\\theta\\) in \\(0^\\circ<\\theta<360^\\circ\\) at which it occurs.";
    const o = pack(q, "\\(" + nstr(R0) + "\\cos(\\theta+" + dp1(al) + "^\\circ)\\); greatest value \\(" + nstr(R0) + "\\) at \\(\\theta=" + dp1(th) + "^\\circ\\)", [
      R("", "\\(R=\\sqrt{" + a + "^2+" + b + "^2}=" + nstr(R0) + "\\)", "B1", "R"),
      R("", "\\(\\tan\\alpha=\\dfrac{" + b + "}{" + a + "}\\), \\(\\alpha=" + dp1(al) + "^\\circ\\)", "M1", "alpha"),
      R("", "form \\(" + nstr(R0) + "\\cos(\\theta+" + dp1(al) + "^\\circ)\\)", "A1", "form"),
      R("", "greatest \\(" + nstr(R0) + "\\) when \\(\\theta=" + dp1(th) + "^\\circ\\)", "A1", "max")
    ], 4);
    o._chk = { R: R0 === Math.round(R0) };
    return o;
  };

  G["A2-3-2"] = function (r) {
    const p = until(r, () => {
      const a = ir(r, 10, 80), b = ir(r, 10, 80), k = ir(r, 2, 5);
      const ar = rad(a), br = rad(b);
      const num = k * Math.cos(br) - Math.sin(ar);
      const den = Math.cos(ar) - k * Math.sin(br);
      if (Math.abs(den) < 1e-8) return;
      const tan = num / den;
      let th0 = deg(Math.atan(tan));
      if (th0 < 0) th0 += 180;
      const angs = [th0, th0 + 180].filter((t) => t >= 0 && t <= 360).map((t) => Number(t.toFixed(1)));
      if (angs.length < 2) return;
      function ok(th) {
        return Math.abs(Math.sin(rad(th + a)) - k * Math.cos(rad(th - b))) < 1e-6;
      }
      if (!angs.every(ok)) return;
      return { a, b, k, tan, angs };
    });
    const q = "Solve the equation \\(\\sin(\\theta+" + p.a + "^\\circ)=" + p.k + "\\cos(\\theta-" + p.b + "^\\circ)\\) for \\(0^\\circ\\le\\theta\\le360^\\circ\\).";
    const o = pack(q, "\\(\\tan\\theta=" + nstr(p.tan) + "\\); \\(\\theta=" + p.angs.map((t) => angD(t) + "^\\circ").join(",\\ ") + "\\)", [
      R("", "expand both sides", "M1", "expand"),
      R("", "collect \\(\\sin\\theta\\) and \\(\\cos\\theta\\)", "M1", "collect"),
      R("", "\\(\\tan\\theta=" + nstr(p.tan) + "\\)", "A1", "tan"),
      R("", "\\(\\theta=" + p.angs.map((t) => angD(t) + "^\\circ").join(",\\ ") + "\\)", "A1", "solve")
    ], 4);
    o._chk = { eq: p.angs.every((t) => Math.abs(Math.sin(rad(t + p.a)) - p.k * Math.cos(rad(t - p.b))) < 1e-6) };
    return o;
  };

  G["A2-3-3"] = function (r) {
    const sc = ir(r, 1, 8);
    const kind = ir(r, 0, 5);
    const fams = [
      { Atex: "1", Av: 1, Btex: "\\sqrt{3}", Bv: Math.sqrt(3), al: "\\tfrac{\\pi}{6}", alv: Math.PI / 6, Rv: 2, Rtex: "2" },
      { Atex: "\\sqrt{3}", Av: Math.sqrt(3), Btex: "1", Bv: 1, al: "\\tfrac{\\pi}{3}", alv: Math.PI / 3, Rv: 2, Rtex: "2" },
      { Atex: "1", Av: 1, Btex: "1", Bv: 1, al: "\\tfrac{\\pi}{4}", alv: Math.PI / 4, Rv: Math.SQRT2, Rtex: "\\sqrt{2}" }
    ];
    const f = fams[kind % 3];
    const Av = sc * f.Av, Bv = sc * f.Bv, Rv = sc * f.Rv;
    const Rtex = sc === 1 ? f.Rtex : (f.Rtex === "2" ? nstr(2 * sc) : nstr(sc) + "\\sqrt{2}");
    const ate = sc === 1 ? (f.Atex === "1" ? "" : f.Atex) : (f.Atex === "1" ? nstr(sc) : nstr(sc) + f.Atex);
    const bte = sc === 1 ? (f.Btex === "1" ? "" : f.Btex) : (f.Btex === "1" ? nstr(sc) : nstr(sc) + f.Btex);
    const expr2 = ate + "\\sin 2x+" + bte + "\\cos 2x";
    const rhs = kind < 3 ? Math.SQRT2 * sc : sc;
    const rhsTex = kind < 3 ? (sc === 1 ? "\\sqrt{2}" : nstr(sc) + "\\sqrt{2}") : nstr(sc);
    const cval = rhs / Rv;
    const ac = Math.acos(cval);
    const xs = [];
    for (let nn = -2; nn <= 3; nn++) {
      [f.alv + ac + 2 * Math.PI * nn, f.alv - ac + 2 * Math.PI * nn].forEach((phi) => {
        const x = phi / 2;
        if (x > 1e-9 && x < Math.PI - 1e-9) xs.push(x);
      });
    }
    const uniq = [...new Set(xs.map((x) => Number(x.toPrecision(10))))].sort((a, b) => a - b);
    function nicePi(x) {
      for (let den = 1; den <= 48; den++) {
        const num = Math.round(x * den / Math.PI);
        if (Math.abs(x - num * Math.PI / den) < 1e-8) {
          const g = gcd(Math.abs(num), den);
          const nn = num / g, d = den / g;
          if (d === 1) return nn === 1 ? "\\pi" : nstr(nn) + "\\pi";
          if (nn === 1) return "\\tfrac{\\pi}{" + d + "}";
          return "\\tfrac{" + nn + "\\pi}{" + d + "}";
        }
      }
      return sf(x);
    }
    const listed = uniq.map(nicePi).join(",\\ ");
    const q = "(a) Express \\(" + expr2 + "\\) in the form \\(R\\cos(2x-\\alpha)\\), where \\(R>0\\) and \\(0<\\alpha<\\tfrac{\\pi}{2}\\), giving exact values. [3]<br/>(b) Hence solve \\(" + expr2 + "=" + rhsTex + "\\) for \\(0<x<\\pi\\), giving exact answers in terms of \\(\\pi\\). [3]";
    const tanA = f.Av / f.Bv;
    const tanTex = Math.abs(tanA - Math.sqrt(3)) < 1e-9 ? "\\sqrt{3}" : Math.abs(tanA - 1 / Math.sqrt(3)) < 1e-9 ? "\\tfrac{1}{\\sqrt{3}}" : nstr(tanA);
    let ctex, actex;
    if (Math.abs(cval - Math.SQRT2 / 2) < 1e-9) { ctex = "\\tfrac{\\sqrt{2}}{2}"; actex = "\\tfrac{\\pi}{4}"; }
    else if (Math.abs(cval - 0.5) < 1e-9) { ctex = "\\tfrac12"; actex = "\\tfrac{\\pi}{3}"; }
    else if (Math.abs(cval - 1) < 1e-9) { ctex = "1"; actex = "0"; }
    else { ctex = nstr(cval); actex = "\\arccos(" + nstr(cval) + ")"; }
    const o = pack(q, "(a) \\(" + Rtex + "\\cos(2x-" + f.al + ")\\)   (b) \\(x=" + listed + "\\)", [
      R("(a)", "\\(R=" + Rtex + "\\)", "B1", "R"),
      R("(a)", "\\(\\tan\\alpha=" + tanTex + "\\), \\(\\alpha=" + f.al + "\\)", "M1", "alpha"),
      R("(a)", "\\(" + Rtex + "\\cos(2x-" + f.al + ")\\)", "A1", "form"),
      R("(b)", "\\(\\cos(2x-" + f.al + ")=" + ctex + "\\)", "M1", "hence"),
      R("(b)", "\\(2x-" + f.al + "=" + (actex === "0" ? "2n\\pi" : "\\pm" + actex + "+2n\\pi") + "\\)", "M1", "general"),
      R("(b)", "\\(x=" + listed + "\\)", "A1", "in range")
    ], 6);
    o._chk = { eq: uniq.every((x) => Math.abs(Av * Math.sin(2 * x) + Bv * Math.cos(2 * x) - rhs) < 1e-5), n: uniq.length >= 1 };
    return o;
  };

  G["A2-3-4"] = function (r) {
    const p = until(r, () => {
      const trips = [[8, 15, 17], [5, 12, 13], [7, 24, 25], [20, 21, 29], [9, 12, 15], [12, 16, 20], [3, 4, 5]];
      const t = pick(r, trips);
      const a = t[0], b = t[1], R0 = t[2];
      const K = R0 + ir(r, 6, 14);
      const rhs = ir(r, 2, R0 - 1);
      const al = deg(Math.atan(b / a));
      const wait = deg(Math.acos(rhs / R0));
      let thA = (al - wait + 360) % 360, thB = (al + wait + 360) % 360;
      if (Math.abs(thA) < 0.05 || Math.abs(thA - 360) < 0.05 || Math.abs(thB) < 0.05 || Math.abs(thB - 360) < 0.05) return;
      if (thA < 1e-6 || thB < 1e-6) return;
      const mx = 1 / (K - R0), mn = 1 / (K + R0);
      return { a, b, R0, K, rhs, al, thA, thB, mx, mn };
    });
    const lo = Math.min(p.thA, p.thB), hi = Math.max(p.thA, p.thB);
    const q = "(a) Express \\(" + p.a + "\\cos\\theta+" + p.b + "\\sin\\theta\\) in the form \\(R\\cos(\\theta-\\alpha)\\), where \\(R>0\\) and \\(0^\\circ<\\alpha<90^\\circ\\). Give \\(\\alpha\\) correct to 2 decimal places. [3]<br/>(b) Hence solve \\(" + p.a + "\\cos\\theta+" + p.b + "\\sin\\theta=" + p.rhs + "\\) for \\(0^\\circ<\\theta<360^\\circ\\). [3]<br/>(c) Find the greatest and least values of \\(\\dfrac{1}{" + p.K + "-" + p.a + "\\cos\\theta-" + p.b + "\\sin\\theta}\\). [3]";
    const o = pack(q, "(a) \\(" + p.R0 + "\\cos(\\theta-" + p.al.toFixed(2) + "^\\circ)\\)   (b) \\(\\theta=" + dp1(lo) + "^\\circ,\\ " + dp1(hi) + "^\\circ\\)   (c) greatest \\(" + nstr(p.mx) + "\\), least \\(" + nstr(p.mn) + "\\)", [
      R("(a)", "\\(R=" + p.R0 + "\\)", "B1", "R"),
      R("(a)", "\\(\\tan\\alpha=" + p.b + "/" + p.a + "\\)", "M1", "tan"),
      R("(a)", "\\(\\alpha=" + p.al.toFixed(2) + "^\\circ\\)", "A1", "2 d.p."),
      R("(b)", "\\(\\cos(\\theta-\\alpha)=" + nstr(p.rhs / p.R0) + "\\)", "M1", "hence"),
      R("(b)", "two solutions in range", "A1", "two"),
      R("(b)", "\\(\\theta=" + dp1(lo) + "^\\circ,\\ " + dp1(hi) + "^\\circ\\)", "A1", "angles"),
      R("(c)", "denominator from \\(" + (p.K - p.R0) + "\\) to \\(" + (p.K + p.R0) + "\\)", "M1", "range"),
      R("(c)", "greatest \\(" + nstr(p.mx) + "\\)", "A1", "max"),
      R("(c)", "least \\(" + nstr(p.mn) + "\\)", "A1", "min")
    ], 9);
    o._chk = {
      R: p.a * p.a + p.b * p.b === p.R0 * p.R0,
      eq: Math.abs(p.a * Math.cos(rad(lo)) + p.b * Math.sin(rad(lo)) - p.rhs) < 0.05 && lo > 0 && hi < 360
    };
    return o;
  };

  G["A2-4-0"] = function (r) {
    const p = until(r, () => {
      const x = ir(r, 1, 5), y = ir(r, 1, 5);
      const num = y - x * x, den = y * y - x;
      if (den === 0) return;
      const rhs = x ** 3 + y ** 3 - 3 * x * y;
      return { x, y, num, den, g0: num / den, rhs };
    });
    const rhsTex = p.rhs === 0 ? "3xy" : "3xy" + add(p.rhs);
    const q = "Show that \\((" + p.x + "," + p.y + ")\\) lies on the curve \\(x^3+y^3=" + rhsTex + "\\) and find the gradient of the curve at this point.";
    const o = pack(q, "substitution holds; \\(\\dfrac{dy}{dx}=\\dfrac{y-x^2}{y^2-x}=" + nstr(p.g0) + "\\)", [
      R("", "substitute coordinates into the equation", "B1", "on curve"),
      R("", "differentiate implicitly", "M1", "implicit"),
      R("", "\\(\\dfrac{dy}{dx}=\\dfrac{y-x^2}{y^2-x}\\)", "A1", "formula"),
      R("", "gradient \\(" + nstr(p.g0) + "\\)", "A1", "value")
    ], 4);
    o._chk = { on: p.x ** 3 + p.y ** 3 === 3 * p.x * p.y + p.rhs, den: p.den !== 0 };
    return o;
  };

  G["A2-4-1"] = function (r) {
    const p = until(r, () => {
      const k3 = ir(r, 1, 8);
      const t = ir(r, 1, 5);
      const x = t, y = t;
      const rhs = x * x * y + k3 * y * y * y;
      const lam = rhs / x;
      if (Math.abs(lam - Math.round(lam)) > 1e-9) return;
      const dyN = lam - 2 * x * y;
      const dyD = x * x + 3 * k3 * y * y;
      if (dyD === 0) return;
      const dy = dyN / dyD;
      let A, B, C;
      if (Math.abs(dy) < 1e-12) { A = 0; B = 1; C = -y; }
      else if (!Number.isFinite(dy)) { A = 1; B = 0; C = -x; }
      else {
        A = dyN; B = -dyD; C = -A * x - B * y;
      }
      const g2 = gcd(gcd(Math.abs(A), Math.abs(B)), Math.abs(C)) || 1;
      A /= g2; B /= g2; C /= g2;
      if (A < 0 || (A === 0 && B < 0)) { A = -A; B = -B; C = -C; }
      return { k3, x, y, rhs, lam: Math.round(lam), dy, line: axbyc(A, B, C), A, B, C };
    });
    const yterm = p.k3 === 1 ? "y^3" : p.k3 + "y^3";
    const q = "Find the equation of the tangent to the curve \\(x^2 y+" + yterm + "=" + p.lam + "x\\) at the point \\((" + p.x + "," + p.y + ")\\), giving your answer in the form \\(ax+by+c=0\\).";
    const o = pack(q, "\\(\\dfrac{dy}{dx}=" + nstr(p.dy) + "\\); tangent \\(" + p.line + "\\)", [
      R("", "differentiate implicitly", "M1", "implicit"),
      R("", "product and chain rules", "M1", "product"),
      R("", "\\(\\dfrac{dy}{dx}=" + nstr(p.dy) + "\\)", "A1", "gradient"),
      R("", "tangent through \\((1,1)\\)", "M1", "line"),
      R("", "\\(" + p.line + "\\)", "A1", "form")
    ], 5);
    o._chk = { on: p.A * p.x + p.B * p.y + p.C === 0, g: Number.isFinite(p.dy) };
    return o;
  };

  G["A2-4-2"] = function (r) {
    const p = until(r, () => {
      const a = ir(r, 2, 6), px = ir(r, 1, 3), py = ir(r, 1, 3);
      if (px === py && px === 1 && a === 2) { /* ok */ }
      const rhs = Math.pow(a, px) + Math.pow(a, py);
      const dy = -Math.pow(a, px - py);
      if (!Number.isFinite(dy) || dy === 0) return;
      return { a, px, py, rhs, dy };
    });
    const m = p.dy;
    const c = p.py - m * p.px;
    const nm = -1 / m;
    const nc = p.py - nm * p.px;
    const q = "The curve \\(" + p.a + "^x+" + p.a + "^y=" + decn(p.rhs) + "\\) passes through \\((" + p.px + "," + p.py + ")\\). Find the equation of the normal to the curve at this point.";
    let nline;
    if (Math.abs(nm - 1) < 1e-9 && Math.abs(nc) < 1e-9) nline = "y=x";
    else if (Math.abs(nc) < 1e-9) nline = "y=" + coff(nm, "x");
    else nline = "y=" + coff(nm, "x") + add(nc);
    const o = pack(q, "\\(\\dfrac{dy}{dx}=" + nstr(m) + "\\); normal \\(" + nline + "\\)", [
      R("", "point lies on the curve", "B1", "on"),
      R("", "differentiate: \\(" + p.a + "^x\\ln " + p.a + "+" + p.a + "^y\\ln " + p.a + "\\,y'=0\\)", "M1", "implicit"),
      R("", "\\(\\dfrac{dy}{dx}=" + nstr(m) + "\\) at \\((" + p.px + "," + p.py + ")\\)", "A1", "m"),
      R("", "normal gradient \\(" + nstr(nm) + "\\)", "M1", "line"),
      R("", "\\(" + nline + "\\)", "A1", "equation")
    ], 5);
    o._chk = { m: Math.abs(m + Math.pow(p.a, p.px - p.py)) < 1e-8 };
    return o;
  };

  G["A2-4-3"] = function (r) {
    const p = until(r, () => {
      const b = pick(r, [2, 4, 6, 8]), c = pick(r, [5, 8, 10, 13, 17]), rhs = pick(r, [4, 5, 8, 9, 16]);
      const den = 4 * c - b * b;
      if (den <= 0) return;
      const num = 4 * c * rhs;
      if (num <= 0) return;
      const yk = b / (2 * c);
      return { b, c, rhs, num, den, yk };
    });
    const xshow = sqrtRat(p.num, p.den);
    const yshow = sqrtRat(p.num * p.b * p.b, p.den * 4 * p.c * p.c);
    const q = "The curve \\(x^2-" + p.b + "xy+" + p.c + "y^2=" + p.rhs + "\\). Find the exact coordinates of the points on the curve at which the tangent is parallel to the \\(y\\)-axis.";
    const pts = "\\bigl(\\pm" + xshow + ",\\pm" + yshow + "\\bigr)";
    const o = pack(q, "\\(y=" + nstr(p.yk) + "x\\); corresponding signs \\(" + pts + "\\)", [
      R("", "implicit differentiation", "M1", "diff"),
      R("", "vertical tangent: \\(-" + p.b + "x+2\\cdot" + p.c + "y=0\\)", "M1", "vert"),
      R("", "\\(y=" + nstr(p.yk) + "x\\)", "A1", "rel"),
      R("", "substitute into the curve", "M1", "sub"),
      R("", "\\(" + pts + "\\) (corresponding signs)", "A1", "points")
    ], 5);
    o._chk = { pos: p.num > 0 && p.den > 0 };
    return o;
  };

  G["A2-4-4"] = function (r) {
    const k = ir(r, 3, 36);
    const num = k + "y-3x^2", den = "3y^2-" + k + "x";
    const xtex = k % 3 === 0 ? coff(k / 3, cubert(2)) : "\\dfrac{" + k + "}{3}" + cubert(2);
    const ytex = k % 3 === 0 ? coff(k / 3, cubert(4)) : "\\dfrac{" + k + "}{3}" + cubert(4);
    const q = "A curve has equation \\(x^3+y^3=" + k + "xy\\).<br/>(a) Show that \\(\\dfrac{dy}{dx}=\\dfrac{" + num + "}{" + den + "}\\). [4]<br/>(b) Find the exact coordinates of the point on the curve, other than the origin, at which the tangent is parallel to the \\(x\\)-axis. [4]";
    const o = pack(q, "(a) given. (b) \\((" + xtex + "," + ytex + ")\\)", [
      R("(a)", "\\(3x^2+3y^2 y'=" + k + "y+" + k + "x y'\\)", "M1", "implicit"),
      R("(a)", "collect \\(y'\\) terms", "M1", "collect"),
      R("(a)", "factor", "M1", "factor"),
      R("(a)", "given formula", "A1", "AG"),
      R("(b)", "numerator zero, \\(y\\ne0\\)", "M1", "horiz"),
      R("(b)", "substitute into the curve", "M1", "sub"),
      R("(b)", "\\(x=" + xtex + "\\)", "A1", "x"),
      R("(b)", "\\(y=" + ytex + "\\)", "A1", "point")
    ], 8);
    const xv = k * Math.pow(2, 1 / 3) / 3, yv = k * Math.pow(4, 1 / 3) / 3;
    o._chk = { pt: Math.abs(xv ** 3 + yv ** 3 - k * xv * yv) < 1e-6 };
    return o;
  };

  G["A2-5-0"] = function (r) {
    const lam = pick(r, [1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6, 2.8, 3.0, 3.2, 3.5, 3.8, 4.0]);
    const k = pick(r, [2, 3, 4]);
    const p3 = poP(lam, k), p2 = poC(lam, 2);
    const q = "\\(X\\sim\\mathrm{Po}(" + lam + ")\\). Find \\(P(X=" + k + ")\\) and \\(P(X\\le 2)\\).";
    const o = pack(q, "\\(" + sf(p3) + "\\); \\(" + sf(p2) + "\\)", [
        R("", "\\(P(X=" + k + ")=e^{-" + lam + "}" + lam + "^{" + k + "}/" + k + "!\\)", "M1", "pmf"),
      R("", "\\(" + sf(p3) + "\\)", "A1", "3 s.f."),
      R("", "\\(P(X\\le2)=" + sf(p2) + "\\)", "A1", "cdf")
    ], 3);
    o._chk = { p: p3 > 0 && p3 < 1 };
    return o;
  };

  G["A2-5-1"] = function (r) {
    const rate = pick(r, [0.8, 1.0, 1.2, 1.5, 1.6, 1.8, 2.0, 2.4]), pages = pick(r, [2, 3, 4, 5]);
    const lam = rate * pages, k = 4;
    const p = poP(lam, k);
    const q = "Typing errors occur at random at an average rate of " + decn(rate) + " per page. Find the probability that there are exactly " + k + " errors in a " + pages + "-page letter.";
    const o = pack(q, "\\(\\lambda=" + decn(lam) + "\\): \\(" + sf(p) + "\\)", [
      R("", "\\(\\lambda=" + decn(rate) + "\\times" + pages + "=" + decn(lam) + "\\)", "M1", "scale"),
      R("", "\\(P(X=4)=e^{-" + decn(lam) + "}(" + decn(lam) + ")^{4}/24\\)", "M1", "pmf"),
      R("", "\\(" + sf(p) + "\\)", "A1", "3 s.f.")
    ], 3);
    o._chk = { lam: Math.abs(lam - rate * pages) < 1e-12 };
    return o;
  };

  G["A2-5-2"] = function (r) {
    const p52 = until(r, () => {
      const lam = pick(r, [1, 1.2, 1.5, 1.6, 1.8, 2, 2.4, 2.5, 3, 3.2, 3.5, 3.6, 4, 4.5, 5]);
      const mins = pick(r, [6, 10, 12, 15, 20, 24, 30]);
      const rate = lam * 60 / mins;
      if (Math.abs(rate - Math.round(rate)) > 1e-8) return;
      const three = Math.pow(poC(lam, 1), 3);
      if (three < 0.002) return;
      return { rate: Math.round(rate), mins, lam };
    });
    const rate = p52.rate, mins = p52.mins, lam = p52.lam;
    const pge = 1 - poC(lam, 2);
    const p0or1 = poC(lam, 1);
    const three = Math.pow(p0or1, 3);
    const q = "Emails arrive at random at a constant average rate of " + rate + " per hour.<br/>(a) Find the probability that at least 3 emails arrive in a " + mins + "-minute period. [3]<br/>(b) Three separate, non-overlapping " + mins + "-minute periods are chosen. Find the probability that fewer than 2 emails arrive in <b>each</b> of the three periods. [2]";
    const o = pack(q, "(a) \\(\\lambda=" + decn(lam) + "\\): \\(" + sf(pge) + "\\)   (b) \\(" + sf(three) + "\\)", [
      R("(a)", "\\(\\lambda=" + rate + "\\times" + mins + "/60=" + decn(lam) + "\\)", "M1", "scale"),
      R("(a)", "\\(1-P(X\\le2)\\)", "M1", "complement"),
      R("(a)", "\\(" + sf(pge) + "\\)", "A1", "3 s.f."),
      R("(b)", "\\((P(X<2))^3\\)", "M1", "indep"),
      R("(b)", "\\(" + sf(three) + "\\)", "A1", "3 s.f.")
    ], 5);
    o._chk = { lam: lam > 0 };
    return o;
  };

  G["A2-5-3"] = function (r) {
    const rate = Number((0.12 + ir(r, 0, 40) * 0.02).toFixed(2));
    const t = Math.ceil(-Math.log(0.05) / rate);
    const q = "Cars pass a checkpoint at random at an average rate of " + rate + " per minute. Find the least whole number of minutes, \\(t\\), such that the probability that at least one car passes in a period of \\(t\\) minutes is greater than 0.95.";
    const o = pack(q, "\\(e^{-" + rate + "t}<0.05\\Rightarrow t=" + t + "\\)", [
      R("", "\\(1-e^{-" + rate + "t}>0.95\\)", "M1", "model"),
      R("", "\\(t>\\dfrac{\\ln 0.05}{-" + rate + "}\\)", "M1", "logs"),
      R("", "least integer \\(t=" + t + "\\)", "A1", "ceil"),
      R("", "check neighbouring integers", "A1", "check")
    ], 4);
    o._chk = { t: Math.exp(-rate * t) < 0.05 && Math.exp(-rate * (t - 1)) >= 0.05 };
    return o;
  };

  G["A2-5-4"] = function (r) {
    const a = pick(r, [0.4, 0.5, 0.6, 0.7, 0.8, 0.9]), b = pick(r, [0.15, 0.2, 0.25, 0.3, 0.35, 0.4]);
    const nA = 3, nB = 4;
    const lA = a * nA, lB = b * nB, L = lA + lB;
    const p2 = poP(L, 2);
    const cond = poP(lA, 2) * poP(lB, 0) / p2;
    const q = "Faults in cloth of type A occur at random at an average rate of " + a + " per metre; faults in cloth of type B occur independently at random at an average rate of " + b + " per metre. A customer buys 3 metres of type A and 4 metres of type B.<br/>(a) Find the probability that the total number of faults in the cloth bought is exactly 2. [3]<br/>(b) Given that the total number of faults is exactly 2, find the probability that both faults are in the type A cloth. [3]<br/>(c) State one assumption needed for the Poisson model to be valid in this context. [1]";
    const o = pack(q, "(a) \\(\\mathrm{Po}(" + decn(L) + ")\\): \\(" + sf(p2) + "\\)   (b) \\(" + sf(cond) + "\\)   (c) faults occur independently / at a constant average rate", [
      R("(a)", "\\(\\lambda_A=" + decn(lA) + "\\), \\(\\lambda_B=" + decn(lB) + "\\)", "M1", "scale"),
      R("(a)", "\\(T\\sim\\mathrm{Po}(" + decn(L) + ")\\)", "M1", "sum"),
      R("(a)", "\\(" + sf(p2) + "\\)", "A1", "3 s.f."),
      R("(b)", "\\(P(A=2,B=0)/P(T=2)\\)", "M1", "cond"),
      R("(b)", "independence of A and B", "M1", "indep"),
      R("(b)", "\\(" + sf(cond) + "\\)", "A1", "3 s.f."),
      R("(c)", "faults occur independently or at a constant average rate", "B1", "assumption")
    ], 7);
    o._chk = { L: Math.abs(L - lA - lB) < 1e-12 };
    return o;
  };

  G["A2-6-0"] = function (r) {
    const lam = pick(r, [24, 28, 32, 36, 40, 42, 45, 48, 50, 54]);
    const x = lam + pick(r, [3, 4, 5, 6, 7]);
    const z = (x + 0.5 - lam) / Math.sqrt(lam);
    const p = Phi(z);
    const q = "\\(X\\sim\\mathrm{Po}(" + lam + ")\\). Use a suitable approximation to find \\(P(X\\le" + x + ")\\).";
    const o = pack(q, "\\(P(Y<" + (x + 0.5) + ")\\), \\(z=" + dots(z, 3) + "\\): \\(" + sf(p) + "\\)", [
      R("", "\\(Y\\sim N(" + lam + "," + lam + ")\\) with continuity correction", "M1", "approx"),
      R("", "\\(z=" + dots(z, 3) + "\\)", "M1", "z"),
      R("", "\\(" + sf(p) + "\\)", "A1", "3 s.f.")
    ], 3);
    o._chk = { z: z > 0 };
    return o;
  };

  G["A2-6-1"] = function (r) {
    const lam = pick(r, [16, 18, 20, 22, 25, 28, 30, 36]);
    const a = lam - pick(r, [4, 5, 6]), b = lam + pick(r, [4, 5, 6]);
    const z1 = (a - 0.5 - lam) / Math.sqrt(lam), z2 = (b - 0.5 - lam) / Math.sqrt(lam);
    const p = Phi(z2) - Phi(z1);
    const q = "\\(X\\sim\\mathrm{Po}(" + lam + ")\\). Use a suitable approximation to find \\(P(" + a + "\\le X<" + b + ")\\).";
    const o = pack(q, "\\(P(" + (a - 0.5) + "<Y<" + (b - 0.5) + ")\\): \\(" + sf(p) + "\\)", [
      R("", "normal, continuity correction", "M1", "cc"),
      R("", "\\(z=" + dots(z1, 3) + ",\\ " + dots(z2, 3) + "\\)", "M1", "z"),
      R("", "\\(\\Phi\\) values", "M1", "tables"),
      R("", "\\(" + sf(p) + "\\)", "A1", "3 s.f.")
    ], 4);
    o._chk = { p: p > 0 && p < 1 };
    return o;
  };

  G["A2-6-2"] = function (r) {
    const p62 = until(r, () => {
      const per10 = pick(r, [3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7]), hours = pick(r, [1]), lam = per10 * 6;
      const cut = lam + pick(r, [-4, -2, 0, 2, 3, 4, 5]);
      const z = (cut + 0.5 - lam) / Math.sqrt(lam);
      if (Math.abs(z) > 2.2) return;
      return { per10, lam, cut, z, p: 1 - Phi(z) };
    });
    const per10 = p62.per10, lam = p62.lam, cut = p62.cut, z = p62.z, p = p62.p;
    const q = "Customers arrive at a shop at random at an average rate of " + per10 + " per 10 minutes. Use a suitable approximation to find the probability that more than " + cut + " customers arrive in a 1-hour period.";
    const o = pack(q, "\\(\\lambda=" + nstr(lam) + "\\), \\(P(Y>" + (cut + 0.5) + ")\\), \\(z=" + dots(z, 3) + "\\): \\(" + sf(p) + "\\)", [
      R("", "\\(\\lambda=" + per10 + "\\times6=" + nstr(lam) + "\\)", "M1", "scale"),
      R("", "\\(P(Y>" + (cut + 0.5) + ")\\)", "M1", "cc"),
      R("", "\\(z=" + dots(z, 3) + "\\)", "M1", "z"),
      R("", "\\(" + sf(p) + "\\)", "A1", "3 s.f.")
    ], 4);
    o._chk = { lam: lam > 15 };
    return o;
  };

  G["A2-6-3"] = function (r) {
    const p63 = until(r, () => {
      const mins = pick(r, [8, 10, 12, 15, 20]), rate = pick(r, [1.6, 2, 2.4, 2.5, 3, 3.2, 4, 4.5]);
      const lam = rate * mins;
      if (lam <= 15) return;
      return { mins, rate, lam, k: Math.round(lam) };
    });
    const mins = p63.mins, rate = p63.rate, lam = p63.lam, k = p63.k;
    const z = 0.5 / Math.sqrt(lam);
    const p = Phi(z) - Phi(-z);
    const q = "A website receives hits at random at an average rate of " + decn(rate) + " per minute. Use a suitable approximation, which you should justify, to find the probability that exactly " + k + " hits are received in a " + mins + "-minute period.";
    const o = pack(q, "\\(\\lambda=" + decn(lam) + ">15\\); \\(P(" + (k - 0.5) + "<Y<" + (k + 0.5) + ")\\): \\(" + sf(p) + "\\)", [
      R("", "\\(\\lambda=" + decn(lam) + ">15\\), normal appropriate", "B1", "justify"),
      R("", "continuity correction \\(\\pm0.5\\)", "M1", "cc"),
      R("", "\\(z=\\pm" + dots(z, 3) + "\\)", "M1", "z"),
      R("", "\\(" + sf(p) + "\\)", "A1", "3 s.f.")
    ], 4);
    o._chk = { p: p > 0 };
    return o;
  };

  G["A2-6-4"] = function (r) {
    const p64 = until(r, () => {
      const rate = pick(r, [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.2]), d1 = pick(r, [2, 3, 4, 5]), days = pick(r, [20, 24, 25, 28, 30, 32, 36]);
      const lam1 = rate * d1, lam2 = rate * days;
      if (lam2 <= 15) return;
      return { rate, d1, days, lam1, lam2, p2: poP(lam1, 2) };
    });
    const rate = p64.rate, d1 = p64.d1, days = p64.days, lam1 = p64.lam1, lam2 = p64.lam2, p2 = p64.p2;
    const z = (20.5 - lam2) / Math.sqrt(lam2);
    const p = Phi(z);
    const q = "Breakdowns of a machine occur at random at an average rate of " + rate + " per day.<br/>(a) Find the probability that there are exactly 2 breakdowns in a " + d1 + "-day period. [2]<br/>(b) Use a suitable approximation to find the probability that there are at most 20 breakdowns in a " + days + "-day period. Justify your approximation. [5]";
    const o = pack(q, "(a) \\(\\mathrm{Po}(" + decn(lam1) + ")\\): \\(" + sf(p2) + "\\)   (b) \\(\\lambda=" + decn(lam2) + ">15\\), \\(" + sf(p) + "\\)", [
      R("(a)", "\\(\\lambda=" + decn(lam1) + "\\)", "M1", "scale"),
      R("(a)", "\\(" + sf(p2) + "\\)", "A1", "3 s.f."),
      R("(b)", "\\(\\lambda=" + decn(lam2) + ">15\\)", "B1", "justify"),
      R("(b)", "\\(N(" + decn(lam2) + "," + decn(lam2) + ")\\)", "M1", "normal"),
      R("(b)", "\\(P(Y<20.5)\\)", "M1", "cc"),
      R("(b)", "\\(z=" + dots(z, 3) + "\\)", "M1", "z"),
      R("(b)", "\\(" + sf(p) + "\\)", "A1", "3 s.f.")
    ], 7);
    o._chk = { lam: lam2 > 15 };
    return o;
  };

  G["A2-7-0"] = function (r) {
    const ex = ir(r, 4, 8), vx = pick(r, [2, 4, 9]), ey = ir(r, 2, 5), vy = pick(r, [1, 2.25, 4]);
    const a = 2, b = -3, c = 4;
    const E = a * ex + b * ey + c, V = a * a * vx + b * b * vy;
    const q = "\\(X\\) and \\(Y\\) are independent with \\(E(X)=" + ex + "\\), \\(\\mathrm{Var}(X)=" + vx + "\\), \\(E(Y)=" + ey + "\\), \\(\\mathrm{Var}(Y)=" + nstr(vy) + "\\). Find \\(E(" + a + "X-3Y+" + c + ")\\) and \\(\\mathrm{Var}(" + a + "X-3Y+" + c + ")\\).";
    const o = pack(q, "\\(E=" + nstr(E) + "\\), \\(\\mathrm{Var}=" + nstr(V) + "\\)", [
      R("", "\\(E(" + a + "X-3Y+" + c + ")=" + a + "(" + ex + ")-3(" + ey + ")+" + c + "\\)", "M1", "linear"),
      R("", "\\(" + nstr(E) + "\\)", "A1", "mean"),
      R("", "\\(\\mathrm{Var}=" + (a * a) + "(" + vx + ")+9(" + nstr(vy) + ")=" + nstr(V) + "\\)", "A1", "var")
    ], 3);
    o._chk = { V: V === 4 * vx + 9 * vy };
    return o;
  };

  G["A2-7-1"] = function (r) {
    const mu = pick(r, [10, 12, 15]), v = pick(r, [4, 9, 16]), n = pick(r, [3, 4, 5]);
    const Tmu = n * mu, Tv = n * v;
    const c = Tmu + pick(r, [4, 6, 8]);
    const z = (c - Tmu) / Math.sqrt(Tv);
    const p = 1 - Phi(z);
    const q = "\\(X\\sim N(" + mu + "," + v + ")\\). \\(T\\) is the sum of <b>" + n + " independent observations</b> of \\(X\\). Find \\(P(T>" + c + ")\\).";
    const o = pack(q, "\\(T\\sim N(" + Tmu + "," + Tv + ")\\): \\(" + sf(p) + "\\)", [
      R("", "\\(T\\sim N(" + Tmu + "," + Tv + ")\\)", "M1", "sum"),
      R("", "\\(z=" + dots(z, 3) + "\\)", "M1", "z"),
      R("", "\\(" + sf(p) + "\\)", "A1", "3 s.f.")
    ], 3);
    o._chk = { v: Tv === n * v };
    return o;
  };

  G["A2-7-2"] = function (r) {
    const mu = pick(r, [10, 12, 15]), v = pick(r, [4, 9]), k = pick(r, [3, 4, 5]);
    const c = k * mu + pick(r, [4, 8]);
    const z = (c - k * mu) / Math.sqrt(k * k * v);
    const p = 1 - Phi(z);
    const q = "\\(X\\sim N(" + mu + "," + v + ")\\).<br/>(a) A <b>single</b> observation of \\(X\\) is multiplied by " + k + ". Find \\(P(" + k + "X>" + c + ")\\). [3]<br/>(b) Explain why this is different from the sum of " + k + " independent observations. [1]";
    const o = pack(q, "(a) \\(" + k + "X\\sim N(" + (k * mu) + "," + (k * k * v) + ")\\): \\(" + sf(p) + "\\)   (b) one value scaled: variance \\(\\times" + (k * k) + "\\), not \\(\\times" + k + "\\)", [
      R("(a)", "\\(" + k + "X\\sim N(" + (k * mu) + "," + (k * k * v) + ")\\)", "M1", "scale"),
      R("(a)", "\\(z=" + dots(z, 3) + "\\)", "M1", "z"),
      R("(a)", "\\(" + sf(p) + "\\)", "A1", "3 s.f."),
        R("(b)", "variance of a scaled single observation is " + (k * k) + " times, not " + k + " times", "B1", "compare")
    ], 4);
    o._chk = { z: z > 0 };
    return o;
  };

  G["A2-7-3"] = function (r) {
    const ma = pick(r, [140, 150, 160]), sa = pick(r, [10, 12, 15]), mb = pick(r, [180, 200]), sb = pick(r, [8, 10]), n = pick(r, [5, 6, 7]);
    const mu = mb + n * ma, va = n * sa * sa + sb * sb;
    const c = mu + 50;
    const z = (c - mu) / Math.sqrt(va);
    const p = 1 - Phi(z);
    const q = "The masses of apples are normally distributed with mean " + ma + " g and standard deviation " + sa + " g. The masses of empty boxes are normally distributed with mean " + mb + " g and standard deviation " + sb + " g. A box is filled with " + n + " randomly chosen apples. All masses are independent. Find the probability that the total mass of the box and its " + n + " apples is more than " + c + " g.";
    const o = pack(q, "Total \\(\\sim N(" + mu + ",\\," + va + ")\\): \\(" + sf(p) + "\\)", [
      R("", "mean \\(" + mb + "+" + n + "\\times" + ma + "=" + mu + "\\)", "M1", "mean"),
      R("", "variance \\(" + sb + "^2+" + n + "\\times" + sa + "^2=" + va + "\\)", "M1", "var"),
      R("", "\\(z=" + dots(z, 3) + "\\)", "M1", "z"),
      R("", "\\(" + sf(p) + "\\)", "A1", "3 s.f.")
    ], 4);
    o._chk = { mu: mu === mb + n * ma };
    return o;
  };

  G["A2-7-4"] = function (r) {
    const mA = pick(r, [3, 4, 5]), sA = pick(r, [0.6, 0.8]), mB = pick(r, [5, 6]), sB = pick(r, [1, 1.2]), nA = pick(r, [4, 5]), nB = pick(r, [3, 4]);
    const mu = nA * mA + nB * mB, va = nA * sA * sA + nB * sB * sB;
    const totCut = Math.round(mu + 2);
    const z = (totCut - mu) / Math.sqrt(va);
    const p = Phi(z);
    const k = 1.4;
    const mu2 = mB - k * mA, v2 = sB * sB + k * k * sA * sA;
    const z2 = (0 - mu2) / Math.sqrt(v2);
    const p2 = 1 - Phi(z2);
    function unit(n, w) { return n + " " + w + (n === 1 ? "" : "s"); }
    const q = "In a test, the time taken to answer each type A question is normally distributed with mean " + unit(mA, "minute") + " and standard deviation " + unit(sA, "minute") + "; for each type B question the time is normally distributed with mean " + unit(mB, "minute") + " and standard deviation " + unit(sB, "minute") + ". All times are independent.<br/>(a) A test has " + nA + " type A questions and " + nB + " type B questions. Find the probability that the total time is less than " + totCut + " minutes. [3]<br/>(b) One type A question and one type B question are chosen at random. Find the probability that the time for the type B question is more than 1.4 times the time for the type A question. [4]";
    const o = pack(q, "(a) \\(N(" + decn(mu) + ",\\," + decn(va) + ")\\): \\(" + sf(p) + "\\)   (b) \\(B-1.4A\\sim N(" + decn(mu2) + ",\\," + decn(v2) + ")\\): \\(" + sf(p2) + "\\)", [
      R("(a)", "mean and variance of the total", "M1", "moments"),
      R("(a)", "\\(z=" + dots(z, 3) + "\\)", "M1", "z"),
      R("(a)", "\\(" + sf(p) + "\\)", "A1", "3 s.f."),
      R("(b)", "\\(B-1.4A\\)", "M1", "form"),
      R("(b)", "mean \\(" + decn(mu2) + "\\), variance \\(" + decn(v2) + "\\)", "M1", "moments"),
      R("(b)", "\\(P>0\\)", "M1", "prob"),
      R("(b)", "\\(" + sf(p2) + "\\)", "A1", "3 s.f.")
    ], 7);
    o._chk = { mu: mu === nA * mA + nB * mB };
    return o;
  };

  G["A2-8-0"] = function (r) {
    const mx = pick(r, [28, 30, 32, 34, 36, 38]), vx = pick(r, [9, 16, 25, 36]), my = pick(r, [24, 26, 28, 30, 32]), vy = pick(r, [9, 16, 25, 36]);
    const md = mx - my, vd = vx + vy;
    const z = (0 - md) / Math.sqrt(vd);
    const p = 1 - Phi(z);
    const q = "\\(X\\sim N(" + mx + "," + vx + ")\\) and \\(Y\\sim N(" + my + "," + vy + ")\\) are independent. Find \\(P(X>Y)\\).";
    const o = pack(q, "\\(D\\sim N(" + md + "," + vd + ")\\): \\(" + sf(p) + "\\)", [
      R("", "\\(D=X-Y\\sim N(" + md + "," + vd + ")\\)", "M1", "diff"),
      R("", "\\(P(D>0)\\), \\(z=" + dots(-z, 3) + "\\)", "M1", "z"),
      R("", "\\(" + sf(p) + "\\)", "A1", "3 s.f.")
    ], 3);
    o._chk = { vd: vd === vx + vy };
    return o;
  };

  G["A2-8-1"] = function (r) {
    const md = pick(r, [2, 3, 4, 5, 6, 7, 8]), sd = pick(r, [3, 4, 5, 6, 7, 8]), d = pick(r, [1, 2, 3, 4]);
    const z1 = (-d - md) / sd, z2 = (d - md) / sd;
    const p = Phi(z2) - Phi(z1);
    const q = "Independent normals have difference \\(D\\sim N(" + md + "," + (sd * sd) + ")\\). Find \\(P(|D|<" + d + ")\\).";
    const o = pack(q, "\\(" + sf(p) + "\\)", [
      R("", "\\(P(" + (-d) + "<D<" + d + ")\\)", "M1", "abs"),
      R("", "\\(z=" + dots(z1, 3) + ",\\ " + dots(z2, 3) + "\\)", "M1", "z"),
      R("", "\\(" + sf(p) + "\\)", "A1", "3 s.f.")
    ], 3);
    o._chk = { p: p > 0 && p < 1 };
    return o;
  };

  G["A2-8-2"] = function (r) {
    const p82 = until(r, () => {
      const mb = pick(r, [9.9, 10, 10.05, 9.95, 10.02]), sb = pick(r, [0.05, 0.06, 0.08, 0.1]), mn = pick(r, [10.08, 10.1, 10.12, 10.15]), sn = pick(r, [0.05, 0.06, 0.08, 0.1]);
      const md = mn - mb, vd = sb * sb + sn * sn;
      const z0 = (0 - md) / Math.sqrt(vd);
      const p0 = 1 - Phi(z0);
      const z1 = (0.2 - md) / Math.sqrt(vd);
      const p1 = 1 - Phi(z1);
      if (!(p0 > 0.05 && p0 < 0.95) || !(p1 > 0.02 && p1 < 0.98)) return;
      if (Number(sf(p0)) >= 1 || Number(sf(p0)) <= 0) return;
      return { mb, sb, mn, sn, md, vd, p0, p1 };
    });
    const q = "Bolt diameters are \\(N(" + decn(p82.mb) + ",\\," + decn(p82.sb) + "^{2})\\) mm and nut (hole) diameters are \\(N(" + decn(p82.mn) + ",\\," + decn(p82.sn) + "^{2})\\) mm, independently. A bolt fits a nut if the nut diameter is greater than the bolt diameter.<br/>(a) Find the probability that a randomly chosen bolt fits a randomly chosen nut. [3]<br/>(b) Find the probability that the nut diameter exceeds the bolt diameter by more than 0.2 mm. [2]";
    const o = pack(q, "(a) \\(" + sf(p82.p0) + "\\)   (b) \\(" + sf(p82.p1) + "\\)", [
      R("(a)", "\\(D=N-B\\sim N(" + decn(p82.md) + ",\\," + decn(p82.vd) + ")\\)", "M1", "diff"),
      R("(a)", "\\(P(D>0)\\)", "M1", "prob"),
      R("(a)", "\\(" + sf(p82.p0) + "\\)", "A1", "3 s.f."),
      R("(b)", "\\(P(D>0.2)\\)", "M1", "tail"),
      R("(b)", "\\(" + sf(p82.p1) + "\\)", "A1", "3 s.f.")
    ], 5);
    o._chk = { vd: Math.abs(p82.vd - (p82.sb * p82.sb + p82.sn * p82.sn)) < 1e-12, p: p82.p0 > 0.05 && p82.p0 < 0.95 };
    return o;
  };

  G["A2-8-3"] = function (r) {
    const mu = pick(r, [24, 26, 28, 30, 32, 35, 40]), s = pick(r, [3, 4, 5, 6]), c = mu + s, n = pick(r, [5, 6, 8, 10, 12]), k = pick(r, [2, 3, 4]);
    const pz = 1 - Phi((c - mu) / s);
    const p = Cnk(n, k) * Math.pow(pz, k) * Math.pow(1 - pz, n - k);
    const q = "\\(X\\sim N(" + mu + "," + s + "^2)\\). " + n + " independent observations of \\(X\\) are taken. Find the probability that exactly " + k + " of them are greater than " + c + ".";
    const o = pack(q, "\\(p=" + sf(pz) + "\\); \\(\\binom{" + n + "}{" + k + "}" + ptex("p", k) + ptex("(1-p)", n - k) + "=" + sf(p) + "\\)", [
      R("", "\\(P(X>" + c + ")=P(Z>" + dots((c - mu) / s, 3) + ")\\)", "M1", "normal"),
      R("", "\\(p=" + sf(pz) + "\\)", "A1", "p"),
      R("", "\\(B(" + n + ",p)\\)", "M1", "binomial"),
      R("", "\\(P(Y=" + k + ")\\)", "M1", "pmf"),
      R("", "\\(" + sf(p) + "\\)", "A1", "3 s.f.")
    ], 5);
    o._chk = { p: p > 0 && p < 1 };
    return o;
  };

  G["A2-8-4"] = function (r) {
    const p84 = until(r, () => {
      const mL = pick(r, [62, 64, 66, 68, 70, 72]), sL = pick(r, [2.5, 3, 3.5, 4]), mS = pick(r, [48, 50, 52, 54, 56]), sS = pick(r, [2, 2.5, 3, 3.5]), k = 1.25;
      const mu = mL - k * mS, v = sL * sL + k * k * sS * sS;
      const z = (0 - mu) / Math.sqrt(v);
      const p = 1 - Phi(z);
      if (p > 0.9 || p < 0.15) return;
      return { mL, sL, mS, sS, k, mu, v, z, p };
    });
    const mL = p84.mL, sL = p84.sL, mS = p84.mS, sS = p84.sS, k = p84.k, mu = p84.mu, v = p84.v, p = p84.p;
    const n = 6;
    const p5 = Cnk(n, 5) * Math.pow(p, 5) * Math.pow(1 - p, 1) + Math.pow(p, 6);
    const q = "The masses of large eggs are \\(N(" + mL + ",\\," + decn(sL) + "^{2})\\) grams and the masses of small eggs are \\(N(" + mS + ",\\," + decn(sS) + "^{2})\\) grams, all independent.<br/>(a) One large egg and one small egg are chosen at random. Find the probability that the mass of the large egg is more than 1.25 times the mass of the small egg. [4]<br/>(b) This is done on each of 6 days, with new eggs each day. Find the probability that on at least 5 of the 6 days the mass of the large egg is more than 1.25 times the mass of the small egg. [3]";
    const o = pack(q, "(a) \\(" + sf(p) + "\\)   (b) \\(B(6,\\," + sf(p) + ")\\): \\(" + sf(p5) + "\\)", [
      R("(a)", "\\(L-1.25S\\)", "M1", "form"),
      R("(a)", "mean \\(" + decn(mu) + "\\), variance \\(" + decn(v) + "\\)", "M1", "moments"),
      R("(a)", "\\(P>0\\)", "M1", "prob"),
      R("(a)", "\\(" + sf(p) + "\\)", "A1", "3 s.f."),
      R("(b)", "\\(B(6,p)\\)", "M1", "binomial"),
      R("(b)", "\\(P(Y\\ge5)=P(5)+P(6)\\)", "M1", "tail"),
      R("(b)", "\\(" + sf(p5) + "\\)", "A1", "3 s.f.")
    ], 7);
    o._chk = { mu: Math.abs(mu - (mL - k * mS)) < 1e-12 };
    return o;
  };

  g.GENERATORS = G;
  g.mulberry = mulberry;
  g.fmt = { term, lin, quad, frac, ord, nstr, nice, sf };
})(typeof globalThis !== "undefined" ? globalThis : this);
