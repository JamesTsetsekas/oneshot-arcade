// Babylon.js renderer: scene, sky, sun/moon lighting & shadows, water, streamed district,
// thin-instanced actors, VFX, markers, day→night & rain, quality presets and dynamic res.

import {
  Engine, Scene, FreeCamera, Vector3, Color3, Color4, HemisphericLight, DirectionalLight, ShadowGenerator, MeshBuilder,
  StandardMaterial, ShaderMaterial, Effect, Mesh, GlowLayer, ParticleSystem, Texture, SpotLight, Camera, Matrix, Quaternion,
} from "@babylonjs/core";
import type { Game, Fx } from "../sim/game";
import { WorldRender } from "./world-render";
import { ActorRender } from "./actors";
import { waterNormalTexture, blobTexture } from "./textures";
import { clamp, lerp, smoothstep } from "../core/math";
import { WATER_LEVEL } from "../world/district";

Effect.ShadersStore["skyVertexShader"] = `
precision highp float;
attribute vec3 position;
uniform mat4 worldViewProjection;
varying vec3 vPos;
void main(){ vPos = position; gl_Position = worldViewProjection * vec4(position,1.0); }`;
Effect.ShadersStore["skyFragmentShader"] = `
precision highp float;
varying vec3 vPos;
uniform vec3 top; uniform vec3 horizon; uniform vec3 sunDir; uniform vec3 sunColor; uniform float stars;
float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719)))*43758.5453); }
void main(){
  vec3 d = normalize(vPos);
  float h = clamp(d.y, -0.2, 1.0);
  vec3 col = mix(horizon, top, pow(max(h,0.0), 0.55));
  float s = max(dot(d, normalize(sunDir)), 0.0);
  col += sunColor * (pow(s, 600.0) * 4.0 + pow(s, 12.0) * 0.35);
  if (stars > 0.0) { vec3 q = floor(d * 380.0); float st = step(0.9975, hash(q)) * stars * smoothstep(0.05, 0.4, d.y); col += vec3(st); }
  if (d.y < 0.0) col = mix(col, horizon * 0.8, clamp(-d.y * 4.0, 0.0, 1.0));
  gl_FragColor = vec4(col, 1.0);
}`;

interface Pool { mesh: Mesh; mat: Float32Array; life: Float32Array; data: Float32Array; n: number; max: number }

export class Renderer {
  engine: Engine;
  scene: Scene;
  camera: FreeCamera;
  sun: DirectionalLight;
  hemi: HemisphericLight;
  shadows: ShadowGenerator | null = null;
  world: WorldRender;
  actors: ActorRender;
  sky: Mesh;
  skyMat: ShaderMaterial;
  water: Mesh;
  glow: GlowLayer | null = null;
  sparks: ParticleSystem; dust: ParticleSystem; smoke: ParticleSystem; splash: ParticleSystem; rain: ParticleSystem; tireSmoke: ParticleSystem; smokeBig: ParticleSystem;
  tracers: Pool;
  markers: Mesh[] = [];
  rings: Mesh[] = [];
  arrows: Mesh[] = [];
  camMeshes = new Map<string, { body: Mesh; cone: Mesh }>();
  drone: Mesh;
  spikes: Mesh;
  gadgetMesh: Mesh;
  smokeT = 0;
  quality: "low" | "medium" | "high" = "medium";
  frameMs: number[] = [];
  dynScale = 1;
  contextLost = false;
  headlight: SpotLight;
  waterMat: StandardMaterial;
  private casterSet = new Set<Mesh>();

  constructor(canvas: HTMLCanvasElement, private game: Game) {
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, antialias: true, powerPreference: "high-performance" }, true);
    if (this.engine.webGLVersion < 2) throw new Error("WebGL 2 is required.");
    this.engine.onContextLostObservable.add(() => { this.contextLost = true; });
    this.engine.onContextRestoredObservable.add(() => { this.contextLost = false; });
    const scene = (this.scene = new Scene(this.engine));
    scene.clearColor = new Color4(0.6, 0.75, 0.9, 1);
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.0028;
    scene.skipPointerMovePicking = true;
    scene.autoClear = true;
    this.camera = new FreeCamera("cam", new Vector3(0, 30, -50), scene);
    this.camera.minZ = 0.15; this.camera.maxZ = 2400;
    this.camera.fovMode = Camera.FOVMODE_HORIZONTAL_FIXED;
    this.camera.inputs.clear();
    this.hemi = new HemisphericLight("hemi", new Vector3(0.2, 1, 0.1), scene);
    this.sun = new DirectionalLight("sun", new Vector3(-0.4, -0.8, 0.35), scene);
    this.sun.shadowMinZ = 1; this.sun.shadowMaxZ = 600;
    this.sun.autoUpdateExtends = false;
    this.sun.shadowFrustumSize = 170;
    this.makeShadows(true, 2048);
    const caster = (m: Mesh) => { this.casterSet.add(m); this.shadows?.addShadowCaster(m, false); };
    this.world = new WorldRender(scene, game.d, caster);
    this.actors = new ActorRender(scene, caster);
    // sky
    this.skyMat = new ShaderMaterial("sky", scene, { vertex: "sky", fragment: "sky" }, { attributes: ["position"], uniforms: ["worldViewProjection", "top", "horizon", "sunDir", "sunColor", "stars"] });
    this.skyMat.backFaceCulling = false;
    this.sky = MeshBuilder.CreateSphere("sky", { diameter: 4000, segments: 16 }, scene);
    this.sky.material = this.skyMat;
    this.sky.infiniteDistance = true;
    this.sky.applyFog = false;
    this.sky.isPickable = false;
    // water
    this.water = MeshBuilder.CreateGround("water", { width: 1800, height: 1800, subdivisions: 1 }, scene);
    this.water.position.y = WATER_LEVEL;
    const wm = (this.waterMat = new StandardMaterial("waterMat", scene));
    wm.diffuseColor = new Color3(0.1, 0.32, 0.38);
    wm.specularColor = new Color3(0.9, 0.9, 0.9); wm.specularPower = 90;
    const wt = waterNormalTexture(scene);
    wt.uScale = wt.vScale = 120;
    wm.bumpTexture = wt;
    wm.alpha = 0.88;
    this.water.material = wm;
    this.water.receiveShadows = true;
    this.water.isPickable = false;
    // vfx
    const blob = blobTexture(scene, "blob", "255,255,255"); blob.hasAlpha = true;
    const mkPS = (name: string, cap: number, c1: Color4, c2: Color4, size: [number, number], life: [number, number], grav: number, blend = ParticleSystem.BLENDMODE_STANDARD) => {
      const ps = new ParticleSystem(name, cap, scene);
      ps.particleTexture = blob as unknown as Texture;
      ps.color1 = c1; ps.color2 = c2; ps.colorDead = new Color4(c2.r, c2.g, c2.b, 0);
      ps.minSize = size[0]; ps.maxSize = size[1]; ps.minLifeTime = life[0]; ps.maxLifeTime = life[1];
      ps.gravity = new Vector3(0, grav, 0); ps.emitRate = 0; ps.blendMode = blend;
      ps.minEmitPower = 1; ps.maxEmitPower = 4; ps.updateSpeed = 0.016;
      ps.emitter = new Vector3(0, -100, 0);
      ps.start();
      return ps;
    };
    this.sparks = mkPS("sparks", 600, new Color4(1, 0.8, 0.3, 1), new Color4(1, 0.4, 0.1, 1), [0.05, 0.14], [0.15, 0.4], -9, ParticleSystem.BLENDMODE_ADD);
    this.dust = mkPS("dust", 600, new Color4(0.7, 0.66, 0.6, 0.8), new Color4(0.55, 0.52, 0.5, 0.5), [0.2, 0.6], [0.4, 0.9], -1);
    this.smoke = mkPS("smoke", 900, new Color4(0.25, 0.25, 0.27, 0.6), new Color4(0.12, 0.12, 0.13, 0.4), [0.8, 1.8], [1.2, 2.2], 1.5);
    this.tireSmoke = mkPS("tsmoke", 900, new Color4(0.92, 0.92, 0.92, 0.5), new Color4(0.8, 0.8, 0.82, 0.25), [0.8, 2.0], [0.8, 1.8], 0.8);
    this.smokeBig = mkPS("smokebig", 900, new Color4(0.86, 0.87, 0.88, 0.85), new Color4(0.75, 0.76, 0.78, 0.6), [3.5, 6.5], [6, 10], 0.15);
    this.splash = mkPS("splash", 500, new Color4(0.85, 0.95, 1, 0.9), new Color4(0.6, 0.8, 0.9, 0.5), [0.2, 0.6], [0.4, 1.0], -9);
    this.rain = mkPS("rain", 4000, new Color4(0.7, 0.78, 0.88, 0.45), new Color4(0.6, 0.7, 0.8, 0.3), [0.04, 0.07], [0.6, 0.8], -30);
    this.rain.minScaleY = 8; this.rain.maxScaleY = 12;
    this.rain.minEmitBox = new Vector3(-30, 18, -30); this.rain.maxEmitBox = new Vector3(30, 22, 30);
    this.rain.direction1 = new Vector3(-0.5, -8, 0); this.rain.direction2 = new Vector3(0.5, -8, 0.3);
    this.rain.isLocal = false;
    // tracers
    const tm = MeshBuilder.CreateBox("tracer", { size: 1 }, scene);
    const tmat = new StandardMaterial("tracerMat", scene); tmat.emissiveColor = new Color3(1, 0.85, 0.5); tmat.disableLighting = true;
    tm.material = tmat; tm.isPickable = false;
    this.tracers = { mesh: tm, mat: new Float32Array(64 * 16), life: new Float32Array(64), data: new Float32Array(64 * 7), n: 0, max: 64 };
    tm.thinInstanceSetBuffer("matrix", this.tracers.mat, 16, false); tm.thinInstanceCount = 0; tm.alwaysSelectAsActiveMesh = true;
    // markers
    const mkm = (name: string, color: Color3, alpha: number) => { const m = new StandardMaterial(name, scene); m.emissiveColor = color; m.diffuseColor = color; m.alpha = alpha; m.disableLighting = true; m.backFaceCulling = false; return m; };
    const beamMat = mkm("beam", new Color3(1, 0.75, 0.25), 0.28);
    const ringMat = mkm("ring", new Color3(1, 0.8, 0.3), 0.55);
    const arrowMat = mkm("arrow", new Color3(0.3, 0.9, 1), 0.9);
    for (let i = 0; i < 8; i++) {
      const b = MeshBuilder.CreateCylinder(`beam${i}`, { diameter: 1, height: 40, tessellation: 16, cap: Mesh.NO_CAP }, scene);
      b.material = beamMat; b.isPickable = false; b.setEnabled(false); this.markers.push(b);
      const r = MeshBuilder.CreateTorus(`ring${i}`, { diameter: 1, thickness: 0.04, tessellation: 32 }, scene);
      r.material = ringMat; r.isPickable = false; r.setEnabled(false); this.rings.push(r);
      const a = MeshBuilder.CreateCylinder(`arrow${i}`, { diameterTop: 0, diameterBottom: 0.9, height: 1.1, tessellation: 4 }, scene);
      a.rotation.x = Math.PI; a.material = arrowMat; a.isPickable = false; a.setEnabled(false); this.arrows.push(a);
    }
    // security cameras
    const camBodyMat = new StandardMaterial("cambody", scene); camBodyMat.diffuseColor = new Color3(0.85, 0.85, 0.82);
    const coneMat = mkm("cone", new Color3(1, 0.3, 0.2), 0.12);
    for (const c of game.police.cameras) {
      const body = MeshBuilder.CreateBox(`cam_${c.id}`, { width: 0.3, height: 0.25, depth: 0.55 }, scene);
      body.material = camBodyMat; body.position.set(c.x, c.y, c.z);
      const cone = MeshBuilder.CreateCylinder(`camcone_${c.id}`, { diameterTop: 0.1, diameterBottom: Math.tan(c.fov) * c.range * 2, height: c.range, tessellation: 12, cap: Mesh.NO_CAP }, scene);
      cone.bakeTransformIntoVertices(Matrix.Translation(0, -c.range / 2, 0).multiply(Matrix.RotationX(-Math.PI / 2)));
      cone.material = coneMat; cone.position.set(c.x, c.y, c.z); cone.isPickable = false;
      this.camMeshes.set(c.id, { body, cone });
    }
    const dm = new StandardMaterial("droneMat", scene); dm.diffuseColor = new Color3(0.2, 0.22, 0.25); dm.emissiveColor = new Color3(0.4, 0.05, 0.05);
    this.drone = MeshBuilder.CreateBox("drone", { width: 1.4, height: 0.3, depth: 1.4 }, scene); this.drone.material = dm; this.drone.setEnabled(false);
    const sm = new StandardMaterial("spikeMat", scene); sm.diffuseColor = new Color3(0.15, 0.15, 0.15); sm.emissiveColor = new Color3(0.3, 0.25, 0.05);
    this.spikes = MeshBuilder.CreateBox("spikes", { width: 8, height: 0.08, depth: 1.0 }, scene); this.spikes.material = sm; this.spikes.setEnabled(false);
    this.gadgetMesh = MeshBuilder.CreateSphere("gadget", { diameter: 0.25, segments: 6 }, scene);
    const gm = new StandardMaterial("gadgetMat", scene); gm.emissiveColor = new Color3(0.4, 0.9, 0.4); this.gadgetMesh.material = gm; this.gadgetMesh.setEnabled(false);
    // player vehicle headlight at night
    this.headlight = new SpotLight("headlight", new Vector3(0, 2, 0), new Vector3(0, -0.2, 1), Math.PI / 3, 6, scene);
    this.headlight.intensity = 0; this.headlight.range = 60; this.headlight.diffuse = new Color3(1, 0.95, 0.8);
    this.applyQuality(game.settings.quality, game.settings.shadows);
    (globalThis as any).__game = game;
  }

  private makeShadows(on: boolean, size: number) {
    if (this.shadows) { this.shadows.dispose(); this.shadows = null; }
    if (!on) return;
    const sg = new ShadowGenerator(size, this.sun);
    sg.usePercentageCloserFiltering = true;
    sg.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
    sg.bias = 0.0008; sg.normalBias = 0.02;
    sg.darkness = 0.25;
    this.shadows = sg;
    for (const m of this.casterSet ?? []) sg.addShadowCaster(m, false);
  }

  applyQuality(q: "low" | "medium" | "high", shadows: boolean) {
    this.quality = q;
    const size = q === "high" ? 4096 : 2048;
    this.makeShadows(shadows && q !== "low", size);
    this.world.viewDist = q === "low" ? 250 : q === "medium" ? 360 : 460;
    this.scene.fogDensity = q === "low" ? 0.0042 : q === "medium" ? 0.003 : 0.0022;
    if (q !== "low" && !this.glow) { this.glow = new GlowLayer("glow", this.scene, { mainTextureSamples: 1, blurKernelSize: 32 }); this.glow.intensity = 0.6; }
    if (q === "low" && this.glow) { this.glow.dispose(); this.glow = null; }
    this.engine.setHardwareScalingLevel(q === "low" ? 1.5 : 1);
    this.dynScale = 1;
    this.rain.emitRate = 0;
  }

  /** Build cells near the start point synchronously (loading screen), returns progress 0..1. */
  preload(x: number, z: number, budgetMs: number) {
    const remaining = this.world.update(x, z, 0, 0, budgetMs);
    return { built: this.world.builtCount, remaining };
  }

  private consumeFx(fx: Fx[]) {
    for (const f of fx) {
      switch (f.type) {
        case "shot": {
          this.burst(this.sparks, f.x, f.y, f.z, 4, 1.5);
          const t = this.tracers;
          const i = t.n % t.max;
          t.n++;
          t.life[i] = 0.07;
          t.data.set([f.x, f.y, f.z, f.tx, f.ty, f.tz, 1], i * 7);
          break;
        }
        case "stun": {
          const t = this.tracers; const i = t.n % t.max; t.n++; t.life[i] = 0.15; t.data.set([f.x, f.y, f.z, f.tx, f.ty, f.tz, 3], i * 7);
          break;
        }
        case "impact":
          if (f.mat === "spark" || f.mat === "glass") this.burst(this.sparks, f.x, f.y, f.z, 10, 3);
          else if (f.mat === "water") this.burst(this.splash, f.x, f.y, f.z, 10, 2);
          else this.burst(this.dust, f.x, f.y, f.z, 6, 1.5);
          break;
        case "crash": this.burst(this.sparks, f.x, f.y, f.z, Math.round(10 + f.power * 30), 4); this.burst(this.dust, f.x, f.y, f.z, 8, 2); break;
        case "splash": this.burst(this.splash, f.x, f.y, f.z, 60, 6); break;
        case "smoke": this.smokeT = 13; this.smokePos = new Vector3(f.x, f.y + 1, f.z); break;
        case "melee": this.burst(this.dust, f.x, f.y, f.z, 3, 1); break;
        default: break;
      }
    }
  }
  private smokePos = new Vector3();

  private burst(ps: ParticleSystem, x: number, y: number, z: number, n: number, power: number) {
    ps.emitter = new Vector3(x, y, z);
    ps.minEmitPower = power * 0.4; ps.maxEmitPower = power;
    ps.direction1 = new Vector3(-1, 0.5, -1); ps.direction2 = new Vector3(1, 1.5, 1);
    ps.manualEmitCount = (ps.manualEmitCount > 0 ? ps.manualEmitCount : 0) + n;
  }

  render(alpha: number, realDt: number) {
    const g = this.game;
    const t0 = performance.now();
    const cam = g.cam;
    // camera
    this.camera.position.set(cam.pos.x, cam.pos.y, cam.pos.z);
    this.camera.setTarget(new Vector3(cam.target.x, cam.target.y, cam.target.z));
    this.camera.fov = (cam.fov * Math.PI) / 180;
    // streaming around the focus point
    const pv = g.player.vehicle;
    this.world.update(g.focus.x, g.focus.z, pv?.vx ?? 0, pv?.vz ?? 0, 3);
    this.world.updateTram(g.time);
    if (g.props.some((p) => p.dirty)) this.world.updateProps(g.props);
    // which interior are we in (hide its roof)
    let inside: string | null = null;
    if (!g.attract) {
      const p = g.player;
      for (const it of g.d.interiors) if (p.x > it.x0 && p.x < it.x1 && p.z > it.z0 && p.z < it.z1) inside = it.id;
    }
    this.world.setInteriorView(inside);

    // --- lighting / time of day
    const h = g.clock.hour;
    const dayK = smoothstep(5.5, 7.5, h) * (1 - smoothstep(18.6, 20.4, h));
    const sunsetK = Math.exp(-Math.pow((h - 18.9) / 1.1, 2)) + Math.exp(-Math.pow((h - 6.4) / 0.8, 2)) * 0.7;
    const night = 1 - dayK;
    const ang = ((h - 6) / 12) * Math.PI;
    const sunDir = new Vector3(Math.cos(ang) * 0.75, -Math.max(0.12, Math.sin(ang)), 0.45).normalize();
    const moonDir = new Vector3(-0.3, -0.85, -0.35).normalize();
    const rain = g.weather.rain;
    const ld = night > 0.6 ? moonDir : sunDir;
    this.sun.direction = ld;
    const P = g.focus;
    this.sun.position = new Vector3(P.x - ld.x * 250, 250, P.z - ld.z * 250);
    const sunCol = Color3.Lerp(new Color3(1, 0.96, 0.88), new Color3(1, 0.62, 0.38), clamp(sunsetK, 0, 1));
    this.sun.diffuse = Color3.Lerp(sunCol, new Color3(0.45, 0.55, 0.8), night);
    this.sun.intensity = lerp(0.2, 1.35, dayK) * (1 - rain * 0.45);
    this.hemi.diffuse = Color3.Lerp(new Color3(0.62, 0.72, 0.88), new Color3(0.32, 0.36, 0.55), night);
    this.hemi.groundColor = Color3.Lerp(new Color3(0.38, 0.33, 0.3), new Color3(0.16, 0.13, 0.2), night);
    this.hemi.intensity = lerp(0.42, 0.72, dayK) * (1 - rain * 0.2);
    const top = Color3.Lerp(Color3.Lerp(new Color3(0.3, 0.52, 0.85), new Color3(0.32, 0.36, 0.6), clamp(sunsetK, 0, 1) * 0.6), new Color3(0.02, 0.03, 0.08), night);
    let horizon = Color3.Lerp(Color3.Lerp(new Color3(0.75, 0.84, 0.92), new Color3(0.98, 0.62, 0.4), clamp(sunsetK, 0, 1)), new Color3(0.1, 0.08, 0.16), night);
    horizon = Color3.Lerp(horizon, new Color3(0.4, 0.43, 0.48).scale(1 - night * 0.7), rain * 0.7);
    this.skyMat.setColor3("top", Color3.Lerp(top, new Color3(0.3, 0.33, 0.38).scale(1 - night * 0.8), rain * 0.7));
    this.skyMat.setColor3("horizon", horizon);
    this.skyMat.setVector3("sunDir", night > 0.6 ? moonDir.scale(-1) : sunDir.scale(-1));
    this.skyMat.setColor3("sunColor", night > 0.6 ? new Color3(0.5, 0.55, 0.7) : sunCol.scale(1 - rain));
    this.skyMat.setFloat("stars", night * (1 - rain));
    this.scene.fogColor = horizon;
    this.scene.clearColor = new Color4(horizon.r, horizon.g, horizon.b, 1);
    const lampK = clamp(smoothstep(18.8, 20.2, h) + (1 - smoothstep(5.5, 6.8, h)) * (h < 12 ? 1 : 0), 0, 1);
    this.world.setNight(lampK, g.weather.wet);
    if (this.glow) this.glow.intensity = 0.2 + lampK * 0.4;
    this.actors.lightsMat.emissiveColor.set(0.25 + lampK * 1.2, 0.22 + lampK * 1.1, 0.2 + lampK * 0.9);
    this.waterMat.diffuseColor = Color3.Lerp(new Color3(0.1, 0.32, 0.38), new Color3(0.03, 0.07, 0.12), night);
    (this.waterMat.bumpTexture as Texture).uOffset = g.time * 0.004;
    (this.waterMat.bumpTexture as Texture).vOffset = g.time * 0.003;
    // rain follows the camera
    this.rain.emitter = new Vector3(cam.pos.x, cam.pos.y, cam.pos.z);
    this.rain.emitRate = rain > 0.05 ? rain * (this.quality === "low" ? 900 : 2400) : 0;
    // headlight for the player's vehicle at night
    if (pv && lampK > 0.3) {
      const fx = Math.sin(pv.yaw), fz = Math.cos(pv.yaw);
      this.headlight.position.set(pv.x + fx * pv.hl, pv.y + 0.8, pv.z + fz * pv.hl);
      this.headlight.direction.set(fx, -0.12, fz);
      this.headlight.intensity = 2.2 * lampK;
    } else this.headlight.intensity = 0;

    // --- actors
    const A = this.actors;
    A.begin();
    const photosafe = g.settings.photosensitive;
    const night01 = lampK;
    const camx = cam.pos.x, camz = cam.pos.z;
    for (const v of g.vehicles) {
      if (Math.abs(v.x - camx) > 420 || Math.abs(v.z - camz) > 420) continue;
      A.drawVehicle(v, alpha, night01, g.time, photosafe);
      // damage smoke & tire smoke
      if (v.health < 35 && Math.random() < realDt * 12) this.burst(this.smoke, v.x + Math.sin(v.yaw) * v.hl * 0.8, v.y + 1.0, v.z + Math.cos(v.yaw) * v.hl * 0.8, 1, 0.5);
      if (v.slip > 0.45 && v.speed > 5 && Math.random() < realDt * 30 * v.slip && g.surfaceAt(v.x, v.z) !== "water") this.burst(this.tireSmoke, v.x - Math.sin(v.yaw) * v.hl * 0.7, v.y + 0.3, v.z - Math.cos(v.yaw) * v.hl * 0.7, 1, 0.4);
      if (v.speed > 4 && g.surfaceAt(v.x, v.z) === "water" && Math.random() < realDt * 20) this.burst(this.splash, v.x, v.y + 0.2, v.z, 2, 2);
    }
    if (!g.attract && !g.player.vehicle) A.drawHuman(g.player, alpha, { hidden: !g.player.alive && false });
    for (const c of g.chars) {
      if (c.vehicle) continue;
      if (Math.abs(c.x - camx) > 160 || Math.abs(c.z - camz) > 160) continue;
      A.drawHuman(c, alpha);
    }
    A.end();
    // ghost replay
    const m = g.mission;
    const ghost = m && g.circuitActive ? g.ghostAt(g.time - m.circuitStart) : null;
    A.ghost.setEnabled(!!ghost);
    if (ghost) { A.ghost.position.set(ghost.x, g.heightAt(ghost.x, ghost.z) + 0.8, ghost.z); A.ghost.rotation.y = ghost.yaw; }

    // --- fx
    this.consumeFx(g.fx);
    g.fx.length = 0;
    const tr = this.tracers;
    let tn = 0;
    const tmp = new Matrix();
    for (let i = 0; i < tr.max; i++) {
      if (tr.life[i] <= 0) continue;
      tr.life[i] -= realDt;
      const d = tr.data.subarray(i * 7, i * 7 + 7);
      const dx = d[3] - d[0], dy = d[4] - d[1], dz = d[5] - d[2];
      const L = Math.hypot(dx, dy, dz);
      const yaw = Math.atan2(dx, dz), pitch = -Math.atan2(dy, Math.hypot(dx, dz));
      const w = d[6] > 2 ? 0.07 : 0.025;
      Matrix.ComposeToRef(new Vector3(w, w, L), Quaternion.RotationYawPitchRoll(yaw, pitch, 0), new Vector3((d[0] + d[3]) / 2, (d[1] + d[4]) / 2, (d[2] + d[5]) / 2), tmp);
      tmp.copyToArray(tr.mat, tn * 16);
      tn++;
    }
    tr.mesh.thinInstanceCount = tn;
    tr.mesh.isVisible = tn > 0;
    tr.mesh.thinInstanceBufferUpdated("matrix");
    if (this.smokeT > 0) { this.smokeT -= realDt; if (Math.random() < realDt * 14) { this.smokeBig.emitter = this.smokePos.add(new Vector3((Math.random() - 0.5) * 6, 0, (Math.random() - 0.5) * 6)); this.smokeBig.minEmitPower = 0.2; this.smokeBig.maxEmitPower = 0.8; this.smokeBig.manualEmitCount = 2; } }

    // markers
    const mk = g.ui.markers;
    for (let i = 0; i < this.markers.length; i++) {
      const mm = mk[i];
      const show = !!mm && !g.attract;
      this.markers[i].setEnabled(show && mm.kind !== "vehicle" && mm.kind !== "area");
      this.rings[i].setEnabled(show && mm.kind !== "vehicle");
      this.arrows[i].setEnabled(show && mm.kind === "vehicle");
      if (!show) continue;
      const y = g.groundAt(mm.x, mm.z);
      const r = mm.kind === "area" ? mm.r : Math.max(1.2, mm.r);
      this.markers[i].position.set(mm.x, y + 20, mm.z);
      this.markers[i].scaling.set(r * 0.5, 1, r * 0.5);
      this.rings[i].position.set(mm.x, y + 0.2, mm.z);
      this.rings[i].scaling.set(r * 2, 1, r * 2);
      if (mm.kind === "vehicle") { const v = g.vehicles.find((q) => q.tag === mm.tag); if (v) this.arrows[i].position.set(v.x, v.y + v.spec.height + 1.4 + Math.sin(g.time * 3) * 0.2, v.z); }
    }
    // security cameras (cones only shown when restricted & active, or during missions)
    for (const c of g.police.cameras) {
      const mm = this.camMeshes.get(c.id)!;
      mm.body.rotation.y = c.yaw; mm.cone.rotation.y = c.yaw;
      const showCone = !!g.mission && c.restricted && c.disabledUntil < g.time;
      mm.cone.setEnabled(showCone);
    }
    const dr = g.police.drone;
    this.drone.setEnabled(dr.active);
    if (dr.active) { this.drone.position.set(dr.x, dr.y, dr.z); this.drone.rotation.y = g.time; }
    const sp = g.police.spikes[0];
    this.spikes.setEnabled(!!sp);
    if (sp) { this.spikes.position.set(sp.x, g.heightAt(sp.x, sp.z) + 0.05, sp.z); this.spikes.rotation.y = sp.yaw + Math.PI / 2; }
    const th = g.thrown[0];
    this.gadgetMesh.setEnabled(!!th);
    if (th) this.gadgetMesh.position.set(th.x, th.y, th.z);

    this.scene.render();
    // dynamic resolution: keep frame time near 16.7 ms
    const ft = this.engine.getDeltaTime();
    this.frameMs.push(ft);
    if (this.frameMs.length > 120) this.frameMs.shift();
    if (g.settings.dynamicRes && this.frameMs.length === 120 && this.quality !== "low") {
      const avg = this.frameMs.reduce((a, b) => a + b, 0) / 120;
      const prev = this.dynScale;
      if (avg > 24 && this.dynScale < 1.6) this.dynScale += 0.1;
      else if (avg < 15 && this.dynScale > 1) this.dynScale -= 0.05;
      if (Math.abs(prev - this.dynScale) > 0.01) { this.engine.setHardwareScalingLevel(this.dynScale); this.frameMs.length = 0; }
    }
    return performance.now() - t0;
  }

  resize() { this.engine.resize(); }
}
