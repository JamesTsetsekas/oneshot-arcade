/**
 * Procedural Web Audio: buses (music / sfx / ui / ambience) → compressor → master, ducking, ≤40 pooled voices with priority,
 * stereo spatialisation along the camera's screen-right axis, and an original generative score per area/state.
 * Every sound is synthesised at runtime — there are no audio files.
 */
export interface AudioVolumes { master: number; music: number; sfx: number; ui: number; ambience: number }

type Bus = "sfx" | "ui" | "music" | "amb";

const SCALE = [0, 1, 3, 5, 7, 8, 10]; // phrygian-flavoured minor (original random-walk melodies only)

export class AudioSys {
  ctx: AudioContext | null = null;
  master!: GainNode; music!: GainNode; sfx!: GainNode; ui!: GainNode; amb!: GainNode; musicDuck!: GainNode; musicFilter!: BiquadFilterNode;
  vol: AudioVolumes = { master: 0.8, music: 0.55, sfx: 0.8, ui: 0.7, ambience: 0.6 };
  voices = 0;
  maxVoices = 40;
  lx = 0; ly = 0;
  private noise!: AudioBuffer;
  private theme = "";
  private musicT = 0;
  private nextNote = 0;
  private drone: { osc: OscillatorNode[]; gain: GainNode } | null = null;
  private ambNode: { src: AudioBufferSourceNode; gain: GainNode; filt: BiquadFilterNode } | null = null;
  private heartT = 0;
  private lowHealth = false;
  private boss = false;
  private root = 50;
  private lastPlay: Record<string, number> = {};
  private melodyIdx = 3;

  init() {
    if (this.ctx) { if (this.ctx.state === "suspended") this.ctx.resume(); return; }
    const AC = (window as any).AudioContext ?? (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx: AudioContext = new AC();
    this.ctx = ctx;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.2;
    this.master = ctx.createGain(); this.master.connect(comp); comp.connect(ctx.destination);
    this.sfx = ctx.createGain(); this.sfx.connect(this.master);
    this.ui = ctx.createGain(); this.ui.connect(this.master);
    this.amb = ctx.createGain(); this.amb.connect(this.master);
    this.musicFilter = ctx.createBiquadFilter(); this.musicFilter.type = "lowpass"; this.musicFilter.frequency.value = 18000;
    this.musicDuck = ctx.createGain(); this.musicDuck.connect(this.musicFilter); this.musicFilter.connect(this.master);
    this.music = ctx.createGain(); this.music.connect(this.musicDuck);
    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.applyVolumes();
    if (this.theme) { const t = this.theme; this.theme = ""; this.setTheme(t); }
  }

  applyVolumes() {
    if (!this.ctx) return;
    this.master.gain.value = this.vol.master;
    this.music.gain.value = this.vol.music * 0.5;
    this.sfx.gain.value = this.vol.sfx;
    this.ui.gain.value = this.vol.ui;
    this.amb.gain.value = this.vol.ambience * 0.5;
  }

  setListener(x: number, y: number) { this.lx = x; this.ly = y; }

  private spatial(x?: number, y?: number): { pan: number; g: number } | null {
    if (x === undefined || y === undefined) return { pan: 0, g: 1 };
    const dx = x - this.lx, dz = y - this.ly;
    const d = Math.hypot(dx, dz);
    if (d > 38) return null;
    const pan = Math.max(-1, Math.min(1, (dx * 0.707 - dz * 0.707) / 12));
    return { pan, g: 1 / (1 + d / 14) };
  }

  private out(bus: Bus, pan: number): AudioNode {
    const ctx = this.ctx!;
    const target = bus === "ui" ? this.ui : bus === "music" ? this.music : bus === "amb" ? this.amb : this.sfx;
    if (!pan) return target;
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    p.connect(target);
    return p;
  }

  private tone(freq: number, dur: number, o: { type?: OscillatorType; vol?: number; end?: number; attack?: number; bus?: Bus; pan?: number; delay?: number; detune?: number } = {}) {
    const ctx = this.ctx!;
    const t0 = ctx.currentTime + (o.delay ?? 0);
    const osc = ctx.createOscillator();
    osc.type = o.type ?? "sine";
    osc.frequency.setValueAtTime(freq, t0);
    if (o.detune) osc.detune.value = o.detune;
    if (o.end) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.end), t0 + dur);
    const g = ctx.createGain();
    const a = o.attack ?? 0.005;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.vol ?? 0.3), t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(this.out(o.bus ?? "sfx", o.pan ?? 0));
    osc.start(t0); osc.stop(t0 + dur + 0.05);
    this.voices++;
    osc.onended = () => { this.voices--; g.disconnect(); };
  }

  private nz(dur: number, o: { type?: BiquadFilterType; freq?: number; end?: number; q?: number; vol?: number; bus?: Bus; pan?: number; delay?: number; attack?: number } = {}) {
    const ctx = this.ctx!;
    const t0 = ctx.currentTime + (o.delay ?? 0);
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = o.type ?? "bandpass";
    f.frequency.setValueAtTime(o.freq ?? 1000, t0);
    if (o.end) f.frequency.exponentialRampToValueAtTime(Math.max(30, o.end), t0 + dur);
    f.Q.value = o.q ?? 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.vol ?? 0.3), t0 + (o.attack ?? 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(this.out(o.bus ?? "sfx", o.pan ?? 0));
    src.start(t0, Math.random()); src.stop(t0 + dur + 0.05);
    this.voices++;
    src.onended = () => { this.voices--; g.disconnect(); };
  }

  duck(amount = 0.45, dur = 0.6) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const g = this.musicDuck.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(amount, t + 0.05);
    g.linearRampToValueAtTime(1, t + dur);
  }

  /** Play a sound by id. Priority: UI and telegraphs always play; others are virtualised past the voice cap. */
  play(id: string, x?: number, y?: number, vol = 1) {
    if (!this.ctx || this.ctx.state !== "running") return;
    const important = id.startsWith("sfx_tele") || ["sfx_invalid", "sfx_levelup", "sfx_drop_relic", "sfx_quest_done", "sfx_player_death", "sfx_boss_start"].includes(id);
    if (this.voices >= this.maxVoices && !important) return;
    // cooldowns prevent repetitive spam
    const now = this.ctx.currentTime;
    const cd = id === "sfx_gold" ? 0.05 : id === "sfx_ready" ? 0.3 : id === "sfx_alert" ? 0.4 : 0.03;
    if ((this.lastPlay[id] ?? -1) > now - cd) return;
    this.lastPlay[id] = now;
    const sp = this.spatial(x, y);
    if (!sp) return;
    const v = vol * sp.g;
    const pan = sp.pan;
    const T = (f: number, d: number, o: any = {}) => this.tone(f, d, { pan, ...o, vol: (o.vol ?? 0.3) * v });
    const N = (d: number, o: any = {}) => this.nz(d, { pan, ...o, vol: (o.vol ?? 0.3) * v });
    const U = (f: number, d: number, o: any = {}) => this.tone(f, d, { bus: "ui", ...o, vol: (o.vol ?? 0.25) * vol });
    switch (id) {
      case "sfx_swing": case "sfx_swing_heavy": N(0.16, { freq: 900, end: 300, q: 1.5, vol: 0.25 }); break;
      case "sfx_hit_heavy": T(110, 0.14, { end: 45, vol: 0.45 }); N(0.06, { freq: 2500, q: 0.8, vol: 0.2 }); break;
      case "sfx_flame_sweep": N(0.35, { type: "lowpass", freq: 2400, end: 500, vol: 0.35 }); T(160, 0.25, { end: 90, type: "sawtooth", vol: 0.08 }); break;
      case "sfx_shield_rush": N(0.25, { freq: 500, end: 200, vol: 0.35 }); T(80, 0.2, { end: 40, vol: 0.4, delay: 0.2 }); break;
      case "sfx_eruption": case "sfx_explode": N(0.6, { type: "lowpass", freq: 1500, end: 120, vol: 0.55 }); T(70, 0.5, { end: 30, vol: 0.5 }); break;
      case "sfx_chain": for (let i = 0; i < 4; i++) T(1300 + i * 230, 0.08, { type: "square", vol: 0.05, delay: i * 0.03 }); N(0.2, { type: "highpass", freq: 3000, vol: 0.12 }); break;
      case "sfx_ignite": N(0.4, { freq: 300, end: 2000, q: 0.7, vol: 0.25, attack: 0.15 }); break;
      case "sfx_standard": T(220, 0.8, { vol: 0.15, attack: 0.05 }); T(330, 0.8, { vol: 0.12, attack: 0.05 }); T(110, 0.4, { end: 60, vol: 0.3 }); break;
      case "sfx_bow": T(320, 0.12, { type: "triangle", end: 110, vol: 0.25 }); N(0.04, { freq: 4000, vol: 0.12 }); break;
      case "sfx_volley": for (let i = 0; i < 3; i++) T(360 - i * 30, 0.1, { type: "triangle", end: 120, vol: 0.18, delay: i * 0.02 }); break;
      case "sfx_ghostline": T(1100, 0.45, { end: 280, vol: 0.18 }); T(1650, 0.3, { end: 900, vol: 0.08 }); break;
      case "sfx_trap": T(600, 0.08, { type: "square", vol: 0.06 }); N(0.1, { freq: 1500, vol: 0.12 }); break;
      case "sfx_trap_snap": N(0.12, { freq: 2000, q: 2, vol: 0.35 }); T(200, 0.15, { end: 80, vol: 0.25 }); break;
      case "sfx_moth": for (let i = 0; i < 6; i++) N(0.08, { freq: 800 + Math.random() * 800, q: 3, vol: 0.1, delay: i * 0.05 }); break;
      case "sfx_flask": T(2200, 0.06, { vol: 0.12 }); T(1600, 0.08, { vol: 0.1, delay: 0.05 }); N(0.3, { freq: 600, q: 4, vol: 0.12, delay: 0.1 }); break;
      case "sfx_rain": for (let i = 0; i < 8; i++) N(0.06, { freq: 3000, q: 1, vol: 0.12, delay: i * 0.15 }); break;
      case "sfx_block": T(620, 0.22, { type: "square", vol: 0.08 }); T(930, 0.18, { type: "square", vol: 0.05 }); N(0.05, { freq: 3000, vol: 0.2 }); break;
      case "sfx_evade": N(0.22, { freq: 400, end: 1600, q: 1.2, vol: 0.22 }); break;
      // enemy telegraphs: distinct, audible cues
      case "sfx_tele": T(420, 0.2, { end: 640, vol: 0.12 }); break;
      case "sfx_tele_heavy": T(98, 0.9, { vol: 0.35, attack: 0.02 }); T(147, 0.9, { vol: 0.22 }); T(196, 0.6, { vol: 0.12 }); N(0.3, { type: "lowpass", freq: 600, vol: 0.15 }); this.duck(0.55, 0.7); break;
      case "sfx_tele_ranged": T(1250, 0.28, { end: 1700, vol: 0.14 }); break;
      case "sfx_tele_frost": T(1500, 0.6, { end: 700, vol: 0.12 }); T(2250, 0.5, { vol: 0.06 }); break;
      case "sfx_tele_blight": T(180, 0.9, { type: "sawtooth", end: 120, vol: 0.08 }); N(0.9, { freq: 500, q: 6, vol: 0.15 }); break;
      case "sfx_tele_spike": T(700, 0.12, { type: "square", vol: 0.04 }); T(700, 0.12, { type: "square", vol: 0.04, delay: 0.2 }); break;
      case "sfx_tele_vent": N(0.7, { freq: 200, end: 900, vol: 0.18, attack: 0.3 }); break;
      case "sfx_slam": T(60, 0.5, { end: 30, vol: 0.6 }); N(0.4, { type: "lowpass", freq: 900, end: 100, vol: 0.4 }); break;
      case "sfx_enemy_swing": N(0.14, { freq: 700, end: 250, q: 1.5, vol: 0.18 }); break;
      case "sfx_enemy_shot": T(260, 0.1, { type: "triangle", end: 100, vol: 0.18 }); break;
      case "sfx_censer": N(0.5, { freq: 400, q: 3, vol: 0.15 }); break;
      case "sfx_lunge": N(0.25, { freq: 300, end: 900, vol: 0.2 }); T(150, 0.2, { type: "sawtooth", end: 80, vol: 0.06 }); break;
      case "sfx_ward": T(880, 0.5, { vol: 0.08 }); T(1320, 0.5, { vol: 0.05, delay: 0.05 }); break;
      case "sfx_shell": T(1800, 0.4, { vol: 0.06 }); break;
      case "sfx_reflect": T(2400, 0.1, { type: "square", vol: 0.05 }); break;
      case "sfx_alert": N(0.25, { freq: 220, q: 5, vol: 0.12 }); break;
      case "sfx_summon": T(150, 1.1, { type: "sawtooth", end: 300, vol: 0.08, attack: 0.3 }); break;
      case "sfx_enrage": T(80, 1.2, { type: "sawtooth", end: 60, vol: 0.2 }); T(85, 1.2, { type: "sawtooth", end: 62, vol: 0.2 }); break;
      case "sfx_boss_start": T(55, 2, { type: "sawtooth", vol: 0.15, attack: 0.4 }); T(82, 2, { vol: 0.2, attack: 0.4 }); this.duck(0.3, 2); break;
      case "sfx_boss_death": T(110, 2.5, { end: 30, vol: 0.4 }); N(2, { type: "lowpass", freq: 2000, end: 80, vol: 0.4 }); this.chord([0, 7, 12], 3, 0.1, 1); break;
      case "sfx_shatter": for (let i = 0; i < 6; i++) T(2000 + Math.random() * 2000, 0.25, { vol: 0.06, delay: i * 0.02 }); N(0.3, { type: "highpass", freq: 2500, vol: 0.3 }); break;
      case "sfx_death": N(0.25, { type: "lowpass", freq: 700, end: 120, vol: 0.2 }); break;
      case "sfx_player_death": T(220, 1.6, { end: 55, vol: 0.3 }); T(233, 1.6, { end: 58, vol: 0.2 }); this.duck(0.2, 2); break;
      case "sfx_interrupt": T(900, 0.12, { type: "square", end: 400, vol: 0.06 }); break;
      case "sfx_detonate": T(800, 0.3, { end: 200, vol: 0.2 }); N(0.25, { freq: 2500, vol: 0.2 }); break;
      case "sfx_fuse": N(1.1, { type: "highpass", freq: 4000, vol: 0.12 }); break;
      case "sfx_chest": T(300, 0.2, { type: "triangle", vol: 0.15 }); T(450, 0.3, { vol: 0.12, delay: 0.1 }); break;
      case "sfx_urn": N(0.2, { freq: 1800, q: 0.8, vol: 0.3 }); for (let i = 0; i < 4; i++) T(1200 + Math.random() * 1500, 0.08, { vol: 0.05, delay: 0.03 * i }); break;
      case "sfx_lever": T(140, 0.3, { type: "square", end: 90, vol: 0.06 }); N(0.5, { freq: 300, q: 2, vol: 0.2 }); break;
      case "sfx_heal": T(660, 0.4, { vol: 0.08 }); break;
      // UI
      case "sfx_invalid": U(180, 0.09, { type: "square", vol: 0.06 }); U(140, 0.12, { type: "square", vol: 0.06, delay: 0.1 }); break;
      case "sfx_ready": U(1760, 0.08, { vol: 0.04 }); break;
      case "sfx_potion": for (let i = 0; i < 3; i++) U(400 + i * 90, 0.08, { vol: 0.1, delay: i * 0.08 }); break;
      case "sfx_potion_pick": U(900, 0.06, { vol: 0.08 }); U(1200, 0.08, { vol: 0.07, delay: 0.05 }); break;
      case "sfx_gold": for (let i = 0; i < 3; i++) U(2400 + Math.random() * 1200, 0.06, { vol: 0.05, delay: i * 0.03 }); break;
      case "sfx_globe": U(520, 0.3, { vol: 0.1 }); U(780, 0.3, { vol: 0.07, delay: 0.05 }); break;
      case "sfx_echo": this.chord([0, 5, 10], 1.6, 0.08, 2); break;
      case "sfx_pickup": U(600, 0.07, { type: "triangle", vol: 0.12 }); break;
      case "sfx_drop": T(400, 0.08, { type: "triangle", vol: 0.1 }); break;
      case "sfx_drop_inscribed": U(988, 0.35, { vol: 0.12 }); U(1319, 0.5, { vol: 0.1, delay: 0.1 }); break;
      case "sfx_drop_relic": U(659, 0.5, { vol: 0.14 }); U(988, 0.6, { vol: 0.12, delay: 0.12 }); U(1480, 0.9, { vol: 0.1, delay: 0.24 }); U(110, 1.2, { type: "sawtooth", vol: 0.05, attack: 0.3 }); break;
      case "sfx_equip": N(0.1, { freq: 1500, q: 1, vol: 0.15, bus: "ui" }); U(300, 0.08, { type: "square", vol: 0.03 }); break;
      case "sfx_levelup": [0, 4, 7, 12, 16].forEach((s, i) => U(440 * Math.pow(2, s / 12), 0.5, { vol: 0.1, delay: i * 0.08 })); break;
      case "sfx_quest": U(587, 0.25, { vol: 0.1 }); U(880, 0.4, { vol: 0.08, delay: 0.12 }); break;
      case "sfx_quest_done": [0, 7, 12].forEach((s, i) => U(392 * Math.pow(2, s / 12), 0.8, { vol: 0.1, delay: i * 0.15 })); break;
      case "sfx_waypoint": for (let i = 0; i < 6; i++) U(1200 + i * 200, 0.4, { vol: 0.05, delay: i * 0.05 }); break;
      case "sfx_skill": U(700, 0.1, { type: "triangle", vol: 0.1 }); break;
      case "sfx_salvage": N(0.25, { freq: 2500, q: 1, vol: 0.2, bus: "ui" }); break;
      case "sfx_craft": U(500, 0.15, { type: "square", vol: 0.04 }); U(750, 0.25, { vol: 0.08, delay: 0.12 }); break;
      case "sfx_identify": U(880, 0.3, { vol: 0.08 }); U(1100, 0.3, { vol: 0.06, delay: 0.08 }); break;
      case "sfx_socket": U(1400, 0.12, { vol: 0.08 }); break;
      case "sfx_channel": U(220, 2.5, { end: 660, vol: 0.06, attack: 0.5 }); break;
      case "sfx_shrine": this.chord([0, 4, 7], 1.5, 0.07, 2); break;
      default: T(500, 0.05, { vol: 0.03 });
    }
  }

  private chord(semis: number[], dur: number, vol: number, oct = 1) {
    for (const s of semis) this.tone(110 * oct * Math.pow(2, s / 12), dur, { vol, attack: 0.1, bus: "ui" });
  }

  setTheme(theme: string) {
    if (theme === this.theme) return;
    this.theme = theme;
    if (!this.ctx) return;
    const ctx = this.ctx;
    // crossfade drone
    if (this.drone) { const d = this.drone; d.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.6); setTimeout(() => d.osc.forEach((o) => o.stop()), 3000); }
    if (this.ambNode) { const a = this.ambNode; a.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.6); setTimeout(() => a.src.stop(), 3000); }
    this.root = theme === "refuge" ? 48 : theme === "archive" ? 45 : theme === "boss" ? 43 : 50;
    const g = ctx.createGain();
    g.gain.value = 0.0001;
    const filt = ctx.createBiquadFilter(); filt.type = "lowpass"; filt.frequency.value = theme === "boss" ? 900 : 420; filt.Q.value = 2;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07; const lfoG = ctx.createGain(); lfoG.gain.value = 180; lfo.connect(lfoG); lfoG.connect(filt.frequency); lfo.start();
    const base = 440 * Math.pow(2, (this.root - 69) / 12);
    const oscs: OscillatorNode[] = [lfo];
    const voices = theme === "boss" ? [0, 1, 12] : theme === "victory" ? [0, 7, 16] : [0, 7, 12];
    for (const s of voices) for (const det of [-7, 6]) {
      const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = (base / 2) * Math.pow(2, s / 12); o.detune.value = det;
      o.connect(filt); o.start(); oscs.push(o);
    }
    filt.connect(g); g.connect(this.music);
    g.gain.setTargetAtTime(theme === "boss" ? 0.09 : 0.06, ctx.currentTime, 1.5);
    this.drone = { osc: oscs, gain: g };
    // ambience bed
    const src = ctx.createBufferSource(); src.buffer = this.noise; src.loop = true;
    const af = ctx.createBiquadFilter(); af.type = "bandpass"; af.frequency.value = theme === "archive" ? 300 : theme === "refuge" ? 700 : 500; af.Q.value = 0.6;
    const ag = ctx.createGain(); ag.gain.value = 0.0001;
    const alfo = ctx.createOscillator(); alfo.frequency.value = 0.11; const alfoG = ctx.createGain(); alfoG.gain.value = 220; alfo.connect(alfoG); alfoG.connect(af.frequency); alfo.start();
    src.connect(af); af.connect(ag); ag.connect(this.amb); src.start();
    ag.gain.setTargetAtTime(theme === "archive" ? 0.05 : 0.09, ctx.currentTime, 2);
    this.ambNode = { src, gain: ag, filt: af };
    this.nextNote = ctx.currentTime + 1.5;
    this.boss = theme === "boss";
  }

  update(dt: number, hpFrac: number, theme: string) {
    if (!this.ctx || this.ctx.state !== "running") return;
    this.setTheme(theme);
    const ctx = this.ctx;
    this.musicT += dt;
    // sparse generative melody: random walk on an original scale
    if (ctx.currentTime >= this.nextNote) {
      const spacing = this.boss ? 0.45 : this.theme === "refuge" ? 2.4 : 3.2;
      this.nextNote = ctx.currentTime + spacing * (0.6 + Math.random() * 0.8);
      this.melodyIdx = Math.max(0, Math.min(13, this.melodyIdx + Math.floor(Math.random() * 5) - 2));
      const deg = SCALE[this.melodyIdx % 7] + 12 * Math.floor(this.melodyIdx / 7);
      const f = 440 * Math.pow(2, (this.root + 12 + deg - 69) / 12);
      if (this.boss) {
        this.nz(0.18, { type: "lowpass", freq: 200, vol: 0.28, bus: "music" });
        if (Math.random() < 0.4) this.tone(f, 0.4, { type: "triangle", vol: 0.06, bus: "music" });
      } else {
        this.tone(f, 2.4, { type: Math.random() < 0.5 ? "sine" : "triangle", vol: 0.07, attack: 0.4, bus: "music" });
        if (Math.random() < 0.25) this.tone(f * 2, 3.5, { vol: 0.025, attack: 0.02, bus: "music", delay: 0.3 }); // distant bell
      }
      if (this.theme === "archive" && Math.random() < 0.5) this.tone(1800 + Math.random() * 1500, 0.12, { vol: 0.03, bus: "amb", delay: Math.random() }); // dripping vault
      if (this.theme === "march" && Math.random() < 0.15) { this.tone(196, 4, { vol: 0.02, bus: "amb", attack: 0.01 }); this.tone(293, 4, { vol: 0.012, bus: "amb" }); } // distant bells
    }
    // low-health state: heartbeat + muffled music
    const low = hpFrac > 0 && hpFrac < 0.3;
    if (low !== this.lowHealth) { this.lowHealth = low; this.musicFilter.frequency.setTargetAtTime(low ? 700 : 18000, ctx.currentTime, 0.3); }
    if (low) {
      this.heartT -= dt;
      if (this.heartT <= 0) { this.heartT = 0.85; this.tone(55, 0.15, { vol: 0.35, bus: "ui" }); this.tone(50, 0.15, { vol: 0.25, bus: "ui", delay: 0.18 }); }
    }
  }
}
