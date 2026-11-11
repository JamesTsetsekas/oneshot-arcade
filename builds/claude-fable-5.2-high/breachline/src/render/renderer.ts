// renderer: engine, scene, lighting, shadows, post-processing and quality tiers.
import type { MapDef } from '../content/mapTypes';
import type { World } from '../sim/world';
import {
  CascadedShadowGenerator, Color3, Color4, DefaultRenderingPipeline, DirectionalLight, Engine, FreeCamera, HemisphericLight,
  ImageProcessingConfiguration, Mesh, PointLight, Scene, Vector3,
} from './bjs';
import { buildGlass, buildMap, LightBake, MapMeshes } from './mapMesh';
import { Sky } from './sky';
import { buildMaterials, MatDef } from './textures';

export type Quality = 'low' | 'medium' | 'high';

export const SUN_DIR = new Vector3(-0.42, -0.78, 0.46).normalize();

export class Renderer {
  readonly engine: Engine;
  readonly scene: Scene;
  readonly camera: FreeCamera;
  readonly sun: DirectionalLight;
  readonly hemi: HemisphericLight;
  readonly muzzleLight: PointLight;
  readonly blastLight: PointLight;
  readonly mats: Record<string, MatDef>;
  readonly bake: LightBake;
  shadow: CascadedShadowGenerator | null = null;
  pipeline: DefaultRenderingPipeline | null = null;
  map!: MapMeshes;
  sky!: Sky;
  quality: Quality;
  contextLost = false;
  onContextLost: () => void = () => {};
  onContextRestored: () => void = () => {};
  private casters: Mesh[] = [];
  private probe: [number, number, number] = [0, 0, 0];
  private probeT = 0;

  constructor(readonly canvas: HTMLCanvasElement, world: World, private mapDef: MapDef, quality: Quality, renderScale: number) {
    this.quality = quality;
    this.engine = new Engine(canvas, quality === 'high', { preserveDrawingBuffer: false, stencil: false, powerPreference: 'high-performance', doNotHandleContextLost: false, audioEngine: false }, false);
    this.engine.setHardwareScalingLevel(1 / Math.max(0.5, Math.min(1, renderScale)));
    this.engine.onContextLostObservable.add(() => { this.contextLost = true; this.onContextLost(); });
    this.engine.onContextRestoredObservable.add(() => { this.contextLost = false; this.onContextRestored(); });
    const scene = (this.scene = new Scene(this.engine));
    scene.skipPointerMovePicking = true;
    scene.clearColor = new Color4(0.8, 0.89, 0.95, 1);
    scene.ambientColor = new Color3(0, 0, 0);
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.0042;
    scene.fogColor = new Color3(0.8, 0.89, 0.95);

    this.camera = new FreeCamera('cam', new Vector3(0, 30, -60), scene);
    this.camera.minZ = 0.06;
    this.camera.maxZ = 1500;
    this.camera.fov = 1.0;
    this.camera.inputs.clear();
    scene.activeCamera = this.camera;

    this.sun = new DirectionalLight('sun', SUN_DIR.clone(), scene);
    this.sun.position = SUN_DIR.scale(-150);
    this.sun.intensity = 2.05;
    this.sun.diffuse = new Color3(1, 0.95, 0.85);
    this.sun.specular = new Color3(1, 0.95, 0.85);
    this.hemi = new HemisphericLight('hemi', new Vector3(0.1, 1, -0.1), scene);
    this.hemi.intensity = 0.82;
    this.hemi.diffuse = new Color3(0.78, 0.88, 1.0);
    this.hemi.groundColor = new Color3(0.56, 0.54, 0.5);
    this.hemi.specular = new Color3(0.1, 0.1, 0.1);
    // Always-on (zero intensity when idle) so firing or explosions never trigger a shader recompile.
    this.muzzleLight = new PointLight('muzzle', new Vector3(0, 0, 0), scene);
    this.muzzleLight.intensity = 0; this.muzzleLight.range = 9; this.muzzleLight.diffuse = new Color3(1, 0.78, 0.45); this.muzzleLight.specular = new Color3(0, 0, 0);
    this.blastLight = new PointLight('blast', new Vector3(0, 0, 0), scene);
    this.blastLight.intensity = 0; this.blastLight.range = 26; this.blastLight.diffuse = new Color3(1, 0.7, 0.4); this.blastLight.specular = new Color3(0, 0, 0);

    this.mats = buildMaterials(scene);
    this.bake = new LightBake(world, mapDef.lamps, { sunDir: [SUN_DIR.x, SUN_DIR.y, SUN_DIR.z], vertexSun: quality === 'low' });
    this.rebuildWorld();
    this.applyQuality();
  }

  private rebuildWorld(): void {
    this.map = buildMap(this.scene, this.mapDef, this.mats, this.bake);
    for (const m of this.map.opaque) m.receiveShadows = true;
    this.sky = new Sky(this.scene, SUN_DIR, this.mapDef.waterY);
  }

  addCaster(m: Mesh): void {
    this.casters.push(m);
    this.shadow?.addShadowCaster(m, false);
  }

  private applyQuality(): void {
    const q = this.quality;
    this.shadow?.dispose();
    this.shadow = null;
    if (q !== 'low') {
      const sg = new CascadedShadowGenerator(q === 'high' ? 2048 : 1536, this.sun);
      sg.numCascades = q === 'high' ? 4 : 3;
      sg.shadowMaxZ = 115;
      sg.lambda = 0.86;
      sg.stabilizeCascades = true;
      sg.cascadeBlendPercentage = 0.04;
      sg.depthClamp = true;
      sg.bias = 0.004;
      sg.normalBias = 0.012;
      sg.usePercentageCloserFiltering = true;
      sg.filteringQuality = q === 'high' ? 1 : 2; // medium / low PCF kernel
      sg.darkness = 0.06;
      sg.autoCalcDepthBounds = false;
      for (const m of this.map.opaque) {
        if (m.name === 'map_ground' || m.name === 'map_deck' || m.name === 'map_floor' || m.name === 'map_rail' || m.name === 'map_lamp') continue;
        sg.addShadowCaster(m, false);
      }
      for (const m of this.casters) sg.addShadowCaster(m, false);
      this.shadow = sg;
    }
    this.pipeline?.dispose();
    const p = (this.pipeline = new DefaultRenderingPipeline('pipe', true, this.scene, [this.camera]));
    p.samples = q === 'high' ? 4 : 1;
    p.fxaaEnabled = q !== 'low';
    p.bloomEnabled = q !== 'low';
    p.bloomThreshold = 0.82;
    p.bloomWeight = 0.2;
    p.bloomKernel = 40;
    p.bloomScale = 0.5;
    p.sharpenEnabled = q === 'high';
    if (p.sharpenEnabled) p.sharpen.edgeAmount = 0.18;
    p.imageProcessingEnabled = true;
    const ip = p.imageProcessing;
    ip.toneMappingEnabled = true;
    ip.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
    ip.exposure = 1.08;
    ip.contrast = 1.12;
    ip.vignetteEnabled = true;
    ip.vignetteWeight = 1.1;
    ip.vignetteStretch = 0.2;
    ip.vignetteColor = new Color4(0.02, 0.04, 0.06, 0);
  }

  setQuality(q: Quality, renderScale: number): void {
    this.engine.setHardwareScalingLevel(1 / Math.max(0.5, Math.min(1, renderScale)));
    if (q === this.quality) return;
    const rebake = (q === 'low') !== (this.quality === 'low');
    this.quality = q;
    if (rebake) {
      // sun visibility is baked into vertex colours only when real-time shadows are off
      for (const m of this.map.opaque) m.dispose();
      for (const m of this.map.glass.values()) m.dispose();
      for (const m of this.map.signs) m.dispose();
      this.sky.dome.dispose(); this.sky.ocean.dispose();
      (this.bake as unknown as { opts: { vertexSun: boolean } }).opts.vertexSun = q === 'low';
      this.rebuildWorld();
    }
    this.applyQuality();
  }

  /** vfov in radians; pitch positive looks up. */
  setCamera(x: number, y: number, z: number, yaw: number, pitch: number, roll: number, vfov: number): void {
    const c = this.camera;
    c.position.set(x, y, z);
    c.rotation.set(-pitch, yaw, roll);
    c.fov = vfov;
  }

  /** Restore every breakable pane (new match). */
  rebuildGlass(): void {
    for (const m of this.map.glass.values()) m.dispose();
    this.map.glass.clear();
    const fresh = buildGlass(this.scene, this.mapDef, this.mats);
    for (const [id, m] of fresh) this.map.glass.set(id, m);
  }

  breakGlass(id: number): void {
    const m = this.map.glass.get(id);
    if (m) { m.dispose(); this.map.glass.delete(id); }
  }

  /** Ambient boost for dynamic objects (viewmodel, characters), sampled from the baked light near the camera. */
  updateAmbient(dt: number): void {
    this.probeT -= dt;
    if (this.probeT <= 0) {
      this.probeT = 0.12;
      const p = this.camera.position;
      this.bake.probe(p.x, p.y - 0.3, p.z, this.probe);
    }
    const a = this.scene.ambientColor, k = 1 - Math.exp(-6 * dt);
    a.r += (this.probe[0] - a.r) * k; a.g += (this.probe[1] - a.g) * k; a.b += (this.probe[2] - a.b) * k;
  }

  render(dt: number): void {
    this.sky.update(dt);
    this.updateAmbient(dt);
    this.muzzleLight.intensity = Math.max(0, this.muzzleLight.intensity - dt * 60);
    this.blastLight.intensity = Math.max(0, this.blastLight.intensity - dt * 22);
    this.scene.render();
  }

  resize(): void { this.engine.resize(); }

  dispose(): void {
    this.scene.dispose();
    this.engine.dispose();
  }
}
