import { clamp, dampAngle, headingTo } from '../core/math';
import type { V2 } from '../core/math';
import type { Game } from './game';
import type { CrimeType, Evidence, Human, IdentState } from './types';
import { VEHICLES, makeVehicle, stepVehicle } from './vehicle';
import type { Vehicle } from './vehicle';
import { makeHuman } from './peds';
import { isecPos } from './nav';
import { obstacleAhead, pursueSteer, speedCommand, pathDistanceTo, pointOnPath } from './driver';
import { resolveHuman } from './collision';
import { damageHuman, resolveShot } from './combat';
import { WEAPONS } from './weapons';
import { traceShot } from './combat';

export const TIER_THRESHOLDS = [0, 1, 3, 6, 10, 15];
export const DESIRED_CARS = [0, 1, 3, 5, 6, 6];
const SEARCH_TIME = [0, 14, 22, 30, 38, 46];
const SIGHT = 55;
const CAMERAS: Array<{ id: number; x: number; z: number; range: number }> = [
  { id: 1, x: 0, z: 0, range: 42 }, { id: 2, x: 80, z: 80, range: 42 }, { id: 3, x: -80, z: -80, range: 42 },
  { id: 4, x: 160, z: -80, range: 42 }, { id: 5, x: -160, z: 80, range: 42 }, { id: 6, x: 80, z: 160, range: 42 }, { id: 7, x: 160, z: 160, range: 42 },
];
export { CAMERAS };

export function tierForHeat(heat: number): number {
  let t = 0;
  for (let i = 1; i <= 4; i++) if (heat >= TIER_THRESHOLDS[i]) t = i;
  return t;
}

interface PoliceCar {
  vehicleId: number;
  role: 'patrol' | 'tactical' | 'blocker';
  mode: 'Respond' | 'Pursue' | 'Search' | 'Return' | 'Parked' | 'Block';
  path: V2[];
  pathI: number;
  repathT: number;
  stuckT: number;
  recoverT: number;
  searchGoal: V2 | null;
  officers: number[];
  disembarked: boolean;
}

export interface SpikeStrip { id: number; x: number; z: number; axis: 'x' | 'z'; alive: boolean }
export interface Drone { x: number; z: number; y: number; active: boolean }

export class PoliceSystem {
  evidence: Evidence[] = [];
  heat = 0;
  tier = 0;
  ident: IdentState = 'Unnoticed';
  lastSeenT = -99;
  lastKnown: V2 | null = null;
  searchRadius = 70;
  description: { outfit: number; vehicleId: number | null; plate: string | null } = { outfit: 0, vehicleId: null, plate: null };
  cars: PoliceCar[] = [];
  budget = 0;
  spikes: SpikeStrip[] = [];
  drone: Drone = { x: 0, z: 0, y: 25, active: false };
  stats = { crimes: 0, observed: 0, reports: 0, arrests: 0, spawned: 0, voided: 0, escapes: 0 };
  private evId = 1;
  private spawnCool = 0;
  private searchT = 0;
  private coolT = 0;
  private logicT = 0;
  private roadblockCool = 20;
  private spikeCool = 25;
  private arrestT = 0;
  private lastShotAtPoliceT = -99;
  private seen = false;
  private dispatchCool = 0;
  surrender = false;

  // ------------------------------------------------------------------ evidence
  crime(type: CrimeType, x: number, z: number, severity: number, o: { byPlayer: boolean; victim?: number; noise?: boolean; vehicle?: Vehicle | null } = { byPlayer: true }): Evidence | null {
    const g = this.g;
    if (!o.byPlayer) return null;
    const t = g.t;
    const pv = g.playerVehicle();
    // merge repeated events (auto fire etc.) into a recent record of the same type
    const recent = this.evidence.find((e) => e.type === type && t - e.time < (type === 'gunfire' ? 6 : 3) && Math.hypot(e.x - x, e.z - z) < 25 && e.status !== 'void');
    if (recent) {
      if (type === 'weapon-display') return recent;
      recent.time = t;
      if (recent.status === 'observed' || recent.status === 'reported') this.addHeat(severity * 0.15, true);
      return recent;
    }
    const ev: Evidence = {
      id: this.evId++, type, severity, time: t, x, z, suspectOutfit: g.player.outfit, vehicleId: pv ? pv.id : null, plate: pv ? pv.plate : null,
      witnesses: [], camera: null, confidence: 0.55, status: 'pending',
    };
    this.evidence.push(ev);
    if (this.evidence.length > 60) this.evidence.shift();
    g.player.stats.crimes++;
    this.stats.crimes++;
    // 1) direct police observation or camera
    let observed = false;
    for (const h of g.humans) {
      if ((h.kind === 'police') && h.alive && Math.hypot(h.x - x, h.z - z) < SIGHT && g.world.lineOfSight(h.x, h.z, x, z) && !g.smokeBlocks(h.x, h.z, x, z)) { observed = true; break; }
    }
    if (!observed) for (const c of this.cars) {
      const v = g.vehicleById(c.vehicleId);
      if (v && v.driverId !== null && Math.hypot(v.x - x, v.z - z) < SIGHT && g.world.lineOfSight(v.x, v.z, x, z) && !g.smokeBlocks(v.x, v.z, x, z)) { observed = true; break; }
    }
    for (const cam of CAMERAS) {
      if (Math.hypot(cam.x - x, cam.z - z) < cam.range && g.world.lineOfSight(cam.x, cam.z, x, z, 4) && !g.smokeBlocks(cam.x, cam.z, x, z)) { ev.camera = cam.id; observed = true; break; }
    }
    if (observed) {
      ev.status = 'observed';
      ev.confidence = 1;
      this.stats.observed++;
      this.register(ev, true);
      return ev;
    }
    // 2) civilian witnesses (sight cone or hearing for gunfire)
    for (const h of g.humans) {
      if (h.kind !== 'ped' || !h.alive || h.state === 'Down' || h.state === 'Dead' || h.state === 'CallEmergency') continue;
      const d = Math.hypot(h.x - x, h.z - z);
      const hearing = o.noise && d < 48;
      if (d > 38 && !hearing) continue;
      const los = g.world.lineOfSight(h.x, h.z, x, z) && !g.smokeBlocks(h.x, h.z, x, z);
      let sees = false;
      if (los && d <= 38) {
        const ang = Math.abs(((Math.atan2(x - h.x, z - h.z) - h.heading + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        sees = ang < 1.9 || h.state === 'Panic' || h.state === 'ReactCurious';
      }
      if (!sees && !(hearing && los)) continue;
      ev.witnesses.push(h.id);
      if (h.hasPhone && h.courage > 0.12) {
        const delay = g.rng.range(2, 5);
        g.peds.startCall(g, h, ev.id, delay);
        h.threat = { x, z };
      } else {
        h.fear = Math.max(h.fear, 0.8);
        h.threat = { x, z };
        h.state = 'Panic';
        h.stateT = 0;
      }
    }
    if (ev.witnesses.length === 0) { ev.status = 'void'; this.stats.voided++; }
    else this.updateIdent();
    return ev;
  }

  weaponDisplay(x: number, z: number): void {
    const g = this.g;
    // only civilians who can actually see a drawn weapon within 14 m
    let seen = 0;
    for (const h of g.humans) {
      if (h.kind !== 'ped' || !h.alive) continue;
      const d = Math.hypot(h.x - x, h.z - z);
      if (d < 14 && g.world.lineOfSight(h.x, h.z, x, z)) {
        seen++;
        if (h.state === 'WalkRoute' || h.state === 'Browse') { h.fear = Math.max(h.fear, 0.55 + (1 - h.courage) * 0.3); h.state = h.courage > 0.5 ? 'ReactCurious' : 'Panic'; h.stateT = 0; h.threat = { x, z }; }
      }
    }
    if (seen > 0 && g.t - this.lastDisplayT > 4) { this.lastDisplayT = g.t; this.crime('weapon-display', x, z, 0.5, { byPlayer: true }); }
    else if (g.humans.some((h) => h.kind === 'police' && h.alive && Math.hypot(h.x - x, h.z - z) < 30 && g.world.lineOfSight(h.x, h.z, x, z)) && g.t - this.lastDisplayT > 4) {
      this.lastDisplayT = g.t; this.crime('weapon-display', x, z, 0.6, { byPlayer: true });
    }
  }
  private lastDisplayT = -99;

  completeReport(evId: number, witness: Human): void {
    const ev = this.evidence.find((e) => e.id === evId);
    if (!ev || ev.status === 'void') return;
    if (ev.status === 'pending') {
      ev.status = 'reported';
      ev.confidence = clamp(0.5 + 0.15 * ev.witnesses.length, 0.5, 0.95);
      this.stats.reports++;
      this.register(ev, false);
    }
    void witness;
  }

  cancelReport(evId: number, witness: Human): void {
    const ev = this.evidence.find((e) => e.id === evId);
    if (!ev) return;
    ev.witnesses = ev.witnesses.filter((w) => w !== witness.id);
    const calling = this.g.humans.some((h) => h.state === 'CallEmergency' && h.reportEvidence === ev.id && h.id !== witness.id);
    if (ev.status === 'pending' && !calling) { ev.status = 'void'; this.stats.voided++; }
    this.updateIdent();
  }

  /** Harming a witness never helps: the report goes out immediately and the heat rises. */
  witnessHarmed(h: Human): void {
    if (h.state === 'CallEmergency' || h.reportT > 0) {
      const ev = this.evidence.find((e) => e.id === h.reportEvidence);
      if (ev && ev.status === 'pending') { ev.status = 'reported'; this.stats.reports++; this.register(ev, false); this.addHeat(1.5, true); }
    }
  }

  private register(ev: Evidence, direct: boolean): void {
    const g = this.g;
    const wasZero = this.tier === 0;
    this.addHeat(ev.severity * (direct ? 1 : 0.9), true);
    this.lastKnown = { x: ev.x, z: ev.z };
    this.description = { outfit: ev.suspectOutfit, vehicleId: ev.vehicleId, plate: ev.plate };
    if (direct) { this.lastSeenT = g.t; }
    if (this.tier === 0) this.tier = 1; // any registered crime is at least tier 1 attention
    this.recalcTier();
    if (wasZero || this.budget <= 0) this.budget = 4 + 3 * this.tier;
    this.searchT = 0;
    this.coolT = 0;
    this.updateIdent();
    this.dispatch(ev);
  }

  private addHeat(amount: number, escalate: boolean): void {
    this.heat += amount;
    if (escalate) this.recalcTier();
  }

  private recalcTier(): void {
    const t = Math.max(tierForHeat(this.heat), this.heat > 0 ? 1 : 0);
    if (t > this.tier) {
      this.tier = t;
      this.g.emit({ type: 'sfx', name: 'alert' });
      this.budget += 3 * (t - 1);
    }
  }

  private dispatch(ev: Evidence): void {
    const g = this.g;
    if (this.dispatchCool > 0) return;
    this.dispatchCool = 6;
    const district = g.world.districtAt(ev.x, ev.z);
    const what: Record<CrimeType, string> = {
      'vehicle-theft': 'a stolen vehicle', assault: 'an assault', 'weapon-display': 'a person with a weapon', gunfire: 'shots fired',
      trespass: 'a trespass', 'property-damage': 'property damage', 'collision-injury': 'a collision with injuries', 'attack-police': 'an officer under attack',
    };
    const veh = ev.vehicleId !== null ? g.vehicleById(ev.vehicleId) : null;
    const desc = veh ? ` Suspect in a ${colourName(veh.color)} ${veh.def.name.split(' ')[0]}.` : ' Suspect on foot.';
    g.emit({ type: 'subtitle', speaker: 'Dispatch', text: `All units: report of ${what[ev.type]} near ${district}.${desc}`, ms: 5200 });
  }

  /** The player changed appearance or vehicle. Only helps if nobody is watching. */
  onAppearanceChange(kind: 'vehicle' | 'outfit'): void {
    const g = this.g;
    if (this.tier === 0) return;
    if (this.seen || g.t - this.lastSeenT < 3) { return; }
    const t = SEARCH_TIME[this.tier];
    this.searchT = Math.max(this.searchT, t * 0.55);
    g.toast(kind === 'vehicle' ? 'New vehicle - the description no longer matches' : 'New look - the description no longer matches', 'good');
    this.description = { outfit: g.player.outfit, vehicleId: g.playerVehicle()?.id ?? null, plate: g.playerVehicle()?.plate ?? null };
  }

  // ------------------------------------------------------------------ main loop
  constructor(private g: Game) {}

  updateIdent(): void {
    if (this.tier === 0) {
      const pending = this.g.humans.some((h) => h.state === 'CallEmergency');
      this.ident = pending ? 'Witness Reporting' : 'Unnoticed';
      return;
    }
    if (this.seen) this.ident = 'Pursuit';
    else if (this.coolT > 0) this.ident = 'Cooling';
    else if (this.g.t - this.lastSeenT < 4 || this.searchT === 0 && this.g.t - this.lastSeenT < 8) this.ident = this.lastSeenT < -50 ? 'Identified' : 'Search';
    else this.ident = 'Search';
    if (this.lastSeenT < -50 && !this.seen && this.coolT === 0 && this.searchT === 0) this.ident = 'Identified';
  }

  update(dt: number): void {
    const g = this.g;
    this.dispatchCool = Math.max(0, this.dispatchCool - dt);
    this.spawnCool = Math.max(0, this.spawnCool - dt);
    this.logicT -= dt;
    // per-frame unit control
    for (const c of [...this.cars]) this.driveCar(c, dt);
    for (const h of g.humans) if (h.kind === 'police') this.updateOfficer(h, dt);
    this.updateSpikes(dt);
    if (this.logicT > 0) return;
    const step = 0.25;
    this.logicT = step;
    this.seen = this.playerSeen();
    const P = g.player.human;
    if (this.tier > 0) {
      if (this.seen) {
        this.lastSeenT = g.t;
        this.lastKnown = { x: P.x, z: P.z };
        this.searchT = 0;
        this.coolT = 0;
        const pv = g.playerVehicle();
        this.description = { outfit: g.player.outfit, vehicleId: pv ? pv.id : null, plate: pv ? pv.plate : null };
      } else if (g.t - this.lastSeenT > 4) {
        // lost them: search then cool down
        if (this.coolT > 0) {
          this.coolT -= step;
          if (this.coolT <= 0) this.dropTier();
        } else {
          this.searchT += step;
          if (this.searchT >= SEARCH_TIME[this.tier]) { this.coolT = 6; }
        }
        // abandoned, identified vehicle draws units toward it
        const dv = this.description.vehicleId !== null ? g.vehicleById(this.description.vehicleId) : null;
        if (dv && dv.driverId !== 0 && dv.alive && g.playerVehicle() === null && this.lastKnown && Math.hypot(dv.x - this.lastKnown.x, dv.z - this.lastKnown.z) > 6) {
          this.lastKnown = { x: dv.x, z: dv.z };
        }
      }
      this.searchRadius = 60 + this.tier * 22;
      // heat bleeds only when unidentified
      this.dispatchUnits();
      this.maybeRoadblock();
      this.updateDrone();
    } else {
      this.cleanupUnits();
    }
    // evidence aging
    for (const e of this.evidence) if (e.status === 'pending' && g.t - e.time > 12 && !g.humans.some((h) => h.state === 'CallEmergency' && h.reportEvidence === e.id)) { e.status = 'void'; this.stats.voided++; }
    this.updateIdent();
  }

  private dropTier(): void {
    this.tier--;
    this.heat = TIER_THRESHOLDS[this.tier] > 0 ? TIER_THRESHOLDS[this.tier] - 0.01 + (this.tier === 0 ? 0 : 0.01) : 0;
    if (this.tier <= 0) {
      this.tier = 0;
      this.heat = 0;
      this.stats.escapes++;
      this.g.toast('Alert cleared - you got away', 'good');
      this.g.emit({ type: 'sfx', name: 'win' });
      this.ident = 'Unnoticed';
      this.lastKnown = null;
      for (const s of this.spikes) s.alive = false;
    } else {
      this.searchT = 0;
      this.coolT = 0;
      this.g.toast('Alert lowered to tier ' + this.tier, 'info');
    }
  }

  /** Console/mission hook: force a tier (mission-only tier 5 allowed). */
  setTier(t: number): void { this.tier = t; this.heat = TIER_THRESHOLDS[t]; this.budget = 6 + t * 3; this.lastSeenT = this.g.t; this.updateIdent(); }

  clear(): void {
    this.tier = 0; this.heat = 0; this.ident = 'Unnoticed'; this.lastKnown = null; this.searchT = 0; this.coolT = 0; this.budget = 0; this.surrender = false; this.arrestT = 0;
    this.evidence = []; this.drone.active = false;
    for (const s of this.spikes) s.alive = false;
    this.cleanupUnits(true);
  }

  private playerSeen(): boolean {
    const g = this.g;
    const P = g.player.human;
    const night = g.hour < 6 || g.hour > 20.5;
    const sight = night ? SIGHT * 0.75 : SIGHT;
    const sneaky = P.crouch ? 0.7 : 1;
    for (const h of g.humans) {
      if (h.kind !== 'police' || !h.alive || h.state === 'Down') continue;
      const d = Math.hypot(h.x - P.x, h.z - P.z);
      if (d < sight * sneaky && g.world.lineOfSight(h.x, h.z, P.x, P.z) && !g.smokeBlocks(h.x, h.z, P.x, P.z)) return true;
    }
    for (const c of this.cars) {
      const v = g.vehicleById(c.vehicleId);
      if (!v || v.driverId === null) continue;
      const d = Math.hypot(v.x - P.x, v.z - P.z);
      if (d < sight * sneaky && g.world.lineOfSight(v.x, v.z, P.x, P.z) && !g.smokeBlocks(v.x, v.z, P.x, P.z)) return true;
    }
    for (const cam of CAMERAS) {
      if (Math.hypot(cam.x - P.x, cam.z - P.z) < cam.range && g.world.lineOfSight(cam.x, cam.z, P.x, P.z, 4) && !g.smokeBlocks(cam.x, cam.z, P.x, P.z)) return true;
    }
    if (this.drone.active && Math.hypot(this.drone.x - P.x, this.drone.z - P.z) < 70 && !g.smokeBlocks(this.drone.x, this.drone.z, P.x, P.z)) return true;
    return false;
  }

  private updateDrone(): void {
    const g = this.g;
    if (this.tier < 4) { this.drone.active = false; return; }
    if (!this.drone.active) { this.drone.active = true; const P = g.player.human; this.drone.x = P.x + 120; this.drone.z = P.z + 120; g.toast('Harbor drone deployed', 'warn'); }
  }

  tickDrone(dt: number): void {
    if (!this.drone.active) return;
    const tgt = this.lastKnown ?? this.g.player.human;
    const dx = tgt.x - this.drone.x;
    const dz = tgt.z - this.drone.z;
    const d = Math.hypot(dx, dz);
    if (d > 6) { this.drone.x += (dx / d) * 16 * dt; this.drone.z += (dz / d) * 16 * dt; }
  }

  // ------------------------------------------------------------------ dispatch / spawn
  private activeCars(): PoliceCar[] { return this.cars.filter((c) => c.mode !== 'Return' && c.role !== 'blocker'); }

  private dispatchUnits(): void {
    const g = this.g;
    const want = DESIRED_CARS[Math.min(this.tier, 5)];
    // cap concurrent police units regardless of tier (CPU/spawn flood guard)
    if (this.activeCars().length >= Math.min(want, 6) || this.budget <= 0 || this.spawnCool > 0) return;
    if (this.cars.length >= 8) return;
    const target = this.lastKnown ?? g.player.human;
    const cam = g.cam.pose;
    const station = g.world.poi('precinct');
    // try the station first, then random road portals
    const candidates: Array<{ lane: ReturnType<typeof g.roads.nearestLane> }> = [];
    candidates.push({ lane: g.roads.nearestLane(station.x, station.z - 8) });
    for (let i = 0; i < 6; i++) { const l = g.rng.pick(g.roads.lanes); candidates.push({ lane: { lane: l, s: g.rng.range(4, l.length - 8), d: 0 } }); }
    for (const c of candidates) {
      const x = c.lane.lane.p0.x + c.lane.lane.dir.x * c.lane.s;
      const z = c.lane.lane.p0.z + c.lane.lane.dir.z * c.lane.s;
      const dp = Math.hypot(x - g.player.human.x, z - g.player.human.z);
      const dt = Math.hypot(x - target.x, z - target.z);
      if (dp < 85 || dp > 230 || dt > 260) continue;
      if (g.traffic.inView(cam, x, z) && dp < 150) continue;
      if (g.vehicles.some((o) => Math.hypot(o.x - x, o.z - z) < 8)) continue;
      this.spawnPatrol(x, z, Math.atan2(c.lane.lane.dir.x, c.lane.lane.dir.z), this.tier >= 4 && this.cars.filter((q) => q.role === 'tactical').length < 1 && g.rng.chance(0.4) ? 'tactical' : 'patrol');
      this.spawnCool = 4.5 - this.tier * 0.4;
      this.budget--;
      return;
    }
  }

  spawnPatrol(x: number, z: number, heading: number, role: 'patrol' | 'tactical' | 'blocker'): PoliceCar {
    const g = this.g;
    const def = role === 'tactical' ? VEHICLES.dray : VEHICLES.sentinel;
    const v = makeVehicle(def, x, z, heading, 'police', role === 'tactical' ? 0x1a2230 : 0x1b2a41);
    v.engineOn = true;
    v.siren = role !== 'blocker' || true;
    v.lights = true;
    v.speed = 8;
    v.vx = Math.sin(heading) * 8;
    v.vz = Math.cos(heading) * 8;
    g.vehicles.push(v);
    const officers: number[] = [];
    const n = role === 'tactical' ? 3 : this.tier >= 3 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const o = makeHuman('police', x, z, role === 'tactical' ? 'tactical' : 'officer', 30);
      o.vehicleId = v.id;
      o.state = 'Idle';
      o.weapon = 'pistol';
      o.hp = role === 'tactical' ? 120 : 90;
      o.armor = role === 'tactical' ? 40 : 0;
      if (i === 0) v.driverId = o.id;
      g.humans.push(o);
      officers.push(o.id);
    }
    const car: PoliceCar = { vehicleId: v.id, role, mode: role === 'blocker' ? 'Block' : 'Respond', path: [], pathI: 0, repathT: 0, stuckT: 0, recoverT: 0, searchGoal: null, officers, disembarked: false };
    this.cars.push(car);
    this.stats.spawned++;
    return car;
  }

  private maybeRoadblock(): void {
    const g = this.g;
    this.roadblockCool -= 0.25;
    this.spikeCool -= 0.25;
    const pv = g.playerVehicle();
    if (!pv || this.tier < 3 || Math.hypot(pv.vx, pv.vz) < 9) return;
    const P = g.player.human;
    const hdg = Math.atan2(pv.vx, pv.vz);
    if (this.roadblockCool <= 0 && this.cars.filter((c) => c.role === 'blocker').length < 2) {
      const px = P.x + Math.sin(hdg) * 150;
      const pz = P.z + Math.cos(hdg) * 150;
      const n = g.roads.nearestIntersection(px, pz);
      const c = isecPos(n);
      const dp = Math.hypot(c.x - P.x, c.z - P.z);
      if (dp > 110 && dp < 230 && !g.traffic.inView(g.cam.pose, c.x, c.z)) {
        // block across the road the player is travelling along
        const alongX = Math.abs(Math.sin(hdg)) > Math.abs(Math.cos(hdg));
        for (let k = -1; k <= 1; k += 2) {
          const bx = alongX ? c.x - Math.sign(Math.sin(hdg)) * 9 : c.x + k * 3.2;
          const bz = alongX ? c.z + k * 3.2 : c.z - Math.sign(Math.cos(hdg)) * 9;
          if (g.vehicles.some((o) => Math.hypot(o.x - bx, o.z - bz) < 4)) continue;
          const car = this.spawnPatrol(bx, bz, alongX ? Math.PI / 2 * (k > 0 ? 1 : -1) + 0.0 : (k > 0 ? 0 : Math.PI), 'blocker');
          const bv = g.vehicleById(car.vehicleId)!;
          bv.vx = bv.vz = 0; bv.speed = 0;
          car.mode = 'Block';
        }
        this.roadblockCool = 35;
        g.toast('Roadblock ahead', 'warn');
      }
    }
    if (this.tier >= 4 && this.spikeCool <= 0) {
      const px = P.x + Math.sin(hdg) * 95;
      const pz = P.z + Math.cos(hdg) * 95;
      const snap = g.roads.roadSnap(px, pz);
      if (Math.hypot(snap.x - px, snap.z - pz) < 6 && !g.traffic.inView(g.cam.pose, snap.x, snap.z)) {
        const alongX = Math.abs(Math.sin(hdg)) > Math.abs(Math.cos(hdg));
        this.spikes.push({ id: this.spikes.length + 1, x: alongX ? px : snap.x, z: alongX ? snap.z : pz, axis: alongX ? 'z' : 'x', alive: true });
        this.spikeCool = 40;
      }
    }
  }

  private updateSpikes(dt: number): void {
    const g = this.g;
    void dt;
    for (const s of this.spikes) {
      if (!s.alive) continue;
      for (const v of g.vehicles) {
        if (v.owner === 'police' || !v.alive) continue;
        const dx = Math.abs(v.x - s.x);
        const dz = Math.abs(v.z - s.z);
        const hitX = s.axis === 'z' ? dx < 1.2 && dz < 6 : dx < 6 && dz < 1.2;
        if (hitX) {
          v.tireDamage = clamp(v.tireDamage + 0.6, 0, 0.8);
          s.alive = false;
          if (v.driverId === 0) { g.toast('Spike strip! Tyres shredded', 'bad'); g.cam.shake = 0.6; }
        }
      }
    }
    this.spikes = this.spikes.filter((s) => s.alive || false);
  }

  // ------------------------------------------------------------------ units
  private cleanupUnits(force = false): void {
    const g = this.g;
    const P = g.player.human;
    for (const c of [...this.cars]) {
      const v = g.vehicleById(c.vehicleId);
      if (!v) { this.cars.splice(this.cars.indexOf(c), 1); continue; }
      c.mode = 'Return';
      v.siren = false;
      const d = Math.hypot(v.x - P.x, v.z - P.z);
      if (force || (d > 120 && !g.traffic.inView(g.cam.pose, v.x, v.z)) || d > 200) this.removeCar(c);
    }
    for (let i = g.humans.length - 1; i >= 0; i--) {
      const h = g.humans[i];
      if (h.kind !== 'police') continue;
      if (h.vehicleId !== null) continue;
      const d = Math.hypot(h.x - P.x, h.z - P.z);
      if (force || (d > 90 && !g.traffic.inView(g.cam.pose, h.x, h.z)) || d > 160) g.humans.splice(i, 1);
    }
  }

  private removeCar(c: PoliceCar): void {
    const g = this.g;
    const v = g.vehicleById(c.vehicleId);
    if (v) v.alive = false;
    for (const id of c.officers) {
      const idx = g.humans.findIndex((h) => h.id === id && h.vehicleId === c.vehicleId);
      if (idx >= 0) g.humans.splice(idx, 1);
    }
    this.cars.splice(this.cars.indexOf(c), 1);
  }

  private targetPoint(): V2 {
    const g = this.g;
    if (this.seen) return { x: g.player.human.x, z: g.player.human.z };
    return this.lastKnown ?? { x: g.player.human.x, z: g.player.human.z };
  }

  private driveCar(c: PoliceCar, dt: number): void {
    const g = this.g;
    const v = g.vehicleById(c.vehicleId);
    if (!v || !v.alive) { this.cars.splice(this.cars.indexOf(c), 1); return; }
    const P = g.player.human;
    if (c.mode === 'Block' || c.mode === 'Parked') { stepVehicle(v, { throttle: 0, steer: 0, handbrake: true }, dt, g.world.surfaceAt(v.x, v.z)); if (c.role === 'blocker' && this.tier === 0) c.mode = 'Return'; return; }
    // disabled car: officers bail out
    if (v.health <= 0 && !c.disembarked) { this.disembark(c, v); c.mode = 'Parked'; v.siren = false; return; }
    const seen = this.seen;
    const target = this.targetPoint();
    const dTarget = Math.hypot(target.x - v.x, target.z - v.z);
    if (this.tier === 0 || c.mode === 'Return') {
      c.mode = 'Return';
      v.siren = false;
      this.followPath(c, v, dt, 9, true);
      return;
    }
    c.mode = seen ? 'Pursue' : dTarget < this.searchRadius * 0.5 || this.ident === 'Search' || this.ident === 'Cooling' ? 'Search' : 'Respond';
    v.siren = c.mode !== 'Search' || this.tier >= 2;
    // dismount when the target is on foot and close
    const pv = g.playerVehicle();
    if (!pv && seen && Math.hypot(v.x - P.x, v.z - P.z) < 20 && !c.disembarked && Math.abs(v.speed) < 8) { this.disembark(c, v); stepVehicle(v, { throttle: -1, steer: 0, handbrake: true }, dt, g.world.surfaceAt(v.x, v.z)); return; }
    if (c.disembarked && !pv && seen) { stepVehicle(v, { throttle: 0, steer: 0, handbrake: true }, dt, g.world.surfaceAt(v.x, v.z)); return; }
    let goal = target;
    let speed = c.mode === 'Search' ? 11 : 17 + this.tier * 0.8;
    if (c.mode === 'Search') {
      if (!c.searchGoal || Math.hypot(c.searchGoal.x - v.x, c.searchGoal.z - v.z) < 10) {
        const a = g.rng.range(0, Math.PI * 2);
        const r = g.rng.range(15, this.searchRadius);
        c.searchGoal = g.roads.roadSnap(target.x + Math.cos(a) * r, target.z + Math.sin(a) * r);
      }
      goal = c.searchGoal;
    }
    c.repathT -= dt;
    if (c.repathT <= 0) { c.repathT = 1.4; this.repath(c, v, goal); }
    // direct approach when on a clear straight corridor
    const direct = seen && dTarget < 40 && g.world.lineOfSight(v.x, v.z, goal.x, goal.z, 0.5);
    this.followPath(c, v, dt, speed, false, direct ? goal : undefined);
    void P;
  }

  private repath(c: PoliceCar, v: Vehicle, goal: V2): void {
    const g = this.g;
    const a = g.roads.nearestIntersection(v.x, v.z);
    const gSnap = g.roads.roadSnap(goal.x, goal.z);
    const b = g.roads.nearestIntersection(gSnap.x, gSnap.z);
    const nodes = g.roads.route(a, b);
    const path: V2[] = nodes.map((n) => isecPos(n));
    // avoid doubling back to the first intersection when already past it
    if (path.length > 1) {
      const fx = Math.sin(v.heading);
      const fz = Math.cos(v.heading);
      const p0 = path[0];
      if ((p0.x - v.x) * fx + (p0.z - v.z) * fz < -2) path.shift();
    }
    // final approach to the snapped goal
    path.push(gSnap);
    c.path = path;
    c.pathI = 0;
  }

  private followPath(c: PoliceCar, v: Vehicle, dt: number, speed: number, leaving: boolean, direct?: V2): void {
    const g = this.g;
    if (leaving && c.path.length === 0) {
      // pick a far intersection to drive away to
      const a = g.roads.nearestIntersection(v.x, v.z);
      const far = g.roads.nearestIntersection(v.x + g.rng.range(-200, 200), v.z + g.rng.range(-200, 200));
      c.path = g.roads.route(a, far).map((n) => isecPos(n));
      c.pathI = 0;
    }
    while (c.pathI < c.path.length - 1 && Math.hypot(c.path[c.pathI].x - v.x, c.path[c.pathI].z - v.z) < 6) c.pathI++;
    let tx: number;
    let tz: number;
    const sp = Math.abs(v.speed);
    if (direct) { tx = direct.x; tz = direct.z; } else if (c.path.length) {
      const L = clamp(7 + sp * 0.55, 8, 24);
      const tp = pointOnPath(c.path, c.pathI, v.x, v.z, L);
      tx = tp.x; tz = tp.z;
    } else { tx = v.x + Math.sin(v.heading) * 20; tz = v.z + Math.cos(v.heading) * 20; }
    let vt = speed;
    // slow for corners
    const ahead = c.path[Math.min(c.pathI + 1, c.path.length - 1)];
    if (ahead && !direct) {
      const dd = pathDistanceTo(c.path, c.pathI, Math.min(c.pathI + 1, c.path.length - 1), v.x, v.z);
      const hdg = headingTo(ahead.x - v.x, ahead.z - v.z);
      const turn = Math.abs(Math.atan2(Math.sin(hdg - v.heading), Math.cos(hdg - v.heading)));
      if (turn > 0.6 && dd < 26) vt = Math.min(vt, 8 - Math.min(turn, 1.4) * 2.5);
    }
    const ob = obstacleAhead(g, v, v.heading, 8 + sp * 1.2, v.def.width * 0.5 + 0.3);
    const pv = g.playerVehicle();
    if (ob && ob.gap < 12) {
      // ramming allowed against the player's vehicle; yield to everything else
      const ramming = pv && c.mode === 'Pursue' && this.tier >= 2 && ob.kind === 'vehicle' && Math.hypot(pv.x - v.x, pv.z - v.z) < ob.gap + 6;
      if (!ramming) vt = Math.min(vt, Math.max(0, ob.speed + (ob.gap - 3.2) * 0.8));
    }
    let throttle = speedCommand(v, vt);
    let steer = pursueSteer(v, tx, tz);
    // jam recovery
    if (c.recoverT > 0) { c.recoverT -= dt; throttle = -0.8; steer = -steer; }
    else if (sp < 0.6 && vt > 3) { c.stuckT += dt; if (c.stuckT > 2.2) { c.recoverT = 1.2; c.stuckT = 0; } } else c.stuckT = Math.max(0, c.stuckT - dt);
    if (leaving && c.pathI >= c.path.length - 1) { c.path = []; }
    stepVehicle(v, { throttle, steer, handbrake: false }, dt, g.world.surfaceAt(v.x, v.z));
    v.lights = true;
  }

  private disembark(c: PoliceCar, v: Vehicle): void {
    const g = this.g;
    c.disembarked = true;
    c.mode = 'Parked';
    let k = 0;
    for (const id of c.officers) {
      const h = g.humans.find((q) => q.id === id);
      if (!h || h.vehicleId !== v.id) continue;
      const side = k % 2 === 0 ? -1 : 1;
      const rx = Math.cos(v.heading);
      const rz = -Math.sin(v.heading);
      h.x = v.x + rx * side * (v.def.width * 0.5 + 0.9) - Math.sin(v.heading) * k;
      h.z = v.z + rz * side * (v.def.width * 0.5 + 0.9) - Math.cos(v.heading) * k;
      resolveHuman(g.world, h, 0.4, 0);
      h.vehicleId = null;
      h.state = 'Chase';
      h.stateT = 0;
      h.nextThink = 0;
      k++;
    }
    v.driverId = null;
  }

  // ------------------------------------------------------------------ officers on foot
  private updateOfficer(h: Human, dt: number): void {
    const g = this.g;
    if (!h.alive || h.state === 'Dead') return;
    if (h.vehicleId !== null) {
      const v = g.vehicleById(h.vehicleId);
      if (v) { h.x = v.x; h.z = v.z; h.heading = v.heading; }
      return;
    }
    if (h.state === 'Down') { if (g.t >= h.koUntil) { h.state = 'Chase'; h.hp = 40; } return; }
    h.fireCd = Math.max(0, h.fireCd - dt);
    const P = g.player.human;
    const pv = g.playerVehicle();
    const target = this.targetPoint();
    const d = Math.hypot(P.x - h.x, P.z - h.z);
    const los = d < 70 && g.world.lineOfSight(h.x, h.z, P.x, P.z) && !g.smokeBlocks(h.x, h.z, P.x, P.z);
    h.stateT += dt;
    const playerThreat = g.player.aiming || g.t - this.lastShotAtPoliceT < 8 || g.t - g.lastShotT < 5;
    const armedResponse = this.tier >= 3 || (this.tier >= 2 && playerThreat);
    if (this.tier === 0) { h.state = 'Search'; }
    else if (los && this.seen) h.state = armedResponse && d > 3.5 ? 'Shoot' : d < 2.2 && !pv ? 'Arrest' : 'Chase';
    else h.state = 'Search';

    let goal: V2 = target;
    let speed = 5.0;
    if (h.state === 'Shoot') {
      // hold a firing position 8-22 m out and shoot
      speed = d > 20 ? 5.2 : d < 8 ? -2 : 0;
      h.heading = dampAngle(h.heading, headingTo(P.x - h.x, P.z - h.z), 10, dt);
      if (h.fireCd <= 0 && d < 38) {
        h.fireCd = g.rng.range(0.55, 1.0);
        const w = WEAPONS.pistol;
        const dx = P.x - h.x;
        const dz = P.z - h.z;
        const dl = Math.hypot(dx, dz) || 1;
        const acc = clamp(0.62 - d * 0.014 - (Math.hypot(P.vx, P.vz) > 3 ? 0.12 : 0) - (g.player.human.crouch ? 0.1 : 0), 0.08, 0.6);
        g.emit({ type: 'gunshot', x: h.x, z: h.z, weapon: 'pistol', byPlayer: false });
        g.noise(h.x, h.z, 60, 'gunfire', false);
        if (Math.random() < acc) {
          g.emit({ type: 'tracer', x0: h.x, y0: 1.4, z0: h.z, x1: P.x, y1: 1.2, z1: P.z });
          if (pv) { pv.health = Math.max(0, pv.health - 1.5); } else damageHuman(g, g.player.human, 6 + this.tier, { lethal: true, source: 'police' });
        } else {
          const ox = (Math.random() - 0.5) * 2.4;
          g.emit({ type: 'tracer', x0: h.x, y0: 1.4, z0: h.z, x1: P.x + ox, y1: 1.1, z1: P.z + (Math.random() - 0.5) * 2.4 });
        }
        void dl; void w; void resolveShot; void traceShot;
      }
      if (speed === -2) { this.moveFoot(h, h.x - (P.x - h.x) / d, h.z - (P.z - h.z) / d, 3, dt); }
      else if (speed > 0) this.moveFootPath(h, goal, speed, dt);
      else h.speed = 0;
      return;
    }
    if (h.state === 'Arrest') {
      h.speed = 0;
      h.heading = dampAngle(h.heading, headingTo(P.x - h.x, P.z - h.z), 10, dt);
      const compliant = this.surrender || g.player.holstered || (g.player.human.hp < 35);
      const still = Math.hypot(P.vx, P.vz) < 1.5;
      if (this.tier <= 3 && compliant && still) {
        this.arrestT += dt;
        if (this.arrestT > 1.6) { this.arrestT = 0; g.onArrested(); }
      } else if (!compliant && h.fireCd <= 0) {
        // tier 1-2 officers tackle with a stun if the player resists
        h.fireCd = 1.8;
        damageHuman(g, g.player.human, 4, { lethal: false, source: 'police' });
      }
      return;
    }
    if (h.state === 'Chase') {
      goal = { x: P.x, z: P.z };
      speed = this.tier >= 2 ? 6.0 : 5.0;
      this.arrestT = 0;
    } else {
      // Search: sweep around the last known position
      if (!h.target || Math.hypot(h.target.x - h.x, h.target.z - h.z) < 3 || h.stateT > 9) {
        const a = g.rng.range(0, Math.PI * 2);
        const r = g.rng.range(5, this.searchRadius * 0.6);
        h.target = { x: target.x + Math.cos(a) * r, z: target.z + Math.sin(a) * r };
        h.stateT = 0;
      }
      goal = h.target;
      speed = 3.2;
    }
    this.moveFootPath(h, goal, speed, dt);
  }

  noteShotAtPolice(): void { this.lastShotAtPoliceT = this.g.t; }

  private moveFoot(h: Human, tx: number, tz: number, speed: number, dt: number): void {
    const dx = tx - h.x;
    const dz = tz - h.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.05) { h.speed = 0; return; }
    h.vx = (dx / d) * speed;
    h.vz = (dz / d) * speed;
    h.x += h.vx * dt;
    h.z += h.vz * dt;
    h.heading = dampAngle(h.heading, Math.atan2(dx, dz), 10, dt);
    h.speed = speed;
    h.anim += speed * dt * 1.9;
    resolveHuman(this.g.world, h, 0.35, 0);
  }

  private moveFootPath(h: Human, goal: V2, speed: number, dt: number): void {
    const g = this.g;
    // direct when clear; else follow the sidewalk graph
    if (Math.hypot(goal.x - h.x, goal.z - h.z) < 16 && g.world.lineOfSight(h.x, h.z, goal.x, goal.z, 0.9)) { h.path = []; this.moveFoot(h, goal.x, goal.z, speed, dt); return; }
    h.nextThink -= dt;
    if (h.nextThink <= 0 || !h.path.length) {
      h.nextThink = 1.5;
      const a = g.pedGraph.nearest(h.x, h.z);
      const b = g.pedGraph.nearest(goal.x, goal.z);
      h.path = g.pedGraph.route(a, b);
      h.pathI = 0;
    }
    const n = h.path[h.pathI];
    if (n === undefined) { this.moveFoot(h, goal.x, goal.z, speed, dt); return; }
    const node = g.pedGraph.nodes[n];
    if (Math.hypot(node.x - h.x, node.z - h.z) < 1.2) { h.pathI++; if (h.pathI >= h.path.length) { this.moveFoot(h, goal.x, goal.z, speed, dt); return; } }
    this.moveFoot(h, node.x, node.z, speed, dt);
  }

  get activeUnitCount(): number { return this.cars.length; }
}

function colourName(c: number): string {
  const r = (c >> 16) & 255;
  const gg = (c >> 8) & 255;
  const b = c & 255;
  const max = Math.max(r, gg, b);
  const min = Math.min(r, gg, b);
  if (max < 60) return 'black';
  if (max - min < 24) return max > 190 ? 'white' : max > 110 ? 'grey' : 'dark';
  if (r >= gg && r >= b) return gg > 120 ? 'yellow' : 'red';
  if (gg >= r && gg >= b) return 'green';
  return 'blue';
}
