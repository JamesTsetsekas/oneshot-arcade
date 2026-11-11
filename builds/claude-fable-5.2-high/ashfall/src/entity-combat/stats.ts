import { SKILL } from '../abilities/skills';
import { AFFIX, BASE, RELIC, glyphStat } from '../items/content';
import type { Hero, Item, Stats } from './types';

/** Stat lines an item contributes (base implicit, affixes, relic fixed stats, glyphs). Shared by tooltips and stat computation. */
export function itemStats(it: Item): [string, number][] {
  if (it.kind !== 'gear') return [];
  const b = BASE[it.base];
  const out: [string, number][] = [];
  if (b.implicit) out.push(b.implicit);
  if (!it.identified) return out;
  if (it.relic) out.push(...RELIC[it.relic].fixed, ['relic_' + it.relic, 1]);
  for (const a of it.affixes) out.push([AFFIX[a.id].stat, a.value]);
  for (const g of it.glyphs) out.push(glyphStat(g, b.slot === 'main'));
  return out;
}
export const ATTR_INFO: Record<string, string> = {
  might: '+1.2% melee damage and +2 armor per point',
  finesse: '+1.2% ranged damage, +0.2% critical chance and +0.4% attack speed per point',
  will: '+2 Focus, +0.6% skill damage and +0.5% all resistances per point',
  vigor: '+8 Health per point',
};
/** Derives every combat stat from attributes, equipment, passives and blessings. Pure function of the hero. */
export function computeStats(hero: Hero): Stats {
  const s: Stats = { ...hero.attrs };
  const add = (k: string, v: number) => { s[k] = (s[k] ?? 0) + v; };
  let baseArmor = 0, shieldBlock = 0;
  for (const it of Object.values(hero.equip)) {
    if (!it || it.dur <= 0) continue;
    const b = BASE[it.base];
    baseArmor += b.armor ?? 0;
    shieldBlock += b.block ?? 0;
    for (const [k, v] of itemStats(it)) add(k, v);
  }
  for (const [id, rank] of Object.entries(hero.ranks)) {
    const def = SKILL[id];
    if (def?.stat && rank > 0) for (const [k, v] of Object.entries(def.stat)) add(k, v * rank);
  }
  const g = (k: string) => s[k] ?? 0;
  const main = hero.equip.main && hero.equip.main.dur > 0 ? BASE[hero.equip.main.base] : null;
  const hasShield = !!hero.equip.off && BASE[hero.equip.off.base].type === 'shield' && hero.equip.off.dur > 0;
  s.twoHand = main?.twoHand ? 1 : 0;
  s.hasShield = hasShield ? 1 : 0;
  s.hpMax = Math.round((90 + 14 * hero.level + 8 * g('vigor') + g('hp')) * (1 + g('hpPct') / 100) * (hero.blessing > 0 ? 1.08 : 1));
  s.focusMax = Math.round(80 + 2 * g('will') + g('focus'));
  s.armorTotal = Math.round((baseArmor + g('armor') + 2 * g('might')) * (1 + (g('armorPct') + (hasShield ? g('shieldArmorPct') : 0)) / 100));
  const resBase = g('resAll') * (hasShield || !SKILL.shield_discipline.stat || !hero.ranks.shield_discipline ? 1 : 1) + 0.5 * g('will');
  s.resEmberT = Math.min(75, g('resEmber') + resBase);
  s.resFrostT = Math.min(75, g('resFrost') + resBase);
  s.resBlightT = Math.min(75, g('resBlight') + resBase);
  s.dmgMin = (main?.dmg?.[0] ?? 2) + g('flatDmg');
  s.dmgMax = (main?.dmg?.[1] ?? 4) + g('flatDmg');
  s.aps = (main?.aps ?? 1.1) * (1 + (g('attackSpeed') + 0.4 * g('finesse')) / 100);
  s.crit = Math.min(75, 5 + g('critChance') + 0.2 * g('finesse'));
  s.critMult = 1.5 + g('critDmg') / 100;
  s.dmgPct = g('dmgPct') + (s.twoHand ? g('twoHandPct') : 0) + 3 * (hero.level - 1); // training: +3% damage per level
  s.meleePct = g('meleePct') + 1.2 * g('might');
  s.rangedPct = g('rangedPct') + 1.2 * g('finesse');
  s.skillPct = g('skillPct') + 0.6 * g('will');
  s.move = 4.6 * (1 + g('moveSpeed') / 100);
  s.blockT = Math.min(60, shieldBlock + (hasShield ? g('block') : 0));
  s.regen = 1.5 + g('focusRegen');
  s.thornsT = Math.round(g('thorns') * (1 + 0.15 * hero.level));
  return s;
}
/** Armor mitigation with diminishing returns based on hit magnitude; capped at 75%. */
export const armorReduction = (armor: number, hit: number) => Math.min(0.75, armor / (armor + 6 * Math.max(1, hit) + 20));
