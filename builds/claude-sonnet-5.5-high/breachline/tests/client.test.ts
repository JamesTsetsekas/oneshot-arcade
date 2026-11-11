import { describe, expect, it } from "vitest";
import { hfovToVfov, defaultSettings, PRESETS } from "../src/client/runtime/settings";
import { newProfile, applyMatchResult } from "../src/client/runtime/profile";
import { levelFromXp } from "../src/shared/content/progression";
import { makeWorld, advance } from "./helpers";
import { defaultLoadouts } from "../src/shared/content/loadout";
import { paletteFor } from "../src/client/runtime/game";
import { weaponLabel, WEAPONS } from "../src/shared/content/weapons";

describe("client runtime logic", () => {
  it("converts horizontal FOV to vertical FOV for the actual aspect ratio", () => {
    const v169 = hfovToVfov(90, 16 / 9);
    expect((v169 * 180) / Math.PI).toBeCloseTo(58.72, 1);
    expect(hfovToVfov(90, 1)).toBeCloseTo(Math.PI / 2, 5);
    expect(hfovToVfov(110, 16 / 9)).toBeGreaterThan(hfovToVfov(75, 16 / 9));
  });
  it("default settings respect the brief ranges", () => {
    const s = defaultSettings();
    expect(s.fov).toBeGreaterThanOrEqual(75); expect(s.fov).toBeLessThanOrEqual(110);
    expect(s.viewmodelFov).toBeGreaterThanOrEqual(55); expect(s.viewmodelFov).toBeLessThanOrEqual(75);
    expect(s.sensitivity).toBeGreaterThanOrEqual(0.1); expect(s.sensitivity).toBeLessThanOrEqual(10);
    expect(PRESETS.low.shadows).toBe(false);
  });
  it("match results are idempotent per match id and grant XP without touching stats twice", () => {
    const store: Record<string, string> = {};
    (globalThis as unknown as { localStorage: Storage }).localStorage = { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; }, clear: () => {}, key: () => null, length: 0 } as Storage;
    const w = makeWorld({ warmup: 0.05 });
    const me = w.addPlayer({ name: "me", team: 0, isBot: false, loadout: defaultLoadouts()[0] });
    advance(w, 0.2);
    me.stats.kills = 10; me.stats.assists = 2; me.stats.headshots = 3;
    const p = newProfile();
    const a = applyMatchResult(p, me, true, false, true, "m-1");
    expect(a.xpGained).toBe(150 + 1000 + 75 + 100 + 500 + 100);
    const xp = p.xp;
    const b = applyMatchResult(p, me, true, false, true, "m-1");
    expect(b.xpGained).toBe(0);
    expect(p.xp).toBe(xp);
    expect(p.matches).toBe(1);
    expect(levelFromXp(p.xp).level).toBeGreaterThan(1);
  });
  it("colour-blind palettes differ from the default and each other", () => {
    expect(paletteFor("off")).not.toEqual(paletteFor("deuteranopia"));
    expect(paletteFor("deuteranopia")).not.toEqual(paletteFor("tritanopia"));
  });
  it("weapon labels collapse duplicate names", () => {
    expect(weaponLabel(WEAPONS.cinder)).toBe("Cinder Auto");
    expect(weaponLabel(WEAPONS.ar4)).toBe("AR-4 Jackal");
  });
});
