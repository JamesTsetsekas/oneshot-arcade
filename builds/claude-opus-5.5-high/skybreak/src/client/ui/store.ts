// HUD read model: the runtime batches updates into one immutable state
// object per rendered frame; React subscribes via useSyncExternalStore.

import { useSyncExternalStore } from 'react';
import type { Snapshot } from '../../shared/protocol/messages';

export interface HudState {
  snap: Snapshot | null;
  yaw: number;
  now: number;
  selSlot: number;
  locked: boolean;
  overlay: 'none' | 'map' | 'inventory';
  fps: number;
  hitMarkers: { id: number; kind: string; broke: boolean; t: number }[];
  hurts: { id: number; angle: number; shield: boolean; t: number }[];
  feed: { id: number; text: string; mine: boolean; t: number }[];
  toasts: { id: number; text: string; rarity: number; t: number }[];
  sounds: { id: number; label: string; angle: number; near: boolean; t: number }[];
  pings: { id: number; kind: string; x: number; z: number; t: number }[];
  damageNums: { id: number; x: number; y: number; amt: number; kind: string; age: number }[];
  practice: { last: number; total: number; dps: number; hits: number } | null;
  winner: string | null;
}

let nid = 1;

export class HudStore {
  state: HudState = {
    snap: null, yaw: 0, now: 0, selSlot: 0, locked: false, overlay: 'none', fps: 0, hitMarkers: [], hurts: [], feed: [], toasts: [], sounds: [], pings: [],
    damageNums: [], practice: null, winner: null,
  };
  private listeners = new Set<() => void>();
  private pending = false;

  set(patch: Partial<HudState>) {
    this.state = { ...this.state, ...patch };
    this.emit();
  }
  private emit() {
    if (this.pending) return;
    this.pending = true;
    queueMicrotask(() => {
      this.pending = false;
      const t = this.state.now;
      // expire transient entries
      const s = this.state;
      this.state = {
        ...s,
        hitMarkers: s.hitMarkers.filter((h) => t - h.t < 0.25),
        hurts: s.hurts.filter((h) => t - h.t < 1.2),
        feed: s.feed.filter((f) => t - f.t < 7).slice(-5),
        toasts: s.toasts.filter((f) => t - f.t < 3.2).slice(-4),
        sounds: s.sounds.filter((f) => t - f.t < 1.2).slice(-8),
        pings: s.pings.filter((p) => t - p.t < 90),
      };
      this.listeners.forEach((l) => l());
    });
  }
  subscribe = (l: () => void) => { this.listeners.add(l); return () => { this.listeners.delete(l); }; };
  get = () => this.state;

  hitMarker(kind: string, broke: boolean) { this.set({ hitMarkers: [...this.state.hitMarkers, { id: nid++, kind, broke, t: this.state.now }] }); }
  hurt(angle: number, shield: boolean) { this.set({ hurts: [...this.state.hurts, { id: nid++, angle, shield, t: this.state.now }] }); }
  kill(k: string, v: string, cause: string, mineK: boolean, mineV: boolean) {
    const text = k ? `${k} ✕ ${v}  ·  ${cause}` : `${v} ✕  ·  ${cause}`;
    this.set({ feed: [...this.state.feed, { id: nid++, text, mine: mineK || mineV, t: this.state.now }] });
  }
  toast(text: string, rarity: number) { this.set({ toasts: [...this.state.toasts, { id: nid++, text, rarity, t: this.state.now }] }); }
  sound(label: string, angle: number, near: boolean) {
    // broad cone: quantise direction to 45° so indicators never pinpoint
    const q = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
    if (this.state.sounds.some((s) => s.label === label && Math.abs(s.angle - q) < 0.01 && this.state.now - s.t < 0.4)) return;
    this.set({ sounds: [...this.state.sounds, { id: nid++, label, angle: q, near, t: this.state.now }] });
  }
  ping(kind: string, x: number, z: number) { this.set({ pings: [...this.state.pings.filter((p) => p.kind !== kind || kind === 'capsule'), { id: nid++, kind, x, z, t: this.state.now }] }); }
}

export function useHud(store: HudStore) {
  return useSyncExternalStore(store.subscribe, store.get);
}
