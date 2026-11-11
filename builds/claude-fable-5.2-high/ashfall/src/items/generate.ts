import { clamp } from '../core/math';
import type { Rng } from '../core/rng';
import type { ClassId, Item, RolledAffix } from '../entity-combat/types';
import { AFFIX, AFFIXES, BASE, BASES, GLYPHS, RELIC, RELICS, glyphInfo, type AffixDef, type BaseDef } from './content';

export const maxTier = (ilvl: number) => clamp(1 + Math.floor(ilvl / 5), 1, 5);
export function affixAllowed(a: AffixDef, base: BaseDef, cls: ClassId): boolean {
  if (a.cls && a.cls !== (base.cls ?? cls)) return false;
  return a.slots.some((t) => t === 'any' || t === base.slot || t === base.type
    || (t === 'weapon' && base.slot === 'main') || (t === 'armor' && ['head', 'chest', 'gloves', 'boots'].includes(base.slot))
    || (t === 'jewel' && (base.slot === 'amulet' || base.slot === 'ring')));
}
export function affixRange(def: AffixDef, tier: number, rarity: number): [number, number] {
  const m = (1 + (def.flat ? 0.25 : 0.55) * (tier - 1)) * (rarity >= 2 ? 1.1 : 1);
  const r = (v: number) => (def.max < 3 && def.stat !== 'flatDmg' ? Math.round(v * m * 10) / 10 : Math.round(v * m));
  if (def.stat.startsWith('rank')) return [1, 1];
  return [r(def.min), r(def.max)];
}
export function rollAffix(rng: Rng, def: AffixDef, ilvl: number, rarity: number): RolledAffix {
  const mt = maxTier(ilvl);
  const tier = rng.chance(0.6) ? mt : Math.max(1, mt - 1);
  const [lo, hi] = affixRange(def, tier, rarity);
  const v = lo + (hi - lo) * rng.next();
  return { id: def.id, tier, value: def.max < 3 && !def.stat.startsWith('rank') && def.stat !== 'flatDmg' ? Math.round(v * 10) / 10 : Math.round(v) };
}
/** Picks affixes honoring slot rules, class usability, group exclusions and a 2 prefix / 2 suffix cap. */
export function rollAffixes(rng: Rng, base: BaseDef, cls: ClassId, ilvl: number, rarity: number, count: number, existing: RolledAffix[] = []): RolledAffix[] {
  const out = [...existing];
  for (let i = 0; i < count; i++) {
    const groups = new Set(out.map((a) => AFFIX[a.id].group));
    const nP = out.filter((a) => AFFIX[a.id].pos === 'p').length, nS = out.length - nP;
    const pool = AFFIXES.filter((a) => affixAllowed(a, base, cls) && !groups.has(a.group) && (a.pos === 'p' ? nP < 2 : nS < 2));
    if (!pool.length) break;
    out.push(rollAffix(rng, rng.weighted(pool, (a) => a.w), ilvl, rarity));
  }
  return out;
}
export interface GenOpts { ilvl: number; cls: ClassId; rarity?: number; minRarity?: number; mf?: number; base?: string; relicBonus?: number; noRelic?: boolean }
const uid = (rng: Rng) => 'i' + rng.int(0, 0x7fffffff).toString(36) + rng.int(0, 0xffff).toString(36);
export function rollRarity(rng: Rng, mf: number, minRarity: number, relicBonus: number, noRelic?: boolean): number {
  const m = 1 + mf / 100;
  const w = [46, 40, 12 * m, noRelic ? 0 : 1.1 * m + relicBonus];
  for (let i = 0; i < minRarity; i++) w[i] = 0;
  let r = rng.next() * (w[0] + w[1] + w[2] + w[3]);
  for (let i = 0; i < 4; i++) { r -= w[i]; if (r <= 0) return i; }
  return 1;
}
export function pickBase(rng: Rng, ilvl: number, cls: ClassId): BaseDef {
  const own = rng.chance(0.82);
  const pool = BASES.filter((b) => b.ilvl <= ilvl + 1 && (!own || !b.cls || b.cls === cls));
  return rng.weighted(pool, (b) => 1 / (1 + (ilvl - b.ilvl) / 3) * (b.slot === 'main' ? 1.3 : 1));
}
export function generateItem(rng: Rng, o: GenOpts): Item {
  let rarity = o.rarity ?? rollRarity(rng, o.mf ?? 0, o.minRarity ?? 0, o.relicBonus ?? 0, o.noRelic);
  let base = o.base ? BASE[o.base] : pickBase(rng, o.ilvl, o.cls);
  let relic: string | undefined;
  let ilvl = o.ilvl;
  if (rarity === 3) {
    const pool = RELICS.filter((r) => { const b = BASE[r.base]; return !b.cls || b.cls === o.cls; });
    const r = rng.pick(pool);
    relic = r.id; base = BASE[r.base]; ilvl = Math.max(ilvl, base.ilvl);
  }
  const count = rarity === 0 ? 0 : rarity === 1 ? rng.int(1, 2) : rarity === 2 ? rng.int(3, 4) : rng.int(2, 3);
  const affixes = rollAffixes(rng, base, o.cls, ilvl, rarity, count);
  if (rarity === 1 && !affixes.length) rarity = 0;
  const socketable = ['main', 'off', 'head', 'chest'].includes(base.slot);
  return {
    id: uid(rng), kind: 'gear', base: base.id, rarity: rarity as Item['rarity'], ilvl, affixes, relic,
    identified: rarity < 2, sockets: socketable && rng.chance(0.14) ? 1 : 0, glyphs: [], dur: 100, rerolls: 0, x: 0, y: 0,
  };
}
export function generateGlyph(rng: Rng, tier = 1): Item {
  const type = rng.pick(Object.keys(GLYPHS));
  return { id: uid(rng), kind: 'glyph', base: `glyph_${type}_${tier}`, rarity: 1, ilvl: tier * 5, affixes: [], identified: true, sockets: 0, glyphs: [], dur: 100, rerolls: 0, x: 0, y: 0 };
}
export function itemName(it: Item): string {
  if (it.kind === 'glyph') { const g = glyphInfo(it.base); return `${g.def.name} ${'I'.repeat(g.tier)}`; }
  const b = BASE[it.base];
  if (!it.identified) return `Unidentified ${b.name}`;
  if (it.relic) return RELIC[it.relic].name;
  if (it.rarity === 0) return `Worn ${b.name}`;
  const p = it.affixes.find((a) => AFFIX[a.id].pos === 'p'), s = it.affixes.find((a) => AFFIX[a.id].pos === 's');
  return `${p ? AFFIX[p.id].name + ' ' : ''}${b.name}${s ? ' ' + AFFIX[s.id].name : ''}`;
}
export const itemSize = (it: Item): [number, number] => (it.kind === 'glyph' ? [1, 1] : [BASE[it.base].w, BASE[it.base].h]);
export function itemValue(it: Item): number {
  if (it.kind === 'glyph') return 15 * glyphInfo(it.base).tier ** 2;
  const [w, h] = itemSize(it);
  return Math.round((4 + it.ilvl * 2.2) * (1 + it.rarity * 1.4) * (0.7 + w * h * 0.15));
}
