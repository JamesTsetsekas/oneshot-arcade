import type { ClassId } from '../entity-combat/types';

export interface BaseDef {
  id: string; name: string; slot: 'main' | 'off' | 'head' | 'chest' | 'gloves' | 'boots' | 'belt' | 'amulet' | 'ring';
  type: string; cls?: ClassId; twoHand?: boolean; w: number; h: number; ilvl: number; tier: number;
  dmg?: [number, number]; aps?: number; armor?: number; block?: number; implicit?: [string, number];
}
const TIER_ILVL = [1, 5, 9, 13, 17];
const bases: BaseDef[] = [];
function fam(type: string, slot: BaseDef['slot'], names: string[], w: number, h: number, extra: (t: number) => Partial<BaseDef>, cls?: ClassId, ilvls = TIER_ILVL) {
  names.forEach((name, t) => bases.push({ id: `${type}${t + 1}`, name, slot, type, cls, w, h, ilvl: ilvls[t], tier: t + 1, ...extra(t) }));
}
const WD: [number, number][] = [[5, 9], [9, 15], [14, 23], [21, 34], [30, 48]];
const scaleD = (t: number, m: number): [number, number] => [Math.round(WD[t][0] * m), Math.round(WD[t][1] * m)];
fam('mace', 'main', ['Ashwood Cudgel', 'Toll Mace', 'Brass Censer-Mace', 'Vigil Morningstar', 'Star-Iron Scepter'], 1, 2, (t) => ({ dmg: scaleD(t, 1), aps: 1.15 }), 'cinder');
fam('maul', 'main', ['Cinder Maul', 'Gravedigger Sledge', 'Bellfounder Hammer', 'Oathbreaker Maul', 'Furnace Ram'], 2, 3, (t) => ({ dmg: scaleD(t, 1.75), aps: 0.9, twoHand: true }), 'cinder');
fam('shield', 'off', ['Plank Ward', 'Pilgrim Targe', 'Brassbound Bulwark', 'Vigil Tower', 'Star-Metal Aegis'], 2, 3, (t) => ({ armor: 8 + t * 9, block: 14 + t * 2 }), 'cinder');
fam('wristbow', 'main', ['Reed Wristbow', 'Hunter Wristbow', 'Sinew Repeater', 'Veilwork Wristbow', 'Starstring Repeater'], 1, 2, (t) => ({ dmg: scaleD(t, 0.92), aps: 1.4 }), 'ranger');
fam('longbow', 'main', ['Ash Longbow', 'Horn Recurve', 'Marcher Warbow', 'Greywatch Greatbow', 'Horizon Bow'], 2, 3, (t) => ({ dmg: scaleD(t, 1.7), aps: 0.95, twoHand: true }), 'ranger');
fam('quiver', 'off', ['Hide Quiver', 'Marcher Quiver', 'Bone-Clasp Quiver', 'Veiled Quiver', 'Star-Fletch Quiver'], 1, 2, (t) => ({ implicit: ['critChance', 3 + t] as [string, number] }), 'ranger');
const AI = [1, 6, 11, 16];
const HA = [9, 16, 25, 36];
const armorFam = (slotName: BaseDef['slot'], mul: number, heavy: string[], light: string[], w: number, h: number, imp: [string, number]) => {
  fam('heavy_' + slotName, slotName, heavy, w, h, (t) => ({ armor: Math.round(HA[t] * mul) }), undefined, AI);
  fam('light_' + slotName, slotName, light, w, h, (t) => ({ armor: Math.round(HA[t] * mul * 0.55), implicit: [imp[0], imp[1] * (t + 1)] as [string, number] }), undefined, AI);
};
armorFam('head', 0.8, ['Dented Helm', 'Toll Sallet', 'Brass Casque', 'Vigil Greathelm'], ['Ash Hood', 'Marcher Cowl', 'Veil Mask', 'Mothsilk Hood'], 1, 2, ['focus', 5]);
armorFam('chest', 1.5, ['Scrap Hauberk', 'Toll Brigandine', 'Brass Cuirass', 'Vigil Plate'], ['Soot Jerkin', 'Marcher Leathers', 'Veil Harness', 'Mothsilk Coat'], 2, 3, ['focusRegen', 0.5]);
armorFam('gloves', 0.6, ['Scrap Gauntlets', 'Toll Mitts', 'Brass Gauntlets', 'Vigil Grips'], ['Wrapped Hands', 'Marcher Gloves', 'Veil Bracers', 'Mothsilk Gloves'], 1, 2, ['attackSpeed', 2]);
armorFam('boots', 0.6, ['Scrap Sabatons', 'Toll Greaves', 'Brass Treads', 'Vigil Greaves'], ['Ash Wraps', 'Marcher Boots', 'Veil Striders', 'Mothsilk Boots'], 1, 2, ['moveSpeed', 2]);
fam('belt', 'belt', ['Rope Girdle', 'Marcher Belt', 'Brass-Link Girdle', 'Vigil Cincture'], 1, 2, (t) => ({ implicit: ['hp', 8 + t * 10] as [string, number] }), undefined, AI);
fam('amulet', 'amulet', ['Soot Charm', 'Bell Pendant', 'Brass Reliquary', 'Star Shard Locket'], 1, 1, (t) => ({ implicit: ['resAll', 2 + t * 2] as [string, number] }), undefined, AI);
fam('ring', 'ring', ['Iron Band', 'Toll Ring', 'Brass Seal', 'Star-Metal Loop'], 1, 1, (t) => ({ implicit: ['focus', 4 + t * 4] as [string, number] }), undefined, AI);
export const BASES = bases;
export const BASE: Record<string, BaseDef> = Object.fromEntries(bases.map((b) => [b.id, b]));

export interface AffixDef { id: string; name: string; pos: 'p' | 's'; stat: string; min: number; max: number; slots: string[]; w: number; group: string; cls?: ClassId; text: string; flat?: boolean }
const af = (id: string, name: string, pos: 'p' | 's', stat: string, min: number, max: number, slots: string, text: string, w = 10, cls?: ClassId, group?: string, flat?: boolean): AffixDef =>
  ({ id, name, pos, stat, min, max, slots: slots.split(','), w, group: group ?? stat, cls, text, flat });
/** Affix pool. `group` is the incompatibility tag: an item never rolls two affixes from the same group. */
export const AFFIXES: AffixDef[] = [
  af('brutal', 'Brutal', 'p', 'flatDmg', 1, 3, 'weapon', '+{v} weapon damage'),
  af('searing', 'Searing', 'p', 'addEmber', 2, 4, 'weapon,gloves,jewel', '+{v} Ember damage on hit', 8, undefined, 'added'),
  af('rimed', 'Rimed', 'p', 'addFrost', 2, 4, 'weapon,gloves,jewel', '+{v} Frost damage on hit (may Chill)', 7, undefined, 'added'),
  af('festering', 'Festering', 'p', 'addBlight', 2, 4, 'weapon,gloves,jewel', '+{v} Blight damage on hit', 7, undefined, 'added'),
  af('sturdy', 'Sturdy', 'p', 'armor', 5, 10, 'armor,shield,belt', '+{v} armor'),
  af('reinforced', 'Reinforced', 'p', 'armorPct', 6, 10, 'armor,shield', '+{v}% armor', 6),
  af('hale', 'Hale', 'p', 'hp', 10, 18, 'armor,belt,jewel,shield', '+{v} Health', 12),
  af('vital', 'Vital', 'p', 'hpPct', 3, 5, 'chest,belt,amulet', '+{v}% Health', 5, undefined, 'hpPct', true),
  af('focused', 'Focused', 'p', 'focus', 6, 10, 'head,jewel,quiver,belt', '+{v} Focus'),
  af('mighty', 'Mighty', 'p', 'might', 2, 4, 'any', '+{v} Might', 8, undefined, 'attr'),
  af('deft', 'Deft', 'p', 'finesse', 2, 4, 'any', '+{v} Finesse', 8, undefined, 'attr'),
  af('willful', 'Willful', 'p', 'will', 2, 4, 'any', '+{v} Will', 7, undefined, 'attr'),
  af('stout', 'Stout', 'p', 'vigor', 2, 4, 'any', '+{v} Vigor', 8, undefined, 'attr'),
  af('swift', 'Swift', 'p', 'attackSpeed', 4, 6, 'weapon,gloves,quiver', '+{v}% attack speed', 7, undefined, undefined, true),
  af('keen', 'Keen', 'p', 'critChance', 2, 4, 'weapon,jewel,gloves,quiver', '+{v}% critical chance', 7, undefined, undefined, true),
  af('savage', 'Savage', 'p', 'critDmg', 10, 16, 'weapon,jewel,quiver', '+{v}% critical damage', 6),
  af('fleet', 'Fleet', 'p', 'moveSpeed', 4, 6, 'boots', '+{v}% movement speed', 10, undefined, undefined, true),
  af('warding', 'Warding', 'p', 'resAll', 3, 5, 'shield,amulet,chest', '+{v}% all resistances', 6, undefined, 'res'),
  af('cindered', 'Cindered', 'p', 'resEmber', 8, 12, 'armor,shield,jewel,belt', '+{v}% Ember resistance', 7, undefined, 'res'),
  af('frostward', 'Frostward', 'p', 'resFrost', 8, 12, 'armor,shield,jewel,belt', '+{v}% Frost resistance', 7, undefined, 'res'),
  af('blightward', 'Blightward', 'p', 'resBlight', 8, 12, 'armor,shield,jewel,belt', '+{v}% Blight resistance', 7, undefined, 'res'),
  af('zealous', 'Zealous', 'p', 'meleePct', 6, 10, 'weapon,gloves,ring', '+{v}% melee damage', 8, 'cinder', 'classdmg'),
  af('marksman', "Marksman's", 'p', 'rangedPct', 6, 10, 'weapon,gloves,ring,quiver', '+{v}% ranged damage', 8, 'ranger', 'classdmg'),
  af('trapper', "Trapper's", 'p', 'trapPct', 10, 16, 'quiver,gloves,belt', '+{v}% trap damage', 6, 'ranger'),
  af('smoldering', 'Smoldering', 'p', 'burnPct', 12, 20, 'weapon,gloves,amulet', '+{v}% Burn damage', 6, 'cinder'),
  af('scorching', 'Scorching', 'p', 'emberPct', 6, 10, 'weapon,amulet,ring,head', '+{v}% Ember damage', 6, 'cinder', 'elempct'),
  af('virulent', 'Virulent', 'p', 'blightPct', 6, 10, 'weapon,amulet,ring,head,quiver', '+{v}% Blight damage', 6, 'ranger', 'elempct'),
  af('bulwark', 'of the Bulwark', 's', 'block', 3, 5, 'shield', '+{v}% block chance', 10, 'cinder', undefined, true),
  af('thorns', 'of Thorns', 's', 'thorns', 3, 6, 'shield,chest', '{v} Ember damage to melee attackers', 6, 'cinder'),
  af('mending', 'of Mending', 's', 'potionPct', 8, 14, 'belt,amulet', '+{v}% potion effect', 8),
  af('wellspring', 'of the Wellspring', 's', 'focusRegen', 0.6, 1, 'head,jewel,chest,quiver', '+{v} Focus per second', 7, undefined, undefined, true),
  af('siphoning', 'of Siphoning', 's', 'focusOnHit', 1, 2, 'weapon,ring', '+{v} Focus per hit', 6, undefined, undefined, true),
  af('reaper', 'of the Reaper', 's', 'hpOnKill', 2, 4, 'weapon,gloves,ring', '+{v} Health per kill', 7),
  af('fortune', 'of Fortune', 's', 'goldFind', 10, 18, 'jewel,belt,boots,gloves', '+{v}% gold found', 6),
  af('discovery', 'of Discovery', 's', 'magicFind', 5, 9, 'jewel,head,boots', '+{v}% rarity of items found', 5),
  af('learning', 'of Learning', 's', 'xpPct', 3, 5, 'head,amulet', '+{v}% experience', 4, undefined, undefined, true),
  af('stoking', 'of Stoking', 's', 'heatGain', 10, 16, 'armor,shield', '+{v}% Heat gained', 6, 'cinder'),
  af('stalker', 'of the Stalker', 's', 'traceDmg', 8, 14, 'weapon,quiver,gloves', '+{v}% Trace detonation damage', 7, 'ranger'),
  af('embersend', "of Embers' End", 's', 'dmgVsBurning', 8, 14, 'weapon,ring,gloves', '+{v}% damage to Burning enemies', 6, 'cinder', 'cond'),
  af('snare', 'of the Snare', 's', 'dmgVsSlowed', 8, 14, 'weapon,ring,gloves,quiver', '+{v}% damage to Chilled or Rooted enemies', 6, undefined, 'cond'),
  af('steadiness', 'of Steadiness', 's', 'ailmentRes', 8, 14, 'armor,belt,shield', '+{v}% ailment resistance', 5),
  af('slaying', 'of Slaying', 's', 'dmgPct', 4, 7, 'weapon,ring', '+{v}% damage', 6),
  af('mastery', 'of Mastery', 's', 'skillPct', 5, 8, 'amulet,head,weapon', '+{v}% skill damage', 6),
  af('r_brand', 'of the Brand', 's', 'rank_brand_arc', 1, 1, 'weapon,head', '+{v} to Brand Arc', 3, 'cinder', 'rank', true),
  af('r_ring', 'of the Ring', 's', 'rank_cinder_ring', 1, 1, 'chest,head,amulet', '+{v} to Cinder Ring', 3, 'cinder', 'rank', true),
  af('r_chain', 'of Chains', 's', 'rank_vow_chain', 1, 1, 'gloves,belt', '+{v} to Vow Chain', 3, 'cinder', 'rank', true),
  af('r_volley', 'of Volleys', 's', 'rank_splinter_volley', 1, 1, 'weapon,quiver', '+{v} to Splinter Volley', 3, 'ranger', 'rank', true),
  af('r_ghost', 'of the Ghostline', 's', 'rank_ghostline', 1, 1, 'weapon,head,amulet', '+{v} to Ghostline', 3, 'ranger', 'rank', true),
  af('r_bloom', 'of Blooms', 's', 'rank_snare_bloom', 1, 1, 'gloves,belt,quiver', '+{v} to Snare Bloom', 3, 'ranger', 'rank', true),
  af('evasion', 'of Evasion', 's', 'evadeCdr', 6, 10, 'boots,belt', '+{v}% evade recharge', 7, undefined, undefined, true),
  af('guarding', 'of Guarding', 's', 'guardPct', 10, 16, 'shield,chest,gloves', '+{v}% Guard strength', 5, 'cinder'),
  af('farsight', 'of Farsight', 's', 'farCrit', 3, 5, 'weapon,head,quiver', '+{v}% critical chance beyond 8 m', 5, 'ranger', undefined, true),
];
export const AFFIX: Record<string, AffixDef> = Object.fromEntries(AFFIXES.map((a) => [a.id, a]));

export interface RelicDef { id: string; name: string; base: string; power: string; fixed: [string, number][] }
/** Relics: fixed original special power (implemented as a `relic_<id>` stat flag read by the simulation) plus supporting rolls. */
export const RELICS: RelicDef[] = [
  { id: 'tollbell', name: 'Tollbell Maul', base: 'maul3', power: 'Cinder Ring erupts a second time for 50% damage.', fixed: [['emberPct', 15]] },
  { id: 'emberwake', name: 'Emberwake Greaves', base: 'heavy_boots2', power: 'Bastion Step leaves a burning trail for 3 s.', fixed: [['moveSpeed', 6]] },
  { id: 'covenant', name: 'Covenant Aegis', base: 'shield3', power: 'Blocking releases a Frost pulse that Chills nearby enemies.', fixed: [['block', 5]] },
  { id: 'signet', name: 'Star-Metal Signet', base: 'ring3', power: 'Critical hits restore 5 Focus.', fixed: [['critChance', 4]] },
  { id: 'mothwing', name: 'Mothwing Shroud', base: 'light_chest3', power: 'Evasive step grants Haste (+30% movement) for 2 s.', fixed: [['hp', 30]] },
  { id: 'twinstring', name: 'Twinstring Warbow', base: 'longbow3', power: 'Quickshot looses a second arrow at another enemy within 7 m of the target.', fixed: [['rangedPct', 12]] },
  { id: 'threadcutter', name: 'Threadcutter Quiver', base: 'quiver3', power: 'Trace detonations apply Blight to everything they hit.', fixed: [['traceDmg', 15]] },
  { id: 'archivist', name: "Archivist's Eye", base: 'amulet3', power: '+1 rank to all active skills.', fixed: [['rankAll', 1]] },
];
export const RELIC: Record<string, RelicDef> = Object.fromEntries(RELICS.map((r) => [r.id, r]));

export const RARITY = [
  { name: 'Worn', color: '#b9b4a8', shape: '○' },
  { name: 'Tempered', color: '#6fb4ff', shape: '◇' },
  { name: 'Inscribed', color: '#f2cf5b', shape: '◆' },
  { name: 'Relic', color: '#ff8a4a', shape: '✦' },
];

export const GLYPHS: Record<string, { name: string; weapon: [string, number[]]; armor: [string, number[]]; color: string }> = {
  ember: { name: 'Cinder Glyph', weapon: ['addEmber', [3, 6, 10]], armor: ['resEmber', [6, 10, 15]], color: '#ff7a3a' },
  frost: { name: 'Rime Glyph', weapon: ['addFrost', [3, 6, 10]], armor: ['resFrost', [6, 10, 15]], color: '#9fd8ff' },
  blight: { name: 'Rot Glyph', weapon: ['addBlight', [3, 6, 10]], armor: ['resBlight', [6, 10, 15]], color: '#b36bff' },
  iron: { name: 'Iron Glyph', weapon: ['flatDmg', [2, 4, 7]], armor: ['armor', [8, 15, 24]], color: '#c9c9c9' },
  vigor: { name: 'Vigor Glyph', weapon: ['hp', [12, 24, 40]], armor: ['hp', [12, 24, 40]], color: '#e0564f' },
};
export const glyphInfo = (base: string) => { const [, type, tier] = base.split('_'); return { type, tier: Number(tier), def: GLYPHS[type] }; };
export const glyphStat = (base: string, onWeapon: boolean): [string, number] => {
  const g = glyphInfo(base); const [stat, vals] = onWeapon ? g.def.weapon : g.def.armor; return [stat, vals[g.tier - 1]];
};
export const STAT_TEXT: Record<string, string> = Object.fromEntries(AFFIXES.map((a) => [a.stat, a.text]));
Object.assign(STAT_TEXT, { rankAll: '+{v} to all active skills', focus: '+{v} Focus', hp: '+{v} Health', resAll: '+{v}% all resistances', critChance: '+{v}% critical chance', moveSpeed: '+{v}% movement speed', attackSpeed: '+{v}% attack speed', focusRegen: '+{v} Focus per second' });
export const statText = (stat: string, v: number) => (STAT_TEXT[stat] ?? `+{v} ${stat}`).replace('{v}', String(Math.round(v * 10) / 10));
export const POTIONS = [
  { name: 'Red Draught', desc: 'Restores 40% Health.', color: '#d8433b', price: 18 },
  { name: 'Blue Draught', desc: 'Restores 60% Focus.', color: '#4a8de0', price: 18 },
  { name: 'White Salt', desc: 'Cleanses ailments and grants 3 s immunity.', color: '#e9e6dc', price: 26 },
  { name: 'Gold Tonic', desc: '+25% all resistances for 20 s.', color: '#e8b93c', price: 34 },
];
