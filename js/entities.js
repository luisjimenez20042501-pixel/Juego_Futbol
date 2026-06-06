/* Entidades del juego: utilidades vectoriales, Ball y Player.
   La física es propia y por pasos fijos (la llama Match.step). */
window.HC = window.HC || {};

HC.V = {
  len(x, y) { return Math.hypot(x, y); },
  clamp(v, min, max) { return v < min ? min : (v > max ? max : v); },
};

(function () {
  const K = HC.K;

  // --------------------------------------------------------------------- //
  // Balón
  // --------------------------------------------------------------------- //
  class Ball {
    constructor() { this.reset(K.W / 2, K.H / 2 - 80); }
    reset(x, y) {
      this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.r = K.BALL_R;
      this.spin = 0;
    }
    step() {
      this.vy += K.GRAVITY;
      this.vx *= K.AIR_FRICTION;
      this.x += this.vx;
      this.y += this.vy;
      this.spin += this.vx * 0.05;

      // Limitar velocidad
      const sp = HC.V.len(this.vx, this.vy);
      if (sp > K.BALL_MAX_SPEED) {
        const k = K.BALL_MAX_SPEED / sp;
        this.vx *= k; this.vy *= k;
      }

      // Suelo
      if (this.y + this.r > K.GROUND_Y) {
        this.y = K.GROUND_Y - this.r;
        if (this.vy > 0) {
          this.vy = -this.vy * K.BALL_RESTITUTION;
          this.vx *= K.GROUND_FRICTION;
          if (Math.abs(this.vy) > 1.5) HC.Audio.bounce();
        }
      }
      // Techo
      if (this.y - this.r < 0) { this.y = this.r; if (this.vy < 0) this.vy = -this.vy * K.BALL_RESTITUTION; }

      // Las paredes laterales y las porterías las gestiona Match (hay aberturas).
    }
  }

  // --------------------------------------------------------------------- //
  // Jugador
  // --------------------------------------------------------------------- //
  class Player {
    constructor(side, character) {
      this.side = side;                 // -1 mira a la derecha (izq), +1 (der)
      this.facing = side === "left" ? 1 : -1;
      this.char = character;
      this.reset();
    }
    reset() {
      const K = HC.K;
      this.x = this.side === "left" ? K.W * 0.25 : K.W * 0.75;
      this.y = K.GROUND_Y - K.HEAD_R;
      this.vx = 0; this.vy = 0;
      this.onGround = true;
      this.kickTimer = 0;               // frames restantes de patada activa
      this.kickCooldown = 0;
      this.super = 0;                    // carga 0..SUPER_MAX
      this.superActive = 0;              // frames de super activo
    }
    get headX() { return this.x; }
    get headY() { return this.y; }
    get bodyX() { return this.x; }
    get bodyY() { return this.y + K.HEAD_R * 0.7; }

    // Punto del pie cuando patea (hacia el oponente).
    footPoint() {
      const reach = K.KICK_REACH;
      return {
        x: this.x + this.facing * reach,
        y: this.y + K.HEAD_R * 0.9,
      };
    }

    control(input, opponentX) {
      const K = HC.K;
      // Orientación: siempre mira hacia el oponente.
      this.facing = opponentX >= this.x ? 1 : -1;

      if (input.left) this.vx -= K.PLAYER_ACCEL;
      if (input.right) this.vx += K.PLAYER_ACCEL;
      this.vx = HC.V.clamp(this.vx, -K.PLAYER_MAX_SPEED * this.char.speed,
                                     K.PLAYER_MAX_SPEED * this.char.speed);

      if (input.jump && this.onGround) {
        this.vy = -K.JUMP_V * this.char.jump;
        this.onGround = false;
      }
      // Patada
      if (input.kick && this.kickCooldown <= 0) {
        this.kickTimer = K.KICK_DURATION;
        this.kickCooldown = K.KICK_COOLDOWN;
        HC.Audio.kick();
      }
      // Super
      if (input.super && this.super >= K.SUPER_MAX && this.superActive <= 0) {
        this.superActive = 26;
        this.super = 0;
        this.kickTimer = K.KICK_DURATION + 6;
        this.kickCooldown = K.KICK_COOLDOWN;
        HC.Audio.superShot();
      }
    }

    step() {
      const K = HC.K;
      this.vy += K.GRAVITY;
      if (!this.onGround) this.vx *= 0.98; else this.vx *= 0.80;
      this.x += this.vx;
      this.y += this.vy;

      // Suelo
      const floor = K.GROUND_Y - K.HEAD_R;
      if (this.y >= floor) { this.y = floor; this.vy = 0; this.onGround = true; }
      else this.onGround = false;

      // Límites del campo
      this.x = HC.V.clamp(this.x, K.HEAD_R, K.W - K.HEAD_R);

      if (this.kickTimer > 0) this.kickTimer--;
      if (this.kickCooldown > 0) this.kickCooldown--;
      if (this.superActive > 0) this.superActive--;
      if (this.super < K.SUPER_MAX) this.super = Math.min(K.SUPER_MAX, this.super + K.SUPER_GAIN);
    }

    isKicking() { return this.kickTimer > 0; }
    isSuper() { return this.superActive > 0; }
  }

  HC.Ball = Ball;
  HC.Player = Player;
})();
