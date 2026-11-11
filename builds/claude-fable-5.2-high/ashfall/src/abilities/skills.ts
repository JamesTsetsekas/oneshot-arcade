import type { ClassId, DamageType, Stats, StatusId } from '../entity-combat/types';
import { fmt } from '../core/math';

/** Single source of truth for skills: the simulation executes these numbers and tooltips are derived from them. */
export interface SkillDef {
  id: string; cls: ClassId; name: string; kind: 'basic' | 'active' | 'passive' | 'capstone';
  tags: string[]; cost: number; cooldown: number; charges?: number;
  targeting: 'enemy' | 'direction' | 'ground' | 'self';
  range: number; windup: number; total: number; cancel: number;
  coef: number; dtype: DamageType;
  ailment?: { id: StatusId; chance: number; t: number; power: number };
  mods: string[]; vfx: string; sfx: string;
  threat: 'none' | 'interrupt' | 'scatter' | 'taunt' | 'lose-target' | 'root';
  effect: string; p: Record<string, number>;
  unlock: number; maxRank: number; perRank: number;
  desc: string; icon: string; stat?: Record<string, number>; excl?: string;
}
const A = (d: Partial<SkillDef> & Pick<SkillDef, 'id' | 'cls' | 'name' | 'effect' | 'desc' | 'icon'>): SkillDef => ({
  kind: 'active', tags: [], cost: 0, cooldown: 0, targeting: 'direction', range: 3, windup: 250, total: 550, cancel: 0.7,
  coef: 1, dtype: 'physical', mods: ['dmgPct'], vfx: d.id, sfx: d.id, threat: 'none', p: {}, unlock: 1, maxRank: 5, perRank: 0.12, ...d,
});
const P = (id: string, cls: ClassId, name: string, icon: string, desc: string, stat: Record<string, number>, unlock = 3): SkillDef =>
  A({ id, cls, name, icon, desc, stat, kind: 'passive', effect: 'passive', maxRank: 3, unlock, targeting: 'self' });
const C = (id: string, cls: ClassId, name: string, icon: string, desc: string, excl: string): SkillDef =>
  A({ id, cls, name, icon, desc, excl, kind: 'capstone', effect: 'passive', maxRank: 1, unlock: 15, targeting: 'self', stat: { ['cap_' + id]: 1 } });

export const SKILLS: SkillDef[] = [
  // ───────── Cinder Vow ─────────
  A({ id: 'iron_litany', cls: 'cinder', name: 'Iron Litany', kind: 'basic', icon: '⚒', tags: ['basic', 'melee', 'physical'], targeting: 'enemy',
    range: 2.5, windup: 230, total: 500, cancel: 0.68, coef: 1, effect: 'arc', mods: ['dmgPct', 'meleePct', 'basicPct'],
    p: { r: 2.9, angle: 1.9, focus: 9, waveCoef: 0.7, waveR: 5.2, waveAngle: 0.95 }, maxRank: 1, perRank: 0,
    desc: 'Mace sequence dealing {dmg} physical damage in a short arc and generating {p.focus} Focus per swing. Every third hit emits a frontal wave for {waveDmg} damage.' }),
  A({ id: 'brand_arc', cls: 'cinder', name: 'Brand Arc', icon: '☄', tags: ['core', 'melee', 'ember'], cost: 25, range: 3.2, windup: 270, total: 600, cancel: 0.65,
    coef: 1.75, dtype: 'ember', effect: 'arc', mods: ['dmgPct', 'meleePct', 'emberPct', 'skillPct'], threat: 'none',
    ailment: { id: 'burn', chance: 0.6, t: 4, power: 0.3 }, p: { r: 3.7, angle: 2.9, vsBurn: 0.4 },
    desc: 'Sweep a wide arc of flame for {dmg} Ember damage. {ail}% chance to Burn. Deals {vsBurnPct}% more damage to Burning targets.' }),
  A({ id: 'bastion_step', cls: 'cinder', name: 'Bastion Step', icon: '⛊', tags: ['utility', 'melee', 'physical', 'movement'], cooldown: 7, windup: 60, total: 330, cancel: 0.9,
    coef: 0.9, effect: 'dash', mods: ['dmgPct', 'meleePct', 'skillPct'], threat: 'interrupt', unlock: 2,
    p: { dist: 5.5, time: 0.25, guard: 0.2, guardT: 2, stun: 0.9, width: 1.8 },
    desc: 'Rush {p.dist} m behind your shield, dealing {dmg} damage, interrupting light enemies and gaining Guard ({guardPct}% of max Health) for {p.guardT} s.' }),
  A({ id: 'cinder_ring', cls: 'cinder', name: 'Cinder Ring', icon: '◎', tags: ['utility', 'ember', 'area'], cooldown: 9, targeting: 'self', windup: 650, total: 800, cancel: 0.85,
    coef: 2.6, dtype: 'ember', effect: 'ring', mods: ['dmgPct', 'emberPct', 'skillPct'], threat: 'scatter', unlock: 4,
    ailment: { id: 'burn', chance: 0.5, t: 4, power: 0.3 }, p: { r: 4.4, heatBonus: 0.5 },
    desc: 'After a {windupS} s build-up, erupt for {dmg} Ember damage within {p.r} m. Consumes all Heat for up to +{heatPct}% damage.' }),
  A({ id: 'vow_chain', cls: 'cinder', name: 'Vow Chain', icon: '⛓', tags: ['utility', 'physical', 'control'], cooldown: 10, windup: 180, total: 430, cancel: 0.8,
    coef: 0.9, effect: 'chain', mods: ['dmgPct', 'skillPct'], threat: 'interrupt', unlock: 6, range: 10, p: { range: 10, speed: 30, stun: 0.8 },
    desc: 'Hurl a chain up to {p.range} m for {dmg} damage. Light enemies are dragged to you and stunned {p.stun} s; heavy targets drag you to them instead.' }),
  A({ id: 'furnace_heart', cls: 'cinder', name: 'Furnace Heart', icon: '♨', tags: ['stance', 'ember'], cooldown: 16, targeting: 'self', windup: 0, total: 200, cancel: 0.2,
    coef: 0, dtype: 'ember', effect: 'furnace', mods: [], unlock: 9, perRank: 0.08, p: { dur: 10, drain: 8, as: 30, conv: 0.35, minHeat: 20 },
    desc: 'Requires {p.minHeat} Heat. Enter a stance that drains {p.drain} Heat/s: +{p.as}% attack speed and your hits deal {convPct}% extra Ember damage. Ends when Heat runs out.' }),
  A({ id: 'ashen_standard', cls: 'cinder', name: 'Ashen Standard', icon: '⚑', tags: ['ultimate', 'defense', 'control'], cooldown: 24, targeting: 'self', windup: 250, total: 500, cancel: 0.8,
    coef: 0, effect: 'standard', mods: [], threat: 'taunt', unlock: 12, perRank: 0.06, p: { dur: 10, r: 6.5, def: 25, taunt: 2.5 },
    desc: 'Plant a standard for {p.dur} s. Within {p.r} m you take {defPct}% less damage, and lesser enemies are taunted to attack the standard every {p.taunt} s.' }),
  P('tempered_guard', 'cinder', 'Tempered Guard', '▣', '+{block}% block chance and +{heatGain}% Heat gained.', { block: 4, heatGain: 15 }),
  P('kindling', 'cinder', 'Kindling', '✹', 'Burn deals +{burnPct}% damage and ailment chance is +{ailmentChance}%.', { burnPct: 20, ailmentChance: 8 }),
  P('heavy_hands', 'cinder', 'Heavy Hands', '▰', '+{twoHandPct}% damage while wielding a two-handed weapon.', { twoHandPct: 9 }),
  P('shield_discipline', 'cinder', 'Shield Discipline', '⬒', '+{shieldArmorPct}% armor and +{resAll}% all resistances while holding a shield.', { shieldArmorPct: 12, resAll: 2 }),
  P('deep_draught', 'cinder', 'Deep Draught', '⚱', 'Potions restore +{potionPct}% more.', { potionPct: 12 }),
  P('thornmail', 'cinder', 'Thornmail', '✸', 'Melee attackers take {thorns} Ember damage (scales with level).', { thorns: 6 }),
  C('living_crucible', 'cinder', 'Living Crucible', '❂', 'Heat-spending skills refund 35% of Heat spent and Cinder Ring recharges 30% faster.', 'unbroken_oath'),
  C('unbroken_oath', 'cinder', 'Unbroken Oath', '⛨', 'Guard is 50% stronger and, when it ends, retaliates with an Ember nova for 150% weapon damage.', 'living_crucible'),
  // ───────── Veil Ranger ─────────
  A({ id: 'quickshot', cls: 'ranger', name: 'Quickshot', kind: 'basic', icon: '➶', tags: ['basic', 'ranged', 'physical'], targeting: 'enemy',
    range: 13, windup: 170, total: 420, cancel: 0.62, coef: 1, effect: 'shot', mods: ['dmgPct', 'rangedPct', 'basicPct'],
    ailment: { id: 'blight', chance: 0, t: 4, power: 0.25 }, p: { speed: 30, focus: 8, moveReq: 2, maxTrace: 3 }, maxRank: 1, perRank: 0,
    desc: 'Loose an arrow for {dmg} physical damage, generating {p.focus} Focus. After moving {p.moveReq} m, the next shot applies a Trace mark (max {p.maxTrace}).' }),
  A({ id: 'splinter_volley', cls: 'ranger', name: 'Splinter Volley', icon: '⋔', tags: ['core', 'ranged', 'physical'], cost: 22, range: 9, windup: 200, total: 470, cancel: 0.65,
    coef: 0.72, effect: 'volley', mods: ['dmgPct', 'rangedPct', 'skillPct'], threat: 'scatter', p: { count: 5, spread: 0.75, range: 9, speed: 28 },
    desc: 'Fire a cone of {p.count} arrows, each dealing {dmg} physical damage. Devastating against clustered enemies at short range.' }),
  A({ id: 'ghostline', cls: 'ranger', name: 'Ghostline', icon: '➳', tags: ['utility', 'ranged', 'physical', 'mark'], cost: 15, cooldown: 4, range: 17, windup: 300, total: 560, cancel: 0.7,
    coef: 1.8, effect: 'ghostline', mods: ['dmgPct', 'rangedPct', 'skillPct'], unlock: 2, p: { range: 17, speed: 44, markCoef: 0.9 },
    desc: 'A piercing arrow for {dmg} damage that detonates Trace marks, each mark dealing {markDmg} additional damage.' }),
  A({ id: 'snare_bloom', cls: 'ranger', name: 'Snare Bloom', icon: '✿', tags: ['utility', 'trap', 'blight', 'control'], cooldown: 8, charges: 2, targeting: 'ground', range: 10,
    windup: 140, total: 340, cancel: 0.7, coef: 1.3, dtype: 'blight', effect: 'trap', mods: ['dmgPct', 'trapPct', 'blightPct', 'skillPct'], threat: 'root', unlock: 4,
    p: { arm: 0.5, r: 3, trig: 1.6, root: 2.5, slow: 0.4, life: 20 },
    desc: 'Place a trap that arms after {p.arm} s. When triggered it deals {dmg} Blight damage within {p.r} m, rooting lesser enemies for {rootT} s and slowing elites and bosses.' }),
  A({ id: 'mothcloak', cls: 'ranger', name: 'Mothcloak', icon: '☾', tags: ['utility', 'movement', 'stealth'], cooldown: 12, targeting: 'self', windup: 0, total: 150, cancel: 0.1,
    coef: 0, effect: 'cloak', mods: [], threat: 'lose-target', unlock: 6, perRank: 0.1, p: { dur: 1.5, move: 40 },
    desc: 'Vanish for {cloakT} s: enemies lose you, you move {p.move}% faster and the next hit is evaded. Attacking breaks the cloak; your first shot from it always crits.' }),
  A({ id: 'backstep_flask', cls: 'ranger', name: 'Backstep Flask', icon: '⚗', tags: ['utility', 'movement', 'blight', 'area'], cooldown: 8, windup: 50, total: 330, cancel: 0.9,
    coef: 0.45, dtype: 'blight', effect: 'backstep', mods: ['dmgPct', 'blightPct', 'skillPct'], threat: 'scatter', unlock: 9, p: { dist: 5.5, time: 0.28, poolR: 2.8, poolDur: 4, tick: 0.5 },
    desc: 'Leap {p.dist} m away from the cursor and shatter a flask where you stood: a Blight pool deals {dmg} damage every {p.tick} s for {p.poolDur} s and slows.' }),
  A({ id: 'horizon_call', cls: 'ranger', name: 'Horizon Call', icon: '☼', tags: ['ultimate', 'ranged', 'physical', 'area'], cooldown: 36, targeting: 'direction', range: 14, windup: 400, total: 700, cancel: 0.8,
    coef: 0.85, effect: 'barrage', mods: ['dmgPct', 'rangedPct', 'skillPct'], threat: 'scatter', unlock: 12, p: { len: 15, width: 3.6, dur: 2.4, tick: 0.2 },
    desc: 'Call a rain of arrows that sweeps a {p.len} m corridor over {p.dur} s, dealing {dmg} damage per hit to everything it passes.' }),
  P('deep_traces', 'ranger', 'Deep Traces', '⌖', 'Trace detonations deal +{traceDmg}% damage.', { traceDmg: 15 }),
  P('trapcraft', 'ranger', 'Trapcraft', '✣', 'Traps deal +{trapPct}% damage and root {trapDur}% longer.', { trapPct: 15, trapDur: 15 }),
  P('high_ground', 'ranger', 'Killing Distance', '◬', '+{farCrit}% critical chance against enemies farther than 8 m.', { farCrit: 6 }),
  P('venom_tips', 'ranger', 'Venom Tips', '☣', '+{ailmentChance}% chance for hits to apply Blight, and Blight deals +{blightPct}% damage.', { ailmentChance: 8, blightPct: 10 }),
  P('fleetfoot', 'ranger', 'Fleetfoot', '➤', 'Evasive step recharges {evadeCdr}% faster and you move {moveSpeed}% faster.', { evadeCdr: 12, moveSpeed: 3 }),
  P('second_wind', 'ranger', 'Second Wind', '❃', '+{focusRegen} Focus per second and +{focusOnHit} Focus per hit.', { focusRegen: 1.5, focusOnHit: 1 }),
  C('thousand_trails', 'ranger', 'Thousand Trails', '❖', 'Detonated Trace marks leap to another enemy within 7 m as a fresh mark and deal their damage there too.', 'patient_hunter'),
  C('patient_hunter', 'ranger', 'Patient Hunter', '◈', 'Snare Bloom gains +1 charge, and Ghostline deals 60% more damage if you have not moved for 0.6 s.', 'thousand_trails'),
];
export const SKILL: Record<string, SkillDef> = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
export const classSkills = (cls: ClassId) => SKILLS.filter((s) => s.cls === cls);
export const basicOf = (cls: ClassId) => (cls === 'cinder' ? SKILL.iron_litany : SKILL.quickshot);

export const CLASSES: Record<ClassId, { name: string; blurb: string; resource: string; attrs: { might: number; finesse: number; will: number; vigor: number } }> = {
  cinder: { name: 'Cinder Vow', blurb: 'Armored close-range battlemage. Endure and block to build Heat, then spend it on explosive control.', resource: 'Heat', attrs: { might: 8, finesse: 3, will: 4, vigor: 7 } },
  ranger: { name: 'Veil Ranger', blurb: 'Mobile bow and trap specialist. Keep moving to mark targets with Trace, then detonate marks or lock down lanes.', resource: 'Stride', attrs: { might: 3, finesse: 9, will: 5, vigor: 5 } },
};

/** Rank multiplier applied to a skill's damage coefficient (or duration/strength for non-damaging skills). */
export const rankMul = (def: SkillDef, rank: number) => 1 + def.perRank * Math.max(0, rank - 1);
export const skillRank = (ranks: Record<string, number>, stats: Stats, id: string) => {
  const base = ranks[id] ?? 0;
  if (!base) return 0;
  const def = SKILL[id];
  const bonus = def.kind === 'active' ? (stats['rank_' + id] ?? 0) + (stats.rankAll ?? 0) : 0;
  return base + bonus;
};

/** Average pre-mitigation damage for a coefficient, from the same stats the hit resolver uses. */
export function previewDamage(stats: Stats, def: SkillDef, coef: number): [number, number] {
  let pct = 0;
  for (const m of def.mods) pct += stats[m] ?? 0;
  const mul = coef * (1 + pct / 100);
  return [stats.dmgMin * mul, stats.dmgMax * mul];
}
export function skillTooltip(def: SkillDef, rank: number, stats: Stats): { lines: string[]; desc: string } {
  const r = Math.max(1, rank);
  const mul = rankMul(def, r);
  const lines: string[] = [];
  if (def.kind === 'passive' || def.kind === 'capstone') {
    const desc = def.desc.replace(/\{(\w+)\}/g, (_, k) => fmt((def.stat?.[k] ?? 0) * r * (k === 'thorns' ? 1 : 1)));
    return { lines, desc };
  }
  if (def.cost) lines.push(`Cost: ${def.cost} Focus`);
  if (def.cooldown) lines.push(`Cooldown: ${fmt(def.cooldown)} s${def.charges ? ` · ${def.charges} charges` : ''}`);
  lines.push(`Cast: ${(def.windup / 1000).toFixed(2)} s wind-up · ${def.targeting}`);
  const d = previewDamage(stats, def, def.coef * mul);
  const rng = (a: [number, number]) => `${Math.round(a[0])}–${Math.round(a[1])}`;
  const vals: Record<string, string> = {
    dmg: rng(d), ail: fmt(Math.min(100, ((def.ailment?.chance ?? 0) * 100) + (stats.ailmentChance ?? 0))),
    waveDmg: rng(previewDamage(stats, def, (def.p.waveCoef ?? 0) * mul)), vsBurnPct: fmt((def.p.vsBurn ?? 0) * 100),
    guardPct: fmt((def.p.guard ?? 0) * 100 * mul), windupS: (def.windup / 1000).toFixed(2), heatPct: fmt((def.p.heatBonus ?? 0) * 100),
    convPct: fmt((def.p.conv ?? 0) * 100 * mul), defPct: fmt((def.p.def ?? 0) * mul), markDmg: rng(previewDamage(stats, def, (def.p.markCoef ?? 0) * mul * (1 + (stats.traceDmg ?? 0) / 100))),
    rootT: fmt((def.p.root ?? 0) * (1 + (stats.trapDur ?? 0) / 100)), cloakT: fmt((def.p.dur ?? 0) * mul),
  };
  const desc = def.desc.replace(/\{p\.(\w+)\}/g, (_, k) => fmt(def.p[k] ?? 0)).replace(/\{(\w+)\}/g, (_, k) => vals[k] ?? '?');
  return { lines, desc };
}
