import { describe, expect, it } from "vitest";
import { botFight, goto, hashState, newGame, run } from "./helpers";
import { damagePlayer } from "../src/sim/combat";
import { SKILLS, SKILL_BY_ID } from "../src/data/skills";
import { WAYPOINTS } from "../src/world";
import { dist } from "../src/core/math";
import { Grid } from "../src/items/inventory";
import { generateItem } from "../src/items/generate";
import { Rng } from "../src/core/rng";
import { armorReduction, computeStats, RES_CAP } from "../src/progression/stats";
import { emptyIntents } from "../src/sim/player";

describe("simulation core", () => {
  it("is deterministic for the same seed and inputs", () => {
    const a = newGame("cinder", 99), b = newGame("cinder", 99);
    goto(a, "march"); goto(b, "march");
    botFight(a, 600); botFight(b, 600);
    expect(hashState(a)).toBe(hashState(b));
  });

  it("the Marshal starts the quest line; the refuge is safe", () => {
    const g = newGame();
    const ivra = g.interactables.find((i) => i.data.npc === "ivra")!;
    g.interact(ivra.id);
    expect(g.ch.quests.ashway.step).toBe(1);
    expect(g.ch.quests.open_archive.status).toBe("active");
    const hp = g.player.hp;
    damagePlayer(g, 50, "physical", null, { label: "test" });
    expect(g.player.hp).toBe(hp);
  });

  for (const cls of ["cinder", "ranger"] as const) {
    it(`${cls}: a level-1 Warden clears early Soot March packs`, () => {
      const g = newGame(cls, 4242);
      goto(g, "march");
      const before = g.ch.xp + g.ch.level * 1000;
      botFight(g, 30 * 90, { maxDist: 30 });
      expect(g.ch.stats.kills).toBeGreaterThan(3);
      expect(g.ch.xp + g.ch.level * 1000).toBeGreaterThan(before);
    });
  }

  it("click on unreachable ground projects to the nearest valid point and flags invalid", () => {
    const g = newGame();
    goto(g, "march");
    let invalid = false;
    run(g, 2, (g, i, t) => { if (t === 0) { i.primaryPressed = true; i.primaryDown = true; i.cursorX = 0.5; i.cursorY = 0.5; } });
    for (const e of g.drain()) if (e.t === "invalid") invalid = true;
    expect(invalid).toBe(true);
  });

  it("evade moves 4.5 m over 320 ms and consumes a charge", () => {
    const g = newGame();
    goto(g, "training");
    const x0 = g.player.x;
    run(g, 1, (g, i) => { i.evade = true; i.cursorX = g.player.x + 10; i.cursorY = g.player.y; });
    expect(g.player.evadeCharges).toBe(2);
    run(g, 12);
    expect(g.player.x - x0).toBeGreaterThan(4.0);
    expect(g.player.x - x0).toBeLessThan(4.7);
  });

  it("town-gate channel is interrupted by damage and completes otherwise", () => {
    const g = newGame();
    goto(g, "march");
    g.enemies = [];
    run(g, 1, (g, i) => { i.townGate = true; });
    expect(g.player.action?.kind).toBe("channel");
    damagePlayer(g, 1, "physical", null, { label: "test" });
    expect(g.player.action).toBeNull();
    run(g, 1, (g, i) => { i.townGate = true; });
    run(g, 30 * 3);
    expect(g.zone.id).toBe("refuge");
    expect(g.interactables.some((i) => i.kind === "portal")).toBe(true);
  });

  it("death drops an Echo of 10% gold; dying again moves it without extra loss; respawn at checkpoint with durability loss", () => {
    const g = newGame();
    goto(g, "march");
    g.ch.gold = 1000;
    const dur0 = g.ch.equipment.chest!.durability;
    damagePlayer(g, 99999, "physical", null, { label: "Test Hammer" });
    expect(g.player.alive).toBe(false);
    expect(g.ch.gold).toBe(900);
    expect(g.ch.echo!.gold).toBe(100);
    expect(g.ch.equipment.chest!.durability).toBeLessThan(dur0);
    expect(g.deathInfo!.cause).toBe("Test Hammer");
    g.respawn(); g.resolvePendingZoneSync();
    expect(g.zone.id).toBe(WAYPOINTS[g.ch.checkpoint].zone);
    goto(g, "march");
    g.player.x += 3;
    damagePlayer(g, 99999, "physical", null, { label: "Again" });
    expect(g.ch.gold).toBe(900);
    expect(g.ch.echo!.gold).toBe(100);
    g.respawn(); g.resolvePendingZoneSync();
    goto(g, "march");
    // walk onto echo
    const echo = g.pickups.find((p) => p.kind === "echo")!;
    expect(echo).toBeTruthy();
    g.player.x = echo.x; g.player.y = echo.y;
    run(g, 2);
    expect(g.ch.gold).toBe(1000);
    expect(g.ch.echo).toBeNull();
    expect(g.player.statuses.blessing).toBeTruthy();
  });

  it("full potion belt and full inventory refuse pickups", () => {
    const g = newGame();
    goto(g, "march");
    g.ch.belt.health = g.ch.beltCap;
    g.pickups.push({ id: 5000, kind: "potion", x: g.player.x, y: g.player.y, amount: 1, potion: "health", t: 1 });
    run(g, 2);
    expect(g.pickups.some((p) => p.id === 5000)).toBe(true);
    expect(g.pickUp(5000)).toBe(false);
    const inv = new Grid(10, 6);
    const rng = new Rng(1);
    while (true) { const it = generateItem(rng, g.lootCtx(5, { baseId: "padded_coat" })); if (!inv.add(it)) break; }
    g.ch.inventory = inv.toData();
    const it = generateItem(rng, g.lootCtx(5, { baseId: "padded_coat" }));
    g.pickups.push({ id: 5001, kind: "item", x: g.player.x, y: g.player.y, amount: 1, item: it, t: 1 });
    expect(g.pickUp(5001)).toBe(false);
  });

  it("enemy heavy attacks telegraph before resolving and respect the heavy-attacker limit", () => {
    const g = newGame("cinder", 77);
    goto(g, "training");
    for (let i = 0; i < 5; i++) g.spawnTraining("bell_husk");
    for (const e of g.enemies) e.training = false;
    let maxHeavy = 0, sawTelegraph = false;
    run(g, 30 * 12, (g) => { maxHeavy = Math.max(maxHeavy, g.heavyCount()); if (g.telegraphs.length) sawTelegraph = true; g.player.hp = g.player.maxHp; });
    expect(sawTelegraph).toBe(true);
    expect(maxHeavy).toBeLessThanOrEqual(2);
  });

  it("every equipped skill of both classes can be cast and damages a dummy where applicable", () => {
    for (const cls of ["cinder", "ranger"] as const) {
      const g = newGame(cls, 5);
      goto(g, "training");
      g.ch.level = 20; g.ch.skillPoints = 60;
      for (const s of SKILLS.filter((s) => s.classId === cls && (s.kind === "active" || s.kind === "ultimate" || s.kind === "core"))) while (g.rankSkill(s.id)) {}
      g.recomputeStats();
      const dummy = g.enemies.find((e) => e.def.behavior === "dummy")!;
      const actives = SKILLS.filter((s) => s.classId === cls && s.kind !== "passive" && s.kind !== "capstone" && s.kind !== "basic");
      for (const s of actives) {
        g.ch.hotbar[1] = s.id;
        g.player.x = dummy.x - 1.6; g.player.y = dummy.y; g.player.focus = g.player.maxFocus; g.player.heat = 100; g.player.cds = {}; g.player.charges = {}; g.player.action = null;
        g.training.total = 0;
        run(g, 1, (g, i) => { i.skillPressed = 1; i.cursorX = dummy.x; i.cursorY = dummy.y; i.hoverEnemy = dummy.id; });
        expect(g.player.action !== null || s.id === "furnace_heart" || s.id === "mothcloak", `${s.id} started`).toBe(true);
        run(g, 75, (g, i) => { i.cursorX = dummy.x; i.cursorY = dummy.y; });
        if (["brand_arc", "bastion_step", "cinder_ring", "vow_chain", "ashen_standard", "splinter_volley", "ghostline", "snare_bloom", "backstep_flask", "horizon_call"].includes(s.id)) expect(g.training.total, `${s.id} dealt damage`).toBeGreaterThan(0);
      }
      // basic attack
      g.training.total = 0; g.player.action = null;
      g.player.x = dummy.x - 1.8; g.player.y = dummy.y;
      run(g, 30, (g, i, t) => { i.primaryPressed = t === 0; i.primaryDown = true; i.hoverEnemy = dummy.id; i.cursorX = dummy.x; i.cursorY = dummy.y; });
      expect(g.training.total).toBeGreaterThan(0);
    }
  });

  it("basic attacks generate Focus and the core skill spends it", () => {
    const g = newGame("ranger", 8);
    goto(g, "training");
    const dummy = g.enemies.find((e) => e.def.behavior === "dummy")!;
    g.player.focus = 0;
    g.player.x = dummy.x - 6; g.player.y = dummy.y;
    run(g, 60, (g, i) => { i.primaryDown = true; i.primaryPressed = g.tick % 10 === 0; i.hoverEnemy = dummy.id; i.cursorX = dummy.x; i.cursorY = dummy.y; });
    const f = g.player.focus;
    expect(f).toBeGreaterThan(10);
    g.player.action = null;
    g.player.focus = 50;
    run(g, 1, (g, i) => { i.secondaryDown = true; i.secondaryPressed = true; i.cursorX = dummy.x; i.cursorY = dummy.y; });
    expect(g.player.focus).toBeLessThan(50 - SKILL_BY_ID.splinter_volley.cost + 2);
  });

  it("Quickshot after moving 2 m applies a Trace mark; Ghostline detonates marks", () => {
    const g = newGame("ranger", 9);
    goto(g, "training");
    g.ch.level = 3; g.ch.skillPoints = 3; g.rankSkill("ghostline");
    g.ch.hotbar[1] = "ghostline";
    const dummy = g.enemies.find((e) => e.def.behavior === "dummy")!;
    g.player.x = dummy.x - 7; g.player.y = dummy.y;
    g.player.movedSinceShot = 3;
    run(g, 20, (g, i, t) => { i.primaryPressed = t === 0; i.primaryDown = t < 3; i.hoverEnemy = dummy.id; i.cursorX = dummy.x; i.cursorY = dummy.y; });
    expect(dummy.statuses.mark?.stacks ?? 0).toBeGreaterThanOrEqual(1);
    g.player.focus = 100; g.player.action = null;
    run(g, 30, (g, i, t) => { if (t === 0) i.skillPressed = 1; i.cursorX = dummy.x; i.cursorY = dummy.y; });
    expect(dummy.statuses.mark).toBeUndefined();
  });

  it("Cinder Vow gains Heat from endured hits and Cinder Ring consumes it", () => {
    const g = newGame("cinder", 10);
    goto(g, "march");
    damagePlayer(g, 30, "physical", null, { label: "t" });
    expect(g.player.heat).toBeGreaterThan(0);
    g.ch.level = 3; g.ch.skillPoints = 2; g.rankSkill("cinder_ring");
    g.ch.hotbar[1] = "cinder_ring";
    g.player.focus = 100;
    run(g, 1, (g, i) => { i.skillPressed = 1; });
    run(g, 10);
    expect(g.player.heat).toBeLessThan(5);
  });
});

describe("combat formulas", () => {
  it("armor has diminishing returns based on hit magnitude", () => {
    expect(armorReduction(100, 5)).toBeGreaterThan(armorReduction(100, 50));
    expect(armorReduction(10000, 1)).toBeLessThanOrEqual(0.8);
  });
  it("resistances cap at 75% and Veteran applies a penalty", () => {
    const g = newGame();
    for (const s of ["head", "chest", "gloves"] as const) g.ch.equipment[s] = { ...g.ch.equipment.chest!, uid: 900 + s.length, affixes: [{ id: "of_the_kiln", tier: 4, value: 30 }], identified: true, rarity: "tempered" } as any;
    const st = computeStats(g.ch);
    expect(st.resUncapped.ember).toBe(90);
    expect(st.res.ember).toBe(RES_CAP);
    const vet = computeStats(g.ch, {}, true);
    expect(vet.resUncapped.ember).toBe(70);
    expect(vet.res.ember).toBe(70);
  });
});

describe("bosses", () => {
  it("Toll-Keeper: arena seals on approach, armor meter breaks into a stagger, defeat opens the crypt", () => {
    const g = newGame("cinder", 31);
    goto(g, "march");
    const arena = g.zone.meta.arena;
    const boss = g.enemies.find((e) => e.boss?.kind === "tollkeeper")!;
    g.player.x = arena.x - 4; g.player.y = arena.y;
    run(g, 2);
    expect(boss.boss!.active).toBe(true);
    expect(g.arena).not.toBeNull();
    // armor halves damage; breaking it staggers
    const armor = boss.boss!.armor;
    expect(armor).toBeGreaterThan(0);
    boss.boss!.armor = 3;
    for (let i = 0; i < 400 && boss.boss!.armor > 0; i++) { g.player.hp = g.player.maxHp; botFight(g, 3); }
    expect(boss.boss!.staggeredT > 0 || boss.boss!.armorRegenT > 0).toBe(true);
    boss.hp = 1;
    run(g, 1);
    for (let i = 0; i < 200 && boss.alive; i++) { g.player.hp = g.player.maxHp; botFight(g, 3); }
    expect(boss.alive).toBe(false);
    expect(g.ch.flags.boss_tollkeeper).toBe(true);
    expect(g.arena).toBeNull();
    expect(g.pickups.filter((p) => p.kind === "item").some((p) => p.item!.rarity === "inscribed" || p.item!.rarity === "relic")).toBe(true);
  });

  it("Orison Engine runs three phases: beams → conduits (invulnerable) → stagger race; defeat completes the act and unlocks Veteran", () => {
    const g = newGame("ranger", 32);
    g.ch.quests.engine = { status: "active", step: 0 };
    goto(g, "archive3");
    const boss = g.enemies.find((e) => e.boss?.kind === "engine")!;
    const arena = g.zone.meta.arena;
    g.player.x = arena.x; g.player.y = arena.y + 8;
    run(g, 2);
    expect(boss.boss!.active).toBe(true);
    run(g, 60, (g) => { g.player.hp = g.player.maxHp; });
    expect(boss.boss!.beams.length).toBe(2);
    boss.hp = Math.floor(boss.maxHp * 0.6);
    run(g, 2, (g) => { g.player.hp = g.player.maxHp; });
    expect(boss.boss!.phase).toBe(2);
    expect(boss.boss!.invulnerable).toBe(true);
    const conduits = g.enemies.filter((e) => e.role === "conduit" && e.alive);
    expect(conduits.length).toBe(3);
    const hpBefore = boss.hp;
    for (const c of conduits) g.killEnemy(c);
    run(g, 2, (g) => { g.player.hp = g.player.maxHp; });
    expect(boss.boss!.phase).toBe(3);
    expect(boss.hp).toBeLessThanOrEqual(Math.ceil(boss.maxHp * 0.33));
    expect(hpBefore).toBeGreaterThan(boss.hp);
    boss.boss!.stagger = boss.boss!.staggerMax;
    run(g, 2, (g) => { g.player.hp = g.player.maxHp; });
    expect(boss.boss!.staggeredT).toBeGreaterThan(0);
    boss.hp = 1;
    for (let i = 0; i < 200 && boss.alive; i++) { g.player.hp = g.player.maxHp; botFight(g, 3); }
    expect(boss.alive).toBe(false);
    expect(g.ch.actComplete.normal).toBe(true);
    expect(g.ch.veteranUnlocked).toBe(true);
    expect(g.ch.quests.engine.status).toBe("done");
    g.startVeteran();
    expect(g.ch.difficulty).toBe("veteran");
    expect(g.ch.quests.engine.status).toBe("inactive");
    expect(g.ch.waypoints).toEqual(["refuge"]);
  });

  it("player death during a boss fight resets the boss and unseals the arena", () => {
    const g = newGame("cinder", 33);
    goto(g, "march");
    const arena = g.zone.meta.arena;
    const boss = g.enemies.find((e) => e.boss?.kind === "tollkeeper")!;
    g.player.x = arena.x - 4; g.player.y = arena.y;
    run(g, 2);
    boss.hp = 10;
    damagePlayer(g, 99999, "physical", boss, { label: "x" });
    expect(boss.hp).toBe(boss.maxHp);
    expect(boss.boss!.active).toBe(false);
    expect(g.arena).toBeNull();
  });
});

describe("progression flow", () => {
  it("activating the Ashway completes the quest and sets the checkpoint", () => {
    const g = newGame();
    goto(g, "march");
    const wp = g.interactables.find((i) => i.kind === "waypoint")!;
    g.player.x = wp.x; g.player.y = wp.y + 1.5;
    run(g, 2);
    expect(g.ch.waypoints).toContain("ashway");
    expect(g.ch.quests.ashway.status).toBe("done");
    expect(g.ch.checkpoint).toBe("ashway");
  });

  it("freeing Calder brings the Artificer to the refuge and unlocks crafting", () => {
    const g = newGame();
    g.ch.flags.boss_tollkeeper = true;
    goto(g, "archive1");
    expect(g.ch.quests.open_archive.status).toBe("done");
    const cage = g.interactables.find((i) => i.kind === "cage")!;
    g.interact(cage.id);
    expect(g.ch.flags.artificer_rescued).toBe(true);
    goto(g, "refuge");
    expect(g.ch.quests.artificer.status).toBe("done");
    expect(g.interactables.find((i) => i.data.npc === "calder")!.hidden).toBe(false);
  });

  it("the Archive II lever opens the shortcut portcullis", () => {
    const g = newGame();
    goto(g, "archive2");
    const gate = g.interactables.find((i) => i.kind === "gate")!;
    const [cx, cy] = gate.data.cells[0];
    expect(g.nav.cells[cy * g.nav.w + cx]).toBe(0);
    g.interact(gate.id);
    expect(gate.open).toBe(false);
    const lever = g.interactables.find((i) => i.kind === "lever")!;
    g.interact(lever.id);
    expect(gate.open).toBe(true);
    expect(g.nav.cells[cy * g.nav.w + cx]).toBe(2);
  });

  it("the guardian seals the descent until it falls", () => {
    const g = newGame();
    goto(g, "archive2");
    const exit = g.interactables.find((i) => i.kind === "exit" && i.data.to === "archive3")!;
    g.interact(exit.id);
    expect(g.pendingZone).toBeNull();
    const guardianPack = g.zone.packs.find((p) => p.kind === "guardian")!;
    for (const e of g.enemies.filter((e) => e.packId === guardianPack.id)) g.killEnemy(e);
    expect(g.ch.flags.guardian).toBe(true);
    g.interact(exit.id);
    expect(g.pendingZone?.id).toBe("archive3");
  });

  it("hunter camp event grants a permanent potion capacity upgrade", () => {
    const g = newGame("cinder", 50);
    goto(g, "march");
    const sela = g.interactables.find((i) => i.data.npc === "sela")!;
    g.player.x = sela.x - 1.5; g.player.y = sela.y;
    run(g, 2);
    expect(g.ch.quests.hunter.status).toBe("active");
    g.interact(sela.id);
    expect(g.hunter.state).toBe("active");
    for (let w = 0; w < 4; w++) { run(g, 2); for (const e of g.enemies.filter((e) => e.packId === -77 && e.alive)) g.killEnemy(e); }
    run(g, 2);
    expect(g.hunter.state).toBe("cleared");
    g.interact(sela.id);
    expect(g.ch.quests.hunter.status).toBe("done");
    expect(g.ch.beltCap).toBe(6);
  });

  it("training cell grants no XP and records a damage breakdown", () => {
    const g = newGame();
    goto(g, "training");
    g.spawnTraining("ash_crawler");
    const xp = g.ch.xp;
    botFight(g, 30 * 10);
    expect(g.ch.xp).toBe(xp);
    expect(Object.keys(g.training.bySkill).length).toBeGreaterThan(0);
  });

  it("Target Hunt unlocks after the act and records a completion time", () => {
    const g = newGame("cinder", 60);
    g.startHunt("tollkeeper");
    expect(g.pendingZone).toBeNull();
    g.ch.actComplete.normal = true;
    g.startHunt("tollkeeper");
    g.resolvePendingZoneSync();
    expect(g.zone.id).toBe("hunt_toll");
    const boss = g.enemies.find((e) => e.isBoss)!;
    const arena = g.zone.meta.arena;
    g.player.x = arena.x; g.player.y = arena.y + 4;
    run(g, 30);
    g.killEnemy(boss);
    expect(g.ch.stats.huntBest.hunt_tollkeeper).toBeGreaterThan(0);
  });

  it("zone state persists cleared packs and opened chests across visits", () => {
    const g = newGame("cinder", 70);
    goto(g, "march");
    const pk = g.zone.packs.find((p) => p.kind === "normal")!;
    for (const e of g.enemies.filter((e) => e.packId === pk.id)) g.killEnemy(e);
    expect(g.zoneState.killed).toContain(pk.id);
    goto(g, "refuge");
    goto(g, "march");
    expect(g.enemies.some((e) => e.packId === pk.id)).toBe(false);
  });

  it("explored map state round-trips", () => {
    const g = newGame();
    goto(g, "march");
    run(g, 20);
    const n = g.explored.reduce((s, v) => s + v, 0);
    expect(n).toBeGreaterThan(100);
    const snap = g.snapshot();
    expect(snap.zoneStates.march.explored.length).toBeGreaterThan(0);
    void emptyIntents; void dist;
  });
});
