/** Server-side loot rolls: tier tables, duplicate suppression, Prototype caps. */
import {
  AMMO_PICKUP, FLOOR_CATEGORY_WEIGHTS, HEAL_ROLL, PROTOTYPE_MATCH_CAP, SHIELD_ROLL, TIER_RARITY, UTILITY_ROLL,
  WEAPONS, WEAPON_IDS, WEAPON_LOOT_WEIGHT, effectiveWeapon, type ItemId, type WeaponId,
} from '../shared/content';
import type { Rng } from '../shared/rng';
import type { LootKind } from './types';

export interface LootBudget { prototypes: number }

export function rollRarity(rng: Rng, tier: number, budget: LootBudget): number {
  const w = TIER_RARITY[tier] ?? TIER_RARITY[1];
  let r = rng.weighted(w);
  if (r === 4) {
    if (budget.prototypes >= PROTOTYPE_MATCH_CAP) r = 3;
    else budget.prototypes++;
  }
  return r;
}

export function rollWeapon(rng: Rng, tier: number, budget: LootBudget, exclude?: WeaponId): LootKind {
  const weights = WEAPON_IDS.map((id) => (id === exclude ? 0 : WEAPON_LOOT_WEIGHT[id]));
  const id = WEAPON_IDS[rng.weighted(weights)];
  const rarity = rollRarity(rng, tier, budget);
  return { kind: 'weapon', weapon: id, rarity, mag: effectiveWeapon(id, rarity).mag };
}

function rollFrom(rng: Rng, table: [ItemId, number][]): ItemId {
  return table[rng.weighted(table.map((t) => t[1]))][0];
}

export function rollAmmoFor(weapon: WeaponId, rng: Rng): LootKind {
  const def = WEAPONS[weapon];
  const base = AMMO_PICKUP[def.ammo];
  return { kind: 'ammo', ammo: def.ammo, count: Math.max(2, Math.round(base * rng.range(0.8, 1.3))) };
}

/** Floor socket roll: returns 1-2 loot kinds. */
export function rollFloor(rng: Rng, tier: number, weaponBias: boolean, budget: LootBudget): LootKind[] {
  if (!weaponBias && rng.chance(0.1)) return [];
  const c = weaponBias ? 'weapon' : (['weapon', 'ammo', 'heal', 'shield', 'utility'] as const)[
    rng.weighted([FLOOR_CATEGORY_WEIGHTS.weapon, FLOOR_CATEGORY_WEIGHTS.ammo, FLOOR_CATEGORY_WEIGHTS.heal, FLOOR_CATEGORY_WEIGHTS.shield, FLOOR_CATEGORY_WEIGHTS.utility])
  ];
  switch (c) {
    case 'weapon': {
      const w = rollWeapon(rng, tier, budget);
      if (w.kind !== 'weapon') return [w];
      return rng.chance(0.75) ? [w, rollAmmoFor(w.weapon, rng)] : [w];
    }
    case 'ammo': {
      const type = (['light', 'light', 'shell', 'heavy', 'charge'] as const)[rng.int(0, 4)];
      return [{ kind: 'ammo', ammo: type, count: Math.round(AMMO_PICKUP[type] * rng.range(0.8, 1.4)) }];
    }
    case 'heal': return [{ kind: 'item', item: rollFrom(rng, HEAL_ROLL), count: 1 }];
    case 'shield': return [{ kind: 'item', item: rollFrom(rng, SHIELD_ROLL), count: 1 }];
    default: return [{ kind: 'item', item: rollFrom(rng, UTILITY_ROLL), count: 1 }];
  }
}

/** Resonance chest: two item rolls (weapon-leaning) plus ammo and a heal. No duplicate weapon within a chest. */
export function rollChest(rng: Rng, tier: number, budget: LootBudget): LootKind[] {
  const out: LootKind[] = [];
  const first = rollWeapon(rng, tier, budget);
  out.push(first);
  if (first.kind === 'weapon') out.push(rollAmmoFor(first.weapon, rng));
  if (rng.chance(0.55)) {
    const second = rollWeapon(rng, tier, budget, first.kind === 'weapon' ? first.weapon : undefined);
    out.push(second);
  } else {
    out.push({ kind: 'item', item: rollFrom(rng, UTILITY_ROLL), count: 1 });
  }
  out.push({ kind: 'item', item: rollFrom(rng, rng.chance(0.5) ? HEAL_ROLL : SHIELD_ROLL), count: rng.chance(0.3) ? 2 : 1 });
  return out;
}

/** Supply locker: predictable ammo, heals and utility. */
export function rollLocker(rng: Rng): LootKind[] {
  return [
    { kind: 'ammo', ammo: 'light', count: 30 },
    { kind: 'ammo', ammo: rng.chance(0.5) ? 'shell' : 'heavy', count: rng.chance(0.5) ? 8 : 10 },
    { kind: 'item', item: rollFrom(rng, HEAL_ROLL), count: 2 },
    { kind: 'item', item: rollFrom(rng, SHIELD_ROLL), count: 1 },
  ];
}

/** Supply capsule: high rarity, may roll Prototype (capped). */
export function rollCapsule(rng: Rng, budget: LootBudget): LootKind[] {
  const out: LootKind[] = [];
  const a = rollWeapon(rng, 5, budget);
  out.push(a);
  if (a.kind === 'weapon') out.push(rollAmmoFor(a.weapon, rng));
  const b = rollWeapon(rng, 5, budget, a.kind === 'weapon' ? a.weapon : undefined);
  out.push(b);
  if (b.kind === 'weapon') out.push(rollAmmoFor(b.weapon, rng));
  out.push({ kind: 'item', item: 'traumaKit', count: 1 });
  out.push({ kind: 'item', item: 'shieldFlask', count: 2 });
  return out;
}
