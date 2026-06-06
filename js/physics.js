/* Utilidades de física 2D: vectores y colisión círculo-círculo. */
const Physics = {
  dist(ax, ay, bx, by) {
    const dx = ax - bx, dy = ay - by;
    return Math.hypot(dx, dy);
  },

  clamp(v, min, max) {
    return v < min ? min : (v > max ? max : v);
  },

  /* Resuelve la colisión entre dos círculos.
     a = {x,y,vx,vy,r,mass}, b = igual. Modifica posiciones y velocidades.
     Devuelve true si hubo colisión. */
  resolveCircles(a, b, restitution) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    let d = Math.hypot(dx, dy);
    const minDist = a.r + b.r;
    if (d >= minDist || d === 0) return false;

    // Normal de colisión
    const nx = dx / d;
    const ny = dy / d;
    const overlap = minDist - d;

    // Separar según masa inversa
    const imA = 1 / a.mass;
    const imB = 1 / b.mass;
    const totalIm = imA + imB;
    a.x -= nx * overlap * (imA / totalIm);
    a.y -= ny * overlap * (imA / totalIm);
    b.x += nx * overlap * (imB / totalIm);
    b.y += ny * overlap * (imB / totalIm);

    // Velocidad relativa sobre la normal
    const rvx = b.vx - a.vx;
    const rvy = b.vy - a.vy;
    const velAlongNormal = rvx * nx + rvy * ny;
    if (velAlongNormal > 0) return true; // ya se separan

    const e = restitution;
    const j = -(1 + e) * velAlongNormal / totalIm;
    const ix = j * nx;
    const iy = j * ny;
    a.vx -= ix * imA;
    a.vy -= iy * imA;
    b.vx += ix * imB;
    b.vy += iy * imB;
    return true;
  },

  limitSpeed(obj, max) {
    const s = Math.hypot(obj.vx, obj.vy);
    if (s > max) {
      obj.vx = (obj.vx / s) * max;
      obj.vy = (obj.vy / s) * max;
    }
  },
};
