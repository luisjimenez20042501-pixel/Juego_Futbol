/* Constantes globales del juego. Todo el "balance" vive aquí. */
const CONFIG = {
  // Tamaño lógico del campo (el canvas se escala para encajar en pantalla).
  W: 900,
  H: 520,
  GROUND: 70,          // alto del suelo desde abajo

  GRAVITY: 2200,       // px/s^2
  AIR_FRICTION: 0.999,

  // Jugador
  PLAYER_RADIUS: 46,
  PLAYER_SPEED: 360,   // px/s base
  PLAYER_JUMP: 860,    // velocidad de salto base
  PLAYER_FRICTION: 0.82,

  // Pie / patada
  FOOT_RADIUS: 16,
  FOOT_REACH: 54,      // distancia del pie desde el centro al patear
  KICK_DURATION: 0.22, // segundos que dura el golpe
  KICK_FORCE: 720,     // impulso base de la patada
  KICK_COOLDOWN: 0.32,

  // Súper disparo
  POWER_MAX: 100,
  POWER_GAIN: 14,      // por segundo
  POWER_SHOT_FORCE: 1500,

  // Balón
  BALL_RADIUS: 20,
  BALL_RESTITUTION: 0.72,   // rebote
  BALL_FRICTION: 0.992,
  BALL_MAX_SPEED: 1600,

  // Portería
  GOAL_HEIGHT: 170,
  GOAL_DEPTH: 14,      // grosor del poste

  // Partido
  MATCH_TIME: 90,      // segundos
  GOLDEN_GOAL: true,   // si empatan al acabar, gana el primer gol

  // Colores del escenario
  SKY_TOP: "#1b2a4a",
  SKY_BOTTOM: "#0b1020",
  FIELD: "#1f7a3d",
  FIELD_DARK: "#186230",
  LINE: "rgba(255,255,255,0.5)",
};
