// Thin Web Audio mixer: grouped buses (music / sfx / ui), a pooled positional voice budget with
// distance attenuation and per-sound rate limits, procedural (original) synthesized SFX with
// distinct faction palettes, and an adaptive generative score with intensity hysteresis.

type Bus = 'sfx' | 'ui' | 'music';

export class AudioMixer {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private buses!: Record<Bus, GainNode>;
  private noiseBuf!: AudioBuffer;
  private lastPlay = new Map<string, number>();
  private activeVoices = 0;
  readonly maxVoices = 32;
  volumes = { master: 0.8, music: 0.5, sfx: 0.8, ui: 0.7 };
  faction: 'helix' | 'verdant' = 'helix';
  // music
  private music: { layers: GainNode[]; nextBeat: number; beat: number; timer: number } | null = null;
  intensity = 0; private targetIntensity = 0; private intensityHold = 0;
  muted = false;

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume(); return; }
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
    } catch { this.ctx = null; return; }
    const ctx = this.ctx;
    this.master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    this.master.connect(comp).connect(ctx.destination);
    this.buses = { sfx: ctx.createGain(), ui: ctx.createGain(), music: ctx.createGain() };
    for (const b of Object.values(this.buses)) b.connect(this.master);
    const len = ctx.sampleRate;
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    let s = 1;
    for (let i = 0; i < len; i++) { s = (s * 16807) % 2147483647; d[i] = (s / 2147483647) * 2 - 1; }
    this.applyVolumes();
  }

  applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.muted ? 0 : this.volumes.master, t, 0.05);
    this.buses.sfx.gain.setTargetAtTime(this.volumes.sfx * 0.6, t, 0.05);
    this.buses.ui.gain.setTargetAtTime(this.volumes.ui * 0.6, t, 0.05);
    this.buses.music.gain.setTargetAtTime(this.volumes.music * 0.35, t, 0.05);
  }

  suspend() { void this.ctx?.suspend(); }
  resume() { void this.ctx?.resume(); }

  private rateOk(key: string, ms: number): boolean {
    const now = performance.now();
    const last = this.lastPlay.get(key) ?? -1e9;
    if (now - last < ms) return false;
    this.lastPlay.set(key, now);
    return true;
  }

  // ---------------------------------------------------------------- primitives
  private env(g: GainNode, t: number, a: number, peak: number, dec: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }
  private tone(out: AudioNode, type: OscillatorType, f0: number, f1: number, t: number, dur: number, peak: number, attack = 0.005) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    this.env(g, t, attack, peak, dur);
    o.connect(g).connect(out);
    o.start(t); o.stop(t + attack + dur + 0.05);
  }
  private noise(out: AudioNode, t: number, dur: number, peak: number, filter: BiquadFilterType, f0: number, f1 = f0, q = 1) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource(); src.buffer = this.noiseBuf;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const bq = ctx.createBiquadFilter(); bq.type = filter; bq.Q.value = q;
    bq.frequency.setValueAtTime(f0, t); bq.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    const g = ctx.createGain(); this.env(g, t, 0.003, peak, dur);
    src.connect(bq).connect(g).connect(out);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
  }

  /** positional SFX: pan from screen x (-1..1), attenuation from distance to the camera focus */
  play(name: string, pan = 0, dist = 0, rateMs = 45) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    if (dist > 55) return; // virtualized: too far to matter
    if (!this.rateOk(name, rateMs)) return;
    if (this.activeVoices >= this.maxVoices) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + 0.005;
    const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan));
    const g = ctx.createGain(); g.gain.value = 1 / (1 + dist * dist * 0.0025);
    p.connect(g).connect(this.buses.sfx);
    this.activeVoices++;
    setTimeout(() => { this.activeVoices--; try { p.disconnect(); g.disconnect(); } catch { /* noop */ } }, 900);
    this.synth(name, p, t);
  }
  ui(name: string, rateMs = 60) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    if (!this.rateOk('ui:' + name, rateMs)) return;
    this.synth(name, this.buses.ui, this.ctx.currentTime + 0.005);
  }

  private synth(name: string, o: AudioNode, t: number) {
    const helix = this.faction === 'helix';
    switch (name) {
      case 'rifle': this.noise(o, t, 0.06, 0.35, 'highpass', 2500, 1200); this.tone(o, 'square', 900, 300, t, 0.03, 0.08); break;
      case 'arc': this.tone(o, 'sawtooth', 1200, 250, t, 0.12, 0.15); this.noise(o, t, 0.08, 0.2, 'bandpass', 3000, 1000, 3); break;
      case 'lance': this.tone(o, 'sine', 1800, 220, t, 0.18, 0.22); this.noise(o, t, 0.12, 0.15, 'highpass', 4000, 2000); break;
      case 'shell': this.tone(o, 'sine', 140, 45, t, 0.25, 0.5); this.noise(o, t, 0.15, 0.2, 'lowpass', 900, 200); break;
      case 'boom': this.noise(o, t, 0.6, 0.55, 'lowpass', 1200, 90); this.tone(o, 'sine', 90, 30, t, 0.5, 0.5); break;
      case 'spore': this.noise(o, t, 0.12, 0.22, 'bandpass', 1400, 600, 2); this.tone(o, 'sine', 1300, 1250, t + 0.02, 0.15, 0.05); break;
      case 'needle': this.tone(o, 'triangle', 2200, 1300, t, 0.05, 0.12); break;
      case 'melee': this.noise(o, t, 0.05, 0.25, 'bandpass', 700, 300, 2); break;
      case 'eruption': this.noise(o, t, 0.7, 0.5, 'lowpass', 500, 60); this.tone(o, 'sine', 70, 35, t, 0.6, 0.4); this.tone(o, 'sine', 1500, 1480, t + 0.1, 0.4, 0.04); break;
      case 'torch': this.noise(o, t, 0.08, 0.08, 'highpass', 5000, 5000); break;
      case 'death_mech': this.tone(o, 'square', 260, 50, t, 0.35, 0.18); this.noise(o, t, 0.4, 0.3, 'lowpass', 2500, 200); this.tone(o, 'triangle', 1700, 900, t + 0.05, 0.1, 0.06); break;
      case 'death_bio': this.noise(o, t, 0.5, 0.3, 'bandpass', 900, 150, 4); this.tone(o, 'sine', 420, 120, t, 0.45, 0.12); break;
      case 'death_struct': this.noise(o, t, 1.1, 0.7, 'lowpass', 1500, 60); this.tone(o, 'sine', 60, 25, t, 1.0, 0.6); break;
      case 'crystal': for (let i = 0; i < 5; i++) this.tone(o, 'sine', 1800 + i * 330, 1700 + i * 300, t + i * 0.04, 0.5, 0.06); this.noise(o, t, 0.4, 0.3, 'highpass', 3000, 6000); break;
      case 'pulse': this.tone(o, 'sine', 220, 440, t, 1.2, 0.2, 0.2); this.tone(o, 'sine', 330, 660, t + 0.1, 1.1, 0.12, 0.2); break;
      case 'select':
        if (helix) { this.tone(o, 'square', 1900, 1900, t, 0.015, 0.06); this.tone(o, 'square', 2400, 2400, t + 0.04, 0.015, 0.05); }
        else { this.noise(o, t, 0.09, 0.08, 'bandpass', 1600, 900, 3); this.tone(o, 'sine', 640, 760, t, 0.12, 0.08, 0.02); }
        break;
      case 'ack_move':
        if (helix) { this.tone(o, 'square', 700, 700, t, 0.02, 0.05); this.tone(o, 'square', 1050, 1050, t + 0.05, 0.02, 0.05); }
        else { this.tone(o, 'sine', 520, 700, t, 0.14, 0.09, 0.02); this.noise(o, t, 0.08, 0.05, 'bandpass', 1200, 800, 3); }
        break;
      case 'ack_attack':
        if (helix) { this.tone(o, 'sawtooth', 300, 300, t, 0.04, 0.07); this.tone(o, 'sawtooth', 220, 220, t + 0.06, 0.05, 0.07); }
        else { this.tone(o, 'triangle', 380, 260, t, 0.16, 0.1, 0.01); this.noise(o, t, 0.12, 0.06, 'bandpass', 700, 400, 3); }
        break;
      case 'ack_build': this.tone(o, helix ? 'square' : 'sine', 500, 500, t, 0.03, 0.06); this.tone(o, helix ? 'square' : 'sine', 750, 750, t + 0.05, 0.03, 0.06); break;
      case 'click': this.tone(o, 'triangle', 1400, 1400, t, 0.02, 0.05); break;
      case 'invalid': this.tone(o, 'square', 150, 140, t, 0.14, 0.08); break;
      case 'alert_attack': for (let i = 0; i < 3; i++) { this.tone(o, 'triangle', 520, 520, t + i * 0.16, 0.08, 0.14); this.tone(o, 'triangle', 390, 390, t + i * 0.16 + 0.08, 0.06, 0.1); } break;
      case 'alert_supply': this.tone(o, 'sine', 660, 660, t, 0.12, 0.12); this.tone(o, 'sine', 440, 440, t + 0.14, 0.2, 0.12); break;
      case 'alert_resources': this.tone(o, 'square', 300, 280, t, 0.1, 0.06); this.tone(o, 'square', 300, 280, t + 0.13, 0.1, 0.06); break;
      case 'alert_research': [523, 659, 784, 1047].forEach((f, i) => this.tone(o, 'sine', f, f, t + i * 0.07, 0.18, 0.09)); break;
      case 'alert_built': this.tone(o, 'sine', 784, 784, t, 0.2, 0.09); this.tone(o, 'sine', 1175, 1175, t + 0.08, 0.3, 0.07); break;
      case 'alert_unit': this.tone(o, helix ? 'square' : 'triangle', 880, 880, t, 0.04, 0.04); break;
      case 'alert_depleted': this.tone(o, 'triangle', 600, 300, t, 0.35, 0.1); break;
      case 'alert_pylon': [392, 523, 659].forEach((f, i) => this.tone(o, 'triangle', f, f, t + i * 0.06, 0.15, 0.08)); break;
      case 'ping': this.tone(o, 'sine', 1200, 900, t, 0.25, 0.12); break;
      case 'queue': this.tone(o, 'triangle', 980, 980, t, 0.03, 0.05); break;
      case 'victory': [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(o, 'triangle', f, f, t + i * 0.12, 0.6, 0.12, 0.02)); break;
      case 'defeat': [440, 349, 294, 220].forEach((f, i) => this.tone(o, 'sine', f, f * 0.98, t + i * 0.22, 0.7, 0.12, 0.03)); break;
    }
  }

  // ---------------------------------------------------------------- adaptive score
  startMusic() {
    if (!this.ctx || this.music) return;
    const ctx = this.ctx;
    const layers = [0, 1, 2, 3].map(() => { const g = ctx.createGain(); g.gain.value = 0; g.connect(this.buses.music); return g; });
    this.music = { layers, nextBeat: ctx.currentTime + 0.2, beat: 0, timer: 0 };
    this.music.timer = window.setInterval(() => this.scheduleMusic(), 200);
  }
  stopMusic() {
    if (!this.music) return;
    clearInterval(this.music.timer);
    for (const l of this.music.layers) { l.gain.setTargetAtTime(0, this.ctx!.currentTime, 0.3); setTimeout(() => l.disconnect(), 1500); }
    this.music = null;
  }
  /** request an intensity (0 economy, 1 threat, 2 battle, 3 endgame); hysteresis avoids flapping */
  setIntensity(level: number) {
    const now = performance.now();
    if (level > this.targetIntensity) { this.targetIntensity = level; this.intensityHold = now + 12000; }
    else if (level < this.targetIntensity && now > this.intensityHold) this.targetIntensity = level;
  }
  private scheduleMusic() {
    const m = this.music;
    if (!m || !this.ctx) return;
    const ctx = this.ctx;
    this.intensity += (this.targetIntensity - this.intensity) * 0.08;
    const lv = this.intensity;
    const tgt = [0.55, Math.min(1, Math.max(0, lv)) * 0.5, Math.min(1, Math.max(0, lv - 1)) * 0.55, Math.min(1, Math.max(0, lv - 2)) * 0.5];
    m.layers.forEach((g, i) => g.gain.setTargetAtTime(tgt[i], ctx.currentTime, 1.5));
    const helix = this.faction === 'helix';
    const bpm = 84 + lv * 10;
    const spb = 60 / bpm;
    // Dorian-ish progression, original
    const roots = [110, 98, 130.81, 116.54];
    while (m.nextBeat < ctx.currentTime + 0.6) {
      const t = m.nextBeat;
      const bar = Math.floor(m.beat / 8) % roots.length;
      const root = roots[bar];
      const step = m.beat % 8;
      if (step === 0) {
        // pad / drone layer
        for (const mul of [1, 1.5, 2.0]) {
          const o = ctx.createOscillator(); const g = ctx.createGain(); const f = ctx.createBiquadFilter();
          o.type = helix ? 'sawtooth' : 'triangle'; o.frequency.value = root * mul * (helix ? 1 : 1.002);
          f.type = 'lowpass'; f.frequency.value = helix ? 600 : 900;
          g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + spb * 2); g.gain.exponentialRampToValueAtTime(0.0001, t + spb * 8.5);
          o.connect(f).connect(g).connect(m.layers[0]); o.start(t); o.stop(t + spb * 9);
        }
      }
      // threat arpeggio
      const arp = [1, 1.5, 2, 2.4, 3, 2.4, 2, 1.5];
      { const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = helix ? 'square' : 'sine'; o.frequency.value = root * 2 * arp[step];
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(helix ? 0.03 : 0.05, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + spb * 0.9);
        o.connect(g).connect(m.layers[1]); o.start(t); o.stop(t + spb); }
      // battle percussion
      if (step % 2 === 0 || (helix && step === 7)) {
        const src = ctx.createBufferSource(); src.buffer = this.noiseBuf;
        const f = ctx.createBiquadFilter(); f.type = step % 4 === 0 ? 'lowpass' : 'highpass'; f.frequency.value = step % 4 === 0 ? 180 : 5000;
        const g = ctx.createGain(); g.gain.setValueAtTime(step % 4 === 0 ? 0.5 : 0.08, t); g.gain.exponentialRampToValueAtTime(0.0001, t + (step % 4 === 0 ? 0.25 : 0.06));
        src.connect(f).connect(g).connect(m.layers[2]); src.start(t, Math.random()); src.stop(t + 0.3);
        if (step % 4 === 0) { const o = ctx.createOscillator(); const og = ctx.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.2); og.gain.setValueAtTime(0.4, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.25); o.connect(og).connect(m.layers[2]); o.start(t); o.stop(t + 0.3); }
      }
      // endgame high shimmer
      if (step === 4) {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = root * 6;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.04, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + spb * 4);
        o.connect(g).connect(m.layers[3]); o.start(t); o.stop(t + spb * 4.2);
      }
      m.beat++;
      m.nextBeat += spb;
    }
  }
}

export const audio = new AudioMixer();
