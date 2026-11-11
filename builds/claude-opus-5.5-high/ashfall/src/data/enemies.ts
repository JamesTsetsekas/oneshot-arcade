import type { EnemyDef, EliteModDef } from "./types";

export const ENEMIES: EnemyDef[] = [
  {
    id: "ash_crawler", name: "Ash Crawler", role: "fodder", behavior: "swarm", hp: 22, dmg: 4, speed: 4.4, radius: 0.4, armor: 4,
    res: { ember: 20 }, xp: 6, aggro: 11, light: true, color: "#ff7a2e",
    attacks: [{ id: "nip", kind: "melee", range: 1.3, windup: 320, recovery: 380, cooldown: 1.1, dmg: 1, type: "physical", shape: { kind: "cone", radius: 1.6, angle: 70 } }],
    flavor: "Star-burnt vermin that skitter in packs. Weak alone, they surround you but yield their place to heavier kin.",
  },
  {
    id: "bell_husk", name: "Bell Husk", role: "bruiser", behavior: "bruiser", hp: 90, dmg: 11, speed: 2.2, radius: 0.75, armor: 22,
    res: { frost: 15 }, xp: 22, aggro: 10, light: false, color: "#c9a25a",
    attacks: [
      { id: "slam", kind: "slam", range: 2.8, windup: 900, recovery: 900, cooldown: 3.2, dmg: 2.6, type: "physical", shape: { kind: "line", width: 2.0, length: 3.6 }, heavy: true, ailment: { type: "stun", chance: 0.6, duration: 0.6 } },
      { id: "shove", kind: "melee", range: 1.8, windup: 450, recovery: 500, cooldown: 1.8, dmg: 1, type: "physical", shape: { kind: "cone", radius: 2.1, angle: 90 } },
    ],
    flavor: "A dead bell-ringer fused to its bell. Its overhead slam is slow, loud, and ruinous.",
  },
  {
    id: "soot_archer", name: "Soot Archer", role: "skirmisher", behavior: "ranged", hp: 34, dmg: 6, speed: 3.2, radius: 0.45, armor: 6,
    res: {}, xp: 12, aggro: 14, light: true, color: "#ff5040",
    attacks: [{ id: "shot", kind: "projectile", range: 11, windup: 600, recovery: 500, cooldown: 1.9, dmg: 1.2, type: "physical", shape: { kind: "line", width: 0.5, length: 12 }, projectileSpeed: 13, lead: 0.35 }],
    flavor: "Repositions to range and leads its shots slightly. Move unpredictably.",
  },
  {
    id: "grave_scribe", name: "Grave Scribe", role: "controller", behavior: "support", hp: 40, dmg: 5, speed: 2.6, radius: 0.5, armor: 4,
    res: { blight: 30 }, xp: 18, aggro: 13, light: true, color: "#9cf0ff",
    attacks: [
      { id: "ward", kind: "ward", range: 9, windup: 800, recovery: 600, cooldown: 7, dmg: 0, type: "blight", shape: { kind: "circle", radius: 1 } },
      { id: "bolt", kind: "projectile", range: 9, windup: 650, recovery: 500, cooldown: 2.6, dmg: 1.1, type: "blight", shape: { kind: "line", width: 0.5, length: 10 }, projectileSpeed: 9 },
    ],
    flavor: "Raises a fragile ward that halves the damage its allies take. Kill it first.",
  },
  {
    id: "lantern_mite", name: "Lantern Mite", role: "skirmisher", behavior: "bomber", hp: 20, dmg: 14, speed: 3.8, radius: 0.4, armor: 0,
    res: { ember: 50 }, xp: 9, aggro: 12, light: true, color: "#ffc040",
    attacks: [{ id: "burst", kind: "explode", range: 1.6, windup: 1000, recovery: 0, cooldown: 99, dmg: 2.2, type: "ember", shape: { kind: "circle", radius: 2.6 }, heavy: true }],
    flavor: "Waddles close, flares, and bursts. The blast also hurts other enemies.",
  },
  {
    id: "chain_pilgrim", name: "Chain Pilgrim", role: "controller", behavior: "hooker", hp: 60, dmg: 8, speed: 2.0, radius: 0.55, armor: 14,
    res: { frost: 20 }, xp: 18, aggro: 12, light: false, color: "#b0b8c8",
    attacks: [
      { id: "hook", kind: "hook", range: 8, windup: 750, recovery: 900, cooldown: 6, dmg: 1.2, type: "physical", shape: { kind: "line", width: 0.9, length: 8.5 }, heavy: true },
      { id: "flail", kind: "melee", range: 1.8, windup: 500, recovery: 600, cooldown: 1.6, dmg: 1.3, type: "physical", shape: { kind: "cone", radius: 2.2, angle: 100 } },
    ],
    flavor: "Casts a hooked chain to drag prey close, then advances slowly with a flail.",
  },
  {
    id: "archive_warden", name: "Archive Warden", role: "bruiser", behavior: "shield", hp: 85, dmg: 9, speed: 2.3, radius: 0.7, armor: 30,
    res: { ember: 15, frost: 15, blight: 15 }, xp: 24, aggro: 11, light: false, color: "#7fe0e8",
    attacks: [{ id: "bash", kind: "melee", range: 2.0, windup: 600, recovery: 800, cooldown: 2.2, dmg: 1.6, type: "physical", shape: { kind: "cone", radius: 2.4, angle: 80 }, heavy: true, ailment: { type: "knockback", chance: 1 } }],
    flavor: "Its tower shield blocks 75% of damage from the front. It turns slowly — strike from the side or behind.",
  },
  {
    id: "quill_swarm", name: "Quill Swarm", role: "skirmisher", behavior: "flock", hp: 50, dmg: 5, speed: 3.4, radius: 0.6, armor: 0,
    res: { physical: 10 }, xp: 14, aggro: 12, light: true, color: "#e8e0d0",
    attacks: [{ id: "lacerate", kind: "melee", range: 1.4, windup: 380, recovery: 420, cooldown: 1.0, dmg: 0.8, type: "physical", shape: { kind: "circle", radius: 1.6 } }],
    flavor: "A flock of animate quills. At half health it splits in two.",
  },
  {
    id: "mire_hound", name: "Mire Hound", role: "skirmisher", behavior: "flanker", hp: 38, dmg: 8, speed: 4.8, radius: 0.5, armor: 6,
    res: { blight: 25 }, xp: 13, aggro: 13, light: true, color: "#b070ff",
    attacks: [{ id: "lunge", kind: "lunge", range: 5, windup: 550, recovery: 700, cooldown: 3.2, dmg: 1.6, type: "blight", shape: { kind: "line", width: 1.2, length: 5.5 }, ailment: { type: "blight", chance: 0.4 } }],
    flavor: "Circles to your flank, lunges, then retreats to circle again.",
  },
  {
    id: "censer_adept", name: "Censer Adept", role: "controller", behavior: "kiter", hp: 42, dmg: 6, speed: 2.8, radius: 0.5, armor: 4,
    res: { blight: 40 }, xp: 18, aggro: 13, light: true, color: "#c060ff",
    attacks: [{ id: "censer", kind: "zone", range: 8, windup: 800, recovery: 700, cooldown: 4.0, dmg: 0.6, type: "blight", shape: { kind: "circle", radius: 2.2 } }],
    flavor: "Swings a censer that leaves persistent Blight smoke, and backs away from melee.",
  },
  {
    id: "training_dummy", name: "Training Dummy", role: "fodder", behavior: "dummy", hp: 9999, dmg: 0, speed: 0, radius: 0.55, armor: 0,
    res: {}, xp: 0, aggro: 0, light: false, color: "#d8c8a0", attacks: [],
    flavor: "Straw, sackcloth, and patience.",
  },
];

export const ENEMY_BY_ID: Record<string, EnemyDef> = Object.fromEntries(ENEMIES.map((e) => [e.id, e]));

/** Elite modifiers. Exclusions keep safe space: ember_wake + frost_pulse never combine (both deny ground), mirror + vampiric never combine (both prolong fights). */
export const ELITE_MODS: EliteModDef[] = [
  { id: "ember_wake", name: "Ember Wake", desc: "Leaves burning ground in its wake.", excludes: ["frost_pulse"], threat: 2, cooldown: 0.5, color: "#ff6a2a" },
  { id: "frost_pulse", name: "Frost Pulse", desc: "Periodically releases a telegraphed chilling nova.", excludes: ["ember_wake"], threat: 2, cooldown: 6, color: "#a8e4ff" },
  { id: "rallying", name: "Rallying", desc: "Nearby allies move and attack 25% faster.", excludes: [], threat: 1, cooldown: 0, color: "#ffd060" },
  { id: "mirror_shell", name: "Mirror Shell", desc: "Every 8 s raises a shell that reflects projectiles for 2 s.", excludes: ["vampiric_bond"], threat: 2, cooldown: 8, color: "#e0f0ff" },
  { id: "vampiric_bond", name: "Vampiric Bond", desc: "Heals for 60% of damage it deals.", excludes: ["mirror_shell"], threat: 1, cooldown: 0, color: "#d02040" },
];
export const ELITE_BY_ID: Record<string, EliteModDef> = Object.fromEntries(ELITE_MODS.map((e) => [e.id, e]));

/** Enemy level scaling. */
export function enemyHp(base: number, level: number): number {
  return Math.round(base * (1 + 0.25 * (level - 1) + 0.008 * (level - 1) * (level - 1)));
}
export function enemyDmg(base: number, level: number): number {
  return 1.3 * base * (1 + 0.2 * (level - 1) + 0.006 * (level - 1) * (level - 1));
}
export function enemyXp(base: number, level: number): number {
  return Math.round(base * (1 + 0.25 * (level - 1)));
}
