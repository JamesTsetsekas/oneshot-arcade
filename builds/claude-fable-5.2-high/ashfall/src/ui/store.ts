import { useSyncExternalStore } from 'react';
import type { SaveSummary } from '../persistence/repo';

export const DEFAULT_KEYS: Record<string, string> = {
  skill1: 'KeyQ', skill2: 'KeyW', skill3: 'KeyE', skill4: 'KeyR', potion1: 'Digit1', potion2: 'Digit2', potion3: 'Digit3', potion4: 'Digit4',
  evade: 'Space', interact: 'KeyF', gate: 'KeyT', inventory: 'KeyI', skills: 'KeyK', character: 'KeyC', quests: 'KeyJ', map: 'KeyM', automap: 'Tab', labels: 'AltLeft', stand: 'ShiftLeft',
};
export const LEFT_KEYS: Record<string, string> = {
  skill1: 'KeyU', skill2: 'KeyI', skill3: 'KeyO', skill4: 'KeyP', potion1: 'Digit7', potion2: 'Digit8', potion3: 'Digit9', potion4: 'Digit0',
  evade: 'Space', interact: 'KeyH', gate: 'KeyY', inventory: 'KeyB', skills: 'KeyN', character: 'KeyV', quests: 'KeyG', map: 'KeyM', automap: 'Backslash', labels: 'AltRight', stand: 'ShiftRight',
};
export const KEY_LABELS: Record<string, string> = {
  skill1: 'Skill slot 2', skill2: 'Skill slot 3', skill3: 'Skill slot 4', skill4: 'Skill slot 5', potion1: 'Red Draught', potion2: 'Blue Draught', potion3: 'White Salt', potion4: 'Gold Tonic',
  evade: 'Evasive step', interact: 'Interact / pick up', gate: 'Town gate', inventory: 'Inventory', skills: 'Skills', character: 'Character', quests: 'Quest log', map: 'Full map', automap: 'Toggle minimap', labels: 'Toggle item labels', stand: 'Stand still (hold)',
};
export const keyName = (code: string) => code.replace(/^Key|^Digit/, '').replace('Left', '').replace('Right', ' R').replace('Space', 'Space');
export interface Settings {
  quality: 'low' | 'medium' | 'high'; shake: boolean; reducedMotion: boolean; particles: number; damageNumbers: boolean; labels: boolean; colorblind: boolean;
  advanced: boolean; minimap: boolean; master: number; sfx: number; music: number; ambient: number; keys: Record<string, string>; tutorialDone: boolean;
}
export const DEFAULT_SETTINGS: Settings = { quality: 'medium', shake: true, reducedMotion: false, particles: 1, damageNumbers: true, labels: true, colorblind: false, advanced: false, minimap: true,
  master: 0.8, sfx: 0.9, music: 0.6, ambient: 0.7, keys: { ...DEFAULT_KEYS }, tutorialDone: false };

export interface HudSlot { id: string | null; icon: string; name: string; cd: number; cdText: string; charges: number; ok: boolean; key: string; dtype: string }
export interface HudState {
  hp: number; hpMax: number; focus: number; focusMax: number; res: number; resLabel: string; xp: number; level: number; gold: number;
  belt: number[]; beltCap: number; potionCd: number[]; slots: HudSlot[]; evade: number; buffs: { id: string; label: string; t: number; good: boolean }[];
  quest: { title: string; text: string }; zone: string; safe: boolean; points: number; gate: number; dps: number; guard: number;
  boss: null | { name: string; hp: number; armor: number; stagger: number; cast: number; castNeed: number; phase: number; enrage: boolean; staggered: boolean };
  target: null | { name: string; hp: number; lvl: number; mods: string[]; desc: string };
}
export type PanelId = 'inventory' | 'skills' | 'character' | 'quests' | 'map';
export interface Toast { id: number; text: string; kind: string }
export interface UiState {
  screen: 'boot' | 'menu' | 'create' | 'characters' | 'game' | 'error' | 'credits';
  panel: PanelId | null; dialog: string | null; paused: boolean; settingsOpen: boolean;
  death: null | { cause: string; respawn: string; echo: number }; summary: boolean; banner: null | { text: string; sub: string; id: number };
  toasts: Toast[]; heroVersion: number; hud: HudState | null; settings: Settings; saves: SaveSummary[]; error: string; notice: string;
  hint: string | null; loading: boolean; fps: number;
}
let state: UiState = {
  screen: 'boot', panel: null, dialog: null, paused: false, settingsOpen: false, death: null, summary: false, banner: null, toasts: [], heroVersion: 0, hud: null,
  settings: DEFAULT_SETTINGS, saves: [], error: '', notice: '', hint: null, loading: false, fps: 0,
};
const listeners = new Set<() => void>();
export const ui = {
  get: () => state,
  set(patch: Partial<UiState>) { state = { ...state, ...patch }; for (const l of listeners) l(); },
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
};
/** Selector hook over the lightweight store; HUD updates are batched by the game loop (10 Hz). */
export function useUi<T>(sel: (s: UiState) => T): T {
  return useSyncExternalStore(ui.subscribe, () => sel(state));
}
let toastId = 1;
export function pushToast(text: string, kind = 'info'): void {
  const t = { id: toastId++, text, kind };
  ui.set({ toasts: [...state.toasts.slice(-4), t] });
  setTimeout(() => ui.set({ toasts: ui.get().toasts.filter((x) => x.id !== t.id) }), kind === 'quest' ? 5200 : 3200);
}
