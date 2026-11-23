(function (root) {
  /* pkg17: typed answers may use U+2212 MINUS SIGN; treat it as "-". */
  function normMinus(s) {
    return String(s).replace(/\u2212/g, "-");
  }
  function parseFraction(t) {
    var m = /^([+-]?\d+)\s*\/\s*(\d+)$/.exec(t);
    if (!m) return null;
    var den = Number(m[2]);
    if (!den) return null;
    return Number(m[1]) / den;
  }
  function parseNum(s) {
    var t = normMinus(String(s || "")).replace(/[$,%\s]/g, "").replace(/,/g, "");
    if (!t) return NaN;
    var frac = parseFraction(t);
    if (frac != null) return frac;
    return Number(t);
  }
  function sfTol(av, sf) {
    if (!isFinite(av) || av === 0) return 0;
    return 0.5 * Math.pow(10, Math.floor(Math.log10(Math.abs(av))) - sf + 1);
  }
  function isOptIn(spec) {
    if (!spec) return false;
    var m = spec.accept_as;
    return m != null && m !== "";
  }
  function zeroPayload() {
    return { sign: 1, digits: "0", exp: 0, zero: true };
  }
  function parsePlainDecimal(t, sign) {
    var m = /^(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(t);
    if (!m) return null;
    var intp = m[1] || "";
    var frac = m[2] || "";
    if (!intp && !frac) return null;
    if (m[3] != null && m[3] !== "" && !/^[+-]?\d+$/.test(m[3])) return null;
    var sci = m[3] != null && m[3] !== "" ? parseInt(m[3], 10) : 0;
    if (!isFinite(sci)) return null;
    var digits = intp + frac;
    var i = 0;
    while (i < digits.length && digits.charAt(i) === "0") i += 1;
    if (i === digits.length) return zeroPayload();
    return {
      sign: sign,
      digits: digits.slice(i),
      exp: intp.length - i - 1 + sci,
      zero: false
    };
  }
  function parseDecimalText(raw) {
    var t = normMinus(String(raw == null ? "" : raw)).replace(/[$,%\s]/g, "");
    if (!t) return null;
    var sign = 1;
    if (t.charAt(0) === "+") t = t.slice(1);
    if (t.charAt(0) === "-") {
      sign = -1;
      t = t.slice(1);
    }
    if (!t) return null;
    var frac = parseFraction(t);
    if (frac != null) return payloadFromNumber(frac);
    if (/,/.test(t)) {
      if (!/^\d{1,3}(,\d{3})+(\.\d*)?(e[+-]?\d+)?$/i.test(t)) return null;
      t = t.replace(/,/g, "");
    }
    return parsePlainDecimal(t, sign);
  }
  function payloadFromNumber(x) {
    if (!isFinite(x)) return null;
    if (x === 0) return zeroPayload();
    return parseDecimalText(String(x));
  }
  function payloadFromGot(got) {
    if (typeof got === "string") return parseDecimalText(got);
    if (typeof got === "number") return payloadFromNumber(got);
    return null;
  }
  function roundPayload(p, n) {
    if (!p) return null;
    if (p.zero) return zeroPayload();
    var d = p.digits;
    while (d.length < n + 1) d += "0";
    var head = d.slice(0, n);
    var next = d.charAt(n);
    var up = next > "5" || next === "5";
    if (!up) return { sign: p.sign, digits: head, exp: p.exp, zero: false };
    var arr = head.split("");
    var carry = 1;
    var k;
    for (k = arr.length - 1; k >= 0; k--) {
      var v = arr[k].charCodeAt(0) - 48 + carry;
      if (v >= 10) {
        arr[k] = "0";
        carry = 1;
      } else {
        arr[k] = String(v);
        carry = 0;
        break;
      }
    }
    if (carry) return { sign: p.sign, digits: "1" + Array(n).join("0"), exp: p.exp + 1, zero: false };
    return { sign: p.sign, digits: arr.join(""), exp: p.exp, zero: false };
  }
  function payloadEq(a, b) {
    if (!a || !b) return false;
    if (a.zero && b.zero) return true;
    if (a.zero || b.zero) return false;
    return a.sign === b.sign && a.digits === b.digits && a.exp === b.exp;
  }
  function roundSf(x, n) {
    var r = roundPayload(payloadFromNumber(x), n);
    if (!r) return NaN;
    if (r.zero) return 0;
    return r.sign * Number(r.digits.charAt(0) + "." + r.digits.slice(1) + "e" + r.exp);
  }
  function integerFromPayload(p) {
    if (!p) return null;
    if (p.zero) return 0;
    if (p.exp < 0) return null;
    var frac = p.digits.length > p.exp + 1 ? p.digits.slice(p.exp + 1) : "";
    if (/[^0]/.test(frac)) return null;
    var intDigits = p.digits.slice(0, p.exp + 1);
    while (intDigits.length <= p.exp) intDigits += "0";
    var n = p.sign * Number(intDigits);
    if (!isFinite(n) || n !== Math.trunc(n)) return null;
    return n;
  }
  function acceptInteger(got, exact) {
    if (!isFinite(exact) || exact !== Math.trunc(exact)) return false;
    var n;
    if (typeof got === "number") {
      n = got;
      if (!isFinite(n) || n !== Math.trunc(n)) return false;
      return n === exact;
    }
    n = integerFromPayload(parseDecimalText(got));
    if (n == null) return false;
    return n === exact;
  }
  function acceptSf(got, spec, exact) {
    var n = spec && spec.sf;
    if (!isFinite(n) || n !== Math.floor(n) || n < 1) return false;
    if (!isFinite(exact)) return false;
    var want = roundPayload(payloadFromNumber(exact), n);
    var gotP = payloadFromGot(got);
    if (!gotP) return false;
    return payloadEq(roundPayload(gotP, n), want);
  }
  function acceptLegacy(got, spec, exact) {
    if (!isFinite(got)) return false;
    var want = exact;
    if (spec.tolerance_sf != null) return Math.abs(got - want) <= sfTol(want, spec.tolerance_sf) + 1e-9;
    if (spec.tolerance_range) {
      var lo = spec.tolerance_range[0];
      var hi = spec.tolerance_range[1];
      if (got >= lo - 1e-9 && got <= hi + 1e-9) return true;
      return (spec.also || []).some(function (x) { return Math.abs(got - x) < 1e-9; });
    }
    var tol = spec.tolerance;
    if (tol == null) tol = 1e-9;
    return Math.abs(got - want) <= Number(tol) + 1e-12;
  }
  function accept(got, spec, exact) {
    spec = spec || {};
    if (isOptIn(spec)) {
      if (spec.accept_as === "integer") return acceptInteger(got, exact);
      if (spec.accept_as === "sf") return acceptSf(got, spec, exact);
      return false;
    }
    var g = typeof got === "number" ? got : parseNum(got);
    return acceptLegacy(g, spec, exact);
  }
  function near(got, want, tol) {
    var a = Number(typeof got === "string" ? normMinus(got).trim() : got);
    var b = Number(want);
    if (!isFinite(a) || !isFinite(b)) return false;
    return Math.abs(a - b) <= Number(tol);
  }
  function gradeNumeric(raw, spec, exact) {
    spec = spec || {};
    if (exact == null) exact = spec.answer;
    if (isOptIn(spec)) return accept(raw, spec, exact);
    return near(raw, exact, spec.tolerance);
  }
  var api = {
    parseNum: parseNum,
    sfTol: sfTol,
    roundSf: roundSf,
    isOptIn: isOptIn,
    accept: accept,
    near: near,
    gradeNumeric: gradeNumeric,
    parseDecimalText: parseDecimalText
  };
  root.msAnswerAccept = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : global);
