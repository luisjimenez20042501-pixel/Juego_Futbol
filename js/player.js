/* Jugador (cabezón): movimiento, salto, patada, pie y barra de poder. */
class Player {
  constructor(char, side) {
    this.char = char;
    this.side = side;            // -1 = izquierda (defiende izq), +1 = derecha
    this.dir = side === -1 ? 1 : -1;  // hacia dónde mira (al centro)
    this.r = CONFIG.PLAYER_RADIUS;
    this.mass = 6;
    this.reset();
  }

  reset() {
    const margin = CONFIG.W * 0.22;
    this.x = this.side === -1 ? margin : CONFIG.W - margin;
    this.y = CONFIG.H - CONFIG.GROUND - this.r;
    this.vx = 0;
    this.vy = 0;
    this.onGround = true;
    this.kickTimer = 0;          // >0 mientras patea
    this.kickCooldown = 0;
    this.power = 0;
    this.superActive = false;
  }

  get groundY() { return CONFIG.H - CONFIG.GROUND - this.r; }

  // Posición del pie (para colisión con el balón al patear).
  footPos() {
    const t = this.kickTimer / CONFIG.KICK_DURATION;     // 1 -> 0
    const swing = Math.sin((1 - t) * Math.PI);           // arco del golpe
    const reach = CONFIG.FOOT_REACH * (0.4 + 0.6 * swing);
    return {
      x: this.x + this.dir * reach,
      y: this.y + this.r * 0.5 + swing * 18,
    };
  }

  update(dt, ctrl) {
    const c = this.char;
    // Movimiento horizontal
    const speed = CONFIG.PLAYER_SPEED * c.speed;
    if (ctrl.left) this.vx = -speed;
    else if (ctrl.right) this.vx = speed;
    else this.vx *= CONFIG.PLAYER_FRICTION;

    // Mira hacia donde se mueve, si no al centro
    if (ctrl.left) this.dir = -1;
    else if (ctrl.right) this.dir = 1;
    else this.dir = this.side === -1 ? 1 : -1;

    // Salto
    if (ctrl.jump && this.onGround) {
      this.vy = -CONFIG.PLAYER_JUMP * c.jump;
      this.onGround = false;
    }

    // Gravedad
    this.vy += CONFIG.GRAVITY * dt;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Suelo
    if (this.y >= this.groundY) {
      this.y = this.groundY;
      this.vy = 0;
      this.onGround = true;
    }

    // Límites del campo: cada jugador puede cruzar un poco al centro,
    // pero no salir por su lado.
    const minX = this.r + CONFIG.GOAL_DEPTH;
    const maxX = CONFIG.W - this.r - CONFIG.GOAL_DEPTH;
    this.x = Physics.clamp(this.x, minX, maxX);

    // Temporizadores de patada
    if (this.kickTimer > 0) this.kickTimer -= dt;
    if (this.kickCooldown > 0) this.kickCooldown -= dt;

    // Cargar poder con el tiempo
    if (this.power < CONFIG.POWER_MAX) {
      this.power = Math.min(CONFIG.POWER_MAX, this.power + CONFIG.POWER_GAIN * dt);
    }

    // Iniciar patada / súper disparo
    this.superActive = false;
    if (this.kickCooldown <= 0) {
      if (ctrl.power && this.power >= CONFIG.POWER_MAX) {
        this.startKick(true);
      } else if (ctrl.kick) {
        this.startKick(false);
      }
    }
  }

  startKick(isSuper) {
    this.kickTimer = CONFIG.KICK_DURATION;
    this.kickCooldown = CONFIG.KICK_COOLDOWN;
    this.superActive = isSuper;
    if (isSuper) { this.power = 0; Sfx.power(); }
    else Sfx.kick();
    this._kickApplied = false;
  }

  isKicking() { return this.kickTimer > 0; }

  draw(ctx) {
    // Pierna/pie cuando patea
    if (this.isKicking()) {
      const f = this.footPos();
      ctx.strokeStyle = this.char.color;
      ctx.lineWidth = 12;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.r * 0.4);
      ctx.lineTo(f.x, f.y);
      ctx.stroke();
      // Bota
      ctx.beginPath();
      ctx.arc(f.x, f.y, CONFIG.FOOT_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = "#10131c";
      ctx.fill();
    }

    drawHead(ctx, this.char, this.x, this.y, this.r, this.dir, this.isKicking());

    // Aro de carga completa
    if (this.power >= CONFIG.POWER_MAX) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r + 6, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,210,63,0.9)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }
}
