// Turns MapData into render meshes with lighting baked into vertex colours.
// Geometry is derived from exactly the same grid and boxes as collision, so what you see is what
// stops movement and bullets. Lighting is static and identical on every quality preset.
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';
import type { MapData, Theme } from '../map/build';
import { F_OPAQUE, newHit, type Box } from '../map/world';
import { hash32 } from '../shared/math';
import { Geom, type RGB } from './geom';
import {
  drawAcoustic,
  drawAsphalt,
  drawConcrete,
  drawFoliage,
  drawMetal,
  drawPenPanel,
  drawPlate,
  drawPolished,
  drawSoil,
  drawTile,
  drawWood,
  makeTexture,
  unlit,
} from './textures';

type TexKey = 'concrete' | 'acoustic' | 'asphalt' | 'tile' | 'polished' | 'metal' | 'plate' | 'wood' | 'pen' | 'foliage' | 'soil';

interface Surf {
  tex: TexKey;
  tint: RGB;
  scale: number;
}

interface ThemeDef {
  floor: Surf;
  wall: Surf;
  ceil: Surf;
  band?: { h: number; surf: Surf };
  strip?: { y: number; color: RGB };
  outdoor: boolean;
}

const S = (tex: TexKey, tint: RGB, scale: number): Surf => ({ tex, tint, scale });

const THEMES: Record<Theme, ThemeDef> = {
  yard: { floor: S('asphalt', [0.5, 0.5, 0.52], 4), wall: S('concrete', [0.86, 0.85, 0.82], 4), ceil: S('concrete', [0.6, 0.6, 0.6], 4), outdoor: true },
  dock: { floor: S('asphalt', [0.58, 0.57, 0.56], 4), wall: S('concrete', [0.84, 0.84, 0.82], 4), ceil: S('concrete', [0.6, 0.6, 0.6], 4), outdoor: true },
  hall: {
    floor: S('polished', [0.42, 0.44, 0.5], 4),
    wall: S('concrete', [0.8, 0.81, 0.84], 4),
    ceil: S('acoustic', [0.5, 0.52, 0.58], 4),
    band: { h: 2.4, surf: S('acoustic', [0.34, 0.35, 0.42], 2) },
    strip: { y: 2.4, color: [1.0, 0.18, 0.66] },
    outdoor: false,
  },
  lab: {
    floor: S('tile', [0.82, 0.88, 0.85], 2),
    wall: S('concrete', [0.84, 0.92, 0.86], 4),
    ceil: S('tile', [0.8, 0.84, 0.82], 2),
    strip: { y: 2.9, color: [0.4, 1.0, 0.62] },
    outdoor: false,
  },
  atrium: {
    floor: S('polished', [0.78, 0.7, 0.6], 4),
    wall: S('concrete', [0.9, 0.87, 0.8], 4),
    ceil: S('acoustic', [0.72, 0.69, 0.64], 4),
    band: { h: 1.2, surf: S('acoustic', [0.45, 0.4, 0.36], 2) },
    strip: { y: 1.2, color: [0.25, 0.85, 1.0] },
    outdoor: false,
  },
  corridor: {
    floor: S('polished', [0.52, 0.52, 0.54], 4),
    wall: S('concrete', [0.78, 0.77, 0.75], 4),
    ceil: S('concrete', [0.5, 0.5, 0.5], 4),
    strip: { y: 1.05, color: [1.0, 0.62, 0.2] },
    outdoor: false,
  },
  mid: {
    floor: S('tile', [0.5, 0.56, 0.62], 2),
    wall: S('concrete', [0.8, 0.83, 0.86], 4),
    ceil: S('acoustic', [0.5, 0.55, 0.6], 4),
    band: { h: 2.4, surf: S('acoustic', [0.32, 0.38, 0.44], 2) },
    strip: { y: 2.4, color: [0.2, 0.9, 1.0] },
    outdoor: false,
  },
  service: {
    floor: S('plate', [0.42, 0.42, 0.44], 2),
    wall: S('concrete', [0.66, 0.67, 0.7], 4),
    ceil: S('concrete', [0.55, 0.55, 0.55], 4),
    strip: { y: 1.05, color: [1.0, 0.5, 0.15] },
    outdoor: false,
  },
  glasshall: {
    floor: S('tile', [0.74, 0.82, 0.86], 2),
    wall: S('concrete', [0.86, 0.9, 0.92], 4),
    ceil: S('tile', [0.78, 0.82, 0.84], 2),
    outdoor: false,
  },
};

const SUN: RGB = [1.32, 1.18, 0.96];
const SKY: RGB = [0.5, 0.58, 0.72];
const SUN_DIR = (() => {
  const v = [0.38, 0.8, -0.46];
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
})();

const NORMALS: [number, number, number][] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

class Baker {
  private cache = new Map<number, RGB>();
  private hit = newHit();
  private buckets = new Map<number, number[]>();
  rays = 0;

  constructor(private map: MapData) {
    map.lights.forEach((l, i) => {
      const r = l.radius;
      for (let bz = Math.floor((l.z - r) / 8); bz <= Math.floor((l.z + r) / 8); bz++)
        for (let bx = Math.floor((l.x - r) / 8); bx <= Math.floor((l.x + r) / 8); bx++) {
          const k = bz * 64 + bx;
          let list = this.buckets.get(k);
          if (!list) this.buckets.set(k, (list = []));
          list.push(i);
        }
    });
  }

  private blocked(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, maxT: number, sky: boolean): number {
    this.rays++;
    const h = this.hit;
    if (!this.map.world.raycast(ox, oy, oz, dx, dy, dz, maxT, F_OPAQUE, false, h)) return -1;
    // walls are only rendered up to wallTop; light passes over them
    if (sky && oy + dy * h.t > this.map.wallTop + 0.01) return -1;
    return h.t;
  }

  private isOutdoor(x: number, z: number): boolean {
    const ix = Math.max(0, Math.min(this.map.sizeX - 1, Math.floor(x)));
    const iz = Math.max(0, Math.min(this.map.sizeZ - 1, Math.floor(z)));
    const i = iz * this.map.sizeX + ix;
    return !!this.map.open[i] && !isFinite(this.map.ceil[i]);
  }

  light(px: number, py: number, pz: number, ni: number): RGB {
    const key = ((Math.round(px * 8) & 0x3ff) | ((Math.round(pz * 8) & 0x3ff) << 10) | ((Math.round(py * 8 + 16) & 0xff) << 20)) * 8 + ni;
    const c = this.cache.get(key);
    if (c) return c;
    const n = NORMALS[ni];
    const ox = px + n[0] * 0.06;
    const oy = py + n[1] * 0.06;
    const oz = pz + n[2] * 0.06;
    const hemi = 0.5 + 0.5 * n[1];
    let r = 0.15 + 0.07 * hemi;
    let g = 0.155 + 0.07 * hemi;
    let b = 0.17 + 0.075 * hemi;
    if (ni === 3) {
      // ceilings pick up light bounced off the floor
      r += 0.13;
      g += 0.13;
      b += 0.14;
    }
    // sky and sun for anything that can see open sky nearby
    const outdoor = this.isOutdoor(ox + n[0] * 0.3, oz + n[2] * 0.3) || this.isOutdoor(ox, oz);
    if (outdoor) {
      let open = 0;
      const dirs = [
        [0, 1, 0],
        [0.6, 0.8, 0],
        [-0.6, 0.8, 0],
        [0, 0.8, 0.6],
        [0, 0.8, -0.6],
      ];
      for (const d of dirs) if (this.blocked(ox, oy, oz, d[0], d[1], d[2], 40, true) < 0) open++;
      const s = (open / dirs.length) * (0.55 + 0.45 * hemi);
      r += SKY[0] * s;
      g += SKY[1] * s;
      b += SKY[2] * s;
      const ndl = n[0] * SUN_DIR[0] + n[1] * SUN_DIR[1] + n[2] * SUN_DIR[2];
      if (ndl > 0 && this.blocked(ox, oy, oz, SUN_DIR[0], SUN_DIR[1], SUN_DIR[2], 60, true) < 0) {
        r += SUN[0] * ndl;
        g += SUN[1] * ndl;
        b += SUN[2] * ndl;
      }
    }
    const list = this.buckets.get(Math.floor(pz / 8) * 64 + Math.floor(px / 8));
    if (list) {
      for (const li of list) {
        const l = this.map.lights[li];
        const dx = l.x - ox;
        const dy = l.y - oy;
        const dz = l.z - oz;
        const d = Math.hypot(dx, dy, dz);
        if (d >= l.radius || d < 1e-3) continue;
        const ndl = (n[0] * dx + n[1] * dy + n[2] * dz) / d;
        if (ndl <= -0.25) continue;
        if (this.blocked(ox, oy, oz, dx / d, dy / d, dz / d, d - 0.05, false) >= 0) continue;
        const f = 1 - (d / l.radius) ** 2;
        const k = f * f * (0.34 + 0.66 * Math.max(0, ndl)) * 0.9;
        r += l.r * k;
        g += l.g * k;
        b += l.b * k;
      }
    }
    // short-range ambient occlusion for contact shadows
    let occ = 0;
    const t1 = ni < 2 ? [0, 1, 0] : [1, 0, 0];
    const t2 = ni < 2 ? [0, 0, 1] : ni < 4 ? [0, 0, 1] : [0, 1, 0];
    const probes = [
      [n[0], n[1], n[2]],
      [n[0] * 0.6 + t1[0] * 0.8, n[1] * 0.6 + t1[1] * 0.8, n[2] * 0.6 + t1[2] * 0.8],
      [n[0] * 0.6 - t1[0] * 0.8, n[1] * 0.6 - t1[1] * 0.8, n[2] * 0.6 - t1[2] * 0.8],
      [n[0] * 0.6 + t2[0] * 0.8, n[1] * 0.6 + t2[1] * 0.8, n[2] * 0.6 + t2[2] * 0.8],
      [n[0] * 0.6 - t2[0] * 0.8, n[1] * 0.6 - t2[1] * 0.8, n[2] * 0.6 - t2[2] * 0.8],
    ];
    for (const d of probes) {
      const t = this.blocked(ox, oy, oz, d[0], d[1], d[2], 0.9, false);
      if (t >= 0) occ += 1 - t / 0.9;
    }
    const ao = 1 - 0.5 * (occ / probes.length);
    const out: RGB = [r * ao, g * ao, b * ao];
    this.cache.set(key, out);
    return out;
  }
}

export interface MapVisual {
  meshes: Mesh[];
  barrier: Mesh;
  glass: Mesh;
  materials: StandardMaterial[];
  barrierMat: StandardMaterial;
  bakeRays: number;
  vertices: number;
}

export function buildMapVisual(scene: Scene, map: MapData): MapVisual {
  const baker = new Baker(map);
  const geoms = new Map<TexKey, Geom>();
  const G = (k: TexKey): Geom => {
    let g = geoms.get(k);
    if (!g) geoms.set(k, (g = new Geom()));
    return g;
  };
  const glow = new Geom();
  const sx = map.sizeX;
  const sz = map.sizeZ;
  const cell = (x: number, z: number): number => (x < 0 || z < 0 || x >= sx || z >= sz ? -1 : z * sx + x);

  /** Adds a lit, textured quad. Corners are given with their normal index for the baker. */
  const litQuad = (surf: Surf, pts: [number, number, number][], ni: number, uvAxis: 'xz' | 'xy' | 'zy', localUv?: [number, number][]): void => {
    const n = NORMALS[ni];
    const cols: [RGB, RGB, RGB, RGB] = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
    const uvs: [number, number][] = [];
    for (let i = 0; i < 4; i++) {
      const p = pts[i];
      const l = baker.light(p[0], p[1], p[2], ni);
      cols[i] = [l[0] * surf.tint[0], l[1] * surf.tint[1], l[2] * surf.tint[2]];
      if (localUv) uvs.push(localUv[i]);
      else if (uvAxis === 'xz') uvs.push([p[0] / surf.scale, p[2] / surf.scale]);
      else if (uvAxis === 'xy') uvs.push([p[0] / surf.scale, p[1] / surf.scale]);
      else uvs.push([p[2] / surf.scale, p[1] / surf.scale]);
    }
    G(surf.tex).quad(pts[0], pts[1], pts[2], pts[3], n, cols, uvs);
  };

  /** Vertical wall strip on the boundary of cell (x,z) facing direction d, from y0 to y1. */
  const wallStrip = (def: ThemeDef, x: number, z: number, d: number, y0: number, y1: number): void => {
    if (y1 - y0 < 0.01) return;
    // split at the band height and into <=1.3 m segments for smooth baked gradients
    const cuts: number[] = [y0];
    if (def.band && def.band.h > y0 + 0.05 && def.band.h < y1 - 0.05) cuts.push(def.band.h);
    cuts.push(y1);
    for (let c = 0; c < cuts.length - 1; c++) {
      const a = cuts[c];
      const bq = cuts[c + 1];
      const surf = def.band && bq <= def.band.h + 0.001 ? def.band.surf : def.wall;
      const n = Math.max(1, Math.ceil((bq - a) / 1.3));
      for (let i = 0; i < n; i++) {
        const ya = a + ((bq - a) * i) / n;
        const yb = a + ((bq - a) * (i + 1)) / n;
        // d: 0 = +x neighbour, 1 = -x, 2 = +z, 3 = -z ; the face normal points back into the open cell
        if (d === 0) litQuad(surf, [[x + 1, ya, z], [x + 1, ya, z + 1], [x + 1, yb, z + 1], [x + 1, yb, z]], 1, 'zy');
        else if (d === 1) litQuad(surf, [[x, ya, z], [x, ya, z + 1], [x, yb, z + 1], [x, yb, z]], 0, 'zy');
        else if (d === 2) litQuad(surf, [[x, ya, z + 1], [x + 1, ya, z + 1], [x + 1, yb, z + 1], [x, yb, z + 1]], 5, 'xy');
        else litQuad(surf, [[x, ya, z], [x + 1, ya, z], [x + 1, yb, z], [x, yb, z]], 4, 'xy');
      }
    }
    // emissive conduit strip
    if (def.strip && def.strip.y > y0 + 0.05 && def.strip.y < y1 - 0.1) {
      const y = def.strip.y;
      const h = 0.07;
      const o = 0.015;
      const col = def.strip.color;
      if (d === 0) glow.quad([x + 1 - o, y, z], [x + 1 - o, y, z + 1], [x + 1 - o, y + h, z + 1], [x + 1 - o, y + h, z], [-1, 0, 0], col);
      else if (d === 1) glow.quad([x + o, y, z], [x + o, y, z + 1], [x + o, y + h, z + 1], [x + o, y + h, z], [1, 0, 0], col);
      else if (d === 2) glow.quad([x, y, z + 1 - o], [x + 1, y, z + 1 - o], [x + 1, y + h, z + 1 - o], [x, y + h, z + 1 - o], [0, 0, -1], col);
      else glow.quad([x, y, z + o], [x + 1, y, z + o], [x + 1, y + h, z + o], [x, y + h, z + o], [0, 0, 1], col);
    }
  };

  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  for (let z = 0; z < sz; z++) {
    for (let x = 0; x < sx; x++) {
      const i = cell(x, z);
      if (!map.open[i]) continue;
      const room = map.rooms[map.roomAt[i]];
      const def = THEMES[room.theme];
      const fl = map.floor[i];
      const ce = map.ceil[i];
      const top = isFinite(ce) ? ce : map.wallTop;
      litQuad(def.floor, [[x, fl, z], [x + 1, fl, z], [x + 1, fl, z + 1], [x, fl, z + 1]], 2, 'xz');
      if (isFinite(ce)) litQuad(def.ceil, [[x, ce, z], [x + 1, ce, z], [x + 1, ce, z + 1], [x, ce, z + 1]], 3, 'xz');
      for (let d = 0; d < 4; d++) {
        const j = cell(x + dirs[d][0], z + dirs[d][1]);
        if (j < 0 || !map.open[j]) {
          wallStrip(def, x, z, d, fl, top);
          continue;
        }
        const nf = map.floor[j];
        const nc = isFinite(map.ceil[j]) ? map.ceil[j] : map.wallTop;
        if (nf > fl + 0.001) wallStrip(def, x, z, d, fl, Math.min(nf, top));
        if (nc < top - 0.001) wallStrip(def, x, z, d, Math.max(nc, fl), top);
      }
    }
  }

  // ---------------------------------------------------------------- props
  const glassGeom = new Geom();
  const barrierGeom = new Geom();
  const propSurf = (b: Box): { side: Surf; top: Surf; local: boolean } => {
    const concrete = S('concrete', [0.8, 0.8, 0.78], 4);
    switch (b.style) {
      case 'crate': {
        const w = S('wood', [0.92, 0.86, 0.78], 1.5);
        return { side: w, top: w, local: true };
      }
      case 'container': {
        const tints: RGB[] = [
          [0.28, 0.55, 0.6],
          [0.78, 0.42, 0.24],
          [0.42, 0.48, 0.6],
          [0.8, 0.66, 0.28],
        ];
        const t = tints[hash32(Math.round(b.x0 * 7), Math.round(b.z0 * 13)) % tints.length];
        return { side: S('metal', t, 2), top: S('metal', [t[0] * 0.8, t[1] * 0.8, t[2] * 0.8], 2), local: false };
      }
      case 'turbine':
        return { side: S('metal', [0.36, 0.38, 0.44], 1.5), top: S('plate', [0.3, 0.32, 0.36], 2), local: false };
      case 'rig':
        return { side: S('metal', [0.4, 0.46, 0.52], 1), top: S('plate', [0.34, 0.38, 0.42], 2), local: false };
      case 'tank':
        return { side: S('metal', [0.62, 0.68, 0.7], 0.75), top: S('plate', [0.5, 0.55, 0.57], 2), local: false };
      case 'console':
        return { side: S('acoustic', [0.36, 0.39, 0.45], 2), top: S('plate', [0.3, 0.33, 0.38], 2), local: false };
      case 'planter':
        return { side: S('concrete', [0.72, 0.74, 0.7], 2), top: S('soil', [0.8, 0.8, 0.8], 2), local: false };
      case 'foliage': {
        const f = S('foliage', [0.82, 0.88, 0.8], 1.6);
        return { side: f, top: f, local: false };
      }
      case 'panel': {
        const p = S('pen', [0.95, 0.95, 0.95], 2);
        return { side: p, top: p, local: false };
      }
      case 'gantry':
      case 'post':
        return { side: S('plate', [0.42, 0.44, 0.48], 2), top: S('plate', [0.5, 0.52, 0.56], 2), local: false };
      case 'stair':
        return b.mat === 'grate'
          ? { side: S('plate', [0.4, 0.42, 0.46], 2), top: S('plate', [0.55, 0.57, 0.6], 2), local: false }
          : { side: concrete, top: S('concrete', [0.9, 0.9, 0.88], 4), local: false };
      case 'parapet':
        return b.mat === 'metal' ? { side: S('plate', [0.4, 0.42, 0.46], 2), top: S('plate', [0.5, 0.52, 0.56], 2), local: false } : { side: concrete, top: concrete, local: false };
      default:
        return { side: concrete, top: concrete, local: false };
    }
  };

  const propFace = (surf: Surf, local: boolean, ni: number, a0: number, a1: number, b0: number, b1: number, fixed: number): void => {
    // (a,b) span the face; `fixed` is the coordinate along the normal
    const na = Math.max(1, Math.ceil((a1 - a0) / 1.25));
    const nb = Math.max(1, Math.ceil((b1 - b0) / 1.25));
    const ra = local ? Math.max(1, Math.round((a1 - a0) / surf.scale)) : 0;
    const rb = local ? Math.max(1, Math.round((b1 - b0) / surf.scale)) : 0;
    for (let i = 0; i < na; i++)
      for (let j = 0; j < nb; j++) {
        const u0 = a0 + ((a1 - a0) * i) / na;
        const u1 = a0 + ((a1 - a0) * (i + 1)) / na;
        const v0 = b0 + ((b1 - b0) * j) / nb;
        const v1 = b0 + ((b1 - b0) * (j + 1)) / nb;
        let pts: [number, number, number][];
        let axis: 'xz' | 'xy' | 'zy';
        if (ni < 2) {
          pts = [[fixed, v0, u0], [fixed, v0, u1], [fixed, v1, u1], [fixed, v1, u0]];
          axis = 'zy';
        } else if (ni < 4) {
          pts = [[u0, fixed, v0], [u1, fixed, v0], [u1, fixed, v1], [u0, fixed, v1]];
          axis = 'xz';
        } else {
          pts = [[u0, v0, fixed], [u1, v0, fixed], [u1, v1, fixed], [u0, v1, fixed]];
          axis = 'xy';
        }
        const luv: [number, number][] | undefined = local
          ? [
              [(i / na) * ra, (j / nb) * rb],
              [((i + 1) / na) * ra, (j / nb) * rb],
              [((i + 1) / na) * ra, ((j + 1) / nb) * rb],
              [(i / na) * ra, ((j + 1) / nb) * rb],
            ]
          : undefined;
        litQuad(surf, pts, ni, axis, luv);
      }
  };

  for (const b of map.props) {
    if (b.style === 'glass') {
      const cx = (b.x0 + b.x1) / 2;
      glassGeom.box(cx, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2, b.x1 - b.x0, b.y1 - b.y0, b.z1 - b.z0, [0.55, 0.85, 0.95], undefined, false);
      // mullions every 1.5 m make the pane readable as glass
      for (let z = b.z0; z <= b.z1 + 0.01; z += 1.5) glow.box(cx, (b.y0 + b.y1) / 2, Math.min(z, b.z1), 0.16, b.y1 - b.y0, 0.06, [0.12, 0.14, 0.16], undefined, false);
      glow.box(cx, b.y0 + 0.04, (b.z0 + b.z1) / 2, 0.16, 0.08, b.z1 - b.z0, [0.12, 0.14, 0.16], undefined, false);
      glow.box(cx, 1.2, (b.z0 + b.z1) / 2, 0.14, 0.05, b.z1 - b.z0, [0.12, 0.14, 0.16], undefined, false);
      continue;
    }
    if (b.style === 'barrier') {
      barrierGeom.box((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, (b.z0 + b.z1) / 2, b.x1 - b.x0, b.y1 - b.y0, b.z1 - b.z0, [1, 1, 1], undefined, false);
      continue;
    }
    const { side, top, local } = propSurf(b);
    propFace(side, local, 0, b.z0, b.z1, b.y0, b.y1, b.x1);
    propFace(side, local, 1, b.z0, b.z1, b.y0, b.y1, b.x0);
    propFace(side, local, 4, b.x0, b.x1, b.y0, b.y1, b.z1);
    propFace(side, local, 5, b.x0, b.x1, b.y0, b.y1, b.z0);
    propFace(top, local, 2, b.x0, b.x1, b.z0, b.z1, b.y1);
    if (b.y0 > 0.05) propFace(side, local, 3, b.x0, b.x1, b.z0, b.z1, b.y0);
    // emissive detailing (purely visual, flush with the collision box)
    const cx = (b.x0 + b.x1) / 2;
    const cz = (b.z0 + b.z1) / 2;
    const wx = b.x1 - b.x0;
    const wz = b.z1 - b.z0;
    if (b.style === 'turbine') {
      for (const y of [1.1, 2.3, 3.5]) glow.box(cx, y, cz, wx + 0.03, 0.09, wz + 0.03, [1.0, 0.2, 0.7], undefined, false);
      glow.box(cx, b.y1 + 0.01, cz, wx * 0.5, 0.02, wz * 0.5, [1.0, 0.35, 0.8], undefined, false);
    } else if (b.style === 'rig') {
      for (const y of [0.9, 2.6]) glow.box(cx, y, cz, wx + 0.03, 0.07, wz + 0.03, [0.2, 0.9, 1.0], undefined, false);
    } else if (b.style === 'console') {
      glow.box(cx, b.y1 + 0.006, cz, wx * 0.8, 0.012, wz * 0.45, [0.25, 0.8, 0.95], undefined, false);
    } else if (b.style === 'tank') {
      glow.box(cx, 1.4, cz, wx + 0.03, 0.06, wz + 0.03, [0.4, 1.0, 0.6], undefined, false);
    }
  }

  // ---------------------------------------------------------------- light fixtures
  for (const l of map.lights) {
    if (!l.fixture) continue;
    const m = Math.max(l.r, l.g, l.b);
    glow.box(l.x, l.y + 0.22, l.z, 1.3, 0.07, 0.34, [(l.r / m) * 1.0, (l.g / m) * 1.0, (l.b / m) * 1.0], undefined, false);
    glow.box(l.x, l.y + 0.27, l.z, 1.5, 0.05, 0.5, [0.12, 0.12, 0.13], undefined, false);
  }

  // ---------------------------------------------------------------- vault floor markings
  for (const site of [map.sites.A, map.sites.B]) {
    const z = site.zone;
    const col: RGB = [1.0, 0.25, 0.7];
    const y = 0.012;
    const w = 0.1;
    const dash = (x0: number, z0: number, x1: number, z1: number) => {
      const len = Math.hypot(x1 - x0, z1 - z0);
      const n = Math.floor(len / 1.5);
      for (let i = 0; i < n; i++) {
        const a = (i * 1.5) / len;
        const bq = (i * 1.5 + 0.9) / len;
        const ax = x0 + (x1 - x0) * a;
        const az = z0 + (z1 - z0) * a;
        const bx = x0 + (x1 - x0) * bq;
        const bz = z0 + (z1 - z0) * bq;
        // skip dashes that would be buried inside props
        if (map.world.overlaps(Math.min(ax, bx) - 0.05, 0.02, Math.min(az, bz) - 0.05, Math.max(ax, bx) + 0.05, 0.3, Math.max(az, bz) + 0.05, 1, false)) continue;
        if (x0 === x1) glow.quad([ax - w / 2, y, az], [ax + w / 2, y, az], [ax + w / 2, y, bz], [ax - w / 2, y, bz], [0, 1, 0], col);
        else glow.quad([ax, y, az - w / 2], [bx, y, az - w / 2], [bx, y, az + w / 2], [ax, y, az + w / 2], [0, 1, 0], col);
      }
    };
    dash(z.x0, z.z0, z.x1, z.z0);
    dash(z.x0, z.z1, z.x1, z.z1);
    dash(z.x0, z.z0, z.x0, z.z1);
    dash(z.x1, z.z0, z.x1, z.z1);
  }

  // ---------------------------------------------------------------- materials and meshes
  const draws: Record<TexKey, [number, (ctx: CanvasRenderingContext2D, s: number, rng: import('../shared/math').Rng) => void]> = {
    concrete: [512, drawConcrete],
    acoustic: [256, drawAcoustic],
    asphalt: [512, drawAsphalt],
    tile: [256, drawTile],
    polished: [512, drawPolished],
    metal: [256, drawMetal],
    plate: [256, drawPlate],
    wood: [256, drawWood],
    pen: [256, drawPenPanel],
    foliage: [256, drawFoliage],
    soil: [256, drawSoil],
  };
  const meshes: Mesh[] = [];
  const materials: StandardMaterial[] = [];
  let vertices = 0;
  for (const [key, geom] of geoms) {
    const mat = new StandardMaterial('map_' + key, scene);
    mat.disableLighting = true;
    mat.emissiveColor = new Color3(1, 1, 1);
    mat.specularColor = new Color3(0, 0, 0);
    mat.diffuseTexture = makeTexture(scene, 'tex_' + key, draws[key][0], draws[key][1]);
    mat.freeze();
    materials.push(mat);
    const mesh = geom.build('map_' + key, scene, mat);
    mesh.freezeWorldMatrix();
    mesh.doNotSyncBoundingInfo = true;
    mesh.alwaysSelectAsActiveMesh = true;
    meshes.push(mesh);
    vertices += geom.vertexCount;
  }
  const glowMat = new StandardMaterial('map_glow', scene);
  glowMat.disableLighting = true;
  glowMat.emissiveColor = new Color3(1, 1, 1);
  glowMat.specularColor = new Color3(0, 0, 0);
  glowMat.backFaceCulling = false;
  const glowMesh = glow.build('map_glow', scene, glowMat);
  glowMesh.freezeWorldMatrix();
  glowMesh.alwaysSelectAsActiveMesh = true;
  meshes.push(glowMesh);
  vertices += glow.vertexCount;

  const glassMat = unlit(scene, 'map_glass', [0.5, 0.82, 0.92], 0.2);
  glassMat.backFaceCulling = false;
  const glass = glassGeom.build('map_glass', scene, glassMat);
  glass.useVertexColors = false;
  glass.freezeWorldMatrix();

  const barrierMat = unlit(scene, 'map_barrier', [0.3, 0.85, 1.0], 0.28);
  barrierMat.backFaceCulling = false;
  const barrier = barrierGeom.build('map_barrier', scene, barrierMat);
  barrier.useVertexColors = false;
  barrier.freezeWorldMatrix();

  // ---------------------------------------------------------------- signage
  for (const s of map.signs) {
    const w = Math.max(0.9, s.text.length * 0.26);
    const h = 0.52;
    const tex = new DynamicTexture('sign_' + s.text, { width: Math.ceil(w * 128), height: 64 }, scene, true);
    const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
    ctx.fillStyle = '#14161a';
    ctx.fillRect(0, 0, w * 128, 64);
    ctx.fillStyle = s.color;
    ctx.fillRect(0, 0, 8, 64);
    ctx.font = '600 40px Bahnschrift, "Segoe UI", Arial, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(s.text, w * 64 + 4, 34);
    tex.update(true);
    const mat = new StandardMaterial('signm_' + s.text, scene);
    mat.disableLighting = true;
    mat.emissiveTexture = tex;
    mat.specularColor = new Color3(0, 0, 0);
    mat.diffuseColor = new Color3(0, 0, 0);
    mat.backFaceCulling = false;
    const g = new Geom();
    // right vector for a wall with outward normal (nx, nz), so text reads left-to-right when facing the sign
    const rx = s.nz;
    const rz = -s.nx;
    const a: [number, number, number] = [s.x - (rx * w) / 2, s.y - h / 2, s.z - (rz * w) / 2];
    const bq: [number, number, number] = [s.x + (rx * w) / 2, s.y - h / 2, s.z + (rz * w) / 2];
    const c: [number, number, number] = [s.x + (rx * w) / 2, s.y + h / 2, s.z + (rz * w) / 2];
    const d: [number, number, number] = [s.x - (rx * w) / 2, s.y + h / 2, s.z - (rz * w) / 2];
    g.quad(a, bq, c, d, [s.nx, 0, s.nz], [1, 1, 1], [
      [1, 0],
      [0, 0],
      [0, 1],
      [1, 1],
    ]);
    const mesh = g.build('sign', scene, mat);
    mesh.useVertexColors = false;
    mesh.freezeWorldMatrix();
    meshes.push(mesh);
  }

  return { meshes, barrier, glass, materials, barrierMat, bakeRays: baker.rays, vertices };
}

/** Gradient sky dome (unlit, follows the camera). */
export function buildSky(scene: Scene): Mesh {
  const g = new Geom();
  const seg = 24;
  const rings = 10;
  const colorAt = (y: number): RGB => {
    const t = Math.max(0, Math.min(1, y * 1.15 + 0.08));
    const k = Math.pow(t, 0.6);
    return [0.9 + (0.36 - 0.9) * k, 0.92 + (0.56 - 0.92) * k, 0.95 + (0.86 - 0.95) * k];
  };
  for (let j = 0; j < rings; j++) {
    const t0 = (j / rings) * Math.PI;
    const t1 = ((j + 1) / rings) * Math.PI;
    for (let i = 0; i < seg; i++) {
      const p0 = (i / seg) * Math.PI * 2;
      const p1 = ((i + 1) / seg) * Math.PI * 2;
      const pt = (t: number, p: number): [number, number, number] => [Math.sin(t) * Math.cos(p) * 220, Math.cos(t) * 220, Math.sin(t) * Math.sin(p) * 220];
      const a = pt(t0, p0);
      const b = pt(t0, p1);
      const c = pt(t1, p1);
      const d = pt(t1, p0);
      g.quad(a, b, c, d, [0, -1, 0], [colorAt(a[1] / 220), colorAt(b[1] / 220), colorAt(c[1] / 220), colorAt(d[1] / 220)]);
    }
  }
  const mat = new StandardMaterial('sky', scene);
  mat.disableLighting = true;
  mat.emissiveColor = new Color3(1, 1, 1);
  mat.backFaceCulling = false;
  mat.fogEnabled = false;
  const mesh = g.build('sky', scene, mat);
  mesh.infiniteDistance = true;
  mesh.alwaysSelectAsActiveMesh = true;
  return mesh;
}
