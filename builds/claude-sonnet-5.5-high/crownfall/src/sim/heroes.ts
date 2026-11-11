/**
 * Hero kits: small typed code modules (not scripts) with a strict interface.
 * Numeric tunables live in shared/content; this file holds the behaviour.
 */
import { HERO_BY_ID, abilityVal, type DamageType } from '../shared/content';
import { angDiff, clamp, dist, norm } from '../shared/math';
import { sightLine } from '../shared/map';
import type { CastParams, Unit } from './types';
import type { Sim } from './sim';
import { hasItem } from './items';

type Impl = (sim: Sim, u: Unit, slot: number, rank: number, p: CastParams, isRecast: boolean) => void;
const V = (id: string, slot: number, key: string, rank: number) => abilityVal(HERO_BY_ID[id].abilities[slot], key, rank);

const enemyOf = (sim: Sim, u: Unit) => (t: Unit) => sim.isEnemyTarget(t, u.team, { needSight: false });

/** Applies damage from an ability and runs on-ability-hit hooks (passives, items). */
function hit(sim: Sim, u: Unit, t: Unit, slot: number, amount: number, dtype: DamageType, label: string): number {
  const d = sim.damage(u, t, amount, dtype, { label, ability: true });
  heroOnAbilityHit(sim, u, t, slot);
  return d;
}

function finishRecast(sim: Sim, u: Unit, slot: number) {
  const h = u.hero!;
  const rec = h.rec[slot];
  if (rec) h.cds[slot] = sim.time + rec.fullCd;
  h.rec[slot] = null;
}

const fxRing = (sim: Sim, x: number, z: number, r: number, color: number, dur = 0.5) => sim.emit({ t: 'fx', kind: 'ring', x, z, r, color, dur });

// ---------------------------------------------------------------- Brannoch
const brannoch: Impl = (sim, u, slot, rank, p, isRecast) => {
  const n = norm(p.dx, p.dz);
  const h = u.hero!;
  if (slot === 0) {
    const range = HERO_BY_ID.brannoch.abilities[0].range;
    const dmg = V('brannoch', 0, 'dmg', rank) + 0.8 * u.ad;
    const slow = V('brannoch', 0, 'slow', rank) / 100;
    const bonus = V('brannoch', 0, 'bonus', rank);
    sim.emit({ t: 'fx', kind: 'cone', x: u.x, z: u.z, r: range, color: 0xffb040, dx: n.x, dz: n.z, dur: 0.4 });
    for (const t of sim.unitsInCone(u.x, u.z, n.x, n.z, range, 0.85, enemyOf(sim, u))) {
      const d = dist(u.x, u.z, t.x, t.z);
      const inner = d < 1.9;
      hit(sim, u, t, 0, dmg + (inner ? bonus : 0), 'physical', 'Fault Hammer');
      if (!inner) sim.addEffect(t, 'slow', 1.5, slow, u.id, { tag: 'fault' });
      sim.emit({ t: 'hit', x: t.x, z: t.z, color: 0xffb040, big: inner });
    }
    sim.emit({ t: 'sfx', name: 'slam', x: u.x, z: u.z });
  } else if (slot === 1) {
    const hp = V('brannoch', 1, 'hp', rank);
    const cx = u.x + n.x * 3.4, cz = u.z + n.z * 3.4;
    const px = -n.z, pz = n.x;
    for (let i = -2; i <= 2; i++) {
      const off = i * 1.2;
      const x = cx + px * off - n.x * 0.14 * i * i, z = cz + pz * off - n.z * 0.14 * i * i;
      sim.addWall(x, z, 0.85, hp / 2.4, 3, u.team);
    }
    sim.emit({ t: 'fx', kind: 'wall', x: cx, z: cz, r: 3, color: 0xe0d2b0, dx: n.x, dz: n.z, dur: 3 });
    sim.emit({ t: 'sfx', name: 'stone', x: cx, z: cz });
  } else if (slot === 2) {
    const rec = h.rec[2] ?? (h.rec[2] = { until: sim.time + 4, fullCd: 12, data: {} });
    if (!isRecast) {
      let ax = p.tx, az = p.tz, ally = 0;
      for (const a of sim.heroes) if (!a.dead && a.team === u.team && a.id !== u.id && dist(a.x, a.z, ax, az) < 2.8) { ally = a.id; ax = a.x; az = a.z; break; }
      rec.data = { ax, az, ally };
      sim.emit({ t: 'fx', kind: 'anchor', x: ax, z: az, r: 1.2, color: 0xd49a3a, dx: u.x, dz: u.z, dur: 4 });
    } else {
      const d = rec.data ?? {};
      let ax = d.ax ?? u.x, az = d.az ?? u.z;
      const ally = d.ally ? sim.byId.get(d.ally) : undefined;
      if (ally && !ally.dead) { ax = ally.x; az = ally.z; }
      const dd = dist(u.x, u.z, ax, az);
      if (dd > 0.5) {
        const k = Math.max(0, dd - 1.1) / dd;
        sim.startDash(u, u.x + (ax - u.x) * k, u.z + (az - u.z) * k, clamp(dd / 28, 0.15, 0.5), 'dash');
      }
      sim.grantShield(u, u, V('brannoch', 2, 'shield', rank), 2.5);
      finishRecast(sim, u, 2);
    }
  } else {
    const dd = dist(u.x, u.z, p.tx, p.tz);
    const dmg = V('brannoch', 3, 'dmg', rank) + 1.0 * u.ad;
    sim.startDash(u, p.tx, p.tz, clamp(dd / 26, 0.3, 0.5), 'leap', {
      onEnd: () => {
        sim.emit({ t: 'fx', kind: 'shock', x: u.x, z: u.z, r: 4.2, color: 0xffa040, dur: 0.6 });
        for (const t of sim.unitsInCircle(u.x, u.z, 4.2, enemyOf(sim, u))) {
          hit(sim, u, t, 3, dmg, 'physical', 'Citybreaker');
          if (t.kind === 'hero') sim.addEffect(t, 'airborne', 1.1, 1, u.id);
          else sim.addEffect(t, 'stun', 0.8, 1, u.id);
        }
        sim.emit({ t: 'sfx', name: 'boom', x: u.x, z: u.z });
      },
    });
  }
};

// ---------------------------------------------------------------- Suri
const suri: Impl = (sim, u, slot, rank, p) => {
  const n = norm(p.dx, p.dz);
  if (slot === 0) {
    const dmg = V('suri', 0, 'dmg', rank) + 0.9 * u.ad;
    sim.spawnProjectile({
      team: u.team, owner: u.id, x: u.x + n.x * 0.6, z: u.z + n.z * 0.6, dx: n.x, dz: n.z, speed: 26, range: 13, radius: 0.5, bounces: 1, color: 0xffa040, size: 0.35, fx: 'bolt',
      dmg, power: 1, tag: 'ricochet',
      onHit: (_pr, t) => { if (t.team !== u.team) hit(sim, u, t, 0, dmg, 'physical', 'Ricochet Bolt'); sim.emit({ t: 'hit', x: t.x, z: t.z, color: 0xffa040 }); },
    });
  } else if (slot === 1) {
    const speed = V('suri', 1, 'speed', rank) / 100;
    const sx = u.x, sz = u.z;
    sim.startDash(u, u.x + n.x * 5.5, u.z + n.z * 5.5, 0.2, 'dash');
    const used = new Set<number>([u.id]);
    for (let i = 0; i < 3; i++) {
      const k = (i + 0.5) / 3;
      const z = sim.spawnZone({
        team: u.team, owner: u.id, x: sx + n.x * 5.5 * k, z: sz + n.z * 5.5 * k, r: 1.7, until: sim.time + 3, tag: 'lane', fx: 'lane', color: 0x7fe8ff, friendly: true,
        onEnter: (_z, t) => { if (t.kind === 'hero' && t.team === u.team && !used.has(t.id)) { used.add(t.id); sim.addEffect(t, 'haste', 1.5, speed, u.id, { tag: 'slipstream' }); sim.emit({ t: 'fx', kind: 'ring', x: t.x, z: t.z, r: 1.2, color: 0x7fe8ff, dur: 0.4 }); } },
      });
      void z;
    }
  } else if (slot === 2) {
    const t = sim.byId.get(p.target);
    if (!t) return;
    const dmg = V('suri', 2, 'dmg', rank) + 0.7 * u.ad;
    const e = sim.addEffect(t, 'charge', 3, dmg, u.id);
    const arm = () => {
      if (t.dead) return;
      if (e.until <= sim.time) {
        sim.emit({ t: 'fx', kind: 'shock', x: t.x, z: t.z, r: 2.4, color: 0xff8030, dur: 0.5 });
        for (const x of sim.unitsInCircle(t.x, t.z, 2.4, enemyOf(sim, u))) hit(sim, u, x, 2, dmg, 'physical', 'Parcel Charge');
        sim.emit({ t: 'sfx', name: 'boom', x: t.x, z: t.z });
        return;
      }
      sim.after(0.1, arm);
    };
    sim.after(0.1, arm);
  } else {
    const dmg0 = V('suri', 3, 'dmg', rank) + 1.2 * u.ad;
    const len = 30;
    sim.emit({ t: 'fx', kind: 'beam', x: u.x, z: u.z, r: len, color: 0xff6a30, dx: n.x, dz: n.z, dur: 0.45 });
    for (const t of sim.unitsInRect(u.x, u.z, n.x, n.z, len, 1.6, enemyOf(sim, u))) {
      const along = (t.x - u.x) * n.x + (t.z - u.z) * n.z;
      hit(sim, u, t, 3, dmg0 * (1 + 0.6 * clamp(along / len, 0, 1)), 'physical', 'Redline Delivery');
      sim.emit({ t: 'hit', x: t.x, z: t.z, color: 0xff6a30, big: true });
    }
    sim.emit({ t: 'sfx', name: 'beam', x: u.x, z: u.z });
  }
};

// ---------------------------------------------------------------- Oru
const oru: Impl = (sim, u, slot, rank, p) => {
  const n = norm(p.dx, p.dz);
  if (slot === 0) {
    const dmg = V('oru', 0, 'dmg', rank) + 0.6 * u.ap;
    const sh = V('oru', 0, 'shield', rank) + 0.3 * u.ap;
    sim.spawnProjectile({
      team: u.team, owner: u.id, x: u.x + n.x * 0.6, z: u.z + n.z * 0.6, dx: n.x, dz: n.z, speed: 11, range: 11, radius: 0.8, hitsAllies: true, color: 0xb0a0ff, size: 0.5, fx: 'swarm', dmg,
      onHit: (_pr, t) => {
        if (t.team === u.team) { sim.grantShield(u, t, sh, 2.5); }
        else { hit(sim, u, t, 0, dmg, 'arcane', 'Luminous Swarm'); sim.emit({ t: 'hit', x: t.x, z: t.z, color: 0xb0a0ff }); }
      },
    });
  } else if (slot === 1) {
    const dur = V('oru', 1, 'dur', rank);
    sim.spawnZone({
      team: u.team, owner: u.id, x: p.tx, z: p.tz, r: 4.2, until: sim.time + dur + 0.2, tickEvery: 0.2, power: 2, tag: 'hush', fx: 'hush', color: 0x9a7aff,
      onTick: (z) => { for (const t of sim.unitsInCircle(z.x, z.z, z.r, (x) => x.kind === 'hero' && x.team !== u.team && !x.dead)) sim.addEffect(t, 'hush', 0.45, 1, u.id); },
    });
    sim.emit({ t: 'sfx', name: 'hush', x: p.tx, z: p.tz });
  } else if (slot === 2) {
    const t = sim.byId.get(p.target);
    if (!t) return;
    sim.addEffect(t, 'haste', 3, V('oru', 2, 'speed', rank) / 100, u.id, { tag: 'draft' });
    sim.addEffect(t, 'guided', 4, 1, u.id);
    fxRing(sim, t.x, t.z, 1.6, 0x7ff0ff, 0.6);
  } else {
    const sh = V('oru', 3, 'shield', rank) + 0.4 * u.ap;
    const dmg = V('oru', 3, 'dmg', rank) + 0.5 * u.ap;
    sim.spawnProjectile({
      team: u.team, owner: u.id, x: u.x + n.x, z: u.z + n.z, dx: n.x, dz: n.z, speed: 9.5, range: 20, radius: 3.0, pierce: true, hitsAllies: true, ult: true, power: 3, color: 0xc090ff, size: 3, fx: 'wave', dmg,
      onHit: (_pr, t) => {
        if (t.team === u.team) { if (t.kind === 'hero') sim.grantShield(u, t, sh, 4); }
        else {
          hit(sim, u, t, 3, dmg, 'arcane', 'Night Migration');
          if (t.kind === 'hero') sim.addEffect(t, 'root', 1.1, 1, u.id);
        }
      },
    });
    sim.emit({ t: 'sfx', name: 'wave', x: u.x, z: u.z });
  }
};

// ---------------------------------------------------------------- Kesh
const kesh: Impl = (sim, u, slot, rank, p, isRecast) => {
  const n = norm(p.dx, p.dz);
  if (slot === 0) {
    const dmg = V('kesh', 0, 'dmg', rank) + 0.6 * u.ad;
    const miss = V('kesh', 0, 'miss', rank) / 100;
    const range = 3.4;
    sim.emit({ t: 'fx', kind: 'cone', x: u.x, z: u.z, r: range, color: isRecast ? 0xd9e67a : 0x8ee060, dx: n.x, dz: n.z, dur: 0.35 });
    for (const t of sim.unitsInCone(u.x, u.z, n.x, n.z, range, 0.9, enemyOf(sim, u))) {
      const extra = isRecast ? (t.maxHp - t.hp) * miss : 0;
      hit(sim, u, t, 0, dmg + (t.kind === 'monster' ? Math.min(extra, 150) : extra), 'physical', 'Reed Cleaver');
      sim.emit({ t: 'hit', x: t.x, z: t.z, color: 0x8ee060 });
    }
    if (isRecast) finishRecast(sim, u, 0);
    sim.emit({ t: 'sfx', name: 'swing', x: u.x, z: u.z });
  } else if (slot === 1) {
    const dr = V('kesh', 1, 'dr', rank) / 100;
    sim.addEffect(u, 'dr', 2, dr, u.id, { tag: 'bog' });
    const e = sim.addEffect(u, 'bog', 2.05, 0, u.id);
    sim.emit({ t: 'fx', kind: 'shield', x: u.x, z: u.z, r: 1.4, color: 0x7aa860, dur: 2 });
    sim.after(2, () => {
      if (u.dead) return;
      const slow = clamp((e.data ?? 0) / 420, 0.15, 0.5);
      sim.emit({ t: 'fx', kind: 'shock', x: u.x, z: u.z, r: 4, color: 0x7aa860, dur: 0.5 });
      for (const t of sim.unitsInCircle(u.x, u.z, 4, enemyOf(sim, u))) sim.addEffect(t, 'slow', 1.6, slow, u.id, { tag: 'bog' });
    });
  } else if (slot === 2) {
    const as = V('kesh', 2, 'as', rank) / 100;
    sim.emit({ t: 'fx', kind: 'burrow', x: u.x, z: u.z, r: 1.4, color: 0x5a8a40, dur: 0.6 });
    sim.startDash(u, u.x + n.x * 7, u.z + n.z * 7, 0.35, 'dash', {
      onEnd: () => {
        sim.addEffect(u, 'mod', 3, 0, u.id, { mods: { as }, tag: 'sink' });
        sim.emit({ t: 'fx', kind: 'burst', x: u.x, z: u.z, r: 1.6, color: 0x5a8a40, dur: 0.5 });
      },
    });
  } else {
    const dur = V('kesh', 3, 'dur', rank);
    sim.spawnZone({
      team: u.team, owner: u.id, x: u.x, z: u.z, r: 6, until: sim.time + dur, tickEvery: 0.25, power: 3, ult: true, tag: 'fen', fx: 'marsh', color: 0x4a8a3a, friendly: true,
      onTick: (z) => {
        for (const t of sim.unitsInCircle(z.x, z.z, z.r, (x) => !x.dead && !x.stype && x.kind !== 'ward')) {
          if (t.id === u.id) sim.addEffect(t, 'haste', 0.4, 0.25, u.id, { tag: 'fen' });
          else if (t.team !== u.team) {
            sim.addEffect(t, 'slow', 0.4, 0.3, u.id, { tag: 'fen' });
            if (t.kind === 'hero') t.revealUntil[u.team] = Math.max(t.revealUntil[u.team], sim.time + 0.4);
          }
        }
      },
    });
    sim.emit({ t: 'sfx', name: 'marsh', x: u.x, z: u.z });
  }
};

// ---------------------------------------------------------------- Ilyra
const ilyra: Impl = (sim, u, slot, rank, p) => {
  const n = norm(p.dx, p.dz);
  const h = u.hero!;
  if (slot === 0) {
    const dmg = V('ilyra', 0, 'dmg', rank) + 0.7 * u.ap;
    const launch = (x: number, z: number, dx: number, dz: number, mult: number) => sim.spawnProjectile({
      team: u.team, owner: u.id, x, z, dx, dz, speed: 26, range: 14, radius: 0.55, pierce: true, color: 0x9ab8ff, size: 0.4, fx: 'line', dmg: dmg * mult, tag: 'linebreak',
      onHit: (pr, t) => {
        if (t.team === u.team) return;
        const k = (pr.firstHeroHit ? 0.7 : 1) * mult;
        hit(sim, u, t, 0, dmg * k, 'arcane', 'Linebreak');
        sim.emit({ t: 'hit', x: t.x, z: t.z, color: 0x9ab8ff });
      },
    });
    launch(u.x + n.x * 0.6, u.z + n.z * 0.6, n.x, n.z, 1);
    // Footnote: sigil on the line repeats the spell at a new angle
    for (const z of sim.zones) {
      if (z.tag !== 'sigil' || z.owner !== u.id || z.until <= sim.time) continue;
      const rx = z.x - u.x, rz = z.z - u.z;
      const along = rx * n.x + rz * n.z, across = Math.abs(-rx * n.z + rz * n.x);
      if (along > 0 && along < 14 && across < 1.8) {
        z.until = 0;
        const copy = V('ilyra', 1, 'copy', h.ranks[1] || 1) / 100;
        const target = sim.nearestEnemyHero({ ...u, x: z.x, z: z.z } as Unit, 12, false);
        let ang = Math.atan2(n.z, n.x) + 0.6;
        if (target) ang = Math.atan2(target.z - z.z, target.x - z.x);
        const sx = z.x, sz = z.z;
        sim.after(along / 26 + 0.05, () => {
          launch(sx, sz, Math.cos(ang), Math.sin(ang), copy);
          sim.emit({ t: 'fx', kind: 'ring', x: sx, z: sz, r: 1.8, color: 0xffe27a, dur: 0.5 });
        });
        break;
      }
    }
    sim.emit({ t: 'sfx', name: 'zap', x: u.x, z: u.z });
  } else if (slot === 1) {
    for (const z of sim.zones) if (z.tag === 'sigil' && z.owner === u.id) z.until = 0;
    sim.spawnZone({ team: u.team, owner: u.id, x: p.tx, z: p.tz, r: 1.6, until: sim.time + 6, tag: 'sigil', fx: 'sigil', color: 0xffe27a, friendly: true });
  } else if (slot === 2) {
    const dmg = V('ilyra', 2, 'dmg', rank) + 0.4 * u.ap;
    const sil = V('ilyra', 2, 'sil', rank);
    const len = 7, wid = 3.2;
    const cx = p.tx, cz = p.tz;
    const sx = cx - n.x * len / 2, sz = cz - n.z * len / 2;
    sim.emit({ t: 'fx', kind: 'rect', x: cx, z: cz, r: len, color: 0xffe27a, dx: n.x, dz: n.z, dur: 0.5 });
    for (const t of sim.unitsInRect(sx, sz, n.x, n.z, len, wid, enemyOf(sim, u))) {
      hit(sim, u, t, 2, dmg, 'arcane', 'Redaction');
      if (t.kind === 'hero') sim.addEffect(t, 'silence', sil, 1, u.id);
    }
    const inRect = (x: number, z: number) => {
      const rx = x - sx, rz = z - sz;
      const a = rx * n.x + rz * n.z, c = Math.abs(-rx * n.z + rz * n.x);
      return a >= 0 && a <= len && c <= wid / 2 + 0.6;
    };
    for (const pr of sim.projectiles) if (pr.team !== u.team && !pr.ult && pr.power <= 2 && pr.kind === 'skill' && inRect(pr.x, pr.z)) { pr.lifeEnd = -1; sim.emit({ t: 'hit', x: pr.x, z: pr.z, color: 0xffe27a, kind: 'erase' }); }
    for (const z of sim.zones) if (z.team !== u.team && !z.ult && z.power <= 2 && z.tag !== 'sigil' && inRect(z.x, z.z)) { z.until = 0; sim.emit({ t: 'hit', x: z.x, z: z.z, color: 0xffe27a, kind: 'erase' }); }
    for (const w of sim.walls) if (w.team !== u.team && inRect(w.x, w.z)) w.until = 0;
    sim.emit({ t: 'sfx', name: 'erase', x: cx, z: cz });
  } else {
    const dmg = V('ilyra', 3, 'dmg', rank) + 0.4 * u.ap;
    const radii = [2.4, 3.9, 5.5];
    const counts = new Map<number, number>();
    radii.forEach((r, i) => {
      sim.after(i * 0.6, () => {
        if (u.dead && i > 0) { /* rings continue even if caster dies */ }
        sim.emit({ t: 'fx', kind: 'ring', x: p.tx, z: p.tz, r, color: i === 2 ? 0xff7a50 : 0xffe27a, dur: 0.55 });
        for (const t of sim.unitsInCircle(p.tx, p.tz, r, enemyOf(sim, u))) {
          hit(sim, u, t, 3, dmg, 'arcane', 'Final Draft');
          const c = (counts.get(t.id) ?? 0) + 1;
          counts.set(t.id, c);
          if (i === 2 && c >= 3 && t.kind === 'hero') sim.addEffect(t, 'stun', 1.2, 1, u.id);
        }
        sim.emit({ t: 'sfx', name: 'ring', x: p.tx, z: p.tz });
      });
    });
    sim.emit({ t: 'fx', kind: 'warn', x: p.tx, z: p.tz, r: 5.5, color: 0xff7a50, dur: 1.4 });
  }
};

// ---------------------------------------------------------------- Vey
const vey: Impl = (sim, u, slot, rank, p, isRecast) => {
  const n = norm(p.dx, p.dz);
  const h = u.hero!;
  if (slot === 0) {
    const t = sim.byId.get(p.target);
    if (!t) return;
    if ((h.shardCd[t.id] ?? 0) > sim.time) {
      u.mana += 40; h.cds[0] = sim.time; sim.emit({ t: 'reject', unit: u.id, reason: 'Target recently hit' });
      return;
    }
    h.shardCd[t.id] = sim.time + 4;
    const dmg = V('vey', 0, 'dmg', rank) + 0.7 * u.ad;
    const tn = norm(t.x - u.x, t.z - u.z);
    sim.emit({ t: 'fx', kind: 'beam', x: u.x, z: u.z, r: dist(u.x, u.z, t.x, t.z) + 2, color: 0xff5ad2, dx: tn.x, dz: tn.z, dur: 0.3 });
    sim.startDash(u, t.x + tn.x * 2.0, t.z + tn.z * 2.0, 0.16, 'dash', { onEnd: () => { u.facing = Math.atan2(-tn.z, -tn.x); } });
    hit(sim, u, t, 0, dmg, 'physical', 'Shardstep');
    sim.emit({ t: 'hit', x: t.x, z: t.z, color: 0xff5ad2, big: true });
  } else if (slot === 1) {
    const rec = h.rec[1] ?? (h.rec[1] = { until: sim.time + 3, fullCd: 12, data: {} });
    if (!isRecast) {
      const d = sim.blank('decoy', u.team, 'Decoy', u.x, u.z, 0.5);
      d.owner = u.id; d.hp = 90; d.maxHp = 90; d.baseMs = 4.6; d.ms = 4.6; d.armor = 0; d.expires = sim.time + 3; d.vision = 0;
      d.visUntil = [1e9, 1e9];
      d.facing = u.facing;
      sim.setOrder(d, 'move', p.tx, p.tz);
      rec.data = { decoy: d.id };
      sim.emit({ t: 'spawn', unit: d.id });
    } else {
      const d = rec.data?.decoy ? sim.byId.get(rec.data.decoy) : undefined;
      const swap = V('vey', 1, 'swap', rank);
      if (d && !d.dead && dist(u.x, u.z, d.x, d.z) <= swap) {
        const ux = u.x, uz = u.z;
        u.x = d.x; u.z = d.z; d.x = ux; d.z = uz;
        u.px = u.x; u.pz = u.z;
        sim.emit({ t: 'fx', kind: 'burst', x: u.x, z: u.z, r: 1.4, color: 0xff5ad2, dur: 0.4 });
        sim.emit({ t: 'fx', kind: 'burst', x: ux, z: uz, r: 1.4, color: 0xff5ad2, dur: 0.4 });
      } else sim.emit({ t: 'reject', unit: u.id, reason: 'Decoy out of range' });
      finishRecast(sim, u, 1);
    }
  } else if (slot === 2) {
    const dmg = V('vey', 2, 'dmg', rank) + 0.6 * u.ad;
    sim.emit({ t: 'fx', kind: 'cone', x: u.x, z: u.z, r: 5, color: 0xff5ad2, dx: n.x, dz: n.z, dur: 0.35 });
    for (const t of sim.unitsInCone(u.x, u.z, n.x, n.z, 5, 0.8, (x) => !x.dead && x.team !== u.team && (x.kind === 'hero' || x.kind === 'minion' || x.kind === 'ward' || x.kind === 'monster') && (x.kind === 'ward' || sim.canSee(u.team, x)))) {
      if (t.kind === 'ward') { t.disabledUntil = sim.time + 5; sim.emit({ t: 'fx', kind: 'ring', x: t.x, z: t.z, r: 1.4, color: 0xff5ad2, dur: 0.6 }); continue; }
      hit(sim, u, t, 2, dmg, 'physical', 'Cut the Light');
    }
    sim.emit({ t: 'sfx', name: 'swing', x: u.x, z: u.z });
  } else {
    const t = sim.byId.get(p.target);
    if (!t) return;
    const dmg = V('vey', 3, 'dmg', rank) + 1.0 * u.ad;
    sim.addEffect(t, 'prism', 1.25, 1, u.id);
    sim.emit({ t: 'fx', kind: 'mark', x: t.x, z: t.z, r: 1.8, color: 0xff5ad2, dur: 1.2 });
    sim.after(1.2, () => {
      if (t.dead || u.dead) return;
      const d = dist(u.x, u.z, t.x, t.z);
      const los = sightLine(u.x, u.z, t.x, t.z);
      if (d > 13) { sim.emit({ t: 'fx', kind: 'ring', x: t.x, z: t.z, r: 1.6, color: 0x888888, dur: 0.4 }); return; }
      if (los) {
        const dn = norm(t.x - u.x, t.z - u.z);
        const end = sim.clipToWalkable(t.x, t.z, t.x - dn.x * 1.3, t.z - dn.z * 1.3);
        u.x = end.x; u.z = end.z; u.px = u.x; u.pz = u.z; u.facing = Math.atan2(dn.z, dn.x);
        sim.emit({ t: 'fx', kind: 'beam', x: u.x, z: u.z, r: 1.4, color: 0xff5ad2, dx: dn.x, dz: dn.z, dur: 0.3 });
        hit(sim, u, t, 3, dmg, 'physical', 'Prism Sentence');
        sim.emit({ t: 'hit', x: t.x, z: t.z, color: 0xff5ad2, big: true });
      } else {
        hit(sim, u, t, 3, dmg * 0.5, 'physical', 'Prism Sentence (dodged)');
      }
      sim.emit({ t: 'sfx', name: 'prism', x: t.x, z: t.z });
    });
  }
};

export const HERO_IMPL: Record<string, Impl> = { brannoch, suri, oru, kesh, ilyra, vey };

// ---------------------------------------------------------------- hooks
export function heroOnAttack(sim: Sim, u: Unit, t: Unit): { bonus: number; pen: number; dtype?: DamageType } {
  const h = u.hero!;
  let bonus = 0, pen = 0;
  let dtype: DamageType | undefined;
  switch (h.heroId) {
    case 'suri':
      if (h.hotCharge) {
        bonus += 12 + 0.3 * u.ad + h.level * 2;
        h.hotCharge = false;
        sim.emit({ t: 'hit', x: t.x, z: t.z, color: 0xff8a30, kind: 'ember' });
      }
      h.lastMoveDist = 0;
      break;
    case 'vey': {
      if (h.refractReady) {
        const ang = Math.atan2(t.z - u.z, t.x - u.x);
        const last = h.lastAttackAngle[t.id];
        if (last === undefined || Math.abs(angDiff(last, ang)) > 0.9) {
          bonus += 18 + 0.35 * u.ad;
          pen += 0.3;
          h.refractReady = false;
          sim.emit({ t: 'hit', x: t.x, z: t.z, color: 0xff5ad2, big: true, kind: 'refract' });
          if (t.kind === 'hero' && dist(u.x, u.z, t.x, t.z) < 7) sim.emit({ t: 'glint', x: u.x, z: u.z, target: t.id });
        }
      }
      h.lastAttackAngle[t.id] = Math.atan2(t.z - u.z, t.x - u.x);
      break;
    }
    case 'kesh': {
      keshMark(sim, u, t);
      break;
    }
    case 'ilyra':
    case 'oru':
      dtype = undefined;
      break;
  }
  return { bonus, pen, dtype };
}

function keshMark(sim: Sim, u: Unit, t: Unit) {
  const h = u.hero!;
  if (h.heroId !== 'kesh') return;
  if (!h.markId || !sim.byId.get(h.markId) || sim.byId.get(h.markId)!.dead) h.markId = t.id;
  if (h.markId === t.id && h.markCd <= sim.time) {
    sim.heal(u, 22 + 0.025 * u.maxHp);
    h.markCd = sim.time + 6;
    sim.emit({ t: 'fx', kind: 'heal', x: u.x, z: u.z, r: 1.2, color: 0xd9e67a, dur: 0.6 });
  }
}

export function heroOnAbilityHit(sim: Sim, u: Unit, t: Unit, slot: number) {
  const h = u.hero!;
  if (t.dead && t.kind !== 'hero') { /* still process refunds */ }
  // Oru Guiding Draft: next ability hit on an enemy hero marks it for team vision
  if (t.kind === 'hero' && t.team !== u.team) {
    const g = sim.getEffect(u, 'guided');
    if (g) { g.until = 0; t.revealUntil[u.team] = Math.max(t.revealUntil[u.team], sim.time + 4); sim.emit({ t: 'fx', kind: 'mark', x: t.x, z: t.z, r: 1.6, color: 0x7ff0ff, dur: 1 }); }
  }
  if (h.heroId === 'kesh') keshMark(sim, u, t);
  if (h.heroId === 'ilyra' && t.kind === 'hero' && !t.dead) {
    const bit = 1 << slot;
    const m = (h.annotations[t.id] ?? 0) | bit;
    let pop = 0;
    for (let i = 0; i < 4; i++) if (m & (1 << i)) pop++;
    if (pop >= 3) {
      h.annotations[t.id] = 0;
      sim.damage(u, t, 40 + 0.35 * u.ap + h.level * 6, 'arcane', { label: 'Margin Notes' });
      sim.emit({ t: 'fx', kind: 'burst', x: t.x, z: t.z, r: 1.8, color: 0xffe27a, dur: 0.5 });
      sim.emit({ t: 'hit', x: t.x, z: t.z, color: 0xffe27a, big: true, kind: 'note' });
    } else h.annotations[t.id] = m;
  }
  // Quiet Index: far hits refund a little cooldown once per cast
  if (hasItem(h, 'quietindex') && slot >= 0 && slot <= 3 && dist(u.x, u.z, t.x, t.z) > 7 && h.cds[slot] > sim.time) {
    const key = 'q' + slot;
    if (h.pa !== sim.tick || h.pb !== slot) { h.cds[slot] = Math.max(sim.time, h.cds[slot] - 1); h.pa = sim.tick; h.pb = slot; }
    void key;
  }
}

export function heroOnDamaged(_sim: Sim, _tgt: Unit, _src: Unit | null, _dealt: number, _type: DamageType) { /* reserved for reactive passives */ }

export function heroTick(sim: Sim, u: Unit) {
  const h = u.hero!;
  const now = sim.time;
  // recast windows lapsing start the full cooldown
  for (let i = 0; i < 4; i++) {
    const r = h.rec[i];
    if (r && now > r.until) { h.cds[i] = now + r.fullCd * 0.55; h.rec[i] = null; }
  }
  switch (h.heroId) {
    case 'brannoch': {
      const near = sim.nearestEnemyHero(u, 6.5, false);
      if (near) {
        h.stoneNear += 1 / 30;
        if (h.stoneNear >= 3 && h.stoneStacks < 5 && now >= h.pa) { h.stoneStacks++; h.pa = now + 1; sim.emit({ t: 'fx', kind: 'ring', x: u.x, z: u.z, r: 1.4, color: 0xc9bfae, dur: 0.4 }); }
      } else {
        h.stoneNear = 0;
        if (h.stoneStacks > 0 && now >= h.pc) { h.stoneStacks--; h.pc = now + 1.4; }
      }
      break;
    }
    case 'suri':
      if (h.lastMoveDist >= 3) h.hotCharge = true;
      break;
    case 'vey': {
      const seen = u.visUntil[1 - u.team] > now;
      if (!seen && !u.dead) { if (h.unseenSince === 0) h.unseenSince = now; if (now - h.unseenSince >= 1.5) h.refractReady = true; } else h.unseenSince = 0;
      if (u.brush > 0 && !h.refractReady && now - h.lastCombatAt > 0.5) h.refractReady = true;
      break;
    }
  }
}
