// Shop, inventory, item actives. Purchases only inside the fountain (or while dead), undo with strict rules.
import type { Match } from './match';
import type { Unit, ItemStack } from './types';
import { ITEMS, purchasePlan, SELL_RATIO } from '../shared/items';
import { inFountain, Team } from '../shared/map';
import { recomputeStats, addEffect } from './combat';
import { dist } from '../shared/math';

export function canShop(u: Unit): boolean {
  return !u.alive || inFountain(u.team as Team, u.x, u.y);
}

export function invalidateUndo(u: Unit) {
  if (u.hero && u.hero.undo.length) u.hero.undo.length = 0;
}

export function buyItem(m: Match, u: Unit, id: string): string | null {
  const h = u.hero!;
  const def = ITEMS[id];
  if (!def) return 'Unknown item';
  if (!canShop(u)) return 'Shop is only available in the fountain';
  if (def.category === 'consumable' && def.maxStack) {
    const ex = h.items.find((s) => s && s.id === id);
    if (ex) {
      if (ex.count >= def.maxStack) return 'Stack is full';
      if (h.gold < def.cost) return 'Not enough gold';
      h.gold -= def.cost; ex.count++;
      h.undo.push({ kind: 'buy', item: id, gold: def.cost, consumed: [], slot: h.items.indexOf(ex), count: 1 });
      return null;
    }
  }
  if (def.category === 'boots' && h.items.some((s) => s && ITEMS[s.id].category === 'boots')) return 'Only one pair of boots';
  if (def.category === 'starter' && h.items.some((s) => s && ITEMS[s.id].category === 'starter')) return 'Only one starter item';
  const owned = h.items.map((s) => (s ? s.id : ''));
  const plan = purchasePlan(id, owned);
  if (h.gold < plan.cost) return 'Not enough gold';
  const consumed: ItemStack[] = [];
  const after = h.items.slice();
  for (const i of plan.consume) { consumed.push(after[i]!); after[i] = null; }
  const free = after.findIndex((s) => s === null);
  if (free < 0) return 'Inventory full';
  after[free] = { id, count: 1, cd: 0 };
  h.items = after;
  h.gold -= plan.cost;
  h.undo.push({ kind: 'buy', item: id, gold: plan.cost, consumed, slot: free });
  if (h.undo.length > 10) h.undo.shift();
  recomputeStats(m, u);
  if (m.setup.mode === 'tutorial') m.tutorialFlags.bought = 1;
  return null;
}

export function sellItem(m: Match, u: Unit, slot: number): string | null {
  const h = u.hero!;
  if (!canShop(u)) return 'Shop is only available in the fountain';
  const s = h.items[slot];
  if (!s) return 'Empty slot';
  const def = ITEMS[s.id];
  const value = Math.floor(def.cost * SELL_RATIO) * (def.maxStack ? s.count : 1);
  h.items[slot] = null;
  h.gold += value;
  h.undo.push({ kind: 'sell', item: s.id, gold: value, consumed: [s], slot });
  recomputeStats(m, u);
  return null;
}

export function undoShop(m: Match, u: Unit): string | null {
  const h = u.hero!;
  if (!canShop(u)) return 'Undo is only available in the fountain';
  const last = h.undo.pop();
  if (!last) return 'Nothing to undo';
  if (last.kind === 'buy') {
    const s = h.items[last.slot];
    if (!s || s.id !== last.item) { h.undo.length = 0; return 'Cannot undo'; }
    if (last.count) { s.count -= last.count; if (s.count <= 0) h.items[last.slot] = null; }
    else h.items[last.slot] = null;
    for (const c of last.consumed) { const free = h.items.findIndex((x) => x === null); if (free >= 0) h.items[free] = c; }
    h.gold += last.gold;
  } else {
    if (h.items[last.slot]) { const free = h.items.findIndex((x) => x === null); if (free < 0) return 'Inventory full'; h.items[free] = last.consumed[0]; }
    else h.items[last.slot] = last.consumed[0];
    h.gold -= last.gold;
  }
  recomputeStats(m, u);
  return null;
}

export function useItem(m: Match, u: Unit, slot: number, cmd: { x?: number; y?: number; target?: number }): string | null {
  const h = u.hero!;
  const s = h.items[slot];
  if (!s) return 'Empty slot';
  const def = ITEMS[s.id];
  if (!def.active) return 'No active';
  if (s.cd > 0) return 'Item on cooldown';
  switch (s.id) {
    case 'amber':
      if (u.hp >= u.stats.maxHp) return 'Already at full health';
      addEffect(m, u, { kind: 'regen', until: m.time + 8, value: 15, src: u.id });
      s.count--; s.cd = 1;
      break;
    case 'lantern': {
      const r = m.placeWard(u, cmd.x ?? u.x, cmd.y ?? u.y, false);
      if (r) return r;
      s.count--; s.cd = 1;
      break;
    }
    case 'nullbell': {
      let t: Unit = u;
      const cc = (x: Unit) => x.effects.some((e) => e.kind === 'stun' || e.kind === 'root' || e.kind === 'slow' || e.kind === 'silence');
      if (!cc(u)) {
        const ally = m.heroes.filter((a) => a.alive && a.team === u.team && a !== u && dist(a.x, a.y, u.x, u.y) <= 6 && cc(a)).sort((a, b) => dist(a.x, a.y, u.x, u.y) - dist(b.x, b.y, u.x, u.y))[0];
        if (ally) t = ally;
      }
      t.effects = t.effects.filter((e) => !(e.kind === 'stun' || e.kind === 'root' || e.kind === 'slow' || e.kind === 'silence'));
      m.emit({ e: 'fx', kind: 'cleanse', x: t.x, y: t.y, id: t.id }, { x: t.x, y: t.y });
      s.cd = def.active.cooldown;
      break;
    }
    default: return 'No active';
  }
  if (s.count <= 0) h.items[slot] = null;
  invalidateUndo(u);
  return null;
}
