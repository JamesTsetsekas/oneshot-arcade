// Procedural Web Audio: every sound is synthesised at runtime (no sample
// files). Spatial events use PannerNodes, distance low-pass "tails", a voice
// cap, and priority (threats before ambience).

import { getSettings } from '../settings';
import type { WeaponClass } from '../../shared/content/weapons';

type V = { x: number; y: number; z: number };

const MAX_VOICES = 56;

export class AudioEngine {
  ctx: AudioContext | null = null;
  master!: GainNode;
  sfx!: GainNode;
  music!: GainNode;
  private noiseBuf!: AudioBuffer;
  private voices = 0;
  private listener: V = { x: 0, y: 0, z: 0 };
  private musicNodes: { stop: () => void } | null = null;
  private musicMode: 'none' | 'menu' | 'match' = 'none';
  private stormNode: { gain: GainNode; filter: BiquadFilterNode } | null = null;
  private windNode: { gain: GainNode; filter: BiquadFilterNode } | null = null;
  private humNodes = new Map<number, { osc: OscillatorNode; gain: GainNode; pan: PannerNode }>();
  tension = 0;

  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume(); return true; }
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
    } catch { return false; }
    const c = this.ctx;
    this.master = c.createGain();
    this.sfx = c.createGain();
    this.music = c.createGain();
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    this.sfx.connect(this.master); this.music.connect(this.master); this.master.connect(comp); comp.connect(c.destination);
    this.noiseBuf = c.createBuffer(1, c.sampleRate * 1.5, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    let seed = 1;
    for (let i = 0; i < d.length; i++) { seed = (seed * 16807) % 2147483647; d[i] = (seed / 2147483647) * 2 - 1; }
    this.applyVolumes();
    return true;
  }

  applyVolumes() {
    if (!this.ctx) return;
    const s = getSettings();
    this.master.gain.value = s.masterVol;
    this.sfx.gain.value = s.sfxVol;
    this.music.gain.value = s.musicVol * 0.5;
  }

  setListener(p: V, yaw: number) {
    this.listener = p;
    const c = this.ctx;
    if (!c) return;
    const l = c.listener;
    const fx = Math.sin(yaw), fz = Math.cos(yaw);
    if (l.positionX) {
      l.positionX.value = p.x; l.positionY.value = p.y; l.positionZ.value = p.z;
      l.forwardX.value = fx; l.forwardY.value = 0; l.forwardZ.value = fz;
      l.upX.value = 0; l.upY.value = 1; l.upZ.value = 0;
    } else {
      (l as unknown as { setPosition: (...a: number[]) => void }).setPosition(p.x, p.y, p.z);
      (l as unknown as { setOrientation: (...a: number[]) => void }).setOrientation(fx, 0, fz, 0, 1, 0);
    }
  }

  private out(pos: V | null, priority: number): AudioNode | null {
    const c = this.ctx;
    if (!c) return null;
    if (this.voices >= MAX_VOICES && priority < 2) return null;
    if (!pos) return this.sfx;
    const p = c.createPanner();
    p.panningModel = 'equalpower';
    p.distanceModel = 'inverse';
    p.refDistance = 5;
    p.rolloffFactor = 1.1;
    p.maxDistance = 600;
    if (p.positionX) { p.positionX.value = pos.x; p.positionY.value = pos.y; p.positionZ.value = pos.z; }
    else (p as unknown as { setPosition: (...a: number[]) => void }).setPosition(pos.x, pos.y, pos.z);
    // distance tail: far sounds lose highs
    const d = Math.hypot(pos.x - this.listener.x, pos.y - this.listener.y, pos.z - this.listener.z);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = Math.max(500, 16000 / (1 + d / 25));
    lp.connect(p);
    p.connect(this.sfx);
    return lp;
  }

  private track(node: AudioScheduledSourceNode) {
    this.voices++;
    node.onended = () => { this.voices--; };
  }

  private noise(dest: AudioNode, t0: number, dur: number, freq: number, q: number, gain: number, type: BiquadFilterType = 'bandpass', decay = 4) {
    const c = this.ctx!;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
    src.connect(f); f.connect(g); g.connect(dest);
    src.start(t0, Math.random() * 0.5, dur + 0.05);
    this.track(src);
    void decay;
  }

  private tone(dest: AudioNode, t0: number, dur: number, f0: number, f1: number, gain: number, type: OscillatorType = 'sine') {
    const c = this.ctx!;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + Math.min(0.01, dur / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest);
    o.start(t0); o.stop(t0 + dur + 0.05);
    this.track(o);
  }

  // ---------------------------------------------------------------- events
  shot(cls: WeaponClass, pos: V | null, own: boolean) {
    if (!this.ctx) return;
    const d = this.out(pos, own ? 3 : 2);
    if (!d) return;
    const t = this.ctx.currentTime;
    const v = own ? 0.5 : 0.9;
    switch (cls) {
      case 'shotgun': this.noise(d, t, 0.35, 900, 0.6, v * 1.1, 'lowpass'); this.tone(d, t, 0.18, 110, 40, v * 0.8, 'triangle'); break;
      case 'dmr': this.noise(d, t, 0.3, 2200, 0.8, v); this.tone(d, t, 0.2, 180, 60, v * 0.7, 'square'); break;
      case 'rail': this.tone(d, t, 0.45, 1400, 180, v * 0.6, 'sawtooth'); this.noise(d, t, 0.3, 3200, 1, v * 0.6); break;
      case 'launcher': this.noise(d, t, 0.5, 400, 0.8, v * 0.9, 'lowpass'); this.tone(d, t, 0.4, 300, 80, v * 0.5, 'sine'); break;
      case 'pistol': this.noise(d, t, 0.14, 2600, 1.2, v * 0.8); this.tone(d, t, 0.08, 260, 90, v * 0.4, 'square'); break;
      case 'smg': this.noise(d, t, 0.09, 3200, 1.4, v * 0.6); this.tone(d, t, 0.05, 330, 120, v * 0.3, 'square'); break;
      default: this.noise(d, t, 0.13, 1800, 1.0, v * 0.8); this.tone(d, t, 0.07, 220, 70, v * 0.45, 'square');
    }
  }
  footstep(pos: V, loud: boolean, water: boolean) {
    if (!this.ctx || this.voices > 40) return;
    const d = this.out(pos, 1); if (!d) return;
    const t = this.ctx.currentTime;
    if (water) this.noise(d, t, 0.18, 700, 0.7, loud ? 0.35 : 0.2, 'lowpass');
    else this.noise(d, t, 0.07, 500 + Math.random() * 300, 1.5, loud ? 0.5 : 0.28);
  }
  move(kind: string, pos: V | null) {
    if (!this.ctx) return;
    const d = this.out(pos, 1); if (!d) return;
    const t = this.ctx.currentTime;
    switch (kind) {
      case 'jump': this.noise(d, t, 0.1, 600, 1, 0.2); break;
      case 'land': this.noise(d, t, 0.18, 200, 0.7, 0.6, 'lowpass'); break;
      case 'slide': this.noise(d, t, 0.8, 1200, 0.5, 0.25, 'highpass'); break;
      case 'mantle': this.noise(d, t, 0.25, 400, 0.8, 0.3); break;
      case 'splash': this.noise(d, t, 0.6, 900, 0.4, 0.5, 'lowpass'); break;
      case 'vent': this.noise(d, t, 1.2, 300, 0.4, 0.6, 'lowpass'); this.tone(d, t, 1.0, 120, 420, 0.25, 'sawtooth'); break;
      case 'deploy': this.noise(d, t, 0.35, 1800, 0.6, 0.35, 'highpass'); this.tone(d, t, 0.3, 500, 900, 0.1, 'triangle'); break;
      case 'zip': case 'ascend': this.tone(d, t, 0.4, 600, 1200, 0.15, 'sawtooth'); break;
      case 'zipoff': this.noise(d, t, 0.2, 800, 1, 0.2); break;
      case 'melee': this.noise(d, t, 0.12, 300, 1, 0.5); break;
      case 'throw': this.noise(d, t, 0.15, 1500, 0.8, 0.25, 'highpass'); break;
    }
  }
  reload(pos: V | null) {
    if (!this.ctx) return;
    const d = this.out(pos, 1); if (!d) return;
    const t = this.ctx.currentTime;
    this.tone(d, t, 0.05, 1800, 1200, 0.15, 'square');
    this.tone(d, t + 0.25, 0.06, 1400, 900, 0.15, 'square');
  }
  hitMarker(kind: 'shield' | 'health' | 'head' | 'break' | 'kill') {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const d = this.sfx;
    if (kind === 'head') { this.tone(d, t, 0.12, 2400, 2300, 0.25, 'sine'); this.tone(d, t + 0.03, 0.12, 3200, 3100, 0.12); }
    else if (kind === 'shield') this.tone(d, t, 0.07, 1500, 1300, 0.18, 'triangle');
    else if (kind === 'break') { for (let i = 0; i < 4; i++) this.tone(d, t + i * 0.03, 0.2, 2600 - i * 400, 900, 0.14, 'triangle'); }
    else if (kind === 'kill') { this.tone(d, t, 0.25, 660, 660, 0.2, 'sine'); this.tone(d, t + 0.08, 0.3, 990, 990, 0.18); }
    else this.tone(d, t, 0.06, 900, 700, 0.16, 'square');
  }
  hurt(shield: boolean, broke: boolean) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (broke) { for (let i = 0; i < 5; i++) this.tone(this.sfx, t + i * 0.025, 0.25, 2000 - i * 300, 400, 0.12, 'triangle'); }
    else if (shield) this.noise(this.sfx, t, 0.12, 2500, 2, 0.3);
    else { this.noise(this.sfx, t, 0.15, 180, 0.8, 0.6, 'lowpass'); this.tone(this.sfx, t, 0.15, 90, 50, 0.35); }
  }
  ui(kind: 'click' | 'pickup' | 'deny' | 'heal' | 'healDone' | 'aegis' | 'storm' | 'capsule' | 'win' | 'charge' | 'echo', rarity = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const d = this.sfx;
    switch (kind) {
      case 'click': this.tone(d, t, 0.04, 900, 700, 0.08, 'square'); break;
      case 'pickup': { const base = 520 * Math.pow(1.19, rarity); this.tone(d, t, 0.12, base, base, 0.14, 'triangle'); this.tone(d, t + 0.06, 0.16, base * 1.5, base * 1.5, 0.1, 'triangle'); break; }
      case 'deny': this.tone(d, t, 0.15, 180, 140, 0.2, 'square'); break;
      case 'heal': this.tone(d, t, 0.5, 300, 600, 0.08, 'sine'); break;
      case 'healDone': this.tone(d, t, 0.2, 700, 900, 0.12, 'sine'); break;
      case 'aegis': this.tone(d, t, 0.6, 400, 1200, 0.1, 'sine'); break;
      case 'storm': for (let i = 0; i < 3; i++) this.tone(d, t + i * 0.35, 0.3, 330, 300, 0.18, 'sawtooth'); break;
      case 'capsule': this.tone(d, t, 0.6, 880, 440, 0.15, 'triangle'); this.tone(d, t + 0.3, 0.6, 660, 330, 0.12, 'triangle'); break;
      case 'win': [523, 659, 784, 1046].forEach((f, i) => this.tone(d, t + i * 0.15, 0.6, f, f, 0.15, 'triangle')); break;
      case 'charge': this.tone(d, t, 0.3, 300, 1500, 0.12, 'sawtooth'); break;
      case 'echo': for (let i = 0; i < 3; i++) this.tone(d, t + i * 0.2, 0.4, 1200, 600, 0.1 / (i + 1), 'sine'); break;
    }
  }
  explode(pos: V, kind: string) {
    if (!this.ctx) return;
    const d = this.out(pos, 2); if (!d) return;
    const t = this.ctx.currentTime;
    if (kind === 'mist') this.noise(d, t, 1.4, 1200, 0.3, 0.4, 'highpass');
    else { this.noise(d, t, 0.8, 300, 0.5, 0.9, 'lowpass'); this.tone(d, t, 0.6, 160, 40, 0.5); }
  }

  /** Looped resonance-chest hums near the listener. */
  updateHums(chests: { id: number; x: number; y: number; z: number }[]) {
    const c = this.ctx;
    if (!c) return;
    const keep = new Set<number>();
    for (const ch of chests.slice(0, 4)) {
      keep.add(ch.id);
      if (!this.humNodes.has(ch.id)) {
        const osc = c.createOscillator(); osc.type = 'sine'; osc.frequency.value = 196 + (ch.id % 5) * 12;
        const lfo = c.createOscillator(); lfo.frequency.value = 3; const lg = c.createGain(); lg.gain.value = 6; lfo.connect(lg); lg.connect(osc.frequency); lfo.start();
        const gain = c.createGain(); gain.gain.value = 0.07;
        const pan = c.createPanner(); pan.distanceModel = 'linear'; pan.refDistance = 1; pan.maxDistance = 16; pan.rolloffFactor = 1;
        if (pan.positionX) { pan.positionX.value = ch.x; pan.positionY.value = ch.y + 0.5; pan.positionZ.value = ch.z; }
        osc.connect(gain); gain.connect(pan); pan.connect(this.sfx); osc.start();
        this.humNodes.set(ch.id, { osc, gain, pan });
      }
    }
    for (const [id, n] of this.humNodes) if (!keep.has(id)) { n.osc.stop(); n.gain.disconnect(); this.humNodes.delete(id); }
  }

  /** Storm ambience (outside / near wall) and wind (falling, gliding). */
  setAmbience(storm: number, wind: number) {
    const c = this.ctx;
    if (!c) return;
    const mk = () => {
      const src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400;
      const g = c.createGain(); g.gain.value = 0;
      src.connect(f); f.connect(g); g.connect(this.sfx); src.start();
      return { gain: g, filter: f };
    };
    if (!this.stormNode) this.stormNode = mk();
    if (!this.windNode) this.windNode = mk();
    const t = c.currentTime;
    this.stormNode.gain.gain.setTargetAtTime(storm * 0.35, t, 0.3);
    this.stormNode.filter.frequency.setTargetAtTime(300 + storm * 900, t, 0.3);
    this.windNode.gain.gain.setTargetAtTime(wind * 0.25, t, 0.2);
    this.windNode.filter.frequency.setTargetAtTime(500 + wind * 2500, t, 0.2);
  }

  // ---------------------------------------------------------------- music
  playMusic(mode: 'menu' | 'match' | 'none') {
    if (!this.ensure() || this.musicMode === mode) return;
    this.musicNodes?.stop();
    this.musicNodes = null;
    this.musicMode = mode;
    if (mode === 'none') return;
    const c = this.ctx!;
    const bus = c.createGain(); bus.gain.value = 0; bus.connect(this.music);
    bus.gain.setTargetAtTime(mode === 'menu' ? 0.5 : 0.25, c.currentTime, 1.5);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = mode === 'menu' ? 1800 : 700; lp.connect(bus);
    // original progression: Dmaj9 – Bm7 – Gmaj7 – A6 (menu), suspended drone (match)
    const chords = mode === 'menu'
      ? [[146.8, 220, 277.2, 329.6], [123.5, 185, 220, 293.7], [98, 196, 246.9, 293.7], [110, 220, 277.2, 370]]
      : [[73.4, 110, 146.8], [69.3, 110, 138.6], [65.4, 98, 146.8], [73.4, 110, 164.8]];
    const oscs: OscillatorNode[] = [];
    const gains: GainNode[] = [];
    for (let v = 0; v < 4; v++) {
      for (const det of [-6, 6]) {
        const o = c.createOscillator(); o.type = mode === 'menu' ? 'sawtooth' : 'triangle'; o.detune.value = det;
        const g = c.createGain(); g.gain.value = v < chords[0].length ? 0.045 : 0;
        o.connect(g); g.connect(lp); o.start();
        oscs.push(o); gains.push(g);
      }
    }
    let step = 0;
    const arpG = c.createGain(); arpG.gain.value = mode === 'menu' ? 0.06 : 0.03; arpG.connect(bus);
    const tick = () => {
      const ch = chords[step % chords.length];
      const t = c.currentTime;
      oscs.forEach((o, i) => { const f = ch[Math.floor(i / 2) % ch.length]; o.frequency.setTargetAtTime(f, t, 0.4); });
      // sparse arpeggio
      for (let k = 0; k < 4; k++) {
        if (mode === 'match' && Math.random() > 0.3 + this.tension * 0.5) continue;
        const o = c.createOscillator(); o.type = 'triangle';
        o.frequency.value = ch[(k * 2 + step) % ch.length] * (mode === 'menu' ? 4 : 2);
        const g = c.createGain(); const tt = t + k * 0.5;
        g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(0.5, tt + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.45);
        o.connect(g); g.connect(arpG); o.start(tt); o.stop(tt + 0.5);
      }
      if (mode === 'match') lp.frequency.setTargetAtTime(500 + this.tension * 1400, t, 1);
      step++;
    };
    tick();
    const id = window.setInterval(tick, 2000);
    this.musicNodes = {
      stop: () => {
        window.clearInterval(id);
        const t = c.currentTime;
        bus.gain.setTargetAtTime(0, t, 0.4);
        setTimeout(() => { oscs.forEach((o) => o.stop()); bus.disconnect(); }, 1500);
      },
    };
  }

  stopAll() {
    this.playMusic('none');
    for (const [, n] of this.humNodes) n.osc.stop();
    this.humNodes.clear();
    this.setAmbience(0, 0);
  }
}

export const audio = new AudioEngine();
