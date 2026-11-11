// Modular procedural operative: team silhouette via helmet, vest, pack and emissive IFF accents (not whole-body paint).
import { Color3, Mesh, MeshBuilder, Scene, ShadowGenerator, StandardMaterial, TransformNode, Texture, AbstractMesh } from "@babylonjs/core";
import type { PlayerState } from "../../shared/sim/types";
import { WEAPONS } from "../../shared/content/weapons";
import { buildWeaponModel, type WeaponMats, type WeaponModel } from "./weaponModels";
import { lerp, wrapAngle } from "../../shared/math";
import type { TextureSet } from "./textures";

export const TEAM_NAMES = ["Meridian Guard", "Ashfall Security"];
export const TEAM_COLORS = ["#35c6e8", "#ff8a1f"];

interface TeamKit { sources: Record<string, Mesh>; accent: StandardMaterial }

function mat(scene: Scene, name: string, hex: string, spec = 0.1, emissive?: string): StandardMaterial {
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = Color3.FromHexString(hex);
  m.specularColor = new Color3(spec, spec, spec);
  if (emissive) { m.emissiveColor = Color3.FromHexString(emissive); }
  return m;
}

export class CharacterFactory {
  private kits: TeamKit[] = [];
  private skin: StandardMaterial;
  private markerMat: StandardMaterial[] = [];
  private flashTex: Texture;

  constructor(private scene: Scene, private wmats: WeaponMats, private shadow: ShadowGenerator | null, T: TextureSet, private palette: [string, string] = [TEAM_COLORS[0], TEAM_COLORS[1]]) {
    this.skin = mat(scene, "c_skin", "#c99a7a", 0.05);
    this.flashTex = T.star;
    for (let t = 0; t < 2; t++) this.kits.push(this.makeKit(t));
    for (let t = 0; t < 2; t++) {
      const m = new StandardMaterial("c_marker" + t, scene);
      m.emissiveColor = Color3.FromHexString(this.palette[t]); m.disableLighting = true; m.backFaceCulling = false;
      this.markerMat.push(m);
    }
  }

  private makeKit(team: number): TeamKit {
    const s = this.scene;
    const cloth = mat(s, "c_cloth" + team, team === 0 ? "#566a74" : "#7a6c58", 0.05);
    const armor = mat(s, "c_armor" + team, team === 0 ? "#2b343a" : "#34302b", 0.3);
    const pack = mat(s, "c_pack" + team, team === 0 ? "#3d4a50" : "#4a4238", 0.1);
    const helm = mat(s, "c_helm" + team, team === 0 ? "#30393f" : "#3a342d", 0.35);
    const boot = mat(s, "c_boot", "#1a1d1f", 0.2);
    const accent = mat(s, "c_accent" + team, this.palette[team], 0.2, this.palette[team]);
    accent.emissiveColor = Color3.FromHexString(this.palette[team]).scale(0.85);
    const src: Record<string, Mesh> = {};
    const mk = (name: string, m: StandardMaterial, build: () => Mesh) => {
      const mesh = build();
      mesh.material = m; mesh.isVisible = false; mesh.isPickable = false;
      src[name] = mesh;
    };
    const B = (w: number, h: number, d: number) => MeshBuilder.CreateBox("p", { width: w, height: h, depth: d }, s);
    mk("pelvis", armor, () => B(0.34, 0.2, 0.22));
    mk("torso", cloth, () => B(0.4, 0.46, 0.24));
    mk("plate", armor, () => B(0.35, 0.34, 0.06));
    mk("pack", pack, () => B(0.32, 0.38, 0.15));
    mk("head", this.skin, () => MeshBuilder.CreateSphere("p", { diameter: 0.23, segments: 8 }, s));
    mk("helmet", helm, () => B(0.27, 0.17, 0.3));
    mk("helmetTop", helm, () => B(0.24, 0.05, 0.26));
    mk("upperArm", cloth, () => B(0.095, 0.3, 0.095));
    mk("foreArm", armor, () => B(0.085, 0.28, 0.085));
    mk("thigh", cloth, () => B(0.155, 0.42, 0.155));
    mk("shin", armor, () => B(0.125, 0.42, 0.125));
    mk("boot", boot, () => B(0.13, 0.1, 0.27));
    mk("accentH", accent, () => B(0.2, 0.025, 0.02));
    mk("accentV", accent, () => B(0.05, 0.3, 0.02));
    mk("accentC", accent, () => B(0.3, 0.035, 0.02));
    mk("accentS", accent, () => B(0.105, 0.04, 0.105));
    mk("kneeP", armor, () => B(0.14, 0.09, 0.05));
    for (const m of Object.values(src)) { m.parent = null; }
    return { sources: src, accent };
  }

  create(team: number, player: PlayerState): CharacterView {
    return new CharacterView(this.scene, this.kits[team], this.wmats, this.shadow, team, player, this.markerMat[team], this.flashTex);
  }
}

export class CharacterView {
  root: TransformNode;
  upper: TransformNode;
  body: TransformNode;
  hipL: TransformNode; hipR: TransformNode; kneeL!: TransformNode; kneeR!: TransformNode;
  shL: TransformNode; shR: TransformNode; elL!: TransformNode; elR!: TransformNode;
  weapon: WeaponModel | null = null;
  weaponId = "";
  muzzleFlash: Mesh;
  flashT = 0;
  phase = 0;
  deadT = 0;
  marker: Mesh;
  instances: AbstractMesh[] = [];
  smoothSpeed = 0;
  hideAt = 0;

  constructor(private scene: Scene, kit: TeamKit, private wmats: WeaponMats, private shadow: ShadowGenerator | null, public team: number, public player: PlayerState, markerMat: StandardMaterial, flashTex: Texture) {
    const S = kit.sources;
    const inst = (name: string, parent: TransformNode, x: number, y: number, z: number, rx = 0) => {
      const m = S[name].createInstance(name + "_i");
      m.parent = parent; m.position.set(x, y, z); m.rotation.x = rx; m.isPickable = false;
      this.instances.push(m);
      this.shadow?.addShadowCaster(m);
      return m;
    };
    const node = (name: string, parent: TransformNode | null, x = 0, y = 0, z = 0) => {
      const n = new TransformNode(name, scene); n.parent = parent; n.position.set(x, y, z); return n;
    };
    this.root = node("char", null);
    this.body = node("body", this.root);
    this.upper = node("upper", this.body, 0, 1.0, 0);
    // pelvis & legs
    inst("pelvis", this.body, 0, 0.93, 0);
    this.hipL = node("hipL", this.body, -0.1, 0.9, 0); this.hipR = node("hipR", this.body, 0.1, 0.9, 0);
    for (const [hip, knee] of [[this.hipL, "kneeL"], [this.hipR, "kneeR"]] as const) {
      inst("thigh", hip, 0, -0.21, 0);
      const k = node(knee, hip, 0, -0.42, 0);
      inst("shin", k, 0, -0.21, 0); inst("boot", k, 0, -0.45, 0.06); inst("kneeP", k, 0, 0.0, 0.07);
      if (knee === "kneeL") this.kneeL = k; else this.kneeR = k;
    }
    // torso (child of upper; upper pivot at y=1.0)
    inst("torso", this.upper, 0, 0.28, 0);
    inst("plate", this.upper, 0, 0.3, 0.14);
    inst("accentC", this.upper, 0, 0.47, 0.175);
    inst("pack", this.upper, 0, 0.26, -0.2);
    inst("accentV", this.upper, 0, 0.3, -0.282);
    const head = node("head", this.upper, 0, 0.62, 0);
    inst("head", head, 0, 0, 0);
    inst("helmet", head, 0, 0.06, -0.005);
    inst("helmetTop", head, 0, 0.145, -0.01);
    inst("accentH", head, 0, 0.1, 0.155);
    // arms
    this.shL = node("shL", this.upper, -0.26, 0.5, 0); this.shR = node("shR", this.upper, 0.26, 0.5, 0);
    for (const [sh, el] of [[this.shL, "elL"], [this.shR, "elR"]] as const) {
      inst("upperArm", sh, 0, -0.15, 0); inst("accentS", sh, 0, -0.02, 0);
      const e = node(el, sh, 0, -0.3, 0);
      inst("foreArm", e, 0, -0.14, 0);
      if (el === "elL") this.elL = e; else this.elR = e;
    }
    // muzzle flash
    this.muzzleFlash = MeshBuilder.CreatePlane("mf", { size: 0.7 }, scene);
    const fm = new StandardMaterial("mf_m", scene);
    fm.emissiveTexture = flashTex; fm.opacityTexture = flashTex; fm.disableLighting = true; fm.backFaceCulling = false; fm.emissiveColor = new Color3(1, 0.85, 0.5);
    this.muzzleFlash.material = fm; this.muzzleFlash.billboardMode = Mesh.BILLBOARDMODE_ALL; this.muzzleFlash.isVisible = false; this.muzzleFlash.isPickable = false;
    // teammate marker
    this.marker = MeshBuilder.CreateDisc("iff", { radius: 0.075, tessellation: 3 }, scene);
    this.marker.material = markerMat; this.marker.billboardMode = Mesh.BILLBOARDMODE_ALL; this.marker.parent = this.root; this.marker.position.y = 2.25;
    this.marker.rotation.z = Math.PI / 2 * 0; this.marker.renderingGroupId = 2; this.marker.isPickable = false; this.marker.isVisible = false;
    this.setWeapon(player.weapons[player.slot].id, player.weapons[player.slot].stats.attachments);
  }

  setWeapon(id: string, attach: string[]): void {
    if (this.weaponId === id) return;
    this.weaponId = id;
    if (this.weapon) { this.weapon.root.dispose(false, false); this.weapon = null; }
    const def = WEAPONS[id];
    const w = buildWeaponModel(this.scene, def, attach, this.wmats);
    w.root.parent = this.upper;
    const pistol = def.look.hand === "pistol";
    w.root.position.set(0.1, pistol ? 0.3 : 0.25, 0.34);
    w.root.scaling.setAll(1);
    for (const m of w.meshes) this.shadow?.addShadowCaster(m);
    this.weapon = w;
    this.muzzleFlash.parent = w.muzzle;
    this.muzzleFlash.position.set(0, 0, 0.12);
    // pistol vs long-gun arm poses are applied in update()
  }

  flash(): void { this.flashT = 0.05; }

  update(p: PlayerState, alpha: number, dt: number, time: number, showMarker: boolean): void {
    const wp = p.weapons[p.slot];
    if (wp.id !== this.weaponId) this.setWeapon(wp.id, wp.stats.attachments);
    const x = lerp(p.prevPos.x, p.pos.x, alpha), y = lerp(p.prevPos.y, p.pos.y, alpha), z = lerp(p.prevPos.z, p.pos.z, alpha);
    const yaw = p.prevYaw + wrapAngle(p.yaw - p.prevYaw) * alpha;
    this.root.position.set(x, y, z);
    this.root.rotation.y = yaw;
    const speed = Math.hypot(p.vel.x, p.vel.z);
    this.smoothSpeed += (speed - this.smoothSpeed) * Math.min(1, dt * 12);
    this.phase += this.smoothSpeed * dt * (p.sprinting ? 1.5 : 1.7);
    if (!p.alive) {
      this.deadT = Math.min(1, this.deadT + dt * 3);
    } else this.deadT = Math.max(0, this.deadT - dt * 8);
    const dk = this.deadT * this.deadT;
    this.root.rotation.x = -Math.PI / 2 * 0.98 * dk;
    this.root.position.y = y + dk * 0.22;
    const amp = Math.min(1, this.smoothSpeed / 5) * (p.sprinting ? 1.0 : 0.75);
    const s = Math.sin(this.phase);
    const crouch = p.crouchT;
    this.body.position.y = -0.38 * crouch - Math.abs(Math.cos(this.phase)) * 0.025 * amp;
    this.hipL.rotation.x = -s * 0.8 * amp - 1.0 * crouch;
    this.hipR.rotation.x = s * 0.8 * amp - 1.0 * crouch;
    this.kneeL.rotation.x = Math.max(0, s) * 1.0 * amp + 1.6 * crouch;
    this.kneeR.rotation.x = Math.max(0, -s) * 1.0 * amp + 1.6 * crouch;
    // upper body follows aim pitch; sprint lowers the weapon
    const pitch = Math.max(-1.0, Math.min(1.0, p.pitch + p.recoilP));
    const pistol = WEAPONS[this.weaponId].look.hand === "pistol";
    const sprint = p.sprinting ? 1 : 0;
    this.upper.rotation.x = -pitch * 0.7 + 0.12 * sprint + 0.08 * crouch;
    this.upper.rotation.y = 0;
    const reloadK = wp.reloadT >= 0 ? 1 : 0;
    const sway = Math.sin(time * 1.7 + p.id) * 0.01;
    if (pistol) {
      this.shR.rotation.x = -1.2 + sprint * 0.5 - pitch * 0.15; this.elR.rotation.x = -0.35;
      this.shL.rotation.x = -1.1 + sprint * 0.5; this.elL.rotation.x = -0.55; this.shL.rotation.z = -0.28; this.shR.rotation.z = 0.12;
    } else {
      this.shR.rotation.x = -0.95 + sprint * 0.55 + sway; this.elR.rotation.x = -0.75 + sprint * 0.4; this.shR.rotation.z = 0.05;
      this.shL.rotation.x = -1.15 + sprint * 0.45 + reloadK * 0.5; this.elL.rotation.x = -0.4 - reloadK * 0.4; this.shL.rotation.z = -0.2;
    }
    if (this.weapon) {
      this.weapon.root.position.y = (pistol ? 0.3 : 0.25) - sprint * 0.12;
      this.weapon.root.rotation.x = sprint * 0.35 + (reloadK ? 0.4 : 0);
      this.weapon.root.rotation.y = sprint * -0.4;
    }
    if (this.flashT > 0) {
      this.flashT -= dt;
      this.muzzleFlash.isVisible = this.flashT > 0 && p.alive;
      this.muzzleFlash.scaling.setAll(0.6 + Math.random() * 0.8);
    } else this.muzzleFlash.isVisible = false;
    this.marker.isVisible = showMarker && p.alive;
    const vis = p.alive || this.deadT < 1 || (this.hideAt === 0 ? true : time < this.hideAt);
    if (!p.alive) { if (this.hideAt === 0) this.hideAt = time + 4; } else this.hideAt = 0;
    this.root.setEnabled(vis && !(this.hideAt > 0 && time > this.hideAt));
  }

  dispose(): void {
    this.muzzleFlash.dispose();
    this.root.dispose(false, false);
  }
}
