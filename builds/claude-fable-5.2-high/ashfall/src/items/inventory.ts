import type { EquipSlot, Hero, Item } from '../entity-combat/types';
import { BASE } from './content';
import { itemSize } from './generate';

export const INV_W = 10, INV_H = 6;
function occupancy(items: Item[], ignore?: string): Uint8Array {
  const g = new Uint8Array(INV_W * INV_H);
  for (const it of items) {
    if (it.id === ignore) continue;
    const [w, h] = itemSize(it);
    for (let y = it.y; y < it.y + h; y++) for (let x = it.x; x < it.x + w; x++) if (x < INV_W && y < INV_H) g[y * INV_W + x] = 1;
  }
  return g;
}
export function fitsAt(items: Item[], it: Item, x: number, y: number): boolean {
  const [w, h] = itemSize(it);
  if (x < 0 || y < 0 || x + w > INV_W || y + h > INV_H) return false;
  const g = occupancy(items, it.id);
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j * INV_W + i]) return false;
  return true;
}
export function findSpace(items: Item[], it: Item): { x: number; y: number } | null {
  const [w, h] = itemSize(it);
  const g = occupancy(items, it.id);
  for (let x = 0; x <= INV_W - w; x++) for (let y = 0; y <= INV_H - h; y++) {
    let ok = true;
    for (let j = y; j < y + h && ok; j++) for (let i = x; i < x + w; i++) if (g[j * INV_W + i]) { ok = false; break; }
    if (ok) return { x, y };
  }
  return null;
}
/** Adds to a grid container; returns false (and leaves the container untouched) when there is no room. */
export function addItem(items: Item[], it: Item): boolean {
  const p = findSpace(items, it);
  if (!p) return false;
  it.x = p.x; it.y = p.y; items.push(it);
  return true;
}
export function removeItem(items: Item[], id: string): Item | undefined {
  const i = items.findIndex((x) => x.id === id);
  return i >= 0 ? items.splice(i, 1)[0] : undefined;
}
export function sortItems(items: Item[]): void {
  const sorted = [...items].sort((a, b) => { const [aw, ah] = itemSize(a), [bw, bh] = itemSize(b); return bw * bh - aw * ah || b.rarity - a.rarity || a.base.localeCompare(b.base); });
  items.length = 0;
  for (const it of sorted) addItem(items, it);
}
export function slotFor(hero: Hero, it: Item): EquipSlot | null {
  if (it.kind !== 'gear') return null;
  const b = BASE[it.base];
  if (b.slot === 'ring') return !hero.equip.ring1 ? 'ring1' : !hero.equip.ring2 ? 'ring2' : 'ring1';
  return b.slot as EquipSlot;
}
export function canEquip(hero: Hero, it: Item): string | null {
  if (it.kind !== 'gear') return 'Glyphs are socketed, not worn.';
  const b = BASE[it.base];
  if (!it.identified) return 'Must be identified by the Artificer first.';
  if (b.cls && b.cls !== hero.cls) return `Only usable by the ${b.cls === 'cinder' ? 'Cinder Vow' : 'Veil Ranger'}.`;
  if (hero.level < Math.max(1, it.ilvl - 4)) return `Requires level ${it.ilvl - 4}.`;
  return null;
}
/** Equip from inventory, swapping whatever is displaced back into the grid. Atomic: fails without changes when the grid is full. */
export function equipItem(hero: Hero, id: string, prefer?: EquipSlot): string | null {
  const it = hero.inv.find((x) => x.id === id);
  if (!it) return 'Item not found.';
  const err = canEquip(hero, it);
  if (err) return err;
  const b = BASE[it.base];
  const slot = prefer && (b.slot === 'ring' ? prefer.startsWith('ring') : prefer === b.slot) ? prefer : slotFor(hero, it)!;
  const displaced: Item[] = [];
  if (hero.equip[slot]) displaced.push(hero.equip[slot]!);
  if (slot === 'main' && b.twoHand && hero.equip.off) displaced.push(hero.equip.off);
  if (slot === 'off' && hero.equip.main && BASE[hero.equip.main.base].twoHand) displaced.push(hero.equip.main);
  const snapshot = hero.inv.map((x) => ({ it: x, x: x.x, y: x.y }));
  removeItem(hero.inv, id);
  for (const d of displaced) {
    if (!addItem(hero.inv, d)) {
      hero.inv.length = 0;
      for (const s of snapshot) { s.it.x = s.x; s.it.y = s.y; hero.inv.push(s.it); }
      return 'Inventory is full.';
    }
  }
  for (const s of Object.keys(hero.equip) as EquipSlot[]) if (displaced.includes(hero.equip[s]!)) delete hero.equip[s];
  hero.equip[slot] = it;
  return null;
}
export function unequip(hero: Hero, slot: EquipSlot): string | null {
  const it = hero.equip[slot];
  if (!it) return null;
  if (!addItem(hero.inv, it)) return 'Inventory is full.';
  delete hero.equip[slot];
  return null;
}
