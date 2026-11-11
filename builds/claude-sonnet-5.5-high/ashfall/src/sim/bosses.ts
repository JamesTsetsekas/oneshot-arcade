// Boss directors: The Toll-Keeper (armor meter, lateral dodges, add priority) and the Orison Engine
// (three phases: beam lanes, conduits + delayed quadrants, slower beams + stagger race).
import { addEffect, spawnHazard, spawnProjectile } from './combat';
import type { BossState, Enemy } from './entities';
import type { Game } from './game';
import { moveCircle, lineClear } from './nav';

export function newBossState(id: string, maxHp: number, variant: boolean): BossState {
  return {
    id, phase: 1, t: 0, patternT: 2.5, pattern: null, patternData: {}, lastPatterns: [], armor: id === 'toll_keeper' ? maxHp * 0.2 : 0,
    armorMax: id === 'toll_keeper' ? maxHp * 0.2 : maxHp * 0.14, broken: 0, engaged: false, enrage: false, conduits: [], invuln: false, variant, overload: 0,
    introDone: false, staggerRace: 0, summonT: 0, cause: '',
  };
}

function angleTo(a: { x: number; z: number }, b: { x: number; z: number }) {
  return Math.atan2(b.z - a.z, b.x - a.x);
}

function pick(g: Game, s: BossState, options: { id: string; w: number }[]): string {
  const pool = options.filter((o) => !s.lastPatterns.slice(-2).includes(o.id));
  const list = pool.length ? pool : options;
  const total = list.reduce((a, b) => a + b.w, 0);
  let r = g.crng.next() * total;
  for (const o of list) {
    r -= o.w;
    if (r <= 0) return o.id;
  }
  return list[0].id;
}

function dmgOf(e: Enemy, mult: number) {
  return e.def.dmg * e.dmgMul * mult;
}

export function bossDamageFilter(g: Game, e: Enemy, total: number): number {
  const s = e.boss_state;
  if (!s) return total;
  if (s.broken > 0) total *= s.id === 'orison_engine' ? 1.5 : 1.35;
  else if (s.id === 'toll_keeper') {
    if (s.armor > 0) {
      s.armor -= total;
      total *= 0.4;
      if (s.armor <= 0) {
        s.armor = 0;
        s.broken = 5.5;
        e.atk = null;
        s.pattern = null;
        s.patternT = 2;
        g.text(e.x, e.z, 'ARMOR BROKEN', '#ffd060', true);
        g.events.push({ t: 'sfx', id: 'armorBreak', x: e.x, z: e.z });
        g.events.push({ t: 'shake', amount: 0.5 });
        g.events.push({ t: 'fx', id: 'armorBreak', x: e.x, z: e.z, r: 3, color: 0xffd060 });
        g.cancelEnemyHazards(e);
      }
    }
  } else if (s.id === 'orison_engine' && s.phase === 3 && s.broken <= 0) {
    s.armor += total;
    if (s.armor >= s.armorMax) {
      s.armor = 0;
      s.broken = 7;
      s.overload = 0;
      s.pattern = null;
      s.patternT = 3;
      g.cancelEnemyHazards(e);
      g.text(e.x, e.z, 'STAGGERED!', '#ffd060', true);
      g.events.push({ t: 'sfx', id: 'armorBreak', x: e.x, z: e.z });
      g.events.push({ t: 'shake', amount: 0.6 });
    }
  }
  s.cause = s.cause;
  return total;
}

export function bossControl(g: Game, e: Enemy, kind: string, dur: number) {
  const s = e.boss_state;
  if (!s || kind === 'slow') return;
  // hard control converts to stagger-meter damage
  if (s.id === 'toll_keeper' && s.broken <= 0) {
    s.armor -= dur * s.armorMax * 0.07;
    g.text(e.x, e.z, 'Staggered', '#bfa070');
    if (s.armor <= 0) bossDamageFilter(g, e, 0.0001);
  } else if (s.id === 'orison_engine' && s.phase === 3) {
    s.armor += dur * s.armorMax * 0.06;
  }
}

function startPattern(s: BossState, id: string) {
  s.pattern = id;
  s.patternData = { t: 0, step: 0 };
  s.lastPatterns.push(id);
  if (s.lastPatterns.length > 4) s.lastPatterns.shift();
}

export function updateBoss(g: Game, e: Enemy, dt: number) {
  const s = e.boss_state!;
  const p = g.player;
  const arena = g.zone.bossArena;
  if (!s.engaged) {
    if (p.dead || !arena) return;
    const d = Math.hypot(p.x - arena.x, p.z - arena.z);
    if (d < arena.r * (s.id === 'orison_engine' ? 0.95 : 0.9)) {
      s.engaged = true;
      e.aggro = true;
      e.state = 'approach';
      g.boss = e;
      g.events.push({ t: 'bossIntro', id: s.id });
      g.events.push({ t: 'music', mode: 'boss' });
      g.bossEngaged(e);
    }
    return;
  }
  if (p.dead) {
    // player died: boss resets (heals) and disengages
    if (g.boss === e && !g.player.reviveT) return;
    return;
  }
  s.t += dt;
  if (!s.enrage && s.t > (s.id === 'toll_keeper' ? 200 : 300)) {
    s.enrage = true;
    e.dmgMul *= 1.4;
    g.toast('The boss enrages!', 'warn');
  }
  if (s.broken > 0) {
    s.broken -= dt;
    if (s.broken <= 0 && s.id === 'toll_keeper') s.armor = s.armorMax;
    if (s.id === 'toll_keeper') {
      e.atk = null;
      return; // staggered: stands still
    }
  }
  if (s.id === 'toll_keeper') tollKeeper(g, e, s, dt);
  else engine(g, e, s, dt);
}

// ------------------------------------------------------------------ Toll-Keeper
function chase(g: Game, e: Enemy, dt: number, stop: number) {
  const p = g.player;
  const d = Math.hypot(p.x - e.x, p.z - e.z);
  const want = angleTo(e, p);
  let diff = want - e.facing;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const max = e.def.turn * dt;
  e.facing += Math.max(-max, Math.min(max, diff));
  if (d > stop) {
    const sp = e.def.speed * (e.boss_state!.phase >= 2 ? 1.2 : 1) * (e.boss_state!.enrage ? 1.2 : 1);
    const m = moveCircle(g.zone.grid, e.x, e.z, Math.cos(want) * sp * dt, Math.sin(want) * sp * dt, e.r * 0.8);
    e.vx = (m.x - e.x) / dt;
    e.vz = (m.z - e.z) / dt;
    e.x = m.x;
    e.z = m.z;
  } else {
    e.vx = e.vz = 0;
  }
}

function tollKeeper(g: Game, e: Enemy, s: BossState, dt: number) {
  const p = g.player;
  if (s.phase === 1 && e.hp <= e.maxHp * 0.5) {
    s.phase = 2;
    g.text(e.x, e.z, 'The Toll-Keeper roars!', '#ff8a40', true);
    g.events.push({ t: 'shake', amount: 0.5 });
    g.events.push({ t: 'sfx', id: 'bossRoar', x: e.x, z: e.z });
    s.pattern = null;
    s.patternT = 1;
  }
  const label = (n: string) => `Toll-Keeper: ${n}`;
  if (!s.pattern) {
    chase(g, e, dt, 3.2);
    s.patternT -= dt;
    if (s.patternT <= 0) {
      const lanterns = g.enemies.filter((o) => o.alive && o.type === 'lantern').length;
      const opts: { id: string; w: number }[] = [{ id: 'chain_sweep', w: 3 }, { id: 'slam', w: 3 }];
      if (lanterns < 3) opts.push({ id: 'lanterns', w: 2.4 });
      if (s.phase >= 2) opts.push({ id: 'chain_pull', w: 2.2 });
      if (s.variant) opts.push({ id: 'quake', w: 2.4 });
      startPattern(s, pick(g, s, opts));
    }
    return;
  }
  const d = s.patternData;
  d.t += dt;
  const id = s.pattern;
  e.state = 'telegraph';
  if (id === 'chain_sweep') {
    if (d.step === 0) {
      d.step = 1;
      e.facing = angleTo(e, p);
      const h = spawnHazard(g, { owner: 'enemy', shape: 'cone', kind: 'sweep', x: e.x, z: e.z, dir: e.facing, radius: 7.2, arc: 2.5, delay: 1.15, dmg: { phys: dmgOf(e, 1.0) }, dtype: 'phys', src: e.id, color: 0xff5a30, ownerLabel: label('Chain Sweep') });
      d.hid = h.id;
      g.events.push({ t: 'sfx', id: 'tele_sweep', x: e.x, z: e.z });
    }
    const h = g.hazards.find((x) => x.id === d.hid);
    if (h && d.t < 0.55) {
      e.facing = angleTo(e, p);
      h.dir = e.facing;
      h.x = e.x;
      h.z = e.z;
    }
    if (s.phase >= 2 && d.step === 1 && d.t > 1.3) {
      d.step = 2;
      spawnHazard(g, { owner: 'enemy', shape: 'cone', kind: 'sweep', x: e.x, z: e.z, dir: e.facing + Math.PI, radius: 7.2, arc: 2.5, delay: 0.85, dmg: { phys: dmgOf(e, 1.0) }, dtype: 'phys', src: e.id, color: 0xff5a30, ownerLabel: label('Backswing') });
    }
    if (d.t > (s.phase >= 2 ? 2.5 : 1.7)) endPattern(e, s, 1.4);
  } else if (id === 'slam') {
    if (d.step === 0) {
      d.step = 1;
      const lead = Math.min(Math.hypot(p.x - e.x, p.z - e.z), 9);
      d.tx = p.x + p.vx * 0.3;
      d.tz = p.z + p.vz * 0.3;
      d.lead = lead;
      const h = spawnHazard(g, { owner: 'enemy', shape: 'circle', kind: 'slam', x: d.tx, z: d.tz, radius: 3.5, delay: 1.15, dmg: { phys: dmgOf(e, 1.25) }, dtype: 'phys', src: e.id, color: 0xff5a30, ownerLabel: label('Gate Slam') });
      d.hid = h.id;
      g.events.push({ t: 'sfx', id: 'tele_slam', x: e.x, z: e.z });
      e.facing = angleTo(e, { x: d.tx, z: d.tz });
    }
    const h = g.hazards.find((x) => x.id === d.hid);
    if (h && d.t < 0.55) {
      h.x += (p.x - h.x) * Math.min(1, dt * 3);
      h.z += (p.z - h.z) * Math.min(1, dt * 3);
    }
    if (d.step === 1 && d.t > 1.2 && h) {
      d.step = 2;
      g.events.push({ t: 'shake', amount: 0.6 });
      spawnHazard(g, { owner: 'enemy', shape: 'ring', kind: 'nova', x: h.x, z: h.z, inner: 3.6, radius: 8.5, delay: 0.5, dmg: { phys: dmgOf(e, 0.5) }, dtype: 'phys', src: e.id, color: 0xff7a40, ownerLabel: label('Shockwave') });
    }
    if (d.t > 2.0) endPattern(e, s, 1.5);
  } else if (id === 'lanterns') {
    if (d.step === 0) {
      d.step = 1;
      g.text(e.x, e.z, 'Lanterns!', '#ffc060');
      g.events.push({ t: 'sfx', id: 'tele_summon', x: e.x, z: e.z });
      const n = s.phase >= 2 ? 4 : 3;
      d.n = n;
      for (let i = 0; i < n; i++) {
        const a = g.crng.next() * Math.PI * 2;
        const rr = 5 + g.crng.next() * 4;
        d['sx' + i] = e.x + Math.cos(a) * rr;
        d['sz' + i] = e.z + Math.sin(a) * rr;
        spawnHazard(g, { owner: 'env', shape: 'circle', kind: 'summon', x: d['sx' + i], z: d['sz' + i], radius: 0.9, delay: 0.9, dmg: {}, dtype: 'ember', src: e.id, color: 0xffc060, affectsPlayer: false });
      }
    }
    if (d.step === 1 && d.t > 0.9) {
      d.step = 2;
      for (let i = 0; i < d.n; i++) {
        const l = g.spawnEnemy('lantern', d['sx' + i], d['sz' + i], Math.max(1, e.level - 1), { pack: e.pack, aggro: true, noLoot: true });
        if (l) l.dmgMul = e.dmgMul * 0.75;
      }
    }
    if (d.t > 1.5) endPattern(e, s, 1.0);
  } else if (id === 'chain_pull') {
    if (d.step === 0) {
      d.step = 1;
      e.facing = angleTo(e, p);
      spawnHazard(g, { owner: 'enemy', shape: 'line', kind: 'preview', x: e.x, z: e.z, dir: e.facing, length: 13, width: 1.0, delay: 0.85, dmg: {}, dtype: 'phys', src: e.id, color: 0xc9a468, affectsPlayer: false });
      g.events.push({ t: 'sfx', id: 'tele_hook', x: e.x, z: e.z });
    }
    if (d.t < 0.5) e.facing = angleTo(e, p);
    if (d.step === 1 && d.t > 0.85) {
      d.step = 2;
      spawnProjectile(g, { owner: 'enemy', kind: 'hook', special: 'hook', x: e.x, z: e.z, vx: Math.cos(e.facing) * 26, vz: Math.sin(e.facing) * 26, r: 0.4, range: 13.5, dtype: 'phys', dmg: { phys: dmgOf(e, 0.5) }, color: 0xc9a468, src: e.id, label: label('Chain Hook'), life: 2 });
      g.events.push({ t: 'sfx', id: 'hook', x: e.x, z: e.z });
    }
    if (d.step === 2 && d.t > 1.35) {
      d.step = 3;
      spawnHazard(g, { owner: 'enemy', shape: 'cone', kind: 'sweep', x: e.x, z: e.z, dir: angleTo(e, p), radius: 5.0, arc: 2.2, delay: 0.8, dmg: { phys: dmgOf(e, 0.9) }, dtype: 'phys', src: e.id, color: 0xff5a30, ownerLabel: label('Reel-in Sweep') });
    }
    if (d.t > 2.4) endPattern(e, s, 1.4);
  } else if (id === 'quake') {
    if (d.step === 0) {
      d.step = 1;
      g.text(e.x, e.z, 'Toll Quake', '#ff8a40');
      const bands: [number, number][] = [[1.5, 4.6], [6.0, 9.2], [10.5, 14]];
      bands.forEach(([a, b], i) => spawnHazard(g, { owner: 'enemy', shape: 'ring', kind: 'nova', x: e.x, z: e.z, inner: a, radius: b, delay: 1.0 + i * 0.55, dmg: { phys: dmgOf(e, 0.6) }, dtype: 'phys', src: e.id, color: 0xff7a40, ownerLabel: label('Toll Quake') }));
      g.events.push({ t: 'sfx', id: 'tele_slam', x: e.x, z: e.z });
    }
    if (d.t > 2.8) endPattern(e, s, 1.6);
  }
  if (!s.pattern) return;
  if (id !== 'lanterns') {
    // stand still during telegraphs
  }
  void p;
}

function endPattern(e: Enemy, s: BossState, cd: number) {
  s.pattern = null;
  s.patternT = cd * (s.phase >= 2 ? 0.75 : 1) * (s.enrage ? 0.75 : 1);
  e.state = 'recover';
}

// ------------------------------------------------------------------ Orison Engine
function arenaCenter(g: Game) {
  const a = g.zone.bossArena!;
  return { x: a.x, z: a.z, r: a.r };
}

function engine(g: Game, e: Enemy, s: BossState, dt: number) {
  const p = g.player;
  const c = arenaCenter(g);
  e.facing += dt * 0.25;
  // phase transitions
  if (s.phase === 1 && e.hp <= e.maxHp * 0.66) {
    s.phase = 2;
    s.pattern = null;
    s.patternT = 3.5;
    s.invuln = true;
    g.cancelEnemyHazards(e);
    g.text(e.x, e.z, 'CONDUITS EXPOSED', '#5ee8ff', true);
    g.events.push({ t: 'shake', amount: 0.7 });
    g.events.push({ t: 'sfx', id: 'bossRoar', x: e.x, z: e.z });
    s.conduits = [];
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.5;
      const cd = g.spawnEnemy('conduit', c.x + Math.cos(a) * 12, c.z + Math.sin(a) * 12, e.level, { pack: e.pack, aggro: true, noLoot: true });
      if (cd) {
        cd.maxHp = cd.hp = e.maxHp * 0.045;
        s.conduits.push(cd.id);
      }
    }
  }
  if (s.phase === 2) {
    if (s.invuln) {
      const alive = s.conduits.filter((id) => g.enemies.some((o) => o.id === id && o.alive));
      if (alive.length === 0) {
        s.invuln = false;
        s.broken = 8;
        g.text(e.x, e.z, 'ENGINE EXPOSED', '#ffd060', true);
        g.events.push({ t: 'sfx', id: 'armorBreak', x: e.x, z: e.z });
        g.events.push({ t: 'shake', amount: 0.5 });
      }
    }
    if (e.hp <= e.maxHp * 0.33 && !s.invuln) {
      s.phase = 3;
      s.pattern = null;
      s.patternT = 2.5;
      s.armor = 0;
      s.overload = 0;
      g.cancelEnemyHazards(e);
      g.text(e.x, e.z, 'OVERLOAD CORE', '#ff6a40', true);
      g.events.push({ t: 'sfx', id: 'bossRoar', x: e.x, z: e.z });
      g.events.push({ t: 'shake', amount: 0.7 });
    }
  }
  if (s.phase === 3) {
    if (s.broken > 0) {
      s.broken -= dt;
    } else {
      const rate = (s.enrage ? 2 : 1) / 26;
      s.overload += dt * rate;
      if (s.overload >= 1) {
        s.overload = 0;
        g.text(e.x, e.z, 'OVERLOAD!', '#ff4a30', true);
        spawnHazard(g, { owner: 'enemy', shape: 'circle', kind: 'blast', x: c.x, z: c.z, radius: c.r + 3, delay: 2.4, dmg: { blight: g.d.maxHp * 0.65 }, dtype: 'blight', src: e.id, color: 0xff4030, ownerLabel: 'Orison Engine: Overload' });
        g.events.push({ t: 'sfx', id: 'tele_overload', x: e.x, z: e.z });
      }
    }
  }
  const label = (n: string) => `Orison Engine: ${n}`;
  if (s.invuln && s.phase === 2) {
    // conduit phase: quadrants only
    if (!s.pattern) {
      s.patternT -= dt;
      if (s.patternT <= 0) startPattern(s, 'quadrants');
    }
  } else if (!s.pattern) {
    if (s.broken > 0) return;
    s.patternT -= dt;
    if (s.patternT <= 0) {
      const scribes = g.enemies.filter((o) => o.alive && o.type === 'scribe_repair').length;
      const opts: { id: string; w: number }[] = [];
      if (s.phase === 1) {
        opts.push({ id: 'beams', w: 4 });
        if (scribes < 2) opts.push({ id: 'scribes', w: 2.5 });
        opts.push({ id: 'pulse', w: 2 });
      } else if (s.phase === 2) {
        opts.push({ id: 'quadrants', w: 3 });
        if (scribes < 2) opts.push({ id: 'scribes', w: 2 });
        opts.push({ id: 'pulse', w: 1.5 });
      } else {
        opts.push({ id: 'beams_slow', w: 4 });
        opts.push({ id: 'pulse', w: 2 });
      }
      startPattern(s, pick(g, s, opts));
    }
  }
  if (!s.pattern) return;
  const d = s.patternData;
  d.t += dt;
  const id = s.pattern;
  if (id === 'beams' || id === 'beams_slow') {
    const slow = id === 'beams_slow';
    const lanes = s.variant ? (slow ? 4 : 4) : slow ? 3 : 3;
    const volleys = slow ? 3 : 3;
    const gap = slow ? 1.9 : 1.55;
    const delay = slow ? 1.6 : 1.3;
    if (d.step < volleys && d.t >= d.step * gap) {
      const base = (d.base ?? g.crng.next() * Math.PI * 2) + (slow ? 0.35 : 0.5) * d.step;
      d.base = d.base ?? base - (slow ? 0.35 : 0.5) * d.step;
      for (let k = 0; k < lanes; k++) {
        const ang = base + (k / lanes) * Math.PI * 2;
        spawnHazard(g, { owner: 'enemy', shape: 'line', kind: 'beam', x: c.x, z: c.z, dir: ang, length: c.r + 2, width: 2.0, delay, dmg: { ember: dmgOf(e, 0.9) }, dtype: 'ember', src: e.id, color: 0xff6a30, ownerLabel: label('Beam Lane') });
      }
      g.events.push({ t: 'sfx', id: 'tele_beam', x: c.x, z: c.z });
      d.step++;
    }
    if (d.t > volleys * gap + delay + 0.5) endEnginePattern(s, slow ? 2.4 : 1.8);
  } else if (id === 'scribes') {
    if (d.step === 0) {
      d.step = 1;
      g.text(e.x, e.z, 'Repair Scribes!', '#b36bff');
      g.events.push({ t: 'sfx', id: 'tele_summon', x: e.x, z: e.z });
      for (let i = 0; i < 2; i++) {
        const a = g.crng.next() * Math.PI * 2;
        const x = c.x + Math.cos(a) * 11;
        const z = c.z + Math.sin(a) * 11;
        spawnHazard(g, { owner: 'env', shape: 'circle', kind: 'summon', x, z, radius: 1.0, delay: 0.9, dmg: {}, dtype: 'blight', src: e.id, color: 0xb36bff, affectsPlayer: false });
        d['sx' + i] = x;
        d['sz' + i] = z;
      }
    }
    if (d.step === 1 && d.t > 0.9) {
      d.step = 2;
      for (let i = 0; i < 2; i++) {
        const sc = g.spawnEnemy('scribe_repair', d['sx' + i], d['sz' + i], e.level, { pack: e.pack, aggro: true, noLoot: true });
        if (sc) sc.maxHp = sc.hp = Math.max(40, e.maxHp * 0.02);
      }
    }
    if (d.t > 1.4) endEnginePattern(s, 1.6);
  } else if (id === 'pulse') {
    if (d.step === 0) {
      d.step = 1;
      spawnHazard(g, { owner: 'enemy', shape: 'ring', kind: 'nova', x: e.x, z: e.z, inner: 4.0, radius: 7.5, delay: 1.4, dmg: { ember: dmgOf(e, 0.6) }, dtype: 'ember', src: e.id, color: 0xff7a40, ownerLabel: label('Core Pulse') });
      spawnHazard(g, { owner: 'enemy', shape: 'ring', kind: 'nova', x: e.x, z: e.z, inner: 10, radius: 15, delay: 2.0, dmg: { ember: dmgOf(e, 0.6) }, dtype: 'ember', src: e.id, color: 0xff7a40, ownerLabel: label('Core Pulse') });
      g.events.push({ t: 'sfx', id: 'tele_pulse', x: e.x, z: e.z });
    }
    if (d.t > 2.6) endEnginePattern(s, 1.6);
  } else if (id === 'quadrants') {
    if (d.step === 0) {
      d.step = 1;
      const quads: [number, number][] = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
      const pickN = s.variant ? 3 : 2;
      const chosen = [...quads].sort(() => g.crng.next() - 0.5).slice(0, pickN);
      for (const [qx, qz] of chosen) {
        const x = c.x + qx * 9.5;
        const z = c.z + qz * 9.5;
        spawnHazard(g, { owner: 'enemy', shape: 'circle', kind: 'blast', x, z, radius: 7.6, delay: 1.9, dmg: { blight: dmgOf(e, 0.8) }, dtype: 'blight', src: e.id, color: 0xa855f7, ownerLabel: label('Blight Quadrant') });
        spawnHazard(g, { owner: 'enemy', shape: 'circle', kind: 'pool', x, z, radius: 6.4, delay: 1.9, dur: 4, interval: 0.6, dmg: { blight: dmgOf(e, 0.25) }, dtype: 'blight', src: e.id, color: 0xa855f7, ownerLabel: label('Blight Quadrant'), slowMag: 0.2 });
      }
      g.events.push({ t: 'sfx', id: 'tele_quad', x: c.x, z: c.z });
    }
    if (d.t > 2.4) endEnginePattern(s, 2.8);
  }
  // repair scribes heal the engine
  void p;
  void lineClear;
  void addEffect;
}

function endEnginePattern(s: BossState, cd: number) {
  s.pattern = null;
  s.patternT = cd * (s.enrage ? 0.7 : 1);
}

export function bossHealFromScribes(g: Game, e: Enemy, dt: number) {
  const n = g.enemies.filter((o) => o.alive && o.type === 'scribe_repair').length;
  if (n > 0 && e.alive) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.008 * n * dt);
}
