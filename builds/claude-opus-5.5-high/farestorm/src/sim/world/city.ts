// Galeport generator + world queries (height, surface, colliders, road graph, routing).
// Deterministic: the same seed always produces the same city.

import { clamp, dist, lerp, segDist, segT, smoothstep } from "../math";
import { hash01, Rng } from "../rng";
import {
  BEACH_GAPS, BEACH_WALL_Z, BOUNDS, CANAL, COLS, CRESTS, DESTINATIONS, INLET, OPEN_BLOCKS, QUAY_EDGE_Z, QUAY_Z,
  REMOVED_EDGES, REPAIR_ARCHES, ROWS, RUSH_LANES, SHORTCUTS,
} from "./layout";
import type {
  Building, Collider, CutRegion, Destination, District, EdgeKind, ItemSpawn, PickupSpot, Profile, PropSpawn,
  RoadEdge, RoadNode, Shortcut, Surface, TreeSpawn, Volume, Zone,
} from "./types";

export const WORLD_VERSION = 3;

export function districtAt(x: number, z: number): District {
  if (z < -150) return x < 0 ? "beach" : "harbor";
  if (x > 420) return "highline";
  if (z > 200 && x < 280) return "oldsteps";
  if (x < -290) return "lantern";
  return "civic";
}

/** Base terrain without authored volumes or cuts. */
export function baseTerrain(x: number, z: number): number {
  let h = 1.5 + 16 * smoothstep(-330, 430, z);
  h += 9 * smoothstep(120, 300, z) * (1 - smoothstep(60, 260, x));
  for (const c of CRESTS) {
    const dx = Math.abs(x - c.x);
    if (dx < c.span) {
      const dz = z - c.z;
      h += c.h * Math.exp(-(dz * dz) / (c.w * c.w)) * (1 - smoothstep(c.span * 0.55, c.span, dx));
    }
  }
  if (z < -352) {
    if (x < -4) {
      // Sunward Beach: sand slope into shallow water, then deep water.
      let s = lerp(1.5, -0.35, smoothstep(-356, -436, z));
      if (z < -446) s = lerp(-0.35, -4.5, smoothstep(-446, -468, z));
      // Dunes for the Dune Hop route.
      if (x > -392 && x < -140 && z > -398 && z < -374) {
        const k = Math.sin((x + 392) * (Math.PI / 42));
        const across = 1 - smoothstep(4, 12, Math.abs(z + 386));
        s += Math.max(0, k) ** 3 * 0.95 * across;
      }
      h = s;
    } else {
      const inInlet = x > INLET.minX && x < INLET.maxX && z < INLET.maxZ;
      const onQuay = z >= QUAY_EDGE_Z && !inInlet;
      h = onQuay ? 1.5 : -5;
    }
  }
  return h;
}

export function profileAt(p: Profile, u: number): number {
  let i = 0;
  for (let k = 0; k < p.length; k++) if (p[k][0] <= u) i = k;
  const a = p[i];
  const b = p[i + 1];
  if (!b || b[0] <= a[0]) return a[1];
  return lerp(a[1], b[1], (u - a[0]) / (b[0] - a[0]));
}

interface Grid<T> {
  size: number;
  cells: Map<number, T[]>;
}
function gkey(ix: number, iz: number): number {
  return (ix + 512) * 4096 + (iz + 512);
}
function gridAdd<T>(g: Grid<T>, minX: number, minZ: number, maxX: number, maxZ: number, item: T) {
  const x0 = Math.floor(minX / g.size), x1 = Math.floor(maxX / g.size);
  const z0 = Math.floor(minZ / g.size), z1 = Math.floor(maxZ / g.size);
  for (let ix = x0; ix <= x1; ix++)
    for (let iz = z0; iz <= z1; iz++) {
      const k = gkey(ix, iz);
      let arr = g.cells.get(k);
      if (!arr) g.cells.set(k, (arr = []));
      arr.push(item);
    }
}

export interface NearestEdge {
  edge: RoadEdge;
  t: number;
  dist: number;
  /** signed lateral offset: + means right of a->b direction */
  lateral: number;
}

export interface Route {
  points: [number, number][];
  length: number;
  nodes: number[];
}

export class World {
  readonly nodes: RoadNode[] = [];
  readonly edges: RoadEdge[] = [];
  readonly buildings: Building[] = [];
  readonly colliders: Collider[] = [];
  readonly volumes: Volume[] = [];
  readonly cuts: CutRegion[] = [];
  readonly shortcuts: Shortcut[] = [];
  readonly destinations: Destination[] = [];
  readonly pickups: PickupSpot[] = [];
  readonly zones: Zone[] = [];
  readonly items: ItemSpawn[] = [];
  readonly props: PropSpawn[] = [];
  readonly trees: TreeSpawn[] = [];
  readonly containers: { cx: number; cz: number; yaw: number; stack: number; color: [number, number, number] }[] = [];
  readonly rails: Collider[] = [];
  readonly hubs: { name: string; x: number; z: number; yaw: number }[] = [];
  readonly canalWaterY: number;
  private colGrid: Grid<Collider> = { size: 32, cells: new Map() };
  private edgeGrid: Grid<RoadEdge> = { size: 40, cells: new Map() };
  private nodeAt = new Map<string, number>();
  private corridorSurfaces: { sc: Shortcut; }[] = [];

  constructor(readonly seed = 1) {
    this.buildRoads();
    this.buildShortcuts();
    this.buildCuts();
    this.canalWaterY = baseTerrain(-500, 80) - 3.0;
    this.buildZones();
    this.buildDestinations();
    this.buildBuildings();
    this.buildHarbor();
    this.buildRails();
    this.buildBounds();
    this.buildTrees();
    this.buildPickups();
    this.buildItemsAndProps();
    this.buildHubs();
  }

  // ---------------------------------------------------------------- roads
  private addNode(x: number, z: number): number {
    const key = `${x},${z}`;
    const ex = this.nodeAt.get(key);
    if (ex !== undefined) return ex;
    const id = this.nodes.length;
    this.nodes.push({ id, x, z, edges: [], signal: false, signalOffset: 0 });
    this.nodeAt.set(key, id);
    return id;
  }
  nodeIdAt(x: number, z: number): number | undefined {
    return this.nodeAt.get(`${x},${z}`);
  }

  private addEdge(a: number, b: number, kind: EdgeKind, rush = false) {
    const A = this.nodes[a], B = this.nodes[b];
    const len = dist(A.x, A.z, B.x, B.z);
    const dx = (B.x - A.x) / len, dz = (B.z - A.z) / len;
    const spec = {
      street: { lanes: 1, laneWidth: 4.2, sidewalk: 3.5, speed: 14 },
      cobble: { lanes: 1, laneWidth: 3.8, sidewalk: 3.0, speed: 11 },
      boulevard: { lanes: 2, laneWidth: 4.0, sidewalk: 4.0, speed: 17 },
      highline: { lanes: 2, laneWidth: 4.25, sidewalk: 3.0, speed: 23 },
    }[kind];
    const e: RoadEdge = {
      id: this.edges.length, a, b, kind, lanes: spec.lanes, laneWidth: spec.laneWidth,
      halfWidth: spec.lanes * spec.laneWidth, sidewalk: spec.sidewalk, speed: spec.speed, length: len, dx, dz,
      district: districtAt((A.x + B.x) / 2, (A.z + B.z) / 2), rushLane: rush, axis: Math.abs(dx) > Math.abs(dz) ? 0 : 1,
    };
    this.edges.push(e);
    A.edges.push(e.id);
    B.edges.push(e.id);
    const pad = e.halfWidth + e.sidewalk + 4;
    gridAdd(this.edgeGrid, Math.min(A.x, B.x) - pad, Math.min(A.z, B.z) - pad, Math.max(A.x, B.x) + pad, Math.max(A.z, B.z) + pad, e);
  }

  private buildRoads() {
    const removed = new Set(REMOVED_EDGES.map((r) => r.join(",")));
    const rush = new Set(RUSH_LANES.map((r) => r.join(",")));
    const ids: number[][] = [];
    for (let c = 0; c < COLS.length; c++) {
      ids[c] = [];
      for (let r = 0; r < ROWS.length; r++) ids[c][r] = this.addNode(COLS[c], ROWS[r]);
    }
    const kindFor = (c: number, r: number, c2: number, r2: number): EdgeKind => {
      const x = (COLS[c] + COLS[c2]) / 2, z = (ROWS[r] + ROWS[r2]) / 2;
      if (c === c2 && COLS[c] === 620) return "highline";
      if (r === r2 && r === 0) return "boulevard";
      if (c === c2 && COLS[c] === 60) return "boulevard";
      if (z >= 250 && x <= 205) return "cobble";
      return "street";
    };
    for (let c = 0; c < COLS.length; c++)
      for (let r = 0; r < ROWS.length; r++) {
        if (c + 1 < COLS.length && !removed.has(`${c},${r},${c + 1},${r}`))
          this.addEdge(ids[c][r], ids[c + 1][r], kindFor(c, r, c + 1, r), rush.has(`${c},${r},${c + 1},${r}`));
        if (r + 1 < ROWS.length && !removed.has(`${c},${r},${c},${r + 1}`))
          this.addEdge(ids[c][r], ids[c][r + 1], kindFor(c, r, c, r + 1), rush.has(`${c},${r},${c},${r + 1}`));
      }
    // Quay road and harbor spurs.
    const quayCols = [60, 200, 340, 480, 620];
    const q: Record<number, number> = {};
    for (const x of quayCols) {
      q[x] = this.addNode(x, QUAY_Z);
      this.addEdge(this.nodeAt.get(`${x},${ROWS[0]}`)!, q[x], "street");
    }
    this.addEdge(q[60], q[200], "street");
    this.addEdge(q[200], q[340], "street");
    this.addEdge(q[480], q[620], "street");
    // Signals at busy junctions (not on the Highline, not in cobbled Old Steps).
    for (const n of this.nodes) {
      const kinds = n.edges.map((e) => this.edges[e].kind);
      n.signal = n.edges.length >= 3 && n.x !== 620 && !kinds.every((k) => k === "cobble") && n.z !== QUAY_Z;
      n.signalOffset = Math.floor(hash01(n.id, 7) * 4) * 5;
    }
  }

  // ---------------------------------------------------------------- shortcuts
  private buildShortcuts() {
    for (const d of SHORTCUTS) {
      const pts = d.points;
      const gate = (p0: [number, number], p1: [number, number]): [number, number, number, number] => {
        const len = dist(p0[0], p0[1], p1[0], p1[1]);
        const ux = (p1[0] - p0[0]) / len, uz = (p1[1] - p0[1]) / len;
        const inset = 11;
        const gx = p0[0] + ux * inset, gz = p0[1] + uz * inset;
        const hw = d.width / 2 + 2.5;
        return [gx - uz * hw, gz + ux * hw, gx + uz * hw, gz - ux * hw];
      };
      const sc: Shortcut = {
        id: d.id, name: d.name, district: d.district, kind: d.kind, points: pts, width: d.width, surface: d.surface,
        roofed: !!d.roofed, gateA: gate(pts[0], pts[1]), gateB: gate(pts[pts.length - 1], pts[pts.length - 2]), color: d.color,
      };
      this.shortcuts.push(sc);
      this.corridorSurfaces.push({ sc });
      for (const v of d.volumes ?? []) {
        const baseY = v.baseY ?? baseTerrain(v.center[0], v.center[1]);
        this.volumes.push({
          id: `${d.id}-${this.volumes.length}`, cx: v.center[0], cz: v.center[1], yaw: v.yaw, halfLen: v.halfLen, halfWid: v.halfWid,
          mode: v.mode, baseY, profile: v.profile, surface: v.surface, visual: v.visual,
        });
      }
    }
  }

  shortcutClearance(id: string): number {
    return SHORTCUTS.find((s) => s.id === id)?.clearance ?? 0;
  }

  private buildCuts() {
    const bridges = [-640, -500, -360];
    let x0 = CANAL.minX;
    for (const bx of bridges) {
      this.cuts.push({ minX: x0, maxX: bx - 9, minZ: CANAL.minZ, maxZ: CANAL.maxZ, depth: 4.5, waterDepth: 3.0 });
      x0 = bx + 9;
    }
    this.cuts.push({ minX: x0, maxX: CANAL.maxX, minZ: CANAL.minZ, maxZ: CANAL.maxZ, depth: 4.5, waterDepth: 3.0 });
  }

  private buildZones() {
    this.zones.push({ minX: BOUNDS.minX, maxX: -4, minZ: -520, maxZ: BEACH_WALL_Z, surface: "sand", kind: "beach" });
    this.zones.push({ minX: 4, maxX: BOUNDS.maxX, minZ: -520, maxZ: -352, surface: "pavement", kind: "quay" });
    for (const ob of OPEN_BLOCKS) {
      const [ci, ri] = ob.block;
      this.zones.push({ minX: COLS[ci], maxX: COLS[ci + 1], minZ: ROWS[ri], maxZ: ROWS[ri + 1], surface: ob.surface, kind: ob.kind });
    }
  }

  // ---------------------------------------------------------------- destinations
  private blockBounds(ci: number, ri: number): [number, number, number, number] {
    const x0 = COLS[ci], x1 = COLS[ci + 1];
    if (ri === -1) return [x0, x1, ci >= 5 ? QUAY_Z : -470, ROWS[0]];
    if (ri === -2) return [x0, x1, QUAY_EDGE_Z, QUAY_Z];
    return [x0, x1, ROWS[ri], ROWS[ri + 1]];
  }

  private buildDestinations() {
    DESTINATIONS.forEach((d, id) => {
      const [x0, x1, z0, z1] = this.blockBounds(d.block[0], d.block[1]);
      let rx: number, rz: number, lx: number, lz: number, facing: number;
      let ax: number, az: number, bx: number, bz: number;
      if (d.side === "N" || d.side === "S") {
        const roadZ = d.side === "N" ? z1 : z0;
        rx = lerp(x0, x1, d.t);
        ax = x0; bx = x1; az = bz = roadZ;
        rz = roadZ;
      } else {
        const roadX = d.side === "E" ? x1 : x0;
        rz = lerp(z0, z1, d.t);
        az = z0; bz = z1; ax = bx = roadX;
        rx = roadX;
      }
      const ne = this.nearestEdge(rx, rz)!;
      const e = ne.edge;
      const inward = { N: [0, -1], S: [0, 1], E: [-1, 0], W: [1, 0] }[d.side];
      const curb = e.halfWidth - e.laneWidth / 2;
      const ringX = rx + inward[0] * curb, ringZ = rz + inward[1] * curb;
      const setback = e.halfWidth + e.sidewalk + d.r + 2;
      lx = rx + inward[0] * setback;
      lz = rz + inward[1] * setback;
      facing = Math.atan2(-inward[0], -inward[1]);
      void ax; void az; void bx; void bz;
      this.destinations.push({
        id, name: d.name, district: d.district, landmark: d.landmark, color: d.color,
        x: ringX, z: ringZ, edge: e.id, lx, lz, lr: d.r, facing, scenic: !!d.scenic,
      });
    });
    // Landmark colliders
    for (const d of this.destinations) {
      const y0 = baseTerrain(d.lx, d.lz) - 2;
      const k = d.landmark === "ferris" ? 0.35 : d.landmark === "stadium" ? 0.92 : d.landmark === "lighthouse" || d.landmark === "mast" || d.landmark === "tower" ? 0.75 : 0.8;
      this.addCollider(d.lx, d.lz, d.lr * k, d.lr * k, 0, y0, y0 + 60, "landmark");
    }
  }

  // ---------------------------------------------------------------- buildings
  private rectRoadClear(minX: number, maxX: number, minZ: number, maxZ: number, pad: number): boolean {
    const cands = this.edgesNear((minX + maxX) / 2, (minZ + maxZ) / 2);
    for (const e of cands) {
      const A = this.nodes[e.a], B = this.nodes[e.b];
      const hw = e.halfWidth + e.sidewalk + pad;
      const sMinX = Math.min(A.x, B.x) - hw, sMaxX = Math.max(A.x, B.x) + hw;
      const sMinZ = Math.min(A.z, B.z) - hw, sMaxZ = Math.max(A.z, B.z) + hw;
      if (maxX > sMinX && minX < sMaxX && maxZ > sMinZ && minZ < sMaxZ) return false;
    }
    return true;
  }

  private rectNearCorridor(minX: number, maxX: number, minZ: number, maxZ: number): boolean {
    const samples: [number, number][] = [];
    for (let i = 0; i <= 2; i++) for (let j = 0; j <= 2; j++) samples.push([lerp(minX, maxX, i / 2), lerp(minZ, maxZ, j / 2)]);
    for (const sc of this.shortcuts) {
      const clear = sc.width / 2 + 3 + this.shortcutClearance(sc.id);
      for (let k = 0; k + 1 < sc.points.length; k++) {
        const [ax, az] = sc.points[k], [bx, bz] = sc.points[k + 1];
        for (const [x, z] of samples) if (segDist(x, z, ax, az, bx, bz) < clear) return true;
        // segment points inside rect
        for (let s = 0; s <= 20; s++) {
          const x = lerp(ax, bx, s / 20), z = lerp(az, bz, s / 20);
          if (x > minX - clear && x < maxX + clear && z > minZ - clear && z < maxZ + clear) {
            // distance from point to rect
            const dx = Math.max(minX - x, 0, x - maxX), dz = Math.max(minZ - z, 0, z - maxZ);
            if (Math.hypot(dx, dz) < clear) return true;
          }
        }
      }
    }
    return false;
  }

  private rectBlocked(minX: number, maxX: number, minZ: number, maxZ: number): boolean {
    for (const d of this.destinations) {
      const dx = Math.max(minX - d.lx, 0, d.lx - maxX), dz = Math.max(minZ - d.lz, 0, d.lz - maxZ);
      if (Math.hypot(dx, dz) < d.lr + 4) return true;
    }
    for (const c of this.cuts) if (maxX > c.minX - 5 && minX < c.maxX + 5 && maxZ > c.minZ - 5 && minZ < c.maxZ + 5) return true;
    for (const v of this.volumes) {
      const r = Math.max(v.halfLen, v.halfWid) + 4;
      if (maxX > v.cx - r && minX < v.cx + r && maxZ > v.cz - r && minZ < v.cz + r) {
        // precise-ish: check center distance to volume axis
        const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw);
        const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
        const hd = Math.hypot(maxX - minX, maxZ - minZ) / 2;
        if (segDist(cx, cz, v.cx - fx * v.halfLen, v.cz - fz * v.halfLen, v.cx + fx * v.halfLen, v.cz + fz * v.halfLen) < v.halfWid + hd + 4) return true;
      }
    }
    for (const z of this.zones) {
      if (z.kind === "beach" || z.kind === "quay") continue;
      if (maxX > z.minX && minX < z.maxX && maxZ > z.minZ && minZ < z.maxZ) return true;
    }
    if (this.rectNearCorridor(minX, maxX, minZ, maxZ)) return true;
    return false;
  }

  private buildBuildings() {
    const rng = new Rng(this.seed * 7919 + 11);
    const palettes: Record<District, [number, number, number][]> = {
      civic: [[0.95, 0.91, 0.82], [0.86, 0.93, 0.92], [0.98, 0.85, 0.74], [0.78, 0.88, 0.9], [0.93, 0.93, 0.95]],
      lantern: [[0.55, 0.32, 0.42], [0.34, 0.3, 0.48], [0.62, 0.38, 0.33], [0.4, 0.45, 0.55], [0.7, 0.52, 0.4]],
      oldsteps: [[0.98, 0.9, 0.76], [0.97, 0.8, 0.66], [0.94, 0.94, 0.86], [0.99, 0.74, 0.6], [0.88, 0.82, 0.7]],
      beach: [[1, 0.92, 0.85], [0.99, 0.82, 0.78], [0.85, 0.96, 0.95], [1, 0.95, 0.8], [0.92, 0.88, 1]],
      harbor: [[0.7, 0.74, 0.76], [0.82, 0.62, 0.48], [0.6, 0.68, 0.72], [0.86, 0.84, 0.78]],
      highline: [[0.62, 0.8, 0.86], [0.7, 0.76, 0.86], [0.85, 0.9, 0.93], [0.5, 0.68, 0.78]],
    };
    const heights: Record<District, [number, number]> = {
      civic: [16, 46], lantern: [11, 24], oldsteps: [7, 14], beach: [10, 30], harbor: [8, 14], highline: [22, 64],
    };
    for (let ci = 0; ci < COLS.length - 1; ci++)
      for (let ri = 0; ri < ROWS.length - 1; ri++) {
        const x0 = COLS[ci], x1 = COLS[ci + 1], z0 = ROWS[ri], z1 = ROWS[ri + 1];
        const step = 19;
        const nx = Math.floor((x1 - x0) / step), nz = Math.floor((z1 - z0) / step);
        const ox = x0 + ((x1 - x0) - nx * step) / 2, oz = z0 + ((z1 - z0) - nz * step) / 2;
        for (let i = 0; i < nx; i++)
          for (let j = 0; j < nz; j++) {
            const cx = ox + (i + 0.5) * step + rng.range(-1.2, 1.2);
            const cz = oz + (j + 0.5) * step + rng.range(-1.2, 1.2);
            const district = districtAt(cx, cz);
            // keep courtyards open: only lots near the block perimeter
            const edgeDist = Math.min(cx - x0, x1 - cx, cz - z0, z1 - cz);
            if (edgeDist > 40 && district !== "highline" && district !== "civic") continue;
            const sx = rng.range(12, 17.8), sz = rng.range(12, 17.8);
            const minX = cx - sx / 2, maxX = cx + sx / 2, minZ = cz - sz / 2, maxZ = cz + sz / 2;
            if (!this.rectRoadClear(minX, maxX, minZ, maxZ, 0.6)) continue;
            if (this.rectBlocked(minX, maxX, minZ, maxZ)) continue;
            const [h0, h1] = heights[district];
            let height = rng.range(h0, h1);
            if (district === "civic" && rng.chance(0.12)) height *= 1.5;
            if (edgeDist > 40) height *= 1.25;
            const baseY = Math.min(baseTerrain(minX, minZ), baseTerrain(maxX, minZ), baseTerrain(minX, maxZ), baseTerrain(maxX, maxZ)) - 1.5;
            const pal = palettes[district];
            const color = pal[rng.int(0, pal.length)];
            const roof: [number, number, number] = district === "oldsteps" || district === "beach" ? [0.86, 0.42, 0.3] : [0.42, 0.46, 0.5];
            this.buildings.push({
              minX, maxX, minZ, maxZ, baseY, height: height + 1.5, district, color, roof,
              neon: district === "lantern" || (district === "civic" && rng.chance(0.15)), style: rng.int(0, 4),
            });
            this.addCollider(cx, cz, sx / 2, sz / 2, 0, baseY, baseY + height + 4, "building");
          }
      }
  }

  private buildHarbor() {
    const rng = new Rng(this.seed * 31 + 5);
    const colors: [number, number, number][] = [[0.9, 0.3, 0.25], [0.15, 0.55, 0.75], [0.95, 0.62, 0.15], [0.2, 0.62, 0.45], [0.85, 0.85, 0.82], [0.55, 0.3, 0.6]];
    // Container stacks on the quay between the boulevard and the quay road, plus south of the quay road.
    const areas: [number, number, number, number][] = [
      [72, 188, -397, -356], [212, 328, -397, -356], [352, 384, -397, -356], [436, 468, -397, -356], [492, 608, -397, -356],
      [72, 188, -466, -414], [212, 328, -440, -414], [492, 540, -466, -414],
    ];
    for (const [x0, x1, z0, z1] of areas) {
      for (let x = x0 + 7; x < x1 - 6; x += 13.5)
        for (let z = z0 + 2.5; z < z1 - 1.5; z += 5.6) {
          if (rng.chance(0.28)) continue;
          const cx = x, cz = z;
          if (this.rectBlocked(cx - 6.2, cx + 6.2, cz - 1.4, cz + 1.4)) continue;
          if (!this.rectRoadClear(cx - 6.2, cx + 6.2, cz - 1.4, cz + 1.4, 0.5)) continue;
          const stack = 1 + rng.int(0, 3);
          this.containers.push({ cx, cz, yaw: Math.PI / 2, stack, color: colors[rng.int(0, colors.length)] });
          this.addCollider(cx, cz, 6.1, 1.3, 0, 1.5, 1.5 + stack * 2.6, "container");
        }
    }
  }

  private buildRails() {
    const rail = (x0: number, z0: number, x1: number, z1: number, y0: number, h = 1.1) => {
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      const len = dist(x0, z0, x1, z1);
      const yaw = Math.atan2(x1 - x0, z1 - z0);
      const c = this.addCollider(cx, cz, 0.35, len / 2, yaw, y0, y0 + h, "rail");
      this.rails.push(c);
    };
    // Canal railings with gaps at the canal-leap corridor.
    for (const cut of this.cuts) {
      for (const z of [cut.minZ - 0.4, cut.maxZ + 0.4]) {
        const y0 = baseTerrain(cut.minX, z);
        const segs: [number, number][] = [];
        if (cut.minX < -434 && cut.maxX > -426) {
          segs.push([cut.minX, -434.5], [-425.5, cut.maxX]);
        } else segs.push([cut.minX, cut.maxX]);
        for (const [a, b] of segs) if (b - a > 1) rail(a, z, b, z, y0);
      }
      // end caps
      if (cut.maxX === CANAL.maxX) rail(cut.maxX + 0.4, cut.minZ, cut.maxX + 0.4, cut.maxZ, baseTerrain(cut.maxX, 80));
    }
    // Quay edges (bollard rails) with gaps for the ferry ramps.
    const qy = 1.5;
    rail(8, QUAY_EDGE_Z + 0.4, INLET.minX - 0.5, QUAY_EDGE_Z + 0.4, qy);
    rail(INLET.maxX + 0.5, QUAY_EDGE_Z + 0.4, BOUNDS.maxX, QUAY_EDGE_Z + 0.4, qy);
    // Inlet sides with gaps for the seawall kicker (z ~ -405) and ferry deck (z ~ -460).
    for (const x of [INLET.minX - 0.4, INLET.maxX + 0.4]) {
      rail(x, INLET.maxZ, x, -410.5, qy);
      rail(x, -399.5, x, -366, qy);
      rail(x, -451, x, -410.5, qy);
      rail(x, QUAY_EDGE_Z, x, -469, qy);
    }
    rail(INLET.minX, INLET.maxZ + 0.4, INLET.maxX, INLET.maxZ + 0.4, qy);
    // Canal bridge parapets
    for (const bx of [-640, -500, -360]) {
      const y = baseTerrain(bx, 80);
      rail(bx - 9.3, CANAL.minZ - 1, bx - 9.3, CANAL.maxZ + 1, y, 1.0);
      rail(bx + 9.3, CANAL.minZ - 1, bx + 9.3, CANAL.maxZ + 1, y, 1.0);
    }
    // Ferry side rails
    rail(380, -469.3, 440, -469.3, 2.9, 1.2);
    rail(380, -450.7, 440, -450.7, 2.9, 1.2);
    // Garage + deck parapets
    for (const v of this.volumes) {
      if (v.visual !== "deck") continue;
      const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw);
      const rx = fz, rz = -fx;
      // find plateau portion from profile
      const pts = v.profile;
      let uStart = 1, uEnd = 0;
      for (const [u, h] of pts) if (h >= 2.5) { uStart = Math.min(uStart, u); uEnd = Math.max(uEnd, u); }
      if (uEnd <= uStart) continue;
      const a = -v.halfLen + uStart * 2 * v.halfLen, b = -v.halfLen + uEnd * 2 * v.halfLen;
      const hmin = Math.min(...pts.filter(([u]) => u >= uStart && u <= uEnd).map(([, h]) => h));
      for (const side of [-1, 1]) {
        const ox = rx * (v.halfWid + 0.3) * side, oz = rz * (v.halfWid + 0.3) * side;
        rail(v.cx + fx * a + ox, v.cz + fz * a + oz, v.cx + fx * b + ox, v.cz + fz * b + oz, v.baseY + hmin, 1.0);
      }
    }
  }

  private buildBounds() {
    const wall = (cx: number, cz: number, hx: number, hz: number) => this.addCollider(cx, cz, hx, hz, 0, -20, 80, "wall");
    wall(BOUNDS.minX - 4, -40, 4, 520);
    wall(BOUNDS.maxX + 4, -40, 4, 520);
    wall(0, BOUNDS.maxZ + 4, 720, 4);
    wall(0, BOUNDS.minZ - 4, 720, 4);
    // Breakwater between the beach and the harbor
    this.addCollider(0, -418, 4, 64, 0, -6, 3.6, "rock");
    // Beach promenade wall with gaps
    const gaps = [...BEACH_GAPS].sort((a, b) => a - b);
    let x0 = BOUNDS.minX;
    for (const g of gaps) {
      const a = x0, b = g - 6.5;
      if (b - a > 1) this.addCollider((a + b) / 2, BEACH_WALL_Z, (b - a) / 2, 0.45, 0, 0.8, 2.3, "wall");
      x0 = g + 6.5;
    }
    this.addCollider((x0 - 4) / 2, BEACH_WALL_Z, (-4 - x0) / 2, 0.45, 0, 0.8, 2.3, "wall");
  }

  private buildTrees() {
    const rng = new Rng(this.seed * 131 + 3);
    for (const e of this.edges) {
      const A = this.nodes[e.a];
      const along = e.kind === "boulevard" || e.kind === "highline" ? 22 : e.kind === "street" ? 34 : 0;
      if (!along) continue;
      for (let s = 20; s < e.length - 20; s += along) {
        for (const side of [-1, 1]) {
          if (rng.chance(0.3)) continue;
          const off = (e.halfWidth + e.sidewalk - 1.0) * side;
          const x = A.x + e.dx * s + e.dz * off, z = A.z + e.dz * s - e.dx * off;
          if (this.nearDestRing(x, z, 14) || this.pointNearCorridor(x, z, 3)) continue;
          const kind = e.district === "beach" || (e.district === "harbor" && A.z < -300) ? "palm" : e.district === "oldsteps" ? "cypress" : "round";
          this.trees.push({ x, z, kind, scale: rng.range(0.85, 1.2) });
        }
      }
    }
    for (const zn of this.zones) {
      if (zn.kind !== "park" && zn.kind !== "lawn") continue;
      for (let k = 0; k < 40; k++) {
        const x = rng.range(zn.minX + 14, zn.maxX - 14), z = rng.range(zn.minZ + 14, zn.maxZ - 14);
        if (this.pointNearCorridor(x, z, 4)) continue;
        let bad = false;
        for (const d of this.destinations) if (dist(x, z, d.lx, d.lz) < d.lr + 4) bad = true;
        for (const v of this.volumes) if (dist(x, z, v.cx, v.cz) < v.halfLen + 4) bad = true;
        if (bad) continue;
        this.trees.push({ x, z, kind: zn.kind === "lawn" ? "round" : rng.chance(0.5) ? "cypress" : "round", scale: rng.range(0.9, 1.4) });
      }
    }
    // Beach palms
    for (let x = -670; x < -20; x += 26) {
      if (BEACH_GAPS.some((g) => Math.abs(g - x) < 12)) continue;
      this.trees.push({ x: x + rng.range(-3, 3), z: -357, kind: "palm", scale: rng.range(0.9, 1.25) });
    }
    for (const t of this.trees) {
      const y = baseTerrain(t.x, t.z);
      this.addCollider(t.x, t.z, 0.35, 0.35, 0, y - 1, y + 6, "tree");
    }
  }

  private nearDestRing(x: number, z: number, r: number): boolean {
    for (const d of this.destinations) if (dist(x, z, d.x, d.z) < r) return true;
    return false;
  }
  pointNearCorridor(x: number, z: number, pad: number): boolean {
    for (const sc of this.shortcuts)
      for (let k = 0; k + 1 < sc.points.length; k++) {
        const [ax, az] = sc.points[k], [bx, bz] = sc.points[k + 1];
        if (segDist(x, z, ax, az, bx, bz) < sc.width / 2 + pad) return true;
      }
    return false;
  }

  private buildPickups() {
    let id = 0;
    for (const e of this.edges) {
      if (e.kind === "highline") continue;
      const A = this.nodes[e.a];
      for (const t of [0.3, 0.7]) {
        for (const side of [1, -1]) {
          const s = e.length * t;
          const cxm = A.x + e.dx * s, czm = A.z + e.dz * s;
          const rx = e.dz * side, rz = -e.dx * side;
          const lane = e.halfWidth - e.laneWidth / 2;
          const x = cxm + rx * lane, z = czm + rz * lane;
          const px = cxm + rx * (e.halfWidth + e.sidewalk * 0.6), pz = czm + rz * (e.halfWidth + e.sidewalk * 0.6);
          if (this.nearDestRing(x, z, 30)) continue;
          if (this.pointNearCorridor(x, z, 10)) continue;
          if (this.cuts.some((c) => x > c.minX - 12 && x < c.maxX + 12 && z > c.minZ - 12 && z < c.maxZ + 12)) continue;
          if (this.collidersHitCircle(px, pz, 0.6, baseTerrain(px, pz) + 0.5)) continue;
          const yaw = side > 0 ? Math.atan2(e.dx, e.dz) : Math.atan2(-e.dx, -e.dz);
          this.pickups.push({ id: id++, x, z, px, pz, edge: e.id, district: districtAt(x, z), yaw });
        }
      }
    }
  }

  private buildItemsAndProps() {
    const rng = new Rng(this.seed * 977 + 1);
    let id = 0;
    // Clock sparks on risky shortcuts (placed past the hazard).
    const sparkAt: Record<string, number> = { canal: 0.72, seawall: 0.79, garage: 0.6, overpass: 0.78, construction: 0.55, terrace: 0.5 };
    for (const sc of this.shortcuts) {
      const f = sparkAt[sc.id];
      if (f === undefined) continue;
      const [x, z] = this.pointAlong(sc.points, f);
      this.items.push({ id: id++, kind: "spark", x, z });
    }
    // Tailwind tokens: off the optimal line, on shortcut shoulders and sidewalks.
    for (const sc of this.shortcuts) {
      const [x, z] = this.pointAlong(sc.points, 0.35);
      const [x2, z2] = this.pointAlong(sc.points, 0.36);
      const len = dist(x, z, x2, z2) || 1;
      const nx = (z2 - z) / len, nz = -(x2 - x) / len;
      const off = (sc.width / 2 - 1.2) * (rng.chance(0.5) ? 1 : -1);
      this.items.push({ id: id++, kind: "token", x: x + nx * off, z: z + nz * off });
    }
    for (let k = 0; k < 14; k++) {
      const e = this.edges[rng.int(0, this.edges.length)];
      const A = this.nodes[e.a];
      const s = e.length * rng.range(0.25, 0.75);
      const side = rng.chance(0.5) ? 1 : -1;
      const off = (e.halfWidth + e.sidewalk * 0.5) * side;
      const x = A.x + e.dx * s + e.dz * off, z = A.z + e.dz * s - e.dx * off;
      if (this.collidersHitCircle(x, z, 1.5, baseTerrain(x, z) + 0.5)) continue;
      this.items.push({ id: id++, kind: "token", x, z });
    }
    // Repair arches in curb lanes.
    for (const [c, r, c2, r2, t, side] of REPAIR_ARCHES) {
      const a = this.nodeIdAt(COLS[c], ROWS[r]), b = this.nodeIdAt(COLS[c2], ROWS[r2]);
      if (a === undefined || b === undefined) continue;
      const e = this.edges.find((ed) => (ed.a === a && ed.b === b) || (ed.a === b && ed.b === a));
      if (!e) continue;
      const A = this.nodes[e.a];
      const s = e.length * t;
      const off = (e.halfWidth - e.laneWidth / 2) * side;
      this.items.push({ id: id++, kind: "repair", x: A.x + e.dx * s + e.dz * off, z: A.z + e.dz * s - e.dx * off });
    }
    // Props: cones at construction/overpass, crates along the market cut, chairs in Lantern alleys.
    let pid = 0;
    const scatter = (scId: string, kind: PropSpawn["kind"], n: number) => {
      const sc = this.shortcuts.find((s) => s.id === scId)!;
      for (let i = 0; i < n; i++) {
        const f = 0.15 + (0.7 * i) / Math.max(1, n - 1);
        const [x, z] = this.pointAlong(sc.points, f);
        const [x2, z2] = this.pointAlong(sc.points, Math.min(1, f + 0.01));
        const len = dist(x, z, x2, z2) || 1;
        const nx = (z2 - z) / len, nz = -(x2 - x) / len;
        const side = i % 2 === 0 ? 1 : -1;
        const off = (sc.width / 2 - 0.9) * side;
        this.props.push({ id: pid++, kind, x: x + nx * off, z: z + nz * off, yaw: rng.range(0, Math.PI) });
      }
    };
    scatter("market", "crate", 10);
    scatter("kettle", "chair", 8);
    scatter("arcade", "chair", 6);
    scatter("containers", "barrier", 6);
    scatter("stadium", "cone", 8);
    scatter("tram", "cone", 6);
    scatter("lawn", "cone", 4);
  }

  pointAlong(points: [number, number][], f: number): [number, number] {
    let total = 0;
    for (let k = 0; k + 1 < points.length; k++) total += dist(points[k][0], points[k][1], points[k + 1][0], points[k + 1][1]);
    let target = total * clamp(f, 0, 1);
    for (let k = 0; k + 1 < points.length; k++) {
      const l = dist(points[k][0], points[k][1], points[k + 1][0], points[k + 1][1]);
      if (target <= l) {
        const t = target / l;
        return [lerp(points[k][0], points[k + 1][0], t), lerp(points[k][1], points[k + 1][1], t)];
      }
      target -= l;
    }
    return points[points.length - 1];
  }

  private buildHubs() {
    // Three start hubs: Harbor, Civic, Old Steps. Positioned in a curb lane facing along the road.
    const hub = (name: string, c: number, r: number, c2: number, r2: number, t: number) => {
      const a = this.nodeIdAt(COLS[c], ROWS[r])!, b = this.nodeIdAt(COLS[c2], ROWS[r2])!;
      const e = this.edges.find((ed) => ed.a === a && ed.b === b)!;
      const A = this.nodes[e.a];
      const s = e.length * t;
      const off = e.halfWidth - e.laneWidth / 2;
      this.hubs.push({ name, x: A.x + e.dx * s + e.dz * off, z: A.z + e.dz * s - e.dx * off, yaw: Math.atan2(e.dx, e.dz) });
    };
    hub("Harbor Loop", 5, 0, 6, 0, 0.35);
    hub("Civic Crown", 5, 2, 5, 3, 0.3);
    hub("Old Steps", 3, 4, 4, 4, 0.3);
  }

  private addCollider(cx: number, cz: number, hx: number, hz: number, yaw: number, minY: number, maxY: number, kind: Collider["kind"]): Collider {
    const c: Collider = { cx, cz, hx, hz, yaw, c: Math.cos(yaw), s: Math.sin(yaw), minY, maxY, kind };
    this.colliders.push(c);
    const r = Math.abs(c.hx * c.c) + Math.abs(c.hz * c.s);
    const r2 = Math.abs(c.hx * c.s) + Math.abs(c.hz * c.c);
    gridAdd(this.colGrid, c.cx - r, c.cz - r2, c.cx + r, c.cz + r2, c);
    return c;
  }

  // ---------------------------------------------------------------- queries
  terrainAt(x: number, z: number): number {
    return baseTerrain(x, z);
  }

  /** Full drivable height including volumes (ramps/decks) and cuts (canal). */
  heightAt(x: number, z: number): number {
    let h = baseTerrain(x, z);
    const t = h;
    for (const c of this.cuts) {
      if (x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ) {
        h = t - c.depth;
        break;
      }
    }
    for (const v of this.volumes) {
      const dx = x - v.cx, dz = z - v.cz;
      if (Math.abs(dx) > v.halfLen + v.halfWid || Math.abs(dz) > v.halfLen + v.halfWid) continue;
      const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw);
      const along = dx * fx + dz * fz;
      const across = dx * fz - dz * fx;
      if (Math.abs(along) > v.halfLen || Math.abs(across) > v.halfWid) continue;
      const u = (along + v.halfLen) / (2 * v.halfLen);
      const p = profileAt(v.profile, u);
      const vh = v.mode === "rel" ? t + p : Math.max(t, v.baseY + p);
      if (vh > h) h = vh;
    }
    return h;
  }

  /** Water surface height at x,z if there is water, else null. */
  waterAt(x: number, z: number): number | null {
    for (const c of this.cuts) if (x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ) return this.canalWaterY;
    if (baseTerrain(x, z) < 0) return 0;
    return null;
  }

  surfaceAt(x: number, z: number): Surface {
    const g = this.heightAt(x, z);
    const w = this.waterAt(x, z);
    if (w !== null && g < w) return "water";
    for (const v of this.volumes) {
      if (!v.surface) continue;
      const dx = x - v.cx, dz = z - v.cz;
      const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw);
      const along = dx * fx + dz * fz, across = dx * fz - dz * fx;
      if (Math.abs(along) <= v.halfLen && Math.abs(across) <= v.halfWid) {
        if (g > this.terrainAt(x, z) + 0.05) return v.surface;
      }
    }
    const ne = this.nearestEdge(x, z);
    if (ne && ne.dist <= ne.edge.halfWidth + 0.3) return ne.edge.kind === "cobble" ? "cobble" : "asphalt";
    for (const { sc } of this.corridorSurfaces) {
      for (let k = 0; k + 1 < sc.points.length; k++) {
        const [ax, az] = sc.points[k], [bx, bz] = sc.points[k + 1];
        if (segDist(x, z, ax, az, bx, bz) < sc.width / 2) return sc.surface;
      }
    }
    for (const zn of this.zones) if (x > zn.minX && x < zn.maxX && z > zn.minZ && z < zn.maxZ) return zn.surface;
    return "pavement";
  }

  edgesNear(x: number, z: number): RoadEdge[] {
    return this.edgeGrid.cells.get(gkey(Math.floor(x / this.edgeGrid.size), Math.floor(z / this.edgeGrid.size))) ?? [];
  }

  nearestEdge(x: number, z: number, maxDist = 1e9): NearestEdge | null {
    let best: NearestEdge | null = null;
    let cands = this.edgesNear(x, z);
    if (cands.length === 0) cands = this.edges;
    for (const e of cands) {
      const A = this.nodes[e.a], B = this.nodes[e.b];
      const t = segT(x, z, A.x, A.z, B.x, B.z);
      const px = A.x + (B.x - A.x) * t, pz = A.z + (B.z - A.z) * t;
      const d = dist(x, z, px, pz);
      if (d < maxDist && (!best || d < best.dist)) {
        const lateral = (x - px) * e.dz - (z - pz) * e.dx;
        best = { edge: e, t, dist: d, lateral };
      }
    }
    if (!best && cands !== this.edges) {
      const g = this.nearestEdgeGlobal(x, z);
      return g.dist < maxDist ? g : null;
    }
    return best;
  }

  /** Nearest edge searching all edges (used when far from roads). */
  nearestEdgeGlobal(x: number, z: number): NearestEdge {
    let best: NearestEdge | null = null;
    for (const e of this.edges) {
      const A = this.nodes[e.a], B = this.nodes[e.b];
      const t = segT(x, z, A.x, A.z, B.x, B.z);
      const px = A.x + (B.x - A.x) * t, pz = A.z + (B.z - A.z) * t;
      const d = dist(x, z, px, pz);
      if (!best || d < best.dist) best = { edge: e, t, dist: d, lateral: (x - px) * e.dz - (z - pz) * e.dx };
    }
    return best!;
  }

  collidersNear(x: number, z: number, out: Collider[]): Collider[] {
    out.length = 0;
    const s = this.colGrid.size;
    const ix = Math.floor(x / s), iz = Math.floor(z / s);
    for (let a = ix - 1; a <= ix + 1; a++)
      for (let b = iz - 1; b <= iz + 1; b++) {
        const arr = this.colGrid.cells.get(gkey(a, b));
        if (!arr) continue;
        for (const c of arr) if (!out.includes(c)) out.push(c);
      }
    return out;
  }

  collidersHitCircle(x: number, z: number, r: number, y: number): boolean {
    const near: Collider[] = [];
    this.collidersNear(x, z, near);
    for (const c of near) {
      if (y < c.minY || y > c.maxY) continue;
      const dx = x - c.cx, dz = z - c.cz;
      const lx = dx * c.c - dz * c.s;
      const lz = dx * c.s + dz * c.c;
      const qx = Math.max(Math.abs(lx) - c.hx, 0), qz = Math.max(Math.abs(lz) - c.hz, 0);
      if (qx * qx + qz * qz < r * r) return true;
    }
    return false;
  }

  /** A* over the legal road graph from a world position to a destination point. Shortcuts are not included. */
  route(fx: number, fz: number, tx: number, tz: number): Route {
    const from = this.nearestEdge(fx, fz)!;
    const to = this.nearestEdge(tx, tz)!;
    const fe = from.edge, te = to.edge;
    const fpx = this.nodes[fe.a].x + (this.nodes[fe.b].x - this.nodes[fe.a].x) * from.t;
    const fpz = this.nodes[fe.a].z + (this.nodes[fe.b].z - this.nodes[fe.a].z) * from.t;
    const tpx = this.nodes[te.a].x + (this.nodes[te.b].x - this.nodes[te.a].x) * to.t;
    const tpz = this.nodes[te.a].z + (this.nodes[te.b].z - this.nodes[te.a].z) * to.t;
    if (fe.id === te.id) {
      return { points: [[fx, fz], [tx, tz]], length: Math.abs(from.t - to.t) * fe.length + 1, nodes: [] };
    }
    const n = this.nodes.length;
    const g = new Float64Array(n).fill(Infinity);
    const prev = new Int32Array(n).fill(-1);
    const closed = new Uint8Array(n);
    const open: number[] = [];
    const startCost = (node: number) => (node === fe.a ? from.t : 1 - from.t) * fe.length;
    for (const s of [fe.a, fe.b]) {
      g[s] = startCost(s);
      open.push(s);
    }
    const goalCost = (node: number) => (node === te.a ? to.t : 1 - to.t) * te.length;
    let bestGoal = -1, bestTotal = Infinity;
    while (open.length) {
      let bi = 0;
      for (let i = 1; i < open.length; i++) {
        const a = open[i], b = open[bi];
        const fa = g[a] + dist(this.nodes[a].x, this.nodes[a].z, tpx, tpz);
        const fb = g[b] + dist(this.nodes[b].x, this.nodes[b].z, tpx, tpz);
        if (fa < fb) bi = i;
      }
      const cur = open.splice(bi, 1)[0];
      if (closed[cur]) continue;
      closed[cur] = 1;
      if (g[cur] >= bestTotal) break;
      if (cur === te.a || cur === te.b) {
        const total = g[cur] + goalCost(cur);
        if (total < bestTotal) { bestTotal = total; bestGoal = cur; }
      }
      for (const eid of this.nodes[cur].edges) {
        const e = this.edges[eid];
        const nb = e.a === cur ? e.b : e.a;
        const ng = g[cur] + e.length;
        if (ng < g[nb]) {
          g[nb] = ng;
          prev[nb] = cur;
          open.push(nb);
        }
      }
    }
    const nodes: number[] = [];
    for (let c = bestGoal; c !== -1; c = prev[c]) nodes.unshift(c);
    const points: [number, number][] = [[fx, fz], [fpx, fpz]];
    for (const id of nodes) points.push([this.nodes[id].x, this.nodes[id].z]);
    points.push([tpx, tpz], [tx, tz]);
    return { points, length: bestTotal, nodes };
  }

  /** Static colliders (for camera sphere-cast and validation). */
  segmentBlocked(ax: number, az: number, bx: number, bz: number, y: number): number {
    // returns fraction [0,1] of the first hit along a->b
    let best = 1;
    const steps = Math.ceil(dist(ax, az, bx, bz) / 0.8);
    for (let i = 1; i <= steps; i++) {
      const f = i / steps;
      const x = lerp(ax, bx, f), z = lerp(az, bz, f);
      if (this.collidersHitCircle(x, z, 0.4, y)) {
        best = (i - 1) / steps;
        break;
      }
    }
    return best;
  }
}

let cached: World | null = null;
export function getWorld(): World {
  if (!cached) cached = new World(1);
  return cached;
}
