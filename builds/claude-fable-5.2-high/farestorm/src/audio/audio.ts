// Fully procedural Web Audio: layered engine, tyres, wind, impacts, UI cues, passenger "voice" blips
// and an original adaptive music loop (surf-ish plucks, brass stabs, breakbeat, synth bass).
import { SessionEvent } from '../game-session/session';
import { clamp01, lerp } from '../core/math';
import { Surface } from '../world/galeport';

export interface DriveAudioState {
  speed: number;
  throttle: number;
  slide: number;
  boost: boolean;
  airborne: boolean;
  surface: Surface;
  pitch: number; // per-taxi engine pitch
  pulseTier: number;
  carrying: boolean;
  active: boolean;
}

const NOTE = (n: number): number => 440 * Math.pow(2, (n - 69) / 12);
// Em - C - G - D, two bars each.
const CHORDS = [[52, 55, 59], [48, 52, 55], [55, 59, 62], [50, 54, 57]];
const BASS = [40, 36, 43, 38];
const LEAD = [
  [76, -1, 79, 76, -1, 83, 81, -1, 79, -1, 76, 74, -1, 76, -1, -1],
  [72, -1, 76, 79, -1, 76, 72, -1, 74, -1, 76, 79, -1, 84, -1, -1],
  [79, -1, 83, 86, -1, 83, 79, -1, 78, -1, 79, 83, -1, 81, -1, -1],
  [78, -1, 74, 78, -1, 81, 78, -1, 74, -1, 69, 74, -1, 78, 81, -1],
];

export class AudioEngine {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicBus!: GainNode;
  private sfxBus!: GainNode;
  private duck!: GainNode;
  private noise!: AudioBuffer;
  private eng?: { o1: OscillatorNode; o2: OscillatorNode; filt: BiquadFilterNode; gain: GainNode };
  private tyre?: { filt: BiquadFilterNode; gain: GainNode };
  private wind?: { gain: GainNode };
  private rough?: { gain: GainNode };
  private boostN?: { filt: BiquadFilterNode; gain: GainNode };
  private rpm = 0.2;
  private volumes = { master: 0.8, music: 0.6, sfx: 0.8 };
  private step = 0;
  private nextStepTime = 0;
  private intensity = 0;
  private musicOn = true;
  private bpm = 150;
  muted = false;

  /** Must be called from a user gesture. Safe to call repeatedly. */
  unlock(): void {
    if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume(); return; }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 5;
    this.master.connect(comp).connect(ctx.destination);
    this.musicBus = ctx.createGain();
    this.duck = ctx.createGain();
    this.musicBus.connect(this.duck).connect(this.master);
    this.sfxBus = ctx.createGain();
    this.sfxBus.connect(this.master);
    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    let seed = 1234567;
    for (let i = 0; i < len; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; d[i] = (seed / 4294967296) * 2 - 1; }
    this.applyVolumes();
    this.buildLoops();
    this.nextStepTime = ctx.currentTime + 0.1;
  }
  setVolumes(v: { master: number; music: number; sfx: number }): void {
    this.volumes = v;
    this.applyVolumes();
  }
  private applyVolumes(): void {
    if (!this.ctx) return;
    this.master.gain.value = this.muted ? 0 : this.volumes.master;
    this.musicBus.gain.value = this.volumes.music * 0.5;
    this.sfxBus.gain.value = this.volumes.sfx;
  }
  setMuted(m: boolean): void {
    this.muted = m;
    this.applyVolumes();
  }
  private noiseSrc(): AudioBufferSourceNode {
    const s = this.ctx!.createBufferSource();
    s.buffer = this.noise;
    s.loop = true;
    return s;
  }
  private buildLoops(): void {
    const ctx = this.ctx!;
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    o1.type = 'sawtooth'; o2.type = 'square';
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass'; filt.Q.value = 2.5;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const g2 = ctx.createGain();
    g2.gain.value = 0.45;
    o1.connect(filt); o2.connect(g2).connect(filt); filt.connect(gain).connect(this.sfxBus);
    o1.start(); o2.start();
    this.eng = { o1, o2, filt, gain };
    const mkNoise = (type: BiquadFilterType, freq: number, q: number) => {
      const src = this.noiseSrc();
      const f = ctx.createBiquadFilter();
      f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = ctx.createGain();
      g.gain.value = 0;
      src.connect(f).connect(g).connect(this.sfxBus);
      src.start();
      return { filt: f, gain: g };
    };
    this.tyre = mkNoise('bandpass', 1150, 4);
    this.wind = mkNoise('highpass', 700, 0.5);
    this.rough = mkNoise('lowpass', 260, 0.7);
    this.boostN = mkNoise('bandpass', 600, 1.2);
  }

  /** Continuous layers. Call every rendered frame. */
  update(dt: number, s: DriveAudioState): void {
    const ctx = this.ctx;
    if (!ctx || !this.eng) return;
    const t = ctx.currentTime;
    const k = (p: AudioParam, v: number, tc = 0.05) => p.setTargetAtTime(v, t, tc);
    if (!s.active) {
      k(this.eng.gain.gain, 0); k(this.tyre!.gain.gain, 0); k(this.wind!.gain.gain, 0); k(this.rough!.gain.gain, 0); k(this.boostN!.gain.gain, 0);
    } else {
      const gearSpan = 12.5;
      const gear = Math.min(4, Math.floor(s.speed / gearSpan));
      const frac = (s.speed - gear * gearSpan) / gearSpan;
      let target = 0.22 + 0.7 * Math.min(1.15, frac) * (0.75 + gear * 0.06);
      if (s.airborne && s.throttle > 0.5) target = 1.1;
      if (s.speed < 2 && s.throttle > 0.5) target = 0.7;
      this.rpm = lerp(this.rpm, target, 1 - Math.exp(-dt * (target > this.rpm ? 6 : 9)));
      const f = (62 + this.rpm * 165) * s.pitch * (s.boost ? 1.12 : 1);
      k(this.eng.o1.frequency, f, 0.03);
      k(this.eng.o2.frequency, f * 0.5, 0.03);
      k(this.eng.filt.frequency, 380 + this.rpm * 1500 + s.throttle * 900, 0.05);
      k(this.eng.gain.gain, 0.045 + s.throttle * 0.085 + this.rpm * 0.03);
      const loose = s.surface === 'sand' || s.surface === 'grass' || s.surface === 'dirt' || s.surface === 'water';
      k(this.tyre!.gain.gain, s.airborne || loose ? 0 : Math.min(0.2, s.slide * 0.22));
      k(this.tyre!.filt.frequency, 950 + s.speed * 14);
      k(this.wind!.gain.gain, Math.min(0.11, (s.speed / 50) ** 2 * 0.11));
      k(this.rough!.gain.gain, s.airborne ? 0 : (loose ? 0.2 : s.surface === 'cobble' || s.surface === 'deck' ? 0.1 : 0.02) * clamp01(s.speed / 14));
      k(this.boostN!.gain.gain, s.boost ? 0.16 : 0, 0.08);
      k(this.boostN!.filt.frequency, 500 + this.rpm * 1400);
    }
    this.intensity = s.active ? (s.pulseTier >= 2 ? 2 : s.carrying || s.pulseTier >= 1 ? 1 : 0.5) : 0.25;
    this.scheduleMusic();
  }

  // --------------------------------------------------------------------- music
  setMusicEnabled(on: boolean): void {
    this.musicOn = on;
  }
  private scheduleMusic(): void {
    const ctx = this.ctx!;
    const stepDur = 60 / this.bpm / 4;
    if (this.nextStepTime < ctx.currentTime - 0.3) this.nextStepTime = ctx.currentTime + 0.05;
    while (this.nextStepTime < ctx.currentTime + 0.14) {
      if (this.musicOn && this.volumes.music > 0.01) this.playStep(this.step, this.nextStepTime, stepDur);
      this.step = (this.step + 1) % 128;
      this.nextStepTime += stepDur;
    }
  }
  private env(g: GainNode, t: number, peak: number, attack: number, decay: number): void {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }
  private tone(type: OscillatorType, freq: number, t: number, peak: number, attack: number, decay: number, dest: AudioNode, cutoff = 0, slideTo = 0): void {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + attack + decay);
    const g = ctx.createGain();
    this.env(g, t, peak, attack, decay);
    if (cutoff) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.setValueAtTime(cutoff, t); f.frequency.exponentialRampToValueAtTime(Math.max(120, cutoff * 0.3), t + attack + decay);
      o.connect(f).connect(g);
    } else o.connect(g);
    g.connect(dest);
    o.start(t);
    o.stop(t + attack + decay + 0.05);
  }
  private burst(t: number, peak: number, decay: number, type: BiquadFilterType, freq: number, dest: AudioNode, q = 0.8): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    this.env(g, t, peak, 0.002, decay);
    src.connect(f).connect(g).connect(dest);
    src.start(t, Math.random() * 1.5, decay + 0.1);
  }
  private playStep(step: number, t: number, sd: number): void {
    const m = this.musicBus;
    const bar = Math.floor(step / 16) % 8, s = step % 16;
    const ci = Math.floor(bar / 2) % 4;
    const I = this.intensity;
    const fill = bar % 4 === 3 && s >= 12;
    // Breakbeat-ish drums.
    const kick = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0][s] || (fill && s === 15);
    const snare = [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0][s] || (fill && s % 2 === 1);
    if (kick) this.tone('sine', 150, t, 0.9, 0.002, 0.16, m, 0, 42);
    if (snare && I >= 0.5) { this.burst(t, I >= 1 ? 0.5 : 0.25, 0.12, 'bandpass', 1900, m); this.tone('triangle', 210, t, 0.2, 0.001, 0.07, m); }
    if (s % 2 === 0 || I >= 1) this.burst(t, s % 4 === 2 ? 0.16 : 0.08, s % 4 === 2 ? 0.07 : 0.03, 'highpass', 7500, m);
    // Bass: driving eighths with an octave jump.
    if (s % 2 === 0) {
      const n = BASS[ci] + (s === 6 || s === 14 ? 12 : 0) + (s === 10 ? 7 : 0);
      this.tone('sawtooth', NOTE(n), t, 0.36, 0.005, sd * 1.7, m, 520 + I * 260);
    }
    // Brass stabs on the off-beats.
    if (I >= 1 && (s === 3 || s === 6 || s === 11 || (bar % 2 === 1 && s === 14))) {
      for (const n of CHORDS[ci]) for (const det of [-6, 5]) {
        const o = NOTE(n + 12) * Math.pow(2, det / 1200);
        this.tone('sawtooth', o, t, 0.075, 0.012, 0.16, m, 2600);
      }
    }
    // Surf lead: plucked, slightly detuned triangle + square.
    if (I >= 2 || (I >= 1 && bar >= 4)) {
      const n = LEAD[ci][s];
      if (n > 0) {
        this.tone('triangle', NOTE(n), t, 0.2, 0.004, 0.22, m);
        this.tone('square', NOTE(n) * 1.004, t, 0.05, 0.004, 0.14, m, 3200);
      }
    } else if (s === 0 && bar % 2 === 0) {
      for (const n of CHORDS[ci]) this.tone('triangle', NOTE(n + 12), t, 0.07, 0.03, sd * 14, m);
    }
  }

  // --------------------------------------------------------------------- one-shots
  private arp(notes: number[], gap: number, type: OscillatorType = 'triangle', peak = 0.22, decay = 0.2): void {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + 0.01;
    notes.forEach((n, i) => {
      this.tone(type, NOTE(n), t0 + i * gap, peak, 0.004, decay, this.sfxBus);
      this.tone('sine', NOTE(n + 12), t0 + i * gap, peak * 0.4, 0.004, decay, this.sfxBus);
    });
  }
  private duckMusic(amount: number, time: number): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.duck.gain.cancelScheduledValues(t);
    this.duck.gain.setTargetAtTime(amount, t, 0.03);
    this.duck.gain.setTargetAtTime(1, t + time, 0.25);
  }
  ui(kind: 'move' | 'select' | 'back' | 'start'): void {
    if (!this.ctx) return;
    if (kind === 'move') this.arp([76], 0, 'square', 0.07, 0.05);
    else if (kind === 'select') this.arp([76, 83], 0.05, 'square', 0.09, 0.08);
    else if (kind === 'back') this.arp([74, 67], 0.05, 'square', 0.08, 0.08);
    else this.arp([64, 71, 76, 83, 88], 0.06, 'sawtooth', 0.1, 0.25);
  }
  horn(): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone('square', 392, t, 0.12, 0.01, 0.32, this.sfxBus, 1800);
    this.tone('square', 494, t, 0.12, 0.01, 0.32, this.sfxBus, 1800);
  }
  event(e: SessionEvent): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime + 0.005;
    switch (e.type) {
      case 'countdown': this.tone('square', 660, t, 0.18, 0.005, 0.16, this.sfxBus, 2400); break;
      case 'go': this.tone('square', 1320, t, 0.2, 0.005, 0.45, this.sfxBus, 4000); this.tone('sawtooth', 660, t, 0.12, 0.005, 0.45, this.sfxBus, 3000); break;
      case 'collision': {
        const v = clamp01(e.severity / 14);
        this.burst(t, 0.35 + v * 0.55, 0.14 + v * 0.2, 'lowpass', 900 + v * 1400, this.sfxBus);
        this.tone('sine', 95, t, 0.4 + v * 0.4, 0.002, 0.22, this.sfxBus, 0, 38);
        if (e.traffic) this.burst(t + 0.03, 0.2, 0.18, 'bandpass', 2600, this.sfxBus, 3);
        if (e.hard) this.duckMusic(0.5, 0.35);
        break;
      }
      case 'style': {
        const base = 72 + Math.min(3, e.mult === 5 ? 3 : e.mult - 1) * 2;
        if (e.cat === 'nearMiss') this.arp([base + 7, base + 12], 0.04, 'triangle', 0.16, 0.1);
        else if (e.cat === 'thread') this.arp([base + 7, base + 12, base + 16], 0.04, 'triangle', 0.18, 0.12);
        else if (e.cat === 'shortcut') this.arp([base, base + 4, base + 7, base + 11], 0.05, 'square', 0.1, 0.16);
        else if (e.cat === 'oncoming' || e.cat === 'sightsee') this.arp([base + 12], 0, 'sine', 0.14, 0.12);
        else this.arp([base, base + 7], 0.05, 'triangle', 0.18, 0.14);
        break;
      }
      case 'pulse':
        if (e.change === 'up') { this.arp([67, 71, 74, 79].map((n) => n + (e.mult >= 5 ? 5 : e.mult >= 3 ? 2 : 0)), 0.045, 'sawtooth', 0.11, 0.2); this.burst(t, 0.12, 0.3, 'highpass', 5000, this.sfxBus); }
        else if (e.change === 'end' || e.change === 'down') this.arp([67, 62], 0.07, 'sine', 0.1, 0.16);
        break;
      case 'pickup': this.arp([64, 68, 71, 76], 0.055, 'triangle', 0.2, 0.18); break;
      case 'delivered': {
        const g = e.result.grade;
        if (g === 'Blazing') this.arp([64, 68, 71, 76, 80, 83, 88], 0.06, 'triangle', 0.22, 0.3);
        else if (g === 'Fast') this.arp([64, 68, 71, 76, 80], 0.065, 'triangle', 0.2, 0.26);
        else if (g === 'Close') this.arp([64, 68, 71], 0.07, 'triangle', 0.2, 0.22);
        else this.arp([64, 63, 59], 0.09, 'triangle', 0.18, 0.22);
        this.burst(t, 0.1, 0.4, 'highpass', 6000, this.sfxBus);
        break;
      }
      case 'fareFailed': this.arp([60, 56, 53, 48], 0.1, 'sawtooth', 0.12, 0.25); this.duckMusic(0.5, 0.5); break;
      case 'time': if (e.delta > 0) this.arp([83, 88], 0.05, 'sine', 0.14, 0.12); else this.arp([60, 54], 0.08, 'square', 0.1, 0.14); break;
      case 'lowTime': this.tone('square', e.n <= 3 ? 990 : 740, t, 0.12, 0.003, 0.09, this.sfxBus, 3000); break;
      case 'boost': if (e.on) { this.tone('sawtooth', 180, t, 0.16, 0.02, 0.5, this.sfxBus, 2600, 720); this.burst(t, 0.2, 0.5, 'bandpass', 1400, this.sfxBus, 1.5); } break;
      case 'surge': this.tone('sawtooth', 140, t, 0.2, 0.01, 0.35, this.sfxBus, 2000, 420); break;
      case 'gripTurn': this.burst(t, 0.22, 0.12, 'bandpass', 2400, this.sfxBus, 5); break;
      case 'air': this.tone('sine', 70, t, 0.5, 0.002, 0.18, this.sfxBus, 0, 40); this.burst(t, 0.2, 0.1, 'lowpass', 700, this.sfxBus); break;
      case 'respawn': this.arp([72, 60], 0.08, 'sine', 0.16, 0.2); this.burst(t, 0.25, 0.4, 'lowpass', 1200, this.sfxBus); break;
      case 'lesson': this.arp([67, 72, 76, 79, 84], 0.06, 'triangle', 0.2, 0.25); break;
      case 'special': this.arp([76, 80, 83, 87, 92], 0.05, 'square', 0.1, 0.2); break;
      case 'token': this.arp(e.kind === 'clock' ? [84, 88, 91, 96] : [79, 86], 0.045, 'sine', 0.2, 0.16); break;
      case 'finished': this.arp([76, 71, 68, 64, 59, 64], 0.11, 'triangle', 0.22, 0.4); this.duckMusic(0.4, 1.2); break;
      case 'bark': {
        // Wordless "voice": a few pitched blips shaped by the passenger's voice parameter.
        const n = 3 + Math.min(4, Math.floor(e.text.length / 14));
        for (let i = 0; i < n; i++) {
          const f = (300 + ((e.text.charCodeAt(i * 3 % e.text.length) * 13) % 180)) * e.voice;
          this.tone('triangle', f, t + i * 0.075, 0.1, 0.008, 0.06, this.sfxBus, 1800, f * (i % 2 ? 1.12 : 0.9));
        }
        this.duckMusic(0.7, 0.4);
        break;
      }
      default: break;
    }
  }
}
