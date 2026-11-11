// Fully synthesized Web Audio: layered engine per taxi, tire/wind/surface beds, one-shot cues,
// an original adaptive surf-breakbeat soundtrack, chirp voices for passenger barks, district ambience.

import type { GameEvent, Session } from "../sim/session/session";
import { ARCHETYPES } from "../sim/fares/archetypes";
import { districtAt } from "../sim/world/city";
import { forwardSpeed, speedOf } from "../sim/vehicle/vehicle";

export interface AudioSettings {
  master: number;
  music: number;
  sfx: number;
  voice: number;
}

export class AudioSys {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicBus!: GainNode;
  private musicDuck!: GainNode;
  private sfxBus!: GainNode;
  private voiceBus!: GainNode;
  private noiseBuf!: AudioBuffer;
  private engine: { o1: OscillatorNode; o2: OscillatorNode; o3: OscillatorNode; f: BiquadFilterNode; g: GainNode; whine: OscillatorNode; wg: GainNode } | null = null;
  private tire!: { g: GainNode; f: BiquadFilterNode };
  private wind!: { g: GainNode; f: BiquadFilterNode };
  private rumble!: { g: GainNode; f: BiquadFilterNode };
  private amb!: { g: GainNode; f: BiquadFilterNode; lfo: OscillatorNode; lfoGain: GainNode };
  private musicStep = 0;
  private nextNote = 0;
  intensity = 0;
  private timer: number | null = null;
  settings: AudioSettings;
  private enginePitch = 1;
  private lastGull = 0;

  constructor(settings: AudioSettings) {
    this.settings = settings;
  }

  /** Must be called from a user gesture. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    this.master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    this.master.connect(comp).connect(ctx.destination);
    this.musicBus = ctx.createGain();
    this.musicDuck = ctx.createGain();
    this.musicBus.connect(this.musicDuck).connect(this.master);
    this.sfxBus = ctx.createGain();
    this.sfxBus.connect(this.master);
    this.voiceBus = ctx.createGain();
    this.voiceBus.connect(this.master);
    this.noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    let s = 1;
    for (let i = 0; i < d.length; i++) {
      s = (s * 16807) % 2147483647;
      d[i] = (s / 2147483647) * 2 - 1;
    }
    this.applySettings(this.settings);
    // continuous beds
    this.tire = this.noiseBed("bandpass", 1900, 5);
    this.wind = this.noiseBed("lowpass", 400, 0.7);
    this.rumble = this.noiseBed("lowpass", 160, 1);
    const a = this.noiseBed("bandpass", 500, 0.8);
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.15;
    lfoGain.gain.value = 0;
    lfo.connect(lfoGain).connect(a.g.gain);
    lfo.start();
    this.amb = { ...a, lfo, lfoGain };
    this.timer = window.setInterval(() => this.schedule(), 25);
    this.nextNote = ctx.currentTime + 0.1;
  }

  applySettings(s: AudioSettings) {
    this.settings = s;
    if (!this.ctx) return;
    this.master.gain.value = s.master;
    this.musicBus.gain.value = s.music * 0.55;
    this.sfxBus.gain.value = s.sfx;
    this.voiceBus.gain.value = s.voice;
  }

  private noiseBed(type: BiquadFilterType, freq: number, q: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = 0;
    src.connect(f).connect(g).connect(this.sfxBus);
    src.start();
    return { g, f };
  }

  startEngine(taxiId: string) {
    if (!this.ctx) return;
    this.stopEngine();
    const ctx = this.ctx;
    this.enginePitch = taxiId === "gull" ? 1.18 : taxiId === "tempest" ? 0.82 : 1;
    const o1 = ctx.createOscillator(); o1.type = "sawtooth";
    const o2 = ctx.createOscillator(); o2.type = "square";
    const o3 = ctx.createOscillator(); o3.type = "triangle";
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 600; f.Q.value = 3;
    const g = ctx.createGain(); g.gain.value = 0;
    const g2 = ctx.createGain(); g2.gain.value = 0.35;
    o1.connect(f); o2.connect(g2).connect(f); o3.connect(f);
    f.connect(g).connect(this.sfxBus);
    const whine = ctx.createOscillator(); whine.type = "sine";
    const wg = ctx.createGain(); wg.gain.value = 0;
    whine.connect(wg).connect(this.sfxBus);
    for (const o of [o1, o2, o3, whine]) o.start();
    this.engine = { o1, o2, o3, f, g, whine, wg };
  }
  stopEngine() {
    if (!this.engine) return;
    for (const o of [this.engine.o1, this.engine.o2, this.engine.o3, this.engine.whine]) { try { o.stop(); } catch { /* already stopped */ } }
    this.engine.g.disconnect();
    this.engine.wg.disconnect();
    this.engine = null;
  }

  silenceBeds() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (const b of [this.tire, this.wind, this.rumble, this.amb]) b.g.gain.setTargetAtTime(0, t, 0.1);
    if (this.engine) this.engine.g.gain.setTargetAtTime(0, t, 0.1);
  }

  /** Per-frame continuous audio from the session. */
  update(s: Session | null, paused: boolean) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (!s || paused) {
      this.silenceBeds();
      this.intensity = s ? 0.5 : 0;
      return;
    }
    const v = s.v;
    const sp = speedOf(v);
    const fwd = Math.abs(forwardSpeed(v));
    const gears = [0, 11, 20, 29, 38, 60];
    let gi = 0;
    while (gi < gears.length - 2 && fwd > gears[gi + 1]) gi++;
    const frac = Math.min(1, (fwd - gears[gi]) / (gears[gi + 1] - gears[gi]));
    const rpm = 0.18 + frac * 0.82;
    const base = (48 + rpm * 120 + gi * 6) * this.enginePitch * (v.boosting ? 1.08 : 1);
    if (this.engine) {
      const e = this.engine;
      e.o1.frequency.setTargetAtTime(base, t, 0.03);
      e.o2.frequency.setTargetAtTime(base * 0.5, t, 0.03);
      e.o3.frequency.setTargetAtTime(base * 2.01, t, 0.03);
      const load = s.phase === "play" ? 0.4 + 0.6 * (v.prevThrottle ? 1 : 0.3) : 0.3;
      e.f.frequency.setTargetAtTime(300 + rpm * 1400 * load + (v.boosting ? 800 : 0), t, 0.05);
      e.g.gain.setTargetAtTime(0.11 + load * 0.08, t, 0.05);
      e.whine.frequency.setTargetAtTime(700 + sp * 22, t, 0.05);
      e.wg.gain.setTargetAtTime(v.boosting ? 0.05 : 0.008 * Math.min(1, sp / 30), t, 0.08);
    }
    const offroad = v.surface === "sand" || v.surface === "grass" || v.surface === "water";
    const slip = v.grounded && sp > 3 ? v.slip : 0;
    this.tire.g.gain.setTargetAtTime(offroad ? 0 : Math.max(0, slip - 0.3) * 0.22, t, 0.05);
    this.tire.f.frequency.setTargetAtTime(v.surface === "metal" ? 2600 : 1800 - Math.min(400, sp * 6), t, 0.05);
    this.rumble.g.gain.setTargetAtTime(v.grounded ? (offroad ? 0.14 : v.surface === "cobble" ? 0.12 : 0.03) * Math.min(1, sp / 15) : 0, t, 0.08);
    this.rumble.f.frequency.setTargetAtTime(v.surface === "water" ? 500 : v.surface === "cobble" ? 220 : 140, t, 0.1);
    this.wind.g.gain.setTargetAtTime(Math.min(0.16, (sp / 50) ** 2 * 0.16) + (v.grounded ? 0 : 0.04), t, 0.1);
    this.wind.f.frequency.setTargetAtTime(250 + sp * 25, t, 0.1);
    // district ambience
    const d = districtAt(v.x, v.z);
    const amb = { harbor: [260, 0.04, 0.12], beach: [700, 0.06, 0.18], oldsteps: [900, 0.025, 0.4], lantern: [1100, 0.03, 0.5], civic: [600, 0.02, 0.3], highline: [300, 0.03, 0.1] }[d];
    this.amb.f.frequency.setTargetAtTime(amb[0], t, 0.5);
    this.amb.g.gain.setTargetAtTime(amb[1], t, 0.5);
    this.amb.lfo.frequency.setTargetAtTime(amb[2], t, 0.5);
    this.amb.lfoGain.gain.setTargetAtTime(amb[1] * 0.8, t, 0.5);
    if ((d === "harbor" || d === "beach") && t - this.lastGull > 6 + Math.random() * 8) {
      this.lastGull = t;
      this.gull();
    }
    // music intensity follows pulse
    this.intensity = s.phase !== "play" ? 0.5 : 1 + Math.min(3, s.pulse.tier);
  }

  // ------------------------------------------------------------------ one-shots
  private tone(freq: number, dur: number, type: OscillatorType, gain: number, when = 0, bus: GainNode = this.sfxBus, slideTo?: number) {
    const ctx = this.ctx!;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  private noise(dur: number, freq: number, q: number, gain: number, type: BiquadFilterType = "bandpass", when = 0, bus: GainNode = this.sfxBus, sweepTo?: number) {
    const ctx = this.ctx!;
    const t = ctx.currentTime + when;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(bus);
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
  }
  private duck(amount = 0.55, dur = 0.6) {
    const t = this.ctx!.currentTime;
    this.musicDuck.gain.cancelScheduledValues(t);
    this.musicDuck.gain.setTargetAtTime(amount, t, 0.03);
    this.musicDuck.gain.setTargetAtTime(1, t + dur, 0.25);
  }
  private gull() {
    const f = 1400 + Math.random() * 400;
    this.tone(f, 0.18, "triangle", 0.02, 0, this.sfxBus, f * 0.7);
    this.tone(f * 1.05, 0.22, "triangle", 0.018, 0.22, this.sfxBus, f * 0.65);
  }

  ui(kind: "move" | "ok" | "back") {
    if (!this.ctx) return;
    if (kind === "move") this.tone(880, 0.05, "triangle", 0.05);
    if (kind === "ok") { this.tone(660, 0.07, "square", 0.05); this.tone(990, 0.1, "square", 0.05, 0.06); }
    if (kind === "back") this.tone(440, 0.08, "triangle", 0.05, 0, this.sfxBus, 330);
  }

  /** Chirp voice: syllable tones with vowel-ish formant filters. */
  voice(text: string, pitch: number) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const n = Math.min(9, Math.max(3, Math.round(text.length / 4)));
    const formants = [700, 1100, 400, 1600, 900, 300, 2200];
    for (let i = 0; i < n; i++) {
      const t = ctx.currentTime + i * 0.075;
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      const f0 = 190 * pitch * (1 + (((text.charCodeAt(i * 3 % text.length) * 7) % 13) - 6) * 0.025);
      o.frequency.setValueAtTime(f0, t);
      o.frequency.linearRampToValueAtTime(f0 * (i === n - 1 ? 1.25 : 0.92), t + 0.07);
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = formants[(text.charCodeAt(i % text.length) + i) % formants.length];
      f.Q.value = 5;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.32, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
      o.connect(f).connect(g).connect(this.voiceBus);
      o.start(t);
      o.stop(t + 0.09);
    }
    this.duck(0.7, n * 0.08);
  }

  events(events: GameEvent[]) {
    if (!this.ctx) return;
    for (const e of events) {
      switch (e.type) {
        case "countdown": this.tone(520, 0.14, "square", 0.08); break;
        case "go": this.tone(1040, 0.35, "square", 0.08); this.tone(780, 0.35, "square", 0.05); break;
        case "style": {
          const base = 520 * [1, 1.25, 1.5, 2, 2, 2.5][Math.min(5, e.mult - 1)];
          this.tone(base, 0.09, "triangle", 0.08);
          this.tone(base * 1.5, 0.12, "triangle", 0.06, 0.06);
          if (e.kind === "nearMiss" || e.kind === "thread") this.noise(0.25, 900, 1, 0.12, "bandpass", 0, this.sfxBus, 3000);
          break;
        }
        case "tierUp": [0, 4, 7, 12].forEach((s, i) => this.tone(440 * 2 ** ((s + e.tier * 2) / 12), 0.16, "square", 0.06, i * 0.06)); break;
        case "chainDrop": this.tone(330, 0.25, "sawtooth", 0.06, 0, this.sfxBus, e.reset ? 110 : 220); break;
        case "collision":
          if (e.impact > 2) {
            const g = Math.min(0.6, e.impact / 25);
            this.noise(0.25, 800, 0.8, g, "lowpass");
            this.tone(90, 0.25, "sine", g * 0.8, 0, this.sfxBus, 45);
            if (e.impact > 8) { this.noise(0.4, 3000, 2, g * 0.3, "highpass"); this.duck(0.5, 0.5); }
          }
          break;
        case "pickup": [0, 5, 9].forEach((s, i) => this.tone(660 * 2 ** (s / 12), 0.14, "triangle", 0.09, i * 0.07)); this.noise(0.12, 2500, 1, 0.05, "highpass", 0.25); break;
        case "deliver": {
          const seq = e.grade === "Blazing" ? [0, 4, 7, 12, 16] : e.grade === "Fast" ? [0, 4, 7, 12] : e.grade === "Close" ? [0, 4, 7] : [0, 3, 6];
          seq.forEach((s, i) => { this.tone(523 * 2 ** (s / 12), 0.22, "square", 0.07, i * 0.08); this.tone(523 * 2 ** ((s - 12) / 12), 0.22, "sawtooth", 0.04, i * 0.08); });
          this.noise(0.6, 6000, 1, 0.05, "highpass", 0.1);
          this.duck(0.6, 0.8);
          break;
        }
        case "fareFail": this.tone(300, 0.5, "sawtooth", 0.07, 0, this.sfxBus, 120); break;
        case "shortcut": [0, 7, 12].forEach((s, i) => this.tone(784 * 2 ** (s / 12), 0.12, "triangle", 0.07, i * 0.05)); if (e.first) this.tone(1568, 0.4, "sine", 0.06, 0.2); break;
        case "shortcutEnter": this.tone(1200, 0.06, "sine", 0.04); break;
        case "item": this.tone(e.kind === "spark" ? 1500 : 1100, 0.2, "sine", 0.08, 0, this.sfxBus, e.kind === "spark" ? 2400 : 1800); break;
        case "boost": if (e.on) this.noise(0.8, 400, 1.2, 0.25, "bandpass", 0, this.sfxBus, 3500); break;
        case "surge": this.noise(0.5, 300, 1, 0.2, "bandpass", 0, this.sfxBus, 2500); break;
        case "snapDrift": this.noise(0.18, 1500, 3, 0.07); break;
        case "gripTurn": this.tone(240, 0.15, "square", 0.05, 0, this.sfxBus, 380); break;
        case "land": if (e.impact > 4) { this.tone(70, 0.2, "sine", Math.min(0.4, e.impact / 30)); this.noise(0.15, 300, 1, Math.min(0.2, e.impact / 50), "lowpass"); } break;
        case "splash": this.noise(1.0, 1200, 0.5, 0.35, "lowpass", 0, this.sfxBus, 200); break;
        case "reset": this.tone(600, 0.3, "triangle", 0.06, 0, this.sfxBus, 300); break;
        case "pedDodge": this.tone(900, 0.06, "triangle", 0.03); break;
        case "pedPenalty": this.tone(220, 0.3, "square", 0.06); break;
        case "prop": this.noise(0.12, 600, 1.5, 0.12); break;
        case "clockLow": this.tone(e.seconds <= 3 ? 1320 : 990, 0.08, "square", e.seconds <= 3 ? 0.08 : 0.05); break;
        case "bark": this.voice(e.text, ARCHETYPES[e.archetype].voice); break;
        case "lessonDone": [0, 4, 7, 11, 14].forEach((s, i) => this.tone(587 * 2 ** (s / 12), 0.2, "triangle", 0.07, i * 0.07)); break;
        case "end": [12, 7, 4, 0].forEach((s, i) => this.tone(440 * 2 ** (s / 12), 0.3, "square", 0.06, i * 0.12)); break;
      }
    }
  }

  // ------------------------------------------------------------------ music (original, procedural)
  private schedule() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const bpm = 124;
    const step = 60 / bpm / 4;
    while (this.nextNote < ctx.currentTime + 0.12) {
      this.playStep(this.musicStep, this.nextNote);
      this.nextNote += step;
      this.musicStep = (this.musicStep + 1) % 128;
    }
  }

  private playStep(i: number, t: number) {
    const ctx = this.ctx!;
    const lvl = this.intensity;
    const bar = Math.floor(i / 16) % 8;
    const s = i % 16;
    // progression: D C G A | D C G Bb (semitones from D2)
    const roots = [0, -2, 5, 7, 0, -2, 5, 8];
    const root = 73.42 * 2 ** (roots[bar] / 12);
    const bus = this.musicBus;
    const env = (node: AudioNode, g0: number, dur: number) => {
      const g = ctx.createGain();
      g.gain.setValueAtTime(g0, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      node.connect(g).connect(bus);
      return g;
    };
    const osc = (type: OscillatorType, f: number, dur: number, g0: number, filt?: number) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      let n: AudioNode = o;
      if (filt) {
        const fl = ctx.createBiquadFilter();
        fl.type = "lowpass";
        fl.frequency.setValueAtTime(filt, t);
        fl.frequency.exponentialRampToValueAtTime(Math.max(80, filt * 0.25), t + dur);
        o.connect(fl);
        n = fl;
      }
      env(n, g0, dur);
      o.start(t);
      o.stop(t + dur + 0.02);
      return o;
    };
    const hit = (freq: number, q: number, dur: number, g0: number, type: BiquadFilterType) => {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const f = ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      src.connect(f);
      env(f, g0, dur);
      src.start(t, (i * 0.137) % 1.5);
      src.stop(t + dur + 0.02);
    };
    if (lvl <= 0.5) {
      // menu / paused: soft pad + light shaker
      if (s === 0) {
        for (const k of [0, 4, 7]) osc("triangle", root * 2 * 2 ** (k / 12), 1.9, 0.035, 1200);
      }
      if (s % 4 === 2) hit(7000, 1, 0.05, 0.035, "highpass");
      if (s === 0 || s === 10) { const o = osc("sine", 110, 0.25, 0.25); o.frequency.exponentialRampToValueAtTime(45, t + 0.2); }
      return;
    }
    // breakbeat drums
    const kick = [0, 6, 10];
    const snare = [4, 12];
    if (kick.includes(s) || (bar % 2 === 1 && s === 14)) { const o = osc("sine", 140, 0.28, 0.55); o.frequency.exponentialRampToValueAtTime(42, t + 0.22); }
    if (snare.includes(s)) { hit(1800, 0.8, 0.18, 0.28, "bandpass"); osc("triangle", 190, 0.1, 0.12); }
    if (s % 2 === 0 || lvl >= 2) hit(8000, 1, s % 4 === 2 ? 0.09 : 0.035, s % 4 === 2 ? 0.07 : 0.04, "highpass");
    if (s === 15 && bar % 4 === 3) hit(1400, 0.8, 0.12, 0.2, "bandpass");
    // surf bass: driving eighths with octave pops
    if (s % 2 === 0) {
      const oct = s % 8 === 6 ? 2 : 1;
      osc("sawtooth", root * oct, 0.2, 0.16, 900);
    }
    // brass stabs on the offbeats at 2x pulse+
    if (lvl >= 2 && (s === 3 || s === 11 || (s === 14 && bar % 2 === 1))) {
      for (const k of [12, 16, 19]) {
        const o1 = osc("sawtooth", root * 2 ** (k / 12) * 2, 0.16, 0.035, 2600);
        o1.detune.value = 8;
        osc("sawtooth", root * 2 ** (k / 12) * 2, 0.16, 0.03, 2600).detune.value = -9;
      }
    }
    // twangy lead arpeggio at 3x+
    if (lvl >= 3 && s % 2 === 1) {
      const scale = [0, 4, 7, 12, 14, 12, 7, 4];
      const n = scale[(s >> 1) % scale.length] + (bar % 2 ? 2 : 0);
      const o = osc("square", root * 4 * 2 ** (n / 12), 0.12, 0.03, 3200);
      const vib = ctx.createOscillator();
      const vg = ctx.createGain();
      vib.frequency.value = 7;
      vg.gain.value = 6;
      vib.connect(vg).connect(o.frequency);
      vib.start(t);
      vib.stop(t + 0.14);
    }
    // 5x: extra percussion fill
    if (lvl >= 4 && s % 4 === 1) hit(3000, 2, 0.06, 0.06, "bandpass");
  }
}
