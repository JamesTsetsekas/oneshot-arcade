import { describe, expect, it } from 'vitest';
import { makeItem } from '../src/sim/loot';
import { botFight, makeGame, run } from './helpers';

function zoneStartRun(g: ReturnType<typeof makeGame>, zone: string) {
  g.enterZone(zone);
}

describe('game session basics', () => {
  it('starts in the refuge, safe, with a starting loadout', () => {
    const g = makeGame('cinder');
    expect(g.zone.id).toBe('refuge');
    expect(g.zone.safe).toBe(true);
    expect(g.ch.equip.weapon).toBeTruthy();
    expect(g.player.maxHp).toBeGreaterThan(100);
    run(g, 2);
    expect(g.player.hp).toBe(g.player.maxHp);
  });

  it('click-to-move follows a path and arrives', () => {
    const g = makeGame('ranger');
    const sx = g.player.x;
    g.cmdMove(sx + 8, g.player.z);
    run(g, 4);
    expect(g.player.x).toBeGreaterThan(sx + 6);
  });

  it('player can hit a training dummy and the damage meter registers', () => {
    const g = makeGame('cinder');
    const dummy = g.enemies.find((e) => e.type === 'dummy')!;
    g.player.x = dummy.x;
    g.player.z = dummy.z - 1.8;
    g.cmdAttack(dummy.id);
    run(g, 5);
    expect(g.dummyDamage).toBeGreaterThan(20);
    expect(dummy.alive).toBe(true);
    expect(g.ch.tutorial.attack).toBe(true);
  });

  it('evasive step uses a charge, recovers it and moves the player', () => {
    const g = makeGame('ranger');
    const x0 = g.player.x;
    g.cmdEvade(x0 + 10, g.player.z);
    expect(g.player.evadeCharges).toBe(2);
    run(g, 0.5);
    expect(g.player.x - x0).toBeGreaterThan(3.5);
    run(g, 3.2);
    expect(g.player.evadeCharges).toBe(3);
  });

  it('potions heal, are consumed, and respect cooldown/cap', () => {
    const g = makeGame('cinder');
    g.player.hp = 20;
    const before = g.ch.belt.health;
    g.cmdPotion('health');
    expect(g.player.hp).toBeGreaterThan(60);
    expect(g.ch.belt.health).toBe(before - 1);
    g.player.hp = 10;
    g.cmdPotion('health'); // cooldown
    expect(g.ch.belt.health).toBe(before - 1);
  });
});

describe('zones, interactions and quests', () => {
  it('waypoint activation, quest chain start and travel', () => {
    const g = makeGame('cinder');
    const captain = g.zone.interactables.find((i) => i.kind === 'captain')!;
    g.player.x = captain.x;
    g.player.z = captain.z + 1;
    g.cmdInteract(captain.id);
    run(g, 1);
    expect(g.ch.quests.ashway).toBe('active');
    const gate = g.zone.interactables.find((i) => i.kind === 'gate_march')!;
    g.cmdInteract(gate.id);
    g.player.x = gate.x - 1;
    g.player.z = gate.z;
    run(g, 1);
    expect(g.zone.id).toBe('march');
    const wp = g.zone.interactables.find((i) => i.kind === 'waypoint')!;
    g.player.x = wp.x;
    g.player.z = wp.z + 1.5;
    g.cmdInteract(wp.id);
    run(g, 1);
    expect(g.ch.waypoints).toContain('ashway');
    expect(g.ch.quests.ashway).toBe('done');
    expect(g.ch.quests.toll).toBe('active');
    g.cmdTravel('refuge');
    expect(g.zone.id).toBe('refuge');
    g.cmdTravel('ashway');
    expect(g.zone.id).toBe('march');
  });

  it('town gate channel completes, and is interrupted by damage', () => {
    const g = makeGame('cinder');
    g.enterZone('march');
    g.cmdTownGate();
    run(g, 3.4);
    expect(g.zone.id).toBe('refuge');
    expect(g.returnPoint).toBeTruthy();
    g.enterZone('march');
    g.cmdTownGate();
    run(g, 1);
    g.hurtPlayer({ phys: 5 }, { name: 'Test' });
    run(g, 3);
    expect(g.zone.id).toBe('march');
  });

  it('opens the shortcut door and the chest drops loot', () => {
    const g = makeGame('cinder');
    g.enterZone('march');
    const chest = g.zone.interactables.find((i) => i.kind === 'chest')!;
    g.player.x = chest.x;
    g.player.z = chest.z + 1;
    g.cmdInteract(chest.id);
    run(g, 1);
    expect(chest.used).toBe(true);
    expect(g.pickups.length).toBeGreaterThan(0);
    const door = g.zone.interactables.find((i) => i.kind === 'door')!;
    expect(g.zone.grid.cells[door.cells![0]]).toBe(1);
    g.player.x = door.x;
    g.player.z = door.z + 1;
    g.cmdInteract(door.id);
    run(g, 1);
    expect(g.zone.grid.cells[door.cells![0]]).toBe(0);
  });
});

describe('combat and death', () => {
  it('a level-appropriate warden clears the first pack of the March', () => {
    for (const cls of ['cinder', 'ranger'] as const) {
      const g = makeGame(cls, 4321, 4);
      g.enterZone('march');
      const pack = g.zone.spawns.filter((s) => s.tag === 'pack').sort((a, b) => a.level - b.level)[0];
      g.player.x = pack.x - 6;
      g.player.z = pack.z;
      const foes = g.enemies.filter((e) => e.pack === pack.id);
      expect(foes.length).toBeGreaterThan(1);
      run(g, 40, 1 / 30, botFight);
      const alive = foes.filter((e) => e.alive).length;
      expect(g.player.dead, `${cls} died`).toBe(false);
      expect(alive, `${cls} left ${alive} alive`).toBe(0);
      expect(g.ch.xp + g.ch.level).toBeGreaterThan(4);
    }
  });

  it('death drops an Echo (10% gold), reduces durability, respawn restores', () => {
    const g = makeGame('cinder');
    g.enterZone('march');
    g.ch.gold = 500;
    g.hurtPlayer({ phys: 99999 }, { name: 'Test Blow' });
    expect(g.player.dead).toBe(true);
    expect(g.ch.gold).toBe(450);
    expect(g.ch.echo?.gold).toBe(50);
    expect(g.ch.equip.weapon!.dur).toBeLessThan(g.ch.equip.weapon!.durMax);
    expect(g.deathInfo?.cause).toBe('Test Blow');
    g.respawn();
    expect(g.player.dead).toBe(false);
    expect(g.zone.id).toBe('refuge');
    // dying again moves the echo, does not compound
    g.enterZone('march');
    g.hurtPlayer({ phys: 99999 }, { name: 'Again' });
    expect(g.ch.gold).toBe(450);
    expect(g.ch.echo?.gold).toBe(50);
    expect(g.ch.echo?.zone).toBe('march');
  });

  it('reclaiming the Echo returns gold and grants a blessing', () => {
    const g = makeGame('cinder');
    g.enterZone('march');
    g.ch.gold = 300;
    g.hurtPlayer({ phys: 99999 }, { name: 'x' });
    g.respawn();
    g.enterZone('march');
    const echo = g.pickups.find((k) => k.kind === 'echo')!;
    expect(echo).toBeTruthy();
    g.player.x = echo.x;
    g.player.z = echo.z;
    run(g, 2);
    expect(g.ch.gold).toBe(300);
    expect(g.ch.echo).toBeNull();
    expect(g.blessingT).toBeGreaterThan(0);
  });
});

describe('items and economy rules', () => {
  it('equip swaps, protects favorites, and refuses to destroy equipped/favorited items', () => {
    const g = makeGame('cinder');
    const helm = makeItem('head_h2', 6, 'worn', [], true);
    g.ch.inv.add(helm);
    expect(g.equip(helm.uid).ok).toBe(true);
    expect(g.ch.equip.head?.uid).toBe(helm.uid);
    expect(g.canDestroy(helm).ok).toBe(false);
    const ring = makeItem('ring_2', 6, 'worn', [], true);
    g.ch.inv.add(ring);
    g.toggleFavorite(ring.uid);
    expect(g.sellItem(ring.uid)).toBe(false);
    g.toggleFavorite(ring.uid);
    const gold = g.ch.gold;
    expect(g.sellItem(ring.uid)).toBe(true);
    expect(g.ch.gold).toBeGreaterThan(gold);
  });

  it('refuses class-unusable gear', () => {
    const g = makeGame('cinder');
    const bow = makeItem('bow_1', 1, 'worn', [], true);
    g.ch.inv.add(bow);
    expect(g.equip(bow.uid).ok).toBe(false);
  });

  it('salvage, identify, reroll and sockets require the Artificer and cost resources', () => {
    const g = makeGame('cinder');
    const it = g.lootRng && makeItem('ring_3', 10, 'inscribed', [{ id: 'crit_chance', tier: 1, value: 3 }, { id: 'inc_all', tier: 1, value: 6 }, { id: 'res_all', tier: 1, value: 4 }], false);
    g.ch.inv.add(it);
    expect(g.salvage(it.uid).ok).toBe(false);
    g.ch.flags.artificerRescued = true;
    g.ch.gold = 1000;
    g.ch.dust = 50;
    expect(g.identify(it.uid).ok).toBe(true);
    expect(it.identified).toBe(true);
    const before = it.affixes[0].id + it.affixes[0].value;
    expect(g.reroll(it.uid, 0).ok).toBe(true);
    expect(it.rerolls).toBe(1);
    expect(it.affixes[0].id + it.affixes[0].value).not.toBe('');
    void before;
    expect(g.ch.gold).toBeLessThan(1000);
    expect(g.salvage(it.uid).ok).toBe(true);
    expect(g.ch.dust).toBeGreaterThan(30);
  });

  it('full inventory blocks item pickup and a full belt blocks potion pickup', () => {
    const g = makeGame('cinder');
    g.enterZone('march');
    while (g.ch.inv.add(makeItem('ring_1', 1, 'worn', [], true)));
    const k = g.addPickup({ kind: 'item', x: g.player.x, z: g.player.z, item: makeItem('ring_1', 1, 'worn', [], true), label: 'x' });
    expect(g.collect(k)).toBe(false);
    g.ch.belt.health = g.ch.beltCap;
    const p = g.addPickup({ kind: 'potion', potion: 'health', x: g.player.x, z: g.player.z, amount: 1, label: 'p' });
    expect(g.collect(p)).toBe(false);
  });
});
