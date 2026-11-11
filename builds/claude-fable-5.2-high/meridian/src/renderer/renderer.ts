// Babylon.js presentation of the simulation. Static world via the streaming City; everything dynamic
// (vehicles, people, props, lamps, particles) is drawn with a handful of thin-instanced meshes.
import {
  Engine, Scene, FreeCamera, Vector3, Color3, Color4, DirectionalLight, HemisphericLight, PointLight, ShadowGenerator, StandardMaterial,
  ShaderMaterial, Effect, Mesh, MeshBuilder, Matrix, Quaternion, DefaultRenderingPipeline, ParticleSystem, Camera, Material, Texture,
  ImageProcessingConfiguration, DynamicTexture,
} from '@babylonjs/core';
import type { Sim } from '../game-session/sim';
import { City } from './city';
import { Geo, rgb } from './geo';
import { makeGroundAtlas, makeFacadeAtlas, makeSoftDot, makeStreak, makeWaterBump } from './textures';
import { buildVehicleGeo, buildWheelGeo } from './vehicleMesh';
import { CameraRig, CamSettings } from './cameraRig';
import { VEHICLES } from '../vehicles/specs';
import { Vehicle } from '../vehicles/vehicle';
import { HumanView, Look } from '../character/character';
import { DYN_SPECS } from '../physics/physics';
import { lamps, cameras } from '../world/lots';
import { intersections, surfaceY, WATER_Y, CANAL, ANCHORS, hillHeight } from '../world/district';
import { clamp, lerp, smoothstep, quatSlerp, hash2, Quat, damp } from '../core/math';

export interface RenderSettings extends CamSettings { quality: 'low' | 'medium' | 'high'; renderScale: number; reducedFlashes: boolean; viewDistance: number }

class Pool {
  m: Float32Array; c: Float32Array; n = 0;
  constructor(public mesh: Mesh, public cap: number) {
    this.m = new Float32Array(cap * 16); this.c = new Float32Array(cap * 4);
    mesh.thinInstanceSetBuffer('matrix', this.m, 16, false); mesh.thinInstanceSetBuffer('color', this.c, 4, false);
    mesh.alwaysSelectAsActiveMesh = true; mesh.doNotSyncBoundingInfo = true; mesh.isPickable = false;
    mesh.thinInstanceCount = 0; mesh.setEnabled(false);
  }
  begin() { this.n = 0; }
  add(mat: Matrix, r: number, g: number, b: number, a = 1) {
    if (this.n >= this.cap) return;
    mat.copyToArray(this.m, this.n * 16);
    const o = this.n * 4; this.c[o] = r; this.c[o + 1] = g; this.c[o + 2] = b; this.c[o + 3] = a; this.n++;
  }
  end() {
    this.mesh.setEnabled(this.n > 0); this.mesh.thinInstanceCount = this.n;
    if (this.n > 0) { this.mesh.thinInstanceBufferUpdated('matrix'); this.mesh.thinInstanceBufferUpdated('color'); }
  }
}
interface Particle { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; max: number; size: number; grow: number; r: number; g: number; b: number; a: number; grav: number; add: boolean }

const T1 = new Matrix(), T2 = new Matrix(), T3 = new Matrix(), ROOT = new Matrix(), VEH = new Matrix(), Q = new Quaternion(), V = new Vector3(), S = new Vector3(), ONE = new Vector3(1, 1, 1);
const _q: Quat = { x: 0, y: 0, z: 0, w: 1 };
const SKIN_HAT = [0, 0xd9482b, 0x16203a, 0x2c3036, 0xf2c230];

export class Renderer {
  engine: Engine; scene: Scene; camera: FreeCamera; rig: CameraRig; city!: City;
  private sun!: DirectionalLight; private hemi!: HemisphericLight; private fill!: PointLight; private shadows: ShadowGenerator | null = null;
  private pipeline: DefaultRenderingPipeline | null = null;
  private mats!: { ground: StandardMaterial; facade: StandardMaterial; flat: StandardMaterial; glowNight: StandardMaterial; glowAlways: StandardMaterial; paint: StandardMaterial; pool: StandardMaterial; partA: StandardMaterial; partB: StandardMaterial; water: StandardMaterial };
  private sky!: Mesh; private skyMat!: ShaderMaterial; private water!: Mesh; private canalWater!: Mesh; private waterBump!: DynamicTexture;
  private boxes!: Pool; private heads!: Pool; private glow!: Pool; private wheels!: Pool; private lampPool!: Mesh; private dynPools!: Pool; private partAlpha!: Pool; private partAdd!: Pool;
  private vehPaint = new Map<string, Pool>(); private vehTrim = new Map<string, Pool>();
  private particles: Particle[] = []; private tracers: { ax: number; ay: number; az: number; bx: number; by: number; bz: number; t: number; stun: boolean }[] = [];
  private rain: ParticleSystem | null = null;
  private time = 0; private playerVeh = new Matrix(); private night = 0; private lastDraws = 0;
  private uZen = new Vector3(); private uHor = new Vector3(); private uSun = new Vector3(); private uSunCol = new Vector3();
  drawCalls = 0; settings: RenderSettings;
  /** Extra world markers supplied by the game layer each frame. */
  markers: { x: number; z: number; r: number; color: number; beam: boolean }[] = [];
  ghost: { x: number; z: number } | null = null;

  constructor(public canvas: HTMLCanvasElement, public sim: Sim, settings: RenderSettings) {
    this.settings = settings;
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: false, antialias: true, powerPreference: 'high-performance' }, true);
    this.scene = new Scene(this.engine);
    this.scene.skipPointerMovePicking = true; this.scene.autoClear = true;
    this.camera = new FreeCamera('cam', new Vector3(0, 5, -10), this.scene);
    this.camera.fovMode = Camera.FOVMODE_HORIZONTAL_FIXED; this.camera.minZ = 0.25; this.camera.maxZ = 2400; this.camera.inputs.clear();
    this.rig = new CameraRig(this.camera);
    sim.bus.on('vfx', (e) => this.onVfx(e));
    sim.bus.on('tracer', (e) => { if (this.tracers.length < 40) this.tracers.push({ ...e, t: 0 }); });
    sim.bus.on('shake', (e) => this.rig.addShake(e.amount));
  }
  get webgl2() { return this.engine.webGLVersion >= 2; }

  // ------------------------------------------------------------------ setup
  init() {
    const sc = this.scene;
    const ground = makeGroundAtlas(sc), fac = makeFacadeAtlas(sc), dot = makeSoftDot(sc);
    const std = (name: string, f: (m: StandardMaterial) => void) => { const m = new StandardMaterial(name, sc); m.specularColor = new Color3(0.06, 0.06, 0.06); m.maxSimultaneousLights = 4; f(m); return m; };
    this.mats = {
      ground: std('ground', (m) => { m.diffuseTexture = ground; m.specularPower = 48; }),
      facade: std('facade', (m) => { m.diffuseTexture = fac.diffuse; m.emissiveTexture = fac.emissive; m.specularColor = new Color3(0.12, 0.12, 0.13); m.specularPower = 40; }),
      flat: std('flat', () => { /* vertex colours only */ }),
      glowNight: std('glowNight', (m) => { m.disableLighting = true; m.emissiveColor = new Color3(0.4, 0.4, 0.4); }),
      glowAlways: std('glowAlways', (m) => { m.disableLighting = true; m.emissiveColor = new Color3(1, 1, 1); }),
      paint: std('paint', (m) => { m.specularColor = new Color3(0.45, 0.45, 0.45); m.specularPower = 70; }),
      pool: std('pool', (m) => { m.disableLighting = true; m.emissiveColor = new Color3(1, 1, 1); m.diffuseTexture = dot; m.opacityTexture = dot; m.alphaMode = Engine.ALPHA_ADD; m.disableDepthWrite = true; m.backFaceCulling = false; m.fogEnabled = false; }),
      partA: std('partA', (m) => { m.disableLighting = true; m.emissiveColor = new Color3(1, 1, 1); m.diffuseTexture = dot; m.opacityTexture = dot; m.disableDepthWrite = true; m.backFaceCulling = false; }),
      partB: std('partB', (m) => { m.disableLighting = true; m.emissiveColor = new Color3(1, 1, 1); m.diffuseTexture = dot; m.opacityTexture = dot; m.alphaMode = Engine.ALPHA_ADD; m.disableDepthWrite = true; m.backFaceCulling = false; m.fogEnabled = false; }),
      water: std('water', (m) => { m.diffuseColor = new Color3(0.1, 0.34, 0.42); m.specularColor = new Color3(0.9, 0.9, 0.85); m.specularPower = 120; m.alpha = 0.86; m.backFaceCulling = false; }),
    };
    this.waterBump = makeWaterBump(sc); this.waterBump.uScale = this.waterBump.vScale = 60; this.mats.water.bumpTexture = this.waterBump; (this.mats.water.bumpTexture as Texture).level = 0.5;

    // lights
    this.sun = new DirectionalLight('sun', new Vector3(-0.4, -0.8, 0.4), sc);
    this.hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), sc);
    this.fill = new PointLight('fill', new Vector3(0, 4, 0), sc); this.fill.range = 30; this.fill.intensity = 0; this.fill.specular = new Color3(0, 0, 0);
    sc.fogMode = Scene.FOGMODE_EXP2;
    sc.ambientColor = new Color3(0, 0, 0);

    // sky dome
    Effect.ShadersStore.mrSkyVertexShader = 'precision highp float; attribute vec3 position; uniform mat4 worldViewProjection; varying vec3 vDir; void main(){ vDir = position; gl_Position = worldViewProjection * vec4(position, 1.0); }';
    Effect.ShadersStore.mrSkyFragmentShader = `precision highp float; varying vec3 vDir; uniform vec3 zenith; uniform vec3 horizon; uniform vec3 sunDir; uniform vec3 sunCol; uniform float night;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){ vec3 d = normalize(vDir); float t = pow(clamp(d.y, 0.0, 1.0), 0.55);
        vec3 col = mix(horizon, zenith, t); if (d.y < 0.0) col = mix(horizon, horizon * 0.55, clamp(-d.y * 4.0, 0.0, 1.0));
        float s = max(dot(d, sunDir), 0.0); col += sunCol * (pow(s, 350.0) * 2.0 + pow(s, 12.0) * 0.22);
        vec2 g = floor(d.xz / max(d.y, 0.05) * 90.0); float st = step(0.996, hash(g)) * night * smoothstep(0.05, 0.4, d.y); col += vec3(st) * 0.8;
        float band = sin(d.x * 3.0 + d.z * 2.0) * 0.5 + 0.5; col = mix(col, horizon * 1.05, (1.0 - t) * band * 0.12);
        gl_FragColor = vec4(col, 1.0); }`;
    this.skyMat = new ShaderMaterial('sky', sc, { vertex: 'mrSky', fragment: 'mrSky' }, { attributes: ['position'], uniforms: ['worldViewProjection', 'zenith', 'horizon', 'sunDir', 'sunCol', 'night'] });
    this.skyMat.backFaceCulling = false; this.skyMat.disableDepthWrite = true;
    this.sky = MeshBuilder.CreateSphere('sky', { diameter: 2000, segments: 12 }, sc);
    this.sky.material = this.skyMat; this.sky.infiniteDistance = true; this.sky.isPickable = false; this.sky.alwaysSelectAsActiveMesh = true; this.sky.applyFog = false;

    // water
    this.water = MeshBuilder.CreateGround('sea', { width: 2400, height: 2400 }, sc); this.water.position.y = WATER_Y; this.water.material = this.mats.water; this.water.isPickable = false;
    this.canalWater = MeshBuilder.CreateGround('canal', { width: CANAL.x1 - CANAL.x0, height: 900 }, sc);
    this.canalWater.position.set((CANAL.x0 + CANAL.x1) / 2, CANAL.water, 6); this.canalWater.material = this.mats.water; this.canalWater.isPickable = false;

    // static world
    this.city = new City(sc, this.mats);
    this.city.detailRadius = this.settings.viewDistance;
    this.city.buildStatic();

    // dynamic instanced meshes
    const unitBox = new Geo(); unitBox.box(0, 0, 0, 0.5, 0.5, 0.5, 0, 0xffffff);
    const unitBall = new Geo(); unitBall.ball(0, 0, 0, 0.5, 0.5, 0.5, 0xffffff, 0, 10, 6);
    this.boxes = new Pool(unitBox.toMesh('boxes', sc, this.mats.flat), 2600);
    this.heads = new Pool(unitBall.toMesh('heads', sc, this.mats.flat), 260);
    this.glow = new Pool(unitBox.toMesh('glow', sc, this.mats.glowAlways), 1400);
    this.wheels = new Pool(buildWheelGeo().toMesh('wheels', sc, this.mats.flat), 420);
    for (const spec of Object.values(VEHICLES)) {
      const g = buildVehicleGeo(spec);
      this.vehPaint.set(spec.id, new Pool(g.paint.toMesh('paint_' + spec.id, sc, this.mats.paint), 70));
      this.vehTrim.set(spec.id, new Pool(g.trim.toMesh('trim_' + spec.id, sc, this.mats.flat), 70));
    }
    const flatQuad = new Geo(); flatQuad.quad(-0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 0, 0.5, -0.5, 0, 0.5, 0, 1, 0, 1, 1, 1, 0, 0, 1, 1);
    const bill = new Geo(); bill.quad(-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0, 0, 0, -1, 1, 1, 1, 0, 0, 1, 1);
    const mk = (g: Geo, name: string, mat: Material, cap: number) => { const m = g.toMesh(name, sc, mat); m.hasVertexAlpha = true; return new Pool(m, cap); };
    this.dynPools = mk(flatQuad, 'dynPools', this.mats.pool, 260);
    this.partAlpha = mk(bill, 'partAlpha', this.mats.partA, 900);
    this.partAdd = mk(bill, 'partAdd', this.mats.partB, 1300);
    // street-lamp light pools: one static instanced draw, faded in at night
    this.lampPool = flatQuad.toMesh('lampPools', sc, this.mats.pool); this.lampPool.hasVertexAlpha = true;
    const lm = new Float32Array(lamps.length * 16), lc = new Float32Array(lamps.length * 4);
    lamps.forEach((l, i) => {
      const [r, g, b] = rgb(l.color), y = surfaceY(l.x, l.z) + 0.07;
      // lie flat on the slope so pools hug Lantern Hill instead of slicing through it
      const gx = (hillHeight(l.x + 1.5, l.z) - hillHeight(l.x - 1.5, l.z)) / 3, gz = (hillHeight(l.x, l.z + 1.5) - hillHeight(l.x, l.z - 1.5)) / 3;
      Quaternion.RotationYawPitchRollToRef(0, Math.atan(gz), -Math.atan(gx), Q);
      Matrix.ComposeToRef(S.set(l.r * 1.7, 1, l.r * 1.7), Q, V.set(l.x, y + Math.hypot(gx, gz) * 0.6, l.z), T1); T1.copyToArray(lm, i * 16);
      lc[i * 4] = r * 0.85; lc[i * 4 + 1] = g * 0.8; lc[i * 4 + 2] = b * 0.7; lc[i * 4 + 3] = 1;
    });
    this.lampPool.thinInstanceSetBuffer('matrix', lm, 16, true); this.lampPool.thinInstanceSetBuffer('color', lc, 4, true);
    this.lampPool.alwaysSelectAsActiveMesh = true; this.lampPool.isPickable = false;

    this.applyQuality();
    this.city.onDetail = (meshes, added) => {
      const list = this.shadows?.getShadowMap()?.renderList; if (!list) return;
      for (const m of meshes) { if (!(m as any).__cast) continue; const i = list.indexOf(m); if (added && i < 0) list.push(m); else if (!added && i >= 0) list.splice(i, 1); }
    };
  }
  applyQuality() {
    const s = this.settings, sc = this.scene;
    this.engine.setHardwareScalingLevel(1 / clamp(s.renderScale, 0.5, 1.5));
    this.city.detailRadius = s.viewDistance;
    if (this.shadows) { this.shadows.dispose(); this.shadows = null; }
    if (s.quality !== 'low') {
      const sg = new ShadowGenerator(s.quality === 'high' ? 4096 : 2048, this.sun);
      sg.usePercentageCloserFiltering = true; sg.filteringQuality = s.quality === 'high' ? ShadowGenerator.QUALITY_HIGH : ShadowGenerator.QUALITY_MEDIUM;
      sg.bias = 0.0012; sg.normalBias = 0.03; sg.setDarkness(0.32);
      this.sun.autoUpdateExtends = false; this.sun.shadowFrustumSize = 150; this.sun.shadowMinZ = 1; this.sun.shadowMaxZ = 420;
      const list = sg.getShadowMap()!.renderList!;
      for (const m of this.city.shadowCasters) list.push(m);
      for (const c of this.city.cells) if (c.detail) for (const m of c.detail) if ((m as any).__cast) list.push(m);
      list.push(this.boxes.mesh, this.heads.mesh, this.wheels.mesh);
      for (const p of this.vehPaint.values()) list.push(p.mesh);
      this.shadows = sg;
    }
    if (this.pipeline) { this.pipeline.dispose(); this.pipeline = null; }
    if (s.quality !== 'low') {
      const p = new DefaultRenderingPipeline('pipe', true, sc, [this.camera]);
      p.fxaaEnabled = true; p.bloomEnabled = true; p.bloomThreshold = 0.78; p.bloomWeight = s.quality === 'high' ? 0.4 : 0.32; p.bloomKernel = 48; p.bloomScale = 0.5;
      p.imageProcessingEnabled = true; p.imageProcessing.toneMappingEnabled = true; p.imageProcessing.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
      p.imageProcessing.contrast = 1.12; p.imageProcessing.exposure = 1.25; p.imageProcessing.vignetteEnabled = true; p.imageProcessing.vignetteWeight = 1.1; p.imageProcessing.vignetteColor = new Color4(0, 0, 0, 0);
      this.pipeline = p;
    }
  }
  warm(x: number, z: number) { this.city.warm(x, z); }
  resize() { this.engine.resize(); }

  // ------------------------------------------------------------------ environment
  private updateEnvironment(dt: number) {
    const sim = this.sim, clock = sim.clock, h = clock.hour, w = sim.weather;
    const night = clock.night, sunset = clock.sunset, rain = w.rain;
    this.night = night;
    // sun path through the afternoon; a high moon takes over after dusk
    const elev = h < 19.9 ? lerp(58, -6, smoothstep(14, 19.9, h)) : 42;
    const az = h < 19.9 ? lerp(205, 282, (h - 14) / 5.9) : 140;
    const er = (Math.max(elev, 5) * Math.PI) / 180, ar = (az * Math.PI) / 180;
    const sx = Math.sin(ar) * Math.cos(er), sy = Math.sin(er), sz = Math.cos(ar) * Math.cos(er);
    this.sun.direction.set(-sx, -sy, -sz);
    const mix3 = (a: number[], b: number[], t: number) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
    let sunC = mix3([1, 0.95, 0.86], [1, 0.58, 0.32], sunset); sunC = mix3(sunC, [0.42, 0.52, 0.85], night);
    const dim = 1 - 0.45 * rain;
    this.sun.diffuse.set(sunC[0], sunC[1], sunC[2]); this.sun.specular.set(sunC[0], sunC[1], sunC[2]);
    this.sun.intensity = lerp(lerp(2.5, 1.9, sunset), 0.75, night) * dim;
    let skyC = mix3([0.66, 0.76, 0.95], [0.85, 0.66, 0.68], sunset); skyC = mix3(skyC, [0.26, 0.34, 0.6], night);
    let gndC = mix3([0.5, 0.44, 0.36], [0.5, 0.36, 0.33], sunset); gndC = mix3(gndC, [0.16, 0.17, 0.26], night);
    this.hemi.diffuse.set(skyC[0], skyC[1], skyC[2]); this.hemi.groundColor.set(gndC[0], gndC[1], gndC[2]); this.hemi.specular.set(0, 0, 0);
    this.hemi.intensity = lerp(lerp(0.95, 0.85, sunset), 1.15, night);
    if (this.shadows) this.shadows.setDarkness(lerp(0.32, 0.72, night));
    let zen = mix3([0.16, 0.44, 0.84], [0.2, 0.22, 0.5], sunset); zen = mix3(zen, [0.015, 0.025, 0.07], night);
    let hor = mix3([0.72, 0.86, 0.96], [1.0, 0.6, 0.36], sunset); hor = mix3(hor, [0.07, 0.1, 0.2], night);
    const grey = lerp(0.52, 0.09, night); zen = mix3(zen, [grey * 0.8, grey * 0.85, grey * 0.95], rain * 0.85); hor = mix3(hor, [grey, grey * 1.03, grey * 1.08], rain * 0.8);
    this.skyMat.setVector3('zenith', this.uZen.set(zen[0], zen[1], zen[2])); this.skyMat.setVector3('horizon', this.uHor.set(hor[0], hor[1], hor[2]));
    this.skyMat.setVector3('sunDir', this.uSun.set(sx, sy, sz)); this.skyMat.setVector3('sunCol', this.uSunCol.set(sunC[0] * dim, sunC[1] * dim, sunC[2] * dim));
    this.skyMat.setFloat('night', night * (1 - rain));
    this.scene.clearColor.set(hor[0], hor[1], hor[2], 1);
    this.scene.fogColor.set(hor[0] * 0.96, hor[1] * 0.96, hor[2] * 0.96);
    this.scene.fogDensity = (lerp(0.0011, 0.0018, night) + rain * 0.0022) * (this.settings.quality === 'low' ? 1.25 : 1);
    this.mats.facade.emissiveTexture!.level = 0.04 + night * 1.5 + rain * 0.2 * (1 - night);
    const gn = 0.3 + night * 0.7; this.mats.glowNight.emissiveColor.set(gn, gn, gn);
    const wet = w.wetness;
    const spec = 0.05 + wet * 0.5; this.mats.ground.specularColor.set(spec, spec, spec * 1.05); this.mats.ground.specularPower = lerp(40, 110, wet);
    const gd = 1 - wet * 0.22; this.mats.ground.diffuseColor.set(gd, gd, gd);
    this.lampPool.setEnabled(night > 0.04); this.mats.pool.alpha = 1;
    (this.lampPool as any).visibility = night;
    this.mats.water.diffuseColor.set(lerp(0.1, 0.02, night), lerp(0.36, 0.07, night), lerp(0.44, 0.14, night));
    this.waterBump.uOffset += dt * 0.004; this.waterBump.vOffset += dt * 0.0025;
    if (this.pipeline) this.pipeline.imageProcessing.exposure = lerp(1.25, 1.5, night);
    this.fill.intensity = night * 0.9;
  }

  // ------------------------------------------------------------------ dynamic drawing helpers
  private part(pool: Pool, sx: number, sy: number, sz: number, a: number, jx: number, jy: number, jz: number, ox: number, oy: number, oz: number, color: number, k = 1) {
    const c = Math.cos(a), s = Math.sin(a);
    Matrix.FromValuesToRef(sx, 0, 0, 0, 0, sy * c, sy * s, 0, 0, -sz * s, sz * c, 0, jx + ox, jy + oy * c - oz * s, jz + oy * s + oz * c, 1, T1);
    T1.multiplyToRef(ROOT, T2);
    pool.add(T2, (((color >> 16) & 255) / 255) * k, (((color >> 8) & 255) / 255) * k, ((color & 255) / 255) * k);
  }
  /** Draw a humanoid from box parts. ROOT must already hold its root matrix when `useRoot` is set. */
  private human(v: HumanView, fade: number, far: boolean, useRoot = false) {
    if (v.pose === 'hidden') return;
    const L = v.look, sc = L.scale * fade;
    let drop = 0, legL = 0, legR = 0, armL = 0, armR = 0, torso = 0, pitch = 0, lift = 0, legScale = 1;
    const sw = Math.sin(v.phase) * Math.min(1, v.gait) * 0.8;
    legL = sw; legR = -sw; armL = -sw * 0.8; armR = sw * 0.8;
    switch (v.pose) {
      case 'crouch': drop = 0.38; legScale = 0.62; torso = 0.35; legL *= 0.6; legR *= 0.6; break;
      case 'sit': drop = 0.42; legL = legR = -1.45; break;
      case 'ride': legL = legR = -1.05; armL = armR = -1.15; torso = 0.38; break;
      case 'down': pitch = -Math.PI / 2; lift = 0.18; legL = 0.1; legR = -0.15; armL = 0.4; armR = -0.3; break;
      case 'swim': pitch = 1.15; lift = 0.55; armL = -2.6 + sw; armR = -2.6 - sw; break;
      case 'cower': drop = 0.45; legScale = 0.55; torso = 0.6; armL = armR = -2.7; break;
      case 'phone': armR = -2.5; break;
      case 'handsup': armL = armR = Math.PI; break;
      case 'aim': armR = -1.5; armL = v.armed === 2 ? -1.35 : armL * 0.5; break;
      case 'talk': armR = -0.5 + Math.sin(v.phase * 0.6) * 0.3; break;
      case 'mantle': armL = armR = -2.8; legL = -0.6; break;
    }
    if (!useRoot) {
      Quaternion.RotationYawPitchRollToRef(v.yaw, pitch, -v.lean, Q);
      Matrix.ComposeToRef(S.set(sc, sc, sc), Q, V.set(v.x, v.y + lift, v.z), ROOT);
    }
    const b = this.boxes, hipY = 0.92 - drop;
    this.part(b, 0.42, 0.54, 0.24, torso, 0, hipY + 0.03, 0, 0, 0.33, 0, L.top);
    this.part(b, 0.36, 0.2, 0.22, 0, 0, hipY, 0, 0, 0, 0, L.bottom);
    this.part(this.heads, 0.25, 0.27, 0.25, torso, 0, hipY + 0.03, 0, 0, 0.75, 0.01, L.skin);
    this.part(b, 0.15, 0.9 * legScale, 0.17, legL, -0.1, hipY, 0, 0, -0.45 * legScale, 0, L.bottom, 0.92);
    this.part(b, 0.15, 0.9 * legScale, 0.17, legR, 0.1, hipY, 0, 0, -0.45 * legScale, 0, L.bottom, 0.92);
    if (far) return;
    const shY = hipY + 0.56 - torso * 0.06, shZ = torso * 0.3;
    this.part(b, 0.11, 0.6, 0.12, armL, -0.27, shY, shZ, 0, -0.29, 0, L.top, 0.9);
    this.part(b, 0.11, 0.6, 0.12, armR, 0.27, shY, shZ, 0, -0.29, 0, L.top, 0.9);
    if (L.hat === 0) this.part(this.heads, 0.275, 0.2, 0.285, torso, 0, hipY + 0.03, 0, 0, 0.815, -0.025, L.hair);
    else if (L.hat === 3) this.part(this.heads, 0.3, 0.29, 0.31, torso, 0, hipY + 0.03, 0, 0, 0.79, 0, 0x2c3036);
    else { this.part(b, 0.27, 0.1, 0.28, torso, 0, hipY + 0.03, 0, 0, 0.87, 0, SKIN_HAT[L.hat]); this.part(b, 0.22, 0.025, 0.14, torso, 0, hipY + 0.03, 0, 0, 0.83, 0.17, SKIN_HAT[L.hat], 0.8); }
    if (L.pack) this.part(b, 0.3, 0.36, 0.15, torso, 0, hipY + 0.03, 0, 0, 0.36, -0.2, 0x2f8f86);
    if (v.armed === 1) this.part(b, 0.05, 0.1, 0.26, armR, 0.27, shY, shZ, 0, -0.6, 0.08, 0x1a1c20);
    else if (v.armed === 2) this.part(b, 0.06, 0.1, 0.72, armR, 0.27, shY, shZ, -0.08, -0.58, 0.2, 0x1a1c20);
    else if (v.armed === 3) this.part(b, 0.045, 0.5, 0.045, armR - 0.5, 0.27, shY, shZ, 0, -0.75, 0.05, 0x22252a);
  }
  private glowBox(x: number, y: number, z: number, sx: number, sy: number, sz: number, r: number, g: number, b: number, yaw = 0) {
    Quaternion.RotationYawPitchRollToRef(yaw, 0, 0, Q);
    Matrix.ComposeToRef(S.set(sx, sy, sz), Q, V.set(x, y, z), T1);
    this.glow.add(T1, r, g, b);
  }
  private localGlow(lx: number, ly: number, lz: number, sx: number, sy: number, sz: number, r: number, g: number, b: number) {
    Matrix.FromValuesToRef(sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, lx, ly, lz, 1, T1); T1.multiplyToRef(VEH, T2); this.glow.add(T2, r, g, b);
  }
  private groundPool(x: number, y: number, z: number, sx: number, sz: number, yaw: number, r: number, g: number, b: number) {
    Quaternion.RotationYawPitchRollToRef(yaw, 0, 0, Q);
    Matrix.ComposeToRef(S.set(sx, 1, sz), Q, V.set(x, y, z), T1); this.dynPools.add(T1, r, g, b, 1);
  }

  private drawVehicle(v: Vehicle, alpha: number, camX: number, camZ: number) {
    const x = lerp(v.px, v.x, alpha), y = lerp(v.py, v.y, alpha), z = lerp(v.pz, v.z, alpha);
    const d = Math.hypot(x - camX, z - camZ);
    if (d > 300) return;
    quatSlerp(v.pq, v.q, alpha, _q);
    Q.set(_q.x, _q.y, _q.z, _q.w);
    Matrix.ComposeToRef(ONE, Q, V.set(x, y, z), VEH);
    const spec = v.spec;
    if (spec.moto && Math.abs(v.lean) > 0.005) { Matrix.RotationZToRef(-v.lean, T3); T3.multiplyToRef(VEH, VEH); }
    if (v === this.sim.player.vehicle) this.playerVeh.copyFrom(VEH);
    const [r, g, b] = rgb(v.color), dmg = 0.72 + 0.28 * (v.hull / 100);
    this.vehPaint.get(spec.id)!.add(VEH, r * dmg, g * dmg, b * dmg);
    this.vehTrim.get(spec.id)!.add(VEH, 1, 1, 1);
    if (d < 170) {
      const wr = spec.wheelRadius, ww = spec.moto ? 0.07 : 0.115;
      for (let i = 0; i < 4; i++) {
        if (spec.moto && i % 2 === 1) continue;
        const w = v.wheels[i];
        const steer = w.front ? v.steerAngle : 0;
        Quaternion.RotationYawPitchRollToRef(steer, w.spin, 0, Q);
        Matrix.ComposeToRef(S.set(ww, wr, wr), Q, V.set(spec.moto ? 0 : w.lx, v.hpY - w.len - wr + wr, w.lz), T1);
        T1.multiplyToRef(VEH, T2); this.wheels.add(T2, 1, 1, 1);
      }
    }
    // lamps
    const night = this.night, hw = spec.width / 2, hl = spec.length / 2, ly = spec.cls === 'van' ? spec.clearance + 0.62 : spec.clearance + (spec.body.beltH - spec.clearance) * 0.62;
    const active = v.driver !== 'none';
    if (d < 200 && !spec.moto) {
      if (active && night > 0.15) for (const s of [-1, 1]) this.localGlow(s * (hw - 0.24), ly, hl + 0.02, 0.3, 0.12, 0.04, 1, 0.95, 0.8);
      const tb = v.brakeLight ? 1 : active && night > 0.15 ? 0.45 : 0;
      if (tb > 0) for (const s of [-1, 1]) this.localGlow(s * (hw - 0.22), ly + 0.02, -hl - 0.02, 0.34, 0.11, 0.04, tb, 0.05 * tb, 0.03 * tb);
      if (v.hazard && Math.floor(this.time * 2) % 2 === 0) for (const s of [-1, 1]) for (const e of [-1, 1]) this.localGlow(s * (hw - 0.05), ly, e * (hl - 0.05), 0.1, 0.08, 0.1, 1, 0.6, 0.1);
    } else if (d < 200 && spec.moto && active) {
      if (night > 0.15) this.localGlow(0, spec.wheelRadius + 0.5, hl - 0.2, 0.14, 0.1, 0.05, 1, 0.95, 0.8);
      if (v.brakeLight || night > 0.15) this.localGlow(0, spec.wheelRadius + 0.42, -hl + 0.12, 0.1, 0.06, 0.04, v.brakeLight ? 1 : 0.4, 0.03, 0.03);
    }
    if (spec.cls === 'police' && v.siren && d < 260) {
      // photosensitivity: under 3 Hz, or a slow cross-fade with reduced flashes
      const slow = this.settings.reducedFlashes;
      const ph = slow ? 0.5 + 0.5 * Math.sin(this.time * 2.2) : Math.floor(this.time * 2.6) % 2;
      const top = spec.body.beltH + spec.body.cabinH + 0.16;
      this.localGlow(-0.3, top, -0.1, 0.34, 0.1, 0.16, 1 * ph, 0.08 * ph, 0.08 * ph);
      this.localGlow(0.3, top, -0.1, 0.34, 0.1, 0.16, 0.1 * (1 - ph), 0.25 * (1 - ph), 1 * (1 - ph));
      if (night > 0.1 || this.sim.weather.rain > 0.3) this.groundPool(x, y + 0.08, z, 16, 16, 0, 0.5 * ph + 0.05, 0.08, 0.5 * (1 - ph) + 0.05);
    }
    if (active && night > 0.2 && d < 120) this.groundPool(x + Math.sin(v.yaw) * (hl + 5), y + 0.07, z + Math.cos(v.yaw) * (hl + 5), 5.5, 12, v.yaw, 0.5 * night, 0.47 * night, 0.38 * night);
    // riders
    if (spec.moto && active && v.driver !== 'player' && d < 140) {
      Matrix.TranslationToRef(0, spec.wheelRadius - 0.36, -0.22, T1); T1.multiplyToRef(VEH, ROOT);
      const h = hash2(v.id, 3, 1);
      const look: Look = { skin: 0xc68d6a, top: [0x35e0d0, 0x8a9aa3, 0xd9482b, 0x3a4048][Math.floor(h * 4)], bottom: 0x2c3036, hair: 0x2a1f1a, hat: 3, pack: h > 0.6 ? 1 : 0, scale: 1 };
      this.human({ x: 0, y: 0, z: 0, yaw: 0, phase: 0, gait: 0, pose: 'ride', look, armed: 0, lean: 0 }, 1, d > 70, true);
    }
    // effects: tyre smoke, damage smoke, canal spray
    if (d < 110) {
      if (v.skid > 0.35 && v.speedAbs > 4 && Math.random() < 0.6) for (const w of v.wheels) if (w.slip > 0.3 && w.grounded) this.spawn(w.cx, w.cy + 0.1, w.cz, (Math.random() - 0.5), 0.8, (Math.random() - 0.5), 0.9, 0.5, 2.2, 0.85, 0.85, 0.85, 0.3, 0, false);
      if (v.engine < 55 && Math.random() < (v.engine < 25 ? 0.5 : 0.18)) { const k = v.engine < 25 ? 0.12 : 0.4; this.spawn(x + Math.sin(v.yaw) * hl * 0.7, y + 1.0, z + Math.cos(v.yaw) * hl * 0.7, v.vx * 0.3, 1.6, v.vz * 0.3, 1.6, 0.6, 2.4, k, k, k, 0.5, 0, false); }
      if (v.surface === 'water' && v.speedAbs > 3 && Math.random() < 0.7) this.spawn(x + (Math.random() - 0.5) * 1.6, CANAL.water + 0.1, z + (Math.random() - 0.5) * 1.6, -v.vx * 0.1, 2.5 + v.speedAbs * 0.12, -v.vz * 0.1, 0.6, 0.4, 1.5, 0.8, 0.9, 0.95, 0.5, -9, false);
      if (this.sim.weather.wetness > 0.4 && v.speedAbs > 8 && v.groundedWheels > 1 && Math.random() < 0.3) this.spawn(x - Math.sin(v.yaw) * hl, y + 0.2, z - Math.cos(v.yaw) * hl, v.vx * 0.3, 1.0, v.vz * 0.3, 0.45, 0.4, 2.4, 0.75, 0.8, 0.85, 0.1, -2, false);
    }
  }
  private spawn(x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number, size: number, grow: number, r: number, g: number, b: number, a: number, grav: number, add: boolean) {
    if (this.particles.length > 1200) return;
    this.particles.push({ x, y, z, vx, vy, vz, life, max: life, size, grow, r, g, b, a, grav, add });
  }
  private onVfx(e: { kind: string; x: number; y: number; z: number; dx?: number; dy?: number; dz?: number; n?: number }) {
    const n = e.n ?? 6, R = () => Math.random() - 0.5, flash = this.settings.reducedFlashes ? 0.5 : 1;
    switch (e.kind) {
      case 'sparks': for (let i = 0; i < n; i++) this.spawn(e.x, e.y, e.z, R() * 9, Math.random() * 5, R() * 9, 0.25 + Math.random() * 0.3, 0.12, 0, 1, 0.75, 0.3, 1, -14, true); break;
      case 'muzzle': this.spawn(e.x, e.y, e.z, 0, 0, 0, 0.06, 0.55, 0, 1 * flash, 0.85 * flash, 0.5 * flash, 1, 0, true); break;
      case 'impact': for (let i = 0; i < n; i++) this.spawn(e.x, e.y, e.z, (e.dx ?? 0) * 2 + R() * 2, (e.dy ?? 0) * 2 + Math.random() * 2, (e.dz ?? 0) * 2 + R() * 2, 0.4, 0.14, 0.5, 0.7, 0.68, 0.62, 0.7, -6, false); break;
      case 'dust': for (let i = 0; i < n; i++) this.spawn(e.x + R(), e.y, e.z + R(), R(), 0.6, R(), 0.9, 0.5, 1.6, 0.7, 0.66, 0.58, 0.35, 0, false); break;
      case 'splash': for (let i = 0; i < n; i++) this.spawn(e.x + R() * 2, e.y, e.z + R() * 2, R() * 4, 4 + Math.random() * 5, R() * 4, 0.9, 0.45, 1.2, 0.85, 0.93, 0.97, 0.6, -10, false); break;
      case 'glass': for (let i = 0; i < n; i++) this.spawn(e.x, e.y, e.z, R() * 5, Math.random() * 3, R() * 5, 0.5, 0.08, 0, 0.8, 0.95, 1, 0.9, -12, true); break;
      case 'stun': for (let i = 0; i < n; i++) this.spawn(e.x, e.y, e.z, R() * 4, R() * 4, R() * 4, 0.3, 0.16, 0, 0.4, 0.8, 1, 1, 0, true); break;
      case 'smokebomb': for (let i = 0; i < n; i++) this.spawn(e.x + R() * 3, e.y + Math.random() * 1.5, e.z + R() * 3, R() * 1.2, 0.35, R() * 1.2, 5 + Math.random() * 3, 2.2, 0.6, 0.78, 0.8, 0.8, 0.5, 0, false); break;
      case 'smoke': for (let i = 0; i < n; i++) this.spawn(e.x, e.y, e.z, R(), 1.2, R(), 1.5, 0.5, 2, 0.5, 0.5, 0.5, 0.4, 0, false); break;
    }
  }
  private drawParticles(dt: number) {
    const cam = this.camera, wm = cam.getWorldMatrix().m;
    const rx = wm[0], ry = wm[1], rz = wm[2], ux = wm[4], uy = wm[5], uz = wm[6], fx = wm[8], fy = wm[9], fz = wm[10];
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) { this.particles[i] = this.particles[this.particles.length - 1]; this.particles.pop(); continue; }
      p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.size += p.grow * dt;
      const t = p.life / p.max, s = p.size, a = p.a * (p.add ? t : Math.min(1, t * 2.2) * Math.min(1, (1 - t) * 8 + 0.2));
      Matrix.FromValuesToRef(rx * s, ry * s, rz * s, 0, ux * s, uy * s, uz * s, 0, fx, fy, fz, 0, p.x, p.y, p.z, 1, T1);
      if (p.add) this.partAdd.add(T1, p.r * a, p.g * a, p.b * a, 1); else this.partAlpha.add(T1, p.r, p.g, p.b, a);
    }
  }

  // ------------------------------------------------------------------ frame
  render(alpha: number, dt: number) {
    const sim = this.sim, p = sim.player;
    this.time += dt;
    this.rig.update(sim, alpha, dt, this.settings);
    const camX = this.rig.x, camZ = this.rig.z;
    this.updateEnvironment(dt);
    const pv = p.vehicle;
    this.city.update(camX, camZ, pv ? pv.vx : p.body.vx, pv ? pv.vz : p.body.vz);
    this.sky.position.copyFrom(this.camera.position);
    // shadow frustum follows the player on a texel-snapped grid
    const fx = Math.round(p.x / 4) * 4, fz = Math.round(p.z / 4) * 4, dir = this.sun.direction;
    this.sun.position.set(fx - dir.x * 200, p.y - dir.y * 200, fz - dir.z * 200);
    this.fill.position.set(p.x, p.y + 4.5, p.z);

    for (const pool of [this.boxes, this.heads, this.glow, this.wheels, this.dynPools, this.partAlpha, this.partAdd]) pool.begin();
    for (const pl of this.vehPaint.values()) pl.begin(); for (const pl of this.vehTrim.values()) pl.begin();

    for (const v of sim.vehicles.list) this.drawVehicle(v, alpha, camX, camZ);
    // player
    const view = p.view();
    if (pv && pv.isMoto) { Matrix.TranslationToRef(0, pv.spec.wheelRadius - 0.36, -0.22, T1); T1.multiplyToRef(this.playerVeh, ROOT); this.human(view, 1, false, true); }
    else if (!pv && this.rig.dist > 0.85) { const b = p.body; view.x = lerp(b.px, b.x, alpha); view.y = lerp(b.py, b.y, alpha); view.z = lerp(b.pz, b.z, alpha); this.human(view, 1, false); }
    for (const a of sim.actors.list) {
      if (a.inVehicle) continue;
      const b = a.body, d = Math.hypot(b.x - camX, b.z - camZ); if (d > 170) continue;
      const v = a.view(); v.x = lerp(b.px, b.x, alpha); v.y = lerp(b.py, b.y, alpha); v.z = lerp(b.pz, b.z, alpha);
      this.human(v, 1, d > 75);
    }
    for (const q of sim.peds.list) {
      const d = Math.hypot(q.x - camX, q.z - camZ); if (d > 160 || q.gone) continue;
      this.human(q.view(), q.fade, d > 65);
      if (q.state === 'CallEmergency' && d < 40) this.glowBox(q.x, q.y + 2.25 + Math.sin(this.time * 6) * 0.05, q.z, 0.14, 0.14, 0.14, 1, 0.75, 0.2, this.time * 3);
    }
    // dynamic props, doors, gadgets
    for (const pr of sim.props) {
      const t = pr.body.translation(), q = pr.body.rotation(), sp = DYN_SPECS[pr.kind];
      if (Math.hypot(t.x - camX, t.z - camZ) > 120) continue;
      Q.set(q.x, q.y, q.z, q.w); Matrix.ComposeToRef(S.set(sp.hx * 2, sp.hy * 2, sp.hz * 2), Q, V.set(t.x, t.y, t.z), T1);
      const [r, g, b] = rgb(sp.color); this.boxes.add(T1, r, g, b);
    }
    for (const d of sim.closedDoors()) { Matrix.ComposeToRef(S.set(d.hx * 2, d.hy * 2, d.hz * 2), Quaternion.Identity(), V.set(d.x, d.y, d.z), T1); const [r, g, b] = rgb(d.color); this.boxes.add(T1, r, g, b); }
    for (const g of sim.gadgets) {
      if (g.t < 0) { const k = 1 + g.t / 0.6; this.glowBox(lerp(g.sx, g.x, k), lerp(g.sy, g.y, k) + Math.sin(k * Math.PI) * 2, lerp(g.sz, g.z, k), 0.14, 0.14, 0.14, 0.9, 0.9, 0.3); }
      else if (g.kind === 'chirper') { const on = Math.floor(g.t * 4) % 2; this.glowBox(g.x, g.y + 0.1, g.z, 0.16, 0.12, 0.16, 0.3 + on * 0.7, 0.9, 0.3); }
    }
    // traffic signals near the camera
    const sig = sim.signals;
    for (const it of intersections) {
      if (!it.signal || Math.abs(it.x - camX) > 190 || Math.abs(it.z - camZ) > 190) continue;
      const ns = sig.light(it, 'NS'), ew = sig.light(it, 'EW');
      const corners: [number, number, string][] = [[it.rect.x1 + 0.8, it.rect.z1 + 0.8, ns], [it.rect.x1 + 0.8, it.rect.z0 - 0.8, ew], [it.rect.x0 - 0.8, it.rect.z0 - 0.8, ns], [it.rect.x0 - 0.8, it.rect.z1 + 0.8, ew]];
      for (const [x, z, l] of corners) {
        const y = hillHeight(x, z) + 5.0;
        this.glowBox(x, y + 0.34, z, 0.26, 0.2, 0.26, l === 'red' ? 1 : 0.16, 0.03, 0.03);
        this.glowBox(x, y, z, 0.26, 0.2, 0.26, l === 'yellow' ? 1 : 0.15, l === 'yellow' ? 0.75 : 0.11, 0.02);
        this.glowBox(x, y - 0.34, z, 0.26, 0.2, 0.26, 0.03, l === 'green' ? 1 : 0.15, l === 'green' ? 0.45 : 0.06);
      }
    }
    // cameras: status LED (red while it has the player)
    for (const c of cameras) {
      if (!sim.police.cameraActive(c) || Math.hypot(c.x - camX, c.z - camZ) > 90) continue;
      const sees = (sim.police.cameraSees.get(c.id) ?? 0) > 0, yaw = sim.police.cameraYaw(c);
      this.glowBox(c.x + Math.sin(yaw) * 0.4, c.y, c.z + Math.cos(yaw) * 0.4, 0.1, 0.1, 0.1, sees ? 1 : 0.1, sees ? 0.1 : 0.9, 0.1);
      if (this.night > 0.2 || sim.police.inRestricted(sim.player.x, sim.player.z)) this.groundPool(c.x + Math.sin(yaw) * c.range * 0.5, surfaceY(c.x, c.z) + 0.09, c.z + Math.cos(yaw) * c.range * 0.5, c.range * 0.55, c.range, yaw, sees ? 0.5 : 0.1, sees ? 0.05 : 0.3, 0.05);
    }
    // tram shuttling along the viaduct
    {
      const tx = Math.sin(this.time * 0.045) * 400, ty = hillHeight(tx, 438) + 11 + 1.75;
      for (const o of [-7.5, 7.5]) { Matrix.ComposeToRef(S.set(14, 2.9, 2.6), Quaternion.Identity(), V.set(tx + o, ty, 446), T1); this.boxes.add(T1, 0.9, 0.36, 0.2); this.glowBox(tx + o, ty + 0.5, 444.66, 12.5, 0.9, 0.05, 0.9 * (0.4 + this.night * 0.6), 0.85 * (0.4 + this.night * 0.6), 0.6 * (0.4 + this.night * 0.6)); }
    }
    // mission / world markers
    for (const m of this.markers) {
      const [r, g, b] = rgb(m.color), y = surfaceY(m.x, m.z), pulse = 0.75 + 0.25 * Math.sin(this.time * 4);
      if (Math.hypot(m.x - camX, m.z - camZ) > 420) continue;
      this.groundPool(m.x, y + 0.1, m.z, m.r * 2.4, m.r * 2.4, 0, r * 0.55 * pulse, g * 0.55 * pulse, b * 0.55 * pulse);
      if (m.beam) { this.glowBox(m.x, y + 16, m.z, 0.12, 26, 0.12, r * 0.85, g * 0.85, b * 0.85, this.time); this.glowBox(m.x, y + 1.9 + Math.sin(this.time * 2.4) * 0.2, m.z, 0.5, 0.5, 0.5, r, g, b, this.time * 1.5); }
    }
    if (this.ghost) this.glowBox(this.ghost.x, surfaceY(this.ghost.x, this.ghost.z) + 0.9, this.ghost.z, 1.5, 1.0, 3.4, 0.25, 0.75, 0.9, 0);
    // tracers
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i]; t.t += dt;
      if (t.t > 0.07) { this.tracers.splice(i, 1); continue; }
      const dx = t.bx - t.ax, dy = t.by - t.ay, dz = t.bz - t.az, len = Math.hypot(dx, dy, dz);
      Quaternion.RotationYawPitchRollToRef(Math.atan2(dx, dz), -Math.asin(dy / (len || 1)), 0, Q);
      Matrix.ComposeToRef(S.set(0.03, 0.03, len), Q, V.set((t.ax + t.bx) / 2, (t.ay + t.by) / 2, (t.az + t.bz) / 2), T1);
      if (t.stun) this.glow.add(T1, 0.3, 0.8, 1); else this.glow.add(T1, 1, 0.9, 0.6);
    }
    // rain: world-anchored streaks that wrap around the camera (stretched soft sprites, one draw call)
    if (sim.weather.rain > 0.04) {
      const n = Math.floor((this.settings.quality === 'low' ? 260 : 700) * sim.weather.rain), wm = this.camera.getWorldMatrix().m, camY = this.rig.y;
      for (let i = 0; i < n; i++) {
        const hx = hash2(i, 1, 7) * 46, hz = hash2(i, 2, 7) * 46, ph = hash2(i, 3, 7);
        const x = camX + ((((hx - camX) % 46) + 46) % 46) - 23, z = camZ + ((((hz - camZ) % 46) + 46) % 46) - 23;
        const y = camY + 13 - ((this.time * 27 + ph * 22) % 22), len = 0.8 + ph * 0.7;
        Matrix.FromValuesToRef(wm[0] * 0.045, wm[1] * 0.045, wm[2] * 0.045, 0, -0.06 * len, len, 0, 0, wm[8], wm[9], wm[10], 0, x, y, z, 1, T1);
        this.partAdd.add(T1, 0.34, 0.4, 0.5, 1);
      }
    }
    // rain splashes on the road near the camera
    if (sim.weather.rain > 0.3 && this.settings.quality !== 'low') for (let k = 0; k < 3; k++) { const x = camX + (Math.random() - 0.5) * 40, z = camZ + (Math.random() - 0.5) * 40; this.spawn(x, surfaceY(x, z) + 0.05, z, 0, 0.4, 0, 0.25, 0.12, 0.8, 0.8, 0.86, 0.95, 0.35, 0, false); }
    this.drawParticles(dt);

    for (const pool of [this.boxes, this.heads, this.glow, this.wheels, this.dynPools, this.partAlpha, this.partAdd]) pool.end();
    for (const pl of this.vehPaint.values()) pl.end(); for (const pl of this.vehTrim.values()) pl.end();
    this.scene.render();
    const dc = (this.engine as any)._drawCalls?.current ?? 0;
    this.drawCalls = dc >= this.lastDraws ? dc - this.lastDraws : dc; this.lastDraws = dc;
  }
  dispose() { this.scene.dispose(); this.engine.dispose(); }
}
void ANCHORS; void damp;
