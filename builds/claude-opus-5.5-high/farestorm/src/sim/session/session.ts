// GameSession: the fixed-step heart of Farestorm. Consumes InputFrames, advances vehicle, traffic,
// pedestrians, fares, scoring and the shift clock, and emits typed GameEvents for UI/audio/render.
// Score rules only consume gameplay/physics events here, never render transforms.

import { clamp, dist, hashNumbers, KMH, segmentsCross, wrapAngle } from "../math";
import { Rng } from "../rng";
import { ARCHETYPES, BARKS, type BarkCat, type Preference } from "../fares/archetypes";
import { buildTrialChain, FareManager, SPECIAL_LABEL, TRIALS, trialMedals, type Fare, type SpecialCond } from "../fares/fares";
import {
  fareBreakdown, gradeFor, PERSONAL_GRACE, Pulse, rankFor, RULES_VERSION, shiftAward, STYLE_LABEL, Tailwind,
  type FareBreakdown, type Grade, type Rank, type StyleKind,
} from "../score/score";
import { Pedestrians } from "../traffic/peds";
import { Traffic, TRAFFIC_TYPES } from "../traffic/traffic";
import { quantizeInput, type InputFrame, packInput } from "../vehicle/input";
import { taxiById, type TaxiSpec } from "../vehicle/taxis";
import {
  createVehicle, DEFAULT_VEHICLE_OPTIONS, driftAngle, DT, obbOverlap, speedOf, stepVehicle,
  type VehicleEvent, type VehicleOptions, type VehicleState,
} from "../vehicle/vehicle";
import type { World } from "../world/city";
import { LESSONS, type Lesson } from "./lessons";

export type Mode = "arcade" | "quick" | "trial" | "school";

export interface SessionConfig {
  mode: Mode;
  taxi: string;
  seed: number;
  traffic: "low" | "medium" | "high";
  crowd: number; // 0..1
  trial?: number;
  lesson?: number;
  hub?: number;
  discovered?: string[];
  vehicle?: Partial<VehicleOptions>;
  guidance?: "road" | "bearing";
}

export type GameEvent =
  | { type: "go" }
  | { type: "countdown"; n: number }
  | { type: "style"; kind: StyleKind; label: string; points: number; mult: number }
  | { type: "tierUp"; tier: number; mult: number }
  | { type: "chainEnd"; points: number; count: number }
  | { type: "chainDrop"; reset: boolean }
  | { type: "pickup"; fare: Fare; clean: boolean; rough: boolean }
  | { type: "deliver"; fare: Fare; grade: Grade; breakdown: FareBreakdown; timeAward: number; precise: boolean; special: boolean }
  | { type: "fareFail"; fare: Fare }
  | { type: "collision"; impact: number; x: number; z: number; traffic: boolean }
  | { type: "bark"; text: string; archetype: number; cat: BarkCat }
  | { type: "shortcut"; id: string; name: string; first: boolean }
  | { type: "shortcutEnter"; id: string; name: string }
  | { type: "item"; kind: "token" | "spark" | "repair"; x: number; z: number }
  | { type: "boost"; on: boolean }
  | { type: "surge" } | { type: "snapDrift" } | { type: "gripTurn" } | { type: "takeoff" }
  | { type: "land"; airTime: number; impact: number }
  | { type: "splash"; x: number; z: number }
  | { type: "reset"; penalty: number }
  | { type: "pedDodge"; x: number; z: number } | { type: "pedPenalty" }
  | { type: "prop"; x: number; z: number }
  | { type: "clockLow"; seconds: number }
  | { type: "lessonProgress"; text: string }
  | { type: "lessonDone" }
  | { type: "end" };

export interface ActiveFare {
  fare: Fare;
  elapsed: number;
  patience: number;
  tips: number;
  collisions: number;
  shortcuts: number;
  discoveryBonus: number;
  maxAir: number;
  scenic: number[];
  driven: number;
  boardT: number;
  urgent: boolean;
}

export interface Results {
  mode: Mode;
  score: number;
  fares: number;
  tips: number;
  timeBonus: number;
  deliveries: number;
  failed: number;
  bestChain: number;
  collisions: number;
  shortcutsRun: number;
  newDiscoveries: string[];
  routeEfficiency: number;
  rank: Rank | null;
  duration: number;
  trialTime?: number;
  medal?: "gold" | "silver" | "bronze" | null;
  medals?: { gold: number; silver: number; bronze: number };
  lessonDone?: boolean;
  grades: Grade[];
  rulesVersion: number;
  taxi: string;
  seed: number;
}

interface PropState { x: number; z: number; y: number; ox: number; oz: number; vx: number; vy: number; vz: number; yaw: number; spin: number; hit: boolean; t: number; kind: string }

const DENSITY = { low: 26, medium: 40, high: 54 };

export class Session {
  readonly cfg: SessionConfig;
  readonly taxi: TaxiSpec;
  readonly opts: VehicleOptions;
  v: VehicleState;
  prev = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0 };
  traffic: Traffic;
  peds: Pedestrians;
  fares: FareManager;
  pulse = new Pulse();
  tailwind = new Tailwind();
  rng: Rng;
  events: GameEvent[] = [];

  tick = 0;
  playTicks = 0;
  time = 0;
  phase: "countdown" | "play" | "done" = "countdown";
  countdown = 1.8;
  clock = 60;
  clockPause = 0;
  grace = -1;
  trialTime = 0;
  score = 0;
  active: ActiveFare | null = null;
  lastLanded = 0;
  stats = { fares: 0, tips: 0, timeBonus: 0, deliveries: 0, failed: 0, collisions: 0, shortcutsRun: 0, routeLegal: 0, routeDriven: 0, grades: [] as Grade[] };
  discovered: Set<string>;
  newDiscoveries: string[] = [];
  results: Results | null = null;

  // detectors
  private driftPts = 0;
  private oncomingTime = 0;
  private oncomingPts = 0;
  oncomingActive = false;
  private cleanTime = 0;
  private lastNearMiss = -10;
  private collisionCooldown = 0;
  private resetHold = 0;
  private voidTimer = 0;
  private pedCooldown = 0;
  private barkCooldown = 0;
  private specialPending: SpecialCond | null = null;
  shortcutState: Map<string, { from: "A" | "B"; t: number }> = new Map();
  specialOk = { collision: true, shortcut: false, air: false };
  sparks = 0;
  collected = new Set<number>();
  props: PropState[] = [];
  route: [number, number][] = [];
  routeTarget: [number, number] | null = null;
  arrow: [number, number] | null = null;
  private routeTimer = 0;
  private clockLowSent = 99;

  // trial / school
  trialChain: Fare[] = [];
  trialIndex = 0;
  medals: { gold: number; silver: number; bronze: number } | null = null;
  lesson: Lesson | null = null;
  lessonCount = 0;
  lessonReached = false;
  lessonDoneT = -1;
  lessonMsg = "";

  // recording
  inputs: number[] = [];
  ghost: number[] = [];

  constructor(readonly world: World, cfg: SessionConfig) {
    this.cfg = cfg;
    this.taxi = taxiById(cfg.taxi);
    this.opts = { ...DEFAULT_VEHICLE_OPTIONS, ...(cfg.vehicle ?? {}) };
    this.rng = new Rng(cfg.seed);
    this.discovered = new Set(cfg.discovered ?? []);
    let spawn = world.hubs[(cfg.hub ?? cfg.seed) % world.hubs.length];
    if (cfg.mode === "trial") spawn = world.hubs[TRIALS[cfg.trial ?? 0].hub];
    if (cfg.mode === "school") {
      this.lesson = LESSONS[cfg.lesson ?? 0];
      if (this.lesson.goal.kind !== "fare") spawn = { name: "lesson", ...this.lesson.spawn };
      else spawn = world.hubs[1];
    }
    this.v = createVehicle(spawn.x, spawn.z, spawn.yaw, world);
    this.savePrev();
    this.traffic = new Traffic(world, cfg.seed * 13 + 7);
    this.traffic.target = DENSITY[cfg.traffic];
    if (cfg.mode === "school" && this.lesson && this.lesson.goal.kind !== "event") this.traffic.target = Math.round(this.traffic.target * 0.5);
    this.traffic.fill(this.v.x, this.v.z, this.v.yaw);
    this.peds = new Pedestrians(world, cfg.seed * 3 + 1);
    this.peds.target = Math.round(60 * clamp(cfg.crowd, 0, 1));
    this.peds.fill(this.v.x, this.v.z);
    this.fares = new FareManager(world, cfg.seed * 17 + 3);
    this.props = world.props.map((p) => ({ x: p.x, z: p.z, y: world.heightAt(p.x, p.z), ox: p.x, oz: p.z, vx: 0, vy: 0, vz: 0, yaw: p.yaw, spin: 0, hit: false, t: 0, kind: p.kind }));

    if (cfg.mode === "arcade") this.clock = 60;
    else if (cfg.mode === "quick") this.clock = 300;
    else this.clock = 0;
    if (cfg.mode === "trial") {
      const t = TRIALS[cfg.trial ?? 0];
      this.trialChain = buildTrialChain(world, t);
      this.medals = trialMedals(world, t, this.trialChain);
      this.fares.candidates = [this.trialChain[0]];
    } else if (cfg.mode === "school") {
      if (this.lesson?.goal.kind === "fare") {
        const f = this.fares.spawn(this.v.x, this.v.z, "short");
        if (f) this.fares.candidates = [f];
      }
    } else {
      this.fares.maintain(this.v.x, this.v.z, null);
    }
    this.updateRoute(true);
  }

  get speed(): number { return speedOf(this.v); }
  get kmh(): number { return speedOf(this.v) * KMH; }
  get usesClock(): boolean { return this.cfg.mode === "arcade" || this.cfg.mode === "quick"; }

  drain(): GameEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }

  private savePrev() {
    this.prev.x = this.v.x; this.prev.y = this.v.y; this.prev.z = this.v.z;
    this.prev.yaw = this.v.yaw; this.prev.pitch = this.v.pitch; this.prev.roll = this.v.roll;
  }

  private emit(e: GameEvent) {
    this.events.push(e);
    if (this.events.length > 400) this.events.shift();
  }

  // ------------------------------------------------------------------ step
  step(raw: InputFrame) {
    if (this.phase === "done") return;
    const inp = quantizeInput(raw);
    this.tick++;
    this.time += DT;
    this.savePrev();
    const playerInfo = this.playerInfo(inp.horn);
    if (this.phase === "countdown") {
      const before = Math.ceil(this.countdown / 0.6);
      this.countdown -= DT;
      const after = Math.ceil(this.countdown / 0.6);
      if (after !== before && after > 0) this.emit({ type: "countdown", n: after });
      this.traffic.step(DT, playerInfo);
      if (this.countdown <= 0) {
        this.phase = "play";
        this.emit({ type: "go" });
      }
      return;
    }
    this.inputs.push(packInput(inp));
    if (this.playTicks % 6 === 0) this.ghost.push(this.v.x, this.v.y, this.v.z, this.v.yaw);
    this.playTicks++;

    if (this.collisionCooldown > 0) this.collisionCooldown -= DT;
    if (this.pedCooldown > 0) this.pedCooldown -= DT;
    if (this.barkCooldown > 0) this.barkCooldown -= DT;

    // --- reset / void
    if (this.voidTimer > 0) {
      this.voidTimer -= DT;
      this.v.vx *= 0.9; this.v.vz *= 0.9; this.v.vy = -1.5; this.v.y -= 1.5 * DT;
      if (this.voidTimer <= 0) this.doReset();
      this.stepWorld(inp, playerInfo);
      this.stepClock();
      return;
    }
    this.resetHold = inp.reset ? this.resetHold + DT : 0;
    if (this.resetHold >= 0.6) {
      this.resetHold = -10; // require release
      this.doReset();
    }

    // --- Tailwind
    const tw = this.tailwind.step(DT, inp.boost);
    if (tw) this.emit({ type: "boost", on: tw === "start" });
    this.v.boosting = this.tailwind.active;

    // --- vehicle
    const vev: VehicleEvent[] = [];
    const px = this.v.x, pz = this.v.z;
    stepVehicle(this.v, inp, this.taxi, this.world, this.opts, vev);
    this.handleVehicleEvents(vev);
    if (this.v.drifting) {
      const sp = this.speed;
      if (sp > 9) this.driftPts += sp * Math.abs(Math.sin(driftAngle(this.v))) * DT * 16;
      this.pulse.idle = Math.min(this.pulse.idle, 1.0);
    }
    if (this.active) this.active.driven += dist(px, pz, this.v.x, this.v.z);

    this.stepWorld(inp, playerInfo);
    this.detectOncoming();
    this.detectShortcuts(px, pz);
    this.detectCleanSector();
    this.stepItems();
    this.stepProps();
    this.stepFares(inp);
    if (this.pulse.step(DT)) {
      this.emit({ type: "chainEnd", points: 0, count: 0 });
    }
    this.stepClock();
    this.routeTimer -= DT;
    if (this.routeTimer <= 0) this.updateRoute(false);
    this.updateArrow();
    if (this.lesson) this.checkLesson();
  }

  private playerInfo(horn: boolean) {
    return { x: this.v.x, z: this.v.z, yaw: this.v.yaw, vx: this.v.vx, vz: this.v.vz, len: this.taxi.length, wid: this.taxi.width, horn };
  }

  private stepWorld(_inp: InputFrame, playerInfo: ReturnType<Session["playerInfo"]>) {
    this.traffic.step(DT, playerInfo);
    this.trafficContacts();
    const sp = this.speed;
    const danger = this.peds.step(DT, { x: this.v.x, z: this.v.z, vx: this.v.vx, vz: this.v.vz, speed: sp }, (p) => {
      this.emit({ type: "pedDodge", x: p.x, z: p.z });
    });
    // Pedestrian safety assist: non-scoring brake + gentle deflection, plus a penalty for real risk.
    if (danger < 5 && sp > 4) {
      const k = 1 - 1.6 * DT;
      this.v.vx *= k;
      this.v.vz *= k;
      if (danger < 2 && this.pedCooldown <= 0 && sp > 6) {
        this.pedCooldown = 2.5;
        this.score = Math.max(0, this.score - 150);
        if (this.usesClock) this.clock = Math.max(0, this.clock - 1);
        this.pulse.collide(false);
        this.emit({ type: "pedPenalty" });
      }
    }
  }

  // ------------------------------------------------------------------ style
  private prefMul(kind: StyleKind): number {
    if (!this.active) return 1;
    const pref = ARCHETYPES[this.active.fare.archetype].pref;
    const table: Partial<Record<Preference, Partial<Record<StyleKind, number>>>> = {
      thrill: { drift: 1.6, air: 1.6 },
      calm: { air: 0.5, nearMiss: 0.5, oncoming: 0.5, thread: 0.5 },
      nightowl: { nearMiss: 1.6, thread: 1.6, oncoming: 1.6 },
      shortcut: { shortcut: 2 },
    };
    return table[pref]?.[kind] ?? 1;
  }

  award(kind: StyleKind, base: number) {
    base = Math.round(base);
    if (base <= 0) return;
    const res = this.pulse.add(kind, base);
    const pts = Math.round(res.points * this.prefMul(kind));
    if (this.active) this.active.tips += pts;
    else this.score += pts;
    this.stats.tips += pts;
    this.tailwind.charge((base / 2600) * res.factor);
    this.emit({ type: "style", kind, label: STYLE_LABEL[kind], points: pts, mult: res.mult });
    if (res.tierUp) this.emit({ type: "tierUp", tier: this.pulse.tier, mult: this.pulse.mult });
    if (this.active && this.rng.chance(kind === "drift" || kind === "air" || kind === "shortcut" ? 0.55 : 0.25)) this.bark(kind === "shortcut" && this.prefOf() === "shortcut" ? "praise" : "stunt");
  }

  private prefOf(): Preference | null {
    return this.active ? ARCHETYPES[this.active.fare.archetype].pref : null;
  }

  bark(cat: BarkCat, force = false) {
    if (!this.active && !force) return;
    if (this.barkCooldown > 0 && !force) return;
    const arch = ARCHETYPES[(this.active ?? { fare: { archetype: 0 } }).fare.archetype];
    const lines = cat === "pickup" && this.rng.chance(0.5) ? [arch.greet] : BARKS[arch.pref][cat];
    this.emit({ type: "bark", text: this.rng.pick(lines), archetype: arch.id, cat });
    this.barkCooldown = cat === "collision" ? 3 : 4.5;
  }

  private handleVehicleEvents(vev: VehicleEvent[]) {
    for (const e of vev) {
      switch (e.type) {
        case "surge": this.emit({ type: "surge" }); this.award("surge", 150); this.lessonEvent("surge"); break;
        case "snapDrift": this.driftPts = 0; this.emit({ type: "snapDrift" }); break;
        case "gripTurn": this.emit({ type: "gripTurn" }); this.award("gripTurn", 200); this.lessonEvent("gripTurn"); break;
        case "driftEnd":
          if (e.clean && e.time >= 0.6 && this.driftPts > 60) this.award("drift", this.driftPts);
          if (this.lesson?.goal.kind === "drift" && e.clean && e.time >= this.lesson.goal.seconds) this.completeLesson();
          else if (this.lesson?.goal.kind === "drift" && e.time > 0.3) this.lessonMsg = `Drift held ${e.time.toFixed(1)} s, need ${this.lesson.goal.seconds} s`;
          this.driftPts = 0;
          break;
        case "takeoff": this.emit({ type: "takeoff" }); break;
        case "land": {
          this.emit({ type: "land", airTime: e.airTime, impact: e.impact });
          if (e.airTime >= 0.45 && this.time - this.lastLanded > 0.3) {
            this.award("air", 260 * e.airTime + (e.aligned ? 150 : 0) + Math.min(10, e.height) * 25);
            if (this.active) {
              this.active.maxAir = Math.max(this.active.maxAir, e.airTime);
              if (e.airTime >= 0.9) this.specialOk.air = true;
            }
          }
          if (this.lesson?.goal.kind === "air") {
            if (e.airTime >= this.lesson.goal.seconds) this.completeLesson();
            else if (e.airTime > 0.2) this.lessonMsg = `Airtime ${e.airTime.toFixed(2)} s, need ${this.lesson.goal.seconds} s`;
          }
          this.lastLanded = this.time;
          break;
        }
        case "collision": this.onCollision(e.impact, e.x, e.z, false); break;
        case "splash":
          if (this.voidTimer <= 0) {
            this.voidTimer = 1.0;
            this.emit({ type: "splash", x: this.v.x, z: this.v.z });
          }
          break;
      }
    }
  }

  private onCollision(impact: number, x: number, z: number, traffic: boolean) {
    this.emit({ type: "collision", impact, x, z, traffic });
    if (impact < 3.5 || this.collisionCooldown > 0) return;
    this.collisionCooldown = 0.6;
    const hard = impact > 13;
    const r = this.pulse.collide(hard);
    if (r !== "none") this.emit({ type: "chainDrop", reset: r === "reset" });
    this.stats.collisions++;
    this.cleanTime = 0;
    this.driftPts = 0;
    if (this.active) {
      this.active.collisions++;
      this.specialOk.collision = false;
      if (this.prefOf() === "fragile") this.active.tips = Math.max(0, this.active.tips - 150);
      this.bark("collision");
    }
  }

  // ------------------------------------------------------------------ traffic contact + near misses
  private ov = { depth: 0, nx: 0, nz: 0, sep: 0 };
  private trafficContacts() {
    const v = this.v, t = this.taxi;
    const sp = this.speed;
    for (const a of this.traffic.agents) {
      if (!a.active) continue;
      const d = dist(a.x, a.z, v.x, v.z);
      if (d > 16) {
        if (d > 25) { a.nearArmed = false; a.nearTouched = false; }
        continue;
      }
      const T = TRAFFIC_TYPES[a.type];
      if (v.y > a.y + T.height || v.y + t.height < a.y) {
        continue; // flying over
      }
      const hit = obbOverlap(v.x, v.z, t.width / 2, t.length / 2, v.yaw, a.x, a.z, T.wid / 2, T.len / 2, a.yaw, this.ov);
      const avx = a.mode === "knocked" ? a.vx : Math.sin(a.yaw) * a.speed;
      const avz = a.mode === "knocked" ? a.vz : Math.cos(a.yaw) * a.speed;
      if (hit) {
        a.nearTouched = true;
        const n = this.ov;
        const mP = t.mass * t.shove, mA = T.mass;
        const wP = mA / (mP + mA), wA = mP / (mP + mA);
        v.x += n.nx * n.depth * wP;
        v.z += n.nz * n.depth * wP;
        const rvx = v.vx - avx, rvz = v.vz - avz;
        const vn = rvx * n.nx + rvz * n.nz;
        if (vn < 0) {
          const j = (-(1 + 0.3) * vn) / (1 / mP + 1 / mA);
          v.vx += (j / mP) * n.nx;
          v.vz += (j / mP) * n.nz;
          const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw);
          const side = fx * n.nz - fz * n.nx;
          v.yawRate = clamp(v.yawRate + clamp(-vn * 0.03 * side, -1, 1), -3, 3);
          const spin = clamp((rvx * n.nz - rvz * n.nx) * 0.05, -1.5, 1.5);
          this.traffic.knock(a, -(j / mA) * n.nx - n.nx * n.depth * wA * 5, -(j / mA) * n.nz - n.nz * n.depth * wA * 5, spin);
          a.x -= n.nx * n.depth * wA;
          a.z -= n.nz * n.depth * wA;
          if (-vn > 1.5) this.onCollision(-vn, (v.x + a.x) / 2, (v.z + a.z) / 2, true);
          if (v.drifting) { v.drifting = false; this.driftPts = 0; }
        }
        continue;
      }
      // near miss
      if (a.nearCooldown > 0) continue;
      const rel = Math.hypot(v.vx - avx, v.vz - avz);
      const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw);
      const along = (a.x - v.x) * fx + (a.z - v.z) * fz;
      if (sp > 13.9 && rel > 5 && this.ov.sep < 1.5 && this.ov.sep > 0) {
        if (!a.nearArmed) a.nearMin = 99;
        a.nearArmed = true;
        a.nearMin = Math.min(a.nearMin, this.ov.sep);
      } else if (a.nearArmed && (this.ov.sep > 3 || along < -(T.len + t.length) / 2)) {
        a.nearArmed = false;
        if (!a.nearTouched) {
          a.nearCooldown = 3;
          const pts = 150 + (1.5 - a.nearMin) * 120 + Math.min(40, rel) * 4;
          this.award("nearMiss", pts);
          this.lessonEvent("nearMiss");
          if (this.time - this.lastNearMiss < 0.7) this.award("thread", 300);
          this.lastNearMiss = this.time;
        }
        a.nearTouched = false;
      }
    }
  }

  private detectOncoming() {
    const v = this.v;
    const ne = this.world.nearestEdge(v.x, v.z);
    let valid = false;
    if (ne && ne.edge.rushLane && ne.dist < ne.edge.halfWidth && this.speed > 16.7 && v.grounded) {
      const dot = Math.sin(v.yaw) * ne.edge.dx + Math.cos(v.yaw) * ne.edge.dz;
      valid = (dot > 0.6 && ne.lateral < -0.6) || (dot < -0.6 && ne.lateral > 0.6);
    }
    if (valid) {
      this.oncomingTime += DT;
      this.oncomingPts += 140 * DT * (this.speed / 20);
      this.pulse.idle = Math.min(this.pulse.idle, 1.0);
    } else if (this.oncomingTime > 0) {
      if (this.oncomingTime >= 1) this.award("oncoming", this.oncomingPts);
      this.oncomingTime = 0;
      this.oncomingPts = 0;
    }
    this.oncomingActive = valid;
  }

  private detectShortcuts(px: number, pz: number) {
    const v = this.v;
    for (const [id, st] of this.shortcutState) {
      st.t += DT;
      if (st.t > 30) this.shortcutState.delete(id);
    }
    for (const sc of this.world.shortcuts) {
      const a = sc.gateA, b = sc.gateB;
      const crossA = segmentsCross(px, pz, v.x, v.z, a[0], a[1], a[2], a[3]);
      const crossB = segmentsCross(px, pz, v.x, v.z, b[0], b[1], b[2], b[3]);
      if (!crossA && !crossB) continue;
      const st = this.shortcutState.get(sc.id);
      const gate = crossA ? "A" : "B";
      if (st && st.from !== gate) {
        this.shortcutState.delete(sc.id);
        const first = !this.discovered.has(sc.id);
        this.stats.shortcutsRun++;
        if (first) {
          this.discovered.add(sc.id);
          this.newDiscoveries.push(sc.id);
          if (this.active) this.active.discoveryBonus += this.prefOf() === "shortcut" ? 1500 : 1000;
          else this.score += 1000;
        }
        if (this.active) { this.active.shortcuts++; this.specialOk.shortcut = true; }
        this.emit({ type: "shortcut", id: sc.id, name: sc.name, first });
        this.award("shortcut", 400);
        if (this.lesson?.goal.kind === "shortcut" && this.lesson.goal.id === sc.id) this.completeLesson();
      } else if (!st || st.from === gate) {
        this.shortcutState.set(sc.id, { from: gate, t: 0 });
        this.emit({ type: "shortcutEnter", id: sc.id, name: sc.name });
      }
    }
  }

  private detectCleanSector() {
    if (!this.active) { this.cleanTime = 0; return; }
    if (this.speed > 19.4) this.cleanTime += DT;
    else this.cleanTime = Math.max(0, this.cleanTime - DT * 2);
    if (this.cleanTime >= 10) {
      this.cleanTime = 0;
      this.award("cleanSector", 500);
    }
  }
  get cleanProgress(): number { return this.cleanTime / 10; }

  // ------------------------------------------------------------------ items and props
  private stepItems() {
    const v = this.v;
    for (const it of this.world.items) {
      if (this.collected.has(it.id)) continue;
      if (Math.abs(it.x - v.x) > 4 || Math.abs(it.z - v.z) > 4) continue;
      const iy = this.world.heightAt(it.x, it.z);
      if (dist(it.x, it.z, v.x, v.z) < 3.2 && Math.abs(iy - v.y) < 3) {
        if (it.kind === "spark" && (this.sparks >= 3 || !this.usesClock)) continue;
        this.collected.add(it.id);
        if (it.kind === "token") this.tailwind.charge(0.34);
        if (it.kind === "spark") { this.sparks++; this.clock += 1; }
        if (it.kind === "repair") v.damage = 0;
        this.emit({ type: "item", kind: it.kind, x: it.x, z: it.z });
      }
    }
  }

  private stepProps() {
    const v = this.v;
    const sp = this.speed;
    for (const p of this.props) {
      if (!p.hit) {
        if (Math.abs(p.x - v.x) > 4 || Math.abs(p.z - v.z) > 4) continue;
        if (Math.abs(p.y - v.y) > 2) continue;
        if (obbOverlap(v.x, v.z, this.taxi.width / 2 + 0.2, this.taxi.length / 2 + 0.2, v.yaw, p.x, p.z, 0.4, 0.4, p.yaw, this.ov)) {
          p.hit = true;
          p.t = 0;
          const side = this.rng.range(-1, 1);
          p.vx = v.vx * 1.15 + Math.cos(v.yaw) * side * 3;
          p.vz = v.vz * 1.15 - Math.sin(v.yaw) * side * 3;
          p.vy = Math.min(9, 2.5 + sp * 0.18);
          p.spin = this.rng.range(-8, 8);
          v.vx *= 0.985;
          v.vz *= 0.985;
          this.emit({ type: "prop", x: p.x, z: p.z });
        }
        continue;
      }
      p.t += DT;
      p.vy -= 9.81 * DT;
      p.x += p.vx * DT;
      p.z += p.vz * DT;
      p.y += p.vy * DT;
      p.yaw += p.spin * DT;
      const g = this.world.heightAt(p.x, p.z);
      if (p.y < g) {
        p.y = g;
        p.vy = Math.abs(p.vy) > 2 ? -p.vy * 0.35 : 0;
        p.vx *= 0.7; p.vz *= 0.7; p.spin *= 0.6;
      }
      // pooled: return home after a while once out of the way
      if (p.t > 6 && dist(p.ox, p.oz, v.x, v.z) > 40) {
        p.hit = false;
        p.x = p.ox; p.z = p.oz; p.y = this.world.heightAt(p.ox, p.oz); p.vx = p.vy = p.vz = 0;
      }
    }
  }

  // ------------------------------------------------------------------ fares
  private stepFares(inp: InputFrame) {
    const v = this.v;
    const sp = this.speed;
    if (!this.active) {
      for (const c of this.fares.candidates) {
        const d = dist(v.x, v.z, c.pickup.x, c.pickup.z);
        if ((d < 3.5 && sp < 1.4) || (inp.interact && d < 5 && sp < 2.5)) {
          this.pickup(c.id, d);
          break;
        }
      }
      return;
    }
    const a = this.active;
    a.elapsed += DT;
    a.patience -= DT;
    if (a.boardT > 0) a.boardT -= DT;
    // tourist landmarks
    if (this.prefOf() === "tourist") {
      for (const d of this.world.destinations) {
        if (!d.scenic || a.scenic.includes(d.id) || d.id === a.fare.dest.id) continue;
        if (dist(v.x, v.z, d.lx, d.lz) < 70) {
          a.scenic.push(d.id);
          this.bark("praise");
        }
      }
    }
    if (!a.urgent && a.patience < a.fare.par * 0.25) {
      a.urgent = true;
      this.bark("urgency");
    }
    const dd = dist(v.x, v.z, a.fare.dest.x, a.fare.dest.z);
    if (dd < 6 && sp < 2.23) {
      this.deliver(dd);
      return;
    }
    if (a.patience < -PERSONAL_GRACE && this.cfg.mode !== "trial" && this.cfg.mode !== "school") {
      this.bark("fail", true);
      const bank = Math.round(a.tips * 0.5) + a.discoveryBonus;
      this.score += bank;
      this.stats.failed++;
      this.stats.grades.push("Failed");
      this.emit({ type: "fareFail", fare: a.fare });
      this.active = null;
      this.pulse.reset();
      this.afterFare();
    }
  }

  private pickup(id: number, d: number) {
    const f = this.fares.take(id);
    if (!f) return;
    const clean = d < 1.5;
    const rough = false;
    this.active = {
      fare: f, elapsed: 0, patience: f.par - (clean ? 0 : 1), tips: 0, collisions: 0, shortcuts: 0, discoveryBonus: 0,
      maxAir: 0, scenic: [], driven: 0, boardT: 1.0, urgent: false,
    };
    this.specialOk = { collision: true, shortcut: false, air: false };
    this.clockPause = 1.0;
    if (clean) this.award("precision", 250);
    this.emit({ type: "pickup", fare: f, clean, rough });
    this.barkCooldown = 0;
    this.bark("pickup", true);
    if (this.lesson?.goal.kind === "fare") this.lessonMsg = "Passenger aboard! Follow the arrow.";
    this.updateRoute(true);
  }

  private deliver(d: number) {
    const a = this.active!;
    const f = a.fare;
    const precise = d < 1.8;
    const grade = gradeFor(a.patience, f.par);
    const pref = ARCHETYPES[f.archetype].pref;
    let baseMul = 1;
    let prefBonus = 0;
    if (pref === "rush") baseMul = grade === "Blazing" ? 1.4 : grade === "Fast" ? 1 : 0.8;
    if (pref === "fragile" && a.collisions === 0) baseMul *= 1.25;
    if (pref === "tourist") prefBonus += a.scenic.length * 300;
    if (pref === "calm" && a.collisions === 0 && a.maxAir < 0.6) prefBonus += 400;
    if (pref === "chatty") prefBonus += 150;
    let tips = a.tips;
    if (pref === "musician" && this.pulse.tier >= 2) tips *= 1.5;
    let special = false;
    if (f.special) {
      special = f.special === "noCollision" ? this.specialOk.collision : f.special === "shortcut" ? this.specialOk.shortcut : this.specialOk.air;
      if (special) baseMul *= 1.6;
    }
    if (precise) this.award("precision", 400);
    const br = fareBreakdown({ tier: f.tier, grade, timeLeft: Math.max(0, a.patience), par: f.par, tips, precise, discovery: a.discoveryBonus, baseMul, preference: prefBonus });
    let award = 0;
    if (this.cfg.mode === "arcade") award = shiftAward(grade, f.tier, f.par) + (special ? 4 : 0);
    this.clock += award;
    this.score += br.total;
    this.stats.fares += br.base + br.time;
    this.stats.timeBonus += award;
    this.stats.deliveries++;
    this.stats.grades.push(grade);
    this.stats.routeLegal += f.routeLen;
    this.stats.routeDriven += Math.max(a.driven, 1);
    this.tailwind.charge(grade === "Blazing" ? 0.4 : grade === "Fast" ? 0.25 : grade === "Close" ? 0.1 : 0);
    this.v.damage = 0;
    this.clockPause = 1.0;
    this.grace = -1;
    this.barkCooldown = 0;
    this.bark("arrival", true);
    this.emit({ type: "deliver", fare: f, grade, breakdown: br, timeAward: award, precise, special });
    this.active = null;
    if (this.pulse.tier >= 2 || this.stats.deliveries % 4 === 3) {
      this.specialPending = this.rng.pick(["noCollision", "shortcut", "air"] as const);
    }
    if (this.lesson?.goal.kind === "fare") this.completeLesson();
    this.afterFare();
  }

  private afterFare() {
    if (this.cfg.mode === "trial") {
      this.trialIndex++;
      if (this.trialIndex >= this.trialChain.length) {
        this.finish();
        return;
      }
      this.fares.candidates = [this.trialChain[this.trialIndex]];
    } else if (this.cfg.mode !== "school") {
      this.fares.maintain(this.v.x, this.v.z, this.specialPending);
      if (this.fares.candidates.some((c) => c.special)) this.specialPending = null;
    }
    this.updateRoute(true);
  }

  // ------------------------------------------------------------------ clock
  private stepClock() {
    if (this.phase !== "play") return;
    if (this.cfg.mode === "trial") {
      this.trialTime += DT;
      if (this.trialTime > 600) this.finish();
      return;
    }
    if (!this.usesClock) return;
    if (this.clockPause > 0) {
      this.clockPause -= DT;
      return;
    }
    this.clock -= DT;
    const whole = Math.ceil(this.clock);
    if (this.clock <= 10 && whole < this.clockLowSent && whole > 0) {
      this.clockLowSent = whole;
      this.emit({ type: "clockLow", seconds: whole });
    }
    if (this.clock > 10) this.clockLowSent = 99;
    if (this.clock <= 0) {
      this.clock = 0;
      const inZone = this.active && dist(this.v.x, this.v.z, this.active.fare.dest.x, this.active.fare.dest.z) < 6.5;
      if (inZone && this.grace < 0) this.grace = 2;
      if (this.grace > 0) {
        this.grace -= DT;
        if (this.grace > 0) return;
      }
      this.finish();
    }
  }

  // ------------------------------------------------------------------ reset
  doReset() {
    const v = this.v;
    const ne = this.world.nearestEdge(v.x, v.z) ?? this.world.nearestEdgeGlobal(v.x, v.z);
    const e = ne.edge;
    const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw);
    const dir = fx * e.dx + fz * e.dz >= 0 ? 1 : -1;
    const A = this.world.nodes[e.a];
    const s = clamp(ne.t, 0.12, 0.88) * e.length;
    const off = (e.halfWidth - e.laneWidth / 2) * dir;
    const x = A.x + e.dx * s + e.dz * off, z = A.z + e.dz * s - e.dx * off;
    const yaw = Math.atan2(e.dx * dir, e.dz * dir);
    const damage = v.damage;
    this.v = createVehicle(x, z, yaw, this.world);
    this.v.damage = damage;
    this.savePrev();
    this.voidTimer = 0;
    this.pulse.reset();
    this.shortcutState.clear();
    this.driftPts = 0;
    let penalty = 0;
    if (this.usesClock) {
      penalty = 3;
      this.clock = Math.max(0.5, this.clock - 3);
    } else if (this.cfg.mode === "trial") {
      penalty = 3;
      this.trialTime += 3;
    }
    this.score = Math.max(0, this.score - 500);
    this.emit({ type: "reset", penalty });
  }

  get canReset(): boolean {
    return this.v.stuckTime > 1.5;
  }

  // ------------------------------------------------------------------ route guidance
  get target(): { x: number; z: number; kind: "pickup" | "dest" | "lesson" } | null {
    if (this.active) return { x: this.active.fare.dest.x, z: this.active.fare.dest.z, kind: "dest" };
    if (this.lesson && this.lesson.goal.kind !== "fare") {
      const g = this.lesson.goal;
      if (g.kind === "stopInBox" || g.kind === "precision") return { x: g.x, z: g.z, kind: "lesson" };
      if (g.kind === "shortcut") {
        const sc = this.world.shortcuts.find((s) => s.id === g.id)!;
        return { x: (sc.gateA[0] + sc.gateA[2]) / 2, z: (sc.gateA[1] + sc.gateA[3]) / 2, kind: "lesson" };
      }
      if (g.kind === "air") return { x: 384, z: -405, kind: "lesson" };
      return null;
    }
    let best: Fare | null = null, bd = Infinity;
    for (const c of this.fares.candidates) {
      const d = dist(c.pickup.x, c.pickup.z, this.v.x, this.v.z);
      if (d < bd) { bd = d; best = c; }
    }
    return best ? { x: best.pickup.x, z: best.pickup.z, kind: "pickup" } : null;
  }

  private updateRoute(force: boolean) {
    void force;
    this.routeTimer = 0.4;
    const t = this.target;
    if (!t) { this.route = []; this.routeTarget = null; return; }
    this.routeTarget = [t.x, t.z];
    this.route = this.world.route(this.v.x, this.v.z, t.x, t.z).points;
  }

  private updateArrow() {
    const t = this.routeTarget;
    if (!t) { this.arrow = null; return; }
    if (this.cfg.guidance === "bearing" || this.route.length < 2) { this.arrow = [t[0], t[1]]; return; }
    // lookahead ~24 m along the route, skipping points behind us
    const pts = this.route;
    let remain = 24;
    let cx = this.v.x, cz = this.v.z;
    // find closest segment index
    let start = 1;
    let bestD = Infinity;
    for (let i = 1; i < pts.length; i++) {
      const d = dist(pts[i][0], pts[i][1], cx, cz);
      if (d < bestD && i < 4) { bestD = d; start = i; }
    }
    for (let i = start; i < pts.length; i++) {
      const [x, z] = pts[i];
      const l = dist(cx, cz, x, z);
      if (l >= remain) {
        const f = remain / l;
        this.arrow = [cx + (x - cx) * f, cz + (z - cz) * f];
        return;
      }
      remain -= l;
      cx = x; cz = z;
    }
    this.arrow = [t[0], t[1]];
  }

  /** Signed angle from taxi heading to the arrow target (rad, right positive). */
  get arrowAngle(): number {
    if (!this.arrow) return 0;
    return wrapAngle(Math.atan2(this.arrow[0] - this.v.x, this.arrow[1] - this.v.z) - this.v.yaw);
  }

  // ------------------------------------------------------------------ lessons
  private lessonEvent(kind: "surge" | "gripTurn" | "nearMiss") {
    const l = this.lesson;
    if (!l || l.goal.kind !== "event" || l.goal.event !== kind) return;
    this.lessonCount++;
    this.lessonMsg = `${this.lessonCount} / ${l.goal.count}`;
    this.emit({ type: "lessonProgress", text: this.lessonMsg });
    if (this.lessonCount >= l.goal.count) this.completeLesson();
  }

  private checkLesson() {
    const l = this.lesson!;
    const g = l.goal;
    if (this.lessonDoneT >= 0) {
      this.lessonDoneT += DT;
      if (this.lessonDoneT > 2.2) this.finish();
      return;
    }
    const kmh = this.kmh;
    if (g.kind === "speed") {
      this.lessonMsg = `${Math.round(kmh)} / ${g.kmh} km/h`;
      if (kmh >= g.kmh) this.completeLesson();
    } else if (g.kind === "stopInBox") {
      if (kmh >= g.minKmh) this.lessonReached = true;
      const d = dist(this.v.x, this.v.z, g.x, g.z);
      this.lessonMsg = this.lessonReached ? `Stop in the box: ${d.toFixed(0)} m` : `Speed up: ${Math.round(kmh)} / ${g.minKmh} km/h`;
      if (this.lessonReached && this.speed < 0.5) {
        if (d < g.r) this.completeLesson();
        else if (d < 60) this.lessonMsg = `Stopped ${d.toFixed(1)} m away. Back up and try again.`;
      }
    } else if (g.kind === "precision") {
      const d = dist(this.v.x, this.v.z, g.x, g.z);
      if (this.speed < 0.3 && d < 8) {
        if (d < g.r) this.completeLesson();
        else this.lessonMsg = `${d.toFixed(2)} m off centre - creep forward or back`;
      } else this.lessonMsg = `Distance ${d.toFixed(1)} m`;
    }
  }

  private completeLesson() {
    if (this.lessonDoneT >= 0) return;
    this.lessonDoneT = 0;
    this.lessonMsg = "Lesson complete!";
    this.emit({ type: "lessonDone" });
  }

  // ------------------------------------------------------------------ end
  finish() {
    if (this.phase === "done") return;
    this.phase = "done";
    // bank pending tips on a still-active fare at shift end (half, like a failed fare)
    if (this.active) {
      this.score += Math.round(this.active.tips * 0.5);
    }
    let medal: Results["medal"] = null;
    if (this.cfg.mode === "trial" && this.medals && this.trialIndex >= this.trialChain.length) {
      medal = this.trialTime <= this.medals.gold ? "gold" : this.trialTime <= this.medals.silver ? "silver" : this.trialTime <= this.medals.bronze ? "bronze" : null;
    }
    this.results = {
      mode: this.cfg.mode,
      score: Math.round(this.score),
      fares: Math.round(this.stats.fares),
      tips: Math.round(this.stats.tips),
      timeBonus: this.stats.timeBonus,
      deliveries: this.stats.deliveries,
      failed: this.stats.failed,
      bestChain: this.pulse.bestChain,
      collisions: this.stats.collisions,
      shortcutsRun: this.stats.shortcutsRun,
      newDiscoveries: [...this.newDiscoveries],
      routeEfficiency: this.stats.routeDriven > 0 ? Math.round((this.stats.routeLegal / this.stats.routeDriven) * 100) : 0,
      rank: this.cfg.mode === "arcade" || this.cfg.mode === "quick" ? rankFor(this.score, this.cfg.mode) : null,
      duration: this.time,
      trialTime: this.cfg.mode === "trial" ? this.trialTime : undefined,
      medal,
      medals: this.medals ?? undefined,
      lessonDone: this.lesson ? this.lessonDoneT >= 0 : undefined,
      grades: [...this.stats.grades],
      rulesVersion: RULES_VERSION,
      taxi: this.taxi.id,
      seed: this.cfg.seed,
    };
    this.emit({ type: "end" });
  }

  abandon() {
    this.finish();
  }

  /** Deterministic state hash for replay/frame-rate validation. */
  hash(): number {
    const nums: number[] = [this.v.x, this.v.y, this.v.z, this.v.yaw, this.v.vx, this.v.vz, this.score, this.clock, this.tick];
    for (const a of this.traffic.agents) if (a.active) nums.push(a.x, a.z, a.speed);
    for (const p of this.peds.peds) if (p.active) nums.push(p.x, p.z);
    return hashNumbers(nums);
  }

  specialLabel(f: Fare): string {
    return f.special ? SPECIAL_LABEL[f.special] : "";
  }
}
