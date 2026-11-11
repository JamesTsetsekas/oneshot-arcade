// Procedural WebAudio: every sound is synthesized at runtime (no samples).
// HRTF panning, occlusion low-pass, priority voice cap, and readable Cipher beeps.

import type { Vec3 } from '../sim/math';

type Occluder = (a: Vec3, b: Vec3) => boolean;

interface WeaponVoice {
  freq: number;
  q: number;
  thump: number;
  decay: number;
  gain: number;
  tail: number;
}

const WEAPON_VOICE: Record<string, WeaponVoice> = {
  vela: { freq: 1900, q: 0.9, thump: 140, decay: 0.09, gain: 0.7, tail: 0.25 },
  rook: { freq: 900, q: 0.7, thump: 80, decay: 0.16, gain: 1.0, tail: 0.5 },
  needle: { freq: 2300, q: 1.1, thump: 160, decay: 0.07, gain: 0.55, tail: 0.18 },
  kite: { freq: 2000, q: 1.0, thump: 130, decay: 0.08, gain: 0.6, tail: 0.25 },
  vectora: { freq: 2600, q: 1.2, thump: 150, decay: 0.07, gain: 0.6, tail: 0.22 },
  aster: { freq: 1400, q: 0.8, thump: 95, decay: 0.12, gain: 0.85, tail: 0.45 },
  krait: { freq: 1050, q: 0.7, thump: 80, decay: 0.14, gain: 0.95, tail: 0.55 },
  lumen: { freq: 1650, q: 0.9, thump: 110, decay: 0.1, gain: 0.8, tail: 0.4 },
  longglass: { freq: 700, q: 0.6, thump: 60, decay: 0.25, gain: 1.15, tail: 0.9 },
  sable: { freq: 950, q: 0.7, thump: 75, decay: 0.18, gain: 1.0, tail: 0.6 },
  rampart: { freq: 600, q: 0.5, thump: 65, decay: 0.2, gain: 1.1, tail: 0.6 },
  atlas: { freq: 1150, q: 0.7, thump: 85, decay: 0.13, gain: 0.9, tail: 0.5 },
  frag: { freq: 300, q: 0.4, thump: 45, decay: 0.5, gain: 1.4, tail: 1.4 },
};

const STEP_TONE: Record<string, [number, number]> = {
  concrete: [1100, 1.2],
  metal: [2600, 6],
  tile: [1800, 2.5],
  gravel: [700, 0.7],
  glass: [3200, 4],
  soil: [500, 0.8],
};

export class AudioEngine {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfx!: GainNode;
  private music!: GainNode;
  private noise!: AudioBuffer;
  private listenerPos: Vec3 = { x: 0, y: 0, z: 0 };
  private voices = 0;
  private readonly maxVoices = 48;
  occluder: Occluder | null = null;
  private musicNodes: AudioNode[] = [];
  private musicTimer: number | null = null;
  private ringGain: GainNode | null = null;

  init(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    try {
      this.ctx = new AudioContext();
    } catch {
      this.ctx = null;
      return;
    }
    const c = this.ctx;
    this.master = c.createGain();
    this.master.connect(c.destination);
    this.sfx = c.createGain();
    this.sfx.connect(this.master);
    this.music = c.createGain();
    this.music.connect(this.master);
    const len = c.sampleRate * 2;
    this.noise = c.createBuffer(1, len, c.sampleRate);
    const d = this.noise.getChannelData(0);
    let s = 12345;
    for (let i = 0; i < len; i++) {
      s = (s * 1103515245 + 12345) >>> 0;
      d[i] = (s / 4294967296) * 2 - 1;
    }
  }

  setVolumes(master: number, sfx: number, music: number): void {
    if (!this.ctx) return;
    this.master.gain.value = master;
    this.sfx.gain.value = sfx;
    this.music.gain.value = music * 0.6;
  }

  setListener(pos: Vec3, yaw: number, pitch: number): void {
    if (!this.ctx) return;
    this.listenerPos = pos;
    const l = this.ctx.listener;
    const fx = Math.sin(yaw) * Math.cos(pitch);
    const fy = -Math.sin(pitch);
    const fz = Math.cos(yaw) * Math.cos(pitch);
    // WebAudio is right-handed; mirror Z so +X stays on the right ear
    if (l.positionX) {
      l.positionX.value = pos.x;
      l.positionY.value = pos.y;
      l.positionZ.value = -pos.z;
      l.forwardX.value = fx;
      l.forwardY.value = fy;
      l.forwardZ.value = -fz;
      l.upX.value = 0;
      l.upY.value = 1;
      l.upZ.value = 0;
    } else {
      l.setPosition(pos.x, pos.y, -pos.z);
      l.setOrientation(fx, fy, -fz, 0, 1, 0);
    }
  }

  /** Create an output chain: optional 3D panner + occlusion filter. */
  private out(pos: Vec3 | null, gain: number, priority = 1): { node: AudioNode; release: () => void } | null {
    const c = this.ctx;
    if (!c) return null;
    if (this.voices >= this.maxVoices && priority < 2) return null;
    this.voices++;
    const g = c.createGain();
    g.gain.value = gain;
    let head: AudioNode = g;
    if (pos) {
      const p = c.createPanner();
      p.panningModel = 'HRTF';
      p.distanceModel = 'inverse';
      p.refDistance = 2.5;
      p.rolloffFactor = 1.1;
      p.maxDistance = 120;
      p.positionX.value = pos.x;
      p.positionY.value = pos.y;
      p.positionZ.value = -pos.z;
      g.connect(p);
      const occluded = this.occluder ? this.occluder(this.listenerPos, pos) : false;
      if (occluded) {
        const lp = c.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 750;
        const og = c.createGain();
        og.gain.value = 0.55;
        p.connect(lp).connect(og).connect(this.sfx);
      } else p.connect(this.sfx);
      head = g;
    } else g.connect(this.sfx);
    return {
      node: head,
      release: () => {
        this.voices = Math.max(0, this.voices - 1);
      },
    };
  }

  private noiseBurst(dest: AudioNode, t: number, dur: number, type: BiquadFilterType, freq: number, q: number, gain: number, attack = 0.002): void {
    const c = this.ctx!;
    const src = c.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(dest);
    src.start(t, Math.random() * 1.5);
    src.stop(t + dur + 0.05);
  }

  private tone(dest: AudioNode, t: number, dur: number, f0: number, f1: number, gain: number, type: OscillatorType = 'sine'): void {
    const c = this.ctx!;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private done(o: { release: () => void }, ms: number): void {
    setTimeout(o.release, ms);
  }

  gunshot(weapon: string, pos: Vec3 | null, local: boolean): void {
    const v = WEAPON_VOICE[weapon] ?? WEAPON_VOICE.aster;
    const dist = pos ? Math.hypot(pos.x - this.listenerPos.x, pos.y - this.listenerPos.y, pos.z - this.listenerPos.z) : 0;
    const o = this.out(local ? null : pos, (local ? 0.55 : 1.1) * v.gain, 2);
    if (!o) return;
    const t = this.ctx!.currentTime;
    const far = dist > 30;
    this.noiseBurst(o.node, t, v.decay, 'bandpass', far ? v.freq * 0.5 : v.freq, v.q, 0.9);
    this.noiseBurst(o.node, t, v.decay * 0.6, 'highpass', 3500, 0.7, far ? 0.05 : 0.35);
    this.tone(o.node, t, v.decay * 1.4, v.thump * 2, v.thump * 0.6, far ? 0.35 : 0.8);
    // tail / room
    this.noiseBurst(o.node, t + 0.01, v.tail * (far ? 1.6 : 1), 'lowpass', far ? 600 : 1300, 0.5, 0.12, 0.03);
    // mechanical click
    if (local) this.noiseBurst(o.node, t + 0.03, 0.025, 'highpass', 5000, 2, 0.12);
    this.done(o, 1600);
  }

  step(pos: Vec3, mat: string, soft: boolean): void {
    const o = this.out(pos, soft ? 0.12 : 0.6, 1);
    if (!o) return;
    const [f, q] = STEP_TONE[mat] ?? STEP_TONE.concrete;
    const t = this.ctx!.currentTime;
    this.noiseBurst(o.node, t, 0.06, 'bandpass', f * (0.9 + Math.random() * 0.2), q, 0.8);
    this.noiseBurst(o.node, t, 0.05, 'lowpass', 300, 0.7, 0.5);
    if (mat === 'metal') this.tone(o.node, t, 0.12, 1800 + Math.random() * 400, 1500, 0.08, 'triangle');
    this.done(o, 300);
  }

  land(pos: Vec3, mat: string): void {
    const o = this.out(pos, 0.8, 1);
    if (!o) return;
    const t = this.ctx!.currentTime;
    const [f, q] = STEP_TONE[mat] ?? STEP_TONE.concrete;
    this.noiseBurst(o.node, t, 0.12, 'bandpass', f * 0.8, q, 0.9);
    this.tone(o.node, t, 0.15, 110, 50, 0.6);
    this.done(o, 400);
  }

  click(pos: Vec3 | null, kind: 'reload' | 'empty' | 'pin' | 'scope' | 'pickup' | 'drop' | 'melee'): void {
    const o = this.out(pos, kind === 'melee' ? 0.5 : 0.45, 1);
    if (!o) return;
    const t = this.ctx!.currentTime;
    switch (kind) {
      case 'reload':
        this.noiseBurst(o.node, t, 0.03, 'bandpass', 2400, 3, 0.7);
        this.noiseBurst(o.node, t + 0.35, 0.04, 'bandpass', 1700, 3, 0.8);
        this.tone(o.node, t + 0.36, 0.05, 900, 600, 0.2, 'square');
        break;
      case 'empty':
        this.noiseBurst(o.node, t, 0.02, 'highpass', 4000, 2, 0.6);
        break;
      case 'pin':
        this.noiseBurst(o.node, t, 0.03, 'bandpass', 3000, 4, 0.6);
        this.tone(o.node, t + 0.02, 0.3, 3400, 3200, 0.08, 'triangle');
        break;
      case 'scope':
        this.tone(o.node, t, 0.06, 600, 300, 0.3, 'square');
        break;
      case 'pickup':
      case 'drop':
        this.noiseBurst(o.node, t, 0.08, 'bandpass', 900, 1.5, 0.7);
        this.tone(o.node, t, 0.1, 400, 200, 0.2, 'triangle');
        break;
      case 'melee':
        this.noiseBurst(o.node, t, 0.12, 'bandpass', 2800, 1.2, 0.5, 0.02);
        break;
    }
    this.done(o, 800);
  }

  bounce(pos: Vec3, mat: string): void {
    const o = this.out(pos, 0.5, 1);
    if (!o) return;
    const t = this.ctx!.currentTime;
    if (mat === 'metal' || mat === 'container' || mat === 'turbine' || mat === 'rail') this.tone(o.node, t, 0.25, 2400 + Math.random() * 800, 2000, 0.3, 'triangle');
    else if (mat === 'glass') this.tone(o.node, t, 0.18, 4200, 4000, 0.25, 'sine');
    else this.noiseBurst(o.node, t, 0.06, 'bandpass', 700, 1.5, 0.8);
    this.done(o, 400);
  }

  explosion(pos: Vec3, big: boolean): void {
    const o = this.out(pos, big ? 2.2 : 1.5, 3);
    if (!o) return;
    const t = this.ctx!.currentTime;
    this.noiseBurst(o.node, t, big ? 2.4 : 1.2, 'lowpass', big ? 900 : 1500, 0.6, 1.0, 0.004);
    this.tone(o.node, t, big ? 1.6 : 0.8, 90, 28, 1.0);
    this.noiseBurst(o.node, t, 0.15, 'highpass', 2500, 0.6, 0.5);
    this.done(o, 2600);
  }

  flashbang(pos: Vec3): void {
    const o = this.out(pos, 1.3, 3);
    if (!o) return;
    const t = this.ctx!.currentTime;
    this.noiseBurst(o.node, t, 0.35, 'highpass', 1800, 0.6, 1.0, 0.001);
    this.tone(o.node, t, 0.25, 160, 60, 0.6);
    this.done(o, 600);
  }

  /** tinnitus for a blinded listener */
  ring(duration: number, amount: number): void {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator();
    o.frequency.value = 3600;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.08 * amount, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    o.connect(g).connect(this.sfx);
    o.start(t);
    o.stop(t + duration + 0.1);
    // muffle the world during the ring
    this.sfx.gain.cancelScheduledValues(t);
    const base = this.sfx.gain.value || 1;
    this.sfx.gain.setValueAtTime(base * 0.35, t);
    this.sfx.gain.linearRampToValueAtTime(base, t + duration * 0.9);
    this.ringGain = g;
  }

  smokeBloom(pos: Vec3): void {
    const o = this.out(pos, 0.6, 2);
    if (!o) return;
    const t = this.ctx!.currentTime;
    this.noiseBurst(o.node, t, 2.2, 'bandpass', 2500, 0.5, 0.7, 0.08);
    this.noiseBurst(o.node, t, 0.2, 'lowpass', 400, 0.7, 0.6);
    this.done(o, 2500);
  }

  ignite(pos: Vec3): void {
    const o = this.out(pos, 0.8, 2);
    if (!o) return;
    const t = this.ctx!.currentTime;
    this.noiseBurst(o.node, t, 0.5, 'bandpass', 900, 0.5, 0.9, 0.01);
    for (let i = 0; i < 14; i++) this.noiseBurst(o.node, t + 0.2 + i * 0.45 + Math.random() * 0.3, 0.06, 'bandpass', 1500 + Math.random() * 2000, 2, 0.35);
    this.done(o, 7200);
  }

  ping(pos: Vec3): void {
    const o = this.out(pos, 0.7, 2);
    if (!o) return;
    const t = this.ctx!.currentTime;
    this.tone(o.node, t, 0.5, 820, 1500, 0.5, 'sine');
    this.tone(o.node, t + 0.08, 0.6, 1640, 2200, 0.18, 'triangle');
    this.done(o, 900);
  }

  spikeBeep(pos: Vec3, urgent: boolean): void {
    const o = this.out(pos, urgent ? 0.9 : 0.7, 3);
    if (!o) return;
    const t = this.ctx!.currentTime;
    this.tone(o.node, t, 0.09, urgent ? 2100 : 1760, urgent ? 2100 : 1760, 0.6, 'square');
    this.done(o, 300);
  }

  armTone(pos: Vec3, defuse: boolean): void {
    const o = this.out(pos, 0.5, 2);
    if (!o) return;
    const t = this.ctx!.currentTime;
    if (defuse) {
      for (let i = 0; i < 3; i++) this.tone(o.node, t + i * 0.12, 0.08, 900 - i * 120, 800 - i * 120, 0.4, 'square');
    } else {
      for (let i = 0; i < 4; i++) this.tone(o.node, t + i * 0.1, 0.07, 1100 + i * 180, 1100 + i * 180, 0.35, 'square');
    }
    this.done(o, 700);
  }

  // UI / feedback (non-positional)
  hitmarker(head: boolean, kill: boolean): void {
    const o = this.out(null, 0.35, 2);
    if (!o) return;
    const t = this.ctx!.currentTime;
    if (kill) {
      this.tone(o.node, t, 0.12, 880, 880, 0.4, 'triangle');
      this.tone(o.node, t + 0.08, 0.2, 1320, 1320, 0.4, 'triangle');
    } else this.tone(o.node, t, head ? 0.12 : 0.05, head ? 2600 : 1500, head ? 2500 : 1400, head ? 0.5 : 0.3, head ? 'sine' : 'triangle');
    this.done(o, 500);
  }

  hurt(): void {
    const o = this.out(null, 0.5, 2);
    if (!o) return;
    const t = this.ctx!.currentTime;
    this.noiseBurst(o.node, t, 0.12, 'lowpass', 500, 0.7, 0.9);
    this.tone(o.node, t, 0.15, 140, 70, 0.4);
    this.done(o, 400);
  }

  ui(kind: 'buy' | 'deny' | 'tick' | 'round' | 'win' | 'lose'): void {
    const o = this.out(null, 0.3, 2);
    if (!o) return;
    const t = this.ctx!.currentTime;
    switch (kind) {
      case 'buy':
        this.tone(o.node, t, 0.08, 1200, 1600, 0.3, 'triangle');
        break;
      case 'deny':
        this.tone(o.node, t, 0.15, 300, 220, 0.3, 'square');
        break;
      case 'tick':
        this.tone(o.node, t, 0.03, 2000, 2000, 0.15, 'sine');
        break;
      case 'round':
        this.tone(o.node, t, 0.3, 440, 440, 0.25, 'triangle');
        this.tone(o.node, t + 0.15, 0.4, 660, 660, 0.25, 'triangle');
        break;
      case 'win':
        [523, 659, 784].forEach((f, i) => this.tone(o.node, t + i * 0.12, 0.5, f, f, 0.25, 'triangle'));
        break;
      case 'lose':
        [392, 330, 262].forEach((f, i) => this.tone(o.node, t + i * 0.14, 0.5, f, f, 0.22, 'triangle'));
        break;
    }
    this.done(o, 1000);
  }

  /** Sparse ambient pad for menus/halftime/results only (never during live rounds). */
  startMusic(): void {
    const c = this.ctx;
    if (!c || this.musicNodes.length) return;
    const chords = [
      [146.8, 220, 277.2, 329.6],
      [130.8, 196, 261.6, 311.1],
      [110, 164.8, 220, 261.6],
      [123.5, 185, 246.9, 293.7],
    ];
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    lp.connect(this.music);
    const g = c.createGain();
    g.gain.value = 0.0;
    g.connect(lp);
    g.gain.linearRampToValueAtTime(0.06, c.currentTime + 3);
    const oscs = [0, 1, 2, 3].map((i) => {
      const o = c.createOscillator();
      o.type = i % 2 ? 'triangle' : 'sine';
      o.detune.value = (i - 1.5) * 4;
      o.connect(g);
      o.start();
      return o;
    });
    let k = 0;
    const apply = () => {
      const ch = chords[k++ % chords.length];
      oscs.forEach((o, i) => o.frequency.setTargetAtTime(ch[i], c.currentTime, 1.2));
    };
    apply();
    this.musicTimer = window.setInterval(apply, 6000);
    this.musicNodes = [...oscs, g, lp];
  }

  stopMusic(): void {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
    for (const n of this.musicNodes) {
      try {
        if (n instanceof OscillatorNode) n.stop();
        n.disconnect();
      } catch {
        /* ignore */
      }
    }
    this.musicNodes = [];
  }
}

export const audio = new AudioEngine();
