import { Color3, Matrix, Mesh, MeshBuilder, Quaternion, Scene, StandardMaterial, TransformNode, type AbstractMesh } from "@babylonjs/core";
import type { Game } from "../sim/game";
import type { GameEvent, Telegraph } from "../sim/types";
import { BASE_BY_ID } from "../data/items";
import { RARITY_COLOR } from "../items/item";
import { Kit, SEMANTIC, SEMANTIC_CB, box, cyl, hex, merge, ringMesh, sectorMesh, sph } from "./kit";
import { POTION_INFO } from "../data/items";

export interface FxSettings { particles: number; colorblind: boolean; reducedFlash: boolean; gore: boolean }

/** GPU-instanced billboard particles (one draw call per blend mode). */
class ParticleBuffer {
  mesh: Mesh;
  n = 0;
  cap: number;
  px: Float32Array; py: Float32Array; pz: Float32Array; vx: Float32Array; vy: Float32Array; vz: Float32Array;
  life: Float32Array; max: Float32Array; size: Float32Array; grow: Float32Array; grav: Float32Array; drag: Float32Array;
  r: Float32Array; g: Float32Array; b: Float32Array; a: Float32Array;
  mats: Float32Array; cols: Float32Array;
  constructor(scene: Scene, kit: Kit, name: string, additive: boolean, cap: number) {
    this.cap = cap;
    const mk = () => new Float32Array(cap);
    this.px = mk(); this.py = mk(); this.pz = mk(); this.vx = mk(); this.vy = mk(); this.vz = mk();
    this.life = mk(); this.max = mk(); this.size = mk(); this.grow = mk(); this.grav = mk(); this.drag = mk();
    this.r = mk(); this.g = mk(); this.b = mk(); this.a = mk();
    this.mats = new Float32Array(cap * 16); this.cols = new Float32Array(cap * 4);
    this.mesh = MeshBuilder.CreatePlane(name, { size: 1 }, scene);
    const m = new StandardMaterial(`${name}_mat`, scene);
    m.disableLighting = true;
    m.emissiveColor = Color3.Black();
    m.diffuseColor = Color3.White();
    m.diffuseTexture = kit.texture(additive ? "spark" : "soft");
    m.diffuseTexture.hasAlpha = true;
    m.useAlphaFromDiffuseTexture = true;
    m.alphaMode = additive ? 1 : 2;
    m.disableDepthWrite = true;
    m.backFaceCulling = false;
    m.fogEnabled = !additive;
    this.mesh.material = m;
    this.mesh.thinInstanceSetBuffer("matrix", this.mats, 16, false);
    this.mesh.thinInstanceSetBuffer("color", this.cols, 4, false);
    this.mesh.thinInstanceCount = 0;
    this.mesh.isPickable = false;
    this.mesh.alwaysSelectAsActiveMesh = true;
    this.mesh.renderingGroupId = 1;
  }
  emit(x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number, size: number, col: Color3, alpha: number, grav = 0, drag = 0.5, grow = 0) {
    if (this.n >= this.cap) return;
    const i = this.n++;
    this.px[i] = x; this.py[i] = y; this.pz[i] = z; this.vx[i] = vx; this.vy[i] = vy; this.vz[i] = vz;
    this.life[i] = life; this.max[i] = life; this.size[i] = size; this.grow[i] = grow; this.grav[i] = grav; this.drag[i] = drag;
    this.r[i] = col.r; this.g[i] = col.g; this.b[i] = col.b; this.a[i] = alpha;
  }
  update(dt: number, rot: Matrix) {
    const R = rot.m;
    let w = 0;
    for (let i = 0; i < this.n; i++) {
      const l = this.life[i] - dt;
      if (l <= 0) continue;
      const d = Math.max(0, 1 - this.drag[i] * dt);
      const vx = this.vx[i] * d, vy = (this.vy[i] - this.grav[i] * dt) * d, vz = this.vz[i] * d;
      const x = this.px[i] + vx * dt, y = this.py[i] + vy * dt, z = this.pz[i] + vz * dt;
      // compact
      this.px[w] = x; this.py[w] = y; this.pz[w] = z; this.vx[w] = vx; this.vy[w] = vy; this.vz[w] = vz;
      this.life[w] = l; this.max[w] = this.max[i]; this.size[w] = this.size[i]; this.grow[w] = this.grow[i]; this.grav[w] = this.grav[i]; this.drag[w] = this.drag[i];
      this.r[w] = this.r[i]; this.g[w] = this.g[i]; this.b[w] = this.b[i]; this.a[w] = this.a[i];
      const k = l / this.max[w];
      const s = this.size[w] * (1 + this.grow[w] * (1 - k));
      const o = w * 16;
      const M = this.mats;
      M[o] = R[0] * s; M[o + 1] = R[1] * s; M[o + 2] = R[2] * s; M[o + 3] = 0;
      M[o + 4] = R[4] * s; M[o + 5] = R[5] * s; M[o + 6] = R[6] * s; M[o + 7] = 0;
      M[o + 8] = R[8] * s; M[o + 9] = R[9] * s; M[o + 10] = R[10] * s; M[o + 11] = 0;
      M[o + 12] = x; M[o + 13] = y; M[o + 14] = z; M[o + 15] = 1;
      const c = w * 4;
      const fade = Math.min(1, k * 2.2) * this.a[w];
      this.cols[c] = this.r[w]; this.cols[c + 1] = this.g[w]; this.cols[c + 2] = this.b[w]; this.cols[c + 3] = fade;
      w++;
    }
    this.n = w;
    this.mesh.thinInstanceCount = w;
    this.mesh.thinInstanceBufferUpdated("matrix");
    this.mesh.thinInstanceBufferUpdated("color");
  }
  clear() { this.n = 0; this.mesh.thinInstanceCount = 0; }
}

interface TeleView { root: TransformNode; fill: Mesh; prog: Mesh; edge?: Mesh; shape: string }
interface Flash { mesh: Mesh; t: number; dur: number; mat: StandardMaterial; alpha: number; grow: number }

export class Fx {
  add: ParticleBuffer;
  smoke: ParticleBuffer;
  teles = new Map<number, TeleView>();
  projViews = new Map<number, AbstractMesh>();
  zoneViews = new Map<number, TransformNode>();
  pickViews = new Map<number, TransformNode>();
  interViews = new Map<number, TransformNode>();
  flashes: Flash[] = [];
  settings: FxSettings = { particles: 1, colorblind: false, reducedFlash: false, gore: true };
  time = 0;
  private rot = Matrix.Identity();
  private protos = new Map<string, Mesh>();

  constructor(public kit: Kit) {
    this.add = new ParticleBuffer(kit.scene, kit, "fx_add", true, 4000);
    this.smoke = new ParticleBuffer(kit.scene, kit, "fx_smoke", false, 1500);
  }

  col(type: string): Color3 {
    const pal = this.settings.colorblind ? SEMANTIC_CB : SEMANTIC;
    return hex((pal as any)[type] ?? "#ffffff");
  }

  setBillboard(q: Quaternion) {
    Matrix.FromQuaternionToRef(q, this.rot);
  }

  clearZone() {
    for (const v of this.teles.values()) v.root.dispose();
    for (const v of this.projViews.values()) v.dispose();
    for (const v of this.zoneViews.values()) v.dispose();
    for (const v of this.pickViews.values()) v.dispose();
    for (const v of this.interViews.values()) v.dispose();
    for (const f of this.flashes) f.mesh.dispose();
    this.teles.clear(); this.projViews.clear(); this.zoneViews.clear(); this.pickViews.clear(); this.interViews.clear(); this.flashes = [];
    this.add.clear(); this.smoke.clear();
  }

  burst(x: number, y: number, z: number, n: number, color: Color3, o: { speed?: number; up?: number; life?: number; size?: number; grav?: number; smoke?: boolean; alpha?: number; spread?: number; grow?: number } = {}) {
    const count = Math.round(n * this.settings.particles);
    const buf = o.smoke ? this.smoke : this.add;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (o.speed ?? 3) * (0.4 + Math.random() * 0.8);
      buf.emit(x + (Math.random() - 0.5) * (o.spread ?? 0.2), y, z + (Math.random() - 0.5) * (o.spread ?? 0.2), Math.cos(a) * sp, (o.up ?? 2) * (0.5 + Math.random()), Math.sin(a) * sp, (o.life ?? 0.5) * (0.6 + Math.random() * 0.6), (o.size ?? 0.25) * (0.6 + Math.random() * 0.8), color, o.alpha ?? 1, o.grav ?? 6, 1.5, o.grow ?? 0);
    }
  }

  ringFlash(x: number, z: number, r: number, color: Color3, dur = 0.35, grow = 0.4) {
    const m = ringMesh("flash", this.kit.scene, r * 0.86, r, Math.PI * 2, 48);
    const mat = new StandardMaterial("flashmat", this.kit.scene);
    mat.disableLighting = true; mat.emissiveColor = color; mat.alpha = 0.9; mat.alphaMode = 1; mat.disableDepthWrite = true; mat.backFaceCulling = false;
    m.material = mat; m.position.set(x, 0.08, z); m.isPickable = false;
    this.flashes.push({ mesh: m, t: 0, dur, mat, alpha: this.settings.reducedFlash ? 0.5 : 0.9, grow });
  }

  sectorFlash(x: number, z: number, r: number, arc: number, angle: number, color: Color3, dur = 0.16) {
    const m = sectorMesh("swing", this.kit.scene, r, arc, 24);
    const mat = new StandardMaterial("swingmat", this.kit.scene);
    mat.disableLighting = true; mat.emissiveColor = color; mat.alpha = 0.55; mat.alphaMode = 1; mat.disableDepthWrite = true; mat.backFaceCulling = false;
    m.material = mat; m.position.set(x, 0.9, z); m.rotation.y = -angle; m.isPickable = false;
    this.flashes.push({ mesh: m, t: 0, dur, mat, alpha: this.settings.reducedFlash ? 0.3 : 0.55, grow: 0.15 });
  }

  onEvent(ev: GameEvent, game: Game) {
    switch (ev.t) {
      case "hit": {
        if (ev.amount <= 0 && !ev.evaded) break;
        const c = this.col(ev.toPlayer ? ev.type : ev.type);
        const h = ev.toPlayer ? 1.1 : 1;
        this.burst(ev.x, h, ev.y, ev.crit ? 18 : ev.heavy ? 12 : 7, c, { speed: ev.crit ? 5 : 3.2, life: 0.35, size: ev.crit ? 0.32 : 0.22 });
        if (ev.crit) this.ringFlash(ev.x, ev.y, 0.9, this.col("gold"), 0.25, 0.8);
        if (this.settings.gore && !ev.toPlayer && ev.type === "physical") this.burst(ev.x, 0.9, ev.y, 3, new Color3(0.6, 0.08, 0.1), { speed: 2, life: 0.45, size: 0.14, grav: 9, alpha: 0.9 });
        break;
      }
      case "death": {
        const c = ev.boss ? this.col("ember") : new Color3(0.78, 0.72, 0.66);
        this.burst(ev.x, 0.6, ev.y, ev.boss ? 40 : 8, c, { smoke: true, speed: 1.4, up: 1.2, life: 0.9, size: 0.4, grav: -0.5, alpha: 0.3, grow: 1 });
        this.burst(ev.x, 0.8, ev.y, ev.boss ? 50 : 10, this.col("ember"), { speed: 2.5, life: 0.8, size: 0.14 });
        break;
      }
      case "vfx": this.vfx(ev, game); break;
    }
  }

  private vfx(ev: Extract<GameEvent, { t: "vfx" }>, game: Game) {
    const c = this.col(ev.type ?? "physical");
    const x = ev.x, z = ev.y;
    switch (ev.kind) {
      case "swing": case "enemySwing": this.sectorFlash(x, z, ev.r ?? 2.2, (110 * Math.PI) / 180, ev.angle ?? 0, ev.kind === "swing" ? new Color3(0.9, 0.86, 0.75) : c, 0.14); break;
      case "flamesweep": this.sectorFlash(x, z, ev.r ?? 3, (160 * Math.PI) / 180, ev.angle ?? 0, this.col("ember"), 0.22); for (let i = 0; i < 16; i++) { const a = (ev.angle ?? 0) + (Math.random() - 0.5) * 2.6, d = Math.random() * (ev.r ?? 3); this.burst(x + Math.cos(a) * d, 0.8, z + Math.sin(a) * d, 2, this.col("ember"), { speed: 1, up: 2, life: 0.5, size: 0.3 }); } break;
      case "chainsweep": this.sectorFlash(x, z, ev.r ?? 7, (200 * Math.PI) / 180, ev.angle ?? 0, new Color3(0.8, 0.8, 0.85), 0.25); break;
      case "lash": case "vent": {
        const a = ev.angle ?? 0, len = ev.kind === "vent" ? 6.5 : ev.r ?? 10;
        for (let i = 0; i < 26; i++) { const d = Math.random() * len; this.burst(x + Math.cos(a) * d, 0.6, z + Math.sin(a) * d, 1, ev.kind === "vent" ? this.col("ember") : new Color3(0.8, 0.8, 0.8), { speed: 0.8, up: ev.kind === "vent" ? 4 : 1, life: ev.kind === "vent" ? 0.9 : 0.4, size: 0.35 }); }
        break;
      }
      case "slam": this.ringFlash(x, z, ev.r ?? 2.5, c, 0.4, 0.5); this.burst(x, 0.2, z, 14, new Color3(0.7, 0.64, 0.58), { smoke: true, speed: 4, up: 1, life: 0.7, size: 0.4, grav: 1, alpha: 0.35 }); break;
      case "explosion": case "eruption": case "starfall": case "nova": case "overload": case "bossdeath": {
        const r = ev.r ?? 2.5;
        this.ringFlash(x, z, r, c, 0.45, 0.3);
        this.burst(x, 0.5, z, Math.round(10 + r * 8), c, { speed: r * 2.2, up: 3, life: 0.6, size: 0.35 });
        this.burst(x, 0.3, z, Math.round(3 + r * 2), new Color3(0.6, 0.55, 0.52), { smoke: true, speed: r, up: 1.5, life: 1.0, size: 0.6, grav: -0.3, alpha: 0.3, grow: 1 });
        break;
      }
      case "spikes": for (let i = 0; i < 8; i++) this.burst(x + (Math.random() - 0.5) * 2, 0.1, z + (Math.random() - 0.5) * 2, 1, new Color3(0.9, 0.9, 0.9), { speed: 0.3, up: 4, life: 0.3, size: 0.15, grav: 12 }); this.ringFlash(x, z, 1.3, new Color3(0.9, 0.9, 0.9), 0.3, 0.1); break;
      case "interrupt": this.ringFlash(x, z, 1.1, this.col("gold"), 0.3, 0.6); break;
      case "heal": this.burst(x, 0.4, z, 14, this.col("heal"), { speed: 0.6, up: 2.5, life: 0.9, size: 0.18, grav: -1 }); break;
      case "potion": this.burst(x, 0.5, z, 10, c, { speed: 0.5, up: 2.5, life: 0.7, size: 0.16, grav: -1 }); break;
      case "mark": this.burst(x, 2.1, z, 4, this.col("player"), { speed: 0.4, up: 0.5, life: 0.4, size: 0.2, grav: 0 }); break;
      case "detonate": this.ringFlash(x, z, ev.r ?? 2.5, this.col("frost"), 0.35, 0.3); this.burst(x, 1, z, 20, this.col("frost"), { speed: 4, life: 0.5, size: 0.25 }); break;
      case "snare": this.ringFlash(x, z, ev.r ?? 2.2, this.col("blight"), 0.4, 0.2); this.burst(x, 0.3, z, 16, this.col("blight"), { speed: 3, up: 1, life: 0.6, size: 0.25 }); break;
      case "levelup": for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; this.add.emit(x + Math.cos(a) * 0.8, 0.1, z + Math.sin(a) * 0.8, 0, 3 + Math.random() * 2, 0, 1.2, 0.2, this.col("gold"), 1, -1, 0.3); } this.ringFlash(x, z, 2, this.col("gold"), 0.6, 0.5); break;
      case "waypoint": this.ringFlash(x, z, 2.5, this.col("player"), 0.8, 0.6); this.burst(x, 0.5, z, 30, this.col("player"), { speed: 1, up: 4, life: 1.2, size: 0.2, grav: -1 }); break;
      case "lootbeam": this.burst(x, 0.3, z, 10, c, { speed: 0.4, up: 3, life: 0.8, size: 0.2, grav: -2 }); break;
      case "chest": this.burst(x, 0.8, z, 16, this.col("gold"), { speed: 2, up: 3, life: 0.6, size: 0.18 }); break;
      case "debris": this.burst(x, 0.5, z, 14, new Color3(0.55, 0.45, 0.35), { smoke: true, speed: 2.5, up: 3, life: 0.5, size: 0.18, grav: 12, alpha: 1 }); break;
      case "evade": this.burst(x, 0.6, z, 8, this.col("player"), { speed: 0.6, up: 0.4, life: 0.35, size: 0.3, grav: 0 }); break;
      case "dash": this.burst(x, 0.6, z, 12, this.col("player"), { speed: 1, up: 0.5, life: 0.35, size: 0.3, grav: 0 }); break;
      case "moth": this.burst(x, 1, z, 30, new Color3(0.75, 0.8, 0.95), { smoke: true, speed: 2, up: 1.5, life: 1, size: 0.25, grav: -0.5, alpha: 0.7 }); break;
      case "furnace": this.ringFlash(x, z, 1.5, this.col("ember"), 0.5, 0.5); break;
      case "standard": this.ringFlash(x, z, 5, this.col("player"), 0.6, 0.05); break;
      case "pulse": this.ringFlash(x, z, ev.r ?? 5, this.col("player"), 0.4, 0.05); break;
      case "rain": for (let i = 0; i < 5; i++) this.add.emit(x + (Math.random() - 0.5) * 3, 5, z + (Math.random() - 0.5) * 3, 0, -22, 0, 0.22, 0.12, new Color3(0.9, 0.9, 0.85), 1, 0, 0); this.burst(x, 0.1, z, 4, new Color3(0.7, 0.65, 0.6), { smoke: true, speed: 1.5, up: 1, life: 0.4, size: 0.3, alpha: 0.6 }); break;
      case "chainhit": case "repair": {
        const x2 = ev.x2 ?? x, z2 = ev.y2 ?? z;
        for (let i = 0; i <= 12; i++) { const k = i / 12; this.add.emit(x + (x2 - x) * k, 1.1, z + (z2 - z) * k, 0, 0.2, 0, 0.25, 0.14, ev.kind === "repair" ? this.col("frost") : new Color3(0.75, 0.75, 0.8), 1, 0, 0); }
        break;
      }
      case "ward": this.ringFlash(x, z, 1.2, this.col("blight"), 0.5, 0.3); break;
      case "split": this.burst(x, 1.2, z, 16, new Color3(0.9, 0.88, 0.8), { speed: 3, life: 0.4, size: 0.12 }); break;
      case "spark": this.burst(x, 1, z, 3, c, { speed: 1.5, life: 0.2, size: 0.15 }); break;
    }
  }

  // ───────────────────────── per-frame sync ─────────────────────────
  sync(game: Game, alpha: number, dt: number, camRot: Quaternion) {
    this.time += dt;
    this.setBillboard(camRot);
    this.syncTelegraphs(game);
    this.syncProjectiles(game, alpha);
    this.syncZones(game);
    this.syncPickups(game);
    this.syncInteractables(game);
    for (const f of this.flashes) {
      f.t += dt;
      const k = f.t / f.dur;
      f.mat.alpha = f.alpha * Math.max(0, 1 - k);
      const s = 1 + f.grow * k;
      f.mesh.scaling.set(s, 1, s);
    }
    this.flashes = this.flashes.filter((f) => { if (f.t >= f.dur) { f.mesh.dispose(); f.mat.dispose(); return false; } return true; });
    this.add.update(dt, this.rot);
    this.smoke.update(dt, this.rot);
  }

  private teleMat(type: string, kind: "fill" | "prog" | "edge"): StandardMaterial {
    const key = `tele_${type}_${kind}_${this.settings.colorblind ? "cb" : ""}`;
    const c = this.col(type);
    const existing = this.kit.mats.get(key);
    if (existing) return existing;
    const m = new StandardMaterial(key, this.kit.scene);
    m.disableLighting = true;
    m.emissiveColor = c;
    m.diffuseColor = Color3.Black();
    m.alpha = kind === "fill" ? 0.2 : kind === "prog" ? 0.32 : 0.95;
    m.disableDepthWrite = true;
    m.backFaceCulling = false;
    m.zOffset = -2;
    if (this.settings.colorblind && kind !== "edge") { m.opacityTexture = this.kit.texture("stripes"); (m.opacityTexture as any).uScale = 2; (m.opacityTexture as any).vScale = 2; m.alpha = kind === "fill" ? 0.4 : 0.5; }
    this.kit.mats.set(key, m);
    return m;
  }

  private buildTele(t: Telegraph): TeleView {
    const s = this.kit.scene;
    const root = new TransformNode(`tele${t.id}`, s);
    const type = t.type;
    let fill: Mesh, prog: Mesh, edge: Mesh | undefined;
    switch (t.shape) {
      case "circle":
        fill = MeshBuilder.CreateDisc("tf", { radius: t.r, tessellation: 40 }, s); fill.rotation.x = Math.PI / 2;
        prog = MeshBuilder.CreateDisc("tp", { radius: t.r, tessellation: 40 }, s); prog.rotation.x = Math.PI / 2;
        edge = ringMesh("te", s, t.r - 0.08, t.r, Math.PI * 2, 48);
        break;
      case "ring":
        fill = ringMesh("tf", s, t.r2, t.r, Math.PI * 2, 32);
        prog = ringMesh("tp", s, t.r2, t.r, Math.PI * 2, 32);
        break;
      case "donut":
        fill = ringMesh("tf", s, t.r2, t.r, Math.PI * 2, 64);
        prog = ringMesh("tp", s, t.r2, t.r2 + 0.01, Math.PI * 2, 64);
        edge = ringMesh("te", s, t.r2, t.r2 + 0.12, Math.PI * 2, 64);
        break;
      case "cone":
      case "quadrant":
        fill = sectorMesh("tf", s, t.r, t.arc);
        prog = sectorMesh("tp", s, t.r, t.arc);
        edge = ringMesh("te", s, t.r - 0.1, t.r, t.arc, 48);
        break;
      case "line":
      default: {
        fill = MeshBuilder.CreateGround("tf", { width: t.len, height: t.width }, s); fill.position.x = t.len / 2;
        prog = MeshBuilder.CreateGround("tp", { width: t.len, height: t.width }, s);
        prog.bakeTransformIntoVertices(Matrix.Translation(t.len / 2, 0, 0));
        const e1 = MeshBuilder.CreateGround("te1", { width: t.len, height: 0.08 }, s); e1.position.set(t.len / 2, 0, t.width / 2);
        const e2 = MeshBuilder.CreateGround("te2", { width: t.len, height: 0.08 }, s); e2.position.set(t.len / 2, 0, -t.width / 2);
        edge = Mesh.MergeMeshes([e1, e2], true)!;
        break;
      }
    }
    for (const [m, k] of [[fill, "fill"], [prog, "prog"], [edge, "edge"]] as const) {
      if (!m) continue;
      m.material = this.teleMat(type, k);
      m.parent = root;
      m.isPickable = false;
      m.renderingGroupId = 1;
    }
    root.position.y = 0.06 + (t.id % 7) * 0.004;
    return { root, fill, prog, edge, shape: t.shape };
  }

  private syncTelegraphs(game: Game) {
    const live = new Set<number>();
    for (const t of game.telegraphs) {
      live.add(t.id);
      let v = this.teles.get(t.id);
      if (!v) { v = this.buildTele(t); this.teles.set(t.id, v); }
      v.root.position.x = t.x; v.root.position.z = t.y;
      v.root.rotation.y = -t.angle;
      const k = Math.min(1, t.t / t.dur);
      if (t.tag?.startsWith("beam")) {
        // beams: warm-up shows a pulsing lane, active shows a solid lane
        const warm = !!t.warm;
        v.prog.scaling.set(1, 1, 1);
        v.prog.isVisible = !warm || Math.sin(this.time * 18) > 0;
        (v.fill.material as StandardMaterial).alpha = 0.2;
        if (!warm && Math.random() < 0.6 * this.settings.particles) { const d = Math.random() * t.len; this.add.emit(t.x + Math.cos(t.angle) * d, 1 + Math.random(), t.y + Math.sin(t.angle) * d, 0, 1, 0, 0.3, 0.4, this.col("ember"), 1, 0, 0); }
        continue;
      }
      switch (v.shape) {
        case "circle": case "cone": case "quadrant": v.prog.scaling.set(Math.max(0.01, k), 1, Math.max(0.01, k)); break;
        case "line": v.prog.scaling.set(Math.max(0.01, k), 1, 1); break;
        case "ring": case "donut": v.prog.scaling.set(1, 1, 1); v.prog.isVisible = Math.sin(this.time * 20) > -0.2 || k > 0.7; break;
      }
      if (v.shape === "donut") { v.prog.isVisible = false; (v.fill.material as StandardMaterial).alpha = 0.15 + k * 0.25; }
    }
    for (const [id, v] of this.teles) if (!live.has(id)) { v.root.dispose(); this.teles.delete(id); }
  }

  private proto(key: string, build: () => Mesh): Mesh {
    let p = this.protos.get(key);
    if (p && !p.isDisposed()) return p;
    p = build();
    p.position.y = -1000;
    p.isPickable = false;
    this.protos.set(key, p);
    return p;
  }

  private syncProjectiles(game: Game, alpha: number) {
    const s = this.kit.scene;
    const live = new Set<number>();
    for (const pr of game.projectiles) {
      live.add(pr.id);
      let v = this.projViews.get(pr.id);
      if (!v) {
        const kind = pr.kind;
        const typeCol = pr.team === 1 ? (pr.dmgType === "physical" ? "#ff7050" : (SEMANTIC as any)[pr.dmgType]) : kind === "ghost" ? SEMANTIC.frost : SEMANTIC.player;
        const p = this.proto(`proj_${kind}_${typeCol}`, () => {
          const mat = this.kit.mat(`projmat_${typeCol}`, typeCol, { emissive: typeCol, emissiveK: 1.2, unlit: true });
          switch (kind) {
            case "arrow": case "splinter": case "bolt": return box(s, kind === "splinter" ? 0.5 : 0.8, 0.06, 0.06, mat);
            case "ghost": return sph(s, 0.5, mat, 0, 0, 0, 3, 0.5, 0.5);
            case "chain": case "hook": return torusMat(s, mat);
            case "wave": { const m = sectorMesh("w", s, 1.2, 1.6, 12); m.material = this.kit.mat("wavemat", "#ffffff", { emissive: "#f0e8d0", emissiveK: 0.8, unlit: true, alpha: 0.5 }); m.rotation.y = 0; return m; }
            default: return sph(s, 0.45, mat);
          }
        });
        v = p.createInstance(`pr${pr.id}`);
        v.isPickable = false;
        this.projViews.set(pr.id, v);
      }
      const x = pr.px + (pr.x - pr.px) * alpha, z = pr.py + (pr.y - pr.py) * alpha;
      v.position.set(x, pr.kind === "wave" ? 0.3 : 1.1, z);
      v.rotation.y = -Math.atan2(pr.vy, pr.vx);
      if (Math.random() < 0.7 * this.settings.particles) {
        const c = pr.team === 1 ? this.col(pr.dmgType === "physical" ? "ember" : pr.dmgType) : pr.kind === "ghost" ? this.col("frost") : this.col("player");
        this.add.emit(x, 1.1, z, 0, 0, 0, pr.kind === "ghost" ? 0.35 : 0.18, pr.kind === "ghost" ? 0.35 : 0.14, c, 0.8, 0, 0);
      }
    }
    for (const [id, v] of this.projViews) if (!live.has(id)) { v.dispose(); this.projViews.delete(id); }
  }

  private syncZones(game: Game) {
    const s = this.kit.scene;
    const live = new Set<number>();
    for (const z of game.zones) {
      live.add(z.id);
      let v = this.zoneViews.get(z.id);
      if (!v) {
        v = new TransformNode(`zone${z.id}`, s);
        v.position.set(z.x, 0.05, z.y);
        const disc = (r: number, col: string, a: number) => { const d = MeshBuilder.CreateDisc("zd", { radius: r, tessellation: 32 }, s); d.rotation.x = Math.PI / 2; d.material = this.kit.mat(`zone_${col}_${a}`, col, { emissive: col, emissiveK: 0.8, unlit: true, alpha: a }); (d.material as StandardMaterial).disableDepthWrite = true; d.parent = v!; d.isPickable = false; return d; };
        switch (z.kind) {
          case "fire": case "ember_trail": disc(z.r, SEMANTIC.ember, 0.3); break;
          case "blight_cloud": case "blight_pool": disc(z.r, SEMANTIC.blight, 0.3); break;
          case "trap": {
            const t = merge("trap", [cyl(s, 0.9, 1.1, 0.12, this.kit.mat("trapmat", "#3a5040"), 0, 0.06, 0, 8), ...[0, 1, 2, 3, 4].map((i) => { const c = cyl(s, 0, 0.18, 0.5, this.kit.mat("tealglow", "#3ff0d0", { emissive: "#20d0b0", emissiveK: 1.1 }), Math.cos(i * 1.25) * 0.35, 0.3, Math.sin(i * 1.25) * 0.35, 4); return c; })]);
            t.parent = v; t.isPickable = false;
            const ring = ringMesh("trapring", s, z.r - 0.06, z.r, Math.PI * 2, 32); ring.material = this.teleMat("player", "edge"); ring.parent = v; ring.position.y = 0.02;
            break;
          }
          case "standard": {
            const pole = merge("std", [cyl(s, 0.1, 0.12, 3.2, this.kit.mat("wood", "#5a3e2a"), 0, 1.6, 0, 6), box(s, 0.05, 1.3, 0.9, this.kit.mat("stdcloth", "#c8a040", { emissive: "#806010", emissiveK: 0.5 }), 0, 2.4, 0.45)]);
            pole.parent = v;
            const ring = ringMesh("stdring", s, z.r - 0.1, z.r, Math.PI * 2, 48); ring.material = this.teleMat("player", "edge"); ring.parent = v; ring.position.y = 0.02;
            break;
          }
          case "quadrant": {
            const q = sectorMesh("q", s, z.r, Math.PI / 2); q.rotation.y = -z.angle; q.material = this.kit.mat(`zone_${SEMANTIC.blight}_q`, SEMANTIC.blight, { emissive: SEMANTIC.blight, emissiveK: 0.8, unlit: true, alpha: 0.35 }); q.parent = v; q.isPickable = false; q.setEnabled(false);
            break;
          }
        }
        this.zoneViews.set(z.id, v);
      }
      const armed = z.t >= z.arm;
      if (z.kind === "quadrant") v.getChildMeshes()[0]?.setEnabled(armed);
      // ambient particles
      const p = this.settings.particles;
      if ((z.kind === "fire" || z.kind === "ember_trail") && Math.random() < 0.5 * p) this.add.emit(z.x + (Math.random() - 0.5) * z.r * 1.6, 0.2, z.y + (Math.random() - 0.5) * z.r * 1.6, 0, 1.5, 0, 0.6, 0.3, this.col("ember"), 1, -0.5, 0.5);
      if ((z.kind === "blight_cloud" || z.kind === "blight_pool" || (z.kind === "quadrant" && armed)) && Math.random() < (z.kind === "quadrant" ? 1 : 0.5) * p) { const a = Math.random() * 6.28, d = Math.random() * z.r; const ax = z.kind === "quadrant" ? z.angle + (Math.random() - 0.5) * 1.5 : a; this.smoke.emit(z.x + Math.cos(ax) * d, 0.3, z.y + Math.sin(ax) * d, 0, 0.6, 0, 1.2, 0.7, this.col("blight"), 0.45, -0.2, 0.3, 1); }
      if (z.kind === "trap" && z.t >= z.arm && Math.random() < 0.1 * p) this.add.emit(z.x, 0.4, z.y, 0, 1, 0, 0.5, 0.15, this.col("player"), 1, 0, 0);
    }
    for (const [id, v] of this.zoneViews) if (!live.has(id)) { v.dispose(); this.zoneViews.delete(id); }
  }

  private syncPickups(game: Game) {
    const s = this.kit.scene;
    const live = new Set<number>();
    for (const pk of game.pickups) {
      live.add(pk.id);
      let v = this.pickViews.get(pk.id);
      if (!v) {
        v = new TransformNode(`pk${pk.id}`, s);
        v.position.set(pk.x, 0, pk.y);
        let m: Mesh;
        switch (pk.kind) {
          case "gold": m = cyl(s, 0.32, 0.32, 0.08, this.kit.mat("goldcoin", "#ffcc40", { emissive: "#806010", emissiveK: 0.6, spec: 0.6 }), 0, 0.06, 0, 10); break;
          case "dust": m = sph(s, 0.25, this.kit.mat("dustmat", "#c090ff", { emissive: "#a060ff", emissiveK: 1 }), 0, 0.2, 0); break;
          case "globe": m = sph(s, 0.38, this.kit.mat("globemat", "#ff3040", { emissive: "#ff1030", emissiveK: 1.2 }), 0, 0.4, 0); break;
          case "echo": m = sph(s, 0.8, this.kit.mat("echomat", "#40ffe0", { emissive: "#20c0b0", emissiveK: 1, alpha: 0.6 }), 0, 1, 0, 0.7, 1.6, 0.7); break;
          case "potion": { const c = POTION_INFO[pk.potion!].color; m = merge("pot", [sph(s, 0.3, this.kit.mat(`pot_${c}`, c, { emissive: c, emissiveK: 0.6 }), 0, 0.2, 0), cyl(s, 0.1, 0.1, 0.18, this.kit.mat("cork", "#8a6a4a"), 0, 0.42, 0)]); break; }
          default: {
            const it = pk.item!;
            const col = RARITY_COLOR[it.rarity];
            const [w, h] = it.kind === "glyph" ? [1, 1] : BASE_BY_ID[it.baseId].size;
            m = box(s, 0.25 + w * 0.18, 0.12, 0.25 + h * 0.18, this.kit.mat(`loot_${it.rarity}`, col, { emissive: col, emissiveK: it.rarity === "worn" ? 0.15 : 0.6 }), 0, 0.08, 0, 0.6);
            if (it.rarity === "inscribed" || it.rarity === "relic") {
              const beam = cyl(s, 0.12, 0.3, 6, this.kit.mat(`beam_${it.rarity}`, col, { emissive: col, emissiveK: 1, unlit: true, alpha: 0.35 }), 0, 3, 0, 8);
              (beam.material as StandardMaterial).disableDepthWrite = true;
              beam.parent = v; beam.isPickable = false;
            }
          }
        }
        m.parent = v; m.isPickable = false;
        this.pickViews.set(pk.id, v);
      }
      // drop arc
      const t = Math.min(1, pk.t / 0.35);
      v.position.y = Math.sin(t * Math.PI) * 0.6;
      if (pk.kind === "globe" || pk.kind === "echo" || pk.kind === "dust") v.position.y += Math.sin(this.time * 3 + pk.id) * 0.1 + 0.05;
      if (pk.kind === "echo" && Math.random() < 0.3) this.add.emit(pk.x, 1, pk.y, (Math.random() - 0.5), 1, (Math.random() - 0.5), 0.8, 0.2, this.col("player"), 1, -1, 0.3);
    }
    for (const [id, v] of this.pickViews) if (!live.has(id)) { v.dispose(); this.pickViews.delete(id); }
  }

  private syncInteractables(game: Game) {
    const s = this.kit.scene;
    const live = new Set<number>();
    for (const it of game.interactables) {
      live.add(it.id);
      let v = this.interViews.get(it.id);
      if (!v) { v = this.buildInteract(it, game); this.interViews.set(it.id, v); }
      v.setEnabled(!it.hidden);
      const md = v.metadata ?? {};
      if (it.kind === "chest" && md.lid) md.lid.rotation.z = it.open ? -1.2 : 0;
      if (it.kind === "urn" && it.open) v.setEnabled(false);
      if (it.kind === "explosive") { if (it.open) v.setEnabled(false); else if (it.fuse > 0 && Math.random() < 0.8) this.add.emit(it.x, 1, it.y, (Math.random() - 0.5) * 2, 2, (Math.random() - 0.5) * 2, 0.4, 0.25, this.col("ember"), 1, 2, 0.5); }
      if (it.kind === "lever" && md.handle) md.handle.rotation.z = it.open ? 0.9 : -0.9;
      if (it.kind === "gate" && it.open) v.setEnabled(false);
      if (it.kind === "cage" && md.bars) md.bars.setEnabled(!it.open);
      if (it.kind === "cage" && md.calder) md.calder.setEnabled(!it.open);
      if (it.kind === "waypoint" && md.crystal) {
        const lit = game.ch.waypoints.includes(it.data.wp);
        md.crystal.rotation.y = this.time * (lit ? 1.2 : 0.2);
        md.crystal.position.y = 1.5 + Math.sin(this.time * 2) * 0.1;
        md.crystal.material = lit ? this.kit.mat("starmetal", "#4fe6ff", { emissive: "#3fd8ff", emissiveK: 1.1 }) : this.kit.mat("deadcrystal", "#4a5a60");
        if (lit && Math.random() < 0.3 * this.settings.particles) this.add.emit(it.x + (Math.random() - 0.5) * 2, 0.2, it.y + (Math.random() - 0.5) * 2, 0, 1.5, 0, 1, 0.15, this.col("player"), 1, -0.5, 0.2);
      }
      if ((it.kind === "portal" || it.kind === "hunt_portal" || (it.kind === "exit" && it.data.to !== "march" && it.data.to !== "refuge" && !it.data.requires)) && Math.random() < 0.4 * this.settings.particles) this.add.emit(it.x + (Math.random() - 0.5), 0.3 + Math.random() * 2, it.y + (Math.random() - 0.5), 0, 0.8, 0, 0.7, 0.2, it.kind === "hunt_portal" ? this.col("ember") : this.col("frost"), 1, -0.3, 0.3);
      if (it.kind === "exit" && it.data.requires && !game.ch.flags[it.data.requires] && md.seal) md.seal.setEnabled(true);
      else if (md.seal) md.seal.setEnabled(false);
      if (it.kind === "shrine" && md.flame) md.flame.setEnabled(!it.open);
    }
    for (const [id, v] of this.interViews) if (!live.has(id)) { v.dispose(); this.interViews.delete(id); }
  }

  private buildInteract(it: Game["interactables"][number], game: Game): TransformNode {
    const s = this.kit.scene, k = this.kit;
    const v = new TransformNode(`it${it.id}`, s);
    v.position.set(it.x, 0, it.y);
    const md: any = {};
    const stone = k.mat("stone", "#948c82", { spec: 0.03 });
    const wood = k.mat("wood", "#5a3e2a");
    const brass = k.mat("brass", "#a47a3a", { spec: 0.3 });
    const iron = k.mat("iron", "#4a4a52", { spec: 0.25 });
    const flame = k.mat("flame", "#ffb050", { emissive: "#ff8a30", emissiveK: 1.4, unlit: true });
    const P = (m: Mesh) => { m.parent = v; m.isPickable = false; return m; };
    switch (it.kind) {
      case "waypoint": {
        P(cyl(s, 3.2, 3.4, 0.25, stone, 0, 0.12, 0, 16));
        P(ringMesh("wpr", s, 1.2, 1.4, Math.PI * 2, 32)).material = k.mat("tealglow", "#3ff0d0", { emissive: "#20d0b0", emissiveK: 1.1 });
        v.getChildMeshes()[1].position.y = 0.27;
        for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + 0.78; P(box(s, 0.3, 1.6, 0.3, stone, Math.cos(a) * 1.4, 0.8, Math.sin(a) * 1.4)); }
        const c = MeshBuilder.CreatePolyhedron("wpc", { type: 1, size: 0.4 }, s); c.scaling.set(0.8, 1.6, 0.8); P(c); md.crystal = c;
        break;
      }
      case "chest": { P(box(s, 1, 0.6, 0.7, wood, 0, 0.3, 0)); P(box(s, 1.04, 0.08, 0.74, brass, 0, 0.4, 0)); const lid = new TransformNode("lid", s); lid.parent = v; lid.position.set(-0.5, 0.6, 0); const l = box(s, 1, 0.22, 0.7, wood, 0.5, 0.11, 0); l.parent = lid; md.lid = lid; break; }
      case "urn": P(merge("urn", [cyl(s, 0.4, 0.55, 0.8, k.mat("clay", "#8a6a50"), 0, 0.4, 0, 8), cyl(s, 0.3, 0.4, 0.15, k.mat("clay", "#8a6a50"), 0, 0.85, 0, 8)])); break;
      case "explosive": P(merge("expl", [cyl(s, 1, 0.5, 0.6, iron, 0, 0.7, 0, 8), cyl(s, 0.2, 0.35, 0.5, iron, 0, 0.25, 0, 6)])); P(sph(s, 0.7, k.mat("volatile", "#ff4020", { emissive: "#ff3010", emissiveK: 1.2 }), 0, 1.05, 0, 1, 0.6, 1)); break;
      case "lever": { P(box(s, 0.6, 0.8, 0.4, iron, 0, 0.4, 0)); const h = new TransformNode("h", s); h.parent = v; h.position.y = 0.8; const st = cyl(s, 0.08, 0.08, 1, brass, 0, 0.5, 0, 6); st.parent = h; md.handle = h; break; }
      case "gate": {
        const cells = it.data.cells as [number, number][];
        for (const [cx, cy] of cells) { if (it.data.lever) P(merge("bar", [box(s, 0.12, 2.6, 0.12, iron, cx + 0.5 - it.x, 1.3, cy + 0.5 - it.y), box(s, 1, 0.1, 0.1, iron, cx + 0.5 - it.x, 2.2, cy + 0.5 - it.y)])); else P(box(s, 0.9, 1.2, 0.25, wood, cx + 0.5 - it.x, 0.6, cy + 0.5 - it.y, Math.random())); }
        break;
      }
      case "exit": {
        const to = it.data.to as string;
        if (to === "refuge" || to === "march" && game.zone.theme !== "archive") { P(box(s, 0.3, 2.4, 0.3, wood, 0, 1.2, -1.4)); P(box(s, 0.3, 2.4, 0.3, wood, 0, 1.2, 1.4)); P(box(s, 0.35, 0.3, 3.2, wood, 0, 2.4, 0)); }
        else { P(merge("ex", [box(s, 0.6, 3, 0.6, stone, 0, 1.5, -1.6), box(s, 0.6, 3, 0.6, stone, 0, 1.5, 1.6), box(s, 0.7, 0.6, 3.8, stone, 0, 3.2, 0)])); P(MeshBuilder.CreateDisc("exd", { radius: 1.3, tessellation: 24 }, s)).material = k.mat("portalglow", "#80d8ff", { emissive: "#4090ff", emissiveK: 0.8, unlit: true, alpha: 0.35 }); const d = v.getChildMeshes()[1]; d.position.y = 1.4; d.rotation.y = Math.PI / 2; }
        if (it.data.requires) { const seal = P(box(s, 0.2, 2.6, 3, k.mat("seal", "#ff5030", { emissive: "#ff3010", emissiveK: 0.9, unlit: true, alpha: 0.5 }), 0, 1.3, 0)); md.seal = seal; }
        break;
      }
      case "portal": case "hunt_portal": {
        const col = it.kind === "portal" ? "#60c0ff" : "#ff8040";
        const ring = MeshBuilder.CreateTorus("ptr", { diameter: 2.2, thickness: 0.14, tessellation: 32 }, s); ring.material = k.mat(`portalring${col}`, col, { emissive: col, emissiveK: 1 }); ring.rotation.x = Math.PI / 2; ring.rotation.y = Math.PI / 4; ring.position.y = 1.4; P(ring);
        const disc = MeshBuilder.CreateDisc("ptd", { radius: 1.05, tessellation: 24 }, s); disc.material = k.mat(`portaldisc${col}`, col, { emissive: col, emissiveK: 0.6, unlit: true, alpha: 0.4 }); disc.position.y = 1.4; disc.rotation.y = Math.PI / 4 + Math.PI / 2; P(disc);
        break;
      }
      case "stash": P(merge("stash", [box(s, 1.4, 0.8, 0.9, k.mat("stashwood", "#4a3020"), 0, 0.4, 0), box(s, 1.46, 0.1, 0.96, brass, 0, 0.82, 0), box(s, 0.2, 0.25, 0.1, brass, 0.75, 0.5, 0)])); break;
      case "cage": {
        const bars = new TransformNode("bars", s); bars.parent = v;
        for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; const b = cyl(s, 0.08, 0.08, 2.6, iron, Math.cos(a) * 1.1, 1.3, Math.sin(a) * 1.1, 5); b.parent = bars; }
        const top = cyl(s, 2.4, 2.4, 0.15, iron, 0, 2.6, 0, 16); top.parent = bars;
        md.bars = bars;
        const cal = npcFigure(k, "#7a6040", "#ffd080"); cal.parent = v; md.calder = cal;
        break;
      }
      case "npc": {
        const look: Record<string, [string, string]> = { ivra: ["#7a3030", "#e0c080"], odo: ["#506030", "#d0b080"], wren: ["#d8d0c0", "#a0c0ff"], calder: ["#7a6040", "#ffd080"], sela: ["#3a5040", "#c0e0a0"] };
        const [c1, c2] = look[it.data.npc] ?? ["#606060", "#ffffff"];
        const f = npcFigure(k, c1, c2); f.parent = v; f.rotation.y = Math.PI / 4;
        break;
      }
      case "shrine": { P(cyl(s, 0.7, 1, 1.4, stone, 0, 0.7, 0, 8)); md.flame = P(sph(s, 0.6, flame, 0, 1.7, 0, 1, 1.4, 1)); break; }
      case "dummy_spawner": if (it.data.drill) { P(box(s, 0.2, 2.4, 0.2, wood, -0.6, 1.2, 0)); P(box(s, 0.2, 2.4, 0.2, wood, 0.6, 1.2, 0)); P(box(s, 1.5, 0.2, 0.2, wood, 0, 2.4, 0)); P(cyl(s, 0.3, 0.6, 0.6, brass, 0, 1.9, 0, 10)); } break;
    }
    v.metadata = md;
    for (const m of v.getChildMeshes()) m.isPickable = false;
    return v;
  }
}

function torusMat(s: Scene, mat: StandardMaterial) {
  const t = MeshBuilder.CreateTorus("h", { diameter: 0.5, thickness: 0.12, tessellation: 10 }, s);
  t.material = mat;
  return t;
}

export function npcFigure(k: Kit, c1: string, c2: string): TransformNode {
  const s = k.scene;
  const n = new TransformNode("npc", s);
  const robe = k.mat(`npcrobe${c1}`, c1);
  const acc = k.mat(`npcacc${c2}`, c2);
  const parts = [cyl(s, 0.4, 0.8, 1.4, robe, 0, 0.7, 0, 8), sph(s, 0.38, k.mat("skin", "#b89a80"), 0, 1.6, 0), box(s, 0.5, 0.1, 0.62, acc, 0, 1.25, 0), cyl(s, 0.1, 0.45, 0.35, robe, 0, 1.82, 0, 8)];
  for (const p of parts) { p.parent = n; p.isPickable = false; }
  return n;
}

