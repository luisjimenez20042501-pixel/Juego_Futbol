/* Controlador de la CPU. Devuelve un objeto de control como el del jugador.
   Tres dificultades ajustan reacción, precisión y agresividad. */
class AI {
  constructor(difficulty = "normal") {
    this.set(difficulty);
    this.reactTimer = 0;
    this.decision = Input.empty();
  }

  set(difficulty) {
    this.difficulty = difficulty;
    const presets = {
      easy:   { react: 0.34, error: 90, aggro: 0.45, jump: 0.55, useSuper: 0.3 },
      normal: { react: 0.20, error: 50, aggro: 0.7,  jump: 0.7,  useSuper: 0.6 },
      hard:   { react: 0.09, error: 18, aggro: 0.92, jump: 0.85, useSuper: 0.9 },
    };
    this.cfg = presets[difficulty] || presets.normal;
  }

  /* player = jugador controlado por la IA (lado +1), ball, dt */
  think(player, ball, dt) {
    this.reactTimer -= dt;
    if (this.reactTimer > 0) return this.decision;
    this.reactTimer = this.cfg.react;

    const ctrl = Input.empty();
    const err = (Math.random() - 0.5) * this.cfg.error;
    const ballX = ball.x + err;

    // Posición objetivo: detrás del balón para empujarlo hacia la portería rival (izquierda).
    const goalDir = -1; // la IA ataca hacia la izquierda
    const behind = ballX - goalDir * 70; // colócate al lado contrario del arco objetivo

    // Defensa: si el balón está en su campo y bajo, prioriza interceptar.
    const target = behind;

    if (player.x < target - 14) ctrl.right = true;
    else if (player.x > target + 14) ctrl.left = true;

    // Saltar si el balón viene alto y cerca.
    const near = Math.abs(ball.x - player.x) < 140;
    const high = ball.y < player.y - 10;
    if (near && high && player.onGround && Math.random() < this.cfg.jump) {
      ctrl.jump = true;
    }

    // Patear si el balón está al alcance y delante (hacia el arco rival).
    const dx = ball.x - player.x;
    const dist = Math.hypot(dx, ball.y - player.y);
    const inFront = dx < 30; // el balón está hacia su izquierda (su ataque)
    if (dist < 110 && inFront && Math.random() < this.cfg.aggro) {
      if (player.power >= CONFIG.POWER_MAX && Math.random() < this.cfg.useSuper) {
        ctrl.power = true;
      } else {
        ctrl.kick = true;
      }
    }

    this.decision = ctrl;
    return ctrl;
  }
}
