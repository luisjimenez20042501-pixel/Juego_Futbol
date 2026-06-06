/* Núcleo del partido: jugadores, balón, colisiones, goles, marcador y dibujo. */
class Game {
  constructor(canvas, opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.opts = opts;                 // {mode, difficulty, char1, char2, callbacks}
    this.callbacks = opts.callbacks || {};

    this.p1 = new Player(getCharacter(opts.char1), -1);
    this.p2 = new Player(getCharacter(opts.char2), +1);
    this.ball = new Ball();
    this.ai = opts.mode === "vsCpu" ? new AI(opts.difficulty) : null;

    this.score = [0, 0];
    this.time = CONFIG.MATCH_TIME;
    this.state = "kickoff";           // kickoff | playing | goal | ended
    this.stateTimer = 1.0;            // cuenta atrás del saque
    this.goldenGoal = false;
    this.flash = 0;                   // efecto visual de gol
  }

  start() {
    this.score = [0, 0];
    this.time = CONFIG.MATCH_TIME;
    this._kickoff(0);
    this._emitHud();
  }

  _kickoff(toSide) {
    this.p1.reset();
    this.p2.reset();
    this.ball.reset(toSide);
    this.state = "kickoff";
    this.stateTimer = 1.0;
  }

  update(dt) {
    if (this.state === "ended") return;

    // Reloj del partido (solo cuando se juega)
    if (this.state === "playing") {
      this.time -= dt;
      if (this.time <= 0) {
        this.time = 0;
        this._checkEnd();
        if (this.state === "ended") { this._emitHud(); return; }
      }
    }

    // Cuenta atrás del saque
    if (this.state === "kickoff") {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) this.state = "playing";
    }
    if (this.state === "goal") {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) this._kickoff(this._goalToSide);
    }

    // Controles
    const c1 = Input.p1();
    let c2;
    if (this.ai) c2 = this.ai.think(this.p2, this.ball, dt);
    else c2 = Input.p2();

    const frozen = this.state !== "playing";
    this.p1.update(dt, frozen ? Input.empty() : c1);
    this.p2.update(dt, frozen ? Input.empty() : c2);

    if (this.state === "playing") {
      if (this.ball.update(dt)) Sfx.wall();
      this._collidePlayer(this.p1);
      this._collidePlayer(this.p2);
      this._handleWallsAndGoals();
    } else {
      // Mantener el balón quieto en el saque
      this.ball.vx *= 0.9; this.ball.vy *= 0.9;
    }

    if (this.flash > 0) this.flash -= dt;
    this._emitHud();
  }

  _collidePlayer(p) {
    // Colisión cabeza/cuerpo con el balón
    const head = { x: p.x, y: p.y, vx: p.vx, vy: p.vy, r: p.r, mass: p.mass };
    if (Physics.resolveCircles(head, this.ball, 0.7)) {
      // Transferir parte del movimiento del jugador al balón
      this.ball.vx += p.vx * 0.3;
      Sfx.head();
    }

    // Patada con el pie
    if (p.isKicking() && !p._kickApplied) {
      const f = p.footPos();
      const d = Physics.dist(f.x, f.y, this.ball.x, this.ball.y);
      if (d < CONFIG.FOOT_RADIUS + this.ball.r + 6) {
        p._kickApplied = true;
        const force = p.superActive ? CONFIG.POWER_SHOT_FORCE : CONFIG.KICK_FORCE;
        const mult = p.char.power;
        // Dirección: hacia donde mira, con componente hacia arriba.
        this.ball.vx = p.dir * force * mult;
        this.ball.vy = -force * 0.55 * mult + p.vy * 0.3;
        if (p.superActive) {
          this.ball.charged = true;
          this.ball.trail = [];
          this.flash = 0.25;
        }
        Physics.limitSpeed(this.ball, CONFIG.BALL_MAX_SPEED);
      }
    }
  }

  _handleWallsAndGoals() {
    const b = this.ball;
    const goalTopY = CONFIG.H - CONFIG.GROUND - CONFIG.GOAL_HEIGHT;
    const e = CONFIG.BALL_RESTITUTION;

    // Portería izquierda (la defiende P1; si entra, marca P2 -> índice 1)
    if (b.x - b.r < CONFIG.GOAL_DEPTH) {
      if (b.y > goalTopY + b.r) {
        this._scoreGoal(1, -1);
        return;
      }
      b.x = CONFIG.GOAL_DEPTH + b.r;
      b.vx = Math.abs(b.vx) * e;
      Sfx.wall();
    }
    // Portería derecha (la defiende P2; si entra, marca P1 -> índice 0)
    if (b.x + b.r > CONFIG.W - CONFIG.GOAL_DEPTH) {
      if (b.y > goalTopY + b.r) {
        this._scoreGoal(0, +1);
        return;
      }
      b.x = CONFIG.W - CONFIG.GOAL_DEPTH - b.r;
      b.vx = -Math.abs(b.vx) * e;
      Sfx.wall();
    }
  }

  _scoreGoal(scorerIndex, concededSide) {
    this.score[scorerIndex]++;
    this.flash = 0.5;
    Sfx.goal();
    this._goalToSide = concededSide;   // el balón saca hacia quien recibió el gol
    if (this.callbacks.onGoal) this.callbacks.onGoal(scorerIndex);

    // Gol de oro
    if (this.goldenGoal) {
      this.state = "ended";
      this._finish();
      return;
    }
    this.state = "goal";
    this.stateTimer = 1.4;
  }

  _checkEnd() {
    if (this.score[0] === this.score[1] && CONFIG.GOLDEN_GOAL) {
      // Empate al acabar el tiempo -> muerte súbita
      this.goldenGoal = true;
      this.state = "playing";
      this.time = 0;
      if (this.callbacks.onGolden) this.callbacks.onGolden();
      return;
    }
    this.state = "ended";
    this._finish();
  }

  _finish() {
    Sfx.whistle();
    if (this.callbacks.onEnd) this.callbacks.onEnd(this.score.slice());
  }

  _emitHud() {
    if (this.callbacks.onHud) {
      this.callbacks.onHud({
        score: this.score,
        time: Math.ceil(this.time),
        golden: this.goldenGoal,
        p1power: this.p1.power, p2power: this.p2.power,
      });
    }
  }

  // ---------------- Render ----------------
  render() {
    const ctx = this.ctx;
    const W = CONFIG.W, H = CONFIG.H;
    ctx.clearRect(0, 0, W, H);

    this._drawField(ctx, W, H);
    this._drawGoal(ctx, "left");
    this._drawGoal(ctx, "right");

    this.ball.draw(ctx);
    this.p1.draw(ctx);
    this.p2.draw(ctx);

    this._drawPowerBars(ctx);

    // Mensajes de estado
    if (this.state === "kickoff") this._centerText(ctx, "¿Listos?");
    if (this.state === "goal") this._centerText(ctx, "¡GOOOL!");
    if (this.goldenGoal && this.state === "playing") this._topText(ctx, "★ GOL DE ORO ★");

    // Destello de gol
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flash * 0.5})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  _drawField(ctx, W, H) {
    // Cielo
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, CONFIG.SKY_TOP);
    sky.addColorStop(1, CONFIG.SKY_BOTTOM);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Césped
    const gy = H - CONFIG.GROUND;
    ctx.fillStyle = CONFIG.FIELD;
    ctx.fillRect(0, gy, W, CONFIG.GROUND);
    ctx.fillStyle = CONFIG.FIELD_DARK;
    for (let i = 0; i < W; i += 60) ctx.fillRect(i, gy, 30, CONFIG.GROUND);

    // Línea de medio campo
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 10]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, gy);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  _drawGoal(ctx, side) {
    const gy = CONFIG.H - CONFIG.GROUND;
    const topY = gy - CONFIG.GOAL_HEIGHT;
    const x = side === "left" ? 0 : CONFIG.W - CONFIG.GOAL_DEPTH;
    // Poste
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(x, topY, CONFIG.GOAL_DEPTH, CONFIG.GOAL_HEIGHT);
    // Travesaño
    ctx.fillRect(side === "left" ? 0 : CONFIG.W - 50, topY, 50, CONFIG.GOAL_DEPTH);
    // Red
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    const netX = side === "left" ? 0 : CONFIG.W - 50;
    for (let i = 0; i <= 50; i += 8) {
      ctx.beginPath();
      ctx.moveTo(netX + i, topY);
      ctx.lineTo(netX + i, gy);
      ctx.stroke();
    }
    for (let j = topY; j <= gy; j += 8) {
      ctx.beginPath();
      ctx.moveTo(netX, j);
      ctx.lineTo(netX + 50, j);
      ctx.stroke();
    }
  }

  _drawPowerBars(ctx) {
    const drawBar = (p, x) => {
      const w = 120, h = 8, y = CONFIG.H - 26;
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(x, y, w, h);
      const pct = p.power / CONFIG.POWER_MAX;
      ctx.fillStyle = pct >= 1 ? "#ffd23f" : "#2dd4a7";
      ctx.fillRect(x, y, w * pct, h);
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.strokeRect(x, y, w, h);
    };
    drawBar(this.p1, 24);
    drawBar(this.p2, CONFIG.W - 144);
  }

  _centerText(ctx, text) {
    ctx.save();
    ctx.font = "bold 64px 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 8;
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.strokeText(text, CONFIG.W / 2, CONFIG.H / 2 - 30);
    ctx.fillStyle = "#ffd23f";
    ctx.fillText(text, CONFIG.W / 2, CONFIG.H / 2 - 30);
    ctx.restore();
  }

  _topText(ctx, text) {
    ctx.save();
    ctx.font = "bold 22px 'Trebuchet MS', sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd23f";
    ctx.fillText(text, CONFIG.W / 2, 96);
    ctx.restore();
  }
}
