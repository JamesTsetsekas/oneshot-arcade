// Tiny event adapter between the game loop and React. React never owns per-frame entity state:
// the client publishes immutable read-model snapshots at a throttled rate.
import { useSyncExternalStore } from 'react';

export class Store<T> {
  private v: T;
  private subs = new Set<() => void>();
  constructor(v: T) { this.v = v; }
  get = () => this.v;
  set(v: T) { this.v = v; for (const s of this.subs) s(); }
  subscribe = (fn: () => void) => { this.subs.add(fn); return () => { this.subs.delete(fn); }; };
}

export function useStore<T>(s: Store<T>): T {
  return useSyncExternalStore(s.subscribe, s.get, s.get);
}
