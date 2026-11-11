// renderer-world: procedural actor rigs. Four cosmetic bodies share one skeleton and one hitbox family;
// animation is driven only by the bounded pose state the server already replicates.
import { Color4, InstancedMesh, Mesh, MeshBuilder, Scene, StandardMaterial, TransformNode } from "@babylonjs/core";
import type { ItemId } from "../../shared/content/items";
import type { WeaponId } from "../../shared/content/weapons";
import { ActorFlag, Mode, type ActorView, type RosterEntry } from "../../shared/protocol/protocol";
import { cssToRgb } from "./palette";
import { paint } from "./meshes";

const SKIN: [number, number, number][] = [[0.96, 0.8, 0.66], [0.85, 0.64, 0.48], [0.62, 0.44, 0.32], [0.45, 0.31, 0.24], [0.98, 0.86, 0.74]];

export interface RigSources {
  box: Mesh;
  ball: Mesh;
  cyl: Mesh;
  sail: Mesh;
  weapons: Record<WeaponId, Mesh>;
  items: Record<ItemId, Mesh>;
}

export function createRigSources(scene: Scene, lit: StandardMaterial, sailMat: StandardMaterial, sail: Mesh): Pick<RigSources, "box" | "ball" | "cyl" | "sail"> {
  const box = paint(MeshBuilder.CreateBox("rigBox", { size: 1 }, scene), [1, 1, 1], 0.14);
  const ball = paint(MeshBuilder.CreateSphere("rigBall", { diameter: 1, segments: 8 }, scene), [1, 1, 1], 0.12);
  const cyl = paint(MeshBuilder.CreateCylinder("rigCyl", { height: 1, diameter: 1, tessellation: 10 }, scene), [1, 1, 1], 0.1);
  paint(sail, [1, 1, 1], 0);
  sail.material = sailMat;
  for (const m of [box, ball, cyl]) m.material = lit;
  for (const m of [box, ball, cyl, sail]) {
    m.registerInstancedBuffer("color", 4);
    m.instancedBuffers.color = new Color4(1, 1, 1, 1);
    m.isVisible = false;
    m.isPickable = false;
  }
  return { box, ball, cyl, sail };
}

function col(rgb: [number, number, number], k = 1): Color4 {
  return new Color4(Math.min(1, rgb[0] * k), Math.min(1, rgb[1] * k), Math.min(1, rgb[2] * k), 1);
}

export class ActorRig {
  readonly root: TransformNode;
  private hips: TransformNode;
  private torso: TransformNode;
  private head: TransformNode;
  private armL: TransformNode;
  private armR: TransformNode;
  private foreL: TransformNode;
  private foreR: TransformNode;
  private legL: TransformNode;
  private legR: TransformNode;
  private shinL: TransformNode;
  private shinR: TransformNode;
  private hand: TransformNode;
  private sailNode: TransformNode;
  private sailMesh: InstancedMesh;
  private held: InstancedMesh | null = null;
  private heldKey = "";
  readonly parts: InstancedMesh[] = [];
  private phase = 0;
  private deadT = 0;
  private sailT = 0;
  private landT = 1;
  private recoilT = 1;
  /** World-space muzzle estimate for tracers. */
  muzzle = { x: 0, y: 0, z: 0 };
  lastStep = 0;
  stepped = false;
  visible = true;

  constructor(private scene: Scene, private src: RigSources, entry: RosterEntry, private onCaster: (m: InstancedMesh, add: boolean) => void) {
    const s = scene;
    const node = (name: string, parent: TransformNode | null, x: number, y: number, z: number): TransformNode => {
      const n = new TransformNode(name, s);
      if (parent) n.parent = parent;
      n.position.set(x, y, z);
      return n;
    };
    const primary = cssToRgb(entry.primary);
    const secondary = cssToRgb(entry.secondary);
    const skin = SKIN[entry.id % SKIN.length]!;
    const dark: [number, number, number] = [0.2, 0.22, 0.26];
    const part = (source: Mesh, parent: TransformNode, sx: number, sy: number, sz: number, x: number, y: number, z: number, c: Color4, rx = 0, rz = 0): InstancedMesh => {
      const m = source.createInstance("part");
      m.parent = parent;
      m.scaling.set(sx, sy, sz);
      m.position.set(x, y, z);
      m.rotation.set(rx, 0, rz);
      m.instancedBuffers.color = c;
      m.isPickable = false;
      this.parts.push(m);
      this.onCaster(m, true);
      return m;
    };
    const { box, ball, cyl } = src;
    this.root = node("actor" + entry.id, null, 0, 0, 0);
    this.hips = node("hips", this.root, 0, 0.92, 0);
    this.torso = node("torso", this.hips, 0, 0, 0);
    part(box, this.hips, 0.4, 0.2, 0.25, 0, 0.02, 0, col(secondary, 0.85));
    part(box, this.torso, 0.48, 0.5, 0.28, 0, 0.33, 0, col(primary));
    part(box, this.torso, 0.5, 0.09, 0.3, 0, 0.13, 0, col(dark)); // belt
    this.head = node("head", this.torso, 0, 0.6, 0);
    part(ball, this.head, 0.29, 0.31, 0.29, 0, 0.14, 0, col(skin));
    this.armL = node("armL", this.torso, -0.31, 0.52, 0);
    this.armR = node("armR", this.torso, 0.31, 0.52, 0);
    part(box, this.armL, 0.13, 0.32, 0.14, 0, -0.14, 0, col(primary, 0.88));
    part(box, this.armR, 0.13, 0.32, 0.14, 0, -0.14, 0, col(primary, 0.88));
    this.foreL = node("foreL", this.armL, 0, -0.3, 0);
    this.foreR = node("foreR", this.armR, 0, -0.3, 0);
    part(box, this.foreL, 0.11, 0.3, 0.12, 0, -0.14, 0, col(skin));
    part(box, this.foreR, 0.11, 0.3, 0.12, 0, -0.14, 0, col(skin));
    this.legL = node("legL", this.hips, -0.12, 0, 0);
    this.legR = node("legR", this.hips, 0.12, 0, 0);
    part(box, this.legL, 0.17, 0.48, 0.18, 0, -0.23, 0, col(secondary));
    part(box, this.legR, 0.17, 0.48, 0.18, 0, -0.23, 0, col(secondary));
    this.shinL = node("shinL", this.legL, 0, -0.46, 0);
    this.shinR = node("shinR", this.legR, 0, -0.46, 0);
    part(box, this.shinL, 0.15, 0.4, 0.16, 0, -0.2, 0, col(dark, 1.3));
    part(box, this.shinR, 0.15, 0.4, 0.16, 0, -0.2, 0, col(dark, 1.3));
    part(box, this.shinL, 0.16, 0.1, 0.26, 0, -0.42, 0.04, col(dark));
    part(box, this.shinR, 0.16, 0.1, 0.26, 0, -0.42, 0.04, col(dark));
    // cosmetic bodies: same silhouette envelope, different readable accessories
    switch (entry.body % 4) {
      case 0: // Wayfarer: hood and satchel pack
        part(box, this.head, 0.34, 0.3, 0.3, 0, 0.17, -0.05, col(primary, 0.8));
        part(box, this.torso, 0.36, 0.42, 0.2, 0, 0.36, -0.22, col(secondary));
        part(box, this.torso, 0.3, 0.12, 0.22, 0, 0.6, -0.22, col(dark, 1.4));
        break;
      case 1: // Kiteback: wide-brim hat and bedroll
        part(cyl, this.head, 0.56, 0.04, 0.56, 0, 0.26, 0, col(secondary, 0.9));
        part(cyl, this.head, 0.3, 0.14, 0.3, 0, 0.33, 0, col(secondary, 0.75));
        part(box, this.torso, 0.34, 0.36, 0.18, 0, 0.36, -0.21, col(dark, 1.5));
        part(cyl, this.torso, 0.18, 0.56, 0.18, 0, 0.6, -0.22, col(secondary), 0, Math.PI / 2);
        break;
      case 2: // Coppercoat: helmet and shoulder plates
        part(ball, this.head, 0.34, 0.24, 0.34, 0, 0.22, 0, col([0.78, 0.48, 0.26]));
        part(box, this.head, 0.3, 0.06, 0.1, 0, 0.16, 0.14, col(dark));
        part(box, this.torso, 0.22, 0.1, 0.3, -0.3, 0.57, 0, col([0.78, 0.48, 0.26]));
        part(box, this.torso, 0.22, 0.1, 0.3, 0.3, 0.57, 0, col([0.78, 0.48, 0.26]));
        part(box, this.torso, 0.3, 0.34, 0.16, 0, 0.36, -0.2, col(secondary));
        break;
      default: // Driftweaver: scarf and tall frame pack
        part(box, this.torso, 0.4, 0.12, 0.34, 0, 0.58, 0, col(secondary));
        part(box, this.torso, 0.12, 0.4, 0.05, 0.12, 0.38, -0.17, col(secondary, 0.85), 0.25);
        part(box, this.torso, 0.3, 0.62, 0.18, 0, 0.44, -0.24, col(dark, 1.5));
        part(cyl, this.torso, 0.03, 0.5, 0.03, 0.12, 0.95, -0.24, col([0.78, 0.48, 0.26]));
        part(box, this.head, 0.3, 0.1, 0.3, 0, 0.27, 0, col(primary, 0.8));
    }
    this.hand = node("hand", this.torso, 0.2, 0.36, 0.3);
    this.sailNode = node("sail", this.torso, 0, 0.5, -0.2);
    this.sailMesh = src.sail.createInstance("sailI");
    this.sailMesh.parent = this.sailNode;
    this.sailMesh.instancedBuffers.color = col(cssToRgb(entry.sail));
    this.sailMesh.isPickable = false;
    this.sailMesh.setEnabled(false);
  }

  private setHeld(weapon: WeaponId | null, item: ItemId | null): void {
    const key = weapon ?? item ?? "";
    if (key === this.heldKey) return;
    this.heldKey = key;
    if (this.held) {
      this.onCaster(this.held, false);
      this.held.dispose();
      this.held = null;
    }
    const source = weapon ? this.src.weapons[weapon] : item ? this.src.items[item] : null;
    if (!source) return;
    const m = source.createInstance("held");
    m.parent = this.hand;
    m.isPickable = false;
    if (item) {
      m.scaling.setAll(0.8);
      m.position.set(0, -0.02, 0.05);
    }
    this.held = m;
    this.onCaster(m, true);
  }

  setVisible(v: boolean): void {
    if (v === this.visible) return;
    this.visible = v;
    this.root.setEnabled(v);
  }

  kick(): void {
    this.recoilT = 0;
  }
  landed(): void {
    this.landT = 0;
  }

  /** Poses the rig from replicated state. x/y/z/yaw are already interpolated by the client runtime. */
  update(v: ActorView, x: number, y: number, z: number, yaw: number, pitch: number, dt: number, time: number): void {
    const dead = v.mode === Mode.Dead;
    this.root.position.set(x, y, z);
    this.root.rotation.y = yaw;
    const speed = Math.hypot(v.vx, v.vz);
    const crouch = (v.flags & ActorFlag.Crouch) !== 0;
    const sprint = (v.flags & ActorFlag.Sprinting) !== 0;
    const using = (v.flags & ActorFlag.Using) !== 0;
    const reloading = (v.flags & ActorFlag.Reloading) !== 0;
    this.setHeld(v.weapon, v.item);
    this.recoilT = Math.min(1, this.recoilT + dt * 7);
    this.landT = Math.min(1, this.landT + dt * 4);
    this.stepped = false;

    // locomotion phase
    const moving = (v.mode === Mode.Ground || v.mode === Mode.Swim) && speed > 0.4;
    if (moving) {
      const prev = this.phase;
      this.phase += dt * (v.mode === Mode.Swim ? 5 : 3.2 + speed * 1.25);
      if (Math.floor(prev / Math.PI) !== Math.floor(this.phase / Math.PI)) this.stepped = true;
    }
    const sw = Math.sin(this.phase);
    const amp = moving ? Math.min(1, speed / 5.5) : 0;
    // movement direction relative to facing (for strafing / backpedal leg direction)
    const fwd = speed > 0.2 ? (v.vx * Math.sin(yaw) + v.vz * Math.cos(yaw)) / speed : 1;
    const dirSign = fwd < -0.3 ? -1 : 1;

    let hipY = 0.92,
      hipRx = 0,
      torsoRx = 0,
      thL = 0,
      thR = 0,
      shL = 0,
      shR = 0,
      aLx = 0,
      aRx = 0,
      aLz = -0.06,
      aRz = 0.06,
      fL = -0.15,
      fR = -0.15,
      legSplay = 0,
      headRx = -pitch * 0.5;
    let weaponRx = -pitch,
      handY = 0.36,
      handZ = 0.3;
    const armed = v.weapon !== null || v.item !== null;
    let sailTarget = 0;

    switch (v.mode) {
      case Mode.Dead: {
        this.deadT = Math.min(1, this.deadT + dt * 2.6);
        const t = this.deadT * this.deadT * (3 - 2 * this.deadT);
        hipRx = -1.5 * t;
        hipY = 0.92 - 0.72 * t;
        aLz = -0.9 * t;
        aRz = 0.9 * t;
        thL = -0.2 * t;
        thR = 0.15 * t;
        headRx = 0;
        break;
      }
      case Mode.Glide:
        hipRx = 1.15;
        hipY = 1.0;
        thL = 0.25 + Math.sin(time * 2.1) * 0.05;
        thR = 0.25 - Math.sin(time * 2.1) * 0.05;
        shL = 0.2;
        shR = 0.2;
        aLx = -0.2;
        aRx = -0.2;
        aLz = -1.4;
        aRz = 1.4;
        fL = 0;
        fR = 0;
        headRx = -0.9;
        sailTarget = 1;
        break;
      case Mode.Freefall:
        hipRx = 1.3 - pitch * 0.2;
        hipY = 1.0;
        aLx = -0.5;
        aRx = -0.5;
        aLz = -1.15 + Math.sin(time * 9) * 0.06;
        aRz = 1.15 - Math.sin(time * 9 + 1) * 0.06;
        thL = 0.3;
        thR = 0.3;
        shL = 0.6 + Math.sin(time * 8) * 0.08;
        shR = 0.6 + Math.cos(time * 8) * 0.08;
        legSplay = 0.35;
        headRx = -1.0;
        break;
      case Mode.Swim:
        hipRx = 1.25;
        hipY = 1.32;
        aLx = -2.4 + sw * 0.9;
        aRx = -2.4 - sw * 0.9;
        thL = 0.2 + sw * 0.35;
        thR = 0.2 - sw * 0.35;
        shL = 0.2;
        shR = 0.2;
        headRx = -1.0;
        break;
      case Mode.Zip:
        aLx = -3.0;
        aRx = -3.0;
        aLz = 0.12;
        aRz = -0.12;
        fL = 0;
        fR = 0;
        thL = -0.35;
        thR = 0.1;
        shL = 0.6;
        shR = 0.4;
        torsoRx = -0.12;
        hipY = 0.92;
        break;
      case Mode.Ascend:
        aRx = -3.0;
        fR = 0;
        aLx = -1.2;
        fL = -1.0;
        thL = -0.6;
        shL = 1.0;
        thR = 0.1;
        break;
      case Mode.Mantle:
        aLx = -2.6;
        aRx = -2.6;
        fL = -0.6;
        fR = -0.6;
        thL = -0.9;
        shL = 1.2;
        thR = 0.1;
        torsoRx = 0.35;
        break;
      case Mode.Slide:
        hipY = 0.42;
        torsoRx = -0.55;
        thL = -1.45;
        thR = -1.1;
        shL = 0.25;
        shR = 0.9;
        aLx = 0.5;
        aLz = -0.5;
        headRx = 0.3;
        break;
      case Mode.Air:
      case Mode.Grapple:
        thL = -0.5;
        thR = 0.15;
        shL = 0.9;
        shR = 0.4;
        aLz = -0.45;
        aRz = 0.45;
        torsoRx = 0.1;
        break;
      default: {
        // ground locomotion
        if (crouch) {
          hipY = 0.6;
          thL = -1.0 - sw * 0.35 * amp * dirSign;
          thR = -1.0 + sw * 0.35 * amp * dirSign;
          shL = 1.7;
          shR = 1.7;
          torsoRx = 0.28;
        } else {
          const a = (sprint ? 0.95 : 0.7) * amp * dirSign;
          thL = -sw * a;
          thR = sw * a;
          shL = Math.max(0, Math.sin(this.phase - 0.9)) * 1.1 * amp;
          shR = Math.max(0, -Math.sin(this.phase - 0.9)) * 1.1 * amp;
          hipY = 0.92 - Math.abs(Math.cos(this.phase)) * 0.05 * amp;
          torsoRx = sprint ? 0.3 : 0.06 * amp;
        }
        // landing squash
        hipY -= (1 - this.landT) * 0.16;
      }
    }

    // arms: weapon handling on the ground-ish modes
    const canHold = v.mode === Mode.Ground || v.mode === Mode.Air || v.mode === Mode.Slide || v.mode === Mode.Grapple;
    if (canHold && armed && !dead) {
      if (sprint && !using) {
        weaponRx = 0.7;
        handY = 0.2;
        handZ = 0.22;
        aRx = -0.7 + sw * 0.3;
        fR = -1.0;
        aLx = -0.6 - sw * 0.5;
        fL = -1.1;
      } else if (using) {
        weaponRx = -0.3 + Math.sin(time * 7) * 0.08;
        handY = 0.42;
        handZ = 0.2;
        aRx = -1.0;
        fR = -1.5;
        aLx = -1.0;
        fL = -1.5;
        aLz = 0.4;
        aRz = -0.3;
      } else {
        const kick = (1 - this.recoilT) * 0.12;
        weaponRx = -pitch - kick + (reloading ? 0.5 : 0);
        handZ = 0.3 - kick * 0.4;
        aRx = -1.15 - pitch * 0.7;
        fR = -0.55;
        aRz = 0.1;
        aLx = -1.35 - pitch * 0.7 + (reloading ? Math.sin(time * 9) * 0.25 + 0.4 : 0);
        fL = -0.4;
        aLz = 0.55;
        torsoRx += -pitch * 0.25;
      }
    } else if (!dead && v.mode === Mode.Ground) {
      aLx = sw * 0.6 * amp;
      aRx = -sw * 0.6 * amp;
    }

    this.sailT += (sailTarget - this.sailT) * Math.min(1, dt * 7);
    const showSail = this.sailT > 0.03;
    this.sailMesh.setEnabled(showSail);
    if (showSail) {
      this.sailNode.scaling.setAll(this.sailT);
      this.sailNode.rotation.x = -0.15;
    }
    if (this.held) this.held.setEnabled(!dead && v.mode !== Mode.Glide && v.mode !== Mode.Freefall && v.mode !== Mode.Swim && v.mode !== Mode.Zip && v.mode !== Mode.Mantle && v.mode !== Mode.Ascend);

    // smooth toward the target pose (cheap blending between states)
    const k = Math.min(1, dt * 14);
    const L = (cur: number, target: number): number => cur + (target - cur) * k;
    this.hips.position.y = L(this.hips.position.y, hipY);
    this.hips.rotation.x = L(this.hips.rotation.x, hipRx);
    this.torso.rotation.x = L(this.torso.rotation.x, torsoRx);
    this.head.rotation.x = L(this.head.rotation.x, headRx);
    this.legL.rotation.x = L(this.legL.rotation.x, thL);
    this.legR.rotation.x = L(this.legR.rotation.x, thR);
    this.legL.rotation.z = L(this.legL.rotation.z, -legSplay);
    this.legR.rotation.z = L(this.legR.rotation.z, legSplay);
    this.shinL.rotation.x = L(this.shinL.rotation.x, shL);
    this.shinR.rotation.x = L(this.shinR.rotation.x, shR);
    this.armL.rotation.x = L(this.armL.rotation.x, aLx);
    this.armR.rotation.x = L(this.armR.rotation.x, aRx);
    this.armL.rotation.z = L(this.armL.rotation.z, aLz);
    this.armR.rotation.z = L(this.armR.rotation.z, aRz);
    this.foreL.rotation.x = L(this.foreL.rotation.x, fL);
    this.foreR.rotation.x = L(this.foreR.rotation.x, fR);
    this.hand.rotation.x = L(this.hand.rotation.x, weaponRx);
    this.hand.position.y = L(this.hand.position.y, handY);
    this.hand.position.z = L(this.hand.position.z, handZ);
    if (!dead) this.deadT = 0;

    // muzzle estimate (matches the authoritative muzzle closely enough for tracers)
    const sy = Math.sin(yaw),
      cy = Math.cos(yaw);
    this.muzzle.x = x + sy * 0.75 + cy * 0.22;
    this.muzzle.y = y + (crouch ? 0.95 : 1.38) + Math.sin(pitch) * 0.5;
    this.muzzle.z = z + cy * 0.75 - sy * 0.22;
  }

  dispose(): void {
    for (const p of this.parts) this.onCaster(p, false);
    if (this.held) this.onCaster(this.held, false);
    this.root.dispose(false, false);
  }
}
