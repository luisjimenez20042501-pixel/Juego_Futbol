/* El balón: física, rebotes contra suelo/techo/paredes y dibujado. */
class Ball {
  constructor() {
    this.r = CONFIG.BALL_RADIUS;
    this.mass = 1;
    this.reset();
  }

  reset(toSide = 0) {
    this.x = CONFIG.W / 2 + toSide * 120;
    this.y = CONFIG.H * 0.35;
    this.vx = 0;
    this.vy = 0;
    this.rot = 0;
    this.trail = [];
    this.charged = false;   // marcado por un súper disparo (estela)
  }

  update(dt) {
    this.vy += CONFIG.GRAVITY * dt;
    this.vx *= CONFIG.BALL_FRICTION;
    Physics.limitSpeed(this, CONFIG.BALL_MAX_SPEED);

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rot += this.vx * dt * 0.05;

    const groundY = CONFIG.H - CONFIG.GROUND - this.r;
    const e = CONFIG.BALL_RESTITUTION;
    let hitWall = false;

    // Suelo
    if (this.y > groundY) {
      this.y = groundY;
      if (Math.abs(this.vy) > 40) hitWall = true;
      this.vy *= -e;
      this.vx *= 0.96;
      if (Math.abs(this.vy) < 30) this.vy = 0;
    }
    // Techo
    if (this.y < this.r) {
      this.y = this.r;
      this.vy *= -e;
      hitWall = true;
    }
    // Las paredes laterales y las porterías las gestiona Game (para que el
    // balón pueda entrar por el hueco del arco en vez de rebotar).

    // Estela del súper disparo
    if (this.charged) {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 12) this.trail.shift();
      if (Math.hypot(this.vx, this.vy) < 260) { this.charged = false; this.trail = []; }
    }

    return hitWall;
  }

  draw(ctx) {
    // Estela
    if (this.charged && this.trail.length) {
      for (let i = 0; i < this.trail.length; i++) {
        const p = this.trail[i];
        const a = i / this.trail.length;
        ctx.beginPath();
        ctx.arc(p.x, p.y, this.r * a, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,${120 + a * 100 | 0},40,${a * 0.5})`;
        ctx.fill();
      }
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    // Cuerpo
    ctx.beginPath();
    ctx.arc(0, 0, this.r, 0, Math.PI * 2);
    ctx.fillStyle = "#fefefe";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.stroke();
    // Pentágonos simples (patrón de balón)
    ctx.fillStyle = "#14181f";
    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2;
      const px = Math.cos(ang) * this.r * 0.5;
      const py = Math.sin(ang) * this.r * 0.5;
      ctx.beginPath();
      ctx.arc(px, py, this.r * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, this.r * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
