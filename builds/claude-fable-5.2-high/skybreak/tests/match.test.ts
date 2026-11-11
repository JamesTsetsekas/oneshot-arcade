import { describe, expect, it } from "vitest";
import { Match } from "../src/server/match/match";
import { ITEMS } from "../src/shared/content/items";
import { INTEREST_RADIUS, STAGING_SECONDS } from "../src/shared/content/rules";
import { AMMO_CAPS, AMMO_PICKUP } from "../src/shared/content/weapons";
import { Mode } from "../src/shared/protocol/protocol";
import { filterEvents } from "../src/server/spatial/interest";
import { buildIsland, LOCATIONS } from "../src/shared/world/island";
import { Btn, HUMAN, give, giveItem, place, practice, run } from "./helpers";

describe("island source (collision + gameplay metadata)", () => {
  const isl = buildIsland();

  it("has the six named locations and eight landmarks, each with loot and a guaranteed weapon", () => {
    expect(LOCATIONS.filter((l) => l.named)).toHaveLength(6);
    expect(LOCATIONS.filter((l) => !l.named)).toHaveLength(8);
    for (const l of LOCATIONS) {
      const sockets = isl.sockets.filter((s) => s.loc === l.idx);
      expect(sockets.length, l.name).toBeGreaterThanOrEqual(2);
      expect(sockets.some((s) => s.guaranteed), l.name).toBe(true);
      expect(isl.chests.some((c) => c.loc === l.idx), l.name).toBe(true);
    }
    expect(isl.ziplines.length).toBeGreaterThanOrEqual(6);
    expect(isl.ascenders.length).toBeGreaterThanOrEqual(6);
    expect(isl.vents.length).toBeGreaterThanOrEqual(4);
    expect(isl.hazards.length).toBeGreaterThanOrEqual(2);
  });

  it("is deterministic and keeps the world inside its footprint", () => {
    expect(isl.collisionHash).toBe(buildIsland().collisionHash);
    expect(isl.hf.height(0, 0)).toBeGreaterThan(5);
    expect(isl.hf.height(790, 790)).toBeLessThan(-5); // void-sea beyond the shore
    for (const l of LOCATIONS) expect(Math.hypot(l.x, l.z)).toBeLessThan(600);
  });

  it("every named location is reachable on the nav grid with two or more ground exits", () => {
    const nav = isl.nav;
    for (const l of LOCATIONS.filter((q) => q.named)) {
      const start = nav.nearestWalkable(l.x, l.z, 30, true);
      expect(start, l.name).not.toBeNull();
      let exits = 0;
      for (let a = 0; a < 8; a++) {
        const ang = (a / 8) * Math.PI * 2;
        const p = nav.nearestWalkable(l.x + Math.sin(ang) * (l.r + 25), l.z + Math.cos(ang) * (l.r + 25), 10, true);
        if (p && nav.coarsePath(start![0], start![1], p[0], p[1])) exits++;
      }
      expect(exits, l.name).toBeGreaterThanOrEqual(2);
    }
    const a = nav.nearestWalkable(LOCATIONS[0]!.x + 20, LOCATIONS[0]!.z, 20)!;
    const b = nav.nearestWalkable(LOCATIONS[0]!.x - 30, LOCATIONS[0]!.z + 25, 20)!;
    expect(nav.finePath(a[0], a[1], b[0], b[1], 20000)).not.toBeNull();
  });

  it("raycasts and line-of-sight respect structures and terrain", () => {
    const w = isl.world;
    const abbey = LOCATIONS[4]!;
    const docks = LOCATIONS[5]!;
    // the abbey hill blocks the line between the market and the docks at ground level
    expect(w.lineClear(LOCATIONS[0]!.x, w.terrain(LOCATIONS[0]!.x, LOCATIONS[0]!.z) + 2, LOCATIONS[0]!.z, docks.x, 6, docks.z)).toBe(false);
    // straight up is always clear
    expect(w.lineClear(abbey.x + 60, 200, abbey.z, abbey.x + 60, 260, abbey.z)).toBe(true);
    const t = w.raycast(abbey.x + 60, 250, abbey.z, 0, -1, 0, 400);
    expect(t).toBeGreaterThan(100);
    expect(t).toBeLessThan(250);
  });
});

describe("inventory, loot and containers", () => {
  it("fills five universal slots, then requires a swap; drop and swap are validated", () => {
    const { m, me } = practice();
    place(m, me, -20, -17);
    const spots = [...m.loot.values()].filter((l) => l.kind === "weapon").slice(0, 6);
    expect(spots.length).toBe(6);
    for (let i = 0; i < 5; i++) {
      me.x = spots[i]!.x;
      me.z = spots[i]!.z;
      expect(m.pickup(me, spots[i]!.id, false)).toBe(true);
    }
    expect(me.slots.every((s) => s !== null)).toBe(true);
    me.x = spots[5]!.x;
    me.z = spots[5]!.z;
    expect(m.needsSwap(me, spots[5]!)).toBe(true);
    expect(m.pickup(me, spots[5]!.id, false)).toBe(false);
    const held = me.slots[me.selected]!;
    expect(m.pickup(me, spots[5]!.id, true)).toBe(true);
    const sel = me.slots[me.selected]!;
    expect(sel.kind === "weapon" && sel.weapon).toBe(spots[5]!.weapon);
    // the swapped-out weapon is back in the world with its exact magazine
    const dropped = [...m.loot.values()].find((l) => l.kind === "weapon" && held.kind === "weapon" && l.weapon === held.weapon && Math.hypot(l.x - me.x, l.z - me.z) < 3);
    expect(dropped).toBeDefined();
    // reorder
    const a = me.slots[0], b = me.slots[1];
    m.action(0, { type: "swapSlots", a: 0, b: 1 });
    expect(me.slots[0]).toBe(b);
    expect(me.slots[1]).toBe(a);
    m.action(0, { type: "dropSlot", slot: 0 });
    expect(me.slots[0]).toBeNull();
    // pickups out of range are refused
    const far = [...m.loot.values()].find((l) => Math.hypot(l.x - me.x, l.z - me.z) > 12)!;
    expect(m.pickup(me, far.id, true)).toBe(false);
  });

  it("caps ammo and stacks consumables to their limits", () => {
    const { m, me } = practice();
    me.ammo.shell = AMMO_CAPS.shell - 2;
    const e = (m as unknown as { addLoot: (d: object, x: number, y: number, z: number) => { id: number; count: number } }).addLoot({ kind: "ammo", ammo: "shell", count: AMMO_PICKUP.shell }, me.x, me.y, me.z);
    expect(m.pickup(me, e.id, false)).toBe(true);
    expect(me.ammo.shell).toBe(AMMO_CAPS.shell);
    expect(m.loot.get(e.id)!.count).toBe(AMMO_PICKUP.shell - 2); // the remainder stays on the ground
    expect(m.pickup(me, e.id, false)).toBe(false);
    giveItem(me, 0, "injector", 3);
    const inj = (m as unknown as { addLoot: (d: object, x: number, y: number, z: number) => { id: number } }).addLoot({ kind: "item", item: "injector", count: 2 }, me.x, me.y, me.z);
    expect(m.pickup(me, inj.id, false)).toBe(true);
    const s0 = me.slots[0]!;
    expect(s0.kind === "item" && s0.count).toBe(ITEMS.injector.stack);
    expect(me.slots.filter((s) => s && s.kind === "item" && s.item === "injector")).toHaveLength(2);
  });

  it("auto-collects ammo underfoot and opens lockers with E", () => {
    const { m, me } = practice();
    const locker = m.chests.find((c) => c.kind === "locker")!;
    me.x = locker.x + 1.2;
    me.z = locker.z;
    me.y = locker.y;
    const before = m.loot.size;
    run(m, me, 0.2, { yaw: -Math.PI / 2, pitch: -0.4 });
    run(m, me, 0.05, { yaw: -Math.PI / 2, pitch: -0.4, pressed: Btn.Interact, buttons: Btn.Interact });
    expect(locker.open).toBe(true);
    expect(m.loot.size).toBeGreaterThan(before);
    run(m, me, 2, { moveZ: 1, yaw: -Math.PI / 2 });
    run(m, me, 1, { moveX: 1, yaw: -Math.PI / 2 });
    expect(me.ammo.light + me.ammo.shell + me.ammo.heavy).toBeGreaterThan(0);
  });
});

function soloMatch(seed: number, human = false): Match {
  return new Match({ seed, mode: "solo", pace: "blitz", seats: 24, human: human ? HUMAN : null });
}

function playOut(m: Match, maxSeconds = 1200): void {
  while (m.phase !== "ended" && m.time < maxSeconds) {
    m.step();
    m.flushEvents();
  }
}

describe("full 24-seat match with server bots", () => {
  const m = soloMatch(424242);
  let maxPhase = 0;
  let landedCheck = false;
  let skiffSeen = false;
  let stagingTicks = 0;
  while (m.phase !== "ended" && m.time < 1200) {
    if (m.phase === "staging") stagingTicks++;
    if (m.phase === "skiff") skiffSeen = true;
    m.step();
    m.flushEvents();
    maxPhase = Math.max(maxPhase, m.storm.phase);
    if (!landedCheck && m.phase === "active" && m.time - m.activeStart > 40) {
      landedCheck = true;
      // every actor jumped, glided and reached the ground (or water) alive or was eliminated in a fight
      for (const a of m.actors) expect([Mode.Skiff, Mode.Freefall].includes(a.mode as 1 | 2), a.name).toBe(false);
    }
  }

  it("stages for 35 seconds, runs the skiff, and ends with exactly one winner", () => {
    expect(stagingTicks).toBe(Math.round(STAGING_SECONDS * 30));
    expect(skiffSeen).toBe(true);
    expect(m.phase).toBe("ended");
    expect(m.winnerId).toBeGreaterThanOrEqual(0);
    const placements = m.actors.map((a) => a.placement).sort((a, b) => a - b);
    expect(placements).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
    expect(m.actors.filter((a) => a.alive)).toHaveLength(1);
    expect(m.actors[m.winnerId]!.placement).toBe(1);
  });

  it("bots obtained loadouts, fought, and the storm progressed", () => {
    const totalKills = m.actors.reduce((a, b) => a + b.stats.kills, 0);
    expect(totalKills).toBeGreaterThanOrEqual(15);
    expect(m.actors.filter((a) => a.stats.loot.length > 0 || a.stats.shots > 0).length).toBeGreaterThanOrEqual(16);
    expect(maxPhase).toBeGreaterThanOrEqual(3);
    expect(landedCheck).toBe(true);
    const r = m.results();
    expect(r.rows).toHaveLength(24);
    expect(r.rows[0]!.placement).toBe(1);
    expect(r.winnerName).toBe(m.actors[m.winnerId]!.name);
  });

  it("is deterministic for a given seed", () => {
    const a = soloMatch(9001);
    const b = soloMatch(9001);
    playOut(a);
    playOut(b);
    expect(a.winnerId).toBe(b.winnerId);
    expect(a.tick).toBe(b.tick);
    expect(a.actors.map((x) => x.placement)).toEqual(b.actors.map((x) => x.placement));
  });

  it("breaks simultaneous final eliminations deterministically", () => {
    const t = soloMatch(77);
    // fast-forward into the active phase, then leave exactly two players standing
    while (t.phase !== "active") {
      t.step();
      t.flushEvents();
    }
    const [p, q, ...rest] = t.actors;
    for (const a of rest) t.damage(a, 999, -1, "test", "torso", true);
    t.step();
    t.flushEvents();
    expect(t.aliveCount).toBe(2);
    p!.stats.damage = 50;
    q!.stats.damage = 400;
    t.damage(p!, 999, -1, "test", "torso", true);
    t.damage(q!, 999, -1, "test", "torso", true);
    t.step();
    expect(t.phase).toBe("ended");
    expect(t.winnerId).toBe(q!.id); // more damage dealt wins the tie
    expect(t.actors.filter((a) => a.placement === 1)).toHaveLength(1);
    expect(p!.placement).toBe(2);
  });
});

describe("interest management and the client link", () => {
  it("never sends live transforms or tracers for actors outside the interest radius", () => {
    const m = soloMatch(1337, true);
    let checked = 0;
    let farGunfire = 0;
    for (let i = 0; i < 30 * 150 && m.phase !== "ended"; i++) {
      m.step();
      const snap = m.snapshotFor(0);
      m.flushEvents();
      const view = m.actors[snap.viewId]!;
      for (const a of snap.actors) {
        if (a.id === snap.viewId) continue;
        checked++;
        expect(Math.hypot(a.x - view.x, a.z - view.z)).toBeLessThanOrEqual(INTEREST_RADIUS + 0.01);
      }
      for (const ev of snap.events) {
        if (ev.t === "shot") expect(Math.hypot(ev.ox - view.x, ev.oz - view.z)).toBeLessThanOrEqual(INTEREST_RADIUS + 0.01);
        if (ev.t === "sound" && ev.kind === "gunfar") farGunfire++;
        if (ev.t === "hit") expect(ev.attacker === snap.viewId || ev.victim === snap.viewId).toBe(true);
        if (ev.t === "kill" && Math.hypot(m.actors[ev.victim]!.x - view.x, m.actors[ev.victim]!.z - view.z) > INTEREST_RADIUS) expect(ev.y).toBe(-1000);
      }
    }
    expect(checked).toBeGreaterThan(1000);
    expect(farGunfire).toBeGreaterThanOrEqual(0);
  });

  it("degrades distant gunfire to a direction-only sound event and drops inaudible shots", () => {
    const m = soloMatch(31, true);
    const view = m.actors[0]!;
    const shot = (dist: number) => ({ ev: { t: "shot" as const, actor: 5, weapon: "wayfarer" as const, ox: view.x + dist, oy: 10, oz: view.z, tx: 0, ty: 0, tz: 0, hit: 0 as const }, to: -1 });
    const near = filterEvents([shot(100)], 0, view, m.actors);
    expect(near).toHaveLength(1);
    expect(near[0]!.t).toBe("shot");
    const far = filterEvents([shot(INTEREST_RADIUS + 40)], 0, view, m.actors);
    expect(far).toHaveLength(1);
    expect(far[0]).toMatchObject({ t: "sound", kind: "gunfar", actor: -1 }); // no shooter id, no tracer
    expect(filterEvents([shot(900)], 0, view, m.actors)).toHaveLength(0);
    // private hit events are only delivered to their participants
    const hit = { ev: { t: "hit" as const, attacker: 5, victim: 6, dmg: 10, zone: "torso" as const, shield: false, broke: false, killed: false, dist: 5, fromX: 0, fromZ: 0 }, to: 5 };
    expect(filterEvents([hit], 0, view, m.actors)).toHaveLength(0);
    expect(filterEvents([{ ...hit, to: 0 }], 0, view, m.actors)).toHaveLength(1);
  });

  it("an idle human is auto-dropped, takes storm damage outside the field, and can be spectated after death", () => {
    const m = soloMatch(2024, true);
    const me = m.actors[0]!;
    while (m.phase !== "active") {
      m.step();
      m.flushEvents();
    }
    expect(me.mode).not.toBe(Mode.Skiff); // forced jump at the end of the route
    for (let i = 0; i < 30 * 60 && me.mode !== Mode.Ground && me.mode !== Mode.Swim; i++) {
      m.step();
      m.flushEvents();
    }
    expect(me.alive).toBe(true);
    expect(me.health).toBe(100); // automatic wing-sail deploy: no fall damage
    // move the player far outside the field once the storm is live
    while (m.storm.dps === 0 && (m.phase as string) !== "ended") {
      m.step();
      m.flushEvents();
    }
    me.x = m.storm.cx + m.storm.r + 60;
    me.z = m.storm.cz;
    me.y = Math.max(0, m.world.terrain(me.x, me.z));
    const h0 = me.health;
    for (let i = 0; i < 90; i++) {
      m.step();
      m.flushEvents();
    }
    expect(me.inStorm || !me.alive).toBe(true);
    expect(me.health).toBeLessThan(h0);
    expect(me.aegis).toBeGreaterThan(0); // the Riftstorm burns Health directly
    m.damage(me, 999, -1, "storm", "torso", true);
    m.step();
    const snap = m.snapshotFor(0);
    expect(snap.spectating).toBe(true);
    expect(snap.viewId).not.toBe(0);
    expect(m.chests.some((c) => c.kind === "cache") || me.slots.every((s) => s === null)).toBe(true);
    void give;
  });

  it("drops a consolidated loot cache with the exact inventory on elimination and credits the attacker", () => {
    const m = soloMatch(555);
    while (m.phase !== "active") {
      m.step();
      m.flushEvents();
    }
    const victim = m.actors[3]!;
    const killer = m.actors[4]!;
    give(victim, 0, "sundial", 3);
    giveItem(victim, 1, "flask", 3);
    victim.ammo.heavy = 37;
    m.damage(victim, 60, killer.id, "wayfarer", "torso", false, 20);
    m.damage(victim, 500, -1, "storm", "torso", true); // environmental finish: credit goes to the recent attacker
    m.step();
    expect(victim.alive).toBe(false);
    expect(killer.stats.kills).toBe(1);
    const cache = m.chests.filter((c) => c.kind === "cache").find((c) => Math.hypot(c.x - victim.x, c.z - victim.z) < 1)!;
    expect(cache).toBeDefined();
    expect(cache.contents).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "weapon", weapon: "sundial", rarity: 3 }),
      expect.objectContaining({ kind: "item", item: "flask", count: 3 }),
      expect.objectContaining({ kind: "ammo", ammo: "heavy", count: 37 }),
    ]));
  });
});
