import type { DamageType, StatusId } from '../entity-combat/types';

export interface AttackDef {
  id: string; kind: 'area' | 'shot' | 'lunge' | 'explode' | 'hook' | 'zone' | 'ward';
  shape?: 'circle' | 'cone' | 'rect'; range: number; minRange?: number; windup: number; recover: number; cd: number;
  mul: number; dtype: DamageType; r?: number; angle?: number; len?: number; width?: number; heavy?: boolean; speed?: number;
  status?: { id: StatusId; t: number; power: number }; offset?: number; dur?: number; tick?: number; knock?: number;
}
export interface EnemyDef {
  id: string; name: string; role: 'fodder' | 'skirmisher' | 'controller' | 'bruiser' | 'boss' | 'object';
  points: number; hp: number; dmg: number; speed: number; r: number; sight: number; xp: number; heavy?: boolean;
  attacks: AttackDef[]; keepRange?: number; flank?: boolean; retreat?: boolean; shield?: boolean; split?: string; turn?: number;
  armor?: number; res?: Partial<Record<DamageType, number>>; desc: string;
}
const E = (d: EnemyDef) => d;
/** Ten normal families plus split spawn, boss and object definitions. Stats are level-1 values scaled by `scaleHp/scaleDmg`. */
export const ENEMIES: EnemyDef[] = [
  E({ id: 'crawler', name: 'Ash Crawler', role: 'fodder', points: 1, hp: 20, dmg: 5, speed: 5.0, r: 0.42, sight: 13, xp: 6,
    desc: 'Fast fodder that surrounds its prey but yields attack slots to heavier kin.',
    attacks: [{ id: 'bite', kind: 'area', shape: 'cone', range: 1.5, windup: 0.38, recover: 0.5, cd: 1.1, mul: 1, dtype: 'physical', r: 1.9, angle: 1.6 }] }),
  E({ id: 'husk', name: 'Bell Husk', role: 'bruiser', points: 4, hp: 100, dmg: 13, speed: 2.5, r: 0.78, sight: 12, xp: 24, heavy: true, armor: 10,
    desc: 'Slow bruiser. Its overhead slam is heavily telegraphed and knocks back.',
    attacks: [
      { id: 'slam', kind: 'area', shape: 'circle', range: 2.8, windup: 1.0, recover: 1.1, cd: 4.2, mul: 1.9, dtype: 'physical', r: 2.7, offset: 1.9, heavy: true, knock: 6 },
      { id: 'swipe', kind: 'area', shape: 'cone', range: 2.0, windup: 0.5, recover: 0.6, cd: 1.7, mul: 0.9, dtype: 'physical', r: 2.5, angle: 1.9 }] }),
  E({ id: 'archer', name: 'Soot Archer', role: 'skirmisher', points: 2, hp: 30, dmg: 8, speed: 3.5, r: 0.42, sight: 15, xp: 12, keepRange: 9,
    desc: 'Repositions to range and leads its shots slightly.',
    attacks: [{ id: 'shot', kind: 'shot', range: 12.5, windup: 0.75, recover: 0.5, cd: 2.0, mul: 1, dtype: 'physical', speed: 15 }] }),
  E({ id: 'scribe', name: 'Grave Scribe', role: 'controller', points: 3, hp: 36, dmg: 6, speed: 3.0, r: 0.45, sight: 14, xp: 18, keepRange: 8,
    desc: 'Raises a fragile ward that shields its allies. Priority target.', res: { blight: 30 },
    attacks: [
      { id: 'ward', kind: 'ward', range: 14, windup: 1.0, recover: 0.6, cd: 14, mul: 0, dtype: 'blight' },
      { id: 'bolt', kind: 'shot', range: 11, windup: 0.8, recover: 0.5, cd: 2.6, mul: 1, dtype: 'blight', speed: 12 }] }),
  E({ id: 'mite', name: 'Lantern Mite', role: 'fodder', points: 1, hp: 12, dmg: 17, speed: 4.4, r: 0.36, sight: 12, xp: 7,
    desc: 'Scuttles close and detonates after a clear wind-up. The blast also harms its allies.',
    attacks: [{ id: 'burst', kind: 'explode', shape: 'circle', range: 1.7, windup: 0.95, recover: 0, cd: 0, mul: 1, dtype: 'ember', r: 2.7, heavy: true }] }),
  E({ id: 'pilgrim', name: 'Chain Pilgrim', role: 'controller', points: 3, hp: 72, dmg: 11, speed: 2.4, r: 0.55, sight: 14, xp: 20, heavy: true,
    desc: 'Hooks its prey from afar, then advances slowly.',
    attacks: [
      { id: 'hook', kind: 'hook', range: 10, minRange: 4, windup: 0.85, recover: 0.7, cd: 6.5, mul: 0.7, dtype: 'physical', speed: 19 },
      { id: 'flail', kind: 'area', shape: 'cone', range: 2.2, windup: 0.55, recover: 0.6, cd: 1.9, mul: 1.1, dtype: 'physical', r: 2.8, angle: 2.2 }] }),
  E({ id: 'warden', name: 'Archive Warden', role: 'bruiser', points: 4, hp: 98, dmg: 12, speed: 2.7, r: 0.7, sight: 12, xp: 26, heavy: true, shield: true, turn: 1.5, armor: 14,
    desc: 'A shield-bearing machine. Frontal hits are mostly deflected; it turns slowly — flank it.',
    attacks: [{ id: 'bash', kind: 'area', shape: 'rect', range: 2.6, windup: 0.65, recover: 0.9, cd: 2.2, mul: 1.25, dtype: 'physical', len: 3.4, width: 2.2, knock: 3 }] }),
  E({ id: 'swarm', name: 'Quill Swarm', role: 'skirmisher', points: 2, hp: 48, dmg: 4, speed: 4.2, r: 0.7, sight: 12, xp: 14, split: 'swarmlet',
    desc: 'A flock that splits in two at half health.',
    attacks: [{ id: 'peck', kind: 'area', shape: 'circle', range: 1.2, windup: 0.32, recover: 0.3, cd: 0.9, mul: 1, dtype: 'physical', r: 1.5 }] }),
  E({ id: 'swarmlet', name: 'Quill Flight', role: 'fodder', points: 1, hp: 16, dmg: 3, speed: 4.6, r: 0.45, sight: 12, xp: 4, desc: 'Half of a split swarm.',
    attacks: [{ id: 'peck', kind: 'area', shape: 'circle', range: 1.0, windup: 0.32, recover: 0.3, cd: 0.9, mul: 1, dtype: 'physical', r: 1.2 }] }),
  E({ id: 'hound', name: 'Mire Hound', role: 'skirmisher', points: 2, hp: 44, dmg: 10, speed: 5.3, r: 0.5, sight: 15, xp: 14, flank: true, retreat: true,
    desc: 'Circles to your flank, lunges, then retreats.',
    attacks: [{ id: 'lunge', kind: 'lunge', shape: 'rect', range: 6, minRange: 2.5, windup: 0.6, recover: 0.7, cd: 3.4, mul: 1.3, dtype: 'physical', len: 6.5, width: 1.4 }] }),
  E({ id: 'adept', name: 'Censer Adept', role: 'controller', points: 3, hp: 40, dmg: 5, speed: 3.2, r: 0.45, sight: 14, xp: 18, keepRange: 9, res: { blight: 50 },
    desc: 'Lays lingering Blight zones and backs away from melee.',
    attacks: [{ id: 'censer', kind: 'zone', shape: 'circle', range: 11, windup: 0.9, recover: 0.6, cd: 5, mul: 0.55, dtype: 'blight', r: 2.6, dur: 5, tick: 0.5 }] }),
  E({ id: 'tollkeeper', name: 'The Toll-Keeper', role: 'boss', points: 20, hp: 560, dmg: 15, speed: 3.0, r: 1.25, sight: 16, xp: 260, heavy: true, armor: 12, desc: 'Gatekeeper of the tollhouse.', attacks: [] }),
  E({ id: 'engine', name: 'Orison Engine', role: 'boss', points: 30, hp: 820, dmg: 17, speed: 0, r: 2.4, sight: 30, xp: 700, heavy: true, armor: 16, res: { blight: 40, ember: 20 }, desc: 'Machine-organism of the buried star.', attacks: [] }),
  E({ id: 'conduit', name: 'Star Conduit', role: 'object', points: 0, hp: 95, dmg: 0, speed: 0, r: 0.9, sight: 0, xp: 0, heavy: true, desc: 'Feeds the Engine.', attacks: [] }),
  E({ id: 'ward', name: 'Scribe Ward', role: 'object', points: 0, hp: 14, dmg: 0, speed: 0, r: 0.5, sight: 0, xp: 2, desc: 'Allies within 7 m take 40% less damage.', attacks: [] }),
  E({ id: 'urn', name: 'Burial Urn', role: 'object', points: 0, hp: 1, dmg: 0, speed: 0, r: 0.5, sight: 0, xp: 0, desc: '', attacks: [] }),
  E({ id: 'brazier', name: 'Volatile Brazier', role: 'object', points: 0, hp: 1, dmg: 14, speed: 0, r: 0.55, sight: 0, xp: 0, desc: 'Explodes when struck.', attacks: [] }),
  E({ id: 'dummy', name: 'Training Dummy', role: 'object', points: 0, hp: 100000, dmg: 0, speed: 0, r: 0.6, sight: 0, xp: 0, heavy: true, desc: '', attacks: [] }),
];
export const ENEMY: Record<string, EnemyDef> = Object.fromEntries(ENEMIES.map((e) => [e.id, e]));
export const scaleHp = (base: number, lvl: number) => Math.round(base * (1 + 0.2 * (lvl - 1) + 0.014 * (lvl - 1) ** 2));
export const scaleDmg = (base: number, lvl: number) => base * (1 + 0.115 * (lvl - 1));

/** Which families populate each zone, with selection weights. Pack budgets use the role points above. */
export const ZONE_ENEMIES: Record<string, [string, number][]> = {
  march: [['crawler', 5], ['husk', 2], ['archer', 3], ['mite', 2], ['hound', 2.5], ['pilgrim', 1.2]],
  hunt_toll: [['crawler', 4], ['hound', 2], ['archer', 2]],
  archive1: [['warden', 3], ['mite', 3], ['crawler', 3], ['archer', 2], ['swarm', 2.5]],
  archive2: [['scribe', 3], ['adept', 3], ['warden', 2], ['swarm', 2], ['pilgrim', 2], ['crawler', 2]],
  archive3: [['scribe', 2], ['adept', 2], ['warden', 2], ['husk', 2], ['hound', 2]],
};
export interface EliteMod { id: string; name: string; cost: number; excl: string[]; cd: number; desc: string }
/** Elite modifiers with threat budget and incompatibility tags (never combine two that deny ground simultaneously). */
export const ELITE_MODS: EliteMod[] = [
  { id: 'ember_wake', name: 'Ember Wake', cost: 2, excl: ['frost_pulse', 'burrowing'], cd: 0.5, desc: 'Leaves burning ground in its wake.' },
  { id: 'mirror_shell', name: 'Mirror Shell', cost: 3, excl: ['vampiric_bond'], cd: 9, desc: 'Periodically reflects a share of damage taken.' },
  { id: 'rallying', name: 'Rallying', cost: 2, excl: [], cd: 1, desc: 'Nearby allies move and strike harder.' },
  { id: 'frost_pulse', name: 'Frost Pulse', cost: 3, excl: ['ember_wake', 'burrowing'], cd: 6.5, desc: 'Emits telegraphed rings of chilling frost.' },
  { id: 'burrowing', name: 'Burrowing', cost: 3, excl: ['ember_wake', 'frost_pulse'], cd: 10, desc: 'Burrows and erupts beneath its target.' },
  { id: 'vampiric_bond', name: 'Vampiric Bond', cost: 2, excl: ['mirror_shell'], cd: 1, desc: 'Regenerates while any packmate lives.' },
];
export const MOD: Record<string, EliteMod> = Object.fromEntries(ELITE_MODS.map((m) => [m.id, m]));
