import { describe, it, expect, beforeEach } from "vitest";
import { validateLoadout, DEFAULT_LOADOUTS, cloneLoadout } from "../src/content/loadout";
import { ATTACHMENTS, PERKS } from "../src/content/items";
import { WEAPONS, PRIMARY_IDS, SIDEARM_IDS } from "../src/content/weapons";
import { computeStats } from "../src/shared/weapon-sim";
import { applyResult, newProfile, migrate } from "../src/profile/profile";
import { levelForXp, xpForLevel, MAX_LEVEL, unlockTable } from "../src/content/progression";
import { MatchResult } from "../src/shared/protocol";

describe("loadouts", () => {
  it("default loadouts are valid for a fresh level-1 profile (starter choice in every category)", () => {
    for (const l of DEFAULT_LOADOUTS) expect(validateLoadout(l, { level: 1 }).ok).toBe(true);
  });

  it("rejects tampered or illegal loadouts", () => {
    const base = DEFAULT_LOADOUTS[0];
    const cases: [string, (l: ReturnType<typeof cloneLoadout>) => void][] = [
      ["unknown weapon", (l) => { l.primary = "railgun"; }],
      ["sidearm as primary", (l) => { l.primary = "relay"; }],
      ["locked weapon", (l) => { l.primary = "warden"; }],
      ["too many attachments", (l) => { l.primaryAttachments = ["reflex", "compensator", "stableGrip", "lightStock"]; }],
      ["slot conflict", (l) => { l.primaryAttachments = ["reflex", "optic2x"]; }],
      ["incompatible attachment", (l) => { l.primary = "kestrel"; l.primaryAttachments = ["fixedStock", "stableGrip"]; }],
      ["perk in wrong group", (l) => { l.perks.mobility = "traceReader"; }],
      ["support in wrong tier", (l) => { l.support = ["hunterDrone", "reconSweep", "interdictionFlight"]; }],
      ["tactical in lethal slot", (l) => { l.lethal = "flash"; }],
    ];
    for (const [name, mut] of cases) {
      const l = cloneLoadout(base); mut(l);
      expect(validateLoadout(l, { level: 1 }).ok, name).toBe(false);
    }
    expect(validateLoadout(null, { level: 30 }).ok).toBe(false);
    expect(validateLoadout({ ...base, primary: "warden", primaryAttachments: [] }, { level: 1, allUnlocked: true }).ok).toBe(true);
  });

  it("no attachment or perk changes damage, health or headshot multipliers", () => {
    const forbidden = ["damage", "health", "maxHealth", "headshot", "zones"];
    for (const a of Object.values(ATTACHMENTS)) for (const k of Object.keys(a.mods)) expect(forbidden).not.toContain(k);
    for (const id of [...PRIMARY_IDS, ...SIDEARM_IDS]) {
      const plain = computeStats(id, [], []);
      for (const a of Object.values(ATTACHMENTS)) {
        const s = computeStats(id, [a.id], Object.keys(PERKS));
        expect(s.def.damage).toEqual(plain.def.damage);
        expect(s.def.zones).toEqual(WEAPONS[id].zones);
      }
    }
    for (const p of Object.values(PERKS)) expect(p.desc).not.toMatch(/damage|max health|headshot/i);
  });

  it("every attachment has a stated tradeoff", () => {
    for (const a of Object.values(ATTACHMENTS)) { expect(a.pro.length).toBeGreaterThan(3); expect(a.con.length).toBeGreaterThan(3); }
  });
});

const result = (id: string, won = true): MatchResult => ({
  matchId: id, map: "k17", winner: won ? 0 : 1, scores: [75, 60], duration: 420, localId: 1, signature: "x",
  players: [{ id: 1, name: "Me", team: 0, bot: false, kills: 20, deaths: 10, assists: 6, score: 2600, supportDestroyed: 1, bestStreak: 6, headshots: 4, adsKills: 12, equipmentHits: 3, zonesVisited: 5, weapons: { jackal: { shots: 400, hits: 120, kills: 20 } } }],
});

describe("progression & profile", () => {
  beforeEach(() => { /* pure functions, no storage */ });
  it("level curve spans 1-30 brisk and monotonic", () => {
    expect(levelForXp(0)).toBe(1);
    for (let l = 2; l <= MAX_LEVEL; l++) { expect(xpForLevel(l)).toBeGreaterThan(xpForLevel(l - 1)); expect(levelForXp(xpForLevel(l))).toBe(l); }
    expect(levelForXp(10 ** 9)).toBe(MAX_LEVEL);
    expect(unlockTable().every((u) => u.level >= 2 && u.level <= MAX_LEVEL)).toBe(true);
  });

  it("applies match results idempotently and completes challenges", () => {
    const p = newProfile();
    const r1 = applyResult(p, result("m1"));
    expect(r1.applied).toBe(true);
    expect(r1.totalXp).toBeGreaterThan(0);
    const xp = p.xp;
    const again = applyResult(p, result("m1"));
    expect(again.applied).toBe(false);
    expect(p.xp).toBe(xp);
    expect(p.stats.matches).toBe(1);
    expect(p.challenges.routes.done).toBe(true);
    expect(p.challenges.equipment.done).toBe(true);
    expect(r1.levelAfter).toBeGreaterThan(r1.levelBefore);
    expect(r1.unlocks.length).toBeGreaterThan(0);
  });

  it("migrates corrupt or old profiles safely", () => {
    const m = migrate({ version: 1, xp: -50, loadouts: [{ primary: "nope" }], selected: 99, settings: { fov: 100 } });
    expect(m.xp).toBe(0);
    expect(m.loadouts).toHaveLength(5);
    expect(validateLoadout(m.loadouts[0], { level: 1 }).ok).toBe(true);
    expect(m.selected).toBe(0);
    expect(m.settings.fov).toBe(100);
    expect(m.settings.binds.forward).toBe("KeyW");
    expect(migrate("garbage").version).toBeGreaterThan(0);
  });
});
