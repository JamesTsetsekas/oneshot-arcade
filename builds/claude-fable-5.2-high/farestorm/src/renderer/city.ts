// Static city geometry generated from the world model: terrain, roads, buildings, structures,
// landmarks, props, shortcut gates and traffic signals. Everything is merged into a handful of meshes.
import {
  Scene, Mesh, StandardMaterial, Color3, Color4, VertexData, Matrix, Quaternion, Vector3, MeshBuilder, InstancedMesh, Texture,
} from '@babylonjs/core';
import { WorldModel, Site, Building } from '../world/model';
import { CELL, NX, NZ, WORLD_W, WORLD_D, RoadClass, District } from '../world/galeport';
import { MeshBuf, RGB, hsl, mul, mix } from './meshbuf';
import { roadTexture, zebraTexture, facadeTexture, shopTexture, terrainTexture, seaTexture } from './textures';
import { V3, quatYaw, quatLookDir, quatMul, Rng, lerp } from '../core/math';
import { signalState } from '../traffic/traffic';

export interface City {
  shadowCasters: Mesh[];
  terrain: Mesh;
  sea: Mesh;
  seaTex: Texture;
  updateSignals(time: number): void;
}

const WALLS: Record<District, RGB[]> = {
  harbor: [[0.93, 0.88, 0.78], [0.62, 0.8, 0.78], [0.9, 0.62, 0.5], [0.72, 0.82, 0.9], [0.86, 0.84, 0.8]],
  beach: [[1, 0.98, 0.94], [1, 0.84, 0.72], [0.74, 0.93, 0.86], [0.76, 0.88, 0.98], [1, 0.92, 0.66]],
  oldsteps: [[0.94, 0.7, 0.52], [0.96, 0.82, 0.56], [0.98, 0.9, 0.78], [0.93, 0.66, 0.62], [0.86, 0.76, 0.62]],
  civic: [[0.96, 0.93, 0.86], [0.9, 0.88, 0.84], [0.78, 0.9, 0.9], [0.98, 0.9, 0.74]],
  lantern: [[0.56, 0.44, 0.72], [0.34, 0.48, 0.7], [0.26, 0.56, 0.6], [0.74, 0.42, 0.56], [0.42, 0.42, 0.58]],
  highline: [[0.8, 0.9, 0.94], [0.7, 0.84, 0.9], [0.92, 0.94, 0.96], [0.62, 0.78, 0.86]],
};
const ROOFS: Record<District, RGB[]> = {
  harbor: [[0.66, 0.38, 0.3], [0.5, 0.55, 0.58]], beach: [[0.95, 0.95, 0.92], [0.3, 0.7, 0.7]], oldsteps: [[0.74, 0.4, 0.28], [0.68, 0.34, 0.26]],
  civic: [[0.55, 0.6, 0.62], [0.3, 0.6, 0.58]], lantern: [[0.24, 0.26, 0.36], [0.3, 0.24, 0.38]], highline: [[0.6, 0.66, 0.7], [0.5, 0.56, 0.62]],
};
const AWNINGS: RGB[] = [[1, 0.42, 0.36], [0.16, 0.74, 0.7], [1, 0.78, 0.24], [0.96, 0.96, 0.92], [0.5, 0.4, 0.9]];
const NEON: RGB[] = [[1, 0.2, 0.7], [0.1, 0.95, 0.95], [1, 0.85, 0.2], [0.5, 1, 0.3], [1, 0.45, 0.2]];
const CONTAINER: RGB[] = [[0.9, 0.35, 0.25], [0.15, 0.6, 0.7], [0.95, 0.75, 0.2], [0.3, 0.45, 0.75], [0.85, 0.85, 0.82], [0.35, 0.65, 0.4]];

function litMat(scene: Scene, name: string, opts: { tex?: Texture; spec?: number; color?: RGB } = {}): StandardMaterial {
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = opts.color ? new Color3(opts.color[0], opts.color[1], opts.color[2]) : Color3.White();
  m.specularColor = new Color3(opts.spec ?? 0.04, opts.spec ?? 0.04, opts.spec ?? 0.04);
  if (opts.tex) m.diffuseTexture = opts.tex;
  return m;
}
export function glowMat(scene: Scene, name: string, color?: RGB): StandardMaterial {
  const m = new StandardMaterial(name, scene);
  m.disableLighting = true;
  m.emissiveColor = color ? new Color3(color[0], color[1], color[2]) : Color3.White();
  m.diffuseColor = Color3.Black();
  m.specularColor = Color3.Black();
  return m;
}
function finish(mesh: Mesh, receive = true): Mesh {
  mesh.isPickable = false;
  mesh.receiveShadows = receive;
  mesh.freezeWorldMatrix();
  mesh.doNotSyncBoundingInfo = true;
  return mesh;
}

export function buildCity(scene: Scene, model: WorldModel): City {
  const casters: Mesh[] = [];
  const terrain = buildTerrain(scene, model);
  buildRoads(scene, model);
  casters.push(...buildBuildings(scene, model));
  const solid = new MeshBuf();
  const glow = new MeshBuf();
  buildBoxesAndRamps(solid, model);
  for (const s of model.sites) buildLandmark(solid, glow, s, model);
  buildGates(solid, glow, model);
  const signalPositions = buildSignalPoles(solid, model);
  const solidMesh = finish(solid.toMesh('city-solid', scene, litMat(scene, 'solid', { spec: 0.08 })));
  casters.push(solidMesh);
  const glowMesh = finish(glow.toMesh('city-glow', scene, glowMat(scene, 'glow')), false);
  glowMesh.applyFog = true;
  casters.push(...buildProps(scene, model));

  // Sea (also fills the canal): one big plane at y = 0.
  const seaTex = seaTexture(scene);
  seaTex.uScale = 220; seaTex.vScale = 220;
  const sea = MeshBuilder.CreateGround('sea', { width: 7000, height: 7000 }, scene);
  sea.position.set(WORLD_W / 2, 0, WORLD_D / 2);
  const seaMat = new StandardMaterial('sea', scene);
  seaMat.diffuseColor = new Color3(0.07, 0.4, 0.74);
  seaMat.diffuseTexture = seaTex;
  seaMat.specularColor = new Color3(1, 0.92, 0.75);
  seaMat.specularPower = 180;
  seaMat.alpha = 0.9;
  sea.material = seaMat;
  sea.isPickable = false;

  // Signal lamps (instanced, recoloured on phase changes).
  const lampBase = MeshBuilder.CreateSphere('signal-lamp', { diameter: 0.9, segments: 6 }, scene);
  lampBase.material = glowMat(scene, 'lamp');
  lampBase.registerInstancedBuffer('color', 4);
  lampBase.instancedBuffers.color = new Color4(1, 1, 1, 1);
  lampBase.isVisible = false;
  const lamps: { inst: InstancedMesh; node: number; axisNS: boolean; state: number }[] = [];
  for (const p of signalPositions) {
    const inst = lampBase.createInstance('lamp');
    inst.position.set(p.x, p.y, p.z);
    inst.instancedBuffers.color = new Color4(1, 0, 0, 1);
    inst.isPickable = false;
    inst.freezeWorldMatrix();
    lamps.push({ inst, node: p.node, axisNS: p.axisNS, state: -1 });
  }
  const COLORS = [new Color4(0.2, 1, 0.45, 1), new Color4(1, 0.8, 0.15, 1), new Color4(1, 0.16, 0.14, 1)];
  let lastUpdate = -1;
  return {
    shadowCasters: casters, terrain, sea, seaTex,
    updateSignals(time: number) {
      if (Math.abs(time - lastUpdate) < 0.2) return;
      lastUpdate = time;
      for (const l of lamps) {
        const st = signalState(l.node, l.axisNS, time);
        if (st !== l.state) { l.state = st; l.inst.instancedBuffers.color = COLORS[st]; }
      }
    },
  };
}

function buildTerrain(scene: Scene, model: WorldModel): Mesh {
  const w = NX + 1, h = NZ + 1;
  const pos = new Float32Array(w * h * 3), nrm = new Float32Array(w * h * 3), uv = new Float32Array(w * h * 2);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = i + j * w, x = i * CELL, z = j * CELL;
    pos[k * 3] = x; pos[k * 3 + 1] = model.heights[k]; pos[k * 3 + 2] = z;
    const n = model.normalAt(x, z);
    nrm[k * 3] = n.x; nrm[k * 3 + 1] = n.y; nrm[k * 3 + 2] = n.z;
    uv[k * 2] = x / WORLD_W; uv[k * 2 + 1] = z / WORLD_D;
  }
  const idx = new Uint32Array(NX * NZ * 6);
  let o = 0;
  for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
    const a = i + j * w, b = a + 1, c = a + 1 + w, d = a + w;
    idx[o++] = a; idx[o++] = b; idx[o++] = c;
    idx[o++] = a; idx[o++] = c; idx[o++] = d;
  }
  const mesh = new Mesh('terrain', scene);
  const vd = new VertexData();
  vd.positions = pos; vd.normals = nrm; vd.uvs = uv; vd.indices = idx;
  vd.applyToMesh(mesh);
  const mat = litMat(scene, 'terrain', { tex: terrainTexture(scene, model), spec: 0.02 });
  mesh.material = mat;
  return finish(mesh);
}

function buildRoads(scene: Scene, model: WorldModel): void {
  const bufs = new Map<RoadClass, MeshBuf>();
  const zebra = new MeshBuf();
  const up = { x: 0, y: 1, z: 0 };
  const white: RGB = [1, 1, 1];
  for (const e of model.edges) {
    if (!bufs.has(e.cls)) bufs.set(e.cls, new MeshBuf());
    const mb = bufs.get(e.cls)!;
    const a = model.nodes[e.a], b = model.nodes[e.b];
    const s0 = a.clear, s1 = e.len - b.clear;
    const n = Math.max(1, Math.ceil((s1 - s0) / 3));
    const lift = e.structure ? 0.05 : 0.08;
    const pt = (s: number, off: number): V3 => {
      const x = a.x + e.dx * s + e.dz * off, z = a.z + e.dz * s - e.dx * off;
      return { x, z, y: (e.structure ? lerp(e.ya, e.yb, s / e.len) : model.heightAt(x, z)) + lift };
    };
    for (let i = 0; i < n; i++) {
      const sa = lerp(s0, s1, i / n), sb = lerp(s0, s1, (i + 1) / n);
      const va = sa / 16, vb = sb / 16;
      mb.quad(pt(sa, -e.hw), pt(sa, 0), pt(sb, 0), pt(sb, -e.hw), white, up, [0, va, 0.5, vb]);
      mb.quad(pt(sa, 0), pt(sa, e.hw), pt(sb, e.hw), pt(sb, 0), white, up, [0.5, va, 1, vb]);
    }
    // Zebra crossings at signalised junctions.
    if (!e.structure) for (const [node, s, dir] of [[a, s0, 1], [b, s1, -1]] as [typeof a, number, number][]) {
      if (!node.signal || node.clear === 0) continue;
      const z0 = s + dir * 0.6, z1 = s + dir * 3.8;
      const zp = (ss: number, off: number): V3 => { const p = pt(ss, off); p.y += 0.035; return p; };
      const stripes = Math.round((e.hw * 2 - 1.6) / 1.2);
      zebra.quad(zp(z0, -e.hw + 0.8), zp(z0, e.hw - 0.8), zp(z1, e.hw - 0.8), zp(z1, -e.hw + 0.8), white, up, [0, 0, stripes, 1]);
    }
  }
  for (const [cls, mb] of bufs) {
    const mat = litMat(scene, `road-${cls}`, { tex: roadTexture(scene, cls), spec: 0.06 });
    mat.zOffset = -2;
    mat.zOffsetUnits = -4;
    finish(mb.toMesh(`roads-${cls}`, scene, mat));
  }
  const zm = litMat(scene, 'zebra', { tex: zebraTexture(scene) });
  zm.zOffset = -4; zm.zOffsetUnits = -8;
  finish(zebra.toMesh('zebra', scene, zm));
}

function buildBuildings(scene: Scene, model: WorldModel): Mesh[] {
  const stucco = new MeshBuf(), glass = new MeshBuf(), shops = new MeshBuf(), plain = new MeshBuf(), neon = new MeshBuf();
  for (const b of model.buildings) addBuilding(b, model, stucco, glass, shops, plain, neon);
  const out: Mesh[] = [];
  out.push(finish(stucco.toMesh('walls-stucco', scene, litMat(scene, 'stucco', { tex: facadeTexture(scene, 'stucco') }))));
  out.push(finish(glass.toMesh('walls-glass', scene, litMat(scene, 'glassw', { tex: facadeTexture(scene, 'glass'), spec: 0.25 }))));
  out.push(finish(shops.toMesh('shops', scene, litMat(scene, 'shops', { tex: shopTexture(scene) }))));
  out.push(finish(plain.toMesh('roofs', scene, litMat(scene, 'roofs'))));
  finish(neon.toMesh('neon', scene, glowMat(scene, 'neon')), false);
  return out;
}

function addBuilding(b: Building, model: WorldModel, stucco: MeshBuf, glass: MeshBuf, shops: MeshBuf, plain: MeshBuf, neon: MeshBuf): void {
  const rng = new Rng(b.seed + 17);
  const s = Math.sin(b.yaw), c = Math.cos(b.yaw);
  const W = (lx: number, lz: number, y: number): V3 => ({ x: b.x + c * lx + s * lz, y, z: b.z - s * lx + c * lz });
  let hi = -Infinity;
  for (const [lx, lz] of [[-b.hx, -b.hz], [b.hx, -b.hz], [b.hx, b.hz], [-b.hx, b.hz]]) { const p = W(lx, lz, 0); hi = Math.max(hi, model.heightAt(p.x, p.z)); }
  const palette = WALLS[b.district];
  const wall = palette[Math.floor(b.tint * palette.length) % palette.length];
  const useGlass = b.district === 'highline' || (b.district === 'civic' && b.tint > 0.62) || (b.district === 'beach' && b.y1 - hi > 30);
  const upper = useGlass ? glass : stucco;
  const shopTop = hi + 4;
  const awn = AWNINGS[rng.int(AWNINGS.length)];
  const floors = Math.max(1, Math.round((b.y1 - shopTop) / 3.3));
  const base = mul(wall, 0.72);
  const faces: [number, number, number, number, V3][] = [
    [-b.hx, -b.hz, -b.hx, b.hz, { x: -c, y: 0, z: s }],
    [b.hx, b.hz, b.hx, -b.hz, { x: c, y: 0, z: -s }],
    [-b.hx, b.hz, b.hx, b.hz, { x: s, y: 0, z: c }],
    [b.hx, -b.hz, -b.hx, -b.hz, { x: -s, y: 0, z: -c }],
  ];
  for (const [x0, z0, x1, z1, n] of faces) {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const bays = Math.max(1, Math.round(len / 3.3)), shopBays = Math.max(1, Math.round(len / 4.4));
    plain.quad(W(x0, z0, b.y0), W(x1, z1, b.y0), W(x1, z1, hi), W(x0, z0, hi), base, n);
    shops.quad(W(x0, z0, hi), W(x1, z1, hi), W(x1, z1, shopTop), W(x0, z0, shopTop), mix(wall, awn, 0.6), n, [0, 0, shopBays, 1]);
    upper.quad(W(x0, z0, shopTop), W(x1, z1, shopTop), W(x1, z1, b.y1), W(x0, z0, b.y1), wall, n, [0, 0, bays, floors]);
  }
  const roofs = ROOFS[b.district];
  const roof = roofs[rng.int(roofs.length)];
  const upN = { x: 0, y: 1, z: 0 };
  plain.quad(W(-b.hx, -b.hz, b.y1), W(b.hx, -b.hz, b.y1), W(b.hx, b.hz, b.y1), W(-b.hx, b.hz, b.y1), roof, upN);
  const q = quatYaw(b.yaw);
  // Parapet trim and roof furniture.
  plain.box({ x: b.x, y: b.y1 + 0.25, z: b.z }, b.hx + 0.25, 0.25, b.hz + 0.25, q, mul(wall, 0.92), true, roof);
  const kind = rng.int(5);
  if (kind === 0) {
    const p = W(rng.range(-0.4, 0.4) * b.hx, rng.range(-0.4, 0.4) * b.hz, 0);
    plain.box({ x: p.x, y: b.y1 + 1.7, z: p.z }, b.hx * 0.42, 1.5, b.hz * 0.36, q, mul(wall, 0.95), true, roof);
  } else if (kind === 1) {
    const p = W(rng.range(-0.5, 0.5) * b.hx, rng.range(-0.5, 0.5) * b.hz, 0);
    plain.cyl(p.x, p.z, b.y1 + 0.4, b.y1 + 3.2, 1.3, 1.3, 8, [0.62, 0.48, 0.36], true, [0.5, 0.38, 0.3]);
  } else if (kind === 2 && b.district === 'oldsteps') {
    // Pitched tile roof.
    const ridge = b.y1 + Math.min(4, b.hx * 0.5);
    plain.quad(W(-b.hx - 0.4, -b.hz, b.y1 + 0.3), W(-b.hx - 0.4, b.hz, b.y1 + 0.3), W(0, b.hz, ridge), W(0, -b.hz, ridge), roof, { x: -c, y: 1, z: s });
    plain.quad(W(b.hx + 0.4, b.hz, b.y1 + 0.3), W(b.hx + 0.4, -b.hz, b.y1 + 0.3), W(0, -b.hz, ridge), W(0, b.hz, ridge), mul(roof, 0.9), { x: c, y: 1, z: -s });
    plain.tri(W(-b.hx, b.hz, b.y1), W(b.hx, b.hz, b.y1), W(0, b.hz, ridge), wall, { x: s, y: 0, z: c });
    plain.tri(W(-b.hx, -b.hz, b.y1), W(b.hx, -b.hz, b.y1), W(0, -b.hz, ridge), wall, { x: -s, y: 0, z: -c });
  }
  // Neon blade signs.
  const neonChance = b.district === 'lantern' ? 0.85 : b.district === 'highline' || b.district === 'beach' ? 0.3 : 0.08;
  if (rng.chance(neonChance)) {
    const col = NEON[rng.int(NEON.length)];
    const hgt = rng.range(4, Math.min(10, b.y1 - shopTop - 1));
    const p = W(b.front * (b.hx + 0.45), rng.range(-0.7, 0.7) * b.hz, 0);
    if (hgt > 2) neon.box({ x: p.x, y: shopTop + 1 + hgt / 2, z: p.z }, 0.3, hgt / 2, 0.75, q, col);
    if (b.district === 'lantern') {
      const p2 = W(b.front * (b.hx + 0.2), 0, 0);
      neon.box({ x: p2.x, y: shopTop + 0.15, z: p2.z }, 0.12, 0.12, b.hz * 0.92, q, NEON[rng.int(NEON.length)]);
    }
  }
}

function buildBoxesAndRamps(solid: MeshBuf, model: WorldModel): void {
  const concrete: RGB = [0.78, 0.78, 0.8];
  for (const b of model.boxes) {
    let color: RGB = concrete;
    let top: RGB | undefined;
    if (b.kind === 'rail') color = b.tint === 1 ? [0.12, 0.7, 0.68] : b.tint === 2 ? [1, 0.78, 0.2] : [0.92, 0.92, 0.9];
    else if (b.kind === 'pillar') color = [0.7, 0.71, 0.74];
    else if (b.kind === 'container') color = CONTAINER[b.tint % CONTAINER.length];
    else if (b.kind === 'wall') color = b.tint === 1 ? [0.42, 0.3, 0.6] : [0.66, 0.66, 0.68];
    else if (b.kind === 'roof') color = b.tint === 1 ? [0.2, 0.7, 0.72] : [0.6, 0.6, 0.63];
    else if (b.kind === 'garage') { color = [0.72, 0.72, 0.75]; top = [0.42, 0.44, 0.5]; }
    else if (b.kind === 'deck') { color = [0.74, 0.75, 0.78]; top = [0.3, 0.31, 0.36]; }
    solid.box({ x: b.x, y: b.y, z: b.z }, b.hx, b.hy, b.hz, b.q, color, b.kind === 'pillar', top);
  }
  for (const r of model.ramps) {
    const P = (i: number): V3 => ({ x: r.pts[i * 3], y: r.pts[i * 3 + 1], z: r.pts[i * 3 + 2] });
    const side: RGB = [0.95, 0.4, 0.3], slope: RGB = [1, 0.8, 0.22];
    solid.convexFaces([[P(0), P(2), P(4)], [P(1), P(3), P(5)], ...(r.def.twoWay ? [] : [[P(2), P(3), P(5), P(4)]])], side);
    const centre = { x: r.def.x, y: P(0).y - 2, z: r.def.z };
    const out = (a: V3, b: V3): V3 => ({ x: (a.x + b.x) / 2 - centre.x, y: 3, z: (a.z + b.z) / 2 - centre.z });
    solid.quad(P(0), P(1), P(5), P(4), slope, out(P(0), P(5)));
    if (r.def.twoWay) solid.quad(P(2), P(3), P(5), P(4), slope, out(P(2), P(5)));
  }
}

function buildGates(solid: MeshBuf, glow: MeshBuf, model: WorldModel): void {
  for (const s of model.shortcuts) {
    if (!s.corridor) continue;
    const dx = (s.bx - s.ax) / s.len, dz = (s.bz - s.az) / s.len;
    const q = quatYaw(Math.atan2(dx, dz));
    const inset = s.kind === 'stairs' || s.id === 'canal-hop' ? 15 : 4;
    for (const t of [inset, s.len - inset]) {
      const cx = s.ax + dx * t, cz = s.az + dz * t;
      const y = model.heightAt(cx, cz);
      if (y < 1) continue;
      const hw = s.width / 2 + 0.7;
      for (const side of [-1, 1]) solid.cyl(cx + dz * side * hw, cz - dx * side * hw, y - 0.5, y + 6.2, 0.28, 0.22, 6, [0.1, 0.62, 0.62]);
      solid.box({ x: cx, y: y + 6.3, z: cz }, hw + 0.3, 0.3, 0.3, q, [0.1, 0.62, 0.62]);
      glow.box({ x: cx, y: y + 5.4, z: cz }, hw * 0.7, 0.5, 0.12, q, [1, 0.82, 0.2]);
      glow.box({ x: cx, y: y + 5.4, z: cz }, hw * 0.3, 0.2, 0.16, q, [0.1, 1, 0.9]);
    }
  }
}

function buildSignalPoles(solid: MeshBuf, model: WorldModel): { x: number; y: number; z: number; node: number; axisNS: boolean }[] {
  const out: { x: number; y: number; z: number; node: number; axisNS: boolean }[] = [];
  for (const n of model.nodes) {
    if (!n.signal || n.clear === 0) continue;
    for (const eid of n.edges) {
      const e = model.edges[eid];
      if (e.structure) continue;
      const d = model.dirFrom(e, n.id);
      // Approach direction is -d; the lamp stands on the approach's right-hand kerb at the stop line.
      const ax = -d.x, az = -d.z;
      const x = n.x + d.x * (n.clear + 0.5) + az * (e.hw + 1), z = n.z + d.z * (n.clear + 0.5) - ax * (e.hw + 1);
      const y = model.heightAt(x, z);
      solid.cyl(x, z, y - 0.3, y + 5.2, 0.16, 0.12, 5, [0.2, 0.22, 0.26]);
      solid.box({ x, y: y + 5.6, z }, 0.42, 0.62, 0.42, quatYaw(Math.atan2(d.x, d.z)), [0.14, 0.15, 0.18]);
      out.push({ x: x + d.x * 0.1, y: y + 5.6, z: z + d.z * 0.1, node: n.id, axisNS: Math.abs(az) >= Math.abs(ax) });
    }
  }
  return out;
}

function buildProps(scene: Scene, model: WorldModel): Mesh[] {
  const makers: Record<string, () => MeshBuf> = {
    palm: () => {
      const mb = new MeshBuf();
      mb.cyl(0, 0, -0.5, 7.2, 0.32, 0.2, 6, [0.62, 0.48, 0.34], false, [0.72, 0.58, 0.4]);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const dir = { x: Math.cos(a), y: -0.42, z: Math.sin(a) };
        const q = quatLookDir(dir);
        mb.box({ x: Math.cos(a) * 1.9, y: 7.0, z: Math.sin(a) * 1.9 }, 0.5, 0.06, 2.0, q, i % 2 ? [0.2, 0.62, 0.3] : [0.26, 0.7, 0.34]);
      }
      mb.sphere({ x: 0, y: 7.3, z: 0 }, 0.6, 0.5, 0.6, 6, [0.24, 0.6, 0.3]);
      return mb;
    },
    tree: () => {
      const mb = new MeshBuf();
      mb.cyl(0, 0, -0.5, 2.6, 0.3, 0.22, 6, [0.5, 0.36, 0.26], false);
      mb.sphere({ x: 0, y: 4.2, z: 0 }, 2.4, 2.2, 2.4, 8, [0.2, 0.5, 0.26], [0.42, 0.74, 0.36]);
      mb.sphere({ x: 1.1, y: 3.4, z: 0.6 }, 1.5, 1.3, 1.5, 6, [0.18, 0.46, 0.24], [0.36, 0.68, 0.32]);
      return mb;
    },
    lamp: () => {
      const mb = new MeshBuf();
      mb.cyl(0, 0, -0.3, 6.4, 0.13, 0.09, 5, [0.16, 0.36, 0.4], false);
      mb.box({ x: 0, y: 6.4, z: 0.9 }, 0.08, 0.08, 1.0, null, [0.16, 0.36, 0.4]);
      mb.box({ x: 0, y: 6.28, z: 1.7 }, 0.24, 0.1, 0.4, null, [1, 0.95, 0.75]);
      return mb;
    },
    umbrella: () => {
      const mb = new MeshBuf();
      mb.cyl(0, 0, -0.3, 2.4, 0.06, 0.06, 4, [0.9, 0.9, 0.88], false);
      for (let i = 0; i < 8; i++) {
        const a0 = (i / 8) * Math.PI * 2, a1 = ((i + 1) / 8) * Math.PI * 2;
        const col: RGB = i % 2 ? [1, 1, 1] : [0.72, 0.72, 0.72];
        mb.tri({ x: 0, y: 2.9, z: 0 }, { x: Math.cos(a0) * 2.1, y: 2.25, z: Math.sin(a0) * 2.1 }, { x: Math.cos(a1) * 2.1, y: 2.25, z: Math.sin(a1) * 2.1 }, col, { x: 0, y: 1, z: 0 });
      }
      mb.box({ x: 0.9, y: 0.25, z: 0.6 }, 0.35, 0.08, 0.95, null, [1, 1, 1]);
      return mb;
    },
    bollard: () => {
      const mb = new MeshBuf();
      mb.cyl(0, 0, -0.2, 0.9, 0.28, 0.24, 6, [0.95, 0.75, 0.2], true, [0.2, 0.2, 0.24]);
      return mb;
    },
  };
  const out: Mesh[] = [];
  const tints: Record<string, (t: number) => RGB> = {
    palm: (t) => [0.9 + t * 0.2, 0.9 + t * 0.2, 0.9 + t * 0.15],
    tree: (t) => [0.85 + t * 0.3, 0.9 + t * 0.2, 0.8 + t * 0.25],
    lamp: () => [1, 1, 1],
    umbrella: (t) => hsl([350, 180, 45, 205, 20, 280][Math.floor(t * 6) % 6], 0.85, 0.62),
    bollard: () => [1, 1, 1],
  };
  for (const kind of Object.keys(makers)) {
    const list = model.props.filter((p) => p.kind === kind);
    if (!list.length) continue;
    const mat = litMat(scene, `prop-${kind}`);
    mat.backFaceCulling = kind !== 'umbrella' && kind !== 'palm';
    const mesh = makers[kind]().toMesh(`props-${kind}`, scene, mat);
    const m = new Float32Array(list.length * 16), col = new Float32Array(list.length * 4);
    const sc = new Vector3(), tr = new Vector3(), rq = new Quaternion(), mat4 = new Matrix();
    list.forEach((p, i) => {
      sc.set(p.s, p.s, p.s);
      tr.set(p.x, p.y, p.z);
      Quaternion.RotationYawPitchRollToRef(p.rot, 0, 0, rq);
      Matrix.ComposeToRef(sc, rq, tr, mat4);
      mat4.copyToArray(m, i * 16);
      const c = tints[kind](p.tint);
      col[i * 4] = c[0]; col[i * 4 + 1] = c[1]; col[i * 4 + 2] = c[2]; col[i * 4 + 3] = 1;
    });
    mesh.thinInstanceSetBuffer('matrix', m, 16, true);
    mesh.thinInstanceSetBuffer('color', col, 4, true);
    mesh.isPickable = false;
    mesh.alwaysSelectAsActiveMesh = true;
    mesh.receiveShadows = false;
    if (kind === 'palm' || kind === 'tree') out.push(mesh);
  }
  return out;
}

/** Oversized destination silhouettes. Every kind is built from primitives in the site's accent hue. */
function buildLandmark(mb: MeshBuf, glow: MeshBuf, s: Site, model: WorldModel): void {
  const main = hsl(s.hue, 0.72, 0.58), dark = hsl(s.hue, 0.6, 0.38), light = hsl(s.hue, 0.7, 0.8);
  const cream: RGB = [0.97, 0.94, 0.86], lit = hsl(s.hue, 1, 0.62);
  const x = s.lx, z = s.lz, y = Math.min(s.ly, model.heightAt(s.lx, s.lz)) - 0.5, r = s.r;
  const e = model.edges[s.edge];
  const yaw = Math.atan2(e.dx, e.dz);
  const q = quatYaw(yaw);
  const L = (lx: number, ly: number, lz: number): V3 => ({ x: x + Math.cos(yaw) * lx + Math.sin(yaw) * lz, y: y + ly, z: z - Math.sin(yaw) * lx + Math.cos(yaw) * lz });
  // Kerbside totem so the stop itself is easy to spot.
  {
    const tx = s.sx + e.dx * 6, tz = s.sz + e.dz * 6, ty = model.heightAt(tx, tz);
    mb.cyl(tx, tz, ty - 0.3, ty + 5, 0.16, 0.16, 5, dark, false);
    glow.box({ x: tx, y: ty + 5.6, z: tz }, 0.14, 0.9, 1.3, q, lit);
  }
  switch (s.kind) {
    case 'tower': {
      mb.box(L(0, 3, 0), r * 0.8, 3.5, r * 0.8, q, cream, true);
      mb.box(L(0, 20, 0), r * 0.45, 14, r * 0.45, q, main, true, dark);
      mb.box(L(0, 35, 0), r * 0.55, 1.2, r * 0.55, q, cream);
      mb.cyl(x, z, y + 36, y + 46, r * 0.5, 0.2, 4, dark);
      glow.box(L(0, 31, 0), r * 0.47, 0.6, r * 0.47, q, lit);
      break;
    }
    case 'clock': {
      mb.box(L(0, 13, 0), r * 0.5, 13.5, r * 0.5, q, cream, true);
      mb.box(L(0, 28, 0), r * 0.6, 3, r * 0.6, q, main);
      for (const [fx, fz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) glow.box(L(fx * r * 0.61, 28, fz * r * 0.61), fx ? 0.1 : 2, 2, fz ? 0.1 : 2, q, [1, 0.97, 0.85]);
      mb.cyl(x, z, y + 31, y + 41, r * 0.62, 0.15, 4, dark);
      break;
    }
    case 'lighthouse': {
      const bands = 6;
      for (let i = 0; i < bands; i++) {
        const r0 = lerp(r * 0.62, r * 0.34, i / bands), r1 = lerp(r * 0.62, r * 0.34, (i + 1) / bands);
        mb.cyl(x, z, y + i * 5, y + (i + 1) * 5, r0, r1, 12, i % 2 ? cream : main, false);
      }
      mb.cyl(x, z, y + 30, y + 30.6, r * 0.5, r * 0.5, 12, dark);
      glow.cyl(x, z, y + 30.6, y + 33.4, r * 0.3, r * 0.3, 10, [1, 0.95, 0.6]);
      mb.cyl(x, z, y + 33.4, y + 37, r * 0.42, 0.1, 12, main);
      break;
    }
    case 'dome': {
      mb.cyl(x, z, y, y + r * 0.7, r * 0.95, r * 0.95, 16, cream, true, cream);
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; mb.cyl(x + Math.cos(a) * r, z + Math.sin(a) * r, y, y + r * 0.7, 0.5, 0.5, 6, light, false); }
      mb.sphere({ x, y: y + r * 0.7, z }, r * 0.85, r * 0.8, r * 0.85, 14, dark, main);
      mb.cyl(x, z, y + r * 1.45, y + r * 1.45 + 5, 0.5, 0.1, 6, cream);
      glow.sphere({ x, y: y + r * 1.5 + 5, z }, 0.7, 0.7, 0.7, 6, lit);
      break;
    }
    case 'sphere': {
      mb.cyl(x, z, y, y + 7, r * 0.5, r * 0.36, 10, cream, false);
      mb.sphere({ x, y: y + 7 + r * 0.8, z }, r * 0.9, r * 0.9, r * 0.9, 14, dark, main);
      mb.cyl(x, z, y + 7 + r * 0.7, y + 7 + r * 0.9, r * 0.93, r * 0.93, 14, cream, false);
      glow.sphere({ x, y: y + 8.5 + r * 1.7, z }, 0.8, 0.8, 0.8, 6, lit);
      break;
    }
    case 'wheel': {
      const R = 15, cy = y + R + 3;
      for (const side of [-1, 1]) for (const lean of [-1, 1]) {
        const a = L(side * 2.2, 0, lean * 7), bTop = L(side * 2.2, R + 3, 0);
        const d = { x: bTop.x - a.x, y: bTop.y - a.y, z: bTop.z - a.z };
        const l = Math.hypot(d.x, d.y, d.z);
        mb.box({ x: (a.x + bTop.x) / 2, y: (a.y + bTop.y) / 2, z: (a.z + bTop.z) / 2 }, 0.3, 0.3, l / 2, quatLookDir(d), cream);
      }
      const segs = 20;
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * Math.PI * 2, am = ((i + 0.5) / segs) * Math.PI * 2;
        const pm = L(0, R + 3 + Math.sin(am) * R, Math.cos(am) * R);
        const tangent = { x: Math.sin(yaw) * -Math.sin(am), y: Math.cos(am), z: Math.cos(yaw) * -Math.sin(am) };
        mb.box(pm, 0.35, 0.35, (Math.PI * R) / segs + 0.1, quatLookDir(tangent), i % 2 ? main : cream);
        if (i % 2 === 0) {
          const pr = L(0, R + 3 + Math.sin(a0) * R * 0.5, Math.cos(a0) * R * 0.5);
          const rad = { x: Math.sin(yaw) * Math.cos(a0), y: Math.sin(a0), z: Math.cos(yaw) * Math.cos(a0) };
          mb.box(pr, 0.1, 0.1, R * 0.5, quatLookDir(rad), light);
          const g = L(0, R + 3 + Math.sin(a0) * R - 1.3, Math.cos(a0) * R);
          mb.box(g, 1.3, 0.9, 0.9, q, hsl((s.hue + i * 36) % 360, 0.8, 0.6));
        }
      }
      glow.sphere({ x, y: cy, z }, 1.3, 1.3, 1.3, 8, lit);
      break;
    }
    case 'hotel': {
      mb.box(L(0, 20, 0), r * 0.55, 20.5, r * 0.95, q, cream, true);
      for (let f = 0; f < 11; f++) mb.box(L(0, 4 + f * 3.3, 0), r * 0.62, 0.22, r * 1.0, q, f % 2 ? main : light);
      mb.box(L(0, 42.5, 0), r * 0.3, 2, r * 0.6, q, dark);
      glow.box(L(0, 45.5, 0), 0.25, 1.3, r * 0.7, q, lit);
      break;
    }
    case 'canopy': {
      const cols = [main, cream, light, dark];
      let k = 0;
      for (const [ox, oz] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5], [0, 0]]) {
        const p = L(ox * r, 0, oz * r);
        const top = ox === 0 ? 11 : 7;
        mb.cyl(p.x, p.z, y, y + top - 2.6, 0.2, 0.2, 5, cream, false);
        mb.cyl(p.x, p.z, y + top - 3, y + top, r * (ox === 0 ? 0.62 : 0.5), 0.1, 4, cols[k++ % 4]);
      }
      glow.sphere({ x, y: y + 11.6, z }, 0.6, 0.6, 0.6, 6, lit);
      break;
    }
    case 'umbrella': {
      mb.cyl(x, z, y, y + 13, 0.5, 0.35, 8, cream, false);
      for (let i = 0; i < 12; i++) {
        const a0 = (i / 12) * Math.PI * 2, a1 = ((i + 1) / 12) * Math.PI * 2;
        const p0 = { x: x + Math.cos(a0) * r, y: y + 11, z: z + Math.sin(a0) * r }, p1 = { x: x + Math.cos(a1) * r, y: y + 11, z: z + Math.sin(a1) * r };
        const apex = { x, y: y + 15.5, z };
        mb.tri(apex, p0, p1, i % 2 ? main : cream, { x: 0, y: 1, z: 0 });
        mb.tri(apex, p1, p0, i % 2 ? dark : light, { x: 0, y: -1, z: 0 });
      }
      glow.sphere({ x, y: y + 16, z }, 0.6, 0.6, 0.6, 6, lit);
      break;
    }
    case 'crane': {
      for (const [ox, oz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) mb.box(L(ox * r * 0.55, 11, oz * r * 0.5), 0.5, 11.5, 0.5, q, main, true);
      mb.box(L(0, 23, 0), r * 0.7, 1, r * 0.65, q, dark);
      mb.box(L(s.side * r * 0.9, 25, 0), r * 1.9, 0.7, 0.9, q, main);
      mb.box(L(-s.side * 1, 28.5, 0), 0.4, 3.5, 0.4, q, main);
      mb.box(L(s.side * r * 0.3, 21.4, 0), 1.6, 1.3, 1.4, q, cream);
      mb.box(L(s.side * r * 1.9, 18, 0), 0.08, 6.5, 0.08, q, [0.2, 0.2, 0.22]);
      mb.box(L(s.side * r * 1.9, 10.5, 0), 1.25, 1.3, 3, q, CONTAINER[1]);
      glow.sphere(L(-s.side * 1, 32.4, 0), 0.6, 0.6, 0.6, 6, [1, 0.25, 0.2]);
      break;
    }
    case 'ferry':
      break; // built below
    case 'arch': {
      for (const side of [-1, 1]) mb.box(L(0, 8, side * r * 0.7), r * 0.28, 8.5, r * 0.26, q, cream, true);
      mb.box(L(0, 17.8, 0), r * 0.34, 2, r * 1.0, q, main);
      mb.box(L(0, 20.3, 0), r * 0.4, 0.5, r * 1.08, q, dark);
      glow.box(L(0, 15.4, 0), r * 0.3, 0.25, r * 0.42, q, lit);
      break;
    }
    case 'pagoda': {
      let w = r * 0.72, yy = y;
      for (let t = 0; t < 4; t++) {
        mb.box({ x, y: yy + 2.2, z }, w * 0.7, 2.4, w * 0.7, q, t % 2 ? cream : main, true);
        mb.cyl(x, z, yy + 4.4, yy + 6.2, w * 1.45, w * 0.55, 4, dark);
        for (const [ox, oz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) glow.sphere({ x: x + ox * w * 0.95, y: yy + 3.9, z: z + oz * w * 0.95 }, 0.34, 0.42, 0.34, 5, [1, 0.72, 0.3]);
        yy += 6;
        w *= 0.8;
      }
      mb.cyl(x, z, yy, yy + 5, 0.3, 0.05, 5, cream);
      break;
    }
    case 'windmill': {
      mb.cyl(x, z, y, y + 19, r * 0.5, r * 0.3, 8, cream, false);
      mb.cyl(x, z, y + 19, y + 23, r * 0.36, 0.1, 8, main);
      const hub = L(-s.side * r * 0.42, 18, 0);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + 0.5;
        const d = { x: Math.sin(yaw) * Math.cos(a), y: Math.sin(a), z: Math.cos(yaw) * Math.cos(a) };
        mb.box({ x: hub.x + d.x * 6.5, y: hub.y + d.y * 6.5, z: hub.z + d.z * 6.5 }, 0.12, 1.3, 6.2, quatLookDir(d), i % 2 ? main : light);
      }
      glow.sphere(hub, 0.7, 0.7, 0.7, 6, lit);
      break;
    }
    case 'bowl': {
      mb.cyl(x, z, y, y + 15, r * 0.72, r * 1.0, 24, cream, false, main);
      mb.cyl(x, z, y + 15, y + 16.2, r * 1.02, r * 1.02, 24, dark, false);
      mb.cyl(x, z, y + 2, y + 2.3, r * 0.6, r * 0.6, 20, [0.3, 0.7, 0.36]);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + 0.78;
        const px = x + Math.cos(a) * r * 1.02, pz = z + Math.sin(a) * r * 1.02;
        mb.cyl(px, pz, y, y + 30, 0.5, 0.3, 5, cream, false);
        glow.box({ x: px, y: y + 31, z: pz }, 1.6, 1.1, 1.6, quatYaw(a), [1, 0.98, 0.85]);
      }
      break;
    }
    case 'obelisk': {
      mb.cyl(x, z, y, y + 1.4, r * 0.95, r * 0.95, 16, cream, true, [0.3, 0.72, 0.85]);
      mb.cyl(x, z, y + 1.2, y + 3, r * 0.35, r * 0.3, 8, light);
      mb.cyl(x, z, y + 3, y + 24, 1.5, 0.75, 4, main, false, cream);
      mb.cyl(x, z, y + 24, y + 26.5, 0.75, 0.02, 4, dark);
      glow.sphere({ x, y: y + 27, z }, 0.55, 0.55, 0.55, 6, lit);
      break;
    }
    case 'mast': {
      for (let i = 0; i < 9; i++) mb.cyl(x, z, y + i * 6, y + (i + 1) * 6, lerp(2.6, 0.5, i / 9), lerp(2.6, 0.5, (i + 1) / 9), 4, i % 2 ? cream : main, false);
      mb.box({ x, y: y + 3, z }, r * 0.6, 3.2, r * 0.6, q, cream, true, dark);
      mb.cyl(x, z, y + 40, y + 41, 3.2, 3.2, 10, dark);
      glow.sphere({ x, y: y + 55, z }, 0.9, 0.9, 0.9, 6, [1, 0.2, 0.15]);
      break;
    }
  }
  if (s.kind === 'ferry') {
    // Docked-ferry terminal: hull, decks and a tilted funnel, laid out along the quay.
    mb.box(L(0, 3, 0), 4.6, 3.2, r * 1.6, q, cream, true);
    mb.box(L(0, 6.1, 0), 4.8, 0.25, r * 1.7, q, main);
    mb.box(L(0, 8.6, -1), 3.6, 2.4, r * 1.1, q, cream, true, light);
    mb.box(L(0, 12, -2), 2.8, 1.2, r * 0.6, q, light, true, cream);
    mb.cyl(L(0, 0, 3).x, L(0, 0, 3).z, y + 11, y + 18, 1.7, 1.4, 10, main, true, dark);
    mb.cyl(L(0, 0, -6).x, L(0, 0, -6).z, y + 13, y + 22, 0.15, 0.1, 4, cream, false);
    glow.box(L(0, 16.4, 3), 1.75, 0.5, 1.75, q, lit);
  }
}
