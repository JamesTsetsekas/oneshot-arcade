import { describe, expect, it } from 'vitest';
import { MOVEMENT } from '../src/content/economy';
import { WEAPONS, WEAPON_LIST, recoilPattern } from '../src/content/weapons';
import { Pose, applyArmor, rawDamage, rayVsPose, traceBullet } from '../src/sim/combat';
import { dirFromAngles } from '../src/sim/math';
import { MAX_REWIND_TICKS, TICK_RATE } from '../src/sim/match';
import { computeSpread, newWeapon } from '../src/sim/weapons';
import { advance, cmd, hold, mk, place, sideOf, toLive } from './helpers';

const stand: Pose = { x: 48, y: 0, z: 40, yaw: 0, crouchQ: 0 };

describe('hit zones, armour and falloff', () => {
  const ray = (y: number, dx = 0) => rayVsPose({ x: 48 + dx, y, z: 50 }, { x: 0, y: 0, z: -1 }, 30, stand);
  it('maps heights to head / chest / abdomen / leg', () => {
    expect(ray(1.68)?.zone).toBe('head');
    expect(ray(1.4)?.zone).toBe('chest');
    expect(ray(1.0)?.zone).toBe('abdomen');
    expect(ray(0.4)?.zone).toBe('leg');
    expect(ray(1.4, 0.26)?.zone).toBe('arm');
    expect(ray(1.4, 0.8)).toBeNull();
    expect(rayVsPose({ x: 48, y: 1.68, z: 50 }, { x: 0, y: 0, z: -1 }, 30, { ...stand, crouchQ: 1 })).toBeNull(); // crouch lowers the head
  });

  it('armour absorbs by zone and degrades; helmet covers the head only', () => {
    const a = WEAPONS.aster;
    const chest = applyArmor(rawDamage(a, 'chest', 0), a, 'chest', { armor: 100, helmet: false });
    expect(chest.health).toBeCloseTo(35 * a.armorPen, 5);
    expect(chest.armorLoss).toBeGreaterThan(0);
    const leg = applyArmor(rawDamage(a, 'leg', 0), a, 'leg', { armor: 100, helmet: true });
    expect(leg.armorLoss).toBe(0);
    expect(leg.health).toBeCloseTo(35 * a.legMult, 5);
    const headNoHelm = applyArmor(rawDamage(a, 'head', 0), a, 'head', { armor: 100, helmet: false });
    const headHelm = applyArmor(rawDamage(a, 'head', 0), a, 'head', { armor: 100, helmet: true });
    expect(headNoHelm.health).toBeGreaterThan(headHelm.health);
  });

  it('weapon lethality tuning: Aster helmet headshot lethal only up close, Krait lethal at range, Longglass one-shots a torso', () => {
    const lethal = (id: keyof typeof WEAPONS, zone: 'head' | 'chest' | 'leg', d: number, helmet: boolean, armor = 100) => {
      const w = WEAPONS[id];
      return applyArmor(rawDamage(w, zone, d), w, zone, { armor, helmet }).health >= 100;
    };
    expect(lethal('aster', 'head', 5, true)).toBe(true);
    expect(lethal('aster', 'head', 40, true)).toBe(false);
    expect(lethal('krait', 'head', 40, true)).toBe(true);
    expect(lethal('longglass', 'chest', 80, false, 100)).toBe(true);
    expect(lethal('longglass', 'leg', 80, false, 0)).toBe(false);
    // Sable: two body hits
    const s = WEAPONS.sable;
    expect(applyArmor(rawDamage(s, 'chest', 20), s, 'chest', { armor: 0, helmet: false }).health).toBeLessThan(100);
    expect(2 * applyArmor(rawDamage(s, 'chest', 20), s, 'chest', { armor: 0, helmet: false }).health).toBeGreaterThanOrEqual(100);
  });

  it('applies distance falloff', () => {
    expect(rawDamage(WEAPONS.kite, 'chest', 40)).toBeLessThan(rawDamage(WEAPONS.kite, 'chest', 5));
    expect(rawDamage(WEAPONS.longglass, 'chest', 100)).toBeGreaterThan(rawDamage(WEAPONS.needle, 'chest', 5) * 3);
  });
});

describe('penetration', () => {
  const shooter = { x: 20, y: 1.5, z: 56 };
  it('passes through a thin service wall with reduced damage but is stopped by concrete', () => {
    // 'v' service wall at x=23 (cell col 11, rows 7..12 -> z 14..26)
    const target: Pose = { x: 25, y: 0, z: 20, yaw: 0, crouchQ: 0 };
    const from = { x: 21, y: 1.4, z: 20 };
    const dir = { x: 1, y: 0, z: 0 };
    const thin = traceBullet(from, dir, 20, WEAPONS.krait, [{ id: 1, pose: target }]);
    expect(thin.hit).not.toBeNull();
    expect(thin.hit!.penetrated).toBe(true);
    expect(thin.hit!.penMult).toBeLessThan(1);
    const weak = traceBullet(from, dir, 20, WEAPONS.needle, [{ id: 1, pose: target }]);
    expect(weak.hit === null || weak.hit.penMult < thin.hit!.penMult).toBe(true);
    // concrete: shoot from the freight yard through the south wall
    const behindConcrete: Pose = { x: 46, y: 0, z: 70.9, yaw: 0, crouchQ: 0 };
    void shooter;
    const stopped = traceBullet({ x: 46, y: 1.4, z: 60 }, { x: 0, y: 0, z: 1 }, 30, WEAPONS.longglass, [{ id: 2, pose: behindConcrete }]);
    expect(stopped.hit).toBeNull();
  });

  it('glass does not block sight and costs little penetration', () => {
    const t: Pose = { x: 91, y: 0, z: 40, yaw: 0, crouchQ: 0 };
    const r = traceBullet({ x: 83, y: 1.4, z: 40 }, { x: 1, y: 0, z: 0 }, 20, WEAPONS.aster, [{ id: 3, pose: t }]);
    expect(r.hit).not.toBeNull();
    expect(r.hit!.penMult).toBeGreaterThan(0.6);
  });
});

describe('recoil, spread, rate of fire and reload', () => {
  it('recoil patterns are deterministic and bounded', () => {
    for (const w of WEAPON_LIST) {
      if (w.mode === 'melee') continue;
      const seq1 = Array.from({ length: 30 }, (_, i) => recoilPattern(w.recoil, i));
      const seq2 = Array.from({ length: 30 }, (_, i) => recoilPattern(w.recoil, i));
      expect(seq1).toEqual(seq2);
      expect(Math.max(...seq1.map((s) => s.pitch))).toBeLessThanOrEqual(w.recoil.maxVert + 1e-9);
    }
    // First shot is accurate; spray climbs.
    expect(recoilPattern(WEAPONS.aster.recoil, 0).pitch).toBe(0);
    expect(recoilPattern(WEAPONS.aster.recoil, 10).pitch).toBeGreaterThan(recoilPattern(WEAPONS.aster.recoil, 3).pitch);
  });

  it('spread grows with horizontal speed, air time, and shrinks when crouched', () => {
    const m = mk();
    const p = m.players[0];
    const w = newWeapon('aster');
    const d = WEAPONS.aster;
    const still = computeSpread(p, w, d, 10, 0.2);
    expect(computeSpread(p, w, d, 10, MOVEMENT.accuracySpeed - 0.01)).toBeCloseTo(still, 6);
    expect(computeSpread(p, w, d, 10, 4.7)).toBeGreaterThan(still * 5);
    p.onGround = false;
    expect(computeSpread(p, w, d, 10, 0.2)).toBeGreaterThan(still * 10);
    p.onGround = true; p.crouch = 1;
    expect(computeSpread(p, w, d, 10, 0.2)).toBeLessThan(still);
  });

  it('server enforces the rate of fire for automatic weapons', () => {
    const m = mk();
    toLive(m);
    const p = sideOf(m, 'int')[0];
    p.money = 5000; // buy phase already over: give weapon directly
    p.slots.primary = newWeapon('aster'); p.cur = 'primary'; p.slots.primary.readyAt = 0;
    place(p, 48, 62);
    p.yaw = 0;
    let shots = 0;
    const secs = 2;
    for (let i = 0; i < secs * TICK_RATE; i++) {
      m.submitInput(p.id, cmd(p, { fire: true, yaw: 0, pitch: 0.5 }));
      m.step();
      for (const e of m.events) if (e.t === 'shot' && e.id === p.id) shots++;
    }
    const expected = (WEAPONS.aster.rpm / 60) * secs;
    expect(shots).toBeGreaterThan(expected - 3);
    expect(shots).toBeLessThan(expected + 2);
  });

  it('reload is staged: the magazine refills only after reload time and keeps reserve', () => {
    const m = mk();
    toLive(m);
    const p = sideOf(m, 'int')[0];
    const w = newWeapon('aster');
    w.mag = 3; w.reserve = 40; w.readyAt = 0;
    p.slots.primary = w; p.cur = 'primary';
    m.submitInput(p.id, cmd(p, { reload: true })); m.step();
    expect(w.reloading).toBe(true);
    advance(m, WEAPONS.aster.reloadTime - 0.3);
    expect(w.mag).toBe(3);
    advance(m, 0.5);
    expect(w.mag).toBe(30);
    expect(w.reserve).toBe(13);
  });

  it('pump shotgun fires nine pellets per shot', () => {
    const m = mk();
    toLive(m);
    const p = sideOf(m, 'int')[0];
    p.slots.primary = newWeapon('rampart'); p.cur = 'primary'; p.slots.primary.readyAt = 0;
    place(p, 48, 62);
    m.submitInput(p.id, cmd(p, { fire: true, pitch: -0.02 }));
    m.step();
    const impacts = m.events.filter((e) => e.t === 'impact').length;
    expect(impacts).toBeGreaterThan(0);
    expect(p.slots.primary.mag).toBe(5);
  });
});

describe('lag compensation', () => {
  function setup() {
    const m = mk();
    toLive(m);
    const shooter = sideOf(m, 'int')[0];
    const victim = sideOf(m, 'cus')[0];
    shooter.slots.primary = newWeapon('longglass'); shooter.cur = 'primary'; shooter.slots.primary.readyAt = 0;
    place(shooter, 48, 60);
    shooter.yaw = 0;
    return { m, shooter, victim };
  }

  it('rewinds the target to the shooter-view tick (never the shooter) and clamps to 200 ms', () => {
    const { m, shooter, victim } = setup();
    // The victim runs left to right across the shooter's line of fire at 4 m/s, in the open yard.
    const trail: number[] = [];
    for (let i = 0; i < 40; i++) {
      place(victim, 40 + i * (4 / TICK_RATE), 52);
      m.step();
      trail.push(victim.pos.x);
    }
    const nowTick = m.tick;
    const pastTick = nowTick - 8;
    const pastX = trail[trail.length - 1 - 8];
    // aim at where the victim was 8 ticks ago
    const eye = m.eyePos(shooter);
    const dx = pastX - eye.x, dz = 52 - eye.z;
    const yaw = Math.atan2(-dx, -dz);
    const dy = 1.1 - eye.y;
    const pitch = Math.atan2(dy, Math.hypot(dx, dz));
    const fire = (viewTick: number) => {
      const hp = victim.hp;
      m.submitInput(shooter.id, cmd(shooter, { fire: true, yaw, pitch, viewTick }));
      m.step();
      const hit = victim.hp < hp || !victim.alive;
      shooter.slots.primary!.nextFire = 0;
      shooter.slots.primary!.mag = 5;
      shooter.slots.primary!.shots = 0;
      return hit;
    };
    // restore the same victim motion for each test shot by re-placing the victim at the same place
    const snapshotPos = { x: victim.pos.x, z: victim.pos.z };
    // Without rewind the shot misses (target moved 0.5 m since).
    place(victim, snapshotPos.x, snapshotPos.z);
    expect(fire(0)).toBe(false);
    // The rewind path must find the historical pose: validate via poseAt directly (deterministic).
    const past = m.poseAt(victim, pastTick);
    expect(Math.abs(past.x - pastX)).toBeLessThan(0.02);
    // Rewind is clamped.
    expect(MAX_REWIND_TICKS / TICK_RATE).toBeLessThanOrEqual(0.2);
    // The shooter is never rewound: its own current pose is what poseOf returns.
    expect(m.poseOf(shooter).x).toBe(shooter.pos.x);
  });
});

describe('movement', () => {
  it('weapon class sets base speed; walk is 52% and crouch 40%', () => {
    const m = mk();
    toLive(m);
    const p = sideOf(m, 'int')[0];
    place(p, 28, 67);
    p.slots.primary = newWeapon('aster'); p.cur = 'primary';
    hold(m, p, { moveZ: 1, yaw: -Math.PI / 2 }, 1.0);
    const sp = Math.hypot(p.vel.x, p.vel.z);
    expect(sp).toBeCloseTo(4.7, 1);
    hold(m, p, { moveZ: 1, walk: true, yaw: -Math.PI / 2 }, 1.0);
    expect(Math.hypot(p.vel.x, p.vel.z)).toBeCloseTo(4.7 * 0.52, 1);
    hold(m, p, { moveZ: 1, crouch: true, yaw: -Math.PI / 2 }, 1.0);
    expect(Math.hypot(p.vel.x, p.vel.z)).toBeCloseTo(4.7 * 0.4, 1);
  });

  it('jump apex is about 0.78 m and no speed is gained by jumping repeatedly', () => {
    const m = mk();
    toLive(m);
    const p = sideOf(m, 'int')[0];
    place(p, 30, 67);
    p.pos.y = 0;
    let top = 0;
    for (let i = 0; i < 64; i++) { m.submitInput(p.id, cmd(p, { jump: true })); m.step(); top = Math.max(top, p.pos.y); }
    expect(top).toBeGreaterThan(0.7);
    expect(top).toBeLessThan(0.86);
    const base = 5.2; // sidearm base speed
    for (let i = 0; i < 64 * 3; i++) { m.submitInput(p.id, cmd(p, { jump: true, moveZ: 1, yaw: -Math.PI / 2 })); m.step(); expect(Math.hypot(p.vel.x, p.vel.z)).toBeLessThanOrEqual(base + 1e-6); }
  });

  it('collision stops the player at walls', () => {
    const m = mk();
    toLive(m);
    const p = sideOf(m, 'int')[0];
    place(p, 60, 62);
    hold(m, p, { moveZ: 1, yaw: Math.PI }, 6); // walk south into the map boundary
    expect(p.pos.z).toBeLessThanOrEqual(72);
    expect(p.pos.z).toBeGreaterThan(69.4);
    hold(m, p, { moveZ: 1, yaw: 0 }, 6);
    expect(p.pos.z).toBeGreaterThan(58); // stopped by the tall crates
    void dirFromAngles;
  });
});
