import type { AffixDef, BaseItemDef, ClassId, GlyphDef, RelicDef, SlotType, StatBlock, StatId } from "./types";

// ───────────────────────── Base items (82) ─────────────────────────
interface Family {
  kind: string; slot: SlotType; twoHanded?: boolean; classReq?: ClassId; size: [number, number];
  names: string[]; levels: number[];
  stats: (scale: number, tier: number) => { damage?: [number, number]; attackSpeed?: number; implicit: StatBlock };
  maxSockets: number; durability: number; value: number;
}

const FAMILIES: Family[] = [
  { kind: "mace", slot: "mainhand", classReq: "cinder", size: [1, 2], names: ["Ash Cudgel", "Brass Mace", "Litany Mace", "Pilgrim Flanged Mace", "Vowbreaker", "Starforged Morningstar"], levels: [1, 4, 8, 12, 16, 20],
    stats: (s) => ({ damage: [Math.round(4 * s), Math.round(8 * s)], attackSpeed: 1, implicit: {} }), maxSockets: 2, durability: 60, value: 30 },
  { kind: "maul", slot: "mainhand", twoHanded: true, classReq: "cinder", size: [2, 3], names: ["Grave Maul", "Bell Hammer", "Anvil of Oaths", "Kiln Maul", "Censure Hammer", "Star-Iron Crusher"], levels: [1, 5, 9, 13, 17, 20],
    stats: (s) => ({ damage: [Math.round(8 * s), Math.round(15 * s)], attackSpeed: 0.85, implicit: { critDamage: 10 } }), maxSockets: 3, durability: 70, value: 45 },
  { kind: "bow", slot: "mainhand", twoHanded: true, classReq: "ranger", size: [2, 3], names: ["Ashwood Bow", "Recurve of Cinders", "Mothwing Bow", "Gloam Recurve", "Driftwood Horn Bow", "Starthread Bow"], levels: [1, 4, 8, 12, 16, 20],
    stats: (s) => ({ damage: [Math.round(4 * s), Math.round(8 * s)], attackSpeed: 1.05, implicit: {} }), maxSockets: 2, durability: 55, value: 32 },
  { kind: "longbow", slot: "mainhand", twoHanded: true, classReq: "ranger", size: [2, 3], names: ["Hunter's Longbow", "Bone Longbow", "Vigil Longbow", "Long Patience", "Siege of Thorns"], levels: [3, 7, 11, 15, 19],
    stats: (s) => ({ damage: [Math.round(6 * s), Math.round(12 * s)], attackSpeed: 0.85, implicit: { critChance: 3 } }), maxSockets: 3, durability: 55, value: 40 },
  { kind: "shield", slot: "offhand", classReq: "cinder", size: [2, 3], names: ["Plank Buckler", "Brass Heater", "Bell Shield", "Tollgate Shield", "Archive Pavise", "Covenant Bulwark"], levels: [1, 4, 8, 12, 16, 20],
    stats: (s, t) => ({ implicit: { armor: Math.round(10 * s), blockChance: 12 + t * 2 } }), maxSockets: 2, durability: 70, value: 28 },
  { kind: "quiver", slot: "offhand", classReq: "ranger", size: [1, 2], names: ["Soot Quiver", "Barbed Quiver", "Moth Quiver", "Bone-Fletch Quiver", "Star-Fletched Quiver"], levels: [1, 5, 10, 15, 19],
    stats: (_s, t) => ({ implicit: { pctProjectile: 6 + t * 3, focusOnHit: 1 } }), maxSockets: 1, durability: 40, value: 25 },
  { kind: "helm", slot: "head", size: [1, 2], names: ["Rag Hood", "Iron Cap", "Ash Mask", "Brass Sallet", "Vigil Visor", "Moonlit Coif", "Star-Crowned Helm"], levels: [1, 3, 6, 9, 13, 16, 19],
    stats: (s) => ({ implicit: { armor: Math.round(7 * s) } }), maxSockets: 2, durability: 50, value: 20 },
  { kind: "chest", slot: "chest", size: [2, 3], names: ["Padded Coat", "Scaled Jerkin", "Pilgrim Hauberk", "Ashcloth Brigandine", "Archive Cuirass", "Kilnplate", "Covenant Plate"], levels: [1, 3, 6, 9, 12, 16, 19],
    stats: (s) => ({ implicit: { armor: Math.round(14 * s), maxHealth: Math.round(4 * s) } }), maxSockets: 3, durability: 65, value: 30 },
  { kind: "gloves", slot: "gloves", size: [1, 2], names: ["Wrapped Hands", "Leather Grips", "Brass Gauntlets", "Scribe Gloves", "Chainlink Mitts", "Star-Iron Gauntlets"], levels: [1, 4, 8, 12, 15, 19],
    stats: (s) => ({ implicit: { armor: Math.round(4 * s) } }), maxSockets: 1, durability: 45, value: 18 },
  { kind: "boots", slot: "boots", size: [1, 2], names: ["Rag Wraps", "Trail Boots", "Ash Greaves", "Pilgrim Treads", "Marsh Striders", "Vigil Sabatons"], levels: [1, 4, 8, 12, 15, 19],
    stats: (s) => ({ implicit: { armor: Math.round(4 * s), moveSpeed: 2 } }), maxSockets: 1, durability: 45, value: 18 },
  { kind: "belt", slot: "belt", size: [1, 2], names: ["Cord Belt", "Buckled Strap", "Vial Sash", "Brass Girdle", "Reliquary Belt", "Star-Chain Girdle"], levels: [1, 4, 8, 12, 15, 19],
    stats: (s, t) => ({ implicit: { armor: Math.round(3 * s), potionPower: 5 + t * 2 } }), maxSockets: 0, durability: 40, value: 16 },
  { kind: "amulet", slot: "amulet", size: [1, 1], names: ["Bone Charm", "Copper Locket", "Ember Talisman", "Lantern Pendant", "Moon Pendant", "Grave Reliquary", "Starseed Amulet"], levels: [1, 3, 6, 9, 13, 16, 19],
    stats: (_s, t) => ({ implicit: { resAll: 2 + t * 2 } }), maxSockets: 1, durability: 999, value: 35 },
  { kind: "ring", slot: "ring", size: [1, 1], names: ["Tin Band", "Ash Loop", "Brass Signet", "Glass Ring", "Bellmetal Band", "Moonstone Ring", "Ossuary Seal", "Star-Metal Ring"], levels: [1, 3, 5, 8, 11, 14, 17, 20],
    stats: (s, t) => ({ implicit: t % 2 === 0 ? { maxHealth: Math.round(5 * s) } : { maxFocus: 4 + t } }), maxSockets: 0, durability: 999, value: 30 },
];

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export const BASE_ITEMS: BaseItemDef[] = FAMILIES.flatMap((f) =>
  f.names.map((name, i) => {
    const lvl = f.levels[i];
    const scale = 1 + 0.2 * (lvl - 1);
    const st = f.stats(scale, i);
    const b: BaseItemDef = {
      id: slug(name), name, slot: f.slot, kind: f.kind, twoHanded: f.twoHanded, classReq: f.classReq,
      reqLevel: Math.max(1, lvl - 1), ilvl: lvl, size: f.size, damage: st.damage, attackSpeed: st.attackSpeed,
      implicit: st.implicit, maxSockets: f.maxSockets, durability: f.durability, value: Math.round(f.value * scale),
    };
    return b;
  }),
);

/** Fist fallback when nothing is equipped in the main hand. */
export const FIST_DAMAGE: [number, number] = [2, 4];

export const BASE_BY_ID: Record<string, BaseItemDef> = Object.fromEntries(BASE_ITEMS.map((b) => [b.id, b]));

// ───────────────────────── Affixes ─────────────────────────
const WEAP: SlotType[] = ["mainhand"];
const ARMOR: SlotType[] = ["head", "chest", "gloves", "boots", "belt", "offhand"];
const JEWEL: SlotType[] = ["amulet", "ring"];
const ALL: SlotType[] = ["mainhand", "offhand", "head", "chest", "gloves", "boots", "belt", "amulet", "ring"];

const tiers = (a: [number, number], b: [number, number], c: [number, number], d: [number, number]) => [
  { ilvl: 1, min: a[0], max: a[1] }, { ilvl: 7, min: b[0], max: b[1] }, { ilvl: 13, min: c[0], max: c[1] }, { ilvl: 19, min: d[0], max: d[1] },
];

type AffixSeed = [id: string, kind: "prefix" | "suffix", name: string, stat: StatId, t: ReturnType<typeof tiers>, slots: SlotType[], weight: number, tags: string[], opts?: Partial<AffixDef>];

const AFFIX_SEEDS: AffixSeed[] = [
  // prefixes — damage
  ["heavy", "prefix", "Heavy", "flatPhys", tiers([1, 3], [4, 7], [8, 12], [13, 18]), [...WEAP, "gloves", "ring", "amulet"], 10, ["damage", "physical"]],
  ["smoldering", "prefix", "Smoldering", "flatEmber", tiers([1, 3], [4, 7], [8, 12], [13, 18]), [...WEAP, "gloves", "ring", "amulet"], 8, ["damage", "ember"], { group: "flatElem" }],
  ["rimed", "prefix", "Rimed", "flatFrost", tiers([1, 3], [4, 7], [8, 12], [13, 18]), [...WEAP, "gloves", "ring", "amulet"], 8, ["damage", "frost"], { group: "flatElem" }],
  ["festering", "prefix", "Festering", "flatBlight", tiers([1, 3], [4, 7], [8, 12], [13, 18]), [...WEAP, "gloves", "ring", "amulet"], 8, ["damage", "blight"], { group: "flatElem" }],
  ["cruel", "prefix", "Cruel", "pctPhys", tiers([8, 14], [15, 24], [25, 34], [35, 45]), [...WEAP, "amulet"], 8, ["damage", "physical"], { percent: true }],
  ["kindled", "prefix", "Kindled", "pctEmber", tiers([8, 14], [15, 24], [25, 34], [35, 45]), [...WEAP, "amulet", "offhand"], 7, ["damage", "ember"], { percent: true, group: "pctElem" }],
  ["glacial", "prefix", "Glacial", "pctFrost", tiers([8, 14], [15, 24], [25, 34], [35, 45]), [...WEAP, "amulet", "offhand"], 7, ["damage", "frost"], { percent: true, group: "pctElem" }],
  ["virulent", "prefix", "Virulent", "pctBlight", tiers([8, 14], [15, 24], [25, 34], [35, 45]), [...WEAP, "amulet", "offhand"], 7, ["damage", "blight"], { percent: true, group: "pctElem" }],
  ["brutal", "prefix", "Brutal", "pctMelee", tiers([6, 10], [11, 16], [17, 24], [25, 32]), [...WEAP, "gloves", "amulet"], 6, ["damage", "melee"], { percent: true, classTag: "cinder" }],
  ["fletched", "prefix", "Fletched", "pctProjectile", tiers([6, 10], [11, 16], [17, 24], [25, 32]), [...WEAP, "gloves", "amulet", "offhand"], 6, ["damage", "projectile"], { percent: true }],
  ["sweeping", "prefix", "Sweeping", "pctArea", tiers([6, 10], [11, 16], [17, 24], [25, 32]), [...WEAP, "gloves", "amulet"], 6, ["damage", "area"], { percent: true }],
  ["cunning", "prefix", "Cunning", "pctTrap", tiers([8, 14], [15, 22], [23, 30], [31, 40]), [...WEAP, "gloves", "belt", "offhand"], 5, ["damage", "trap"], { percent: true, classTag: "ranger" }],
  ["scorching", "prefix", "Scorching", "dmgVsBurning", tiers([8, 12], [13, 18], [19, 25], [26, 32]), [...WEAP, "gloves", "ring"], 4, ["conditional", "burn"], { percent: true }],
  ["trackers", "prefix", "Tracker's", "dmgVsMarked", tiers([8, 12], [13, 18], [19, 25], [26, 32]), [...WEAP, "gloves", "ring"], 4, ["conditional", "mark"], { percent: true, classTag: "ranger" }],
  ["slayers", "prefix", "Slayer's", "dmgVsElites", tiers([6, 10], [11, 15], [16, 20], [21, 26]), [...WEAP, "amulet", "ring"], 4, ["conditional"], { percent: true }],
  ["bulwark", "prefix", "Bulwark", "dmgWhileGuarded", tiers([10, 15], [16, 22], [23, 30], [31, 40]), [...WEAP, "offhand", "chest"], 4, ["conditional", "guard"], { percent: true, classTag: "cinder" }],
  ["farsighted", "prefix", "Farsighted", "dmgAtRange", tiers([6, 10], [11, 15], [16, 20], [21, 26]), [...WEAP, "head", "offhand"], 4, ["conditional"], { percent: true, classTag: "ranger" }],
  // prefixes — defense & utility
  ["sturdy", "prefix", "Sturdy", "armor", tiers([5, 10], [11, 22], [23, 38], [39, 60]), ARMOR, 10, ["defense"]],
  ["fortified", "prefix", "Fortified", "armorPct", tiers([5, 9], [10, 15], [16, 22], [23, 30]), ["head", "chest", "offhand", "belt"], 6, ["defense"], { percent: true }],
  ["hale", "prefix", "Hale", "maxHealth", tiers([6, 12], [13, 24], [25, 40], [41, 60]), [...ARMOR, ...JEWEL], 10, ["defense", "life"]],
  ["vital", "prefix", "Vital", "maxHealthPct", tiers([3, 4], [5, 7], [8, 10], [11, 13]), ["chest", "belt", "amulet"], 4, ["defense", "life"], { percent: true }],
  ["lucid", "prefix", "Lucid", "maxFocus", tiers([4, 8], [9, 14], [15, 20], [21, 28]), ["head", "amulet", "ring", "offhand"], 6, ["resource"]],
  ["vengeful", "prefix", "Vengeful", "retaliation", tiers([3, 6], [7, 12], [13, 20], [21, 30]), ["chest", "offhand", "gloves"], 5, ["retaliation"]],
  ["stalwart", "prefix", "Stalwart", "blockChance", tiers([3, 5], [6, 8], [9, 11], [12, 14]), ["offhand"], 6, ["defense", "block"], { percent: true, classTag: "cinder" }],
  ["gilded", "prefix", "Gilded", "goldFind", tiers([10, 20], [21, 35], [36, 50], [51, 70]), ["amulet", "ring", "boots", "head"], 3, ["utility"], { percent: true }],
  ["seekers", "prefix", "Seeker's", "rarityFind", tiers([5, 9], [10, 15], [16, 22], [23, 30]), ["amulet", "ring", "head"], 3, ["utility"], { percent: true }],
  // suffixes — attributes
  ["of_might", "suffix", "of Might", "might", tiers([2, 4], [5, 8], [9, 13], [14, 18]), ALL, 8, ["attribute"]],
  ["of_finesse", "suffix", "of Finesse", "finesse", tiers([2, 4], [5, 8], [9, 13], [14, 18]), ALL, 8, ["attribute"]],
  ["of_will", "suffix", "of Will", "will", tiers([2, 4], [5, 8], [9, 13], [14, 18]), ALL, 7, ["attribute"]],
  ["of_vigor", "suffix", "of Vigor", "vigor", tiers([2, 4], [5, 8], [9, 13], [14, 18]), ALL, 8, ["attribute"]],
  // suffixes — offense
  ["of_haste", "suffix", "of Haste", "attackSpeed", tiers([4, 6], [7, 9], [10, 12], [13, 16]), [...WEAP, "gloves", "ring"], 6, ["speed"], { percent: true }],
  ["of_recurrence", "suffix", "of Recurrence", "cdr", tiers([3, 5], [6, 8], [9, 11], [12, 14]), ["head", "amulet", "ring", "offhand"], 5, ["speed"], { percent: true }],
  ["of_precision", "suffix", "of Precision", "critChance", tiers([2, 3], [4, 5], [6, 7], [8, 10]), [...WEAP, "gloves", "ring", "amulet", "head"], 6, ["crit"], { percent: true }],
  ["of_ruin", "suffix", "of Ruin", "critDamage", tiers([10, 15], [16, 24], [25, 34], [35, 45]), [...WEAP, "gloves", "amulet"], 5, ["crit"], { percent: true }],
  ["of_embers", "suffix", "of Embers", "burnChance", tiers([5, 8], [9, 12], [13, 16], [17, 22]), [...WEAP, "gloves", "offhand"], 4, ["ailment", "burn"], { percent: true }],
  ["of_frostbite", "suffix", "of Frostbite", "chillChance", tiers([5, 8], [9, 12], [13, 16], [17, 22]), [...WEAP, "gloves", "offhand"], 4, ["ailment", "chill"], { percent: true }],
  ["of_rot", "suffix", "of Rot", "blightChance", tiers([5, 8], [9, 12], [13, 16], [17, 22]), [...WEAP, "gloves", "offhand"], 4, ["ailment", "blight"], { percent: true }],
  ["of_the_forge", "suffix", "of the Forge", "heatGain", tiers([8, 12], [13, 18], [19, 25], [26, 34]), ["chest", "offhand", "mainhand", "amulet"], 5, ["heat"], { percent: true, classTag: "cinder" }],
  ["of_tracing", "suffix", "of Tracing", "markDamage", tiers([8, 12], [13, 18], [19, 25], [26, 34]), ["mainhand", "offhand", "gloves", "amulet"], 5, ["mark"], { percent: true, classTag: "ranger" }],
  ["of_the_snare", "suffix", "of the Snare", "trapDamage", tiers([8, 12], [13, 18], [19, 25], [26, 34]), ["belt", "boots", "offhand", "amulet"], 5, ["trap"], { percent: true, classTag: "ranger" }],
  // suffixes — defense & sustain
  ["of_the_kiln", "suffix", "of the Kiln", "resEmber", tiers([6, 10], [11, 16], [17, 23], [24, 30]), [...ARMOR, ...JEWEL], 7, ["resist"], { percent: true }],
  ["of_the_thaw", "suffix", "of the Thaw", "resFrost", tiers([6, 10], [11, 16], [17, 23], [24, 30]), [...ARMOR, ...JEWEL], 7, ["resist"], { percent: true }],
  ["of_purity", "suffix", "of Purity", "resBlight", tiers([6, 10], [11, 16], [17, 23], [24, 30]), [...ARMOR, ...JEWEL], 7, ["resist"], { percent: true }],
  ["of_the_covenant", "suffix", "of the Covenant", "resAll", tiers([3, 5], [6, 8], [9, 11], [12, 15]), ["amulet", "ring", "chest", "offhand"], 3, ["resist"], { percent: true }],
  ["of_resolve", "suffix", "of Resolve", "ailmentRes", tiers([8, 12], [13, 18], [19, 25], [26, 32]), ["head", "chest", "boots", "belt"], 4, ["defense"], { percent: true }],
  ["of_swiftness", "suffix", "of Swiftness", "moveSpeed", tiers([4, 6], [7, 9], [10, 12], [13, 15]), ["boots"], 8, ["movement"], { percent: true }],
  ["of_evasion", "suffix", "of Evasion", "evadeRecovery", tiers([8, 12], [13, 18], [19, 24], [25, 30]), ["boots", "belt", "gloves"], 5, ["movement"], { percent: true }],
  ["of_the_draught", "suffix", "of the Draught", "potionPower", tiers([8, 12], [13, 18], [19, 25], [26, 34]), ["belt", "amulet", "chest"], 5, ["sustain"], { percent: true }],
  ["of_harvest", "suffix", "of Harvest", "healthOnKill", tiers([2, 3], [4, 6], [7, 10], [11, 15]), [...WEAP, "gloves", "ring", "belt"], 5, ["sustain"]],
  ["of_leeching", "suffix", "of Leeching", "lifeOnHit", tiers([1, 1], [1, 2], [2, 3], [3, 4]), [...WEAP, "ring"], 3, ["sustain"]],
  ["of_insight", "suffix", "of Insight", "focusOnHit", tiers([1, 1], [1, 2], [2, 3], [3, 4]), [...WEAP, "gloves", "ring", "amulet"], 5, ["resource"]],
  ["of_clarity", "suffix", "of Clarity", "focusRegen", tiers([1, 1], [1, 2], [2, 3], [3, 4]), ["head", "amulet", "ring", "chest"], 5, ["resource"]],
  ["of_mastery", "suffix", "of Mastery", "rankAll", tiers([1, 1], [1, 1], [1, 1], [1, 2]), ["amulet"], 1, ["skill"]],
];

// Skill-rank suffixes, one per non-basic class active.
const RANK_SKILLS: [string, string, ClassId][] = [
  ["brand_arc", "of the Brand", "cinder"], ["bastion_step", "of the Rampart", "cinder"], ["cinder_ring", "of Eruption", "cinder"],
  ["vow_chain", "of Binding", "cinder"], ["furnace_heart", "of the Furnace", "cinder"], ["ashen_standard", "of the Banner", "cinder"],
  ["splinter_volley", "of Splinters", "ranger"], ["ghostline", "of the Ghostline", "ranger"], ["snare_bloom", "of Thorned Blooms", "ranger"],
  ["mothcloak", "of Moths", "ranger"], ["backstep_flask", "of the Flask", "ranger"], ["horizon_call", "of the Horizon", "ranger"],
];

export const AFFIXES: AffixDef[] = [
  ...AFFIX_SEEDS.map(([id, kind, name, stat, t, slots, weight, tags, opts]) => ({ id, kind, name, stat, tiers: t, slots, weight, tags, group: opts?.group ?? id, ...opts } as AffixDef)),
  ...RANK_SKILLS.map(([skill, name, cls]) => ({
    id: `rank_${skill}`, kind: "suffix" as const, name, group: "skillRank", stat: `rank:${skill}` as StatId,
    tiers: [{ ilvl: 1, min: 1, max: 1 }, { ilvl: 13, min: 1, max: 2 }], weight: 3,
    slots: ["mainhand", "offhand", "head", "amulet"] as SlotType[], classTag: cls, tags: ["skill"],
  })),
];
export const AFFIX_BY_ID: Record<string, AffixDef> = Object.fromEntries(AFFIXES.map((a) => [a.id, a]));

// ───────────────────────── Relics (8, original) ─────────────────────────
export const RELICS: RelicDef[] = [
  { id: "kiln_heart", name: "Kiln-Heart Bulwark", baseId: "bell_shield", classReq: "cinder", rolls: 2, fixed: { blockChance: 6, heatGain: 25 },
    power: "Blocking a hit releases a small ember burst (70% weapon damage) around you. 1 s cooldown." },
  { id: "oathbreaker", name: "Oathbreaker's Maul", baseId: "anvil_of_oaths", classReq: "cinder", rolls: 3, fixed: { pctEmber: 30, dmgVsBurning: 20 },
    power: "Brand Arc hits against burning enemies refund 3 Focus each." },
  { id: "starfall_litany", name: "Starfall Litany", baseId: "ember_talisman", rolls: 2, fixed: { critChance: 4 },
    power: "Every fourth basic attack calls down a falling star shard for 120% weapon damage as Frost." },
  { id: "moth_queen", name: "Moth-Queen's Veil", baseId: "ash_mask", classReq: "ranger", rolls: 2, fixed: { evadeRecovery: 15, moveSpeed: 4 },
    power: "Mothcloak lasts twice as long. Breaking camouflage applies 2 Trace marks to enemies within 5 m." },
  { id: "long_thread", name: "Thread of the Long Hunt", baseId: "mothwing_bow", classReq: "ranger", rolls: 3, fixed: { markDamage: 25 },
    power: "Ghostline gains +15% damage for every mark it detonates." },
  { id: "snarewood", name: "Snarewood Coil", baseId: "vial_sash", classReq: "ranger", rolls: 2, fixed: { trapDamage: 30 },
    power: "Snare Bloom gains +1 charge, and each trap leaves a Blight pool when it triggers." },
  { id: "buried_star", name: "Ring of the Buried Star", baseId: "glass_ring", rolls: 2, fixed: { rankAll: 1, maxHealthPct: -10 },
    power: "+1 to all skills, at the cost of 10% maximum health. Star-metal hums against your finger." },
  { id: "ashwalker", name: "Ashwalker Treads", baseId: "ash_greaves", rolls: 2, fixed: { moveSpeed: 6 },
    power: "Gain +1 evade charge. Evading leaves a short trail of embers that burns enemies." },
];
export const RELIC_BY_ID: Record<string, RelicDef> = Object.fromEntries(RELICS.map((r) => [r.id, r]));

// ───────────────────────── Glyphs ─────────────────────────
const GLYPH_TIER_NAMES = ["Chipped", "Whole", "Radiant"];
const GLYPH_KINDS: [string, string, StatId, number[], boolean?][] = [
  ["ember", "Ember Glyph", "flatEmber", [3, 7, 13]],
  ["frost", "Frost Glyph", "flatFrost", [3, 7, 13]],
  ["ward", "Ward Glyph", "armor", [10, 24, 45]],
  ["vigor", "Heart Glyph", "maxHealth", [12, 26, 48]],
  ["keen", "Keen Glyph", "critChance", [2, 3, 5], true],
];
export const GLYPHS: GlyphDef[] = GLYPH_KINDS.flatMap(([k, name, stat, vals, pct]) =>
  vals.map((v, i) => ({ id: `glyph_${k}_${i + 1}`, name: `${GLYPH_TIER_NAMES[i]} ${name}`, tier: i + 1, stat, value: v, percent: pct })),
);
export const GLYPH_BY_ID: Record<string, GlyphDef> = Object.fromEntries(GLYPHS.map((g) => [g.id, g]));

export const POTION_KINDS = ["health", "focus", "cleanse", "tonic"] as const;
export type PotionKind = (typeof POTION_KINDS)[number];
export const POTION_INFO: Record<PotionKind, { name: string; color: string; price: number; desc: string }> = {
  health: { name: "Red Draught", color: "#d8343a", price: 12, desc: "Restores 45% of maximum health over 1.5 s." },
  focus: { name: "Blue Draught", color: "#3a78e0", price: 10, desc: "Restores 60% of maximum Focus instantly." },
  cleanse: { name: "White Draught", color: "#e8e8e0", price: 14, desc: "Removes ailments and grants 3 s of ailment immunity." },
  tonic: { name: "Gold Tonic", color: "#e8b830", price: 18, desc: "+25% to all resistances for 10 s." },
};
export const BELT_STACK_MAX = 5;
