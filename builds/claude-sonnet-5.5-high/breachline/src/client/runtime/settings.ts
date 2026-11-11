// Settings and keybinds (persisted in localStorage; every access is guarded).
import { clamp } from "../../shared/math";

export type QualityPreset = "low" | "medium" | "high";
export type ColorblindMode = "off" | "deuteranopia" | "protanopia" | "tritanopia";

export interface Settings {
  preset: QualityPreset;
  renderScale: number; // 0.5..1
  dynamicResolution: boolean;
  shadows: boolean;
  effects: number; // 0..1 particle density
  antiAliasing: boolean;
  fov: number; // horizontal degrees @16:9
  viewmodelFov: number;
  sensitivity: number; // 0.1..10
  adsSensMul: number; // 0.3..1.5
  invertY: boolean;
  holdAds: boolean;
  holdCrouch: boolean;
  holdSprint: boolean;
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  hitMarkerAudio: boolean;
  subtitles: boolean;
  colorblind: ColorblindMode;
  reducedMotion: boolean;
  photosensitive: boolean;
  bobScale: number; // 0..1
  shakeScale: number; // 0..1
  showFps: boolean;
  keys: Record<string, string>;
}

export const DEFAULT_KEYS: Record<string, string> = {
  forward: "KeyW", back: "KeyS", left: "KeyA", right: "KeyD",
  sprint: "ShiftLeft", crouch: "ControlLeft", crouchAlt: "KeyC", jump: "Space",
  reload: "KeyR", interact: "KeyE", melee: "KeyF", lethal: "KeyG", tactical: "KeyQ",
  primary: "Digit1", secondary: "Digit2", supportSelect: "Digit3", supportDeploy: "Digit4",
  fireMode: "KeyV", ping: "KeyX", scoreboard: "Tab", loadout: "KeyM", inspect: "KeyB",
};

export const KEY_LABELS: Record<string, string> = {
  forward: "Move forward", back: "Move back", left: "Strafe left", right: "Strafe right", sprint: "Sprint", crouch: "Crouch", crouchAlt: "Crouch (alt)",
  jump: "Jump / mantle", reload: "Reload", interact: "Interact", melee: "Quick melee", lethal: "Lethal equipment", tactical: "Tactical equipment",
  primary: "Primary weapon", secondary: "Sidearm", supportSelect: "Select support", supportDeploy: "Deploy support", fireMode: "Fire mode",
  ping: "Ping", scoreboard: "Scoreboard", loadout: "Loadout (on death)", inspect: "Inspect weapon",
};

export const PRESETS: Record<QualityPreset, Partial<Settings>> = {
  low: { renderScale: 0.67, shadows: false, effects: 0.4, antiAliasing: false },
  medium: { renderScale: 0.85, shadows: true, effects: 0.75, antiAliasing: true },
  high: { renderScale: 1, shadows: true, effects: 1, antiAliasing: true },
};

export function defaultSettings(): Settings {
  return {
    preset: "medium", renderScale: 0.85, dynamicResolution: true, shadows: true, effects: 0.75, antiAliasing: true, fov: 90, viewmodelFov: 65,
    sensitivity: 2.5, adsSensMul: 0.85, invertY: false, holdAds: true, holdCrouch: false, holdSprint: true,
    masterVolume: 0.7, sfxVolume: 1, musicVolume: 0.5, hitMarkerAudio: true, subtitles: true, colorblind: "off", reducedMotion: false,
    photosensitive: false, bobScale: 1, shakeScale: 1, showFps: false, keys: { ...DEFAULT_KEYS },
  };
}

const KEY = "breachline.settings.v1";

export function loadSettings(): Settings {
  const d = defaultSettings();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return d;
    const o = JSON.parse(raw) as Partial<Settings>;
    const s = { ...d, ...o, keys: { ...d.keys, ...(o.keys ?? {}) } };
    s.sensitivity = clamp(s.sensitivity, 0.1, 10);
    s.fov = clamp(s.fov, 75, 110);
    s.viewmodelFov = clamp(s.viewmodelFov, 55, 75);
    return s;
  } catch { return d; }
}
export function saveSettings(s: Settings): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable */ }
}

/** Horizontal FOV (at a 16:9 reference or actual aspect) to vertical FOV in radians. */
export function hfovToVfov(hfovDeg: number, aspect: number): number {
  const h = (hfovDeg * Math.PI) / 180;
  return 2 * Math.atan(Math.tan(h / 2) / aspect);
}
