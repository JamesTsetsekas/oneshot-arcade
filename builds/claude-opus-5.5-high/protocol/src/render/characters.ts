// Third-person operatives: two team silhouettes (Intrusion: angular hood-helmet
// + backpack; Custodian: rounded helmet + shoulder plates) with emissive IFF.
// Pose derives from the authoritative snapshot (position, yaw, pitch, crouch).

import { Color3, Mesh, MeshBuilder, Scene, StandardMaterial, TransformNode, type InstancedMesh } from '@babylonjs/core';
import type { SnapPlayer, Side } from '../protocol/messages';
import type { ModelLibrary } from './models';
import { crouchScale } from '../sim/combat';

interface Masters {
  suit: Mesh;
  vest: Mesh;
  leg: Mesh;
  arm: Mesh;
  head: Mesh;
  helmet: Mesh;
  visor: Mesh;
  iff: Mesh;
  pack: Mesh;
  glove: Mesh;
}

function mat(scene: Scene, name: string, hex: string, emissive = false): StandardMaterial {
  const m = new StandardMaterial(name, scene);
  if (emissive) {
    m.emissiveColor = Color3.FromHexString(hex);
    m.disableLighting = true;
  } else {
    m.diffuseColor = Color3.FromHexString(hex);
    m.specularColor = new Color3(0.08, 0.08, 0.08);
  }
  return m;
}

export class CharacterFactory {
  private masters: Record<Side, Masters>;
  readonly scene: Scene;
  readonly lib: ModelLibrary;
  iffMats: Record<Side, StandardMaterial>;

  constructor(scene: Scene, lib: ModelLibrary, iff: { intrusion: string; custodian: string }) {
    this.scene = scene;
    this.lib = lib;
    const mk = (side: Side): Masters => {
      const intr = side === 'intrusion';
      const suit = mat(scene, 'suit-' + side, intr ? '#4a4b3c' : '#34465c');
      const vestM = mat(scene, 'vest-' + side, intr ? '#6b5f43' : '#1f2a38');
      const helmM = mat(scene, 'helm-' + side, intr ? '#3b3a33' : '#d9dee3');
      const skin = mat(scene, 'skin-' + side, intr ? '#8f6e57' : '#c69d7e');
      const visor = mat(scene, 'visor-' + side, intr ? '#1a1a1a' : '#163042');
      const glove = mat(scene, 'glove-' + side, '#222326');
      const iffM = mat(scene, 'iff-' + side, intr ? iff.intrusion : iff.custodian, true);
      const hide = (m: Mesh) => {
        m.isVisible = false;
        m.isPickable = false;
        return m;
      };
      const box = (n: string, w: number, h: number, d: number, m: StandardMaterial) => {
        const b = MeshBuilder.CreateBox(n, { width: w, height: h, depth: d }, scene);
        b.material = m;
        return hide(b);
      };
      const helmet = intr
        ? (() => {
            const b = MeshBuilder.CreateBox('helm-i', { width: 0.3, height: 0.2, depth: 0.32 }, scene);
            b.material = helmM;
            // angular crest
            return hide(b);
          })()
        : (() => {
            const s = MeshBuilder.CreateSphere('helm-c', { diameterX: 0.32, diameterY: 0.24, diameterZ: 0.34, segments: 10, slice: 0.55 }, scene);
            s.material = helmM;
            return hide(s);
          })();
      return {
        suit: box('suit', 0.42, 0.52, 0.26, suit),
        vest: box('vest', 0.46, 0.36, 0.3, vestM),
        leg: box('leg', 0.17, 0.88, 0.2, suit),
        arm: box('arm', 0.11, 0.42, 0.12, suit),
        head: hide(Object.assign(MeshBuilder.CreateSphere('head', { diameter: 0.23, segments: 8 }, scene), { material: skin })),
        helmet,
        visor: box('visor', 0.24, 0.06, 0.05, visor),
        iff: box('iff', 0.47, 0.04, 0.31, iffM),
        pack: intr ? box('pack', 0.34, 0.4, 0.16, vestM) : box('pauldron', 0.16, 0.07, 0.2, helmM),
        glove: box('glove', 0.1, 0.1, 0.1, glove),
      };
    };
    this.masters = { intrusion: mk('intrusion'), custodian: mk('custodian') };
    this.iffMats = {
      intrusion: scene.getMaterialByName('iff-intrusion') as StandardMaterial,
      custodian: scene.getMaterialByName('iff-custodian') as StandardMaterial,
    };
  }

  setIff(iff: { intrusion: string; custodian: string }): void {
    this.iffMats.intrusion.emissiveColor = Color3.FromHexString(iff.intrusion);
    this.iffMats.custodian.emissiveColor = Color3.FromHexString(iff.custodian);
  }

  create(id: number, side: Side): CharacterView {
    return new CharacterView(this, id, side, this.masters[side]);
  }
}

export class CharacterView {
  readonly root: TransformNode;
  readonly side: Side;
  private hips: TransformNode;
  private torso: TransformNode;
  private headN: TransformNode;
  private armsN: TransformNode;
  private legL: TransformNode;
  private legR: TransformNode;
  private weaponNode: TransformNode;
  private weapon: InstancedMesh | null = null;
  private weaponId = '';
  private parts: InstancedMesh[] = [];
  private phase = 0;
  private deathT = 0;
  private factory: CharacterFactory;
  shadowParts: InstancedMesh[] = [];
  private kick = 0;

  constructor(f: CharacterFactory, id: number, side: Side, m: Masters) {
    this.factory = f;
    this.side = side;
    const s = f.scene;
    const inst = (src: Mesh, parent: TransformNode, x: number, y: number, z: number) => {
      const i = src.createInstance(`c${id}-${src.name}`);
      i.parent = parent;
      i.position.set(x, y, z);
      i.isPickable = false;
      this.parts.push(i);
      return i;
    };
    this.root = new TransformNode('char' + id, s);
    this.hips = new TransformNode('hips', s);
    this.hips.parent = this.root;
    this.hips.position.y = 0.92;
    this.legL = new TransformNode('legL', s);
    this.legL.parent = this.hips;
    this.legL.position.x = -0.11;
    this.legR = new TransformNode('legR', s);
    this.legR.parent = this.hips;
    this.legR.position.x = 0.11;
    inst(m.leg, this.legL, 0, -0.44, 0);
    inst(m.leg, this.legR, 0, -0.44, 0);
    this.torso = new TransformNode('torso', s);
    this.torso.parent = this.hips;
    inst(m.suit, this.torso, 0, 0.3, 0);
    inst(m.vest, this.torso, 0, 0.38, 0.01);
    inst(m.iff, this.torso, 0, 0.47, 0.0);
    inst(m.iff, this.torso, 0, 0.12, 0.0).scaling.set(0.95, 0.8, 0.95);
    if (side === 'intrusion') inst(m.pack, this.torso, 0, 0.36, -0.22);
    else {
      inst(m.pack, this.torso, -0.25, 0.55, 0);
      inst(m.pack, this.torso, 0.25, 0.55, 0);
    }
    this.headN = new TransformNode('head', s);
    this.headN.parent = this.torso;
    this.headN.position.y = 0.71;
    inst(m.head, this.headN, 0, 0, 0.01);
    const helm = inst(m.helmet, this.headN, 0, side === 'intrusion' ? 0.07 : 0.05, -0.01);
    if (side === 'intrusion') helm.rotation.x = -0.12;
    inst(m.visor, this.headN, 0, 0.02, 0.13);
    const band = inst(m.iff, this.headN, 0, 0.0, 0);
    band.scaling.set(0.68, 0.7, 1.1);
    band.position.y = side === 'intrusion' ? 0.03 : 0.08;
    this.armsN = new TransformNode('arms', s);
    this.armsN.parent = this.torso;
    this.armsN.position.set(0, 0.52, 0.02);
    const armL = inst(m.arm, this.armsN, -0.2, -0.12, 0.17);
    armL.rotation.set(-1.25, 0.5, 0);
    const armR = inst(m.arm, this.armsN, 0.2, -0.12, 0.12);
    armR.rotation.set(-1.15, -0.3, 0);
    inst(m.glove, this.armsN, 0.1, -0.15, 0.33);
    inst(m.glove, this.armsN, -0.04, -0.12, 0.46);
    this.weaponNode = new TransformNode('wpn', s);
    this.weaponNode.parent = this.armsN;
    this.weaponNode.position.set(0.06, -0.16, 0.3);
    this.shadowParts = this.parts;
  }

  setWeapon(id: string): void {
    if (id === this.weaponId) return;
    this.weaponId = id;
    this.weapon?.dispose();
    this.weapon = null;
    if (id === 'none' || id === '') return;
    const w = this.factory.lib.instance(id as never, 'tw');
    w.parent = this.weaponNode;
    w.scaling.setAll(1.1);
    this.weapon = w;
  }

  fireKick(): void {
    this.kick = 1;
  }

  setVisible(v: boolean): void {
    this.root.setEnabled(v);
  }

  update(sp: SnapPlayer, dt: number): void {
    this.root.position.set(sp.x, sp.y, sp.z);
    this.root.rotation.y = sp.yaw;
    const sc = crouchScale(sp.crouch);
    const speed = Math.hypot(sp.vx, sp.vz);
    // locomotion: forward/back relative to facing drives the swing
    this.phase += speed * dt * 2.6;
    const amp = Math.min(0.55, speed * 0.12) * (sp.onGround ? 1 : 0.2);
    const sw = Math.sin(this.phase) * amp;
    const crouchBend = sp.crouch;
    this.hips.position.y = 0.92 * (1 - 0.32 * crouchBend) + Math.abs(Math.cos(this.phase)) * amp * 0.04;
    this.legL.rotation.x = sw - crouchBend * 0.9;
    this.legR.rotation.x = -sw - crouchBend * 0.9;
    this.legL.scaling.y = 1 - crouchBend * 0.1;
    this.legR.scaling.y = 1 - crouchBend * 0.1;
    this.torso.rotation.x = crouchBend * 0.18 + (sp.arming || sp.defusing ? 0.45 : 0);
    this.kick = Math.max(0, this.kick - dt * 12);
    this.armsN.rotation.x = sp.pitch * 0.85 - this.kick * 0.08 + (sp.reloading ? 0.5 : 0) + (sp.arming || sp.defusing ? 0.6 : 0);
    this.headN.rotation.x = sp.pitch * 0.5;
    void sc;
    this.setWeapon(sp.hand === 'none' ? '' : sp.hand);
    if (!sp.alive) {
      this.deathT = Math.min(1, this.deathT + dt * 2.6);
      const e = 1 - Math.pow(1 - this.deathT, 3);
      this.root.rotation.x = -e * 1.45;
      this.root.position.y = sp.y + 0.1 * e;
      this.legL.rotation.x = 0.2 * e;
      this.legR.rotation.x = -0.15 * e;
    } else {
      this.deathT = 0;
      this.root.rotation.x = 0;
    }
  }

  dispose(): void {
    this.weapon?.dispose();
    this.root.dispose();
  }
}
