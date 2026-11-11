// Web Audio: fully procedural, original sound — engine layers, tires, sirens, weapons,
// ambience by district/weather, UI cues, and two generative "radio" stations.
import type { Game, Fx } from "../sim/game";
import { clamp, dist2, Rng } from "../core/math";

export class AudioEngine {
  ctx: AudioContext | null = null;
  master!: GainNode; sfx!: GainNode; music!: GainNode; amb!: GainNode;
  private noiseBuf!: AudioBuffer;
  private eng: { o1: OscillatorNode; o2: OscillatorNode; f: BiquadFilterNode; g: GainNode } | null = null;
  private tire: { src: AudioBufferSourceNode; f: BiquadFilterNode; g: GainNode } | null = null;
  private siren: { o: OscillatorNode; lfo: OscillatorNode; g: GainNode } | null = null;
  private bed: { g: GainNode; rain: GainNode; f: BiquadFilterNode } | null = null;
  private voices = 0;
  private rng = new Rng(42);
  private radioNext = 0;
  private radioStep = 0;
  private radioIdT = 0;
  private gullT = 0;
  private hornT = 0;
  state: "off" | "suspended" | "running" = "off";

  constructor(private game: Game) {}

  /** Must be called from a user gesture. */
  start() {
    if (this.ctx) { this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AC();
    } catch { this.state = "off"; return; }
    const c = this.ctx;
    this.master = c.createGain(); this.master.connect(c.destination);
    this.sfx = c.createGain(); this.sfx.connect(this.master);
    this.music = c.createGain(); this.music.connect(this.master);
    this.amb = c.createGain(); this.amb.connect(this.master);
    const len = c.sampleRate * 2;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    let b = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; d[i] = w; void b; }
    // engine
    const o1 = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    o1.type = "sawtooth"; o2.type = "square"; f.type = "lowpass"; f.frequency.value = 600; g.gain.value = 0;
    o1.connect(f); o2.connect(f); f.connect(g); g.connect(this.sfx); o1.start(); o2.start();
    this.eng = { o1, o2, f, g };
    // tires
    const ts = c.createBufferSource(); ts.buffer = this.noiseBuf; ts.loop = true;
    const tf = c.createBiquadFilter(); tf.type = "bandpass"; tf.frequency.value = 1700; tf.Q.value = 3;
    const tg = c.createGain(); tg.gain.value = 0;
    ts.connect(tf); tf.connect(tg); tg.connect(this.sfx); ts.start();
    this.tire = { src: ts, f: tf, g: tg };
    // siren
    const so = c.createOscillator(), lfo = c.createOscillator(), lg = c.createGain(), sg = c.createGain();
    so.type = "triangle"; so.frequency.value = 850; lfo.frequency.value = 0.55; lg.gain.value = 320; sg.gain.value = 0;
    lfo.connect(lg); lg.connect(so.frequency); so.connect(sg); sg.connect(this.sfx); so.start(); lfo.start();
    this.siren = { o: so, lfo, g: sg };
    // ambience bed (city rumble) + rain
    const bs = c.createBufferSource(); bs.buffer = this.noiseBuf; bs.loop = true;
    const bf = c.createBiquadFilter(); bf.type = "lowpass"; bf.frequency.value = 260;
    const bg = c.createGain(); bg.gain.value = 0.05;
    bs.connect(bf); bf.connect(bg); bg.connect(this.amb); bs.start();
    const rs = c.createBufferSource(); rs.buffer = this.noiseBuf; rs.loop = true; rs.playbackRate.value = 0.7;
    const rf = c.createBiquadFilter(); rf.type = "highpass"; rf.frequency.value = 1500;
    const rg = c.createGain(); rg.gain.value = 0;
    rs.connect(rf); rf.connect(rg); rg.connect(this.amb); rs.start();
    this.bed = { g: bg, rain: rg, f: bf };
    this.state = c.state === "running" ? "running" : "suspended";
    c.onstatechange = () => { this.state = c.state === "running" ? "running" : "suspended"; };
  }

  private pos(x: number, z: number): { gain: number; pan: number } {
    const cam = this.game.cam;
    const d = Math.max(1, dist2(x, z, cam.pos.x, cam.pos.z));
    const gain = clamp(1 / (1 + (d * d) / 300), 0, 1);
    const rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw);
    const pan = clamp(((x - cam.pos.x) * rx + (z - cam.pos.z) * rz) / d, -1, 1);
    return { gain, pan };
  }

  private out(gain: number, pan: number): AudioNode {
    const c = this.ctx!;
    const g = c.createGain(); g.gain.value = gain;
    const p = c.createStereoPanner(); p.pan.value = pan;
    g.connect(p); p.connect(this.sfx);
    return g;
  }

  private noiseHit(t: number, dur: number, freq: number, q: number, gain: number, pan: number, type: BiquadFilterType = "bandpass") {
    if (this.voices > 48) return;
    const c = this.ctx!;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.playbackRate.value = 0.8 + this.rng.next() * 0.4;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    s.connect(f); f.connect(g); g.connect(this.out(1, pan));
    s.start(t, this.rng.next()); s.stop(t + dur + 0.05);
    this.voices++; s.onended = () => this.voices--;
  }

  private tone(t: number, f0: number, f1: number, dur: number, gain: number, type: OscillatorType, pan = 0, dest?: AudioNode) {
    if (this.voices > 56) return;
    const c = this.ctx!;
    const o = c.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest ?? this.out(1, pan));
    o.start(t); o.stop(t + dur + 0.05);
    this.voices++; o.onended = () => this.voices--;
  }

  fx(list: Fx[]) {
    if (!this.ctx || this.ctx.state !== "running") return;
    const t = this.ctx.currentTime;
    for (const f of list) {
      switch (f.type) {
        case "shot": {
          const p = this.pos(f.x, f.z);
          if (p.gain < 0.01) break;
          const heavy = f.weapon === "shotgun" || f.weapon === "marksman" || f.weapon === "carbine";
          this.noiseHit(t, heavy ? 0.35 : 0.22, heavy ? 900 : 1400, 0.8, 0.9 * p.gain, p.pan);
          this.tone(t, heavy ? 140 : 190, 45, heavy ? 0.25 : 0.15, 0.7 * p.gain, "sine", p.pan);
          break;
        }
        case "stun": { const p = this.pos(f.x, f.z); this.tone(t, 2400, 300, 0.25, 0.25 * p.gain, "sawtooth", p.pan); break; }
        case "impact": { const p = this.pos(f.x, f.z); if (p.gain > 0.02) this.noiseHit(t, 0.08, f.mat === "spark" ? 3000 : 900, 2, 0.35 * p.gain, p.pan); break; }
        case "crash": { const p = this.pos(f.x, f.z); this.noiseHit(t, 0.5, 400, 0.6, (0.4 + f.power) * p.gain, p.pan, "lowpass"); this.noiseHit(t, 0.25, 2500, 1, 0.3 * f.power * p.gain, p.pan); break; }
        case "horn": {
          if (t < this.hornT) break;
          this.hornT = t + 0.3;
          const p = this.pos(f.x, f.z);
          this.tone(t, 392, 392, 0.45, 0.22 * p.gain, "square", p.pan); this.tone(t, 494, 494, 0.45, 0.16 * p.gain, "square", p.pan);
          break;
        }
        case "splash": { const p = this.pos(f.x, f.z); this.noiseHit(t, 0.9, 700, 0.5, 0.7 * p.gain, p.pan, "lowpass"); break; }
        case "chirp": { const p = this.pos(f.x, f.z); this.tone(t, 2600, 3800, 0.12, 0.25 * p.gain, "sine", p.pan); this.tone(t + 0.14, 3400, 2400, 0.1, 0.2 * p.gain, "sine", p.pan); break; }
        case "smoke": { const p = this.pos(f.x, f.z); this.noiseHit(t, 1.6, 2000, 0.4, 0.5 * p.gain, p.pan, "highpass"); break; }
        case "melee": { const p = this.pos(f.x, f.z); this.noiseHit(t, 0.1, 300, 1, 0.6 * p.gain, p.pan, "lowpass"); break; }
        case "alert": for (let k = 0; k < 3; k++) this.tone(t + k * 0.13, 520 + k * 120, 560 + k * 120, 0.12, 0.18, "triangle"); break;
        case "ui": {
          const s = f.sound;
          if (s === "click") this.tone(t, 900, 700, 0.06, 0.12, "triangle");
          else if (s === "cash") { this.tone(t, 1200, 1200, 0.08, 0.15, "square"); this.tone(t + 0.08, 1600, 1600, 0.12, 0.12, "square"); }
          else if (s === "mission") [523, 659, 784, 1046].forEach((n, k) => this.tone(t + k * 0.11, n, n, 0.3, 0.14, "triangle"));
          else if (s === "fail") [392, 330, 262].forEach((n, k) => this.tone(t + k * 0.16, n, n * 0.98, 0.35, 0.16, "sawtooth"));
          else if (s === "photo") { this.noiseHit(t, 0.06, 4000, 1, 0.3, 0); this.tone(t + 0.05, 1800, 1800, 0.05, 0.1, "square"); }
          else if (s === "lock") this.tone(t, 1500, 1100, 0.07, 0.2, "square");
          else if (s === "door") this.noiseHit(t, 0.15, 500, 1, 0.3, 0, "lowpass");
          else if (s === "checkpoint") { this.tone(t, 880, 880, 0.1, 0.16, "sine"); this.tone(t + 0.1, 1320, 1320, 0.15, 0.14, "sine"); }
          break;
        }
      }
    }
  }

  update(dt: number) {
    const c = this.ctx;
    if (!c || c.state !== "running") return;
    const g = this.game;
    const s = g.settings;
    const t = c.currentTime;
    this.master.gain.setTargetAtTime(s.master, t, 0.05);
    this.sfx.gain.setTargetAtTime(s.sfx, t, 0.05);
    this.music.gain.setTargetAtTime(s.streamerMode ? 0 : s.music * 0.5, t, 0.1);
    // engine & tires for the player's vehicle
    const v = g.player.vehicle;
    if (this.eng && this.tire) {
      if (v && !g.attract && !v.stalled) {
        const a = v.spec.audio;
        const f = a.idle + (a.max - a.idle) * v.rpm;
        const mul = a.tone === "deep" ? 0.5 : a.tone === "diesel" ? 0.55 : a.tone === "sport" ? 1.2 : a.tone === "buzzy" ? 1.1 : 0.8;
        this.eng.o1.frequency.setTargetAtTime(f * mul, t, 0.04);
        this.eng.o2.frequency.setTargetAtTime(f * mul * 0.5, t, 0.04);
        this.eng.f.frequency.setTargetAtTime(300 + v.rpm * 1500 + v.throttleIn * 600, t, 0.05);
        this.eng.g.gain.setTargetAtTime(0.05 + v.throttleIn * 0.06, t, 0.06);
        this.tire.g.gain.setTargetAtTime(clamp(v.slip - 0.3, 0, 1) * 0.22 + v.skid * 0.15, t, 0.05);
      } else {
        this.eng.g.gain.setTargetAtTime(0, t, 0.1);
        this.tire.g.gain.setTargetAtTime(0, t, 0.1);
      }
    }
    // nearest siren
    if (this.siren) {
      let best = Infinity;
      for (const o of g.vehicles) if (o.siren) best = Math.min(best, dist2(o.x, o.z, g.cam.pos.x, g.cam.pos.z));
      const gain = best < 200 ? clamp(1 - best / 200, 0, 1) * 0.12 : 0;
      this.siren.g.gain.setTargetAtTime(gain, t, 0.2);
    }
    // ambience
    if (this.bed) {
      const p = g.playerPos();
      const nearWater = p.z < -330 ? 1 : 0;
      this.bed.g.gain.setTargetAtTime(0.06 + (g.clock.isNight ? -0.02 : 0.02), t, 0.5);
      this.bed.rain.gain.setTargetAtTime(g.weather.rain * 0.12, t, 0.5);
      this.gullT -= dt;
      if (this.gullT <= 0) {
        this.gullT = 3 + this.rng.next() * 7;
        if (nearWater && !g.clock.isNight) { const f0 = 1800 + this.rng.next() * 600; this.tone(t, f0, f0 * 0.6, 0.35, 0.05, "sine", this.rng.range(-0.7, 0.7)); this.tone(t + 0.4, f0 * 0.9, f0 * 0.55, 0.3, 0.04, "sine"); }
        else if (p.z < -380 && this.rng.chance(0.15)) this.tone(t, 110, 105, 2.2, 0.06, "sawtooth", -0.5);
      }
    }
    this.updateRadio(t);
  }

  // ---- generative radio: station 1 electronic harbor beat, station 2 local indie
  private updateRadio(t: number) {
    const g = this.game;
    const st = g.player.vehicle && !g.attract ? g.radioStation : 0;
    if (st === 0 || g.settings.streamerMode) { this.radioNext = t; return; }
    const bpm = st === 1 ? 118 : 96;
    const stepDur = 60 / bpm / 4;
    if (this.radioNext < t) this.radioNext = t + 0.05;
    while (this.radioNext < t + 0.2) {
      this.radioTick(st, this.radioStep, this.radioNext, stepDur);
      this.radioStep++;
      this.radioNext += stepDur;
    }
    if (t > this.radioIdT) {
      this.radioIdT = t + 75;
      const ids = st === 1
        ? ["Tidewave 88.4 — harbor beats for the South Quay night shift.", "Tidewave: no cranes were harmed in the making of this track."]
        : ["Hillside 94.1 — songs written on the Lantern Hill stairs.", "Hillside 94.1. Traffic on the seawall is… well, it's the seawall."];
      g.subtitle(st === 1 ? "Tidewave 88.4" : "Hillside 94.1", ids[this.rng.int(0, ids.length - 1)], 4, "radio");
    }
  }

  private radioTick(st: number, step: number, t: number, sd: number) {
    const m = this.music;
    const bar = Math.floor(step / 16) % 4;
    const s = step % 16;
    if (st === 1) {
      const roots = [55, 65.4, 49, 58.3];
      const r = roots[bar];
      if (s % 4 === 0) this.tone(t, 150, 45, 0.25, 0.5, "sine", 0, m);
      if (s % 4 === 2) this.noiseTone(t, 0.05, 8000, 0.12, m);
      if (s % 8 === 4) this.noiseTone(t, 0.12, 1800, 0.18, m);
      const arp = [1, 1.5, 2, 3, 2, 1.5, 1.2, 2];
      if (s % 2 === 0) this.tone(t, r * 2 * arp[(s / 2) % 8], r * 2 * arp[(s / 2) % 8], sd * 1.8, 0.07, "sawtooth", 0, m);
      if (s === 0) for (const k of [4, 5, 6]) this.tone(t, r * k, r * k, sd * 15, 0.025, "triangle", 0, m);
    } else {
      const chords = [[196, 247, 294], [165, 196, 247], [131, 165, 196], [147, 185, 220]];
      const ch = chords[bar];
      if (s === 0 || s === 6 || s === 10) ch.forEach((f, k) => this.tone(t + k * 0.012, f, f * 0.995, 0.6, 0.06, "sawtooth", 0, m));
      if (s % 8 === 0) this.tone(t, 120, 50, 0.2, 0.4, "sine", 0, m);
      if (s % 8 === 4) this.noiseTone(t, 0.15, 2200, 0.16, m);
      if (s % 2 === 0) this.noiseTone(t, 0.03, 9000, 0.05, m);
      const mel = [392, 440, 494, 440, 392, 330, 294, 330];
      if (s % 4 === 2 && this.rng.chance(0.7)) this.tone(t, mel[(step / 4) % 8 | 0], mel[(step / 4) % 8 | 0], 0.3, 0.05, "triangle", 0, m);
    }
  }

  private noiseTone(t: number, dur: number, freq: number, gain: number, dest: AudioNode) {
    if (this.voices > 56) return;
    const c = this.ctx!;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = freq;
    const g = c.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random()); s.stop(t + dur + 0.02);
    this.voices++; s.onended = () => this.voices--;
  }
}
