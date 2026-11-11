// GameRenderer: owns the Babylon engine/scene and turns interpolated snapshots into pixels.
// It never mutates simulation state.
import { Engine, Scene, UniversalCamera, Vector3, Matrix, Viewport, Mesh } from "@babylonjs/core";
import { createWorld, WorldView, Quality } from "./world";
import { CharacterManager } from "./characters";
import { ViewModel } from "./viewmodel";
import { Vfx } from "./vfx";
import { Snapshot, PlayerSnap, GameEvent } from "../shared/protocol";
import { K17 } from "../content/map-k17";
import { hfovToVfov, lerp, wrapAngle, Vec3, viewDir, DEG, clamp } from "../shared/math";
import { eyeHeight } from "../shared/movement";
import { hitboxes, rayHitboxes } from "../shared/hitbox";
import { CollisionWorld } from "../shared/collision";
import { Settings } from "../profile/profile";
import { WEAPONS } from "../content/weapons";

export interface FrameParams {
  prev: Snapshot; cur: Snapshot; alpha: number; yaw: number; pitch: number; dt: number; t: number;
  lookDX: number; lookDY: number; throwAge: number; landAge: number; landSpeed: number; shake: number;
}

export class GameRenderer {
  engine: Engine;
  scene: Scene;
  camera: UniversalCamera;
  world: WorldView;
  chars: CharacterManager;
  vm: ViewModel;
  vfx: Vfx;
  collision: CollisionWorld;
  vfov = 1;
  scoped = false;
  eyePos = new Vector3();
  private crouchSmooth = 0;
  private deathT = 0;
  private shakeT = 0;
  private settings: Settings;
  private localTeam = 0;
  private attachments: string[] = [];
  private lastWeapon = "";
  private bobPhase = 0;
  quality: Quality;
  contextLost = false;

  constructor(public canvas: HTMLCanvasElement, settings: Settings, localTeam: number, attachments: string[]) {
    this.settings = settings;
    this.quality = settings.quality;
    this.localTeam = localTeam;
    this.attachments = attachments;
    this.engine = new Engine(canvas, settings.quality !== "low", { preserveDrawingBuffer: true, stencil: true, powerPreference: "high-performance", disableWebGL2Support: false }, false);
    this.engine.setHardwareScalingLevel(1 / clamp(settings.renderScale, 0.5, 1));
    this.scene = new Scene(this.engine);
    this.camera = new UniversalCamera("cam", new Vector3(0, 2, 0), this.scene);
    this.camera.minZ = 0.03; this.camera.maxZ = 1200;
    this.camera.inputs.clear();
    this.scene.activeCamera = this.camera;
    this.world = createWorld(this.engine, canvas, K17, settings.shadows ? settings.quality : "low", this.camera, this.scene);
    this.scene.setRenderingAutoClearDepthStencil(1, true, true, true);
    this.collision = new CollisionWorld(K17.boxes.map((b) => ({ ...b, min: { ...b.min }, max: { ...b.max } })));
    this.chars = new CharacterManager(this.scene, (m: Mesh) => this.world.addCaster(m));
    this.chars.setColorblind(settings.colorblind);
    this.vm = new ViewModel(this.scene, this.camera, localTeam === 0 ? "#4a5761" : "#7a6e55");
    this.vfx = new Vfx(this.scene, settings.quality);
    this.vfx.reducedFlash = settings.photosensitive;
    this.applySettings(settings);
    this.engine.onContextLostObservable.add(() => { this.contextLost = true; });
    this.engine.onContextRestoredObservable.add(() => { this.contextLost = false; });
  }

  applySettings(s: Settings) {
    this.settings = s;
    this.chars.setColorblind(s.colorblind);
    this.vfx.reducedFlash = s.photosensitive;
    this.engine.setHardwareScalingLevel(1 / clamp(s.renderScale, 0.5, 1));
  }

  resize() { this.engine.resize(); }

  private lerpPlayer(a: PlayerSnap | undefined, b: PlayerSnap, t: number): PlayerSnap {
    if (!a || a.alive !== b.alive || Math.hypot(a.pos.x - b.pos.x, a.pos.z - b.pos.z) > 4) return b;
    return {
      ...b,
      pos: { x: lerp(a.pos.x, b.pos.x, t), y: lerp(a.pos.y, b.pos.y, t), z: lerp(a.pos.z, b.pos.z, t) },
      yaw: a.yaw + wrapAngle(b.yaw - a.yaw) * t, pitch: lerp(a.pitch, b.pitch, t), crouchT: lerp(a.crouchT, b.crouchT, t),
    };
  }

  interpolated: PlayerSnap[] = [];

  frame(p: FrameParams) {
    if (this.contextLost) return;
    const { prev, cur, alpha } = p;
    const prevMap = new Map(prev.players.map((x) => [x.id, x]));
    this.interpolated = cur.players.map((pl) => this.lerpPlayer(prevMap.get(pl.id), pl, alpha));
    const me = this.interpolated.find((x) => x.id === cur.local.id)!;
    const L = cur.local;
    const s = this.settings;
    const motion = s.reducedMotion ? 0.3 : 1;

    // --- camera height + decorative layers (never affect the gameplay ray)
    this.crouchSmooth += (me.crouchT - this.crouchSmooth) * Math.min(1, p.dt * 14);
    const eye = eyeHeight(this.crouchSmooth);
    const speed = me.speed;
    this.bobPhase += p.dt * speed * 1.9;
    const bobK = (me.sprinting ? 1 : 0.35) * (me.onGround ? 1 : 0) * s.bob * motion * (1 - L.ads * 0.8);
    const bobY = Math.abs(Math.sin(this.bobPhase)) * 0.035 * bobK * Math.min(1, speed / 5);
    const bobX = Math.cos(this.bobPhase) * 0.02 * bobK * Math.min(1, speed / 5);
    const land = Math.min(0.12, p.landSpeed / 90) * Math.exp(-p.landAge * 8) * motion;
    this.shakeT = Math.max(this.shakeT * Math.exp(-p.dt * 7), p.shake);
    const sh = this.shakeT * s.shake * motion;
    const shx = (Math.random() - 0.5) * 0.06 * sh, shy = (Math.random() - 0.5) * 0.06 * sh;
    if (!L.alive) this.deathT += p.dt; else this.deathT = 0;
    const dk = Math.min(1, this.deathT / 0.5);
    const fwdFlat = { x: Math.sin(p.yaw), z: Math.cos(p.yaw) };
    this.eyePos.set(me.pos.x + bobX * fwdFlat.z + shx, me.pos.y + lerp(eye, 1.0, dk) - bobY - land + shy, me.pos.z - bobX * fwdFlat.x);
    this.camera.position.copyFrom(this.eyePos);
    this.camera.rotation.set(p.pitch + (Math.random() - 0.5) * 0.004 * sh + dk * 0.25, p.yaw, lerp(0, 0.18, dk) + Math.sin(this.bobPhase * 0.5) * 0.004 * bobK);

    // --- FOV (horizontal setting converted to vertical), ADS zoom
    const aspect = this.engine.getRenderWidth() / Math.max(1, this.engine.getRenderHeight());
    const baseV = hfovToVfov(s.fov, aspect);
    const wdef = WEAPONS[me.weapon];
    this.scoped = !!wdef?.model.scope && L.ads > 0.85;
    const zoom = 1 + (L.adsZoom - 1) * (L.ads * L.ads * (3 - 2 * L.ads));
    this.vfov = 2 * Math.atan(Math.tan(baseV / 2) / zoom);
    this.camera.fov = this.vfov;
    // viewmodel FOV setting is a vertical FOV for the weapon layer only
    const vmV = s.vmFov * DEG;
    this.vm.setFov(this.vfov, 2 * Math.atan(Math.tan(vmV / 2) / (1 + (zoom - 1) * 0.25)));

    // --- viewmodel
    if (me.weapon !== this.lastWeapon) {
      this.lastWeapon = me.weapon;
      this.vm.setWeapon(me.weapon, WEAPONS[me.weapon].slot === "primary" ? this.attachments : []);
    }
    this.vm.update({
      dt: p.dt, t: p.t, ads: L.ads, speed, sprinting: L.sprinting, onGround: me.onGround, crouch: me.crouchT > 0.5,
      lookDX: p.lookDX, lookDY: p.lookDY, reload: L.reload, swapT: L.swapT, melee: L.melee, inspect: L.inspect,
      cooking: L.cooking, throwAge: p.throwAge, landAge: p.landAge, landSpeed: p.landSpeed, alive: L.alive && cur.match.phase !== "ended",
      bobScale: s.bob * motion, mantling: me.mantling,
    });

    // --- entities
    this.chars.sync(this.interpolated, this.localTeam, L.id, p.dt, p.t, this.camera.position);
    this.vfx.syncSmokes(cur.smokes);
    this.vfx.syncProjectiles(cur.projectiles, this.localTeam, false, p.t);
    this.vfx.syncDevices(cur.devices, this.localTeam, p.t);
    this.vfx.syncStrikes(cur.strikes, p.t);
    this.vfx.footprints(cur.footprints);
    this.vfx.update(p.dt);
    this.world.update(p.t);

    // --- low health desaturation + damage vignette through image processing
    const pl = this.world.pipeline;
    if (pl) {
      const hp = clamp(L.health / 100, 0, 1);
      const curves = pl.imageProcessing.colorCurves;
      if (curves) curves.globalSaturation = L.alive ? -60 * clamp((0.6 - hp) / 0.6, 0, 1) : -55;
      pl.imageProcessing.exposure = 1.15 + (L.flash > 0 && !s.photosensitive ? L.flash * 1.2 : 0);
    }
    this.scene.render();
  }

  muzzleOf(id: number, localId: number): Vector3 {
    if (id === localId && this.vm.model) { this.vm.model.muzzle.computeWorldMatrix(true); return this.vm.model.muzzle.getAbsolutePosition().clone(); }
    const v = this.chars.views.get(id);
    return v ? v.muzzleWorld.clone() : this.eyePos.clone();
  }

  handleEvent(e: GameEvent, localId: number) {
    switch (e.type) {
      case "shot": {
        const from = this.muzzleOf(e.shooter, localId);
        if (e.shooter === localId) this.vm.fire(WEAPONS[e.weapon]?.recoil.vertical > 2 ? 2 : 1);
        else if (!e.suppressed) this.vfx.muzzleFlash(from, 0.6 * e.flashScale);
        if (e.tracer) for (const end of e.ends.slice(0, 3)) this.vfx.tracer({ x: from.x, y: from.y, z: from.z }, end);
        break;
      }
      case "impact": this.vfx.impact(e.pos, e.normal, e.mat); break;
      case "hit": break;
      case "explosion": this.vfx.explosion(e.pos, e.kind, e.radius); break;
      case "glass": {
        const m = this.world.glass.get(e.boxId);
        if (m) m.setEnabled(false);
        const b = this.collision.boxes.find((x) => x.id === e.boxId);
        if (b) b.active = false;
        this.vfx.glassBreak(e.pos);
        break;
      }
      default: break;
    }
  }

  /** Name of the visible enemy the crosshair rests on (never through walls). */
  enemyUnderCrosshair(yaw: number, pitch: number, localTeam: number, localId: number): string | null {
    const o = { x: this.eyePos.x, y: this.eyePos.y, z: this.eyePos.z };
    const d = viewDir(yaw, pitch);
    let best: { t: number; name: string } | null = null;
    for (const p of this.interpolated) {
      if (!p.alive || p.team === localTeam || p.id === localId) continue;
      const dist = Math.hypot(p.pos.x - o.x, p.pos.z - o.z);
      if (dist > 70) continue;
      const h = rayHitboxes(o, d, 80, hitboxes(p.pos, p.crouchT));
      if (h && (!best || h.t < best.t)) best = { t: h.t, name: p.name };
    }
    if (!best) return null;
    const wall = this.collision.raycast(o, d, best.t, true);
    return wall ? null : best.name;
  }

  project(p: Vec3): { x: number; y: number; behind: boolean } {
    const w = this.engine.getRenderWidth(), h = this.engine.getRenderHeight();
    const scale = this.engine.getHardwareScalingLevel();
    const v = Vector3.Project(new Vector3(p.x, p.y, p.z), Matrix.Identity(), this.scene.getTransformMatrix(), new Viewport(0, 0, w, h));
    const toP = new Vector3(p.x - this.eyePos.x, p.y - this.eyePos.y, p.z - this.eyePos.z);
    const fwd = this.camera.getDirection(Vector3.Forward());
    return { x: v.x * scale, y: v.y * scale, behind: Vector3.Dot(toP, fwd) < 0 };
  }

  dispose() {
    this.scene.dispose();
    this.engine.dispose();
  }
}

export const _unused = DEG;
