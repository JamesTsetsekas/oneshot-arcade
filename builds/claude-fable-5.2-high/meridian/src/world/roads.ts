// Road-lane graph, intersection connectors, signal phases, sidewalk graph and route queries.
// Pure data + functions; shared by traffic, police, pedestrians, GPS and tests.
import { segments, intersections, blocks, Segment, Intersection, Block, SPEED_LIMIT, Rect, CANAL, getBlock, getIntersection, getHSeg, getVSeg, WALL_IN, COAST_E, COAST_S } from './district';
import { segParam } from '../core/math';

export type Dir = 0 | 1 | 2 | 3; // 0=N(+z) 1=E(+x) 2=S(-z) 3=W(-x)
export const DIR_YAW = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
export type Turn = 'S' | 'L' | 'R';

export interface Lane {
  id: number; kind: 'lane' | 'conn';
  pts: number[];          // x0,z0,x1,z1,...
  cum: number[];          // cumulative length at each point
  len: number; speed: number;
  seg: Segment | null; dir: Dir; idx: number; nLanes: number;
  toInter: Intersection | null; fromInter: Intersection | null;
  next: Lane[]; turn: Turn; inter: Intersection | null;
  portalEnd: boolean; portalStart: boolean; adjacent: Lane | null;
}

export const lanes: Lane[] = [];
export const roadLanes: Lane[] = [];
const incoming = new Map<number, Lane[]>();
const outgoing = new Map<number, Lane[]>();

function mkLane(kind: 'lane' | 'conn', pts: number[], speed: number): Lane {
  const cum = [0];
  for (let i = 2; i < pts.length; i += 2) cum.push(cum[cum.length - 1] + Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]));
  const l: Lane = {
    id: lanes.length, kind, pts, cum, len: cum[cum.length - 1], speed, seg: null, dir: 0, idx: 0, nLanes: 1,
    toInter: null, fromInter: null, next: [], turn: 'S', inter: null, portalEnd: false, portalStart: false, adjacent: null,
  };
  lanes.push(l);
  return l;
}
export const LANE_OFFSETS: Record<string, number[]> = { arterial: [2.0, 5.4], collector: [1.8], street: [1.9] };

(function buildLanes() {
  for (const s of segments) {
    if (s.kind !== 'road') continue;
    const offs = LANE_OFFSETS[s.cls];
    const speed = SPEED_LIMIT[s.cls];
    const fwd: Lane[] = [], back: Lane[] = [];
    offs.forEach((o, k) => {
      let a: Lane, b: Lane;
      if (s.axis === 'v') {
        a = mkLane('lane', [s.ax + o, s.az, s.ax + o, s.bz], speed); a.dir = 0;
        b = mkLane('lane', [s.ax - o, s.bz, s.ax - o, s.az], speed); b.dir = 2;
        a.fromInter = getIntersection(s.line, s.gap); a.toInter = getIntersection(s.line, s.gap + 1);
        b.fromInter = a.toInter; b.toInter = a.fromInter;
      } else {
        a = mkLane('lane', [s.ax, s.az - o, s.bx, s.az - o], speed); a.dir = 1;
        b = mkLane('lane', [s.bx, s.az + o, s.ax, s.az + o], speed); b.dir = 3;
        a.fromInter = getIntersection(s.gap, s.line); a.toInter = getIntersection(s.gap + 1, s.line);
        b.fromInter = a.toInter; b.toInter = a.fromInter;
      }
      for (const l of [a, b]) { l.seg = s; l.idx = k; l.nLanes = offs.length; roadLanes.push(l); }
      a.portalEnd = !a.toInter; a.portalStart = !a.fromInter;
      b.portalEnd = !b.toInter; b.portalStart = !b.fromInter;
      fwd.push(a); back.push(b);
    });
    if (offs.length === 2) { fwd[0].adjacent = fwd[1]; fwd[1].adjacent = fwd[0]; back[0].adjacent = back[1]; back[1].adjacent = back[0]; }
  }
  for (const l of roadLanes) {
    if (l.toInter) { if (!incoming.has(l.toInter.id)) incoming.set(l.toInter.id, []); incoming.get(l.toInter.id)!.push(l); }
    if (l.fromInter) { if (!outgoing.has(l.fromInter.id)) outgoing.set(l.fromInter.id, []); outgoing.get(l.fromInter.id)!.push(l); }
  }
  for (const it of intersections) {
    const ins = incoming.get(it.id) ?? [], outs = outgoing.get(it.id) ?? [];
    for (const a of ins) {
      const made: Lane[] = [];
      const connect = (b: Lane, turn: Turn) => {
        const ax = a.pts[2], az = a.pts[3], bx = b.pts[0], bz = b.pts[1];
        let pts: number[];
        if (turn === 'S') pts = [ax, az, bx, bz];
        else {
          const vertical = a.dir === 0 || a.dir === 2;
          const cx = vertical ? ax : bx, cz = vertical ? bz : az;
          pts = [];
          for (let k = 0; k <= 8; k++) {
            const t = k / 8, u = 1 - t;
            pts.push(u * u * ax + 2 * u * t * cx + t * t * bx, u * u * az + 2 * u * t * cz + t * t * bz);
          }
        }
        const c = mkLane('conn', pts, turn === 'S' ? Math.min(a.speed, b.speed) : turn === 'R' ? 4.6 : 5.6);
        c.dir = a.dir; c.turn = turn; c.inter = it; c.next = [b]; c.seg = null; c.idx = a.idx; c.nLanes = a.nLanes;
        a.next.push(c); made.push(c);
      };
      for (const b of outs) {
        if (b.seg === a.seg) continue;
        const rel = (b.dir - a.dir + 4) % 4;
        if (rel === 0 && b.idx === Math.min(a.idx, b.nLanes - 1)) connect(b, 'S');
        else if (rel === 1 && a.idx === a.nLanes - 1 && b.idx === b.nLanes - 1) connect(b, 'R');
        else if (rel === 3 && a.idx === 0 && b.idx === 0) connect(b, 'L');
      }
      if (made.length === 0) {
        // fallback so no lane is a dead end: take any non-U-turn exit
        for (const b of outs) {
          if (b.seg === a.seg) continue;
          const rel = (b.dir - a.dir + 4) % 4;
          connect(b, rel === 1 ? 'R' : rel === 3 ? 'L' : 'S');
          break;
        }
      }
    }
  }
})();

/** Sample a point (and heading) at arc length s along a lane. */
export function lanePoint(l: Lane, s: number, out: { x: number; z: number; yaw: number }) {
  const { pts, cum } = l;
  if (s <= 0) s = 0; else if (s >= l.len) s = l.len;
  let k = 0;
  while (k < cum.length - 2 && cum[k + 1] < s) k++;
  const segLen = cum[k + 1] - cum[k] || 1;
  const t = (s - cum[k]) / segLen;
  const x0 = pts[k * 2], z0 = pts[k * 2 + 1], x1 = pts[k * 2 + 2], z1 = pts[k * 2 + 3];
  out.x = x0 + (x1 - x0) * t; out.z = z0 + (z1 - z0) * t; out.yaw = Math.atan2(x1 - x0, z1 - z0);
  return out;
}
/** Project a position onto a lane: arc length and signed lateral offset (positive = right of lane). */
export function laneProject(l: Lane, x: number, z: number, out: { s: number; lat: number }) {
  const { pts, cum } = l;
  let best = Infinity;
  for (let k = 0; k < cum.length - 1; k++) {
    const x0 = pts[k * 2], z0 = pts[k * 2 + 1], x1 = pts[k * 2 + 2], z1 = pts[k * 2 + 3];
    const t = segParam(x, z, x0, z0, x1, z1);
    const px = x0 + (x1 - x0) * t, pz = z0 + (z1 - z0) * t;
    const d = (x - px) * (x - px) + (z - pz) * (z - pz);
    if (d < best) {
      best = d; out.s = cum[k] + (cum[k + 1] - cum[k]) * t;
      const dx = x1 - x0, dz = z1 - z0, n = Math.hypot(dx, dz) || 1;
      out.lat = ((x - px) * dz - (z - pz) * dx) / n;
    }
  }
  return out;
}
const _pr = { s: 0, lat: 0 };
/** Nearest drivable lane to a position, preferring lanes pointing along `yaw` when given. */
export function nearestLane(x: number, z: number, yaw?: number): { lane: Lane; s: number; lat: number } | null {
  let best: Lane | null = null, bestScore = Infinity, bs = 0, bl = 0;
  for (const l of roadLanes) {
    const r = l.seg!.rect;
    if (x < r.x0 - 60 || x > r.x1 + 60 || z < r.z0 - 60 || z > r.z1 + 60) continue;
    laneProject(l, x, z, _pr);
    const p = lanePoint(l, _pr.s, _lp);
    let score = Math.hypot(x - p.x, z - p.z);
    if (yaw !== undefined) score += (1 - Math.cos(yaw - DIR_YAW[l.dir])) * 6;
    if (score < bestScore) { bestScore = score; best = l; bs = _pr.s; bl = _pr.lat; }
  }
  return best ? { lane: best, s: bs, lat: bl } : null;
}
const _lp = { x: 0, z: 0, yaw: 0 };

// ---------------------------------------------------------------- signals
export type Light = 'green' | 'yellow' | 'red';
export const SIGNAL_CYCLE = 24;
export class Signals {
  time = 0;
  private overrides = new Map<number, { axis: 'NS' | 'EW'; until: number }>();
  /** Narrow mission API: hold one axis green at an intersection for a while. */
  requestPhase(interId: number, axis: 'NS' | 'EW', seconds: number) { this.overrides.set(interId, { axis, until: this.time + seconds }); }
  update(dt: number) {
    this.time += dt;
    for (const [k, o] of this.overrides) if (o.until < this.time) this.overrides.delete(k);
  }
  /** Light for traffic travelling along the given axis through an intersection. */
  light(it: Intersection, axis: 'NS' | 'EW'): Light {
    if (!it.signal) return 'green';
    const o = this.overrides.get(it.id);
    if (o) return o.axis === axis ? 'green' : 'red';
    const t = (this.time + it.offset) % SIGNAL_CYCLE;
    if (axis === 'NS') return t < 9 ? 'green' : t < 11 ? 'yellow' : 'red';
    return t >= 12 && t < 21 ? 'green' : t >= 21 && t < 23 ? 'yellow' : 'red';
  }
  laneLight(l: Lane): Light {
    if (!l.toInter) return 'green';
    return this.light(l.toInter, l.dir === 0 || l.dir === 2 ? 'NS' : 'EW');
  }
  /** Pedestrians may cross a road arm when traffic on that arm's axis is held at red. */
  walkAllowed(it: Intersection, crossedAxis: 'NS' | 'EW'): boolean {
    if (!it.signal) return true;
    const o = this.overrides.get(it.id);
    if (o) return o.axis !== crossedAxis;
    const t = (this.time + it.offset) % SIGNAL_CYCLE;
    // leave a clearance margin before the conflicting green begins
    if (crossedAxis === 'NS') return t >= 12 && t < 19;
    return t < 7;
  }
}

// ---------------------------------------------------------------- road routing (GPS / pursuit)
export interface RouteNode { id: number; x: number; z: number; links: { to: number; cost: number }[]; inter: Intersection | null }
export const routeNodes: RouteNode[] = [];
(function buildRouteGraph() {
  for (const it of intersections) routeNodes.push({ id: it.id, x: it.x, z: it.z, links: [], inter: it });
  for (const s of segments) {
    if (s.kind !== 'road') continue;
    const a = s.axis === 'v' ? getIntersection(s.line, s.gap) : getIntersection(s.gap, s.line);
    const b = s.axis === 'v' ? getIntersection(s.line, s.gap + 1) : getIntersection(s.gap + 1, s.line);
    const cost = (s.len + 16) / SPEED_LIMIT[s.cls];
    if (a && b) { routeNodes[a.id].links.push({ to: b.id, cost }); routeNodes[b.id].links.push({ to: a.id, cost }); }
    else {
      // portal stub: a leaf node at the tunnel mouth
      const inner = (a ?? b)!;
      const n: RouteNode = { id: routeNodes.length, x: a ? s.bx : s.ax, z: a ? s.bz : s.az, links: [{ to: inner.id, cost }], inter: null };
      routeNodes.push(n); routeNodes[inner.id].links.push({ to: n.id, cost });
    }
  }
})();
export function nearestRouteNode(x: number, z: number): RouteNode {
  let best = routeNodes[0], bd = Infinity;
  for (const n of routeNodes) { const d = (n.x - x) * (n.x - x) + (n.z - z) * (n.z - z); if (d < bd) { bd = d; best = n; } }
  return best;
}
function astar<T extends { id: number; x: number; z: number }>(nodes: T[], links: (n: T) => { to: number; cost: number }[], from: number, to: number, hScale: number): number[] {
  const g = new Float64Array(nodes.length).fill(Infinity), prev = new Int32Array(nodes.length).fill(-1);
  const closed = new Uint8Array(nodes.length);
  const open: number[] = [from]; g[from] = 0;
  const tx = nodes[to].x, tz = nodes[to].z;
  const f = (i: number) => g[i] + Math.hypot(nodes[i].x - tx, nodes[i].z - tz) * hScale;
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (f(open[i]) < f(open[bi])) bi = i;
    const cur = open.splice(bi, 1)[0];
    if (cur === to) break;
    if (closed[cur]) continue;
    closed[cur] = 1;
    for (const l of links(nodes[cur])) {
      const ng = g[cur] + l.cost;
      if (ng < g[l.to]) { g[l.to] = ng; prev[l.to] = cur; open.push(l.to); }
    }
  }
  if (prev[to] < 0 && to !== from) return [];
  const path: number[] = [];
  for (let c = to; c >= 0; c = prev[c]) { path.push(c); if (c === from) break; }
  return path.reverse();
}
/** GPS polyline along roads between two world positions: [x,z,x,z,...]. */
export function roadRoute(fx: number, fz: number, tx: number, tz: number): number[] {
  const a = nearestRouteNode(fx, fz), b = nearestRouteNode(tx, tz);
  const ids = astar(routeNodes, (n) => n.links, a.id, b.id, 1 / 15);
  const pts: number[] = [fx, fz];
  // drop the first/last node when the endpoint already lies past it along the route
  for (let k = 0; k < ids.length; k++) {
    const n = routeNodes[ids[k]];
    if (k === 0 && ids.length > 1) {
      const m = routeNodes[ids[1]];
      if (segParam(fx, fz, n.x, n.z, m.x, m.z) > 0.02 && Math.abs((fx - n.x) * (m.z - n.z) - (fz - n.z) * (m.x - n.x)) / Math.hypot(m.x - n.x, m.z - n.z) < 14) continue;
    }
    if (k === ids.length - 1 && ids.length > 1) {
      const m = routeNodes[ids[k - 1]];
      if (segParam(tx, tz, n.x, n.z, m.x, m.z) > 0.02 && Math.abs((tx - n.x) * (m.z - n.z) - (tz - n.z) * (m.x - n.x)) / Math.hypot(m.x - n.x, m.z - n.z) < 14) continue;
    }
    pts.push(n.x, n.z);
  }
  pts.push(tx, tz);
  return pts;
}
export function routeLength(pts: number[]): number {
  let d = 0;
  for (let i = 2; i < pts.length; i += 2) d += Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]);
  return d;
}
/** Lane-accurate route for AI drivers: lanes + connectors from `start` to the lane nearest the target. */
export function laneRoute(start: Lane, tx: number, tz: number): Lane[] {
  const target = nearestLane(tx, tz);
  if (!target) return [start];
  const goalSeg = target.lane.seg;
  const dist = new Map<number, number>(), prev = new Map<number, Lane | null>();
  const open: Lane[] = [start];
  dist.set(start.id, 0); prev.set(start.id, null);
  let goal: Lane | null = null;
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (dist.get(open[i].id)! < dist.get(open[bi].id)!) bi = i;
    const cur = open.splice(bi, 1)[0];
    if (cur.seg === goalSeg && cur.kind === 'lane') { goal = cur; break; }
    const d = dist.get(cur.id)!;
    const nexts = cur.adjacent ? [...cur.next, cur.adjacent] : cur.next;
    for (const n of nexts) {
      const isAdj = n === cur.adjacent;
      const nd = d + (isAdj ? 1.5 : cur.len / cur.speed + (n.kind === 'conn' && n.turn === 'L' ? 2 : 0));
      if (nd < (dist.get(n.id) ?? Infinity)) { dist.set(n.id, nd); prev.set(n.id, cur); open.push(n); }
    }
  }
  if (!goal) return [start];
  const out: Lane[] = [];
  for (let c: Lane | null = goal; c; c = prev.get(c.id) ?? null) out.push(c);
  return out.reverse();
}

// ---------------------------------------------------------------- sidewalk graph
export interface WalkEdge { to: number; len: number; cross: { inter: Intersection; axis: 'NS' | 'EW' } | null }
export interface WalkNode { id: number; x: number; z: number; block: number; door: boolean; poi: '' | 'browse' | 'sit' | 'view'; edges: WalkEdge[] }
export const walkNodes: WalkNode[] = [];
/** Block rect clipped to land (inside the viaduct wall, short of the quay edge). */
export function landRect(b: Block): Rect {
  return { x0: Math.max(b.rect.x0, -WALL_IN + 2), x1: Math.min(b.rect.x1, COAST_E - 3), z0: Math.max(b.rect.z0, COAST_S + 3), z1: Math.min(b.rect.z1, WALL_IN - 2) };
}
const cornerIds = new Map<number, number[]>(); // block id -> [sw, se, ne, nw]
function addWalk(x: number, z: number, block: number, door = false, poi: WalkNode['poi'] = ''): WalkNode {
  const n: WalkNode = { id: walkNodes.length, x, z, block, door, poi, edges: [] };
  walkNodes.push(n); return n;
}
function link(a: WalkNode, b: WalkNode, cross: WalkEdge['cross'] = null) {
  const len = Math.hypot(a.x - b.x, a.z - b.z);
  a.edges.push({ to: b.id, len, cross }); b.edges.push({ to: a.id, len, cross });
}
(function buildSidewalks() {
  for (const b of blocks) {
    const r = landRect(b);
    if (r.x1 - r.x0 < 12 || r.z1 - r.z0 < 12) continue;
    const x0 = r.x0 + 2, x1 = r.x1 - 2, z0 = r.z0 + 2, z1 = r.z1 - 2;
    const sw = addWalk(x0, z0, b.id), se = addWalk(x1, z0, b.id), ne = addWalk(x1, z1, b.id), nw = addWalk(x0, z1, b.id);
    cornerIds.set(b.id, [sw.id, se.id, ne.id, nw.id]);
    const side = (a: WalkNode, c: WalkNode, ok: boolean) => {
      if (!ok) return;
      const len = Math.hypot(a.x - c.x, a.z - c.z);
      if (len > 50) { const m = addWalk((a.x + c.x) / 2, (a.z + c.z) / 2, b.id, true); link(a, m); link(m, c); }
      else link(a, c);
    };
    if (b.bx === 2) {
      // canal column: the south/north sides only connect across the channel where a bridge exists
      const south = getHSeg(2, b.bz), north = getHSeg(2, b.bz + 1);
      side(sw, se, !!south && south.kind === 'road');
      side(nw, ne, !!north && north.kind === 'road');
      side(sw, nw, true); side(se, ne, true);
      // promenade nodes on the east bank
      const m = addWalk(CANAL.x1 + 14, (z0 + z1) / 2, b.id, false, 'sit');
      const sb = addWalk(CANAL.x1 + 14, z0, b.id), nb = addWalk(CANAL.x1 + 14, z1, b.id);
      link(sb, m); link(m, nb); link(sb, se); link(nb, ne);
    } else {
      side(sw, se, true); side(se, ne, true); side(ne, nw, true); side(nw, sw, true);
    }
    if (b.lot === 'plaza' || b.lot === 'park') {
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, wx = (x1 - x0) * 0.28, wz = (z1 - z0) * 0.28;
      const inner = [addWalk(cx - wx, cz - wz, b.id, false, 'browse'), addWalk(cx + wx, cz - wz, b.id, false, 'browse'),
        addWalk(cx + wx, cz + wz, b.id, false, b.lot === 'park' ? 'view' : 'browse'), addWalk(cx - wx, cz + wz, b.id, false, 'sit')];
      const corners = [sw, se, ne, nw];
      for (let k = 0; k < 4; k++) { link(inner[k], inner[(k + 1) % 4]); link(inner[k], corners[k]); }
    }
  }
  const corner = (bx: number, bz: number, k: number): WalkNode | null => {
    if (bx < 0 || bx > 8 || bz < 0 || bz > 8) return null;
    const ids = cornerIds.get(getBlock(bx, bz).id);
    return ids ? walkNodes[ids[k]] : null;
  };
  for (const it of intersections) {
    const { i, j } = it;
    const ne = corner(i, j, 0), nw = corner(i - 1, j, 1), se = corner(i, j - 1, 3), sw = corner(i - 1, j - 1, 2);
    const cross = (a: WalkNode | null, b: WalkNode | null, arm: Segment | null | undefined, axis: 'NS' | 'EW') => {
      if (!a || !b) return;
      if (Math.hypot(a.x - b.x, a.z - b.z) > 30) return;
      link(a, b, arm && arm.kind === 'road' ? { inter: it, axis } : null);
    };
    cross(nw, ne, getVSeg(i, j), 'NS');
    cross(sw, se, getVSeg(i, j - 1), 'NS');
    cross(ne, se, getHSeg(i, j), 'EW');
    cross(nw, sw, getHSeg(i - 1, j), 'EW');
  }
})();
export function nearestWalkNode(x: number, z: number, maxDist = 1e9): WalkNode | null {
  let best: WalkNode | null = null, bd = maxDist * maxDist;
  for (const n of walkNodes) { const d = (n.x - x) * (n.x - x) + (n.z - z) * (n.z - z); if (d < bd) { bd = d; best = n; } }
  return best;
}
export function walkPath(from: number, to: number): number[] {
  return astar(walkNodes, (n) => n.edges.map((e) => ({ to: e.to, cost: e.len + (e.cross ? 6 : 0) })), from, to, 1);
}
export const lanesInto = (it: Intersection) => incoming.get(it.id) ?? [];
export const lanesOutOf = (it: Intersection) => outgoing.get(it.id) ?? [];
