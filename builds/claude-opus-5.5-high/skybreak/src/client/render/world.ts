// renderer-world: builds the island visuals from the shared island data.
// Terrain and static geometry are split into spatial cells (frustum culled),
// vertex-coloured with baked ambient terms, foliage is GPU thin-instanced.

import {
  Scene, Mesh, VertexData, StandardMaterial, Color3, Color4, MeshBuilder, Vector3, Matrix, Quaternion,
  ShaderMaterial, Effect, TransformNode, AbstractMesh,
} from '@babylonjs/core';
import { IslandData, Mat, WORLD_HALF, sampleGrid } from '../../shared/world/island';
import { fbm } from '../../shared/rng';

export const MAT_COLORS: Record<Mat, string> = {
  stone: '#d4c8aa', plaster: '#efe2c4', wood: '#94603d', metal: '#7d8c96', copper: '#c27a44', roofRed: '#c9503d', roofTeal: '#2c9e95',
  roofGold: '#d9a733', ruin: '#dcd2b4', dock: '#6f5641', container: '#c2452d', crate: '#b08050', rock: '#9a958a', trunk: '#5c4231',
  glass: '#9fd6e0', kiln: '#a05e47', pier: '#806b55', target: '#e0523f',
};

export const hex = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];

export class Geo {
  pos: number[] = []; nrm: number[] = []; col: number[] = []; idx: number[] = [];
  box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, c: [number, number, number], jitter = 0) {
    const faces: [number[], number[][]][] = [
      [[0, 1, 0], [[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]]],
      [[0, -1, 0], [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]]],
      [[1, 0, 0], [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]]],
      [[-1, 0, 0], [[x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [x0, y0, z0]]],
      [[0, 0, 1], [[x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [x0, y0, z1]]],
      [[0, 0, -1], [[x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]]],
    ];
    for (const [n, vs] of faces) {
      const base = this.pos.length / 3;
      const shade = n[1] > 0 ? 1.06 : n[1] < 0 ? 0.82 : n[0] !== 0 ? 0.9 : 0.97;
      for (const v of vs) {
        this.pos.push(v[0], v[1], v[2]);
        this.nrm.push(n[0], n[1], n[2]);
        // baked vertical AO: darker near the base of walls
        const ao = n[1] === 0 ? 0.78 + 0.22 * Math.min(1, (v[1] - y0) / 2.5) : 1;
        const j = 1 + jitter;
        this.col.push(c[0] * shade * ao * j, c[1] * shade * ao * j, c[2] * shade * ao * j, 1);
      }
      this.idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
    }
  }
  mesh(name: string, scene: Scene, mat: StandardMaterial, freeze = true) {
    const m = new Mesh(name, scene);
    const vd = new VertexData();
    vd.positions = this.pos; vd.normals = this.nrm; vd.colors = this.col; vd.indices = this.idx;
    vd.applyToMesh(m);
    m.material = mat;
    m.isPickable = false;
    if (freeze) m.freezeWorldMatrix();
    return m;
  }
}

const vcCache = new WeakMap<Scene, StandardMaterial>();
/** Shared vertex-colour material (one per scene) with a small ambient fill so interiors keep exposure. */
export function vertexColorMaterial(scene: Scene) {
  let m = vcCache.get(scene);
  if (!m) {
    m = new StandardMaterial('vcShared', scene);
    m.specularColor = new Color3(0.06, 0.06, 0.05);
    m.diffuseColor = new Color3(1, 1, 1);
    m.emissiveColor = new Color3(0.16, 0.15, 0.14);
    vcCache.set(scene, m);
  }
  return m;
}

Effect.ShadersStore['skyVertexShader'] = `
precision highp float;
attribute vec3 position;
uniform mat4 worldViewProjection;
varying vec3 vDir;
void main(){ vDir = position; gl_Position = worldViewProjection * vec4(position, 1.0); }`;
Effect.ShadersStore['skyFragmentShader'] = `
precision highp float;
varying vec3 vDir;
uniform vec3 sunDir;
uniform float time;
void main(){
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 horizon = vec3(0.78, 0.93, 0.92);
  vec3 top = vec3(0.10, 0.52, 0.74);
  vec3 col = mix(horizon, top, pow(clamp(h, 0.0, 1.0), 0.55));
  // void-sea below the horizon: deep violet
  col = mix(col, vec3(0.20, 0.13, 0.34), smoothstep(0.0, -0.25, h));
  float s = max(dot(d, normalize(sunDir)), 0.0);
  col += vec3(1.0, 0.86, 0.6) * (pow(s, 600.0) * 2.0 + pow(s, 12.0) * 0.25);
  // atmospheric fracture: thin luminous seams across the upper sky
  float a = atan(d.z, d.x);
  float seam = abs(sin(a * 3.0 + h * 9.0 + sin(a * 7.0) * 0.6));
  float seam2 = abs(sin(a * 5.0 - h * 13.0 + 1.7));
  float band = smoothstep(0.15, 0.45, h) * (1.0 - smoothstep(0.8, 0.98, h));
  float crack = (smoothstep(0.9965, 1.0, seam) + 0.6 * smoothstep(0.998, 1.0, seam2)) * band;
  col += vec3(0.55, 1.0, 0.95) * crack * (0.45 + 0.08 * sin(time * 0.3));
  col += vec3(0.6, 0.35, 0.9) * crack * 0.25;
  gl_FragColor = vec4(col, 1.0);
}`;

export interface WorldVisuals {
  root: TransformNode;
  sky: Mesh;
  skyMat: ShaderMaterial;
  water: Mesh;
  staticMeshes: AbstractMesh[];
  spinners: { node: TransformNode; speed: number }[];
  vents: Mesh[];
  setViewDistance: (d: number) => void;
}

export function buildWorld(scene: Scene, island: IslandData, foliage: 'low' | 'high', onProgress?: (k: number) => void): WorldVisuals {
  const root = new TransformNode('world', scene);
  const staticMeshes: AbstractMesh[] = [];
  const vcMat = vertexColorMaterial(scene);

  // ---- sky
  const skyMat = new ShaderMaterial('sky', scene, { vertex: 'sky', fragment: 'sky' }, { attributes: ['position'], uniforms: ['worldViewProjection', 'sunDir', 'time'] });
  skyMat.backFaceCulling = false;
  skyMat.disableDepthWrite = true;
  skyMat.setVector3('sunDir', new Vector3(-0.45, 0.62, 0.35));
  skyMat.setFloat('time', 0);
  const sky = MeshBuilder.CreateSphere('skybox', { diameter: 4000, segments: 24, sideOrientation: Mesh.BACKSIDE }, scene);
  sky.material = skyMat;
  sky.infiniteDistance = true;
  sky.renderingGroupId = 0;
  sky.isPickable = false;
  sky.applyFog = false;

  // ---- terrain cells
  const H = island.heights;
  const CELLS = 8, SIZE = (WORLD_HALF * 2) / CELLS, STEP = 3;
  const N = Math.round(SIZE / STEP) + 1;
  const tint = (x: number, z: number, h: number, slope: number): [number, number, number] => {
    const n = fbm(91, x / 40, z / 40, 3);
    let c: [number, number, number];
    if (h < -1) c = [0.36, 0.42, 0.44];
    else if (h < 2.2) c = [0.89, 0.83, 0.64];
    else if (h > 42) c = [0.84, 0.8, 0.69];
    else c = h > 26 ? [0.36, 0.56, 0.3] : [0.42, 0.66, 0.31];
    if (slope > 0.55 && h > 1) c = [0.72, 0.68, 0.58];
    // location tints
    const d = (cx: number, cz: number, r: number) => Math.max(0, 1 - Math.hypot(x - cx, z - cz) / r);
    const kiln = d(250, -205, 85);
    if (kiln > 0 && h > 2) c = [c[0] * (1 - kiln) + 0.55 * kiln, c[1] * (1 - kiln) + 0.4 * kiln, c[2] * (1 - kiln) + 0.32 * kiln];
    const orch = d(-250, -205, 110);
    if (orch > 0 && h > 2 && slope < 0.5) c = [c[0] * (1 - orch * 0.5) + 0.25 * orch * 0.5, c[1] * (1 - orch * 0.5) + 0.5 * orch * 0.5, c[2] * (1 - orch * 0.5) + 0.2 * orch * 0.5];
    const town = d(-200, 170, 75) + d(15, -15, 40);
    if (town > 0 && h > 2) c = [c[0] * (1 - town * 0.6) + 0.83 * town * 0.6, c[1] * (1 - town * 0.6) + 0.78 * town * 0.6, c[2] * (1 - town * 0.6) + 0.64 * town * 0.6];
    const v = 0.88 + n * 0.24;
    return [c[0] * v, c[1] * v, c[2] * v];
  };
  for (let cj = 0; cj < CELLS; cj++) for (let ci = 0; ci < CELLS; ci++) {
    const x0 = -WORLD_HALF + ci * SIZE, z0 = -WORLD_HALF + cj * SIZE;
    const pos: number[] = [], col: number[] = [], idx: number[] = [];
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = x0 + i * STEP, z = z0 + j * STEP;
      const h = sampleGrid(H, x, z);
      const sl = Math.hypot(sampleGrid(H, x + 2, z) - sampleGrid(H, x - 2, z), sampleGrid(H, x, z + 2) - sampleGrid(H, x, z - 2)) / 4;
      pos.push(x, h, z);
      const c = tint(x, z, h, sl);
      col.push(c[0], c[1], c[2], 1);
    }
    for (let j = 0; j < N - 1; j++) for (let i = 0; i < N - 1; i++) {
      const a = j * N + i, b = a + 1, c = a + N, d = c + 1;
      idx.push(a, b, c, b, d, c);
    }
    const m = new Mesh(`terrain_${ci}_${cj}`, scene);
    const vd = new VertexData();
    vd.positions = pos; vd.indices = idx; vd.colors = col;
    const nrm: number[] = [];
    VertexData.ComputeNormals(pos, idx, nrm);
    vd.normals = nrm;
    vd.applyToMesh(m);
    m.material = vcMat;
    m.isPickable = false;
    m.receiveShadows = true;
    m.freezeWorldMatrix();
    m.parent = root;
    staticMeshes.push(m);
  }
  onProgress?.(0.4);

  // ---- static boxes, grouped into the same 8x8 cells
  const geos = new Map<number, Geo>();
  const cellOf = (x: number, z: number) => {
    const i = Math.max(0, Math.min(CELLS - 1, Math.floor((x + WORLD_HALF) / SIZE)));
    const j = Math.max(0, Math.min(CELLS - 1, Math.floor((z + WORLD_HALF) / SIZE)));
    return j * CELLS + i;
  };
  const containerCols = ['#c2452d', '#2d7fc2', '#d9a92b', '#3e9e5e'].map(hex);
  for (const b of island.boxes) {
    if (b.kind === 'tree') continue; // rendered as foliage
    const cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
    if (b.kind === 'rock') continue; // rendered as boulders below
    const k = cellOf(cx, cz);
    let g = geos.get(k);
    if (!g) { g = new Geo(); geos.set(k, g); }
    let c = hex(MAT_COLORS[b.mat]);
    if (b.mat === 'container') c = containerCols[Math.abs(Math.floor(cx * 7 + cz * 13)) % 4];
    const jit = ((Math.floor(cx * 3.1 + cz * 1.7) % 7) - 3) * 0.02;
    g.box(b.minX, b.minY, b.minZ, b.maxX, b.maxY, b.maxZ, c, jit);
  }
  for (const [k, g] of geos) {
    const m = g.mesh(`static_${k}`, scene, vcMat);
    m.receiveShadows = true;
    m.parent = root;
    staticMeshes.push(m);
  }
  onProgress?.(0.6);

  // ---- boulders (thin instances of a faceted sphere scaled to their collision box)
  const rockMesh = MeshBuilder.CreateIcoSphere('rock', { radius: 1, subdivisions: 1, flat: true }, scene);
  const rockMat = new StandardMaterial('rockMat', scene);
  rockMat.diffuseColor = Color3.FromHexString('#a9a394');
  rockMat.specularColor = new Color3(0.05, 0.05, 0.05);
  rockMesh.material = rockMat;
  rockMesh.isPickable = false;
  rockMesh.receiveShadows = true;
  const rocks = island.boxes.filter((b) => b.kind === 'rock');
  const rmat = new Float32Array(rocks.length * 16);
  rocks.forEach((b, i) => {
    const m = Matrix.Compose(
      new Vector3((b.maxX - b.minX) * 0.58, (b.maxY - b.minY) * 0.62, (b.maxZ - b.minZ) * 0.58),
      Quaternion.FromEulerAngles(0, (i * 1.7) % 6.28, 0),
      new Vector3((b.minX + b.maxX) / 2, (b.minY + b.maxY) / 2 + 0.1, (b.minZ + b.maxZ) / 2),
    );
    m.copyToArray(rmat, i * 16);
  });
  rockMesh.thinInstanceSetBuffer('matrix', rmat, 16, true);
  staticMeshes.push(rockMesh);

  // ---- trees
  const pines = island.trees.filter((t) => t.kind === 'pine');
  const broads = island.trees.filter((t) => t.kind === 'broad');
  const fruits = island.trees.filter((t) => t.kind === 'fruit');
  const trunk = MeshBuilder.CreateCylinder('trunk', { height: 1, diameterTop: 0.35, diameterBottom: 0.6, tessellation: 6 }, scene);
  const trunkMat = new StandardMaterial('trunkMat', scene);
  trunkMat.diffuseColor = Color3.FromHexString('#5c4231');
  trunkMat.specularColor = Color3.Black();
  trunk.material = trunkMat;
  const all = island.trees;
  const tm = new Float32Array(all.length * 16);
  all.forEach((t, i) => Matrix.Compose(new Vector3(1, t.h * 0.6, 1), Quaternion.Identity(), new Vector3(t.x, t.y + t.h * 0.3 - 0.2, t.z)).copyToArray(tm, i * 16));
  trunk.thinInstanceSetBuffer('matrix', tm, 16, true);
  trunk.isPickable = false;
  staticMeshes.push(trunk);
  const leafMat = new StandardMaterial('leafMat', scene);
  leafMat.diffuseColor = new Color3(1, 1, 1);
  leafMat.specularColor = new Color3(0.03, 0.05, 0.03);
  const canopy = (name: string, mesh: Mesh, list: typeof all, colorFn: (i: number) => [number, number, number], shape: (t: (typeof all)[0]) => [Vector3, Vector3]) => {
    mesh.material = leafMat;
    mesh.isPickable = false;
    const mm = new Float32Array(list.length * 16), cc = new Float32Array(list.length * 4);
    list.forEach((t, i) => {
      const [s, p] = shape(t);
      Matrix.Compose(s, Quaternion.FromEulerAngles(0, i, 0), p).copyToArray(mm, i * 16);
      const c = colorFn(i);
      cc.set([c[0], c[1], c[2], 1], i * 4);
    });
    mesh.thinInstanceSetBuffer('matrix', mm, 16, true);
    mesh.thinInstanceSetBuffer('color', cc, 4, true);
    staticMeshes.push(mesh);
    void name;
  };
  const vary = (base: [number, number, number], i: number): [number, number, number] => {
    const v = 0.85 + ((i * 37) % 30) / 100;
    return [base[0] * v, base[1] * v, base[2] * v];
  };
  canopy('pine', MeshBuilder.CreateCylinder('pineTop', { height: 1, diameterTop: 0, diameterBottom: 1, tessellation: 7 }, scene), pines,
    (i) => vary([0.16, 0.42, 0.26], i), (t) => [new Vector3(t.r * 1.5, t.h * 0.85, t.r * 1.5), new Vector3(t.x, t.y + t.h * 0.6, t.z)]);
  canopy('broad', MeshBuilder.CreateIcoSphere('broadTop', { radius: 1, subdivisions: 1, flat: true }, scene), broads,
    (i) => vary([0.3, 0.55, 0.22], i), (t) => [new Vector3(t.r, t.r * 0.85, t.r), new Vector3(t.x, t.y + t.h * 0.78, t.z)]);
  canopy('fruit', MeshBuilder.CreateIcoSphere('fruitTop', { radius: 1, subdivisions: 1, flat: true }, scene), fruits,
    (i) => vary(i % 3 === 0 ? [0.55, 0.62, 0.2] : [0.2, 0.45, 0.18], i), (t) => [new Vector3(t.r, t.r * 0.8, t.r), new Vector3(t.x, t.y + t.h * 0.75, t.z)]);

  // decorative grass tufts (render-only, never tall enough to hide a standing player)
  if (foliage === 'high') {
    const tuft = MeshBuilder.CreateCylinder('tuft', { height: 0.45, diameterTop: 0, diameterBottom: 0.5, tessellation: 3 }, scene);
    const tuftMat = new StandardMaterial('tuftMat', scene);
    tuftMat.diffuseColor = Color3.FromHexString('#5c9a40');
    tuftMat.specularColor = Color3.Black();
    tuft.material = tuftMat;
    tuft.isPickable = false;
    const pts: number[] = [];
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 9000; i++) {
      const x = (rnd() - 0.5) * 900, z = (rnd() - 0.5) * 900;
      const h = sampleGrid(H, x, z);
      if (h < 3 || h > 40) continue;
      pts.push(x, h, z);
    }
    const n = pts.length / 3;
    const mm = new Float32Array(n * 16);
    for (let i = 0; i < n; i++) Matrix.Compose(new Vector3(1, 0.7 + (i % 5) * 0.12, 1), Quaternion.FromEulerAngles(0, i, 0), new Vector3(pts[i * 3], pts[i * 3 + 1] + 0.18, pts[i * 3 + 2])).copyToArray(mm, i * 16);
    tuft.thinInstanceSetBuffer('matrix', mm, 16, true);
  }
  onProgress?.(0.75);

  // ---- decor (render-only)
  const spinners: { node: TransformNode; speed: number }[] = [];
  const decorMeshes: Mesh[] = [];
  const matCache = new Map<string, StandardMaterial>();
  const mat = (c: string, emissive = 0, alpha = 1) => {
    const key = `${c}_${emissive}_${alpha}`;
    let m = matCache.get(key);
    if (!m) {
      m = new StandardMaterial(`d_${key}`, scene);
      m.diffuseColor = Color3.FromHexString(c);
      m.specularColor = new Color3(0.08, 0.08, 0.08);
      if (emissive) m.emissiveColor = Color3.FromHexString(c).scale(emissive);
      if (alpha < 1) { m.alpha = alpha; m.backFaceCulling = false; }
      matCache.set(key, m);
    }
    return m;
  };
  const add = (m: Mesh, c: string, em = 0) => { m.material = mat(c, em); m.isPickable = false; decorMeshes.push(m); return m; };
  for (const d of island.decor) {
    switch (d.type) {
      case 'canopy': {
        const m = add(MeshBuilder.CreateBox('canopy', { width: d.s * 1.6, depth: (d.s2 ?? d.s) * 1.6, height: 0.12 }, scene), d.color ?? '#e0523f');
        m.position.set(d.x, d.y + 1.6, d.z); m.rotation.x = 0.12;
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
          const p = add(MeshBuilder.CreateCylinder('pole', { height: 1.6, diameter: 0.1 }, scene), '#5c4231');
          p.position.set(d.x + sx * d.s * 0.75, d.y + 0.8, d.z + sz * (d.s2 ?? d.s) * 0.75);
        }
        break;
      }
      case 'stall': {
        const m = add(MeshBuilder.CreateCylinder('stall', { height: 0.9, diameterTop: 0.2, diameterBottom: 2.6, tessellation: 6 }, scene), d.color ?? '#f2b233');
        m.position.set(d.x, d.y + 1.4, d.z);
        break;
      }
      case 'dish': {
        const node = new TransformNode('dishN', scene);
        node.position.set(d.x, d.y + 2.5, d.z);
        const m = add(MeshBuilder.CreateCylinder('dish', { height: 0.6, diameterTop: d.s * 1.4, diameterBottom: d.s * 0.4, tessellation: 20 }, scene), '#e8e4da');
        m.parent = node; m.rotation.x = 0.7; m.rotation.y = d.yaw;
        const arm = add(MeshBuilder.CreateCylinder('arm', { height: 4, diameter: 0.25 }, scene), '#7d8c96');
        arm.parent = node; arm.position.y = 1;
        break;
      }
      case 'chimney': {
        const m = add(MeshBuilder.CreateCylinder('chimney', { height: d.s, diameterTop: 1.6, diameterBottom: 2.2, tessellation: 10 }, scene), '#a05e47');
        m.position.set(d.x, d.y + d.s / 2, d.z);
        const top = add(MeshBuilder.CreateTorus('chTop', { diameter: 1.8, thickness: 0.3, tessellation: 12 }, scene), '#ff9a3c', 0.8);
        top.position.set(d.x, d.y + d.s, d.z);
        break;
      }
      case 'windmill': case 'turbine': {
        if (d.type === 'windmill') {
          const t = add(MeshBuilder.CreateCylinder('mill', { height: d.s, diameterTop: 2, diameterBottom: 3.6, tessellation: 8 }, scene), '#e8dcc0');
          t.position.set(d.x, d.y + d.s / 2, d.z);
        }
        const hub = new TransformNode('hub', scene);
        hub.position.set(d.x + Math.sin(d.yaw) * 1.6, d.y + (d.type === 'windmill' ? d.s : 0.4), d.z + Math.cos(d.yaw) * 1.6);
        hub.rotation.y = d.yaw;
        const spin = new TransformNode('spin', scene);
        spin.parent = hub;
        for (let i = 0; i < (d.type === 'turbine' ? 3 : 4); i++) {
          const b = MeshBuilder.CreateBox('blade', { width: 0.5, height: d.s * 0.9, depth: 0.08 }, scene);
          b.material = mat(d.type === 'turbine' ? '#c27a44' : '#f2e6c8');
          b.isPickable = false;
          b.parent = spin;
          b.setPivotPoint(new Vector3(0, -d.s * 0.45, 0));
          b.position.y = d.s * 0.45;
          b.rotation.z = (i / (d.type === 'turbine' ? 3 : 4)) * Math.PI * 2;
        }
        spinners.push({ node: spin, speed: d.type === 'turbine' ? 0.9 : 0.5 });
        break;
      }
      case 'belltower': {
        const r = add(MeshBuilder.CreateCylinder('roof', { height: 4, diameterTop: 0, diameterBottom: 7.5, tessellation: 4 }, scene), '#2c9e95');
        r.position.set(d.x, d.y + d.s + 2, d.z); r.rotation.y = Math.PI / 4;
        break;
      }
      case 'crane': {
        const arm = add(MeshBuilder.CreateBox('craneArm', { width: 1, height: 1, depth: 24 }, scene), '#e0a030');
        arm.position.set(d.x, d.y + d.s + 0.5, d.z); arm.rotation.y = d.yaw + Math.PI / 2;
        const cab = add(MeshBuilder.CreateBox('cab', { size: 2.4 }, scene), '#e0a030');
        cab.position.set(d.x, d.y + d.s - 1, d.z);
        break;
      }
      case 'tent': {
        const t = add(MeshBuilder.CreateCylinder('tent', { height: d.s, diameterTop: 0, diameterBottom: d.s * 1.3, tessellation: 4 }, scene), d.color ?? '#e0523f');
        t.position.set(d.x, d.y + d.s / 2 + 1.6, d.z);
        break;
      }
      case 'antenna': {
        const t = add(MeshBuilder.CreateTorus('ant', { diameter: 3, thickness: 0.15, tessellation: 16 }, scene), '#4ad8ff', 0.6);
        t.position.set(d.x, d.y, d.z);
        break;
      }
      case 'wreck': {
        const mast = add(MeshBuilder.CreateCylinder('mast', { height: 12, diameter: 0.4 }, scene), '#5c4231');
        mast.position.set(d.x - 3, d.y + 5, d.z); mast.rotation.z = 0.35;
        const sail = add(MeshBuilder.CreatePlane('sail', { width: 6, height: 5, sideOrientation: Mesh.DOUBLESIDE }, scene), '#e8dcc0');
        sail.position.set(d.x - 4.6, d.y + 7, d.z + 0.3); sail.rotation.z = 0.35;
        break;
      }
      case 'banner': {
        const p = add(MeshBuilder.CreatePlane('banner', { width: 3, height: d.s, sideOrientation: Mesh.DOUBLESIDE }, scene), d.color ?? '#2bb3a6', 0.2);
        p.position.set(d.x, d.y + d.s / 2 + 1, d.z); p.rotation.y = d.yaw;
        break;
      }
      case 'heat': {
        const p = add(MeshBuilder.CreateGround('heat', { width: d.s, height: d.s2 ?? 2 }, scene), '#ff7a1a', 1.2);
        p.position.set(d.x, d.y + 0.05, d.z);
        break;
      }
      case 'zipPost': {
        const p = add(MeshBuilder.CreateCylinder('zp', { height: d.s + 0.4, diameter: 0.3, tessellation: 6 }, scene), '#c27a44');
        p.position.set(d.x, d.y + d.s / 2, d.z);
        break;
      }
    }
  }
  for (const z of island.ziplines) {
    const a = new Vector3(z.a.x, z.a.y, z.a.z), b = new Vector3(z.b.x, z.b.y, z.b.z);
    const L = Vector3.Distance(a, b);
    const c = MeshBuilder.CreateCylinder('zipline', { height: L, diameter: 0.07, tessellation: 5 }, scene);
    c.material = mat('#fff1c4', 0.8);
    c.isPickable = false;
    c.position = Vector3.Center(a, b);
    const dir = b.subtract(a).normalize();
    const axis = Vector3.Cross(Vector3.Up(), dir);
    const ang = Math.acos(Vector3.Dot(Vector3.Up(), dir));
    c.rotationQuaternion = axis.length() > 1e-4 ? Quaternion.RotationAxis(axis.normalize(), ang) : Quaternion.Identity();
    decorMeshes.push(c);
  }
  for (const a of island.ascenders) {
    const c = MeshBuilder.CreateCylinder('asc', { height: a.y1 - a.y0 + 0.6, diameter: 0.12, tessellation: 5 }, scene);
    c.material = mat('#4ad8ff', 0.9);
    c.position.set(a.x, (a.y0 + a.y1) / 2, a.z);
    c.isPickable = false;
    decorMeshes.push(c);
    const hook = MeshBuilder.CreateBox('ascTop', { width: 0.8, height: 0.3, depth: 0.8 }, scene);
    hook.material = mat('#c27a44');
    hook.position.set(a.x, a.y1 + 0.4, a.z);
    decorMeshes.push(hook);
  }
  const vents: Mesh[] = [];
  for (const v of island.vents) {
    const ring = MeshBuilder.CreateTorus('vent', { diameter: v.r * 2, thickness: 0.35, tessellation: 24 }, scene);
    ring.material = mat('#7cffd4', 1);
    ring.position.set(v.x, v.y + 0.15, v.z);
    decorMeshes.push(ring);
    const col = MeshBuilder.CreateCylinder('ventCol', { height: 14, diameterTop: v.r * 1.2, diameterBottom: v.r * 1.9, tessellation: 16, cap: Mesh.NO_CAP }, scene);
    const cm = new StandardMaterial('ventColMat', scene);
    cm.emissiveColor = Color3.FromHexString('#7cffd4');
    cm.diffuseColor = Color3.Black();
    cm.alpha = 0.16;
    cm.backFaceCulling = false;
    cm.disableLighting = true;
    col.material = cm;
    col.position.set(v.x, v.y + 7, v.z);
    col.isPickable = false;
    vents.push(col);
  }
  // merge static decor by material to keep draw calls low
  const byMat = new Map<StandardMaterial, Mesh[]>();
  for (const m of decorMeshes) {
    if (m.parent) continue;
    const k = m.material as StandardMaterial;
    if (!byMat.has(k)) byMat.set(k, []);
    byMat.get(k)!.push(m);
  }
  for (const [, list] of byMat) {
    if (list.length < 2) { list.forEach((m) => { m.freezeWorldMatrix(); staticMeshes.push(m); }); continue; }
    const merged = Mesh.MergeMeshes(list, true, true);
    if (merged) { merged.isPickable = false; merged.freezeWorldMatrix(); staticMeshes.push(merged); }
  }
  for (const m of decorMeshes) if (m.parent && !m.isDisposed()) staticMeshes.push(m);
  onProgress?.(0.9);

  // ---- water + void sea
  const water = MeshBuilder.CreateGround('water', { width: 5000, height: 5000, subdivisions: 1 }, scene);
  const wm = new StandardMaterial('waterMat', scene);
  wm.diffuseColor = Color3.FromHexString('#1f9fb0');
  wm.emissiveColor = Color3.FromHexString('#0b4a66').scale(0.6);
  wm.specularColor = new Color3(0.6, 0.6, 0.6);
  wm.specularPower = 64;
  wm.alpha = 0.78;
  water.material = wm;
  water.position.y = 0;
  water.isPickable = false;
  const deep = MeshBuilder.CreateGround('deep', { width: 5000, height: 5000 }, scene);
  const dm = new StandardMaterial('deepMat', scene);
  dm.diffuseColor = Color3.FromHexString('#2a1b4a');
  dm.emissiveColor = Color3.FromHexString('#1a0f33');
  dm.specularColor = Color3.Black();
  deep.material = dm;
  deep.position.y = -15;
  deep.isPickable = false;

  scene.clearColor = new Color4(0.78, 0.93, 0.92, 1);
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogColor = new Color3(0.78, 0.92, 0.92);
  const setViewDistance = (d: number) => { scene.fogDensity = 2.2 / d; };
  setViewDistance(1000);
  onProgress?.(1);
  return { root, sky, skyMat, water, staticMeshes, spinners, vents, setViewDistance };
}
