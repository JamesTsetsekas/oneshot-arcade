// Batched read model for React HUD: combat state is pushed every frame but React re-renders at <=10 Hz.
import { useSyncExternalStore } from 'react';
import type { Snapshot, DeathRecap, PingKind } from '../../protocol/messages';

export interface FeedItem { id: number; t: number; text: string; tone: 'good' | 'bad' | 'neutral'; icon?: string }
export interface HudState {
  snap: Snapshot | null;
  feed: FeedItem[];
  banner: { text: string; tone: 'good' | 'bad' | 'neutral'; until: number } | null;
  caption: { text: string; until: number } | null;
  chat: Array<{ id: number; from: string; text: string; t: number }>;
  recap: DeathRecap | null;
  reject: { text: string; until: number } | null;
  shopOpen: boolean; scoreOpen: boolean; statsOpen: boolean; mapOpen: boolean; menuOpen: boolean; chatOpen: boolean;
  targeting: { slot: string; name: string } | null;
  pingWheel: { x: number; y: number; wx: number; wy: number } | null;
  tutorialStep: number;
  fps: number;
  muted: Set<number>;
  hoverAbility: number;
  lastPing: { kind: PingKind; t: number } | null;
}

export class HudStore {
  state: HudState = {
    snap: null, feed: [], banner: null, caption: null, chat: [], recap: null, reject: null,
    shopOpen: false, scoreOpen: false, statsOpen: false, mapOpen: false, menuOpen: false, chatOpen: false,
    targeting: null, pingWheel: null, tutorialStep: 0, fps: 0, muted: new Set(), hoverAbility: -1, lastPing: null,
  };
  private listeners = new Set<() => void>();
  private dirty = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private feedId = 1;

  subscribe = (f: () => void) => { this.listeners.add(f); return () => this.listeners.delete(f); };
  get = () => this.state;

  start() {
    this.timer = setInterval(() => { if (this.dirty) this.flush(); }, 100);
  }
  stop() { if (this.timer) clearInterval(this.timer); }
  /** Batched update (flushed at 10 Hz). */
  patch(p: Partial<HudState>) { Object.assign(this.state, p); this.dirty = true; }
  /** Immediate update for user-driven UI toggles. */
  set(p: Partial<HudState>) { this.state = { ...this.state, ...p }; this.dirty = false; this.emit(); }
  private flush() { this.state = { ...this.state }; this.dirty = false; this.emit(); }
  private emit() { for (const f of this.listeners) f(); }

  pushFeed(text: string, tone: FeedItem['tone'], t: number, icon?: string) {
    const feed = [...this.state.feed, { id: this.feedId++, t, text, tone, icon }].slice(-7);
    this.patch({ feed });
  }
}

export function useHud(store: HudStore): HudState {
  return useSyncExternalStore(store.subscribe, store.get);
}
