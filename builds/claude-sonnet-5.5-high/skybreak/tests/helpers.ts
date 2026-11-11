import { DT, effectiveWeapon, type WeaponId } from '../src/shared/content';
import { Match } from '../src/sim/match';
import { emptyInput, type Player, type PlayerInput } from '../src/sim/types';

export function practice(seed = 1): Match {
  const m = new Match({ seed, mode: 'practice' });
  const h = m.players[0];
  h.x = 0; h.z = 20; h.y = m.world.heightAt(0, 20);
  // remove the dummies so they never interfere with movement/combat tests
  for (const p of m.players) if (p.dummy) { p.alive = false; p.mode = 'dead'; }
  return m;
}

export function inp(o: Partial<PlayerInput> = {}): PlayerInput {
  return { ...emptyInput(), ...o };
}

/** Step the match for `seconds`, feeding the same input every tick. */
export function run(m: Match, o: Partial<PlayerInput>, seconds: number, id = 0): void {
  const n = Math.round(seconds / DT);
  for (let i = 0; i < n; i++) m.step(new Map([[id, inp(o)]]));
}

/** Step with a per-tick generator. */
export function runFn(m: Match, f: (tick: number) => Partial<PlayerInput>, ticks: number, id = 0): void {
  for (let i = 0; i < ticks; i++) m.step(new Map([[id, inp(f(i))]]));
}

export function speedOf(p: Player): number { return Math.hypot(p.vx, p.vz); }

export function giveGun(p: Player, weapon: WeaponId, rarity = 0, ammo = 200): void {
  const eff = effectiveWeapon(weapon, rarity);
  p.slots[0] = { kind: 'weapon', weapon, rarity, mag: eff.mag };
  p.selected = 0;
  p.ammo.light = p.ammo.shell = p.ammo.heavy = p.ammo.charge = 0;
  p.ammo[eff.def.ammo] = ammo;
}
