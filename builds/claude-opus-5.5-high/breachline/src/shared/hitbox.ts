import { Vec3 } from "./math";
import { rayAabb } from "./collision";
import { HitZone } from "../content/weapons";
import { MOVE } from "../content/tuning";

export interface HitboxSet { zone: HitZone; min: Vec3; max: Vec3 }

/** Simplified hitbox rig (axis-aligned): head, upper torso, lower torso, legs+arms as limbs. */
export function hitboxes(pos: Vec3, crouchT: number, out: HitboxSet[] = []): HitboxSet[] {
  const k = 1 + (MOVE.crouchHeight / MOVE.standHeight - 1) * crouchT;
  const y = (v: number) => pos.y + v * k;
  const mk = (zone: HitZone, hw: number, y0: number, y1: number, hd = hw, ox = 0): HitboxSet => ({
    zone, min: { x: pos.x - hw + ox, y: y(y0), z: pos.z - hd }, max: { x: pos.x + hw + ox, y: y(y1), z: pos.z + hd },
  });
  out.length = 0;
  out.push(mk("head", 0.13, 1.52, 1.8));
  out.push(mk("upper", 0.24, 1.18, 1.52, 0.2));
  out.push(mk("lower", 0.22, 0.88, 1.18, 0.18));
  out.push(mk("limb", 0.2, 0.0, 0.88, 0.16));
  return out;
}

const ZONE_PRIORITY: Record<HitZone, number> = { head: 0, upper: 1, lower: 2, limb: 3 };

export function rayHitboxes(o: Vec3, d: Vec3, maxT: number, boxes: HitboxSet[]): { t: number; zone: HitZone } | null {
  let best: { t: number; zone: HitZone } | null = null;
  for (const hb of boxes) {
    const h = rayAabb(o, d, hb.min, hb.max, maxT);
    if (!h) continue;
    if (!best || h.t < best.t - 0.02 || (Math.abs(h.t - best.t) <= 0.02 && ZONE_PRIORITY[hb.zone] < ZONE_PRIORITY[best.zone])) best = { t: h.t, zone: hb.zone };
  }
  return best;
}
