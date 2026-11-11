// renderer: third-person operators. Two original faction kits, told apart by helmet, vest and pack silhouette plus
// emissive IFF accents (not whole-body team paint). Every part is a GPU instance of a few shared source meshes.
import { WEAPONS } from '../content/weapons';
import { Color3, Color4, CreateBox, CreatePlane, CreateSphere, InstancedMesh, Mesh, Scene, StandardMaterial, TransformNode, Vector3 } from './bjs';
import type { Renderer } from './renderer';
import { radialTexture } from './textures';

export interface CharPose {
  x: number; y: number; z: number;
  yaw: number; pitch: number;
  crouch: boolean; sprint: boolean; ads: boolean; reload: boolean;
  alive: boolean;
  speed: number;
  weapon: number;
  firing: boolean;
}

const KIT = [
  { uniform: [0.19, 0.24, 0.31], vest: [0.3, 0.37, 0.44], helmet: [0.8, 0.84, 0.86], pack: [0.23, 0.29, 0.36], skin: [0.16, 0.17, 0.19] },
  { uniform: [0.37, 0.31, 0.23], vest: [0.44, 0.27, 0.18], helmet: [0.21, 0.2, 0.19], pack: [0.31, 0.25, 0.18], skin: [0.2, 0.17, 0.15] },
];
export const TEAM_ACCENT: Record<string, [string, string]> = {
  off: ['#35dff0', '#ff8424'],
  deuteranopia: ['#3aa0ff', '#ffd23a'],
  protanopia: ['#3aa0ff', '#ffd23a'],
  tritanopia: ['#35f0c0', '#ff4f7a'],
};

export class CharacterPool {
  readonly box: Mesh;
  readonly sphere: Mesh;
  readonly glow: [Mesh, Mesh];
  readonly glint: Mesh;
  private glowMats: [StandardMaterial, StandardMaterial];
  chars = new Map<number, Character>();

  constructor(readonly scene: Scene, readonly renderer: Renderer) {
    const mat = new StandardMaterial('charMat', scene);
    mat.diffuseColor = new Color3(1, 1, 1);
    mat.specularColor = new Color3(0.08, 0.08, 0.08);
    mat.ambientColor = new Color3(1, 1, 1);
    this.box = CreateBox('charBox', { size: 1 }, scene);
    this.box.material = mat;
    this.box.registerInstancedBuffer('color', 4);
    this.box.instancedBuffers.color = new Color4(1, 1, 1, 1);
    this.box.isVisible = false;
    this.sphere = CreateSphere('charSphere', { diameter: 1, segments: 10 }, scene);
    this.sphere.material = mat;
    this.sphere.registerInstancedBuffer('color', 4);
    this.sphere.instancedBuffers.color = new Color4(1, 1, 1, 1);
    this.sphere.isVisible = false;
    const gm = (i: number) => {
      const m = new StandardMaterial('glowMat' + i, scene);
      m.disableLighting = true;
      m.emissiveColor = Color3.FromHexString(TEAM_ACCENT.off[i]);
      return m;
    };
    this.glowMats = [gm(0), gm(1)];
    this.glow = [0, 1].map((i) => {
      const b = CreateBox('charGlow' + i, { size: 1 }, scene);
      b.material = this.glowMats[i];
      b.isVisible = false;
      return b;
    }) as [Mesh, Mesh];
    this.glint = CreatePlane('glint', { size: 1 }, scene);
    const glm = new StandardMaterial('glintMat', scene);
    glm.disableLighting = true;
    glm.emissiveTexture = radialTexture(scene, 'glintTex', [[0, 'rgba(255,255,255,1)'], [0.15, 'rgba(210,240,255,0.9)'], [0.4, 'rgba(120,200,255,0.25)'], [1, 'rgba(0,0,0,0)']]);
    glm.opacityTexture = glm.emissiveTexture;
    glm.alphaMode = 1; // additive
    glm.disableDepthWrite = true;
    this.glint.material = glm;
    this.glint.billboardMode = Mesh.BILLBOARDMODE_ALL;
    this.glint.isVisible = false;
  }

  setAccents(mode: string): void {
    const c = TEAM_ACCENT[mode] ?? TEAM_ACCENT.off;
    this.glowMats[0].emissiveColor = Color3.FromHexString(c[0]);
    this.glowMats[1].emissiveColor = Color3.FromHexString(c[1]);
  }

  get(id: number, team: 0 | 1): Character {
    let c = this.chars.get(id);
    if (!c) { c = new Character(this, id, team); this.chars.set(id, c); }
    return c;
  }

  dispose(): void {
    for (const c of this.chars.values()) c.root.dispose();
    this.chars.clear();
  }
}

export class Character {
  readonly root: TransformNode;
  private fall: TransformNode;
  private body: TransformNode;
  private spine: TransformNode;
  private head: TransformNode;
  private gun: TransformNode;
  private legs: { thigh: TransformNode; shin: TransformNode }[] = [];
  private gunParts: InstancedMesh[] = [];
  private glintMesh: InstancedMesh;
  private parts: InstancedMesh[] = [];
  private phase = 0;
  private deathT = -1;
  private hip = 0.92;
  private weapon = -1;
  private visible = true;
  private sprintBlend = 0;
  readonly muzzle = new Vector3();
  readonly headPos = new Vector3();

  constructor(private pool: CharacterPool, readonly id: number, readonly team: 0 | 1) {
    const scene = pool.scene, k = KIT[team];
    const node = (name: string, parent: TransformNode | null, x = 0, y = 0, z = 0): TransformNode => {
      const n = new TransformNode(name, scene);
      if (parent) n.parent = parent;
      n.position.set(x, y, z);
      return n;
    };
    this.root = node('char' + id, null);
    this.fall = node('fall', this.root);
    this.body = node('body', this.fall, 0, 0.92, 0);
    this.spine = node('spine', this.body, 0, 0.1, 0);
    this.head = node('head', this.spine, 0, 0.62, 0.01);
    this.gun = node('gun', this.spine, 0.13, 0.33, 0.36);
    const P = (src: Mesh, parent: TransformNode, sx: number, sy: number, sz: number, px: number, py: number, pz: number, col: number[] | null, cast = false, rx = 0, ry = 0, rz = 0): InstancedMesh => {
      const inst = src.createInstance('p');
      inst.parent = parent;
      inst.scaling.set(sx, sy, sz);
      inst.position.set(px, py, pz);
      if (rx || ry || rz) inst.rotation.set(rx, ry, rz);
      if (col) inst.instancedBuffers.color = new Color4(col[0], col[1], col[2], 1);
      inst.isPickable = false;
      if (cast) pool.renderer.addCaster(inst as unknown as Mesh);
      this.parts.push(inst);
      return inst;
    };
    const box = pool.box, glow = pool.glow[team];
    // torso
    P(box, this.body, 0.34, 0.2, 0.22, 0, 0, 0, k.uniform);
    P(box, this.spine, 0.4, 0.5, 0.24, 0, 0.28, 0, k.uniform, true);
    P(box, this.spine, 0.45, 0.33, 0.31, 0, 0.33, 0.005, k.vest);
    P(box, this.spine, 0.3, 0.12, 0.08, 0, 0.2, 0.18, k.pack); // chest pouches
    // head
    P(box, this.head, 0.19, 0.23, 0.2, 0, 0, 0, k.skin, true);
    if (team === 0) {
      // Tidewatch: rounded pale helmet with a brow band, slim radio pack with antenna
      P(pool.sphere, this.head, 0.29, 0.25, 0.31, 0, 0.07, -0.005, k.helmet);
      P(box, this.head, 0.26, 0.03, 0.1, 0, 0.03, 0.13, k.helmet);
      P(glow, this.head, 0.21, 0.028, 0.02, 0, 0.085, 0.152, null);
      P(box, this.spine, 0.28, 0.4, 0.13, 0, 0.33, -0.2, k.pack);
      P(box, this.spine, 0.022, 0.42, 0.022, 0.11, 0.72, -0.22, [0.1, 0.1, 0.12]);
      P(glow, this.spine, 0.2, 0.035, 0.02, 0, 0.46, -0.27, null);
      P(glow, this.spine, 0.03, 0.12, 0.25, 0.228, 0.42, 0, null);
      P(glow, this.spine, 0.03, 0.12, 0.25, -0.228, 0.42, 0, null);
    } else {
      // Ferrous: angular dark helmet with a visor strip, wide salvage pack with side canisters
      P(box, this.head, 0.28, 0.17, 0.31, 0, 0.1, -0.005, k.helmet);
      P(box, this.head, 0.3, 0.05, 0.36, 0, 0.035, 0.0, k.helmet);
      P(glow, this.head, 0.25, 0.04, 0.02, 0, 0.0, 0.105, null);
      P(box, this.spine, 0.44, 0.3, 0.2, 0, 0.3, -0.23, k.pack);
      P(box, this.spine, 0.11, 0.32, 0.11, 0.19, 0.3, -0.34, [0.5, 0.5, 0.48]);
      P(box, this.spine, 0.11, 0.32, 0.11, -0.19, 0.3, -0.34, [0.5, 0.5, 0.48]);
      P(glow, this.spine, 0.3, 0.04, 0.02, 0, 0.41, -0.335, null);
      P(glow, this.spine, 0.08, 0.08, 0.3, 0.236, 0.47, 0, null);
      P(glow, this.spine, 0.08, 0.08, 0.3, -0.236, 0.47, 0, null);
    }
    // arms (fixed shouldered-weapon pose; the spine pitches with the view)
    P(box, this.spine, 0.11, 0.3, 0.11, 0.26, 0.35, 0.07, k.uniform, false, -0.85, 0, 0);
    P(box, this.spine, 0.095, 0.28, 0.095, 0.2, 0.27, 0.27, k.vest, false, -1.45, 0, 0);
    P(box, this.spine, 0.11, 0.3, 0.11, -0.25, 0.36, 0.11, k.uniform, false, -1.05, 0, -0.25);
    P(box, this.spine, 0.095, 0.3, 0.095, -0.13, 0.3, 0.38, k.vest, false, -1.5, 0.55, 0);
    P(box, this.spine, 0.1, 0.1, 0.1, -0.03, 0.31, 0.55, [0.1, 0.1, 0.11]);
    // legs
    for (const side of [1, -1]) {
      const thigh = node('thigh', this.body, 0.1 * side, -0.06, 0);
      P(box, thigh, 0.16, 0.44, 0.18, 0, -0.2, 0, k.uniform, true);
      const shin = node('shin', thigh, 0, -0.42, 0);
      P(box, shin, 0.135, 0.42, 0.15, 0, -0.2, 0, k.uniform, true);
      P(box, shin, 0.145, 0.1, 0.27, 0, -0.4, 0.045, [0.09, 0.09, 0.1]);
      P(box, shin, 0.15, 0.13, 0.17, 0, -0.02, 0.01, k.vest); // knee pad
      this.legs.push({ thigh, shin });
    }
    // weapon (rebuilt when the held weapon changes)
    const g: number[] = [0.11, 0.115, 0.125];
    this.gunParts.push(P(box, this.gun, 0.055, 0.1, 0.34, 0, 0, 0.05, g));
    this.gunParts.push(P(box, this.gun, 0.03, 0.03, 0.3, 0, 0.02, 0.36, [0.07, 0.07, 0.08]));
    this.gunParts.push(P(box, this.gun, 0.045, 0.085, 0.22, 0, -0.02, -0.2, g));
    this.gunParts.push(P(box, this.gun, 0.035, 0.16, 0.06, 0, -0.11, 0.1, [0.07, 0.07, 0.08]));
    this.glintMesh = pool.glint.createInstance('glint');
    this.glintMesh.parent = this.gun;
    this.glintMesh.position.set(0, 0.09, 0.2);
    this.glintMesh.scaling.setAll(0.55);
    this.glintMesh.isVisible = false;
  }

  private setWeapon(idx: number): void {
    this.weapon = idx;
    const m = WEAPONS[idx]?.model;
    if (!m) return;
    const [body, barrel, stock, mag] = this.gunParts;
    const pistol = m.stock === 0;
    body.scaling.set(0.05 * m.bulk, pistol ? 0.06 : 0.1, pistol ? m.len : m.len * 0.55);
    body.position.set(0, pistol ? 0.03 : 0, pistol ? 0.06 : 0.05);
    barrel.scaling.set(0.03, 0.03, Math.max(0.02, m.barrel));
    barrel.position.set(0, 0.02, (pistol ? 0.06 + m.len / 2 : 0.05 + m.len * 0.275) + m.barrel / 2);
    stock.setEnabled(!pistol);
    stock.scaling.set(0.045, 0.085, Math.max(0.02, m.stock));
    stock.position.set(0, -0.02, 0.05 - m.len * 0.275 - m.stock / 2);
    mag.setEnabled(m.mag > 0);
    mag.scaling.set(0.035, Math.max(0.02, m.mag), 0.06);
    mag.position.set(0, -m.mag / 2 - 0.03, pistol ? 0.0 : 0.1);
  }

  setVisible(v: boolean): void {
    if (v === this.visible) return;
    this.visible = v;
    this.root.setEnabled(v);
  }

  update(dt: number, p: CharPose, scopedGlint: boolean): void {
    if (p.weapon !== this.weapon) this.setWeapon(p.weapon);
    this.root.position.set(p.x, p.y, p.z);
    this.root.rotation.y = p.yaw;
    if (!p.alive) {
      if (this.deathT < 0) this.deathT = 0;
      this.deathT += dt;
      const u = Math.min(1, this.deathT / 0.5);
      const e = 1 - (1 - u) * (1 - u);
      this.fall.rotation.x = -1.47 * e;
      this.fall.position.y = 0.12 * e;
      this.fall.position.z = -0.25 * e;
      this.spine.rotation.x = 0.25 * e;
      this.gun.rotation.set(0.9 * e, -0.6 * e, 0);
      this.glintMesh.isVisible = false;
      return;
    }
    if (this.deathT >= 0) { this.deathT = -1; this.fall.rotation.x = 0; this.fall.position.set(0, 0, 0); }
    const sf = Math.min(1, p.speed / 5.2);
    this.phase += dt * (2.2 + p.speed * 1.55);
    const hipT = p.crouch ? 0.6 : 0.92;
    this.hip += (hipT - this.hip) * (1 - Math.exp(-14 * dt));
    this.body.position.y = this.hip + Math.abs(Math.sin(this.phase)) * 0.035 * sf;
    this.sprintBlend += ((p.sprint ? 1 : 0) - this.sprintBlend) * (1 - Math.exp(-10 * dt));
    const sb = this.sprintBlend;
    this.body.rotation.x = 0.12 * sf + 0.2 * sb + (p.crouch ? 0.18 : 0);
    this.spine.rotation.x = -p.pitch * 0.75 * (1 - sb) + (p.crouch ? 0.12 : 0);
    this.head.rotation.x = -p.pitch * 0.25;
    this.gun.rotation.set(0.75 * sb + (p.reload ? 0.5 : 0), -0.7 * sb + (p.reload ? 0.3 : 0), p.reload ? 0.4 : 0);
    const cr = this.hip < 0.8 ? (0.92 - this.hip) / 0.32 : 0;
    for (let i = 0; i < 2; i++) {
      const s = Math.sin(this.phase + (i ? Math.PI : 0));
      const { thigh, shin } = this.legs[i];
      thigh.rotation.x = -s * 0.75 * sf - cr * (i ? 1.25 : 0.75) - this.body.rotation.x;
      shin.rotation.x = Math.max(0, Math.cos(this.phase + (i ? Math.PI : 0))) * 1.0 * sf + cr * (i ? 1.9 : 1.5);
    }
    this.glintMesh.isVisible = scopedGlint;
    if (scopedGlint) this.glintMesh.scaling.setAll(0.45 + Math.sin(this.phase * 3) * 0.08);
  }

  /** World-space muzzle and head positions (for tracers, flashes and name tags). */
  computePoints(): void {
    this.gun.computeWorldMatrix(true);
    const m = this.gun.getWorldMatrix().m;
    const len = 0.6;
    this.muzzle.set(m[12] + m[8] * len, m[13] + m[9] * len, m[14] + m[10] * len);
    const p = this.root.position;
    this.headPos.set(p.x, p.y + this.hip + 0.95, p.z);
  }
}
