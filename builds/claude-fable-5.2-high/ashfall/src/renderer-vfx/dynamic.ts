import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import '@babylonjs/core/Meshes/instancedMesh';
import type { InstancedMesh } from '@babylonjs/core/Meshes/instancedMesh';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { TAU, angDiff, clamp, lerp } from '../core/math';
import { DTYPE_COLOR, type Actor, type Area, type Ev, type Interactable, type Zone } from '../entity-combat/types';
import type { Session } from '../game-session/session';
import { MOD } from '../navigation-ai/enemies';
import { buildStatic, getModel, p, type ModelSrc, type Part } from './models';
import type { LightSrc, Renderer } from './renderer';

const C = (hex: string) => Color3.FromHexString(hex);
const GOLD = '#ffcf6b', TEAL = '#4fe6cf', CYAN = '#7fe8ff', EMBER = '#ff7a2a', BRASS = '#a07a34', STONE = '#4c4842';
const MOD_COLOR: Record<string, string> = { ember_wake: '#ff7a2a', mirror_shell: '#d8e8ff', rallying: '#ffd36b', frost_pulse: '#9fd8ff', burrowing: '#b08a5a', vampiric_bond: '#ff3a5a' };

/** Additive billboard particles drawn as one thin-instanced quad (fixed camera → shared billboard rotation). */
class Particles {
  mesh: Mesh; n = 0; max: number; m: Float32Array; c: Float32Array; d: Float32Array; // d: x,y,z,vx,vy,vz,life,max,size,r,g,b,grav,drag
  constructor(r: Renderer, max: number) {
    this.max = max; this.m = new Float32Array(max * 16); this.c = new Float32Array(max * 4); this.d = new Float32Array(max * 14);
    const scene = r.scene;
    const tex = new DynamicTexture('ptex', { width: 64, height: 64 }, scene, false);
    const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64); tex.update(); tex.hasAlpha = true;
    const mat = new StandardMaterial('pmat', scene);
    mat.disableLighting = true; mat.emissiveColor = Color3.White(); mat.diffuseTexture = tex; mat.useAlphaFromDiffuseTexture = true;
    mat.alphaMode = 1; mat.disableDepthWrite = true; mat.backFaceCulling = false; mat.fogEnabled = false;
    this.mesh = CreatePlane('particles', { size: 1 }, scene);
    this.mesh.material = mat; this.mesh.isPickable = false; this.mesh.alwaysSelectAsActiveMesh = true;
    this.mesh.thinInstanceSetBuffer('matrix', this.m, 16, false);
    this.mesh.thinInstanceSetBuffer('color', this.c, 4, false);
    this.mesh.thinInstanceCount = 0;
  }
  emit(x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number, size: number, col: Color3, grav = 0, drag = 1.5): void {
    if (this.n >= this.max) return;
    const o = this.n++ * 14, d = this.d;
    d[o] = x; d[o + 1] = y; d[o + 2] = z; d[o + 3] = vx; d[o + 4] = vy; d[o + 5] = vz; d[o + 6] = life; d[o + 7] = life; d[o + 8] = size;
    d[o + 9] = col.r; d[o + 10] = col.g; d[o + 11] = col.b; d[o + 12] = grav; d[o + 13] = drag;
  }
  burst(x: number, y: number, z: number, n: number, speed: number, life: number, size: number, hex: string, up = 0.5, grav = -4): void {
    const col = C(hex);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = speed * (0.35 + Math.random() * 0.65), e = (Math.random() - 0.2) * up;
      this.emit(x, y, z, Math.cos(a) * s, speed * e + Math.random() * up * 2, Math.sin(a) * s, life * (0.5 + Math.random() * 0.5), size * (0.6 + Math.random() * 0.8), col, grav);
    }
  }
  update(dt: number, rot: Float32Array | number[]): void {
    const d = this.d, m = this.m, c = this.c;
    let i = 0;
    while (i < this.n) {
      const o = i * 14;
      d[o + 6] -= dt;
      if (d[o + 6] <= 0) { this.n--; d.copyWithin(o, this.n * 14, this.n * 14 + 14); continue; }
      const dr = Math.max(0, 1 - d[o + 13] * dt);
      d[o + 3] *= dr; d[o + 5] *= dr; d[o + 4] = d[o + 4] * dr + d[o + 12] * dt;
      d[o] += d[o + 3] * dt; d[o + 1] += d[o + 4] * dt; d[o + 2] += d[o + 5] * dt;
      if (d[o + 1] < 0.03) { d[o + 1] = 0.03; d[o + 4] *= -0.3; }
      const k = d[o + 6] / d[o + 7], s = d[o + 8] * (0.4 + 0.6 * k), mo = i * 16, f = Math.min(1, k * 2.2);
      m[mo] = rot[0] * s; m[mo + 1] = rot[1] * s; m[mo + 2] = rot[2] * s; m[mo + 3] = 0;
      m[mo + 4] = rot[4] * s; m[mo + 5] = rot[5] * s; m[mo + 6] = rot[6] * s; m[mo + 7] = 0;
      m[mo + 8] = rot[8] * s; m[mo + 9] = rot[9] * s; m[mo + 10] = rot[10] * s; m[mo + 11] = 0;
      m[mo + 12] = d[o]; m[mo + 13] = d[o + 1]; m[mo + 14] = d[o + 2]; m[mo + 15] = 1;
      c[i * 4] = d[o + 9] * f; c[i * 4 + 1] = d[o + 10] * f; c[i * 4 + 2] = d[o + 11] * f; c[i * 4 + 3] = 1;
      i++;
    }
    this.mesh.thinInstanceCount = this.n;
    this.mesh.thinInstanceBufferUpdated('matrix'); this.mesh.thinInstanceBufferUpdated('color');
  }
}
function flatMesh(scene: Renderer['scene'], pos: number[], idx: number[]): Mesh {
  const m = new Mesh('decal', scene), vd = new VertexData();
  vd.positions = pos; vd.indices = idx; vd.normals = pos.map((_, i) => (i % 3 === 1 ? 1 : 0));
  vd.applyToMesh(m); m.isPickable = false;
  return m;
}
/** Ring sector in the XZ plane spanning [-angle/2, angle/2] between radii r0..r1 (sim angle convention). */
function sector(scene: Renderer['scene'], angle: number, r0: number, r1: number): Mesh {
  const seg = Math.max(6, Math.ceil(angle * 9)), pos: number[] = [], idx: number[] = [];
  for (let i = 0; i <= seg; i++) { const a = -angle / 2 + (angle * i) / seg; pos.push(Math.cos(a) * r0, 0, Math.sin(a) * r0, Math.cos(a) * r1, 0, Math.sin(a) * r1); }
  for (let i = 0; i < seg; i++) { const k = i * 2; idx.push(k, k + 1, k + 3, k, k + 3, k + 2); }
  if (angle < TAU - 0.01 && r0 > 0) for (const a of [-angle / 2, angle / 2]) {
    const b = pos.length / 3, w = 0.035, nx = -Math.sin(a) * w, nz = Math.cos(a) * w;
    pos.push(0 - nx, 0, 0 - nz, 0 + nx, 0, 0 + nz, Math.cos(a) * r1 - nx, 0, Math.sin(a) * r1 - nz, Math.cos(a) * r1 + nx, 0, Math.sin(a) * r1 + nz);
    idx.push(b, b + 1, b + 3, b, b + 3, b + 2);
  }
  return flatMesh(scene, pos, idx);
}
const rectMesh = (scene: Renderer['scene'], frame: boolean) => frame
  ? flatMesh(scene, [0, 0, -0.5, 1, 0, -0.5, 1, 0, 0.5, 0, 0, 0.5, 0.012, 0, -0.44, 0.988, 0, -0.44, 0.988, 0, 0.44, 0.012, 0, 0.44], [0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7])
  : flatMesh(scene, [0, 0, -0.5, 1, 0, -0.5, 1, 0, 0.5, 0, 0, 0.5], [0, 1, 2, 0, 2, 3]);

interface ActorView { root: TransformNode; body: TransformNode; arm?: TransformNode; spin?: TransformNode; inst: InstancedMesh[]; lit: InstancedMesh[]; flash?: InstancedMesh; aura?: Mesh; src: ModelSrc;
  face: number; flashT: number; punch: number; hold: number; seen: boolean; deadFx: boolean; x: number; z: number; scale: number }
interface DecalView { fill: Mesh; grow?: Mesh; edge?: Mesh }
interface InterView { it: Interactable; base: Mesh[]; on: Mesh[]; off: Mesh[]; npc?: ActorView; state: number; light?: LightSrc }

/** Presentation of simulation state: consumes actors, areas, projectiles, pickups and typed events. Owns no game rules. */
export class Dynamic {
  parts: Particles; views = new Map<number, ActorView>(); decals = new Map<number, DecalView>(); projs = new Map<number, InstancedMesh>(); picks = new Map<number, ActorView>();
  inters: InterView[] = []; propNodes: Mesh[] = []; decalMats = new Map<string, StandardMaterial>(); decalSrc = new Map<string, Mesh>();
  rings: { mesh: Mesh; t: number; dur: number; r: number }[] = []; arcs: { mesh: Mesh; t: number; dur: number }[] = []; links: { mesh: Mesh; t: number }[] = [];
  projSrc: Record<string, Mesh> = {}; time = 0; zone: Zone | null = null; ashT = 0;
  constructor(private r: Renderer) {
    this.parts = new Particles(r, 2200);
    const mk = (name: string, len: number, w: number, hex: string) => { const m = CreateBox(name, { width: len, height: w, depth: w }, r.scene); const mat = new StandardMaterial(name + 'M', r.scene); mat.disableLighting = true; mat.emissiveColor = C(hex); mat.fogEnabled = false; m.material = mat; m.isVisible = false; m.isPickable = false; this.projSrc[name] = m; };
    mk('arrow', 1.0, 0.07, '#ffe9b0'); mk('arrow_trace', 1.1, 0.09, TEAL); mk('enemy_arrow', 1.0, 0.09, '#ff5a3a'); mk('ghostline', 2.6, 0.13, '#b8fff2'); mk('bolt', 0.5, 0.34, '#b86bff'); mk('hook', 0.6, 0.3, '#c8c0b4'); mk('chain', 0.6, 0.3, '#ffcf6b');
  }
  private decalMat(hex: string): StandardMaterial {
    let m = this.decalMats.get(hex);
    if (!m) { m = new StandardMaterial('dm' + hex, this.r.scene); m.disableLighting = true; m.emissiveColor = C(hex); m.backFaceCulling = false; m.fogEnabled = false; m.disableDepthWrite = true; m.zOffset = -2; this.decalMats.set(hex, m); }
    return m;
  }
  private shape(key: string, make: () => Mesh): Mesh {
    let s = this.decalSrc.get(key);
    if (!s) { s = make(); s.isVisible = false; this.decalSrc.set(key, s); }
    const c = s.clone('d_' + key); c.isVisible = true; c.isPickable = false;
    return c;
  }
  private makeView(model: string, shadow: boolean): ActorView {
    const r = this.r, src = getModel(r.scene, r.mats, model);
    const root = new TransformNode('a_' + model, r.scene), body = new TransformNode('b', r.scene);
    body.parent = root;
    const v: ActorView = { root, body, inst: [], lit: [], src, face: 0, flashT: 0, punch: 0, hold: 0, seen: false, deadFx: false, x: 0, z: 0, scale: 1 };
    const add = (m: Mesh | undefined, parent: TransformNode, lit: boolean) => { if (!m) return; const i = m.createInstance('i'); i.parent = parent; i.isPickable = false; v.inst.push(i); if (lit) { v.lit.push(i); if (shadow) r.castShadow(i); } };
    add(src.body, body, true); add(src.bodyGlow, body, false);
    if (src.arm || src.armGlow) { v.arm = new TransformNode('arm', r.scene); v.arm.parent = body; const pv = src.def.armPivot ?? [0, 1.4, 0.4]; v.arm.position.set(pv[0], pv[1], pv[2]); add(src.arm, v.arm, true); add(src.armGlow, v.arm, false); }
    if (src.spin || src.spinGlow) { v.spin = new TransformNode('spin', r.scene); v.spin.parent = body; add(src.spin, v.spin, true); add(src.spinGlow, v.spin, false); }
    if (src.flash) { v.flash = src.flash.createInstance('f'); v.flash.parent = body; v.flash.isPickable = false; v.flash.setEnabled(false); v.flash.scaling.setAll(1.03); }
    return v;
  }
  private dropView(v: ActorView): void { for (const i of v.lit) this.r.uncast(i); v.aura?.dispose(); v.root.dispose(); }

  setZone(zone: Zone): void {
    for (const v of this.views.values()) this.dropView(v);
    for (const v of this.picks.values()) this.dropView(v);
    for (const d of this.decals.values()) { d.fill.dispose(); d.grow?.dispose(); d.edge?.dispose(); }
    for (const m of this.projs.values()) m.dispose();
    for (const iv of this.inters) { for (const m of [...iv.base, ...iv.on, ...iv.off]) m.dispose(); if (iv.npc) this.dropView(iv.npc); }
    for (const m of this.propNodes) m.dispose();
    for (const x of [...this.rings, ...this.arcs, ...this.links]) x.mesh.dispose();
    this.views.clear(); this.picks.clear(); this.decals.clear(); this.projs.clear(); this.inters = []; this.propNodes = []; this.rings = []; this.arcs = []; this.links = [];
    this.zone = zone; this.parts.n = 0;
    const r = this.r, scene = r.scene;
    const place = (meshes: Mesh[], x: number, y: number, rot = 0, s = 1, shadow = true) => { for (const m of meshes) { m.position.set(x, 0, y); m.rotation.y = -rot; m.scaling.setAll(s); m.isPickable = false; m.receiveShadows = true; if (shadow) r.castShadow(m); this.propNodes.push(m); } };
    for (const pr of zone.props) {
      if (pr.type === 'rock') place(buildStatic(scene, r.mats, [p('s', [1.7, 1.5, 1.6], [0, 0.5, 0], '#3a3531'), p('s', [0.9, 0.8, 1.0], [0.6, 0.3, 0.4], '#2e2a27')], 'rock'), pr.x, pr.y, pr.rot, pr.scale);
      else if (pr.type === 'pillar') place(buildStatic(scene, r.mats, [p('c', [1.3, 0.3, 1.3], [0, 0.15, 0], '#5a564e'), p('c', [0.95, 1.5 * pr.scale, 0.95], [0, 0.3 + 0.75 * pr.scale, 0], '#6a655c'), p('b', [0.5, 0.3, 0.4], [0.2, 0.4 + 1.5 * pr.scale, 0.1], '#5a564e', { rot: [0.3, 0.5, 0.2] })], 'pillar'), pr.x, pr.y, pr.rot);
      else if (pr.type === 'statue') {
        place(buildStatic(scene, r.mats, [p('b', [1.7, 0.5, 1.7], [0, 0.25, 0], STONE), p('c', [1.1, 4.6, 1.1], [0, 2.8, 0], '#5a564e', { top: 0.45 }), p('k', [0.6, 0.9, 0.6], [0, 5.5, 0], BRASS), p('b', [0.06, 2.2, 0.22], [-0.42, 2.6, -0.3], CYAN, { glow: true, rot: [0, 0.78, 0] }), p('s', [0.34, 0.34, 0.34], [0, 6.1, 0], CYAN, { glow: true })], 'statue'), pr.x, pr.y);
        r.statics.push({ x: pr.x - 1, y: pr.y - 1, h: 3, color: C(CYAN), intensity: 1.1, range: 12 });
      } else if (pr.type === 'campfire') {
        place(buildStatic(scene, r.mats, [p('c', [1.5, 0.18, 1.5], [0, 0.09, 0], '#2a2623'), p('b', [1.0, 0.16, 0.16], [0, 0.26, 0], '#3a2a1c', { rot: [0, 0.5, 0.1] }), p('b', [1.0, 0.16, 0.16], [0, 0.3, 0], '#3a2a1c', { rot: [0, -0.7, -0.1] }), p('k', [0.6, 0.9, 0.6], [0, 0.75, 0], '#ff8a2a', { glow: true }), p('k', [0.3, 0.6, 0.3], [0, 0.8, 0], '#ffe08a', { glow: true })], 'fire'), pr.x, pr.y, 0, 1, false);
        r.statics.push({ x: pr.x, y: pr.y, h: 1.6, color: new Color3(1, 0.62, 0.3), intensity: 2.0, range: 17, flicker: true });
      } else if (pr.type === 'tent') {
        place(buildStatic(scene, r.mats, [p('k', [3.4, 2.6, 3.4], [0, 1.3, 0], '#6a5238'), p('b', [0.1, 1.5, 1.0], [-1.0, 0.75, -1.0], '#2a1f16', { rot: [0, 0.78, 0] }), p('c', [0.1, 3.0, 0.1], [0, 1.5, 0], '#3a2c1e'), p('b', [0.05, 0.5, 0.4], [0, 2.95, 0.2], '#a83220')], 'tent'), pr.x, pr.y, pr.rot);
      } else if (pr.type === 'crate') {
        place(buildStatic(scene, r.mats, [p('b', [0.9, 0.9, 0.9], [0, 0.45, 0], '#5a442c'), p('b', [0.7, 0.7, 0.7], [0.75, 0.35, 0.3], '#4a3824', { rot: [0, 0.4, 0] }), p('c', [0.55, 0.8, 0.55], [-0.2, 0.4, 0.85], '#6a5238'), p('b', [0.94, 0.08, 0.94], [0, 0.6, 0], BRASS)], 'crate'), pr.x, pr.y, pr.rot);
      } else if (pr.type === 'torch') {
        place(buildStatic(scene, r.mats, [p('b', [0.1, 0.5, 0.1], [0, 1.9, 0], '#2a2623'), p('c', [0.24, 0.16, 0.24], [0, 2.2, 0], BRASS, { top: 1.4 }), p('k', [0.22, 0.42, 0.22], [0, 2.5, 0], '#ff9a3a', { glow: true })], 'torch'), pr.x, pr.y, 0, 1, false);
        r.statics.push({ x: pr.x, y: pr.y - 0.6, h: 2.4, color: new Color3(1, 0.58, 0.28), intensity: 1.5, range: 12, flicker: true });
      }
    }
    for (const it of zone.inter) this.addInter(it, zone);
  }
  private addInter(it: Interactable, zone: Zone): void {
    const r = this.r, scene = r.scene;
    const iv: InterView = { it, base: [], on: [], off: [], state: -99 };
    let base: Part[] = [], on: Part[] = [], off: Part[] = [], rot = 0;
    const portalCol = it.to === 'refuge' || it.key === 'town' || it.key === 'return' ? '#ffcf7a' : it.to?.startsWith('archive') ? '#8a6aff' : it.key === 'hunt' ? '#ff5a4a' : '#9fc8d8';
    switch (it.type) {
      case 'waypoint':
        base = [p('c', [3.4, 0.22, 3.4], [0, 0.11, 0], STONE), ...[0, 1, 2, 3].map((i) => p('c', [0.34, 1.5, 0.34], [Math.cos(i * 1.57 + 0.78) * 1.5, 0.85, Math.sin(i * 1.57 + 0.78) * 1.5], '#5a564e', { top: 0.6 }))];
        off = [p('t', [2.3, 0.1, 2.3], [0, 0.26, 0], '#2c4a50')];
        on = [p('t', [2.3, 0.12, 2.3], [0, 0.28, 0], CYAN, { glow: true }), ...[0, 1, 2, 3].map((i) => p('s', [0.26, 0.26, 0.26], [Math.cos(i * 1.57 + 0.78) * 1.5, 1.75, Math.sin(i * 1.57 + 0.78) * 1.5], CYAN, { glow: true }))];
        iv.light = { x: it.x, y: it.y, h: 1.5, color: C(CYAN), intensity: 1.6, range: 11 };
        break;
      case 'exit': case 'portal':
        base = [p('b', [0.5, 3.2, 0.5], [0, 1.6, -1.1], STONE), p('b', [0.5, 3.2, 0.5], [0, 1.6, 1.1], STONE), p('b', [0.6, 0.5, 2.9], [0, 3.3, 0], '#5a564e'), p('b', [0.08, 2.9, 1.8], [0, 1.5, 0], portalCol, { glow: true })];
        rot = -Math.PI / 4;
        iv.light = { x: it.x, y: it.y, h: 1.6, color: C(portalCol), intensity: 1.3, range: 9 };
        break;
      case 'chest': case 'stash': {
        const big = it.type === 'stash' ? 1.5 : 1;
        base = [p('b', [1.1 * big, 0.6 * big, 0.75 * big], [0, 0.3 * big, 0], '#5a3e24'), p('b', [1.14 * big, 0.1, 0.79 * big], [0, 0.3 * big, 0], BRASS), p('b', [0.14, 0.2, 0.06], [0, 0.5 * big, -0.4 * big], GOLD, { glow: true })];
        off = [p('b', [1.14 * big, 0.26 * big, 0.79 * big], [0, 0.72 * big, 0], '#6a4a2a')];
        on = [p('b', [1.14 * big, 0.26 * big, 0.79 * big], [0, 0.95 * big, 0.45 * big], '#6a4a2a', { rot: [-1.1, 0, 0] })];
        rot = Math.PI / 4;
        break;
      }
      case 'lever':
        base = [p('b', [0.8, 0.3, 0.6], [0, 0.15, 0], STONE)];
        off = [p('b', [0.1, 1.2, 0.1], [-0.25, 0.7, 0], '#8a837a', { rot: [0, 0, 0.5] }), p('s', [0.22, 0.22, 0.22], [-0.55, 1.2, 0], '#ff6a4a', { glow: true })];
        on = [p('b', [0.1, 1.2, 0.1], [0.25, 0.7, 0], '#8a837a', { rot: [0, 0, -0.5] }), p('s', [0.22, 0.22, 0.22], [0.55, 1.2, 0], TEAL, { glow: true })];
        break;
      case 'door':
        off = (it.cells ?? []).flatMap((c): Part[] => { const dx = (c % zone.w) * 2 + 1 - it.x, dz = Math.floor(c / zone.w) * 2 + 1 - it.y; return [p('b', [1.9, 2.8, 1.9], [dx, 1.4, dz], '#4a3624'), p('b', [1.96, 0.2, 1.96], [dx, 2.2, dz], BRASS), p('b', [1.96, 0.2, 1.96], [dx, 0.8, dz], BRASS)]; });
        break;
      case 'shrine':
        base = [p('c', [1.5, 0.3, 1.5], [0, 0.15, 0], STONE), p('c', [0.6, 2.2, 0.6], [0, 1.3, 0], '#5a564e', { top: 0.5 })];
        off = [p('s', [0.5, 0.5, 0.5], [0, 2.75, 0], TEAL, { glow: true }), p('t', [1.2, 0.05, 1.2], [0, 0.34, 0], TEAL, { glow: true })];
        on = [p('s', [0.4, 0.4, 0.4], [0, 2.7, 0], '#3a3a3a')];
        iv.light = { x: it.x, y: it.y, h: 2.5, color: C(TEAL), intensity: 1.2, range: 9 };
        break;
      case 'cage': {
        base = [p('b', [2.2, 0.16, 2.2], [0, 0.08, 0], '#2e2a28'), p('b', [2.2, 0.16, 2.2], [0, 2.5, 0], '#2e2a28'), ...[-1, 1].flatMap((i) => [-1, 1].map((j) => p('c', [0.14, 2.5, 0.14], [i, 1.3, j], '#5a544c')))];
        off = [-0.5, 0, 0.5].flatMap((k) => [p('c', [0.08, 2.4, 0.08], [k, 1.3, -1], '#5a544c'), p('c', [0.08, 2.4, 0.08], [-1, 1.3, k], '#5a544c'), p('c', [0.08, 2.4, 0.08], [k, 1.3, 1], '#5a544c'), p('c', [0.08, 2.4, 0.08], [1, 1.3, k], '#5a544c')]);
        on = [-0.5, 0, 0.5].flatMap((k) => [p('c', [0.08, 2.4, 0.08], [k, 1.3, 1], '#5a544c'), p('c', [0.08, 2.4, 0.08], [1, 1.3, k], '#5a544c')]);
        break;
      }
      case 'trap':
        base = [p('b', [1.7, 0.06, 1.7], [0, 0.03, 0], '#2a2625'), ...[-0.5, 0, 0.5].flatMap((i) => [-0.5, 0, 0.5].map((j) => p('k', [0.16, 0.22, 0.16], [i, 0.15, j], '#8a837a')))];
        break;
      default: break;
    }
    const mk = (parts: Part[], name: string) => { const ms = parts.length ? buildStatic(scene, r.mats, parts, name) : []; for (const m of ms) { m.position.set(it.x, 0, it.y); m.rotation.y = rot; m.receiveShadows = true; if (it.type !== 'trap') r.castShadow(m); } return ms; };
    iv.base = mk(base, it.type); iv.on = mk(on, it.type + '_on'); iv.off = mk(off, it.type + '_off');
    if (it.type === 'npc') { iv.npc = this.makeView('npc_' + it.npc, true); iv.npc.root.position.set(it.x, 0, it.y); iv.npc.root.rotation.y = Math.PI * 0.75; }
    if (it.type === 'cage' && zone.id === 'march') { iv.npc = this.makeView('npc_artificer', false); iv.npc.root.position.set(it.x, 0.1, it.y); iv.npc.root.rotation.y = Math.PI * 0.75; }
    this.inters.push(iv);
  }
  private syncInters(): void {
    const zone = this.zone!;
    for (const it of zone.inter) if (!this.inters.some((v) => v.it === it)) this.addInter(it, zone);
    for (const iv of this.inters) {
      const st = iv.it.state, gone = !zone.inter.includes(iv.it);
      if (st === iv.state && !gone) continue;
      iv.state = gone ? -1 : st;
      const vis = !gone && st >= 0, on = st >= 1 || iv.it.type === 'exit' || iv.it.type === 'portal';
      for (const m of iv.base) m.setEnabled(vis);
      for (const m of iv.on) m.setEnabled(vis && on);
      for (const m of iv.off) m.setEnabled(vis && !on);
      if (iv.npc) iv.npc.root.setEnabled(iv.it.type === 'cage' ? vis && !on : vis);
    }
  }
  /** Lights contributed by live objects this frame (braziers, waypoints, the player's lantern). */
  lights(s: Session): LightSrc[] {
    const out: LightSrc[] = [];
    const pl = s.player;
    out.push({ x: pl.x, y: pl.y, h: 2.2, color: s.hero.cls === 'cinder' ? new Color3(1, 0.72, 0.45) : new Color3(0.7, 0.95, 0.85), intensity: 1.25, range: 14 });
    for (const a of s.zone.actors) {
      if (a.dead) continue;
      if (a.def === 'brazier') out.push({ x: a.x, y: a.y, h: 1.8, color: new Color3(1, 0.55, 0.22), intensity: 1.7, range: 13, flicker: true });
      else if (a.def === 'engine') out.push({ x: a.x, y: a.y, h: 5, color: C(CYAN), intensity: 2.6, range: 26 });
      else if (a.def === 'conduit') out.push({ x: a.x, y: a.y, h: 2.6, color: C(CYAN), intensity: 1.2, range: 9 });
    }
    for (const iv of this.inters) if (iv.light && iv.state >= 0 && (iv.it.type !== 'waypoint' || iv.it.state >= 1) && (iv.it.type !== 'shrine' || iv.it.state === 0)) out.push(iv.light);
    return out;
  }
  private animate(v: ActorView, a: Actor, s: Session, dt: number, isPlayer: boolean): void {
    const t = this.time, body = v.body, arm = v.arm;
    let lean = 0, bx = 0, by = 0, sy = 1, sx = 1, armZ = 0, armY = 0, wob = 0;
    const k = a.animDur > 0 ? clamp(a.animT / a.animDur, 0, 1) : 0;
    switch (a.anim) {
      case 'walk': by = Math.abs(Math.sin(t * 9 + a.id)) * 0.07; lean = -0.08; armZ = Math.sin(t * 9 + a.id) * 0.35; break;
      case 'windup': lean = 0.22 * k; sy = 1 + 0.07 * k; armZ = 1.7 * k; by = 0.05 * k; break;
      case 'attack':
        if (isPlayer) { const w = 0.46; if (k < w) { armY = (k / w) * 1.5; lean = 0.1 * (k / w); } else { const u = Math.min(1, (k - w) / 0.22); armY = 1.5 - u * 3.0; lean = -0.2 * Math.sin(u * Math.PI); bx = 0.25 * Math.sin(u * Math.PI); } armZ = 0.2; }
        else { armZ = 1.7 - Math.min(1, k * 2.5) * 2.6; bx = 0.4 * Math.sin(Math.min(1, k * 1.6) * Math.PI); lean = -0.25 * Math.sin(k * Math.PI); }
        break;
      case 'shoot': { const w = 0.4; armZ = 0.1; lean = k < w ? 0.12 * (k / w) : -0.1 * Math.sin(Math.min(1, (k - w) / 0.3) * Math.PI); bx = k < w ? -0.08 * (k / w) : 0; break; }
      case 'cast': armZ = 1.9 * Math.sin(Math.min(1, k * 2) * Math.PI / 2); sy = 1 + 0.05 * Math.sin(k * Math.PI); break;
      case 'dash': lean = -0.5; sx = 1.18; sy = 0.92; break;
      case 'stun': wob = Math.sin(t * 15) * 0.12; lean = 0.12; break;
      case 'channel': armZ = 1.6; by = 0.05 + Math.sin(t * 4) * 0.03; break;
      case 'burrow': by = -2.2; break;
      case 'hit': lean = 0.2; break;
      case 'dead': if (isPlayer) { lean = -1.45; by = -0.1; } break;
      default: sy = 1 + Math.sin(t * 2 + a.id) * 0.015;
    }
    if (a.def === 'mite' && a.anim === 'windup') { const pulse = 1 + 0.35 * k + Math.sin(t * 40) * 0.06 * k; sx = pulse; sy = pulse; }
    const e = 1 - Math.exp(-dt * 22);
    body.rotation.z = lerp(body.rotation.z, lean, e); body.rotation.x = wob;
    body.position.x = lerp(body.position.x, bx, e); body.position.y = lerp(body.position.y, by, e);
    const pn = 1 + v.punch * 0.16;
    body.scaling.set(sx * pn, sy * (2 - pn), sx * pn);
    if (arm) { arm.rotation.z = lerp(arm.rotation.z, armZ, e); arm.rotation.y = lerp(arm.rotation.y, armY, 1 - Math.exp(-dt * 40)); }
    if (v.spin) v.spin.rotation.y += dt * (a.def === 'swarm' || a.def === 'swarmlet' ? 7 : a.def === 'ward' ? 2.5 : 0);
    if (v.spin && (a.def === 'swarm' || a.def === 'swarmlet')) v.spin.position.y = Math.sin(t * 5 + a.id) * 0.12;
  }
  update(s: Session, alpha: number, dt: number, events: Ev[]): void {
    const r = this.r, z = s.zone, parts = this.parts;
    this.time += dt;
    const reduce = r.settings.reducedMotion, pm = r.settings.particles;
    const burst = (x: number, h: number, y: number, n: number, sp: number, life: number, size: number, hex: string, up = 0.5, grav = -4) => parts.burst(x, h, y, Math.ceil(n * pm), sp, life, size, hex, up, grav);
    this.syncInters();
    // ── events → presentation cues ──
    for (const e of events) {
      switch (e.type) {
        case 'hit': {
          const v = e.id !== undefined ? this.views.get(e.id) : undefined;
          if (v && !e.dot) { v.flashT = 0.09; v.punch = 1; if (e.crit || (e.a ?? 0) > 40) v.hold = e.crit ? 0.055 : 0.03; }
          const col = e.dtype ? DTYPE_COLOR[e.dtype] : '#ffffff';
          if (!e.dot) burst(e.x, 1.1, e.y, e.crit ? 10 : 4, e.crit ? 7 : 4.5, 0.28, e.crit ? 0.3 : 0.17, col);
          else if (Math.random() < 0.5) burst(e.x, 1.2, e.y, 2, 1.5, 0.4, 0.22, col, 1, 2);
          if (e.id === s.player.id && !e.dot) { r.addShake(e.b ? 0.35 : 0.14); r.flash(e.x, e.y, C('#ff4a3a'), 1.2, 8, 0.2); }
          else if (e.crit) r.addShake(0.1);
          break;
        }
        case 'death': {
          const big = (e.a ?? 0.5) > 1;
          burst(e.x, 0.8, e.y, big ? 70 : 16, big ? 9 : 4.5, 0.9, big ? 0.6 : 0.36, e.s === 'urn' ? '#8a7a66' : '#5a5650', 0.9, -5);
          burst(e.x, 0.8, e.y, big ? 40 : 8, big ? 7 : 3.5, 0.6, 0.3, e.s === 'conduit' || e.s === 'engine' ? CYAN : EMBER, 1);
          if (big) { r.addShake(0.5); r.flash(e.x, e.y, C(EMBER), 4, 22, 0.8); this.ring(e.x, e.y, 9, 0.7, GOLD); }
          break;
        }
        case 'swing': this.arc(e.x, e.y, e.a ?? 3, e.b ?? 0, (e.id ?? 190) / 100, e.dtype === 'ember' ? EMBER : '#f2ecde'); if (e.dtype === 'ember') r.flash(e.x, e.y, C(EMBER), 1.6, 9, 0.25); break;
        case 'fx': this.fx(e, burst); break;
        case 'evade': burst(e.x, 0.8, e.y, 10, 3, 0.4, 0.3, TEAL, 0.3, 0); break;
        case 'block': burst(e.x, 1.3, e.y, 8, 5, 0.25, 0.3, '#ffe9b0'); break;
        case 'heal': burst(e.x, 0.6, e.y, 14, 1.6, 0.9, 0.3, '#5aff8a', 2.2, 2); break;
        case 'levelup': burst(e.x, 0.3, e.y, 60, 3.5, 1.4, 0.4, GOLD, 3, 3); this.ring(e.x, e.y, 5, 0.8, GOLD); r.flash(e.x, e.y, C(GOLD), 3, 16, 0.9); break;
        case 'pickup': burst(e.x, 0.5, e.y, e.s === 'item' ? 8 : 4, 2, 0.35, 0.22, e.s === 'gold' ? '#ffc83a' : e.s === 'globe' ? '#ff4a40' : TEAL, 1.5, 1); break;
        case 'drop': if ((e.a ?? 0) >= 2) { burst(e.x, 0.4, e.y, 22, 3, 0.9, 0.34, e.a === 3 ? '#ff8a4a' : '#f2cf5b', 2.5, 1); r.flash(e.x, e.y, C(e.a === 3 ? '#ff8a4a' : '#f2cf5b'), 2, 10, 0.6); } break;
        case 'playerDeath': burst(e.x, 1, e.y, 50, 5, 1.2, 0.45, '#8a2a2a', 1.2, -3); r.addShake(0.5); break;
        case 'invalid': this.ring(e.x, e.y, 0.7, 0.3, '#ff4a3a'); break;
        default: break;
      }
    }
    // ── actors ──
    const live = new Set<number>();
    for (const a of z.actors) {
      if (a.kind === 'npc') continue;
      let v = this.views.get(a.id);
      if (a.dead && a.kind !== 'player') { if (v) { v.root.scaling.y = Math.max(0.02, v.root.scaling.y - dt * 4.5); v.root.position.y -= dt * 0.6; if (v.root.scaling.y <= 0.03) v.root.setEnabled(false); live.add(a.id); } continue; }
      if (!v) { v = this.makeView(a.kind === 'player' ? s.hero.cls : a.def, true); this.views.set(a.id, v); v.face = a.facing; v.scale = a.kind === 'standard' ? 1 : a.r / (a.kind === 'player' ? 0.45 : Math.max(0.1, getR(a.def))); if (a.def === 'swarmlet') v.scale *= 0.62;
        if (a.elite) { v.aura = this.shape('sector:628:82', () => sector(r.scene, TAU, 0.82, 1)); v.aura.material = this.decalMat(MOD_COLOR[a.mods[0]] ?? GOLD); } }
      live.add(a.id);
      if (v.hold > 0) { v.hold -= dt; continue; }
      const x = lerp(a.px, a.x, alpha), y = lerp(a.py, a.y, alpha);
      v.x = x; v.z = y;
      v.root.position.set(x, 0, y);
      v.face += angDiff(a.facing, v.face) * (1 - Math.exp(-dt * 18));
      v.root.rotation.y = -v.face;
      v.root.scaling.setAll(v.scale);
      const hidden = a.untargetable && a.kind === 'enemy';
      v.root.setEnabled(!hidden || a.anim === 'burrow');
      this.animate(v, a, s, dt, a.kind === 'player');
      v.punch = Math.max(0, v.punch - dt * 9);
      const cloaked = a.kind === 'player' && a.statuses.some((st) => st.id === 'cloak');
      if (v.flashT > 0 || cloaked) { v.flashT -= dt; v.flash?.setEnabled(true); for (const i of v.inst) i.setEnabled(!cloaked); } else if (v.flash?.isEnabled()) { v.flash.setEnabled(false); for (const i of v.inst) i.setEnabled(true); }
      if (v.aura) { v.aura.position.set(x, 0.06, y); v.aura.scaling.setAll(a.r + 0.55 + Math.sin(this.time * 4) * 0.06); v.aura.rotation.y = this.time; v.aura.visibility = 0.85; }
      // status particles
      if (!reduce && pm > 0) for (const st of a.statuses) {
        if (Math.random() > 0.3 * pm) continue;
        const h = Math.random() * v.src.def.height * v.scale, ox = (Math.random() - 0.5) * a.r * 1.6, oz = (Math.random() - 0.5) * a.r * 1.6;
        if (st.id === 'burn') parts.emit(x + ox, h, y + oz, 0, 1.8, 0, 0.5, 0.36, C(EMBER), 1);
        else if (st.id === 'blight') parts.emit(x + ox, h, y + oz, 0, 0.8, 0, 0.6, 0.3, C('#b36bff'), 0.5);
        else if (st.id === 'chill') parts.emit(x + ox, h, y + oz, 0, -0.5, 0, 0.5, 0.24, C('#9fd8ff'), 0);
        else if (st.id === 'furnace') parts.emit(x + ox, 0.2, y + oz, 0, 3, 0, 0.6, 0.4, C('#ff9a3a'), 2);
        else if (st.id === 'guard' && Math.random() < 0.5) parts.emit(x + Math.cos(this.time * 6 + h) * 0.8, h, y + Math.sin(this.time * 6 + h) * 0.8, 0, 0.4, 0, 0.35, 0.26, C(GOLD), 0);
        else if (st.id === 'trace') parts.emit(x + ox, v.src.def.height * v.scale + 0.4, y + oz, 0, 0.3, 0, 0.4, 0.2 + st.stacks * 0.07, C(TEAL), 0);
        else if (st.id === 'shell') parts.emit(x + Math.cos(h * 9) * a.r * 1.3, h, y + Math.sin(h * 9) * a.r * 1.3, 0, 0, 0, 0.3, 0.3, C('#d8e8ff'), 0);
        else if (st.id === 'ward' && Math.random() < 0.3) parts.emit(x + ox, h, y + oz, 0, 0.6, 0, 0.4, 0.2, C('#b86bff'), 0);
      }
      if (a.kind === 'player' && s.pc.gate >= 0) for (let i = 0; i < 2; i++) { const an = Math.random() * TAU; parts.emit(x + Math.cos(an) * 1.2, 0.1, y + Math.sin(an) * 1.2, -Math.cos(an), 2.5, -Math.sin(an), 0.7, 0.3, C(GOLD), 0); }
      if (a.def === 'brazier' && Math.random() < 0.5 * pm) parts.emit(x + (Math.random() - 0.5) * 0.3, 1.6, y + (Math.random() - 0.5) * 0.3, 0, 1.6, 0, 0.7, 0.34, C('#ff8a2a'), 0.6);
      if (a.def === 'engine' && Math.random() < 0.6 * pm) { const an = Math.random() * TAU; parts.emit(x + Math.cos(an) * 1.2, 5, y + Math.sin(an) * 1.2, Math.cos(an) * 2, 1, Math.sin(an) * 2, 0.8, 0.4, C(CYAN), -1); }
    }
    for (const [id, v] of this.views) if (!live.has(id)) { this.dropView(v); this.views.delete(id); }
    for (const iv of this.inters) if (iv.npc) { iv.npc.body.position.y = Math.sin(this.time * 1.6 + iv.it.id) * 0.02; iv.npc.body.scaling.y = 1 + Math.sin(this.time * 2 + iv.it.id) * 0.012; }
    // ── ambient props particles ──
    if (pm > 0) {
      for (const l of r.statics) if (l.flicker && Math.random() < 0.35 * pm && Math.abs(l.x - r.target.x) + Math.abs(l.y - r.target.z) < 40) parts.emit(l.x + (Math.random() - 0.5) * 0.4, l.h - 0.6, l.y + (l.range > 14 ? 0 : 0.6) + (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, 1.7, (Math.random() - 0.5) * 0.4, 0.9, 0.3, C('#ff8a2a'), 0.5, 0.5);
      for (const iv of this.inters) {
        if (iv.state < 0 || Math.random() > 0.25 * pm) continue;
        const it = iv.it, an = Math.random() * TAU;
        if (it.type === 'waypoint' && it.state >= 1) parts.emit(it.x + Math.cos(an) * 1.1, 0.3, it.y + Math.sin(an) * 1.1, 0, 1.5, 0, 1.2, 0.24, C(CYAN), 0, 0.2);
        else if (it.type === 'exit' || it.type === 'portal') parts.emit(it.x + (Math.random() - 0.5), Math.random() * 2.6, it.y + (Math.random() - 0.5), 0, 0.6, 0, 0.8, 0.22, iv.light!.color, 0, 0.2);
        else if (it.type === 'shrine' && !it.state) parts.emit(it.x + Math.cos(an) * 0.6, 0.4, it.y + Math.sin(an) * 0.6, 0, 1.2, 0, 1.2, 0.22, C(TEAL), 0, 0.2);
      }
      // Drifting ash around the camera.
      this.ashT += dt * (z.kind === 'crypt' ? 5 : 16) * pm;
      while (this.ashT > 1) { this.ashT--; parts.emit(r.target.x + (Math.random() - 0.5) * 44, 3 + Math.random() * 7, r.target.z + (Math.random() - 0.5) * 44, 0.9 + Math.random(), -0.7 - Math.random() * 0.5, -0.3, 5, 0.1 + Math.random() * 0.09, z.kind === 'crypt' ? new Color3(0.2, 0.22, 0.3) : Math.random() < 0.12 ? new Color3(0.9, 0.38, 0.1) : new Color3(0.26, 0.25, 0.24), 0, 0); }
    }
    this.updateAreas(z.areas, s, dt, pm);
    // ── projectiles ──
    const seen = new Set<number>();
    for (const pr of z.projectiles) {
      seen.add(pr.id);
      let m = this.projs.get(pr.id);
      if (!m) { m = (this.projSrc[pr.kind] ?? this.projSrc.arrow).createInstance('pr'); m.isPickable = false; this.projs.set(pr.id, m); }
      const x = lerp(pr.px, pr.x, alpha), y = lerp(pr.py, pr.y, alpha);
      m.position.set(x, 1.15, y); m.rotation.y = -Math.atan2(pr.vy, pr.vx);
      if (pm > 0 && Math.random() < 0.8) parts.emit(x, 1.15, y, 0, 0, 0, pr.kind === 'ghostline' ? 0.45 : 0.22, pr.kind === 'ghostline' ? 0.42 : 0.2, C(pr.kind === 'bolt' ? '#b86bff' : pr.src.team === 0 ? (pr.kind === 'arrow' ? '#ffe9b0' : TEAL) : '#ff5a3a'), 0, 0);
      if (pr.kind === 'hook' || pr.kind === 'chain') { const o = s.actor(pr.src.id); if (o) this.link(o.x, o.y, x, y, pr.kind === 'chain' ? GOLD : '#c8c0b4', 0.05); }
    }
    for (const [id, m] of this.projs) if (!seen.has(id)) { m.dispose(); this.projs.delete(id); }
    // ── pickups ──
    const pk = new Set<number>();
    for (const k of z.pickups) {
      pk.add(k.id);
      let v = this.picks.get(k.id);
      if (!v) { v = this.makeView(k.kind === 'item' ? (k.item!.kind === 'glyph' ? 'pk_glyph' : 'pk_item' + k.item!.rarity) : k.kind === 'potion' ? 'pk_potion' + k.potion : 'pk_' + k.kind, false); this.picks.set(k.id, v); v.root.rotation.y = k.id; }
      const drop = Math.min(1, k.t / 0.35);
      v.root.position.set(k.x, Math.sin(drop * Math.PI) * 1.2 + (k.kind === 'item' ? 0 : 0.15 + Math.sin(this.time * 3 + k.id) * 0.08), k.y);
      if (k.kind !== 'item') v.root.rotation.y += dt * 2;
      if (k.kind === 'echo' && Math.random() < 0.5 * pm) parts.emit(k.x + (Math.random() - 0.5), 0.3, k.y + (Math.random() - 0.5), 0, 2, 0, 1, 0.3, C(TEAL), 0, 0.2);
    }
    for (const [id, v] of this.picks) if (!pk.has(id)) { this.dropView(v); this.picks.delete(id); }
    // ── transient meshes ──
    for (const g of this.rings) { g.t += dt; const k = g.t / g.dur; g.mesh.scaling.setAll(Math.max(0.01, g.r * (0.25 + 0.75 * (1 - (1 - k) ** 2)))); g.mesh.visibility = Math.max(0, 1 - k) * 0.9; }
    for (const a of this.arcs) { a.t += dt; a.mesh.visibility = Math.max(0, 1 - a.t / a.dur) * 0.85; a.mesh.scaling.setAll(a.mesh.scaling.x * (1 + dt * 0.6)); }
    for (const l of this.links) l.t -= dt;
    const prune = <T extends { mesh: Mesh }>(arr: T[], dead: (x: T) => boolean) => arr.filter((x) => { if (dead(x)) { x.mesh.dispose(); return false; } return true; });
    this.rings = prune(this.rings, (g) => g.t >= g.dur); this.arcs = prune(this.arcs, (a) => a.t >= a.dur); this.links = prune(this.links, (l) => l.t <= 0);
    parts.update(dt, r.camRot.m as unknown as Float32Array);
  }
  ring(x: number, y: number, radius: number, dur: number, hex: string): void {
    const mesh = this.shape('sector:628:88', () => sector(this.r.scene, TAU, 0.88, 1));
    mesh.material = this.decalMat(hex); mesh.position.set(x, 0.09, y); mesh.scaling.setAll(0.01);
    this.rings.push({ mesh, t: 0, dur, r: radius });
  }
  arc(x: number, y: number, radius: number, dir: number, angle: number, hex: string): void {
    const key = 'sector:' + Math.round(angle * 100) + ':55';
    const mesh = this.shape(key, () => sector(this.r.scene, angle, 0.55, 1));
    mesh.material = this.decalMat(hex); mesh.position.set(x, 1.0, y); mesh.rotation.y = -dir; mesh.scaling.setAll(radius);
    this.arcs.push({ mesh, t: 0, dur: 0.2 });
  }
  link(x0: number, y0: number, x1: number, y1: number, hex: string, dur: number): void {
    const mesh = this.shape('linkbox', () => { const b = CreateBox('link', { width: 1, height: 0.07, depth: 0.07 }, this.r.scene); return b; });
    mesh.material = this.decalMat(hex);
    const d = Math.hypot(x1 - x0, y1 - y0);
    mesh.position.set((x0 + x1) / 2, 1.2, (y0 + y1) / 2); mesh.scaling.set(d, 1, 1); mesh.rotation.y = -Math.atan2(y1 - y0, x1 - x0);
    this.links.push({ mesh, t: dur });
  }
  private fx(e: Ev, burst: (x: number, h: number, y: number, n: number, sp: number, life: number, size: number, hex: string, up?: number, grav?: number) => void): void {
    const r = this.r, col = e.dtype ? DTYPE_COLOR[e.dtype] : GOLD, rad = e.a ?? 2;
    switch (e.s) {
      case 'explosion': this.ring(e.x, e.y, rad, 0.45, col); burst(e.x, 0.6, e.y, 46, rad * 2.6, 0.7, 0.55, col, 1.2, -2); burst(e.x, 0.4, e.y, 20, rad * 1.5, 0.9, 0.5, '#ffe08a', 1.5, -1); r.flash(e.x, e.y, C(col), 4, rad * 4, 0.5); r.addShake(0.3); break;
      case 'burst': case 'bloom': case 'frost': this.ring(e.x, e.y, rad, 0.4, e.s === 'bloom' ? '#b36bff' : col); burst(e.x, 0.3, e.y, 26, rad * 2, 0.6, 0.42, e.s === 'bloom' ? '#b36bff' : col, 1, -3); r.flash(e.x, e.y, C(col), 2, rad * 3.5, 0.35); if ((e.id ?? 0) > 0) r.addShake(0.12); break;
      case 'wave': this.arc(e.x, e.y, rad, e.b ?? 0, 0.95, '#f2ecde'); for (let i = 0; i < 12; i++) { const a = (e.b ?? 0) + (Math.random() - 0.5) * 0.9, sp = 9 + Math.random() * 6; this.parts.emit(e.x, 0.8, e.y, Math.cos(a) * sp, 0.5, Math.sin(a) * sp, 0.4, 0.4, C('#f2ecde'), 0, 2); } break;
      case 'slash': break;
      case 'spike': burst(e.x, 0.2, e.y, 10, 2.5, 0.35, 0.3, '#d8d0c4', 3, -8); break;
      case 'spark': burst(e.x, 1.1, e.y, 4, 3, 0.2, 0.2, col); break;
      case 'detonate': this.ring(e.x, e.y, rad, 0.3, TEAL); burst(e.x, 1.2, e.y, 22, 6, 0.4, 0.34, TEAL); r.flash(e.x, e.y, C(TEAL), 2.5, 9, 0.3); break;
      case 'chain': this.link(e.x, e.y, e.a ?? e.x, e.b ?? e.y, e.dtype === 'blight' ? '#b36bff' : GOLD, 0.18); break;
      case 'waypoint': this.ring(e.x, e.y, rad * 1.6, 0.9, CYAN); burst(e.x, 0.3, e.y, 60, 4, 1.4, 0.36, CYAN, 3, 2); r.flash(e.x, e.y, C(CYAN), 3, 16, 0.9); break;
      case 'summon': case 'ward': case 'burrow': this.ring(e.x, e.y, Math.min(rad, 2), 0.5, col); burst(e.x, 0.2, e.y, 18, 2.5, 0.7, 0.34, e.s === 'burrow' ? '#8a7a66' : col, 2.5, -2); break;
      case 'break': this.ring(e.x, e.y, rad * 1.5, 0.5, '#ffffff'); burst(e.x, 1.5, e.y, 50, 8, 0.7, 0.4, '#ffe9b0'); r.flash(e.x, e.y, C('#ffffff'), 3.5, 16, 0.4); r.addShake(0.3); break;
      case 'furnace': case 'standard': case 'cloak': case 'taunt': this.ring(e.x, e.y, rad, 0.5, e.s === 'furnace' ? EMBER : e.s === 'cloak' ? '#8aa0a0' : TEAL); burst(e.x, 0.6, e.y, 16, 3, 0.5, 0.3, e.s === 'furnace' ? EMBER : TEAL, 1.5, 0); break;
      case 'chest': burst(e.x, 0.8, e.y, 24, 3, 0.8, 0.3, GOLD, 2.5, -3); break;
      case 'potion': burst(e.x, 1.2, e.y, 12, 2, 0.6, 0.28, ['#ff5a50', '#5a9df0', '#f0ece4', '#e8b93c'][e.a ?? 0], 1.5, 1); break;
      case 'split': case 'bond': burst(e.x, 1, e.y, 12, 4, 0.4, 0.26, e.s === 'bond' ? '#ff3a5a' : '#cfc7b2'); break;
      default: break;
    }
  }
  /** Ground telegraphs: every area gets an outline, a base fill and a growing fill that completes exactly at impact. */
  private updateAreas(areas: Area[], s: Session, dt: number, pm: number): void {
    const scene = this.r.scene, seen = new Set<number>();
    for (const ar of areas) {
      if (ar.fx === 'none' && !ar.tag) continue;
      seen.add(ar.id);
      const mine = ar.src.team === 0;
      const hex = ar.tag === 'trap' ? TEAL : mine ? (ar.tag === 'pool' ? '#8a5ad8' : ar.tag === 'fire' ? EMBER : GOLD) : ar.tag === 'aim' ? '#ff4a3a' : DTYPE_COLOR[ar.dtype];
      let d = this.decals.get(ar.id);
      if (!d) {
        const mk = (r0: number, r1: number) => {
          if (ar.shape === 'rect') return this.shape(r0 ? 'rectf' : 'rect', () => rectMesh(scene, !!r0));
          const ang = ar.shape === 'circle' ? TAU : ar.angle;
          return this.shape(`sector:${Math.round(ang * 100)}:${r0 * 100 | 0}`, () => sector(scene, ang, r0, r1));
        };
        d = { fill: mk(0, 1) };
        d.fill.material = this.decalMat(hex);
        if (ar.tag !== 'aim' && ar.tag !== 'beam') { d.grow = mk(0, 1); d.grow.material = this.decalMat(hex); d.edge = mk(0.955, 1); d.edge.material = this.decalMat(mine ? hex : ar.dtype === 'physical' ? '#ff6a4a' : hex); }
        this.decals.set(ar.id, d);
      }
      const k = ar.delay > 0 ? clamp(ar.t / ar.delay, 0, 1) : 1, active = ar.t >= ar.delay;
      const rad = ar.tag === 'trap' ? (active ? ar.trig ?? 1.5 : ar.r) : ar.r;
      const set = (m: Mesh, f: number, y: number) => {
        m.position.set(ar.x, y, ar.y); m.rotation.y = -ar.dir;
        if (ar.shape === 'rect') m.scaling.set(Math.max(0.01, ar.len * (m === d!.grow ? f : 1)), 1, ar.width); else m.scaling.setAll(Math.max(0.01, rad * f));
      };
      const pulse = 0.5 + 0.5 * Math.sin(this.time * 9);
      set(d.fill, 1, 0.045);
      if (ar.tag === 'beam') d.fill.visibility = active ? 0.62 + pulse * 0.2 : 0.1 + 0.12 * pulse;
      else if (ar.tag === 'aim') d.fill.visibility = 0.25 + 0.4 * k;
      else if (ar.tag === 'trap') d.fill.visibility = active ? 0.3 + pulse * 0.25 : 0.12;
      else d.fill.visibility = active ? 0.26 + pulse * 0.1 : mine ? 0.1 : 0.16;
      if (d.grow) { set(d.grow, k, 0.055); d.grow.visibility = active ? 0 : mine ? 0.2 : 0.36; }
      if (d.edge) { set(d.edge, 1, 0.065); d.edge.visibility = ar.tag === 'trap' && active ? 0.25 : 0.95; }
      if (active && pm > 0 && (ar.tag === 'pool' || ar.tag === 'fire' || ar.tag === 'beam' || ar.tag === 'barrage') && Math.random() < 0.7 * pm) {
        let x = ar.x, y = ar.y;
        if (ar.shape === 'rect') { const u = Math.random() * ar.len, w = (Math.random() - 0.5) * ar.width; x += Math.cos(ar.dir) * u - Math.sin(ar.dir) * w; y += Math.sin(ar.dir) * u + Math.cos(ar.dir) * w; }
        else { const a = ar.shape === 'cone' ? ar.dir + (Math.random() - 0.5) * ar.angle : Math.random() * TAU, rr = Math.sqrt(Math.random()) * ar.r; x += Math.cos(a) * rr; y += Math.sin(a) * rr; }
        if (ar.tag === 'barrage') { this.parts.emit(x, 5, y, 0, -22, 0, 0.24, 0.3, C('#ffe9b0'), 0, 0); this.parts.emit(x, 0.2, y, 0, 1, 0, 0.25, 0.3, C(GOLD), 0); }
        else this.parts.emit(x, 0.15, y, 0, ar.tag === 'beam' ? 3 : 1.4, 0, 0.6, ar.tag === 'beam' ? 0.5 : 0.32, C(hex), 0.5, 0.3);
      }
    }
    for (const [id, d] of this.decals) if (!seen.has(id)) { d.fill.dispose(); d.grow?.dispose(); d.edge?.dispose(); this.decals.delete(id); }
    void s; void dt;
  }
}
import { ENEMY } from '../navigation-ai/enemies';
const getR = (def: string) => ENEMY[def]?.r ?? 0.5;
void MOD;
