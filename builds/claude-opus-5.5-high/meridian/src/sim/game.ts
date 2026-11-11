// Game session: fixed-step simulation that composes the district, player, vehicles, traffic,
// pedestrians, police, combat, missions, economy and persistence. Renderer, audio and UI
// read from it; nothing here touches the DOM.

import { clamp, dist2, Rng, wrapAngle, fmtTime } from "../core/math";
import {
  getDistrict, terrainHeight, waterSurfaceAt, surfaceAt, roadAt, districtAt, DISTRICT_NAMES,
  type District, type InteractPoint, type Collider, type PropDef, type Surface,
} from "../world/district";
import { StaticWorld, circleORect, rayORect, satORect, satORectAabb } from "../world/collision";
import { RoadGraph } from "../world/roadgraph";
import { Vehicle, VEHICLES, type VehicleControls, type VehicleEnv, type VehicleModel } from "./vehicle";
import { Character, stepFoot, WALK, JOG, SPRINT, CROUCH, SKINS, HAIRS, type FootEnv, type Look, type PedRole } from "./character";
import { TrafficSystem } from "./traffic";
import { PedSystem } from "./peds";
import { PoliceSystem, type CrimeType } from "./police";
import { CombatSystem } from "./combat-ai";
import { CameraRig } from "./camera";
import { DriveAI } from "./drive-ai";
import {
  WEAPONS, GADGETS, OUTFITS, newInventory, carried, reloadInto, damageAt, zoneFor, ZONE_MULT, addTrust, buy as buyItem, canBuy, equip,
  type Inventory, type WeaponId, type WeaponSpec, type ShopItem, type GadgetId,
} from "./weapons";
import { MissionRunner, type MissionDef, type MissionHost, type Marker, type SpawnRequest, type VehicleInfo } from "./missions/runtime";
import { STORY, STORY_GIVER, nextStory } from "./missions/story";
import { generateCourier, circuitDef, generateRecovery, recoveryBonus, CIRCUIT_POINTS } from "./missions/activities";
import { SAVE_VERSION, type SaveSnapshot, type Settings, DEFAULT_SETTINGS } from "../persistence/save";

export interface InputState {
  moveX: number; moveZ: number;
  lookDX: number; lookDY: number;
  sprint: boolean; walk: boolean;
  crouchPressed: boolean;
  jumpPressed: boolean;
  interactPressed: boolean; interactHeld: boolean;
  fireHeld: boolean; firePressed: boolean;
  aimHeld: boolean;
  reloadPressed: boolean;
  meleePressed: boolean;
  throwPressed: boolean;
  gadgetCycle: boolean;
  slot: number | null;
  holsterPressed: boolean;
  shoulderPressed: boolean;
  medkitPressed: boolean;
  throttle: number; brake: number; steer: number; handbrake: boolean;
  horn: boolean; camCycle: boolean; lookBack: boolean; exitPressed: boolean; radioNext: boolean; resetHeld: boolean;
}

export const emptyInput = (): InputState => ({
  moveX: 0, moveZ: 0, lookDX: 0, lookDY: 0, sprint: false, walk: false, crouchPressed: false, jumpPressed: false,
  interactPressed: false, interactHeld: false, fireHeld: false, firePressed: false, aimHeld: false, reloadPressed: false,
  meleePressed: false, throwPressed: false, gadgetCycle: false, slot: null, holsterPressed: false, shoulderPressed: false, medkitPressed: false,
  throttle: 0, brake: 0, steer: 0, handbrake: false, horn: false, camCycle: false, lookBack: false, exitPressed: false, radioNext: false, resetHeld: false,
});

export type Fx =
  | { type: "shot"; x: number; y: number; z: number; tx: number; ty: number; tz: number; weapon: WeaponId; player: boolean }
  | { type: "impact"; x: number; y: number; z: number; mat: "spark" | "dust" | "glass" | "water" | "body" }
  | { type: "horn"; x: number; y: number; z: number; id: number }
  | { type: "crash"; x: number; y: number; z: number; power: number }
  | { type: "splash"; x: number; y: number; z: number }
  | { type: "smoke"; x: number; y: number; z: number; r: number }
  | { type: "chirp"; x: number; y: number; z: number }
  | { type: "alert"; x: number; y: number; z: number; tier: number }
  | { type: "stun"; x: number; y: number; z: number; tx: number; ty: number; tz: number }
  | { type: "melee"; x: number; y: number; z: number }
  | { type: "ui"; x: number; y: number; z: number; sound: "click" | "cash" | "mission" | "fail" | "photo" | "lock" | "door" | "phone" | "checkpoint" };

export interface Subtitle { speaker: string; text: string; until: number; kind: "dialogue" | "bark" | "dispatch" | "radio" }
export interface Toast { text: string; until: number }
export type Panel = null | "shop" | "kiosk" | "locker" | "board" | "repair" | "police" | "result" | "fail" | "dead" | "busted" | "rest" | "garage";

export interface UiState {
  toasts: Toast[];
  subtitles: Subtitle[];
  prompt: string | null;
  objective: string;
  optional: { text: string; done: boolean }[];
  timer: number | null;
  markers: Marker[];
  gps: number[] | null;
  waypoint: { x: number; z: number } | null;
  choice: { prompt: string; options: { label: string; hint: string }[] } | null;
  choiceResult: number | null;
  panel: Panel;
  panelData: any;
  lockpick: { id: string; t: number; hits: number; misses: number; zone: number; width: number; flash: number } | null;
  banner: { title: string; sub: string; until: number } | null;
  fade: number;
  damageFlash: number;
  hitMarker: number;
  wheel: boolean;
  missionTitle: string;
}

interface DynProp { def: PropDef; knocked: boolean; t: number; vx: number; vz: number; ox: number; oz: number; tilt: number; tiltDir: number; dirty: boolean }

export interface Thrown { kind: GadgetId; x: number; y: number; z: number; vx: number; vy: number; vz: number; t: number; live: boolean; until: number; nextChirp: number }

const LOOK_PALETTES: Record<string, { top: [number, number, number][]; bottom: [number, number, number][] }> = {
  commuter: { top: [[0.25, 0.3, 0.4], [0.5, 0.5, 0.52], [0.7, 0.68, 0.62], [0.2, 0.22, 0.25], [0.55, 0.35, 0.3]], bottom: [[0.15, 0.16, 0.2], [0.3, 0.3, 0.32], [0.4, 0.35, 0.28]] },
  vendor: { top: [[0.85, 0.5, 0.3], [0.9, 0.82, 0.6], [0.4, 0.6, 0.45]], bottom: [[0.3, 0.25, 0.2], [0.2, 0.25, 0.3]] },
  dock: { top: [[0.9, 0.55, 0.15], [0.85, 0.75, 0.2], [0.3, 0.4, 0.5]], bottom: [[0.2, 0.25, 0.35], [0.25, 0.22, 0.2]] },
  tourist: { top: [[0.95, 0.85, 0.6], [0.4, 0.75, 0.8], [0.95, 0.55, 0.6], [0.8, 0.85, 0.4]], bottom: [[0.75, 0.7, 0.6], [0.3, 0.4, 0.55], [0.85, 0.85, 0.82]] },
  courier: { top: [[0.95, 0.45, 0.2], [0.2, 0.6, 0.55]], bottom: [[0.15, 0.15, 0.18]] },
  musician: { top: [[0.55, 0.2, 0.35], [0.2, 0.2, 0.2]], bottom: [[0.1, 0.1, 0.12]] },
  resident: { top: [[0.7, 0.5, 0.6], [0.5, 0.65, 0.55], [0.85, 0.8, 0.7], [0.4, 0.45, 0.65]], bottom: [[0.3, 0.3, 0.35], [0.45, 0.4, 0.35], [0.2, 0.2, 0.25]] },
  security: { top: [[0.18, 0.2, 0.24]], bottom: [[0.14, 0.15, 0.17]] },
  police: { top: [[0.14, 0.24, 0.4]], bottom: [[0.1, 0.12, 0.18]] },
  rival: { top: [[0.5, 0.1, 0.12], [0.15, 0.15, 0.15]], bottom: [[0.12, 0.12, 0.12]] },
};

export const DOORS: Record<string, Collider> = {
  shed_s: { x0: -297, x1: -291, z0: -165.3, z1: -164.7, y0: -1, y1: 6, kind: "wall" },
  shed_w: { x0: -325.3, x1: -324.7, z0: -147.2, z1: -144.8, y0: -1, y1: 6, kind: "wall" },
};

const MEDICAL_FEE = 100;
const DT = 1 / 60;

export class Game implements MissionHost {
  d: District;
  world: StaticWorld;
  roads: RoadGraph;
  rng = new Rng(2026);
  time = 0;
  clock = { hour: 15, day: 1, rate: 8 / 2700, get isNight() { return this.hour >= 19.6 || this.hour < 6; } };
  weather = { rain: 0, target: 0, wet: 0 };
  settings: Settings;
  player: Character;
  inv: Inventory = newInventory();
  chars: Character[] = [];
  vehicles: Vehicle[] = [];
  traffic: TrafficSystem;
  peds: PedSystem;
  police: PoliceSystem;
  combat: CombatSystem;
  cam = new CameraRig();
  input: InputState = emptyInput();
  fx: Fx[] = [];
  ui: UiState;
  props: DynProp[] = [];
  private propGrid = new Map<number, DynProp[]>();
  thrown: Thrown[] = [];
  smoke: { x: number; y: number; z: number; r: number; until: number }[] = [];
  holstered = false;
  stamina = 8;
  attract = true;
  paused = false;
  stats = { playTime: 0, crimes: 0, civHarm: 0, arrests: 0, deaths: 0, damageTaken: 0 };
  progress: SaveSnapshot["progress"] = { storyDone: [], grades: {}, rewarded: [], activeMission: null, checkpoint: null, discovered: [], circuitBest: null, circuitGhost: null, circuitAssists: null, courierRuns: 0, recoveries: 0 };
  mission: MissionRunner | null = null;
  missionReplayInv: Inventory | null = null;
  focus = { x: 0, z: 0 };
  vehEnv: VehicleEnv;
  footEnv: FootEnv;
  lastSafe = { x: -55, z: 93, yaw: 0 };
  flags = new Set<string>();
  interacts = new Set<string>();
  lockState = new Map<string, "idle" | "running" | "success" | "fail">();
  pkg = { integrity: 100, fragile: false };
  ghostRec: number[] = [];
  ghostT = 0;
  circuitActive = false;
  resetHold = 0;
  radioStation = 0;
  attractT = 0;
  onAutosave: ((label: string) => void) | null = null;
  private crimeCd = new Map<string, number>();
  private saySchedule: { c: Character; text: string; dur: number; at: number }[] = [];
  private missionWaves: { tag: string; mission: string; left: number; next: number; interval: number; count: number; fromX: number; fromZ: number; toX: number; toZ: number }[] = [];
  missionAI = new Map<number, { ai: DriveAI; mode: "wander" | "pursue" | "none"; route: number[]; t: number; fleeing: boolean }>();
  private vehicleMission = new Map<number, string>();
  private alarmTimers: { at: number; c: Character }[] = [];
  private knockT = 0;

  constructor(settings?: Settings) {
    this.settings = settings ?? { ...DEFAULT_SETTINGS, binds: {} };
    this.d = getDistrict();
    this.world = new StaticWorld(this.d.colliders);
    this.roads = new RoadGraph();
    const sp = this.d.spawns.safehouse;
    this.player = new Character("player", "player", this.lookFromOutfit(0), sp.x, sp.z, 0);
    this.player.health = 100;
    this.vehEnv = {
      height: (x, z) => terrainHeight(x, z),
      surfaceHeight: (x, z) => this.groundAt(x, z),
      surface: (x, z) => this.surfaceAt(x, z),
      water: (x, z) => waterSurfaceAt(x, z),
      get wet() { return 0; },
    };
    const self = this;
    Object.defineProperty(this.vehEnv, "wet", { get() { return self.weather.wet; } });
    this.footEnv = { world: this.world, ground: (x, z) => this.groundAt(x, z), water: (x, z) => waterSurfaceAt(x, z) };
    // points of interest for pedestrians
    for (const p of this.d.props) {
      if (p.type === "stall") this.roads.addPoi(p.x, p.z + (p.yaw === 0 ? 1.8 : -1.8), "stall", this.world, 25);
      if (p.type === "bench" && this.rng.chance(0.5)) this.roads.addPoi(p.x, p.z, "bench", this.world, 20);
      if (p.breakable) this.props.push({ def: p, knocked: false, t: 0, vx: 0, vz: 0, ox: 0, oz: 0, tilt: 0, tiltDir: 0, dirty: false });
    }
    this.roads.addPoi(-330, 333, "view", this.world, 40);
    for (const p of this.props) {
      const k = Math.floor(p.def.x / 10) * 1000 + Math.floor(p.def.z / 10);
      if (!this.propGrid.has(k)) this.propGrid.set(k, []);
      this.propGrid.get(k)!.push(p);
    }
    this.traffic = new TrafficSystem(this);
    this.peds = new PedSystem(this);
    this.police = new PoliceSystem(this);
    this.combat = new CombatSystem(this);
    this.ui = {
      toasts: [], subtitles: [], prompt: null, objective: "", optional: [], timer: null, markers: [], gps: null, waypoint: null,
      choice: null, choiceResult: null, panel: null, panelData: null, lockpick: null, banner: null, fade: 0, damageFlash: 0, hitMarker: 0, wheel: false, missionTitle: "",
    };
    this.focus = { x: sp.x, z: sp.z };
  }

  // ------------------------------------------------------------ environment queries
  heightAt(x: number, z: number) { return terrainHeight(x, z); }
  groundAt(x: number, z: number) {
    const t = terrainHeight(x, z);
    return roadAt(x, z).onSidewalk ? t + 0.15 : t;
  }
  waterAt(x: number, z: number) { return waterSurfaceAt(x, z); }
  surfaceAt(x: number, z: number): Surface { return surfaceAt(this.d, x, z); }
  playerPos() { const v = this.player.vehicle; return v ? { x: v.x, z: v.z } : { x: this.player.x, z: this.player.z }; }
  playerVehicleId() { return this.player.vehicle?.id ?? -999; }
  charById(id: string) { return this.chars.find((c) => c.id === id); }
  charsNear(x: number, z: number, r: number): Character[] {
    const out: Character[] = [];
    for (const c of this.chars) if (Math.abs(c.x - x) < r && Math.abs(c.z - z) < r) out.push(c);
    if (!this.player.vehicle && !this.attract && Math.abs(this.player.x - x) < r && Math.abs(this.player.z - z) < r) out.push(this.player);
    return out;
  }

  /** Approximate frustum test from the current camera (horizontal FOV + margin). */
  isVisible(x: number, y: number, z: number, r: number): boolean {
    const c = this.cam.pos, f = this.cam.fwd;
    const dx = x - c.x, dy = y - c.y, dz = z - c.z;
    const d = Math.hypot(dx, dy, dz);
    if (d < r + 3) return true;
    if (d > 420) return false;
    const fl = Math.hypot(f.x, f.z) || 1;
    const cos = (dx * f.x + dz * f.z) / (Math.hypot(dx, dz) * fl || 1);
    const half = (this.cam.fov * Math.PI) / 360 + 0.18 + Math.atan(r / d);
    return cos > Math.cos(Math.min(Math.PI, half));
  }

  makeLook(role: PedRole | string, r: Rng): Look {
    const pal = LOOK_PALETTES[role] ?? LOOK_PALETTES.commuter;
    return {
      top: [...r.pick(pal.top)] as any, bottom: [...r.pick(pal.bottom)] as any, skin: [...r.pick(SKINS)] as any, hair: [...r.pick(HAIRS)] as any,
      accent: role === "police" ? [0.9, 0.8, 0.3] : role === "security" ? [0.85, 0.2, 0.2] : [...r.pick(pal.top)] as any,
      hat: role === "police" || role === "dock" || (role === "tourist" && r.chance(0.4)) || r.chance(0.08), bag: role === "courier" || role === "tourist" || r.chance(0.15),
      scale: r.range(0.92, 1.08), build: r.range(0.88, 1.15),
    };
  }
  lookFromOutfit(o: number): Look {
    const def = OUTFITS[o] ?? OUTFITS[0];
    return { top: def.top, bottom: def.bottom, skin: [0.78, 0.58, 0.44], hair: [0.12, 0.09, 0.08], accent: def.accent, hat: def.hat, bag: true, scale: 1, build: 1 };
  }

  emit(f: Fx) { this.fx.push(f); if (this.fx.length > 400) this.fx.splice(0, 100); }
  toast(text: string, dur = 3.5) { this.ui.toasts.push({ text, until: this.time + dur }); if (this.ui.toasts.length > 5) this.ui.toasts.shift(); }
  subtitle(speaker: string, text: string, dur: number, kind: Subtitle["kind"]) {
    this.ui.subtitles.push({ speaker, text, until: this.time + dur, kind });
    if (this.ui.subtitles.length > 4) this.ui.subtitles.shift();
  }
  sayLater(c: Character, text: string, dur: number, delay: number) { this.saySchedule.push({ c, text, dur, at: this.time + delay }); }
  banner(title: string, sub: string, dur = 4) { this.ui.banner = { title, sub, until: this.time + dur }; }

  addVehicle(v: Vehicle) { v.assist.stability = this.settings.stabilityAssist; v.assist.traction = this.settings.tractionControl; this.vehicles.push(v); }
  removeVehicle(v: Vehicle) {
    const i = this.vehicles.indexOf(v);
    if (i >= 0) this.vehicles.splice(i, 1);
    for (const c of v.crew) if (c.vehicle === v) c.removeMe = true;
    this.missionAI.delete(v.id);
    this.vehicleMission.delete(v.id);
  }

  playerHidden() {
    // inside smoke or a dark-ish courtyard at night is not enough; only smoke hides fully
    const p = this.playerPos();
    return this.smoke.some((s) => dist2(s.x, s.z, p.x, p.z) < s.r * 0.85);
  }
  missionAllowsPresence() { return this.flags.has("cover"); }

  // ------------------------------------------------------------ session lifecycle

  newGame() {
    this.resetWorld();
    this.inv = newInventory();
    this.progress = { storyDone: [], grades: {}, rewarded: [], activeMission: null, checkpoint: null, discovered: [], circuitBest: null, circuitGhost: null, circuitAssists: null, courierRuns: 0, recoveries: 0 };
    this.stats = { playTime: 0, crimes: 0, civHarm: 0, arrests: 0, deaths: 0, damageTaken: 0 };
    this.clock.hour = 15; this.clock.day = 1; this.weather.rain = this.weather.target = this.weather.wet = 0;
    const sp = this.d.spawns.safehouse;
    this.placePlayer(sp.x, sp.z, sp.yaw);
    this.player.look = this.lookFromOutfit(0);
    this.ensureOwnedVehicles();
    this.attract = false;
    this.populate();
    this.startMission(STORY[0], false);
    this.banner("Port Meridian", "South Quay — afternoon", 5);
    this.toast("WASD move · Mouse look · Shift sprint · Space jump/vault · E interact / enter vehicle", 9);
    this.toast("In vehicles: W/S drive & brake · A/D steer · Space handbrake · F exit · C camera · Q radio", 9);
  }

  resetWorld() {
    if (this.mission) { this.cleanup(this.mission.def.id); this.mission = null; }
    for (const v of [...this.vehicles]) this.traffic.removeVehicle(v);
    this.vehicles = [];
    this.chars = [];
    this.traffic.brains.clear();
    for (const s of this.traffic.spots) { s.vehicle = null; s.taken = false; }
    this.peds.brains.clear();
    this.combat.brains.clear();
    this.police.units = []; this.police.footOfficers = []; this.police.calls = [];
    this.police.clear();
    this.player.vehicle = null;
    this.player.alive = true; this.player.status = "normal"; this.player.health = 100;
    this.thrown = []; this.smoke = []; this.world.smoke = []; this.world.blockers = [];
    this.flags.clear(); this.interacts.clear(); this.lockState.clear();
    for (const p of this.props) { p.knocked = false; p.dirty = true; p.ox = p.oz = 0; p.tilt = 0; }
    this.ui.panel = null; this.ui.choice = null; this.ui.lockpick = null; this.ui.markers = []; this.ui.objective = ""; this.ui.timer = null; this.ui.optional = [];
    this.missionWaves = []; this.missionAI.clear(); this.vehicleMission.clear();
    this.ui.waypoint = null;
  }

  populate() {
    const p = this.playerPos();
    this.focus = { ...p };
    this.traffic.populate(p.x, p.z);
    this.peds.populate(p.x, p.z);
    this.spawnAmbient();
  }

  private ambientDone = false;
  private spawnAmbient() {
    // vendors behind stalls and a busker by the clock: fixed activity actors (WorkLoop)
    for (const p of this.d.props) if (p.type === "stall" && this.rng.chance(0.7)) this.peds.spawnFixed(p.x, p.z + (p.yaw === 0 ? -0.6 : 0.6), "vendor", p.yaw === 0 ? 0 : Math.PI);
    this.peds.spawnFixed(-58, -186, "musician", Math.PI);
    this.peds.spawnFixed(-80, -126.5, "courier", 0).tag = "mara";
    this.peds.spawnFixed(114, 57.2, "resident", 0).tag = "ines";
    this.ambientDone = true;
  }

  placePlayer(x: number, z: number, yaw: number) {
    const P = this.player;
    P.x = x; P.z = z; P.y = this.groundAt(x, z); P.yaw = yaw; P.vx = P.vz = P.vy = 0; P.savePrev();
    this.cam.yaw = yaw; this.cam.pitch = -0.12;
    this.focus = { x, z };
  }

  ensureOwnedVehicles() {
    const ms = this.d.spawns.motoSpot;
    let k = this.vehicles.find((v) => v.tag === "kestrel");
    if (!k) {
      k = new Vehicle("kestrel", ms.x, ms.z, ms.yaw, 0);
      k.tag = "kestrel"; k.role = "player"; k.despawnable = false; k.y = this.heightAt(k.x, k.z); k.savePrev();
      this.addVehicle(k);
    }
    if (this.inv.ownedVehicle && !this.vehicles.some((v) => v.tag === "owned")) {
      const gs = this.d.spawns.garageSlot;
      const v = new Vehicle(this.inv.ownedVehicle.model as VehicleModel, gs.x, gs.z, gs.yaw, 0);
      v.color = [...this.inv.ownedVehicle.color] as any; v.tag = "owned"; v.role = "player"; v.despawnable = false; v.y = this.heightAt(v.x, v.z); v.savePrev();
      this.addVehicle(v);
    }
  }

  // ------------------------------------------------------------ save / load

  snapshot(label: string): SaveSnapshot {
    return {
      version: SAVE_VERSION, savedAt: Date.now(), label,
      player: { x: this.lastSafe.x, z: this.lastSafe.z, yaw: this.lastSafe.yaw, health: Math.max(50, this.player.health) },
      inventory: JSON.parse(JSON.stringify(this.missionReplayInv ?? this.inv)),
      progress: JSON.parse(JSON.stringify({ ...this.progress, activeMission: null, checkpoint: null })),
      world: { hour: this.clock.hour, rain: this.weather.target, day: this.clock.day },
      stats: { playTime: this.stats.playTime, crimes: this.stats.crimes, civHarm: this.stats.civHarm, arrests: this.stats.arrests, deaths: this.stats.deaths },
    };
  }

  applySnapshot(s: SaveSnapshot) {
    this.resetWorld();
    this.inv = JSON.parse(JSON.stringify(s.inventory));
    this.progress = JSON.parse(JSON.stringify(s.progress));
    this.stats = { ...this.stats, ...s.stats, damageTaken: 0 };
    this.clock.hour = s.world.hour; this.clock.day = s.world.day;
    this.weather.target = this.weather.rain = s.world.rain; this.weather.wet = s.world.rain;
    this.placePlayer(s.player.x, s.player.z, s.player.yaw);
    this.player.health = s.player.health;
    this.player.armor = this.inv.armor;
    this.player.look = this.lookFromOutfit(this.inv.outfit);
    this.lastSafe = { ...s.player };
    this.ensureOwnedVehicles();
    this.attract = false;
    this.populate();
  }

  /** Autosave hook at safe checkpoints (mission complete, rest). */
  requestAutosave(label: string) { this.onAutosave?.(label); }

  // ------------------------------------------------------------ main step

  step(dt: number) {
    if (this.paused) return;
    this.time += dt;
    const P = this.player;
    for (const c of this.chars) c.savePrev();
    for (const v of this.vehicles) v.savePrev();
    P.savePrev();
    if (!this.attract) this.stats.playTime += dt;

    // clock & weather
    this.clock.hour += this.clock.rate * dt;
    if (this.clock.hour >= 24) { this.clock.hour -= 24; this.clock.day++; }
    this.weather.rain += (this.weather.target - this.weather.rain) * Math.min(1, dt * 0.08);
    this.weather.wet += ((this.weather.rain > 0.2 ? 1 : 0) - this.weather.wet) * Math.min(1, dt * (this.weather.rain > 0.2 ? 0.05 : 0.01));

    if (this.attract) {
      this.attractT += dt;
      const a = this.attractT * 0.04;
      this.focus = { x: -40 + Math.sin(a) * 120, z: -150 + Math.cos(a) * 90 };
    } else {
      this.focus = this.playerPos();
      this.updatePlayer(dt);
    }

    // vehicles that are not driven by a dedicated system
    for (const v of this.vehicles) {
      if (v.driver === "player") continue;
      if (this.traffic.brains.has(v.id)) continue;
      if (v.role === "police" && this.police.units.some((u) => u.vehicle === v)) continue;
      const m = this.missionAI.get(v.id);
      if (m) { this.driveMissionVehicle(v, m, dt); continue; }
      if (v.speed > 0.05 || v.airborne || v.impactTimer > 0 || Math.abs(v.w) > 0.01) this.stepVehicle(v, dt, { throttle: 0, brake: 0.6, steer: 0, handbrake: true });
      else { v.vx = v.vz = 0; v.w = 0; if (v.sinking > 0) v.sinking += dt; }
    }
    this.traffic.update(dt);
    this.police.update(dt);
    this.vehicleCollisions(dt);
    this.peds.update(dt);
    this.combat.update(dt);
    this.updateGadgets(dt);
    this.updateProps(dt);
    this.updateMissionSystems(dt);

    // scheduled barks
    for (let i = this.saySchedule.length - 1; i >= 0; i--) {
      const s = this.saySchedule[i];
      if (this.time >= s.at) { if (!s.c.removeMe) this.say(s.c, s.text, s.dur, false); this.saySchedule.splice(i, 1); }
    }
    for (let i = this.alarmTimers.length - 1; i >= 0; i--) {
      const a = this.alarmTimers[i];
      if (this.time >= a.at) {
        this.alarmTimers.splice(i, 1);
        if (a.c.alive && a.c.status === "normal") { const p = this.playerPos(); const cr = this.police.reportCrime("trespass", p.x, p.z); if (!cr.reported) this.policeCommitTrespass(cr); }
      }
    }
    // remove culled characters
    if (this.chars.some((c) => c.removeMe)) this.chars = this.chars.filter((c) => !c.removeMe);
    // UI timers
    this.ui.toasts = this.ui.toasts.filter((t) => t.until > this.time);
    this.ui.subtitles = this.ui.subtitles.filter((t) => t.until > this.time);
    if (this.ui.banner && this.ui.banner.until < this.time) this.ui.banner = null;
    if (this.ui.damageFlash > 0) this.ui.damageFlash -= dt;
    if (this.ui.hitMarker > 0) this.ui.hitMarker -= dt;
    this.world.smoke = this.smoke;
  }

  private policeCommitTrespass(cr: { reported: boolean }) {
    // a security guard radioed it in: treat as a reported crime
    (this.police as any).commit(cr, false);
  }

  // ------------------------------------------------------------ player

  private updatePlayer(dt: number) {
    const P = this.player;
    const inp = this.input;
    P.updateStatus(dt);
    this.cam.reducedMotion = this.settings.reducedMotion;
    this.cam.recenter = this.settings.camRecenter;
    this.cam.baseFov = this.settings.fov;
    if (!P.alive) { this.cam.update(dt, this.world, P, null, false, false, this.time); return; }
    this.cam.look(inp.lookDX, inp.lookDY, this.settings.sensitivity, this.settings.invertY, !!P.vehicle);
    inp.lookDX = inp.lookDY = 0;

    // health regen to 30 after 8 s
    if (this.time - P.lastHurt > 8 && P.health < 30) P.health = Math.min(30, P.health + 4 * dt);
    if (inp.medkitPressed && this.inv.medkits > 0 && P.health < 100) {
      this.inv.medkits--; P.health = Math.min(100, P.health + 60); this.toast("Medkit used (+60)");
    }
    if (this.ui.lockpick) this.updateLockpick(dt);

    if (P.vehicle) this.updateDriving(dt);
    else this.updateOnFoot(dt);

    this.cam.update(dt, this.world, P, P.vehicle, P.aiming, inp.lookBack && !!P.vehicle, this.time);
    this.updatePrompt();
    // discovery
    for (const l of this.d.landmarks) {
      if (this.progress.discovered.includes(l.id)) continue;
      const p = this.playerPos();
      if (dist2(p.x, p.z, l.x, l.z) < 45) { this.progress.discovered.push(l.id); this.toast(`Discovered: ${l.name}`); }
    }
    // remember the last safe location for saving
    if (!P.vehicle && P.grounded && !P.swimming && this.police.tier === 0 && !this.mission && this.waterAt(P.x, P.z) === null && this.time % 2 < dt) {
      this.lastSafe = { x: P.x, z: P.z, yaw: P.yaw };
    }
    // void / current boundaries
    if (P.swimming && (P.z < -432 || P.x < -440 || P.x > 440)) {
      this.toast("Strong harbor currents — returning you to the quay.");
      this.placePlayer(clamp(P.x, -400, 400), -388, 0);
    }
    // interiors: hide roofs via render; nothing to do here
  }

  private updateOnFoot(dt: number) {
    const P = this.player;
    const inp = this.input;
    if (P.status !== "normal") { P.aiming = false; P.animSpeed = 0; return; }
    if (this.police.arrest) { P.handsUp = inp.interactHeld; } else P.handsUp = false;
    // weapon selection
    const list = carried(this.inv);
    if (inp.slot !== null && list[inp.slot]) { P.weapon = list[inp.slot]; this.holstered = false; P.reloadTimer = 0; }
    if (inp.holsterPressed) this.holstered = !this.holstered;
    if (inp.shoulderPressed) this.cam.shoulder *= -1;
    if (inp.crouchPressed) P.crouch = !P.crouch;
    if (inp.gadgetCycle) { this.inv.selectedGadget = this.inv.selectedGadget === "smoke" ? "chirper" : "smoke"; this.toast(`Gadget: ${GADGETS[this.inv.selectedGadget].name} (${this.inv.gadgets[this.inv.selectedGadget]})`, 1.8); }
    const weapon = this.holstered ? "fists" : P.weapon;
    const spec = WEAPONS[weapon];
    const armed = spec.ammo !== null;
    P.aiming = inp.aimHeld && !P.swimming && !this.police.arrest;
    // movement relative to camera
    const cy = this.cam.yaw;
    const fx = Math.sin(cy), fz = Math.cos(cy);
    const wx = fx * inp.moveZ + Math.cos(cy) * inp.moveX;
    const wz = fz * inp.moveZ - Math.sin(cy) * inp.moveX;
    const moving = Math.hypot(inp.moveX, inp.moveZ) > 0.1;
    let speed = JOG;
    P.sprint = false;
    if (P.crouch) speed = CROUCH;
    else if (inp.walk) speed = WALK;
    else if (inp.sprint && moving && !P.aiming && this.stamina > 0.05) { speed = SPRINT; P.sprint = true; }
    if (P.aiming) speed = Math.min(speed, P.crouch ? CROUCH : 3.2);
    if (P.sprint) this.stamina = Math.max(0, this.stamina - dt);
    else this.stamina = Math.min(8, this.stamina + dt * (moving ? 0.9 : 1.8));
    if (this.police.arrest && inp.interactHeld) speed = 0;
    stepFoot(P, dt, wx, wz, speed, inp.jumpPressed, this.footEnv, P.aiming ? cy : undefined);
    if (P.swimming && P.weapon !== "fists") { /* weapons are holstered while swimming */ }

    // shove pedestrians out of the way
    for (const c of this.charsNear(P.x, P.z, 1.2)) {
      if (c === P || c.vehicle || !c.alive) continue;
      const dx = c.x - P.x, dz = c.z - P.z, d = Math.hypot(dx, dz);
      if (d < 0.65 && d > 1e-3) {
        const push = (0.65 - d) / d * 0.5;
        c.x += dx * push; c.z += dz * push; P.x -= dx * push * 0.4; P.z -= dz * push * 0.4;
        if (c.kind === "civilian" && P.sprint) this.peds.shove(c, P.x, P.z);
      }
    }

    // reload / fire / melee / throw
    if (P.fireCooldown > 0) P.fireCooldown -= dt;
    if (P.meleeTimer > 0) P.meleeTimer -= dt;
    if (P.reloadTimer > 0) {
      P.reloadTimer -= dt;
      if (P.reloadTimer <= 0) reloadInto(this.inv, weapon);
    }
    if (inp.reloadPressed && armed && P.reloadTimer <= 0 && (this.inv.mags[weapon] ?? 0) < spec.mag && this.inv.ammo[spec.ammo!] > 0) P.reloadTimer = spec.reload;
    if (P.swimming) return;
    const wantFire = spec.auto ? inp.fireHeld : inp.firePressed;
    if (armed && P.aiming && wantFire && P.fireCooldown <= 0 && P.reloadTimer <= 0) {
      if ((this.inv.mags[weapon] ?? 0) > 0) this.playerFire(spec);
      else if (this.inv.ammo[spec.ammo!] > 0) P.reloadTimer = spec.reload;
      else if (inp.firePressed) this.toast("Out of ammo — buy more at Harbor Supply.", 2);
    }
    if ((inp.meleePressed || (!armed && inp.firePressed && P.aiming)) && P.meleeTimer <= 0) this.playerMelee(this.holstered || !this.inv.melee ? "fists" : (spec.slot === "melee" ? weapon : (this.inv.melee ?? "fists")));
    if (inp.throwPressed) this.throwGadget();
    // weapon display: brandishing a lethal weapon in public
    if (P.aiming && spec.lethal && this.police.tier === 0 && this.cooldown("weapon", 15)) {
      const wits = this.peds.witnessesFor(P.x, P.chestY, P.z, 0, 20);
      if (wits.length) { this.reportCrime("weapon", P.x, P.z); this.peds.stimulus("aim", P.x, P.z, 18); }
    }
  }

  private cooldown(key: string, sec: number) {
    const t = this.crimeCd.get(key) ?? -999;
    if (this.time - t < sec) return false;
    this.crimeCd.set(key, this.time);
    return true;
  }

  reportCrime(type: CrimeType, x: number, z: number) {
    if (this.attract) return;
    this.police.reportCrime(type, x, z);
  }

  // ------------------------------------------------------------ weapons

  /** Ray vs characters (vertical cylinders). Returns nearest hit. */
  private rayChars(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, maxT: number, skip: Character | null) {
    let best: { c: Character; t: number; y: number } | null = null;
    const all = this.attract ? this.chars : [...this.chars, this.player];
    for (const c of all) {
      if (c === skip || c.vehicle) continue;
      const lying = c.status !== "normal";
      const h = lying ? 0.45 : c.crouch ? 1.2 : c.height;
      const r = lying ? 0.8 : c.radius + 0.08;
      const fx = ox - c.x, fz = oz - c.z;
      const a = dx * dx + dz * dz;
      if (a < 1e-9) continue;
      const b = 2 * (fx * dx + fz * dz);
      const cc = fx * fx + fz * fz - r * r;
      const disc = b * b - 4 * a * cc;
      if (disc < 0) continue;
      const t = (-b - Math.sqrt(disc)) / (2 * a);
      if (t < 0 || t > maxT) continue;
      const y = oy + dy * t;
      if (y < c.y || y > c.y + h) continue;
      if (!best || t < best.t) best = { c, t, y: y - c.y };
    }
    return best;
  }

  private rayVehicles(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, maxT: number, skip: Vehicle | null) {
    let best: { v: Vehicle; t: number } | null = null;
    for (const v of this.vehicles) {
      if (v === skip) continue;
      if (Math.abs(v.x - ox) > maxT + 6 && Math.abs(v.z - oz) > maxT + 6) continue;
      const t = rayORect(ox, oy, oz, dx, dy, dz, v.rect, v.y + 0.2, v.y + v.spec.height, maxT);
      if (t !== null && (!best || t < best.t)) best = { v, t };
    }
    return best;
  }

  private playerFire(spec: WeaponSpec) {
    const P = this.player;
    const inv = this.inv;
    inv.mags[spec.id] = (inv.mags[spec.id] ?? 0) - 1;
    P.fireCooldown = spec.interval;
    P.recoil = Math.min(1, P.recoil + 0.4);
    const moving = Math.hypot(P.vx, P.vz);
    const inVeh = P.vehicle;
    const spread = (P.aiming ? spec.aimSpread : spec.spread) + moving * 0.006 + (inVeh ? 0.03 : 0) + P.recoil * spec.recoil;
    this.cam.pitch += spec.recoil * 0.35;
    if (!this.settings.reducedMotion) this.cam.addShake(spec.recoil * 0.4);
    const c = this.cam.pos;
    const mx = inVeh ? inVeh.x + Math.cos(inVeh.yaw) * 0.4 : P.x + Math.cos(P.yaw) * 0.25 + Math.sin(P.yaw) * 0.45;
    const mz = inVeh ? inVeh.z - Math.sin(inVeh.yaw) * 0.4 : P.z - Math.sin(P.yaw) * 0.25 + Math.cos(P.yaw) * 0.45;
    const my = inVeh ? inVeh.y + 1.2 : P.y + (P.crouch ? 1.0 : 1.38);
    let anyHit = false;
    for (let k = 0; k < spec.pellets; k++) {
      let dx = this.cam.fwd.x + this.rng.range(-1, 1) * spread;
      let dy = this.cam.fwd.y + this.rng.range(-1, 1) * spread;
      let dz = this.cam.fwd.z + this.rng.range(-1, 1) * spread;
      const L = Math.hypot(dx, dy, dz); dx /= L; dy /= L; dz /= L;
      // 1) camera ray to find the aim point
      let tAim = spec.range + 4;
      const ws = this.world.raycast(c.x, c.y, c.z, dx, dy, dz, tAim, true);
      if (ws) tAim = ws.t;
      const ch = this.rayChars(c.x, c.y, c.z, dx, dy, dz, tAim, P);
      if (ch) tAim = ch.t;
      const vh = this.rayVehicles(c.x, c.y, c.z, dx, dy, dz, tAim, inVeh);
      if (vh) tAim = vh.t;
      const ax = c.x + dx * tAim, ay = c.y + dy * tAim, az = c.z + dz * tAim;
      // 2) muzzle ray to the aim point (prevents shooting through camera-only gaps)
      let ex = ax - mx, ey = ay - my, ez = az - mz;
      const md = Math.hypot(ex, ey, ez) || 1;
      ex /= md; ey /= md; ez /= md;
      const hit = this.resolveShot(mx, my, mz, ex, ey, ez, Math.min(spec.range, md + 0.5), spec, P, inVeh);
      anyHit = anyHit || hit;
    }
    if (spec.id === "stun") this.emit({ type: "stun", x: mx, y: my, z: mz, tx: mx + this.cam.fwd.x * 12, ty: my + this.cam.fwd.y * 12, tz: mz + this.cam.fwd.z * 12 });
    if (anyHit) this.ui.hitMarker = 0.15;
    // noise
    if (spec.loudness > 20) {
      this.combat.hear(mx, mz, spec.loudness, "gunfire");
      this.peds.stimulus("gunfire", mx, mz, spec.loudness * 0.8, P);
      this.traffic.panicNear(mx, mz, spec.loudness * 0.7);
      if (this.cooldown("gunfire", 4)) this.reportCrime("gunfire", mx, mz);
    }
  }

  /** Resolve a muzzle ray: static (with thin-cover penetration), characters, vehicles, cameras. */
  private resolveShot(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, range: number, spec: WeaponSpec, shooter: Character, skipV: Vehicle | null): boolean {
    let maxT = range;
    let dmgMul = 1;
    let ws = this.world.raycast(ox, oy, oz, dx, dy, dz, maxT);
    if (ws && ws.c.thin && spec.lethal) {
      // penetrate thin cover with reduced damage
      this.emit({ type: "impact", x: ox + dx * ws.t, y: oy + dy * ws.t, z: oz + dz * ws.t, mat: "dust" });
      dmgMul = 0.5;
      const t0 = ws.t + 0.6;
      const ws2 = this.world.raycast(ox + dx * t0, oy + dy * t0, oz + dz * t0, dx, dy, dz, maxT - t0, true);
      ws = ws2 ? { ...ws2, t: ws2.t + t0 } : null;
    }
    if (ws) maxT = ws.t;
    const ch = this.rayChars(ox, oy, oz, dx, dy, dz, maxT, shooter);
    if (ch) maxT = ch.t;
    const vh = this.rayVehicles(ox, oy, oz, dx, dy, dz, maxT, skipV);
    if (vh) maxT = vh.t;
    const hx = ox + dx * maxT, hy = oy + dy * maxT, hz = oz + dz * maxT;
    if (spec.id !== "stun") this.emit({ type: "shot", x: ox, y: oy, z: oz, tx: hx, ty: hy, tz: hz, weapon: spec.id, player: shooter === this.player });
    // security cameras (stun disables)
    if (spec.id === "stun") {
      for (const cam of this.police.cameras) {
        const t = ((cam.x - ox) * dx + (cam.y - oy) * dy + (cam.z - oz) * dz);
        if (t < 0 || t > maxT + 0.3) continue;
        const px = ox + dx * t - cam.x, py = oy + dy * t - cam.y, pz = oz + dz * t - cam.z;
        if (Math.hypot(px, py, pz) < 0.7) { cam.disabledUntil = this.time + 20; this.toast(`${cam.label} disabled for 20 s`); this.emit({ type: "impact", x: cam.x, y: cam.y, z: cam.z, mat: "spark" }); return true; }
      }
    }
    if (vh && (!ch || vh.t <= ch.t)) {
      const v = vh.v;
      if (spec.lethal) { v.damage(3.4 + spec.damage * 0.06); }
      this.emit({ type: "impact", x: hx, y: hy, z: hz, mat: "spark" });
      // occupants can be hit through glass occasionally
      if (spec.lethal && v.crew.length && this.rng.chance(0.25)) { const c = v.crew[0] as Character; this.damageChar(c, spec.damage * 0.6 * dmgMul, shooter, spec); }
      if (v.driver === "player" && shooter !== this.player) { this.playerHurt(spec.damage * 0.35, ox, oz); }
      return shooter === this.player;
    }
    if (ch) {
      const c = ch.c;
      if (spec.id === "stun") {
        c.knock(8, "stunned");
        this.emit({ type: "impact", x: hx, y: hy, z: hz, mat: "spark" });
        if (c.kind === "civilian") { this.peds.stimulus("assault", c.x, c.z, 15); if (shooter === this.player) this.reportCrime("assault", c.x, c.z); }
        if (c.kind === "police" && shooter === this.player) this.police.escalate("attackPolice", c.x, c.z);
        if (c.kind === "guard" || c.kind === "rival") this.combat.onHurt(c);
        if (this.police.calls.some((q) => q.witness === c)) this.police.interruptCall(c);
        return true;
      }
      const dist = maxT;
      const zone = zoneFor(ch.y, c.height);
      const dmg = damageAt(spec, dist) * ZONE_MULT[zone] * dmgMul;
      this.emit({ type: "impact", x: hx, y: hy, z: hz, mat: "body" });
      if (c === this.player) this.playerHurt(dmg, ox, oz);
      else this.damageChar(c, dmg, shooter, spec);
      return true;
    }
    if (ws) this.emit({ type: "impact", x: hx, y: hy, z: hz, mat: ws.c.kind === "building" && ws.c.y1 > 20 ? "glass" : "dust" });
    else if (hy < 0 && this.waterAt(hx, hz) !== null) this.emit({ type: "impact", x: hx, y: -0.8, z: hz, mat: "water" });
    return false;
  }

  damageChar(c: Character, dmg: number, by: Character | null, spec: WeaponSpec | null) {
    if (!c.alive) return;
    const wasAlive = c.alive;
    c.hurt(dmg, this.time);
    if (c.alive && dmg > 25 && this.rng.chance(0.4)) c.knock(1.2);
    if (by === this.player) {
      if (c.kind === "civilian") {
        this.stats.civHarm++;
        this.peds.stimulus("assault", c.x, c.z, 20);
        this.reportCrime(!c.alive ? "murder" : "assault", c.x, c.z);
        if (this.police.calls.some((q) => q.witness === c)) this.police.interruptCall(c);
      } else if (c.kind === "police") {
        this.police.policeHurtByPlayer(c, !c.alive);
      } else if (c.kind === "guard" || c.kind === "rival") {
        this.combat.onHurt(c);
        if (!c.alive && c.kind === "guard") this.reportCrime("murder", c.x, c.z);
      }
    }
    if (wasAlive && !c.alive) {
      c.knock(0);
      if (c.vehicle) { const v = c.vehicle; if (v.driver === c.id) v.driver = null; }
    }
    void spec;
  }

  playerHurt(dmg: number, fromX: number, fromZ: number) {
    const P = this.player;
    if (!P.alive || this.attract) return;
    const before = P.health;
    P.armor = this.inv.armor;
    P.hurt(dmg, this.time);
    this.inv.armor = P.armor;
    this.stats.damageTaken += before - P.health;
    this.ui.damageFlash = 0.35;
    this.cam.addShake(0.05);
    if (!P.alive) this.onPlayerDeath();
    void fromX; void fromZ;
  }

  npcFire(c: Character, spec: WeaponSpec, tx: number, ty: number, tz: number) {
    const ox = c.x + Math.sin(c.yaw) * 0.45, oz = c.z + Math.cos(c.yaw) * 0.45, oy = c.y + (c.crouch ? 1.0 : 1.4);
    let dx = tx - ox, dy = ty - oy, dz = tz - oz;
    const L = Math.hypot(dx, dy, dz) || 1;
    dx /= L; dy /= L; dz /= L;
    this.resolveShot(ox, oy, oz, dx, dy, dz, spec.range, spec, c, c.vehicle);
    if (spec.loudness > 20) {
      this.peds.stimulus("gunfire", ox, oz, spec.loudness * 0.8);
      this.traffic.panicNear(ox, oz, spec.loudness * 0.6);
    }
  }

  npcMelee(c: Character, target: Character, dmg: number) {
    if (dist2(c.x, c.z, target.x, target.z) > 1.9) return;
    this.emit({ type: "melee", x: target.x, y: target.y + 1.2, z: target.z });
    if (target === this.player) {
      this.playerHurt(dmg, c.x, c.z);
      if (this.rng.chance(0.2) && this.player.alive) this.player.knock(1.2);
    }
  }

  private playerMelee(w: WeaponId) {
    const P = this.player;
    const spec = WEAPONS[w];
    P.meleeTimer = spec.interval;
    const fx = Math.sin(P.yaw), fz = Math.cos(P.yaw);
    let target: Character | null = null, bd = spec.range + 0.4;
    for (const c of this.charsNear(P.x, P.z, 3)) {
      if (c === P || c.vehicle || !c.alive || c.status === "subdued") continue;
      const dx = c.x - P.x, dz = c.z - P.z, d = Math.hypot(dx, dz);
      if (d > bd || (dx * fx + dz * fz) / (d || 1) < 0.4) continue;
      bd = d; target = c;
    }
    this.emit({ type: "melee", x: P.x + fx, y: P.y + 1.2, z: P.z + fz });
    if (!target) return;
    const behind = Math.cos(wrapAngle(target.yaw - P.yaw)) > 0.5;
    const b = this.combat.brains.get(target.id);
    const unaware = !b || (!b.hostile && !b.sees);
    if (w === "baton" && behind && unaware) {
      target.knock(35, "subdued");
      this.toast("Silent takedown — subdued (nonlethal)", 2);
    } else {
      this.damageChar(target, spec.damage, P, spec);
      if (target.alive && (w === "baton" || this.rng.chance(0.25))) target.knock(w === "baton" ? 3.5 : 1.5);
    }
    if (target.kind === "civilian") { this.peds.stimulus("assault", target.x, target.z, 20); if (w !== "baton" || !unaware) { /* reported in damageChar */ } else this.reportCrime("assault", target.x, target.z); }
    if (target.kind === "police") this.police.escalate("attackPolice", target.x, target.z);
    if (this.police.calls.some((q) => q.witness === target)) this.police.interruptCall(target);
  }

  private throwGadget() {
    const g = this.inv.selectedGadget;
    if (this.inv.gadgets[g] <= 0) { this.toast(`No ${GADGETS[g].name} left`, 1.8); return; }
    this.inv.gadgets[g]--;
    const P = this.player;
    const f = this.cam.fwd;
    this.thrown.push({ kind: g, x: P.x, y: P.y + 1.6, z: P.z, vx: f.x * 13, vy: f.y * 13 + 4, vz: f.z * 13, t: 0, live: false, until: 0, nextChirp: 0 });
  }

  private updateGadgets(dt: number) {
    for (let i = this.thrown.length - 1; i >= 0; i--) {
      const t = this.thrown[i];
      t.t += dt;
      if (!t.live) {
        t.vy -= 9.81 * dt;
        let nx = t.x + t.vx * dt, ny = t.y + t.vy * dt, nz = t.z + t.vz * dt;
        const hit = this.world.raycast(t.x, t.y, t.z, nx - t.x, ny - t.y, nz - t.z, 1);
        if (hit) { t.vx *= -0.3; t.vz *= -0.3; nx = t.x; nz = t.z; }
        const g = this.groundAt(nx, nz);
        if (ny < g + 0.1) { ny = g + 0.1; t.vy *= -0.3; t.vx *= 0.6; t.vz *= 0.6; }
        t.x = nx; t.y = ny; t.z = nz;
        if (t.t > 1.3) {
          t.live = true;
          if (t.kind === "smoke") { t.until = this.time + 14; this.smoke.push({ x: t.x, y: t.y + 1.5, z: t.z, r: 6.5, until: this.time + 14 }); this.emit({ type: "smoke", x: t.x, y: t.y, z: t.z, r: 6.5 }); }
          else t.until = this.time + 8;
        }
      } else {
        if (t.kind === "chirper" && this.time >= t.nextChirp) {
          t.nextChirp = this.time + 0.7;
          this.emit({ type: "chirp", x: t.x, y: t.y, z: t.z });
          this.combat.hear(t.x, t.z, 22, "chirper");
          this.peds.stimulus("chirper", t.x, t.z, 22);
        }
        if (this.time > t.until) this.thrown.splice(i, 1);
      }
    }
    this.smoke = this.smoke.filter((s) => s.until > this.time);
  }

  // ------------------------------------------------------------ vehicles

  stepVehicle(v: Vehicle, dt: number, ctl: VehicleControls) {
    const prevImpact = v.lastImpact;
    v.step(dt, ctl, this.vehEnv);
    // static collisions
    const r = Math.hypot(v.hw, v.hl) + 0.5;
    const list = this.world.query(v.x - r, v.z - r, v.x + r, v.z + r);
    for (const c of list) {
      if (c.y1 < v.y + 0.45 || c.y0 > v.y + v.spec.height) continue;
      const res = satORectAabb(v.rect, c);
      if (!res) continue;
      v.x += res.nx * res.depth; v.z += res.nz * res.depth;
      const rx = res.px - v.x, rz = res.pz - v.z;
      const cvx = v.vx + v.w * rz, cvz = v.vz - v.w * rx;
      const vn = cvx * res.nx + cvz * res.nz;
      if (vn < 0) {
        const e = 0.25;
        const rn = rz * res.nx - rx * res.nz;
        const j = -(1 + e) * vn / (v.invMass + (rn * rn) / v.inertia);
        v.applyImpulse(res.px, res.pz, res.nx * j, res.nz * j);
        // friction along wall
        const tx = -res.nz, tz = res.nx;
        const vt = cvx * tx + cvz * tz;
        const jt = clamp(-vt / (v.invMass * 1.5), -j * 0.4, j * 0.4);
        v.applyImpulse(res.px, res.pz, tx * jt, tz * jt);
        this.onVehicleImpact(v, -vn, res.px, res.pz, null);
      }
    }
    // spike strips
    for (const s of this.police.spikes) {
      if (!v.tiresPopped && satORect(v.rect, { cx: s.x, cz: s.z, hw: s.hw, hl: s.hl, yaw: s.yaw })) {
        v.tiresPopped = 1;
        if (v.driver === "player") this.toast("Spike strip! Tires shredded.");
      }
    }
    // splash into water
    if (v.sinking > 0 && v.sinking < dt * 1.5) this.emit({ type: "splash", x: v.x, y: -0.8, z: v.z });
    void prevImpact;
  }

  private onVehicleImpact(v: Vehicle, dv: number, px: number, pz: number, other: Vehicle | null) {
    if (dv < 2) return;
    v.damage(dv);
    if (dv > 5) this.emit({ type: "crash", x: px, y: v.y + 0.6, z: pz, power: Math.min(1, dv / 20) });
    if (v.driver === "player") {
      this.cam.addShake(Math.min(0.15, dv * 0.008));
      if (dv > 4) this.pkg.integrity = Math.max(0, this.pkg.integrity - (dv - 4) * (this.pkg.fragile ? 9 : 0));
      if (v.tag === "hot_van" || v.tag === "recovery") v.cargo = Math.max(0, v.cargo - Math.max(0, dv - 6) * 4);
      if (v.spec.moto && dv > 9) this.ejectRider(v, dv);
      if (dv > 9 && this.player.alive) this.playerHurt((dv - 9) * 2.2, px, pz);
    }
    if (v.tag === "hot_van" && v.driver !== "player") v.cargo = Math.max(0, v.cargo - Math.max(0, dv - 8) * 3);
    if (dv > 6) this.peds.stimulus("crash", px, pz, 25);
    if (other && (v.driver === "player" || other.driver === "player") && dv > 6) {
      const o = v.driver === "player" ? other : v;
      if (o.role === "police") { if (dv > 10 && this.cooldown("ramPolice", 5)) this.police.escalate("attackPolice", px, pz); }
      else if (o.role === "civilian" && this.cooldown("ram", 6)) this.reportCrime("property", px, pz);
    }
  }

  private ejectRider(v: Vehicle, dv: number) {
    const P = this.player;
    this.exitVehicle(true);
    P.vx = v.vx * 0.5; P.vz = v.vz * 0.5;
    P.knock(2.2);
    this.toast("Thrown from the bike!", 2);
    this.playerHurt(dv * 1.5, v.x, v.z);
  }

  private vehicleCollisions(dt: number) {
    const vs = this.vehicles;
    for (let i = 0; i < vs.length; i++) {
      const a = vs[i];
      for (let j = i + 1; j < vs.length; j++) {
        const b = vs[j];
        const rr = a.hl + b.hl + 0.5;
        if (Math.abs(a.x - b.x) > rr || Math.abs(a.z - b.z) > rr) continue;
        if (Math.abs(a.y - b.y) > 2) continue;
        const res = satORect(a.rect, b.rect);
        if (!res) continue;
        // rails cars hand over to physics on contact
        if (a.mode === "rails") this.traffic.disturb(a);
        if (b.mode === "rails") this.traffic.disturb(b);
        const ma = a.invMass, mb = b.invMass;
        const tot = ma + mb;
        a.x += res.nx * res.depth * (ma / tot); a.z += res.nz * res.depth * (ma / tot);
        b.x -= res.nx * res.depth * (mb / tot); b.z -= res.nz * res.depth * (mb / tot);
        const rax = res.px - a.x, raz = res.pz - a.z, rbx = res.px - b.x, rbz = res.pz - b.z;
        const vax = a.vx + a.w * raz, vaz = a.vz - a.w * rax;
        const vbx = b.vx + b.w * rbz, vbz = b.vz - b.w * rbx;
        const rvn = (vax - vbx) * res.nx + (vaz - vbz) * res.nz;
        if (rvn >= 0) continue;
        const ran = raz * res.nx - rax * res.nz, rbn = rbz * res.nx - rbx * res.nz;
        const e = 0.2;
        const jn = -(1 + e) * rvn / (ma + mb + (ran * ran) / a.inertia + (rbn * rbn) / b.inertia);
        a.applyImpulse(res.px, res.pz, res.nx * jn, res.nz * jn);
        b.applyImpulse(res.px, res.pz, -res.nx * jn, -res.nz * jn);
        a.impactTimer = Math.max(a.impactTimer, 0.3); b.impactTimer = Math.max(b.impactTimer, 0.3);
        const dvA = jn * ma, dvB = jn * mb;
        this.onVehicleImpact(a, dvA, res.px, res.pz, b);
        this.onVehicleImpact(b, dvB, res.px, res.pz, a);
      }
    }
    // vehicles vs characters
    for (const v of vs) {
      const sp = v.speed;
      if (sp < 1.2) continue;
      for (const c of this.charsNear(v.x, v.z, v.hl + 1.5)) {
        if (c.vehicle || c.mantle) continue;
        if (c.y > v.y + v.spec.height || c.y + 1.6 < v.y) continue;
        const res = circleORect(c.x, c.z, c.radius, v.rect);
        if (!res) continue;
        c.x += res.nx * res.depth; c.z += res.nz * res.depth;
        const rel = -(v.vx * res.nx + v.vz * res.nz);
        if (rel < -3.5 && c.status !== "knocked" && c.alive) {
          const hitSpeed = -rel;
          v.vx *= 0.93; v.vz *= 0.93;
          if (c === this.player) {
            c.knock(1.6); this.playerHurt(hitSpeed * 3, v.x, v.z);
            c.vx = v.vx * 0.6; c.vz = v.vz * 0.6;
          } else if (c.kind === "civilian") {
            this.peds.hitByVehicle(c, v, hitSpeed);
            if (v.driver === "player") {
              this.stats.civHarm++;
              this.reportCrime(c.alive ? "collision" : "murder", c.x, c.z);
              this.toast("A pedestrian was hurt. Wardens take this seriously.", 3);
            }
          } else {
            c.knock(hitSpeed > 12 ? 6 : 3);
            this.damageChar(c, hitSpeed * 4, v.driver === "player" ? this.player : null, null);
          }
          this.emit({ type: "impact", x: c.x, y: c.y + 1, z: c.z, mat: "body" });
        }
      }
    }
    void dt;
  }

  private updateProps(dt: number) {
    for (const p of this.props) {
      if (p.knocked) {
        if (p.t < 1.2) {
          p.t += dt;
          p.ox += p.vx * dt; p.oz += p.vz * dt;
          p.vx *= 1 - Math.min(1, 3 * dt); p.vz *= 1 - Math.min(1, 3 * dt);
          p.tilt = Math.min(Math.PI / 2, p.tilt + dt * 4);
          p.dirty = true;
        }
        continue;
      }
    }
    for (const v of this.vehicles) {
      if (v.speed < 3) continue;
      const gx = Math.floor(v.x / 10), gz = Math.floor(v.z / 10);
      for (let ax = gx - 1; ax <= gx + 1; ax++) for (let az = gz - 1; az <= gz + 1; az++) {
        const bucket = this.propGrid.get(ax * 1000 + az);
        if (!bucket) continue;
        for (const p of bucket) {
        if (p.knocked) continue;
        const d = p.def;
        if (Math.abs(v.x - d.x) > 4 || Math.abs(v.z - d.z) > 4) continue;
        if (!circleORect(d.x, d.z, d.type === "lamp" ? 0.25 : 0.45, v.rect)) continue;
        p.knocked = true; p.t = 0; p.vx = v.vx * 0.5; p.vz = v.vz * 0.5; p.tiltDir = Math.atan2(v.vx, v.vz); p.dirty = true;
        v.vx *= d.type === "lamp" ? 0.86 : 0.95; v.vz *= d.type === "lamp" ? 0.86 : 0.95;
        if (d.type === "lamp") v.damage(4.5);
        this.emit({ type: "impact", x: d.x, y: d.y + 0.8, z: d.z, mat: d.type === "lamp" ? "spark" : "dust" });
        if (v.driver === "player" && this.cooldown("prop", 8)) this.reportCrime("property", d.x, d.z);
        }
      }
    }
    // knocked props respawn when far and out of view
    this.knockT += dt;
    if (this.knockT > 2) {
      this.knockT = 0;
      const P = this.focus;
      for (const p of this.props) if (p.knocked && dist2(p.def.x, p.def.z, P.x, P.z) > 140 && !this.isVisible(p.def.x, p.def.y + 1, p.def.z, 1)) {
        p.knocked = false; p.ox = p.oz = 0; p.tilt = 0; p.dirty = true;
      }
    }
  }

  // ------------------------------------------------------------ driving & enter/exit

  private updateDriving(dt: number) {
    const P = this.player;
    const v = P.vehicle!;
    const inp = this.input;
    P.x = v.x; P.z = v.z; P.y = v.y; P.yaw = v.yaw;
    if (inp.camCycle) this.cam.cycleVehicleCam();
    if (inp.radioNext) { this.radioStation = (this.radioStation + 1) % 3; this.toast(["Radio off", "Tidewave 88.4 — electronic harbor beat", "Hillside 94.1 — local indie"][this.radioStation], 2); }
    v.assist.stability = this.settings.stabilityAssist; v.assist.traction = this.settings.tractionControl;
    const ctl: VehicleControls = { throttle: inp.throttle, brake: inp.brake, steer: inp.steer, handbrake: inp.handbrake };
    if (v.stalled && (inp.throttle > 0 || inp.brake > 0) && this.cooldown("stall", 4)) this.toast(v.sinking ? "The vehicle is sinking — get out (F)!" : "Engine stalled — get it repaired at Breakwater Repair.", 2.5);
    this.stepVehicle(v, dt, ctl);
    if (inp.horn && this.cooldown("horn", 0.6)) { this.emit({ type: "horn", x: v.x, y: v.y, z: v.z, id: v.id }); this.peds.stimulus("siren", v.x, v.z, 12); }
    // drive-by: sidearm only, aim held
    P.aiming = inp.aimHeld && !!this.inv.sidearm && !v.spec.moto === false ? inp.aimHeld : inp.aimHeld && !!this.inv.sidearm;
    if (P.aiming && this.inv.sidearm) {
      const spec = WEAPONS[this.inv.sidearm];
      P.weapon = this.inv.sidearm;
      if (P.fireCooldown > 0) P.fireCooldown -= dt;
      if ((spec.auto ? inp.fireHeld : inp.firePressed) && P.fireCooldown <= 0 && (this.inv.mags[spec.id] ?? 0) > 0) this.playerFire(spec);
      if ((this.inv.mags[spec.id] ?? 0) <= 0 && inp.reloadPressed) reloadInto(this.inv, spec.id);
    }
    // race reset: hold R with penalty
    if (this.circuitActive && inp.resetHeld) {
      this.resetHold += dt;
      if (this.resetHold > 1) { this.resetHold = 0; this.circuitReset(v); }
    } else this.resetHold = 0;
    if (inp.exitPressed && v.speed < 9) this.exitVehicle(false);
    else if (inp.exitPressed) this.toast("Too fast to bail out safely — slow down.", 1.5);
    // ghost recording
    if (this.circuitActive) {
      this.ghostT += dt;
      if (this.ghostT >= 0.1) { this.ghostT -= 0.1; this.ghostRec.push(Math.round(v.x * 10) / 10, Math.round(v.z * 10) / 10, Math.round(v.yaw * 100) / 100); }
    }
    if (v.sinking > 2.5) { this.exitVehicle(true); this.toast("You escaped the sinking vehicle."); }
  }

  enterVehicle(v: Vehicle) {
    const P = this.player;
    if (v.locked && v.role !== "police") { this.toast("Locked — high-security vehicle. Find another.", 2); return; }
    const owned = v.role === "player" || v.tag === "kestrel" || v.tag === "owned";
    const missionOk = this.vehicleMission.has(v.id) && v.tag !== "rivals";
    // carjack: NPC driver gets out and flees
    const driver = v.crew.find((c: Character) => c.id === v.driver) as Character | undefined;
    if (driver && driver.alive) {
      if (v.role === "police") { this.toast("Officers inside — not happening.", 2); return; }
      this.traffic.release(v);
      v.crew = v.crew.filter((c: Character) => c !== driver);
      this.peds.adoptFromVehicle(driver, v, true);
      this.say(driver, "Hey! That's my car!", 2, true);
      this.peds.stimulus("assault", v.x, v.z, 15);
    } else if (this.traffic.brains.has(v.id)) this.traffic.release(v);
    if (v.role === "parked") this.traffic.release(v);
    if (!owned && !missionOk) {
      this.reportCrime("theft", v.x, v.z);
      if (v.role === "police") this.police.escalate("attackPolice", v.x, v.z);
    }
    if (v.role === "civilian" || v.role === "parked") v.role = "player";
    v.locked = false;
    v.mode = "physics";
    v.driver = "player";
    v.playerUsed = true;
    v.hazard = false;
    v.despawnable = false;
    P.vehicle = v;
    P.crouch = false; P.aiming = false;
    this.cam.vehYaw = v.yaw; this.cam.freeLookYaw = 0;
    this.emit({ type: "ui", x: v.x, y: v.y, z: v.z, sound: "door" });
  }

  exitVehicle(force: boolean) {
    const P = this.player;
    const v = P.vehicle;
    if (!v) return;
    P.vehicle = null;
    v.driver = null;
    // choose the nearest clear side
    const sides = [-1, 1];
    let placed = false;
    for (const s of sides) {
      const x = v.x - Math.cos(v.yaw) * (v.hw + 0.7) * s * -1, z = v.z + Math.sin(v.yaw) * (v.hw + 0.7) * s * -1;
      const g = this.groundAt(x, z);
      const r = this.world.resolveCircle(x, z, P.radius, g + 0.3, g + 1.7);
      if (!r.hit) { P.x = x; P.z = z; P.y = g; placed = true; break; }
    }
    if (!placed) { P.x = v.x; P.z = v.z; P.y = v.y + v.spec.height + 0.1; }
    if (v.sinking > 0) { P.y = -1.5; }
    P.yaw = v.yaw; P.vx = force ? v.vx * 0.3 : 0; P.vz = force ? v.vz * 0.3 : 0; P.savePrev();
    this.cam.yaw = v.yaw;
    this.cam.pitch = -0.12;
    this.emit({ type: "ui", x: v.x, y: v.y, z: v.z, sound: "door" });
  }

  // ------------------------------------------------------------ interaction & prompts

  private nearestVehicle(): Vehicle | null {
    const P = this.player;
    let best: Vehicle | null = null, bd = 2.6;
    for (const v of this.vehicles) {
      const r = circleORect(P.x, P.z, 1.4, v.rect);
      if (!r) continue;
      const d = dist2(P.x, P.z, v.x, v.z) - Math.max(v.hw, v.hl) * 0.5;
      if (d < bd + v.hl) { if (!best || d < dist2(P.x, P.z, best.x, best.z)) best = v; bd = d; }
    }
    return best;
  }

  private activeInteracts(): InteractPoint[] {
    const out: InteractPoint[] = [];
    const m = this.mission;
    if (m && m.status === "running") {
      const n = m.current;
      if (n.type === "objective") {
        const o = n.obj;
        if (o.kind === "interact") out.push({ id: o.id, kind: "contact", x: o.x, z: o.z, r: o.r, label: o.label });
        if (o.kind === "interactAll") for (const p of o.points) if (!m.photographed.has(p.id)) out.push({ id: p.id, kind: "manifest", x: p.x, z: p.z, r: o.r, label: p.label });
        if (o.kind === "lockpick") out.push({ id: o.id, kind: "sidedoor", x: o.x, z: o.z, r: o.r, label: o.label });
      }
      if (m.def.id === "signal_breakwater" && !this.flags.has("serverShutdown")) out.push({ id: "server", kind: "server", x: 259, z: -318, r: 2.4, label: "Shut down server rack (optional)" });
    }
    return out;
  }

  private updatePrompt() {
    const P = this.player;
    const inp = this.input;
    this.ui.prompt = null;
    if (this.ui.panel || this.ui.choice || this.ui.lockpick) return;
    if (this.police.arrest) { this.ui.prompt = "Hold E — comply with arrest (fine, keep gear)  ·  Run — resist (Alert rises)"; return; }
    if (P.vehicle) {
      const v = P.vehicle;
      const rep = this.d.interacts.find((i) => i.kind === "repair")!;
      if (dist2(v.x, v.z, rep.x, rep.z) < 9 && v.health < 100) {
        const cost = this.repairCost(v);
        this.ui.prompt = `E — repair ${v.spec.name} ($${cost})`;
        if (inp.interactPressed) this.repair(v);
        return;
      }
      const gs = this.d.spawns.garageSlot;
      if (dist2(v.x, v.z, gs.x, gs.z) < 5 && v.speed < 1 && !v.spec.moto && v.tag !== "kestrel" && !this.vehicleMission.has(v.id) && v.role !== "police") {
        this.ui.prompt = this.inv.garageSlot ? `E — store ${v.spec.name} in your safehouse garage slot` : "Garage slot not owned (buy at the safehouse board, $500)";
        if (inp.interactPressed && this.inv.garageSlot) {
          this.inv.ownedVehicle = { model: v.spec.id, color: [...v.color] as any };
          for (const o of this.vehicles) if (o.tag === "owned" && o !== v) this.removeVehicle(o);
          v.tag = "owned"; v.role = "player";
          this.toast(`${v.spec.name} stored. It will be here when you load.`);
        }
        return;
      }
      if (v.stalled && v.sinking === 0) this.ui.prompt = "Engine stalled — F to get out";
      return;
    }
    if (P.status !== "normal") return;
    // mission interacts first
    for (const it of this.activeInteracts()) {
      if (dist2(P.x, P.z, it.x, it.z) > it.r) continue;
      if (it.kind === "manifest") this.ui.prompt = `E — ${it.label}`;
      else if (it.kind === "sidedoor") this.ui.prompt = `E — ${it.label} (timing)`;
      else this.ui.prompt = `E — ${it.label}`;
      if (inp.interactPressed) this.useMissionInteract(it);
      return;
    }
    // world interacts
    for (const it of this.d.interacts) {
      if (dist2(P.x, P.z, it.x, it.z) > it.r) continue;
      const label = this.interactLabel(it);
      if (!label) continue;
      this.ui.prompt = label;
      if (inp.interactPressed) this.useInteract(it);
      return;
    }
    const v = this.nearestVehicle();
    if (v) {
      const driver = v.crew.find((c: Character) => c.id === v.driver) as Character | undefined;
      const owned = v.tag === "kestrel" || v.tag === "owned" || v.role === "player";
      const mission = this.vehicleMission.has(v.id) && v.tag !== "rivals";
      let text: string;
      if (v.role === "police" && driver) text = "Occupied Warden Interceptor";
      else if (v.locked && v.role !== "police") text = `Locked ${v.spec.name} — high-security`;
      else if (owned || mission) text = `E — ${v.spec.moto ? "ride" : "drive"} ${v.spec.name}`;
      else if (driver) text = `E — take ${v.spec.name}; driver will flee and report`;
      else if (v.role === "police") text = `E — take Warden Interceptor (serious crime)`;
      else text = `E — take ${v.spec.name}; owner may report the theft`;
      this.ui.prompt = text;
      if (inp.interactPressed) this.enterVehicle(v);
    }
  }

  private interactLabel(it: InteractPoint): string | null {
    switch (it.kind) {
      case "rest": return "E — rest & save (advance time)";
      case "board": return "E — mission board (replay, garage slot)";
      case "locker": return "E — gear locker (loadout)";
      case "shop": return "E — shop at Harbor Supply";
      case "kiosk": return "E — Tidewear: change outfit (breaks description if unseen)";
      case "police": return "E — police lobby (pay fines)";
      case "contact": {
        if (this.mission) return null;
        const next = nextStory(this.progress.storyDone);
        if (next && STORY_GIVER[next.id] === it.id) return `E — ${it.label}: start "${next.title}"`;
        return it.id === "contact_mara" ? "E — Mara: courier run" : null;
      }
      case "viewpoint": return null;
      default: return null;
    }
  }

  private useInteract(it: InteractPoint) {
    this.emit({ type: "ui", x: it.x, y: 0, z: it.z, sound: "click" });
    switch (it.kind) {
      case "rest":
        if (this.police.tier > 0) { this.toast("Can't rest with the Wardens searching for you."); return; }
        if (this.mission) { this.toast("Finish or abandon the current job first."); return; }
        this.ui.panel = "rest"; break;
      case "board": this.ui.panel = "board"; break;
      case "locker": this.ui.panel = "locker"; break;
      case "shop": this.ui.panel = "shop"; break;
      case "kiosk": this.ui.panel = "kiosk"; break;
      case "police": this.ui.panel = "police"; break;
      case "contact": {
        const next = nextStory(this.progress.storyDone);
        if (next && STORY_GIVER[next.id] === it.id) this.startMission(next, false);
        else if (it.id === "contact_mara") this.startCourier();
        break;
      }
    }
    if (this.ui.panel) this.paused = true;
  }

  private useMissionInteract(it: InteractPoint) {
    if (it.kind === "sidedoor") {
      if ((this.lockState.get(it.id) ?? "idle") === "idle") {
        this.lockState.set(it.id, "running");
        this.ui.lockpick = { id: it.id, t: 0, hits: 0, misses: 0, zone: 0.55 + this.rng.next() * 0.25, width: 0.16, flash: 0 };
      }
      return;
    }
    if (it.kind === "server") {
      this.flags.add("serverShutdown");
      this.toast("Server room shut down — their response will be slower.");
      this.emit({ type: "ui", x: it.x, y: 0, z: it.z, sound: "click" });
      return;
    }
    if (it.kind === "manifest") {
      this.emit({ type: "ui", x: it.x, y: 0, z: it.z, sound: "photo" });
      // photographing while watched blows a cover story
      if (this.flags.has("cover")) {
        for (const [id, b] of this.combat.brains) if (b.team === "security" && b.sees) { this.flags.delete("cover"); const c = this.charById(id); if (c) this.combat.alarm(c, b); break; }
      }
    }
    this.interacts.add(it.id);
  }

  private updateLockpick(dt: number) {
    const lp = this.ui.lockpick!;
    lp.t += dt;
    if (lp.flash > 0) lp.flash -= dt;
    const pos = (Math.sin(lp.t * 2.6) + 1) / 2;
    if (this.input.interactPressed && lp.t > 0.2) {
      if (Math.abs(pos - lp.zone) < lp.width / 2) {
        lp.hits++; lp.flash = 0.3; lp.zone = 0.2 + this.rng.next() * 0.6; lp.width *= 0.85;
        this.emit({ type: "ui", x: 0, y: 0, z: 0, sound: "lock" });
      } else { lp.misses++; lp.flash = -0.3; }
      this.input.interactPressed = false;
    }
    if (lp.hits >= 3) { this.lockState.set(lp.id, "success"); this.ui.lockpick = null; this.toast("Lock bypassed."); }
    else if (lp.misses >= 2) { this.lockState.set(lp.id, "fail"); this.ui.lockpick = null; this.toast("The lock jammed — an alarm is ringing!"); }
  }

  // ------------------------------------------------------------ economy actions (called by UI)

  closePanel() { this.ui.panel = null; this.ui.panelData = null; this.paused = false; this.ui.wheel = false; }

  buy(item: ShopItem): string | null {
    const why = canBuy(this.inv, item);
    if (why) return why;
    buyItem(this.inv, item);
    this.player.armor = this.inv.armor;
    this.emit({ type: "ui", x: 0, y: 0, z: 0, sound: "cash" });
    return null;
  }
  canBuy(item: ShopItem) { return canBuy(this.inv, item); }

  equipWeapon(w: WeaponId) { equip(this.inv, w); this.player.weapon = w; }

  setOutfit(o: number) {
    if (!this.inv.outfits.includes(o)) return;
    this.inv.outfit = o;
    this.player.look = this.lookFromOutfit(o);
    this.police.onOutfitChanged();
  }

  repairCost(v: Vehicle) { return Math.round((100 - v.health) * 4 + (v.tiresPopped ? 60 : 0) + 20); }
  repair(v: Vehicle) {
    const cost = this.repairCost(v);
    if (this.inv.cash < cost) { this.toast("Not enough cash for repairs."); return; }
    this.inv.cash -= cost; v.repair(); v.cargo = Math.max(v.cargo, v.cargo);
    this.toast(`${v.spec.name} repaired ($${cost}).`);
    this.emit({ type: "ui", x: 0, y: 0, z: 0, sound: "cash" });
  }

  payFines(): string {
    const owed = this.flags.has("impound") ? 150 : 0;
    if (!owed) return "No outstanding fines.";
    if (this.inv.cash < owed) return "Not enough cash.";
    this.inv.cash -= owed; this.flags.delete("impound");
    this.ensureOwnedVehicles();
    return `Paid $${owed}. Your Kestrel is released to the safehouse.`;
  }

  rest(hours: number) {
    this.clock.hour = (this.clock.hour + hours) % 24;
    this.player.health = 100;
    this.weather.target = this.clock.isNight && this.progress.storyDone.includes("signal_breakwater") ? 1 : this.weather.target;
    this.lastSafe = { ...this.d.spawns.safehouse };
    this.ensureOwnedVehicles();
    this.requestAutosave("Safehouse rest");
    this.closePanel();
    this.toast("Rested. Progress saved.");
  }

  // ------------------------------------------------------------ death / arrest

  private onPlayerDeath() {
    const P = this.player;
    this.stats.deaths++;
    if (P.vehicle) this.exitVehicle(true);
    this.ui.fade = 1;
    this.ui.panel = this.mission && this.mission.status === "running" ? "fail" : "dead";
    if (this.mission && this.mission.status === "running") this.mission.fail("You were taken to the clinic.", this);
    this.ui.panelData = { fee: Math.min(this.inv.cash, MEDICAL_FEE) };
  }

  respawnAfterDeath() {
    const fee = Math.min(this.inv.cash, MEDICAL_FEE);
    this.inv.cash -= fee;
    this.police.clear();
    this.reviveAt(this.d.spawns.hospital.x, this.d.spawns.hospital.z, 0);
    this.toast(`Patched up at the canal clinic. Medical fee $${fee}. Gear kept.`);
    this.closePanel();
  }

  private reviveAt(x: number, z: number, yaw: number) {
    const P = this.player;
    if (P.vehicle) this.exitVehicle(true);
    P.alive = true; P.status = "normal"; P.health = 100; P.statusTimer = 0;
    this.placePlayer(x, z, yaw);
    this.ui.fade = 0;
    this.ensureOwnedVehicles();
  }

  busted() {
    this.stats.arrests++;
    const fine = Math.min(this.inv.cash, Math.max(150, Math.round(this.inv.cash * 0.1)));
    this.inv.cash -= fine;
    // contraband: long-gun ammo is confiscated; unique gear is kept
    const lost = this.inv.ammo.rifle + this.inv.ammo.shell;
    this.inv.ammo.rifle = 0; this.inv.ammo.shell = 0;
    if (this.mission && this.mission.status === "running") this.mission.fail("You were arrested.", this);
    this.police.clear();
    const sp = this.d.spawns.precinct;
    this.reviveAt(sp.x, sp.z, sp.yaw);
    this.ui.panel = this.mission && this.mission.status === "failed" ? "fail" : "busted";
    this.ui.panelData = { fine, lost };
    this.paused = this.ui.panel === "busted";
  }

  // ------------------------------------------------------------ missions

  startMission(def: MissionDef, replay: boolean) {
    if (this.mission && this.mission.status === "running") { this.toast("Finish or abandon the current job first."); return; }
    this.mission = new MissionRunner(def, replay);
    this.ui.missionTitle = def.title;
    if (replay) {
      this.missionReplayInv = JSON.parse(JSON.stringify(this.inv));
      // clean authored loadout for replays
      const idx = STORY.findIndex((s) => s.id === def.id);
      const inv = newInventory();
      inv.cash = this.inv.cash;
      if (idx >= 2) { inv.unlocked.push("pistol"); inv.sidearm = "pistol"; inv.ammo.pistol = 72; inv.mags.pistol = 12; }
      if (idx >= 3) { inv.unlocked.push("carbine"); inv.long = "carbine"; inv.ammo.rifle = 90; inv.mags.carbine = 30; inv.medkits = 2; inv.armor = 50; }
      inv.gadgets = { smoke: 1, chirper: 2 };
      inv.trust = this.inv.trust; inv.outfits = this.inv.outfits; inv.outfit = this.inv.outfit;
      this.inv = inv;
    }
    this.flags.clear(); this.interacts.clear(); this.lockState.clear();
    this.mission.begin(this);
    this.banner(def.title, replay ? "Mission replay — rewards not repeated" : def.blurb, 4.5);
    this.emit({ type: "ui", x: 0, y: 0, z: 0, sound: "mission" });
  }

  startCourier() {
    const anchors = this.roads.ped.filter((p) => !p.poi && this.waterAt(p.x, p.z) === null);
    const def = generateCourier(1000 + this.progress.courierRuns * 17 + Math.floor(this.time), anchors, this.playerPos(), this.inv.trust);
    this.startMission(def, false);
  }
  startCircuit() { this.startMission(circuitDef(), false); }
  startRecovery() {
    const g = generateRecovery(5000 + this.progress.recoveries * 31 + Math.floor(this.time), this.traffic.spots.filter((s) => !s.vehicle && !s.taken), this.playerPos());
    this.startMission(g.def, false);
  }

  abandonMission(toGiver = false) {
    const m = this.mission;
    if (!m) return;
    m.abandon(this);
    this.endMissionCommon();
    this.mission = null;
    this.closePanel();
    if (toGiver) { const g = this.d.interacts.find((i) => i.id === STORY_GIVER[m.def.id]); if (g) this.reviveAt(g.x, g.z + 3, 0); }
    this.toast("Job abandoned. Back to free roam.");
  }

  retryMission() {
    const m = this.mission;
    if (!m) return;
    const P = this.player;
    P.alive = true; P.status = "normal"; P.health = Math.max(P.health, 100);
    this.police.clear();
    this.flags.delete("cover");
    m.retry(this);
    this.ui.fade = 0;
    this.closePanel();
    this.toast("Retrying from checkpoint.");
  }

  private endMissionCommon() {
    this.circuitActive = false;
    this.world.blockers = [];
    this.flags.clear();
    this.pkg = { integrity: 100, fragile: false };
    this.ui.markers = []; this.ui.objective = ""; this.ui.optional = []; this.ui.timer = null; this.ui.choice = null; this.ui.lockpick = null;
    this.missionWaves = [];
    if (this.missionReplayInv) { this.inv = this.missionReplayInv; this.missionReplayInv = null; this.player.armor = this.inv.armor; }
  }

  private updateMissionSystems(dt: number) {
    const m = this.mission;
    // waves
    for (let i = this.missionWaves.length - 1; i >= 0; i--) {
      const w = this.missionWaves[i];
      if (this.time >= w.next) {
        w.next = this.time + w.interval; w.left--;
        const interval = this.flags.has("serverShutdown") ? 1.35 : 1;
        w.next = this.time + w.interval * interval;
        for (let k = 0; k < w.count; k++) {
          const dx = w.fromX - w.toX, dz = w.fromZ - w.toZ, L = Math.hypot(dx, dz) || 1;
          const back = 25 + k * 2;
          const x = w.fromX + (dx / L) * back + this.rng.range(-3, 3), z = w.fromZ + (dz / L) * back + this.rng.range(-2, 2);
          const c = new Character("rival", "rival", this.makeLook("rival", this.rng), x, z, this.groundAt(x, z));
          c.tag = w.mission;
          const b = this.combat.add(c, "rival", { weapon: this.rng.chance(0.3) ? "carbine" : "pistol", accuracy: 0.4 });
          b.hostile = true; b.state = "Investigate"; b.investigateX = w.toX; b.investigateZ = w.toZ; b.timer = 30;
        }
        if (w.left <= 0) this.missionWaves.splice(i, 1);
      }
    }
    if (!m) {
      // free roam: point the player at the next story contact
      const next = nextStory(this.progress.storyDone);
      const it = next ? this.d.interacts.find((i) => i.id === STORY_GIVER[next.id]) : null;
      this.ui.markers = it && !this.attract ? [{ x: it.x, z: it.z, r: 2.5, kind: "pickup", label: next!.title }] : [];
      this.ui.objective = it && !this.attract ? `Next story job: meet ${next!.giver} (${next!.title}) — or take work from your phone (P)` : "";
      return;
    }
    if (m.status === "running") m.update(dt, this);
    if (m.status === "complete") {
      const def = m.def;
      if (def.kind === "story" && !m.replay && !this.progress.storyDone.includes(def.id)) this.progress.storyDone.push(def.id);
      if (m.grade) {
        const prev = this.progress.grades[def.id];
        if (!prev || "SABCD".indexOf(m.grade.letter) < "SABCD".indexOf(prev)) this.progress.grades[def.id] = m.grade.letter;
      }
      if (def.kind === "courier") this.progress.courierRuns++;
      if (def.kind === "recovery") this.progress.recoveries++;
      this.ui.panel = "result";
      this.ui.panelData = { def, grade: m.grade, rewarded: m.rewarded, replay: m.replay, circuitBest: this.progress.circuitBest };
      this.emit({ type: "ui", x: 0, y: 0, z: 0, sound: "mission" });
      this.endMissionCommon();
      this.mission = null;
      this.cleanupUntag(def.id);
      if (!m.replay) { this.lastSafe = this.player.vehicle ? this.lastSafe : { x: this.player.x, z: this.player.z, yaw: this.player.yaw }; this.requestAutosave(`After ${def.title}`); }
      return;
    }
    if (m.status === "failed" && this.ui.panel !== "fail") {
      this.ui.panel = "fail";
      this.ui.panelData = { reason: m.failReason, def: m.def };
      this.emit({ type: "ui", x: 0, y: 0, z: 0, sound: "fail" });
    }
  }

  private cleanupUntag(id: string) { void id; }

  private driveMissionVehicle(v: Vehicle, m: { ai: DriveAI; mode: "wander" | "pursue" | "none"; route: number[]; t: number; fleeing: boolean }, dt: number) {
    const driver = v.crew.find((c: Character) => c.id === v.driver) as Character | undefined;
    if (m.mode === "none" || !driver || !driver.alive || v.stalled) {
      if (driver && v.stalled && v.tag === "hot_van") this.bail(v, driver);
      this.stepVehicle(v, dt, { throttle: 0, brake: 1, steer: 0, handbrake: true });
      return;
    }
    const P = this.playerPos();
    const d = dist2(v.x, v.z, P.x, P.z);
    m.t -= dt;
    const avoid = () => this.traffic.probe(v, 16, null).dist;
    if (m.mode === "wander") {
      if (d < 70 && !m.fleeing) { m.fleeing = true; m.t = 0; this.toast("The Hauler driver spotted you — they're running!"); }
      if (m.t <= 0 || m.ai.done) {
        // pick a destination away from the player, bounded to the district core
        let best = this.roads.nodes[0], bs = -Infinity;
        for (let k = 0; k < 12; k++) {
          const n = this.roads.nodes[this.rng.int(0, this.roads.nodes.length - 1)];
          const s = (m.fleeing ? dist2(n.x, n.z, P.x, P.z) : 0) - Math.abs(n.x) * 0.2 - Math.abs(n.z) * 0.2 + this.rng.next() * 60;
          if (s > bs && dist2(n.x, n.z, v.x, v.z) > 120) { bs = s; best = n; }
        }
        m.route = this.roads.gpsRoute(v.x, v.z, best.x, best.z); m.ai.setRoute(m.route); m.t = m.fleeing ? 10 : 25;
      }
      const ctl = m.ai.update(v, dt, { route: m.route, maxSpeed: m.fleeing ? 21 : 12, laneOffset: m.fleeing ? 0 : 1.75, arrive: false }, avoid);
      this.stepVehicle(v, dt, ctl);
      // bail out when badly damaged
      if (v.health < 35 && driver) this.bail(v, driver);
      return;
    }
    // pursue
    if (m.t <= 0) { m.route = this.roads.gpsRoute(v.x, v.z, P.x, P.z); m.ai.setRoute(m.route); m.t = 1.5; }
    const pv = this.player.vehicle;
    const chase = d < 45 ? { x: P.x, z: P.z, vx: pv?.vx ?? 0, vz: pv?.vz ?? 0 } : null;
    const ctl = m.ai.update(v, dt, { route: m.route, chase, maxSpeed: 30, aggressive: true }, avoid);
    this.stepVehicle(v, dt, ctl);
    if ((!pv || pv.speed < 3) && d < 16 && v.speed < 6) {
      // crew gets out to fight
      for (const c of [...v.crew] as Character[]) {
        if (!c.alive) continue;
        c.vehicle = null; c.x = v.x + this.rng.range(-2, 2); c.z = v.z + this.rng.range(-2, 2); c.y = this.groundAt(c.x, c.z); c.savePrev();
        const b = this.combat.brains.get(c.id); if (b) { b.hostile = true; b.state = "Engage"; }
      }
      v.crew = []; v.driver = null; m.mode = "none";
    }
  }

  private bail(v: Vehicle, driver: Character) {
    driver.vehicle = null;
    driver.x = v.x - Math.cos(v.yaw) * (v.hw + 0.8); driver.z = v.z + Math.sin(v.yaw) * (v.hw + 0.8); driver.y = this.groundAt(driver.x, driver.z); driver.savePrev();
    v.crew = v.crew.filter((c: Character) => c !== driver); v.driver = null;
    const b = this.combat.brains.get(driver.id);
    if (b) { b.state = "Retreat"; b.hostile = false; }
    this.say(driver, "Keep the stupid van!", 2, true);
    const m = this.missionAI.get(v.id); if (m) m.mode = "none";
  }

  private circuitReset(v: Vehicle) {
    const m = this.mission;
    if (!m) return;
    const pts = CIRCUIT_POINTS;
    const prev = pts[(m.cp - 1 + pts.length) % pts.length];
    const next = pts[m.cp % pts.length];
    const near = this.roads.nearestLane(prev.x + (next.x - prev.x) * 0.15, prev.z + (next.z - prev.z) * 0.15, next.x - prev.x, next.z - prev.z, 40);
    const x = near ? near.lane.x0 + near.lane.dx * near.s : prev.x, z = near ? near.lane.z0 + near.lane.dz * near.s : prev.z;
    v.x = x; v.z = z; v.yaw = Math.atan2(next.x - prev.x, next.z - prev.z); v.vx = v.vz = v.w = 0; v.y = this.heightAt(x, z); v.savePrev();
    m.circuitStart -= 5;
    this.toast("Reset to last checkpoint (+5 s)", 2);
  }

  // ------------------------------------------------------------ MissionHost implementation

  now() { return this.time; }
  playerVehicleTag() { return this.player.vehicle ? this.player.vehicle.tag || null : null; }
  playerVehicleSpeed() { return this.player.vehicle?.speed ?? 0; }
  playerOnFoot() { return !this.player.vehicle; }
  playerDead() { return !this.player.alive; }
  alertTier() { return this.police.tier; }
  vehicleByTag(tag: string): VehicleInfo | null {
    const v = this.vehicles.find((q) => q.tag === tag);
    if (!v) return null;
    return { x: v.x, z: v.z, speed: v.speed, health: v.health, cargo: v.cargo, stalled: v.stalled, driverPresent: v.driver !== null && v.driver !== "player" };
  }
  consumeInteract(id: string) { if (this.interacts.has(id)) { this.interacts.delete(id); return true; } return false; }
  lockpick(id: string) { return this.lockState.get(id) ?? "idle"; }
  choose(prompt: string, options: { label: string; hint: string }[]): number | null {
    if (!this.ui.choice) { this.ui.choice = { prompt, options }; this.ui.choiceResult = null; }
    if (this.ui.choiceResult !== null) { const r = this.ui.choiceResult; this.ui.choice = null; this.ui.choiceResult = null; return r; }
    return null;
  }
  flag(name: string) {
    if (name === "undetected") return !this.flags.has("detected");
    return this.flags.has(name);
  }
  setFlag(name: string, v: boolean) { if (v) this.flags.add(name); else this.flags.delete(name); }
  setMarkers(m: Marker[]) { this.ui.markers = m; }
  setObjective(text: string, optional: { text: string; done: boolean }[], timer: number | null) { this.ui.objective = text; this.ui.optional = optional; this.ui.timer = timer; }
  say(lines: { speaker: string; text: string; dur?: number }[]): number;
  say(c: Character, text: string, dur: number, react: boolean): void;
  say(a: any, b?: any, c?: any, d?: any): any {
    if (Array.isArray(a)) {
      let t = 0;
      for (const l of a) {
        const dur = l.dur ?? Math.max(2.6, l.text.length * 0.055);
        this.dialogueQueue.push({ speaker: l.speaker, text: l.text, at: this.time + t, dur });
        t += dur + 0.25;
      }
      this.flushDialogue();
      return t;
    }
    return this.sayChar(a, b, c, d);
  }
  private dialogueQueue: { speaker: string; text: string; at: number; dur: number }[] = [];
  flushDialogue() {
    for (let i = this.dialogueQueue.length - 1; i >= 0; i--) {
      const q = this.dialogueQueue[i];
      if (this.time >= q.at) { this.subtitle(q.speaker, q.text, q.dur, "dialogue"); this.dialogueQueue.splice(i, 1); }
    }
  }
  private sayChar(c: Character, text: string, dur: number, react: boolean) {
    const p = this.playerPos();
    if (dist2(c.x, c.z, p.x, p.z) < (react ? 18 : 10) && !this.attract) {
      const name = c.kind === "police" ? "Warden" : c.kind === "guard" ? "Guard" : c.kind === "rival" ? "Rival" : c.role === "vendor" ? "Vendor" : "Local";
      this.subtitle(name, text, dur, "bark");
    }
    c.talkTimer = 0;
  }

  spawn(req: SpawnRequest, missionId: string) {
    switch (req.kind) {
      case "guard": {
        const kind = req.team === "security" ? "guard" : "rival";
        const c = new Character(kind, req.team === "security" ? "security" : "rival", this.makeLook(req.team === "security" ? "security" : "rival", this.rng), req.x, req.z, this.groundAt(req.x, req.z));
        c.yaw = req.yaw; c.tag = missionId; c.savePrev();
        const b = this.combat.add(c, req.team, { weapon: req.weapon as WeaponId, waypoints: req.waypoints ?? [], zone: req.zone ?? null, range: 24 });
        b.hostile = !!req.hostile;
        if (req.team === "security") b.accuracy = 0.35;
        break;
      }
      case "npc": {
        const c = new Character(req.role === "security" ? "guard" : "civilian", req.role as PedRole, this.makeLook(req.role, this.rng), req.x, req.z, this.groundAt(req.x, req.z));
        c.yaw = req.yaw; c.tag = missionId; c.savePrev();
        this.chars.push(c);
        break;
      }
      case "vehicle": {
        let { x, z, yaw } = req;
        if (req.ai === "pursue" || req.ai === "wander") {
          // never pop into view: snap to a lane out of sight
          const p = this.playerPos();
          let found = false;
          for (let k = 0; k < 60; k++) {
            const lane = this.roads.lanes[this.rng.int(0, this.roads.lanes.length - 1)];
            const s = this.rng.range(2, Math.max(3, lane.length - 2));
            const lx = lane.x0 + lane.dx * s, lz = lane.z0 + lane.dz * s;
            const d = dist2(lx, lz, p.x, p.z);
            const ref = req.ai === "wander" ? dist2(lx, lz, req.x, req.z) < 120 : true;
            if (d < 120 || d > 260 || !ref || this.isVisible(lx, 1, lz, 4)) continue;
            if (this.vehicles.some((v) => dist2(v.x, v.z, lx, lz) < 10)) continue;
            x = lx; z = lz; yaw = Math.atan2(lane.dx, lane.dz); found = true; break;
          }
          if (!found) {
            const nl = this.roads.nearestLane(req.ai === "wander" ? req.x : p.x + 150, req.ai === "wander" ? req.z : p.z, undefined, undefined, 200);
            if (nl) { x = nl.lane.x0 + nl.lane.dx * nl.s; z = nl.lane.z0 + nl.lane.dz * nl.s; yaw = Math.atan2(nl.lane.dx, nl.lane.dz); }
          }
        }
        // clear any parked car in the authored spot
        for (const o of [...this.vehicles]) if (dist2(o.x, o.z, x, z) < 4.5 && o.driver !== "player" && o.role !== "police") this.traffic.removeVehicle(o);
        const v = new Vehicle(req.model as VehicleModel, x, z, yaw, this.rng.int(0, 99));
        v.tag = req.tag; v.role = req.team === "rival" ? "rival" : "mission"; v.despawnable = false; v.y = this.heightAt(x, z); v.savePrev();
        if (req.tag === "hot_van") v.color = [0.95, 0.95, 0.92];
        if (req.tag === "recovery") v.hazard = true;
        this.addVehicle(v);
        this.vehicleMission.set(v.id, missionId);
        if (req.crew) {
          for (let k = 0; k < req.crew; k++) {
            const c = new Character("rival", "rival", this.makeLook("rival", this.rng), x, z, v.y);
            c.vehicle = v; c.tag = missionId;
            this.combat.add(c, "rival", { weapon: k === 0 ? "pistol" : this.rng.chance(0.5) ? "carbine" : "pistol" });
            v.crew.push(c);
          }
          v.driver = v.crew[0].id;
        }
        if (req.ai && req.ai !== "none") this.missionAI.set(v.id, { ai: new DriveAI(), mode: req.ai, route: [], t: 0, fleeing: false });
        break;
      }
      case "wave":
        this.missionWaves.push({ tag: req.tag, mission: missionId, left: req.waves, next: this.time + 2, interval: req.interval, count: req.count, fromX: req.fromX, fromZ: req.fromZ, toX: req.toX, toZ: req.toZ });
        break;
      case "door": {
        const d = DOORS[req.id];
        if (!d) break;
        this.world.blockers = this.world.blockers.filter((b) => b !== d);
        if (req.locked) this.world.blockers.push(d);
        break;
      }
    }
  }

  setWorld(key: string, value: string | number | boolean) {
    if (key.startsWith("door:")) { this.spawn({ kind: "door", id: key.slice(5), locked: !!value }, ""); return; }
    switch (key) {
      case "alarm": {
        this.flags.add("detected");
        for (const [id, b] of this.combat.brains) { const c = this.charById(id); if (c && c.tag && b.team === "security") { this.combat.alarm(c, b); break; } }
        break;
      }
      case "cover": if (value) this.flags.add("cover"); else this.flags.delete("cover"); break;
      case "forceAlert": this.police.forceTier(Number(value)); break;
      case "weather": this.weather.target = value === "rain" ? 1 : 0; break;
      case "time": this.clock.hour = Number(value); break;
      case "packageMods": this.pkg.fragile = String(value).includes("fragile"); break;
      case "packageReset": this.pkg.integrity = 100; break;
    }
  }

  onAlarm(c: Character, team: string) {
    if (team === "security") {
      this.flags.add("detected");
      this.flags.delete("cover");
      this.alarmTimers.push({ at: this.time + 3, c });
    }
  }

  cleanup(missionId: string) {
    for (const c of this.chars) if (c.tag === missionId) { c.removeMe = true; this.combat.remove(c); }
    for (const v of [...this.vehicles]) {
      if (this.vehicleMission.get(v.id) !== missionId) continue;
      if (v.driver === "player") { this.vehicleMission.delete(v.id); this.missionAI.delete(v.id); v.tag = ""; v.role = "player"; v.despawnable = true; continue; }
      this.removeVehicle(v);
    }
    this.chars = this.chars.filter((c) => !c.removeMe);
    this.world.blockers = [];
    this.missionWaves = this.missionWaves.filter((w) => w.mission !== missionId);
  }

  restoreCheckpoint(spawn: { x: number; z: number; yaw: number }) {
    if (this.player.vehicle) this.exitVehicle(false);
    this.reviveAt(spawn.x, spawn.z, spawn.yaw);
    // the player's Kestrel is part of First Shift's checkpoint state
    const k = this.vehicles.find((v) => v.tag === "kestrel");
    if (!k || k.stalled || dist2(k.x, k.z, spawn.x, spawn.z) > 60) {
      if (k) this.removeVehicle(k);
      const nv = new Vehicle("kestrel", spawn.x + 3, spawn.z + 2, spawn.yaw, 0);
      nv.tag = "kestrel"; nv.role = "player"; nv.despawnable = false; nv.y = this.heightAt(nv.x, nv.z); nv.savePrev();
      this.addVehicle(nv);
    }
  }

  reward(cash: number, trust: number, unlocks: string[], key: string, replay: boolean): boolean {
    if (replay || this.progress.rewarded.includes(key)) {
      this.toast(replay ? "Replay complete — grade recorded, no duplicate rewards." : "Already paid for this job.");
      return false;
    }
    let bonus = 0;
    const m = this.mission;
    if (m?.def.kind === "recovery") { const v = this.vehicles.find((q) => q.tag === "recovery"); if (v) bonus = recoveryBonus(v.health); }
    if (m?.def.id === "first_shift" && m.optDone.get("fast") === undefined) { /* computed in grade */ }
    if (m?.def.id === "first_shift" && this.time - m.startT <= 200) bonus += 75;
    if (m?.def.kind === "courier" && this.pkg.fragile) bonus += Math.round(this.pkg.integrity * 0.5);
    this.progress.rewarded.push(key);
    this.inv.cash += cash + bonus;
    const up = addTrust(this.inv, trust);
    for (const u of unlocks) {
      if (u.startsWith("vehicle:")) {
        const model = u.slice(8) as VehicleModel;
        if (!this.inv.ownedVehicle) { this.inv.ownedVehicle = { model, color: [...VEHICLES[model].colors[0]] as any }; this.inv.garageSlot = true; }
        this.toast(`${VEHICLES[model].name} is yours — it waits in the safehouse garage slot.`, 5);
      } else if (!this.inv.unlocked.includes(u as WeaponId)) { this.inv.unlocked.push(u as WeaponId); this.toast(`Unlocked: ${WEAPONS[u as WeaponId].name} (gear locker)`, 5); }
    }
    this.toast(`+$${cash + bonus}${bonus ? ` (incl. $${bonus} bonus)` : ""}  ·  Trust ${up > 0 ? "up to " + this.inv.trust : "+" + trust + " xp"}`, 5);
    this.emit({ type: "ui", x: 0, y: 0, z: 0, sound: "cash" });
    return true;
  }
  civHarm() { return this.stats.civHarm; }
  damageTaken() { return this.stats.damageTaken; }
  packageIntegrity() { return this.pkg.integrity; }
  circuitEvent(ev: "start" | "checkpoint" | "lap" | "finish", data: { lap: number; cp: number; time: number }) {
    if (ev === "start") { this.circuitActive = true; this.ghostRec = []; this.ghostT = 0; this.emit({ type: "ui", x: 0, y: 0, z: 0, sound: "checkpoint" }); }
    if (ev === "checkpoint") this.emit({ type: "ui", x: 0, y: 0, z: 0, sound: "checkpoint" });
    if (ev === "lap") { this.toast(`Lap ${data.lap} — ${fmtTime(data.time)}`, 3); this.emit({ type: "ui", x: 0, y: 0, z: 0, sound: "checkpoint" }); }
    if (ev === "finish") {
      this.circuitActive = false;
      const best = this.progress.circuitBest;
      const assists = `stability ${this.settings.stabilityAssist.toFixed(1)}, traction ${this.settings.tractionControl ? "on" : "off"}`;
      if (best === null || data.time < best) {
        this.progress.circuitBest = data.time;
        this.progress.circuitGhost = this.ghostRec.slice(0, 6000);
        this.progress.circuitAssists = assists;
        this.toast(`New local best: ${fmtTime(data.time)} (unverified; assists: ${assists})`, 6);
      } else this.toast(`Finished: ${fmtTime(data.time)} — best ${fmtTime(best)}`, 5);
    }
  }

  /** Ghost pose at time t (seconds since race start) from the stored best run. */
  ghostAt(t: number): { x: number; z: number; yaw: number } | null {
    const g = this.progress.circuitGhost;
    if (!g || !g.length || !this.circuitActive || !this.mission) return null;
    const i = Math.floor(t / 0.1);
    if (i * 3 + 5 >= g.length) return null;
    const f = t / 0.1 - i;
    return { x: g[i * 3] + (g[i * 3 + 3] - g[i * 3]) * f, z: g[i * 3 + 1] + (g[i * 3 + 4] - g[i * 3 + 1]) * f, yaw: g[i * 3 + 2] + wrapAngle(g[i * 3 + 5] - g[i * 3 + 2]) * f };
  }

  /** GPS to the current objective marker or player waypoint (recomputed periodically). */
  private gpsT = 0;
  updateGps(dt: number) {
    this.gpsT -= dt;
    if (this.gpsT > 0) return;
    this.gpsT = 0.8;
    const p = this.playerPos();
    const m = this.ui.markers.find((q) => q.kind !== "area") ?? this.ui.markers[0];
    const target = this.ui.waypoint ?? (m ? { x: m.x, z: m.z } : null);
    if (!target || dist2(p.x, p.z, target.x, target.z) < 25) { this.ui.gps = null; return; }
    this.ui.gps = this.roads.gpsRoute(p.x, p.z, target.x, target.z);
  }

  districtName() { const p = this.playerPos(); return DISTRICT_NAMES[districtAt(p.x, p.z)]; }

  /** Fixed-step driver: advance simulation by real elapsed time. */
  private acc = 0;
  advance(realDt: number): number {
    this.acc += Math.min(0.25, realDt);
    let steps = 0;
    while (this.acc >= DT && steps < 8) {
      this.step(DT);
      this.flushDialogue();
      this.updateGps(DT);
      this.acc -= DT;
      steps++;
      this.input.interactPressed = this.input.jumpPressed = this.input.firePressed = this.input.reloadPressed = false;
      this.input.meleePressed = this.input.throwPressed = this.input.gadgetCycle = this.input.holsterPressed = this.input.shoulderPressed = false;
      this.input.crouchPressed = this.input.camCycle = this.input.exitPressed = this.input.radioNext = this.input.medkitPressed = false;
      this.input.slot = null;
    }
    if (steps === 8) this.acc = 0;
    return this.acc / DT;
  }
}

export const SIM_DT = DT;
