// audio: thin Web Audio mixer (master -> sfx / ui / music buses). All sounds are synthesised at runtime (original, no samples).
export type Faction = 'helix' | 'verdant' | 'neutral';

interface Bus { gain: GainNode }

export class AudioEngine {
  ctx: AudioContext | null = null;
  master!: GainNode;
  sfx!: Bus;
  ui!: Bus;
  music!: Bus;
  private noiseBuf: AudioBuffer | null = null;
  private voices = 0;
  private lastPlay = new Map<string, number>();
  private vol = { master: 0.8, sfx: 0.9, music: 0.5, ui: 0.9 };
  private muted = false;
  intensity = 0;
  private targetIntensity = 0;
  private musicNodes: { pad: GainNode; pulse: GainNode; lead: GainNode; oscs: OscillatorNode[]; filter: BiquadFilterNode } | null = null;
  private beatTimer: number | null = null;
  private beat = 0;
  private chord = 0;
  private camX = 64;
  private camY = 64;
  private lastAlertAt = 0;

  /** must be called from a user gesture */
  init() {
    if (this.ctx) { void this.ctx.resume(); return; }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    const c = this.ctx;
    this.master = c.createGain();
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    this.master.connect(comp).connect(c.destination);
    const mk = (): Bus => { const g = c.createGain(); g.connect(this.master); return { gain: g }; };
    this.sfx = mk(); this.ui = mk(); this.music = mk();
    const len = c.sampleRate * 1;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.applyVolumes();
  }

  setVolumes(v: { master: number; sfx: number; music: number; ui: number }, muted: boolean) {
    this.vol = v; this.muted = muted;
    this.applyVolumes();
  }
  private applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.muted ? 0 : this.vol.master, t, 0.03);
    this.sfx.gain.gain.setTargetAtTime(this.vol.sfx, t, 0.03);
    this.ui.gain.gain.setTargetAtTime(this.vol.ui, t, 0.03);
    this.music.gain.gain.setTargetAtTime(this.vol.music * 0.5, t, 0.1);
  }
  setListener(x: number, y: number) { this.camX = x; this.camY = y; }

  // ------------------------------------------------------------ primitives
  private out(bus: Bus, pan: number, vol: number): { node: GainNode } | null {
    const c = this.ctx!;
    const g = c.createGain();
    g.gain.value = vol;
    let tail: AudioNode = g;
    if (Math.abs(pan) > 0.01 && c.createStereoPanner) {
      const p = c.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan));
      g.connect(p); tail = p;
    }
    tail.connect(bus.gain);
    return { node: g };
  }
  private tone(bus: Bus, freq: number, dur: number, type: OscillatorType, vol: number, slideTo = 0, pan = 0, delay = 0, lp = 0) {
    if (!this.ctx || this.voices > 28) return;
    const c = this.ctx;
    const t0 = c.currentTime + delay;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo > 0) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    const env = this.out(bus, pan, 0)!;
    env.node.gain.setValueAtTime(0.0001, t0);
    env.node.gain.linearRampToValueAtTime(vol, t0 + Math.min(0.01, dur * 0.3));
    env.node.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let src: AudioNode = o;
    if (lp > 0) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); src = f; }
    src.connect(env.node);
    o.start(t0); o.stop(t0 + dur + 0.02);
    this.voices++;
    o.onended = () => { this.voices--; };
  }
  private noise(bus: Bus, dur: number, vol: number, filt: BiquadFilterType, freq: number, q = 1, pan = 0, delay = 0, sweepTo = 0) {
    if (!this.ctx || !this.noiseBuf || this.voices > 28) return;
    const c = this.ctx;
    const t0 = c.currentTime + delay;
    const s = c.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = true;
    const f = c.createBiquadFilter();
    f.type = filt; f.frequency.setValueAtTime(freq, t0); f.Q.value = q;
    if (sweepTo > 0) f.frequency.exponentialRampToValueAtTime(sweepTo, t0 + dur);
    const env = this.out(bus, pan, 0)!;
    env.node.gain.setValueAtTime(0.0001, t0);
    env.node.gain.linearRampToValueAtTime(vol, t0 + 0.004);
    env.node.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f).connect(env.node);
    s.start(t0, Math.random() * 0.5); s.stop(t0 + dur + 0.02);
    this.voices++;
    s.onended = () => { this.voices--; };
  }

  private gate(key: string, ms: number): boolean {
    const now = performance.now();
    if (now - (this.lastPlay.get(key) ?? -1e9) < ms) return false;
    this.lastPlay.set(key, now);
    return true;
  }

  // ------------------------------------------------------------ gameplay sounds
  /** positional combat sounds: distance attenuation + pan relative to the camera focus */
  world(kind: string, x: number, y: number, faction: Faction = 'neutral') {
    if (!this.ctx) return;
    const dx = x - this.camX, dy = y - this.camY;
    const d = Math.hypot(dx, dy);
    if (d > 70) return;
    const att = Math.max(0.12, 1 - d / 70);
    const pan = Math.max(-1, Math.min(1, dx / 40));
    const lim = kind.startsWith('shot') ? 45 : 60;
    if (!this.gate(kind + Math.round(x / 6) + ':' + Math.round(y / 6), lim)) return;
    const v = 0.5 * att;
    const b = this.sfx;
    switch (kind) {
      case 'shot_rifle': this.noise(b, 0.07, v * 0.7, 'bandpass', 2600, 1.5, pan); this.tone(b, 260, 0.08, 'sawtooth', v * 0.35, 90, pan, 0, 1800); break;
      case 'shot_lance': this.tone(b, 1900, 0.22, 'sawtooth', v * 0.4, 260, pan, 0, 3200); this.noise(b, 0.16, v * 0.3, 'highpass', 3000, 0.7, pan); break;
      case 'shot_arc': this.tone(b, 700, 0.1, 'square', v * 0.3, 200, pan); this.noise(b, 0.06, v * 0.4, 'bandpass', 1800, 2, pan); break;
      case 'shot_mortar': this.tone(b, 130, 0.35, 'sine', v * 0.9, 38, pan); this.noise(b, 0.3, v * 0.6, 'lowpass', 700, 0.8, pan, 0, 150); break;
      case 'shot_spore': this.tone(b, 420, 0.16, 'sine', v * 0.5, 880, pan); this.noise(b, 0.12, v * 0.35, 'bandpass', 1300, 3, pan); break;
      case 'shot_thorn': this.noise(b, 0.05, v * 0.55, 'highpass', 4200, 0.8, pan); break;
      case 'shot_claw': this.noise(b, 0.06, v * 0.45, 'highpass', 3000, 0.8, pan); this.tone(b, 200, 0.05, 'triangle', v * 0.25, 120, pan); break;
      case 'shot_beast': this.tone(b, 90, 0.2, 'sawtooth', v * 0.6, 50, pan, 0, 500); this.noise(b, 0.14, v * 0.5, 'lowpass', 1000, 1, pan); break;
      case 'shot_stag': this.tone(b, 70, 0.4, 'sine', v * 0.8, 130, pan); this.noise(b, 0.3, v * 0.4, 'bandpass', 500, 2, pan); break;
      case 'shot_needle': this.tone(b, 3200, 0.05, 'triangle', v * 0.3, 1800, pan); break;
      case 'impact': this.noise(b, 0.07, v * 0.45, 'lowpass', 1800, 1, pan); break;
      case 'impact_big': this.noise(b, 0.2, v * 0.8, 'lowpass', 900, 1, pan, 0, 200); this.tone(b, 90, 0.2, 'sine', v * 0.6, 40, pan); break;
      case 'erupt': this.tone(b, 110, 0.5, 'sine', v * 0.9, 30, pan); this.noise(b, 0.45, v * 0.7, 'lowpass', 800, 1, pan, 0, 120); break;
      case 'death': this.tone(b, 320, 0.3, 'sawtooth', v * 0.3, 70, pan, 0, 1200); this.noise(b, 0.25, v * 0.4, 'lowpass', 1400, 1, pan, 0, 300); break;
      case 'death_struct': this.noise(b, 0.7, v * 1.0, 'lowpass', 1100, 1, pan, 0, 120); this.tone(b, 70, 0.7, 'sine', v * 0.9, 25, pan); break;
      case 'build': this.noise(b, 0.08, v * 0.5, 'bandpass', 900, 2, pan); this.tone(b, 160, 0.1, 'square', v * 0.2, 90, pan); break;
      case 'heal': this.tone(b, 700, 0.12, 'sine', v * 0.25, 1100, pan); break;
      default: break;
    }
    void faction;
  }

  /** ui / non-positional */
  ui_(kind: string, faction: Faction = 'neutral') {
    if (!this.ctx) return;
    const b = this.ui;
    const helix = faction !== 'verdant';
    switch (kind) {
      case 'select': if (!this.gate('select', 40)) return; if (helix) { this.tone(b, 880, 0.05, 'square', 0.1, 1200); this.tone(b, 1320, 0.04, 'square', 0.05, 0, 0, 0.03); } else { this.tone(b, 660, 0.12, 'sine', 0.18, 990); this.noise(b, 0.08, 0.06, 'bandpass', 2500, 4); } break;
      case 'ack': if (!this.gate('ack', 50)) return; if (helix) { this.tone(b, 300, 0.05, 'square', 0.08, 360); this.tone(b, 420, 0.05, 'square', 0.06, 0, 0, 0.05); } else { this.tone(b, 380, 0.14, 'triangle', 0.16, 520); } break;
      case 'attackAck': if (!this.gate('ack', 50)) return; if (helix) { this.tone(b, 240, 0.08, 'sawtooth', 0.1, 180, 0, 0, 1400); this.tone(b, 360, 0.06, 'sawtooth', 0.08, 0, 0, 0.07, 1400); } else { this.tone(b, 220, 0.16, 'sawtooth', 0.12, 300, 0, 0, 900); } break;
      case 'error': if (!this.gate('error', 150)) return; this.tone(b, 130, 0.14, 'square', 0.12, 90); this.tone(b, 110, 0.12, 'square', 0.08, 70, 0, 0.1); break;
      case 'click': if (!this.gate('click', 30)) return; this.tone(b, 1100, 0.025, 'square', 0.06); break;
      case 'queue': this.tone(b, 700, 0.06, 'triangle', 0.12, 900); break;
      case 'complete': this.tone(b, 523, 0.14, 'triangle', 0.16); this.tone(b, 659, 0.14, 'triangle', 0.14, 0, 0, 0.1); this.tone(b, 784, 0.22, 'triangle', 0.14, 0, 0, 0.2); break;
      case 'trained': if (!this.gate('trained', 200)) return; this.tone(b, 600, 0.09, 'triangle', 0.14); this.tone(b, 900, 0.12, 'triangle', 0.12, 0, 0, 0.08); break;
      case 'research': this.tone(b, 784, 0.16, 'sine', 0.16); this.tone(b, 1175, 0.2, 'sine', 0.14, 0, 0, 0.12); this.tone(b, 1568, 0.3, 'sine', 0.1, 0, 0, 0.24); break;
      case 'attack': { const now = performance.now(); if (now - this.lastAlertAt < 4500) return; this.lastAlertAt = now; this.tone(b, 440, 0.12, 'square', 0.16); this.tone(b, 330, 0.12, 'square', 0.16, 0, 0, 0.14); this.tone(b, 440, 0.12, 'square', 0.16, 0, 0, 0.28); this.tone(b, 330, 0.16, 'square', 0.16, 0, 0, 0.42); break; }
      case 'supply': if (!this.gate('supply', 5000)) return; this.tone(b, 200, 0.12, 'triangle', 0.18); this.tone(b, 200, 0.12, 'triangle', 0.18, 0, 0, 0.18); break;
      case 'depleted': if (!this.gate('depleted', 5000)) return; this.tone(b, 500, 0.25, 'sine', 0.14, 250); break;
      case 'ping': this.tone(b, 1000, 0.4, 'sine', 0.2, 700); break;
      case 'captured': this.tone(b, 392, 0.12, 'triangle', 0.16); this.tone(b, 587, 0.2, 'triangle', 0.16, 0, 0, 0.12); break;
      case 'pod': this.tone(b, 1046, 0.1, 'sine', 0.16); this.tone(b, 1568, 0.2, 'sine', 0.14, 0, 0, 0.08); break;
      case 'victory': [523, 659, 784, 1047].forEach((f, i) => this.tone(b, f, 0.4, 'triangle', 0.18, 0, 0, i * 0.16)); break;
      case 'defeat': [392, 349, 311, 262].forEach((f, i) => this.tone(b, f, 0.5, 'sawtooth', 0.12, f * 0.97, 0, i * 0.22, 900)); break;
      case 'pulse': this.tone(b, 300, 0.8, 'sine', 0.2, 900); break;
      default: break;
    }
  }

  // ------------------------------------------------------------ adaptive score
  startMusic(faction: Faction) {
    if (!this.ctx || this.musicNodes) return;
    const c = this.ctx;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 900; filter.Q.value = 0.7;
    const pad = c.createGain(); pad.gain.value = 0.5;
    const pulse = c.createGain(); pulse.gain.value = 0;
    const lead = c.createGain(); lead.gain.value = 0;
    filter.connect(pad); pad.connect(this.music.gain); pulse.connect(this.music.gain); lead.connect(this.music.gain);
    const oscs: OscillatorNode[] = [];
    const base = faction === 'verdant' ? 98 : 82.4;
    [1, 1.5, 2, 2.01].forEach((m, i) => {
      const o = c.createOscillator();
      o.type = i < 2 ? 'sawtooth' : 'triangle';
      o.frequency.value = base * m;
      o.detune.value = (i - 1.5) * 6;
      const g = c.createGain(); g.gain.value = i < 2 ? 0.18 : 0.12;
      o.connect(g).connect(filter);
      o.start();
      oscs.push(o);
    });
    this.musicNodes = { pad, pulse, lead, oscs, filter };
    const roots = faction === 'verdant' ? [98, 116.5, 87.3, 110] : [82.4, 98, 73.4, 87.3];
    this.beat = 0;
    this.beatTimer = window.setInterval(() => {
      if (!this.ctx || !this.musicNodes) return;
      this.beat++;
      // intensity hysteresis: fast attack, slow release
      if (this.targetIntensity > this.intensity) this.intensity = Math.min(this.targetIntensity, this.intensity + 0.12);
      else this.intensity = Math.max(this.targetIntensity, this.intensity - 0.012);
      const t = c.currentTime;
      if (this.beat % 16 === 0) {
        this.chord = (this.chord + 1) % roots.length;
        const r = roots[this.chord];
        [1, 1.5, 2, 2.01].forEach((m, i) => oscs[i].frequency.setTargetAtTime(r * m, t, 0.8));
      }
      this.musicNodes.filter.frequency.setTargetAtTime(500 + this.intensity * 1800, t, 0.4);
      this.musicNodes.pad.gain.setTargetAtTime(0.55 - this.intensity * 0.15, t, 0.5);
      // rhythmic stem fades in with threat, lead with battle
      const r = roots[this.chord];
      if (this.intensity > 0.2 && this.beat % 2 === 0) this.musicPerc(this.beat % 4 === 0 ? r / 2 : r, 0.18 * this.intensity, faction);
      if (this.intensity > 0.55 && this.beat % 2 === 1) this.musicPerc(r * 2, 0.1 * this.intensity, faction);
    }, 280);
  }
  private musicPerc(f: number, vol: number, faction: Faction) {
    const b = this.music;
    if (faction === 'verdant') this.tone(b, f * 2, 0.35, 'sine', vol * 0.8, f * 2.3);
    else { this.tone(b, f, 0.14, 'triangle', vol, f * 0.5); this.noise(b, 0.05, vol * 0.4, 'highpass', 5000, 0.5); }
  }
  /** called each second from the game: 0 calm .. 1 heavy fighting */
  setIntensity(v: number) { this.targetIntensity = Math.max(0, Math.min(1, v)); }
  stopMusic() {
    if (this.beatTimer) { clearInterval(this.beatTimer); this.beatTimer = null; }
    if (this.musicNodes) {
      for (const o of this.musicNodes.oscs) { try { o.stop(); } catch { /* already stopped */ } }
      this.musicNodes = null;
    }
    this.intensity = 0; this.targetIntensity = 0;
  }
}

export const audio = new AudioEngine();
