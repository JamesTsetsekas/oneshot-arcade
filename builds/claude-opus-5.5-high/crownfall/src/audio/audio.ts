// Web Audio mixer: procedural SFX with spatial pan/attenuation, priority for high-threat cues,
// voice cap, and adaptive music layers (calm / contest / fight / siege). All sounds are synthesized.
type Bus = 'sfx' | 'music' | 'ui';

export class AudioEngine {
  ctx: AudioContext | null = null;
  master!: GainNode; sfx!: GainNode; music!: GainNode; ui!: GainNode;
  voices = 0;
  maxVoices = 48;
  listener = { x: 0, y: 0 };
  hushed = false;
  private noiseBuf: AudioBuffer | null = null;
  private layers: Array<{ gain: GainNode; target: number }> = [];
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  intensity = 0; // 0 calm, 1 contest, 2 fight, 3 siege
  private lastPlay = new Map<string, number>();

  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AC();
    } catch { return; }
    const c = this.ctx!;
    this.master = c.createGain(); this.master.connect(c.destination);
    const comp = c.createDynamicsCompressor(); comp.connect(this.master);
    this.sfx = c.createGain(); this.sfx.connect(comp);
    this.ui = c.createGain(); this.ui.connect(comp);
    this.music = c.createGain(); this.music.connect(this.master);
    this.noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  setVolumes(master: number, music: number, sfx: number) {
    if (!this.ctx) return;
    this.master.gain.value = master;
    this.music.gain.value = music * 0.5;
    this.sfx.gain.value = sfx; this.ui.gain.value = sfx;
  }

  private canPlay(key: string, minGap: number) {
    const t = performance.now();
    if ((this.lastPlay.get(key) ?? 0) + minGap * 1000 > t) return false;
    this.lastPlay.set(key, t);
    return true;
  }

  /** Spatial routing: pan by screen-relative x and attenuate with distance; virtualize far sounds. */
  private route(bus: Bus, pos?: { x: number; y: number }, critical = false): AudioNode | null {
    const c = this.ctx!;
    let gain = 1, pan = 0;
    if (pos) {
      const dx = pos.x - this.listener.x, dy = pos.y - this.listener.y;
      const d = Math.hypot(dx, dy);
      if (d > 45 && !critical) return null;
      gain = Math.max(0.12, 1 - d / 50);
      // camera right vector is (sin45, cos45) in sim coords
      pan = Math.max(-1, Math.min(1, (dx * 0.707 + dy * 0.707) / 25));
    }
    if (this.hushed && !critical && bus === 'sfx') gain *= 0.25;
    const g = c.createGain(); g.gain.value = gain;
    const p = c.createStereoPanner(); p.pan.value = pan;
    g.connect(p); p.connect(bus === 'sfx' ? this.sfx : bus === 'music' ? this.music : this.ui);
    return g;
  }

  tone(o: { f: number; f2?: number; dur: number; type?: OscillatorType; vol?: number; bus?: Bus; pos?: { x: number; y: number }; critical?: boolean; attack?: number; delay?: number }) {
    if (!this.ctx) return;
    if (this.voices >= this.maxVoices && !o.critical) return;
    const out = this.route(o.bus ?? 'sfx', o.pos, o.critical);
    if (!out) return;
    const c = this.ctx, t0 = c.currentTime + (o.delay ?? 0);
    const osc = c.createOscillator(); osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(o.f, t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t0 + o.dur);
    const g = c.createGain();
    const v = (o.vol ?? 0.3);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + (o.attack ?? 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    osc.connect(g); g.connect(out);
    osc.start(t0); osc.stop(t0 + o.dur + 0.05);
    this.voices++;
    osc.onended = () => { this.voices--; };
  }

  noise(o: { dur: number; freq: number; q?: number; vol?: number; bus?: Bus; pos?: { x: number; y: number }; critical?: boolean; type?: BiquadFilterType; sweep?: number }) {
    if (!this.ctx || !this.noiseBuf) return;
    if (this.voices >= this.maxVoices && !o.critical) return;
    const out = this.route(o.bus ?? 'sfx', o.pos, o.critical);
    if (!out) return;
    const c = this.ctx, t0 = c.currentTime;
    const src = c.createBufferSource(); src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = o.type ?? 'bandpass'; f.frequency.setValueAtTime(o.freq, t0); f.Q.value = o.q ?? 1;
    if (o.sweep) f.frequency.exponentialRampToValueAtTime(o.sweep, t0 + o.dur);
    const g = c.createGain();
    g.gain.setValueAtTime(o.vol ?? 0.3, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    src.connect(f); f.connect(g); g.connect(out);
    src.start(t0); src.stop(t0 + o.dur + 0.05);
    this.voices++;
    src.onended = () => { this.voices--; };
  }

  // ---------------------------------------------------------------- cue library
  play(cue: string, pos?: { x: number; y: number }, opt: { mine?: boolean; enemy?: boolean } = {}) {
    if (!this.ctx) return;
    const P = pos;
    switch (cue) {
      case 'melee': if (this.canPlay('melee', 0.05)) this.noise({ dur: 0.09, freq: 1800, q: 0.8, vol: opt.mine ? 0.25 : 0.12, pos: P, sweep: 600 }); break;
      case 'ranged': if (this.canPlay('ranged', 0.05)) this.tone({ f: 900, f2: 500, dur: 0.08, type: 'triangle', vol: opt.mine ? 0.12 : 0.05, pos: P }); break;
      case 'tower': this.tone({ f: 220, f2: 90, dur: 0.35, type: 'sawtooth', vol: 0.16, pos: P }); this.noise({ dur: 0.25, freq: 600, vol: 0.12, pos: P }); break;
      case 'minionDie': if (this.canPlay('mdie', 0.06)) this.tone({ f: 520, f2: 260, dur: 0.12, type: 'square', vol: 0.04, pos: P }); break;
      case 'gold': this.tone({ f: 1318, dur: 0.08, type: 'triangle', vol: 0.12, bus: 'ui' }); this.tone({ f: 1760, dur: 0.12, type: 'triangle', vol: 0.1, bus: 'ui', delay: 0.06 }); break;
      case 'level': [523, 659, 784, 1046].forEach((f, i) => this.tone({ f, dur: 0.25, type: 'triangle', vol: 0.14, bus: 'ui', delay: i * 0.07 })); break;
      case 'cast': this.tone({ f: 440, f2: 880, dur: 0.18, type: 'triangle', vol: 0.12, pos: P }); break;
      case 'ult': this.tone({ f: 110, f2: 330, dur: 0.7, type: 'sawtooth', vol: 0.22, pos: P, critical: true, attack: 0.05 }); this.noise({ dur: 0.6, freq: 300, sweep: 2400, vol: 0.12, pos: P, critical: true }); break;
      case 'ultWarn': this.tone({ f: 740, dur: 0.15, type: 'square', vol: 0.14, critical: true, bus: 'ui' }); this.tone({ f: 740, dur: 0.15, type: 'square', vol: 0.14, critical: true, bus: 'ui', delay: 0.2 }); break;
      case 'slam': this.tone({ f: 80, f2: 40, dur: 0.5, type: 'sine', vol: 0.4, pos: P }); this.noise({ dur: 0.4, freq: 400, vol: 0.25, pos: P, type: 'lowpass' }); break;
      case 'shield': this.tone({ f: 660, f2: 990, dur: 0.3, type: 'sine', vol: 0.1, pos: P }); break;
      case 'heal': this.tone({ f: 784, f2: 1046, dur: 0.35, type: 'sine', vol: 0.08, pos: P }); break;
      case 'kill': [392, 523, 659].forEach((f, i) => this.tone({ f, dur: 0.3, type: 'sawtooth', vol: 0.1, bus: 'ui', delay: i * 0.08 })); break;
      case 'death': [330, 247, 196].forEach((f, i) => this.tone({ f, dur: 0.4, type: 'triangle', vol: 0.14, bus: 'ui', delay: i * 0.12 })); break;
      case 'structure': this.tone({ f: 60, f2: 30, dur: 1.2, type: 'sawtooth', vol: 0.3, critical: true }); this.noise({ dur: 1.2, freq: 200, vol: 0.3, critical: true, type: 'lowpass' }); break;
      case 'objective': [220, 330, 440].forEach((f, i) => this.tone({ f, dur: 0.9, type: 'sawtooth', vol: 0.08, bus: 'ui', delay: i * 0.15, attack: 0.1 })); break;
      case 'ping': this.tone({ f: opt.enemy ? 440 : 880, dur: 0.12, type: 'sine', vol: 0.14, bus: 'ui' }); this.tone({ f: opt.enemy ? 330 : 1175, dur: 0.15, type: 'sine', vol: 0.12, bus: 'ui', delay: 0.1 }); break;
      case 'recall': this.tone({ f: 330, f2: 660, dur: 1.2, type: 'sine', vol: 0.07, pos: P, attack: 0.3 }); break;
      case 'shop': this.tone({ f: 988, dur: 0.07, type: 'square', vol: 0.06, bus: 'ui' }); this.tone({ f: 1318, dur: 0.1, type: 'square', vol: 0.05, bus: 'ui', delay: 0.05 }); break;
      case 'error': if (this.canPlay('err', 0.4)) this.tone({ f: 180, dur: 0.12, type: 'square', vol: 0.06, bus: 'ui' }); break;
      case 'ward': this.tone({ f: 1046, f2: 1568, dur: 0.25, type: 'sine', vol: 0.08, pos: P }); break;
      case 'spawn': this.tone({ f: 196, dur: 1.4, type: 'triangle', vol: 0.1, bus: 'ui', attack: 0.3 }); break;
      case 'victory': [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone({ f, dur: 0.8, type: 'triangle', vol: 0.16, bus: 'ui', delay: i * 0.16, critical: true })); break;
      case 'defeat': [392, 330, 262, 196].forEach((f, i) => this.tone({ f, dur: 0.9, type: 'sine', vol: 0.16, bus: 'ui', delay: i * 0.22, critical: true })); break;
      case 'click': this.tone({ f: 1400, dur: 0.04, type: 'square', vol: 0.04, bus: 'ui' }); break;
    }
  }

  // ---------------------------------------------------------------- adaptive music
  startMusic() {
    if (!this.ctx || this.musicTimer) return;
    const c = this.ctx;
    this.layers = [0, 1, 2, 3].map(() => { const g = c.createGain(); g.gain.value = 0; g.connect(this.music); return { gain: g, target: 0 }; });
    const chords = [[220, 277, 330], [196, 247, 294], [175, 220, 262], [196, 247, 330]];
    const beat = 0.42;
    this.musicTimer = setInterval(() => {
      if (!this.ctx) return;
      const now = c.currentTime;
      const tgt = [0.55, this.intensity >= 1 ? 0.5 : 0, this.intensity >= 2 ? 0.55 : 0, this.intensity >= 3 ? 0.5 : 0];
      this.layers.forEach((l, i) => { l.gain.gain.setTargetAtTime(tgt[i], now, 1.2); });
      const chord = chords[Math.floor(this.step / 8) % chords.length];
      // layer 0: pad (calm lane)
      if (this.step % 8 === 0) for (const f of chord) this.layerTone(0, f / 2, beat * 8, 'sine', 0.06, 0.8);
      // layer 1: plucked arpeggio (contest)
      this.layerTone(1, chord[this.step % 3] * 2, beat * 0.9, 'triangle', 0.05, 0.01);
      // layer 2: pulse bass + percussion (team fight)
      if (this.step % 2 === 0) this.layerTone(2, chord[0] / 2, beat * 0.8, 'sawtooth', 0.05, 0.01);
      if (this.step % 4 === 2) this.layerNoise(2, 0.12, 2400, 0.08);
      // layer 3: siege drums
      if (this.step % 4 === 0) this.layerTone(3, 60, 0.35, 'sine', 0.2, 0.005, 40);
      this.step++;
    }, beat * 1000);
  }
  private layerTone(layer: number, f: number, dur: number, type: OscillatorType, vol: number, attack: number, f2?: number) {
    const c = this.ctx!, t0 = c.currentTime;
    const o = c.createOscillator(); o.type = type; o.frequency.value = f;
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(this.layers[layer].gain); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  private layerNoise(layer: number, dur: number, freq: number, vol: number) {
    if (!this.noiseBuf) return;
    const c = this.ctx!, t0 = c.currentTime;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = freq;
    const g = c.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(this.layers[layer].gain); s.start(t0); s.stop(t0 + dur + 0.05);
  }
  stopMusic() {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
    for (const l of this.layers) l.gain.disconnect();
    this.layers = [];
  }
}

export const audio = new AudioEngine();
