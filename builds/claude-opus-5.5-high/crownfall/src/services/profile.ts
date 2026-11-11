// Local guest profile, settings and match history. Persisted to localStorage with corruption recovery.
import type { HeroId } from '../shared/types';
import type { MatchResult } from '../protocol/messages';

export type Action =
  | 'abilityQ' | 'abilityW' | 'abilityE' | 'abilityR' | 'talentD' | 'talentF'
  | 'item1' | 'item2' | 'item3' | 'item4' | 'item5' | 'item6' | 'ward'
  | 'attackMove' | 'stop' | 'hold' | 'recall' | 'shop' | 'scoreboard' | 'stats' | 'map' | 'ping' | 'centerHero' | 'cameraLock'
  | 'panUp' | 'panDown' | 'panLeft' | 'panRight' | 'chat';

export const ACTION_LABELS: Record<Action, string> = {
  abilityQ: 'Ability 1', abilityW: 'Ability 2', abilityE: 'Ability 3', abilityR: 'Ultimate', talentD: 'Talent 1', talentF: 'Talent 2',
  item1: 'Item 1', item2: 'Item 2', item3: 'Item 3', item4: 'Item 4', item5: 'Item 5', item6: 'Item 6', ward: 'Ward trinket',
  attackMove: 'Attack-move', stop: 'Stop', hold: 'Hold position', recall: 'Recall', shop: 'Shop', scoreboard: 'Scoreboard (hold)', stats: 'Advanced stats',
  map: 'Expanded map', ping: 'Ping wheel', centerHero: 'Follow hero (hold)', cameraLock: 'Camera lock', panUp: 'Camera up', panDown: 'Camera down', panLeft: 'Camera left', panRight: 'Camera right', chat: 'Team chat',
};

export const DEFAULT_KEYS: Record<Action, string> = {
  abilityQ: 'KeyQ', abilityW: 'KeyW', abilityE: 'KeyE', abilityR: 'KeyR', talentD: 'KeyD', talentF: 'KeyF',
  item1: 'Digit1', item2: 'Digit2', item3: 'Digit3', item4: 'Digit4', item5: 'Digit5', item6: 'Digit6', ward: 'Digit4',
  attackMove: 'KeyA', stop: 'KeyS', hold: 'KeyH', recall: 'KeyB', shop: 'KeyP', scoreboard: 'Tab', stats: 'KeyC', map: 'KeyM', ping: 'KeyG',
  centerHero: 'Space', cameraLock: 'KeyY', panUp: 'ArrowUp', panDown: 'ArrowDown', panLeft: 'ArrowLeft', panRight: 'ArrowRight', chat: 'Enter',
};

export type CastMode = 'normal' | 'quick' | 'quickIndicator';

export interface Settings {
  version: number;
  master: number; music: number; sfx: number;
  effects: 'low' | 'high';
  shake: boolean;
  colorblind: boolean;
  uiScale: 100 | 125 | 150;
  edgeScroll: boolean;
  damageNumbers: boolean;
  captions: boolean;
  chat: boolean;
  hints: boolean;
  botSuggestions: boolean;
  castMode: Record<'Q' | 'W' | 'E' | 'R', CastMode>;
  keys: Record<Action, string>;
  difficulty: 'easy' | 'normal' | 'hard';
  playerName: string;
}

export const DEFAULT_SETTINGS: Settings = {
  version: 2, master: 0.7, music: 0.45, sfx: 0.8, effects: 'high', shake: true, colorblind: false, uiScale: 100, edgeScroll: true,
  damageNumbers: true, captions: true, chat: true, hints: true, botSuggestions: true,
  castMode: { Q: 'quickIndicator', W: 'quickIndicator', E: 'quickIndicator', R: 'normal' },
  keys: { ...DEFAULT_KEYS }, difficulty: 'normal', playerName: 'Guest',
};

export interface HistoryEntry {
  id: string; date: string; hero: HeroId; win: boolean; mode: string; duration: number; k: number; d: number; a: number; cs: number; items: string[];
}
export interface Profile {
  version: number;
  level: number; xp: number;
  mastery: Partial<Record<HeroId, number>>;
  history: HistoryEntry[];
  tutorialDone: boolean;
  banner: string;
}
const DEFAULT_PROFILE: Profile = { version: 1, level: 1, xp: 0, mastery: {}, history: [], tutorialDone: false, banner: 'Ivory Causeway' };

export let storageNotice: string | null = null;

function load<T>(key: string, def: T, validate: (v: any) => boolean): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return structuredClone(def);
    const v = JSON.parse(raw);
    if (!validate(v)) throw new Error('invalid');
    return { ...structuredClone(def), ...v };
  } catch (e) {
    try { if (localStorage.getItem(key)) storageNotice = 'Saved local data was corrupted and has been reset to defaults.'; } catch { /* storage blocked */ }
    try { localStorage.removeItem(key); } catch { /* ignore */ }
    return structuredClone(def);
  }
}
function save(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage unavailable: keep in memory */ }
}

export function loadSettings(): Settings {
  const s = load('crownfall.settings', DEFAULT_SETTINGS, (v) => typeof v === 'object' && v && typeof v.master === 'number');
  s.keys = { ...DEFAULT_KEYS, ...(s.keys ?? {}) };
  s.castMode = { ...DEFAULT_SETTINGS.castMode, ...(s.castMode ?? {}) };
  return s;
}
export function saveSettings(s: Settings) { save('crownfall.settings', s); }

export function loadProfile(): Profile {
  return load('crownfall.profile', DEFAULT_PROFILE, (v) => typeof v === 'object' && v && Array.isArray(v.history));
}
export function saveProfile(p: Profile) { save('crownfall.profile', p); }

export const PROFILE_XP_PER_LEVEL = 1000;

/** Apply a finished match to the persistent profile (cosmetic mastery only). */
export function recordMatch(p: Profile, r: MatchResult, slot: number): { xp: number; mastery: number } {
  const row = r.score.find((s) => s.slot === slot)!;
  const win = r.winner === r.humanTeam;
  const xp = Math.round((win ? 220 : 140) + r.duration / 6 + row.objectives * 15);
  const mastery = Math.round(win ? 120 : 70);
  p.xp += xp;
  while (p.xp >= PROFILE_XP_PER_LEVEL) { p.xp -= PROFILE_XP_PER_LEVEL; p.level++; }
  p.mastery[row.hero] = (p.mastery[row.hero] ?? 0) + mastery;
  p.history.unshift({ id: `${Date.now()}`, date: new Date().toISOString(), hero: row.hero, win, mode: r.mode, duration: Math.round(r.duration), k: row.k, d: row.d, a: row.a, cs: row.cs, items: row.items });
  p.history = p.history.slice(0, 30);
  saveProfile(p);
  return { xp, mastery };
}

export function masteryRank(xp: number): { rank: number; title: string; next: number } {
  const thresholds = [0, 200, 500, 1000, 1800, 3000];
  const titles = ['Initiate', 'Apprentice', 'Journeyed', 'Adept', 'Paragon', 'Crowned'];
  let r = 0;
  while (r < thresholds.length - 1 && xp >= thresholds[r + 1]) r++;
  return { rank: r + 1, title: titles[r], next: thresholds[Math.min(thresholds.length - 1, r + 1)] };
}
