import type { AudioVolumes } from "../audio/audio";

export type Action =
  | "skill1" | "skill2" | "skill3" | "skill4" | "potion1" | "potion2" | "potion3" | "potion4"
  | "evade" | "standStill" | "showLabels" | "compare" | "automap" | "map" | "inventory" | "skills" | "character" | "quests" | "interact" | "townGate";

export const ACTION_LABELS: Record<Action, string> = {
  skill1: "Skill slot 1", skill2: "Skill slot 2", skill3: "Skill slot 3", skill4: "Skill slot 4",
  potion1: "Red Draught", potion2: "Blue Draught", potion3: "White Draught", potion4: "Gold Tonic",
  evade: "Evasive step", standStill: "Stand still (attack in place)", showLabels: "Show ground labels", compare: "Compare equipped",
  automap: "Automap overlay", map: "Full map", inventory: "Inventory", skills: "Skills", character: "Character", quests: "Quest log",
  interact: "Interact / pick up", townGate: "Town-gate",
};

export const DEFAULT_KEYS: Record<Action, string> = {
  skill1: "KeyQ", skill2: "KeyW", skill3: "KeyE", skill4: "KeyR", potion1: "Digit1", potion2: "Digit2", potion3: "Digit3", potion4: "Digit4",
  evade: "Space", standStill: "ShiftLeft", showLabels: "AltLeft", compare: "ControlLeft", automap: "Tab", map: "KeyM", inventory: "KeyI",
  skills: "KeyK", character: "KeyC", quests: "KeyJ", interact: "KeyF", townGate: "KeyT",
};

/** Left-handed preset: mouse in the left hand, keyboard actions on the right half. */
export const LEFT_HANDED_KEYS: Record<Action, string> = {
  skill1: "KeyU", skill2: "KeyI", skill3: "KeyO", skill4: "KeyP", potion1: "Digit7", potion2: "Digit8", potion3: "Digit9", potion4: "Digit0",
  evade: "Space", standStill: "ShiftRight", showLabels: "AltRight", compare: "ControlRight", automap: "Backslash", map: "KeyM", inventory: "KeyB",
  skills: "KeyN", character: "KeyH", quests: "KeyL", interact: "KeyK", townGate: "KeyY",
};

export interface Settings {
  quality: "low" | "medium" | "high";
  dynamicResolution: boolean;
  shadows: boolean;
  particles: number;
  gore: boolean;
  screenShake: boolean;
  damageNumbers: boolean;
  labels: "always" | "alt" | "rare";
  volumes: AudioVolumes;
  reducedMotion: boolean;
  reducedFlash: boolean;
  colorblind: boolean;
  subtitles: boolean;
  autoPickup: boolean;
  attackWithoutMove: boolean;
  advancedItems: boolean;
  orbit: boolean;
  showFps: boolean;
  keys: Record<Action, string>;
}

export function defaultSettings(): Settings {
  return {
    quality: "medium", dynamicResolution: true, shadows: true, particles: 1, gore: true, screenShake: true, damageNumbers: true, labels: "rare",
    volumes: { master: 0.8, music: 0.55, sfx: 0.8, ui: 0.7, ambience: 0.6 }, reducedMotion: false, reducedFlash: false, colorblind: false, subtitles: true,
    autoPickup: true, attackWithoutMove: false, advancedItems: false, orbit: false, showFps: false, keys: { ...DEFAULT_KEYS },
  };
}

export function mergeSettings(saved: Partial<Settings> | undefined): Settings {
  const d = defaultSettings();
  if (!saved) return d;
  return { ...d, ...saved, volumes: { ...d.volumes, ...(saved.volumes ?? {}) }, keys: { ...d.keys, ...(saved.keys ?? {}) } };
}

export function keyName(code: string): string {
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  if (code === "Mouse3") return "Mouse 4";
  if (code === "Mouse4") return "Mouse 5";
  return ({ Space: "Space", ShiftLeft: "Shift", ShiftRight: "R-Shift", AltLeft: "Alt", AltRight: "R-Alt", ControlLeft: "Ctrl", ControlRight: "R-Ctrl", Tab: "Tab", Backslash: "\\", Escape: "Esc" } as Record<string, string>)[code] ?? code;
}
