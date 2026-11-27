(function (g) {
  const CLASSES = ["10P", "10T", "11AS", "12AS", "12A2"];
  function courseOf(cls) {
    if (cls === "10P" || cls === "10T") return "IGCSE";
    if (cls === "11AS" || cls === "12AS") return "AS";
    if (cls === "12A2") return "A2";
    return "";
  }
  function classesForCourse(course) {
    if (course === "IGCSE") return ["10P", "10T"];
    if (course === "AS") return ["11AS", "12AS"];
    if (course === "A2") return ["12A2"];
    return [];
  }
  function classForCourse(course, preferred) {
    const ids = classesForCourse(course);
    if (preferred && ids.includes(preferred)) return preferred;
    return ids[0] || "";
  }
  function classId() {
    const q = new URLSearchParams(typeof location !== "undefined" ? location.search : "");
    const c = q.get("class") || (typeof localStorage !== "undefined" ? localStorage.getItem("ms-class") : "") || "";
    if (CLASSES.includes(c) && typeof localStorage !== "undefined") {
      try { localStorage.setItem("ms-class", c); } catch (e) {}
    }
    return CLASSES.includes(c) ? c : "";
  }
  function parseTask(id) {
    const m = String(id || "").match(/^(IGCSE|AS|A2)-(\d+)-(\d+)$/);
    return m ? { id: m[0], course: m[1], bi: m[2], ti: m[3] } : null;
  }
  function firstTask(course) {
    return course === "AS" || course === "A2" || course === "IGCSE" ? course + "-0-0" : "IGCSE-0-0";
  }
  function reviewClassForTask(id, preferred) {
    const p = parseTask(id);
    if (!p) return classForCourse("", preferred);
    return classForCourse(p.course, preferred);
  }
  function withClass(href, cls) {
    cls = cls || classId();
    if (!cls) return href;
    const i = href.indexOf("#");
    const hash = i >= 0 ? href.slice(i) : "";
    const base = i >= 0 ? href.slice(0, i) : href;
    const sep = base.indexOf("?") >= 0 ? "&" : "?";
    if (/[?&]class=/.test(base)) return href;
    return base + sep + "class=" + encodeURIComponent(cls) + hash;
  }
  function taskHrefs(id, cls) {
    const p = parseTask(id);
    if (!p) return null;
    const reviewCls = reviewClassForTask(id, cls);
    const cq = cls ? "&class=" + encodeURIComponent(cls) : "";
    return {
      review: "review.html?class=" + encodeURIComponent(reviewCls) + "#t-" + p.id,
      gen: "generator.html?task=" + encodeURIComponent(p.id) + cq,
      sheet: "worksheet.html?c=" + encodeURIComponent(p.course) + "&sel=" + p.bi + "-" + p.ti + (reviewCls ? "&class=" + encodeURIComponent(reviewCls) : ""),
    };
  }
  function taskNav(id, cls) {
    const h = taskHrefs(id, cls);
    if (!h) return "";
    return ' <a class="tab" href="' + h.gen + '">New variant</a> <a class="tab" href="' + h.sheet + '">Worksheet</a>';
  }
  function setClass(cls) {
    if (CLASSES.includes(cls) && typeof localStorage !== "undefined") {
      try { localStorage.setItem("ms-class", cls); } catch (e) {}
    }
    if (typeof document === "undefined") return;
    const use = CLASSES.includes(cls) ? cls : "";
    const course = courseOf(use);
    document.querySelectorAll(".topnav a[href]").forEach((a) => {
      const href = a.getAttribute("href") || "";
      const pre = href.startsWith("../") ? "../" : "";
      const name = href.replace(/.*\//, "").split("?")[0].split("#")[0].replace(/\.html$/i, "");
      if (name === "review") {
        a.setAttribute("href", pre + "review.html" + (use ? "?class=" + encodeURIComponent(use) : ""));
      }
      if (name === "worksheet") {
        a.setAttribute("href", pre + "worksheet.html" + (use ? "?class=" + encodeURIComponent(use) + (course ? "&c=" + course : "") : ""));
      }
      if (name === "generator") {
        const task = firstTask(course || "IGCSE");
        a.setAttribute("href", pre + "generator.html?task=" + encodeURIComponent(task) + (use ? "&class=" + encodeURIComponent(use) : ""));
      }
    });
  }
  function bind() {
    setClass(classId());
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
    else bind();
  }
  g.msNav = {
    CLASSES,
    courseOf,
    classesForCourse,
    classForCourse,
    classId,
    parseTask,
    firstTask,
    reviewClassForTask,
    withClass,
    taskHrefs,
    taskNav,
    setClass,
    bind,
  };
  if (typeof module !== "undefined") module.exports = g.msNav;
})(typeof window !== "undefined" ? window : globalThis);
