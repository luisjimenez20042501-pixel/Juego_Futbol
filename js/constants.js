/* Constantes de juego y roster de personajes.
   Todo el balance vive aquí para ajustarlo fácil. */
window.HC = window.HC || {};

HC.K = {
  // Resolución lógica (el canvas se escala con CSS).
  W: 960,
  H: 540,
  GROUND_H: 70,           // alto del césped desde abajo
  get GROUND_Y() { return HC.K.H - HC.K.GROUND_H; },

  GRAVITY: 0.62,
  AIR_FRICTION: 0.992,
  GROUND_FRICTION: 0.90,

  // Balón
  BALL_R: 15,
  BALL_RESTITUTION: 0.74,
  BALL_MAX_SPEED: 28,

  // Jugador
  HEAD_R: 44,
  BODY_R: 30,
  PLAYER_ACCEL: 1.4,
  PLAYER_MAX_SPEED: 6.2,
  JUMP_V: 14.5,
  KICK_DURATION: 10,      // frames que dura activo el pie
  KICK_COOLDOWN: 16,
  KICK_REACH: 46,
  KICK_POWER: 15,
  HEAD_BOUNCE: 1.0,

  // Portería
  GOAL_H: 175,            // alto de la portería desde el suelo
  GOAL_DEPTH: 26,         // saliente del marco

  // Partido
  GOALS_TO_WIN: 5,
  MATCH_SECONDS: 90,
  SUPER_MAX: 100,         // carga necesaria para el super
  SUPER_GAIN: 0.22,       // carga por frame

  FPS: 60,
};

// Personajes: cada uno con multiplicadores y color.
HC.CHARACTERS = [
  { id: "blaze",  name: "Blaze",   color: "#ff5252", accent: "#ffd54f", speed: 1.10, jump: 1.00, power: 1.05, emoji: "🔥" },
  { id: "frost",  name: "Frost",   color: "#40c4ff", accent: "#e1f5fe", speed: 1.00, jump: 1.12, power: 1.00, emoji: "❄️" },
  { id: "bolt",   name: "Bolt",    color: "#ffca28", accent: "#fff59d", speed: 1.20, jump: 1.05, power: 0.92, emoji: "⚡" },
  { id: "tank",   name: "Tank",    color: "#8d6e63", accent: "#d7ccc8", speed: 0.85, jump: 0.92, power: 1.25, emoji: "🛡️" },
  { id: "ninja",  name: "Ninja",   color: "#5c6bc0", accent: "#c5cae9", speed: 1.12, jump: 1.15, power: 0.98, emoji: "🥷" },
  { id: "verde",  name: "Verde",   color: "#66bb6a", accent: "#c8e6c9", speed: 1.05, jump: 1.05, power: 1.05, emoji: "🍀" },
  { id: "rey",    name: "Rey",     color: "#ab47bc", accent: "#f3e5f5", speed: 1.00, jump: 1.00, power: 1.15, emoji: "👑" },
  { id: "pulpo",  name: "Pulpo",   color: "#ec407a", accent: "#fce4ec", speed: 1.08, jump: 1.08, power: 1.02, emoji: "🐙" },
];

HC.getCharacter = function (id) {
  return HC.CHARACTERS.find(c => c.id === id) || HC.CHARACTERS[0];
};

HC.DIFFICULTY = {
  facil:   { react: 0.045, error: 90, aggression: 0.6, name: "Fácil" },
  normal:  { react: 0.09,  error: 45, aggression: 0.85, name: "Normal" },
  dificil: { react: 0.16,  error: 16, aggression: 1.0, name: "Difícil" },
};
