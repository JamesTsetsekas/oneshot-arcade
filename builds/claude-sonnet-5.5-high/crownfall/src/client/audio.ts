/** Procedural Web Audio: spatial-ish SFX with a voice budget and an adaptive three-layer music bed. No audio files. */
export class AudioMgr {
  ctx: AudioContext | null = null;
  master!: GainNode; sfxBus!: GainNode; musicBus!: GainNode;
  vol = 0.6; musicVol = 0.35;
  listener = { x: 0, z: 0 };
  voices = 0;
  private noiseBuf: AudioBuffer | null = null;
  private intensity = 0; private targetIntensity = 0;
  private musicTimer = 0; private step = 0; private musicOn = false;
  private lastPlayed = new Map<string, number>();
  private layerGain: GainNode[] = [];

  init() {
    if (this.ctx) { void this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
    } catch { return; }
    const c = this.ctx;
    this.master = c.createGain(); this.master.connect(c.destination);
    const comp = c.createDynamicsCompressor(); comp.connect(this.master);
    this.sfxBus = c.createGain(); this.sfxBus.connect(comp);
    this.musicBus = c.createGain(); this.musicBus.connect(this.master);
    this.setVolumes(this.vol, this.musicVol);
    const len = c.sampleRate * 1;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  setVolumes(sfx: number, music: number) {
    this.vol = sfx; this.musicVol = music;
    if (!this.ctx) return;
    this.sfxBus.gain.value = sfx;
    this.musicBus.gain.value = music * 0.5;
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, slide = 0, delay = 0, bus?: AudioNode) {
    const c = this.ctx!;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    const t = c.currentTime + delay;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + Math.min(0.02, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus ?? this.sfxBus);
    o.start(t); o.stop(t + dur + 0.05);
  }
  private noise(dur: number, freq: number, vol: number, q = 1, type: BiquadFilterType = 'bandpass', delay = 0, slide = 0) {
    const c = this.ctx!;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type; f.Q.value = q;
    const t = c.currentTime + delay;
    f.frequency.setValueAtTime(freq, t);
    if (slide) f.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.sfxBus);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }

  /** world-positioned SFX: volume falls off with distance from the listener. */
  at(name: string, x: number, z: number, gain = 1) {
    const d = Math.hypot(x - this.listener.x, z - this.listener.z);
    const g = gain * Math.max(0, 1 - d / 46);
    if (g < 0.04) return;
    this.play(name, g);
  }

  play(name: string, v = 1) {
    if (!this.ctx || this.vol <= 0) return;
    const now = this.ctx.currentTime;
    const last = this.lastPlayed.get(name) ?? 0;
    const minGap = ['shoot', 'swing', 'hit'].includes(name) ? 0.09 : 0.03;
    if (now - last < minGap || this.voices > 40) return;
    this.lastPlayed.set(name, now);
    this.voices++;
    setTimeout(() => { this.voices--; }, 350);
    const k = 0.5 * v;
    switch (name) {
      case 'shoot': this.tone(620, 0.09, 'triangle', 0.22 * k, -300); this.noise(0.06, 3200, 0.1 * k, 2); break;
      case 'swing': this.noise(0.12, 1200, 0.28 * k, 0.8, 'bandpass', 0, -700); break;
      case 'hit': this.noise(0.07, 900, 0.3 * k, 1.5); break;
      case 'slam': this.tone(110, 0.3, 'sawtooth', 0.5 * k, -60); this.noise(0.22, 400, 0.5 * k, 0.5, 'lowpass'); break;
      case 'boom': this.tone(70, 0.5, 'sine', 0.8 * k, -35); this.noise(0.4, 500, 0.6 * k, 0.6, 'lowpass', 0, -300); break;
      case 'stone': this.noise(0.25, 280, 0.55 * k, 1, 'lowpass'); this.tone(150, 0.2, 'square', 0.15 * k, -60); break;
      case 'zap': this.tone(1100, 0.16, 'sawtooth', 0.22 * k, -700); this.tone(1650, 0.1, 'sine', 0.12 * k, -900, 0.02); break;
      case 'beam': this.tone(300, 0.5, 'sawtooth', 0.4 * k, 900); this.noise(0.45, 2400, 0.3 * k, 1, 'bandpass', 0, 2200); break;
      case 'hush': this.tone(220, 0.7, 'sine', 0.35 * k, -80); this.tone(330, 0.7, 'sine', 0.2 * k, -120, 0.05); break;
      case 'wave': this.tone(196, 0.9, 'triangle', 0.4 * k, 120); this.tone(294, 0.9, 'sine', 0.25 * k, 160, 0.1); break;
      case 'marsh': this.tone(80, 0.8, 'sawtooth', 0.3 * k, 30); this.noise(0.6, 300, 0.3 * k, 1.5, 'lowpass'); break;
      case 'erase': this.noise(0.25, 4000, 0.35 * k, 1, 'highpass', 0, -2500); this.tone(900, 0.2, 'square', 0.14 * k, -600); break;
      case 'ring': this.tone(523, 0.35, 'sine', 0.35 * k, 0); this.tone(784, 0.4, 'sine', 0.22 * k, 0, 0.05); break;
      case 'prism': this.tone(1320, 0.35, 'sine', 0.3 * k, -900); this.tone(1980, 0.3, 'triangle', 0.15 * k, -1200, 0.03); break;
      case 'buy': this.tone(660, 0.08, 'square', 0.18 * k); this.tone(990, 0.14, 'square', 0.18 * k, 0, 0.08); break;
      case 'sell': this.tone(880, 0.08, 'square', 0.15 * k); this.tone(560, 0.14, 'square', 0.15 * k, 0, 0.08); break;
      case 'ward': this.tone(740, 0.12, 'sine', 0.3 * k, 300); break;
      case 'levelup': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.3 * k, 0, i * 0.07)); break;
      case 'kill': this.tone(392, 0.12, 'square', 0.25 * k); this.tone(523, 0.12, 'square', 0.25 * k, 0, 0.1); this.tone(784, 0.3, 'square', 0.25 * k, 0, 0.2); break;
      case 'death': this.tone(300, 0.6, 'sawtooth', 0.35 * k, -240); break;
      case 'tower': this.tone(90, 1.0, 'sawtooth', 0.6 * k, -50); this.noise(0.9, 600, 0.6 * k, 0.5, 'lowpass', 0, -450); break;
      case 'seal': this.tone(180, 1.2, 'sine', 0.6 * k, -100); this.tone(540, 1.0, 'triangle', 0.3 * k, -300, 0.05); break;
      case 'objective': [196, 247, 294].forEach((f, i) => this.tone(f, 0.9, 'triangle', 0.32 * k, 0, i * 0.12)); break;
      case 'alert': this.tone(880, 0.1, 'square', 0.22 * k); this.tone(880, 0.1, 'square', 0.22 * k, 0, 0.16); break;
      case 'buff': this.tone(440, 0.4, 'sine', 0.3 * k, 440); break;
      case 'victory': [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.5, 'triangle', 0.4 * k, 0, i * 0.14)); break;
      case 'defeat': [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.6, 'triangle', 0.4 * k, 0, i * 0.2)); break;
      case 'click': this.tone(500, 0.04, 'square', 0.12 * k); break;
      case 'recall': this.tone(500, 0.9, 'sine', 0.2 * k, 500); break;
      case 'error': this.tone(160, 0.12, 'sawtooth', 0.2 * k); break;
      case 'spawn': this.tone(330, 0.25, 'triangle', 0.25 * k, 330); break;
      default: this.tone(440, 0.05, 'sine', 0.1 * k);
    }
  }

  // ---------------------------------------------------------------- music
  startMusic() {
    if (!this.ctx || this.musicOn) return;
    this.musicOn = true;
    const c = this.ctx;
    for (let i = 0; i < 3; i++) { const g = c.createGain(); g.gain.value = i === 0 ? 1 : 0; g.connect(this.musicBus); this.layerGain.push(g); }
    const tick = () => {
      if (!this.musicOn) return;
      this.stepMusic();
      this.musicTimer = window.setTimeout(tick, 450);
    };
    tick();
  }
  stopMusic() { this.musicOn = false; window.clearTimeout(this.musicTimer); this.layerGain = []; }
  setIntensity(v: number) { this.targetIntensity = Math.max(0, Math.min(1, v)); }

  private stepMusic() {
    const c = this.ctx!;
    this.intensity += (this.targetIntensity - this.intensity) * 0.12;
    const I = this.intensity;
    this.layerGain[1].gain.setTargetAtTime(I > 0.25 ? 0.8 : 0, c.currentTime, 0.6);
    this.layerGain[2].gain.setTargetAtTime(I > 0.6 ? 0.9 : 0, c.currentTime, 0.6);
    const chords = [[220, 261.6, 329.6], [196, 246.9, 293.7], [174.6, 220, 261.6], [196, 246.9, 311.1]];
    const s = this.step++;
    const chord = chords[Math.floor(s / 8) % chords.length];
    if (s % 8 === 0) for (const f of chord) this.tone(f / 2, 3.8, 'sine', 0.16, 0, 0, this.layerGain[0]);
    if (I > 0.25 && s % 2 === 0) this.tone(chord[(s / 2) % 3 | 0] * 2, 0.35, 'triangle', 0.1, 0, 0, this.layerGain[1]);
    if (I > 0.6 && s % 2 === 1) { this.noise(0.08, 200, 0.12, 1, 'lowpass'); }
    if (I > 0.6 && s % 4 === 0) this.tone(65, 0.25, 'sine', 0.35, -30, 0, this.layerGain[2]);
  }
}
export const audio = new AudioMgr();
