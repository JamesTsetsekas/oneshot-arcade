import { describe, expect, it } from 'vitest';
import { DT, SMOKE, TICK_RATE } from '../src/content/rules';
import { simulateTrajectory, throwState } from '../src/sim/grenades';
import { BTN } from '../src/protocol/messages';
import { aimAt, makeRoom, map, run, teleport, toLive } from './helpers';
import { validateLineups } from '../src/bots/brain';

describe('utility', () => {
  it('grenade trajectories are deterministic and the Practice preview matches the server within 5 cm', () => {
    const room = makeRoom();
    toLive(room);
    const a = room.players[0];
    teleport(a, -30, -31);
    a.utils = ['veil'];
    room.setActive(a, 'util', 0);
    run(room, 40);
    a.yaw = Math.PI / 2;
    a.pitch = -0.4;
    const preview = simulateTrajectory(map, throwState(a.pos, a.vel, a.crouchAmt, a.yaw, a.pitch, false, map), DT, 4);
    const again = simulateTrajectory(map, throwState(a.pos, a.vel, a.crouchAmt, a.yaw, a.pitch, false, map), DT, 4);
    expect(again).toEqual(preview);
    run(room, 1, { 0: { buttons: BTN.FIRE, yaw: a.yaw, pitch: a.pitch } });
    run(room, 1, { 0: { buttons: 0, yaw: a.yaw, pitch: a.pitch } });
    expect(room.grenades.length).toBe(1);
    const g = room.grenades[0];
    // compare the server body to the preview at matching step counts
    let maxErr = 0;
    for (let i = 1; i < 60 && !g.rest && room.grenades.length; i++) {
      const p = preview[i];
      if (!p) break;
      maxErr = Math.max(maxErr, Math.hypot(g.pos.x - p.x, g.pos.y - p.y, g.pos.z - p.z));
      run(room, 1);
    }
    expect(maxErr).toBeLessThan(0.05);
  });

  it('Veil smoke blocks sight for everyone with a fixed boundary and expires after 17 s', () => {
    const room = makeRoom();
    toLive(room);
    const a = room.players[0];
    const b = room.players[1];
    teleport(a, -38, -26);
    teleport(b, -38, -10);
    expect(room.canSee(a, b, true)).toBe(true);
    room.smokes.push({ id: 1, pos: { x: -38, y: 1.3, z: -18 }, radius: SMOKE.radius, startTick: room.tick - TICK_RATE, endTick: room.tick + SMOKE.duration * TICK_RATE, owner: 0 });
    run(room, 1);
    expect(room.canSee(a, b, true)).toBe(false);
    expect(room.canSee(a, b, false)).toBe(false);
    expect(room.buildSnapshot(0).players.some((p) => p.id === 1)).toBe(false);
    run(room, SMOKE.duration * TICK_RATE + 2);
    expect(room.smokes.length).toBe(0);
    expect(room.canSee(a, b, true)).toBe(true);
  });

  it('Arc Flash blinds a player looking at it and not one looking away', () => {
    const room = makeRoom();
    toLive(room);
    const a = room.players[0];
    const b = room.players[1];
    teleport(a, -38, -26);
    teleport(b, -38, -14);
    a.yaw = 0; // looking +Z, toward the flash
    b.yaw = 0; // looking away from it (flash is behind b)
    const g = { id: 99, type: 'flash' as const, owner: 0, team: 0 as const, pos: { x: -38, y: 1.6, z: -20 }, vel: { x: 0, y: 0, z: 0 }, spawnTick: room.tick, rest: false, done: false, bounces: 0 };
    (room as unknown as { flashBang: (g: unknown, o: unknown) => void }).flashBang(g, a);
    expect(a.flashUntil - room.tick).toBeGreaterThan(2 * TICK_RATE);
    expect(b.flashUntil - room.tick).toBeLessThan(1.0 * TICK_RATE);
  });

  it('Thermite burns authored floor cells and damages enemies standing in them', () => {
    const room = makeRoom();
    toLive(room);
    const a = room.players[0];
    const b = room.players[1];
    teleport(b, 0, -8);
    (room as unknown as { ignite: (g: unknown) => void }).ignite({ id: 5, type: 'thermite', owner: 0, team: 0, pos: { x: 0, y: 0.05, z: -8 }, vel: { x: 0, y: 0, z: 0 }, spawnTick: room.tick, rest: true, done: false, bounces: 0 });
    expect(room.fires.length).toBe(1);
    expect(room.fires[0].cells.length).toBeGreaterThan(40);
    run(room, TICK_RATE);
    expect(b.health).toBeLessThan(100);
    expect(b.health).toBeGreaterThan(40);
    expect(a.stats.utilityDamage).toBeGreaterThan(0);
  });

  it('Fragment Charge damage falls off and is blocked by cover', () => {
    const room = makeRoom();
    toLive(room);
    const a = room.players[0];
    const b = room.players[1];
    teleport(b, -38, -20);
    const frag = (x: number, z: number) => (room as unknown as { fragBlast: (g: unknown, o: unknown) => void }).fragBlast({ id: 6, type: 'frag', owner: 0, team: 0, pos: { x, y: 0.1, z }, vel: { x: 0, y: 0, z: 0 }, spawnTick: room.tick, rest: true, done: false, bounces: 0 }, a);
    frag(-38, -17);
    const near = 100 - b.health;
    expect(near).toBeGreaterThan(20);
    b.health = 100;
    frag(-31, -20); // other side of the Cargo Lane wall
    expect(b.health).toBe(100);
  });

  it('bot utility lineups validate against the shared grenade simulation', () => {
    const lineups = validateLineups(map);
    expect(lineups.filter((l) => l.valid).length).toBeGreaterThanOrEqual(4);
  });
});

describe('visibility & anti-wallhack', () => {
  it('snapshots never include enemies behind walls, but include visible ones', () => {
    const room = makeRoom();
    toLive(room);
    const a = room.players[0];
    const b = room.players[1];
    teleport(a, 0, -35); // Freight Yard
    teleport(b, 0, 29); // Atrium
    run(room, 1);
    expect(room.buildSnapshot(0).players.some((p) => p.id === 1)).toBe(false);
    expect(room.buildSnapshot(1).players.some((p) => p.id === 0)).toBe(false);
    teleport(b, 0, -28);
    run(room, 1);
    const snap = room.buildSnapshot(0);
    const seen = snap.players.find((p) => p.id === 1);
    expect(seen).toBeDefined();
    // enemy entries never carry economy/equipment details
    expect(seen!.money).toBeUndefined();
    expect(seen!.health).toBeUndefined();
  });

  it('dead players spectate teammates only and get only what that teammate can see', () => {
    const room = makeRoom({ humans: [{ name: 'A', team: 0 }, { name: 'A2', team: 0 }, { name: 'B', team: 1 }], teamSize: 2 });
    toLive(room);
    const [a, a2, b] = room.players;
    teleport(a2, 0, -35);
    teleport(b, 0, 29);
    room.damage(b, a, 500, 'test', false, false, 'chest', false, false);
    run(room, 2);
    expect(a.alive).toBe(false);
    const snap = room.buildSnapshot(a.id);
    expect(snap.you.spectating).toBe(a2.id);
    expect(snap.players.some((p) => p.team === 1 && p.alive)).toBe(false);
  });

  it('sound events only reach players within the audible radius', () => {
    const room = makeRoom();
    toLive(room);
    const a = room.players[0];
    const b = room.players[1];
    teleport(a, -30, -31);
    teleport(b, 30, 10);
    room.drainEvents(1);
    run(room, TICK_RATE, { 0: { buttons: BTN.FWD, yaw: Math.PI / 2 } });
    const evs = room.drainEvents(1).filter((e) => e.e === 'sound' && e.kind === 'step');
    expect(evs.length).toBe(0);
    teleport(b, -24, -31);
    run(room, TICK_RATE, { 0: { buttons: BTN.FWD, yaw: Math.PI / 2 } });
    expect(room.drainEvents(1).filter((e) => e.e === 'sound' && e.kind === 'step').length).toBeGreaterThan(0);
  });
});

describe('lag compensation', () => {
  it('rewinds targets to the viewed tick within 200 ms but never further', () => {
    const room = makeRoom();
    toLive(room);
    const a = room.players[0];
    const b = room.players[1];
    teleport(a, -32, -31);
    teleport(b, -20, -31);
    a.primary = { uid: 77, id: 'krait', mag: 30, reserve: 90, fired: false, buyer: 0, boughtRound: 1 };
    room.setActive(a, 'primary');
    run(room, 80);
    const oldTick = room.tick;
    const oldHead = { x: b.pos.x, y: b.pos.y + 1.63, z: b.pos.z };
    // target moves 3 m sideways over the next 6 ticks (~94 ms)
    for (let i = 0; i < 6; i++) {
      b.pos.z += 0.5;
      run(room, 1);
    }
    const ang = aimAt(room, a, oldHead);
    const [h0, h1] = room.historyRange();
    expect(h1 - h0).toBeLessThanOrEqual(Math.ceil(0.25 * TICK_RATE));
    expect(room.rewindTick(a, { seq: 0, tick: 0, time: 0, buttons: 0, yaw: 0, pitch: 0, select: null, viewTick: room.tick - 100 })).toBe(room.tick - Math.floor(0.2 * TICK_RATE));
    room.submitInput(0, { seq: 10000, tick: room.tick + 1, time: 0, buttons: BTN.FIRE, yaw: ang.yaw, pitch: ang.pitch, select: null, viewTick: oldTick });
    room.step();
    expect(b.alive).toBe(false);
  });

  it('a shot claiming a view older than 200 ms is clamped and misses', () => {
    const room = makeRoom();
    toLive(room);
    const a = room.players[0];
    const b = room.players[1];
    teleport(a, -32, -31);
    teleport(b, -20, -31);
    a.primary = { uid: 78, id: 'krait', mag: 30, reserve: 90, fired: false, buyer: 0, boughtRound: 1 };
    room.setActive(a, 'primary');
    run(room, 80);
    const oldTick = room.tick;
    const oldHead = { x: b.pos.x, y: b.pos.y + 1.63, z: b.pos.z };
    for (let i = 0; i < 20; i++) {
      b.pos.z += 0.12;
      run(room, 1);
    }
    const ang = aimAt(room, a, oldHead);
    room.submitInput(0, { seq: 10000, tick: room.tick + 1, time: 0, buttons: BTN.FIRE, yaw: ang.yaw, pitch: ang.pitch, select: null, viewTick: oldTick });
    room.step();
    expect(b.alive).toBe(true);
    expect(b.health).toBe(100);
  });
});
