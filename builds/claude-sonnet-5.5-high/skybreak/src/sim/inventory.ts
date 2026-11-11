/** Inventory rules: five universal slots, ammo stacks outside slots with caps. */
import { AMMO_CAPS, ITEMS, INVENTORY_SLOTS, WEAPONS, effectiveWeapon, type AmmoType, type ItemId, type WeaponId } from '../shared/content';
import type { LootKind, Player, Slot } from './types';

export function firstEmptySlot(p: Player): number {
  for (let i = 0; i < INVENTORY_SLOTS; i++) if (!p.slots[i]) return i;
  return -1;
}

export function addAmmo(p: Player, type: AmmoType, count: number): number {
  const room = AMMO_CAPS[type] - p.ammo[type];
  const add = Math.max(0, Math.min(room, count));
  p.ammo[type] += add;
  return add;
}

/** Add items to an existing stack first, then empty slots. Returns how many were added. */
export function addItem(p: Player, item: ItemId, count: number): number {
  const def = ITEMS[item];
  let left = count;
  for (let i = 0; i < INVENTORY_SLOTS && left > 0; i++) {
    const s = p.slots[i];
    if (s && s.kind === 'item' && s.item === item && s.count < def.stack) {
      const add = Math.min(def.stack - s.count, left);
      s.count += add; left -= add;
    }
  }
  while (left > 0) {
    const e = firstEmptySlot(p);
    if (e < 0) break;
    const add = Math.min(def.stack, left);
    p.slots[e] = { kind: 'item', item, count: add };
    left -= add;
  }
  return count - left;
}

export function giveWeapon(p: Player, weapon: WeaponId, rarity: number, mag: number): number {
  const e = firstEmptySlot(p);
  if (e < 0) return -1;
  p.slots[e] = { kind: 'weapon', weapon, rarity, mag };
  return e;
}

export function slotToLoot(s: Slot): LootKind {
  return s.kind === 'weapon'
    ? { kind: 'weapon', weapon: s.weapon, rarity: s.rarity, mag: s.mag }
    : { kind: 'item', item: s.item, count: s.count };
}

export function selectedWeapon(p: Player): { weapon: WeaponId; rarity: number; mag: number; slot: number } | null {
  const s = p.slots[p.selected];
  if (s && s.kind === 'weapon') return { weapon: s.weapon, rarity: s.rarity, mag: s.mag, slot: p.selected };
  return null;
}

export function weaponMagSize(weapon: WeaponId, rarity: number): number {
  return effectiveWeapon(weapon, rarity).mag;
}

export function lootName(d: LootKind): string {
  switch (d.kind) {
    case 'weapon': return WEAPONS[d.weapon].name;
    case 'item': return ITEMS[d.item].name + (d.count > 1 ? ` x${d.count}` : '');
    case 'ammo': return `${d.ammo[0].toUpperCase() + d.ammo.slice(1)} Ammo x${d.count}`;
    case 'cache': return `${d.owner}'s Cache`;
  }
}

export function weaponCount(p: Player): number {
  return p.slots.filter((s) => s && s.kind === 'weapon').length;
}
export function itemCountOf(p: Player, item: ItemId): number {
  let n = 0;
  for (const s of p.slots) if (s && s.kind === 'item' && s.item === item) n += s.count;
  return n;
}
export function findItemSlot(p: Player, item: ItemId): number {
  for (let i = 0; i < p.slots.length; i++) {
    const s = p.slots[i];
    if (s && s.kind === 'item' && s.item === item) return i;
  }
  return -1;
}
