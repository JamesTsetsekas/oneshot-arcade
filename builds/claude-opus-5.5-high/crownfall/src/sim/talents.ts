// Universal talents (two chosen per player, bound to D/F).
import type { Match } from './match';
import type { Unit, PendingCast } from './types';
import { TALENTS } from '../shared/items';
import { dealDamage, addEffect, addShield, heal, isHardCC } from './combat';
import { dist } from '../shared/math';
import { nearestWalkable } from './nav';
import { clampPoint } from './abilities';

export function castTalent(m: Match, u: Unit, pc: PendingCast): boolean {
  const h = u.hero!;
  const id = h.talents[pc.slot];
  if (!id) return false;
  const def = TALENTS[id];
  if (!u.alive) return false;
  if (h.talentCds[pc.slot] > 0) { m.rejectFor(u, `${def.name} on cooldown`, pc.seq); return false; }
  if (isHardCC(u)) { m.rejectFor(u, 'Cannot act while disabled', pc.seq); return false; }
  const done = () => { h.talentCds[pc.slot] = def.cooldown; m.cancelRecall(u); };
  switch (id) {
    case 'phase': {
      const p = clampPoint(u, pc, def.range);
      const end = nearestWalkable(p.x, p.y, u.radius * 0.8, 3);
      if (!end) { m.rejectFor(u, 'No room to blink', pc.seq); return false; }
      m.emit({ e: 'fx', kind: 'blink', x: u.x, y: u.y, x2: end.x, y2: end.y }, { x: u.x, y: u.y });
      u.x = end.x; u.y = end.y; u.path = null; u.order = { type: 'idle' }; u.cast = null;
      done(); return true;
    }
    case 'mend': {
      const amt = 80 + 16 * h.level;
      heal(m, u, u, amt);
      const ally = m.heroes.filter((a) => a.alive && a.team === u.team && a !== u && dist(a.x, a.y, u.x, u.y) <= 8).sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
      if (ally) heal(m, u, ally, amt * 0.5);
      m.emit({ e: 'fx', kind: 'mend', x: u.x, y: u.y, id: u.id }, { x: u.x, y: u.y });
      done(); return true;
    }
    case 'bulwark': addShield(m, u, u, 90 + 22 * h.level, 2.5); done(); return true;
    case 'rush':
      addEffect(m, u, { kind: 'haste', until: m.time + 3, value: 0.4, src: u.id, tag: 'rush' });
      addEffect(m, u, { kind: 'ghost', until: m.time + 3, value: 1, src: u.id, tag: 'rush' });
      done(); return true;
    case 'scorch': case 'reap': {
      const t = pc.target ? m.byId.get(pc.target) : undefined;
      if (!t || !t.alive || t.team === u.team || !m.visibleTo(u.team as 0 | 1, t)) { m.rejectFor(u, 'Needs a visible enemy target', pc.seq); return false; }
      if (id === 'scorch' && t.kind !== 'hero') { m.rejectFor(u, 'Scorch Brand targets heroes', pc.seq); return false; }
      if (id === 'reap' && t.kind !== 'monster' && t.kind !== 'minion') { m.rejectFor(u, 'Reaping Spark targets monsters and minions', pc.seq); return false; }
      if (dist(u.x, u.y, t.x, t.y) > def.range + t.radius + u.radius) {
        u.order = { type: 'cast', cast: pc };
        m.setPath(u, t.x, t.y);
        return true;
      }
      if (id === 'scorch') {
        addEffect(m, t, { kind: 'burn', until: m.time + 3, value: (60 + 20 * h.level) / 3, src: u.id, tag: `scorch${u.id}`, dmgType: 'pure' });
        addEffect(m, t, { kind: 'grievous', until: m.time + 3, value: 1, src: u.id, tag: 'scorch' });
      } else {
        dealDamage(m, u, t, 400 + 25 * h.level, 'pure', { kind: 'talent', source: 'Reaping Spark' });
      }
      m.emit({ e: 'fx', kind: id, x: t.x, y: t.y, x2: u.x, y2: u.y }, { x: t.x, y: t.y });
      done(); return true;
    }
  }
  return false;
}
