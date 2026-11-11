/** Settings and persistent profile (cosmetics + mastery only; no gameplay stat boosts). */
export type Quality = 'low' | 'medium' | 'high';

export interface Keybinds {
  forward: string; back: string; left: string; right: string; jump: string; sprint: string; crouch: string;
  reload: string; interact: string; drop: string; melee: string; swapShoulder: string; map: string; inventory: string;
  throwItem: string; deploy: string; slot1: string; slot2: string; slot3: string; slot4: string; slot5: string;
}
export const DEFAULT_KEYS: Keybinds = {
  forward: 'KeyW', back: 'KeyS', left: 'KeyA', right: 'KeyD', jump: 'Space', sprint: 'ShiftLeft', crouch: 'ControlLeft',
  reload: 'KeyR', interact: 'KeyE', drop: 'KeyQ', melee: 'KeyF', swapShoulder: 'KeyX', map: 'KeyM', inventory: 'Tab',
  throwItem: 'KeyG', deploy: 'KeyZ', slot1: 'Digit1', slot2: 'Digit2', slot3: 'Digit3', slot4: 'Digit4', slot5: 'Digit5',
};
export const KEY_LABELS: Record<keyof Keybinds, string> = {
  forward: 'Move forward', back: 'Move back', left: 'Strafe left', right: 'Strafe right', jump: 'Jump / mantle / wing-sail',
  sprint: 'Sprint', crouch: 'Crouch / slide', reload: 'Reload', interact: 'Interact / pick up (hold to swap)', drop: 'Drop selected',
  melee: 'Quick melee', swapShoulder: 'Swap shoulder', map: 'Full map', inventory: 'Inventory', throwItem: 'Throw utility',
  deploy: 'Deploy / stow wing-sail', slot1: 'Slot 1', slot2: 'Slot 2', slot3: 'Slot 3', slot4: 'Slot 4', slot5: 'Slot 5',
};

export interface Settings {
  sens: number; adsSens: number; fov: number; quality: Quality; resolution: number; dynamicRes: boolean;
  volume: number; music: number; reducedMotion: boolean; colorblind: boolean; soundIndicators: boolean; captions: boolean;
  adsToggle: boolean; crouchToggle: boolean; sprintToggle: boolean; invertY: boolean; showFps: boolean; keys: Keybinds;
}
export const DEFAULT_SETTINGS: Settings = {
  sens: 1, adsSens: 0.75, fov: 90, quality: 'medium', resolution: 1, dynamicRes: true, volume: 0.7, music: 0.35,
  reducedMotion: false, colorblind: false, soundIndicators: true, captions: false, adsToggle: false, crouchToggle: false,
  sprintToggle: false, invertY: false, showFps: false, keys: { ...DEFAULT_KEYS },
};

const SKEY = 'skybreak.settings.v1';
const PKEY = 'skybreak.profile.v1';

function safeGet(k: string): string | null { try { return localStorage.getItem(k); } catch { return null; } }
function safeSet(k: string, v: string): void { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } }

export function loadSettings(): Settings {
  const raw = safeGet(SKEY);
  const s: Settings = { ...DEFAULT_SETTINGS, keys: { ...DEFAULT_KEYS } };
  if (raw) {
    try {
      const o = JSON.parse(raw) as Partial<Settings>;
      Object.assign(s, o);
      s.keys = { ...DEFAULT_KEYS, ...(o.keys ?? {}) };
    } catch { /* ignore */ }
  }
  return s;
}
export function saveSettings(s: Settings): void { safeSet(SKEY, JSON.stringify(s)); }

export interface MatchRecord { date: string; placement: number; kills: number; damage: number; survive: number; xp: number; mode: string }
export interface Profile {
  name: string; xp: number; matches: number; wins: number; kills: number; bestPlacement: number; outfit: number;
  practiceVisited: boolean; history: MatchRecord[];
}
export const DEFAULT_PROFILE: Profile = { name: 'Guest', xp: 0, matches: 0, wins: 0, kills: 0, bestPlacement: 99, outfit: 0, practiceVisited: false, history: [] };

export function loadProfile(): Profile {
  const raw = safeGet(PKEY);
  if (!raw) return { ...DEFAULT_PROFILE, history: [] };
  try { return { ...DEFAULT_PROFILE, ...(JSON.parse(raw) as Partial<Profile>) }; } catch { return { ...DEFAULT_PROFILE, history: [] }; }
}
export function saveProfile(p: Profile): void { safeSet(PKEY, JSON.stringify(p)); }

/** Mastery level from XP: 400 XP per level. Outfits unlock at levels 1,2,3,5. */
export function masteryLevel(xp: number): number { return 1 + Math.floor(xp / 400); }
export const OUTFIT_UNLOCK = [1, 2, 3, 5];
