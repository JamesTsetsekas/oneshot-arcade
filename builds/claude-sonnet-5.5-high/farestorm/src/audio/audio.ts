/**
 * Procedural Web Audio: layered engine (RPM/load), tyre squeal, wind, collisions, UI/score cues and an
 * original adaptive loop (surf shaker + breakbeat + brass stabs + synth bass). Nothing is sampled or licensed.
 */
import type { GameEvent, Sim } from '../sim/sim';

const NOTE = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

export class AudioEngine {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicBus!: GainNode;
  private sfxBus!: GainNode;
  private engBus!: GainNode;
  private noiseBuf!: AudioBuffer;
  // engine
  private osc1!: OscillatorNode;
  private osc2!: OscillatorNode;
  private engFilter!: BiquadFilterNode;
  private engGain!: GainNode;
  private whine!: OscillatorNode;
  private whineGain!: GainNode;
  private squeal!: AudioBufferSourceNode;
  private squealGain!: GainNode;
  private squealFilter!: BiquadFilterNode;
  private wind!: AudioBufferSourceNode;
  private windGain!: GainNode;
  private surf!: AudioBufferSourceNode;
  private surfGain!: GainNode;
  vols = { master: 0.8, music: 0.55, sfx: 0.9 };
  private musicMode: 'off' | 'menu' | 'game' = 'off';
  private nextBeat = 0;
  private step16 = 0;
  private timer: number | null = null;
  intensity = 0;
  private duck = 1;
  private lastClock = 99;
  private rpmSmooth = 900;

  /** must be called from a user gesture */
  start(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    this.ctx = ctx;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    this.master = ctx.createGain();
    this.master.connect(comp).connect(ctx.destination);
    this.musicBus = ctx.createGain(); this.musicBus.connect(this.master);
    this.sfxBus = ctx.createGain(); this.sfxBus.connect(this.master);
    this.engBus = ctx.createGain(); this.engBus.connect(this.master);
    this.applyVolumes();
    // shared noise
    const len = ctx.sampleRate * 2;
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.buildEngine();
    this.timer = window.setInterval(() => this.schedule(), 30);
  }

  setVolumes(m: number, mu: number, s: number): void {
    this.vols = { master: m, music: mu, sfx: s };
    this.applyVolumes();
  }
  private applyVolumes(): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.vols.master, t, 0.05);
    this.musicBus.gain.setTargetAtTime(this.vols.music * 0.5 * this.duck, t, 0.05);
    this.sfxBus.gain.setTargetAtTime(this.vols.sfx, t, 0.05);
    this.engBus.gain.setTargetAtTime(this.vols.sfx * 0.6, t, 0.05);
  }

  private noise(loop = true): AudioBufferSourceNode {
    const s = this.ctx!.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = loop;
    return s;
  }

  private buildEngine(): void {
    const ctx = this.ctx!;
    this.osc1 = ctx.createOscillator(); this.osc1.type = 'sawtooth';
    this.osc2 = ctx.createOscillator(); this.osc2.type = 'square';
    this.engFilter = ctx.createBiquadFilter(); this.engFilter.type = 'lowpass'; this.engFilter.Q.value = 2;
    this.engGain = ctx.createGain(); this.engGain.gain.value = 0;
    const g2 = ctx.createGain(); g2.gain.value = 0.45;
    this.osc1.connect(this.engFilter); this.osc2.connect(g2).connect(this.engFilter);
    this.engFilter.connect(this.engGain).connect(this.engBus);
    this.osc1.start(); this.osc2.start();
    this.whine = ctx.createOscillator(); this.whine.type = 'triangle';
    this.whineGain = ctx.createGain(); this.whineGain.gain.value = 0;
    this.whine.connect(this.whineGain).connect(this.engBus); this.whine.start();
    this.squeal = this.noise(); this.squealFilter = ctx.createBiquadFilter(); this.squealFilter.type = 'bandpass'; this.squealFilter.frequency.value = 1900; this.squealFilter.Q.value = 5;
    this.squealGain = ctx.createGain(); this.squealGain.gain.value = 0;
    this.squeal.connect(this.squealFilter).connect(this.squealGain).connect(this.engBus); this.squeal.start();
    this.wind = this.noise(); const wf = ctx.createBiquadFilter(); wf.type = 'lowpass'; wf.frequency.value = 900;
    this.windGain = ctx.createGain(); this.windGain.gain.value = 0;
    this.wind.connect(wf).connect(this.windGain).connect(this.engBus); this.wind.start();
    // surf ambience
    this.surf = this.noise(); const sf = ctx.createBiquadFilter(); sf.type = 'lowpass'; sf.frequency.value = 600;
    this.surfGain = ctx.createGain(); this.surfGain.gain.value = 0;
    this.surf.connect(sf).connect(this.surfGain).connect(this.sfxBus); this.surf.start();
  }

  /** per-frame engine/ambience update */
  update(sim: Sim | null, dt: number, inGame: boolean): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    this.duck += (1 - this.duck) * Math.min(1, dt * 2.5);
    this.musicBus.gain.setTargetAtTime(this.vols.music * 0.5 * this.duck, t, 0.08);
    if (!sim || !inGame) {
      this.engGain.gain.setTargetAtTime(0, t, 0.1);
      this.whineGain.gain.setTargetAtTime(0, t, 0.1);
      this.squealGain.gain.setTargetAtTime(0, t, 0.05);
      this.windGain.gain.setTargetAtTime(0, t, 0.1);
      this.surfGain.gain.setTargetAtTime(0.05, t, 0.3);
      return;
    }
    const v = sim.vehicle;
    const kmh = v.speed * 3.6;
    const gear = Math.min(5, Math.floor(kmh / 34));
    const span = 34;
    const target = kmh < 3 ? 900 + (sim.phase === 'running' ? 0 : 0) : 1300 + ((kmh - gear * span) / span) * 5200;
    const throttleLoad = sim.phase === 'running' ? (v.fwd < 0 ? 0.5 : 1) : 0;
    this.rpmSmooth += (target - this.rpmSmooth) * Math.min(1, dt * 9);
    const f = this.rpmSmooth / 60;
    const base = sim.spec.id === 'gull' ? 1.15 : sim.spec.id === 'tempest' ? 0.82 : 1;
    this.osc1.frequency.setTargetAtTime(f * base, t, 0.03);
    this.osc2.frequency.setTargetAtTime(f * base * 0.5, t, 0.03);
    this.engFilter.frequency.setTargetAtTime(500 + this.rpmSmooth * 0.55, t, 0.05);
    this.engGain.gain.setTargetAtTime(0.1 + 0.13 * Math.min(1, kmh / 40) * throttleLoad + (v.boosting ? 0.06 : 0), t, 0.05);
    this.whine.frequency.setTargetAtTime(600 + kmh * 14, t, 0.05);
    this.whineGain.gain.setTargetAtTime(v.boosting ? 0.07 : Math.min(0.025, kmh * 0.00018), t, 0.05);
    const slip = !v.airborne && v.speed > 7 ? Math.min(1, Math.max(0, (Math.abs(v.slip) - 0.14) * 3.2)) : 0;
    this.squealGain.gain.setTargetAtTime(slip * 0.16, t, 0.04);
    this.squealFilter.frequency.setTargetAtTime(1500 + slip * 900 + (v.surface === 'sand' ? -600 : 0), t, 0.05);
    this.windGain.gain.setTargetAtTime(Math.min(0.2, (kmh / 170) * (kmh / 170) * 0.28), t, 0.1);
    // ambience: surf near the sea / beach
    const w = sim.world;
    const sea = Math.max(0, 1 - Math.min(Math.abs(v.x - 940) / 260, Math.abs(v.z - 662) / 260));
    this.surfGain.gain.setTargetAtTime(0.03 + sea * 0.22, t, 0.4);
    this.intensity = Math.min(1, 0.25 + sim.score.tier * 0.22 + (sim.clock < 12 && sim.mode !== 'trial' ? 0.3 : 0));
    void w;
  }

  // ------------------------------------------------------------------ one-shots
  private tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.2, when = 0, bus: GainNode | null = null, slideTo?: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const t0 = ctx.currentTime + when;
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(bus ?? this.sfxBus);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }
  private burst(dur: number, freq: number, q: number, vol: number, type: BiquadFilterType = 'bandpass', slideTo?: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const s = this.noise(false);
    const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q;
    const g = ctx.createGain();
    const t0 = ctx.currentTime;
    f.frequency.setValueAtTime(freq, t0);
    if (slideTo) f.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f).connect(g).connect(this.sfxBus);
    s.start(t0, Math.random());
    s.stop(t0 + dur + 0.05);
  }

  private duckMusic(amount = 0.45): void {
    this.duck = Math.min(this.duck, amount);
  }

  onEvent(e: GameEvent): void {
    if (!this.ctx) return;
    switch (e.type) {
      case 'countdown': this.tone(520, 0.18, 'square', 0.14); break;
      case 'go': this.tone(780, 0.35, 'square', 0.18); this.tone(1170, 0.4, 'triangle', 0.14, 0.02); break;
      case 'style': {
        const up = Math.min(5, Math.round(Math.log2(Math.max(1, e.mult)) * 2));
        this.tone(NOTE(76 + up * 2), 0.14, 'triangle', 0.16);
        this.tone(NOTE(83 + up * 2), 0.18, 'sine', 0.1, 0.05);
        if (e.category === 'nearMiss' || e.category === 'needle') this.burst(0.22, 1800, 1, 0.07, 'bandpass', 500);
        break;
      }
      case 'bank': this.tone(NOTE(84), 0.12, 'sine', 0.12); this.tone(NOTE(91), 0.2, 'sine', 0.12, 0.08); break;
      case 'chainLoss': this.tone(220, 0.3, 'sawtooth', 0.12, 0, null, 90); break;
      case 'boarded': [72, 76, 79, 84].forEach((n, i) => this.tone(NOTE(n), 0.18, 'triangle', 0.15, i * 0.06)); break;
      case 'delivered': {
        const g = e.breakdown.grade;
        const notes = g === 'blazing' ? [72, 76, 79, 84, 88, 91] : g === 'fast' ? [72, 76, 79, 84] : g === 'close' ? [72, 76, 79] : [72, 70];
        notes.forEach((n, i) => { this.tone(NOTE(n), 0.22, 'square', 0.1, i * 0.07); this.tone(NOTE(n + 12), 0.26, 'sine', 0.1, i * 0.07); });
        this.burst(0.5, 3000, 0.7, 0.05, 'highpass');
        break;
      }
      case 'fareFailed': this.tone(300, 0.5, 'sawtooth', 0.14, 0, null, 110); break;
      case 'collision': {
        const k = Math.min(1, e.impact / 20);
        this.burst(0.18 + k * 0.25, 900, 0.8, 0.12 + k * 0.28, 'lowpass', 120);
        this.tone(95, 0.22, 'sine', 0.2 + k * 0.25, 0, null, 38);
        if (e.impact > 6) this.duckMusic(0.5);
        break;
      }
      case 'boost': if (e.on) { this.burst(0.7, 400, 1.4, 0.16, 'bandpass', 3800); this.tone(220, 0.5, 'sawtooth', 0.08, 0, null, 880); } break;
      case 'tailwindReady': this.tone(NOTE(86), 0.2, 'sine', 0.14); this.tone(NOTE(93), 0.3, 'sine', 0.1, 0.1); break;
      case 'token': this.tone(NOTE(e.kind === 'spark' ? 91 : 86), 0.14, 'triangle', 0.16); this.tone(NOTE(98), 0.2, 'sine', 0.1, 0.07); break;
      case 'shortcut': [76, 81, 85, 88].forEach((n, i) => this.tone(NOTE(n), 0.12, 'square', 0.09, i * 0.05)); break;
      case 'timeAdd': this.tone(NOTE(79), 0.1, 'triangle', 0.12); this.tone(NOTE(86), 0.16, 'triangle', 0.12, 0.08); break;
      case 'clockTick': this.tone(e.n <= 3 ? 880 : 660, 0.08, 'square', e.n <= 3 ? 0.14 : 0.08); break;
      case 'honk': this.tone(330, 0.28, 'square', 0.1); this.tone(415, 0.28, 'square', 0.08); break;
      case 'respawn': this.burst(0.5, 3000, 1, 0.1, 'highpass'); this.tone(500, 0.3, 'sine', 0.12, 0, null, 150); break;
      case 'ended': this.tone(NOTE(60), 0.6, 'sawtooth', 0.1); this.tone(NOTE(64), 0.6, 'sawtooth', 0.08, 0.05); this.tone(NOTE(67), 0.7, 'sawtooth', 0.08, 0.1); this.duckMusic(0.4); break;
      case 'bark': {
        // short "voice" blips tuned per speaker
        const base = 260 + (e.who.length % 7) * 36;
        const n = Math.min(6, 2 + Math.floor(e.text.length / 8));
        for (let i = 0; i < n; i++) this.tone(base * (1 + ((i * 5) % 4) * 0.12), 0.07, 'triangle', 0.07, i * 0.07);
        this.duckMusic(0.7);
        break;
      }
      case 'vehicle': {
        const ev = e.ev;
        if (ev.type === 'surge') { this.burst(0.35, 500, 1.2, 0.14, 'bandpass', 2500); }
        if (ev.type === 'snapDrift') { this.burst(0.3, 2200, 3, 0.12, 'bandpass', 1200); }
        if (ev.type === 'gripTurn') { this.tone(NOTE(79), 0.1, 'square', 0.1); this.tone(NOTE(84), 0.12, 'square', 0.1, 0.06); }
        if (ev.type === 'landing') { this.tone(80, 0.2, 'sine', 0.2, 0, null, 45); this.burst(0.2, 700, 0.8, 0.12, 'lowpass', 150); }
        if (ev.type === 'takeoff') this.burst(0.3, 600, 1, 0.08, 'bandpass', 2400);
        break;
      }
      default: break;
    }
  }

  uiClick(): void {
    this.tone(660, 0.06, 'triangle', 0.12);
    this.tone(990, 0.07, 'triangle', 0.08, 0.04);
  }
  uiBack(): void {
    this.tone(440, 0.08, 'triangle', 0.1);
  }
  rankSting(rank: string): void {
    const base = rank === 'S' ? 72 : rank === 'A' ? 69 : rank === 'B' ? 67 : 64;
    [0, 4, 7, 12, rank === 'S' ? 16 : 12].forEach((o, i) => this.tone(NOTE(base + o), 0.4, 'square', 0.09, i * 0.1));
  }

  // ------------------------------------------------------------------ music
  setMusic(mode: 'off' | 'menu' | 'game'): void {
    if (mode === this.musicMode) return;
    this.musicMode = mode;
    if (this.ctx) { this.nextBeat = this.ctx.currentTime + 0.1; this.step16 = 0; }
  }

  private schedule(): void {
    const ctx = this.ctx;
    if (!ctx || this.musicMode === 'off') return;
    const bpm = this.musicMode === 'menu' ? 104 : 128 + this.intensity * 8;
    const stepDur = 60 / bpm / 4;
    while (this.nextBeat < ctx.currentTime + 0.14) {
      this.playStep(this.step16, this.nextBeat);
      this.nextBeat += stepDur;
      this.step16 = (this.step16 + 1) % 64;
    }
  }

  private mtone(freq: number, t0: number, dur: number, type: OscillatorType, vol: number, cutoff = 6000): void {
    const ctx = this.ctx!;
    const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = type; o.frequency.value = freq;
    f.type = 'lowpass'; f.frequency.value = cutoff;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(f).connect(g).connect(this.musicBus);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  private mnoise(t0: number, dur: number, freq: number, type: BiquadFilterType, vol: number, q = 1): void {
    const ctx = this.ctx!;
    const s = this.noise(false);
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f).connect(g).connect(this.musicBus);
    s.start(t0, Math.random()); s.stop(t0 + dur + 0.05);
  }

  private playStep(step: number, t0: number): void {
    const ctx = this.ctx!;
    const bar = Math.floor(step / 16) % 4;
    const s = step % 16;
    const menu = this.musicMode === 'menu';
    // chord progression (original): Dm - Bb - F - C   (roots in MIDI)
    const roots = [50, 46, 53, 48];
    const chords = [[0, 3, 7], [0, 4, 7], [0, 4, 7], [0, 4, 7]];
    const root = roots[bar];
    const k = this.intensity;
    // drums
    if (!menu) {
      if (s % 4 === 0) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.setValueAtTime(150, t0); o.frequency.exponentialRampToValueAtTime(45, t0 + 0.14);
        g.gain.setValueAtTime(0.55, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
        o.connect(g).connect(this.musicBus); o.start(t0); o.stop(t0 + 0.25);
      }
      if (s === 4 || s === 12) this.mnoise(t0, 0.13, 1800, 'bandpass', 0.35, 0.8);
      if (s % 2 === 0) this.mnoise(t0, 0.04, 8000, 'highpass', 0.12 + (s % 4 === 2 ? 0.05 : 0));
      if (s === 7 || s === 10 || (k > 0.6 && s === 15)) this.mnoise(t0, 0.06, 6000, 'highpass', 0.09);
      // surf shaker swell on each bar
      if (s === 0) this.mnoise(t0, 0.9, 1400, 'bandpass', 0.07, 0.4);
    } else if (s % 8 === 0) this.mnoise(t0, 1.4, 900, 'lowpass', 0.07);
    // bass
    const bassPat = [0, -1, -1, 0, -1, 7, -1, -1, 0, -1, 12, -1, 5, -1, 7, -1];
    const bn = bassPat[s];
    if (bn >= 0 && !menu) this.mtone(NOTE(root - 12 + bn), t0, 0.2, 'sawtooth', 0.22, 520 + k * 600);
    // arp (pluck) — always, quieter in menu
    const arpIdx = [0, 1, 2, 1, 2, 1, 0, 2][s % 8];
    const ch = chords[bar];
    if (s % 2 === 0 || k > 0.5) this.mtone(NOTE(root + 12 + ch[arpIdx] + (s >= 8 ? 12 : 0)), t0, 0.14, 'square', menu ? 0.05 : 0.06, 3200);
    // brass stabs
    if (!menu && (s === 0 || s === 6 || s === 10) && (bar % 2 === 0 || k > 0.4)) {
      for (const c of ch) this.mtone(NOTE(root + 12 + c), t0, 0.22, 'sawtooth', 0.045 + k * 0.03, 2400);
    }
    // lead hook every 4th bar
    if (!menu && bar === 3 && k > 0.45 && s % 4 === 2) this.mtone(NOTE(root + 24 + [0, 3, 7, 5][(s / 4) | 0]), t0, 0.18, 'triangle', 0.08, 5000);
    if (menu && s % 16 === 0) for (const c of ch) this.mtone(NOTE(root + 12 + c), t0, 1.4, 'triangle', 0.05, 1800);
  }
}
