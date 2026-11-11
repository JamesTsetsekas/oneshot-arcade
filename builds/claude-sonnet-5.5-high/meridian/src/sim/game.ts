import { Rng } from '../core/rng';
import { clamp, fwd } from '../core/math';
import type { GameEvent } from '../core/events';
import { DEFAULT_SETTINGS } from '../core/settings';
import type { Settings } from '../core/settings';
import { World, LINE0 } from './world';
import { PedGraph, RoadGraph, SignalController } from './nav';
import { CameraRig } from './camera';
import { TrafficSystem } from './traffic';
import { PedSystem, makeHuman, resetHumanIds } from './peds';
import { PoliceSystem } from './police';
import { ChaseSystem } from './chase';
import { MissionRuntime } from './missions';
import type { MissionDef, MissionHost, MissionResult, Marker, SpawnSpec } from './missions';
import { courierRun, recoveryCall, storyMissions, streetCircuit } from './missionDefs';
import { VEHICLES, kmh, makeVehicle, repairVehicle, resetVehicleIds, stepIdle } from './vehicle';
import type { Vehicle } from './vehicle';
import { collideVehicleWorld, collideVehicles, vehicleCircles } from './collision';
import { emptyInput } from './types';
import type { Human, InputFrame, PlayerState } from './types';
import { exitVehicle, selectSlot, updatePlayer } from './player';
import { damageHuman } from './combat';
import { OUTFITS, OUTFIT_PRICE, buy, newInventory, repairCost, SHOP, trustLevel } from './economy';
import type { ShopItem } from './economy';
import { WEAPONS } from './weapons';

export type PanelKind = 'safehouse' | 'store' | 'kiosk' | 'garage' | 'phone' | null;

export interface Prompt { text: string; key: string; action: () => void }

export interface SaveSnapshot {
  version: number;
  savedAt: number;
  t: number;
  hour: number;
  player: {
    x: number; z: number; heading: number; hp: number; armor: number; cash: number; trustXp: number; inv: PlayerState['inv'];
    outfit: number; discovered: string[]; slot: number; camYaw: number;
  };
  vehicle: { def: string; x: number; z: number; heading: number; health: number; color: number; tag?: string; inside: boolean } | null;
  mission: { snap: import('./missions').MissionSnapshot; cpPos: { x: number; z: number } | null; cpVehicleTag: string | null } | null;
  completed: Record<string, { grade: string; time: number; plays: number }>;
  stats: PlayerState['stats'];
  best: { circuit: number | null };
  tutorialDone: boolean;
}

export class Game {
  world: World;
  roads = new RoadGraph();
  pedGraph = new PedGraph();
  signals = new SignalController();
  rng: Rng;
  cam = new CameraRig();
  traffic = new TrafficSystem();
  peds = new PedSystem();
  police: PoliceSystem;
  chase = new ChaseSystem();
  missions: MissionRuntime;
  settings: Settings = { ...DEFAULT_SETTINGS };

  t = 0;
  hour = 16;
  rain = 0;
  humans: Human[] = [];
  vehicles: Vehicle[] = [];
  events: GameEvent[] = [];
  player: PlayerState;

  sprintingNow = false;
  lastShotT = -99;
  meleeSwingT = 0;
  damageFlash = 0;
  playerRecoil = 0;
  invulnerable = false;
  gadgetIdx = 0;
  smokes: Array<{ x: number; z: number; r: number; until: number }> = [];
  chirps: Array<{ x: number; z: number; until: number }> = [];
  vehicleDisabledToasted = new Set<number>();
  prompt: Prompt | null = null;
  panel: PanelKind = null;
  failInfo: { reason: string; canRetry: boolean } | null = null;
  lastResult: MissionResult | null = null;
  respawnT = 0;
  respawnReason = '';
  autosaveWanted = false;
  tutorialDone = false;
  completed: Record<string, { grade: string; time: number; plays: number }> = {};
  best: { circuit: number | null } = { circuit: null };
  defs = new Map<string, MissionDef>();
  choice: { prompt: string; options: string[]; cb: (i: number) => void } | null = null;
  missionPrompt: string | null = null;
  missionMarker: Marker | null = null;
  missionObjective = { text: '', timer: null as number | null };
  private interactQueued = false;
  private markerFuzz = new Map<string, { x: number; z: number }>();
  private cp: { pos: { x: number; z: number }; vehicleTag: string | null } | null = null;
  private baseline = { harm: 0, crimes: 0, hp: 0 };
  private impacts = 0;
  private damageTaken = 0;
  private lastCollisionT = -99;
  private lastCircuitStart = 0;
  private discoveredCheck = 0;
  private autosaveT = 0;
  stats = { collisions: 0, pedHits: 0, theft: 0 };
  timeScale = 1;
  testing = false;
  replayMode = false;
  /** Optional per-section CPU timings (ms, accumulated) for profiling and the benchmark route. */
  prof: Record<string, number> | null = null;
  playerBusy(): boolean { return this.respawnT > 0 || !this.player.human.alive; }

  constructor(seed = 1107, opts: { populate?: boolean } = {}) {
    resetVehicleIds();
    resetHumanIds();
    this.rng = new Rng(seed);
    this.world = new World(seed);
    this.police = new PoliceSystem(this);
    const h = makeHuman('player', 0, 0, 'rowan', 20);
    h.outfit = 0;
    h.state = 'Idle';
    this.player = {
      human: h, inv: newInventory(), cash: 120, trust: 0, trustXp: 0, stamina: 8, camYaw: 0, camPitch: 0.2, shoulder: 1, slot: 1, holstered: true, aiming: false,
      reloadT: 0, fireCd: 0, spread: 0, lastDamageT: -99, vaultT: 0, vaultFrom: null, vaultTo: null, vaultY: 0, enterT: 0, enterTarget: null, exitCool: 0, swimT: 0,
      steerIn: 0, throttleIn: 0, ownedVehicles: [], discovered: [], outfit: 0, stats: { civilianHarm: 0, crimes: 0, distance: 0, kills: 0 },
      aimPoint: { x: 0, y: 1, z: 0, hitKind: 'none' },
    };
    this.missions = new MissionRuntime(this.buildHost());
    for (const d of storyMissions(this.world)) this.defs.set(d.id, d);
    this.defs.set('street-circuit', streetCircuit());
    void opts;
  }

  // ------------------------------------------------------------------ helpers
  emit(e: GameEvent): void { if (this.events.length < 400) this.events.push(e); }
  toast(text: string, tone: 'info' | 'good' | 'bad' | 'warn' = 'info'): void { this.emit({ type: 'toast', text, tone }); }
  vehicleById(id: number): Vehicle | undefined { return this.vehicles.find((v) => v.id === id && v.alive); }
  humanById(id: number): Human | undefined { return this.humans.find((h) => h.id === id); }
  playerVehicle(): Vehicle | null { const id = this.player.human.vehicleId; return id === null ? null : this.vehicleById(id) ?? null; }
  get hourF(): number { return this.hour; }

  /** Sound event for NPC perception. */
  noise(x: number, z: number, radius: number, kind: string, byPlayer: boolean): void {
    this.peds.hear(this, x, z, radius, kind, byPlayer);
    if (kind === 'gunfire') {
      for (const [id] of this.traffic.ai) {
        const v = this.vehicleById(id);
        if (v && Math.hypot(v.x - x, v.z - z) < radius * 0.5) this.traffic.panic(id, 6);
      }
    }
  }

  smokeBlocks(ax: number, az: number, bx: number, bz: number): boolean {
    for (const s of this.smokes) {
      if (this.t > s.until) continue;
      const dx = bx - ax;
      const dz = bz - az;
      const l2 = dx * dx + dz * dz || 1;
      const k = clamp(((s.x - ax) * dx + (s.z - az) * dz) / l2, 0, 1);
      if (Math.hypot(ax + dx * k - s.x, az + dz * k - s.z) < s.r) return true;
    }
    return false;
  }

  deploySmoke(x: number, z: number): void {
    this.smokes.push({ x, z, r: 7, until: this.t + 11 });
    this.emit({ type: 'smoke', x, z });
    this.noise(x, z, 14, 'chirp', true);
  }

  deployChirper(x: number, z: number): void {
    this.chirps.push({ x, z, until: this.t + 5 });
    this.emit({ type: 'sfx', name: 'phone', x, z });
    this.noise(x, z, 26, 'chirp', true);
  }

  onVehicleShot(v: Vehicle, shooter: Human): void {
    if (v.owner === 'traffic') this.traffic.panic(v.id, 6);
    if (v.tag === 'van' && shooter.kind === 'player') this.traffic.panic(v.id, 4);
  }

  // ------------------------------------------------------------------ vehicles / spawning
  spawnVehicle(defId: string, x: number, z: number, heading: number, owner: Vehicle['owner'] = 'parked', color?: number): Vehicle {
    const v = makeVehicle(VEHICLES[defId], x, z, heading, owner, color);
    this.vehicles.push(v);
    return v;
  }

  removeVehicle(v: Vehicle): void {
    if (v.driverId === 0) exitVehicle(this, v, true);
    v.alive = false;
    this.traffic.release(v.id);
    this.chase.cars = this.chase.cars.filter((c) => c.vehicleId !== v.id);
  }

  onPlayerEnteredVehicle(v: Vehicle): void {
    if (this.police.tier > 0) this.police.onAppearanceChange('vehicle');
    void v;
  }

  onPlayerExitedVehicle(v: Vehicle): void { void v; }

  // ------------------------------------------------------------------ player life cycle
  newGame(): void {
    const safe = this.world.poi('safehouse');
    const h = this.player.human;
    h.x = safe.x + 2.2;
    h.z = safe.z - 4.6;
    h.heading = Math.PI / 2;
    h.hp = 100;
    this.player.camYaw = Math.PI / 2;
    this.hour = 16;
    this.t = 0;
    this.player.cash = 120;
    this.startMission('first-shift');
    this.autosaveWanted = true;
  }

  onPlayerDown(reason: string): void {
    if (this.respawnT > 0) return;
    this.respawnT = 3.2;
    this.respawnReason = reason;
    const h = this.player.human;
    h.alive = false;
    this.emit({ type: 'died', reason });
    this.emit({ type: 'fade', ms: 900, hold: 1500 });
    const pv = this.playerVehicle();
    if (pv) exitVehicle(this, pv, true);
    if (this.missions.running) this.missions.playerFailed('You were incapacitated.');
  }

  private respawnPlayer(): void {
    const P = this.player;
    const h = P.human;
    const safe = this.world.poi('safehouse');
    const fee = Math.min(P.cash, 60);
    P.cash -= fee;
    h.alive = true;
    h.hp = 100;
    h.x = safe.x;
    h.z = safe.z - 2.4;
    h.vx = h.vz = 0;
    h.y = 0;
    h.vehicleId = null;
    h.swimming = false;
    P.camYaw = Math.PI;
    P.holstered = true;
    this.police.clear();
    this.respawnT = 0;
    this.toast(fee > 0 ? `Patched up at the loft. Medical fee: $${fee}` : 'Patched up at the loft', 'warn');
  }

  onArrested(): void {
    if (this.respawnT > 0) return;
    const P = this.player;
    const tier = this.police.tier;
    const fine = Math.min(P.cash, 100 + 60 * tier);
    P.cash -= fine;
    // contraband: long guns and their ammo are confiscated; starter kit is kept
    const lost: string[] = [];
    if (P.inv.longGun) { lost.push(WEAPONS[P.inv.longGun].name); P.inv.owned = P.inv.owned.filter((o) => o !== P.inv.longGun); P.inv.longGun = null; P.slot = 1; }
    this.police.stats.arrests++;
    this.emit({ type: 'fade', ms: 800, hold: 1600 });
    this.respawnT = 2.6;
    this.respawnReason = 'arrest';
    const pv = this.playerVehicle();
    if (pv) exitVehicle(this, pv, true);
    this.toast(`Arrested. Fine paid: $${fine}.${lost.length ? ' Confiscated: ' + lost.join(', ') : ''}`, 'bad');
    if (this.missions.running) this.missions.playerFailed('You were arrested.');
    // release at the precinct once the fade is up
    this.releaseAtPrecinct = true;
  }
  private releaseAtPrecinct = false;

  private finishArrest(): void {
    const P = this.player;
    const h = P.human;
    const prec = this.world.poi('precinct');
    h.x = prec.x;
    h.z = prec.z - 3;
    h.vx = h.vz = 0;
    h.hp = Math.max(h.hp, 60);
    h.alive = true;
    P.holstered = true;
    this.police.clear();
    this.releaseAtPrecinct = false;
    this.respawnT = 0;
    this.toast('Released from the Glassline substation', 'info');
  }

  // ------------------------------------------------------------------ time
  private updateWorldClock(dt: number): void {
    const night = this.hour >= 23 || this.hour < 6;
    const speed = (7 / (45 * 60)) * (night ? 3 : 1) * this.timeScale;
    this.hour += speed * dt;
    if (this.hour >= 24) this.hour -= 24;
    const rainTarget = (this.hour > 20.8 || this.hour < 5) ? 1 : 0;
    this.rain += (rainTarget - this.rain) * Math.min(1, dt * 0.05);
    this.world.wet = this.rain;
    this.t += dt;
    for (let i = this.smokes.length - 1; i >= 0; i--) if (this.t > this.smokes[i].until + 4) this.smokes.splice(i, 1);
    for (let i = this.chirps.length - 1; i >= 0; i--) if (this.t > this.chirps[i].until) this.chirps.splice(i, 1);
  }

  // ------------------------------------------------------------------ main step
  step(inp: InputFrame, dt: number): void {
    this.updateWorldClock(dt);
    if (this.respawnT > 0) {
      this.respawnT -= dt;
      inp = emptyInput();
      if (this.respawnT < 1.4 && this.releaseAtPrecinct) this.finishArrest();
      else if (this.respawnT <= 0.9 && !this.player.human.alive) this.respawnPlayer();
    }
    // interact queue (mission prompts take priority)
    if (inp.interact) {
      if (this.missionPrompt) this.interactQueued = true;
      else if (this.prompt && this.prompt.key === 'E') this.prompt.action();
    }
    if (inp.exit && this.prompt && this.prompt.key === 'F' && this.player.human.vehicleId === null) { /* F is melee on foot */ }
    const P = this.prof;
    let t0 = P ? performance.now() : 0;
    const lap = (k: string): void => { if (P) { const n = performance.now(); P[k] = (P[k] ?? 0) + (n - t0); t0 = n; } };
    updatePlayer(this, inp, dt);
    this.cam.update(this, dt, inp.lookDX, inp.lookBack);
    if (inp.camCycle) this.cam.cycleVehicleMode();
    lap('player+cam');
    this.traffic.update(this, dt);
    lap('traffic');
    this.peds.update(this, dt);
    lap('peds');
    this.police.update(dt);
    this.police.tickDrone(dt);
    lap('police');
    this.chase.update(this, dt);
    this.updateOtherVehicles(dt);
    lap('vehicles');
    this.resolveCollisions(dt);
    lap('collisions');
    this.updateHumansMisc(dt);
    this.missions.update(dt);
    this.interactQueued = false;
    this.updateMissionVehicles();
    this.computePrompt();
    this.checkDiscoveries(dt);
    lap('misc');
    this.autosaveT += dt;
    if (this.autosaveT > 75) { this.autosaveT = 0; if (this.safeToSave()) this.autosaveWanted = true; }
  }

  safeToSave(): boolean {
    const pv = this.playerVehicle();
    return this.player.human.alive && this.respawnT <= 0 && this.police.tier === 0 && (!pv || Math.abs(pv.speed) < 18) && this.t - this.lastCollisionT > 4 && this.failInfo === null;
  }

  private updateOtherVehicles(dt: number): void {
    const policeIds = new Set(this.police.cars.map((c) => c.vehicleId));
    const chaseIds = new Set(this.chase.cars.map((c) => c.vehicleId));
    for (const v of this.vehicles) {
      if (!v.alive) continue;
      if (v.driverId === 0) continue;
      if (this.traffic.ai.has(v.id) || policeIds.has(v.id) || chaseIds.has(v.id)) continue;
      stepIdle(v, dt, this.world.surfaceAt(v.x, v.z));
    }
    // purge dead vehicles
    if (this.vehicles.some((v) => !v.alive)) this.vehicles = this.vehicles.filter((v) => v.alive);
    for (const v of this.vehicles) { v.horn = Math.max(0, v.horn - dt); }
  }

  private resolveCollisions(dt: number): void {
    const P = this.player;
    const pv = this.playerVehicle();
    const list = this.vehicles;
    for (const v of list) {
      if (!v.alive) continue;
      const moving = Math.abs(v.speed) > 0.2 || v.driverId !== null || Math.hypot(v.vx, v.vz) > 0.1;
      if (!moving) continue;
      const imp = collideVehicleWorld(this.world, v);
      if (imp.speed > 3.5) {
        this.emit({ type: 'crash', x: v.x, z: v.z, strength: imp.speed });
        if (v === pv) { this.cam.shake = Math.min(0.9, imp.speed / 20); this.lastCollisionT = this.t; this.impacts++; this.stats.collisions++; }
      }
      if (v === pv && imp.breakable.length) this.police.crime('property-damage', v.x, v.z, 0.3, { byPlayer: true });
      if (v === pv && imp.solid && imp.speed > 6) { /* hitting a building is not a crime by itself */ }
      if (imp.speed > 5 && v.owner === 'traffic') this.traffic.panic(v.id, 4);
    }
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (!a.alive) continue;
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        if (!b.alive) continue;
        if (Math.abs(a.x - b.x) > 7 || Math.abs(a.z - b.z) > 7) continue;
        const sp = collideVehicles(a, b);
        if (sp > 2.5) {
          this.emit({ type: 'crash', x: a.x, z: a.z, strength: sp });
          const involvesPlayer = a === pv || b === pv;
          if (involvesPlayer) {
            this.cam.shake = Math.min(0.9, sp / 18); this.lastCollisionT = this.t; this.impacts++; this.stats.collisions++;
            const other = a === pv ? b : a;
            if (other.owner !== 'police' && other.owner !== 'rival' && !other.tag) this.police.crime('property-damage', other.x, other.z, 0.5, { byPlayer: true });
            if (other.owner === 'police' && sp > 4) this.police.crime('attack-police', other.x, other.z, 1.6, { byPlayer: true });
          }
          for (const v of [a, b]) if (v.owner === 'traffic') this.traffic.panic(v.id, 4);
          if (sp > 3.5) this.noise((a.x + b.x) / 2, (a.z + b.z) / 2, 40, 'crash', involvesPlayer);
        }
      }
    }
    // vehicles striking people
    for (const v of list) {
      if (!v.alive) continue;
      const sp = Math.hypot(v.vx, v.vz);
      if (sp < 1.8) continue;
      const circles = vehicleCircles(v);
      const targets: Human[] = this.humans;
      for (const h of targets) {
        if (!h.alive || h.vehicleId !== null || h.state === 'Down') continue;
        if (Math.abs(h.x - v.x) > 4 || Math.abs(h.z - v.z) > 4) continue;
        for (const c of circles) {
          if (Math.hypot(h.x - c.x, h.z - c.z) < c.r + 0.35) {
            this.vehicleHitsHuman(v, h, sp);
            break;
          }
        }
      }
      const ph = P.human;
      if (ph.alive && ph.vehicleId === null && v.driverId !== 0 && ph.y < 0.5) {
        for (const c of circles) {
          if (Math.hypot(ph.x - c.x, ph.z - c.z) < c.r + 0.35) {
            damageHuman(this, ph, 6 + sp * 2.4, { lethal: true, source: 'vehicle' });
            ph.vx += v.vx * 0.5; ph.vz += v.vz * 0.5;
            this.emit({ type: 'sfx', name: 'splash' });
            break;
          }
        }
      }
    }
    void dt;
  }

  private vehicleHitsHuman(v: Vehicle, h: Human, speed: number): void {
    const byPlayer = v.driverId === 0;
    this.stats.pedHits++;
    h.vx = v.vx * 0.6; h.vz = v.vz * 0.6;
    const lethal = speed > 12;
    damageHuman(this, h, 12 + speed * 4.5, { lethal, source: 'vehicle' });
    if (h.alive && h.state !== 'Down') { h.state = 'Down'; h.koUntil = this.t + 9; h.stateT = 0; }
    this.emit({ type: 'impact', x: h.x, y: 1, z: h.z, material: 'flesh' });
    v.vx *= 0.82; v.vz *= 0.82;
    this.noise(h.x, h.z, 30, 'crash', byPlayer);
    if (byPlayer) {
      this.player.stats.civilianHarm += h.kind === 'ped' ? 2 : 0;
      this.police.crime('collision-injury', h.x, h.z, h.kind === 'police' ? 3 : 2.6, { byPlayer: true, victim: h.id });
    }
  }

  private updateHumansMisc(dt: number): void {
    // knocked-out/down handling and simple physical slide
    for (const h of this.humans) {
      if (h.state === 'Down' || h.state === 'Dead') { h.x += h.vx * dt; h.z += h.vz * dt; h.vx *= 0.9; h.vz *= 0.9; }
    }
    // remove dead humans eventually
    for (let i = this.humans.length - 1; i >= 0; i--) {
      const h = this.humans[i];
      if (!h.alive && h.stateT > 90 && h.kind !== 'player') this.humans.splice(i, 1);
    }
  }

  // ------------------------------------------------------------------ interaction prompts
  private computePrompt(): void {
    this.prompt = null;
    if (!this.player.human.alive || this.respawnT > 0 || this.player.enterT > 0) return;
    const P = this.player;
    const h = P.human;
    if (this.missionPrompt) { this.prompt = { text: this.missionPrompt, key: 'E', action: () => { /* handled via interactQueued */ } }; return; }
    const pv = this.playerVehicle();
    if (pv) {
      const g = this.world.poi('garage');
      if (Math.hypot(pv.x - g.x, pv.z - (g.z - 8)) < 14 && pv.owner !== 'police') {
        this.prompt = { text: 'E - Garage services (repair)', key: 'E', action: () => { this.panel = 'garage'; } };
      }
      return;
    }
    // witness making a call: wave them off (non-violent)
    for (const o of this.humans) {
      if (o.kind === 'ped' && o.state === 'CallEmergency' && Math.hypot(o.x - h.x, o.z - h.z) < 3.2) {
        this.prompt = { text: 'E - Wave off witness (stops the call)', key: 'E', action: () => { this.police.cancelReport(o.reportEvidence, o); o.state = 'ReactCurious'; o.reportT = 0; o.stateT = 0; this.peds.stats.interrupted++; this.toast('You talked the witness down', 'good'); } };
        return;
      }
    }
    // nearest vehicle
    let best: Vehicle | null = null;
    let bd = 3.4;
    for (const v of this.vehicles) {
      if (!v.alive) continue;
      const d = Math.hypot(v.x - h.x, v.z - h.z) - v.def.length * 0.25;
      if (d < bd) { bd = d; best = v; }
    }
    if (best) {
      const v = best;
      if (v.owner === 'police') this.prompt = { text: 'Police vehicle - locked', key: 'E', action: () => this.toast('Police vehicles are locked', 'warn') };
      else if (v.locked) this.prompt = { text: 'Vehicle locked', key: 'E', action: () => this.toast('Locked. Find another ride.', 'warn') };
      else {
        const occupied = v.driverId !== null && v.driverId !== 0;
        const mine = v.owner === 'player' || v.tag === 'kestrel';
        const text = occupied ? 'E - Take vehicle by force (driver will report)' : mine || v.owner === 'mission' || v.tag ? `E - Get in ${v.def.name}` : 'E - Take unattended vehicle (a witness may report)';
        this.prompt = { text, key: 'E', action: () => this.beginEnter(v) };
      }
      return;
    }
    const poi = this.world.nearestPoi(h.x, h.z, 5, ['safehouse', 'store', 'kiosk', 'courier']);
    if (poi) {
      if (poi.kind === 'safehouse') this.prompt = { text: 'E - Loft: save, rest, mission board', key: 'E', action: () => { this.panel = 'safehouse'; } };
      else if (poi.kind === 'store') this.prompt = { text: 'E - Brightline Convenience (shop)', key: 'E', action: () => { this.panel = 'store'; } };
      else if (poi.kind === 'kiosk') this.prompt = { text: 'E - Threadwork Kiosk (change outfit)', key: 'E', action: () => { this.panel = 'kiosk'; } };
      else if (poi.kind === 'courier') this.prompt = { text: 'E - Courier dispatch board', key: 'E', action: () => { this.panel = 'phone'; } };
    }
  }

  private beginEnter(v: Vehicle): void {
    const P = this.player;
    if (P.enterT > 0) return;
    const occupied = v.driverId !== null && v.driverId !== 0;
    const stolen = v.owner === 'traffic' || v.owner === 'parked';
    if (occupied) {
      this.peds.ejectDriver(this, v);
      this.traffic.release(v.id);
      this.police.crime('vehicle-theft', v.x, v.z, 2.4, { byPlayer: true, vehicle: v });
      this.stats.theft++;
    } else if (stolen && !v.tag) {
      this.police.crime('vehicle-theft', v.x, v.z, 1.3, { byPlayer: true, vehicle: v });
      this.stats.theft++;
    }
    this.traffic.release(v.id);
    P.enterT = 0.45;
    P.enterTarget = v.id;
    P.human.vx = P.human.vz = 0;
    this.toast(occupied ? 'Driver pulled out - expect a report' : stolen && !v.tag ? 'Vehicle taken' : 'Climbing in', occupied || (stolen && !v.tag) ? 'warn' : 'info');
  }

  // ------------------------------------------------------------------ landmarks
  private checkDiscoveries(dt: number): void {
    this.discoveredCheck -= dt;
    if (this.discoveredCheck > 0) return;
    this.discoveredCheck = 0.5;
    const h = this.player.human;
    for (const p of this.world.pois) {
      if (!p.landmark || this.player.discovered.includes(p.id)) continue;
      if (Math.hypot(p.x - h.x, p.z - h.z) < 32) {
        this.player.discovered.push(p.id);
        this.player.cash += 25;
        this.toast(`Landmark discovered: ${p.name} (+$25)`, 'good');
        this.emit({ type: 'sfx', name: 'pickup' });
      }
    }
  }

  // ------------------------------------------------------------------ missions
  availableMissions(): Array<{ def: MissionDef; locked: string | null }> {
    const out: Array<{ def: MissionDef; locked: string | null }> = [];
    for (const d of this.defs.values()) {
      let locked: string | null = null;
      if (d.requires?.mission && !this.completed[d.requires.mission]) locked = 'Complete ' + (this.defs.get(d.requires.mission)?.title ?? d.requires.mission) + ' first';
      out.push({ def: d, locked });
    }
    return out;
  }

  /** Activities generated on demand (seeded by elapsed time so each request differs). */
  makeActivity(kind: 'courier-fragile' | 'courier-urgent' | 'courier-quiet' | 'recovery' | 'circuit'): MissionDef {
    const seed = Math.floor(this.t * 7) + this.rng.int(1, 9999);
    if (kind === 'circuit') return streetCircuit();
    if (kind === 'recovery') return recoveryCall(this.world, seed);
    return courierRun(this.world, seed, kind === 'courier-fragile' ? 'fragile' : kind === 'courier-urgent' ? 'urgent' : 'quiet');
  }

  activitiesUnlocked(): boolean { return !!this.completed['first-shift']; }

  startMission(id: string | MissionDef): boolean {
    if (this.missions.running) { this.toast('Finish or abandon your current job first', 'warn'); return false; }
    const def = typeof id === 'string' ? this.defs.get(id) : id;
    if (!def) return false;
    if (def.requires?.mission && !this.completed[def.requires.mission]) { this.toast('Not available yet', 'warn'); return false; }
    this.defs.set(def.id, def);
    this.failInfo = null;
    this.lastResult = null;
    this.replayMode = false;
    this.baseline = { harm: this.player.stats.civilianHarm, crimes: this.player.stats.crimes, hp: this.player.human.hp };
    this.impacts = 0;
    this.damageTaken = 0;
    this.cp = null;
    this.missions.start(def);
    return true;
  }

  abandonMission(): void {
    this.missions.abandon();
    this.failInfo = null;
    this.toast('Back to free roam', 'info');
  }

  retryMission(): void {
    this.failInfo = null;
    this.missions.retry();
  }

  currentMarker(): { x: number; z: number; r: number; label: string } | null {
    const m = this.missionMarker;
    if (!m) return null;
    if (m.tag) {
      const v = this.vehicles.find((q) => q.tag === m.tag && q.alive);
      const hn = this.humans.find((q) => q.tag === m.tag);
      const px = v ? v.x : hn ? hn.x : m.x;
      const pz = v ? v.z : hn ? hn.z : m.z;
      if (m.r) {
        const key = m.tag + ':' + m.r;
        let f = this.markerFuzz.get(key);
        if (!f) { f = { x: px + (this.rng.next() - 0.5) * m.r * 0.6, z: pz + (this.rng.next() - 0.5) * m.r * 0.6 }; this.markerFuzz.set(key, f); }
        return { x: f.x, z: f.z, r: m.r, label: m.label ?? '' };
      }
      return { x: px, z: pz, r: 0, label: m.label ?? '' };
    }
    return { x: m.x, z: m.z, r: m.r ?? 0, label: m.label ?? '' };
  }

  private updateMissionVehicles(): void {
    const P = this.player.human;
    for (const v of this.vehicles) {
      if (!v.alive || v.tag !== 'van' || v.owner !== 'mission') continue;
      const ai = this.traffic.ai.get(v.id);
      if (ai) {
        const d = Math.hypot(v.x - P.x, v.z - P.z);
        if (d < 75 && this.world.lineOfSight(v.x, v.z, P.x, P.z)) this.traffic.panic(v.id, 4);
        const hp = v.health / v.def.health;
        if (hp < 0.55 || v.tireDamage > 0.45) {
          // the thief gives up
          this.traffic.release(v.id);
          const d2 = this.peds.ejectDriver(this, v);
          if (d2) { d2.role = 'thief'; d2.tag = 'thief'; }
          v.engineOn = false;
          this.toast('The thief bails out - the van is yours', 'good');
        }
      }
    }
  }

  // ------------------------------------------------------------------ mission host
  private buildHost(): MissionHost {
    return {
      time: () => this.t,
      player: () => {
        const pv = this.playerVehicle();
        return { x: this.player.human.x, z: this.player.human.z, onFoot: pv === null, vehicleTag: pv?.tag ?? null, speed: pv ? Math.abs(pv.speed) : this.player.human.speed, tier: this.police.tier };
      },
      vehicle: (tag) => {
        const v = this.vehicles.find((q) => q.tag === tag);
        if (!v) return null;
        return { x: v.x, z: v.z, speed: v.speed, healthPct: (v.health / v.def.health) * 100, cargo: v.cargo ?? null, alive: v.alive, driverIsPlayer: v.driverId === 0, disabled: v.health / v.def.health < 0.55 || v.tireDamage > 0.45 || v.stalled || (v.driverId === null && !this.traffic.ai.has(v.id)) };
      },
      canSee: (tag, range) => {
        const v = this.vehicles.find((q) => q.tag === tag && q.alive);
        if (!v) return false;
        const P = this.player.human;
        const d = Math.hypot(v.x - P.x, v.z - P.z);
        return d < range && (d < 14 || this.world.lineOfSight(P.x, P.z, v.x, v.z));
      },
      consumeInteract: () => { const r = this.interactQueued; this.interactQueued = false; return r; },
      setPrompt: (t) => { this.missionPrompt = t; },
      say: (line) => { if (line.who) this.emit({ type: 'subtitle', speaker: line.who, text: line.text, ms: line.ms ?? 3200 }); },
      banner: (title, sub) => this.emit({ type: 'banner', title, sub }),
      setObjective: (text, timer) => { this.missionObjective = { text, timer }; },
      setMarker: (m) => { this.missionMarker = m; },
      spawn: (s) => this.spawnSpec(s),
      cleanup: (tags, keep) => this.cleanupTags(tags, keep),
      reward: (cash, trust, grade, notes) => {
        if (this.replayMode) { this.toast('Replay complete: grade ' + grade + ' recorded (no duplicate reward)', 'good'); return; }
        this.player.cash += cash;
        const before = trustLevel(this.player.trustXp);
        this.player.trustXp += trust;
        this.player.trust = trustLevel(this.player.trustXp);
        this.emit({ type: 'sfx', name: 'cash' });
        this.toast(`Mission complete: grade ${grade}, +$${cash}`, 'good');
        if (this.player.trust > before) this.toast(`Trust increased to level ${this.player.trust}`, 'good');
        void notes;
      },
      spend: (cash) => { if (this.player.cash < cash) return false; this.player.cash -= cash; return true; },
      restore: (cp) => this.restoreCheckpoint(cp),
      checkpoint: (id) => {
        const pv = this.playerVehicle();
        this.cp = { pos: { x: this.player.human.x, z: this.player.human.z }, vehicleTag: pv?.tag ?? null };
        this.autosaveWanted = true;
        this.emit({ type: 'toast', text: 'Checkpoint reached', tone: 'info' });
        void id;
      },
      requestGreen: (axis) => this.signals.requestGreen(axis, this.t, 14),
      stats: () => {
        const van = this.vehicles.find((v) => v.tag === 'van');
        return {
          damageTaken: this.damageTaken, civilianHarm: this.player.stats.civilianHarm - this.baseline.harm,
          crimes: this.player.stats.crimes - this.baseline.crimes, vehicleImpacts: this.impacts, cargo: van && van.cargo !== undefined ? van.cargo : null,
        };
      },
      failed: (reason) => { this.failInfo = { reason, canRetry: true }; this.emit({ type: 'missionFailed', reason }); this.emit({ type: 'sfx', name: 'fail' }); },
      completed: (res) => {
        this.lastResult = res;
        const prev = this.completed[res.id.startsWith('courier') ? 'courier' : res.id.startsWith('recovery') ? 'recovery' : res.id];
        const key = res.id.startsWith('courier') ? 'courier' : res.id.startsWith('recovery') ? 'recovery' : res.id;
        this.completed[key] = { grade: prev && prev.grade < res.grade ? prev.grade : res.grade, time: prev ? Math.min(prev.time, res.time) : res.time, plays: (prev?.plays ?? 0) + 1 };
        if (res.id === 'first-shift') this.tutorialDone = true;
        if (res.id === 'street-circuit' && (this.best.circuit === null || res.time < this.best.circuit)) this.best.circuit = res.time;
        this.emit({ type: 'sfx', name: 'win' });
        this.autosaveWanted = true;
      },
      choose: (prompt, options, cb) => { this.choice = { prompt, options, cb: (i) => { this.choice = null; cb(i); } }; },
    };
  }

  /** Called by the UI each frame to accumulate player damage statistics for grading. */
  noteDamage(amount: number): void { this.damageTaken += amount; }

  private farLanePoint(from: { x: number; z: number }, min: number): { x: number; z: number; heading: number } {
    const P = this.player.human;
    for (let k = 0; k < 80; k++) {
      const lane = this.rng.pick(this.roads.lanes);
      const s = this.rng.range(8, lane.length - 10);
      const x = lane.p0.x + lane.dir.x * s;
      const z = lane.p0.z + lane.dir.z * s;
      if (Math.hypot(x - from.x, z - from.z) < min) continue;
      if (Math.hypot(x - P.x, z - P.z) < 110) continue;
      if (this.traffic.inView(this.cam.pose, x, z)) continue;
      return { x, z, heading: Math.atan2(lane.dir.x, lane.dir.z) };
    }
    return { x: 0, z: LINE0 + 80, heading: 0 };
  }

  private spawnSpec(s: SpawnSpec): void {
    const P = this.player.human;
    if (s.kind === 'vehicle') {
      // replace any existing vehicle with this tag
      for (const o of this.vehicles) if (o.tag === s.tag) this.removeVehicle(o);
      let x = s.x; let z = s.z; let heading = s.heading;
      if (s.farFrom) { const p = this.farLanePoint(s.farFrom, s.farFrom.min); x = p.x; z = p.z; heading = p.heading; }
      else if (x === 0 && z === 0 && this.cp) { x = this.cp.pos.x + Math.sin(P.heading) * 3; z = this.cp.pos.z + Math.cos(P.heading) * 3; }
      const v = this.spawnVehicle(s.def, x, z, heading, s.behavior === 'flee' ? 'mission' : s.ownedByPlayer ? 'player' : 'mission', s.color);
      v.tag = s.tag;
      v.locked = false;
      if (s.cargo) v.cargo = 100;
      if (s.behavior === 'flee') {
        v.driverId = -1;
        this.traffic.adopt(this, v, true);
        const sp = 10;
        v.vx = Math.sin(heading) * sp; v.vz = Math.cos(heading) * sp; v.speed = sp;
      }
    } else if (s.kind === 'npc') {
      this.humans = this.humans.filter((h) => h.tag !== s.tag);
      const h = makeHuman('ped', s.x, s.z, s.role, s.variant ?? 3);
      h.tag = s.tag;
      h.state = 'Work';
      h.heading = Math.PI;
      this.humans.push(h);
    } else if (s.kind === 'chasers') {
      for (let i = 0; i < s.count; i++) {
        const p = this.farLanePoint(P, s.behind);
        const v = this.spawnVehicle(s.def, p.x + i * 4, p.z, p.heading, 'rival', 0x7a1f2b);
        v.tag = s.tag + i;
        v.engineOn = true;
        v.driverId = -2;
        v.vx = Math.sin(p.heading) * 12; v.vz = Math.cos(p.heading) * 12; v.speed = 12;
        this.chase.add(v, s.tag);
      }
    }
  }

  private cleanupTags(tags: string[], keep: string[]): void {
    for (const v of [...this.vehicles]) {
      if (!v.tag) continue;
      const hit = tags.some((t) => v.tag === t || v.tag!.startsWith(t));
      if (keep.includes(v.tag)) { v.tag = undefined; v.owner = 'player'; continue; }
      if (hit) {
        if (v.driverId === 0) exitVehicle(this, v, true);
        v.alive = false;
        this.traffic.release(v.id);
      }
    }
    for (const t of tags) this.chase.removeTag(t);
    this.humans = this.humans.filter((h) => !(h.tag && tags.includes(h.tag)));
    this.vehicles = this.vehicles.filter((v) => v.alive);
  }

  private restoreCheckpoint(cp: { id: string; specs: SpawnSpec[] }): void {
    const P = this.player;
    const h = P.human;
    const info = this.cp;
    if (info) { h.x = info.pos.x; h.z = info.pos.z; }
    h.hp = 100; h.alive = true; h.vx = h.vz = 0;
    this.police.clear();
    const pv = this.playerVehicle();
    if (pv) exitVehicle(this, pv, true);
    for (const s of cp.specs) this.spawnSpec(s);
    if (info?.vehicleTag) {
      const v = this.vehicles.find((q) => q.tag === info.vehicleTag);
      if (v) { v.x = h.x; v.z = h.z; v.health = Math.max(v.health, v.def.health * 0.7); v.stalled = false; h.vehicleId = v.id; v.driverId = 0; v.engineOn = true; v.heading = h.heading; }
    }
    this.failInfo = null;
  }

  // ------------------------------------------------------------------ shops & garage
  buyItem(item: ShopItem): { ok: boolean; reason?: string } {
    const r = buy(this.player, item);
    if (r.ok) { this.emit({ type: 'sfx', name: 'cash' }); this.toast(`Purchased: ${item.label}`, 'good'); }
    else this.toast(r.reason ?? 'Cannot buy', 'warn');
    return r;
  }
  shopItems(): ShopItem[] { return SHOP; }

  buyOutfit(idx: number): boolean {
    const P = this.player;
    if (idx === P.outfit) return false;
    if (P.cash < OUTFIT_PRICE) { this.toast('Not enough cash', 'warn'); return false; }
    P.cash -= OUTFIT_PRICE;
    P.outfit = idx;
    P.human.outfit = idx;
    this.toast('New outfit: ' + OUTFITS[idx], 'good');
    this.police.onAppearanceChange('outfit');
    return true;
  }

  repairPlayerVehicle(): boolean {
    const v = this.playerVehicle();
    if (!v) return false;
    const cost = repairCost(v.health, v.def.health);
    if (cost <= 0) { this.toast('Nothing to repair', 'info'); return false; }
    if (this.player.cash < cost) { this.toast(`Repair costs $${cost}`, 'warn'); return false; }
    this.player.cash -= cost;
    repairVehicle(v);
    this.toast(`Vehicle repaired ($${cost})`, 'good');
    this.emit({ type: 'sfx', name: 'cash' });
    return true;
  }

  restAtSafehouse(): void {
    const h = this.player.human;
    h.hp = 100;
    this.player.stamina = 8;
    this.autosaveWanted = true;
    this.toast('Rested at the loft. Progress saved.', 'good');
  }

  // ------------------------------------------------------------------ save / load
  snapshot(): SaveSnapshot {
    const P = this.player;
    const h = P.human;
    const pv = this.playerVehicle();
    const owned = pv ?? this.vehicles.find((v) => v.owner === 'player' && v.alive && Math.hypot(v.x - h.x, v.z - h.z) < 400) ?? null;
    const ms = this.missions.snapshot();
    return {
      version: 2, savedAt: Date.now(), t: this.t, hour: this.hour,
      player: { x: pv ? pv.x : h.x, z: pv ? pv.z : h.z, heading: h.heading, hp: h.hp, armor: h.armor, cash: P.cash, trustXp: P.trustXp, inv: JSON.parse(JSON.stringify(P.inv)), outfit: P.outfit, discovered: [...P.discovered], slot: P.slot, camYaw: P.camYaw },
      vehicle: owned && owned.def ? { def: owned.def.id, x: owned.x, z: owned.z, heading: owned.heading, health: owned.health, color: owned.color, tag: owned.tag, inside: pv === owned } : null,
      mission: ms && this.missions.status !== 'complete' ? { snap: ms, cpPos: this.cp?.pos ?? null, cpVehicleTag: this.cp?.vehicleTag ?? null } : null,
      completed: JSON.parse(JSON.stringify(this.completed)), stats: { ...P.stats }, best: { ...this.best }, tutorialDone: this.tutorialDone,
    };
  }

  loadSnapshot(s: SaveSnapshot): void {
    const P = this.player;
    const h = P.human;
    this.vehicles = [];
    this.humans = [];
    this.traffic.ai.clear();
    this.police.clear();
    this.chase.cars = [];
    this.t = s.t; this.hour = s.hour;
    h.x = s.player.x; h.z = s.player.z; h.heading = s.player.heading; h.hp = clamp(s.player.hp, 30, 100); h.armor = s.player.armor;
    h.vehicleId = null; h.alive = true; h.y = 0;
    P.cash = s.player.cash; P.trustXp = s.player.trustXp; P.trust = trustLevel(s.player.trustXp);
    P.inv = { ...newInventory(), ...s.player.inv };
    P.outfit = s.player.outfit; h.outfit = s.player.outfit; P.discovered = [...s.player.discovered]; P.slot = s.player.slot; P.camYaw = s.player.camYaw;
    P.stats = { ...P.stats, ...s.stats };
    this.completed = JSON.parse(JSON.stringify(s.completed));
    this.best = { ...s.best };
    this.tutorialDone = s.tutorialDone;
    this.failInfo = null;
    this.cp = null;
    this.missions = new MissionRuntime(this.buildHost());
    if (s.vehicle) {
      const v = this.spawnVehicle(s.vehicle.def, s.vehicle.x, s.vehicle.z, s.vehicle.heading, 'player', s.vehicle.color);
      v.health = s.vehicle.health;
      v.tag = s.vehicle.tag;
      if (s.vehicle.inside) { h.vehicleId = v.id; v.driverId = 0; v.engineOn = true; }
    }
    if (s.mission) {
      const def = this.defs.get(s.mission.snap.id);
      if (def) {
        this.cp = s.mission.cpPos ? { pos: s.mission.cpPos, vehicleTag: s.mission.cpVehicleTag } : null;
        this.baseline = { harm: P.stats.civilianHarm, crimes: P.stats.crimes, hp: h.hp };
        this.missions.resume(def, s.mission.snap);
      }
    }
  }

  // ------------------------------------------------------------------ utilities for UI/tests
  speedKmh(): number { const v = this.playerVehicle(); return v ? kmh(v) : 0; }
  equipSlot(n: number): void { selectSlot(this, n); }
  outfitName(): string { return OUTFITS[this.player.outfit]; }
  forward(): { x: number; z: number } { return fwd(this.player.human.heading); }
}
