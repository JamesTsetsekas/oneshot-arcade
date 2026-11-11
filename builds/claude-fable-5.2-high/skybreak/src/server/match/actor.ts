// server-match: authoritative actor state. Bots and humans share this exact structure and input path.
import { AEGIS_MAX, HEALTH_MAX, INVENTORY_SLOTS, type ItemId, type Slot } from "../../shared/content/items";
import { MOVE } from "../../shared/content/rules";
import type { AmmoType } from "../../shared/content/weapons";
import { Mode, emptyInput, type InputFrame, type ModeId } from "../../shared/protocol/protocol";

export const HIST = 8;

export interface ActorStats {
  kills: number;
  assists: number;
  damage: number;
  damageTaken: number;
  shots: number;
  hits: number;
  headshots: number;
  distance: number;
  stormDamage: number;
  survival: number;
  loot: { name: string; rarity: number; time: number }[];
  timeline: { time: number; text: string }[];
  route: number[];
}

export interface Actor {
  id: number;
  name: string;
  bot: boolean;
  dummy: boolean;
  mover: boolean;
  body: number;
  primary: string;
  secondary: string;
  sail: string;

  alive: boolean;
  placement: number;
  deathTime: number;
  reviveAt: number;
  homeX: number;
  homeZ: number;

  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  pitch: number;
  mode: ModeId;
  crouch: boolean;
  coyote: number;
  energy: number;
  lastSprint: number;
  sprinting: boolean;
  slideT: number;
  slideGate: number;
  slideSpeed: number;
  sdx: number;
  sdz: number;
  mantleT: number;
  mantleDur: number;
  mfx: number;
  mfy: number;
  mfz: number;
  mtx: number;
  mty: number;
  mtz: number;
  zipId: number;
  zipT: number;
  zipDir: number;
  ascId: number;
  ascDir: number;
  grx: number;
  gry: number;
  grz: number;
  grappleEnd: number;
  insertion: boolean;
  ventBoost: boolean;
  noFall: boolean;
  inStorm: boolean;
  inHazard: boolean;

  health: number;
  aegis: number;
  reserve: number;
  lastDamage: number;

  slots: Slot[];
  selected: number;
  lastInputSlot: number;
  ammo: Record<AmmoType, number>;
  nextFire: number;
  reloadStart: number;
  reloadEnd: number;
  equipUntil: number;
  chargeStart: number;
  chargeEnd: number;
  burst: number;
  lastShot: number;
  shotCounter: number;
  bloom: number;
  recoilP: number;
  recoilY: number;
  useItem: ItemId | null;
  useStart: number;
  useEnd: number;
  useHealRate: number;
  nextMelee: number;
  nextThrow: number;
  holdLoot: number;
  holdStart: number;

  input: InputFrame;
  marker: { x: number; z: number } | null;
  spectate: number;
  stats: ActorStats;
  damageLog: { from: number; amount: number; time: number }[];
  /** Lag-compensation history ring: x,y,z,crouch per tick. */
  hist: Float32Array;
  trail: { x: number; y: number; z: number; t: number; yaw: number }[];
}

export function createActor(id: number, name: string, bot: boolean): Actor {
  return {
    id, name, bot, dummy: false, mover: false, body: 0, primary: "#1fb0a6", secondary: "#f4b63a", sail: "#ea6a50",
    alive: true, placement: 0, deathTime: 0, reviveAt: 0, homeX: 0, homeZ: 0,
    x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, yaw: 0, pitch: 0, mode: Mode.Ground, crouch: false, coyote: 0,
    energy: 1, lastSprint: -10, sprinting: false, slideT: 0, slideGate: 0, slideSpeed: 0, sdx: 0, sdz: 1,
    mantleT: 0, mantleDur: 0, mfx: 0, mfy: 0, mfz: 0, mtx: 0, mty: 0, mtz: 0,
    zipId: -1, zipT: 0, zipDir: 1, ascId: -1, ascDir: 1, grx: 0, gry: 0, grz: 0, grappleEnd: 0,
    insertion: false, ventBoost: false, noFall: false, inStorm: false, inHazard: false,
    health: HEALTH_MAX, aegis: AEGIS_MAX, reserve: 0, lastDamage: -100,
    slots: new Array<Slot>(INVENTORY_SLOTS).fill(null), selected: 0, lastInputSlot: 0,
    ammo: { light: 0, shell: 0, heavy: 0, charge: 0 },
    nextFire: 0, reloadStart: -1, reloadEnd: -1, equipUntil: 0, chargeStart: -1, chargeEnd: -1, burst: 0, lastShot: -10,
    shotCounter: 0, bloom: 0, recoilP: 0, recoilY: 0,
    useItem: null, useStart: -1, useEnd: -1, useHealRate: 0, nextMelee: 0, nextThrow: 0, holdLoot: -1, holdStart: 0,
    input: emptyInput(), marker: null, spectate: -1,
    stats: { kills: 0, assists: 0, damage: 0, damageTaken: 0, shots: 0, hits: 0, headshots: 0, distance: 0, stormDamage: 0, survival: 0, loot: [], timeline: [], route: [] },
    damageLog: [], hist: new Float32Array(HIST * 4), trail: [],
  };
}

export function resetLoadout(a: Actor): void {
  a.slots = new Array<Slot>(INVENTORY_SLOTS).fill(null);
  a.selected = 0;
  a.ammo = { light: 0, shell: 0, heavy: 0, charge: 0 };
  a.health = HEALTH_MAX;
  a.aegis = AEGIS_MAX;
  a.reserve = 0;
  a.reloadEnd = -1;
  a.reloadStart = -1;
  a.useItem = null;
  a.chargeEnd = -1;
  a.energy = 1;
}

export function actorHeight(a: Actor): number {
  return a.crouch || a.mode === Mode.Slide ? MOVE.crouchHeight : MOVE.height;
}

export function totalHp(a: Actor): number {
  return a.health + a.aegis + a.reserve;
}
