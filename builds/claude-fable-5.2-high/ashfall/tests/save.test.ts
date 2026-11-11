import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import { generateItem } from '../src/items/generate';
import { addItem } from '../src/items/inventory';
import { SaveRepo } from '../src/persistence/repo';
import { SAVE_VERSION, checksum, packSave, unpackSave } from '../src/persistence/save';
import { createHero, rankUp } from '../src/progression/progression';

function richHero() {
  const h = createHero('Saver', 'ranger', 2, 4242);
  const r = new Rng(1);
  for (let i = 0; i < 8; i++) addItem(h.inv, generateItem(r, { ilvl: 6, cls: 'ranger' }));
  addItem(h.stash, generateItem(r, { ilvl: 9, cls: 'ranger', rarity: 2 }));
  h.level = 6; h.skillPoints = 3; rankUp(h, 'ghostline');
  h.quest = 4; h.waypoints.push('march'); h.difficulty = 0; h.gold = 321; h.flags.artificer = true;
  return h;
}
describe('save format', () => {
  it('round-trips character, inventory layout, stash, quests, waypoints, skills, difficulty and seed', () => {
    const h = richHero();
    const back = unpackSave(JSON.parse(JSON.stringify(packSave(h))));
    expect(back).toEqual(h);
    expect(back.inv.map((i) => [i.id, i.x, i.y])).toEqual(h.inv.map((i) => [i.id, i.x, i.y]));
  });
  it('rejects corrupted payloads via checksum', () => {
    const env = packSave(richHero());
    env.data = env.data.replace('"gold":321', '"gold":999999');
    expect(() => unpackSave(env)).toThrow(/checksum/);
    expect(() => unpackSave({ ...env, data: env.data.slice(0, 50) })).toThrow();
    expect(() => unpackSave(undefined)).toThrow();
  });
  it('migrates version 1 saves forward', () => {
    const h: any = JSON.parse(JSON.stringify(richHero()));
    delete h.loadouts; delete h.stats.elites; delete h.stats.bestHunt;
    const data = JSON.stringify(h);
    const up = unpackSave({ id: h.id, version: 1, savedAt: 1, checksum: checksum(data), data, meta: { name: 'x', cls: 'ranger', level: 1, difficulty: 0 } });
    expect(up.loadouts).toEqual([null, null]);
    expect(up.stats.elites).toBe(0);
    expect(() => unpackSave({ ...packSave(richHero()), version: SAVE_VERSION + 1 })).toThrow(/newer/);
  });
});
describe('IndexedDB repository', () => {
  it('saves, lists and loads characters', async () => {
    const repo = new SaveRepo(new IDBFactory());
    const h = richHero();
    await repo.save(h);
    const list = await repo.list();
    expect(list.length).toBe(1);
    expect(list[0]).toMatchObject({ name: 'Saver', level: 6, corrupt: false });
    expect((await repo.load(h.id)).hero).toEqual(h);
    await repo.setProfile('settings', { shake: false });
    expect(await repo.getProfile('settings')).toEqual({ shake: false });
  });
  it('recovers from the last good backup after an interrupted write', async () => {
    const repo = new SaveRepo(new IDBFactory());
    const h = richHero();
    await repo.save(h);            // version A
    h.gold = 777; await repo.save(h); // version B (A becomes backup)
    const good = packSave(h);
    await repo.putRaw(h.id, { ...good, data: good.data.slice(0, good.data.length / 2) }); // torn write
    expect((await repo.list())[0]).toMatchObject({ corrupt: true, hasBackup: true });
    const res = await repo.load(h.id);
    expect(res.recovered).toBe(true);
    expect(res.hero.gold).toBe(321);
    // A corrupt record must never overwrite the good backup on the next save.
    h.gold = 888; await repo.save(h);
    await repo.putRaw(h.id, { junk: true });
    expect((await repo.load(h.id)).hero.gold).toBe(321);
    await repo.remove(h.id);
    expect((await repo.list()).length).toBe(0);
  });
});
