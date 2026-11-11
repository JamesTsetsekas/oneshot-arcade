// Seeded loot generation: base + item level + rarity budget + affix pools with tiers, exclusions and class rules.
import { AFFIXES, AFFIX_BY_ID, AFFIX_TIER_ILVL, BASES, BASE_BY_ID, RELICS, RELIC_BY_ID, SCALE_MULT, GLYPH_TYPES, type AffixDef, type BaseDef, type SlotGroup } from '../data/items';
import type { AffixRoll, ClassId, Item, Rarity, Stats } from './types';
import { Rng } from './rng';

let uidCounter = 0;
export function nextUid(): string {
  uidCounter++;
  return `i${uidCounter.toString(36)}${Math.floor(Math.random() * 1679616).toString(36)}`;
}
export function resetUidCounterFor(items: Item[]) {
  // keep uid unique after loading a save
  uidCounter = Math.max(uidCounter, items.length + 1000);
}

export interface GenOpts {
  cls: ClassId;
  rarity?: Rarity;
  group?: SlotGroup;
  identified?: boolean;
  relicBoost?: number; // additional relic chance (0..1)
  minRarity?: Rarity;
  boss?: boolean;
}

const RARITY_ORDER: Rarity[] = ['worn', 'tempered', 'inscribed', 'relic'];
export function rarityRank(r: Rarity): number {
  return RARITY_ORDER.indexOf(r);
}

const GROUP_WEIGHTS: [SlotGroup, number][] = [
  ['wpn', 14], ['off', 8], ['head', 9], ['chest', 9], ['gloves', 9], ['boots', 9], ['belt', 8], ['amulet', 7], ['ring', 12],
];

export function eligibleBases(group: SlotGroup, cls: ClassId, ilvl: number): BaseDef[] {
  const all = BASES.filter((b) => b.group === group && (!b.cls || b.cls === cls) && b.ilvl <= ilvl);
  if (all.length === 0) return [];
  const topTier = Math.max(...all.map((b) => b.tier));
  return all.filter((b) => b.tier >= topTier - 1);
}

export function rollRarity(rng: Rng, opts: GenOpts): Rarity {
  if (opts.rarity) return opts.rarity;
  const relicChance = 0.008 + (opts.relicBoost ?? 0);
  const r = rng.next();
  let rarity: Rarity;
  if (r < relicChance) rarity = 'relic';
  else if (r < relicChance + 0.13) rarity = 'inscribed';
  else if (r < relicChance + 0.13 + 0.34) rarity = 'tempered';
  else rarity = 'worn';
  if (opts.minRarity && rarityRank(rarity) < rarityRank(opts.minRarity)) rarity = opts.minRarity;
  return rarity;
}

export function affixTiersFor(ilvl: number): number {
  let t = 0;
  for (let i = 0; i < AFFIX_TIER_ILVL.length; i++) if (ilvl >= AFFIX_TIER_ILVL[i]) t = i;
  return t;
}

export function rollAffixValue(rng: Rng, def: AffixDef, tier: number, elevated: boolean): number {
  const m = SCALE_MULT[def.scale][tier];
  const lo = def.lo * m;
  const hi = def.hi * m;
  const r = elevated ? 0.25 + 0.75 * rng.next() : rng.next();
  const v = lo + (hi - lo) * r;
  if (def.fmt === 'dec') return Math.round(v * 10) / 10;
  return Math.max(1, Math.round(v));
}

export function affixRange(def: AffixDef, tier: number): [number, number] {
  const m = SCALE_MULT[def.scale][tier];
  const f = (v: number) => (def.fmt === 'dec' ? Math.round(v * 10) / 10 : Math.round(v));
  return [f(def.lo * m), f(def.hi * m)];
}

function eligibleAffixes(group: SlotGroup, cls: ClassId, taken: AffixRoll[], type?: 'prefix' | 'suffix'): AffixDef[] {
  const takenGroups = new Set(taken.map((a) => AFFIX_BY_ID[a.id].group));
  return AFFIXES.filter((a) => a.slots.includes(group) && (!a.cls || a.cls === cls) && !takenGroups.has(a.group) && (!type || a.type === type));
}

export function rollAffix(rng: Rng, group: SlotGroup, cls: ClassId, ilvl: number, taken: AffixRoll[], elevated: boolean, type?: 'prefix' | 'suffix'): AffixRoll | null {
  const pool = eligibleAffixes(group, cls, taken, type);
  if (pool.length === 0) return null;
  const def = rng.weighted(pool, (a) => a.weight);
  const maxTier = affixTiersFor(ilvl);
  // bias toward higher tiers but keep lower ones possible
  let tier = maxTier;
  while (tier > 0 && rng.chance(0.38)) tier--;
  return { id: def.id, tier, value: rollAffixValue(rng, def, tier, elevated) };
}

function nameItem(item: Item): string {
  const base = BASE_BY_ID[item.base];
  if (item.rarity === 'relic' && item.relic) return RELIC_BY_ID[item.relic].name;
  if (item.rarity === 'worn') return base.name;
  const pre = item.affixes.map((a) => AFFIX_BY_ID[a.id]).find((a) => a.type === 'prefix');
  const suf = item.affixes.map((a) => AFFIX_BY_ID[a.id]).find((a) => a.type === 'suffix');
  if (item.rarity === 'tempered') {
    if (pre) return `${pre.name} ${base.name}`;
    if (suf) return `${base.name} ${suf.name}`;
  }
  return `${pre ? pre.name + ' ' : ''}${base.name}${suf ? ' ' + suf.name : ''}`;
}

export function makeItem(baseId: string, ilvl: number, rarity: Rarity, affixes: AffixRoll[], identified: boolean, relic?: string): Item {
  const base = BASE_BY_ID[baseId];
  const item: Item = {
    uid: nextUid(),
    base: baseId,
    ilvl,
    rarity,
    identified,
    affixes,
    relic,
    sockets: [],
    socketCap: base.sockets,
    favorite: false,
    dur: 40,
    durMax: 40,
    rerolls: 0,
    name: base.name,
  };
  item.name = nameItem(item);
  return item;
}

export function generateItem(rng: Rng, ilvl: number, opts: GenOpts): Item {
  let rarity = rollRarity(rng, opts);
  const groupPick = opts.group ?? rng.weighted(GROUP_WEIGHTS, (g) => g[1])[0] ?? 'ring';
  let group = typeof groupPick === 'string' ? groupPick : (groupPick as unknown as SlotGroup);
  if (rarity === 'relic') {
    const relicPool = RELICS.filter((r) => (!r.cls || r.cls === opts.cls) && BASE_BY_ID[r.base].ilvl <= ilvl + 4 && (!opts.group || BASE_BY_ID[r.base].group === opts.group));
    if (relicPool.length === 0) rarity = 'inscribed';
    else {
      const def = rng.pick(relicPool);
      const base = BASE_BY_ID[def.base];
      const count = rng.int(def.extra[0], def.extra[1]);
      const affixes: AffixRoll[] = [];
      for (let i = 0; i < count; i++) {
        const a = rollAffix(rng, base.group, opts.cls, Math.max(ilvl, base.ilvl), affixes, true);
        if (a) affixes.push(a);
      }
      const item = makeItem(base.id, Math.max(ilvl, base.ilvl), 'relic', affixes, opts.identified ?? false, def.id);
      item.sockets = rng.chance(0.4) ? [null] : [];
      return item;
    }
  }
  let bases = eligibleBases(group, opts.cls, ilvl);
  if (bases.length === 0) {
    group = 'ring';
    bases = eligibleBases(group, opts.cls, ilvl);
  }
  const base = rng.weighted(bases, (b) => 1 + b.tier * 0.8);
  const affixes: AffixRoll[] = [];
  const elevated = rarity === 'inscribed';
  if (rarity === 'tempered') {
    const n = rng.int(1, 2);
    for (let i = 0; i < n; i++) {
      const type = n === 2 ? (i === 0 ? 'prefix' : 'suffix') : undefined;
      const a = rollAffix(rng, group, opts.cls, ilvl, affixes, false, type);
      if (a) affixes.push(a);
    }
  } else if (rarity === 'inscribed') {
    const n = rng.int(3, 4);
    const order: ('prefix' | 'suffix')[] = rng.shuffle(n === 3 ? ['prefix', 'suffix', rng.chance(0.5) ? 'prefix' : 'suffix'] : ['prefix', 'prefix', 'suffix', 'suffix']);
    for (const type of order) {
      const a = rollAffix(rng, group, opts.cls, ilvl, affixes, elevated, type) ?? rollAffix(rng, group, opts.cls, ilvl, affixes, elevated);
      if (a) affixes.push(a);
    }
  }
  const identified = opts.identified ?? (rarity === 'worn' || rarity === 'tempered');
  const item = makeItem(base.id, ilvl, rarity, affixes, identified);
  if (rarity !== 'worn' && base.sockets > 0) {
    const r = rng.next();
    item.sockets = r < 0.12 && base.sockets > 1 ? [null, null] : r < 0.45 ? [null] : [];
  }
  return item;
}

export function makeGlyph(type: string, tier: number): Item {
  const id = `glyph_${type}_${tier}`;
  const it = makeItem(id, 1, 'tempered', [], true);
  it.socketCap = 0;
  return it;
}

export function randomGlyph(rng: Rng, maxTier = 2): Item {
  const gt = rng.pick(GLYPH_TYPES);
  const tier = rng.chance(0.18) && maxTier >= 2 ? 2 : 1;
  return makeGlyph(gt.id, Math.min(tier, maxTier));
}

// ------------------------------------------------------------- stats & text
export interface ItemLine {
  text: string;
  kind: 'implicit' | 'affix' | 'relic' | 'socket' | 'hidden' | 'power';
  tier?: number;
  range?: [number, number];
}

export function fmtValue(def: AffixDef, v: number): string {
  return def.fmt === 'dec' ? v.toFixed(1) : String(Math.round(v));
}

export function affixText(def: AffixDef, v: number): string {
  const num = fmtValue(def, v);
  return def.label.startsWith('%') ? `+${num}${def.label}` : `+${num} ${def.label}`;
}

export function statLabel(stat: string, v: number): string {
  const pctStats = ['dmgPct', 'dmgPhysPct', 'dmgEmberPct', 'dmgFrostPct', 'dmgBlightPct', 'dmgMeleePct', 'dmgProjPct', 'dmgAreaPct', 'armorPct', 'maxHpPct', 'critChance', 'critDamage', 'blockChance', 'moveSpeedPct', 'potionPotency'];
  const names: Record<string, string> = {
    maxHp: 'Maximum Health', maxFocus: 'Maximum Focus', armor: 'Armor', blockChance: 'Block Chance', critChance: 'Critical Chance', dmgProjPct: 'Projectile Damage', dmgPct: 'Damage',
    moveSpeedPct: 'Movement Speed', dmgEmberPct: 'Ember Damage', dmgPhysPct: 'Physical Damage', dmgBlightPct: 'Blight Damage', armorPct: 'Armor', critDamage: 'Critical Damage', potionPotency: 'Potion Potency',
    markDmgPct: 'Trace Detonation Damage', trapDmgPct: 'Trap and Pool Damage', resEmber: 'Ember Resistance', resFrost: 'Frost Resistance', resBlight: 'Blight Resistance',
  };
  const isPct = pctStats.includes(stat) || stat.endsWith('Pct') || stat.startsWith('res');
  const label = names[stat] ?? stat;
  return `+${Math.round(v * 10) / 10}${isPct ? '%' : ''} ${label}`;
}

export function describeItem(item: Item): ItemLine[] {
  const base = BASE_BY_ID[item.base];
  const lines: ItemLine[] = [];
  if (base.implicit && base.group !== 'glyph') lines.push({ text: statLabel(base.implicit.stat, base.implicit.v), kind: 'implicit' });
  if (item.relic) {
    const rd = RELIC_BY_ID[item.relic];
    lines.push({ text: rd.power, kind: 'power' });
    for (const f of rd.fixed) lines.push({ text: statLabel(f.stat, f.v), kind: 'relic' });
  }
  if (item.identified) {
    for (const a of item.affixes) {
      const def = AFFIX_BY_ID[a.id];
      lines.push({ text: affixText(def, a.value), kind: 'affix', tier: a.tier, range: affixRange(def, a.tier) });
    }
  } else if (item.rarity === 'inscribed' || item.rarity === 'relic') {
    lines.push({ text: `${item.affixes.length} unidentified ${item.affixes.length === 1 ? 'modifier' : 'modifiers'} (inactive until identified)`, kind: 'hidden' });
  }
  item.sockets.forEach((s, i) => {
    if (s) {
      const gb = BASE_BY_ID[s];
      lines.push({ text: `Socket ${i + 1}: ${gb.name} - ${statLabel(gb.implicit!.stat, gb.implicit!.v)}`, kind: 'socket' });
    } else lines.push({ text: `Socket ${i + 1}: empty`, kind: 'socket' });
  });
  return lines;
}

export function addStat(s: Stats, k: string, v: number) {
  s[k] = (s[k] ?? 0) + v;
}

/** Stat contribution of one item (excluding weapon base damage, which is handled separately). */
export function itemStats(item: Item): Stats {
  const s: Stats = {};
  const base = BASE_BY_ID[item.base];
  if (base.armor) addStat(s, 'armor', base.armor);
  if (base.implicit && base.group !== 'glyph') addStat(s, base.implicit.stat, base.implicit.v);
  if (item.relic) for (const f of RELIC_BY_ID[item.relic].fixed) addStat(s, f.stat, f.v);
  if (item.dur <= 0) return s; // broken gear loses affixes and sockets
  if (item.identified) for (const a of item.affixes) addStat(s, AFFIX_BY_ID[a.id].stat, a.value);
  for (const g of item.sockets) {
    if (!g) continue;
    const gb = BASE_BY_ID[g];
    addStat(s, gb.implicit!.stat, gb.implicit!.v);
  }
  return s;
}

export function itemValue(item: Item): number {
  const base = BASE_BY_ID[item.base];
  if (base.group === 'glyph') return 30 * Math.pow(2.4, base.tier - 1);
  const rm = { worn: 1, tempered: 2.4, inscribed: 6, relic: 22 }[item.rarity];
  return Math.round((6 + item.ilvl * 3.2) * rm * (1 + base.tier * 0.15));
}
export function sellValue(item: Item): number {
  return Math.max(1, Math.round(itemValue(item) * 0.3));
}
export function buyValue(item: Item): number {
  return Math.round(itemValue(item) * 1.4);
}
export function identifyCost(item: Item): number {
  return Math.round(20 + item.ilvl * 4 * (item.rarity === 'relic' ? 2 : 1));
}
export function salvageDust(item: Item): number {
  const base = BASE_BY_ID[item.base];
  if (base.group === 'glyph') return base.tier * 2;
  return { worn: 1, tempered: 3, inscribed: 8, relic: 20 }[item.rarity] + Math.floor(item.ilvl / 6);
}
export function rerollCost(item: Item): { gold: number; dust: number } {
  const n = item.rerolls;
  return { gold: Math.round((60 + item.ilvl * 5) * Math.pow(1.6, n)), dust: Math.round(4 * Math.pow(1.5, n)) };
}
export function repairCost(item: Item): number {
  return Math.ceil((item.durMax - item.dur) * (0.6 + item.ilvl * 0.12));
}
export function socketCost(item: Item): { gold: number; dust: number } {
  return { gold: 80 + item.ilvl * 6, dust: 10 };
}
export function isEquippableGroup(b: BaseDef): boolean {
  return b.group !== 'glyph';
}
