// Fully synthesised audio: Web Audio mixer with buses, ducking, pooled voices with priority limiting,
// distance/pan spatialisation, adaptive procedural music and ambience. No audio files are shipped.
import type { GameEvent } from '../sim/types';

export interface AudioSettings {
  master: number;
  music: number;
  sfx: number;
  ambient: number;
  ui: number;
}
export const DEFAULT_AUDIO: AudioSettings = { master: 0.8, music: 0.5, sfx: 0.8, ambient: 0.6, ui: 0.7 };

type Mode = 'town' | 'wild' | 'crypt' | 'boss' | 'death' | 'victory' | 'none';

const MAX_VOICES = 40;

export class AudioEngine {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private bus!: Record<'music' | 'sfx' | 'ambient' | 'ui', GainNode>;
  private duckGain!: GainNode;
  private reverb!: ConvolverNode;
  private reverbSend!: GainNode;
  private noiseBuf!: AudioBuffer;
  settings: AudioSettings = { ...DEFAULT_AUDIO };
  private listener = { x: 0, z: 0 };
  private voices: { end: number; prio: number }[] = [];
  private lastPlay = new Map<string, number>();
  private mode: Mode = 'none';
  private musicLayers: Partial<Record<Mode, GainNode>> = {};
  private musicStarted = false;
  private nextBeat = 0;
  private beatIdx = 0;
  private lowHp = false;
  private heartT = 0;
  private bossIntensity = 0;
  private windGain: GainNode | null = null;
  private voicePitch = 1;
  private barkT = 0;
  private timers: number[] = [];

  /** Must be called from a user gesture. */
  init() {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    const c = this.ctx;
    this.master = c.createGain();
    this.master.connect(c.destination);
    this.duckGain = c.createGain();
    this.duckGain.connect(this.master);
    this.bus = { music: c.createGain(), sfx: c.createGain(), ambient: c.createGain(), ui: c.createGain() };
    this.bus.music.connect(this.duckGain);
    this.bus.ambient.connect(this.duckGain);
    this.bus.sfx.connect(this.master);
    this.bus.ui.connect(this.master);
    // noise buffer
    const len = c.sampleRate * 2;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    // reverb impulse
    this.reverb = c.createConvolver();
    const il = Math.floor(c.sampleRate * 2.4);
    const ib = c.createBuffer(2, il, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = ib.getChannelData(ch);
      for (let i = 0; i < il; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / il, 2.6);
    }
    this.reverb.buffer = ib;
    this.reverbSend = c.createGain();
    this.reverbSend.gain.value = 0.5;
    this.reverbSend.connect(this.reverb);
    const rg = c.createGain();
    rg.gain.value = 0.55;
    this.reverb.connect(rg);
    rg.connect(this.master);
    this.applySettings();
    this.buildMusic();
    this.buildAmbience();
  }

  applySettings(s?: Partial<AudioSettings>) {
    if (s) Object.assign(this.settings, s);
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.settings.master, t, 0.05);
    this.bus.music.gain.setTargetAtTime(this.settings.music * 0.55, t, 0.05);
    this.bus.sfx.gain.setTargetAtTime(this.settings.sfx, t, 0.05);
    this.bus.ambient.gain.setTargetAtTime(this.settings.ambient * 0.5, t, 0.05);
    this.bus.ui.gain.setTargetAtTime(this.settings.ui, t, 0.05);
  }

  setVoice(preset: number) {
    this.voicePitch = [1, 0.8, 1.3][preset % 3];
  }

  setListener(x: number, z: number) {
    this.listener.x = x;
    this.listener.z = z;
  }

  // ------------------------------------------------------------ primitives
  private route(dest: GainNode, x?: number, z?: number, floor = 0): { out: AudioNode; gainMul: number } {
    const c = this.ctx!;
    if (x === undefined || z === undefined) return { out: dest, gainMul: 1 };
    const dx = x - this.listener.x;
    const dz = z - this.listener.z;
    const d = Math.hypot(dx, dz);
    const gainMul = Math.max(floor, 1 / (1 + d * 0.09));
    const pan = Math.max(-1, Math.min(1, (dx * 0.7071 - dz * 0.7071) * 0.07));
    const p = c.createStereoPanner();
    p.pan.value = pan;
    p.connect(dest);
    return { out: p, gainMul };
  }

  private voiceOk(prio: number, dur: number): boolean {
    const now = this.ctx!.currentTime;
    this.voices = this.voices.filter((v) => v.end > now);
    if (this.voices.length >= MAX_VOICES) {
      // priority virtualisation: drop lowest priority if the new one is more important
      let low = 0;
      for (let i = 1; i < this.voices.length; i++) if (this.voices[i].prio < this.voices[low].prio) low = i;
      if (this.voices[low].prio >= prio) return false;
      this.voices.splice(low, 1);
    }
    this.voices.push({ end: now + dur, prio });
    return true;
  }

  private tone(o: { f: number; f2?: number; dur: number; type?: OscillatorType; vol?: number; at?: number; dest?: GainNode; x?: number; z?: number; prio?: number; attack?: number; send?: number; floor?: number }) {
    const c = this.ctx!;
    const prio = o.prio ?? 1;
    if (!this.voiceOk(prio, o.dur + (o.at ?? 0))) return;
    const t = c.currentTime + (o.at ?? 0);
    const osc = c.createOscillator();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t + o.dur);
    const g = c.createGain();
    const r = this.route(o.dest ?? this.bus.sfx, o.x, o.z, o.floor ?? 0);
    const vol = (o.vol ?? 0.3) * r.gainMul;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + (o.attack ?? 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    osc.connect(g);
    g.connect(r.out);
    if (o.send) {
      const s = c.createGain();
      s.gain.value = o.send;
      g.connect(s);
      s.connect(this.reverbSend);
    }
    osc.start(t);
    osc.stop(t + o.dur + 0.05);
  }

  private noise(o: { dur: number; f: number; f2?: number; q?: number; type?: BiquadFilterType; vol?: number; at?: number; dest?: GainNode; x?: number; z?: number; prio?: number; attack?: number; send?: number; floor?: number }) {
    const c = this.ctx!;
    if (!this.voiceOk(o.prio ?? 1, o.dur + (o.at ?? 0))) return;
    const t = c.currentTime + (o.at ?? 0);
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = o.type ?? 'bandpass';
    f.frequency.setValueAtTime(o.f, t);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(Math.max(30, o.f2), t + o.dur);
    f.Q.value = o.q ?? 1;
    const g = c.createGain();
    const r = this.route(o.dest ?? this.bus.sfx, o.x, o.z, o.floor ?? 0);
    const vol = (o.vol ?? 0.3) * r.gainMul;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + (o.attack ?? 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    src.connect(f);
    f.connect(g);
    g.connect(r.out);
    if (o.send) {
      const s = c.createGain();
      s.gain.value = o.send;
      g.connect(s);
      s.connect(this.reverbSend);
    }
    src.start(t, Math.random());
    src.stop(t + o.dur + 0.05);
  }

  duck(amount: number, dur: number) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.duckGain.gain.cancelScheduledValues(t);
    this.duckGain.gain.setTargetAtTime(1 - amount, t, 0.02);
    this.duckGain.gain.setTargetAtTime(1, t + dur, 0.25);
  }

  // ------------------------------------------------------------ SFX library
  play(id: string, x?: number, z?: number, vol = 1) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const last = this.lastPlay.get(id) ?? -1;
    const minGap = id === 'impact' || id === 'die' ? 0.04 : id.startsWith('tele_') ? 0.12 : 0.025;
    if (now - last < minGap) return;
    this.lastPlay.set(id, now);
    const v = vol;
    const P = { x, z };
    switch (id) {
      case 'mace':
        this.noise({ dur: 0.18, f: 700, f2: 250, q: 0.8, vol: 0.28 * v, ...P });
        this.tone({ f: 120, f2: 60, dur: 0.12, type: 'triangle', vol: 0.2 * v, ...P });
        break;
      case 'impact':
        this.tone({ f: 150, f2: 55, dur: 0.14, type: 'sine', vol: 0.45 * v, ...P, prio: 2 });
        this.noise({ dur: 0.08, f: 2400, type: 'highpass', vol: 0.18 * v, ...P });
        break;
      case 'flame':
        this.noise({ dur: 0.5, f: 1400, f2: 300, q: 0.6, vol: 0.34 * v, ...P, attack: 0.04, send: 0.2 });
        this.tone({ f: 90, f2: 50, dur: 0.4, type: 'sawtooth', vol: 0.12 * v, ...P });
        break;
      case 'rush':
        this.noise({ dur: 0.3, f: 500, f2: 2500, q: 1.2, vol: 0.3 * v, ...P });
        this.tone({ f: 200, f2: 90, dur: 0.25, type: 'square', vol: 0.08 * v, ...P });
        break;
      case 'ring':
        this.tone({ f: 80, f2: 240, dur: 0.65, type: 'sawtooth', vol: 0.14 * v, ...P, attack: 0.3 });
        this.tone({ f: 60, f2: 30, dur: 0.6, type: 'sine', vol: 0.5 * v, at: 0.62, ...P, send: 0.3, prio: 3 });
        this.noise({ dur: 0.5, f: 1800, f2: 200, vol: 0.3 * v, at: 0.62, ...P });
        break;
      case 'chain':
        for (let i = 0; i < 5; i++) this.tone({ f: 1800 + i * 330, f2: 1200, dur: 0.07, type: 'square', vol: 0.06 * v, at: i * 0.035, ...P });
        this.noise({ dur: 0.2, f: 3000, type: 'highpass', vol: 0.1 * v, ...P });
        break;
      case 'stance':
        this.tone({ f: 70, f2: 180, dur: 0.6, type: 'sawtooth', vol: 0.16 * v, ...P, attack: 0.2, send: 0.25 });
        this.noise({ dur: 0.6, f: 600, f2: 1800, vol: 0.2 * v, ...P });
        break;
      case 'standard':
        this.tone({ f: 330, dur: 1.1, type: 'sine', vol: 0.22 * v, ...P, send: 0.5 });
        this.tone({ f: 495, dur: 0.9, type: 'sine', vol: 0.12 * v, ...P, send: 0.5 });
        break;
      case 'bow':
        this.tone({ f: 520, f2: 140, dur: 0.14, type: 'triangle', vol: 0.22 * v, ...P });
        this.noise({ dur: 0.1, f: 2600, f2: 900, vol: 0.14 * v, ...P });
        break;
      case 'volley':
        for (let i = 0; i < 5; i++) {
          this.noise({ dur: 0.08, f: 3200, f2: 800, vol: 0.12 * v, at: i * 0.012, ...P });
          this.tone({ f: 420 - i * 18, f2: 120, dur: 0.1, type: 'triangle', vol: 0.1 * v, at: i * 0.012, ...P });
        }
        break;
      case 'ghost':
        this.tone({ f: 1400, f2: 500, dur: 0.5, type: 'sine', vol: 0.2 * v, ...P, send: 0.5 });
        this.noise({ dur: 0.4, f: 4000, f2: 1000, vol: 0.12 * v, ...P });
        break;
      case 'trap':
        this.tone({ f: 200, f2: 600, dur: 0.18, type: 'square', vol: 0.1 * v, ...P });
        break;
      case 'trapSnap':
        this.tone({ f: 120, f2: 40, dur: 0.3, type: 'sawtooth', vol: 0.3 * v, ...P, send: 0.2, prio: 2 });
        this.noise({ dur: 0.2, f: 1800, type: 'highpass', vol: 0.2 * v, ...P });
        break;
      case 'cloak':
        this.noise({ dur: 0.5, f: 1200, f2: 300, q: 0.4, vol: 0.2 * v, ...P });
        this.tone({ f: 600, f2: 200, dur: 0.5, type: 'sine', vol: 0.1 * v, ...P, send: 0.4 });
        break;
      case 'flask':
        this.tone({ f: 900, f2: 300, dur: 0.2, type: 'sine', vol: 0.15 * v, ...P, send: 0.3 });
        this.noise({ dur: 0.3, f: 2000, f2: 600, vol: 0.15 * v, ...P });
        break;
      case 'barrage':
        for (let i = 0; i < 9; i++) {
          this.tone({ f: 800 - i * 20, f2: 200, dur: 0.12, type: 'triangle', vol: 0.09 * v, at: 0.3 + i * 0.19, ...P });
          this.noise({ dur: 0.1, f: 1500, type: 'highpass', vol: 0.08 * v, at: 0.3 + i * 0.19, ...P });
        }
        break;
      case 'evade':
        this.noise({ dur: 0.22, f: 900, f2: 2800, q: 0.8, vol: 0.2 * v });
        break;
      case 'evadeHit':
        this.tone({ f: 1500, f2: 800, dur: 0.18, type: 'sine', vol: 0.2 * v, send: 0.3 });
        break;
      case 'evadeReady':
        this.tone({ f: 1100, dur: 0.07, type: 'sine', vol: 0.07 * v, dest: this.bus.ui });
        break;
      case 'block':
        this.tone({ f: 600, f2: 400, dur: 0.18, type: 'square', vol: 0.18 * v, ...P, prio: 2 });
        this.noise({ dur: 0.12, f: 3500, type: 'highpass', vol: 0.18 * v, ...P });
        this.tone({ f: 1800, dur: 0.3, type: 'sine', vol: 0.08 * v, ...P, send: 0.4 });
        break;
      case 'die':
        this.tone({ f: 200, f2: 50, dur: 0.35, type: 'sawtooth', vol: 0.2 * v, ...P });
        this.noise({ dur: 0.3, f: 700, f2: 150, vol: 0.2 * v, ...P });
        break;
      case 'bossDie':
        this.tone({ f: 90, f2: 25, dur: 2.0, type: 'sawtooth', vol: 0.4 * v, send: 0.6, prio: 4 });
        this.noise({ dur: 1.6, f: 900, f2: 90, vol: 0.4 * v, send: 0.5, prio: 4 });
        this.duck(0.6, 1.5);
        break;
      case 'bossRoar':
        this.tone({ f: 70, f2: 38, dur: 1.2, type: 'sawtooth', vol: 0.34 * v, send: 0.5, prio: 4 });
        this.tone({ f: 140, f2: 70, dur: 1.0, type: 'square', vol: 0.1 * v, prio: 4 });
        this.duck(0.5, 1.0);
        break;
      case 'enemySwing':
        this.noise({ dur: 0.2, f: 600, f2: 200, vol: 0.2 * v, ...P, floor: 0.3 });
        break;
      case 'shoot':
        this.tone({ f: 700, f2: 300, dur: 0.12, type: 'square', vol: 0.1 * v, ...P, floor: 0.35 });
        break;
      case 'ward':
        this.tone({ f: 880, dur: 0.5, type: 'sine', vol: 0.14 * v, ...P, send: 0.5 });
        this.tone({ f: 1320, dur: 0.4, type: 'sine', vol: 0.08 * v, ...P, send: 0.5 });
        break;
      case 'hook':
        for (let i = 0; i < 6; i++) this.tone({ f: 1500 + (i % 2) * 400, f2: 900, dur: 0.05, type: 'square', vol: 0.06 * v, at: i * 0.03, ...P, floor: 0.35 });
        break;
      case 'hookHit':
        this.tone({ f: 200, f2: 70, dur: 0.2, type: 'sawtooth', vol: 0.3 * v, ...P, prio: 2 });
        break;
      case 'lunge':
        this.noise({ dur: 0.2, f: 500, f2: 3000, vol: 0.22 * v, ...P, floor: 0.35 });
        break;
      case 'slam':
        this.tone({ f: 70, f2: 28, dur: 0.5, type: 'sine', vol: 0.55 * v, ...P, send: 0.35, prio: 3, floor: 0.4 });
        this.noise({ dur: 0.35, f: 900, f2: 120, vol: 0.3 * v, ...P, floor: 0.4 });
        break;
      case 'spike':
        this.noise({ dur: 0.1, f: 4000, type: 'highpass', vol: 0.18 * v, ...P });
        break;
      // telegraph cues stay audible through the combat mix (floor gain)
      case 'tele_swipe':
      case 'tele_sweep':
        this.tone({ f: 380, f2: 620, dur: 0.22, type: 'triangle', vol: 0.12 * v, ...P, floor: 0.4, prio: 3 });
        break;
      case 'tele_slam':
        this.tone({ f: 90, f2: 200, dur: 0.7, type: 'sawtooth', vol: 0.14 * v, ...P, floor: 0.5, prio: 3, attack: 0.3 });
        this.tone({ f: 60, dur: 0.7, type: 'sine', vol: 0.2 * v, ...P, floor: 0.5, prio: 3 });
        break;
      case 'tele_shoot':
        this.tone({ f: 1500, f2: 1900, dur: 0.18, type: 'sine', vol: 0.1 * v, ...P, floor: 0.4, prio: 3 });
        break;
      case 'tele_explode':
        for (let i = 0; i < 5; i++) this.tone({ f: 1800 + i * 160, dur: 0.06, type: 'square', vol: 0.08 * v, at: i * 0.13, ...P, floor: 0.45, prio: 3 });
        break;
      case 'tele_hook':
        for (let i = 0; i < 4; i++) this.tone({ f: 1300, f2: 800, dur: 0.05, type: 'square', vol: 0.07 * v, at: i * 0.05, ...P, floor: 0.4, prio: 3 });
        break;
      case 'tele_zone':
        this.noise({ dur: 0.7, f: 500, f2: 1300, q: 3, vol: 0.14 * v, ...P, floor: 0.4, prio: 3 });
        break;
      case 'tele_lunge':
        this.tone({ f: 220, f2: 330, dur: 0.4, type: 'sawtooth', vol: 0.1 * v, ...P, floor: 0.4, prio: 3 });
        break;
      case 'tele_ward':
        this.tone({ f: 700, f2: 1000, dur: 0.4, type: 'sine', vol: 0.1 * v, ...P, floor: 0.4, prio: 3 });
        break;
      case 'tele_pulse':
        this.tone({ f: 200, f2: 480, dur: 0.9, type: 'sine', vol: 0.16 * v, ...P, floor: 0.5, prio: 3, send: 0.2 });
        break;
      case 'tele_beam':
        this.tone({ f: 110, f2: 320, dur: 1.3, type: 'sawtooth', vol: 0.13 * v, floor: 0.7, prio: 4, attack: 0.5 });
        this.noise({ dur: 1.3, f: 800, f2: 4000, q: 2, vol: 0.1 * v, floor: 0.7, prio: 4, attack: 0.6 });
        break;
      case 'tele_overload':
        for (let i = 0; i < 5; i++) {
          this.tone({ f: 300, f2: 560, dur: 0.45, type: 'sawtooth', vol: 0.14 * v, at: i * 0.5, floor: 0.8, prio: 4 });
        }
        break;
      case 'tele_quad':
        this.tone({ f: 100, f2: 260, dur: 1.5, type: 'sawtooth', vol: 0.12 * v, floor: 0.7, prio: 4, attack: 0.6 });
        break;
      case 'tele_summon':
        this.noise({ dur: 0.9, f: 1500, f2: 700, q: 4, vol: 0.12 * v, ...P, floor: 0.5 });
        this.tone({ f: 260, f2: 130, dur: 0.9, type: 'sine', vol: 0.12 * v, ...P, floor: 0.5, send: 0.3 });
        break;
      case 'armorBreak':
        this.tone({ f: 300, f2: 80, dur: 0.5, type: 'sawtooth', vol: 0.4 * v, send: 0.4, prio: 4 });
        this.noise({ dur: 0.4, f: 4200, type: 'highpass', vol: 0.4 * v, prio: 4 });
        this.tone({ f: 1760, dur: 0.7, type: 'sine', vol: 0.18 * v, at: 0.1, send: 0.5 });
        this.duck(0.4, 0.5);
        break;
      case 'aggro':
        this.tone({ f: 160, f2: 110, dur: 0.18, type: 'sawtooth', vol: 0.06 * v, ...P });
        break;
      case 'coin':
        this.tone({ f: 1760, dur: 0.12, type: 'sine', vol: 0.12 * v, dest: this.bus.ui });
        this.tone({ f: 2349, dur: 0.14, type: 'sine', vol: 0.1 * v, at: 0.05, dest: this.bus.ui });
        break;
      case 'potion':
        this.noise({ dur: 0.35, f: 1200, f2: 500, q: 2, vol: 0.18 * v });
        this.tone({ f: 400, f2: 700, dur: 0.3, type: 'sine', vol: 0.1 * v });
        break;
      case 'potionPick':
      case 'pickup':
        this.tone({ f: 880, f2: 1180, dur: 0.12, type: 'sine', vol: 0.14 * v, dest: this.bus.ui });
        break;
      case 'drop':
        this.tone({ f: 600, f2: 400, dur: 0.1, type: 'triangle', vol: 0.12 * v, ...P });
        break;
      case 'dropRare':
        this.tone({ f: 784, dur: 0.5, type: 'sine', vol: 0.2 * v, ...P, send: 0.5, floor: 0.4 });
        this.tone({ f: 1175, dur: 0.6, type: 'sine', vol: 0.14 * v, at: 0.08, ...P, send: 0.5, floor: 0.4 });
        break;
      case 'dropRelic':
        [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone({ f, dur: 0.9, type: 'sine', vol: 0.18 * v, at: i * 0.09, send: 0.7, prio: 4 }));
        this.tone({ f: 130, dur: 1.2, type: 'sawtooth', vol: 0.1 * v, send: 0.5 });
        this.duck(0.35, 0.8);
        break;
      case 'equip':
        this.tone({ f: 300, f2: 200, dur: 0.12, type: 'square', vol: 0.1 * v, dest: this.bus.ui });
        this.noise({ dur: 0.1, f: 3000, type: 'highpass', vol: 0.12 * v, dest: this.bus.ui });
        break;
      case 'craft':
        this.tone({ f: 1500, f2: 800, dur: 0.1, type: 'square', vol: 0.1 * v, dest: this.bus.ui });
        this.tone({ f: 988, dur: 0.4, type: 'sine', vol: 0.12 * v, at: 0.08, dest: this.bus.ui, send: 0.3 });
        break;
      case 'salvage':
        this.noise({ dur: 0.25, f: 2000, type: 'highpass', vol: 0.2 * v, dest: this.bus.ui });
        this.tone({ f: 180, f2: 80, dur: 0.2, type: 'sawtooth', vol: 0.12 * v, dest: this.bus.ui });
        break;
      case 'identify':
        this.tone({ f: 660, dur: 0.3, type: 'sine', vol: 0.14 * v, dest: this.bus.ui, send: 0.4 });
        this.tone({ f: 990, dur: 0.4, type: 'sine', vol: 0.12 * v, at: 0.1, dest: this.bus.ui, send: 0.4 });
        break;
      case 'interact':
        this.tone({ f: 440, f2: 520, dur: 0.1, type: 'triangle', vol: 0.1 * v, dest: this.bus.ui });
        break;
      case 'chest':
        this.tone({ f: 180, f2: 120, dur: 0.3, type: 'sawtooth', vol: 0.2 * v, ...P });
        this.noise({ dur: 0.3, f: 2500, type: 'highpass', vol: 0.15 * v, ...P });
        break;
      case 'waypoint':
        [392, 523, 659, 784].forEach((f, i) => this.tone({ f, dur: 1.2, type: 'sine', vol: 0.16 * v, at: i * 0.12, send: 0.7, dest: this.bus.ui }));
        break;
      case 'quest':
        this.tone({ f: 523, dur: 0.4, type: 'triangle', vol: 0.16 * v, dest: this.bus.ui, send: 0.3 });
        this.tone({ f: 784, dur: 0.6, type: 'triangle', vol: 0.16 * v, at: 0.16, dest: this.bus.ui, send: 0.3 });
        break;
      case 'levelup':
        [392, 494, 587, 784, 988].forEach((f, i) => this.tone({ f, dur: 0.8, type: 'sine', vol: 0.2 * v, at: i * 0.08, send: 0.6, dest: this.bus.ui }));
        this.duck(0.3, 0.8);
        break;
      case 'ui':
        this.tone({ f: 520, dur: 0.06, type: 'triangle', vol: 0.1 * v, dest: this.bus.ui });
        break;
      case 'invalid':
        this.tone({ f: 130, dur: 0.16, type: 'square', vol: 0.12 * v, dest: this.bus.ui });
        break;
      case 'channel':
        this.tone({ f: 200, f2: 500, dur: 3, type: 'sine', vol: 0.16 * v, attack: 1.2, dest: this.bus.ui, send: 0.5 });
        break;
      case 'townGate':
        this.noise({ dur: 0.8, f: 400, f2: 3000, vol: 0.3 * v, send: 0.5 });
        this.tone({ f: 80, f2: 400, dur: 0.8, type: 'sawtooth', vol: 0.2 * v, send: 0.4 });
        break;
      case 'echo':
        [440, 554, 659].forEach((f, i) => this.tone({ f, dur: 1.4, type: 'sine', vol: 0.16 * v, at: i * 0.1, send: 0.8, dest: this.bus.ui }));
        break;
      case 'playerDie':
        this.tone({ f: 130, f2: 40, dur: 1.4, type: 'sawtooth', vol: 0.3 * v, send: 0.6, prio: 4 });
        this.noise({ dur: 1.0, f: 600, f2: 80, vol: 0.25 * v, prio: 4 });
        break;
      default:
        break;
    }
  }

  /** Player vocal bark (cosmetic voice preset): formant noise burst, rate-limited. */
  bark(kind: 'attack' | 'hurt') {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    if (now < this.barkT) return;
    this.barkT = now + (kind === 'attack' ? 1.1 + Math.random() * 1.5 : 0.7);
    const p = this.voicePitch;
    const base = (kind === 'attack' ? 190 : 150) * p;
    this.tone({ f: base * 1.2, f2: base * 0.8, dur: 0.16, type: 'sawtooth', vol: 0.06, prio: 0 });
    this.noise({ dur: 0.16, f: 800 * p, q: 3, vol: 0.05, prio: 0 });
  }

  // ------------------------------------------------------------ events
  handle(ev: GameEvent, playerPos: { x: number; z: number }) {
    switch (ev.t) {
      case 'hit': {
        if (ev.onPlayer) {
          this.play(ev.blocked ? 'block' : 'impact', undefined, undefined, 0.8);
          if (!ev.blocked) this.bark('hurt');
        } else {
          this.play(ev.crit ? 'impact' : ev.blocked ? 'block' : 'impact', ev.x, ev.z, ev.crit ? 1.3 : 0.7);
          if (ev.crit) this.tone({ f: 1500, dur: 0.18, type: 'sine', vol: 0.1, send: 0.3, x: ev.x, z: ev.z });
        }
        break;
      }
      case 'sfx':
        this.play(ev.id, ev.x, ev.z, ev.vol ?? 1);
        break;
      case 'swing':
        if (ev.skill === 'iron_litany' || ev.skill === 'brand_arc') this.bark('attack');
        break;
      case 'telegraph': {
        void playerPos;
        break;
      }
      case 'levelup':
        break;
      case 'music':
        this.setMusic(ev.mode as Mode);
        break;
      case 'victory':
        this.setMusic('victory');
        break;
      case 'death':
        this.setMusic('death');
        break;
      default:
        break;
    }
  }

  // ------------------------------------------------------------ music & ambience
  private layer(mode: Mode, build: (out: GainNode) => void) {
    const c = this.ctx!;
    const g = c.createGain();
    g.gain.value = 0;
    g.connect(this.bus.music);
    this.musicLayers[mode] = g;
    build(g);
  }

  private drone(out: GainNode, freqs: number[], type: OscillatorType, vol: number, cutoff: number, lfoRate = 0.07) {
    const c = this.ctx!;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = cutoff;
    lp.Q.value = 0.7;
    const g = c.createGain();
    g.gain.value = vol;
    lp.connect(g);
    g.connect(out);
    const send = c.createGain();
    send.gain.value = 0.4;
    g.connect(send);
    send.connect(this.reverbSend);
    const lfo = c.createOscillator();
    lfo.frequency.value = lfoRate;
    const lg = c.createGain();
    lg.gain.value = cutoff * 0.35;
    lfo.connect(lg);
    lg.connect(lp.frequency);
    lfo.start();
    for (const f of freqs) {
      for (const det of [-6, 5]) {
        const o = c.createOscillator();
        o.type = type;
        o.frequency.value = f;
        o.detune.value = det;
        o.connect(lp);
        o.start();
      }
    }
  }

  private buildMusic() {
    this.layer('town', (o) => {
      this.drone(o, [110, 164.81, 261.63], 'sawtooth', 0.09, 700, 0.05);
      this.drone(o, [55], 'sine', 0.2, 300);
    });
    this.layer('wild', (o) => {
      this.drone(o, [73.42, 110, 174.61], 'sawtooth', 0.08, 560, 0.06);
      this.drone(o, [36.7], 'sine', 0.22, 250);
    });
    this.layer('crypt', (o) => {
      this.drone(o, [65.41, 92.5, 130.81], 'sawtooth', 0.08, 500, 0.04);
      this.drone(o, [32.7], 'sine', 0.24, 200);
    });
    this.layer('boss', (o) => {
      this.drone(o, [55, 82.41, 116.54], 'sawtooth', 0.1, 900, 0.18);
      this.drone(o, [27.5], 'sine', 0.26, 240);
    });
    this.layer('death', (o) => this.drone(o, [49, 73.4], 'sine', 0.18, 300, 0.03));
    this.layer('victory', (o) => this.drone(o, [130.81, 196, 261.63, 329.63], 'triangle', 0.1, 1400, 0.06));
    this.musicStarted = true;
  }

  private buildAmbience() {
    const c = this.ctx!;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 420;
    f.Q.value = 0.6;
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.11;
    const lg = c.createGain();
    lg.gain.value = 220;
    lfo.connect(lg);
    lg.connect(f.frequency);
    lfo.start();
    const g = c.createGain();
    g.gain.value = 0.0;
    src.connect(f);
    f.connect(g);
    g.connect(this.bus.ambient);
    src.start();
    this.windGain = g;
  }

  setMusic(mode: Mode) {
    if (!this.ctx || !this.musicStarted || this.mode === mode) return;
    this.mode = mode;
    const t = this.ctx.currentTime;
    for (const k of Object.keys(this.musicLayers) as Mode[]) {
      const g = this.musicLayers[k]!;
      g.gain.setTargetAtTime(k === mode ? 1 : 0, t, mode === 'boss' ? 0.4 : 1.4);
    }
    if (this.windGain) this.windGain.gain.setTargetAtTime(mode === 'wild' ? 0.5 : mode === 'town' ? 0.22 : mode === 'crypt' ? 0.1 : 0.05, t, 1.5);
    if (mode === 'victory') [523, 659, 784, 1047].forEach((f, i) => this.tone({ f, dur: 2.4, type: 'sine', vol: 0.2, at: i * 0.15, send: 0.8, dest: this.bus.ui }));
  }

  /** Called each frame with light game state for adaptive layers and ambience pings. */
  update(dt: number, s: { hpFrac: number; bossPhase: number; inBoss: boolean; dead: boolean }) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const c = this.ctx;
    const now = c.currentTime;
    // low-health heartbeat
    this.lowHp = s.hpFrac < 0.3 && !s.dead;
    if (this.lowHp) {
      this.heartT -= dt;
      if (this.heartT <= 0) {
        this.heartT = 0.4 + s.hpFrac * 1.6;
        this.tone({ f: 60, f2: 40, dur: 0.14, type: 'sine', vol: 0.4, dest: this.bus.ui });
        this.tone({ f: 56, f2: 38, dur: 0.14, type: 'sine', vol: 0.3, at: 0.17, dest: this.bus.ui });
      }
    }
    // boss rhythm
    if (this.mode === 'boss' && s.inBoss) {
      this.bossIntensity += (s.bossPhase - this.bossIntensity) * dt * 0.5;
      const bpm = 84 + this.bossIntensity * 14;
      const beat = 60 / bpm / 2;
      if (this.nextBeat < now) this.nextBeat = now + 0.05;
      while (this.nextBeat < now + 0.15) {
        const i = this.beatIdx++ % 8;
        const t = this.nextBeat - now;
        if (i % 4 === 0) this.tone({ f: 70, f2: 38, dur: 0.22, type: 'sine', vol: 0.5, at: t, dest: this.bus.music });
        if (i % 4 === 2) this.noise({ dur: 0.1, f: 2200, type: 'highpass', vol: 0.12, at: t, dest: this.bus.music });
        if (i === 3 || i === 7) this.tone({ f: [110, 130.8, 146.8, 116.5][(this.beatIdx >> 1) % 4], dur: 0.3, type: 'sawtooth', vol: 0.08, at: t, dest: this.bus.music });
        this.nextBeat += beat;
      }
    }
    // sparse bells / drips per mode
    if (Math.random() < dt * (this.mode === 'crypt' ? 0.5 : this.mode === 'wild' ? 0.18 : this.mode === 'town' ? 0.12 : 0)) {
      const scale = [293.66, 349.23, 440, 523.25, 587.33];
      if (this.mode === 'crypt') this.tone({ f: 1500 + Math.random() * 1500, f2: 900, dur: 0.15, type: 'sine', vol: 0.08, dest: this.bus.ambient, send: 0.9, prio: 0 });
      else this.tone({ f: scale[Math.floor(Math.random() * scale.length)] * (Math.random() < 0.3 ? 0.5 : 1), dur: 3, type: 'sine', vol: 0.09, dest: this.bus.ambient, send: 0.9, prio: 0 });
    }
    if (this.mode === 'town' && Math.random() < dt * 4) this.noise({ dur: 0.05, f: 3000, type: 'highpass', vol: 0.03, dest: this.bus.ambient, prio: 0 });
  }

  dispose() {
    for (const t of this.timers) window.clearTimeout(t);
    void this.ctx?.close();
    this.ctx = null;
  }
}
