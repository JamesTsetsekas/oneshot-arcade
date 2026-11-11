// Third-person soldiers built from merged primitives. Teams differ by helmet, vest,
// pack and emissive IFF accents (friend/foe colours relative to the viewer).
import { Scene, Mesh, MeshBuilder, StandardMaterial, Color3, TransformNode, DynamicTexture, Engine, Vector3 } from "@babylonjs/core";
import { PlayerSnap } from "../shared/protocol";
import { procTexture } from "./textures";
import { buildWeaponModel, weaponMats, WeaponModel, WeaponMats, disposeModel } from "./weaponModel";

interface Kit { fatigue: string; vest: string; pack: string; helmet: string; skin: string }
const KITS: Kit[] = [
  { fatigue: "#7d8a94", vest: "#34495a", pack: "#52636e", helmet: "#8d9ba4", skin: "#c49a7c" },
  { fatigue: "#a8996f", vest: "#3a3832", pack: "#76653f", helmet: "#6a604c", skin: "#a8785c" },
];

export interface IffColors { friend: Color3; foe: Color3 }

function coloredBox(scene: Scene, w: number, h: number, d: number, x: number, y: number, z: number, hex: string, rx = 0): Mesh {
  const m = MeshBuilder.CreateBox("cp", { width: w, height: h, depth: d }, scene);
  m.position.set(x, y, z); m.rotation.x = rx;
  const c = Color3.FromHexString(hex);
  const n = m.getTotalVertices();
  const cols: number[] = [];
  const pos = m.getVerticesData("position")!;
  for (let i = 0; i < n; i++) { const shade = pos[i * 3 + 1] < 0 ? 0.85 : 1; cols.push(c.r * shade, c.g * shade, c.b * shade, 1); }
  m.setVerticesData("color", cols);
  return m;
}

export class CharacterView {
  root: TransformNode;
  hips: TransformNode;
  upper: TransformNode;
  head: TransformNode;
  legL: TransformNode; legR: TransformNode;
  armNode: TransformNode;
  meshes: Mesh[] = [];
  iff: Mesh;
  gun: WeaponModel | null = null;
  gunId = "";
  tag: Mesh | null = null;
  glint: Mesh;
  phase = Math.random() * 6;
  deadT = -1;
  alive = true;
  team: number;
  friendly = false;
  muzzleWorld = new Vector3();

  constructor(private scene: Scene, private mat: StandardMaterial, private iffMats: [StandardMaterial, StandardMaterial], private gunMats: WeaponMats, public snapId: number, team: number, name: string) {
    this.team = team;
    const kit = KITS[team];
    this.root = new TransformNode(`ch${snapId}`, scene);
    this.hips = new TransformNode("hips", scene); this.hips.parent = this.root; this.hips.position.y = 0.9;
    this.upper = new TransformNode("upper", scene); this.upper.parent = this.hips; this.upper.position.y = 0.12;
    this.head = new TransformNode("head", scene); this.head.parent = this.upper; this.head.position.y = 0.55;
    this.legL = new TransformNode("legL", scene); this.legL.parent = this.hips; this.legL.position.set(-0.11, 0, 0);
    this.legR = new TransformNode("legR", scene); this.legR.parent = this.hips; this.legR.position.set(0.11, 0, 0);
    this.armNode = new TransformNode("arms", scene); this.armNode.parent = this.upper; this.armNode.position.set(0, 0.36, 0);

    const merge = (parts: Mesh[], parent: TransformNode, name: string) => {
      const m = Mesh.MergeMeshes(parts, true, true)!;
      m.name = name; m.parent = parent; m.material = this.mat; m.isPickable = false;
      this.meshes.push(m);
      return m;
    };
    // legs
    for (const [leg, side] of [[this.legL, -1], [this.legR, 1]] as const) {
      merge([
        coloredBox(scene, 0.17, 0.46, 0.2, 0, -0.23, 0, kit.fatigue),
        coloredBox(scene, 0.16, 0.42, 0.18, 0, -0.65, 0.01, kit.fatigue),
        coloredBox(scene, 0.19, 0.1, 0.16, 0, -0.43, 0.06, kit.pack),
        coloredBox(scene, 0.18, 0.1, 0.28, 0, -0.85, 0.04, "#1c1c1e"),
      ], leg, "leg");
      void side;
    }
    // pelvis + torso + vest + pack
    const helmetParts: Mesh[] = [];
    merge([
      coloredBox(scene, 0.38, 0.2, 0.24, 0, -0.02, 0, kit.fatigue),
      coloredBox(scene, 0.4, 0.06, 0.26, 0, 0.06, 0, "#2a2a28"),
    ], this.hips, "pelvis");
    const torso = [
      coloredBox(scene, 0.42, 0.5, 0.25, 0, 0.25, 0, kit.fatigue),
      coloredBox(scene, 0.47, 0.36, 0.32, 0, 0.27, 0.01, kit.vest),
      coloredBox(scene, 0.12, 0.1, 0.06, -0.12, 0.2, 0.18, kit.pack), coloredBox(scene, 0.12, 0.1, 0.06, 0.12, 0.2, 0.18, kit.pack),
      coloredBox(scene, 0.12, 0.08, 0.32, 0, 0.5, 0, kit.fatigue), // collar
    ];
    if (team === 0) torso.push(coloredBox(scene, 0.34, 0.42, 0.16, 0, 0.27, -0.22, kit.pack), coloredBox(scene, 0.06, 0.5, 0.04, 0.12, 0.6, -0.26, "#30373c"));
    else torso.push(coloredBox(scene, 0.4, 0.24, 0.14, 0, 0.18, -0.21, kit.pack), coloredBox(scene, 0.2, 0.16, 0.12, 0, 0.42, -0.2, kit.pack));
    merge(torso, this.upper, "torso");
    // head + helmet (team silhouette)
    helmetParts.push(coloredBox(scene, 0.19, 0.22, 0.21, 0, 0.0, 0.01, kit.skin));
    if (team === 0) {
      const dome = MeshBuilder.CreateSphere("dome", { diameter: 0.3, slice: 0.55, segments: 10 }, scene);
      dome.position.y = 0.04; dome.scaling.set(1, 0.95, 1.1);
      const n = dome.getTotalVertices(); const c = Color3.FromHexString(kit.helmet); const cols: number[] = [];
      for (let i = 0; i < n; i++) cols.push(c.r, c.g, c.b, 1);
      dome.setVerticesData("color", cols);
      helmetParts.push(dome, coloredBox(scene, 0.22, 0.05, 0.05, 0, 0.0, 0.13, "#1b1f22"));
    } else {
      helmetParts.push(coloredBox(scene, 0.27, 0.13, 0.29, 0, 0.1, -0.005, kit.helmet), coloredBox(scene, 0.29, 0.05, 0.1, 0, 0.04, -0.14, kit.helmet), coloredBox(scene, 0.2, 0.07, 0.04, 0, 0.02, 0.12, "#111"));
    }
    merge(helmetParts, this.head, "head");
    // arms holding the weapon
    merge([
      coloredBox(scene, 0.1, 0.1, 0.34, 0.2, -0.08, 0.12, kit.fatigue, 0.2),
      coloredBox(scene, 0.1, 0.1, 0.36, -0.12, -0.1, 0.22, kit.fatigue, 0.1),
      coloredBox(scene, 0.08, 0.08, 0.1, 0.13, -0.14, 0.32, "#1c1c1e"),
      coloredBox(scene, 0.08, 0.08, 0.1, -0.03, -0.12, 0.46, "#1c1c1e"),
    ], this.armNode, "arms");
    // IFF accents: shoulder strips + helmet light + pack light
    const iffParts = [
      MeshBuilder.CreateBox("i1", { width: 0.05, height: 0.04, depth: 0.14 }, scene),
      MeshBuilder.CreateBox("i2", { width: 0.05, height: 0.04, depth: 0.14 }, scene),
      MeshBuilder.CreateBox("i3", { width: 0.12, height: 0.03, depth: 0.03 }, scene),
      MeshBuilder.CreateBox("i4", { width: 0.16, height: 0.04, depth: 0.02 }, scene),
    ];
    iffParts[0].position.set(-0.235, 0.48, 0); iffParts[1].position.set(0.235, 0.48, 0);
    iffParts[2].position.set(0, 0.55 + 0.17, -0.12); iffParts[3].position.set(0, 0.38, -0.31);
    this.iff = Mesh.MergeMeshes(iffParts, true, true)!;
    this.iff.parent = this.upper; this.iff.isPickable = false;
    this.meshes.push(this.iff);

    // scope glint
    this.glint = MeshBuilder.CreatePlane("glint", { size: 0.9 }, scene);
    const gm = new StandardMaterial("glintMat", scene);
    gm.emissiveColor = new Color3(1, 1, 0.95); gm.disableLighting = true; gm.opacityTexture = procTexture(scene, "flare", 128, { alpha: true }); gm.alphaMode = Engine.ALPHA_ADD; gm.fogEnabled = false;
    this.glint.material = gm; this.glint.billboardMode = Mesh.BILLBOARDMODE_ALL; this.glint.parent = this.head; this.glint.position.set(0.05, 0.02, 0.6); this.glint.isVisible = false;
    this.makeTag(name);
  }

  private makeTag(name: string) {
    const dt = new DynamicTexture(`tag${this.snapId}`, { width: 256, height: 48 }, this.scene, true);
    const ctx = dt.getContext() as unknown as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, 256, 48);
    ctx.font = "600 30px 'Segoe UI', Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.lineWidth = 5; ctx.strokeStyle = "rgba(0,0,0,0.7)"; ctx.strokeText(name, 128, 26);
    ctx.fillStyle = "#7fe9f5"; ctx.fillText(name, 128, 26);
    dt.update(true); dt.hasAlpha = true;
    const m = MeshBuilder.CreatePlane("tag", { width: 1.2, height: 0.225 }, this.scene);
    const mat = new StandardMaterial("tagMat", this.scene);
    mat.diffuseTexture = dt; mat.emissiveColor = Color3.White(); mat.disableLighting = true; mat.useAlphaFromDiffuseTexture = true; mat.fogEnabled = false; mat.backFaceCulling = false;
    m.material = mat; m.billboardMode = Mesh.BILLBOARDMODE_ALL; m.parent = this.root; m.position.y = 2.15; m.isPickable = false;
    m.renderingGroupId = 0;
    this.tag = m;
  }

  setRelation(friendly: boolean) {
    this.friendly = friendly;
    this.iff.material = this.iffMats[friendly ? 0 : 1];
  }

  setWeapon(id: string) {
    if (id === this.gunId) return;
    this.gunId = id;
    if (this.gun) disposeModel(this.gun);
    this.gun = buildWeaponModel(this.scene, id, [], this.gunMats, `g${this.snapId}`);
    this.gun.root.parent = this.armNode;
    this.gun.root.position.set(0.12, -0.09, 0.32);
    this.gun.root.scaling.setAll(1.1);
  }

  /** Apply an interpolated snapshot. */
  update(p: PlayerSnap, dt: number, t: number, camPos: Vector3, isLocal: boolean) {
    this.root.setEnabled(!isLocal && (p.alive || (this.deadT >= 0 && this.deadT < 4.5)));
    if (isLocal) return;
    if (p.alive && !this.alive) { this.deadT = -1; this.root.rotation.x = 0; }
    if (!p.alive && this.alive) this.deadT = 0;
    this.alive = p.alive;
    this.root.position.set(p.pos.x, p.pos.y, p.pos.z);
    this.root.rotation.y = p.yaw;
    if (!p.alive) {
      this.deadT += dt;
      const k = Math.min(1, this.deadT / 0.45);
      const ease = 1 - (1 - k) * (1 - k);
      this.root.rotation.x = -1.45 * ease;
      this.root.rotation.z = 0.25 * ease;
      this.hips.position.y = 0.9 - 0.55 * ease;
      if (this.deadT > 3.2) this.root.position.y -= (this.deadT - 3.2) * 0.6;
      if (this.tag) this.tag.isVisible = false;
      this.glint.isVisible = false;
      return;
    }
    this.root.rotation.x = 0; this.root.rotation.z = 0;
    const speed = p.speed;
    const moveK = Math.min(1, speed / 5);
    this.phase += dt * (speed * 1.9 + 0.5);
    const swing = Math.sin(this.phase) * (p.sprinting ? 0.85 : 0.55) * moveK;
    const crouch = p.crouchT;
    this.hips.position.y = 0.9 - 0.38 * crouch + Math.abs(Math.cos(this.phase)) * 0.03 * moveK;
    this.legL.rotation.x = swing - 0.9 * crouch;
    this.legR.rotation.x = -swing - 0.4 * crouch;
    this.upper.rotation.x = (p.sprinting ? 0.25 : 0.05) + 0.2 * crouch;
    this.upper.rotation.y = Math.sin(this.phase) * 0.08 * moveK;
    const aimPitch = p.sprinting ? 0.5 : Math.max(-1.1, Math.min(1.1, p.pitch));
    this.armNode.rotation.x = aimPitch - this.upper.rotation.x;
    this.head.rotation.x = Math.max(-0.6, Math.min(0.6, p.pitch * 0.6)) - this.upper.rotation.x * 0.5;
    this.setWeapon(p.weapon);
    if (this.gun) {
      this.gun.root.position.y = -0.09 + (p.reloading ? -0.08 : 0);
      this.gun.root.rotation.z = p.reloading ? 0.6 : 0;
      this.gun.muzzle.computeWorldMatrix(true);
      this.muzzleWorld.copyFrom(this.gun.muzzle.getAbsolutePosition());
    }
    if (this.tag) {
      const d = Vector3.Distance(camPos, this.root.position);
      this.tag.isVisible = this.friendly && d < 70;
      const s = Math.max(1, d / 18);
      this.tag.scaling.setAll(s);
    }
    this.glint.isVisible = !this.friendly && p.glint && Math.sin(t * 9) > -0.3;
    void Vector3;
  }

  dispose() { if (this.gun) disposeModel(this.gun); this.root.dispose(false, true); }
}

export class CharacterManager {
  views = new Map<number, CharacterView>();
  mat: StandardMaterial;
  iffMats: [StandardMaterial, StandardMaterial];
  gunMats: WeaponMats;
  constructor(private scene: Scene, private onMesh: (m: Mesh) => void) {
    this.mat = new StandardMaterial("charMat", scene);
    this.mat.diffuseColor = Color3.White(); this.mat.specularColor = new Color3(0.08, 0.08, 0.08);
    const mk = (n: string) => { const m = new StandardMaterial(n, scene); m.diffuseColor = Color3.Black(); m.disableLighting = true; return m; };
    this.iffMats = [mk("iffFriend"), mk("iffFoe")];
    this.gunMats = weaponMats(scene, "tp", "#3a4148");
    this.setColorblind(false);
  }
  setColorblind(cb: boolean) {
    this.iffMats[0].emissiveColor = cb ? new Color3(0.25, 0.55, 1.0) : new Color3(0.2, 0.9, 1.0);
    this.iffMats[1].emissiveColor = cb ? new Color3(1.0, 0.85, 0.1) : new Color3(1.0, 0.38, 0.1);
  }
  sync(players: PlayerSnap[], localTeam: number, localId: number, dt: number, t: number, camPos: Vector3) {
    for (const p of players) {
      let v = this.views.get(p.id);
      if (!v) {
        v = new CharacterView(this.scene, this.mat, this.iffMats, this.gunMats, p.id, p.team, p.name);
        v.setRelation(p.team === localTeam);
        for (const m of v.meshes) this.onMesh(m);
        this.views.set(p.id, v);
      }
      v.update(p, dt, t, camPos, p.id === localId);
    }
  }
  dispose() { for (const v of this.views.values()) v.dispose(); this.views.clear(); }
}
