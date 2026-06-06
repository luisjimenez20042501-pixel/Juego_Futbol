/* Efectos de sonido generados con WebAudio (sin archivos externos). */
const Sfx = {
  ctx: null,
  enabled: true,

  _ensure() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { this.enabled = false; }
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  },

  _tone(freq, dur, type = "sine", vol = 0.2, slideTo = null) {
    if (!this.enabled) return;
    this._ensure();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  },

  kick()  { this._tone(220, 0.10, "square", 0.18, 120); },
  head()  { this._tone(380, 0.07, "sine", 0.15); },
  wall()  { this._tone(160, 0.06, "triangle", 0.12); },
  power() { this._tone(140, 0.22, "sawtooth", 0.22, 520); },
  goal()  {
    this._tone(523, 0.12, "square", 0.2);
    setTimeout(() => this._tone(659, 0.12, "square", 0.2), 110);
    setTimeout(() => this._tone(784, 0.22, "square", 0.22), 230);
  },
  whistle() { this._tone(900, 0.3, "sine", 0.15, 1200); },
};
