// Weapon state helpers: construction, deterministic recoil, and movement-dependent spread.

import { MOVEMENT as M } from '../content/economy';
import { WEAPONS, WeaponDef, WeaponId, recoilPattern } from '../content/weapons';
import { DEG, clamp, lerp } from './math';
import type { Player, WeaponState } from './types';

export function newWeapon(id: WeaponId, fresh = false): WeaponState {
  const d = WEAPONS[id];
  return {
    id, mag: d.mag, reserve: d.reserve, nextFire: 0, readyAt: 0, reloadEnd: 0, reloading: false,
    burstLeft: 0, burstNext: 0, shots: 0, lastShot: -100, heat: 0, fresh, scopeLevel: 0,
  };
}

/** Fractional recoil index at `time`, decaying linearly to zero over the weapon's recovery time. */
export function effectiveShots(w: WeaponState, def: WeaponDef, time: number): number {
  if (w.shots <= 0) return 0;
  const rec = Math.max(0.05, def.recoil.recovery);
  const f = 1 - (time - w.lastShot) / rec;
  return f <= 0 ? 0 : w.shots * f;
}

/** Cumulative recoil view offset in radians for the *next* bullet (what the crosshair shows). */
export function kickNow(w: WeaponState, def: WeaponDef, time: number): { pitch: number; yaw: number } {
  const n = effectiveShots(w, def, time);
  if (n <= 0) return { pitch: 0, yaw: 0 };
  const lo = Math.floor(n), hi = Math.ceil(n);
  const a = recoilPattern(def.recoil, lo), b = recoilPattern(def.recoil, hi);
  const f = n - lo;
  return { pitch: lerp(a.pitch, b.pitch, f) * DEG, yaw: lerp(a.yaw, b.yaw, f) * DEG };
}

/** Total spread cone half-angle in radians for a shot taken now. */
export function computeSpread(p: Player, w: WeaponState, def: WeaponDef, time: number, hspeed: number): number {
  const s = def.spread;
  const top = Math.max(0.1, def.moveSpeed);
  const speedFactor = clamp((hspeed - M.accuracySpeed) / Math.max(0.1, top - M.accuracySpeed), 0, 1.25);
  let spread = s.stand + s.move * speedFactor;
  if (!p.onGround) spread += s.air;
  spread += s.air * 0.6 * p.landPenalty;
  spread += w.heat * Math.exp(-(time - w.lastShot) * 7);
  spread *= lerp(1, s.crouch, p.crouch);
  if (def.scoped) {
    if (w.scopeLevel === 0) spread *= def.scoped.unscopedSpreadMul;
    else spread *= def.scoped.moveSpreadMul;
  }
  return spread;
}

export function weaponValue(w: WeaponState | null): number {
  return w ? WEAPONS[w.id].price : 0;
}
