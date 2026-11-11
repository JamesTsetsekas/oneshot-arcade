import { TargetCamera } from '@babylonjs/core/Cameras/targetCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { ShadowGenerator } from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Matrix, Quaternion, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreatePolyhedron } from '@babylonjs/core/Meshes/Builders/polyhedronBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import '@babylonjs/core/Meshes/thinInstanceMesh';
import { DefaultRenderingPipeline } from '@babylonjs/core/PostProcesses/RenderPipeline/Pipelines/defaultRenderingPipeline';
import '@babylonjs/core/PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent';
import { Scene } from '@babylonjs/core/scene';
import { clamp, type Vec } from '../core/math';
import { CELL, type Zone } from '../entity-combat/types';
import { WALL, isLowWall } from '../navigation-ai/grid';
import { clearModelCache, makeMats, type Mats } from './models';

export interface GfxSettings { quality: 'low' | 'medium' | 'high'; shake: boolean; reducedMotion: boolean; particles: number }
export interface LightSrc { x: number; y: number; h: number; color: Color3; intensity: number; range: number; flicker?: boolean }
const hash2 = (x: number, y: number, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const PITCH = (38 * Math.PI) / 180, YAW = Math.PI / 4;
/** Smooth value noise (bilinear, smoothstepped) so painted ground has drifts instead of a per-cell checkerboard. */
const sn = (x: number, y: number, s: number) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy); const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s); return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy; };

/** Scene, camera, lighting and static zone geometry. Dynamic views (actors, VFX) live in dynamic.ts. */
export class Renderer {
  engine: Engine; scene: Scene; camera: TargetCamera; mats: Mats;
  hemi: HemisphericLight; moon: DirectionalLight; shadow: ShadowGenerator | null = null; pipeline: DefaultRenderingPipeline | null = null;
  lightPool: PointLight[] = []; statics: LightSrc[] = []; flashes: (LightSrc & { t: number; dur: number })[] = [];
  zoneNodes: { dispose(): void }[] = []; zone: Zone | null = null;
  target = new Vector3(); zoom = 20; zoomGoal = 20; shakeAmt = 0; shakeOff = new Vector3(); time = 0;
  settings: GfxSettings; camRot = Matrix.Identity();
  private tmpV = new Vector3();

  constructor(public canvas: HTMLCanvasElement, settings: GfxSettings) {
    this.settings = settings;
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: false, powerPreference: 'high-performance' });
    const scene = (this.scene = new Scene(this.engine));
    scene.clearColor = new Color4(0.02, 0.022, 0.03, 1);
    scene.ambientColor = new Color3(0.3, 0.3, 0.35);
    scene.fogMode = Scene.FOGMODE_EXP2; scene.fogDensity = 0.011; scene.fogColor = new Color3(0.035, 0.04, 0.055);
    scene.skipPointerMovePicking = true; scene.autoClear = true;
    this.camera = new TargetCamera('cam', new Vector3(0, 10, -10), scene);
    this.camera.fov = (42 * Math.PI) / 180; this.camera.minZ = 1; this.camera.maxZ = 140;
    this.hemi = new HemisphericLight('hemi', new Vector3(0.2, 1, -0.1), scene);
    this.hemi.diffuse = new Color3(0.62, 0.68, 0.86); this.hemi.groundColor = new Color3(0.2, 0.17, 0.16); this.hemi.specular = Color3.Black();
    this.moon = new DirectionalLight('moon', new Vector3(0.45, -1, 0.7).normalize(), scene);
    this.moon.diffuse = new Color3(0.75, 0.82, 1); this.moon.specular = new Color3(0.3, 0.32, 0.4);
    for (let i = 0; i < 6; i++) { const l = new PointLight('pl' + i, new Vector3(0, -50, 0), scene); l.intensity = 0; l.range = 12; l.specular = new Color3(0.2, 0.15, 0.1); this.lightPool.push(l); }
    this.mats = makeMats(scene);
    this.applyQuality();
  }
  applyQuality(): void {
    const q = this.settings.quality, scene = this.scene;
    this.engine.setHardwareScalingLevel(q === 'low' ? 1.5 : 1);
    this.shadow?.dispose(); this.shadow = null;
    if (q !== 'low') {
      const sg = (this.shadow = new ShadowGenerator(q === 'high' ? 2048 : 1024, this.moon));
      sg.usePoissonSampling = true; sg.bias = 0.0012; sg.normalBias = 0.02; sg.darkness = 0.12;
      this.moon.autoUpdateExtends = false; this.moon.shadowMinZ = 1; this.moon.shadowMaxZ = 90;
      this.moon.shadowFrustumSize = 58;
    }
    this.pipeline?.dispose(); this.pipeline = null;
    if (q !== 'low') {
      try {
        const pl = (this.pipeline = new DefaultRenderingPipeline('pipe', false, scene, [this.camera]));
        pl.bloomEnabled = true; pl.bloomThreshold = 0.62; pl.bloomWeight = q === 'high' ? 0.55 : 0.45; pl.bloomKernel = 56; pl.bloomScale = 0.5;
        pl.fxaaEnabled = true;
        pl.imageProcessingEnabled = true;
        pl.imageProcessing.contrast = 1.18; pl.imageProcessing.exposure = 1.12;
        pl.imageProcessing.vignetteEnabled = true; pl.imageProcessing.vignetteWeight = 2.6; pl.imageProcessing.vignetteColor = new Color4(0.01, 0.01, 0.03, 0);
        pl.imageProcessing.vignetteStretch = 0.2;
      } catch { this.pipeline = null; }
    }
  }
  castShadow(m: Mesh | import('@babylonjs/core/Meshes/abstractMesh').AbstractMesh): void { this.shadow?.addShadowCaster(m, false); }
  uncast(m: import('@babylonjs/core/Meshes/abstractMesh').AbstractMesh): void { this.shadow?.removeShadowCaster(m, false); }

  // ─────────────── static zone geometry ───────────────
  setZone(zone: Zone): void {
    for (const n of this.zoneNodes) n.dispose();
    this.zoneNodes = []; this.statics = []; this.zone = zone;
    const scene = this.scene, W = zone.w, H = zone.h, crypt = zone.kind === 'crypt', town = zone.kind === 'town';
    const open = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && zone.cells[y * W + x] !== WALL;
    const isWall = (x: number, y: number) => !open(x, y);
    // Ground: one quad with a procedurally painted texture (flagstones, ash drifts, contact shading).
    const px = Math.min(40, Math.floor(2048 / Math.max(W, H)));
    const tex = new DynamicTexture('ground', { width: W * px, height: H * px }, scene, true);
    const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
    ctx.save(); ctx.translate(0, H * px); ctx.scale(1, -1);
    ctx.fillStyle = crypt ? '#0d0c0c' : '#151312'; ctx.fillRect(0, 0, W * px, H * px);
    const base = crypt ? [112, 106, 96] : town ? [104, 88, 68] : [88, 80, 73];
    for (let cy = 0; cy < H; cy++) for (let cx = 0; cx < W; cx++) {
      if (isWall(cx, cy)) { if (!crypt) { const m = 0.8 + 0.4 * sn(cx / 2.3, cy / 2.3, zone.seed + 4); ctx.fillStyle = `rgb(${52 * m | 0},${47 * m | 0},${43 * m | 0})`; ctx.fillRect(cx * px, cy * px, px + 1, px + 1); } continue; }
      const n = hash2(cx, cy, zone.seed), n2 = hash2(cx >> 2, cy >> 2, zone.seed + 9);
      const k = 0.78 + n * 0.2 + n2 * 0.18;
      if (crypt) {
        for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
          const m = k * (0.9 + hash2(cx * 2 + i, cy * 2 + j, 3) * 0.2);
          ctx.fillStyle = `rgb(${base[0] * m | 0},${base[1] * m | 0},${base[2] * m | 0})`;
          ctx.fillRect(cx * px + i * px / 2 + 1, cy * px + j * px / 2 + 1, px / 2 - 1.5, px / 2 - 1.5);
        }
      } else {
        const q4 = px / 4;
        for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
          const wx = cx + i / 4, wy = cy + j / 4;
          const m = 0.72 + 0.3 * sn(wx / 3.3, wy / 3.3, zone.seed) + 0.16 * sn(wx / 0.9, wy / 0.9, zone.seed + 2) + 0.07 * hash2(cx * 4 + i, cy * 4 + j, 5);
          const warm = sn(wx / 5.1, wy / 5.1, zone.seed + 3) * 0.12;
          ctx.fillStyle = `rgb(${base[0] * m * (1 + warm) | 0},${base[1] * m | 0},${base[2] * m * (1 - warm) | 0})`;
          ctx.fillRect(cx * px + i * q4, cy * px + j * q4, q4 + 0.6, q4 + 0.6);
        }
      }
    }
    // Drifts, scorch marks and cracks to break the grid.
    const blots = W * H * (crypt ? 0.5 : 1.3);
    for (let i = 0; i < blots; i++) {
      const x = hash2(i, 1, zone.seed) * W * px, y = hash2(i, 2, zone.seed) * H * px, r = (0.3 + hash2(i, 3, zone.seed) * 1.3) * px, t = hash2(i, 4, zone.seed);
      if (isWall(Math.floor(x / px), Math.floor(y / px))) continue;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const col = crypt ? (t < 0.6 ? '20,18,18' : '150,140,125') : t < 0.45 ? '24,20,18' : t < 0.9 ? '168,160,150' : '120,50,28';
      g.addColorStop(0, `rgba(${col},${crypt ? 0.22 : 0.3})`); g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // Contact shading where floor meets walls.
    for (let cy = 0; cy < H; cy++) for (let cx = 0; cx < W; cx++) {
      if (isWall(cx, cy)) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (!isWall(cx + dx, cy + dy)) continue;
        const x0 = cx * px + (dx > 0 ? px : 0), y0 = cy * px + (dy > 0 ? px : 0), d = px * 0.55;
        const g = ctx.createLinearGradient(x0, y0, x0 - dx * d, y0 - dy * d);
        g.addColorStop(0, 'rgba(0,0,0,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(cx * px, cy * px, px, px);
      }
    }
    ctx.restore(); tex.update();
    tex.anisotropicFilteringLevel = 4;
    const gm = new StandardMaterial('groundM', scene);
    gm.diffuseTexture = tex; gm.specularColor = new Color3(0.05, 0.05, 0.06); gm.maxSimultaneousLights = 8; gm.backFaceCulling = false;
    const ground = new Mesh('ground', scene);
    const vd = new VertexData();
    vd.positions = [0, 0, 0, W * CELL, 0, 0, W * CELL, 0, H * CELL, 0, 0, H * CELL];
    vd.normals = [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]; vd.uvs = [0, 0, 1, 0, 1, 1, 0, 1]; vd.indices = [0, 2, 1, 0, 3, 2];
    vd.applyToMesh(ground);
    ground.material = gm; ground.receiveShadows = true; ground.isPickable = false;
    this.zoneNodes.push(ground, gm, tex);
    // A large dark apron hides the void beyond the map edge.
    const apron = CreateBox('apron', { width: W * CELL + 300, height: 0.1, depth: H * CELL + 300 }, scene);
    apron.position.set(W, -0.12, H);
    const am = new StandardMaterial('apronM', scene); am.diffuseColor = new Color3(0.03, 0.03, 0.035); am.specularColor = Color3.Black();
    apron.material = am; apron.isPickable = false;
    this.zoneNodes.push(apron, am);

    // Walls. Cells that would hide floor behind them (relative to the fixed camera) are cut low.
    const wallM = new StandardMaterial('wallM', scene);
    wallM.specularColor = new Color3(0.04, 0.04, 0.05); wallM.maxSimultaneousLights = 8;
    const mats: number[] = [], cols: number[] = [], treeM: number[] = [], capM: number[] = [], capC: number[] = [];
    const tmp = new Matrix(), q = new Quaternion();
    const push = (arr: number[], sx: number, sy: number, sz: number, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) => {
      Quaternion.RotationYawPitchRollToRef(ry, rx, rz, q);
      Matrix.ComposeToRef(new Vector3(sx, sy, sz), q, new Vector3(x, y, z), tmp);
      for (let i = 0; i < 16; i++) arr.push(tmp.m[i]);
    };
    for (let cy = 0; cy < H; cy++) for (let cx = 0; cx < W; cx++) {
      if (!isWall(cx, cy)) continue;
      const reach = crypt || town ? [-1, 0, 1] : [-2, -1, 0, 1, 2];
      const near = reach.some((dx) => reach.some((dy) => open(cx + dx, cy + dy)));
      if (!near) continue;
      const low = isLowWall(zone, cx, cy);
      const n = hash2(cx, cy, zone.seed + 5), n2 = hash2(cy, cx, zone.seed + 6);
      const wx = cx * CELL + 1, wz = cy * CELL + 1;
      if (crypt || town) {
        const h = low ? 0.9 + n * 0.25 : (town ? 2.3 : 2.9) + n * 0.4;
        push(mats, CELL, h, CELL, wx, h / 2, wz);
        const c = town ? [0.34 + n * 0.06, 0.26 + n * 0.05, 0.18 + n * 0.04] : [0.42 + n * 0.08, 0.4 + n * 0.07, 0.37 + n * 0.06];
        cols.push(c[0], c[1], c[2], 1);
        push(capM, CELL + 0.12, 0.14, CELL + 0.12, wx, h + 0.02, wz);
        capC.push(c[0] * 0.75, c[1] * 0.75, c[2] * 0.75, 1);
      } else {
        const count = low ? 1 : 2;
        for (let i = 0; i < count; i++) {
          const s = low ? 0.75 + n * 0.35 : 1.2 + hash2(cx + i, cy, 7) * 0.9;
          const ox = (hash2(cx, cy + i, 8) - 0.5) * 0.9, oz = (hash2(cx + i, cy, 9) - 0.5) * 0.9;
          push(mats, s * 1.25, s * (low ? 0.75 : 1.25), s * 1.2, wx + ox, s * (low ? 0.2 : 0.42), wz + oz, n * 6, n2 * 6, i);
          const g = 0.3 + hash2(cx, cy, 10 + i) * 0.14;
          cols.push(g * 1.08, g, g * 0.94, 1);
        }
        if (!low && n2 < 0.3) push(treeM, 1 + n * 0.5, 1 + n2 * 1.6, 1 + n * 0.5, wx, 0, wz, 0, n * 6, 0);
      }
    }
    const inst = (m: Mesh, arr: number[], colors?: number[]) => {
      if (!arr.length) { m.dispose(); return; }
      m.thinInstanceSetBuffer('matrix', new Float32Array(arr), 16, true);
      if (colors) m.thinInstanceSetBuffer('color', new Float32Array(colors), 4, true);
      m.receiveShadows = true; m.isPickable = false; m.alwaysSelectAsActiveMesh = true;
      this.castShadow(m);
      this.zoneNodes.push(m);
    };
    if (crypt || town) {
      const box = CreateBox('wall', { size: 1 }, scene); box.material = wallM;
      if (crypt) {
        const bt = new DynamicTexture('brick', { width: 128, height: 128 }, scene, true);
        const b = bt.getContext() as unknown as CanvasRenderingContext2D;
        b.fillStyle = '#d8d4cc'; b.fillRect(0, 0, 128, 128);
        for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) { const v = 200 + hash2(r, c, 4) * 55; b.fillStyle = `rgb(${v | 0},${v * 0.98 | 0},${v * 0.95 | 0})`; b.fillRect(c * 64 + (r % 2) * 32 - 32 + 2, r * 32 + 2, 60, 28); b.fillRect(c * 64 + (r % 2) * 32 + 96 + 2, r * 32 + 2, 60, 28); }
        bt.update(); wallM.diffuseTexture = bt; this.zoneNodes.push(bt);
      }
      inst(box, mats, cols);
      const cap = CreateBox('cap', { size: 1 }, scene); cap.material = wallM; inst(cap, capM, capC);
    } else {
      const rock = CreatePolyhedron('rock', { type: 2, size: 0.62 }, scene); rock.material = wallM; inst(rock, mats, cols);
      const trunk = CreateCylinder('t', { height: 3.6, diameterBottom: 0.4, diameterTop: 0.1, tessellation: 6 }, scene); trunk.position.y = 1.8;
      const b1 = CreateCylinder('b', { height: 1.5, diameterBottom: 0.14, diameterTop: 0.03, tessellation: 5 }, scene); b1.position.set(0.45, 2.6, 0); b1.rotation.z = -0.9;
      const b2 = CreateCylinder('b', { height: 1.2, diameterBottom: 0.12, diameterTop: 0.03, tessellation: 5 }, scene); b2.position.set(-0.3, 3.0, 0.25); b2.rotation.set(0.5, 0, 0.8);
      const tree = Mesh.MergeMeshes([trunk, b1, b2], true)!;
      const tm = new StandardMaterial('treeM', scene); tm.diffuseColor = new Color3(0.13, 0.11, 0.1); tm.specularColor = Color3.Black();
      tree.material = tm; this.zoneNodes.push(tm);
      inst(tree, treeM);
    }
    this.zoneNodes.push(wallM);
    // Mood per zone kind.
    this.hemi.intensity = crypt ? 0.62 : town ? 0.8 : 0.72;
    this.moon.intensity = crypt ? 0.75 : town ? 1.05 : 1.15;
    this.hemi.diffuse = crypt ? new Color3(0.56, 0.6, 0.78) : new Color3(0.62, 0.68, 0.86);
    this.scene.fogDensity = crypt ? 0.014 : 0.011;
    this.scene.fogColor = crypt ? new Color3(0.03, 0.03, 0.05) : new Color3(0.05, 0.05, 0.065);
    this.scene.clearColor = new Color4(this.scene.fogColor.r, this.scene.fogColor.g, this.scene.fogColor.b, 1);
  }
  // ─────────────── camera ───────────────
  /** Fixed-angle follow camera: 38° pitch, 45° yaw, eased zoom, soft lag, capped anticipation, layered capped shake. */
  updateCamera(px: number, py: number, vx: number, vy: number, dt: number, bias?: Vec, minZoom = 13): void {
    const sp = Math.hypot(vx, vy);
    let tx = px, tz = py;
    if (sp > 0.1) { const k = Math.min(1.2, sp * 0.26) / sp; tx += vx * k; tz += vy * k; }
    if (bias) { tx += clamp((bias.x - px) * 0.28, -4, 4); tz += clamp((bias.y - py) * 0.28, -4, 4); }
    const a = 1 - Math.exp(-dt / 0.07);
    let dx = (tx - this.target.x) * a, dz = (tz - this.target.z) * a;
    const far = Math.hypot(tx - this.target.x, tz - this.target.z) > 30;
    const step = Math.hypot(dx, dz);
    if (!far && step > 0.4) { dx *= 0.4 / step; dz *= 0.4 / step; }
    if (far) { dx = tx - this.target.x; dz = tz - this.target.z; }
    this.target.x += dx; this.target.z += dz; this.target.y = 0.9;
    const goal = Math.max(minZoom, this.zoomGoal);
    this.zoom += (goal - this.zoom) * (1 - Math.exp(-dt / 0.12));
    this.time += dt;
    this.shakeAmt = Math.max(0, this.shakeAmt - dt * 1.8);
    const sh = this.settings.shake && !this.settings.reducedMotion ? Math.min(0.45, this.shakeAmt) : 0;
    this.shakeOff.set(Math.sin(this.time * 71) * sh, 0, Math.cos(this.time * 53) * sh);
    const ch = Math.cos(PITCH) * this.zoom;
    this.camera.position.set(this.target.x - Math.cos(YAW) * ch + this.shakeOff.x, this.target.y + Math.sin(PITCH) * this.zoom, this.target.z - Math.sin(YAW) * ch + this.shakeOff.z);
    this.camera.setTarget(this.tmpV.set(this.target.x + this.shakeOff.x, this.target.y, this.target.z + this.shakeOff.z));
    if (this.shadow) this.moon.position.set(this.target.x - 18, 40, this.target.z - 28);
  }
  addShake(a: number): void { this.shakeAmt = Math.min(0.6, this.shakeAmt + a); }
  setZoom(delta: number): void { this.zoomGoal = clamp(this.zoomGoal + delta, 13, 24); }
  /** Screen → ground plane (y=0). Shake is subtracted so it never affects pointer targeting. */
  pickGround(clientX: number, clientY: number): Vec {
    const rect = this.canvas.getBoundingClientRect();
    const w = this.engine.getRenderWidth(), h = this.engine.getRenderHeight();
    const sx = ((clientX - rect.left) / rect.width) * w, sy = ((clientY - rect.top) / rect.height) * h;
    const view = this.camera.getViewMatrix(), proj = this.camera.getProjectionMatrix();
    const a = Vector3.Unproject(new Vector3(sx, sy, 0), w, h, Matrix.Identity(), view, proj);
    const b = Vector3.Unproject(new Vector3(sx, sy, 1), w, h, Matrix.Identity(), view, proj);
    const t = a.y / (a.y - b.y || 1e-6);
    return { x: a.x + (b.x - a.x) * t - this.shakeOff.x, y: a.z + (b.z - a.z) * t - this.shakeOff.z };
  }
  /** World → CSS pixel coordinates relative to the canvas. */
  project(x: number, y: number, h = 0): { x: number; y: number; ok: boolean } {
    const rect = this.canvas.getBoundingClientRect();
    const w = this.engine.getRenderWidth(), hh = this.engine.getRenderHeight();
    const v = Vector3.Project(this.tmpV.set(x, h, y), Matrix.Identity(), this.scene.getTransformMatrix(), this.camera.viewport.toGlobal(w, hh));
    return { x: (v.x / w) * rect.width, y: (v.y / hh) * rect.height, ok: v.z > 0 && v.z < 1 };
  }
  /** Assigns the pooled point lights to the brightest nearby sources (strict dynamic-light budget). */
  updateLights(dt: number, dynamic: LightSrc[]): void {
    for (const f of this.flashes) f.t += dt;
    this.flashes = this.flashes.filter((f) => f.t < f.dur);
    const all: LightSrc[] = [...dynamic, ...this.flashes.map((f) => ({ ...f, intensity: f.intensity * (1 - f.t / f.dur) })), ...this.statics];
    const tx = this.target.x, tz = this.target.z;
    const scored = all.map((l) => ({ l, s: l.intensity * l.range / (8 + (l.x - tx) ** 2 + (l.y - tz) ** 2) })).sort((a, b) => b.s - a.s);
    this.lightPool.forEach((pl, i) => {
      const e = scored[i];
      if (!e || Math.hypot(e.l.x - tx, e.l.y - tz) > 34) { pl.intensity = 0; return; }
      const fl = e.l.flicker ? 0.86 + 0.14 * Math.sin(this.time * 11 + e.l.x * 3) * Math.sin(this.time * 7.3 + e.l.y) : 1;
      pl.position.set(e.l.x, e.l.h, e.l.y); pl.diffuse = e.l.color; pl.intensity = e.l.intensity * fl; pl.range = e.l.range;
    });
  }
  flash(x: number, y: number, color: Color3, intensity = 2.2, range = 12, dur = 0.35): void { this.flashes.push({ x, y, h: 1.6, color, intensity, range, t: 0, dur }); }
  render(): void {
    this.camRot = this.camera.getWorldMatrix().getRotationMatrix();
    this.scene.render();
  }
  resize(): void { this.engine.resize(); }
  dispose(): void { clearModelCache(); this.scene.dispose(); this.engine.dispose(); }
}
