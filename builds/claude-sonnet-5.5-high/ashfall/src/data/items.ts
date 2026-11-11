// Item content tables: base items, affixes, relics, glyphs, potions. All original content.
import type { ClassId, PotionKind, SlotId } from '../sim/types';

export type SlotGroup = 'wpn' | 'off' | 'head' | 'chest' | 'gloves' | 'boots' | 'belt' | 'amulet' | 'ring' | 'glyph';

export interface BaseDef {
  id: string;
  name: string;
  group: SlotGroup;
  w: number;
  h: number;
  tier: number; // 1..4
  ilvl: number; // minimum item level
  cls?: ClassId; // class usability
  weaponType?: 'mace' | 'maul' | 'bow';
  twoHanded?: boolean;
  dmg?: [number, number];
  armor?: number;
  implicit?: { stat: string; v: number };
  sockets: number; // max sockets that may roll
  shape: string; // icon silhouette key
}

const TIER_ILVL = [1, 5, 10, 15];
const MATERIALS = ['Rusted', 'Bellmetal', 'Verdigris', 'Starmetal'];

export const BASES: BaseDef[] = [];
function addBase(b: BaseDef) {
  BASES.push(b);
}

// weapons
const MACE_DMG: [number, number][] = [[6, 10], [13, 21], [24, 38], [38, 58]];
const MAUL_DMG: [number, number][] = [[11, 17], [24, 36], [44, 66], [68, 100]];
const BOW_DMG: [number, number][] = [[7, 11], [15, 22], [26, 40], [42, 62]];
const MACE_NAMES = ['Rusted Mace', 'Bellmetal Mace', 'Verdigris Flanged Mace', 'Starmetal Mace'];
const MAUL_NAMES = ['Gravehammer', 'Bellcaster Maul', 'Brass Pylon Maul', 'Starmetal Maul'];
const BOW_NAMES = ["Hunter's Bow", 'Ashwood Bow', 'Veilstring Bow', 'Starmetal Longbow'];
const SHIELD_NAMES = ['Plank Shield', 'Bellmetal Bulwark', 'Verdigris Aegis', 'Starmetal Bulwark'];
const QUIVER_NAMES = ['Hide Quiver', 'Reed Quiver', 'Veil Quiver', 'Starmetal Quiver'];
for (let t = 0; t < 4; t++) {
  addBase({ id: `mace_${t + 1}`, name: MACE_NAMES[t], group: 'wpn', w: 1, h: 2, tier: t + 1, ilvl: TIER_ILVL[t], cls: 'cinder', weaponType: 'mace', dmg: MACE_DMG[t], sockets: 2, shape: 'mace' });
  addBase({ id: `maul_${t + 1}`, name: MAUL_NAMES[t], group: 'wpn', w: 2, h: 3, tier: t + 1, ilvl: TIER_ILVL[t], cls: 'cinder', weaponType: 'maul', twoHanded: true, dmg: MAUL_DMG[t], sockets: 2, shape: 'maul' });
  addBase({ id: `bow_${t + 1}`, name: BOW_NAMES[t], group: 'wpn', w: 2, h: 3, tier: t + 1, ilvl: TIER_ILVL[t], cls: 'ranger', weaponType: 'bow', twoHanded: true, dmg: BOW_DMG[t], sockets: 2, shape: 'bow' });
  addBase({ id: `shield_${t + 1}`, name: SHIELD_NAMES[t], group: 'off', w: 2, h: 3, tier: t + 1, ilvl: TIER_ILVL[t], cls: 'cinder', armor: 10 + t * 14, implicit: { stat: 'blockChance', v: 12 + t * 3 }, sockets: 1, shape: 'shield' });
  addBase({ id: `quiver_${t + 1}`, name: QUIVER_NAMES[t], group: 'off', w: 1, h: 2, tier: t + 1, ilvl: TIER_ILVL[t], cls: 'ranger', implicit: { stat: 'dmgProjPct', v: 6 + t * 3 }, sockets: 1, shape: 'quiver' });
}
// armour: heavy + light variants
const HEAVY: Record<string, [string, number, number, number, string]> = {
  head: ['Helm', 6, 1, 1, 'helm'],
  chest: ['Hauberk', 16, 2, 3, 'chest'],
  gloves: ['Gauntlets', 4, 1, 2, 'gloves'],
  boots: ['Greaves', 5, 1, 2, 'boots'],
};
const LIGHT: Record<string, [string, number, string, number]> = {
  head: ['Cowl', 0.4, 'maxFocus', 7],
  chest: ['Vest', 0.4, 'maxHp', 16],
  gloves: ['Wraps', 0.4, 'critChance', 1.2],
  boots: ['Treads', 0.4, 'moveSpeedPct', 2],
};
for (const g of ['head', 'chest', 'gloves', 'boots'] as const) {
  for (let t = 0; t < 4; t++) {
    const [hn, armor, w, h, shape] = HEAVY[g];
    addBase({ id: `${g}_h${t + 1}`, name: `${MATERIALS[t]} ${hn}`, group: g, w, h, tier: t + 1, ilvl: TIER_ILVL[t], armor: Math.round(armor * (1 + t * 1.7)), sockets: 1, shape });
    const [ln, mul, istat, ival] = LIGHT[g];
    addBase({ id: `${g}_l${t + 1}`, name: `${MATERIALS[t]} ${ln}`, group: g, w, h, tier: t + 1, ilvl: TIER_ILVL[t], armor: Math.round(armor * mul * (1 + t * 1.7)), implicit: { stat: istat, v: Math.round(ival * (1 + t * 0.8) * 10) / 10 }, sockets: 1, shape });
  }
}
const BELT_NAMES = ['Rope Belt', 'Chain Girdle', 'Brass Sash', 'Starmetal Cincture'];
const AMU_NAMES = ['Bone Charm', 'Brass Locket', 'Verdigris Pendant', 'Starmetal Eye'];
const RING_NAMES = ['Iron Band', 'Brass Ring', 'Verdigris Signet', 'Starmetal Loop'];
for (let t = 0; t < 4; t++) {
  addBase({ id: `belt_${t + 1}`, name: BELT_NAMES[t], group: 'belt', w: 1, h: 1, tier: t + 1, ilvl: TIER_ILVL[t], armor: 3 + t * 4, implicit: { stat: 'maxHp', v: 10 + t * 8 }, sockets: 1, shape: 'belt' });
  addBase({ id: `amulet_${t + 1}`, name: AMU_NAMES[t], group: 'amulet', w: 1, h: 1, tier: t + 1, ilvl: TIER_ILVL[t], implicit: { stat: 'dmgPct', v: 3 + t * 2 }, sockets: 1, shape: 'amulet' });
  addBase({ id: `ring_${t + 1}`, name: RING_NAMES[t], group: 'ring', w: 1, h: 1, tier: t + 1, ilvl: TIER_ILVL[t], implicit: { stat: 'maxFocus', v: 4 + t * 3 }, sockets: 1, shape: 'ring' });
}

export const GLYPH_TYPES = [
  { id: 'ember', name: 'Ember', stat: 'dmgEmberPct', vals: [6, 12, 20], label: 'increased Ember Damage', color: '#ff7a3c' },
  { id: 'ward', name: 'Ward', stat: 'armor', vals: [12, 26, 45], label: 'Armor', color: '#b9c4ce' },
  { id: 'keen', name: 'Keen', stat: 'critChance', vals: [2, 4, 7], label: 'Critical Chance', color: '#ffd56a' },
  { id: 'vital', name: 'Vital', stat: 'maxHp', vals: [14, 30, 52], label: 'Maximum Health', color: '#e0505a' },
];
const GLYPH_TIER_NAMES = ['Lesser', 'Greater', 'Exalted'];
for (const gt of GLYPH_TYPES) {
  for (let t = 0; t < 3; t++) {
    addBase({ id: `glyph_${gt.id}_${t + 1}`, name: `${GLYPH_TIER_NAMES[t]} ${gt.name} Glyph`, group: 'glyph', w: 1, h: 1, tier: t + 1, ilvl: 1, implicit: { stat: gt.stat, v: gt.vals[t] }, sockets: 0, shape: 'glyph' });
  }
}

export const BASE_BY_ID: Record<string, BaseDef> = Object.fromEntries(BASES.map((b) => [b.id, b]));

export function baseSlots(b: BaseDef): SlotId[] {
  switch (b.group) {
    case 'wpn':
      return ['weapon'];
    case 'off':
      return ['offhand'];
    case 'ring':
      return ['ring1', 'ring2'];
    case 'head':
    case 'chest':
    case 'gloves':
    case 'boots':
    case 'belt':
    case 'amulet':
      return [b.group];
    default:
      return [];
  }
}

// ---------------------------------------------------------------- affixes
export type ScaleKind = 'flat' | 'pct' | 'small' | 'attr' | 'res';
export const SCALE_MULT: Record<ScaleKind, number[]> = {
  flat: [1, 1.9, 3.0, 4.4, 6.0],
  pct: [1, 1.4, 1.9, 2.4, 3.0],
  small: [1, 1.2, 1.45, 1.7, 2.0],
  attr: [1, 1.5, 2.0, 2.6, 3.3],
  res: [1, 1.3, 1.6, 1.9, 2.3],
};
export const AFFIX_TIER_ILVL = [1, 5, 10, 15, 22];

export interface AffixDef {
  id: string;
  type: 'prefix' | 'suffix';
  name: string; // naming word
  stat: string;
  label: string; // tooltip text after the number
  fmt: 'flat' | 'pct' | 'dec';
  slots: SlotGroup[];
  weight: number;
  scale: ScaleKind;
  lo: number;
  hi: number;
  group: string; // exclusion group - one affix per group
  cls?: ClassId;
  tags: string[];
  needs?: string; // weapon type / offhand requirement hint
}

const ALL_ARMOR: SlotGroup[] = ['head', 'chest', 'gloves', 'boots'];
const JEWEL: SlotGroup[] = ['amulet', 'ring'];
export const AFFIXES: AffixDef[] = [];
function A(id: string, type: 'prefix' | 'suffix', name: string, stat: string, label: string, fmt: 'flat' | 'pct' | 'dec', slots: SlotGroup[], weight: number, scale: ScaleKind, lo: number, hi: number, tags: string[] = [], cls?: ClassId, group?: string) {
  AFFIXES.push({ id, type, name, stat, label, fmt, slots, weight, scale, lo, hi, group: group ?? stat, cls, tags });
}
// attack: flat damage
A('flat_phys', 'prefix', 'Keen-edged', 'flatPhys', 'Physical Damage', 'flat', ['wpn'], 100, 'flat', 2, 4, ['damage', 'physical']);
A('flat_ember', 'prefix', 'Smouldering', 'flatEmber', 'Ember Damage', 'flat', ['wpn', 'gloves', 'ring', 'amulet'], 70, 'flat', 2, 4, ['damage', 'ember']);
A('flat_frost', 'prefix', 'Rimed', 'flatFrost', 'Frost Damage', 'flat', ['wpn', 'gloves', 'ring', 'amulet'], 60, 'flat', 2, 4, ['damage', 'frost']);
A('flat_blight', 'prefix', 'Fester-touched', 'flatBlight', 'Blight Damage', 'flat', ['wpn', 'gloves', 'ring', 'amulet'], 60, 'flat', 2, 4, ['damage', 'blight']);
A('inc_phys', 'prefix', 'Brutal', 'dmgPhysPct', '% increased Physical Damage', 'pct', ['wpn', 'gloves', 'belt', 'off'], 90, 'pct', 8, 14, ['damage', 'physical']);
A('inc_ember', 'prefix', 'Cinderlit', 'dmgEmberPct', '% increased Ember Damage', 'pct', ['wpn', 'amulet', 'ring', 'chest', 'head'], 80, 'pct', 8, 14, ['damage', 'ember']);
A('inc_frost', 'prefix', 'Hoarfrost', 'dmgFrostPct', '% increased Frost Damage', 'pct', ['wpn', 'amulet', 'ring', 'chest', 'head'], 55, 'pct', 8, 14, ['damage', 'frost']);
A('inc_blight', 'prefix', 'Wasting', 'dmgBlightPct', '% increased Blight Damage', 'pct', ['wpn', 'amulet', 'ring', 'chest', 'head'], 55, 'pct', 8, 14, ['damage', 'blight']);
A('inc_melee', 'prefix', 'Crushing', 'dmgMeleePct', '% increased Melee Damage', 'pct', ['wpn', 'gloves', 'off', 'chest'], 70, 'pct', 8, 14, ['damage', 'melee'], 'cinder');
A('inc_proj', 'prefix', 'Fletched', 'dmgProjPct', '% increased Projectile Damage', 'pct', ['wpn', 'gloves', 'off', 'amulet'], 70, 'pct', 8, 14, ['damage', 'projectile'], 'ranger');
A('inc_area', 'prefix', 'Sprawling', 'dmgAreaPct', '% increased Area Damage', 'pct', ['amulet', 'chest', 'head', 'belt'], 60, 'pct', 8, 14, ['damage', 'area']);
A('inc_all', 'prefix', 'Ruinous', 'dmgPct', '% increased Damage', 'pct', ['amulet', 'ring', 'belt'], 50, 'pct', 5, 9, ['damage']);
A('crit_chance', 'suffix', 'of Precision', 'critChance', '% Critical Chance', 'dec', ['ring', 'amulet', 'gloves', 'wpn', 'head'], 70, 'small', 1.5, 3, ['crit']);
A('crit_dmg', 'suffix', 'of Ruin', 'critDamage', '% Critical Damage', 'pct', ['amulet', 'gloves', 'ring', 'wpn'], 60, 'pct', 10, 20, ['crit']);
A('speed', 'suffix', 'of Haste', 'speedPct', '% Attack and Cast Speed', 'pct', ['gloves', 'wpn', 'belt', 'boots'], 60, 'small', 4, 7, ['speed']);
A('cdr', 'suffix', 'of Recall', 'cdrPct', '% Cooldown Recovery', 'pct', ['belt', 'boots', 'head', 'amulet'], 45, 'small', 4, 8, ['cooldown']);
A('ailment', 'suffix', 'of Affliction', 'ailmentChance', '% Ailment Chance', 'pct', ['wpn', 'gloves', 'amulet', 'ring'], 50, 'pct', 5, 9, ['ailment']);
// defence
A('armor_flat', 'prefix', 'Plated', 'armor', 'Armor', 'flat', ['head', 'chest', 'gloves', 'boots', 'off', 'belt'], 100, 'flat', 8, 14, ['defence']);
A('armor_pct', 'prefix', 'Bulwarked', 'armorPct', '% increased Armor', 'pct', ['chest', 'head', 'off', 'belt'], 70, 'pct', 8, 14, ['defence']);
A('hp_flat', 'prefix', 'Hale', 'maxHp', 'Maximum Health', 'flat', ['chest', 'belt', 'head', 'boots', 'amulet', 'ring'], 100, 'flat', 12, 20, ['life']);
A('hp_pct', 'prefix', 'Stalwart', 'maxHpPct', '% increased Maximum Health', 'pct', ['chest', 'belt'], 40, 'small', 3, 5, ['life']);
A('focus_flat', 'prefix', 'Attuned', 'maxFocus', 'Maximum Focus', 'flat', ['head', 'amulet', 'ring', 'belt', 'off'], 70, 'flat', 7, 12, ['focus']);
A('res_ember', 'suffix', 'of Cinderward', 'resEmber', '% Ember Resistance', 'pct', ['chest', 'head', 'boots', 'belt', 'ring', 'off'], 70, 'res', 7, 12, ['resist']);
A('res_frost', 'suffix', 'of Thawing', 'resFrost', '% Frost Resistance', 'pct', ['chest', 'head', 'boots', 'belt', 'ring', 'off'], 70, 'res', 7, 12, ['resist']);
A('res_blight', 'suffix', 'of Purity', 'resBlight', '% Blight Resistance', 'pct', ['chest', 'head', 'boots', 'belt', 'ring', 'off'], 70, 'res', 7, 12, ['resist']);
A('res_all', 'suffix', 'of the Warden', 'resAll', '% All Resistances', 'pct', ['ring', 'amulet', 'belt'], 30, 'small', 4, 6, ['resist']);
A('thorns', 'suffix', 'of Retribution', 'thorns', 'Ember Damage Reflected to Attackers', 'flat', ['chest', 'off', 'boots', 'belt'], 45, 'flat', 3, 6, ['retaliation']);
A('block', 'suffix', 'of Parrying', 'blockChance', '% Block Chance', 'pct', ['off'], 60, 'small', 3, 6, ['block'], 'cinder');
A('ail_res', 'suffix', 'of Resolve', 'ailmentResist', '% Ailment Resistance', 'pct', ['chest', 'belt', 'boots', 'head'], 40, 'pct', 8, 14, ['defence']);
// attributes
A('attr_might', 'suffix', 'of Might', 'might', 'Might', 'flat', ['wpn', 'chest', 'gloves', 'ring', 'amulet', 'head', 'belt'], 70, 'attr', 3, 5, ['attribute']);
A('attr_finesse', 'suffix', 'of Finesse', 'finesse', 'Finesse', 'flat', ['wpn', 'chest', 'gloves', 'ring', 'amulet', 'boots', 'belt'], 70, 'attr', 3, 5, ['attribute']);
A('attr_will', 'suffix', 'of Will', 'will', 'Will', 'flat', ['wpn', 'head', 'ring', 'amulet', 'gloves', 'belt'], 70, 'attr', 3, 5, ['attribute']);
A('attr_vigor', 'suffix', 'of Vigor', 'vigor', 'Vigor', 'flat', ['chest', 'belt', 'boots', 'ring', 'amulet', 'head'], 70, 'attr', 3, 5, ['attribute']);
// utility
A('move', 'suffix', 'of the Fleet', 'moveSpeedPct', '% Movement Speed', 'pct', ['boots'], 80, 'small', 4, 8, ['mobility']);
A('potion', 'suffix', 'of Remedy', 'potionPotency', '% Potion Potency', 'pct', ['belt', 'gloves', 'boots', 'chest'], 50, 'pct', 8, 16, ['potion']);
A('hp_kill', 'suffix', 'of Spoils', 'hpOnKill', 'Health on Kill', 'flat', ['head', 'amulet', 'ring', 'gloves'], 40, 'flat', 2, 4, ['sustain']);
A('focus_hit', 'suffix', 'of Rhythm', 'focusOnHit', 'Focus on Hit', 'dec', ['gloves', 'ring', 'wpn', 'belt'], 55, 'small', 0.6, 1.2, ['focus']);
A('hp_regen', 'suffix', 'of Mending', 'hpRegen', 'Health Regenerated per Second', 'dec', ['chest', 'belt', 'boots'], 40, 'small', 0.6, 1.2, ['sustain']);
A('focus_regen', 'suffix', 'of Composure', 'focusRegen', 'Focus Regenerated per Second', 'dec', ['head', 'amulet', 'belt'], 45, 'small', 0.4, 0.9, ['focus']);
A('gold', 'suffix', 'of Plunder', 'goldFind', '% Gold Found', 'pct', ['boots', 'ring', 'amulet'], 40, 'pct', 8, 15, ['utility']);
A('evade_rec', 'suffix', 'of Quickstep', 'evadeRec', '% Evasive Step Recovery', 'pct', ['boots', 'belt', 'chest'], 45, 'pct', 8, 15, ['mobility']);
// class synergies
A('burn_dmg', 'prefix', 'Kindling', 'burnDmgPct', '% increased Burning Damage', 'pct', ['wpn', 'off', 'amulet', 'ring'], 55, 'pct', 10, 18, ['burn', 'ember'], 'cinder');
A('heat_gain', 'suffix', 'of Embers', 'heatGain', '% increased Heat Gained', 'pct', ['chest', 'off', 'head', 'amulet'], 50, 'pct', 8, 14, ['heat'], 'cinder');
A('mark_dmg', 'prefix', 'Tracing', 'markDmgPct', '% increased Trace Detonation Damage', 'pct', ['wpn', 'off', 'amulet', 'gloves'], 55, 'pct', 10, 18, ['mark'], 'ranger');
A('trap_dmg', 'prefix', 'Snaring', 'trapDmgPct', '% increased Trap and Pool Damage', 'pct', ['belt', 'gloves', 'boots', 'off'], 55, 'pct', 10, 18, ['trap'], 'ranger');
A('rank_class_cinder', 'suffix', 'of the Vow', 'rankAll', 'to Rank of all Cinder Vow Skills', 'flat', ['amulet', 'head', 'wpn'], 12, 'small', 1, 1, ['rank'], 'cinder');
A('rank_class_ranger', 'suffix', 'of the Veil', 'rankAll', 'to Rank of all Veil Ranger Skills', 'flat', ['amulet', 'head', 'wpn'], 12, 'small', 1, 1, ['rank'], 'ranger', 'rankAll_r');

export const AFFIX_BY_ID: Record<string, AffixDef> = Object.fromEntries(AFFIXES.map((a) => [a.id, a]));

// ---------------------------------------------------------------- relics
export interface RelicDef {
  id: string;
  name: string;
  base: string; // base id it appears as
  cls?: ClassId;
  power: string; // tooltip
  hook: string;
  fixed: { stat: string; v: number }[];
  extra: [number, number]; // random supporting affix count
}
export const RELICS: RelicDef[] = [
  { id: 'cinderbrand', name: 'Cinderbrand', base: 'mace_3', cls: 'cinder', power: 'Critical hits detonate in a small Ember burst (60% of weapon damage).', hook: 'critBurst', fixed: [{ stat: 'dmgEmberPct', v: 22 }, { stat: 'critChance', v: 4 }], extra: [2, 3] },
  { id: 'gravetoll', name: 'Gravetoll', base: 'maul_3', cls: 'cinder', power: 'Slain enemies have a 25% chance to release a Blight nova.', hook: 'killNova', fixed: [{ stat: 'dmgPhysPct', v: 26 }, { stat: 'dmgBlightPct', v: 14 }], extra: [2, 3] },
  { id: 'bellwall', name: 'Bellwall Bulwark', base: 'shield_3', cls: 'cinder', power: 'Blocking an attack releases a shockwave that staggers nearby enemies.', hook: 'blockWave', fixed: [{ stat: 'blockChance', v: 10 }, { stat: 'armorPct', v: 22 }], extra: [2, 3] },
  { id: 'veilstring', name: 'Veilstring of Lost Hours', base: 'bow_3', cls: 'ranger', power: 'When a marked enemy dies, its Trace marks spread to two nearby enemies.', hook: 'markSpread', fixed: [{ stat: 'dmgProjPct', v: 20 }, { stat: 'markDmgPct', v: 25 }], extra: [2, 3] },
  { id: 'hushquiver', name: 'Hushquiver', base: 'quiver_3', cls: 'ranger', power: 'Evasive Step leaves a Blight trail that damages and slows enemies.', hook: 'evadeTrail', fixed: [{ stat: 'dmgProjPct', v: 14 }, { stat: 'trapDmgPct', v: 18 }], extra: [2, 3] },
  { id: 'stareye', name: 'Eye of the Buried Star', base: 'amulet_4', power: '+1 Rank to all active skills. Critical hits grant 3 Focus.', hook: 'rankAllActive', fixed: [{ stat: 'dmgPct', v: 12 }, { stat: 'critDamage', v: 25 }], extra: [2, 3] },
  { id: 'tollbelt', name: 'Tollbell Girdle', base: 'belt_3', power: 'Drinking a potion releases a Frost pulse that slows nearby enemies.', hook: 'potionPulse', fixed: [{ stat: 'maxHp', v: 40 }, { stat: 'potionPotency', v: 25 }], extra: [2, 3] },
  { id: 'heartfurnace', name: 'Heartfurnace Hauberk', base: 'chest_h3', power: 'Falling below 35% health grants 30% damage reduction for 5s (30s cooldown).', hook: 'lastStand', fixed: [{ stat: 'armorPct', v: 20 }, { stat: 'resEmber', v: 20 }], extra: [2, 3] },
];
export const RELIC_BY_ID: Record<string, RelicDef> = Object.fromEntries(RELICS.map((r) => [r.id, r]));

// ---------------------------------------------------------------- potions
export const POTIONS: Record<PotionKind, { name: string; color: string; price: number; desc: string }> = {
  health: { name: 'Crimson Draught', color: '#d8404c', price: 22, desc: 'Restores 38% of maximum health (min 60).' },
  focus: { name: 'Azure Tincture', color: '#4a8cff', price: 18, desc: 'Restores 55% of maximum Focus.' },
  cleanse: { name: 'Pale Salve', color: '#e8eef2', price: 16, desc: 'Cleanses burning, blight, slows and roots, and grants brief resolve.' },
  tonic: { name: 'Gilded Tonic', color: '#e8b84a', price: 26, desc: 'Grants +25% to all resistances for 20 seconds.' },
};
export const POTION_BASE_CAP = 5;
