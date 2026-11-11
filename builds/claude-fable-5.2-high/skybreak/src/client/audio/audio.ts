// audio: fully synthesised Web Audio. Prioritised spatial one-shots, loops for ambience, and a small generative score.
// No audio files are shipped; every sound is built from oscillators and filtered noise at runtime.
import type { WeaponClass } from "../../shared/content/weapons";
import { clamp } from "../../shared/math";

const MAX_VOICES = 48;

export type MusicMode = "off" | "menu" | "drop" | "tension";

interface Spatial {
  x: number;
  y: number;
  z: number;
  /** Reference distance: louder sounds carry further. */
  ref?: number;
  occluded?: boolean;
}

export class AudioEngine {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfx!: GainNode;
  private musicBus!: GainNode;
  private noise!: AudioBuffer;
  private voices = 0;
  private lx = 0;
  private ly = 0;
  private lz = 0;
  private lyaw = 0;
  private loops = new Map<string, { gain: GainNode; stop: () => void }>();
  private musicMode: MusicMode = "off";
  private musicTimer: number | null = null;
  private nextBar = 0;
  private bar = 0;
  private vol = { master: 0.8, sfx: 0.9, music: 0.5 };
  private hums = new Map<number, { gain: GainNode; pan: StereoPannerNode; stop: () => void }>();

  /** Must be called from a user gesture. Safe to call repeatedly. */
  unlock(): void {
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
      } catch {
        return;
      }
      const c = this.ctx;
      this.master = c.createGain();
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 5;
      this.master.connect(comp);
      comp.connect(c.destination);
      this.sfx = c.createGain();
      this.sfx.connect(this.master);
      this.musicBus = c.createGain();
      this.musicBus.connect(this.master);
      const len = c.sampleRate * 2;
      this.noise = c.createBuffer(1, len, c.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.applyVolumes();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setVolumes(master: number, sfx: number, music: number): void {
    this.vol = { master, sfx, music };
    this.applyVolumes();
  }
  private applyVolumes(): void {
    if (!this.ctx) return;
    this.master.gain.value = this.vol.master;
    this.sfx.gain.value = this.vol.sfx;
    this.musicBus.gain.value = this.vol.music * 0.6;
  }

  setListener(x: number, y: number, z: number, yaw: number): void {
    this.lx = x;
    this.ly = y;
    this.lz = z;
    this.lyaw = yaw;
  }

  // ------------------------------------------------------------------ primitives

  private out(sp: Spatial | undefined, volume: number): { node: AudioNode; dist: number } | null {
    const c = this.ctx;
    if (!c || this.voices >= MAX_VOICES) return null;
    const g = c.createGain();
    let dist = 0;
    if (sp) {
      const dx = sp.x - this.lx,
        dy = sp.y - this.ly,
        dz = sp.z - this.lz;
      dist = Math.hypot(dx, dy, dz);
      const ref = sp.ref ?? 8;
      const att = ref / (ref + dist);
      if (att * volume < 0.004) return null;
      const pan = c.createStereoPanner();
      const rightX = Math.cos(this.lyaw),
        rightZ = -Math.sin(this.lyaw);
      const h = Math.hypot(dx, dz) || 1;
      pan.pan.value = clamp(((dx * rightX + dz * rightZ) / h) * Math.min(1, dist / 3), -1, 1);
      g.gain.value = att * volume * (sp.occluded ? 0.55 : 1);
      g.connect(pan);
      pan.connect(this.sfx);
    } else {
      g.gain.value = volume;
      g.connect(this.sfx);
    }
    return { node: g, dist };
  }

  private track(src: AudioScheduledSourceNode): void {
    this.voices++;
    src.onended = () => {
      this.voices--;
    };
  }

  private noiseBurst(dest: AudioNode, t0: number, dur: number, peak: number, type: BiquadFilterType, freq: number, q = 0.8, freqEnd?: number): void {
    const c = this.ctx!;
    const src = c.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t0);
    if (freqEnd) f.frequency.exponentialRampToValueAtTime(Math.max(30, freqEnd), t0 + dur);
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(dest);
    src.start(t0, Math.random() * 1.5);
    src.stop(t0 + dur + 0.02);
    this.track(src);
  }

  private tone(dest: AudioNode, t0: number, dur: number, peak: number, type: OscillatorType, f0: number, f1?: number, attack = 0.004): void {
    const c = this.ctx!;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t0);
    if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(dest);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
    this.track(o);
  }

  // ------------------------------------------------------------------ one-shots

  gunshot(cls: WeaponClass, sp: Spatial, own: boolean): void {
    const o = this.out({ ...sp, ref: sp.ref ?? 26 }, own ? 0.5 : 0.75);
    if (!o) return;
    const c = this.ctx!;
    const t = c.currentTime;
    // distance shapes the report: nearby = crack + mechanics, far = dull thump with a tail
    const far = clamp(o.dist / 160, 0, 1);
    let dest: AudioNode = o.node;
    if (far > 0.15 || sp.occluded) {
      const lp = c.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = (sp.occluded ? 1400 : 9000) * (1 - far * 0.85);
      lp.connect(o.node);
      dest = lp;
    }
    const v = 1 + (Math.random() - 0.5) * 0.08;
    switch (cls) {
      case "pistol":
        this.noiseBurst(dest, t, 0.09, 0.8, "bandpass", 2400 * v, 0.7, 700);
        this.tone(dest, t, 0.08, 0.6, "triangle", 260 * v, 90);
        break;
      case "smg":
        this.noiseBurst(dest, t, 0.06, 0.6, "bandpass", 3200 * v, 0.8, 1200);
        this.tone(dest, t, 0.05, 0.4, "square", 420 * v, 160);
        break;
      case "carbine":
        this.noiseBurst(dest, t, 0.08, 0.7, "bandpass", 2600 * v, 0.9, 800);
        this.tone(dest, t, 0.07, 0.55, "sawtooth", 300 * v, 110);
        break;
      case "rifle":
        this.noiseBurst(dest, t, 0.11, 0.8, "bandpass", 1900 * v, 0.7, 500);
        this.tone(dest, t, 0.1, 0.7, "triangle", 210 * v, 70);
        break;
      case "shotgun":
        this.noiseBurst(dest, t, 0.22, 1.0, "lowpass", 2600 * v, 0.5, 300);
        this.tone(dest, t, 0.18, 0.9, "sine", 150 * v, 45);
        this.tone(dest, t + 0.16, 0.05, 0.2, "square", 700, 500);
        break;
      case "dmr":
        this.noiseBurst(dest, t, 0.14, 0.9, "bandpass", 1500 * v, 0.6, 350);
        this.tone(dest, t, 0.14, 0.8, "triangle", 180 * v, 55);
        this.tone(dest, t, 0.05, 0.3, "sine", 1800, 900);
        break;
      case "rail":
        this.tone(dest, t, 0.28, 0.7, "sawtooth", 1400 * v, 120);
        this.noiseBurst(dest, t, 0.2, 0.7, "highpass", 2200, 0.7);
        this.tone(dest, t, 0.25, 0.8, "sine", 110, 40);
        break;
      default:
        this.tone(dest, t, 0.22, 0.8, "sine", 240 * v, 70);
        this.noiseBurst(dest, t, 0.18, 0.4, "lowpass", 900, 0.6, 250);
    }
    if (far > 0.25) this.noiseBurst(dest, t + 0.05 + far * 0.1, 0.45 + far * 0.4, 0.22, "lowpass", 600, 0.4, 180);
  }

  farGunfire(sp: Spatial): void {
    const o = this.out({ ...sp, ref: 60 }, 0.5);
    if (!o) return;
    const t = this.ctx!.currentTime;
    this.noiseBurst(o.node, t, 0.5, 0.5, "lowpass", 420, 0.5, 140);
    this.tone(o.node, t, 0.3, 0.35, "sine", 95, 45);
  }

  footstep(sp: Spatial | undefined, surface: number, loud: number): void {
    const o = this.out(sp ? { ...sp, ref: 4.5 } : undefined, 0.22 * loud);
    if (!o) return;
    const t = this.ctx!.currentTime;
    const f = surface === 2 ? 1700 : surface === 1 ? 520 : surface === 4 ? 2600 : 820;
    this.noiseBurst(o.node, t, surface === 4 ? 0.14 : 0.055, 0.9, "bandpass", f * (0.9 + Math.random() * 0.2), surface === 2 ? 2.5 : 1.1);
    if (surface === 1 || surface === 2) this.tone(o.node, t, 0.05, 0.3, "sine", surface === 2 ? 240 : 130, 70);
  }

  simple(kind: string, sp?: Spatial, vol = 1): void {
    const refs: Record<string, number> = { explode: 22, vent: 12, capsule: 30, chestOpen: 7, charge: 14, splash: 9, land: 6, landHard: 8 };
    const o = this.out(sp ? { ...sp, ref: sp.ref ?? refs[kind] ?? 6 } : undefined, vol);
    if (!o) return;
    const c = this.ctx!;
    const t = c.currentTime;
    const d = o.node;
    switch (kind) {
      case "reload":
        this.noiseBurst(d, t, 0.03, 0.5, "bandpass", 2600, 3);
        this.noiseBurst(d, t + 0.22, 0.04, 0.6, "bandpass", 1700, 3);
        this.tone(d, t + 0.22, 0.04, 0.2, "square", 300, 200);
        break;
      case "shell":
        this.noiseBurst(d, t, 0.035, 0.5, "bandpass", 2100, 4);
        this.tone(d, t, 0.03, 0.15, "square", 480, 300);
        break;
      case "dry":
        this.noiseBurst(d, t, 0.02, 0.4, "highpass", 3000, 1);
        break;
      case "melee":
        this.noiseBurst(d, t, 0.12, 0.5, "bandpass", 900, 0.8, 2400);
        break;
      case "throw":
        this.noiseBurst(d, t, 0.14, 0.35, "bandpass", 700, 0.9, 1800);
        break;
      case "jump":
        this.noiseBurst(d, t, 0.07, 0.25, "bandpass", 500, 1, 900);
        break;
      case "land":
        this.noiseBurst(d, t, 0.09, 0.5, "lowpass", 700, 0.6, 200);
        this.tone(d, t, 0.08, 0.35, "sine", 110, 55);
        break;
      case "landHard":
        this.noiseBurst(d, t, 0.2, 0.9, "lowpass", 900, 0.6, 160);
        this.tone(d, t, 0.18, 0.8, "sine", 90, 38);
        break;
      case "slide":
        this.noiseBurst(d, t, 0.5, 0.4, "bandpass", 1300, 0.6, 500);
        break;
      case "mantle":
        this.noiseBurst(d, t, 0.16, 0.3, "bandpass", 600, 0.9, 300);
        break;
      case "splash":
        this.noiseBurst(d, t, 0.4, 0.7, "bandpass", 1400, 0.5, 500);
        this.noiseBurst(d, t + 0.05, 0.3, 0.4, "highpass", 3200, 0.5);
        break;
      case "vent":
        this.noiseBurst(d, t, 0.8, 0.7, "bandpass", 300, 0.8, 2400);
        this.tone(d, t, 0.6, 0.3, "sine", 180, 620);
        break;
      case "deploy":
        this.noiseBurst(d, t, 0.3, 0.6, "bandpass", 1600, 0.6, 400);
        this.tone(d, t, 0.2, 0.25, "triangle", 300, 480);
        break;
      case "zip":
        this.tone(d, t, 0.25, 0.3, "sawtooth", 500, 780);
        this.noiseBurst(d, t, 0.2, 0.3, "bandpass", 2400, 2);
        break;
      case "grapple":
        this.tone(d, t, 0.18, 0.5, "square", 900, 300);
        this.noiseBurst(d, t, 0.25, 0.4, "bandpass", 3000, 1.5, 900);
        break;
      case "chestOpen":
        [0, 0.07, 0.14, 0.22].forEach((dt, i) => this.tone(d, t + dt, 0.35, 0.35, "triangle", [523, 659, 784, 1047][i]!));
        this.noiseBurst(d, t, 0.2, 0.3, "bandpass", 1200, 1);
        break;
      case "locker":
        this.noiseBurst(d, t, 0.1, 0.6, "bandpass", 1500, 2);
        this.tone(d, t, 0.12, 0.3, "square", 220, 140);
        break;
      case "drop":
        this.noiseBurst(d, t, 0.06, 0.3, "lowpass", 600, 0.7);
        break;
      case "heal":
        this.tone(d, t, 0.6, 0.25, "sine", 330, 660, 0.1);
        this.noiseBurst(d, t, 0.25, 0.15, "highpass", 4000, 0.5);
        break;
      case "shieldUse":
        this.tone(d, t, 0.7, 0.22, "triangle", 620, 1240, 0.15);
        this.tone(d, t + 0.1, 0.6, 0.12, "sine", 930, 1860, 0.15);
        break;
      case "beacon":
        this.tone(d, t, 0.9, 0.4, "sine", 880, 220, 0.02);
        this.tone(d, t + 0.25, 0.9, 0.25, "sine", 660, 165, 0.02);
        break;
      case "charge":
        this.tone(d, t, 0.6, 0.5, "sawtooth", 220, 1500, 0.3);
        this.tone(d, t, 0.6, 0.25, "sine", 440, 3000, 0.3);
        break;
      case "explode":
        this.tone(d, t, 0.4, 1.0, "sine", 130, 36);
        this.noiseBurst(d, t, 0.5, 0.8, "lowpass", 1800, 0.5, 200);
        this.noiseBurst(d, t, 0.25, 0.4, "bandpass", 600, 0.8, 2600);
        break;
      case "mist":
        this.noiseBurst(d, t, 1.4, 0.5, "highpass", 2400, 0.4);
        break;
      case "capsule":
        this.tone(d, t, 0.5, 0.9, "sine", 80, 34);
        this.noiseBurst(d, t, 0.6, 0.8, "lowpass", 1200, 0.5, 150);
        this.tone(d, t + 0.1, 0.8, 0.3, "triangle", 880, 440);
        break;
      default:
        break;
    }
  }

  /** Non-spatial interface and feedback cues. */
  ui(kind: string): void {
    const c = this.ctx;
    if (!c) return;
    const o = this.out(undefined, 0.5);
    if (!o) return;
    const t = c.currentTime;
    const d = o.node;
    switch (kind) {
      case "click": this.tone(d, t, 0.06, 0.4, "triangle", 720, 540); break;
      case "hover": this.tone(d, t, 0.03, 0.15, "sine", 900); break;
      case "back": this.tone(d, t, 0.08, 0.35, "triangle", 420, 300); break;
      case "hit": this.tone(d, t, 0.045, 0.5, "square", 920, 700); break;
      case "hitShield": this.tone(d, t, 0.07, 0.5, "triangle", 1500, 1900); break;
      case "hitHead":
        this.tone(d, t, 0.12, 0.6, "sine", 2100, 1900);
        this.tone(d, t, 0.05, 0.35, "square", 1050);
        break;
      case "shieldBreak":
        this.noiseBurst(d, t, 0.3, 0.6, "highpass", 3500, 0.6);
        this.tone(d, t, 0.3, 0.5, "triangle", 1800, 300);
        break;
      case "elim":
        this.tone(d, t, 0.14, 0.5, "triangle", 660);
        this.tone(d, t + 0.1, 0.3, 0.6, "triangle", 990);
        break;
      case "hurt":
        this.tone(d, t, 0.12, 0.7, "sine", 150, 70);
        this.noiseBurst(d, t, 0.06, 0.4, "lowpass", 800, 0.6);
        break;
      case "hurtShield": this.tone(d, t, 0.1, 0.5, "triangle", 700, 500); break;
      case "ownShieldBreak":
        this.tone(d, t, 0.4, 0.7, "sawtooth", 900, 110);
        this.noiseBurst(d, t, 0.3, 0.5, "highpass", 2800, 0.5);
        break;
      case "aegis": this.tone(d, t, 0.5, 0.25, "sine", 440, 880, 0.2); break;
      case "pickup": this.tone(d, t, 0.08, 0.4, "triangle", 880, 1320); break;
      case "pickupRare":
        [0, 0.06, 0.12].forEach((dt, i) => this.tone(d, t + dt, 0.2, 0.4, "triangle", [880, 1175, 1568][i]!));
        break;
      case "pickupEpic":
        [0, 0.06, 0.12, 0.2].forEach((dt, i) => this.tone(d, t + dt, 0.3, 0.45, "triangle", [784, 1047, 1319, 2093][i]!));
        break;
      case "deny": this.tone(d, t, 0.12, 0.4, "square", 200, 150); break;
      case "swap": this.tone(d, t, 0.04, 0.25, "square", 500, 650); break;
      case "marker": this.tone(d, t, 0.15, 0.4, "sine", 1200, 1500); break;
      case "tick": this.tone(d, t, 0.05, 0.35, "square", 1000); break;
      case "stormWarn":
        this.tone(d, t, 0.9, 0.5, "sawtooth", 196, 185, 0.1);
        this.tone(d, t + 0.02, 0.9, 0.4, "sawtooth", 294, 277, 0.1);
        break;
      case "stormMove":
        this.tone(d, t, 1.4, 0.55, "sawtooth", 147, 110, 0.2);
        this.tone(d, t, 1.4, 0.4, "sawtooth", 220, 165, 0.2);
        this.noiseBurst(d, t, 1.4, 0.3, "bandpass", 500, 0.6, 1500);
        break;
      case "final":
        this.tone(d, t, 2.0, 0.6, "sawtooth", 98, 73, 0.3);
        this.tone(d, t, 2.0, 0.5, "sawtooth", 147, 110, 0.3);
        break;
      case "ping":
        this.tone(d, t, 0.6, 0.5, "sine", 1320, 1310);
        this.tone(d, t + 0.18, 0.6, 0.35, "sine", 1760, 1750);
        break;
      case "victory":
        [0, 0.14, 0.28, 0.42, 0.7].forEach((dt, i) => this.tone(d, t + dt, i === 4 ? 1.4 : 0.35, 0.5, "triangle", [523, 659, 784, 1047, 1319][i]!));
        [0, 0.7].forEach((dt, i) => this.tone(d, t + dt, 1.2, 0.25, "sawtooth", [131, 196][i]!));
        break;
      case "defeat":
        [0, 0.22, 0.44].forEach((dt, i) => this.tone(d, t + dt, i === 2 ? 1.2 : 0.4, 0.45, "triangle", [392, 330, 262][i]!));
        break;
      case "board":
        this.tone(d, t, 0.5, 0.4, "sine", 330, 660, 0.1);
        break;
      default:
        break;
    }
  }

  // ------------------------------------------------------------------ loops

  /** Continuous filtered-noise / tone loop whose level is driven every frame. */
  loop(name: string, level: number, kind: "wind" | "storm" | "zip" | "drone" | "heat" = "wind"): void {
    const c = this.ctx;
    if (!c) return;
    let l = this.loops.get(name);
    if (!l) {
      if (level <= 0.001) return;
      const g = c.createGain();
      g.gain.value = 0;
      g.connect(this.sfx);
      const stops: (() => void)[] = [];
      if (kind === "zip" || kind === "drone") {
        const o = c.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = kind === "zip" ? 310 : 74;
        const f = c.createBiquadFilter();
        f.type = "lowpass";
        f.frequency.value = kind === "zip" ? 1400 : 420;
        const lfo = c.createOscillator();
        lfo.frequency.value = kind === "zip" ? 17 : 5;
        const lg = c.createGain();
        lg.gain.value = kind === "zip" ? 30 : 6;
        lfo.connect(lg);
        lg.connect(o.frequency);
        o.connect(f);
        f.connect(g);
        o.start();
        lfo.start();
        stops.push(() => o.stop(), () => lfo.stop());
      } else {
        const src = c.createBufferSource();
        src.buffer = this.noise;
        src.loop = true;
        const f = c.createBiquadFilter();
        f.type = kind === "storm" ? "lowpass" : "bandpass";
        f.frequency.value = kind === "storm" ? 420 : kind === "heat" ? 220 : 900;
        f.Q.value = kind === "storm" ? 0.4 : 0.5;
        src.connect(f);
        f.connect(g);
        src.start();
        stops.push(() => src.stop());
        if (kind === "storm") {
          const o = c.createOscillator();
          o.type = "sine";
          o.frequency.value = 58;
          const og = c.createGain();
          og.gain.value = 0.5;
          o.connect(og);
          og.connect(g);
          o.start();
          stops.push(() => o.stop());
        }
      }
      l = { gain: g, stop: () => stops.forEach((s) => s()) };
      this.loops.set(name, l);
    }
    l.gain.gain.setTargetAtTime(level, c.currentTime, 0.12);
  }

  /** Resonance chest hums: at most three, nearest first. */
  setHums(list: { id: number; x: number; y: number; z: number }[]): void {
    const c = this.ctx;
    if (!c) return;
    const keep = new Set<number>();
    for (const h of list.slice(0, 3)) {
      keep.add(h.id);
      let v = this.hums.get(h.id);
      if (!v) {
        const g = c.createGain();
        g.gain.value = 0;
        const pan = c.createStereoPanner();
        g.connect(pan);
        pan.connect(this.sfx);
        const o1 = c.createOscillator();
        o1.type = "sine";
        o1.frequency.value = 311;
        const o2 = c.createOscillator();
        o2.type = "triangle";
        o2.frequency.value = 466.5;
        const trem = c.createOscillator();
        trem.frequency.value = 5.5;
        const tg = c.createGain();
        tg.gain.value = 0.35;
        const mix = c.createGain();
        mix.gain.value = 0.6;
        trem.connect(tg);
        tg.connect(mix.gain);
        o1.connect(mix);
        o2.connect(mix);
        mix.connect(g);
        o1.start();
        o2.start();
        trem.start();
        v = { gain: g, pan, stop: () => { o1.stop(); o2.stop(); trem.stop(); } };
        this.hums.set(h.id, v);
      }
      const dx = h.x - this.lx,
        dy = h.y - this.ly,
        dz = h.z - this.lz;
      const d = Math.hypot(dx, dy, dz);
      const level = d > 15 ? 0 : 0.1 * (1 - d / 15) * (1 - d / 15);
      v.gain.gain.setTargetAtTime(level, c.currentTime, 0.1);
      const hd = Math.hypot(dx, dz) || 1;
      v.pan.pan.setTargetAtTime(clamp((dx * Math.cos(this.lyaw) - dz * Math.sin(this.lyaw)) / hd, -1, 1) * Math.min(1, d / 3), c.currentTime, 0.1);
    }
    for (const [id, v] of this.hums) {
      if (!keep.has(id)) {
        v.gain.gain.setTargetAtTime(0, c.currentTime, 0.05);
        const stop = v.stop;
        window.setTimeout(stop, 300);
        this.hums.delete(id);
      }
    }
  }

  stopAllLoops(): void {
    for (const l of this.loops.values()) {
      l.gain.gain.value = 0;
      try {
        l.stop();
      } catch {
        /* already stopped */
      }
    }
    this.loops.clear();
    this.setHums([]);
  }

  // ------------------------------------------------------------------ music

  setMusic(mode: MusicMode): void {
    if (mode === this.musicMode) return;
    this.musicMode = mode;
    if (!this.ctx) return;
    this.nextBar = this.ctx.currentTime + 0.1;
    if (this.musicTimer === null) this.musicTimer = window.setInterval(() => this.scheduleMusic(), 200);
  }

  private pad(t: number, dur: number, freq: number, vol: number): void {
    const c = this.ctx!;
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 900;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + dur * 0.35);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    f.connect(g);
    g.connect(this.musicBus);
    for (const det of [-5, 6]) {
      const o = c.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = freq;
      o.detune.value = det;
      o.connect(f);
      o.start(t);
      o.stop(t + dur + 0.05);
    }
  }

  private pluck(t: number, freq: number, vol: number, dur = 0.5): void {
    const c = this.ctx!;
    const o = c.createOscillator();
    o.type = "triangle";
    o.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.musicBus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private scheduleMusic(): void {
    const c = this.ctx;
    if (!c || this.musicMode === "off") return;
    // original progression: Am9 - Fmaj7 - C6 - Gsus (in Hz), with a pentatonic lead
    const chords = [[110, 164.8, 261.6, 329.6], [87.3, 174.6, 220, 329.6], [130.8, 196, 261.6, 440], [98, 146.8, 261.6, 392]];
    const penta = [440, 523.3, 587.3, 659.3, 784, 880, 1046.5];
    while (this.nextBar < c.currentTime + 0.6) {
      const t = this.nextBar;
      const chord = chords[this.bar % chords.length]!;
      if (this.musicMode === "tension") {
        const barLen = 2.0;
        for (let i = 0; i < 4; i++) {
          const tt = t + i * 0.5;
          const o = c.createOscillator();
          o.type = "sine";
          o.frequency.setValueAtTime(i === 0 ? 62 : 55, tt);
          o.frequency.exponentialRampToValueAtTime(40, tt + 0.25);
          const g = c.createGain();
          g.gain.setValueAtTime(0.0001, tt);
          g.gain.exponentialRampToValueAtTime(i === 0 ? 0.5 : 0.28, tt + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.3);
          o.connect(g);
          g.connect(this.musicBus);
          o.start(tt);
          o.stop(tt + 0.35);
        }
        if (this.bar % 2 === 0) this.pad(t, barLen * 2, chords[0]![0]! * 2, 0.03);
        if (this.bar % 4 === 3) this.pluck(t + 1.5, 659.3, 0.06, 0.8);
        this.nextBar += barLen;
      } else {
        const barLen = this.musicMode === "drop" ? 2.4 : 3.6;
        for (const f of chord) this.pad(t, barLen * 1.08, f, this.musicMode === "drop" ? 0.035 : 0.045);
        const steps = this.musicMode === "drop" ? 8 : 6;
        for (let i = 0; i < steps; i++) {
          if (this.musicMode === "menu" && (i === 1 || i === 4) && this.bar % 2 === 1) continue;
          const idx = (this.bar * 3 + i * (this.bar % 2 === 0 ? 2 : 3)) % penta.length;
          this.pluck(t + (i * barLen) / steps, penta[idx]! * (this.musicMode === "drop" ? 1 : 0.5), 0.07, this.musicMode === "drop" ? 0.35 : 0.7);
        }
        this.pluck(t, chord[0]!, 0.1, barLen * 0.8);
        this.nextBar += barLen;
      }
      this.bar++;
    }
  }
}

export const audio = new AudioEngine();
