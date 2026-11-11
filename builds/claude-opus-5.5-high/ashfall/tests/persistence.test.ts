import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { IdbBackend, MemoryBackend, SaveRepository, encodeRecord, migrate, checksum } from "../src/persistence/save";
import { goto, newGame, run, botFight } from "./helpers";
import { Game } from "../src/sim/game";
import { SAVE_VERSION } from "../src/progression/character";

describe("save/load", () => {
  for (const kind of ["idb", "memory"] as const) {
    it(`${kind}: round-trips character, inventory layout, stash, quests, waypoints, skills, difficulty, seed`, async () => {
      const repo = new SaveRepository(kind === "idb" ? new IdbBackend(indexedDB, `test-${Math.random()}`) : new MemoryBackend());
      const g = newGame("ranger", 321);
      goto(g, "march");
      botFight(g, 30 * 30);
      g.ch.waypoints.push("ashway");
      g.ch.ranks.ghostline = 2;
      g.ch.difficulty = "veteran";
      const snap = g.snapshot();
      await repo.save(snap);
      const r = await repo.load(snap.id);
      expect(r.recovered).toBe(false);
      expect(r.data).toEqual(snap);
      // restoring into a new game keeps the loot rng stream
      const g2 = new Game(r.data!);
      expect(g2.lootRng.state()).toEqual(g.lootRng.state());
      const list = await repo.list();
      expect(list[0].meta.name).toBe("Tester");
      expect(list[0].status).toBe("ok");
    });
  }

  it("interrupted/corrupt write recovers from the last good backup", async () => {
    const be = new IdbBackend(indexedDB, `test-${Math.random()}`);
    const repo = new SaveRepository(be);
    const g = newGame();
    const s1 = g.snapshot();
    s1.gold = 111;
    await repo.save(s1);
    const s2 = { ...s1, gold: 222 };
    await repo.save(s2);
    // simulate a torn write: truncated json, stale checksum
    const bad = encodeRecord({ ...s1, gold: 333 });
    bad.json = bad.json.slice(0, bad.json.length / 2);
    await be.rawPut(bad);
    const r = await repo.load(s1.id);
    expect(r.recovered).toBe(true);
    expect(r.data!.gold).toBe(111); // previous good record (the save before the damaged one)
    const list = await repo.list();
    expect(list[0].status).toBe("recoverable");
    expect(await repo.restore(s1.id)).toBe(true);
    expect((await repo.load(s1.id)).recovered).toBe(false);
  });

  it("reports unrecoverable corruption", async () => {
    const be = new MemoryBackend();
    const repo = new SaveRepository(be);
    const s = newGame().snapshot();
    const bad = encodeRecord(s);
    bad.checksum = "deadbeef";
    await be.rawPut(bad);
    const r = await repo.load(s.id);
    expect(r.data).toBeNull();
    expect(r.error).toBeTruthy();
  });

  it("migrates older save versions", () => {
    const s: any = newGame().snapshot();
    s.version = 1;
    delete s.beltCap; delete s.loadouts; delete s.quests; delete s.run; delete s.flags;
    const m = migrate(s);
    expect(m.version).toBe(SAVE_VERSION);
    expect(m.beltCap).toBe(5);
    expect(m.quests.ashway).toBeTruthy();
    expect(() => migrate({ ...s, version: 99 })).toThrow();
  });

  it("checksum detects single-character changes", () => {
    expect(checksum('{"a":1}')).not.toBe(checksum('{"a":2}'));
  });

  it("profile settings persist", async () => {
    const repo = new SaveRepository(new IdbBackend(indexedDB, `test-${Math.random()}`));
    await repo.saveProfile({ settings: { shake: false }, tutorial: { move: true }, cosmetics: {} });
    expect((await repo.profile()).settings.shake).toBe(false);
    void run;
  });
});
