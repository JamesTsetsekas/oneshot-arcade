// server-simulation: hero kits as small code modules behind the strict AbilityImpl interface.
// All numbers come from shared/heroes.ts; nothing here reads input or renders.

import { HEROES, val } from '../shared/heroes';
import { angleDiff, dist, inCone, inRect, pointSegDist, secs } from '../shared/math';
import { addEffect, addShield, applyCC, dealDamage, hasEffect } from './combat';
import { ARCANE, AbilityCtx, AbilityImpl, DamageOpts, PHYS, Unit, Zone } from './types';

const DEG = Math.PI / 180;

function defOf(c: AbilityCtx) {
  return c.h.hero!.def.abilities[c.slot];
}
function v(c: AbilityCtx, key: string): number {
  return val(defOf(c), key, c.rank);
}
function opts(c: AbilityCtx, extra: Partial<DamageOpts> = {}): DamageOpts {
  return { ability: c.slot, castId: c.castId, label: defOf(c).name, ...extra };
}
/** Short-lived warning shape shown during a cast time. */
function telegraph(c: AbilityCtx, shape: Zone['shape'], o: Partial<Zone>, seconds: number, kind = 'tele'): Zone {
  return c.w.spawnZone({ kind, team: c.h.team, src: c.h.id, shape, x: c.h.x, y: c.h.y, r: 1, until: c.w.tick + secs(seconds), armAt: c.w.tick + secs(seconds), ult: !!defOf(c).ult, erasable: false, ...o });
}
const color = (c: AbilityCtx): number => c.h.hero!.def.color;

export const ABILITIES: Record<string, AbilityImpl> = {
  // ================= Brannoch =================================================================
  fault_hammer: {
    begin(c) {
      telegraph(c, 'cone', { r: 5, ang: c.ang, arc: 35 * DEG }, 0.3);
    },
    fire(c) {
      const { w, h } = c;
      const dmg = v(c, 'dmg') + 0.6 * h.stats.ad;
      w.fxAt('cone', h.x, h.y, { ang: c.ang, r: 5, x2: 35 * DEG, c: color(c) });
      for (const e of w.enemiesIn(h.team, h.x, h.y, 5)) {
        if (!inCone(e.x, e.y, h.x, h.y, c.ang, 5, 35 * DEG, e.radius * 0.6)) continue;
        dealDamage(w, h, e, dmg, PHYS, opts(c));
        if (dist(h.x, h.y, e.x, e.y) <= 2.6 + e.radius) applyCC(w, h, e, 'stun', v(c, 'stun'));
        else applyCC(w, h, e, 'slow', 1.5, v(c, 'slow') / 100);
      }
    },
  },
  rampart_fold: {
    fire(c) {
      const { w, h } = c;
      const px = -c.dy;
      const py = c.dx;
      const mid = { x: c.x, y: c.y };
      const a = { x: c.x + px * 2.6 - c.dx * 0.8, y: c.y + py * 2.6 - c.dy * 0.8 };
      const b = { x: c.x - px * 2.6 - c.dx * 0.8, y: c.y - py * 2.6 - c.dy * 0.8 };
      const until = w.tick + secs(v(c, 'dur'));
      for (const [p, q] of [
        [a, mid],
        [mid, b],
      ]) {
        const z = w.spawnZone({ kind: 'rampart', team: h.team, src: h.id, shape: 'wall', x: p.x, y: p.y, r: dist(p.x, p.y, q.x, q.y), w: 0.9, ang: Math.atan2(q.y - p.y, q.x - p.x), until, hostile: true });
        w.walls.push({ id: w.newId(), team: h.team, ax: p.x, ay: p.y, bx: q.x, by: q.y, r: 0.45, hp: v(c, 'hp'), until, zone: z.id });
      }
      w.fxAt('burst', c.x, c.y, { r: 2.4, c: color(c) });
    },
  },
  anchor_line: {
    fire(c) {
      const { w, h } = c;
      let ally = 0;
      let ax = c.x;
      let ay = c.y;
      for (const o of w.heroes) {
        if (o !== h && o.alive && o.team === h.team && dist(o.x, o.y, c.x, c.y) < 1.8) {
          ally = o.id;
          ax = o.x;
          ay = o.y;
        }
      }
      if (!ally) {
        const p = w.map.sdf(ax, ay) < -0.5 ? { x: ax, y: ay } : w.map.nearestWalkable(ax, ay);
        ax = p.x;
        ay = p.y;
      }
      h.hero!.recast[c.slot] = { until: w.tick + secs(v(c, 'window')), data: { x: ax, y: ay, ally, rank: c.rank } };
      w.fxAt('line', h.x, h.y, { x2: ax, y2: ay, c: 0x8fd0ff });
      w.spawnZone({ kind: 'anchor', team: h.team, src: h.id, shape: 'circle', x: ax, y: ay, r: 0.9, until: w.tick + secs(v(c, 'window')), hostile: false, erasable: false });
    },
    recast(c) {
      const { w, h } = c;
      const rc = h.hero!.recast[c.slot];
      if (!rc || hasEffect(h, 'root')) return;
      h.hero!.recast[c.slot] = null;
      const ally = rc.data.ally ? w.byId.get(rc.data.ally) : undefined;
      const tx = ally?.alive ? ally.x : rc.data.x;
      const ty = ally?.alive ? ally.y : rc.data.y;
      const d = dist(h.x, h.y, tx, ty);
      const stop = Math.max(0, d - 1.1);
      const ex = h.x + ((tx - h.x) / (d || 1)) * stop;
      const ey = h.y + ((ty - h.y) / (d || 1)) * stop;
      const end = w.lastWalkable(h.x, h.y, ex, ey, h.team);
      const shield = val(h.hero!.def.abilities[c.slot], 'shield', rc.data.rank);
      w.fxAt('line', h.x, h.y, { x2: tx, y2: ty, c: 0x8fd0ff });
      for (const z of w.zones) if (z.kind === 'anchor' && z.src === h.id) z.dead = true;
      w.startDash(h, end.x, end.y, 24, false, () => addShield(w, h, h, shield, 2.5));
    },
  },
  citybreaker: {
    begin(c) {
      const { w, h } = c;
      const end = w.throughEnd(h.x, h.y, c.x, c.y);
      c.x = end.x;
      c.y = end.y;
      telegraph(c, 'circle', { x: end.x, y: end.y, r: 4 }, 0.75 + 0.45, 'citybreaker');
    },
    fire(c) {
      const { w, h } = c;
      const d = dist(h.x, h.y, c.x, c.y);
      w.startDash(h, c.x, c.y, Math.max(8, d / 0.45), true, () => {
        const dmg = v(c, 'dmg') + 0.5 * h.stats.ad;
        w.fxAt('slam', h.x, h.y, { r: 4, c: color(c) });
        for (const e of w.enemiesIn(h.team, h.x, h.y, 4)) {
          dealDamage(w, h, e, dmg, PHYS, opts(c));
          applyCC(w, h, e, 'airborne', v(c, 'air'));
        }
      });
    },
  },

  // ================= Suri Vale ================================================================
  ricochet_bolt: {
    fire(c) {
      const { w, h } = c;
      const dmg = v(c, 'dmg') + 0.7 * h.stats.ad;
      w.spawnProj({
        kind: 'ricochet',
        team: h.team,
        src: h.id,
        x: h.x + c.dx * 0.6,
        y: h.y + c.dy * 0.6,
        dx: c.dx,
        dy: c.dy,
        speed: 27,
        radius: 0.45,
        remaining: 11 + 4,
        terrain: true,
        bounce: 1,
        power: dmg,
        onHit: (p, t) => {
          dealDamage(w, h, t, dmg, PHYS, opts(c));
          w.fxAt('burst', p.x, p.y, { r: 0.9, c: color(c) });
        },
      });
    },
  },
  slipstream: {
    fire(c) {
      const { w, h } = c;
      const sx = h.x;
      const sy = h.y;
      const end = w.lastWalkable(h.x, h.y, h.x + c.dx * 5, h.y + c.dy * 5, h.team);
      const len = dist(sx, sy, end.x, end.y);
      const speed = v(c, 'speed') / 100;
      addEffect(w, h, 'speed', secs(1.5), 0.2, h.id);
      w.startDash(h, end.x, end.y, 21, false, null);
      if (len < 0.5) return;
      w.spawnZone({
        kind: 'slipstream',
        team: h.team,
        src: h.id,
        shape: 'rect',
        x: sx,
        y: sy,
        r: len,
        w: 2.2,
        ang: c.ang,
        until: w.tick + secs(v(c, 'dur')),
        hostile: false,
        every: 3,
        onTick: (z) => {
          for (const a of w.heroes) {
            if (a === h || !a.alive || a.team !== h.team || z.touched.includes(a.id) || !w.inZone(z, a)) continue;
            z.touched.push(a.id);
            addEffect(w, a, 'speed', secs(2), speed, h.id);
            w.fxAt('ring', a.x, a.y, { r: 1.2, c: color(c) });
          }
        },
      });
    },
  },
  parcel_charge: {
    fire(c) {
      const { w, h } = c;
      if (!c.target?.alive) return;
      const dmg = v(c, 'dmg') + 0.4 * h.stats.ad + 0.5 * h.stats.ap;
      const e = addEffect(w, c.target, 'parcel', secs(v(c, 'fuse')), dmg, h.id);
      e.until = w.tick + secs(v(c, 'fuse'));
      e.value = dmg;
      w.fxAt('line', h.x, h.y, { x2: c.target.x, y2: c.target.y, c: color(c) });
      if (c.target.hero) w.heroAggro(h, c.target);
    },
  },
  redline_delivery: {
    begin(c) {
      telegraph(c, 'rect', { r: 40, w: 1.6, ang: c.ang }, 1.0, 'redline');
      addEffect(c.w, c.h, 'reveal', secs(1.2), 0, c.h.id);
    },
    fire(c) {
      const { w, h } = c;
      const base = v(c, 'dmg') + 0.8 * h.stats.ad;
      w.spawnProj({
        kind: 'redline',
        team: h.team,
        src: h.id,
        x: h.x + c.dx * 0.8,
        y: h.y + c.dy * 0.8,
        dx: c.dx,
        dy: c.dy,
        speed: 46,
        radius: 0.8,
        remaining: 40,
        pierce: true,
        ult: true,
        power: base * 2,
        onHit: (p, t) => {
          const mult = 1 + Math.min(1, p.travelled / 40);
          if (t.hero) {
            dealDamage(w, h, t, base * mult, PHYS, opts(c));
            w.fxAt('slam', t.x, t.y, { r: 2, c: color(c) });
            return true;
          }
          dealDamage(w, h, t, base * 0.5, PHYS, opts(c));
          return false;
        },
      });
    },
  },

  // ================= Oru ======================================================================
  luminous_swarm: {
    fire(c) {
      const { w, h } = c;
      const dmg = v(c, 'dmg') + 0.6 * h.stats.ap;
      const shield = v(c, 'shield') + 0.5 * h.stats.ap;
      w.spawnProj({
        kind: 'swarm',
        team: h.team,
        src: h.id,
        x: h.x + c.dx * 0.6,
        y: h.y + c.dy * 0.6,
        dx: c.dx,
        dy: c.dy,
        speed: 11,
        radius: 0.9,
        remaining: 10,
        hits: 'both',
        power: dmg,
        onHit: (p, t) => {
          if (t.team === h.team) addShield(w, h, t, shield, 3);
          else dealDamage(w, h, t, dmg, ARCANE, opts(c));
          w.fxAt('burst', p.x, p.y, { r: 1.2, c: color(c) });
        },
      });
    },
  },
  hush_field: {
    fire(c) {
      const { w, h } = c;
      const slow = v(c, 'slow') / 100;
      w.spawnZone({
        kind: 'hush',
        team: h.team,
        src: h.id,
        shape: 'circle',
        x: c.x,
        y: c.y,
        r: 4.5,
        until: w.tick + secs(v(c, 'dur')),
        every: 5,
        onTick: (z) => {
          for (const e of w.enemiesIn(h.team, z.x, z.y, z.r)) {
            if (e.team === 2) continue;
            addEffect(w, e, 'blind', 8, v(c, 'vision'), h.id);
            applyCC(w, h, e, 'slow', 0.3, slow);
          }
        },
      });
    },
  },
  guiding_draft: {
    fire(c) {
      const { w, h } = c;
      const t = c.target ?? h;
      addEffect(w, t, 'speed', secs(2.5), v(c, 'speed') / 100, h.id);
      addEffect(w, t, 'draft', secs(5), 0, h.id);
      w.fxAt('ring', t.x, t.y, { r: 1.4, c: color(c) });
      if (t !== h) w.fxAt('line', h.x, h.y, { x2: t.x, y2: t.y, c: color(c) });
    },
  },
  night_migration: {
    begin(c) {
      telegraph(c, 'rect', { r: 16, w: 9, ang: c.ang }, 0.4, 'migrationTele');
    },
    fire(c) {
      const { w, h } = c;
      const shield = v(c, 'shield') + 0.6 * h.stats.ap;
      const dmg = v(c, 'dmg');
      const touched: number[] = [];
      w.spawnProj({
        kind: 'migration',
        team: h.team,
        src: h.id,
        x: h.x,
        y: h.y,
        dx: c.dx,
        dy: c.dy,
        speed: 10,
        radius: 4.5,
        remaining: 16,
        hits: 'none',
        ult: true,
        power: 9999,
        onStep: (p) => {
          for (const u of w.units) {
            if (!u.alive || u.struct || u.kind === 'ward' || touched.includes(u.id)) continue;
            const rx = u.x - p.x;
            const ry = u.y - p.y;
            const along = rx * p.dx + ry * p.dy;
            const side = Math.abs(-rx * p.dy + ry * p.dx);
            if (side > 4.5 + u.radius * 0.5 || along > 0.7 || along < -1.4) continue;
            touched.push(u.id);
            if (u.team === h.team) {
              if (u.hero) addShield(w, h, u, shield, 3.5);
            } else {
              // only the leading edge roots
              dealDamage(w, h, u, dmg, ARCANE, opts(c));
              applyCC(w, h, u, 'root', v(c, 'root'));
            }
          }
        },
      });
    },
  },

  // ================= Kesh =====================================================================
  reed_cleaver: {
    begin(c) {
      telegraph(c, 'cone', { r: 4.2, ang: c.ang, arc: 50 * DEG }, 0.6);
    },
    fire(c) {
      const { w, h } = c;
      const base = v(c, 'dmg') + 0.5 * h.stats.ad;
      const swing = (second: boolean): void => {
        if (!h.alive) return;
        w.fxAt('cone', h.x, h.y, { ang: c.ang, r: 4.2, x2: 50 * DEG, c: second ? 0xd8ff8a : color(c) });
        for (const e of w.enemiesIn(h.team, h.x, h.y, 4.2)) {
          if (!inCone(e.x, e.y, h.x, h.y, c.ang, 4.2, 50 * DEG, e.radius * 0.6)) continue;
          let d = base;
          if (second) {
            let extra = (e.stats.maxHp - e.hp) * (v(c, 'missing') / 100);
            if (!e.hero) extra = Math.min(150, extra);
            d += extra;
          }
          dealDamage(w, h, e, d, PHYS, opts(c));
        }
      };
      swing(false);
      w.spawnZone({ kind: 'none', team: h.team, src: h.id, shape: 'circle', x: h.x, y: h.y, r: 0.1, armAt: w.tick + secs(0.45), until: w.tick + secs(0.45) + 1, hostile: false, erasable: false, onArm: () => swing(true) });
    },
  },
  bogskin: {
    fire(c) {
      const { w, h } = c;
      const dur = v(c, 'dur');
      addEffect(w, h, 'dr', secs(dur), v(c, 'dr') / 100, h.id);
      h.hero!.p.bogAbsorb = 0;
      h.hero!.p.bogEnd = w.tick + secs(dur);
      w.fxAt('ring', h.x, h.y, { r: 1.6, c: color(c) });
    },
  },
  sinkstep: {
    fire(c) {
      const { w, h } = c;
      const end = w.throughEnd(h.x, h.y, h.x + c.dx * 5.5, h.y + c.dy * 5.5);
      const asBonus = v(c, 'as');
      w.fxAt('burst', h.x, h.y, { r: 1.2, c: 0x5a4a2a });
      w.startDash(h, end.x, end.y, 17, true, () => {
        addEffect(w, h, 'as', secs(3), asBonus, h.id);
        w.fxAt('burst', h.x, h.y, { r: 1.5, c: color(c) });
      });
    },
  },
  fen_claim: {
    begin(c) {
      telegraph(c, 'circle', { x: c.x, y: c.y, r: 7 }, 0.3);
    },
    fire(c) {
      const { w, h } = c;
      const slow = v(c, 'slow') / 100;
      const dps = v(c, 'dps');
      w.spawnZone({
        kind: 'fen',
        team: h.team,
        src: h.id,
        shape: 'circle',
        x: c.x,
        y: c.y,
        r: 7,
        until: w.tick + secs(v(c, 'dur')),
        every: 6,
        ult: true,
        onTick: (z) => {
          if (h.alive && w.inZone(z, h)) addEffect(w, h, 'speed', 9, 0.3, -9);
          for (const e of w.enemiesIn(h.team, z.x, z.y, z.r)) {
            applyCC(w, h, e, 'slow', 0.35, slow);
            if (e.team !== 2) addEffect(w, e, 'reveal', 12, 0, h.id); // wakes betray position, even in brush
            dealDamage(w, h, e, dps * 0.2, ARCANE, opts(c, { dot: true }));
          }
        },
      });
    },
  },

  // ================= Ilyra Quill ==============================================================
  linebreak: {
    fire(c) {
      fireLinebreak(c, c.h.x + c.dx * 0.6, c.h.y + c.dy * 0.6, c.dx, c.dy, 1, true);
    },
  },
  footnote: {
    fire(c) {
      const { w, h } = c;
      const dmg = v(c, 'dmg') + 0.2 * h.stats.ap;
      w.spawnZone({
        kind: 'footnote',
        team: h.team,
        src: h.id,
        shape: 'circle',
        x: c.x,
        y: c.y,
        r: 1.8,
        armAt: w.tick + secs(0.6),
        until: w.tick + secs(0.6 + v(c, 'dur')),
        data: { used: 0, rank: c.rank },
        onArm: (z) => {
          w.fxAt('ring', z.x, z.y, { r: z.r, c: color(c) });
          for (const e of w.enemiesIn(h.team, z.x, z.y, z.r)) dealDamage(w, h, e, dmg, ARCANE, opts(c));
        },
      });
    },
  },
  redaction: {
    begin(c) {
      telegraph(c, 'rect', { r: 7, w: 3, ang: c.ang }, 0.25);
    },
    fire(c) {
      const { w, h } = c;
      const dmg = v(c, 'dmg') + 0.4 * h.stats.ap;
      w.fxAt('rect', h.x, h.y, { ang: c.ang, r: 7, x2: 3, c: color(c) });
      for (const e of w.enemiesIn(h.team, h.x + c.dx * 3.5, h.y + c.dy * 3.5, 5)) {
        if (!inRect(e.x, e.y, h.x, h.y, c.ang, 7, 3, e.radius * 0.6)) continue;
        dealDamage(w, h, e, dmg, ARCANE, opts(c));
        applyCC(w, h, e, 'silence', v(c, 'silence'));
      }
      // erase enemy non-ultimate projectiles and zones below the power threshold
      for (const p of w.projs) {
        if (p.team === h.team || p.ult || p.homing || p.power > 600) continue;
        if (inRect(p.x, p.y, h.x, h.y, c.ang, 7, 3, p.radius)) {
          p.dead = true;
          w.fxAt('burst', p.x, p.y, { r: 0.8, c: 0xffffff });
        }
      }
      for (const z of w.zones) {
        if (z.team === h.team || z.ult || !z.erasable || z.kind === 'none') continue;
        const zx = z.shape === 'wall' ? z.x + (Math.cos(z.ang) * z.r) / 2 : z.x;
        const zy = z.shape === 'wall' ? z.y + (Math.sin(z.ang) * z.r) / 2 : z.y;
        if (inRect(zx, zy, h.x, h.y, c.ang, 7, 3, 0.5)) {
          z.dead = true;
          for (const wl of w.walls) if (wl.zone === z.id) wl.hp = 0;
          w.fxAt('burst', zx, zy, { r: 1.2, c: 0xffffff });
        }
      }
    },
  },
  final_draft: {
    fire(c) {
      const { w, h } = c;
      const dmg = v(c, 'dmg') + 0.35 * h.stats.ap;
      const hits = new Map<number, number>();
      const radii = [2.5, 4, 5.5];
      radii.forEach((r, i) => {
        w.spawnZone({
          kind: 'draft' + i,
          team: h.team,
          src: h.id,
          shape: 'circle',
          x: c.x,
          y: c.y,
          r,
          armAt: w.tick + secs(0.6 * (i + 1)),
          until: w.tick + secs(0.6 * (i + 1)) + 3,
          ult: true,
          onArm: (z) => {
            w.fxAt('slam', z.x, z.y, { r, c: color(c) });
            for (const e of w.enemiesIn(h.team, z.x, z.y, r)) {
              const n = hits.get(e.id) ?? 0;
              dealDamage(w, h, e, dmg, ARCANE, opts(c));
              if (i === 2 && n >= 2) applyCC(w, h, e, 'stun', v(c, 'stun'));
              hits.set(e.id, n + 1);
            }
          },
        });
      });
    },
  },

  // ================= Vey ======================================================================
  shardstep: {
    check(c) {
      if (c.target && c.target.effects.some((e) => e.type === 'shardlock' && e.src === c.h.id)) return 'Shardstep: that target was struck too recently';
      return null;
    },
    fire(c) {
      const { w, h } = c;
      const t = c.target;
      if (!t) return;
      const dmg = v(c, 'dmg') + 0.5 * h.stats.ad;
      const d = dist(h.x, h.y, t.x, t.y) || 1;
      const ux = (t.x - h.x) / d;
      const uy = (t.y - h.y) / d;
      const beyond = w.lastWalkable(t.x, t.y, t.x + ux * (1.4 + t.radius), t.y + uy * (1.4 + t.radius), h.team);
      addEffect(w, t, 'shardlock', secs(v(c, 'lock')), 0, h.id);
      w.fxAt('line', h.x, h.y, { x2: beyond.x, y2: beyond.y, c: color(c) });
      w.startDash(h, beyond.x, beyond.y, 26, true, () => {
        if (t.alive) dealDamage(w, h, t, dmg, PHYS, opts(c));
        if (t.alive && h.hero!.order.t !== 'move') h.hero!.order = { t: 'attack', id: t.id };
      });
    },
  },
  mirror_decoy: {
    fire(c) {
      const { w, h } = c;
      const end = w.lastWalkable(h.x, h.y, h.x + c.dx * 8, h.y + c.dy * 8, h.team);
      const d = w.makeUnit('decoy', 'vey', h.team, h.x, h.y, h.radius);
      d.stats.maxHp = h.stats.maxHp;
      d.hp = Math.max(1, h.hp);
      d.stats.speed = h.stats.speed;
      d.level = h.level;
      d.owner = h.id;
      d.vision = 4;
      d.expireAt = w.tick + secs(v(c, 'dur'));
      d.path = [end];
      d.pathI = 0;
      d.facing = c.ang;
      h.hero!.recast[c.slot] = { until: d.expireAt, data: { id: d.id } };
      w.fxAt('burst', h.x, h.y, { r: 1, c: color(c) });
    },
    recast(c) {
      const { w, h } = c;
      const rc = h.hero!.recast[c.slot];
      if (!rc) return;
      const d = w.byId.get(rc.data.id);
      const maxSwap = val(h.hero!.def.abilities[c.slot], 'swap', 1);
      if (!d || !d.alive) {
        h.hero!.recast[c.slot] = null;
        return;
      }
      if (dist(h.x, h.y, d.x, d.y) > maxSwap) {
        w.emitHero({ e: 'reject', reason: 'Decoy is too far to swap' }, h.id);
        return;
      }
      h.hero!.recast[c.slot] = null;
      const ox = h.x;
      const oy = h.y;
      w.fxAt('blink', ox, oy, { x2: d.x, y2: d.y, c: color(c) });
      h.x = d.x;
      h.y = d.y;
      d.x = ox;
      d.y = oy;
      d.path = null;
      h.path = null;
    },
  },
  cut_the_light: {
    begin(c) {
      telegraph(c, 'cone', { r: 4.5, ang: c.ang, arc: 40 * DEG }, 0.12);
    },
    fire(c) {
      const { w, h } = c;
      const dmg = v(c, 'dmg') + 0.6 * h.stats.ad;
      w.fxAt('cone', h.x, h.y, { ang: c.ang, r: 4.5, x2: 40 * DEG, c: color(c) });
      for (const e of w.units) {
        if (!e.alive || e.team === h.team) continue;
        if (!inCone(e.x, e.y, h.x, h.y, c.ang, 4.5, 40 * DEG, e.radius * 0.6)) continue;
        if (e.kind === 'ward') {
          e.disabledUntil = w.tick + secs(v(c, 'disable'));
          w.fxAt('burst', e.x, e.y, { r: 1, c: 0x222233 });
        } else if (!e.struct) dealDamage(w, h, e, dmg, PHYS, opts(c));
      }
    },
  },
  prism_sentence: {
    fire(c) {
      const { w, h } = c;
      const t = c.target;
      if (!t) return;
      const delay = secs(v(c, 'delay'));
      addEffect(w, t, 'prism', delay, 0, h.id);
      const p = h.hero!.p;
      p.prismAt = w.tick + delay;
      p.prismTarget = t.id;
      p.prismRank = c.rank;
      p.prismCast = c.castId;
      w.fxAt('mark', t.x, t.y, { id: t.id, c: color(c) });
      w.heroAggro(h, t);
    },
    // resolves the delayed strike (invoked from the hero upkeep, not by player input)
    recast(c) {
      const { w, h } = c;
      const t = c.target;
      if (!t || !t.alive || !h.alive) return;
      const def = HEROES.vey.abilities[3];
      const full = val(def, 'dmg', c.rank) + h.stats.ad;
      const d = dist(h.x, h.y, t.x, t.y);
      if (d > 13) return;
      const sees = w.map.losClear(h.x, h.y, t.x, t.y) && t.visUntil[h.team as 0 | 1] >= w.tick;
      const o: DamageOpts = { ability: 3, castId: c.castId, label: def.name };
      if (sees && !hasEffect(h, 'root')) {
        const bx = t.x - Math.cos(t.facing) * (1.1 + t.radius);
        const by = t.y - Math.sin(t.facing) * (1.1 + t.radius);
        const end = w.lastWalkable(t.x, t.y, bx, by, h.team);
        w.fxAt('blink', h.x, h.y, { x2: end.x, y2: end.y, c: h.hero!.def.color });
        h.x = end.x;
        h.y = end.y;
        h.path = null;
        h.facing = Math.atan2(t.y - h.y, t.x - h.x);
        dealDamage(w, h, t, full, PHYS, o);
        w.fxAt('slam', t.x, t.y, { r: 1.8, c: h.hero!.def.color });
        if (t.alive) h.hero!.order = { t: 'attack', id: t.id };
      } else {
        // line of sight broken: no blink, reduced damage
        w.fxAt('line', h.x, h.y, { x2: t.x, y2: t.y, c: 0x8899aa });
        dealDamage(w, h, t, full * 0.4, PHYS, o);
      }
    },
  },
};

function fireLinebreak(c: AbilityCtx, x: number, y: number, dx: number, dy: number, mult: number, primary: boolean): void {
  const { w, h } = c;
  const def = HEROES.ilyra.abilities[0];
  const dmg = (val(def, 'dmg', c.rank) + 0.7 * h.stats.ap) * mult;
  let heroHit = false;
  w.spawnProj({
    kind: primary ? 'linebreak' : 'linebreak2',
    team: h.team,
    src: h.id,
    x,
    y,
    dx,
    dy,
    speed: 23,
    radius: 0.4,
    remaining: 12,
    pierce: true,
    power: dmg,
    onHit: (_p, t) => {
      dealDamage(w, h, t, heroHit ? dmg * 0.6 : dmg, ARCANE, { ability: 0, castId: c.castId, label: def.name });
      if (t.hero) heroHit = true;
      return false;
    },
    onStep: primary
      ? (p, px, py) => {
          for (const z of w.zones) {
            if (z.kind !== 'footnote' || z.src !== h.id || !z.armed || z.data.used) continue;
            if (pointSegDist(z.x, z.y, px, py, p.x, p.y) > z.r) continue;
            z.data.used = 1;
            z.until = Math.min(z.until, w.tick + 8);
            // repeat at a new angle: toward the nearest visible enemy hero, else deflect 35 degrees
            let best: Unit | null = null;
            let bd = 12;
            for (const e of w.heroes) {
              if (!e.alive || e.team === h.team || e.visUntil[h.team as 0 | 1] < w.tick) continue;
              const d = dist(e.x, e.y, z.x, z.y);
              if (d < bd && Math.abs(angleDiff(Math.atan2(p.dy, p.dx), Math.atan2(e.y - z.y, e.x - z.x))) > 0.12) {
                bd = d;
                best = e;
              }
            }
            const ang = best ? Math.atan2(best.y - z.y, best.x - z.x) : Math.atan2(p.dy, p.dx) + 35 * DEG;
            w.fxAt('ring', z.x, z.y, { r: z.r, c: 0xf2e8ff });
            fireLinebreak(c, z.x, z.y, Math.cos(ang), Math.sin(ang), 0.4, false);
          }
        }
      : null,
  });
}
