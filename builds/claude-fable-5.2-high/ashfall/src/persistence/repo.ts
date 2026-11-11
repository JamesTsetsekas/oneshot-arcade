import type { Hero } from '../entity-combat/types';
import { packSave, unpackSave, type SaveEnvelope } from './save';

export interface SaveSummary { id: string; name: string; cls: string; level: number; difficulty: number; savedAt: number; corrupt: boolean; hasBackup: boolean }
const req = <T>(r: IDBRequest<T>) => new Promise<T>((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const done = (tx: IDBTransaction) => new Promise<void>((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); });
const valid = (e?: SaveEnvelope) => { try { unpackSave(e); return true; } catch { return false; } };

/** IndexedDB repository: `saves` (current), `backups` (last known good) and `profile` (account-wide settings). */
export class SaveRepo {
  private db: Promise<IDBDatabase> | null = null;
  constructor(private factory: IDBFactory = indexedDB, private name = 'ashfall-covenant') {}
  private open(): Promise<IDBDatabase> {
    return (this.db ??= new Promise((res, rej) => {
      const r = this.factory.open(this.name, 1);
      r.onupgradeneeded = () => { for (const s of ['saves', 'backups', 'profile']) if (!r.result.objectStoreNames.contains(s)) r.result.createObjectStore(s); };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    }));
  }
  /** Writes a save. The previous record is first copied to `backups` only if it still verifies. */
  async save(hero: Hero): Promise<void> {
    const db = await this.open();
    const cur = await req(db.transaction('saves').objectStore('saves').get(hero.id) as IDBRequest<SaveEnvelope | undefined>);
    if (valid(cur)) { const tx = db.transaction('backups', 'readwrite'); tx.objectStore('backups').put(cur, hero.id); await done(tx); }
    const tx = db.transaction('saves', 'readwrite');
    tx.objectStore('saves').put(packSave(hero), hero.id);
    await done(tx);
  }
  /** Loads a save, falling back to the backup when the main record is corrupt. */
  async load(id: string): Promise<{ hero: Hero; recovered: boolean }> {
    const db = await this.open();
    const cur = await req(db.transaction('saves').objectStore('saves').get(id) as IDBRequest<SaveEnvelope | undefined>);
    try { return { hero: unpackSave(cur), recovered: false }; }
    catch (e) {
      const bak = await req(db.transaction('backups').objectStore('backups').get(id) as IDBRequest<SaveEnvelope | undefined>);
      if (valid(bak)) return { hero: unpackSave(bak), recovered: true };
      throw e;
    }
  }
  async list(): Promise<SaveSummary[]> {
    const db = await this.open();
    const tx = db.transaction(['saves', 'backups']);
    const [saves, backs] = await Promise.all([req(tx.objectStore('saves').getAll() as IDBRequest<SaveEnvelope[]>), req(tx.objectStore('backups').getAllKeys())]);
    return saves.map((e) => ({ id: e.id, name: e.meta?.name ?? '?', cls: e.meta?.cls ?? 'cinder', level: e.meta?.level ?? 1, difficulty: e.meta?.difficulty ?? 0, savedAt: e.savedAt, corrupt: !valid(e), hasBackup: backs.includes(e.id) }))
      .sort((a, b) => b.savedAt - a.savedAt);
  }
  async remove(id: string): Promise<void> {
    const db = await this.open();
    const tx = db.transaction(['saves', 'backups'], 'readwrite');
    tx.objectStore('saves').delete(id); tx.objectStore('backups').delete(id);
    await done(tx);
  }
  async getProfile<T>(key: string): Promise<T | undefined> {
    const db = await this.open();
    return req(db.transaction('profile').objectStore('profile').get(key) as IDBRequest<T | undefined>);
  }
  async setProfile(key: string, value: unknown): Promise<void> {
    const db = await this.open();
    const tx = db.transaction('profile', 'readwrite');
    tx.objectStore('profile').put(value, key);
    await done(tx);
  }
  /** Test hook: overwrite the raw envelope to simulate an interrupted or corrupted write. */
  async putRaw(id: string, env: unknown): Promise<void> {
    const db = await this.open();
    const tx = db.transaction('saves', 'readwrite');
    tx.objectStore('saves').put(env, id);
    await done(tx);
  }
}
