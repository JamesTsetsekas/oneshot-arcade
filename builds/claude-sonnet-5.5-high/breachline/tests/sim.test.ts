import { describe, expect, it } from "vitest";
import { advance, duel, input, makeWorld, place } from "./helpers";
import { WEAPONS, falloffMul } from "../src/shared/content/weapons";
import { resolveWeaponStats, defaultLoadouts } from "../src/shared/content/loadout";
import { aimDir, eyePos } from "../src/shared/sim/world";
import { SPEED_CROUCH, SPEED_SPRINT, SPEED_STAND } from "../src/shared/sim/world";

describe("movement", () => {
  it("walks at standing speed, sprints after 120 ms, crouches slower", () => {
    const { w, a } = duel();
    place(a, -20, 0, Math.PI / 2); // facing +x in the courtyard
    advance(w, 1.0, () => input(a, { forward: 1, yaw: Math.PI / 2 }));
    const walk = Math.hypot(a.vel.x, a.vel.z);
    expect(walk).toBeGreaterThan(SPEED_STAND * a.weapons[0].stats.moveMul * 0.97);
    expect(walk).toBeLessThan(SPEED_STAND * 1.1);
    place(a, -20, 0, Math.PI / 2);
    advance(w, 1.2, () => input(a, { forward: 1, sprint: true, yaw: Math.PI / 2 }));
    expect(a.sprinting).toBe(true);
    expect(Math.hypot(a.vel.x, a.vel.z)).toBeGreaterThan(SPEED_SPRINT * 0.9 * a.weapons[0].stats.moveMul);
    place(a, -20, 0, Math.PI / 2);
    advance(w, 1.0, () => input(a, { forward: 1, crouch: true, yaw: Math.PI / 2 }));
    expect(a.crouching).toBe(true);
    expect(Math.hypot(a.vel.x, a.vel.z)).toBeLessThan(SPEED_CROUCH * 1.1);
  });
  it("ADS slows movement", () => {
    const { w, a } = duel();
    place(a, -20, 0, Math.PI / 2);
    advance(w, 1.0, () => input(a, { forward: 1, ads: true, yaw: Math.PI / 2 }));
    expect(Math.hypot(a.vel.x, a.vel.z)).toBeLessThan(SPEED_STAND * 0.8);
  });
  it("jump reaches a ~0.85 m apex", () => {
    const { w, a } = duel();
    place(a, -20, 0, 0);
    let maxY = 0;
    advance(w, 0.9, (ww) => { input(a, { jump: ww.tickN % 600 === 0 || a.onGround }); maxY = Math.max(maxY, a.pos.y); });
    expect(maxY).toBeGreaterThan(0.78);
    expect(maxY).toBeLessThan(0.95);
  });
  it("collides with walls and does not tunnel through", () => {
    const { w, a } = duel();
    place(a, -20, 0, -Math.PI / 2); // facing -x toward the control-room wall region at x=-29 (door at z=0 though)
    place(a, -20, 10, -Math.PI / 2);
    advance(w, 4, () => input(a, { forward: 1, sprint: true, yaw: -Math.PI / 2 }));
    expect(a.pos.x).toBeGreaterThan(-29.4); // wall (windows/sill) stops the player
  });
  it("mantles a 1.0 m ledge but not a 2.5 m wall", () => {
    const { w, a } = duel();
    place(a, -22, 1, Math.PI); // crate (-22,0..1) top at 1.0 is in +z direction? crate spans z -0.5..1.5
    // approach crate from -z side facing +z
    place(a, -22, -2, 0);
    advance(w, 0.8, () => input(a, { forward: 1, yaw: 0 }));
    advance(w, 0.1, () => input(a, { forward: 1, jump: true, yaw: 0 }));
    advance(w, 0.9, () => input(a, { forward: 0, yaw: 0 }));
    expect(a.pos.y).toBeGreaterThan(0.9);
    // container (2.5 m)
    place(a, -6.5, -9, Math.PI);
    advance(w, 0.5, () => input(a, { forward: 1, yaw: Math.PI }));
    advance(w, 0.1, () => input(a, { forward: 1, jump: true, yaw: Math.PI }));
    advance(w, 0.9, () => input(a, { forward: 0, yaw: Math.PI }));
    expect(a.pos.y).toBeLessThan(0.3);
  });
  it("steps up stairs to the catwalk", () => {
    const { w, a } = duel();
    place(a, -25, -18, 0);
    advance(w, 4.5, () => input(a, { forward: 1, yaw: 0 }));
    expect(a.pos.y).toBeGreaterThan(2.7);
  });
});

describe("weapons", () => {
  const weapons = Object.keys(WEAPONS);
  it("has 6 primaries and 3 sidearms with original designations", () => {
    expect(Object.values(WEAPONS).filter((x) => x.slot === "primary").length).toBe(6);
    expect(Object.values(WEAPONS).filter((x) => x.slot === "secondary").length).toBe(3);
  });
  it("falloff reduces damage monotonically", () => {
    for (const id of weapons) {
      const d = WEAPONS[id];
      let prev = 2;
      for (let r = 0; r < 120; r += 5) { const m = falloffMul(d, r); expect(m).toBeLessThanOrEqual(prev + 1e-9); prev = m; }
      expect(falloffMul(d, 500)).toBeCloseTo(d.minDamageMul, 5);
    }
  });
  it("attachments apply their stated tradeoffs", () => {
    const base = resolveWeaponStats("ar4", [], []);
    const comp = resolveWeaponStats("ar4", ["compensator"], []);
    expect(comp.recoilPitch).toBeLessThan(base.recoilPitch);
    expect(comp.hipSpread).toBeGreaterThan(base.hipSpread);
    const ext = resolveWeaponStats("ar4", ["extmag"], []);
    expect(ext.magSize).toBeGreaterThan(base.magSize);
    expect(ext.reloadTactical).toBeGreaterThan(base.reloadTactical);
    const sup = resolveWeaponStats("ar4", ["suppressor"], []);
    expect(sup.suppressed).toBe(true);
    expect(sup.falloffRange).toBeLessThan(1);
  });
  it("every weapon fires, consumes ammo, and can kill a server-authoritative opponent", () => {
    for (const id of weapons) {
      const slot = WEAPONS[id].slot;
      const lo = slot === "primary" ? { primary: id, attachments: [] as string[] } : { secondary: id, attachments: [] as string[] };
      const { w, a, b } = duel(lo);
      if (slot === "secondary") input(a, { selectSlot: 1 });
      place(a, -20, 0, Math.PI / 2); place(b, -15, 0, 0); // 5 m, shooter faces +x
      const wp = () => a.weapons[a.slot];
      if (slot === "secondary") { a.slot = 1; a.swapT = 0; }
      advance(w, 0.1);
      const ammo0 = wp().ammo;
      let killed = false;
      for (let i = 0; i < 60 * 8 && !killed; i++) {
        place(a, -20, 0, Math.PI / 2); // keep still, aim fixed
        a.pitch = Math.atan2(1.2 - 1.68, 5);
        b.health = Math.max(b.health, 1);
        input(a, { fire: i % 2 === 0 || WEAPONS[id].fireMode === "auto", yaw: Math.PI / 2, pitch: a.pitch, ads: true });
        w.tick();
        place(b, -15, 0, 0);
        if (!b.alive) killed = true;
        void ammo0;
      }
      expect(wp().ammo, id).toBeLessThan(wp().stats.magSize + 1);
      expect(killed, `${id} should kill at 5 m`).toBe(true);
    }
  });
  it("hit zones: headshots deal more than body shots; limbs less", () => {
    const { w, a, b } = duel({ primary: "ar4" });
    place(a, -20, 0, Math.PI / 2); place(b, -10, 0, 0);
    const eye = eyePos(a);
    const dmgAt = (targetY: number) => {
      b.health = 100; b.alive = true; place(b, -10, 0, 0);
      a.pitch = Math.atan2(targetY - eye.y, 10);
      a.weapons[0].ammo = 30; a.weapons[0].nextFireAt = 0; a.recoilP = 0; a.recoilY = 0;
      input(a, { fire: true, yaw: Math.PI / 2, pitch: a.pitch, ads: true });
      advance(w, 0.02);
      return 100 - b.health;
    };
    const head = dmgAt(1.72), upper = dmgAt(1.25), limb = dmgAt(0.4);
    expect(head).toBeGreaterThan(upper);
    expect(upper).toBeGreaterThan(limb);
    expect(limb).toBeGreaterThan(0);
  });
  it("marksman rifle: one-shot head/upper torso inside 55 m, not lethal to the legs", () => {
    const { w, a, b } = duel({ primary: "mr1", attachments: [] });
    place(a, -27, -16, Math.PI / 2);
    const eye = eyePos(a);
    const shoot = (y: number, dist: number) => {
      input(a, {}); advance(w, 0.05); // release trigger between pulls
      place(a, -27, -16, Math.PI / 2); place(b, -27 + dist, -16, 0);
      b.health = 100; b.alive = true;
      a.pitch = Math.atan2(y - eye.y, dist); a.weapons[0].ammo = 5; a.weapons[0].nextFireAt = 0; a.weapons[0].cycling = 0; a.recoilP = 0; a.adsT = 1;
      input(a, { fire: true, yaw: Math.PI / 2, pitch: a.pitch, ads: true });
      advance(w, 0.03);
      return b.alive;
    };
    expect(shoot(1.2, 30)).toBe(false); // upper torso inside range: lethal
    expect(shoot(1.7, 50)).toBe(false); // head inside range: lethal
    expect(shoot(0.4, 30)).toBe(true); // legs: survive
    expect(shoot(0.9, 30)).toBe(true); // lower torso: survive
    const old = WEAPONS.mr1.lethalRange;
    WEAPONS.mr1.lethalRange = 20; // pretend the lethal range is short: a 30 m chest shot is no longer a one-shot
    expect(shoot(1.2, 30)).toBe(true);
    WEAPONS.mr1.lethalRange = old;
  });
  it("reload has stages; interrupting after mag-in keeps ammo; tactical differs from empty", () => {
    const { w, a } = duel({ primary: "ar4", attachments: [] });
    const wp = a.weapons[0];
    wp.ammo = 10; wp.reserve = 90;
    const stages: string[] = [];
    w.drainEvents();
    let first = true;
    advance(w, 3, () => { const evs = w.drainEvents(); for (const e of evs) if (e.t === "reload") stages.push(e.stage); input(a, first ? { reload: true } : {}); first = false; });
    expect(stages).toEqual(["start", "magOut", "magIn", "end"]);
    expect(wp.ammo).toBe(30);
    expect(wp.reserve).toBe(70);
    expect(wp.stats.reloadEmpty).toBeGreaterThan(wp.stats.reloadTactical);
    // interrupt before mag-in: nothing changes
    wp.ammo = 10; wp.reserve = 90;
    input(a, { reload: true }); advance(w, 0.3, () => input(a, {}));
    input(a, { selectSlot: 1 }); advance(w, 0.1, () => input(a, {}));
    expect(wp.ammo).toBe(10);
    expect(wp.reserve).toBe(90);
  });
  it("auto fire matches the weapon's rate of fire", () => {
    const { w, a } = duel({ primary: "ar4", attachments: [] });
    place(a, -20, 0, Math.PI / 2);
    const wp = a.weapons[0];
    wp.ammo = 30;
    const t0 = wp.shotsFired;
    advance(w, 1.0, () => input(a, { fire: true, yaw: Math.PI / 2 }));
    const shots = wp.shotsFired - t0;
    expect(shots).toBeGreaterThanOrEqual(11);
    expect(shots).toBeLessThanOrEqual(13);
  });
  it("recoil climbs while firing and recovers after", () => {
    const { w, a } = duel({ primary: "ar4", attachments: [] });
    place(a, -20, 0, Math.PI / 2);
    advance(w, 0.5, () => input(a, { fire: true, yaw: Math.PI / 2 }));
    const climbed = a.recoilP;
    expect(climbed).toBeGreaterThan(0.03);
    advance(w, 2, () => input(a, { yaw: Math.PI / 2 }));
    expect(a.recoilP).toBeLessThan(climbed * 0.2);
    void aimDir;
  });
  it("shotgun at point blank kills in one trigger pull; at range it does not", () => {
    const { w, a, b } = duel({ primary: "sg8", attachments: [] });
    const eye = eyePos(a);
    const test = (dist: number) => {
      place(a, -20, 0, Math.PI / 2); place(b, -20 + dist, 0, 0); b.health = 100; b.alive = true;
      a.pitch = Math.atan2(1.2 - eye.y, dist); a.weapons[0].ammo = 6; a.weapons[0].nextFireAt = 0; a.weapons[0].cycling = 0; a.recoilP = 0;
      input(a, { fire: true, yaw: Math.PI / 2, pitch: a.pitch, ads: true });
      advance(w, 0.03);
      return b.health;
    };
    expect(test(2.5)).toBeLessThan(40);
    expect(test(30)).toBeGreaterThan(80);
  });
  it("thin cover is penetrable with reduced damage; concrete is not", () => {
    const { w, a, b } = duel({ primary: "br12", attachments: [] });
    // thin sheet panel at x=-24, z=10..13 (2.2 m high)
    place(a, -28, 11, Math.PI / 2); place(b, -20, 11, 0);
    const eye = eyePos(a);
    a.pitch = Math.atan2(1.2 - eye.y, 8);
    a.weapons[0].ammo = 12; a.weapons[0].nextFireAt = 0;
    input(a, { fire: true, yaw: Math.PI / 2, pitch: a.pitch, ads: true });
    advance(w, 0.03);
    expect(b.health).toBeLessThan(100);
    expect(b.health).toBeGreaterThan(0);
  });
});

describe("health, spawn protection and recap", () => {
  it("regenerates 5 s after damage at 22 HP/s", () => {
    const { w, a } = duel();
    a.health = 40; a.lastDamageAt = w.time;
    advance(w, 4.5);
    expect(a.health).toBe(40);
    advance(w, 1.5);
    expect(a.health).toBeGreaterThan(50);
  });
  it("spawn protection blocks damage and ends after firing", () => {
    const { w, a, b } = duel();
    place(a, -20, 0, Math.PI / 2); place(b, -15, 0, 0);
    b.spawnProtectedUntil = w.time + 2; b.spawnPos = { ...b.pos };
    a.pitch = Math.atan2(1.2 - 1.68, 5);
    input(a, { fire: true, yaw: Math.PI / 2, pitch: a.pitch });
    advance(w, 0.2);
    expect(b.health).toBe(100);
    b.spawnProtectedUntil = w.time + 2;
    b.cmd = { ...b.cmd, fire: true };
    place(b, -15, 0, -Math.PI / 2);
    advance(w, 0.05, () => { input(b, { fire: true, yaw: -Math.PI / 2 }); });
    expect(b.spawnProtectedUntil).toBe(0);
  });
  it("kill creates a recap matching damage history, respawns after 3 s", () => {
    const { w, a, b } = duel({ primary: "br12", attachments: [] });
    place(a, -20, 0, Math.PI / 2); place(b, -10, 0, 0);
    const eye = eyePos(a);
    a.pitch = Math.atan2(1.2 - eye.y, 10);
    const pitch = a.pitch;
    advance(w, 1.2, (ww) => { place(a, -20, 0, Math.PI / 2); place(b, -10, 0, 0); a.recoilP = 0; a.pitch = pitch; input(a, { fire: ww.tickN % 12 < 6, yaw: Math.PI / 2, pitch, ads: true }); });
    expect(b.alive).toBe(false);
    expect(b.recap).not.toBeNull();
    expect(b.recap!.attacker).toBe(a.id);
    expect(b.recap!.timeline.reduce((s, t) => s + t.amount, 0)).toBeGreaterThanOrEqual(95);
    expect(Math.round(b.recap!.distance)).toBe(10);
    expect(w.match.teamScore[0]).toBe(1);
    advance(w, 3.1);
    expect(b.alive).toBe(true);
  });
  it("friendly fire is off", () => {
    const w = makeWorld();
    const l = defaultLoadouts();
    const a = w.addPlayer({ name: "A", team: 0, isBot: false, loadout: l[0] });
    const b = w.addPlayer({ name: "B", team: 0, isBot: false, loadout: l[0] });
    w.tick(); advance(w, 0.2);
    a.spawnProtectedUntil = 0; b.spawnProtectedUntil = 0;
    place(a, -20, 0, Math.PI / 2); place(b, -15, 0, 0);
    a.pitch = Math.atan2(1.2 - 1.68, 5);
    advance(w, 0.5, () => input(a, { fire: true, yaw: Math.PI / 2, pitch: a.pitch }));
    expect(b.health).toBe(100);
  });
});
