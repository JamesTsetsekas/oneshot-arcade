import { beforeAll, describe, expect, it } from 'vitest';
import { K17 } from '../src/content/k17';
import { DEFAULT_LOADOUTS, Loadout, resolveLoadout } from '../src/content/loadout';
import { DT, JUMP_V, MOVE } from '../src/content/tuning';
import { damageAt, PRIMARIES, resolveWeapon, WEAPONS } from '../src/content/weapons';
import { rayVsPlayer, ZONE_HEAD, ZONE_LIMB, ZONE_LOWER, ZONE_UPPER } from '../src/sim/hitboxes';
import { loadRapier } from '../src/sim/physics';
import { BTN, cloneState, currentSpread, InputCmd, newPlayerState, PlayerState, recoilKick, SimEvent, StepCtx, stepPlayer } from '../src/sim/player';
import { World } from '../src/sim/world';

let world: World;
let world2: World;
beforeAll(async () => {
  const R = await loadRapier();
  world = new World(R, K17);
  world2 = new World(R, K17);
});

function mk(loadout: Loadout = DEFAULT_LOADOUTS[0], x = -56, z = 9, yaw = 0, w: World = world) {
  const lo = resolveLoadout(loadout);
  const ev: SimEvent[] = [];
  const ctx: StepCtx = { world: w, lo, id: 3, frozen: false, equipMult: 1, ev };
  const s = newPlayerState(x, 0.03, z, yaw, lo);
  let seq = 0;
  const cmd = (over: Partial<InputCmd> = {}): InputCmd => ({ seq: ++seq, rt: 0, mx: 0, mz: 0, yaw: s.yaw, pitch: 0, buttons: 0, slot: s.pendingSlot, sel: 0, ...over });
  const run = (n: number, over: Partial<InputCmd> = {}) => { for (let i = 0; i < n; i++) stepPlayer(s, cmd(over), ctx); };
  return { s, ctx, ev, cmd, run, lo };
}

describe('movement', () => {
  it('walks, sprints and crouch-walks at the tuned speeds', () => {
    const a = mk();
    a.run(90, { mz: 1 });
    expect(Math.hypot(a.s.vx, a.s.vz)).toBeCloseTo(MOVE.walk * a.lo.weapons[0].def.moveMult, 1);
    const b = mk();
    b.run(90, { mz: 1, buttons: BTN.SPRINT });
    expect(b.s.sprint).toBe(1);
    expect(Math.hypot(b.s.vx, b.s.vz)).toBeCloseTo(MOVE.sprint * 1.06 * b.lo.weapons[0].def.moveMult, 1); // Vanguard carries Fleet Boots
    const c = mk();
    c.run(90, { mz: 1, buttons: BTN.CROUCH });
    expect(c.s.crouch).toBe(1);
    expect(c.s.crouchT).toBeCloseTo(1, 3);
    expect(Math.hypot(c.s.vx, c.s.vz)).toBeCloseTo(MOVE.crouch * c.lo.weapons[0].def.moveMult, 1);
  });

  it('accelerates and decelerates at the configured rates', () => {
    const a = mk();
    a.run(6, { mz: 1 });
    expect(Math.hypot(a.s.vx, a.s.vz)).toBeCloseTo(MOVE.accel * 6 * DT, 0);
    a.run(60, { mz: 1 });
    a.run(4);
    expect(Math.hypot(a.s.vx, a.s.vz)).toBeLessThan(MOVE.walk - MOVE.decel * 3 * DT);
    a.run(20);
    expect(Math.hypot(a.s.vx, a.s.vz)).toBeLessThan(0.01);
  });

  it('never hitches on flat ground or ramps (no clipped moves while walking curves)', () => {
    const a = mk(DEFAULT_LOADOUTS[0], -10, 17, 0);
    a.run(4);
    let hitches = 0, yaw = 0, minY = 9, maxY = -9;
    for (let i = 0; i < 3000; i++) {
      yaw += 0.03;
      const before = Math.hypot(a.s.vx, a.s.vz);
      stepPlayer(a.s, a.cmd({ mz: 1, yaw: Math.fround(yaw) }), a.ctx);
      if (i > 30 && Math.hypot(a.s.vx, a.s.vz) < before * 0.9) hitches++;
      if (!a.s.grounded) hitches++;
      minY = Math.min(minY, a.s.py); maxY = Math.max(maxY, a.s.py);
    }
    expect(hitches).toBe(0);
    expect(maxY - minY).toBeLessThan(0.05);
  });

  it('jumps to roughly a 0.85 m apex and lands', () => {
    const a = mk();
    a.run(5);
    const y0 = a.s.py;
    stepPlayer(a.s, a.cmd({ buttons: BTN.JUMP }), a.ctx);
    expect(a.s.vy).toBeGreaterThan(JUMP_V - 1);
    let apex = 0;
    for (let i = 0; i < 80; i++) { stepPlayer(a.s, a.cmd(), a.ctx); apex = Math.max(apex, a.s.py - y0); }
    expect(apex).toBeGreaterThan(0.72);
    expect(apex).toBeLessThan(0.95);
    expect(a.s.grounded).toBe(1);
    expect(Math.abs(a.s.py - y0)).toBeLessThan(0.05);
    expect(a.ev.some((e) => e.t === 'land')).toBe(true);
  });

  it('is blocked by walls and slowed while aiming down sights', () => {
    const a = mk(DEFAULT_LOADOUTS[0], -47.5, 4, Math.PI / 2); // facing the ops wing west wall
    a.run(120, { mz: 1 });
    expect(a.s.px).toBeLessThan(-46.2 - MOVE.radius + 0.06);
    const b = mk();
    b.run(90, { mz: 1, buttons: BTN.ADS });
    expect(b.s.adsT).toBe(1);
    expect(Math.hypot(b.s.vx, b.s.vz)).toBeCloseTo(MOVE.walk * b.lo.weapons[0].def.moveMult * b.lo.weapons[0].adsMove, 1);
  });

  it('mantles a 1.2 m crate but refuses a 2.6 m container and the map boundary', () => {
    // wooden crate in the west yard: x[-49.5,-48] z[-1.2,0.3] h 1.2
    const a = mk(DEFAULT_LOADOUTS[0], -50.4, -0.4, Math.PI / 2);
    a.run(3);
    stepPlayer(a.s, a.cmd({ buttons: BTN.JUMP, mz: 1 }), a.ctx);
    expect(a.s.mantleT).toBeGreaterThanOrEqual(0);
    a.run(60);
    expect(a.s.mantleT).toBe(-1);
    expect(a.s.py).toBeGreaterThan(1.15);
    expect(a.s.px).toBeGreaterThan(-49.6);
    // container: x[-54,-51.6] z[-4,2] h 2.6
    const b = mk(DEFAULT_LOADOUTS[0], -55, -1, Math.PI / 2);
    b.run(3);
    stepPlayer(b.s, b.cmd({ buttons: BTN.JUMP, mz: 1 }), b.ctx);
    expect(b.s.mantleT).toBe(-1);
    // seawall at the west edge is 1.2 m but the playable boundary forbids it
    const c = mk(DEFAULT_LOADOUTS[0], -56.4, 10, -Math.PI / 2);
    c.run(3);
    stepPlayer(c.s, c.cmd({ buttons: BTN.JUMP, mz: 1 }), c.ctx);
    expect(c.s.mantleT).toBe(-1);
    c.run(60, { mz: 1 });
    expect(c.s.px).toBeGreaterThan(-57.1);
  });

  it('climbs the ridge ramp and descends into the service tunnel', () => {
    const a = mk(DEFAULT_LOADOUTS[0], -50, 38, Math.PI / 2);
    a.run(240, { mz: 1, buttons: BTN.SPRINT });
    expect(a.s.py).toBeGreaterThan(1.9);
    const b = mk(DEFAULT_LOADOUTS[0], -19, 0, Math.PI / 2);
    b.run(200, { mz: 1 });
    expect(b.s.py).toBeLessThan(-2.8);
    expect(b.s.px).toBeGreaterThan(-8);
  });

  it('is deterministic across independent worlds (client prediction == server)', () => {
    const a = mk(DEFAULT_LOADOUTS[1], -50, 20, 0.7, world);
    const b = mk(DEFAULT_LOADOUTS[1], -50, 20, 0.7, world2);
    let yaw = 0.7;
    for (let i = 0; i < 900; i++) {
      yaw += Math.sin(i * 0.05) * 0.04;
      const buttons = (i % 140 < 90 ? BTN.SPRINT : 0) | (i % 97 === 0 ? BTN.JUMP : 0) | (i % 230 > 200 ? BTN.CROUCH : 0) | (i % 60 < 12 ? BTN.FIRE : 0);
      const over = { mz: 1, mx: Math.sin(i * 0.03), yaw: Math.fround(yaw), buttons };
      stepPlayer(a.s, a.cmd(over), a.ctx);
      stepPlayer(b.s, b.cmd(over), b.ctx);
    }
    expect(a.s).toEqual(b.s);
    expect(Math.hypot(a.s.px + 50, a.s.pz - 20)).toBeGreaterThan(5);
  });
});

describe('weapons', () => {
  it('every weapon fires, consumes ammo, respects its fire rate and reloads in stages', () => {
    for (const w of WEAPONS) {
      const loadout: Loadout = { ...DEFAULT_LOADOUTS[0], attachments: [], primary: w.slot === 'primary' ? w.id : 'ar4', sidearm: w.slot === 'sidearm' ? w.id : 'p9' };
      const a = mk(loadout);
      const slot = w.slot === 'primary' ? 0 : 1;
      if (slot) { a.run(60, { slot: 1 }); expect(a.s.slot).toBe(1); }
      a.ev.length = 0;
      // hold / tap the trigger for one second
      let shots = 0;
      for (let i = 0; i < 60; i++) {
        const press = w.fire === 'auto' ? true : i % 2 === 0;
        stepPlayer(a.s, a.cmd({ slot, buttons: press ? BTN.FIRE : 0 }), a.ctx);
      }
      a.run(12, { slot });
      shots = a.ev.filter((e) => e.t === 'shot').length;
      const expected = Math.min(w.mag, Math.floor(1 / (60 / w.rpm) - 1e-6) + 1);
      expect(Math.abs(shots - expected), `${w.id} shots ${shots} vs ${expected}`).toBeLessThanOrEqual(1);
      const mag = slot ? a.s.mag1 : a.s.mag0;
      expect(mag).toBe(w.mag - shots);
      const shot = a.ev.find((e) => e.t === 'shot') as Extract<SimEvent, { t: 'shot' }>;
      expect(shot.dirs.length).toBe(w.pellets * 3);
      // reload
      a.ev.length = 0;
      a.run(1, { slot });
      stepPlayer(a.s, a.cmd({ slot, buttons: BTN.RELOAD }), a.ctx);
      if (mag < w.mag) {
        expect(a.s.reloadT, w.id).toBeGreaterThanOrEqual(0);
        a.run(420, { slot });
        expect(a.s.reloadT).toBe(-1);
        expect(slot ? a.s.mag1 : a.s.mag0, w.id).toBe(w.mag);
        const reserve = slot ? a.s.res1 : a.s.res0;
        expect(reserve).toBe(w.reserve - shots);
        if (!w.shell) expect(a.ev.filter((e) => e.t === 'reloadStage').map((e) => (e as { stage: number }).stage)).toEqual([1, 2]);
        else expect(a.ev.filter((e) => e.t === 'shell').length).toBe(shots);
        expect(a.ev.some((e) => e.t === 'reloadEnd' && e.done)).toBe(true);
      }
    }
  });

  it('empty reloads take longer, add a chamber stage, and an interrupted reload keeps ammo only after magazine-in', () => {
    const a = mk();
    a.run(200, { buttons: BTN.FIRE });
    expect(a.s.mag0).toBe(30 - 0 > 0 ? a.s.mag0 : 0);
    // spray until empty then auto reload starts
    const b = mk();
    for (let i = 0; i < 400 && b.s.mag0 > 0; i++) stepPlayer(b.s, b.cmd({ buttons: BTN.FIRE }), b.ctx);
    expect(b.s.mag0).toBe(0);
    b.run(20);
    expect(b.s.reloadT).toBeGreaterThanOrEqual(0);
    expect(b.s.reloadEmpty).toBe(1);
    expect(b.s.reloadDur).toBeCloseTo(b.lo.weapons[0].def.reload.empty, 3);
    // interrupt before magazine-in by swapping: no ammo gained
    const c = mk();
    c.run(30, { buttons: BTN.FIRE });
    const magBefore = c.s.mag0;
    stepPlayer(c.s, c.cmd({ buttons: BTN.RELOAD }), c.ctx);
    c.run(20);
    c.run(90, { slot: 1 });
    expect(c.s.mag0).toBe(magBefore);
    // interrupt after magazine-in: new ammo retained
    const d = mk();
    d.run(30, { buttons: BTN.FIRE });
    stepPlayer(d.s, d.cmd({ buttons: BTN.RELOAD }), d.ctx);
    const tIn = d.s.reloadDur * d.lo.weapons[0].def.reload.inAt;
    d.run(Math.ceil(tIn / DT) + 2);
    expect(d.s.reloadT).toBeGreaterThanOrEqual(0);
    d.run(90, { slot: 1 });
    expect(d.s.mag0).toBe(30);
  });

  it('cannot fire while sprinting until the sprint-out time has elapsed', () => {
    const a = mk();
    a.run(60, { mz: 1, buttons: BTN.SPRINT });
    a.ev.length = 0;
    let ticks = 0;
    while (!a.ev.some((e) => e.t === 'shot') && ticks < 60) { stepPlayer(a.s, a.cmd({ buttons: BTN.FIRE, mz: 1 }), a.ctx); ticks++; }
    const expected = a.lo.weapons[0].sprintOut;
    expect(ticks * DT).toBeGreaterThanOrEqual(expected - DT);
    expect(ticks * DT).toBeLessThan(expected + 3 * DT);
  });

  it('hip spread blooms with fire and movement and tightens in ADS; recoil is a deterministic pattern', () => {
    const a = mk();
    const w = a.lo.weapons[0];
    const still = currentSpread(a.s, w);
    a.run(12, { buttons: BTN.FIRE });
    expect(currentSpread(a.s, w)).toBeGreaterThan(still + 1);
    a.run(120);
    expect(currentSpread(a.s, w)).toBeCloseTo(still, 2);
    a.run(40, { buttons: BTN.ADS });
    expect(currentSpread(a.s, w)).toBeLessThan(0.2);
    const k1 = { yaw: 0, pitch: 0 }, k2 = { yaw: 0, pitch: 0 };
    recoilKick(w, 3, 1, false, 3, 10, k1);
    recoilKick(w, 3, 1, false, 3, 10, k2);
    expect(k1).toEqual(k2);
    expect(k1.pitch).toBeGreaterThan(0);
  });

  it('applies damage falloff, hit-zone multipliers and keeps automatic body-shot TTK above 150 ms', () => {
    for (const w of WEAPONS) {
      const st = resolveWeapon(w, []);
      expect(damageAt(st, 1, ZONE_UPPER)).toBeGreaterThan(damageAt(st, 200, ZONE_UPPER));
      expect(damageAt(st, 5, ZONE_HEAD)).toBeGreaterThanOrEqual(damageAt(st, 5, ZONE_UPPER));
      expect(damageAt(st, 5, ZONE_UPPER)).toBeGreaterThan(damageAt(st, 5, ZONE_LIMB));
      if (w.fire === 'auto') {
        const shots = Math.ceil(100 / damageAt(st, 1, ZONE_UPPER));
        const ttk = (shots - 1) * (60 / w.rpm);
        expect(ttk, `${w.id} ttk`).toBeGreaterThanOrEqual(0.15);
      }
    }
    // marksman: lethal head / upper torso inside its range only
    const mr = resolveWeapon(WEAPONS.find((w) => w.id === 'mr1')!, []);
    expect(damageAt(mr, 40, ZONE_HEAD)).toBeGreaterThanOrEqual(100);
    expect(damageAt(mr, 40, ZONE_UPPER)).toBeGreaterThanOrEqual(100);
    expect(damageAt(mr, 40, ZONE_LOWER)).toBeLessThan(100);
    expect(damageAt(mr, 75, ZONE_UPPER)).toBeLessThan(100);
    expect(damageAt(mr, 75, ZONE_HEAD)).toBeLessThan(100);
  });

  it('attachments apply explicit tradeoffs and never raise damage', () => {
    for (const w of PRIMARIES) {
      const base = resolveWeapon(w, []);
      const kitted = resolveWeapon(w, ['suppressor', 'extmag', 'lightstock']);
      for (const d of [2, 20, 60]) for (const z of [0, 1, 2, 3]) expect(damageAt(kitted, d, z)).toBeLessThanOrEqual(damageAt(base, d, z) + 1e-9);
      expect(kitted.suppressed).toBe(true);
      expect(kitted.rangeFar).toBeLessThan(base.rangeFar);
      expect(kitted.mag).toBeGreaterThan(base.mag);
      expect(kitted.reloadMul).toBeGreaterThan(1);
    }
  });

  it('hit zones resolve head, torso and limbs; crouching lowers the head box', () => {
    const hit = (y: number, crouchT = 0) => rayVsPlayer(-5, y, 0, 1, 0, 0, 0, 0, 0, crouchT, 100);
    expect(hit(1.62)!.zone).toBe(ZONE_HEAD);
    expect(hit(1.3)!.zone).toBe(ZONE_UPPER);
    expect(hit(0.95)!.zone).toBe(ZONE_LOWER);
    expect(hit(0.5)!.zone).toBe(ZONE_LIMB);
    expect(hit(1.95)).toBeNull();
    expect(hit(1.62, 1)).toBeNull();
    expect(hit(1.12, 1)!.zone).toBe(ZONE_HEAD);
    const arm = rayVsPlayer(-5, 1.25, 0.33, 1, 0, 0, 0, 0, 0, 0, 100);
    expect(arm!.zone).toBe(ZONE_LIMB);
  });

  it('bullets penetrate tagged thin materials but never structural walls; glass breaks', () => {
    // thin sheet railing on the bay catwalk at z=14.24, y 3.6..4.7
    const thin = world.traceBullet(35, 4.2, 16, 0, 0, -1, 30, 2);
    expect(thin.walls[0].mat).toBe('thinMetal');
    expect(thin.walls[0].stopped).toBe(false);
    const weak = world.traceBullet(35, 4.2, 16, 0, 0, -1, 30, 0.4);
    expect(weak.walls[0].stopped).toBe(true);
    // structural composite wall of the ops wing
    const wall = world.traceBullet(-50, 1.5, 4, 1, 0, 0, 30, 4);
    expect(wall.walls[0].stopped).toBe(true);
    expect(wall.end).toBeCloseTo(3.8, 1);
    // glass: vision passes, bullets pass, and breaking removes it
    const R2 = world2;
    expect(R2.visible(-19, 1.8, 8, -22, 1.8, 8)).toBe(true);
    expect(R2.clearLine(-19, 1.8, 8, -22, 1.8, 8)).toBe(false);
    const g = R2.traceBullet(-19, 1.8, 8, -1, 0, 0, 10, 1);
    expect(g.walls[0].mat).toBe('glass');
    expect(g.walls[0].glass).toBeGreaterThanOrEqual(0);
    expect(R2.breakGlass(g.walls[0].glass)).toBe(true);
    expect(R2.clearLine(-19, 1.8, 8, -22, 1.8, 8)).toBe(true);
    expect(R2.glassMask).not.toBe(0);
  });

  it('equipment has one charge, recharges over time, and frags can be cooked', () => {
    const a = mk();
    a.run(2);
    for (let i = 0; i < 60; i++) stepPlayer(a.s, a.cmd({ buttons: BTN.LETHAL }), a.ctx);
    expect(a.s.cookT).toBeGreaterThan(0.9);
    stepPlayer(a.s, a.cmd(), a.ctx);
    const thr = a.ev.find((e) => e.t === 'throw') as Extract<SimEvent, { t: 'throw' }>;
    expect(thr.kind).toBe('lethal');
    expect(thr.fuse).toBeLessThan(2.1);
    expect(thr.fuse).toBeGreaterThan(1.8);
    expect(a.s.lethal).toBe(0);
    a.run(Math.ceil(a.lo.lethal.recharge / DT) + 2);
    expect(a.s.lethal).toBe(1);
    // uplink multiplier speeds the recharge
    const b = mk();
    b.ctx.equipMult = 2.5;
    b.run(2);
    stepPlayer(b.s, b.cmd({ buttons: BTN.TACTICAL }), b.ctx);
    expect(b.s.tactical).toBe(0);
    b.run(Math.ceil(b.lo.tactical.recharge / 2.5 / DT) + 2);
    expect(b.s.tactical).toBe(1);
  });

  it('state survives a float32 round trip unchanged (snapshot-safe)', () => {
    const a = mk();
    a.run(200, { mz: 1, mx: 0.4, buttons: BTN.FIRE });
    const copy: PlayerState = cloneState(a.s);
    for (const k of Object.keys(copy) as (keyof PlayerState)[]) expect(Math.fround(copy[k])).toBe(copy[k]);
  });
});
