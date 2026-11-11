import { describe, expect, it } from 'vitest';
import { DT, UTIL_TUNING } from '../src/content/rules';
import { ACCURATE_SPEED, BUYABLE_WEAPONS, WEAPONS, computeSpread, damageFalloff, fireInterval, recoilAt, type WeaponId } from '../src/content/weapons';
import { getAnnex } from '../src/map/annex';
import type { GameEvent } from '../src/protocol/types';
import { simulateThrow } from '../src/sim/grenades';
import { rayVsPlayer, type PlayerHit } from '../src/sim/hit';
import { eyeHeight } from '../src/sim/movement';
import { newWeapon, type Player } from '../src/sim/state';
import { BTN, captureEvents, makeRig, type Rig } from './harness';

type Shot = Extract<GameEvent, { t: 'shot' }>;

/** Puts a shooter and a target facing each other along +x in the Freight yard, in a live round. */
function duel(weapon: WeaponId, dist: number, opts: { armor?: boolean; helmet?: boolean } = {}, seed = 3): { r: Rig; s: Player; t: Player } {
  const r = makeRig({}, seed);
  r.toLive();
  const s = r.side('atk')[0];
  const t = r.side('def')[0];
  const d = WEAPONS[weapon];
  if (d.slot === 'primary') s.primary = newWeapon(weapon, 9000);
  else s.sidearm = newWeapon(weapon, 9000);
  r.match.switchSlot(s, d.slot === 'primary' ? 'primary' : 'sidearm', 0, true);
  s.drawEnd = 0;
  // z = 8.3 is a clear lane across the yard (no containers or crates)
  r.place(s, 33, 8.3, Math.PI / 2);
  r.place(t, 33 + dist, 8.3, -Math.PI / 2);
  t.armor = opts.armor ? 100 : 0;
  t.helmet = !!opts.helmet;
  return { r, s, t };
}

function aimAt(r: Rig, s: Player, t: Player, height: number): void {
  const ey = s.move.y + eyeHeight(s.move.crouch);
  const dx = t.move.x - s.move.x;
  const dz = t.move.z - s.move.z;
  r.hold[s.id].yaw = Math.atan2(dx, dz);
  r.hold[s.id].pitch = Math.atan2(t.move.y + height - ey, Math.hypot(dx, dz));
}

function fireOnce(r: Rig, s: Player): void {
  r.hold[s.id].buttons = BTN.FIRE;
  r.step(1);
  r.hold[s.id].buttons = 0;
  r.step(3);
}

describe('weapon table', () => {
  it('ships all twelve original firearms with sane data', () => {
    expect(BUYABLE_WEAPONS.length).toBe(12);
    for (const w of BUYABLE_WEAPONS) {
      expect(w.price).toBeGreaterThan(0);
      expect(w.mag).toBeGreaterThan(0);
      expect(w.recoil.length).toBeGreaterThan(0);
      expect(w.moveSpeed).toBeGreaterThanOrEqual(4.3);
      expect(w.moveSpeed).toBeLessThanOrEqual(5.2);
    }
    expect(WEAPONS.tool.moveSpeed).toBe(5.5);
    expect(WEAPONS.vela.moveSpeed).toBe(5.2);
    expect(WEAPONS.kite.moveSpeed).toBe(5.0);
    expect(WEAPONS.aster.moveSpeed).toBe(4.7);
    expect(WEAPONS.longglass.moveSpeed).toBe(4.3);
  });

  it('keeps recoil paths fixed and learnable: a climb followed by a sway', () => {
    for (const id of ['aster', 'krait', 'kite', 'vectora', 'atlas'] as WeaponId[]) {
      const rec = WEAPONS[id].recoil;
      expect(rec[0]).toEqual({ p: 0, y: 0 });
      for (let i = 1; i < 6; i++) expect(rec[i].p).toBeGreaterThan(rec[i - 1].p);
      const maxYaw = Math.max(...rec.map((s) => Math.abs(s.y)));
      expect(maxYaw).toBeGreaterThan(0.004);
      // interpolation between steps is continuous
      const mid = recoilAt(WEAPONS[id], 2.5);
      expect(mid.p).toBeCloseTo((rec[2].p + rec[3].p) / 2, 6);
    }
    // patterns differ per weapon
    expect(WEAPONS.aster.recoil[12].y).not.toBeCloseTo(WEAPONS.krait.recoil[12].y, 3);
  });

  it('makes accuracy depend on movement, stance and air state', () => {
    const d = WEAPONS.aster;
    const base = { maxSpeed: d.moveSpeed, onGround: true, crouch: 0, landT: 0, heat: 0, scoped: false };
    const still = computeSpread(d, { ...base, speed: 0 });
    const creep = computeSpread(d, { ...base, speed: ACCURATE_SPEED - 0.01 });
    const run = computeSpread(d, { ...base, speed: d.moveSpeed });
    const air = computeSpread(d, { ...base, speed: 0, onGround: false });
    const crouch = computeSpread(d, { ...base, speed: 0, crouch: 1 });
    const landed = computeSpread(d, { ...base, speed: 0, landT: 0.3 });
    expect(creep).toBe(still); // tight baseline holds below 0.45 m/s
    expect(run).toBeGreaterThan(still * 10);
    expect(air).toBeGreaterThan(run);
    expect(crouch).toBeLessThan(still);
    expect(landed).toBeGreaterThan(still);
    // scoped rifles are only accurate while scoped
    const lg = WEAPONS.longglass;
    expect(computeSpread(lg, { ...base, speed: 0, scoped: false })).toBeGreaterThan(computeSpread(lg, { ...base, speed: 0, scoped: true }) * 50);
  });

  it('reduces damage with distance, never below the floor', () => {
    const d = WEAPONS.kite;
    expect(damageFalloff(d, 5)).toBe(1);
    expect(damageFalloff(d, 30)).toBeLessThan(damageFalloff(d, 15));
    expect(damageFalloff(d, 500)).toBe(d.minDamageFrac);
  });
});

describe('hitscan and damage', () => {
  it('resolves hit zones from the server-side volumes', () => {
    const pose = { x: 10, y: 0, z: 0, crouch: 0 };
    const out: PlayerHit = { t: 0, zone: 'chest' };
    const zoneAt = (y: number, zOff = 0): string | null => (rayVsPlayer(0, y, zOff, 1, 0, 0, pose, out) ? out.zone : null);
    expect(zoneAt(1.64)).toBe('head');
    expect(zoneAt(1.3)).toBe('chest');
    expect(zoneAt(0.95)).toBe('abdomen');
    expect(zoneAt(0.4)).toBe('leg');
    expect(zoneAt(1.3, 0.25)).toBe('arm');
    expect(zoneAt(1.95)).toBeNull();
    expect(zoneAt(1.3, 0.5)).toBeNull();
    // crouching lowers every volume
    const crouched = { ...pose, crouch: 1 };
    expect(rayVsPlayer(0, 1.64, 0, 1, 0, 0, crouched, out)).toBe(false);
    expect(rayVsPlayer(0, 1.12, 0, 1, 0, 0, crouched, out) && out.zone).toBe('head');
  });

  it('applies armor by hit zone and degrades the vest', () => {
    const bare = duel('aster', 5);
    aimAt(bare.r, bare.s, bare.t, 1.25);
    fireOnce(bare.r, bare.s);
    expect(bare.t.hp).toBe(100 - 34);
    const vest = duel('aster', 5, { armor: true });
    aimAt(vest.r, vest.s, vest.t, 1.25);
    fireOnce(vest.r, vest.s);
    expect(vest.t.hp).toBe(100 - Math.round(34 * 0.78));
    expect(vest.t.armor).toBeLessThan(100);
    // legs are never armored
    const legs = duel('aster', 5, { armor: true });
    aimAt(legs.r, legs.s, legs.t, 0.4);
    fireOnce(legs.r, legs.s);
    expect(legs.t.hp).toBe(100 - Math.round(34 * 0.75));
    expect(legs.t.armor).toBe(100);
  });

  it('Aster 4 kills a helmeted head only inside its tuned range; Krait 7 does at distance', () => {
    const close = duel('aster', 6, { armor: true, helmet: true });
    aimAt(close.r, close.s, close.t, 1.64);
    fireOnce(close.r, close.s);
    expect(close.t.alive).toBe(false);
    const far = duel('aster', 26, { armor: true, helmet: true });
    aimAt(far.r, far.s, far.t, 1.64);
    fireOnce(far.r, far.s);
    expect(far.t.alive).toBe(true);
    expect(far.t.hp).toBeLessThan(15);
    const krait = duel('krait', 26, { armor: true, helmet: true });
    aimAt(krait.r, krait.s, krait.t, 1.64);
    fireOnce(krait.r, krait.s);
    expect(krait.t.alive).toBe(false);
    // no helmet: any rifle headshot is lethal
    const bare = duel('aster', 26, { armor: true });
    aimAt(bare.r, bare.s, bare.t, 1.64);
    fireOnce(bare.r, bare.s);
    expect(bare.t.alive).toBe(false);
  });

  it('Longglass M2 kills through an armored torso but not with a leg hit; Sable DMR needs two body shots', () => {
    const body = duel('longglass', 20, { armor: true, helmet: true });
    body.s.scope = 1;
    aimAt(body.r, body.s, body.t, 1.25);
    fireOnce(body.r, body.s);
    expect(body.t.alive).toBe(false);
    const leg = duel('longglass', 20, { armor: true });
    leg.s.scope = 1;
    aimAt(leg.r, leg.s, leg.t, 0.4);
    fireOnce(leg.r, leg.s);
    expect(leg.t.alive).toBe(true);
    expect(leg.t.hp).toBe(100 - Math.round(112 * 0.75));
    const dmr = duel('sable', 20, { armor: true });
    dmr.s.scope = 1;
    aimAt(dmr.r, dmr.s, dmr.t, 1.25);
    fireOnce(dmr.r, dmr.s);
    expect(dmr.t.alive).toBe(true);
    dmr.r.seconds(1.0); // let the recoil settle so the second round also goes to the chest
    fireOnce(dmr.r, dmr.s);
    expect(dmr.t.alive).toBe(false);
  });

  it('fires at the data-driven rate, and semi-automatic weapons need a press per shot', () => {
    const auto = duel('aster', 40);
    auto.r.hold[auto.s.id].pitch = 1.2; // into the sky
    auto.r.hold[auto.s.id].buttons = BTN.FIRE;
    auto.r.seconds(1);
    const fired = 30 - auto.s.primary!.ammo;
    expect(fired).toBeGreaterThanOrEqual(Math.floor(WEAPONS.aster.rpm / 60));
    expect(fired).toBeLessThanOrEqual(Math.ceil(WEAPONS.aster.rpm / 60) + 1);
    const semi = duel('vela', 40);
    semi.r.hold[semi.s.id].pitch = 1.2;
    semi.r.hold[semi.s.id].buttons = BTN.FIRE;
    semi.r.seconds(1);
    expect(15 - semi.s.sidearm!.ammo).toBe(1);
    // the burst rifle releases exactly three rounds per press
    const burst = duel('lumen', 40);
    burst.r.hold[burst.s.id].pitch = 1.2;
    fireOnce(burst.r, burst.s);
    burst.r.seconds(0.3);
    expect(24 - burst.s.primary!.ammo).toBe(3);
    expect(fireInterval(WEAPONS.aster)).toBeCloseTo(60 / 640, 6);
  });

  it('reloads in authoritative stages and keeps magazine state across a drop and pickup', () => {
    const { r, s } = duel('aster', 40);
    r.hold[s.id].pitch = 1.2;
    r.hold[s.id].buttons = BTN.FIRE;
    r.seconds(0.5);
    r.hold[s.id].buttons = 0;
    r.step(2);
    const left = s.primary!.ammo;
    expect(left).toBeLessThan(30);
    // drop and take it back: ammunition is preserved
    r.match.command(s, { t: 'drop' });
    expect(s.primary).toBeNull();
    const item = r.match.items.find((i) => i.inst?.id === 'aster')!;
    expect(item.inst!.ammo).toBe(left);
    r.seconds(1.2);
    r.place(s, item.x, item.z);
    r.seconds(0.2);
    expect(s.primary?.ammo).toBe(left);
    // reload
    s.drawEnd = 0;
    r.hold[s.id].buttons = BTN.RELOAD;
    r.step(1);
    r.hold[s.id].buttons = 0;
    r.seconds(WEAPONS.aster.reloadTime - 0.3);
    expect(s.primary!.ammo).toBe(left); // not yet
    r.hold[s.id].buttons = BTN.FIRE; // cannot fire mid-reload
    r.step(4);
    expect(s.primary!.ammo).toBe(left);
    r.hold[s.id].buttons = 0;
    r.seconds(0.4);
    expect(s.primary!.ammo).toBe(30);
    expect(s.primary!.reserve).toBe(90 - (30 - left));
  });

  it('reproduces the same shots from the same seed and inputs (server-verifiable spread)', () => {
    const run = (seed: number): number[] => {
      const { r, s, t } = duel('krait', 18, {}, seed);
      aimAt(r, s, t, 1.25);
      r.hold[s.id].buttons = BTN.FIRE | BTN.RIGHT; // strafing spray: spread matters
      const shots = captureEvents<Shot>(r, 90, 'shot');
      return shots.flatMap((e) => [e.ex, e.ey, e.ez]);
    };
    const a = run(5);
    const b = run(5);
    const c = run(6);
    expect(a.length).toBeGreaterThan(20);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it('follows the recoil path when standing still: each shot lands where the table says', () => {
    const { r, s } = duel('aster', 40);
    // aim at the far yard wall; no target in the way
    r.place(s, 30, 8.3, -Math.PI / 2);
    r.hold[s.id].buttons = BTN.FIRE;
    const shots = captureEvents<Shot>(r, 64, 'shot');
    const d = WEAPONS.aster;
    expect(shots.length).toBeGreaterThanOrEqual(8);
    for (let i = 0; i < 8; i++) {
      const e = shots[i];
      const dx = e.ex - e.ox;
      const dy = e.ey - e.oy;
      const dz = e.ez - e.oz;
      const pitch = Math.atan2(dy, Math.hypot(dx, dz));
      const tolerance = d.spreadBase + d.spreadPerShot * i + 0.0015;
      expect(Math.abs(pitch - d.recoil[i].p)).toBeLessThan(tolerance);
    }
    // recoil resets once the trigger rests
    r.hold[s.id].buttons = 0;
    r.seconds(1.2);
    expect(s.recoilIdx).toBe(0);
  });

  it('penetrates tagged thin surfaces with enough weapon, and never concrete', () => {
    const through = (weapon: WeaponId): { hp: number; wall: boolean } => {
      const r = makeRig();
      r.toLive();
      const s = r.side('atk')[0];
      const t = r.side('def')[0];
      s.primary = newWeapon(weapon, 9000);
      r.match.switchSlot(s, 'primary', 0, true);
      s.drawEnd = 0;
      // shooter in the Service corridor, target in Vault A behind the hazard-striped panel
      r.place(s, 76.5, 40, -Math.PI / 2);
      r.place(t, 72, 40, Math.PI / 2);
      aimAt(r, s, t, 1.25);
      r.hold[s.id].buttons = BTN.FIRE;
      const kills = captureEvents<Extract<GameEvent, { t: 'kill' }>>(r, 1, 'kill');
      r.hold[s.id].buttons = 0;
      r.step(2);
      return { hp: t.hp, wall: kills.some((k) => k.wall) };
    };
    const rifle = through('aster');
    expect(rifle.hp).toBeLessThan(100);
    expect(rifle.hp).toBeGreaterThan(100 - 34); // energy was lost in the panel
    expect(through('kite').hp).toBe(100); // SMG lacks the penetration
    expect(through('longglass').hp).toBeLessThan(40);
    // solid concrete between Spine and Dock stops everything
    const r = makeRig();
    r.toLive();
    const s = r.side('atk')[0];
    const t = r.side('def')[0];
    s.primary = newWeapon('longglass', 9001);
    r.match.switchSlot(s, 'primary', 0, true);
    s.drawEnd = 0;
    s.scope = 1;
    r.place(s, 42, 20, Math.PI / 2);
    r.place(t, 58, 20, -Math.PI / 2);
    aimAt(r, s, t, 1.25);
    fireOnce(r, s);
    expect(t.hp).toBe(100);
  });

  it('makes the Edge Tool directional: a strike from behind is far deadlier', () => {
    const front = duel('vela', 1.2);
    front.r.match.switchSlot(front.s, 'tool', 0, true);
    front.s.drawEnd = 0;
    aimAt(front.r, front.s, front.t, 1.25);
    fireOnce(front.r, front.s);
    expect(front.t.hp).toBe(100 - 42);
    const back = duel('vela', 1.2);
    back.r.match.switchSlot(back.s, 'tool', 0, true);
    back.s.drawEnd = 0;
    back.r.hold[back.t.id].yaw = Math.PI / 2; // target faces away
    back.r.step(1);
    aimAt(back.r, back.s, back.t, 1.25);
    fireOnce(back.r, back.s);
    expect(back.t.hp).toBe(5);
  });

  it('credits kills, assists, opening duels and trades', () => {
    const r = makeRig();
    const m = r.match;
    r.toLive();
    const [a0, a1] = r.side('atk');
    const [d0, d1] = r.side('def');
    m.damage(d0, a1, 60, 'chest', 1, 'aster', false, 0, 0, 0);
    m.damage(d0, a0, 60, 'chest', 1, 'aster', false, 0, 0, 0);
    expect(a0.stats.kills).toBe(1);
    expect(a1.stats.assists).toBe(1);
    expect(a0.stats.openingKills).toBe(1);
    expect(d0.stats.openingDeaths).toBe(1);
    expect(a0.money).toBe(800 + WEAPONS.aster.killReward);
    // d1 kills a0, then a1 trades within four seconds
    m.damage(a0, d1, 500, 'chest', 1, 'aster', false, 0, 0, 0);
    r.seconds(1);
    m.damage(d1, a1, 500, 'chest', 1, 'aster', false, 0, 0, 0);
    expect(a1.stats.trades).toBe(1);
    expect(a1.stats.openingKills).toBe(0);
  });
});

describe('utility', () => {
  const give = (r: Rig, p: Player, util: 'veil' | 'flash' | 'frag' | 'thermite' | 'pulse'): void => {
    p.util = [util];
    r.match.switchSlot(p, 'util', 0, true);
    p.drawEnd = 0;
  };
  const throwNow = (r: Rig, p: Player): void => {
    r.hold[p.id].buttons = BTN.FIRE;
    r.step(1);
    r.hold[p.id].buttons = 0;
  };

  it('server grenade paths match the shared preview simulation within 5 cm', () => {
    const r = makeRig();
    r.toLive();
    const p = r.side('atk')[0];
    r.place(p, 40, 6, 0.4);
    r.hold[p.id].pitch = 0.35;
    give(r, p, 'frag');
    const ey = p.move.y + eyeHeight(0) - 0.05;
    const dirY = Math.sin(0.35);
    const cp = Math.cos(0.35);
    const preview = simulateThrow(getAnnex().world, 'frag', 40 + Math.sin(0.4) * cp * 0.35, ey + dirY * 0.35, 6 + Math.cos(0.4) * cp * 0.35, 0.4, 0.35, false, DT, 4, 1);
    throwNow(r, p);
    const g = r.match.grenades[0];
    expect(g).toBeDefined();
    let last = { x: g.x, y: g.y, z: g.z };
    while (r.match.grenades.length) {
      last = { x: r.match.grenades[0].x, y: r.match.grenades[0].y, z: r.match.grenades[0].z };
      r.step(1);
    }
    expect(Math.hypot(last.x - preview.endX, last.y - preview.endY, last.z - preview.endZ)).toBeLessThan(0.05 + 19 * DT);
    // and the same throw is bit-identical when repeated
    const again = simulateThrow(getAnnex().world, 'frag', 40 + Math.sin(0.4) * cp * 0.35, ey + dirY * 0.35, 6 + Math.cos(0.4) * cp * 0.35, 0.4, 0.35, false, DT, 4, 1);
    expect(again.points).toEqual(preview.points);
  });

  it('Fragment Charge damage falls off with distance and is blocked by cover', () => {
    const r = makeRig();
    const m = r.match;
    r.toLive();
    const thrower = r.side('atk')[0];
    const [near, far, covered] = r.side('def');
    r.place(thrower, 40, 4.5, 0);
    r.place(near, 40, 9.5);
    r.place(far, 40, 14);
    r.place(covered, 28.5, 12.5); // behind the yard container from the blast
    m.grenades.push({ id: 999, type: 'frag', owner: thrower.id, team: thrower.team, x: 40, y: 0.1, z: 8, vx: 0, vy: 0, vz: 0, born: m.time - 5, rest: true, bounces: 1 });
    r.step(1);
    expect(near.hp).toBeLessThan(40);
    expect(far.hp).toBeGreaterThan(near.hp);
    expect(far.hp).toBeLessThan(100);
    expect(covered.hp).toBe(100);
    expect(thrower.stats.utilDamage).toBeGreaterThan(0);
  });

  it('Veil blocks line of sight for 17 seconds and then clears', async () => {
    const { lineOfSight } = await import('../src/sim/vision');
    const r = makeRig();
    const m = r.match;
    r.toLive();
    m.grenades.push({ id: 998, type: 'veil', owner: 0, team: 0, x: 40, y: 0.1, z: 9, vx: 0, vy: 0, vz: 0, born: m.time - 5, rest: true, bounces: 1 });
    r.step(1);
    expect(m.veils.length).toBe(1);
    r.seconds(UTIL_TUNING.veilBloom + 0.1);
    const see = (): boolean => lineOfSight(m.world, m.veils, m.time, 40, 1.6, 4, 40, 1.6, 14);
    expect(see()).toBe(false);
    expect(lineOfSight(m.world, m.veils, m.time, 47, 1.6, 4, 47, 1.6, 14)).toBe(true); // beside the cloud
    r.seconds(UTIL_TUNING.veilDuration - 0.5);
    expect(see()).toBe(false);
    r.seconds(1);
    expect(see()).toBe(true);
    expect(m.veils.length).toBe(0);
  });

  it('Arc Flash blinds by facing and line of sight', () => {
    const r = makeRig();
    const m = r.match;
    r.toLive();
    const [facing, away, hidden] = r.side('def');
    r.place(facing, 40, 12, Math.PI); // looking south at the flash
    r.place(away, 44, 12, 0); // looking north, flash behind
    r.place(hidden, 28.5, 12.5, Math.PI); // behind the container
    r.step(1);
    m.grenades.push({ id: 997, type: 'flash', owner: 0, team: 0, x: 41, y: 1.8, z: 7, vx: 0, vy: 0, vz: 0, born: m.time - 5, rest: false, bounces: 0 });
    r.step(1);
    const f = facing.blindUntil - m.time;
    const a = away.blindUntil - m.time;
    expect(f).toBeGreaterThan(1.5);
    expect(a).toBeLessThan(f * 0.4);
    expect(hidden.blindUntil).toBe(0);
  });

  it('Thermite burns whole floor cells for 7 seconds and never climbs obstacles', () => {
    const r = makeRig();
    const m = r.match;
    r.toLive();
    const owner = r.side('atk')[0];
    const victim = r.side('def')[0];
    r.place(victim, 36.5, 11.5 + 0.9); // next to the yard crate (35.5..37, 10.5..12)
    m.grenades.push({ id: 996, type: 'thermite', owner: owner.id, team: owner.team, x: 38.2, y: 0.1, z: 12.6, vx: 0, vy: 0, vz: 0, born: m.time - 5, rest: true, bounces: 1 });
    r.step(1);
    const fire = m.fires[0];
    expect(fire).toBeDefined();
    for (let c = 0; c < fire.cells.length; c += 3) {
      expect(fire.cells[c] % 1).toBeCloseTo(0.5, 5); // snapped to authored 1 m cells
      expect(fire.cells[c + 1]).toBeLessThan(0.5); // never on top of the crate
      expect(Math.hypot(fire.cells[c] - 38.2, fire.cells[c + 2] - 12.6)).toBeLessThanOrEqual(UTIL_TUNING.thermiteRadius);
    }
    r.seconds(1);
    expect(victim.hp).toBeLessThan(100);
    r.place(victim, 50, 6);
    const hp = victim.hp;
    r.seconds(1);
    expect(victim.hp).toBe(hp);
    r.seconds(UTIL_TUNING.thermiteDuration);
    expect(m.fires.length).toBe(0);
  });

  it('Pulse Shard pings twice with coarse wedges, and can be shot before the second ping', () => {
    type Pulse = Extract<GameEvent, { t: 'pulse' }>;
    const r = makeRig();
    const m = r.match;
    r.toLive();
    const owner = r.side('atk')[0];
    const enemy = r.side('def')[0];
    r.place(enemy, 44.3, 9.2);
    r.place(owner, 30, 5);
    m.grenades.push({ id: 995, type: 'pulse', owner: owner.id, team: owner.team, x: 40, y: 0.1, z: 6, vx: 0, vy: 0, vz: 0, born: m.time, rest: true, bounces: 1 });
    const pulses = captureEvents<Pulse>(r, Math.round(4 * 64), 'pulse').filter((p) => p.wedges.length);
    expect(pulses.length).toBe(2);
    // a wedge is a 45-degree sector and a near/far band, not a position
    expect(pulses[0].wedges[0]).toEqual({ a: Math.round(Math.atan2(4.3, 3.2) / (Math.PI / 4)), d: 0 });
    expect(m.shards.length).toBe(0);
    // second shard: destroyed after its first ping
    m.grenades.push({ id: 994, type: 'pulse', owner: owner.id, team: owner.team, x: 40, y: 0.1, z: 6, vx: 0, vy: 0, vz: 0, born: m.time, rest: true, bounces: 1 });
    r.seconds(1.5);
    expect(m.shards.length).toBe(1);
    enemy.sidearm = newWeapon('rook', 9100);
    m.switchSlot(enemy, 'sidearm', 0, true);
    enemy.drawEnd = 0;
    const sh = m.shards[0];
    const ey = enemy.move.y + eyeHeight(0);
    r.hold[enemy.id].yaw = Math.atan2(sh.x - enemy.move.x, sh.z - enemy.move.z);
    r.hold[enemy.id].pitch = Math.atan2(sh.y - ey, Math.hypot(sh.x - enemy.move.x, sh.z - enemy.move.z));
    r.step(2);
    fireOnce(r, enemy);
    expect(m.shards.length).toBe(0);
    const later = captureEvents<Pulse>(r, Math.round(3 * 64), 'pulse');
    expect(later.length).toBe(0);
  });
});
