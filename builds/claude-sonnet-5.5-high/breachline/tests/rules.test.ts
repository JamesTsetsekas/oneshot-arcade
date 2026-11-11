import { describe, expect, it } from "vitest";
import { advance, makeWorld, place } from "./helpers";
import { defaultLoadouts, validateLoadout, sanitizeLoadout, resolveWeaponStats } from "../src/shared/content/loadout";
import { MAX_LEVEL, levelFromXp, totalXpForLevel, unlocksAtLevel, UNLOCK_LEVELS, xpToNext } from "../src/shared/content/progression";
import { ATTACHMENTS } from "../src/shared/content/attachments";
import { PERKS, SUPPORTS, EQUIPMENT } from "../src/shared/content/gear";
import { WEAPONS } from "../src/shared/content/weapons";
import { chooseSpawn, evaluateSpawn, UNSAFE_SIGHT_DIST } from "../src/shared/sim/spawn";
import { Rng } from "../src/shared/math";
import type { PlayerState } from "../src/shared/sim/types";
import { World } from "../src/shared/sim/world";

function roster(w: World, perTeam: number, bots = false): PlayerState[] {
  const l = defaultLoadouts();
  const out: PlayerState[] = [];
  for (let i = 0; i < perTeam; i++) {
    out.push(w.addPlayer({ name: `A${i}`, team: 0, isBot: bots, loadout: l[i % 5] }));
    out.push(w.addPlayer({ name: `B${i}`, team: 1, isBot: bots, loadout: l[(i + 2) % 5] }));
  }
  return out;
}
const kill = (w: World, killer: PlayerState, victim: PlayerState, support = false) => {
  victim.spawnProtectedUntil = 0; victim.alive = true; victim.health = 100;
  w.damagePlayer(victim, killer.id, 500, "upper", "ar4", victim.pos, 10, support, killer.pos);
};

describe("match rules", () => {
  it("warmup then live; first to 75 wins; clock counts down", () => {
    const w = makeWorld({ warmup: 0.5 });
    const ps = roster(w, 1);
    advance(w, 0.3);
    expect(w.match.phase).toBe("warmup");
    advance(w, 0.5);
    expect(w.match.phase).toBe("live");
    expect(w.timeRemaining).toBeLessThanOrEqual(480);
    for (let i = 0; i < 75; i++) kill(w, ps[0], ps[1]);
    advance(w, 0.1);
    expect(w.match.teamScore[0]).toBe(75);
    expect(w.match.phase).toBe("ended");
    expect(w.match.winner).toBe(0);
  });
  it("leading team wins at the time limit", () => {
    const w = makeWorld({ warmup: 0.05, timeLimit: 5 });
    const ps = roster(w, 1);
    advance(w, 0.2);
    kill(w, ps[1], ps[0]);
    advance(w, 5.5);
    expect(w.match.phase).toBe("ended");
    expect(w.match.winner).toBe(1);
  });
  it("tie at the limit enters 60 s sudden death (+5 target) and resolves", () => {
    const w = makeWorld({ warmup: 0.05, timeLimit: 3, suddenDeathSeconds: 60 });
    const ps = roster(w, 1);
    advance(w, 0.2);
    kill(w, ps[0], ps[1]); kill(w, ps[1], ps[0]);
    advance(w, 3.2);
    expect(w.match.phase).toBe("sudden");
    expect(w.match.suddenTarget).toBe(w.match.teamScore[0] + 5);
    for (let i = 0; i < 5; i++) kill(w, ps[0], ps[1]);
    advance(w, 0.1);
    expect(w.match.phase).toBe("ended");
    expect(w.match.winner).toBe(0);
  });
  it("sudden death that expires level ends in a draw", () => {
    const w = makeWorld({ warmup: 0.05, timeLimit: 1, suddenDeathSeconds: 2 });
    roster(w, 1);
    advance(w, 4);
    expect(w.match.phase).toBe("ended");
    expect(w.match.winner).toBe(2);
  });
  it("assist score does not increase team score", () => {
    const w = makeWorld({ warmup: 0.05 });
    const [a, b, c] = roster(w, 2);
    advance(w, 0.2);
    void b;
    const victim = w.players.find((p) => p.team === 1)!;
    victim.spawnProtectedUntil = 0;
    w.damagePlayer(victim, a.id, 40, "upper", "ar4", victim.pos, 10, false, a.pos);
    const mate = w.players.find((p) => p.team === 0 && p.id !== a.id)!;
    w.damagePlayer(victim, mate.id, 500, "upper", "ar4", victim.pos, 10, false, mate.pos);
    expect(w.match.teamScore[0]).toBe(1);
    expect(a.stats.assists).toBe(1);
    void c;
  });
});

describe("Momentum and support actions", () => {
  it("earns all three tiers in one life; resets on death; support kills add no Momentum", () => {
    const w = makeWorld({ warmup: 0.05 });
    const ps = roster(w, 6);
    advance(w, 0.2);
    const hero = ps[0];
    const enemies = ps.filter((p) => p.team === 1);
    for (let i = 0; i < 8; i++) kill(w, hero, enemies[i % 6]);
    expect(hero.momentum).toBe(8);
    expect(hero.supportReady).toEqual([true, true, true]);
    // support kills add score but not momentum
    const before = hero.momentum;
    kill(w, hero, enemies[0], true);
    expect(hero.momentum).toBe(before);
    expect(hero.stats.supportKills).toBe(1);
    // death resets momentum + readiness
    kill(w, enemies[1], hero);
    expect(hero.momentum).toBe(0);
    expect(hero.supportReady).toEqual([false, false, false]);
  });
  it("Mortar Mark must target outdoors and Interdiction allows one Tier 8 per team", () => {
    const w = makeWorld({ warmup: 0.05 });
    const ps = roster(w, 2);
    advance(w, 0.2);
    const p = ps[0];
    p.loadout = { ...p.loadout, support: ["recon", "mortar", "flight"] };
    p.supportReady = [true, true, true];
    // indoor target (inside the control room) rejected
    expect(w.support.deploy(p, 1, { x: -33, y: 0, z: 0 }).ok).toBe(false);
    expect(p.supportReady[1]).toBe(true);
    // outdoor target accepted
    expect(w.support.deploy(p, 1, { x: 10, y: 0, z: 8 }).ok).toBe(true);
    expect(p.supportReady[1]).toBe(false);
    expect(w.support.deploy(p, 2, { x: 0, y: 0, z: 30 }, { x: 1, y: 0, z: 0 }).ok).toBe(true);
    const q = ps[2];
    q.loadout = { ...q.loadout, support: ["recon", "mortar", "flight"] };
    q.supportReady = [false, false, true];
    expect(w.support.deploy(q, 2, { x: 5, y: 0, z: 30 }).ok).toBe(false); // already one active for the team
  });
  it("mortar shells land after a telegraph and hurt enemies outdoors", () => {
    const w = makeWorld({ warmup: 0.05 });
    const ps = roster(w, 1);
    advance(w, 0.2);
    const [a, b] = ps;
    place(a, -20, 10, 0); place(b, 10, 8, 0); b.spawnProtectedUntil = 0; a.spawnProtectedUntil = 0;
    a.supportReady = [false, true, false];
    a.loadout = { ...a.loadout, support: ["recon", "mortar", "uplink"] };
    w.drainEvents();
    expect(w.support.deploy(a, 1, { x: 10, y: 0, z: 8 }).ok).toBe(true);
    const warn = w.drainEvents().find((e) => e.t === "supportWarn");
    expect(warn).toBeTruthy();
    advance(w, 3.0, () => place(b, 10, 8, 0));
    expect(b.health).toBe(100); // still telegraphing
    advance(w, 0.6, () => place(b, 10, 8, 0));
    expect(b.health).toBeLessThan(100);
  });
});

describe("equipment", () => {
  it("frag detonates after its fuse and damages enemies in range, not behind walls", () => {
    const w = makeWorld({ warmup: 0.05 });
    const [a, b] = roster(w, 1);
    advance(w, 0.2);
    a.spawnProtectedUntil = 0; b.spawnProtectedUntil = 0;
    place(a, -20, 0, Math.PI / 2); place(b, -14, 0, 0);
    w.equipment.explode("frag", -15, 0.2, 0, a.id, 0, 5.5, 150, null);
    expect(b.health).toBeLessThan(60);
    const c = b.health;
    place(b, -33, 0, 0); // behind the control-room wall relative to an explosion in the courtyard
    w.equipment.explode("frag", -26, 0.2, 7, a.id, 0, 5.5, 150, null);
    expect(b.health).toBe(c);
  });
  it("thrown frag follows a bouncing arc and explodes on its fuse", () => {
    const w = makeWorld({ warmup: 0.05 });
    const [a, b] = roster(w, 1);
    advance(w, 0.2);
    a.spawnProtectedUntil = 0; b.spawnProtectedUntil = 0;
    place(a, -22, 0, Math.PI / 2); place(b, -8, 0, 0);
    a.swapT = 0;
    a.pitch = 0.5;
    a.cmd = { ...a.cmd, lethal: true, lethalHeld: true, yaw: Math.PI / 2, pitch: 0.5 };
    w.tick();
    a.cmd = { ...a.cmd, lethal: false, lethalHeld: false, yaw: Math.PI / 2, pitch: 0.5 };
    advance(w, 0.05);
    expect(w.projectiles.length).toBe(1);
    const ev: string[] = [];
    advance(w, 4, () => { for (const e of w.drainEvents()) if (e.t === "explode") ev.push(e.kind); });
    expect(ev).toContain("frag");
    expect(w.projectiles.length).toBe(0);
  });
  it("obscurant blocks line of sight; flash blinds enemies that face it", () => {
    const w = makeWorld({ warmup: 0.05 });
    const [a, b] = roster(w, 1);
    advance(w, 0.2);
    place(a, -20, 0, Math.PI / 2); place(b, -8, 0, 0);
    const eyeA = { x: -20, y: 1.6, z: 0 }, eyeB = { x: -8, y: 1.6, z: 0 };
    expect(w.col.lineClear(eyeA, eyeB, w.time)).toBe(true);
    w.col.smokes.push({ x: -14, y: 1.5, z: 0, r: 5.4, rMax: 5.4, until: w.time + 10 });
    expect(w.col.lineClear(eyeA, eyeB, w.time)).toBe(false);
    // flash
    w.col.smokes = [];
    b.yaw = -Math.PI / 2; // facing the flash at x=-14?  (facing -x)
    const pr = (w.equipment as unknown as { spawnProjectile: (...a: unknown[]) => { fuseAt: number } }).spawnProjectile("flash", a, { x: -12, y: 1.5, z: 0 }, { x: 0, y: 0, z: 0 }, 0.05);
    void pr;
    advance(w, 0.2);
    expect(b.flashedUntil).toBeGreaterThan(w.time);
  });
});

describe("spawn director", () => {
  it("never picks a candidate with direct enemy sight in the unsafe distance when a safe candidate exists (10,000 respawns)", () => {
    const w = makeWorld({ warmup: 0.05, seed: 99 });
    const ps = roster(w, 6);
    advance(w, 0.3);
    const rng = new Rng(7);
    const nodes = w.nav.nodes;
    let violations = 0, safeExisted = 0;
    for (let i = 0; i < 10000; i++) {
      // scatter the enemy team (and some of the own team) randomly over the walkable map
      for (const p of ps) { const n = nodes[rng.int(nodes.length)]; place(p, n.x, n.z, rng.next() * 6.28); p.alive = true; }
      const respawner = ps[rng.int(ps.length)];
      const choice = chooseSpawn(w, respawner);
      const cands = w.map.spawns.filter((s) => s.team === respawner.team);
      const anySafe = cands.some((c) => {
        if (w.players.some((q) => q.alive && q.id !== respawner.id && Math.hypot(q.pos.x - c.pos.x, q.pos.z - c.pos.z) < 1.4)) return false;
        return evaluateSpawn(w, respawner, c).safe;
      });
      if (anySafe) {
        safeExisted++;
        const e = evaluateSpawn(w, respawner, choice.spawn);
        if (e.los && e.minDist < UNSAFE_SIGHT_DIST) violations++;
        if (!e.safe) violations++;
      }
    }
    expect(safeExisted).toBeGreaterThan(1000);
    expect(violations).toBe(0);
  });
  it("records a deterministic audit reason", () => {
    const w = makeWorld({ warmup: 0.05 });
    roster(w, 2);
    advance(w, 0.3);
    expect(w.lastSpawnReason).toMatch(/score=/);
  });
});

describe("loadouts, progression and unlock rules", () => {
  it("default loadouts are all valid", () => { for (const l of defaultLoadouts()) expect(validateLoadout(l).errors).toEqual([]); });
  it("rejects tampered loadouts", () => {
    const base = defaultLoadouts()[0];
    const bad = [
      { ...base, primary: "m7rail" },
      { ...base, secondary: "ar4" },
      { ...base, attachments: ["reflex", "optic2x"] }, // two optics
      { ...base, attachments: ["reflex", "compensator", "angled", "extmag"] }, // four attachments
      { ...base, perks: ["fleet", "fleet", "rapid"] as [string, string, string] },
      { ...base, support: ["flight", "drone", "uplink"] as [string, string, string] }, // wrong tier
      { ...base, lethal: "flash" },
      { ...base, primary: "sg8", attachments: ["extmag"] }, // not allowed on shotgun
    ];
    for (const l of bad) expect(validateLoadout(l).ok, JSON.stringify(l)).toBe(false);
    expect(sanitizeLoadout(bad[0] as never).primary).toBe(base.primary);
  });
  it("unlock ownership is enforced when an owned-set is given", () => {
    const l = { ...defaultLoadouts()[0], primary: "mr1", attachments: [] as string[] };
    expect(validateLoadout(l, new Set(["ar4", "p9"])).ok).toBe(false);
  });
  it("levels run 1-30 and unlocks never grant health or damage", () => {
    expect(MAX_LEVEL).toBe(30);
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(totalXpForLevel(30)).level).toBe(30);
    expect(xpToNext(1)).toBeLessThan(xpToNext(29));
    for (const id of Object.keys(UNLOCK_LEVELS)) expect(WEAPONS[id] || ATTACHMENTS[id] || PERKS[id] || SUPPORTS[id] || EQUIPMENT[id], id).toBeTruthy();
    expect(unlocksAtLevel(1).length).toBeGreaterThan(8);
    // starter profile has one competitive choice in every category
    const l1 = Object.entries(UNLOCK_LEVELS).filter(([, v]) => v === 1).map(([k]) => k);
    for (const cat of [["ar4"], ["p9"], ["reflex"], ["compensator"], ["angled"], ["extmag"], ["fixedstock"], ["fleet"], ["signalfilter"], ["rapid"], ["frag"], ["flash"], ["recon"], ["drone"], ["uplink"]]) expect(l1).toContain(cat[0]);
    // perks do not modify damage/health
    const base = resolveWeaponStats("ar4", [], []);
    const perked = resolveWeaponStats("ar4", [], ["fleet", "signalfilter", "rapid"]);
    expect(perked.damage).toBe(base.damage);
  });
});
