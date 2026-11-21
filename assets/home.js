(function () {
  var FALLBACK = { "10P": "IGCSE", "10T": "IGCSE", "11AS": "AS", "12AS": "AS", "12A2": "A2", Y1: "IGCSE" };
  function go(map) {
    var q = new URLSearchParams(location.search);
    var cls = q.get("class");
    if (!cls) return;
    var course = map[cls];
    if (!course) return;
    try { localStorage.setItem("ms-class", cls); } catch (e) {}
    if (q.get("today")) {
      location.replace("week.html?" + q.toString());
      return;
    }
    location.replace("course.html?c=" + encodeURIComponent(course));
  }
  fetch("data/courses.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) { go((data && data.classToCourse) || FALLBACK); })
    .catch(function () { go(FALLBACK); });
})();
