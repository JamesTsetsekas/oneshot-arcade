// shared-protocol: the only vocabulary the client and the authoritative match share.
// In this slice the transport is an in-process loopback, but nothing here assumes that.
import type { ItemId, Slot } from "../content/items";
import type { AmmoType, WeaponId } from "../content/weapons";
import type { Pace } from "../content/rules";

export const PROTOCOL_VERSION = 1;
export const TICK_RATE = 30;
export const DT = 1 / TICK_RATE;

export const Btn = {
  Fire: 1,
  Ads: 2,
  Sprint: 4,
  Crouch: 8,
  Jump: 16,
  Reload: 32,
  Interact: 64,
  Melee: 128,
  Sail: 256,
  Throw: 512,
} as const;

/** Sequenced input frame, sent every tick. */
export interface InputFrame {
  seq: number;
  moveX: number;
  moveZ: number;
  yaw: number;
  pitch: number;
  /** Held buttons. */
  buttons: number;
  /** Buttons that went down since the previous frame (latched so sub-tick taps are not lost). */
  pressed: number;
  /** Selected inventory slot 0..4. */
  slot: number;
  /** +1 right shoulder, -1 left. */
  shoulder: number;
  /** Match time (seconds) of the world the client was rendering; used for lag compensation. */
  viewTime: number;
}

export function emptyInput(): InputFrame {
  return { seq: 0, moveX: 0, moveZ: 0, yaw: 0, pitch: 0, buttons: 0, pressed: 0, slot: 0, shoulder: 1, viewTime: 0 };
}

/** Reliable, validated action requests. */
export type ActionRequest =
  | { type: "dropSlot"; slot: number }
  | { type: "swapSlots"; a: number; b: number }
  | { type: "marker"; x: number; z: number }
  | { type: "clearMarker" }
  | { type: "ready" }
  | { type: "spectate"; dir: 1 | -1 }
  | { type: "practiceRefill" };

export const Mode = {
  Pier: 0,
  Skiff: 1,
  Freefall: 2,
  Glide: 3,
  Ground: 4,
  Air: 5,
  Slide: 6,
  Mantle: 7,
  Swim: 8,
  Zip: 9,
  Ascend: 10,
  Grapple: 11,
  Dead: 12,
} as const;
export type ModeId = (typeof Mode)[keyof typeof Mode];

export const ActorFlag = {
  Crouch: 1,
  Ads: 2,
  Firing: 4,
  Reloading: 8,
  Using: 16,
  Sprinting: 32,
  Glint: 64,
  Charging: 128,
  Dummy: 256,
} as const;

/** What other clients are allowed to know about an actor inside their interest radius. */
export interface ActorView {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  pitch: number;
  mode: ModeId;
  flags: number;
  /** Held weapon (for the model) or null; item id when holding a consumable. */
  weapon: WeaponId | null;
  item: ItemId | null;
  rarity: number;
}

export interface SelfView {
  id: number;
  alive: boolean;
  health: number;
  aegis: number;
  reserve: number;
  energy: number;
  slots: Slot[];
  selected: number;
  ammo: Record<AmmoType, number>;
  reloadT: number; // 0..1 progress, -1 when idle
  useT: number; // 0..1 progress, -1 when idle
  chargeT: number; // rail charge 0..1, -1 idle
  recoilPitch: number;
  recoilYaw: number;
  spread: number; // current cone half-angle in degrees
  kills: number;
  assists: number;
  damage: number;
  inStorm: boolean;
  canDeploy: boolean;
  canJump: boolean;
  altitude: number;
  marker: { x: number; z: number } | null;
  grappleTarget: { x: number; y: number; z: number } | null;
  hazard: boolean;
}

export interface LootView {
  id: number;
  x: number;
  y: number;
  z: number;
  kind: "weapon" | "item" | "ammo";
  weapon?: WeaponId;
  rarity?: number;
  item?: ItemId;
  ammo?: AmmoType;
  count: number;
  mag?: number;
}

export interface ChestView {
  id: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  kind: "chest" | "locker" | "cache" | "capsule" | "vault";
  open: boolean;
}

export interface ProjectileView {
  id: number;
  kind: "rail" | "orb" | "mist" | "gale";
  x: number;
  y: number;
  z: number;
}

export interface StormView {
  phase: number;
  state: "calm" | "wait" | "shrink" | "done";
  /** Seconds until the next state change. */
  timer: number;
  cx: number;
  cz: number;
  r: number;
  nx: number;
  nz: number;
  nr: number;
  dps: number;
  totalPhases: number;
}

export type FocusView =
  | null
  | {
      kind: "loot" | "chest" | "zip" | "ascender";
      id: number;
      label: string;
      /** For loot that needs a swap: 0..1 hold progress. */
      hold: number;
      needsSwap: boolean;
    };

export type MatchEvent =
  | { t: "shot"; actor: number; weapon: WeaponId; ox: number; oy: number; oz: number; tx: number; ty: number; tz: number; hit: 0 | 1 | 2 }
  | { t: "hit"; attacker: number; victim: number; dmg: number; zone: "head" | "torso" | "limb" | "splash" | "melee"; shield: boolean; broke: boolean; killed: boolean; dist: number; fromX: number; fromZ: number }
  | { t: "kill"; killer: number; victim: number; cause: string; assists: number[]; x: number; y: number; z: number; alive: number }
  | { t: "sound"; kind: string; x: number; y: number; z: number; actor: number }
  | { t: "explode"; kind: "orb" | "mist" | "rail" | "capsule" | "caravan"; x: number; y: number; z: number; r: number }
  | { t: "storm"; phase: number; state: "wait" | "shrink" | "final" }
  | { t: "ping"; kind: "capsule" | "caravan"; x: number; z: number }
  | { t: "echo"; points: { x: number; y: number; z: number; age: number; yaw: number }[] }
  | { t: "toast"; msg: string; tone: "info" | "warn" | "good" }
  | { t: "pickup"; actor: number; kind: "weapon" | "item" | "ammo"; name: string; rarity: number }
  | { t: "land"; actor: number; hard: boolean }
  | { t: "launch"; actor: number; kind: "vent" | "jump" | "deploy" | "grapple" | "zip" | "mantle" | "slide" | "splash" }
  | { t: "phase"; phase: MatchPhase };

export type MatchPhase = "staging" | "skiff" | "active" | "ended";

export interface CaravanView {
  x: number;
  y: number;
  z: number;
  alive: boolean;
  shield: number;
}

export interface Snapshot {
  tick: number;
  time: number;
  phase: MatchPhase;
  /** Seconds left in staging, or until forced jump while on the skiff. */
  phaseTimer: number;
  viewId: number;
  spectating: boolean;
  you: SelfView;
  actors: ActorView[];
  loot: LootView[];
  chests: ChestView[];
  projectiles: ProjectileView[];
  mists: { x: number; y: number; z: number; r: number; age: number }[];
  storm: StormView;
  alive: number;
  skiff: { x: number; y: number; z: number; yaw: number; active: boolean };
  caravan: CaravanView | null;
  focus: FocusView;
  events: MatchEvent[];
}

export interface RosterEntry {
  id: number;
  name: string;
  bot: boolean;
  body: number;
  primary: string;
  secondary: string;
  sail: string;
}

export interface MatchConfig {
  seed: number;
  mode: "solo" | "practice";
  pace: Pace;
  seats: number;
  human: null | { name: string; body: number; primary: string; secondary: string; sail: string };
}

export interface Welcome {
  protocol: number;
  content: string;
  config: MatchConfig;
  youId: number;
  roster: RosterEntry[];
  skiffPath: { ax: number; az: number; bx: number; bz: number };
}

export interface ResultRow {
  id: number;
  name: string;
  bot: boolean;
  placement: number;
  kills: number;
  assists: number;
  damage: number;
  survival: number;
}

export interface MatchResults {
  winnerId: number;
  winnerName: string;
  duration: number;
  rows: ResultRow[];
  you: null | {
    placement: number;
    kills: number;
    assists: number;
    damage: number;
    damageTaken: number;
    shots: number;
    hits: number;
    headshots: number;
    survival: number;
    distance: number;
    stormDamage: number;
    loot: { name: string; rarity: number; time: number }[];
    timeline: { time: number; text: string }[];
    route: number[]; // x,z pairs
  };
}

/** Transport-agnostic server surface the client talks to. */
export interface MatchLink {
  welcome: Welcome;
  sendInput(frame: InputFrame): void;
  sendAction(req: ActionRequest): void;
}
