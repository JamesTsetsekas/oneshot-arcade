import { BASE_BY_ID } from '../data/items';
import { CLASSES, SKILL_BY_ID } from '../data/skills';
import { Character, computeDerived } from '../sim/character';
import type { Game } from '../sim/game';
import { canUse, planEquip, targetSlot } from '../sim/inventory';
import { buyValue, describeItem, sellValue } from '../sim/loot';
import type { Item, SlotId } from '../sim/types';
import { RARITY_CSS, RARITY_ICON, RARITY_NAME, itemIcon } from './icons';

export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export interface Delta {
  label: string;
  diff: number;
  fmt?: 'pct' | 'num';
}

export function compareDeltas(g: Game, it: Item): { slot: SlotId; replacing: Item[]; deltas: Delta[] } | null {
  const ch = g.ch;
  if (!canUse(it, ch.cls)) return null;
  const slot = targetSlot(it, ch.equip);
  if (!slot) return null;
  const plan = planEquip(it, slot, ch.equip, ch.cls);
  if (!plan.ok) return null;
  const eq = { ...ch.equip };
  for (const d of plan.displaced) for (const k of Object.keys(eq) as SlotId[]) if (eq[k]?.uid === d.uid) delete eq[k];
  eq[slot] = it;
  const cur = g.d;
  const nxt = computeDerived({ ...ch, equip: eq } as Character, { resAll: 0 });
  const deltas: Delta[] = [];
  const dmgScore = (d: typeof cur) => d.weaponPool * (1 + ((d.raw.dmgPct ?? 0) + (d.raw.dmgPhysPct ?? 0)) / 100) * d.speedMul;
  const push = (label: string, a: number, b: number, fmt: 'pct' | 'num' = 'num') => {
    const diff = Math.round((b - a) * 10) / 10;
    if (Math.abs(diff) >= 0.1) deltas.push({ label, diff, fmt });
  };
  push('Weapon damage', cur.weaponPool, nxt.weaponPool);
  push('Damage output (est.)', dmgScore(cur), dmgScore(nxt));
  push('Maximum Health', cur.maxHp, nxt.maxHp);
  push('Maximum Focus', cur.maxFocus, nxt.maxFocus);
  push('Armor', cur.armor, nxt.armor);
  push('Ember resistance', cur.res.ember, nxt.res.ember, 'pct');
  push('Frost resistance', cur.res.frost, nxt.res.frost, 'pct');
  push('Blight resistance', cur.res.blight, nxt.res.blight, 'pct');
  push('Critical chance', cur.critChance, nxt.critChance, 'pct');
  push('Attack/cast speed', (cur.speedMul - 1) * 100, (nxt.speedMul - 1) * 100, 'pct');
  push('Movement speed', cur.moveSpeed, nxt.moveSpeed);
  push('Block chance', cur.block, nxt.block, 'pct');
  return { slot, replacing: plan.displaced, deltas };
}

export function itemTooltip(g: Game, it: Item, o: { advanced: boolean; compare: boolean; price?: 'buy' | 'sell'; equipped?: boolean }): string {
  const b = BASE_BY_ID[it.base];
  const col = RARITY_CSS[it.rarity];
  const lines = describeItem(it);
  const usable = canUse(it, g.ch.cls) || b.group === 'glyph';
  let html = `<div class="tt-head" style="border-color:${col}"><img src="${itemIcon(it)}" width="40" height="40"><div><div class="tt-name" style="color:${col}">${RARITY_ICON[it.rarity]} ${esc(it.name)}${it.favorite ? ' <span class="fav">★</span>' : ''}</div><div class="tt-sub">${RARITY_NAME[it.rarity]} ${esc(b.name)}${b.group === 'glyph' ? '' : ''}</div></div></div>`;
  if (b.dmg) {
    const lo = b.dmg[0];
    const hi = b.dmg[1];
    html += `<div class="tt-main">Damage ${lo}–${hi} <span class="dim">(avg ${((lo + hi) / 2).toFixed(1)})</span>${b.twoHanded ? '<span class="dim"> · two-handed</span>' : ''}</div>`;
  }
  if (b.armor) html += `<div class="tt-main">Armor ${b.armor}</div>`;
  for (const l of lines) {
    const cls = l.kind === 'implicit' ? 'imp' : l.kind === 'power' ? 'power' : l.kind === 'relic' ? 'relicmod' : l.kind === 'hidden' ? 'hidden' : l.kind === 'socket' ? 'sock' : 'aff';
    let extra = '';
    if (l.kind === 'affix' && o.advanced && l.range) extra = ` <span class="dim">[T${(l.tier ?? 0) + 1}: ${l.range[0]}–${l.range[1]}]</span>`;
    html += `<div class="tt-line ${cls}">${esc(l.text)}${extra}</div>`;
  }
  if (b.group === 'glyph') html += `<div class="tt-line dim">Socket into eligible gear. Three matching lesser glyphs combine into a greater one at the Artificer.</div>`;
  if (b.group !== 'glyph') html += `<div class="tt-foot">Durability ${Math.round(it.dur)}/${it.durMax}${it.dur <= 0 ? ' <span class="bad">BROKEN - modifiers inactive</span>' : ''}${o.advanced ? ` · Item level ${it.ilvl}` : ''}</div>`;
  if (!usable) html += `<div class="tt-foot bad">Cannot be used by the ${esc(CLASSES[g.ch.cls].name)}</div>`;
  if (b.cls && usable && b.group !== 'glyph') html += `<div class="tt-foot dim">${esc(CLASSES[b.cls].name)} item</div>`;
  if (o.price === 'sell') html += `<div class="tt-foot gold">Sells for ${sellValue(it)} gold</div>`;
  if (o.price === 'buy') html += `<div class="tt-foot gold">Costs ${buyValue(it)} gold</div>`;
  if (o.compare && !o.equipped && b.group !== 'glyph') {
    const c = compareDeltas(g, it);
    if (c) {
      const names = c.replacing.map((r) => esc(r.name)).join(' + ') || 'an empty slot';
      html += `<div class="tt-cmp"><div class="dim">Compared with ${names}:</div>`;
      if (c.deltas.length === 0) html += '<div class="dim">No change.</div>';
      for (const d of c.deltas) html += `<div class="${d.diff > 0 ? 'good' : 'bad'}">${d.diff > 0 ? '▲' : '▼'} ${esc(d.label)} ${d.diff > 0 ? '+' : ''}${d.diff}${d.fmt === 'pct' ? '%' : ''}</div>`;
      if (!it.identified) html += '<div class="dim">(Unidentified modifiers are not counted.)</div>';
      html += '</div>';
    }
  }
  return html;
}

export function skillTooltip(g: Game, id: string): string {
  const sk = SKILL_BY_ID[id];
  if (!sk) return '';
  const dmg = g.skillTooltipDamage(id);
  const rank = g.ch.ranks[id] ?? 0;
  const parts: string[] = [];
  if (sk.cost) parts.push(`${sk.cost} Focus`);
  if (sk.cooldown) parts.push(`${sk.cooldown}s cooldown${sk.charges ? `, ${sk.charges} charges` : ''}`);
  const coefs = (['phys', 'ember', 'frost', 'blight'] as const).filter((t) => sk.dmg[t]).map((t) => `${Math.round((sk.dmg[t] ?? 0) * 100)}% ${t === 'phys' ? 'physical' : t}`);
  return `<div class="tt-name">${esc(sk.name)} <span class="dim">${rank > 0 ? `Rank ${rank}` : sk.kind === 'basic' ? 'Basic' : 'Not learned'}</span></div>
    <div class="tt-sub">${sk.tags.join(' · ')}</div>
    <div class="tt-line">${esc(sk.desc)}</div>
    ${dmg ? `<div class="tt-line">Damage: ${Math.round(dmg)} (${coefs.join(' + ')} of weapon damage)</div>` : ''}
    <div class="tt-line dim">${parts.join(' · ') || 'No cost'} · range ${sk.range || 'self'} · cast ${sk.time.total.toFixed(2)}s</div>
    ${sk.kind !== 'basic' ? `<div class="tt-line dim">Unlocks at level ${sk.unlock}. Each rank: +12% damage.</div>` : ''}`;
}
