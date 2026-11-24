// Math Sandbox: renders plan.json (classes) and textbooks.json.
// Override the highlighted week with ?today=YYYY-MM-DD.
// Portal boot runs only when #tabs and #content exist, so a module page can
// load this file just for the Progress helper.

const Progress = {
  key: "ms-progress",
  all() {
    try {
      return JSON.parse(localStorage.getItem(this.key)) || {};
    } catch (e) {
      return {};
    }
  },
  get(id) {
    return this.all()[id] || null;
  },
  set(id, data) {
    const all = this.all();
    all[id] = { ...data, updated: new Date().toISOString() };
    try {
      localStorage.setItem(this.key, JSON.stringify(all));
    } catch (e) {}
  },
};

if (typeof window !== "undefined") window.Progress = Progress;

const qs = new URLSearchParams(typeof location !== "undefined" ? location.search : "");
const rawToday = qs.get("today") || "";
const TODAY = /^\d{4}-\d{2}-\d{2}$/.test(rawToday) ? rawToday : new Date().toISOString().slice(0, 10);
const CLASS_Q = /^[A-Za-z0-9]+$/.test(qs.get("class") || "") ? qs.get("class") : "";

function addDays(s, n) {
  const d = new Date(s + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function currentWeek(weeks, today) {
  let found = null;
  for (const week of weeks) {
    if (week.start <= today && today <= addDays(week.start, 6)) found = week;
  }
  return found;
}

function fmt(s) {
  return new Date(s + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const pp = (p) => (!p ? "" : p[0] === p[1] ? `p. ${p[0]}` : `pp. ${p[0]}–${p[1]}`);

function fmtDay(s) {
  return new Date(s + "T00:00:00Z").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).replace(",", "");
}

function weekLinks(week, cls) {
  const mods = week.modules || [];
  const trainer = mods.find((mod) => mod.type === "trainer");
  const quiz = mods.find((mod) => mod.type === "quiz");
  const hrefs = week.practice && typeof msNav !== "undefined" ? msNav.taskHrefs(week.practice, cls) : null;
  const bits = [];
  if (trainer) {
    bits.push(
      trainer.status === "ready"
        ? `<a class="mod" href="modules/${esc(trainer.id)}.html">Homework <span class="st">Open →</span></a>`
        : `<div class="mod soon">Homework <span class="st">Soon</span></div>`
    );
  }
  if (quiz) {
    bits.push(
      quiz.status === "ready"
        ? `<a class="mod" href="modules/${esc(quiz.id)}.html">Quiz <span class="st">Open →</span></a>`
        : `<div class="mod soon">Quiz (Soon)</div>`
    );
  }
  if (hrefs) {
    bits.push(`<a class="mod" href="${esc(hrefs.gen)}">Practice <span class="st">Ch 17</span></a>`);
    bits.push(`<a class="mod" href="${esc(hrefs.sheet)}">Worksheet <span class="st">Ch 17</span></a>`);
  }
  bits.push(`<a class="mod" href="review.html?class=${esc(cls)}">Term Review</a>`);
  return `<div class="week-links">${bits.join("")}</div>`;
}

function daysHTML(week, cls) {
  const rows = week.days
    .map((day) => {
      const extra = [
        day.tag ? `<span class="badge tag">${esc(day.tag)}</span>` : "",
        day.note ? `<span class="day-note">${esc(day.note)}</span>` : "",
      ]
        .filter(Boolean)
        .join("");
      return `<tr><td>${esc(fmtDay(day.date))}</td><td><div>${esc(day.label)}</div>${
        extra ? `<div class="topic-extra">${extra}</div>` : ""
      }</td><td>pp.${esc(day.pages)}</td></tr>`;
    })
    .join("");
  return `<table class="week-days"><colgroup><col class="d"><col class="t"><col class="p"></colgroup><thead><tr><th>Day</th><th>Topic</th><th>Pages</th></tr></thead><tbody>${rows}</tbody></table>${weekLinks(week, cls)}`;
}

function strandHTML(s, books) {
  const book = books[s.textbook];
  const title = book ? book.title.replace(/^.*Mathematics:\s*/, "") : s.textbook;
  return (
    `<div class="strand"><div class="sh"><span class="badge">${esc(s.paper)}</span> <small>${esc(
      title
    )}</small> <b>${pp(s.pages)}</b></div><ul>` +
    s.items
      .map((item) => `<li><code>${esc(item.ref)}</code> ${esc(item.kind === "section" ? item.title : "")}</li>`)
      .join("") +
    "</ul></div>"
  );
}

function igcseClass(id) {
  return id === "10P" || id === "10T" || id === "Y1";
}

function applySyllabusCopy(classId) {
  const tag = document.getElementById("tagline");
  const foot = document.querySelector("footer");
  if (igcseClass(classId)) {
    if (tag) tag.textContent = "Weekly plan aligned with the IGCSE 0580 syllabus";
    if (foot) foot.textContent = "Independent learning resource aligned with the IGCSE 0580 syllabus. Not affiliated with any exam board.";
  } else {
    if (tag) tag.textContent = "Weekly plan aligned with the 9709 syllabus";
    if (foot) foot.textContent = "Independent learning resource aligned with the 9709 syllabus. Not affiliated with any exam board.";
  }
}

function render(plan, books, classId) {
  const current = plan.classes.find((item) => item.id === classId) || plan.classes[0];
  applySyllabusCopy(current.id);
  document.getElementById("tabs").innerHTML = plan.classes
    .map(
      (item) =>
        `<button class="tab ${item.id === current.id ? "active" : ""}" data-id="${item.id}">${esc(
          item.id
        )} <small>· ${esc(item.papers)}</small></button>`
    )
    .join("");
  document.querySelectorAll(".tab").forEach((button) => {
    button.onclick = () => {
      localStorage.setItem("ms-class", button.dataset.id);
      history.replaceState(null, "", "?class=" + encodeURIComponent(button.dataset.id));
      if (typeof msNav !== "undefined") msNav.setClass(button.dataset.id);
      render(plan, books, button.dataset.id);
    };
  });
  if (!current.weeks || !current.weeks.length) {
    document.getElementById("content").innerHTML =
      '<p class="note">IGCSE Year 1 archive. No weekly plan on this portal yet.</p>';
    if (typeof msNav !== "undefined") msNav.setClass(current.id);
    return;
  }
  const thisWeek = currentWeek(current.weeks, TODAY);
  document.getElementById("content").innerHTML = plan.trimesters
    .map((term) => {
      const cards = current.weeks
        .filter((week) => week.trimester === term.id)
        .map((week) => {
          const isCurrent = thisWeek && thisWeek.week === week.week;
          const modules = week.modules
            .map((mod) => {
              const saved = Progress.get(mod.id);
              const ready = mod.status === "ready";
              const done = saved && saved.done;
              return `<${ready ? 'a href="modules/' + esc(mod.id) + '.html"' : "div"} class="mod ${
                ready ? "" : "soon"
              } ${done ? "done" : ""}"><span>${esc(mod.title)} <small class="st">(${mod.type})</small></span><span class="st">${
                ready ? (done ? "✓ Done" : "Open →") : "Soon"
              }</span></${ready ? "a" : "div"}>`;
            })
            .join("");
          const head = `<div class="meta"><span>Week ${week.week} · ${fmt(week.start)}</span>${
            isCurrent ? '<span class="badge now">This week</span>' : ""
          }</div>
   ${week.kind !== "topic" ? `<h3>${esc(week.title)}</h3><span class="badge kind-${week.kind}">${week.kind}</span>` : ""}${
            week.note ? `<p class="note">${esc(week.note)}</p>` : ""
          }`;
          const body = week.days
            ? daysHTML(week, current.id)
            : `${week.strands.map((strand) => strandHTML(strand, books)).join("")}
   ${modules}`;
          return `<article class="week ${isCurrent ? "current" : ""} ${week.days ? "has-days" : ""}" ${isCurrent ? 'id="current"' : ""}>${
            week.days ? `<details><summary>${head}</summary>${body}</details>` : `${head}
   ${body}`
          }</article>`;
        })
        .join("");
      return `<section class="tri"><h2>${esc(term.name)} <small>${fmt(term.start)} – ${fmt(term.end)}</small></h2><div class="grid">${cards}</div></section>`;
    })
    .join("");
  const currentCard = document.getElementById("current");
  if (currentCard && currentCard.scrollIntoView) currentCard.scrollIntoView({ block: "center" });
  const classLinks = document.getElementById("class-links");
  if (classLinks) {
    const cls = current.id;
    classLinks.innerHTML =
      '<a href="review.html?class=' + esc(cls) + '">Term 1 Review for ' + esc(cls) + "</a>";
  }
  if (typeof msNav !== "undefined") msNav.setClass(current.id);
}

async function getJSON(url, fallback) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (response.ok) return await response.json();
  } catch (e) {}
  return fallback;
}

function showLoadError(message) {
  const el = document.getElementById("content");
  if (el) el.innerHTML = `<p class="note">${esc(message)}</p>`;
}

if (typeof document !== "undefined" && document.getElementById("content") && document.getElementById("tabs")) {
  const fallbackPlan = typeof window !== "undefined" ? window.PLAN_FALLBACK : null;
  const fallbackBooks = typeof window !== "undefined" ? window.TEXTBOOKS_FALLBACK : null;
  Promise.all([getJSON("plan.json", fallbackPlan), getJSON("textbooks.json", fallbackBooks)])
    .then(([plan, textbooks]) => {
      if (!plan || !textbooks || !Array.isArray(textbooks.books) || !Array.isArray(plan.classes)) {
        showLoadError("Could not load plan.json and textbooks.json.");
        return;
      }
      const books = Object.fromEntries(textbooks.books.map((book) => [book.id, book]));
      document.getElementById("title").textContent = plan.title;
      document.getElementById("tagline").textContent = plan.tagline;
      const ids = plan.classes.map((item) => item.id);
      let stored = "";
      try { stored = localStorage.getItem("ms-class") || ""; } catch (e) {}
      const startClass = [CLASS_Q, stored, ids[0]].find((id) => ids.includes(id)) || ids[0];
      if (CLASS_Q && ids.includes(CLASS_Q)) {
        try { localStorage.setItem("ms-class", CLASS_Q); } catch (e) {}
      }
      render(plan, books, startClass);
    })
    .catch(() => {
      showLoadError("Could not render the weekly plan.");
    });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { currentWeek, addDays, Progress };
}
