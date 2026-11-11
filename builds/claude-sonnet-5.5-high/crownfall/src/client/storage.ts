/** Local persistence: settings, match history, mastery. All access is guarded (private windows, corrupt data). */
export interface Settings {
  castMode: 'indicator' | 'quick' | 'click';
  volume: number; music: number; shake: number;
  effects: 'high' | 'low'; quality: 'high' | 'medium' | 'low';
  colorblind: boolean; uiScale: number; edgeScroll: boolean; showDamage: boolean; captions: boolean; tutorialHints: boolean;
  keys: Record<string, string>;
}
export const DEFAULT_KEYS: Record<string, string> = {
  q: 'q', w: 'w', e: 'e', r: 'r', talent1: 'd', talent2: 'f', recall: 'b', shop: 'p', ward: 't', stop: 's', hold: 'h', attackMove: 'a', scoreboard: 'tab', follow: ' ', lock: 'y',
};
export const DEFAULT_SETTINGS: Settings = {
  castMode: 'indicator', volume: 0.6, music: 0.35, shake: 0.5, effects: 'high', quality: 'high', colorblind: false, uiScale: 100, edgeScroll: true,
  showDamage: true, captions: true, tutorialHints: true, keys: { ...DEFAULT_KEYS },
};

export interface MatchRecord {
  id: number; date: string; win: boolean; durationSec: number; heroId: string; kills: number; deaths: number; assists: number; lastHits: number;
  level: number; gold: number; difficulty: string; mode: string; items: string[]; teamKills: [number, number];
}
export interface Profile { matches: number; wins: number; mastery: Record<string, number>; tutorialDone: boolean; banner: string }

const K = { settings: 'crownfall.settings.v1', history: 'crownfall.history.v1', profile: 'crownfall.profile.v1' };

function read<T>(key: string): { value: T | null; corrupt: boolean } {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return { value: null, corrupt: false };
    return { value: JSON.parse(raw) as T, corrupt: false };
  } catch {
    return { value: null, corrupt: true };
  }
}
function write(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage unavailable */ }
}

export let settingsWereReset = false;

export function loadSettings(): Settings {
  const r = read<Partial<Settings>>(K.settings);
  if (r.corrupt) settingsWereReset = true;
  const s = { ...DEFAULT_SETTINGS, ...(r.value ?? {}) } as Settings;
  s.keys = { ...DEFAULT_KEYS, ...(r.value?.keys ?? {}) };
  if (![100, 125, 150].includes(s.uiScale)) s.uiScale = 100;
  s.volume = Math.min(1, Math.max(0, Number(s.volume) || 0));
  s.music = Math.min(1, Math.max(0, Number(s.music) || 0));
  return s;
}
export function saveSettings(s: Settings) { write(K.settings, s); }

export function loadHistory(): MatchRecord[] {
  const r = read<MatchRecord[]>(K.history);
  return Array.isArray(r.value) ? r.value : [];
}
export function addHistory(m: MatchRecord) {
  const h = loadHistory();
  h.unshift(m);
  write(K.history, h.slice(0, 40));
}
export function loadProfile(): Profile {
  const r = read<Profile>(K.profile);
  const p = r.value && typeof r.value === 'object' ? r.value : null;
  return { matches: p?.matches ?? 0, wins: p?.wins ?? 0, mastery: p?.mastery ?? {}, tutorialDone: !!p?.tutorialDone, banner: p?.banner ?? 'brass' };
}
export function saveProfile(p: Profile) { write(K.profile, p); }

export function masteryLevel(xp: number): number { return Math.floor(Math.sqrt(xp / 60)) + 1; }
export function profileLevel(p: Profile): number { return Math.floor(Math.sqrt(Object.values(p.mastery).reduce((a, b) => a + b, 0) / 90)) + 1; }
