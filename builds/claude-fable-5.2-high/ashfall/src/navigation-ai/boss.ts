import { TAU, angTo, dist, turnToward } from '../core/math';
import { damagePlayer, spawnArea, spawnEnemy } from '../entity-combat/combat';
import { DT, type Actor, type BossState } from '../entity-combat/types';
import type { Session } from '../game-session/session';
import { steer } from './ai';
import { los, nearestFree } from './grid';

export function initBoss(a: Actor): BossState {
  const toll = a.def === 'tollkeeper';
  return { phase: 1, t: 0, next: 2, last: '', armor: toll ? a.maxHp * 0.22 : 0, maxArmor: toll ? a.maxHp * 0.22 : 0, armorBroken: 0, stagger: 0, staggered: 0,
    enrage: false, elapsed: 0, beamAng: 0, beamDir: 1, beams: [], cast: 0, castMax: 0, castNeed: 0, castDmg: 0, summonT: 12, quadT: 3, boltT: 4, conduits: [], started: false, busy: 0 };
}
const src = (a: Actor, mul: number, name?: string) => ({ id: a.id, name: name ?? a.name, team: 1, dmg: a.dmg * mul });

/** Weighted pattern choice with an anti-repeat rule: the previous pattern is never chosen twice in a row. */
function pick(s: Session, bs: BossState, opts: [string, number][]): string {
  const pool = opts.filter(([id, w]) => w > 0 && id !== bs.last);
  const c = s.rng.weighted(pool.length ? pool : opts, (o) => o[1])[0];
  bs.last = c;
  return c;
}
function tollKeeper(s: Session, a: Actor, bs: BossState): void {
  const p = s.player, vet = s.hero.difficulty > 0;
  const d = dist(a.x, a.y, p.x, p.y);
  if (bs.armorBroken > 0) {
    bs.armorBroken -= DT; a.anim = 'stun';
    if (bs.armorBroken <= 0) { bs.armor = bs.maxArmor; s.emit({ type: 'toast', x: a.x, y: a.y, text: 'Armor reforged', id: a.id }); }
    return;
  }
  if (bs.staggered > 0) { bs.staggered -= DT; a.anim = 'stun'; return; }
  if (bs.busy > 0) { bs.busy -= DT; a.animT += DT; if (a.animT > a.animDur) a.anim = 'idle'; return; }
  const haste = bs.enrage ? 1.35 : 1;
  if (d > 3.2) steer(s, a, p.x, p.y, a.speed * haste); else { a.anim = 'idle'; a.facing = turnToward(a.facing, angTo(a.x, a.y, p.x, p.y), 5 * DT); }
  bs.next -= DT;
  if (bs.next > 0 || p.dead) return;
  const mites = s.zone.actors.filter((o) => o.def === 'mite' && !o.dead).length;
  const choice = pick(s, bs, [['sweep', d < 6 ? 4 : 0.5], ['lash', d > 3 ? 3 : 1.5], ['slam', d > 4.5 ? 3 : 1], ['toll', mites < 3 && bs.elapsed > 6 ? 2.2 : 0]]);
  const dir = angTo(a.x, a.y, p.x, p.y);
  a.facing = dir; a.anim = 'windup'; a.animT = 0;
  const dmgMul = bs.enrage ? 1.4 : 1;
  const tele = (wind: number) => { a.animDur = wind; bs.busy = wind + 0.75 / haste; s.emit({ type: 'sfx', x: a.x, y: a.y, s: 'telegraph_heavy', a: wind }); };
  const base = { cancelOnOwner: true, heavy: true, dtype: 'physical' as const };
  switch (choice) {
    case 'sweep':
      tele(1.0);
      spawnArea(s, { ...base, shape: 'cone', x: a.x, y: a.y, dir, r: 5.6, angle: 2.8, delay: 1.0, src: src(a, 1.6 * dmgMul, 'Toll-Keeper (Chain Sweep)'), knock: 6, melee: true });
      if (vet) spawnArea(s, { ...base, shape: 'cone', x: a.x, y: a.y, dir: dir + Math.PI, r: 5.6, angle: 2.8, delay: 1.75, src: src(a, 1.6 * dmgMul, 'Toll-Keeper (Back Sweep)'), knock: 6, melee: true });
      if (vet) bs.busy += 0.75;
      break;
    case 'lash':
      tele(0.8);
      for (const off of vet ? [-0.45, 0, 0.45] : [0]) spawnArea(s, { ...base, shape: 'rect', x: a.x, y: a.y, dir: dir + off, len: 12, width: 2.3, delay: 0.8 + Math.abs(off) * 0.5, src: src(a, 1.7 * dmgMul, 'Toll-Keeper (Chain Lash)') });
      break;
    case 'slam':
      tele(1.05);
      spawnArea(s, { ...base, shape: 'circle', x: p.x, y: p.y, r: 3.4, delay: 1.05, src: src(a, 1.9 * dmgMul, 'Toll-Keeper (Bell Slam)'), knock: 4, fx: 'burst' });
      if (vet) spawnArea(s, { ...base, shape: 'circle', x: p.x + Math.cos(dir + 1.6) * 3.5, y: p.y + Math.sin(dir + 1.6) * 3.5, r: 3.4, delay: 1.7, src: src(a, 1.9 * dmgMul, 'Toll-Keeper (Bell Slam)'), fx: 'burst' });
      break;
    default:
      tele(1.2);
      a.anim = 'cast';
      s.emit({ type: 'toast', x: a.x, y: a.y, text: 'The bell tolls — lanterns answer', id: a.id });
      for (let i = 0; i < 3; i++) {
        const ang = dir + Math.PI + (i - 1) * 0.9;
        const pos = nearestFree(s.zone, a.x + Math.cos(ang) * 3, a.y + Math.sin(ang) * 3) ?? { x: a.x, y: a.y };
        const m = spawnEnemy(s, 'mite', pos.x, pos.y, a.lvl, { noXp: true });
        m.ai!.state = 'approach';
        s.emit({ type: 'fx', x: pos.x, y: pos.y, s: 'summon', a: 1.2, dtype: 'ember' });
      }
  }
  bs.next = bs.busy + s.rng.range(0.5, 1.1) / haste;
}
function setBeams(s: Session, a: Actor, bs: BossState, n: number, warm: number): void {
  for (const ar of s.zone.areas) if (ar.tag === 'beam') ar.done = true;
  bs.beams = [];
  for (let i = 0; i < n; i++) {
    const ar = spawnArea(s, { shape: 'rect', x: a.x, y: a.y, dir: bs.beamAng + (i * TAU) / n, len: 13.5, width: 1.5, delay: warm, dur: 99999, tick: 0.25, follow: a.id,
      src: src(a, 0.55, 'Orison Engine (Beam Lane)'), dtype: 'ember', tag: 'beam', silent: true });
    bs.beams.push(ar.id);
  }
}
function engine(s: Session, a: Actor, bs: BossState): void {
  const p = s.player, z = s.zone, vet = s.hero.difficulty > 0;
  a.anim = bs.staggered > 0 ? 'stun' : 'idle';
  const rate = bs.enrage ? 1.6 : 1;
  // Beam lanes rotate; direction reverses after a visible pause.
  if (bs.phase !== 2 && bs.staggered <= 0) {
    bs.t -= DT;
    if (bs.t <= 0) { bs.t = s.rng.range(9, 13); bs.busy = 1.3; bs.beamDir *= -1; s.emit({ type: 'toast', x: a.x, y: a.y, text: 'The lanes reverse', id: a.id }); }
    if (bs.busy > 0) bs.busy -= DT; else bs.beamAng += bs.beamDir * (bs.phase === 1 ? 0.42 : 0.3) * rate * DT;
  }
  if (bs.staggered > 0) bs.staggered -= DT;
  bs.beams.forEach((id, i) => { const ar = z.areas.find((x) => x.id === id); if (ar) ar.dir = bs.beamAng + (i * TAU) / bs.beams.length; });
  a.facing = bs.beamAng;
  bs.boltT -= DT * rate;
  if (bs.boltT <= 0 && !p.dead) {
    bs.boltT = bs.phase === 1 ? 5 : 4;
    spawnArea(s, { shape: 'circle', x: p.x, y: p.y, r: 2.6, delay: 1.0, src: src(a, 1.4, 'Orison Engine (Star Bolt)'), dtype: 'blight', heavy: true, fx: 'burst' });
    s.emit({ type: 'sfx', x: p.x, y: p.y, s: 'telegraph', a: 1 });
  }
  if (bs.phase === 1) {
    bs.summonT -= DT;
    const scribes = z.actors.filter((o) => o.owner === a.id && o.def === 'scribe' && !o.dead);
    if (bs.summonT <= 0 && scribes.length === 0) {
      bs.summonT = 22;
      s.emit({ type: 'toast', x: a.x, y: a.y, text: 'Repair scribes emerge', id: a.id });
      for (const k of [0.8, -0.8]) {
        const ang = angTo(a.x, a.y, p.x, p.y) + Math.PI + k;
        const pos = nearestFree(z, a.x + Math.cos(ang) * 9, a.y + Math.sin(ang) * 9) ?? { x: a.x, y: a.y };
        const sc = spawnEnemy(s, 'scribe', pos.x, pos.y, a.lvl - 1, { owner: a.id, noXp: true, name: 'Repair Scribe' });
        sc.ai!.state = 'approach'; sc.ai!.cds[0] = 999;
        s.emit({ type: 'fx', x: pos.x, y: pos.y, s: 'summon', a: 1.4, dtype: 'blight' });
      }
    }
    if (scribes.length && a.hp < a.maxHp && Math.floor(z.time * 2) !== Math.floor((z.time - DT) * 2)) {
      a.hp = Math.min(a.maxHp, a.hp + a.maxHp * 0.004 * scribes.length);
      for (const sc of scribes) s.emit({ type: 'fx', x: sc.x, y: sc.y, s: 'chain', a: a.x, b: a.y, dtype: 'blight' });
    }
    if (a.hp <= a.maxHp * 0.66) {
      bs.phase = 2; a.invuln = true; a.hp = a.maxHp * 0.66; bs.quadT = 2.5;
      setBeams(s, a, bs, 0, 0);
      bs.conduits = [0, 1, 2].map((i) => {
        const ang = bs.beamAng + (i * TAU) / 3;
        const c = spawnEnemy(s, 'conduit', a.x + Math.cos(ang) * 8.5, a.y + Math.sin(ang) * 8.5, a.lvl, { noXp: true });
        s.emit({ type: 'fx', x: c.x, y: c.y, s: 'summon', a: 1.6, dtype: 'frost' });
        return c.id;
      });
      s.emit({ type: 'bossPhase', x: a.x, y: a.y, a: 2, text: 'Phase II — shatter the three Star Conduits' });
    }
  } else if (bs.phase === 2) {
    bs.quadT -= DT * rate;
    if (bs.quadT <= 0) {
      bs.quadT = 6.5;
      const first = (bs.castMax = (bs.castMax + 1 + s.rng.int(0, 1)) % 4);
      for (const q of [first, (first + (s.rng.chance(0.5) ? 1 : 2)) % 4]) {
        spawnArea(s, { shape: 'cone', x: a.x, y: a.y, dir: q * (TAU / 4) + TAU / 8, r: z.arena!.r, angle: TAU / 4 - 0.06, delay: 2.2, dur: 3.2, tick: 0.5,
          src: src(a, 0.6, 'Orison Engine (Blight Quadrant)'), dtype: 'blight', tag: 'pool', silent: true, heavy: true });
      }
      s.emit({ type: 'sfx', x: a.x, y: a.y, s: 'telegraph_heavy', a: 2.2 });
    }
    const alive = bs.conduits.filter((id) => { const c = s.actor(id); return c && !c.dead; }).length;
    a.hp = Math.max(a.maxHp * 0.33, Math.min(a.hp, a.maxHp * (0.33 + 0.11 * alive)));
    if (alive === 0) {
      bs.phase = 3; a.invuln = false; bs.staggered = 3; bs.castMax = 0; bs.cast = 0; bs.summonT = 9; bs.t = 10;
      for (const ar of z.areas) if (ar.src.id === a.id && ar.tag === 'pool') ar.done = true;
      setBeams(s, a, bs, vet ? 3 : 2, 3.2);
      s.emit({ type: 'bossPhase', x: a.x, y: a.y, a: 3, text: 'Phase III — break its Orison before it completes' });
    }
  } else {
    if (bs.cast > 0) {
      bs.cast -= DT;
      if (bs.castDmg >= bs.castNeed) {
        bs.cast = 0; bs.staggered = 5; bs.summonT = 14;
        s.emit({ type: 'toast', x: a.x, y: a.y, text: 'Orison broken — the Engine reels!', id: a.id });
        s.emit({ type: 'fx', x: a.x, y: a.y, s: 'break', a: 4 });
      } else if (bs.cast <= 0) {
        bs.summonT = 13;
        s.emit({ type: 'fx', x: a.x, y: a.y, s: 'explosion', a: z.arena!.r, dtype: 'blight' });
        damagePlayer(s, a.dmg * 4.2, 'blight', src(a, 1, 'Orison Engine (Completed Orison)'), { heavy: true });
      }
    } else if (bs.staggered <= 0) {
      bs.summonT -= DT * rate;
      if (bs.summonT <= 0) {
        bs.cast = bs.castMax = 9; bs.castDmg = 0; bs.castNeed = a.maxHp * (vet ? 0.075 : 0.06);
        s.emit({ type: 'bossPhase', x: a.x, y: a.y, a: 3, text: 'The Engine begins its Orison — strike it now!' });
        s.emit({ type: 'sfx', x: a.x, y: a.y, s: 'telegraph_heavy', a: 2 });
      }
    }
  }
}
/** Boss director: start trigger, enrage timer, then the per-boss pattern logic. */
export function bossTick(s: Session, a: Actor): void {
  const bs = (a.bs ??= initBoss(a));
  const p = s.player, z = s.zone;
  if (!bs.started) {
    a.anim = 'idle';
    const d = dist(a.x, a.y, p.x, p.y);
    if (!p.dead && (a.def === 'engine' ? d < z.arena!.r - 0.5 : d < 13 && los(z, a.x, a.y, p.x, p.y)) || (a.dmgTaken ?? 0) > 0) {
      bs.started = true; bs.elapsed = 0;
      if (a.ai) a.ai.state = 'approach';
      if (a.def === 'engine') { bs.t = 10; setBeams(s, a, bs, s.hero.difficulty > 0 ? 4 : 3, 2.5); }
      s.emit({ type: 'bossPhase', x: a.x, y: a.y, a: 1, text: a.name, s: 'start' });
    }
    return;
  }
  if (p.dead) return;
  bs.elapsed += DT;
  if (!bs.enrage && bs.elapsed > (a.def === 'engine' ? 300 : 150)) { bs.enrage = true; s.emit({ type: 'toast', x: a.x, y: a.y, text: `${a.name} enrages!`, id: a.id }); }
  if (bs.stagger > 0) bs.stagger = Math.max(0, bs.stagger - 2.5 * DT);
  if (a.def === 'tollkeeper') tollKeeper(s, a, bs); else engine(s, a, bs);
}
/** Called on player death/respawn so a retry starts the encounter clean (no unskippable intro). */
export function resetBoss(s: Session, a: Actor): void {
  for (const ar of s.zone.areas) if (ar.src.id === a.id) ar.done = true;
  for (const o of s.zone.actors) if (!o.dead && (o.owner === a.id || o.def === 'conduit' || (o.def === 'mite' && o.noXp))) { o.dead = true; o.deadT = 99; }
  a.hp = a.maxHp; a.invuln = false; a.statuses = [];
  a.bs = initBoss(a);
  if (a.ai) { a.x = a.ai.homeX; a.y = a.ai.homeY; a.ai.state = 'dormant'; }
}
