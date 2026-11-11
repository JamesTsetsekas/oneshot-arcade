// renderer: Babylon scene, camera, lighting, post, characters, viewmodel.
// Consumes only client-visible snapshot state. Quality presets change cost
// (shadows, SSAO, resolution), never gameplay visibility.

import {
  Camera, Color3, Color4, DefaultRenderingPipeline, DirectionalLight, Engine, GlowLayer, HemisphericLight, ImageProcessingConfiguration,
  Mesh, MeshBuilder, Scene, ShadowGenerator, StandardMaterial, UniversalCamera, Vector3,
} from '@babylonjs/core';
import type { GameMap } from '../map/runtime';
import type { Snapshot, SnapPlayer, Side } from '../protocol/messages';
import { lerp, wrapAngle } from '../sim/math';
import { buildMapMeshes, type MapRender } from './mapMesh';
import { buildTextures } from './textures';
import { ModelLibrary } from './models';
import { CharacterFactory, type CharacterView } from './characters';
import { ViewModel } from './viewmodel';
import { Effects } from './effects';
import type { Settings } from '../client/settings';
import { iffColors } from '../client/settings';

export interface ViewState {
  eye: Vector3;
  yaw: number;
  pitch: number;
  fov: number;
  firstPerson: boolean;
  hideId: number;
}

export class Renderer {
  readonly engine: Engine;
  readonly scene: Scene;
  readonly camera: UniversalCamera;
  readonly lib: ModelLibrary;
  readonly fx: Effects;
  readonly vm: ViewModel;
  private chars = new Map<number, CharacterView>();
  private factory: CharacterFactory;
  private mapR: MapRender;
  private shadow: ShadowGenerator | null = null;
  private pipeline: DefaultRenderingPipeline | null = null;
  private glow: GlowLayer;
  private sun: DirectionalLight;
  private settings: Settings;
  private sides = new Map<number, Side>();

  constructor(canvas: HTMLCanvasElement, map: GameMap, settings: Settings) {
    this.settings = settings;
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, antialias: false, powerPreference: 'high-performance' }, false);
    if (this.engine.webGLVersion < 2) throw new Error('WebGL 2 is required');
    const q = settings.quality;
    this.engine.setHardwareScalingLevel(q === 'low' ? 1.25 : 1 / Math.min(window.devicePixelRatio || 1, q === 'high' ? 1.5 : 1));
    const scene = new Scene(this.engine);
    this.scene = scene;
    scene.clearColor = new Color4(0.62, 0.72, 0.82, 1);
    scene.ambientColor = new Color3(0.3, 0.3, 0.3);
    scene.skipPointerMovePicking = true;
    scene.autoClear = true;
    scene.setRenderingAutoClearDepthStencil(1, true, true, false);

    const cam = new UniversalCamera('cam', new Vector3(0, 2, -30), scene);
    cam.minZ = 0.04;
    cam.maxZ = 400;
    cam.fovMode = Camera.FOVMODE_HORIZONTAL_FIXED;
    cam.fov = (settings.fov * Math.PI) / 180;
    cam.inputs.clear();
    this.camera = cam;

    const hemi = new HemisphericLight('hemi', new Vector3(0.25, 1, 0.15), scene);
    hemi.intensity = 0.95;
    hemi.diffuse = new Color3(0.98, 0.97, 0.94);
    hemi.groundColor = new Color3(0.52, 0.5, 0.48);
    hemi.specular = new Color3(0.1, 0.1, 0.1);
    const sun = new DirectionalLight('sun', new Vector3(-0.45, -1, 0.32), scene);
    sun.position = new Vector3(40, 60, -30);
    sun.intensity = 1.25;
    sun.diffuse = new Color3(1, 0.95, 0.86);
    this.sun = sun;

    const tex = buildTextures(scene, q);
    this.mapR = buildMapMeshes(scene, map, tex);
    // sky dome
    const sky = MeshBuilder.CreateSphere('sky', { diameter: 600, segments: 16, sideOrientation: Mesh.BACKSIDE }, scene);
    const skyM = new StandardMaterial('sky-m', scene);
    skyM.emissiveTexture = tex.sky;
    skyM.disableLighting = true;
    skyM.backFaceCulling = false;
    sky.material = skyM;
    sky.infiniteDistance = true;
    sky.isPickable = false;
    sky.rotation.x = Math.PI;

    if (q !== 'low') {
      const sg = new ShadowGenerator(q === 'high' ? 4096 : 2048, sun);
      sg.usePercentageCloserFiltering = true;
      sg.filteringQuality = q === 'high' ? ShadowGenerator.QUALITY_MEDIUM : ShadowGenerator.QUALITY_LOW;
      sg.bias = 0.0015;
      sg.normalBias = 0.02;
      sun.shadowMinZ = 1;
      sun.shadowMaxZ = 160;
      sun.autoUpdateExtends = false;
      sun.orthoLeft = -60;
      sun.orthoRight = 60;
      sun.orthoTop = 60;
      sun.orthoBottom = -60;
      for (const m of this.mapR.meshes) {
        if (m.name.startsWith('map-trim') || m.name.startsWith('map-light') || m.name === 'sign') continue;
        sg.addShadowCaster(m, false);
        m.receiveShadows = true;
      }
      this.shadow = sg;
    }

    this.lib = new ModelLibrary(scene);
    this.factory = new CharacterFactory(scene, this.lib, iffColors(settings.colorblind));
    this.vm = new ViewModel(scene, cam, this.lib);
    this.fx = new Effects(scene, this.lib, tex);
    this.fx.quality = q;

    this.glow = new GlowLayer('glow', scene, { mainTextureSamples: 1, blurKernelSize: q === 'low' ? 16 : 32 });
    this.glow.intensity = 0.55;

    const pipe = new DefaultRenderingPipeline('pipe', true, scene, [cam]);
    pipe.fxaaEnabled = true;
    pipe.imageProcessingEnabled = true;
    pipe.imageProcessing.toneMappingEnabled = true;
    pipe.imageProcessing.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
    pipe.imageProcessing.exposure = 1.15;
    pipe.imageProcessing.contrast = 1.12;
    pipe.bloomEnabled = q !== 'low';
    pipe.bloomThreshold = 0.85;
    pipe.bloomWeight = 0.25;
    pipe.bloomKernel = 48;
    pipe.sharpenEnabled = q === 'high';
    if (pipe.sharpenEnabled) pipe.sharpen.edgeAmount = 0.25;
    this.pipeline = pipe;

    this.applySettings(settings);
  }

  applySettings(s: Settings): void {
    this.settings = s;
    this.factory.setIff(iffColors(s.colorblind));
    this.vm.leftHanded = s.leftHanded;
    this.vm.reducedMotion = s.reducedMotion;
  }

  resize(): void {
    this.engine.resize();
  }

  private charFor(p: SnapPlayer, side: Side): CharacterView {
    let c = this.chars.get(p.id);
    if (c && this.sides.get(p.id) !== side) {
      c.dispose();
      c = undefined;
    }
    if (!c) {
      c = this.factory.create(p.id, side);
      this.chars.set(p.id, c);
      this.sides.set(p.id, side);
      if (this.shadow) for (const part of c.shadowParts) this.shadow.addShadowCaster(part, false);
    }
    return c;
  }

  /** Interpolate players between two snapshots and pose characters. */
  updatePlayers(prev: Snapshot | null, cur: Snapshot, alpha: number, dt: number, hideId: number): Map<number, SnapPlayer> {
    const prevMap = new Map<number, SnapPlayer>();
    if (prev) for (const p of prev.players) prevMap.set(p.id, p);
    const out = new Map<number, SnapPlayer>();
    const seen = new Set<number>();
    for (const p of cur.players) {
      const a = prevMap.get(p.id);
      const ip: SnapPlayer = a
        ? {
            ...p,
            x: lerp(a.x, p.x, alpha),
            y: lerp(a.y, p.y, alpha),
            z: lerp(a.z, p.z, alpha),
            yaw: a.yaw + wrapAngle(p.yaw - a.yaw) * alpha,
            pitch: lerp(a.pitch, p.pitch, alpha),
            crouch: lerp(a.crouch, p.crouch, alpha),
          }
        : p;
      out.set(p.id, ip);
      seen.add(p.id);
      const side = cur.teams[p.team].side;
      const c = this.charFor(p, side);
      c.setVisible(p.id !== hideId);
      c.update(ip, dt);
      if (p.firing && !(a && a.firing)) c.fireKick();
    }
    for (const [id, c] of this.chars) if (!seen.has(id)) c.setVisible(false);
    return out;
  }

  charFire(id: number): void {
    this.chars.get(id)?.fireKick();
  }

  setView(v: ViewState): void {
    const cam = this.camera;
    cam.position.copyFrom(v.eye);
    cam.rotation.set(v.pitch, v.yaw, 0);
    cam.fov = (v.fov * Math.PI) / 180;
  }

  spinTurbines(dt: number): void {
    for (const t of this.mapR.turbines) if (t.name === 'tring') t.rotation.y += dt * 0.6;
  }

  render(): void {
    this.scene.render();
  }

  dispose(): void {
    this.engine.stopRenderLoop();
    this.scene.dispose();
    this.engine.dispose();
  }
}
