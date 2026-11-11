// Utility simulation: fixed-step swept-sphere grenade trajectories with material restitution, deterministic
// sleep, and the five effects (Veil, Arc Flash, Thermite, Pulse Shard, Fragment Charge).

import type { UtilityId } from '../content/economy';
import { CEILING_Y, MAP_HEIGHT, MAP_WIDTH, MATERIALS, MaterialId } from './map';
import { hardBlocked, lineOfSight, raycastFirst, sweepSphere } from './collision';
import { Vec3, clamp, dirFromAngles } from './math';
import { isWalkableAt, floorAt, straightWalkable } from './nav';
import type { Grenade, Player } from './types';
import type { Match } from './match';

export const GRENADE_R = 0.11;
export const GRENADE_GRAVITY = 18;
const DT = 1 / 64;

const RESTITUTION: Record<MaterialId, number> = {
  concrete: 0.42, metal: 0.5, glass: 0.3, thin: 0.28, foliage: 0.08, crate: 0.34, platform: 0.38,
};

export const SMOKE_RADIUS = 3.1;
export const SMOKE_BLOOM_DELAY = 0.7;
export const SMOKE_DURATION = 17;
export const MAX_SMOKES = 4;
export const FIRE_DURATION = 7;

export function throwVelocity(p: { yaw: number; pitch: number; vel: Vec3 }, speed: number): Vec3 {
  const dir = dirFromAngles(p.yaw, p.pitch + 0.1);
  return { x: dir.x * speed + p.vel.x * 0.5, y: dir.y * speed + p.vel.y * 0.3, z: dir.z * speed + p.vel.z * 0.5 };
}

export function throwGrenade(m: Match, p: Player, type: UtilityId, speed: number): Grenade {
  const eye = m.eyePos(p);
  const dir = dirFromAngles(p.yaw, p.pitch + 0.1);
  let pos = { x: eye.x + dir.x * 0.45, y: eye.y + dir.y * 0.45 - 0.1, z: eye.z + dir.z * 0.45 };
  // Do not spawn inside geometry.
  const blocked = raycastFirst(eye, dir, 0.5);
  if (blocked) pos = { x: eye.x + dir.x * Math.max(0, blocked.t0 - 0.15), y: eye.y + dir.y * Math.max(0, blocked.t0 - 0.15) - 0.05, z: eye.z + dir.z * Math.max(0, blocked.t0 - 0.15) };
  const g: Grenade = {
    id: m.nextId(), type, owner: p.id, side: p.side, pos, vel: throwVelocity(p, speed), born: m.time,
    detonateAt: type === 'flash' ? m.time + 1.5 : type === 'frag' ? m.time + 1.9 : -1,
    landed: false, landedAt: 0, bounces: 0, sleep: false, pulses: 0, nextPulse: 0, destroyed: false,
  };
  m.grenades.push(g);
  m.emit({ t: 'sfx', id: p.id, kind: 'throw', p: { ...p.pos } });
  return g;
}

/** Advance a grenade one fixed step. Pure with respect to the match (no effects). Returns true if it touched the ground. */
export function stepGrenadePhysics(g: Pick<Grenade, 'pos' | 'vel' | 'bounces' | 'sleep' | 'landed'>): { bounced: boolean; mat?: MaterialId; speed: number } {
  g.vel.y -= GRENADE_GRAVITY * DT;
  const next = { x: g.pos.x + g.vel.x * DT, y: g.pos.y + g.vel.y * DT, z: g.pos.z + g.vel.z * DT };
  let bounced = false;
  let mat: MaterialId | undefined;
  let groundTouch = false;
  const hit = sweepSphere(g.pos, next, GRENADE_R);
  if (hit && hit.t < 1) {
    const cx = g.pos.x + (next.x - g.pos.x) * hit.t, cy = g.pos.y + (next.y - g.pos.y) * hit.t, cz = g.pos.z + (next.z - g.pos.z) * hit.t;
    const e = RESTITUTION[hit.box.mat];
    const vn = g.vel.x * hit.nx + g.vel.y * hit.ny + g.vel.z * hit.nz;
    if (vn < 0) {
      g.vel.x -= (1 + e) * vn * hit.nx;
      g.vel.y -= (1 + e) * vn * hit.ny;
      g.vel.z -= (1 + e) * vn * hit.nz;
      if (hit.ny > 0.7) { g.vel.x *= 0.82; g.vel.z *= 0.82; groundTouch = true; } else { g.vel.x *= 0.9; g.vel.y *= 0.95; g.vel.z *= 0.9; }
      if (-vn > 1.2) { bounced = true; mat = hit.box.mat; g.bounces++; }
    }
    g.pos.x = cx + hit.nx * 0.004; g.pos.y = cy + hit.ny * 0.004; g.pos.z = cz + hit.nz * 0.004;
  } else {
    g.pos.x = next.x; g.pos.y = next.y; g.pos.z = next.z;
  }
  // world floor
  if (g.pos.y < GRENADE_R) {
    g.pos.y = GRENADE_R;
    if (g.vel.y < 0) {
      if (-g.vel.y > 1.2) { bounced = true; mat = mat ?? 'concrete'; g.bounces++; }
      g.vel.y = -g.vel.y * 0.4;
      if (Math.abs(g.vel.y) < 1.0) g.vel.y = 0;
      g.vel.x *= 0.8; g.vel.z *= 0.8;
    }
    groundTouch = true;
  }
  // Keep inside the map volume: the roof is at CEILING_Y, the outer walls bound x and z.
  if (g.pos.y > CEILING_Y - GRENADE_R) { g.pos.y = CEILING_Y - GRENADE_R; if (g.vel.y > 0) g.vel.y = -g.vel.y * 0.3; }
  if (g.pos.x < GRENADE_R) { g.pos.x = GRENADE_R; g.vel.x = Math.abs(g.vel.x) * 0.4; }
  if (g.pos.z < GRENADE_R) { g.pos.z = GRENADE_R; g.vel.z = Math.abs(g.vel.z) * 0.4; }
  if (g.pos.x > MAP_WIDTH - GRENADE_R) { g.pos.x = MAP_WIDTH - GRENADE_R; g.vel.x = -Math.abs(g.vel.x) * 0.4; }
  if (g.pos.z > MAP_HEIGHT - GRENADE_R) { g.pos.z = MAP_HEIGHT - GRENADE_R; g.vel.z = -Math.abs(g.vel.z) * 0.4; }
  const speed = Math.hypot(g.vel.x, g.vel.y, g.vel.z);
  if (groundTouch && speed < 0.9) {
    g.vel.x = g.vel.y = g.vel.z = 0;
    g.sleep = true;
    g.landed = true;
  }
  return { bounced, mat, speed };
}

/** Simulate a throw ahead to find where it comes to rest (used by Practice preview and bot throws). */
export function predictThrow(start: Vec3, vel: Vec3, maxSteps = 64 * 5): { end: Vec3; path: Vec3[]; steps: number } {
  const g = { pos: { ...start }, vel: { ...vel }, bounces: 0, sleep: false, landed: false };
  const path: Vec3[] = [{ ...g.pos }];
  let i = 0;
  for (; i < maxSteps; i++) {
    stepGrenadePhysics(g);
    if (i % 4 === 0) path.push({ ...g.pos });
    if (g.sleep) break;
  }
  path.push({ ...g.pos });
  return { end: { ...g.pos }, path, steps: i };
}

export function stepGrenades(m: Match): void {
  if (!m.grenades.length) return;
  for (const g of m.grenades) {
    if (g.destroyed) continue;
    if (!g.sleep) {
      const r = stepGrenadePhysics(g);
      if (r.bounced) m.emit({ t: 'nade', kind: 'bounce', type: g.type, p: { ...g.pos }, id: g.id, owner: g.owner, side: g.side, data: [r.mat === 'glass' ? 1 : r.mat === 'metal' ? 2 : 0] });
      if (g.landed && g.landedAt === 0) g.landedAt = m.time;
    }
    switch (g.type) {
      case 'flash':
        if (m.time >= g.detonateAt) { popFlash(m, g); g.destroyed = true; }
        break;
      case 'frag':
        if (m.time >= g.detonateAt) { popFrag(m, g); g.destroyed = true; }
        break;
      case 'veil':
        if ((g.landed && m.time - g.landedAt > 0.35) || m.time - g.born > 4) { bloomSmoke(m, g); g.destroyed = true; }
        break;
      case 'thermite':
        if ((g.landed && m.time - g.landedAt > 0.2) || m.time - g.born > 3) { igniteThermite(m, g); g.destroyed = true; }
        break;
      case 'pulse':
        stepPulse(m, g);
        break;
    }
  }
  m.grenades = m.grenades.filter((g) => !g.destroyed);
  m.smokes = m.smokes.filter((s) => m.time < s.until);
}

function popFlash(m: Match, g: Grenade): void {
  const owner = m.players[g.owner];
  m.emit({ t: 'nade', kind: 'flash', type: 'flash', p: { ...g.pos }, id: g.id, owner: g.owner, side: g.side });
  for (const q of m.players) {
    if (!q.alive) continue;
    const eye = m.eyePos(q);
    const dx = g.pos.x - eye.x, dy = g.pos.y - eye.y, dz = g.pos.z - eye.z;
    const dist = Math.hypot(dx, dy, dz);
    if (dist > 32) continue;
    if (!lineOfSight(g.pos, eye) || m.isSmoked(g.pos, eye)) continue;
    const fwd = dirFromAngles(q.yaw, q.pitch);
    const cosA = (fwd.x * dx + fwd.y * dy + fwd.z * dz) / Math.max(dist, 0.001);
    const facing = clamp((cosA + 0.4) / 1.4, 0, 1);
    const distF = clamp(1 - dist / 32, 0.12, 1);
    const dur = 0.3 + 3.6 * Math.pow(facing, 1.6) * distF;
    const until = m.time + dur;
    if (until > q.flashUntil) { q.flashUntil = until; q.flashFull = m.time + dur * 0.5; }
    if (owner && q.side !== owner.side && dur > 0.8) owner.stats.flashed++;
  }
}

function popFrag(m: Match, g: Grenade): void {
  const owner = m.players[g.owner];
  m.emit({ t: 'nade', kind: 'frag', type: 'frag', p: { ...g.pos }, id: g.id, owner: g.owner, side: g.side });
  const c = { x: g.pos.x, y: g.pos.y + 0.35, z: g.pos.z };
  for (const q of m.players) {
    if (!q.alive) continue;
    if (owner && q.side === owner.side && q.id !== owner.id) continue;
    const t = { x: q.pos.x, y: q.pos.y + 1.0, z: q.pos.z };
    const d = Math.hypot(t.x - c.x, t.y - c.y, t.z - c.z);
    if (d > 8) continue;
    if (hardBlocked(c, t)) continue;
    const f = Math.pow(1 - d / 8, 1.1);
    const dmg = 165 * f;
    const health = q.armor > 0 ? dmg * 0.72 : dmg;
    const away = Math.hypot(t.x - c.x, t.z - c.z) || 1;
    q.vel.x += ((t.x - c.x) / away) * 7 * f;
    q.vel.z += ((t.z - c.z) / away) * 7 * f;
    q.vel.y = Math.max(q.vel.y, 2.2 * f);
    q.onGround = f < 0.25 ? q.onGround : false;
    m.applyDamage(q, owner ?? null, health, q.armor > 0 ? dmg * 0.14 : 0, 'chest', 'frag', 'frag', false, false);
  }
}

function bloomSmoke(m: Match, g: Grenade): void {
  const s = { id: m.nextId(), pos: { x: g.pos.x, y: g.pos.y + 1.5, z: g.pos.z }, radius: SMOKE_RADIUS, bloomAt: m.time + SMOKE_BLOOM_DELAY, until: m.time + SMOKE_BLOOM_DELAY + SMOKE_DURATION };
  m.smokes.push(s);
  while (m.smokes.length > MAX_SMOKES) m.smokes.shift();
  m.emit({ t: 'nade', kind: 'veil', type: 'veil', p: { ...s.pos }, id: s.id, owner: g.owner, side: g.side });
}

/** Authored surface cells: the navigation cells reachable from the impact point within a short flood radius. */
export function floodCells(x: number, z: number, radius: number, maxCells: number): Array<{ x: number; y: number; z: number }> {
  const out: Array<{ x: number; y: number; z: number }> = [];
  const sx = Math.floor(x) + 0.5, sz = Math.floor(z) + 0.5;
  if (!isWalkableAt(sx, sz)) return out;
  const seen = new Set<string>();
  const q: Array<[number, number]> = [[sx, sz]];
  seen.add(`${sx},${sz}`);
  while (q.length && out.length < maxCells) {
    const [cx, cz] = q.shift()!;
    out.push({ x: cx, y: floorAt(cx, cz), z: cz });
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, nz = cz + dz;
      const key = `${nx},${nz}`;
      if (seen.has(key)) continue;
      if (Math.hypot(nx - sx, nz - sz) > radius) continue;
      if (!isWalkableAt(nx, nz)) continue;
      if (!straightWalkable({ x: cx, y: floorAt(cx, cz), z: cz }, { x: nx, y: floorAt(nx, nz), z: nz })) continue;
      seen.add(key);
      q.push([nx, nz]);
    }
  }
  return out;
}

function igniteThermite(m: Match, g: Grenade): void {
  const cells = floodCells(g.pos.x, g.pos.z, 3.2, 26);
  if (!cells.length) {
    // Landed somewhere odd; burn a single cell around the grenade.
    cells.push({ x: g.pos.x, y: Math.max(0, g.pos.y - GRENADE_R), z: g.pos.z });
  }
  const f = { id: m.nextId(), owner: g.owner, cells, until: m.time + FIRE_DURATION };
  m.fires.push(f);
  m.emit({ t: 'nade', kind: 'thermite', type: 'thermite', p: { ...g.pos }, id: f.id, owner: g.owner, side: g.side, data: cells.flatMap((c) => [c.x, c.y, c.z]) });
}

function stepPulse(m: Match, g: Grenade): void {
  if (!g.landed) return;
  if (g.pulses === 0 && g.nextPulse === 0) g.nextPulse = g.landedAt + 0.5;
  if (g.pulses < 2 && m.time >= g.nextPulse) {
    g.pulses++;
    g.nextPulse = g.landedAt + 0.5 + 1.5 * g.pulses;
    const data: number[] = [];
    for (const q of m.players) {
      if (!q.alive || q.side === g.side) continue;
      const dx = q.pos.x - g.pos.x, dz = q.pos.z - g.pos.z;
      const d = Math.hypot(dx, dz);
      if (d > 22) continue;
      if (Math.hypot(q.vel.x, q.vel.z) < 1.0) continue;
      const ang = (Math.atan2(dx, -dz) + Math.PI * 2) % (Math.PI * 2);
      const sector = Math.round(ang / (Math.PI / 4)) % 8;
      const band = d < 8 ? 0 : d < 15 ? 1 : 2;
      data.push(sector, band);
    }
    m.emit({ t: 'nade', kind: 'pulsePing', type: 'pulse', p: { ...g.pos }, id: g.id, owner: g.owner, side: g.side, data });
  }
  if (g.pulses >= 2 && m.time > g.landedAt + 3.6) g.destroyed = true;
}

export { MATERIALS };
