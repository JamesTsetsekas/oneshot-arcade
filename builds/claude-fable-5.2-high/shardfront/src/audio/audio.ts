// audio: thin Web Audio mixer with grouped buses, positional one-shots with concurrency limits, and a small
// generative adaptive score. Every sound is synthesised at runtime - there are no audio files.
import type { Settings } from '../app/settings';

type Wave = OscillatorType;
const MAX_VOICES = 28;

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode; private musicBus!: GainNode; private sfxBus!: GainNode; private uiBus!: GainNode;
  private noiseBuf!: AudioBuffer;
  private voices = 0;
  private last = new Map<string, number>();
  private lx = 80; private lz = 80; private lh = 44;
  private vol = { master: 0.8, music: 0.5, sfx: 0.8, ui: 0.7 };
  private musicTimer: number | null = null;
  private step = 0; private nextStepTime = 0;
  private intensity = 0; private intensityTarget = 0; private battle = false;
  private faction: 'helix' | 'chorus' = 'helix';
  endgame = false;

  /** Must be called from a user gesture at least once. */
  init(): void {
    if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      this.ctx = ctx;
      this.master = ctx.createGain();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.2;
      this.master.connect(comp); comp.connect(ctx.destination);
      this.musicBus = ctx.createGain(); this.sfxBus = ctx.createGain(); this.uiBus = ctx.createGain();
      // gentle feedback delay gives the score some space
      const delay = ctx.createDelay(1); delay.delayTime.value = 0.36;
      const fb = ctx.createGain(); fb.gain.value = 0.28;
      const wet = ctx.createGain(); wet.gain.value = 0.35;
      this.musicBus.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(this.master);
      this.musicBus.connect(this.master); this.sfxBus.connect(this.master); this.uiBus.connect(this.master);
      const len = ctx.sampleRate;
      this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.applyVolumes();
    } catch { this.ctx = null; }
  }

  setVolumes(s: Settings): void {
    this.vol = { master: s.master, music: s.music, sfx: s.sfx, ui: s.ui };
    this.applyVolumes();
  }

  private applyVolumes(): void {
    if (!this.ctx) return;
    this.master.gain.value = this.vol.master;
    this.musicBus.gain.value = this.vol.music * 0.5;
    this.sfxBus.gain.value = this.vol.sfx * 0.7;
    this.uiBus.gain.value = this.vol.ui * 0.6;
  }

  setListener(x: number, z: number, h: number): void { this.lx = x; this.lz = z; this.lh = h; }

  suspend(): void { if (this.ctx && this.ctx.state === 'running') void this.ctx.suspend(); }
  resume(): void { if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume(); }

  // ------------------------------------------------------------------ primitives
  private tone(bus: GainNode, type: Wave, f0: number, f1: number, dur: number, gain: number, pan = 0, delay = 0, attack = 0.004): void {
    const ctx = this.ctx as AudioContext;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node: AudioNode = g;
    if (pan !== 0) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); node = p; }
    o.connect(g); node.connect(bus);
    o.start(t); o.stop(t + dur + 0.02);
  }

  private noise(bus: GainNode, filter: BiquadFilterType, f0: number, f1: number, dur: number, gain: number, pan = 0, delay = 0, q = 0.8): void {
    const ctx = this.ctx as AudioContext;
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    src.loopStart = Math.random() * 0.5; src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = filter; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node: AudioNode = g;
    if (pan !== 0) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); node = p; }
    src.connect(f); f.connect(g); node.connect(bus);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  }

  private gate(name: string, minGap: number): boolean {
    if (!this.ctx || this.ctx.state !== 'running') return false;
    const now = this.ctx.currentTime;
    const l = this.last.get(name) ?? -10;
    if (now - l < minGap) return false;
    this.last.set(name, now);
    return true;
  }

  /** Positional world sound. Distant sources are virtualised (skipped). */
  play(name: string, x: number, z: number): void {
    if (!this.ctx) return;
    const dx = x - this.lx, dz = z - this.lz;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const att = 1 / (1 + (dist / (26 + this.lh * 0.5)) ** 2);
    if (att < 0.06 || this.voices >= MAX_VOICES) return;
    if (!this.gate(name, 0.045)) return;
    const pan = Math.max(-0.9, Math.min(0.9, dx / 40));
    const g = att * (44 / (this.lh + 20)) * 1.25;
    const b = this.sfxBus;
    let dur = 0.2;
    switch (name) {
      case 'rifle': this.noise(b, 'highpass', 2400, 900, 0.06, 0.3 * g, pan); this.tone(b, 'square', 520, 170, 0.05, 0.1 * g, pan); dur = 0.08; break;
      case 'lance': this.tone(b, 'sawtooth', 1500, 180, 0.26, 0.16 * g, pan); this.noise(b, 'bandpass', 3000, 600, 0.2, 0.2 * g, pan); dur = 0.28; break;
      case 'shell': this.tone(b, 'sine', 160, 48, 0.28, 0.4 * g, pan); this.noise(b, 'lowpass', 500, 120, 0.22, 0.35 * g, pan); dur = 0.3; break;
      case 'boom': this.noise(b, 'lowpass', 1100, 70, 0.55, 0.6 * g, pan); this.tone(b, 'sine', 95, 32, 0.5, 0.5 * g, pan); dur = 0.55; break;
      case 'arc': this.tone(b, 'square', 900, 1500, 0.07, 0.09 * g, pan); this.noise(b, 'highpass', 4000, 2500, 0.09, 0.16 * g, pan); dur = 0.1; break;
      case 'claw': this.noise(b, 'bandpass', 1500, 700, 0.07, 0.3 * g, pan, 0, 2); dur = 0.08; break;
      case 'gore': this.noise(b, 'bandpass', 600, 240, 0.14, 0.4 * g, pan, 0, 1.5); this.tone(b, 'sine', 130, 60, 0.16, 0.3 * g, pan); dur = 0.18; break;
      case 'spore': this.tone(b, 'sine', 420, 640, 0.13, 0.14 * g, pan, 0, 0.02); this.noise(b, 'bandpass', 900, 1400, 0.1, 0.1 * g, pan, 0, 3); dur = 0.14; break;
      case 'needle': this.tone(b, 'triangle', 1900, 900, 0.05, 0.12 * g, pan); dur = 0.06; break;
      case 'eruption': this.tone(b, 'sine', 72, 38, 0.6, 0.5 * g, pan); this.noise(b, 'lowpass', 340, 90, 0.5, 0.4 * g, pan); this.tone(b, 'sine', 700, 1300, 0.3, 0.05 * g, pan, 0.05, 0.05); dur = 0.6; break;
      case 'tool': this.tone(b, 'triangle', 950, 700, 0.03, 0.05 * g, pan); dur = 0.04; break;
      case 'death_mech': this.noise(b, 'lowpass', 2000, 90, 0.45, 0.45 * g, pan); this.tone(b, 'sawtooth', 210, 40, 0.4, 0.2 * g, pan); dur = 0.45; break;
      case 'death_bio': this.tone(b, 'sine', 520, 110, 0.36, 0.22 * g, pan, 0, 0.02); this.noise(b, 'bandpass', 800, 300, 0.3, 0.25 * g, pan, 0, 2); dur = 0.36; break;
      case 'collapse': this.noise(b, 'lowpass', 700, 50, 1.1, 0.7 * g, pan); this.tone(b, 'sine', 70, 28, 1.0, 0.55 * g, pan); dur = 1.1; break;
      case 'place': this.tone(b, 'triangle', 300, 460, 0.12, 0.18 * g, pan); dur = 0.12; break;
      case 'mend': this.tone(b, 'sine', 520, 780, 0.5, 0.12 * g, pan, 0, 0.08); this.tone(b, 'sine', 780, 1040, 0.5, 0.08 * g, pan, 0.12, 0.08); dur = 0.6; break;
      case 'ability': this.tone(b, 'triangle', 600, 900, 0.12, 0.14 * g, pan); dur = 0.12; break;
      case 'heal': this.tone(b, 'sine', 880, 990, 0.08, 0.04 * g, pan); dur = 0.08; break;
      default: return;
    }
    this.voices++;
    window.setTimeout(() => { this.voices--; }, dur * 1000);
  }

  /** Non-positional interface / notification cue. */
  ui(name: string): void {
    if (!this.ctx || !this.gate('ui:' + name, name === 'alert_attack' ? 2.5 : 0.06)) return;
    const b = this.uiBus;
    const helix = this.faction === 'helix';
    switch (name) {
      case 'click': this.tone(b, 'sine', 900, 700, 0.03, 0.2); break;
      case 'hover': this.tone(b, 'sine', 1200, 1200, 0.015, 0.06); break;
      case 'select': if (helix) this.tone(b, 'square', 660, 880, 0.05, 0.07); else this.tone(b, 'sine', 520, 780, 0.09, 0.14, 0, 0, 0.015); break;
      case 'move': if (helix) { this.tone(b, 'square', 440, 440, 0.04, 0.06); this.tone(b, 'square', 587, 587, 0.05, 0.06, 0, 0.05); } else this.tone(b, 'sine', 392, 523, 0.12, 0.13, 0, 0, 0.02); break;
      case 'attack': if (helix) { this.tone(b, 'square', 330, 330, 0.04, 0.07); this.tone(b, 'square', 330, 262, 0.07, 0.07, 0, 0.06); } else this.tone(b, 'sine', 620, 440, 0.14, 0.14, 0, 0, 0.02); break;
      case 'error': this.tone(b, 'square', 170, 150, 0.1, 0.12); this.tone(b, 'square', 130, 120, 0.14, 0.12, 0, 0.1); break;
      case 'built': [440, 554, 659].forEach((f, i) => this.tone(b, helix ? 'triangle' : 'sine', f, f, 0.16, 0.14, 0, i * 0.08)); break;
      case 'trained': this.tone(b, 'triangle', 523, 523, 0.08, 0.12); this.tone(b, 'triangle', 784, 784, 0.12, 0.12, 0, 0.08); break;
      case 'research': [392, 494, 587, 784].forEach((f, i) => this.tone(b, 'triangle', f, f, 0.2, 0.13, 0, i * 0.09)); break;
      case 'alert_attack': for (let i = 0; i < 2; i++) { this.tone(b, 'sawtooth', 880, 880, 0.09, 0.1, 0, i * 0.22); this.tone(b, 'sawtooth', 660, 660, 0.09, 0.1, 0, i * 0.22 + 0.1); } break;
      case 'alert': this.tone(b, 'triangle', 700, 560, 0.14, 0.16); break;
      case 'ping': this.tone(b, 'sine', 1040, 1040, 0.18, 0.14); this.tone(b, 'sine', 1560, 1560, 0.2, 0.07, 0, 0.05); break;
      case 'capture': [523, 659, 784, 1047].forEach((f, i) => this.tone(b, 'sine', f, f, 0.22, 0.1, 0, i * 0.07)); break;
      case 'salvage': [784, 988, 1175].forEach((f, i) => this.tone(b, 'triangle', f, f, 0.12, 0.1, 0, i * 0.05)); break;
      case 'pulse': this.tone(b, 'sine', 60, 240, 1.4, 0.3, 0, 0, 0.3); this.noise(b, 'bandpass', 300, 2400, 1.2, 0.12, 0, 0, 1.2); break;
      case 'victory': [392, 494, 587, 784, 988].forEach((f, i) => this.tone(b, 'triangle', f, f, 0.5, 0.16, 0, i * 0.13)); break;
      case 'defeat': [392, 370, 311, 233].forEach((f, i) => this.tone(b, 'sawtooth', f, f * 0.98, 0.6, 0.09, 0, i * 0.22)); break;
      case 'step': this.tone(b, 'sine', 660, 990, 0.2, 0.14, 0, 0, 0.02); break;
    }
  }

  // ------------------------------------------------------------------ adaptive score
  startMusic(faction: 'helix' | 'chorus'): void {
    this.faction = faction;
    if (!this.ctx || this.musicTimer !== null) return;
    this.step = 0;
    this.nextStepTime = this.ctx.currentTime + 0.1;
    this.musicTimer = window.setInterval(() => this.schedule(), 90);
  }

  stopMusic(): void {
    if (this.musicTimer !== null) { window.clearInterval(this.musicTimer); this.musicTimer = null; }
    this.intensity = 0; this.intensityTarget = 0; this.battle = false; this.endgame = false;
  }

  /** 0 = calm economy, 1 = full battle. */
  setIntensity(v: number): void { this.intensityTarget = Math.max(0, Math.min(1, v)); }

  private schedule(): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const stepDur = 60 / 84 / 2;
    this.intensity += (this.intensityTarget - this.intensity) * 0.08;
    // hysteresis so the battle layer does not flutter
    if (!this.battle && this.intensity > 0.5) this.battle = true;
    else if (this.battle && this.intensity < 0.22) this.battle = false;
    while (this.nextStepTime < ctx.currentTime + 0.3) {
      this.playStep(this.step, this.nextStepTime - ctx.currentTime, stepDur);
      this.step++;
      this.nextStepTime += stepDur;
    }
  }

  private playStep(step: number, delay: number, sd: number): void {
    const b = this.musicBus;
    const roots = [73.42, 58.27, 87.31, 65.41]; // D2 Bb1 F2 C2
    const bar = Math.floor(step / 16) % 4;
    const s = step % 16;
    const root = roots[bar] * (this.endgame ? 1.3348 : 1);
    const scale = [1, 1.2, 1.5, 1.8, 2, 2.4, 3];
    const helix = this.faction === 'helix';
    if (s === 0) {
      // pad chord
      for (const m of [1, 1.5, 2.4]) {
        this.tone(b, 'sawtooth', root * 2 * m * 1.003, root * 2 * m, sd * 16.5, 0.028, -0.3, delay, 1.2);
        this.tone(b, 'triangle', root * 2 * m * 0.997, root * 2 * m, sd * 16.5, 0.04, 0.3, delay, 1.4);
      }
      this.tone(b, 'sine', root, root, sd * 15, 0.16, 0, delay, 0.6);
    }
    // sparse melodic plucks (deterministic pattern, no audio randomness needed)
    const pat = (step * 7 + bar * 3) % 11;
    if (pat === 0 || pat === 4 || (pat === 7 && s % 2 === 0)) {
      const n = scale[(step * 5 + bar) % scale.length] * root * 4;
      if (helix) this.tone(b, 'square', n, n, 0.16, 0.03, ((step % 5) - 2) * 0.25, delay);
      else this.tone(b, 'sine', n * 1.005, n, 0.34, 0.07, ((step % 5) - 2) * 0.25, delay, 0.03);
    }
    if (this.battle) {
      const k = Math.min(1, this.intensity * 1.3);
      if (s % 4 === 0) this.tone(b, 'sine', 120, 42, 0.16, 0.34 * k, 0, delay);
      if (s % 4 === 2) this.noise(b, 'highpass', 6000, 6000, 0.04, 0.07 * k, 0.2, delay);
      if (s % 2 === 1) this.tone(b, helix ? 'sawtooth' : 'triangle', root * 2, root * 2, sd * 0.8, 0.07 * k, 0, delay);
      if (s === 14) this.noise(b, 'bandpass', 1800, 900, 0.1, 0.12 * k, -0.2, delay, 1.5);
    }
    if (this.endgame && s % 8 === 4) this.tone(b, 'sine', root * 12, root * 12, 0.5, 0.02, 0.4, delay, 0.05);
  }
}
