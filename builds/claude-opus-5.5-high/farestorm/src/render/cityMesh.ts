// Builds Galeport's static scene from World data: terrain, roads, sidewalks, buildings, landmarks,
// shortcut set pieces, water, trees, containers, signals and signage. Everything is merged into a
// small number of meshes to keep draw calls low.

import {
  Color3, Matrix, Mesh, MeshBuilder, Quaternion, StandardMaterial, TransformNode, Vector3, type Scene, type ShadowGenerator,
} from "@babylonjs/core";
import { baseTerrain, type World } from "../sim/world/city";
import { BOUNDS, CANAL } from "../sim/world/layout";
import type { Destination, District } from "../sim/world/types";
import { smoothstep } from "../sim/math";
import { hash01 } from "../sim/rng";
import { Geo, hex, mix, polyPoints, scale, starPoints, type RGB } from "./geo";
import {
  chevronTexture, groundTexture, plainAsphalt, roadTexture, sidewalkTexture, signTexture, waterNormal, windowTexture,
} from "./textures";

export interface CityMeshes {
  ferris: Mesh[];
  signalHeads: { mesh: Mesh; nodes: { node: number; axis: 0 | 1 }[]; colors: Float32Array };
  water: StandardMaterial;
  lit: StandardMaterial;
  glow: StandardMaterial;
  beacons: Mesh[];
}

export function litMaterial(scene: Scene, name: string, spec = 0.12): StandardMaterial {
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = Color3.White();
  m.specularColor = new Color3(spec, spec, spec);
  m.specularPower = 32;
  m.backFaceCulling = false;
  return m;
}
export function glowMaterial(scene: Scene, name: string): StandardMaterial {
  // "Unlit" look via full emissive: final = clamp(emissive) * vertexColor, robust across shader paths.
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = Color3.Black();
  m.specularColor = Color3.Black();
  m.emissiveColor = Color3.White();
  m.backFaceCulling = false;
  m.fogEnabled = true;
  return m;
}

/** Render-only terrain: playable terrain inside bounds, rising hills outside. */
export function renderTerrain(x: number, z: number): number {
  const cx = Math.max(BOUNDS.minX, Math.min(BOUNDS.maxX, x));
  const cz = Math.max(BOUNDS.minZ, Math.min(BOUNDS.maxZ, z));
  let h = baseTerrain(cx, cz);
  const ox = Math.max(0, Math.abs(x) - (BOUNDS.maxX + 2));
  const oz = Math.max(0, z - (BOUNDS.maxZ + 2));
  const land = smoothstep(-400, -340, z);
  const n = Math.sin(x * 0.013) * Math.cos(z * 0.017) * 8 + Math.sin(x * 0.041 + z * 0.023) * 3;
  if (ox > 0) h += (smoothstep(0, 180, ox) * 60 + (ox > 10 ? n : 0)) * land + 4 * smoothstep(0, 6, ox) * land;
  if (oz > 0) h += smoothstep(0, 200, oz) * 85 + (oz > 10 ? n * 1.4 : 0) + 4 * smoothstep(0, 6, oz);
  if (z < BOUNDS.minZ) h = -8;
  return h;
}

const SURF_COL: Record<string, RGB> = {
  sand: hex("#ecd8a4"), grass: hex("#79b956"), pavement: hex("#d6cdbd"), quay: hex("#b7b2a7"), plaza: hex("#e7dcc6"),
  hill: hex("#86a95c"), rock: hex("#a59c8c"), wetsand: hex("#c9b07c"),
};

export function buildCity(world: World, scene: Scene, shadow: ShadowGenerator | null): CityMeshes {
  const lit = litMaterial(scene, "lit");
  const glow = glowMaterial(scene, "glow");
  const casters: Mesh[] = [];
  const receivers: Mesh[] = [];

  // ------------------------------------------------------------------ terrain
  {
    const g = new Geo();
    const step = 5;
    const x0 = -940, x1 = 940, z0 = -640, z1 = 780;
    const nx = Math.round((x1 - x0) / step), nz = Math.round((z1 - z0) / step);
    const inCut = (x: number, z: number) => world.cuts.some((c) => x > c.minX - 0.01 && x < c.maxX + 0.01 && z > c.minZ - 0.01 && z < c.maxZ + 0.01);
    const color = (x: number, z: number, h: number): RGB => {
      if (x < BOUNDS.minX || x > BOUNDS.maxX || z > BOUNDS.maxZ) return h > 40 ? mix(SURF_COL.hill, SURF_COL.rock, smoothstep(40, 90, h)) : SURF_COL.hill;
      if (z < -356 && x < -4) return h < 0.2 ? SURF_COL.wetsand : SURF_COL.sand;
      if (z < -352 && x >= -4) return SURF_COL.quay;
      for (const zn of world.zones) {
        if (x > zn.minX && x < zn.maxX && z > zn.minZ && z < zn.maxZ) return zn.kind === "plaza" ? SURF_COL.plaza : zn.surface === "grass" ? SURF_COL.grass : SURF_COL.pavement;
      }
      const d = districtTint(x, z);
      return d;
    };
    const H: number[] = [];
    for (let j = 0; j <= nz; j++)
      for (let i = 0; i <= nx; i++) H.push(renderTerrain(x0 + i * step, z0 + j * step));
    const vid: number[] = [];
    for (let j = 0; j <= nz; j++)
      for (let i = 0; i <= nx; i++) {
        const x = x0 + i * step, z = z0 + j * step;
        const h = H[j * (nx + 1) + i];
        const hx = H[j * (nx + 1) + Math.min(nx, i + 1)] - H[j * (nx + 1) + Math.max(0, i - 1)];
        const hz = H[Math.min(nz, j + 1) * (nx + 1) + i] - H[Math.max(0, j - 1) * (nx + 1) + i];
        const n = new Vector3(-hx / (2 * step), 1, -hz / (2 * step)).normalize();
        const c = color(x, z, h);
        const k = 0.94 + hash01(i, j) * 0.08;
        vid.push(g.vert(x, h, z, n.x, n.y, n.z, scale(c, k), x / 24, z / 24));
      }
    for (let j = 0; j < nz; j++)
      for (let i = 0; i < nx; i++) {
        const cx = x0 + (i + 0.5) * step, cz = z0 + (j + 0.5) * step;
        if (inCut(cx, cz)) continue;
        const a = vid[j * (nx + 1) + i], b = a + 1, c = a + nx + 1, d = c + 1;
        g.idx.push(a, c, b, b, c, d);
      }
    const mat = litMaterial(scene, "terrain", 0.04);
    mat.diffuseTexture = groundTexture(scene);
    const m = g.toMesh("terrain", scene, mat);
    receivers.push(m);
  }

  // ------------------------------------------------------------------ canal (walls, floor, water)
  {
    const g = new Geo();
    const stone = hex("#8f8676");
    for (const c of world.cuts) {
      const top = baseTerrain((c.minX + c.maxX) / 2, (c.minZ + c.maxZ) / 2);
      const floor = top - c.depth;
      const w = c.maxX - c.minX, d = c.maxZ - c.minZ;
      g.box((c.minX + c.maxX) / 2, floor - 0.25, (c.minZ + c.maxZ) / 2, w, 0.5, d, scale(stone, 0.7));
      g.quad([c.minX, floor, c.minZ], [c.maxX, floor, c.minZ], [c.maxX, top, c.minZ], [c.minX, top, c.minZ], stone);
      g.quad([c.maxX, floor, c.maxZ], [c.minX, floor, c.maxZ], [c.minX, top, c.maxZ], [c.maxX, top, c.maxZ], stone);
      g.quad([c.minX, floor, c.maxZ], [c.minX, floor, c.minZ], [c.minX, top, c.minZ], [c.minX, top, c.maxZ], stone);
      g.quad([c.maxX, floor, c.minZ], [c.maxX, floor, c.maxZ], [c.maxX, top, c.maxZ], [c.maxX, top, c.minZ], stone);
    }
    // bridge decks under the roads
    for (const bx of [-640, -500, -360]) {
      const top = baseTerrain(bx, 80);
      g.box(bx, top - 0.8, 80, 18.6, 1.6, CANAL.maxZ - CANAL.minZ + 2, hex("#b9ad98"));
      g.box(bx - 9.3, top + 0.5, 80, 0.5, 1.0, CANAL.maxZ - CANAL.minZ + 2, hex("#efe6d2"));
      g.box(bx + 9.3, top + 0.5, 80, 0.5, 1.0, CANAL.maxZ - CANAL.minZ + 2, hex("#efe6d2"));
    }
    const m = g.toMesh("canal", scene, lit);
    receivers.push(m);
  }

  // ------------------------------------------------------------------ water
  const waterMat = new StandardMaterial("water", scene);
  waterMat.diffuseColor = new Color3(0.08, 0.36, 0.62);
  waterMat.specularColor = new Color3(0.9, 0.85, 0.7);
  waterMat.specularPower = 96;
  waterMat.emissiveColor = new Color3(0.02, 0.12, 0.22);
  waterMat.alpha = 0.9;
  const wn = waterNormal(scene);
  wn.uScale = 60;
  wn.vScale = 60;
  waterMat.bumpTexture = wn;
  waterMat.backFaceCulling = false;
  {
    const sea = MeshBuilder.CreateGround("sea", { width: 5000, height: 5000, subdivisions: 1 }, scene);
    sea.position.set(0, 0, -900);
    sea.material = waterMat;
    receivers.push(sea);
    for (const c of world.cuts) {
      const p = MeshBuilder.CreateGround("canalwater", { width: c.maxX - c.minX, height: c.maxZ - c.minZ }, scene);
      p.position.set((c.minX + c.maxX) / 2, world.canalWaterY, (c.minZ + c.maxZ) / 2);
      p.material = waterMat;
    }
  }

  // ------------------------------------------------------------------ roads + intersections + sidewalks
  const nodeHalf = world.nodes.map((n) => Math.max(...n.edges.map((e) => world.edges[e].halfWidth)));
  const nodeWalk = world.nodes.map((n) => Math.max(...n.edges.map((e) => world.edges[e].sidewalk)));
  {
    const kinds = ["street", "boulevard", "highline", "cobble"] as const;
    const walk = new Geo();
    const curb = hex("#c9c1b1");
    const rush = new Geo();
    for (const kind of kinds) {
      const g = new Geo();
      for (const e of world.edges) {
        if (e.kind !== kind) continue;
        const A = world.nodes[e.a];
        const ja = nodeHalf[e.a], jb = nodeHalf[e.b];
        const L = e.length - ja - jb;
        const segs = Math.max(1, Math.ceil(L / 4));
        const rx = e.dz, rz = -e.dx;
        const pts: number[][][] = [];
        for (let k = 0; k <= segs; k++) {
          const s = ja + (L * k) / segs;
          const cx = A.x + e.dx * s, cz = A.z + e.dz * s;
          const row: number[][] = [];
          for (const f of [-1, 0, 1]) {
            const x = cx + rx * e.halfWidth * f, z = cz + rz * e.halfWidth * f;
            row.push([x, world.heightAt(x, z) + 0.06, z, s]);
          }
          pts.push(row);
        }
        for (let k = 0; k < segs; k++) {
          for (let c = 0; c < 2; c++) {
            const p0 = pts[k][c], p1 = pts[k][c + 1], p2 = pts[k + 1][c + 1], p3 = pts[k + 1][c];
            const u0 = c * 0.5, u1 = (c + 1) * 0.5;
            const v0 = p0[3] / 16, v1 = p3[3] / 16;
            const i0 = g.vert(p0[0], p0[1], p0[2], 0, 1, 0, [1, 1, 1], u0, v0);
            const i1 = g.vert(p1[0], p1[1], p1[2], 0, 1, 0, [1, 1, 1], u1, v0);
            const i2 = g.vert(p2[0], p2[1], p2[2], 0, 1, 0, [1, 1, 1], u1, v1);
            const i3 = g.vert(p3[0], p3[1], p3[2], 0, 1, 0, [1, 1, 1], u0, v1);
            g.idx.push(i0, i1, i2, i0, i2, i3);
          }
        }
        // sidewalks both sides
        for (const side of [-1, 1]) {
          for (let k = 0; k < segs; k++) {
            const s0 = ja + (L * k) / segs, s1 = ja + (L * (k + 1)) / segs;
            const q = (s: number, off: number) => {
              const x = A.x + e.dx * s + rx * off * side, z = A.z + e.dz * s + rz * off * side;
              return [x, world.heightAt(x, z) + 0.16, z];
            };
            const a0 = q(s0, e.halfWidth), a1 = q(s0, e.halfWidth + e.sidewalk), b1 = q(s1, e.halfWidth + e.sidewalk), b0 = q(s1, e.halfWidth);
            walk.quad(a0, a1, b1, b0, [1, 1, 1], [0, s0 / 4, e.sidewalk / 4, s1 / 4]);
            // curb face
            const c0 = [a0[0], a0[1] - 0.16, a0[2]], c1 = [b0[0], b0[1] - 0.16, b0[2]];
            walk.quad(c0, c1, b0, a0, curb, [0, 0, 0, 0]);
          }
        }
        // Rush lane chevrons (left lane in each direction is the oncoming risk lane -> mark full width edges)
        if (e.rushLane) {
          for (const side of [-1, 1]) {
            for (let k = 0; k < segs; k++) {
              const s0 = ja + (L * k) / segs, s1 = ja + (L * (k + 1)) / segs;
              const q = (s: number, off: number) => {
                const x = A.x + e.dx * s + rx * off * side, z = A.z + e.dz * s + rz * off * side;
                return [x, world.heightAt(x, z) + 0.09, z];
              };
              const o0 = e.halfWidth - 1.1, o1 = e.halfWidth - 0.35;
              rush.quad(q(s0, o0), q(s0, o1), q(s1, o1), q(s1, o0), [1, 1, 1], [0, s0 / 6, 1, s1 / 6]);
            }
          }
        }
      }
      if (g.vertexCount === 0) continue;
      const mat = litMaterial(scene, `road-${kind}`, 0.08);
      mat.diffuseTexture = roadTexture(scene, kind);
      mat.zOffset = -1;
      const m = g.toMesh(`roads-${kind}`, scene, mat);
      receivers.push(m);
    }
    // intersections
    const ig = new Geo();
    for (const n of world.nodes) {
      const J = nodeHalf[n.id];
      const y = world.heightAt(n.x, n.z) + 0.065;
      const c = [1, 1, 1] as RGB;
      ig.quad([n.x - J, y, n.z - J], [n.x + J, y, n.z - J], [n.x + J, y, n.z + J], [n.x - J, y, n.z + J], c, [n.x / 16, n.z / 16, (n.x + 2 * J) / 16, (n.z + 2 * J) / 16]);
      // crosswalk zebra stripes on each approach
      for (const eid of n.edges) {
        const e = world.edges[eid];
        const out = e.a === n.id ? 1 : -1;
        const dx = e.dx * out, dz = e.dz * out;
        const rx = dz, rz = -dx;
        for (let k = -e.halfWidth + 0.8; k < e.halfWidth - 0.5; k += 1.4) {
          const base = J - 2.6;
          const p = (a: number, l: number) => [n.x + dx * a + rx * l, y + 0.01, n.z + dz * a + rz * l];
          ig.quad(p(base, k), p(base, k + 0.7), p(base + 2.2, k + 0.7), p(base + 2.2, k), hex("#f6f2e8"), [0, 0, 0, 0]);
        }
      }
      // corner sidewalks + fill across missing arms
      const W = nodeWalk[n.id];
      const sy = world.heightAt(n.x, n.z) + 0.16;
      for (const sx of [-1, 1])
        for (const sz of [-1, 1]) {
          const cx = n.x + sx * (J + W / 2), cz = n.z + sz * (J + W / 2);
          walk.quad([cx - W / 2, sy, cz - W / 2], [cx + W / 2, sy, cz - W / 2], [cx + W / 2, sy, cz + W / 2], [cx - W / 2, sy, cz + W / 2], [1, 1, 1], [0, 0, 1, 1]);
        }
      const has = (dx: number, dz: number) => n.edges.some((eid) => {
        const e = world.edges[eid];
        const out = e.a === n.id ? 1 : -1;
        return Math.abs(e.dx * out - dx) < 0.1 && Math.abs(e.dz * out - dz) < 0.1;
      });
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (has(dx, dz)) continue;
        const rx = dz, rz = -dx;
        const p = (a: number, l: number) => [n.x + dx * a + rx * l, sy, n.z + dz * a + rz * l];
        walk.quad(p(J, -J), p(J + W, -J), p(J + W, J), p(J, J), [1, 1, 1], [0, 0, 1, 1]);
      }
    }
    const imat = litMaterial(scene, "intersections", 0.08);
    imat.diffuseTexture = plainAsphalt(scene);
    imat.zOffset = -1.5;
    receivers.push(ig.toMesh("intersections", scene, imat));
    const wmat = litMaterial(scene, "sidewalks", 0.05);
    wmat.diffuseTexture = sidewalkTexture(scene);
    receivers.push(walk.toMesh("sidewalks", scene, wmat));
    const rmat = glowMaterial(scene, "rush");
    rmat.diffuseTexture = chevronTexture(scene);
    rmat.diffuseTexture.hasAlpha = true;
    rmat.useAlphaFromDiffuseTexture = true;
    rmat.zOffset = -2;
    rush.toMesh("rushlanes", scene, rmat);
  }

  // ------------------------------------------------------------------ buildings
  {
    const byDistrict = new Map<District, Geo>();
    const roofs = new Geo();
    const neon = new Geo();
    const neonCols = ["#ff3ec8", "#3dfcff", "#ffd23f", "#ff5a5f", "#9b5de5", "#00f5a0"].map(hex);
    for (const [bi, b] of world.buildings.entries()) {
      let g = byDistrict.get(b.district);
      if (!g) byDistrict.set(b.district, (g = new Geo()));
      const sx = b.maxX - b.minX, sz = b.maxZ - b.minZ;
      const cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
      const col = b.color as RGB;
      // podium + tower setback for tall buildings
      if (b.height > 30 && b.style % 2 === 0) {
        const ph = 8 + (b.style * 2);
        g.box(cx, b.baseY + ph / 2, cz, sx, ph, sz, scale(col, 0.92), 0, { uvW: 4, uvH: 3.5, top: b.roof as RGB });
        g.box(cx, b.baseY + ph + (b.height - ph) / 2, cz, sx * 0.72, b.height - ph, sz * 0.72, col, 0, { uvW: 4, uvH: 3.5, top: b.roof as RGB });
      } else {
        g.box(cx, b.baseY + b.height / 2, cz, sx, b.height, sz, col, 0, { uvW: 4, uvH: 3.5, top: b.roof as RGB });
      }
      const top = b.baseY + b.height;
      // roof details
      const r = hash01(bi, 3);
      if (r < 0.35) roofs.box(cx + sx * 0.18, top + 0.8, cz - sz * 0.15, 3, 1.6, 3, hex("#9aa0a6"));
      else if (r < 0.55) roofs.cyl(cx - sx * 0.2, top + 1.6, cz + sz * 0.2, 1.4, 1.4, 3.2, 10, hex("#b06a4a"));
      if (b.district === "oldsteps" || b.district === "beach") {
        // terracotta parapet band
        roofs.box(cx, top + 0.25, cz, sx + 0.4, 0.5, sz + 0.4, b.roof as RGB);
      }
      if (b.neon) {
        const nc = neonCols[Math.floor(hash01(bi, 9) * neonCols.length)];
        const face = Math.floor(hash01(bi, 5) * 4);
        const h = Math.min(b.height - 4, 9 + hash01(bi, 7) * 6);
        const y0 = b.baseY + 4 + h / 2 + 1.5;
        const off = 0.35;
        if (face === 0) neon.box(cx, y0, b.maxZ + off, 1.4, h, 0.4, nc);
        else if (face === 1) neon.box(cx, y0, b.minZ - off, 1.4, h, 0.4, nc);
        else if (face === 2) neon.box(b.maxX + off, y0, cz, 0.4, h, 1.4, nc);
        else neon.box(b.minX - off, y0, cz, 0.4, h, 1.4, nc);
        // awning band
        neon.box(cx, b.baseY + 1.5 + 3.4, b.maxZ + 0.3, sx * 0.8, 0.25, 0.3, nc);
      }
    }
    const wmat = litMaterial(scene, "walls", 0.25);
    const wt = windowTexture(scene);
    wmat.diffuseTexture = wt;
    for (const [d, g] of byDistrict) {
      const m = g.toMesh(`bld-${d}`, scene, wmat);
      casters.push(m);
      receivers.push(m);
    }
    const rm = roofs.toMesh("roofs", scene, lit);
    casters.push(rm);
    neon.toMesh("neon", scene, glow);
  }

  // ------------------------------------------------------------------ landmarks + signs
  const ferris: Mesh[] = [];
  const beacons: Mesh[] = [];
  {
    const g = new Geo();
    const e = new Geo();
    for (const d of world.destinations) buildLandmark(world, d, g, e, ferris, scene, lit);
    const m = g.toMesh("landmarks", scene, lit);
    casters.push(m);
    receivers.push(m);
    e.toMesh("landmarks-glow", scene, glow);
    for (const d of world.destinations) {
      const sign = MeshBuilder.CreatePlane(`sign-${d.id}`, { width: 9, height: 2.25, sideOrientation: Mesh.DOUBLESIDE }, scene);
      const sm = new StandardMaterial(`signmat-${d.id}`, scene);
      sm.disableLighting = true;
      sm.emissiveTexture = signTexture(scene, d.name, d.color, luminance(hex(d.color)) > 0.7 ? "#1d2b44" : "#ffffff");
      sm.diffuseColor = Color3.Black();
      sign.material = sm;
      const fx = Math.sin(d.facing), fz = Math.cos(d.facing);
      const sx = d.lx + fx * (d.lr + 1.0), sz = d.lz + fz * (d.lr + 1.0);
      sign.position.set(sx, baseTerrain(sx, sz) + 4.2, sz);
      sign.rotation.y = d.facing;
      // sign post
      const post = new Geo();
      post.box(sx - fz * 4, baseTerrain(sx, sz) + 1.6, sz + fx * 4, 0.3, 3.2, 0.3, hex("#2b2d42"));
      post.box(sx + fz * 4, baseTerrain(sx, sz) + 1.6, sz - fx * 4, 0.3, 3.2, 0.3, hex("#2b2d42"));
      post.toMesh(`signpost-${d.id}`, scene, lit);
    }
  }

  // ------------------------------------------------------------------ shortcut set pieces (volumes, corridors, gates)
  {
    const g = new Geo();
    const e = new Geo();
    for (const v of world.volumes) {
      const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw);
      const rx = fz, rz = -fx;
      const n = Math.max(2, Math.ceil((v.halfLen * 2) / 1.0));
      const colTop: RGB = v.visual === "ramp" ? hex("#f4c430") : v.visual === "ferry" ? hex("#eae3d2") : v.visual === "terrace" ? hex("#6fb24d") : v.visual === "stairs" ? hex("#b9a58a") : hex("#a8adb3");
      const colSide: RGB = v.visual === "ferry" ? hex("#e2483d") : v.visual === "terrace" ? hex("#9b8a6a") : v.visual === "deck" ? hex("#c9ccd1") : hex("#5b5f66");
      const P = (a: number, l: number, y: number) => [v.cx + fx * a + rx * l, y, v.cz + fz * a + rz * l];
      const topAt = (a: number, l: number) => {
        const x = v.cx + fx * a + rx * l, z = v.cz + fz * a + rz * l;
        return world.heightAt(x, z) + 0.02;
      };
      for (let k = 0; k < n; k++) {
        const a0 = -v.halfLen + (2 * v.halfLen * k) / n, a1 = -v.halfLen + (2 * v.halfLen * (k + 1)) / n;
        const am = (a0 + a1) / 2;
        const h0 = topAt(am - 0.49, 0), h1 = topAt(am + 0.49, 0);
        const stripe = v.visual === "ramp" && k % 2 === 0 ? hex("#1d1d24") : colTop;
        g.quad(P(a0, -v.halfWid, h0), P(a0, v.halfWid, h0), P(a1, v.halfWid, h1), P(a1, -v.halfWid, h1), stripe);
        for (const side of [-1, 1]) {
          const l = v.halfWid * side;
          const pa = P(a0, l, 0), pb = P(a1, l, 0);
          const t0 = world.terrainAt(pa[0], pa[2]) - 0.4;
          const t1 = world.terrainAt(pb[0], pb[2]) - 0.4;
          const bot0 = v.mode === "abs" ? Math.min(t0, v.baseY - 0.2) : t0;
          const bot1 = v.mode === "abs" ? Math.min(t1, v.baseY - 0.2) : t1;
          g.quad(P(a0, l, bot0), P(a1, l, bot1), P(a1, l, h1), P(a0, l, h0), colSide);
        }
        // end faces where height jumps (drop edges)
        const next = topAt(a1 + 0.02, 0), cur = h1;
        if (k < n - 1 && cur - next > 0.3) g.quad(P(a1, -v.halfWid, next), P(a1, v.halfWid, next), P(a1, v.halfWid, cur), P(a1, -v.halfWid, cur), colSide);
      }
      const endH = topAt(v.halfLen - 0.05, 0), endT = world.terrainAt(v.cx + fx * v.halfLen, v.cz + fz * v.halfLen);
      if (endH - endT > 0.3) g.quad(P(v.halfLen, -v.halfWid, endT - 0.3), P(v.halfLen, v.halfWid, endT - 0.3), P(v.halfLen, v.halfWid, endH), P(v.halfLen, -v.halfWid, endH), colSide);
      const stH = topAt(-v.halfLen + 0.05, 0), stT = world.terrainAt(v.cx - fx * v.halfLen, v.cz - fz * v.halfLen);
      if (stH - stT > 0.3) g.quad(P(-v.halfLen, v.halfWid, stT - 0.3), P(-v.halfLen, -v.halfWid, stT - 0.3), P(-v.halfLen, -v.halfWid, stH), P(-v.halfLen, v.halfWid, stH), colSide);
      if (v.visual === "deck" || v.visual === "ferry") {
        // lights along deck edges
        for (let a = -v.halfLen + 3; a < v.halfLen; a += 6) {
          const h = topAt(a, 0);
          for (const side of [-1, 1]) {
            const p = P(a, v.halfWid * side, h + 1.1);
            e.box(p[0], p[1], p[2], 0.3, 0.3, 0.3, hex("#fff2b3"));
          }
        }
      }
    }
    // shortcut corridor ribbons + gate arches
    const surfCol: Record<string, RGB> = {
      grass: hex("#6cb54a"), sand: hex("#e9cf92"), metal: hex("#8c939b"), cobble: hex("#ad9e88"), wet: hex("#3f4a56"),
      pavement: hex("#e2d6bf"), asphalt: hex("#4a4d55"),
    };
    for (const sc of world.shortcuts) {
      const c = surfCol[sc.surface] ?? surfCol.pavement;
      for (let k = 0; k + 1 < sc.points.length; k++) {
        const [ax, az] = sc.points[k], [bx, bz] = sc.points[k + 1];
        const len = Math.hypot(bx - ax, bz - az);
        const ux = (bx - ax) / len, uz = (bz - az) / len;
        const rx = uz, rz = -ux;
        const hw = sc.width / 2;
        const segs = Math.ceil(len / 3);
        for (let s = 0; s < segs; s++) {
          const t0 = (s / segs) * len, t1 = ((s + 1) / segs) * len;
          const mx = ax + ux * (t0 + t1) / 2, mz = az + uz * (t0 + t1) / 2;
          if (world.volumes.some((v) => Math.hypot(mx - v.cx, mz - v.cz) < v.halfLen)) continue;
          const ne = world.nearestEdge(mx, mz);
          if (ne && ne.dist < ne.edge.halfWidth + ne.edge.sidewalk) continue;
          const q = (t: number, l: number) => {
            const x = ax + ux * t + rx * l, z = az + uz * t + rz * l;
            return [x, world.heightAt(x, z) + 0.07, z];
          };
          const shade = s % 2 === 0 ? c : scale(c, 0.93);
          g.quad(q(t0, -hw), q(t0, hw), q(t1, hw), q(t1, -hw), shade);
        }
      }
      const gc = hex(sc.color);
      for (const gate of [sc.gateA, sc.gateB]) {
        const [x1, z1, x2, z2] = gate;
        const y1 = world.heightAt(x1, z1), y2 = world.heightAt(x2, z2);
        const top = Math.max(y1, y2) + 5.2;
        g.box(x1, (y1 + top) / 2, z1, 0.6, top - y1, 0.6, hex("#26323d"));
        g.box(x2, (y2 + top) / 2, z2, 0.6, top - y2, 0.6, hex("#26323d"));
        const mx = (x1 + x2) / 2, mz = (z1 + z2) / 2;
        const yaw = Math.atan2(x2 - x1, z2 - z1);
        e.box(mx, top, mz, 0.8, 0.8, Math.hypot(x2 - x1, z2 - z1), gc, yaw);
        // chevron arrows on the beam
        for (const k of [-0.3, 0, 0.3]) {
          const px = mx + (x2 - x1) * k, pz = mz + (z2 - z1) * k;
          e.prism(polyPoints(3, 0.7, Math.PI / 2), px, top + 0.4, pz, top + 0.55, scale(gc, 1), undefined, yaw);
        }
      }
      if (sc.roofed) {
        const [ax, az] = sc.points[0], [bx, bz] = sc.points[sc.points.length - 1];
        const len = Math.hypot(bx - ax, bz - az);
        const yaw = Math.atan2(bx - ax, bz - az);
        const mx = (ax + bx) / 2, mz = (az + bz) / 2;
        const inner = len - 30;
        const y = world.heightAt(mx, mz);
        g.box(mx, y + 6.2, mz, sc.width + 3, 0.6, inner, hex("#6d3b47"), yaw);
        const ux = (bx - ax) / len, uz = (bz - az) / len;
        for (let t = -inner / 2; t < inner / 2; t += 6) {
          for (const side of [-1, 1]) {
            const px = mx + ux * t + uz * (sc.width / 2 + 1.2) * side, pz = mz + uz * t - ux * (sc.width / 2 + 1.2) * side;
            g.box(px, y + 3, pz, 0.5, 6, 0.5, hex("#3b2a35"));
          }
          e.sphere(mx + ux * t, y + 5.3, mz + uz * t, 0.45, hex(t % 12 === 0 ? "#ffb13b" : "#ff4f7b"), 8, 6);
        }
      }
      if (sc.id === "tram") {
        const y = world.heightAt(130, 326);
        g.box(130, y + 1.9, 327.5, 3, 3.2, 18, hex("#ff6f59"), Math.PI / 2, { top: hex("#fff1dc") });
        g.box(130, y + 2.6, 327.5, 3.05, 1.0, 16, hex("#2b5f6e"), Math.PI / 2);
        e.box(130, y + 3.7, 327.5, 0.2, 0.2, 18, hex("#fff2b3"), Math.PI / 2);
      }
    }
    // rails (canal, quay, ferry, deck parapets)
    for (const r of world.rails) {
      const len = r.hz * 2;
      g.box(r.cx, (r.minY + r.maxY) / 2 + 0.1, r.cz, 0.25, r.maxY - r.minY, len, hex("#f3eee2"), r.yaw);
      g.box(r.cx, r.maxY + 0.05, r.cz, 0.4, 0.12, len, hex("#19b5b0"), r.yaw);
    }
    // walls / rocks
    for (const c of world.colliders) {
      if (c.kind === "wall" && c.maxY < 10) g.box(c.cx, (c.minY + c.maxY) / 2 - 0.3, c.cz, c.hx * 2, c.maxY - c.minY + 0.6, c.hz * 2, hex("#efe3c8"), c.yaw, { top: hex("#19b5b0") });
      if (c.kind === "wall" && c.maxY >= 10) {
        // boundary retaining wall
        const len = Math.max(c.hx, c.hz) * 2;
        const along = c.hx > c.hz;
        const n = Math.ceil(len / 40);
        for (let i = 0; i < n; i++) {
          const t = -len / 2 + (i + 0.5) * (len / n);
          const x = along ? c.cx + t : c.cx, z = along ? c.cz : c.cz + t;
          if (z < -360) continue;
          const y = renderTerrain(x, z);
          g.box(x, y + 1.5, z, along ? len / n : c.hx * 2, 5, along ? c.hz * 2 : len / n, hex("#c9b99a"), 0, { top: hex("#a39275") });
        }
      }
      if (c.kind === "rock") {
        for (let z = c.cz - c.hz; z < c.cz + c.hz; z += 6) g.box(c.cx + (hash01(z | 0, 2) - 0.5) * 2, 1, z, 7, 5.5, 6.5, hex("#8d8a84"), hash01(z | 0, 4));
      }
    }
    const m = g.toMesh("setpieces", scene, lit);
    casters.push(m);
    receivers.push(m);
    e.toMesh("setpieces-glow", scene, glow);
  }

  // ------------------------------------------------------------------ harbor containers
  {
    const g = new Geo();
    for (const c of world.containers) {
      for (let k = 0; k < c.stack; k++) {
        const col = scale(c.color as RGB, k % 2 ? 0.9 : 1);
        g.box(c.cx, 1.5 + k * 2.6 + 1.3, c.cz, 12.2, 2.55, 2.5, col, c.yaw - Math.PI / 2, { top: scale(col, 1.1) });
      }
    }
    // cranes
    for (const x of [130, 270, 540]) {
      const z = -478;
      g.box(x - 6, 16, z, 1.2, 32, 1.2, hex("#ff6a3d"));
      g.box(x + 6, 16, z, 1.2, 32, 1.2, hex("#ff6a3d"));
      g.box(x, 32, z - 10, 1.6, 1.6, 44, hex("#ff6a3d"));
      g.box(x, 26, z - 26, 4, 3, 4, hex("#26323d"));
    }
    const m = g.toMesh("harbor", scene, lit);
    casters.push(m);
    receivers.push(m);
  }

  // ------------------------------------------------------------------ trees (thin instances)
  {
    const trunk = new Geo();
    trunk.cyl(0, 1.6, 0, 0.22, 0.16, 3.2, 6, hex("#7a5a3c"));
    const crown = new Geo();
    crown.sphere(0, 4.2, 0, 2.3, hex("#5aa043"), 8, 6, false, 0.9);
    crown.sphere(0.8, 3.6, 0.5, 1.5, hex("#6cb54f"), 7, 5);
    const palm = new Geo();
    palm.cyl(0, 3.5, 0, 0.25, 0.18, 7, 6, hex("#9c7a54"));
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      palm.taper(Math.cos(a) * 1.6, 6.6, Math.sin(a) * 1.6, 0.6, 3.4, 0.2, 2.6, 0.25, hex("#3f9b47"), -a + Math.PI / 2);
    }
    const cyp = new Geo();
    cyp.cyl(0, 0.6, 0, 0.2, 0.2, 1.2, 6, hex("#6b4d33"));
    cyp.cyl(0, 4.2, 0, 1.2, 0.15, 7, 8, hex("#3e7d3a"));
    const make = (geo: Geo, name: string, kind: string) => {
      const list = world.trees.filter((t) => t.kind === kind);
      if (list.length === 0) return;
      const m = geo.toMesh(name, scene, lit);
      const buf = new Float32Array(list.length * 16);
      list.forEach((t, i) => {
        const y = baseTerrain(t.x, t.z);
        Matrix.Compose(new Vector3(t.scale, t.scale, t.scale), Quaternion.RotationYawPitchRoll(hash01(i, 1) * 6.28, 0, 0), new Vector3(t.x, y, t.z)).copyToArray(buf, i * 16);
      });
      m.thinInstanceSetBuffer("matrix", buf, 16, true);
      casters.push(m);
    };
    const trees = new Geo();
    trees.append(trunk);
    trees.append(crown);
    make(trees, "trees-round", "round");
    make(palm, "trees-palm", "palm");
    make(cyp, "trees-cypress", "cypress");
  }

  // ------------------------------------------------------------------ signals + lantern strings + street furniture
  const signalNodes: { node: number; axis: 0 | 1 }[] = [];
  const headPositions: Vector3[] = [];
  {
    const poles = new Geo();
    const strings = new Geo();
    for (const n of world.nodes) {
      if (!n.signal) continue;
      const J = Math.max(...n.edges.map((e) => world.edges[e].halfWidth));
      const y = world.heightAt(n.x, n.z);
      for (const eid of n.edges) {
        const e = world.edges[eid];
        const out = e.a === n.id ? 1 : -1;
        // signal on the right side of incoming traffic: incoming direction = -out
        const ix = -e.dx * out, iz = -e.dz * out;
        const rx = iz, rz = -ix;
        const px = n.x - ix * (J + 1) + rx * (J + 1.2), pz = n.z - iz * (J + 1) + rz * (J + 1.2);
        poles.box(px, y + 2.6, pz, 0.22, 5.2, 0.22, hex("#26323d"));
        poles.box(px - rx * 1.5, y + 5.1, pz - rz * 1.5, Math.abs(rx) > 0.5 ? 3 : 0.2, 0.2, Math.abs(rz) > 0.5 ? 3 : 0.2, hex("#26323d"));
        poles.box(px - rx * 2.8, y + 4.6, pz - rz * 2.8, 0.5, 1.2, 0.5, hex("#1b1f24"));
        headPositions.push(new Vector3(px - rx * 2.8 - ix * 0.28, y + 4.6, pz - rz * 2.8 - iz * 0.28));
        signalNodes.push({ node: n.id, axis: e.axis });
      }
    }
    const lanternCols = ["#ff4f7b", "#ffb13b", "#ff3ec8", "#ffd23f"].map(hex);
    for (const e of world.edges) {
      if (e.district !== "lantern" && e.district !== "oldsteps") continue;
      if (e.kind === "boulevard") continue;
      const A = world.nodes[e.a];
      for (let s = 24; s < e.length - 20; s += 26) {
        const cx = A.x + e.dx * s, cz = A.z + e.dz * s;
        const y = world.heightAt(cx, cz) + 6.5;
        const span = e.halfWidth + e.sidewalk;
        for (let k = -6; k <= 6; k++) {
          const l = (k / 6) * span;
          const sag = (1 - (k / 6) ** 2) * 0.9;
          strings.sphere(cx + e.dz * l, y - sag, cz - e.dx * l, 0.28, lanternCols[(k + 6 + Math.floor(s)) % lanternCols.length], 6, 4);
        }
      }
    }
    poles.toMesh("signal-poles", scene, lit);
    strings.toMesh("lantern-strings", scene, glow);
  }
  const head = MeshBuilder.CreateBox("signal-head", { size: 0.34 }, scene);
  head.material = glow;
  const headBuf = new Float32Array(headPositions.length * 16);
  headPositions.forEach((p, i) => Matrix.Translation(p.x, p.y, p.z).copyToArray(headBuf, i * 16));
  head.thinInstanceSetBuffer("matrix", headBuf, 16, true);
  const colors = new Float32Array(headPositions.length * 4).fill(1);
  head.thinInstanceSetBuffer("color", colors, 4, false);

  if (shadow) {
    for (const m of casters) shadow.addShadowCaster(m, false);
  }
  for (const m of receivers) m.receiveShadows = true;
  for (const m of scene.meshes) {
    if (m.name.startsWith("bld-") || m.name === "terrain" || m.name.startsWith("roads") || m.name === "sidewalks" || m.name === "intersections") {
      m.freezeWorldMatrix();
      m.isPickable = false;
    }
  }
  return { ferris, signalHeads: { mesh: head, nodes: signalNodes, colors }, water: waterMat, lit, glow, beacons };
}

function luminance(c: RGB) {
  return 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
}

function districtTint(x: number, z: number): RGB {
  if (z < -150) return x < 0 ? hex("#ddd2bd") : hex("#c3bdb2");
  if (x > 420) return hex("#c9ccc8");
  if (z > 200 && x < 280) return hex("#d8c8a8");
  if (x < -290) return hex("#b9aea3");
  return hex("#d9d0bf");
}

// ------------------------------------------------------------------ landmarks
function buildLandmark(world: World, d: Destination, g: Geo, e: Geo, ferris: Mesh[], scene: Scene, mat: StandardMaterial) {
  const c = hex(d.color);
  const cream = hex("#f6efdf");
  const teal = hex("#19b5b0");
  const dark = hex("#26323d");
  const glass = hex("#3d8fa3");
  const y = world.terrainAt(d.lx, d.lz) - 1;
  const x = d.lx, z = d.lz, r = d.lr;
  const yaw = d.facing;
  switch (d.landmark) {
    case "lighthouse": {
      for (let i = 0; i < 6; i++) g.cyl(x, y + 3 + i * 5, z, r * 0.5 - i * 0.25, r * 0.5 - (i + 1) * 0.25, 5, 16, i % 2 ? cream : c, "y", false);
      g.cyl(x, y + 33, z, 2.6, 2.6, 1, 16, dark);
      e.cyl(x, y + 35, z, 2, 2, 3, 12, hex("#fff6c2"));
      g.cyl(x, y + 37.5, z, 2.4, 0.3, 2, 12, c);
      g.cyl(x, y + 1, z, r, r, 2, 16, hex("#9a948a"));
      break;
    }
    case "ferris": {
      g.box(x, y + 1, z, r * 1.6, 2, 6, cream);
      g.taper(x - 3, y + 2, z, 1, 1, 0.5, 0.5, 20, dark, 0);
      g.taper(x + 3, y + 2, z, 1, 1, 0.5, 0.5, 20, dark, 0);
      const wheel = new Geo();
      const R = 18;
      // built flat in the local xz plane; the parent nodes stand it upright and it spins about local y
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const ca = Math.cos(a), sa = Math.sin(a);
        wheel.box(ca * R / 2, 0, sa * R / 2, 0.3, 0.3, R, c, Math.atan2(ca, sa));
        wheel.box(ca * R, 0, sa * R, 2.2, 2.2, 2.2, i % 2 ? hex("#ffd166") : hex("#33d6e8"));
        wheel.box(ca * R, 0, sa * R, 0.5, 0.5, (Math.PI * 2 * R) / 16 + 0.3, c, Math.atan2(-sa, ca));
      }
      wheel.cyl(0, 0, 0, 1.2, 1.2, 1.4, 12, dark, "y");
      const wm = wheel.toMesh(`ferris-${d.id}`, scene, mat);
      const base = new TransformNode(`ferris-base-${d.id}`, scene);
      base.position.set(x, y + 22, z);
      base.rotation.y = yaw + Math.PI / 2;
      const tilt = new TransformNode(`ferris-tilt-${d.id}`, scene);
      tilt.parent = base;
      tilt.rotation.x = Math.PI / 2;
      wm.parent = tilt;
      ferris.push(wm);
      break;
    }
    case "dome": {
      g.cyl(x, y + 4, z, r, r, 8, 24, cream);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        g.box(x + Math.cos(a) * (r + 0.3), y + 4, z + Math.sin(a) * (r + 0.3), 0.8, 8, 0.8, scale(cream, 0.9));
      }
      g.sphere(x, y + 8, z, r * 0.92, c, 20, 12, true, 0.8);
      e.cyl(x, y + 8 + r * 0.74 + 0.8, z, 0.6, 0.6, 1.6, 8, hex("#fff2b3"));
      break;
    }
    case "clocktower": {
      g.box(x, y + 2, z, r * 1.6, 4, r * 1.6, hex("#cfc3a8"));
      g.box(x, y + 18, z, 6, 32, 6, c, yaw, { uvW: 0, top: teal });
      for (let i = 0; i < 4; i++) {
        const a = yaw + (i * Math.PI) / 2;
        e.cyl(x + Math.sin(a) * 3.05, y + 29, z + Math.cos(a) * 3.05, 2.2, 2.2, 0.15, 20, hex("#fff6dc"), "y", true);
      }
      g.taper(x, y + 34, z, 6.6, 6.6, 0.4, 0.4, 7, teal, yaw);
      break;
    }
    case "stadium": {
      const n = 36;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        g.box(x + Math.cos(a) * r * 0.85, y + 7, z + Math.sin(a) * r * 0.85, 7, 14, (Math.PI * 2 * r * 0.85) / n + 0.4, i % 2 ? c : scale(c, 0.85), -a);
      }
      g.cyl(x, y + 1, z, r * 0.7, r * 0.7, 2, 32, hex("#4caf50"));
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + 0.7;
        const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
        g.box(px, y + 14, pz, 1, 28, 1, dark);
        e.box(px, y + 28.5, pz, 4, 2, 1, hex("#fffbe0"), -a);
      }
      break;
    }
    case "pagoda": {
      for (let i = 0; i < 4; i++) {
        const s = r * 1.2 - i * 2.2;
        g.box(x, y + 2 + i * 4.5, z, s * 0.75, 3.5, s * 0.75, cream, yaw);
        g.taper(x, y + 3.8 + i * 4.5, z, s * 1.15, s * 1.15, s * 0.5, s * 0.5, 1.2, c, yaw);
      }
      e.cyl(x, y + 21.5, z, 0.3, 0.1, 3, 6, hex("#ffd23f"));
      for (let i = 0; i < 4; i++) e.sphere(x + Math.sin(yaw + i * 1.57) * r * 0.7, y + 3, z + Math.cos(yaw + i * 1.57) * r * 0.7, 0.6, hex("#ff4f4f"), 8, 6);
      break;
    }
    case "mast": {
      for (let i = 0; i < 8; i++) {
        const w = 5 - i * 0.55;
        g.taper(x, y + i * 7, z, w, w, w - 0.55, w - 0.55, 7, i % 2 ? c : hex("#f4f1e6"));
      }
      for (let i = 1; i <= 4; i++) e.sphere(x, y + i * 14, z, 0.7, hex("#ff2d2d"), 8, 6);
      g.box(x, y + 2, z, r * 1.6, 4, r * 1.2, cream);
      break;
    }
    case "hall": {
      g.box(x, y + 6, z, r * 1.9, 12, r * 1.4, cream, yaw, { top: c });
      g.box(x + Math.sin(yaw) * r * 0.71, y + 6, z + Math.cos(yaw) * r * 0.71, r * 1.4, 9, 0.4, glass, yaw);
      // barrel roof
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI;
        g.box(x, y + 12 + Math.sin(a) * 3, z, r * 1.9, 0.6, 1.3, c, yaw, {});
        void a;
      }
      g.cyl(x, y + 12, z, r * 0.55, r * 0.55, r * 1.9, 16, c, "x", true);
      e.box(x + Math.sin(yaw) * (r * 0.72), y + 10.2, z + Math.cos(yaw) * (r * 0.72), r * 1.2, 0.5, 0.2, c, yaw);
      break;
    }
    case "hotel": {
      g.box(x, y + 20, z, r * 1.3, 40, r * 1.0, c, yaw, { top: cream });
      for (let k = 0; k < 12; k++) g.box(x + Math.sin(yaw) * r * 0.52, y + 4 + k * 3.2, z + Math.cos(yaw) * r * 0.52, r * 1.25, 0.25, 1.2, cream, yaw);
      e.box(x, y + 41, z, r * 0.9, 1.6, 0.4, hex("#ffd166"), yaw);
      g.box(x, y + 2, z, r * 1.8, 4, r * 1.5, cream, yaw);
      break;
    }
    case "arch": {
      const span = r * 1.4;
      const rx = Math.cos(yaw), rz = -Math.sin(yaw);
      g.box(x - rx * span / 2, y + 7, z - rz * span / 2, 3, 14, 3, c, yaw);
      g.box(x + rx * span / 2, y + 7, z + rz * span / 2, 3, 14, 3, c, yaw);
      g.box(x, y + 15, z, span + 4, 3, 3.4, cream, yaw);
      e.box(x, y + 15, z + 0, span + 2, 0.4, 3.6, teal, yaw);
      g.box(x - Math.sin(yaw) * 4, y + 3, z - Math.cos(yaw) * 4, span, 6, 4, scale(c, 0.8), yaw);
      break;
    }
    case "chapel": {
      g.box(x, y + 6, z, r * 1.0, 12, r * 1.6, cream, yaw);
      g.taper(x, y + 12, z, r * 1.05, r * 1.65, 0.3, r * 1.6, 5, hex("#c8553d"), yaw);
      g.box(x + Math.sin(yaw) * r * 0.6, y + 12, z + Math.cos(yaw) * r * 0.6, 4, 24, 4, cream, yaw);
      g.taper(x + Math.sin(yaw) * r * 0.6, y + 24, z + Math.cos(yaw) * r * 0.6, 4.2, 4.2, 0.2, 0.2, 7, hex("#c8553d"), yaw);
      e.sphere(x + Math.sin(yaw) * r * 0.6, y + 21, z + Math.cos(yaw) * r * 0.6, 0.9, hex("#ffd166"), 8, 6);
      break;
    }
    case "tent": {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const px = x + Math.cos(a) * r * 0.55, pz = z + Math.sin(a) * r * 0.55;
        g.box(px, y + 2.5, pz, 0.25, 4, 0.25, dark);
        g.taper(px, y + 4.3, pz, 5, 5, 0.2, 0.2, 2.4, i % 2 ? c : cream, a);
        e.sphere(px, y + 4.1, pz, 0.3, hex("#fff2b3"), 6, 4);
      }
      g.taper(x, y + 1, z, r * 0.8, r * 0.8, 0.3, 0.3, 9, c, 0);
      g.taper(x, y + 1, z, r * 0.81, r * 0.81, 0.31, 0.31, 9.02, cream, Math.PI / 4);
      break;
    }
    case "tower": {
      g.cyl(x, y + 20, z, r * 0.45, r * 0.32, 40, 16, cream);
      g.cyl(x, y + 41, z, r * 0.9, r * 0.9, 3.5, 20, glass, "y", true, c);
      e.cyl(x, y + 42.8, z, r * 0.92, r * 0.92, 0.3, 20, c, "y", false);
      g.cyl(x, y + 46, z, 0.3, 0.1, 6, 6, dark);
      e.sphere(x, y + 49.2, z, 0.5, hex("#ff2d2d"), 6, 4);
      break;
    }
    case "pier": {
      const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
      for (let k = 0; k < 6; k++) g.box(x + fx * k * 6, y + 2.2, z + fz * k * 6, 6, 0.4, 5, hex("#b98b5e"), yaw);
      g.box(x, y + 4, z, 8, 4, 7, c, yaw, { top: cream });
      for (let i = 0; i < 4; i++) g.box(x + fx * (i * 7 + 8) + 2, y + 4, z + fz * (i * 7 + 8) + 1, 0.4, 3, 2.4, i % 2 ? hex("#ff6b35") : hex("#ffd166"), yaw + 0.3);
      e.box(x, y + 6.6, z, 6, 0.8, 0.3, hex("#fff2b3"), yaw);
      break;
    }
    case "theater": {
      g.box(x, y + 7, z, r * 1.6, 14, r * 1.4, scale(c, 0.8), yaw, { top: c });
      const fx = Math.sin(yaw), fz = Math.cos(yaw);
      e.box(x + fx * r * 0.75, y + 5.5, z + fz * r * 0.75, r * 1.3, 1.6, 1.2, hex("#ffe27a"), yaw);
      for (let i = -3; i <= 3; i++) e.sphere(x + fx * (r * 0.75 + 0.7) + Math.cos(yaw) * i * 2, y + 6.6, z + fz * (r * 0.75 + 0.7) - Math.sin(yaw) * i * 2, 0.25, hex("#fff6dc"), 6, 4);
      g.box(x + fx * r * 0.7, y + 11, z + fz * r * 0.7, r * 0.6, 5, 0.4, c, yaw);
      break;
    }
    case "depot": {
      g.box(x, y + 5, z, r * 1.8, 10, r * 1.5, cream, yaw);
      g.cyl(x, y + 10, z, r * 0.75, r * 0.75, r * 1.8, 16, c, "x", true);
      const fx = Math.sin(yaw), fz = Math.cos(yaw);
      g.box(x + fx * (r * 0.76), y + 4, z + fz * (r * 0.76), r * 1.0, 7, 0.3, dark, yaw);
      e.box(x + fx * (r * 0.78), y + 8.5, z + fz * (r * 0.78), r * 1.0, 0.5, 0.2, c, yaw);
      break;
    }
  }
  // Destination beacon base plinth (memory aid) in the landmark colour
  void starPoints;
}
