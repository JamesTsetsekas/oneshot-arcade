import { Match } from "../src/server/match/match";
import type { Actor } from "../src/server/match/actor";
import { aimPivot } from "../src/shared/aim";
import { weaponStats, type WeaponId } from "../src/shared/content/weapons";
import type { ItemId } from "../src/shared/content/items";
import { Btn, DT } from "../src/shared/protocol/protocol";

export const HUMAN = { name: "Tester", body: 0, primary: "#1fb0a6", secondary: "#f4b63a", sail: "#ea6a50" };

/** A private practice-range match: flat deck, target dummies, no storm. */
export function practice(seed = 7): { m: Match; me: Actor } {
  const m = new Match({ seed, mode: "practice", pace: "standard", seats: 1, human: HUMAN });
  return { m, me: m.actors[0]! };
}

/** Pier-local to world coordinates. */
export function pier(m: Match, lx: number, lz: number): [number, number] {
  return [m.island.pier.x + lx, m.island.pier.z + lz];
}

export function place(m: Match, a: Actor, lx: number, lz: number, y = m.island.pier.y): void {
  const [x, z] = pier(m, lx, lz);
  a.x = x;
  a.z = z;
  a.y = y;
  a.vx = a.vy = a.vz = 0;
}

export interface StepInput {
  moveX?: number;
  moveZ?: number;
  buttons?: number;
  pressed?: number;
  yaw?: number;
  pitch?: number;
  slot?: number;
}

/** Steps the match n ticks with a held input; `pressed` is applied on the first tick only. */
export function run(m: Match, a: Actor, seconds: number, inp: StepInput = {}): void {
  const n = Math.round(seconds / DT);
  for (let i = 0; i < n; i++) {
    a.input.moveX = inp.moveX ?? 0;
    a.input.moveZ = inp.moveZ ?? 0;
    a.input.buttons = inp.buttons ?? 0;
    a.input.pressed = i === 0 ? (inp.pressed ?? 0) : 0;
    if (inp.yaw !== undefined) a.input.yaw = inp.yaw;
    if (inp.pitch !== undefined) a.input.pitch = inp.pitch;
    if (inp.slot !== undefined) a.input.slot = inp.slot;
    a.input.viewTime = m.time;
    m.step();
    m.flushEvents();
  }
}

export function give(a: Actor, slot: number, weapon: WeaponId, rarity = 0): void {
  a.slots[slot] = { kind: "weapon", weapon, rarity, mag: weaponStats(weapon, rarity).mag };
}
export function giveItem(a: Actor, slot: number, item: ItemId, count: number): void {
  a.slots[slot] = { kind: "item", item, count };
}

/** Points the actor's aim ray (from the over-shoulder pivot) at a world point. */
export function aimAt(a: Actor, tx: number, ty: number, tz: number): void {
  const p = { x: 0, y: 0, z: 0 };
  let yaw = Math.atan2(tx - a.x, tz - a.z);
  let pitch = 0;
  for (let i = 0; i < 6; i++) {
    aimPivot({ x: a.x, y: a.y, z: a.z, yaw, crouch: a.crouch }, 1, p);
    yaw = Math.atan2(tx - p.x, tz - p.z);
    pitch = Math.atan2(ty - p.y, Math.hypot(tx - p.x, tz - p.z));
  }
  a.input.yaw = yaw;
  a.input.pitch = pitch;
  a.yaw = yaw;
  a.pitch = pitch;
}

export function hp(a: Actor): number {
  return a.health + a.aegis + a.reserve;
}

export { Btn, DT };
