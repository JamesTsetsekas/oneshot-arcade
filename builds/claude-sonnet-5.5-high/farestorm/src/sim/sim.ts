/**
 * Game session: owns the world queries, the taxi, traffic, fares, score and clocks, and advances all
 * of them in fixed 60 Hz steps. Rendering/audio/UI read state and drain `events`; nothing in here
 * touches the DOM, WebGL or wall-clock time, so runs are reproducible from (seed, inputs).
 */
import { ARCHETYPES, TAXIS, type TaxiSpec } from './data';
import { FareManager, type Fare, baseFareFor, parFor, tierFor } from './fares';
import { dist, clamp } from './math';
import { RULES, STEP, type Grade, type Tier } from './rules';
import { Rng } from './rng';
import { ScoreState, rankFor, type Award } from './score';
import { Traffic, type Agent } from './traffic';
import { createVehicle, forwardOf, stepVehicle, type VehicleEvent, type VehicleInput, type VehicleState } from './vehicle';
import { getWorld, type Shortcut, type World } from './world';

export type Mode = 'arcade' | 'quick' | 'trial';
export type TrafficLevel = 'calm' | 'normal' | 'dense';

export interface SimOptions {
  seed?: number;
  mode?: Mode;
  taxi?: TaxiSpec['id'];
  hub?: number;
  traffic?: TrafficLevel;
  discovered?: string[]; // shortcut ids discovered in earlier runs (persistent)
  startCountdown?: number;
  world?: World;
}

export interface SimInput extends VehicleInput {
  resetHeld: boolean;
}
export const IDLE: SimInput = { throttle: 0, brake: 0, steer: 0, handbrake: false, boost: false, resetHeld: false };

export interface Breakdown {
  base: number;
  timeBonus: number;
  tips: number;
  prefBonus: number;
  prefLabel: string;
  accuracy: number;
  discovery: number;
  total: number;
  grade: Grade;
  shiftSeconds: number;
  fraction: number;
  par: number;
  tripTime: number;
  tier: Tier;
  precise: boolean;
}

export type GameEvent =
  | { type: 'countdown'; n: number }
  | { type: 'go' }
  | { type: 'style'; category: string; label: string; points: number; mult: number }
  | { type: 'bank'; points: number }
  | { type: 'chainLoss'; mode: 'tier' | 'break' }
  | { type: 'boarded'; fare: Fare; clean: boolean }
  | { type: 'delivered'; fare: Fare; breakdown: Breakdown }
  | { type: 'fareFailed'; fare: Fare }
  | { type: 'candidates' }
  | { type: 'bark'; text: string; who: string; kind: string }
  | { type: 'collision'; impact: number; tag: string; hard: boolean; x: number; z: number }
  | { type: 'boost'; on: boolean }
  | { type: 'tailwindReady' }
  | { type: 'token'; kind: 'tailwind' | 'spark' }
  | { type: 'shortcut'; sc: Shortcut; first: boolean }
  | { type: 'respawn'; reason: 'water' | 'reset' }
  | { type: 'ended'; reason: string }
  | { type: 'timeAdd'; seconds: number }
  | { type: 'clockTick'; n: number }
  | { type: 'honk' }
  | { type: 'vehicle'; ev: VehicleEvent }
  | { type: 'hint'; text: string };

export interface Trip {
  fare: Fare;
  time: number;
  distance: number;
  discovery: number;
  urgent: boolean;
  grace: number; // seconds of personal grace remaining after patience hits 0
  graceOn: boolean;
  cleanSector: number;
  boardedClean: boolean;
}

export interface Results {
  score: number;
  deliveries: number;
  fares: number;
  tips: number;
  timeBonuses: number;
  bestPulse: number;
  bestChain: number;
  collisions: number;
  shortcuts: number;
  newShortcuts: number;
  efficiency: number; // percent
  rank: 'S' | 'A' | 'B' | 'C' | 'D';
  mode: Mode;
  taxi: string;
  time: number;
  failed: number;
  medal?: 'gold' | 'silver' | 'bronze' | 'none';
}

export class Sim {
  world: World;
  spec: TaxiSpec;
  vehicle: VehicleState;
  traffic: Traffic;
  fares: FareManager;
  score = new ScoreState();
  mode: Mode;
  phase: 'countdown' | 'running' | 'ended' = 'countdown';
  countdown: number;
  time = 0;
  clock: number;
  pauseTimer = 0;
  endGrace = -1;
  frame = 0;
  events: GameEvent[] = [];
  trip: Trip | null = null;
  seed: number;

  // totals
  total = 0;
  fareTotal = 0;
  timeBonusTotal = 0;
  deliveries = 0;
  failed = 0;
  collisions = 0;
  shortcutsDone = new Set<string>();
  discovered: Set<string>;
  newShortcuts = 0;
  pathMeters = 0;
  drivenMeters = 0;
  sparks = 0;
  collected = new Set<number>();
  result: Results | null = null;
  trialChain: Fare[] = [];
  trialIndex = 0;

  // per-tick scratch / state machines
  private rng: Rng;
  private tokenFlash = 0;
  private resetHold = 0;
  private boostLatch = false;
  private nearCand = new Map<number, number>();
  private lastNearMiss = -9;
  private driftAcc = 0;
  private oncomingAcc = 0;
  private scState = new Map<number, { end: number; t: number; mid: boolean }>();
  private barkCd = 0;
  private lastClockTick = 99;
  private refillCd = 0;
  private stuckTimer = 0;
  private wasReady = false;
  private pickupArmed = new Map<number, boolean>();
  private stopTimer = 0;
  private lastLandmarkCheck = 0;

  constructor(opts: SimOptions = {}) {
    this.world = opts.world ?? getWorld();
    this.mode = opts.mode ?? 'arcade';
    this.seed = opts.seed ?? 1;
    this.spec = TAXIS[opts.taxi ?? 'breaker'];
    this.rng = new Rng(this.seed * 31 + 7);
    const hubIdx = opts.hub ?? (this.mode === 'trial' ? 1 : this.rng.int(0, this.world.hubs.length - 1));
    const hub = this.world.hubs[hubIdx % this.world.hubs.length];
    this.vehicle = createVehicle(hub.x, hub.z, hub.heading);
    const level = opts.traffic ?? 'normal';
    const target = level === 'calm' ? 30 : level === 'dense' ? 56 : 44;
    this.traffic = new Traffic(this.world, this.seed * 977 + 13, target);
    this.traffic.populate(hub.x, hub.z);
    this.fares = new FareManager(this.world, this.seed * 4421 + 5, this.mode === 'trial' ? 1 : 6);
    this.discovered = new Set(opts.discovered ?? []);
    this.clock = this.mode === 'quick' ? RULES.quickShiftLength : this.mode === 'trial' ? 0 : RULES.shiftStart;
    this.countdown = opts.startCountdown ?? 3;
    if (this.mode === 'trial') this.buildTrialChain(hub.x, hub.z);
    this.fares.refill(hub.x, hub.z);
    if (this.mode === 'trial') this.showTrialFare();
    this.score.tailwind = 0.25;
  }

  // ------------------------------------------------------------------ trial mode
  private buildTrialChain(x: number, z: number): void {
    const tiers: Tier[] = ['short', 'medium', 'short', 'long'];
    const fm = new FareManager(this.world, 90210, 1);
    let px = x, pz = z;
    for (const t of tiers) {
      const f = fm.make(px, pz, t, []);
      if (!f) continue;
      this.trialChain.push(f);
      px = f.dest.x; pz = f.dest.z;
      fm.recent.push(f.dest.id);
    }
  }
  private showTrialFare(): void {
    this.fares.candidates = this.trialChain[this.trialIndex] ? [this.trialChain[this.trialIndex]] : [];
  }

  // ------------------------------------------------------------------ helpers
  private emit(e: GameEvent): void {
    this.events.push(e);
  }
  drain(): GameEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }

  get speedKmh(): number {
    return this.vehicle.speed * 3.6;
  }
  get boosting(): boolean {
    return this.vehicle.boosting;
  }
  get patienceLeft(): number {
    return this.trip ? this.trip.fare.limit - this.trip.time : 0;
  }

  private bark(kind: 'pickup' | 'stunt' | 'hit' | 'arrive' | 'urgent' | 'fail', cd = 4): void {
    if (!this.trip && kind !== 'arrive' && kind !== 'fail') return;
    if (this.barkCd > 0 && kind !== 'arrive' && kind !== 'fail' && kind !== 'pickup') return;
    const fare = this.trip?.fare;
    if (!fare) return;
    const a = ARCHETYPES[fare.archetype];
    this.barkCd = cd;
    this.emit({ type: 'bark', text: a.barks[kind], who: a.name, kind });
  }

  private style(category: Parameters<ScoreState['award']>[0], base: number, label: string): Award {
    const a = this.score.award(category, base, this.vehicle.boosting);
    this.emit({ type: 'style', category, label, points: a.points, mult: a.mult });
    if (a.mult >= 3 || category === 'air' || category === 'drift') this.bark('stunt', 6);
    return a;
  }

  // ------------------------------------------------------------------ main step
  step(input: SimInput, dt: number = STEP): void {
    this.frame++;
    this.barkCd = Math.max(0, this.barkCd - dt);
    const v = this.vehicle;

    if (this.phase === 'ended') {
      this.traffic.update(dt, { x: v.x, z: v.z, vx: v.vx, vz: v.vz, len: this.spec.length });
      return;
    }
    if (this.phase === 'countdown') {
      const before = Math.ceil(this.countdown);
      this.countdown -= dt;
      const after = Math.ceil(this.countdown);
      if (after !== before && after > 0) this.emit({ type: 'countdown', n: after });
      this.traffic.update(dt, { x: v.x, z: v.z, vx: v.vx, vz: v.vz, len: this.spec.length });
      if (this.countdown <= 0) { this.phase = 'running'; this.emit({ type: 'go' }); }
      return;
    }

    this.time += dt;

    // --- shift clock (boarding/unloading may pause it briefly)
    if (this.mode !== 'trial') {
      if (this.pauseTimer > 0) this.pauseTimer -= dt;
      else this.clock -= dt;
      const secs = Math.ceil(this.clock);
      if (secs <= 10 && secs > 0 && secs !== this.lastClockTick) { this.lastClockTick = secs; this.emit({ type: 'clockTick', n: secs }); }
    }

    // --- Tailwind boost
    const sc = this.score;
    if (!input.boost) this.boostLatch = false;
    let boosting = v.boosting;
    if (boosting && (!input.boost || sc.tailwind <= 0)) { boosting = false; this.emit({ type: 'boost', on: false }); if (sc.tailwind <= 0) this.boostLatch = true; }
    if (!boosting && input.boost && !this.boostLatch && sc.tailwind >= 0.12 && !v.airborne) { boosting = true; this.emit({ type: 'boost', on: true }); }
    if (boosting) sc.tailwind = Math.max(0, sc.tailwind - dt / RULES.tailwind.duration);
    const wasFull = sc.tailwind >= 0.999;

    // --- vehicle
    const vev: VehicleEvent[] = [];
    const px0 = v.x, pz0 = v.z;
    stepVehicle(v, this.spec, input, dt, this.world, boosting, vev);
    if (this.trip) { const d = Math.hypot(v.x - px0, v.z - pz0); this.trip.distance += d; }
    this.drivenMeters += Math.hypot(v.x - px0, v.z - pz0);
    for (const e of vev) this.onVehicleEvent(e);

    // --- traffic
    this.traffic.update(dt, { x: v.x, z: v.z, vx: v.vx, vz: v.vz, len: this.spec.length });
    for (const e of this.traffic.events) if (e.type === 'honk') this.emit({ type: 'honk' });
    this.collideTraffic();
    this.detectNearMiss(dt);

    // --- style detectors
    this.detectDrift(dt, vev);
    this.detectOncoming(dt);
    this.detectShortcuts();
    this.detectCleanSector(dt);
    this.collectTokens();

    // --- pulse decay / banking
    const banked = sc.tick(dt);
    if (banked > 0) this.emit({ type: 'bank', points: banked });
    if (!wasFull && sc.tailwind >= 0.999) this.emit({ type: 'tailwindReady' });

    // --- water, reset, stuck
    this.handleRespawns(input, dt);

    // --- fares
    this.updateFares(dt);

    // --- end of shift
    if (this.mode !== 'trial' && this.clock <= 0) this.handleClockZero(dt);
  }

  private onVehicleEvent(e: VehicleEvent): void {
    this.emit({ type: 'vehicle', ev: e });
    const S = RULES.style;
    switch (e.type) {
      case 'surge': this.style('tech', S.surge, 'SURGE START'); break;
      case 'snapDrift': this.driftAcc = 0; break;
      case 'gripTurn': this.style('tech', S.gripTurn, 'GRIP TURN'); break;
      case 'driftEnd': {
        if (e.clean && e.duration >= S.driftMinDuration && this.driftAcc > 10) {
          const base = Math.min(900, this.driftAcc);
          this.style('drift', base, 'DRIFT');
        }
        this.driftAcc = 0;
        break;
      }
      case 'collision': {
        const hard = e.impact >= RULES.collision.hardSpeed;
        this.onCollision(e.impact, e.tag, e.px, e.pz);
        void hard;
        break;
      }
      case 'landing': {
        if (e.airTime >= S.airtimeMin) {
          const good = e.align < 0.45;
          const base = (S.airtimeBase + S.airtimePerSecond * e.airTime) * (good ? 1 : 0.5);
          this.style('air', base, good ? 'AIRTIME' : 'SLOPPY LANDING');
        }
        break;
      }
      case 'splash': break;
      default: break;
    }
  }

  private onCollision(impact: number, tag: string, x: number, z: number): void {
    if (impact < 1.5) return;
    const hard = impact >= RULES.collision.hardSpeed;
    if (impact >= RULES.collision.minorSpeed) {
      this.collisions++;
      this.vehicle.damage = Math.min(1, this.vehicle.damage + impact * 0.012);
      const r = this.score.collide(impact);
      if (r !== 'none') this.emit({ type: 'chainLoss', mode: r });
      if (this.trip) this.trip.cleanSector = 0;
      this.bark('hit', 5);
    }
    this.emit({ type: 'collision', impact, tag, hard, x, z });
  }

  // ------------------------------------------------------------------ traffic collisions
  private collideTraffic(): void {
    const v = this.vehicle;
    const spec = this.spec;
    const [fx, fz] = forwardOf(v.h);
    const half = spec.length / 2 - 1.05 + 0.15;
    const offs = [half, 0, -half];
    const mp = spec.mass * spec.shove;
    for (const a of this.traffic.agents) {
      if (!a.alive) continue;
      if (Math.abs(a.x - v.x) > 9 || Math.abs(a.z - v.z) > 9) continue;
      const n = Math.max(2, Math.ceil(a.len / 2.6));
      const afx = Math.sin(a.h), afz = Math.cos(a.h);
      const rA = a.wid / 2 + 0.05;
      for (let k = 0; k < n; k++) {
        const o = (k / (n - 1) - 0.5) * (a.len - rA * 2);
        const ax = a.x + afx * o, az = a.z + afz * o;
        for (const po of offs) {
          const cx = v.x + fx * po, cz = v.z + fz * po;
          const dx = cx - ax, dz = cz - az;
          const dd = Math.hypot(dx, dz);
          const rr = 1.05 + rA;
          if (dd >= rr || dd < 1e-4) continue;
          const nx = dx / dd, nz = dz / dd;
          const pen = rr - dd;
          const avx = a.state === 'wreck' ? a.vx : afx * a.speed;
          const avz = a.state === 'wreck' ? a.vz : afz * a.speed;
          const vr = (v.vx - avx) * nx + (v.vz - avz) * nz;
          const ma = a.mass;
          const wP = ma / (mp + ma), wA = mp / (mp + ma);
          v.x += nx * pen * wP; v.z += nz * pen * wP;
          a.x -= nx * pen * wA; a.z -= nz * pen * wA;
          if (vr < 0) {
            const j = (-(1 + 0.35) * vr) / (1 / mp + 1 / ma);
            v.vx += (j / mp) * nx; v.vz += (j / mp) * nz;
            this.traffic.strike(a, (-j / ma) * nx, (-j / ma) * nz);
            a.yaw += clamp(((nx * afz - nz * afx) * -vr) * 0.05, -2, 2);
            const impact = -vr;
            v.yawRate += clamp((nx * fz - nz * fx) * impact * 0.02, -0.8, 0.8);
            if (impact > 1.5 && v.collideCd <= 0) {
              v.collideCd = 0.3;
              this.onCollision(impact, 'traffic', cx, cz);
            }
          } else if (a.state !== 'wreck') {
            this.traffic.strike(a, 0, 0);
          }
          this.nearCand.delete(a.id);
        }
      }
    }
  }

  private detectNearMiss(dt: number): void {
    const v = this.vehicle;
    const S = RULES.style;
    if (v.speed * 3.6 < S.nearMissSpeedKmh || v.airborne) { this.nearCand.clear(); return; }
    for (const a of this.traffic.agents) {
      if (!a.alive || a.state === 'wreck') continue;
      const d = Math.hypot(a.x - v.x, a.z - v.z);
      const thr = (a.wid + 1.9) / 2 + S.nearMissDist - 1.3;
      const lim = thr + (a.len > 6 ? 2.5 : 0);
      if (d > 14) { this.nearCand.delete(a.id); continue; }
      const prev = this.nearCand.get(a.id);
      if (d < lim) {
        this.nearCand.set(a.id, Math.min(prev ?? 99, d));
      } else if (prev !== undefined && d > lim + 0.6) {
        this.nearCand.delete(a.id);
        if (a.nearMissCd <= 0) {
          a.nearMissCd = S.nearMissCooldown;
          const tooClose = prev < (a.wid + 1.9) / 2 + 0.15;
          if (!tooClose) {
            const isNeedle = this.time - this.lastNearMiss < S.needleWindow;
            this.lastNearMiss = this.time;
            this.style('nearMiss', S.nearMiss, 'NEAR MISS');
            if (isNeedle) this.style('needle', S.needle, 'THREAD THE NEEDLE');
          }
        }
      }
    }
    void dt;
  }

  private detectDrift(dt: number, vev: VehicleEvent[]): void {
    void vev;
    const v = this.vehicle;
    const S = RULES.style;
    if (!v.drifting) return;
    const ang = Math.abs(v.driftAngle) * (180 / Math.PI);
    const kmh = v.speed * 3.6;
    if (kmh < S.driftMinSpeedKmh || ang < S.driftMinAngleDeg) return;
    const t = v.driftTime;
    const longPenalty = t > 6 ? 0.5 : 1; // anti-farm: very long drifts pay out less per second
    this.driftAcc += S.driftPerSecond * clamp(ang / 28, 0.4, 1.7) * clamp(kmh / 90, 0.5, 1.5) * longPenalty * dt;
  }

  private detectOncoming(dt: number): void {
    const v = this.vehicle;
    const S = RULES.style;
    if (v.airborne || v.speed * 3.6 < S.oncomingMinSpeedKmh) { this.oncomingAcc = Math.max(0, this.oncomingAcc - dt); return; }
    const info = this.world.roadInfo(v.x, v.z);
    if (!info.onRoad || info.intersection || !info.boulevard || !info.axis) { this.oncomingAcc = 0; return; }
    const [fx, fz] = forwardOf(v.h);
    const along = info.axis === 'z' ? fz : fx;
    const aligned = Math.abs(along) / Math.max(0.1, Math.hypot(fx, fz)) > 0.9 && Math.abs(v.fwd) > Math.abs(v.lat);
    if (!aligned || v.fwd < 0) { this.oncomingAcc = 0; return; }
    // right-hand traffic: southbound (+z) keeps to -x side, eastbound (+x) keeps to +z side
    const wrong = info.axis === 'z' ? (along > 0 ? info.lat > 1 : info.lat < -1) : (along > 0 ? info.lat < -1 : info.lat > 1);
    if (!wrong) { this.oncomingAcc = 0; return; }
    this.oncomingAcc += dt;
    if (this.oncomingAcc >= 1.0) {
      this.oncomingAcc = 0;
      this.style('oncoming', S.oncomingPerSecond, 'ONCOMING');
    }
  }

  private detectShortcuts(): void {
    const v = this.vehicle;
    if (v.airborne && v.y > 2.5) { /* still counts while flying a ramp shortcut */ }
    for (const s of this.world.shortcuts) {
      const dm = Math.hypot(v.x - s.mx, v.z - s.mz);
      if (dm > 170) continue;
      const ra = s.kind === 'terrace' || s.kind === 'dune' || s.kind === 'plaza' || s.kind === 'yard' ? 10 : 8;
      const st = this.scState.get(s.id);
      const da = Math.hypot(v.x - s.ax, v.z - s.az), db = Math.hypot(v.x - s.bx, v.z - s.bz);
      if (!st) {
        const towardB = (s.bx - s.ax) * v.vx + (s.bz - s.az) * v.vz;
        const L = Math.hypot(s.bx - s.ax, s.bz - s.az);
        if (da < ra && towardB / L > 3) this.scState.set(s.id, { end: 1, t: this.time, mid: false });
        else if (db < ra && -towardB / L > 3) this.scState.set(s.id, { end: 2, t: this.time, mid: false });
        continue;
      }
      if (this.time - st.t > 25) { this.scState.delete(s.id); continue; }
      if (!st.mid && dm < ra * 0.8) st.mid = true;
      const exitD = st.end === 1 ? db : da;
      if (st.mid && exitD < ra) {
        this.scState.delete(s.id);
        this.completeShortcut(s);
      }
    }
  }

  private completeShortcut(s: Shortcut): void {
    const key = String(s.id);
    const first = !this.discovered.has(key);
    this.shortcutsDone.add(key);
    this.style('shortcut', RULES.style.shortcut, s.name.toUpperCase());
    if (first) {
      this.discovered.add(key);
      this.newShortcuts++;
      if (this.trip) this.trip.discovery += RULES.style.shortcutFirst;
      else { this.total += RULES.style.shortcutFirst; }
    }
    this.emit({ type: 'shortcut', sc: s, first });
  }

  private detectCleanSector(dt: number): void {
    const t = this.trip;
    if (!t) return;
    const S = RULES.style;
    if (this.vehicle.speed * 3.6 >= S.cleanSectorSpeedKmh) {
      t.cleanSector += dt;
      if (t.cleanSector >= S.cleanSectorSeconds) {
        t.cleanSector = 0;
        this.style('clean', S.cleanSector, 'CLEAN SECTOR');
      }
    }
  }

  private collectTokens(): void {
    const v = this.vehicle;
    for (const t of this.world.tokens) {
      if (this.collected.has(t.id)) continue;
      if (Math.abs(t.x - v.x) > 4 || Math.abs(t.z - v.z) > 4) continue;
      if (Math.hypot(t.x - v.x, t.z - v.z) > 3.2 || v.y > 2) continue;
      if (t.kind === 'spark') {
        if (this.sparks >= 3) continue;
        this.sparks++;
        if (this.mode === 'arcade') { this.clock += 1; this.emit({ type: 'timeAdd', seconds: 1 }); }
      } else this.score.addTailwind(RULES.tailwind.tokenCharge);
      this.collected.add(t.id);
      this.emit({ type: 'token', kind: t.kind });
    }
  }

  // ------------------------------------------------------------------ respawn / reset
  private placeAt(pose: { x: number; z: number; heading: number }, reason: 'water' | 'reset'): void {
    const v = this.vehicle;
    v.x = v.px = pose.x; v.z = v.pz = pose.z; v.h = v.ph = pose.heading;
    v.vx = v.vz = 0; v.yawRate = 0; v.y = v.py = 0; v.vy = 0; v.airborne = false; v.drifting = false;
    v.steer = 0; v.pitch = 0; v.roll = 0; v.boosting = false;
    v.prevGroundH = 0; v.lastRamp = -1;
    // clear traffic from the spot
    for (const a of this.traffic.agents) if (dist(a.x, a.z, pose.x, pose.z) < 8) a.alive = false;
    this.traffic.agents = this.traffic.agents.filter((a) => a.alive);
    const pen = reason === 'water' ? RULES.penalties.water : RULES.penalties.reset;
    if (this.mode === 'arcade' || this.mode === 'quick') this.clock -= pen;
    else this.time += pen;
    this.total = Math.max(0, this.total - RULES.penalties.resetPoints);
    this.score.bank();
    this.emit({ type: 'respawn', reason });
  }

  private handleRespawns(input: SimInput, dt: number): void {
    const v = this.vehicle;
    if (this.world.isWater(v.x, v.z) && v.y < 0.5) {
      this.placeAt(this.world.roadPose(Math.min(v.x, this.world.xs[this.world.cols - 1] - 40), Math.min(v.z, this.world.zs[this.world.rows - 1] - 30)), 'water');
      return;
    }
    // stuck detection -> hint
    if (v.speed < 1.2 && (this.trip || this.fares.candidates.length)) this.stuckTimer += dt; else this.stuckTimer = 0;
    if (this.stuckTimer > 4 && Math.floor(this.stuckTimer * 4) % 40 === 0 && this.stuckTimer < 4.05) this.emit({ type: 'hint', text: 'Stuck? Hold R to reset (costs time and points)' });
    if (input.resetHeld) {
      this.resetHold += dt;
      if (this.resetHold >= 1.0) {
        this.resetHold = 0;
        this.placeAt(this.world.roadPose(v.x, v.z), 'reset');
      }
    } else this.resetHold = 0;
  }
  get resetProgress(): number {
    return clamp(this.resetHold / 1.0, 0, 1);
  }

  // ------------------------------------------------------------------ fares
  private updateFares(dt: number): void {
    const v = this.vehicle;
    const w = this.world;
    this.refillCd -= dt;
    if (!this.trip) {
      if (this.refillCd <= 0 && this.mode !== 'trial') {
        const had = this.fares.candidates.length;
        this.fares.refill(v.x, v.z);
        if (this.fares.candidates.length !== had) this.emit({ type: 'candidates' });
        this.refillCd = 1.0;
      }
      for (const f of this.fares.candidates) f.age += dt;
      // pickup logic
      for (const f of this.fares.candidates) {
        const d = dist(v.x, v.z, f.pickup.x, f.pickup.z);
        const kmh = v.speed * 3.6;
        const armed = this.pickupArmed.get(f.id) ?? false;
        if (d < RULES.pickup.ringVisual + 1 && kmh <= RULES.pickup.enterSpeedKmh && !armed) this.pickupArmed.set(f.id, true);
        if (d > RULES.pickup.ringVisual + 6) this.pickupArmed.set(f.id, false);
        if (d <= RULES.pickup.radius && kmh <= RULES.pickup.stopSpeedKmh && !v.airborne) {
          this.board(f, armed && d <= RULES.pickup.cleanRadius);
          break;
        }
      }
      return;
    }
    // riding
    const t = this.trip;
    t.time += dt;
    const left = t.fare.limit - t.time;
    if (!t.urgent && left < t.fare.limit * 0.2 && left > 0) { t.urgent = true; this.bark('urgent', 3); }
    if (left <= 0) {
      t.graceOn = true;
      t.grace -= dt;
    }
    const d = dist(v.x, v.z, t.fare.dest.x, t.fare.dest.z);
    // scenic landmark tracking (tourist preference)
    for (const dd of w.destinations) {
      if (dd.id === t.fare.dest.id) continue;
      if (Math.abs(dd.x - v.x) < 40 && Math.abs(dd.z - v.z) < 40) this.score.trip.landmarks.add(dd.id);
    }
    if (d <= t.fare.dest.radius && v.speed * 3.6 <= RULES.delivery.stopSpeedKmh && !v.airborne) {
      this.deliver();
      return;
    }
    if (t.graceOn && t.grace <= 0) {
      // patience gone and the 2 s personal grace is over -> failed
      this.failFare();
    }
  }

  private board(f: Fare, clean: boolean): void {
    this.fares.take(f);
    this.trip = { fare: f, time: clean ? 0 : RULES.pickup.roughPatiencePenalty, distance: 0, discovery: 0, urgent: false, grace: 2, graceOn: false, cleanSector: 0, boardedClean: clean };
    this.score.resetTrip();
    this.pauseTimer = RULES.boardingPause;
    this.fares.clear();
    this.pickupArmed.clear();
    this.emit({ type: 'boarded', fare: f, clean });
    if (clean) this.style('precision', RULES.style.pickupClean, 'CLEAN STOP');
    this.bark('pickup', 0);
    this.emit({ type: 'candidates' });
  }

  private failFare(): void {
    const t = this.trip!;
    this.emit({ type: 'fareFailed', fare: t.fare });
    this.bark('fail', 0);
    this.failed++;
    const banked = this.score.bank();
    if (banked > 0) this.emit({ type: 'bank', points: banked });
    this.score.resetTrip();
    this.trip = null;
    this.afterTrip();
  }

  private afterTrip(): void {
    const v = this.vehicle;
    if (this.mode === 'trial') {
      this.trialIndex++;
      if (this.trialIndex >= this.trialChain.length) { this.finish('chain complete'); return; }
      this.showTrialFare();
    } else {
      this.fares.refill(v.x, v.z);
    }
    this.emit({ type: 'candidates' });
  }

  private deliver(): void {
    const t = this.trip!;
    const f = t.fare;
    const v = this.vehicle;
    const sc = this.score;
    const banked = sc.bank();
    if (banked > 0) this.emit({ type: 'bank', points: banked });
    const frac = (f.limit - t.time) / f.limit;
    let grade: Grade;
    if (frac >= RULES.grade.blazing) grade = 'blazing';
    else if (frac >= RULES.grade.fast) grade = 'fast';
    else if (frac > RULES.grade.close) grade = 'close';
    else grade = 'late';
    const d = dist(v.x, v.z, f.dest.x, f.dest.z);
    const precise = d <= RULES.delivery.cleanRadius && v.speed * 3.6 <= 4;
    const arch = ARCHETYPES[f.archetype];

    let timeBonus = frac > 0 ? Math.round(RULES.timeBonusMax * clamp(frac, 0, 1)) : 0;
    let tips = sc.bankedTips;
    let pref = 0;
    let prefLabel = '';
    const tr = sc.trip;
    switch (arch.pref) {
      case 'thrill': pref = Math.round(0.3 * (tr.drift + tr.air)); prefLabel = 'Thrill bonus'; break;
      case 'fragile': pref = tr.collisions === 0 ? 150 + Math.round(0.15 * tips) : -Math.round(Math.min(0.4, 0.1 * tr.collisions) * tips); prefLabel = tr.collisions === 0 ? 'Gentle ride' : 'Bumpy ride'; break;
      case 'tourist': pref = 120 * Math.min(4, tr.landmarks.size); prefLabel = 'Scenic route'; break;
      case 'late': timeBonus = Math.round(timeBonus * 1.35); prefLabel = 'Punctual bonus'; break;
      case 'musician': pref = tr.bestTier >= 2 ? Math.round(0.25 * tips) : 0; prefLabel = 'Rhythm bonus'; break;
      case 'chill': pref = tr.collisions === 0 ? 150 : 0; prefLabel = 'Calm ride'; break;
      case 'foodie': pref = tr.collisions <= 1 ? Math.round(0.15 * tips) + 60 : 0; prefLabel = 'Spill-free'; break;
      case 'racer': pref = grade === 'blazing' ? Math.round(0.25 * tips) + 100 : 0; prefLabel = 'Racer respect'; break;
    }
    const accuracy = precise ? RULES.style.precisionStop : d <= 5.5 ? 100 : 0;
    if (precise) this.emit({ type: 'style', category: 'precision', label: 'PRECISION STOP', points: RULES.style.precisionStop, mult: 1 });
    const total = f.base + timeBonus + tips + pref + accuracy + t.discovery;
    let secs = 0;
    if (this.mode === 'arcade') {
      secs = Math.round(f.par * RULES.gradeTimeFactor[grade] + RULES.tierTimeBonus[f.tier]);
      secs = Math.min(RULES.maxDeliveryAward, secs);
      this.clock += secs;
      this.emit({ type: 'timeAdd', seconds: secs });
    }
    this.total += total;
    this.fareTotal += f.base;
    this.timeBonusTotal += secs;
    this.deliveries++;
    this.pathMeters += f.pathLen;
    this.drivenMeters = this.drivenMeters; // unchanged; efficiency uses trip distances below
    this.tripDrivenSum += t.distance;
    this.tipsSum += tips + pref;
    this.pauseTimer = RULES.boardingPause;
    sc.addTailwind(grade === 'blazing' ? 0.45 : grade === 'fast' ? 0.3 : 0.15);
    if (this.vehicle.damage > 0) this.vehicle.damage = 0; // repair flash
    const breakdown: Breakdown = { base: f.base, timeBonus, tips, prefBonus: pref, prefLabel, accuracy, discovery: t.discovery, total, grade, shiftSeconds: secs, fraction: frac, par: f.par, tripTime: t.time, tier: f.tier, precise };
    this.emit({ type: 'delivered', fare: f, breakdown });
    this.bark('arrive', 0);
    sc.resetTrip();
    this.trip = null;
    this.endGrace = -1;
    this.afterTrip();
  }
  tripDrivenSum = 0;
  tipsSum = 0;

  private handleClockZero(dt: number): void {
    const v = this.vehicle;
    if (this.phase !== 'running') return;
    if (this.trip) {
      const d = dist(v.x, v.z, this.trip.fare.dest.x, this.trip.fare.dest.z);
      if (this.endGrace < 0 && d <= this.trip.fare.dest.radius + 6) this.endGrace = RULES.endGrace;
    }
    if (this.endGrace >= 0) {
      this.endGrace -= dt;
      if (this.endGrace > 0 || this.clock > 0) return;
    }
    if (this.clock <= 0) this.finish('time up');
  }

  finish(reason: string): void {
    if (this.phase === 'ended') return;
    const banked = this.score.bank();
    if (banked > 0) { this.emit({ type: 'bank', points: banked }); }
    this.total += this.trip ? 0 : 0;
    this.phase = 'ended';
    const eff = this.tripDrivenSum > 0 ? clamp((this.pathMeters / this.tripDrivenSum) * 100, 0, 160) : 0;
    let medal: Results['medal'];
    if (this.mode === 'trial') {
      const m = RULES.trialMedals;
      medal = this.time <= m.gold ? 'gold' : this.time <= m.silver ? 'silver' : this.time <= m.bronze ? 'bronze' : 'none';
    }
    this.result = {
      score: Math.round(this.total), deliveries: this.deliveries, fares: this.fareTotal, tips: this.tipsSum, timeBonuses: this.timeBonusTotal,
      bestPulse: RULES.pulse.mults[this.score.bestTier], bestChain: this.score.bestChain, collisions: this.collisions,
      shortcuts: this.shortcutsDone.size, newShortcuts: this.newShortcuts, efficiency: Math.round(eff), rank: rankFor(this.total),
      mode: this.mode, taxi: this.spec.name, time: this.time, failed: this.failed, medal,
    };
    this.emit({ type: 'ended', reason });
  }

  // ------------------------------------------------------------------ queries for UI
  /** pending tips (banked + live chain), shown next to the score */
  get liveTips(): number {
    return this.score.pending;
  }
  get displayScore(): number {
    return Math.round(this.total);
  }

  /** target for the guidance arrow */
  guidance(direct = false): { x: number; z: number; label: string; kind: 'dest' | 'pickup' } | null {
    const v = this.vehicle;
    if (this.trip) {
      const dest = this.trip.fare.dest;
      const d = dist(v.x, v.z, dest.x, dest.z);
      if (direct || d < 60) return { x: dest.x, z: dest.z, label: dest.name, kind: 'dest' };
      const hop = this.world.nextHop(v.x, v.z, dest.point);
      return { x: hop.x, z: hop.z, label: dest.name, kind: 'dest' };
    }
    let best: Fare | null = null, bd = 1e9;
    for (const f of this.fares.candidates) {
      const d = dist(v.x, v.z, f.pickup.x, f.pickup.z);
      if (d < bd) { bd = d; best = f; }
    }
    if (!best) return null;
    return { x: best.pickup.x, z: best.pickup.z, label: 'Nearest fare', kind: 'pickup' };
  }

  stateHash(): number {
    const v = this.vehicle;
    let h = 2166136261;
    const mix = (n: number) => { h ^= Math.round(n * 1000) | 0; h = Math.imul(h, 16777619) >>> 0; };
    mix(v.x); mix(v.z); mix(v.h); mix(v.vx); mix(v.vz); mix(this.total); mix(this.clock); mix(this.deliveries);
    mix(this.traffic.agents.length);
    for (const a of this.traffic.agents) { mix(a.x); mix(a.z); }
    return h >>> 0;
  }

  /** make a new fare directly (tests / tools) */
  static fareFromPoints(world: World, pickup: Fare['pickup'], destId: number, archetype = 0): Fare {
    const dest = world.destinations[destId];
    const L = world.pathLength(pickup, dest.point);
    const par = parFor(L);
    const tier = tierFor(par);
    return { id: 9000 + destId, archetype, pickup, dest, tier, par, limit: Math.round(par * RULES.patienceFactor), pathLen: L, base: baseFareFor(tier, L), age: 0 };
  }
}

export type { Agent };
