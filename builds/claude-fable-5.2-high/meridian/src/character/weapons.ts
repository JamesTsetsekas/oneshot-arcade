// Weapon data (all fictional), inventory rules and hitscan resolution shared by the player and NPCs.
import type { Sim } from '../game-session/sim';
import { RayHit } from '../physics/physics';
import { clamp01, lerp, rayCapsuleY } from '../core/math';

export type AmmoType = 'pistol' | 'smg' | 'rifle' | 'shell' | 'cell';
export type WeaponSlot = 'sidearm' | 'long' | 'stun';
export interface WeaponSpec {
  id: string; name: string; slot: WeaponSlot; lethal: boolean; auto: boolean;
  damage: number; pellets: number; range: number; falloff: number; interval: number;
  mag: number; reload: number; spread: number; moveSpread: number; recoil: number;
  noise: number; ammo: AmmoType; price: number; blurb: string;
}
export const WEAPONS: Record<string, WeaponSpec> = {
  wren: { id: 'wren', name: 'Wren Compact', slot: 'sidearm', lethal: true, auto: false, damage: 27, pellets: 1, range: 70, falloff: 25, interval: 0.2, mag: 12, reload: 1.3, spread: 0.01, moveSpread: 0.02, recoil: 0.018, noise: 70, ammo: 'pistol', price: 0, blurb: 'Compact pistol. Reliable, loud, and a very bad idea near witnesses.' },
  sparrow: { id: 'sparrow', name: 'Sparrow MP', slot: 'sidearm', lethal: true, auto: true, damage: 15, pellets: 1, range: 50, falloff: 15, interval: 0.075, mag: 24, reload: 1.6, spread: 0.026, moveSpread: 0.035, recoil: 0.012, noise: 75, ammo: 'smg', price: 900, blurb: 'Machine pistol. Fast, inaccurate, attracts every patrol in earshot.' },
  heron: { id: 'heron', name: 'Heron Carbine', slot: 'long', lethal: true, auto: true, damage: 28, pellets: 1, range: 130, falloff: 50, interval: 0.11, mag: 25, reload: 2.0, spread: 0.009, moveSpread: 0.03, recoil: 0.014, noise: 90, ammo: 'rifle', price: 1800, blurb: 'Carbine. Controlled automatic fire at range.' },
  pelican: { id: 'pelican', name: 'Pelican Pump', slot: 'long', lethal: true, auto: false, damage: 12, pellets: 8, range: 32, falloff: 10, interval: 0.85, mag: 5, reload: 2.6, spread: 0.07, moveSpread: 0.02, recoil: 0.06, noise: 95, ammo: 'shell', price: 1200, blurb: 'Pump shotgun. Short reach, heavy consequences.' },
  osprey: { id: 'osprey', name: 'Osprey Marksman', slot: 'long', lethal: true, auto: false, damage: 72, pellets: 1, range: 240, falloff: 140, interval: 0.7, mag: 6, reload: 2.4, spread: 0.0015, moveSpread: 0.05, recoil: 0.05, noise: 110, ammo: 'rifle', price: 2600, blurb: 'Marksman rifle. Precise, slow, unmistakable.' },
  halcyon: { id: 'halcyon', name: 'Halcyon Stun Projector', slot: 'stun', lethal: false, auto: false, damage: 0, pellets: 1, range: 22, falloff: 22, interval: 1.1, mag: 3, reload: 2.2, spread: 0.012, moveSpread: 0.02, recoil: 0.01, noise: 14, ammo: 'cell', price: 0, blurb: 'Nonlethal. Drops a target for a few seconds without lasting harm.' },
};
export const AMMO_PRICES: Record<AmmoType, { amount: number; price: number; label: string }> = {
  pistol: { amount: 24, price: 60, label: 'Pistol rounds ×24' }, smg: { amount: 48, price: 110, label: 'MP rounds ×48' },
  rifle: { amount: 30, price: 140, label: 'Rifle rounds ×30' }, shell: { amount: 10, price: 90, label: 'Shells ×10' },
  cell: { amount: 3, price: 80, label: 'Stun cells ×3' },
};
export const BATON = { range: 1.9, damage: 40, interval: 0.55 };
export const LIMITS = { medkits: 2, armor: 50, smoke: 2, chirper: 2 };

export interface Inventory {
  sidearm: string | null; long: string | null; stun: boolean;
  ammo: Record<AmmoType, number>; mags: Record<string, number>;
  medkits: number; armor: number; smoke: number; chirper: number;
}
export function defaultInventory(): Inventory {
  return {
    sidearm: 'wren', long: null, stun: true,
    ammo: { pistol: 36, smg: 0, rifle: 0, shell: 0, cell: 6 }, mags: { wren: 12, halcyon: 3 },
    medkits: 1, armor: 0, smoke: 1, chirper: 2,
  };
}

export interface ShotResult { kind: 'none' | 'world' | 'vehicle' | 'actor' | 'ped' | 'player'; x: number; y: number; z: number; dist: number }
const _hit: RayHit = { dist: 0, nx: 0, ny: 0, nz: 0, body: null };

/** Resolve one hitscan ray from a muzzle. `shooterId` is an actor id, or -1 for the player. */
export function resolveShot(sim: Sim, ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, spec: WeaponSpec, shooterId: number, dmgScale = 1): ShotResult {
  const byPlayer = shooterId < 0;
  let best = spec.range, kind: ShotResult['kind'] = 'none';
  let hitVeh = null as ReturnType<Sim['vehicles']['fromBody']>;
  const playerVeh = sim.player.vehicle;
  if (sim.phys.castSolid(ox, oy, oz, dx, dy, dz, best, _hit, byPlayer && playerVeh ? playerVeh.body : undefined)) {
    best = _hit.dist; hitVeh = sim.vehicles.fromBody(_hit.body); kind = hitVeh ? 'vehicle' : 'world';
  }
  let actor = null as (typeof sim.actors.list)[number] | null;
  for (const a of sim.actors.list) {
    if (a.id === shooterId || a.dead || a.inVehicle) continue;
    const top = a.body.state === 'down' ? 0.5 : 1.45;
    const t = rayCapsuleY(ox, oy, oz, dx, dy, dz, a.body.x, a.body.z, a.body.y + 0.3, a.body.y + top, 0.36, best);
    if (t >= 0 && t < best) { best = t; actor = a; kind = 'actor'; }
  }
  let ped = null as (typeof sim.peds.list)[number] | null;
  for (const p of sim.peds.list) {
    if (p.gone) continue;
    const ddx = p.x - ox, ddz = p.z - oz;
    if (ddx * ddx + ddz * ddz > (best + 1) * (best + 1)) continue;
    const t = rayCapsuleY(ox, oy, oz, dx, dy, dz, p.x, p.z, p.y + 0.3, p.y + (p.down ? 0.5 : 1.45), 0.34, best);
    if (t >= 0 && t < best) { best = t; ped = p; actor = null; kind = 'ped'; }
  }
  let hitPlayer = false;
  if (!byPlayer && !sim.player.vehicle && !sim.player.downed) {
    const b = sim.player.body;
    const t = rayCapsuleY(ox, oy, oz, dx, dy, dz, b.x, b.z, b.y + 0.3, b.y + (b.crouch ? 1.0 : 1.45), 0.36, best);
    if (t >= 0 && t < best) { best = t; hitPlayer = true; actor = null; ped = null; kind = 'player'; }
  }
  const hx = ox + dx * best, hy = oy + dy * best, hz = oz + dz * best;
  const fall = lerp(1, 0.5, clamp01((best - spec.falloff) / Math.max(1, spec.range - spec.falloff)));
  const base = spec.damage * fall * dmgScale;
  if (hitPlayer) sim.player.takeDamage(spec.lethal ? base : 0, spec.lethal ? 'gunfire' : 'stun', !spec.lethal);
  else if (actor) {
    const rel = hy - actor.body.y;
    actor.hit(base * (rel > 1.42 ? 2.2 : rel < 0.8 ? 0.7 : 1), spec.lethal, byPlayer);
  } else if (ped) ped.hit(sim, spec.lethal ? base : 0, spec.lethal, byPlayer);
  else if (hitVeh) {
    if (spec.lethal) {
      hitVeh.damage(base * 0.22, 'front');
      if (hy < hitVeh.y + 0.55 && sim.rng.chance(0.3)) { const w = hitVeh.wheels[sim.rng.int(0, 3)]; if (!w.burst) { w.burst = true; sim.bus.emit('sfx', { name: 'burst', x: hx, y: hy, z: hz }); } }
      if (hitVeh.driver === 'player' && !byPlayer) sim.player.takeDamage(base * 0.35, 'gunfire', false);
      if (byPlayer && hitVeh.driver !== 'none' && hitVeh.driver !== 'player') sim.traffic.onVehicleShot(hitVeh);
    }
    sim.bus.emit('vfx', { kind: 'sparks', x: hx, y: hy, z: hz, n: 5 });
  } else if (kind === 'world') sim.bus.emit('vfx', { kind: 'impact', x: hx, y: hy, z: hz, dx: _hit.nx, dy: _hit.ny, dz: _hit.nz, n: 4 });
  if (!spec.lethal && (actor || ped || hitPlayer)) sim.bus.emit('vfx', { kind: 'stun', x: hx, y: hy, z: hz, n: 8 });
  sim.bus.emit('tracer', { ax: ox, ay: oy, az: oz, bx: hx, by: hy, bz: hz, stun: !spec.lethal });
  return { kind, x: hx, y: hy, z: hz, dist: best };
}
