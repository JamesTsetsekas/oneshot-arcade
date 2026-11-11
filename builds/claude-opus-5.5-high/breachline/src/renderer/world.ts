// Scene, environment, sky, ocean, map geometry and decor for Relay Station K-17.
import {
  Engine, Scene, Color3, Color4, Vector3, Mesh, VertexData, StandardMaterial, MeshBuilder, HemisphericLight, DirectionalLight,
  CascadedShadowGenerator, ShadowGenerator, ShaderMaterial, Effect, TransformNode, ParticleSystem, DefaultRenderingPipeline,
  ImageProcessingConfiguration, AbstractMesh, Texture, Material,
} from "@babylonjs/core";
import { MapDef, MapBox, Decor } from "../content/map-k17";
import { procTexture, textTexture } from "./textures";
import { Rng } from "../shared/math";

export type Quality = "low" | "medium" | "high";

interface MatSpec { tex: string; tile: number; spec: number; tint?: string; bump?: number; emissive?: string }
const MAT: Record<string, MatSpec> = {
  concrete: { tex: "concrete", tile: 3, spec: 0.05, bump: 2 },
  composite: { tex: "composite", tile: 3.2, spec: 0.08, bump: 1.5 },
  metal: { tex: "metal", tile: 2, spec: 0.35, bump: 1 },
  orange: { tex: "orange", tile: 1.6, spec: 0.2, bump: 1 },
  grate: { tex: "grate", tile: 1.2, spec: 0.3, bump: 3 },
  crate: { tex: "crate", tile: 1.4, spec: 0.08, bump: 1.5 },
  container: { tex: "container", tile: 2.6, spec: 0.25, bump: 2 },
  rock: { tex: "rock", tile: 5, spec: 0.03, bump: 4 },
  roof: { tex: "roof", tile: 4, spec: 0.05 },
  pipe: { tex: "pipe", tile: 2, spec: 0.3 },
  graphite: { tex: "graphite", tile: 1.5, spec: 0.3 },
  tile: { tex: "tile", tile: 1.6, spec: 0.15, bump: 2 },
  sand: { tex: "sand", tile: 4, spec: 0.02 },
  cyan: { tex: "cyan", tile: 1, spec: 0.4, emissive: "#0a3a44" },
};

export interface WorldView {
  scene: Scene;
  sun: DirectionalLight;
  hemi: HemisphericLight;
  shadow: CascadedShadowGenerator | ShadowGenerator | null;
  pipeline: DefaultRenderingPipeline | null;
  glass: Map<number, Mesh>;
  beacons: Mesh[];
  flags: Mesh[];
  oceanMat: ShaderMaterial;
  addCaster(m: AbstractMesh): void;
  update(t: number): void;
  dispose(): void;
}

const SKY_TOP = new Color3(0.23, 0.48, 0.78);
const SKY_HORIZON = new Color3(0.78, 0.86, 0.9);
export const FOG_COLOR = new Color3(0.74, 0.82, 0.86);
export const SUN_DIR = new Vector3(-0.45, -0.78, 0.42).normalize();

Effect.ShadersStore["oceanVertexShader"] = `
precision highp float;
attribute vec3 position;
uniform mat4 world; uniform mat4 worldViewProjection; uniform float time;
varying vec3 vWorld; varying vec3 vNormal;
float h(vec2 p){ return sin(p.x*0.08+time*0.9)*0.35 + sin(p.y*0.11+time*1.2)*0.25 + sin((p.x+p.y)*0.21+time*1.7)*0.12; }
void main(){
  vec4 w = world * vec4(position,1.0);
  float y = h(w.xz);
  float e = 0.6;
  float hx = h(w.xz+vec2(e,0.0)) - h(w.xz-vec2(e,0.0));
  float hz = h(w.xz+vec2(0.0,e)) - h(w.xz-vec2(0.0,e));
  vNormal = normalize(vec3(-hx, 2.0*e, -hz));
  w.y += y;
  vWorld = w.xyz;
  gl_Position = worldViewProjection * vec4(position + vec3(0.0,y,0.0),1.0);
}`;
Effect.ShadersStore["oceanFragmentShader"] = `
precision highp float;
varying vec3 vWorld; varying vec3 vNormal;
uniform vec3 cameraPosition; uniform vec3 sunDir; uniform vec3 fogColor; uniform float fogDensity; uniform float time;
void main(){
  vec3 n = normalize(vNormal + vec3(sin(vWorld.x*0.9+time*2.1)*0.04, 0.0, cos(vWorld.z*0.8+time*1.8)*0.04));
  vec3 v = normalize(cameraPosition - vWorld);
  float fres = pow(1.0 - max(dot(n, v), 0.0), 4.0);
  vec3 deep = vec3(0.03, 0.2, 0.28);
  vec3 shallow = vec3(0.1, 0.42, 0.46);
  vec3 sky = vec3(0.72, 0.84, 0.92);
  float dist = length(vWorld.xz);
  vec3 col = mix(shallow, deep, clamp((dist-60.0)/120.0, 0.0, 1.0));
  col = mix(col, sky, fres*0.85);
  vec3 r = reflect(-v, n);
  float spec = pow(max(dot(r, -sunDir), 0.0), 180.0) * 2.2;
  col += vec3(1.0, 0.95, 0.85) * spec;
  float foam = smoothstep(0.82, 1.0, sin(dist*0.9 - time*1.6)*0.5+0.5) * smoothstep(75.0, 60.0, dist);
  col = mix(col, vec3(0.9,0.95,0.95), foam*0.5);
  float d = length(cameraPosition - vWorld);
  float f = 1.0 - exp(-pow(d*fogDensity, 2.0));
  gl_FragColor = vec4(mix(col, fogColor, clamp(f,0.0,1.0)), 1.0);
}`;

function hexColor(h: string): Color3 { return Color3.FromHexString(h); }

/** Build one mesh per material group with world-space UVs and baked contact darkening (cheap AO). */
function buildBoxGroups(scene: Scene, boxes: MapBox[], mats: Map<string, StandardMaterial>, rng: Rng): Mesh[] {
  const groups = new Map<string, { pos: number[]; nrm: number[]; uv: number[]; col: number[]; idx: number[] }>();
  const isFloorish = (y: number) => boxes.some(() => false) || y <= 0.05 || Math.abs(y - 2.4) < 0.05 || Math.abs(y + 3.2) < 0.05;
  for (const b of boxes) {
    if (b.noRender || b.mat === "glass" || (b.shape && b.shape !== "box")) continue;
    const key = b.mat;
    let g = groups.get(key);
    if (!g) { g = { pos: [], nrm: [], uv: [], col: [], idx: [] }; groups.set(key, g); }
    const spec = MAT[b.mat] ?? MAT.concrete;
    const tint = b.color ? hexColor(b.color) : new Color3(1, 1, 1);
    const jitter = 0.94 + rng.next() * 0.1;
    const { min, max } = b;
    const faces: { n: [number, number, number]; c: [number, number, number][] }[] = [
      { n: [1, 0, 0], c: [[max.x, min.y, min.z], [max.x, max.y, min.z], [max.x, max.y, max.z], [max.x, min.y, max.z]] },
      { n: [-1, 0, 0], c: [[min.x, min.y, max.z], [min.x, max.y, max.z], [min.x, max.y, min.z], [min.x, min.y, min.z]] },
      { n: [0, 1, 0], c: [[min.x, max.y, min.z], [min.x, max.y, max.z], [max.x, max.y, max.z], [max.x, max.y, min.z]] },
      { n: [0, -1, 0], c: [[min.x, min.y, max.z], [min.x, min.y, min.z], [max.x, min.y, min.z], [max.x, min.y, max.z]] },
      { n: [0, 0, 1], c: [[max.x, min.y, max.z], [max.x, max.y, max.z], [min.x, max.y, max.z], [min.x, min.y, max.z]] },
      { n: [0, 0, -1], c: [[min.x, min.y, min.z], [min.x, max.y, min.z], [max.x, max.y, min.z], [max.x, min.y, min.z]] },
    ];
    const height = max.y - min.y;
    for (const f of faces) {
      // skip faces that are fully buried (bottom faces of ground-level boxes)
      const overTunnel = min.x < 25 && max.x > -25 && min.z < -9 && max.z > -14;
      if (f.n[1] === -1 && min.y <= -0.45 && !overTunnel) continue;
      const base = g.pos.length / 3;
      const [nx, ny, nz] = f.n;
      for (const c of f.c) {
        g.pos.push(c[0], c[1], c[2]);
        g.nrm.push(nx, ny, nz);
        let u: number, v: number;
        if (nx !== 0) { u = c[2] * nx; v = c[1]; } else if (ny !== 0) { u = c[0]; v = c[2]; } else { u = -c[0] * nz; v = c[1]; }
        g.uv.push(u / spec.tile, v / spec.tile);
        let ao = 1;
        if (ny === 0) {
          // darken near the base of vertical faces that touch a floor
          if (c[1] === min.y && isFloorish(min.y)) ao = height > 1.5 ? 0.62 : 0.72;
          else if (c[1] === max.y) ao = 1.05;
        } else if (ny < 0) ao = 0.95;
        const k = ao * jitter;
        g.col.push(tint.r * k, tint.g * k, tint.b * k, 1);
      }
      // Winding chosen so faces are front-facing from outside the box (verified in-engine).
      const p0 = f.c[0], p1 = f.c[1], p2 = f.c[2];
      const ax = p1[0] - p0[0], ay = p1[1] - p0[1], az = p1[2] - p0[2];
      const bx = p2[0] - p0[0], by = p2[1] - p0[1], bz = p2[2] - p0[2];
      const cx = ay * bz - az * by, cy = az * bx - ax * bz, cz = ax * by - ay * bx;
      const dot = cx * nx + cy * ny + cz * nz;
      if (dot < 0) g.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      else g.idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
    }
  }
  const meshes: Mesh[] = [];
  for (const [key, g] of groups) {
    const m = new Mesh(`map_${key}`, scene);
    const vd = new VertexData();
    vd.positions = g.pos; vd.normals = g.nrm; vd.uvs = g.uv; vd.colors = g.col; vd.indices = g.idx;
    vd.applyToMesh(m);
    m.material = mats.get(key)!;
    m.receiveShadows = true;
    m.isPickable = false;
    m.freezeWorldMatrix();
    meshes.push(m);
  }
  return meshes;
}

export function createWorld(engine: Engine, canvas: HTMLCanvasElement, map: MapDef, quality: Quality, camera: import("@babylonjs/core").Camera | null, sceneIn?: Scene): WorldView {
  void canvas;
  const scene = sceneIn ?? new Scene(engine);
  scene.clearColor = new Color4(SKY_HORIZON.r, SKY_HORIZON.g, SKY_HORIZON.b, 1);
  scene.ambientColor = new Color3(0.35, 0.38, 0.42);
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.0052;
  scene.fogColor = FOG_COLOR;
  scene.skipPointerMovePicking = true;
  scene.autoClear = true;

  const hemi = new HemisphericLight("hemi", new Vector3(0.2, 1, -0.1), scene);
  hemi.intensity = 0.8;
  hemi.diffuse = new Color3(0.86, 0.92, 1.0);
  hemi.groundColor = new Color3(0.56, 0.54, 0.5);
  hemi.specular = new Color3(0.1, 0.1, 0.1);
  const sun = new DirectionalLight("sun", SUN_DIR.clone(), scene);
  sun.position = SUN_DIR.scale(-120);
  sun.intensity = 1.25;
  sun.diffuse = new Color3(1.0, 0.95, 0.86);
  sun.specular = new Color3(0.7, 0.66, 0.6);

  let shadow: CascadedShadowGenerator | ShadowGenerator | null = null;
  if (quality !== "low" && camera) {
    const csm = new CascadedShadowGenerator(quality === "high" ? 2048 : 1024, sun, false, camera);
    csm.numCascades = quality === "high" ? 4 : 3;
    csm.lambda = 0.85;
    csm.shadowMaxZ = 90;
    csm.stabilizeCascades = true;
    csm.usePercentageCloserFiltering = true;
    csm.filteringQuality = quality === "high" ? ShadowGenerator.QUALITY_MEDIUM : ShadowGenerator.QUALITY_LOW;
    csm.darkness = 0.5;
    csm.bias = 0.004;
    csm.normalBias = 0.02;
    csm.autoCalcDepthBounds = false;
    csm.depthClamp = true;
    shadow = csm;
  }

  // ---- materials
  const mats = new Map<string, StandardMaterial>();
  for (const [key, spec] of Object.entries(MAT)) {
    const m = new StandardMaterial(`m_${key}`, scene);
    m.diffuseTexture = procTexture(scene, spec.tex, 256);
    if (spec.bump && quality !== "low") { m.bumpTexture = procTexture(scene, spec.tex, 256, { normal: spec.bump }); m.bumpTexture.level = 0.6; }
    m.specularColor = new Color3(spec.spec, spec.spec, spec.spec);
    m.specularPower = 48;
    if (spec.emissive) m.emissiveColor = hexColor(spec.emissive);
    m.ambientColor = new Color3(0.25, 0.25, 0.25);
    mats.set(key, m);
  }
  const rng = new Rng(17);
  const envMeshes = buildBoxGroups(scene, map.boxes, mats, rng);

  // cylinders (pipes, tanks)
  const cylGroups = new Map<string, Mesh[]>();
  for (const b of map.boxes) {
    if (!b.shape || b.shape === "box" || b.noRender) continue;
    const sx = b.max.x - b.min.x, sy = b.max.y - b.min.y, sz = b.max.z - b.min.z;
    let m: Mesh;
    if (b.shape === "cylY") { m = MeshBuilder.CreateCylinder("cyl", { height: sy, diameter: Math.min(sx, sz), tessellation: 20 }, scene); }
    else if (b.shape === "cylX") { m = MeshBuilder.CreateCylinder("cyl", { height: sx, diameter: Math.min(sy, sz), tessellation: 14 }, scene); m.rotation.z = Math.PI / 2; }
    else { m = MeshBuilder.CreateCylinder("cyl", { height: sz, diameter: Math.min(sx, sy), tessellation: 14 }, scene); m.rotation.x = Math.PI / 2; }
    m.position.set((b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2, (b.min.z + b.max.z) / 2);
    const key = b.mat;
    if (!cylGroups.has(key)) cylGroups.set(key, []);
    cylGroups.get(key)!.push(m);
    // tank details: hazard band + top cap
    if (b.shape === "cylY") {
      const band = MeshBuilder.CreateCylinder("band", { height: 0.4, diameter: Math.min(sx, sz) + 0.06, tessellation: 20 }, scene);
      band.position.set(m.position.x, b.min.y + sy * 0.7, m.position.z);
      if (!cylGroups.has("orange")) cylGroups.set("orange", []);
      cylGroups.get("orange")!.push(band);
    }
  }
  for (const [key, list] of cylGroups) {
    const merged = Mesh.MergeMeshes(list, true, true);
    if (merged) { merged.material = mats.get(key) ?? mats.get("metal")!; merged.receiveShadows = true; merged.isPickable = false; envMeshes.push(merged); }
  }

  // glass
  const glassMat = new StandardMaterial("m_glass", scene);
  glassMat.diffuseColor = new Color3(0.55, 0.78, 0.85);
  glassMat.alpha = 0.22;
  glassMat.specularColor = new Color3(0.9, 0.9, 0.9);
  glassMat.specularPower = 128;
  glassMat.backFaceCulling = false;
  const glass = new Map<number, Mesh>();
  for (const b of map.boxes) {
    if (b.mat !== "glass") continue;
    const m = MeshBuilder.CreateBox(`glass_${b.id}`, { width: b.max.x - b.min.x, height: b.max.y - b.min.y, depth: b.max.z - b.min.z }, scene);
    m.position.set((b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2, (b.min.z + b.max.z) / 2);
    m.material = glassMat; m.isPickable = false;
    glass.set(b.id, m);
  }

  // ---- cliffs (visual ring down to the ocean)
  const cliffList: Mesh[] = [];
  const crng = new Rng(99);
  const addRock = (x0: number, x1: number, z0: number, z1: number, top: number) => {
    const m = MeshBuilder.CreateBox("cliff", { width: x1 - x0, height: top + 9, depth: z1 - z0 }, scene);
    m.position.set((x0 + x1) / 2, (top - 9) / 2, (z0 + z1) / 2);
    m.rotation.y = crng.range(-0.08, 0.08);
    cliffList.push(m);
  };
  for (let x = -62; x < 62; x += 6) {
    addRock(x, x + crng.range(5, 8), -52 - crng.range(0, 3), -47.4, crng.range(-1.5, 0.2));
    addRock(x, x + crng.range(5, 8), 47.4, 52 + crng.range(0, 3), crng.range(1.0, 3.0));
  }
  for (let z = -50; z < 50; z += 6) {
    const top = z > 20 ? 2.2 : -0.6;
    addRock(-62 - crng.range(0, 3), -57.4, z, z + crng.range(5, 8), top + crng.range(-1, 0.5));
    addRock(57.4, 62 + crng.range(0, 3), z, z + crng.range(5, 8), top + crng.range(-1, 0.5));
  }
  const cliffs = Mesh.MergeMeshes(cliffList, true, true)!;
  const rockMat = mats.get("rock")!;
  cliffs.material = rockMat;
  cliffs.isPickable = false;
  // sea-level beach shelf
  const shelf = MeshBuilder.CreateGround("shelf", { width: 150, height: 130 }, scene);
  shelf.position.y = -5.6;
  const shelfMat = new StandardMaterial("shelf", scene);
  shelfMat.diffuseTexture = procTexture(scene, "sand", 256);
  (shelfMat.diffuseTexture as Texture).uScale = 20; (shelfMat.diffuseTexture as Texture).vScale = 20;
  shelfMat.specularColor = Color3.Black();
  shelf.material = shelfMat;

  // ---- sky dome with vertical gradient
  const sky = MeshBuilder.CreateSphere("sky", { diameter: 900, segments: 24, sideOrientation: Mesh.BACKSIDE }, scene);
  const pos = sky.getVerticesData("position")!;
  const cols: number[] = [];
  for (let i = 0; i < pos.length; i += 3) {
    const y = pos[i + 1] / 450;
    const t = Math.max(0, Math.min(1, Math.pow(Math.max(y, 0), 0.55)));
    const c = Color3.Lerp(SKY_HORIZON, SKY_TOP, t);
    const below = y < 0 ? Math.min(1, -y * 4) : 0;
    const cc = Color3.Lerp(c, FOG_COLOR, below);
    cols.push(cc.r, cc.g, cc.b, 1);
  }
  sky.setVerticesData("color", cols);
  const skyMat = new StandardMaterial("skyMat", scene);
  skyMat.disableLighting = true; skyMat.emissiveColor = Color3.White(); skyMat.diffuseColor = Color3.Black(); skyMat.specularColor = Color3.Black();
  skyMat.fogEnabled = false; skyMat.backFaceCulling = false;
  sky.material = skyMat; sky.infiniteDistance = true; sky.isPickable = false;
  sky.useVertexColors = true;
  // sun disc + clouds
  const sunDisc = MeshBuilder.CreatePlane("sunDisc", { size: 70 }, scene);
  sunDisc.position = SUN_DIR.scale(-400);
  sunDisc.billboardMode = Mesh.BILLBOARDMODE_ALL;
  const sunMat = new StandardMaterial("sunMat", scene);
  sunMat.disableLighting = true; sunMat.emissiveColor = new Color3(1, 0.97, 0.88); sunMat.opacityTexture = procTexture(scene, "flare", 256, { alpha: true });
  sunMat.fogEnabled = false; sunMat.alphaMode = Engine.ALPHA_ADD;
  sunDisc.material = sunMat; sunDisc.infiniteDistance = true;
  const cloudMat = new StandardMaterial("cloudMat", scene);
  cloudMat.disableLighting = true; cloudMat.emissiveColor = new Color3(0.98, 0.99, 1); cloudMat.opacityTexture = procTexture(scene, "smoke", 256, { alpha: true, seed: 5 });
  cloudMat.fogEnabled = false; cloudMat.alpha = 0.75;
  const crn = new Rng(3);
  for (let i = 0; i < 16; i++) {
    const a = crn.range(0, Math.PI * 2), d = crn.range(250, 380);
    const c = MeshBuilder.CreatePlane("cloud", { width: crn.range(90, 170), height: crn.range(25, 45) }, scene);
    c.position.set(Math.cos(a) * d, crn.range(25, 70), Math.sin(a) * d);
    c.billboardMode = Mesh.BILLBOARDMODE_Y;
    c.material = cloudMat; c.isPickable = false;
  }

  // ---- ocean
  const ocean = MeshBuilder.CreateGround("ocean", { width: 1400, height: 1400, subdivisions: 140 }, scene);
  ocean.position.y = -5.2;
  const oceanMat = new ShaderMaterial("oceanMat", scene, { vertex: "ocean", fragment: "ocean" }, {
    attributes: ["position"], uniforms: ["world", "worldViewProjection", "time", "cameraPosition", "sunDir", "fogColor", "fogDensity"],
  });
  oceanMat.setVector3("sunDir", SUN_DIR);
  oceanMat.setColor3("fogColor", FOG_COLOR);
  oceanMat.setFloat("fogDensity", 0.0036);
  oceanMat.backFaceCulling = false;
  ocean.material = oceanMat; ocean.isPickable = false;

  // ---- decor
  const beacons: Mesh[] = [];
  const flags: Mesh[] = [];
  const decorMeshes: Mesh[] = [];
  const emissiveMat = (name: string, c: Color3) => { const m = new StandardMaterial(name, scene); m.emissiveColor = c; m.diffuseColor = Color3.Black(); m.specularColor = Color3.Black(); m.disableLighting = true; return m; };
  const lightMat = emissiveMat("lightPanel", new Color3(0.95, 0.98, 1.0));
  const beaconMat = emissiveMat("beacon", new Color3(1, 0.15, 0.1));
  const cyanGlow = emissiveMat("cyanGlow", new Color3(0.2, 0.85, 0.95));
  const dishMat = new StandardMaterial("dishMat", scene);
  dishMat.diffuseColor = new Color3(0.9, 0.91, 0.9); dishMat.specularColor = new Color3(0.4, 0.4, 0.4); dishMat.backFaceCulling = false;
  const black = new StandardMaterial("tireMat", scene); black.diffuseColor = new Color3(0.08, 0.08, 0.09); black.specularColor = new Color3(0.1, 0.1, 0.1);
  const metalMat = mats.get("metal")!;
  for (const d of map.decor) buildDecor(d);
  function buildDecor(d: Decor) {
    switch (d.kind) {
      case "dish": case "smallDish": {
        const s = d.size ?? (d.kind === "dish" ? 4.2 : 1.6);
        const root = new TransformNode("dishRoot", scene);
        root.position.set(d.pos.x, d.pos.y, d.pos.z);
        root.rotation.y = d.rot ?? 0.5;
        const bowl = MeshBuilder.CreateSphere("dish", { diameter: s * 2, slice: 0.32, segments: 24, sideOrientation: Mesh.DOUBLESIDE }, scene);
        bowl.parent = root; bowl.rotation.x = Math.PI * 0.72; bowl.position.y = s * 0.45; bowl.material = dishMat;
        const arm = MeshBuilder.CreateCylinder("feed", { height: s * 1.1, diameter: s * 0.05 }, scene);
        arm.parent = bowl; arm.position.y = -s * 0.25; arm.material = metalMat;
        const rx = MeshBuilder.CreateSphere("rx", { diameter: s * 0.16 }, scene);
        rx.parent = bowl; rx.position.y = -s * 0.8; rx.material = cyanGlow;
        const yoke = MeshBuilder.CreateBox("yoke", { width: s * 0.25, height: s * 0.6, depth: s * 0.25 }, scene);
        yoke.parent = root; yoke.position.y = s * 0.2; yoke.material = metalMat;
        for (const m of [bowl, arm, yoke]) { decorMeshes.push(m); }
        break;
      }
      case "mast": {
        const h = d.size ?? 9;
        const parts: Mesh[] = [];
        for (const [ox, oz] of [[-0.35, -0.35], [0.35, -0.35], [0.35, 0.35], [-0.35, 0.35]]) {
          const leg = MeshBuilder.CreateCylinder("leg", { height: h, diameterTop: 0.05, diameterBottom: 0.09, tessellation: 6 }, scene);
          leg.position.set(d.pos.x + ox * (1 - 0.3), d.pos.y + h / 2, d.pos.z + oz * 0.7);
          parts.push(leg);
        }
        for (let y = 1; y < h; y += 1.4) {
          const ring = MeshBuilder.CreateBox("rung", { width: 0.55, height: 0.04, depth: 0.55 }, scene);
          ring.position.set(d.pos.x, d.pos.y + y, d.pos.z);
          parts.push(ring);
        }
        const ant = MeshBuilder.CreateCylinder("ant", { height: 2.5, diameter: 0.05 }, scene);
        ant.position.set(d.pos.x, d.pos.y + h + 1.2, d.pos.z); parts.push(ant);
        const merged = Mesh.MergeMeshes(parts, true, true)!;
        merged.material = metalMat; decorMeshes.push(merged);
        const b = MeshBuilder.CreateSphere("beacon", { diameter: 0.25 }, scene);
        b.position.set(d.pos.x, d.pos.y + h + 2.5, d.pos.z); b.material = beaconMat; beacons.push(b);
        const pan = MeshBuilder.CreateBox("panel", { width: 0.9, height: 1.4, depth: 0.12 }, scene);
        pan.position.set(d.pos.x, d.pos.y + h - 1.2, d.pos.z + 0.4); pan.material = dishMat; decorMeshes.push(pan);
        break;
      }
      case "sign": {
        const s = d.size ?? 1;
        const tex = textTexture(scene, d.text ?? "", d.color ?? "#2ec4d6");
        const m = MeshBuilder.CreatePlane("sign", { width: 3.2 * s, height: 0.6 * s }, scene);
        m.position.set(d.pos.x, d.pos.y, d.pos.z);
        m.rotation.y = (d.rot ?? 0) + Math.PI;
        const sm = new StandardMaterial("signMat", scene);
        sm.diffuseTexture = tex; sm.emissiveTexture = tex; sm.emissiveColor = new Color3(0.45, 0.45, 0.45); sm.specularColor = Color3.Black();
        m.material = sm; m.isPickable = false;
        break;
      }
      case "lightPanel": {
        const m = MeshBuilder.CreatePlane("lp", { width: 1.6, height: 0.35 }, scene);
        m.position.set(d.pos.x, d.pos.y - 0.01, d.pos.z);
        m.rotation.x = -Math.PI / 2;
        m.material = lightMat; m.isPickable = false;
        break;
      }
      case "lightBox": {
        const m = MeshBuilder.CreateBox("lb", { width: 1.4, height: 0.1, depth: 0.1 }, scene);
        m.position.set(d.pos.x, d.pos.y, d.pos.z); m.material = lightMat; m.isPickable = false;
        break;
      }
      case "beacon": {
        const b = MeshBuilder.CreateSphere("beacon", { diameter: 0.3 }, scene);
        b.position.set(d.pos.x, d.pos.y + 0.15, d.pos.z); b.material = beaconMat; beacons.push(b);
        break;
      }
      case "steam": {
        if (quality === "low") break;
        const ps = new ParticleSystem("steam", 120, scene);
        ps.particleTexture = procTexture(scene, "smoke", 128, { alpha: true, seed: 11 });
        ps.emitter = new Vector3(d.pos.x, d.pos.y + 0.3, d.pos.z);
        ps.minEmitBox = new Vector3(-0.3, 0, -0.3); ps.maxEmitBox = new Vector3(0.3, 0, 0.3);
        ps.color1 = new Color4(0.95, 0.96, 0.97, 0.35); ps.color2 = new Color4(0.85, 0.88, 0.9, 0.25); ps.colorDead = new Color4(0.9, 0.9, 0.9, 0);
        ps.minSize = 0.8; ps.maxSize = 2.2; ps.minLifeTime = 1.5; ps.maxLifeTime = 3; ps.emitRate = 22;
        ps.direction1 = new Vector3(-0.3, 1.5, -0.3); ps.direction2 = new Vector3(0.3, 2.5, 0.3); ps.gravity = new Vector3(0.4, 0.2, 0);
        ps.minEmitPower = 0.6; ps.maxEmitPower = 1.2; ps.blendMode = ParticleSystem.BLENDMODE_STANDARD;
        ps.start();
        break;
      }
      case "tire": {
        const t = MeshBuilder.CreateCylinder("tire", { height: 0.4, diameter: 0.9, tessellation: 14 }, scene);
        t.position.set(d.pos.x, d.pos.y, d.pos.z); t.rotation.x = Math.PI / 2; t.material = black; decorMeshes.push(t);
        break;
      }
      case "flag": {
        const pole = MeshBuilder.CreateCylinder("pole", { height: 7, diameter: 0.1 }, scene);
        pole.position.set(d.pos.x, d.pos.y + 3.5, d.pos.z); pole.material = metalMat; decorMeshes.push(pole);
        const f = MeshBuilder.CreatePlane("flag", { width: 2.2, height: 1.3, sideOrientation: Mesh.DOUBLESIDE }, scene);
        const fm = new StandardMaterial("flagMat", scene); fm.diffuseColor = hexColor(d.color ?? "#ffffff"); fm.emissiveColor = hexColor(d.color ?? "#ffffff").scale(0.25); fm.backFaceCulling = false;
        f.material = fm; f.position.set(d.pos.x, d.pos.y + 6.2, d.pos.z + 1.15); f.rotation.y = Math.PI / 2;
        flags.push(f);
        break;
      }
    }
  }
  for (const m of decorMeshes) m.receiveShadows = true;

  const casters: AbstractMesh[] = [...envMeshes, ...decorMeshes];
  if (shadow) for (const m of casters) shadow.addShadowCaster(m, false);

  // ---- post-processing per quality tier
  let pipeline: DefaultRenderingPipeline | null = null;
  if (camera) {
    pipeline = new DefaultRenderingPipeline("pipe", true, scene, [camera]);
    pipeline.samples = quality === "high" ? 4 : 1;
    pipeline.fxaaEnabled = quality !== "high";
    pipeline.bloomEnabled = quality !== "low";
    pipeline.bloomThreshold = 0.82; pipeline.bloomWeight = 0.22; pipeline.bloomKernel = 48; pipeline.bloomScale = 0.5;
    pipeline.imageProcessingEnabled = true;
    const ip = pipeline.imageProcessing;
    ip.toneMappingEnabled = true;
    ip.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
    ip.exposure = 1.15;
    ip.contrast = 1.12;
    ip.vignetteEnabled = true; ip.vignetteWeight = 1.6; ip.vignetteStretch = 0.2; ip.vignetteColor = new Color4(0, 0, 0, 0);
    ip.colorCurvesEnabled = true;
    pipeline.sharpenEnabled = quality === "high";
    if (pipeline.sharpenEnabled) pipeline.sharpen.edgeAmount = 0.2;
  }

  return {
    scene, sun, hemi, shadow, pipeline, glass, beacons, flags, oceanMat,
    addCaster(m) { if (shadow) shadow.addShadowCaster(m, true); },
    update(t: number) {
      oceanMat.setFloat("time", t);
      const cam = scene.activeCamera;
      if (cam) oceanMat.setVector3("cameraPosition", cam.globalPosition);
      const on = Math.sin(t * 3) > 0.2;
      for (const b of beacons) b.isVisible = on;
      for (let i = 0; i < flags.length; i++) flags[i].rotation.y = Math.PI / 2 + Math.sin(t * 1.7 + i) * 0.15;
    },
    dispose() { scene.dispose(); },
  };
}

export function setMaterialFreeze(scene: Scene) {
  for (const m of scene.materials) if (m instanceof StandardMaterial && !m.name.startsWith("char") && !m.name.startsWith("vm")) { /* keep dynamic */ void (m as Material); }
}
