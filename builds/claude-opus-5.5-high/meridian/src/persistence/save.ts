// Save repository: versioned snapshots, journaled writes, rolling backups, migrations,
// import/export. Storage is abstracted so tests run on an in-memory adapter and the
// browser uses IndexedDB (falling back to localStorage when IndexedDB is unavailable).

import type { Inventory } from "../sim/weapons";

export const SAVE_VERSION = 3;
export const BACKUPS = 3;

export interface SaveSnapshot {
  version: number;
  savedAt: number; // epoch ms
  label: string;
  player: { x: number; z: number; yaw: number; health: number };
  inventory: Inventory;
  progress: {
    storyDone: string[];
    grades: Record<string, string>;
    rewarded: string[];
    activeMission: string | null;
    checkpoint: string | null;
    discovered: string[];
    circuitBest: number | null;
    circuitGhost: number[] | null;
    circuitAssists: string | null;
    courierRuns: number;
    recoveries: number;
  };
  world: { hour: number; rain: number; day: number };
  stats: { playTime: number; crimes: number; civHarm: number; arrests: number; deaths: number };
}

export interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

export class MemoryAdapter implements StorageAdapter {
  data = new Map<string, string>();
  failNextSet = false;
  async get(k: string) { return this.data.get(k) ?? null; }
  async set(k: string, v: string) {
    if (this.failNextSet) { this.failNextSet = false; throw new Error("simulated interrupted write"); }
    this.data.set(k, v);
  }
  async del(k: string) { this.data.delete(k); }
  async keys() { return [...this.data.keys()]; }
}

export class LocalStorageAdapter implements StorageAdapter {
  constructor(private prefix = "meridian:") {}
  async get(k: string) { try { return localStorage.getItem(this.prefix + k); } catch { return null; } }
  async set(k: string, v: string) { localStorage.setItem(this.prefix + k, v); }
  async del(k: string) { try { localStorage.removeItem(this.prefix + k); } catch { /* ignore */ } }
  async keys() {
    const out: string[] = [];
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k?.startsWith(this.prefix)) out.push(k.slice(this.prefix.length)); } } catch { /* ignore */ }
    return out;
  }
}

export class IndexedDBAdapter implements StorageAdapter {
  private dbp: Promise<IDBDatabase>;
  constructor(name = "meridian-run") {
    this.dbp = new Promise((res, rej) => {
      const req = indexedDB.open(name, 1);
      req.onupgradeneeded = () => req.result.createObjectStore("kv");
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
  }
  private async tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.dbp;
    return new Promise((res, rej) => {
      const t = db.transaction("kv", mode);
      const r = fn(t.objectStore("kv"));
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  async get(k: string) { return ((await this.tx("readonly", (s) => s.get(k))) as string | undefined) ?? null; }
  async set(k: string, v: string) { await this.tx("readwrite", (s) => s.put(v, k)); }
  async del(k: string) { await this.tx("readwrite", (s) => s.delete(k)); }
  async keys() { return ((await this.tx("readonly", (s) => s.getAllKeys())) as IDBValidKey[]).map(String); }
}

export function fnv(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16);
}

interface Envelope { v: number; sum: string; body: string }

const wrap = (snap: SaveSnapshot): string => {
  const body = JSON.stringify(snap);
  return JSON.stringify({ v: snap.version, sum: fnv(body), body } satisfies Envelope);
};

/** Parse + verify checksum + migrate. Throws on corruption. */
export function unwrap(raw: string): SaveSnapshot {
  const env = JSON.parse(raw) as Envelope;
  if (typeof env.body !== "string" || fnv(env.body) !== env.sum) throw new Error("checksum mismatch");
  return migrate(JSON.parse(env.body));
}

/** Migrations: v1 used `money` and had no world block; v2 lacked activity progress. */
export function migrate(s: any): SaveSnapshot {
  if (!s || typeof s !== "object" || typeof s.version !== "number") throw new Error("not a save");
  if (s.version > SAVE_VERSION) throw new Error(`save from newer build (v${s.version})`);
  if (s.version === 1) {
    s.inventory = { ...s.inventory, cash: s.money ?? s.inventory?.cash ?? 0 };
    delete s.money;
    s.world = { hour: s.hour ?? 15, rain: 0, day: 1 };
    delete s.hour;
    s.version = 2;
  }
  if (s.version === 2) {
    s.progress = {
      circuitBest: null, circuitGhost: null, circuitAssists: null, courierRuns: 0, recoveries: 0, discovered: [], rewarded: [],
      ...s.progress,
    };
    s.stats = { playTime: 0, crimes: 0, civHarm: 0, arrests: 0, deaths: 0, ...s.stats };
    s.version = 3;
  }
  // defensive defaults for every version
  s.progress.storyDone ??= []; s.progress.grades ??= {}; s.progress.rewarded ??= [];
  s.inventory.missionItems ??= []; s.inventory.outfits ??= [0];
  return s as SaveSnapshot;
}

export type Slot = "auto" | "manual";

export interface LoadResult { snap: SaveSnapshot; source: "slot" | "journal" | `backup${number}` }

export class SaveRepository {
  constructor(public store: StorageAdapter) {}

  /** Journaled write: journal -> rotate backups -> slot -> clear journal. */
  async write(slot: Slot, snap: SaveSnapshot): Promise<void> {
    const data = wrap(snap);
    await this.store.set(`journal:${slot}`, data);
    const prev = await this.store.get(`slot:${slot}`);
    if (prev) {
      for (let i = BACKUPS - 1; i >= 1; i--) {
        const b = await this.store.get(`backup:${slot}:${i - 1}`);
        if (b) await this.store.set(`backup:${slot}:${i}`, b);
      }
      await this.store.set(`backup:${slot}:0`, prev);
    }
    await this.store.set(`slot:${slot}`, data);
    await this.store.del(`journal:${slot}`);
  }

  /** Complete interrupted writes found at startup. Returns slots recovered. */
  async recover(): Promise<Slot[]> {
    const out: Slot[] = [];
    for (const slot of ["auto", "manual"] as Slot[]) {
      const j = await this.store.get(`journal:${slot}`);
      if (!j) continue;
      try {
        const js = unwrap(j);
        let cur: SaveSnapshot | null = null;
        try { const c = await this.store.get(`slot:${slot}`); cur = c ? unwrap(c) : null; } catch { cur = null; }
        if (!cur || js.savedAt >= cur.savedAt) { await this.store.set(`slot:${slot}`, j); out.push(slot); }
      } catch { /* corrupt journal: discard */ }
      await this.store.del(`journal:${slot}`);
    }
    return out;
  }

  async load(slot: Slot): Promise<LoadResult | null> {
    const raw = await this.store.get(`slot:${slot}`);
    if (raw) { try { return { snap: unwrap(raw), source: "slot" }; } catch { /* fall through */ } }
    const j = await this.store.get(`journal:${slot}`);
    if (j) { try { return { snap: unwrap(j), source: "journal" }; } catch { /* fall through */ } }
    for (let i = 0; i < BACKUPS; i++) {
      const b = await this.store.get(`backup:${slot}:${i}`);
      if (b) { try { return { snap: unwrap(b), source: `backup${i}` }; } catch { /* next */ } }
    }
    return null;
  }

  async list(): Promise<{ key: string; label: string; savedAt: number; ok: boolean }[]> {
    const keys = (await this.store.keys()).filter((k) => k.startsWith("slot:") || k.startsWith("backup:"));
    const out = [];
    for (const k of keys.sort()) {
      const raw = await this.store.get(k);
      try { const s = unwrap(raw!); out.push({ key: k, label: s.label, savedAt: s.savedAt, ok: true }); }
      catch { out.push({ key: k, label: "Corrupted", savedAt: 0, ok: false }); }
    }
    return out;
  }

  async loadKey(key: string): Promise<SaveSnapshot | null> {
    const raw = await this.store.get(key);
    if (!raw) return null;
    try { return unwrap(raw); } catch { return null; }
  }

  async latest(): Promise<LoadResult | null> {
    const a = await this.load("auto"), m = await this.load("manual");
    if (a && m) return a.snap.savedAt >= m.snap.savedAt ? a : m;
    return a ?? m;
  }

  async exportSlot(slot: Slot): Promise<string | null> {
    const r = await this.load(slot);
    return r ? JSON.stringify(r.snap, null, 1) : null;
  }

  async importJson(json: string, slot: Slot = "manual"): Promise<SaveSnapshot> {
    const snap = migrate(JSON.parse(json));
    snap.label = `${snap.label} (imported)`;
    await this.write(slot, snap);
    return snap;
  }

  async clearAll() { for (const k of await this.store.keys()) await this.store.del(k); }
}

export function makeBrowserRepository(): SaveRepository {
  try {
    if (typeof indexedDB !== "undefined") return new SaveRepository(new IndexedDBAdapter());
  } catch { /* fall back */ }
  return new SaveRepository(new LocalStorageAdapter());
}

// ---- settings live beside saves (not inside a slot)
export interface Settings {
  quality: "low" | "medium" | "high";
  dynamicRes: boolean;
  fov: number;
  sensitivity: number;
  invertY: boolean;
  trafficDensity: number;
  pedDensity: number;
  shadows: boolean;
  reducedMotion: boolean;
  photosensitive: boolean;
  colorblind: boolean;
  subtitles: boolean;
  subtitleSize: number;
  master: number; music: number; sfx: number;
  streamerMode: boolean;
  stabilityAssist: number;
  tractionControl: boolean;
  aimToggle: boolean;
  sprintToggle: boolean;
  minimapRotate: boolean;
  camRecenter: boolean;
  binds: Record<string, string>;
}

export const DEFAULT_SETTINGS: Settings = {
  quality: "medium", dynamicRes: true, fov: 85, sensitivity: 1, invertY: false, trafficDensity: 1, pedDensity: 1, shadows: true,
  reducedMotion: false, photosensitive: false, colorblind: false, subtitles: true, subtitleSize: 1, master: 0.8, music: 0.6, sfx: 0.9,
  streamerMode: false, stabilityAssist: 0.6, tractionControl: true, aimToggle: false, sprintToggle: false, minimapRotate: true, camRecenter: true, binds: {},
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem("meridian:settings");
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw), binds: { ...JSON.parse(raw).binds } };
  } catch { /* defaults */ }
  return { ...DEFAULT_SETTINGS, binds: {} };
}
export function storeSettings(s: Settings) { try { localStorage.setItem("meridian:settings", JSON.stringify(s)); } catch { /* ignore */ } }
