// audio: fully synthesised Web Audio mixer — no sample files. World sounds are attenuated and
// panned relative to the camera, voices are capped and prioritised, and an adaptive generative
// score shifts between calm lane / contest / fight / victory / defeat layers.

type Wave = OscillatorType;

interface ToneOpts {
  f: number;
  f2?: number;
  dur: number;
  type?: Wave;
  gain?: number;
  attack?: number;
  delay?: number;
}

const SCALE = [0, 2, 3, 5, 7, 8, 10]; // natural minor
const CHORDS = [
  [0, 3, 7],
  [-4, 0, 3],
  [-2, 2, 5],
  [-5, -2, 2],
];
const midi = (n: number): number => 440 * Math.pow(2, (n - 69) / 12);

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxBus!: GainNode;
  private musicBus!: GainNode;
  private muffle!: BiquadFilterNode;
  private noiseBuf!: AudioBuffer;
  private voices = 0;
  private lastPlayed = new Map<string, number>();
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private nextNote = 0;
  intensity = 0; // 0 calm, 1 contest, 2 fight
  private vol = { master: 0.7, music: 0.45, sfx: 0.8 };
  listener = { x: 0, y: 0 };

  /** Must be called from a user gesture (browsers block audio before one). */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctor();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.sfxBus = ctx.createGain();
      this.musicBus = ctx.createGain();
      this.muffle = ctx.createBiquadFilter();
      this.muffle.type = 'lowpass';
      this.muffle.frequency.value = 18000;
      const comp = ctx.createDynamicsCompressor();
      this.sfxBus.connect(this.muffle).connect(this.master);
      this.musicBus.connect(this.master);
      this.master.connect(comp).connect(ctx.destination);
      const len = ctx.sampleRate;
      this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.applyVolumes();
    } catch {
      this.ctx = null;
    }
  }

  setVolumes(master: number, music: number, sfx: number): void {
    this.vol = { master, music, sfx };
    this.applyVolumes();
  }
  private applyVolumes(): void {
    if (!this.ctx) return;
    this.master.gain.value = this.vol.master;
    this.musicBus.gain.value = this.vol.music * 0.5;
    this.sfxBus.gain.value = this.vol.sfx;
  }
  /** Hush Field: non-critical audio is muffled while the listener is inside. */
  setMuffled(on: boolean): void {
    if (!this.ctx) return;
    this.muffle.frequency.setTargetAtTime(on ? 520 : 18000, this.ctx.currentTime, 0.12);
  }

  private spatial(x?: number, y?: number): { gain: number; pan: number } | null {
    if (x === undefined || y === undefined) return { gain: 1, pan: 0 };
    const dx = x - this.listener.x;
    const dy = y - this.listener.y;
    const d = Math.hypot(dx, dy);
    if (d > 34) return null; // virtualised: distant combat is not voiced
    const screenRight = (dx - dy) * Math.SQRT1_2;
    return { gain: 1 / (1 + (d / 11) * (d / 11)), pan: Math.max(-0.8, Math.min(0.8, screenRight / 20)) };
  }

  private out(sp: { gain: number; pan: number }, bus: GainNode): AudioNode {
    const ctx = this.ctx as AudioContext;
    if (Math.abs(sp.pan) < 0.02 || !ctx.createStereoPanner) return bus;
    const p = ctx.createStereoPanner();
    p.pan.value = sp.pan;
    p.connect(bus);
    return p;
  }

  private tone(o: ToneOpts, sp: { gain: number; pan: number }, bus = this.sfxBus): void {
    const ctx = this.ctx as AudioContext;
    const t0 = ctx.currentTime + (o.delay ?? 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(o.f, t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t0 + o.dur);
    const peak = (o.gain ?? 0.2) * sp.gain;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + (o.attack ?? 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    osc.connect(g).connect(this.out(sp, bus));
    osc.start(t0);
    osc.stop(t0 + o.dur + 0.02);
    this.voices++;
    osc.onended = (): void => {
      this.voices--;
    };
  }

  private noise(dur: number, freq: number, q: number, gain: number, sp: { gain: number; pan: number }, type: BiquadFilterType = 'bandpass', delay = 0, f2?: number): void {
    const ctx = this.ctx as AudioContext;
    const t0 = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.playbackRate.value = 0.6 + Math.random() * 0.8;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t0);
    if (f2) f.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain * sp.gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(this.out(sp, this.sfxBus));
    src.start(t0, Math.random() * 0.5, dur + 0.05);
    this.voices++;
    src.onended = (): void => {
      this.voices--;
    };
  }

  /** Play a named cue. Priority cues (announcer, ultimates, UI) bypass the voice cap. */
  play(name: string, x?: number, y?: number, variant = 0): void {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const priority = name === 'announce' || name === 'ult' || name === 'victory' || name === 'defeat' || name === 'error' || name === 'towerLock' || name === 'level';
    if (!priority && this.voices > 40) return;
    const now = this.ctx.currentTime;
    const key = name + (x === undefined ? '' : Math.round(x / 6) + ':' + Math.round((y ?? 0) / 6));
    const minGap = name === 'hit' || name === 'shoot' || name === 'minionDie' ? 0.06 : 0.03;
    if (now - (this.lastPlayed.get(key) ?? -1) < minGap) return;
    this.lastPlayed.set(key, now);
    const sp = this.spatial(x, y);
    if (!sp) return;
    const v = 1 + variant * 0.12;
    switch (name) {
      case 'hit':
        this.noise(0.09, 900 * v, 1.2, 0.3, sp);
        this.tone({ f: 170 * v, f2: 90, dur: 0.08, type: 'triangle', gain: 0.16 }, sp);
        break;
      case 'shoot':
        this.tone({ f: 820 * v, f2: 300, dur: 0.1, type: 'square', gain: 0.05 }, sp);
        this.noise(0.06, 2400, 2, 0.1, sp);
        break;
      case 'tower':
        this.tone({ f: 300, f2: 1100, dur: 0.16, type: 'sawtooth', gain: 0.11 }, sp);
        this.tone({ f: 90, f2: 50, dur: 0.22, type: 'sine', gain: 0.22 }, sp);
        break;
      case 'towerLock':
        this.tone({ f: 980, dur: 0.09, type: 'square', gain: 0.1 }, sp);
        this.tone({ f: 980, dur: 0.09, type: 'square', gain: 0.1, delay: 0.14 }, sp);
        break;
      case 'cast':
        this.tone({ f: 420 * v, f2: 760 * v, dur: 0.18, type: 'triangle', gain: 0.14 }, sp);
        this.noise(0.2, 3200, 1, 0.07, sp, 'highpass');
        break;
      case 'ult':
        this.tone({ f: 110 * v, f2: 55, dur: 0.7, type: 'sawtooth', gain: 0.2 }, sp);
        this.tone({ f: 440 * v, f2: 1320 * v, dur: 0.5, type: 'triangle', gain: 0.16 }, sp);
        this.noise(0.6, 500, 0.7, 0.2, sp, 'lowpass', 0, 2600);
        break;
      case 'slam':
        this.tone({ f: 120, f2: 38, dur: 0.4, type: 'sine', gain: 0.4 }, sp);
        this.noise(0.3, 260, 0.8, 0.4, sp, 'lowpass');
        break;
      case 'dash':
        this.noise(0.2, 900, 0.9, 0.16, sp, 'bandpass', 0, 3600);
        break;
      case 'shield':
        this.tone({ f: 660, f2: 990, dur: 0.22, type: 'sine', gain: 0.12 }, sp);
        this.tone({ f: 1320, dur: 0.3, type: 'sine', gain: 0.05, delay: 0.04 }, sp);
        break;
      case 'heal':
        this.tone({ f: 523, dur: 0.16, type: 'sine', gain: 0.1 }, sp);
        this.tone({ f: 784, dur: 0.24, type: 'sine', gain: 0.1, delay: 0.09 }, sp);
        break;
      case 'minionDie':
        this.noise(0.12, 500, 1.5, 0.14, sp, 'bandpass', 0, 160);
        break;
      case 'heroDie':
        this.tone({ f: 392, f2: 98, dur: 0.8, type: 'sawtooth', gain: 0.18 }, sp);
        this.noise(0.5, 700, 0.6, 0.22, sp, 'lowpass', 0, 120);
        break;
      case 'structure':
        this.tone({ f: 90, f2: 30, dur: 1.2, type: 'sine', gain: 0.5 }, sp);
        this.noise(1.1, 400, 0.5, 0.5, sp, 'lowpass', 0, 80);
        this.noise(0.5, 2500, 0.8, 0.18, sp, 'bandpass', 0.1);
        break;
      case 'gold':
        this.tone({ f: 1568, dur: 0.07, type: 'square', gain: 0.045 }, sp);
        this.tone({ f: 2093, dur: 0.13, type: 'square', gain: 0.045, delay: 0.06 }, sp);
        break;
      case 'buy':
        this.tone({ f: 880, dur: 0.07, type: 'triangle', gain: 0.12 }, sp);
        this.tone({ f: 1175, dur: 0.07, type: 'triangle', gain: 0.12, delay: 0.07 }, sp);
        this.tone({ f: 1760, dur: 0.2, type: 'triangle', gain: 0.1, delay: 0.14 }, sp);
        break;
      case 'level':
        [0, 4, 7, 12].forEach((n, i) => this.tone({ f: midi(72 + n), dur: 0.28, type: 'triangle', gain: 0.12, delay: i * 0.07 }, sp));
        break;
      case 'ping':
        this.tone({ f: 1320, dur: 0.12, type: 'sine', gain: 0.14 }, sp);
        this.tone({ f: 1760, dur: 0.2, type: 'sine', gain: 0.12, delay: 0.1 }, sp);
        break;
      case 'ward':
        this.tone({ f: 600, f2: 900, dur: 0.2, type: 'sine', gain: 0.12 }, sp);
        break;
      case 'recall':
        this.tone({ f: 220, f2: 880, dur: 0.9, type: 'sine', gain: 0.08 }, sp);
        break;
      case 'ui':
        this.tone({ f: 660, dur: 0.05, type: 'triangle', gain: 0.07 }, sp);
        break;
      case 'error':
        this.tone({ f: 160, dur: 0.12, type: 'square', gain: 0.07 }, sp);
        break;
      case 'announce':
        [0, 7, 12].forEach((n, i) => this.tone({ f: midi(57 + n), dur: 0.6, type: 'sawtooth', gain: 0.07, delay: i * 0.1, attack: 0.03 }, sp));
        break;
      case 'kill':
        this.tone({ f: 330, dur: 0.14, type: 'square', gain: 0.08 }, sp);
        this.tone({ f: 494, dur: 0.3, type: 'square', gain: 0.08, delay: 0.12 }, sp);
        break;
      case 'victory':
        [0, 4, 7, 12, 16].forEach((n, i) => this.tone({ f: midi(60 + n), dur: 0.9, type: 'triangle', gain: 0.14, delay: i * 0.14, attack: 0.02 }, sp));
        break;
      case 'defeat':
        [12, 8, 3, 0].forEach((n, i) => this.tone({ f: midi(48 + n), dur: 1.0, type: 'sawtooth', gain: 0.09, delay: i * 0.22, attack: 0.03 }, sp));
        break;
    }
  }

  // ---- adaptive music ----------------------------------------------------------------------

  startMusic(): void {
    if (!this.ctx || this.musicTimer) return;
    this.nextNote = this.ctx.currentTime + 0.1;
    this.step = 0;
    this.musicTimer = setInterval(() => this.schedule(), 60);
  }
  stopMusic(): void {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  private mTone(f: number, t: number, dur: number, type: Wave, gain: number, attack = 0.02): void {
    const ctx = this.ctx as AudioContext;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = type === 'sawtooth' ? 900 + this.intensity * 500 : 2400;
    osc.type = type;
    osc.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(lp).connect(g).connect(this.musicBus);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  private schedule(): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const stepDur = this.intensity >= 2 ? 0.2 : 0.26;
    while (this.nextNote < ctx.currentTime + 0.25) {
      const t = this.nextNote;
      const s = this.step;
      const bar = Math.floor(s / 16) % CHORDS.length;
      const chord = CHORDS[bar];
      const root = 50; // D
      if (s % 16 === 0) {
        // pad: always present, the calm lane bed
        for (const n of chord) {
          this.mTone(midi(root + n), t, stepDur * 16.5, 'sawtooth', 0.045, 0.6);
          this.mTone(midi(root + n) * 1.005, t, stepDur * 16.5, 'sawtooth', 0.03, 0.8);
        }
      }
      // sparse plucked arpeggio (denser as intensity rises)
      const every = this.intensity >= 2 ? 1 : this.intensity >= 1 ? 2 : 4;
      if (s % every === 0 && (this.intensity > 0 || (s * 7) % 5 !== 0)) {
        const deg = SCALE[(s * 3 + bar * 2) % SCALE.length];
        const oct = (s >> 2) % 2 ? 12 : 0;
        this.mTone(midi(root + 12 + chord[0] + deg + oct), t, 0.5, 'triangle', 0.06 + this.intensity * 0.012, 0.005);
      }
      if (this.intensity >= 1 && s % 4 === 0) this.mTone(midi(root - 12 + chord[0]), t, 0.34, 'triangle', 0.1, 0.01);
      if (this.intensity >= 2) {
        // fight layer: pulse + hat
        if (s % 2 === 0) this.mTone(midi(root - 12 + chord[0]), t, 0.12, 'square', 0.035, 0.004);
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuf;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 6500;
        const g = ctx.createGain();
        g.gain.setValueAtTime(s % 4 === 2 ? 0.05 : 0.02, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
        src.connect(hp).connect(g).connect(this.musicBus);
        src.start(t, Math.random() * 0.5, 0.08);
      }
      this.nextNote += stepDur;
      this.step++;
    }
  }
}

export const audio = new AudioEngine();
