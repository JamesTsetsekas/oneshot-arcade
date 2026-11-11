// Babylon scene: owns the engine, lighting, sky, the static city and all dynamic visuals. It reads the
// session state every frame (interpolated between fixed steps) and never feeds anything back into it.
import {
  Engine, Scene, TargetCamera, Vector3, Color3, Color4, HemisphericLight, DirectionalLight, ShadowGenerator, Mesh, MeshBuilder,
  TransformNode, StandardMaterial, ParticleSystem, Quaternion, DefaultRenderingPipeline, VertexBuffer, Matrix, InstancedMesh, Texture,
} from '@babylonjs/core';
import { WorldModel } from '../world/model';
import { WORLD_W, WORLD_D } from '../world/galeport';
import { buildCity, City, glowMat } from './city';
import { buildTaxi, TaxiVisual, buildTrafficVisual, TrafficVisual, buildPassengerMesh } from './vehicles';
import { MeshBuf, hex, RGB } from './meshbuf';
import { softDotTexture, squareTexture } from './textures';
import { Session, SessionEvent } from '../game-session/session';
import { TAXIS, TaxiId, TaxiSpec } from '../vehicle/taxiSpecs';
import { ChaseCamera } from '../camera-input/chaseCamera';
import { ViewControls } from '../camera-input/input';
import { TIERS, Tier, PICKUP_RADIUS, DROP_RADIUS } from '../fares/fares';
import { ARCHETYPES } from '../fares/passengers';
import { V3, lerp, quatSlerp, clamp01, rotate, Quat } from '../core/math';
import { SURFACES } from '../world/galeport';

export type Quality = 'low' | 'medium' | 'high';
const SUN_DIR = new Vector3(0.55, -0.56, 0.5).normalize(); // direction the light travels
const HAZE = new Color3(0.9, 0.88, 0.84);

interface CandidateVisual {
  icon: InstancedMesh;
  ring: InstancedMesh;
  beam: InstancedMesh;
  figure: Mesh;
  tier: Tier;
  site: number;
}
interface Cheer {
  mesh: Mesh;
  t: number;
  y: number;
}

export class GameView {
  engine: Engine;
  scene: Scene;
  camera: TargetCamera;
  chase: ChaseCamera;
  city: City;
  private sun: DirectionalLight;
  private shadows: ShadowGenerator | null = null;
  private pipeline: DefaultRenderingPipeline | null = null;
  private taxi: TaxiVisual | null = null;
  private taxiSpec: TaxiSpec | null = null;
  private traffic: TrafficVisual;
  private session: Session | null = null;
  private candVis = new Map<number, CandidateVisual>();
  private protoIcon: Record<Tier, Mesh>;
  private protoRing: Record<Tier, Mesh>;
  private protoBeam: Record<Tier, Mesh>;
  private destRing: Mesh;
  private destColumn: Mesh;
  private destIcon: Mesh;
  private destMat: StandardMaterial;
  private vane: TransformNode;
  private vaneDial!: TransformNode;
  private vaneParts: Mesh[] = [];
  private vaneMat: StandardMaterial;
  private figureMat: StandardMaterial;
  private cheers: Cheer[] = [];
  private pickupProto!: { tailwind: Mesh; clock: Mesh };
  private pickupVis: InstancedMesh[] = [];
  private crowdMesh!: Mesh;
  private crowd: { edge: number; side: number; s: number; dir: number; speed: number; hop: number; phase: number; x: number; z: number }[] = [];
  private crowdMat = new Float32Array(0);
  crowdCount = 56;
  private smoke: ParticleSystem;
  private sparks: ParticleSystem;
  private confetti: ParticleSystem;
  private boostFx: ParticleSystem;
  private time = 0;
  private quality: Quality = 'medium';
  private resScale = 1;
  private fpsAvg = 60;
  private fpsTimer = 0;
  dynamicResolution = true;
  showcaseYaw = 0;
  /** Tooling override: fixed camera pose used by the screenshot/benchmark scripts. */
  debugCam: { pos: V3; target: V3; fov?: number } | null = null;
  /** Interpolated taxi state for HUD/audio consumers. */
  taxiPos: V3 = { x: 0, y: 0, z: 0 };
  taxiYaw = 0;

  constructor(canvas: HTMLCanvasElement, public model: WorldModel) {
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: false, powerPreference: 'high-performance' }, false);
    const scene = new Scene(this.engine);
    this.scene = scene;
    scene.clearColor = new Color4(HAZE.r, HAZE.g, HAZE.b, 1);
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.00068;
    scene.fogColor = HAZE;
    scene.skipPointerMovePicking = true;
    scene.autoClear = true;

    this.camera = new TargetCamera('cam', new Vector3(WORLD_W / 2, 120, -80), scene);
    this.camera.setTarget(new Vector3(WORLD_W / 2, 20, WORLD_D / 2));
    this.chase = new ChaseCamera(this.camera);

    const hemi = new HemisphericLight('hemi', new Vector3(0.1, 1, -0.1), scene);
    hemi.intensity = 0.56;
    hemi.diffuse = new Color3(0.86, 0.92, 1);
    hemi.groundColor = new Color3(0.62, 0.56, 0.5);
    hemi.specular = Color3.Black();
    this.sun = new DirectionalLight('sun', SUN_DIR, scene);
    this.sun.intensity = 0.78;
    this.sun.diffuse = new Color3(1, 0.93, 0.8);
    this.sun.specular = new Color3(1, 0.95, 0.85);

    this.buildSky();
    this.city = buildCity(scene, model);
    this.traffic = buildTrafficVisual(scene);

    // Fare markers.
    const tierMat = (t: Tier, alpha = 1) => { const m = glowMat(scene, `tier-${t}-${alpha}`, hex(TIERS[t].color)); m.alpha = alpha; return m; };
    const star = new MeshBuf();
    {
      const pts: [number, number][] = [];
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.75 : 1.7; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
      for (let i = 0; i < 10; i++) {
        const [z0, y0] = pts[i], [z1, y1] = pts[(i + 1) % 10];
        for (const s of [-1, 1]) star.tri({ x: s * 0.28, y: 0, z: 0 }, { x: s * 0.28, y: y0, z: z0 }, { x: s * 0.28, y: y1, z: z1 }, [1, 1, 1], { x: s, y: 0, z: 0 });
        star.quad({ x: -0.28, y: y0, z: z0 }, { x: 0.28, y: y0, z: z0 }, { x: 0.28, y: y1, z: z1 }, { x: -0.28, y: y1, z: z1 }, [0.8, 0.8, 0.8], { x: 0, y: (y0 + y1) / 2, z: (z0 + z1) / 2 });
      }
    }
    const disc = MeshBuilder.CreateCylinder('icon-short', { height: 0.5, diameter: 2.7, tessellation: 20 }, scene);
    disc.rotation.z = Math.PI / 2; disc.bakeCurrentTransformIntoVertices();
    const diamond = MeshBuilder.CreatePolyhedron('icon-medium', { type: 1, size: 1.25 }, scene);
    diamond.scaling.y = 1.35; diamond.bakeCurrentTransformIntoVertices();
    const hexagon = MeshBuilder.CreateCylinder('icon-special', { height: 0.6, diameter: 3, tessellation: 6 }, scene);
    hexagon.rotation.z = Math.PI / 2; hexagon.bakeCurrentTransformIntoVertices();
    this.protoIcon = { short: disc, medium: diamond, long: star.toMesh('icon-long', scene, null), special: hexagon };
    this.protoRing = {} as Record<Tier, Mesh>;
    this.protoBeam = {} as Record<Tier, Mesh>;
    for (const t of Object.keys(TIERS) as Tier[]) {
      this.protoIcon[t].material = tierMat(t);
      this.protoRing[t] = MeshBuilder.CreateTorus(`ring-${t}`, { diameter: PICKUP_RADIUS * 2, thickness: 0.42, tessellation: 40 }, scene);
      this.protoRing[t].material = tierMat(t);
      this.protoBeam[t] = MeshBuilder.CreateCylinder(`beam-${t}`, { height: 34, diameterTop: 1.6, diameterBottom: 0.3, tessellation: 8, cap: Mesh.NO_CAP }, scene);
      this.protoBeam[t].material = tierMat(t, 0.32);
      for (const m of [this.protoIcon[t], this.protoRing[t], this.protoBeam[t]]) { m.isVisible = false; m.isPickable = false; m.applyFog = false; }
    }
    this.destMat = glowMat(scene, 'dest', [1, 0.3, 0.8]);
    this.destRing = MeshBuilder.CreateTorus('dest-ring', { diameter: DROP_RADIUS * 2, thickness: 0.6, tessellation: 48 }, scene);
    this.destRing.material = this.destMat;
    const colMat = glowMat(scene, 'dest-col', [1, 1, 1]);
    colMat.alpha = 0.2;
    this.destColumn = MeshBuilder.CreateCylinder('dest-col', { height: 90, diameterTop: DROP_RADIUS * 2.1, diameterBottom: DROP_RADIUS * 1.9, tessellation: 24, cap: Mesh.NO_CAP }, scene);
    this.destColumn.material = colMat;
    colMat.backFaceCulling = false;
    this.destIcon = MeshBuilder.CreatePolyhedron('dest-icon', { type: 1, size: 2.2 }, scene);
    this.destIcon.material = this.destMat;
    for (const m of [this.destRing, this.destColumn, this.destIcon]) { m.isPickable = false; m.setEnabled(false); m.applyFog = false; }

    // Route vane: a dial of three chevrons floating over the cab, tilted towards the camera so the
    // direction reads in screen space (up = straight on, left/right = turn, down = behind you).
    this.vane = new TransformNode('vane', scene);
    this.vaneDial = new TransformNode('vane-dial', scene);
    this.vaneDial.parent = this.vane;
    this.vaneMat = glowMat(scene, 'vane', [0.2, 1, 0.9]);
    const chev = new MeshBuf();
    for (const s of [-1, 1]) {
      const q: Quat = { x: 0, y: Math.sin((-s * 0.74) / 2), z: 0, w: Math.cos((-s * 0.74) / 2) };
      chev.box({ x: s * 0.36, y: -0.05, z: 0.0 }, 0.2, 0.03, 0.62, q, [0.05, 0.1, 0.14]);
      chev.box({ x: s * 0.36, y: 0, z: 0.0 }, 0.13, 0.05, 0.55, q, [1, 1, 1]);
    }
    for (let i = 0; i < 3; i++) {
      const m = i === 0 ? chev.toMesh('vane-chevron', scene, this.vaneMat) : this.vaneParts[0].clone(`vane-${i}`);
      m.parent = this.vaneDial;
      m.position.z = -0.85 + i * 0.85;
      m.isPickable = false;
      m.applyFog = false;
      this.vaneParts.push(m);
    }
    this.vane.setEnabled(false);
    this.figureMat = new StandardMaterial('figure', scene);
    this.figureMat.specularColor = new Color3(0.1, 0.1, 0.1);

    // Route pickups.
    const tw = MeshBuilder.CreateTorus('pk-tailwind', { diameter: 1.7, thickness: 0.34, tessellation: 18 }, scene);
    tw.rotation.x = Math.PI / 2; tw.bakeCurrentTransformIntoVertices();
    tw.material = glowMat(scene, 'pk-tw', [0.25, 1, 0.95]);
    const ck = MeshBuilder.CreatePolyhedron('pk-clock', { type: 1, size: 0.9 }, scene);
    ck.material = glowMat(scene, 'pk-ck', [1, 0.86, 0.2]);
    for (const m of [tw, ck]) { m.isVisible = false; m.isPickable = false; }
    this.pickupProto = { tailwind: tw, clock: ck };
    // Sidewalk crowd: one thin-instanced figure mesh, purely decorative and never collidable.
    this.crowdMesh = buildPassengerMesh(scene, { ...ARCHETYPES[0], body: '#ffffff', accent: '#dddddd', hat: 'none' }, this.figureMat);
    this.crowdMesh.name = 'crowd';
    this.crowdMesh.alwaysSelectAsActiveMesh = true;
    this.crowdMat = new Float32Array(this.crowdCount * 16);
    const crowdCol = new Float32Array(this.crowdCount * 4);
    for (let i = 0; i < this.crowdCount; i++) {
      const c = hex(ARCHETYPES[(i * 7) % ARCHETYPES.length].body);
      crowdCol.set([0.45 + c[0] * 0.55, 0.45 + c[1] * 0.55, 0.45 + c[2] * 0.55, 1], i * 4);
      this.crowd.push({ edge: -1, side: 1, s: 0, dir: 1, speed: 1.1 + (i % 5) * 0.12, hop: 0, phase: i * 1.7, x: 0, z: 0 });
    }
    this.crowdMesh.thinInstanceSetBuffer('matrix', this.crowdMat, 16, false);
    this.crowdMesh.thinInstanceSetBuffer('color', crowdCol, 4, true);
    this.crowdMesh.setEnabled(false);

    // Particles.
    const dot = softDotTexture(scene);
    const mk = (name: string, cap: number, tex: Texture, add: boolean) => {
      const p = new ParticleSystem(name, cap, scene);
      p.particleTexture = tex;
      p.emitter = new Vector3(0, -100, 0);
      p.blendMode = add ? ParticleSystem.BLENDMODE_ADD : ParticleSystem.BLENDMODE_STANDARD;
      p.updateSpeed = 1 / 60;
      return p;
    };
    this.smoke = mk('smoke', 500, dot, false);
    this.smoke.minSize = 0.7; this.smoke.maxSize = 2.0; this.smoke.minLifeTime = 0.35; this.smoke.maxLifeTime = 0.95;
    this.smoke.minEmitPower = 0.4; this.smoke.maxEmitPower = 1.6; this.smoke.emitRate = 0;
    this.smoke.direction1 = new Vector3(-1, 1.2, -1); this.smoke.direction2 = new Vector3(1, 2.4, 1);
    this.smoke.minEmitBox = new Vector3(-0.8, 0, -0.3); this.smoke.maxEmitBox = new Vector3(0.8, 0.1, 0.3);
    this.smoke.gravity = new Vector3(0, 0.6, 0);
    this.smoke.addSizeGradient(0, 0.5); this.smoke.addSizeGradient(1, 2.4);
    this.smoke.start();
    this.sparks = mk('sparks', 240, dot, true);
    this.sparks.minSize = 0.08; this.sparks.maxSize = 0.24; this.sparks.minLifeTime = 0.18; this.sparks.maxLifeTime = 0.55;
    this.sparks.minEmitPower = 4; this.sparks.maxEmitPower = 12; this.sparks.manualEmitCount = 0;
    this.sparks.direction1 = new Vector3(-1, 0.4, -1); this.sparks.direction2 = new Vector3(1, 1.6, 1);
    this.sparks.color1 = new Color4(1, 0.85, 0.4, 1); this.sparks.color2 = new Color4(1, 0.5, 0.15, 1); this.sparks.colorDead = new Color4(0.6, 0.1, 0, 0);
    this.sparks.gravity = new Vector3(0, -12, 0);
    this.sparks.start();
    this.confetti = mk('confetti', 500, squareTexture(scene), false);
    this.confetti.minSize = 0.14; this.confetti.maxSize = 0.34; this.confetti.minLifeTime = 0.9; this.confetti.maxLifeTime = 1.9;
    this.confetti.minEmitPower = 5; this.confetti.maxEmitPower = 13; this.confetti.manualEmitCount = 0;
    this.confetti.direction1 = new Vector3(-0.8, 1.6, -0.8); this.confetti.direction2 = new Vector3(0.8, 2.6, 0.8);
    this.confetti.color1 = new Color4(1, 0.25, 0.7, 1); this.confetti.color2 = new Color4(0.15, 0.95, 0.9, 1); this.confetti.colorDead = new Color4(1, 0.85, 0.2, 0.9);
    this.confetti.minAngularSpeed = -6; this.confetti.maxAngularSpeed = 6;
    this.confetti.gravity = new Vector3(0, -9, 0);
    this.confetti.start();
    this.boostFx = mk('boost', 360, dot, true);
    this.boostFx.minSize = 0.25; this.boostFx.maxSize = 0.8; this.boostFx.minLifeTime = 0.2; this.boostFx.maxLifeTime = 0.5;
    this.boostFx.minEmitPower = 0.5; this.boostFx.maxEmitPower = 2; this.boostFx.emitRate = 0;
    this.boostFx.color1 = new Color4(0.3, 1, 0.95, 0.9); this.boostFx.color2 = new Color4(0.9, 1, 1, 0.9); this.boostFx.colorDead = new Color4(0.1, 0.4, 1, 0);
    this.boostFx.minEmitBox = new Vector3(-0.7, -0.1, -0.2); this.boostFx.maxEmitBox = new Vector3(0.7, 0.3, 0.2);
    this.boostFx.direction1 = new Vector3(-0.3, 0, -0.3); this.boostFx.direction2 = new Vector3(0.3, 0.4, 0.3);
    this.boostFx.start();

    this.setQuality('medium');
    window.addEventListener('resize', () => this.engine.resize());
  }

  private buildSky(): void {
    const scene = this.scene;
    const sky = MeshBuilder.CreateSphere('sky', { diameter: 5600, segments: 20, sideOrientation: Mesh.BACKSIDE }, scene);
    const pos = sky.getVerticesData(VertexBuffer.PositionKind)!;
    const cols = new Float32Array((pos.length / 3) * 4);
    const sunV = SUN_DIR.scale(-1);
    for (let i = 0; i < pos.length / 3; i++) {
      const x = pos[i * 3] / 2800, y = pos[i * 3 + 1] / 2800, z = pos[i * 3 + 2] / 2800;
      const k = clamp01(y / 0.55);
      const glow = Math.pow(clamp01(x * sunV.x + y * sunV.y + z * sunV.z), 6);
      const top: RGB = [0.14, 0.44, 0.86], mid: RGB = [0.52, 0.78, 0.96];
      let r: number, g: number, b: number;
      if (y <= 0) { r = HAZE.r; g = HAZE.g; b = HAZE.b; } else {
        const e = Math.pow(k, 0.55);
        const hk = clamp01(y / 0.09);
        r = lerp(lerp(HAZE.r, mid[0], hk), top[0], e); g = lerp(lerp(HAZE.g, mid[1], hk), top[1], e); b = lerp(lerp(HAZE.b, mid[2], hk), top[2], e);
      }
      cols[i * 4] = r + glow * 0.5; cols[i * 4 + 1] = g + glow * 0.36; cols[i * 4 + 2] = b + glow * 0.12; cols[i * 4 + 3] = 1;
    }
    sky.setVerticesData(VertexBuffer.ColorKind, cols);
    sky.material = glowMat(scene, 'sky');
    sky.infiniteDistance = true;
    sky.applyFog = false;
    sky.isPickable = false;
    const sunDisc = MeshBuilder.CreateSphere('sun', { diameter: 150, segments: 12 }, scene);
    sunDisc.material = glowMat(scene, 'sun', [1, 0.97, 0.82]);
    sunDisc.position = sunV.scale(2400);
    sunDisc.infiniteDistance = true;
    sunDisc.applyFog = false;
    sunDisc.isPickable = false;
    // Clouds and far headlands.
    const clouds = new MeshBuf();
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2 + Math.sin(i * 7.1) * 0.2, d = 1100 + ((i * 197) % 800);
      const c = { x: WORLD_W / 2 + Math.cos(a) * d, y: 260 + ((i * 53) % 190), z: WORLD_D / 2 + Math.sin(a) * d };
      const s = 60 + ((i * 31) % 70);
      const warm: RGB = [1, 0.97, 0.93], shade: RGB = [0.9, 0.86, 0.9];
      clouds.sphere(c, s * 1.5, s * 0.34, s, 8, shade, warm);
      clouds.sphere({ x: c.x + s * 0.8, y: c.y + s * 0.14, z: c.z + s * 0.3 }, s, s * 0.3, s * 0.7, 8, shade, warm);
      clouds.sphere({ x: c.x - s * 0.9, y: c.y - s * 0.05, z: c.z - s * 0.2 }, s * 0.9, s * 0.24, s * 0.7, 8, shade, warm);
    }
    const cm = clouds.toMesh('clouds', scene, glowMat(scene, 'clouds'));
    cm.applyFog = false;
    cm.isPickable = false;
    const isles = new MeshBuf();
    const spots: [number, number, number, number][] = [[-500, -900, 420, 110], [300, -1500, 520, 150], [1500, -1300, 480, 120], [2500, -700, 600, 170], [-1100, 300, 500, 200], [2700, 700, 520, 190]];
    for (const [x, z, r, h] of spots) {
      isles.cyl(x, z, -5, h * 0.55, r, r * 0.55, 9, [0.3, 0.52, 0.5], false, [0.42, 0.62, 0.5]);
      isles.cyl(x + r * 0.1, z, h * 0.55, h, r * 0.55, r * 0.12, 9, [0.42, 0.62, 0.5], true, [0.56, 0.7, 0.52]);
    }
    const im = isles.toMesh('isles', scene, new StandardMaterial('isles', scene));
    (im.material as StandardMaterial).specularColor = Color3.Black();
    im.isPickable = false;
  }

  setQuality(q: Quality): void {
    this.quality = q;
    const scene = this.scene;
    this.shadows?.dispose();
    this.shadows = null;
    this.pipeline?.dispose();
    this.pipeline = null;
    if (q !== 'low') {
      const sg = new ShadowGenerator(q === 'high' ? 4096 : 2048, this.sun);
      sg.usePercentageCloserFiltering = true;
      sg.filteringQuality = q === 'high' ? ShadowGenerator.QUALITY_HIGH : ShadowGenerator.QUALITY_MEDIUM;
      sg.bias = 0.0012;
      sg.normalBias = 0.03;
      sg.setDarkness(0.38);
      this.sun.shadowFrustumSize = 190;
      this.sun.shadowMinZ = 20;
      this.sun.shadowMaxZ = 520;
      for (const m of this.city.shadowCasters) sg.addShadowCaster(m);
      if (this.taxi) for (const m of this.taxi.meshes) sg.addShadowCaster(m);
      this.shadows = sg;
      const p = new DefaultRenderingPipeline('pipeline', true, scene, [this.camera]);
      p.fxaaEnabled = true;
      p.samples = q === 'high' ? 4 : 1;
      p.bloomEnabled = true;
      p.bloomThreshold = 0.86;
      p.bloomWeight = 0.28;
      p.bloomKernel = 48;
      p.bloomScale = 0.5;
      p.imageProcessingEnabled = true;
      p.imageProcessing.contrast = 1.12;
      p.imageProcessing.exposure = 1.04;
      p.imageProcessing.vignetteEnabled = true;
      p.imageProcessing.vignetteWeight = 1.1;
      p.imageProcessing.toneMappingEnabled = false;
      this.pipeline = p;
    }
    this.applyResolution();
  }
  private applyResolution(): void {
    const base = Math.min(window.devicePixelRatio || 1, this.quality === 'high' ? 2 : 1.5);
    this.engine.setHardwareScalingLevel(1 / (base * this.resScale));
  }
  setReducedMotion(on: boolean): void {
    this.chase.reducedMotion = on;
  }

  /** Attach a session (or null for the menu backdrop). */
  setSession(session: Session | null): void {
    this.session = session;
    for (const v of this.candVis.values()) this.disposeCand(v);
    this.candVis.clear();
    for (const c of this.cheers) c.mesh.dispose();
    this.cheers = [];
    this.traffic.dispose();
    this.destRing.setEnabled(false); this.destColumn.setEnabled(false); this.destIcon.setEnabled(false);
    this.vane.setEnabled(false);
    this.smoke.emitRate = 0; this.boostFx.emitRate = 0;
    for (const m of this.pickupVis) m.dispose();
    this.pickupVis = [];
    for (const c of this.crowd) c.edge = -1;
    this.crowdMesh.setEnabled(!!session);
    if (session) {
      this.setTaxi(session.opts.taxi);
      for (const p of session.pickups) {
        const inst = this.pickupProto[p.kind].createInstance('pk');
        inst.position.set(p.x, p.y, p.z);
        inst.isPickable = false;
        this.pickupVis.push(inst);
      }
    }
    this.chase.snap();
  }
  setTaxi(id: TaxiId | null): void {
    if (id && this.taxiSpec?.id === id) { this.taxi?.root.setEnabled(true); return; }
    if (this.taxi) { if (this.shadows) for (const m of this.taxi.meshes) this.shadows.removeShadowCaster(m); this.taxi.dispose(); this.taxi = null; this.taxiSpec = null; }
    if (!id) return;
    this.taxiSpec = TAXIS[id];
    this.taxi = buildTaxi(this.scene, this.taxiSpec);
    if (this.shadows) for (const m of this.taxi.meshes) this.shadows.addShadowCaster(m);
  }

  private disposeCand(v: CandidateVisual): void {
    v.icon.dispose(); v.ring.dispose(); v.beam.dispose(); v.figure.dispose();
  }

  handleEvent(e: SessionEvent): void {
    const s = this.session;
    if (!s) return;
    const p = s.vehicle.pos;
    switch (e.type) {
      case 'collision':
        this.chase.addShake(Math.min(1, e.severity / 14));
        (this.sparks.emitter as Vector3).set(p.x, p.y + 0.2, p.z);
        this.sparks.manualEmitCount = Math.min(120, Math.round(e.severity * 8));
        break;
      case 'delivered': {
        (this.confetti.emitter as Vector3).set(p.x, p.y + 1.2, p.z);
        this.confetti.manualEmitCount = e.result.grade === 'Blazing' ? 260 : e.result.grade === 'Late' ? 40 : 160;
        const cand = s.fares.current;
        if (cand) {
          const site = this.model.sites[cand.dest];
          const mesh = buildPassengerMesh(this.scene, ARCHETYPES[cand.who], this.figureMat);
          mesh.position.set(site.sx, site.sy, site.sz);
          mesh.rotation.y = Math.atan2(site.x - site.sx, site.z - site.sz);
          this.cheers.push({ mesh, t: 0, y: site.sy });
        }
        break;
      }
      case 'air': this.chase.addShake(Math.min(0.5, e.time * 0.3)); break;
      case 'respawn': this.chase.snap(); break;
      default: break;
    }
  }

  /** Project a world position to canvas CSS pixels. z > 1 means behind the camera. */
  project(p: V3): { x: number; y: number; behind: boolean } {
    const w = this.engine.getRenderWidth(), h = this.engine.getRenderHeight();
    const v = Vector3.Project(new Vector3(p.x, p.y, p.z), Matrix.IdentityReadOnly, this.scene.getTransformMatrix(), this.camera.viewport.toGlobal(w, h));
    const canvas = this.engine.getRenderingCanvas()!;
    return { x: (v.x / w) * canvas.clientWidth, y: (v.y / h) * canvas.clientHeight, behind: v.z > 1 || v.z < 0 };
  }

  private syncMarkers(dt: number): void {
    const s = this.session!;
    const seen = new Set<number>();
    const bob = Math.sin(this.time * 3) * 0.35;
    const showCands = s.fares.state === 'seeking' && s.phase !== 'ended';
    for (const c of s.fares.candidates) {
      seen.add(c.id);
      let v = this.candVis.get(c.id);
      const site = this.model.sites[c.site];
      if (!v) {
        const icon = this.protoIcon[c.tier].createInstance('ci'), ring = this.protoRing[c.tier].createInstance('cr'), beam = this.protoBeam[c.tier].createInstance('cb');
        const figure = buildPassengerMesh(this.scene, ARCHETYPES[c.who], this.figureMat);
        figure.position.set(site.sx, site.sy, site.sz);
        figure.rotation.y = Math.atan2(site.x - site.sx, site.z - site.sz);
        figure.scaling.setAll(1.15);
        ring.position.set(site.x, site.y + 0.35, site.z);
        beam.position.set(site.sx, site.sy + 21, site.sz);
        for (const m of [icon, ring, beam]) { m.isPickable = false; m.applyFog = false; }
        this.shadows?.addShadowCaster(figure);
        v = { icon, ring, beam, figure, tier: c.tier, site: c.site };
        this.candVis.set(c.id, v);
      }
      v.icon.setEnabled(showCands); v.ring.setEnabled(showCands); v.beam.setEnabled(showCands);
      v.icon.position.set(site.sx, site.sy + 6.4 + bob, site.sz);
      v.icon.rotation.y = this.time * 2.2;
      const pulse = 1 + Math.sin(this.time * 4 + c.id) * 0.04;
      v.ring.scaling.set(pulse, 1, pulse);
      v.figure.position.y = site.sy + Math.abs(Math.sin(this.time * 5 + c.id)) * 0.12;
    }
    for (const [id, v] of this.candVis) if (!seen.has(id)) { this.disposeCand(v); this.candVis.delete(id); }
    // Destination beacon.
    const cur = s.fares.current;
    const showDest = !!cur && (s.fares.state === 'carrying' || s.fares.state === 'boarding');
    this.destRing.setEnabled(showDest); this.destColumn.setEnabled(showDest); this.destIcon.setEnabled(showDest);
    if (showDest && cur) {
      const d = this.model.sites[cur.dest];
      const col = hex(TIERS[cur.tier].color);
      this.destMat.emissiveColor.set(col[0], col[1], col[2]);
      (this.destColumn.material as StandardMaterial).emissiveColor.set(col[0], col[1], col[2]);
      this.destRing.position.set(d.x, d.y + 0.4, d.z);
      const pulse = 1 + Math.sin(this.time * 5) * 0.05;
      this.destRing.scaling.set(pulse, 1, pulse);
      this.destColumn.position.set(d.x, d.y + 44, d.z);
      this.destIcon.position.set(d.x, d.y + 13 + bob * 2, d.z);
      this.destIcon.rotation.y = this.time * 1.6;
    }
    for (let i = this.cheers.length - 1; i >= 0; i--) {
      const c = this.cheers[i];
      c.t += dt;
      c.mesh.position.y = c.y + Math.abs(Math.sin(c.t * 9)) * 0.45;
      if (c.t > 3) { c.mesh.dispose(); this.cheers.splice(i, 1); }
    }
  }

  /** Walk the decorative crowd along sidewalks near the cab; anyone too close hops clear. */
  private updateCrowd(dt: number, pos: V3, speed: number): void {
    const m = this.model;
    const M = this.crowdMat;
    for (let i = 0; i < this.crowd.length; i++) {
      const c = this.crowd[i];
      let e = c.edge >= 0 ? m.edges[c.edge] : null;
      if (!e || Math.hypot(c.x - pos.x, c.z - pos.z) > 210) {
        // Re-seat on a sidewalk 50-170 m from the cab.
        e = null;
        c.edge = -1;
        for (let tries = 0; tries < 6; tries++) {
          const cand = m.edges[Math.floor(Math.abs(Math.sin(this.time * 91.7 + i * 13.3 + tries * 7.1)) * m.edges.length) % m.edges.length];
          if (cand.structure || cand.len < 40) continue;
          const mid = m.edgePoint(cand, 0.5);
          const d = Math.hypot(mid.x - pos.x, mid.z - pos.z);
          if (d < 50 || d > 170) continue;
          c.edge = cand.id; c.side = (i + tries) % 2 ? 1 : -1; c.dir = i % 2 ? 1 : -1;
          c.s = 14 + ((i * 37) % Math.max(1, Math.floor(cand.len - 28)));
          e = cand;
          break;
        }
        if (!e) { M[i * 16 + 13] = -500; c.x = 1e6; continue; }
      }
      c.s += c.dir * c.speed * dt;
      if (c.s > e.len - 13 || c.s < 13) { c.dir *= -1; c.s = Math.min(e.len - 13, Math.max(13, c.s)); }
      const a = m.nodes[e.a];
      const bx = a.x + e.dx * c.s, bz = a.z + e.dz * c.s;
      const near = Math.hypot(bx + e.dz * c.side * (e.hw + 2.4) - pos.x, bz - e.dx * c.side * (e.hw + 2.4) - pos.z);
      c.hop = near < 6.5 && speed > 3 ? Math.min(1, c.hop + dt * 6) : Math.max(0, c.hop - dt * 1.2);
      const off = e.hw + 2.4 + c.hop * 1.7;
      const x = bx + e.dz * c.side * off, z = bz - e.dx * c.side * off;
      c.x = x; c.z = z;
      const y = m.heightAt(x, z) + Math.abs(Math.sin(this.time * 7 + c.phase)) * 0.06 + Math.sin(c.hop * Math.PI) * 0.7;
      const yaw = Math.atan2(e.dx * c.dir, e.dz * c.dir);
      const cs = Math.cos(yaw), sn = Math.sin(yaw), o = i * 16;
      M[o] = cs; M[o + 1] = 0; M[o + 2] = -sn; M[o + 3] = 0;
      M[o + 4] = 0; M[o + 5] = 1; M[o + 6] = 0; M[o + 7] = 0;
      M[o + 8] = sn; M[o + 9] = 0; M[o + 10] = cs; M[o + 11] = 0;
      M[o + 12] = x; M[o + 13] = y; M[o + 14] = z; M[o + 15] = 1;
    }
    this.crowdMesh.thinInstanceBufferUpdated('matrix');
  }

  /** Render one frame. `alpha` interpolates between the previous and current simulation step. */
  render(alpha: number, dt: number, view: ViewControls, braking: boolean): void {
    this.time += dt;
    const s = this.session;
    this.city.seaTex.uOffset = this.time * 0.004;
    this.city.seaTex.vOffset = this.time * 0.007;
    if (s && this.taxi) {
      const v = s.vehicle, tv = this.taxi;
      tv.root.setEnabled(true);
      const pos = { x: lerp(v.prevPos.x, v.pos.x, alpha), y: lerp(v.prevPos.y, v.pos.y, alpha), z: lerp(v.prevPos.z, v.pos.z, alpha) };
      const q = quatSlerp(v.prevQuat, v.quat, alpha);
      this.taxiPos = pos;
      tv.root.position.set(pos.x, pos.y, pos.z);
      if (!tv.root.rotationQuaternion) tv.root.rotationQuaternion = new Quaternion();
      tv.root.rotationQuaternion.set(q.x, q.y, q.z, q.w);
      const fwd = rotate(q, { x: 0, y: 0, z: 1 }), up = rotate(q, { x: 0, y: 1, z: 0 });
      this.taxiYaw = Math.atan2(fwd.x, fwd.z);
      for (let i = 0; i < 4; i++) {
        const w = v.wheels[i], pv = tv.wheels[i];
        pv.position.set(w.mount.x, w.mount.y - (0.5 - lerp(w.prevCompression, w.compression, alpha)), w.mount.z);
        pv.rotation.y = w.steer;
        (pv.getChildMeshes(true)[0] as Mesh).rotation.x = w.spin;
      }
      tv.turbine.rotation.y += dt * (5 + v.speed * 0.9 + (v.boostActive ? 40 : 0));
      const hired = s.fares.state === 'carrying' || s.fares.state === 'boarding';
      const tc = hired && s.fares.current ? hex(TIERS[s.fares.current.tier].color) : ([0.1, 1, 0.9] as RGB);
      const blink = s.fares.frozen ? 0.5 + 0.5 * Math.sin(this.time * 18) : 1;
      tv.signMat.emissiveColor.set(tc[0] * blink, tc[1] * blink, tc[2] * blink);
      tv.brakeMat.emissiveColor.set(braking ? 1 : 0.5, braking ? 0.12 : 0.04, braking ? 0.1 : 0.04);

      // Traffic.
      for (const a of s.traffic.agents) {
        const inst = this.traffic.get(a.id, a.type, a.color);
        if (!inst.rotationQuaternion) { inst.rotationQuaternion = new Quaternion(); this.shadows?.addShadowCaster(inst); }
        const jump = Math.abs(a.x - a.px) + Math.abs(a.z - a.pz) > 8;
        const k = jump ? 1 : alpha;
        inst.position.set(lerp(a.px, a.x, k), lerp(a.py, a.y, k), lerp(a.pz, a.z, k));
        const aq = jump ? a.q : quatSlerp(a.pq, a.q, alpha);
        inst.rotationQuaternion.set(aq.x, aq.y, aq.z, aq.w);
      }
      this.syncMarkers(dt);
      for (let i = 0; i < this.pickupVis.length; i++) {
        const p = s.pickups[i], inst = this.pickupVis[i];
        inst.setEnabled(!p.taken);
        inst.rotation.y = this.time * 3 + i;
        inst.position.y = p.y + Math.sin(this.time * 2.5 + i) * 0.2;
      }
      this.updateCrowd(dt, pos, v.speed);

      // Route vane.
      const gp = s.guidePoint;
      const showVane = !!gp && s.phase !== 'ended' && Math.hypot(gp.x - pos.x, gp.z - pos.z) > 6;
      this.vane.setEnabled(showVane);
      if (showVane && gp) {
        const yaw = Math.atan2(gp.x - pos.x, gp.z - pos.z);
        const bumper = this.chase.mode === 'bumper';
        const camYaw = this.chase.viewYaw;
        const ahead = bumper ? 6 : 0.6;
        this.vane.position.set(pos.x + Math.sin(camYaw) * ahead, pos.y + (bumper ? 2.3 : 3.5), pos.z + Math.cos(camYaw) * ahead);
        this.vane.rotation.set(-1.02, camYaw, 0);
        this.vaneDial.rotation.y = yaw - camYaw;
        this.vane.scaling.setAll(bumper ? 0.55 : 0.6);
        const col = s.fares.current ? hex(TIERS[s.fares.current.tier].color) : ([0.2, 1, 0.9] as RGB);
        this.vaneMat.emissiveColor.set(col[0], col[1], col[2]);
        this.vaneParts.forEach((m, i) => {
          const ph = (this.time * 2.4 - i * 0.33) % 1;
          const k = 0.82 + 0.3 * Math.max(0, Math.sin(ph * Math.PI * 2));
          m.scaling.set(k, k, k);
        });
      }

      // Particles.
      const rear = { x: pos.x - fwd.x * v.spec.wheelBase * 0.5 - up.x * 0.5, y: pos.y - fwd.y * v.spec.wheelBase * 0.5 - up.y * 0.5, z: pos.z - fwd.z * v.spec.wheelBase * 0.5 - up.z * 0.5 };
      (this.smoke.emitter as Vector3).set(rear.x, rear.y, rear.z);
      const surf = v.surface;
      const loose = surf === 'sand' || surf === 'dirt' || surf === 'grass';
      const slide = v.slide;
      this.smoke.emitRate = v.groundedCount >= 2 ? (loose ? clamp01(v.speed / 12) * 140 : slide > 0.25 ? slide * 190 : 0) + (surf === 'water' ? clamp01(v.speed / 6) * 200 : 0) : 0;
      if (surf === 'sand' || surf === 'dirt') { this.smoke.color1.set(0.86, 0.74, 0.5, 0.5); this.smoke.color2.set(0.8, 0.68, 0.46, 0.4); this.smoke.colorDead.set(0.8, 0.7, 0.5, 0); }
      else if (surf === 'grass') { this.smoke.color1.set(0.45, 0.6, 0.3, 0.45); this.smoke.color2.set(0.6, 0.55, 0.35, 0.4); this.smoke.colorDead.set(0.5, 0.5, 0.3, 0); }
      else if (surf === 'water') { this.smoke.color1.set(0.85, 0.95, 1, 0.7); this.smoke.color2.set(0.7, 0.9, 1, 0.6); this.smoke.colorDead.set(0.8, 0.9, 1, 0); }
      else { this.smoke.color1.set(0.95, 0.95, 0.97, 0.42); this.smoke.color2.set(0.8, 0.8, 0.85, 0.3); this.smoke.colorDead.set(0.9, 0.9, 0.95, 0); }
      (this.boostFx.emitter as Vector3).set(rear.x + up.x * 0.5, rear.y + up.y * 0.5, rear.z + up.z * 0.5);
      this.boostFx.emitRate = v.boostActive ? 260 : 0;

      // Camera + shadow frustum follow.
      const vel = v.vel;
      this.chase.update(dt, { pos, fwd, up, vel, speed: v.speed, fwdSpeed: v.fwdSpeed, slipAngle: v.drifting ? v.slipAngle : 0, airTime: v.airTime, boost: v.boostActive }, view,
        (ox, oy, oz, dx, dy, dz, max) => s.phys.castStatic(ox, oy, oz, dx, dy, dz, max)?.toi ?? null,
        (x, z) => this.model.heightAt(x, z));
      this.sun.position.set(pos.x - SUN_DIR.x * 260, pos.y - SUN_DIR.y * 260, pos.z - SUN_DIR.z * 260);
      this.city.updateSignals(s.traffic.time);
    } else {
      // Menu backdrop: slow orbit over the city, or a close orbit around the showcased cab.
      if (this.taxi && this.taxiSpec) {
        const hub = this.model.hubs[1].pose;
        const tv = this.taxi;
        tv.root.setEnabled(true);
        this.showcaseYaw += dt * 0.5;
        tv.root.position.set(hub.x, hub.y + 0.72, hub.z);
        if (!tv.root.rotationQuaternion) tv.root.rotationQuaternion = new Quaternion();
        Quaternion.RotationYawPitchRollToRef(hub.yaw, 0, 0, tv.root.rotationQuaternion);
        const sp = this.taxiSpec;
        for (let i = 0; i < 4; i++) { const m = [[-1, 1], [1, 1], [-1, -1], [1, -1]][i]; tv.wheels[i].position.set((m[0] * sp.track) / 2, 0.05 - 0.4, (m[1] * sp.wheelBase) / 2); }
        tv.turbine.rotation.y += dt * 6;
        const a = this.showcaseYaw;
        this.camera.fov = 0.95;
        const cxp = hub.x + Math.cos(a) * 10.5, czp = hub.z + Math.sin(a) * 10.5;
        // Aim to the left of the cab so it sits in the right half of the screen, clear of the panel.
        const ddx = (hub.x - cxp) / 10.5, ddz = (hub.z - czp) / 10.5;
        this.camera.position.set(cxp - ddz * 3.4, hub.y + 3.1, czp + ddx * 3.4);
        this.camera.setTarget(new Vector3(hub.x - ddz * 3.4, hub.y + 0.6, hub.z + ddx * 3.4));
        this.camera.rotation.z = 0;
        this.sun.position.set(hub.x - SUN_DIR.x * 260, hub.y - SUN_DIR.y * 260, hub.z - SUN_DIR.z * 260);
      } else {
        this.chase.orbit(this.time, { x: 690, y: 30, z: 430 }, 640, 250);
        this.sun.position.set(690 - SUN_DIR.x * 260, 30 - SUN_DIR.y * 260, 430 - SUN_DIR.z * 260);
      }
      this.city.updateSignals(this.time);
    }
    if (this.debugCam) {
      this.camera.position.set(this.debugCam.pos.x, this.debugCam.pos.y, this.debugCam.pos.z);
      this.camera.setTarget(new Vector3(this.debugCam.target.x, this.debugCam.target.y, this.debugCam.target.z));
      this.camera.rotation.z = 0;
      this.camera.fov = this.debugCam.fov ?? 1.2;
    }
    this.scene.render();
    // Dynamic resolution: trade pixels for frame rate when the GPU is struggling.
    if (this.dynamicResolution && dt > 0) {
      this.fpsAvg = lerp(this.fpsAvg, 1 / dt, 0.05);
      this.fpsTimer += dt;
      if (this.fpsTimer > 2.5) {
        this.fpsTimer = 0;
        if (this.fpsAvg < 50 && this.resScale > 0.6) { this.resScale = Math.max(0.6, this.resScale - 0.1); this.applyResolution(); }
        else if (this.fpsAvg > 58.5 && this.resScale < 1) { this.resScale = Math.min(1, this.resScale + 0.05); this.applyResolution(); }
      }
    }
  }

  get fps(): number {
    return this.fpsAvg;
  }
  hideTaxi(): void {
    this.taxi?.root.setEnabled(false);
  }
  stats(): { drawCalls: number; meshes: number; fps: number; res: number } {
    return { drawCalls: (this.scene.getEngine() as Engine)._drawCalls?.current ?? 0, meshes: this.scene.getActiveMeshes().length, fps: this.fpsAvg, res: this.resScale };
  }
}

export { SURFACES };
