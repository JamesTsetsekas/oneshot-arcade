// Fully procedural audio (Web Audio). Every sound is synthesised from oscillators and filtered noise at runtime.
// Tactical sounds are spatialised (stereo pan, distance rolloff, occlusion low-pass) and voice-limited.

import type { WeaponClass } from '../content/weapons';
import { lineOfSight } from '../sim/collision';
import type { Vec3 } from '../sim/math';

export interface Listener { x: number; y: number; z: number; yaw: number }

interface ShotProfile { crack: number; dur: number; thump: number; vol: number; tail: number }
const SHOT: Record<WeaponClass, ShotProfile> = {
  pistol: { crack: 2400, dur: 0.12, thump: 150, vol: 0.5, tail: 0.5 },
  smg: { crack: 3000, dur: 0.09, thump: 175, vol: 0.42, tail: 0.4 },
  rifle: { crack: 1800, dur: 0.16, thump: 110, vol: 0.62, tail: 0.7 },
  sniper: { crack: 1100, dur: 0.38, thump: 70, vol: 0.95, tail: 1.2 },
  dmr: { crack: 1500, dur: 0.22, thump: 92, vol: 0.78, tail: 0.9 },
  shotgun: { crack: 900, dur: 0.24, thump: 70, vol: 0.9, tail: 0.8 },
  lmg: { crack: 1500, dur: 0.14, thump: 92, vol: 0.68, tail: 0.7 },
  melee: { crack: 3000, dur: 0.05, thump: 200, vol: 0.2, tail: 0.1 },
};

export class AudioEngine {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfx!: GainNode;
  private music!: GainNode;
  private reverb!: ConvolverNode;
  private reverbGain!: GainNode;
  private noise!: AudioBuffer;
  listener: Listener = { x: 0, y: 0, z: 0, yaw: 0 };
  volume = 0.7;
  sfxVolume = 1;
  musicVolume = 0.5;
  private voices = 0;
  private maxVoices = 40;
  private musicNodes: Array<{ stop: () => void }> = [];
  onCaption?: (text: string, pos?: Vec3) => void;
  occlusion = true;

  /** Must be called from a user gesture. */
  resume(): void {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AC();
      } catch { this.ctx = null; return; }
      const c = this.ctx!;
      this.master = c.createGain(); this.master.connect(c.destination);
      this.sfx = c.createGain(); this.sfx.connect(this.master);
      this.music = c.createGain(); this.music.connect(this.master);
      this.reverb = c.createConvolver();
      this.reverb.buffer = this.impulse(1.6);
      this.reverbGain = c.createGain(); this.reverbGain.gain.value = 0.22;
      this.reverb.connect(this.reverbGain); this.reverbGain.connect(this.sfx);
      const len = c.sampleRate * 2;
      this.noise = c.createBuffer(1, len, c.sampleRate);
      const d = this.noise.getChannelData(0);
      let seed = 12345;
      for (let i = 0; i < len; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; d[i] = (seed / 4294967296) * 2 - 1; }
      this.applyVolumes();
    }
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
  }

  applyVolumes(): void {
    if (!this.ctx) return;
    this.master.gain.value = this.volume;
    this.sfx.gain.value = this.sfxVolume;
    this.music.gain.value = this.musicVolume * 0.5;
  }

  private impulse(sec: number): AudioBuffer {
    const c = this.ctx!;
    const len = Math.floor(c.sampleRate * sec);
    const b = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      let seed = 777 + ch * 31;
      for (let i = 0; i < len; i++) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        d[i] = ((seed / 4294967296) * 2 - 1) * Math.pow(1 - i / len, 3.2);
      }
    }
    return b;
  }

  // -------------------------------------------------------------- spatial routing
  /** Returns an input node routed through gain/pan/occlusion filter to the sfx bus, or null when too quiet / over budget. */
  private route(pos: Vec3 | undefined, maxDist: number, vol: number, sendReverb = 0): AudioNode | null {
    const c = this.ctx;
    if (!c || c.state !== 'running' || this.voices >= this.maxVoices) return null;
    let gain = vol, pan = 0, cutoff = 18000;
    if (pos) {
      const dx = pos.x - this.listener.x, dz = pos.z - this.listener.z, dy = pos.y - this.listener.y;
      const d = Math.hypot(dx, dy, dz);
      if (d > maxDist) return null;
      gain *= Math.pow(Math.max(0, 1 - d / maxDist), 1.6);
      // listener right vector: (cos yaw, -sin yaw)
      const rx = Math.cos(this.listener.yaw), rz = -Math.sin(this.listener.yaw);
      pan = d < 0.5 ? 0 : Math.max(-1, Math.min(1, (dx * rx + dz * rz) / d));
      if (this.occlusion && d > 1.5 && !lineOfSight({ x: this.listener.x, y: this.listener.y, z: this.listener.z }, { x: pos.x, y: pos.y + 1.2, z: pos.z })) {
        gain *= 0.55; cutoff = 700;
      }
    }
    if (gain < 0.01) return null;
    const g = c.createGain(); g.gain.value = gain;
    const p = c.createStereoPanner(); p.pan.value = pan;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff;
    f.connect(g); g.connect(p); p.connect(this.sfx);
    if (sendReverb > 0) {
      const s = c.createGain(); s.gain.value = sendReverb;
      g.connect(s); s.connect(this.reverb);
    }
    this.voices++;
    return f;
  }

  private release(sec: number): void {
    setTimeout(() => { this.voices = Math.max(0, this.voices - 1); }, sec * 1000 + 50);
  }

  private noiseBurst(dest: AudioNode, t: number, dur: number, type: BiquadFilterType, freq: number, q: number, vol: number, attack = 0.002, decayPow = 1): void {
    const c = this.ctx!;
    const src = c.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol * Math.pow(0.001, decayPow)), t + dur);
    src.connect(f); f.connect(g); g.connect(dest);
    src.start(t, Math.random() * 1.5);
    src.stop(t + dur + 0.05);
  }

  private tone(dest: AudioNode, t: number, freq: number, dur: number, vol: number, type: OscillatorType = 'sine', slideTo?: number): void {
    const c = this.ctx!;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest);
    o.start(t); o.stop(t + dur + 0.05);
  }

  // -------------------------------------------------------------- sound library
  shot(cls: WeaponClass, pos?: Vec3, own = false): void {
    const prof = SHOT[cls];
    const out = this.route(own ? undefined : pos, own ? 1 : 85, own ? prof.vol : prof.vol * 1.1, own ? 0.5 : 0.8);
    if (!out || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.noiseBurst(out, t, prof.dur, 'bandpass', prof.crack, 0.7, 1.0, 0.001, 1);
    this.noiseBurst(out, t, prof.dur * 0.5, 'highpass', 4500, 0.5, 0.5, 0.001, 1);
    this.tone(out, t, prof.thump * 1.6, 0.16, 0.9, 'sine', prof.thump * 0.45);
    this.release(prof.dur + 0.3);
  }

  step(pos: Vec3 | undefined, loud: number, own = false): void {
    const out = this.route(own ? undefined : pos, 6 + 30 * loud, (own ? 0.22 : 0.55) * (0.35 + 0.65 * loud));
    if (!out || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.noiseBurst(out, t, 0.07, 'bandpass', 500 + Math.random() * 200, 1.2, 0.8, 0.002);
    this.noiseBurst(out, t, 0.04, 'lowpass', 220, 0.8, 0.6, 0.001);
    this.release(0.12);
  }

  land(pos: Vec3 | undefined, own = false): void {
    const out = this.route(own ? undefined : pos, 30, 0.6);
    if (!out || !this.ctx) return;
    this.noiseBurst(out, this.ctx.currentTime, 0.12, 'lowpass', 260, 0.7, 1);
    this.release(0.2);
  }

  click(pos: Vec3 | undefined, kind: 'reload' | 'draw' | 'dry' | 'bolt' | 'scope' | 'drop' | 'pickup' | 'throw' | 'melee' | 'jump', own = false): void {
    const dist = kind === 'dry' ? 12 : kind === 'drop' || kind === 'throw' ? 28 : 16;
    const out = this.route(own ? undefined : pos, dist, own ? 0.45 : 0.7);
    if (!out || !this.ctx) return;
    const t = this.ctx.currentTime;
    switch (kind) {
      case 'reload':
        this.noiseBurst(out, t, 0.04, 'bandpass', 2400, 3, 0.8);
        this.tone(out, t + 0.02, 900, 0.05, 0.2, 'square');
        this.noiseBurst(out, t + 0.45, 0.05, 'bandpass', 1500, 3, 0.9);
        this.tone(out, t + 0.5, 320, 0.08, 0.25, 'triangle');
        break;
      case 'draw': this.noiseBurst(out, t, 0.06, 'bandpass', 1200, 2, 0.5); this.tone(out, t, 500, 0.05, 0.12, 'square'); break;
      case 'dry': this.noiseBurst(out, t, 0.03, 'bandpass', 3000, 4, 0.7); break;
      case 'bolt': this.noiseBurst(out, t + 0.25, 0.05, 'bandpass', 1800, 3, 0.8); this.tone(out, t + 0.7, 420, 0.06, 0.2, 'square'); break;
      case 'scope': this.tone(out, t, 1400, 0.05, 0.12, 'sine'); break;
      case 'drop': this.noiseBurst(out, t, 0.14, 'lowpass', 500, 0.8, 0.9); this.tone(out, t, 180, 0.12, 0.3, 'triangle', 90); break;
      case 'pickup': this.tone(out, t, 700, 0.07, 0.2, 'square'); this.tone(out, t + 0.07, 1000, 0.06, 0.15, 'square'); break;
      case 'throw': this.noiseBurst(out, t, 0.18, 'bandpass', 700, 0.7, 0.5, 0.05); break;
      case 'melee': this.noiseBurst(out, t, 0.12, 'bandpass', 1800, 0.9, 0.5, 0.04); break;
      case 'jump': this.noiseBurst(out, t, 0.06, 'bandpass', 400, 1, 0.4); break;
    }
    this.release(0.9);
  }

  bounce(pos: Vec3, mat: number): void {
    const out = this.route(pos, 30, 0.6);
    if (!out || !this.ctx) return;
    const t = this.ctx.currentTime;
    if (mat === 2) this.tone(out, t, 1700, 0.18, 0.25, 'triangle');
    else if (mat === 1) this.tone(out, t, 2600, 0.08, 0.2, 'sine');
    this.noiseBurst(out, t, 0.08, 'lowpass', mat === 2 ? 1400 : 420, 0.8, 0.8);
    this.release(0.3);
  }

  flashPop(pos: Vec3): void {
    const out = this.route(pos, 70, 1.0, 0.6);
    if (!out || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.noiseBurst(out, t, 0.25, 'highpass', 1500, 0.5, 1.0, 0.001);
    this.tone(out, t, 3200, 0.9, 0.12, 'sine');
    this.release(1);
  }

  boom(pos: Vec3, big = false): void {
    const out = this.route(pos, big ? 110 : 80, big ? 1.4 : 1.1, 1.0);
    if (!out || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.noiseBurst(out, t, big ? 1.1 : 0.7, 'lowpass', big ? 700 : 900, 0.5, 1.3, 0.003, 1);
    this.tone(out, t, 90, big ? 1.0 : 0.6, 1.2, 'sine', 28);
    this.release(1.6);
  }

  hiss(pos: Vec3): void {
    const out = this.route(pos, 45, 0.6);
    if (!out || !this.ctx) return;
    this.noiseBurst(out, this.ctx.currentTime, 1.2, 'bandpass', 2600, 0.6, 0.6, 0.1);
    this.release(1.3);
  }

  ignite(pos: Vec3): void {
    const out = this.route(pos, 50, 0.7, 0.3);
    if (!out || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.noiseBurst(out, t, 0.5, 'bandpass', 900, 0.8, 0.8, 0.05);
    this.noiseBurst(out, t + 0.1, 1.2, 'lowpass', 500, 0.6, 0.5, 0.2);
    this.release(1.8);
  }

  pulsePing(pos: Vec3 | undefined): void {
    const out = this.route(pos, 60, 0.5);
    if (!out || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone(out, t, 1600, 0.22, 0.3, 'sine', 700);
    this.tone(out, t + 0.1, 1200, 0.2, 0.2, 'sine', 600);
    this.release(0.4);
  }

  /** Cipher beep: readable pitch step in the last five seconds. */
  beep(pos: Vec3 | undefined, remaining: number): void {
    const out = this.route(pos, 95, 0.55);
    if (!out || !this.ctx) return;
    const t = this.ctx.currentTime;
    const f = remaining < 5 ? 1560 : remaining < 10 ? 1240 : 1000;
    this.tone(out, t, f, 0.09, 0.5, 'square');
    this.tone(out, t, f * 0.5, 0.09, 0.3, 'sine');
    this.release(0.2);
  }

  armLoop(pos: Vec3 | undefined): void {
    const out = this.route(pos, 40, 0.5);
    if (!out || !this.ctx) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) this.tone(out, t + i * 0.14, 520 + i * 90, 0.07, 0.25, 'square');
    this.release(0.6);
  }

  // UI / feedback (non-spatial)
  private ui(): AudioNode | null {
    const c = this.ctx;
    if (!c || c.state !== 'running') return null;
    const g = c.createGain(); g.gain.value = 0.7; g.connect(this.sfx);
    return g;
  }
  hitMarker(head: boolean, kill: boolean): void {
    const o = this.ui(); if (!o) return;
    const t = this.ctx!.currentTime;
    this.tone(o, t, head ? 2200 : 1500, 0.06, 0.45, 'square');
    if (kill) { this.tone(o, t + 0.05, 1100, 0.14, 0.4, 'triangle'); this.tone(o, t + 0.05, 2200, 0.1, 0.2, 'sine'); }
  }
  hurt(): void {
    const o = this.ui(); if (!o) return;
    const t = this.ctx!.currentTime;
    this.tone(o, t, 140, 0.2, 0.9, 'sine', 60);
    this.noiseBurst(o, t, 0.12, 'lowpass', 600, 0.7, 0.7);
  }
  uiClick(): void { const o = this.ui(); if (!o) return; this.tone(o, this.ctx!.currentTime, 900, 0.04, 0.25, 'square'); }
  buy(ok: boolean): void {
    const o = this.ui(); if (!o) return;
    const t = this.ctx!.currentTime;
    if (ok) { this.tone(o, t, 880, 0.07, 0.3, 'triangle'); this.tone(o, t + 0.06, 1320, 0.1, 0.3, 'triangle'); } else this.tone(o, t, 200, 0.16, 0.4, 'sawtooth');
  }
  stinger(kind: 'start' | 'win' | 'lose' | 'plant' | 'defuse' | 'buyEnd' | 'half'): void {
    const o = this.ui(); if (!o) return;
    const t = this.ctx!.currentTime;
    const seq: Record<string, Array<[number, number]>> = {
      start: [[440, 0], [660, 0.12], [880, 0.24]],
      win: [[523, 0], [659, 0.12], [784, 0.24], [1046, 0.4]],
      lose: [[392, 0], [330, 0.15], [262, 0.3]],
      plant: [[660, 0], [880, 0.1], [1320, 0.2]],
      defuse: [[880, 0], [1100, 0.1], [1320, 0.2], [1760, 0.32]],
      buyEnd: [[300, 0], [300, 0.12]],
      half: [[392, 0], [523, 0.18], [392, 0.36], [659, 0.54]],
    };
    for (const [f, d] of seq[kind]) this.tone(o, t + d, f, kind === 'win' || kind === 'defuse' ? 0.28 : 0.16, 0.35, 'triangle');
  }

  // -------------------------------------------------------------- music (menus / halftime / result only)
  startMusic(): void {
    if (!this.ctx || this.musicNodes.length) return;
    const c = this.ctx;
    const chords = [[220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7], [164.8, 207.6, 246.9]];
    const filter = c.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 900; filter.Q.value = 0.7;
    const gain = c.createGain(); gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(0.5, c.currentTime + 3);
    filter.connect(gain); gain.connect(this.music);
    const oscs: OscillatorNode[] = [];
    for (let i = 0; i < 3; i++) {
      for (const det of [-6, 6]) {
        const o = c.createOscillator(); o.type = 'sawtooth'; o.detune.value = det;
        o.frequency.value = chords[0][i] / 2;
        const g = c.createGain(); g.gain.value = 0.07;
        o.connect(g); g.connect(filter); o.start();
        oscs.push(o);
      }
    }
    const lfo = c.createOscillator(); lfo.frequency.value = 0.12;
    const lg = c.createGain(); lg.gain.value = 350;
    lfo.connect(lg); lg.connect(filter.frequency); lfo.start();
    let idx = 0;
    const timer = window.setInterval(() => {
      idx = (idx + 1) % chords.length;
      oscs.forEach((o, k) => o.frequency.linearRampToValueAtTime(chords[idx][Math.floor(k / 2)] / 2, c.currentTime + 2.5));
    }, 8000);
    this.musicNodes.push({ stop: () => { window.clearInterval(timer); gain.gain.linearRampToValueAtTime(0, c.currentTime + 1.2); setTimeout(() => { oscs.forEach((o) => o.stop()); lfo.stop(); }, 1400); } });
  }
  stopMusic(): void { for (const n of this.musicNodes) n.stop(); this.musicNodes = []; }
}
