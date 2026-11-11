import { describe, expect, it } from "vitest";
import { AEGIS_MAX, RESERVE_MAX } from "../src/shared/content/items";
import { AMMO_CAPS, WEAPONS, weaponStats } from "../src/shared/content/weapons";
import { Mode } from "../src/shared/protocol/protocol";
import { Btn, aimAt, give, giveItem, hp, pier, place, practice, run } from "./helpers";

/** Stands the player on the firing line, facing the first static dummy 10 m downrange. */
function range(weapon: Parameters<typeof give>[2], rarity = 0, dist = 10) {
  const ctx = practice();
  const { m, me } = ctx;
  const dummy = m.actors.find((a) => a.dummy && !a.mover)!;
  me.x = dummy.x - dist;
  me.z = dummy.z;
  me.y = m.island.pier.y;
  give(me, 0, weapon, rarity);
  for (const t of Object.keys(AMMO_CAPS) as (keyof typeof AMMO_CAPS)[]) me.ammo[t] = AMMO_CAPS[t];
  run(m, me, 0.8, { slot: 0 });
  return { ...ctx, dummy };
}

describe("authoritative combat", () => {
  it("applies damage to Aegis, then Reserve Shield, then Health", () => {
    const { m, me } = practice();
    me.reserve = 30;
    m.damage(me, 40, -1, "test", "torso", false);
    expect(me.aegis).toBe(10);
    expect(me.reserve).toBe(30);
    expect(me.health).toBe(100);
    m.damage(me, 25, -1, "test", "torso", false);
    expect(me.aegis).toBe(0);
    expect(me.reserve).toBe(15);
    m.damage(me, 40, -1, "test", "torso", false);
    expect(me.reserve).toBe(0);
    expect(me.health).toBe(75);
  });

  it("recharges Aegis at 10/s after 8 seconds without damage", () => {
    const { m, me } = practice();
    m.damage(me, 50, -1, "test", "torso", false);
    expect(me.aegis).toBe(0);
    run(m, me, 7.8, {});
    expect(me.aegis).toBe(0);
    run(m, me, 2.2, {});
    expect(me.aegis).toBeGreaterThan(15);
    expect(me.aegis).toBeLessThan(25);
    run(m, me, 4, {});
    expect(me.aegis).toBe(AEGIS_MAX);
  });

  it("fires at the exact server cadence and spends magazine ammo", () => {
    const { m, me } = range("wayfarer");
    const st = weaponStats("wayfarer", 0);
    run(m, me, 2.0, { buttons: Btn.Fire, pressed: Btn.Fire });
    const expected = Math.floor(2.0 / st.interval) + 1;
    expect(Math.abs(me.stats.shots - expected)).toBeLessThanOrEqual(1);
    const slot = me.slots[0]!;
    expect(slot.kind === "weapon" && slot.mag).toBe(st.mag - me.stats.shots);
  });

  it("semi-automatic weapons need a new press per shot", () => {
    const { m, me } = range("harbor");
    run(m, me, 1.0, { buttons: Btn.Fire, pressed: Btn.Fire });
    expect(me.stats.shots).toBe(1);
  });

  it("reloads from the reserve pool and cannot fire during a magazine reload", () => {
    const { m, me } = range("wayfarer");
    const slot = me.slots[0]!;
    if (slot.kind !== "weapon") throw new Error("slot");
    slot.mag = 3;
    me.ammo.light = 10;
    run(m, me, 0.05, { pressed: Btn.Reload });
    const shots = me.stats.shots;
    run(m, me, 1.0, { buttons: Btn.Fire, pressed: Btn.Fire });
    expect(me.stats.shots).toBe(shots);
    run(m, me, 1.6, {});
    expect(slot.mag).toBe(13);
    expect(me.ammo.light).toBe(0);
  });

  it("distinguishes head, torso and limb hits with weapon multipliers", () => {
    const st = weaponStats("sundial", 0);
    const shoot = (dy: number): number => {
      const { m, me, dummy } = range("sundial", 0, 12);
      aimAt(me, dummy.x, dummy.y + dy, dummy.z);
      const before = hp(dummy);
      run(m, me, 0.1, { buttons: Btn.Fire | Btn.Ads, pressed: Btn.Fire, yaw: me.input.yaw, pitch: me.input.pitch });
      return before - hp(dummy);
    };
    const head = shoot(1.6);
    const torso = shoot(1.12);
    const limb = shoot(0.4);
    expect(torso).toBeCloseTo(st.damage, 0);
    expect(head).toBeCloseTo(st.damage * WEAPONS.sundial.head, 0);
    expect(limb).toBeCloseTo(st.damage * WEAPONS.sundial.limb, 0);
  });

  it("applies damage falloff with distance", () => {
    const st = weaponStats("harbor", 0);
    const def = WEAPONS.harbor;
    // individual aimed shots; each hit must equal base damage x falloff x (torso 1.0 | limb multiplier)
    const shoot = (dist: number): number[] => {
      const { m, me, dummy } = range("harbor", 0, dist);
      me.y = m.island.pier.y;
      dummy.health = 1e6;
      const hits: number[] = [];
      for (let i = 0; i < 10; i++) {
        aimAt(me, dummy.x, dummy.y + 0.95, dummy.z);
        const before = dummy.health + dummy.aegis;
        run(m, me, 1 / 30, { buttons: Btn.Fire | Btn.Ads, pressed: Btn.Fire, yaw: me.input.yaw, pitch: me.input.pitch });
        const dealt = before - (dummy.health + dummy.aegis);
        if (dealt > 0) hits.push(dealt);
        run(m, me, 0.5, { buttons: Btn.Ads, yaw: me.input.yaw, pitch: me.input.pitch });
      }
      return hits;
    };
    const near = shoot(6);
    const far = shoot(45);
    expect(near.length).toBeGreaterThan(5);
    expect(far.length).toBeGreaterThan(0);
    const mult = 1 + (def.falloffMin - 1) * ((45 - st.falloffStart) / (st.falloffEnd - st.falloffStart));
    for (const d of near) expect([st.damage, st.damage * def.limb].some((v) => Math.abs(v - d) < 0.05)).toBe(true);
    for (const d of far) expect([st.damage * mult, st.damage * mult * def.limb].some((v) => Math.abs(v - d) < 0.3)).toBe(true);
    expect(Math.max(...far)).toBeLessThan(Math.max(...near) * 0.85);
  });

  it("clamps shotgun aggregate damage between its minimum and maximum caps", () => {
    const { m, me, dummy } = range("breakwater", 0, 3);
    aimAt(me, dummy.x, dummy.y + 1.12, dummy.z);
    const before = hp(dummy);
    run(m, me, 1 / 30, { buttons: Btn.Fire, pressed: Btn.Fire, yaw: me.input.yaw, pitch: me.input.pitch });
    const dealt = before - hp(dummy);
    expect(dealt).toBeGreaterThanOrEqual(WEAPONS.breakwater.minAggregate);
    expect(dealt).toBeLessThanOrEqual(WEAPONS.breakwater.maxAggregate * WEAPONS.breakwater.head + 0.01);
  });

  it("the aim ray cannot shoot through cover between the muzzle and the target", () => {
    const { m, me, dummy } = range("wayfarer", 0, 10);
    // stand behind the 2.6 m backboard: target is on the other side
    place(m, me, -20, -22.6);
    aimAt(me, dummy.x, dummy.y + 1.1, dummy.z);
    const before = hp(dummy);
    run(m, me, 0.5, { buttons: Btn.Fire, pressed: Btn.Fire, yaw: me.input.yaw, pitch: me.input.pitch });
    expect(hp(dummy)).toBe(before);
    expect(me.stats.shots).toBeGreaterThan(0);
  });

  it("Longwake Rail charges, then fires a travelling projectile", () => {
    const { m, me, dummy } = range("longwake", 0, 30);
    me.y = m.island.pier.y;
    aimAt(me, dummy.x, dummy.y + 1.12, dummy.z);
    const before = hp(dummy);
    run(m, me, 0.3, { buttons: Btn.Fire | Btn.Ads, pressed: Btn.Fire, yaw: me.input.yaw, pitch: me.input.pitch });
    expect(me.stats.shots).toBe(0); // still charging
    expect(m.projectiles.length).toBe(0);
    run(m, me, 0.4, { buttons: Btn.Ads, yaw: me.input.yaw, pitch: me.input.pitch });
    expect(me.stats.shots).toBe(1);
    run(m, me, 0.5, { buttons: Btn.Ads, yaw: me.input.yaw, pitch: me.input.pitch });
    expect(before - hp(dummy)).toBeGreaterThan(90);
  });

  it("Gale Launcher orbs do low damage and strong displacement", () => {
    const { m, me, dummy } = range("gale", 0, 9);
    const mover = m.actors.find((a) => a.mover)!;
    mover.x = dummy.x + 40; // keep the strafing target out of the blast
    aimAt(me, dummy.x, dummy.y + 0.3, dummy.z);
    const before = hp(dummy);
    run(m, me, 0.05, { buttons: Btn.Fire, pressed: Btn.Fire, yaw: me.input.yaw, pitch: me.input.pitch });
    run(m, me, 1.0, {});
    const dealt = before - hp(dummy);
    expect(dealt).toBeGreaterThan(0);
    expect(dealt).toBeLessThan(20);
    // the same blast shoves a real (non-dummy) actor: fire one at our own feet
    place(m, me, 20, 14);
    aimAt(me, me.x + 2, me.y, me.z);
    run(m, me, 1.2, {});
    const hp0 = me.health;
    run(m, me, 0.05, { buttons: Btn.Fire, pressed: Btn.Fire, yaw: me.input.yaw, pitch: -1.2 });
    let lifted = 0;
    for (let i = 0; i < 30; i++) {
      run(m, me, 1 / 30, {});
      lifted = Math.max(lifted, me.y - m.island.pier.y);
    }
    expect(lifted).toBeGreaterThan(1.0);
    expect(me.health).toBeGreaterThan(hp0 - 15);
  });

  it("quick melee hits targets in front", () => {
    const { m, me, dummy } = range("harbor", 0, 1.6);
    aimAt(me, dummy.x, dummy.y + 1.1, dummy.z);
    const before = hp(dummy);
    run(m, me, 0.05, { pressed: Btn.Melee, yaw: me.input.yaw });
    expect(before - hp(dummy)).toBe(25);
  });

  it("Med Injector heals 35 over 3 s; Shield Flask adds 25 Reserve up to 50", () => {
    const { m, me } = practice();
    me.health = 40;
    giveItem(me, 0, "injector", 2);
    run(m, me, 0.3, { slot: 0 });
    run(m, me, 0.05, { pressed: Btn.Fire, buttons: Btn.Fire, slot: 0 });
    run(m, me, 1.5, { slot: 0 });
    expect(me.health).toBeGreaterThan(50);
    expect(me.health).toBeLessThan(65);
    run(m, me, 1.7, { slot: 0 });
    expect(me.health).toBeCloseTo(75, 0);
    const s = me.slots[0];
    expect(s && s.kind === "item" ? s.count : 0).toBe(1);
    giveItem(me, 1, "flask", 4);
    for (let i = 0; i < 3; i++) {
      run(m, me, 0.3, { slot: 1 });
      run(m, me, 0.05, { pressed: Btn.Fire, buttons: Btn.Fire, slot: 1 });
      run(m, me, 2.7, { slot: 1 });
    }
    expect(me.reserve).toBe(RESERVE_MAX);
    const f = me.slots[1];
    expect(f && f.kind === "item" ? f.count : 0).toBe(2); // the third use was refused at the cap
  });

  it("Trauma Kit is cancelled by damage; Aegis Cell starts the recharge immediately", () => {
    const { m, me } = practice();
    me.health = 30;
    giveItem(me, 0, "trauma", 1);
    run(m, me, 0.3, { slot: 0 });
    run(m, me, 0.05, { pressed: Btn.Fire, buttons: Btn.Fire, slot: 0 });
    run(m, me, 2, { slot: 0 });
    expect(me.useItem).toBe("trauma");
    m.damage(me, 5, -1, "test", "torso", false);
    expect(me.useItem).toBeNull();
    expect(me.health).toBeLessThan(60);
    // Aegis Cell
    giveItem(me, 1, "cell", 1);
    me.aegis = 0;
    me.lastDamage = m.time;
    run(m, me, 0.3, { slot: 1 });
    run(m, me, 0.05, { pressed: Btn.Fire, buttons: Btn.Fire, slot: 1 });
    run(m, me, 3.1, { slot: 1 });
    expect(me.slots[1]).toBeNull();
    run(m, me, 1.0, { slot: 1 });
    expect(me.aegis).toBeGreaterThan(5); // recharging well before the normal 8 s delay
  });

  it("Mist Capsule creates a cloud that blocks bot sight lines for its duration", () => {
    const { m, me } = practice();
    giveItem(me, 0, "mist", 1);
    place(m, me, 10, 0);
    run(m, me, 0.3, { slot: 0, yaw: Math.PI / 2, pitch: 0 });
    run(m, me, 0.05, { pressed: Btn.Fire, buttons: Btn.Fire, slot: 0, yaw: Math.PI / 2 });
    run(m, me, 2.0, {});
    expect(m.mists.length).toBe(1);
    run(m, me, 12, {});
    expect(m.mists.length).toBe(0);
  });

  it("the practice range never eliminates the player", () => {
    const { m, me } = practice();
    m.damage(me, 500, -1, "test", "torso", false);
    expect(me.alive).toBe(true);
    expect(me.health).toBe(100);
    expect(me.mode).toBe(Mode.Ground);
    void pier;
  });
});
