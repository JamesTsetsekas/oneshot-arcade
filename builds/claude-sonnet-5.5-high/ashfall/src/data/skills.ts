// Skill definitions for both classes. The simulation and tooltips both read these tables.
import type { ClassId, DamageType } from '../sim/types';

export type SkillKind = 'basic' | 'core' | 'active';
export type Targeting = 'enemy' | 'ground' | 'self' | 'dir';
export type SkillTag = 'melee' | 'projectile' | 'area' | 'ember' | 'physical' | 'frost' | 'blight' | 'trap' | 'mark' | 'burn' | 'buff' | 'movement' | 'control' | 'spell';

export interface SkillDef {
  id: string;
  cls: ClassId;
  name: string;
  kind: SkillKind;
  tags: SkillTag[];
  cost: number; // Focus
  cooldown: number; // seconds (0 = none)
  charges?: number;
  targeting: Targeting;
  range: number; // cast / approach range
  time: { wind: number; total: number; move: number }; // seconds at speed 1: impact moment, full duration, movement allowed after
  exec: string;
  params: Record<string, number>;
  dmg: Partial<Record<DamageType, number>>; // weapon damage coefficients
  ailment?: { kind: 'burn' | 'blight' | 'slow' | 'stun' | 'root'; chance: number; dur: number; mag: number };
  vfx: string;
  sfx: string;
  cancel: number; // fraction of animation after which evade may cancel
  threat: 'light' | 'heavy' | 'control' | 'none'; // how AI responds to it
  unlock: number; // minimum level to learn
  mods: string[]; // modifier slots / allowed support tags
  desc: string;
}

export const SKILLS: SkillDef[] = [
  // ------------------------------------------------------------ Cinder Vow
  {
    id: 'iron_litany', cls: 'cinder', name: 'Iron Litany', kind: 'basic', tags: ['melee', 'physical'], cost: 0, cooldown: 0, targeting: 'enemy', range: 2.3,
    time: { wind: 0.2, total: 0.5, move: 0.34 }, exec: 'litany', params: { arc: 2.1, reach: 2.5, focusGain: 6, heat: 3, combo: 3, waveDmg: 0.8 }, dmg: { phys: 1.0 },
    vfx: 'swing', sfx: 'mace', cancel: 0.6, threat: 'light', unlock: 1, mods: ['melee'],
    desc: 'A three-strike mace sequence. Each strike builds Focus; the third emits a short frontal wave.',
  },
  {
    id: 'brand_arc', cls: 'cinder', name: 'Brand Arc', kind: 'core', tags: ['melee', 'area', 'ember', 'burn'], cost: 18, cooldown: 0, targeting: 'dir', range: 3.2,
    time: { wind: 0.24, total: 0.62, move: 0.42 }, exec: 'arc', params: { arc: 2.7, reach: 3.7, burnBonus: 0.5 }, dmg: { ember: 1.75 },
    ailment: { kind: 'burn', chance: 0.45, dur: 3, mag: 0.35 }, vfx: 'flameArc', sfx: 'flame', cancel: 0.65, threat: 'light', unlock: 1, mods: ['area', 'burn'],
    desc: 'A sweeping flame attack. Deals bonus damage to burning targets. Right-click core skill.',
  },
  {
    id: 'bastion_step', cls: 'cinder', name: 'Bastion Step', kind: 'active', tags: ['melee', 'movement', 'control', 'physical'], cost: 10, cooldown: 7, targeting: 'dir', range: 6,
    time: { wind: 0.05, total: 0.4, move: 0.3 }, exec: 'rush', params: { dist: 5.5, width: 1.6, guard: 2, guardMag: 0.4 }, dmg: { phys: 1.2 },
    ailment: { kind: 'stun', chance: 1, dur: 0.8, mag: 1 }, vfx: 'rush', sfx: 'rush', cancel: 0.5, threat: 'control', unlock: 3, mods: ['movement'],
    desc: 'Short shield rush. Staggers light enemies in your path and grants Guard (reduced damage) for 2 seconds.',
  },
  {
    id: 'cinder_ring', cls: 'cinder', name: 'Cinder Ring', kind: 'active', tags: ['area', 'ember', 'spell'], cost: 24, cooldown: 5, targeting: 'self', range: 0,
    time: { wind: 0.65, total: 0.85, move: 0.65 }, exec: 'ring', params: { radius: 4.3, telegraph: 0.65, knock: 2.2 }, dmg: { ember: 3.2 },
    ailment: { kind: 'burn', chance: 0.6, dur: 3, mag: 0.4 }, vfx: 'ring', sfx: 'ring', cancel: 0.4, threat: 'heavy', unlock: 5, mods: ['area'],
    desc: 'Delayed circular eruption centred on you. Clear 650 ms telegraph; knocks enemies back.',
  },
  {
    id: 'vow_chain', cls: 'cinder', name: 'Vow Chain', kind: 'active', tags: ['projectile', 'control', 'physical'], cost: 14, cooldown: 8, targeting: 'dir', range: 12,
    time: { wind: 0.2, total: 0.5, move: 0.35 }, exec: 'chain', params: { range: 12, speed: 30 }, dmg: { phys: 1.3 },
    vfx: 'chain', sfx: 'chain', cancel: 0.5, threat: 'control', unlock: 7, mods: ['projectile'],
    desc: 'Skillshot chain. Pulls light enemies to you; pulls you toward heavy targets.',
  },
  {
    id: 'furnace_heart', cls: 'cinder', name: 'Furnace Heart', kind: 'active', tags: ['buff', 'ember'], cost: 0, cooldown: 18, targeting: 'self', range: 0,
    time: { wind: 0.1, total: 0.35, move: 0.2 }, exec: 'stance', params: { dur: 10, drain: 6, speed: 0.3, convert: 0.5 }, dmg: {},
    vfx: 'stance', sfx: 'stance', cancel: 0.3, threat: 'none', unlock: 9, mods: ['buff'],
    desc: 'Stance that burns Heat for +30% attack speed and converts half of your physical damage to Ember. Lasts until Heat runs out or 10s.',
  },
  {
    id: 'ashen_standard', cls: 'cinder', name: 'Ashen Standard', kind: 'active', tags: ['buff', 'area', 'control'], cost: 20, cooldown: 14, targeting: 'ground', range: 8,
    time: { wind: 0.3, total: 0.6, move: 0.45 }, exec: 'standard', params: { dur: 10, radius: 5.5, taunt: 7, defense: 0.25 }, dmg: {},
    vfx: 'standard', sfx: 'standard', cancel: 0.5, threat: 'none', unlock: 12, mods: ['area', 'buff'],
    desc: 'Plant a standard that grants 25% damage reduction inside its radius and periodically taunts nearby lesser enemies.',
  },
  // ------------------------------------------------------------ Veil Ranger
  {
    id: 'quickshot', cls: 'ranger', name: 'Quickshot', kind: 'basic', tags: ['projectile', 'physical'], cost: 0, cooldown: 0, targeting: 'enemy', range: 13,
    time: { wind: 0.16, total: 0.44, move: 0.3 }, exec: 'shot', params: { speed: 28, range: 15, focusGain: 5, moveThreshold: 2 }, dmg: { phys: 1.0 },
    vfx: 'arrow', sfx: 'bow', cancel: 0.55, threat: 'light', unlock: 1, mods: ['projectile'],
    desc: 'Basic bow shot. Firing after moving at least 2 m adds a Trace mark to the target.',
  },
  {
    id: 'splinter_volley', cls: 'ranger', name: 'Splinter Volley', kind: 'core', tags: ['projectile', 'area', 'physical'], cost: 16, cooldown: 0, targeting: 'dir', range: 8,
    time: { wind: 0.2, total: 0.55, move: 0.38 }, exec: 'cone', params: { arc: 0.95, reach: 8.5, crowd: 0.08 }, dmg: { phys: 1.55 },
    ailment: { kind: 'slow', chance: 0.25, dur: 1.5, mag: 0.3 }, vfx: 'volley', sfx: 'volley', cancel: 0.6, threat: 'light', unlock: 1, mods: ['projectile', 'area'],
    desc: 'A short cone of arrows, stronger against clustered enemies (+8% per extra target hit). Right-click core skill.',
  },
  {
    id: 'ghostline', cls: 'ranger', name: 'Ghostline', kind: 'active', tags: ['projectile', 'mark', 'frost'], cost: 20, cooldown: 2.5, targeting: 'dir', range: 16,
    time: { wind: 0.3, total: 0.6, move: 0.45 }, exec: 'pierce', params: { speed: 40, range: 17, detonate: 0.85 }, dmg: { phys: 1.3 },
    vfx: 'ghost', sfx: 'ghost', cancel: 0.55, threat: 'light', unlock: 3, mods: ['projectile', 'mark'],
    desc: 'A piercing arrow that detonates Trace marks on every enemy it passes through for Frost damage per mark.',
  },
  {
    id: 'snare_bloom', cls: 'ranger', name: 'Snare Bloom', kind: 'active', tags: ['trap', 'control', 'blight'], cost: 12, cooldown: 4, charges: 2, targeting: 'ground', range: 9,
    time: { wind: 0.2, total: 0.45, move: 0.3 }, exec: 'trap', params: { arm: 0.5, radius: 1.7, life: 14, rootDur: 2.5, slowDur: 3 }, dmg: { blight: 1.2 },
    vfx: 'trap', sfx: 'trap', cancel: 0.5, threat: 'none', unlock: 5, mods: ['trap'],
    desc: 'A placed trap that arms after 500 ms. Roots lesser enemies; slows elites and bosses. Holds 2 charges.',
  },
  {
    id: 'mothcloak', cls: 'ranger', name: 'Mothcloak', kind: 'active', tags: ['buff', 'movement'], cost: 10, cooldown: 12, targeting: 'self', range: 0,
    time: { wind: 0.05, total: 0.3, move: 0.1 }, exec: 'cloak', params: { dur: 1.5, speed: 0.3 }, dmg: {},
    vfx: 'cloak', sfx: 'cloak', cancel: 0.2, threat: 'none', unlock: 7, mods: ['buff'],
    desc: '1.5 s of camouflage broken by attacking. Grants movement speed and one guaranteed evade. Not permanent invisibility.',
  },
  {
    id: 'backstep_flask', cls: 'ranger', name: 'Backstep Flask', kind: 'active', tags: ['movement', 'blight', 'area', 'trap'], cost: 14, cooldown: 7, targeting: 'dir', range: 5,
    time: { wind: 0.05, total: 0.36, move: 0.3 }, exec: 'backstep', params: { dist: 5.2, radius: 2.6, life: 4, tick: 0.5 }, dmg: { blight: 0.55 },
    ailment: { kind: 'slow', chance: 1, dur: 1.2, mag: 0.35 }, vfx: 'flask', sfx: 'flask', cancel: 0.4, threat: 'none', unlock: 9, mods: ['movement', 'area'],
    desc: 'Leap away from the cursor, leaving a Blight pool at your origin that damages and slows.',
  },
  {
    id: 'horizon_call', cls: 'ranger', name: 'Horizon Call', kind: 'active', tags: ['projectile', 'area', 'physical'], cost: 38, cooldown: 24, targeting: 'dir', range: 12,
    time: { wind: 0.35, total: 0.8, move: 0.6 }, exec: 'barrage', params: { length: 13, radius: 2.0, bursts: 9, span: 1.7 }, dmg: { phys: 0.62 },
    vfx: 'barrage', sfx: 'barrage', cancel: 0.4, threat: 'heavy', unlock: 12, mods: ['projectile', 'area'],
    desc: 'Ultimate. Rains a moving line of arrows across a targeted corridor.',
  },
];
export const SKILL_BY_ID: Record<string, SkillDef> = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
export const CLASS_SKILLS: Record<ClassId, SkillDef[]> = {
  cinder: SKILLS.filter((s) => s.cls === 'cinder'),
  ranger: SKILLS.filter((s) => s.cls === 'ranger'),
};

// ---------------------------------------------------------------- passives & capstones
export interface PassiveDef {
  id: string;
  cls: ClassId;
  name: string;
  maxRank: number;
  req: number; // level requirement
  perRank: Record<string, number>; // stat modifiers per rank
  desc: string;
  capstone?: boolean;
  exclusiveWith?: string;
}
export const PASSIVES: PassiveDef[] = [
  { id: 'bulwark_temper', cls: 'cinder', name: 'Bulwark Temper', maxRank: 3, req: 2, perRank: { blockChance: 4, heatGain: 8 }, desc: 'Blocking and enduring damage builds more Heat.' },
  { id: 'kindling', cls: 'cinder', name: 'Kindling', maxRank: 3, req: 3, perRank: { burnDmgPct: 14, ailmentChance: 4 }, desc: 'Burning damage and Ember ailment chance.' },
  { id: 'crushing_zeal', cls: 'cinder', name: 'Crushing Zeal', maxRank: 3, req: 4, perRank: { twoHandDmg: 10 }, desc: 'Two-handed burst: increased damage while wielding a two-handed weapon.' },
  { id: 'shieldwright', cls: 'cinder', name: 'Shieldwright', maxRank: 3, req: 4, perRank: { shieldArmorPct: 8, blockChance: 2 }, desc: 'One-handed defence: increased armor while wielding a shield.' },
  { id: 'slow_ember', cls: 'cinder', name: 'Slow Ember', maxRank: 3, req: 6, perRank: { potionPotency: 10, potionFocus: 5 }, desc: 'Potion efficiency; potions also stoke Heat.' },
  { id: 'retaliation', cls: 'cinder', name: 'Retaliation', maxRank: 3, req: 8, perRank: { thorns: 4 }, desc: 'Enemies that strike you in melee take Ember damage.' },
  { id: 'living_crucible', cls: 'cinder', name: 'Living Crucible', maxRank: 1, req: 14, perRank: { crucible: 1 }, capstone: true, exclusiveWith: 'unbroken_oath', desc: 'Capstone. At full Heat you erupt in an Ember nova, spend all Heat and refill Focus. Heat cycles faster.' },
  { id: 'unbroken_oath', cls: 'cinder', name: 'Unbroken Oath', maxRank: 1, req: 14, perRank: { oath: 1 }, capstone: true, exclusiveWith: 'living_crucible', desc: 'Capstone. Guard lasts longer, doubles retaliation and each block grants brief Guard.' },
  { id: 'keen_trace', cls: 'ranger', name: 'Keen Trace', maxRank: 3, req: 2, perRank: { markDmgPct: 15, markDur: 1 }, desc: 'Trace marks last longer and detonate harder.' },
  { id: 'snare_craft', cls: 'ranger', name: 'Snare Craft', maxRank: 3, req: 3, perRank: { trapDmgPct: 16 }, desc: 'Traps and pools deal more damage.' },
  { id: 'hunters_angle', cls: 'ranger', name: "Hunter's Angle", maxRank: 3, req: 4, perRank: { farCrit: 4 }, desc: 'Critical positioning: bonus critical chance against targets more than 7 m away.' },
  { id: 'venom_tips', cls: 'ranger', name: 'Venom Tips', maxRank: 3, req: 4, perRank: { ailmentChance: 8, dmgBlightPct: 8 }, desc: 'Ailment application: arrows can poison with Blight.' },
  { id: 'fleetfoot', cls: 'ranger', name: 'Fleetfoot', maxRank: 3, req: 6, perRank: { evadeRec: 12, moveSpeedPct: 3 }, desc: 'Evasive step recovers faster and you move quicker.' },
  { id: 'steady_breath', cls: 'ranger', name: 'Steady Breath', maxRank: 3, req: 8, perRank: { focusRegen: 0.6, focusOnHit: 0.5 }, desc: 'Resource recovery: Focus returns faster.' },
  { id: 'thousand_trails', cls: 'ranger', name: 'Thousand Trails', maxRank: 1, req: 14, perRank: { trails: 1 }, capstone: true, exclusiveWith: 'patient_hunter', desc: 'Capstone. Marks chain to nearby enemies when detonated and arrows apply a mark more easily.' },
  { id: 'patient_hunter', cls: 'ranger', name: 'Patient Hunter', maxRank: 1, req: 14, perRank: { patient: 1 }, capstone: true, exclusiveWith: 'thousand_trails', desc: 'Capstone. Traps and Ghostline deal heavy bonus damage; your basic attack is slower.' },
];
export const PASSIVE_BY_ID: Record<string, PassiveDef> = Object.fromEntries(PASSIVES.map((p) => [p.id, p]));

export interface ClassDef {
  id: ClassId;
  name: string;
  title: string;
  blurb: string;
  resource: string;
  attrs: { might: number; finesse: number; will: number; vigor: number };
  startWeapon: string;
  startOff?: string;
  resourceName: string;
  playstyle: string[];
}
export const CLASSES: Record<ClassId, ClassDef> = {
  cinder: {
    id: 'cinder', name: 'Cinder Vow', title: 'Armored battlemage',
    blurb: 'Sworn to a buried flame. Converts blows endured into Heat, then spends it in explosive control.',
    resource: 'Heat', resourceName: 'Heat', attrs: { might: 14, finesse: 8, will: 11, vigor: 12 }, startWeapon: 'mace_1', startOff: 'shield_1',
    playstyle: ['Close range', 'Tanky', 'Area control'],
  },
  ranger: {
    id: 'ranger', name: 'Veil Ranger', title: 'Mobile bow and trap specialist',
    blurb: 'Marks quarry through movement, then detonates marks and controls lanes with traps.',
    resource: 'Trace', resourceName: 'Trace', attrs: { might: 8, finesse: 14, will: 10, vigor: 10 }, startWeapon: 'bow_1',
    playstyle: ['Ranged', 'Mobile', 'Marks and traps'],
  },
};

export const MAX_LEVEL = 20;
export const SKILL_MAX_RANK = 5;
export function xpForLevel(level: number): number {
  return Math.round(40 + 24 * level + 2.4 * level * level);
}
export function respecCost(level: number): number {
  return level <= 8 ? 0 : level * 18;
}
