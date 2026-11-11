// Navigation grid generated from the collision world: 1 m nodes, multiple height layers,
// walk edges, one-way drop edges and crouch-only nodes. Used by server-side bots and map analysis.
import { PLAYER } from '../content/rules';
import { F_SOLID, type CollisionWorld } from './world';
import type { MapData } from './build';

export interface NavNode {
  id: number;
  x: number;
  y: number;
  z: number;
  crouch: boolean;
  edges: number[];
  costs: number[];
  /** true when the edge is a one-way drop */
  drops: boolean[];
  reachable: boolean;
}

const HW = PLAYER.halfWidth + 0.02;
const WALK_DY = 0.6;

export class NavGrid {
  nodes: NavNode[] = [];
  private cells: number[][] = [];
  private g: Float32Array = new Float32Array(0);
  private from: Int32Array = new Int32Array(0);
  private mark: Int32Array = new Int32Array(0);
  private markId = 0;

  constructor(
    public world: CollisionWorld,
    public sizeX: number,
    public sizeZ: number,
  ) {}

  static build(map: MapData): NavGrid {
    const nav = new NavGrid(map.world, map.sizeX, map.sizeZ);
    nav.generate();
    const s = map.spawns.atk[0];
    const start = nav.nearestAny(s.x, 0, s.z);
    if (start) nav.markReachable(start.id);
    return nav;
  }

  private generate(): void {
    const w = this.world;
    const tmp: import('./world').Box[] = [];
    for (let iz = 0; iz < this.sizeZ; iz++) {
      for (let ix = 0; ix < this.sizeX; ix++) {
        const list: number[] = [];
        this.cells.push(list);
        const cx = ix + 0.5;
        const cz = iz + 0.5;
        w.query(cx - 0.05, -1, cz - 0.05, cx + 0.05, 5, cz + 0.05, F_SOLID, false, tmp);
        const tops: number[] = [];
        for (const b of tmp) if (b.y1 > -0.5 && b.y1 < 4.6 && !tops.some((t) => Math.abs(t - b.y1) < 0.01)) tops.push(b.y1);
        tops.sort((a, b) => a - b);
        for (const h of tops) {
          const stand = !w.overlaps(cx - HW, h + 0.02, cz - HW, cx + HW, h + PLAYER.standHeight, cz + HW, F_SOLID, false);
          const crouch = !stand && !w.overlaps(cx - HW, h + 0.02, cz - HW, cx + HW, h + PLAYER.crouchHeight + 0.01, cz + HW, F_SOLID, false);
          if (!stand && !crouch) continue;
          const node: NavNode = { id: this.nodes.length, x: cx, y: h, z: cz, crouch, edges: [], costs: [], drops: [], reachable: false };
          this.nodes.push(node);
          list.push(node.id);
        }
      }
    }
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];
    for (const a of this.nodes) {
      const ix = Math.floor(a.x);
      const iz = Math.floor(a.z);
      for (const [dx, dz] of dirs) {
        const jx = ix + dx;
        const jz = iz + dz;
        if (jx < 0 || jz < 0 || jx >= this.sizeX || jz >= this.sizeZ) continue;
        const diag = dx !== 0 && dz !== 0;
        for (const bid of this.cells[jz * this.sizeX + jx]) {
          const b = this.nodes[bid];
          const dy = b.y - a.y;
          const hTop = Math.max(a.y, b.y);
          const height = a.crouch || b.crouch ? PLAYER.crouchHeight + 0.01 : PLAYER.standHeight;
          if (Math.abs(dy) <= WALK_DY) {
            const mx = (a.x + b.x) / 2;
            const mz = (a.z + b.z) / 2;
            if (w.overlaps(mx - HW, hTop + 0.02, mz - HW, mx + HW, hTop + height, mz + HW, F_SOLID, false)) continue;
            // going up: every rise along the way must be a real stair step (never the side of a staircase)
            if (dy > PLAYER.stepHeight + 0.01 && !this.climbable(a, b)) continue;
            if (diag) {
              // no corner cutting: both orthogonal neighbours must be walkable at a similar height
              if (!this.hasNodeNear(ix + dx, iz, a.y) || !this.hasNodeNear(ix, iz + dz, a.y)) continue;
            }
            a.edges.push(b.id);
            a.costs.push((diag ? 1.4142 : 1) * (a.crouch || b.crouch ? 2.6 : 1) + Math.abs(dy) * 0.5);
            a.drops.push(false);
          } else if (!diag && dy < -WALK_DY && dy >= -4) {
            // one-way drop: the column above the landing cell must be clear up to our head
            if (w.overlaps(b.x - HW, b.y + 0.02, b.z - HW, b.x + HW, a.y + PLAYER.standHeight, b.z + HW, F_SOLID, false)) continue;
            const mx = (a.x + b.x) / 2;
            const mz = (a.z + b.z) / 2;
            if (w.overlaps(mx - HW, a.y + 0.02, mz - HW, mx + HW, a.y + PLAYER.standHeight, mz + HW, F_SOLID, false)) continue;
            a.edges.push(b.id);
            a.costs.push(2.5 + Math.abs(dy));
            a.drops.push(true);
          }
        }
      }
    }
    const n = this.nodes.length;
    this.g = new Float32Array(n);
    this.from = new Int32Array(n);
    this.mark = new Int32Array(n);
  }

  /** True when the ground between two nodes rises only in steps the player can actually walk up. */
  private climbable(a: NavNode, b: NavNode): boolean {
    let y = a.y;
    const n = 14;
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      // nudged off exact step boundaries, where a vertical ray would graze two boxes and hit neither
      const gy = this.world.groundBelow(a.x + (b.x - a.x) * t + 0.003, y + 0.75, a.z + (b.z - a.z) * t + 0.003, 2);
      if (!isFinite(gy)) return false;
      if (gy - y > PLAYER.stepHeight + 0.01) return false;
      y = gy;
    }
    // within one step of the target node (its height is sampled at the cell centre, which may sit on a step edge)
    return Math.abs(y - b.y) <= PLAYER.stepHeight;
  }

  private hasNodeNear(ix: number, iz: number, y: number): boolean {
    if (ix < 0 || iz < 0 || ix >= this.sizeX || iz >= this.sizeZ) return false;
    for (const id of this.cells[iz * this.sizeX + ix]) if (Math.abs(this.nodes[id].y - y) <= WALK_DY) return true;
    return false;
  }

  private markReachable(start: number): void {
    const stack = [start];
    this.nodes[start].reachable = true;
    while (stack.length) {
      const n = this.nodes[stack.pop()!];
      for (const e of n.edges) {
        const m = this.nodes[e];
        if (!m.reachable) {
          m.reachable = true;
          stack.push(e);
        }
      }
    }
  }

  private nearestAny(x: number, y: number, z: number): NavNode | null {
    let best: NavNode | null = null;
    let bd = Infinity;
    for (const n of this.nodes) {
      const d = (n.x - x) ** 2 + (n.z - z) ** 2 + (n.y - y) ** 2 * 4;
      if (d < bd) {
        bd = d;
        best = n;
      }
    }
    return best;
  }

  /** Nearest reachable node, preferring nodes near the given height. */
  nearest(x: number, y: number, z: number, maxR = 4): NavNode | null {
    let best: NavNode | null = null;
    let bd = Infinity;
    const ix = Math.floor(x);
    const iz = Math.floor(z);
    for (let r = 0; r <= maxR; r++) {
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          const jx = ix + dx;
          const jz = iz + dz;
          if (jx < 0 || jz < 0 || jx >= this.sizeX || jz >= this.sizeZ) continue;
          for (const id of this.cells[jz * this.sizeX + jx]) {
            const n = this.nodes[id];
            if (!n.reachable) continue;
            const d = (n.x - x) ** 2 + (n.z - z) ** 2 + (n.y - y) ** 2 * 4;
            if (d < bd) {
              bd = d;
              best = n;
            }
          }
        }
      }
      if (best && r >= 1) break;
    }
    return best;
  }

  /**
   * A* over the grid. `penalty` lets callers discourage nodes (fire, known danger) without forbidding them.
   * Returns node ids from start to goal inclusive, or null.
   */
  findPath(startId: number, goalId: number, penalty?: (n: NavNode) => number): number[] | null {
    if (startId === goalId) return [startId];
    const nodes = this.nodes;
    const goal = nodes[goalId];
    const id = ++this.markId;
    const heap: number[] = [];
    const f: number[] = [];
    const push = (n: number, fv: number) => {
      let i = heap.length;
      heap.push(n);
      f.push(fv);
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (f[p] <= fv) break;
        heap[i] = heap[p];
        f[i] = f[p];
        i = p;
      }
      heap[i] = n;
      f[i] = fv;
    };
    const pop = (): number => {
      const top = heap[0];
      const ln = heap.pop()!;
      const lf = f.pop()!;
      const len = heap.length;
      if (len > 0) {
        let i = 0;
        for (;;) {
          let c = i * 2 + 1;
          if (c >= len) break;
          if (c + 1 < len && f[c + 1] < f[c]) c++;
          if (f[c] >= lf) break;
          heap[i] = heap[c];
          f[i] = f[c];
          i = c;
        }
        heap[i] = ln;
        f[i] = lf;
      }
      return top;
    };
    const h = (n: NavNode) => Math.hypot(n.x - goal.x, n.z - goal.z) + Math.abs(n.y - goal.y) * 0.5;
    this.g[startId] = 0;
    this.from[startId] = -1;
    this.mark[startId] = id;
    push(startId, h(nodes[startId]));
    const closed = new Uint8Array(nodes.length);
    while (heap.length) {
      const cur = pop();
      if (cur === goalId) {
        const path: number[] = [];
        let c = cur;
        while (c !== -1) {
          path.push(c);
          c = this.from[c];
        }
        return path.reverse();
      }
      if (closed[cur]) continue;
      closed[cur] = 1;
      const n = nodes[cur];
      for (let k = 0; k < n.edges.length; k++) {
        const e = n.edges[k];
        if (closed[e]) continue;
        const ng = this.g[cur] + n.costs[k] + (penalty ? penalty(nodes[e]) : 0);
        if (this.mark[e] !== id || ng < this.g[e]) {
          this.mark[e] = id;
          this.g[e] = ng;
          this.from[e] = cur;
          push(e, ng + h(nodes[e]));
        }
      }
    }
    return null;
  }

  pathLength(path: number[]): number {
    let d = 0;
    for (let i = 1; i < path.length; i++) {
      const a = this.nodes[path[i - 1]];
      const b = this.nodes[path[i]];
      d += Math.hypot(a.x - b.x, a.z - b.z, a.y - b.y);
    }
    return d;
  }

  /** Walking distance between two world points, or Infinity when unreachable. */
  distance(ax: number, ay: number, az: number, bx: number, by: number, bz: number): number {
    const a = this.nearest(ax, ay, az);
    const b = this.nearest(bx, by, bz);
    if (!a || !b) return Infinity;
    const p = this.findPath(a.id, b.id);
    return p ? this.pathLength(p) : Infinity;
  }

  /** Can a standing player walk the straight line a->b without obstruction or a ledge? */
  walkable(ax: number, ay: number, az: number, bx: number, bz: number): boolean {
    const w = this.world;
    const len = Math.hypot(bx - ax, bz - az);
    const steps = Math.max(1, Math.ceil(len / 0.35));
    let y = ay;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = ax + (bx - ax) * t;
      const z = az + (bz - az) * t;
      const gy = w.groundBelow(x, y + 0.5, z, 1.2);
      if (!isFinite(gy) || Math.abs(gy - y) > 0.34) return false;
      y = gy;
      if (w.overlaps(x - HW, y + 0.05, z - HW, x + HW, y + PLAYER.standHeight, z + HW, F_SOLID, false)) return false;
    }
    return true;
  }
}

let cachedNav: NavGrid | null = null;
let cachedFor: MapData | null = null;
export function getNav(map: MapData): NavGrid {
  if (!cachedNav || cachedFor !== map) {
    cachedNav = NavGrid.build(map);
    cachedFor = map;
  }
  return cachedNav;
}
