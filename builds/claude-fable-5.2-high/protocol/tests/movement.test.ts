import { describe, expect, it } from 'vitest';
import { DT, PLAYER } from '../src/content/rules';
import { WEAPONS } from '../src/content/weapons';
import { getAnnex } from '../src/map/annex';
import { BTN, type MoveState } from '../src/protocol/types';
import { newMoveState, stepMove, type MoveCtx } from '../src/sim/movement';

const world = getAnnex().world;
const ctx = (maxSpeed = 4.7, extra: Partial<MoveCtx> = {}): MoveCtx => ({ maxSpeed, frozen: false, barriers: false, ...extra });
const run = (s: MoveState, buttons: number, yaw: number, seconds: number, c: MoveCtx = ctx()): void => {
  for (let i = 0; i < Math.round(seconds / DT); i++) stepMove(world, s, buttons, yaw, c, DT);
};
const speed = (s: MoveState): number => Math.hypot(s.vx, s.vz);
/** A clear east-west lane in the Freight yard. */
const lane = (): MoveState => newMoveState(33, 0, 8.3);
const EAST = Math.PI / 2;

describe('player movement', () => {
  it('reaches the carry speed of the equipped weapon class', () => {
    for (const id of ['tool', 'vela', 'kite', 'aster', 'longglass'] as const) {
      const s = lane();
      run(s, BTN.FWD, EAST, 1.5, ctx(WEAPONS[id].moveSpeed));
      expect(speed(s)).toBeCloseTo(WEAPONS[id].moveSpeed, 2);
    }
  });

  it('walks at 52% and crouches at 40% of run speed', () => {
    const w = lane();
    run(w, BTN.FWD | BTN.WALK, EAST, 1.5);
    expect(speed(w)).toBeCloseTo(4.7 * 0.52, 2);
    const c = lane();
    run(c, BTN.FWD | BTN.CROUCH, EAST, 1.5);
    expect(speed(c)).toBeCloseTo(4.7 * 0.4, 2);
    expect(c.crouch).toBe(1);
  });

  it('accelerates at 24 m/s^2 and counter-strafing stops faster than letting go', () => {
    const a = lane();
    run(a, BTN.FWD, EAST, 0.125);
    expect(speed(a)).toBeCloseTo(3.0, 2);
    const stopTime = (buttons: number): number => {
      const s = lane();
      run(s, BTN.FWD, EAST, 1.5);
      let t = 0;
      while (speed(s) > 0.45 && t < 2) {
        stepMove(world, s, s.vx > 0.2 ? buttons : 0, EAST, ctx(), DT);
        t += DT;
      }
      return t;
    };
    const release = stopTime(0);
    const counter = stopTime(BTN.BACK);
    expect(counter).toBeLessThan(release - 0.05);
    expect(counter).toBeCloseTo((4.7 - 0.45) / PLAYER.counterDecel, 1);
  });

  it('jumps to roughly 0.78 m and repeated jumps lose height', () => {
    const s = lane();
    const apex = (): number => {
      let top = 0;
      stepMove(world, s, BTN.JUMP, EAST, ctx(), DT);
      for (let i = 0; i < 80 && !s.onGround; i++) {
        stepMove(world, s, 0, EAST, ctx(), DT);
        top = Math.max(top, s.y);
      }
      return top;
    };
    const first = apex();
    expect(first).toBeGreaterThan(0.72);
    expect(first).toBeLessThan(0.8);
    expect(s.landT).toBeGreaterThan(0); // landing costs accuracy for a moment
    const second = apex();
    const third = apex();
    expect(second).toBeLessThan(first - 0.05);
    expect(third).toBeLessThan(second);
    // holding jump does not auto-hop
    const h = lane();
    run(h, BTN.JUMP, EAST, 0.05);
    run(h, BTN.JUMP, EAST, 1.5);
    expect(h.onGround).toBe(true);
    expect(h.y).toBe(0);
  });

  it('is stopped by walls and cannot leave the map', () => {
    const s = newMoveState(40, 0, 8);
    run(s, BTN.FWD, Math.PI, 4); // south toward the yard wall at z = 3
    expect(s.z).toBeGreaterThan(3 + PLAYER.halfWidth - 0.01);
    expect(s.z).toBeLessThan(3.4);
    run(s, BTN.FWD | BTN.RIGHT, Math.PI, 12); // slide along it
    expect(s.z).toBeGreaterThan(3.29);
    expect(s.x).toBeGreaterThan(20.29);
  });

  it('climbs stairs smoothly and stays grounded going back down', () => {
    const s = newMoveState(46.5, 0, 34.5);
    let airborne = 0;
    for (let i = 0; i < 64 * 3; i++) {
      stepMove(world, s, BTN.FWD, 0, ctx(), DT);
      if (!s.onGround) airborne++;
    }
    expect(s.y).toBeCloseTo(2.6, 3); // on the Ledge
    expect(s.z).toBeGreaterThan(41);
    expect(airborne).toBe(0);
    for (let i = 0; i < 64 * 4; i++) {
      stepMove(world, s, BTN.FWD, Math.PI, ctx(), DT);
      if (!s.onGround) airborne++;
    }
    expect(s.y).toBeCloseTo(0, 3);
    expect(airborne).toBeLessThan(4);
  });

  it('cannot step onto cover that is taller than a stair', () => {
    const s = newMoveState(34.75, 0, 9); // south of the yard crate at (35.5..37, 10.5..12)
    s.x = 36.2;
    run(s, BTN.FWD, 0, 2);
    expect(s.y).toBe(0);
    expect(s.z).toBeLessThan(10.5 - PLAYER.halfWidth + 0.01);
  });

  it('needs a crouch for the maintenance crawl and cannot stand up inside it', () => {
    const standing = newMoveState(33.5, 0, 36.5);
    run(standing, BTN.FWD, -Math.PI / 2, 3);
    expect(standing.x).toBeGreaterThan(32);
    const crawling = newMoveState(33.5, 0, 36.5);
    run(crawling, BTN.CROUCH, -Math.PI / 2, 0.3);
    run(crawling, BTN.FWD | BTN.CROUCH, -Math.PI / 2, 2);
    expect(crawling.x).toBeLessThan(31);
    // let go of crouch under the low ceiling: the player stays crouched
    run(crawling, BTN.FWD, -Math.PI / 2, 0.5);
    expect(crawling.crouch).toBe(1);
    run(crawling, BTN.FWD, -Math.PI / 2, 4);
    expect(crawling.x).toBeLessThan(25); // through to Hydro
    run(crawling, 0, -Math.PI / 2, 0.5);
    expect(crawling.crouch).toBe(0);
  });

  it('respects buy-phase barriers only while they are active', () => {
    const held = newMoveState(40, 0, 12);
    run(held, BTN.FWD, 0, 2, ctx(4.7, { barriers: true }));
    expect(held.z).toBeLessThan(15);
    const free = newMoveState(40, 0, 12);
    run(free, BTN.FWD, 0, 2);
    expect(free.z).toBeGreaterThan(17);
  });

  it('does not move while frozen', () => {
    const s = lane();
    run(s, BTN.FWD | BTN.JUMP, EAST, 1, ctx(4.7, { frozen: true }));
    expect(s.x).toBe(33);
    expect(s.y).toBe(0);
  });

  it('is deterministic for identical inputs', () => {
    const script = (s: MoveState): void => {
      run(s, BTN.FWD, 0.3, 0.7);
      run(s, BTN.FWD | BTN.LEFT | BTN.JUMP, 0.9, 0.4);
      run(s, BTN.RIGHT | BTN.CROUCH, -1.2, 0.8);
      run(s, BTN.BACK | BTN.WALK, 2.2, 0.6);
    };
    const a = newMoveState(40, 0, 20);
    const b = newMoveState(40, 0, 20);
    script(a);
    script(b);
    expect(a).toEqual(b);
  });
});
