const MODULE_ID = "TEMPLATE";
function finish() {
  Progress.set(MODULE_ID, { done: true, score: 1, total: 1 });
  document.getElementById("msg").textContent = "Saved ✓";
}
document.querySelector("button.tab").addEventListener("click", finish);
