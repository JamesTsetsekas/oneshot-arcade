// First-person viewmodel: weapon + hands on a dedicated rendering group with its own FOV compensation.
// Animation layers (all additive, none affect the aim ray): pose blend, bob, sway, recoil spring, reload stages, swap, melee, throw, mantle, inspect.
import { Camera, Color3, Mesh, MeshBuilder, Scene, StandardMaterial, TransformNode, Vector3, Texture } from "@babylonjs/core";
import type { PlayerState } from "../../shared/sim/types";
import { WEAPONS, type WeaponDef } from "../../shared/content/weapons";
import { buildHands, buildWeaponModel, type WeaponMats, type WeaponModel } from "./weaponModels";
import { clamp, lerp, smoothstep } from "../../shared/math";

interface VMEntry {
  key: string;
  def: WeaponDef;
  model: WeaponModel;
  holder: TransformNode;
  handR: TransformNode;
  handL: TransformNode;
  muzzleFlash: Mesh;
  meshes: Mesh[];
  baseL: Vector3;
  baseR: Vector3;
}

export interface VMInput {
  p: PlayerState;
  dt: number;
  ads: number; // eased 0..1
  viewDYaw: number;
  viewDPitch: number;
  bobScale: number;
  reducedMotion: boolean;
  speed: number;
  time: number;
  cookingKind: string;
}

const ease = (t: number) => t * t * (3 - 2 * t);

export class Viewmodel {
  root: TransformNode;
  pivot: TransformNode;
  private entries = new Map<string, VMEntry>();
  private active: VMEntry | null = null;
  private grenade: Mesh;
  private bobPhase = 0;
  private swayX = 0;
  private swayY = 0;
  private kickZ = 0;
  private kickP = 0;
  private kickVZ = 0;
  private kickVP = 0;
  private kickRoll = 0;
  meleeT = 0;
  throwT = 0;
  inspectT = 0;
  private flashT = 0;
  private lastSlot = -1;
  private lastWeaponId = "";
  private boltKick = 0;
  visible = true;

  constructor(private scene: Scene, private mats: WeaponMats, private camera: Camera, private flashTex: Texture) {
    this.root = new TransformNode("vm_root", scene);
    this.root.parent = camera;
    this.pivot = new TransformNode("vm_pivot", scene);
    this.pivot.parent = this.root;
    this.grenade = MeshBuilder.CreateSphere("vm_gren", { diameter: 0.09, segments: 8 }, scene);
    const gm = new StandardMaterial("vm_gren_m", scene); gm.diffuseColor = Color3.FromHexString("#3b4a3a"); gm.specularColor = new Color3(0.3, 0.3, 0.3);
    this.grenade.material = gm; this.grenade.parent = this.pivot; this.grenade.renderingGroupId = 1; this.grenade.isVisible = false; this.grenade.isPickable = false;
  }

  private entryFor(p: PlayerState): VMEntry {
    const w = p.weapons[p.slot];
    const key = w.id + ":" + w.stats.attachments.join(",");
    let e = this.entries.get(key);
    if (!e) {
      const def = WEAPONS[w.id];
      const model = buildWeaponModel(this.scene, def, w.stats.attachments, this.mats);
      const holder = new TransformNode("vm_hold_" + key, this.scene);
      holder.parent = this.pivot;
      model.root.parent = holder;
      const hands = buildHands(this.scene, holder, model, this.mats, def.look.hand === "pistol");
      const mf = MeshBuilder.CreatePlane("vm_mf", { size: 0.32 }, this.scene);
      const fm = new StandardMaterial("vm_mf_m", this.scene);
      fm.emissiveTexture = this.flashTex; fm.opacityTexture = this.flashTex; fm.disableLighting = true; fm.backFaceCulling = false; fm.emissiveColor = new Color3(1, 0.85, 0.55);
      mf.material = fm; mf.parent = model.muzzle; mf.position.set(0, 0, 0.1); mf.isVisible = false; mf.isPickable = false;
      const meshes = [...model.meshes, ...hands.meshes, mf];
      for (const m of meshes) { m.renderingGroupId = 1; m.receiveShadows = false; }
      e = { key, def, model, holder, handR: hands.right, handL: hands.left, muzzleFlash: mf, meshes, baseL: model.leftHand.clone(), baseR: model.rightHand.clone() };
      holder.setEnabled(false);
      this.entries.set(key, e);
    }
    return e;
  }

  /** Called when the local player fires (cosmetic kick; never alters the aim ray). */
  fired(def: WeaponDef, ads: number): void {
    const k = (def.cls === "shotgun" ? 1.6 : def.cls === "marksman" ? 1.5 : def.cls === "lmg" ? 0.8 : def.cls === "pistol" ? 0.9 : 0.7) * lerp(1, 0.55, ads);
    this.kickVZ -= 0.5 * k;
    this.kickVP += 0.9 * k;
    this.kickRoll += (Math.random() - 0.5) * 0.04 * k;
    this.flashT = 0.045;
    this.boltKick = 1;
  }
  startMelee(): void { this.meleeT = 0.34; this.inspectT = 0; }
  startThrow(): void { this.throwT = 0.36; this.inspectT = 0; }
  startInspect(): void { if (this.inspectT <= 0) this.inspectT = 2.4; }
  cancelInspect(): void { this.inspectT = 0; }

  setFovCompensation(mainVfov: number, vmVfov: number): void {
    const k = 0.64 * Math.tan(mainVfov / 2) / Math.tan(vmVfov / 2); // =1 at 90° main / 65° viewmodel: positions below are authored for that
    this.root.scaling.set(k, k, 1);
  }

  update(i: VMInput): void {
    const p = i.p;
    const e = this.entryFor(p);
    if (this.active !== e) {
      if (this.active) { this.active.holder.setEnabled(false); }
      this.active = e;
      e.holder.setEnabled(true);
    }
    const dt = i.dt;
    const w = p.weapons[p.slot];
    const def = e.def;
    const model = e.model;
    this.root.setEnabled(this.visible && p.alive);
    if (this.lastSlot !== p.slot || this.lastWeaponId !== w.id) { this.lastSlot = p.slot; this.lastWeaponId = w.id; this.inspectT = 0; }

    // ---------- springs
    const stiff = 90, damp = 14;
    this.kickVZ += (-this.kickZ * stiff - this.kickVZ * damp) * dt;
    this.kickZ += this.kickVZ * dt;
    this.kickVP += (-this.kickP * stiff - this.kickVP * damp) * dt;
    this.kickP += this.kickVP * dt;
    this.kickRoll *= Math.max(0, 1 - dt * 10);
    this.boltKick = Math.max(0, this.boltKick - dt * 6);
    const rm = i.reducedMotion ? 0.35 : 1;
    // ---------- sway from view motion
    const tgtX = clamp(-i.viewDYaw * 0.9, -0.12, 0.12), tgtY = clamp(i.viewDPitch * 0.9, -0.1, 0.1);
    this.swayX += (tgtX - this.swayX) * Math.min(1, dt * 9);
    this.swayY += (tgtY - this.swayY) * Math.min(1, dt * 9);
    // ---------- bob
    const moving = i.speed > 0.6 && p.onGround;
    if (moving) this.bobPhase += i.speed * dt * (p.sprinting ? 1.35 : 1.6);
    const bobAmp = (moving ? Math.min(1, i.speed / 5.2) : 0) * i.bobScale * rm * lerp(1, 0.12, i.ads) * (p.crouching ? 0.6 : 1);
    const bobX = Math.sin(this.bobPhase) * 0.007 * bobAmp * (p.sprinting ? 1.8 : 1);
    const bobY = -Math.abs(Math.cos(this.bobPhase)) * 0.011 * bobAmp * (p.sprinting ? 1.6 : 1);
    const idle = Math.sin(i.time * 1.4) * 0.0018 * lerp(1, 0.2, i.ads);

    // ---------- pose blend
    const sight = model.sightHeight;
    const hipPos = new Vector3(0.16, -0.15, 0.76 + (def.cls === "lmg" ? 0.03 : 0));
    const adsPos = new Vector3(0, -sight - (def.look.scope ? 0.003 : 0.0), 0.62 + (def.look.scope ? 0.06 : 0));
    const pos = Vector3.Lerp(hipPos, adsPos, ease(i.ads));
    let rx = 0, ry = 0, rz = 0;
    // sprint
    const sprintK = p.sprinting ? 1 : 0;
    this.sprintBlend = lerp(this.sprintBlend, sprintK, Math.min(1, dt * 11));
    pos.x += 0.06 * this.sprintBlend; pos.y += -0.1 * this.sprintBlend; pos.z += -0.07 * this.sprintBlend;
    rx += 0.55 * this.sprintBlend; ry += -0.55 * this.sprintBlend; rz += 0.22 * this.sprintBlend;
    // swap (raise) - swapT counts down from swapTotal
    if (p.swapT > 0) {
      const k = clamp(p.swapT / Math.max(0.05, p.swapTotal), 0, 1);
      pos.y += -0.42 * ease(k); rx += 0.9 * ease(k); ry += -0.3 * ease(k);
    }
    // reload
    let magY = 0, magZ = 0, leftOff = new Vector3(0, 0, 0), reloadShow = 1;
    if (w.reloadT >= 0) {
      const sub = def.fireMode === "pump";
      if (!sub) {
        const k = clamp(w.reloadT / Math.max(0.1, w.reloadTotal), 0, 1);
        const tilt = smoothstep(0, 0.14, k) * (1 - smoothstep(0.86, 1, k));
        rz += 0.55 * tilt; rx += 0.18 * tilt; pos.y += -0.05 * tilt; pos.x += -0.04 * tilt;
        // magazine: out (0.14-0.34), away, in (0.55-0.72)
        const out = smoothstep(0.14, 0.34, k), back = smoothstep(0.55, 0.72, k);
        magY = -0.3 * out * (1 - back); magZ = -0.04 * out * (1 - back);
        // left hand follows: to mag well, down to grab, up with new mag
        const grab = smoothstep(0.1, 0.32, k);
        const insert = smoothstep(0.55, 0.74, k);
        const rel = smoothstep(0.82, 1, k);
        const targetDown = new Vector3(0.0, -0.2, -(model.leftHand.z - 0.0) + 0.0);
        leftOff = new Vector3(0, -0.05, -0.28 * (grab * (1 - rel)) - 0.0).add(targetDown.scale(0 * grab));
        leftOff.y = -0.18 * grab * (1 - insert * 0.6) * (1 - rel) + 0.0;
        leftOff.z = -(model.leftHand.z - 0.0) * 0.82 * grab * (1 - rel);
        leftOff.x = 0.0;
        reloadShow = 1;
      } else {
        const shell = Math.sin(w.reloadT * (1 / Math.max(0.2, def.shellReload ?? 0.45)) * Math.PI * 2);
        rz += 0.45; rx += 0.1; leftOff = new Vector3(0.0, -0.1 + shell * 0.03, -0.25 + Math.max(0, shell) * 0.08);
      }
    }
    // cycling (pump/bolt) and bolt kick
    let boltZ = 0, pumpZ = 0, boltRoll = 0;
    if (w.cycling > 0 && def.fireMode === "bolt") {
      const k = 1 - clamp(w.cycling / Math.max(0.1, w.stats.interval * 0.92), 0, 1);
      boltZ = Math.sin(k * Math.PI) * -0.06; boltRoll = Math.sin(k * Math.PI) * 0.35; pos.y += -0.02 * Math.sin(k * Math.PI);
      rz += boltRoll * 0.4;
    } else if (w.cycling > 0 && def.fireMode === "pump") {
      const k = 1 - clamp(w.cycling / Math.max(0.1, w.stats.interval * 0.92), 0, 1);
      pumpZ = Math.sin(clamp((k - 0.25) / 0.6, 0, 1) * Math.PI) * -0.11;
      leftOff.z += pumpZ;
    } else boltZ = -0.03 * this.boltKick;
    // melee
    if (this.meleeT > 0) {
      this.meleeT = Math.max(0, this.meleeT - dt);
      const k = 1 - this.meleeT / 0.34;
      const s = Math.sin(k * Math.PI);
      pos.z += 0.17 * s; pos.x += -0.08 * s; pos.y += 0.02 * s;
      ry += (k < 0.5 ? 1 : -0.4) * 0.9 * s; rx += -0.5 * s;
    }
    // throwing equipment (cook raises hand with grenade; weapon lowers)
    const cooking = !!p.cooking || this.throwT > 0;
    this.cookBlend = lerp(this.cookBlend, cooking ? 1 : 0, Math.min(1, dt * 12));
    if (this.cookBlend > 0.01) {
      pos.y += -0.28 * this.cookBlend; rx += 0.7 * this.cookBlend; pos.x += 0.08 * this.cookBlend;
      reloadShow = 1 - this.cookBlend;
    }
    this.grenade.isVisible = this.cookBlend > 0.3;
    this.grenade.position.set(0.12, -0.1 + (this.throwT > 0 ? Math.sin((1 - this.throwT / 0.36) * Math.PI) * 0.12 : 0), 0.3 + (this.throwT > 0 ? (1 - this.throwT / 0.36) * 0.3 : 0));
    if (this.throwT > 0) this.throwT = Math.max(0, this.throwT - dt);
    // mantle
    if (p.mantle) {
      const k = clamp(p.mantle.t / p.mantle.dur, 0, 1);
      const s = Math.sin(k * Math.PI);
      pos.y += -0.12 * s; pos.z += 0.05 * s; rx += 0.5 * s;
    }
    // inspect (safe only: cancelled instantly by any action)
    const busy = p.sprinting || w.reloadT >= 0 || p.swapT > 0 || i.ads > 0.1 || this.meleeT > 0 || p.mantle !== null || w.cycling > 0 || p.cooking;
    if (busy) this.inspectT = 0;
    if (this.inspectT > 0) {
      this.inspectT = Math.max(0, this.inspectT - dt);
      const k = 1 - this.inspectT / 2.4;
      const s = Math.sin(k * Math.PI);
      ry += s * 1.2; rz += Math.sin(k * Math.PI * 2) * 0.5; pos.x += -0.07 * s; pos.y += 0.04 * s; rx += -0.25 * s;
    }
    // flinch/landing
    // ---------- compose
    const adsDamp = lerp(1, 0.55, i.ads);
    this.pivot.position.set(pos.x + bobX + this.swayX * 0.12 * rm, pos.y + bobY + idle + this.swayY * 0.08 * rm, pos.z + this.kickZ * 0.25 * adsDamp * rm + boltZ * 0);
    this.pivot.rotation.set(rx + this.kickP * 0.6 * adsDamp * rm - this.swayY * 0.5 * rm, ry + this.swayX * 0.55 * rm, rz + this.kickRoll * rm + bobX * 3);
    // kick also pulls the weapon back along its own axis
    e.holder.position.z = this.kickZ * 0.2 * rm;
    e.holder.scaling.setAll(0.8);
    // animated sub-parts
    model.magazine.position.set(0, magY, magZ);
    model.bolt.position.z = boltZ;
    if (model.pump) model.pump.position.z = pumpZ + this.boltKick * -0.0;
    e.handL.position.set(e.baseL.x + leftOff.x, e.baseL.y + leftOff.y, e.baseL.z + leftOff.z);
    e.handR.position.copyFrom(e.baseR);
    for (const m of e.meshes) if (m !== e.muzzleFlash) m.isVisible = reloadShow > 0.001 || this.cookBlend < 0.7;
    // muzzle flash
    if (this.flashT > 0) {
      this.flashT -= dt;
      e.muzzleFlash.isVisible = this.flashT > 0 && !w.stats.suppressed;
      e.muzzleFlash.scaling.setAll(0.7 + Math.random() * 0.7);
      e.muzzleFlash.rotation.z = Math.random() * 6.28;
    } else e.muzzleFlash.isVisible = false;
  }
  private sprintBlend = 0;
  private cookBlend = 0;

  /** Position of the viewmodel muzzle in world space (for tracer origin). */
  muzzleWorld(): Vector3 | null {
    if (!this.active) return null;
    this.active.model.muzzle.computeWorldMatrix(true);
    return this.active.model.muzzle.getAbsolutePosition().clone();
  }
  dispose(): void { this.root.dispose(); }
}
