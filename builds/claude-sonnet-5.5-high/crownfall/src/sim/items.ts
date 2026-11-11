import { ITEM_BY_ID, SELL_RATE, type StatBlock } from '../shared/content';
import { dist } from '../shared/math';
import type { HeroState, ItemSlot, Unit } from './types';
import type { Sim } from './sim';

export function hasItem(h: HeroState, id: string): boolean {
  for (const s of h.items) if (s && s.id === id) return true;
  return false;
}

export function sumItemStats(h: HeroState): StatBlock {
  const out: Record<string, number> = {};
  for (const s of h.items) {
    if (!s) continue;
    const st = ITEM_BY_ID[s.id].stats as Record<string, number>;
    for (const k in st) out[k] = (out[k] ?? 0) + st[k];
  }
  return out as StatBlock;
}

const BOOTS = ['swiftsole', 'riverglass', 'stalwart'];

/** Cost to buy `id` given what the hero already owns (component discounts). Returns consumed slot indices. */
export function quote(h: HeroState, id: string): { cost: number; consume: number[]; ok: boolean; reason?: string } {
  const def = ITEM_BY_ID[id];
  if (!def) return { cost: 0, consume: [], ok: false, reason: 'Unknown item' };
  const consume: number[] = [];
  let cost = def.cost;
  if (def.from) {
    const used = new Set<number>();
    for (const comp of def.from) {
      const idx = h.items.findIndex((s, i) => s && s.id === comp && !used.has(i));
      if (idx >= 0) { used.add(idx); consume.push(idx); cost -= ITEM_BY_ID[comp].cost; }
    }
  }
  if ((def.tier === 'complete' || def.tier === 'boots' || def.tier === 'starter') && hasItem(h, id)) return { cost, consume, ok: false, reason: 'Already owned' };
  if ((def.tier === 'boots' || id === 'swiftsole') && !def.from?.includes('swiftsole') && BOOTS.some((b) => hasItem(h, b))) return { cost, consume, ok: false, reason: 'You already have boots' };
  if (def.tier === 'consumable') {
    const stack = h.items.findIndex((s) => s && s.id === id && s.qty < 3);
    if (stack >= 0) return { cost, consume: [], ok: true };
  }
  const free = h.items.filter((s) => !s).length + consume.length;
  if (free <= 0) return { cost, consume, ok: false, reason: 'Inventory full' };
  return { cost, consume, ok: true };
}

export function buyItem(sim: Sim, u: Unit, id: string): boolean {
  const h = u.hero!;
  const reject = (reason: string) => { sim.emit({ t: 'reject', unit: u.id, reason }); return false; };
  const q = quote(h, id);
  if (!q.ok) return reject(q.reason ?? 'Cannot buy');
  if (h.gold < q.cost) return reject('Not enough gold');
  const def = ITEM_BY_ID[id];
  const consumed: ItemSlot[] = [];
  let slotIdx = -1;
  if (def.tier === 'consumable') {
    const stack = h.items.findIndex((s) => s && s.id === id && s.qty < 3);
    if (stack >= 0) {
      h.items[stack]!.qty++;
      h.gold -= q.cost; h.goldSpent += q.cost;
      sim.emit({ t: 'buy', unit: u.id, item: id });
      h.undo = null;
      return true;
    }
  }
  for (const i of q.consume.sort((a, b) => b - a)) { consumed.push(h.items[i]!); h.items[i] = null; }
  slotIdx = h.items.findIndex((s) => !s);
  h.items[slotIdx] = { id, qty: 1, cdUntil: 0 };
  h.gold -= q.cost; h.goldSpent += q.cost;
  h.undo = { itemId: id, gold: q.cost, consumed, slotIdx, goldAfter: h.gold };
  h.buildLog.push({ t: sim.time, item: id });
  sim.emit({ t: 'buy', unit: u.id, item: id });
  sim.emit({ t: 'sfx', name: 'buy', x: u.x, z: u.z });
  sim.recomputeStats(u);
  return true;
}

export function sellItem(sim: Sim, u: Unit, idx: number): boolean {
  const h = u.hero!;
  const s = h.items[idx];
  if (!s) return false;
  const def = ITEM_BY_ID[s.id];
  const val = Math.floor(def.cost * SELL_RATE) * s.qty;
  h.items[idx] = null;
  h.gold += val;
  h.undo = null;
  sim.emit({ t: 'sfx', name: 'sell', x: u.x, z: u.z });
  sim.recomputeStats(u);
  return true;
}

export function undoBuy(sim: Sim, u: Unit): boolean {
  const h = u.hero!;
  const un = h.undo;
  if (!un) return false;
  const reject = (reason: string) => { sim.emit({ t: 'reject', unit: u.id, reason }); return false; };
  if (!sim.inShop(u)) return reject('Must be at the fountain');
  if (h.lastCombatAt > h.deathAt && sim.time - h.lastCombatAt < 1.5) return reject('Cannot undo in combat');
  const cur = h.items[un.slotIdx];
  if (!cur || cur.id !== un.itemId) { h.undo = null; return reject('Cannot undo'); }
  if (cur.cdUntil > sim.time) return reject('Item was used');
  h.items[un.slotIdx] = null;
  for (const c of un.consumed) {
    const free = h.items.findIndex((s) => !s);
    h.items[free] = c;
  }
  h.gold += un.gold; h.goldSpent -= un.gold;
  h.undo = null;
  sim.recomputeStats(u);
  return true;
}

export function useItem(sim: Sim, u: Unit, idx: number): boolean {
  const h = u.hero!;
  const s = h.items[idx];
  if (!s || u.dead) return false;
  const now = sim.time;
  if (s.cdUntil > now) return false;
  if (s.id === 'draught') {
    sim.addEffect(u, 'regen', 6, 200 / 6, u.id);
    s.qty--; s.cdUntil = now + 1;
    sim.emit({ t: 'fx', kind: 'heal', x: u.x, z: u.z, r: 1.2, color: 0xff8a8a, dur: 0.8 });
  } else if (s.id === 'phial') {
    sim.addEffect(u, 'manaRegen', 4, 30, u.id);
    s.qty--; s.cdUntil = now + 1;
    sim.emit({ t: 'fx', kind: 'heal', x: u.x, z: u.z, r: 1.2, color: 0x7aa8ff, dur: 0.8 });
  } else if (s.id === 'nullbell') {
    sim.cleanse(u);
    s.cdUntil = now + 90;
  } else return false;
  if (s.qty <= 0 && ITEM_BY_ID[s.id].tier === 'consumable') h.items[idx] = null;
  h.undo = null;
  return true;
}

export function itemTick(_sim: Sim, u: Unit) {
  const h = u.hero!;
  if (h.armorStacks.length) h.armorStacks = h.armorStacks.filter((a) => a.until > _sim.time);
}

export function applyItemPassivesOnHit(sim: Sim, u: Unit, t: Unit) {
  const h = u.hero!;
  if (hasItem(h, 'sunspoke')) {
    h.sunCount++;
    if (h.sunCount % 3 === 0) {
      let best: Unit | null = null, bd = 7;
      for (const e of sim.units) {
        if (e.dead || e.team === u.team || e.id === t.id || e.stype || e.kind === 'ward') continue;
        if (!sim.canSee(u.team, e)) continue;
        const d = dist(u.x, u.z, e.x, e.z);
        if (d < bd) { bd = d; best = e; }
      }
      const tgt = best ?? t;
      sim.emit({ t: 'fx', kind: 'beam', x: u.x, z: u.z, r: dist(u.x, u.z, tgt.x, tgt.z), color: 0xffc040, dx: tgt.x - u.x, dz: tgt.z - u.z, dur: 0.18 });
      sim.damage(u, tgt, u.ad * 0.6, 'physical', { label: 'Sunspoke Bolt', noLifesteal: true });
    }
  }
}
