(function (g) {
  var DROP = {
    seed: 1,
    ans: 1,
    n: 1,
    sel: 1,
    title: 1,
    date: 1,
    v: 1,
    nq: 1,
    marks: 1,
    mix: 1,
    diff: 1,
    secs: 1,
    ch: 1,
  };
  var timer = null;
  var last = null;
  var DELAY = 1000;

  function countedPath() {
    var loc = g.location || {};
    var params = new URLSearchParams(String(loc.search || "").replace(/^\?/, ""));
    var kept = new URLSearchParams();
    var pathName = String(loc.pathname || "");
    var leaf = (pathName.split("/").pop() || "");
    params.forEach(function (val, key) {
      if (DROP[key] && !(key === "ch" && (leaf === "chapter.html" || leaf === "chapter"))) return;
      kept.append(key, val);
    });
    var q = kept.toString();
    var hash = String(loc.hash || "").replace(/^#/, "").split("&")[0];
    return String(loc.pathname || "") + (q ? "?" + q : "") + (hash ? "#" + hash : "");
  }

  function fire() {
    timer = null;
    try {
      var path = countedPath();
      if (path === last) return;
      var gc = g.goatcounter;
      if (!gc || typeof gc.count !== "function") return;
      last = path;
      gc.count({ path: path, title: (g.document && g.document.title) || "", event: false });
    } catch (e) {}
  }

  function schedule() {
    try {
      if (timer) clearTimeout(timer);
      timer = setTimeout(fire, DELAY);
    } catch (e) {}
  }

  function wrap(name) {
    try {
      var hist = g.history;
      if (!hist || typeof hist[name] !== "function") return;
      var orig = hist[name];
      hist[name] = function () {
        var ret = orig.apply(this, arguments);
        schedule();
        return ret;
      };
    } catch (e) {}
  }

  try {
    last = countedPath();
    wrap("pushState");
    wrap("replaceState");
    if (typeof g.addEventListener === "function") {
      g.addEventListener("popstate", schedule);
      g.addEventListener("hashchange", schedule);
    }
  } catch (e) {}

  g.msAnalytics = { countedPath: countedPath, visit: schedule };
})(typeof window !== "undefined" ? window : globalThis);
