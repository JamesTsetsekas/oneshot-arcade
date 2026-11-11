import { useSyncExternalStore } from "react";
import type { SaveListing } from "../persistence/save";
import type { DamageType } from "../data/types";

export type Screen = "boot" | "menu" | "create" | "characters" | "settings" | "credits" | "game" | "error";
export type Panel = null | "inventory" | "skills" | "character" | "quests" | "map" | "vendor" | "stash" | "artificer" | "waypoint" | "dialog" | "training" | "hunt";

export interface Toast { id: number; text: string; kind: string; t: number }
export interface SkillSlot { id: string | null; icon: string; name: string; cdFrac: number; cdLeft: number; charges: number | null; affordable: boolean; key: string; active?: boolean }
export interface HudSnapshot {
  hp: number; maxHp: number; focus: number; maxFocus: number; heat: number; cls: string; level: number; xp: number; xpNext: number; gold: number; dust: number;
  belt: Record<string, number>; beltCap: number; slots: SkillSlot[]; basic: SkillSlot; evade: number; evadeMax: number; evadeFrac: number;
  statuses: { id: string; label: string; left: number; good: boolean }[];
  boss: { name: string; hp: number; phase: number; armor: number | null; stagger: number | null; invuln: boolean; enraged: boolean } | null;
  target: { name: string; hp: number; mods: string[]; info: string; level: number; elite: boolean } | null;
  channel: number | null; quests: { name: string; step: string; optional: boolean }[]; zone: string; fps: number; markReady: boolean; difficulty: string;
  skillPoints: number; attrPoints: number; potionKeys: string[]; huntTime: number | null; furnace: boolean;
}

export interface UIState {
  screen: Screen;
  settingsFrom: "menu" | "pause";
  error: { title: string; detail: string; retry?: boolean } | null;
  saves: SaveListing[];
  persistent: boolean;
  notice: string | null;
  panel: Panel;
  dialogNpc: string | null;
  automap: boolean;
  paused: boolean;
  loading: string | null;
  death: { cause: string; type: DamageType } | null;
  actBanner: boolean;
  summary: boolean;
  toasts: Toast[];
  subtitle: { who: string; text: string; t: number } | null;
  hud: HudSnapshot | null;
  version: number;
  zoneBanner: { name: string; t: number } | null;
  tutorial: { steps: Record<string, boolean>; visible: boolean };
  confirm: { text: string; yes: string; onYes: () => void } | null;
  compare: boolean;
  artSel: number | null;
}

type Listener = () => void;
let state: UIState = {
  screen: "boot", settingsFrom: "menu", error: null, saves: [], persistent: true, notice: null, panel: null, dialogNpc: null, automap: false, paused: false,
  loading: null, death: null, actBanner: false, summary: false, toasts: [], subtitle: null, hud: null, version: 0, zoneBanner: null,
  tutorial: { steps: {}, visible: false }, confirm: null, compare: true, artSel: null,
};
const listeners = new Set<Listener>();

export const store = {
  get: () => state,
  set(patch: Partial<UIState> | ((s: UIState) => Partial<UIState>)) {
    const p = typeof patch === "function" ? patch(state) : patch;
    state = { ...state, ...p };
    for (const l of listeners) l();
  },
  bump() { store.set((s) => ({ version: s.version + 1 })); },
  subscribe(l: Listener) { listeners.add(l); return () => { listeners.delete(l); }; },
};

let toastId = 1;
export function toast(text: string, kind = "info") {
  const cur = state.toasts;
  const dup = cur.find((t) => t.text === text);
  if (dup) { store.set({ toasts: cur.map((t) => (t === dup ? { ...t, t: performance.now() } : t)) }); return; }
  store.set((s) => ({ toasts: [...s.toasts.slice(-5), { id: toastId++, text, kind, t: performance.now() }] }));
}

export function useStore<T>(sel: (s: UIState) => T): T {
  return useSyncExternalStore(store.subscribe, () => sel(state));
}
