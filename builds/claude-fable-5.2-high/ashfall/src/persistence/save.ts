import type { Hero } from '../entity-combat/types';

/**
 * Save format: a versioned envelope { version, savedAt, checksum, data } where `data` is the hero JSON string and
 * `checksum` is FNV-1a over that string. Older versions are upgraded through MIGRATIONS, one step at a time.
 */
export const SAVE_VERSION = 2;
export interface SaveEnvelope { id: string; version: number; savedAt: number; checksum: string; data: string; meta: { name: string; cls: string; level: number; difficulty: number } }

export function checksum(str: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).padStart(8, '0');
}
export const MIGRATIONS: Record<number, (h: any) => any> = {
  // v1 → v2: loadout snapshots, elite kill counter and hunt records were added.
  1: (h) => ({ ...h, loadouts: h.loadouts ?? [null, null], stats: { elites: 0, bestHunt: {}, ...h.stats } }),
};
export function packSave(hero: Hero, now = Date.now()): SaveEnvelope {
  const data = JSON.stringify(hero);
  return { id: hero.id, version: SAVE_VERSION, savedAt: now, checksum: checksum(data), data, meta: { name: hero.name, cls: hero.cls, level: hero.level, difficulty: hero.difficulty } };
}
export class SaveError extends Error {}
export function unpackSave(env: SaveEnvelope | undefined | null): Hero {
  if (!env || typeof env.data !== 'string') throw new SaveError('Save record is missing or incomplete.');
  if (checksum(env.data) !== env.checksum) throw new SaveError('Save checksum mismatch (corrupted or interrupted write).');
  if (env.version > SAVE_VERSION) throw new SaveError(`Save is from a newer game version (v${env.version}).`);
  let hero = JSON.parse(env.data);
  for (let v = env.version; v < SAVE_VERSION; v++) {
    const m = MIGRATIONS[v];
    if (!m) throw new SaveError(`No migration from save version ${v}.`);
    hero = m(hero);
  }
  if (!hero || !hero.id || !hero.cls || !hero.attrs) throw new SaveError('Save payload failed validation.');
  return hero as Hero;
}
