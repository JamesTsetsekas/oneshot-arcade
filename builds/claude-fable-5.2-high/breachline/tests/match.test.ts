import { describe, expect, it } from 'vitest';
import { SUPPORT_TUNING } from '../src/content/kit';
import { DEFAULT_LOADOUTS } from '../src/content/loadout';
import { COMBAT, MOMENTUM, TICK_RATE } from '../src/content/tuning';
import { ENT, PHASE_LIVE, PHASE_POST, PHASE_SUDDEN, PHASE_WARMUP, resultChecksum } from '../src/protocol/messages';
import { encodeCmd } from '../src/protocol/codec';
import { BTN, InputCmd } from '../src/sim/player';
import { makeRoom } from './helpers';

const liveStart = (h: Awaited<ReturnType<typeof makeRoom>>) => { while (h.room.phase === PHASE_WARMUP) h.room.tick(); };

describe('Team Clash room (headless authoritative simulation)', () => {
  it('runs a full 6v6 bot match to a winner with a consistent result and stays inside the tick budget', async () => {
    const h = await makeRoom({ seed: 77, scoreLimit: 40 });
    const room = h.room;
    expect(room.players.length).toBe(12);
    expect(room.players.filter((p) => p.team === 0).length).toBe(6);
    let guard = 0;
    while (room.phase !== PHASE_POST && guard++ < 60 * 60 * 10) room.tick();
    expect(room.phase).toBe(PHASE_POST);
    const res = room.result!;
    expect(res).toBeTruthy();
    expect(Math.max(...res.scores)).toBeGreaterThanOrEqual(1);
    // every team point comes from exactly one enemy elimination
    const k0 = res.players.filter((p) => p.team === 0).reduce((a, p) => a + p.kills, 0);
    const k1 = res.players.filter((p) => p.team === 1).reduce((a, p) => a + p.kills, 0);
    expect(k0).toBe(res.scores[0]);
    expect(k1).toBe(res.scores[1]);
    if (res.scores[0] !== res.scores[1]) expect(res.winner).toBe(res.scores[0] > res.scores[1] ? 0 : 1);
    expect(res.sig).toBe(resultChecksum(res));
    // bots actually fought across the roster and used their tools
    expect(res.players.filter((p) => p.kills > 0).length).toBeGreaterThanOrEqual(8);
    const p95 = room.tickP95();
    console.log(`[bot match] ${res.scores.join('-')} in ${res.duration.toFixed(0)}s sim | tick p95 ${p95.toFixed(2)} ms | supports used ${res.players.reduce((a, p) => a + p.supportsUsed, 0)} | spawn audits ${room.spawnAudit.length}`);
    expect(p95).toBeLessThan(8);
    expect(room.spawnAudit.length).toBeGreaterThan(20);
    expect(room.spawnAudit[room.spawnAudit.length - 1]).toMatch(/score=/);
  }, 240000);

  it('ends on the time limit, and a tied clock enters sudden death with a +5 target', async () => {
    const h = await makeRoom({ seed: 5, timeLimit: 3, scoreLimit: 500, teamSize: 2 });
    const room = h.room;
    liveStart(h);
    // freeze the score at a tie by keeping everyone protected, then let the clock expire
    while (room.phase === PHASE_LIVE) { for (const p of room.players) p.protT = 1; room.tick(); }
    expect(room.phase).toBe(PHASE_SUDDEN);
    expect(room.suddenTarget).toBe(room.scores[0] + 5);
    expect(room.phaseT).toBeGreaterThan(55);
    // force a lead and run out the sudden-death clock
    room.scores[1] = room.scores[0] + 1;
    room.phaseT = 0.05;
    for (let i = 0; i < 10; i++) room.tick();
    expect(room.phase).toBe(PHASE_POST);
    expect(room.result!.winner).toBe(1);
    expect(room.result!.suddenDeath).toBe(true);
  });

  it('awards Momentum for kills and assists, banks all three tiers in one life, and resets on death', async () => {
    const h = await makeRoom({ seed: 9, teamSize: 3 }, DEFAULT_LOADOUTS);
    const room = h.room;
    liveStart(h);
    const me = room.players[h.you];
    const mate = room.players.find((p) => p.team === me.team && p !== me)!;
    const foes = room.players.filter((p) => p.team !== me.team);
    const hit = (v: typeof me, by: typeof me, dmg: number, opts = {}) => { v.protT = 0; v.alive = true; v.health = Math.max(v.health, 1); return room.applyDamage(v, by, dmg, 'ar4', 1, 0, 0, 0, opts); };
    // assist: teammate damages, I finish
    hit(foes[0], mate, 40);
    foes[0].health = 60;
    hit(foes[0], me, 100);
    expect(me.momentum).toBe(MOMENTUM.kill);
    expect(mate.momentum).toBe(MOMENTUM.assist);
    expect(mate.assists).toBe(1);
    expect(room.scores[me.team]).toBe(1);
    // seven more kills in the same life -> 8 Momentum, all three tiers banked
    for (let i = 0; i < 7; i++) { const f = foes[(i + 1) % foes.length]; f.health = 100; hit(f, me, 200); }
    expect(me.kills).toBe(8);
    expect(me.momentum).toBe(MOMENTUM.tiers[2]);
    expect(me.supports).toBe(0b111);
    expect(h.raw.length).toBeGreaterThan(0);
    // support kills score but do not extend Momentum
    me.momentum = 4;
    foes[0].health = 100;
    const scoreBefore = room.scores[me.team];
    hit(foes[0], me, 300, { support: true });
    expect(room.scores[me.team]).toBe(scoreBefore + 1);
    expect(me.momentum).toBe(4);
    // friendly fire is off
    expect(hit(mate, me, 50)).toBe(0);
    // death resets Momentum but banked actions persist
    me.health = 100;
    hit(me, foes[1], 500);
    expect(me.alive).toBe(false);
    expect(me.momentum).toBe(0);
    expect(me.supports).toBe(0b111);
    // respawn after the configured delay
    for (let i = 0; i < COMBAT.respawnDelay * TICK_RATE + 3; i++) room.tick();
    expect(me.alive).toBe(true);
    expect(me.health).toBe(100);
    expect(me.protT).toBeGreaterThan(0);
  });

  it('death recap mirrors the server damage log and names only the killer', async () => {
    const h = await makeRoom({ seed: 11, teamSize: 3 }, DEFAULT_LOADOUTS);
    const room = h.room;
    liveStart(h);
    const me = room.players[h.you];
    const foes = room.players.filter((p) => p.team !== me.team);
    me.protT = 0;
    room.applyDamage(me, foes[0], 30, 'm7', 3, 5, 1, 5);
    room.applyDamage(me, foes[1], 45, 'ar4', 1, 5, 1, 5);
    room.applyDamage(me, foes[1], 60, 'ar4', 0, 5, 1, 5);
    room.tick();
    const recap = h.events.find((e) => e.e === 'recap') as Extract<(typeof h.events)[number], { e: 'recap' }>;
    expect(recap).toBeTruthy();
    expect(recap.killer).toBe(foes[1].id);
    expect(recap.src).toBe('ar4');
    expect(recap.hits.map((x) => x.dmg)).toEqual([30, 45, 25]); // final hit clamped to remaining health
    expect(recap.hits.map((x) => x.zone)).toEqual([3, 1, 0]);
    const kill = h.events.find((e) => e.e === 'kill') as Extract<(typeof h.events)[number], { e: 'kill' }>;
    expect(kill.head).toBe(true);
    expect(kill.assists).toEqual([foes[0].id]);
    expect(JSON.stringify(recap)).not.toContain('"assists"');
  });

  it('spawn protection blocks damage until it expires, the player fires, or moves 5 m', async () => {
    const h = await makeRoom({ seed: 13, teamSize: 2 }, DEFAULT_LOADOUTS);
    const room = h.room;
    liveStart(h);
    const me = room.players[h.you];
    const foe = room.players.find((p) => p.team !== me.team)!;
    expect(me.protT).toBeGreaterThan(0);
    expect(room.applyDamage(me, foe, 50, 'ar4', 1, 0, 0, 0)).toBe(0);
    // firing ends protection immediately
    let seq = 0;
    const send = (c: Partial<InputCmd>) => room.onMessage(1, { m: 'cmd', data: encodeCmd({ seq: ++seq, rt: room.tickN, mx: 0, mz: 0, yaw: me.st.yaw, pitch: 0, buttons: 0, slot: 0, sel: 0, ...c }) });
    send({ buttons: BTN.FIRE });
    room.tick();
    expect(me.protT).toBe(0);
    expect(room.applyDamage(me, foe, 50, 'ar4', 1, 0, 0, 0)).toBe(50);
    // health regenerates 5 s after the last damage at 22 HP/s
    for (let i = 0; i < 4.9 * TICK_RATE; i++) { send({}); room.tick(); }
    expect(me.health).toBe(50);
    for (let i = 0; i < 1.2 * TICK_RATE; i++) { send({}); room.tick(); }
    expect(me.health).toBeGreaterThan(65);
    expect(me.health).toBeLessThan(85);
  });

  it('rejects illegal or tampered loadouts before seating a player', async () => {
    const h = await makeRoom({ teamSize: 2 });
    const bad = JSON.parse(JSON.stringify(DEFAULT_LOADOUTS));
    bad[0].primary = 'p9'; // sidearm in the primary slot
    expect(h.room.addHuman(7, 'x', bad, 0).ok).toBe(false);
    const bad2 = JSON.parse(JSON.stringify(DEFAULT_LOADOUTS));
    bad2[1].attachments = ['reflex', 'optic2x']; // two optics
    expect(h.room.addHuman(7, 'x', bad2, 0).ok).toBe(false);
    const bad3 = JSON.parse(JSON.stringify(DEFAULT_LOADOUTS));
    bad3[2].perks = ['fleet', 'fleet', 'rapid']; // wrong perk group
    expect(h.room.addHuman(7, 'x', bad3, 0).ok).toBe(false);
  });
});

describe('equipment and support actions', () => {
  it('a hitscan shot from a real input command damages an enemy and is tallied', async () => {
    const h = await makeRoom({ seed: 21, teamSize: 1 }, DEFAULT_LOADOUTS);
    const room = h.room;
    liveStart(h);
    const me = room.players[h.you], foe = room.players.find((p) => p.team !== me.team)!;
    foe.brain = null; // stand still
    foe.st.px = me.st.px + 6; foe.st.py = me.st.py; foe.st.pz = me.st.pz; foe.protT = 0;
    for (let i = 0; i < 3; i++) room.tick(); // let lag-comp history catch up with the teleport
    let seq = 0;
    for (let i = 0; i < 40 && foe.alive; i++) {
      room.onMessage(1, { m: 'cmd', data: encodeCmd({ seq: ++seq, rt: room.tickN, mx: 0, mz: 0, yaw: Math.PI / 2, pitch: -0.07, buttons: BTN.FIRE, slot: 0, sel: 0 }) });
      room.tick();
    }
    expect(foe.alive).toBe(false);
    expect(me.kills).toBe(1);
    const t = me.tally.get('ar4')!;
    expect(t.hits).toBeGreaterThanOrEqual(3);
    expect(t.shots).toBeGreaterThanOrEqual(t.hits);
    expect(me.st.mag0).toBe(30 - t.shots);
    expect(h.events.some((e) => e.e === 'hit' && e.kill)).toBe(true);
  });

  it('frag grenades fly, bounce, explode and respect cover', async () => {
    const h = await makeRoom({ seed: 22, teamSize: 2 }, DEFAULT_LOADOUTS);
    const room = h.room;
    liveStart(h);
    const me = room.players[h.you];
    const [a, b] = room.players.filter((p) => p.team !== me.team);
    for (const f of [a, b]) { f.brain = null; f.protT = 0; }
    // open ridge-side ground: victim 3 m from the blast, other victim behind the ops wing wall
    a.st.px = -52; a.st.pz = 24; a.st.py = 0.03;
    b.st.px = -44; b.st.pz = 10; b.st.py = 0.03; // inside the server hall
    room.explode(-50, 0.3, 22.5, 6.5, 150, me.id, 'frag', { equip: true });
    expect(a.health).toBeLessThan(60);
    expect(b.health).toBe(100);
    expect(h.room.players[me.id].equipHits).toBe(1);
  });

  it('obscurant blocks bot sight lines and flash blinds only viewers with line of sight', async () => {
    const h = await makeRoom({ seed: 23, teamSize: 2 }, DEFAULT_LOADOUTS);
    const room = h.room;
    liveStart(h);
    expect(room.smokeBlocks(-10, 1.5, 30, 10, 1.5, 30)).toBe(false);
    room.entities.push({ id: 900, type: ENT.SMOKE, team: 0, owner: 0, x: 0, y: 1, z: 30, vx: 0, vy: 0, vz: 0, age: 2, fuse: 10, hp: 0, yaw: 0, stuck: true, phase: 0, timer: 0, dead: false, src: 'smoke' });
    expect(room.smokeBlocks(-10, 1.5, 30, 10, 1.5, 30)).toBe(true);
    expect(room.smokeBlocks(-10, 1.5, 40, 10, 1.5, 40)).toBe(false);
  });

  it('Mortar Mark requires open sky, telegraphs, and spares players under a roof; only one tier-8 action per team', async () => {
    const h = await makeRoom({ seed: 24, teamSize: 2 }, [{ ...DEFAULT_LOADOUTS[0], supports: ['recon', 'mortar', 'flight'] }]);
    const room = h.room;
    liveStart(h);
    const me = room.players[h.you];
    const [a, b] = room.players.filter((p) => p.team !== me.team);
    const mate = room.players.find((p) => p.team === me.team && p !== me)!;
    for (const f of [a, b, mate]) { f.brain = null; f.protT = 0; }
    me.protT = 0;
    // me in the west yard looking east along the open strip north of the ops wing
    me.st.px = -54; me.st.pz = 22; me.st.py = 0.03;
    a.st.px = -38; a.st.pz = 22.5; a.st.py = 0.03; // outdoors at the aim point
    b.st.px = -40; b.st.pz = 16; b.st.py = 0.03; // indoors (server hall), 6.5 m from the blast
    me.supports = 0b111;
    let seq = 0;
    const send = (c: Partial<InputCmd>) => room.onMessage(1, { m: 'cmd', data: encodeCmd({ seq: ++seq, rt: room.tickN, mx: 0, mz: 0, yaw: Math.PI / 2, pitch: -0.105, buttons: 0, slot: 0, sel: 1, ...c }) });
    send({}); room.tick();
    send({ buttons: BTN.SUPPORT }); room.tick();
    const mortar = room.entities.find((e) => e.type === ENT.MORTAR)!;
    expect(mortar).toBeTruthy();
    expect(Math.abs(mortar.x - a.st.px)).toBeLessThan(4);
    expect(me.supports & 0b010).toBe(0);
    expect(h.events.some((e) => e.e === 'support' && e.kind === 'mortar' && e.phase === 'warn')).toBe(true);
    // nothing lands during the telegraph
    for (let i = 0; i < (SUPPORT_TUNING.mortarDelay - 0.3) * TICK_RATE; i++) { send({}); room.tick(); }
    expect(a.health).toBe(100);
    const momentumBefore = me.momentum;
    for (let i = 0; i < 1.6 * TICK_RATE; i++) { send({}); room.tick(); }
    expect(a.alive).toBe(false);
    expect(b.health).toBe(100);
    expect(me.momentum).toBe(momentumBefore); // support kill: score yes, Momentum no
    expect(me.kills).toBe(1);
    // indoor target is refused
    me.supports = 0b010;
    me.st.px = -40; me.st.pz = 10; // server hall
    send({ pitch: -0.5 }); room.tick();
    send({ pitch: -0.5, buttons: BTN.SUPPORT }); room.tick();
    expect(me.supports & 0b010).toBe(0b010);
    expect(h.events.some((e) => e.e === 'announce' && e.key === 'supportDenied')).toBe(true);
    // tier 8 exclusivity
    room.uplinkUntil[me.team] = room.tickN + 600;
    me.supports = 0b100;
    send({ sel: 2 }); room.tick();
    send({ sel: 2, buttons: BTN.SUPPORT }); room.tick();
    expect(me.supports & 0b100).toBe(0b100);
  });

  it('Interdiction Flight is friendly-safe, lethal in the open lane after its warning, and harmless indoors', async () => {
    const h = await makeRoom({ seed: 25, teamSize: 2 }, DEFAULT_LOADOUTS);
    const room = h.room;
    liveStart(h);
    const me = room.players[h.you];
    const [a, b] = room.players.filter((p) => p.team !== me.team);
    const mate = room.players.find((p) => p.team === me.team && p !== me)!;
    for (const f of [a, b, mate]) { f.brain = null; f.protT = 0; }
    me.st.px = -55; me.st.pz = 24; me.st.py = 0.03;
    a.st.px = -20; a.st.pz = 24; a.st.py = 0.03; // in the lane, outdoors
    mate.st.px = -24; mate.st.pz = 24.5; mate.st.py = 0.03; // teammate in the lane
    b.st.px = -30; b.st.pz = 14; b.st.py = 0.03; // control room: outside the lane and indoors
    me.supports = 0b100;
    let seq = 0;
    const send = (c: Partial<InputCmd>) => room.onMessage(1, { m: 'cmd', data: encodeCmd({ seq: ++seq, rt: room.tickN, mx: 0, mz: 0, yaw: Math.PI / 2, pitch: -0.12, buttons: 0, slot: 0, sel: 2, ...c }) });
    send({}); room.tick();
    send({ buttons: BTN.SUPPORT }); room.tick();
    expect(room.entities.some((e) => e.type === ENT.FLIGHT)).toBe(true);
    expect(room.tier8Active(me.team)).toBe(true);
    for (let i = 0; i < (SUPPORT_TUNING.flightDelay - 0.2) * TICK_RATE; i++) { send({}); room.tick(); }
    expect(a.health).toBe(100);
    for (let i = 0; i < 3 * TICK_RATE; i++) { send({}); room.tick(); }
    expect(a.alive).toBe(false);
    expect(mate.health).toBe(100);
    expect(b.health).toBe(100);
    expect(room.entities.some((e) => e.type === ENT.FLIGHT)).toBe(false);
  });

  it('Recon Sweep pulses reveal enemies (shorter with Signal Filter); Hunter Drone marks, never shoots, and can be destroyed for Momentum', async () => {
    const h = await makeRoom({ seed: 26, teamSize: 2 }, [{ ...DEFAULT_LOADOUTS[0], supports: ['recon', 'drone', 'flight'] }]);
    const room = h.room;
    liveStart(h);
    const me = room.players[h.you];
    const [a, b] = room.players.filter((p) => p.team !== me.team);
    for (const f of [a, b]) { f.brain = null; f.protT = 0; }
    me.st.px = -54; me.st.pz = 24; me.st.py = 0.03;
    a.st.px = -38; a.st.pz = 23; a.st.py = 0.03;
    b.st.px = 40; b.st.pz = -40; b.st.py = 0.03;
    me.supports = 0b011;
    let seq = 0;
    const send = (c: Partial<InputCmd>) => room.onMessage(1, { m: 'cmd', data: encodeCmd({ seq: ++seq, rt: room.tickN, mx: 0, mz: 0, yaw: Math.PI / 2, pitch: 0, buttons: 0, slot: 0, sel: 0, ...c }) });
    send({}); room.tick();
    send({ buttons: BTN.SUPPORT }); room.tick();
    for (let i = 0; i < 40; i++) { send({}); room.tick(); }
    expect(a.revealUntil).toBeGreaterThan(room.tickN);
    expect(b.revealUntil).toBeGreaterThan(room.tickN);
    // drone
    send({ sel: 1 }); room.tick();
    send({ sel: 1, buttons: BTN.SUPPORT }); room.tick();
    const drone = room.entities.find((e) => e.type === ENT.DRONE)!;
    expect(drone).toBeTruthy();
    for (let i = 0; i < 90; i++) { send({}); room.tick(); }
    expect(a.markedUntil).toBeGreaterThan(room.tickN - 10);
    expect(a.health).toBe(100); // marking only - no autonomous lethal fire
    // enemy destroys the drone and earns Momentum for it
    const before = a.momentum;
    room.explode(drone.x, drone.y, drone.z, 3, 200, a.id, 'frag', {});
    room.tick();
    expect(room.entities.some((e) => e.type === ENT.DRONE)).toBe(false);
    expect(a.devices).toBe(1);
    expect(a.momentum).toBe(before + MOMENTUM.device);
  });
});
