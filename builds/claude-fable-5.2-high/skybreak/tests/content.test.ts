import { describe, expect, it } from "vitest";
import { ITEMS, ITEM_IDS } from "../src/shared/content/items";
import { PACE_SCALE, STORM_PHASES } from "../src/shared/content/rules";
import { AMMO_CAPS, RARITIES, WEAPONS, WEAPON_IDS, falloffMult, recoilKick, weaponStats } from "../src/shared/content/weapons";
import { LootRoller } from "../src/server/match/loot";
import { Storm } from "../src/server/match/storm";
import { Rng, pointInPolygon } from "../src/shared/math";
import { buildIsland, VALID_ZONES } from "../src/shared/world/island";

describe("weapons and rarity (shared-content)", () => {
  it("ships the nine brief weapons, five rarity tiers and four ammo types", () => {
    expect(WEAPON_IDS).toHaveLength(9);
    expect(RARITIES.map((r) => r.name)).toEqual(["Field", "Tuned", "Advanced", "Masterwork", "Prototype"]);
    expect(new Set(RARITIES.map((r) => r.shape)).size).toBe(5); // shape + colour, never colour alone
    expect(AMMO_CAPS).toEqual({ light: 240, shell: 48, heavy: 80, charge: 18 });
    expect(WEAPONS.wayfarer.mag).toBe(30);
    expect(WEAPONS.tempest.mag).toBe(28);
    expect(WEAPONS.breakwater.mag).toBe(5);
    expect(WEAPONS.coil.mag).toBe(6);
    expect(WEAPONS.needler.mag).toBe(36);
    expect(WEAPONS.sundial.mag).toBe(12);
    expect(WEAPONS.longwake.mag).toBe(5);
    expect(WEAPONS.harbor.mag).toBe(15);
  });

  it("rarity never doubles damage and stays a modest curve", () => {
    for (const id of WEAPON_IDS) {
      const base = weaponStats(id, 0);
      for (let r = 1; r < RARITIES.length; r++) {
        const s = weaponStats(id, r);
        expect(s.damage / base.damage).toBeLessThan(1.2);
        expect(s.damage / base.damage).toBeGreaterThanOrEqual(1.0);
        expect(s.mag).toBeGreaterThan(0);
        expect(s.reload).toBeLessThanOrEqual(base.reload * 1.3);
      }
    }
  });

  it("Tuned adds roughly 3% effective DPS; Masterwork and Prototype carry a named attachment", () => {
    const f = weaponStats("wayfarer", 0);
    const t = weaponStats("wayfarer", 1);
    expect((t.damage * t.rpm) / (f.damage * f.rpm)).toBeCloseTo(1.03, 2);
    expect(t.reload).toBeLessThan(f.reload);
    for (const id of WEAPON_IDS) {
      expect(weaponStats(id, 3).perk.length).toBeGreaterThan(3);
      expect(weaponStats(id, 4).perk.length).toBeGreaterThan(3);
      expect(weaponStats(id, 4).drawback.length).toBeGreaterThan(3);
    }
  });

  it("damage falloff is monotonic and bounded by the weapon's floor", () => {
    for (const id of WEAPON_IDS) {
      const st = weaponStats(id, 0);
      let prev = 1;
      for (let d = 0; d <= 400; d += 5) {
        const m = falloffMult(st.def, st, d);
        expect(m).toBeLessThanOrEqual(prev + 1e-9);
        expect(m).toBeGreaterThanOrEqual(st.def.falloffMin - 1e-9);
        prev = m;
      }
    }
  });

  it("recoil is a deterministic, learnable pattern", () => {
    const st = weaponStats("tempest", 0);
    const a = Array.from({ length: 12 }, (_, i) => recoilKick(st, i));
    const b = Array.from({ length: 12 }, (_, i) => recoilKick(st, i));
    expect(a).toEqual(b);
    expect(a[0]![0]).toBeGreaterThan(0);
  });

  it("defines the eight consumable / utility items with the brief's stacks and timings", () => {
    expect(ITEM_IDS).toHaveLength(8);
    expect(ITEMS.injector).toMatchObject({ stack: 4, useTime: 3 });
    expect(ITEMS.trauma).toMatchObject({ stack: 2, useTime: 7, interruptible: true });
    expect(ITEMS.flask).toMatchObject({ stack: 4, useTime: 2.5 });
    expect(ITEMS.cell).toMatchObject({ stack: 2, useTime: 3 });
    expect(ITEMS.mist.stack).toBe(2);
    expect(ITEMS.grapple.stack).toBe(3);
  });
});

describe("loot tables", () => {
  it("caps Prototype weapons per match and never repeats a weapon class inside one chest", () => {
    const roller = new LootRoller(new Rng(99));
    let protos = 0;
    for (let i = 0; i < 400; i++) {
      for (const d of roller.highTier(2)) if (d.kind === "weapon" && d.rarity === 4) protos++;
    }
    expect(protos).toBeLessThanOrEqual(4);
    for (let i = 0; i < 300; i++) {
      const chest = roller.chest(2);
      const classes = chest.filter((d) => d.kind === "weapon").map((d) => WEAPONS[d.weapon!].cls);
      expect(new Set(classes).size).toBe(classes.length);
      expect(chest.some((d) => d.kind === "weapon")).toBe(true);
      expect(chest.some((d) => d.kind === "ammo")).toBe(true);
    }
  });

  it("only the top tier can roll Prototype rarity", () => {
    const roller = new LootRoller(new Rng(5));
    for (let i = 0; i < 2000; i++) expect(roller.rarity(1 + (i % 3))).toBeLessThan(4);
  });
});

describe("Calmfield / Riftstorm schedule", () => {
  it("matches the brief's phase table", () => {
    const p = STORM_PHASES;
    expect(p[0]).toMatchObject({ wait: 90, dps: 0 });
    expect(p[1]).toMatchObject({ shrink: 120, fromR: 430, toR: 320, dps: 1 });
    expect(p[2]).toMatchObject({ wait: 70, shrink: 90, toR: 210, dps: 2 });
    expect(p[3]).toMatchObject({ wait: 55, shrink: 75, toR: 125, dps: 4 });
    expect(p[4]).toMatchObject({ wait: 40, shrink: 60, toR: 70, dps: 7 });
    expect(p[5]).toMatchObject({ wait: 30, shrink: 45, toR: 35, dps: 10 });
    expect(p.filter((q) => q.moving)).toHaveLength(3);
    expect(p[p.length - 1]!.toR).toBe(0);
  });

  it("nests every field inside the previous one and ends on authored valid ground, for many seeds", () => {
    const isl = buildIsland();
    expect(isl.finalCenters.length).toBeGreaterThan(20);
    for (const c of isl.finalCenters) {
      expect(VALID_ZONES.some((poly) => pointInPolygon(c[0], c[1], poly))).toBe(true);
      expect(isl.world.terrain(c[0], c[1])).toBeGreaterThan(1.5); // never open water
      expect(isl.nav.walkableAt(c[0], c[1])).toBe(true); // never an inaccessible roof
    }
    for (let seed = 1; seed <= 60; seed++) {
      const s = new Storm(new Rng(seed * 7717), isl.finalCenters, "standard");
      for (let i = 1; i <= 5; i++) {
        const a = s.centers[i - 1]!, b = s.centers[i]!;
        const slack = s.phases[i - 1]!.toR - s.phases[i]!.toR;
        expect(Math.hypot(a[0] - b[0], a[1] - b[1])).toBeLessThanOrEqual(slack + 1e-6);
      }
      for (let i = 5; i <= 9; i++) {
        const c = s.centers[i]!;
        expect(isl.finalCenters.some((f) => f[0] === c[0] && f[1] === c[1])).toBe(true);
      }
    }
  });

  it("progresses through every phase with the right timers and damage", () => {
    for (const pace of ["standard", "blitz"] as const) {
      const isl = buildIsland();
      const s = new Storm(new Rng(42), isl.finalCenters, pace);
      s.start();
      expect(s.dps).toBe(0);
      let t = 0;
      const seen = new Set<number>();
      const dpsSeen = new Map<number, number>();
      let lastR = s.r;
      while (s.state !== "done" && t < 2000) {
        s.step(1 / 30);
        t += 1 / 30;
        seen.add(s.phase);
        dpsSeen.set(s.phase, s.dps);
        expect(s.r).toBeLessThanOrEqual(lastR + 1e-6); // the field never grows
        lastR = s.r;
      }
      const total = STORM_PHASES.reduce((a, p) => a + p.wait + p.shrink, 0) * PACE_SCALE[pace];
      expect(t).toBeGreaterThan(total - 1);
      expect(t).toBeLessThan(total + 1);
      expect(seen.size).toBe(STORM_PHASES.length);
      expect(dpsSeen.get(1)).toBe(1);
      expect(dpsSeen.get(3)).toBe(4);
      expect(dpsSeen.get(5)).toBe(10);
      expect(s.r).toBe(0);
    }
  });
});
