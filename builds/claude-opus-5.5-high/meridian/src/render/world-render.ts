// District visuals, streamed per 100 m cell. Each cell merges its ground, roads, sidewalks,
// markings, buildings and interiors into a handful of meshes. Cells are built in priority
// rings around the camera focus within a per-frame time budget and disabled beyond the
// view distance. Static props are thin-instanced globally.

import {
  Color3, Matrix, Mesh, MeshBuilder, Quaternion, StandardMaterial, TransformNode, Vector3, type Scene, type Material,
} from "@babylonjs/core";
import {
  CELL, CELLS, WORLD_MIN, X_LINES, Z_LINES, SIDEWALK, LANE_W, CANAL_Z0, CANAL_Z1, QUAY_Z, VIADUCT_Z, VIADUCT_H,
  hasEdgeEW, hasEdgeNS, xHalfW, zHalfW, xLanes, zLanes, terrainHeight, inHarbor, inCanal, isBridgeX, onPier, districtAt,
  cellIndexOf, type District, type Building, type PropDef,
} from "../world/district";
import { Geo, type RGB } from "./geometry";
import { facadeTextures, asphaltTexture, pavingTexture, groundTexture, corrugatedTexture, type FacadeStyle } from "./textures";
import { Rng } from "../core/math";

export interface CellVis { node: TransformNode; built: boolean; meshes: Mesh[]; roofs: Map<string, Mesh> }

const GROUND_COL: Record<string, RGB> = {
  tide: [0.72, 0.68, 0.6], foundry: [0.5, 0.48, 0.44], glassline: [0.66, 0.67, 0.68], lantern: [0.46, 0.56, 0.36],
  breakwater: [0.58, 0.58, 0.56], canal: [0.62, 0.6, 0.55],
};

export class WorldRender {
  cells: CellVis[] = [];
  mats: Record<string, StandardMaterial> = {};
  facadeMats: Record<FacadeStyle, StandardMaterial> = {} as any;
  emissiveTargets: StandardMaterial[] = [];
  lampHeads: StandardMaterial;
  propMeshes: Record<string, Mesh[]> = {};
  propIndex = new Map<number, { meshes: Mesh[]; idx: number; base: Matrix[] }>();
  interiorRoofs = new Map<string, Mesh>();
  tram: Mesh | null = null;
  buildQueue: number[] = [];
  viewDist = 360;

  constructor(private scene: Scene, private d: District, private shadowCasters: (m: Mesh) => void) {
    const mk = (name: string, color: RGB, opts: Partial<{ spec: number; tex: any; emissive: RGB; alpha: number }> = {}) => {
      const m = new StandardMaterial(name, scene);
      m.diffuseColor = new Color3(...color);
      m.specularColor = new Color3(opts.spec ?? 0.05, opts.spec ?? 0.05, opts.spec ?? 0.05);
      if (opts.tex) m.diffuseTexture = opts.tex;
      if (opts.emissive) m.emissiveColor = new Color3(...opts.emissive);
      if (opts.alpha !== undefined) m.alpha = opts.alpha;
      m.backFaceCulling = false;
      this.mats[name] = m;
      return m;
    };
    const asphalt = asphaltTexture(scene);
    mk("road", [0.9, 0.9, 0.93], { tex: asphalt, spec: 0.12 });
    mk("walk", [0.9, 0.88, 0.84], { tex: pavingTexture(scene), spec: 0.04 });
    mk("ground", [1, 1, 1], { tex: groundTexture(scene) });
    mk("plain", [1, 1, 1]);
    mk("mark", [0.95, 0.95, 0.9], { emissive: [0.18, 0.18, 0.16] });
    mk("metal", [0.7, 0.72, 0.75], { spec: 0.3 });
    mk("container", [1, 1, 1], { tex: corrugatedTexture(scene), spec: 0.1 });
    mk("glass", [0.25, 0.32, 0.38], { spec: 0.6 });
    this.lampHeads = mk("lamphead", [1, 0.95, 0.8], { emissive: [0.2, 0.18, 0.12] });
    // facade materials
    const styles: FacadeStyle[] = ["deco", "glass", "industrial", "brick", "house", "shed"];
    styles.forEach((s, i) => {
      const [dt, et] = facadeTextures(scene, s, 100 + i * 17);
      const m = mk(`facade_${s}`, [1, 1, 1], { tex: dt, spec: s === "glass" ? 0.45 : 0.06 });
      m.emissiveTexture = et;
      m.emissiveColor = new Color3(0, 0, 0);
      this.facadeMats[s] = m;
      this.emissiveTargets.push(m);
    });
    for (let i = 0; i < CELLS * CELLS; i++) {
      const node = new TransformNode(`cell${i}`, scene);
      node.setEnabled(false);
      this.cells.push({ node, built: false, meshes: [], roofs: new Map() });
    }
    this.buildProps();
    this.buildStatic();
  }

  setNight(k: number, wet: number) {
    for (const m of this.emissiveTargets) {
      const g = m === this.facadeMats.glass ? 0.42 : 0.8;
      m.emissiveColor.set(0.95 * k * g, 0.85 * k * g, 0.65 * k * g);
    }
    this.lampHeads.emissiveColor.set(0.2 + 1.1 * k, 0.18 + 0.95 * k, 0.12 + 0.6 * k);
    const road = this.mats.road;
    road.diffuseColor.set(0.9 - wet * 0.3, 0.9 - wet * 0.3, 0.93 - wet * 0.28);
    road.specularColor.set(0.12 + wet * 0.55, 0.12 + wet * 0.55, 0.12 + wet * 0.6);
    road.specularPower = 16 + wet * 80;
    this.mats.walk.specularColor.set(0.04 + wet * 0.3, 0.04 + wet * 0.3, 0.04 + wet * 0.3);
  }

  /** Streaming: build the nearest unbuilt cells within budget; toggle visibility rings. */
  update(fx: number, fz: number, vx: number, vz: number, budgetMs: number) {
    // look-ahead by velocity so cells ahead of fast vehicles are prioritized
    const lx = fx + vx * 2.5, lz = fz + vz * 2.5;
    const order: { i: number; d: number }[] = [];
    for (let i = 0; i < this.cells.length; i++) {
      const cx = WORLD_MIN + (i % CELLS) * CELL + CELL / 2, cz = WORLD_MIN + Math.floor(i / CELLS) * CELL + CELL / 2;
      const d = Math.min(Math.hypot(cx - fx, cz - fz), Math.hypot(cx - lx, cz - lz));
      const c = this.cells[i];
      const want = d < this.viewDist + 70;
      if (c.built) c.node.setEnabled(want);
      else if (d < this.viewDist + 140) order.push({ i, d });
    }
    order.sort((a, b) => a.d - b.d);
    const t0 = performance.now();
    for (const o of order) {
      if (performance.now() - t0 > budgetMs) break;
      this.buildCell(o.i);
      this.cells[o.i].node.setEnabled(o.d < this.viewDist + 70);
    }
    return order.length;
  }

  get builtCount() { return this.cells.filter((c) => c.built).length; }

  private cellRect(i: number) {
    const x0 = WORLD_MIN + (i % CELLS) * CELL, z0 = WORLD_MIN + Math.floor(i / CELLS) * CELL;
    return { x0, z0, x1: x0 + CELL, z1: z0 + CELL };
  }

  buildCell(i: number) {
    const c = this.cells[i];
    if (c.built) return;
    c.built = true;
    const r = this.cellRect(i);
    const scene = this.scene;
    const ground = new Geo(), road = new Geo(), walk = new Geo(), mark = new Geo(), plain = new Geo(), paved = new Geo();
    const cellBlocks = this.d.blocks.filter((b) => b.x1 > r.x0 && b.x0 < r.x1 && b.z1 > r.z0 && b.z0 < r.z1);
    const blockAt = (x: number, z: number) => cellBlocks.find((b) => x >= b.x0 - 0.5 && x <= b.x1 + 0.5 && z >= b.z0 - 0.5 && z <= b.z1 + 0.5);
    const facades: Record<string, Geo> = {};
    const fg = (s: string) => (facades[s] ??= new Geo());

    // --- ground grid (4 m) with vertex colors by district/surface
    const S = 4;
    for (let x = r.x0; x < r.x1; x += S) for (let z = r.z0; z < r.z1; z += S) {
      const h00 = terrainHeight(x, z), h10 = terrainHeight(x + S, z), h11 = terrainHeight(x + S, z + S), h01 = terrainHeight(x, z + S);
      const cx = x + S / 2, cz = z + S / 2;
      let col = GROUND_COL[districtAt(cx, cz)];
      const under = inHarbor(cx, cz) || inCanal(cx, cz);
      if (under) col = [0.22, 0.28, 0.3];
      else if (onPier(cx, cz) && cz < QUAY_Z) col = [0.45, 0.42, 0.38];
      const n = (Math.sin(cx * 0.13) * Math.cos(cz * 0.11)) * 0.04;
      const bk = under ? undefined : blockAt(cx, cz);
      let target = ground;
      if (bk && (bk.kind === "plaza" || bk.kind === "towers" || bk.kind === "buildings" || bk.kind === "canalside" || bk.kind === "edge")) {
        target = paved;
        col = bk.kind === "plaza" ? [0.93, 0.86, 0.74] : bk.kind === "towers" ? [0.85, 0.86, 0.87] : [0.86, 0.82, 0.76];
      } else if (bk && (bk.kind === "park" || bk.kind === "houses")) col = [0.42 + n, 0.58, 0.32];
      else if (bk && bk.kind === "warehouse") col = [0.6, 0.57, 0.52];
      else if (bk && bk.kind === "docks") { target = paved; col = [0.7, 0.7, 0.68]; }
      const cc: RGB = [col[0] + n, col[1] + n, col[2] + n];
      const us = target === paved ? 3 : 8;
      target.quad(x, h00, z, x, h01, z + S, x + S, h11, z + S, x + S, h10, z, cc, [x / us, z / us, x / us, (z + S) / us, (x + S) / us, (z + S) / us, (x + S) / us, z / us]);
    }

    // --- roads, sidewalks, markings for edges whose segments fall in this cell
    const inCell = (x: number, z: number) => x >= r.x0 && x < r.x1 && z >= r.z0 && z < r.z1;
    const SEG = 6;
    const strip = (g: Geo, ax: number, az: number, bx: number, bz: number, w0: number, w1: number, lift: number, col: RGB, curb: boolean, uvScale = 8) => {
      // centerline A->B, offsets w0..w1 to the right
      const L = Math.hypot(bx - ax, bz - az);
      const dx = (bx - ax) / L, dz = (bz - az) / L, rx = dz, rz = -dx;
      const n = Math.max(1, Math.ceil(L / SEG));
      for (let k = 0; k < n; k++) {
        const t0 = (k / n) * L, t1 = ((k + 1) / n) * L;
        const mx = ax + dx * (t0 + t1) / 2, mz = az + dz * (t0 + t1) / 2;
        if (!inCell(mx + rx * (w0 + w1) / 2, mz + rz * (w0 + w1) / 2)) continue;
        const p = (t: number, w: number): [number, number, number] => {
          const x = ax + dx * t + rx * w, z = az + dz * t + rz * w;
          return [x, terrainHeight(x, z) + lift, z];
        };
        const a = p(t0, w0), b = p(t0, w1), cpt = p(t1, w1), dpt = p(t1, w0);
        const uv: [number, number, number, number, number, number, number, number] = [a[0] / uvScale, a[2] / uvScale, b[0] / uvScale, b[2] / uvScale, cpt[0] / uvScale, cpt[2] / uvScale, dpt[0] / uvScale, dpt[2] / uvScale];
        g.quad(...a, ...b, ...cpt, ...dpt, col, uv);
        if (curb) {
          // curb face on the inner edge (w0) down to road level
          const a2: [number, number, number] = [a[0], a[1] - lift, a[2]], d2: [number, number, number] = [dpt[0], dpt[1] - lift, dpt[2]];
          g.quad(...a2, ...a, ...dpt, ...d2, [0.7, 0.69, 0.66]);
        }
      }
    };
    const roadCol: RGB = [1, 1, 1];
    const walkCol: RGB = [1, 1, 1];
    for (let ii = 0; ii < 9; ii++) for (let j = 0; j < 8; j++) {
      if (!hasEdgeNS(ii, j)) continue;
      const X = X_LINES[ii], hw = xHalfW(ii);
      const za = Z_LINES[j], zb = Z_LINES[j + 1];
      strip(road, X, za, X, zb, -hw, hw, 0.03, roadCol, false);
      // sidewalks both sides (skip across intersections handled by node squares)
      const zs = za + zHalfW(j) * (hasEdgeEW(ii, j) || hasEdgeEW(ii - 1, j) ? 1 : 0), ze = zb - zHalfW(j + 1) * (hasEdgeEW(ii, j + 1) || hasEdgeEW(ii - 1, j + 1) ? 1 : 0);
      strip(walk, X, zs, X, ze, hw, hw + SIDEWALK, 0.15, walkCol, true, 4);
      strip(walk, X, ze, X, zs, hw, hw + SIDEWALK, 0.15, walkCol, true, 4);
      // markings: center line (double yellow on arterials), lane dashes
      const lanes = xLanes(ii);
      const m0 = za + zHalfW(j) + 4, m1 = zb - zHalfW(j + 1) - 4;
      if (lanes > 1) { strip(mark, X, m0, X, m1, -0.25, -0.1, 0.05, [0.95, 0.78, 0.2], false); strip(mark, X, m0, X, m1, 0.1, 0.25, 0.05, [0.95, 0.78, 0.2], false); }
      for (let z = m0; z < m1 - 3; z += 9) {
        if (lanes === 1) strip(mark, X, z, X, z + 3, -0.08, 0.08, 0.05, [0.95, 0.95, 0.9], false);
        else { strip(mark, X, z, X, z + 3, LANE_W - 0.08, LANE_W + 0.08, 0.05, [0.95, 0.95, 0.9], false); strip(mark, X, z + 3, X, z, LANE_W - 0.08, LANE_W + 0.08, 0.05, [0.95, 0.95, 0.9], false); }
      }
    }
    for (let j = 0; j < 9; j++) for (let ii = 0; ii < 8; ii++) {
      if (!hasEdgeEW(ii, j)) continue;
      const Z = Z_LINES[j], hw = zHalfW(j);
      const xa = X_LINES[ii], xb = X_LINES[ii + 1];
      strip(road, xa, Z, xb, Z, -hw, hw, 0.03, roadCol, false);
      const xs = xa + xHalfW(ii) * (hasEdgeNS(ii, j) || hasEdgeNS(ii, j - 1) ? 1 : 0), xe = xb - xHalfW(ii + 1) * (hasEdgeNS(ii + 1, j) || hasEdgeNS(ii + 1, j - 1) ? 1 : 0);
      strip(walk, xs, Z, xe, Z, hw, hw + SIDEWALK, 0.15, walkCol, true, 4);
      strip(walk, xe, Z, xs, Z, hw, hw + SIDEWALK, 0.15, walkCol, true, 4);
      const lanes = zLanes(j);
      const m0 = xa + xHalfW(ii) + 4, m1 = xb - xHalfW(ii + 1) - 4;
      if (lanes > 1) { strip(mark, m0, Z, m1, Z, -0.25, -0.1, 0.05, [0.95, 0.78, 0.2], false); strip(mark, m0, Z, m1, Z, 0.1, 0.25, 0.05, [0.95, 0.78, 0.2], false); }
      for (let x = m0; x < m1 - 3; x += 9) {
        if (lanes === 1) strip(mark, x, Z, x + 3, Z, -0.08, 0.08, 0.05, [0.95, 0.95, 0.9], false);
        else { strip(mark, x, Z, x + 3, Z, LANE_W - 0.08, LANE_W + 0.08, 0.05, [0.95, 0.95, 0.9], false); strip(mark, x + 3, Z, x, Z, LANE_W - 0.08, LANE_W + 0.08, 0.05, [0.95, 0.95, 0.9], false); }
      }
    }
    // intersections: asphalt squares + crosswalk stripes + corner sidewalk pads
    for (let ii = 0; ii < 9; ii++) for (let j = 0; j < 9; j++) {
      const X = X_LINES[ii], Z = Z_LINES[j];
      if (!inCell(X, Z)) continue;
      const ns = hasEdgeNS(ii, j) || hasEdgeNS(ii, j - 1), ew = hasEdgeEW(ii, j) || hasEdgeEW(ii - 1, j);
      if (!ns && !ew) continue;
      const hx = ns ? xHalfW(ii) : 0, hz = ew ? zHalfW(j) : 0;
      if (ns && ew) strip(road, X - hx, Z, X + hx, Z, -hz, hz, 0.035, roadCol, false);
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const x0 = X + sx * hx, z0 = Z + sz * hz;
        const x1 = x0 + sx * SIDEWALK, z1 = z0 + sz * SIDEWALK;
        const ax = Math.min(x0, x1), bx = Math.max(x0, x1), az = Math.min(z0, z1), bz = Math.max(z0, z1);
        const h = terrainHeight((ax + bx) / 2, (az + bz) / 2) + 0.15;
        walk.quad(ax, h, az, ax, h, bz, bx, h, bz, bx, h, az, walkCol, [ax / 4, az / 4, ax / 4, bz / 4, bx / 4, bz / 4, bx / 4, az / 4]);
      }
      // zebra crossings on each arm
      const arms: [boolean, number, number][] = [[hasEdgeNS(ii, j), 0, 1], [hasEdgeNS(ii, j - 1), 0, -1], [hasEdgeEW(ii, j), 1, 0], [hasEdgeEW(ii - 1, j), -1, 0]];
      for (const [has, ax, az] of arms) {
        if (!has) continue;
        if (az !== 0) {
          const zc = Z + az * (hz + 1.6);
          for (let x = X - hx + 0.5; x < X + hx - 0.5; x += 1.2) strip(mark, x, zc - 1.3, x, zc + 1.3, -0.3, 0.3, 0.05, [0.95, 0.95, 0.92], false);
          strip(mark, X, zc + az * 1.8, X + (az > 0 ? -hx : hx), zc + az * 1.8, -0.2, 0.2, 0.05, [0.95, 0.95, 0.92], false);
        } else {
          const xc = X + ax * (hx + 1.6);
          for (let z = Z - hz + 0.5; z < Z + hz - 0.5; z += 1.2) strip(mark, xc - 1.3, z, xc + 1.3, z, -0.3, 0.3, 0.05, [0.95, 0.95, 0.92], false);
        }
      }
    }
    // promenade along the quay and bike path along the canal
    for (let x = r.x0; x < r.x1; x += 10) {
      if (r.z0 <= QUAY_Z && r.z1 > QUAY_Z) {
        const z0 = QUAY_Z, z1 = Z_LINES[0] - zHalfW(0) - SIDEWALK;
        if (!onPier(x + 5, QUAY_Z - 1) || true) walk.quad(x, 0.12, z0, x, 0.12, z1, x + 10, 0.12, z1, x + 10, 0.12, z0, [0.85, 0.8, 0.72], [x / 4, z0 / 4, x / 4, z1 / 4, (x + 10) / 4, z1 / 4, (x + 10) / 4, z0 / 4]);
        // quay wall
        plain.quad(x, -6, QUAY_Z, x, 0.14, QUAY_Z, x + 10, 0.14, QUAY_Z, x + 10, -6, QUAY_Z, [0.55, 0.5, 0.45]);
      }
      if (r.z0 <= CANAL_Z0 && r.z1 > CANAL_Z1) {
        if (!isBridgeX(x + 5)) {
          walk.quad(x, 0.1, CANAL_Z1, x, 0.1, CANAL_Z1 + 4.5, x + 10, 0.1, CANAL_Z1 + 4.5, x + 10, 0.1, CANAL_Z1, [0.62, 0.7, 0.66], [x / 4, 0, x / 4, 1, (x + 10) / 4, 1, (x + 10) / 4, 0]);
          walk.quad(x, 0.1, CANAL_Z0 - 1.5, x, 0.1, CANAL_Z0, x + 10, 0.1, CANAL_Z0, x + 10, 0.1, CANAL_Z0 - 1.5, [0.8, 0.76, 0.7]);
          for (const zz of [CANAL_Z0, CANAL_Z1]) plain.quad(x, -3, zz, x, 0.12, zz, x + 10, 0.12, zz, x + 10, -3, zz, [0.5, 0.48, 0.42]);
          // railings
          for (const zz of [CANAL_Z0 - 0.15, CANAL_Z1 + 0.15]) { plain.box(x, 0.95, zz - 0.06, x + 10, 1.05, zz + 0.06, [0.12, 0.42, 0.42]); for (let px = x; px < x + 10; px += 2.5) plain.box(px - 0.04, 0, zz - 0.04, px + 0.04, 1, zz + 0.04, [0.12, 0.42, 0.42]); }
        }
      }
    }
    // bridges: deck sides & arches
    for (let ii = 0; ii < 9; ii++) {
      if (!hasEdgeNS(ii, 4)) continue;
      const X = X_LINES[ii], hw = xHalfW(ii) + SIDEWALK;
      if (!inCell(X, 50)) continue;
      for (const s of [-1, 1]) {
        plain.box(X + s * hw - 0.25, 0, CANAL_Z0, X + s * hw + 0.25, 1.1, CANAL_Z1, [0.55, 0.62, 0.6]);
        plain.quad(X + s * hw, -3, CANAL_Z0, X + s * hw, 0, CANAL_Z0, X + s * hw, 0, CANAL_Z1, X + s * hw, -3, CANAL_Z1, [0.5, 0.47, 0.42]);
      }
      plain.box(X - hw, -0.6, CANAL_Z0, X + hw, 0, CANAL_Z1, [0.5, 0.5, 0.48], { top: false, bottom: true });
    }

    // --- buildings
    const rng = new Rng(i * 977 + 5);
    for (const b of this.d.buildings) {
      if (b.cell !== i) continue;
      this.addBuilding(b, fg(b.style), plain, rng);
    }
    // --- interiors whose center is in this cell
    for (const it of this.d.interiors) {
      if (cellIndexOf((it.x0 + it.x1) / 2, (it.z0 + it.z1) / 2) !== i) continue;
      const roof = new Geo();
      const y0 = it.baseY, y1 = it.baseY + it.h;
      for (const col of this.d.colliders) {
        if (col.interior !== it.id) continue;
        plain.box(col.x0, y0, col.z0, col.x1, y1, col.z1, it.color);
      }
      plain.quad(it.x0, y0 + 0.08, it.z0, it.x0, y0 + 0.08, it.z1, it.x1, y0 + 0.08, it.z1, it.x1, y0 + 0.08, it.z0, it.floor);
      roof.box(it.x0 - 0.3, y1, it.z0 - 0.3, it.x1 + 0.3, y1 + 0.35, it.z1 + 0.3, [0.42, 0.36, 0.32]);
      // sign band over doors
      for (const dr of it.doors) {
        const horizontal = dr.side === "n" || dr.side === "s";
        const fixed = dr.side === "n" ? it.z1 : dr.side === "s" ? it.z0 : dr.side === "e" ? it.x1 : it.x0;
        const mid = (horizontal ? (it.x0 + it.x1) / 2 : (it.z0 + it.z1) / 2) + dr.offset;
        const out = dr.side === "n" || dr.side === "e" ? 1 : -1;
        if (horizontal) plain.box(mid - dr.width / 2 - 0.4, y0 + 2.6, fixed + out * 0.2 - 0.15, mid + dr.width / 2 + 0.4, y0 + 3.1, fixed + out * 0.2 + 0.15, [0.95, 0.6, 0.2]);
        else plain.box(fixed + out * 0.2 - 0.15, y0 + 2.6, mid - dr.width / 2 - 0.4, fixed + out * 0.2 + 0.15, y0 + 3.1, mid + dr.width / 2 + 0.4, [0.95, 0.6, 0.2]);
      }
      this.interiorFurniture(it.id, plain, y0);
      const rm = roof.build(`roof_${it.id}`, scene, this.mats.plain);
      if (rm) { rm.parent = c.node; this.interiorRoofs.set(it.id, rm); this.shadowCasters(rm); c.meshes.push(rm); }
    }

    const add = (g: Geo, name: string, mat: Material, shadow = false, receive = true) => {
      const m = g.build(`${name}_${i}`, scene, mat);
      if (!m) return;
      m.parent = c.node;
      m.receiveShadows = receive;
      m.freezeWorldMatrix();
      m.isPickable = false;
      if (shadow) this.shadowCasters(m);
      c.meshes.push(m);
    };
    add(ground, "ground", this.mats.ground);
    add(paved, "paved", this.mats.walk);
    add(road, "road", this.mats.road);
    add(walk, "walk", this.mats.walk);
    add(mark, "mark", this.mats.mark);
    add(plain, "plain", this.mats.plain, true);
    for (const [s, g] of Object.entries(facades)) add(g, `fac_${s}`, this.facadeMats[s as FacadeStyle], true);
  }

  private addBuilding(b: Building, g: Geo, plain: Geo, rng: Rng) {
    const { x0, x1, z0, z1, baseY, topY } = b;
    const c = b.color;
    const style = b.style;
    // facade texture covers 4 bays: 16 m wide, 14 m tall
    const uvU = style === "glass" ? 12 : 16, uvV = style === "glass" ? 14 : 14;
    if (b.landmark === "Tide Clock") {
      plain.box(x0, baseY, z0, x1, topY - 6, z1, [0.9, 0.82, 0.68]);
      plain.box(x0 - 0.5, topY - 6, z0 - 0.5, x1 + 0.5, topY - 1, z1 + 0.5, [0.78, 0.62, 0.42]);
      for (const [fx, fz, nx, nz] of [[0, -1, 0, -1], [0, 1, 0, 1], [-1, 0, -1, 0], [1, 0, 1, 0]]) {
        const cx = (x0 + x1) / 2 + fx * 3.55, cz = (z0 + z1) / 2 + fz * 3.55;
        plain.box(cx - (nz ? 1.6 : 0.05), topY - 5.2, cz - (nx ? 1.6 : 0.05), cx + (nz ? 1.6 : 0.05), topY - 2, cz + (nx ? 1.6 : 0.05), [0.98, 0.96, 0.88]);
      }
      plain.cyl((x0 + x1) / 2, topY - 1, (z0 + z1) / 2, 3.6, 5, [0.25, 0.55, 0.5], 8, 0.2);
      return;
    }
    if (b.landmark === "The Lantern" || b.landmark === "Breakwater Light") {
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      const light = b.landmark === "Breakwater Light";
      plain.cyl(cx, baseY, cz, 2.8, topY - baseY - 4, light ? [0.95, 0.95, 0.92] : [0.72, 0.5, 0.36], 10, 2.2);
      if (light) for (let k = 0; k < 4; k++) plain.cyl(cx, baseY + 4 + k * 6, cz, 2.75 - k * 0.12, 2, [0.85, 0.2, 0.18], 10, 2.7 - k * 0.12);
      plain.cyl(cx, topY - 4, cz, 2.0, 3, [0.95, 0.85, 0.5], 8);
      plain.cyl(cx, topY - 1, cz, 2.4, 2.2, [0.25, 0.55, 0.5], 8, 0.1);
      this.beacons.push({ x: cx, y: topY - 2.5, z: cz });
      return;
    }
    g.box(x0, baseY, z0, x1, topY, z1, c, { uvU, uvV, top: false });
    // roof
    const roof: RGB = style === "glass" ? [0.4, 0.44, 0.48] : style === "house" ? [0.72, 0.38, 0.28] : b.roof;
    if (style === "house" && x1 - x0 < 16 && z1 - z0 < 16) {
      // pitched roof
      const ridgeX = x1 - x0 > z1 - z0;
      const h = 2.2;
      if (ridgeX) {
        const zm = (z0 + z1) / 2;
        plain.quad(x0, topY, z0, x0, topY + h, zm, x1, topY + h, zm, x1, topY, z0, roof);
        plain.quad(x1, topY, z1, x1, topY + h, zm, x0, topY + h, zm, x0, topY, z1, roof);
        plain.quad(x0, topY, z0, x0, topY, z1, x0, topY + h, zm, x0, topY + h, zm, c);
        plain.quad(x1, topY, z1, x1, topY, z0, x1, topY + h, zm, x1, topY + h, zm, c);
      } else {
        const xm = (x0 + x1) / 2;
        plain.quad(x0, topY, z1, xm, topY + h, z1, xm, topY + h, z0, x0, topY, z0, roof);
        plain.quad(x1, topY, z0, xm, topY + h, z0, xm, topY + h, z1, x1, topY, z1, roof);
        plain.quad(x0, topY, z0, xm, topY + h, z0, xm, topY + h, z0, x1, topY, z0, c);
        plain.quad(x1, topY, z1, xm, topY + h, z1, xm, topY + h, z1, x0, topY, z1, c);
      }
    } else {
      plain.quad(x0, topY, z0, x0, topY, z1, x1, topY, z1, x1, topY, z0, roof);
      // parapet
      const p = 0.35, ph = style === "glass" ? 1.2 : 0.8;
      const pc: RGB = [c[0] * 0.85, c[1] * 0.85, c[2] * 0.85];
      plain.box(x0, topY, z0, x1, topY + ph, z0 + p, pc); plain.box(x0, topY, z1 - p, x1, topY + ph, z1, pc);
      plain.box(x0, topY, z0, x0 + p, topY + ph, z1, pc); plain.box(x1 - p, topY, z0, x1, topY + ph, z1, pc);
      // rooftop clutter
      const n = Math.floor(((x1 - x0) * (z1 - z0)) / 180);
      for (let k = 0; k < Math.min(4, n); k++) {
        const ux = rng.range(x0 + 2, x1 - 3), uz = rng.range(z0 + 2, z1 - 3);
        if (rng.chance(0.5)) plain.box(ux, topY, uz, ux + 1.6, topY + 1.2, uz + 1.2, [0.7, 0.72, 0.74]);
        else plain.cyl(ux, topY, uz, 0.9, 2.2, [0.55, 0.42, 0.32], 8);
      }
      if (b.landmark === "Meridian Spire") plain.cyl((x0 + x1) / 2, topY, (z0 + z1) / 2, 0.6, 22, [0.8, 0.82, 0.85], 6, 0.1);
      if (style === "glass" && topY - baseY > 40) {
        // horizontal fins every few floors
        for (let y = baseY + 14; y < topY - 2; y += 14) plain.box(x0 - 0.3, y, z0 - 0.3, x1 + 0.3, y + 0.4, z1 + 0.3, [0.85, 0.87, 0.9], { top: true, bottom: true });
      }
    }
    // ground floor awnings in the market & canal
    if ((b.style === "deco" || b.style === "brick") && rng.chance(0.6)) {
      const awn: RGB = rng.pick([[0.85, 0.3, 0.25], [0.2, 0.5, 0.55], [0.95, 0.75, 0.3], [0.35, 0.55, 0.35]] as RGB[]);
      const y = baseY + 3.2 + Math.max(0, terrainHeight((x0 + x1) / 2, (z0 + z1) / 2) - baseY - 0.5);
      // pick the face pointing to the nearest road
      const w = 1.4;
      const cxm = (x0 + x1) / 2, czm = (z0 + z1) / 2;
      const nearX = X_LINES.reduce((a, v) => (Math.abs(v - cxm) < Math.abs(a - cxm) ? v : a));
      const nearZ = Z_LINES.reduce((a, v) => (Math.abs(v - czm) < Math.abs(a - czm) ? v : a));
      if (Math.abs(nearX - cxm) < Math.abs(nearZ - czm)) {
        const fx = nearX > cxm ? x1 : x0, s = nearX > cxm ? 1 : -1;
        plain.quad(fx, y, z0 + 1, fx + s * w, y - 0.5, z0 + 1, fx + s * w, y - 0.5, z1 - 1, fx, y, z1 - 1, awn);
      } else {
        const fz = nearZ > czm ? z1 : z0, s = nearZ > czm ? 1 : -1;
        plain.quad(x0 + 1, y, fz, x0 + 1, y - 0.5, fz + s * w, x1 - 1, y - 0.5, fz + s * w, x1 - 1, y, fz, awn);
      }
    }
  }

  beacons: { x: number; y: number; z: number }[] = [];

  private interiorFurniture(id: string, g: Geo, y0: number) {
    const B = (x0: number, z0: number, x1: number, z1: number, h: number, c: RGB) => g.box(x0, y0, z0, x1, y0 + h, z1, c);
    switch (id) {
      case "safehouse":
        B(-61.5, 76, -57, 78.5, 0.55, [0.35, 0.45, 0.6]); // bed
        B(-52.5, 76.2, -49.5, 76.6, 2, [0.6, 0.45, 0.3]); // mission board
        B(-61.6, 85, -60.4, 88.5, 2, [0.4, 0.42, 0.45]); // locker
        B(-56, 84, -52, 86, 0.8, [0.55, 0.38, 0.25]); // table
        break;
      case "store":
        B(26, -125.5, 34, -124.6, 1.05, [0.3, 0.5, 0.55]);
        for (let x = 23; x < 37; x += 3.2) B(x, -127.6, x + 2, -126.8, 1.9, [0.8, 0.75, 0.6]);
        break;
      case "kiosk":
        B(-33.5, -257.6, -26.5, -257, 1.6, [0.9, 0.8, 0.6]);
        break;
      case "garage":
        B(-160.5, -347, -158, -333, 1.2, [0.5, 0.3, 0.2]);
        B(-152, -341, -148, -339, 0.25, [0.9, 0.7, 0.15]);
        break;
      case "police":
        B(244, -126, 256, -125, 1.1, [0.25, 0.32, 0.45]);
        B(240, -131, 243, -129, 0.5, [0.4, 0.4, 0.42]);
        break;
      case "warehouse":
        for (const [x, z] of [[-320, -152], [-312, -144], [-305, -160], [-300, -152], [-293, -140], [-283, -150], [-316, -141]]) B(x - 1.2, z - 1.2, x + 1.2, z + 1.2, 1.25, [0.62, 0.48, 0.3]);
        B(-319.5, -163, -316.5, -162, 1, [0.4, 0.35, 0.3]);
        B(-298.5, -137.5, -295.5, -136.5, 1, [0.4, 0.35, 0.3]);
        B(-282.5, -163, -279.5, -162, 1, [0.4, 0.35, 0.3]);
        break;
      case "portoffice":
        B(241, -320.5, 248, -319.5, 1.0, [0.25, 0.3, 0.35]);
        for (let z = -322; z < -314; z += 2.4) B(258.5, z, 260.5, z + 1.6, 2.1, [0.18, 0.2, 0.24]);
        B(238, -310.5, 243, -309.5, 0.9, [0.4, 0.4, 0.42]);
        break;
    }
  }

  /** Interior furniture colliders mirror the boxes above (simple cover). */
  static furnitureColliders(): { x0: number; z0: number; x1: number; z1: number; h: number }[] {
    const out: { x0: number; z0: number; x1: number; z1: number; h: number }[] = [];
    for (const [x, z] of [[-320, -152], [-312, -144], [-305, -160], [-300, -152], [-293, -140], [-283, -150], [-316, -141]]) out.push({ x0: x - 1.2, z0: z - 1.2, x1: x + 1.2, z1: z + 1.2, h: 1.25 });
    out.push({ x0: 241, z0: -320.5, x1: 248, z1: -319.5, h: 1 });
    out.push({ x0: 26, z0: -125.5, x1: 34, z1: -124.6, h: 1.05 });
    return out;
  }

  setInteriorView(inside: string | null) {
    for (const [id, m] of this.interiorRoofs) m.setEnabled(id !== inside);
  }

  // ---------------------------------------------------------- static scenery (always loaded, cheap)

  private buildStatic() {
    const scene = this.scene;
    // viaduct deck + tram
    const g = new Geo();
    for (let x = -445; x < 445; x += 25) {
      const x1 = Math.min(445, x + 25);
      g.box(x, VIADUCT_H, VIADUCT_Z - 2.2, x1, VIADUCT_H + 0.9, VIADUCT_Z + 2.2, [0.66, 0.62, 0.56], { bottom: true });
      g.box(x, VIADUCT_H + 0.9, VIADUCT_Z - 2.2, x1, VIADUCT_H + 1.6, VIADUCT_Z - 2.0, [0.25, 0.5, 0.48]);
      g.box(x, VIADUCT_H + 0.9, VIADUCT_Z + 2.0, x1, VIADUCT_H + 1.6, VIADUCT_Z + 2.2, [0.25, 0.5, 0.48]);
    }
    for (const c of this.d.colliders) if (c.kind === "pillar" && Math.abs((c.z0 + c.z1) / 2 - VIADUCT_Z) < 1) g.box(c.x0, terrainHeight(c.x0, c.z0) - 0.5, c.z0, c.x1, VIADUCT_H, c.z1, [0.6, 0.57, 0.52]);
    // tram stop platform over the plaza
    g.box(-66, VIADUCT_H + 0.9, VIADUCT_Z + 2.2, -38, VIADUCT_H + 1.1, VIADUCT_Z + 4.5, [0.7, 0.68, 0.62]);
    g.box(-66, VIADUCT_H + 3.4, VIADUCT_Z + 2.2, -38, VIADUCT_H + 3.6, VIADUCT_Z + 4.5, [0.25, 0.55, 0.5]);
    // piers
    g.box(-330, -6, -452, -270, 0, QUAY_Z, [0.5, 0.47, 0.43], { top: false });
    g.box(140, -6, -452, 160, 0, QUAY_Z, [0.5, 0.47, 0.43], { top: false });
    const m = g.build("viaduct", scene, this.mats.plain)!;
    m.receiveShadows = true; m.freezeWorldMatrix(); this.shadowCasters(m);
    const tg = new Geo();
    tg.box(-9, 0.2, -1.4, 9, 3.2, 1.4, [0.92, 0.9, 0.82]);
    tg.box(-9.05, 1.5, -1.45, 9.05, 2.6, 1.45, [0.2, 0.3, 0.35], { top: false });
    tg.box(-9, 0.2, -1.42, 9, 0.8, 1.42, [0.15, 0.5, 0.48], { top: false });
    this.tram = tg.build("tram", scene, this.mats.plain)!;
    this.shadowCasters(this.tram);
  }

  updateTram(t: number) {
    if (!this.tram) return;
    // shuttle along the viaduct with a stop over the plaza
    const L = 860, speed = 12;
    const period = (L / speed) * 2 + 24;
    let ph = t % period;
    let x: number;
    const stopX = -52;
    const seg = L / speed;
    if (ph < seg) x = -430 + ph * speed;
    else if (ph < seg + 12) x = 430;
    else if (ph < seg * 2 + 12) x = 430 - (ph - seg - 12) * speed;
    else x = -430;
    // dwell at plaza stop (smooth slow-down approximation)
    if (Math.abs(x - stopX) < 30) x = stopX + (x - stopX) * Math.min(1, Math.abs(x - stopX) / 30);
    this.tram.position.set(x, VIADUCT_H + 0.9, VIADUCT_Z);
  }

  // ---------------------------------------------------------- props (thin instances)

  private buildProps() {
    const scene = this.scene;
    const defs: Record<string, { parts: { g: Geo; mat: Material }[] }> = {};
    const part = (type: string, mat: Material, fill: (g: Geo) => void) => {
      const g = new Geo(); fill(g);
      (defs[type] ??= { parts: [] }).parts.push({ g, mat });
    };
    part("lamp", this.mats.plain, (g) => { g.cyl(0, 0, 0, 0.09, 5.6, [0.22, 0.32, 0.32], 6); g.box(-0.05, 5.5, 0, 0.05, 5.6, 1.3, [0.22, 0.32, 0.32]); });
    part("lamp", this.lampHeads, (g) => g.box(-0.22, 5.3, 1.0, 0.22, 5.5, 1.6, [1, 1, 1]));
    part("bin", this.mats.plain, (g) => g.cyl(0, 0, 0, 0.32, 0.95, [0.2, 0.42, 0.35], 8));
    part("hydrant", this.mats.plain, (g) => { g.cyl(0, 0, 0, 0.15, 0.7, [0.85, 0.25, 0.15], 6); g.box(-0.25, 0.4, -0.06, 0.25, 0.52, 0.06, [0.85, 0.25, 0.15]); });
    part("bench", this.mats.plain, (g) => { g.box(-0.9, 0.42, -0.25, 0.9, 0.5, 0.25, [0.55, 0.38, 0.22]); g.box(-0.9, 0.5, 0.2, 0.9, 0.95, 0.27, [0.55, 0.38, 0.22]); g.box(-0.85, 0, -0.2, -0.75, 0.42, 0.2, [0.2, 0.2, 0.2]); g.box(0.75, 0, -0.2, 0.85, 0.42, 0.2, [0.2, 0.2, 0.2]); });
    part("cone", this.mats.plain, (g) => g.cyl(0, 0, 0, 0.22, 0.75, [0.95, 0.45, 0.1], 6, 0.03));
    part("barrier", this.mats.plain, (g) => { g.box(-1, 0, -0.25, 1, 0.9, 0.25, [0.9, 0.9, 0.88]); g.box(-1, 0.55, -0.26, 1, 0.75, 0.26, [0.85, 0.25, 0.2]); });
    part("crate", this.mats.plain, (g) => { g.box(-0.6, 0, -0.6, 0.6, 1.1, 0.6, [0.6, 0.45, 0.28]); g.box(-0.62, 0.45, -0.62, 0.62, 0.6, 0.62, [0.45, 0.33, 0.2]); });
    part("planter", this.mats.plain, (g) => { g.box(-1, 0, -1, 1, 0.7, 1, [0.75, 0.6, 0.45]); g.box(-0.85, 0.7, -0.85, 0.85, 1.2, 0.85, [0.3, 0.55, 0.3]); });
    part("bollard", this.mats.plain, (g) => g.cyl(0, 0, 0, 0.22, 0.8, [0.2, 0.22, 0.24], 8, 0.18));
    part("tree", this.mats.plain, (g) => { g.cyl(0, 0, 0, 0.18, 2.6, [0.4, 0.3, 0.22], 6, 0.12); });
    part("tree", this.mats.plain, (g) => { g.cyl(0, 2.0, 0, 1.9, 2.2, [0.32, 0.55, 0.3], 8, 1.3); g.cyl(0, 4.2, 0, 1.3, 1.6, [0.38, 0.62, 0.34], 8, 0.2); });
    part("stall", this.mats.plain, (g) => {
      g.box(-1.6, 0, -1.1, 1.6, 0.95, 1.1, [0.55, 0.42, 0.3]);
      for (const [x, z] of [[-1.55, -1.05], [1.55, -1.05], [-1.55, 1.05], [1.55, 1.05]]) g.box(x - 0.05, 0, z - 0.05, x + 0.05, 2.5, z + 0.05, [0.3, 0.3, 0.3]);
      g.box(-0.9, 0.95, -0.6, 0.9, 1.25, 0.6, [0.9, 0.6, 0.3]);
    });
    part("stall", this.mats.plain, (g) => g.quad(-1.8, 2.7, -1.4, -1.8, 2.3, 1.4, 1.8, 2.3, 1.4, 1.8, 2.7, -1.4, [1, 1, 1])); // awning: instance-colored
    part("container", this.mats.container, (g) => g.box(-1.22, 0, -6.05, 1.22, 2.59, 6.05, [1, 1, 1], { uvU: 2.44, uvV: 2.59 }));
    part("crane", this.mats.plain, (g) => {
      const c: RGB = [0.9, 0.55, 0.15];
      for (const [x, z] of [[-6, -4], [6, -4], [-6, 4], [6, 4]]) g.box(x - 0.5, 0, z - 0.5, x + 0.5, 28, z + 0.5, c);
      g.box(-6.5, 26, -4.5, 6.5, 28, 4.5, c);
      g.box(-1, 28, -30, 1, 30, 18, c);
      g.box(-2, 30, -2, 2, 34, 2, [0.85, 0.85, 0.82]);
      g.box(-1.5, 22, -24, 1.5, 24, -21, [0.3, 0.3, 0.32]);
    });

    // instance matrices
    const byType = new Map<string, PropDef[]>();
    for (const p of this.d.props) { if (!byType.has(p.type)) byType.set(p.type, []); byType.get(p.type)!.push(p); }
    for (const [type, list] of byType) {
      const def = defs[type];
      if (!def) continue;
      const meshes: Mesh[] = [];
      def.parts.forEach((pt, k) => {
        const m = pt.g.build(`prop_${type}_${k}`, scene, pt.mat)!;
        const count = type === "container" ? list.reduce((a, p) => a + (p.stack ?? 1), 0) : list.length;
        const buf = new Float32Array(count * 16);
        const colors = new Float32Array(count * 4);
        let n = 0;
        list.forEach((p) => {
          const stack = type === "container" ? p.stack ?? 1 : 1;
          for (let s = 0; s < stack; s++) {
            const mat = Matrix.Compose(new Vector3(1, 1, 1), Quaternion.RotationYawPitchRoll(p.yaw, 0, 0), new Vector3(p.x, p.y + s * 2.6, p.z));
            mat.copyToArray(buf, n * 16);
            const c = p.color ?? [1, 1, 1];
            const tint = type === "stall" && k === 0 ? [1, 1, 1] : c;
            colors.set([tint[0], tint[1], tint[2], 1], n * 4);
            if (s === 0 && k === 0) this.propIndex.set(p.id, { meshes, idx: n, base: [] });
            n++;
          }
        });
        m.thinInstanceSetBuffer("matrix", buf, 16, false);
        m.thinInstanceSetBuffer("color", colors, 4, true);
        m.receiveShadows = true;
        m.isPickable = false;
        m.alwaysSelectAsActiveMesh = true;
        if (type === "tree" || type === "crane" || type === "container" || type === "stall" || type === "lamp") this.shadowCasters(m);
        meshes.push(m);
      });
      this.propMeshes[type] = meshes;
    }
  }

  /** Apply knocked-over transforms for breakable props. */
  updateProps(list: { def: PropDef; knocked: boolean; ox: number; oz: number; tilt: number; tiltDir: number; dirty: boolean }[]) {
    const m = new Matrix();
    const tmp = new Float32Array(16);
    const touched = new Set<Mesh>();
    for (const p of list) {
      if (!p.dirty) continue;
      p.dirty = false;
      const info = this.propIndex.get(p.def.id);
      if (!info) continue;
      const q = Quaternion.RotationYawPitchRoll(p.def.yaw, 0, 0);
      if (p.tilt > 0) {
        const axis = new Vector3(Math.cos(p.tiltDir), 0, -Math.sin(p.tiltDir));
        q.multiplyInPlace(Quaternion.RotationAxis(axis, p.tilt));
        // note: approximate composition order is fine for cosmetic knockdowns
      }
      Matrix.ComposeToRef(new Vector3(1, 1, 1), p.tilt > 0 ? Quaternion.RotationAxis(new Vector3(Math.cos(p.tiltDir), 0, -Math.sin(p.tiltDir)), p.tilt).multiply(Quaternion.RotationYawPitchRoll(p.def.yaw, 0, 0)) : q,
        new Vector3(p.def.x + p.ox, p.def.y, p.def.z + p.oz), m);
      m.copyToArray(tmp, 0);
      for (const mesh of info.meshes) { mesh.thinInstanceSetMatrixAt(info.idx, m, false); touched.add(mesh); }
    }
    for (const mesh of touched) mesh.thinInstanceBufferUpdated("matrix");
  }

  dispose() { for (const c of this.cells) c.node.dispose(); }
}

export { MeshBuilder };
