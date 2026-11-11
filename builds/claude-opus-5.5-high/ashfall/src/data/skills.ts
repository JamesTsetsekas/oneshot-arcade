import type { SkillDef, ClassId } from "./types";

const T = (windup: number, impact: number, recovery: number, cancel = 0.65) => ({ windup, impact, recovery, cancel });

export const SKILLS: SkillDef[] = [
  // ───────────── Cinder Vow ─────────────
  {
    id: "iron_litany", classId: "cinder", name: "Iron Litany", kind: "basic", tags: ["melee", "attack", "physical"],
    cost: 0, cooldown: 0, targeting: "enemy", range: 2.4, timing: T(140, 180, 260, 0.68),
    coeff: { base: 1.0, perRank: 0 }, damageType: "physical", ailment: { type: "stagger", chance: 0.15 },
    allowedModifiers: ["attackSpeed", "pctMelee", "pctPhys"], vfx: "vfx_mace_arc", sfx: "sfx_swing_heavy", threat: "ignore",
    maxRank: 1, reqLevel: 1, summary: "A three-strike mace litany. The third strike sends a short frontal wave. Builds Focus.", icon: "⚒",
  },
  {
    id: "brand_arc", classId: "cinder", name: "Brand Arc", kind: "core", tags: ["melee", "area", "ember"],
    cost: 22, cooldown: 0, targeting: "direction", range: 3.2, timing: T(170, 210, 280, 0.7),
    coeff: { base: 1.55, perRank: 0.18 }, damageType: "ember", ailment: { type: "burn", chance: 0.35 },
    allowedModifiers: ["pctEmber", "pctArea", "burnChance", "dmgVsBurning"], vfx: "vfx_flame_sweep", sfx: "sfx_flame_sweep", threat: "dodge",
    maxRank: 5, reqLevel: 1, summary: "A sweeping arc of brand-fire. Deals 40% more damage to burning targets.", icon: "☄",
  },
  {
    id: "bastion_step", classId: "cinder", name: "Bastion Step", kind: "active", tags: ["melee", "movement", "physical", "guard"],
    cost: 0, cooldown: 6, targeting: "ground", range: 5.5, timing: T(80, 260, 160, 0.8),
    coeff: { base: 1.1, perRank: 0.15 }, damageType: "physical", ailment: { type: "stagger", chance: 1 },
    allowedModifiers: ["cdr", "pctMelee", "dmgWhileGuarded"], vfx: "vfx_shield_rush", sfx: "sfx_shield_rush", threat: "scatter",
    maxRank: 5, reqLevel: 2, summary: "Shield-rush to a point, interrupting light enemies in the way. Grants Guard for 2 s.", icon: "⛨",
  },
  {
    id: "cinder_ring", classId: "cinder", name: "Cinder Ring", kind: "active", tags: ["area", "ember", "heat"],
    cost: 10, cooldown: 8, targeting: "self", range: 4.2, timing: T(120, 120, 220, 0.6),
    coeff: { base: 2.3, perRank: 0.3 }, damageType: "ember", ailment: { type: "burn", chance: 0.6 },
    allowedModifiers: ["pctEmber", "pctArea", "heatGain", "cdr"], vfx: "vfx_cinder_ring", sfx: "sfx_eruption", threat: "dodge",
    maxRank: 5, reqLevel: 3, summary: "Mark the ground around you; it erupts after 650 ms. Consumes all Heat: +1% damage and +0.01 m radius per Heat.", icon: "◎",
  },
  {
    id: "vow_chain", classId: "cinder", name: "Vow Chain", kind: "active", tags: ["projectile", "physical", "control"],
    cost: 8, cooldown: 7, targeting: "direction", range: 10, timing: T(150, 150, 220, 0.7),
    coeff: { base: 0.9, perRank: 0.15 }, damageType: "physical", ailment: { type: "stagger", chance: 1 },
    allowedModifiers: ["cdr", "pctProjectile"], vfx: "vfx_chain", sfx: "sfx_chain", threat: "dodge",
    maxRank: 5, reqLevel: 5, summary: "Hurl a vow-chain. Light enemies are dragged to you; against heavy targets, you are pulled to them.", icon: "⛓",
  },
  {
    id: "furnace_heart", classId: "cinder", name: "Furnace Heart", kind: "active", tags: ["buff", "heat", "ember", "stance"],
    cost: 0, heatCost: 20, cooldown: 2, targeting: "self", range: 0, timing: T(60, 60, 120, 0.5),
    coeff: { base: 0, perRank: 0 }, damageType: "ember",
    allowedModifiers: ["attackSpeed", "heatGain"], vfx: "vfx_furnace", sfx: "sfx_ignite", threat: "ignore",
    maxRank: 5, reqLevel: 7, summary: "Toggle stance. Burns 8 Heat per second for +20% attack speed (+4%/rank) and converts 50% of Physical to Ember.", icon: "♨",
  },
  {
    id: "ashen_standard", classId: "cinder", name: "Ashen Standard", kind: "ultimate", tags: ["area", "buff", "taunt"],
    cost: 15, cooldown: 20, targeting: "ground", range: 6, timing: T(200, 200, 300, 0.6),
    coeff: { base: 0.6, perRank: 0.1 }, damageType: "ember",
    allowedModifiers: ["cdr", "armorPct"], vfx: "vfx_standard", sfx: "sfx_standard", threat: "scatter",
    maxRank: 5, reqLevel: 10, summary: "Plant a standard for 8 s: allies within 5 m gain +40% armor and Heat each second; it pulses ember and taunts lesser enemies every 2 s.", icon: "⚑",
  },
  // passives
  { id: "kindled_plate", classId: "cinder", name: "Kindled Plate", kind: "passive", tags: ["heat", "defense"], cost: 0, cooldown: 0, targeting: "none", range: 0, timing: T(0, 0, 0), coeff: { base: 0, perRank: 0 }, damageType: "physical", allowedModifiers: [], vfx: "", sfx: "", threat: "ignore", maxRank: 3, reqLevel: 2, passive: { heatGain: 15, armorPct: 6 }, summary: "Heat gain and armor.", icon: "▣" },
  { id: "searing_brand", classId: "cinder", name: "Searing Brand", kind: "passive", tags: ["burn", "ember"], cost: 0, cooldown: 0, targeting: "none", range: 0, timing: T(0, 0, 0), coeff: { base: 0, perRank: 0 }, damageType: "ember", allowedModifiers: [], vfx: "", sfx: "", threat: "ignore", maxRank: 3, reqLevel: 3, passive: { burnChance: 8, pctEmber: 10 }, summary: "Burn chance and Ember damage.", icon: "✹" },
  { id: "crushing_weight", classId: "cinder", name: "Crushing Weight", kind: "passive", tags: ["two-handed", "burst"], cost: 0, cooldown: 0, targeting: "none", range: 0, timing: T(0, 0, 0), coeff: { base: 0, perRank: 0 }, damageType: "physical", allowedModifiers: [], vfx: "", sfx: "", threat: "ignore", maxRank: 3, reqLevel: 4, passive: { critDamage: 12 }, summary: "Critical damage. With a two-handed weapon, also +12% melee damage per rank.", icon: "⬣" },
  { id: "bulwark_doctrine", classId: "cinder", name: "Bulwark Doctrine", kind: "passive", tags: ["one-handed", "block"], cost: 0, cooldown: 0, targeting: "none", range: 0, timing: T(0, 0, 0), coeff: { base: 0, perRank: 0 }, damageType: "physical", allowedModifiers: [], vfx: "", sfx: "", threat: "ignore", maxRank: 3, reqLevel: 4, passive: { armorPct: 5 }, summary: "Armor. With a shield, also +5% block chance per rank.", icon: "⛉" },
  { id: "ashen_draught", classId: "cinder", name: "Ashen Draught", kind: "passive", tags: ["potion", "sustain"], cost: 0, cooldown: 0, targeting: "none", range: 0, timing: T(0, 0, 0), coeff: { base: 0, perRank: 0 }, damageType: "physical", allowedModifiers: [], vfx: "", sfx: "", threat: "ignore", maxRank: 3, reqLevel: 6, passive: { potionPower: 15, healthOnKill: 2 }, summary: "Potion efficiency and health on kill.", icon: "⚱" },
  { id: "retribution", classId: "cinder", name: "Retribution", kind: "passive", tags: ["retaliation"], cost: 0, cooldown: 0, targeting: "none", range: 0, timing: T(0, 0, 0), coeff: { base: 0, perRank: 0 }, damageType: "physical", allowedModifiers: [], vfx: "", sfx: "", threat: "ignore", maxRank: 3, reqLevel: 6, passive: { retaliation: 6, heatGain: 5 }, summary: "Strike back at melee attackers for flat damage (scales with level).", icon: "⟲" },
  { id: "living_crucible", classId: "cinder", name: "Living Crucible", kind: "capstone", tags: ["heat", "capstone"], cost: 0, cooldown: 0, targeting: "none", range: 0, timing: T(0, 0, 0), coeff: { base: 1.6, perRank: 0 }, damageType: "ember", allowedModifiers: [], vfx: "", sfx: "", threat: "ignore", maxRank: 1, reqLevel: 12, prereq: ["kindled_plate"], exclusiveWith: "unbroken_oath", passive: { heatGain: 50 }, summary: "Heat gain +50%. Reaching 100 Heat vents an eruption around you (160% weapon damage) and resets Cinder Ring.", icon: "✺" },
  { id: "unbroken_oath", classId: "cinder", name: "Unbroken Oath", kind: "capstone", tags: ["guard", "capstone"], cost: 0, cooldown: 0, targeting: "none", range: 0, timing: T(0, 0, 0), coeff: { base: 0, perRank: 0 }, damageType: "physical", allowedModifiers: [], vfx: "", sfx: "", threat: "ignore", maxRank: 1, reqLevel: 12, prereq: ["bulwark_doctrine"], exclusiveWith: "living_crucible", passive: { blockChance: 8 }, summary: "Guard lasts 4 s and blocks grant 4 Focus. Retaliation is tripled while Guarded.", icon: "⛊" },

  // ───────────── Veil Ranger ─────────────
  {
    id: "quickshot", classId: "ranger", name: "Quickshot", kind: "basic", tags: ["projectile", "attack", "physical", "mark"],
    cost: 0, cooldown: 0, targeting: "enemy", range: 14, timing: T(110, 150, 200, 0.62),
    coeff: { base: 1.0, perRank: 0 }, damageType: "physical",
    allowedModifiers: ["attackSpeed", "pctProjectile", "markDamage"], vfx: "vfx_arrow", sfx: "sfx_bow", threat: "ignore",
    maxRank: 1, reqLevel: 1, summary: "A quick bow shot that builds Focus. Firing after moving at least 2 m applies a Trace mark.", icon: "➶",
  },
  {
    id: "splinter_volley", classId: "ranger", name: "Splinter Volley", kind: "core", tags: ["projectile", "area", "physical"],
    cost: 18, cooldown: 0, targeting: "direction", range: 9, timing: T(140, 170, 230, 0.68),
    coeff: { base: 0.55, perRank: 0.07 }, damageType: "physical",
    allowedModifiers: ["pctProjectile", "pctArea", "critChance"], vfx: "vfx_volley", sfx: "sfx_volley", threat: "dodge",
    maxRank: 5, reqLevel: 1, summary: "Loose a short cone of five splinter arrows. Devastating at close range against packs.", icon: "⋙",
  },
  {
    id: "ghostline", classId: "ranger", name: "Ghostline", kind: "active", tags: ["projectile", "pierce", "mark", "frost"],
    cost: 12, cooldown: 4, targeting: "direction", range: 18, timing: T(220, 240, 220, 0.7),
    coeff: { base: 1.7, perRank: 0.22 }, damageType: "frost", ailment: { type: "chill", chance: 0.4 },
    allowedModifiers: ["pctFrost", "markDamage", "cdr"], vfx: "vfx_ghostline", sfx: "sfx_ghostline", threat: "dodge",
    maxRank: 5, reqLevel: 2, summary: "A piercing spectral arrow. Detonates Trace marks for 60% weapon damage per mark around each target.", icon: "➹",
  },
  {
    id: "snare_bloom", classId: "ranger", name: "Snare Bloom", kind: "active", tags: ["trap", "blight", "control"],
    cost: 8, cooldown: 7, charges: 2, targeting: "ground", range: 9, timing: T(120, 120, 180, 0.6),
    coeff: { base: 1.2, perRank: 0.2 }, damageType: "blight", ailment: { type: "root", chance: 1 },
    allowedModifiers: ["pctTrap", "trapDamage", "blightChance"], vfx: "vfx_snare", sfx: "sfx_trap", threat: "scatter",
    maxRank: 5, reqLevel: 3, summary: "Throw a trap that arms after 500 ms. Roots lesser enemies for 2 s and slows elites and bosses.", icon: "✣",
  },
  {
    id: "mothcloak", classId: "ranger", name: "Mothcloak", kind: "active", tags: ["buff", "stealth", "movement"],
    cost: 0, cooldown: 14, targeting: "self", range: 0, timing: T(60, 60, 100, 0.3),
    coeff: { base: 0, perRank: 0 }, damageType: "physical",
    allowedModifiers: ["cdr", "moveSpeed"], vfx: "vfx_moth", sfx: "sfx_moth", threat: "ignore",
    maxRank: 5, reqLevel: 5, summary: "Camouflage for 1.5 s (+0.2 s/rank): enemies lose track of you, +40% move speed, and the next hit against you is evaded. Attacking breaks it.", icon: "☾",
  },
  {
    id: "backstep_flask", classId: "ranger", name: "Backstep Flask", kind: "active", tags: ["movement", "blight", "area"],
    cost: 6, cooldown: 8, targeting: "direction", range: 5, timing: T(40, 60, 120, 0.9),
    coeff: { base: 0.35, perRank: 0.06 }, damageType: "blight", ailment: { type: "blight", chance: 0.5 },
    allowedModifiers: ["pctBlight", "cdr"], vfx: "vfx_flask", sfx: "sfx_flask", threat: "ignore",
    maxRank: 5, reqLevel: 7, summary: "Leap backward 5 m, leaving a Blight pool at your origin that deals damage every 0.5 s for 3 s.", icon: "⚗",
  },
  {
    id: "horizon_call", classId: "ranger", name: "Horizon Call", kind: "ultimate", tags: ["projectile", "area", "physical"],
    cost: 25, cooldown: 28, targeting: "ground", range: 14, timing: T(260, 260, 320, 0.6),
    coeff: { base: 0.8, perRank: 0.12 }, damageType: "physical",
    allowedModifiers: ["pctArea", "pctProjectile", "cdr"], vfx: "vfx_rain", sfx: "sfx_rain", threat: "scatter",
    maxRank: 5, reqLevel: 10, summary: "Call a rain of arrows that sweeps 12 m along the targeted corridor over 2 s, striking everything in its 3 m path repeatedly.", icon: "☔",
  },
  // passives
  { id: "keen_trail", classId: "ranger", name: "Keen Trail", kind: "passive", tags: ["mark"], cost: 0, cooldown: 0, targeting: "none", range: 0, timing: T(0, 0, 0), coeff: { base: 0, perRank: 0 }, damageType: "physical", allowedModifiers: [], vfx: "", sfx: "", threat: "ignore", maxRank: 3, reqLevel: 2, passive: { markDamage: 15 }, summary: "Mark detonation damage; +1 maximum Trace marks per rank (base 3).", icon: "⌖" },
  { id: "trapwright", classId: "ranger", name: "Trapwright", kind: "passive", tags: ["trap"], cost: 0, cooldown: 0, targeting: "none", range: 0, timing: T(0, 0, 0), coeff: { base: 0, perRank: 0 }, damageType: "blight", allowedModifiers: [], vfx: "", sfx: "", threat: "ignore", maxRank: 3, reqLevel: 3, passive: { trapDamage: 20 }, summary: "Trap damage; Snare Bloom recharges 8% faster per rank.", icon: "✤" },
  { id: "flanking_eye", classId: "ranger", name: "Flanking Eye", kind: "passive", tags: ["crit", "positioning"], cost: 0, cooldown: 0, targeting: "none", range: 0, timing: T(0, 0, 0), coeff: { base: 0, perRank: 0 }, damageType: "physical", allowedModifiers: [], vfx: "", sfx: "", threat: "ignore", maxRank: 3, reqLevel: 4, passive: { critChance: 3, dmgAtRange: 8 }, summary: "Critical chance, and damage against targets more than 6 m away.", icon: "◈" },
  { id: "rot_tips", classId: "ranger", name: "Rot Tips", kind: "passive", tags: ["ailment", "blight"], cost: 0, cooldown: 0, targeting: "none", range: 0, timing: T(0, 0, 0), coeff: { base: 0, perRank: 0 }, damageType: "blight", allowedModifiers: [], vfx: "", sfx: "", threat: "ignore", maxRank: 3, reqLevel: 4, passive: { blightChance: 8, pctBlight: 10 }, summary: "Projectiles may apply Blight; Blight damage.", icon: "☣" },
  { id: "fleetfoot", classId: "ranger", name: "Fleetfoot", kind: "passive", tags: ["evade", "movement"], cost: 0, cooldown: 0, targeting: "none", range: 0, timing: T(0, 0, 0), coeff: { base: 0, perRank: 0 }, damageType: "physical", allowedModifiers: [], vfx: "", sfx: "", threat: "ignore", maxRank: 3, reqLevel: 6, passive: { evadeRecovery: 12, moveSpeed: 3 }, summary: "Evade charge recovery and move speed.", icon: "➠" },
  { id: "steady_breath", classId: "ranger", name: "Steady Breath", kind: "passive", tags: ["resource"], cost: 0, cooldown: 0, targeting: "none", range: 0, timing: T(0, 0, 0), coeff: { base: 0, perRank: 0 }, damageType: "physical", allowedModifiers: [], vfx: "", sfx: "", threat: "ignore", maxRank: 3, reqLevel: 6, passive: { focusRegen: 0.6 }, summary: "Focus regeneration; each detonated mark restores 2 Focus per rank.", icon: "≋" },
  { id: "thousand_trails", classId: "ranger", name: "Thousand Trails", kind: "capstone", tags: ["mark", "capstone"], cost: 0, cooldown: 0, targeting: "none", range: 0, timing: T(0, 0, 0), coeff: { base: 0, perRank: 0 }, damageType: "physical", allowedModifiers: [], vfx: "", sfx: "", threat: "ignore", maxRank: 1, reqLevel: 12, prereq: ["keen_trail"], exclusiveWith: "patient_hunter", passive: { markDamage: 20 }, summary: "Mark detonations spread 2 Trace marks to each enemy within 4 m. Quickshot always marks.", icon: "✵" },
  { id: "patient_hunter", classId: "ranger", name: "Patient Hunter", kind: "capstone", tags: ["trap", "capstone"], cost: 0, cooldown: 0, targeting: "none", range: 0, timing: T(0, 0, 0), coeff: { base: 0, perRank: 0 }, damageType: "physical", allowedModifiers: [], vfx: "", sfx: "", threat: "ignore", maxRank: 1, reqLevel: 12, prereq: ["trapwright"], exclusiveWith: "thousand_trails", passive: { trapDamage: 40 }, summary: "Standing still for 1 s empowers your next shot (+150% damage, pierces). Traps deal double damage to rooted targets.", icon: "⌛" },
];

export const SKILL_BY_ID: Record<string, SkillDef> = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

export function classSkills(cls: ClassId): SkillDef[] {
  return SKILLS.filter((s) => s.classId === cls);
}

export function basicSkill(cls: ClassId): string {
  return cls === "cinder" ? "iron_litany" : "quickshot";
}
export function coreSkill(cls: ClassId): string {
  return cls === "cinder" ? "brand_arc" : "splinter_volley";
}

/** Damage coefficient for a skill at a given rank (with +rank gear bonuses already summed into rank). */
export function skillCoeff(s: SkillDef, rank: number): number {
  return s.coeff.base + s.coeff.perRank * Math.max(0, rank - 1);
}

export function skillCooldown(s: SkillDef, cdr: number): number {
  return s.cooldown * (1 - Math.min(cdr, 40) / 100);
}
