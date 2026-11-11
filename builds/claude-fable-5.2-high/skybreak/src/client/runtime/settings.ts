// Local-only persistence: settings and the guest profile (cosmetics + mastery). No accounts, no network.
import type { Quality } from "../renderer/world";

export type Action =
  | "forward" | "back" | "left" | "right" | "jump" | "sprint" | "crouch" | "interact" | "reload" | "melee" | "sail" | "throw"
  | "shoulder" | "inventory" | "map" | "slot1" | "slot2" | "slot3" | "slot4" | "slot5" | "freelook" | "ready";

export const ACTION_LABELS: Record<Action, string> = {
  forward: "Move forward", back: "Move back", left: "Strafe left", right: "Strafe right", jump: "Jump / mantle", sprint: "Sprint",
  crouch: "Crouch / slide", interact: "Interact / pick up", reload: "Reload", melee: "Quick melee", sail: "Deploy / stow wing-sail",
  throw: "Throw utility", shoulder: "Swap shoulder", inventory: "Inventory", map: "Full map", slot1: "Slot 1", slot2: "Slot 2",
  slot3: "Slot 3", slot4: "Slot 4", slot5: "Slot 5", freelook: "Free look", ready: "Ready up (staging)",
};

export const DEFAULT_BINDS: Record<Action, string[]> = {
  forward: ["KeyW", "ArrowUp"], back: ["KeyS", "ArrowDown"], left: ["KeyA", "ArrowLeft"], right: ["KeyD", "ArrowRight"],
  jump: ["Space"], sprint: ["ShiftLeft"], crouch: ["ControlLeft", "KeyC"], interact: ["KeyE"], reload: ["KeyR"], melee: ["KeyF"],
  sail: ["KeyZ"], throw: ["KeyG"], shoulder: ["KeyX"], inventory: ["Tab"], map: ["KeyM"],
  slot1: ["Digit1"], slot2: ["Digit2"], slot3: ["Digit3"], slot4: ["Digit4"], slot5: ["Digit5"], freelook: ["AltLeft"], ready: ["Enter"],
};

export interface Settings {
  quality: Quality;
  dynamicRes: boolean;
  fov: number;
  sens: number;
  adsSens: number;
  invertY: boolean;
  master: number;
  sfx: number;
  music: number;
  toggleAds: boolean;
  toggleCrouch: boolean;
  reducedMotion: boolean;
  soundIndicators: boolean;
  captions: boolean;
  highContrast: boolean;
  damageNumbers: boolean;
  binds: Record<Action, string[]>;
}

export interface Profile {
  name: string;
  body: number;
  primary: string;
  secondary: string;
  sail: string;
  matches: number;
  wins: number;
  kills: number;
  best: number;
  xp: number;
  history: { date: string; placement: number; kills: number; damage: number; pace: string }[];
}

const SETTINGS_KEY = "skybreak.settings.v1";
const PROFILE_KEY = "skybreak.profile.v1";

export function defaultSettings(): Settings {
  return {
    quality: "medium", dynamicRes: true, fov: 90, sens: 1, adsSens: 0.8, invertY: false, master: 0.8, sfx: 0.9, music: 0.5,
    toggleAds: false, toggleCrouch: false, reducedMotion: false, soundIndicators: true, captions: false, highContrast: false,
    damageNumbers: true, binds: JSON.parse(JSON.stringify(DEFAULT_BINDS)) as Record<Action, string[]>,
  };
}

export function defaultProfile(): Profile {
  return { name: "Drifter", body: 0, primary: "#1fb0a6", secondary: "#f4b63a", sail: "#ea6a50", matches: 0, wins: 0, kills: 0, best: 0, xp: 0, history: [] };
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<T>;
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: settings simply do not persist */
  }
}

type Listener = () => void;

class Persisted<T extends object> {
  value: T;
  private listeners = new Set<Listener>();
  constructor(private key: string, fallback: T) {
    this.value = read(key, fallback);
  }
  get = (): T => this.value;
  set(patch: Partial<T>): void {
    this.value = { ...this.value, ...patch };
    write(this.key, this.value);
    for (const l of this.listeners) l();
  }
  subscribe = (l: Listener): (() => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };
}

export const settingsStore = new Persisted<Settings>(SETTINGS_KEY, defaultSettings());
export const profileStore = new Persisted<Profile>(PROFILE_KEY, defaultProfile());
// repair binds if a newer build adds actions
{
  const b = settingsStore.value.binds as Partial<Record<Action, string[]>>;
  let fixed = false;
  for (const k of Object.keys(DEFAULT_BINDS) as Action[]) {
    if (!Array.isArray(b[k])) {
      b[k] = [...DEFAULT_BINDS[k]];
      fixed = true;
    }
  }
  if (fixed) settingsStore.set({ binds: b as Record<Action, string[]> });
}

export const BODY_NAMES = ["Wayfarer", "Kiteback", "Coppercoat", "Driftweaver"];
export const CLOTH_COLORS = ["#1fb0a6", "#ea6a50", "#f4b63a", "#cc4c9f", "#4f63d6", "#7ac74f", "#e8e2cf", "#8a5cd6", "#d9773a", "#3fa7d6"];

export function masteryLevel(xp: number): { level: number; into: number; need: number } {
  let level = 1;
  let need = 400;
  let left = xp;
  while (left >= need) {
    left -= need;
    level++;
    need = Math.round(need * 1.15);
  }
  return { level, into: left, need };
}

export function keyLabel(code: string): string {
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  const map: Record<string, string> = {
    Space: "Space", ShiftLeft: "L-Shift", ShiftRight: "R-Shift", ControlLeft: "L-Ctrl", ControlRight: "R-Ctrl", AltLeft: "L-Alt",
    AltRight: "R-Alt", Tab: "Tab", Enter: "Enter", ArrowUp: "Up", ArrowDown: "Down", ArrowLeft: "Left", ArrowRight: "Right",
    Mouse3: "Mouse 4", Mouse4: "Mouse 5", Backquote: "`", CapsLock: "Caps",
  };
  return map[code] ?? code;
}
