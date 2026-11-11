/** Procedural Web Audio: prioritized, panned and distance-attenuated cues plus a gentle generative score. */
import type { WeaponId } from '../shared/content';

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfx!: GainNode;
  private musicGain!: GainNode;
  private noiseBuf!: AudioBuffer;
  private voices = 0;
  private windGain: GainNode | null = null;
  private stormGain: GainNode | null = null;
  private musicTimer = 0;
  private musicStep = 0;
  volume = 0.7;
  music = 0.35;
  private lastPlay = new Map<string, number>();

  ensure(): void {
    if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume(); return; }
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
    } catch { return; }
    const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = this.volume; this.master.connect(c.destination);
    this.sfx = c.createGain(); this.sfx.gain.value = 1; this.sfx.connect(this.master);
    this.musicGain = c.createGain(); this.musicGain.gain.value = this.music * 0.25; this.musicGain.connect(this.master);
    const len = c.sampleRate * 1.5;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    // ambience: wind + storm hum
    const wind = c.createBufferSource(); wind.buffer = this.noiseBuf; wind.loop = true;
    const wf = c.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 500; wf.Q.value = 0.4;
    this.windGain = c.createGain(); this.windGain.gain.value = 0.03;
    wind.connect(wf); wf.connect(this.windGain); this.windGain.connect(this.master); wind.start();
    const osc = c.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 48;
    const of = c.createBiquadFilter(); of.type = 'lowpass'; of.frequency.value = 160;
    this.stormGain = c.createGain(); this.stormGain.gain.value = 0;
    osc.connect(of); of.connect(this.stormGain); this.stormGain.connect(this.master); osc.start();
  }

  setVolumes(v: number, m: number): void {
    this.volume = v; this.music = m;
    if (this.master) this.master.gain.value = v;
    if (this.musicGain) this.musicGain.gain.value = m * 0.25;
  }

  setAmbience(windLevel: number, stormLevel: number): void {
    if (this.windGain) this.windGain.gain.value = 0.02 + windLevel * 0.1;
    if (this.stormGain) this.stormGain.gain.value = stormLevel * 0.07;
  }

  private throttle(key: string, ms: number): boolean {
    const now = performance.now();
    if (now - (this.lastPlay.get(key) ?? 0) < ms) return false;
    this.lastPlay.set(key, now);
    return true;
  }

  private place(pan: number, dist: number, maxDist: number): { out: AudioNode; gain: number } | null {
    const c = this.ctx!;
    if (dist > maxDist) return null;
    const g = c.createGain();
    const att = 1 / (1 + (dist / 18) ** 1.4);
    const gain = Math.max(0.02, att);
    g.gain.value = gain;
    if (c.createStereoPanner) {
      const p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan));
      g.connect(p); p.connect(this.sfx);
    } else g.connect(this.sfx);
    return { out: g, gain };
  }

  private noise(dur: number, freq: number, q: number, type: BiquadFilterType, vol: number, out: AudioNode, decay = true): void {
    const c = this.ctx!;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, c.currentTime);
    if (decay) g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    s.connect(f); f.connect(g); g.connect(out);
    s.start(c.currentTime, Math.random()); s.stop(c.currentTime + dur + 0.05);
    this.voices++;
    s.onended = () => { this.voices--; };
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, out: AudioNode, slideTo?: number, delay = 0): void {
    const c = this.ctx!;
    const o = c.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime + delay);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + delay + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, c.currentTime + delay);
    g.gain.linearRampToValueAtTime(vol, c.currentTime + delay + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + delay + dur);
    o.connect(g); g.connect(out);
    o.start(c.currentTime + delay); o.stop(c.currentTime + delay + dur + 0.05);
    this.voices++;
    o.onended = () => { this.voices--; };
  }

  gunshot(weapon: WeaponId, pan: number, dist: number, own: boolean): void {
    if (!this.ctx || this.voices > 48) return;
    if (!this.throttle(`gs${own ? 0 : 1}${Math.round(dist / 12)}`, own ? 0 : 35)) return;
    const pl = this.place(own ? 0 : pan, own ? 0 : dist, 260);
    if (!pl) return;
    const far = dist > 70;
    const o = pl.out;
    switch (weapon) {
      case 'wayfarer': this.noise(0.14, far ? 700 : 1800, 0.7, 'bandpass', 0.8, o); this.tone(160, 0.1, 'triangle', 0.5, o, 70); break;
      case 'tempest': this.noise(0.1, far ? 800 : 2400, 0.8, 'bandpass', 0.7, o); this.tone(210, 0.07, 'square', 0.25, o, 90); break;
      case 'breakwater': case 'coil': this.noise(0.3, far ? 500 : 1100, 0.5, 'lowpass', 1.1, o); this.tone(90, 0.25, 'sawtooth', 0.6, o, 40); break;
      case 'needler': this.noise(0.07, far ? 900 : 3200, 1, 'bandpass', 0.55, o); this.tone(300, 0.05, 'square', 0.2, o, 140); break;
      case 'sundial': this.noise(0.22, far ? 600 : 1500, 0.6, 'bandpass', 1, o); this.tone(120, 0.2, 'triangle', 0.7, o, 50); break;
      case 'longwake': this.tone(520, 0.35, 'sine', 0.5, o, 90); this.noise(0.3, 900, 0.5, 'lowpass', 0.8, o); break;
      case 'harbor': this.noise(0.1, far ? 800 : 2000, 0.8, 'bandpass', 0.6, o); this.tone(190, 0.08, 'triangle', 0.35, o, 90); break;
      case 'gale': this.tone(260, 0.35, 'sine', 0.55, o, 120); this.noise(0.3, 600, 0.4, 'lowpass', 0.5, o); break;
    }
    if (dist > 60) this.noise(0.8, 300, 0.5, 'lowpass', 0.25 * (pl.gain + 0.2), o); // distant tail
  }

  footstep(pan: number, dist: number, sprint: boolean): void {
    if (!this.ctx || this.voices > 48) return;
    if (!this.throttle(`fs${Math.round(dist / 10)}`, 80)) return;
    const pl = this.place(pan, dist, 55);
    if (!pl) return;
    this.noise(0.06, sprint ? 500 : 380, 1.2, 'bandpass', sprint ? 0.5 : 0.35, pl.out);
  }

  pickup(rarity: number): void {
    if (!this.ctx) return;
    const out = this.sfx;
    const base = 520 + rarity * 110;
    this.tone(base, 0.12, 'triangle', 0.22, out);
    this.tone(base * 1.5, 0.16, 'triangle', 0.18, out, undefined, 0.07);
    if (rarity >= 3) this.tone(base * 2, 0.3, 'sine', 0.16, out, undefined, 0.14);
  }
  full(): void { if (this.ctx) this.tone(180, 0.15, 'square', 0.12, this.sfx, 120); }
  hit(head: boolean, shield: boolean, brk: boolean): void {
    if (!this.ctx) return;
    if (brk) { this.tone(900, 0.25, 'triangle', 0.25, this.sfx, 200); this.noise(0.2, 3000, 1, 'highpass', 0.2, this.sfx); return; }
    if (head) { this.tone(1500, 0.12, 'sine', 0.3, this.sfx); this.tone(2200, 0.1, 'sine', 0.2, this.sfx, undefined, 0.04); return; }
    this.tone(shield ? 1100 : 760, 0.07, 'sine', 0.22, this.sfx);
  }
  hurt(): void { if (this.ctx && this.throttle('hurt', 90)) this.tone(120, 0.18, 'sawtooth', 0.25, this.sfx, 60); }
  reload(): void {
    if (!this.ctx) return;
    this.noise(0.05, 2400, 2, 'bandpass', 0.3, this.sfx);
    this.noise(0.05, 1800, 2, 'bandpass', 0.3, this.sfx);
  }
  heal(): void { if (this.ctx) { this.tone(440, 0.4, 'sine', 0.12, this.sfx, 660); } }
  chest(): void { if (this.ctx) { this.tone(330, 0.3, 'sine', 0.25, this.sfx, 660); this.tone(660, 0.4, 'triangle', 0.2, this.sfx, 990, 0.1); } }
  explosion(dist: number): void {
    if (!this.ctx) return;
    const pl = this.place(0, dist, 200);
    if (pl) { this.noise(0.5, 350, 0.5, 'lowpass', 1, pl.out); this.tone(80, 0.4, 'sine', 0.6, pl.out, 30); }
  }
  jump(): void { if (this.ctx && this.throttle('jump', 120)) this.noise(0.09, 700, 0.8, 'bandpass', 0.18, this.sfx); }
  land(strength: number): void { if (this.ctx) this.noise(0.12, 260, 0.8, 'lowpass', Math.min(0.6, 0.15 + strength * 0.03), this.sfx); }
  slide(): void { if (this.ctx) this.noise(0.5, 1500, 0.8, 'bandpass', 0.12, this.sfx); }
  deploy(): void { if (this.ctx) { this.noise(0.4, 900, 0.5, 'highpass', 0.3, this.sfx); this.tone(200, 0.25, 'triangle', 0.2, this.sfx, 340); } }
  stormWarn(): void { if (this.ctx) { this.tone(196, 0.9, 'sine', 0.3, this.sfx, 165); this.tone(246, 0.9, 'sine', 0.2, this.sfx, 207, 0.15); } }
  capsule(): void { if (this.ctx) { for (let i = 0; i < 3; i++) this.tone(700 + i * 160, 0.25, 'triangle', 0.18, this.sfx, undefined, i * 0.18); } }
  ui(): void { if (this.ctx) this.tone(620, 0.06, 'triangle', 0.14, this.sfx); }
  kill(): void { if (this.ctx) { this.tone(660, 0.12, 'triangle', 0.25, this.sfx); this.tone(990, 0.2, 'triangle', 0.25, this.sfx, undefined, 0.08); } }
  windUse(): void { if (this.ctx) this.tone(300, 0.3, 'sine', 0.3, this.sfx, 600); }

  /** Sparse generative score: calm during the match, tenser (more notes, lower register) as fields close. */
  tickMusic(dt: number, tension: number): void {
    if (!this.ctx || this.music <= 0.01) return;
    this.musicTimer -= dt;
    if (this.musicTimer > 0) return;
    const scale = [0, 2, 4, 7, 9, 12, 14, 16];
    const root = tension > 0.6 ? 110 : 146.8;
    const prog = [0, 5, 3, 4];
    const bar = Math.floor(this.musicStep / 4) % 4;
    const note = scale[(this.musicStep * 3 + (this.musicStep >> 2) * 2) % scale.length] + prog[bar];
    const f = root * Math.pow(2, note / 12);
    const c = this.ctx;
    const o = c.createOscillator(); o.type = tension > 0.6 ? 'triangle' : 'sine'; o.frequency.value = f;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.linearRampToValueAtTime(0.5, c.currentTime + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 2.6);
    o.connect(g); g.connect(this.musicGain); o.start(); o.stop(c.currentTime + 2.7);
    if (this.musicStep % 4 === 0) {
      const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = root * 0.5 * Math.pow(2, prog[bar] / 12);
      const g2 = c.createGain(); g2.gain.setValueAtTime(0.0001, c.currentTime); g2.gain.linearRampToValueAtTime(0.45, c.currentTime + 0.6); g2.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 4);
      o2.connect(g2); g2.connect(this.musicGain); o2.start(); o2.stop(c.currentTime + 4.1);
    }
    this.musicStep++;
    this.musicTimer = tension > 0.6 ? 0.9 : 1.6;
  }
}
