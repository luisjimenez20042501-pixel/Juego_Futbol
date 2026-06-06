/* Manejo de entrada: teclado para 2 jugadores + controles táctiles para P1. */
const Input = {
  keys: {},
  touch: { left: false, right: false, jump: false, kick: false, power: false },

  init() {
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;
      // Evitar el scroll con flechas/espacio durante el juego.
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(e.code)) {
        e.preventDefault();
      }
    }, { passive: false });

    window.addEventListener("keyup", (e) => { this.keys[e.code] = false; });

    // Botones táctiles
    document.querySelectorAll(".tbtn").forEach((btn) => {
      const act = btn.dataset.act;
      const set = (v) => (ev) => { ev.preventDefault(); this.touch[act] = v; };
      btn.addEventListener("touchstart", set(true), { passive: false });
      btn.addEventListener("touchend", set(false), { passive: false });
      btn.addEventListener("touchcancel", set(false), { passive: false });
      btn.addEventListener("mousedown", set(true));
      btn.addEventListener("mouseup", set(false));
      btn.addEventListener("mouseleave", set(false));
    });
  },

  // Estado de control del jugador 1 (teclado WASD + táctil).
  p1() {
    return {
      left: this.keys["KeyA"] || this.touch.left,
      right: this.keys["KeyD"] || this.touch.right,
      jump: this.keys["KeyW"] || this.touch.jump,
      kick: this.keys["KeyB"] || this.touch.kick,
      power: this.keys["KeyV"] || this.touch.power,
    };
  },

  // Estado de control del jugador 2 (flechas + L/K).
  p2() {
    return {
      left: this.keys["ArrowLeft"],
      right: this.keys["ArrowRight"],
      jump: this.keys["ArrowUp"],
      kick: this.keys["KeyL"],
      power: this.keys["KeyK"],
    };
  },

  empty() {
    return { left: false, right: false, jump: false, kick: false, power: false };
  },

  clearTouch() {
    for (const k in this.touch) this.touch[k] = false;
  },
};
