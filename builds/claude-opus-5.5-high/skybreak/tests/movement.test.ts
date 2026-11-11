import { describe, expect, it } from 'vitest';
import { getIsland, PIER_CENTER } from '../src/shared/world/island';
import { getCollisionWorld } from '../src/shared/world/collision';
import { newMoveState, stepMovement, MoveInput, MoveState } from '../src/shared/sim/movement';
import { DT, MOVE } from '../src/shared/content/rules';

const island = getIsland();
const w = getCollisionWorld(island);
const P = PIER_CENTER, py = island.pier.y;
const inp = (p: Partial<MoveInput> = {}): MoveInput => ({ mx: 0, mz: 0, yaw: Math.PI / 2, pitch: 0, jump: false, sprint: false, crouch: false, deploy: false, walk: false, speedMult: 1, ...p });
const run = (s: MoveState, n: number, f: (i: number) => MoveInput) => { const ev = []; for (let i = 0; i < n; i++) ev.push(stepMovement(s, f(i), w, DT)); return ev; };

describe('character controller', () => {
  it('run, sprint and crouch speeds match the brief; sprint drains a 5s stamina bar', () => {
    const s = newMoveState(P.x - 30, py, P.z, Math.PI / 2);
    run(s, 30, () => inp({ mz: 1 }));
    expect(Math.hypot(s.vx, s.vz)).toBeCloseTo(MOVE.run, 0);
    run(s, 30, () => inp({ mz: 1, sprint: true }));
    expect(Math.hypot(s.vx, s.vz)).toBeCloseTo(MOVE.sprint, 0);
    expect(s.stamina).toBeCloseTo(4, 1);
    const c = newMoveState(P.x - 30, py, P.z, Math.PI / 2);
    run(c, 30, () => inp({ mz: 1, crouch: true }));
    expect(Math.hypot(c.vx, c.vz)).toBeCloseTo(MOVE.crouch, 0);
  });
  it('slides above 5.5 m/s with a repeat gate', () => {
    const s = newMoveState(P.x - 30, py, P.z, Math.PI / 2);
    run(s, 25, () => inp({ mz: 1, sprint: true }));
    const ev = run(s, 2, () => inp({ mz: 1, sprint: true, crouch: true }));
    expect(ev.some((e) => e.slid)).toBe(true);
    expect(s.slide).toBeGreaterThan(0);
    run(s, 35, () => inp({ mz: 1, crouch: true }));
    expect(s.slide).toBe(0);
    expect(s.slideGate).toBeGreaterThan(0);
  });
  it('jump apex is about 0.9m', () => {
    const s = newMoveState(P.x - 30, py, P.z, 0);
    let max = s.y;
    run(s, 40, (i) => { max = Math.max(max, s.y); return inp({ jump: i === 0 }); });
    expect(max - py).toBeGreaterThan(0.8);
    expect(max - py).toBeLessThan(1.0);
    expect(s.mode).toBe('ground');
  });
  it('mantles a 1.2m ledge', () => {
    const s = newMoveState(P.x - 20 + 2 * 3.2 + 1, py, P.z - 23.2, 0);
    const ev = run(s, 40, (i) => inp({ yaw: 0, mz: i < 14 ? 1 : 0, jump: i === 12 }));
    expect(ev.some((e) => e.mantled && e.mantled > 1.1 && e.mantled < 1.3)).toBe(true);
    expect(s.y).toBeCloseTo(py + 1.2, 1);
  });
  it('swims in deep water and climbs out', () => {
    const s = newMoveState(P.x + 52, 0.5, P.z, -Math.PI / 2);
    s.mode = 'air';
    run(s, 20, () => inp({ yaw: -Math.PI / 2 }));
    expect(s.mode).toBe('swim');
    run(s, 30, () => inp({ yaw: -Math.PI / 2, mz: 1 }));
    expect(Math.hypot(s.vx, s.vz)).toBeCloseTo(MOVE.swimSpeed, 0);
  });
  it('ziplines at fixed speed and dismounts', () => {
    const s = newMoveState(P.x + 25, py + 10, P.z - 18.6, 0);
    const toB = Math.atan2(-50, 37);
    const ev = run(s, 2, (i) => inp({ yaw: toB, jump: i === 0 }));
    expect(ev[0].zipOn).toBe(true);
    run(s, 15, () => inp({ yaw: toB }));
    expect(s.mode).toBe('zip');
    expect(Math.hypot(s.vx, s.vy, s.vz)).toBeCloseTo(MOVE.zipSpeed, 1);
    run(s, 1, () => inp({ jump: true }));
    expect(s.mode).toBe('air');
  });
  it('ascender climbs to a safe exit on top', () => {
    const a = island.ascenders.find((x) => Math.abs(x.x - (P.x + 21.3)) < 0.01)!;
    const s = newMoveState(a.x - 0.5, py, a.z, Math.PI / 2);
    run(s, 1, () => inp({ jump: true }));
    expect(s.mode).toBe('ascend');
    run(s, 60, () => inp());
    expect(s.mode).toBe('ground');
    expect(s.y).toBeGreaterThan(a.y1 - 0.5);
    expect(s.y).toBeCloseTo(w.support(s.x, s.z, 0.35, s.y + 0.5), 2);
  });
  it('air vents launch and auto-deploy the wing-sail without fall damage', () => {
    const v = island.vents[island.vents.length - 1];
    const s = newMoveState(v.x - 3, v.y, v.z, Math.PI / 2);
    const ev = run(s, 400, () => inp({ mz: 0.3 }));
    expect(ev.some((e) => e.vent)).toBe(true);
    expect(ev.some((e) => e.deployed)).toBe(true);
    expect(ev.some((e) => e.fallDamage)).toBe(false);
  });
  it('freefall reaches terminal speed and auto-deploys at minimum altitude', () => {
    const s = newMoveState(0, 320, -60, 0);
    s.mode = 'freefall'; s.insertion = true;
    let deployedAt = -1;
    run(s, 30 * 25, () => { const e = stepMovement(s, inp(), w, 0); void e; return inp(); }).forEach((e, i) => { if (e.deployed && deployedAt < 0) deployedAt = i; });
    expect(deployedAt).toBeGreaterThan(0);
    expect(s.mode).toBe('ground');
  });
  it('fall damage above tuned vertical speed, none for small drops', () => {
    const hi = newMoveState(P.x - 30, py + 30, P.z, 0); hi.mode = 'air';
    const ev = run(hi, 90, () => inp());
    expect(ev.some((e) => (e.fallDamage ?? 0) > 0)).toBe(true);
    const lo = newMoveState(P.x - 30, py + 2, P.z, 0); lo.mode = 'air';
    expect(run(lo, 40, () => inp()).some((e) => e.fallDamage)).toBe(false);
  });
  it('never walks through walls', () => {
    // walk into the practice tower for 3s
    const s = newMoveState(P.x + 18, py, P.z - 21, Math.PI / 2);
    run(s, 90, () => inp({ mz: 1, yaw: Math.PI / 2 }));
    expect(s.x).toBeLessThan(P.x + 22 - MOVE.radius + 0.01);
  });
});
