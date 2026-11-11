/** Content schemas shared by data tables, simulation, and UI. All content definitions are validated by data/validate.ts. */

export const CONTENT_VERSION = 1;

export type DamageType = "physical" | "ember" | "frost" | "blight";
export const DAMAGE_TYPES: DamageType[] = ["physical", "ember", "frost", "blight"];
export type ClassId = "cinder" | "ranger";
export type Difficulty = "normal" | "veteran";

export type StatId =
  | "might" | "finesse" | "will" | "vigor"
  | "maxHealth" | "maxHealthPct" | "maxFocus" | "focusRegen" | "focusOnHit"
  | "armor" | "armorPct" | "resEmber" | "resFrost" | "resBlight" | "resAll"
  | "flatPhys" | "flatEmber" | "flatFrost" | "flatBlight"
  | "pctPhys" | "pctEmber" | "pctFrost" | "pctBlight" | "pctMelee" | "pctProjectile" | "pctArea" | "pctTrap" | "pctAll"
  | "attackSpeed" | "cdr" | "critChance" | "critDamage"
  | "moveSpeed" | "evadeRecovery" | "potionPower" | "healthOnKill" | "lifeOnHit"
  | "blockChance" | "retaliation" | "heatGain" | "markDamage" | "trapDamage"
  | "burnChance" | "chillChance" | "blightChance" | "ailmentRes"
  | "dmgVsBurning" | "dmgVsMarked" | "dmgVsElites" | "dmgWhileGuarded" | "dmgAtRange"
  | "goldFind" | "rarityFind" | "rankAll"
  | `rank:${string}`;

export type StatBlock = Partial<Record<StatId, number>>;

export type SlotType = "mainhand" | "offhand" | "head" | "chest" | "gloves" | "boots" | "belt" | "amulet" | "ring";
export type EquipSlot = "mainhand" | "offhand" | "head" | "chest" | "gloves" | "boots" | "belt" | "amulet" | "ring1" | "ring2";
export const EQUIP_SLOTS: EquipSlot[] = ["mainhand", "offhand", "head", "chest", "gloves", "boots", "belt", "amulet", "ring1", "ring2"];

export type Rarity = "worn" | "tempered" | "inscribed" | "relic";
export const RARITIES: Rarity[] = ["worn", "tempered", "inscribed", "relic"];

export interface BaseItemDef {
  id: string;
  name: string;
  slot: SlotType;
  kind: string; // mace, maul, bow, longbow, shield, quiver, helm, ...
  twoHanded?: boolean;
  classReq?: ClassId;
  reqLevel: number;
  ilvl: number; // minimum item level this base drops at
  size: [number, number]; // w,h inventory cells
  damage?: [number, number];
  attackSpeed?: number; // attacks per second baseline modifier (1 = normal)
  implicit: StatBlock;
  maxSockets: number;
  durability: number;
  value: number; // base gold value
}

export interface AffixTier { ilvl: number; min: number; max: number }
export interface AffixDef {
  id: string;
  kind: "prefix" | "suffix";
  name: string; // shown e.g. "Smoldering" or "of the Kiln"
  group: string; // only one affix per group on an item
  stat: StatId;
  tiers: AffixTier[];
  weight: number;
  slots: SlotType[];
  classTag?: ClassId; // only rolls on items whose wielder could be this class (skill ranks, class mechanics)
  tags: string[];
  excludes?: string[]; // other groups that cannot appear together
  percent?: boolean;
}

export type SkillKind = "basic" | "core" | "active" | "ultimate" | "passive" | "capstone";
export type Targeting = "enemy" | "ground" | "direction" | "self" | "none";
export type Ailment = "burn" | "chill" | "blight" | "stagger" | "root" | "slow" | "stun" | "knockback";

export interface SkillDef {
  id: string;
  classId: ClassId;
  name: string;
  kind: SkillKind;
  tags: string[];
  cost: number; // focus
  heatCost?: number;
  cooldown: number; // seconds
  charges?: number;
  targeting: Targeting;
  range: number;
  timing: { windup: number; impact: number; recovery: number; cancel: number }; // ms; cancel = fraction of total after which movement can cancel
  coeff: { base: number; perRank: number }; // weapon-damage multiplier
  damageType: DamageType;
  ailment?: { type: Ailment; chance: number };
  allowedModifiers: string[];
  vfx: string;
  sfx: string;
  threat: "dodge" | "interrupt" | "ignore" | "scatter";
  maxRank: number;
  reqLevel: number;
  prereq?: string[];
  exclusiveWith?: string;
  /** Passive/capstone stat contributions per rank. */
  passive?: StatBlock;
  summary: string; // short flavor; numbers come from describe()
  icon: string; // glyph character used in UI icon tile
}

export type EnemyRole = "fodder" | "skirmisher" | "controller" | "bruiser";
export const ROLE_POINTS: Record<EnemyRole, number> = { fodder: 1, skirmisher: 2, controller: 3, bruiser: 4 };
export const ELITE_POINTS = 6;

export interface EnemyAttackDef {
  id: string;
  kind: "melee" | "slam" | "projectile" | "hook" | "explode" | "zone" | "lunge" | "ward" | "split";
  range: number;
  windup: number; // ms telegraph
  recovery: number; // ms
  cooldown: number; // s
  dmg: number; // multiplier of enemy base damage
  type: DamageType;
  shape: { kind: "circle" | "cone" | "line"; radius?: number; angle?: number; width?: number; length?: number };
  heavy?: boolean;
  projectileSpeed?: number;
  lead?: number;
  ailment?: { type: Ailment; chance: number; duration?: number };
}

export interface EnemyDef {
  id: string;
  name: string;
  role: EnemyRole;
  behavior: "swarm" | "bruiser" | "ranged" | "support" | "bomber" | "hooker" | "shield" | "flock" | "flanker" | "kiter" | "dummy";
  hp: number; // at level 1
  dmg: number; // at level 1
  speed: number; // m/s
  radius: number;
  armor: number;
  res: Partial<Record<DamageType, number>>;
  xp: number;
  aggro: number;
  attacks: EnemyAttackDef[];
  light: boolean; // light enemies can be pulled/interrupted
  color: string; // emission hint
  flavor: string;
}

export interface EliteModDef {
  id: string;
  name: string;
  desc: string;
  excludes: string[];
  threat: number; // threat budget points
  cooldown: number;
  color: string;
}

export interface RelicDef {
  id: string;
  name: string;
  baseId: string;
  power: string; // tooltip text of the fixed special power
  fixed: StatBlock; // fixed stats
  rolls: number; // 2-3 supporting affixes
  classReq?: ClassId;
}

export interface GlyphDef {
  id: string;
  name: string;
  tier: number; // 1..3
  stat: StatId;
  value: number;
  percent?: boolean;
}
