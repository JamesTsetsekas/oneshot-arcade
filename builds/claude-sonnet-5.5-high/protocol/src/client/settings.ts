// Player settings, persisted to localStorage (wrapped in try/catch: storage may be unavailable).

export interface Settings {
  sensitivity: number; // multiplier; radians per count = sensitivity * 0.022 deg
  adsSensitivity: number;
  fov: number; // horizontal degrees at 16:9
  volume: number;
  sfxVolume: number;
  musicVolume: number;
  quality: 'low' | 'medium' | 'high';
  resolutionScale: number;
  reduceFlash: boolean;
  reduceMotion: boolean;
  colorblind: 'default' | 'deuteranopia' | 'protanopia' | 'mono';
  holdCrouch: boolean;
  holdWalk: boolean;
  showFps: boolean;
  leftHand: boolean;
  captions: boolean;
  crosshair: { color: string; size: number; thickness: number; gap: number; dot: boolean; outline: boolean; dynamic: boolean; opacity: number };
  difficulty: 'easy' | 'normal' | 'hard';
  rules: 'quick' | 'full';
  side: 'int' | 'cus' | 'random';
}

export const DEFAULT_SETTINGS: Settings = {
  sensitivity: 2.0, adsSensitivity: 0.8, fov: 90, volume: 0.7, sfxVolume: 1, musicVolume: 0.5, quality: 'medium', resolutionScale: 1,
  reduceFlash: false, reduceMotion: false, colorblind: 'default', holdCrouch: true, holdWalk: true, showFps: false, leftHand: false, captions: true,
  crosshair: { color: '#6dffd9', size: 7, thickness: 2, gap: 4, dot: false, outline: true, dynamic: true, opacity: 1 },
  difficulty: 'normal', rules: 'quick', side: 'int',
};

const KEY = 'last-protocol.settings.v1';

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT_SETTINGS);
    const p = JSON.parse(raw);
    return { ...structuredClone(DEFAULT_SETTINGS), ...p, crosshair: { ...DEFAULT_SETTINGS.crosshair, ...(p.crosshair ?? {}) } };
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export function saveSettings(s: Settings): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable */ }
}

export function exportSensitivity(s: Settings): string {
  return JSON.stringify({ sensitivity: s.sensitivity, adsSensitivity: s.adsSensitivity, fov: s.fov });
}
