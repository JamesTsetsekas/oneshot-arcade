// renderer-world: static island scene. Terrain chunks, instanced structure kit, foliage, sky, sea and storm wall.
import {
  type AbstractMesh, CascadedShadowGenerator, Color3, Color4, DefaultRenderingPipeline, DirectionalLight, DynamicTexture, Engine, FreeCamera,
  HemisphericLight, Matrix, Mesh, MeshBuilder, Quaternion, Scene, ShaderMaterial, StandardMaterial, Texture, Vector3, VertexData,
} from "@babylonjs/core";
import { Rng, fbm2 } from "../../shared/math";
import { BoxFlag } from "../../shared/world/collision";
import { LOCATIONS, type IslandData } from "../../shared/world/island";
import { Shape } from "../../shared/world/kit";
import { createPrism, createRock, merge, paint, prim } from "./meshes";
import { SKY, hexToRgb, terrainColor } from "./palette";
import { SEA_FS, SEA_VS, SKY_FS, SKY_VS, STORM_FS, STORM_VS } from "./shaders";

export type Quality = "low" | "medium" | "high";

const tmpS = new Vector3();
const tmpT = new Vector3();
const tmpQ = new Quaternion();
const tmpM = new Matrix();

class InstanceBatch {
  private mats: number[] = [];
  private cols: number[] = [];
  add(x: number, y: number, z: number, sx: number, sy: number, sz: number, rx: number, ry: number, rz: number, r: number, g: number, b: number): void {
    tmpS.set(sx, sy, sz);
    tmpT.set(x, y, z);
    Quaternion.RotationYawPitchRollToRef(ry, rx, rz, tmpQ);
    Matrix.ComposeToRef(tmpS, tmpQ, tmpT, tmpM);
    const a = tmpM.asArray();
    for (let i = 0; i < 16; i++) this.mats.push(a[i]!);
    this.cols.push(r, g, b, 1);
  }
  get count(): number {
    return this.cols.length / 4;
  }
  apply(mesh: Mesh): void {
    if (!this.count) {
      mesh.setEnabled(false);
      return;
    }
    mesh.thinInstanceSetBuffer("matrix", new Float32Array(this.mats), 16, true);
    mesh.thinInstanceSetBuffer("color", new Float32Array(this.cols), 4, true);
    mesh.alwaysSelectAsActiveMesh = true;
    mesh.freezeWorldMatrix();
  }
}

export class WorldScene {
  readonly engine: Engine;
  readonly scene: Scene;
  readonly camera: FreeCamera;
  readonly sun: DirectionalLight;
  readonly hemi: HemisphericLight;
  shadow: CascadedShadowGenerator | null = null;
  pipeline: DefaultRenderingPipeline | null = null;
  readonly lit: StandardMaterial;
  readonly litDouble: StandardMaterial;
  readonly glow: StandardMaterial;
  readonly unlit: StandardMaterial;
  private skyMat!: ShaderMaterial;
  private seaMat!: ShaderMaterial;
  private stormMat!: ShaderMaterial;
  private stormMesh!: Mesh;
  private spinners: { mesh: Mesh; speed: number }[] = [];
  private casters: Mesh[] = [];
  private receivers: Mesh[] = [];
  quality: Quality = "medium";
  renderScale = 1;
  stormTint = 0;

  constructor(canvas: HTMLCanvasElement, readonly island: IslandData, quality: Quality) {
    this.engine = new Engine(canvas, quality !== "low", { stencil: false, powerPreference: "high-performance", antialias: quality !== "low" }, false);
    const scene = (this.scene = new Scene(this.engine));
    scene.clearColor = new Color4(SKY.fog[0], SKY.fog[1], SKY.fog[2], 1);
    scene.ambientColor = new Color3(1, 1, 1);
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.00115;
    scene.fogColor = new Color3(SKY.fog[0], SKY.fog[1], SKY.fog[2]);
    scene.skipPointerMovePicking = true;
    scene.autoClear = true;
    scene.blockMaterialDirtyMechanism = false;

    this.camera = new FreeCamera("cam", new Vector3(0, 120, -500), scene);
    this.camera.minZ = 0.12;
    this.camera.maxZ = 5200;
    this.camera.fov = 1.02;
    this.camera.inputs.clear();
    scene.activeCamera = this.camera;

    const sd = new Vector3(-SKY.sun[0], -SKY.sun[1], -SKY.sun[2]).normalize();
    this.sun = new DirectionalLight("sun", sd, scene);
    this.sun.intensity = 0.74;
    this.sun.diffuse = new Color3(1, 0.96, 0.86);
    this.sun.specular = new Color3(0, 0, 0);
    this.hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    this.hemi.intensity = 0.84;
    this.hemi.diffuse = new Color3(0.92, 0.96, 1.0);
    this.hemi.groundColor = new Color3(0.76, 0.73, 0.66);
    this.hemi.specular = new Color3(0, 0, 0);

    const mk = (name: string): StandardMaterial => {
      const m = new StandardMaterial(name, scene);
      m.diffuseColor = new Color3(1, 1, 1);
      m.specularColor = new Color3(0, 0, 0);
      return m;
    };
    this.lit = mk("lit");
    this.litDouble = mk("litDouble");
    this.litDouble.backFaceCulling = false;
    this.glow = mk("glow");
    this.glow.disableLighting = true;
    this.glow.diffuseColor = new Color3(0, 0, 0);
    this.glow.emissiveColor = new Color3(1, 1, 1);
    this.glow.fogEnabled = false;
    this.unlit = mk("unlit");
    this.unlit.disableLighting = true;
    this.unlit.diffuseColor = new Color3(0, 0, 0);
    this.unlit.emissiveColor = new Color3(1, 1, 1);
    this.unlit.backFaceCulling = false;

    this.buildSky();
    this.buildSea();
    this.buildTerrain();
    this.buildStructures();
    this.buildFoliage();
    this.buildStormWall();
    this.setQuality(quality);
  }

  // ------------------------------------------------------------------ construction

  private buildSky(): void {
    const sky = MeshBuilder.CreateSphere("sky", { diameter: 4600, segments: 20, sideOrientation: Mesh.BACKSIDE }, this.scene);
    this.skyMat = new ShaderMaterial("skyMat", this.scene, { vertexSource: SKY_VS, fragmentSource: SKY_FS }, { attributes: ["position"], uniforms: ["worldViewProjection", "time", "sunDir", "storm"] });
    this.skyMat.backFaceCulling = false;
    this.skyMat.disableDepthWrite = true;
    this.skyMat.setVector3("sunDir", new Vector3(SKY.sun[0], SKY.sun[1], SKY.sun[2]));
    this.skyMat.setFloat("time", 0);
    this.skyMat.setFloat("storm", 0);
    sky.material = this.skyMat;
    sky.infiniteDistance = true;
    sky.isPickable = false;
    sky.applyFog = false;
    sky.alwaysSelectAsActiveMesh = true;
  }

  private buildSea(): void {
    const sea = MeshBuilder.CreateGround("sea", { width: 9000, height: 9000, subdivisions: 1 }, this.scene);
    this.seaMat = new ShaderMaterial("seaMat", this.scene, { vertexSource: SEA_VS, fragmentSource: SEA_FS }, { attributes: ["position"], uniforms: ["world", "worldViewProjection", "time", "camPos", "storm"], needAlphaBlending: true });
    this.seaMat.setFloat("time", 0);
    this.seaMat.setFloat("storm", 0);
    this.seaMat.setVector3("camPos", Vector3.Zero());
    this.seaMat.backFaceCulling = false;
    sea.material = this.seaMat;
    sea.isPickable = false;
    sea.alwaysSelectAsActiveMesh = true;
  }

  private buildTerrain(): void {
    const hf = this.island.hf;
    const scene = this.scene;
    // fine grain detail texture multiplied over vertex colours
    const tex = new DynamicTexture("grain", { width: 256, height: 256 }, scene, true);
    const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
    const img = ctx.createImageData(256, 256);
    const rng = new Rng(77);
    for (let y = 0; y < 256; y++)
      for (let x = 0; x < 256; x++) {
        const a = fbm2(x / 20, y / 20, 3, 5) * 0.5 + fbm2(x / 5, y / 5, 2, 9) * 0.3 + rng.next() * 0.2;
        const v = Math.round(200 + a * 70);
        const i = (y * 256 + x) * 4;
        img.data[i] = Math.min(255, v);
        img.data[i + 1] = Math.min(255, v + 2);
        img.data[i + 2] = Math.min(255, v - 4);
        img.data[i + 3] = 255;
      }
    ctx.putImageData(img, 0, 0);
    tex.update(false);
    tex.wrapU = Texture.WRAP_ADDRESSMODE;
    tex.wrapV = Texture.WRAP_ADDRESSMODE;
    tex.anisotropicFilteringLevel = 4;
    const mat = new StandardMaterial("terrain", scene);
    mat.diffuseTexture = tex;
    mat.specularColor = new Color3(0, 0, 0);
    mat.freeze();

    const CH = 50; // quads per chunk side
    const n = hf.n;
    const chunks = Math.ceil((n - 1) / CH);
    const col = [0, 0, 0];
    const nrm = { x: 0, y: 0, z: 0 };
    for (let cz = 0; cz < chunks; cz++)
      for (let cx = 0; cx < chunks; cx++) {
        const x0 = cx * CH,
          z0 = cz * CH;
        const w = Math.min(CH, n - 1 - x0),
          d = Math.min(CH, n - 1 - z0);
        let maxH = -1e9;
        for (let j = 0; j <= d; j++) for (let i = 0; i <= w; i++) maxH = Math.max(maxH, hf.data[(z0 + j) * n + x0 + i]!);
        if (maxH < -11) continue; // open ocean floor
        const positions = new Float32Array((w + 1) * (d + 1) * 3);
        const normals = new Float32Array((w + 1) * (d + 1) * 3);
        const colors = new Float32Array((w + 1) * (d + 1) * 4);
        const uvs = new Float32Array((w + 1) * (d + 1) * 2);
        const indices: number[] = [];
        let k = 0;
        for (let j = 0; j <= d; j++)
          for (let i = 0; i <= w; i++, k++) {
            const x = -hf.half + (x0 + i) * hf.cell,
              z = -hf.half + (z0 + j) * hf.cell;
            const h = hf.data[(z0 + j) * n + x0 + i]!;
            positions[k * 3] = x;
            positions[k * 3 + 1] = h;
            positions[k * 3 + 2] = z;
            hf.normal(x, z, nrm);
            normals[k * 3] = nrm.x;
            normals[k * 3 + 1] = nrm.y;
            normals[k * 3 + 2] = nrm.z;
            terrainColor(this.island, x, z, col);
            colors[k * 4] = col[0]!;
            colors[k * 4 + 1] = col[1]!;
            colors[k * 4 + 2] = col[2]!;
            colors[k * 4 + 3] = 1;
            uvs[k * 2] = x / 9;
            uvs[k * 2 + 1] = z / 9;
          }
        for (let j = 0; j < d; j++)
          for (let i = 0; i < w; i++) {
            const a = j * (w + 1) + i,
              b = a + 1,
              c = a + w + 1,
              e = c + 1;
            indices.push(a, b, c, b, e, c);
          }
        const mesh = new Mesh(`terrain_${cx}_${cz}`, scene);
        const vd = new VertexData();
        vd.positions = positions;
        vd.normals = normals;
        vd.colors = colors;
        vd.uvs = uvs;
        vd.indices = indices;
        vd.applyToMesh(mesh);
        mesh.material = mat;
        mesh.isPickable = false;
        mesh.freezeWorldMatrix();
        mesh.doNotSyncBoundingInfo = true;
        this.receivers.push(mesh);
      }
  }

  private unitShapes(material: StandardMaterial, grad: number): Mesh[] {
    const s = this.scene;
    const box = paint(MeshBuilder.CreateBox("uBox", { size: 1 }, s), [1, 1, 1], grad);
    const cyl = paint(MeshBuilder.CreateCylinder("uCyl", { height: 1, diameter: 1, tessellation: 12 }, s), [1, 1, 1], grad);
    const cone = paint(MeshBuilder.CreateCylinder("uCone", { height: 1, diameterTop: 0, diameterBottom: 1, tessellation: 12 }, s), [1, 1, 1], grad * 0.5);
    const sphere = paint(MeshBuilder.CreateSphere("uSphere", { diameter: 1, segments: 8 }, s), [1, 1, 1], grad);
    const prism = createPrism(s);
    for (const m of [box, cyl, cone, sphere]) m.material = material;
    prism.material = material === this.glow ? this.glow : this.litDouble;
    for (const m of [box, cyl, cone, sphere, prism]) m.isPickable = false;
    return [box, cyl, cone, sphere, prism];
  }

  private buildStructures(): void {
    const isl = this.island;
    const litShapes = this.unitShapes(this.lit, 0.16);
    const glowShapes = this.unitShapes(this.glow, 0);
    const lit = litShapes.map(() => new InstanceBatch());
    const glow = glowShapes.map(() => new InstanceBatch());
    const rng = new Rng(4242);
    for (const b of isl.world.boxes) {
      if (b.flags & BoxFlag.NoRender) continue;
      const [r, g, bl] = hexToRgb(b.color);
      const j = 0.95 + rng.next() * 0.1;
      lit[Shape.Box]!.add(b.x, b.y, b.z, b.hx * 2, b.hy * 2, b.hz * 2, 0, b.yaw, 0, r * j, g * j, bl * j);
    }
    for (const d of isl.decor) {
      const [r, g, bl] = hexToRgb(d.color);
      if (d.glow > 0) {
        const k = Math.min(1.6, 0.75 + d.glow * 0.4);
        glow[d.shape]!.add(d.x, d.y, d.z, d.sx, d.sy, d.sz, d.rx, d.ry, d.rz, Math.min(1, r * k), Math.min(1, g * k), Math.min(1, bl * k));
      } else lit[d.shape]!.add(d.x, d.y, d.z, d.sx, d.sy, d.sz, d.rx, d.ry, d.rz, r, g, bl);
    }
    // zipline cables
    for (const z of isl.ziplines) {
      const dx = z.bx - z.ax,
        dy = z.by - z.ay,
        dz = z.bz - z.az;
      const len = Math.hypot(dx, dy, dz);
      lit[Shape.Box]!.add((z.ax + z.bx) / 2, (z.ay + z.by) / 2, (z.az + z.bz) / 2, 0.07, 0.07, len, -Math.atan2(dy, Math.hypot(dx, dz)), Math.atan2(dx, dz), 0, 0.2, 0.2, 0.22);
    }
    litShapes.forEach((m, i) => {
      lit[i]!.apply(m);
      m.receiveShadows = true;
      this.casters.push(m);
    });
    glowShapes.forEach((m, i) => glow[i]!.apply(m));

    // spinning machinery
    for (const sp of isl.spinners) {
      const [r, g, b] = hexToRgb(sp.color);
      const blades: Mesh[] = [];
      const n = sp.r > 10 ? 3 : 4;
      for (let i = 0; i < n; i++) blades.push(prim(this.scene, "box", sp.r * 0.16, sp.r, 0.18, 0, sp.r * 0.5, 0, [r, g, b], 0, 0, (i / n) * Math.PI * 2));
      // bake each blade around the hub
      const hub = prim(this.scene, "cyl", sp.r * 0.16, 0.8, sp.r * 0.16, 0, 0, 0, hexToRgb(0xc27a42), Math.PI / 2);
      const parts: Mesh[] = [hub];
      blades.forEach((b2, i) => {
        b2.dispose();
        const ang = (i / n) * Math.PI * 2;
        parts.push(prim(this.scene, "box", sp.r * 0.15, sp.r, 0.16, -Math.sin(ang) * sp.r * 0.5, Math.cos(ang) * sp.r * 0.5, 0, [r, g, b], 0, 0, ang));
      });
      const mesh = merge("spinner", parts);
      mesh.material = this.lit;
      mesh.position.set(sp.x, sp.y, sp.z);
      mesh.rotation.y = sp.yaw;
      mesh.isPickable = false;
      this.spinners.push({ mesh, speed: sp.r > 10 ? 0.5 : 0.9 });
    }
  }

  private buildFoliage(): void {
    const isl = this.island;
    const s = this.scene;
    const trunk = paint(MeshBuilder.CreateCylinder("trunk", { height: 1, diameter: 1, tessellation: 6 }, s), [1, 1, 1], 0.25);
    const pine = paint(MeshBuilder.CreateCylinder("pine", { height: 1, diameterTop: 0, diameterBottom: 1, tessellation: 7 }, s), [1, 1, 1], 0.3);
    const round = paint(MeshBuilder.CreateIcoSphere("round", { radius: 0.5, subdivisions: 1, flat: true }, s), [1, 1, 1], 0.32);
    const bT = new InstanceBatch(),
      bP = new InstanceBatch(),
      bR = new InstanceBatch();
    const pineCols = [hexToRgb(0x2f7d55), hexToRgb(0x3a8f5c), hexToRgb(0x27705a)];
    const roundCols = [hexToRgb(0x5fae45), hexToRgb(0x79bf4c), hexToRgb(0xe9a03a)];
    const orchCols = [hexToRgb(0x3e8f3a), hexToRgb(0x4c9c3e), hexToRgb(0xdf6f55)];
    const tw = hexToRgb(0x7a5636);
    const rng = new Rng(999);
    for (const t of isl.trees) {
      const sc = t.s;
      const yaw = rng.range(0, 6.28);
      if (t.kind === 0) {
        bT.add(t.x, t.y + 1.1 * sc, t.z, 0.4 * sc, 2.4 * sc, 0.4 * sc, 0, yaw, 0, tw[0], tw[1], tw[2]);
        const c = pineCols[t.tint % 3]!;
        bP.add(t.x, t.y + 3.3 * sc, t.z, 3.0 * sc, 3.4 * sc, 3.0 * sc, 0, yaw, 0, c[0], c[1], c[2]);
        bP.add(t.x, t.y + 5.0 * sc, t.z, 2.3 * sc, 2.8 * sc, 2.3 * sc, 0, yaw + 0.5, 0, c[0] * 1.08, c[1] * 1.08, c[2] * 1.08);
        bP.add(t.x, t.y + 6.4 * sc, t.z, 1.5 * sc, 2.2 * sc, 1.5 * sc, 0, yaw + 1, 0, c[0] * 1.16, c[1] * 1.16, c[2] * 1.16);
      } else if (t.kind === 1) {
        bT.add(t.x, t.y + 1.4 * sc, t.z, 0.46 * sc, 3.0 * sc, 0.46 * sc, 0, yaw, 0, tw[0], tw[1], tw[2]);
        const c = roundCols[t.tint % 3]!;
        bR.add(t.x, t.y + 4.2 * sc, t.z, 4.0 * sc, 3.2 * sc, 4.0 * sc, 0, yaw, 0, c[0], c[1], c[2]);
        bR.add(t.x + 1.1 * sc, t.y + 3.4 * sc, t.z + 0.6 * sc, 2.4 * sc, 2.0 * sc, 2.4 * sc, 0.3, yaw + 1, 0, c[0] * 0.92, c[1] * 0.92, c[2] * 0.92);
      } else {
        bT.add(t.x, t.y + 1.0 * sc, t.z, 0.36 * sc, 2.2 * sc, 0.36 * sc, 0, yaw, 0, tw[0], tw[1], tw[2]);
        const c = orchCols[t.tint % 2]!;
        bR.add(t.x, t.y + 3.1 * sc, t.z, 3.6 * sc, 2.8 * sc, 3.6 * sc, 0, yaw, 0, c[0], c[1], c[2]);
        const f = orchCols[2]!;
        if (t.tint === 2) bR.add(t.x + 0.9 * sc, t.y + 3.6 * sc, t.z - 0.5 * sc, 1.5 * sc, 1.3 * sc, 1.5 * sc, 0, yaw, 0, f[0], f[1], f[2]);
      }
    }
    for (const [m, b] of [[trunk, bT], [pine, bP], [round, bR]] as [Mesh, InstanceBatch][]) {
      m.material = this.lit;
      m.isPickable = false;
      b.apply(m);
      this.casters.push(m);
    }
    // limestone boulders
    const rock = createRock(s);
    const bRock = new InstanceBatch();
    const rc = [hexToRgb(0xddd3b8), hexToRgb(0xcfc6ae), hexToRgb(0xe6dcc0)];
    for (const r of isl.rocks) {
      const c = rc[r.tint % 3]!;
      bRock.add(r.x, r.y, r.z, r.sx, r.sy, r.sz, 0, r.yaw, 0, c[0], c[1], c[2]);
    }
    rock.material = this.lit;
    rock.isPickable = false;
    rock.receiveShadows = true;
    bRock.apply(rock);
    this.casters.push(rock);

    // low meadow scatter: bushes and flowers (never tall enough to hide a standing player)
    const bush = paint(MeshBuilder.CreateIcoSphere("bush", { radius: 0.5, subdivisions: 1, flat: true }, s), [1, 1, 1], 0.4);
    const flower = paint(MeshBuilder.CreateBox("flower", { size: 1 }, s), [1, 1, 1], 0);
    const bB = new InstanceBatch(),
      bF = new InstanceBatch();
    const nrm = { x: 0, y: 0, z: 0 };
    const fc = [hexToRgb(0xf4b63a), hexToRgb(0xea6a50), hexToRgb(0xffffff), hexToRgb(0xcc4c9f)];
    const nearLoc = (x: number, z: number): boolean => LOCATIONS.some((l) => l.named && l.idx !== 3 && Math.hypot(x - l.x, z - l.z) < l.r * 0.9);
    for (let i = 0; i < 9000 && bB.count < 2600; i++) {
      const x = rng.range(-570, 570),
        z = rng.range(-570, 570);
      const h = isl.hf.height(x, z);
      if (h < 2.2 || isl.hf.normal(x, z, nrm) < 0.86 || nearLoc(x, z)) continue;
      if (isl.world.blocked(x, z, 0.8, h - 0.5, h + 2)) continue;
      const g = 0.75 + rng.next() * 0.4;
      const sc = rng.range(0.5, 1.05);
      bB.add(x, h + 0.18 * sc, z, 1.5 * sc, 0.7 * sc, 1.5 * sc, 0, rng.range(0, 6), 0, 0.27 * g, 0.55 * g, 0.25 * g);
      for (let f = 0; f < 3; f++) {
        const fx = x + rng.range(-3, 3),
          fz = z + rng.range(-3, 3);
        const c = fc[rng.int(0, 3)]!;
        bF.add(fx, isl.hf.height(fx, fz) + 0.14, fz, 0.16, 0.28, 0.16, 0, rng.range(0, 3), 0, c[0], c[1], c[2]);
      }
    }
    for (const [m, b] of [[bush, bB], [flower, bF]] as [Mesh, InstanceBatch][]) {
      m.material = this.lit;
      m.isPickable = false;
      b.apply(m);
    }
  }

  private buildStormWall(): void {
    const m = MeshBuilder.CreateCylinder("storm", { height: 1, diameter: 2, tessellation: 128, cap: Mesh.NO_CAP, sideOrientation: Mesh.DOUBLESIDE }, this.scene);
    this.stormMat = new ShaderMaterial("stormMat", this.scene, { vertexSource: STORM_VS, fragmentSource: STORM_FS }, { attributes: ["position", "uv"], uniforms: ["world", "worldViewProjection", "time", "radius", "intensity", "camPos"], needAlphaBlending: true });
    this.stormMat.backFaceCulling = false;
    this.stormMat.disableDepthWrite = true;
    this.stormMat.setFloat("time", 0);
    this.stormMat.setFloat("radius", 430);
    this.stormMat.setFloat("intensity", 1);
    this.stormMat.setVector3("camPos", Vector3.Zero());
    m.material = this.stormMat;
    m.isPickable = false;
    m.alwaysSelectAsActiveMesh = true;
    m.setEnabled(false);
    this.stormMesh = m;
  }

  // ------------------------------------------------------------------ runtime

  setQuality(q: Quality): void {
    this.quality = q;
    const scene = this.scene;
    if (this.shadow) {
      this.shadow.dispose();
      this.shadow = null;
    }
    if (this.pipeline) {
      this.pipeline.dispose();
      this.pipeline = null;
    }
    for (const r of this.receivers) r.receiveShadows = q !== "low";
    if (q !== "low") {
      const csm = new CascadedShadowGenerator(q === "high" ? 2048 : 1024, this.sun);
      csm.numCascades = q === "high" ? 4 : 3;
      csm.shadowMaxZ = q === "high" ? 220 : 150;
      csm.lambda = 0.85;
      csm.stabilizeCascades = true;
      csm.autoCalcDepthBounds = false;
      csm.bias = 0.0012;
      csm.normalBias = 0.02;
      csm.darkness = 0.48;
      csm.cascadeBlendPercentage = 0.06;
      csm.usePercentageCloserFiltering = true;
      csm.filteringQuality = q === "high" ? 0 : 1;
      for (const c of this.casters) csm.addShadowCaster(c, false);
      for (const sp of this.spinners) csm.addShadowCaster(sp.mesh, false);
      this.shadow = csm;
      const p = new DefaultRenderingPipeline("pipeline", false, scene, [this.camera]);
      p.fxaaEnabled = true;
      p.samples = q === "high" ? 4 : 1;
      p.bloomEnabled = true;
      p.bloomThreshold = 0.86;
      p.bloomWeight = 0.22;
      p.bloomKernel = 40;
      p.bloomScale = 0.5;
      p.imageProcessingEnabled = true;
      this.pipeline = p;
    }
    scene.imageProcessingConfiguration.contrast = 1.14;
    scene.imageProcessingConfiguration.exposure = 1.04;
    scene.imageProcessingConfiguration.toneMappingEnabled = false;
    this.scene.fogDensity = q === "low" ? 0.0014 : 0.00115;
  }

  addCaster(m: AbstractMesh): void {
    this.shadow?.addShadowCaster(m, false);
  }
  removeCaster(m: AbstractMesh): void {
    this.shadow?.removeShadowCaster(m, false);
  }

  setRenderScale(scale: number): void {
    if (Math.abs(scale - this.renderScale) < 0.01) return;
    this.renderScale = scale;
    this.engine.setHardwareScalingLevel(1 / scale);
  }

  /** Per-frame environment animation. Storm parameters come straight from the server snapshot. */
  updateEnvironment(time: number, dt: number, storm: { cx: number; cz: number; r: number; visible: boolean; intensity: number }, outside: boolean): void {
    const cam = this.camera.position;
    this.stormTint += ((outside ? 1 : 0) - this.stormTint) * Math.min(1, dt * 2.5);
    this.skyMat.setFloat("time", time);
    this.skyMat.setFloat("storm", this.stormTint);
    this.seaMat.setFloat("time", time);
    this.seaMat.setFloat("storm", this.stormTint);
    this.seaMat.setVector3("camPos", cam);
    this.stormMesh.setEnabled(storm.visible && storm.r > 0.5);
    if (storm.visible) {
      this.stormMesh.position.set(storm.cx, 60, storm.cz);
      this.stormMesh.scaling.set(storm.r, 190, storm.r);
      this.stormMat.setFloat("time", time);
      this.stormMat.setFloat("radius", storm.r);
      this.stormMat.setFloat("intensity", storm.intensity);
      this.stormMat.setVector3("camPos", cam);
    }
    for (const sp of this.spinners) sp.mesh.rotation.z += sp.speed * dt;
    // violet-shift fog while outside the Calmfield (threatening, never opaque)
    const f = this.scene.fogColor;
    f.r = SKY.fog[0] * (1 - this.stormTint * 0.3);
    f.g = SKY.fog[1] * (1 - this.stormTint * 0.42);
    f.b = SKY.fog[2];
  }

  dispose(): void {
    this.scene.dispose();
    this.engine.dispose();
  }
}
