// Builds render geometry from the exact same grid + props as collision, so
// what you see is what bullets hit. Faces get world-space UVs and are merged
// per material to keep draw calls low.

import {
  Color3, Mesh, MeshBuilder, Scene, StandardMaterial, TransformNode, VertexData, type AbstractMesh,
} from '@babylonjs/core';
import type { RegionStyle } from '../map/annex';
import type { GameMap } from '../map/runtime';
import { signTexture, type TextureSet } from './textures';

interface Geo {
  pos: number[];
  nrm: number[];
  uv: number[];
  idx: number[];
}

const STYLE: Record<RegionStyle, { wall: string; base: string; floor: string; ceil: string; trim: string | null }> = {
  yard: { wall: 'concrete', base: 'concreteDark', floor: 'asphalt', ceil: 'panel', trim: null },
  lane: { wall: 'concrete', base: 'concreteDark', floor: 'asphalt', ceil: 'panel', trim: null },
  hall: { wall: 'panel', base: 'concreteDark', floor: 'concreteDark', ceil: 'panel', trim: '#ff2fb0' },
  lab: { wall: 'tile', base: 'panelLight', floor: 'tile', ceil: 'panelLight', trim: '#7dffb0' },
  mid: { wall: 'concrete', base: 'panel', floor: 'concrete', ceil: 'panel', trim: '#ff2fb0' },
  atrium: { wall: 'panelLight', base: 'panel', floor: 'tileWarm', ceil: 'panelLight', trim: '#ffb347' },
  corridor: { wall: 'panelLight', base: 'concreteDark', floor: 'concreteDark', ceil: 'panel', trim: '#ffb347' },
  gallery: { wall: 'panelLight', base: 'panel', floor: 'tileWarm', ceil: 'panel', trim: '#bfefff' },
  glass: { wall: 'panelLight', base: 'concreteDark', floor: 'tile', ceil: 'panelLight', trim: '#7dffb0' },
  garden: { wall: 'concrete', base: 'concreteDark', floor: 'grass', ceil: 'panel', trim: null },
  crawl: { wall: 'metal', base: 'metal', floor: 'grate', ceil: 'metal', trim: '#ffb347' },
};

const TILE: Record<string, number> = { concrete: 4, concreteDark: 3, asphalt: 6, panel: 3, panelLight: 3, tile: 2, tileWarm: 2.5, metal: 2, grate: 2, crate: 1.2, container: 3, planter: 2, rack: 2.4, turbine: 3, drywall: 2, grass: 4, glass: 2 };

export interface MapRender {
  root: TransformNode;
  meshes: AbstractMesh[];
  turbines: Mesh[];
  materials: Record<string, StandardMaterial>;
}

export function buildMapMeshes(scene: Scene, map: GameMap, tex: TextureSet): MapRender {
  const geos = new Map<string, Geo>();
  const g = (key: string): Geo => {
    let x = geos.get(key);
    if (!x) {
      x = { pos: [], nrm: [], uv: [], idx: [] };
      geos.set(key, x);
    }
    return x;
  };
  const quad = (key: string, p: number[][], n: [number, number, number], uvs: number[][]): void => {
    const G = g(key);
    const base = G.pos.length / 3;
    for (let i = 0; i < 4; i++) {
      G.pos.push(p[i][0], p[i][1], p[i][2]);
      G.nrm.push(n[0], n[1], n[2]);
      G.uv.push(uvs[i][0], uvs[i][1]);
    }
    G.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  const tile = (mat: string) => TILE[mat.split('#')[0]] ?? 3;

  // horizontal quad (floor up / ceiling down)
  const hquad = (mat: string, x0: number, z0: number, x1: number, z1: number, y: number, up: boolean): void => {
    const t = tile(mat);
    const p = up
      ? [[x0, y, z0], [x0, y, z1], [x1, y, z1], [x1, y, z0]]
      : [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]];
    quad(mat, p, up ? [0, 1, 0] : [0, -1, 0], p.map((q) => [q[0] / t, q[2] / t]));
  };
  // vertical quad along X (normal ±Z) or along Z (normal ±X)
  const vquad = (mat: string, axis: 'x' | 'z', c: number, a0: number, a1: number, y0: number, y1: number, sign: number): void => {
    if (y1 - y0 < 0.001 || a1 - a0 < 0.001) return;
    const t = tile(mat);
    let p: number[][];
    let n: [number, number, number];
    if (axis === 'x') {
      // face lies on plane z = c, spanning x a0..a1
      p = sign > 0 ? [[a0, y0, c], [a0, y1, c], [a1, y1, c], [a1, y0, c]] : [[a1, y0, c], [a1, y1, c], [a0, y1, c], [a0, y0, c]];
      n = [0, 0, sign];
      quad(mat, p, n, p.map((q) => [q[0] / t, q[1] / t]));
    } else {
      p = sign > 0 ? [[c, y0, a1], [c, y1, a1], [c, y1, a0], [c, y0, a0]] : [[c, y0, a0], [c, y1, a0], [c, y1, a1], [c, y0, a1]];
      n = [sign, 0, 0];
      quad(mat, p, n, p.map((q) => [q[2] / t, q[1] / t]));
    }
  };

  const { nx, nz, cell, x0: X0, z0: Z0 } = map;
  const top = map.def.solidTop;
  const regionStyle = (i: number): RegionStyle => map.def.regions[map.cellRegion[i]].style;
  const open = (i: number) => i >= 0 && map.cellRegion[i] >= 0;
  const idx = (ix: number, iz: number) => (ix < 0 || iz < 0 || ix >= nx || iz >= nz ? -1 : iz * nx + ix);

  // ---- floors & ceilings (greedy) ----
  const greedy = (keyOf: (i: number) => string | null, emit: (key: string, ix: number, iz: number, w: number, h: number) => void): void => {
    const used = new Uint8Array(nx * nz);
    for (let iz = 0; iz < nz; iz++)
      for (let ix = 0; ix < nx; ix++) {
        const i = iz * nx + ix;
        if (used[i]) continue;
        const k = keyOf(i);
        if (k === null) {
          used[i] = 1;
          continue;
        }
        let w = 1;
        while (ix + w < nx && !used[i + w] && keyOf(i + w) === k) w++;
        let h = 1;
        outer: while (iz + h < nz) {
          for (let dx = 0; dx < w; dx++) {
            const j = (iz + h) * nx + ix + dx;
            if (used[j] || keyOf(j) !== k) break outer;
          }
          h++;
        }
        for (let dz = 0; dz < h; dz++) for (let dx = 0; dx < w; dx++) used[(iz + dz) * nx + ix + dx] = 1;
        emit(k, ix, iz, w, h);
      }
  };
  greedy(
    (i) => {
      if (!open(i)) return null;
      const st = regionStyle(i);
      const f = map.cellFloor[i];
      const mat = f > 0 && (st === 'hall' || st === 'mid') ? 'grate' : STYLE[st].floor;
      return `${mat}@${f}`;
    },
    (k, ix, iz, w, h) => {
      const [mat, f] = k.split('@');
      hquad(mat, X0 + ix * cell, Z0 + iz * cell, X0 + (ix + w) * cell, Z0 + (iz + h) * cell, Number(f), true);
    },
  );
  greedy(
    (i) => {
      if (!open(i) || !isFinite(map.cellCeil[i])) return null;
      return `${STYLE[regionStyle(i)].ceil}@${map.cellCeil[i]}`;
    },
    (k, ix, iz, w, h) => {
      const [mat, c] = k.split('@');
      hquad(mat, X0 + ix * cell, Z0 + iz * cell, X0 + (ix + w) * cell, Z0 + (iz + h) * cell, Number(c), false);
    },
  );

  // ---- walls, risers, soffits: per cell edge, merged along runs ----
  type Spec = { y0: number; y1: number; mat: string; base: string; trim: string | null };
  const faceSpecs = (a: number, b: number): Spec[] => {
    const st = STYLE[regionStyle(a)];
    const fa = map.cellFloor[a];
    const ca = Math.min(map.cellCeil[a], top);
    const out: Spec[] = [];
    if (!open(b)) {
      out.push({ y0: fa, y1: ca, mat: st.wall, base: st.base, trim: st.trim });
      return out;
    }
    const fb = map.cellFloor[b];
    const cb = Math.min(map.cellCeil[b], top);
    if (fb > fa + 0.001) out.push({ y0: fa, y1: Math.min(fb, ca), mat: fb - fa > 0.5 ? 'metal' : 'concreteDark', base: '', trim: null });
    if (cb < ca - 0.001) out.push({ y0: Math.max(cb, fa), y1: ca, mat: st.wall, base: '', trim: null });
    return out;
  };
  const emitRun = (s: Spec, axis: 'x' | 'z', c: number, a0: number, a1: number, sign: number): void => {
    const baseH = 1.1;
    if (s.base && s.y1 - s.y0 > 2) {
      vquad(s.base, axis, c, a0, a1, s.y0, s.y0 + baseH, sign);
      vquad(s.mat, axis, c, a0, a1, s.y0 + baseH, s.y1, sign);
    } else vquad(s.mat, axis, c, a0, a1, s.y0, s.y1, sign);
    if (s.trim && s.y1 - s.y0 > 3.2) {
      const off = 0.012 * sign;
      vquad('trim' + s.trim, axis, c + off, a0, a1, s.y0 + 2.7, s.y0 + 2.8, sign);
      vquad('trimDim' + s.trim, axis, c + off, a0, a1, s.y0 + baseH, s.y0 + baseH + 0.04, sign);
    }
  };
  const specKey = (s: Spec) => `${s.y0}|${s.y1}|${s.mat}|${s.base}|${s.trim}`;
  // faces with normal -X / +X (wall planes perpendicular to X), runs along Z
  for (const dir of [1, -1]) {
    for (let ix = 0; ix < nx; ix++) {
      let run: { key: string; spec: Spec; start: number }[] = [];
      const flush = (endIz: number, keep: Set<string>) => {
        run = run.filter((r) => {
          if (keep.has(r.key)) return true;
          const c = X0 + (dir > 0 ? ix + 1 : ix) * cell;
          emitRun(r.spec, 'z', c, Z0 + r.start * cell, Z0 + endIz * cell, -dir);
          return false;
        });
      };
      for (let iz = 0; iz <= nz; iz++) {
        const keys = new Set<string>();
        const specs: Spec[] = [];
        if (iz < nz) {
          const a = idx(ix, iz);
          if (open(a)) for (const s of faceSpecs(a, idx(ix + dir, iz))) {
            keys.add(specKey(s));
            specs.push(s);
          }
        }
        flush(iz, keys);
        for (const s of specs) {
          const k = specKey(s);
          if (!run.some((r) => r.key === k)) run.push({ key: k, spec: s, start: iz });
        }
      }
    }
  }
  for (const dir of [1, -1]) {
    for (let iz = 0; iz < nz; iz++) {
      let run: { key: string; spec: Spec; start: number }[] = [];
      const flush = (endIx: number, keep: Set<string>) => {
        run = run.filter((r) => {
          if (keep.has(r.key)) return true;
          const c = Z0 + (dir > 0 ? iz + 1 : iz) * cell;
          emitRun(r.spec, 'x', c, X0 + r.start * cell, X0 + endIx * cell, -dir);
          return false;
        });
      };
      for (let ix = 0; ix <= nx; ix++) {
        const keys = new Set<string>();
        const specs: Spec[] = [];
        if (ix < nx) {
          const a = idx(ix, iz);
          if (open(a)) for (const s of faceSpecs(a, idx(ix, iz + dir))) {
            keys.add(specKey(s));
            specs.push(s);
          }
        }
        flush(ix, keys);
        for (const s of specs) {
          const k = specKey(s);
          if (!run.some((r) => r.key === k)) run.push({ key: k, spec: s, start: ix });
        }
      }
    }
  }

  // ---- ceiling light panels ----
  for (const reg of map.def.regions) {
    if (reg.ceil === null || reg.style === 'crawl') continue;
    const [rx0, rz0, rx1, rz1] = reg.rect;
    for (let x = rx0 + 2.5; x < rx1 - 1; x += 5)
      for (let z = rz0 + 2.5; z < rz1 - 1; z += 5) {
        const i = map.cellIndex(x, z);
        if (i < 0 || map.cellCeil[i] !== reg.ceil) continue;
        const y = reg.ceil - 0.01;
        hquad('light', x - 0.8, z - 0.2, x + 0.8, z + 0.2, y, false);
      }
  }

  // ---- props ----
  const turbines: Mesh[] = [];
  const boxFaces = (mat: string, b: { minX: number; minY: number; minZ: number; maxX: number; maxY: number; maxZ: number }, topMat = mat, bottom = false): void => {
    hquad(topMat, b.minX, b.minZ, b.maxX, b.maxZ, b.maxY, true);
    if (bottom && b.minY > 0.01) hquad(mat, b.minX, b.minZ, b.maxX, b.maxZ, b.minY, false);
    vquad(mat, 'x', b.minZ, b.minX, b.maxX, b.minY, b.maxY, -1);
    vquad(mat, 'x', b.maxZ, b.minX, b.maxX, b.minY, b.maxY, 1);
    vquad(mat, 'z', b.minX, b.minZ, b.maxZ, b.minY, b.maxY, -1);
    vquad(mat, 'z', b.maxX, b.minZ, b.maxZ, b.minY, b.maxY, 1);
  };
  const turbineMat = new StandardMaterial('m-turbine', scene);
  turbineMat.diffuseTexture = tex.turbine;
  turbineMat.specularColor = new Color3(0.25, 0.25, 0.3);
  const ringMat = new StandardMaterial('m-ring', scene);
  ringMat.emissiveColor = Color3.FromHexString('#ff2fb0');
  ringMat.disableLighting = true;
  for (const b of map.boxes) {
    if (b.kind !== 'prop') continue;
    switch (b.mat) {
      case 'turbine': {
        const w = Math.min(b.maxX - b.minX, b.maxZ - b.minZ);
        const h = b.maxY - b.minY;
        const cyl = MeshBuilder.CreateCylinder('turbine', { height: h, diameter: w * 0.98, tessellation: 28 }, scene);
        cyl.position.set((b.minX + b.maxX) / 2, b.minY + h / 2, (b.minZ + b.maxZ) / 2);
        cyl.material = turbineMat;
        turbines.push(cyl);
        for (let k = 1; k <= 3; k++) {
          const ring = MeshBuilder.CreateTorus('tring', { diameter: w * 1.02, thickness: 0.08, tessellation: 32 }, scene);
          ring.position.set(cyl.position.x, b.minY + (h * k) / 4, cyl.position.z);
          ring.material = ringMat;
          ring.isPickable = false;
          turbines.push(ring);
        }
        break;
      }
      case 'planter':
        boxFaces('concreteDark', b, 'planter');
        break;
      case 'glass':
        boxFaces('glass', b);
        break;
      case 'rail': {
        boxFaces('metal', b);
        break;
      }
      default:
        boxFaces(b.mat, b, b.mat, true);
    }
  }

  // ---- materials & meshes ----
  const root = new TransformNode('map', scene);
  const materials: Record<string, StandardMaterial> = {};
  const meshes: AbstractMesh[] = [];
  for (const [key, geo] of geos) {
    if (!geo.idx.length) continue;
    let mat = materials[key];
    if (!mat) {
      mat = new StandardMaterial('m-' + key, scene);
      if (key.startsWith('trim') || key === 'light') {
        const col = key === 'light' ? '#f6f8ff' : key.replace('trimDim', '').replace('trim', '');
        mat.emissiveColor = Color3.FromHexString(col).scale(key.startsWith('trimDim') ? 0.45 : 1);
        mat.diffuseColor = Color3.Black();
        mat.specularColor = Color3.Black();
        mat.disableLighting = true;
      } else {
        const t = tex[key];
        if (t) mat.diffuseTexture = t;
        mat.specularColor = key === 'tile' || key === 'metal' || key === 'container' ? new Color3(0.18, 0.18, 0.18) : new Color3(0.05, 0.05, 0.05);
        mat.specularPower = 32;
        if (key === 'glass') {
          mat.alpha = 0.28;
          mat.diffuseColor = new Color3(0.6, 0.85, 0.9);
          mat.specularColor = new Color3(0.6, 0.6, 0.6);
          mat.emissiveColor = new Color3(0.05, 0.1, 0.12);
        }
      }
      mat.backFaceCulling = false;
      materials[key] = mat;
    }
    const mesh = new Mesh('map-' + key, scene);
    const vd = new VertexData();
    vd.positions = geo.pos;
    vd.normals = geo.nrm;
    vd.uvs = geo.uv;
    vd.indices = geo.idx;
    vd.applyToMesh(mesh);
    mesh.material = mat;
    mesh.parent = root;
    mesh.isPickable = false;
    mesh.freezeWorldMatrix();
    mesh.doNotSyncBoundingInfo = true;
    meshes.push(mesh);
  }
  // signs
  for (const s of map.def.signs) {
    const plane = MeshBuilder.CreatePlane('sign', { width: 2.4, height: 0.6 }, scene);
    plane.position.set(s.pos[0], s.pos[1], s.pos[2]);
    plane.rotation.y = s.facing;
    const m = new StandardMaterial('m-sign', scene);
    m.diffuseTexture = signTexture(scene, s.text);
    m.emissiveColor = new Color3(0.55, 0.55, 0.55);
    m.specularColor = Color3.Black();
    plane.material = m;
    plane.isPickable = false;
    meshes.push(plane);
  }
  for (const t of turbines) meshes.push(t);
  return { root, meshes, turbines, materials };
}
