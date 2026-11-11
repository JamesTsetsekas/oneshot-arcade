// Client settings + persistent profile (cosmetics/mastery only). Stored in
// localStorage when available; every access is guarded.

export type Action =
  | 'forward' | 'back' | 'left' | 'right' | 'jump' | 'sprint' | 'crouch' | 'walk' | 'freelook'
  | 'interact' | 'reload' | 'melee' | 'shoulder' | 'deploy' | 'throw'
  | 'slot1' | 'slot2' | 'slot3' | 'slot4' | 'slot5' | 'inventory' | 'map' | 'ready';

export const ACTION_LABELS: Record<Action, string> = {
  forward: 'Move forward', back: 'Move back', left: 'Strafe left', right: 'Strafe right', jump: 'Jump / mantle / zipline',
  sprint: 'Sprint', crouch: 'Crouch / slide', walk: 'Walk', freelook: 'Free-look (skiff / freefall / glide)', interact: 'Interact / pick up (hold to swap)', reload: 'Reload',
  melee: 'Quick melee', shoulder: 'Swap shoulder', deploy: 'Deploy / stow wing-sail', throw: 'Throw / use equipped utility',
  slot1: 'Slot 1', slot2: 'Slot 2', slot3: 'Slot 3', slot4: 'Slot 4', slot5: 'Slot 5', inventory: 'Inventory', map: 'Full map', ready: 'Ready up (staging)',
};

export const DEFAULT_KEYS: Record<Action, string> = {
  forward: 'KeyW', back: 'KeyS', left: 'KeyA', right: 'KeyD', jump: 'Space', sprint: 'ShiftLeft', crouch: 'ControlLeft', walk: 'CapsLock', freelook: 'AltLeft',
  interact: 'KeyE', reload: 'KeyR', melee: 'KeyF', shoulder: 'KeyX', deploy: 'KeyZ', throw: 'KeyG',
  slot1: 'Digit1', slot2: 'Digit2', slot3: 'Digit3', slot4: 'Digit4', slot5: 'Digit5', inventory: 'Tab', map: 'KeyM', ready: 'Enter',
};

export type Preset = 'low' | 'medium' | 'high';

export interface Settings {
  preset: Preset;
  renderScale: number;
  dynamicRes: boolean;
  shadows: 'off' | 'low' | 'high';
  viewDistance: number;
  foliage: 'low' | 'high';
  effects: 'low' | 'high';
  fxaa: boolean;
  fov: number;
  sens: number;
  adsSens: number;
  invertY: boolean;
  adsToggle: boolean;
  crouchToggle: boolean;
  sprintToggle: boolean;
  masterVol: number;
  musicVol: number;
  sfxVol: number;
  captions: boolean;
  soundViz: boolean;
  colorblind: boolean;
  reducedMotion: boolean;
  photosensitive: boolean;
  showFps: boolean;
  keys: Record<Action, string>;
}

export const PRESETS: Record<Preset, Partial<Settings>> = {
  low: { renderScale: 0.7, shadows: 'off', viewDistance: 650, foliage: 'low', effects: 'low', fxaa: false },
  medium: { renderScale: 0.9, shadows: 'low', viewDistance: 1000, foliage: 'high', effects: 'high', fxaa: true },
  high: { renderScale: 1, shadows: 'high', viewDistance: 1500, foliage: 'high', effects: 'high', fxaa: true },
};

export const DEFAULT_SETTINGS: Settings = {
  preset: 'medium',
  renderScale: 0.9, dynamicRes: true, shadows: 'low', viewDistance: 1000, foliage: 'high', effects: 'high', fxaa: true,
  fov: 90, sens: 1, adsSens: 0.75, invertY: false, adsToggle: false, crouchToggle: false, sprintToggle: false,
  masterVol: 0.8, musicVol: 0.5, sfxVol: 0.9, captions: false, soundViz: true, colorblind: false, reducedMotion: false, photosensitive: false, showFps: false,
  keys: { ...DEFAULT_KEYS },
};

const SKEY = 'skybreak.settings.v1';
const PKEY = 'skybreak.profile.v1';

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch { return fallback; }
}
function save(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage unavailable */ }
}

type Listener = () => void;
const listeners = new Set<Listener>();

let settings: Settings = (() => {
  const s = load(SKEY, DEFAULT_SETTINGS);
  s.keys = { ...DEFAULT_KEYS, ...(s.keys ?? {}) };
  return s;
})();

export const getSettings = () => settings;
export function updateSettings(patch: Partial<Settings>) {
  settings = { ...settings, ...patch };
  save(SKEY, settings);
  listeners.forEach((l) => l());
}
export function applyPreset(p: Preset) { updateSettings({ preset: p, ...PRESETS[p] }); }
export function subscribeSettings(l: Listener) { listeners.add(l); return () => { listeners.delete(l); }; }

export function keyName(code: string) {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  return ({ ShiftLeft: 'L-Shift', ShiftRight: 'R-Shift', ControlLeft: 'L-Ctrl', ControlRight: 'R-Ctrl', AltLeft: 'L-Alt', Space: 'Space', Tab: 'Tab', Enter: 'Enter', Escape: 'Esc' } as Record<string, string>)[code] ?? code;
}

// ---------------------------------------------------------------- profile
export interface Profile {
  name: string;
  body: number;
  glider: number;
  xp: number;
  matches: number;
  wins: number;
  top5: number;
  kills: number;
  damage: number;
  bestPlacement: number;
  history: { date: string; placement: number; kills: number; damage: number }[];
}

export const BODY_NAMES = ['Scout', 'Tinker', 'Drifter', 'Warden'];
export const GLIDER_SKINS = [
  { name: 'Teal Kite', color: '#2bb3a6', accent: '#f2e6c8' },
  { name: 'Ember Sail', color: '#e0523f', accent: '#ffd27a' },
  { name: 'Dusk Moth', color: '#7a5cff', accent: '#ffb3f0' },
  { name: 'Brass Gull', color: '#d9a92b', accent: '#2a3d4f' },
];
/** Cosmetic unlock gates by mastery level. */
export const GLIDER_UNLOCK = [1, 1, 3, 6];

const defaultProfile: Profile = { name: 'Guest', body: 0, glider: 0, xp: 0, matches: 0, wins: 0, top5: 0, kills: 0, damage: 0, bestPlacement: 0, history: [] };
let profile: Profile = load(PKEY, defaultProfile);
export const getProfile = () => profile;
export function updateProfile(patch: Partial<Profile>) {
  profile = { ...profile, ...patch };
  save(PKEY, profile);
  listeners.forEach((l) => l());
}
export const masteryLevel = (xp: number) => 1 + Math.floor(Math.sqrt(xp / 120));
export function xpForMatch(placement: number, total: number, kills: number, damage: number) {
  return Math.round(40 + (total - placement) * 6 + kills * 35 + damage * 0.1 + (placement === 1 ? 150 : 0));
}
