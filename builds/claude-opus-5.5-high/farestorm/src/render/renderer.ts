// Babylon.js renderer: engine/scene setup, lighting, sky, post-processing, and per-frame sync of the
// simulation state (taxi, traffic, pedestrians, passengers, markers, items, props, particles).

import {
  Color3, Color4, ColorCurves, DefaultRenderingPipeline, DirectionalLight, Effect, Engine, HemisphericLight, ImageProcessingConfiguration,
  InstancedMesh, Matrix, Mesh, MeshBuilder, ParticleSystem, Quaternion, Scene, ShaderMaterial, ShadowGenerator,
  StandardMaterial, Vector3, type AbstractMesh,
} from "@babylonjs/core";
import type { World } from "../sim/world/city";
import type { GameEvent, Session } from "../sim/session/session";
import { ARCHETYPES } from "../sim/fares/archetypes";
import { TIER_INFO } from "../sim/score/score";
import { TRAFFIC_COLORS } from "../sim/traffic/traffic";
import { signalState } from "../sim/traffic/traffic";
import { driftAngle, forwardSpeed, speedOf } from "../sim/vehicle/vehicle";
import { lerp, wrapAngle } from "../sim/math";
import { buildCity, glowMaterial, litMaterial, type CityMeshes } from "./cityMesh";
import { CameraRig, type CamControls } from "./camera";
import { Geo, hex, polyPoints, starPoints } from "./geo";
import { beamTexture, confettiTex, softDot } from "./textures";
import { buildPassengerMesh, buildPersonGeo, buildTaxi, buildTrafficGeo, drawFareSign, type TaxiModel } from "./vehicles";

export interface RenderSettings {
  quality: "low" | "medium" | "high";
  dynamicRes: boolean;
  shadows: boolean;
  bloom: boolean;
  shake: number;
  reducedMotion: boolean;
  photosensitive: boolean;
  fovScale: number;
  colorblind: boolean;
}

const SKY_VS = `precision highp float;
attribute vec3 position; uniform mat4 worldViewProjection; varying vec3 vDir;
void main(){ vDir = position; gl_Position = worldViewProjection * vec4(position,1.0); }`;
const SKY_FS = `precision highp float; varying vec3 vDir; uniform vec3 sunDir; uniform vec3 horizon; uniform vec3 zenith; uniform vec3 sunCol;
void main(){ vec3 d = normalize(vDir); float h = clamp(d.y, -0.2, 1.0);
 vec3 c = mix(horizon, zenith, pow(max(h,0.0), 0.55));
 c = mix(c, horizon*0.9, clamp(-h*4.0,0.0,1.0));
 float s = max(dot(d, -sunDir), 0.0);
 c += sunCol * (pow(s, 600.0)*3.0 + pow(s, 12.0)*0.35 + pow(s,3.0)*0.12);
 float cl = sin(d.x*9.0+d.z*4.0)*sin(d.z*11.0-d.x*3.0);
 c = mix(c, vec3(1.0,0.97,0.93), smoothstep(0.55,0.95,cl)*smoothstep(0.05,0.25,h)*0.35);
 gl_FragColor = vec4(c,1.0); }`;

interface MarkerSet {
  root: Mesh; // ground ring
  icon: Mesh;
  beam: Mesh;
  person: InstancedMesh | null;
  arch: number;
}

export class Renderer {
  engine: Engine;
  scene: Scene;
  rig: CameraRig;
  city: CityMeshes;
  sun: DirectionalLight;
  shadow: ShadowGenerator | null = null;
  pipeline: DefaultRenderingPipeline;
  sky: ShaderMaterial;
  private session: Session | null = null;
  private taxi: TaxiModel | null = null;
  private trafficSources = new Map<string, { lit: Mesh; glow: Mesh }>();
  private trafficInst: { key: string; lit: InstancedMesh; glow: InstancedMesh }[] = [];
  private peds: Mesh;
  private pedBuf: Float32Array;
  private pedCol: Float32Array;
  private passengerSrc: Mesh[] = [];
  private markers: MarkerSet[] = [];
  private tierMats = new Map<string, StandardMaterial>();
  private destRing: Mesh;
  private destBeam: Mesh;
  private destDisc: Mesh;
  private arrow: Mesh;
  private arrowMat: StandardMaterial;
  private lessonRing: Mesh;
  private itemMeshes = new Map<number, Mesh | InstancedMesh>();
  private propMeshes: (Mesh | InstancedMesh)[] = [];
  private smoke: ParticleSystem;
  private sparks: ParticleSystem;
  private boostPs: ParticleSystem;
  private confetti: ParticleSystem;
  private splash: ParticleSystem;
  private dust: ParticleSystem;
  private boarding: InstancedMesh | null = null;
  private boardingFrom = new Vector3();
  settings: RenderSettings;
  private fpsAvg = 60;
  private scaleLevel = 1;
  private baseScale = 1;
  private time = 0;
  private signalTimer = 0;
  private livery: { body: string; trim: string; accent: string } | undefined;
  contextLost = false;

  constructor(readonly canvas: HTMLCanvasElement, readonly world: World, settings: RenderSettings) {
    this.settings = settings;
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, antialias: false, powerPreference: "high-performance" }, true);
    this.engine.onContextLostObservable.add(() => { this.contextLost = true; });
    this.engine.onContextRestoredObservable.add(() => { this.contextLost = false; });
    const scene = (this.scene = new Scene(this.engine));
    scene.clearColor = new Color4(0.98, 0.82, 0.66, 1);
    scene.skipPointerMovePicking = true;
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.0011;
    scene.fogColor = new Color3(0.93, 0.84, 0.76);
    scene.ambientColor = new Color3(0.3, 0.3, 0.32);

    const hemi = new HemisphericLight("hemi", new Vector3(0.1, 1, 0.05), scene);
    hemi.intensity = 0.72;
    hemi.diffuse = new Color3(0.78, 0.86, 1.0);
    hemi.groundColor = new Color3(0.62, 0.57, 0.52);
    hemi.specular = new Color3(0.1, 0.1, 0.1);
    this.sun = new DirectionalLight("sun", new Vector3(0.62, -0.5, 0.6).normalize(), scene);
    this.sun.intensity = 1.9;
    this.sun.diffuse = new Color3(1.0, 0.88, 0.72);
    this.sun.specular = new Color3(1.0, 0.9, 0.75);
    this.sun.autoUpdateExtends = false;
    this.sun.orthoLeft = -95; this.sun.orthoRight = 95; this.sun.orthoTop = 95; this.sun.orthoBottom = -95;
    this.sun.shadowMinZ = 1; this.sun.shadowMaxZ = 900;

    this.rig = new CameraRig(scene, world);
    scene.activeCamera = this.rig.cam;

    if (settings.shadows) this.makeShadows();

    // sky
    Effect.ShadersStore["skyVertexShader"] = SKY_VS;
    Effect.ShadersStore["skyFragmentShader"] = SKY_FS;
    this.sky = new ShaderMaterial("sky", scene, { vertex: "sky", fragment: "sky" }, { attributes: ["position"], uniforms: ["worldViewProjection", "sunDir", "horizon", "zenith", "sunCol"] });
    this.sky.backFaceCulling = false;
    this.sky.setVector3("horizon", new Vector3(1.0, 0.82, 0.66));
    this.sky.setVector3("zenith", new Vector3(0.26, 0.52, 0.88));
    this.sky.setVector3("sunCol", new Vector3(1.0, 0.75, 0.45));
    this.sky.setVector3("sunDir", this.sun.direction);
    const dome = MeshBuilder.CreateSphere("skydome", { diameter: 5600, segments: 16, sideOrientation: Mesh.BACKSIDE }, scene);
    dome.material = this.sky;
    dome.infiniteDistance = true;
    dome.applyFog = false;
    dome.isPickable = false;

    this.city = buildCity(world, scene, this.shadow);

    // pedestrians (thin instances)
    const pg = buildPersonGeo();
    this.peds = pg.toMesh("peds", scene, this.city.lit);
    this.pedBuf = new Float32Array(80 * 16);
    this.pedCol = new Float32Array(80 * 4).fill(1);
    this.peds.thinInstanceSetBuffer("matrix", this.pedBuf, 16, false);
    this.peds.thinInstanceSetBuffer("color", this.pedCol, 4, false);
    this.peds.thinInstanceCount = 0;
    this.peds.alwaysSelectAsActiveMesh = true;

    // passengers
    for (const a of ARCHETYPES) {
      const m = buildPassengerMesh(scene, a, this.city.lit);
      m.isVisible = false;
      this.passengerSrc.push(m);
    }

    // marker pools
    const beamTex = beamTexture(scene);
    for (let i = 0; i < 8; i++) {
      const ring = MeshBuilder.CreateTorus(`mring-${i}`, { diameter: 7, thickness: 0.35, tessellation: 40 }, scene);
      const icon = this.makeIcon("circle", `micon-${i}`);
      const beam = MeshBuilder.CreateCylinder(`mbeam-${i}`, { diameterTop: 1.6, diameterBottom: 1.6, height: 70, tessellation: 12, cap: Mesh.NO_CAP }, scene);
      const bm = new StandardMaterial(`mbeam-mat-${i}`, scene);
      bm.disableLighting = true;
      bm.emissiveTexture = beamTex;
      bm.opacityTexture = beamTex;
      bm.alphaMode = Engine.ALPHA_ADD;
      bm.backFaceCulling = false;
      bm.fogEnabled = false;
      bm.diffuseColor = Color3.Black();
      beam.material = bm;
      this.markers.push({ root: ring, icon, beam, person: null, arch: -1 });
    }
    this.destRing = MeshBuilder.CreateTorus("dring", { diameter: 12, thickness: 0.5, tessellation: 64 }, scene);
    this.destDisc = MeshBuilder.CreateDisc("ddisc", { radius: 6, tessellation: 48 }, scene);
    this.destDisc.rotation.x = Math.PI / 2;
    const ddm = new StandardMaterial("ddisc-mat", scene);
    ddm.disableLighting = true;
    ddm.emissiveColor = new Color3(1, 1, 1);
    ddm.alpha = 0.22;
    ddm.backFaceCulling = false;
    this.destDisc.material = ddm;
    this.destBeam = MeshBuilder.CreateCylinder("dbeam", { diameter: 7, height: 140, tessellation: 20, cap: Mesh.NO_CAP }, scene);
    const dbm = new StandardMaterial("dbeam-mat", scene);
    dbm.disableLighting = true;
    dbm.emissiveTexture = beamTex;
    dbm.opacityTexture = beamTex;
    dbm.alphaMode = Engine.ALPHA_ADD;
    dbm.backFaceCulling = false;
    dbm.fogEnabled = false;
    dbm.diffuseColor = Color3.Black();
    this.destBeam.material = dbm;
    this.lessonRing = MeshBuilder.CreateTorus("lring", { diameter: 9, thickness: 0.35, tessellation: 48 }, scene);
    this.lessonRing.material = this.tierMat("#ffffff");

    // route arrow: chunky chevron
    const ag = new Geo();
    const pts: [number, number][] = [[0, 1.3], [0.95, 0], [0.5, 0], [0.5, -1.1], [-0.5, -1.1], [-0.5, 0], [-0.95, 0]];
    ag.prism(pts.map(([x, z]) => [x * 1.15, z * 1.15] as [number, number]), 0, -0.3, 0, 0.3, [1, 1, 1]);
    this.arrowMat = new StandardMaterial("arrow", scene);
    this.arrowMat.disableLighting = true;
    this.arrowMat.emissiveColor = new Color3(1, 0.9, 0.4);
    this.arrowMat.diffuseColor = Color3.Black();
    this.arrowMat.backFaceCulling = false;
    this.arrowMat.alpha = 0.92;
    this.arrow = ag.toMesh("arrow", scene, this.arrowMat);
    this.arrow.useVertexColors = false;

    this.buildItems();
    this.buildProps();

    // particles
    const dot = softDot(scene);
    this.smoke = this.ps("smoke", 1500, dot, new Color4(0.92, 0.92, 0.94, 0.5), new Color4(0.8, 0.8, 0.82, 0.0), 0.8, 2.6, 1.2, 2.4);
    this.smoke.gravity = new Vector3(0, 0.9, 0);
    this.smoke.minEmitPower = 0.3; this.smoke.maxEmitPower = 1.2;
    this.dust = this.ps("dust", 1200, dot, new Color4(0.85, 0.74, 0.5, 0.55), new Color4(0.8, 0.7, 0.5, 0), 0.6, 1.6, 1.0, 2.2);
    this.dust.gravity = new Vector3(0, 0.4, 0);
    this.sparks = this.ps("sparks", 400, dot, new Color4(1, 0.85, 0.4, 1), new Color4(1, 0.4, 0.1, 0), 0.2, 0.55, 0.08, 0.2);
    this.sparks.gravity = new Vector3(0, -14, 0);
    this.sparks.minEmitPower = 5; this.sparks.maxEmitPower = 11;
    this.sparks.direction1 = new Vector3(-1, 0.4, -1); this.sparks.direction2 = new Vector3(1, 1.4, 1);
    this.sparks.emitRate = 0;
    this.sparks.blendMode = ParticleSystem.BLENDMODE_ADD;
    this.boostPs = this.ps("boost", 600, dot, new Color4(0.5, 1, 1, 0.9), new Color4(0.2, 0.5, 1, 0), 0.15, 0.45, 0.25, 0.6);
    this.boostPs.blendMode = ParticleSystem.BLENDMODE_ADD;
    this.boostPs.emitRate = 0;
    this.confetti = this.ps("confetti", 600, confettiTex(scene), new Color4(1, 0.3, 0.6, 1), new Color4(0.2, 0.9, 1, 1), 1.2, 2.4, 0.18, 0.32);
    this.confetti.gravity = new Vector3(0, -6, 0);
    this.confetti.minEmitPower = 6; this.confetti.maxEmitPower = 13;
    this.confetti.direction1 = new Vector3(-1, 2, -1); this.confetti.direction2 = new Vector3(1, 3, 1);
    this.confetti.minAngularSpeed = -6; this.confetti.maxAngularSpeed = 6;
    this.confetti.emitRate = 0;
    this.confetti.colorDead = new Color4(1, 0.85, 0.2, 0.0);
    this.splash = this.ps("splash", 600, dot, new Color4(0.85, 0.95, 1, 0.9), new Color4(0.6, 0.85, 1, 0), 0.5, 1.2, 0.6, 1.6);
    this.splash.gravity = new Vector3(0, -9, 0);
    this.splash.minEmitPower = 4; this.splash.maxEmitPower = 10;
    this.splash.direction1 = new Vector3(-1, 3, -1); this.splash.direction2 = new Vector3(1, 5, 1);
    this.splash.emitRate = 0;

    // post-processing
    this.pipeline = new DefaultRenderingPipeline("pipe", true, scene, [this.rig.cam]);
    this.pipeline.fxaaEnabled = true;
    this.pipeline.imageProcessingEnabled = true;
    const ip = this.pipeline.imageProcessing;
    ip.toneMappingEnabled = true;
    ip.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
    ip.exposure = 1.12;
    ip.contrast = 1.18;
    ip.vignetteEnabled = true;
    ip.vignetteWeight = 1.6;
    ip.vignetteColor = new Color4(0.2, 0.08, 0.12, 0);
    ip.colorCurvesEnabled = true;
    const curves = new ColorCurves();
    curves.globalSaturation = 38;
    curves.globalExposure = 0;
    curves.highlightsHue = 30;
    curves.highlightsDensity = 15;
    curves.highlightsSaturation = 20;
    ip.colorCurves = curves;
    this.applySettings(settings);

    this.time = 0;
    window.addEventListener("resize", () => this.engine.resize());
  }

  private makeShadows() {
    this.shadow = new ShadowGenerator(this.settings.quality === "high" ? 4096 : 2048, this.sun);
    this.shadow.usePercentageCloserFiltering = true;
    this.shadow.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
    this.shadow.bias = 0.0008;
    this.shadow.normalBias = 0.03;
    this.shadow.darkness = 0.45;
  }

  applySettings(s: RenderSettings) {
    this.settings = s;
    this.pipeline.bloomEnabled = s.bloom;
    this.pipeline.bloomThreshold = 0.78;
    this.pipeline.bloomWeight = 0.32;
    this.pipeline.bloomKernel = 48;
    this.pipeline.bloomScale = 0.5;
    this.baseScale = s.quality === "low" ? 1.5 : s.quality === "medium" ? 1.15 : 1 / Math.min(1.5, window.devicePixelRatio || 1);
    this.scaleLevel = this.baseScale;
    this.engine.setHardwareScalingLevel(this.scaleLevel);
    this.sun.shadowEnabled = s.shadows;
    if (this.shadow) this.shadow.getShadowMap()!.refreshRate = s.shadows ? 1 : 0;
    this.pipeline.chromaticAberrationEnabled = false;
  }

  private ps(name: string, cap: number, tex: import("@babylonjs/core").BaseTexture, c1: Color4, cDead: Color4, minLife: number, maxLife: number, minSize: number, maxSize: number): ParticleSystem {
    const p = new ParticleSystem(name, cap, this.scene);
    p.particleTexture = tex;
    p.emitter = new Vector3(0, -100, 0);
    p.color1 = c1;
    p.color2 = c1;
    p.colorDead = cDead;
    p.minLifeTime = minLife; p.maxLifeTime = maxLife;
    p.minSize = minSize; p.maxSize = maxSize;
    p.emitRate = 0;
    p.blendMode = ParticleSystem.BLENDMODE_STANDARD;
    p.minEmitBox = new Vector3(-0.5, 0, -0.5);
    p.maxEmitBox = new Vector3(0.5, 0.2, 0.5);
    p.start();
    return p;
  }

  private tierMat(color: string): StandardMaterial {
    let m = this.tierMats.get(color);
    if (!m) {
      m = new StandardMaterial(`tier-${color}`, this.scene);
      m.disableLighting = true;
      const c = hex(color);
      m.emissiveColor = new Color3(c[0], c[1], c[2]);
      m.diffuseColor = Color3.Black();
      m.backFaceCulling = false;
      this.tierMats.set(color, m);
    }
    return m;
  }

  private iconCache = new Map<string, Geo>();
  private makeIcon(shape: string, name: string): Mesh {
    let g = this.iconCache.get(shape);
    if (!g) {
      g = new Geo();
      const w: [number, number, number] = [1, 1, 1];
      if (shape === "circle") g.cyl(0, 0, 0, 1.1, 1.1, 0.3, 24, w, "z");
      else if (shape === "diamond") g.prism(polyPoints(4, 1.3, 0), 0, -0.15, 0, 0.15, w);
      else if (shape === "star") g.prism(starPoints(5, 0.6, 1.4), 0, -0.15, 0, 0.15, w);
      else g.prism(polyPoints(6, 1.2, 0), 0, -0.15, 0, 0.15, w);
      this.iconCache.set(shape, g);
    }
    const m = g.toMesh(name, this.scene, null);
    // prisms are built flat (xz); stand them up
    if (shape !== "circle") m.rotation.x = -Math.PI / 2;
    const holder = new Mesh(name + "-holder", this.scene);
    m.parent = holder;
    (holder as Mesh & { shapeMesh?: Mesh }).shapeMesh = m;
    return holder;
  }

  private buildItems() {
    const tokenG = new Geo();
    tokenG.cyl(0, 0, 0, 0.9, 0.9, 0.18, 20, hex("#5cf2ff"), "z");
    tokenG.prism(polyPoints(3, 0.55, Math.PI / 2), 0, 0.1, 0, 0.26, hex("#ffffff"));
    const token = tokenG.toMesh("token-src", this.scene, glowMaterial(this.scene, "tokenmat"));
    token.isVisible = false;
    const sparkG = new Geo();
    sparkG.prism(starPoints(4, 0.35, 1.0), 0, -0.15, 0, 0.15, hex("#ffe14d"));
    const spark = sparkG.toMesh("spark-src", this.scene, glowMaterial(this.scene, "sparkmat"));
    spark.isVisible = false;
    const archG = new Geo();
    archG.box(-3, 2.6, 0, 0.5, 5.2, 0.5, hex("#2b2d42"));
    archG.box(3, 2.6, 0, 0.5, 5.2, 0.5, hex("#2b2d42"));
    const arch = archG.toMesh("repair-src", this.scene, this.city.lit);
    arch.isVisible = false;
    const archGlowG = new Geo();
    archGlowG.box(0, 5.2, 0, 6.6, 0.6, 0.6, hex("#3ee06d"));
    archGlowG.box(0, 6.2, 0, 1.8, 1.0, 0.3, hex("#3ee06d"));
    const archGlow = archGlowG.toMesh("repair-glow-src", this.scene, glowMaterial(this.scene, "repairmat"));
    archGlow.isVisible = false;
    for (const it of this.world.items) {
      const y = this.world.heightAt(it.x, it.z);
      if (it.kind === "repair") {
        const ne = this.world.nearestEdge(it.x, it.z)!;
        const yaw = Math.atan2(ne.edge.dx, ne.edge.dz) + Math.PI / 2;
        const a = arch.createInstance(`repair-${it.id}`);
        a.position.set(it.x, y, it.z);
        a.rotation.y = yaw;
        const gl = archGlow.createInstance(`repairg-${it.id}`);
        gl.position.set(it.x, y, it.z);
        gl.rotation.y = yaw;
        gl.parent = null;
        this.itemMeshes.set(it.id, gl);
      } else {
        const src = it.kind === "token" ? token : spark;
        const m = src.createInstance(`item-${it.id}`);
        m.position.set(it.x, y + 1.5, it.z);
        if (it.kind === "spark") m.rotation.x = -Math.PI / 2;
        this.itemMeshes.set(it.id, m);
      }
    }
  }

  private buildProps() {
    const srcs: Record<string, Mesh> = {};
    const cone = new Geo();
    cone.cyl(0, 0.4, 0, 0.3, 0.05, 0.8, 10, hex("#ff7a1f"));
    cone.cyl(0, 0.45, 0, 0.21, 0.17, 0.12, 10, hex("#ffffff"), "y", false);
    cone.box(0, 0.03, 0, 0.6, 0.06, 0.6, hex("#ff7a1f"));
    const crate = new Geo();
    crate.box(0, 0.4, 0, 0.8, 0.8, 0.8, hex("#c68b4e"), 0, { top: hex("#e0a96a") });
    crate.box(0, 0.82, 0, 0.7, 0.06, 0.7, hex("#ff6b6b"));
    const chair = new Geo();
    chair.box(0, 0.45, 0, 0.5, 0.06, 0.5, hex("#19b5b0"));
    chair.box(0, 0.75, -0.22, 0.5, 0.6, 0.06, hex("#19b5b0"));
    for (const [x, z] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) chair.box(x, 0.22, z, 0.05, 0.45, 0.05, hex("#26323d"));
    const barrier = new Geo();
    barrier.box(0, 0.5, 0, 1.6, 0.5, 0.25, hex("#ffcc33"));
    barrier.box(-0.6, 0.25, 0, 0.12, 0.5, 0.4, hex("#26323d"));
    barrier.box(0.6, 0.25, 0, 0.12, 0.5, 0.4, hex("#26323d"));
    srcs.cone = cone.toMesh("cone", this.scene, this.city.lit);
    srcs.crate = crate.toMesh("crate", this.scene, this.city.lit);
    srcs.chair = chair.toMesh("chair", this.scene, this.city.lit);
    srcs.barrier = barrier.toMesh("barrier", this.scene, this.city.lit);
    for (const s of Object.values(srcs)) s.isVisible = false;
    for (const p of this.world.props) {
      const m = srcs[p.kind].createInstance(`prop-${p.id}`);
      m.rotationQuaternion = new Quaternion();
      this.propMeshes.push(m);
    }
  }

  // ------------------------------------------------------------------ session binding
  setSession(s: Session | null, livery?: { body: string; trim: string; accent: string }) {
    this.session = s;
    this.livery = livery;
    if (this.taxi) {
      for (const m of this.taxi.meshes) m.dispose();
      this.taxi.root.dispose();
      this.taxi = null;
    }
    for (const t of this.trafficInst) { t.lit?.dispose(); t.glow?.dispose(); }
    this.trafficInst = [];
    for (const mk of this.markers) {
      mk.person?.dispose();
      mk.person = null;
      mk.arch = -1;
    }
    this.boarding?.dispose();
    this.boarding = null;
    if (s) {
      this.taxi = buildTaxi(this.scene, s.taxi, this.city.lit, this.city.glow, livery);
      if (this.shadow) for (const m of this.taxi.meshes) this.shadow.addShadowCaster(m, false);
      for (let i = 0; i < s.traffic.agents.length; i++) this.trafficInst.push({ key: "", lit: null!, glow: null! });
      this.rig.snap();
    }
  }

  private trafficSource(type: number, color: number) {
    const key = `${type}-${color}`;
    let src = this.trafficSources.get(key);
    if (!src) {
      const g = buildTrafficGeo(type, TRAFFIC_COLORS[color]);
      const lit = g.lit.toMesh(`tr-${key}`, this.scene, this.city.lit);
      const glow = g.glow.toMesh(`trg-${key}`, this.scene, this.city.glow);
      lit.isVisible = false;
      glow.isVisible = false;
      if (this.shadow) this.shadow.addShadowCaster(lit, false);
      src = { lit, glow };
      this.trafficSources.set(key, src);
    }
    return { key, src };
  }

  // ------------------------------------------------------------------ per-frame
  handleEvents(events: GameEvent[]) {
    const s = this.session;
    if (!s) return;
    for (const e of events) {
      switch (e.type) {
        case "collision":
          if (e.impact > 3) {
            this.burst(this.sparks, e.x, s.v.y + 0.6, e.z, Math.min(80, 10 + e.impact * 4));
            this.rig.impulse(Math.min(1, e.impact / 18));
          }
          break;
        case "deliver":
          if (!this.settings.photosensitive) this.burst(this.confetti, s.v.x, s.v.y + 2, s.v.z, 160);
          break;
        case "splash": this.burst(this.splash, e.x, 0.2, e.z, 200); break;
        case "land": if (e.impact > 6) this.rig.impulse(Math.min(0.6, e.impact / 25)); break;
        case "pickup": {
          const arch = ARCHETYPES[e.fare.archetype];
          this.boarding?.dispose();
          this.boarding = this.passengerSrc[arch.id].createInstance("boarding");
          this.boardingFrom.set(e.fare.pickup.px, this.world.heightAt(e.fare.pickup.px, e.fare.pickup.pz) + 0.15, e.fare.pickup.pz);
          break;
        }
        case "item": this.burst(this.sparks, e.x, this.world.heightAt(e.x, e.z) + 1.5, e.z, 30); break;
        case "reset": this.rig.snap(); break;
      }
    }
  }

  private burst(p: ParticleSystem, x: number, y: number, z: number, n: number) {
    (p.emitter as Vector3).set(x, y, z);
    p.manualEmitCount = n;
  }

  render(dt: number, alpha: number, cam: CamControls) {
    this.time += dt;
    const s = this.session;
    // dynamic resolution
    this.fpsAvg = lerp(this.fpsAvg, 1 / Math.max(dt, 1 / 240), 0.05);
    if (this.settings.dynamicRes) {
      if (this.fpsAvg < 50 && this.scaleLevel < this.baseScale * 1.7) {
        this.scaleLevel += 0.02;
        this.engine.setHardwareScalingLevel(this.scaleLevel);
      } else if (this.fpsAvg > 58 && this.scaleLevel > this.baseScale) {
        this.scaleLevel = Math.max(this.baseScale, this.scaleLevel - 0.01);
        this.engine.setHardwareScalingLevel(this.scaleLevel);
      }
    }
    for (const f of this.city.ferris) f.rotation.y += dt * 0.12;
    const wm = this.city.water.bumpTexture;
    if (wm && !this.settings.reducedMotion) { (wm as import("@babylonjs/core").Texture).uOffset += dt * 0.004; (wm as import("@babylonjs/core").Texture).vOffset += dt * 0.006; }

    if (!s) {
      this.rig.orbit(this.time, 60, -60, 260, 95);
      this.hideDynamic();
      this.updateSun(0, 0, 0, 0);
      this.scene.render();
      return;
    }
    const v = s.v, pv = s.prev;
    const x = lerp(pv.x, v.x, alpha), y = lerp(pv.y, v.y, alpha), z = lerp(pv.z, v.z, alpha);
    const yaw = pv.yaw + wrapAngle(v.yaw - pv.yaw) * alpha;
    const sp = speedOf(v);
    this.updateTaxi(s, x, y, z, yaw, dt);
    this.updateTraffic(s, alpha);
    this.updatePeds(s);
    this.updateMarkers(s, dt);
    this.updateItemsProps(s, dt);
    this.updateParticles(s, x, y, z, yaw, sp);
    this.signalTimer -= dt;
    if (this.signalTimer <= 0) {
      this.signalTimer = 0.25;
      const sh = this.city.signalHeads;
      sh.nodes.forEach((n, i) => {
        const st = signalState(this.world, n.node, n.axis, s.traffic.time);
        const c = st === "green" ? [0.2, 1, 0.45] : st === "yellow" ? [1, 0.8, 0.1] : [1, 0.15, 0.12];
        sh.colors[i * 4] = c[0]; sh.colors[i * 4 + 1] = c[1]; sh.colors[i * 4 + 2] = c[2]; sh.colors[i * 4 + 3] = 1;
      });
      sh.mesh.thinInstanceBufferUpdated("color");
    }
    this.rig.update(dt, {
      x, y, z, yaw, vx: v.vx, vz: v.vz, speed: sp, forward: forwardSpeed(v), drifting: v.drifting,
      driftAngle: driftAngle(v), airborne: !v.grounded, boosting: v.boosting,
    }, cam, { shake: this.settings.shake, reducedMotion: this.settings.reducedMotion, fovScale: this.settings.fovScale });
    this.updateSun(x, z, s.time, y);
    this.pipeline.chromaticAberrationEnabled = v.boosting && !this.settings.reducedMotion && !this.settings.photosensitive;
    if (this.pipeline.chromaticAberrationEnabled) this.pipeline.chromaticAberration.aberrationAmount = 18;
    this.scene.render();
  }

  private updateSun(x: number, z: number, t: number, y: number) {
    // late afternoon drifting slightly toward sunset during long runs (visibility preserved)
    const k = Math.min(1, t / 720);
    const dir = new Vector3(0.62 + 0.12 * k, -0.5 + 0.12 * k, 0.6).normalize();
    this.sun.direction.copyFrom(dir);
    this.sun.diffuse.set(1.0, 0.88 - 0.1 * k, 0.72 - 0.16 * k);
    this.sky.setVector3("sunDir", dir);
    this.sun.position.set(x - dir.x * 400, y - dir.y * 400, z - dir.z * 400);
  }

  private hideDynamic() {
    for (const mk of this.markers) { mk.root.isVisible = false; mk.icon.getChildMeshes().forEach((m) => (m.isVisible = false)); mk.beam.isVisible = false; if (mk.person) mk.person.isVisible = false; }
    this.destRing.isVisible = this.destBeam.isVisible = this.destDisc.isVisible = false;
    this.arrow.isVisible = false;
    this.lessonRing.isVisible = false;
    this.peds.thinInstanceCount = 0;
  }

  private updateTaxi(s: Session, x: number, y: number, z: number, yaw: number, dt: number) {
    const t = this.taxi!;
    const v = s.v;
    t.root.position.set(x, y, z);
    t.root.rotation.y = yaw;
    t.body.rotation.x = -v.pitch;
    t.body.rotation.z = v.roll;
    t.body.position.y = Math.sin(this.time * 40) * 0.006 * Math.min(1, speedOf(v) / 20);
    const steerA = v.steer * 0.45;
    t.wheelPivots[0].rotation.y = steerA;
    t.wheelPivots[1].rotation.y = steerA;
    t.wheels.forEach((w, i) => {
      w.rotation.x = v.wheelSpin * (i % 2 === 0 ? -1 : 1) * (i % 2 === 0 ? 1 : 1);
      t.wheelPivots[i].position.y = 0.34 + v.susp[i] * 0.6;
    });
    for (const f of t.fans) f.rotation.z += dt * (8 + speedOf(v) * 0.8 + (v.boosting ? 30 : 0));
    t.brake.isVisible = s.phase === "play" && (forwardSpeed(v) > 0.5 ? false : false) || v.prevBrake;
    t.boostGlow.isVisible = v.boosting;
    if (s.active) drawFareSign(t, `$${Math.round(s.active.tips)}`, TIER_INFO[s.active.fare.tier].color);
    else drawFareSign(t, "FREE", "#7dffaf");
  }

  private updateTraffic(s: Session, alpha: number) {
    const agents = s.traffic.agents;
    for (let i = 0; i < agents.length; i++) {
      const a = agents[i];
      const slot = this.trafficInst[i];
      if (!a.active) {
        if (slot.lit) { slot.lit.isVisible = false; slot.glow.isVisible = false; }
        continue;
      }
      const { key, src } = this.trafficSource(a.type, a.color);
      if (slot.key !== key) {
        slot.lit?.dispose();
        slot.glow?.dispose();
        slot.lit = src.lit.createInstance(`tri-${i}`);
        slot.glow = src.glow.createInstance(`trgi-${i}`);
        slot.key = key;
      }
      slot.lit.isVisible = slot.glow.isVisible = true;
      const x = lerp(a.px, a.x, alpha), z = lerp(a.pz, a.z, alpha), y = lerp(a.py, a.y, alpha);
      const yaw = a.pyaw + wrapAngle(a.yaw - a.pyaw) * alpha;
      for (const m of [slot.lit, slot.glow]) {
        m.position.set(x, y, z);
        m.rotation.y = yaw;
        m.rotation.z = a.mode === "knocked" ? Math.sin(a.knockTime * 9) * 0.05 * Math.max(0, 1.2 - a.knockTime) : 0;
      }
    }
  }

  private updatePeds(s: Session) {
    const peds = s.peds.peds;
    let n = 0;
    const m = Matrix.Identity();
    const q = new Quaternion();
    const pal = [[1, 0.42, 0.42], [0.3, 0.75, 0.95], [1, 0.8, 0.3], [0.5, 0.85, 0.5], [0.85, 0.5, 0.95], [1, 0.6, 0.3], [0.95, 0.95, 0.9], [0.35, 0.45, 0.75], [0.95, 0.45, 0.7], [0.4, 0.8, 0.75], [0.7, 0.6, 0.45], [0.9, 0.3, 0.3]];
    for (const p of peds) {
      if (!p.active || n >= 80) continue;
      const hop = p.hopT > 0 ? Math.sin((p.hopT / 0.45) * Math.PI) * 0.7 : Math.abs(Math.sin(p.phase)) * 0.04;
      Quaternion.RotationYawPitchRollToRef(p.yaw, 0, 0, q);
      Matrix.ComposeToRef(new Vector3(1, 1, 1), q, new Vector3(p.x, p.y + 0.15 + hop, p.z), m);
      m.copyToArray(this.pedBuf, n * 16);
      const c = pal[p.color % pal.length];
      this.pedCol[n * 4] = c[0]; this.pedCol[n * 4 + 1] = c[1]; this.pedCol[n * 4 + 2] = c[2]; this.pedCol[n * 4 + 3] = 1;
      n++;
    }
    this.peds.thinInstanceCount = n;
    this.peds.thinInstanceBufferUpdated("matrix");
    this.peds.thinInstanceBufferUpdated("color");
  }

  private updateMarkers(s: Session, dt: number) {
    const showCands = !s.active;
    const cands = s.fares.candidates;
    const cb = this.settings.colorblind;
    for (let i = 0; i < this.markers.length; i++) {
      const mk = this.markers[i];
      const c = cands[i];
      const vis = !!c && (showCands || false);
      mk.root.isVisible = vis;
      mk.beam.isVisible = vis;
      mk.icon.getChildMeshes().forEach((m) => (m.isVisible = vis));
      if (!vis) {
        if (mk.person) mk.person.isVisible = false;
        continue;
      }
      const info = TIER_INFO[c.tier];
      const color = cb ? ({ short: "#56b4e9", medium: "#e69f00", long: "#cc79a7", special: "#f0e442" } as Record<string, string>)[c.tier] : info.color;
      const mat = this.tierMat(color);
      const y = this.world.heightAt(c.pickup.x, c.pickup.z);
      mk.root.material = mat;
      mk.root.position.set(c.pickup.x, y + 0.15, c.pickup.z);
      const holder = mk.icon as Mesh & { shapeMesh?: Mesh; shapeKey?: string };
      if (holder.shapeKey !== info.shape) {
        holder.shapeMesh?.dispose();
        const fresh = this.makeIcon(info.shape, `icon-${i}-${info.shape}`) as Mesh & { shapeMesh?: Mesh };
        const sm = fresh.shapeMesh!;
        sm.parent = holder;
        fresh.dispose();
        holder.shapeMesh = sm;
        holder.shapeKey = info.shape;
      }
      holder.shapeMesh!.material = mat;
      const py = this.world.heightAt(c.pickup.px, c.pickup.pz);
      holder.position.set(c.pickup.px, py + 3.4 + Math.sin(this.time * 2.4 + i) * 0.25 + (c.tier === "long" ? 0.6 : c.tier === "medium" ? 0.3 : 0), c.pickup.pz);
      holder.rotation.y += dt * 1.6;
      const sc = c.tier === "long" ? 1.25 : c.tier === "medium" ? 1.1 : 0.95;
      holder.scaling.set(sc, sc, sc);
      mk.beam.position.set(c.pickup.px, py + 35, c.pickup.pz);
      const near = Math.hypot(c.pickup.px - s.v.x, c.pickup.pz - s.v.z);
      mk.beam.visibility = Math.max(0, Math.min(1, (near - 12) / 30));
      (mk.beam.material as StandardMaterial).emissiveColor = mat.emissiveColor;
      if (mk.arch !== c.archetype) {
        mk.person?.dispose();
        mk.person = this.passengerSrc[c.archetype].createInstance(`cand-${i}`);
        mk.arch = c.archetype;
      }
      const p = mk.person!;
      p.isVisible = true;
      p.position.set(c.pickup.px, py + 0.15 + Math.abs(Math.sin(this.time * 5 + i)) * 0.12, c.pickup.pz);
      p.rotation.y = Math.atan2(c.pickup.x - c.pickup.px, c.pickup.z - c.pickup.pz);
    }
    // boarding animation (<= 1 s): passenger hops from curb into the cab
    if (this.boarding && s.active && s.active.boardT > 0) {
      const t = 1 - s.active.boardT;
      const tx = s.v.x, tz = s.v.z, ty = s.v.y + 0.4;
      this.boarding.position.set(lerp(this.boardingFrom.x, tx, t), lerp(this.boardingFrom.y, ty, t) + Math.sin(t * Math.PI) * 1.2, lerp(this.boardingFrom.z, tz, t));
      const k = 1 - t * 0.7;
      this.boarding.scaling.set(k, k, k);
    } else if (this.boarding) {
      this.boarding.dispose();
      this.boarding = null;
    }
    // destination
    const dest = s.active?.fare.dest;
    const show = !!dest;
    this.destRing.isVisible = this.destBeam.isVisible = this.destDisc.isVisible = show;
    if (dest) {
      const color = TIER_INFO[s.active!.fare.tier].color;
      const mat = this.tierMat(color);
      const y = this.world.heightAt(dest.x, dest.z);
      this.destRing.material = mat;
      this.destRing.position.set(dest.x, y + 0.2 + Math.sin(this.time * 3) * 0.05, dest.z);
      this.destDisc.position.set(dest.x, y + 0.12, dest.z);
      (this.destDisc.material as StandardMaterial).emissiveColor = mat.emissiveColor;
      this.destBeam.position.set(dest.x, y + 70, dest.z);
      this.destBeam.visibility = Math.max(0.15, Math.min(1, (Math.hypot(dest.x - s.v.x, dest.z - s.v.z) - 10) / 40));
      (this.destBeam.material as StandardMaterial).emissiveColor = mat.emissiveColor;
    }
    // lesson target
    const tg = s.target;
    this.lessonRing.isVisible = !!tg && tg.kind === "lesson" && !!s.lesson && (s.lesson.goal.kind === "stopInBox" || s.lesson.goal.kind === "precision");
    if (this.lessonRing.isVisible && tg) {
      const r = s.lesson!.goal.kind === "precision" ? 1.5 : 4.5;
      this.lessonRing.scaling.set(r / 4.5, 1, r / 4.5);
      this.lessonRing.position.set(tg.x, this.world.heightAt(tg.x, tg.z) + 0.2, tg.z);
    }
    // arrow
    const ar = s.arrow;
    this.arrow.isVisible = !!ar && s.phase !== "done";
    if (ar) {
      const v = s.v;
      const ang = Math.atan2(ar[0] - v.x, ar[1] - v.z);
      const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw);
      const bob = this.settings.reducedMotion ? 0 : Math.sin(this.time * 4) * 0.08;
      this.arrow.position.set(v.x + fx * 4.6, v.y + 2.4 + bob, v.z + fz * 4.6);
      this.arrow.rotation.y = ang;
      this.arrow.rotation.x = -0.5;
      const col = s.active ? TIER_INFO[s.active.fare.tier].color : tg?.kind === "lesson" ? "#ffffff" : "#ffe37a";
      const c = hex(col);
      this.arrowMat.emissiveColor.set(c[0], c[1], c[2]);
      const sc = s.active ? 0.58 : 0.45;
      this.arrow.scaling.set(sc, sc, sc);
    }
  }

  private updateItemsProps(s: Session, dt: number) {
    for (const it of this.world.items) {
      const m = this.itemMeshes.get(it.id)!;
      const taken = s.collected.has(it.id) || (it.kind === "spark" && (!s.usesClock || s.sparks >= 3));
      m.isVisible = !taken;
      if (!taken && it.kind !== "repair") {
        m.rotation.y += dt * 2;
        m.position.y = this.world.heightAt(it.x, it.z) + 1.5 + Math.sin(this.time * 3 + it.id) * 0.2;
      }
    }
    s.props.forEach((p, i) => {
      const m = this.propMeshes[i];
      m.position.set(p.x, p.y, p.z);
      Quaternion.RotationYawPitchRollToRef(p.yaw, p.hit ? p.t * p.spin * 0.3 : 0, p.hit ? p.t * p.spin * 0.2 : 0, m.rotationQuaternion!);
    });
  }

  private updateParticles(s: Session, x: number, y: number, z: number, yaw: number, sp: number) {
    const v = s.v;
    const fx = Math.sin(yaw), fz = Math.cos(yaw);
    const rear = s.taxi.wheelbase / 2;
    const ex = x - fx * rear, ez = z - fz * rear;
    (this.smoke.emitter as Vector3).set(ex, y + 0.2, ez);
    (this.dust.emitter as Vector3).set(ex, y + 0.2, ez);
    const offroad = v.surface === "sand" || v.surface === "grass" || v.surface === "water";
    const slip = v.grounded ? v.slip : 0;
    const smokeRate = !offroad && sp > 4 && slip > 0.35 ? (slip - 0.3) * 320 : 0;
    this.smoke.emitRate = this.settings.quality === "low" ? smokeRate * 0.4 : smokeRate;
    const dustRate = offroad && sp > 4 && v.grounded ? Math.min(200, sp * 6 + slip * 120) : 0;
    this.dust.emitRate = dustRate;
    if (v.surface === "water") { this.dust.color1 = new Color4(0.85, 0.95, 1, 0.7); this.dust.color2 = this.dust.color1; }
    else if (v.surface === "grass") { this.dust.color1 = new Color4(0.5, 0.62, 0.3, 0.6); this.dust.color2 = new Color4(0.55, 0.42, 0.28, 0.5); }
    else { this.dust.color1 = new Color4(0.9, 0.8, 0.56, 0.6); this.dust.color2 = this.dust.color1; }
    const top = s.taxi.height + 0.2;
    (this.boostPs.emitter as Vector3).set(x - fx * (s.taxi.length * 0.2), y + top, z - fz * (s.taxi.length * 0.2));
    this.boostPs.emitRate = v.boosting ? 260 : 0;
    this.boostPs.direction1 = new Vector3(-fx * 3 - 0.3, 0.2, -fz * 3 - 0.3);
    this.boostPs.direction2 = new Vector3(-fx * 5 + 0.3, 0.6, -fz * 5 + 0.3);
    this.smoke.direction1 = new Vector3(-fx - 0.5, 0.3, -fz - 0.5);
    this.smoke.direction2 = new Vector3(-fx + 0.5, 1, -fz + 0.5);
    this.dust.direction1 = this.smoke.direction1;
    this.dust.direction2 = this.smoke.direction2;
  }

  /** Project a world point to CSS pixels; returns null when behind the camera. */
  project(x: number, y: number, z: number): { x: number; y: number; onScreen: boolean } | null {
    const cam = this.rig.cam;
    const w = this.engine.getRenderWidth(), h = this.engine.getRenderHeight();
    const p = Vector3.Project(new Vector3(x, y, z), Matrix.Identity(), this.scene.getTransformMatrix(), cam.viewport.toGlobal(w, h));
    const view = cam.getViewMatrix();
    const vp = Vector3.TransformCoordinates(new Vector3(x, y, z), view);
    const rect = this.canvas.getBoundingClientRect();
    const sx = (p.x / w) * rect.width, sy = (p.y / h) * rect.height;
    if (vp.z < 0) return { x: rect.width - sx, y: rect.height - sy, onScreen: false };
    return { x: sx, y: sy, onScreen: sx > 0 && sx < rect.width && sy > 0 && sy < rect.height };
  }

  get fps(): number {
    return this.engine.getFps();
  }

  void(_m: AbstractMesh) {}
}

export { litMaterial };
