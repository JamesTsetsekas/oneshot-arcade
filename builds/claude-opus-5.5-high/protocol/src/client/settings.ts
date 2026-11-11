// Player settings. Persisted per browser. None of these change gameplay
// visibility: smoke, flash duration and hitboxes are identical on every preset.

export type Action =
  | 'forward' | 'back' | 'left' | 'right' | 'jump' | 'crouch' | 'walk' | 'reload' | 'use' | 'inspect' | 'drop'
  | 'quickSwitch' | 'primary' | 'secondary' | 'tool' | 'util1' | 'util2' | 'util3' | 'util4' | 'buy' | 'scoreboard'
  | 'map' | 'radio';

export const ACTION_LABELS: Record<Action, string> = {
  forward: 'Move forward', back: 'Move back', left: 'Strafe left', right: 'Strafe right', jump: 'Jump',
  crouch: 'Crouch', walk: 'Silent walk', reload: 'Reload', use: 'Interact / arm / disarm', inspect: 'Inspect weapon',
  drop: 'Drop weapon', quickSwitch: 'Previous weapon', primary: 'Primary', secondary: 'Sidearm', tool: 'Tool / Cipher',
  util1: 'Utility 1', util2: 'Utility 2', util3: 'Utility 3', util4: 'Utility 4', buy: 'Buy menu', scoreboard: 'Scoreboard',
  map: 'Tactical map', radio: 'Radio',
};

export const DEFAULT_BINDS: Record<Action, string> = {
  forward: 'KeyW', back: 'KeyS', left: 'KeyA', right: 'KeyD', jump: 'Space', crouch: 'ControlLeft', walk: 'ShiftLeft',
  reload: 'KeyR', use: 'KeyE', inspect: 'KeyF', drop: 'KeyG', quickSwitch: 'KeyQ', primary: 'Digit1', secondary: 'Digit2',
  tool: 'Digit3', util1: 'Digit4', util2: 'Digit5', util3: 'Digit6', util4: 'Digit7', buy: 'KeyB', scoreboard: 'Tab',
  map: 'KeyM', radio: 'KeyZ',
};

export type Colorblind = 'off' | 'deutan' | 'protan' | 'tritan';
export type Quality = 'low' | 'medium' | 'high';

export interface Settings {
  sensitivity: number;
  zoomSensitivity: number;
  fov: number;
  invertY: boolean;
  crosshair: { color: string; gap: number; length: number; thickness: number; dot: boolean; outline: boolean; dynamic: boolean };
  volume: number;
  sfxVolume: number;
  musicVolume: number;
  reducedFlash: boolean;
  reducedMotion: boolean;
  captions: boolean;
  colorblind: Colorblind;
  quality: Quality;
  toggleCrouch: boolean;
  toggleWalk: boolean;
  leftHanded: boolean;
  showFps: boolean;
  botDifficulty: number;
  binds: Record<Action, string>;
}

export const DEFAULT_SETTINGS: Settings = {
  sensitivity: 2.0,
  zoomSensitivity: 1.0,
  fov: 90,
  invertY: false,
  crosshair: { color: '#5cffb0', gap: 4, length: 6, thickness: 2, dot: false, outline: true, dynamic: true },
  volume: 0.8,
  sfxVolume: 1,
  musicVolume: 0.5,
  reducedFlash: false,
  reducedMotion: false,
  captions: true,
  colorblind: 'off',
  quality: 'medium',
  toggleCrouch: false,
  toggleWalk: false,
  leftHanded: false,
  showFps: false,
  botDifficulty: 0.55,
  binds: { ...DEFAULT_BINDS },
};

const KEY = 'last-protocol.settings.v1';

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT_SETTINGS);
    const s = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULT_SETTINGS),
      ...s,
      crosshair: { ...DEFAULT_SETTINGS.crosshair, ...(s.crosshair ?? {}) },
      binds: { ...DEFAULT_BINDS, ...(s.binds ?? {}) },
    };
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable: settings live for this session only */
  }
}

/** Team identification colors; colorblind presets keep the two teams distinct. */
export function iffColors(cb: Colorblind): { intrusion: string; custodian: string } {
  switch (cb) {
    case 'deutan':
    case 'protan':
      return { intrusion: '#ffb000', custodian: '#3d8bff' };
    case 'tritan':
      return { intrusion: '#ff4f6d', custodian: '#20e0c0' };
    default:
      return { intrusion: '#ffab2e', custodian: '#38e1ff' };
  }
}

export function keyLabel(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  const map: Record<string, string> = { Space: 'Space', ControlLeft: 'L-Ctrl', ShiftLeft: 'L-Shift', Tab: 'Tab', ControlRight: 'R-Ctrl', ShiftRight: 'R-Shift', AltLeft: 'L-Alt', CapsLock: 'Caps' };
  return map[code] ?? code;
}

// ---- match history (local only) ----
export interface HistoryEntry {
  date: string;
  mode: string;
  won: boolean | null;
  score: [number, number];
  kills: number;
  deaths: number;
  assists: number;
  adr: number;
  matchId: string;
}
const HKEY = 'last-protocol.history.v1';
export function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HKEY) ?? '[]');
  } catch {
    return [];
  }
}
export function pushHistory(e: HistoryEntry): void {
  try {
    const h = loadHistory();
    h.unshift(e);
    localStorage.setItem(HKEY, JSON.stringify(h.slice(0, 30)));
  } catch {
    /* ignore */
  }
}
