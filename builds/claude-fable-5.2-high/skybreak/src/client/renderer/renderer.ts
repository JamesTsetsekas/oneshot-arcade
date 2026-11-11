// renderer-world facade: entity views (actors, loot, containers, projectiles), pooled VFX and the camera.
// It consumes interpolated snapshots only; it never reads authoritative match state directly.
import { Color3, Color4, InstancedMesh, Matrix, Mesh, MeshBuilder, Quaternion, StandardMaterial, Vector3, Viewport } from "@babylonjs/core";
import type { ItemId } from "../../shared/content/items";
import { RARITIES, type AmmoType, type WeaponId } from "../../shared/content/weapons";
import { lerp, lerpAngle } from "../../shared/math";
import { ActorFlag, Mode, type ActorView, type ChestView, type RosterEntry, type Snapshot } from "../../shared/protocol/protocol";
import type { IslandData } from "../../shared/world/island";
import { ActorRig, createRigSources, type RigSources } from "./actors";
import { createAmmo, createCaravan, createChests, createItems, createRarityShapes, createSail, createSkiff, createWeapons, paint, type ChestMeshes } from "./meshes";
import { cssToRgb } from "./palette";
import { WorldScene, type Quality } from "./world";

const MAX_PARTICLES = 700;
/** A thin-instance mesh with zero instances must be disabled, or it would compile a shader variant without instancing. */
function setCount(mesh: Mesh, n: number): void {
  mesh.thinInstanceCount = n;
  if (mesh.isEnabled() !== n > 0) mesh.setEnabled(n > 0);
}
const MAX_TRACERS = 80;
const tmpS = new Vector3();
const tmpT = new Vector3();
const tmpQ = new Quaternion();
const tmpM = new Matrix();

interface LootVis {
  mesh: InstancedMesh;
  marker: InstancedMesh;
  beam: InstancedMesh | null;
  x: number;
  y: number;
  z: number;
  phase: number;
}
interface ChestVis {
  mesh: InstancedMesh;
  key: string;
  beam: InstancedMesh | null;
}
export interface ActorPose {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  view: ActorView;
}

export class GameRenderer {
  readonly world: WorldScene;
  private rigSrc: RigSources;
  private rigs = new Map<number, ActorRig>();
  private roster = new Map<number, RosterEntry>();
  readonly poses = new Map<number, ActorPose>();
  private casters = new Set<InstancedMesh>();
  private weapons: Record<WeaponId, Mesh>;
  private items: Record<ItemId, Mesh>;
  private ammo: Record<AmmoType, Mesh>;
  private chestMeshes: ChestMeshes;
  private rarityShapes: Mesh[];
  private beamSrc: Mesh;
  private loot = new Map<number, LootVis>();
  private chests = new Map<number, ChestVis>();
  private projSrc: Mesh;
  private projectiles = new Map<number, InstancedMesh>();
  private skiff: Mesh;
  private caravan: Mesh;
  private caravanShield: Mesh;
  private markerBeam: Mesh;
  private mistMesh: Mesh;
  private shellMesh: Mesh;
  private shells: { x: number; y: number; z: number; r: number; t: number; life: number; c: [number, number, number] }[] = [];
  private tracerMesh: Mesh;
  private tracerMat = new Float32Array(MAX_TRACERS * 16);
  private tracerCol = new Float32Array(MAX_TRACERS * 4);
  private tracers: { ox: number; oy: number; oz: number; tx: number; ty: number; tz: number; t: number; life: number; w: number; c: [number, number, number] }[] = [];
  private partMesh: Mesh;
  private partMat = new Float32Array(MAX_PARTICLES * 16);
  private partCol = new Float32Array(MAX_PARTICLES * 4);
  private pp = new Float32Array(MAX_PARTICLES * 12); // x y z vx vy vz life maxLife size r g b
  private pg = new Float32Array(MAX_PARTICLES * 2); // gravity drag
  private pCount = 0;
  private echoMesh: Mesh;
  echoes: { x: number; y: number; z: number; yaw: number; age: number; until: number }[] = [];
  private glintSrc: Mesh;
  private glints = new Map<number, InstancedMesh>();
  private lastSnapTick = -1;
  hideActorId = -1;
  time = 0;

  constructor(canvas: HTMLCanvasElement, readonly island: IslandData, quality: Quality) {
    this.world = new WorldScene(canvas, island, quality);
    const scene = this.world.scene;
    const lit = this.world.lit;
    this.weapons = createWeapons(scene);
    this.items = createItems(scene);
    this.ammo = createAmmo(scene);
    this.chestMeshes = createChests(scene);
    for (const m of [...Object.values(this.weapons), ...Object.values(this.items), ...Object.values(this.ammo), ...Object.values(this.chestMeshes)]) {
      m.material = lit;
      m.isVisible = false;
      m.isPickable = false;
    }
    const sailMat = new StandardMaterial("sailMat", scene);
    sailMat.diffuseColor = new Color3(1, 1, 1);
    sailMat.emissiveColor = new Color3(0.3, 0.3, 0.3);
    sailMat.specularColor = new Color3(0, 0, 0);
    sailMat.backFaceCulling = false;
    this.rigSrc = { ...createRigSources(scene, lit, sailMat, createSail(scene)), weapons: this.weapons, items: this.items };

    const glow = this.world.glow;
    this.rarityShapes = createRarityShapes(scene);
    for (const m of this.rarityShapes) {
      paint(m, [1, 1, 1]);
      m.material = this.world.unlit;
      m.registerInstancedBuffer("color", 4);
      m.instancedBuffers.color = new Color4(1, 1, 1, 1);
      m.isVisible = false;
      m.isPickable = false;
    }
    const instSrc = (m: Mesh, mat: StandardMaterial): Mesh => {
      paint(m, [1, 1, 1]);
      m.material = mat;
      m.registerInstancedBuffer("color", 4);
      m.instancedBuffers.color = new Color4(1, 1, 1, 1);
      m.isVisible = false;
      m.isPickable = false;
      return m;
    };
    const beamMat = new StandardMaterial("beamMat", scene);
    beamMat.disableLighting = true;
    beamMat.diffuseColor = new Color3(0, 0, 0);
    beamMat.emissiveColor = new Color3(1, 1, 1);
    beamMat.alpha = 0.42;
    beamMat.backFaceCulling = false;
    this.beamSrc = instSrc(MeshBuilder.CreateBox("beam", { size: 1 }, scene), beamMat);
    this.projSrc = instSrc(MeshBuilder.CreateSphere("proj", { diameter: 1, segments: 6 }, scene), glow);
    this.glintSrc = instSrc(MeshBuilder.CreateSphere("glint", { diameter: 1, segments: 4 }, scene), glow);

    this.skiff = createSkiff(scene);
    this.skiff.material = lit;
    this.skiff.isPickable = false;
    this.world.addCaster(this.skiff);
    this.caravan = createCaravan(scene);
    this.caravan.material = lit;
    this.caravan.isPickable = false;
    this.caravan.setEnabled(false);
    const shieldMat = new StandardMaterial("shieldMat", scene);
    shieldMat.disableLighting = true;
    shieldMat.emissiveColor = new Color3(0.5, 0.9, 1);
    shieldMat.diffuseColor = new Color3(0, 0, 0);
    shieldMat.alpha = 0.22;
    shieldMat.backFaceCulling = false;
    this.caravanShield = MeshBuilder.CreateSphere("cvShield", { diameter: 4.6, segments: 10 }, scene);
    this.caravanShield.material = shieldMat;
    this.caravanShield.parent = this.caravan;
    this.caravanShield.isPickable = false;

    const markerMat = beamMat.clone("markerMat");
    markerMat.emissiveColor = new Color3(1, 0.82, 0.3);
    markerMat.alpha = 0.5;
    this.markerBeam = MeshBuilder.CreateCylinder("marker", { height: 1, diameter: 1, tessellation: 8 }, scene);
    this.markerBeam.material = markerMat;
    this.markerBeam.isPickable = false;
    this.markerBeam.setEnabled(false);

    // Mist: opaque-enough clustered volumes with an identical silhouette on every quality preset.
    const mistMat = new StandardMaterial("mistMat", scene);
    mistMat.disableLighting = true;
    mistMat.diffuseColor = new Color3(0, 0, 0);
    mistMat.emissiveColor = new Color3(0.9, 0.92, 0.98);
    mistMat.alpha = 0.94;
    mistMat.fogEnabled = false;
    this.mistMesh = MeshBuilder.CreateIcoSphere("mist", { radius: 0.5, subdivisions: 2, flat: false }, scene);
    paint(this.mistMesh, [1, 1, 1], 0.12);
    this.mistMesh.material = mistMat;
    this.mistMesh.isPickable = false;
    this.mistMesh.alwaysSelectAsActiveMesh = true;
    this.mistMesh.thinInstanceSetBuffer("matrix", new Float32Array(16 * 60), 16, false);
    setCount(this.mistMesh, 0);

    const shellMat = new StandardMaterial("shellMat", scene);
    shellMat.disableLighting = true;
    shellMat.diffuseColor = new Color3(0, 0, 0);
    shellMat.emissiveColor = new Color3(1, 1, 1);
    shellMat.backFaceCulling = false;
    shellMat.fogEnabled = false;
    this.shellMesh = MeshBuilder.CreateSphere("shell", { diameter: 2, segments: 12 }, scene);
    paint(this.shellMesh, [1, 1, 1]);
    this.shellMesh.hasVertexAlpha = true;
    this.shellMesh.material = shellMat;
    this.shellMesh.isPickable = false;
    this.shellMesh.alwaysSelectAsActiveMesh = true;
    this.shellMesh.thinInstanceSetBuffer("matrix", new Float32Array(16 * 16), 16, false);
    this.shellMesh.thinInstanceSetBuffer("color", new Float32Array(4 * 16), 4, false);
    setCount(this.shellMesh, 0);

    this.tracerMesh = MeshBuilder.CreateBox("tracer", { size: 1 }, scene);
    paint(this.tracerMesh, [1, 1, 1]);
    this.tracerMesh.material = glow;
    this.tracerMesh.isPickable = false;
    this.tracerMesh.alwaysSelectAsActiveMesh = true;
    this.tracerMesh.thinInstanceSetBuffer("matrix", this.tracerMat, 16, false);
    this.tracerMesh.thinInstanceSetBuffer("color", this.tracerCol, 4, false);
    setCount(this.tracerMesh, 0);

    this.partMesh = MeshBuilder.CreateBox("particle", { size: 1 }, scene);
    paint(this.partMesh, [1, 1, 1]);
    this.partMesh.material = glow;
    this.partMesh.isPickable = false;
    this.partMesh.alwaysSelectAsActiveMesh = true;
    this.partMesh.thinInstanceSetBuffer("matrix", this.partMat, 16, false);
    this.partMesh.thinInstanceSetBuffer("color", this.partCol, 4, false);
    setCount(this.partMesh, 0);

    this.echoMesh = MeshBuilder.CreateCylinder("echo", { height: 1, diameterTop: 0, diameterBottom: 1, tessellation: 3 }, scene);
    paint(this.echoMesh, [1, 1, 1]);
    this.echoMesh.material = glow;
    this.echoMesh.isPickable = false;
    this.echoMesh.alwaysSelectAsActiveMesh = true;
    this.echoMesh.thinInstanceSetBuffer("matrix", new Float32Array(16 * 200), 16, false);
    this.echoMesh.thinInstanceSetBuffer("color", new Float32Array(4 * 200), 4, false);
    setCount(this.echoMesh, 0);
  }

  // ------------------------------------------------------------------ lifecycle

  setQuality(q: Quality): void {
    this.world.setQuality(q);
    this.world.addCaster(this.skiff);
    for (const c of this.casters) this.world.addCaster(c);
  }

  private onCaster = (m: InstancedMesh, add: boolean): void => {
    if (add) {
      this.casters.add(m);
      this.world.addCaster(m);
    } else {
      this.casters.delete(m);
      this.world.removeCaster(m);
    }
  };

  setRoster(roster: RosterEntry[]): void {
    this.resetMatch();
    for (const r of roster) this.roster.set(r.id, r);
  }

  resetMatch(): void {
    for (const r of this.rigs.values()) r.dispose();
    this.rigs.clear();
    this.roster.clear();
    this.poses.clear();
    for (const l of this.loot.values()) this.disposeLoot(l);
    this.loot.clear();
    for (const c of this.chests.values()) {
      c.mesh.dispose();
      c.beam?.dispose();
    }
    this.chests.clear();
    for (const p of this.projectiles.values()) p.dispose();
    this.projectiles.clear();
    for (const g of this.glints.values()) g.dispose();
    this.glints.clear();
    this.shells.length = 0;
    this.tracers.length = 0;
    this.pCount = 0;
    this.echoes.length = 0;
    this.lastSnapTick = -1;
    this.caravan.setEnabled(false);
    this.markerBeam.setEnabled(false);
    this.hideActorId = -1;
  }

  private disposeLoot(l: LootVis): void {
    l.mesh.dispose();
    l.marker.dispose();
    l.beam?.dispose();
  }

  // ------------------------------------------------------------------ entity sync

  private syncStatic(curr: Snapshot): void {
    // loot
    const seen = new Set<number>();
    for (const l of curr.loot) {
      seen.add(l.id);
      if (this.loot.has(l.id)) continue;
      const src = l.kind === "weapon" ? this.weapons[l.weapon!] : l.kind === "item" ? this.items[l.item!] : this.ammo[l.ammo!];
      const mesh = src.createInstance("loot");
      mesh.isPickable = false;
      const rarity = l.kind === "weapon" ? (l.rarity ?? 0) : 0;
      const marker = this.rarityShapes[rarity]!.createInstance("lootMark");
      const rc = cssToRgb(RARITIES[rarity]!.color);
      const dim = l.kind === "weapon" ? 1 : 0.7;
      marker.instancedBuffers.color = new Color4(rc[0] * dim, rc[1] * dim, rc[2] * dim, 1);
      marker.position.set(l.x, l.y + 0.05, l.z);
      marker.scaling.setAll(l.kind === "weapon" ? 1.0 : 0.6);
      marker.isPickable = false;
      let beam: InstancedMesh | null = null;
      if (l.kind === "weapon" && rarity >= 2) {
        beam = this.beamSrc.createInstance("lootBeam");
        beam.instancedBuffers.color = new Color4(rc[0], rc[1], rc[2], 1);
        beam.scaling.set(0.07, 1.6 + rarity * 0.5, 0.07);
        beam.position.set(l.x, l.y + 0.8 + rarity * 0.25, l.z);
        beam.isPickable = false;
      }
      if (l.kind === "weapon") mesh.scaling.setAll(1.25);
      this.loot.set(l.id, { mesh, marker, beam, x: l.x, y: l.y, z: l.z, phase: (l.id * 0.7) % 6.28 });
    }
    for (const [id, l] of this.loot) {
      if (!seen.has(id)) {
        this.disposeLoot(l);
        this.loot.delete(id);
      }
    }
    // containers
    const seenC = new Set<number>();
    for (const c of curr.chests) {
      seenC.add(c.id);
      const key = c.kind + (c.open ? "1" : "0");
      let vis = this.chests.get(c.id);
      if (vis && vis.key !== key) {
        vis.mesh.dispose();
        vis.beam?.dispose();
        vis = undefined;
      }
      if (!vis) {
        const cm = this.chestMeshes;
        const src = c.kind === "chest" ? (c.open ? cm.chestOpen : cm.chest) : c.kind === "locker" ? (c.open ? cm.lockerOpen : cm.locker) : c.kind === "vault" ? (c.open ? cm.vaultOpen : cm.vault) : c.kind === "capsule" ? (c.open ? cm.capsuleOpen : cm.capsule) : cm.cache;
        const mesh = src.createInstance("chest");
        mesh.isPickable = false;
        mesh.rotation.y = c.yaw;
        let beam: InstancedMesh | null = null;
        if (!c.open && (c.kind === "capsule" || c.kind === "cache" || c.kind === "vault")) {
          beam = this.beamSrc.createInstance("chestBeam");
          const col = c.kind === "capsule" ? [1, 0.8, 0.3] : c.kind === "vault" ? [0.72, 0.5, 1] : [0.8, 1, 0.7];
          beam.instancedBuffers.color = new Color4(col[0]!, col[1]!, col[2]!, 1);
          beam.isPickable = false;
        }
        vis = { mesh, key, beam };
        this.chests.set(c.id, vis);
      }
    }
    for (const [id, v] of this.chests) {
      if (!seenC.has(id)) {
        v.mesh.dispose();
        v.beam?.dispose();
        this.chests.delete(id);
      }
    }
  }

  /** Interpolates and poses everything for this frame. */
  update(prev: Snapshot | null, curr: Snapshot, alpha: number, dt: number): void {
    this.time += dt;
    const time = this.time;
    if (curr.tick !== this.lastSnapTick) {
      this.lastSnapTick = curr.tick;
      this.syncStatic(curr);
    }
    // ---- actors
    const prevById = new Map<number, ActorView>();
    if (prev) for (const a of prev.actors) prevById.set(a.id, a);
    const alive = new Set<number>();
    for (const a of curr.actors) {
      alive.add(a.id);
      const p = prevById.get(a.id);
      let x = a.x,
        y = a.y,
        z = a.z,
        yaw = a.yaw,
        pitch = a.pitch;
      if (p && Math.abs(p.x - a.x) + Math.abs(p.y - a.y) + Math.abs(p.z - a.z) < 12) {
        x = lerp(p.x, a.x, alpha);
        y = lerp(p.y, a.y, alpha);
        z = lerp(p.z, a.z, alpha);
        yaw = lerpAngle(p.yaw, a.yaw, alpha);
        pitch = lerp(p.pitch, a.pitch, alpha);
      }
      let pose = this.poses.get(a.id);
      if (!pose) {
        pose = { x, y, z, yaw, pitch, view: a };
        this.poses.set(a.id, pose);
      }
      pose.x = x;
      pose.y = y;
      pose.z = z;
      pose.yaw = yaw;
      pose.pitch = pitch;
      pose.view = a;
      let rig = this.rigs.get(a.id);
      if (!rig) {
        const entry = this.roster.get(a.id);
        if (!entry) continue;
        rig = new ActorRig(this.world.scene, this.rigSrc, entry, this.onCaster);
        this.rigs.set(a.id, rig);
      }
      rig.setVisible(a.id !== this.hideActorId);
      rig.update(a, x, y, z, yaw, pitch, dt, time);
      // scope glint for charged / aimed rail users
      const glint = (a.flags & ActorFlag.Glint) !== 0 && a.mode !== Mode.Dead;
      let g = this.glints.get(a.id);
      if (glint) {
        if (!g) {
          g = this.glintSrc.createInstance("glintI");
          g.instancedBuffers.color = new Color4(1, 1, 0.9, 1);
          g.isPickable = false;
          this.glints.set(a.id, g);
        }
        const cam = this.world.camera.position;
        const d = Math.hypot(cam.x - x, cam.y - y, cam.z - z);
        g.position.set(x + Math.sin(yaw) * 0.6, y + 1.55, z + Math.cos(yaw) * 0.6);
        g.scaling.setAll(Math.max(0.12, d * 0.006) * (0.8 + Math.sin(time * 20) * 0.2));
      } else if (g) {
        g.dispose();
        this.glints.delete(a.id);
      }
    }
    for (const [id, rig] of this.rigs) {
      if (!alive.has(id)) {
        rig.dispose();
        this.rigs.delete(id);
        this.poses.delete(id);
        const g = this.glints.get(id);
        if (g) {
          g.dispose();
          this.glints.delete(id);
        }
      }
    }
    // ---- loot idle motion
    for (const l of this.loot.values()) {
      l.mesh.position.set(l.x, l.y + 0.42 + Math.sin(time * 2 + l.phase) * 0.06, l.z);
      l.mesh.rotation.y = time * 0.9 + l.phase;
      l.marker.rotation.y = time * 0.4 + l.phase;
    }
    // ---- containers (falling capsules interpolate)
    const prevChest = new Map<number, ChestView>();
    if (prev) for (const c of prev.chests) prevChest.set(c.id, c);
    for (const c of curr.chests) {
      const vis = this.chests.get(c.id);
      if (!vis) continue;
      const p = prevChest.get(c.id);
      const y = p ? lerp(p.y, c.y, alpha) : c.y;
      vis.mesh.position.set(c.x, y, c.z);
      if (vis.beam) {
        const h = c.kind === "capsule" ? 60 : 3.2;
        vis.beam.scaling.set(c.kind === "capsule" ? 0.5 : 0.12, h, c.kind === "capsule" ? 0.5 : 0.12);
        vis.beam.position.set(c.x, y + h / 2 + 1, c.z);
      }
      if (c.kind === "capsule" && p && p.y - c.y > 0.05 && Math.random() < 0.5) this.emit(c.x, y + 2.2, c.z, (Math.random() - 0.5) * 2, 3, (Math.random() - 0.5) * 2, 0.9, 0.35, 1, 0.85, 0.5, 0, 0.5);
    }
    // ---- projectiles
    const prevProj = new Map<number, { x: number; y: number; z: number }>();
    if (prev) for (const p of prev.projectiles) prevProj.set(p.id, p);
    const seenP = new Set<number>();
    for (const p of curr.projectiles) {
      seenP.add(p.id);
      let m = this.projectiles.get(p.id);
      if (!m) {
        m = this.projSrc.createInstance("projI");
        const c = p.kind === "rail" ? [0.6, 1, 0.95] : p.kind === "mist" ? [0.9, 0.92, 1] : [0.65, 1, 0.8];
        m.instancedBuffers.color = new Color4(c[0]!, c[1]!, c[2]!, 1);
        m.scaling.setAll(p.kind === "rail" ? 0.22 : 0.34);
        m.isPickable = false;
        this.projectiles.set(p.id, m);
      }
      const q = prevProj.get(p.id);
      const x = q ? lerp(q.x, p.x, alpha) : p.x,
        y = q ? lerp(q.y, p.y, alpha) : p.y,
        z = q ? lerp(q.z, p.z, alpha) : p.z;
      m.position.set(x, y, z);
      if (p.kind === "rail") {
        if (q) this.tracer(q.x, q.y, q.z, p.x, p.y, p.z, [0.55, 1, 0.92], 0.16, 0.09);
      } else this.emit(x, y, z, 0, 0.4, 0, 0.35, 0.14, 0.7, 1, 0.85, 0, 1);
    }
    for (const [id, m] of this.projectiles) {
      if (!seenP.has(id)) {
        m.dispose();
        this.projectiles.delete(id);
      }
    }
    // ---- mist volumes
    if (curr.mists.length > 0 || this.mistMesh.thinInstanceCount > 0) {
      const data = new Float32Array(16 * 60);
      let n = 0;
      for (const mi of curr.mists) {
        const grow = Math.min(1, mi.age / 0.7);
        const fade = Math.min(1, Math.max(0, (12 - mi.age) / 1.2));
        const s = grow * (0.35 + 0.65 * fade);
        for (let i = 0; i < 10 && n < 60; i++) {
          const a = i * 2.39996;
          const rr = i === 0 ? 0 : mi.r * 0.52;
          const hy = i === 0 ? 0 : ((i % 3) - 1) * mi.r * 0.28;
          const size = (i === 0 ? mi.r * 1.5 : mi.r * 1.05) * s * (1 + Math.sin(time * 0.8 + i) * 0.03);
          tmpS.set(size, size * 0.8, size);
          tmpT.set(mi.x + Math.sin(a) * rr, mi.y + hy, mi.z + Math.cos(a) * rr);
          Quaternion.RotationYawPitchRollToRef(a + time * 0.05, 0, 0, tmpQ);
          Matrix.ComposeToRef(tmpS, tmpQ, tmpT, tmpM);
          tmpM.copyToArray(data, n * 16);
          n++;
        }
      }
      this.mistMesh.thinInstanceSetBuffer("matrix", data, 16, false);
      setCount(this.mistMesh, n);
    }
    // ---- skiff
    const s = curr.skiff;
    if (s.active) {
      const ps = prev ? prev.skiff : s;
      this.skiff.setEnabled(true);
      this.skiff.position.set(lerp(ps.x, s.x, alpha), s.y - 1.5 + Math.sin(time * 0.8) * 0.3, lerp(ps.z, s.z, alpha));
      this.skiff.rotation.set(Math.sin(time * 0.6) * 0.015, s.yaw, Math.sin(time * 0.45) * 0.02);
    } else if (curr.phase === "staging" || curr.phase === "skiff") {
      // moored beside the staging pier
      const pier = this.island.pier;
      this.skiff.setEnabled(true);
      this.skiff.position.set(pier.x - 6, pier.y + 2.6 + Math.sin(time * 0.8) * 0.2, pier.z - 31);
      this.skiff.rotation.set(0, Math.PI / 2, Math.sin(time * 0.5) * 0.02);
    } else if (this.island.pier && curr.storm.totalPhases > 0 && curr.phase === "active" && !curr.storm.timer && curr.storm.state === "calm") {
      // practice range: skiff stays moored
      const pier = this.island.pier;
      this.skiff.setEnabled(true);
      this.skiff.position.set(pier.x - 6, pier.y + 2.6 + Math.sin(time * 0.8) * 0.2, pier.z - 31);
      this.skiff.rotation.set(0, Math.PI / 2, 0);
    } else this.skiff.setEnabled(false);
    // ---- caravan
    const cv = curr.caravan;
    if (cv) {
      const pc = prev?.caravan ?? cv;
      this.caravan.setEnabled(true);
      this.caravan.position.set(lerp(pc.x, cv.x, alpha), lerp(pc.y, cv.y, alpha) + Math.sin(time * 1.3) * 0.3, lerp(pc.z, cv.z, alpha));
      this.caravan.rotation.y = time * 0.5;
      this.caravanShield.setEnabled(cv.alive);
      if (Math.random() < 0.3) this.emit(this.caravan.position.x, this.caravan.position.y - 1.6, this.caravan.position.z, 0, -2, 0, 0.6, 0.2, 0.7, 0.5, 1, 0, 1);
    } else this.caravan.setEnabled(false);
    // ---- map marker beam
    const mk = curr.you.marker;
    if (mk) {
      const gy = Math.max(0, this.island.hf.height(mk.x, mk.z));
      this.markerBeam.setEnabled(true);
      this.markerBeam.position.set(mk.x, gy + 90, mk.z);
      this.markerBeam.scaling.set(1.1, 180, 1.1);
    } else this.markerBeam.setEnabled(false);

    this.stepFx(dt);
  }

  // ------------------------------------------------------------------ fx

  emit(x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number, size: number, r: number, g: number, b: number, gravity = 9, drag = 0): void {
    if (this.pCount >= MAX_PARTICLES) return;
    const i = this.pCount++;
    const p = this.pp;
    p[i * 12] = x;
    p[i * 12 + 1] = y;
    p[i * 12 + 2] = z;
    p[i * 12 + 3] = vx;
    p[i * 12 + 4] = vy;
    p[i * 12 + 5] = vz;
    p[i * 12 + 6] = life;
    p[i * 12 + 7] = life;
    p[i * 12 + 8] = size;
    p[i * 12 + 9] = r;
    p[i * 12 + 10] = g;
    p[i * 12 + 11] = b;
    this.pg[i * 2] = gravity;
    this.pg[i * 2 + 1] = drag;
  }

  burst(x: number, y: number, z: number, n: number, speed: number, life: number, size: number, c: [number, number, number], gravity = 9, up = 0.4): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const e = Math.random() * 2 - 1 + up;
      const sp = speed * (0.4 + Math.random() * 0.6);
      const h = Math.sqrt(Math.max(0, 1 - Math.min(1, e * e)));
      this.emit(x, y, z, Math.sin(a) * h * sp, e * sp, Math.cos(a) * h * sp, life * (0.6 + Math.random() * 0.5), size * (0.6 + Math.random() * 0.7), c[0], c[1], c[2], gravity, 1.5);
    }
  }

  tracer(ox: number, oy: number, oz: number, tx: number, ty: number, tz: number, c: [number, number, number], life = 0.09, w = 0.05): void {
    if (this.tracers.length >= MAX_TRACERS) this.tracers.shift();
    this.tracers.push({ ox, oy, oz, tx, ty, tz, t: 0, life, w, c });
  }

  shell(x: number, y: number, z: number, r: number, c: [number, number, number], life = 0.45): void {
    if (this.shells.length >= 16) this.shells.shift();
    this.shells.push({ x, y, z, r, t: 0, life, c });
  }

  private stepFx(dt: number): void {
    // particles
    const p = this.pp;
    let n = this.pCount;
    for (let i = 0; i < n; ) {
      const o = i * 12;
      p[o + 6] = p[o + 6]! - dt;
      if (p[o + 6]! <= 0) {
        n--;
        p.copyWithin(o, n * 12, n * 12 + 12);
        this.pg[i * 2] = this.pg[n * 2]!;
        this.pg[i * 2 + 1] = this.pg[n * 2 + 1]!;
        continue;
      }
      const drag = Math.max(0, 1 - this.pg[i * 2 + 1]! * dt);
      p[o + 3] = p[o + 3]! * drag;
      p[o + 5] = p[o + 5]! * drag;
      p[o + 4] = p[o + 4]! * drag - this.pg[i * 2]! * dt;
      p[o] = p[o]! + p[o + 3]! * dt;
      p[o + 1] = p[o + 1]! + p[o + 4]! * dt;
      p[o + 2] = p[o + 2]! + p[o + 5]! * dt;
      const k = p[o + 6]! / p[o + 7]!;
      const s = p[o + 8]! * (0.3 + 0.7 * k);
      const m = this.partMat;
      const mo = i * 16;
      // scale + translate with a cheap tumble
      const a = (o * 0.37 + k * 3) % 6.28;
      const ca = Math.cos(a) * s,
        sa = Math.sin(a) * s;
      m[mo] = ca; m[mo + 1] = 0; m[mo + 2] = -sa; m[mo + 3] = 0;
      m[mo + 4] = 0; m[mo + 5] = s; m[mo + 6] = 0; m[mo + 7] = 0;
      m[mo + 8] = sa; m[mo + 9] = 0; m[mo + 10] = ca; m[mo + 11] = 0;
      m[mo + 12] = p[o]!; m[mo + 13] = p[o + 1]!; m[mo + 14] = p[o + 2]!; m[mo + 15] = 1;
      const co = i * 4;
      this.partCol[co] = p[o + 9]!;
      this.partCol[co + 1] = p[o + 10]!;
      this.partCol[co + 2] = p[o + 11]!;
      this.partCol[co + 3] = 1;
      i++;
    }
    this.pCount = n;
    setCount(this.partMesh, n);
    if (n > 0) {
      this.partMesh.thinInstanceBufferUpdated("matrix");
      this.partMesh.thinInstanceBufferUpdated("color");
    }
    // tracers
    let tn = 0;
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i]!;
      t.t += dt;
      if (t.t >= t.life) {
        this.tracers.splice(i, 1);
        continue;
      }
    }
    for (const t of this.tracers) {
      const dx = t.tx - t.ox,
        dy = t.ty - t.oy,
        dz = t.tz - t.oz;
      const len = Math.hypot(dx, dy, dz);
      if (len < 0.01) continue;
      const k = 1 - t.t / t.life;
      // the streak travels along the path
      const head = Math.min(1, t.t / t.life + 0.35);
      const tail = Math.max(0, head - 0.55);
      const segLen = len * (head - tail);
      tmpS.set(t.w * k, t.w * k, segLen);
      tmpT.set(t.ox + dx * (head + tail) * 0.5, t.oy + dy * (head + tail) * 0.5, t.oz + dz * (head + tail) * 0.5);
      Quaternion.RotationYawPitchRollToRef(Math.atan2(dx, dz), -Math.atan2(dy, Math.hypot(dx, dz)), 0, tmpQ);
      Matrix.ComposeToRef(tmpS, tmpQ, tmpT, tmpM);
      tmpM.copyToArray(this.tracerMat, tn * 16);
      this.tracerCol[tn * 4] = t.c[0];
      this.tracerCol[tn * 4 + 1] = t.c[1];
      this.tracerCol[tn * 4 + 2] = t.c[2];
      this.tracerCol[tn * 4 + 3] = 1;
      tn++;
    }
    setCount(this.tracerMesh, tn);
    if (tn > 0) {
      this.tracerMesh.thinInstanceBufferUpdated("matrix");
      this.tracerMesh.thinInstanceBufferUpdated("color");
    }
    // shock shells
    if (this.shells.length || this.shellMesh.thinInstanceCount) {
      const mats = new Float32Array(16 * 16);
      const cols = new Float32Array(4 * 16);
      let sn = 0;
      for (let i = this.shells.length - 1; i >= 0; i--) {
        const sh = this.shells[i]!;
        sh.t += dt;
        if (sh.t >= sh.life) this.shells.splice(i, 1);
      }
      for (const sh of this.shells) {
        const k = sh.t / sh.life;
        const r = sh.r * (0.15 + 0.85 * (1 - (1 - k) * (1 - k)));
        tmpS.set(r, r, r);
        tmpT.set(sh.x, sh.y, sh.z);
        Matrix.ComposeToRef(tmpS, Quaternion.Identity(), tmpT, tmpM);
        tmpM.copyToArray(mats, sn * 16);
        cols[sn * 4] = sh.c[0];
        cols[sn * 4 + 1] = sh.c[1];
        cols[sn * 4 + 2] = sh.c[2];
        cols[sn * 4 + 3] = 0.42 * (1 - k);
        sn++;
      }
      this.shellMesh.thinInstanceSetBuffer("matrix", mats, 16, false);
      this.shellMesh.thinInstanceSetBuffer("color", cols, 4, false);
      setCount(this.shellMesh, sn);
    }
    // echo trails
    if (this.echoes.length || this.echoMesh.thinInstanceCount) {
      const now = this.time;
      this.echoes = this.echoes.filter((e) => e.until > now);
      const mats = new Float32Array(16 * 200);
      const cols = new Float32Array(4 * 200);
      let en = 0;
      for (const e of this.echoes) {
        if (en >= 200) break;
        const fresh = 1 - Math.min(1, e.age / 12);
        const pulse = 0.85 + Math.sin(now * 4 + e.x) * 0.15;
        tmpS.set(0.5, 0.9 * pulse, 0.5);
        tmpT.set(e.x, e.y + 0.5, e.z);
        // arrowhead leaning in the direction of travel
        Quaternion.RotationYawPitchRollToRef(e.yaw, 1.2, 0, tmpQ);
        Matrix.ComposeToRef(tmpS, tmpQ, tmpT, tmpM);
        tmpM.copyToArray(mats, en * 16);
        cols[en * 4] = 0.75 * (0.4 + fresh * 0.6);
        cols[en * 4 + 1] = 0.5 * (0.4 + fresh * 0.6);
        cols[en * 4 + 2] = 1;
        cols[en * 4 + 3] = 1;
        en++;
      }
      this.echoMesh.thinInstanceSetBuffer("matrix", mats, 16, false);
      this.echoMesh.thinInstanceSetBuffer("color", cols, 4, false);
      setCount(this.echoMesh, en);
    }
  }

  rig(id: number): ActorRig | undefined {
    return this.rigs.get(id);
  }

  // ------------------------------------------------------------------ camera & output

  setCamera(x: number, y: number, z: number, yaw: number, pitch: number, vfov: number): void {
    const cam = this.world.camera;
    cam.position.set(x, y, z);
    cam.rotation.set(-pitch, yaw, 0);
    cam.fov = vfov;
  }

  /** Projects a world point to CSS pixels. Returns false when behind the camera. */
  project(x: number, y: number, z: number, out: { x: number; y: number }): boolean {
    const scene = this.world.scene;
    const eng = this.world.engine;
    const w = eng.getRenderWidth(),
      h = eng.getRenderHeight();
    tmpT.set(x, y, z);
    const p = Vector3.Project(tmpT, Matrix.IdentityReadOnly, scene.getTransformMatrix(), new Viewport(0, 0, w, h));
    const scale = this.world.renderScale / (window.devicePixelRatio || 1);
    void scale;
    out.x = (p.x / w) * eng.getRenderingCanvas()!.clientWidth;
    out.y = (p.y / h) * eng.getRenderingCanvas()!.clientHeight;
    return p.z > 0 && p.z < 1;
  }

  render(): void {
    this.world.scene.render();
  }

  resize(): void {
    this.world.engine.resize();
  }
}
