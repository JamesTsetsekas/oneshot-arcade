// Original procedural weapon / utility / device models built from primitives
// with vertex colors. Local frame: +Z barrel forward, +Y up, origin at the grip.

import { Color4, Mesh, MeshBuilder, Scene, StandardMaterial, Color3, VertexBuffer } from '@babylonjs/core';
import type { WeaponId } from '../content/weapons';
import type { UtilityId } from '../content/rules';

type Part =
  | { t: 'b'; s: [number, number, number]; p: [number, number, number]; c: string; r?: [number, number, number] }
  | { t: 'c'; d: number; l: number; p: [number, number, number]; c: string; axis?: 'z' | 'y' | 'x'; tess?: number };

const DARK = '#2b2e33';
const MID = '#474c53';
const POLY = '#3a3f37';
const TAN = '#8a7f66';
const STEEL = '#6f757c';
const ACC = '#c33f8f';

const WEAPON_PARTS: Record<WeaponId, Part[]> = {
  tool: [
    { t: 'b', s: [0.035, 0.03, 0.13], p: [0, 0, 0.0], c: DARK },
    { t: 'b', s: [0.012, 0.045, 0.2], p: [0, 0.005, 0.16], c: STEEL },
    { t: 'b', s: [0.05, 0.015, 0.02], p: [0, 0, 0.07], c: ACC },
  ],
  vela: [
    { t: 'b', s: [0.034, 0.04, 0.2], p: [0, 0.06, 0.07], c: MID },
    { t: 'b', s: [0.03, 0.1, 0.05], p: [0, -0.01, 0.0], c: DARK, r: [0.25, 0, 0] },
    { t: 'b', s: [0.028, 0.02, 0.07], p: [0, 0.025, 0.06], c: DARK },
    { t: 'b', s: [0.01, 0.01, 0.01], p: [0, 0.085, 0.16], c: ACC },
  ],
  rook: [
    { t: 'c', d: 0.034, l: 0.24, p: [0, 0.07, 0.17], c: STEEL },
    { t: 'c', d: 0.07, l: 0.06, p: [0, 0.06, 0.05], c: MID, tess: 6 },
    { t: 'b', s: [0.032, 0.05, 0.08], p: [0, 0.06, 0.0], c: MID },
    { t: 'b', s: [0.032, 0.11, 0.05], p: [0, -0.02, -0.02], c: TAN, r: [0.3, 0, 0] },
  ],
  needle: [
    { t: 'b', s: [0.036, 0.05, 0.19], p: [0, 0.06, 0.06], c: DARK },
    { t: 'b', s: [0.03, 0.17, 0.04], p: [0, -0.04, 0.0], c: POLY, r: [0.15, 0, 0] },
    { t: 'c', d: 0.025, l: 0.06, p: [0, 0.06, 0.18], c: STEEL },
    { t: 'b', s: [0.02, 0.012, 0.05], p: [0, 0.092, 0.03], c: ACC },
  ],
  kite: [
    { t: 'b', s: [0.05, 0.07, 0.3], p: [0, 0.06, 0.09], c: POLY },
    { t: 'c', d: 0.03, l: 0.12, p: [0, 0.065, 0.3], c: DARK },
    { t: 'b', s: [0.035, 0.18, 0.045], p: [0, -0.06, 0.12], c: DARK },
    { t: 'b', s: [0.035, 0.1, 0.045], p: [0, -0.02, -0.01], c: DARK, r: [0.25, 0, 0] },
    { t: 'b', s: [0.03, 0.04, 0.18], p: [0, 0.05, -0.14], c: DARK },
    { t: 'b', s: [0.025, 0.025, 0.08], p: [0, 0.11, 0.06], c: MID },
  ],
  vectora: [
    { t: 'b', s: [0.055, 0.1, 0.28], p: [0, 0.05, 0.06], c: DARK },
    { t: 'b', s: [0.045, 0.06, 0.12], p: [0, 0.03, 0.23], c: MID },
    { t: 'b', s: [0.035, 0.16, 0.04], p: [0, -0.07, 0.04], c: POLY, r: [-0.2, 0, 0] },
    { t: 'b', s: [0.03, 0.08, 0.035], p: [0, -0.03, 0.2], c: DARK, r: [0.5, 0, 0] },
    { t: 'b', s: [0.03, 0.03, 0.2], p: [0, 0.06, -0.15], c: MID },
    { t: 'b', s: [0.06, 0.012, 0.06], p: [0, 0.105, 0.1], c: ACC },
  ],
  aster: [
    { t: 'b', s: [0.05, 0.08, 0.32], p: [0, 0.06, 0.08], c: TAN },
    { t: 'b', s: [0.055, 0.065, 0.24], p: [0, 0.06, 0.34], c: POLY },
    { t: 'c', d: 0.022, l: 0.2, p: [0, 0.065, 0.55], c: DARK },
    { t: 'b', s: [0.035, 0.17, 0.06], p: [0, -0.05, 0.13], c: DARK, r: [-0.25, 0, 0] },
    { t: 'b', s: [0.035, 0.1, 0.045], p: [0, -0.02, -0.02], c: DARK, r: [0.3, 0, 0] },
    { t: 'b', s: [0.045, 0.09, 0.24], p: [0, 0.04, -0.2], c: TAN },
    { t: 'b', s: [0.02, 0.03, 0.06], p: [0, 0.12, 0.12], c: DARK },
    { t: 'b', s: [0.02, 0.02, 0.03], p: [0, 0.115, 0.42], c: DARK },
  ],
  krait: [
    { t: 'b', s: [0.06, 0.09, 0.34], p: [0, 0.06, 0.07], c: DARK },
    { t: 'b', s: [0.07, 0.08, 0.28], p: [0, 0.055, 0.38], c: MID },
    { t: 'c', d: 0.028, l: 0.22, p: [0, 0.06, 0.62], c: DARK },
    { t: 'b', s: [0.04, 0.22, 0.06], p: [0, -0.07, 0.15], c: POLY },
    { t: 'b', s: [0.035, 0.1, 0.045], p: [0, -0.02, -0.02], c: DARK, r: [0.3, 0, 0] },
    { t: 'b', s: [0.03, 0.03, 0.26], p: [0, 0.08, -0.21], c: DARK },
    { t: 'b', s: [0.03, 0.09, 0.03], p: [0, 0.03, -0.33], c: DARK },
    { t: 'b', s: [0.075, 0.012, 0.1], p: [0, 0.11, 0.38], c: ACC },
  ],
  lumen: [
    { t: 'b', s: [0.06, 0.11, 0.5], p: [0, 0.05, 0.08], c: '#596057' },
    { t: 'c', d: 0.024, l: 0.16, p: [0, 0.06, 0.4], c: DARK },
    { t: 'b', s: [0.035, 0.1, 0.045], p: [0, -0.04, 0.15], c: DARK, r: [0.25, 0, 0] },
    { t: 'b', s: [0.035, 0.14, 0.055], p: [0, -0.05, -0.04], c: DARK, r: [-0.15, 0, 0] },
    { t: 'b', s: [0.03, 0.05, 0.2], p: [0, 0.14, 0.12], c: DARK },
    { t: 'b', s: [0.04, 0.04, 0.04], p: [0, 0.14, 0.24], c: '#7fe6ff' },
  ],
  longglass: [
    { t: 'b', s: [0.055, 0.08, 0.34], p: [0, 0.05, 0.08], c: '#4f5a49' },
    { t: 'c', d: 0.026, l: 0.6, p: [0, 0.06, 0.52], c: DARK },
    { t: 'c', d: 0.07, l: 0.32, p: [0, 0.15, 0.1], c: DARK },
    { t: 'c', d: 0.08, l: 0.03, p: [0, 0.15, 0.27], c: STEEL },
    { t: 'b', s: [0.035, 0.1, 0.045], p: [0, -0.02, -0.02], c: DARK, r: [0.3, 0, 0] },
    { t: 'b', s: [0.05, 0.12, 0.3], p: [0, 0.03, -0.24], c: '#4f5a49' },
    { t: 'c', d: 0.015, l: 0.06, p: [0.05, 0.08, 0.02], c: STEEL, axis: 'x' },
    { t: 'b', s: [0.035, 0.08, 0.05], p: [0, -0.03, 0.16], c: DARK },
  ],
  sable: [
    { t: 'b', s: [0.055, 0.09, 0.36], p: [0, 0.05, 0.08], c: POLY },
    { t: 'b', s: [0.06, 0.07, 0.26], p: [0, 0.05, 0.37], c: MID },
    { t: 'c', d: 0.024, l: 0.18, p: [0, 0.06, 0.58], c: DARK },
    { t: 'c', d: 0.055, l: 0.22, p: [0, 0.14, 0.1], c: DARK },
    { t: 'b', s: [0.035, 0.12, 0.07], p: [0, -0.04, 0.14], c: DARK },
    { t: 'b', s: [0.035, 0.1, 0.045], p: [0, -0.02, -0.02], c: DARK, r: [0.3, 0, 0] },
    { t: 'b', s: [0.045, 0.1, 0.22], p: [0, 0.03, -0.2], c: POLY },
  ],
  rampart: [
    { t: 'b', s: [0.055, 0.08, 0.26], p: [0, 0.05, 0.06], c: DARK },
    { t: 'c', d: 0.034, l: 0.5, p: [0, 0.075, 0.42], c: STEEL },
    { t: 'c', d: 0.03, l: 0.4, p: [0, 0.035, 0.36], c: DARK },
    { t: 'b', s: [0.06, 0.05, 0.14], p: [0, 0.035, 0.34], c: TAN },
    { t: 'b', s: [0.035, 0.1, 0.045], p: [0, -0.02, -0.02], c: DARK, r: [0.3, 0, 0] },
    { t: 'b', s: [0.05, 0.1, 0.26], p: [0, 0.02, -0.2], c: TAN },
  ],
  atlas: [
    { t: 'b', s: [0.08, 0.11, 0.42], p: [0, 0.06, 0.1], c: DARK },
    { t: 'c', d: 0.04, l: 0.4, p: [0, 0.07, 0.5], c: MID },
    { t: 'b', s: [0.12, 0.14, 0.14], p: [0.03, -0.05, 0.12], c: POLY },
    { t: 'b', s: [0.035, 0.1, 0.045], p: [0, -0.02, -0.02], c: DARK, r: [0.3, 0, 0] },
    { t: 'b', s: [0.05, 0.1, 0.26], p: [0, 0.03, -0.22], c: DARK },
    { t: 'b', s: [0.015, 0.2, 0.015], p: [0.04, -0.04, 0.6], c: STEEL, r: [0.5, 0, 0.2] },
    { t: 'b', s: [0.015, 0.2, 0.015], p: [-0.04, -0.04, 0.6], c: STEEL, r: [0.5, 0, -0.2] },
    { t: 'b', s: [0.03, 0.05, 0.12], p: [0, 0.15, 0.12], c: MID },
  ],
};

const UTIL_COLORS: Record<UtilityId, string> = { veil: '#c7ced6', flash: '#e8e2ff', thermite: '#ff7a2a', pulse: '#4ff0ff', frag: '#6c7a3a' };

function buildParts(scene: Scene, name: string, parts: Part[], scale = 1): Mesh {
  const meshes: Mesh[] = [];
  for (const pt of parts) {
    let m: Mesh;
    if (pt.t === 'b') {
      m = MeshBuilder.CreateBox(name, { width: pt.s[0] * scale, height: pt.s[1] * scale, depth: pt.s[2] * scale }, scene);
      if (pt.r) m.rotation.set(pt.r[0], pt.r[1], pt.r[2]);
    } else {
      m = MeshBuilder.CreateCylinder(name, { diameter: pt.d * scale, height: pt.l * scale, tessellation: pt.tess ?? 12 }, scene);
      const axis = pt.axis ?? 'z';
      if (axis === 'z') m.rotation.x = Math.PI / 2;
      else if (axis === 'x') m.rotation.z = Math.PI / 2;
    }
    m.position.set(pt.p[0] * scale, pt.p[1] * scale, pt.p[2] * scale);
    const c = Color3.FromHexString(pt.c);
    const n = m.getTotalVertices();
    const cols: number[] = [];
    for (let i = 0; i < n; i++) cols.push(c.r, c.g, c.b, 1);
    m.setVerticesData(VertexBuffer.ColorKind, cols);
    meshes.push(m);
  }
  const merged = Mesh.MergeMeshes(meshes, true, true)!;
  merged.name = name;
  return merged;
}

export class ModelLibrary {
  readonly scene: Scene;
  readonly mat: StandardMaterial;
  readonly glowMat: StandardMaterial;
  private weapons = new Map<string, Mesh>();

  constructor(scene: Scene) {
    this.scene = scene;
    this.mat = new StandardMaterial('m-vcol', scene);
    this.mat.diffuseColor = Color3.White();
    this.mat.specularColor = new Color3(0.12, 0.12, 0.12);
    this.mat.specularPower = 24;
    this.glowMat = new StandardMaterial('m-vglow', scene);
    this.glowMat.disableLighting = true;
    this.glowMat.emissiveColor = Color3.White();
  }

  /** Source mesh (hidden) for a weapon / utility / device id. */
  source(id: WeaponId | UtilityId | 'spike' | 'kit'): Mesh {
    let m = this.weapons.get(id);
    if (m) return m;
    if (id in WEAPON_PARTS) m = buildParts(this.scene, 'w-' + id, WEAPON_PARTS[id as WeaponId]);
    else if (id === 'spike') m = this.spikeMesh();
    else if (id === 'kit') m = buildParts(this.scene, 'kit', [{ t: 'b', s: [0.12, 0.05, 0.18], p: [0, 0, 0], c: '#2c6c7a' }]);
    else m = this.utilMesh(id as UtilityId);
    m.material = this.mat;
    m.hasVertexAlpha = false;
    m.isVisible = false;
    m.isPickable = false;
    this.weapons.set(id, m);
    return m;
  }

  private utilMesh(id: UtilityId): Mesh {
    const c = UTIL_COLORS[id];
    const parts: Part[] =
      id === 'pulse'
        ? [{ t: 'c', d: 0.06, l: 0.12, p: [0, 0.03, 0], c, axis: 'y', tess: 6 }, { t: 'c', d: 0.03, l: 0.05, p: [0, 0.11, 0], c: DARK, axis: 'y', tess: 6 }]
        : id === 'thermite'
          ? [{ t: 'c', d: 0.05, l: 0.13, p: [0, 0.04, 0], c, axis: 'y' }, { t: 'c', d: 0.03, l: 0.04, p: [0, 0.12, 0], c: DARK, axis: 'y' }]
          : id === 'frag'
            ? [{ t: 'c', d: 0.075, l: 0.09, p: [0, 0.03, 0], c, axis: 'y', tess: 10 }, { t: 'b', s: [0.02, 0.03, 0.05], p: [0, 0.09, 0.0], c: STEEL }]
            : [{ t: 'c', d: 0.06, l: 0.14, p: [0, 0.05, 0], c, axis: 'y' }, { t: 'b', s: [0.02, 0.03, 0.05], p: [0, 0.13, 0.0], c: STEEL }, { t: 'c', d: 0.062, l: 0.02, p: [0, 0.07, 0], c: ACC, axis: 'y' }];
    return buildParts(this.scene, 'u-' + id, parts);
  }

  private spikeMesh(): Mesh {
    return buildParts(this.scene, 'spike', [
      { t: 'b', s: [0.22, 0.12, 0.3], p: [0, 0.06, 0], c: '#2a2d33' },
      { t: 'b', s: [0.16, 0.02, 0.22], p: [0, 0.125, 0], c: '#c22d8a' },
      { t: 'c', d: 0.05, l: 0.36, p: [0.06, 0.25, -0.08], c: STEEL, axis: 'y' },
      { t: 'b', s: [0.08, 0.04, 0.06], p: [-0.05, 0.15, 0.08], c: '#e6e6e6' },
    ]);
  }

  /** Independent mesh copy (viewmodel). */
  clone(id: WeaponId | UtilityId | 'spike', name: string): Mesh {
    const m = this.source(id).clone(name)!;
    m.isVisible = true;
    return m;
  }

  instance(id: WeaponId | UtilityId | 'spike' | 'kit', name: string) {
    const inst = this.source(id).createInstance(name);
    inst.isPickable = false;
    return inst;
  }

  static vertexColor(c: string): Color4 {
    const k = Color3.FromHexString(c);
    return new Color4(k.r, k.g, k.b, 1);
  }
}

/** Muzzle offset in model space for flashes/tracers. */
export const MUZZLE_Z: Partial<Record<WeaponId, number>> = {
  vela: 0.18, rook: 0.3, needle: 0.22, kite: 0.37, vectora: 0.3, aster: 0.66, krait: 0.74, lumen: 0.5, longglass: 0.83, sable: 0.68, rampart: 0.68, atlas: 0.71,
};
