# ⚽ Head Clash — Fútbol de Cabezones

Un juego de fútbol 1v1 estilo *Head Soccer* hecho con **HTML5 Canvas + JavaScript
puro** (sin librerías ni dependencias). Física propia, IA, súper disparos,
6 personajes y controles para teclado y móvil. Como son archivos estáticos, se
**despliega en cualquier hosting** en segundos.

## 🎮 Cómo jugar

| Acción | Jugador 1 | Jugador 2 |
|---|---|---|
| Moverse | `A` / `D` | `←` / `→` |
| Saltar | `W` | `↑` |
| Patear | `B` | `L` |
| Súper disparo ⚡ | `V` | `K` |
| Pausa | `Esc` | `Esc` |

- Carga la barra ⚡ (se llena con el tiempo). Cuando esté llena, el súper disparo
  sale potentísimo y con estela de fuego.
- En **móvil** aparecen botones táctiles en pantalla.
- Modos: **1 jugador** (vs CPU con 3 dificultades) y **2 jugadores** en el mismo teclado.
- Gana quien tenga más goles al acabar el tiempo. Si hay empate → **gol de oro**.

## ▶️ Probarlo en local

Como no usa `fetch`, puedes simplemente **abrir `index.html`** con doble clic.
Si tu navegador es estricto, sírvelo con un servidor local:

```cmd
cd head_clash
python -m http.server 8000
```
Y abre **http://127.0.0.1:8000**

## 🚀 Desplegarlo (gratis)

Al ser 100% estático, súbelo tal cual a cualquiera de estos:

- **Netlify**: arrastra la carpeta `head_clash` a https://app.netlify.com/drop
- **GitHub Pages**: sube el repo y activa Pages en la rama principal.
- **Vercel**: `vercel` en la carpeta, o conéctalo a tu repo.
- **itch.io**: comprime la carpeta en un `.zip` (con `index.html` en la raíz) y
  súbelo como proyecto HTML.

No requiere build ni servidor backend.

## 🧩 Estructura del proyecto

```
head_clash/
├─ index.html            # Estructura + pantallas (menú, selección, pausa…)
├─ css/style.css         # Diseño e interfaz
└─ js/
   ├─ config.js          # Constantes y balance del juego
   ├─ physics.js         # Vectores y colisión círculo-círculo
   ├─ characters.js      # Personajes y dibujado de cabezas (canvas)
   ├─ audio.js           # Efectos de sonido generados (WebAudio)
   ├─ input.js           # Teclado (2 jugadores) + táctil
   ├─ ball.js            # Balón: física y render
   ├─ player.js          # Jugador: mover, saltar, patear, poder
   ├─ ai.js              # IA de la CPU (3 dificultades)
   ├─ game.js            # Núcleo del partido (colisiones, goles, marcador)
   └─ main.js            # Pantallas, selección y bucle de juego
```

## ⚙️ Personalización

- **Personajes**: edita `js/characters.js` (colores, stats de velocidad/salto/fuerza).
- **Dificultad y físicas**: ajusta `js/config.js` (gravedad, salto, potencia de
  patada, tiempo de partido, etc.).
- **IA**: los parámetros por dificultad están en `js/ai.js`.
- Todo el dibujo es por código (canvas), así que no hay imágenes que cargar.

## 💡 Ideas para ampliarlo

- Torneo/copa contra varias CPU, porteros, clima, power-ups que caen al campo,
  selección de estadio, marcador online (con un pequeño backend) o tabla de
  récords guardada en `localStorage`.
