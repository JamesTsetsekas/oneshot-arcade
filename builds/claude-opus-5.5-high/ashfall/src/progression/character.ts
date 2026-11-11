import type { ClassId, Difficulty, EquipSlot } from "../data/types";
import { EQUIP_SLOTS } from "../data/types";
import type { Item } from "../items/item";
import type { GridData } from "../items/inventory";
import { Grid } from "../items/inventory";
import { starterKit } from "../items/generate";
import { basicSkill, coreSkill } from "../data/skills";
import type { PotionKind } from "../data/items";
import { BASE_BY_ID } from "../data/items";
import { initialQuests, type QuestState } from "./quests";

export const SAVE_VERSION = 3;
export const LEVEL_CAP = 20;
export const INV_W = 10, INV_H = 6, STASH_W = 10, STASH_H = 8;

export interface Attributes { might: number; finesse: number; will: number; vigor: number }
export type AttrId = keyof Attributes;

export interface ZoneState { killed: number[]; opened: number[]; explored: string }
export interface Echo { zone: string; x: number; y: number; gold: number }
export interface Loadout { name: string; ranks: Record<string, number>; attrs: Attributes; hotbar: (string | null)[]; equipment: Record<string, number | null> }

export interface CharacterData {
  version: number;
  id: string;
  name: string;
  classId: ClassId;
  preset: { body: number; voice: number; tint: number };
  createdAt: number;
  updatedAt: number;
  level: number;
  xp: number;
  attrs: Attributes; // allocated points only (base comes from class)
  attrPoints: number;
  skillPoints: number;
  ranks: Record<string, number>;
  hotbar: (string | null)[]; // [RMB, Q, W, E, R]
  gold: number;
  dust: number;
  inventory: GridData;
  equipment: Record<EquipSlot, Item | null>;
  stash: GridData;
  belt: Record<PotionKind, number>;
  beltCap: number;
  quests: Record<string, QuestState>;
  waypoints: string[];
  difficulty: Difficulty;
  veteranUnlocked: boolean;
  actComplete: Record<Difficulty, boolean>;
  seed: number;
  expedition: number;
  zoneStates: Record<string, ZoneState>;
  checkpoint: string; // waypoint id
  location: { zone: string; x: number; y: number } | null;
  echo: Echo | null;
  blessing: number; // seconds remaining of Echo blessing
  stats: { kills: number; deaths: number; playTime: number; eliteKills: number; bossKills: Record<string, number>; huntBest: Record<string, number>; deathCauses: Record<string, number> };
  run: { startedAt: number; kills: number; deaths: number; itemsFound: number; best: string; startPlay: number };
  loot: { relicPity: number; firstBoss: Record<string, boolean> };
  uidCounter: number;
  loadouts: (Loadout | null)[];
  townVisits: number;
  flags: Record<string, boolean>;
}

export const CLASS_INFO: Record<ClassId, { name: string; tagline: string; base: Attributes; primary: AttrId; resource: string; desc: string }> = {
  cinder: {
    name: "Cinder Vow", tagline: "Armored close-range battlemage", base: { might: 18, finesse: 10, will: 12, vigor: 16 }, primary: "might", resource: "Heat",
    desc: "Endure blows to build Heat, then spend it on eruptions and stance. Mace and shield or a two-handed maul.",
  },
  ranger: {
    name: "Veil Ranger", tagline: "Mobile bow and trap specialist", base: { might: 10, finesse: 18, will: 12, vigor: 14 }, primary: "finesse", resource: "Trace",
    desc: "Shoot while moving to lay Trace marks, then detonate them — or control lanes with traps.",
  },
};

export const BODY_PRESETS = ["Lean", "Broad", "Tall"];
export const VOICE_PRESETS = ["Low", "Mid", "Bright"];
export const TINTS = ["#8a6f52", "#5d6a7a", "#7a4e4e", "#4e6a5a"];

export function xpToNext(level: number): number {
  return Math.round(40 + 45 * Math.pow(level, 1.5));
}

export function newCharacter(name: string, classId: ClassId, preset: CharacterData["preset"], seed: number, now: number): CharacterData {
  let uid = 1;
  const next = () => uid++;
  const kit = starterKit(classId, next);
  const equipment = Object.fromEntries(EQUIP_SLOTS.map((s) => [s, null])) as Record<EquipSlot, Item | null>;
  for (const it of kit) {
    const slot = BASE_BY_ID[it.baseId].slot;
    equipment[slot === "ring" ? "ring1" : (slot as EquipSlot)] = it;
  }
  const ranks: Record<string, number> = { [basicSkill(classId)]: 1, [coreSkill(classId)]: 1 };
  return {
    version: SAVE_VERSION,
    id: `w${seed.toString(36)}${now.toString(36)}`,
    name, classId, preset, createdAt: now, updatedAt: now,
    level: 1, xp: 0, attrs: { might: 0, finesse: 0, will: 0, vigor: 0 }, attrPoints: 0, skillPoints: 1,
    ranks, hotbar: [coreSkill(classId), null, null, null, null],
    gold: 40, dust: 0,
    inventory: new Grid(INV_W, INV_H).toData(), equipment, stash: new Grid(STASH_W, STASH_H).toData(),
    belt: { health: 3, focus: 1, cleanse: 1, tonic: 0 }, beltCap: 5,
    quests: initialQuests(), waypoints: ["refuge"], difficulty: "normal", veteranUnlocked: false, actComplete: { normal: false, veteran: false },
    seed, expedition: 0, zoneStates: {}, checkpoint: "refuge", location: null, echo: null, blessing: 0,
    stats: { kills: 0, deaths: 0, playTime: 0, eliteKills: 0, bossKills: {}, huntBest: {}, deathCauses: {} },
    run: { startedAt: now, kills: 0, deaths: 0, itemsFound: 0, best: "", startPlay: 0 },
    loot: { relicPity: 0, firstBoss: {} },
    uidCounter: uid, loadouts: [null, null], townVisits: 0, flags: {},
  };
}

/** Adds XP; returns number of levels gained. Each level grants one skill point; every other level grants one attribute point. */
export function addXp(ch: CharacterData, amount: number): number {
  if (ch.level >= LEVEL_CAP) return 0;
  ch.xp += Math.round(amount);
  let gained = 0;
  while (ch.level < LEVEL_CAP && ch.xp >= xpToNext(ch.level)) {
    ch.xp -= xpToNext(ch.level);
    ch.level++;
    ch.skillPoints++;
    if (ch.level % 2 === 0) ch.attrPoints++;
    gained++;
  }
  if (ch.level >= LEVEL_CAP) ch.xp = 0;
  return gained;
}

export function totalAttrPointsForLevel(level: number): number {
  return Math.floor(level / 2);
}

export function respecCost(ch: CharacterData): number {
  return ch.level <= 8 ? 0 : 40 * ch.level;
}
