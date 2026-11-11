import { dist } from '../src/core/math';
import { Rng } from '../src/core/rng';
import type { Actor, ClassId, Hero } from '../src/entity-combat/types';
import { Session } from '../src/game-session/session';
import { generateItem } from '../src/items/generate';
import { los } from '../src/navigation-ai/grid';
import { createHero } from '../src/progression/progression';

export function makeSession(cls: ClassId = 'cinder', seed = 1234): Session {
  return new Session(createHero('Tester', cls, 0, seed));
}
export function run(s: Session, seconds: number, each?: () => void): void {
  for (let i = 0; i < Math.round(seconds * 30); i++) { each?.(); s.tick(); s.events.length = 0; }
}
/** A strong hero for loop-completion tests (these verify flow and softlocks, not balance). */
export function boost(hero: Hero): void {
  hero.level = 14;
  hero.attrs.vigor += 60; hero.attrs.might += 40; hero.attrs.finesse += 40;
  const rng = new Rng(99);
  const bases = hero.cls === 'cinder' ? ['maul4', 'heavy_chest3', 'heavy_head3'] : ['longbow4', 'light_chest3', 'light_head3'];
  delete hero.equip.off;
  for (const b of bases) { const it = generateItem(rng, { ilvl: 14, cls: hero.cls, rarity: 1, base: b }); hero.equip[b.includes('chest') ? 'chest' : b.includes('head') ? 'head' : 'main'] = it; }
  hero.beltCap = 99; hero.belt = [99, 99, 99, 99];
}
export const foes = (s: Session): Actor[] => s.zone.actors.filter((a) => a.team === 1 && !a.dead && !a.untargetable && !a.invuln && (a.kind === 'enemy' || a.kind === 'conduit' || a.kind === 'ward'));

/** Simple autopilot: fights anything awake nearby, otherwise walks to the current quest objective. */
export function botStep(s: Session, tick: number): void {
  const p = s.player, z = s.zone, h = s.hero;
  if (p.dead) { s.respawn(); return; }
  if (p.hp < s.stats.hpMax * 0.5) s.usePotion(0);
  const near = foes(s).filter((a) => dist(a.x, a.y, p.x, p.y) < 13 && (a.kind !== 'enemy' || a.ai!.state !== 'dormant' || dist(a.x, a.y, p.x, p.y) < 9) && los(z, p.x, p.y, a.x, a.y))
    .sort((a, b) => dist(a.x, a.y, p.x, p.y) - dist(b.x, b.y, p.x, p.y));
  if (near.length) {
    const t = near[0];
    if (tick % 4 === 0) {
      const d = dist(t.x, t.y, p.x, p.y);
      const st = s.skillState(0);
      if (st.ok && d < (h.cls === 'cinder' ? 3.2 : 8) && tick % 12 === 0) s.intent({ type: 'skill', slot: 0, x: t.x, y: t.y });
      else s.intent({ type: 'attack', target: t.id, x: t.x, y: t.y });
    }
    return;
  }
  if (tick % 20 !== 0 && s.pc.intent) return;
  const inter = (pred: (i: (typeof z.inter)[number]) => boolean) => { const it = z.inter.find(pred); if (it) s.intent({ type: 'interact', id: it.id }); return !!it; };
  const goto = (v?: { x: number; y: number }) => { if (v) s.intent({ type: 'move', x: v.x, y: v.y }); };
  const q = h.quest;
  if (z.id === 'refuge') {
    if (q === 0) inter((i) => i.npc === 'elder');
    else if (q === 5) inter((i) => i.npc === 'artificer');
    else if (q >= 6 && h.waypoints.includes('march')) s.travelWaypoint('march');
    else inter((i) => i.type === 'exit');
  } else if (z.id === 'march') {
    if (q <= 2) inter((i) => i.type === 'waypoint');
    else if (q === 3) goto(z.landmarks.boss);
    else if (q === 4) inter((i) => i.type === 'cage');
    else if (q === 5) s.travelWaypoint('refuge');
    else inter((i) => i.type === 'exit' && i.to === 'archive1');
  } else if (z.id === 'archive1' || z.id === 'archive2') {
    const lever = z.inter.find((i) => i.type === 'lever' && !i.state);
    if (lever && dist(lever.x, lever.y, p.x, p.y) < 12) s.intent({ type: 'interact', id: lever.id });
    else inter((i) => i.type === 'exit' && i.to === (z.id === 'archive1' ? 'archive2' : 'archive3') && i.key !== 'shortcut');
  } else if (z.id === 'archive3' || z.id.startsWith('hunt_')) {
    const boss = z.actors.find((a) => a.boss && !a.dead);
    if (boss) { const d = dist(boss.x, boss.y, p.x, p.y); if (d > 6) goto({ x: boss.x + (p.x - boss.x) / d * 4, y: boss.y + (p.y - boss.y) / d * 4 }); else s.intent({ type: 'attack', target: boss.id, x: boss.x, y: boss.y }); }
  }
}
