// Versioned protocol shared by client and room. In Practice the transport is an
// in-process queue; the shapes are kept serialisable for a future WebSocket room.
import { Vec3 } from "./math";
import { HitZone } from "../content/weapons";
import { Loadout } from "../content/loadout";

export const PROTOCOL_VERSION = 3;

export const BTN = {
  fire: 1 << 0, ads: 1 << 1, jump: 1 << 2, crouch: 1 << 3, sprint: 1 << 4, reload: 1 << 5,
  melee: 1 << 6, lethal: 1 << 7, tactical: 1 << 8, mode: 1 << 9, deploy: 1 << 10, interact: 1 << 11, inspect: 1 << 12, ping: 1 << 13,
} as const;

export interface InputCommand {
  seq: number;
  tick: number;
  mx: number;
  mz: number;
  yaw: number;
  pitch: number;
  buttons: number;
  slot: 0 | 1;
  supportSel: number;
}

export type Team = 0 | 1;

export interface PlayerSnap {
  id: number;
  name: string;
  team: Team;
  bot: boolean;
  alive: boolean;
  pos: Vec3;
  yaw: number;
  pitch: number;
  crouchT: number;
  speed: number;
  sprinting: boolean;
  onGround: boolean;
  ads: number;
  weapon: string;
  reloading: boolean;
  health: number;
  protected: boolean;
  mantling: boolean;
  firing: number; // seconds since last shot
  glint: boolean;
  kills: number; deaths: number; assists: number; score: number; supportDestroyed: number; ping: number;
}

export interface ProjectileSnap { id: number; kind: string; pos: Vec3; team: Team; owner: number; stuck: boolean; armed?: boolean; yaw?: number }
export interface SmokeSnap { id: number; pos: Vec3; radius: number; t: number; life: number }
export interface DeviceSnap { id: number; kind: "drone" | "ammoPod"; pos: Vec3; team: Team; hp: number; maxHp: number; yaw: number }
export interface StrikeSnap { id: number; kind: "mortar" | "flight"; team: Team; pos: Vec3; dir?: Vec3; t: number; impactAt: number }

export type MatchPhase = "warmup" | "live" | "suddenDeath" | "ended";

export interface MatchSnap {
  phase: MatchPhase;
  clock: number; // seconds remaining in phase
  scores: [number, number];
  scoreLimit: number;
  winner: Team | -1 | null;
  suddenDeathBase: [number, number] | null;
}

export interface LocalSnap {
  id: number;
  ammo: number; reserve: number; mag: number;
  weaponName: string; mode: string;
  slot: 0 | 1;
  sidearmAmmo: number;
  health: number;
  momentum: number;
  supportReady: string[];
  supportSel: number;
  lethal: { id: string; count: number; charge: number };
  tactical: { id: string; count: number; charge: number };
  respawnIn: number;
  alive: boolean;
  flash: number;
  spread: number;
  ads: number;
  adsZoom: number;
  reload: { stage: string; t: number; total: number; kind: string } | null;
  swapT: number;
  melee: number;
  cooking: number;
  sprinting: boolean;
  protected: boolean;
  uplink: number;
  inspect: number;
  lastDamage: number;
}

export interface RadarBlip { x: number; z: number; kind: "fire" | "sweep" | "drone" | "dart" | "ping"; age: number }

export interface Snapshot {
  tick: number;
  time: number;
  match: MatchSnap;
  players: PlayerSnap[];
  projectiles: ProjectileSnap[];
  smokes: SmokeSnap[];
  devices: DeviceSnap[];
  strikes: StrikeSnap[];
  brokenGlass: number[];
  local: LocalSnap;
  radar: RadarBlip[];
  footprints: { x: number; y: number; z: number; age: number; yaw: number }[];
}

export interface RecapHit { attacker: string; attackerTeam: Team; source: string; damage: number; zone: HitZone | "blast" | "melee" | "strike"; t: number; dir: Vec3 }
export interface DeathRecap {
  killer: string | null;
  killerTeam: Team | null;
  weapon: string;
  sourceKind: "weapon" | "equipment" | "support" | "melee" | "world";
  distance: number;
  headshot: boolean;
  hits: RecapHit[];
  finalDir: Vec3;
  killerHealth: number | null;
}

export type GameEvent =
  | { type: "shot"; shooter: number; weapon: string; origin: Vec3; ends: Vec3[]; suppressed: boolean; tracer: boolean; flashScale: number }
  | { type: "impact"; pos: Vec3; normal: Vec3; mat: string }
  | { type: "hit"; attacker: number; victim: number; damage: number; zone: string; kill: boolean; protectedHit?: boolean; device?: boolean }
  | { type: "damaged"; victim: number; dir: Vec3; damage: number; flinch: number }
  | { type: "kill"; killer: number | null; victim: number; weapon: string; headshot: boolean; killerTeam: Team | null; victimTeam: Team; assisters: number[] }
  | { type: "death"; victim: number; recap: DeathRecap }
  | { type: "score"; player: number; amount: number; label: string }
  | { type: "medal"; player: number; label: string }
  | { type: "recoil"; player: number; pitch: number; yaw: number }
  | { type: "reload"; player: number; stage: string; kind: string; weapon: string }
  | { type: "dry"; player: number }
  | { type: "swap"; player: number }
  | { type: "melee"; player: number }
  | { type: "jump"; player: number }
  | { type: "land"; player: number; speed: number }
  | { type: "mantle"; player: number }
  | { type: "footstep"; player: number; pos: Vec3; loud: number }
  | { type: "throw"; player: number; kind: string }
  | { type: "bounce"; pos: Vec3; kind: string }
  | { type: "explosion"; pos: Vec3; kind: string; radius: number }
  | { type: "flashed"; player: number; amount: number }
  | { type: "glass"; boxId: number; pos: Vec3 }
  | { type: "spawn"; player: number; pos: Vec3; reason: string }
  | { type: "momentum"; player: number; value: number; tierReached: number | null }
  | { type: "supportReady"; player: number; id: string }
  | { type: "supportDeployed"; player: number; team: Team; id: string }
  | { type: "supportWarning"; team: Team; id: string; pos?: Vec3 }
  | { type: "deviceDestroyed"; id: number; kind: string; pos: Vec3; team: Team; by: number | null }
  | { type: "announce"; text: string; tone: "neutral" | "good" | "bad" | "warn" }
  | { type: "mineTrip"; pos: Vec3 }
  | { type: "ping"; player: number; team: Team; pos: Vec3 }
  | { type: "matchEnd"; result: MatchResult }
  | { type: "uiError"; text: string };

export interface PlayerResult {
  id: number; name: string; team: Team; bot: boolean;
  kills: number; deaths: number; assists: number; score: number; supportDestroyed: number; bestStreak: number;
  headshots: number; adsKills: number; equipmentHits: number; zonesVisited: number;
  weapons: Record<string, { shots: number; hits: number; kills: number }>;
}

export interface MatchResult {
  matchId: string;
  map: string;
  winner: Team | -1;
  scores: [number, number];
  duration: number;
  players: PlayerResult[];
  localId: number;
  /** Room-side integrity tag (not cryptographic in Practice). */
  signature: string;
}

export interface JoinRequest { name: string; loadout: Loadout; protocol: number }
