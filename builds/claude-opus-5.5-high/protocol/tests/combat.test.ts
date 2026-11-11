import { describe, expect, it } from 'vitest';
import { WEAPONS } from '../src/content/weapons';
import { TICK_RATE, PLAYER, DT } from '../src/content/rules';
import { computeDamage, computeSpread, recoilOffset, rayHitboxes, shotDeviation, traceWorld } from '../src/sim/combat';
import { BTN } from '../src/protocol/messages';
import { aimAt, makeRoom, map, run, teleport, toLive } from './helpers';
import { jumpVelocity } from '../src/sim/movement';

describe('ballistics', () => {
  it('recoil paths and seeded deviation are deterministic and learnable', () => {
    const a = WEAPONS.aster;
    const p10 = recoilOffset(a, 10);
    expect(recoilOffset(a, 10)).toEqual(p10);
    expect(p10.pitch).toBeLessThan(0); // climbs upward
    // later shots drift sideways per the authored path
    expect(Math.abs(recoilOffset(a, 15).yaw)).toBeGreaterThan(Math.abs(recoilOffset(a, 9).yaw));
    const d1 = shotDeviation(123, 4, 17, 0, 0.01, 0.2);
    const d2 = shotDeviation(123, 4, 17, 0, 0.01, 0.2);
    expect(d1).toEqual(d2);
    expect(shotDeviation(124, 4, 17, 0, 0.01, 0.2)).not.toEqual(d1);
  });

  it('movement, air and landing inaccuracy exceed the standing baseline; crouch tightens it', () => {
    const k = WEAPONS.krait;
    const base = { speedH: 0, onGround: true, crouchAmt: 0, landPenalty: 0, recoilIndex: 0, scoped: false };
    const stand = computeSpread(k, base);
    expect(computeSpread(k, { ...base, speedH: 0.4 })).toBe(stand); // under 0.45 m/s
    expect(computeSpread(k, { ...base, speedH: 4.6 })).toBeGreaterThan(stand * 10);
    expect(computeSpread(k, { ...base, onGround: false })).toBeGreaterThan(stand * 10);
    expect(computeSpread(k, { ...base, crouchAmt: 1 })).toBeLessThan(stand);
    expect(computeSpread(k, { ...base, landPenalty: 1 })).toBeGreaterThan(stand);
    const lg = WEAPONS.longglass;
    expect(computeSpread(lg, { ...base, scoped: true })).toBeLessThan(computeSpread(lg, base) / 50);
  });

  it('armor, helmet, hit zones and falloff follow weapon data', () => {
    const aster = WEAPONS.aster;
    const krait = WEAPONS.krait;
    // helmet headshot: Aster lethal only close, Krait lethal far
    expect(computeDamage(aster, 'head', 10, 1, 100, true).health).toBeGreaterThanOrEqual(100);
    expect(computeDamage(aster, 'head', 45, 1, 100, true).health).toBeLessThan(100);
    expect(computeDamage(krait, 'head', 45, 1, 100, true).health).toBeGreaterThanOrEqual(100);
    // vest reduces torso damage, legs are never armored
    expect(computeDamage(aster, 'chest', 10, 1, 100, false).health).toBeLessThan(computeDamage(aster, 'chest', 10, 1, 0, false).health);
    expect(computeDamage(aster, 'leg', 10, 1, 100, true).armored).toBe(false);
    // Longglass: lethal to the torso, not to the legs
    const lg = WEAPONS.longglass;
    expect(computeDamage(lg, 'chest', 30, 1, 100, true).health).toBeGreaterThanOrEqual(100);
    expect(computeDamage(lg, 'leg', 30, 1, 100, true).health).toBeLessThan(100);
    // Sable: two hits to the armored body
    const s = computeDamage(WEAPONS.sable, 'chest', 20, 1, 100, true).health;
    expect(s).toBeLessThan(100);
    expect(s * 2).toBeGreaterThanOrEqual(100);
  });

  it('bullets penetrate tagged drywall/glass with damage loss and stop at concrete', () => {
    // through the penetrable service wall into Turbine Hall
    const o = { x: -22, y: 1.4, z: 0 };
    const d = { x: -1, y: 0, z: 0 };
    const segs = traceWorld(map, o, d, 40, WEAPONS.krait.penetration);
    expect(segs.length).toBeGreaterThan(1);
    expect(segs[1].powerMul).toBeLessThan(1);
    expect(segs[1].powerMul).toBeGreaterThan(0.2);
    // weak SMG barely gets through; sidearm-class penetration gets less
    const weak = traceWorld(map, o, d, 40, 0.5);
    expect(weak.length).toBe(1);
    // concrete: from the Atrium straight into a solid wall
    const c = traceWorld(map, { x: 0, y: 1.4, z: 30 }, { x: 0, y: 0, z: 1 }, 40, 3);
    expect(c.length).toBe(1);
  });

  it('hit zones: head box above chest, crouch lowers the head', () => {
    const pose = { x: 0, y: 0, z: 5, yaw: 0, crouch: 0 };
    const head = rayHitboxes({ x: 0, y: 1.63, z: 0 }, { x: 0, y: 0, z: 1 }, pose, 20);
    const chest = rayHitboxes({ x: 0, y: 1.3, z: 0 }, { x: 0, y: 0, z: 1 }, pose, 20);
    expect(head?.zone).toBe('head');
    expect(chest?.zone).toBe('chest');
    const crouched = rayHitboxes({ x: 0, y: 1.63, z: 0 }, { x: 0, y: 0, z: 1 }, { ...pose, crouch: 1 }, 20);
    expect(crouched).toBeNull();
  });
});

describe('authoritative weapon state', () => {
  it('rate of fire matches the weapon rpm while holding fire', () => {
    const room = makeRoom();
    toLive(room);
    const a = room.players[0];
    a.primary = { uid: 999, id: 'aster', mag: 30, reserve: 90, fired: false, buyer: 0, boughtRound: 1 };
    room.setActive(a, 'primary');
    run(room, 70); // draw time
    const before = a.primary.mag;
    run(room, TICK_RATE, { 0: { buttons: BTN.FIRE, pitch: 0.3 } });
    const fired = before - a.primary.mag;
    expect(fired).toBeGreaterThanOrEqual(Math.floor(WEAPONS.aster.rpm / 60) - 1);
    expect(fired).toBeLessThanOrEqual(Math.ceil(WEAPONS.aster.rpm / 60) + 1);
  });

  it('reload transfers ammo only after the magazine-seated stage', () => {
    const room = makeRoom();
    toLive(room);
    const a = room.players[0];
    a.secondary!.mag = 3;
    run(room, 60);
    run(room, 1, { 0: { buttons: BTN.RELOAD } });
    const stageTicks = Math.floor(WEAPONS.vela.reloadTime * WEAPONS.vela.magInAt * TICK_RATE) - 4;
    run(room, stageTicks);
    expect(a.secondary!.mag).toBe(3);
    // interrupt by switching weapons before seating: nothing transferred
    run(room, 1, { 0: { select: 'tool' } });
    expect(a.secondary!.mag).toBe(3);
    run(room, 1, { 0: { select: 'secondary' } });
    run(room, 60);
    run(room, 1, { 0: { buttons: BTN.RELOAD } });
    run(room, Math.ceil(WEAPONS.vela.reloadTime * TICK_RATE) + 2);
    expect(a.secondary!.mag).toBe(15);
    expect(a.secondary!.reserve).toBe(45 - 12);
  });

  it('a hitscan shot to the head through open air kills an unarmored target', () => {
    const room = makeRoom();
    toLive(room);
    const a = room.players[0];
    const b = room.players[1];
    teleport(a, -38, -24);
    teleport(b, -38, -12);
    a.primary = { uid: 1001, id: 'krait', mag: 30, reserve: 90, fired: false, buyer: 0, boughtRound: 1 };
    room.setActive(a, 'primary');
    run(room, 80);
    const ang = aimAt(room, a, { x: b.pos.x, y: b.pos.y + 1.63, z: b.pos.z });
    run(room, 2, { 0: { buttons: BTN.FIRE, ...ang } });
    expect(b.alive).toBe(false);
    expect(a.stats.kills).toBe(1);
    expect(a.stats.headshots).toBe(1);
  });

  it('cannot fire during the buy phase', () => {
    const room = makeRoom();
    const a = room.players[0];
    run(room, 60);
    run(room, 10, { 0: { buttons: BTN.FIRE } });
    expect(a.secondary!.mag).toBe(15);
  });
});

describe('movement', () => {
  const settle = (room: ReturnType<typeof makeRoom>, buttons: number, ticks = TICK_RATE * 2) => {
    const a = room.players[0];
    run(room, ticks, { 0: { buttons, yaw: Math.PI / 2 } });
    return Math.hypot(a.vel.x, a.vel.z);
  };

  it('top speed depends on the carried weapon; walk 52%, crouch 40%', () => {
    const room = makeRoom();
    toLive(room);
    const a = room.players[0];
    teleport(a, -32, -31); // long open Freight Lane, running +X
    room.setActive(a, 'tool');
    expect(settle(room, BTN.FWD, 40)).toBeCloseTo(5.5, 1);
    teleport(a, -32, -31);
    room.setActive(a, 'secondary');
    expect(settle(room, BTN.FWD, 40)).toBeCloseTo(5.2, 1);
    teleport(a, -32, -31);
    expect(settle(room, BTN.FWD | BTN.WALK, 40)).toBeCloseTo(5.2 * PLAYER.walkMult, 1);
    teleport(a, -32, -31);
    expect(settle(room, BTN.FWD | BTN.CROUCH, 40)).toBeCloseTo(5.2 * PLAYER.crouchMult, 1);
  });

  it('counter-strafe stops faster than it accelerates', () => {
    const room = makeRoom();
    toLive(room);
    const a = room.players[0];
    teleport(a, -32, -31);
    settle(room, BTN.FWD, 40);
    let t = 0;
    while (Math.hypot(a.vel.x, a.vel.z) > 0.45 && t < 100) {
      run(room, 1, { 0: { buttons: 0, yaw: Math.PI / 2 } });
      t++;
    }
    expect(t * DT).toBeLessThan(0.2);
  });

  it('jump apex is about 0.78 m and walls block movement', () => {
    expect((jumpVelocity() ** 2) / (2 * PLAYER.gravity)).toBeCloseTo(0.78, 2);
    const room = makeRoom();
    toLive(room);
    const a = room.players[0];
    teleport(a, -20, -31);
    run(room, 1, { 0: { buttons: BTN.JUMP } });
    let maxY = 0;
    for (let i = 0; i < 40; i++) {
      run(room, 1);
      maxY = Math.max(maxY, a.pos.y);
    }
    expect(maxY).toBeGreaterThan(0.7);
    expect(maxY).toBeLessThan(0.85);
    // run into the yard's south wall (z = -38)
    teleport(a, 0, -36);
    run(room, TICK_RATE * 2, { 0: { buttons: BTN.FWD, yaw: Math.PI } });
    expect(a.pos.z).toBeGreaterThanOrEqual(-38 + PLAYER.radius - 0.01);
  });

  it('stairs step up onto the gantry; crouch is required in the crawl', () => {
    const room = makeRoom();
    toLive(room);
    const a = room.players[0];
    teleport(a, -44, -2);
    room.setActive(a, 'tool');
    run(room, TICK_RATE * 3, { 0: { buttons: BTN.FWD, yaw: 0 } });
    expect(a.pos.y).toBeCloseTo(3.2, 1);
    // crawl: standing player is blocked by the 1.35 m ceiling, crouched passes
    teleport(a, 34, -13);
    run(room, TICK_RATE * 2, { 0: { buttons: BTN.FWD, yaw: Math.PI / 2 } });
    expect(a.pos.x).toBeLessThan(36.2);
    run(room, TICK_RATE * 3, { 0: { buttons: BTN.FWD | BTN.CROUCH, yaw: Math.PI / 2 } });
    expect(a.pos.x).toBeGreaterThan(38);
  });

  it('crouch toggles are rate limited', () => {
    const room = makeRoom();
    toLive(room);
    const a = room.players[0];
    let toggles = 0;
    let prev = a.crouchHeld;
    for (let i = 0; i < TICK_RATE; i++) {
      run(room, 1, { 0: { buttons: i % 2 ? BTN.CROUCH : 0 } });
      if (a.crouchHeld !== prev) toggles++;
      prev = a.crouchHeld;
    }
    expect(toggles).toBeLessThanOrEqual(PLAYER.maxCrouchTogglesPerSec * 2 + 1);
  });
});
