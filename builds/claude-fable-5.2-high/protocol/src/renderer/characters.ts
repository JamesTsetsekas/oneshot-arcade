// Third-person character rigs built from boxes: two factions with distinct silhouettes
// (Intrusion: angular hood + pack, amber IFF; Custodian: crested helmet + shoulder plates, cyan IFF).
// Pose is driven only by position, yaw/pitch, crouch fraction and speed, mirroring the server hit volumes.
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Side } from '../protocol/types';
import type { RenderCore } from './core';
import { Geom, type RGB } from './geom';
import { buildModel } from './models';

const SKIN: RGB = [0.16, 0.16, 0.18];

interface Palette {
  a: RGB;
  b: RGB;
  c: RGB;
}
const PAL: Record<Side, Palette> = {
  atk: { a: [0.3, 0.24, 0.2], b: [0.5, 0.4, 0.3], c: [0.17, 0.15, 0.14] },
  def: { a: [0.25, 0.3, 0.38], b: [0.58, 0.62, 0.68], c: [0.14, 0.17, 0.22] },
};

export class CharacterModel {
  root: TransformNode;
  private hips: TransformNode;
  private upper: TransformNode;
  private head: TransformNode;
  private legL: Mesh;
  private legR: Mesh;
  private hand: TransformNode;
  private weapon: Mesh | null = null;
  private item = '';
  private phase = 0;
  private meshes: Mesh[] = [];
  dead = false;
  private deadT = 0;
  visible = false;
  x = 0;
  y = 0;
  z = 0;
  headY = 1.7;

  constructor(
    private core: RenderCore,
    public side: Side,
  ) {
    const scene = core.scene;
    const p = PAL[side];
    const accentMat = side === 'atk' ? core.accentAtk : core.accentDef;
    this.root = new TransformNode('char', scene);
    this.hips = new TransformNode('hips', scene);
    this.hips.parent = this.root;
    this.upper = new TransformNode('upper', scene);
    this.upper.parent = this.hips;
    this.upper.position.y = 0.9;
    this.head = new TransformNode('head', scene);
    this.head.parent = this.upper;
    this.head.position.y = 0.57;
    this.hand = new TransformNode('hand', scene);
    this.hand.parent = this.upper;
    this.hand.position.set(0.12, 0.36, 0.3);

    const mk = (g: Geom, parent: TransformNode, accent = false): Mesh => {
      const m = g.build('c', scene, accent ? accentMat : core.lit);
      if (accent) m.useVertexColors = false;
      m.parent = parent;
      this.meshes.push(m);
      return m;
    };
    // legs (pivot at the hip)
    const leg = (sx: number): Mesh => {
      const g = new Geom();
      g.box(0, -0.24, 0, 0.16, 0.44, 0.19, p.a);
      g.box(0, -0.62, -0.01, 0.14, 0.36, 0.16, p.c);
      g.box(0, -0.81, 0.04, 0.15, 0.1, 0.27, SKIN);
      if (side === 'def') g.box(0, -0.45, 0.07, 0.15, 0.13, 0.06, p.b);
      else g.box(sx * 0.085, -0.22, 0, 0.03, 0.2, 0.14, p.b);
      const m = mk(g, this.hips);
      m.position.set(sx * 0.1, 0.86, 0);
      return m;
    };
    this.legL = leg(-1);
    this.legR = leg(1);
    // torso + arms
    const t = new Geom();
    t.box(0, 0.24, 0, 0.4, 0.56, 0.24, p.a);
    t.box(0, -0.04, 0, 0.38, 0.1, 0.25, p.c);
    if (side === 'atk') {
      t.box(0, 0.3, 0.01, 0.42, 0.34, 0.27, p.b);
      t.box(0, 0.3, -0.2, 0.3, 0.4, 0.15, p.c);
      t.box(0, 0.52, -0.2, 0.24, 0.08, 0.13, p.b);
      t.box(0.25, 0.44, 0, 0.11, 0.14, 0.2, p.a);
      t.box(-0.25, 0.44, 0, 0.11, 0.14, 0.2, p.a);
      t.box(0, 0.5, 0.0, 0.3, 0.1, 0.3, p.c, [0.25, 0, 0]);
    } else {
      t.box(0, 0.3, 0.01, 0.45, 0.38, 0.29, p.b);
      t.box(0, 0.12, 0.13, 0.3, 0.14, 0.07, p.a);
      t.box(0.28, 0.47, 0, 0.17, 0.11, 0.28, p.b, [0, 0, -0.25]);
      t.box(-0.28, 0.47, 0, 0.17, 0.11, 0.28, p.b, [0, 0, 0.25]);
      t.box(0, 0.5, -0.13, 0.22, 0.14, 0.08, p.c);
    }
    // arms reaching for the weapon
    t.box(0.2, 0.38, 0.15, 0.1, 0.1, 0.36, p.a, [0.1, -0.42, 0]);
    t.box(0.13, 0.35, 0.3, 0.085, 0.085, 0.1, SKIN);
    t.box(-0.15, 0.37, 0.24, 0.1, 0.1, 0.5, p.a, [0.1, 0.5, 0]);
    t.box(-0.02, 0.35, 0.47, 0.085, 0.085, 0.1, SKIN);
    mk(t, this.upper);
    const ta = new Geom();
    if (side === 'atk') {
      ta.box(0, 0.36, 0.148, 0.2, 0.05, 0.01, [1, 1, 1], undefined, false);
      ta.box(0.305, 0.44, 0, 0.012, 0.09, 0.14, [1, 1, 1], undefined, false);
      ta.box(-0.305, 0.44, 0, 0.012, 0.09, 0.14, [1, 1, 1], undefined, false);
      ta.box(0, 0.36, -0.278, 0.16, 0.05, 0.01, [1, 1, 1], undefined, false);
    } else {
      ta.box(0, 0.4, 0.158, 0.06, 0.2, 0.01, [1, 1, 1], undefined, false);
      ta.box(0.3, 0.535, 0, 0.14, 0.012, 0.2, [1, 1, 1], undefined, false);
      ta.box(-0.3, 0.535, 0, 0.14, 0.012, 0.2, [1, 1, 1], undefined, false);
      ta.box(0, 0.4, -0.175, 0.06, 0.2, 0.01, [1, 1, 1], undefined, false);
    }
    mk(ta, this.upper, true);
    // head
    const h = new Geom();
    const ha = new Geom();
    h.box(0, 0.12, 0.0, 0.17, 0.2, 0.19, SKIN);
    h.box(0, 0.0, 0, 0.1, 0.06, 0.1, SKIN);
    if (side === 'atk') {
      h.box(0, 0.2, -0.01, 0.23, 0.11, 0.26, p.a);
      h.box(0, 0.13, -0.09, 0.22, 0.2, 0.1, p.a);
      h.box(0.11, 0.12, -0.01, 0.03, 0.18, 0.2, p.c);
      h.box(-0.11, 0.12, -0.01, 0.03, 0.18, 0.2, p.c);
      h.box(0, 0.24, 0.08, 0.2, 0.05, 0.14, p.c, [0.35, 0, 0]);
      ha.box(0, 0.13, 0.098, 0.15, 0.035, 0.01, [1, 1, 1], undefined, false);
    } else {
      h.cyl(0, 0.17, 0, 0.135, 0.16, 'y', p.b, 8);
      h.cyl(0, 0.265, 0, 0.1, 0.04, 'y', p.b, 8);
      h.box(0, 0.27, -0.01, 0.035, 0.07, 0.25, p.a);
      h.box(0.135, 0.12, 0, 0.04, 0.09, 0.09, p.c);
      h.box(-0.135, 0.12, 0, 0.04, 0.09, 0.09, p.c);
      h.box(0, 0.05, 0.07, 0.15, 0.06, 0.08, p.c);
      ha.box(0, 0.135, 0.103, 0.13, 0.05, 0.01, [1, 1, 1], undefined, false);
      ha.box(0, 0.3, -0.01, 0.012, 0.012, 0.22, [1, 1, 1], undefined, false);
    }
    mk(h, this.head);
    mk(ha, this.head, true);
    this.setVisible(false);
  }

  setVisible(v: boolean): void {
    if (this.visible === v) return;
    this.visible = v;
    this.root.setEnabled(v);
  }

  private setItem(item: string): void {
    if (item === this.item) return;
    this.item = item;
    if (this.weapon) {
      this.weapon.dispose();
      this.weapon = null;
    }
    const g = new Geom();
    buildModel(item, g);
    this.weapon = g.build('w', this.core.scene, this.core.lit);
    this.weapon.parent = this.hand;
  }

  update(x: number, y: number, z: number, yaw: number, pitch: number, crouch: number, speed: number, item: string, dt: number): void {
    if (this.dead) return;
    this.setVisible(true);
    this.setItem(item);
    this.x = x;
    this.y = y;
    this.z = z;
    this.root.position.set(x, y, z);
    this.root.rotation.set(0, yaw, 0);
    const sp = Math.min(1, speed / 4.5);
    this.phase += dt * (3 + speed * 2.1);
    const sw = Math.sin(this.phase) * 0.62 * sp;
    const lean = -crouch * 1.0;
    const ls = 1 - 0.3 * crouch;
    this.legL.rotation.x = sw + lean;
    this.legR.rotation.x = -sw + lean;
    this.legL.scaling.y = ls;
    this.legR.scaling.y = ls;
    this.hips.position.y = -0.47 * crouch + Math.abs(Math.sin(this.phase)) * 0.035 * sp;
    this.upper.rotation.x = -pitch * 0.55 + crouch * 0.18;
    this.head.rotation.x = -pitch * 0.4;
    this.headY = y + 1.78 - 0.5 * crouch;
  }

  /** Falls along the direction of the killing shot and stays down until the next round. */
  die(dx: number, dz: number): void {
    if (this.dead) return;
    this.dead = true;
    this.deadT = 0;
    this.setVisible(true);
    this.root.rotation.set(0, Math.atan2(dx, dz), 0);
    if (this.weapon) this.weapon.setEnabled(false);
  }

  tick(dt: number): void {
    if (!this.dead || this.deadT >= 1) return;
    this.deadT = Math.min(1, this.deadT + dt * 2.2);
    const e = 1 - (1 - this.deadT) ** 2;
    this.root.rotation.x = e * 1.5;
    this.root.position.y = this.y + e * 0.14;
    this.upper.rotation.x = e * 0.2;
  }

  reset(): void {
    this.dead = false;
    this.root.rotation.x = 0;
    this.upper.rotation.x = 0;
    if (this.weapon) this.weapon.setEnabled(true);
    this.setVisible(false);
  }

  dispose(): void {
    for (const m of this.meshes) m.dispose();
    if (this.weapon) this.weapon.dispose();
    this.root.dispose();
  }
}
