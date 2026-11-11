// First-person viewmodel. Purely cosmetic: sway/bob/kick never touch the aim
// ray, which is always the camera's center line from the authoritative angles.

import { Color3, Mesh, MeshBuilder, PointLight, Scene, StandardMaterial, TransformNode, type Camera } from '@babylonjs/core';
import type { SelfState, Side } from '../protocol/messages';
import { MUZZLE_Z, type ModelLibrary } from './models';
import type { WeaponId } from '../content/weapons';

export class ViewModel {
  readonly root: TransformNode;
  private pivot: TransformNode;
  private holder: TransformNode;
  private lib: ModelLibrary;
  private scene: Scene;
  private current: Mesh | null = null;
  private currentId = '';
  private arms: Mesh[] = [];
  private flash: Mesh;
  private flashLight: PointLight;
  private flashT = 0;
  private kick = 0;
  private swayX = 0;
  private swayY = 0;
  private bobT = 0;
  private drawT = 1;
  private inspectT = -1;
  private sleeveMat: StandardMaterial;
  leftHanded = false;
  reducedMotion = false;

  constructor(scene: Scene, camera: Camera, lib: ModelLibrary) {
    this.scene = scene;
    this.lib = lib;
    this.root = new TransformNode('vm-root', scene);
    this.root.parent = camera;
    this.pivot = new TransformNode('vm-pivot', scene);
    this.pivot.parent = this.root;
    this.holder = new TransformNode('vm-holder', scene);
    this.holder.parent = this.pivot;
    this.holder.scaling.setAll(0.62);
    this.sleeveMat = new StandardMaterial('vm-sleeve', scene);
    this.sleeveMat.diffuseColor = Color3.FromHexString('#4a4b3c');
    this.sleeveMat.specularColor = new Color3(0.05, 0.05, 0.05);
    const glove = new StandardMaterial('vm-glove', scene);
    glove.diffuseColor = Color3.FromHexString('#1f2023');
    glove.specularColor = new Color3(0.1, 0.1, 0.1);
    const mkArm = (x: number, y: number, z: number, rx: number, ry: number) => {
      const a = MeshBuilder.CreateBox('vm-arm', { width: 0.085, height: 0.085, depth: 0.42 }, scene);
      a.material = this.sleeveMat;
      a.parent = this.holder;
      a.position.set(x, y, z);
      a.rotation.set(rx, ry, 0);
      const g = MeshBuilder.CreateBox('vm-glove', { width: 0.075, height: 0.08, depth: 0.1 }, scene);
      g.material = glove;
      g.parent = a;
      g.position.z = 0.24;
      this.arms.push(a, g);
    };
    mkArm(0.07, -0.08, -0.16, 0.1, -0.12);
    mkArm(-0.12, -0.06, 0.05, 0.08, 0.5);
    this.flash = MeshBuilder.CreatePlane('vm-flash', { size: 0.16 }, scene);
    const fm = new StandardMaterial('vm-flash-m', scene);
    fm.emissiveColor = new Color3(1, 0.85, 0.55);
    fm.disableLighting = true;
    fm.alpha = 0.9;
    fm.opacityTexture = null;
    this.flash.material = fm;
    this.flash.parent = this.holder;
    this.flash.isVisible = false;
    this.flashLight = new PointLight('vm-flash-l', camera.position.clone(), scene);
    this.flashLight.diffuse = new Color3(1, 0.75, 0.45);
    this.flashLight.intensity = 0;
    this.flashLight.range = 9;
    for (const m of [...this.arms, this.flash]) {
      m.renderingGroupId = 1;
      m.isPickable = false;
    }
  }

  setSide(side: Side): void {
    this.sleeveMat.diffuseColor = Color3.FromHexString(side === 'intrusion' ? '#4a4b3c' : '#34465c');
  }

  setItem(id: string): void {
    if (id === this.currentId) return;
    this.currentId = id;
    this.current?.dispose();
    this.current = null;
    this.drawT = 0;
    this.inspectT = -1;
    if (!id || id === 'none') return;
    const m = this.lib.clone(id as WeaponId, 'vm-item');
    m.parent = this.holder;
    m.renderingGroupId = 1;
    m.isPickable = false;
    const isGun = id in MUZZLE_Z;
    if (isGun) {
      m.position.set(0, 0, 0);
      m.scaling.setAll(1);
    } else if (id === 'tool') {
      m.position.set(0, 0, 0.02);
      m.rotation.set(-0.3, 0, 0.5);
    } else if (id === 'spike') {
      m.position.set(-0.05, -0.04, 0.1);
      m.scaling.setAll(0.9);
    } else {
      // utility in hand
      m.position.set(0.02, -0.02, 0.06);
      m.scaling.setAll(1.3);
    }
    this.current = m;
    this.flash.position.set(0, 0.065, (MUZZLE_Z[id as WeaponId] ?? 0.5) + 0.03);
    // hands follow the item: support hand reaches further on long guns
    const long = (MUZZLE_Z[id as WeaponId] ?? 0.2) > 0.4;
    this.arms[2].position.set(-0.12, -0.06, long ? 0.12 : 0.0);
  }

  inspect(): void {
    this.inspectT = 0;
  }

  fire(): void {
    this.kick = 1;
    this.flashT = 0.045;
    this.inspectT = -1;
  }

  update(dt: number, s: SelfState | null, dyaw: number, dpitch: number, speed: number, onGround: boolean, visible: boolean): void {
    this.root.setEnabled(visible);
    if (!visible || !s) {
      this.flashLight.intensity = 0;
      return;
    }
    const rm = this.reducedMotion ? 0.25 : 1;
    // sway lags mouse motion
    this.swayX += (-dyaw * 0.6 - this.swayX) * Math.min(1, dt * 10);
    this.swayY += (-dpitch * 0.6 - this.swayY) * Math.min(1, dt * 10);
    this.swayX = Math.max(-0.08, Math.min(0.08, this.swayX));
    this.swayY = Math.max(-0.08, Math.min(0.08, this.swayY));
    this.bobT += dt * speed * 1.9;
    const bobAmp = onGround ? Math.min(1, speed / 5) * 0.012 * rm : 0;
    this.kick = Math.max(0, this.kick - dt * 9);
    this.drawT = Math.min(1, this.drawT + dt * 3.2);
    const side = this.leftHanded ? -1 : 1;
    let x = 0.135 * side + this.swayX * rm + Math.cos(this.bobT) * bobAmp;
    let y = -0.135 + this.swayY * rm - Math.abs(Math.sin(this.bobT)) * bobAmp - (1 - this.drawT) * 0.3;
    let z = 0.24 - this.kick * 0.035;
    let rx = -this.kick * 0.07;
    let ry = this.swayX * 2 * rm;
    let rz = 0;
    if (s.reloading > 0) {
      const r = s.reloading;
      const dip = r < 0.25 ? r / 0.25 : r > 0.8 ? (1 - r) / 0.2 : 1;
      y -= dip * 0.12;
      rx += dip * 0.5;
      rz += dip * 0.35 * side;
      if (r > 0.35 && r < 0.75) y -= Math.sin((r - 0.35) * 40) * 0.006;
    }
    if (this.inspectT >= 0) {
      this.inspectT += dt;
      const t = this.inspectT / 2.2;
      if (t >= 1) this.inspectT = -1;
      else {
        const w = Math.sin(t * Math.PI);
        ry += w * 0.9 * side;
        rz += w * 0.5 * side;
        x -= w * 0.05 * side;
      }
    }
    if (s.primed) {
      y += 0.05;
      z -= 0.08;
      rx -= 0.3;
    }
    if (s.armProgress > 0 || s.defuseProgress > 0) {
      y -= 0.08;
      rx += 0.6;
    }
    this.pivot.position.set(x, y, z);
    this.pivot.rotation.set(rx, ry, rz);
    // flash
    this.flashT -= dt;
    const on = this.flashT > 0;
    this.flash.isVisible = on;
    if (on) this.flash.rotation.z = Math.random() * Math.PI;
    this.flashLight.intensity = on ? 2.2 : 0;
    if (on) this.flashLight.position.copyFrom(this.flash.getAbsolutePosition());
  }
}
