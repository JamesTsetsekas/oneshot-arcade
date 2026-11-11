import { describe, expect, it } from 'vitest';
import { MemoryKV, SaveRepo, SAVE_VERSION, checksum, open, seal } from '../src/persist/save';
import { newCharacter } from '../src/sim/character';
import { generateItem } from '../src/sim/loot';
import { Rng } from '../src/sim/rng';
import { Game } from '../src/sim/game';

function sampleCharacter() {
  const ch = newCharacter('Saver', 'ranger', { body: 2, voice: 1 }, 777);
  const r = new Rng(5);
  for (let i = 0; i < 12; i++) ch.inv.add(generateItem(r, 10, { cls: 'ranger' }));
  for (let i = 0; i < 4; i++) ch.stash.add(generateItem(r, 10, { cls: 'ranger' }));
  ch.gold = 1234;
  ch.dust = 17;
  ch.quests = { ashway: 'done', toll: 'active' };
  ch.waypoints = ['refuge', 'ashway'];
  ch.difficulty = 'veteran';
  return ch;
}

describe('save format', () => {
  it('round-trips character, inventory layout, stash, quests, waypoints and difficulty', async () => {
    const repo = new SaveRepo(new MemoryKV());
    const ch = sampleCharacter();
    await repo.save(ch);
    const r = await repo.load(ch.id);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.recovered).toBe(false);
    const b = r.ch;
    expect(b.name).toBe('Saver');
    expect(b.gold).toBe(1234);
    expect(b.dust).toBe(17);
    expect(b.quests).toEqual(ch.quests);
    expect(b.waypoints).toEqual(ch.waypoints);
    expect(b.difficulty).toBe('veteran');
    expect(b.seed).toBe(777);
    expect(b.inv.placed.map((p) => [p.item.uid, p.x, p.y])).toEqual(ch.inv.placed.map((p) => [p.item.uid, p.x, p.y]));
    expect(b.stash.items().length).toBe(4);
    expect(b.equip.weapon?.uid).toBe(ch.equip.weapon?.uid);
    // a loaded character is playable
    const g = new Game(b);
    expect(g.zone.id).toBe('refuge');
  });

  it('detects corruption via checksum and recovers from the last good backup', async () => {
    const kv = new MemoryKV();
    const repo = new SaveRepo(kv);
    const ch = sampleCharacter();
    await repo.save(ch, 1000);
    ch.gold = 9999;
    await repo.save(ch, 2000);
    // corrupt the primary
    const k = `char:${ch.id}:main`;
    const raw = (await kv.get(k))!;
    await kv.set(k, raw.replace('9999', '1111'));
    const r = await repo.load(ch.id);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.recovered).toBe(true);
      expect(r.source).toBe('backup');
      expect(r.ch.gold).toBe(1234);
    }
    expect(await repo.restoreBackup(ch.id)).toBe(true);
    const r2 = await repo.load(ch.id);
    expect(r2.ok && !r2.recovered).toBe(true);
  });

  it('recovers from an interrupted write (pending newer than primary)', async () => {
    const kv = new MemoryKV();
    const repo = new SaveRepo(kv);
    const ch = sampleCharacter();
    await repo.save(ch, 1000);
    ch.gold = 4242;
    // simulate crash after writing pending but before promotion
    await kv.set(`char:${ch.id}:pending`, seal(ch, 3000));
    const r = await repo.load(ch.id);
    expect(r.ok && r.ch.gold).toBe(4242);
    // a half-written (truncated) pending is ignored
    await kv.set(`char:${ch.id}:pending`, seal(ch, 4000).slice(0, 80));
    const r2 = await repo.load(ch.id);
    expect(r2.ok && r2.ch.gold).toBe(1234);
  });

  it('fails clearly when nothing is readable', async () => {
    const kv = new MemoryKV();
    const repo = new SaveRepo(kv);
    await kv.set('char:zz:main', 'garbage');
    const r = await repo.load('zz');
    expect(r.ok).toBe(false);
  });

  it('rejects saves from a newer game version and migrates older ones', () => {
    const ch = sampleCharacter();
    const env = JSON.parse(seal(ch));
    env.v = SAVE_VERSION + 1;
    expect(open(JSON.stringify(env))).toBeNull();
    const old = JSON.parse(seal(ch));
    old.v = 1;
    expect(open(JSON.stringify(old))?.ch.name).toBe('Saver');
  });

  it('checksum changes with content', () => {
    expect(checksum('abc')).not.toBe(checksum('abd'));
    expect(checksum('abc')).toBe(checksum('abc'));
  });

  it('lists characters sorted by recency', async () => {
    const repo = new SaveRepo(new MemoryKV());
    const a = newCharacter('A', 'cinder', { body: 0, voice: 0 }, 1);
    const b = newCharacter('B', 'ranger', { body: 0, voice: 0 }, 2);
    await repo.save(a, 1000);
    await repo.save(b, 2000);
    const l = await repo.list();
    expect(l.map((x) => x.name)).toEqual(['B', 'A']);
  });
});
