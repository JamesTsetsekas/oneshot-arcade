// One play session: fixed-step simulation of the taxi, traffic, fares, scoring and mode rules.
// Renderer, audio and UI only read state and consume the typed event queue.
import { PhysicsWorld, Rapier, DT } from '../physics/physicsWorld';
import { WorldModel, EdgeLoc, Shortcut } from '../world/model';
import { Vehicle, InputFrame, NEUTRAL_INPUT } from '../vehicle/vehicle';
import { TAXIS, TaxiId } from '../vehicle/taxiSpecs';
import { Traffic, TrafficDensity } from '../traffic/traffic';
import { FareSystem, pickupAdvanceFactor, DeliveryBreakdown, Candidate, parTime } from '../fares/fares';
import { ARCHETYPES } from '../fares/passengers';
import { Pulse, StyleCat, STYLE_LABELS, TAILWIND_PER_CHARGE, rankFor, Rank } from '../score/pulse';
import { Rng, V3, clamp } from '../core/math';
import { SURFACES } from '../world/galeport';

export type ModeId = 'arcade' | 'quick' | 'trial' | 'school';
export interface ModeConfig {
  id: ModeId;
  name: string;
  blurb: string;
  startClock: number;
  extend: boolean;
  countUp: boolean;
}
export const MODES: Record<ModeId, ModeConfig> = {
  arcade: { id: 'arcade', name: 'Arcade Shift', blurb: '60 seconds on the clock. Every fare buys more.', startClock: 60, extend: true, countUp: false },
  quick: { id: 'quick', name: 'Quick Shift', blurb: 'Five minutes flat. No extensions, pure score.', startClock: 300, extend: false, countUp: false },
  trial: { id: 'trial', name: 'Time Trial', blurb: 'A fixed chain of fares against the stopwatch.', startClock: 0, extend: false, countUp: true },
  school: { id: 'school', name: 'Skill School', blurb: 'Ten quick lessons. No clock, no pressure.', startClock: 0, extend: false, countUp: true },
};

export interface TrialDef {
  name: string;
  hub: number;
  chain: [number, number][];
}
export const TRIALS: TrialDef[] = [
  { name: 'Harbor Dash', hub: 0, chain: [[1, 5], [6, 0], [0, 11]] },
  { name: 'Crown Descent', hub: 1, chain: [[22, 25], [26, 16], [14, 2]] },
  { name: 'Lantern Loop', hub: 2, chain: [[9, 13], [10, 27], [29, 30]] },
];

export interface LessonDef {
  id: string;
  title: string;
  text: string;
}
export const LESSONS: LessonDef[] = [
  { id: 'accel', title: 'Full Throttle', text: 'Hold W (or RT) and reach 100 km/h.' },
  { id: 'brake', title: 'Hard Stop', text: 'From above 80 km/h, hold S (LT) to stop completely.' },
  { id: 'surge', title: 'Surge Start', text: 'From a standstill: tap S, release it, then hit W within a heartbeat.' },
  { id: 'drift', title: 'Snap Drift', text: 'Above 35 km/h steer hard and tap Space. Hold the slide, then straighten to bank it.' },
  { id: 'grip', title: 'Grip Turn', text: 'While drifting, tap S then W to bite and tighten the line.' },
  { id: 'near', title: 'Near Miss', text: 'Pass a moving vehicle within a metre at over 50 km/h.' },
  { id: 'jump', title: 'Airtime', text: 'Follow the vane to a ramp and stay airborne for half a second.' },
  { id: 'shortcut', title: 'Shortcut', text: 'Follow the vane into a marked shortcut and drive out the far end.' },
  { id: 'stop', title: 'Clean Pickup', text: 'Stop dead-centre in a passenger ring, entering under 35 km/h.' },
  { id: 'fare', title: 'Full Fare', text: 'Deliver your passenger to the beacon and stop inside the ring.' },
];

export interface SessionOptions {
  mode: ModeId;
  taxi: TaxiId;
  seed: number;
  traffic: TrafficDensity;
  hub?: number;
  trial?: number;
  wideWindows?: boolean;
  steerAssist?: boolean;
  discovered?: string[];
}

export type SessionEvent =
  | { type: 'countdown'; n: number }
  | { type: 'go' }
  | { type: 'style'; cat: StyleCat; label: string; points: number; mult: number; total: number; tip: boolean }
  | { type: 'pulse'; change: 'up' | 'down' | 'end' | 'crash'; mult: number }
  | { type: 'pickup'; cand: Candidate; clean: boolean; advance: number }
  | { type: 'delivered'; result: DeliveryBreakdown }
  | { type: 'fareFailed' }
  | { type: 'bark'; who: string; text: string; voice: number }
  | { type: 'collision'; severity: number; hard: boolean; traffic: boolean }
  | { type: 'time'; delta: number; reason: string }
  | { type: 'shortcut'; name: string; first: boolean }
  | { type: 'respawn'; reason: string }
  | { type: 'lesson'; index: number }
  | { type: 'boost'; on: boolean }
  | { type: 'air'; time: number }
  | { type: 'surge' }
  | { type: 'gripTurn' }
  | { type: 'driftStart'; snap: boolean }
  | { type: 'special' }
  | { type: 'lowTime'; n: number }
  | { type: 'token'; kind: 'tailwind' | 'clock'; value: number }
  | { type: 'finished' };

export interface SessionResult {
  mode: ModeId;
  taxi: TaxiId;
  trial: number;
  score: number;
  fares: number;
  tips: number;
  timeBonus: number;
  bonuses: number;
  style: number;
  penalties: number;
  deliveries: number;
  failures: number;
  bestMult: number;
  bestChain: number;
  collisions: number;
  shortcutsUsed: number;
  newShortcuts: string[];
  efficiency: number;
  duration: number;
  rank: Rank | null;
  medal: 'gold' | 'silver' | 'bronze' | 'none' | null;
  trialTime: number;
  medalTimes: [number, number, number] | null;
  lessonsDone: number;
  completed: boolean;
  seed: number;
  traffic: TrafficDensity;
  assisted: boolean;
}

/** Optional route pickups: deterministic placement, collected once per shift, never respawn. */
export interface PickupItem {
  kind: 'tailwind' | 'clock';
  x: number; y: number; z: number;
  taken: boolean;
}
export const CLOCK_SPARK_CAP = 3;

interface ShortcutTrack {
  armed: 0 | 1 | 2;
  timer: number;
  mid: boolean;
  cooldown: number;
}

const COUNTDOWN = 3.2;

export class Session {
  phys: PhysicsWorld;
  vehicle: Vehicle;
  traffic: Traffic;
  fares: FareSystem;
  pulse = new Pulse();
  mode: ModeConfig;
  phase: 'countdown' | 'running' | 'grace' | 'ended' = 'countdown';
  clock: number;
  elapsed = 0; // running time, excludes countdown
  tick = 0;
  events: SessionEvent[] = [];
  // Score parts.
  fareTotal = 0;
  tipsTotal = 0;
  timeBonusTotal = 0;
  bonusTotal = 0;
  styleTotal = 0;
  penalties = 0;
  collisions = 0;
  shortcutsUsed = 0;
  newShortcuts: string[] = [];
  discovered: Set<string>;
  // Guidance.
  playerLoc: EdgeLoc = { edge: 0, t: 0, dist: 0 };
  guideTarget: V3 | null = null;
  guidePoint: V3 | null = null;
  guideDist = 0;
  guideSite = -1;
  guidePath: V3[] = [];
  // Lessons / trials.
  lessonIndex = 0;
  private lessonFlag = false;
  medalTimes: [number, number, number] | null = null;
  result: SessionResult | null = null;
  resetPrompt = false;
  pickups: PickupItem[] = [];
  sparksTaken = 0;
  private countdown = COUNTDOWN;
  private lastCount = 4;
  private graceTimer = 0;
  private resetHold = 0;
  private resetCooldown = 0;
  private oncomingTime = 0;
  private cleanTime = 0;
  private lastNearMiss = { time: -10, agent: -1 };
  private tracks: ShortcutTrack[];
  private specialGate = 0;
  private lastLowTime = 99;
  private rng: Rng;
  private trafficHitThisStep = false;

  constructor(R: Rapier, public model: WorldModel, public opts: SessionOptions) {
    this.mode = MODES[opts.mode];
    this.rng = new Rng(opts.seed);
    this.phys = new PhysicsWorld(R, model);
    const trial = opts.mode === 'trial' ? TRIALS[opts.trial ?? 0] : null;
    const hub = model.hubs[trial ? trial.hub : (opts.hub ?? this.rng.int(model.hubs.length))];
    this.vehicle = new Vehicle(this.phys, TAXIS[opts.taxi], hub.pose);
    if (opts.wideWindows) this.vehicle.windowScale = 1.8;
    if (opts.steerAssist) this.vehicle.steerAssist = 1.25;
    this.traffic = new Traffic(this.phys, model, opts.seed, opts.traffic);
    this.traffic.populate(this.vehicle.pos);
    const trafficFactor = opts.traffic === 'high' ? 1.06 : opts.traffic === 'low' || opts.traffic === 'off' ? 0.95 : 1;
    this.fares = new FareSystem(model, new Rng(opts.seed ^ 0xabcdef), { trafficFactor, chain: trial?.chain, targetCandidates: opts.mode === 'school' ? 5 : 7 });
    this.clock = this.mode.startClock;
    this.discovered = new Set(opts.discovered ?? []);
    this.tracks = model.shortcuts.map(() => ({ armed: 0, timer: 0, mid: false, cooldown: 0 }));
    // Tailwind tokens sit off the ideal line inside ground shortcuts; Clock sparks hang over the risky jumps.
    for (const sc of model.shortcuts) {
      if (!sc.corridor || sc.kind === 'jump' || sc.kind === 'garage') continue;
      const t = 0.5 + ((sc.index % 3) - 1) * 0.12;
      const dx = (sc.bx - sc.ax) / sc.len, dz = (sc.bz - sc.az) / sc.len;
      const side = sc.index % 2 ? 1 : -1;
      const x = sc.ax + (sc.bx - sc.ax) * t + dz * side * sc.width * 0.27, z = sc.az + (sc.bz - sc.az) * t - dx * side * sc.width * 0.27;
      const y = model.heightAt(x, z);
      if (y > 0.5) this.pickups.push({ kind: 'tailwind', x, y: y + 1.2, z, taken: false });
    }
    for (const [x, y, z] of [[548, 7.6, 70], [model.nodes[model.gridNode[2][7]].x, 9, 440], [884, model.heightAt(780, 570) - 3.2, 570]]) this.pickups.push({ kind: 'clock', x, y, z, taken: false });
    this.playerLoc = model.nearestEdge(this.vehicle.pos.x, this.vehicle.pos.z, this.vehicle.pos.y);
    if (trial) {
      let ref = 0;
      let from = this.playerLoc as { edge: number; t: number };
      for (const [a, b] of trial.chain) {
        const la = this.fares.siteLoc(a), lb = this.fares.siteLoc(b);
        ref += model.route(from, la).dist / 17 + 5 + parTime(model.route(la, lb).dist, trafficFactor);
        from = lb;
      }
      this.medalTimes = [Math.round(ref * 0.78), Math.round(ref * 0.95), Math.round(ref * 1.25)];
    }
    for (let i = 0; i < 3; i++) this.fares.update(0, { ...this.vehicle.pos, speed: 0 }, this.playerLoc, true);
    this.updateGuidance(true);
  }

  get score(): number {
    return Math.max(0, this.fareTotal + this.tipsTotal + this.timeBonusTotal + this.bonusTotal + this.styleTotal - this.penalties);
  }
  get hasClock(): boolean {
    return !this.mode.countUp;
  }
  get lesson(): (typeof LESSONS)[number] | null {
    return this.opts.mode === 'school' && this.lessonIndex < LESSONS.length ? LESSONS[this.lessonIndex] : null;
  }

  private emit(e: SessionEvent): void {
    this.events.push(e);
  }
  drainEvents(): SessionEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }

  private style(cat: StyleCat, base: number, chargeScale = 1, label?: string): void {
    const before = this.pulse.tier;
    const award = this.pulse.add(cat, base, chargeScale);
    const carrying = this.fares.state === 'carrying';
    let total = award.total;
    if (carrying) total = this.fares.addStyle(cat, award.total, award.mult);
    else { total = Math.round(award.total * 0.5); this.styleTotal += total; }
    this.vehicle.addTailwind(award.charge * TAILWIND_PER_CHARGE);
    this.emit({ type: 'style', cat, label: label ?? STYLE_LABELS[cat], points: award.points, mult: award.mult, total, tip: carrying });
    if (this.pulse.tier > before) {
      this.emit({ type: 'pulse', change: 'up', mult: this.pulse.mult });
      if (this.pulse.tier >= 2 && this.fares.deliveries >= this.specialGate + 2 && this.opts.mode !== 'trial' && this.opts.mode !== 'school') {
        this.specialGate = this.fares.deliveries + 2;
        this.fares.queueSpecial();
        this.emit({ type: 'special' });
      }
    }
    this.lessonCheck(cat);
  }

  private lessonCheck(cat: StyleCat | 'gripTurnRaw' | 'delivered'): void {
    const l = this.lesson;
    if (!l) return;
    const done =
      (l.id === 'surge' && cat === 'surge') || (l.id === 'drift' && cat === 'drift') || (l.id === 'grip' && (cat === 'gripTurn' || cat === 'gripTurnRaw')) ||
      (l.id === 'near' && (cat === 'nearMiss' || cat === 'thread')) || (l.id === 'jump' && cat === 'air') || (l.id === 'shortcut' && cat === 'shortcut') ||
      (l.id === 'stop' && cat === 'cleanPickup') || (l.id === 'fare' && cat === 'delivered');
    if (done) this.completeLesson();
  }
  private completeLesson(): void {
    this.emit({ type: 'lesson', index: this.lessonIndex });
    this.lessonIndex++;
    this.lessonFlag = false;
    this.vehicle.addTailwind(0.25);
    if (this.lessonIndex >= LESSONS.length) this.finish(true);
  }

  private timeDelta(delta: number, reason: string): void {
    if (!this.hasClock) return;
    this.clock = Math.max(0, this.clock + delta);
    this.emit({ type: 'time', delta, reason });
  }

  private respawn(reason: string, penalty: boolean): void {
    const v = this.vehicle;
    const pose = this.model.roadPose(v.pos.x, v.pos.z, reason === 'water' ? undefined : v.pos.y, v.yaw);
    v.setPose(pose);
    this.pulse.reset();
    this.resetCooldown = 2.5;
    if (penalty) {
      this.penalties += 200;
      if (this.hasClock) this.timeDelta(-3, 'reset');
      else this.elapsed += 3;
    }
    this.emit({ type: 'respawn', reason });
  }

  step(input: InputFrame): void {
    if (this.phase === 'ended') return;
    const dt = DT;
    this.tick++;
    const v = this.vehicle;
    if (this.phase === 'countdown') {
      this.countdown -= dt;
      const n = Math.ceil(this.countdown - 0.2);
      if (n < this.lastCount && n >= 1) { this.lastCount = n; this.emit({ type: 'countdown', n }); }
      if (this.countdown <= 0) { this.phase = 'running'; this.emit({ type: 'go' }); }
    }
    const running = this.phase === 'running' || this.phase === 'grace';
    v.frozen = !running || this.fares.frozen;
    if (!running) input = NEUTRAL_INPUT;

    // --- simulate -----------------------------------------------------------------
    const probe = { pos: v.pos, vel: v.vel, speed: v.speed, halfW: v.spec.half.x };
    v.preStep(input);
    this.traffic.preStep(probe);
    this.phys.step();
    v.postStep(input);
    const probe2 = { pos: v.pos, vel: v.vel, speed: v.speed, halfW: v.spec.half.x };
    this.traffic.postStep(probe2);
    if (!running) { v.drainEvents(); this.traffic.drainEvents(); return; }
    this.elapsed += dt;

    // --- traffic events --------------------------------------------------------------
    this.trafficHitThisStep = false;
    for (const e of this.traffic.drainEvents()) {
      if (e.type === 'trafficHit') this.trafficHitThisStep = true;
      else if (e.type === 'nearMiss') {
        const base = 100 + Math.round(Math.max(0, v.speed - 14) * 4) + (e.oncoming ? 50 : 0);
        if (this.elapsed - this.lastNearMiss.time <= 0.7 && this.lastNearMiss.agent !== e.agent) this.style('thread', 300);
        else this.style('nearMiss', base);
        this.lastNearMiss = { time: this.elapsed, agent: e.agent };
      }
    }
    // --- vehicle events --------------------------------------------------------------
    for (const e of v.drainEvents()) {
      switch (e.type) {
        case 'collision': {
          this.collisions++;
          this.pulse.collision(e.hard);
          this.cleanTime = 0;
          this.fares.onCollision(e.hard);
          this.emit({ type: 'collision', severity: e.severity, hard: e.hard, traffic: this.trafficHitThisStep });
          this.emit({ type: 'pulse', change: 'crash', mult: this.pulse.mult });
          break;
        }
        case 'surge': this.style('surge', 100); this.emit({ type: 'surge' }); break;
        case 'gripTurn': this.style('gripTurn', 150); this.emit({ type: 'gripTurn' }); break;
        case 'driftStart': this.emit({ type: 'driftStart', snap: e.snap }); break;
        case 'driftEnd':
          if (e.clean && e.points > 0) this.style('drift', Math.round(e.points * (e.snap ? 1.15 : 1)), clamp(e.points / 150, 0.5, 2.5), e.snap ? 'Snap Drift' : 'Drift');
          break;
        case 'air': {
          const pts = Math.round(150 * Math.pow(e.time, 1.3)) + (e.aligned ? 100 : 0);
          this.style('air', pts, clamp(e.time, 0.6, 2), e.aligned ? 'Airtime + Clean Landing' : 'Airtime');
          this.emit({ type: 'air', time: e.time });
          break;
        }
        case 'boostStart': this.emit({ type: 'boost', on: true }); break;
        case 'boostEnd': this.emit({ type: 'boost', on: false }); break;
      }
    }

    // --- continuous detectors ------------------------------------------------------------
    if (this.tick % 6 === 0) this.playerLoc = this.model.nearestEdge(v.pos.x, v.pos.z, v.pos.y);
    this.detectOncoming(dt);
    this.detectShortcuts(dt);
    const carrying = this.fares.state === 'carrying';
    if (carrying && v.speed > 70 / 3.6 && SURFACES[v.surface].style) {
      this.cleanTime += dt;
      if (this.cleanTime >= 10) { this.cleanTime = 0; this.style('cleanSector', 200); }
    } else if (!carrying || v.speed < 40 / 3.6) this.cleanTime = 0;
    if (carrying && this.tick % 20 === 0 && this.fares.passenger?.pref === 'tourist' && this.fares.tripSights.size < 5) {
      const c = this.fares.current!;
      for (const s of this.model.sites) {
        if (s.id === c.dest || s.id === c.site || this.fares.tripSights.has(s.id)) continue;
        if (Math.hypot(s.lx - v.pos.x, s.lz - v.pos.z) < 55) { this.fares.tripSights.add(s.id); this.style('sightsee', 90); break; }
      }
    }

    for (const p of this.pickups) {
      if (p.taken || Math.abs(p.x - v.pos.x) > 6 || Math.abs(p.z - v.pos.z) > 6) continue;
      const r = p.kind === 'clock' ? 4.6 : 3.4;
      if (Math.hypot(p.x - v.pos.x, p.z - v.pos.z) > r || Math.abs(p.y - v.pos.y) > (p.kind === 'clock' ? 6 : 3)) continue;
      if (p.kind === 'clock') {
        if (this.sparksTaken >= CLOCK_SPARK_CAP) continue;
        p.taken = true;
        this.sparksTaken++;
        if (this.mode.extend) { this.timeDelta(1, 'spark'); this.emit({ type: 'token', kind: 'clock', value: 1 }); }
        else { this.styleTotal += 250; this.emit({ type: 'token', kind: 'clock', value: 250 }); }
      } else {
        p.taken = true;
        v.addTailwind(0.3);
        this.emit({ type: 'token', kind: 'tailwind', value: 30 });
      }
    }

    // --- fares -------------------------------------------------------------------------------
    this.fares.update(dt, { x: v.pos.x, y: v.pos.y, z: v.pos.z, speed: v.speed }, this.playerLoc, this.tick % 30 === 0);
    for (const e of this.fares.drainEvents()) {
      switch (e.type) {
        case 'pickup': {
          let advance = 0;
          if (this.mode.extend) { advance = Math.round(e.cand.par * pickupAdvanceFactor(this.fares.deliveries)); this.timeDelta(advance, 'pickup'); }
          this.emit({ type: 'pickup', cand: e.cand, clean: e.clean, advance });
          if (e.clean) this.style('cleanPickup', 250);
          this.updateGuidance(true);
          break;
        }
        case 'delivered': {
          const r = e.result;
          this.fareTotal += r.base; this.tipsTotal += r.tips; this.timeBonusTotal += r.timeBonus; this.bonusTotal += r.accuracy + r.discovery + r.prefBonus;
          if (this.mode.extend) this.timeDelta(r.timeAward, 'delivery');
          v.addTailwind(r.grade === 'Blazing' ? 0.25 : r.grade === 'Fast' ? 0.15 : r.grade === 'Close' ? 0.08 : 0.03);
          v.repair();
          this.emit({ type: 'delivered', result: r });
          if (r.precision) this.style('precision', 150);
          this.lessonCheck('delivered');
          this.updateGuidance(true);
          break;
        }
        case 'failed': this.pulse.reset(); this.emit({ type: 'fareFailed' }); this.updateGuidance(true); break;
        case 'bark': this.emit({ type: 'bark', who: e.who, text: e.text, voice: e.voice }); break;
        default: break;
      }
    }

    // --- pulse decay ------------------------------------------------------------------------------
    const decay = this.pulse.update(dt);
    if (decay) this.emit({ type: 'pulse', change: decay, mult: this.pulse.mult });

    // --- lessons that watch raw state ----------------------------------------------------------------
    const l = this.lesson;
    if (l) {
      if (l.id === 'accel' && v.speedKmh >= 100) this.completeLesson();
      else if (l.id === 'brake') {
        if (v.speedKmh > 80) this.lessonFlag = true;
        if (this.lessonFlag && v.speed < 0.5 && input.brake > 0.5) this.completeLesson();
      }
    }

    // --- resets ------------------------------------------------------------------------------------------
    this.resetCooldown = Math.max(0, this.resetCooldown - dt);
    this.resetPrompt = v.canOfferReset;
    if (v.needsRespawn) this.respawn(v.waterTime > 0.9 ? 'water' : v.outOfBounds ? 'bounds' : 'flip', true);
    else if (input.reset && this.resetCooldown <= 0 && !this.fares.frozen) {
      this.resetHold += dt;
      if (this.resetHold > 0.5) { this.resetHold = 0; this.respawn('manual', true); }
    } else this.resetHold = 0;

    // --- clock ------------------------------------------------------------------------------------------------
    if (this.hasClock && !this.fares.frozen) {
      if (this.phase === 'running') {
        this.clock = Math.max(0, this.clock - dt);
        const whole = Math.ceil(this.clock);
        if (whole <= 10 && whole < this.lastLowTime && whole >= 1) { this.emit({ type: 'lowTime', n: whole }); }
        this.lastLowTime = whole;
        if (this.clock <= 0) {
          if (carrying && this.fares.inDropZone) { this.phase = 'grace'; this.graceTimer = 2; } else this.finish(true);
        }
      } else if (this.phase === 'grace') {
        this.graceTimer -= dt;
        if (this.clock > 0) this.phase = 'running';
        else if (this.graceTimer <= 0 || !this.fares.inDropZone) this.finish(true);
      }
    }
    if (this.opts.mode === 'trial' && this.fares.chainDone) this.finish(true);
    this.updateGuidance(false);
  }

  private detectOncoming(dt: number): void {
    const v = this.vehicle;
    const e = this.model.edges[this.playerLoc.edge];
    let on = false;
    if (e.info.oncoming && v.speed > 60 / 3.6 && v.groundedCount >= 3 && this.playerLoc.t > 0.06 && this.playerLoc.t < 0.94) {
      const a = this.model.nodes[e.a];
      const along = v.vel.x * e.dx + v.vel.z * e.dz;
      const s = along >= 0 ? 1 : -1;
      const off = ((v.pos.x - a.x) * e.dz - (v.pos.z - a.z) * e.dx) * s;
      const y = this.model.edgeY(e, this.playerLoc.t);
      on = Math.abs(along) > 14 && off < -1.3 && off > -e.hw && Math.abs(v.pos.y - y) < 2.5;
    }
    if (on) {
      this.oncomingTime += dt;
      if (this.oncomingTime >= 1) { this.oncomingTime = 0; this.style('oncoming', 80); }
    } else this.oncomingTime = Math.max(0, this.oncomingTime - dt * 2);
  }

  private detectShortcuts(dt: number): void {
    const v = this.vehicle;
    const R = 11;
    for (let i = 0; i < this.model.shortcuts.length; i++) {
      const s = this.model.shortcuts[i], t = this.tracks[i];
      t.cooldown = Math.max(0, t.cooldown - dt);
      if (Math.abs(v.pos.x - (s.ax + s.bx) / 2) > s.len / 2 + 40 || Math.abs(v.pos.z - (s.az + s.bz) / 2) > s.len / 2 + 40) { t.armed = 0; continue; }
      const dA = Math.hypot(v.pos.x - s.ax, v.pos.z - s.az) + Math.max(0, Math.abs(v.pos.y - s.ay) - 4) * 3;
      const dB = Math.hypot(v.pos.x - s.bx, v.pos.z - s.bz) + Math.max(0, Math.abs(v.pos.y - s.by) - 4) * 3;
      if (t.armed === 0) {
        if (t.cooldown > 0) continue;
        if (dA < R) { t.armed = 1; t.timer = s.len / 7 + 10; t.mid = false; }
        else if (dB < R && !s.oneWay) { t.armed = 2; t.timer = s.len / 7 + 10; t.mid = false; }
        continue;
      }
      t.timer -= dt;
      const dMid = Math.hypot(v.pos.x - (s.ax + s.bx) / 2, v.pos.z - (s.az + s.bz) / 2);
      if (dMid < Math.max(s.width / 2 + 6, 14)) t.mid = true;
      const dEnd = t.armed === 1 ? dB : dA;
      if (t.mid && dEnd < R) { t.armed = 0; t.cooldown = 15; this.completeShortcut(s); }
      else if (t.timer <= 0) t.armed = 0;
    }
  }
  private completeShortcut(s: Shortcut): void {
    const first = !this.discovered.has(s.id);
    this.shortcutsUsed++;
    if (first) { this.discovered.add(s.id); this.newShortcuts.push(s.id); this.fares.onDiscovery(); }
    this.emit({ type: 'shortcut', name: s.name, first });
    this.style('shortcut', first ? 800 : 300, 1, first ? `Discovered: ${s.name}` : s.name);
  }

  private updateGuidance(force: boolean): void {
    const v = this.vehicle, m = this.model;
    if (force || this.tick % 20 === 0) {
      let target: V3 | null = null;
      let loc: { edge: number; t: number } | null = null;
      this.guideSite = -1;
      const l = this.lesson;
      if (this.fares.current && this.fares.state !== 'unloading') {
        const d = m.sites[this.fares.current.dest];
        target = { x: d.x, y: d.y, z: d.z }; loc = { edge: d.edge, t: d.t }; this.guideSite = d.id;
      } else if (l && l.id === 'jump') {
        let best = Infinity;
        for (const r of m.ramps) { const d = Math.hypot(r.def.x - v.pos.x, r.def.z - v.pos.z); if (d < best) { best = d; target = { x: r.def.x - Math.sin(r.def.yaw) * 30, y: r.topY, z: r.def.z - Math.cos(r.def.yaw) * 30 }; } }
      } else if (l && l.id === 'shortcut') {
        let best = Infinity;
        for (const s of m.shortcuts) { if (s.kind === 'drop' || s.kind === 'jump') continue; const d = Math.hypot(s.ax - v.pos.x, s.az - v.pos.z); if (d < best && d > 30) { best = d; target = { x: s.ax, y: s.ay, z: s.az }; } }
      } else if (!l || l.id === 'stop' || l.id === 'fare' || !this.lesson) {
        let best = Infinity;
        for (const c of this.fares.candidates) {
          const s = m.sites[c.site];
          const d = m.route(this.playerLoc, { edge: s.edge, t: s.t }).dist;
          if (d < best) { best = d; target = { x: s.x, y: s.y, z: s.z }; loc = { edge: s.edge, t: s.t }; this.guideSite = s.id; }
        }
      }
      this.guideTarget = target;
      if (target) {
        if (!loc) { const ne = m.nearestEdge(target.x, target.z); loc = { edge: ne.edge, t: ne.t }; }
        const rp = m.routePolyline(this.playerLoc, loc, { ...v.pos }, target);
        this.guidePath = rp.pts;
        this.guideDist = rp.dist;
      } else this.guidePath = [];
    }
    if (!this.guideTarget || this.guidePath.length < 2) { this.guidePoint = this.guideTarget; return; }
    // Pure-pursuit point: closest point on the path, advanced by a look-ahead distance.
    const path = this.guidePath;
    let bi = 0, bt = 0, bd = Infinity;
    for (let i = 0; i < Math.min(path.length - 1, 3); i++) {
      const a = path[i], b = path[i + 1];
      const dx = b.x - a.x, dz = b.z - a.z;
      const l2 = dx * dx + dz * dz;
      const t = l2 > 0 ? clamp(((v.pos.x - a.x) * dx + (v.pos.z - a.z) * dz) / l2, 0, 1) : 0;
      const d = Math.hypot(v.pos.x - (a.x + dx * t), v.pos.z - (a.z + dz * t));
      if (d < bd - 0.01) { bd = d; bi = i; bt = t; }
    }
    let remain = 34 + v.speed * 0.5;
    let i = bi, t = bt;
    let pt: V3 = path[path.length - 1];
    let total = 0;
    while (i < path.length - 1) {
      const a = path[i], b = path[i + 1];
      const segLen = Math.hypot(b.x - a.x, b.z - a.z);
      const left = segLen * (1 - t);
      if (left >= remain) { const tt = t + remain / Math.max(segLen, 1e-3); pt = { x: a.x + (b.x - a.x) * tt, y: a.y + (b.y - a.y) * tt, z: a.z + (b.z - a.z) * tt }; total = -1; break; }
      remain -= left; i++; t = 0;
    }
    if (total !== -1) pt = path[path.length - 1];
    this.guidePoint = pt;
  }

  finish(completed: boolean): void {
    if (this.phase === 'ended') return;
    this.phase = 'ended';
    const mode = this.opts.mode;
    let medal: SessionResult['medal'] = null;
    if (mode === 'trial' && this.medalTimes) {
      const t = this.elapsed;
      const allDelivered = this.fares.chainDone && this.fares.failures === 0;
      medal = !allDelivered || !completed ? 'none' : t <= this.medalTimes[0] ? 'gold' : t <= this.medalTimes[1] ? 'silver' : t <= this.medalTimes[2] ? 'bronze' : 'none';
    }
    this.result = {
      mode, taxi: this.opts.taxi, trial: this.opts.trial ?? 0, score: this.score, fares: this.fareTotal, tips: this.tipsTotal, timeBonus: this.timeBonusTotal,
      bonuses: this.bonusTotal, style: this.styleTotal, penalties: this.penalties, deliveries: this.fares.deliveries, failures: this.fares.failures,
      bestMult: [1, 2, 3, 5][this.pulse.bestTier], bestChain: this.pulse.bestChain, collisions: this.collisions, shortcutsUsed: this.shortcutsUsed,
      newShortcuts: [...this.newShortcuts], efficiency: this.fares.efficiency, duration: this.elapsed,
      rank: mode === 'arcade' || mode === 'quick' ? rankFor(mode, this.score) : null, medal, trialTime: this.elapsed, medalTimes: this.medalTimes,
      lessonsDone: this.lessonIndex, completed, seed: this.opts.seed, traffic: this.opts.traffic, assisted: !!(this.opts.wideWindows || this.opts.steerAssist),
    };
    this.emit({ type: 'finished' });
  }

  /** Cheap state hash for determinism tests and replay validation. */
  hash(): number {
    const v = this.vehicle;
    let h = 2166136261;
    const mix = (n: number) => { h ^= Math.round(n * 1000) | 0; h = Math.imul(h, 16777619); };
    mix(v.pos.x); mix(v.pos.y); mix(v.pos.z); mix(v.vel.x); mix(v.vel.z); mix(this.score); mix(this.clock); mix(this.pulse.charge);
    for (const a of this.traffic.agents) { mix(a.x); mix(a.z); }
    return h >>> 0;
  }
  dispose(): void {
    this.phys.dispose();
  }
}

export { ARCHETYPES };
