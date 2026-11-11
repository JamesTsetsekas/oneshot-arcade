// client-runtime: batched read model for the HUD. The game loop writes to this store ~10 times a
// second; React subscribes with useSyncExternalStore. Nothing in React runs per frame.

import { useSyncExternalStore } from 'react';
import type { HeroId } from '../../shared/heroes';
import type { HeroPublic, MatchMode, ObjectiveView, SelfView, TeamView } from '../../shared/protocol';

export interface FeedItem {
  id: number;
  at: number;
  kind: 'kill' | 'info';
  text: string;
  team: number;
  killer?: HeroId;
  victim?: HeroId;
  killerName?: string;
  victimName?: string;
  assists?: number;
  gold?: number;
}

export interface HudState {
  active: boolean;
  time: number;
  you: SelfView | null;
  self: { hp: number; mhp: number; mp: number; mmp: number; sh: number; st: number } | null;
  heroId: HeroId;
  viewer: 0 | 1;
  mode: MatchMode;
  heroes: HeroPublic[];
  teams: [TeamView, TeamView] | null;
  objectives: ObjectiveView[];
  structs: { alive: [number, number]; total: number; sealsDown: [number, number] };
  feed: FeedItem[];
  announce: { msg: string; kind: string; tone: 'good' | 'bad' | 'neutral'; at: number } | null;
  toast: { msg: string; at: number } | null;
  shopOpen: boolean;
  scoreOpen: boolean;
  menuOpen: boolean;
  paused: boolean;
  timeScale: number;
  camLocked: boolean;
  aiming: number;
  amove: boolean;
  tutorial: Record<string, boolean>;
  towerWarn: boolean;
  fps: number;
  drawCalls: number;
  over: { winner: 0 | 1; duration: number } | null;
  link: string;
}

export const initialHud = (): HudState => ({
  active: false,
  time: 0,
  you: null,
  self: null,
  heroId: 'brannoch',
  viewer: 0,
  mode: 'unranked',
  heroes: [],
  teams: null,
  objectives: [],
  structs: { alive: [0, 0], total: 0, sealsDown: [0, 0] },
  feed: [],
  announce: null,
  toast: null,
  shopOpen: false,
  scoreOpen: false,
  menuOpen: false,
  paused: false,
  timeScale: 1,
  camLocked: true,
  aiming: -1,
  amove: false,
  tutorial: {},
  towerWarn: false,
  fps: 60,
  drawCalls: 0,
  over: null,
  link: '',
});

class Store<T> {
  private state: T;
  private subs = new Set<() => void>();
  constructor(init: T) {
    this.state = init;
  }
  get = (): T => this.state;
  set(patch: Partial<T>): void {
    this.state = { ...this.state, ...patch };
    for (const s of this.subs) s();
  }
  reset(v: T): void {
    this.state = v;
    for (const s of this.subs) s();
  }
  subscribe = (fn: () => void): (() => void) => {
    this.subs.add(fn);
    return () => this.subs.delete(fn);
  };
}

export const hud = new Store<HudState>(initialHud());

export function useHud<S>(sel: (s: HudState) => S): S {
  return useSyncExternalStore(hud.subscribe, () => sel(hud.get()));
}
