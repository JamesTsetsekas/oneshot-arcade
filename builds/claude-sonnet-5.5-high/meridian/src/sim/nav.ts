import { LINES, N_LINES, ROAD_HALF, LANE_OFFSET, SIDEWALK } from './world';
import type { V2 } from '../core/math';
import { clamp } from '../core/math';

export type Axis = 'x' | 'z';
export type Phase = 'green' | 'yellow' | 'red';

// --------------------------------------------------------------------------- signals
export const SIGNAL_CYCLE = 40;
/** z-axis (north-south) traffic: green 0-15, yellow 15-18; x-axis (east-west): green 20-35, yellow 35-38. */
export function signalPhaseAt(t: number, axis: Axis, offset = 0): Phase {
  const c = (((t + offset) % SIGNAL_CYCLE) + SIGNAL_CYCLE) % SIGNAL_CYCLE;
  const s = axis === 'z' ? 0 : 20;
  const k = c - s;
  if (k >= 0 && k < 15) return 'green';
  if (k >= 15 && k < 18) return 'yellow';
  return 'red';
}
/** Seconds until the lane axis turns green again (0 if green now). */
export function secondsToGreen(t: number, axis: Axis, offset = 0): number {
  const c = (((t + offset) % SIGNAL_CYCLE) + SIGNAL_CYCLE) % SIGNAL_CYCLE;
  const s = axis === 'z' ? 0 : 20;
  const k = (c - s + SIGNAL_CYCLE) % SIGNAL_CYCLE;
  if (k < 15) return 0;
  return SIGNAL_CYCLE - k;
}
/** Pedestrians cross a street whose *traffic axis* is red with at least `need` seconds left. */
export function canStartCrossing(t: number, trafficAxis: Axis, need = 9, offset = 0): boolean {
  const c = (((t + offset) % SIGNAL_CYCLE) + SIGNAL_CYCLE) % SIGNAL_CYCLE;
  const s = trafficAxis === 'z' ? 0 : 20;
  const k = (c - s + SIGNAL_CYCLE) % SIGNAL_CYCLE; // time since this axis's green began
  // red spans k in [18, 40): 22 s. Allow starting from k = 19 until 40 - need
  return k >= 19 && k <= SIGNAL_CYCLE - need;
}

/** Narrow API for missions: ask for an axis to get green soon (never moves vehicles directly). */
export class SignalController {
  offset = 0;
  private hold: { axis: Axis; until: number } | null = null;
  phase(t: number, axis: Axis): Phase {
    if (this.hold && t < this.hold.until) return axis === this.hold.axis ? 'green' : 'red';
    return signalPhaseAt(t, axis, this.offset);
  }
  requestGreen(axis: Axis, t: number, seconds = 12): void { this.hold = { axis, until: t + seconds }; }
  walkOk(t: number, trafficAxis: Axis): boolean {
    if (this.hold && t < this.hold.until) return this.hold.axis !== trafficAxis;
    return canStartCrossing(t, trafficAxis, 9, this.offset);
  }
}

// --------------------------------------------------------------------------- road graph
export interface Lane {
  id: number;
  from: number; to: number;       // intersection indices
  dir: V2;
  axis: Axis;
  p0: V2; p1: V2;                 // lane-line points at the stop-line boundary of each intersection
  length: number;
  limit: number;                  // m/s
  arterial: boolean;
}

export const isec = (ix: number, iz: number): number => iz * N_LINES + ix;
export const isecX = (i: number): number => LINES[i % N_LINES];
export const isecZ = (i: number): number => LINES[Math.floor(i / N_LINES)];
export const isecPos = (i: number): V2 => ({ x: isecX(i), z: isecZ(i) });

export class RoadGraph {
  lanes: Lane[] = [];
  outgoing: Lane[][] = [];
  incoming: Lane[][] = [];

  constructor() {
    const n = N_LINES * N_LINES;
    for (let i = 0; i < n; i++) { this.outgoing.push([]); this.incoming.push([]); }
    for (let iz = 0; iz < N_LINES; iz++) for (let ix = 0; ix < N_LINES; ix++) {
      const a = isec(ix, iz);
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const jx = ix + dx;
        const jz = iz + dz;
        if (jx < 0 || jz < 0 || jx >= N_LINES || jz >= N_LINES) continue;
        const b = isec(jx, jz);
        const dir = { x: dx, z: dz };
        const right = { x: dir.z, z: -dir.x }; // right-hand traffic: lane sits to the right of travel
        const A = isecPos(a);
        const B = isecPos(b);
        const lane: Lane = {
          id: this.lanes.length, from: a, to: b, dir,
          axis: dx !== 0 ? 'x' : 'z',
          p0: { x: A.x + dir.x * ROAD_HALF + right.x * LANE_OFFSET, z: A.z + dir.z * ROAD_HALF + right.z * LANE_OFFSET },
          p1: { x: B.x - dir.x * ROAD_HALF + right.x * LANE_OFFSET, z: B.z - dir.z * ROAD_HALF + right.z * LANE_OFFSET },
          length: 0,
          limit: ix === jx ? (ix === 0 || ix === N_LINES - 1 ? 12 : 9.5) : (iz === 0 || iz === N_LINES - 1 ? 12 : 9.5),
          arterial: (ix === jx ? ix : iz) === 0 || (ix === jx ? ix : iz) === N_LINES - 1,
        };
        lane.length = Math.hypot(lane.p1.x - lane.p0.x, lane.p1.z - lane.p0.z);
        this.lanes.push(lane);
        this.outgoing[a].push(lane);
        this.incoming[b].push(lane);
      }
    }
  }

  /** Lanes a vehicle may continue onto from `lane` (no U-turns). */
  next(lane: Lane): Lane[] {
    return this.outgoing[lane.to].filter((l) => !(l.dir.x === -lane.dir.x && l.dir.z === -lane.dir.z));
  }

  /** Smooth path through the intersection between two lanes (quadratic bezier). */
  turnPath(a: Lane, b: Lane, steps = 7): V2[] {
    const p0 = a.p1;
    const p3 = b.p0;
    if (a.dir.x === b.dir.x && a.dir.z === b.dir.z) return [p0, p3];
    // control = intersection of the two lane lines
    const c = a.dir.x !== 0 ? { x: b.p0.x, z: a.p1.z } : { x: a.p1.x, z: b.p0.z };
    const out: V2[] = [];
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const u = 1 - t;
      out.push({ x: u * u * p0.x + 2 * u * t * c.x + t * t * p3.x, z: u * u * p0.z + 2 * u * t * c.z + t * t * p3.z });
    }
    return out;
  }

  nearestIntersection(x: number, z: number): number {
    const ix = clamp(Math.round((x - LINES[0]) / (LINES[1] - LINES[0])), 0, N_LINES - 1);
    const iz = clamp(Math.round((z - LINES[0]) / (LINES[1] - LINES[0])), 0, N_LINES - 1);
    return isec(ix, iz);
  }

  /** The lane (and progress) closest to a point - used to snap spawns. */
  nearestLane(x: number, z: number): { lane: Lane; s: number; d: number } {
    let best: { lane: Lane; s: number; d: number } | null = null;
    for (const l of this.lanes) {
      const ex = l.p1.x - l.p0.x;
      const ez = l.p1.z - l.p0.z;
      const s = clamp(((x - l.p0.x) * ex + (z - l.p0.z) * ez) / (l.length * l.length), 0, 1);
      const px = l.p0.x + ex * s;
      const pz = l.p0.z + ez * s;
      const d = Math.hypot(x - px, z - pz);
      if (!best || d < best.d) best = { lane: l, s: s * l.length, d };
    }
    return best!;
  }

  /** Closest point on any road centre line (police navigation target snapping). */
  roadSnap(x: number, z: number): V2 {
    let bx = x;
    let bz = z;
    let bd = Infinity;
    for (const l of LINES) {
      const cx = clamp(x, LINES[0], LINES[N_LINES - 1]);
      const cz = clamp(z, LINES[0], LINES[N_LINES - 1]);
      const dx = Math.abs(x - l);
      const dz = Math.abs(z - l);
      if (dx < bd) { bd = dx; bx = l; bz = cz; }
      if (dz < bd) { bd = dz; bx = cx; bz = l; }
    }
    return { x: bx, z: bz };
  }

  /** A* over intersections (uniform edge cost). Returns node indices, inclusive of start and goal. */
  route(from: number, to: number, avoid?: (n: number) => number): number[] {
    if (from === to) return [from];
    const n = N_LINES * N_LINES;
    const g = new Float64Array(n).fill(Infinity);
    const prev = new Int32Array(n).fill(-1);
    const closed = new Uint8Array(n);
    const open: number[] = [from];
    g[from] = 0;
    const h = (a: number) => Math.abs(isecX(a) - isecX(to)) + Math.abs(isecZ(a) - isecZ(to));
    while (open.length) {
      let bi = 0;
      for (let k = 1; k < open.length; k++) if (g[open[k]] + h(open[k]) < g[open[bi]] + h(open[bi])) bi = k;
      const cur = open.splice(bi, 1)[0];
      if (cur === to) break;
      closed[cur] = 1;
      for (const l of this.outgoing[cur]) {
        if (closed[l.to]) continue;
        const cost = g[cur] + 80 + (avoid ? avoid(l.to) : 0);
        if (cost < g[l.to]) {
          g[l.to] = cost;
          prev[l.to] = cur;
          if (!open.includes(l.to)) open.push(l.to);
        }
      }
    }
    if (prev[to] === -1) return [from];
    const out: number[] = [];
    for (let c = to; c !== -1; c = prev[c]) out.push(c);
    return out.reverse();
  }
}

// --------------------------------------------------------------------------- pedestrian graph
export interface PedNode { id: number; x: number; z: number; ix: number; iz: number; corner: 0 | 1 | 2 | 3 }
export interface PedEdge { to: number; cross: boolean; trafficAxis?: Axis; len: number }

/**
 * Sidewalk corner graph: four corner nodes per intersection. Walking edges run along sidewalks to the
 * neighbouring intersection; crossing edges run over a street between two corners.
 * corner: 0 = (-,-) sw, 1 = (+,-) se, 2 = (+,+) ne, 3 = (-,+) nw
 */
export class PedGraph {
  nodes: PedNode[] = [];
  edges: PedEdge[][] = [];
  readonly off = ROAD_HALF + SIDEWALK / 2;

  constructor() {
    for (let iz = 0; iz < N_LINES; iz++) for (let ix = 0; ix < N_LINES; ix++) {
      const sx: Array<[number, number]> = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      sx.forEach(([cx, cz], c) => {
        this.nodes.push({ id: this.nodes.length, x: LINES[ix] + cx * this.off, z: LINES[iz] + cz * this.off, ix, iz, corner: c as 0 | 1 | 2 | 3 });
        this.edges.push([]);
      });
    }
    const id = (ix: number, iz: number, c: number) => (iz * N_LINES + ix) * 4 + c;
    const link = (a: number, b: number, cross: boolean, axis?: Axis) => {
      const len = Math.hypot(this.nodes[a].x - this.nodes[b].x, this.nodes[a].z - this.nodes[b].z);
      this.edges[a].push({ to: b, cross, trafficAxis: axis, len });
      this.edges[b].push({ to: a, cross, trafficAxis: axis, len });
    };
    for (let iz = 0; iz < N_LINES; iz++) for (let ix = 0; ix < N_LINES; ix++) {
      // crossings at this intersection
      // crossing a z-running road (traffic axis 'z') means walking along x between sw<->se or nw<->ne
      link(id(ix, iz, 0), id(ix, iz, 1), true, 'z');
      link(id(ix, iz, 3), id(ix, iz, 2), true, 'z');
      // crossing an x-running road means walking along z: sw<->nw, se<->ne
      link(id(ix, iz, 0), id(ix, iz, 3), true, 'x');
      link(id(ix, iz, 1), id(ix, iz, 2), true, 'x');
      // sidewalks to the east neighbour: this ne -> east sw... (east side corners are 1,2 of this and 0,3 of next)
      if (ix + 1 < N_LINES) {
        link(id(ix, iz, 1), id(ix + 1, iz, 0), false); // south side
        link(id(ix, iz, 2), id(ix + 1, iz, 3), false); // north side
      }
      if (iz + 1 < N_LINES) {
        link(id(ix, iz, 3), id(ix, iz + 1, 0), false); // west side
        link(id(ix, iz, 2), id(ix, iz + 1, 1), false); // east side
      }
    }
  }

  nearest(x: number, z: number): number {
    let best = 0;
    let bd = Infinity;
    // coarse: nearest intersection then its four corners
    const ix = clamp(Math.round((x - LINES[0]) / 80), 0, N_LINES - 1);
    const iz = clamp(Math.round((z - LINES[0]) / 80), 0, N_LINES - 1);
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const jx = ix + dx;
      const jz = iz + dz;
      if (jx < 0 || jz < 0 || jx >= N_LINES || jz >= N_LINES) continue;
      for (let c = 0; c < 4; c++) {
        const n = this.nodes[(jz * N_LINES + jx) * 4 + c];
        const d = (n.x - x) ** 2 + (n.z - z) ** 2;
        if (d < bd) { bd = d; best = n.id; }
      }
    }
    return best;
  }

  route(from: number, to: number): number[] {
    if (from === to) return [from];
    const n = this.nodes.length;
    const g = new Float64Array(n).fill(Infinity);
    const prev = new Int32Array(n).fill(-1);
    const closed = new Uint8Array(n);
    const open: number[] = [from];
    g[from] = 0;
    const T = this.nodes[to];
    const h = (a: number) => Math.hypot(this.nodes[a].x - T.x, this.nodes[a].z - T.z);
    let guard = 0;
    while (open.length && guard++ < 4000) {
      let bi = 0;
      for (let k = 1; k < open.length; k++) if (g[open[k]] + h(open[k]) < g[open[bi]] + h(open[bi])) bi = k;
      const cur = open.splice(bi, 1)[0];
      if (cur === to) break;
      closed[cur] = 1;
      for (const e of this.edges[cur]) {
        if (closed[e.to]) continue;
        const cost = g[cur] + e.len + (e.cross ? 6 : 0);
        if (cost < g[e.to]) { g[e.to] = cost; prev[e.to] = cur; if (!open.includes(e.to)) open.push(e.to); }
      }
    }
    if (prev[to] === -1) return [from];
    const out: number[] = [];
    for (let c = to; c !== -1; c = prev[c]) out.push(c);
    return out.reverse();
  }
}
