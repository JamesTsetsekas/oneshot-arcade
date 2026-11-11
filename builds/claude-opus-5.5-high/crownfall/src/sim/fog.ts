// Team vision: fog grid with line-of-sight through mistwood, brush concealment, wards, reveals.
import type { Match } from './match';
import type { Unit } from './types';
import { FOG_W, FOG_H, getMapGrid, MAP_MIN_X, MAP_MIN_Y } from '../shared/map';
import { visionRadius } from './combat';
import { VISION_GRACE_TICKS } from '../shared/rules';
import { dist } from '../shared/math';

function los(block: Uint8Array, x0: number, y0: number, x1: number, y1: number): boolean {
  // integer DDA through fog cells; target cell itself may be a blocker (we see the edge of forest)
  let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0, y = y0;
  for (;;) {
    if (x === x1 && y === y1) return true;
    if (!(x === x0 && y === y0) && block[y * FOG_W + x]) return false;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
}

function stamp(vis: Uint8Array, block: Uint8Array, wx: number, wy: number, r: number) {
  const cx = Math.floor(wx - MAP_MIN_X), cy = Math.floor(wy - MAP_MIN_Y);
  const ir = Math.ceil(r);
  const r2 = r * r;
  const inForest = cx >= 0 && cy >= 0 && cx < FOG_W && cy < FOG_H && block[cy * FOG_W + cx] === 1;
  for (let y = Math.max(0, cy - ir); y <= Math.min(FOG_H - 1, cy + ir); y++) {
    for (let x = Math.max(0, cx - ir); x <= Math.min(FOG_W - 1, cx + ir); x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy > r2) continue;
      const i = y * FOG_W + x;
      if (vis[i]) continue;
      if (inForest ? dx * dx + dy * dy <= 4 : los(block, cx, cy, x, y)) vis[i] = 1;
    }
  }
}

/**
 * Recompute team vision. `unitsOnly` skips the grid rebuild and only refreshes per-unit visibility
 * (the grid is rebuilt at 15 Hz; units are re-evaluated every tick).
 */
export function updateFog(m: Match, team: 0 | 1, unitsOnly = false) {
  const grid = getMapGrid();
  const vis = m.fog[team];
  const presence = m.brushPresence[team];
  if (!unitsOnly) {
    vis.fill(0);
    presence.clear();
    for (const u of m.units) {
      if (!u.alive || u.team !== team) continue;
      if (u.brush >= 0) presence.add(u.brush);
      const r = visionRadius(m, u);
      if (r > 0) stamp(vis, grid.fogBlock, u.x, u.y, r);
    }
    for (const rv of m.reveals) if (rv.team === team && rv.until > m.time) stamp(vis, grid.fogBlock, rv.x, rv.y, rv.r);
  }
  for (const u of m.units) {
    if (!u.alive || u.team === team) continue;
    if (computeVisible(m, team, u)) u.lastSeen[team] = m.tick;
  }
}

function computeVisible(m: Match, team: 0 | 1, u: Unit): boolean {
  if (u.structure) return true;
  if (u.revealUntil > m.time) return true;
  for (const e of u.effects) if (e.kind === 'reveal' && e.until > m.time) return true;
  if (!m.fogVisible(team, u.x, u.y)) return false;
  if (u.kind === 'ward') {
    // stealthed: only revealed by proximity true-sight of an enemy hero
    for (const h of m.heroes) if (h.alive && h.team === team && dist(h.x, h.y, u.x, u.y) <= 5) return true;
    return false;
  }
  if (u.brush >= 0 && !m.brushPresence[team].has(u.brush)) return false;
  return true;
}

export function isVisibleTo(m: Match, team: 0 | 1, u: Unit): boolean {
  if (u.team === team) return true;
  if (u.structure) return true;
  return m.tick - u.lastSeen[team] <= VISION_GRACE_TICKS;
}

/** Bit-pack a team fog grid for transmission. */
export function packFog(vis: Uint8Array): Uint8Array {
  const out = new Uint8Array(Math.ceil(vis.length / 8));
  for (let i = 0; i < vis.length; i++) if (vis[i]) out[i >> 3] |= 1 << (i & 7);
  return out;
}
export function unpackFog(bits: Uint8Array, out: Uint8Array) {
  for (let i = 0; i < out.length; i++) out[i] = (bits[i >> 3] >> (i & 7)) & 1;
}
