// Authoritative combat: aim resolution, hitscan with hit zones, pellet caps,
// projectiles, splash/knockback, shields, damage attribution.

import { V3 } from '../shared/math';
import { CollisionWorld, rayBox, raySphere } from '../shared/world/collision';
import { cameraRig, aimRayStart, muzzle, coneDir } from '../shared/sim/aim';
import { falloffMult, weaponStats, WeaponStats } from '../shared/content/weapons';
import { MOVE } from '../shared/content/rules';
import type { Player, Smoke } from './types';

export type Zone = 'head' | 'torso' | 'limb';

export interface PlayerHit { p: Player; t: number; zone: Zone }

/** Hitboxes: head sphere, torso box, limb box. Bounded by stance only (not animation). */
export function rayPlayers(players: Player[], o: V3, d: V3, maxT: number, ignore: number): PlayerHit | null {
  let best: PlayerHit | null = null;
  let bestT = maxT;
  for (const p of players) {
    if (!p.alive || p.id === ignore) continue;
    const s = p.ms;
    if (s.mode === 'skiff' || s.mode === 'dead') continue;
    // quick reject
    const cx = s.x - o.x, cz = s.z - o.z;
    const along = cx * d.x + cz * d.z;
    if (along < -2 || along > bestT + 2) continue;
    const crouch = s.crouch || s.slide > 0;
    const swim = s.mode === 'swim';
    const lying = s.mode === 'freefall' || s.mode === 'glide';
    const headY = swim ? 1.45 : crouch ? 1.12 : 1.62;
    const th = raySphere(o, d, { x: s.x, y: s.y + headY, z: s.z }, 0.24, bestT);
    if (th !== null && th < bestT) { bestT = th; best = { p, t: th, zone: 'head' }; }
    const torsoLo = swim ? 0.85 : crouch ? 0.55 : 0.88, torsoHi = swim ? 1.3 : crouch ? 1.0 : 1.45;
    const tw = lying ? 0.5 : 0.3;
    const tb = rayBox(o, d, { minX: s.x - tw, maxX: s.x + tw, minY: s.y + torsoLo, maxY: s.y + torsoHi, minZ: s.z - tw, maxZ: s.z + tw }, bestT);
    if (tb && tb.t < bestT) { bestT = tb.t; best = { p, t: tb.t, zone: 'torso' }; }
    if (!swim) {
      const lb = rayBox(o, d, { minX: s.x - 0.24, maxX: s.x + 0.24, minY: s.y, maxY: s.y + torsoLo, minZ: s.z - 0.24, maxZ: s.z + 0.24 }, bestT);
      if (lb && lb.t < bestT) { bestT = lb.t; best = { p, t: lb.t, zone: 'limb' }; }
    }
  }
  return best;
}

export function smokeBlocks(smokes: Smoke[], a: V3, b: V3): boolean {
  for (const s of smokes) {
    // segment-sphere distance
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
    const L2 = dx * dx + dy * dy + dz * dz || 1;
    let t = ((s.x - a.x) * dx + (s.y - a.y) * dy + (s.z - a.z) * dz) / L2;
    t = Math.max(0, Math.min(1, t));
    const px = a.x + dx * t - s.x, py = a.y + dy * t - s.y, pz = a.z + dz * t - s.z;
    if (px * px + py * py + pz * pz < s.r * s.r * 0.8) return true;
  }
  return false;
}

/** Resolve where the shooter is aiming: camera ray to target point. */
export function resolveAimPoint(w: CollisionWorld, players: Player[], p: Player, boom: number, range: number): V3 {
  const s = p.ms;
  const rig = cameraRig(s.x, s.y, s.z, s.yaw, s.pitch, s.crouch || s.slide > 0, boom, p.shoulder);
  const o = aimRayStart(rig);
  const hw = w.raycast(o, rig.dir, range);
  const maxT = hw ? hw.t : range;
  const hp = rayPlayers(players, o, rig.dir, maxT, p.id);
  const t = hp ? hp.t : maxT;
  return { x: o.x + rig.dir.x * t, y: o.y + rig.dir.y * t, z: o.z + rig.dir.z * t };
}

export function currentSpread(p: Player, st: WeaponStats): number {
  const s = p.ms;
  const speed = Math.hypot(s.vx, s.vz);
  let base = p.ads ? st.adsSpread : st.hipSpread;
  let mult = 1 + Math.min(1, speed / MOVE.sprint) * (p.ads ? 1.2 : 0.6);
  if (s.mode === 'air' || s.mode === 'zip') mult *= 1.8;
  if (s.crouch && s.slide <= 0) mult *= 0.8;
  if (s.mode === 'swim') mult *= 1.4;
  return base * mult + p.bloom;
}

export interface ShotResult {
  muzzle: V3;
  end: V3;
  hits: { p: Player; zone: Zone; dmg: number; at: V3 }[];
  worldHit: { x: number; y: number; z: number; nx: number; ny: number; nz: number } | null;
}

/** Fire a hitscan weapon (possibly multiple pellets). Returns per-target damage already capped. */
export function fireHitscan(w: CollisionWorld, players: Player[], smokes: Smoke[], p: Player, st: WeaponStats, rand: () => number, boom: number): ShotResult {
  const s = p.ms;
  const target = resolveAimPoint(w, players, p, boom, st.def.range);
  const m = muzzle(s.x, s.y, s.z, s.yaw, s.pitch, s.crouch || s.slide > 0);
  let dx = target.x - m.x, dy = target.y - m.y, dz = target.z - m.z;
  const L = Math.hypot(dx, dy, dz) || 1;
  const base = { x: dx / L, y: dy / L, z: dz / L };
  const spread = currentSpread(p, st);
  const center = coneDir(base, spread, rand(), rand());
  const pellets = st.def.pellets;
  const perTarget = new Map<Player, { dmg: number; zone: Zone; at: V3; t: number }>();
  let firstEnd: V3 | null = null;
  let worldHit: ShotResult['worldHit'] = null;
  for (let i = 0; i < pellets; i++) {
    const dir = pellets > 1 ? coneDir(center, st.pelletSpread, rand(), rand()) : center;
    const wh = w.raycast(m, dir, st.def.range);
    const maxT = wh ? wh.t : st.def.range;
    const ph = rayPlayers(players, m, dir, maxT, p.id);
    const t = ph ? ph.t : maxT;
    const end = { x: m.x + dir.x * t, y: m.y + dir.y * t, z: m.z + dir.z * t };
    if (i === 0) firstEnd = end;
    if (ph) {
      // Mist only blocks vision, never bullets (same on every quality preset).
      let dmg = st.damage * falloffMult(st, t);
      dmg *= ph.zone === 'head' ? st.headMult : ph.zone === 'limb' ? st.def.limbMult : 1;
      const prev = perTarget.get(ph.p);
      const zone: Zone = prev && prev.zone === 'head' ? 'head' : ph.zone;
      perTarget.set(ph.p, { dmg: (prev?.dmg ?? 0) + dmg, zone, at: end, t: Math.min(prev?.t ?? 1e9, t) });
    } else if (wh && !worldHit) {
      worldHit = { x: wh.x, y: wh.y, z: wh.z, nx: wh.nx, ny: wh.ny, nz: wh.nz };
    }
  }
  const hits: ShotResult['hits'] = [];
  for (const [tp, v] of perTarget) {
    let dmg = v.dmg;
    if (pellets > 1 && st.def.pelletCapMax) {
      const headCap = v.zone === 'head' ? st.def.headMult : 1;
      dmg = Math.min(dmg, st.def.pelletCapMax * headCap);
      dmg = Math.max(dmg, (st.def.pelletCapMin ?? 0) * falloffMult(st, v.t));
    }
    hits.push({ p: tp, zone: v.zone, dmg, at: v.at });
  }
  return { muzzle: m, end: firstEnd ?? target, hits, worldHit };
}

export function statsFor(slot: { w: import('../shared/content/weapons').WeaponId; r: import('../shared/content/rarity').Rarity }) {
  return weaponStats(slot.w, slot.r);
}
