// Pooled visual effects: tracers, impacts, decals, explosions, smoke, glass shards, rings. Everything is capped and recycled.
import { Color3, Mesh, MeshBuilder, Scene, StandardMaterial, Texture, Vector3 } from "@babylonjs/core";
import type { SurfaceTag } from "../../shared/protocol";
import type { TextureSet } from "./textures";

interface Puff { mesh: Mesh; t: number; life: number; vel: Vector3; s0: number; s1: number; a0: number; alive: boolean }
interface Tracer { mesh: Mesh; t: number; from: Vector3; dir: Vector3; len: number; speed: number; alive: boolean }
interface Shard { mesh: Mesh; t: number; vel: Vector3; spin: Vector3; alive: boolean }

const SURFACE_COLOR: Record<SurfaceTag, Color3> = {
  concrete: new Color3(0.86, 0.86, 0.82), metal: new Color3(1, 0.78, 0.4), glass: new Color3(0.8, 0.95, 1), dirt: new Color3(0.6, 0.5, 0.38),
  wood: new Color3(0.85, 0.66, 0.42), flesh: new Color3(1, 0.88, 0.85), water: new Color3(0.7, 0.85, 1),
};

export class Vfx {
  private puffs: Puff[] = [];
  private tracers: Tracer[] = [];
  private shards: Shard[] = [];
  private decals: Mesh[] = [];
  private decalIdx = 0;
  private rings: Array<{ mesh: Mesh; t: number; life: number; r1: number; alive: boolean }> = [];
  private smokes: Array<{ meshes: Mesh[]; t: number; life: number; r: number; alive: boolean }> = [];
  private puffMats: Map<string, StandardMaterial> = new Map();
  density = 1;
  private root: Mesh;
  private shardMat: StandardMaterial;
  private tracerMat: StandardMaterial;
  private fireball: Mesh[] = [];
  private fireballs: Array<{ mesh: Mesh; t: number; r: number; alive: boolean }> = [];
  private smokeMat: StandardMaterial;
  private ringMat: StandardMaterial;
  private flashMat: StandardMaterial;

  constructor(private scene: Scene, private T: TextureSet) {
    this.root = new Mesh("vfx_root", scene);
    this.root.isPickable = false;
    this.tracerMat = new StandardMaterial("vfx_tracer", scene);
    this.tracerMat.emissiveColor = new Color3(1, 0.88, 0.55); this.tracerMat.disableLighting = true; this.tracerMat.alpha = 0.85;
    this.shardMat = new StandardMaterial("vfx_shard", scene);
    this.shardMat.diffuseColor = new Color3(0.8, 0.95, 1); this.shardMat.emissiveColor = new Color3(0.2, 0.3, 0.35); this.shardMat.alpha = 0.6; this.shardMat.backFaceCulling = false;
    this.smokeMat = new StandardMaterial("vfx_smoke", scene);
    this.smokeMat.diffuseTexture = T.smoke; this.smokeMat.opacityTexture = T.smoke; this.smokeMat.emissiveColor = new Color3(0.72, 0.75, 0.78);
    this.smokeMat.disableLighting = true; this.smokeMat.backFaceCulling = false;
    this.ringMat = new StandardMaterial("vfx_ring", scene);
    this.ringMat.emissiveTexture = T.soft; this.ringMat.opacityTexture = T.soft; this.ringMat.disableLighting = true; this.ringMat.backFaceCulling = false;
    this.flashMat = new StandardMaterial("vfx_flash", scene);
    this.flashMat.emissiveTexture = T.star; this.flashMat.opacityTexture = T.star; this.flashMat.disableLighting = true; this.flashMat.backFaceCulling = false;
    // decal pool
    const dm = new StandardMaterial("vfx_decal", scene);
    dm.diffuseTexture = T.hole; dm.opacityTexture = T.hole; dm.disableLighting = true; dm.emissiveColor = Color3.White(); dm.zOffset = -2; dm.backFaceCulling = false;
    for (let i = 0; i < 60; i++) {
      const d = MeshBuilder.CreatePlane("decal", { size: 0.14 }, scene);
      d.material = dm; d.isVisible = false; d.isPickable = false; d.doNotSyncBoundingInfo = true;
      this.decals.push(d);
    }
    // tracer pool
    for (let i = 0; i < 28; i++) {
      const m = MeshBuilder.CreateBox("tracer", { width: 0.014, height: 0.014, depth: 1 }, scene);
      m.material = this.tracerMat; m.isVisible = false; m.isPickable = false; m.renderingGroupId = 0;
      this.tracers.push({ mesh: m, t: 0, from: new Vector3(), dir: new Vector3(), len: 0, speed: 380, alive: false });
    }
    for (let i = 0; i < 48; i++) {
      const m = MeshBuilder.CreatePlane("puff", { size: 1 }, scene);
      m.billboardMode = Mesh.BILLBOARDMODE_ALL; m.isVisible = false; m.isPickable = false;
      this.puffs.push({ mesh: m, t: 0, life: 0, vel: new Vector3(), s0: 1, s1: 1, a0: 1, alive: false });
    }
    for (let i = 0; i < 24; i++) {
      const m = MeshBuilder.CreatePlane("shard", { size: 0.12 }, scene);
      m.material = this.shardMat; m.isVisible = false; m.isPickable = false;
      this.shards.push({ mesh: m, t: 0, vel: new Vector3(), spin: new Vector3(), alive: false });
    }
    for (let i = 0; i < 8; i++) {
      const m = MeshBuilder.CreateDisc("ring", { radius: 1, tessellation: 24 }, scene);
      m.rotation.x = Math.PI / 2; m.isVisible = false; m.isPickable = false;
      this.rings.push({ mesh: m, t: 0, life: 1, r1: 1, alive: false });
    }
  }

  private puffMat(c: Color3, tex: Texture): StandardMaterial {
    const key = c.toHexString() + (tex === this.T.star ? "s" : "p");
    let m = this.puffMats.get(key);
    if (!m) {
      m = new StandardMaterial("pm" + key, this.scene);
      m.emissiveColor = c; m.emissiveTexture = tex; m.opacityTexture = tex; m.disableLighting = true; m.backFaceCulling = false;
      this.puffMats.set(key, m);
    }
    return m;
  }

  private spawnPuff(pos: Vector3, vel: Vector3, color: Color3, s0: number, s1: number, life: number, star = false): void {
    const p = this.puffs.find((x) => !x.alive) ?? this.puffs[0];
    p.alive = true; p.t = 0; p.life = life; p.s0 = s0; p.s1 = s1; p.vel.copyFrom(vel);
    p.mesh.material = this.puffMat(color, star ? this.T.star : this.T.soft);
    p.mesh.position.copyFrom(pos); p.mesh.scaling.setAll(s0); p.mesh.isVisible = true; p.mesh.visibility = 1;
  }

  tracer(from: Vector3, to: Vector3): void {
    const dir = to.subtract(from);
    const len = dir.length();
    if (len < 1) return;
    dir.scaleInPlace(1 / len);
    const t = this.tracers.find((x) => !x.alive) ?? this.tracers[0];
    t.alive = true; t.t = 0; t.from.copyFrom(from); t.dir.copyFrom(dir); t.len = len; t.mesh.isVisible = true;
    t.mesh.lookAt(to);
  }

  impact(pos: Vector3, normal: Vector3, surface: SurfaceTag): void {
    const c = SURFACE_COLOR[surface] ?? SURFACE_COLOR.concrete;
    const n = Math.max(1, Math.round((surface === "metal" ? 2 : 1) * this.density));
    for (let i = 0; i < n; i++) {
      const v = new Vector3((Math.random() - 0.5) * 1.2, Math.random() * 1.0, (Math.random() - 0.5) * 1.2).addInPlace(normal.scale(1.2));
      this.spawnPuff(pos.add(normal.scale(0.03)), v, c, surface === "metal" ? 0.12 : 0.2, surface === "metal" ? 0.28 : 0.55, surface === "metal" ? 0.12 : 0.3, surface === "metal");
    }
    if (surface === "glass") return;
    if (surface === "flesh") return;
    const d = this.decals[this.decalIdx++ % this.decals.length];
    d.position.copyFrom(pos).addInPlace(normal.scale(0.012));
    d.lookAt(pos.subtract(normal));
    d.rotation.z = Math.random() * 6;
    d.scaling.setAll(0.8 + Math.random() * 0.5);
    d.isVisible = true;
  }

  explosion(kind: string, pos: Vector3, radius: number): void {
    if (kind === "flash") {
      this.spawnPuff(pos, Vector3.Zero(), new Color3(1, 1, 1), 1.5, radius * 0.5, 0.22, true);
      return;
    }
    if (kind === "device") { this.spawnPuff(pos, Vector3.Zero(), new Color3(1, 0.7, 0.3), 0.6, 2.2, 0.3, true); return; }
    const big = kind !== "strafe";
    const r = big ? radius : radius * 0.8;
    // fireball
    const fb = this.fireballs.find((x) => !x.alive) ?? (() => {
      const m = MeshBuilder.CreateSphere("fb", { diameter: 2, segments: 10 }, this.scene);
      const mm = new StandardMaterial("fbm", this.scene); mm.emissiveColor = new Color3(1, 0.55, 0.15); mm.disableLighting = true; mm.alpha = 0.8;
      m.material = mm; m.isPickable = false; m.isVisible = false;
      const o = { mesh: m, t: 0, r: 1, alive: false };
      this.fireballs.push(o);
      return o;
    })();
    fb.alive = true; fb.t = 0; fb.r = r * 0.55; fb.mesh.position.copyFrom(pos); fb.mesh.isVisible = true;
    this.spawnPuff(pos, Vector3.Zero(), new Color3(1, 0.8, 0.5), r * 0.8, r * 2.2, 0.28, true);
    const n = Math.round((big ? 6 : 2) * this.density);
    for (let i = 0; i < n; i++) {
      const v = new Vector3((Math.random() - 0.5) * 3, 1.5 + Math.random() * 2, (Math.random() - 0.5) * 3);
      this.spawnPuff(pos.add(new Vector3(0, 0.4, 0)), v, new Color3(0.38, 0.38, 0.4), r * 0.35, r * 1.2, 1.1);
    }
    // scorch decal
    const d = this.decals[this.decalIdx++ % this.decals.length];
    d.position.set(pos.x, 0.015, pos.z); d.rotation.set(Math.PI / 2, 0, 0); d.scaling.setAll(big ? radius * 7 : 3); d.isVisible = true;
    if (d.material) (d.material as StandardMaterial).diffuseTexture = this.T.hole;
  }

  smoke(pos: Vector3, radius: number, duration: number): void {
    const meshes: Mesh[] = [];
    const n = Math.round(14 * Math.max(0.5, this.density));
    for (let i = 0; i < n; i++) {
      const m = MeshBuilder.CreatePlane("smk", { size: 1 }, this.scene);
      m.billboardMode = Mesh.BILLBOARDMODE_ALL; m.material = this.smokeMat; m.isPickable = false;
      const a = Math.random() * Math.PI * 2, rr = Math.sqrt(Math.random()) * radius * 0.55;
      m.position.set(pos.x + Math.cos(a) * rr, Math.max(1.1, pos.y + 1.2) + (Math.random() - 0.3) * radius * 0.6, pos.z + Math.sin(a) * rr);
      m.scaling.setAll(0.1);
      m.rotation.z = Math.random() * 6;
      meshes.push(m);
    }
    this.smokes.push({ meshes, t: 0, life: duration, r: radius, alive: true });
  }

  shatter(pos: Vector3): void {
    let spawned = 0;
    for (const s of this.shards) {
      if (s.alive || spawned > 14 * this.density) continue;
      s.alive = true; s.t = 0; s.mesh.position.set(pos.x + (Math.random() - 0.5) * 0.6, pos.y + (Math.random() - 0.5) * 0.8, pos.z + (Math.random() - 0.5) * 0.6);
      s.vel.set((Math.random() - 0.5) * 3, Math.random() * 2, (Math.random() - 0.5) * 3); s.spin.set(Math.random() * 8, Math.random() * 8, Math.random() * 8);
      s.mesh.isVisible = true; spawned++;
    }
    this.spawnPuff(pos, Vector3.Zero(), new Color3(0.8, 0.95, 1), 0.3, 1.6, 0.3, true);
  }

  ring(pos: Vector3, color: Color3, radius: number, life = 0.8): void {
    const r = this.rings.find((x) => !x.alive) ?? this.rings[0];
    r.alive = true; r.t = 0; r.life = life; r.r1 = radius;
    r.mesh.position.set(pos.x, Math.max(0.05, pos.y), pos.z);
    const m = new StandardMaterial("rm", this.scene);
    m.emissiveColor = color; m.emissiveTexture = this.T.soft; m.opacityTexture = this.T.soft; m.disableLighting = true; m.backFaceCulling = false;
    if (r.mesh.material) r.mesh.material.dispose();
    r.mesh.material = m;
    r.mesh.isVisible = true;
  }

  update(dt: number): void {
    for (const p of this.puffs) {
      if (!p.alive) continue;
      p.t += dt;
      const k = p.t / p.life;
      if (k >= 1) { p.alive = false; p.mesh.isVisible = false; continue; }
      p.mesh.position.addInPlace(p.vel.scale(dt));
      p.vel.scaleInPlace(Math.max(0, 1 - dt * 3));
      p.mesh.scaling.setAll(p.s0 + (p.s1 - p.s0) * Math.sqrt(k));
      p.mesh.visibility = 1 - k * k;
    }
    for (const t of this.tracers) {
      if (!t.alive) continue;
      t.t += dt;
      const d = t.t * t.speed;
      const head = Math.min(t.len, d), tail = Math.max(0, d - 9);
      if (tail >= t.len || t.t > 0.35) { t.alive = false; t.mesh.isVisible = false; continue; }
      const mid = (head + tail) / 2;
      t.mesh.position.set(t.from.x + t.dir.x * mid, t.from.y + t.dir.y * mid, t.from.z + t.dir.z * mid);
      t.mesh.scaling.z = Math.max(0.05, head - tail);
    }
    for (const s of this.shards) {
      if (!s.alive) continue;
      s.t += dt;
      if (s.t > 1.4) { s.alive = false; s.mesh.isVisible = false; continue; }
      s.vel.y -= 14 * dt;
      s.mesh.position.addInPlace(s.vel.scale(dt));
      if (s.mesh.position.y < 0.05) { s.mesh.position.y = 0.05; s.vel.set(0, 0, 0); }
      s.mesh.rotation.addInPlace(s.spin.scale(dt));
      s.mesh.visibility = 1 - s.t / 1.4;
    }
    for (const r of this.rings) {
      if (!r.alive) continue;
      r.t += dt;
      const k = r.t / r.life;
      if (k >= 1) { r.alive = false; r.mesh.isVisible = false; continue; }
      r.mesh.scaling.setAll(0.3 + (r.r1 - 0.3) * Math.sqrt(k));
      r.mesh.visibility = 1 - k;
    }
    for (const f of this.fireballs) {
      if (!f.alive) continue;
      f.t += dt;
      const k = f.t / 0.28;
      if (k >= 1) { f.alive = false; f.mesh.isVisible = false; continue; }
      f.mesh.scaling.setAll(f.r * (0.3 + 0.9 * Math.sqrt(k)));
      f.mesh.visibility = 1 - k * k;
    }
    for (let i = this.smokes.length - 1; i >= 0; i--) {
      const s = this.smokes[i];
      s.t += dt;
      const grow = Math.min(1, s.t / 1.0);
      const fade = s.t > s.life - 2 ? Math.max(0, (s.life - s.t) / 2) : 1;
      for (let k = 0; k < s.meshes.length; k++) {
        const m = s.meshes[k];
        m.scaling.setAll(s.r * (0.9 + 0.5 * ((k * 37) % 10) / 10) * grow);
        m.visibility = 0.92 * fade;
        m.rotation.z += dt * 0.1 * (k % 2 ? 1 : -1);
      }
      if (s.t >= s.life) { for (const m of s.meshes) m.dispose(); this.smokes.splice(i, 1); }
    }
  }

  clear(): void {
    for (const d of this.decals) d.isVisible = false;
    for (const s of this.smokes) for (const m of s.meshes) m.dispose();
    this.smokes = [];
  }
}
