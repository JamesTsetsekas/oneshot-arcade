// Player settings, persisted to localStorage. None of them changes gameplay visibility:
// Veil opacity, Thermite borders and flash duration are identical regardless of these values.
import type { IffPalette } from '../renderer/core';

export interface Crosshair {
  color: string;
  gap: number;
  length: number;
  thickness: number;
  dot: boolean;
  outline: boolean;
  dynamic: boolean;
}

export interface Settings {
  sensitivity: number;
  scopeSensitivity: number;
  fov: number;
  volume: number;
  musicVolume: number;
  crosshair: Crosshair;
  toggleCrouch: boolean;
  toggleWalk: boolean;
  reduceFlash: boolean;
  reduceMotion: boolean;
  blood: boolean;
  leftHand: boolean;
  palette: IffPalette;
  captions: boolean;
  renderScale: number;
  showFps: boolean;
  name: string;
}

export const DEFAULT_SETTINGS: Settings = {
  sensitivity: 1,
  scopeSensitivity: 1,
  fov: 90,
  volume: 0.7,
  musicVolume: 0.5,
  crosshair: { color: '#5dffb0', gap: 4, length: 7, thickness: 2, dot: false, outline: true, dynamic: true },
  toggleCrouch: false,
  toggleWalk: false,
  reduceFlash: false,
  reduceMotion: false,
  blood: true,
  leftHand: false,
  palette: 'default',
  captions: true,
  renderScale: 1,
  showFps: false,
  name: 'You',
};

const KEY = 'last-protocol.settings.v1';

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT_SETTINGS);
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...structuredClone(DEFAULT_SETTINGS), ...parsed, crosshair: { ...DEFAULT_SETTINGS.crosshair, ...(parsed.crosshair ?? {}) } };
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable: settings stay in memory */
  }
}

export interface HistoryEntry {
  date: string;
  mode: string;
  score: [number, number];
  won: boolean | null;
  kills: number;
  deaths: number;
  assists: number;
  rounds: number;
}

const HKEY = 'last-protocol.history.v1';

export function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HKEY) ?? '[]') as HistoryEntry[];
  } catch {
    return [];
  }
}

export function pushHistory(e: HistoryEntry): void {
  try {
    const list = loadHistory();
    list.unshift(e);
    localStorage.setItem(HKEY, JSON.stringify(list.slice(0, 12)));
  } catch {
    /* ignore */
  }
}
