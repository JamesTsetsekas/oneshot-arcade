import type { Game } from '../sim/game';
import type { GameEvent } from '../core/events';
import type { Settings } from '../core/settings';
import { clamp } from '../core/math';

/** Fully procedural Web Audio mix: engines, tyres, sirens, weapons, ambience and two original radio stations. */
export class AudioSystem {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfx!: GainNode;
  private music!: GainNode;
  private amb!: GainNode;
  private noiseBuf!: AudioBuffer;
  // engine
  private eng: { o1: OscillatorNode; o2: OscillatorNode; lp: BiquadFilterNode; g: GainNode } | null = null;
  private tire: { src: AudioBufferSourceNode; bp: BiquadFilterNode; g: GainNode } | null = null;
  private siren: { o: OscillatorNode; g: GainNode; lfo: OscillatorNode } | null = null;
  private rainG: GainNode | null = null;
  private cityG: GainNode | null = null;
  private traffic: { g: GainNode } | null = null;
  private stepT = 0;
  private gullT = 6;
  private hornT = 25;
  private radioIdx = 1;
  private radioStep = 0;
  private radioNext = 0;
  stationName = '';
  private settings: Settings;
  ready = false;
  private hornNodes: Array<{ o: OscillatorNode[]; g: GainNode }> = [];

  constructor(settings: Settings) { this.settings = settings; }

  /** Must be called from a user gesture. */
  init(): void {
    if (this.ctx) { void this.ctx.resume(); return; }
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
    } catch { return; }
    const c = this.ctx;
    this.master = c.createGain();
    this.master.connect(c.destination);
    this.sfx = c.createGain(); this.sfx.connect(this.master);
    this.music = c.createGain(); this.music.connect(this.master);
    this.amb = c.createGain(); this.amb.connect(this.master);
    const len = c.sampleRate * 2;
    this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.applySettings(this.settings);
    this.startBeds();
    this.ready = true;
  }

  applySettings(s: Settings): void {
    this.settings = s;
    if (!this.ctx) return;
    this.master.gain.value = s.masterVolume;
    this.sfx.gain.value = s.sfxVolume;
    this.music.gain.value = s.streamer ? 0 : s.musicVolume;
  }

  private noiseSource(loop = true): AudioBufferSourceNode {
    const s = this.ctx!.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = loop;
    return s;
  }

  private startBeds(): void {
    const c = this.ctx!;
    // city bed (brown-ish noise through low-pass)
    const city = this.noiseSource();
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    this.cityG = c.createGain(); this.cityG.gain.value = 0.08;
    city.connect(lp); lp.connect(this.cityG); this.cityG.connect(this.amb); city.start();
    // rain bed
    const rain = this.noiseSource();
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2400;
    this.rainG = c.createGain(); this.rainG.gain.value = 0;
    rain.connect(hp); hp.connect(this.rainG); this.rainG.connect(this.amb); rain.start();
    // traffic hum
    const tr = this.noiseSource();
    const tl = c.createBiquadFilter(); tl.type = 'bandpass'; tl.frequency.value = 180; tl.Q.value = 0.7;
    const tg = c.createGain(); tg.gain.value = 0.0;
    tr.connect(tl); tl.connect(tg); tg.connect(this.amb); tr.start();
    this.traffic = { g: tg };
    // engine
    const o1 = c.createOscillator(); o1.type = 'sawtooth';
    const o2 = c.createOscillator(); o2.type = 'square';
    const elp = c.createBiquadFilter(); elp.type = 'lowpass'; elp.frequency.value = 600;
    const eg = c.createGain(); eg.gain.value = 0;
    o1.connect(elp); o2.connect(elp); elp.connect(eg); eg.connect(this.sfx);
    o1.start(); o2.start();
    this.eng = { o1, o2, lp: elp, g: eg };
    // tyres
    const ts = this.noiseSource();
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1600; bp.Q.value = 3;
    const tgn = c.createGain(); tgn.gain.value = 0;
    ts.connect(bp); bp.connect(tgn); tgn.connect(this.sfx); ts.start();
    this.tire = { src: ts, bp, g: tgn };
    // siren
    const so = c.createOscillator(); so.type = 'triangle';
    const lfo = c.createOscillator(); lfo.frequency.value = 0.55;
    const lg = c.createGain(); lg.gain.value = 260;
    lfo.connect(lg); lg.connect(so.frequency);
    so.frequency.value = 900;
    const sg = c.createGain(); sg.gain.value = 0;
    so.connect(sg); sg.connect(this.sfx); so.start(); lfo.start();
    this.siren = { o: so, g: sg, lfo };
  }

  // ---------------------------------------------------------------- one-shots
  private burst(dur: number, freq: number, gain: number, type: BiquadFilterType = 'lowpass', q = 0.7, dest: AudioNode | null = null, t0 = 0): void {
    const c = this.ctx!;
    const s = this.noiseSource(false);
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain();
    const now = c.currentTime + t0;
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0005, now + dur);
    s.connect(f); f.connect(g); g.connect(dest ?? this.sfx);
    s.start(now, Math.random()); s.stop(now + dur + 0.05);
  }

  private tone(freq: number, dur: number, gain: number, type: OscillatorType = 'sine', t0 = 0, slide = 0, dest: AudioNode | null = null): void {
    const c = this.ctx!;
    const o = c.createOscillator();
    o.type = type;
    const g = c.createGain();
    const now = c.currentTime + t0;
    o.frequency.setValueAtTime(freq, now);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), now + dur);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(gain, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0005, now + dur);
    o.connect(g); g.connect(dest ?? this.sfx);
    o.start(now); o.stop(now + dur + 0.05);
  }

  private dist(game: Game, x: number, z: number): number { const p = game.player.human; return Math.hypot(x - p.x, z - p.z); }

  event(e: GameEvent, game: Game): void {
    if (!this.ready || !this.ctx) return;
    switch (e.type) {
      case 'gunshot': {
        const att = clamp(1 - this.dist(game, e.x, e.z) / 160, 0.05, 1);
        const heavy = e.weapon === 'shotgun' || e.weapon === 'dmr' ? 1.4 : e.weapon === 'pistol' ? 0.9 : e.weapon === 'stun' ? 0.4 : 1;
        this.burst(0.16 * heavy, e.weapon === 'stun' ? 3000 : 2200, 0.55 * att, 'lowpass', 0.8);
        this.tone(e.weapon === 'stun' ? 400 : 110, 0.14, 0.5 * att, 'sine', 0, -70);
        if (e.weapon !== 'stun') this.burst(0.5, 700, 0.12 * att, 'lowpass', 0.5, null, 0.04);
        break;
      }
      case 'impact': this.burst(0.08, e.material === 'flesh' ? 600 : 3000, 0.12, 'bandpass', 2); break;
      case 'crash': { const k = clamp(e.strength / 18, 0.1, 1) * clamp(1 - this.dist(game, e.x, e.z) / 120, 0.1, 1); this.burst(0.35, 900, 0.7 * k, 'lowpass', 0.6); this.tone(70, 0.25, 0.4 * k, 'sine', 0, -30); if (e.strength > 8) this.burst(0.5, 3500, 0.2 * k, 'highpass', 1); break; }
      case 'horn': { const v = game.vehicleById(e.id); const att = v ? clamp(1 - this.dist(game, v.x, v.z) / 110, 0.05, 1) : 0.3; this.horn(att); break; }
      case 'sfx': this.sfxNamed(e.name, e.x !== undefined ? clamp(1 - this.dist(game, e.x, e.z ?? 0) / 90, 0.1, 1) : 1); break;
      case 'toast': if (e.tone === 'bad') this.tone(200, 0.2, 0.15, 'square', 0, -60); break;
      case 'missionFailed': this.tone(220, 0.5, 0.25, 'sawtooth', 0, -120); this.tone(165, 0.6, 0.25, 'sawtooth', 0.25, -90); break;
      case 'banner': this.tone(523, 0.14, 0.18, 'triangle'); this.tone(659, 0.14, 0.18, 'triangle', 0.12); this.tone(784, 0.3, 0.2, 'triangle', 0.24); break;
      default: break;
    }
  }

  private horn(att: number): void {
    const c = this.ctx!;
    const g = c.createGain();
    g.gain.value = 0.0001;
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18 * att, c.currentTime + 0.02);
    g.gain.setValueAtTime(0.18 * att, c.currentTime + 0.22);
    g.gain.exponentialRampToValueAtTime(0.0005, c.currentTime + 0.32);
    const os = [380, 480].map((f) => { const o = c.createOscillator(); o.type = 'square'; o.frequency.value = f; o.connect(g); o.start(); o.stop(c.currentTime + 0.35); return o; });
    g.connect(this.sfx);
    this.hornNodes.push({ o: os, g });
    if (this.hornNodes.length > 6) this.hornNodes.shift();
  }

  private sfxNamed(n: string, k: number): void {
    switch (n) {
      case 'pickup': this.tone(660, 0.1, 0.2 * k, 'triangle'); this.tone(990, 0.14, 0.2 * k, 'triangle', 0.08); break;
      case 'cash': this.tone(1320, 0.08, 0.2 * k, 'square', 0); this.tone(1760, 0.18, 0.18 * k, 'square', 0.07); break;
      case 'alert': this.tone(880, 0.12, 0.25, 'sawtooth'); this.tone(660, 0.18, 0.25, 'sawtooth', 0.13); break;
      case 'door': this.burst(0.12, 500, 0.35 * k, 'lowpass'); this.tone(120, 0.1, 0.3 * k, 'sine', 0.05); break;
      case 'phone': this.tone(1500, 0.07, 0.15 * k, 'sine'); this.tone(1900, 0.07, 0.15 * k, 'sine', 0.1); this.tone(1500, 0.07, 0.15 * k, 'sine', 0.2); break;
      case 'reload': this.burst(0.05, 2500, 0.3, 'highpass'); this.burst(0.07, 2000, 0.35, 'highpass', 0.7, null, 0.5); break;
      case 'step': this.burst(0.06, 900, 0.1 * k, 'lowpass'); break;
      case 'splash': this.burst(0.5, 1200, 0.35 * k, 'bandpass', 0.5); break;
      case 'heal': this.tone(520, 0.2, 0.2, 'sine'); this.tone(780, 0.3, 0.2, 'sine', 0.15); break;
      case 'fail': this.tone(196, 0.6, 0.25, 'sawtooth', 0, -60); break;
      case 'win': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.25, 0.2, 'triangle', i * 0.1)); break;
      case 'click': this.burst(0.03, 3000, 0.2, 'highpass'); break;
      default: break;
    }
  }

  // ---------------------------------------------------------------- continuous
  update(game: Game, dt: number): void {
    if (!this.ready || !this.ctx) return;
    const c = this.ctx;
    const t = c.currentTime;
    const pv = game.playerVehicle();
    const P = game.player.human;
    if (this.eng) {
      if (pv && pv.engineOn && !pv.stalled) {
        const f = 28 + (pv.rpm / 60) * (pv.def.kind === 'bike' ? 1.25 : 1) * 0.6;
        this.eng.o1.frequency.setTargetAtTime(f, t, 0.04);
        this.eng.o2.frequency.setTargetAtTime(f * 0.5, t, 0.04);
        this.eng.lp.frequency.setTargetAtTime(380 + pv.rpm * 0.22 + pv.throttle * 500, t, 0.05);
        this.eng.g.gain.setTargetAtTime((0.05 + pv.throttle * 0.07) * (pv.def.kind === 'van' ? 1.2 : 1), t, 0.05);
      } else this.eng.g.gain.setTargetAtTime(0, t, 0.08);
    }
    if (this.tire) {
      const sl = pv ? clamp((pv.slip - 0.35) * 1.6, 0, 1) * clamp(Math.abs(pv.speed) / 8, 0, 1) : 0;
      this.tire.g.gain.setTargetAtTime(sl * 0.13, t, 0.05);
      this.tire.bp.frequency.setTargetAtTime(1300 + (pv ? Math.abs(pv.speed) * 18 : 0), t, 0.1);
    }
    if (this.siren) {
      let best = 999;
      for (const v of game.vehicles) if (v.siren && v.alive) best = Math.min(best, Math.hypot(v.x - P.x, v.z - P.z));
      const g = best < 200 ? clamp(1 - best / 200, 0, 1) ** 1.4 * 0.09 : 0;
      this.siren.g.gain.setTargetAtTime(g, t, 0.15);
    }
    // ambience
    if (this.cityG) {
      const district = game.world.districtAt(P.x, P.z);
      const base = district === 'Tide Market' ? 0.13 : district === 'Breakwater' ? 0.09 : district === 'Glassline' ? 0.1 : 0.08;
      this.cityG.gain.setTargetAtTime(base * (pv ? 0.6 : 1) * (1 - 0.3 * (1 - (game.hour > 6 && game.hour < 21 ? 0 : 1))), t, 0.4);
      this.rainG!.gain.setTargetAtTime(game.rain * 0.05, t, 1);
      this.traffic!.g.gain.setTargetAtTime(clamp(game.traffic.count() / 24, 0, 1) * 0.12, t, 0.5);
    }
    // footsteps
    if (!pv && P.alive && P.y < 0.05 && P.speed > 1) {
      this.stepT -= dt * (P.speed / 4.4);
      if (this.stepT <= 0) { this.stepT = 0.42; this.sfxNamed('step', P.speed > 5 ? 1.5 : 1); }
    }
    // gulls and harbor horns in Breakwater
    this.gullT -= dt; this.hornT -= dt;
    if (this.gullT <= 0) { this.gullT = 6 + Math.random() * 10; const near = game.world.districtAt(P.x, P.z) === 'Breakwater' || P.z < -150; if (near && game.hour > 6 && game.hour < 21) { this.tone(1800, 0.25, 0.06, 'sine', 0, 500); this.tone(1700, 0.2, 0.05, 'sine', 0.3, 400); } }
    if (this.hornT <= 0) { this.hornT = 40 + Math.random() * 40; if (P.z < -120) this.tone(110, 2.4, 0.08, 'sawtooth', 0, -6); }
    this.updateRadio(game, pv !== null);
  }

  nextStation(): string {
    this.radioIdx = (this.radioIdx + 1) % 3;
    this.stationName = ['Radio off', 'Quay FM - Harbor Beat', 'Lantern 91 - Local Indie'][this.radioIdx];
    return this.stationName;
  }

  // ---------------------------------------------------------------- radio: two original procedural stations
  private updateRadio(game: Game, inVehicle: boolean): void {
    const c = this.ctx!;
    if (!this.settings.radio || this.settings.streamer || !inVehicle || this.radioIdx === 0) return;
    if (c.currentTime < this.radioNext - 0.1 && this.radioNext > 0) return;
    const bpm = this.radioIdx === 1 ? 112 : 92;
    const step = 60 / bpm / 4;
    const now = Math.max(this.radioNext, c.currentTime + 0.05);
    const s = this.radioStep++;
    const dest = this.music;
    if (this.radioIdx === 1) {
      // Harbor Beat: kick on 1/3, hats, driving bass, arp lead
      const bar = Math.floor(s / 16) % 4;
      const roots = [55, 55, 65.4, 49];
      if (s % 4 === 0) this.musTone(60, 0.18, 0.5, 'sine', now, -40, dest);
      if (s % 2 === 1) this.musNoise(0.04, 7000, 0.07, now, dest);
      if (s % 8 === 4) this.musNoise(0.12, 2200, 0.1, now, dest);
      this.musTone(roots[bar] * (s % 4 === 2 ? 2 : 1), step * 0.9, 0.22, 'sawtooth', now, 0, dest, 380);
      const arp = [0, 7, 12, 15, 12, 7][s % 6];
      if (s % 2 === 0) this.musTone(roots[bar] * 4 * Math.pow(2, arp / 12), step * 1.4, 0.07, 'square', now, 0, dest, 2200);
    } else {
      // Lantern 91: plucked chords, brushed snare, walking bass
      const bar = Math.floor(s / 16) % 4;
      const chords = [[220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7], [164.8, 207.7, 246.9]];
      if (s % 16 === 0 || s % 16 === 6 || s % 16 === 10) for (const f of chords[bar]) this.musTone(f, 0.7, 0.07, 'triangle', now, 0, dest, 1800);
      if (s % 8 === 4) this.musNoise(0.1, 3500, 0.07, now, dest);
      if (s % 8 === 0) this.musTone(70, 0.15, 0.3, 'sine', now, -30, dest);
      if (s % 4 === 0) this.musTone(chords[bar][0] / 2, 0.3, 0.15, 'triangle', now, 0, dest, 800);
    }
    this.radioNext = now + step;
    void game;
  }

  private musTone(freq: number, dur: number, gain: number, type: OscillatorType, at: number, slide: number, dest: AudioNode, lp = 0): void {
    const c = this.ctx!;
    const o = c.createOscillator(); o.type = type;
    const g = c.createGain();
    o.frequency.setValueAtTime(freq, at);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), at + dur);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0005, at + dur);
    let node: AudioNode = g;
    if (lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; g.connect(f); node = f; }
    o.connect(g); node.connect(dest);
    o.start(at); o.stop(at + dur + 0.05);
  }

  private musNoise(dur: number, freq: number, gain: number, at: number, dest: AudioNode): void {
    const c = this.ctx!;
    const s = this.noiseSource(false);
    const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, at);
    g.gain.exponentialRampToValueAtTime(0.0005, at + dur);
    s.connect(f); f.connect(g); g.connect(dest);
    s.start(at, Math.random()); s.stop(at + dur + 0.05);
  }
}
