// Server-owned loot tables. Location tier drives rarity weights; categories
// are weighted; chests suppress duplicates; Prototype is capped per match.

import { Rng } from '../shared/rng';
import { Rarity } from '../shared/content/rarity';
import { AMMO_PICKUP, WeaponId, WEAPONS, AmmoType } from '../shared/content/weapons';
import { ItemId } from '../shared/content/items';
import type { LootItem } from './types';

export type LootRoll = Omit<LootItem, 'id' | 'x' | 'y' | 'z'>;

export const RARITY_WEIGHTS: Record<number, readonly (readonly [Rarity, number])[]> = {
  0: [[0, 60], [1, 30], [2, 10]],
  1: [[0, 52], [1, 31], [2, 13], [3, 4]],
  2: [[0, 40], [1, 33], [2, 19], [3, 8]],
  3: [[0, 28], [1, 34], [2, 25], [3, 13]],
};

const WEAPON_WEIGHTS: readonly (readonly [WeaponId, number])[] = [
  ['wayfarer', 14], ['tempest', 12], ['breakwater', 11], ['coil', 10], ['needler', 12],
  ['sundial', 8], ['longwake', 4], ['harbor', 16], ['gale', 4],
];

const ITEM_WEIGHTS: readonly (readonly [ItemId, number])[] = [
  ['med', 22], ['trauma', 6], ['flask', 20], ['aegis_cell', 8], ['mist', 7], ['grapple', 5], ['echo', 5], ['wind_orb', 8],
];

const ITEM_COUNTS: Record<ItemId, [number, number]> = {
  med: [2, 3], trauma: [1, 1], flask: [1, 2], aegis_cell: [1, 1], mist: [1, 2], grapple: [3, 3], echo: [1, 1], wind_orb: [1, 2],
};

export class LootTables {
  prototypesLeft = 3;
  constructor(public rng: Rng) {}

  weapon(tier: number, exclude?: Set<string>, rarityFloor: Rarity = 0): LootRoll {
    let w: WeaponId = this.rng.weighted(WEAPON_WEIGHTS);
    for (let i = 0; i < 4 && exclude?.has(w); i++) w = this.rng.weighted(WEAPON_WEIGHTS);
    exclude?.add(w);
    let r = this.rng.weighted(RARITY_WEIGHTS[Math.max(0, Math.min(3, tier))]);
    if (r < rarityFloor) r = rarityFloor;
    return { kind: 'weapon', w, r, mag: WEAPONS[w].mag };
  }

  item(exclude?: Set<string>): LootRoll {
    let id: ItemId = this.rng.weighted(ITEM_WEIGHTS);
    for (let i = 0; i < 4 && exclude?.has(id); i++) id = this.rng.weighted(ITEM_WEIGHTS);
    exclude?.add(id);
    const [a, b] = ITEM_COUNTS[id];
    return { kind: 'item', item: id, n: this.rng.int(a, b) };
  }

  ammo(type?: AmmoType): LootRoll {
    const t: AmmoType = type ?? this.rng.weighted([['light', 45], ['shell', 25], ['heavy', 20], ['charge', 10]] as const);
    return { kind: 'ammo', ammo: t, amount: AMMO_PICKUP[t] };
  }

  /** Floor socket roll. */
  floor(tier: number, forceWeapon: boolean): LootRoll[] {
    if (forceWeapon) {
      const w = this.weapon(tier);
      return [w, this.ammo(WEAPONS[w.w!].ammo)];
    }
    const cat = this.rng.weighted([['weapon', 40], ['item', 32], ['ammo', 28]] as const);
    if (cat === 'weapon') {
      const w = this.weapon(tier);
      return [w, this.ammo(WEAPONS[w.w!].ammo)];
    }
    if (cat === 'item') return [this.item()];
    return [this.ammo()];
  }

  /** Resonance chest: two item rolls (weapon + other, no duplicates) plus ammo and a heal. */
  chest(tier: number): LootRoll[] {
    const seen = new Set<string>();
    const w = this.weapon(tier + 1, seen);
    const other = this.rng.chance(0.4) ? this.weapon(tier + 1, seen) : this.item(seen);
    const heal: LootRoll = this.rng.chance(0.5) ? { kind: 'item', item: 'flask', n: 1 } : { kind: 'item', item: 'med', n: 2 };
    const out = [w, other, this.ammo(WEAPONS[w.w!].ammo)];
    if (!(other.kind === 'item' && heal.item === other.item)) out.push(heal);
    return out;
  }

  /** Supply locker: predictable ammo / heal / utility. */
  locker(): LootRoll[] {
    return [this.ammo('light'), this.ammo(this.rng.pick(['shell', 'heavy'] as const)), { kind: 'item', item: 'med', n: 2 }, this.item()];
  }

  /** High-value drops: capsules and the caravan. Prototype capped per match. */
  premium(): LootRoll[] {
    const seen = new Set<string>();
    const out: LootRoll[] = [];
    const w = this.weapon(3, seen, 3);
    if (this.prototypesLeft > 0 && this.rng.chance(0.75)) {
      w.r = 4;
      this.prototypesLeft--;
    }
    out.push(w, this.ammo(WEAPONS[w.w!].ammo), this.ammo(WEAPONS[w.w!].ammo));
    out.push({ kind: 'item', item: 'flask', n: 2 }, { kind: 'item', item: this.rng.pick(['trauma', 'aegis_cell'] as const), n: 1 });
    return out;
  }
}
