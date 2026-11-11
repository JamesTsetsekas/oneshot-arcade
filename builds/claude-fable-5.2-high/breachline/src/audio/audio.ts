// audio: everything is synthesized with the Web Audio API at runtime (no sample files).
// Buses: sfx + music -> compressor -> master. Spatial voices use PannerNodes (HRTF for the closest few),
// with an occlusion low-pass, an indoor reverb send, and a hard voice cap with distance-based priority.
import type { WeaponDef } from '../content/weapons';

export interface Pos { x: number; y: number; z: number }
const MAX_VOICES = 48;

export class AudioSys {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfx!: GainNode;
  private musicBus!: GainNode;
  private musicDuck!: GainNode;
  private reverb!: ConvolverNode;
  private reverbSend!: GainNode;
  private noise!: AudioBuffer;
  private voices = 0;
  private hrtf = 0;
  private lx = 0; private ly = 0; private lz = 0;
  private vol = { master: 0.8, sfx: 0.9, music: 0.45 };
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private musicMode: 'off' | 'menu' | 'match' = 'off';
  private step = 0;
  private nextStep = 0;
  private intensity = 0.4;
  private duckUntil = 0;
  hitSounds = true;

  /** Must be called from a user gesture at least once. */
  unlock(): void {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private init(): void {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC({ latencyHint: 'interactive' }));
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 14; comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.18;
    this.master = ctx.createGain();
    this.sfx = ctx.createGain();
    this.musicBus = ctx.createGain();
    this.musicDuck = ctx.createGain();
    this.reverb = ctx.createConvolver();
    this.reverbSend = ctx.createGain();
    this.reverbSend.gain.value = 0.06;
    // impulse response: decaying filtered noise
    const len = Math.floor(ctx.sampleRate * 1.5);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      let lp = 0;
      for (let i = 0; i < len; i++) { const n = Math.random() * 2 - 1; lp += (n - lp) * 0.35; d[i] = lp * Math.pow(1 - i / len, 2.6); }
    }
    this.reverb.buffer = ir;
    this.sfx.connect(comp);
    this.sfx.connect(this.reverbSend); this.reverbSend.connect(this.reverb); this.reverb.connect(comp);
    this.musicBus.connect(this.musicDuck); this.musicDuck.connect(comp);
    comp.connect(this.master); this.master.connect(ctx.destination);
    const nb = (this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate));
    const nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    this.applyVolumes();
  }

  setVolumes(master: number, sfx: number, music: number): void { this.vol = { master, sfx, music }; this.applyVolumes(); }
  private applyVolumes(): void {
    if (!this.ctx) return;
    this.master.gain.value = this.vol.master;
    this.sfx.gain.value = this.vol.sfx;
    this.musicBus.gain.value = this.vol.music * 0.5;
  }

  setListener(x: number, y: number, z: number, fx: number, fy: number, fz: number): void {
    this.lx = x; this.ly = y; this.lz = z;
    const ctx = this.ctx;
    if (!ctx) return;
    const l = ctx.listener;
    // Web Audio is right-handed; our world is left-handed, so mirror Z consistently for positions and orientation.
    if (l.positionX) {
      l.positionX.value = x; l.positionY.value = y; l.positionZ.value = -z;
      l.forwardX.value = fx; l.forwardY.value = fy; l.forwardZ.value = -fz;
      l.upX.value = 0; l.upY.value = 1; l.upZ.value = 0;
    } else {
      (l as unknown as { setPosition(x: number, y: number, z: number): void }).setPosition(x, y, -z);
      (l as unknown as { setOrientation(...a: number[]): void }).setOrientation(fx, fy, -fz, 0, 1, 0);
    }
  }

  /** 0 = open air, 1 = fully indoors: drives the reverb send. */
  setIndoor(amount: number): void { if (this.ctx) this.reverbSend.gain.setTargetAtTime(0.05 + amount * 0.3, this.ctx.currentTime, 0.2); }

  // ---------------------------------------------------------------- primitives
  private out(pos: Pos | null, gain: number, lowpass: number): { node: AudioNode; ok: boolean } {
    const ctx = this.ctx!;
    if (this.voices >= MAX_VOICES) return { node: this.sfx, ok: false };
    const g = ctx.createGain();
    g.gain.value = gain;
    let tail: AudioNode = g;
    if (lowpass < 18000) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lowpass; g.connect(f); tail = f; }
    if (pos) {
      const p = ctx.createPanner();
      const d = Math.hypot(pos.x - this.lx, pos.y - this.ly, pos.z - this.lz);
      const useHrtf = d < 30 && this.hrtf < 6;
      p.panningModel = useHrtf ? 'HRTF' : 'equalpower';
      p.distanceModel = 'inverse'; p.refDistance = 5; p.rolloffFactor = 1.1; p.maxDistance = 400;
      p.positionX.value = pos.x; p.positionY.value = pos.y; p.positionZ.value = -pos.z;
      tail.connect(p); p.connect(this.sfx);
      if (useHrtf) { this.hrtf++; setTimeout(() => { this.hrtf--; }, 900); }
    } else tail.connect(this.sfx);
    this.voices++;
    setTimeout(() => { this.voices--; }, 700);
    return { node: g, ok: true };
  }

  private burst(dest: AudioNode, t: number, dur: number, type: BiquadFilterType, freq: number, q: number, gain: number, attack = 0.002, freqEnd = freq): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (freqEnd !== freq) f.frequency.exponentialRampToValueAtTime(Math.max(30, freqEnd), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(dest);
    src.start(t, Math.random() * 1.5, dur + 0.05);
  }

  private tone(dest: AudioNode, t: number, dur: number, f0: number, f1: number, type: OscillatorType, gain: number, attack = 0.003): void {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest);
    o.start(t); o.stop(t + dur + 0.02);
  }

  private dist(pos: Pos | null): number { return pos ? Math.hypot(pos.x - this.lx, pos.y - this.ly, pos.z - this.lz) : 0; }

  // ---------------------------------------------------------------- weapons
  gunshot(w: WeaponDef, pos: Pos | null, suppressed: boolean, occluded: boolean, indoor: boolean): void {
    if (!this.ctx) return;
    const s = w.snd, d = this.dist(pos);
    if (pos && d > 140) return;
    if (pos && this.voices > MAX_VOICES - 10 && d > 45) return; // voice priority: drop distant fire first
    const far = Math.min(1, d / 70);
    let lp = 18000 - far * 13500;
    if (occluded) lp = Math.min(lp, 1100);
    if (suppressed) lp = Math.min(lp, 1700);
    const gain = s.gain * (pos ? 1.0 : 0.62) * (suppressed ? 0.32 : 1) * (occluded ? 0.55 : 1);
    const o = this.out(pos, gain, lp);
    if (!o.ok) return;
    const t = this.ctx.currentTime;
    const p = s.pitch * (0.97 + Math.random() * 0.06);
    this.burst(o.node, t, 0.018, 'highpass', 3200 * p, 0.7, 0.9 * s.crack, 0.001);
    this.burst(o.node, t, 0.1 + 0.05 * s.body, 'bandpass', 1300 * p, 0.8, 0.95 * s.body, 0.001, 420 * p);
    this.tone(o.node, t, 0.1 + 0.04 * s.body, 190 * p, 52 * p, 'sine', 0.9 * s.body, 0.001);
    if (!suppressed) this.burst(o.node, t + 0.012, (indoor ? 0.22 : 0.42) + 0.3 * s.tail, 'lowpass', 900 * p, 0.4, 0.34 * s.tail, 0.012, 240);
    else this.burst(o.node, t, 0.07, 'bandpass', 2400, 2.5, 0.35, 0.001);
    if (!pos) this.burst(o.node, t + 0.02, 0.03, 'bandpass', 4200, 6, 0.12, 0.001); // mechanical action close to the ear
    this.duckUntil = performance.now() + 2500;
  }

  dryFire(): void { const o = this.quick(0.5); if (o) { this.burst(o, this.ctx!.currentTime, 0.02, 'bandpass', 3500, 5, 0.5, 0.001); } }
  private quick(gain: number): AudioNode | null { if (!this.ctx) return null; const o = this.out(null, gain, 18000); return o.ok ? o.node : null; }

  reloadStage(stage: number): void {
    const o = this.quick(0.5); if (!o) return;
    const t = this.ctx!.currentTime;
    if (stage === 0) { this.burst(o, t, 0.05, 'bandpass', 1800, 3, 0.4, 0.004); }
    else if (stage === 1) { this.burst(o, t, 0.03, 'bandpass', 2600, 6, 0.6, 0.001); this.burst(o, t + 0.05, 0.08, 'bandpass', 900, 2, 0.35, 0.01); }
    else if (stage === 2) { this.burst(o, t, 0.025, 'bandpass', 1900, 5, 0.8, 0.001); this.tone(o, t, 0.05, 240, 120, 'square', 0.12, 0.001); }
    else { this.burst(o, t, 0.02, 'bandpass', 3200, 7, 0.7, 0.001); this.burst(o, t + 0.09, 0.03, 'bandpass', 2300, 6, 0.9, 0.001); }
  }
  shell(): void { const o = this.quick(0.45); if (o) { const t = this.ctx!.currentTime; this.burst(o, t, 0.03, 'bandpass', 2100, 6, 0.7, 0.001); this.burst(o, t + 0.04, 0.03, 'bandpass', 1300, 4, 0.4, 0.002); } }
  pump(): void { const o = this.quick(0.5); if (o) { const t = this.ctx!.currentTime; this.burst(o, t, 0.05, 'bandpass', 1500, 3, 0.7, 0.003); this.burst(o, t + 0.16, 0.05, 'bandpass', 2000, 3, 0.8, 0.003); } }
  swap(): void { const o = this.quick(0.35); if (o) { const t = this.ctx!.currentTime; this.burst(o, t, 0.12, 'bandpass', 700, 0.8, 0.5, 0.03); this.burst(o, t + 0.16, 0.03, 'bandpass', 2800, 5, 0.4, 0.001); } }
  melee(hit: boolean): void {
    const o = this.quick(0.6); if (!o) return;
    const t = this.ctx!.currentTime;
    this.burst(o, t, 0.16, 'bandpass', 900, 1.2, 0.5, 0.05, 2600);
    if (hit) { this.burst(o, t + 0.08, 0.08, 'lowpass', 500, 1, 1.0, 0.001); this.tone(o, t + 0.08, 0.09, 130, 60, 'sine', 0.8, 0.001); }
  }
  throwSound(): void { const o = this.quick(0.4); if (o) this.burst(o, this.ctx!.currentTime, 0.2, 'bandpass', 600, 1, 0.5, 0.06, 1800); }
  pin(): void { const o = this.quick(0.5); if (o) { const t = this.ctx!.currentTime; this.burst(o, t, 0.02, 'bandpass', 4200, 8, 0.7, 0.001); this.tone(o, t + 0.03, 0.08, 2600, 2300, 'triangle', 0.15, 0.001); } }
  mantle(): void { const o = this.quick(0.4); if (o) { const t = this.ctx!.currentTime; this.burst(o, t, 0.25, 'lowpass', 500, 0.7, 0.6, 0.06); this.burst(o, t + 0.18, 0.08, 'lowpass', 300, 1, 0.7, 0.004); } }
  land(speed: number): void { const o = this.quick(Math.min(0.9, 0.25 + speed * 0.06)); if (o) { const t = this.ctx!.currentTime; this.burst(o, t, 0.1, 'lowpass', 320, 1, 0.9, 0.002); this.tone(o, t, 0.08, 110, 50, 'sine', 0.5, 0.001); } }

  footstep(surf: string, pos: Pos | null, loud: number): void {
    if (!this.ctx) return;
    const d = this.dist(pos);
    if (pos && (d > 26 || this.voices > MAX_VOICES - 14)) return;
    const o = this.out(pos, (pos ? 0.75 : 0.3) * loud, 18000);
    if (!o.ok) return;
    const t = this.ctx.currentTime, v = 0.9 + Math.random() * 0.2;
    if (surf === 'metal') { this.burst(o.node, t, 0.06, 'lowpass', 600 * v, 1, 0.7, 0.002); this.burst(o.node, t, 0.12, 'bandpass', 2300 * v, 14, 0.35, 0.001); }
    else if (surf === 'wood') { this.burst(o.node, t, 0.07, 'bandpass', 420 * v, 2, 0.9, 0.002); }
    else if (surf === 'dirt') { this.burst(o.node, t, 0.09, 'lowpass', 900 * v, 0.7, 0.6, 0.006); this.burst(o.node, t + 0.02, 0.05, 'highpass', 3000, 0.7, 0.12, 0.004); }
    else { this.burst(o.node, t, 0.055, 'lowpass', 750 * v, 1.2, 0.85, 0.002); this.burst(o.node, t, 0.015, 'highpass', 2600, 0.7, 0.1, 0.001); }
  }

  impact(surf: number, pos: Pos): void {
    if (!this.ctx || this.voices > MAX_VOICES - 16 || this.dist(pos) > 28) return;
    const o = this.out(pos, 0.42, 18000);
    if (!o.ok) return;
    const t = this.ctx.currentTime;
    if (surf === 2) { this.burst(o.node, t, 0.1, 'bandpass', 3000 + Math.random() * 1500, 16, 0.8, 0.001); }
    else if (surf === 4) { this.burst(o.node, t, 0.12, 'highpass', 4500, 1, 0.6, 0.001); }
    else if (surf === 6) { this.burst(o.node, t, 0.05, 'lowpass', 700, 1, 0.8, 0.001); }
    else { this.burst(o.node, t, 0.05, 'bandpass', 1400, 1.5, 0.7, 0.001); }
  }

  glass(pos: Pos): void {
    if (!this.ctx) return;
    const o = this.out(pos, 0.9, 18000); if (!o.ok) return;
    const t = this.ctx.currentTime;
    this.burst(o.node, t, 0.5, 'highpass', 3800, 0.8, 0.9, 0.001);
    for (let i = 0; i < 6; i++) this.tone(o.node, t + 0.03 + i * 0.045, 0.12, 2400 + Math.random() * 3000, 1800, 'triangle', 0.12, 0.001);
  }

  explosion(pos: Pos, kind: string): void {
    if (!this.ctx) return;
    const d = this.dist(pos);
    const o = this.out(pos, kind === 'flash' ? 1.0 : kind === 'device' || kind === 'smoke' ? 0.6 : 1.5, d > 40 ? 3000 : 18000);
    if (!o.ok) return;
    const t = this.ctx.currentTime;
    if (kind === 'flash') { this.burst(o.node, t, 0.12, 'highpass', 2500, 0.7, 1, 0.001); this.tone(o.node, t, 0.9, 3400, 3300, 'sine', 0.1, 0.01); return; }
    if (kind === 'smoke') { this.burst(o.node, t, 1.4, 'bandpass', 2400, 0.8, 0.5, 0.05, 900); return; }
    if (kind === 'device') { this.burst(o.node, t, 0.25, 'bandpass', 1800, 1, 0.9, 0.001, 300); this.tone(o.node, t, 0.2, 900, 120, 'sawtooth', 0.25, 0.001); return; }
    this.burst(o.node, t, 0.03, 'highpass', 2000, 0.7, 1.0, 0.001);
    this.burst(o.node, t, 0.9, 'lowpass', 1100, 0.6, 1.0, 0.003, 120);
    this.tone(o.node, t, 0.55, 95, 28, 'sine', 1.0, 0.002);
    this.burst(o.node, t + 0.12, 1.6, 'lowpass', 500, 0.5, 0.4, 0.05, 90);
    this.duckUntil = performance.now() + 3000;
  }

  // ---------------------------------------------------------------- feedback
  hitMarker(kind: 'hit' | 'head' | 'kill' | 'device'): void {
    if (!this.hitSounds) return;
    const o = this.quick(0.5); if (!o) return;
    const t = this.ctx!.currentTime;
    if (kind === 'kill') { this.tone(o, t, 0.07, 620, 400, 'square', 0.22, 0.001); this.tone(o, t + 0.05, 0.22, 1480, 1480, 'triangle', 0.3, 0.002); this.tone(o, t + 0.05, 0.22, 2220, 2220, 'sine', 0.14, 0.002); }
    else if (kind === 'head') { this.tone(o, t, 0.05, 2400, 2100, 'triangle', 0.35, 0.001); this.burst(o, t, 0.02, 'highpass', 5000, 1, 0.3, 0.001); }
    else if (kind === 'device') { this.tone(o, t, 0.05, 900, 700, 'square', 0.18, 0.001); }
    else { this.tone(o, t, 0.035, 1700, 1500, 'triangle', 0.26, 0.001); this.burst(o, t, 0.012, 'highpass', 4500, 1, 0.2, 0.001); }
  }
  damage(amount: number): void { const o = this.quick(Math.min(0.9, 0.35 + amount / 80)); if (o) { const t = this.ctx!.currentTime; this.burst(o, t, 0.09, 'lowpass', 520, 1, 1, 0.001); this.tone(o, t, 0.12, 150, 70, 'sine', 0.6, 0.001); } }
  death(): void { const o = this.quick(0.7); if (o) { const t = this.ctx!.currentTime; this.tone(o, t, 0.7, 220, 55, 'sawtooth', 0.22, 0.01); this.burst(o, t, 0.5, 'lowpass', 400, 1, 0.5, 0.01); } }
  ui(kind: 'click' | 'hover' | 'ready' | 'deny' | 'score' | 'pickup' | 'ping'): void {
    const o = this.quick(0.4); if (!o) return;
    const t = this.ctx!.currentTime;
    if (kind === 'click') this.tone(o, t, 0.05, 880, 660, 'triangle', 0.25, 0.001);
    else if (kind === 'hover') this.tone(o, t, 0.025, 1300, 1300, 'sine', 0.08, 0.001);
    else if (kind === 'ready') { this.tone(o, t, 0.09, 660, 660, 'triangle', 0.25, 0.002); this.tone(o, t + 0.08, 0.09, 990, 990, 'triangle', 0.25, 0.002); this.tone(o, t + 0.16, 0.18, 1320, 1320, 'triangle', 0.3, 0.002); }
    else if (kind === 'deny') { this.tone(o, t, 0.1, 220, 180, 'square', 0.2, 0.001); this.tone(o, t + 0.11, 0.12, 180, 150, 'square', 0.2, 0.001); }
    else if (kind === 'score') this.tone(o, t, 0.06, 1180, 1400, 'sine', 0.14, 0.002);
    else if (kind === 'pickup') { this.tone(o, t, 0.06, 520, 780, 'triangle', 0.25, 0.002); this.burst(o, t, 0.05, 'bandpass', 2400, 4, 0.3, 0.001); }
    else this.tone(o, t, 0.12, 1560, 1560, 'sine', 0.2, 0.002);
  }

  /** Original announcer stingers (tones, not voice lines). */
  stinger(kind: 'start' | 'lead' | 'behind' | 'near' | 'win' | 'loss' | 'draw' | 'sudden' | 'count'): void {
    const o = this.quick(0.5); if (!o) return;
    const t = this.ctx!.currentTime;
    const seq = (notes: number[], step: number, dur: number, type: OscillatorType = 'triangle', g = 0.3) => notes.forEach((n, i) => this.tone(o, t + i * step, dur, n, n, type, g, 0.004));
    if (kind === 'start') seq([392, 523, 784], 0.11, 0.3);
    else if (kind === 'lead') seq([587, 784], 0.1, 0.22);
    else if (kind === 'behind') seq([523, 392], 0.1, 0.22);
    else if (kind === 'near') seq([784, 784, 988], 0.13, 0.14, 'square', 0.14);
    else if (kind === 'win') seq([523, 659, 784, 1047, 1319], 0.12, 0.5);
    else if (kind === 'loss') seq([523, 466, 392, 311], 0.16, 0.5, 'sawtooth', 0.14);
    else if (kind === 'draw') seq([523, 523, 523], 0.2, 0.3);
    else if (kind === 'sudden') seq([311, 311, 466, 311], 0.14, 0.2, 'square', 0.16);
    else this.tone(o, t, 0.08, 880, 880, 'triangle', 0.25, 0.002);
  }

  /** Support-action warnings that are identifiable without looking. */
  warning(kind: 'mortar' | 'flight' | 'recon' | 'drone' | 'uplink' | 'pod', hostile: boolean, pos: Pos | null): void {
    if (!this.ctx) return;
    const o = this.out(kind === 'mortar' ? pos : null, hostile ? 0.75 : 0.45, 18000);
    if (!o.ok) return;
    const t = this.ctx.currentTime;
    if (kind === 'flight') {
      // rising and falling air-raid sweep, then the engine roar
      const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, t);
      for (let i = 0; i < 3; i++) { osc.frequency.linearRampToValueAtTime(760, t + i * 1.0 + 0.5); osc.frequency.linearRampToValueAtTime(320, t + i * 1.0 + 1.0); }
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(hostile ? 0.3 : 0.16, t + 0.1); g.gain.setValueAtTime(hostile ? 0.3 : 0.16, t + 2.8); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
      osc.connect(g); g.connect(o.node); osc.start(t); osc.stop(t + 3.3);
      this.burst(o.node, t + 2.7, 2.6, 'lowpass', 300, 0.6, 1.0, 0.9, 1400);
    } else if (kind === 'mortar') {
      for (let i = 0; i < 6; i++) this.tone(o.node, t + i * 0.36 * (1 - i * 0.06), 0.1, 1250, 1250, 'square', 0.22, 0.002);
      this.tone(o.node, t + 1.4, 1.0, 1900, 420, 'sine', 0.3, 0.3); // incoming whistle
    } else if (kind === 'recon') { this.tone(o.node, t, 0.5, 1400, 700, 'sine', 0.3, 0.005); this.tone(o.node, t + 0.12, 0.5, 2100, 1050, 'sine', 0.12, 0.005); }
    else if (kind === 'drone') { this.tone(o.node, t, 0.5, 180, 260, 'sawtooth', 0.14, 0.05); this.tone(o.node, t, 0.5, 365, 520, 'square', 0.05, 0.05); }
    else if (kind === 'uplink') { [660, 880, 1320, 1760].forEach((n, i) => this.tone(o.node, t + i * 0.07, 0.25, n, n, 'sine', 0.18, 0.004)); }
    else { this.burst(o.node, t, 0.08, 'lowpass', 500, 1, 0.8, 0.002); this.tone(o.node, t + 0.05, 0.2, 520, 780, 'triangle', 0.2, 0.005); }
  }

  // ---------------------------------------------------------------- music
  /** Original percussive / electronic loop, generated live with a look-ahead scheduler. */
  music(mode: 'off' | 'menu' | 'match'): void {
    if (mode === this.musicMode) return;
    this.musicMode = mode;
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
    if (mode === 'off' || !this.ctx) return;
    this.step = 0;
    this.nextStep = this.ctx.currentTime + 0.1;
    this.musicTimer = setInterval(() => this.schedule(), 80);
  }
  setIntensity(v: number): void { this.intensity = Math.max(0, Math.min(1, v)); }

  private schedule(): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    // duck under active combat so gunfire and footsteps stay readable
    const duck = performance.now() < this.duckUntil && this.musicMode === 'match' ? 0.35 : 1;
    this.musicDuck.gain.setTargetAtTime(duck, ctx.currentTime, 0.4);
    const bpm = this.musicMode === 'menu' ? 92 : 104 + this.intensity * 14;
    const sp = 60 / bpm / 4;
    while (this.nextStep < ctx.currentTime + 0.25) {
      this.playStep(this.step, this.nextStep, sp);
      this.nextStep += sp;
      this.step = (this.step + 1) % 64;
    }
  }

  private playStep(step: number, t: number, sp: number): void {
    const b = this.musicBus, s = step % 16, bar = Math.floor(step / 16);
    const roots = [73.42, 73.42, 87.31, 65.41]; // D2 D2 F2 C2
    const root = roots[bar];
    const menu = this.musicMode === 'menu';
    const I = menu ? 0.25 : this.intensity;
    // pad
    if (s === 0) {
      for (const [mult, det] of [[2, -4], [2, 5], [3, 0], [4.76, 3]] as const) {
        const o = this.ctx!.createOscillator(), g = this.ctx!.createGain(), f = this.ctx!.createBiquadFilter();
        o.type = 'sawtooth'; o.frequency.value = root * mult; o.detune.value = det;
        f.type = 'lowpass'; f.frequency.value = menu ? 900 : 600 + I * 900; f.Q.value = 0.6;
        const dur = sp * 16;
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(menu ? 0.06 : 0.04, t + dur * 0.3); g.gain.linearRampToValueAtTime(0.0001, t + dur * 1.05);
        o.connect(f); f.connect(g); g.connect(b);
        o.start(t); o.stop(t + dur * 1.1);
      }
    }
    // bass pulse
    const bassPat = menu ? [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0] : [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0];
    if (bassPat[s]) {
      const o = this.ctx!.createOscillator(), g = this.ctx!.createGain(), f = this.ctx!.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.value = root * (s === 13 ? 1.5 : 1);
      f.type = 'lowpass'; f.frequency.setValueAtTime(700 + I * 900, t); f.frequency.exponentialRampToValueAtTime(140, t + sp * 1.8); f.Q.value = 4;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.2, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + sp * 2);
      o.connect(f); f.connect(g); g.connect(b);
      o.start(t); o.stop(t + sp * 2.2);
    }
    // arpeggio blips
    const arp = [0, 7, 12, 15, 12, 7, 19, 12];
    if ((menu ? s % 4 === 2 : s % 2 === 1 && I > 0.3) && (bar % 2 === 1 || !menu)) {
      const n = root * 4 * Math.pow(2, arp[(step >> 1) % arp.length] / 12);
      this.tone(b, t, sp * 1.6, n, n, 'triangle', menu ? 0.05 : 0.03 + I * 0.03, 0.004);
    }
    if (menu) { if (s % 8 === 4) this.burst(b, t, 0.05, 'highpass', 7000, 0.7, 0.03, 0.001); return; }
    // drums
    const kick = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0];
    if (kick[s] || (I > 0.75 && s === 14)) { this.tone(b, t, 0.16, 150, 42, 'sine', 0.5, 0.002); this.burst(b, t, 0.02, 'lowpass', 1200, 0.7, 0.2, 0.001); }
    if (s === 4 || s === 12) { this.burst(b, t, 0.11, 'bandpass', 1900, 0.9, 0.22, 0.001); this.tone(b, t, 0.07, 210, 150, 'triangle', 0.14, 0.001); }
    if (s % 2 === 0 || I > 0.55) this.burst(b, t, s % 4 === 2 ? 0.05 : 0.022, 'highpass', 8200, 0.7, s % 4 === 2 ? 0.07 : 0.035 + I * 0.02, 0.001);
    if (I > 0.7 && s % 4 === 3) this.burst(b, t, 0.03, 'bandpass', 3200, 4, 0.06, 0.001);
  }
}
