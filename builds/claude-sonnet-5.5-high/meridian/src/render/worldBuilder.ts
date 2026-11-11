import {
  Color3, InstancedMesh, Mesh, MeshBuilder, Scene, ShaderMaterial, StandardMaterial, Texture, TransformNode, Vector3, Effect, Constants,
} from '@babylonjs/core';
import type { Material } from '@babylonjs/core';
import { Rng } from '../core/rng';
import { LINES, ROAD_HALF, SEA_Z, SIDEWALK } from '../sim/world';
import type { Building, FacadeStyle, Poi, World } from '../sim/world';
import { GeoBuilder, hex, mul, tint } from './geo';
import type { RGBA } from './geo';
import { asphaltTexture, deckTexture, facadeTextures, glowTexture, groundTexture, plazaTexture, sidewalkTexture, signTexture } from './textures';
import type { FacadeTex } from './textures';

export interface WorldVisuals {
  facades: Record<FacadeStyle, { mat: StandardMaterial; tex: FacadeTex; glow: StandardMaterial }>;
  glowMeshes: Mesh[];
  signalX: StandardMaterial;
  signalZ: StandardMaterial;
  lampMat: StandardMaterial;
  poolMat: StandardMaterial;
  water: ShaderMaterial;
  asphalt: StandardMaterial;
  breakables: Map<number, InstancedMesh>;
  casters: Mesh[];
  receivers: Mesh[];
  poiMarkers: Map<string, TransformNode>;
  staticRoot: TransformNode;
  spikeMaster: Mesh;
}

const WATER_VS = `
precision highp float;
attribute vec3 position;
uniform mat4 worldViewProjection;
uniform mat4 world;
varying vec3 vWorld;
void main(){ vec4 w = world * vec4(position,1.0); vWorld = w.xyz; gl_Position = worldViewProjection * vec4(position,1.0); }`;
const WATER_FS = `
precision highp float;
varying vec3 vWorld;
uniform vec3 cameraPosition;
uniform float time;
uniform vec3 deepColor; uniform vec3 shallowColor; uniform vec3 skyColor; uniform vec3 sunDir; uniform vec3 sunColor; uniform float fogDensity; uniform vec3 fogColor;
float h(vec2 p){ return sin(p.x*0.6+time*0.9)*0.5+sin(p.y*0.8-time*1.1)*0.5+sin((p.x+p.y)*1.3+time*1.7)*0.35; }
void main(){
  vec2 p = vWorld.xz;
  float e = 0.15;
  vec3 n = normalize(vec3((h(p+vec2(e,0.))-h(p-vec2(e,0.)))*0.35, 1.0, (h(p+vec2(0.,e))-h(p-vec2(0.,e)))*0.35));
  vec3 v = normalize(cameraPosition - vWorld);
  float fres = pow(1.0 - max(dot(n,v),0.0), 3.0);
  vec3 col = mix(deepColor, shallowColor, 0.5 + 0.5*h(p*0.2));
  col = mix(col, skyColor, clamp(fres*0.9+0.08,0.0,1.0));
  vec3 r = reflect(-v, n);
  float spec = pow(max(dot(r, normalize(sunDir)),0.0), 90.0);
  col += sunColor * spec * 1.6;
  float d = length(cameraPosition - vWorld);
  float f = 1.0 - exp(-fogDensity*fogDensity*d*d);
  col = mix(col, fogColor, clamp(f,0.0,1.0));
  gl_FragColor = vec4(col, 1.0);
}`;

export function buildWorld(scene: Scene, world: World, quality: 'low' | 'medium' | 'high'): WorldVisuals {
  const root = new TransformNode('world', scene);
  const casters: Mesh[] = [];
  const receivers: Mesh[] = [];
  const rng = new Rng(77);

  const std = (name: string, o: { diffuse?: Texture; color?: Color3; emissive?: Color3; spec?: number; vc?: boolean } = {}): StandardMaterial => {
    const m = new StandardMaterial(name, scene);
    if (o.diffuse) m.diffuseTexture = o.diffuse;
    m.diffuseColor = o.color ?? Color3.White();
    m.specularColor = new Color3(o.spec ?? 0.05, o.spec ?? 0.05, o.spec ?? 0.05);
    m.specularPower = 48;
    if (o.emissive) m.emissiveColor = o.emissive;
    m.backFaceCulling = false;
    return m;
  };

  // ---------------------------------------------------------------- ground, roads, sidewalks
  const asphaltTex = asphaltTexture(scene);
  const asphalt = std('asphalt', { diffuse: asphaltTex, spec: 0.08 });
  const sidewalkMat = std('sidewalk', { diffuse: sidewalkTexture(scene), spec: 0.04 });
  const plazaMat = std('plaza', { diffuse: plazaTexture(scene), spec: 0.05 });
  const groundMat = std('ground', { diffuse: groundTexture(scene), spec: 0.02 });
  const deckMat = std('deck', { diffuse: deckTexture(scene), spec: 0.05 });
  const flat = std('flat', { spec: 0.04 });
  const markMat = std('marks', { color: new Color3(1, 1, 1), emissive: new Color3(0.35, 0.35, 0.33), spec: 0 });

  const ground = MeshBuilder.CreateGround('ground', { width: 1400, height: 1400 }, scene);
  ground.position.y = -0.05;
  ground.material = groundMat;
  (groundMat.diffuseTexture as Texture).uScale = 280;
  (groundMat.diffuseTexture as Texture).vScale = 280;
  ground.receiveShadows = true;
  ground.freezeWorldMatrix();
  receivers.push(ground);

  const roads = new GeoBuilder();
  const marks = new GeoBuilder();
  const ext = 246;
  const white: RGBA = [0.92, 0.92, 0.9, 1];
  const yellow: RGBA = [0.95, 0.78, 0.2, 1];
  const rd = (x0: number, z0: number, x1: number, z1: number): void => {
    const u = 1 / 8;
    roads.quad([x0, 0.02, z0], [x0, 0.02, z1], [x1, 0.02, z1], [x1, 0.02, z0], [0, 1, 0], [[x0 * u, z0 * u], [x0 * u, z1 * u], [x1 * u, z1 * u], [x1 * u, z0 * u]], [1, 1, 1, 1]);
  };
  for (const l of LINES) {
    rd(l - ROAD_HALF, -ext, l + ROAD_HALF, ext);
    rd(-ext, l - ROAD_HALF, ext, l + ROAD_HALF);
  }
  const mk = (x0: number, z0: number, x1: number, z1: number, c: RGBA): void => {
    marks.quad([x0, 0.035, z0], [x0, 0.035, z1], [x1, 0.035, z1], [x1, 0.035, z0], [0, 1, 0], [[0, 0], [0, 1], [1, 1], [1, 0]], c);
  };
  for (const l of LINES) {
    for (let k = 0; k < LINES.length - 1; k++) {
      const a = LINES[k] + 12;
      const b = LINES[k + 1] - 12;
      // centre dashes (along z at x=l and along x at z=l)
      for (let t = a; t < b; t += 7) {
        mk(l - 0.12, t, l + 0.12, Math.min(t + 3.5, b), yellow);
        mk(t, l - 0.12, Math.min(t + 3.5, b), l + 0.12, yellow);
      }
    }
    // edge lines
    for (const side of [-1, 1]) {
      const e = l + side * (ROAD_HALF - 0.35);
      mk(e - 0.07, -ext, e + 0.07, ext, [0.8, 0.8, 0.78, 1]);
      mk(-ext, e - 0.07, ext, e + 0.07, [0.8, 0.8, 0.78, 1]);
    }
  }
  // crosswalks and stop lines
  for (const lx of LINES) for (const lz of LINES) {
    for (let k = -5; k <= 5; k++) {
      const o = k * 1.05;
      for (const s of [-1, 1]) {
        if (Math.abs(lx + s * 9) < ext + 1) { /* arms along x at z */ }
        // crosswalk across the x-running road: stripes along z, placed at x = lx +- 9
        mk(lx + s * 8.4 - 0.55, lz + o - 0.28, lx + s * 8.4 + 0.55, lz + o + 0.28, white);
        mk(lx + o - 0.28, lz + s * 8.4 - 0.55, lx + o + 0.28, lz + s * 8.4 + 0.55, white);
      }
    }
    for (const s of [-1, 1]) {
      mk(lx + s * 10.6 - 0.22, lz - ROAD_HALF + 0.3, lx + s * 10.6 + 0.22, lz, white);
      mk(lx + s * 10.6 - 0.22, lz, lx + s * 10.6 + 0.22, lz + ROAD_HALF - 0.3, white);
      mk(lx - ROAD_HALF + 0.3, lz + s * 10.6 - 0.22, lx, lz + s * 10.6 + 0.22, white);
      mk(lx, lz + s * 10.6 - 0.22, lx + ROAD_HALF - 0.3, lz + s * 10.6 + 0.22, white);
    }
  }
  const roadMesh = roads.build(scene, 'roads', asphalt, { receive: true });
  receivers.push(roadMesh);
  marks.build(scene, 'markings', markMat);

  // sidewalk slabs per block (plaza block gets paving)
  const slabs = new GeoBuilder();
  const plazas = new GeoBuilder();
  for (const b of world.blocks) {
    const h = 0.16;
    const x0 = b.cx - 34;
    const x1 = b.cx + 34;
    const z0 = b.cz - 34;
    const z1 = b.cz + 34;
    const g = b.kind === 'plaza' || b.kind === 'park' ? plazas : slabs;
    const u = 1 / 4;
    g.box(x0, 0, z0, x1, h, z1, [1, 1, 1, 1], { wall: false, top: true });
    // curb sides
    slabs.quad([x0, 0, z0], [x1, 0, z0], [x1, h, z0], [x0, h, z0], [0, 0, -1], [[0, 0], [1, 0], [1, 0.05], [0, 0.05]], [0.8, 0.8, 0.78, 1]);
    slabs.quad([x1, 0, z1], [x0, 0, z1], [x0, h, z1], [x1, h, z1], [0, 0, 1], [[0, 0], [1, 0], [1, 0.05], [0, 0.05]], [0.8, 0.8, 0.78, 1]);
    slabs.quad([x0, 0, z1], [x0, 0, z0], [x0, h, z0], [x0, h, z1], [-1, 0, 0], [[0, 0], [1, 0], [1, 0.05], [0, 0.05]], [0.8, 0.8, 0.78, 1]);
    slabs.quad([x1, 0, z0], [x1, 0, z1], [x1, h, z1], [x1, h, z0], [1, 0, 0], [[0, 0], [1, 0], [1, 0.05], [0, 0.05]], [0.8, 0.8, 0.78, 1]);
    void u;
  }
  // box() top uv uses tileW 32 -> adjust through texture scale
  (sidewalkMat.diffuseTexture as Texture).uScale = 8;
  (sidewalkMat.diffuseTexture as Texture).vScale = 8;
  (plazaMat.diffuseTexture as Texture).uScale = 8;
  (plazaMat.diffuseTexture as Texture).vScale = 8;
  receivers.push(slabs.build(scene, 'sidewalks', sidewalkMat, { receive: true }));
  receivers.push(plazas.build(scene, 'plazas', plazaMat, { receive: true }));

  // quay deck (south of the seawall road)
  const deck = new GeoBuilder();
  deck.box(-300, -0.4, SEA_Z, 300, 0.16, -ROAD_HALF * 0 - 246, [1, 1, 1, 1], { wall: true, top: true, tileW: 32, tileH: 28 });
  (deckMat.diffuseTexture as Texture).uScale = 10;
  (deckMat.diffuseTexture as Texture).vScale = 2;
  receivers.push(deck.build(scene, 'quay', deckMat, { receive: true }));
  // road continues across the quay edge as asphalt road at z=-240 is part of roads already

  // ---------------------------------------------------------------- buildings
  const facades = {} as WorldVisuals['facades'];
  const styles: FacadeStyle[] = ['stone', 'glass', 'brick', 'tile', 'shed', 'deco'];
  for (const s of styles) {
    const tex = facadeTextures(scene, s);
    const mat = std('facade-' + s, { diffuse: tex.diffuse, spec: s === 'glass' ? 0.35 : 0.05 });
    mat.diffuseTexture = tex.diffuse;
    const glow = new StandardMaterial('facade-glow-' + s, scene);
    glow.disableLighting = true;
    glow.diffuseColor = Color3.Black();
    glow.specularColor = Color3.Black();
    glow.emissiveTexture = tex.emissive;
    glow.emissiveColor = new Color3(0, 0, 0);
    tex.emissive.getAlphaFromRGB = true;
    glow.opacityTexture = tex.emissive;
    glow.alphaMode = Constants.ALPHA_COMBINE;
    glow.backFaceCulling = false;
    glow.zOffset = -3;
    facades[s] = { mat, tex, glow };
  }
  const roofMat = std('roofs', { spec: 0.02 });
  const roofGeo = new GeoBuilder();
  const byBlockStyle = new Map<string, GeoBuilder>();
  const glowMeshes: Mesh[] = [];
  const tintFor = (b: Building): [number, number, number] => {
    const t = [[1, 1, 1], [1.05, 0.98, 0.92], [0.95, 1.0, 1.05], [1.04, 1.03, 0.94], [0.97, 0.93, 0.97], [1.02, 0.96, 0.9]][b.accent % 6];
    return t as [number, number, number];
  };
  const keyOf = (b: Building): string => {
    const i = Math.floor((b.minX + b.maxX) / 2 / 80);
    const j = Math.floor((b.minZ + b.maxZ) / 2 / 80);
    return `${i},${j},${b.style}`;
  };
  for (const b of world.buildings) {
    const key = keyOf(b);
    let g = byBlockStyle.get(key);
    if (!g) { g = new GeoBuilder(); byBlockStyle.set(key, g); }
    const col = tint([1, 1, 1, 1], tintFor(b));
    const floorH = 3.5;
    const total = Math.max(floorH, Math.round(b.h / floorH) * floorH);
    let y = 0;
    let minX = b.minX; let maxX = b.maxX; let minZ = b.minZ; let maxZ = b.maxZ;
    const tiers = b.tiers;
    for (let t = 0; t < tiers; t++) {
      const part = t === tiers - 1 ? total - y : Math.max(floorH, Math.round((total * (t === 0 ? 0.55 : 0.28)) / floorH) * floorH);
      const top = y + part;
      g.box(minX, y, minZ, maxX, top, maxZ, col, { top: false });
      // roof slab + parapet
      const roofC: RGBA = [0.34, 0.35, 0.36, 1];
      roofGeo.box(minX, top, minZ, maxX, top + 0.12, maxZ, roofC, { wall: false, top: true, plain: true });
      roofGeo.box(minX, top, minZ, maxX, top + 0.7, minZ + 0.35, [0.62, 0.6, 0.56, 1], { plain: true });
      roofGeo.box(minX, top, maxZ - 0.35, maxX, top + 0.7, maxZ, [0.62, 0.6, 0.56, 1], { plain: true });
      roofGeo.box(minX, top, minZ, minX + 0.35, top + 0.7, maxZ, [0.62, 0.6, 0.56, 1], { plain: true });
      roofGeo.box(maxX - 0.35, top, minZ, maxX, top + 0.7, maxZ, [0.62, 0.6, 0.56, 1], { plain: true });
      y = top;
      const inset = Math.min(4.5, (maxX - minX) * 0.14);
      minX += inset; maxX -= inset; minZ += inset; maxZ -= inset;
      if (maxX - minX < 8 || maxZ - minZ < 8) break;
    }
    if (b.roofProps) {
      const n = rng.int(1, 3);
      for (let k = 0; k < n; k++) {
        const w = rng.range(1.5, 3.4);
        const px = rng.range(minX + 2, Math.max(minX + 2.1, maxX - 2 - w));
        const pz = rng.range(minZ + 2, Math.max(minZ + 2.1, maxZ - 2 - w));
        roofGeo.box(px, y, pz, px + w, y + rng.range(1, 2.4), pz + rng.range(1.5, 3), [0.55, 0.57, 0.58, 1], { plain: true });
      }
      if (b.style === 'brick' || b.style === 'tile') { // water tank
        roofGeo.cylinder((minX + maxX) / 2, y, (minZ + maxZ) / 2, 1.4, 1.4, 2.4, 10, [0.45, 0.32, 0.22, 1]);
        roofGeo.cylinder((minX + maxX) / 2, y + 2.4, (minZ + maxZ) / 2, 1.5, 0.2, 0.9, 10, [0.3, 0.3, 0.3, 1]);
      }
    }
    if (b.style === 'deco' && tiers > 1) roofGeo.cylinder((minX + maxX) / 2, y, (minZ + maxZ) / 2, 0.15, 0.15, 6 + b.h * 0.05, 6, [0.8, 0.8, 0.82, 1]);
  }
  for (const [key, g] of byBlockStyle) {
    const style = key.split(',')[2] as FacadeStyle;
    const m = g.build(scene, 'bld-' + key, facades[style].mat, { receive: true });
    casters.push(m);
    receivers.push(m);
    const gm = m.clone('glow-' + key);
    gm.material = facades[style].glow;
    gm.receiveShadows = false;
    gm.freezeWorldMatrix();
    glowMeshes.push(gm);
  }
  const roofs = roofGeo.build(scene, 'roofs', roofMat, { receive: true });
  casters.push(roofs);

  // ---------------------------------------------------------------- props (merged, coloured)
  const props = new GeoBuilder();
  const lamps = new GeoBuilder();
  const pools = new GeoBuilder();
  const sigX = new GeoBuilder();
  const sigZ = new GeoBuilder();
  const breakables = new Map<number, InstancedMesh>();
  const binMaster = MeshBuilder.CreateCylinder('bin', { diameter: 0.7, height: 0.9, tessellation: 10 }, scene);
  binMaster.material = std('bin', { color: new Color3(0.22, 0.4, 0.45), spec: 0.1 });
  binMaster.position.y = -50;
  const coneMaster = MeshBuilder.CreateCylinder('cone', { diameterTop: 0.08, diameterBottom: 0.5, height: 0.7, tessellation: 8 }, scene);
  coneMaster.material = std('cone', { color: new Color3(0.95, 0.45, 0.12), emissive: new Color3(0.2, 0.08, 0.02), spec: 0.1 });
  coneMaster.position.y = -50;
  casters.push(binMaster, coneMaster);
  for (const p of world.props) {
    const c = hex(p.color);
    switch (p.kind) {
      case 'lamp':
        props.cylinder(p.x, 0, p.z, 0.14, 0.1, p.h, 6, [0.2, 0.22, 0.25, 1]);
        props.box(p.x - 0.8, p.h - 0.15, p.z - 0.15, p.x + 0.05, p.h + 0.05, p.z + 0.15, [0.2, 0.22, 0.25, 1], { plain: true });
        lamps.box(p.x - 0.78, p.h - 0.2, p.z - 0.2, p.x - 0.05, p.h - 0.12, p.z + 0.2, [1, 0.9, 0.65, 1], { plain: true, wall: true });
        pools.quad([p.x - 6.5, 0.045, p.z - 6], [p.x - 6.5, 0.045, p.z + 6], [p.x + 5.5, 0.045, p.z + 6], [p.x + 5.5, 0.045, p.z - 6], [0, 1, 0], [[0, 0], [0, 1], [1, 1], [1, 0]], [1, 0.82, 0.5, 1]);
        break;
      case 'signal': {
        props.cylinder(p.x, 0, p.z, 0.1, 0.1, p.h, 6, [0.17, 0.19, 0.2, 1]);
        // heads facing both axes
        props.box(p.x - 0.16, p.h - 1.1, p.z - 0.16, p.x + 0.16, p.h, p.z + 0.16, [0.1, 0.1, 0.11, 1], { plain: true });
        sigX.box(p.x - 0.1, p.h - 0.75, p.z - 0.17, p.x + 0.1, p.h - 0.3, p.z + 0.17, [1, 1, 1, 1], { plain: true });
        sigZ.box(p.x - 0.17, p.h - 0.75, p.z - 0.1, p.x + 0.17, p.h - 0.3, p.z + 0.1, [1, 1, 1, 1], { plain: true });
        break;
      }
      case 'tree': {
        props.cylinder(p.x, 0, p.z, 0.22, 0.14, 2.8, 6, [0.36, 0.26, 0.18, 1]);
        const gcol = tint(c, [0.85 + rng.next() * 0.3, 0.9 + rng.next() * 0.2, 0.85]);
        props.sphere(p.x, 4.0, p.z, 2.1, 1.9, 2.1, 8, gcol);
        props.sphere(p.x + 0.8, 3.4, p.z - 0.5, 1.4, 1.2, 1.4, 6, mul(gcol, 0.9));
        break;
      }
      case 'bin': case 'cone': {
        const m = (p.kind === 'bin' ? binMaster : coneMaster).createInstance('p' + p.id);
        m.position.set(p.x, p.h / 2 + 0.16, p.z);
        m.freezeWorldMatrix();
        if (p.colliderId !== undefined) breakables.set(p.colliderId, m);
        break;
      }
      case 'planter':
        props.rbox(p.x, 0.45, p.z, p.w, 0.9, p.d, p.rot, hex(0x7d8a80), hex(0x3f6b3d));
        props.sphere(p.x, 1.15, p.z, 0.7, 0.45, 0.7, 6, hex(0x4a8b4a));
        break;
      case 'stall':
        props.box(p.x - p.w / 2, 0, p.z - p.d / 2, p.x + p.w / 2, 1.0, p.z + p.d / 2, hex(0x8a6a45), { plain: true });
        props.box(p.x - p.w / 2 - 0.1, 2.3, p.z - p.d / 2 - 0.4, p.x + p.w / 2 + 0.1, 2.6, p.z + p.d / 2 + 0.2, c, { plain: true });
        props.box(p.x - p.w / 2, 1.0, p.z - p.d / 2, p.x - p.w / 2 + 0.1, 2.3, p.z - p.d / 2 + 0.1, [0.3, 0.25, 0.2, 1], { plain: true });
        props.box(p.x + p.w / 2 - 0.1, 1.0, p.z - p.d / 2, p.x + p.w / 2, 2.3, p.z - p.d / 2 + 0.1, [0.3, 0.25, 0.2, 1], { plain: true });
        // goods
        for (let k = 0; k < 5; k++) props.sphere(p.x - 1.5 + k * 0.75, 1.15, p.z + 0.1, 0.22, 0.18, 0.22, 5, hex([0xe5533b, 0xf0b429, 0x6fba5d, 0xe5533b, 0xf0b429][k]));
        break;
      case 'container': {
        const ribs: RGBA = mul(c, 0.82);
        const n = Math.round(p.h / 2.6);
        for (let k = 0; k < n; k++) {
          props.box(p.x - p.w / 2, k * 2.6, p.z - p.d / 2 - 0.05, p.x + p.w / 2, k * 2.6 + 2.6, p.z + p.d / 2 + 0.05, tint(c, [1, 1, 1 - k * 0.1]), { plain: true });
          for (let r = 0; r < Math.floor(p.w / 0.9); r++) props.box(p.x - p.w / 2 + 0.2 + r * 0.9, k * 2.6 + 0.1, p.z - p.d / 2 - 0.11, p.x - p.w / 2 + 0.38 + r * 0.9, k * 2.6 + 2.5, p.z + p.d / 2 + 0.11, ribs, { plain: true, wall: true, top: false });
        }
        break;
      }
      case 'crate': props.box(p.x - p.w / 2, 0, p.z - p.d / 2, p.x + p.w / 2, p.h, p.z + p.d / 2, c, { plain: true }); break;
      case 'barrier':
        props.box(p.x - p.w / 2, 0, p.z - p.d / 2, p.x + p.w / 2, p.h, p.z + p.d / 2, [0.9, 0.7, 0.1, 1], { plain: true });
        for (let k = 0; k < 6; k++) props.box(p.x - p.w / 2 + k * (p.w / 6), 0.3, p.z - p.d / 2 - 0.02, p.x - p.w / 2 + k * (p.w / 6) + p.w / 12, 0.7, p.z + p.d / 2 + 0.02, [0.12, 0.12, 0.12, 1], { plain: true, top: false });
        break;
      case 'bench': props.box(p.x - 0.9, 0.35, p.z - 0.3, p.x + 0.9, 0.5, p.z + 0.3, c, { plain: true }); props.box(p.x - 0.9, 0.5, p.z + 0.25, p.x + 0.9, 0.95, p.z + 0.32, c, { plain: true }); break;
      case 'dome':
        if (p.w > 0) {
          props.cylinder(p.x, 0, p.z, 5.5, 5.5, 5.5, 14, hex(0xe6dcc3));
          props.sphere(p.x, 5.5, p.z, 6.4, 6.5, 6.4, 16, hex(0x3f9d8a), true);
          props.cylinder(p.x, 11.9, p.z, 0.12, 0.05, 3, 6, hex(0xd8c34a));
          for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; props.cylinder(p.x + Math.cos(a) * 5.2, 0, p.z + Math.sin(a) * 5.2, 0.28, 0.28, 5.5, 6, hex(0xf3ecd9)); }
        }
        break;
      case 'lighthouse':
        for (let k = 0; k < 5; k++) props.cylinder(p.x, k * 6.5, p.z, 3.4 - k * 0.25, 3.15 - k * 0.25, 6.5, 14, k % 2 ? hex(0xb8332b) : hex(0xeee9dc));
        props.cylinder(p.x, 32.5, p.z, 3.4, 3.4, 0.5, 14, [0.2, 0.2, 0.22, 1]);
        lamps.cylinder(p.x, 33, p.z, 1.8, 1.8, 2.2, 12, [1, 0.95, 0.7, 1]);
        props.cylinder(p.x, 35.2, p.z, 2.3, 0.1, 1.8, 12, [0.2, 0.2, 0.22, 1]);
        break;
      case 'crane': {
        const cc = hex(0xd25a2e);
        for (const [dx, dz] of [[-10, -8], [10, -8], [-10, 8], [10, 8]]) props.box(p.x + dx - 0.7, 0, p.z + dz - 0.7, p.x + dx + 0.7, 28, p.z + dz + 0.7, cc, { plain: true });
        props.box(p.x - 11, 27, p.z - 9, p.x + 11, 29, p.z + 9, cc, { plain: true });
        props.box(p.x - 3, 27, p.z - 40, p.x + 3, 29, p.z + 9, mul(cc, 0.9), { plain: true });
        props.box(p.x - 0.4, 29, p.z - 36, p.x + 0.4, 34, p.z - 35, [0.3, 0.3, 0.3, 1], { plain: true });
        props.box(p.x - 0.1, 12, p.z - 20.2, p.x + 0.1, 27, p.z - 20, [0.15, 0.15, 0.15, 1], { plain: true });
        break;
      }
      default: break;
    }
  }
  const propsMat = std('props', { spec: 0.08 });
  casters.push(props.build(scene, 'props', propsMat, { receive: true }));
  const lampMat = std('lamps', { color: new Color3(1, 0.9, 0.6), emissive: new Color3(0.05, 0.05, 0.04), spec: 0 });
  lamps.build(scene, 'lampheads', lampMat);
  const poolMat = std('lamppool', { diffuse: glowTexture(scene), color: new Color3(0, 0, 0), emissive: new Color3(0, 0, 0), spec: 0 });
  poolMat.emissiveTexture = poolMat.diffuseTexture;
  poolMat.opacityTexture = poolMat.diffuseTexture;
  poolMat.disableLighting = true;
  poolMat.alphaMode = Constants.ALPHA_ADD;
  poolMat.zOffset = -2;
  const poolMesh = pools.build(scene, 'lamppools', poolMat);
  poolMesh.alwaysSelectAsActiveMesh = false;
  const signalX = std('signalX', { color: new Color3(0.1, 0.1, 0.1), emissive: new Color3(0, 1, 0), spec: 0 });
  const signalZ = std('signalZ', { color: new Color3(0.1, 0.1, 0.1), emissive: new Color3(1, 0, 0), spec: 0 });
  sigX.build(scene, 'signalsX', signalX);
  sigZ.build(scene, 'signalsZ', signalZ);

  // CCTV heads on poles at camera intersections
  const cctv = new GeoBuilder();
  for (const [x, z] of [[0, 0], [80, 80], [-80, -80], [160, -80], [-160, 80], [80, 160], [160, 160]]) {
    cctv.box(x + 7.4, 5.4, z + 6.9, x + 8.2, 5.8, z + 7.9, [0.1, 0.1, 0.12, 1], { plain: true });
    cctv.box(x + 7.9, 5.45, z + 7.0, x + 8.25, 5.7, z + 7.2, [1, 0.2, 0.2, 1], { plain: true });
  }
  cctv.build(scene, 'cctv', std('cctv', { color: new Color3(1, 1, 1), spec: 0 }));

  // ---------------------------------------------------------------- water + canal + sky helpers
  Effect.ShadersStore['waterVertexShader'] = WATER_VS;
  Effect.ShadersStore['waterFragmentShader'] = WATER_FS;
  const water = new ShaderMaterial('water', scene, 'water', {
    attributes: ['position'], uniforms: ['worldViewProjection', 'world', 'cameraPosition', 'time', 'deepColor', 'shallowColor', 'skyColor', 'sunDir', 'sunColor', 'fogDensity', 'fogColor'],
  });
  water.backFaceCulling = false;
  water.setVector3('deepColor', new Vector3(0.04, 0.17, 0.25));
  water.setVector3('shallowColor', new Vector3(0.1, 0.4, 0.48));
  water.setVector3('skyColor', new Vector3(0.55, 0.72, 0.9));
  water.setVector3('sunDir', new Vector3(0.4, 0.6, 0.4));
  water.setVector3('sunColor', new Vector3(1, 0.85, 0.6));
  water.setFloat('fogDensity', 0.0015);
  water.setVector3('fogColor', new Vector3(0.7, 0.78, 0.86));
  water.setFloat('time', 0);
  const sea = MeshBuilder.CreateGround('sea', { width: 1400, height: 520, subdivisions: 1 }, scene);
  sea.position.set(0, -0.9, SEA_Z - 260 + 1);
  sea.material = water;
  sea.freezeWorldMatrix();
  const canal = MeshBuilder.CreateGround('canal', { width: world.canal.maxX - world.canal.minX, height: world.canal.maxZ - world.canal.minZ }, scene);
  canal.position.set((world.canal.minX + world.canal.maxX) / 2, 0.1, (world.canal.minZ + world.canal.maxZ) / 2);
  canal.material = water;
  canal.freezeWorldMatrix();
  // canal banks + footbridge + quay rail posts
  const banks = new GeoBuilder();
  banks.box(world.canal.minX, 0, world.canal.minZ - 0.5, world.canal.maxX, 0.3, world.canal.minZ, [0.55, 0.55, 0.52, 1], { plain: true });
  banks.box(world.canal.minX, 0, world.canal.maxZ, world.canal.maxX, 0.3, world.canal.maxZ + 0.5, [0.55, 0.55, 0.52, 1], { plain: true });
  banks.box(-43, 0.2, world.canal.minZ - 0.5, -37, 0.45, world.canal.maxZ + 0.5, [0.62, 0.45, 0.28, 1], { plain: true });
  banks.box(-43, 0.45, world.canal.minZ - 0.5, -42.8, 1.2, world.canal.maxZ + 0.5, [0.35, 0.3, 0.27, 1], { plain: true });
  banks.box(-37.2, 0.45, world.canal.minZ - 0.5, -37, 1.2, world.canal.maxZ + 0.5, [0.35, 0.3, 0.27, 1], { plain: true });
  for (let x = -290; x <= 290; x += 4) banks.box(x - 0.12, 0.16, SEA_Z - 0.12, x + 0.12, 1.0, SEA_Z + 0.12, [0.9, 0.9, 0.9, 1], { plain: true });
  banks.box(-296, 0.9, SEA_Z - 0.04, 296, 1.0, SEA_Z + 0.04, [0.9, 0.85, 0.2, 1], { plain: true });
  casters.push(banks.build(scene, 'banks', flat, { receive: true }));

  // boats moored on the harbor
  const boats = new GeoBuilder();
  for (let k = 0; k < 7; k++) {
    const bx = -230 + k * 76 + rng.range(-10, 10);
    const bz = SEA_Z - 12 - rng.range(0, 18);
    const bc = hex([0xe8e4d8, 0x2f5f8f, 0xb8452f, 0xd9b43b][k % 4]);
    boats.box(bx - 3.2, -0.8, bz - 1.2, bx + 3.2, 0.5, bz + 1.2, bc, { plain: true });
    boats.box(bx - 1.2, 0.5, bz - 0.9, bx + 0.9, 1.5, bz + 0.9, [0.9, 0.9, 0.92, 1], { plain: true });
    boats.cylinder(bx + 1.8, 0.5, bz, 0.06, 0.05, 3.5, 5, [0.8, 0.8, 0.8, 1]);
  }
  boats.build(scene, 'boats', flat);

  // ---------------------------------------------------------------- POI signage
  const poiMarkers = new Map<string, TransformNode>();
  const signColors: Record<string, string> = {
    safehouse: '#2a6f6a', store: '#2d5fa8', kiosk: '#a8402d', printshop: '#6a4a8a', tower: '#25506b', precinct: '#1b2a41', garage: '#7a5a1f', dockside: '#8a3b2a', warehouse: '#4a4f55', courier: '#d08a1f',
  };
  const buildPoi = (p: Poi): void => {
    if (p.landmark || p.kind === 'viewpoint') return;
    const node = new TransformNode('poi-' + p.id, scene);
    node.position.set(p.x, 0, p.z);
    // plaque and awning against the facade (building lies toward heading direction)
    const dirZ = p.heading === 0 ? 1 : -1;
    const plane = MeshBuilder.CreatePlane('sign-' + p.id, { width: 5.2, height: 1.3 }, scene);
    const sm = new StandardMaterial('signm-' + p.id, scene);
    const st = signTexture(scene, p.name.replace(/\s*\(.*\)/, ''), signColors[p.kind] ?? '#333');
    sm.diffuseTexture = st;
    sm.emissiveTexture = st;
    sm.emissiveColor = new Color3(0.55, 0.55, 0.55);
    sm.specularColor = Color3.Black();
    sm.backFaceCulling = false;
    plane.material = sm;
    plane.parent = node;
    plane.position.set(0, 3.9, dirZ * 2.05);
    plane.rotation.y = dirZ > 0 ? Math.PI : 0;
    const awning = MeshBuilder.CreateBox('awn-' + p.id, { width: 5.4, height: 0.12, depth: 1.8 }, scene);
    const am = std('awn-' + p.id, { color: Color3.FromHexString(signColors[p.kind] ?? '#444'), spec: 0.05 });
    awning.material = am;
    awning.parent = node;
    awning.position.set(0, 3.05, dirZ * 1.05);
    awning.rotation.x = dirZ * -0.12;
    const door = MeshBuilder.CreateBox('door-' + p.id, { width: 1.5, height: 2.4, depth: 0.2 }, scene);
    door.material = std('door-' + p.id, { color: new Color3(0.14, 0.12, 0.1), emissive: new Color3(0.12, 0.1, 0.06), spec: 0.2 });
    door.parent = node;
    door.position.set(0, 1.2, dirZ * 2.0);
    // ground ring marker
    const ring = MeshBuilder.CreateDisc('ring-' + p.id, { radius: 1.6, tessellation: 24 }, scene);
    const rm = std('ring-' + p.id, { color: Color3.FromHexString(signColors[p.kind] ?? '#fff'), emissive: Color3.FromHexString(signColors[p.kind] ?? '#fff').scale(0.6), spec: 0 });
    rm.alpha = 0.5;
    ring.material = rm;
    ring.parent = node;
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.2;
    casters.push(plane);
    poiMarkers.set(p.id, node);
  };
  for (const p of world.pois) buildPoi(p);

  // spike strip master (instanced by the renderer as needed)
  const spikeMaster = MeshBuilder.CreateBox('spike', { width: 8, height: 0.08, depth: 0.8 }, scene);
  spikeMaster.material = std('spike', { color: new Color3(0.8, 0.8, 0.85), emissive: new Color3(0.4, 0.05, 0.05), spec: 0.4 });
  spikeMaster.position.y = -50;

  void Constants; void SIDEWALK;
  return { facades, glowMeshes, signalX, signalZ, lampMat, poolMat, water, asphalt, breakables, casters, receivers, poiMarkers, staticRoot: root, spikeMaster };
}
