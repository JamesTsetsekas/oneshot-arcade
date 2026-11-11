// Fully synthesized audio (Web Audio API). No samples are shipped: every shot, step, beep and stinger
// is generated at runtime, spatialized with HRTF panners, distance-attenuated and low-passed when occluded.
import { WEAPONS, type WeaponId } from '../content/weapons';

interface PlayOpts {
  x?: number;
  y?: number;
  z?: number;
  vol?: number;
  occluded?: boolean;
  /** reference distance for attenuation */
  ref?: number;
}

const MAX_VOICES = 44;

export class AudioEngine {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfx!: GainNode;
  private music!: GainNode;
  private noise!: AudioBuffer;
  private voices = 0;
  private musicNodes: AudioNode[] = [];
  private musicTimer = 0;
  private musicOn = false;
  private ringGain: GainNode | null = null;
  volume = 0.7;
  musicVolume = 0.5;

  /** Must be called from a user gesture. */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor({ latencyHint: 'interactive' });
    } catch {
      this.ctx = null;
      return;
    }
    const c = this.ctx;
    this.master = c.createGain();
    this.master.gain.value = this.volume;
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 5;
    comp.attack.value = 0.003;
    comp.release.value = 0.18;
    this.master.connect(comp).connect(c.destination);
    this.sfx = c.createGain();
    this.sfx.connect(this.master);
    this.music = c.createGain();
    this.music.gain.value = 0;
    this.music.connect(this.master);
    const len = c.sampleRate * 2;
    this.noise = c.createBuffer(1, len, c.sampleRate);
    const d = this.noise.getChannelData(0);
    let seed = 12345;
    for (let i = 0; i < len; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      d[i] = (seed / 4294967296) * 2 - 1;
    }
  }

  setVolume(v: number): void {
    this.volume = v;
    if (this.ctx) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.03);
  }

  setListener(x: number, y: number, z: number, fx: number, fy: number, fz: number): void {
    const c = this.ctx;
    if (!c) return;
    const l = c.listener;
    // game space is left-handed (+Z forward); Web Audio is right-handed, so Z is negated
    if (l.positionX) {
      const t = c.currentTime;
      l.positionX.setTargetAtTime(x, t, 0.02);
      l.positionY.setTargetAtTime(y, t, 0.02);
      l.positionZ.setTargetAtTime(-z, t, 0.02);
      l.forwardX.setTargetAtTime(fx, t, 0.02);
      l.forwardY.setTargetAtTime(fy, t, 0.02);
      l.forwardZ.setTargetAtTime(-fz, t, 0.02);
      l.upX.value = 0;
      l.upY.value = 1;
      l.upZ.value = 0;
    } else {
      l.setPosition(x, y, -z);
      l.setOrientation(fx, fy, -fz, 0, 1, 0);
    }
  }

  /** Builds the output chain for one voice. Returns null when the voice budget is exhausted. */
  private out(o: PlayOpts, priority: boolean): { node: AudioNode; t: number; done: (dur: number) => void } | null {
    const c = this.ctx;
    if (!c || c.state !== 'running') return null;
    if (this.voices >= MAX_VOICES && !priority) return null;
    this.voices++;
    const g = c.createGain();
    g.gain.value = o.vol ?? 1;
    let tail: AudioNode = g;
    if (o.occluded) {
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 750;
      tail.connect(lp);
      tail = lp;
      g.gain.value *= 0.55;
    }
    if (o.x !== undefined) {
      const p = c.createPanner();
      p.panningModel = 'HRTF';
      p.distanceModel = 'inverse';
      p.refDistance = o.ref ?? 3;
      p.rolloffFactor = 1.25;
      p.maxDistance = 200;
      p.positionX.value = o.x;
      p.positionY.value = o.y ?? 0;
      p.positionZ.value = -(o.z ?? 0);
      tail.connect(p);
      tail = p;
    }
    tail.connect(this.sfx);
    const end = tail;
    return {
      node: g,
      t: c.currentTime,
      done: (dur: number) => {
        window.setTimeout(
          () => {
            this.voices--;
            try {
              end.disconnect();
            } catch {
              /* already gone */
            }
          },
          dur * 1000 + 80,
        );
      },
    };
  }

  private noiseSrc(t: number, dur: number): AudioBufferSourceNode {
    const s = this.ctx!.createBufferSource();
    s.buffer = this.noise;
    s.start(t, Math.random() * 1.5, dur + 0.05);
    return s;
  }

  private env(g: GainNode, t: number, peak: number, attack: number, decay: number): void {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  private tone(dst: AudioNode, t: number, type: OscillatorType, f0: number, f1: number, peak: number, attack: number, decay: number): void {
    const c = this.ctx!;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + attack + decay);
    const g = c.createGain();
    this.env(g, t, peak, attack, decay);
    o.connect(g).connect(dst);
    o.start(t);
    o.stop(t + attack + decay + 0.05);
  }

  private burst(dst: AudioNode, t: number, type: BiquadFilterType, f0: number, f1: number, q: number, peak: number, attack: number, decay: number): void {
    const c = this.ctx!;
    const s = this.noiseSrc(t, attack + decay);
    const f = c.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + attack + decay);
    const g = c.createGain();
    this.env(g, t, peak, attack, decay);
    s.connect(f).connect(g).connect(dst);
  }

  // ------------------------------------------------------------------ weapons
  shot(weapon: WeaponId, o: PlayOpts, own: boolean): void {
    const v = this.out({ ...o, ref: 9, vol: (o.vol ?? 1) * (own ? 0.8 : 1) }, true);
    if (!v) return;
    const { node, t } = v;
    const cls = WEAPONS[weapon].cls;
    // per-weapon character from a few parameters; detuned slightly per shot
    const jit = 1 + (Math.random() - 0.5) * 0.06;
    let body = 150;
    let crack = 2600;
    let len = 0.16;
    let tail = 0.35;
    let lvl = 0.85;
    switch (cls) {
      case 'sidearm':
        body = weapon === 'rook' ? 120 : 210;
        crack = weapon === 'rook' ? 1900 : 3200;
        len = weapon === 'rook' ? 0.2 : 0.1;
        tail = weapon === 'rook' ? 0.5 : 0.22;
        lvl = weapon === 'rook' ? 1 : 0.7;
        break;
      case 'smg':
        body = weapon === 'vectora' ? 260 : 230;
        crack = 3600;
        len = 0.085;
        tail = 0.18;
        lvl = 0.68;
        break;
      case 'rifle':
        body = weapon === 'krait' ? 120 : weapon === 'lumen' ? 190 : 155;
        crack = weapon === 'krait' ? 2000 : 2800;
        len = weapon === 'krait' ? 0.19 : 0.14;
        tail = 0.42;
        lvl = 0.9;
        break;
      case 'sniper':
        body = weapon === 'longglass' ? 80 : 110;
        crack = 1500;
        len = weapon === 'longglass' ? 0.34 : 0.22;
        tail = weapon === 'longglass' ? 1.1 : 0.7;
        lvl = 1.1;
        break;
      case 'shotgun':
        body = 90;
        crack = 1100;
        len = 0.3;
        tail = 0.7;
        lvl = 1.1;
        break;
      case 'lmg':
        body = 130;
        crack = 2200;
        len = 0.16;
        tail = 0.4;
        lvl = 0.9;
        break;
      default:
        break;
    }
    this.burst(node, t, 'bandpass', crack * jit, crack * 0.35, 0.7, lvl, 0.002, len);
    this.burst(node, t, 'highpass', 5000, 3000, 0.5, lvl * 0.35, 0.001, 0.035);
    this.tone(node, t, 'sine', body * 1.7 * jit, body * 0.45, lvl * 0.9, 0.002, len * 1.1);
    this.tone(node, t, 'triangle', body * 3.1, body, lvl * 0.25, 0.001, 0.05);
    // tail / room
    this.burst(node, t + 0.02, 'lowpass', 1400, 300, 0.4, lvl * 0.2, 0.02, tail);
    v.done(len + tail + 0.1);
  }

  // ------------------------------------------------------------------ generic one-shots
  play(kind: string, o: PlayOpts = {}): void {
    const c = this.ctx;
    if (!c) return;
    const important = !kind.startsWith('step') && kind !== 'gear';
    const v = this.out(o, important);
    if (!v) return;
    const { node: n, t } = v;
    let dur = 0.3;
    switch (kind) {
      case 'step_hard':
        this.burst(n, t, 'lowpass', 520 + Math.random() * 160, 160, 1.2, 0.55, 0.004, 0.09);
        this.burst(n, t, 'bandpass', 2200, 1600, 2, 0.1, 0.002, 0.03);
        dur = 0.15;
        break;
      case 'step_metal':
        this.burst(n, t, 'bandpass', 900 + Math.random() * 200, 500, 5, 0.6, 0.003, 0.1);
        this.tone(n, t, 'triangle', 540 + Math.random() * 60, 420, 0.12, 0.002, 0.18);
        dur = 0.25;
        break;
      case 'step_soft':
        this.burst(n, t, 'lowpass', 300, 110, 0.8, 0.5, 0.008, 0.12);
        dur = 0.18;
        break;
      case 'gear':
        this.burst(n, t, 'bandpass', 2600, 1800, 1.5, 0.12, 0.01, 0.07);
        dur = 0.12;
        break;
      case 'land':
        this.burst(n, t, 'lowpass', 420, 90, 0.9, 0.9, 0.004, 0.2);
        this.tone(n, t, 'sine', 90, 45, 0.5, 0.004, 0.16);
        dur = 0.3;
        break;
      case 'jump':
        this.burst(n, t, 'bandpass', 800, 1500, 1, 0.2, 0.02, 0.1);
        dur = 0.15;
        break;
      case 'reload':
        this.click(n, t, 1700, 0.5);
        this.click(n, t + 0.34, 1100, 0.6);
        this.click(n, t + 0.6, 2300, 0.45);
        dur = 0.8;
        break;
      case 'draw':
        this.burst(n, t, 'bandpass', 1300, 2600, 1, 0.16, 0.03, 0.1);
        this.click(n, t + 0.11, 2000, 0.25);
        dur = 0.3;
        break;
      case 'dry':
        this.click(n, t, 2600, 0.5);
        dur = 0.1;
        break;
      case 'scope':
        this.click(n, t, 3200, 0.25);
        this.burst(n, t, 'bandpass', 4000, 6000, 3, 0.07, 0.02, 0.1);
        dur = 0.15;
        break;
      case 'drop':
        this.burst(n, t, 'bandpass', 700, 300, 2, 0.5, 0.003, 0.09);
        this.click(n, t + 0.09, 1300, 0.3);
        dur = 0.25;
        break;
      case 'pickup':
        this.click(n, t, 1500, 0.4);
        this.click(n, t + 0.07, 2100, 0.4);
        dur = 0.2;
        break;
      case 'throw':
        this.burst(n, t, 'bandpass', 600, 2400, 0.8, 0.3, 0.05, 0.16);
        dur = 0.25;
        break;
      case 'melee':
        this.burst(n, t, 'bandpass', 900, 3200, 0.9, 0.35, 0.04, 0.12);
        dur = 0.2;
        break;
      case 'melee_hit':
        this.burst(n, t, 'lowpass', 900, 200, 1, 0.9, 0.003, 0.12);
        this.tone(n, t, 'sine', 160, 70, 0.5, 0.002, 0.1);
        dur = 0.2;
        break;
      case 'bounce':
        this.tone(n, t, 'triangle', 1900 + Math.random() * 500, 1400, 0.3, 0.001, 0.06);
        this.burst(n, t, 'bandpass', 3000, 2000, 3, 0.2, 0.001, 0.04);
        dur = 0.1;
        break;
      case 'veil':
        this.burst(n, t, 'bandpass', 2400, 900, 0.8, 0.5, 0.05, 1.5);
        this.tone(n, t, 'sine', 300, 120, 0.3, 0.01, 0.25);
        dur = 1.7;
        break;
      case 'flash':
        this.burst(n, t, 'highpass', 2500, 1200, 0.5, 1.1, 0.001, 0.2);
        this.tone(n, t, 'square', 1800, 700, 0.3, 0.001, 0.12);
        this.tone(n, t, 'sine', 140, 60, 0.6, 0.001, 0.2);
        dur = 0.4;
        break;
      case 'frag':
        this.burst(n, t, 'lowpass', 2600, 120, 0.5, 1.4, 0.002, 0.7);
        this.tone(n, t, 'sine', 110, 32, 1.3, 0.002, 0.6);
        this.burst(n, t + 0.05, 'bandpass', 900, 300, 0.5, 0.4, 0.05, 1.1);
        dur = 1.3;
        break;
      case 'thermite': {
        this.burst(n, t, 'bandpass', 1800, 700, 0.7, 0.6, 0.02, 0.5);
        // crackle bed for the burn duration
        for (let i = 0; i < 42; i++) this.burst(n, t + 0.2 + Math.random() * 6.6, 'bandpass', 1200 + Math.random() * 2600, 800, 2.5, 0.12 + Math.random() * 0.2, 0.003, 0.05 + Math.random() * 0.1);
        this.burst(n, t + 0.1, 'lowpass', 500, 380, 0.5, 0.22, 0.4, 6.4);
        dur = 7.2;
        break;
      }
      case 'pulse':
        this.tone(n, t, 'sine', 880, 1320, 0.5, 0.01, 0.28);
        this.tone(n, t + 0.12, 'sine', 1320, 1760, 0.25, 0.01, 0.4);
        dur = 0.7;
        break;
      case 'shard_set':
        this.click(n, t, 2800, 0.4);
        this.tone(n, t, 'sine', 1500, 2200, 0.15, 0.01, 0.15);
        dur = 0.2;
        break;
      case 'shardbreak':
        for (let i = 0; i < 5; i++) this.tone(n, t + i * 0.015, 'triangle', 2500 + Math.random() * 2500, 1800, 0.18, 0.001, 0.12);
        dur = 0.3;
        break;
      case 'beep':
        this.tone(n, t, 'square', 1250, 1250, 0.2, 0.002, 0.07);
        this.tone(n, t, 'sine', 2500, 2500, 0.16, 0.002, 0.06);
        dur = 0.12;
        break;
      case 'arm_start':
        for (let i = 0; i < 7; i++) this.tone(n, t + i * 0.4, 'square', 700 + i * 60, 700 + i * 60, 0.14, 0.003, 0.06);
        dur = 3.2;
        break;
      case 'armed':
        this.tone(n, t, 'sawtooth', 330, 330, 0.25, 0.01, 0.16);
        this.tone(n, t + 0.17, 'sawtooth', 440, 440, 0.25, 0.01, 0.16);
        this.tone(n, t + 0.34, 'sawtooth', 660, 660, 0.3, 0.01, 0.4);
        dur = 0.9;
        break;
      case 'disarm_start':
        for (let i = 0; i < 10; i++) this.click(n, t + i * 0.09, 1500 + (i % 3) * 300, 0.3);
        dur = 1;
        break;
      case 'disarmed':
        this.tone(n, t, 'sine', 990, 990, 0.3, 0.005, 0.18);
        this.tone(n, t + 0.14, 'sine', 740, 740, 0.3, 0.005, 0.18);
        this.tone(n, t + 0.28, 'sine', 495, 495, 0.35, 0.005, 0.5);
        dur = 0.9;
        break;
      case 'detonate':
        this.burst(n, t, 'lowpass', 4000, 60, 0.4, 1.6, 0.004, 1.8);
        this.tone(n, t, 'sine', 90, 24, 1.6, 0.004, 1.6);
        this.tone(n, t, 'sawtooth', 220, 40, 0.4, 0.01, 0.8);
        dur = 2.2;
        break;
      case 'death':
        this.burst(n, t, 'lowpass', 500, 120, 0.8, 0.6, 0.01, 0.22);
        this.tone(n, t + 0.02, 'sine', 120, 60, 0.4, 0.005, 0.18);
        dur = 0.3;
        break;
      // ---- non-spatial feedback
      case 'hit':
        this.tone(n, t, 'triangle', 1500, 1100, 0.3, 0.001, 0.05);
        dur = 0.08;
        break;
      case 'headshot':
        this.tone(n, t, 'triangle', 2700, 2200, 0.4, 0.001, 0.08);
        this.tone(n, t, 'sine', 4100, 3900, 0.2, 0.001, 0.1);
        dur = 0.15;
        break;
      case 'killconfirm':
        this.tone(n, t, 'triangle', 660, 660, 0.3, 0.002, 0.09);
        this.tone(n, t + 0.08, 'triangle', 990, 990, 0.32, 0.002, 0.2);
        dur = 0.35;
        break;
      case 'hurt':
        this.burst(n, t, 'lowpass', 700, 150, 1, 0.8, 0.002, 0.12);
        this.tone(n, t, 'sine', 180, 80, 0.5, 0.002, 0.1);
        dur = 0.2;
        break;
      case 'ui_hover':
        this.tone(n, t, 'sine', 1400, 1400, 0.05, 0.002, 0.03);
        dur = 0.05;
        break;
      case 'ui_click':
        this.tone(n, t, 'triangle', 900, 1300, 0.14, 0.002, 0.06);
        dur = 0.1;
        break;
      case 'buy':
        this.tone(n, t, 'triangle', 1050, 1050, 0.16, 0.002, 0.06);
        this.tone(n, t + 0.06, 'triangle', 1570, 1570, 0.18, 0.002, 0.12);
        dur = 0.25;
        break;
      case 'deny':
        this.tone(n, t, 'sawtooth', 180, 150, 0.16, 0.003, 0.14);
        dur = 0.2;
        break;
      case 'round_start':
        this.tone(n, t, 'sawtooth', 220, 220, 0.12, 0.02, 0.3);
        this.tone(n, t + 0.12, 'sawtooth', 330, 330, 0.12, 0.02, 0.3);
        this.tone(n, t + 0.24, 'sawtooth', 440, 440, 0.16, 0.02, 0.5);
        dur = 0.9;
        break;
      case 'round_win':
        [523, 659, 784, 1047].forEach((f, i) => this.tone(n, t + i * 0.11, 'triangle', f, f, 0.2, 0.01, 0.4));
        dur = 1;
        break;
      case 'round_loss':
        [440, 392, 330, 262].forEach((f, i) => this.tone(n, t + i * 0.13, 'triangle', f, f, 0.18, 0.01, 0.4));
        dur = 1;
        break;
      case 'tick':
        this.click(n, t, 1800, 0.25);
        dur = 0.06;
        break;
      default:
        this.click(n, t, 1500, 0.2);
        dur = 0.1;
    }
    v.done(dur);
  }

  private click(dst: AudioNode, t: number, freq: number, peak: number): void {
    this.burst(dst, t, 'bandpass', freq, freq * 0.8, 6, peak, 0.001, 0.03);
  }

  /** Ear ringing while flashed; kept quiet enough that game audio stays audible. */
  ring(duration: number, amount: number): void {
    const c = this.ctx;
    if (!c) return;
    const t = c.currentTime;
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.value = 3400;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09 * amount + 0.001, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    o.connect(g).connect(this.sfx);
    o.start(t);
    o.stop(t + duration + 0.05);
    this.ringGain = g;
  }

  // ------------------------------------------------------------------ menu music
  /** Sparse generative pad. Only ever runs in menus and on the result screen. */
  setMusic(on: boolean): void {
    const c = this.ctx;
    this.musicOn = on;
    if (!c) return;
    this.music.gain.setTargetAtTime(on ? this.musicVolume * 0.5 : 0, c.currentTime, on ? 1.2 : 0.25);
    if (on && !this.musicTimer) {
      const chords = [
        [110, 164.8, 220, 261.6],
        [98, 146.8, 196, 246.9],
        [87.3, 130.8, 174.6, 220],
        [103.8, 155.6, 207.7, 246.9],
      ];
      let step = 0;
      const next = (): void => {
        if (!this.ctx || !this.musicOn) {
          this.musicTimer = 0;
          return;
        }
        const t = this.ctx.currentTime;
        const ch = chords[step++ % chords.length];
        for (const f of ch) {
          for (const det of [-4, 5]) {
            const o = this.ctx.createOscillator();
            o.type = 'sawtooth';
            o.frequency.value = f;
            o.detune.value = det;
            const lp = this.ctx.createBiquadFilter();
            lp.type = 'lowpass';
            lp.frequency.setValueAtTime(260, t);
            lp.frequency.linearRampToValueAtTime(780, t + 3.5);
            lp.frequency.linearRampToValueAtTime(240, t + 7.5);
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(0.045, t + 2.5);
            g.gain.linearRampToValueAtTime(0.0001, t + 8);
            o.connect(lp).connect(g).connect(this.music);
            o.start(t);
            o.stop(t + 8.2);
          }
        }
        // a lone high pluck now and then
        const pf = ch[2] * 4 * (step % 2 ? 1 : 1.5);
        this.tone(this.music, t + 2 + Math.random() * 3, 'sine', pf, pf, 0.06, 0.01, 1.6);
        this.musicTimer = window.setTimeout(next, 6500);
      };
      next();
    }
  }
}
