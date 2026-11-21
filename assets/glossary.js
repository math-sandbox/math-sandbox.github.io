(function (root) {
  var data = null;
  var pop = null;
  var openBtn = null;
  var popId = "gw-pop";
  var quietUntil = 0;
  var SKIP = "h1,h2,h3,h4,h5,h6,summary,button,input,textarea,select,table,thead,tbody,tr,th,td,.calc,.calculator,.key-words,.chips,.chip,.mark,.src,.marks-key,.sol,.final,ol.steps,details,mjx-container,script,style,.gw,.exam-vocab,.gw-pop,.practice-card";

  function load() {
    if (data) return Promise.resolve(data);
    return fetch("data/glossary.json", { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("glossary");
      return r.json();
    }).then(function (j) {
      data = Array.isArray(j) ? j : (j.entries || []);
      return data;
    }).catch(function () {
      data = [];
      return data;
    });
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function reEsc(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function skipped(node) {
    if (!node || !node.closest) return true;
    if (node.closest(SKIP)) return true;
    if (node.closest("a")) return true;
    return false;
  }

  function textNodes(rootEl) {
    var out = [];
    var w = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (skipped(n.parentNode)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = w.nextNode())) out.push(n);
    return out;
  }

  function mathMask(text) {
    var mask = [];
    var i = 0;
    var inDisp = false;
    var inIn = false;
    var inBr = false;
    for (i = 0; i < text.length; i++) mask[i] = false;
    for (i = 0; i < text.length; i++) {
      if (!inIn && !inBr && text.substr(i, 2) === "$$") {
        inDisp = !inDisp;
        mask[i] = true;
        if (i + 1 < text.length) mask[i + 1] = true;
        i += 1;
        continue;
      }
      if (!inDisp && !inBr && text.substr(i, 2) === "\\(") {
        inIn = true;
        mask[i] = true;
        mask[i + 1] = true;
        i += 1;
        continue;
      }
      if (inIn && text.substr(i, 2) === "\\)") {
        mask[i] = true;
        mask[i + 1] = true;
        inIn = false;
        i += 1;
        continue;
      }
      if (!inDisp && !inIn && text.substr(i, 2) === "\\[") {
        inBr = true;
        mask[i] = true;
        mask[i + 1] = true;
        i += 1;
        continue;
      }
      if (inBr && text.substr(i, 2) === "\\]") {
        mask[i] = true;
        mask[i + 1] = true;
        inBr = false;
        i += 1;
        continue;
      }
      if (inDisp || inIn || inBr) mask[i] = true;
    }
    return mask;
  }

  function phrasePat(m) {
    return new RegExp("(?<![\\w-])" + m.split(/\s+/).map(reEsc).join("\\s+") + "(?![\\w-])", "gi");
  }

  function masked(mask, a, b) {
    var i;
    for (i = a; i < b; i++) if (mask[i]) return true;
    return false;
  }

  function candsIn(text, entries, used, mask) {
    var out = [];
    var i, j, mo, pat, m;
    for (i = 0; i < entries.length; i++) {
      var e = entries[i];
      if (used[e.id]) continue;
      var list = e.match || [];
      for (j = 0; j < list.length; j++) {
        m = list[j];
        pat = phrasePat(m);
        while ((mo = pat.exec(text))) {
          if (masked(mask, mo.index, mo.index + mo[0].length)) continue;
          out.push({ start: mo.index, end: mo.index + mo[0].length, e: e, hit: mo[0] });
        }
      }
    }
    out.sort(function (a, b) {
      if (a.start !== b.start) return a.start - b.start;
      return (b.end - b.start) - (a.end - a.start);
    });
    return out;
  }

  function pick(cands, used) {
    var chosen = [];
    var pos = -1;
    var i;
    for (i = 0; i < cands.length; i++) {
      var c = cands[i];
      if (c.start < pos) continue;
      if (used[c.e.id]) continue;
      if (chosen.some(function (x) { return x.e.id === c.e.id; })) continue;
      chosen.push(c);
      pos = c.end;
    }
    return chosen;
  }

  function wrap(node, start, end, entry) {
    var mid = node.nodeValue.slice(start, end);
    var after = node.splitText(start);
    after.splitText(mid.length);
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gw" + (entry.type === "phrase" ? " gw-phrase" : " gw-term");
    btn.setAttribute("role", "button");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("data-id", entry.id);
    btn.id = "gw-" + entry.id;
    btn.textContent = after.nodeValue;
    after.parentNode.replaceChild(btn, after);
    return btn;
  }

  function markPanel(panel, entries, used) {
    if (!panel) return;
    var nodes = textNodes(panel);
    var i;
    for (i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (!node.parentNode) continue;
      var text = node.nodeValue;
      var chosen = pick(candsIn(text, entries, used, mathMask(text)), used);
      var k;
      for (k = chosen.length - 1; k >= 0; k--) {
        wrap(node, chosen[k].start, chosen[k].end, chosen[k].e);
        used[chosen[k].e.id] = true;
      }
    }
  }

  function eligible(entry, secId) {
    if (entry.type === "trap") return false;
    if (entry.type === "term") return (entry.sections || []).indexOf(secId) >= 0;
    if (entry.type === "command" || entry.type === "phrase") return true;
    return false;
  }

  function markSection(sec) {
    return load().then(function (g) {
      var secId = sec.getAttribute("data-sec") || sec.getAttribute("data-section");
      var used = {};
      var entries = g.filter(function (e) { return eligible(e, secId); });
      ["learn", "examples", "practice"].forEach(function (name) {
        markPanel(sec.querySelector('[data-panel="' + name + '"]'), entries, used);
      });
      wireChips(sec, g);
    });
  }

  function finePointer() {
    return window.matchMedia && window.matchMedia("(pointer: fine)").matches;
  }

  function ensurePop() {
    if (pop) return pop;
    pop = document.createElement("div");
    pop.className = "gw-pop";
    pop.id = popId;
    pop.hidden = true;
    pop.setAttribute("role", "tooltip");
    document.body.appendChild(pop);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closePop(true);
    });
    document.addEventListener("pointerdown", function (e) {
      if (!pop.hidden && !pop.contains(e.target) && !(openBtn && openBtn.contains(e.target))) closePop(false);
    });
    window.addEventListener("scroll", function () {
      if (Date.now() < quietUntil) return;
      if (!pop.hidden) closePop(false);
    }, true);
    pop.addEventListener("mouseenter", function () {});
    pop.addEventListener("mouseleave", function () {
      if (finePointer()) closePop(false);
    });
    return pop;
  }

  function closePop(fromEsc) {
    var btn = openBtn;
    if (pop) pop.hidden = true;
    if (btn) {
      btn.setAttribute("aria-expanded", "false");
      btn.removeAttribute("aria-describedby");
    }
    openBtn = null;
    if (fromEsc && btn && btn.focus) btn.focus();
  }

  function placePop(btn) {
    var box = ensurePop();
    var r = btn.getBoundingClientRect();
    var vw = Math.max(320, window.innerWidth || 320);
    var vh = window.innerHeight || 640;
    var maxW = Math.min(280, vw - 16);
    box.style.maxWidth = maxW + "px";
    box.style.left = "0px";
    box.style.top = "0px";
    box.hidden = false;
    var w = box.offsetWidth;
    var h = box.offsetHeight;
    var x = r.left;
    var y = r.bottom + 6;
    if (x + w > vw - 8) x = vw - 8 - w;
    if (x < 8) x = 8;
    if (y + h > vh - 8) y = r.top - 6 - h;
    if (y < 8) y = 8;
    box.style.left = x + "px";
    box.style.top = y + "px";
  }

  function showPop(btn) {
    var id = btn.getAttribute("data-id");
    load().then(function (g) {
      var e = g.find(function (x) { return x.id === id; });
      if (!e) return;
      if (openBtn && openBtn !== btn) {
        openBtn.setAttribute("aria-expanded", "false");
        openBtn.removeAttribute("aria-describedby");
      }
      var box = ensurePop();
      box.innerHTML = "<div class=\"gw-pop-term\">" + esc(e.term) + "</div><div class=\"gw-pop-def\">" + (e.definition || "") + "</div>" +
        (e.note ? "<div class=\"gw-pop-note\">" + esc(e.note) + "</div>" : "") +
        "<a class=\"gw-pop-link\" href=\"vocabulary.html#" + encodeURIComponent(e.id) + "\">Vocabulary</a>";
      btn.setAttribute("aria-expanded", "true");
      btn.setAttribute("aria-describedby", popId);
      openBtn = btn;
      placePop(btn);
      if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([box]);
    });
  }

  function bindMarks(rootEl) {
    (rootEl || document).querySelectorAll(".gw").forEach(function (btn) {
      if (btn.getAttribute("data-bound")) return;
      btn.setAttribute("data-bound", "1");
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (openBtn === btn && pop && !pop.hidden) closePop(false);
        else showPop(btn);
      });
      if (finePointer()) {
        btn.addEventListener("mouseenter", function () { showPop(btn); });
        btn.addEventListener("mouseleave", function (e) {
          var to = e.relatedTarget;
          if (pop && to && pop.contains(to)) return;
          closePop(false);
        });
      }
    });
  }

  function jumpTo(sec, entry) {
    var mark = sec.querySelector('.gw[data-id="' + entry.id + '"]');
    if (mark) {
      var panel = mark.closest("[data-panel]");
      var tab = panel && panel.getAttribute("data-panel");
      var toggle = sec.querySelector(".sec-toggle");
      if (toggle && !sec.classList.contains("open")) toggle.click();
      var tabBtn = tab && sec.querySelector('[data-tab="' + tab + '"]');
      if (tabBtn) tabBtn.click();
      quietUntil = Date.now() + 600;
      mark.scrollIntoView({ block: "center" });
      showPop(mark);
      return;
    }
    location.href = "vocabulary.html#" + encodeURIComponent(entry.id);
  }

  function chipNames(e) {
    var names = [e.term, String(e.term || "").replace(/\s*\(.*?\)/g, "")].concat(e.match || []);
    return names.map(function (n) { return String(n).toLowerCase().trim(); }).filter(Boolean);
  }

  function wireChips(sec, entries) {
    var byTerm = {};
    entries.forEach(function (e) {
      chipNames(e).forEach(function (n) { byTerm[n] = e; });
    });
    sec.querySelectorAll(".chip").forEach(function (chip) {
      var e = byTerm[chip.textContent.trim().toLowerCase()];
      if (!e) return;
      if (chip.tagName !== "BUTTON") {
        var b = document.createElement("button");
        b.type = "button";
        b.className = chip.className;
        b.textContent = chip.textContent;
        chip.parentNode.replaceChild(b, chip);
        chip = b;
      }
      chip.setAttribute("data-id", e.id);
      chip.addEventListener("click", function (ev) {
        ev.preventDefault();
        jumpTo(sec, e);
      });
    });
  }

  function chapterIds() {
    return [...document.querySelectorAll("#chapter .sec")].map(function (s) { return s.getAttribute("data-sec"); }).filter(Boolean);
  }

  function finishChapter() {
    return load().then(function (g) {
      bindMarks(document.getElementById("chapter"));
      var ids = chapterIds();
      var host = document.getElementById("chapter");
      if (!host || host.querySelector(".exam-vocab")) return;
      var groups = { term: [], command: [], phrase: [], trap: [] };
      g.forEach(function (e) {
        var secs = e.sections || [];
        var here = secs.some(function (s) { return ids.indexOf(s) >= 0; });
        if (e.type === "term" && here) groups.term.push(e);
        else if (e.type === "trap" && here) groups.trap.push(e);
        else if (e.type === "command") groups.command.push(e);
        else if (e.type === "phrase") groups.phrase.push(e);
      });
      if (!groups.term.length && !groups.trap.length) return;
      var box = document.createElement("section");
      box.className = "exam-vocab";
      box.innerHTML = "<h2>Exam vocabulary</h2>";
      [["Terms", "term"], ["Command words", "command"], ["Exam phrases", "phrase"], ["Traps", "trap"]].forEach(function (pair) {
        var list = groups[pair[1]];
        if (!list.length) return;
        var h = document.createElement("h3");
        h.textContent = pair[0];
        box.appendChild(h);
        var ul = document.createElement("ul");
        list.forEach(function (e) {
          var li = document.createElement("li");
          li.innerHTML = "<a href=\"vocabulary.html#" + encodeURIComponent(e.id) + "\">" + esc(e.term) + "</a> — " + (e.definition || "") +
            (e.note ? " <span class=\"gw-pop-note\">" + esc(e.note) + "</span>" : "");
          ul.appendChild(li);
        });
        box.appendChild(ul);
      });
      host.appendChild(box);
      if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([box]);
    });
  }

  function renderPage() {
    var host = document.getElementById("vocab");
    if (!host) return;
    load().then(function (g) {
      var groups = [
        ["Terms", "term"],
        ["Command words", "command"],
        ["Exam phrases", "phrase"],
        ["Traps", "trap"]
      ];
      host.innerHTML = groups.map(function (pair) {
        var list = g.filter(function (e) { return e.type === pair[1]; });
        if (!list.length) return "";
        return "<h2>" + esc(pair[0]) + "</h2><ul class=\"vocab-list\">" + list.map(function (e) {
          var links = (e.sections || []).map(function (s) {
            var ch = s.replace(/\.\d+$/, "");
            var course = s.split("-")[0];
            return "<a class=\"vocab-sec\" href=\"chapter.html?c=" + encodeURIComponent(course) + "&ch=" + encodeURIComponent(ch) + "#" + encodeURIComponent(s) + "-learn\">" + esc(s) + "</a>";
          }).join(" ");
          return "<li id=\"" + esc(e.id) + "\"><strong>" + esc(e.term) + "</strong> — " + (e.definition || "") +
            (e.note ? " <span class=\"gw-pop-note\">" + esc(e.note) + "</span>" : "") +
            (links ? " <span class=\"vocab-secs\">" + links + "</span>" : "") + "</li>";
        }).join("") + "</ul>";
      }).join("");
      if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([host]);
      if (location.hash) {
        var el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (el) el.scrollIntoView();
      }
    });
  }

  var api = { load: load, markSection: markSection, finishChapter: finishChapter, renderPage: renderPage, bindMarks: bindMarks };
  root.msGlossary = api;
  if (typeof document !== "undefined") {
    if (document.getElementById("vocab")) {
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderPage);
      else renderPage();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
