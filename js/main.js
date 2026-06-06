/* Punto de entrada: gestiona pantallas, selección de personaje y bucle de juego. */
(function () {
  const canvas = document.getElementById("game");
  canvas.width = CONFIG.W;
  canvas.height = CONFIG.H;

  const screensEl = document.getElementById("screens");
  const hudEl = document.getElementById("hud");
  const touchEl = document.getElementById("touch");
  const isTouch = ("ontouchstart" in window) || navigator.maxTouchPoints > 0;

  Input.init();

  // Integración con Telegram Mini Apps: si el juego se abre desde el bot,
  // ocupar toda la pantalla y avisar que está listo.
  try {
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      if (tg.setHeaderColor) tg.setHeaderColor("#05070f");
      if (tg.disableVerticalSwipes) tg.disableVerticalSwipes();
    }
  } catch (e) { /* fuera de Telegram: ignorar */ }

  // Estado de flujo
  const flow = {
    mode: "vsCpu",
    difficulty: "normal",
    selecting: 1,          // 1 o 2 durante la selección
    char1: "toro",
    char2: "rayo",
  };

  let game = null;
  let running = false;
  let paused = false;

  // ---------------- Escalado del canvas ----------------
  function resize() {
    const scale = Math.min(window.innerWidth / CONFIG.W,
                           window.innerHeight / CONFIG.H);
    canvas.style.width = CONFIG.W * scale + "px";
    canvas.style.height = CONFIG.H * scale + "px";
  }
  window.addEventListener("resize", resize);
  resize();

  // ---------------- Pantallas ----------------
  function show(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    if (id) {
      const el = document.getElementById(id);
      if (el) el.classList.add("active");
      screensEl.style.pointerEvents = "auto";
    } else {
      screensEl.style.pointerEvents = "none";
    }
  }

  function inMatchUI(on) {
    hudEl.classList.toggle("hidden", !on);
    touchEl.classList.toggle("hidden", !(on && isTouch));
  }

  // ---------------- Selección de personajes ----------------
  function buildCharGrid() {
    const grid = document.getElementById("charGrid");
    grid.innerHTML = "";
    CHARACTERS.forEach(ch => {
      const card = document.createElement("div");
      card.className = "char-card";
      card.dataset.id = ch.id;

      const cv = document.createElement("canvas");
      cv.width = 80; cv.height = 80;
      drawHead(cv.getContext("2d"), ch, 40, 44, 30, 1, false);

      const name = document.createElement("div");
      name.className = "cname";
      name.textContent = ch.name;

      const stats = document.createElement("div");
      stats.className = "stats";
      stats.innerHTML = statBar("VEL", ch.speed) + statBar("SAL", ch.jump) + statBar("FUE", ch.power);

      card.appendChild(cv);
      card.appendChild(name);
      card.appendChild(stats);
      card.addEventListener("click", () => selectChar(ch.id));
      grid.appendChild(card);
    });
    highlightSelection();
  }

  function statBar(label, val) {
    const pct = Math.round(((val - 0.8) / 0.5) * 100); // 0.8..1.3 -> 0..100
    return `<span>${label}<span class="bar"><i style="width:${Math.max(8, Math.min(100, pct))}%"></i></span></span>`;
  }

  function selectChar(id) {
    if (flow.selecting === 1) flow.char1 = id;
    else flow.char2 = id;
    highlightSelection();
  }

  function highlightSelection() {
    const current = flow.selecting === 1 ? flow.char1 : flow.char2;
    document.querySelectorAll(".char-card").forEach(c => {
      c.classList.toggle("selected", c.dataset.id === current);
    });
  }

  function openSelect(who) {
    flow.selecting = who;
    document.getElementById("selectTitle").textContent =
      who === 1 ? "Jugador 1: elige tu cabezón" : "Jugador 2: elige tu cabezón";
    highlightSelection();
    show("select");
  }

  function confirmSelect() {
    if (flow.mode === "vsP2" && flow.selecting === 1) {
      openSelect(2);
      return;
    }
    if (flow.mode === "vsCpu") {
      // La CPU usa un personaje distinto al del jugador.
      const others = CHARACTERS.filter(c => c.id !== flow.char1);
      flow.char2 = others[Math.floor(Math.random() * others.length)].id;
    }
    startMatch();
  }

  // ---------------- Partido ----------------
  function startMatch() {
    const p1 = getCharacter(flow.char1);
    const p2 = getCharacter(flow.char2);
    document.getElementById("p1name").textContent = p1.name;
    document.getElementById("p2name").textContent = flow.mode === "vsCpu" ? "CPU" : p2.name;

    game = new Game(canvas, {
      mode: flow.mode,
      difficulty: flow.difficulty,
      char1: flow.char1,
      char2: flow.char2,
      callbacks: {
        onHud: updateHud,
        onEnd: showResult,
      },
    });
    game.start();
    paused = false;
    running = true;
    show(null);
    inMatchUI(true);
  }

  function updateHud(s) {
    document.getElementById("score").textContent = `${s.score[0]} : ${s.score[1]}`;
    document.getElementById("timer").textContent = s.golden ? "GOL DE ORO" : s.time + "''";
  }

  function showResult(score) {
    running = false;
    inMatchUI(false);
    const p1 = getCharacter(flow.char1);
    const p2name = flow.mode === "vsCpu" ? "CPU" : getCharacter(flow.char2).name;
    let title;
    if (score[0] > score[1]) title = `🏆 ¡Ganó ${p1.name}!`;
    else if (score[1] > score[0]) title = `🏆 ¡Ganó ${p2name}!`;
    else title = "🤝 ¡Empate!";
    document.getElementById("resultTitle").textContent = title;
    document.getElementById("resultScore").textContent = `${score[0]} : ${score[1]}`;
    show("result");
  }

  function pauseMatch() {
    if (!running) return;
    paused = true;
    show("pause");
  }
  function resumeMatch() { paused = false; show(null); }
  function quitToMenu() { running = false; game = null; inMatchUI(false); show("menu"); }

  // ---------------- Bucle principal (timestep fijo) ----------------
  let last = performance.now();
  let acc = 0;
  const STEP = 1 / 60;

  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (running && !paused && game) {
      acc += dt;
      while (acc >= STEP) {
        game.update(STEP);
        acc -= STEP;
      }
      game.render();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ---------------- Eventos de UI ----------------
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-go],[data-diff],[data-back]");
    if (!btn) return;
    Sfx._ensure();   // habilitar audio en el primer toque

    if (btn.dataset.back) { show(btn.dataset.back); return; }

    if (btn.dataset.diff) {
      flow.difficulty = btn.dataset.diff;
      openSelect(1);
      return;
    }

    const go = btn.dataset.go;
    if (go === "vsCpu") { flow.mode = "vsCpu"; show("difficulty"); }
    else if (go === "vsP2") { flow.mode = "vsP2"; openSelect(1); }
    else if (go === "howto") { show("howto"); }
    else if (go === "resume") { resumeMatch(); }
    else if (go === "restart") { startMatch(); }
    else if (go === "quit") { quitToMenu(); }
  });

  document.getElementById("selectConfirm").addEventListener("click", confirmSelect);
  document.getElementById("pauseBtn").addEventListener("click", pauseMatch);

  window.addEventListener("keydown", (e) => {
    if (e.code === "Escape" && running) {
      paused ? resumeMatch() : pauseMatch();
    }
  });

  // ---------------- Init ----------------
  buildCharGrid();
  show("menu");
})();
