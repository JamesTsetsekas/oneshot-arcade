// Versioned local persistence: IndexedDB with localStorage / in-memory fallback.

import { DEFAULT_BINDINGS, type Action } from "../input/input";

export const SAVE_VERSION = 2;

export interface Settings {
  master: number; music: number; sfx: number; voice: number;
  quality: "low" | "medium" | "high";
  dynamicRes: boolean; shadows: boolean; bloom: boolean;
  shake: number; reducedMotion: boolean; photosensitive: boolean; fovScale: number;
  hudScale: number; subtitles: boolean; colorblind: boolean; minimap: boolean;
  guidance: "road" | "bearing";
  traffic: "low" | "medium" | "high"; crowd: number;
  steerSensitivity: number; steerSmoothing: number; deadzone: number; vibration: boolean;
  driftAssist: boolean; stabilityAssist: boolean;
  bindings: Record<Action, string[]>;
}

export const DEFAULT_SETTINGS: Settings = {
  master: 0.8, music: 0.7, sfx: 0.9, voice: 0.9,
  quality: "medium", dynamicRes: true, shadows: true, bloom: true,
  shake: 0.7, reducedMotion: false, photosensitive: false, fovScale: 1,
  hudScale: 1, subtitles: true, colorblind: false, minimap: true,
  guidance: "road", traffic: "medium", crowd: 0.7,
  steerSensitivity: 1, steerSmoothing: 6.5, deadzone: 0.12, vibration: true,
  driftAssist: false, stabilityAssist: true,
  bindings: DEFAULT_BINDINGS,
};

export interface BestRecord { score: number; rank: string; deliveries: number; date: string; taxi: string; assists: boolean }
export interface TrialRecord { time: number; medal: string | null; ghost?: number[]; taxi: string }

export interface SaveData {
  version: number;
  settings: Settings;
  best: { arcade?: BestRecord; quick?: BestRecord };
  trials: Record<number, TrialRecord>;
  lessons: number[];
  discovered: string[];
  totals: { deliveries: number; shifts: number; distance: number };
  garage: { taxi: string; livery: Record<string, number>; driver: number };
}

export function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    settings: structuredClone(DEFAULT_SETTINGS),
    best: {},
    trials: {},
    lessons: [],
    discovered: [],
    totals: { deliveries: 0, shifts: 0, distance: 0 },
    garage: { taxi: "breaker", livery: {}, driver: 0 },
  };
}

/** Migrate any older or partially-corrupt save into the current schema. */
export function migrate(raw: unknown): { data: SaveData; repaired: boolean } {
  const base = defaultSave();
  if (!raw || typeof raw !== "object") return { data: base, repaired: raw !== undefined && raw !== null };
  const r = raw as Record<string, unknown>;
  let repaired = false;
  // v1 stored a flat bestScore number
  if ((r.version as number) === 1 || r.version === undefined) {
    if (typeof r.bestScore === "number") base.best.arcade = { score: r.bestScore, rank: "?", deliveries: 0, date: "", taxi: "breaker", assists: false };
  }
  const pick = <T>(v: unknown, fallback: T, ok: (x: unknown) => boolean): T => {
    if (v === undefined) return fallback;
    if (ok(v)) return v as T;
    repaired = true;
    return fallback;
  };
  const settings = { ...base.settings, ...(typeof r.settings === "object" && r.settings ? (r.settings as object) : {}) } as Settings;
  settings.bindings = { ...DEFAULT_BINDINGS, ...(settings.bindings ?? {}) };
  for (const k of Object.keys(DEFAULT_BINDINGS) as Action[]) if (!Array.isArray(settings.bindings[k])) { settings.bindings[k] = DEFAULT_BINDINGS[k]; repaired = true; }
  const data: SaveData = {
    version: SAVE_VERSION,
    settings,
    best: pick(r.best, base.best, (x) => typeof x === "object"),
    trials: pick(r.trials, base.trials, (x) => typeof x === "object"),
    lessons: pick(r.lessons, base.lessons, Array.isArray),
    discovered: pick(r.discovered, base.discovered, Array.isArray),
    totals: { ...base.totals, ...pick(r.totals, {}, (x) => typeof x === "object") },
    garage: { ...base.garage, ...pick(r.garage, {}, (x) => typeof x === "object") },
  };
  return { data, repaired };
}

const DB = "farestorm";
const STORE = "kv";
const KEY = "save";

function idb(): Promise<IDBDatabase | null> {
  return new Promise((res) => {
    try {
      if (typeof indexedDB === "undefined") return res(null);
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => res(req.result);
      req.onerror = () => res(null);
      req.onblocked = () => res(null);
    } catch {
      res(null);
    }
  });
}

export class Store {
  data: SaveData = defaultSave();
  repaired = false;
  backend: "indexeddb" | "localstorage" | "memory" = "memory";
  private db: IDBDatabase | null = null;
  private saving = false;

  async load(): Promise<void> {
    this.db = await idb();
    let raw: unknown = undefined;
    if (this.db) {
      this.backend = "indexeddb";
      raw = await new Promise((res) => {
        try {
          const tx = this.db!.transaction(STORE, "readonly");
          const r = tx.objectStore(STORE).get(KEY);
          r.onsuccess = () => res(r.result);
          r.onerror = () => res(undefined);
        } catch {
          res(undefined);
        }
      });
    }
    if (raw === undefined) {
      try {
        const s = localStorage.getItem("farestorm-save");
        if (s) raw = JSON.parse(s);
        if (!this.db) this.backend = "localstorage";
      } catch {
        if (!this.db) this.backend = "memory";
      }
    }
    const m = migrate(raw);
    this.data = m.data;
    this.repaired = m.repaired;
  }

  async save(): Promise<void> {
    if (this.saving) return;
    this.saving = true;
    const snapshot = JSON.parse(JSON.stringify(this.data));
    try {
      if (this.db) {
        await new Promise<void>((res) => {
          try {
            const tx = this.db!.transaction(STORE, "readwrite");
            tx.objectStore(STORE).put(snapshot, KEY);
            tx.oncomplete = () => res();
            tx.onerror = () => res();
          } catch {
            res();
          }
        });
      } else {
        try { localStorage.setItem("farestorm-save", JSON.stringify(snapshot)); } catch { /* storage unavailable */ }
      }
    } finally {
      this.saving = false;
    }
  }
}
