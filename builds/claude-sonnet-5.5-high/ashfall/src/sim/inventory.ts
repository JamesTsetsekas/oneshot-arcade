// Grid inventory (10x6) with 1x1 / 1x2 / 2x3 items, plus equipment slot rules.
import { BASE_BY_ID, baseSlots } from '../data/items';
import type { ClassId, Item, SlotId } from './types';

export interface Placed {
  item: Item;
  x: number;
  y: number;
}

export class Inventory {
  constructor(public w = 10, public h = 6, public placed: Placed[] = []) {}

  private cells(): (string | null)[] {
    const c: (string | null)[] = new Array(this.w * this.h).fill(null);
    for (const p of this.placed) {
      const b = BASE_BY_ID[p.item.base];
      for (let yy = 0; yy < b.h; yy++) for (let xx = 0; xx < b.w; xx++) c[(p.y + yy) * this.w + p.x + xx] = p.item.uid;
    }
    return c;
  }

  canPlace(item: Item, x: number, y: number, ignoreUid?: string): boolean {
    const b = BASE_BY_ID[item.base];
    if (x < 0 || y < 0 || x + b.w > this.w || y + b.h > this.h) return false;
    const c = this.cells();
    for (let yy = 0; yy < b.h; yy++) {
      for (let xx = 0; xx < b.w; xx++) {
        const o = c[(y + yy) * this.w + x + xx];
        if (o && o !== ignoreUid) return false;
      }
    }
    return true;
  }

  findSpace(item: Item): { x: number; y: number } | null {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.canPlace(item, x, y)) return { x, y };
    return null;
  }

  add(item: Item): boolean {
    const s = this.findSpace(item);
    if (!s) return false;
    this.placed.push({ item, x: s.x, y: s.y });
    return true;
  }

  place(item: Item, x: number, y: number): boolean {
    if (!this.canPlace(item, x, y)) return false;
    this.placed.push({ item, x, y });
    return true;
  }

  remove(uid: string): Item | null {
    const i = this.placed.findIndex((p) => p.item.uid === uid);
    if (i < 0) return null;
    return this.placed.splice(i, 1)[0].item;
  }

  get(uid: string): Placed | undefined {
    return this.placed.find((p) => p.item.uid === uid);
  }

  items(): Item[] {
    return this.placed.map((p) => p.item);
  }

  /** Repack all items largest-first, then by rarity. */
  sort(): void {
    const items = this.items();
    const rk = { relic: 0, inscribed: 1, tempered: 2, worn: 3 } as const;
    items.sort((a, b) => {
      const ba = BASE_BY_ID[a.base];
      const bb = BASE_BY_ID[b.base];
      const area = bb.w * bb.h - ba.w * ba.h;
      if (area !== 0) return area;
      if (ba.group !== bb.group) return ba.group < bb.group ? -1 : 1;
      return rk[a.rarity] - rk[b.rarity] || b.ilvl - a.ilvl;
    });
    this.placed = [];
    for (const it of items) this.add(it);
  }
}

export type Equipment = Partial<Record<SlotId, Item>>;

export function canUse(item: Item, cls: ClassId): boolean {
  const b = BASE_BY_ID[item.base];
  if (b.group === 'glyph') return false;
  return !b.cls || b.cls === cls;
}

/** Which slot an item would equip to given the current loadout. */
export function targetSlot(item: Item, eq: Equipment, prefer?: SlotId): SlotId | null {
  const slots = baseSlots(BASE_BY_ID[item.base]);
  if (slots.length === 0) return null;
  if (prefer && slots.includes(prefer)) return prefer;
  for (const s of slots) if (!eq[s]) return s;
  return slots[0];
}

export interface EquipResult {
  ok: boolean;
  reason?: string;
  displaced: Item[];
}

/** Compute displaced items if `item` were equipped to `slot` (two-handed rules included). */
export function planEquip(item: Item, slot: SlotId, eq: Equipment, cls: ClassId): EquipResult {
  const b = BASE_BY_ID[item.base];
  if (!canUse(item, cls)) return { ok: false, reason: 'Cannot be used by this class', displaced: [] };
  const slots = baseSlots(b);
  if (!slots.includes(slot)) return { ok: false, reason: 'Wrong slot', displaced: [] };
  const displaced: Item[] = [];
  if (eq[slot]) displaced.push(eq[slot]!);
  if (slot === 'weapon' && b.twoHanded && eq.offhand) displaced.push(eq.offhand);
  if (slot === 'offhand') {
    const mh = eq.weapon ? BASE_BY_ID[eq.weapon.base] : null;
    if (mh?.twoHanded) displaced.push(eq.weapon!);
  }
  return { ok: true, displaced };
}
