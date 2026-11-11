import { DEFAULT_AUDIO, type AudioSettings } from '../audio/audio';
import type { Rarity } from '../sim/types';

export type Action =
  | 'skillQ' | 'skillW' | 'skillE' | 'skillR' | 'potion1' | 'potion2' | 'potion3' | 'potion4' | 'evade' | 'automap' | 'map' | 'inventory' | 'skills' | 'character' | 'quests'
  | 'interact' | 'townGate' | 'pause' | 'labels' | 'compare' | 'standStill';

export const ACTION_LABELS: Record<Action, string> = {
  skillQ: 'Skill Q', skillW: 'Skill W', skillE: 'Skill E', skillR: 'Skill R', potion1: 'Potion 1 (health)', potion2: 'Potion 2 (focus)', potion3: 'Potion 3 (cleanse)', potion4: 'Potion 4 (tonic)',
  evade: 'Evasive step', automap: 'Automap overlay', map: 'Full map', inventory: 'Inventory', skills: 'Skills', character: 'Character', quests: 'Quest log', interact: 'Interact / pick up',
  townGate: 'Town gate', pause: 'Pause / close', labels: 'Show ground labels (hold)', compare: 'Compare items (hold)', standStill: 'Stand still while attacking (hold)',
};

export const DEFAULT_KEYS: Record<Action, string> = {
  skillQ: 'KeyQ', skillW: 'KeyW', skillE: 'KeyE', skillR: 'KeyR', potion1: 'Digit1', potion2: 'Digit2', potion3: 'Digit3', potion4: 'Digit4', evade: 'Space', automap: 'Tab', map: 'KeyM',
  inventory: 'KeyI', skills: 'KeyK', character: 'KeyC', quests: 'KeyJ', interact: 'KeyF', townGate: 'KeyT', pause: 'Escape', labels: 'AltLeft', compare: 'ControlLeft', standStill: 'ShiftLeft',
};
export const LEFTY_KEYS: Partial<Record<Action, string>> = { skillQ: 'KeyU', skillW: 'KeyI', skillE: 'KeyO', skillR: 'KeyP', potion1: 'Digit7', potion2: 'Digit8', potion3: 'Digit9', potion4: 'Digit0', inventory: 'KeyB', skills: 'KeyN', character: 'KeyV', quests: 'KeyJ', interact: 'KeyH', townGate: 'KeyY' };

export interface Settings {
  quality: 'low' | 'medium' | 'high';
  shadows: 'off' | 'low' | 'high';
  particles: number;
  dynamicRes: boolean;
  shake: number;
  damageNumbers: boolean;
  labelMin: Rarity;
  audio: AudioSettings;
  reducedMotion: boolean;
  colorblind: boolean;
  reducedFlash: boolean;
  uiScale: number;
  advancedItems: boolean;
  alwaysCompare: boolean;
  attackInPlace: boolean;
  subtitles: boolean;
  showFps: boolean;
  keys: Record<Action, string>;
}

export const PRESETS: Record<'low' | 'medium' | 'high', Partial<Settings>> = {
  low: { shadows: 'off', particles: 0.35, dynamicRes: true },
  medium: { shadows: 'low', particles: 0.7, dynamicRes: true },
  high: { shadows: 'high', particles: 1, dynamicRes: true },
};

export function defaultSettings(): Settings {
  return {
    quality: 'high', shadows: 'high', particles: 1, dynamicRes: true, shake: 1, damageNumbers: true, labelMin: 'worn', audio: { ...DEFAULT_AUDIO }, reducedMotion: false, colorblind: false, reducedFlash: false,
    uiScale: 1, advancedItems: false, alwaysCompare: true, attackInPlace: false, subtitles: true, showFps: false, keys: { ...DEFAULT_KEYS },
  };
}

export function mergeSettings(raw: string | undefined): Settings {
  const d = defaultSettings();
  if (!raw) return d;
  try {
    const j = JSON.parse(raw) as Partial<Settings>;
    return { ...d, ...j, audio: { ...d.audio, ...(j.audio ?? {}) }, keys: { ...d.keys, ...(j.keys ?? {}) } };
  } catch {
    return d;
  }
}

export function keyLabel(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  const map: Record<string, string> = { Space: 'Space', Tab: 'Tab', Escape: 'Esc', ShiftLeft: 'Shift', ShiftRight: 'Shift', ControlLeft: 'Ctrl', ControlRight: 'Ctrl', AltLeft: 'Alt', AltRight: 'Alt', Enter: 'Enter', Backquote: '`' };
  return map[code] ?? code;
}
