// shared-content: the 32-item shop (6 starters, 10 components, 12 completed, 2 boot upgrades,
// 2 consumables) and the six universal Talents.

export type ItemCat = 'attack' | 'ability' | 'defense' | 'movement' | 'support';
export type ItemTier = 'starter' | 'component' | 'completed' | 'boots' | 'consumable';

export interface ItemStats {
  hp?: number;
  mana?: number;
  hpRegen?: number;
  manaRegen?: number;
  ad?: number;
  ap?: number;
  as?: number; // percent
  armor?: number;
  ward?: number;
  speed?: number; // flat m/s
  haste?: number;
  crit?: number; // percent
  armorPen?: number; // percent
  wardPen?: number; // percent
  lifesteal?: number; // percent
  healPower?: number; // percent
}

export interface ItemDef {
  id: string;
  name: string;
  tier: ItemTier;
  cat: ItemCat;
  cost: number; // total cost
  from?: string[];
  stats: ItemStats;
  passive?: string; // human text; behaviour keyed by item id in the sim
  active?: { cd: number; desc: string };
  glyph: string; // icon shape id
}

const I = (d: ItemDef): ItemDef => d;

export const ITEM_LIST: ItemDef[] = [
  // --- starters -------------------------------------------------------------------------
  I({ id: 'masons_chisel', name: "Mason's Chisel", tier: 'starter', cat: 'defense', cost: 400, stats: { hp: 90, armor: 4, hpRegen: 2 }, passive: 'Sturdy start for front-liners.', glyph: 'chisel' }),
  I({ id: 'couriers_satchel', name: "Courier's Satchel", tier: 'starter', cat: 'attack', cost: 400, stats: { ad: 7, hp: 40, lifesteal: 4 }, glyph: 'satchel' }),
  I({ id: 'moth_lantern', name: 'Moth Lantern', tier: 'starter', cat: 'support', cost: 400, stats: { hp: 60, ap: 8, manaRegen: 1.5 }, passive: 'Stipend: +0.6 gold per second.', glyph: 'lantern' }),
  I({ id: 'reedcutters_fang', name: "Reedcutter's Fang", tier: 'starter', cat: 'attack', cost: 400, stats: { ad: 5, hpRegen: 1 }, passive: 'Basic attacks deal +25 damage to monsters and heal 8 health per monster hit.', glyph: 'fang' }),
  I({ id: 'exiles_inkpot', name: "Exile's Inkpot", tier: 'starter', cat: 'ability', cost: 400, stats: { ap: 14, mana: 60, manaRegen: 1 }, glyph: 'inkpot' }),
  I({ id: 'glass_shiv', name: 'Glass Shiv', tier: 'starter', cat: 'attack', cost: 400, stats: { ad: 6, as: 8, speed: 0.1 }, glyph: 'shiv' }),
  // --- components -----------------------------------------------------------------------
  I({ id: 'trail_boots', name: 'Trail Boots', tier: 'component', cat: 'movement', cost: 300, stats: { speed: 0.35 }, glyph: 'boot' }),
  I({ id: 'brass_edge', name: 'Brass Edge', tier: 'component', cat: 'attack', cost: 350, stats: { ad: 10 }, glyph: 'blade' }),
  I({ id: 'hunters_string', name: "Hunter's String", tier: 'component', cat: 'attack', cost: 300, stats: { as: 15 }, glyph: 'string' }),
  I({ id: 'keen_splinter', name: 'Keen Splinter', tier: 'component', cat: 'attack', cost: 400, stats: { crit: 12 }, glyph: 'splinter' }),
  I({ id: 'glow_shard', name: 'Glow Shard', tier: 'component', cat: 'ability', cost: 400, stats: { ap: 20 }, glyph: 'shard' }),
  I({ id: 'scribes_lens', name: "Scribe's Lens", tier: 'component', cat: 'ability', cost: 350, stats: { haste: 10 }, glyph: 'lens' }),
  I({ id: 'wellspring_vial', name: 'Wellspring Vial', tier: 'component', cat: 'support', cost: 350, stats: { mana: 120, manaRegen: 1.5 }, glyph: 'vial' }),
  I({ id: 'stone_token', name: 'Stone Token', tier: 'component', cat: 'defense', cost: 380, stats: { hp: 150 }, glyph: 'token' }),
  I({ id: 'plate_scrap', name: 'Plate Scrap', tier: 'component', cat: 'defense', cost: 300, stats: { armor: 15 }, glyph: 'plate' }),
  I({ id: 'mist_thread', name: 'Mist Thread', tier: 'component', cat: 'defense', cost: 300, stats: { ward: 15 }, glyph: 'thread' }),
  // --- completed ------------------------------------------------------------------------
  I({ id: 'sunspoke_bow', name: 'Sunspoke Bow', tier: 'completed', cat: 'attack', cost: 1300, from: ['hunters_string', 'brass_edge'], stats: { ad: 15, as: 35 }, passive: 'Spoke: every third basic attack fires a bolt at another nearby enemy for 40% AD.', glyph: 'bow' }),
  I({ id: 'rivenwright_maul', name: 'Rivenwright Maul', tier: 'completed', cat: 'attack', cost: 1450, from: ['brass_edge', 'stone_token'], stats: { ad: 30, hp: 200, armorPen: 25 }, glyph: 'maul' }),
  I({ id: 'cinderfang', name: 'Cinderfang', tier: 'completed', cat: 'attack', cost: 1450, from: ['brass_edge', 'keen_splinter'], stats: { ad: 28, crit: 25 }, passive: 'Critical strikes deal 175% damage.', glyph: 'fangblade' }),
  I({ id: 'tidecaller_glaive', name: 'Tidecaller Glaive', tier: 'completed', cat: 'attack', cost: 1400, from: ['brass_edge', 'hunters_string'], stats: { ad: 22, as: 15, lifesteal: 12 }, glyph: 'glaive' }),
  I({ id: 'quiet_index', name: 'Quiet Index', tier: 'completed', cat: 'ability', cost: 1400, from: ['glow_shard', 'scribes_lens'], stats: { ap: 45, haste: 15 }, passive: 'Long Reach: an ability that hits a hero from 8 m or farther refunds 12% of its cooldown (once per cast).', glyph: 'index' }),
  I({ id: 'aetherlens', name: 'Aetherlens', tier: 'completed', cat: 'ability', cost: 1500, from: ['glow_shard', 'glow_shard'], stats: { ap: 70, wardPen: 25 }, glyph: 'aetherlens' }),
  I({ id: 'wickfire_censer', name: 'Wickfire Censer', tier: 'completed', cat: 'ability', cost: 1400, from: ['glow_shard', 'stone_token'], stats: { ap: 40, hp: 220 }, passive: 'Wickfire: ability damage burns heroes for 1.5% of their max health per second for 3 s.', glyph: 'censer' }),
  I({ id: 'kilnheart_plate', name: 'Kilnheart Plate', tier: 'completed', cat: 'defense', cost: 1300, from: ['plate_scrap', 'stone_token'], stats: { hp: 280, armor: 35 }, passive: 'Kiln: each physical hit taken grants +4 armor for 4 s (max 6 stacks).', glyph: 'cuirass' }),
  I({ id: 'mistward_mantle', name: 'Mistward Mantle', tier: 'completed', cat: 'defense', cost: 1300, from: ['mist_thread', 'stone_token'], stats: { hp: 260, ward: 38, hpRegen: 4 }, glyph: 'mantle' }),
  I({ id: 'stonewake_girdle', name: 'Stonewake Girdle', tier: 'completed', cat: 'defense', cost: 1400, from: ['stone_token', 'stone_token'], stats: { hp: 480 }, passive: 'Wake: out of combat for 5 s, regenerate 1.5% max health per second.', glyph: 'girdle' }),
  I({ id: 'beacon_loom', name: 'Beacon Loom', tier: 'completed', cat: 'support', cost: 1200, from: ['wellspring_vial', 'scribes_lens'], stats: { ap: 25, mana: 150, manaRegen: 2.5, haste: 10, healPower: 12 }, passive: 'Beacon: shielding an ally reveals the area around them for 3 s.', glyph: 'loom' }),
  I({ id: 'null_bell', name: 'Null Bell', tier: 'completed', cat: 'support', cost: 1200, from: ['mist_thread', 'wellspring_vial'], stats: { hp: 150, ward: 25, mana: 150, manaRegen: 2 }, active: { cd: 90, desc: 'Cleanse stuns, roots, slows and silences from yourself and the nearest ally within 6 m. Cannot remove airborne.' }, glyph: 'bell' }),
  // --- boots ----------------------------------------------------------------------------
  I({ id: 'riverglass_boots', name: 'Riverglass Boots', tier: 'boots', cat: 'movement', cost: 750, from: ['trail_boots'], stats: { speed: 0.55 }, passive: 'Current: out of combat, +6% move speed (+20% while wading the river).', glyph: 'boot2' }),
  I({ id: 'ironroot_greaves', name: 'Ironroot Greaves', tier: 'boots', cat: 'movement', cost: 800, from: ['trail_boots'], stats: { speed: 0.45, armor: 12, ward: 12 }, passive: 'Rooted: slows on you are 25% weaker.', glyph: 'boot3' }),
  // --- consumables ----------------------------------------------------------------------
  I({ id: 'amber_draught', name: 'Amber Draught', tier: 'consumable', cat: 'support', cost: 50, stats: {}, active: { cd: 1, desc: 'Restore 140 health over 8 s. Stacks to 3.' }, glyph: 'potion' }),
  I({ id: 'spark_phial', name: 'Spark Phial', tier: 'consumable', cat: 'support', cost: 50, stats: {}, active: { cd: 1, desc: 'Restore 110 mana over 8 s. Stacks to 3.' }, glyph: 'phial' }),
];

export const ITEMS: Record<string, ItemDef> = Object.fromEntries(ITEM_LIST.map((i) => [i.id, i]));
export const SELL_RATIO = 0.65;
export const INVENTORY_SLOTS = 6;
export const CONSUMABLE_STACK = 3;

export const STAT_LABEL: Record<keyof ItemStats, string> = {
  hp: 'Health',
  mana: 'Mana',
  hpRegen: 'Health regen /s',
  manaRegen: 'Mana regen /s',
  ad: 'Attack damage',
  ap: 'Ability power',
  as: '% Attack speed',
  armor: 'Armor',
  ward: 'Ward',
  speed: 'Move speed',
  haste: 'Haste',
  crit: '% Critical chance',
  armorPen: '% Armor penetration',
  wardPen: '% Ward penetration',
  lifesteal: '% Lifesteal',
  healPower: '% Heal & shield power',
};

export interface InvSlot {
  id: string;
  n: number; // stack count (consumables)
}

/** Price of buying `id` given what is already owned (components are consumed). */
export function buyPlan(inv: (InvSlot | null)[], id: string): { cost: number; consume: number[] } {
  const def = ITEMS[id];
  const consume: number[] = [];
  let cost = def.cost;
  if (def.from) {
    const used = new Set<number>();
    for (const c of def.from) {
      const idx = inv.findIndex((s, i) => s && s.id === c && !used.has(i));
      if (idx >= 0) {
        used.add(idx);
        consume.push(idx);
        cost -= ITEMS[c].cost;
      }
    }
  }
  return { cost, consume };
}

// --- Talents -------------------------------------------------------------------------------

export type TalentId = 'skyhop' | 'mend' | 'bulwark' | 'surge' | 'smolder' | 'sunder';
export interface TalentDef {
  id: TalentId;
  name: string;
  cd: number;
  target: 'point' | 'self' | 'unit';
  range: number;
  desc: string;
  glyph: string;
  color: number;
}

export const TALENTS: Record<TalentId, TalentDef> = {
  skyhop: { id: 'skyhop', name: 'Skyhop', cd: 120, target: 'point', range: 4.5, desc: 'Blink up to 4.5 m toward the cursor.', glyph: 'hop', color: 0xffe07a },
  mend: { id: 'mend', name: 'Mend', cd: 110, target: 'self', range: 6, desc: 'Heal yourself and the nearest allied hero within 6 m for 90 (+15 per level).', glyph: 'mend', color: 0x8be28b },
  bulwark: { id: 'bulwark', name: 'Bulwark', cd: 100, target: 'self', range: 0, desc: 'Gain a shield of 110 (+20 per level) for 3 s.', glyph: 'shield', color: 0x7fd8ff },
  surge: { id: 'surge', name: 'Surge', cd: 90, target: 'self', range: 0, desc: 'Gain 35% move speed for 3 s.', glyph: 'surge', color: 0xa0f0e0 },
  smolder: { id: 'smolder', name: 'Smolder', cd: 110, target: 'unit', range: 6, desc: 'Burn an enemy hero for 80 (+20 per level) pure damage over 4 s and reveal them.', glyph: 'flame', color: 0xff7a4a },
  sunder: { id: 'sunder', name: 'Sunder', cd: 45, target: 'unit', range: 5, desc: 'Strike a monster or minion for 300 (+40 per level) pure damage.', glyph: 'sunder', color: 0xd9a0ff },
};
export const TALENT_IDS = Object.keys(TALENTS) as TalentId[];
