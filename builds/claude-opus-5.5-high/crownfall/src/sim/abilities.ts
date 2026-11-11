// Hero kits as small typed code modules. Every cast is validated server-side before release.
import type { Match } from './match';
import type { Unit, Projectile, Zone } from './types';
import type { AbilityDef, HeroId } from '../shared/types';
import { scaled } from '../shared/types';
import { heroStatsAt } from '../shared/heroes';
import { dealDamage, addEffect, addShield, heal, hasEffect } from './combat';
import { walkableAt, nearestWalkable, losClear, raycastWall } from './nav';
import { clearanceAt, brushAt } from '../shared/map';
import { dist, wrapAngle } from '../shared/math';

export interface CastCmd { x?: number; y?: number; target?: number }

export interface AbilityImpl {
  validate?(m: Match, u: Unit, cmd: CastCmd, rank: number): string | null;
  onCastStart?(m: Match, u: Unit, cmd: CastCmd, rank: number): void;
  release(m: Match, u: Unit, cmd: CastCmd, rank: number, castId: number): void;
  canRecast?(m: Match, u: Unit): boolean;
  recast?(m: Match, u: Unit, cmd: CastCmd): void;
  channel?: boolean;
}

export interface AttackMod { bonus: number; bonusType: 'physical' | 'arcane'; penPct?: number; tag?: string }

export interface KitImpl {
  passiveTick?(m: Match, u: Unit, dt: number): void;
  onAttackRelease?(m: Match, u: Unit, target: Unit): AttackMod | void;
  onAttackHit?(m: Match, u: Unit, target: Unit): void;
  onDealtDamage?(m: Match, u: Unit, target: Unit, amt: number, kind: string): void;
  abilities: AbilityImpl[]; // Q W E R
}

// ---------- helpers ----------
export function abilityDef(u: Unit, slot: number): AbilityDef {
  return u.hero!.def.abilities[slot + 1];
}
export function V(u: Unit, slot: number, key: string, rank: number): number {
  const h = u.hero!;
  const baseAd = heroStatsAt(h.def, h.level).ad;
  const v = h.def.abilities[slot + 1].values[key];
  return scaled(v, rank, { ad: u.stats.ad, ap: u.stats.ap, bonusAd: Math.max(0, u.stats.ad - baseAd), maxHp: u.stats.maxHp, level: h.level });
}
function PV(u: Unit, key: string): number {
  const h = u.hero!;
  const baseAd = heroStatsAt(h.def, h.level).ad;
  return scaled(h.def.abilities[0].values[key], 1, { ad: u.stats.ad, ap: u.stats.ap, bonusAd: Math.max(0, u.stats.ad - baseAd), maxHp: u.stats.maxHp, level: h.level });
}
export function dirOf(u: Unit, cmd: CastCmd): { dx: number; dy: number } {
  let dx = (cmd.x ?? u.x + Math.cos(u.facing)) - u.x, dy = (cmd.y ?? u.y + Math.sin(u.facing)) - u.y;
  const l = Math.hypot(dx, dy);
  if (l < 0.01) { dx = Math.cos(u.facing); dy = Math.sin(u.facing); } else { dx /= l; dy /= l; }
  return { dx, dy };
}
export function clampPoint(u: Unit, cmd: CastCmd, range: number): { x: number; y: number } {
  const x = cmd.x ?? u.x, y = cmd.y ?? u.y;
  const d = Math.hypot(x - u.x, y - u.y);
  if (d <= range) return { x, y };
  return { x: u.x + ((x - u.x) / d) * range, y: u.y + ((y - u.y) / d) * range };
}
export function inRect(px: number, py: number, ox: number, oy: number, dx: number, dy: number, length: number, halfW: number, pad = 0): number | null {
  const rx = px - ox, ry = py - oy;
  const along = rx * dx + ry * dy;
  const side = Math.abs(-rx * dy + ry * dx);
  if (along < -pad || along > length + pad || side > halfW + pad) return null;
  return along;
}
export function inCone(px: number, py: number, ox: number, oy: number, ang: number, range: number, halfAngle: number, pad = 0): boolean {
  const d = Math.hypot(px - ox, py - oy);
  if (d > range + pad) return false;
  if (d < 0.8) return true;
  return Math.abs(wrapAngle(Math.atan2(py - oy, px - ox) - ang)) <= halfAngle;
}
const enemyFilter = (m: Match, u: Unit) => (t: Unit) => t.alive && m.isEnemy(u, t) && t.kind !== 'ward' && !t.structure && !t.untargetable;
const enemyHeroFilter = (m: Match, u: Unit) => (t: Unit) => t.alive && m.isEnemy(u, t) && t.kind === 'hero';

function faceDir(u: Unit, dx: number, dy: number) { u.facing = Math.atan2(dy, dx); }

/** Clamp a straight-line dash endpoint to walkable terrain (endpoint correction). */
export function dashEndpoint(u: Unit, ex: number, ey: number, passWalls: boolean): { x: number; y: number } {
  if (!passWalls) {
    const hit = raycastWall(u.x, u.y, ex, ey);
    if (hit) { ex = hit.x; ey = hit.y; }
  }
  if (walkableAt(ex, ey, u.radius * 0.8)) return { x: ex, y: ey };
  // search back toward start
  const steps = 12;
  for (let i = 1; i <= steps; i++) {
    const t = 1 - i / steps;
    const x = u.x + (ex - u.x) * t, y = u.y + (ey - u.y) * t;
    if (walkableAt(x, y, u.radius * 0.8)) return { x, y };
  }
  return nearestWalkable(u.x, u.y, u.radius * 0.8, 3) ?? { x: u.x, y: u.y };
}

function annotate(m: Match, ilyra: Unit, target: Unit, tag: string) {
  if (!target.alive || !ilyra.hero || ilyra.hero.id !== 'ilyra') return;
  if (target.kind !== 'hero' && target.kind !== 'monster') return;
  const set = m.annotations.get(target.id) ?? new Set<string>();
  set.add(tag);
  m.annotations.set(target.id, set);
  m.emit({ e: 'fx', kind: 'annotation', x: target.x, y: target.y, id: target.id, r: set.size }, { x: target.x, y: target.y });
  if (set.size >= 3) {
    m.annotations.delete(target.id);
    dealDamage(m, ilyra, target, PV(ilyra, 'burst'), 'arcane', { kind: 'ability', source: 'Margin Notes' });
    m.emit({ e: 'fx', kind: 'margin-burst', x: target.x, y: target.y }, { x: target.x, y: target.y });
  }
}

// ======================= BRANNOCH =======================
const brannoch: KitImpl = {
  passiveTick(m, u, dt) {
    const p = u.hero!.passive;
    const near = m.unitsInRadius(u.x, u.y, 5, enemyHeroFilter(m, u)).length > 0;
    const far = m.unitsInRadius(u.x, u.y, 7, enemyHeroFilter(m, u)).length === 0;
    if (near && u.alive) {
      p.stoneBuild = (p.stoneBuild ?? 0) + dt;
      p.stoneDecay = 0;
      if (p.stoneBuild >= 3) { p.stoneBuild = 0; if ((p.stoneStacks ?? 0) < 3) { p.stoneStacks = (p.stoneStacks ?? 0) + 1; m.emit({ e: 'fx', kind: 'stone-stack', x: u.x, y: u.y, id: u.id }, { x: u.x, y: u.y }); } }
    } else if (far) {
      p.stoneBuild = 0;
      p.stoneDecay = (p.stoneDecay ?? 0) + dt;
      if (p.stoneDecay >= 2 && (p.stoneStacks ?? 0) > 0) { p.stoneStacks--; p.stoneDecay = 0; }
    }
  },
  abilities: [
    { // Q Fault Hammer
      release(m, u, cmd, rank) {
        const { dx, dy } = dirOf(u, cmd); faceDir(u, dx, dy);
        const dmg = V(u, 0, 'dmg', rank);
        m.emit({ e: 'fx', kind: 'fault-hammer', x: u.x, y: u.y, x2: u.x + dx * 4.2, y2: u.y + dy * 4.2, team: u.team }, { x: u.x, y: u.y });
        for (const t of m.unitsInRadius(u.x, u.y, 5.5, enemyFilter(m, u))) {
          const along = inRect(t.x, t.y, u.x, u.y, dx, dy, 4.2, 1.6, t.radius);
          if (along === null) continue;
          if (along < 2.1) {
            dealDamage(m, u, t, dmg * 1.4, 'physical', { kind: 'ability', source: 'Fault Hammer', slot: 0 });
            addEffect(m, t, { kind: 'stun', until: m.time + 0.5, value: 1, src: u.id }, 'Fault Hammer');
          } else {
            dealDamage(m, u, t, dmg, 'physical', { kind: 'ability', source: 'Fault Hammer', slot: 0 });
            addEffect(m, t, { kind: 'slow', until: m.time + 1.5, value: 0.35, src: u.id }, 'Fault Hammer');
          }
        }
        m.shake(u.x, u.y, 0.25);
      },
    },
    { // W Rampart Fold
      release(m, u, cmd, rank) {
        const c = clampPoint(u, cmd, 7);
        const dx = c.x - u.x, dy = c.y - u.y;
        const R = Math.max(2.5, Math.hypot(dx, dy));
        const base = Math.atan2(dy, dx);
        const hp = V(u, 1, 'hp', rank) / 2.5;
        const segs = 5, spacing = 1.25;
        for (let i = 0; i < segs; i++) {
          const a = base + ((i - (segs - 1) / 2) * spacing) / R;
          const x = u.x + Math.cos(a) * R, y = u.y + Math.sin(a) * R;
          if (!walkableAt(x, y, 0.2)) continue;
          m.spawnWall(u, x, y, 0.72, hp, 3);
        }
        m.emit({ e: 'fx', kind: 'rampart', x: c.x, y: c.y, team: u.team }, { x: c.x, y: c.y });
      },
    },
    { // E Anchor Line
      validate(m, u, cmd) {
        if (cmd.target) {
          const t = m.byId.get(cmd.target);
          if (!t || !t.alive || t.team !== u.team || t.kind !== 'hero' || t.id === u.id) return 'Needs an allied hero or terrain';
          if (dist(u.x, u.y, t.x, t.y) > 9.5) return 'Out of range';
          return null;
        }
        const p = clampPoint(u, cmd, 9);
        if (clearanceAt(p.x, p.y) > 2.2 && walkableAt(p.x, p.y)) return 'No terrain to anchor';
        return null;
      },
      release(m, u, cmd) {
        let ax: number, ay: number, tid = 0;
        if (cmd.target) { const t = m.byId.get(cmd.target)!; ax = t.x; ay = t.y; tid = t.id; } else { const p = clampPoint(u, cmd, 9); ax = p.x; ay = p.y; }
        const z = m.spawnZone({ team: u.team, owner: u.id, x: ax, y: ay, shape: { type: 'circle', r: 0.6 }, dur: 4, visual: 'anchor-line', hostile: false, data: { follow: tid } });
        z.onTick = () => {
          if (z.data.follow) { const t = m.byId.get(z.data.follow); if (t && t.alive) { z.x = t.x; z.y = t.y; } else z.end = m.time; }
        };
        u.hero!.recast[2] = { until: m.time + 4, data: { zone: z.id } };
      },
      canRecast(m, u) { const r = u.hero!.recast[2]; return !!r && r.until > m.time; },
      recast(m, u) {
        const r = u.hero!.recast[2]; delete u.hero!.recast[2];
        const z = m.zones.find((zz) => zz.id === r.data.zone);
        if (!z) return;
        z.end = m.time;
        const dx = z.x - u.x, dy = z.y - u.y, d = Math.hypot(dx, dy);
        const stop = Math.max(0, d - 1.4);
        const end = dashEndpoint(u, u.x + (dx / (d || 1)) * stop, u.y + (dy / (d || 1)) * stop, false);
        const rank = u.hero!.ranks[2];
        m.startDash(u, end.x, end.y, 18, { onEnd: () => addShield(m, u, u, V(u, 2, 'shield', rank), 2.5) });
        m.emit({ e: 'fx', kind: 'anchor-pull', x: u.x, y: u.y, x2: end.x, y2: end.y, team: u.team }, { x: u.x, y: u.y });
      },
    },
    { // R Citybreaker
      onCastStart(m, u, cmd) {
        const p = clampPoint(u, cmd, 11);
        const end = nearestWalkable(p.x, p.y, 0.5, 4) ?? p;
        m.spawnZone({ team: u.team, owner: u.id, x: end.x, y: end.y, shape: { type: 'circle', r: 4 }, dur: 1.1, visual: 'citybreaker-tele', hostile: true, ultimate: true, publicTelegraph: true });
        m.emit({ e: 'fx', kind: 'ult-warning', x: end.x, y: end.y, team: u.team, r: 4 }, { x: end.x, y: end.y, public: true });
      },
      release(m, u, cmd, rank) {
        const p = clampPoint(u, cmd, 11);
        const end = nearestWalkable(p.x, p.y, 0.5, 4) ?? p;
        const dmg = V(u, 3, 'dmg', rank);
        addEffect(m, u, { kind: 'unstoppable', until: m.time + 0.95, value: 1, src: u.id });
        m.startDash(u, end.x, end.y, 0, { dur: 0.9, passWalls: true, airborne: true, arc: 4, onEnd: () => {
          for (const t of m.unitsInRadius(end.x, end.y, 4, enemyFilter(m, u))) {
            dealDamage(m, u, t, dmg, 'physical', { kind: 'ability', source: 'Citybreaker', slot: 3, ult: true });
            addEffect(m, t, { kind: 'airborne', until: m.time + 1.0, value: 1, src: u.id }, 'Citybreaker');
          }
          m.emit({ e: 'fx', kind: 'citybreaker', x: end.x, y: end.y, team: u.team, r: 4 }, { x: end.x, y: end.y });
          m.shake(end.x, end.y, 0.6);
        } });
      },
    },
  ],
};

// ======================= SURI =======================
const suri: KitImpl = {
  passiveTick(m, u) {
    const p = u.hero!.passive;
    if (p.lx === undefined) { p.lx = u.x; p.ly = u.y; p.charge = 0; }
    const moved = Math.hypot(u.x - p.lx, u.y - p.ly);
    if (moved < 3) p.charge = Math.min(100, (p.charge ?? 0) + moved * 16);
    p.lx = u.x; p.ly = u.y;
  },
  onAttackRelease(m, u) {
    const p = u.hero!.passive;
    const c = p.charge ?? 0;
    p.charge = 0;
    if (c < 5) return;
    return { bonus: PV(u, 'ember') * (c / 100), bonusType: 'arcane', tag: 'ember' };
  },
  onAttackHit(m, u, t) {
    for (const pc of m.parcels) if (pc.target === t.id && pc.owner === u.id) pc.at -= 1;
  },
  abilities: [
    { // Q Ricochet Bolt
      release(m, u, cmd, rank) {
        const { dx, dy } = dirOf(u, cmd); faceDir(u, dx, dy);
        const dmg = V(u, 0, 'dmg', rank);
        m.spawnProjectile({ owner: u, dx, dy, speed: 26, maxDist: 15, radius: 0.3, visual: 'ricochet', bounces: 0,
          onHit: (t) => { dealDamage(m, u, t, dmg, 'physical', { kind: 'ability', source: 'Ricochet Bolt', slot: 0 }); return true; },
          onWall: (p, hit) => {
            if (p.bounces >= 1) return true;
            p.bounces++;
            const dot = p.dx * hit.nx + p.dy * hit.ny;
            p.dx -= 2 * dot * hit.nx; p.dy -= 2 * dot * hit.ny;
            const l = Math.hypot(p.dx, p.dy); p.dx /= l; p.dy /= l;
            m.emit({ e: 'fx', kind: 'bounce', x: p.x, y: p.y }, { x: p.x, y: p.y });
            return false;
          } });
      },
    },
    { // W Slipstream
      release(m, u, cmd, rank) {
        const { dx, dy } = dirOf(u, cmd); faceDir(u, dx, dy);
        const end = dashEndpoint(u, u.x + dx * 4.5, u.y + dy * 4.5, false);
        const sx = u.x, sy = u.y;
        const len = Math.hypot(end.x - sx, end.y - sy);
        const haste = V(u, 1, 'haste', rank) / 100;
        m.startDash(u, end.x, end.y, 16, {});
        const z = m.spawnZone({ team: u.team, owner: u.id, x: (sx + end.x) / 2, y: (sy + end.y) / 2, shape: { type: 'rect', w: 1.8, l: Math.max(1, len + 1), ang: Math.atan2(dy, dx) }, dur: 3, visual: 'slipstream', hostile: false, data: { used: [] as number[] } });
        z.onTick = () => {
          for (const a of m.unitsInRadius(z.x, z.y, len / 2 + 1.5, (t) => t.alive && t.team === u.team && t.kind === 'hero')) {
            if (z.data.used.includes(a.id)) continue;
            if (inRect(a.x, a.y, sx - dx * 0.5, sy - dy * 0.5, dx, dy, len + 1, 0.9, a.radius) === null) continue;
            if (a.id === u.id && m.time - z.start < 0.4) continue;
            z.data.used.push(a.id);
            addEffect(m, a, { kind: 'haste', until: m.time + 2, value: haste, src: u.id, tag: 'slipstream' });
          }
        };
      },
    },
    { // E Parcel Charge
      validate(m, u, cmd) {
        const t = cmd.target ? m.byId.get(cmd.target) : undefined;
        if (!t || !t.alive || !m.isEnemy(u, t) || t.structure || t.kind === 'ward') return 'Needs an enemy unit';
        return null;
      },
      release(m, u, cmd, rank) {
        const t = m.byId.get(cmd.target!)!;
        const dmg = V(u, 2, 'dmg', rank);
        m.parcels.push({ owner: u.id, target: t.id, at: m.time + 4, dmg });
        m.emit({ e: 'fx', kind: 'parcel', x: t.x, y: t.y, id: t.id, team: u.team }, { x: t.x, y: t.y });
      },
    },
    { // R Redline Delivery
      channel: true,
      onCastStart(m, u, cmd) {
        const { dx, dy } = dirOf(u, cmd); faceDir(u, dx, dy);
        u.revealUntil = m.time + 1.0;
        m.spawnZone({ team: u.team, owner: u.id, x: u.x + dx * 16, y: u.y + dy * 16, shape: { type: 'rect', w: 1.1, l: 32, ang: Math.atan2(dy, dx) }, dur: 0.85, visual: 'redline-tele', hostile: true, ultimate: true, publicTelegraph: true });
        m.emit({ e: 'fx', kind: 'ult-warning', x: u.x, y: u.y, team: u.team }, { x: u.x, y: u.y, public: true });
      },
      release(m, u, cmd, rank) {
        const { dx, dy } = dirOf(u, cmd);
        const dmg = V(u, 3, 'dmg', rank);
        m.spawnProjectile({ owner: u, dx, dy, speed: 42, maxDist: 32, radius: 0.55, visual: 'redline', pierce: true, ultimate: true, passWalls: true,
          onHit: (t, p) => {
            const mult = 0.6 + 0.9 * Math.min(1, p.traveled / 32);
            if (t.kind === 'hero') {
              dealDamage(m, u, t, dmg * mult, 'physical', { kind: 'ability', source: 'Redline Delivery', slot: 3, ult: true });
              m.emit({ e: 'fx', kind: 'redline-hit', x: t.x, y: t.y }, { x: t.x, y: t.y });
              return true;
            }
            dealDamage(m, u, t, dmg * mult * 0.5, 'physical', { kind: 'ability', source: 'Redline Delivery', slot: 3, ult: true });
            return false;
          } });
        m.shake(u.x, u.y, 0.2);
      },
    },
  ],
};

// ======================= ORU =======================
const oru: KitImpl = {
  abilities: [
    { // Q Luminous Swarm
      release(m, u, cmd, rank, castId) {
        const { dx, dy } = dirOf(u, cmd); faceDir(u, dx, dy);
        const dmg = V(u, 0, 'dmg', rank), sh = V(u, 0, 'shield', rank);
        m.spawnProjectile({ owner: u, dx, dy, speed: 9, maxDist: 10, radius: 0.65, visual: 'swarm', hitAllies: true,
          filter: (t) => t.id !== u.id && (m.isEnemy(u, t) || (t.team === u.team && t.kind === 'hero')),
          onHit: (t) => {
            if (t.team === u.team) addShield(m, u, t, sh, 2.5, true);
            else dealDamage(m, u, t, dmg, 'arcane', { kind: 'ability', source: 'Luminous Swarm', slot: 0, castId });
            return true;
          } });
      },
    },
    { // W Hush Field
      release(m, u, cmd, rank) {
        const p = clampPoint(u, cmd, 8);
        const slow = V(u, 1, 'slow', rank) / 100;
        const z = m.spawnZone({ team: u.team, owner: u.id, x: p.x, y: p.y, shape: { type: 'circle', r: 4 }, dur: 3.5, visual: 'hush', hostile: true, data: { hush: 1 } });
        z.visionMul = 0.35;
        z.onTick = () => {
          for (const t of m.unitsInRadius(z.x, z.y, 4, enemyFilter(m, u))) addEffect(m, t, { kind: 'slow', until: m.time + 0.2, value: slow, src: u.id, tag: 'hush' });
        };
      },
    },
    { // E Guiding Draft
      validate(m, u, cmd) {
        const t = cmd.target ? m.byId.get(cmd.target) : u;
        if (!t || !t.alive || t.team !== u.team || t.kind !== 'hero') return 'Needs an allied hero';
        return null;
      },
      release(m, u, cmd, rank) {
        const t = (cmd.target ? m.byId.get(cmd.target) : u)!;
        addEffect(m, t, { kind: 'haste', until: m.time + 2.5, value: V(u, 2, 'haste', rank) / 100, src: u.id, tag: 'draft' });
        addEffect(m, t, { kind: 'draftMark', until: m.time + 4, value: 1, src: u.id });
        m.emit({ e: 'fx', kind: 'draft', x: t.x, y: t.y, id: t.id, team: u.team }, { x: t.x, y: t.y });
      },
    },
    { // R Night Migration
      release(m, u, cmd, rank) {
        const { dx, dy } = dirOf(u, cmd); faceDir(u, dx, dy);
        const sx = u.x, sy = u.y;
        const sh = V(u, 3, 'shield', rank), dmg = V(u, 3, 'dmg', rank);
        const dur = 1.4, len = 14;
        const z = m.spawnZone({ team: u.team, owner: u.id, x: sx, y: sy, shape: { type: 'rect', w: 8, l: 1.6, ang: Math.atan2(dy, dx) }, dur, visual: 'migration', hostile: true, ultimate: true, data: { hit: [] as number[], shielded: [] as number[] } });
        z.onTick = () => {
          const prog = Math.min(1, (m.time - z.start) / dur);
          const edge = prog * len;
          z.x = sx + dx * edge; z.y = sy + dy * edge;
          for (const t of m.unitsInRadius(z.x, z.y, 7, (t) => t.alive && t.kind !== 'ward' && !t.structure)) {
            const along = inRect(t.x, t.y, sx, sy, dx, dy, edge, 4, t.radius);
            if (along === null) continue;
            if (t.team === u.team && t.kind === 'hero') {
              if (!z.data.shielded.includes(t.id)) { z.data.shielded.push(t.id); addShield(m, u, t, sh, 3, true); }
            } else if (m.isEnemy(u, t) && !t.untargetable && along >= edge - 1.4 && !z.data.hit.includes(t.id)) {
              z.data.hit.push(t.id);
              dealDamage(m, u, t, dmg, 'arcane', { kind: 'ability', source: 'Night Migration', slot: 3, ult: true });
              addEffect(m, t, { kind: 'root', until: m.time + 1.0, value: 1, src: u.id }, 'Night Migration');
            }
          }
        };
        m.emit({ e: 'fx', kind: 'ult-warning', x: sx, y: sy, team: u.team }, { x: sx, y: sy, public: true });
      },
    },
  ],
};

// ======================= KESH =======================
const kesh: KitImpl = {
  onDealtDamage(m, u, t) {
    if (t.kind !== 'hero' && t.kind !== 'monster') return;
    const p = u.hero!.passive;
    if (!p[`mk${t.id}`]) { p[`mk${t.id}`] = 1; m.emit({ e: 'fx', kind: 'kesh-mark', x: t.x, y: t.y, id: t.id }, { x: t.x, y: t.y }); }
  },
  onAttackHit(m, u, t) {
    const p = u.hero!.passive;
    if (p[`mk${t.id}`] && (p.healReady ?? 0) <= m.time) {
      p.healReady = m.time + 4;
      heal(m, u, u, PV(u, 'heal'));
    }
  },
  abilities: [
    { // Q Reed Cleaver
      release(m, u, cmd, rank) {
        const { dx, dy } = dirOf(u, cmd); faceDir(u, dx, dy);
        const ang = Math.atan2(dy, dx);
        const swing = (second: boolean) => {
          if (!u.alive) return;
          const a = second ? u.facing : ang;
          const dmg = V(u, 0, 'dmg', rank);
          m.emit({ e: 'fx', kind: second ? 'cleave2' : 'cleave1', x: u.x, y: u.y, x2: u.x + Math.cos(a) * 3.6, y2: u.y + Math.sin(a) * 3.6, team: u.team }, { x: u.x, y: u.y });
          for (const t of m.unitsInRadius(u.x, u.y, 4.5, enemyFilter(m, u))) {
            if (!inCone(t.x, t.y, u.x, u.y, a, 3.6, (50 * Math.PI) / 180, t.radius)) continue;
            let d = dmg;
            if (second) d += Math.min(t.kind === 'monster' ? 250 : 9999, 0.08 * (t.stats.maxHp - t.hp));
            dealDamage(m, u, t, d, 'physical', { kind: 'ability', source: 'Reed Cleaver', slot: 0 });
          }
        };
        swing(false);
        m.schedule(0.45, () => swing(true));
      },
    },
    { // W Bogskin
      release(m, u, cmd, rank) {
        u.hero!.passive.bogAbsorbed = 0;
        addEffect(m, u, { kind: 'dr', until: m.time + 2.5, value: 0.35, src: u.id, tag: 'bogskin' });
        m.emit({ e: 'fx', kind: 'bogskin', x: u.x, y: u.y, id: u.id, team: u.team }, { x: u.x, y: u.y });
        m.schedule(2.5, () => {
          if (!u.alive) return;
          const ab = u.hero!.passive.bogAbsorbed ?? 0;
          const slow = Math.min(0.5, 0.15 + ab / 8 / 100);
          const dmg = V(u, 1, 'dmg', rank) + ab * 0.3;
          m.emit({ e: 'fx', kind: 'bog-burst', x: u.x, y: u.y, r: 4, team: u.team }, { x: u.x, y: u.y });
          for (const t of m.unitsInRadius(u.x, u.y, 4, enemyFilter(m, u))) {
            dealDamage(m, u, t, dmg, 'physical', { kind: 'ability', source: 'Bogskin', slot: 1 });
            addEffect(m, t, { kind: 'slow', until: m.time + 1.5, value: slow, src: u.id }, 'Bogskin');
          }
        });
      },
    },
    { // E Sinkstep
      release(m, u, cmd, rank) {
        const { dx, dy } = dirOf(u, cmd); faceDir(u, dx, dy);
        const end = dashEndpoint(u, u.x + dx * 5.5, u.y + dy * 5.5, true);
        m.emit({ e: 'fx', kind: 'sinkstep', x: u.x, y: u.y, x2: end.x, y2: end.y }, { x: u.x, y: u.y });
        m.startDash(u, end.x, end.y, 13, { passWalls: true, onEnd: () => {
          addEffect(m, u, { kind: 'asBuff', until: m.time + 3, value: V(u, 2, 'as', rank) / 100, src: u.id, tag: 'sinkstep' });
          m.emit({ e: 'fx', kind: 'emerge', x: u.x, y: u.y }, { x: u.x, y: u.y });
        } });
      },
    },
    { // R Fen Claim
      release(m, u, cmd, rank) {
        const z = m.spawnZone({ team: u.team, owner: u.id, x: u.x, y: u.y, shape: { type: 'circle', r: 7 }, dur: 6, visual: 'fen', hostile: true, ultimate: true, publicTelegraph: true, data: { acc: 0 } });
        z.onTick = (zz, dt) => {
          zz.data.acc += dt;
          const tickDmg = zz.data.acc >= 0.5;
          if (tickDmg) zz.data.acc -= 0.5;
          if (u.alive && dist(u.x, u.y, z.x, z.y) <= 7) u.hero!.passive.fenUntil = m.time + 0.15;
          for (const t of m.unitsInRadius(z.x, z.y, 7, enemyFilter(m, u))) {
            addEffect(m, t, { kind: 'slow', until: m.time + 0.2, value: 0.25, src: u.id, tag: 'fen' });
            t.revealUntil = Math.max(t.revealUntil, m.time + 0.25);
            if (tickDmg) dealDamage(m, u, t, V(u, 3, 'dps', rank) * 0.5, 'physical', { kind: 'ability', source: 'Fen Claim', slot: 3, ult: true, noEvent: false });
          }
        };
        m.emit({ e: 'fx', kind: 'fen-cast', x: u.x, y: u.y, r: 7, team: u.team }, { x: u.x, y: u.y, public: true });
      },
    },
  ],
};

// ======================= ILYRA =======================
function linebreak(m: Match, u: Unit, sx: number, sy: number, dx: number, dy: number, dmg: number, range: number, tag: string, castId: number, allowEcho: boolean) {
  const st = { heroHits: 0 };
  const p = m.spawnProjectile({ owner: u, dx, dy, speed: 30, maxDist: range, radius: 0.32, visual: tag === 'w' ? 'linebreak-echo' : 'linebreak', pierce: true, x: sx, y: sy,
    onHit: (t) => {
      let d = dmg;
      if (t.kind === 'hero') { if (st.heroHits > 0) d *= 0.6; st.heroHits++; }
      dealDamage(m, u, t, d, 'arcane', { kind: 'ability', source: tag === 'w' ? 'Footnote' : 'Linebreak', slot: tag === 'w' ? 1 : 0, castId });
      annotate(m, u, t, tag);
      return false;
    } });
  if (allowEcho) p.data.echoCheck = true;
  p.data.echo = (pp: Projectile) => {
    const sig = m.zones.find((z) => z.alive && z.owner === u.id && z.visual === 'footnote' && !z.data.used && dist(z.x, z.y, pp.x, pp.y) <= 1.5);
    if (!sig) return;
    sig.data.used = true; sig.end = m.time;
    let best: Unit | null = null, bd = 10;
    for (const h of m.unitsInRadius(sig.x, sig.y, 10, enemyHeroFilter(m, u))) {
      if (!m.visibleTo(u.team as 0 | 1, h)) continue;
      const d = dist(sig.x, sig.y, h.x, h.y);
      if (d < bd) { bd = d; best = h; }
    }
    let ex: number, ey: number;
    if (best) { ex = best.x - sig.x; ey = best.y - sig.y; const l = Math.hypot(ex, ey) || 1; ex /= l; ey /= l; } else {
      const a = Math.atan2(dy, dx) + 0.52; ex = Math.cos(a); ey = Math.sin(a);
    }
    m.emit({ e: 'fx', kind: 'footnote-echo', x: sig.x, y: sig.y }, { x: sig.x, y: sig.y });
    const rank = u.hero!.ranks[0];
    linebreak(m, u, sig.x, sig.y, ex, ey, V(u, 0, 'dmg', rank) * 0.4, 10, 'w', castId, false);
  };
  return p;
}

const ilyra: KitImpl = {
  abilities: [
    { // Q Linebreak
      release(m, u, cmd, rank, castId) {
        const { dx, dy } = dirOf(u, cmd); faceDir(u, dx, dy);
        linebreak(m, u, u.x, u.y, dx, dy, V(u, 0, 'dmg', rank), 12, 'q', castId, true);
      },
    },
    { // W Footnote
      release(m, u, cmd) {
        const p = clampPoint(u, cmd, 9);
        for (const z of m.zones) if (z.owner === u.id && z.visual === 'footnote') z.end = m.time;
        m.spawnZone({ team: u.team, owner: u.id, x: p.x, y: p.y, shape: { type: 'circle', r: 1.4 }, dur: 6, visual: 'footnote', hostile: false, data: { used: false } });
      },
    },
    { // E Redaction
      onCastStart(m, u, cmd) {
        const { dx, dy } = dirOf(u, cmd); faceDir(u, dx, dy);
        m.spawnZone({ team: u.team, owner: u.id, x: u.x + dx * 4, y: u.y + dy * 4, shape: { type: 'rect', w: 3, l: 8, ang: Math.atan2(dy, dx) }, dur: 0.4, visual: 'redaction-tele', hostile: true });
      },
      release(m, u, cmd, rank, castId) {
        const { dx, dy } = dirOf(u, cmd);
        const dmg = V(u, 2, 'dmg', rank);
        m.emit({ e: 'fx', kind: 'redaction', x: u.x, y: u.y, x2: u.x + dx * 8, y2: u.y + dy * 8, team: u.team }, { x: u.x, y: u.y });
        for (const t of m.unitsInRadius(u.x + dx * 4, u.y + dy * 4, 6, enemyFilter(m, u))) {
          if (inRect(t.x, t.y, u.x, u.y, dx, dy, 8, 1.5, t.radius) === null) continue;
          dealDamage(m, u, t, dmg, 'arcane', { kind: 'ability', source: 'Redaction', slot: 2, castId });
          addEffect(m, t, { kind: 'silence', until: m.time + 1.2, value: 1, src: u.id }, 'Redaction');
          annotate(m, u, t, 'e');
        }
        // erase enemy projectiles and non-ultimate zones (power threshold)
        for (const p of m.projectiles) {
          if (p.alive && p.team !== u.team && !p.ultimate && p.homing === 0 && inRect(p.x, p.y, u.x, u.y, dx, dy, 8, 1.5) !== null) { p.alive = false; m.emit({ e: 'fx', kind: 'erase', x: p.x, y: p.y }, { x: p.x, y: p.y }); }
        }
        for (const z of m.zones) {
          if (z.alive && z.team !== u.team && z.team !== 2 && !z.ultimate && inRect(z.x, z.y, u.x, u.y, dx, dy, 8, 1.5, 1) !== null) { z.end = m.time; m.emit({ e: 'fx', kind: 'erase', x: z.x, y: z.y }, { x: z.x, y: z.y }); }
        }
        for (const w of m.units) {
          if (w.kind === 'wall' && w.alive && w.team !== u.team && inRect(w.x, w.y, u.x, u.y, dx, dy, 8, 1.5, 0.7) !== null) m.killUnit(w, u);
        }
      },
    },
    { // R Final Draft
      release(m, u, cmd, rank, castId) {
        const p = clampPoint(u, cmd, 11);
        const radii = [2.5, 4, 5.5];
        const hits = new Map<number, number>();
        const dmg = V(u, 3, 'dmg', rank);
        radii.forEach((r, i) => {
          m.spawnZone({ team: u.team, owner: u.id, x: p.x, y: p.y, shape: { type: 'circle', r }, dur: 0.6 * (i + 1), visual: `draft-ring-${i}`, hostile: true, ultimate: true, publicTelegraph: true });
          m.schedule(0.6 * (i + 1), () => {
            m.emit({ e: 'fx', kind: 'draft-ring', x: p.x, y: p.y, r, team: u.team }, { x: p.x, y: p.y });
            for (const t of m.unitsInRadius(p.x, p.y, r, enemyFilter(m, u))) {
              if (dist(t.x, t.y, p.x, p.y) > r + t.radius) continue;
              dealDamage(m, u, t, dmg, 'arcane', { kind: 'ability', source: 'Final Draft', slot: 3, ult: true, castId });
              annotate(m, u, t, 'r');
              const n = (hits.get(t.id) ?? 0) + (i < 2 ? 1 : 0);
              hits.set(t.id, n);
              if (i === 2 && n >= 2) addEffect(m, t, { kind: 'stun', until: m.time + 1.25, value: 1, src: u.id }, 'Final Draft');
            }
          });
        });
        m.emit({ e: 'fx', kind: 'ult-warning', x: p.x, y: p.y, team: u.team, r: 5.5 }, { x: p.x, y: p.y, public: true });
      },
    },
  ],
};

// ======================= VEY =======================
const vey: KitImpl = {
  passiveTick(m, u, dt) {
    const p = u.hero!.passive;
    const enemyTeam = (1 - (u.team as number)) as 0 | 1;
    const hidden = u.brush >= 0 || !m.visibleTo(enemyTeam, u);
    if (hidden) {
      p.hiddenT = (p.hiddenT ?? 0) + dt;
      if (p.hiddenT >= 1 && !p.primed) { p.primed = 1; p.primedUntil = Infinity; }
    } else {
      p.hiddenT = 0;
      if (p.primed && p.primedUntil === Infinity) p.primedUntil = m.time + 5;
      if (p.primed && m.time > (p.primedUntil ?? 0)) p.primed = 0;
    }
  },
  onAttackRelease(m, u) {
    const p = u.hero!.passive;
    if (!p.primed) return;
    p.primed = 0;
    return { bonus: PV(u, 'bonus'), bonusType: 'physical', penPct: 0.4, tag: 'refraction' };
  },
  abilities: [
    { // Q Shardstep
      validate(m, u, cmd) {
        const t = cmd.target ? m.byId.get(cmd.target) : undefined;
        if (!t || !t.alive || !m.isEnemy(u, t) || t.structure || t.kind === 'ward') return 'Needs an enemy unit';
        if ((u.hero!.passive[`ss${t.id}`] ?? 0) > m.time) return 'Shardstep: same target too soon';
        return null;
      },
      release(m, u, cmd, rank) {
        const t = m.byId.get(cmd.target!)!;
        const dx = t.x - u.x, dy = t.y - u.y, d = Math.hypot(dx, dy) || 1;
        faceDir(u, dx, dy);
        const end = dashEndpoint(u, t.x + (dx / d) * 2, t.y + (dy / d) * 2, false);
        u.hero!.passive[`ss${t.id}`] = m.time + 6;
        const dmg = V(u, 0, 'dmg', rank);
        m.emit({ e: 'fx', kind: 'shardstep', x: u.x, y: u.y, x2: end.x, y2: end.y, team: u.team }, { x: u.x, y: u.y });
        m.startDash(u, end.x, end.y, 20, { onEnd: () => { if (t.alive) dealDamage(m, u, t, dmg, 'physical', { kind: 'ability', source: 'Shardstep', slot: 0 }); } });
      },
    },
    { // W Mirror Decoy
      release(m, u, cmd) {
        const { dx, dy } = dirOf(u, cmd);
        const d = m.spawnDecoy(u, dx, dy, 2.6);
        u.hero!.recast[1] = { until: m.time + 2.6, data: { decoy: d.id } };
      },
      canRecast(m, u) { const r = u.hero!.recast[1]; return !!r && r.until > m.time && !!m.byId.get(r.data.decoy)?.alive; },
      recast(m, u) {
        const r = u.hero!.recast[1]; delete u.hero!.recast[1];
        const d = m.byId.get(r.data.decoy);
        if (!d || !d.alive) return;
        if (dist(u.x, u.y, d.x, d.y) > 9) { m.rejectFor(u, 'Decoy too far to swap'); return; }
        const ux = u.x, uy = u.y;
        u.x = d.x; u.y = d.y; d.x = ux; d.y = uy;
        u.path = null; u.order = { type: 'idle' };
        m.emit({ e: 'fx', kind: 'swap', x: ux, y: uy, x2: u.x, y2: u.y }, { x: u.x, y: u.y });
        m.popDecoy(d);
      },
    },
    { // E Cut the Light
      release(m, u, cmd, rank) {
        const { dx, dy } = dirOf(u, cmd); faceDir(u, dx, dy);
        const a = Math.atan2(dy, dx);
        const dmg = V(u, 2, 'dmg', rank);
        m.emit({ e: 'fx', kind: 'cut-light', x: u.x, y: u.y, x2: u.x + dx * 4.2, y2: u.y + dy * 4.2, team: u.team }, { x: u.x, y: u.y });
        for (const t of m.unitsInRadius(u.x, u.y, 5, (t) => t.alive && m.isEnemy(u, t) && !t.structure)) {
          if (!inCone(t.x, t.y, u.x, u.y, a, 4.2, (40 * Math.PI) / 180, t.radius)) continue;
          if (t.kind === 'ward') { t.ward!.disabledUntil = m.time + 5; m.emit({ e: 'fx', kind: 'ward-disabled', x: t.x, y: t.y }, { x: t.x, y: t.y }); continue; }
          if (t.untargetable) continue;
          dealDamage(m, u, t, t.kind === 'hero' ? dmg : dmg * 0.5, 'physical', { kind: 'ability', source: 'Cut the Light', slot: 2 });
        }
      },
    },
    { // R Prism Sentence
      validate(m, u, cmd) {
        const t = cmd.target ? m.byId.get(cmd.target) : undefined;
        if (!t || !t.alive || !m.isEnemy(u, t) || t.kind !== 'hero') return 'Needs an enemy hero';
        return null;
      },
      release(m, u, cmd, rank) {
        const t = m.byId.get(cmd.target!)!;
        const z = m.spawnZone({ team: u.team, owner: u.id, x: t.x, y: t.y, shape: { type: 'circle', r: 1.2 }, dur: 1.2, visual: 'prism-mark', hostile: true, ultimate: true, publicTelegraph: true, data: { follow: t.id } });
        z.onTick = () => { if (t.alive) { z.x = t.x; z.y = t.y; } };
        m.emit({ e: 'fx', kind: 'ult-warning', x: t.x, y: t.y, team: u.team, id: t.id }, { x: t.x, y: t.y, public: true });
        m.schedule(1.2, () => {
          if (!u.alive || !t.alive) return;
          const los = dist(u.x, u.y, t.x, t.y) <= 14 && losClear(u.x, u.y, t.x, t.y) && !m.wallBetween(u.x, u.y, t.x, t.y);
          const dmg = V(u, 3, 'dmg', rank) + 0.15 * (t.stats.maxHp - t.hp);
          dealDamage(m, u, t, los ? dmg : dmg * 0.5, 'physical', { kind: 'ability', source: 'Prism Sentence', slot: 3, ult: true });
          m.emit({ e: 'fx', kind: los ? 'prism-strike' : 'prism-weak', x: t.x, y: t.y, x2: u.x, y2: u.y }, { x: t.x, y: t.y });
          if (los) {
            const dx = t.x - u.x, dy = t.y - u.y, d = Math.hypot(dx, dy) || 1;
            const p = nearestWalkable(t.x + (dx / d) * 1.3, t.y + (dy / d) * 1.3, 0.4, 2);
            if (p) { u.x = p.x; u.y = p.y; u.path = null; u.facing = Math.atan2(-dy, -dx); }
          }
        });
      },
    },
  ],
};

export const KITS: Record<HeroId, KitImpl> = { brannoch, suri, oru, kesh, ilyra, vey };

export function heroInBrush(u: Unit): boolean { return brushAt(u.x, u.y) >= 0; }
export { hasEffect };
export type { Zone };
