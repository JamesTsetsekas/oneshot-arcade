// Babylon.js engine/scene bootstrap and shared materials.
import '@babylonjs/core/Engines/Extensions/engine.dynamicTexture';
import '@babylonjs/core/Meshes/thinInstanceMesh';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Engine } from '@babylonjs/core/Engines/engine';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import { DEG } from '../shared/math';
import { unlit } from './textures';

export type IffPalette = 'default' | 'alt' | 'contrast';

export const IFF: Record<IffPalette, { atk: [number, number, number]; def: [number, number, number] }> = {
  default: { atk: [1.0, 0.62, 0.12], def: [0.15, 0.85, 1.0] },
  alt: { atk: [1.0, 0.42, 0.1], def: [0.3, 0.5, 1.0] },
  contrast: { atk: [1.0, 0.92, 0.1], def: [0.85, 0.3, 1.0] },
};

export class RenderCore {
  engine: Engine;
  scene: Scene;
  camera: FreeCamera;
  /** vertex-coloured lit material shared by all dynamic models */
  lit: StandardMaterial;
  accentAtk: StandardMaterial;
  accentDef: StandardMaterial;
  baseFov = 90;

  constructor(public canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: false, powerPreference: 'high-performance', adaptToDeviceRatio: false }, false);
    if (this.engine.webGLVersion < 2) throw new Error('WebGL 2 is required.');
    const scene = (this.scene = new Scene(this.engine));
    scene.clearColor = new Color4(0.78, 0.83, 0.9, 1);
    scene.skipPointerMovePicking = true;
    // the game owns all input; Babylon's own pointer/keyboard handling is switched off
    scene.detachControl();
    scene.preventDefaultOnPointerDown = false;
    scene.preventDefaultOnPointerUp = false;
    scene.autoClearDepthAndStencil = true;
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.0045;
    scene.fogColor = new Color3(0.72, 0.77, 0.84);
    scene.blockMaterialDirtyMechanism = false;
    const cam = (this.camera = new FreeCamera('cam', new Vector3(40, 3, 8), scene));
    cam.fovMode = Camera.FOVMODE_HORIZONTAL_FIXED;
    cam.fov = this.baseFov * DEG;
    cam.minZ = 0.04;
    cam.maxZ = 400;
    cam.inputs.clear();
    scene.activeCamera = cam;

    const hemi = new HemisphericLight('hemi', new Vector3(0.15, 1, 0.1), scene);
    hemi.intensity = 0.95;
    hemi.diffuse = new Color3(1, 0.99, 0.97);
    hemi.groundColor = new Color3(0.42, 0.43, 0.48);
    hemi.specular = new Color3(0.1, 0.1, 0.1);
    const sun = new DirectionalLight('sun', new Vector3(-0.38, -0.8, 0.46), scene);
    sun.intensity = 0.4;
    sun.diffuse = new Color3(1, 0.95, 0.85);
    sun.specular = new Color3(0.25, 0.25, 0.25);

    this.lit = new StandardMaterial('lit', scene);
    this.lit.diffuseColor = new Color3(1, 1, 1);
    this.lit.specularColor = new Color3(0.08, 0.08, 0.08);
    this.lit.specularPower = 24;
    this.accentAtk = unlit(scene, 'accentAtk', IFF.default.atk);
    this.accentDef = unlit(scene, 'accentDef', IFF.default.def);
    this.accentAtk.backFaceCulling = false;
    this.accentDef.backFaceCulling = false;
  }

  setPalette(p: IffPalette): void {
    const c = IFF[p] ?? IFF.default;
    this.accentAtk.emissiveColor.set(c.atk[0], c.atk[1], c.atk[2]);
    this.accentDef.emissiveColor.set(c.def[0], c.def[1], c.def[2]);
  }

  setFov(horizontalDeg: number): void {
    this.camera.fov = horizontalDeg * DEG;
  }

  resize(): void {
    this.engine.resize();
  }
}
