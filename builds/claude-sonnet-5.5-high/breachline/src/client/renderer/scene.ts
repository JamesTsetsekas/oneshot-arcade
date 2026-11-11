// Renderer: Babylon.js scene, lights, shadows, post-processing, camera, entity views and effect routing.
import {
  Engine, Scene, FreeCamera, Vector3, Color3, Color4, HemisphericLight, DirectionalLight, CascadedShadowGenerator, ShadowGenerator,
  DefaultRenderingPipeline, ImageProcessingConfiguration, SceneInstrumentation, MeshBuilder, StandardMaterial, Mesh, TransformNode, Texture,
} from "@babylonjs/core";
import type { World } from "../../shared/sim/world";
import { eyeHeight, aimDir } from "../../shared/sim/world";
import type { PlayerState } from "../../shared/sim/types";
import type { SimEvent } from "../../shared/protocol";
import { buildTextures, type TextureSet } from "./textures";
import { buildMapView, type MapView } from "./mapBuilder";
import { buildWeaponMats, type WeaponMats } from "./weaponModels";
import { CharacterFactory, CharacterView } from "./characters";
import { Viewmodel } from "./viewmodel";
import { Vfx } from "./vfx";
import { clamp, lerp, wrapAngle } from "../../shared/math";
import { hfovToVfov, type Settings } from "../runtime/settings";

export interface CameraInput {
  yaw: number; // render-rate view yaw (radians)
  pitch: number;
  dYaw: number;
  dPitch: number;
}

export interface RenderStats { drawCalls: number; fps: number; frameMs: number; meshes: number; triangles: number }

export class Renderer {
  engine: Engine;
  scene: Scene;
  camera: FreeCamera;
  sun: DirectionalLight;
  hemi: HemisphericLight;
  shadow: ShadowGenerator | null = null;
  pipeline: DefaultRenderingPipeline | null = null;
  T: TextureSet;
  wmats: WeaponMats;
  mapView: MapView;
  chars: CharacterFactory;
  views = new Map<number, CharacterView>();
  vm: Viewmodel;
  vfx: Vfx;
  private projViews = new Map<number, Mesh>();
  private depViews = new Map<number, TransformNode>();
  private flightMesh: TransformNode;
  private laserMat: StandardMaterial;
  private lasers = new Map<number, Mesh>();
  private shake = 0;
  private landDip = 0;
  private deathCamPos: Vector3 | null = null;
  private deathYaw = 0;
  private deathPitch = 0;
  private skyMesh: Mesh;
  private lastAdsFov = 90;
  private settings: Settings;
  private time = 0;
  private lastLocalSlot = -1;
  localId = 0;
  private instr: SceneInstrumentation;
  fpsSmooth = 60;
  frameMsSmooth = 8;

  constructor(private canvas: HTMLCanvasElement, settings: Settings, world: World, palette: [string, string]) {
    this.settings = settings;
    this.engine = new Engine(canvas, settings.antiAliasing, { powerPreference: "high-performance", stencil: false, preserveDrawingBuffer: false, antialias: settings.antiAliasing }, true);
    this.engine.setHardwareScalingLevel(1 / settings.renderScale);
    this.scene = new Scene(this.engine);
    const scene = this.scene;
    scene.clearColor = new Color4(0.62, 0.8, 0.92, 1);
    scene.fogMode = Scene.FOGMODE_EXP2; scene.fogDensity = 0.0042; scene.fogColor = new Color3(0.72, 0.84, 0.92);
    scene.skipPointerMovePicking = true; scene.autoClear = true;
    scene.setRenderingAutoClearDepthStencil(1, true, true, false);
    scene.setRenderingAutoClearDepthStencil(2, true, true, false);
    scene.blockMaterialDirtyMechanism = false;

    this.camera = new FreeCamera("cam", new Vector3(0, 1.7, 0), scene);
    this.camera.minZ = 0.04; this.camera.maxZ = 600; this.camera.inputs.clear(); this.camera.fov = 1.2;
    scene.activeCamera = this.camera;

    this.hemi = new HemisphericLight("hemi", new Vector3(0.1, 1, 0.05), scene);
    this.hemi.diffuse = new Color3(0.86, 0.93, 1.0); this.hemi.groundColor = new Color3(0.58, 0.54, 0.5); this.hemi.specular = new Color3(0.2, 0.2, 0.2); this.hemi.intensity = 0.78;
    this.sun = new DirectionalLight("sun", new Vector3(-0.42, -0.78, -0.46), scene);
    this.sun.diffuse = new Color3(1, 0.96, 0.88); this.sun.specular = new Color3(0.6, 0.58, 0.5); this.sun.intensity = 2.0;
    this.sun.position = new Vector3(40, 80, 40);
    this.sun.autoUpdateExtends = true;

    this.T = buildTextures(scene);
    this.wmats = buildWeaponMats(scene);
    this.setupShadows();
    this.mapView = buildMapView(scene, world.map, this.T, this.shadow);
    // sky dome
    this.skyMesh = MeshBuilder.CreateSphere("sky", { diameter: 1800, segments: 24, sideOrientation: Mesh.BACKSIDE }, scene);
    const sm = new StandardMaterial("sky_m", scene);
    sm.emissiveTexture = this.T.sky; sm.disableLighting = true; sm.fogEnabled = false; sm.backFaceCulling = false; sm.diffuseColor = Color3.Black(); sm.specularColor = Color3.Black();
    (sm.emissiveTexture as Texture).vScale = -1;
    this.skyMesh.material = sm; this.skyMesh.infiniteDistance = true; this.skyMesh.isPickable = false; this.skyMesh.applyFog = false;
    this.skyMesh.renderingGroupId = 0;

    this.chars = new CharacterFactory(scene, this.wmats, this.shadow, this.T, palette);
    this.vm = new Viewmodel(scene, this.wmats, this.camera, this.T.star);
    this.vfx = new Vfx(scene, this.T);
    this.vfx.density = settings.effects;
    this.flightMesh = this.buildJet();
    this.laserMat = new StandardMaterial("laser", scene); this.laserMat.emissiveColor = new Color3(1, 0.1, 0.1); this.laserMat.disableLighting = true; this.laserMat.alpha = 0.7;
    this.instr = new SceneInstrumentation(scene);
    this.setupPipeline();
    this.applyQuality();
  }

  private setupShadows(): void {
    if (this.shadow) { this.shadow.dispose(); this.shadow = null; }
    if (!this.settings.shadows) return;
    const csm = new CascadedShadowGenerator(this.settings.preset === "high" ? 2048 : 1024, this.sun);
    csm.numCascades = 3; csm.lambda = 0.88; csm.shadowMaxZ = 90; csm.stabilizeCascades = true; csm.bias = 0.004; csm.normalBias = 0.04;
    csm.filter = ShadowGenerator.FILTER_PCF; csm.filteringQuality = ShadowGenerator.QUALITY_LOW; csm.darkness = 0.3; csm.depthClamp = true;
    csm.autoCalcDepthBounds = true;
    this.shadow = csm;
  }

  private setupPipeline(): void {
    if (this.pipeline) { this.pipeline.dispose(); this.pipeline = null; }
    const p = new DefaultRenderingPipeline("pipe", true, this.scene, [this.camera]);
    p.samples = this.settings.antiAliasing && this.settings.preset !== "low" ? 4 : 1;
    p.fxaaEnabled = this.settings.antiAliasing && this.settings.preset === "low";
    p.bloomEnabled = this.settings.preset !== "low";
    p.bloomThreshold = 0.92; p.bloomWeight = this.settings.photosensitive ? 0.1 : 0.2; p.bloomKernel = 40; p.bloomScale = 0.5;
    p.imageProcessingEnabled = true;
    const ip = p.imageProcessing;
    ip.toneMappingEnabled = true; ip.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES; ip.exposure = 1.0; ip.contrast = 1.18;
    ip.vignetteEnabled = true; ip.vignetteWeight = 1.2; ip.vignetteStretch = 0.2; ip.vignetteColor = new Color4(0.02, 0.05, 0.08, 0); ip.vignetteCameraFov = 0.5;
    ip.colorCurvesEnabled = true;
    const cc = ip.colorCurves!;
    cc.globalSaturation = 18; cc.highlightsHue = 40; cc.highlightsDensity = 18; cc.shadowsHue = 215; cc.shadowsDensity = 22; cc.shadowsSaturation = 14;
    this.pipeline = p;
  }

  applySettings(s: Settings): void {
    const rebuild = s.shadows !== this.settings.shadows || s.preset !== this.settings.preset || s.antiAliasing !== this.settings.antiAliasing;
    this.settings = s;
    this.engine.setHardwareScalingLevel(1 / s.renderScale);
    this.vfx.density = s.effects;
    if (rebuild) {
      this.setupShadows();
      if (this.shadow) for (const m of this.mapView.casters) this.shadow.addShadowCaster(m);
      this.setupPipeline();
    }
    this.applyQuality();
  }

  private applyQuality(): void {
    const low = this.settings.preset === "low";
    this.scene.fogEnabled = true;
    this.camera.maxZ = low ? 300 : 600;
    if (this.pipeline) this.pipeline.bloomEnabled = !low;
  }

  setRenderScale(scale: number): void { this.engine.setHardwareScalingLevel(1 / clamp(scale, 0.4, 1)); }

  private buildJet(): TransformNode {
    const root = new TransformNode("jet", this.scene);
    const m = new StandardMaterial("jet_m", this.scene); m.diffuseColor = new Color3(0.22, 0.25, 0.28); m.specularColor = new Color3(0.4, 0.4, 0.4);
    const body = MeshBuilder.CreateBox("jb", { width: 1.2, height: 0.7, depth: 9 }, this.scene); body.material = m; body.parent = root;
    const wing = MeshBuilder.CreateBox("jw", { width: 11, height: 0.14, depth: 3.4 }, this.scene); wing.material = m; wing.parent = root; wing.position.z = -1;
    const tail = MeshBuilder.CreateBox("jt", { width: 3.4, height: 0.12, depth: 1.6 }, this.scene); tail.material = m; tail.parent = root; tail.position.z = -4;
    const fin = MeshBuilder.CreateBox("jf", { width: 0.12, height: 1.4, depth: 1.5 }, this.scene); fin.material = m; fin.parent = root; fin.position.set(0, 0.8, -4);
    const glow = MeshBuilder.CreateBox("jg", { width: 0.5, height: 0.3, depth: 0.5 }, this.scene);
    const gm = new StandardMaterial("jg_m", this.scene); gm.emissiveColor = new Color3(1, 0.5, 0.1); gm.disableLighting = true; glow.material = gm; glow.parent = root; glow.position.z = -4.8;
    root.setEnabled(false);
    return root;
  }

  resize(): void { this.engine.resize(); }

  // ----------------------------------------------------------------- frame
  frame(world: World, alpha: number, dt: number, time: number, me: PlayerState, cam: CameraInput, opts: { showMarkers: boolean; speed: number; cookingKind: string; hideViewmodel?: boolean }): void {
    this.time = time;
    const s = this.settings;
    const aspect = this.engine.getRenderWidth() / Math.max(1, this.engine.getRenderHeight());
    // ---------- field of view with ADS
    const baseTan = Math.tan((s.fov * Math.PI) / 360 * 1); // placeholder to keep types simple
    void baseTan;
    const w = me.weapons[me.slot];
    const adsEased = me.adsT * me.adsT * (3 - 2 * me.adsT);
    const hfov = s.fov;
    const adsMul = w.stats.adsFov;
    const tanH = Math.tan((hfov * Math.PI) / 360);
    const tanAds = tanH * lerp(1, adsMul, adsEased);
    const vfov = 2 * Math.atan(tanAds / aspect);
    this.camera.fov = vfov;
    this.vm.setFovCompensation(vfov, hfovToVfov(s.viewmodelFov, aspect));
    this.lastAdsFov = vfov;

    // ---------- camera pose
    const eye = { x: lerp(me.prevPos.x, me.pos.x, alpha), y: lerp(me.prevPos.y, me.pos.y, alpha) + eyeHeight(me), z: lerp(me.prevPos.z, me.pos.z, alpha) };
    this.shake = Math.max(0, this.shake - dt * 3.2);
    const sh = this.shake * s.shakeScale * (s.reducedMotion ? 0.25 : 1);
    this.landDip = Math.max(0, this.landDip - dt * 5);
    if (me.alive) {
      this.deathCamPos = null;
      this.camera.position.set(eye.x, eye.y - this.landDip * 0.08 * (s.reducedMotion ? 0.3 : 1) * s.shakeScale, eye.z);
      const yaw = cam.yaw + me.recoilY;
      const pitch = clamp(cam.pitch + me.recoilP, -1.5, 1.5);
      this.camera.rotation.set(-pitch + (Math.random() - 0.5) * sh * 0.05, yaw + (Math.random() - 0.5) * sh * 0.05, (Math.random() - 0.5) * sh * 0.06);
    } else {
      // death cam: sink to the ground and look at the attacker
      if (!this.deathCamPos) { this.deathCamPos = new Vector3(eye.x, eye.y, eye.z); this.deathYaw = cam.yaw; this.deathPitch = cam.pitch; }
      const r = me.recap;
      const t = Math.min(1, (world.time - me.deadAt) / 0.6);
      this.camera.position.set(this.deathCamPos.x, lerp(this.deathCamPos.y, 0.35, t * t), this.deathCamPos.z);
      if (r && r.attacker >= 0) {
        const killer = world.players[r.attacker];
        const kp = killer && killer.alive ? killer.pos : r.killerPos;
        const wantYaw = Math.atan2(kp.x - this.deathCamPos.x, kp.z - this.deathCamPos.z);
        const wantPitch = Math.atan2(kp.y + 1.2 - this.camera.position.y, Math.hypot(kp.x - this.deathCamPos.x, kp.z - this.deathCamPos.z));
        this.deathYaw += wrapAngle(wantYaw - this.deathYaw) * Math.min(1, dt * 4);
        this.deathPitch += (wantPitch - this.deathPitch) * Math.min(1, dt * 4);
      }
      this.camera.rotation.set(-this.deathPitch, this.deathYaw, t * 0.15);
    }

    // ---------- characters
    for (const p of world.players) {
      let v = this.views.get(p.id);
      if (!v) { v = this.chars.create(p.team, p); this.views.set(p.id, v); }
      if (p.id === me.id) { v.root.setEnabled(false); v.marker.isVisible = false; v.muzzleFlash.isVisible = false; continue; }
      v.update(p, alpha, dt, time, opts.showMarkers && p.team === me.team);
    }
    // ---------- viewmodel
    this.vm.visible = !opts.hideViewmodel;
    this.vm.update({ p: me, dt, ads: adsEased, viewDYaw: cam.dYaw, viewDPitch: cam.dPitch, bobScale: s.bobScale, reducedMotion: s.reducedMotion, speed: opts.speed, time, cookingKind: opts.cookingKind });
    // ---------- entities
    this.syncProjectiles(world, alpha);
    this.syncDeployables(world, time);
    this.syncSupport(world, me);
    this.mapView.update(time);
    this.vfx.update(dt);
    this.skyMesh.position.copyFrom(this.camera.position);
    this.scene.render();
    const ms = this.engine.getDeltaTime();
    this.frameMsSmooth += (ms - this.frameMsSmooth) * 0.05;
    this.fpsSmooth = 1000 / Math.max(1, this.frameMsSmooth);
  }

  addShake(a: number): void { this.shake = Math.min(1.4, this.shake + a); }
  landImpulse(hard: boolean): void { this.landDip = hard ? 1 : 0.5; }

  stats(): RenderStats {
    return { drawCalls: this.instr.drawCallsCounter.current, fps: this.fpsSmooth, frameMs: this.frameMsSmooth, meshes: this.scene.meshes.length, triangles: this.scene.getActiveIndices() / 3 };
  }

  // ----------------------------------------------------------------- entity sync
  private syncProjectiles(world: World, alpha: number): void {
    const live = new Set<number>();
    for (const pr of world.projectiles) {
      live.add(pr.id);
      let m = this.projViews.get(pr.id);
      if (!m) {
        m = this.makeProjMesh(pr.kind);
        this.projViews.set(pr.id, m);
      }
      m.position.set(pr.pos.x, pr.pos.y, pr.pos.z);
      if (pr.kind === "mine") {
        m.rotation.y = Math.atan2(pr.normal.x, pr.normal.z);
        let laser = this.lasers.get(pr.id);
        if (!laser) { laser = MeshBuilder.CreateBox("laser", { width: 0.012, height: 0.012, depth: 1 }, this.scene); laser.material = this.laserMat; laser.isPickable = false; this.lasers.set(pr.id, laser); }
        const armed = world.time >= pr.armAt;
        laser.isVisible = armed;
        if (armed) {
          const hit = world.col.raycast({ x: pr.pos.x, y: pr.pos.y, z: pr.pos.z }, { x: pr.normal.x, y: 0, z: pr.normal.z }, 6, true);
          const len = hit ? hit.t : 6;
          laser.scaling.z = len; laser.position.set(pr.pos.x + pr.normal.x * len / 2, pr.pos.y, pr.pos.z + pr.normal.z * len / 2);
          laser.rotation.y = Math.atan2(pr.normal.x, pr.normal.z);
        }
      } else if (!pr.stuck) { m.rotation.x += 0.25; m.rotation.z += 0.18; }
      else if (pr.kind === "dart") m.scaling.setAll(1 + 0.2 * Math.sin(world.time * 10));
    }
    for (const [id, m] of this.projViews) {
      if (!live.has(id)) { m.dispose(); this.projViews.delete(id); const l = this.lasers.get(id); if (l) { l.dispose(); this.lasers.delete(id); } }
    }
    void alpha;
  }

  private makeProjMesh(kind: string): Mesh {
    const mk = (c: string, em?: string) => { const m = new StandardMaterial("pm_" + kind, this.scene); m.diffuseColor = Color3.FromHexString(c); if (em) m.emissiveColor = Color3.FromHexString(em); m.specularColor = new Color3(0.3, 0.3, 0.3); return m; };
    let mesh: Mesh;
    switch (kind) {
      case "frag": mesh = MeshBuilder.CreateSphere("pr", { diameter: 0.1, segments: 8 }, this.scene); mesh.material = mk("#4a5a46"); break;
      case "adhesive": mesh = MeshBuilder.CreateCylinder("pr", { height: 0.05, diameter: 0.13, tessellation: 10 }, this.scene); mesh.material = mk("#2d4a52", "#0f3040"); break;
      case "mine": mesh = MeshBuilder.CreateBox("pr", { width: 0.2, height: 0.08, depth: 0.12 }, this.scene); mesh.material = mk("#2e3338", "#400a0a"); break;
      case "flash": mesh = MeshBuilder.CreateCylinder("pr", { height: 0.14, diameter: 0.06, tessellation: 8 }, this.scene); mesh.material = mk("#e8f0f4", "#60808c"); break;
      case "obscurant": mesh = MeshBuilder.CreateCylinder("pr", { height: 0.16, diameter: 0.07, tessellation: 8 }, this.scene); mesh.material = mk("#6b7478"); break;
      default: mesh = MeshBuilder.CreateSphere("pr", { diameter: 0.08, segments: 6 }, this.scene); mesh.material = mk("#1d6f80", "#35c6e8"); break;
    }
    mesh.isPickable = false;
    this.shadow?.addShadowCaster(mesh);
    return mesh;
  }

  private syncDeployables(world: World, time: number): void {
    const live = new Set<number>();
    for (const d of world.deployables) {
      live.add(d.id);
      let n = this.depViews.get(d.id);
      if (!n) { n = this.makeDeployable(d.kind, d.team); this.depViews.set(d.id, n); }
      n.position.set(d.pos.x, d.pos.y, d.pos.z);
      if (d.kind === "drone") { n.rotation.y = time * 0.6 + d.id; const rot = n.getChildren().filter((c) => c.name === "rotor"); rot.forEach((r, i) => ((r as Mesh).rotation.y = time * 40 * (i % 2 ? 1 : -1))); }
    }
    for (const [id, n] of this.depViews) if (!live.has(id)) { n.dispose(); this.depViews.delete(id); }
  }

  private makeDeployable(kind: string, team: number): TransformNode {
    const root = new TransformNode("dep", this.scene);
    const tm = new StandardMaterial("dep_t", this.scene); tm.emissiveColor = Color3.FromHexString(team === 0 ? "#35c6e8" : "#ff8a1f"); tm.disableLighting = true;
    const bm = new StandardMaterial("dep_b", this.scene); bm.diffuseColor = Color3.FromHexString(kind === "pod" ? "#d9d9d0" : "#2a3036"); bm.specularColor = new Color3(0.4, 0.4, 0.4);
    if (kind === "pod") {
      const b = MeshBuilder.CreateBox("pb", { width: 0.9, height: 0.7, depth: 0.7 }, this.scene); b.material = bm; b.parent = root; b.position.y = 0.35;
      const l = MeshBuilder.CreateBox("pl", { width: 0.95, height: 0.1, depth: 0.75 }, this.scene); l.material = tm; l.parent = root; l.position.y = 0.72;
      const c = MeshBuilder.CreateBox("pc", { width: 0.5, height: 0.1, depth: 0.04 }, this.scene); c.material = tm; c.parent = root; c.position.set(0, 0.4, -0.36);
      this.shadow?.addShadowCaster(b);
    } else {
      const b = MeshBuilder.CreateBox("db", { width: 0.5, height: 0.14, depth: 0.5 }, this.scene); b.material = bm; b.parent = root;
      const e = MeshBuilder.CreateSphere("de", { diameter: 0.18 }, this.scene); e.material = tm; e.parent = root; e.position.y = -0.12;
      for (const [x, z] of [[0.35, 0.35], [-0.35, 0.35], [0.35, -0.35], [-0.35, -0.35]]) {
        const r = MeshBuilder.CreateCylinder("rotor", { height: 0.02, diameter: 0.42, tessellation: 12 }, this.scene);
        r.material = bm; r.parent = root; r.position.set(x, 0.1, z);
      }
    }
    return root;
  }

  private syncSupport(world: World, me: PlayerState): void {
    let jetOn = false;
    for (const e of world.supportEvents) {
      if (e.kind === "flight") {
        const t = world.time - e.t0;
        if (t > 3.6 && t < 4 + 3.4 + 0.6) {
          jetOn = true;
          const along = clamp(((t - 4) / 3.4 - 0.5) * 140, -90, 90);
          this.flightMesh.position.set(e.pos.x + e.dir.x * along, 26, e.pos.z + e.dir.z * along);
          this.flightMesh.rotation.y = Math.atan2(e.dir.x, e.dir.z);
        }
      } else if (e.kind === "mortar") {
        if (Math.floor(world.time * 2) !== Math.floor((world.time - 1 / 60) * 2)) {
          this.vfx.ring(new Vector3(e.pos.x, 0.06, e.pos.z), e.team === me.team ? new Color3(0.3, 0.8, 1) : new Color3(1, 0.2, 0.15), 6.5, 0.9);
        }
      }
    }
    this.flightMesh.setEnabled(jetOn);
  }

  // ----------------------------------------------------------------- events
  handleEvent(e: SimEvent, world: World, localId: number): void {
    switch (e.t) {
      case "shot": {
        const p = world.players[e.id];
        if (!p) break;
        const local = e.id === localId;
        const from = local ? (this.vm.muzzleWorld() ?? new Vector3(e.origin.x, e.origin.y, e.origin.z)) : this.worldMuzzle(e.id, e.origin);
        if (e.tracer && e.hit) this.vfx.tracer(from, new Vector3(e.hit.x, e.hit.y, e.hit.z));
        if (local) this.vm.fired(p.weapons[p.slot].stats.def, p.adsT);
        else this.views.get(e.id)?.flash();
        break;
      }
      case "impact": this.vfx.impact(new Vector3(e.pos.x, e.pos.y, e.pos.z), new Vector3(e.normal.x, e.normal.y, e.normal.z), e.surface); break;
      case "explode": {
        const pos = new Vector3(e.pos.x, e.pos.y, e.pos.z);
        this.vfx.explosion(e.kind, pos, e.radius);
        const me = world.players[localId];
        if (me && e.kind !== "device") {
          const d = Math.hypot(me.pos.x - e.pos.x, me.pos.z - e.pos.z);
          if (d < 30) this.addShake(clamp((1 - d / 30) * (e.kind === "flash" ? 0.1 : e.kind === "strafe" ? 0.5 : 1.1), 0, 1.2));
        }
        break;
      }
      case "smoke": this.vfx.smoke(new Vector3(e.pos.x, e.pos.y, e.pos.z), e.radius, e.duration); break;
      case "glass": {
        const m = this.mapView.glass.get(e.id);
        if (m) m.setEnabled(false);
        this.vfx.shatter(new Vector3(e.pos.x, e.pos.y, e.pos.z));
        break;
      }
      case "dart": this.vfx.ring(new Vector3(e.pos.x, e.pos.y, e.pos.z), new Color3(0.2, 0.8, 1), 14, 1.0); break;
      case "damaged": if (e.victim === localId) this.addShake(clamp(e.damage / 60, 0.15, 0.7)); break;
      case "land": if (e.id === localId) this.landImpulse(e.hard); break;
      case "melee": if (e.id === localId) this.vm.startMelee(); break;
      case "throw": if (e.id === localId) this.vm.startThrow(); break;
      default: break;
    }
  }

  private worldMuzzle(id: number, fallback: { x: number; y: number; z: number }): Vector3 {
    const v = this.views.get(id);
    if (v?.weapon) { v.weapon.muzzle.computeWorldMatrix(true); return v.weapon.muzzle.getAbsolutePosition().clone(); }
    return new Vector3(fallback.x, fallback.y, fallback.z);
  }

  resetMatchVisuals(): void {
    this.vfx.clear();
    for (const m of this.mapView.glass.values()) m.setEnabled(true);
  }

  dispose(): void {
    this.scene.dispose();
    this.engine.dispose();
  }
  aimDirOf(p: PlayerState): { x: number; y: number; z: number } { return aimDir(p); }
}
