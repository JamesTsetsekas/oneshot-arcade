// Procedural Web Audio: HRTF panning, occlusion approximation, interior/exterior reverb zones, bus compression, voice limit, adaptive music.
// No audio files are shipped: every sound is synthesized at runtime.
import { WEAPONS } from "../../shared/content/weapons";
import type { Settings } from "../runtime/settings";

type V3 = { x: number; y: number; z: number };
export interface SpatialOpts { pos?: V3; occluded?: boolean; gain?: number; priority?: number; indoor?: boolean; maxDist?: number }

const MAX_VOICES = 48;

export class AudioEngine {
  ctx: AudioContext | null = null;
  master!: GainNode; sfx!: GainNode; music!: GainNode; ui!: GainNode;
  private comp!: DynamicsCompressorNode;
  private noise!: AudioBuffer;
  private revIn!: ConvolverNode; private revOut!: ConvolverNode;
  private revInGain!: GainNode; private revOutGain!: GainNode;
  private voices = 0;
  private musicTimer = 0;
  private nextBeat = 0;
  private beat = 0;
  intensity = 0.3;
  private musicOn = false;
  private musicMode: "menu" | "match" = "menu";
  private tempo = 112;
  private lowHealthT = 0;
  enabled = true;

  constructor(private settings: () => Settings) {}

  init(): boolean {
    if (this.ctx) return true;
    try {
      const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new C({ latencyHint: "interactive" });
      this.ctx = ctx;
      this.comp = ctx.createDynamicsCompressor();
      this.comp.threshold.value = -16; this.comp.knee.value = 14; this.comp.ratio.value = 5; this.comp.attack.value = 0.004; this.comp.release.value = 0.2;
      this.master = ctx.createGain(); this.sfx = ctx.createGain(); this.music = ctx.createGain(); this.ui = ctx.createGain();
      this.sfx.connect(this.comp); this.music.connect(this.master); this.ui.connect(this.master); this.comp.connect(this.master); this.master.connect(ctx.destination);
      // noise buffer
      const nb = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
      const d = nb.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.noise = nb;
      // reverbs: interior (short, bright) and exterior (long, dark tail)
      this.revIn = ctx.createConvolver(); this.revIn.buffer = this.makeIR(0.7, 2.4, 0.5);
      this.revOut = ctx.createConvolver(); this.revOut.buffer = this.makeIR(1.5, 3.2, 0.9);
      this.revInGain = ctx.createGain(); this.revOutGain = ctx.createGain();
      this.revIn.connect(this.revInGain); this.revOut.connect(this.revOutGain);
      this.revInGain.connect(this.sfx); this.revOutGain.connect(this.sfx);
      this.revInGain.gain.value = 0.0; this.revOutGain.gain.value = 0.0;
      this.applyVolumes();
      return true;
    } catch { this.enabled = false; return false; }
  }

  private makeIR(seconds: number, decay: number, damp: number): AudioBuffer {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const t = i / len;
        lp += (Math.random() * 2 - 1 - lp) * (1 - damp * 0.9);
        d[i] = lp * Math.pow(1 - t, decay);
      }
    }
    return b;
  }

  async resume(): Promise<void> { if (this.ctx && this.ctx.state !== "running") { try { await this.ctx.resume(); } catch { /* blocked */ } } }
  suspend(): void { void this.ctx?.suspend(); }

  applyVolumes(): void {
    if (!this.ctx) return;
    const s = this.settings();
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(s.masterVolume, t, 0.05);
    this.sfx.gain.setTargetAtTime(s.sfxVolume, t, 0.05);
    this.music.gain.setTargetAtTime(s.musicVolume * 0.5, t, 0.2);
    this.ui.gain.setTargetAtTime(s.sfxVolume, t, 0.05);
  }

  setListener(p: V3, yaw: number, pitch: number, indoor: boolean): void {
    const ctx = this.ctx; if (!ctx) return;
    const l = ctx.listener;
    const fx = Math.sin(yaw) * Math.cos(pitch), fy = Math.sin(pitch), fz = Math.cos(yaw) * Math.cos(pitch);
    if (l.positionX) {
      l.positionX.value = p.x; l.positionY.value = p.y; l.positionZ.value = p.z;
      l.forwardX.value = fx; l.forwardY.value = fy; l.forwardZ.value = fz; l.upX.value = 0; l.upY.value = 1; l.upZ.value = 0;
    }
    const t = ctx.currentTime;
    this.revInGain.gain.setTargetAtTime(indoor ? 0.55 : 0.1, t, 0.15);
    this.revOutGain.gain.setTargetAtTime(indoor ? 0.1 : 0.42, t, 0.15);
  }

  // ------------------------------------------------------------------ voice helpers
  private canPlay(priority: number): boolean {
    if (!this.ctx || !this.enabled) return false;
    if (this.ctx.state !== "running") return false;
    if (this.voices >= MAX_VOICES && priority < 2) return false;
    if (this.voices >= MAX_VOICES + 8) return false;
    return true;
  }
  private track(node: AudioScheduledSourceNode): void {
    this.voices++;
    node.addEventListener("ended", () => { this.voices = Math.max(0, this.voices - 1); });
  }

  /** Output chain for one sound: optional HRTF panner + occlusion low-pass + reverb send. */
  private chain(o: SpatialOpts, wetSend = 0.4): { input: AudioNode; revSend: GainNode | null } {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.value = o.gain ?? 1;
    let tail: AudioNode = g;
    if (o.occluded) {
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900; lp.Q.value = 0.4;
      tail.connect(lp); tail = lp;
      g.gain.value *= 0.55;
    }
    if (o.pos) {
      const p = ctx.createPanner();
      p.panningModel = "HRTF"; p.distanceModel = "inverse"; p.refDistance = 4; p.maxDistance = o.maxDist ?? 160; p.rolloffFactor = 1.15;
      p.positionX.value = o.pos.x; p.positionY.value = o.pos.y; p.positionZ.value = o.pos.z;
      tail.connect(p); tail = p;
    }
    tail.connect(this.sfx);
    let rev: GainNode | null = null;
    if (wetSend > 0) {
      rev = ctx.createGain(); rev.gain.value = wetSend;
      tail.connect(rev);
      rev.connect(o.indoor ? this.revIn : this.revOut);
    }
    return { input: g, revSend: rev };
  }

  private noiseSrc(dur: number): AudioBufferSourceNode {
    const s = this.ctx!.createBufferSource();
    s.buffer = this.noise; s.loop = true;
    s.start(0, Math.random() * 0.5); s.stop(this.ctx!.currentTime + dur);
    this.track(s);
    return s;
  }
  private tone(type: OscillatorType, f0: number, f1: number, dur: number, gain: number, dest: AudioNode, delay = 0): OscillatorNode {
    const ctx = this.ctx!;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    const t = ctx.currentTime + delay;
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.02); this.track(o);
    return o;
  }
  private burst(dur: number, filt: BiquadFilterType, freq: number, q: number, gain: number, dest: AudioNode, delay = 0, decay = 0.6): void {
    const ctx = this.ctx!;
    const s = this.noiseSrc(dur + delay + 0.05);
    const f = ctx.createBiquadFilter(); f.type = filt; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); const t = ctx.currentTime + delay;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + dur * decay + 0.01);
    s.connect(f); f.connect(g); g.connect(dest);
  }

  // ------------------------------------------------------------------ weapons
  shot(weaponId: string, suppressed: boolean, o: SpatialOpts & { local?: boolean }): void {
    const pr = o.local ? 3 : 1;
    if (!this.canPlay(pr)) return;
    const def = WEAPONS[weaponId]; if (!def) return;
    const a = def.audio;
    const { input } = this.chain({ ...o, gain: (o.gain ?? 1) * (suppressed ? 0.35 : 1) }, suppressed ? 0.15 : 0.55);
    const dur = a.decay * (suppressed ? 0.6 : 1);
    // crack (high), body (mid), thump (low), tail
    this.burst(0.03, "highpass", 3000, 0.5, 0.7 * a.crack * (suppressed ? 0.3 : 1), input, 0, 0.5);
    this.burst(dur, "bandpass", (suppressed ? 900 : 1700) * a.pitch, 0.7, 1.1 * a.punch, input, 0, 0.9);
    this.burst(dur * 1.6, "lowpass", suppressed ? 500 : 800 * a.pitch, 0.5, 0.8, input, 0.012, 1);
    this.tone("sine", 150 * a.pitch, 38, 0.14, 0.9 * a.punch * (suppressed ? 0.4 : 1), input);
    if (o.local) this.burst(0.02, "bandpass", 3200, 1.2, 0.2, input, 0.04, 0.4); // mechanical click layer (close only)
    if (weaponId === "sg8") this.burst(0.1, "lowpass", 400, 0.4, 0.8, input, 0.45, 0.8); // pump
  }
  dryFire(o: SpatialOpts): void {
    if (!this.canPlay(2)) return;
    const { input } = this.chain({ ...o, gain: 0.7 }, 0);
    this.burst(0.03, "bandpass", 2600, 2, 0.5, input, 0, 0.6);
  }
  reload(stage: "start" | "magOut" | "magIn" | "end", o: SpatialOpts): void {
    if (!this.canPlay(1)) return;
    const { input } = this.chain({ ...o, gain: (o.gain ?? 1) * 0.6 }, 0.1);
    if (stage === "start") this.burst(0.06, "bandpass", 900, 1, 0.3, input);
    else if (stage === "magOut") { this.burst(0.05, "bandpass", 1400, 2, 0.6, input); this.tone("square", 220, 120, 0.06, 0.06, input); }
    else if (stage === "magIn") { this.burst(0.05, "bandpass", 1100, 2.5, 0.8, input); this.tone("triangle", 330, 180, 0.07, 0.12, input); }
    else { this.burst(0.05, "bandpass", 1800, 3, 0.7, input); this.burst(0.07, "lowpass", 600, 1, 0.6, input, 0.06); }
  }
  step(surface: string, loud: number, o: SpatialOpts): void {
    if (!this.canPlay(1)) return;
    const { input } = this.chain({ ...o, gain: (o.gain ?? 1) * Math.min(1, loud / 16) * 0.5, maxDist: 60 }, 0.12);
    if (surface === "metal") { this.burst(0.07, "bandpass", 1200 + Math.random() * 300, 1.8, 0.7, input); this.tone("triangle", 520, 420, 0.07, 0.07, input); }
    else this.burst(0.06, "lowpass", 600 + Math.random() * 200, 0.8, 0.9, input);
  }
  impact(surface: string, o: SpatialOpts): void {
    if (!this.canPlay(0)) return;
    const { input } = this.chain({ ...o, gain: (o.gain ?? 1) * 0.5, maxDist: 70 }, 0.2);
    if (surface === "metal") { this.burst(0.05, "highpass", 2500, 2, 0.6, input); this.tone("triangle", 1800, 900, 0.06, 0.08, input); }
    else if (surface === "glass") { this.burst(0.12, "highpass", 4000, 1, 0.8, input); this.tone("sine", 3200, 2400, 0.1, 0.1, input); }
    else if (surface === "flesh") this.burst(0.05, "lowpass", 500, 1, 0.8, input);
    else this.burst(0.06, "bandpass", 1000, 0.8, 0.6, input);
  }
  explosion(kind: string, o: SpatialOpts): void {
    if (!this.canPlay(3)) return;
    if (kind === "flash") {
      const { input } = this.chain({ ...o, gain: 0.9 }, 0.3);
      this.burst(0.08, "highpass", 2500, 0.5, 1, input); this.tone("sine", 4200, 3800, 0.9, 0.12, input);
      return;
    }
    if (kind === "device") { const { input } = this.chain({ ...o, gain: 0.8 }, 0.3); this.burst(0.25, "bandpass", 1500, 0.7, 1, input); return; }
    const { input } = this.chain({ ...o, gain: 1.4, maxDist: 220 }, 0.9);
    this.burst(0.9, "lowpass", 700, 0.6, 1.6, input, 0, 0.9);
    this.burst(0.3, "bandpass", 2200, 0.5, 0.9, input, 0, 0.5);
    this.tone("sine", 95, 28, 0.7, 1.4, input);
    this.burst(1.4, "lowpass", 300, 0.4, 0.8, input, 0.15, 1);
  }
  throwSfx(kind: string, o: SpatialOpts): void {
    if (!this.canPlay(1)) return;
    const { input } = this.chain({ ...o, gain: 0.6 }, 0.1);
    this.burst(0.18, "bandpass", 700, 0.8, 0.4, input);
    this.tone("sine", 2200, 1800, 0.03, 0.12, input, 0.0);
    void kind;
  }
  pin(o: SpatialOpts): void { if (!this.canPlay(2)) return; const { input } = this.chain({ ...o, gain: 0.7 }, 0); this.tone("square", 2400, 1800, 0.04, 0.07, input); }
  bounce(o: SpatialOpts): void { if (!this.canPlay(0)) return; const { input } = this.chain({ ...o, gain: 0.5 }, 0.2); this.tone("triangle", 800, 400, 0.06, 0.12, input); }
  smoke(o: SpatialOpts): void { if (!this.canPlay(2)) return; const { input } = this.chain({ ...o, gain: 0.8 }, 0.4); this.burst(1.2, "bandpass", 3000, 0.5, 0.5, input, 0, 1); this.tone("sine", 160, 80, 0.2, 0.4, input); }
  glass(o: SpatialOpts): void { if (!this.canPlay(2)) return; const { input } = this.chain({ ...o, gain: 1 }, 0.4); this.burst(0.5, "highpass", 3500, 0.7, 1, input, 0, 0.9); for (let i = 0; i < 5; i++) this.tone("sine", 2800 + Math.random() * 2000, 2000, 0.08, 0.06, input, 0.03 * i); }
  mantle(o: SpatialOpts): void { if (!this.canPlay(1)) return; const { input } = this.chain({ ...o, gain: 0.6 }, 0.1); this.burst(0.18, "lowpass", 500, 0.6, 0.8, input); }
  jump(o: SpatialOpts): void { if (!this.canPlay(0)) return; const { input } = this.chain({ ...o, gain: 0.35 }, 0.05); this.burst(0.08, "lowpass", 500, 0.5, 0.6, input); }
  land(hard: boolean, o: SpatialOpts): void { if (!this.canPlay(1)) return; const { input } = this.chain({ ...o, gain: hard ? 0.9 : 0.5 }, 0.15); this.burst(0.12, "lowpass", 380, 0.5, 1, input); this.tone("sine", 90, 50, 0.12, 0.5, input); }
  melee(hit: boolean, o: SpatialOpts): void { if (!this.canPlay(1)) return; const { input } = this.chain({ ...o, gain: 0.8 }, 0.1); this.burst(0.15, "bandpass", hit ? 400 : 1200, 0.6, hit ? 1 : 0.4, input); if (hit) this.tone("sine", 140, 50, 0.1, 0.6, input); }
  swap(o: SpatialOpts): void { if (!this.canPlay(1)) return; const { input } = this.chain({ ...o, gain: 0.5 }, 0.05); this.burst(0.07, "bandpass", 1500, 1.5, 0.5, input); this.burst(0.05, "bandpass", 1000, 2, 0.5, input, 0.1); }

  // ------------------------------------------------------------------ UI / feedback
  hitMarker(kind: "normal" | "head" | "kill"): void {
    if (!this.ctx || !this.settings().hitMarkerAudio || this.ctx.state !== "running") return;
    if (kind === "kill") { this.tone("sine", 700, 500, 0.12, 0.35, this.ui); this.tone("triangle", 1400, 1000, 0.1, 0.25, this.ui, 0.05); this.tone("sine", 220, 80, 0.22, 0.5, this.ui); }
    else if (kind === "head") { this.tone("sine", 2000, 1700, 0.07, 0.3, this.ui); this.tone("sine", 2600, 2300, 0.06, 0.18, this.ui, 0.03); }
    else this.tone("sine", 1250, 1100, 0.05, 0.22, this.ui);
  }
  damage(amount: number): void { if (!this.ctx || this.ctx.state !== "running") return; this.burst(0.18, "lowpass", 500, 0.6, Math.min(1, 0.3 + amount / 60), this.ui); this.tone("sine", 100, 55, 0.18, 0.5, this.ui); }
  ui_click(): void { if (!this.ctx) return; this.tone("sine", 900, 700, 0.04, 0.12, this.ui); }
  stinger(kind: "start" | "lead" | "win" | "lose" | "ready" | "warn" | "sudden"): void {
    if (!this.ctx || this.ctx.state !== "running") return;
    const seqs: Record<string, number[]> = { start: [330, 440, 554, 660], lead: [440, 554], win: [392, 494, 587, 784], lose: [330, 262, 196], ready: [660, 880], warn: [520, 390, 520, 390], sudden: [220, 330, 220, 330] };
    seqs[kind].forEach((f, i) => { this.tone("triangle", f, f * 0.98, 0.22, 0.2, this.ui, i * 0.11); this.tone("sine", f / 2, f / 2, 0.28, 0.12, this.ui, i * 0.11); });
  }
  heartbeat(): void { if (!this.ctx || this.ctx.state !== "running") return; this.tone("sine", 62, 40, 0.14, 0.55, this.ui); this.tone("sine", 58, 38, 0.14, 0.4, this.ui, 0.2); }
  reconPulse(o: SpatialOpts): void { if (!this.canPlay(2)) return; const { input } = this.chain({ ...o, gain: 0.6 }, 0.3); this.tone("sine", 400, 1800, 0.5, 0.25, input); this.tone("sine", 1800, 1800, 0.1, 0.15, input, 0.5); }
  mortarWhistle(o: SpatialOpts, secs: number): void { if (!this.canPlay(3)) return; const { input } = this.chain({ ...o, gain: 1, maxDist: 250 }, 0.5); this.tone("sawtooth", 2200, 500, Math.max(0.5, secs), 0.1, input); this.burst(Math.max(0.5, secs), "bandpass", 1800, 4, 0.2, input, 0, 1); }
  siren(): void { if (!this.ctx || this.ctx.state !== "running") return; for (let i = 0; i < 4; i++) { this.tone("sawtooth", 600, 900, 0.45, 0.12, this.ui, i * 0.9); this.tone("sawtooth", 900, 600, 0.45, 0.12, this.ui, i * 0.9 + 0.45); } }
  jetPass(o: SpatialOpts): void { if (!this.canPlay(3)) return; const { input } = this.chain({ ...o, gain: 1.6, maxDist: 400 }, 0.5); this.burst(3.2, "bandpass", 600, 0.6, 1.2, input, 0, 1); this.tone("sawtooth", 140, 220, 3, 0.2, input); }

  // ------------------------------------------------------------------ music
  startMusic(mode: "menu" | "match"): void {
    if (!this.ctx) return;
    this.musicMode = mode;
    if (this.musicOn) return;
    this.musicOn = true;
    this.beat = 0;
    this.nextBeat = this.ctx.currentTime + 0.1;
    this.musicTimer = window.setInterval(() => this.scheduleMusic(), 90);
  }
  stopMusic(): void { this.musicOn = false; window.clearInterval(this.musicTimer); }
  setMusicMode(mode: "menu" | "match"): void { this.musicMode = mode; }
  setIntensity(i: number): void { this.intensity += (i - this.intensity) * 0.08; }
  private scheduleMusic(): void {
    const ctx = this.ctx; if (!ctx || !this.musicOn || ctx.state !== "running") return;
    const spb = 60 / (this.tempo * (1 + Math.max(0, this.intensity - 0.6) * 0.12)) / 4;
    while (this.nextBeat < ctx.currentTime + 0.25) {
      this.musicStep(this.beat, this.nextBeat);
      this.nextBeat += spb; this.beat++;
    }
  }
  private mtone(type: OscillatorType, f: number, t: number, dur: number, gain: number, lp = 2000): void {
    const ctx = this.ctx!;
    const o = ctx.createOscillator(); const g = ctx.createGain(); const fl = ctx.createBiquadFilter();
    fl.type = "lowpass"; fl.frequency.setValueAtTime(lp, t); fl.frequency.exponentialRampToValueAtTime(Math.max(120, lp * 0.3), t + dur);
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(fl); fl.connect(g); g.connect(this.music); o.start(t); o.stop(t + dur + 0.05);
  }
  private mnoise(t: number, dur: number, hp: number, gain: number): void {
    const ctx = this.ctx!;
    const s = ctx.createBufferSource(); s.buffer = this.noise; const f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = hp;
    const g = ctx.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.music); s.start(t, Math.random()); s.stop(t + dur + 0.02);
  }
  private musicStep(n: number, t: number): void {
    const bar = Math.floor(n / 16) % 8, step = n % 16;
    const roots = [55, 55, 65.4, 49, 55, 55, 73.4, 49];
    const root = roots[bar];
    const combat = this.musicMode === "match" ? this.intensity : 0.25;
    // drums
    if (this.musicMode === "match" || bar % 2 === 0) {
      if (step % 4 === 0) { const ctx = this.ctx!; const o = ctx.createOscillator(); const g = ctx.createGain(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.12); g.gain.setValueAtTime(0.9 * (0.3 + combat * 0.7), t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); o.connect(g); g.connect(this.music); o.start(t); o.stop(t + 0.25); }
    }
    if (step % 2 === 1) this.mnoise(t, 0.04, 7000, 0.05 + combat * 0.06);
    if (step === 4 || step === 12) this.mnoise(t, 0.16, 1800, 0.12 * (0.3 + combat));
    // bass
    if ([0, 3, 6, 10, 12].includes(step)) this.mtone("sawtooth", root * (step === 6 ? 2 : 1), t, 0.2, 0.22 * (0.4 + combat * 0.6), 700 + combat * 900);
    // pad / arp
    if (step % 4 === 2) { const scale = [1, 1.2, 1.5, 1.8]; this.mtone("triangle", root * 4 * scale[(n >> 2) % 4], t, 0.35, 0.05 + combat * 0.05, 2400); }
    if (this.musicMode === "menu" && step === 0 && bar % 2 === 0) { this.mtone("sine", root * 4, t, 1.6, 0.1, 1200); this.mtone("sine", root * 6, t, 1.6, 0.07, 1200); }
  }

  update(dt: number, ctxInfo: { health: number; alive: boolean }): void {
    if (!this.ctx) return;
    if (ctxInfo.alive && ctxInfo.health < 30) { this.lowHealthT -= dt; if (this.lowHealthT <= 0) { this.heartbeat(); this.lowHealthT = 0.9 + ctxInfo.health / 60; } }
  }
  dispose(): void { this.stopMusic(); void this.ctx?.close(); this.ctx = null; }
}
