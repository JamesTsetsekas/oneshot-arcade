// Builds the pure-data world model of Galeport from the authored source data.
// The model is consumed by physics, traffic, fares, navigation, the renderer and the minimap.
import { Quat, V3, Rng, clamp, clamp01, lerp, hash2, distToSeg, quatLookDir, quatYaw, smooth } from '../core/math';
import {
  CELL, NX, NZ, WORLD_W, WORLD_D, COLS, ROWS, CANAL_Z, CANAL_BRIDGE_COLS, REMOVED_EDGES, HIGHLINE_PTS,
  HIGHLINE_OFFRAMP_FROM, ROAD_CLASSES, RoadClass, RoadClassInfo, SITE_DEFS, SHORTCUT_DEFS, RAMP_DEFS, RampDef,
  GARAGE_DECK, HUB_DEFS, PLAZA_RECT, Surface, SURFACES, SURFACE_BY_CODE, District, districtAt, terrainFn,
  gridClass, LandmarkKind, ShortcutKind,
} from './galeport';

export interface RoadNode {
  id: number;
  x: number;
  z: number;
  y: number;
  edges: number[];
  grid: boolean;
  signal: boolean;
  /** Radius of the intersection area; lanes stop this far from the node. 0 for pass-through nodes. */
  clear: number;
}
export interface RoadEdge {
  id: number;
  a: number;
  b: number;
  cls: RoadClass;
  info: RoadClassInfo;
  hw: number;
  len: number;
  dx: number;
  dz: number;
  structure: boolean;
  ya: number;
  yb: number;
}
export interface Box {
  x: number; y: number; z: number;
  hx: number; hy: number; hz: number;
  q: Quat;
  kind: 'deck' | 'rail' | 'pillar' | 'wall' | 'container' | 'roof' | 'garage';
  surface: Surface;
  tint: number;
  collide: boolean;
}
export interface Building {
  x: number; z: number; yaw: number;
  hx: number; hz: number; // hx = half depth, hz = half length along the street
  y0: number; y1: number;
  district: District;
  tint: number; // 0..1 random
  seed: number;
  front: number; // local x sign of the street-facing wall
}
export interface Ramp {
  def: RampDef;
  /** 6 hull points, flat xyz. Order: lowL, lowR, highBL, highBR, topL, topR (wedge) or lowAL, lowAR, lowBL, lowBR, topL, topR (kicker). */
  pts: number[];
  topY: number;
}
export interface Site {
  id: number;
  name: string;
  kind: LandmarkKind;
  hue: number;
  r: number;
  edge: number;
  t: number;
  side: number;
  x: number; y: number; z: number; // ring centre on the road
  sx: number; sz: number; sy: number; // passenger stand on the kerb
  lx: number; lz: number; ly: number; // landmark centre
  district: District;
}
export interface Shortcut {
  id: string;
  index: number;
  name: string;
  kind: ShortcutKind;
  ax: number; ay: number; az: number;
  bx: number; by: number; bz: number;
  width: number;
  surface: Surface;
  oneWay: boolean;
  corridor: boolean;
  len: number;
}
export interface Prop {
  kind: 'palm' | 'tree' | 'lamp' | 'umbrella' | 'bollard';
  x: number; y: number; z: number;
  s: number;
  rot: number;
  tint: number;
}
export interface Pose {
  x: number; y: number; z: number; yaw: number;
}
export interface EdgeLoc {
  edge: number;
  t: number;
  dist: number;
}
export interface Hub {
  name: string;
  pose: Pose;
}

const SMAP_CELL = 2;
const SMAP_W = WORLD_W / SMAP_CELL;
const SMAP_D = WORLD_D / SMAP_CELL;
const SIDEWALK = 4;

export class WorldModel {
  heights = new Float32Array((NX + 1) * (NZ + 1));
  surfaceMap = new Uint8Array(SMAP_W * SMAP_D);
  nodes: RoadNode[] = [];
  edges: RoadEdge[] = [];
  navDist!: Float32Array;
  navNext!: Int16Array;
  buildings: Building[] = [];
  boxes: Box[] = [];
  ramps: Ramp[] = [];
  sites: Site[] = [];
  shortcuts: Shortcut[] = [];
  props: Prop[] = [];
  hubs: Hub[] = [];
  gridNode: number[][] = [];

  constructor() {
    this.buildTerrain();
    this.buildRoads();
    this.buildNav();
    this.buildShortcuts();
    this.buildSites();
    this.buildSurfaceMap();
    this.buildStructures();
    this.buildRamps();
    this.buildBuildings();
    this.buildProps();
    this.buildHubs();
  }

  // ---------------------------------------------------------------- terrain
  private buildTerrain(): void {
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) this.heights[i + j * (NX + 1)] = terrainFn(i * CELL, j * CELL);
  }

  /** Height of the triangulated terrain (same triangulation as the physics heightfield and the render mesh). */
  heightAt(x: number, z: number): number {
    const fx = clamp(x / CELL, 0, NX - 1e-4);
    const fz = clamp(z / CELL, 0, NZ - 1e-4);
    const i = Math.floor(fx), j = Math.floor(fz);
    const u = fx - i, v = fz - j;
    const H = this.heights, w = NX + 1;
    const h00 = H[i + j * w], h10 = H[i + 1 + j * w], h01 = H[i + (j + 1) * w], h11 = H[i + 1 + (j + 1) * w];
    // Diagonal runs p00 -> p11. The physics heightfield uses the same split (verified by tests).
    return v >= u ? h00 + v * (h01 - h00) + u * (h11 - h01) : h00 + u * (h10 - h00) + v * (h11 - h10);
  }
  normalAt(x: number, z: number): V3 {
    const e = 1.5;
    const gx = (this.heightAt(x + e, z) - this.heightAt(x - e, z)) / (2 * e);
    const gz = (this.heightAt(x, z + e) - this.heightAt(x, z - e)) / (2 * e);
    const l = Math.hypot(gx, 1, gz);
    return { x: -gx / l, y: 1 / l, z: -gz / l };
  }
  surfaceAt(x: number, z: number): Surface {
    if (this.heightAt(x, z) < -0.12) return 'water';
    const i = clamp(Math.floor(x / SMAP_CELL), 0, SMAP_W - 1), j = clamp(Math.floor(z / SMAP_CELL), 0, SMAP_D - 1);
    return SURFACE_BY_CODE[this.surfaceMap[i + j * SMAP_W]];
  }

  // ---------------------------------------------------------------- roads
  private addNode(x: number, z: number, y: number | null, grid: boolean): number {
    const id = this.nodes.length;
    this.nodes.push({ id, x, z, y: y ?? this.heightAt(x, z), edges: [], grid, signal: false, clear: 0 });
    return id;
  }
  private addEdge(a: number, b: number, cls: RoadClass): number {
    const na = this.nodes[a], nb = this.nodes[b];
    const len = Math.hypot(nb.x - na.x, nb.z - na.z);
    const info = ROAD_CLASSES[cls];
    const id = this.edges.length;
    this.edges.push({ id, a, b, cls, info, hw: info.hw, len, dx: (nb.x - na.x) / len, dz: (nb.z - na.z) / len, structure: info.structure, ya: na.y, yb: nb.y });
    na.edges.push(id);
    nb.edges.push(id);
    return id;
  }

  private buildRoads(): void {
    for (let r = 0; r < ROWS.length; r++) {
      this.gridNode.push([]);
      for (let c = 0; c < COLS.length; c++) {
        const jx = (hash2(r * 31 + 7, c * 17 + 3) - 0.5) * 18;
        const jz = r === 0 ? 0 : (hash2(r * 13 + 101, c * 29 + 11) - 0.5) * 18;
        this.gridNode[r].push(this.addNode(COLS[c] + jx, ROWS[r] + jz, null, true));
      }
    }
    const G = this.gridNode;
    // Highline spline nodes.
    const pts = HIGHLINE_PTS.map((p) => [...p] as [number, number, number]);
    const start = this.nodes[G[5][5]];
    pts[0] = [start.x, start.z, start.y];
    const hlEnd = this.addNode(pts[pts.length - 1][0], ROWS[0], null, true);
    pts[pts.length - 1][2] = this.nodes[hlEnd].y;
    pts[pts.length - 2][2] = this.heightAt(pts[pts.length - 2][0], pts[pts.length - 2][1]) + 0.25;
    const SUB = 3;
    const cr = (p0: number, p1: number, p2: number, p3: number, t: number) =>
      0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
    let prev = G[5][5];
    let offRampNode = -1;
    for (let s = 0; s < pts.length - 1; s++) {
      const p0 = pts[Math.max(0, s - 1)], p1 = pts[s], p2 = pts[s + 1], p3 = pts[Math.min(pts.length - 1, s + 2)];
      for (let k = 1; k <= SUB; k++) {
        const t = k / SUB;
        let id: number;
        if (s === pts.length - 2 && k === SUB) id = hlEnd;
        else {
          const y = k === SUB ? p2[2] : lerp(p1[2], p2[2], t); // linear deck profile between control points
          id = this.addNode(cr(p0[0], p1[0], p2[0], p3[0], t), cr(p0[1], p1[1], p2[1], p3[1], t), y, false);
        }
        this.addEdge(prev, id, 'highline');
        if (k === SUB && Math.hypot(p2[0] - HIGHLINE_OFFRAMP_FROM[0], p2[1] - HIGHLINE_OFFRAMP_FROM[1]) < 1) offRampNode = id;
        prev = id;
      }
    }
    // Grid edges.
    for (let r = 0; r < ROWS.length; r++) {
      for (let c = 0; c < COLS.length; c++) {
        if (c < COLS.length - 1 && !REMOVED_EDGES.has(`h ${r} ${c}`)) {
          const cls = gridClass('h', r, c);
          if (r === 0 && c === 8) {
            this.addEdge(G[0][8], hlEnd, cls);
            this.addEdge(hlEnd, G[0][9], cls);
          } else this.addEdge(G[r][c], G[r][c + 1], cls);
        }
        if (r < ROWS.length - 1 && !REMOVED_EDGES.has(`v ${r} ${c}`)) {
          const cls = gridClass('v', r, c);
          if (r === 2 && CANAL_BRIDGE_COLS.includes(c)) {
            const a = this.nodes[G[2][c]], b = this.nodes[G[3][c]];
            const xAt = (z: number) => lerp(a.x, b.x, (z - a.z) / (b.z - a.z));
            const s = this.addNode(xAt(CANAL_Z - 15), CANAL_Z - 15, null, false);
            const n = this.addNode(xAt(CANAL_Z + 15), CANAL_Z + 15, null, false);
            this.addEdge(G[2][c], s, cls);
            this.addEdge(s, n, 'bridge');
            this.addEdge(n, G[3][c], cls);
          } else this.addEdge(G[r][c], G[r + 1][c], cls);
        }
      }
    }
    if (offRampNode >= 0) this.addEdge(offRampNode, G[3][9], 'ramp');
    // Intersection clearances and signals.
    for (const n of this.nodes) {
      const es = n.edges.map((e) => this.edges[e]);
      const maxHw = Math.max(...es.map((e) => e.hw));
      if (es.length === 2) {
        const d0 = this.dirFrom(es[0], n.id), d1 = this.dirFrom(es[1], n.id);
        const straight = d0.x * d1.x + d0.z * d1.z < -0.75;
        n.clear = straight ? 0 : maxHw + 1.5;
      } else n.clear = es.length >= 3 ? maxHw + 1.5 : 0;
      n.signal = es.length >= 3;
    }
  }
  /** Unit direction of edge `e` pointing away from node `nodeId`. */
  dirFrom(e: RoadEdge, nodeId: number): { x: number; z: number } {
    return e.a === nodeId ? { x: e.dx, z: e.dz } : { x: -e.dx, z: -e.dz };
  }
  edgePoint(e: RoadEdge, t: number): { x: number; z: number } {
    const a = this.nodes[e.a];
    return { x: a.x + e.dx * e.len * t, z: a.z + e.dz * e.len * t };
  }
  edgeY(e: RoadEdge, t: number): number {
    if (e.structure) return lerp(e.ya, e.yb, t);
    const p = this.edgePoint(e, t);
    return this.heightAt(p.x, p.z);
  }
  /** Road surface height under a point that is known to be on/near edge e. */
  roadY(e: RoadEdge, x: number, z: number, t: number): number {
    return e.structure ? lerp(e.ya, e.yb, t) : this.heightAt(x, z);
  }

  nearestEdge(x: number, z: number, y?: number, groundOnly = false): EdgeLoc {
    let best: EdgeLoc = { edge: 0, t: 0, dist: Infinity };
    for (const e of this.edges) {
      if (groundOnly && e.structure) continue;
      const a = this.nodes[e.a], b = this.nodes[e.b];
      const [d, t] = distToSeg(x, z, a.x, a.z, b.x, b.z);
      let eff = d;
      if (y !== undefined) eff += 3 * Math.max(0, Math.abs(y - this.edgeY(e, t)) - 1.5);
      if (eff < best.dist) best = { edge: e.id, t, dist: eff };
    }
    return best;
  }

  // ---------------------------------------------------------------- navigation
  private buildNav(): void {
    const n = this.nodes.length;
    const D = new Float32Array(n * n).fill(Infinity);
    const X = new Int16Array(n * n).fill(-1);
    for (let i = 0; i < n; i++) { D[i * n + i] = 0; X[i * n + i] = i; }
    for (const e of this.edges) {
      // Wide/fast roads are slightly "shorter" for route guidance so the arrow prefers avenues.
      D[e.a * n + e.b] = e.len; D[e.b * n + e.a] = e.len;
      X[e.a * n + e.b] = e.b; X[e.b * n + e.a] = e.a;
    }
    for (let k = 0; k < n; k++) {
      for (let i = 0; i < n; i++) {
        const dik = D[i * n + k];
        if (dik === Infinity) continue;
        for (let j = 0; j < n; j++) {
          const nd = dik + D[k * n + j];
          if (nd < D[i * n + j]) { D[i * n + j] = nd; X[i * n + j] = X[i * n + k]; }
        }
      }
    }
    this.navDist = D;
    this.navNext = X;
  }
  nodeDist(a: number, b: number): number {
    return this.navDist[a * this.nodes.length + b];
  }
  /** Shortest legal-road distance and node chain between two edge locations. */
  route(from: { edge: number; t: number }, to: { edge: number; t: number }): { dist: number; nodes: number[] } {
    const ea = this.edges[from.edge], eb = this.edges[to.edge];
    if (from.edge === to.edge) return { dist: Math.abs(from.t - to.t) * ea.len, nodes: [] };
    let best = Infinity, bs = -1, be = -1;
    const starts: [number, number][] = [[ea.a, from.t * ea.len], [ea.b, (1 - from.t) * ea.len]];
    const ends: [number, number][] = [[eb.a, to.t * eb.len], [eb.b, (1 - to.t) * eb.len]];
    for (const [s, ds] of starts) for (const [e, de] of ends) {
      const d = ds + this.nodeDist(s, e) + de;
      if (d < best) { best = d; bs = s; be = e; }
    }
    const nodes: number[] = [];
    if (bs >= 0 && best < Infinity) {
      let cur = bs;
      nodes.push(cur);
      const n = this.nodes.length;
      let guard = 0;
      while (cur !== be && guard++ < 400) { cur = this.navNext[cur * n + be]; nodes.push(cur); }
    }
    return { dist: best, nodes };
  }
  /** Route as a 3D polyline including the exact start and end points. */
  routePolyline(from: EdgeLoc | { edge: number; t: number }, to: { edge: number; t: number }, start?: V3, end?: V3): { dist: number; pts: V3[] } {
    const r = this.route(from, to);
    const pts: V3[] = [];
    const locPt = (l: { edge: number; t: number }): V3 => {
      const e = this.edges[l.edge];
      const p = this.edgePoint(e, l.t);
      return { x: p.x, y: this.edgeY(e, l.t), z: p.z };
    };
    pts.push(start ?? locPt(from));
    for (const id of r.nodes) pts.push({ x: this.nodes[id].x, y: this.nodes[id].y, z: this.nodes[id].z });
    pts.push(end ?? locPt(to));
    return { dist: r.dist, pts };
  }

  // ---------------------------------------------------------------- shortcuts & sites
  private buildShortcuts(): void {
    SHORTCUT_DEFS.forEach((d, index) => {
      let [ax, az] = d.a, [bx, bz] = d.b;
      if (d.nodeA) { const n = this.nodes[this.gridNode[d.nodeA[0]][d.nodeA[1]]]; ax = n.x; az = n.z; }
      if (d.nodeB) { const n = this.nodes[this.gridNode[d.nodeB[0]][d.nodeB[1]]]; bx = n.x; bz = n.z; }
      this.shortcuts.push({
        id: d.id, index, name: d.name, kind: d.kind, ax, az, bx, bz,
        ay: d.ya ?? this.heightAt(ax, az), by: d.yb ?? this.heightAt(bx, bz),
        width: d.width, surface: d.surface, oneWay: !!d.oneWay, corridor: !d.noCorridor,
        len: Math.hypot(bx - ax, bz - az),
      });
    });
  }

  private buildSites(): void {
    SITE_DEFS.forEach((d, id) => {
      let best = Infinity, be: RoadEdge | null = null, bt = 0;
      for (const e of this.edges) {
        if (e.structure || e.len < 70) continue;
        const a = this.nodes[e.a], b = this.nodes[e.b];
        const lo = 26 / e.len, hi = 1 - 26 / e.len;
        let t = ((d.x - a.x) * e.dx + (d.z - a.z) * e.dz) / e.len;
        t = clamp(t, lo, hi);
        const dist = Math.hypot(d.x - (a.x + (b.x - a.x) * t), d.z - (a.z + (b.z - a.z) * t));
        if (dist < best) { best = dist; be = e; bt = t; }
      }
      const e = be!;
      const p = this.edgePoint(e, bt);
      const rx = e.dz, rz = -e.dx; // right-hand side of a->b
      const side = (d.x - p.x) * rx + (d.z - p.z) * rz >= 0 ? 1 : -1;
      const at = (off: number) => ({ x: p.x + rx * side * off, z: p.z + rz * side * off });
      const ring = at(e.hw - 3.6), stand = at(e.hw + 2.4), lm = at(e.hw + 6.5 + d.r);
      this.sites.push({
        id, name: d.name, kind: d.kind, hue: d.hue, r: d.r, edge: e.id, t: bt, side,
        x: ring.x, z: ring.z, y: this.heightAt(ring.x, ring.z),
        sx: stand.x, sz: stand.z, sy: this.heightAt(stand.x, stand.z),
        lx: lm.x, lz: lm.z, ly: this.heightAt(lm.x, lm.z),
        district: districtAt(p.x, p.z),
      });
    });
  }

  // ---------------------------------------------------------------- surface map
  private paintSeg(ax: number, az: number, bx: number, bz: number, radius: number, code: number, only?: number): void {
    const i0 = clamp(Math.floor((Math.min(ax, bx) - radius) / SMAP_CELL), 0, SMAP_W - 1);
    const i1 = clamp(Math.ceil((Math.max(ax, bx) + radius) / SMAP_CELL), 0, SMAP_W - 1);
    const j0 = clamp(Math.floor((Math.min(az, bz) - radius) / SMAP_CELL), 0, SMAP_D - 1);
    const j1 = clamp(Math.ceil((Math.max(az, bz) + radius) / SMAP_CELL), 0, SMAP_D - 1);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const [d] = distToSeg((i + 0.5) * SMAP_CELL, (j + 0.5) * SMAP_CELL, ax, az, bx, bz);
      if (d <= radius) {
        const k = i + j * SMAP_W;
        if (only === undefined || this.surfaceMap[k] === only) this.surfaceMap[k] = code;
      }
    }
  }
  private buildSurfaceMap(): void {
    const S = SURFACES;
    for (let j = 0; j < SMAP_D; j++) for (let i = 0; i < SMAP_W; i++) {
      const x = (i + 0.5) * SMAP_CELL, z = (j + 0.5) * SMAP_CELL;
      let code = S.grass.code;
      if (z < 141) code = x < 800 ? S.paving.code : S.sand.code;
      if (x > PLAZA_RECT.x0 - 8 && x < PLAZA_RECT.x1 + 8 && z > PLAZA_RECT.z0 - 8 && z < PLAZA_RECT.z1 + 8) code = S.paving.code;
      this.surfaceMap[i + j * SMAP_W] = code;
    }
    for (const e of this.edges) {
      if (e.structure) continue;
      const a = this.nodes[e.a], b = this.nodes[e.b];
      this.paintSeg(a.x, a.z, b.x, b.z, e.hw + SIDEWALK + 1.5, S.paving.code);
    }
    for (const s of this.shortcuts) if (s.corridor) this.paintSeg(s.ax, s.az, s.bx, s.bz, s.width / 2, S[s.surface].code);
    for (const e of this.edges) {
      if (e.structure) continue;
      const a = this.nodes[e.a], b = this.nodes[e.b];
      this.paintSeg(a.x, a.z, b.x, b.z, e.hw, S[e.info.surface].code);
    }
  }

  // ---------------------------------------------------------------- structures
  private pushBox(b: Partial<Box> & { x: number; y: number; z: number; hx: number; hy: number; hz: number; kind: Box['kind'] }): void {
    this.boxes.push({ q: quatYaw(0), surface: 'asphalt', tint: 0, collide: true, ...b });
  }
  private buildStructures(): void {
    const railGap = this.shortcuts.find((s) => s.id === 'highline-drop')!;
    for (const e of this.edges) {
      if (!e.structure) continue;
      const a = this.nodes[e.a], b = this.nodes[e.b];
      const dir = { x: b.x - a.x, y: e.yb - e.ya, z: b.z - a.z };
      const l3 = Math.hypot(dir.x, dir.y, dir.z);
      const q = quatLookDir(dir);
      const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, my = (e.ya + e.yb) / 2;
      const thick = 0.55;
      this.pushBox({ x: mx, y: my - thick, z: mz, hx: e.hw + 0.4, hy: thick, hz: l3 / 2 + 0.9, q, kind: 'deck', surface: 'asphalt' });
      // Rails: 6 m pieces along both sides, skipped at junctions, at grade and at authored gaps.
      const pieces = Math.max(1, Math.round(e.len / 6));
      for (const side of [-1, 1]) {
        for (let i = 0; i < pieces; i++) {
          const t = (i + 0.5) / pieces;
          const px = a.x + e.dx * e.len * t + e.dz * side * (e.hw + 0.15);
          const pz = a.z + e.dz * e.len * t - e.dx * side * (e.hw + 0.15);
          const py = lerp(e.ya, e.yb, t);
          if (py - this.heightAt(px, pz) < 0.9) continue;
          let blocked = false;
          for (const nid of [e.a, e.b]) for (const oid of this.nodes[nid].edges) {
            if (oid === e.id) continue;
            const o = this.edges[oid];
            const [d] = distToSeg(px, pz, this.nodes[o.a].x, this.nodes[o.a].z, this.nodes[o.b].x, this.nodes[o.b].z);
            if (d < o.hw + 0.35) blocked = true;
          }
          if (Math.hypot(px - railGap.ax, pz - railGap.az) < 13 && px < railGap.ax) blocked = true;
          if (blocked) continue;
          this.pushBox({ x: px, y: py + 0.55, z: pz, hx: 0.22, hy: 0.6, hz: e.len / pieces / 2 + 0.05, q, kind: 'rail', tint: e.cls === 'highline' ? 1 : 0 });
        }
      }
      // Pillars under elevated decks.
      const np = Math.floor(e.len / 34);
      for (let i = 0; i <= np; i++) {
        const t = np === 0 ? 0.5 : (i + 0.5) / (np + 1);
        const px = a.x + e.dx * e.len * t, pz = a.z + e.dz * e.len * t;
        const top = lerp(e.ya, e.yb, t) - thick * 2;
        const ground = this.heightAt(px, pz);
        if (top - ground < 2.6) continue;
        if (this.nearRoad(px, pz, 3.2, true) || this.nearCorridor(px, pz, 3)) continue;
        const base = Math.min(ground, 0) - 1.5;
        this.pushBox({ x: px, y: (top + base) / 2, z: pz, hx: 1.3, hy: (top - base) / 2, hz: 1.3, q: quatYaw(Math.atan2(e.dx, e.dz)), kind: 'pillar' });
      }
    }
    // Garage Drop deck.
    {
      const g = GARAGE_DECK;
      const y0 = this.heightAt(g.x0, g.z) + 0.12, y1 = y0 - g.drop;
      const dir = { x: g.x1 - g.x0, y: y1 - y0, z: 0 };
      const l3 = Math.hypot(dir.x, dir.y);
      const q = quatLookDir(dir);
      const mx = (g.x0 + g.x1) / 2, my = (y0 + y1) / 2;
      this.pushBox({ x: mx, y: my - 0.4, z: g.z, hx: g.hw, hy: 0.4, hz: l3 / 2, q, kind: 'garage', surface: 'deck' });
      for (const side of [-1, 1]) this.pushBox({ x: mx, y: my + 0.45, z: g.z + side * (g.hw - 0.2), hx: 0.2, hy: 0.5, hz: l3 / 2, q, kind: 'rail', tint: 2 });
      for (const t of [0.45, 0.9]) {
        const px = lerp(g.x0, g.x1, t), top = lerp(y0, y1, t) - 0.8, ground = this.heightAt(px, g.z);
        if (top - ground > 1) for (const side of [-1, 1]) this.pushBox({ x: px, y: (top + ground - 1) / 2, z: g.z + side * (g.hw - 1.2), hx: 0.6, hy: (top - ground + 1) / 2, hz: 0.6, kind: 'pillar' });
      }
    }
    // Tunnel / arcade walls and roofs along roofed corridors.
    for (const s of this.shortcuts) {
      if (s.kind !== 'tunnel' && s.kind !== 'arcade') continue;
      const dx = (s.bx - s.ax) / s.len, dz = (s.bz - s.az) / s.len;
      const t0 = 0.14, t1 = 0.86;
      const cx = lerp(s.ax, s.bx, 0.5), cz = lerp(s.az, s.bz, 0.5);
      const hl = (s.len * (t1 - t0)) / 2;
      const y = Math.max(this.heightAt(s.ax, s.az), this.heightAt(s.bx, s.bz), this.heightAt(cx, cz));
      const q = quatYaw(Math.atan2(dx, dz));
      const wallH = 5.2;
      for (const side of [-1, 1]) {
        const off = s.width / 2 + 0.5;
        this.pushBox({ x: cx + dz * side * off, y: y + wallH / 2 - 1.5, z: cz - dx * side * off, hx: 0.5, hy: wallH / 2 + 1.5, hz: hl, q, kind: 'wall', tint: s.kind === 'arcade' ? 1 : 0 });
      }
      this.pushBox({ x: cx, y: y + wallH + 0.3, z: cz, hx: s.width / 2 + 1, hy: 0.3, hz: hl, q, kind: 'roof', tint: s.kind === 'arcade' ? 1 : 0, collide: false });
    }
    // Harbor containers on the container pier and apron.
    const rng = new Rng(4411);
    const placeContainer = (x: number, z: number, yaw: number, stack: number) => {
      for (let k = 0; k < stack; k++) this.pushBox({ x, y: 3 + 1.3 + k * 2.6, z, hx: 1.25, hy: 1.3, hz: 6, q: quatYaw(yaw), kind: 'container', tint: rng.int(6) });
    };
    for (let x = 392; x < 500; x += 15) {
      placeContainer(x, 46, Math.PI / 2, 1 + rng.int(3));
      placeContainer(x + 2, 51.5, Math.PI / 2, 1 + rng.int(2));
      if (rng.chance(0.8)) placeContainer(x, 90, Math.PI / 2, 1 + rng.int(3));
    }
    for (let z = 44; z < 96; z += 14) if (Math.abs(z - 70) > 12) placeContainer(683, z, 0, 1 + rng.int(2));
    for (let x = 356; x < 392; x += 5) placeContainer(x, 121, 0, 1 + rng.int(2));
  }

  private nearRoad(x: number, z: number, margin: number, groundOnly: boolean, skip = -1): boolean {
    for (const e of this.edges) {
      if (e.id === skip || (groundOnly && e.structure)) continue;
      const a = this.nodes[e.a], b = this.nodes[e.b];
      if (distToSeg(x, z, a.x, a.z, b.x, b.z)[0] < e.hw + margin) return true;
    }
    return false;
  }
  private nearCorridor(x: number, z: number, margin: number): boolean {
    for (const s of this.shortcuts) if (s.corridor && distToSeg(x, z, s.ax, s.az, s.bx, s.bz)[0] < s.width / 2 + margin) return true;
    return false;
  }

  private buildRamps(): void {
    for (const def of RAMP_DEFS) {
      const dx = Math.sin(def.yaw), dz = Math.cos(def.yaw), rx = dz, rz = -dx;
      const hl = def.len / 2, hw = def.width / 2;
      const pt = (along: number, side: number, y: number | null, yOff = 0): number[] => {
        const x = def.x + dx * along + rx * side, z = def.z + dz * along + rz * side;
        return [x, (y ?? Math.max(this.heightAt(x, z), -0.5)) + yOff, z];
      };
      const baseY = this.heightAt(def.x - dx * hl, def.z - dz * hl);
      const pts: number[] = [];
      if (def.twoWay) {
        const top = Math.max(baseY, this.heightAt(def.x, def.z)) + def.h;
        pts.push(...pt(-hl, -hw, null, -0.25), ...pt(-hl, hw, null, -0.25), ...pt(hl, -hw, null, -0.25), ...pt(hl, hw, null, -0.25), ...pt(0, -hw, top), ...pt(0, hw, top));
        this.ramps.push({ def, pts, topY: top });
      } else {
        const top = baseY + def.h;
        pts.push(...pt(-hl, -hw, null, -0.25), ...pt(-hl, hw, null, -0.25), ...pt(hl, -hw, baseY - 1.2), ...pt(hl, hw, baseY - 1.2), ...pt(hl, -hw, top), ...pt(hl, hw, top));
        this.ramps.push({ def, pts, topY: top });
      }
    }
  }

  // ---------------------------------------------------------------- buildings
  private obbCorners(b: { x: number; z: number; yaw: number; hx: number; hz: number }): [number, number][] {
    const s = Math.sin(b.yaw), c = Math.cos(b.yaw);
    const out: [number, number][] = [];
    for (const [lx, lz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) out.push([b.x + c * lx * b.hx + s * lz * b.hz, b.z - s * lx * b.hx + c * lz * b.hz]);
    return out;
  }
  private toLocal(b: { x: number; z: number; yaw: number }, px: number, pz: number): [number, number] {
    const s = Math.sin(b.yaw), c = Math.cos(b.yaw);
    const dx = px - b.x, dz = pz - b.z;
    return [dx * c - dz * s, dx * s + dz * c];
  }
  private segHitsObb(ax: number, az: number, bx: number, bz: number, b: { x: number; z: number; yaw: number; hx: number; hz: number }, margin: number): boolean {
    const [x0, z0] = this.toLocal(b, ax, az), [x1, z1] = this.toLocal(b, bx, bz);
    const ex = b.hx + margin, ez = b.hz + margin;
    let t0 = 0, t1 = 1;
    const dx = x1 - x0, dz = z1 - z0;
    for (const [p, d, e] of [[x0, dx, ex], [z0, dz, ez]]) {
      if (Math.abs(d) < 1e-9) { if (Math.abs(p) > e) return false; } else {
        let ta = (-e - p) / d, tb = (e - p) / d;
        if (ta > tb) [ta, tb] = [tb, ta];
        t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
        if (t0 > t1) return false;
      }
    }
    return true;
  }
  private obbOverlap(a: Building, b: { x: number; z: number; yaw: number; hx: number; hz: number }, margin: number): boolean {
    if (Math.hypot(a.x - b.x, a.z - b.z) > Math.hypot(a.hx, a.hz) + Math.hypot(b.hx, b.hz) + margin) return false;
    const ca = this.obbCorners(a), cb = this.obbCorners(b);
    for (const yaw of [a.yaw, b.yaw]) {
      for (const [axx, axz] of [[Math.cos(yaw), -Math.sin(yaw)], [Math.sin(yaw), Math.cos(yaw)]]) {
        let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
        for (const [x, z] of ca) { const p = x * axx + z * axz; a0 = Math.min(a0, p); a1 = Math.max(a1, p); }
        for (const [x, z] of cb) { const p = x * axx + z * axz; b0 = Math.min(b0, p); b1 = Math.max(b1, p); }
        if (a1 + margin < b0 || b1 + margin < a0) return false;
      }
    }
    return true;
  }
  pointInBuilding(x: number, z: number, margin: number): boolean {
    for (const b of this.buildings) {
      if (Math.abs(x - b.x) > 40 || Math.abs(z - b.z) > 40) continue;
      const [lx, lz] = this.toLocal(b, x, z);
      if (Math.abs(lx) < b.hx + margin && Math.abs(lz) < b.hz + margin) return true;
    }
    return false;
  }

  private buildBuildings(): void {
    const rng = new Rng(90210);
    const heightRange: Record<District, [number, number]> = {
      harbor: [7, 15], beach: [15, 36], oldsteps: [8, 15], civic: [13, 28], lantern: [11, 23], highline: [18, 46],
    };
    const widthRange: Record<District, [number, number]> = {
      harbor: [22, 34], beach: [18, 30], oldsteps: [10, 17], civic: [16, 28], lantern: [13, 22], highline: [18, 28],
    };
    const park = { x0: 640, x1: 760, z0: 282, z1: 498 };
    for (const e of this.edges) {
      if (e.structure) continue;
      const na = this.nodes[e.a], nb = this.nodes[e.b];
      for (const side of [-1, 1]) {
        let s = Math.max(na.clear, 9) + 3;
        const sEnd = e.len - Math.max(nb.clear, 9) - 3;
        while (s < sEnd - 9) {
          const mid = this.edgePoint(e, (s + 6) / e.len);
          const district = districtAt(mid.x, mid.z);
          const [w0, w1] = widthRange[district];
          let w = rng.range(w0, w1);
          if (s + w > sEnd) w = sEnd - s;
          if (w < 9) break;
          const depth = rng.range(13, 21);
          const t = (s + w / 2) / e.len;
          const p = this.edgePoint(e, t);
          const off = e.hw + SIDEWALK + depth / 2;
          const b: Building = {
            x: p.x + e.dz * side * off, z: p.z - e.dx * side * off, yaw: Math.atan2(e.dx, e.dz),
            hx: depth / 2, hz: w / 2 - 0.4, y0: 0, y1: 0, district, tint: rng.next(), seed: rng.int(1 << 20), front: -side,
          };
          const gap = rng.chance(0.2) ? rng.range(3, 6) : 0;
          s += w + gap;
          if (!this.lotIsFree(b, e, park)) continue;
          const [h0, h1] = heightRange[district];
          let h = rng.range(h0, h1);
          if (rng.chance(0.12)) h *= 1.35;
          const cs = this.obbCorners(b);
          let lo = this.heightAt(b.x, b.z), hi = lo;
          for (const [x, z] of cs) { const y = this.heightAt(x, z); lo = Math.min(lo, y); hi = Math.max(hi, y); }
          b.y0 = lo - 1.5;
          b.y1 = hi + h;
          this.buildings.push(b);
        }
      }
    }
  }
  private lotIsFree(b: Building, own: RoadEdge, park: { x0: number; x1: number; z0: number; z1: number }): boolean {
    if (b.z < 141 || b.x < 34 || b.x > WORLD_W - 34 || b.z > WORLD_D - 34) return false;
    const cs = this.obbCorners(b);
    let lo = Infinity, hi = -Infinity;
    for (const [x, z] of [...cs, [b.x, b.z]]) {
      const y = this.heightAt(x, z);
      lo = Math.min(lo, y); hi = Math.max(hi, y);
      if (x < 30 || x > WORLD_W - 30 || z > WORLD_D - 30) return false;
    }
    if (lo < 2.4 || hi - lo > 11) return false;
    const inRect = (r: { x0: number; x1: number; z0: number; z1: number }) => b.x > r.x0 && b.x < r.x1 && b.z > r.z0 && b.z < r.z1;
    if (inRect(PLAZA_RECT) || inRect(park)) return false;
    for (const e of this.edges) {
      if (e.id === own.id) continue;
      const a = this.nodes[e.a], n = this.nodes[e.b];
      if (this.segHitsObb(a.x, a.z, n.x, n.z, b, e.hw + (e.structure ? 2.5 : 3.2))) return false;
    }
    for (const s of this.shortcuts) if (s.corridor && this.segHitsObb(s.ax, s.az, s.bx, s.bz, b, s.width / 2 + 1.4)) return false;
    for (const s of this.sites) {
      const [lx, lz] = this.toLocal(b, s.lx, s.lz);
      const cx = clamp(lx, -b.hx, b.hx), cz = clamp(lz, -b.hz, b.hz);
      if (Math.hypot(lx - cx, lz - cz) < s.r + 2.5) return false;
    }
    for (const r of this.ramps) if (Math.hypot(r.def.x - b.x, r.def.z - b.z) < 16 + Math.max(b.hx, b.hz)) return false;
    const g = GARAGE_DECK;
    if (this.segHitsObb(g.x0, g.z, g.x1 + 30, g.z, b, g.hw + 2)) return false;
    for (const o of this.buildings) if (this.obbOverlap(o, b, 0.6)) return false;
    return true;
  }

  // ---------------------------------------------------------------- props
  private buildProps(): void {
    const rng = new Rng(7781);
    // Street trees and lamps along roads.
    for (const e of this.edges) {
      if (e.structure) continue;
      const na = this.nodes[e.a], nb = this.nodes[e.b];
      const s0 = Math.max(na.clear, 8) + 4, s1 = e.len - Math.max(nb.clear, 8) - 4;
      const p0 = this.edgePoint(e, 0.5);
      const district = districtAt(p0.x, p0.z);
      const step = e.cls === 'boulevard' ? 19 : 27;
      let k = 0;
      for (let s = s0; s < s1; s += step, k++) {
        for (const side of [-1, 1]) {
          const p = this.edgePoint(e, s / e.len);
          const lamp = (k + (side > 0 ? 1 : 0)) % 3 === 0;
          const off = e.hw + (lamp ? 1.1 : 1.9);
          const x = p.x + e.dz * side * off, z = p.z - e.dx * side * off;
          const y = this.heightAt(x, z);
          if (y < 2.2 || this.nearCorridor(x, z, 2.5) || this.nearRoad(x, z, 0.6, true, e.id)) continue;
          let nearSite = false;
          for (const st of this.sites) if (Math.hypot(st.sx - x, st.sz - z) < 9) nearSite = true;
          if (nearSite) continue;
          if (lamp) this.props.push({ kind: 'lamp', x, y, z, s: 1, rot: Math.atan2(-e.dz * side, e.dx * side), tint: 0 });
          else if (e.cls !== 'narrow' || rng.chance(0.4)) {
            const palm = district === 'harbor' || district === 'beach' || e.cls === 'boulevard';
            this.props.push({ kind: palm ? 'palm' : 'tree', x, y, z, s: rng.range(0.85, 1.25), rot: rng.range(0, 6.28), tint: rng.next() });
          }
        }
      }
    }
    // Courtyard, park and hillside greenery.
    let placed = 0;
    for (let i = 0; i < 2600 && placed < 520; i++) {
      const x = rng.range(40, WORLD_W - 40), z = rng.range(150, WORLD_D - 40);
      if (this.surfaceAt(x, z) !== 'grass') continue;
      const y = this.heightAt(x, z);
      if (y < 2.5 || this.nearRoad(x, z, 6, true) || this.nearCorridor(x, z, 3.5) || this.pointInBuilding(x, z, 2.5)) continue;
      let bad = false;
      for (const st of this.sites) if (Math.hypot(st.lx - x, st.lz - z) < st.r + 4) bad = true;
      for (const b of this.boxes) if (b.kind === 'pillar' && Math.hypot(b.x - x, b.z - z) < 5) bad = true;
      if (bad) continue;
      const d = districtAt(x, z);
      this.props.push({ kind: d === 'beach' || (d === 'lantern' && rng.chance(0.5)) ? 'palm' : 'tree', x, y, z, s: rng.range(0.9, 1.6), rot: rng.range(0, 6.28), tint: rng.next() });
      placed++;
    }
    // Beach umbrellas.
    for (let i = 0; i < 260; i++) {
      const x = rng.range(815, WORLD_W - 40), z = rng.range(108, 136);
      const y = this.heightAt(x, z);
      if (y < 0.9 || this.nearCorridor(x, z, 2.5)) continue;
      let bad = false;
      for (const st of this.sites) if (Math.hypot(st.lx - x, st.lz - z) < st.r + 4 || Math.hypot(st.sx - x, st.sz - z) < 8) bad = true;
      for (const r of this.ramps) if (Math.hypot(r.def.x - x, r.def.z - z) < 14) bad = true;
      if (bad) continue;
      this.props.push({ kind: 'umbrella', x, y, z, s: rng.range(0.9, 1.2), rot: rng.range(0, 6.28), tint: rng.next() });
    }
    // Quay bollards mark the harbor edge.
    for (let x = 44; x < 800; x += 9) {
      const onPier = (x > 380 && x < 536) || (x > 560 && x < 690);
      if (!onPier) this.props.push({ kind: 'bollard', x, y: 3, z: 101.5, s: 1, rot: 0, tint: 0 });
    }
  }

  private buildHubs(): void {
    for (const h of HUB_DEFS) this.hubs.push({ name: h.name, pose: this.roadPose(h.x, h.z, undefined, 0.01) });
  }

  /** A safe pose on the nearest road lane, used for spawning and resets. */
  roadPose(x: number, z: number, y?: number, headingHint?: number): Pose {
    const loc = this.nearestEdge(x, z, y);
    const e = this.edges[loc.edge];
    const na = this.nodes[e.a], nb = this.nodes[e.b];
    const tMin = Math.min(0.45, (na.clear + 8) / e.len), tMax = Math.max(0.55, 1 - (nb.clear + 8) / e.len);
    const t = clamp(loc.t, tMin, tMax);
    const p = this.edgePoint(e, t);
    let yaw = Math.atan2(e.dx, e.dz);
    let dirSign = 1;
    if (headingHint !== undefined && Math.cos(headingHint - yaw) < 0) { yaw += Math.PI; dirSign = -1; }
    const off = e.info.laneOffsets[0] * dirSign;
    const px = p.x + e.dz * off, pz = p.z - e.dx * off;
    return { x: px, z: pz, y: this.roadY(e, px, pz, t), yaw };
  }

  /** Sanity metrics used by tests and the tools report. */
  stats(): Record<string, number> {
    return {
      nodes: this.nodes.length, edges: this.edges.length, buildings: this.buildings.length, boxes: this.boxes.length,
      sites: this.sites.length, shortcuts: this.shortcuts.length, ramps: this.ramps.length, props: this.props.length,
    };
  }
}

export { SIDEWALK, SMAP_CELL, clamp01, smooth };
