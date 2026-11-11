// First-person viewmodel: arms + weapon with layered procedural animation
// (ADS, sway, bob, sprint, recoil spring, staged reloads, swap, melee, inspect, throws, landing).
// Purely decorative: the gameplay ray always comes from the camera/sim view angles.
import { Scene, Camera, TransformNode, Mesh, MeshBuilder, StandardMaterial, Color3, Engine } from "@babylonjs/core";
import { buildWeaponModel, weaponMats, WeaponModel, WeaponMats, disposeModel } from "./weaponModel";
import { WEAPONS } from "../content/weapons";
import { procTexture } from "./textures";
import { clamp, smoothstep } from "../shared/math";

export interface VMState {
  dt: number; t: number; ads: number; speed: number; sprinting: boolean; onGround: boolean; crouch: boolean;
  lookDX: number; lookDY: number;
  reload: { stage: string; t: number; total: number; kind: string } | null;
  swapT: number; melee: number; inspect: number; cooking: number; throwAge: number; landAge: number; landSpeed: number;
  alive: boolean; bobScale: number; mantling: boolean;
}

export class ViewModel {
  scene: Scene;
  root: TransformNode;
  pivot: TransformNode;
  model: WeaponModel | null = null;
  mats: WeaponMats;
  arms: { right: TransformNode; left: TransformNode; meshes: Mesh[] };
  grenade: Mesh;
  flash: Mesh;
  weaponId = "";
  private phase = 0;
  private recoilZ = 0; private recoilPitch = 0; private recoilRoll = 0;
  private swayX = 0; private swayY = 0;
  private sprintW = 0;
  private flashT = 1;
  private boltT = 1;
  scopeHidden = false;
  private fovScale = 1;

  constructor(scene: Scene, camera: Camera, sleeveHex: string) {
    this.scene = scene;
    this.root = new TransformNode("vmRoot", scene);
    this.root.parent = camera;
    this.pivot = new TransformNode("vmPivot", scene);
    this.pivot.parent = this.root;
    this.pivot.scaling.setAll(0.74);
    this.mats = weaponMats(scene, "vm", "#3a4148");
    for (const m of Object.values(this.mats)) { const sm = m as StandardMaterial; sm.fogEnabled = false; if (!sm.disableLighting) sm.emissiveColor = sm.diffuseColor.scale(0.35); }
    // arms
    const sleeve = new StandardMaterial("vm_sleeve", scene); sleeve.diffuseColor = Color3.FromHexString(sleeveHex); sleeve.specularColor = new Color3(0.05, 0.05, 0.05); sleeve.fogEnabled = false; sleeve.emissiveColor = sleeve.diffuseColor.scale(0.3);
    const glove = new StandardMaterial("vm_glove", scene); glove.diffuseColor = new Color3(0.09, 0.09, 0.1); glove.specularColor = new Color3(0.1, 0.1, 0.1); glove.fogEnabled = false;
    const mkArm = (name: string) => {
      const node = new TransformNode(name, scene);
      node.parent = this.pivot;
      const hand = MeshBuilder.CreateBox(`${name}_hand`, { width: 0.06, height: 0.05, depth: 0.1 }, scene);
      hand.parent = node; hand.material = glove;
      const fore = MeshBuilder.CreateBox(`${name}_fore`, { width: 0.075, height: 0.075, depth: 0.34 }, scene);
      fore.parent = node; fore.position.set(0, -0.02, -0.2); fore.material = sleeve;
      const cuff = MeshBuilder.CreateBox(`${name}_cuff`, { width: 0.08, height: 0.08, depth: 0.04 }, scene);
      cuff.parent = node; cuff.position.set(0, -0.01, -0.05); cuff.material = glove;
      return { node, meshes: [hand, fore, cuff] };
    };
    const r = mkArm("vmR"), l = mkArm("vmL");
    this.arms = { right: r.node, left: l.node, meshes: [...r.meshes, ...l.meshes] };
    this.grenade = MeshBuilder.CreateSphere("vmNade", { diameter: 0.07, segments: 8 }, scene);
    this.grenade.parent = this.pivot; this.grenade.material = this.mats.accent; this.grenade.isVisible = false;
    this.flash = MeshBuilder.CreatePlane("vmFlash", { size: 0.22 }, scene);
    const fm = new StandardMaterial("vm_flash", scene);
    fm.emissiveColor = new Color3(1, 0.8, 0.45); fm.diffuseColor = Color3.Black(); fm.disableLighting = true; fm.fogEnabled = false;
    fm.opacityTexture = procTexture(scene, "flare", 128, { alpha: true }); fm.alphaMode = Engine.ALPHA_ADD;
    this.flash.material = fm; this.flash.isVisible = false;
    for (const m of [...this.arms.meshes, this.grenade, this.flash]) { m.renderingGroupId = 1; m.isPickable = false; }
  }

  setFov(worldVFov: number, vmVFov: number) {
    this.fovScale = Math.tan(worldVFov / 2) / Math.tan(vmVFov / 2);
  }

  setWeapon(id: string, attachments: string[]) {
    const key = id + attachments.join(",");
    if (key === this.weaponId) return;
    this.weaponId = key;
    if (this.model) disposeModel(this.model);
    const accent = WEAPONS[id].model.accent;
    this.mats.accent.diffuseColor = Color3.FromHexString(accent).scale(1.5); this.mats.accent.emissiveColor = this.mats.accent.diffuseColor.scale(0.35);
    this.model = buildWeaponModel(this.scene, id, attachments, this.mats, "vm");
    this.model.root.parent = this.pivot;
    for (const m of this.model.meshes) { m.renderingGroupId = 1; }
    this.flash.parent = this.model.muzzle;
    this.flash.position.set(0, 0, 0.05);
    const pistol = WEAPONS[id].model.mag === "pistol";
    this.arms.right.position.set(0.005, -0.075, -0.07);
    this.arms.right.rotation.set(-0.95, -0.55, 0.2);
    if (pistol) { this.arms.left.position.set(-0.03, -0.085, -0.05); this.arms.left.rotation.set(-0.9, 0.7, -0.2); }
    else { this.arms.left.position.set(-0.01, -0.045, WEAPONS[id].model.body / 2 + WEAPONS[id].model.barrel * 0.35); this.arms.left.rotation.set(-0.75, 0.75, -0.25); }
    this.arms.left.metadata = { x: this.arms.left.position.x, y: this.arms.left.position.y, z: this.arms.left.position.z };
  }

  fire(scale = 1) {
    this.recoilZ += 0.03 * scale; this.recoilPitch += 0.05 * scale; this.recoilRoll += (Math.random() - 0.5) * 0.04 * scale;
    this.flashT = 0; this.boltT = 0;
    this.flash.rotation.z = Math.random() * Math.PI;
  }

  update(s: VMState) {
    const dt = Math.min(s.dt, 0.05);
    if (!this.model) return;
    const pistol = !!this.model && this.model.length < 0.4;
    const adsK = smoothstep(s.ads);
    const scoped = this.model.scope && s.ads > 0.85;
    this.scopeHidden = scoped;
    this.root.setEnabled(s.alive && !scoped);
    this.root.scaling.set(this.fovScale, this.fovScale, 1);

    // springs
    const k = Math.exp(-dt * 16);
    this.recoilZ *= k; this.recoilPitch *= Math.exp(-dt * 12); this.recoilRoll *= k;
    this.flashT += dt; this.boltT += dt;
    this.flash.isVisible = this.flashT < 0.045;
    this.flash.scaling.setAll(0.8 + Math.random() * 0.5);
    // sway & bob
    const swayAmt = (1 - adsK * 0.85);
    this.swayX += (clamp(-s.lookDX * 0.5, -0.05, 0.05) * swayAmt - this.swayX) * Math.min(1, dt * 10);
    this.swayY += (clamp(s.lookDY * 0.5, -0.04, 0.04) * swayAmt - this.swayY) * Math.min(1, dt * 10);
    const moving = s.onGround ? clamp(s.speed / 5.2, 0, 1.5) : 0;
    this.phase += dt * (4 + s.speed * 1.4) * (moving > 0.05 ? 1 : 0.2);
    const bobAmt = (0.25 + moving) * swayAmt * s.bobScale;
    const bobX = Math.sin(this.phase) * 0.011 * bobAmt;
    const bobY = -Math.abs(Math.cos(this.phase)) * 0.009 * bobAmt + Math.sin(s.t * 1.6) * 0.002 * (1 - adsK);
    this.sprintW += ((s.sprinting ? 1 : 0) - this.sprintW) * Math.min(1, dt * 9);

    // base pose hip -> ADS
    const hip = pistol ? { x: 0.1, y: -0.105, z: 0.32 } : { x: 0.105, y: -0.115, z: 0.33 };
    const ads = { x: 0, y: -this.model.sightHeight * 0.74, z: pistol ? 0.34 : 0.4 };
    let px = hip.x + (ads.x - hip.x) * adsK, py = hip.y + (ads.y - hip.y) * adsK, pz = hip.z + (ads.z - hip.z) * adsK;
    let rx = 0, ry = 0, rz = 0;
    px += bobX + this.swayX; py += bobY + this.swayY;
    // sprint
    px += 0.04 * this.sprintW; py -= 0.06 * this.sprintW; pz -= 0.04 * this.sprintW;
    rx += 0.35 * this.sprintW; ry += -0.75 * this.sprintW; rz += 0.25 * this.sprintW;
    // recoil
    pz -= this.recoilZ * (1 - adsK * 0.4); rx -= this.recoilPitch; rz += this.recoilRoll;
    // landing / mantle dip
    py -= Math.min(s.landSpeed / 18, 0.06) * Math.exp(-s.landAge * 9);
    if (s.mantling) { py -= 0.08; rx += 0.4; rz -= 0.3; }
    // reload: tilt weapon, drop and reinsert magazine, rack the bolt
    this.model.mag.position.set(0, 0, 0);
    this.model.mag.rotation.set(0, 0, 0);
    this.model.bolt.position.z = -Math.max(0, 0.04 - this.boltT * 0.6);
    let leftOverride = 0;
    if (s.reload) {
      const f = clamp(s.reload.t / s.reload.total, 0, 1);
      const tilt = Math.sin(Math.PI * Math.min(1, f * 1.05));
      rz += -0.55 * tilt; rx += 0.18 * tilt; px -= 0.03 * tilt; py += 0.01 * tilt;
      const empty = s.reload.kind === "empty";
      const outAt = empty ? 0.2 : 0.24, inAt = empty ? 0.53 : 0.67;
      if (f > outAt * 0.6 && f < inAt) {
        const o = smoothstep((f - outAt * 0.6) / (outAt * 0.4)) * (1 - smoothstep((f - (inAt - 0.15)) / 0.15));
        this.model.mag.position.y = -0.3 * o; this.model.mag.rotation.x = 0.4 * o;
        leftOverride = Math.min(1, o * 1.5);
      }
      if (empty && f > 0.72 && f < 0.9) this.model.bolt.position.z = -0.045 * Math.sin(Math.PI * (f - 0.72) / 0.18);
    }
    // left hand follows the magazine during reloads
    const bl = this.arms.left.metadata as { x: number; y: number; z: number };
    this.arms.left.position.set(bl.x - 0.01 * leftOverride, bl.y - 0.12 * leftOverride, bl.z + (0.12 - bl.z) * leftOverride);
    // swap
    if (s.swapT > 0) { py -= 0.28 * s.swapT; rx += 0.9 * s.swapT; }
    // melee butt-stroke
    if (s.melee >= 0) { const m = Math.sin(Math.PI * clamp(s.melee / 0.55, 0, 1)); pz += 0.12 * m; px -= 0.12 * m; rz += 0.9 * m; ry += 0.4 * m; }
    // inspect
    if (s.inspect > 0) { const w = smoothstep(Math.min(1, (2.2 - s.inspect) * 3)) * smoothstep(Math.min(1, s.inspect * 3)); rz += 1.0 * w; ry -= 0.6 * w; px -= 0.06 * w; py += 0.04 * w; rx -= 0.15 * w; }
    // equipment
    this.grenade.isVisible = s.cooking >= 0 || s.throwAge < 0.25;
    if (s.cooking >= 0) { py -= 0.06; rx += 0.25; this.grenade.position.set(-0.12, -0.08, 0.2); }
    if (s.throwAge < 0.3) { const w = Math.sin(Math.PI * s.throwAge / 0.3); py -= 0.08 * w; rx += 0.3 * w; this.grenade.position.set(-0.1, -0.02 + w * 0.08, 0.2 + w * 0.4); }

    this.pivot.position.set(px, py, pz);
    this.pivot.rotation.set(rx, ry, rz);
  }

  dispose() { if (this.model) disposeModel(this.model); this.root.dispose(); }
}
