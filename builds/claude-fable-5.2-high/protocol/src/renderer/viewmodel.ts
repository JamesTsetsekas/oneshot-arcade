// First-person viewmodel. Purely cosmetic: sway, bob, recoil kick and reload motion never move the aim ray.
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { WEAPONS, isWeaponId } from '../content/weapons';
import type { Side } from '../protocol/types';
import type { RenderCore } from './core';
import { Geom, type RGB } from './geom';
import { buildModel, type ModelInfo } from './models';
import { drawMuzzle, makeTexture } from './textures';

export interface ViewModelState {
  speed: number;
  onGround: boolean;
  reloading: number;
  drawing: boolean;
  scoped: boolean;
  busy: boolean; // arming / disarming
  crouch: number;
  dyaw: number;
  dpitch: number;
  leftHand: boolean;
}

export class ViewModel {
  private root: TransformNode;
  private mesh: Mesh | null = null;
  private flash: Mesh;
  private item = '';
  private side: Side = 'atk';
  private info: ModelInfo = { muzzle: [0, 0, 0.3], support: 0, length: 0.3 };
  private kick = 0;
  private kickV = 0;
  private swayX = 0;
  private swayY = 0;
  private bob = 0;
  private drawT = 1;
  private flashT = 0;
  private inspectT = 0;
  private swingT = 0;
  private lowered = 0;
  private basePos: [number, number, number] = [0.15, -0.16, 0.3];
  private tmp = new Vector3();

  constructor(private core: RenderCore) {
    this.root = new TransformNode('vm', core.scene);
    this.root.parent = core.camera;
    const mat = new StandardMaterial('muzzle', core.scene);
    mat.disableLighting = true;
    mat.emissiveColor = new Color3(1, 1, 1);
    const tex = makeTexture(core.scene, 'muzzletex', 128, drawMuzzle, true);
    mat.diffuseTexture = tex;
    mat.opacityTexture = tex;
    mat.alphaMode = 1;
    mat.backFaceCulling = false;
    const g = new Geom();
    g.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], [0, 0, -1], [1, 1, 1]);
    this.flash = g.build('muzzleflash', core.scene, mat);
    this.flash.useVertexColors = false;
    this.flash.parent = this.root;
    this.flash.renderingGroupId = 1;
    this.flash.setEnabled(false);
  }

  setItem(item: string, side: Side): void {
    if (item === this.item && side === this.side) return;
    this.item = item;
    this.side = side;
    if (this.mesh) this.mesh.dispose();
    const g = new Geom();
    this.info = buildModel(item, g);
    // gloves and sleeves
    const sleeve: RGB = side === 'atk' ? [0.3, 0.24, 0.2] : [0.25, 0.3, 0.38];
    const glove: RGB = [0.1, 0.1, 0.11];
    const isGun = isWeaponId(item) && item !== 'tool';
    const longGun = isGun && this.info.support > 0.15;
    g.box(0.012, -0.05, -0.012, 0.058, 0.095, 0.07, glove);
    g.box(0.04, -0.185, -0.165, 0.07, 0.07, 0.36, sleeve, [-0.69, -0.15, 0]);
    if (longGun) {
      const sz = this.info.support;
      g.box(-0.008, -0.012, sz, 0.07, 0.055, 0.095, glove);
      g.box(-0.105, -0.165, sz - 0.15, 0.07, 0.07, 0.45, sleeve, [-0.65, 0.5, 0]);
    } else if (isGun) {
      g.box(-0.022, -0.06, 0.0, 0.045, 0.085, 0.065, glove);
      g.box(-0.135, -0.18, -0.11, 0.07, 0.07, 0.38, sleeve, [-0.66, 0.76, 0]);
    }
    this.mesh = g.build('vm_' + item, this.core.scene, this.core.lit);
    this.mesh.parent = this.root;
    this.mesh.renderingGroupId = 1;
    this.mesh.alwaysSelectAsActiveMesh = true;
    const len = this.info.length;
    this.basePos = isGun ? (len > 0.5 ? [0.17, -0.185, 0.33] : [0.2, -0.19, 0.48]) : item === 'tool' ? [0.24, -0.2, 0.42] : [0.24, -0.22, 0.48];
    this.drawT = 0;
    this.kick = 0;
    this.kickV = 0;
    this.inspectT = 0;
  }

  onShot(): void {
    const d = isWeaponId(this.item) ? WEAPONS[this.item] : null;
    const power = d ? Math.min(1.6, 0.35 + d.damage / 60 + (d.pellets ? 0.6 : 0)) : 0.5;
    this.kickV += 1.9 * power;
    this.flashT = 0.045;
    this.flash.rotation.z = Math.random() * 6.28;
    const s = d ? (d.cls === 'sidearm' || d.cls === 'smg' ? 0.14 : d.cls === 'sniper' || d.cls === 'shotgun' ? 0.34 : 0.22) : 0.2;
    this.flash.scaling.setAll(s * (0.8 + Math.random() * 0.4));
    this.inspectT = 0;
  }

  onSwing(): void {
    this.swingT = 0.28;
    this.inspectT = 0;
  }

  inspect(): void {
    if (this.inspectT <= 0) this.inspectT = 2.4;
  }

  /** World-space muzzle position, for tracer origins. */
  muzzleWorld(out: Vector3): Vector3 {
    this.root.computeWorldMatrix(true);
    const m = this.info.muzzle;
    this.tmp.set(m[0], m[1], m[2]);
    Vector3.TransformCoordinatesToRef(this.tmp, this.root.getWorldMatrix(), out);
    return out;
  }

  update(dt: number, s: ViewModelState): void {
    if (!this.mesh) return;
    const hide = s.scoped;
    this.mesh.setEnabled(!hide);
    // recoil spring
    this.kickV += -this.kick * 240 * dt - this.kickV * 22 * dt;
    this.kick += this.kickV * dt;
    // sway lags behind view rotation
    this.swayX += (-s.dyaw * 0.9 - this.swayX) * Math.min(1, dt * 9);
    this.swayY += (s.dpitch * 0.9 - this.swayY) * Math.min(1, dt * 9);
    this.swayX = Math.max(-0.06, Math.min(0.06, this.swayX));
    this.swayY = Math.max(-0.06, Math.min(0.06, this.swayY));
    const moving = s.onGround ? Math.min(1, s.speed / 4.5) : 0;
    this.bob += dt * (4 + s.speed * 1.6);
    const bobX = Math.sin(this.bob) * 0.006 * moving;
    const bobY = Math.abs(Math.cos(this.bob)) * 0.007 * moving;
    this.drawT = Math.min(1, this.drawT + dt * 3.2);
    const drawE = 1 - (1 - this.drawT) ** 3;
    const lowerTarget = s.busy ? 1 : 0;
    this.lowered += (lowerTarget - this.lowered) * Math.min(1, dt * 8);
    // reload: dip and roll, return at the end
    const r = s.reloading;
    const rl = r > 0 ? Math.sin(Math.min(1, r) * Math.PI) : 0;
    const rlSnap = r > 0 ? Math.sin(Math.min(1, r) * Math.PI * 3) * 0.02 : 0;
    if (this.inspectT > 0) this.inspectT -= dt;
    const ins = this.inspectT > 0 ? Math.sin(Math.min(1, (2.4 - this.inspectT) / 2.4) * Math.PI) : 0;
    if (this.swingT > 0) this.swingT -= dt;
    const sw = this.swingT > 0 ? Math.sin((1 - this.swingT / 0.28) * Math.PI) : 0;
    const hand = s.leftHand ? -1 : 1;
    const p = this.root.position;
    p.x = (this.basePos[0] + bobX + this.swayX * 0.5) * hand + ins * 0.03 * hand - sw * 0.1 * hand;
    p.y = this.basePos[1] - bobY + this.swayY * 0.5 - (1 - drawE) * 0.3 - rl * 0.11 + rlSnap - this.lowered * 0.3 - s.crouch * 0.012 + ins * 0.03;
    p.z = this.basePos[2] - this.kick * 0.05 + sw * 0.22;
    const rot = this.root.rotation;
    rot.x = -this.kick * 0.055 + (1 - drawE) * 0.9 + rl * 0.35 + this.lowered * 0.7 - this.swayY * 0.6 - ins * 0.25 + sw * 0.5;
    rot.y = (-0.02 + this.swayX * 0.8) * hand + ins * 0.9 * hand - sw * 0.7 * hand;
    rot.z = (rl * 0.5 + ins * 0.5) * hand + this.swayX * 0.5;
    this.root.scaling.x = hand;
    if (this.flashT > 0) {
      this.flashT -= dt;
      this.flash.setEnabled(!hide);
      const m = this.info.muzzle;
      this.flash.position.set(m[0], m[1], m[2] + 0.04);
    } else this.flash.setEnabled(false);
    void Matrix;
  }

  setVisible(v: boolean): void {
    this.root.setEnabled(v);
  }
}
