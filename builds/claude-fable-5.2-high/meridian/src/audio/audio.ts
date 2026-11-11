// Fully procedural Web Audio: no sample files. Vehicle engine/tyre layers, sirens, weapons, UI cues,
// zone ambience (traffic bed, gulls, market murmur, rain) and two generative radio stations.
import type { Sim } from '../game-session/sim';
import type { Settings } from '../core/settings';
import { clamp, lerp } from '../core/math';
import { zoneAt } from '../world/district';
import { RADIO_IDENTS } from '../pedestrians/barks';

type Voice = { osc: OscillatorNode[]; gain: GainNode; filter?: BiquadFilterNode };
const NOTE = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

export class AudioEngine {
  ctx: AudioContext | null = null;
  private master!: GainNode; private sfx!: GainNode; private music!: GainNode; private amb!: GainNode;
  private noise!: AudioBuffer;
  private eng: Voice | null = null; private skid: { gain: GainNode; filter: BiquadFilterNode } | null = null; private wind: GainNode | null = null;
  private siren: Voice | null = null; private bed: GainNode | null = null; private rain: GainNode | null = null; private murmur: GainNode | null = null;
  private lx = 0; private ly = 0; private lz = 0; private lyaw = 0;
  private stepPhase = 0; private gullT = 4; private voices = 0;
  station = 0; radioOn = false; radioText = ''; private nextBeat = 0; private beat = 0; private identT = 20;
  suspended = true;
  constructor(public sim: Sim, public settings: Settings) {
    sim.bus.on('sfx', (e) => this.play(e.name, e.x, e.y, e.z, e.vol ?? 1, e.pitch ?? 1));
  }
  /** Must be called from a user gesture; safe to call repeatedly. */
  unlock() {
    if (!this.ctx) {
      const AC = (window as any).AudioContext ?? (window as any).webkitAudioContext;
      if (!AC) return;
      try { this.ctx = new AC() as AudioContext; } catch { return; }
      const c = this.ctx;
      this.master = c.createGain(); this.master.connect(c.destination);
      this.sfx = c.createGain(); this.music = c.createGain(); this.amb = c.createGain();
      const comp = c.createDynamicsCompressor(); comp.connect(this.master);
      this.sfx.connect(comp); this.music.connect(comp); this.amb.connect(comp);
      this.noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const d = this.noise.getChannelData(0); let b = 0;
      for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b = (b + 0.04 * w) / 1.04; d[i] = w * 0.6 + b * 2.2; }
      this.buildLoops();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => undefined);
    this.suspended = this.ctx.state !== 'running';
  }
  private noiseSrc(loop = true) { const s = this.ctx!.createBufferSource(); s.buffer = this.noise; s.loop = loop; return s; }
  private buildLoops() {
    const c = this.ctx!;
    // engine: two detuned oscillators through a low-pass that opens with load
    const g = c.createGain(); g.gain.value = 0; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400; f.Q.value = 1.5;
    const o1 = c.createOscillator(); o1.type = 'sawtooth'; const o2 = c.createOscillator(); o2.type = 'square';
    const g2 = c.createGain(); g2.gain.value = 0.5; o1.connect(f); o2.connect(g2); g2.connect(f); f.connect(g); g.connect(this.sfx); o1.start(); o2.start();
    this.eng = { osc: [o1, o2], gain: g, filter: f };
    const mk = (type: BiquadFilterType, freq: number, q: number, bus: GainNode) => { const n = this.noiseSrc(), fl = c.createBiquadFilter(), gg = c.createGain(); fl.type = type; fl.frequency.value = freq; fl.Q.value = q; gg.gain.value = 0; n.connect(fl); fl.connect(gg); gg.connect(bus); n.start(); return { gain: gg, filter: fl }; };
    this.skid = mk('bandpass', 1700, 2.5, this.sfx);
    this.wind = mk('lowpass', 500, 0.5, this.sfx).gain;
    this.bed = mk('lowpass', 260, 0.4, this.amb).gain;
    this.rain = mk('highpass', 2600, 0.3, this.amb).gain;
    this.murmur = mk('bandpass', 700, 0.8, this.amb).gain;
    const sg = c.createGain(); sg.gain.value = 0; const so = c.createOscillator(); so.type = 'triangle'; const sf = c.createBiquadFilter(); sf.type = 'bandpass'; sf.frequency.value = 1100; sf.Q.value = 0.8;
    so.connect(sf); sf.connect(sg); sg.connect(this.sfx); so.start(); this.siren = { osc: [so], gain: sg };
  }
  private atten(x?: number, y?: number, z?: number): { vol: number; pan: number } {
    if (x === undefined || z === undefined) return { vol: 1, pan: 0 };
    const dx = x - this.lx, dz = z - this.lz, d = Math.hypot(dx, dz, (y ?? this.ly) - this.ly);
    const vol = 1 / (1 + (d / 9) * (d / 9));
    const side = dx * Math.cos(this.lyaw) - dz * Math.sin(this.lyaw);
    return { vol: d > 140 ? 0 : vol, pan: clamp(side / (d + 4), -0.85, 0.85) };
  }
  private out(vol: number, pan: number, bus = this.sfx): AudioNode {
    const c = this.ctx!, g = c.createGain(); g.gain.value = vol;
    if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(bus); } else g.connect(bus);
    return g;
  }
  private blip(dst: AudioNode, type: OscillatorType, f0: number, f1: number, dur: number, vol: number, delay = 0) {
    const c = this.ctx!, t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dst); o.start(t); o.stop(t + dur + 0.02);
    this.voices++; o.onended = () => this.voices--;
  }
  private burst(dst: AudioNode, type: BiquadFilterType, freq: number, q: number, dur: number, vol: number, delay = 0, sweep = 1) {
    const c = this.ctx!, t = c.currentTime + delay, n = this.noiseSrc(false), f = c.createBiquadFilter(), g = c.createGain();
    f.type = type; f.frequency.setValueAtTime(freq, t); if (sweep !== 1) f.frequency.exponentialRampToValueAtTime(freq * sweep, t + dur); f.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(f); f.connect(g); g.connect(dst); n.start(t, Math.random()); n.stop(t + dur + 0.02);
    this.voices++; n.onended = () => this.voices--;
  }
  play(name: string, x?: number, y?: number, z?: number, vol = 1, pitch = 1) {
    if (!this.ctx || this.ctx.state !== 'running' || this.voices > 56) return;
    const a = this.atten(x, y, z); if (a.vol * vol < 0.004) return;
    const o = this.out(a.vol * vol, a.pan), p = pitch * (0.96 + Math.random() * 0.08);
    switch (name) {
      case 'shot': this.burst(o, 'lowpass', 2400, 0.7, 0.16, 0.9, 0, 0.3); this.blip(o, 'square', 190 * p, 60, 0.09, 0.5); break;
      case 'shot_long': this.burst(o, 'lowpass', 3000, 0.7, 0.24, 1.0, 0, 0.25); this.blip(o, 'sawtooth', 150 * p, 45, 0.14, 0.6); break;
      case 'shot_stun': this.blip(o, 'sawtooth', 1400 * p, 300, 0.16, 0.35); this.burst(o, 'bandpass', 3000, 4, 0.12, 0.3); break;
      case 'empty': this.blip(o, 'square', 900, 700, 0.03, 0.2); break;
      case 'reload': this.burst(o, 'bandpass', 1800, 3, 0.05, 0.4); this.burst(o, 'bandpass', 1200, 3, 0.06, 0.45, 0.28); break;
      case 'draw': this.burst(o, 'bandpass', 2400, 2, 0.06, 0.25); break;
      case 'door': this.burst(o, 'lowpass', 500, 1, 0.12, 0.7); this.blip(o, 'sine', 120, 60, 0.1, 0.4); break;
      case 'mount': this.burst(o, 'lowpass', 900, 1, 0.08, 0.4); break;
      case 'crash': this.burst(o, 'lowpass', 1400, 0.6, 0.4, 1.0, 0, 0.2); this.blip(o, 'sawtooth', 110 * p, 35, 0.25, 0.7); this.burst(o, 'highpass', 3500, 0.5, 0.2, 0.35, 0.03); break;
      case 'thud': this.blip(o, 'sine', 140 * p, 45, 0.16, 0.8); this.burst(o, 'lowpass', 500, 0.8, 0.1, 0.5); break;
      case 'horn_ai': this.blip(o, 'square', 420 * p, 415 * p, 0.38, 0.22); this.blip(o, 'square', 525 * p, 520 * p, 0.38, 0.16); break;
      case 'burst': this.burst(o, 'bandpass', 900, 0.7, 0.3, 0.9); break;
      case 'splash': this.burst(o, 'bandpass', 1300, 0.6, 0.6, 0.8, 0, 0.4); break;
      case 'jump': this.burst(o, 'lowpass', 700, 1, 0.06, 0.18); break;
      case 'land': this.blip(o, 'sine', 110, 50, 0.1, 0.5); this.burst(o, 'lowpass', 600, 1, 0.07, 0.3); break;
      case 'step': this.burst(o, 'bandpass', 500 + Math.random() * 300, 1.2, 0.045, 0.16); break;
      case 'hurt': this.blip(o, 'sawtooth', 260 * p, 150, 0.14, 0.3); break;
      case 'medkit': this.blip(o, 'sine', 520, 780, 0.25, 0.25); this.blip(o, 'sine', 780, 1040, 0.25, 0.2, 0.18); break;
      case 'baton': this.burst(o, 'bandpass', 900, 2, 0.09, 0.3, 0, 2.2); break;
      case 'baton_hit': this.blip(o, 'sine', 170 * p, 60, 0.1, 0.7); this.burst(o, 'bandpass', 1500, 1.5, 0.05, 0.5); break;
      case 'cry': this.blip(o, 'sawtooth', 620 * p, 420 * p, 0.28, 0.16); break;
      case 'grunt': this.blip(o, 'sawtooth', 190 * p, 120 * p, 0.14, 0.22); break;
      case 'stun': this.blip(o, 'sawtooth', 90, 1200, 0.3, 0.3); break;
      case 'objective': this.blip(o, 'triangle', 660, 660, 0.09, 0.22); this.blip(o, 'triangle', 990, 990, 0.14, 0.22, 0.09); break;
      case 'mission_start': [0, 4, 7].forEach((s, i) => this.blip(o, 'triangle', NOTE(69 + s), NOTE(69 + s), 0.2, 0.2, i * 0.11)); break;
      case 'mission_done': [0, 4, 7, 12].forEach((s, i) => this.blip(o, 'triangle', NOTE(72 + s), NOTE(72 + s), 0.3, 0.22, i * 0.12)); break;
      case 'mission_fail': [0, -3, -7].forEach((s, i) => this.blip(o, 'sawtooth', NOTE(62 + s), NOTE(61 + s), 0.3, 0.16, i * 0.16)); break;
      case 'alert_up': this.blip(o, 'square', 740, 740, 0.09, 0.14); this.blip(o, 'square', 1110, 1110, 0.12, 0.14, 0.1); break;
      case 'alert_clear': this.blip(o, 'sine', 880, 440, 0.4, 0.2); break;
      case 'buy': this.blip(o, 'triangle', 880, 880, 0.07, 0.2); this.blip(o, 'triangle', 1320, 1320, 0.12, 0.2, 0.07); break;
      case 'deny': case 'locked': this.blip(o, 'square', 180, 150, 0.14, 0.2); break;
      case 'chirp': this.blip(o, 'sine', 2400, 3200, 0.07, 0.25); this.blip(o, 'sine', 2800, 3600, 0.07, 0.25, 0.1); break;
      case 'smoke': this.burst(o, 'highpass', 1800, 0.5, 1.2, 0.4); break;
      case 'throw': this.burst(o, 'bandpass', 700, 1.5, 0.12, 0.2, 0, 2.5); break;
      case 'lock_ok': this.blip(o, 'triangle', 1200, 1500, 0.06, 0.25); break;
      case 'lock_bad': this.blip(o, 'square', 200, 120, 0.12, 0.25); break;
      case 'camera': this.burst(o, 'highpass', 3000, 1, 0.04, 0.35); this.burst(o, 'highpass', 2500, 1, 0.05, 0.3, 0.08); break;
      case 'ui': this.blip(o, 'triangle', 700, 760, 0.04, 0.12); break;
    }
  }
  nextStation() { this.station = (this.station + 1) % 3; this.identT = 0.5; this.beat = 0; }

  private radio(dt: number) {
    const c = this.ctx!, on = this.radioOn && this.station < 2 && !this.settings.streamerMode;
    if (!on) { this.radioText = this.radioOn && this.station === 2 ? 'Radio off' : this.settings.streamerMode && this.radioOn ? 'Streamer mode: music off' : ''; this.nextBeat = 0; return; }
    const tide = this.station === 0, bpm = tide ? 112 : 92, step = 60 / bpm / 4;
    if (this.nextBeat < c.currentTime) this.nextBeat = c.currentTime + 0.05;
    this.identT -= dt;
    if (this.identT <= 0) { this.identT = 45 + Math.random() * 30; const list = tide ? RADIO_IDENTS.tideline : RADIO_IDENTS.lantern; this.radioText = list[Math.floor(Math.random() * list.length)]; }
    while (this.nextBeat < c.currentTime + 0.12) {
      const t = this.nextBeat - c.currentTime, s = this.beat % 16, bar = Math.floor(this.beat / 16) % 8;
      if (tide) {
        // electronic harbor beat: four-on-the-floor, off-beat hats, minor arpeggio
        const roots = [45, 45, 41, 43, 45, 45, 48, 43], root = roots[bar];
        if (s % 4 === 0) this.blip(this.music, 'sine', 120, 42, 0.16, 0.5, t);
        if (s % 4 === 2) this.burst(this.music, 'highpass', 7000, 1, 0.03, 0.12, t);
        if (s === 4 || s === 12) this.burst(this.music, 'bandpass', 1800, 1, 0.09, 0.2, t);
        if (s % 2 === 0) this.blip(this.music, 'sawtooth', NOTE(root - 12), NOTE(root - 12), step * 1.6, 0.12, t);
        const arp = [0, 7, 12, 15, 12, 7, 3, 7][Math.floor(s / 2)];
        this.blip(this.music, 'triangle', NOTE(root + 12 + arp), NOTE(root + 12 + arp), step * 0.9, 0.07, t);
      } else {
        // indie: plucked major-seventh chords with a brushed backbeat
        const chords = [[50, 57, 61, 66], [47, 54, 59, 62], [43, 50, 54, 59], [45, 52, 57, 61]], ch = chords[Math.floor(bar / 2) % 4];
        if (s === 0 || s === 6 || s === 10) ch.forEach((n, i) => this.blip(this.music, 'triangle', NOTE(n + 12), NOTE(n + 12), 0.5, 0.06, t + i * 0.012));
        if (s === 0 || s === 8) this.blip(this.music, 'sine', NOTE(ch[0] - 12), NOTE(ch[0] - 12), 0.3, 0.16, t);
        if (s === 4 || s === 12) this.burst(this.music, 'bandpass', 2200, 0.8, 0.07, 0.1, t);
        if (s % 4 === 2) this.burst(this.music, 'highpass', 6000, 1, 0.025, 0.05, t);
        const mel = [66, -1, 69, -1, 71, 69, -1, 66, 64, -1, 66, -1, 61, -1, -1, -1][s];
        if (mel > 0 && bar % 2 === 1) this.blip(this.music, 'sine', NOTE(mel + 12), NOTE(mel + 12), 0.24, 0.07, t);
      }
      this.beat++; this.nextBeat += step;
    }
  }

  update(dt: number, camX: number, camY: number, camZ: number, camYaw: number, paused: boolean) {
    const c = this.ctx, st = this.settings, sim = this.sim;
    if (!c) return;
    this.suspended = c.state !== 'running';
    this.lx = camX; this.ly = camY; this.lz = camZ; this.lyaw = camYaw;
    const tc = c.currentTime;
    this.master.gain.setTargetAtTime(paused ? st.master * 0.25 : st.master, tc, 0.08);
    this.sfx.gain.setTargetAtTime(paused ? 0 : st.sfx, tc, 0.05); this.music.gain.setTargetAtTime(st.music * 0.8, tc, 0.1); this.amb.gain.setTargetAtTime(st.ambience, tc, 0.1);
    const p = sim.player, v = p.vehicle;
    if (this.eng) {
      if (v && !paused) {
        const base = v.spec.moto ? 70 : v.spec.cls === 'van' ? 38 : v.spec.cls === 'muscle' ? 42 : 50;
        const f = base + v.rpm * (v.spec.moto ? 240 : 150);
        this.eng.osc[0].frequency.setTargetAtTime(f, tc, 0.04); this.eng.osc[1].frequency.setTargetAtTime(f * 0.5, tc, 0.04);
        this.eng.filter!.frequency.setTargetAtTime(300 + v.rpm * 1400 + v.ctl.throttle * 900, tc, 0.05);
        this.eng.gain.gain.setTargetAtTime(v.stalled ? 0 : 0.07 + v.ctl.throttle * 0.07 + v.rpm * 0.04, tc, 0.06);
        this.skid!.gain.gain.setTargetAtTime(clamp(v.skid, 0, 1) * 0.3 * (v.surface === 'grass' ? 0.4 : 1), tc, 0.05);
        this.skid!.filter.frequency.setTargetAtTime(v.surface === 'asphalt' ? 1700 : 700, tc, 0.1);
        this.wind!.gain.setTargetAtTime(clamp(v.speedAbs / 45, 0, 1) * 0.25, tc, 0.1);
        if (v.ctl.horn && sim.tick % 24 === 0) this.play('horn_ai', undefined, undefined, undefined, 1.2, 0.9);
      } else { this.eng.gain.gain.setTargetAtTime(0, tc, 0.08); this.skid!.gain.gain.setTargetAtTime(0, tc, 0.05); this.wind!.gain.setTargetAtTime(0, tc, 0.1); }
    }
    // nearest siren
    let sd = 1e9;
    for (const u of sim.police.units) if (u.vehicle && u.vehicle.siren) sd = Math.min(sd, Math.hypot(u.vehicle.x - camX, u.vehicle.z - camZ));
    if (this.siren) {
      const vol = sd < 260 && !paused ? 0.16 / (1 + (sd / 40) * (sd / 40)) + 0.012 : 0;
      this.siren.gain.gain.setTargetAtTime(vol, tc, 0.1);
      const ph = (tc * 0.45) % 1, tri = ph < 0.5 ? ph * 2 : 2 - ph * 2;
      this.siren.osc[0].frequency.setTargetAtTime(lerp(640, 1280, tri), tc, 0.02);
    }
    // ambience by zone, time and weather
    const zone = zoneAt(p.x, p.z), night = sim.clock.night;
    this.bed!.gain.setTargetAtTime(paused ? 0 : (zone === 'glassline' || zone === 'tide' ? 0.3 : 0.2) * (1 - night * 0.4), tc, 0.5);
    this.rain!.gain.setTargetAtTime(paused ? 0 : sim.weather.rain * 0.26, tc, 0.4);
    const plaza = Math.hypot(p.x + 11, p.z + 19);
    this.murmur!.gain.setTargetAtTime(paused ? 0 : clamp(1 - plaza / 110, 0, 1) * 0.16 * (1 - night * 0.6) * (0.75 + 0.25 * Math.sin(tc * 2.3)), tc, 0.3);
    if (!paused) {
      this.gullT -= dt;
      if (this.gullT <= 0) {
        this.gullT = 5 + Math.random() * 9;
        if ((zone === 'breakwater' || zone === 'canal' || zone === 'foundry') && night < 0.6) { const o = this.out(0.1, Math.random() - 0.5, this.amb); for (let i = 0; i < 3; i++) this.blip(o, 'sine', 1500 + Math.random() * 300, 2100, 0.16, 0.5, i * 0.22); }
        else if (zone === 'foundry' || zone === 'breakwater') { const o = this.out(0.12, 0, this.amb); this.blip(o, 'sawtooth', 82, 80, 1.6, 0.4); }
      }
      // footsteps follow the walk cycle
      if (!v && p.body.grounded && p.body.speed2d > 1 && p.body.state === 'normal') {
        const ph = Math.floor(p.body.phase / Math.PI);
        if (ph !== this.stepPhase) { this.stepPhase = ph; this.play('step', undefined, undefined, undefined, p.body.crouch ? 0.35 : 0.8); }
      }
    }
    this.radioOn = !!v && !paused && v.spec.cls !== 'police';
    this.radio(dt);
  }
}
