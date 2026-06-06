/* Dibujo del partido en el canvas: estadio, porterías, jugadores, balón y HUD. */
window.HC = window.HC || {};

HC.Render = (function () {
  const K = HC.K;

  function scene(ctx, match) {
    ctx.clearRect(0, 0, K.W, K.H);
    sky(ctx);
    stadium(ctx);
    goals(ctx);
    field(ctx);
    ball(ctx, match.ball);
    player(ctx, match.p1);
    player(ctx, match.p2);
    hud(ctx, match);
    overlayText(ctx, match);
  }

  function sky(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, K.H);
    g.addColorStop(0, "#1a2a6c");
    g.addColorStop(0.5, "#2a4d8f");
    g.addColorStop(1, "#3b6fb5");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, K.W, K.H);
  }

  function stadium(ctx) {
    // Gradas con puntitos de "público".
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fillRect(0, 0, K.W, K.GROUND_Y - 120);
    ctx.save();
    for (let y = 30; y < K.GROUND_Y - 130; y += 16) {
      for (let x = 20; x < K.W; x += 22) {
        ctx.fillStyle = `hsla(${(x + y) % 360}, 60%, 65%, 0.18)`;
        ctx.fillRect(x + (y % 2 ? 8 : 0), y, 8, 8);
      }
    }
    ctx.restore();
  }

  function field(ctx) {
    const gy = K.GROUND_Y;
    const g = ctx.createLinearGradient(0, gy, 0, K.H);
    g.addColorStop(0, "#3aa64a");
    g.addColorStop(1, "#2e8b3d");
    ctx.fillStyle = g;
    ctx.fillRect(0, gy, K.W, K.GROUND_H);
    // Franjas del césped
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    for (let x = 0; x < K.W; x += 80) ctx.fillRect(x, gy, 40, K.GROUND_H);
    // Línea de medio campo
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(K.W / 2, gy); ctx.lineTo(K.W / 2, gy - 60); ctx.stroke();
  }

  function goals(ctx) {
    const top = K.GROUND_Y - K.GOAL_H;
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#f5f5f5";
    // Izquierda
    drawGoal(ctx, 0, top, +1);
    // Derecha
    drawGoal(ctx, K.W, top, -1);
  }

  function drawGoal(ctx, baseX, top, dir) {
    const depth = K.GOAL_DEPTH;
    ctx.save();
    // Red
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= depth; i += 6) {
      ctx.beginPath(); ctx.moveTo(baseX + dir * i, top); ctx.lineTo(baseX + dir * i, K.GROUND_Y); ctx.stroke();
    }
    for (let y = top; y <= K.GROUND_Y; y += 10) {
      ctx.beginPath(); ctx.moveTo(baseX, y); ctx.lineTo(baseX + dir * depth, y); ctx.stroke();
    }
    // Marco (poste + larguero)
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(baseX + dir * depth, top);
    ctx.lineTo(baseX, top);
    ctx.lineTo(baseX, K.GROUND_Y);
    ctx.stroke();
    ctx.restore();
  }

  function ball(ctx, b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.spin);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, b.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Pentágonos simplificados
    ctx.fillStyle = "#222";
    ctx.beginPath(); ctx.arc(0, 0, b.r * 0.34, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * b.r * 0.62, Math.sin(a) * b.r * 0.62, b.r * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    // Sombra
    shadow(ctx, b.x, b.r);
  }

  function player(ctx, p) {
    const c = p.char;
    shadow(ctx, p.x, K.HEAD_R * 0.8);

    // Cuerpo
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.ellipse(p.bodyX, p.bodyY + 6, K.BODY_R, K.BODY_R * 1.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pierna de patada
    if (p.isKicking()) {
      const foot = p.footPoint();
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 12;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(p.bodyX, p.bodyY + 12);
      ctx.lineTo(foot.x, foot.y);
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(foot.x, foot.y, 9, 0, Math.PI * 2); ctx.fill();
    }

    // Aura de super
    if (p.isSuper()) {
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.arc(p.x, p.y, K.HEAD_R + 8 + Math.sin(Date.now() / 60) * 3, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Cabeza
    ctx.fillStyle = c.color;
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(p.x, p.y, K.HEAD_R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Banda de color de acento
    ctx.fillStyle = c.accent;
    ctx.beginPath();
    ctx.arc(p.x, p.y, K.HEAD_R, Math.PI * 1.15, Math.PI * 1.85);
    ctx.lineTo(p.x, p.y);
    ctx.fill();
    // Cara (mira hacia el oponente)
    const fx = p.facing;
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(p.x + fx * 14, p.y - 2, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#1a1a1a";
    ctx.beginPath(); ctx.arc(p.x + fx * 17, p.y - 2, 4.5, 0, Math.PI * 2); ctx.fill();
    // Boca
    ctx.strokeStyle = "#1a1a1a"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(p.x + fx * 12, p.y + 16, 8, 0, Math.PI); ctx.stroke();
  }

  function shadow(ctx, x, r) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.ellipse(x, K.GROUND_Y + 6, r, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ----------------------------------------------------------------- //
  function hud(ctx, match) {
    // Marcador centrado
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    roundRect(ctx, K.W / 2 - 95, 14, 190, 54, 14); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 34px system-ui, sans-serif";
    ctx.fillText(`${match.score.p1}  -  ${match.score.p2}`, K.W / 2, 52);
    // Tiempo
    ctx.font = "bold 16px system-ui, sans-serif";
    ctx.fillStyle = "#ffe082";
    ctx.fillText(formatTime(match.timeLeft), K.W / 2, 86);

    // Barras de super
    superBar(ctx, match.p1, 24, true);
    superBar(ctx, match.p2, K.W - 24 - 180, false);

    // Nombres
    ctx.textAlign = "left";
    ctx.font = "bold 15px system-ui, sans-serif";
    ctx.fillStyle = match.p1.char.color;
    ctx.fillText(match.p1.char.emoji + " " + match.p1.char.name, 24, 24);
    ctx.textAlign = "right";
    ctx.fillStyle = match.p2.char.color;
    ctx.fillText(match.p2.char.name + " " + match.p2.char.emoji, K.W - 24, 24);
  }

  function superBar(ctx, p, x, left) {
    const w = 180, h = 12, y = 34;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    roundRect(ctx, x, y, w, h, 6); ctx.fill();
    const pct = p.super / K.SUPER_MAX;
    ctx.fillStyle = pct >= 1 ? p.char.accent : p.char.color;
    roundRect(ctx, x, y, w * pct, h, 6); ctx.fill();
    if (pct >= 1) {
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px system-ui";
      ctx.textAlign = left ? "left" : "right";
      ctx.fillText("★ SUPER LISTO", left ? x : x + w, y + 24);
    }
  }

  function overlayText(ctx, match) {
    if (match.state === "kickoff") {
      banner(ctx, match.stateTimer > 40 ? "¿LISTOS?" : "¡YA!", "#ffe082");
    } else if (match.state === "goal" && !match.winner) {
      banner(ctx, "¡GOOOL!", "#fff");
    }
  }

  function banner(ctx, text, color) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "900 64px system-ui, sans-serif";
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillText(text, K.W / 2 + 3, K.H / 2 + 3);
    ctx.fillStyle = color;
    ctx.fillText(text, K.W / 2, K.H / 2);
    ctx.restore();
  }

  function formatTime(s) {
    const m = Math.floor(s / 60), ss = s % 60;
    return `${m}:${String(ss).padStart(2, "0")}`;
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, h / 2, w / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  return { scene };
})();
