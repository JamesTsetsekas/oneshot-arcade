/**
 * Web Audio mixer with master / sfx / music / ambient buses. Every sound is synthesized at runtime from oscillators
 * and filtered noise (original, no sample files). Voices are pooled by a concurrency cap and per-id throttling.
 */
export interface AudioSettings { master: number; sfx: number; music: number; ambient: number }
type Mood = 'town' | 'wild' | 'crypt' | 'boss' | 'menu';
const MAX_VOICES = 36;

export class AudioSys {
  ctx: AudioContext | null = null; master!: GainNode; sfx!: GainNode; music!: GainNode; ambient!: GainNode; duck!: GainNode;
  voices = 0; last = new Map<string, number>(); mood: Mood | null = null; moodNodes: AudioNode[] = []; noiseBuf: AudioBuffer | null = null;
  lowHp = false; heart: number | null = null; bellT = 0;
  constructor(public settings: AudioSettings) {}
  /** Must be called from a user gesture; safe to call repeatedly. */
  resume(): void {
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      const c = (this.ctx = new AC());
      this.master = c.createGain(); this.master.connect(c.destination);
      const comp = c.createDynamicsCompressor(); comp.connect(this.master);
      this.sfx = c.createGain(); this.sfx.connect(comp);
      this.duck = c.createGain(); this.duck.connect(comp);
      this.music = c.createGain(); this.music.connect(this.duck);
      this.ambient = c.createGain(); this.ambient.connect(this.duck);
      const len = c.sampleRate * 2, buf = (this.noiseBuf = c.createBuffer(1, len, c.sampleRate)), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.applyVolumes();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }
  applyVolumes(): void {
    if (!this.ctx) return;
    const s = this.settings;
    this.master.gain.value = s.master; this.sfx.gain.value = s.sfx; this.music.gain.value = s.music * 0.7; this.ambient.gain.value = s.ambient * 0.6;
  }
  private voice(dur: number): boolean { if (!this.ctx || this.voices >= MAX_VOICES) return false; this.voices++; setTimeout(() => this.voices--, dur * 1000 + 60); return true; }
  private out(pan: number, vol: number, dest?: AudioNode): GainNode {
    const c = this.ctx!, g = c.createGain(); g.gain.value = vol;
    if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); p.connect(dest ?? this.sfx); } else g.connect(dest ?? this.sfx);
    return g;
  }
  tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.2, to = freq, pan = 0, delay = 0, dest?: AudioNode): void {
    if (!this.voice(dur + delay)) return;
    const c = this.ctx!, t = c.currentTime + delay, o = c.createOscillator(), g = this.out(pan, 0, dest);
    o.type = type; o.frequency.setValueAtTime(freq, t); if (to !== freq) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.012, dur * 0.2)); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); o.start(t); o.stop(t + dur + 0.03);
  }
  noise(dur: number, freq: number, vol = 0.2, q = 1, type: BiquadFilterType = 'bandpass', to = freq, pan = 0, delay = 0): void {
    if (!this.voice(dur + delay)) return;
    const c = this.ctx!, t = c.currentTime + delay, src = c.createBufferSource(), f = c.createBiquadFilter(), g = this.out(pan, 0);
    src.buffer = this.noiseBuf; src.loop = true; f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(freq, t); if (to !== freq) f.frequency.exponentialRampToValueAtTime(Math.max(30, to), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + Math.min(0.015, dur * 0.25)); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    src.connect(f); f.connect(g); src.start(t, Math.random()); src.stop(t + dur + 0.03);
  }
  /** Plays a named cue. `dx` is the horizontal screen-space offset from the listener (meters) for panning/attenuation. */
  play(id: string, dx = 0, dist = 0, a = 0): void {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = performance.now(), prev = this.last.get(id) ?? 0;
    if (now - prev < 45) return;
    this.last.set(id, now);
    const pan = Math.max(-0.8, Math.min(0.8, dx / 14)), v = Math.max(0.12, 1 - dist / 30);
    const T = (f: number, d: number, ty: OscillatorType, vol: number, to?: number, dl = 0) => this.tone(f, d, ty, vol * v, to ?? f, pan, dl);
    const N = (d: number, f: number, vol: number, q = 1, ty: BiquadFilterType = 'bandpass', to?: number, dl = 0) => this.noise(d, f, vol * v, q, ty, to ?? f, pan, dl);
    switch (id) {
      case 'windup_melee': N(0.16, 500, 0.12, 0.8, 'bandpass', 1400); break;
      case 'windup_bow': N(0.14, 1800, 0.06, 2, 'bandpass', 900); T(180, 0.12, 'triangle', 0.05, 240); break;
      case 'windup_cast': T(300, 0.2, 'sine', 0.06, 620); break;
      case 'iron_litany': N(0.1, 900, 0.16, 0.7, 'bandpass', 300); break;
      case 'brand_arc': N(0.4, 700, 0.3, 0.6, 'bandpass', 180); T(160, 0.3, 'sawtooth', 0.08, 70); break;
      case 'bastion_step': N(0.25, 300, 0.3, 0.8, 'lowpass', 1200); T(110, 0.2, 'square', 0.1, 60); break;
      case 'cinder_ring': case 'explosion': T(90, 0.6, 'sine', 0.5, 32); N(0.6, 900, 0.4, 0.5, 'lowpass', 120); N(0.2, 3000, 0.15, 1, 'highpass'); break;
      case 'vow_chain': for (let i = 0; i < 4; i++) T(1400 + i * 220, 0.05, 'square', 0.05, 900, i * 0.03); N(0.2, 2400, 0.1, 3); break;
      case 'furnace_heart': T(70, 0.9, 'sawtooth', 0.2, 140); N(0.9, 400, 0.2, 0.6, 'bandpass', 1600); break;
      case 'ashen_standard': T(196, 0.7, 'triangle', 0.2); T(294, 0.7, 'triangle', 0.14, 294, 0.05); N(0.15, 200, 0.3, 1, 'lowpass'); break;
      case 'quickshot': case 'enemy_shot': T(id === 'quickshot' ? 240 : 170, 0.09, 'triangle', 0.2, 110); N(0.12, 2600, 0.1, 1.5, 'bandpass', 5000); break;
      case 'splinter_volley': for (let i = 0; i < 4; i++) { T(260 - i * 12, 0.08, 'triangle', 0.14, 120, i * 0.022); N(0.1, 3000, 0.07, 2, 'bandpass', 5200, i * 0.022); } break;
      case 'ghostline': T(900, 0.4, 'sine', 0.16, 2400); N(0.35, 4000, 0.12, 2, 'bandpass', 8000); T(200, 0.12, 'triangle', 0.2, 100); break;
      case 'snare_bloom': T(520, 0.05, 'square', 0.1); T(780, 0.07, 'square', 0.08, 780, 0.06); break;
      case 'mothcloak': N(0.5, 3000, 0.14, 0.7, 'bandpass', 600); break;
      case 'backstep_flask': N(0.12, 5000, 0.2, 3, 'highpass'); T(1900, 0.1, 'sine', 0.1, 900, 0.03); N(0.4, 500, 0.15, 1, 'lowpass', 150, 0.05); break;
      case 'horizon_call': T(60, 1.2, 'sawtooth', 0.18, 90); for (let i = 0; i < 8; i++) N(0.1, 3200, 0.08, 2, 'bandpass', 5000, 0.3 + i * 0.12); break;
      case 'hit': T(140, 0.09, 'sine', 0.3, 60); N(0.06, 1400, 0.16, 1); break;
      case 'hit_player': T(100, 0.16, 'square', 0.22, 50); N(0.1, 600, 0.25, 0.8, 'lowpass'); break;
      case 'crit': T(140, 0.1, 'sine', 0.3, 60); T(1760, 0.22, 'triangle', 0.14, 2640); N(0.08, 4000, 0.15, 2); break;
      case 'death': T(120, 0.25, 'sawtooth', 0.14, 45); N(0.25, 500, 0.16, 0.7, 'lowpass', 120); break;
      case 'block': T(820, 0.14, 'square', 0.12, 620); T(1240, 0.2, 'triangle', 0.1); break;
      case 'evade': N(0.2, 900, 0.16, 0.6, 'bandpass', 2600); break;
      case 'telegraph': T(520, 0.16, 'triangle', 0.1, 780); break;
      case 'telegraph_heavy': T(196, Math.max(0.4, a * 0.9), 'sawtooth', 0.13, 330); T(98, 0.5, 'sine', 0.22, 80); T(1320, 0.5, 'sine', 0.05, 1320, 0.02); break;
      case 'potion': T(320, 0.09, 'sine', 0.16, 240); T(420, 0.09, 'sine', 0.16, 300, 0.1); T(560, 0.14, 'sine', 0.14, 380, 0.2); break;
      case 'gold': T(1760, 0.07, 'triangle', 0.1); T(2349, 0.12, 'triangle', 0.08, 2349, 0.05); break;
      case 'pickup': T(660, 0.08, 'triangle', 0.12, 880); break;
      case 'loot1': T(880, 0.2, 'triangle', 0.14); break;
      case 'loot2': T(784, 0.2, 'triangle', 0.16); T(1175, 0.35, 'triangle', 0.16, 1175, 0.1); break;
      case 'loot3': [523, 784, 1047, 1568].forEach((f, i) => T(f, 0.5, 'triangle', 0.18, f, i * 0.09)); T(131, 0.9, 'sine', 0.2); break;
      case 'levelup': [392, 494, 587, 784, 988].forEach((f, i) => T(f, 0.45, 'triangle', 0.18, f, i * 0.08)); break;
      case 'quest': T(440, 0.3, 'triangle', 0.16); T(660, 0.5, 'triangle', 0.16, 660, 0.16); break;
      case 'waypoint': case 'shrine': [660, 990, 1320, 1980].forEach((f, i) => T(f, 0.9, 'sine', 0.1, f * 1.01, i * 0.07)); N(0.9, 5000, 0.06, 2, 'bandpass', 9000); break;
      case 'gate_start': T(220, 2.8, 'sine', 0.1, 660); break;
      case 'door': T(70, 0.4, 'square', 0.16, 45); N(0.35, 260, 0.25, 1, 'lowpass'); break;
      case 'chest': N(0.2, 500, 0.14, 2, 'bandpass', 900); T(1320, 0.3, 'triangle', 0.1, 1320, 0.15); break;
      case 'invalid': T(130, 0.14, 'square', 0.1, 100); break;
      case 'ready': T(1100, 0.06, 'sine', 0.05); break;
      case 'ui': T(700, 0.04, 'triangle', 0.07); break;
      case 'equip': N(0.1, 1600, 0.12, 2); T(300, 0.08, 'triangle', 0.1, 200); break;
      case 'bossPhase': T(110, 1.6, 'sine', 0.35); T(220, 1.4, 'triangle', 0.15, 218); T(554, 1.8, 'sine', 0.07); break;
      case 'playerDeath': [392, 330, 262, 196].forEach((f, i) => T(f, 0.7, 'sawtooth', 0.1, f * 0.97, i * 0.22)); break;
      case 'victory': [392, 523, 659, 784, 1047].forEach((f, i) => { T(f, 1.2, 'triangle', 0.16, f, i * 0.14); T(f / 2, 1.2, 'sine', 0.1, f / 2, i * 0.14); }); break;
      default: if (id.startsWith('aggro_')) { T(id.endsWith('hound') ? 260 : 150, 0.25, 'sawtooth', 0.07, id.endsWith('hound') ? 180 : 100); } break;
    }
  }
  /** Adaptive bed: a filtered drone per mood plus wind, with a boss pulse layer and low-health heartbeat. */
  setMood(mood: Mood): void {
    if (!this.ctx || mood === this.mood) return;
    this.mood = mood;
    const c = this.ctx, t = c.currentTime;
    for (const n of this.moodNodes) { try { (n as GainNode).gain?.linearRampToValueAtTime(0, t + 1.5); setTimeout(() => { try { n.disconnect(); } catch { /* already gone */ } }, 1800); } catch { /* ignore */ } }
    this.moodNodes = [];
    const roots: Record<Mood, number[]> = { menu: [55, 82.4, 110], town: [110, 164.8, 220], wild: [73.4, 87.3, 146.8], crypt: [65.4, 92.5, 98], boss: [55, 58.3, 110] };
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(mood === 'boss' ? 0.26 : 0.2, t + 2); g.connect(this.music);
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = mood === 'town' ? 700 : mood === 'boss' ? 520 : 380; f.Q.value = 2; f.connect(g);
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = mood === 'boss' ? 2.2 : 0.07; lg.gain.value = mood === 'boss' ? 260 : 160; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
    roots[mood].forEach((fr, i) => { for (const det of [-4, 5]) { const o = c.createOscillator(); o.type = i === 0 ? 'sawtooth' : 'triangle'; o.frequency.value = fr; o.detune.value = det + i * 2; const og = c.createGain(); og.gain.value = i === 0 ? 0.3 : 0.16; o.connect(og); og.connect(f); o.start(); } });
    this.moodNodes.push(g);
    if (mood !== 'menu') {
      const w = c.createBufferSource(); w.buffer = this.noiseBuf; w.loop = true;
      const wf = c.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = mood === 'crypt' ? 220 : 520; wf.Q.value = 0.6;
      const wg = c.createGain(); wg.gain.setValueAtTime(0, t); wg.gain.linearRampToValueAtTime(mood === 'wild' ? 0.16 : 0.06, t + 2);
      const wl = c.createOscillator(), wlg = c.createGain(); wl.frequency.value = 0.13; wlg.gain.value = 260; wl.connect(wlg); wlg.connect(wf.frequency); wl.start();
      w.connect(wf); wf.connect(wg); wg.connect(this.ambient); w.start();
      this.moodNodes.push(wg);
    }
  }
  /** Called every frame: random spatial ambience (distant bells, drips) and the low-health heartbeat. */
  update(dt: number, lowHp: boolean): void {
    if (!this.ctx || this.ctx.state !== 'running' || !this.mood) return;
    this.bellT -= dt;
    if (this.bellT <= 0) {
      this.bellT = 9 + Math.random() * 14;
      const pan = Math.random() * 1.6 - 0.8;
      if (this.mood === 'wild') { this.tone(196, 2.4, 'sine', 0.035, 195, pan, 0, this.ambient); this.tone(392.5, 1.8, 'sine', 0.014, 392, pan, 0, this.ambient); }
      else if (this.mood === 'crypt') { this.tone(1800 + Math.random() * 900, 0.12, 'sine', 0.03, 900, pan, 0, this.ambient); this.bellT *= 0.4; }
      else if (this.mood === 'town') this.tone(440 + Math.random() * 200, 0.08, 'triangle', 0.012, 300, pan, 0, this.ambient);
    }
    if (lowHp !== this.lowHp) {
      this.lowHp = lowHp;
      if (this.heart !== null) { clearInterval(this.heart); this.heart = null; }
      if (lowHp) this.heart = window.setInterval(() => { this.tone(58, 0.14, 'sine', 0.3, 40); this.tone(52, 0.16, 'sine', 0.22, 38, 0, 0.2); }, 900);
      this.duck.gain.linearRampToValueAtTime(lowHp ? 0.55 : 1, this.ctx.currentTime + 0.5);
    }
  }
  stop(): void { if (this.heart !== null) clearInterval(this.heart); this.heart = null; this.lowHp = false; }
}
