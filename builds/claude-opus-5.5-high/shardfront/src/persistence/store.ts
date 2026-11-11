// Local persistence behind a repository interface (IndexedDB, with an in-memory fallback), so an
// authenticated cloud repository can replace it later. Includes schema validation + migration
// and corrupted-save recovery.
import { DEFAULT_BINDINGS, type Action } from '../input-camera/bindings';
import type { RenderSettings } from '../renderer/renderer';
import type { ReplayFile } from '../network-protocol/protocol';

export interface Settings {
  version: 2;
  graphics: RenderSettings;
  audio: { master: number; music: number; sfx: number; ui: number };
  camera: { edgeScroll: boolean; panSpeed: number };
  bindings: Record<Action, string>;
  showSubtitles: boolean;
  alertPopups: boolean;
  playerName: string;
}

export interface MatchRecord {
  id: string; date: number; faction: string; enemyFaction: string; difficulty: string; result: 'victory' | 'defeat';
  durationTicks: number; mode: string; replayId: string | null;
  stats: { oreCollected: number; fluxCollected: number; unitsCreated: number; unitsLost: number; kills: number };
}

export interface Profile {
  version: 1;
  tutorialComplete: boolean;
  badges: string[];
  mastery: { helix: number; verdant: number };
  banner: string;
  accent: string;
}

export const DEFAULT_SETTINGS: Settings = {
  version: 2,
  graphics: { quality: 'medium', renderScale: 1, shadows: true, effects: 1, antialias: true, colorblind: 'none', reducedMotion: false },
  audio: { master: 0.8, music: 0.5, sfx: 0.8, ui: 0.7 },
  camera: { edgeScroll: false, panSpeed: 1 },
  bindings: { ...DEFAULT_BINDINGS },
  showSubtitles: true,
  alertPopups: true,
  playerName: 'Commander',
};
export const DEFAULT_PROFILE: Profile = { version: 1, tutorialComplete: false, badges: [], mastery: { helix: 0, verdant: 0 }, banner: 'Basalt', accent: '#3fa9ff' };

export const BANNERS = [
  { id: 'Basalt', xp: 0, color: '#3a3f48' }, { id: 'Teal Seam', xp: 300, color: '#1f8f88' },
  { id: 'Amber Relay', xp: 800, color: '#b27a2a' }, { id: 'Violet Bloom', xp: 1500, color: '#7a4fb0' }, { id: 'Glass Crown', xp: 3000, color: '#9fd8ff' },
];

export interface Repository {
  loadSettings(): Promise<{ value: Settings; recovered: boolean }>;
  saveSettings(s: Settings): Promise<void>;
  loadProfile(): Promise<{ value: Profile; recovered: boolean }>;
  saveProfile(p: Profile): Promise<void>;
  listMatches(): Promise<MatchRecord[]>;
  addMatch(m: MatchRecord): Promise<void>;
  saveReplay(id: string, r: ReplayFile): Promise<void>;
  loadReplay(id: string): Promise<ReplayFile | null>;
  resetAll(): Promise<void>;
}

/** Merge persisted settings onto defaults; reject wrong types (corruption) field by field. */
export function migrateSettings(raw: unknown): { value: Settings; recovered: boolean } {
  if (!raw || typeof raw !== 'object') return { value: structuredClone(DEFAULT_SETTINGS), recovered: raw !== undefined && raw !== null };
  const r = raw as Partial<Settings> & { version?: number };
  const out = structuredClone(DEFAULT_SETTINGS);
  let recovered = false;
  try {
    if (r.graphics && typeof r.graphics === 'object') {
      const g = r.graphics as Partial<RenderSettings>;
      if (g.quality === 'low' || g.quality === 'medium' || g.quality === 'high') out.graphics.quality = g.quality;
      if (typeof g.renderScale === 'number' && g.renderScale >= 0.5 && g.renderScale <= 1.5) out.graphics.renderScale = g.renderScale;
      if (typeof g.shadows === 'boolean') out.graphics.shadows = g.shadows;
      if (typeof g.effects === 'number' && g.effects >= 0 && g.effects <= 1) out.graphics.effects = g.effects;
      if (typeof g.antialias === 'boolean') out.graphics.antialias = g.antialias;
      if (g.colorblind && ['none', 'deuteranopia', 'protanopia', 'tritanopia'].includes(g.colorblind)) out.graphics.colorblind = g.colorblind;
      if (typeof g.reducedMotion === 'boolean') out.graphics.reducedMotion = g.reducedMotion;
    }
    if (r.audio && typeof r.audio === 'object') for (const k of ['master', 'music', 'sfx', 'ui'] as const) { const v = (r.audio as Record<string, unknown>)[k]; if (typeof v === 'number' && v >= 0 && v <= 1) out.audio[k] = v; }
    if (r.camera && typeof r.camera === 'object') {
      if (typeof r.camera.edgeScroll === 'boolean') out.camera.edgeScroll = r.camera.edgeScroll;
      if (typeof r.camera.panSpeed === 'number' && r.camera.panSpeed > 0.2 && r.camera.panSpeed < 3) out.camera.panSpeed = r.camera.panSpeed;
    }
    if (r.bindings && typeof r.bindings === 'object') for (const k of Object.keys(DEFAULT_BINDINGS) as Action[]) { const v = (r.bindings as Record<string, unknown>)[k]; if (typeof v === 'string' && v.length < 24) out.bindings[k] = v; }
    if (typeof r.showSubtitles === 'boolean') out.showSubtitles = r.showSubtitles;
    if (typeof r.alertPopups === 'boolean') out.alertPopups = r.alertPopups;
    if (typeof r.playerName === 'string') out.playerName = r.playerName.replace(/[\u0000-\u001f<>]/g, '').slice(0, 24) || 'Commander';
  } catch { recovered = true; }
  return { value: out, recovered };
}
export function migrateProfile(raw: unknown): { value: Profile; recovered: boolean } {
  const out = structuredClone(DEFAULT_PROFILE);
  if (!raw || typeof raw !== 'object') return { value: out, recovered: raw !== undefined && raw !== null };
  const r = raw as Partial<Profile>;
  let recovered = false;
  if (typeof r.tutorialComplete === 'boolean') out.tutorialComplete = r.tutorialComplete;
  if (Array.isArray(r.badges)) out.badges = r.badges.filter((b) => typeof b === 'string').slice(0, 50);
  if (r.mastery && typeof r.mastery === 'object') {
    for (const f of ['helix', 'verdant'] as const) { const v = (r.mastery as Record<string, unknown>)[f]; if (typeof v === 'number' && v >= 0) out.mastery[f] = Math.floor(v); else recovered = true; }
  }
  if (typeof r.banner === 'string' && BANNERS.some((b) => b.id === r.banner)) out.banner = r.banner;
  if (typeof r.accent === 'string' && /^#[0-9a-f]{6}$/i.test(r.accent)) out.accent = r.accent;
  return { value: out, recovered };
}

const DB = 'shardfront';
const STORES = ['kv', 'matches', 'replays'];

class IdbRepository implements Repository {
  private dbp: Promise<IDBDatabase>;
  constructor() {
    this.dbp = new Promise((res, rej) => {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => { for (const s of STORES) if (!req.result.objectStoreNames.contains(s)) req.result.createObjectStore(s); };
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
  }
  private async tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.dbp;
    return new Promise((res, rej) => {
      const t = db.transaction(store, mode);
      const r = fn(t.objectStore(store));
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  async loadSettings() { try { return migrateSettings(await this.tx('kv', 'readonly', (s) => s.get('settings'))); } catch { return { value: structuredClone(DEFAULT_SETTINGS), recovered: true }; } }
  async saveSettings(v: Settings) { await this.tx('kv', 'readwrite', (s) => s.put(structuredClone(v), 'settings')); }
  async loadProfile() { try { return migrateProfile(await this.tx('kv', 'readonly', (s) => s.get('profile'))); } catch { return { value: structuredClone(DEFAULT_PROFILE), recovered: true }; } }
  async saveProfile(v: Profile) { await this.tx('kv', 'readwrite', (s) => s.put(structuredClone(v), 'profile')); }
  async listMatches() {
    try {
      const all = (await this.tx('matches', 'readonly', (s) => s.getAll())) as MatchRecord[];
      return all.filter((m) => m && typeof m.id === 'string' && typeof m.date === 'number').sort((a, b) => b.date - a.date);
    } catch { return []; }
  }
  async addMatch(m: MatchRecord) {
    await this.tx('matches', 'readwrite', (s) => s.put(m, m.id));
    // keep the 30 most recent matches and their replays
    const all = await this.listMatches();
    for (const old of all.slice(30)) {
      await this.tx('matches', 'readwrite', (s) => s.delete(old.id));
      if (old.replayId) await this.tx('replays', 'readwrite', (s) => s.delete(old.replayId!));
    }
  }
  async saveReplay(id: string, r: ReplayFile) { await this.tx('replays', 'readwrite', (s) => s.put(r, id)); }
  async loadReplay(id: string) { try { return ((await this.tx('replays', 'readonly', (s) => s.get(id))) as ReplayFile) ?? null; } catch { return null; } }
  async resetAll() { for (const st of STORES) await this.tx(st, 'readwrite', (s) => s.clear()); }
}

export class MemoryRepository implements Repository {
  private kv = new Map<string, unknown>();
  private matches: MatchRecord[] = [];
  private replays = new Map<string, ReplayFile>();
  async loadSettings() { return migrateSettings(this.kv.get('settings')); }
  async saveSettings(v: Settings) { this.kv.set('settings', structuredClone(v)); }
  async loadProfile() { return migrateProfile(this.kv.get('profile')); }
  async saveProfile(v: Profile) { this.kv.set('profile', structuredClone(v)); }
  async listMatches() { return this.matches.slice().sort((a, b) => b.date - a.date); }
  async addMatch(m: MatchRecord) { this.matches.push(m); }
  async saveReplay(id: string, r: ReplayFile) { this.replays.set(id, r); }
  async loadReplay(id: string) { return this.replays.get(id) ?? null; }
  async resetAll() { this.kv.clear(); this.matches = []; this.replays.clear(); }
}

export function createRepository(): Repository {
  try { if (typeof indexedDB !== 'undefined') return new IdbRepository(); } catch { /* fall through */ }
  return new MemoryRepository();
}
