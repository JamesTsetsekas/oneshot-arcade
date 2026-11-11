// World streaming for the renderer: the district is cut into 100 m cells. Ground, landmarks and a
// banded HLOD for buildings are always resident; textured facades, props and neon stream in priority
// rings around the camera (biased along velocity) and are built one cell per frame to avoid hitches.
import { Mesh, Scene, Material, AbstractMesh } from '@babylonjs/core';
import { Geo, rgb } from './geo';
import { G, F, groundUV, facadeUV } from './textures';
import { segments, intersections, blocks, Block, Segment, Rect, hillHeight, terrainH, CURB, CANAL, decks, LotType, Zone } from '../world/district';
import { buildings, parts, Building, Part, STYLE } from '../world/lots';
import { hash2 } from '../core/math';

export const CELL = 100, CELLS = 10, HALF = 500;
export interface CityMaterials { ground: Material; facade: Material; flat: Material; glowNight: Material; glowAlways: Material }
interface Cell {
  ix: number; iz: number; cx: number; cz: number;
  buildings: Building[]; parts: Part[]; farParts: Part[];
  always: Mesh[]; hlod: Mesh | null; detail: Mesh[] | null; wanted: boolean;
}
const cellIndex = (v: number) => Math.max(0, Math.min(CELLS - 1, Math.floor((v + HALF) / CELL)));
const FLOOR_H = 3.4, MODULE_W = 4;

const LOT_TILE: Partial<Record<LotType, number>> = { plaza: G.plaza, park: G.grass, parking: G.parking, yard: G.concrete, docks: G.concrete, quayS: G.concrete, quayE: G.concrete, corner: G.concrete, garage: G.concrete, port: G.concrete, warehouse: G.concrete, tower: G.plaza, police: G.concrete, marginN: G.cobble, marginW: G.cobble };
const ZONE_TILE: Record<Zone, number> = { tide: G.cobble, glassline: G.concrete, lantern: G.cobble, canal: G.cobble, foundry: G.concrete, breakwater: G.concrete };

function steps(a: number, b: number, target: number, ring = 0): number[] {
  const out = [a];
  let s = a, e = b;
  if (ring > 0 && b - a > ring * 2 + 2) { s = a + ring; e = b - ring; out.push(s); }
  const n = Math.max(1, Math.round((e - s) / target));
  for (let k = 1; k <= n; k++) out.push(s + ((e - s) * k) / n);
  if (e !== b) out.push(b);
  return out;
}

export class City {
  cells: Cell[] = [];
  shadowCasters: AbstractMesh[] = [];
  onDetail: ((meshes: Mesh[], added: boolean) => void) | null = null;
  detailRadius = 185;
  stats = { detailCells: 0, built: 0, lastBuildMs: 0, maxBuildMs: 0 };
  constructor(private scene: Scene, private mats: CityMaterials) {
    for (let ix = 0; ix < CELLS; ix++) for (let iz = 0; iz < CELLS; iz++) {
      this.cells.push({ ix, iz, cx: -HALF + (ix + 0.5) * CELL, cz: -HALF + (iz + 0.5) * CELL, buildings: [], parts: [], farParts: [], always: [], hlod: null, detail: null, wanted: false });
    }
    for (const b of buildings) this.cellAt((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2).buildings.push(b);
    for (const p of parts) {
      const c = this.cellAt(p.x, p.z);
      // tall or wide parts are landmarks: they stay visible at any distance
      if (Math.max(p.hx, p.hy, p.hz) >= 4.5 || (p.glow === 2 && p.y > 12)) c.farParts.push(p); else c.parts.push(p);
    }
  }
  cellAt(x: number, z: number) { return this.cells[cellIndex(x) * CELLS + cellIndex(z)]; }

  // ------------------------------------------------------------------ always-resident geometry
  private groundGeos = new Map<Cell, Geo>();
  private gg(x: number, z: number): Geo { const c = this.cellAt(x, z); let g = this.groundGeos.get(c); if (!g) { g = new Geo(); this.groundGeos.set(c, g); } return g; }
  private tile(g: Geo, x0: number, z0: number, x1: number, z1: number, h: (x: number, z: number) => number, t: number, uvRot = 0, uA = 0, uB = 1, vA = 0, vB = 1, shade = 1) {
    const uv = groundUV(t), du = uv[2] - uv[0], dv = uv[3] - uv[1];
    const U = (u: number) => uv[0] + du * u, V = (v: number) => uv[1] + dv * v;
    const y00 = h(x0, z0), y10 = h(x1, z0), y11 = h(x1, z1), y01 = h(x0, z1);
    // normal from the height gradient
    const nx = -((y10 - y00) + (y11 - y01)) / (2 * (x1 - x0)), nz = -((y01 - y00) + (y11 - y10)) / (2 * (z1 - z0)), nl = Math.hypot(nx, 1, nz);
    const i = g.pos.length / 3;
    g.pos.push(x0, y00, z0, x1, y10, z0, x1, y11, z1, x0, y01, z1);
    for (let k = 0; k < 4; k++) { g.nrm.push(nx / nl, 1 / nl, nz / nl); g.col.push(shade, shade, shade, 1); }
    if (uvRot === 0) g.uv.push(U(uA), V(vA), U(uB), V(vA), U(uB), V(vB), U(uA), V(vB)); // u along x, v along z
    else g.uv.push(U(uA), V(vA), U(uA), V(vB), U(uB), V(vB), U(uB), V(vA));             // u along z, v along x
    g.idx.push(i, i + 1, i + 2, i, i + 2, i + 3);
  }
  private curb(g: Geo, x0: number, z0: number, x1: number, z1: number, nx: number, nz: number) {
    const y0 = hillHeight(x0, z0), y1 = hillHeight(x1, z1), uv = groundUV(G.sidewalk);
    g.quad(x0, y0 - 0.05, z0, x1, y1 - 0.05, z1, x1, y1 + CURB, z1, x0, y0 + CURB, z0, nx, 0, nz, 0.62, 0.6, 0.56, uv[0], uv[1], uv[0] + 0.02, uv[1] + 0.02);
  }
  private fine(x0: number, z0: number, x1: number, z1: number, tileOf: (x: number, z: number, y: number) => number) {
    for (let x = x0; x < x1 - 0.01; x += 2) for (let z = z0; z < z1 - 0.01; z += 2) {
      const xe = Math.min(x1, x + 2), ze = Math.min(z1, z + 2), mx = (x + xe) / 2, mz = (z + ze) / 2;
      this.tile(this.gg(mx, mz), x, z, xe, ze, terrainH, tileOf(mx, mz, terrainH(mx, mz)), 0, (x % 8) / 8, (x % 8) / 8 + (xe - x) / 8, (z % 8) / 8, (z % 8) / 8 + (ze - z) / 8);
    }
  }
  private roadSegment(s: Segment) {
    const r = s.rect, v = s.axis === 'v';
    const road = s.cls === 'arterial' ? G.arterial : s.cls === 'collector' ? G.collector : s.bridge ? G.deck : G.street;
    const a0 = v ? r.z0 : r.x0, a1 = v ? r.z1 : r.x1; // along
    const c0 = v ? r.x0 : r.z0, c1 = v ? r.x1 : r.z1; // across
    const na = s.cls === 'arterial' ? 4 : s.cls === 'collector' ? 3 : 2;
    const startX = !(s.axis === 'h' && s.gap === 0), endX = !(s.axis === 'v' && s.gap === 8);
    const alongs: { a: number; b: number; t: number; va: number; vb: number }[] = [];
    let s0 = a0, s1 = a1;
    if (startX) { alongs.push({ a: a0, b: a0 + 4, t: G.crosswalk, va: 1, vb: 0 }); s0 = a0 + 4; }
    if (endX) { alongs.push({ a: a1 - 4, b: a1, t: G.crosswalk, va: 0, vb: 1 }); s1 = a1 - 4; }
    const n = Math.max(1, Math.round((s1 - s0) / 8));
    for (let k = 0; k < n; k++) alongs.push({ a: s0 + ((s1 - s0) * k) / n, b: s0 + ((s1 - s0) * (k + 1)) / n, t: road, va: 0, vb: 1 });
    for (const al of alongs) for (let j = 0; j < na; j++) {
      const u0 = j / na, u1 = (j + 1) / na, p0 = c0 + (c1 - c0) * u0, p1 = c0 + (c1 - c0) * u1;
      const mid = (al.a + al.b) / 2;
      if (v) this.tile(this.gg((p0 + p1) / 2, mid), p0, al.a, p1, al.b, hillHeight, al.t, 0, u0, u1, al.va, al.vb);
      else this.tile(this.gg(mid, (p0 + p1) / 2), al.a, p0, al.b, p1, hillHeight, al.t, 1, u0, u1, al.va, al.vb);
    }
  }
  private raisedStrip(s: Segment) {
    const r = s.rect, h = (x: number, z: number) => hillHeight(x, z) + CURB;
    if (s.axis === 'h' && s.gap === 2) { this.fine(r.x0, r.z0, r.x1, r.z1, (x, _z, y) => (y < -1 ? G.canal : G.cobble)); return; }
    const t = s.kind === 'ped' ? G.plaza : G.concrete;
    const xs = steps(r.x0, r.x1, 8), zs = steps(r.z0, r.z1, 8);
    for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < zs.length - 1; j++) this.tile(this.gg((xs[i] + xs[i + 1]) / 2, (zs[j] + zs[j + 1]) / 2), xs[i], zs[j], xs[i + 1], zs[j + 1], h, t);
    // kerb faces where the raised strip meets an intersection
    const g = this.gg((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2);
    if (s.axis === 'v') { this.curb(g, r.x0, r.z0, r.x1, r.z0, 0, -1); this.curb(g, r.x0, r.z1, r.x1, r.z1, 0, 1); }
    else { this.curb(g, r.x0, r.z0, r.x0, r.z1, -1, 0); this.curb(g, r.x1, r.z0, r.x1, r.z1, 1, 0); }
  }
  private block(b: Block) {
    const r = b.rect;
    const inner = LOT_TILE[b.lot] ?? ZONE_TILE[b.zone];
    const ringOf = (x: number, z: number) => (x - r.x0 < 4 || r.x1 - x < 4 || z - r.z0 < 4 || r.z1 - z < 4 ? G.sidewalk : inner);
    if (b.bx === 2 || b.bz === 0 || b.bx === 8) {
      this.fine(r.x0, r.z0, r.x1, r.z1, (x, z, y) => (y < -4.4 ? G.dirt : y < -1 ? G.canal : y < CURB - 0.03 && x >= CANAL.x0 - 9 && x <= CANAL.x1 + 9 ? G.concrete : ringOf(x, z)));
    } else {
      const h = (x: number, z: number) => hillHeight(x, z) + CURB;
      const xs = steps(r.x0, r.x1, 8, 4), zs = steps(r.z0, r.z1, 8, 4);
      for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < zs.length - 1; j++) {
        const mx = (xs[i] + xs[i + 1]) / 2, mz = (zs[j] + zs[j + 1]) / 2;
        this.tile(this.gg(mx, mz), xs[i], zs[j], xs[i + 1], zs[j + 1], h, ringOf(mx, mz), 0, 0, (xs[i + 1] - xs[i]) / 8, 0, (zs[j + 1] - zs[j]) / 8);
      }
    }
    // kerb faces around the block perimeter
    const along = (x0: number, z0: number, x1: number, z1: number, nx: number, nz: number) => {
      const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / 12));
      for (let k = 0; k < n; k++) {
        const ax = x0 + ((x1 - x0) * k) / n, az = z0 + ((z1 - z0) * k) / n, bx = x0 + ((x1 - x0) * (k + 1)) / n, bz = z0 + ((z1 - z0) * (k + 1)) / n;
        if (terrainH((ax + bx) / 2 - nx * 0.5, (az + bz) / 2 - nz * 0.5) < -0.5) continue; // canal / sea edge
        this.curb(this.gg((ax + bx) / 2, (az + bz) / 2), ax, az, bx, bz, nx, nz);
      }
    };
    if (b.bz > 0) along(r.x0, r.z0, r.x1, r.z0, 0, -1);
    if (b.bz < 8) along(r.x0, r.z1, r.x1, r.z1, 0, 1);
    if (b.bx > 0) along(r.x0, r.z0, r.x0, r.z1, -1, 0);
    if (b.bx < 8) along(r.x1, r.z0, r.x1, r.z1, 1, 0);
  }
  private emitPart(g: Geo, p: Part) {
    switch (p.shape) {
      case 'box': g.box(p.x, p.y, p.z, p.hx, p.hy, p.hz, p.yaw, p.color); break;
      case 'cyl': g.cyl(p.x, p.y, p.z, p.hx, p.hy, p.hz, p.color, Math.max(p.hx, p.hz) > 1.2 ? 12 : 6); break;
      case 'cone': g.cyl(p.x, p.y, p.z, p.hx, p.hy, p.hz, p.color, 8, 0); break;
      case 'ball': g.ball(p.x, p.y, p.z, p.hx, p.hy, p.hz, p.color, p.yaw); break;
      case 'prism': g.prism(p.x, p.y, p.z, p.hx, p.hy, p.hz, p.yaw, p.color); break;
    }
  }
  private partMeshes(c: Cell, list: Part[], tag: string): Mesh[] {
    const lit = new Geo(), gn = new Geo(), ga = new Geo();
    for (const p of list) this.emitPart(p.glow === 1 ? gn : p.glow === 2 ? ga : lit, p);
    const out: Mesh[] = [];
    const add = (g: Geo, mat: Material, name: string, cast: boolean) => { if (g.empty) return; const m = g.toMesh(`${name}_${c.ix}_${c.iz}`, this.scene, mat); m.freezeWorldMatrix(); m.receiveShadows = cast; (m as any).__cast = cast; out.push(m); };
    add(lit, this.mats.flat, tag, true); add(gn, this.mats.glowNight, tag + 'Gn', false); add(ga, this.mats.glowAlways, tag + 'Ga', false);
    return out;
  }
  /** Build everything that must never be missing: ground for the whole district, landmarks, HLOD. */
  buildStatic() {
    for (const s of segments) { if (s.kind === 'road') this.roadSegment(s); else this.raisedStrip(s); }
    for (const it of intersections) {
      const r = it.rect, mx = (r.x0 + r.x1) / 2, mz = (r.z0 + r.z1) / 2, g = this.gg(mx, mz);
      this.tile(g, r.x0, r.z0, mx, mz, hillHeight, G.asphalt); this.tile(g, mx, r.z0, r.x1, mz, hillHeight, G.asphalt);
      this.tile(g, r.x0, mz, mx, r.z1, hillHeight, G.asphalt); this.tile(g, mx, mz, r.x1, r.z1, hillHeight, G.asphalt);
    }
    for (const b of blocks) this.block(b);
    // channel under the bridges + the deck slabs themselves
    for (const d of decks) {
      const s = d.seg.rect;
      this.fine(d.rect.x0, s.z0, d.rect.x1, s.z1, () => G.canal);
    }
    for (const [c, g] of this.groundGeos) { const m = g.toMesh(`ground_${c.ix}_${c.iz}`, this.scene, this.mats.ground); m.freezeWorldMatrix(); m.receiveShadows = true; c.always.push(m); }
    this.groundGeos.clear();
    const deckGeo = new Geo();
    for (const d of decks) {
      const s = d.seg.rect, cx = (d.rect.x0 + d.rect.x1) / 2, hx = (d.rect.x1 - d.rect.x0) / 2;
      deckGeo.box(cx, d.y - 0.5, (s.z0 + s.z1) / 2, hx, 0.45, (s.z1 - s.z0) / 2, 0, 0x8f8a80, 6);
      deckGeo.box(cx, d.y + CURB - 0.45, (d.rect.z0 + s.z0) / 2, hx, 0.45, (s.z0 - d.rect.z0) / 2, 0, 0xb9b3a6);
      deckGeo.box(cx, d.y + CURB - 0.45, (d.rect.z1 + s.z1) / 2, hx, 0.45, (d.rect.z1 - s.z1) / 2, 0, 0xb9b3a6);
    }
    const dm = deckGeo.toMesh('decks', this.scene, this.mats.flat); dm.freezeWorldMatrix(); dm.receiveShadows = true; this.cells[0].always.push(dm); dm.alwaysSelectAsActiveMesh = true;
    for (const c of this.cells) {
      for (const m of this.partMeshes(c, c.farParts, 'far')) { c.always.push(m); if ((m as any).__cast) this.shadowCasters.push(m); }
      this.buildHlod(c);
    }
  }
  private buildHlod(c: Cell) {
    if (!c.buildings.length) return;
    const g = new Geo();
    for (const b of c.buildings) {
      const [r, gg, bb] = rgb(b.tint), dark = b.style === STYLE.glass ? 0.62 : 0.74;
      const floors = Math.max(1, Math.round((b.top - b.base - 0.6) / FLOOR_H)), fh = (b.top - b.base - 0.6) / floors;
      const band = (y0: number, y1: number, k: number) => {
        g.quad(b.x0, y0, b.z0, b.x1, y0, b.z0, b.x1, y1, b.z0, b.x0, y1, b.z0, 0, 0, -1, r * k, gg * k, bb * k);
        g.quad(b.x1, y0, b.z1, b.x0, y0, b.z1, b.x0, y1, b.z1, b.x1, y1, b.z1, 0, 0, 1, r * k, gg * k, bb * k);
        g.quad(b.x1, y0, b.z0, b.x1, y0, b.z1, b.x1, y1, b.z1, b.x1, y1, b.z0, 1, 0, 0, r * k * 0.93, gg * k * 0.93, bb * k * 0.93);
        g.quad(b.x0, y0, b.z1, b.x0, y0, b.z0, b.x0, y1, b.z0, b.x0, y1, b.z1, -1, 0, 0, r * k * 0.93, gg * k * 0.93, bb * k * 0.93);
      };
      band(b.base, b.base + 0.6, 0.9);
      for (let f = 0; f < floors; f++) { const y = b.base + 0.6 + f * fh; band(y, y + fh * 0.3, 0.97); band(y + fh * 0.3, y + fh * 0.82, dark); band(y + fh * 0.82, y + fh, 0.97); }
      const [rr, rg, rb] = rgb(b.roof);
      g.quad(b.x0, b.top, b.z0, b.x1, b.top, b.z0, b.x1, b.top, b.z1, b.x0, b.top, b.z1, 0, 1, 0, rr, rg, rb);
    }
    c.hlod = g.toMesh(`hlod_${c.ix}_${c.iz}`, this.scene, this.mats.flat); c.hlod.freezeWorldMatrix();
  }

  // ------------------------------------------------------------------ streamed detail
  private buildDetail(c: Cell) {
    const t0 = performance.now();
    const meshes: Mesh[] = [];
    if (c.buildings.length) {
      const g = new Geo();
      for (const b of c.buildings) this.facade(g, b);
      const m = g.toMesh(`bld_${c.ix}_${c.iz}`, this.scene, this.mats.facade); m.freezeWorldMatrix(); m.receiveShadows = true; (m as any).__cast = true; meshes.push(m);
    }
    meshes.push(...this.partMeshes(c, c.parts, 'parts'));
    c.detail = meshes;
    if (c.hlod) c.hlod.setEnabled(false);
    this.onDetail?.(meshes, true);
    this.stats.built++; this.stats.detailCells++;
    this.stats.lastBuildMs = performance.now() - t0; this.stats.maxBuildMs = Math.max(this.stats.maxBuildMs, this.stats.lastBuildMs);
  }
  private dropDetail(c: Cell) {
    if (!c.detail) return;
    this.onDetail?.(c.detail, false);
    for (const m of c.detail) m.dispose();
    c.detail = null; this.stats.detailCells--;
    if (c.hlod) c.hlod.setEnabled(true);
  }
  private facade(g: Geo, b: Building) {
    const [r, gg, bb] = rgb(b.tint), row = b.style;
    const ground = b.stacked ? b.base : b.base + 0.6;
    const floors = Math.max(1, Math.round((b.top - ground) / FLOOR_H)), fh = (b.top - ground) / floors;
    const wall = (ax: number, az: number, bx: number, bz: number, nx: number, nz: number, side: number) => {
      const len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(len / MODULE_W));
      const k = nx !== 0 ? 0.93 : 1;
      if (!b.stacked) { const uv = facadeUV(F.wall, row); g.quad(ax, b.base, az, bx, b.base, bz, bx, ground, bz, ax, ground, az, nx, 0, nz, r * k * 0.8, gg * k * 0.8, bb * k * 0.8, uv[0], uv[1], uv[2], uv[1] + 0.01); }
      for (let i = 0; i < n; i++) {
        const x0 = ax + ((bx - ax) * i) / n, z0 = az + ((bz - az) * i) / n, x1 = ax + ((bx - ax) * (i + 1)) / n, z1 = az + ((bz - az) * (i + 1)) / n;
        for (let f = 0; f < floors; f++) {
          const h = hash2(b.id * 7 + side * 131 + i, f, 5);
          let col: number;
          if (f === 0 && !b.stacked) col = b.shop ? (h < 0.72 ? F.shop : F.door) : h < 0.14 ? F.door : h < 0.3 && (b.style === STYLE.shed || b.style === STYLE.brick) ? F.special : h < 0.75 ? F.win : F.wall;
          else if (f === floors - 1) col = F.top;
          else col = h < 0.34 ? F.winLit : h < 0.9 ? F.win : F.blank;
          const uv = facadeUV(col, row), y0 = ground + f * fh, y1 = y0 + fh;
          g.quad(x0, y0, z0, x1, y0, z1, x1, y1, z1, x0, y1, z0, nx, 0, nz, r * k, gg * k, bb * k, uv[0], uv[1], uv[2], uv[3], f === 0 && !b.stacked ? 0.86 : 1);
        }
      }
    };
    wall(b.x0, b.z0, b.x1, b.z0, 0, -1, 0); wall(b.x1, b.z0, b.x1, b.z1, 1, 0, 1);
    wall(b.x1, b.z1, b.x0, b.z1, 0, 1, 2); wall(b.x0, b.z1, b.x0, b.z0, -1, 0, 3);
    const [rr, rg, rb] = rgb(b.roof), uv = facadeUV(F.wall, 5);
    g.quad(b.x0, b.top, b.z0, b.x1, b.top, b.z0, b.x1, b.top, b.z1, b.x0, b.top, b.z1, 0, 1, 0, rr, rg, rb, uv[0], uv[1], uv[0] + 0.01, uv[1] + 0.01);
    // parapet lip
    const [pr, pg, pb] = [r * 0.82, gg * 0.82, bb * 0.82];
    for (const [ax, az, bx, bz, nx, nz] of [[b.x0, b.z0, b.x1, b.z0, 0, -1], [b.x1, b.z0, b.x1, b.z1, 1, 0], [b.x1, b.z1, b.x0, b.z1, 0, 1], [b.x0, b.z1, b.x0, b.z0, -1, 0]] as const)
      g.quad(ax + nx * 0.12, b.top, az + nz * 0.12, bx + nx * 0.12, b.top, bz + nz * 0.12, bx + nx * 0.12, b.top + 0.5, bz + nz * 0.12, ax + nx * 0.12, b.top + 0.5, az + nz * 0.12, nx, 0, nz, pr, pg, pb, uv[0], uv[1], uv[0] + 0.01, uv[1] + 0.01);
  }
  /** Synchronously load the cells around a point (used behind the loading screen). */
  warm(x: number, z: number) {
    for (const c of this.cells) if (Math.hypot(c.cx - x, c.cz - z) < this.detailRadius && !c.detail) this.buildDetail(c);
  }
  /** Per-frame streaming: priority rings around the camera, pushed forward along velocity. */
  update(x: number, z: number, vx: number, vz: number) {
    const ax = x + vx * 2.5, az = z + vz * 2.5;
    let best: Cell | null = null, bd = Infinity;
    for (const c of this.cells) {
      const d = Math.min(Math.hypot(c.cx - x, c.cz - z), Math.hypot(c.cx - ax, c.cz - az));
      if (d < this.detailRadius) { if (!c.detail && d < bd) { bd = d; best = c; } }
      else if (d > this.detailRadius + 60 && c.detail) this.dropDetail(c);
    }
    if (best) this.buildDetail(best);
  }
}
