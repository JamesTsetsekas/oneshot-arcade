// Pooled effects: tracers, muzzle flashes, impacts, decals (cap 250), explosions,
// obscurant volumes, thrown equipment, support devices, strikes, footprints.
import {
  Scene, Mesh, MeshBuilder, StandardMaterial, Color3, Color4, Vector3, ParticleSystem, PointLight, Engine, TransformNode, Quaternion,
} from "@babylonjs/core";
import { procTexture } from "./textures";
import { ProjectileSnap, SmokeSnap, DeviceSnap, StrikeSnap, Snapshot } from "../shared/protocol";
import { Vec3 } from "../shared/math";

const IMPACT_COLORS: Record<string, [Color4, Color4]> = {
  concrete: [new Color4(0.7, 0.68, 0.63, 0.9), new Color4(0.5, 0.48, 0.45, 0.6)],
  composite: [new Color4(0.85, 0.83, 0.78, 0.9), new Color4(0.6, 0.6, 0.55, 0.6)],
  metal: [new Color4(1, 0.75, 0.3, 1), new Color4(1, 0.5, 0.1, 0.8)],
  rock: [new Color4(0.55, 0.5, 0.42, 0.9), new Color4(0.4, 0.36, 0.3, 0.6)],
  crate: [new Color4(0.5, 0.52, 0.4, 0.9), new Color4(0.35, 0.36, 0.28, 0.6)],
  glass: [new Color4(0.8, 0.95, 1, 1), new Color4(0.6, 0.85, 1, 0.8)],
  flesh: [new Color4(0.55, 0.08, 0.06, 0.9), new Color4(0.35, 0.05, 0.04, 0.6)],
};

export class Vfx {
  private tracers: { m: Mesh; t: number; life: number; from: Vector3; to: Vector3 }[] = [];
  private flashes: { m: Mesh; t: number }[] = [];
  private flashLight: PointLight;
  private flashLightT = 1;
  private impactPs: ParticleSystem[] = [];
  private impactIdx = 0;
  private decals: Mesh[] = [];
  private decalIdx = 0;
  private boomPs: ParticleSystem[] = [];
  private boomIdx = 0;
  private boomLight: PointLight;
  private boomLightT = 2;
  private fireballs: { m: Mesh; t: number; r: number }[] = [];
  private smokeViews = new Map<number, { ps: ParticleSystem; core: Mesh[] }>();
  private projViews = new Map<number, { node: TransformNode; laser?: Mesh; light?: Mesh }>();
  private devViews = new Map<number, { node: TransformNode; rotors: Mesh[] }>();
  private strikeViews = new Map<number, { ring?: Mesh; plane?: TransformNode; shell?: Mesh }>();
  private footViews: Mesh[] = [];
  private mats: Record<string, StandardMaterial> = {};
  private glassPs: ParticleSystem;
  reducedFlash = false;
  smokeQuality = 1;

  constructor(private scene: Scene, quality: "low" | "medium" | "high") {
    this.smokeQuality = quality === "low" ? 0.5 : quality === "medium" ? 0.8 : 1;
    const em = (n: string, c: Color3, alphaTex?: string, add = true) => {
      const m = new StandardMaterial(n, scene); m.emissiveColor = c; m.diffuseColor = Color3.Black(); m.specularColor = Color3.Black(); m.disableLighting = true;
      if (alphaTex) { m.opacityTexture = procTexture(scene, alphaTex, 128, { alpha: true }); }
      if (add) m.alphaMode = Engine.ALPHA_ADD;
      this.mats[n] = m; return m;
    };
    em("tracer", new Color3(1, 0.78, 0.4));
    em("flash", new Color3(1, 0.78, 0.42), "flare");
    em("fireball", new Color3(1, 0.6, 0.25), "soft");
    em("redRing", new Color3(1, 0.15, 0.1), "ring");
    em("laser", new Color3(1, 0.1, 0.08));
    em("cyanLight", new Color3(0.2, 0.9, 1));
    em("redLight", new Color3(1, 0.15, 0.1));
    em("amberLight", new Color3(1, 0.6, 0.1));
    em("footprint", new Color3(1, 0.5, 0.15), "footprint");
    const decalMat = new StandardMaterial("decal", scene);
    decalMat.diffuseTexture = procTexture(scene, "decal", 64, { alpha: true }); decalMat.diffuseTexture.hasAlpha = true; decalMat.useAlphaFromDiffuseTexture = true;
    decalMat.specularColor = Color3.Black(); decalMat.zOffset = -2; decalMat.backFaceCulling = false;
    this.mats.decal = decalMat;
    const dark = new StandardMaterial("devDark", scene); dark.diffuseColor = new Color3(0.14, 0.15, 0.16); dark.specularColor = new Color3(0.3, 0.3, 0.3); this.mats.dark = dark;
    const orange = new StandardMaterial("devOrange", scene); orange.diffuseColor = new Color3(0.9, 0.45, 0.12); this.mats.orange = orange;
    const grey = new StandardMaterial("devGrey", scene); grey.diffuseColor = new Color3(0.55, 0.57, 0.6); this.mats.grey = grey;
    const smokeMat = new StandardMaterial("smokeCore", scene);
    smokeMat.diffuseColor = new Color3(0.78, 0.8, 0.82); smokeMat.emissiveColor = new Color3(0.42, 0.44, 0.46); smokeMat.specularColor = Color3.Black();
    smokeMat.opacityTexture = procTexture(scene, "soft", 128, { alpha: true }); smokeMat.alpha = 0.92; smokeMat.backFaceCulling = false;
    this.mats.smoke = smokeMat;

    this.flashLight = new PointLight("muzzleLight", Vector3.Zero(), scene);
    this.flashLight.diffuse = new Color3(1, 0.75, 0.4); this.flashLight.range = 9; this.flashLight.intensity = 0;
    this.boomLight = new PointLight("boomLight", Vector3.Zero(), scene);
    this.boomLight.diffuse = new Color3(1, 0.65, 0.3); this.boomLight.range = 22; this.boomLight.intensity = 0;

    const soft = procTexture(scene, "soft", 64, { alpha: true });
    const smokeTex = procTexture(scene, "smoke", 128, { alpha: true, seed: 21 });
    for (let i = 0; i < 10; i++) {
      const ps = new ParticleSystem(`imp${i}`, 40, scene);
      ps.particleTexture = soft; ps.emitter = Vector3.Zero(); ps.manualEmitCount = 0;
      ps.minSize = 0.03; ps.maxSize = 0.12; ps.minLifeTime = 0.12; ps.maxLifeTime = 0.35;
      ps.minEmitPower = 1.5; ps.maxEmitPower = 4; ps.gravity = new Vector3(0, -9, 0);
      ps.blendMode = ParticleSystem.BLENDMODE_STANDARD; ps.colorDead = new Color4(0.5, 0.5, 0.5, 0);
      ps.start();
      this.impactPs.push(ps);
    }
    for (let i = 0; i < 4; i++) {
      const ps = new ParticleSystem(`boom${i}`, 160, scene);
      ps.particleTexture = smokeTex; ps.emitter = Vector3.Zero(); ps.manualEmitCount = 0;
      ps.minSize = 0.8; ps.maxSize = 2.6; ps.minLifeTime = 0.6; ps.maxLifeTime = 1.6;
      ps.minEmitPower = 3; ps.maxEmitPower = 9; ps.gravity = new Vector3(0, 1.5, 0);
      ps.color1 = new Color4(0.45, 0.42, 0.4, 0.75); ps.color2 = new Color4(0.3, 0.28, 0.27, 0.6); ps.colorDead = new Color4(0.25, 0.25, 0.25, 0);
      ps.direction1 = new Vector3(-1, 0.4, -1); ps.direction2 = new Vector3(1, 1.6, 1);
      ps.blendMode = ParticleSystem.BLENDMODE_STANDARD;
      ps.start();
      this.boomPs.push(ps);
    }
    this.glassPs = new ParticleSystem("glassPs", 120, scene);
    this.glassPs.particleTexture = soft; this.glassPs.emitter = Vector3.Zero(); this.glassPs.manualEmitCount = 0;
    this.glassPs.minSize = 0.03; this.glassPs.maxSize = 0.09; this.glassPs.minLifeTime = 0.5; this.glassPs.maxLifeTime = 1.0;
    this.glassPs.color1 = new Color4(0.8, 0.95, 1, 1); this.glassPs.color2 = new Color4(0.6, 0.85, 1, 0.9); this.glassPs.colorDead = new Color4(0.7, 0.9, 1, 0);
    this.glassPs.gravity = new Vector3(0, -9.8, 0); this.glassPs.minEmitPower = 1; this.glassPs.maxEmitPower = 3;
    this.glassPs.minEmitBox = new Vector3(-0.6, -0.6, -0.6); this.glassPs.maxEmitBox = new Vector3(0.6, 0.6, 0.6);
    this.glassPs.start();
  }

  tracer(from: Vec3, to: Vec3) {
    let tr = this.tracers.find((t) => t.t >= t.life);
    if (!tr) {
      if (this.tracers.length > 40) return;
      const m = MeshBuilder.CreateBox("tracer", { width: 0.018, height: 0.018, depth: 1 }, this.scene);
      m.material = this.mats.tracer; m.isPickable = false;
      tr = { m, t: 1, life: 0.06, from: new Vector3(), to: new Vector3() };
      this.tracers.push(tr);
    }
    tr.from.set(from.x, from.y, from.z); tr.to.set(to.x, to.y, to.z);
    const len = Vector3.Distance(tr.from, tr.to);
    tr.life = Math.min(0.12, Math.max(0.04, len / 400));
    tr.t = 0;
    tr.m.isVisible = true;
  }

  muzzleFlash(at: Vector3, scale: number) {
    let f = this.flashes.find((x) => x.t > 0.05);
    if (!f) {
      if (this.flashes.length > 12) return;
      const m = MeshBuilder.CreatePlane("tflash", { size: 0.5 }, this.scene);
      m.material = this.mats.flash; m.billboardMode = Mesh.BILLBOARDMODE_ALL; m.isPickable = false;
      f = { m, t: 1 }; this.flashes.push(f);
    }
    f.t = 0; f.m.position.copyFrom(at); f.m.scaling.setAll(Math.max(0.3, scale)); f.m.isVisible = true;
    this.flashLight.position.copyFrom(at); this.flashLightT = 0;
  }

  impact(pos: Vec3, normal: Vec3, mat: string, decal = true) {
    const ps = this.impactPs[this.impactIdx++ % this.impactPs.length];
    const [c1, c2] = IMPACT_COLORS[mat] ?? IMPACT_COLORS.concrete;
    ps.color1 = c1; ps.color2 = c2;
    (ps.emitter as Vector3).set(pos.x + normal.x * 0.03, pos.y + normal.y * 0.03, pos.z + normal.z * 0.03);
    ps.direction1 = new Vector3(normal.x - 0.6, normal.y - 0.2, normal.z - 0.6);
    ps.direction2 = new Vector3(normal.x + 0.6, normal.y + 0.9, normal.z + 0.6);
    ps.manualEmitCount = mat === "metal" ? 10 : 7;
    if (!decal || mat === "glass" || mat === "flesh") return;
    let d = this.decals[this.decalIdx % 250];
    if (!d) {
      d = MeshBuilder.CreatePlane("decal", { size: 0.11 }, this.scene);
      d.material = this.mats.decal; d.isPickable = false;
      this.decals[this.decalIdx % 250] = d;
    }
    this.decalIdx++;
    d.position.set(pos.x + normal.x * 0.012, pos.y + normal.y * 0.012, pos.z + normal.z * 0.012);
    const n = new Vector3(normal.x, normal.y, normal.z);
    // plane faces -Z; orient so -Z points opposite the normal (into the surface)
    const fwd = n.scale(-1);
    const up = Math.abs(n.y) > 0.9 ? new Vector3(1, 0, 0) : Vector3.Up();
    d.rotationQuaternion = Quaternion.FromLookDirectionLH(fwd, up);
    d.rotation.set(0, 0, 0);
    d.isVisible = true;
    d.scaling.setAll(0.8 + Math.random() * 0.5);
  }

  glassBreak(pos: Vec3) {
    (this.glassPs.emitter as Vector3).set(pos.x, pos.y, pos.z);
    this.glassPs.manualEmitCount = 60;
  }

  explosion(pos: Vec3, kind: string, radius: number) {
    const ps = this.boomPs[this.boomIdx++ % this.boomPs.length];
    (ps.emitter as Vector3).set(pos.x, pos.y + 0.3, pos.z);
    if (kind === "flash") {
      ps.color1 = new Color4(1, 1, 1, 0.6); ps.color2 = new Color4(0.9, 0.9, 0.9, 0.4); ps.manualEmitCount = 12;
    } else if (kind === "obscurant") {
      ps.manualEmitCount = 0;
    } else {
      ps.color1 = new Color4(0.42, 0.4, 0.38, 0.8); ps.color2 = new Color4(0.28, 0.26, 0.25, 0.65);
      ps.manualEmitCount = Math.round(Math.min(90, 20 + radius * 8) * this.smokeQuality);
      ps.minEmitPower = radius * 0.6; ps.maxEmitPower = radius * 1.6;
    }
    let fb = this.fireballs.find((f) => f.t > 0.5);
    if (!fb) { const m = MeshBuilder.CreatePlane("fireball", { size: 1 }, this.scene); m.material = this.mats.fireball; m.billboardMode = Mesh.BILLBOARDMODE_ALL; fb = { m, t: 1, r: 1 }; this.fireballs.push(fb); }
    fb.t = 0; fb.r = kind === "flash" ? (this.reducedFlash ? 1.5 : 4) : kind === "device" ? 2.5 : radius * 0.9; fb.m.position.set(pos.x, pos.y + 0.6, pos.z); fb.m.isVisible = kind !== "obscurant";
    (fb.m.material as StandardMaterial).emissiveColor = kind === "flash" ? new Color3(1, 1, 1) : new Color3(1, 0.6, 0.25);
    this.boomLight.position.set(pos.x, pos.y + 1, pos.z);
    this.boomLightT = kind === "obscurant" ? 2 : 0;
    this.boomLight.diffuse = kind === "flash" ? new Color3(1, 1, 1) : new Color3(1, 0.65, 0.3);
  }

  footprints(list: Snapshot["footprints"]) {
    for (let i = 0; i < Math.max(list.length, this.footViews.length); i++) {
      let m = this.footViews[i];
      const f = list[i];
      if (!f) { if (m) m.isVisible = false; continue; }
      if (!m) { m = MeshBuilder.CreatePlane("fp", { width: 0.22, height: 0.36 }, this.scene); m.material = this.mats.footprint; m.rotation.x = Math.PI / 2; m.isPickable = false; this.footViews[i] = m; }
      m.isVisible = true; m.position.set(f.x, f.y + 0.03, f.z); m.rotation.y = f.yaw; m.visibility = Math.max(0, 1 - f.age / 4);
    }
  }

  syncSmokes(list: SmokeSnap[]) {
    const seen = new Set<number>();
    for (const s of list) {
      seen.add(s.id);
      let v = this.smokeViews.get(s.id);
      if (!v) {
        const ps = new ParticleSystem(`smoke${s.id}`, Math.round(260 * this.smokeQuality), this.scene);
        ps.particleTexture = procTexture(this.scene, "smoke", 128, { alpha: true, seed: 33 });
        ps.emitter = new Vector3(s.pos.x, s.pos.y + 0.5, s.pos.z);
        ps.color1 = new Color4(0.82, 0.84, 0.86, 0.55); ps.color2 = new Color4(0.7, 0.72, 0.75, 0.5); ps.colorDead = new Color4(0.75, 0.77, 0.8, 0);
        ps.minSize = 2.5; ps.maxSize = 4.5; ps.minLifeTime = 2.5; ps.maxLifeTime = 4.5; ps.emitRate = 60 * this.smokeQuality;
        ps.createSphereEmitter(1.5, 1);
        ps.minEmitPower = 0.4; ps.maxEmitPower = 1.2; ps.gravity = new Vector3(0, 0.05, 0);
        ps.blendMode = ParticleSystem.BLENDMODE_STANDARD;
        ps.start();
        const core: Mesh[] = [];
        for (let i = 0; i < 7; i++) {
          const m = MeshBuilder.CreateSphere("smokeCore", { diameter: 2, segments: 10 }, this.scene);
          m.material = this.mats.smoke; m.isPickable = false;
          core.push(m);
        }
        v = { ps, core };
        this.smokeViews.set(s.id, v);
      }
      // gameplay-authoritative opaque core matches the server sight-blocking radius
      const r = s.radius;
      v.core.forEach((m, i) => {
        const a = (i / v!.core.length) * Math.PI * 2;
        const off = i === 0 ? 0 : r * 0.38;
        m.position.set(s.pos.x + Math.cos(a) * off, s.pos.y + r * 0.45 + (i % 2) * r * 0.2, s.pos.z + Math.sin(a) * off);
        m.scaling.setAll(Math.max(0.01, r * (i === 0 ? 0.95 : 0.7)));
      });
      if (s.life - s.t < 2) v.ps.emitRate = 0;
      (v.ps as ParticleSystem).createSphereEmitter(Math.max(0.5, r * 0.8), 1);
    }
    for (const [id, v] of this.smokeViews) if (!seen.has(id)) { v.ps.stop(); v.ps.disposeOnStop = true; for (const m of v.core) m.dispose(); this.smokeViews.delete(id); }
  }

  syncProjectiles(list: ProjectileSnap[], localTeam: number, munitionsEye: boolean, t: number) {
    const seen = new Set<number>();
    for (const q of list) {
      seen.add(q.id);
      let v = this.projViews.get(q.id);
      if (!v) {
        const node = new TransformNode(`proj${q.id}`, this.scene);
        let body: Mesh;
        if (q.kind === "breachMine") {
          body = MeshBuilder.CreateBox("mine", { width: 0.3, height: 0.14, depth: 0.08 }, this.scene); body.position.y = 0.1; body.material = this.mats.dark;
        } else if (q.kind === "signalDart") {
          body = MeshBuilder.CreateCylinder("dart", { height: 0.22, diameter: 0.03 }, this.scene); body.rotation.x = Math.PI / 2; body.material = this.mats.grey;
        } else {
          body = MeshBuilder.CreateCylinder("nade", { height: 0.12, diameter: 0.075, tessellation: 10 }, this.scene); body.material = q.kind === "frag" || q.kind === "adhesive" ? this.mats.dark : this.mats.grey;
          const band = MeshBuilder.CreateCylinder("band", { height: 0.03, diameter: 0.08 }, this.scene); band.parent = node; band.material = q.kind === "obscurant" ? this.mats.grey : this.mats.orange;
        }
        body.parent = node; body.isPickable = false;
        v = { node };
        const lightMat = q.team === localTeam ? this.mats.cyanLight : this.mats.redLight;
        if (q.kind === "breachMine") {
          const laser = MeshBuilder.CreateBox("laser", { width: 0.012, height: 0.012, depth: 2.6 }, this.scene);
          laser.parent = node; laser.position.set(0, 0.12, 1.3); laser.material = this.mats.laser; laser.isPickable = false; v.laser = laser;
        }
        if (q.kind === "adhesive" || q.kind === "breachMine" || q.kind === "signalDart") {
          const l = MeshBuilder.CreateSphere("plight", { diameter: 0.05 }, this.scene); l.parent = node; l.position.y = 0.08; l.material = lightMat; v.light = l;
        }
        this.projViews.set(q.id, v);
      }
      v.node.position.set(q.pos.x, q.pos.y, q.pos.z);
      if (q.kind === "breachMine") { v.node.rotation.y = q.yaw ?? 0; if (v.laser) v.laser.isVisible = !!q.armed; }
      else if (!q.stuck) { v.node.rotation.x += 0.3; v.node.rotation.z += 0.2; }
      if (v.light) v.light.isVisible = Math.sin(t * (q.kind === "adhesive" ? 18 : 6)) > 0;
      // Munitions Eye: enemy lethal equipment highlight within 20 m handled by HUD markers
      void munitionsEye;
    }
    for (const [id, v] of this.projViews) if (!seen.has(id)) { v.node.dispose(); this.projViews.delete(id); }
  }

  syncDevices(list: DeviceSnap[], localTeam: number, t: number) {
    const seen = new Set<number>();
    for (const d of list) {
      seen.add(d.id);
      let v = this.devViews.get(d.id);
      if (!v) {
        const node = new TransformNode(`dev${d.id}`, this.scene);
        const rotors: Mesh[] = [];
        const lm = d.team === localTeam ? this.mats.cyanLight : this.mats.redLight;
        if (d.kind === "drone") {
          const body = MeshBuilder.CreateBox("dbody", { width: 0.5, height: 0.16, depth: 0.6 }, this.scene); body.parent = node; body.material = this.mats.dark;
          const eye = MeshBuilder.CreateSphere("deye", { diameter: 0.16 }, this.scene); eye.parent = node; eye.position.set(0, -0.1, 0.22); eye.material = lm;
          for (const [x, z] of [[-0.42, -0.42], [0.42, -0.42], [0.42, 0.42], [-0.42, 0.42]]) {
            const arm = MeshBuilder.CreateBox("darm", { width: 0.05, height: 0.04, depth: 0.5 }, this.scene); arm.parent = node; arm.position.set(x / 2, 0, z / 2); arm.rotation.y = Math.atan2(x, z); arm.material = this.mats.grey;
            const r = MeshBuilder.CreateCylinder("rotor", { height: 0.01, diameter: 0.38, tessellation: 12 }, this.scene); r.parent = node; r.position.set(x, 0.06, z); r.material = this.mats.grey; r.visibility = 0.5;
            rotors.push(r);
          }
          const strip = MeshBuilder.CreateBox("dstrip", { width: 0.52, height: 0.03, depth: 0.05 }, this.scene); strip.parent = node; strip.position.set(0, 0.09, -0.2); strip.material = lm;
        } else {
          const body = MeshBuilder.CreateBox("pod", { width: 0.7, height: 0.6, depth: 0.5 }, this.scene); body.parent = node; body.material = this.mats.orange;
          const lid = MeshBuilder.CreateBox("lid", { width: 0.74, height: 0.08, depth: 0.54 }, this.scene); lid.parent = node; lid.position.y = 0.32; lid.material = this.mats.dark;
          const strip = MeshBuilder.CreateBox("pstrip", { width: 0.72, height: 0.05, depth: 0.52 }, this.scene); strip.parent = node; strip.position.y = 0.12; strip.material = lm;
        }
        v = { node, rotors };
        this.devViews.set(d.id, v);
      }
      v.node.position.set(d.pos.x, d.pos.y, d.pos.z);
      v.node.rotation.y = d.yaw;
      for (const r of v.rotors) r.rotation.y += 0.9;
      if (d.kind === "drone") v.node.rotation.z = Math.sin(t * 2 + d.id) * 0.06;
    }
    for (const [id, v] of this.devViews) if (!seen.has(id)) { v.node.dispose(); this.devViews.delete(id); }
  }

  syncStrikes(list: StrikeSnap[], t: number) {
    const seen = new Set<number>();
    for (const s of list) {
      seen.add(s.id);
      let v = this.strikeViews.get(s.id);
      if (!v) {
        v = {};
        if (s.kind === "mortar") {
          const ring = MeshBuilder.CreateGround("mring", { width: 12, height: 12 }, this.scene);
          ring.material = this.mats.redRing; ring.isPickable = false; v.ring = ring;
          const shell = MeshBuilder.CreateCylinder("shell", { height: 0.5, diameterTop: 0.02, diameterBottom: 0.12 }, this.scene); shell.material = this.mats.dark; shell.rotation.x = Math.PI; v.shell = shell;
        } else {
          const plane = new TransformNode("jet", this.scene);
          const body = MeshBuilder.CreateBox("jbody", { width: 1.4, height: 1.1, depth: 11 }, this.scene); body.parent = plane; body.material = this.mats.grey;
          const wing = MeshBuilder.CreateBox("jwing", { width: 12, height: 0.2, depth: 3.2 }, this.scene); wing.parent = plane; wing.position.z = -1; wing.material = this.mats.grey;
          const tail = MeshBuilder.CreateBox("jtail", { width: 0.2, height: 2.2, depth: 2 }, this.scene); tail.parent = plane; tail.position.set(0, 1.2, -4.6); tail.material = this.mats.grey;
          const burner = MeshBuilder.CreateSphere("jburn", { diameter: 1.1 }, this.scene); burner.parent = plane; burner.position.z = -5.8; burner.material = this.mats.fireball;
          v.plane = plane;
        }
        this.strikeViews.set(s.id, v);
      }
      if (s.kind === "mortar" && v.ring && v.shell) {
        const remain = s.impactAt;
        v.ring.position.set(s.pos.x, s.pos.y + 0.06, s.pos.z);
        const pulse = 0.85 + Math.sin(t * 12) * 0.15;
        v.ring.scaling.setAll(remain > 0 ? pulse : 0.01);
        v.ring.isVisible = remain > 0;
        v.shell.isVisible = remain > 0 && remain < 0.7;
        v.shell.position.set(s.pos.x, s.pos.y + remain * 60, s.pos.z);
      } else if (v.plane && s.dir) {
        const k = Math.max(-1, -s.impactAt) * 60;
        v.plane.position.set(s.pos.x + s.dir.x * k, 34, s.pos.z + s.dir.z * k);
        v.plane.rotation.y = Math.atan2(s.dir.x, s.dir.z);
        v.plane.setEnabled(s.impactAt < 1.2);
      }
    }
    for (const [id, v] of this.strikeViews) if (!seen.has(id)) { v.ring?.dispose(); v.shell?.dispose(); v.plane?.dispose(); this.strikeViews.delete(id); }
  }

  update(dt: number) {
    for (const tr of this.tracers) {
      if (tr.t >= tr.life) { tr.m.isVisible = false; continue; }
      tr.t += dt;
      const k = Math.min(1, tr.t / tr.life);
      const head = Vector3.Lerp(tr.from, tr.to, Math.min(1, k * 1.2));
      const tail = Vector3.Lerp(tr.from, tr.to, Math.max(0, k * 1.2 - 0.35));
      const mid = head.add(tail).scale(0.5);
      const len = Math.max(0.05, Vector3.Distance(head, tail));
      tr.m.position.copyFrom(mid);
      tr.m.scaling.z = len;
      tr.m.lookAt(head);
      if (tr.t >= tr.life) tr.m.isVisible = false;
    }
    for (const f of this.flashes) { f.t += dt; if (f.t > 0.05) f.m.isVisible = false; }
    this.flashLightT += dt;
    this.flashLight.intensity = this.flashLightT < 0.05 ? (this.reducedFlash ? 0.6 : 1.6) : 0;
    this.boomLightT += dt;
    this.boomLight.intensity = this.boomLightT < 0.35 ? (1 - this.boomLightT / 0.35) * (this.reducedFlash ? 1.2 : 3) : 0;
    for (const fb of this.fireballs) {
      if (fb.t > 0.5) { fb.m.isVisible = false; continue; }
      fb.t += dt;
      const k = fb.t / 0.35;
      fb.m.scaling.setAll(fb.r * (0.4 + k * 1.2));
      fb.m.visibility = Math.max(0, 1 - k);
    }
  }

  dispose() { /* scene disposal releases everything */ }
}
