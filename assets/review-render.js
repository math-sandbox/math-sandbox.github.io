function markTotal(rows) {
  return rows.reduce((sum, row) => {
    const tokens = String(row.marks || "").match(/[MAB]\d+/g) || [];
    return sum + tokens.reduce((n, t) => n + Number(t.slice(1)), 0);
  }, 0);
}
function msTable(rows) {
  const body = rows
    .map(
      (row) =>
        `<tr><td>${row.part || ""}</td><td>${row.answer || ""}</td><td>${row.marks || ""}</td><td>${row.guidance || ""}</td></tr>`
    )
    .join("");
  return `<table class="ms"><thead><tr><th>Part</th><th>Answer</th><th>Marks</th><th>Guidance</th></tr></thead><tbody>${body}</tbody></table><p>Total ${markTotal(rows)} marks</p>`;
}
function topicHeading(n, title) {
  return n + ". " + title;
}
function taskLabel(t, k) {
  return "Q" + k + " · " + String((t && t.title) || "").trim() + " [" + (t && t.marks) + "]";
}
function findTask(review, id) {
  const m = String(id).match(/^(IGCSE|AS|A2)-(\d+)-(\d+)$/);
  if (!m || !Array.isArray(review)) return null;
  const sheet = review.find((s) => s.course === m[1]);
  const block = sheet && sheet.blocks && sheet.blocks[Number(m[2])];
  const task = block && block.tasks && block.tasks[Number(m[3])];
  return task ? { sheet, block, task, n: Number(m[2]) + 1, k: Number(m[3]) + 1 } : null;
}
function taskCard(t, id, extra) {
  const pub = {};
  Object.keys(t).forEach((k) => { if (k.charAt(0) !== "_") pub[k] = t[k]; });
  t = pub;
  const body = Array.isArray(t.solution) ? msTable(t.solution) : t.solution || "";
  const sol = body
    ? `<button class="tab" data-r="s-${id}">Show solution</button><div class="reveal" id="s-${id}">${body}</div>`
    : "";
  return `<div class="panel"><p><span class="badge">${t.level}</span> [${t.marks}]${extra || ""}</p><div>${t.q}</div><button class="tab" data-r="r-${id}">Show answer</button><div class="reveal" id="r-${id}"><p>${t.answer}</p></div>${sol}</div>`;
}
function bindReveal(root) {
  root.onclick = (e) => {
    const k = e.target.dataset.r;
    if (!k) return;
    document.getElementById(k).classList.toggle("on");
  };
}
if (typeof module !== "undefined") module.exports = { markTotal, msTable, taskCard, bindReveal, topicHeading, taskLabel, findTask };
