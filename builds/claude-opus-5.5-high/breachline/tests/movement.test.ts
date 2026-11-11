import { describe, it, expect } from "vitest";
import { CollisionWorld, Box } from "../src/shared/collision";
import { newMoveState, stepMovement, MoveInput, MoveState } from "../src/shared/movement";
import { MOVE } from "../src/content/tuning";
import { K17 } from "../src/content/map-k17";

const DT = 1 / 60;
let id = 0;
const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): Box => ({ id: id++, min: { x: x0, y: y0, z: z0 }, max: { x: x1, y: y1, z: z1 }, mat: "concrete", active: true });
const flat = () => new CollisionWorld([box(-100, 100, -1, 0, -100, 100)]);
const inp = (o: Partial<MoveInput> = {}): MoveInput => ({ mx: 0, mz: 0, yaw: 0, jump: false, crouch: false, sprint: false, ads: 0, adsMove: 0.7, canSprint: true, sprintDelay: MOVE.sprintDelay, mantleTime: MOVE.mantleTime, ...o });
const run = (w: CollisionWorld, s: MoveState, i: MoveInput, secs: number) => { for (let k = 0; k < secs * 60; k++) stepMovement(w, s, i, DT); };
const hspeed = (s: MoveState) => Math.hypot(s.vel.x, s.vel.z);

describe("movement", () => {
  it("reaches the standing, crouch, sprint and ADS speed targets", () => {
    const w = flat();
    const s = newMoveState({ x: 0, y: 0, z: 0 });
    run(w, s, inp({ mz: 1 }), 1);
    expect(hspeed(s)).toBeCloseTo(MOVE.standSpeed, 2);
    run(w, s, inp({ mz: 1, sprint: true }), 1);
    expect(hspeed(s)).toBeCloseTo(MOVE.sprintSpeed, 2);
    expect(s.sprinting).toBe(true);
    run(w, s, inp({ mz: 1, crouch: true }), 1);
    expect(hspeed(s)).toBeCloseTo(MOVE.crouchSpeed, 2);
    run(w, s, inp({ mz: 1, ads: 1, adsMove: 0.7 }), 1);
    expect(hspeed(s)).toBeCloseTo(MOVE.standSpeed * 0.7, 2);
  });

  it("sprint engages only after the 120 ms delay", () => {
    const w = flat();
    const s = newMoveState({ x: 0, y: 0, z: 0 });
    run(w, s, inp({ mz: 1, sprint: true }), 0.1);
    expect(s.sprinting).toBe(false);
    run(w, s, inp({ mz: 1, sprint: true }), 0.05);
    expect(s.sprinting).toBe(true);
  });

  it("accelerates at ~32 m/s² and decelerates at ~38 m/s²", () => {
    const w = flat();
    const s = newMoveState({ x: 0, y: 0, z: 0 });
    run(w, s, inp({ mz: 1 }), 0.1);
    expect(hspeed(s)).toBeCloseTo(3.2, 1);
    run(w, s, inp({ mz: 1 }), 1);
    run(w, s, inp(), 0.1);
    expect(hspeed(s)).toBeCloseTo(MOVE.standSpeed - 3.8, 1);
  });

  it("jumps to a ~0.85 m apex and lands", () => {
    const w = flat();
    const s = newMoveState({ x: 0, y: 0, z: 0 });
    let maxY = 0, landed = false;
    stepMovement(w, s, inp({ jump: true }), DT);
    for (let k = 0; k < 90; k++) { const ev = stepMovement(w, s, inp({ jump: true }), DT); maxY = Math.max(maxY, s.pos.y); if (ev.landed) landed = true; }
    expect(maxY).toBeGreaterThan(0.78);
    expect(maxY).toBeLessThan(0.9);
    expect(landed).toBe(true);
    expect(s.pos.y).toBe(0);
  });

  it("does not gain horizontal speed by chaining jumps (no bunny-hop gain)", () => {
    const w = flat();
    const s = newMoveState({ x: 0, y: 0, z: 0 });
    run(w, s, inp({ mz: 1, sprint: true }), 1);
    let max = 0;
    for (let k = 0; k < 600; k++) { stepMovement(w, s, inp({ mz: 1, mx: (k % 40) < 20 ? 1 : -1, sprint: true, jump: k % 2 === 0 }), DT); max = Math.max(max, hspeed(s)); }
    expect(max).toBeLessThanOrEqual(MOVE.sprintSpeed + 1e-6);
  });

  it("collides with walls and steps up stairs", () => {
    const w = new CollisionWorld([box(-100, 100, -1, 0, -100, 100), box(-5, 5, 0, 3, 3, 3.4), box(-5, 5, 0, 0.3, -2.5, -2), box(-5, 5, 0, 0.6, -30, -2.5)]);
    const s = newMoveState({ x: 0, y: 0, z: 0 });
    run(w, s, inp({ mz: 1 }), 2);
    expect(s.pos.z).toBeLessThan(3 - MOVE.radius + 0.01);
    expect(s.pos.z).toBeGreaterThan(2.5);
    const t = newMoveState({ x: 0, y: 0, z: 0 });
    run(w, t, inp({ mz: 1, yaw: Math.PI }), 1.2);
    expect(t.pos.y).toBeCloseTo(0.6, 2);
  });

  it("mantles ledges between 0.6 and 1.35 m but not taller ones", () => {
    for (const [h, ok] of [[1.2, true], [0.7, true], [1.8, false]] as const) {
      const w = new CollisionWorld([box(-100, 100, -1, 0, -100, 100), box(-5, 5, 0, h, 1, 40)]);
      const s = newMoveState({ x: 0, y: 0, z: 0.4 });
      let mantled = false;
      for (let k = 0; k < 120; k++) { const ev = stepMovement(w, s, inp({ mz: 1, jump: k > 10 && k < 14 }), DT); if (ev.mantled) mantled = true; }
      expect(mantled).toBe(ok);
      if (ok) expect(s.pos.y).toBeCloseTo(h, 2);
    }
  });

  it("needs to crouch under the low utility pipes", () => {
    const w = new CollisionWorld([box(-100, 100, -1, 0, -100, 100), box(-5, 5, 1.38, 1.98, 2, 3)]);
    const stand = newMoveState({ x: 0, y: 0, z: 0 });
    run(w, stand, inp({ mz: 1 }), 2);
    expect(stand.pos.z).toBeLessThan(2);
    const crouch = newMoveState({ x: 0, y: 0, z: 0 });
    run(w, crouch, inp({ mz: 1, crouch: true }), 3);
    expect(crouch.pos.z).toBeGreaterThan(3.5);
  });

  it("walks down into the K-17 service tunnel and back up", () => {
    const w = new CollisionWorld(K17.boxes.map((b) => ({ ...b, min: { ...b.min }, max: { ...b.max } })));
    const s = newMoveState({ x: -26, y: 0, z: -11.5 });
    run(w, s, inp({ mz: 1, yaw: Math.PI / 2 }), 3);
    expect(s.pos.y).toBeCloseTo(-3.2, 1);
    expect(s.pos.x).toBeGreaterThan(-19);
  });
});
