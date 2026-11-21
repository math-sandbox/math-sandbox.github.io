(function () {
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function getJSON(url) {
    return fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error(url);
      return r.json();
    });
  }
  function bookSpec(entry) {
    if (typeof entry === "string") return { id: entry, papers: null };
    return { id: entry.id, papers: entry.papers || null };
  }
  function paperOk(papers, paper) {
    if (!papers) return true;
    if (!paper) return true;
    return papers.indexOf(paper) >= 0;
  }
  function chapterOk(ch, papers) {
    if (!papers) return true;
    if (paperOk(papers, ch.paper) && ch.paper !== "P2") return true;
    return (ch.sections || []).some(function (s) { return paperOk(papers, s.paper); });
  }
  function visSecs(ch, papers) {
    return (ch.sections || []).filter(function (s) {
      return paperOk(papers, s.paper) && !/-review$/.test(s.id || "");
    });
  }
  function paperBadge(ch, papers) {
    var seen = [ch.paper].concat(visSecs(ch, papers).map(function (s) { return s.paper; }));
    return seen.indexOf("P2 and P3") >= 0 ? "P2–3" : "";
  }
  function weekFor(chId, weeks) {
    for (var i = 0; i < (weeks || []).length; i++) {
      var refs = weeks[i].refs || [];
      for (var j = 0; j < refs.length; j++) {
        if (refs[j].chapter === chId) return weeks[i].week;
      }
    }
    return null;
  }
  function firstClass(courseId, map) {
    var keys = Object.keys(map || {});
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] !== "Y1" && map[keys[i]] === courseId) return keys[i];
    }
    return "";
  }
  function heading(id) {
    if (id === "IGCSE") return "IGCSE 0580";
    if (id === "AS") return "AS 9709 (P1 + S1)";
    if (id === "A2") return "A2 9709 (P3 + S2)";
    return id;
  }
  function filterLabel(id) {
    if (id === "P23") return "P3";
    return id;
  }
  function igcseFoot(courseId) {
    var f = document.getElementById("foot");
    if (!f) return;
    if (courseId === "IGCSE") f.textContent = "Independent learning resource. Not affiliated with any exam board.";
    else f.textContent = "Independent learning resource aligned with the 9709 syllabus. Not affiliated with any exam board.";
  }
  function bookById(books, id) {
    return (books.books || []).find(function (b) { return b.id === id; });
  }
  function courseBooks(spec, books) {
    var out = [];
    (spec.books || []).forEach(function (entry) {
      var s = bookSpec(entry);
      var book = bookById(books, s.id);
      if (!book) return;
      var chs = (book.chapters || []).filter(function (ch) { return chapterOk(ch, s.papers); });
      out.push({ id: s.id, papers: s.papers, chapters: chs });
    });
    return out;
  }
  function hasTheory(index, secId) {
    return !!theoryUrl(index, secId);
  }
  function hasPractice(index, secId) {
    return !!(index && index.practice && index.practice[secId]);
  }
  // MERGE: set data/published.json PACKAGE2_DATE / PACKAGE4_DATE to the UTC calendar day this PR lands on main.
  function publishedOn(pub, secId) {
    if (!pub || !pub.sections) return "";
    var raw = pub.sections[secId];
    if (!raw) return "";
    if (/^PACKAGE\d+_DATE$/.test(raw)) return pub[raw] || "";
    return raw;
  }
  function isRecent(pub, secId) {
    var day = publishedOn(pub, secId);
    if (!day) return false;
    var t = Date.parse(day + "T00:00:00Z");
    if (!isFinite(t)) return false;
    var days = Number(pub.windowDays) > 0 ? Number(pub.windowDays) : 7;
    var age = Date.now() - t;
    return age >= 0 && age < days * 86400000;
  }
  function newKind(pub, secId) {
    if (!isRecent(pub, secId)) return "";
    return secId === "IGCSE-17.3" ? "practice" : "new";
  }
  function newBadge(kind) {
    if (!kind) return "";
    return '<span class="badge new">' + (kind === "practice" ? "New practice" : "New") + "</span>";
  }
  function rowHTML(ch, papers, week, courseId, cls, archive, theory, pub) {
    var badge = paperBadge(ch, papers);
    var parts = [esc(ch.num) + ". " + esc(ch.title), "pp." + ch.start + "–" + ch.end];
    var extra = badge ? '<span class="badge">' + esc(badge) + "</span>" : "";
    var chHref = "chapter.html?c=" + encodeURIComponent(courseId) + "&ch=" + encodeURIComponent(ch.id);
    var secs = visSecs(ch, papers);
    var learnSecs = secs.filter(function (s) { return hasTheory(theory, s.id); });
    var pracSecs = secs.filter(function (s) { return hasPractice(theory, s.id); });
    var live = learnSecs.length + pracSecs.length > 0;
    var newKinds = secs.map(function (s) { return newKind(pub, s.id); }).filter(Boolean);
    var rowNew = newKinds.indexOf("new") >= 0 ? "new" : (newKinds.indexOf("practice") >= 0 ? "practice" : "");
    extra += newBadge(rowNew);
    var bits = [];
    if (learnSecs.length) {
      bits.push('<a href="' + esc(chHref + "#" + learnSecs[0].id + "-learn") + '">Learn</a>');
    }
    if (pracSecs.length) {
      bits.push('<a href="' + esc(chHref + "#" + pracSecs[0].id + "-practice") + '">Practice</a>');
    }
    if (!learnSecs.length && !pracSecs.length) bits.push('<span class="soon">Soon</span>');
    var actions = bits.length
      ? '<span class="ch-actions">' + bits.map(function (b) { return '<span class="ch-action">' + b + "</span>"; }).join("") + "</span>"
      : "";
    if (!learnSecs.length && !pracSecs.length && week == null) {
      if (archive && archive.chapters && archive.chapters.indexOf(ch.id) >= 0) {
        actions = '<span class="soon">' + esc(archive.label || "Y1") + "</span>";
      } else {
        actions = '<span class="soon">Soon</span>';
      }
    }
    var rowCls = "ch-row" + (live ? " has-live" : "") + (rowNew ? " has-new" : "");
    return '<div class="' + rowCls + '"><a href="' + esc(chHref) + '">' + parts.join(" · ") + "</a>" + (extra ? " " + extra : "") + " · " + actions + "</div>";
  }
  function renderCourse(courseId, books, courses, schedule, filter, theory, pub) {
    var spec = (courses.courses || []).find(function (c) { return c.id === courseId; });
    var box = document.getElementById("list");
    var title = document.getElementById("title");
    if (!spec || !box) {
      if (box) box.innerHTML = "<p>Unknown course.</p>";
      return;
    }
    title.textContent = heading(courseId);
    document.title = heading(courseId) + " · Math Sandbox";
    document.getElementById("tagline").textContent = courseId === "IGCSE" ? "Core and extended textbook chapters" : "";
    igcseFoot(courseId);
    var packs = courseBooks(spec, books);
    var tabs = document.getElementById("book-filter");
    if (tabs && packs.length > 1) {
      var ids = [""].concat(packs.map(function (p) { return p.id; }));
      tabs.innerHTML = ids.map(function (id) {
        var lab = id ? filterLabel(id) : "All";
        return '<button class="tab' + (filter === id ? " active" : "") + '" data-book="' + esc(id) + '">' + esc(lab) + "</button>";
      }).join("");
      tabs.querySelectorAll(".tab").forEach(function (btn) {
        btn.onclick = function () {
          var next = btn.getAttribute("data-book") || "";
          history.replaceState(null, "", "course.html?c=" + encodeURIComponent(courseId) + (next ? "&book=" + encodeURIComponent(next) : ""));
          renderCourse(courseId, books, courses, schedule, next, theory, pub);
        };
      });
    } else if (tabs) tabs.innerHTML = "";
    var weeks = ((schedule.courses || {})[courseId] || {}).weeks || [];
    var cls = firstClass(courseId, courses.classToCourse);
    var shown = filter ? packs.filter(function (p) { return p.id === filter; }) : packs;
    box.innerHTML = shown.map(function (pack) {
      var head = packs.length > 1 ? "<h2>" + esc(filterLabel(pack.id)) + "</h2>" : "";
      var rows = pack.chapters.map(function (ch) {
        return rowHTML(ch, pack.papers, weekFor(ch.id, weeks), courseId, cls, spec.archive, theory, pub);
      }).join("");
      return head + (rows || "<p>No chapters.</p>");
    }).join("");
  }
  function theoryUrl(index, secId) {
    if (!index || !index.sections) return "";
    var v = index.sections[secId];
    if (!v) return "";
    if (v === true) return "content/theory/" + secId + ".html";
    return String(v);
  }
  function node(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function firstSentence(text) {
    var t = String(text || "").replace(/\s+/g, " ").trim();
    var m = t.match(/^.*?[.!?](?=\s|$)/);
    return m ? m[0] : t;
  }
  function wrapHScroll(root) {
    var scope = root || document;
    function wrap(el) {
      if (!el || el.closest(".h-scroll, .ms-w, .viz-table, .viz-ladder, .week-days")) return;
      var d = document.createElement("div");
      d.className = "h-scroll";
      d.tabIndex = 0;
      d.setAttribute("role", "region");
      d.setAttribute("aria-label", "Scroll horizontally to see the full table or expression");
      el.parentNode.insertBefore(d, el);
      d.appendChild(el);
    }
    scope.querySelectorAll("table").forEach(wrap);
    scope.querySelectorAll(".h-scroll").forEach(function (w) {
      w.classList.toggle("h-scroll-wide", w.scrollWidth > w.clientWidth + 2);
    });
  }
  function mathColumn(n) {
    var p;
    for (p = n.parentElement; p; p = p.parentElement) {
      var s = window.getComputedStyle(p);
      if (s.overflowX === "hidden" || s.overflowX === "clip") return p;
    }
    return n.closest(".pc-step-tex") || n.closest(".practice-card") || n.closest(".worked-example") || n.closest("[role=tabpanel]") || n.closest(".theory") || n.closest("#app") || n.parentElement;
  }
  function fitMath() {
    wrapHScroll(document.getElementById("chapter") || document);
    document.querySelectorAll("#chapter mjx-container, .theory mjx-container, .practice-card mjx-container, #app mjx-container").forEach(function (n) {
      if (n.closest(".h-scroll")) return;
      n.style.fontSize = "";
      n.style.display = "inline-block";
      n.style.maxWidth = "none";
      n.style.overflowX = "visible";
      n.style.overflowY = "";
      var w = n.scrollWidth;
      n.style.display = "";
      n.style.maxWidth = "";
      n.style.overflowX = "";
      var box = mathColumn(n);
      var hr = box ? box.getBoundingClientRect() : { right: 0, width: 0 };
      var nr = n.getBoundingClientRect();
      var room = Math.max(0, (hr.right || 0) - (nr.left || 0) - 4);
      if (n.getAttribute("display") === "true") {
        if (room && w > room) {
          var scale = room / w;
          if (scale >= 0.75) n.style.fontSize = (scale * 100) + "%";
          else {
            n.style.display = "block";
            n.style.maxWidth = room + "px";
            n.style.overflowX = "auto";
            n.style.overflowY = "hidden";
          }
        }
        return;
      }
      if (n.closest(".ms-w")) return;
      if (room && w > room + 1) {
        n.style.display = "inline-block";
        n.style.maxWidth = room + "px";
        n.style.overflowX = "auto";
        n.style.overflowY = "hidden";
        n.style.verticalAlign = "baseline";
      }
    });
  }
  window.msFitMath = fitMath;
  function whenMathJax() {
    return new Promise(function (resolve) {
      var n = 0;
      function tick() {
        var MJ = window.MathJax;
        if (MJ && MJ.startup && MJ.startup.promise) {
          MJ.startup.promise.then(function () { resolve(); });
          return;
        }
        if (MJ && MJ.typesetPromise && n > 4) {
          resolve();
          return;
        }
        n += 1;
        if (n > 100) resolve();
        else setTimeout(tick, 50);
      }
      tick();
    });
  }
  window.msTypeset = function (nodes) {
    window.__mjQueue = (window.__mjQueue || whenMathJax()).then(function () {
      if (window.MathJax && MathJax.typesetPromise) return MathJax.typesetPromise(nodes);
    }).then(fitMath);
    return window.__mjQueue;
  };
  function typeset(el) {
    window.__mjQueue = (window.__mjQueue || whenMathJax()).then(function () {
      if (window.MathJax && MathJax.typesetPromise) {
        return MathJax.typesetPromise(el ? [el] : undefined).then(fitMath);
      }
      fitMath();
    });
    return window.__mjQueue;
  }
  var SVG_NS = "http://www.w3.org/2000/svg";
  var XLINK_NS = "http://www.w3.org/1999/xlink";
  function theoryBaseUrl(sourceUrl) {
    if (!sourceUrl) return null;
    try { return new URL(sourceUrl, window.location.href); } catch (e) { return null; }
  }
  function resolveTheoryUrl(raw, base) {
    var value = String(raw == null ? "" : raw).trim();
    if (!value || !base) return value;
    try { return new URL(value, base).href; } catch (e) { return value; }
  }
  function rewriteSrcset(value, base) {
    if (/data:/i.test(value)) return value;
    return String(value).split(",").map(function (part) {
      var bits = part.trim().split(/\s+/);
      if (!bits[0]) return "";
      bits[0] = resolveTheoryUrl(bits[0], base);
      return bits.join(" ");
    }).filter(Boolean).join(", ");
  }
  function rewriteCssUrls(css, base) {
    return String(css).replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, function (all, q, u) {
      var t = String(u).trim();
      if (!t || /^data:/i.test(t)) return all;
      return "url(\"" + resolveTheoryUrl(t, base).replace(/"/g, "%22") + "\")";
    });
  }
  function setResolvedAttr(el, attr, base) {
    if (!el.hasAttribute(attr)) return;
    var raw = el.getAttribute(attr);
    if (!raw || !String(raw).trim() || String(raw).trim().charAt(0) === "#") return;
    el.setAttribute(attr, resolveTheoryUrl(raw, base));
  }
  // Theory HTML is fetched as text and inserted into chapter.html. Relative
  // URLs in that fragment are written against the theory file, so resolve
  // them before the nodes join the chapter document.
  function rewriteTheoryResources(root, sourceUrl) {
    var base = theoryBaseUrl(sourceUrl);
    if (!base || !root) return;
    root.querySelectorAll("*").forEach(function (el) {
      setResolvedAttr(el, "src", base);
      if (el.hasAttribute("srcset")) el.setAttribute("srcset", rewriteSrcset(el.getAttribute("srcset"), base));
      setResolvedAttr(el, "poster", base);
      if (el.localName === "object") setResolvedAttr(el, "data", base);
      if (el.namespaceURI === SVG_NS && (el.localName === "image" || el.localName === "use" || el.localName === "feimage" || el.localName === "mpath")) {
        ["href", "xlink:href"].forEach(function (attr) {
          if (!el.hasAttribute(attr)) return;
          var v = el.getAttribute(attr);
          if (!v || String(v).trim().charAt(0) === "#") return;
          el.setAttribute(attr, resolveTheoryUrl(v, base));
        });
        if (el.getAttributeNS && el.hasAttributeNS(XLINK_NS, "href")) {
          var xv = el.getAttributeNS(XLINK_NS, "href");
          if (xv && String(xv).trim().charAt(0) !== "#") el.setAttributeNS(XLINK_NS, "href", resolveTheoryUrl(xv, base));
        }
      }
      if (el.hasAttribute("style") && /url\(/i.test(el.getAttribute("style"))) {
        el.setAttribute("style", rewriteCssUrls(el.getAttribute("style"), base));
      }
      if (el.localName === "style" && el.textContent && /url\(/i.test(el.textContent)) {
        el.textContent = rewriteCssUrls(el.textContent, base);
      }
    });
  }
  function retargetMedia(root) {
    root.querySelectorAll("img, source, video, audio, track").forEach(function (el) {
      var attr = el.getAttribute("src");
      if (!attr || !String(attr).trim()) return;
      try {
        var want = new URL(attr, window.location.href).href;
        if (el.src !== want) el.src = want;
      } catch (e) {}
    });
  }
  function fillTheory(el, html, sourceUrl) {
    el.innerHTML = html;
    rewriteTheoryResources(el, sourceUrl);
    var nested = el.querySelector("section.theory");
    if (nested) {
      if (nested.getAttribute("data-learn")) el.setAttribute("data-learn", nested.getAttribute("data-learn"));
      while (nested.firstChild) el.appendChild(nested.firstChild);
      nested.remove();
    }
    el.querySelectorAll("script").forEach(function (old) {
      var s = document.createElement("script");
      if (old.src) s.src = old.src;
      s.textContent = old.textContent;
      old.parentNode.replaceChild(s, old);
    });
  }
  function parseHash() {
    var h = (location.hash || "").replace(/^#/, "");
    var main = h.split("&")[0];
    var m = main.match(/^(.*)-(learn|examples|practice)$/);
    return m ? { id: m[1], tab: m[2] } : null;
  }
  function setHash(id, tab) {
    var extra = "";
    if (tab === "practice") {
      extra = window.msPractice && window.msPractice.hashTail ? window.msPractice.hashTail() : "";
      if (!extra) {
        var raw = (location.hash || "").replace(/^#/, "");
        var amp = raw.indexOf("&");
        if (amp >= 0) extra = raw.slice(amp);
      }
    }
    var next = id ? "#" + id + "-" + tab + extra : location.pathname + location.search;
    if (id) history.replaceState(null, "", location.pathname + location.search + next);
    else history.replaceState(null, "", location.pathname + location.search);
  }
  function marksOn() {
    try { return localStorage.getItem("ms-show-marks") === "1"; } catch (e) { return false; }
  }
  function applyMarks(on) {
    try { localStorage.setItem("ms-show-marks", on ? "1" : "0"); } catch (e) {}
    document.querySelectorAll(".sec").forEach(function (s) { s.classList.toggle("show-marks", on); });
    document.querySelectorAll(".marks-toggle").forEach(function (b) {
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.textContent = on ? "Hide marks" : "Show marks";
    });
  }
  function selectTab(sec, tab) {
    var name = tab || "learn";
    sec.querySelectorAll("[role=tab]").forEach(function (b) {
      var on = b.getAttribute("data-tab") === name;
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    sec.querySelectorAll("[role=tabpanel]").forEach(function (p) {
      p.hidden = p.getAttribute("data-panel") !== name;
    });
    fitMath();
    if (sec.classList.contains("open")) setHash(sec.getAttribute("data-sec"), name);
  }
  function openSec(sec, tab) {
    document.querySelectorAll("#chapter .sec").forEach(function (s) {
      var on = s === sec;
      s.classList.toggle("open", on);
      var btn = s.querySelector(".sec-toggle");
      var body = s.querySelector(".sec-body");
      if (btn) btn.setAttribute("aria-expanded", on ? "true" : "false");
      if (body) body.hidden = !on;
    });
    if (sec) selectTab(sec, tab || "learn");
    else setHash("", "");
  }
  function applyHash() {
    var h = parseHash();
    if (!h) return;
    var sec = document.querySelector('#chapter .sec[data-sec="' + h.id + '"]');
    if (window.msPractice && window.msPractice.applyHash) window.msPractice.applyHash();
    if (sec) openSec(sec, h.tab);
  }
  function wireExample(we) {
    if (we.querySelector(".show-sol")) return;
    var sol = node("div", "sol");
    sol.hidden = true;
    var steps = we.querySelector(".steps");
    var fin = we.querySelector(".final");
    if (steps) sol.appendChild(steps);
    if (fin) sol.appendChild(fin);
    var btn = node("button", "show-sol", "Show solution");
    btn.type = "button";
    btn.addEventListener("click", function () {
      sol.hidden = !sol.hidden;
      btn.textContent = sol.hidden ? "Show solution" : "Hide solution";
    });
    we.appendChild(btn);
    we.appendChild(sol);
  }
  function learnBlurb(host) {
    if (host.getAttribute("data-learn")) return host.getAttribute("data-learn");
    var ps = host.querySelectorAll("p");
    var i;
    var afterKw = false;
    if (!host.querySelector(".key-words")) afterKw = true;
    for (i = 0; i < ps.length; i++) {
      var p = ps[i];
      if (p.classList.contains("key-words")) { afterKw = true; continue; }
      if (!afterKw) continue;
      if (p.classList.contains("src") || p.classList.contains("marks-key")) continue;
      if (p.closest(".worked-example") || p.closest(".quick-check")) continue;
      var t = firstSentence(p.innerText);
      if (t) return t;
    }
    return "Soon";
  }
  function mountTheory(secEl, html, secId, index, sourceUrl) {
    var tmp = document.createElement("div");
    fillTheory(tmp, html, sourceUrl);
    var learn = secEl.querySelector('[data-panel="learn"]');
    var ex = secEl.querySelector('[data-panel="examples"]');
    var pr = secEl.querySelector('[data-panel="practice"]');
    secEl.setAttribute("data-section", secId);
    if (learn) learn.setAttribute("data-section", secId);
    var foot = secEl.querySelector(".sec-foot");
    var blurb = learnBlurb(tmp);
    var line = secEl.querySelector(".sec-learn");
    if (line) line.textContent = blurb;
    var topSrc = null;
    tmp.querySelectorAll(":scope > .src").forEach(function (p, i) {
      if (i === 0) topSrc = p;
      p.remove();
    });
    var marks = tmp.querySelector(".marks-key");
    if (marks) marks.remove();
    var refs = [];
    tmp.querySelectorAll(".worked-example .src, .quick-check .src").forEach(function (p) {
      var t = p.textContent.replace(/\s+/g, " ").trim();
      if (t && refs.indexOf(t) < 0) refs.push(t);
      p.remove();
    });
    var kw = tmp.querySelector(".key-words");
    if (kw) {
      var chips = node("div", "chips");
      kw.querySelectorAll("em").forEach(function (em) {
        chips.appendChild(node("span", "chip", em.textContent));
      });
      learn.innerHTML = "";
      learn.appendChild(chips);
      kw.remove();
    } else {
      learn.innerHTML = "";
    }
    tmp.querySelectorAll(":scope > h2").forEach(function (h) { h.remove(); });
    tmp.querySelectorAll("h3").forEach(function (h) {
      if (/^quick checks$/i.test(h.textContent.trim())) h.remove();
    });
    ex.innerHTML = "";
    pr.innerHTML = "";
    tmp.querySelectorAll(".worked-example").forEach(function (we) {
      wireExample(we);
      ex.appendChild(we);
    });
    tmp.querySelectorAll(".quick-check").forEach(function (qc) {
      pr.appendChild(qc);
    });
    while (tmp.firstChild) learn.appendChild(tmp.firstChild);
    if (window.msWidget) {
      window.msWidget.scan(learn);
      window.msWidget.scan(ex);
    }
    if (!learn.childNodes.length) learn.appendChild(node("p", "soon", "Soon"));
    if (!ex.querySelector(".worked-example")) {
      var emptyEx = node("p", "soon", "Soon");
      ex.appendChild(emptyEx);
    }
    if (!pr.querySelector(".quick-check")) pr.appendChild(node("p", "soon", "Soon"));
    var marksBtn = node("button", "marks-toggle", "Show marks");
    marksBtn.type = "button";
    marksBtn.setAttribute("aria-pressed", "false");
    marksBtn.addEventListener("click", function () { applyMarks(!marksOn()); });
    ex.insertBefore(marksBtn, ex.firstChild);
    if (topSrc) foot.appendChild(topSrc);
    if (refs.length) {
      var book = node("p", "src");
      book.textContent = "Textbook: " + refs.join("; ");
      foot.appendChild(book);
    }
    if (marks) foot.appendChild(marks);
    retargetMedia(secEl);
    var extra = window.msTheory ? window.msTheory.enhance(secEl, secId) : Promise.resolve();
    return Promise.resolve(extra).then(function () {
      var url = index && index.practice && index.practice[secId];
      var pr = window.msPractice && url ? window.msPractice.mount(secEl, secId, url) : Promise.resolve();
      return Promise.resolve(pr).then(function () {
        var marked = window.msGlossary ? window.msGlossary.markSection(secEl) : Promise.resolve();
        return Promise.resolve(marked).then(function () { return typeset(secEl); });
      });
    });
  }
  function loadTheories(secs) {
    return whenMathJax().then(function () {
    return getJSON("data/theory.json").then(function (index) {
      return Promise.all(secs.map(function (s) {
        var url = theoryUrl(index, s.id);
        var el = document.querySelector('#chapter .sec[data-sec="' + s.id + '"]');
        if (!url || !el) return Promise.resolve();
        return fetch(url, { cache: "no-store" }).then(function (r) {
          if (!r.ok) throw new Error(url);
          return r.text();
        }).then(function (html) {
          return mountTheory(el, html, s.id, index, url);
        }).catch(function () {});
      }));
    }).catch(function () {}).then(function () {
      applyMarks(marksOn());
      applyHash();
      if (window.msGlossary) window.msGlossary.finishChapter();
    });
    });
  }
  function renderChapter(courseId, chId, books, courses, theory, pub) {
    var spec = (courses.courses || []).find(function (c) { return c.id === courseId; });
    var box = document.getElementById("chapter");
    var courseHref = "course.html?c=" + encodeURIComponent(courseId);
    if (!spec || !box) {
      if (box) box.innerHTML = "<p>Unknown chapter.</p>";
      return;
    }
    igcseFoot(courseId);
    var found = null;
    var papers = null;
    var bookId = "";
    var packChs = [];
    courseBooks(spec, books).forEach(function (pack) {
      pack.chapters.forEach(function (ch) {
        if (ch.id === chId) { found = ch; papers = pack.papers; bookId = pack.id; packChs = pack.chapters; }
      });
    });
    if (!found) {
      box.innerHTML = "<p>Unknown chapter.</p>";
      return;
    }
    var head = found.num + ". " + found.title + " · pp." + found.start + "–" + found.end;
    document.getElementById("title").textContent = head;
    document.title = found.num + ". " + found.title + " · Math Sandbox";
    var badge = paperBadge(found, papers);
    var tag = document.getElementById("tagline");
    if (tag) tag.innerHTML = badge ? '<span class="badge">' + esc(badge) + "</span>" : "";
    var crumbs = document.getElementById("crumbs");
    if (crumbs) {
      crumbs.innerHTML = '<a href="index.html">Math Sandbox</a> › <a href="' + esc(courseHref) + '">' + esc(courseId) + "</a> › " + esc(found.num + " " + found.title);
    }
    var idx = -1;
    packChs.forEach(function (ch, i) { if (ch.id === found.id) idx = i; });
    var prev = idx > 0 ? packChs[idx - 1] : null;
    var next = idx >= 0 && idx < packChs.length - 1 ? packChs[idx + 1] : null;
    function chHref(ch) {
      return "chapter.html?c=" + encodeURIComponent(courseId) + "&ch=" + encodeURIComponent(ch.id);
    }
    function navItem(on, href, label, cls) {
      return on ? '<a class="' + cls + '" href="' + esc(href) + '">' + esc(label) + "</a>" : '<span class="soon ' + cls + '">' + esc(label) + "</span>";
    }
    var nav = document.getElementById("chnav");
    if (nav) {
      nav.innerHTML = navItem(!!prev, prev ? chHref(prev) : "", prev ? "‹ " + prev.num + " " + prev.title : "‹", "ch-prev") +
        " " + navItem(!!next, next ? chHref(next) : "", next ? next.num + " " + next.title + " ›" : "›", "ch-next");
    }
    var secs = visSecs(found, papers);
    box.innerHTML = secs.map(function (s) {
      var num = s.num || "";
      var pages = "pp." + s.start + "–" + s.end;
      var learnId = s.id + "-learn";
      var exId = s.id + "-examples";
      var prId = s.id + "-practice";
      var available = hasTheory(theory, s.id) || hasPractice(theory, s.id);
      var mark = newKind(pub, s.id);
      var secCls = "sec" + (available ? " sec-live" : "") + (mark ? (mark === "practice" ? " sec-new sec-new-practice" : " sec-new") : "");
      return '<section class="' + secCls + '" data-sec="' + esc(s.id) + '">' +
        '<button type="button" class="sec-toggle" aria-expanded="false"><span class="sec-kicker">' + esc(num) + "</span> " +
        '<span class="sec-title">' + esc(s.title) + '</span>' + newBadge(mark) + '<span class="sec-pages">' + esc(pages) + "</span>" +
        '<span class="sec-learn-lab">What you\'ll learn</span><span class="sec-learn">Soon</span></button>' +
        '<div class="sec-body" hidden>' +
        '<div class="sec-tabs" role="tablist">' +
        '<button type="button" role="tab" data-tab="learn" aria-selected="true" aria-controls="' + esc(learnId) + '">Learn</button>' +
        '<button type="button" role="tab" data-tab="examples" aria-selected="false" aria-controls="' + esc(exId) + '">Examples</button>' +
        '<button type="button" role="tab" data-tab="practice" aria-selected="false" aria-controls="' + esc(prId) + '">Practice</button>' +
        "</div>" +
        '<div class="theory" role="tabpanel" data-panel="learn" id="' + esc(learnId) + '"><p class="soon">Soon</p></div>' +
        '<div role="tabpanel" data-panel="examples" id="' + esc(exId) + '" hidden><p class="soon">Soon</p></div>' +
        '<div role="tabpanel" data-panel="practice" id="' + esc(prId) + '" hidden><p class="soon">Soon</p></div>' +
        '<footer class="sec-foot"></footer></div></section>';
    }).join("");
    box.querySelectorAll(".sec").forEach(function (sec) {
      sec.querySelector(".sec-toggle").addEventListener("click", function () {
        if (sec.classList.contains("open")) openSec(null);
        else openSec(sec, (sec.querySelector("[role=tab][aria-selected=true]") || {}).getAttribute("data-tab") || "learn");
      });
      sec.querySelectorAll("[role=tab]").forEach(function (tab) {
        tab.addEventListener("click", function () { selectTab(sec, tab.getAttribute("data-tab")); });
      });
    });
    applyHash();
    window.addEventListener("hashchange", applyHash);
    loadTheories(secs);
  }
  var page = (location.pathname.split("/").pop() || "").toLowerCase();
  var q = new URLSearchParams(location.search);
  Promise.all([
    getJSON("data/books.json"),
    getJSON("data/courses.json"),
    getJSON("data/schedule.json"),
    getJSON("data/theory.json").catch(function () { return { sections: {}, practice: {} }; }),
    getJSON("data/published.json").catch(function () { return { PACKAGE2_DATE: "", windowDays: 7, sections: {} }; })
  ])
    .then(function (pair) {
      var books = pair[0];
      var courses = pair[1];
      var schedule = pair[2];
      var theory = pair[3] || { sections: {}, practice: {} };
      var pub = pair[4] || { PACKAGE2_DATE: "", windowDays: 7, sections: {} };
      var c = q.get("c") || "IGCSE";
      if (page === "chapter.html") renderChapter(c, q.get("ch") || "", books, courses, theory, pub);
      else renderCourse(c, books, courses, schedule, q.get("book") || "", theory, pub);
    })
    .catch(function () {
      var el = document.getElementById("list") || document.getElementById("chapter");
      if (el) el.innerHTML = "<p>Could not load course data.</p>";
    });
})();
