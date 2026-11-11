// Player settings: presets, accessibility, audio buses and rebindable controls (localStorage).
export type Action = 'forward' | 'back' | 'left' | 'right' | 'sprint' | 'crouch' | 'jump' | 'interact' | 'action' | 'reload' | 'gadget' | 'gadgetCycle'
  | 'medkit' | 'map' | 'phone' | 'shoulder' | 'holster' | 'camera' | 'slot1' | 'slot2' | 'slot3' | 'wheel' | 'radio';
export const ACTION_LABELS: Record<Action, string> = {
  forward: 'Move forward / Throttle', back: 'Move back / Brake · Reverse', left: 'Move left / Steer left', right: 'Move right / Steer right',
  sprint: 'Sprint', crouch: 'Crouch', jump: 'Jump · Vault / Handbrake', interact: 'Interact / Enter vehicle', action: 'Melee · Takedown / Exit vehicle',
  reload: 'Reload / Circuit reset (hold)', gadget: 'Throw gadget', gadgetCycle: 'Switch gadget', medkit: 'Use medkit', map: 'Map', phone: 'Phone',
  shoulder: 'Swap shoulder / Look back', holster: 'Holster weapon / Horn', camera: 'Vehicle camera', slot1: 'Sidearm', slot2: 'Long gun', slot3: 'Stun projector',
  wheel: 'Weapon wheel', radio: 'Next radio station',
};
export const DEFAULT_BINDS: Record<Action, string> = {
  forward: 'KeyW', back: 'KeyS', left: 'KeyA', right: 'KeyD', sprint: 'ShiftLeft', crouch: 'ControlLeft', jump: 'Space', interact: 'KeyE', action: 'KeyF',
  reload: 'KeyR', gadget: 'KeyG', gadgetCycle: 'KeyQ', medkit: 'KeyZ', map: 'KeyM', phone: 'KeyP', shoulder: 'KeyX', holster: 'KeyH', camera: 'KeyC',
  slot1: 'Digit1', slot2: 'Digit2', slot3: 'Digit3', wheel: 'Tab', radio: 'KeyN',
};
export interface Settings {
  quality: 'low' | 'medium' | 'high'; renderScale: number; viewDistance: number; trafficDensity: number; pedDensity: number;
  fov: number; sensitivity: number; invertY: boolean; steerSensitivity: number; recenter: boolean; recenterDelay: number;
  toggleCrouch: boolean; toggleAim: boolean; toggleSprint: boolean; traction: boolean; stability: boolean;
  master: number; sfx: number; music: number; ambience: number; streamerMode: boolean;
  subtitles: boolean; subtitleScale: number; reducedMotion: boolean; reducedFlashes: boolean; colorblind: boolean; minimapRotate: boolean; showFps: boolean;
  binds: Record<Action, string>;
}
export const QUALITY_PRESETS: Record<Settings['quality'], Pick<Settings, 'renderScale' | 'viewDistance' | 'trafficDensity' | 'pedDensity'>> = {
  low: { renderScale: 0.75, viewDistance: 140, trafficDensity: 14, pedDensity: 26 },
  medium: { renderScale: 1, viewDistance: 185, trafficDensity: 22, pedDensity: 44 },
  high: { renderScale: 1, viewDistance: 240, trafficDensity: 30, pedDensity: 58 },
};
export function defaultSettings(): Settings {
  return {
    quality: 'medium', ...QUALITY_PRESETS.medium, fov: 85, sensitivity: 1, invertY: false, steerSensitivity: 1, recenter: true, recenterDelay: 1.6,
    toggleCrouch: false, toggleAim: false, toggleSprint: false, traction: true, stability: true,
    master: 0.8, sfx: 0.9, music: 0.55, ambience: 0.7, streamerMode: false,
    subtitles: true, subtitleScale: 1, reducedMotion: false, reducedFlashes: false, colorblind: false, minimapRotate: true, showFps: false,
    binds: { ...DEFAULT_BINDS },
  };
}
const KEY = 'meridian-run.settings.v1';
export function loadSettings(): Settings {
  const d = defaultSettings();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (raw && typeof raw === 'object') { Object.assign(d, raw); d.binds = { ...DEFAULT_BINDS, ...(raw.binds ?? {}) }; }
  } catch { /* corrupted settings fall back to defaults */ }
  return d;
}
export function saveSettings(s: Settings) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage may be unavailable */ } }
export function keyName(code: string): string {
  return code.replace(/^Key/, '').replace(/^Digit/, '').replace('ShiftLeft', 'Shift').replace('ShiftRight', 'R-Shift').replace('ControlLeft', 'Ctrl').replace('ControlRight', 'R-Ctrl').replace('AltLeft', 'Alt').replace('Arrow', '');
}
