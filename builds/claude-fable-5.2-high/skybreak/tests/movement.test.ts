import { describe, expect, it } from "vitest";
import { MOVE } from "../src/shared/content/rules";
import { Mode } from "../src/shared/protocol/protocol";
import { Btn, give, pier, place, practice, run } from "./helpers";

function speedOver(m: ReturnType<typeof practice>["m"], me: ReturnType<typeof practice>["me"], seconds: number, inp: Parameters<typeof run>[3]): number {
  run(m, me, 0.5, inp); // accelerate
  const x0 = me.x, z0 = me.z;
  run(m, me, seconds, inp);
  return Math.hypot(me.x - x0, me.z - z0) / seconds;
}

describe("server-validated movement", () => {
  it("uses the brief's ground speeds: run 5.8, sprint 7.3, crouch 2.8, aim-walk 4.8", () => {
    const { m, me } = practice();
    place(m, me, -20, 0);
    expect(speedOver(m, me, 1, { moveZ: 1, yaw: Math.PI / 2 })).toBeCloseTo(MOVE.run, 1);
    place(m, me, -20, 0);
    expect(speedOver(m, me, 1, { moveZ: 1, yaw: Math.PI / 2, buttons: Btn.Sprint })).toBeCloseTo(MOVE.sprint, 1);
    place(m, me, -20, 0);
    me.energy = 1;
    expect(speedOver(m, me, 1, { moveZ: 1, yaw: Math.PI / 2, buttons: Btn.Crouch })).toBeCloseTo(MOVE.crouch, 1);
    place(m, me, -20, 0);
    expect(speedOver(m, me, 1, { moveZ: 1, yaw: Math.PI / 2, buttons: Btn.Ads })).toBeCloseTo(MOVE.walk, 1);
  });

  it("drains sprint energy in about five seconds and regenerates after a delay", () => {
    const { m, me } = practice();
    place(m, me, -30, 2);
    me.energy = 1;
    run(m, me, 2.5, { moveZ: 1, yaw: Math.PI / 2, buttons: Btn.Sprint });
    expect(me.energy).toBeCloseTo(0.5, 1);
    place(m, me, -30, 2);
    run(m, me, 2.6, { moveZ: 1, yaw: Math.PI / 2, buttons: Btn.Sprint });
    expect(me.energy).toBe(0);
    expect(me.sprinting).toBe(false);
    run(m, me, 1.0, {});
    expect(me.energy).toBe(0); // still inside the 1.25 s regen delay
    run(m, me, 1.5, {});
    expect(me.energy).toBeGreaterThan(0.2);
  });

  it("jumps to an apex of roughly 0.9 m", () => {
    const { m, me } = practice();
    place(m, me, -20, 0);
    run(m, me, 0.2, {});
    const y0 = me.y;
    let apex = 0;
    me.input.pressed = Btn.Jump;
    for (let i = 0; i < 40; i++) {
      m.step();
      apex = Math.max(apex, me.y - y0);
    }
    expect(apex).toBeGreaterThan(0.8);
    expect(apex).toBeLessThan(1.0);
    expect(me.mode).toBe(Mode.Ground);
  });

  it("slides only above 5.5 m/s, for about a second on flat ground, with a 1.2 s repeat gate", () => {
    const { m, me } = practice();
    place(m, me, -34, 2);
    // too slow: crouch just crouches
    run(m, me, 0.4, { moveZ: 1, yaw: Math.PI / 2, buttons: Btn.Ads });
    run(m, me, 0.1, { moveZ: 1, yaw: Math.PI / 2, buttons: Btn.Crouch, pressed: Btn.Crouch });
    expect(me.mode).toBe(Mode.Ground);
    expect(me.crouch).toBe(true);
    // sprinting: crouch starts a slide
    place(m, me, -34, 2);
    run(m, me, 0.8, { moveZ: 1, yaw: Math.PI / 2, buttons: Btn.Sprint });
    run(m, me, 0.1, { moveZ: 1, yaw: Math.PI / 2, buttons: Btn.Crouch, pressed: Btn.Crouch });
    expect(me.mode).toBe(Mode.Slide);
    const t0 = m.time;
    let ended = 0;
    for (let i = 0; i < 90 && !ended; i++) {
      run(m, me, 1 / 30, { moveZ: 1, yaw: Math.PI / 2, buttons: Btn.Crouch });
      if (me.mode !== Mode.Slide) ended = m.time - t0;
    }
    expect(ended).toBeGreaterThan(0.5);
    expect(ended).toBeLessThanOrEqual(MOVE.slideDuration + 0.2);
    // immediately sprinting again and pressing crouch inside the gate must not slide
    run(m, me, 0.7, { moveZ: 1, yaw: Math.PI / 2, buttons: Btn.Sprint });
    run(m, me, 0.05, { moveZ: 1, yaw: Math.PI / 2, buttons: Btn.Crouch, pressed: Btn.Crouch });
    expect(me.mode).not.toBe(Mode.Slide);
  });

  it("mantles a 1.3 m crate but will not mantle a wall that is too tall", () => {
    const { m, me } = practice();
    const deck = m.island.pier.y;
    place(m, me, -29.6, 7.35);
    run(m, me, 0.1, { yaw: 0 });
    run(m, me, 0.05, { yaw: 0, pressed: Btn.Jump });
    expect(me.mode).toBe(Mode.Mantle);
    run(m, me, 1.0, { yaw: 0 });
    expect(me.mode).toBe(Mode.Ground);
    expect(me.y).toBeCloseTo(deck + 1.3, 1);
    // the 2.9 m block is outside the mantle range from the deck
    place(m, me, -22.4, 6.9);
    run(m, me, 0.1, { yaw: 0 });
    run(m, me, 0.05, { yaw: 0, pressed: Btn.Jump });
    expect(me.mode).not.toBe(Mode.Mantle);
  });

  it("walls stop the character and steps are climbed without jumping", () => {
    const { m, me } = practice();
    // run into the backboard behind the weapon racks
    place(m, me, -20, -19);
    run(m, me, 2, { moveZ: 1, yaw: Math.PI });
    const [, wallZ] = pier(m, 0, -21.3);
    expect(me.z).toBeGreaterThan(wallZ);
    // walk up the swim stairs from the bottom
    const [sx, sz] = pier(m, 0, 30);
    me.x = sx;
    me.z = sz;
    me.y = m.world.support(sx, sz, 0.3, 10);
    const startY = me.y;
    run(m, me, 3.5, { moveZ: 1, yaw: Math.PI });
    expect(me.y).toBeGreaterThan(startY + 1.5);
  });

  it("swims in deep water at 4.2 m/s and only lets the sidearm fire", () => {
    const { m, me } = practice();
    place(m, me, 0, 60, -1.2);
    run(m, me, 0.3, {});
    expect(me.mode).toBe(Mode.Swim);
    expect(speedOver(m, me, 1, { moveZ: 1, yaw: 0 })).toBeCloseTo(MOVE.swim, 1);
    give(me, 0, "wayfarer");
    give(me, 1, "harbor");
    me.ammo.light = 100;
    run(m, me, 0.6, { buttons: Btn.Fire, pressed: Btn.Fire, slot: 0 });
    expect(me.stats.shots).toBe(0);
    run(m, me, 0.4, { slot: 1 });
    run(m, me, 0.1, { buttons: Btn.Fire, pressed: Btn.Fire, slot: 1 });
    expect(me.stats.shots).toBe(1);
  });

  it("applies fall damage only above the safe speed", () => {
    const { m, me } = practice();
    place(m, me, -20, 0, m.island.pier.y + 4);
    me.mode = Mode.Air;
    run(m, me, 1.5, {});
    expect(me.health).toBe(100);
    place(m, me, -20, 0, m.island.pier.y + 14);
    me.mode = Mode.Air;
    me.lastDamage = -100;
    run(m, me, 2.5, {});
    expect(me.mode).toBe(Mode.Ground);
    expect(me.health).toBeLessThan(75);
    expect(me.health).toBeGreaterThan(20);
    expect(me.aegis).toBe(50); // fall damage bypasses shields
  });

  it("air vents launch, auto-deploy the wing-sail and prevent fall damage", () => {
    const { m, me } = practice();
    place(m, me, 16, 4, m.island.pier.y + 0.2);
    run(m, me, 0.1, {});
    expect(me.vy).toBeGreaterThan(20);
    let glided = false;
    let peak = 0;
    for (let i = 0; i < 400 && !(me.mode === Mode.Ground && i > 30) && me.mode !== Mode.Swim; i++) {
      run(m, me, 1 / 30, { moveZ: 1, yaw: -Math.PI / 2 });
      if (me.mode === Mode.Glide) glided = true;
      peak = Math.max(peak, me.y);
    }
    expect(glided).toBe(true);
    expect(peak - m.island.pier.y).toBeGreaterThan(15);
    expect(me.health).toBe(100);
  });

  it("rides the ascender to the tower platform and the zipline back down", () => {
    const { m, me } = practice();
    const deck = m.island.pier.y;
    place(m, me, -8, 9.6);
    run(m, me, 0.1, { yaw: 0 });
    run(m, me, 0.05, { pressed: Btn.Interact, buttons: Btn.Interact });
    expect(me.mode).toBe(Mode.Ascend);
    run(m, me, 2.0, {});
    expect(me.mode).toBe(Mode.Ground);
    expect(me.y).toBeCloseTo(deck + 7.3, 1);
    // walk under the zipline anchor and grab it
    place(m, me, -6, 14, deck + 7.3);
    run(m, me, 0.05, { pressed: Btn.Interact, buttons: Btn.Interact, yaw: Math.PI / 2 });
    expect(me.mode).toBe(Mode.Zip);
    const x0 = me.x;
    run(m, me, 1.0, {});
    expect(me.x - x0).toBeCloseTo(MOVE.zipSpeed * 0.97, 0); // fixed speed along the line
    run(m, me, 4.0, {});
    expect(me.mode).toBe(Mode.Ground);
    expect(me.y).toBeCloseTo(deck, 1);
    expect(me.health).toBe(100);
  });

  it("freefall deploys the wing-sail automatically at 75 m and lands safely", () => {
    const { m, me } = practice();
    me.x = -130;
    me.z = 60;
    me.y = 320;
    me.mode = Mode.Freefall;
    me.insertion = true;
    let deployAt = -1;
    for (let i = 0; i < 3000 && (me.mode as number) !== Mode.Ground && (me.mode as number) !== Mode.Swim; i++) {
      run(m, me, 1 / 30, { moveZ: 1, yaw: 0, pitch: -0.4 });
      if (deployAt < 0 && (me.mode as number) === Mode.Glide) deployAt = me.y - Math.max(0, m.world.terrain(me.x, me.z));
    }
    expect(deployAt).toBeGreaterThan(55);
    expect(deployAt).toBeLessThanOrEqual(MOVE.autoDeployHeight + 2);
    expect(me.mode).toBe(Mode.Ground);
    expect(me.health).toBe(100);
    expect(me.insertion).toBe(false);
  });

  it("grapple pulls the player toward the anchor and consumes a charge", () => {
    const { m, me } = practice();
    place(m, me, -8, 2);
    me.slots[0] = { kind: "item", item: "grapple", count: 3 };
    run(m, me, 0.3, { slot: 0, yaw: 0, pitch: 0.5 });
    const d0 = Math.hypot(me.x - pier(m, -8, 14)[0], me.z - pier(m, -8, 14)[1]);
    run(m, me, 0.05, { slot: 0, yaw: 0, pitch: 0.5, pressed: Btn.Fire, buttons: Btn.Fire });
    expect(me.mode).toBe(Mode.Grapple);
    run(m, me, 0.3, { slot: 0, yaw: 0, pitch: 0.5 });
    const d1 = Math.hypot(me.x - pier(m, -8, 14)[0], me.z - pier(m, -8, 14)[1]);
    expect(d1).toBeLessThan(d0 - 3);
    const s = me.slots[0];
    expect(s && s.kind === "item" ? s.count : 0).toBe(2);
  });
});
