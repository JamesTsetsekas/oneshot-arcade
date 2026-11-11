// World effects: tracers, impacts, pooled decals, utility volumes, projectiles, dropped items, the Spike.
// Gameplay-relevant volumes (Veil, Thermite) are drawn from the server's authoritative shapes and are
// identical on every quality preset; only cosmetic particles are pooled and limited.
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TICK_RATE, UTIL_TUNING, beepInterval } from '../content/rules';
import type { ImpactInfo, WorldSnap } from '../protocol/types';
import { Rng } from '../shared/math';
import type { RenderCore } from './core';
import { Geom, type RGB } from './geom';
import { buildModel } from './models';
import { drawFlame, drawHole, drawRing, drawSmoke, drawSoft, makeTexture, unlit } from './textures';

const MAX_DECALS = 120;

interface Puff {
  mesh: Mesh;
  life: number;
  max: number;
  grow: number;
  vx: number;
  vy: number;
  vz: number;
  base: number;
}

interface Tracer {
  mesh: Mesh;
  life: number;
}

interface Burst {
  mesh: Mesh;
  life: number;
  max: number;
  from: number;
  to: number;
  flat: boolean;
}

export class Fx {
  private tracers: Tracer[] = [];
  private puffs: Puff[] = [];
  private bursts: Burst[] = [];
  private puffMats: Record<string, StandardMaterial> = {};
  private decalMesh: Mesh;
  private decalBuf = new Float32Array(MAX_DECALS * 16);
  private decalIdx = 0;
  private grenades = new Map<number, Mesh>();
  private veils = new Map<number, Mesh>();
  private fires = new Map<number, { fill: Mesh; edge: Mesh; flames: Mesh }>();
  private shards = new Map<number, Mesh>();
  private items = new Map<number, Mesh>();
  private spikeMesh: Mesh;
  private spikeGlow: Mesh;
  private templates = new Map<string, Mesh>();
  private smokeMat: StandardMaterial;
  private fireFillMat: StandardMaterial;
  private fireEdgeMat: StandardMaterial;
  private flameMat: StandardMaterial;
  private burstMat: StandardMaterial;
  private ringMat: StandardMaterial;
  private whiteMat: StandardMaterial;
  private trajMesh: Mesh;
  private trajBuf = new Float32Array(48 * 16);
  private rng = new Rng(99);
  private time = 0;
  lastBeepIndex = -1;
  onBeep: (x: number, y: number, z: number, remaining: number) => void = () => {};

  constructor(private core: RenderCore) {
    const scene = core.scene;
    const soft = makeTexture(scene, 'soft', 64, drawSoft, true);
    const mkPuff = (name: string, color: RGB, add = false): void => {
      const m = unlit(scene, 'puff_' + name, color);
      m.opacityTexture = soft;
      m.backFaceCulling = false;
      if (add) m.alphaMode = 1;
      this.puffMats[name] = m;
    };
    mkPuff('dust', [0.78, 0.76, 0.72]);
    mkPuff('wood', [0.72, 0.58, 0.38]);
    mkPuff('soil', [0.42, 0.33, 0.24]);
    mkPuff('spark', [1.0, 0.82, 0.45], true);
    mkPuff('glass', [0.85, 0.96, 1.0]);
    mkPuff('flesh', [0.5, 0.07, 0.07]);
    mkPuff('fire', [1.0, 0.55, 0.15], true);
    mkPuff('smoke', [0.3, 0.3, 0.32]);

    // tracers
    const tracerMat = unlit(scene, 'tracer', [1.0, 0.9, 0.62], 0.9);
    tracerMat.alphaMode = 1;
    tracerMat.backFaceCulling = false;
    const tg = new Geom();
    tg.quad([-0.012, 0, 0], [0.012, 0, 0], [0.012, 0, 1], [-0.012, 0, 1], [0, 1, 0], [1, 1, 1]);
    tg.quad([0, -0.012, 0], [0, 0.012, 0], [0, 0.012, 1], [0, -0.012, 1], [1, 0, 0], [1, 1, 1]);
    const tsrc = tg.build('tracer', scene, tracerMat);
    tsrc.useVertexColors = false;
    tsrc.setEnabled(false);
    for (let i = 0; i < 40; i++) {
      const m = i === 0 ? tsrc : tsrc.clone('tracer' + i);
      m.setEnabled(false);
      this.tracers.push({ mesh: m, life: 0 });
    }
    // puff pool
    const pg = new Geom();
    pg.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], [0, 0, -1], [1, 1, 1]);
    const psrc = pg.build('puff', scene, this.puffMats.dust);
    psrc.useVertexColors = false;
    psrc.billboardMode = Mesh.BILLBOARDMODE_ALL;
    psrc.setEnabled(false);
    for (let i = 0; i < 72; i++) {
      const m = i === 0 ? psrc : psrc.clone('puff' + i);
      m.billboardMode = Mesh.BILLBOARDMODE_ALL;
      m.setEnabled(false);
      this.puffs.push({ mesh: m, life: 0, max: 1, grow: 0, vx: 0, vy: 0, vz: 0, base: 0.1 });
    }
    // decals: one mesh, thin instances
    const holeMat = new StandardMaterial('hole', scene);
    holeMat.disableLighting = true;
    holeMat.emissiveColor = new Color3(1, 1, 1);
    holeMat.diffuseTexture = makeTexture(scene, 'holetex', 64, drawHole, true);
    holeMat.diffuseTexture.hasAlpha = true;
    holeMat.useAlphaFromDiffuseTexture = true;
    holeMat.zOffset = -2;
    holeMat.backFaceCulling = false;
    const dg = new Geom();
    dg.quad([-0.5, -0.5, 0], [0.5, -0.5, 0], [0.5, 0.5, 0], [-0.5, 0.5, 0], [0, 0, 1], [1, 1, 1]);
    this.decalMesh = dg.build('decals', scene, holeMat);
    this.decalMesh.useVertexColors = false;
    this.decalMesh.thinInstanceSetBuffer('matrix', this.decalBuf, 16, false);
    this.decalMesh.alwaysSelectAsActiveMesh = true;

    // utility volume materials
    this.smokeMat = new StandardMaterial('veil', scene);
    this.smokeMat.disableLighting = true;
    this.smokeMat.emissiveColor = new Color3(1, 1, 1);
    this.smokeMat.diffuseTexture = makeTexture(scene, 'smoketex', 128, drawSmoke);
    this.smokeMat.backFaceCulling = false;
    this.fireFillMat = unlit(scene, 'firefill', [1.0, 0.42, 0.08], 0.34);
    this.fireFillMat.backFaceCulling = false;
    this.fireFillMat.zOffset = -1;
    this.fireEdgeMat = unlit(scene, 'fireedge', [1.0, 0.8, 0.25]);
    this.fireEdgeMat.backFaceCulling = false;
    this.fireEdgeMat.zOffset = -2;
    this.flameMat = new StandardMaterial('flame', scene);
    this.flameMat.disableLighting = true;
    this.flameMat.emissiveColor = new Color3(1, 1, 1);
    const ft = makeTexture(scene, 'flametex', 128, drawFlame, true);
    this.flameMat.diffuseTexture = ft;
    this.flameMat.useAlphaFromDiffuseTexture = true;
    this.flameMat.backFaceCulling = false;
    this.burstMat = unlit(scene, 'burst', [1.0, 0.66, 0.25], 0.85);
    this.burstMat.backFaceCulling = false;
    this.whiteMat = unlit(scene, 'white', [1, 1, 1], 0.9);
    this.whiteMat.backFaceCulling = false;
    this.ringMat = unlit(scene, 'ring', [0.3, 0.92, 1.0]);
    this.ringMat.opacityTexture = makeTexture(scene, 'ringtex', 256, drawRing, true);
    this.ringMat.backFaceCulling = false;
    this.ringMat.alphaMode = 1;

    // spike
    const sg = new Geom();
    buildModel('spike', sg);
    this.spikeMesh = sg.build('spike', scene, core.lit);
    this.spikeMesh.setEnabled(false);
    const gg = new Geom();
    gg.sphere(0, 0, 0, 0.5, [1, 1, 1], 8, 6);
    const glowMat = unlit(scene, 'spikeglow', [1.0, 0.2, 0.7], 0.85);
    glowMat.alphaMode = 1;
    this.spikeGlow = gg.build('spikeglow', scene, glowMat);
    this.spikeGlow.useVertexColors = false;
    this.spikeGlow.setEnabled(false);

    // trajectory preview dots
    const dg2 = new Geom();
    dg2.sphere(0, 0, 0, 0.5, [1, 1, 1], 6, 4);
    const trajMat = unlit(scene, 'traj', [0.4, 1.0, 0.85]);
    this.trajMesh = dg2.build('traj', scene, trajMat);
    this.trajMesh.useVertexColors = false;
    this.trajMesh.thinInstanceSetBuffer('matrix', this.trajBuf, 16, false);
    this.trajMesh.alwaysSelectAsActiveMesh = true;
    this.trajMesh.setEnabled(false);
  }

  private template(name: string): Mesh {
    let t = this.templates.get(name);
    if (!t) {
      const g = new Geom();
      buildModel(name, g);
      t = g.build('tpl_' + name, this.core.scene, this.core.lit);
      t.setEnabled(false);
      this.templates.set(name, t);
    }
    return t;
  }

  // ------------------------------------------------------------------ one-shot effects
  tracer(fx: number, fy: number, fz: number, tx: number, ty: number, tz: number): void {
    const d = Math.hypot(tx - fx, ty - fy, tz - fz);
    if (d < 1.5) return;
    let best = this.tracers[0];
    for (const t of this.tracers) if (t.life < best.life) best = t;
    best.life = 0.075;
    const m = best.mesh;
    m.setEnabled(true);
    m.position.set(fx, fy, fz);
    m.lookAt(new Vector3(tx, ty, tz));
    m.scaling.set(1, 1, d);
    m.visibility = 0.9;
  }

  private puff(kind: string, x: number, y: number, z: number, size: number, life: number, grow: number, vx = 0, vy = 0, vz = 0): void {
    let best = this.puffs[0];
    for (const p of this.puffs) if (p.life < best.life) best = p;
    best.life = best.max = life;
    best.grow = grow;
    best.base = size;
    best.vx = vx;
    best.vy = vy;
    best.vz = vz;
    const m = best.mesh;
    m.material = this.puffMats[kind] ?? this.puffMats.dust;
    m.position.set(x, y, z);
    m.scaling.setAll(size);
    m.visibility = 1;
    m.setEnabled(true);
  }

  impact(i: ImpactInfo, blood: boolean): void {
    const r = this.rng;
    const ox = i.x + i.nx * 0.04;
    const oy = i.y + i.ny * 0.04;
    const oz = i.z + i.nz * 0.04;
    if (i.kind === 'p') {
      this.puff(blood ? 'flesh' : 'spark', ox, oy, oz, 0.16, 0.22, 0.6, i.nx * 0.5, 0.2, i.nz * 0.5);
      return;
    }
    const kind = i.mat === 'wood' ? 'wood' : i.mat === 'soil' ? 'soil' : i.mat === 'glass' ? 'glass' : 'dust';
    this.puff(kind, ox, oy, oz, 0.14, 0.34, 0.9, i.nx * 0.7 + r.range(-0.2, 0.2), i.ny * 0.7 + 0.25, i.nz * 0.7 + r.range(-0.2, 0.2));
    if (i.mat === 'metal' || i.mat === 'grate' || i.mat === 'concrete' || i.mat === 'trim') this.puff('spark', ox, oy, oz, 0.09, 0.09, 0.5);
    this.decal(i.x + i.nx * 0.012, i.y + i.ny * 0.012, i.z + i.nz * 0.012, i.nx, i.ny, i.nz, i.mat === 'glass' ? 0.14 : r.range(0.045, 0.065));
  }

  private decal(x: number, y: number, z: number, nx: number, ny: number, nz: number, s: number): void {
    const o = this.decalIdx * 16;
    this.decalIdx = (this.decalIdx + 1) % MAX_DECALS;
    const ux = Math.abs(ny) > 0.9 ? 1 : 0;
    const uy = Math.abs(ny) > 0.9 ? 0 : 1;
    const uz = 0;
    // right = up x n
    let rx = uy * nz - uz * ny;
    let ry = uz * nx - ux * nz;
    let rz = ux * ny - uy * nx;
    const rl = Math.hypot(rx, ry, rz) || 1;
    rx /= rl;
    ry /= rl;
    rz /= rl;
    const vx = ny * rz - nz * ry;
    const vy = nz * rx - nx * rz;
    const vz = nx * ry - ny * rx;
    const b = this.decalBuf;
    b[o] = rx * s;
    b[o + 1] = ry * s;
    b[o + 2] = rz * s;
    b[o + 3] = 0;
    b[o + 4] = vx * s;
    b[o + 5] = vy * s;
    b[o + 6] = vz * s;
    b[o + 7] = 0;
    b[o + 8] = nx * s;
    b[o + 9] = ny * s;
    b[o + 10] = nz * s;
    b[o + 11] = 0;
    b[o + 12] = x;
    b[o + 13] = y;
    b[o + 14] = z;
    b[o + 15] = 1;
    this.decalMesh.thinInstanceBufferUpdated('matrix');
  }

  clearRound(): void {
    this.decalBuf.fill(0);
    this.decalMesh.thinInstanceBufferUpdated('matrix');
    this.lastBeepIndex = -1;
  }

  private burst(x: number, y: number, z: number, from: number, to: number, life: number, mat: StandardMaterial, flat = false): void {
    const g = new Geom();
    if (flat) g.quad([-1, 0, -1], [1, 0, -1], [1, 0, 1], [-1, 0, 1], [0, 1, 0], [1, 1, 1]);
    else g.sphere(0, 0, 0, 1, [1, 1, 1], 12, 8);
    const mesh = g.build('burst', this.core.scene, mat);
    mesh.useVertexColors = false;
    mesh.position.set(x, y, z);
    mesh.scaling.setAll(from);
    this.bursts.push({ mesh, life, max: life, from, to, flat });
  }

  explosion(x: number, y: number, z: number): void {
    this.burst(x, y + 0.3, z, 0.4, 3.4, 0.28, this.burstMat);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * 6.28;
      this.puff(i % 3 ? 'smoke' : 'fire', x + Math.cos(a) * 0.6, y + 0.5, z + Math.sin(a) * 0.6, 0.9, 0.8, 2.2, Math.cos(a) * 3, 1.6, Math.sin(a) * 3);
    }
  }

  flashPop(x: number, y: number, z: number): void {
    this.burst(x, y, z, 0.2, 1.6, 0.12, this.whiteMat);
  }

  veilPop(x: number, y: number, z: number): void {
    for (let i = 0; i < 6; i++) this.puff('dust', x, y - 0.8, z, 0.8, 0.7, 3, this.rng.range(-2, 2), 0.6, this.rng.range(-2, 2));
  }

  pulse(x: number, y: number, z: number): void {
    this.burst(x, y + 0.05, z, 0.5, UTIL_TUNING.pulseRadius, 0.75, this.ringMat, true);
  }

  detonation(x: number, y: number, z: number): void {
    this.burst(x, y + 0.5, z, 1, 26, 1.1, this.whiteMat);
    this.burst(x, y + 0.5, z, 0.5, 14, 0.8, this.burstMat);
  }

  shardBreak(x: number, y: number, z: number): void {
    for (let i = 0; i < 5; i++) this.puff('glass', x, y, z, 0.12, 0.35, 0.8, this.rng.range(-1.5, 1.5), this.rng.range(0.5, 2), this.rng.range(-1.5, 1.5));
  }

  // ------------------------------------------------------------------ persistent world state
  private buildVeil(id: number, r: number): Mesh {
    const g = new Geom();
    const rng = new Rng(id * 7 + 3);
    // the central sphere is exactly the authoritative blocking radius; lumps only add silhouette
    g.sphere(0, 0, 0, r, [0.74, 0.76, 0.79], 14, 10);
    for (let i = 0; i < 16; i++) {
      const a = rng.next() * 6.28;
      const e = rng.range(-0.5, 0.9);
      const d = r * rng.range(0.6, 0.78);
      const lr = r * rng.range(0.32, 0.46);
      const sh = rng.range(0.66, 0.84);
      g.sphere(Math.cos(a) * Math.cos(e) * d, Math.sin(e) * d, Math.sin(a) * Math.cos(e) * d, lr, [sh, sh + 0.02, sh + 0.05], 8, 6);
    }
    const mesh = g.build('veil', this.core.scene, this.smokeMat);
    return mesh;
  }

  private buildFire(cells: number[]): { fill: Mesh; edge: Mesh; flames: Mesh } {
    const scene = this.core.scene;
    const fill = new Geom();
    const edge = new Geom();
    const flames = new Geom();
    const has = (x: number, z: number): boolean => {
      for (let c = 0; c < cells.length; c += 3) if (Math.abs(cells[c] - x) < 0.1 && Math.abs(cells[c + 2] - z) < 0.1) return true;
      return false;
    };
    const rng = new Rng(cells.length * 31 + Math.round(cells[0] * 10));
    const w = 0.07;
    for (let c = 0; c < cells.length; c += 3) {
      const x = cells[c];
      const y = cells[c + 1] + 0.02;
      const z = cells[c + 2];
      fill.quad([x - 0.5, y, z - 0.5], [x + 0.5, y, z - 0.5], [x + 0.5, y, z + 0.5], [x - 0.5, y, z + 0.5], [0, 1, 0], [1, 1, 1]);
      // crisp border on every outer edge of the burning cell set
      if (!has(x + 1, z)) edge.quad([x + 0.5 - w, y + 0.01, z - 0.5], [x + 0.5, y + 0.01, z - 0.5], [x + 0.5, y + 0.01, z + 0.5], [x + 0.5 - w, y + 0.01, z + 0.5], [0, 1, 0], [1, 1, 1]);
      if (!has(x - 1, z)) edge.quad([x - 0.5, y + 0.01, z - 0.5], [x - 0.5 + w, y + 0.01, z - 0.5], [x - 0.5 + w, y + 0.01, z + 0.5], [x - 0.5, y + 0.01, z + 0.5], [0, 1, 0], [1, 1, 1]);
      if (!has(x, z + 1)) edge.quad([x - 0.5, y + 0.01, z + 0.5 - w], [x + 0.5, y + 0.01, z + 0.5 - w], [x + 0.5, y + 0.01, z + 0.5], [x - 0.5, y + 0.01, z + 0.5], [0, 1, 0], [1, 1, 1]);
      if (!has(x, z - 1)) edge.quad([x - 0.5, y + 0.01, z - 0.5], [x + 0.5, y + 0.01, z - 0.5], [x + 0.5, y + 0.01, z - 0.5 + w], [x - 0.5, y + 0.01, z - 0.5 + w], [0, 1, 0], [1, 1, 1]);
      const h = rng.range(0.7, 1.25);
      const a = rng.next() * 3.14;
      for (const off of [0, 1.57]) {
        const dx = Math.cos(a + off) * 0.5;
        const dz = Math.sin(a + off) * 0.5;
        flames.quad([x - dx, y, z - dz], [x + dx, y, z + dz], [x + dx, y + h, z + dz], [x - dx, y + h, z - dz], [-dz, 0, dx], [1, 1, 1], [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ]);
      }
    }
    const fm = fill.build('firefill', scene, this.fireFillMat);
    fm.useVertexColors = false;
    const em = edge.build('fireedge', scene, this.fireEdgeMat);
    em.useVertexColors = false;
    const fl = flames.build('flames', scene, this.flameMat);
    fl.useVertexColors = false;
    return { fill: fm, edge: em, flames: fl };
  }

  private sync<T>(map: Map<number, T>, ids: Set<number>, dispose: (t: T) => void): void {
    for (const [id, t] of map) {
      if (!ids.has(id)) {
        dispose(t);
        map.delete(id);
      }
    }
  }

  private seen = new Set<number>();

  syncWorld(w: WorldSnap, tickNow: number, dt: number): void {
    this.time += dt;
    const scene = this.core.scene;
    const seen = this.seen;
    // projectiles
    seen.clear();
    for (const g of w.grenades) {
      seen.add(g.id);
      let m = this.grenades.get(g.id);
      if (!m) {
        m = this.template(g.type).clone('nade');
        m.setEnabled(true);
        m.scaling.setAll(1.5);
        this.grenades.set(g.id, m);
        m.position.set(g.x, g.y, g.z);
      }
      // smooth toward the latest authoritative position
      m.position.x += (g.x - m.position.x) * 0.5;
      m.position.y += (g.y - m.position.y) * 0.5;
      m.position.z += (g.z - m.position.z) * 0.5;
      m.rotation.x += dt * 9;
      m.rotation.z += dt * 6;
    }
    this.sync(this.grenades, seen, (m) => m.dispose());
    // veils: authoritative sphere, same on every preset
    seen.clear();
    for (const v of w.veils) {
      seen.add(v.id);
      let m = this.veils.get(v.id);
      if (!m) {
        m = this.buildVeil(v.id, v.r);
        m.position.set(v.x, v.y, v.z);
        this.veils.set(v.id, m);
      }
      const age = (tickNow - v.start) / TICK_RATE;
      const left = (v.end - tickNow) / TICK_RATE;
      const bloom = Math.min(1, Math.max(0, age / UTIL_TUNING.veilBloom));
      const s = 0.25 + 0.75 * bloom;
      const wob = 1 + Math.sin(this.time * 0.9 + v.id) * 0.012;
      m.scaling.set(s * wob, s * (left < 0.4 ? Math.max(0.05, left / 0.4) : 1), s * wob);
      m.rotation.y = this.time * 0.05 + v.id;
    }
    this.sync(this.veils, seen, (m) => m.dispose());
    // fires
    seen.clear();
    for (const f of w.fires) {
      seen.add(f.id);
      let fm = this.fires.get(f.id);
      if (!fm) {
        fm = this.buildFire(f.cells);
        this.fires.set(f.id, fm);
      }
      fm.flames.scaling.y = 0.85 + Math.sin(this.time * 17 + f.id) * 0.12 + Math.sin(this.time * 31) * 0.06;
      fm.flames.visibility = 0.8 + Math.sin(this.time * 23 + f.id) * 0.15;
      if (this.rng.chance(dt * 6) && f.cells.length) {
        const c = this.rng.int(f.cells.length / 3) * 3;
        this.puff('fire', f.cells[c] + this.rng.range(-0.4, 0.4), f.cells[c + 1] + 0.5, f.cells[c + 2] + this.rng.range(-0.4, 0.4), 0.35, 0.5, 1.2, 0, 1.8, 0);
      }
    }
    this.sync(this.fires, seen, (f) => {
      f.fill.dispose();
      f.edge.dispose();
      f.flames.dispose();
    });
    // shards
    seen.clear();
    for (const s of w.shards) {
      seen.add(s.id);
      let m = this.shards.get(s.id);
      if (!m) {
        m = this.template('pulse').clone('shard');
        m.setEnabled(true);
        m.scaling.setAll(2.2);
        m.position.set(s.x, s.y, s.z);
        this.shards.set(s.id, m);
      }
      m.rotation.y += dt * 2.5;
    }
    this.sync(this.shards, seen, (m) => m.dispose());
    // dropped items
    seen.clear();
    for (const it of w.items) {
      seen.add(it.uid);
      let m = this.items.get(it.uid);
      if (!m) {
        m = this.template(it.def).clone('item');
        m.setEnabled(true);
        if (it.kind === 'spike') {
          m.position.set(it.x, it.y, it.z);
        } else {
          m.position.set(it.x, it.y + 0.03, it.z);
          m.rotation.set(0, it.yaw, Math.PI / 2);
        }
        this.items.set(it.uid, m);
      }
    }
    this.sync(this.items, seen, (m) => m.dispose());
    // armed spike
    const sp = w.spike;
    if ((sp.state === 'armed' || sp.state === 'disarmed') && sp.x !== undefined) {
      this.spikeMesh.setEnabled(true);
      this.spikeMesh.position.set(sp.x, sp.y!, sp.z!);
      if (sp.state === 'armed' && sp.armedTick !== undefined) {
        const elapsed = (tickNow - sp.armedTick) / TICK_RATE;
        // walk the fixed beep schedule to find the current beep index and phase
        let t = 0;
        let idx = 0;
        let interval = 1;
        const total = (w.phaseEnd - sp.armedTick) / TICK_RATE;
        while (t <= elapsed && idx < 400) {
          interval = beepInterval(total - t);
          if (t + interval > elapsed) break;
          t += interval;
          idx++;
        }
        if (idx !== this.lastBeepIndex) {
          this.lastBeepIndex = idx;
          this.onBeep(sp.x, sp.y!, sp.z!, total - elapsed);
        }
        const ph = (elapsed - t) / interval;
        this.spikeGlow.setEnabled(true);
        this.spikeGlow.position.set(sp.x, sp.y! + 0.22, sp.z!);
        this.spikeGlow.scaling.setAll(0.12 + Math.max(0, 1 - ph * 3) * 0.5);
        this.spikeGlow.visibility = 0.35 + Math.max(0, 1 - ph * 3) * 0.6;
      } else this.spikeGlow.setEnabled(false);
    } else {
      this.spikeMesh.setEnabled(false);
      this.spikeGlow.setEnabled(false);
    }
    void scene;
  }

  /** How deep the camera is inside an authoritative Veil volume (0 = outside, 1 = fully inside). */
  veilDepth(w: WorldSnap | null, tickNow: number, x: number, y: number, z: number): number {
    if (!w) return 0;
    let best = 0;
    for (const v of w.veils) {
      const age = (tickNow - v.start) / TICK_RATE;
      if (tickNow > v.end) continue;
      const r = v.r * (0.25 + 0.75 * Math.min(1, Math.max(0, age / UTIL_TUNING.veilBloom)));
      const d = Math.hypot(x - v.x, y - v.y, z - v.z);
      const depth = Math.min(1, Math.max(0, (r + 0.25 - d) / 0.5));
      if (depth > best) best = depth;
    }
    return best;
  }

  showTrajectory(points: number[] | null): void {
    if (!points) {
      this.trajMesh.setEnabled(false);
      return;
    }
    this.trajBuf.fill(0);
    const n = Math.min(48, points.length / 3);
    for (let i = 0; i < n; i++) {
      const o = i * 16;
      const s = i === n - 1 ? 0.3 : 0.07;
      this.trajBuf[o] = s;
      this.trajBuf[o + 5] = s;
      this.trajBuf[o + 10] = s;
      this.trajBuf[o + 12] = points[i * 3];
      this.trajBuf[o + 13] = points[i * 3 + 1];
      this.trajBuf[o + 14] = points[i * 3 + 2];
      this.trajBuf[o + 15] = 1;
    }
    this.trajMesh.thinInstanceBufferUpdated('matrix');
    this.trajMesh.setEnabled(true);
  }

  update(dt: number): void {
    for (const t of this.tracers) {
      if (t.life <= 0) continue;
      t.life -= dt;
      t.mesh.visibility = Math.max(0, t.life / 0.075) * 0.9;
      if (t.life <= 0) t.mesh.setEnabled(false);
    }
    for (const p of this.puffs) {
      if (p.life <= 0) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.mesh.setEnabled(false);
        continue;
      }
      const k = 1 - p.life / p.max;
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.vx *= 1 - dt * 3;
      p.vy *= 1 - dt * 3;
      p.vz *= 1 - dt * 3;
      p.mesh.scaling.setAll(p.base * (1 + k * p.grow));
      p.mesh.visibility = (1 - k) * 0.9;
    }
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      b.life -= dt;
      if (b.life <= 0) {
        b.mesh.dispose();
        this.bursts.splice(i, 1);
        continue;
      }
      const k = 1 - b.life / b.max;
      const e = 1 - (1 - k) ** 2;
      const s = b.from + (b.to - b.from) * e;
      if (b.flat) b.mesh.scaling.set(s, 1, s);
      else b.mesh.scaling.setAll(s);
      b.mesh.visibility = 1 - k;
    }
  }
}
