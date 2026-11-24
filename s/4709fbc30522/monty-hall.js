(function(){
  "use strict";

  /* ---------- engine ---------- */
  function randInt(n){ return Math.floor(Math.random() * n); }

  function hostOpensOne(car, pick, n){
    var opts = [];
    for (var d = 0; d < n; d++) if (d !== car && d !== pick) opts.push(d);
    if (!opts.length) throw new Error("host has no goat door to open");
    return opts[randInt(opts.length)];
  }

  function otherClosed(pick, host, n){
    for (var d = 0; d < n; d++) if (d !== pick && d !== host) return d;
    throw new Error("no remaining door");
  }

  /* The other door the host leaves closed in the 100-door game. */
  function leftoverDoor(car, pick, n){
    if (pick === car){
      var goats = [];
      for (var d = 0; d < n; d++) if (d !== pick) goats.push(d);
      return goats[randInt(goats.length)];
    }
    return car;
  }

  function simOne3(){
    var car = randInt(3), pick = randInt(3);
    var host = hostOpensOne(car, pick, 3);
    var sw = otherClosed(pick, host, 3);
    return {car:car, pick:pick, host:host, sw:sw, stayWin: pick===car, switchWin: sw===car};
  }

  function simMany3(n){
    var stay = 0, sw = 0;
    for (var i = 0; i < n; i++){
      var r = simOne3();
      if (r.stayWin) stay++;
      if (r.switchWin) sw++;
    }
    return {n:n, stay:stay, switch:sw, stayRate: stay/n, switchRate: sw/n};
  }

  window.MontyHall = {
    randInt:randInt,
    hostOpensOne:hostOpensOne,
    otherClosed:otherClosed,
    leftoverDoor:leftoverDoor,
    simOne3:simOne3,
    simMany3:simMany3
  };

  /* ---------- helpers ---------- */
  function $(id){ return document.getElementById(id); }
  function pct(wins, plays){
    if (!plays) return "";
    return (Math.round(1000 * wins / plays) / 10).toFixed(1) + "%";
  }
  function setTally(pfx, stayW, stayN, swW, swN){
    $(pfx+"-stay-pct").textContent = pct(stayW, stayN);
    $(pfx+"-stay-frac").textContent = stayW + " / " + stayN;
    $(pfx+"-switch-pct").textContent = pct(swW, swN);
    $(pfx+"-switch-frac").textContent = swW + " / " + swN;
  }


  /* ---------- responsive layout (smartboard-safe) ---------- */
  function lockViewport(){
    var h = window.innerHeight, w = window.innerWidth;
    if (!h || !w) return;
    document.documentElement.style.height = h + "px";
    document.body.style.height = h + "px";
    var app = document.querySelector(".app");
    if (app){ app.style.height = h + "px"; app.style.maxHeight = h + "px"; }
  }
  function fitAspect(availW, availH, aw, ah){
    var h = availH, w = h * aw / ah;
    if (w > availW){ w = availW; h = w * ah / aw; }
    return {w: Math.max(1, Math.floor(w)), h: Math.max(1, Math.floor(h))};
  }
  function layoutPlay(){
    var box = document.getElementById("play-doors");
    if (!box) return;
    var W = box.clientWidth, H = box.clientHeight;
    if (W < 30 || H < 30) return;
    var units = box.querySelectorAll(".door-unit");
    var n = units.length;
    if (!n) return;
    var cap = units[0].querySelector(".door-cap");
    var capH = (cap ? cap.offsetHeight : 22) + 8;
    var pad = 8;
    var gap = Math.round(Math.min(40, Math.max(8, Math.min(W, H) * 0.035)));
    box.style.gap = gap + "px";
    var availH = H - capH - pad;
    var availW = (W - gap * (n - 1) - pad) / n;
    var maxDoorH = 560;
    var sz = fitAspect(Math.max(40, availW), Math.max(50, Math.min(availH, maxDoorH)), 3, 5);
    for (var i = 0; i < n; i++){
      var stage = units[i].querySelector(".door-stage");
      units[i].style.width = (sz.w + pad) + "px";
      units[i].style.maxWidth = "none";
      stage.style.width = sz.w + "px";
      stage.style.height = sz.h + "px";
      stage.style.maxHeight = "none";
      stage.style.maxWidth = "none";
      stage.style.aspectRatio = "auto";
    }
    box.style.setProperty("--door-num-size", Math.round(Math.max(22, Math.min(86, sz.h * 0.22))) + "px");
    box.style.setProperty("--prize-size", Math.round(Math.max(22, Math.min(92, sz.h * 0.28))) + "px");
  }
  function layout100(){
    var wrap = document.querySelector(".d100-grid-wrap");
    var grid = document.getElementById("d100-grid");
    if (!wrap || !grid) return;
    var W = wrap.clientWidth, H = wrap.clientHeight;
    if (W < 30 || H < 30) return;
    var pad = Math.max(6, Math.min(12, Math.floor(Math.min(W, H) / 60)));
    var gap = Math.max(2, Math.min(8, Math.floor(Math.min(W, H) / 90)));
    var innerW = W - 4, innerH = H - 4;
    var cell = Math.floor(Math.min((innerW - 2 * pad - 9 * gap) / 10, (innerH - 2 * pad - 9 * gap) / 10));
    cell = Math.max(14, cell);
    var gw = 10 * cell + 9 * gap + 2 * pad;
    var gh = 10 * cell + 9 * gap + 2 * pad;
    grid.style.width = gw + "px";
    grid.style.height = gh + "px";
    grid.style.maxWidth = "none";
    grid.style.maxHeight = "none";
    grid.style.aspectRatio = "auto";
    grid.style.setProperty("--d100-gap", gap + "px");
    grid.style.setProperty("--d100-pad", pad + "px");
    var font = Math.max(8, Math.min(22, Math.floor(cell * 0.45)));
    grid.style.setProperty("--d100-font", font + "px");
    grid.style.setProperty("--d100-font-lg", Math.max(font, Math.min(28, font + 4)) + "px");
  }
  function layoutAll(){
    lockViewport();
    layoutPlay();
    layout100();
    if (typeof resizeChart === "function") resizeChart();
  }
  var _layoutT = 0;
  function scheduleLayout(){
    if (_layoutT) cancelAnimationFrame(_layoutT);
    _layoutT = requestAnimationFrame(function(){
      _layoutT = 0;
      layoutAll();
      requestAnimationFrame(layoutAll);
    });
  }
  window.addEventListener("resize", scheduleLayout);
  window.addEventListener("orientationchange", scheduleLayout);
  if (typeof ResizeObserver === "function"){
    var ro = new ResizeObserver(function(){ scheduleLayout(); });
    if (document.querySelector(".app")) ro.observe(document.querySelector(".app"));
    var pd = document.getElementById("play-doors");
    if (pd) ro.observe(pd);
    var gw = document.querySelector(".d100-grid-wrap");
    if (gw) ro.observe(gw);
  }

  /* ---------- tabs ---------- */
  var currentTab = "play";
  function showTab(name){
    currentTab = name;
    document.querySelectorAll(".tabs [role=tab]").forEach(function(b){
      b.setAttribute("aria-selected", b.getAttribute("data-tab")===name ? "true" : "false");
    });
    document.querySelectorAll(".panel").forEach(function(p){
      p.classList.toggle("active", p.id === "panel-"+name);
    });
    try { history.replaceState(null, "", "#"+name); } catch(e){}
    scheduleLayout();
    if (name === "simulate") requestAnimationFrame(function(){ resizeChart(); drawChart(); });
  }
  document.querySelector(".tabs").addEventListener("click", function(e){
    var b = e.target.closest("[data-tab]");
    if (b) showTab(b.getAttribute("data-tab"));
  });

  /* ---------- fullscreen ---------- */
  var fsBtn = $("btn-fs");
  function isFs(){ return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function updateFsLbl(){ fsBtn.textContent = isFs() ? "Exit fullscreen" : "Fullscreen"; }
  fsBtn.addEventListener("click", function(){
    var el = document.documentElement;
    if (isFs()){
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else {
      (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    }
  });
  document.addEventListener("fullscreenchange", function(){ updateFsLbl(); scheduleLayout(); });
  document.addEventListener("webkitfullscreenchange", function(){ updateFsLbl(); scheduleLayout(); });

  /* ========== PLAY ========== */
  var play = {phase:"idle", car:0, pick:-1, host:-1, sw:-1, gen:0,
              stayW:0, stayN:0, swW:0, swN:0};
  var doorEls = Array.prototype.slice.call(document.querySelectorAll("#play-doors .door-unit"));

  function playSetStatus(html){ $("play-status").innerHTML = html; }

  function resetRoundKeepTally(){
    play.phase = "idle";
    play.pick = play.host = play.sw = -1;
    play.car = randInt(3);
    play.gen++;
    doorEls.forEach(function(el, i){
      el.className = "door-unit";
      el.disabled = false;
      el.querySelector("[data-prize]").textContent = "";
      el.querySelector("[data-plbl]").textContent = "";
      el.querySelector(".door-cap").textContent = "Door " + (i+1);
    });
    $("btn-stay").disabled = true;
    $("btn-switch").disabled = true;
    $("btn-new").disabled = true;
    playSetStatus("Three doors: one car, two goats. <span class=\"hint\">Tap a door to pick it. The host always opens a remaining door that has a goat.</span>");
  }

  function primeDoorPrizes(){
    doorEls.forEach(function(el, i){
      var isCar = i === play.car;
      el.classList.toggle("is-car", isCar);
      el.querySelector("[data-prize]").textContent = isCar ? "🚗" : "🐐";
      el.querySelector("[data-plbl]").textContent = isCar ? "Car" : "Goat";
    });
  }

  function startPlayPick(d){
    if (play.phase !== "idle") return;
    play.phase = "picked";
    play.pick = d;
    play.car = randInt(3);
    play.host = hostOpensOne(play.car, play.pick, 3);
    play.sw = otherClosed(play.pick, play.host, 3);
    primeDoorPrizes();
    doorEls.forEach(function(el){ el.disabled = true; });
    doorEls[d].classList.add("picked");
    doorEls[d].querySelector(".door-cap").textContent = "Your pick";
    playSetStatus("You picked Door " + (d+1) + ". <span class=\"hint\">The host opens a door with a goat…</span>");
    var gen = play.gen;
    setTimeout(function(){
      if (gen !== play.gen) return;
      doorEls[play.host].classList.add("open");
      doorEls[play.host].querySelector(".door-cap").textContent = "Host opened";
      doorEls[play.sw].classList.add("switch-target");
      doorEls[play.sw].querySelector(".door-cap").textContent = "The other door";
      doorEls[play.sw].disabled = false;
      doorEls[play.pick].disabled = false;
      $("btn-stay").disabled = false;
      $("btn-switch").disabled = false;
      play.phase = "decide";
      playSetStatus("The host opened Door " + (play.host+1) + " (a goat). <span class=\"hint\">Stay with Door " + (play.pick+1) + ", or switch to Door " + (play.sw+1) + "?</span>");
    }, 450);
  }

  function revealPlay(choseSwitch){
    if (play.phase !== "decide") return;
    play.phase = "revealed";
    $("btn-stay").disabled = true;
    $("btn-switch").disabled = true;
    doorEls.forEach(function(el){ el.disabled = true; el.classList.add("open"); });
    var won = choseSwitch ? play.sw === play.car : play.pick === play.car;
    if (choseSwitch){ play.swN++; if (won) play.swW++; }
    else { play.stayN++; if (won) play.stayW++; }
    setTally("play", play.stayW, play.stayN, play.swW, play.swN);
    var verb = choseSwitch ? "switched to Door " + (play.sw+1) : "stayed with Door " + (play.pick+1);
    var result = won ? "<span style=\"color:#1B3A6B\">You " + verb + " and won the car.</span>"
                     : "You " + verb + " and found a goat. The car was behind Door " + (play.car+1) + ".";
    if (won) result = result.replace("</span>", " 🚗</span>");
    playSetStatus(result + " <span class=\"hint\">New round keeps the tally; Reset clears it.</span>");
    $("btn-new").disabled = false;
    $("play-stat-stay").classList.toggle("hl", !choseSwitch);
    $("play-stat-switch").classList.toggle("hl", choseSwitch);
  }

  doorEls.forEach(function(el){
    el.addEventListener("click", function(){
      var d = +el.getAttribute("data-d");
      if (play.phase === "idle") startPlayPick(d);
      else if (play.phase === "decide"){
        if (d === play.pick) revealPlay(false);
        else if (d === play.sw) revealPlay(true);
      }
    });
  });
  $("btn-stay").addEventListener("click", function(){ revealPlay(false); });
  $("btn-switch").addEventListener("click", function(){ revealPlay(true); });
  $("btn-new").addEventListener("click", function(){
    $("play-stat-stay").classList.remove("hl");
    $("play-stat-switch").classList.remove("hl");
    resetRoundKeepTally();
  });
  $("btn-reset").addEventListener("click", function(){
    play.stayW = play.stayN = play.swW = play.swN = 0;
    setTally("play", 0, 0, 0, 0);
    $("play-stat-stay").classList.remove("hl");
    $("play-stat-switch").classList.remove("hl");
    resetRoundKeepTally();
  });
  resetRoundKeepTally();

  /* ========== SIMULATE ========== */
  var sim = {n:0, stay:0, sw:0, stayHist:[], swHist:[], token:0};
  var canvas = $("chart");
  var ctx = canvas.getContext("2d");

  function resizeChart(){
    var wrap = canvas.parentElement;
    if (!wrap) return;
    var rect = wrap.getBoundingClientRect();
    if (rect.width < 20 || rect.height < 20) return;
    var legend = wrap.querySelector(".chart-legend");
    var legendH = legend ? legend.getBoundingClientRect().height : 0;
    var dpr = window.devicePixelRatio || 1;
    var w = Math.max(80, rect.width - 20);
    var h = Math.max(60, rect.height - legendH - 16);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawChart();
  }

  function addTrials(k){
    for (var i = 0; i < k; i++){
      var r = simOne3();
      sim.n++;
      if (r.stayWin) sim.stay++;
      if (r.switchWin) sim.sw++;
      sim.stayHist.push(sim.stay / sim.n);
      sim.swHist.push(sim.sw / sim.n);
    }
  }

  function renderSim(){
    setTally("sim", sim.stay, sim.n, sim.sw, sim.n);
    drawChart();
  }

  function runSim(count){
    var animate = count <= 1000;
    sim.token++;
    var token = sim.token;
    if (!animate){
      addTrials(count);
      renderSim();
      return;
    }
    var left = count;
    var total = count;
    function frame(){
      if (token !== sim.token) return;
      var batch;
      if (total <= 10) batch = 1;
      else if (total <= 100) batch = 2;
      else batch = Math.max(4, Math.ceil(total / 90));
      var n = Math.min(left, batch);
      addTrials(n);
      left -= n;
      renderSim();
      if (left > 0) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function resetSim(){
    sim.token++;
    sim.n = sim.stay = sim.sw = 0;
    sim.stayHist = [];
    sim.swHist = [];
    renderSim();
  }

  function drawChart(){
    var dpr = window.devicePixelRatio || 1;
    var W = canvas.width / dpr, H = canvas.height / dpr;
    ctx.clearRect(0, 0, W, H);
    var padL = 70, padR = 70, padT = 44, padB = 48;
    var x0 = padL, y0 = padT, x1 = W - padR, y1 = H - padB;
    var plotW = x1 - x0, plotH = y1 - y0;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#E5E7EB";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(x0, y0, plotW, plotH);
    ctx.stroke();

    function yOf(p){ return y0 + (1 - p) * plotH; }
    function xOf(i, n){ if (n <= 1) return x0; return x0 + (i / (n - 1)) * plotW; }

    /* horizontal grid at 0, .25, .5, .75, 1 */
    ctx.font = "16px Arial, Helvetica, Liberation Sans, sans-serif";
    ctx.fillStyle = "#5C6778";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    [0, 0.25, 0.5, 0.75, 1].forEach(function(p){
      var y = yOf(p);
      ctx.strokeStyle = "#EEF1F5";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
      ctx.fillStyle = "#5C6778";
      ctx.fillText((p*100) + "%", x0 - 10, y);
    });

    /* reference 1/3 and 2/3 */
    function dashRef(p, label, color){
      var y = yOf(p);
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 7]);
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = color;
      ctx.textAlign = "left";
      ctx.font = "bold 18px Arial, Helvetica, Liberation Sans, sans-serif";
      ctx.fillText(label, x1 + 8, y);
      ctx.restore();
    }
    dashRef(1/3, "1/3", "#5C6778");
    dashRef(2/3, "2/3", "#C1121F");

    var n = sim.n;
    if (n > 0){
      var stride = n > 2000 ? Math.ceil(n / 2000) : 1;
      function series(hist, color, width){
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        var started = false;
        for (var i = 0; i < n; i += stride){
          var x = xOf(i, n), y = yOf(hist[i]);
          if (!started){ ctx.moveTo(x, y); started = true; }
          else ctx.lineTo(x, y);
        }
        if ((n-1) % stride !== 0){
          ctx.lineTo(xOf(n-1, n), yOf(hist[n-1]));
        }
        ctx.stroke();
      }
      series(sim.stayHist, "#1B3A6B", 3);
      series(sim.swHist, "#0E7C7B", 3.2);
    }

    /* x axis label */
    ctx.fillStyle = "#5C6778";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.font = "18px Arial, Helvetica, Liberation Sans, sans-serif";
    ctx.fillText(n ? ("Games  ·  " + n.toLocaleString("en-GB")) : "Games", (x0+x1)/2, H - 14);
    if (n > 1){
      ctx.font = "15px Arial, Helvetica, Liberation Sans, sans-serif";
      ctx.textAlign = "left"; ctx.fillText("1", x0, y1 + 20);
      ctx.textAlign = "right"; ctx.fillText(String(n), x1, y1 + 20);
    }
  }

  document.querySelectorAll("[data-run]").forEach(function(b){
    b.addEventListener("click", function(){ runSim(+b.getAttribute("data-run")); });
  });
  $("btn-sim-reset").addEventListener("click", resetSim);
  /* resize handled by scheduleLayout */

  /* ========== TREE ========== */
  var treeStep = 0; /* 0..5 */
  var treeSvg = $("tree-svg");
  function renderTree(){
    /* SVG className is read-only; use the attribute. */
    if (treeStep >= 5) treeSvg.setAttribute("class", "all");
    else if (treeStep >= 1) treeSvg.setAttribute("class", "u" + treeStep);
    else treeSvg.setAttribute("class", "");
    $("tree-step-lbl").textContent = "Step " + treeStep + " of 5";
    $("btn-tree-next").disabled = treeStep >= 5;
    var showTot = treeStep >= 4;
    $("tree-stay-pct").textContent = showTot ? "1/3" : "?";
    $("tree-switch-pct").textContent = showTot ? "2/3" : "?";
    $("tree-stay-box").classList.toggle("hl", showTot);
    $("tree-switch-box").classList.toggle("hl", showTot);
    $("bayes").classList.toggle("on", treeStep >= 5);
  }
  $("btn-tree-next").addEventListener("click", function(){
    if (treeStep < 5){ treeStep++; renderTree(); }
  });
  $("btn-tree-all").addEventListener("click", function(){ treeStep = 5; renderTree(); });
  $("btn-tree-reset").addEventListener("click", function(){ treeStep = 0; renderTree(); });
  renderTree();

  /* ========== 100 DOORS ========== */
  var N100 = 100;
  var g100 = $("d100-grid");
  var d100els = [];
  for (var i = 0; i < N100; i++){
    var b = document.createElement("button");
    b.type = "button";
    b.className = "d100";
    b.textContent = String(i+1);
    b.setAttribute("data-d", String(i));
    b.setAttribute("aria-label", "Door " + (i+1));
    g100.appendChild(b);
    d100els.push(b);
  }

  var d100 = {phase:"idle", car:0, pick:-1, left:-1, gen:0, stayW:0, stayN:0, swW:0, swN:0};

  function d100Status(html){ $("d100-status").innerHTML = html; }

  function reset100Round(){
    d100.phase = "idle";
    d100.pick = d100.left = -1;
    d100.car = randInt(N100);
    d100.gen++;
    d100els.forEach(function(el, i){
      el.className = "d100";
      el.disabled = false;
      el.textContent = String(i+1);
    });
    $("btn-open98").disabled = true;
    $("btn-100-stay").disabled = true;
    $("btn-100-switch").disabled = true;
    $("btn-100-new").disabled = true;
    d100Status("Tap one of the 100 doors to pick it.");
  }

  function pick100(d){
    if (d100.phase !== "idle") return;
    d100.phase = "picked";
    d100.pick = d;
    d100.car = randInt(N100);
    d100.left = leftoverDoor(d100.car, d100.pick, N100);
    d100els.forEach(function(el){ el.disabled = true; });
    d100els[d].classList.add("picked");
    d100els[d].disabled = false; /* still highlighted */
    $("btn-open98").disabled = false;
    d100Status("You picked Door " + (d+1) + ". <span class=\"hint\">Now let the host open 98 doors that have goats.</span>");
  }

  function open98(){
    if (d100.phase !== "picked") return;
    d100.phase = "opening";
    $("btn-open98").disabled = true;
    var toOpen = [];
    for (var d = 0; d < N100; d++){
      if (d !== d100.pick && d !== d100.left) toOpen.push(d);
    }
    var gen = d100.gen;
    var idx = 0;
    function wave(){
      if (gen !== d100.gen) return;
      var batch = 8;
      for (var k = 0; k < batch && idx < toOpen.length; k++, idx++){
        var el = d100els[toOpen[idx]];
        el.classList.add("open");
        el.textContent = "🐐";
        el.classList.add("emoji");
      }
      if (idx < toOpen.length) setTimeout(wave, 30);
      else {
        d100els[d100.left].classList.add("left");
        $("btn-100-stay").disabled = false;
        $("btn-100-switch").disabled = false;
        d100.phase = "decide";
        d100Status("The host opened 98 goats. Door " + (d100.left+1) + " is still closed. <span class=\"hint\">Stay with Door " + (d100.pick+1) + " (1%), or switch to Door " + (d100.left+1) + " (99%)?</span>");
      }
    }
    wave();
  }

  function reveal100(choseSwitch){
    if (d100.phase !== "decide") return;
    d100.phase = "revealed";
    $("btn-100-stay").disabled = true;
    $("btn-100-switch").disabled = true;
    var chosen = choseSwitch ? d100.left : d100.pick;
    var won = chosen === d100.car;
    if (choseSwitch){ d100.swN++; if (won) d100.swW++; }
    else { d100.stayN++; if (won) d100.stayW++; }
    setTally("d100", d100.stayW, d100.stayN, d100.swW, d100.swN);
    /* reveal pick, leftover, and if needed the car if it was already an opened goat? car is never opened early */
    [d100.pick, d100.left].forEach(function(d){
      var el = d100els[d];
      var extra = (d === d100.pick) ? " was-pick" : " was-left";
      if (d === d100.car){
        el.className = "d100 car-reveal emoji" + extra;
        el.textContent = "🚗";
      } else {
        el.className = "d100 goat-reveal emoji" + extra;
        el.textContent = "🐐";
      }
    });
    $("d100-stat-stay").classList.toggle("hl", !choseSwitch);
    $("d100-stat-switch").classList.toggle("hl", choseSwitch);
    var verb = choseSwitch ? "switched to Door " + (d100.left+1) : "stayed with Door " + (d100.pick+1);
    d100Status((won ? "You " + verb + " and won the car." : "You " + verb + " and found a goat. The car was behind Door " + (d100.car+1) + ".")
      + " <span class=\"hint\">New round keeps the tally.</span>");
    $("btn-100-new").disabled = false;
  }

  g100.addEventListener("click", function(e){
    var b = e.target.closest(".d100");
    if (!b) return;
    var d = +b.getAttribute("data-d");
    if (d100.phase === "idle") pick100(d);
    else if (d100.phase === "decide"){
      if (d === d100.pick) reveal100(false);
      else if (d === d100.left) reveal100(true);
    }
  });
  $("btn-open98").addEventListener("click", open98);
  $("btn-100-stay").addEventListener("click", function(){ reveal100(false); });
  $("btn-100-switch").addEventListener("click", function(){ reveal100(true); });
  function clear100Hl(){
    $("d100-stat-stay").classList.remove("hl");
    $("d100-stat-switch").classList.remove("hl");
  }
  $("btn-100-new").addEventListener("click", function(){ clear100Hl(); reset100Round(); });
  $("btn-100-reset").addEventListener("click", function(){
    d100.stayW = d100.stayN = d100.swW = d100.swN = 0;
    setTally("d100", 0, 0, 0, 0);
    clear100Hl();
    reset100Round();
  });
  reset100Round();

  /* ---------- boot: hash / query ---------- */
  function bootFromUrl(){
    var params = new URLSearchParams(location.search);
    var tab = params.get("tab") || (location.hash || "").replace(/^#/, "") || "play";
    if (tab === "100" || tab === "100doors") tab = "doors";
    if (["play","simulate","tree","doors"].indexOf(tab) === -1) tab = "play";
    showTab(tab);
    if (params.get("tree") === "all"){ treeStep = 5; renderTree(); }
    var simN = parseInt(params.get("sim") || "0", 10);
    if (simN > 0){ addTrials(simN); renderSim(); }
    if (tab === "simulate") requestAnimationFrame(function(){ resizeChart(); drawChart(); });
  }
  /* expose API before boot so tests and hash routing can use it */
  window.MontyHall.showTab = showTab;
  window.MontyHall.runSim = runSim;
  window.MontyHall.resetSim = resetSim;
  window.MontyHall.addTrials = addTrials;
  window.MontyHall.renderSim = renderSim;
  window.MontyHall.setTreeStep = function(s){ treeStep = s; renderTree(); };
  window.MontyHall.getSim = function(){ return {n:sim.n, stay:sim.stay, sw:sim.sw}; };
  window.MontyHall.layout = layoutAll;
  window.MontyHall.scheduleLayout = scheduleLayout;
  window.MontyHall.playPick = function(d){ startPlayPick(d); };
  window.MontyHall.playReveal = revealPlay;
  window.MontyHall.d100Pick = pick100;
  window.MontyHall.d100Open = open98;
  window.MontyHall.d100Reveal = reveal100;

  bootFromUrl();
  scheduleLayout();
})();
