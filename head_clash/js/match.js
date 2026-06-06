/* Lógica del partido: física combinada, colisiones, goles, marcador y tiempo.
   Match.step(inputs) avanza un paso fijo. Los estados son:
     "kickoff" -> "playing" -> "goal" -> ("playing" | "ended"). */
window.HC = window.HC || {};

(function () {
  const K = HC.K;

  class Match {
    constructor(opts) {
      this.mode = opts.mode;                 // "1p" | "2p"
      this.diff = opts.diff || HC.DIFFICULTY.normal;
      this.ball = new HC.Ball();
      this.p1 = new HC.Player("left", opts.char1);
      this.p2 = new HC.Player("right", opts.char2);
      this.score = { p1: 0, p2: 0 };
      this.timeLeft = K.MATCH_SECONDS;
      this._frameCount = 0;
      this.state = "kickoff";
      this.stateTimer = 90;                  // frames de cuenta atrás del saque
      this.lastScorer = null;
      this.winner = null;
      this.events = [];                      // mensajes para la UI (gol, etc.)
      this.resetPositions();
    }

    resetPositions() {
      this.p1.reset();
      this.p2.reset();
      this.ball.reset(K.W / 2, K.H / 2 - 90);
    }

    topGoalY() { return K.GROUND_Y - K.GOAL_H; }

    // --------------------------------------------------------------- //
    step(inputs) {
      this._frameCount++;

      if (this.state === "kickoff") {
        this.stateTimer--;
        if (this.stateTimer <= 0) { this.state = "playing"; }
        return;
      }
      if (this.state === "goal") {
        this.stateTimer--;
        if (this.stateTimer <= 0) {
          if (this.winner) { this.state = "ended"; }
          else { this.resetPositions(); this.state = "kickoff"; this.stateTimer = 70; }
        }
        return;
      }
      if (this.state === "ended") return;

      // Tiempo de juego.
      if (this._frameCount % K.FPS === 0 && this.timeLeft > 0) {
        this.timeLeft--;
        if (this.timeLeft <= 0) this.endByTime();
      }

      // Entradas
      const in1 = inputs.p1;
      const in2 = this.mode === "2p"
        ? inputs.p2
        : HC.AI.decide(this.p2, this.ball, this.p1, this.diff, this._frameCount);

      this.p1.control(in1, this.p2.x);
      this.p2.control(in2, this.p1.x);
      this.p1.step();
      this.p2.step();
      this.ball.step();

      this.handleSideWalls();
      this.collide(this.p1);
      this.collide(this.p2);
      this.checkGoal();
    }

    // --------------------------------------------------------------- //
    // Paredes laterales con abertura de portería.
    handleSideWalls() {
      const b = this.ball, top = this.topGoalY();
      // Por encima del larguero rebota; dentro de la boca, pasa (gol).
      if (b.x - b.r < 0 && b.y < top) {
        b.x = b.r; if (b.vx < 0) b.vx = -b.vx * K.BALL_RESTITUTION;
      }
      if (b.x + b.r > K.W && b.y < top) {
        b.x = K.W - b.r; if (b.vx > 0) b.vx = -b.vx * K.BALL_RESTITUTION;
      }
      // Rebote suave en el larguero (parte superior de la portería).
      this.crossbar(0, K.GOAL_DEPTH, top);
      this.crossbar(K.W - K.GOAL_DEPTH, K.W, top);
    }

    crossbar(x0, x1, top) {
      const b = this.ball;
      if (b.x > x0 - b.r && b.x < x1 + b.r && Math.abs(b.y - top) < b.r) {
        if (b.y < top && b.vy > 0) { b.y = top - b.r; b.vy = -b.vy * 0.6; }
        else if (b.y >= top && b.vy < 0) { b.y = top + b.r; b.vy = -b.vy * 0.6; }
      }
    }

    // --------------------------------------------------------------- //
    // Colisiones balón-jugador (cabeza, cuerpo y pie al patear).
    collide(p) {
      let kicked = false;
      if (p.isKicking()) kicked = this.tryKick(p);
      if (!kicked) {
        this.circleHit(p.headX, p.headY, K.HEAD_R, p.vx, p.vy, K.HEAD_BOUNCE);
        this.circleHit(p.bodyX, p.bodyY, K.BODY_R, p.vx, p.vy, 0.5);
      }
    }

    tryKick(p) {
      const b = this.ball;
      const foot = p.footPoint();
      const d = Math.hypot(b.x - foot.x, b.y - foot.y);
      if (d < K.BALL_R + 24) {
        const sup = p.isSuper();
        const power = K.KICK_POWER * p.char.power * (sup ? 1.8 : 1);
        b.vx = p.facing * power + p.vx * 0.5;
        b.vy = -power * 0.55 - Math.abs(p.vx) * 0.2;
        if (sup) b.vy -= 2;
        this.clampBall();
        return true;
      }
      return false;
    }

    circleHit(cx, cy, cr, ownerVx, ownerVy, bounce) {
      const b = this.ball;
      let dx = b.x - cx, dy = b.y - cy;
      let dist = Math.hypot(dx, dy);
      const minDist = b.r + cr;
      if (dist === 0) { dist = 0.01; dy = -0.01; }
      if (dist < minDist) {
        const nx = dx / dist, ny = dy / dist;
        // Separar
        b.x = cx + nx * minDist;
        b.y = cy + ny * minDist;
        // Velocidad relativa al "dueño" del círculo
        const rvx = b.vx - ownerVx, rvy = b.vy - ownerVy;
        const vn = rvx * nx + rvy * ny;
        if (vn < 0) {
          const j = -(1 + bounce) * vn;
          b.vx += j * nx; b.vy += j * ny;
        }
        // Transferencia de movimiento del jugador
        b.vx += ownerVx * 0.35;
        b.vy += ownerVy * 0.25;
        this.clampBall();
      }
    }

    clampBall() {
      const b = this.ball;
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > K.BALL_MAX_SPEED) { const k = K.BALL_MAX_SPEED / sp; b.vx *= k; b.vy *= k; }
    }

    // --------------------------------------------------------------- //
    checkGoal() {
      const b = this.ball, top = this.topGoalY();
      if (b.y > top) {
        if (b.x - b.r <= 0) { this.scoreGoal("p2"); return; }
        if (b.x + b.r >= K.W) { this.scoreGoal("p1"); return; }
      }
    }

    scoreGoal(who) {
      this.score[who]++;
      this.lastScorer = who;
      HC.Audio.goal();
      this.events.push({ type: "goal", who });
      if (this.score[who] >= K.GOALS_TO_WIN) {
        this.winner = who;
      }
      this.state = "goal";
      this.stateTimer = 110;
    }

    endByTime() {
      HC.Audio.whistle();
      if (this.score.p1 === this.score.p2) this.winner = "draw";
      else this.winner = this.score.p1 > this.score.p2 ? "p1" : "p2";
      this.state = "goal";          // reusa la pausa para mostrar fin
      this.stateTimer = 80;
    }

    popEvents() { const e = this.events; this.events = []; return e; }
  }

  HC.Match = Match;
})();
