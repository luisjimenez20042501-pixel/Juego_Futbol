/* Pantallas de menú como overlays HTML (con botones de colores reales).
   Llama a callbacks de main.js para cambiar de estado. */
window.HC = window.HC || {};

HC.UI = (function () {
  let root;
  let chosen = { mode: "1p", diff: "normal", char1: null, char2: null, picking: 1 };

  function init(el, hooks) { root = el; HC._hooks = hooks; }

  function clear() { root.innerHTML = ""; root.classList.remove("hidden"); }
  function hide() { root.classList.add("hidden"); root.innerHTML = ""; }

  // ------------------------------------------------------------------- //
  function menu() {
    clear();
    root.innerHTML = `
      <div class="screen">
        <h1 class="title">⚽ HEAD <span>CLASH</span></h1>
        <p class="subtitle">Fútbol de cabezones</p>
        <div class="btns">
          <button class="btn btn-green" data-act="1p">🤖 1 Jugador (vs IA)</button>
          <button class="btn btn-blue" data-act="2p">👥 2 Jugadores</button>
          <button class="btn btn-ghost" data-act="how">🎮 Controles</button>
          <button class="btn btn-ghost" data-act="mute">🔊 Sonido</button>
        </div>
        <p class="foot">Hecho con HTML5 Canvas · listo para desplegar</p>
      </div>`;
    root.querySelector('[data-act="1p"]').onclick = () => { chosen.mode = "1p"; difficulty(); };
    root.querySelector('[data-act="2p"]').onclick = () => { chosen.mode = "2p"; charSelect(); };
    root.querySelector('[data-act="how"]').onclick = controls;
    const muteBtn = root.querySelector('[data-act="mute"]');
    muteBtn.onclick = () => {
      const m = HC.Audio.toggleMute();
      muteBtn.textContent = m ? "🔇 Silencio" : "🔊 Sonido";
    };
  }

  function controls() {
    clear();
    root.innerHTML = `
      <div class="screen">
        <h2 class="title2">🎮 Controles</h2>
        <div class="controls-grid">
          <div class="ctrl-card">
            <h3>Jugador 1</h3>
            <p><b>A / D</b> · moverse</p>
            <p><b>W</b> · saltar</p>
            <p><b>S</b> · patear</p>
            <p><b>Q</b> · súper disparo ★</p>
          </div>
          <div class="ctrl-card">
            <h3>Jugador 2</h3>
            <p><b>← / →</b> · moverse</p>
            <p><b>↑</b> · saltar</p>
            <p><b>↓</b> · patear</p>
            <p><b>Shift der.</b> · súper ★</p>
          </div>
        </div>
        <p class="tip">📱 En móvil aparecen botones en pantalla (modo 1 jugador).</p>
        <button class="btn btn-ghost" data-act="back">‹ Volver</button>
      </div>`;
    root.querySelector('[data-act="back"]').onclick = menu;
  }

  function difficulty() {
    clear();
    root.innerHTML = `
      <div class="screen">
        <h2 class="title2">Elige dificultad</h2>
        <div class="btns">
          <button class="btn btn-green" data-d="facil">😊 Fácil</button>
          <button class="btn btn-amber" data-d="normal">😎 Normal</button>
          <button class="btn btn-red" data-d="dificil">😈 Difícil</button>
          <button class="btn btn-ghost" data-act="back">‹ Volver</button>
        </div>
      </div>`;
    root.querySelectorAll("[data-d]").forEach(b => {
      b.onclick = () => { chosen.diff = b.dataset.d; charSelect(); };
    });
    root.querySelector('[data-act="back"]').onclick = menu;
  }

  function charSelect() {
    chosen.picking = 1; chosen.char1 = null; chosen.char2 = null;
    renderCharSelect();
  }

  function renderCharSelect() {
    clear();
    const who = chosen.mode === "2p"
      ? (chosen.picking === 1 ? "Jugador 1, elige" : "Jugador 2, elige")
      : "Elige tu personaje";
    const cards = HC.CHARACTERS.map(c => `
      <button class="char" data-id="${c.id}" style="--c:${c.color};--a:${c.accent}">
        <span class="char-emoji">${c.emoji}</span>
        <span class="char-name">${c.name}</span>
        <span class="char-stats">
          <i>VEL ${"●".repeat(Math.round(c.speed*3))}</i>
          <i>SAL ${"●".repeat(Math.round(c.jump*3))}</i>
          <i>POT ${"●".repeat(Math.round(c.power*3))}</i>
        </span>
      </button>`).join("");
    root.innerHTML = `
      <div class="screen wide">
        <h2 class="title2">${who}</h2>
        <div class="char-grid">${cards}</div>
        <button class="btn btn-ghost" data-act="back">‹ Volver</button>
      </div>`;
    root.querySelectorAll(".char").forEach(b => {
      b.onclick = () => pickChar(b.dataset.id);
    });
    root.querySelector('[data-act="back"]').onclick = menu;
  }

  function pickChar(id) {
    if (chosen.mode === "1p") {
      chosen.char1 = id;
      chosen.char2 = randomOther(id);
      start();
    } else {
      if (chosen.picking === 1) { chosen.char1 = id; chosen.picking = 2; renderCharSelect(); }
      else { chosen.char2 = id; start(); }
    }
  }

  function randomOther(id) {
    const others = HC.CHARACTERS.filter(c => c.id !== id);
    return others[Math.floor(Math.random() * others.length)].id;
  }

  function start() {
    hide();
    HC._hooks.startMatch({
      mode: chosen.mode,
      diff: HC.DIFFICULTY[chosen.diff],
      char1: HC.getCharacter(chosen.char1),
      char2: HC.getCharacter(chosen.char2),
    });
  }

  function gameOver(match) {
    clear();
    let title, sub;
    if (match.winner === "draw") { title = "🤝 ¡Empate!"; sub = `${match.score.p1} - ${match.score.p2}`; }
    else {
      const w = match.winner === "p1" ? match.p1 : match.p2;
      const isP1 = match.winner === "p1";
      const who = match.mode === "1p" ? (isP1 ? "¡Ganaste!" : "Perdiste...") : `¡Gana ${w.char.name}!`;
      title = `${w.char.emoji} ${who}`;
      sub = `${match.score.p1} - ${match.score.p2}`;
    }
    root.innerHTML = `
      <div class="screen">
        <h1 class="title">${title}</h1>
        <p class="bigscore">${sub}</p>
        <div class="btns">
          <button class="btn btn-green" data-act="rematch">🔁 Revancha</button>
          <button class="btn btn-blue" data-act="menu">🏠 Menú</button>
        </div>
      </div>`;
    root.querySelector('[data-act="rematch"]').onclick = () => { hide(); HC._hooks.rematch(); };
    root.querySelector('[data-act="menu"]').onclick = menu;
  }

  function pause(onResume, onQuit) {
    clear();
    root.innerHTML = `
      <div class="screen">
        <h2 class="title2">⏸️ Pausa</h2>
        <div class="btns">
          <button class="btn btn-green" data-act="resume">▶ Continuar</button>
          <button class="btn btn-ghost" data-act="quit">🏠 Salir al menú</button>
        </div>
      </div>`;
    root.querySelector('[data-act="resume"]').onclick = () => { hide(); onResume(); };
    root.querySelector('[data-act="quit"]').onclick = () => { onQuit(); };
  }

  return { init, menu, gameOver, pause, hide };
})();
