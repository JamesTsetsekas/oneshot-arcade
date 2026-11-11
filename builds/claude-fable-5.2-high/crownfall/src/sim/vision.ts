// server-simulation: team vision. Runs every 3 ticks (100 ms); a unit stays "seen" for a short
// grace window so brush edges do not flicker. Snapshots are filtered with this before they are
// serialised — hidden transforms never leave the simulation.

import { dist } from '../shared/math';
import { getEffect, hasEffect } from './combat';
import type { Unit } from './types';
import type { World } from './world';

export interface VisionSrc {
  x: number;
  y: number;
  r: number;
  brush: number;
  trueSight: boolean;
}

const GRACE = 6; // 3-tick cadence + 100 ms enter/exit grace

export function updateVision(w: World): void {
  const t = w.tick;
  for (const team of [0, 1] as const) {
    const srcs: VisionSrc[] = [];
    for (const u of w.units) {
      if (!u.alive || u.team !== team || u.vision <= 0) continue;
      if (u.kind === 'ward' && u.disabledUntil > t) continue;
      let r = u.vision;
      if (u.hero) {
        const blind = getEffect(u, 'blind');
        if (blind) r = Math.min(r, blind.value);
      }
      srcs.push({ x: u.x, y: u.y, r, brush: u.brush, trueSight: !!u.struct });
      const beacon = getEffect(u, 'beacon');
      if (beacon) srcs.push({ x: u.x, y: u.y, r: beacon.value, brush: u.brush, trueSight: true });
    }
    w.visionSrc[team] = srcs;
    for (const o of w.units) {
      if (!o.alive) continue;
      if (o.team === team || o.struct) {
        o.visUntil[team] = t + GRACE;
        continue;
      }
      if (unitSeen(w, o, srcs)) o.visUntil[team] = t + GRACE;
    }
    for (const h of w.heroes) {
      if (h.alive && h.visUntil[team] >= t) {
        h.hero!.lastSeen[team].x = h.x;
        h.hero!.lastSeen[team].y = h.y;
      }
    }
  }
}

function unitSeen(w: World, o: Unit, srcs: VisionSrc[]): boolean {
  if (o.kind !== 'ward' && hasEffect(o, 'reveal')) return true;
  for (let i = 0; i < srcs.length; i++) {
    const s = srcs[i];
    const d = dist(s.x, s.y, o.x, o.y);
    if (d > s.r) continue;
    if (o.kind === 'ward' && !s.trueSight) continue; // wards need true sight
    if (o.brush >= 0 && !s.trueSight && s.brush !== o.brush && d > 1.6) continue; // brush hides from outside
    if (!w.map.losClear(s.x, s.y, o.x, o.y)) continue;
    return true;
  }
  return false;
}

/** Is a world position inside a team's current sight (used to filter events and zones)? */
export function pointVisible(w: World, team: 0 | 1, x: number, y: number): boolean {
  const srcs = w.visionSrc[team];
  for (let i = 0; i < srcs.length; i++) {
    const s = srcs[i];
    if (dist(s.x, s.y, x, y) > s.r + 1) continue;
    if (w.map.losClear(s.x, s.y, x, y)) return true;
  }
  return false;
}
