(function (root) {
  var INVALID = "invalid-display";
  function parsePlain(t, sign) {
    var m = /^(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(t);
    if (!m) return null;
    var intp = m[1] || "";
    var frac = m[2] || "";
    if (!intp && !frac) return null;
    var sci = m[3] != null && m[3] !== "" ? parseInt(m[3], 10) : 0;
    if (!isFinite(sci)) return null;
    var digits = intp + frac;
    var i = 0;
    while (i < digits.length && digits.charAt(i) === "0") i += 1;
    if (i === digits.length) return { sign: 1, digits: "0", exp: 0, zero: true };
    return {
      sign: sign,
      digits: digits.slice(i),
      exp: intp.length - i - 1 + sci,
      zero: false
    };
  }
  function payloadFromNumber(x) {
    if (!isFinite(x)) return null;
    if (x === 0) return { sign: 1, digits: "0", exp: 0, zero: true };
    var sign = x < 0 ? -1 : 1;
    return parsePlain(String(Math.abs(x)), sign);
  }
  function roundPayload(p, n) {
    if (!p) return null;
    if (p.zero) return { sign: 1, digits: "0", exp: 0, zero: true };
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
  function formatSf3z(x) {
    if (x == null || x !== x || !isFinite(Number(x))) return INVALID;
    var n = Number(x);
    var r = roundPayload(payloadFromNumber(n), 3);
    if (!r) return INVALID;
    if (r.zero) return "0.00";
    var mag = Math.pow(10, r.exp);
    if (mag < 1e-6 || mag >= 1e12) {
      var sci = r.digits.charAt(0) + "." + r.digits.slice(1) + "e" + (r.exp < 0 ? "" : "+") + r.exp;
      return (r.sign < 0 ? "-" : "") + sci;
    }
    var d = r.digits;
    var e = r.exp;
    var out;
    if (e >= 0) {
      var intLen = e + 1;
      if (intLen >= 3) out = d + Array(intLen - 2).join("0");
      else out = d.slice(0, intLen) + "." + d.slice(intLen);
    } else {
      out = "0." + Array(-e).join("0") + d;
    }
    return (r.sign < 0 ? "-" : "") + out;
  }
  function formatDp4(x) {
    if (x == null || x !== x || !isFinite(Number(x))) return INVALID;
    var n = Number(x);
    if (Math.abs(n) >= 1e12) return INVALID;
    var p = payloadFromNumber(n);
    if (!p) return INVALID;
    if (p.zero) return "0.0000";
    var d = p.digits;
    var e = p.exp;
    var before = e + 1;
    var fracNeed = 5;
    var padded;
    if (before >= 0) padded = d + Array(Math.max(0, before + fracNeed - d.length) + 1).join("0");
    else {
      padded = Array(-before + 1).join("0") + d;
      before = 0;
    }
    if (padded.length < before + 5) padded += Array(before + 6 - padded.length).join("0");
    var intDigs = padded.slice(0, before) || "0";
    var frac = padded.slice(before);
    while (frac.length < 5) frac += "0";
    var four = frac.slice(0, 4);
    var fifth = frac.charAt(4);
    var up = fifth > "5" || fifth === "5";
    if (up) {
      var raw = intDigs + four;
      var arr = raw.split("");
      var carry = 1;
      var i;
      for (i = arr.length - 1; i >= 0; i--) {
        var v = arr[i].charCodeAt(0) - 48 + carry;
        if (v >= 10) {
          arr[i] = "0";
          carry = 1;
        } else {
          arr[i] = String(v);
          carry = 0;
          break;
        }
      }
      if (carry) arr.unshift("1");
      raw = arr.join("");
      if (raw.length > intDigs.length + 4) {
        intDigs = raw.slice(0, raw.length - 4);
        four = raw.slice(raw.length - 4);
      } else {
        while (raw.length < 5) raw = "0" + raw;
        intDigs = raw.slice(0, raw.length - 4) || "0";
        four = raw.slice(raw.length - 4);
      }
    }
    var val = Number(intDigs + "." + four);
    if (Math.abs(val) >= 1e12) return INVALID;
    if (val === 0) return "0.0000";
    return (p.sign < 0 && val !== 0 ? "-" : "") + intDigs.replace(/^0+(?=\d)/, "") + "." + four;
  }
  function authoringCaptionRe() {
    return /static redraw|source diagram|only parts?\s+\([^)]+\)\s+(is|are) asked|printed diagram is also in the official|no figure field|authoring note/i;
  }

  function stripAuthoringCaptions(html) {
    return String(html || "")
      .replace(/<figcaption\b[^>]*>[\s\S]*?<\/figcaption>/gi, function (block) {
        const text = block.replace(/<[^>]+>/g, " ");
        return authoringCaptionRe().test(text) ? "" : block;
      })
      .replace(/<(title|desc)\b([^>]*)>([\s\S]*?)<\/\1>/gi, function (block, tag, attrs, inner) {
        if (authoringCaptionRe().test(inner)) {
          return "<" + tag + attrs + ">" + inner.replace(/source diagram,\s*static redraw/ig, "official diagram").replace(/static redraw/ig, "") + "</" + tag + ">";
        }
        return block;
      });
  }

  function newlinesToBrOutsideSvg(html) {
    const s = String(html || "");
    const parts = [];
    const re = /<svg\b[\s\S]*?<\/svg>/gi;
    let last = 0;
    let m;
    while ((m = re.exec(s))) {
      parts.push(s.slice(last, m.index).replace(/\n/g, "<br>"));
      parts.push(m[0].replace(/\n+/g, " "));
      last = m.index + m[0].length;
    }
    parts.push(s.slice(last).replace(/\n/g, "<br>"));
    return parts.join("");
  }

  function stemToHtml(html) {
    return newlinesToBrOutsideSvg(stripAuthoringCaptions(html));
  }

  var api = {
    INVALID: INVALID,
    formatSf3z: formatSf3z,
    formatDp4: formatDp4,
    payloadFromNumber: payloadFromNumber,
    authoringCaptionRe: authoringCaptionRe,
    stripAuthoringCaptions: stripAuthoringCaptions,
    newlinesToBrOutsideSvg: newlinesToBrOutsideSvg,
    stemToHtml: stemToHtml,
  };
  root.msDisplayFmt = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : global);
