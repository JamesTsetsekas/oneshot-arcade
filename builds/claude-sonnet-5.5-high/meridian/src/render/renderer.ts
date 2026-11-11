import {
  Color3, Color4, DirectionalLight, Engine, FreeCamera, GlowLayer, HemisphericLight, ImageProcessingConfiguration, Mesh, MeshBuilder, Scene,
  ShadowGenerator, SpotLight, StandardMaterial, TransformNode, Vector3,
} from '@babylonjs/core';
import type { InstancedMesh } from '@babylonjs/core';
import type { Game } from '../sim/game';
import type { GameEvent } from '../core/events';
import type { Settings } from '../core/settings';
import { applySky, atmosphereAt, createSky } from './atmosphere';
import type { Atmos } from './atmosphere';
import { buildWorld } from './worldBuilder';
import type { WorldVisuals } from './worldBuilder';
import { HumanRenderer, VehicleRenderer } from './actors';
import { Vfx } from './vfx';
import { glowTexture } from './textures';
import { equipped } from '../sim/combat';
import { clamp, wrapAngle } from '../core/math';

interface Pose { x: number; z: number; h: number }

export class Renderer {
  engine: Engine;
  scene: Scene;
  camera: FreeCamera;
  sun: DirectionalLight;
  hemi: HemisphericLight;
  shadow: ShadowGenerator | null = null;
  glow: GlowLayer | null = null;
  vis: WorldVisuals;
  vehicles: VehicleRenderer;
  humans: HumanRenderer;
  vfx: Vfx;
  atmos: Atmos;
  private sky: ReturnType<typeof createSky>;
  private headlight: SpotLight;
  private markerBeam: Mesh;
  private markerRing: Mesh;
  private markerDiamond: Mesh;
  private wayBeam: Mesh;
  private droneRoot: TransformNode;
  private spikes: InstancedMesh[] = [];
  private prevV = new Map<number, Pose>();
  private prevH = new Map<number, Pose>();
  private prevCam = { x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 0 };
  private curCam = { x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 0 };
  private time = 0;
  private dmgT = 0;
  private lastFov = 0;
  waypoint: { x: number; z: number } | null = null;
  quality: Settings['quality'];
  private fpsSamples: number[] = [];
  stats = { fps: 0, drawCalls: 0 };

  constructor(canvas: HTMLCanvasElement, public game: Game, settings: Settings) {
    this.quality = settings.quality;
    this.engine = new Engine(canvas, true, { antialias: settings.quality !== 'low', powerPreference: 'high-performance', stencil: false, preserveDrawingBuffer: false }, true);
    this.engine.setHardwareScalingLevel(settings.quality === 'low' ? 1.5 : 1);
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.5, 0.65, 0.85, 1);
    this.scene.fogMode = Scene.FOGMODE_EXP2;
    this.scene.skipPointerMovePicking = true;
    this.scene.autoClear = true;
    const ip = this.scene.imageProcessingConfiguration;
    ip.toneMappingEnabled = true;
    ip.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
    ip.contrast = 1.18;
    ip.exposure = 1.0;
    ip.vignetteEnabled = true;
    ip.vignetteWeight = 1.2;
    ip.vignetteStretch = 0.2;
    this.camera = new FreeCamera('cam', new Vector3(0, 3, -6), this.scene);
    this.camera.minZ = 0.2;
    this.camera.maxZ = 1400;
    this.camera.inputs.clear();
    this.hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), this.scene);
    this.hemi.specular = new Color3(0, 0, 0);
    this.sun = new DirectionalLight('sun', new Vector3(-0.4, -0.8, 0.3), this.scene);
    this.sun.shadowMinZ = 1;
    this.sun.shadowMaxZ = 420;
    this.sky = createSky(this.scene);

    this.vis = buildWorld(this.scene, game.world, settings.quality);
    this.vehicles = new VehicleRenderer(this.scene);
    this.humans = new HumanRenderer(this.scene);
    this.vfx = new Vfx(this.scene, glowTexture(this.scene));
    this.vehicles.reducedFlashes = settings.reducedFlashes;

    this.headlight = new SpotLight('head', new Vector3(), new Vector3(0, -0.1, 1), 1.0, 8, this.scene);
    this.headlight.intensity = 0;
    this.headlight.range = 60;
    this.headlight.diffuse = new Color3(1, 0.95, 0.8);

    const mk = (name: string, mat: StandardMaterial, m: Mesh): Mesh => { m.material = mat; m.isPickable = false; m.name = name; return m; };
    const beamMat = new StandardMaterial('beam', this.scene);
    beamMat.emissiveColor = new Color3(1, 0.8, 0.2);
    beamMat.disableLighting = true;
    beamMat.alpha = 0.22;
    this.markerBeam = mk('mbeam', beamMat, MeshBuilder.CreateCylinder('mb', { diameter: 2, height: 60, tessellation: 20, cap: 0 } as never, this.scene));
    this.markerBeam.setEnabled(false);
    const ringMat = new StandardMaterial('ring', this.scene);
    ringMat.emissiveColor = new Color3(1, 0.85, 0.3);
    ringMat.disableLighting = true;
    ringMat.alpha = 0.55;
    this.markerRing = mk('mring', ringMat, MeshBuilder.CreateTorus('mr', { diameter: 2, thickness: 0.18, tessellation: 40 }, this.scene));
    this.markerRing.setEnabled(false);
    this.markerDiamond = mk('mdia', ringMat, MeshBuilder.CreatePolyhedron('md', { type: 1, size: 0.6 }, this.scene));
    this.markerDiamond.setEnabled(false);
    const wayMat = new StandardMaterial('way', this.scene);
    wayMat.emissiveColor = new Color3(0.2, 0.8, 1);
    wayMat.disableLighting = true;
    wayMat.alpha = 0.3;
    this.wayBeam = mk('way', wayMat, MeshBuilder.CreateCylinder('wb', { diameter: 1.6, height: 80, tessellation: 12 }, this.scene));
    this.wayBeam.setEnabled(false);

    // police harbor drone
    this.droneRoot = new TransformNode('drone', this.scene);
    const body = MeshBuilder.CreateBox('db', { width: 1.6, height: 0.3, depth: 1.6 }, this.scene);
    const dm = new StandardMaterial('dm', this.scene);
    dm.diffuseColor = new Color3(0.1, 0.12, 0.15);
    dm.emissiveColor = new Color3(0.8, 0.1, 0.1);
    body.material = dm;
    body.parent = this.droneRoot;
    this.droneRoot.setEnabled(false);
    for (let i = 0; i < 4; i++) {
      const s = this.vis.spikeMaster.createInstance('spk' + i);
      s.setEnabled(false);
      this.spikes.push(s);
    }

    for (const m of this.scene.materials) if (m instanceof StandardMaterial) m.maxSimultaneousLights = 6;
    this.setupQuality(settings.quality);
    this.atmos = atmosphereAt(game.hour, game.rain);
  }

  setupQuality(q: Settings['quality']): void {
    this.quality = q;
    this.shadow?.dispose();
    this.shadow = null;
    this.glow?.dispose();
    this.glow = null;
    this.engine.setHardwareScalingLevel(q === 'low' ? 1.5 : 1);
    if (q !== 'low') {
      const size = q === 'high' ? 2048 : 1024;
      const sg = new ShadowGenerator(size, this.sun);
      sg.usePercentageCloserFiltering = true;
      sg.filteringQuality = q === 'high' ? ShadowGenerator.QUALITY_MEDIUM : ShadowGenerator.QUALITY_LOW;
      sg.bias = 0.0008;
      sg.normalBias = 0.02;
      sg.darkness = 0.15;
      sg.transparencyShadow = false;
      for (const m of this.vis.casters) sg.addShadowCaster(m, false);
      for (const m of this.vehicles.casters) sg.addShadowCaster(m, false);
      for (const m of this.humans.casters) sg.addShadowCaster(m, false);
      this.shadow = sg;
      for (const m of this.vis.receivers) m.receiveShadows = true;
      this.sun.autoUpdateExtends = false;
      this.sun.autoCalcShadowZBounds = false;
      this.sun.orthoLeft = -70; this.sun.orthoRight = 70; this.sun.orthoTop = 70; this.sun.orthoBottom = -70;
    } else {
      for (const m of this.vis.receivers) m.receiveShadows = false;
    }
    if (q === 'high') {
      this.glow = new GlowLayer('glow', this.scene, { mainTextureFixedSize: 512, blurKernelSize: 24 });
      this.glow.intensity = 0.55;
    }
  }

  registerCasters(): void {
    if (!this.shadow) return;
    for (const m of this.vehicles.casters) if (!this.shadow.getShadowMap()?.renderList?.includes(m)) this.shadow.addShadowCaster(m, false);
    for (const m of this.humans.casters) if (!this.shadow.getShadowMap()?.renderList?.includes(m)) this.shadow.addShadowCaster(m, false);
  }

  setGame(g: Game): void {
    this.game = g;
    this.vehicles.reset();
    this.humans.reset();
    this.prevV.clear();
    this.prevH.clear();
    this.prevCam = { x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 0 };
    for (const inst of this.vis.breakables.values()) inst.setEnabled(true);
  }

  resize(): void { this.engine.resize(); }

  capturePrev(): void {
    const g = this.game;
    for (const v of g.vehicles) this.prevV.set(v.id, { x: v.x, z: v.z, h: v.heading });
    for (const h of g.humans) this.prevH.set(h.id, { x: h.x, z: h.z, h: h.heading });
    const p = g.player.human;
    this.prevH.set(0, { x: p.x, z: p.z, h: p.heading });
    this.prevCam = { ...this.curCam };
  }

  onEvent(e: GameEvent): void {
    const g = this.game;
    switch (e.type) {
      case 'tracer': this.vfx.tracer(e.x0, e.y0, e.z0, e.x1, e.y1, e.z1); break;
      case 'impact': this.vfx.impact(e.x, e.y, e.z, e.material === 'flesh' ? 3 : 6); break;
      case 'gunshot': { const h = g.player.human; if (e.byPlayer) this.vfx.muzzle(h.x + Math.sin(h.heading) * 0.8, 1.5, h.z + Math.cos(h.heading) * 0.8); else this.vfx.muzzle(e.x, 1.5, e.z); break; }
      case 'smoke': this.vfx.smokeAt(e.x, e.z); break;
      default: break;
    }
  }

  private lerpPose(prev: Pose | undefined, x: number, z: number, h: number, a: number): Pose {
    if (!prev) return { x, z, h };
    if (Math.hypot(x - prev.x, z - prev.z) > 12) return { x, z, h };
    return { x: prev.x + (x - prev.x) * a, z: prev.z + (z - prev.z) * a, h: prev.h + wrapAngle(h - prev.h) * a };
  }

  render(dt: number, alpha: number, noInterp = false): void {
    const g = this.game;
    this.time += dt;
    // --- time of day -----------------------------------------------------------------------------------
    const a = atmosphereAt(g.hour, g.rain);
    this.atmos = a;
    this.hemi.diffuse = a.ambient;
    this.hemi.groundColor = a.ambientGround;
    this.hemi.intensity = 1.0;
    this.sun.direction = a.sunDir.scale(-1);
    this.sun.diffuse = a.sunColor;
    this.sun.specular = a.sunColor;
    this.sun.intensity = a.sunIntensity;
    this.scene.fogColor = a.fogColor;
    this.scene.fogDensity = a.fogDensity;
    this.scene.clearColor = new Color4(a.fogColor.r, a.fogColor.g, a.fogColor.b, 1);
    this.scene.imageProcessingConfiguration.exposure = a.exposure;
    applySky(this.sky.material, a, this.time, g.rain);
    const night = a.night;
    const lit = clamp(night * 1.2 + g.rain * 0.15, 0, 1);
    const glowOn = lit > 0.05;
    for (const f of Object.values(this.vis.facades)) f.glow.emissiveColor.set(lit * 0.62, lit * 0.5, lit * 0.3);
    for (const m of this.vis.glowMeshes) if (m.isEnabled() !== glowOn) m.setEnabled(glowOn);
    const pool = clamp(night * 1.1 + g.rain * 0.1, 0, 1) * (0.55 + 0.5 * g.rain);
    this.vis.poolMat.emissiveColor.set(pool, pool * 0.85, pool * 0.55);
    this.vis.lampMat.emissiveColor.set(0.1 + night * 0.9, 0.09 + night * 0.8, 0.05 + night * 0.5);
    this.vis.water.setVector3('sunDir', new Vector3(a.sunDir.x, a.sunDir.y, a.sunDir.z));
    this.vis.water.setVector3('sunColor', new Vector3(a.sunColor.r, a.sunColor.g, a.sunColor.b));
    this.vis.water.setVector3('skyColor', new Vector3(a.skyHorizon.r * 0.9, a.skyHorizon.g * 0.95, a.skyHorizon.b));
    this.vis.water.setVector3('deepColor', new Vector3(0.04 * (0.3 + a.daylight), 0.17 * (0.3 + a.daylight), 0.25 * (0.3 + a.daylight)));
    this.vis.water.setVector3('fogColor', new Vector3(a.fogColor.r, a.fogColor.g, a.fogColor.b));
    this.vis.water.setFloat('fogDensity', a.fogDensity);
    this.vis.water.setFloat('time', this.time);
    this.vis.asphalt.specularColor.set(0.08 + g.rain * 0.45, 0.08 + g.rain * 0.45, 0.09 + g.rain * 0.5);
    this.vis.asphalt.specularPower = 48 - g.rain * 20;
    this.vehicles.night = night;
    // signals
    const px = g.signals.phase(g.t, 'x');
    const pz = g.signals.phase(g.t, 'z');
    const col = (p: string): Color3 => (p === 'green' ? new Color3(0.1, 1, 0.3) : p === 'yellow' ? new Color3(1, 0.8, 0.1) : new Color3(1, 0.1, 0.1));
    this.vis.signalX.emissiveColor = col(px);
    this.vis.signalZ.emissiveColor = col(pz);

    // --- camera -----------------------------------------------------------------------------------------
    const c = g.cam.pose;
    this.curCam = { x: c.x, y: c.y, z: c.z, tx: c.tx, ty: c.ty, tz: c.tz };
    const pc = this.prevCam;
    const k = alpha;
    const hasPrev = !noInterp && (pc.x !== 0 || pc.z !== 0);
    const lerp = (p: number, q: number) => (hasPrev && Math.abs(p - q) < 15 ? p + (q - p) * k : q);
    this.camera.position.set(lerp(pc.x, c.x), lerp(pc.y, c.y), lerp(pc.z, c.z));
    this.camera.setTarget(new Vector3(lerp(pc.tx, c.tx), lerp(pc.ty, c.ty), lerp(pc.tz, c.tz)));
    const aspect = this.engine.getRenderWidth() / Math.max(1, this.engine.getRenderHeight());
    const vfov = 2 * Math.atan(Math.tan((c.hfov * Math.PI) / 360) / aspect);
    this.camera.fov = vfov;
    this.lastFov = vfov;

    // --- shadows follow the player ------------------------------------------------------------------
    const P = g.player.human;
    if (this.shadow) {
      const d = this.sun.direction;
      const cx = this.camera.position.x * 0.5 + P.x * 0.5;
      const cz = this.camera.position.z * 0.5 + P.z * 0.5;
      // snap to texel grid to avoid shimmering
      const texel = 140 / (this.quality === 'high' ? 2048 : 1024);
      const sx = Math.round(cx / texel) * texel;
      const sz = Math.round(cz / texel) * texel;
      this.sun.position = new Vector3(sx - d.x * 200, -d.y * 200 + 0, sz - d.z * 200);
      this.sun.setDirectionToTarget(new Vector3(sx, 0, sz));
      this.sun.shadowMinZ = 20;
      this.sun.shadowMaxZ = 420;
      const shadowOn = a.sunIntensity > 0.2 && a.sunDir.y > 0.05 || !a.isSun;
      this.shadow.getShadowMap()!.refreshRate = shadowOn ? 1 : 0;
    }

    // --- actors ---------------------------------------------------------------------------------------------
    const pv = g.playerVehicle();
    // interpolate
    const vInterp = g.vehicles.map((v) => {
      const p = this.lerpPose(this.prevV.get(v.id), v.x, v.z, v.heading, alpha);
      return { v, p };
    });
    const saved = vInterp.map(({ v }) => ({ x: v.x, z: v.z, h: v.heading }));
    vInterp.forEach(({ v, p }) => { v.x = p.x; v.z = p.z; v.heading = p.h; });
    this.vehicles.sync(g.vehicles, this.time, dt, pv ? pv.id : null);
    vInterp.forEach(({ v }, i) => { v.x = saved[i].x; v.z = saved[i].z; v.heading = saved[i].h; });
    const hs = [P, ...g.humans];
    const hsaved = hs.map((h) => ({ x: h.x, z: h.z, h: h.heading }));
    for (const h of hs) { const p = this.lerpPose(this.prevH.get(h.id), h.x, h.z, h.heading, alpha); h.x = p.x; h.z = p.z; h.heading = p.h; }
    const w = equipped(g);
    this.humans.sync(g.humans, P, g.player.outfit, { playerVehicleKind: pv ? pv.def.kind : null, playerAiming: g.player.aiming, playerArmed: !!w && w.slot !== 'melee' && !pv, meleeT: g.meleeSwingT, cam: { x: c.x, z: c.z }, t: this.time });
    hs.forEach((h, i) => { h.x = hsaved[i].x; h.z = hsaved[i].z; h.heading = hsaved[i].h; });
    this.registerCasters();

    // breakable props
    for (const [id, inst] of this.vis.breakables) if (g.world.colliders[id - 1]?.gone && inst.isEnabled()) inst.setEnabled(false);

    // headlights for the player's vehicle at night
    if (pv && night > 0.3) {
      this.headlight.intensity = 1.4 * night;
      this.headlight.position.set(pv.x + Math.sin(pv.heading) * 2, 0.9, pv.z + Math.cos(pv.heading) * 2);
      this.headlight.direction.set(Math.sin(pv.heading), -0.07, Math.cos(pv.heading));
    } else this.headlight.intensity = 0;

    // markers ------------------------------------------------------------------------------------------
    const mk = g.currentMarker();
    if (mk) {
      this.markerBeam.setEnabled(true);
      this.markerRing.setEnabled(true);
      this.markerDiamond.setEnabled(true);
      const r = mk.r > 0 ? mk.r : 1.4;
      this.markerBeam.position.set(mk.x, 30, mk.z);
      this.markerBeam.scaling.set(r, 1, r);
      this.markerRing.position.set(mk.x, 0.3, mk.z);
      this.markerRing.scaling.set(r, 1, r);
      this.markerDiamond.position.set(mk.x, 6 + Math.sin(this.time * 2) * 0.4, mk.z);
      this.markerDiamond.rotation.y = this.time * 1.5;
      this.markerBeam.visibility = mk.r > 20 ? 0.12 : 1;
    } else { this.markerBeam.setEnabled(false); this.markerRing.setEnabled(false); this.markerDiamond.setEnabled(false); }
    if (this.waypoint) { this.wayBeam.setEnabled(true); this.wayBeam.position.set(this.waypoint.x, 40, this.waypoint.z); } else this.wayBeam.setEnabled(false);

    // POI ring pulse
    for (const [id, node] of this.vis.poiMarkers) {
      const d = Math.hypot(node.position.x - P.x, node.position.z - P.z);
      node.setEnabled(d < 220);
      void id;
    }

    // police drone + spike strips
    const dr = g.police.drone;
    this.droneRoot.setEnabled(dr.active);
    if (dr.active) { this.droneRoot.position.set(dr.x, dr.y, dr.z); this.droneRoot.rotation.y = this.time * 2; }
    this.spikes.forEach((s, i) => {
      const sp = g.police.spikes[i];
      if (sp && sp.alive) { s.setEnabled(true); s.position.set(sp.x, 0.08, sp.z); s.rotation.y = sp.axis === 'z' ? 0 : Math.PI / 2; } else s.setEnabled(false);
    });

    // vehicle fx ---------------------------------------------------------------------------------------------
    this.dmgT -= dt;
    let smoked = 0;
    for (const v of g.vehicles) {
      if (smoked >= 3) break;
      const d = Math.hypot(v.x - c.x, v.z - c.z);
      if (d > 70) continue;
      if (v.slip > 0.5 && Math.abs(v.speed) > 5 && v.surface !== 'water') {
        const back = { x: v.x - Math.sin(v.heading) * v.def.length * 0.35, z: v.z - Math.cos(v.heading) * v.def.length * 0.35 };
        this.vfx.tireSmokeAt(back.x, back.z, v.slip);
        smoked++;
      }
      if (this.dmgT <= 0 && v.health < v.def.health * 0.4) this.vfx.damageSmokeAt(v.x + Math.sin(v.heading) * v.def.length * 0.3, 1.1, v.z + Math.cos(v.heading) * v.def.length * 0.3);
    }
    if (this.dmgT <= 0) this.dmgT = 0.12;
    this.vfx.setRain(g.rain > 0.15 ? g.rain : 0, this.camera.position);
    this.vfx.update(dt);
    void g.settings;

    this.scene.render();
    this.fpsSamples.push(1 / Math.max(dt, 1e-4));
    if (this.fpsSamples.length > 30) this.fpsSamples.shift();
    this.stats.fps = this.fpsSamples.reduce((s, v) => s + v, 0) / this.fpsSamples.length;
  }

  dispose(): void { this.scene.dispose(); this.engine.dispose(); }
}
