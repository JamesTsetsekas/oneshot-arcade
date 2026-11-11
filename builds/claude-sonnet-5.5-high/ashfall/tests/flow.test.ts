import { describe, expect, it } from 'vitest';
import { bossDamageFilter } from '../src/sim/bosses';
import type { Game } from '../src/sim/game';
import { skillReady } from '../src/sim/play';
import { botFight, makeGame, run } from './helpers';

function interact(g: Game, kind: string) {
  const it = g.zone.interactables.find((i) => i.kind === kind && !i.hidden)!;
  expect(it, kind).toBeTruthy();
  g.player.x = it.x;
  g.player.z = it.z + 1.2;
  g.player.px = g.player.x;
  g.player.pz = g.player.z;
  g.cmdInteract(it.id);
  run(g, 0.6);
  return it;
}

function godBot(g: Game, t: number) {
  g.hurtPlayer = () => 0; // immortal test pilot
  g.player.hp = g.player.maxHp;
  const boss = g.enemies.find((e) => e.boss && e.alive);
  if (boss && !boss.boss_state!.engaged) {
    g.player.x = boss.x + 6;
    g.player.z = boss.z;
  }
  const foes = g.enemies.filter((e) => e.alive && !e.neutral && (e.aggro || e.boss));
  let best = null as (typeof foes)[number] | null;
  let bd = 1e9;
  let real = 1e9;
  for (const e of foes) {
    if (e.boss && e.boss_state?.invuln) continue;
    const raw = Math.hypot(e.x - g.player.x, e.z - g.player.z);
    const prio = ['conduit', 'scribe_repair', 'lantern'].includes(e.type) && (raw < 9 || e.type !== 'lantern') ? 40 : 0; // add priority
    const d = raw - (e.boss ? e.r : 0) - prio;
    if (d < bd) {
      bd = d;
      best = e;
      real = d + prio;
    }
  }
  if (best && Math.floor(t * 30) % 3 === 0) {
    if (g.ch.hotbar.rmb && real < 3.5 && skillReady(g, g.ch.hotbar.rmb).ok) g.cmdSkill('rmb', best.x, best.z, best.id);
    else g.cmdAttack(best.id);
  }
}

describe('story flow end-to-end (simulation level)', () => {
  it('plays from the refuge through both bosses to victory and unlocks Veteran', () => {
    const g = makeGame('cinder', 99, 9);
    // quest giver
    interact(g, 'captain');
    expect(g.ch.quests.ashway).toBe('active');
    interact(g, 'gate_march');
    expect(g.zone.id).toBe('march');
    interact(g, 'waypoint');
    expect(g.ch.quests.ashway).toBe('done');
    expect(g.ch.quests.toll).toBe('active');
    // the sealed gate refuses entry until the Toll-Keeper falls
    const gate = g.zone.interactables.find((i) => i.kind === 'archive_gate')!;
    expect(gate.state.open).toBe(false);
    // fight the Toll-Keeper
    const boss = g.enemies.find((e) => e.type === 'toll_keeper')!;
    expect(boss).toBeTruthy();
    g.player.x = boss.x + 5;
    g.player.z = boss.z;
    const seenPatterns = new Set<string>();
    let broke = false;
    let phase2 = false;
    run(g, 600, 1 / 30, (gg, t) => {
      godBot(gg, t);
      const s = boss.boss_state!;
      if (s.pattern) seenPatterns.add(s.pattern);
      if (s.broken > 0 && s.id === 'toll_keeper') broke = true;
      if (s.phase === 2) phase2 = true;
    });
    expect(boss.alive).toBe(false);
    expect(broke).toBe(true);
    expect(phase2).toBe(true);
    expect(seenPatterns.size).toBeGreaterThanOrEqual(3);
    expect(g.ch.quests.toll).toBe('done');
    expect(gate.state.open).toBe(true);
    // first-completion loot: at least one inscribed-or-better identified item dropped
    const items = g.pickups.filter((k) => k.kind === 'item').map((k) => k.item!);
    expect(items.some((i) => (i.rarity === 'inscribed' || i.rarity === 'relic') && i.identified)).toBe(true);
    // archive floor 1: rescue the Artificer
    g.player.x = gate.x;
    g.player.z = gate.z + 3;
    interact(g, 'archive_gate');
    expect(g.zone.id).toBe('archive1');
    const cage = interact(g, 'cage');
    expect(cage.used).toBe(true);
    expect(g.ch.quests.artificer).toBe('done');
    expect(g.ch.flags.artificerRescued).toBe(true);
    interact(g, 'stairs_down');
    expect(g.zone.id).toBe('archive2');
    // lever opens a shortcut door if the floor has one
    const lever = g.zone.interactables.find((i) => i.kind === 'lever');
    if (lever) {
      const door = g.zone.interactables.find((i) => i.kind === 'door')!;
      expect(g.zone.grid.cells[door.cells![0]]).toBe(1);
      interact(g, 'lever');
      expect(g.zone.grid.cells[door.cells![0]]).toBe(0);
    }
    interact(g, 'stairs_down');
    expect(g.zone.id).toBe('archive3');
    expect(g.ch.waypoints).not.toContain('approach');
    interact(g, 'waypoint');
    expect(g.ch.waypoints).toContain('approach');
    // Orison Engine (the test pilot gets gear appropriate for the final fight)
    g.ch.equip.weapon!.base = 'mace_4';
    g.recompute();
    const engine = g.enemies.find((e) => e.type === 'orison_engine')!;
    g.player.x = g.zone.bossArena!.x + 6;
    g.player.z = g.zone.bossArena!.z + 6;
    const phases = new Set<number>();
    const pats = new Set<string>();
    let sawInvuln = false;
    let staggered = false;
    run(g, 700, 1 / 30, (gg, t) => {
      godBot(gg, t);
      const s = engine.boss_state!;
      phases.add(s.phase);
      if (s.pattern) pats.add(s.pattern);
      if (s.invuln) sawInvuln = true;
      if (s.phase === 3 && s.broken > 0) staggered = true;
    });
    expect(engine.alive).toBe(false);
    expect(phases.has(1) && phases.has(2) && phases.has(3)).toBe(true);
    expect(sawInvuln).toBe(true);
    expect(staggered).toBe(true);
    expect(pats.size).toBeGreaterThanOrEqual(3);
    expect(g.ch.actComplete).toBe(true);
    expect(g.ch.veteranUnlocked).toBe(true);
    expect(g.ch.quests.engine).toBe('done');
    expect(g.zone.interactables.find((i) => i.kind === 'exit_summary')?.hidden).toBe(false);
    // victory drops remain collectable and a summary exists
    expect(g.pickups.some((k) => k.kind === 'item')).toBe(true);
    expect(g.summary?.kills).toBeGreaterThan(0);
    // return to the refuge: portal is visible; new Veteran expedition resets quests and raises enemy levels
    g.enterZone('refuge');
    expect(g.zone.interactables.find((i) => i.kind === 'portal_ashen')?.hidden).toBe(false);
    const normalLevel = g.zones.get('march')!.zone.level;
    g.newExpedition('veteran');
    expect(g.ch.difficulty).toBe('veteran');
    expect(g.ch.quests.ashway).toBeUndefined();
    g.enterZone('march');
    expect(g.zone.level).toBeGreaterThan(normalLevel);
    expect(g.enemies.some((e) => e.elite)).toBe(true);
  }, 120000);

  it('Target Hunt records a time and returns to the refuge', () => {
    const g = makeGame('ranger', 5, 16);
    g.ch.actComplete = true;
    g.startHunt('toll_keeper');
    expect(g.zone.kind).toBe('hunt');
    expect(g.cmdTownGate()).toBeUndefined();
    const boss = g.enemies.find((e) => e.boss)!;
    g.player.x = boss.x + 5;
    g.player.z = boss.z;
    // damage the boss directly: bypass armor via heavy hits
    run(g, 5, 1 / 30);
    for (let i = 0; i < 400 && boss.alive; i++) {
      g.hurtPlayer({}, { name: 'noop' });
      bossDamageFilter(g, boss, 0);
      boss.hp -= boss.maxHp * 0.02;
      if (boss.hp <= 0) g.killEnemy(boss, 'test');
    }
    expect(boss.alive).toBe(false);
    expect(g.ch.records?.hunt_toll_keeper).toBeGreaterThanOrEqual(0);
    interact(g, 'hunt_exit');
    expect(g.zone.id).toBe('refuge');
  });

  it('dying in a boss fight resets the boss and respawns at the checkpoint waypoint', () => {
    const g = makeGame('cinder', 11, 12);
    g.enterZone('archive3');
    interact(g, 'waypoint');
    expect(g.ch.lastWaypoint).toBe('approach');
    const engine = g.enemies.find((e) => e.type === 'orison_engine')!;
    g.player.x = g.zone.bossArena!.x + 8;
    g.player.z = g.zone.bossArena!.z;
    run(g, 2);
    expect(engine.boss_state!.engaged).toBe(true);
    engine.hp = engine.maxHp * 0.5;
    g.hurtPlayer({ phys: 1e6 }, { name: 'Test' });
    expect(g.player.dead).toBe(true);
    expect(engine.boss_state!.engaged).toBe(false);
    expect(engine.hp).toBe(engine.maxHp);
    g.respawn();
    expect(g.zone.id).toBe('archive3');
    expect(g.player.z).toBeGreaterThan(70); // back at the approach waypoint, before the arena
  });

  it('a mixed pack with elites is survivable for an immortal-less bot at level parity (balance smoke)', () => {
    const g = makeGame('cinder', 777, 6);
    g.enterZone('march');
    const sg = g.zone.spawns.find((s) => s.tag === 'elite' && s.id === 'toll_elite')!;
    g.player.x = sg.x;
    g.player.z = sg.z + 7;
    run(g, 90, 1 / 30, botFight);
    // a level-6 warden should clear a one-elite pack (corpses fade out of the list) and survive
    const left = g.enemies.filter((e) => e.pack === sg.id && e.alive);
    expect(left.length).toBe(0);
    expect(g.player.dead).toBe(false);
  });
});
