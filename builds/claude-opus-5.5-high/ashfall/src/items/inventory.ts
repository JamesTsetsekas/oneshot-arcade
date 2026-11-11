import { itemSize, type Item } from "./item";
import { RARITIES } from "../data/types";
import { BASE_BY_ID } from "../data/items";

export interface Placed { item: Item; x: number; y: number }
export interface GridData { w: number; h: number; placed: Placed[] }

export class Grid {
  constructor(public w: number, public h: number, public placed: Placed[] = []) {}

  static from(d: GridData): Grid {
    return new Grid(d.w, d.h, d.placed.map((p) => ({ ...p })));
  }
  toData(): GridData {
    return { w: this.w, h: this.h, placed: this.placed.map((p) => ({ ...p })) };
  }

  occupant(x: number, y: number): Placed | undefined {
    return this.placed.find((p) => {
      const [w, h] = itemSize(p.item);
      return x >= p.x && x < p.x + w && y >= p.y && y < p.y + h;
    });
  }

  canPlace(item: Item, x: number, y: number, ignoreUid?: number): boolean {
    const [w, h] = itemSize(item);
    if (x < 0 || y < 0 || x + w > this.w || y + h > this.h) return false;
    for (const p of this.placed) {
      if (p.item.uid === ignoreUid) continue;
      const [pw, ph] = itemSize(p.item);
      if (x < p.x + pw && x + w > p.x && y < p.y + ph && y + h > p.y) return false;
    }
    return true;
  }

  findSpot(item: Item): { x: number; y: number } | null {
    // column-major scan keeps tall items tidy
    for (let x = 0; x < this.w; x++) for (let y = 0; y < this.h; y++) if (this.canPlace(item, x, y)) return { x, y };
    return null;
  }

  add(item: Item): boolean {
    const s = this.findSpot(item);
    if (!s) return false;
    this.placed.push({ item, x: s.x, y: s.y });
    return true;
  }

  addAt(item: Item, x: number, y: number): boolean {
    if (!this.canPlace(item, x, y)) return false;
    this.placed.push({ item, x, y });
    return true;
  }

  remove(uid: number): Item | undefined {
    const i = this.placed.findIndex((p) => p.item.uid === uid);
    if (i < 0) return undefined;
    return this.placed.splice(i, 1)[0].item;
  }

  find(uid: number): Placed | undefined {
    return this.placed.find((p) => p.item.uid === uid);
  }

  move(uid: number, x: number, y: number): boolean {
    const p = this.find(uid);
    if (!p || !this.canPlace(p.item, x, y, uid)) return false;
    p.x = x; p.y = y;
    return true;
  }

  items(): Item[] {
    return this.placed.map((p) => p.item);
  }

  freeCells(): number {
    let used = 0;
    for (const p of this.placed) { const [w, h] = itemSize(p.item); used += w * h; }
    return this.w * this.h - used;
  }

  /** Sort: large items first, then by slot, rarity (desc), item level (desc). Returns false (no change) if it cannot repack. */
  sort(): boolean {
    const items = this.items().slice().sort((a, b) => {
      const [aw, ah] = itemSize(a), [bw, bh] = itemSize(b);
      if (aw * ah !== bw * bh) return bw * bh - aw * ah;
      const sa = a.kind === "glyph" ? "zz" : BASE_BY_ID[a.baseId].slot, sb = b.kind === "glyph" ? "zz" : BASE_BY_ID[b.baseId].slot;
      if (sa !== sb) return sa < sb ? -1 : 1;
      const ra = RARITIES.indexOf(a.rarity), rb = RARITIES.indexOf(b.rarity);
      if (ra !== rb) return rb - ra;
      return b.ilvl - a.ilvl;
    });
    const g = new Grid(this.w, this.h);
    for (const it of items) if (!g.add(it)) return false;
    this.placed = g.placed;
    return true;
  }
}
