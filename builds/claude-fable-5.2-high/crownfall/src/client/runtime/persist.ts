// Local persistence: settings, match history and cosmetic mastery. Everything lives in
// localStorage; a corrupt payload is detected, reported and reset rather than crashing the shell.

import type { HeroId } from '../../shared/heroes';
import type { Difficulty, HeroPublic } from '../../shared/protocol';

export type CastMode = 'quick' | 'indicator' | 'normal';
export type Quality = 'low' | 'medium' | 'high';

export const DEFAULT_KEYS = {
  q: 'KeyQ',
  w: 'KeyW',
  e: 'KeyE',
  r: 'KeyR',
  d: 'KeyD',
  f: 'KeyF',
  ward: 'KeyT',
  recall: 'KeyB',
  shop: 'KeyP',
  stop: 'KeyS',
  hold: 'KeyH',
  amove: 'KeyA',
  lock: 'KeyY',
  follow: 'Space',
  score: 'Tab',
  ping: 'KeyG',
};
export type KeyAction = keyof typeof DEFAULT_KEYS;
export const KEY_LABELS: Record<KeyAction, string> = {
  q: 'Ability 1',
  w: 'Ability 2',
  e: 'Ability 3',
  r: 'Ultimate',
  d: 'Talent 1',
  f: 'Talent 2',
  ward: 'Ward trinket',
  recall: 'Recall',
  shop: 'Shop',
  stop: 'Stop',
  hold: 'Hold position',
  amove: 'Attack-move',
  lock: 'Camera lock',
  follow: 'Centre on hero (hold)',
  score: 'Scoreboard (hold)',
  ping: 'Ping',
};

export interface Settings {
  quality: Quality;
  castMode: CastMode;
  master: number;
  music: number;
  sfx: number;
  edgeScroll: boolean;
  cameraLock: boolean;
  screenShake: boolean;
  damageNumbers: boolean;
  colorblind: boolean;
  uiScale: number;
  tutorialHints: boolean;
  keys: Record<KeyAction, string>;
}

export const DEFAULT_SETTINGS: Settings = {
  quality: 'medium',
  castMode: 'indicator',
  master: 0.7,
  music: 0.45,
  sfx: 0.8,
  edgeScroll: true,
  cameraLock: true,
  screenShake: true,
  damageNumbers: true,
  colorblind: false,
  uiScale: 1,
  tutorialHints: true,
  keys: { ...DEFAULT_KEYS },
};

export interface MatchRecord {
  date: string;
  mode: string;
  hero: HeroId;
  win: boolean;
  duration: number;
  k: number;
  d: number;
  a: number;
  cs: number;
  difficulty: Difficulty;
  players: Pick<HeroPublic, 'hero' | 'name' | 'team' | 'k' | 'd' | 'a' | 'lvl'>[];
}

export interface Profile {
  mastery: Partial<Record<HeroId, number>>;
  history: MatchRecord[];
  tutorialDone: boolean;
  matches: number;
}

interface Stored {
  v: 1;
  settings: Settings;
  profile: Profile;
}

const KEY = 'crownfall.v1';
export let storageWasCorrupt = false;

function fresh(): Stored {
  return { v: 1, settings: { ...DEFAULT_SETTINGS, keys: { ...DEFAULT_KEYS } }, profile: { mastery: {}, history: [], tutorialDone: false, matches: 0 } };
}

let cache: Stored | null = null;

function load(): Stored {
  if (cache) return cache;
  let out = fresh();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Stored>;
      if (!p || p.v !== 1 || typeof p.settings !== 'object' || typeof p.profile !== 'object') throw new Error('schema');
      out = {
        v: 1,
        settings: { ...DEFAULT_SETTINGS, ...p.settings, keys: { ...DEFAULT_KEYS, ...(p.settings?.keys ?? {}) } },
        profile: { ...out.profile, ...p.profile, history: Array.isArray(p.profile?.history) ? p.profile!.history : [] },
      };
    }
  } catch {
    storageWasCorrupt = true;
    out = fresh();
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* storage unavailable */
    }
  }
  cache = out;
  return out;
}

function save(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(load()));
  } catch {
    /* private mode / quota: play on without persistence */
  }
}

export const getSettings = (): Settings => load().settings;
export function setSettings(patch: Partial<Settings>): Settings {
  const s = load();
  s.settings = { ...s.settings, ...patch };
  save();
  return s.settings;
}
export const getProfile = (): Profile => load().profile;
export function updateProfile(fn: (p: Profile) => void): Profile {
  const s = load();
  fn(s.profile);
  s.profile = { ...s.profile };
  save();
  return s.profile;
}

/** Mastery is cosmetic only: 100 XP per level, earned for playing (more for winning). */
export const masteryLevel = (xp: number): number => 1 + Math.floor(xp / 100);
export function profileLevel(p: Profile): number {
  let total = 0;
  for (const v of Object.values(p.mastery)) total += v ?? 0;
  return 1 + Math.floor(total / 250);
}

export function keyName(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code === 'Space') return 'Space';
  return code;
}
