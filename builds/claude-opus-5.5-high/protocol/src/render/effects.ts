// Client-only, pooled effects: tracers, decals, particles, smoke volumes,
// thermite cells, grenades, dropped items, the Cipher device, explosions.
// Smoke spheres are drawn exactly at the authoritative radius (parity).

import {
  Color3, Color4, Mesh, MeshBuilder, ParticleSystem, Scene, StandardMaterial, TransformNode, Vector3, VertexData,
  type InstancedMesh,
} from '@babylonjs/core';
import { SMOKE } from '../content/rules';
import type { Snapshot, SnapFire } from '../protocol/messages';
import { clamp } from '../sim/math';
import type { ModelLibrary } from './models';
import type { TextureSet } from './textures';

const DT = 1 / 64;

function emissiveMat(scene: Scene, name: string, c: Color3, alpha = 1): StandardMaterial {
  const m = new StandardMaterial(name, scene);
  m.emissiveColor = c;
  m.diffuseColor = Color3.Black();
  m.specularColor = Color3.Black();
  m.disableLighting = true;
  m.alpha = alpha;
  return m;
}

interface Tracer {
  mesh: Mesh;
  t: number;
}

export class Effects {
  readonly scene: Scene;
  private lib: ModelLibrary;
  private tex: TextureSet;
  private tracers: Tracer[] = [];
  private decals: Mesh[] = [];
  private decalIdx = 0;
  private sparks: ParticleSystem;
  private dust: ParticleSystem;
  private blood: ParticleSystem;
  private embers: ParticleSystem;
  private smokeMaster: Mesh;
  private smokes = new Map<number, { node: TransformNode; puffs: InstancedMesh[]; offsets: Vector3[] }>();
  private fires = new Map<number, { mesh: Mesh; edge: Mesh; cells: number[] }>();
  private grenades = new Map<number, InstancedMesh>();
  private drops = new Map<number, { node: TransformNode; led: Mesh | null }>();
  private shards = new Map<number, { mesh: InstancedMesh; ring: Mesh; ringT: number }>();
  private spike: { node: TransformNode; led: Mesh; ledMat: StandardMaterial } | null = null;
  private flashes: { mesh: Mesh; t: number; dur: number; scale: number }[] = [];
  private flashMat: StandardMaterial;
  private fireMat: StandardMaterial;
  private edgeMat: StandardMaterial;
  private ringMat: StandardMaterial;
  private blastMat: StandardMaterial;
  private muzzleMat: StandardMaterial;
  private ledOnUntil = 0;
  private time = 0;
  quality: 'low' | 'medium' | 'high' = 'medium';

  constructor(scene: Scene, lib: ModelLibrary, tex: TextureSet) {
    this.scene = scene;
    this.lib = lib;
    this.tex = tex;
    const tracerMat = emissiveMat(scene, 'fx-tracer', new Color3(1, 0.88, 0.6), 0.75);
    for (let i = 0; i < 48; i++) {
      const m = MeshBuilder.CreateBox('tracer', { width: 0.014, height: 0.014, depth: 1 }, scene);
      m.material = tracerMat;
      m.isPickable = false;
      m.setEnabled(false);
      this.tracers.push({ mesh: m, t: 0 });
    }
    const decalMat = new StandardMaterial('fx-decal', scene);
    decalMat.diffuseTexture = tex.decal;
    decalMat.diffuseTexture.hasAlpha = true;
    decalMat.useAlphaFromDiffuseTexture = true;
    decalMat.specularColor = Color3.Black();
    decalMat.backFaceCulling = false;
    decalMat.zOffset = -2;
    const cap = this.quality === 'low' ? 60 : 120;
    for (let i = 0; i < cap; i++) {
      const d = MeshBuilder.CreatePlane('decal', { size: 0.11 }, scene);
      d.material = decalMat;
      d.isPickable = false;
      d.setEnabled(false);
      this.decals.push(d);
    }
    const ps = (name: string, cap: number, c1: Color4, c2: Color4, size: [number, number], life: [number, number], grav: number, power: [number, number]) => {
      const p = new ParticleSystem(name, cap, scene);
      p.particleTexture = tex.soft;
      p.emitter = Vector3.Zero();
      p.emitRate = 0;
      p.minSize = size[0];
      p.maxSize = size[1];
      p.minLifeTime = life[0];
      p.maxLifeTime = life[1];
      p.color1 = c1;
      p.color2 = c2;
      p.colorDead = new Color4(c2.r, c2.g, c2.b, 0);
      p.gravity = new Vector3(0, grav, 0);
      p.minEmitPower = power[0];
      p.maxEmitPower = power[1];
      p.direction1 = new Vector3(-1, 1, -1);
      p.direction2 = new Vector3(1, 1, 1);
      p.minEmitBox = Vector3.Zero();
      p.maxEmitBox = Vector3.Zero();
      p.updateSpeed = 1 / 60;
      p.start();
      return p;
    };
    this.sparks = ps('sparks', 600, new Color4(1, 0.9, 0.5, 1), new Color4(1, 0.5, 0.2, 1), [0.02, 0.05], [0.1, 0.3], -9, [2, 5]);
    this.sparks.blendMode = ParticleSystem.BLENDMODE_ADD;
    this.dust = ps('dust', 500, new Color4(0.7, 0.68, 0.64, 0.5), new Color4(0.5, 0.5, 0.5, 0.25), [0.12, 0.35], [0.4, 0.9], -1, [0.4, 1.4]);
    this.blood = ps('blood', 300, new Color4(0.45, 0.04, 0.04, 0.85), new Color4(0.3, 0.02, 0.02, 0.6), [0.05, 0.12], [0.2, 0.45], -6, [0.6, 1.8]);
    this.embers = ps('embers', 1200, new Color4(1, 0.7, 0.2, 1), new Color4(1, 0.3, 0.05, 0.8), [0.06, 0.2], [0.3, 0.9], 2.5, [0.5, 2]);
    this.embers.blendMode = ParticleSystem.BLENDMODE_ADD;

    const sm = new StandardMaterial('fx-smoke', scene);
    sm.diffuseTexture = tex.smoke;
    sm.emissiveColor = new Color3(0.55, 0.56, 0.58);
    sm.specularColor = Color3.Black();
    sm.alpha = 0.985;
    sm.backFaceCulling = false;
    this.smokeMaster = MeshBuilder.CreateSphere('smoke', { diameter: 2, segments: 14 }, scene);
    this.smokeMaster.material = sm;
    this.smokeMaster.isVisible = false;
    this.smokeMaster.isPickable = false;

    this.flashMat = emissiveMat(scene, 'fx-flash', new Color3(1, 1, 1), 0.9);
    this.flashMat.opacityTexture = tex.soft;
    this.muzzleMat = emissiveMat(scene, 'fx-muzzle', new Color3(1, 0.8, 0.45), 0.95);
    this.muzzleMat.opacityTexture = tex.soft;
    this.fireMat = emissiveMat(scene, 'fx-fire', new Color3(1, 0.45, 0.12), 0.85);
    this.fireMat.diffuseTexture = tex.flame;
    this.fireMat.emissiveTexture = tex.flame;
    this.fireMat.backFaceCulling = false;
    this.edgeMat = emissiveMat(scene, 'fx-fire-edge', new Color3(1, 0.95, 0.6));
    this.ringMat = emissiveMat(scene, 'fx-ring', Color3.FromHexString('#4ff0ff'), 0.7);
    this.blastMat = emissiveMat(scene, 'fx-blast', new Color3(1, 0.75, 0.4), 0.8);
    this.blastMat.opacityTexture = tex.soft;
  }

  // ---------------------------------------------------------------- events
  tracer(ox: number, oy: number, oz: number, ex: number, ey: number, ez: number, own: boolean): void {
    const start = new Vector3(ox, oy, oz);
    const end = new Vector3(ex, ey, ez);
    const dir = end.subtract(start);
    const len = dir.length();
    if (len < 0.5) return;
    dir.scaleInPlace(1 / len);
    const s0 = start.add(dir.scale(own ? 1.8 : 0.6)).add(own ? new Vector3(0, -0.12, 0) : Vector3.Zero());
    const segLen = Math.min(len - (own ? 1.8 : 0.6), 14);
    if (segLen <= 0.2) return;
    const tr = this.tracers.find((t) => t.t <= 0) ?? this.tracers[0];
    const mid = s0.add(dir.scale(segLen / 2 + Math.max(0, len - segLen - 2) * 0.35));
    tr.mesh.position.copyFrom(mid);
    tr.mesh.scaling.z = segLen;
    tr.mesh.lookAt(mid.add(dir));
    tr.mesh.setEnabled(true);
    tr.t = 0.06;
  }

  impact(x: number, y: number, z: number, nx: number, ny: number, nz: number, flesh: boolean, mat: string): void {
    const p = new Vector3(x, y, z);
    if (flesh) {
      this.blood.emitter = p;
      this.blood.manualEmitCount = 6;
      return;
    }
    const n = new Vector3(nx, ny, nz);
    const d = this.decals[this.decalIdx++ % this.decals.length];
    d.position.copyFrom(p.add(n.scale(0.008)));
    d.lookAt(p.add(n));
    d.rotation.z = Math.random() * Math.PI;
    d.setEnabled(true);
    this.sparks.emitter = p.add(n.scale(0.02));
    this.sparks.direction1 = n.add(new Vector3(-0.6, -0.2, -0.6));
    this.sparks.direction2 = n.add(new Vector3(0.6, 0.8, 0.6));
    this.sparks.manualEmitCount = mat === 'glass' ? 3 : 7;
    this.dust.emitter = p.add(n.scale(0.05));
    this.dust.direction1 = n.scale(0.5).add(new Vector3(-0.3, 0, -0.3));
    this.dust.direction2 = n.scale(1).add(new Vector3(0.3, 0.5, 0.3));
    this.dust.manualEmitCount = 3;
  }

  muzzle(pos: Vector3, scale = 0.3): void {
    const m = MeshBuilder.CreatePlane('muzzle', { size: 1 }, this.scene);
    m.material = this.muzzleMat;
    m.billboardMode = Mesh.BILLBOARDMODE_ALL;
    m.position.copyFrom(pos);
    m.scaling.setAll(scale);
    m.isPickable = false;
    this.flashes.push({ mesh: m, t: 0, dur: 0.05, scale });
  }

  burst(pos: Vector3, scale: number, dur: number, mat: 'flash' | 'blast'): void {
    const m = MeshBuilder.CreatePlane('burst', { size: 1 }, this.scene);
    m.material = mat === 'flash' ? this.flashMat : this.blastMat;
    m.billboardMode = Mesh.BILLBOARDMODE_ALL;
    m.position.copyFrom(pos);
    m.isPickable = false;
    this.flashes.push({ mesh: m, t: 0, dur, scale });
  }

  explosion(x: number, y: number, z: number, big: boolean): void {
    const p = new Vector3(x, y + 0.3, z);
    this.burst(p, big ? 14 : 6, big ? 0.6 : 0.35, 'blast');
    this.embers.emitter = p;
    this.embers.manualEmitCount = big ? 300 : 90;
    this.dust.emitter = p;
    this.dust.direction1 = new Vector3(-2, 0.2, -2);
    this.dust.direction2 = new Vector3(2, 2, 2);
    this.dust.manualEmitCount = big ? 120 : 40;
  }

  flashDet(x: number, y: number, z: number): void {
    this.burst(new Vector3(x, y, z), 5, 0.25, 'flash');
    this.sparks.emitter = new Vector3(x, y, z);
    this.sparks.direction1 = new Vector3(-1, -1, -1);
    this.sparks.direction2 = new Vector3(1, 1, 1);
    this.sparks.manualEmitCount = 40;
  }

  pulseRing(x: number, y: number, z: number): void {
    const s = [...this.shards.values()].find((v) => Math.abs(v.mesh.position.x - x) < 0.5 && Math.abs(v.mesh.position.z - z) < 0.5);
    if (s) s.ringT = 0.001;
  }

  spikeBeep(until: number): void {
    this.ledOnUntil = until;
  }

  // ---------------------------------------------------------------- per-frame sync with snapshot
  sync(snap: Snapshot, tick: number, dt: number): void {
    this.time += dt;
    // tracers & flashes
    for (const t of this.tracers) {
      if (t.t > 0) {
        t.t -= dt;
        if (t.t <= 0) t.mesh.setEnabled(false);
      }
    }
    this.flashes = this.flashes.filter((f) => {
      f.t += dt;
      const k = f.t / f.dur;
      if (k >= 1) {
        f.mesh.dispose();
        return false;
      }
      f.mesh.scaling.setAll(f.scale * (0.6 + k * 0.6));
      f.mesh.visibility = 1 - k;
      return true;
    });

    // smokes
    const seenS = new Set<number>();
    for (const s of snap.smokes) {
      seenS.add(s.id);
      let e = this.smokes.get(s.id);
      if (!e) {
        const node = new TransformNode('smoke' + s.id, this.scene);
        node.position.set(s.x, s.y, s.z);
        const puffs: InstancedMesh[] = [];
        const offsets: Vector3[] = [];
        // core sphere = authoritative boundary; inner puffs add texture but never exceed it
        const core = this.smokeMaster.createInstance('smk');
        core.parent = node;
        puffs.push(core);
        offsets.push(Vector3.Zero());
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + s.id;
          const off = new Vector3(Math.cos(a) * 0.36, i % 2 ? 0.14 : -0.12, Math.sin(a) * 0.36);
          const pf = this.smokeMaster.createInstance('smk');
          pf.parent = node;
          puffs.push(pf);
          offsets.push(off);
        }
        e = { node, puffs, offsets };
        this.smokes.set(s.id, e);
      }
      const r = smokeRadiusAt(s.radius, s.startTick, s.endTick, tick);
      e.puffs.forEach((pf, i) => {
        const o = e!.offsets[i];
        if (i === 0) pf.scaling.setAll(r);
        else {
          pf.position.set(o.x * r, o.y * r, o.z * r);
          pf.scaling.setAll(r * 0.6); // offset (<=0.39r) + 0.6r stays inside the authoritative sphere
        }
        pf.rotation.y = this.time * 0.05 * (i % 2 ? 1 : -1) + i;
      });
    }
    for (const [id, e] of this.smokes) if (!seenS.has(id)) {
      e.node.dispose();
      this.smokes.delete(id);
    }

    // fires
    const seenF = new Set<number>();
    for (const f of snap.fires) {
      seenF.add(f.id);
      if (!this.fires.has(f.id)) this.fires.set(f.id, this.buildFire(f));
      const e = this.fires.get(f.id)!;
      const left = (f.endTick - tick) / 64;
      e.mesh.visibility = 0.7 + 0.25 * Math.sin(this.time * 17 + f.id) * Math.min(1, left);
      // embers from random cells
      if (Math.random() < (this.quality === 'low' ? 0.3 : 0.8)) {
        const k = Math.floor(Math.random() * (e.cells.length / 3)) * 3;
        this.embers.emitter = new Vector3(e.cells[k], e.cells[k + 1] + 0.05, e.cells[k + 2]);
        this.embers.direction1 = new Vector3(-0.3, 1, -0.3);
        this.embers.direction2 = new Vector3(0.3, 2, 0.3);
        this.embers.manualEmitCount = 4;
      }
    }
    for (const [id, e] of this.fires) if (!seenF.has(id)) {
      e.mesh.dispose();
      e.edge.dispose();
      this.fires.delete(id);
    }

    // grenades in flight
    const seenG = new Set<number>();
    for (const g of snap.grenades) {
      seenG.add(g.id);
      let m = this.grenades.get(g.id);
      if (!m) {
        m = this.lib.instance(g.type, 'gren');
        this.grenades.set(g.id, m);
      }
      m.position.set(g.x, g.y - 0.05, g.z);
      m.rotation.x += dt * 9;
      m.rotation.z += dt * 5;
    }
    for (const [id, m] of this.grenades) if (!seenG.has(id)) {
      m.dispose();
      this.grenades.delete(id);
    }

    // pulse shards
    const seenP = new Set<number>();
    for (const s of snap.shards) {
      seenP.add(s.id);
      let e = this.shards.get(s.id);
      if (!e) {
        const mesh = this.lib.instance('pulse', 'shard');
        mesh.position.set(s.x, s.y, s.z);
        const ring = MeshBuilder.CreateTorus('pring', { diameter: 1, thickness: 0.05, tessellation: 40 }, this.scene);
        ring.material = this.ringMat;
        ring.position.set(s.x, s.y + 0.1, s.z);
        ring.isPickable = false;
        ring.setEnabled(false);
        e = { mesh, ring, ringT: 0 };
        this.shards.set(s.id, e);
      }
      e.mesh.rotation.y += dt * 2;
      if (e.ringT > 0) {
        e.ringT += dt;
        const k = e.ringT / 0.9;
        e.ring.setEnabled(k < 1);
        e.ring.scaling.setAll(1 + k * 30);
        e.ring.visibility = 1 - k;
        if (k >= 1) e.ringT = 0;
      }
    }
    for (const [id, e] of this.shards) if (!seenP.has(id)) {
      e.mesh.dispose();
      e.ring.dispose();
      this.shards.delete(id);
    }

    // drops
    const seenD = new Set<number>();
    for (const d of snap.drops) {
      seenD.add(d.id);
      let e = this.drops.get(d.id);
      if (!e) {
        const node = new TransformNode('drop', this.scene);
        const m = this.lib.instance(d.item, 'dropm');
        m.parent = node;
        let led: Mesh | null = null;
        if (d.item === 'spike') {
          led = MeshBuilder.CreateSphere('led', { diameter: 0.05 }, this.scene);
          led.material = emissiveMat(this.scene, 'led', new Color3(1, 0.1, 0.6));
          led.parent = node;
          led.position.set(-0.05, 0.19, 0.08);
        } else m.rotation.z = Math.PI / 2;
        node.position.set(d.x, d.y, d.z);
        node.rotation.y = d.yaw;
        e = { node, led };
        this.drops.set(d.id, e);
      }
      if (e.led) e.led.isVisible = Math.floor(this.time * 2) % 2 === 0;
    }
    for (const [id, e] of this.drops) if (!seenD.has(id)) {
      e.node.dispose();
      this.drops.delete(id);
    }

    // planted cipher device
    const sp = snap.spike;
    const show = sp.state === 'planted' || sp.state === 'defused';
    if (show && sp.known) {
      if (!this.spike) {
        const node = new TransformNode('spike-planted', this.scene);
        const m = this.lib.instance('spike', 'spk');
        m.parent = node;
        const ledMat = emissiveMat(this.scene, 'spk-led', new Color3(1, 0.1, 0.6));
        const led = MeshBuilder.CreateSphere('spk-led', { diameter: 0.07 }, this.scene);
        led.material = ledMat;
        led.parent = node;
        led.position.set(-0.05, 0.2, 0.08);
        this.spike = { node, led, ledMat };
      }
      this.spike.node.position.set(sp.x, sp.y, sp.z);
      const on = sp.state === 'planted' ? this.time < this.ledOnUntil : false;
      this.spike.ledMat.emissiveColor = sp.state === 'defused' ? new Color3(0.1, 1, 0.5) : on ? new Color3(1, 0.2, 0.7) : new Color3(0.2, 0.02, 0.12);
    } else if (this.spike) {
      this.spike.node.dispose();
      this.spike = null;
    }
  }

  now(): number {
    return this.time;
  }

  private buildFire(f: SnapFire): { mesh: Mesh; edge: Mesh; cells: number[] } {
    const h = 0.25;
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    const set = new Set<string>();
    for (let i = 0; i < f.cells.length; i += 3) set.add(`${Math.round(f.cells[i] * 2)},${Math.round(f.cells[i + 2] * 2)}`);
    const epos: number[] = [];
    const eidx: number[] = [];
    const edgeQuad = (ax: number, az: number, bx: number, bz: number, y: number) => {
      const b = epos.length / 3;
      const nx = -(bz - az);
      const nz = bx - ax;
      const l = Math.hypot(nx, nz) || 1;
      const w = 0.035;
      epos.push(ax - (nx / l) * w, y, az - (nz / l) * w, bx - (nx / l) * w, y, bz - (nz / l) * w, bx + (nx / l) * w, y, bz + (nz / l) * w, ax + (nx / l) * w, y, az + (nz / l) * w);
      eidx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    };
    for (let i = 0; i < f.cells.length; i += 3) {
      const x = f.cells[i];
      const y = f.cells[i + 1];
      const z = f.cells[i + 2];
      const b = pos.length / 3;
      pos.push(x - h, y, z - h, x - h, y, z + h, x + h, y, z + h, x + h, y, z - h);
      uv.push((x - h) / 2, (z - h) / 2, (x - h) / 2, (z + h) / 2, (x + h) / 2, (z + h) / 2, (x + h) / 2, (z - h) / 2);
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
      const kx = Math.round(x * 2);
      const kz = Math.round(z * 2);
      const ey = y + 0.01;
      if (!set.has(`${kx - 1},${kz}`)) edgeQuad(x - h, z - h, x - h, z + h, ey);
      if (!set.has(`${kx + 1},${kz}`)) edgeQuad(x + h, z - h, x + h, z + h, ey);
      if (!set.has(`${kx},${kz - 1}`)) edgeQuad(x - h, z - h, x + h, z - h, ey);
      if (!set.has(`${kx},${kz + 1}`)) edgeQuad(x - h, z + h, x + h, z + h, ey);
    }
    const mesh = new Mesh('fire', this.scene);
    const vd = new VertexData();
    vd.positions = pos;
    vd.uvs = uv;
    vd.indices = idx;
    const nrm: number[] = [];
    VertexData.ComputeNormals(pos, idx, nrm);
    vd.normals = nrm;
    vd.applyToMesh(mesh);
    mesh.material = this.fireMat;
    mesh.isPickable = false;
    const edge = new Mesh('fire-edge', this.scene);
    const ev = new VertexData();
    ev.positions = epos;
    ev.indices = eidx;
    const en: number[] = [];
    VertexData.ComputeNormals(epos, eidx, en);
    ev.normals = en;
    ev.applyToMesh(edge);
    edge.material = this.edgeMat;
    edge.isPickable = false;
    return { mesh, edge, cells: f.cells };
  }

  clearRound(): void {
    for (const d of this.decals) d.setEnabled(false);
  }
}

/** Mirror of the server's smoke radius schedule, from snapshot ticks only. */
export function smokeRadiusAt(radius: number, start: number, end: number, tick: number): number {
  const age = (tick - start) * DT;
  const left = (end - tick) * DT;
  let r = radius * clamp(age / SMOKE.bloomTime, 0.15, 1);
  if (left < 1.5) r *= clamp(left / 1.5, 0, 1);
  return r;
}
