import { describe, it, expect } from "vitest";
import { Room, Player } from "../src/server/room";
import { DEFAULT_LOADOUTS, cloneLoadout } from "../src/content/loadout";
import { COMBAT, MATCH } from "../src/content/tuning";
import { BTN, GameEvent } from "../src/shared/protocol";
import { yawPitchTo } from "../src/shared/math";
import { PRIMARY_IDS, SIDEARM_IDS, WEAPONS } from "../src/content/weapons";

function quietRoom(opts: ConstructorParameters<typeof Room>[0] = {}) {
  const r = new Room({ seed: 11, local: { name: "Tester", loadout: DEFAULT_LOADOUTS[0] }, botsPerTeam: [1, 1], warmup: 0.05, ...opts });
  // freeze bots so tests control everything
  for (const p of r.players) if (p.bot) p.brain = null;
  r.tick(); r.tick(); r.tick(); r.tick();
  return r;
}
const enemyOf = (r: Room) => r.players.find((p) => p.team === 1)!;
const me = (r: Room) => r.get(r.localId)!;
function place(p: Player, x: number, y: number, z: number) { p.move.pos = { x, y, z }; p.move.vel = { x: 0, y: 0, z: 0 }; p.spawnPos = { x, y, z }; p.protectedActive = false; }

describe("authoritative room rules", () => {
  it("applies damage, regenerates after 5 s at 22 HP/s, and regen is interrupted by damage", () => {
    const r = quietRoom();
    const a = me(r), b = enemyOf(r);
    place(a, 0, 0, -5); place(b, 0, 0, 5);
    r.damage(b, a, 60, { source: "jackal", kind: "weapon", zone: "upper", from: a.move.pos });
    expect(b.health).toBe(40);
    for (let i = 0; i < 60 * 4.9; i++) r.tick();
    expect(b.health).toBeCloseTo(40, 5);
    for (let i = 0; i < 60; i++) r.tick();
    expect(b.health).toBeGreaterThan(40 + COMBAT.regenRate * 0.8);
    r.damage(b, a, 5, { source: "jackal", kind: "weapon", zone: "upper", from: a.move.pos });
    const h = b.health;
    for (let i = 0; i < 60; i++) r.tick();
    expect(b.health).toBeCloseTo(h, 5);
  });

  it("friendly fire is off and spawn-protected players take no damage", () => {
    const r = new Room({ seed: 3, local: { name: "T", loadout: DEFAULT_LOADOUTS[0] }, botsPerTeam: [2, 1], warmup: 0.05 });
    for (const p of r.players) p.brain = null;
    for (let i = 0; i < 6; i++) r.tick();
    const mate = r.players.find((p) => p.team === 0 && p.id !== r.localId)!;
    mate.protectedActive = false;
    r.damage(mate, me(r), 50, { source: "jackal", kind: "weapon", zone: "upper", from: me(r).move.pos });
    expect(mate.health).toBe(100);
    const e = enemyOf(r);
    e.protectedActive = true; me(r).protectedActive = false;
    r.damage(e, me(r), 50, { source: "jackal", kind: "weapon", zone: "upper", from: me(r).move.pos });
    expect(e.health).toBe(100);
  });

  it("spawn protection ends after 2 s or 5 m of movement", () => {
    const r = quietRoom();
    const p = me(r);
    r["spawn"](p);
    expect(p.protectedActive).toBe(true);
    for (let i = 0; i < 60 * 2.1; i++) r.tick();
    expect(p.protectedActive).toBe(false);
    r["spawn"](p);
    p.move.pos.x += 5.5;
    r.tick();
    expect(p.protectedActive).toBe(false);
  });

  it("kills score 1 team point, assists give score but not team points, respawn takes 3 s", () => {
    const r = quietRoom();
    const a = me(r), b = enemyOf(r);
    const mate = r.addPlayer("Mate", 0, true, DEFAULT_LOADOUTS[1]); r["spawn"](mate); mate.protectedActive = false;
    place(a, 0, 0, -5); place(b, 0, 0, 5);
    r.damage(b, mate, 40, { source: "jackal", kind: "weapon", zone: "upper", from: mate.move.pos });
    r.damage(b, a, 70, { source: "jackal", kind: "weapon", zone: "upper", from: a.move.pos });
    expect(b.alive).toBe(false);
    expect(r.scores).toEqual([1, 0]);
    expect(a.stats.kills).toBe(1);
    expect(mate.stats.assists).toBe(1);
    for (let i = 0; i < 60 * 2.9; i++) r.tick();
    expect(b.alive).toBe(false);
    for (let i = 0; i < 20; i++) r.tick();
    expect(b.alive).toBe(true);
  });

  it("earns all three Momentum tiers in one life; support kills don't extend Momentum; death resets it", () => {
    const r = quietRoom();
    const a = me(r);
    a.protectedActive = false;
    const victims: Player[] = [];
    for (let i = 0; i < 9; i++) { const v = r.addPlayer(`V${i}`, 1, true, DEFAULT_LOADOUTS[0]); r["spawn"](v); v.protectedActive = false; victims.push(v); }
    for (let i = 0; i < 8; i++) r.damage(victims[i], a, 200, { source: "jackal", kind: "weapon", zone: "upper", from: a.move.pos });
    expect(a.momentum).toBe(8);
    expect(a.supportReady).toEqual(DEFAULT_LOADOUTS[0].support);
    r.damage(victims[8], a, 200, { source: "mortarMark", kind: "support", zone: "strike", from: a.move.pos });
    expect(a.momentum).toBe(8);
    const killer = enemyOf(r); killer.protectedActive = false; a.protectedActive = false;
    r.damage(a, killer, 500, { source: "jackal", kind: "weapon", zone: "upper", from: killer.move.pos });
    expect(a.momentum).toBe(0);
  });

  it("every weapon fires hitscan through the room and can kill an opponent", () => {
    for (const id of [...PRIMARY_IDS, ...SIDEARM_IDS]) {
      const lo = cloneLoadout(DEFAULT_LOADOUTS[0]);
      if (WEAPONS[id].slot === "primary") { lo.primary = id; lo.primaryAttachments = []; } else lo.sidearm = id;
      const r = quietRoom({ local: { name: "T", loadout: lo }, allUnlocked: true });
      const a = me(r), b = enemyOf(r);
      place(a, -6, 0, 0); place(b, -6, 0, 6);
      const aim = yawPitchTo(r.eye(a), r.chest(b));
      let killed = false;
      for (let i = 0; i < 60 * 8 && !killed; i++) {
        const fire = i % 2 === 0;
        r.submitInput(a.id, { seq: i, tick: r.tickN, mx: 0, mz: 0, yaw: aim.yaw, pitch: aim.pitch, buttons: (fire ? BTN.fire : 0) | BTN.ads, slot: WEAPONS[id].slot === "primary" ? 0 : 1, supportSel: 0 });
        r.tick();
        b.move.pos = { x: -6, y: 0, z: 6 }; b.lastDamageAt = r.time;
        for (const e of r.drainEvents()) if (e.type === "kill" && e.victim === b.id) killed = true;
      }
      expect(killed, id).toBe(true);
    }
  });

  it("death recap mirrors the server damage log and names only the attacker", () => {
    const r = quietRoom();
    const a = me(r), b = enemyOf(r);
    place(a, 0, 0, -5); place(b, 0, 0, 5);
    r.damage(a, b, 30, { source: "kestrel", kind: "weapon", zone: "upper", from: r.eye(b) });
    r.damage(a, b, 80, { source: "kestrel", kind: "weapon", zone: "head", from: r.eye(b) });
    const ev = r.drainEvents().find((e) => e.type === "death") as Extract<GameEvent, { type: "death" }>;
    expect(ev.recap.killer).toBe(b.name);
    expect(ev.recap.hits.map((h) => h.damage)).toEqual([30, 80]);
    expect(ev.recap.headshot).toBe(true);
    expect(ev.recap.distance).toBe(10);
    expect(ev.recap.finalDir.z).toBeGreaterThan(0.9);
  });

  it("match ends at the score limit and at the time limit, with sudden death on ties", () => {
    const r = quietRoom({ scoreLimit: 3 });
    r.scores = [3, 1];
    r.tick();
    expect(r.phase).toBe("ended");
    expect(r.winner).toBe(0);
    expect(r.result?.scores).toEqual([3, 1]);
    const t = quietRoom({ timeLimit: 1 });
    t.scores = [2, 2];
    for (let i = 0; i < 70; i++) t.tick();
    expect(t.phase).toBe("suddenDeath");
    t.scores = [2, 7];
    t.tick();
    expect(t.phase).toBe("ended");
    expect(t.winner).toBe(1);
    const d = quietRoom({ timeLimit: 1 });
    d.scores = [4, 4];
    for (let i = 0; i < 60 * (1 + MATCH.suddenDeathTime) + 30; i++) d.tick();
    expect(d.winner).toBe(-1);
  });

  it("rejects invalid or tampered loadouts at the room boundary", () => {
    const r = quietRoom();
    const bad = cloneLoadout(DEFAULT_LOADOUTS[0]);
    bad.primary = "warden"; // locked at level 1
    expect(r.requestLoadout(r.localId, bad).ok).toBe(false);
    const bad2 = { ...cloneLoadout(DEFAULT_LOADOUTS[0]), primaryAttachments: ["reflex", "optic2x"] };
    expect(r.requestLoadout(r.localId, bad2).ok).toBe(false);
    expect(r.requestLoadout(r.localId, DEFAULT_LOADOUTS[1]).ok).toBe(true);
  });

  it("lag compensation rewinds target hitboxes (clamped history)", () => {
    const r = quietRoom();
    const a = me(r), b = enemyOf(r);
    place(a, -8, 0, -5); place(b, -8, 0, 5);
    for (let i = 0; i < 12; i++) r.tick();
    const then = r.rewoundHitboxes(b, 0)!;
    b.move.pos = { x: -5, y: 0, z: 5 };
    for (let i = 0; i < 6; i++) { r.tick(); b.move.pos = { x: -5, y: 0, z: 5 }; }
    const now = r.rewoundHitboxes(b, 0)!;
    const past = r.rewoundHitboxes(b, 9)!;
    expect(now[0].min.x).toBeGreaterThan(-6);
    expect(past[0].min.x).toBeCloseTo(then[0].min.x, 5);
    a.ping = 120;
    const res = r.traceBullet(a, r.eye(a), { x: 0, y: 0, z: 1 }, "jackal", 1, 9);
    expect(res.hitPlayer).toBe(true);
  });

  it("obscurant blocks sight; walls block sight", () => {
    const r = quietRoom();
    expect(r.sightClear({ x: -50, y: 1.6, z: 0 }, { x: 0, y: 1.6, z: 0 })).toBe(false); // ops wing walls in between
    const a = { x: -10, y: 1.6, z: 0 }, b = { x: 10, y: 1.6, z: 0 };
    const clear0 = r.sightClear({ x: -10, y: 1.6, z: -8 }, { x: 10, y: 1.6, z: -8 });
    r.smokes.push({ id: 99, pos: { x: 0, y: 0, z: -8 }, radius: 5.5, t: 5, life: 12 });
    expect(clear0).toBe(true);
    expect(r.sightClear({ x: -10, y: 1.6, z: -8 }, { x: 10, y: 1.6, z: -8 })).toBe(false);
    void a; void b;
  });
});
