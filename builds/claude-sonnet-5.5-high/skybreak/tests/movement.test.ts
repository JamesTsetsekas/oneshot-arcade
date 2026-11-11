import { describe, expect, it } from 'vitest';
import { DT, MOVE } from '../src/shared/content';
import { inp, practice, run, runFn, speedOf } from './helpers';

describe('character controller', () => {
  it('moves at run / ADS-walk / crouch / sprint speeds', () => {
    const m = practice();
    const h = m.players[0];
    run(m, { moveF: 1, yaw: 0 }, 1);
    expect(speedOf(h)).toBeCloseTo(MOVE.run, 1);
    run(m, { moveF: 1, yaw: 0, sprint: true }, 1);
    expect(speedOf(h)).toBeCloseTo(MOVE.sprint, 1);
    const m2 = practice();
    run(m2, { moveF: 1, yaw: 0, crouch: true }, 1);
    expect(speedOf(m2.players[0])).toBeCloseTo(MOVE.crouch, 1);
    const m3 = practice();
    m3.players[0].slots[0] = { kind: 'weapon', weapon: 'wayfarer', rarity: 0, mag: 30 };
    run(m3, { moveF: 1, yaw: 0, ads: true }, 1);
    expect(speedOf(m3.players[0])).toBeCloseTo(MOVE.walk, 1);
  });

  it('drains a 5 second sprint bar and regenerates it after 1.25 s', () => {
    const m = practice();
    const h = m.players[0];
    h.x = 0; h.z = -60; h.y = m.world.heightAt(0, -60);
    let ticks = 0;
    while (h.stamina > 0.03 && ticks < 30 * 8) { m.step(new Map([[0, inp({ moveF: 1, yaw: 0, sprint: true })]])); ticks++; }
    expect(ticks * DT).toBeGreaterThan(4.5);
    expect(ticks * DT).toBeLessThan(5.3);
    run(m, { moveF: 1, yaw: 0, sprint: true }, 0.4);
    expect(speedOf(h)).toBeLessThan(MOVE.sprint - 0.5); // exhausted: falls back to run speed
    const low = h.stamina;
    run(m, {}, 0.8);
    expect(h.stamina).toBe(low); // still inside the 1.25 s regen delay
    run(m, {}, 2);
    expect(h.stamina).toBeGreaterThan(low + 0.3);
  });

  it('jumps about 0.9 m high', () => {
    const m = practice();
    const h = m.players[0];
    run(m, {}, 0.3);
    const base = h.y;
    let apex = base;
    for (let i = 0; i < 40; i++) { m.step(new Map([[0, inp({ jump: i === 0 })]])); apex = Math.max(apex, h.y); }
    expect(apex - base).toBeGreaterThan(0.82);
    expect(apex - base).toBeLessThan(1.0);
  });

  it('slides above 5.5 m/s for at most 1 s with a 1.2 s repeat gate', () => {
    const m = practice();
    const h = m.players[0];
    h.x = 0; h.z = -70; h.y = m.world.heightAt(0, -70);
    run(m, { moveF: 1, yaw: 0, sprint: true }, 0.8);
    expect(speedOf(h)).toBeGreaterThan(MOVE.slideMinSpeed);
    const slideIn = inp({ moveF: 1, sprint: true, crouch: true });
    m.step(new Map([[0, slideIn]]));
    expect(h.sliding).toBe(true);
    let ticks = 0;
    while (h.sliding && ticks < 60) { m.step(new Map([[0, slideIn]])); ticks++; }
    expect(ticks * DT).toBeLessThanOrEqual(MOVE.slideDuration + 0.1);
    // a second slide inside the cooldown must be refused
    run(m, { moveF: 1, sprint: true }, 0.1);
    m.step(new Map([[0, slideIn]]));
    expect(h.sliding).toBe(false);
    // and is allowed again once the 1.2 s gate has passed
    run(m, { moveF: 1, sprint: true }, 1.3);
    m.step(new Map([[0, slideIn]]));
    expect(h.sliding).toBe(true);
  });

  it('does not slide when moving slower than 5.5 m/s', () => {
    const m = practice();
    const h = m.players[0];
    run(m, { moveF: 1, yaw: 0, ads: true }, 0.6);
    m.step(new Map([[0, inp({ moveF: 1, ads: true, crouch: true })]]));
    expect(h.sliding).toBe(false);
  });

  it('mantles a 1.1 m crate but not a 12 m wall', () => {
    const m = practice();
    const h = m.players[0];
    // crate: x -64..-60, z 20..24, height 1.1 above y=4
    h.x = -62; h.z = 19.3; h.y = m.world.heightAt(-62, 19.3);
    runFn(m, (t) => ({ moveF: 1, yaw: 0, jump: t < 25 }), 45);
    expect(h.y).toBeGreaterThan(4 + 1.0);
    expect(h.z).toBeGreaterThan(20);
    expect(h.mode).toBe('ground');
    // the boundary wall is far above the mantle range
    const m2 = practice();
    const h2 = m2.players[0];
    h2.x = 0; h2.z = 85; h2.y = m2.world.heightAt(0, 85);
    run(m2, { moveF: 1, yaw: 0, jump: true }, 2);
    expect(h2.z).toBeLessThan(88.1);
    expect(h2.y).toBeLessThan(8);
  });

  it('swims in water deeper than 1.1 m at 4.2 m/s', () => {
    const m = practice();
    const h = m.players[0];
    h.x = 50; h.z = -34; h.y = m.world.heightAt(50, -34);
    run(m, { moveF: 1, yaw: Math.PI }, 3);
    expect(h.mode).toBe('swim');
    expect(speedOf(h)).toBeCloseTo(MOVE.swim, 0);
    expect(h.y).toBeLessThan(0);
  });

  it('applies fall damage only above the tuned vertical speed', () => {
    const m = practice();
    const h = m.players[0];
    h.y += 1.5; h.onGround = false;
    run(m, {}, 1.2);
    expect(h.stats.damageTaken).toBe(0);
    const m2 = practice();
    const h2 = m2.players[0];
    h2.y += 9; h2.onGround = false;
    run(m2, {}, 2);
    expect(h2.stats.damageTaken).toBeGreaterThan(10);
  });

  it('freefall auto-deploys the wing-sail near 140 m and lands without damage', () => {
    const m = practice();
    const h = m.players[0];
    const g = m.world.heightAt(0, 0);
    h.x = 0; h.z = 0; h.y = g + 330; (h as { mode: string }).mode = 'freefall'; h.onGround = false; h.vy = -20;
    let deployedAgl = -1;
    for (let i = 0; i < 30 * 60 && (h.mode as string) !== 'ground'; i++) {
      m.step(new Map([[0, inp({ moveF: 1 })]]));
      if ((h.mode as string) === 'glide' && deployedAgl < 0) deployedAgl = h.y - m.world.heightAt(h.x, h.z);
    }
    expect(deployedAgl).toBeGreaterThan(110);
    expect(deployedAgl).toBeLessThan(150);
    expect(h.mode).toBe('ground');
    expect(h.stats.damageTaken).toBe(0);
  });

  it('rides a zipline at a fixed speed and dismounts at the end', () => {
    const m = practice();
    const h = m.players[0];
    const z = m.world.ziplines[0];
    h.x = z.a.x; h.z = z.a.z; h.y = z.a.y - 1.9; h.onGround = true; h.mode = 'ground';
    const f = m.focusFor(h);
    expect(f && f.kind).toBe('zipline');
    m.interactWith(h, f!, false);
    expect(h.mode).toBe('zipline');
    const len = Math.hypot(z.b.x - z.a.x, z.b.y - z.a.y, z.b.z - z.a.z);
    run(m, {}, len / MOVE.zipSpeed + 0.5);
    expect(h.mode).not.toBe('zipline');
    expect(Math.hypot(h.x - z.b.x, h.z - z.b.z)).toBeLessThan(6);
  });

  it('launches from an air vent into a glide', () => {
    const m = practice();
    const h = m.players[0];
    const v = m.world.vents[0];
    h.x = v.x; h.z = v.z; h.y = m.world.heightAt(v.x, v.z);
    run(m, {}, 0.2);
    expect(h.mode === 'freefall' || h.mode === 'glide').toBe(true);
    run(m, {}, 2.5);
    expect(h.mode).toBe('glide');
  });
});
