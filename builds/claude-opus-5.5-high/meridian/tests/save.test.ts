import { describe, it, expect } from "vitest";
import { SaveRepository, MemoryAdapter, migrate, unwrap, SAVE_VERSION, type SaveSnapshot } from "../src/persistence/save";
import { Game } from "../src/sim/game";
import { newInventory } from "../src/sim/weapons";

function snap(label: string, cash = 100): SaveSnapshot {
  const g = new Game();
  g.inv.cash = cash;
  return g.snapshot(label);
}

describe("save repository", () => {
  it("round-trips a snapshot", async () => {
    const repo = new SaveRepository(new MemoryAdapter());
    await repo.write("auto", snap("a", 321));
    const r = await repo.load("auto");
    expect(r?.source).toBe("slot");
    expect(r?.snap.inventory.cash).toBe(321);
    expect(r?.snap.version).toBe(SAVE_VERSION);
  });

  it("keeps rolling backups (3) and recovers from a corrupted main slot", async () => {
    const mem = new MemoryAdapter();
    const repo = new SaveRepository(mem);
    for (let i = 1; i <= 5; i++) await repo.write("auto", snap(`s${i}`, i));
    expect(mem.data.has("backup:auto:2")).toBe(true);
    expect(mem.data.has("backup:auto:3")).toBe(false);
    mem.data.set("slot:auto", mem.data.get("slot:auto")!.replace(/"cash\\":5/, '"cash\\":9999'));
    const r = await repo.load("auto");
    expect(r?.source).toBe("backup0");
    expect(r?.snap.label).toBe("s4");
  });

  it("an interrupted write leaves a journal that recovery commits", async () => {
    const mem = new MemoryAdapter();
    const repo = new SaveRepository(mem);
    await repo.write("auto", snap("old", 1));
    // fail after the journal is written: the backup rotation's first set throws
    const orig = mem.set.bind(mem);
    let n = 0;
    mem.set = async (k: string, v: string) => { n++; if (n === 2) throw new Error("power cut"); return orig(k, v); };
    await expect(repo.write("auto", snap("new", 2))).rejects.toThrow();
    mem.set = orig;
    expect(mem.data.has("journal:auto")).toBe(true);
    const rec = await repo.recover();
    expect(rec).toContain("auto");
    const r = await repo.load("auto");
    expect(r?.snap.label).toBe("new");
    expect(mem.data.has("journal:auto")).toBe(false);
  });

  it("migrates v1 and v2 fixtures to the current schema", () => {
    const inv = newInventory();
    const v1 = { version: 1, savedAt: 1, label: "old", money: 777, hour: 18, player: { x: 0, z: 0, yaw: 0, health: 100 }, inventory: { ...inv, cash: undefined }, progress: { storyDone: ["first_shift"], grades: {} }, stats: {} };
    const m1 = migrate(JSON.parse(JSON.stringify(v1)));
    expect(m1.version).toBe(SAVE_VERSION);
    expect(m1.inventory.cash).toBe(777);
    expect(m1.world.hour).toBe(18);
    expect(m1.progress.circuitBest).toBeNull();
    const v2 = { version: 2, savedAt: 1, label: "v2", player: { x: 0, z: 0, yaw: 0, health: 90 }, inventory: inv, progress: { storyDone: [], grades: {} }, world: { hour: 15, rain: 0, day: 1 }, stats: {} };
    const m2 = migrate(v2);
    expect(m2.progress.courierRuns).toBe(0);
    expect(m2.stats.deaths).toBe(0);
    expect(() => migrate({ version: 99 })).toThrow();
  });

  it("detects tampering via checksum", async () => {
    const mem = new MemoryAdapter();
    const repo = new SaveRepository(mem);
    await repo.write("manual", snap("m", 5));
    const raw = mem.data.get("slot:manual")!;
    expect(() => unwrap(raw.replace("\\\"cash\\\":5", "\\\"cash\\\":6"))).toThrow();
  });

  it("exports and imports JSON", async () => {
    const repo = new SaveRepository(new MemoryAdapter());
    await repo.write("auto", snap("exp", 42));
    const json = (await repo.exportSlot("auto"))!;
    const repo2 = new SaveRepository(new MemoryAdapter());
    const s = await repo2.importJson(json);
    expect(s.inventory.cash).toBe(42);
    expect((await repo2.load("manual"))?.snap.label).toMatch(/imported/);
  });

  it("restores mission progress, inventory, cash, Trust, owned vehicle, time/weather in a game", () => {
    const g = new Game();
    g.progress.storyDone = ["first_shift", "lost_manifest"];
    g.inv.cash = 900; g.inv.trust = 2; g.inv.unlocked.push("pistol"); g.inv.ownedVehicle = { model: "brava", color: [1, 0, 0] };
    g.clock.hour = 20.5; g.weather.target = 1;
    const s = JSON.parse(JSON.stringify(g.snapshot("full")));
    const g2 = new Game();
    g2.applySnapshot(s);
    expect(g2.progress.storyDone).toEqual(["first_shift", "lost_manifest"]);
    expect(g2.inv.cash).toBe(900);
    expect(g2.inv.trust).toBe(2);
    expect(g2.inv.unlocked).toContain("pistol");
    expect(g2.clock.hour).toBeCloseTo(20.5);
    expect(g2.weather.target).toBe(1);
    expect(g2.vehicles.some((v) => v.tag === "owned" && v.spec.id === "brava")).toBe(true);
    expect(g2.vehicles.some((v) => v.tag === "kestrel")).toBe(true);
  });
});
