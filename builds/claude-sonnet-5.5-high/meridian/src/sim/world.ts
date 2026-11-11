import { Rng } from '../core/rng';
import { clamp, rayAabb, rayCircle } from '../core/math';

/** South Quay layout constants (metres). Heading 0 = +Z. */
export const SPACING = 80;
export const ROAD_HALF = 6;
export const LANE_OFFSET = 3;
export const SIDEWALK = 4;
export const N_LINES = 7;
export const LINE0 = -240;
export const SEA_Z = -272;
export const LINES: number[] = Array.from({ length: N_LINES }, (_, i) => LINE0 + i * SPACING);
export const WORLD_EXTENT = 300;

export type District = 'Tide Market' | 'Foundry Row' | 'Glassline' | 'Lantern Hill' | 'Breakwater' | 'Canal Loop' | 'Outskirts';
export type Surface = 'asphalt' | 'wet-asphalt' | 'concrete' | 'gravel' | 'metal' | 'shallow' | 'water';
export type FacadeStyle = 'stone' | 'glass' | 'brick' | 'tile' | 'shed' | 'deco';

export interface Collider {
  id: number;
  shape: 'aabb' | 'circle';
  minX: number; maxX: number; minZ: number; maxZ: number;
  cx: number; cz: number; r: number;
  h: number;
  tag: 'building' | 'prop' | 'low' | 'rail' | 'container' | 'stall' | 'pole' | 'plant';
  /** Props that react (cones, bins) and count as property damage when hit by a vehicle. */
  breakable: boolean;
  /** Set when a breakable collider has been knocked away. */
  gone?: boolean;
  stamp?: number;
}

export interface Building {
  id: number;
  minX: number; maxX: number; minZ: number; maxZ: number;
  h: number;
  style: FacadeStyle;
  district: District;
  tiers: number;
  accent: number;
  roofProps: boolean;
}

export interface BlockInfo { i: number; j: number; cx: number; cz: number; district: District; kind: 'lots' | 'plaza' | 'park' | 'yard' | 'dock' | 'garage' }

export type PoiKind = 'safehouse' | 'store' | 'kiosk' | 'garage' | 'precinct' | 'printshop' | 'tower' | 'dockside' | 'warehouse' | 'portoffice' | 'viewpoint' | 'courier' | 'circuit' | 'recovery';
export interface Poi { id: string; kind: PoiKind; name: string; x: number; z: number; heading: number; district: District; landmark?: boolean }

export interface Prop { id: number; kind: 'lamp' | 'tree' | 'bin' | 'cone' | 'planter' | 'stall' | 'container' | 'bollard' | 'bench' | 'signal' | 'crate' | 'dome' | 'crane' | 'lighthouse' | 'tower' | 'boat' | 'barrier'; x: number; z: number; rot: number; w: number; d: number; h: number; color: number; colliderId?: number }

export interface ParkingSpot { id: number; x: number; z: number; heading: number }

export class World {
  colliders: Collider[] = [];
  buildings: Building[] = [];
  blocks: BlockInfo[] = [];
  pois: Poi[] = [];
  props: Prop[] = [];
  parking: ParkingSpot[] = [];
  /** Shallow canal rect. */
  canal = { minX: -70, maxX: -10, minZ: 116, maxZ: 124 };
  wet = 0;
  private grid = new Map<string, Collider[]>();
  private nextId = 1;
  readonly cell = 32;

  constructor(seed = 1107) {
    this.generate(new Rng(seed));
  }

  // ---------------------------------------------------------------- queries
  private key(cx: number, cz: number): string { return cx + ',' + cz; }

  private register(c: Collider): void {
    const x0 = Math.floor(c.minX / this.cell);
    const x1 = Math.floor(c.maxX / this.cell);
    const z0 = Math.floor(c.minZ / this.cell);
    const z1 = Math.floor(c.maxZ / this.cell);
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      const k = this.key(x, z);
      let a = this.grid.get(k);
      if (!a) { a = []; this.grid.set(k, a); }
      a.push(c);
    }
  }

  addAabb(minX: number, maxX: number, minZ: number, maxZ: number, h: number, tag: Collider['tag'], breakable = false): Collider {
    const c: Collider = { id: this.nextId++, shape: 'aabb', minX, maxX, minZ, maxZ, cx: (minX + maxX) / 2, cz: (minZ + maxZ) / 2, r: 0, h, tag, breakable };
    this.colliders.push(c);
    this.register(c);
    return c;
  }

  addCircle(cx: number, cz: number, r: number, h: number, tag: Collider['tag'], breakable = false): Collider {
    const c: Collider = { id: this.nextId++, shape: 'circle', minX: cx - r, maxX: cx + r, minZ: cz - r, maxZ: cz + r, cx, cz, r, h, tag, breakable };
    this.colliders.push(c);
    this.register(c);
    return c;
  }

  private scratch: Collider[] = [];
  private stamp = 0;
  /** Colliders whose bounds overlap the box. Result array is reused between calls. */
  query(minX: number, minZ: number, maxX: number, maxZ: number): Collider[] {
    const out = this.scratch;
    out.length = 0;
    this.stamp++;
    const x0 = Math.floor(minX / this.cell);
    const x1 = Math.floor(maxX / this.cell);
    const z0 = Math.floor(minZ / this.cell);
    const z1 = Math.floor(maxZ / this.cell);
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      const a = this.grid.get(this.key(x, z));
      if (!a) continue;
      for (const c of a) {
        if (c.gone || c.maxX < minX || c.minX > maxX || c.maxZ < minZ || c.minZ > maxZ) continue;
        if (c.stamp !== this.stamp) { c.stamp = this.stamp; out.push(c); }
      }
    }
    return out;
  }

  /** Nearest ray hit on colliders. dy is vertical slope (y rises dy per metre of xz travel). */
  raycast(ox: number, oz: number, dx: number, dz: number, maxT: number, oy = 1.5, dy = 0, minBlockH = 0): { t: number; c: Collider } | null {
    let best = maxT;
    let hit: Collider | null = null;
    const ex = ox + dx * maxT;
    const ez = oz + dz * maxT;
    const list = this.query(Math.min(ox, ex) - 0.5, Math.min(oz, ez) - 0.5, Math.max(ox, ex) + 0.5, Math.max(oz, ez) + 0.5);
    for (const c of list) {
      if (c.h < minBlockH) continue;
      const t = c.shape === 'aabb'
        ? rayAabb(ox, oz, dx, dz, c.minX, c.maxX, c.minZ, c.maxZ, best)
        : rayCircle(ox, oz, dx, dz, c.cx, c.cz, c.r, best);
      if (t < 0 || t >= best) continue;
      const y = oy + dy * t;
      if (y > c.h || y < -0.5) continue;
      best = t;
      hit = c;
    }
    return hit ? { t: best, c: hit } : null;
  }

  /** True when no tall collider blocks the line between two points (used by perception). */
  lineOfSight(ax: number, az: number, bx: number, bz: number, minBlockH = 1.6): boolean {
    const dx = bx - ax;
    const dz = bz - az;
    const d = Math.hypot(dx, dz);
    if (d < 0.01) return true;
    return !this.raycast(ax, az, dx / d, dz / d, d, 1.6, 0, minBlockH);
  }

  isRoad(x: number, z: number): boolean {
    if (x < LINE0 - ROAD_HALF || x > -LINE0 + ROAD_HALF || z < LINE0 - ROAD_HALF || z > -LINE0 + ROAD_HALF) return false;
    for (const l of LINES) if (Math.abs(x - l) <= ROAD_HALF || Math.abs(z - l) <= ROAD_HALF) return true;
    return false;
  }

  districtAt(x: number, z: number): District {
    if (x < -246 || x > 246 || z > 246) return 'Outskirts';
    if (z < -166 - 40) return 'Breakwater';
    const i = clamp(Math.floor((x + 280) / SPACING), 0, 5);
    const j = clamp(Math.floor((z + 240 + 40) / SPACING), 0, 5);
    return World.districtOfBlock(i, j);
  }

  static districtOfBlock(i: number, j: number): District {
    if (j === 0) return 'Breakwater';
    if (j <= 2) return i <= 2 ? 'Tide Market' : 'Foundry Row';
    if (i === 2) return 'Canal Loop';
    return i <= 1 ? 'Lantern Hill' : 'Glassline';
  }

  surfaceAt(x: number, z: number): Surface {
    if (z < SEA_Z) return 'water';
    if (x > this.canal.minX && x < this.canal.maxX && z > this.canal.minZ && z < this.canal.maxZ) return 'shallow';
    if (z < LINE0 - ROAD_HALF) return 'metal';
    if (this.isRoad(x, z)) return this.wet > 0.4 ? 'wet-asphalt' : 'asphalt';
    return 'concrete';
  }

  poi(id: string): Poi {
    const p = this.pois.find((q) => q.id === id);
    if (!p) throw new Error('missing poi ' + id);
    return p;
  }

  nearestPoi(x: number, z: number, maxD: number, kinds?: PoiKind[]): Poi | null {
    let best: Poi | null = null;
    let bd = maxD;
    for (const p of this.pois) {
      if (kinds && !kinds.includes(p.kind)) continue;
      const d = Math.hypot(p.x - x, p.z - z);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }

  // ------------------------------------------------------------ generation
  private generate(rng: Rng): void {
    const extent = -LINE0 + ROAD_HALF; // 246
    // Outer ring buildings (floodwall + hillside) -------------------------------------------------
    const outer: Array<[number, number, number, number, number]> = [];
    for (let z = -240; z < 300; z += 60) {
      outer.push([extent + 4, extent + 52, z, z + 56, rng.range(22, 46)]);
      outer.push([-extent - 52, -extent - 4, z, z + 56, rng.range(18, 40)]);
    }
    for (let x = -240; x < 300; x += 60) outer.push([x, x + 56, extent + 4, extent + 56, rng.range(26, 56)]);
    for (const o of outer) this.addBuilding(o[0], o[1], o[2], o[3], o[4], rng.pick<FacadeStyle>(['stone', 'tile', 'deco']), 'Outskirts', rng, 1, false);
    // Boundary caps so nothing leaves the playable world
    this.addAabb(-WORLD_EXTENT, WORLD_EXTENT, 300, 310, 60, 'building');
    this.addAabb(-310, -WORLD_EXTENT, -300, 310, 60, 'building');
    this.addAabb(WORLD_EXTENT, 310, -300, 310, 60, 'building');

    // Blocks ------------------------------------------------------------------------------------------
    for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) this.genBlock(i, j, rng);

    // Quay edge rail (vaultable into the harbor) and bollards
    for (let x = -240; x <= 240; x += 40) {
      this.addAabb(x - 20, x + 20, SEA_Z - 0.3, SEA_Z + 0.3, 0.9, 'rail');
    }
    this.addAabb(-WORLD_EXTENT, -WORLD_EXTENT + 4, SEA_Z - 40, SEA_Z + 1, 3, 'building');
    this.addAabb(WORLD_EXTENT - 4, WORLD_EXTENT, SEA_Z - 40, SEA_Z + 1, 3, 'building');

    // Street furniture ---------------------------------------------------------------------------------
        for (const l of LINES) {
      for (let t = -240; t <= 240; t += 20) {
        if (LINES.some((q) => Math.abs(t - q) < 14)) continue;
        // lamps on both sidewalks of every road
        for (const side of [-1, 1]) {
          const off = ROAD_HALF + 1.2;
          this.addProp('lamp', l + side * off, t, 0, 0.3, 0.3, 7, 0x2d3338, undefined, true);
          this.addProp('lamp', t, l + side * off, 0, 0.3, 0.3, 7, 0x2d3338, undefined, true);
        }
      }
    }
    // Signals at each corner of each intersection
    for (const lx of LINES) for (const lz of LINES) {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const x = lx + sx * (ROAD_HALF + 0.8);
        const z = lz + sz * (ROAD_HALF + 0.8);
        if (Math.abs(z) > extent + 1 || Math.abs(x) > extent + 1) continue;
        this.addProp('signal', x, z, 0, 0.3, 0.3, 5.5, 0x2a2f34, undefined, true);
      }
    }

    // POIs -------------------------------------------------------------------------------------------------
    const edge = 32; // sidewalk centre offset from block centre
    const bc = (i: number) => -200 + 80 * i;
    this.pois.push({ id: 'safehouse', kind: 'safehouse', name: 'Rowan\'s Loft (Safehouse)', x: bc(1) - 18, z: bc(1) - edge, heading: Math.PI, district: 'Tide Market' });
    this.pois.push({ id: 'store', kind: 'store', name: 'Brightline Convenience', x: bc(1) + 18, z: bc(1) - edge, heading: Math.PI, district: 'Tide Market' });
    this.pois.push({ id: 'kiosk', kind: 'kiosk', name: 'Threadwork Kiosk', x: bc(2) - 20, z: bc(2) - edge + 1, heading: Math.PI, district: 'Tide Market' });
    this.pois.push({ id: 'printshop', kind: 'printshop', name: 'Marrow & Daughters Print', x: bc(0) + 18, z: bc(2) + edge, heading: 0, district: 'Tide Market' });
    this.pois.push({ id: 'tower', kind: 'tower', name: 'Halyard Tower Lobby', x: bc(4) + 18, z: bc(4) - edge, heading: Math.PI, district: 'Glassline' });
    this.pois.push({ id: 'precinct', kind: 'precinct', name: 'Glassline Substation', x: bc(3) - 18, z: bc(3) - edge, heading: Math.PI, district: 'Glassline' });
    this.pois.push({ id: 'garage', kind: 'garage', name: 'Tidewater Garage', x: bc(4) - 18, z: bc(0) + edge, heading: 0, district: 'Breakwater' });
    this.pois.push({ id: 'dockside', kind: 'dockside', name: 'Dockside Tea Stand', x: bc(3) + 30, z: -252, heading: Math.PI, district: 'Breakwater' });
    this.pois.push({ id: 'warehouse', kind: 'warehouse', name: 'Foundry Row Cold Store', x: bc(4) + 10, z: bc(1) - edge, heading: Math.PI, district: 'Foundry Row' });
    this.pois.push({ id: 'viewpoint', kind: 'viewpoint', name: 'Lantern Hill Overlook', x: bc(0) - 10, z: bc(5) + 32, heading: 0, district: 'Lantern Hill', landmark: true });
    this.pois.push({ id: 'courierboard', kind: 'courier', name: 'Courier Dispatch Board', x: bc(1) - 2, z: bc(1) - edge, heading: Math.PI, district: 'Tide Market' });

    // Landmarks as POIs for discovery
    this.pois.push({ id: 'lm-dome', kind: 'viewpoint', name: 'Copper Dome Pavilion', x: bc(1), z: bc(2), heading: 0, district: 'Tide Market', landmark: true });
    this.pois.push({ id: 'lm-halyard', kind: 'viewpoint', name: 'Halyard Tower', x: bc(4), z: bc(4), heading: 0, district: 'Glassline', landmark: true });
    this.pois.push({ id: 'lm-lighthouse', kind: 'viewpoint', name: 'Breakwater Light', x: bc(5), z: bc(0), heading: 0, district: 'Breakwater', landmark: true });
    this.pois.push({ id: 'lm-gantry', kind: 'viewpoint', name: 'Harbor Gantry', x: 40, z: -258, heading: 0, district: 'Breakwater', landmark: true });
    this.pois.push({ id: 'lm-canal', kind: 'viewpoint', name: 'Canal Footbridge', x: -40, z: 120, heading: 0, district: 'Canal Loop', landmark: true });

    // Parking spots along block edges ---------------------------------------------------------------------
    let pid = 1;
    for (const l of LINES) {
      for (let t = -232; t <= 232; t += 16) {
        if (LINES.some((q) => Math.abs(t - q) < 18)) continue;
        for (const side of [-1, 1]) {
          if (rng.chance(0.55)) this.parking.push({ id: pid++, x: l + side * 5.1, z: t, heading: side > 0 ? 0 : Math.PI });
          if (rng.chance(0.55)) this.parking.push({ id: pid++, x: t, z: l + side * 5.1, heading: side > 0 ? Math.PI / 2 : -Math.PI / 2 });
        }
      }
    }
  }

  private addProp(kind: Prop['kind'], x: number, z: number, rot: number, w: number, d: number, h: number, color: number, _unused?: undefined, pole = false): Prop {
    const p: Prop = { id: this.props.length + 1, kind, x, z, rot, w, d, h, color };
    if (pole) {
      const c = this.addCircle(x, z, Math.max(w, d) / 2, h, 'pole');
      p.colliderId = c.id;
    }
    this.props.push(p);
    return p;
  }

  private addBuilding(minX: number, maxX: number, minZ: number, maxZ: number, h: number, style: FacadeStyle, district: District, rng: Rng, tiers = 1, roofProps = true): Building {
    const b: Building = { id: this.buildings.length + 1, minX, maxX, minZ, maxZ, h, style, district, tiers, accent: rng.int(0, 5), roofProps };
    this.buildings.push(b);
    this.addAabb(minX, maxX, minZ, maxZ, h, 'building');
    return b;
  }

  private genBlock(i: number, j: number, rng: Rng): void {
    const cx = -200 + 80 * i;
    const cz = -200 + 80 * j;
    const district = World.districtOfBlock(i, j);
    let kind: BlockInfo['kind'] = 'lots';
    if (district === 'Tide Market' && i >= 1 && j === 2) kind = i === 1 ? 'plaza' : 'lots';
    if (district === 'Canal Loop') kind = 'park';
    if (district === 'Foundry Row') kind = j === 1 || i === 4 ? 'yard' : 'lots';
    if (district === 'Breakwater') kind = 'dock';
    if (i === 4 && j === 0) kind = 'dock';
    this.blocks.push({ i, j, cx, cz, district, kind });
    const hx0 = cx - 30;
    const hx1 = cx + 30;
    const hz0 = cz - 30;
    const hz1 = cz + 30;

    if (kind === 'plaza') {
      // Tide Market: open plaza with stalls, planters, copper dome pavilion
      const dome = this.addProp('dome', cx, cz, 0, 14, 14, 12, 0x3f9d8a);
      this.addCircle(cx, cz, 5.5, 12, 'building');
      void dome;
      for (let k = -2; k <= 2; k++) {
        for (const side of [-1, 1]) {
          const sx = cx + k * 11;
          const sz = cz + side * 17;
          if (Math.abs(k) < 1 && side < 0) continue;
          this.props.push({ id: this.props.length + 1, kind: 'stall', x: sx, z: sz, rot: 0, w: 4, d: 2.4, h: 2.6, color: [0xd9553b, 0x3b8fd9, 0xe3b53b, 0x4caf78, 0xb05ad6][(k + 2) % 5] });
          this.addAabb(sx - 2, sx + 2, sz - 1.2, sz + 1.2, 2.6, 'stall');
        }
      }
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        const px = cx + Math.cos(a) * 11;
        const pz = cz + Math.sin(a) * 11;
        this.props.push({ id: this.props.length + 1, kind: 'planter', x: px, z: pz, rot: a, w: 2.2, d: 1.0, h: 0.9, color: 0x6f7d73 });
        this.addAabb(px - 1.1, px + 1.1, pz - 1.1, pz + 1.1, 0.9, 'low');
      }
      for (const [tx, tz] of [[-24, -24], [24, -24], [-24, 24], [24, 24], [-24, 0], [24, 0]]) this.addTree(cx + tx, cz + tz);
      // perimeter facades
      this.addBuilding(hx0, hx1, hz1 - 6, hz1, 12, 'tile', district, rng, 1);
      return;
    }

    if (kind === 'park') {
      for (let k = 0; k < 18; k++) this.addTree(cx + rng.range(-27, 27), cz + rng.range(-27, 27), this.canal);
      // pavilion and benches
      this.addBuilding(cx - 24, cx - 12, cz - 24, cz - 14, 4.5, 'stone', district, rng, 1, false);
      for (let k = 0; k < 6; k++) {
        const bx = cx + rng.range(-20, 20);
        const bz = cz + rng.range(-24, -2);
        this.props.push({ id: this.props.length + 1, kind: 'bench', x: bx, z: bz, rot: 0, w: 1.8, d: 0.6, h: 0.5, color: 0x8a6a45 });
      }
      return;
    }

    if (kind === 'dock') {
      // sheds + container stacks
      const rows = [hz0 + 4, hz0 + 26, hz0 + 48];
      for (let r = 0; r < 3; r++) {
        const rz = rows[r];
        if (r === 2 && (i === 1 || i === 4)) {
          this.addBuilding(hx0 + 4, hx1 - 4, rz - 4, rz + 13, 7.5, 'shed', district, rng, 1);
          continue;
        }
        let x = hx0 + 2;
        while (x < hx1 - 8) {
          const len = rng.chance(0.5) ? 12 : 6;
          if (x + len > hx1 - 1) break;
          const stack = rng.chance(0.35) ? 2 : 1;
          const colors = [0xb5412e, 0x2f6f8f, 0xc79a2a, 0x3f7d4f, 0x6b4a8a, 0xd9d4c4];
          const color = rng.pick(colors);
          if (rng.chance(0.8)) {
            this.props.push({ id: this.props.length + 1, kind: 'container', x: x + len / 2, z: rz + 1.3, rot: 0, w: len, d: 2.5, h: 2.6 * stack, color });
            this.addAabb(x, x + len, rz, rz + 2.6, 2.6 * stack, 'container');
          }
          x += len + (rng.chance(0.4) ? 4 : 0.2);
        }
      }
      if (i === 4 && j === 0) this.props.push({ id: this.props.length + 1, kind: 'dome', x: cx, z: cz, rot: 0, w: 0, d: 0, h: 0, color: 0 });
      if (i === 5 && j === 0) {
        this.props.push({ id: this.props.length + 1, kind: 'lighthouse', x: cx + 8, z: cz + 8, rot: 0, w: 7, d: 7, h: 34, color: 0xe8e2d0 });
        this.addCircle(cx + 8, cz + 8, 4, 34, 'building');
      }
      if (i === 1 && j === 0) {
        this.props.push({ id: this.props.length + 1, kind: 'crane', x: 40, z: -258, rot: 0, w: 22, d: 18, h: 30, color: 0xd25a2e });
        this.addAabb(40 - 11, 40 - 9, -258 - 9, -258 - 7, 30, 'building');
        this.addAabb(40 + 9, 40 + 11, -258 - 9, -258 - 7, 30, 'building');
        this.addAabb(40 - 11, 40 - 9, -258 + 7, -258 + 9, 30, 'building');
        this.addAabb(40 + 9, 40 + 11, -258 + 7, -258 + 9, 30, 'building');
      }
      // keep a drivable aisle: clearly separate sidewalk space around the block
      return;
    }

    if (kind === 'yard') {
      // big warehouse + yard with containers / crates
      const wx = rng.chance(0.5) ? hx0 : hx0 + 14;
      this.addBuilding(wx, wx + 46, hz0, hz0 + 30, 11, 'shed', district, rng, 1);
      for (let k = 0; k < 7; k++) {
        const x = hx0 + 2 + (k % 4) * 14 + rng.range(-1, 1);
        const z = hz0 + 36 + Math.floor(k / 4) * 10;
        const len = rng.chance(0.5) ? 12 : 6;
        const stack = rng.chance(0.3) ? 2 : 1;
        if (x + len > hx1) continue;
        this.props.push({ id: this.props.length + 1, kind: 'container', x: x + len / 2, z: z + 1.3, rot: 0, w: len, d: 2.5, h: 2.6 * stack, color: rng.pick([0xb5412e, 0x2f6f8f, 0xc79a2a, 0x3f7d4f]) });
        this.addAabb(x, x + len, z, z + 2.6, 2.6 * stack, 'container');
      }
      for (let k = 0; k < 6; k++) {
        const x = hx0 + 4 + rng.range(0, 52);
        const z = hz1 - 3;
        this.props.push({ id: this.props.length + 1, kind: 'crate', x, z, rot: 0, w: 1.2, d: 1.2, h: 1.2, color: 0x9a7a4a });
        this.addAabb(x - 0.6, x + 0.6, z - 0.6, z + 0.6, 1.2, 'low');
      }
      // vaultable barrier line at the yard gate
      this.props.push({ id: this.props.length + 1, kind: 'barrier', x: cx, z: hz0 + 33, rot: 0, w: 10, d: 0.6, h: 1.0, color: 0xe0b020 });
      this.addAabb(cx - 5, cx + 5, hz0 + 32.7, hz0 + 33.3, 1.0, 'low');
      return;
    }

    // lots -------------------------------------------------------------------------------------------------
    const splitX = rng.range(-8, 8);
    const splitZ = rng.range(-8, 8);
    const xs: Array<[number, number]> = [[hx0, cx + splitX - 2], [cx + splitX + 2, hx1]];
    const zs: Array<[number, number]> = [[hz0, cz + splitZ - 2], [cz + splitZ + 2, hz1]];
    let n = 0;
    for (const [x0, x1] of xs) for (const [z0, z1] of zs) {
      n++;
      if (district === 'Glassline' && i === 3 && j === 3 && n === 1) {
        this.addBuilding(x0, x1, z0, z1, 9, 'stone', district, rng, 1); // substation
        continue;
      }
      const small = rng.chance(0.14) && !(district === 'Tide Market' && j === 1 && i === 1);
      if (small) {
        // courtyard / pocket plaza left open
        this.addTree((x0 + x1) / 2, (z0 + z1) / 2);
        continue;
      }
      let h = 10;
      let style: FacadeStyle = 'stone';
      let tiers = 1;
      switch (district) {
        case 'Tide Market': h = rng.range(9, 17); style = rng.pick<FacadeStyle>(['stone', 'tile', 'deco', 'brick']); tiers = rng.chance(0.3) ? 2 : 1; break;
        case 'Foundry Row': h = rng.range(8, 13); style = rng.pick<FacadeStyle>(['brick', 'shed']); break;
        case 'Glassline': h = rng.range(22, 62); style = rng.chance(0.7) ? 'glass' : 'deco'; tiers = h > 40 ? 3 : 2; if (i === 4 && j === 4 && n === 4) { h = 96; tiers = 4; } break;
        case 'Lantern Hill': h = rng.range(9, 15) + j * 2; style = rng.pick<FacadeStyle>(['tile', 'stone', 'deco']); tiers = rng.chance(0.4) ? 2 : 1; break;
        default: h = 12;
      }
      this.addBuilding(x0, x1, z0, z1, h, style, district, rng, tiers);
    }
    // Interactive facade props (bins / cones along the sidewalks)
    for (let k = 0; k < 4; k++) {
      const side = rng.int(0, 3);
      const t = rng.range(-22, 22);
      const x = side < 2 ? cx + (side === 0 ? -32 : 32) : cx + t;
      const z = side < 2 ? cz + t : cz + (side === 2 ? -32 : 32);
      const kindP = rng.chance(0.5) ? 'bin' : 'cone';
      const hh = kindP === 'bin' ? 0.9 : 0.7;
      const ww = kindP === 'bin' ? 0.7 : 0.45;
      const p = this.addProp(kindP, x, z, 0, ww, ww, hh, kindP === 'bin' ? 0x39606b : 0xf2762e);
      const c = this.addCircle(x, z, ww / 2, hh, 'prop', true);
      p.colliderId = c.id;
    }
  }

  private addTree(x: number, z: number, avoidCanal?: { minX: number; maxX: number; minZ: number; maxZ: number }): void {
    if (avoidCanal && x > avoidCanal.minX - 2 && x < avoidCanal.maxX + 2 && z > avoidCanal.minZ - 2 && z < avoidCanal.maxZ + 2) return;
    const p = this.addProp('tree', x, z, 0, 0.6, 0.6, 6, 0x4d8a4a);
    const c = this.addCircle(x, z, 0.35, 6, 'plant');
    p.colliderId = c.id;
  }
}
