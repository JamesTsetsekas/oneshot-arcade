// Entity views and VFX: loot, containers, tracers, impacts, projectiles,
// mist, Riftstorm wall + motes, skiff, supply capsules, caravan drone,
// map marker and echo trails. Pooled where it matters.

import {
  Scene, Mesh, MeshBuilder, StandardMaterial, Color3, Vector3, TransformNode, InstancedMesh, ShaderMaterial, Effect,
  Matrix, Quaternion, LinesMesh, Color4,
} from '@babylonjs/core';
import type { LootView, ContainerView, ProjectileView, SmokeView, StormView, SkiffView, CapsuleView, CaravanView } from '../../shared/protocol/messages';
import { RARITIES } from '../../shared/content/rarity';
import { ITEMS } from '../../shared/content/items';
import { buildWeaponMesh } from './actors';

Effect.ShadersStore['stormVertexShader'] = `
precision highp float;
attribute vec3 position; attribute vec2 uv;
uniform mat4 worldViewProjection;
varying vec2 vUV; varying float vY;
void main(){ vUV = uv; vY = position.y; gl_Position = worldViewProjection * vec4(position,1.0); }`;
Effect.ShadersStore['stormFragmentShader'] = `
precision highp float;
varying vec2 vUV; varying float vY;
uniform float time; uniform float alphaMul; uniform float radius;
void main(){
  float u = vUV.x * radius * 0.25;
  float streak = 0.5 + 0.5 * sin(u * 6.2831 + time * 0.7 + sin(vUV.y * 9.0 + time * 0.3) * 1.5);
  float flow = 0.5 + 0.5 * sin(vUV.y * 40.0 - time * 1.6 + u * 2.0);
  float crystal = smoothstep(0.92, 1.0, sin(u * 25.0 + vUV.y * 60.0 + time * 0.4));
  vec3 violet = vec3(0.56, 0.26, 0.96);
  vec3 cyan = vec3(0.45, 0.95, 1.0);
  vec3 col = mix(violet, cyan, crystal * 0.7 + flow * 0.12);
  float fade = smoothstep(0.0, 0.04, vUV.y) * (1.0 - smoothstep(0.55, 1.0, vUV.y));
  float a = (0.28 + 0.22 * streak + 0.25 * crystal) * fade * alphaMul;
  gl_FragColor = vec4(col * (0.9 + 0.4 * streak), a);
}`;

const mk = (scene: Scene, c: string, em = 0, alpha = 1, unlit = false) => {
  const m = new StandardMaterial(`fx_${c}_${em}_${alpha}`, scene);
  m.diffuseColor = Color3.FromHexString(c);
  m.specularColor = new Color3(0.1, 0.1, 0.1);
  if (em) m.emissiveColor = Color3.FromHexString(c).scale(em);
  if (alpha < 1) { m.alpha = alpha; m.backFaceCulling = false; }
  if (unlit) m.disableLighting = true;
  return m;
};

interface Pooled { mesh: Mesh; until: number; kind: string; v?: Vector3; s0?: number }

export class FxSystem {
  private lootNodes = new Map<number, { node: TransformNode; key: string; base: number }>();
  private containerNodes = new Map<number, { node: TransformNode; lid: Mesh | null; opened: boolean; kind: string }>();
  private projNodes = new Map<number, Mesh>();
  private smokeNodes = new Map<number, TransformNode>();
  private capsuleNodes = new Map<number, TransformNode>();
  private beamSrc: Mesh[] = [];
  private ringSrc: Mesh[] = [];
  private itemSrc = new Map<string, Mesh>();
  private ammoSrc = new Map<string, Mesh>();
  private pool: Pooled[] = [];
  private tracerMat: StandardMaterial;
  private flashMat: StandardMaterial;
  private puffMat: StandardMaterial;
  private windMat: StandardMaterial;
  private mistMat: StandardMaterial;
  storm: Mesh;
  stormMat: ShaderMaterial;
  nextRing: Mesh;
  motes: Mesh;
  private moteData: { a: number; r: number; y: number; s: number }[] = [];
  skiff: TransformNode;
  caravan: TransformNode;
  caravanShield: Mesh;
  marker: Mesh;
  private trails: { mesh: LinesMesh; until: number }[] = [];
  time = 0;
  effectsLow = false;
  photosensitive = false;
  colorblind = false;

  constructor(public scene: Scene) {
    this.tracerMat = mk(scene, '#ffe9a8', 1, 0.85, true);
    this.flashMat = mk(scene, '#ffd27a', 1.4, 0.95, true);
    this.puffMat = mk(scene, '#e8dfcc', 0.3, 0.7);
    this.windMat = mk(scene, '#bff4ff', 0.9, 0.35, true);
    this.mistMat = mk(scene, '#dfe8ee', 0.35, 0.93);
    this.mistMat.specularColor = Color3.Black();
    this.buildSources();
    // storm wall
    this.storm = MeshBuilder.CreateCylinder('storm', { height: 700, diameter: 2, tessellation: 160, cap: Mesh.NO_CAP, sideOrientation: Mesh.DOUBLESIDE }, scene);
    this.stormMat = new ShaderMaterial('stormMat', scene, { vertex: 'storm', fragment: 'storm' }, { attributes: ['position', 'uv'], uniforms: ['worldViewProjection', 'time', 'alphaMul', 'radius'], needAlphaBlending: true });
    this.stormMat.backFaceCulling = false;
    this.stormMat.setFloat('alphaMul', 1);
    this.storm.material = this.stormMat;
    this.storm.position.y = 250;
    this.storm.isPickable = false;
    this.storm.alphaIndex = 10;
    this.nextRing = MeshBuilder.CreateTorus('nextRing', { diameter: 2, thickness: 0.004, tessellation: 160 }, scene);
    this.nextRing.material = mk(scene, '#ffffff', 1, 0.5, true);
    this.nextRing.isPickable = false;
    // inward-moving crystal motes near the wall
    this.motes = MeshBuilder.CreatePolyhedron('mote', { type: 1, size: 0.18 }, scene);
    this.motes.material = mk(scene, '#c9a8ff', 1, 1, true);
    this.motes.isPickable = false;
    for (let i = 0; i < 260; i++) this.moteData.push({ a: Math.random() * Math.PI * 2, r: Math.random() * 40, y: Math.random() * 30, s: 0.5 + Math.random() });
    this.motes.thinInstanceSetBuffer('matrix', new Float32Array(260 * 16), 16, false);
    // skiff: original transit skiff — long hull, twin copper turbines, fabric sails
    this.skiff = new TransformNode('skiff', scene);
    const hull = MeshBuilder.CreateBox('hull', { width: 7, height: 3, depth: 34 }, scene);
    hull.material = mk(scene, '#8a5a3b'); hull.parent = this.skiff;
    const deck = MeshBuilder.CreateBox('deck', { width: 8, height: 0.5, depth: 30 }, scene);
    deck.material = mk(scene, '#efe2c4'); deck.parent = this.skiff; deck.position.y = 1.7;
    for (const sx of [-6, 6]) {
      const t = MeshBuilder.CreateCylinder('eng', { height: 6, diameter: 2.6, tessellation: 12 }, scene);
      t.material = mk(scene, '#c27a44', 0.2); t.parent = this.skiff; t.rotation.x = Math.PI / 2; t.position.set(sx, 0.5, -6);
      const glow = MeshBuilder.CreateDisc('engGlow', { radius: 1.1, tessellation: 12 }, scene);
      glow.material = mk(scene, '#7cffd4', 1.5, 1, true); glow.parent = this.skiff; glow.position.set(sx, 0.5, -9.05); glow.rotation.y = Math.PI;
    }
    for (const z of [-4, 8]) {
      const sail = MeshBuilder.CreatePlane('sail', { width: 10, height: 8, sideOrientation: Mesh.DOUBLESIDE }, scene);
      sail.material = mk(scene, z > 0 ? '#2c9e95' : '#e0523f', 0.15); sail.parent = this.skiff; sail.position.set(0, 7, z); sail.rotation.y = Math.PI / 2;
    }
    this.skiff.setEnabled(false);
    // caravan drone
    this.caravan = new TransformNode('caravan', scene);
    const body = MeshBuilder.CreateCylinder('cvBody', { height: 1.4, diameter: 4, tessellation: 10 }, scene);
    body.material = mk(scene, '#d9a733', 0.15); body.parent = this.caravan;
    const ringC = MeshBuilder.CreateTorus('cvRing', { diameter: 5.2, thickness: 0.3, tessellation: 20 }, scene);
    ringC.material = mk(scene, '#c27a44'); ringC.parent = this.caravan;
    const lamp = MeshBuilder.CreateSphere('cvLamp', { diameter: 0.9 }, scene);
    lamp.material = mk(scene, '#ffc23d', 1.5, 1, true); lamp.parent = this.caravan; lamp.position.y = -0.9;
    this.caravanShield = MeshBuilder.CreateSphere('cvShield', { diameter: 5.4, segments: 12 }, scene);
    this.caravanShield.material = mk(scene, '#4ad8ff', 0.8, 0.25, true);
    this.caravanShield.parent = this.caravan;
    this.caravan.setEnabled(false);
    // map marker beam
    this.marker = MeshBuilder.CreateCylinder('marker', { height: 300, diameter: 0.6, tessellation: 6, cap: Mesh.NO_CAP }, scene);
    this.marker.material = mk(scene, '#ffd23d', 1, 0.45, true);
    this.marker.isPickable = false;
    this.marker.setEnabled(false);
  }

  private rcol(r: number) { return this.colorblind ? RARITIES[r].colorAlt : RARITIES[r].color; }

  private buildSources() {
    const s = this.scene;
    for (let r = 0; r < 5; r++) {
      const b = MeshBuilder.CreateCylinder(`beam${r}`, { height: 2.6, diameterTop: 0.02, diameterBottom: 0.14, tessellation: 6, cap: Mesh.NO_CAP }, s);
      b.material = mk(s, RARITIES[r].color, 1, 0.42, true);
      b.isPickable = false; b.setEnabled(false);
      this.beamSrc.push(b);
      const ring = MeshBuilder.CreateTorus(`ring${r}`, { diameter: 0.9, thickness: 0.05, tessellation: 16 }, s);
      ring.material = mk(s, RARITIES[r].color, 0.9, 1, true);
      ring.isPickable = false; ring.setEnabled(false);
      this.ringSrc.push(ring);
    }
    for (const [id, def] of Object.entries(ITEMS)) {
      const m = def.kind === 'throwable'
        ? MeshBuilder.CreateSphere(`item_${id}`, { diameter: 0.32, segments: 8 }, s)
        : MeshBuilder.CreateCylinder(`item_${id}`, { height: 0.42, diameter: 0.22, tessellation: 8 }, s);
      m.material = mk(s, def.color, 0.35);
      m.isPickable = false; m.setEnabled(false);
      this.itemSrc.set(id, m);
    }
    const ammoCols: Record<string, string> = { light: '#e8d27a', shell: '#e0523f', heavy: '#4a7fd0', charge: '#7cffd4' };
    for (const [k, c] of Object.entries(ammoCols)) {
      const m = MeshBuilder.CreateBox(`ammo_${k}`, { width: 0.36, height: 0.22, depth: 0.26 }, s);
      m.material = mk(s, c, 0.25);
      m.isPickable = false; m.setEnabled(false);
      this.ammoSrc.set(k, m);
    }
  }

  // ---------------------------------------------------------------- loot
  syncLoot(list: LootView[], focusId: number) {
    const seen = new Set<number>();
    for (const l of list) {
      seen.add(l.id);
      const key = `${l.kind}_${l.w ?? l.item ?? l.ammo}_${l.r ?? 0}`;
      let e = this.lootNodes.get(l.id);
      if (e && e.key !== key) { e.node.dispose(); this.lootNodes.delete(l.id); e = undefined; }
      if (!e) {
        const node = new TransformNode(`loot${l.id}`, this.scene);
        if (l.kind === 'weapon') {
          const w = buildWeaponMesh(this.scene, l.w!, l.r ?? 0, node);
          w.position.set(0, 0.35, -0.4);
          w.rotation.y = 0;
          const r = l.r ?? 0;
          const ring = this.ringSrc[r].createInstance(`lr${l.id}`); ring.parent = node; ring.position.y = 0.04;
          if (r >= 1) { const b = this.beamSrc[r].createInstance(`lb${l.id}`); b.parent = node; b.position.y = 1.3; }
        } else if (l.kind === 'item') {
          const m = this.itemSrc.get(l.item!)!.createInstance(`li${l.id}`); m.parent = node; m.position.y = 0.3;
        } else {
          const m = this.ammoSrc.get(l.ammo!)!.createInstance(`la${l.id}`); m.parent = node; m.position.y = 0.15;
        }
        node.position.set(l.x, l.y, l.z);
        e = { node, key, base: l.y };
        this.lootNodes.set(l.id, e);
      }
      e.node.position.set(l.x, l.y + (l.kind === 'weapon' ? 0 : Math.sin(this.time * 2 + l.id) * 0.05), l.z);
      e.node.rotation.y = this.time * (l.id === focusId ? 1.6 : 0.5) + l.id;
      const sc = l.id === focusId ? 1.15 : 1;
      e.node.scaling.set(sc, sc, sc);
    }
    for (const [id, e] of this.lootNodes) if (!seen.has(id)) { e.node.dispose(); this.lootNodes.delete(id); }
  }

  syncContainers(list: ContainerView[]) {
    const seen = new Set<number>();
    for (const c of list) {
      seen.add(c.id);
      let e = this.containerNodes.get(c.id);
      if (!e) {
        const node = new TransformNode(`ct${c.id}`, this.scene);
        let lid: Mesh | null = null;
        const s = this.scene;
        if (c.kind === 'chest') {
          const b = MeshBuilder.CreateBox('chest', { width: 1.1, height: 0.55, depth: 0.7 }, s); b.material = mk(s, '#c27a44'); b.parent = node; b.position.y = 0.28;
          const seam = MeshBuilder.CreateBox('seam', { width: 1.12, height: 0.06, depth: 0.72 }, s); seam.material = mk(s, '#7cffd4', 1.2, 1, true); seam.parent = node; seam.position.y = 0.55;
          lid = MeshBuilder.CreateBox('lid', { width: 1.1, height: 0.18, depth: 0.7 }, s); lid.material = mk(s, '#8a5a3b'); lid.parent = node;
          lid.setPivotPoint(new Vector3(0, 0, -0.35)); lid.position.y = 0.66;
        } else if (c.kind === 'locker') {
          const b = MeshBuilder.CreateBox('locker', { width: 0.8, height: 1.9, depth: 0.55 }, s); b.material = mk(s, '#5a7f8c'); b.parent = node; b.position.y = 0.95;
          const stripe = MeshBuilder.CreateBox('lstripe', { width: 0.82, height: 0.1, depth: 0.57 }, s); stripe.material = mk(s, '#ffd23d', 0.6); stripe.parent = node; stripe.position.y = 1.5;
          lid = MeshBuilder.CreateBox('door', { width: 0.78, height: 1.8, depth: 0.05 }, s); lid.material = mk(s, '#486570'); lid.parent = node;
          lid.setPivotPoint(new Vector3(-0.39, 0, 0)); lid.position.set(0, 0.95, 0.29);
        } else if (c.kind === 'cache') {
          const b = MeshBuilder.CreatePolyhedron('cache', { type: 2, size: 0.45 }, s); b.material = mk(s, '#9a6bff', 0.6); b.parent = node; b.position.y = 0.5;
        } else if (c.kind === 'capsule') {
          const b = MeshBuilder.CreateCylinder('capsule', { height: 2.2, diameter: 1.4, tessellation: 10 }, s); b.material = mk(s, '#efe2c4', 0.1); b.parent = node; b.position.y = 1.1;
          const band = MeshBuilder.CreateTorus('cband', { diameter: 1.5, thickness: 0.12 }, s); band.material = mk(s, '#ffc23d', 1, 1, true); band.parent = node; band.position.y = 1.4;
          const beam = MeshBuilder.CreateCylinder('cbeam', { height: 60, diameter: 0.5, cap: Mesh.NO_CAP }, s); beam.material = mk(s, '#ffc23d', 1, 0.3, true); beam.parent = node; beam.position.y = 30;
        } else {
          const b = MeshBuilder.CreateCylinder('cvWreck', { height: 1.2, diameter: 3.6, tessellation: 10 }, s); b.material = mk(s, '#d9a733'); b.parent = node; b.position.y = 0.6;
          const beam = MeshBuilder.CreateCylinder('cvbeam', { height: 40, diameter: 0.5, cap: Mesh.NO_CAP }, s); beam.material = mk(s, '#ffc23d', 1, 0.3, true); beam.parent = node; beam.position.y = 20;
        }
        node.position.set(c.x, c.y, c.z);
        node.rotation.y = c.yaw;
        e = { node, lid, opened: false, kind: c.kind };
        this.containerNodes.set(c.id, e);
      }
      if (c.opened && !e.opened) {
        e.opened = true;
        if (e.lid) { if (c.kind === 'chest') e.lid.rotation.x = -1.9; else e.lid.rotation.y = -1.8; }
        if (c.kind === 'cache' || c.kind === 'capsule' || c.kind === 'caravan') {
          e.node.getChildMeshes().forEach((m) => { if (m.name.includes('beam')) m.setEnabled(false); });
          if (c.kind === 'cache') e.node.setEnabled(false);
        }
      }
      if (c.kind === 'cache' && !c.opened) e.node.rotation.y = this.time;
    }
    for (const [id, e] of this.containerNodes) if (!seen.has(id)) { e.node.dispose(); this.containerNodes.delete(id); }
  }

  // ---------------------------------------------------------------- transient fx
  private spawn(kind: string, make: () => Mesh): Pooled {
    let p = this.pool.find((q) => q.kind === kind && q.until < this.time);
    if (!p) { p = { mesh: make(), until: 0, kind }; this.pool.push(p); }
    p.mesh.setEnabled(true);
    return p;
  }

  tracer(from: Vector3, to: Vector3) {
    const p = this.spawn('tracer', () => { const m = MeshBuilder.CreateBox('tracer', { size: 1 }, this.scene); m.material = this.tracerMat; m.isPickable = false; return m; });
    const L = Vector3.Distance(from, to);
    p.mesh.position = Vector3.Center(from, to);
    p.mesh.scaling.set(0.035, 0.035, Math.max(0.1, L));
    p.mesh.lookAt(to);
    p.until = this.time + 0.07;
  }

  flash(at: Vector3) {
    if (this.photosensitive) return;
    const p = this.spawn('flash', () => { const m = MeshBuilder.CreateSphere('flash', { diameter: 0.35, segments: 4 }, this.scene); m.material = this.flashMat; m.isPickable = false; return m; });
    p.mesh.position.copyFrom(at);
    p.until = this.time + 0.05;
  }

  impact(at: Vector3, player: boolean) {
    const p = this.spawn('puff', () => { const m = MeshBuilder.CreateBox('puff', { size: 0.18 }, this.scene); m.material = this.puffMat; m.isPickable = false; return m; });
    p.mesh.position.copyFrom(at);
    p.mesh.scaling.setAll(player ? 0.6 : 1);
    p.s0 = this.time;
    p.until = this.time + 0.35;
  }

  explosion(at: Vector3, r: number, kind: string) {
    if (kind === 'mist') return;
    const p = this.spawn('wind', () => { const m = MeshBuilder.CreateSphere('windfx', { diameter: 2, segments: 10 }, this.scene); m.material = this.windMat; m.isPickable = false; return m; });
    p.mesh.position.copyFrom(at);
    p.s0 = this.time; p.v = new Vector3(r, 0, 0);
    p.until = this.time + 0.45;
  }

  echoTrails(trails: { id: number; pts: [number, number, number][] }[], heightAt: (x: number, z: number) => number) {
    for (const t of trails) {
      const pts = t.pts.map(([x, z]) => new Vector3(x, heightAt(x, z) + 0.6, z));
      const cols = t.pts.map(([, , age]) => new Color4(0.5, 1, 0.85, Math.max(0.15, 1 - age / 10)));
      const line = MeshBuilder.CreateLines('echo', { points: pts, colors: cols, useVertexAlpha: true }, this.scene);
      line.isPickable = false;
      this.trails.push({ mesh: line, until: this.time + 8 });
      // direction arrowhead on the newest point
      if (pts.length >= 2) {
        const a = pts[pts.length - 2], b = pts[pts.length - 1];
        const head = MeshBuilder.CreateLines('echoHead', { points: [b.add(new Vector3(0, 2.5, 0)), b, a.add(b.subtract(a).normalize().scale(Vector3.Distance(a, b) - 1.2))], colors: [new Color4(0.5, 1, 0.85, 1), new Color4(0.5, 1, 0.85, 1), new Color4(0.5, 1, 0.85, 1)] }, this.scene);
        this.trails.push({ mesh: head, until: this.time + 8 });
      }
    }
  }

  // ---------------------------------------------------------------- per-frame sync
  syncProjectiles(list: ProjectileView[], alpha: number) {
    const seen = new Set<number>();
    for (const p of list) {
      seen.add(p.id);
      let m = this.projNodes.get(p.id);
      if (!m) {
        const s = this.scene;
        if (p.kind === 'rail') { m = MeshBuilder.CreateBox('railP', { width: 0.08, height: 0.08, depth: 3 }, s); m.material = mk(s, '#7ff3ff', 1.5, 0.9, true); }
        else if (p.kind === 'mist') { m = MeshBuilder.CreateSphere('mistP', { diameter: 0.3, segments: 6 }, s); m.material = mk(s, '#dfe8ee', 0.4); }
        else { m = MeshBuilder.CreateSphere('orbP', { diameter: p.kind === 'gale' ? 0.7 : 0.35, segments: 8 }, s); m.material = mk(s, '#bff4ff', 1.2, 0.8, true); }
        m.isPickable = false;
        this.projNodes.set(p.id, m);
      }
      const dt = alpha / 30;
      m.position.set(p.x + p.vx * dt, p.y + p.vy * dt, p.z + p.vz * dt);
      if (p.kind === 'rail') m.lookAt(m.position.add(new Vector3(p.vx, p.vy, p.vz)));
    }
    for (const [id, m] of this.projNodes) if (!seen.has(id)) { m.dispose(); this.projNodes.delete(id); }
  }

  syncSmokes(list: SmokeView[]) {
    const seen = new Set<number>();
    for (const s of list) {
      seen.add(s.id);
      let n = this.smokeNodes.get(s.id);
      if (!n) {
        n = new TransformNode('mist', this.scene);
        // identical boundary on every quality preset: same spheres, same radius
        const offs = [[0, 0, 0, 1], [0.45, -0.2, 0.2, 0.75], [-0.4, -0.25, -0.3, 0.75], [0.1, -0.3, -0.5, 0.7], [-0.2, 0.3, 0.4, 0.65], [0.3, 0.25, -0.3, 0.6]];
        for (const [ox, oy, oz, k] of offs) {
          const m = MeshBuilder.CreateSphere('mistS', { diameter: 2 * s.r * k, segments: 10 }, this.scene);
          m.material = this.mistMat; m.parent = n; m.position.set(ox * s.r, oy * s.r, oz * s.r); m.isPickable = false;
        }
        n.position.set(s.x, s.y, s.z);
        this.smokeNodes.set(s.id, n);
      }
      const grow = Math.min(1, (14 - s.left) / 0.8);
      const shrink = Math.min(1, s.left / 1.0);
      n.scaling.setAll(Math.max(0.05, Math.min(grow, shrink)));
    }
    for (const [id, n] of this.smokeNodes) if (!seen.has(id)) { n.dispose(); this.smokeNodes.delete(id); }
  }

  syncStorm(st: StormView, viewer: Vector3, active: boolean) {
    this.storm.setEnabled(active && st.cur.r < 800);
    this.storm.scaling.set(st.cur.r, 1, st.cur.r);
    this.storm.position.set(st.cur.x, 250, st.cur.z);
    this.stormMat.setFloat('time', this.time);
    this.stormMat.setFloat('radius', st.cur.r);
    this.stormMat.setFloat('alphaMul', this.effectsLow ? 0.95 : 1);
    const nx = st.next;
    this.nextRing.setEnabled(false); // next field is shown on the map/minimap
    if (nx) { this.nextRing.scaling.set(nx.r, 400, nx.r); this.nextRing.position.set(nx.x, 2 + viewer.y * 0, nx.z); }
    // motes: around the nearest wall section, drifting inward
    const dx = viewer.x - st.cur.x, dz = viewer.z - st.cur.z;
    const d = Math.hypot(dx, dz);
    const near = Math.abs(d - st.cur.r) < 80 && active && st.cur.r < 800;
    this.motes.setEnabled(near);
    if (near) {
      const baseA = Math.atan2(dz, dx);
      const buf = new Float32Array(this.moteData.length * 16);
      const count = this.effectsLow ? 120 : this.moteData.length;
      for (let i = 0; i < this.moteData.length; i++) {
        const m = this.moteData[i];
        const a = baseA + (m.a - Math.PI) * (40 / Math.max(st.cur.r, 40));
        const r = st.cur.r + 20 - ((m.r + this.time * 3 * m.s) % 40);
        const y = viewer.y - 5 + ((m.y + this.time * m.s) % 30);
        const sc = i < count ? 1 : 0;
        Matrix.Compose(new Vector3(sc, sc, sc), Quaternion.FromEulerAngles(this.time * m.s, i, 0), new Vector3(st.cur.x + Math.cos(a) * r, y, st.cur.z + Math.sin(a) * r)).copyToArray(buf, i * 16);
      }
      this.motes.thinInstanceSetBuffer('matrix', buf, 16, false);
    }
  }

  syncSkiff(s: SkiffView | null) {
    this.skiff.setEnabled(!!s && s.active);
    if (s && s.active) {
      this.skiff.position.set(s.x, s.y + 4, s.z);
      this.skiff.rotation.y = Math.atan2(s.dx, s.dz);
      this.skiff.rotation.z = Math.sin(this.time * 0.7) * 0.03;
    }
  }

  syncCapsules(list: CapsuleView[]) {
    const seen = new Set<number>();
    for (const c of list) {
      if (c.landed) continue;
      seen.add(c.id);
      let n = this.capsuleNodes.get(c.id);
      if (!n) {
        n = new TransformNode('capF', this.scene);
        const b = MeshBuilder.CreateCylinder('capFall', { height: 2.2, diameter: 1.4, tessellation: 10 }, this.scene); b.material = mk(this.scene, '#efe2c4', 0.2); b.parent = n;
        const ch = MeshBuilder.CreateSphere('chute', { diameter: 7, slice: 0.5, segments: 10 }, this.scene); ch.material = mk(this.scene, '#ffc23d', 0.4, 0.85); ch.parent = n; ch.position.y = 6;
        const beam = MeshBuilder.CreateCylinder('capBeam', { height: 400, diameter: 0.6, cap: Mesh.NO_CAP }, this.scene); beam.material = mk(this.scene, '#ffc23d', 1, 0.25, true); beam.parent = n; beam.position.y = -200;
        this.capsuleNodes.set(c.id, n);
      }
      n.position.set(c.x, c.y, c.z);
    }
    for (const [id, n] of this.capsuleNodes) if (!seen.has(id)) { n.dispose(); this.capsuleNodes.delete(id); }
  }

  syncCaravan(c: CaravanView | null) {
    const show = !!c && c.alive && c.exact;
    this.caravan.setEnabled(show);
    if (show && c) {
      this.caravan.position.set(c.x, c.y + Math.sin(this.time * 1.3) * 0.4, c.z);
      this.caravan.rotation.y = this.time * 0.4;
      this.caravanShield.visibility = 0.3 + (c.shield / c.shieldMax) * 0.7;
    }
  }

  syncMarker(m: { x: number; z: number } | null, groundY: number) {
    this.marker.setEnabled(!!m);
    if (m) this.marker.position.set(m.x, groundY + 150, m.z);
  }

  update(dt: number) {
    this.time += dt;
    for (const p of this.pool) {
      if (p.until < this.time) { if (p.mesh.isEnabled()) p.mesh.setEnabled(false); continue; }
      if (p.kind === 'puff') { const k = (this.time - (p.s0 ?? 0)) / 0.35; p.mesh.scaling.setAll(0.6 + k * 2.4); p.mesh.position.y += dt * 0.8; }
      if (p.kind === 'wind') { const k = (this.time - (p.s0 ?? 0)) / 0.45; p.mesh.scaling.setAll(Math.max(0.1, (p.v?.x ?? 4) * k)); (p.mesh.material as StandardMaterial).alpha = 0.4 * (1 - k); }
    }
    this.trails = this.trails.filter((t) => { if (t.until < this.time) { t.mesh.dispose(); return false; } return true; });
  }

  dispose() {
    this.lootNodes.forEach((e) => e.node.dispose());
    this.containerNodes.forEach((e) => e.node.dispose());
    this.projNodes.forEach((m) => m.dispose());
    this.smokeNodes.forEach((n) => n.dispose());
  }
}

export type { InstancedMesh };
