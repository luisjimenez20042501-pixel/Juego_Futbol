/* Definición de personajes y dibujado de sus cabezas con canvas (sin imágenes).
   Cada personaje tiene stats normalizados (0.8 - 1.3 aprox). */
const CHARACTERS = [
  { id: "toro",   name: "Toro",   color: "#e63946", band: "#ffd23f", speed: 1.00, jump: 1.00, power: 1.05, face: "angry" },
  { id: "rayo",   name: "Rayo",   color: "#457b9d", band: "#a8dadc", speed: 1.20, jump: 1.02, power: 0.90, face: "cool" },
  { id: "tanque", name: "Tanque", color: "#2a9d8f", band: "#264653", speed: 0.85, jump: 0.90, power: 1.30, face: "tough" },
  { id: "pulga",  name: "Pulga",  color: "#e9c46a", band: "#e76f51", speed: 1.30, jump: 1.22, power: 0.82, face: "happy" },
  { id: "sombra", name: "Sombra", color: "#6d4ec9", band: "#b5179e", speed: 1.06, jump: 1.16, power: 1.02, face: "cool" },
  { id: "fuego",  name: "Fuego",  color: "#f3722c", band: "#f94144", speed: 1.02, jump: 1.02, power: 1.18, face: "angry" },
];

function getCharacter(id) {
  return CHARACTERS.find(c => c.id === id) || CHARACTERS[0];
}

/* Dibuja la cabeza del personaje en (cx, cy) con radio r mirando a `dir` (1 dcha, -1 izq). */
function drawHead(ctx, char, cx, cy, r, dir = 1, kicking = false) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(dir, 1);

  // Sombra inferior
  ctx.beginPath();
  ctx.ellipse(0, r * 0.9, r * 0.8, r * 0.25, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fill();

  // Cabeza
  const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.2, 0, 0, r);
  grad.addColorStop(0, lighten(char.color, 30));
  grad.addColorStop(1, char.color);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.06);
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.stroke();

  // Banda en la frente
  ctx.beginPath();
  ctx.arc(0, -r * 0.45, r, Math.PI * 1.15, Math.PI * 1.85);
  ctx.lineWidth = r * 0.22;
  ctx.strokeStyle = char.band;
  ctx.stroke();

  // Ojos
  const eyeY = -r * 0.05;
  const eyeX = r * 0.32;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(sx * eyeX, eyeY, r * 0.16, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx * eyeX + r * 0.06, eyeY, r * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = "#10131c";
    ctx.fill();
  }

  // Cejas según expresión
  ctx.strokeStyle = "#10131c";
  ctx.lineWidth = r * 0.08;
  ctx.lineCap = "round";
  if (char.face === "angry" || char.face === "tough") {
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sx * (eyeX - r * 0.14), -r * 0.28);
      ctx.lineTo(sx * (eyeX + r * 0.12), -r * 0.16);
      ctx.stroke();
    }
  }

  // Boca
  ctx.beginPath();
  if (kicking || char.face === "happy") {
    ctx.arc(0, r * 0.32, r * 0.26, 0, Math.PI);
  } else if (char.face === "angry") {
    ctx.arc(0, r * 0.5, r * 0.26, Math.PI, Math.PI * 2);
  } else {
    ctx.moveTo(-r * 0.2, r * 0.4);
    ctx.lineTo(r * 0.2, r * 0.4);
  }
  ctx.lineWidth = r * 0.07;
  ctx.stroke();

  ctx.restore();
}

function lighten(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
  r = Math.min(255, r); g = Math.min(255, g); b = Math.min(255, b);
  return `rgb(${r},${g},${b})`;
}
