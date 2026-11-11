// Web Audio engine: fully synthesized original sounds (no samples), HRTF panning,
// distance + occlusion low-pass, interior reverb send, bus compression, 48-voice limit,
// and a procedural music sequencer that drops in combat and rises near the score limit.

type BufMap = Record<string, AudioBuffer>;

export interface AudioSettings { master: number; sfx: number; music: number; hitmarker: boolean }

const MAX_VOICES = 48;

export class AudioEngine {
  ctx: AudioContext | null = null;
  master!: GainNode; sfx!: GainNode; music!: GainNode; ui!: GainNode; reverbSend!: GainNode;
  private comp!: DynamicsCompressorNode;
  private bufs: BufMap = {};
  private voices = 0;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private nextNoteTime = 0;
  musicMode: "off" | "menu" | "match" = "off";
  intensity = 0.3;
  combat = 0;
  settings: AudioSettings = { master: 0.8, sfx: 0.9, music: 0.45, hitmarker: true };
  interior = false;
  private loops = new Map<string, { src: AudioBufferSourceNode; gain: GainNode; panner: PannerNode }>();
  private tinnitus: { osc: OscillatorNode; gain: GainNode } | null = null;

  init() {
    if (this.ctx) { if (this.ctx.state === "suspended") void this.ctx.resume(); return; }
    const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    this.comp = ctx.createDynamicsCompressor();
    this.comp.threshold.value = -16; this.comp.ratio.value = 4; this.comp.attack.value = 0.003; this.comp.release.value = 0.2;
    this.master = ctx.createGain(); this.master.connect(this.comp); this.comp.connect(ctx.destination);
    this.sfx = ctx.createGain(); this.sfx.connect(this.master);
    this.music = ctx.createGain(); this.music.connect(this.master);
    this.ui = ctx.createGain(); this.ui.connect(this.master);
    const conv = ctx.createConvolver();
    conv.buffer = this.impulse(1.1, 2.6);
    this.reverbSend = ctx.createGain(); this.reverbSend.gain.value = 0;
    this.reverbSend.connect(conv); conv.connect(this.sfx);
    this.applySettings(this.settings);
    this.generate();
  }

  applySettings(s: AudioSettings) {
    this.settings = s;
    if (!this.ctx) return;
    this.master.gain.value = s.master;
    this.sfx.gain.value = s.sfx;
    this.music.gain.value = s.music * 0.6;
  }

  setInterior(inside: boolean) {
    if (!this.ctx || inside === this.interior) return;
    this.interior = inside;
    this.reverbSend.gain.setTargetAtTime(inside ? 0.35 : 0.08, this.ctx.currentTime, 0.3);
  }

  private impulse(dur: number, decay: number): AudioBuffer {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * dur);
    const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return b;
  }

  private make(dur: number, fn: (t: number, i: number, sr: number) => number): AudioBuffer {
    const ctx = this.ctx!;
    const sr = ctx.sampleRate;
    const len = Math.max(1, Math.floor(sr * dur));
    const b = ctx.createBuffer(1, len, sr);
    const d = b.getChannelData(0);
    let peak = 0;
    for (let i = 0; i < len; i++) { d[i] = fn(i / sr, i, sr); peak = Math.max(peak, Math.abs(d[i])); }
    if (peak > 0) for (let i = 0; i < len; i++) d[i] /= peak;
    return b;
  }

  private generate() {
    let lp = 0, lp2 = 0, hp = 0, prev = 0;
    const noise = () => Math.random() * 2 - 1;
    const lowpass = (x: number, a: number) => (lp += a * (x - lp));
    const lowpass2 = (x: number, a: number) => (lp2 += a * (x - lp2));
    const highpass = (x: number, a: number) => { hp = a * (hp + x - prev); prev = x; return hp; };
    // gunshots per class: transient + body + sub thump + mechanical ring
    const gun = (body: number, cutoff: number, sub: number, mech: number, dur: number) => {
      lp = 0; lp2 = 0;
      return this.make(dur, (t) => {
        const n = noise();
        const trans = t < 0.004 ? n * 1.2 : 0;
        const b = lowpass(n, cutoff) * Math.exp(-t / body) * 1.6;
        const s = Math.sin(2 * Math.PI * sub * t * (1 - t * 2)) * Math.exp(-t / 0.05) * 0.9;
        const m = (Math.sin(2 * Math.PI * 3100 * t) + Math.sin(2 * Math.PI * 4700 * t) * 0.6) * Math.exp(-t / 0.02) * mech;
        return trans + b + s + m;
      });
    };
    this.bufs.shot_rifle = gun(0.07, 0.35, 75, 0.25, 0.4);
    this.bufs.shot_smg = gun(0.045, 0.45, 95, 0.3, 0.3);
    this.bufs.shot_battle = gun(0.1, 0.28, 65, 0.25, 0.5);
    this.bufs.shot_shotgun = gun(0.14, 0.22, 55, 0.15, 0.6);
    this.bufs.shot_lmg = gun(0.08, 0.3, 70, 0.3, 0.45);
    this.bufs.shot_marksman = gun(0.16, 0.25, 50, 0.2, 0.8);
    this.bufs.shot_pistol = gun(0.04, 0.4, 110, 0.3, 0.3);
    this.bufs.shot_heavyPistol = gun(0.07, 0.3, 80, 0.25, 0.4);
    this.bufs.shot_machinePistol = gun(0.035, 0.5, 120, 0.3, 0.25);
    lp = 0;
    this.bufs.shot_suppressed = this.make(0.18, (t) => lowpass(noise(), 0.12) * Math.exp(-t / 0.035) + Math.sin(2 * Math.PI * 160 * t) * Math.exp(-t / 0.02) * 0.4);
    lp = 0;
    this.bufs.tail = this.make(1.2, (t) => lowpass(noise(), 0.04) * Math.exp(-t / 0.35) * (t < 0.02 ? t / 0.02 : 1));
    const click = (f: number, dur: number, decay: number) => this.make(dur, (t) => (Math.sin(2 * Math.PI * f * t) * 0.6 + noise() * 0.5) * Math.exp(-t / decay));
    this.bufs.dry = click(2600, 0.06, 0.008);
    this.bufs.magOut = this.make(0.14, (t) => (noise() * 0.7 + Math.sin(2 * Math.PI * 900 * t) * 0.4) * Math.exp(-t / 0.025) + (t > 0.07 ? noise() * 0.3 * Math.exp(-(t - 0.07) / 0.02) : 0));
    this.bufs.magIn = this.make(0.16, (t) => (t < 0.01 ? noise() : 0) + (t > 0.06 && t < 0.075 ? noise() * 0.9 : 0) + Math.sin(2 * Math.PI * 1400 * t) * Math.exp(-t / 0.03) * 0.4);
    this.bufs.chamber = this.make(0.25, (t) => (t < 0.1 ? noise() * 0.4 * (t / 0.1) : 0) + (t > 0.11 && t < 0.13 ? noise() : 0) + Math.sin(2 * Math.PI * 700 * t) * Math.exp(-Math.abs(t - 0.12) / 0.01) * 0.5);
    this.bufs.swap = this.make(0.18, (t) => noise() * 0.4 * Math.exp(-t / 0.05) + Math.sin(2 * Math.PI * 500 * t) * Math.exp(-t / 0.02) * 0.3);
    lp = 0;
    this.bufs.step = this.make(0.09, (t) => lowpass(noise(), 0.18) * Math.exp(-t / 0.025));
    lp = 0; hp = 0; prev = 0;
    this.bufs.stepMetal = this.make(0.14, (t) => highpass(noise(), 0.6) * Math.exp(-t / 0.02) * 0.6 + Math.sin(2 * Math.PI * 820 * t) * Math.exp(-t / 0.05) * 0.4 + Math.sin(2 * Math.PI * 1330 * t) * Math.exp(-t / 0.04) * 0.25);
    this.bufs.hit = this.make(0.05, (t) => Math.sin(2 * Math.PI * 2900 * t) * Math.exp(-t / 0.012));
    this.bufs.hitHead = this.make(0.12, (t) => (Math.sin(2 * Math.PI * 3800 * t) + Math.sin(2 * Math.PI * 5600 * t) * 0.5) * Math.exp(-t / 0.035));
    this.bufs.hitKill = this.make(0.22, (t) => Math.sin(2 * Math.PI * (t < 0.07 ? 2400 : 3400) * t) * Math.exp(-((t % 0.07) / 0.02)) * (t < 0.14 ? 1 : 0) + Math.sin(2 * Math.PI * 90 * t) * Math.exp(-t / 0.08) * 0.6);
    lp = 0;
    this.bufs.hurt = this.make(0.25, (t) => lowpass(noise(), 0.08) * Math.exp(-t / 0.06) + Math.sin(2 * Math.PI * 70 * t) * Math.exp(-t / 0.08));
    lp = 0; lp2 = 0;
    this.bufs.explosion = this.make(2.0, (t) => lowpass(noise(), 0.09) * Math.exp(-t / 0.45) * 1.2 + Math.sin(2 * Math.PI * 42 * t * (1 - t * 0.2)) * Math.exp(-t / 0.3) + lowpass2(noise(), 0.02) * Math.exp(-t / 0.9) * 0.8);
    lp = 0;
    this.bufs.flashPop = this.make(0.6, (t) => (noise() * Math.exp(-t / 0.05) + Math.sin(2 * Math.PI * 3200 * t) * Math.exp(-t / 0.25) * 0.4));
    this.bufs.bounce = this.make(0.08, (t) => (Math.sin(2 * Math.PI * 1900 * t) + Math.sin(2 * Math.PI * 2730 * t) * 0.6) * Math.exp(-t / 0.018));
    this.bufs.pin = this.make(0.12, (t) => (Math.sin(2 * Math.PI * 4200 * t) * Math.exp(-t / 0.01)) + (t > 0.05 ? noise() * 0.4 * Math.exp(-(t - 0.05) / 0.02) : 0));
    this.bufs.chirp = this.make(0.35, (t) => Math.sin(2 * Math.PI * (t % 0.12 < 0.06 ? 2200 : 0) * t) * 0.7);
    lp = 0;
    this.bufs.smokeHiss = this.make(1.5, (t) => highpass(noise(), 0.9) * 0.5 * Math.exp(-t / 0.7) * Math.min(1, t * 20));
    this.bufs.whistle = this.make(1.6, (t) => Math.sin(2 * Math.PI * (1600 - t * 600) * t) * 0.6 * Math.min(1, t * 3));
    this.bufs.siren = this.make(3.0, (t) => Math.sin(2 * Math.PI * ((Math.floor(t * 2.5) % 2) ? 620 : 880) * t) * 0.5 * (0.6 + 0.4 * Math.sin(t * 30)));
    lp = 0;
    this.bufs.jet = this.make(3.0, (t) => { const k = Math.exp(-Math.pow((t - 1.2) / 0.5, 2)); return lowpass(noise(), 0.1 + k * 0.4) * (0.2 + k) + Math.sin(2 * Math.PI * (180 - t * 30) * t) * k * 0.3; });
    lp = 0;
    this.bufs.strafe = this.make(1.2, (t) => (Math.sin(2 * Math.PI * 28 * t) > 0.2 ? noise() : noise() * 0.1) * Math.exp(-t / 0.6));
    this.bufs.droneHum = this.make(1.0, (t) => (Math.sin(2 * Math.PI * 180 * t) * 0.4 + Math.sin(2 * Math.PI * 361 * t) * 0.3 + ((t * 230) % 1 - 0.5) * 0.3));
    this.bufs.glass = this.make(0.6, (t) => (noise() * 0.5 + Math.sin(2 * Math.PI * (4000 + Math.random() * 3000) * t) * 0.5) * Math.exp(-t / 0.15));
    this.bufs.melee = this.make(0.25, (t) => lowpass(noise(), 0.3) * Math.min(1, t * 40) * Math.exp(-t / 0.08));
    lp = 0;
    this.bufs.land = this.make(0.18, (t) => lowpass(noise(), 0.1) * Math.exp(-t / 0.05) + Math.sin(2 * Math.PI * 60 * t) * Math.exp(-t / 0.05) * 0.5);
    const tone = (freqs: number[], step: number, dur: number) => this.make(dur, (t) => { const i = Math.min(freqs.length - 1, Math.floor(t / step)); const lt = t - i * step; return (Math.sin(2 * Math.PI * freqs[i] * t) * 0.6 + Math.sin(4 * Math.PI * freqs[i] * t) * 0.15) * Math.exp(-lt / (step * 1.2)); });
    this.bufs.uiClick = tone([1200], 0.03, 0.05);
    this.bufs.uiHover = tone([900], 0.02, 0.03);
    this.bufs.good = tone([523, 659, 784], 0.09, 0.4);
    this.bufs.bad = tone([392, 311, 262], 0.11, 0.45);
    this.bufs.warn = tone([880, 660, 880, 660], 0.09, 0.4);
    this.bufs.neutral = tone([660, 880], 0.1, 0.3);
    this.bufs.supportReady = tone([523, 784, 1046, 1318], 0.07, 0.5);
    this.bufs.levelUp = tone([523, 659, 784, 1046, 1318], 0.1, 0.8);
    this.bufs.score = tone([1500], 0.03, 0.06);
    this.bufs.heartbeat = this.make(0.5, (t) => Math.sin(2 * Math.PI * 55 * t) * (Math.exp(-t / 0.05) + (t > 0.18 ? Math.exp(-(t - 0.18) / 0.05) * 0.7 : 0)));
    // music voices
    this.bufs.kick = this.make(0.35, (t) => Math.sin(2 * Math.PI * (55 + 120 * Math.exp(-t * 30)) * t) * Math.exp(-t / 0.12));
    lp = 0; hp = 0; prev = 0;
    this.bufs.hat = this.make(0.06, (t) => highpass(noise(), 0.95) * Math.exp(-t / 0.012));
    lp = 0;
    this.bufs.snare = this.make(0.25, (t) => (noise() * 0.7 + Math.sin(2 * Math.PI * 190 * t) * 0.4) * Math.exp(-t / 0.07));
  }

  get now() { return this.ctx?.currentTime ?? 0; }

  /** Play a sound. pos null = non-spatial (local). occluded applies a muffling low-pass. */
  play(name: string, opts: { pos?: { x: number; y: number; z: number } | null; gain?: number; rate?: number; occluded?: boolean; bus?: "sfx" | "ui" | "music"; priority?: number; maxDist?: number; when?: number } = {}): AudioBufferSourceNode | null {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running") return null;
    const buf = this.bufs[name];
    if (!buf) return null;
    const prio = opts.priority ?? 1;
    if (this.voices >= MAX_VOICES && prio < 2) return null;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = opts.rate ?? 1;
    const g = ctx.createGain();
    g.gain.value = opts.gain ?? 1;
    let node: AudioNode = src;
    if (opts.occluded) {
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 700;
      node.connect(f); node = f;
    }
    node.connect(g);
    let out: AudioNode = g;
    if (opts.pos) {
      const p = ctx.createPanner();
      p.panningModel = "HRTF"; p.distanceModel = "inverse"; p.refDistance = 3; p.maxDistance = opts.maxDist ?? 150; p.rolloffFactor = 1.1;
      p.positionX.value = opts.pos.x; p.positionY.value = opts.pos.y; p.positionZ.value = -opts.pos.z;
      g.connect(p); out = p;
    }
    const bus = opts.bus === "ui" ? this.ui : opts.bus === "music" ? this.music : this.sfx;
    out.connect(bus);
    if ((opts.bus ?? "sfx") === "sfx") out.connect(this.reverbSend);
    this.voices++;
    src.onended = () => { this.voices--; try { out.disconnect(); } catch { /* noop */ } };
    src.start(opts.when ?? 0);
    return src;
  }

  setListener(pos: { x: number; y: number; z: number }, fwd: { x: number; y: number; z: number }) {
    const ctx = this.ctx;
    if (!ctx) return;
    const l = ctx.listener;
    if (l.positionX) {
      l.positionX.value = pos.x; l.positionY.value = pos.y; l.positionZ.value = pos.z;
      // WebAudio is right-handed; flip Z to match the left-handed world.
      l.forwardX.value = fwd.x; l.forwardY.value = fwd.y; l.forwardZ.value = -fwd.z;
      l.upX.value = 0; l.upY.value = 1; l.upZ.value = 0;
    }
  }
  /** Convert a world position to the listener's (Z-flipped) audio space. */
  ap(p: { x: number; y: number; z: number }) { return { x: p.x, y: p.y, z: -p.z }; }

  loop(id: string, name: string, pos: { x: number; y: number; z: number }, gain = 0.4) {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running") return;
    let l = this.loops.get(id);
    if (!l) {
      const src = ctx.createBufferSource(); src.buffer = this.bufs[name]; src.loop = true;
      const g = ctx.createGain(); g.gain.value = gain;
      const p = ctx.createPanner(); p.panningModel = "HRTF"; p.refDistance = 4; p.rolloffFactor = 1.2;
      src.connect(g); g.connect(p); p.connect(this.sfx);
      src.start();
      l = { src, gain: g, panner: p };
      this.loops.set(id, l);
    }
    const a = this.ap(pos);
    l.panner.positionX.value = a.x; l.panner.positionY.value = a.y; l.panner.positionZ.value = a.z;
  }
  stopLoopsExcept(ids: Set<string>) {
    for (const [id, l] of this.loops) if (!ids.has(id)) { try { l.src.stop(); } catch { /* noop */ } l.panner.disconnect(); this.loops.delete(id); }
  }

  flashRing(amount: number) {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running") return;
    if (!this.tinnitus) {
      const osc = ctx.createOscillator(); osc.frequency.value = 3400;
      const gain = ctx.createGain(); gain.gain.value = 0;
      osc.connect(gain); gain.connect(this.master); osc.start();
      this.tinnitus = { osc, gain };
    }
    const g = this.tinnitus.gain.gain;
    g.cancelScheduledValues(ctx.currentTime);
    g.setValueAtTime(0.06 * amount, ctx.currentTime);
    g.linearRampToValueAtTime(0, ctx.currentTime + 1 + amount * 3);
    this.sfx.gain.cancelScheduledValues(ctx.currentTime);
    this.sfx.gain.setValueAtTime(this.settings.sfx * (1 - 0.7 * amount), ctx.currentTime);
    this.sfx.gain.linearRampToValueAtTime(this.settings.sfx, ctx.currentTime + 1 + amount * 2.5);
  }

  // ---------------- music sequencer
  setMusic(mode: "off" | "menu" | "match") {
    this.musicMode = mode;
    if (!this.ctx) return;
    if (mode === "off") { if (this.musicTimer !== null) { clearInterval(this.musicTimer); this.musicTimer = null; } return; }
    if (this.musicTimer === null) {
      this.nextNoteTime = this.ctx.currentTime + 0.1;
      this.musicTimer = window.setInterval(() => this.schedule(), 50);
    }
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running") return;
    const bpm = this.musicMode === "menu" ? 104 : 118;
    const stepDur = 60 / bpm / 4;
    while (this.nextNoteTime < ctx.currentTime + 0.15) {
      const s = this.musicStep % 16;
      const bar = Math.floor(this.musicStep / 16) % 4;
      const t = this.nextNoteTime;
      const inMatch = this.musicMode === "match";
      // music drops during active combat, rises near the score limit
      const level = inMatch ? Math.max(0, (0.25 + this.intensity * 0.75) * (1 - this.combat * 0.8)) : 1;
      if (level > 0.05) {
        if (s % 4 === 0 && (inMatch ? this.intensity > 0.45 || s === 0 : true)) this.play("kick", { bus: "music", gain: 0.55 * level, when: t, priority: 0 });
        if (s % 4 === 2 && (!inMatch || this.intensity > 0.6)) this.play("hat", { bus: "music", gain: 0.18 * level, when: t, priority: 0 });
        if (s === 12 && bar % 2 === 1) this.play("snare", { bus: "music", gain: 0.25 * level, when: t, priority: 0 });
        const roots = [55, 55 * 1.189, 55 * 0.891, 55 * 1.059];
        if (s % 2 === 0) this.bass(roots[bar] * (s % 8 === 6 ? 2 : 1), t, stepDur * 1.6, 0.16 * level);
        if (s === 0) this.pad(roots[bar] * 4, t, stepDur * 16, 0.05 * level);
      }
      this.musicStep++;
      this.nextNoteTime += stepDur;
    }
  }
  private bass(f: number, t: number, d: number, g: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f;
    const fl = ctx.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.setValueAtTime(900, t); fl.frequency.exponentialRampToValueAtTime(180, t + d);
    const gn = ctx.createGain(); gn.gain.setValueAtTime(g, t); gn.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(fl); fl.connect(gn); gn.connect(this.music); o.start(t); o.stop(t + d + 0.05);
  }
  private pad(f: number, t: number, d: number, g: number) {
    const ctx = this.ctx!;
    for (const m of [1, 1.26, 1.5]) {
      const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.value = f * m;
      const gn = ctx.createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(g, t + d * 0.3); gn.gain.linearRampToValueAtTime(0.0001, t + d);
      o.connect(gn); gn.connect(this.music); o.start(t); o.stop(t + d + 0.05);
    }
  }
}

export const audio = new AudioEngine();
