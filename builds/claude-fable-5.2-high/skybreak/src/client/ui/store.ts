// client-ui: batched HUD read model. The game loop writes here a few times per second; React only reads.
import { useSyncExternalStore } from "react";
import type { Pace } from "../../shared/content/rules";
import type { FocusView, LootView, MatchPhase, MatchResults, SelfView, StormView } from "../../shared/protocol/protocol";

export interface FeedEntry {
  id: number;
  killer: string;
  victim: string;
  cause: string;
  mine: boolean;
  time: number;
}
export interface Toast {
  id: number;
  msg: string;
  tone: "info" | "warn" | "good";
  time: number;
}
export interface Banner {
  title: string;
  sub: string;
  tone: "info" | "storm" | "good" | "bad";
  until: number;
}

export type Screen = "loading" | "error" | "menu" | "queue" | "match" | "results";
export type Overlay = "none" | "map" | "inventory" | "pause" | "settings";

export interface HudState {
  screen: Screen;
  errorText: string;
  loadingLabel: string;
  loadingFrac: number;
  overlay: Overlay;
  mode: "solo" | "practice";
  pace: Pace;
  phase: MatchPhase;
  phaseTimer: number;
  alive: number;
  total: number;
  you: SelfView | null;
  actorMode: number;
  spectating: string | null;
  dead: null | { placement: number; by: string };
  storm: StormView | null;
  distToSafe: number;
  focus: FocusView;
  focusLoot: LootView | null;
  feed: FeedEntry[];
  toasts: Toast[];
  banner: Banner | null;
  results: MatchResults | null;
  locked: boolean;
  location: string;
  practiceHit: null | { dmg: number; zone: string; dist: number; shield: boolean };
  now: number;
  fps: number;
  renderScale: number;
  tickMs: number;
  pings: { kind: "capsule" | "caravan"; x: number; z: number; time: number }[];
  queueText: string;
  onSkiff: boolean;
}

function initial(): HudState {
  return {
    screen: "loading", errorText: "", loadingLabel: "Starting", loadingFrac: 0, overlay: "none", mode: "solo", pace: "standard",
    phase: "staging", phaseTimer: 0, alive: 0, total: 0, you: null, actorMode: 4, spectating: null, dead: null, storm: null,
    distToSafe: 0, focus: null, focusLoot: null, feed: [], toasts: [], banner: null, results: null, locked: false, location: "",
    practiceHit: null, now: 0, fps: 0, renderScale: 1, tickMs: 0, pings: [], queueText: "", onSkiff: false,
  };
}

let state = initial();
const listeners = new Set<() => void>();

export const hud = {
  get: (): HudState => state,
  set(patch: Partial<HudState>): void {
    state = { ...state, ...patch };
    for (const l of listeners) l();
  },
  subscribe(l: () => void): () => void {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useHud<T>(selector: (s: HudState) => T): T {
  return useSyncExternalStore(hud.subscribe, () => selector(state));
}
