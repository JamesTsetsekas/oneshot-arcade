import { ItemDef, TalentDef, TalentId } from './types';

// 32 items: 6 starters, 10 components, 12 completed, 2 boot upgrades, 2 consumables.
// Item `as` stat is BONUS attack speed (fraction, 0.15 = +15%).
const I = (d: ItemDef) => d;
export const ITEM_LIST: ItemDef[] = [
  // ---- starters ----
  I({ id: 's_knife', name: 'Ashgrip Knife', category: 'starter', tags: ['attack'], cost: 400, from: [], stats: { ad: 9, maxHp: 70 }, passive: '+5 damage on basic attacks against minions and monsters.', icon: { shape: 'blade', color: '#d99a5b' } }),
  I({ id: 's_inkwell', name: 'Inkwell Charm', category: 'starter', tags: ['ability'], cost: 400, from: [], stats: { ap: 16, maxHp: 60, manaRegen: 0.8 }, icon: { shape: 'orb', color: '#7a6bff' } }),
  I({ id: 's_buckler', name: "Mason's Buckler", category: 'starter', tags: ['defense'], cost: 450, from: [], stats: { maxHp: 120, hpRegen: 1.5 }, passive: 'Minion attacks against you deal 8 less damage.', icon: { shape: 'shield', color: '#c9b48a' } }),
  I({ id: 's_thread', name: 'Mothsilk Thread', category: 'starter', tags: ['support'], cost: 400, from: [], stats: { maxHp: 60, healPower: 0.06, manaRegen: 0.6 }, passive: 'Earn 1.5 extra gold per second while an allied hero is within 10 m.', icon: { shape: 'ring', color: '#bfe6ff' } }),
  I({ id: 's_lantern', name: 'Bog Lantern', category: 'starter', tags: ['attack'], cost: 400, from: [], stats: { ad: 5, hpRegen: 1 }, passive: 'Deal 50% more damage to monsters and heal 60 on monster kills.', icon: { shape: 'leaf', color: '#9fd36b' } }),
  I({ id: 's_sling', name: 'Copper Sling', category: 'starter', tags: ['attack'], cost: 400, from: [], stats: { as: 0.12, ad: 4, maxHp: 50 }, icon: { shape: 'bow', color: '#d38a4a' } }),
  // ---- components ----
  I({ id: 'c_gear', name: 'Brass Gear', category: 'component', tags: ['attack'], cost: 450, from: [], stats: { ad: 15 }, icon: { shape: 'gear', color: '#d9a640' } }),
  I({ id: 'c_lens', name: 'Lens Shard', category: 'component', tags: ['ability'], cost: 435, from: [], stats: { ap: 25 }, icon: { shape: 'gem', color: '#c06bff' } }),
  I({ id: 'c_rivet', name: 'Iron Rivet', category: 'component', tags: ['defense'], cost: 400, from: [], stats: { armor: 20 }, icon: { shape: 'shield', color: '#9aa4ad' } }),
  I({ id: 'c_ward', name: 'Woven Charm', category: 'component', tags: ['defense'], cost: 400, from: [], stats: { ward: 22 }, icon: { shape: 'ring', color: '#6bc5ff' } }),
  I({ id: 'c_heart', name: 'Heartstone', category: 'component', tags: ['defense'], cost: 400, from: [], stats: { maxHp: 180 }, icon: { shape: 'gem', color: '#ff5d6b' } }),
  I({ id: 'c_spring', name: 'Quickspring', category: 'component', tags: ['attack'], cost: 400, from: [], stats: { as: 0.15 }, icon: { shape: 'gear', color: '#ffd36b' } }),
  I({ id: 'c_sand', name: 'Hourglass Sand', category: 'component', tags: ['ability', 'support'], cost: 450, from: [], stats: { haste: 10 }, icon: { shape: 'potion', color: '#e8cf8a' } }),
  I({ id: 'c_pearl', name: 'Mana Pearl', category: 'component', tags: ['ability'], cost: 350, from: [], stats: { maxMana: 250 }, icon: { shape: 'orb', color: '#5aa8ff' } }),
  I({ id: 'c_whet', name: 'Whetstone', category: 'component', tags: ['attack'], cost: 550, from: [], stats: { crit: 0.15 }, icon: { shape: 'blade', color: '#b8c4cc' } }),
  I({ id: 'c_wraps', name: "Traveler's Wraps", category: 'component', tags: ['movement'], cost: 300, from: [], stats: { ms: 0.25 }, icon: { shape: 'boot', color: '#a88a64' } }),
  // ---- completed ----
  I({ id: 'sunspoke', name: 'Sunspoke Bow', category: 'completed', tags: ['attack'], cost: 2700, from: ['c_spring', 'c_gear', 'c_spring'], stats: { as: 0.35, ad: 20 }, passive: 'Every third basic attack also fires a bolt for 50% damage at another nearby enemy, preferring marked targets.', icon: { shape: 'bow', color: '#ffcc4d' } }),
  I({ id: 'kilnheart', name: 'Kilnheart Plate', category: 'completed', tags: ['defense'], cost: 2600, from: ['c_heart', 'c_rivet'], stats: { maxHp: 350, armor: 35 }, passive: 'Taking physical hits grants +4 Armor per hit for 3 s (max 8 stacks).', icon: { shape: 'shield', color: '#ff7a3d' } }),
  I({ id: 'quietindex', name: 'Quiet Index', category: 'completed', tags: ['ability'], cost: 2800, from: ['c_lens', 'c_sand'], stats: { ap: 70, haste: 15 }, passive: 'Ability hits from more than 7 m away refund 12% of that ability\'s remaining cooldown (once per cast).', icon: { shape: 'book', color: '#8f7bff' } }),
  I({ id: 'beaconloom', name: 'Beacon Loom', category: 'completed', tags: ['support', 'defense'], cost: 2300, from: ['c_heart', 'c_sand'], stats: { maxHp: 200, haste: 15, healPower: 0.15, manaRegen: 1.0 }, passive: 'Shielding an allied hero reveals the area around them (6 m) for 3 s.', icon: { shape: 'ring', color: '#ffe680' } }),
  I({ id: 'nullbell', name: 'Null Bell', category: 'completed', tags: ['defense', 'support'], cost: 2500, from: ['c_ward', 'c_heart'], stats: { ward: 40, maxHp: 200 }, active: { name: 'Toll', cooldown: 90, desc: 'Cleanse slows, roots, stuns and silences from yourself or the nearest allied hero within 6 m. Cannot remove airborne or suppression.' }, icon: { shape: 'bell', color: '#cfe8ff' } }),
  I({ id: 'tideglass', name: 'Tideglass Edge', category: 'completed', tags: ['attack'], cost: 2900, from: ['c_gear', 'c_whet'], stats: { ad: 45, crit: 0.2 }, passive: 'Critical strikes deal 15% more damage.', icon: { shape: 'blade', color: '#5fe0d0' } }),
  I({ id: 'embercodex', name: 'Ember Codex', category: 'completed', tags: ['ability'], cost: 2900, from: ['c_lens', 'c_lens'], stats: { ap: 85, wardPen: 12 }, passive: 'Ability damage burns enemies for 3% of their max health over 2 s.', icon: { shape: 'book', color: '#ff6a3d' } }),
  I({ id: 'cindermaul', name: 'Cinder Maul', category: 'completed', tags: ['attack', 'defense'], cost: 2800, from: ['c_gear', 'c_heart'], stats: { ad: 35, maxHp: 250 }, passive: 'Basic attacks slow by 25% (melee) or 15% (ranged) for 1 s.', icon: { shape: 'gear', color: '#ff8f5a' } }),
  I({ id: 'hollowprism', name: 'Hollow Prism', category: 'completed', tags: ['attack'], cost: 2800, from: ['c_gear', 'c_sand'], stats: { ad: 40, armorPen: 14, haste: 10 }, passive: 'Damaging a hero below 40% health grants 20% movement speed for 1.5 s.', icon: { shape: 'gem', color: '#b8f0ff' } }),
  I({ id: 'wardweave', name: 'Wardweave Mantle', category: 'completed', tags: ['defense'], cost: 2600, from: ['c_ward', 'c_heart'], stats: { ward: 45, maxHp: 250, hpRegen: 2 }, passive: 'The first Arcane damage instance from a hero every 15 s is reduced by 40%.', icon: { shape: 'shield', color: '#6bc5ff' } }),
  I({ id: 'reservoir', name: 'Aether Reservoir', category: 'completed', tags: ['ability', 'defense'], cost: 2700, from: ['c_pearl', 'c_lens'], stats: { ap: 60, maxMana: 400, haste: 10 }, passive: 'Dropping below 30% health grants a shield equal to 15% of current mana for 3 s (60 s cooldown).', icon: { shape: 'orb', color: '#ff6ad5' } }),
  I({ id: 'thornbrass', name: 'Thornbrass Cuirass', category: 'completed', tags: ['defense'], cost: 2500, from: ['c_rivet', 'c_rivet'], stats: { armor: 55, maxHp: 150 }, passive: 'Basic attacks against you deal 12 + 8% of your Armor as Arcane damage to the attacker.', icon: { shape: 'shield', color: '#c9a25a' } }),
  // ---- boots ----
  I({ id: 'riverglass', name: 'Riverglass Boots', category: 'boots', tags: ['movement'], cost: 900, from: ['c_wraps'], stats: { ms: 0.45 }, passive: 'Out of combat in the river: +20% movement speed.', icon: { shape: 'boot', color: '#7fd1ff' } }),
  I({ id: 'ironstep', name: 'Ironstep Boots', category: 'boots', tags: ['movement', 'defense'], cost: 1000, from: ['c_wraps'], stats: { ms: 0.4, armor: 15 }, passive: 'Slows on you are 20% weaker.', icon: { shape: 'boot', color: '#9aa4ad' } }),
  // ---- consumables ----
  I({ id: 'amber', name: 'Amber Draught', category: 'consumable', tags: ['support'], cost: 50, from: [], stats: {}, maxStack: 5, active: { name: 'Drink', cooldown: 1, desc: 'Restore 120 health over 8 s.' }, icon: { shape: 'potion', color: '#ffb347' } }),
  I({ id: 'lantern', name: 'Lantern Ward', category: 'consumable', tags: ['support'], cost: 75, from: [], stats: {}, maxStack: 2, active: { name: 'Place', cooldown: 1, desc: 'Place a ward at a point (6 m) that grants vision for 120 s. Counts toward the team ward cap.' }, icon: { shape: 'ward', color: '#ffe680' } }),
];
export const ITEMS: Record<string, ItemDef> = Object.fromEntries(ITEM_LIST.map((i) => [i.id, i]));

export const SELL_RATIO = 0.65;
export const INVENTORY_SLOTS = 6;

export const TALENTS: Record<TalentId, TalentDef> = {
  phase: { id: 'phase', name: 'Phase Step', cooldown: 150, targeting: 'point', range: 4.5, desc: 'Blink up to 4.5 m toward the cursor.', color: '#c8f6ff' },
  mend: { id: 'mend', name: 'Mend', cooldown: 120, targeting: 'self', range: 8, desc: 'Heal yourself for 80 + 16 per level, and the most injured allied hero within 8 m for half as much.', color: '#ffd36b' },
  scorch: { id: 'scorch', name: 'Scorch Brand', cooldown: 120, targeting: 'unit-enemy', range: 6, desc: 'Brand an enemy hero: 60 + 20 per level Pure damage over 3 s and 40% reduced healing.', color: '#ff6a3d' },
  bulwark: { id: 'bulwark', name: 'Bulwark', cooldown: 100, targeting: 'self', range: 0, desc: 'Gain a shield of 90 + 22 per level for 2.5 s.', color: '#7fd1ff' },
  rush: { id: 'rush', name: 'Tailwind', cooldown: 90, targeting: 'self', range: 0, desc: 'Gain 40% movement speed for 3 s and pass through units.', color: '#b6ff6e' },
  reap: { id: 'reap', name: 'Reaping Spark', cooldown: 60, targeting: 'unit-enemy', range: 5, desc: 'Deal 400 + 25 per level Pure damage to a monster or minion. Cannot target heroes.', color: '#ff6ad5' },
};
export const TALENT_IDS = Object.keys(TALENTS) as TalentId[];

/** Effective cost of buying `id` given owned item ids (uses owned components, shallow recursion). */
export function purchasePlan(id: string, owned: string[]): { cost: number; consume: number[] } {
  const def = ITEMS[id];
  const pool = owned.map((o, i) => ({ o, i, used: false }));
  const consume: number[] = [];
  function price(itemId: string, top: boolean): number {
    const d = ITEMS[itemId];
    if (!top) {
      const have = pool.find((p) => !p.used && p.o === itemId);
      if (have) { have.used = true; consume.push(have.i); return 0; }
    }
    const recipe = d.cost - d.from.reduce((s, f) => s + ITEMS[f].cost, 0);
    return recipe + d.from.reduce((s, f) => s + price(f, false), 0);
  }
  const cost = price(def.id, true);
  return { cost, consume };
}
