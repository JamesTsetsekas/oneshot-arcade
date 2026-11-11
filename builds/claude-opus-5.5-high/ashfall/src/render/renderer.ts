import {
  Color3, Color4, DirectionalLight, Engine, GlowLayer, HemisphericLight, ImageProcessingConfiguration, Matrix, Mesh, PointLight, Quaternion, Scene,
  ShadowGenerator, Vector3, type AbstractMesh,
} from "@babylonjs/core";
import type { Game } from "../sim/game";
import type { GameEvent } from "../sim/types";
import { TINTS } from "../progression/character";
import { animateRig, buildEnemyRig, buildPlayerRig, disposeRig, type Rig } from "./actors";
import { CameraRig } from "./camera";
import { LightPool, THEME_FOG, buildZoneView, type ZoneView } from "./environment";
import { Fx } from "./fx";
import { Kit, hex, ringMesh } from "./kit";
import { Overlay } from "./overlay";

export interface RenderSettings {
  quality: "low" | "medium" | "high";
  dynamicResolution: boolean;
  shadows: boolean;
  particles: number;
  screenShake: boolean;
  reducedMotion: boolean;
  colorblind: boolean;
  reducedFlash: boolean;
  gore: boolean;
  damageNumbers: boolean;
  labels: "always" | "alt" | "rare";
  orbit: boolean;
}

export class Renderer {
  engine: Engine;
  scene: Scene;
  kit: Kit;
  fx: Fx;
  rig: CameraRig;
  overlay: Overlay;
  hemi: HemisphericLight;
  moon: DirectionalLight;
  shadow: ShadowGenerator | null = null;
  glow: GlowLayer | null = null;
  lights: LightPool;
  playerLight: PointLight;
  zoneView: ZoneView | null = null;
  playerRig: Rig | null = null;
  enemyRigs = new Map<number, Rig>();
  hoverRing: Mesh;
  hoverEnemy: number | null = null;
  hoverInteract: number | null = null;
  settings: RenderSettings;
  private time = 0;
  private fpsAcc = 0; private fpsN = 0; private scaleLevel = 1;
  private wallCut = new Matrix();
  private zoneId = "";

  constructor(canvas: HTMLCanvasElement, overlayParent: HTMLElement, settings: RenderSettings) {
    this.settings = settings;
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, antialias: true, powerPreference: "high-performance" }, false);
    this.scene = new Scene(this.engine);
    const s = this.scene;
    s.clearColor = new Color4(0.07, 0.06, 0.08, 1);
    s.ambientColor = new Color3(0.2, 0.2, 0.24);
    s.skipPointerMovePicking = true;
    s.fogMode = Scene.FOGMODE_EXP2;
    s.fogDensity = 0.016;
    const ip = s.imageProcessingConfiguration;
    ip.contrast = 1.12;
    ip.exposure = 1.15;
    ip.toneMappingEnabled = false;
    ip.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
    ip.vignetteEnabled = true;
    ip.vignetteWeight = 2.2;
    ip.vignetteColor = new Color4(0.05, 0.02, 0.04, 0);
    this.kit = new Kit(s);
    this.rig = new CameraRig(s);
    this.hemi = new HemisphericLight("hemi", new Vector3(0.2, 1, -0.3), s);
    this.hemi.diffuse = new Color3(0.62, 0.68, 0.86);
    this.hemi.groundColor = new Color3(0.22, 0.16, 0.16);
    this.hemi.specular = Color3.Black();
    this.hemi.intensity = 1.0;
    this.moon = new DirectionalLight("moon", new Vector3(-0.45, -1, 0.3).normalize(), s);
    this.moon.diffuse = new Color3(0.78, 0.84, 1.0);
    this.moon.specular = new Color3(0.2, 0.2, 0.25);
    this.moon.intensity = 1.35;
    this.moon.autoUpdateExtends = false;
    this.moon.orthoLeft = -26; this.moon.orthoRight = 26; this.moon.orthoTop = 26; this.moon.orthoBottom = -26;
    this.moon.shadowMinZ = 1; this.moon.shadowMaxZ = 90;
    this.lights = new LightPool(s, 6);
    this.playerLight = new PointLight("plight", new Vector3(0, 3, 0), s);
    this.playerLight.diffuse = hex("#ffd0a0");
    this.playerLight.specular = Color3.Black();
    this.playerLight.intensity = 0.55;
    this.playerLight.range = 14;
    this.fx = new Fx(this.kit);
    this.overlay = new Overlay(overlayParent);
    this.hoverRing = ringMesh("hover", s, 0.9, 1.05, Math.PI * 2, 40);
    this.hoverRing.material = this.kit.mat("hoverring", "#ff4030", { emissive: "#ff4030", emissiveK: 1, unlit: true, alpha: 0.9 });
    this.hoverRing.isPickable = false;
    this.hoverRing.setEnabled(false);
    this.applySettings(settings);
    window.addEventListener("resize", () => this.engine.resize());
  }

  applySettings(st: RenderSettings) {
    this.settings = st;
    const s = this.scene;
    const wantShadows = st.shadows && st.quality !== "low";
    if (wantShadows && !this.shadow) {
      this.shadow = new ShadowGenerator(st.quality === "high" ? 2048 : 1024, this.moon);
      this.shadow.usePercentageCloserFiltering = true;
      this.shadow.filteringQuality = st.quality === "high" ? ShadowGenerator.QUALITY_HIGH : ShadowGenerator.QUALITY_MEDIUM;
      this.shadow.bias = 0.0015;
      this.shadow.normalBias = 0.02;
      this.shadow.darkness = 0.35;
      this.refreshCasters();
    } else if (!wantShadows && this.shadow) { this.shadow.dispose(); this.shadow = null; }
    if (st.quality !== "low" && !this.glow) {
      this.glow = new GlowLayer("glow", s, { mainTextureFixedSize: st.quality === "high" ? 1024 : 512, blurKernelSize: 32 });
      this.glow.intensity = 0.75;
    } else if (st.quality === "low" && this.glow) { this.glow.dispose(); this.glow = null; }
    this.fx.settings = { particles: st.quality === "low" ? 0.4 * st.particles : st.particles, colorblind: st.colorblind, reducedFlash: st.reducedFlash, gore: st.gore };
    this.overlay.settings = { damageNumbers: st.damageNumbers, labels: st.labels, colorblind: st.colorblind };
    this.rig.shakeEnabled = st.screenShake;
    this.rig.reducedMotion = st.reducedMotion;
    this.scaleLevel = st.quality === "low" ? 1.5 : 1;
    this.engine.setHardwareScalingLevel(this.scaleLevel);
    // telegraph materials depend on colorblind mode
    for (const [k, m] of this.kit.mats) if (k.startsWith("tele_")) { m.dispose(); this.kit.mats.delete(k); }
    for (const v of this.fx.teles.values()) v.root.dispose();
    this.fx.teles.clear();
  }

  private refreshCasters() {
    if (!this.shadow) return;
    const list = this.shadow.getShadowMap()!.renderList!;
    list.length = 0;
    if (this.zoneView) for (const m of this.zoneView.casters) list.push(m);
    if (this.zoneView?.walls) list.push(this.zoneView.walls.mesh);
    if (this.playerRig) for (const m of this.playerRig.meshes) list.push(m);
    for (const r of this.enemyRigs.values()) for (const m of r.meshes) list.push(m);
  }

  buildZone(game: Game) {
    this.zoneView?.dispose();
    for (const r of this.enemyRigs.values()) disposeRig(r);
    this.enemyRigs.clear();
    this.fx.clearZone();
    this.overlay.clear();
    const z = game.zone;
    this.zoneView = buildZoneView(this.kit, z);
    const fog = hex(THEME_FOG[z.theme]);
    this.scene.fogColor = fog;
    this.scene.clearColor = new Color4(fog.r * 0.8, fog.g * 0.8, fog.b * 0.8, 1);
    this.scene.fogDensity = z.theme === "archive" ? 0.016 : 0.012;
    this.hemi.intensity = z.theme === "archive" ? 0.85 : z.theme === "refuge" ? 1.1 : 1.0;
    this.moon.intensity = z.theme === "archive" ? 0.8 : 1.35;
    if (!this.playerRig) {
      const ch = game.ch;
      this.playerRig = buildPlayerRig(this.kit, ch.classId, ch.preset, TINTS[ch.preset.tint] ?? TINTS[0]);
    }
    this.rig.snap(game.player.x, game.player.y);
    this.zoneId = z.id;
    this.refreshCasters();
  }

  rebuildPlayer(game: Game) {
    if (this.playerRig) disposeRig(this.playerRig);
    this.playerRig = buildPlayerRig(this.kit, game.ch.classId, game.ch.preset, TINTS[game.ch.preset.tint] ?? TINTS[0]);
    this.refreshCasters();
  }

  onEvents(evs: GameEvent[], game: Game) {
    for (const ev of evs) {
      this.fx.onEvent(ev, game);
      this.overlay.onEvent(ev);
      if (ev.t === "shake") this.rig.addShake(ev.amp, ev.dur, ev.src);
      if (ev.t === "hit" && ev.crit) this.rig.addShake(0.06, 0.1, "crit");
    }
  }

  /** Ground point under a screen position (unshaken pick camera). */
  pickGround(sx: number, sy: number): { x: number; y: number } | null {
    const ray = this.scene.createPickingRay(sx, sy, Matrix.Identity(), this.rig.pickCam);
    if (Math.abs(ray.direction.y) < 1e-4) return null;
    const t = -ray.origin.y / ray.direction.y;
    if (t < 0) return null;
    return { x: ray.origin.x + ray.direction.x * t, y: ray.origin.z + ray.direction.z * t };
  }

  /** Closest valid combat target near the cursor ray (distance from ray to the enemy's chest point). */
  pickEnemy(sx: number, sy: number, game: Game): number | null {
    const ray = this.scene.createPickingRay(sx, sy, Matrix.Identity(), this.rig.pickCam);
    let best: number | null = null, bd = Infinity;
    const p = new Vector3();
    for (const e of game.enemies) {
      if (!e.alive) continue;
      if (e.boss?.invulnerable) { /* still targetable, shows immune */ }
      const h = e.isBoss ? (e.def.id === "engine" ? 2.5 : 1.8) : e.radius > 0.6 ? 1.2 : 0.8;
      p.set(e.x, h, e.y);
      const toP = p.subtract(ray.origin);
      const along = Vector3.Dot(toP, ray.direction);
      if (along < 0) continue;
      const closest = ray.origin.add(ray.direction.scale(along));
      const d = Vector3.Distance(closest, p);
      const tol = e.radius + 0.55 + (e.isBoss ? 0.6 : 0);
      if (d < tol && d - tol * 0.3 < bd) { bd = d - tol * 0.3 + (e.def.behavior === "dummy" ? 0.5 : 0); best = e.id; }
    }
    return best;
  }

  pickInteract(ground: { x: number; y: number } | null, game: Game): number | null {
    if (!ground) return null;
    let best: number | null = null, bd = 1.5;
    for (const it of game.interactables) {
      if (it.hidden) continue;
      if (it.open && ["chest", "urn", "explosive", "lever", "gate", "shrine", "cage"].includes(it.kind)) continue;
      if (it.kind === "dummy_spawner" && !it.data.drill) continue;
      const d = Math.hypot(ground.x - it.x, ground.y - it.y);
      const r = it.kind === "npc" || it.kind === "waypoint" || it.kind === "exit" ? 1.8 : 1.3;
      if (d < r && d < bd + 0.3) { bd = d; best = it.id; }
    }
    for (const pk of game.pickups) {
      if (pk.kind !== "item" && pk.kind !== "potion") continue;
      const d = Math.hypot(ground.x - pk.x, ground.y - pk.y);
      if (d < 0.9 && d < bd) { bd = d; best = -pk.id; }
    }
    return best;
  }

  frame(game: Game, alpha: number, dt: number) {
    this.time += dt;
    if (!this.zoneView || this.zoneId !== game.zone.id) this.buildZone(game);
    const p = game.player;
    const px = p.px + (p.x - p.px) * alpha, pz = p.py + (p.y - p.py) * alpha;
    const vx = (p.x - p.px) * 30, vz = (p.y - p.py) * 30;
    // camera
    const boss = game.activeBoss !== null ? game.enemyById(game.activeBoss) : null;
    this.rig.update(dt, px, pz, vx, vz, boss && boss.alive ? { x: boss.x, z: boss.y } : null);
    // shadows follow the player
    this.moon.position.set(px - this.moon.direction.x * 40, -this.moon.direction.y * 40, pz - this.moon.direction.z * 40);
    this.lights.update(dt, px, pz, this.zoneView!.lights, this.time);
    this.playerLight.position.set(px - 1, 5, pz - 1);
    // player
    const pr = this.playerRig!;
    pr.root.position.set(px, 0, pz);
    pr.root.rotation.y = -p.facing;
    let windupFrac = 0;
    if (p.action?.kind === "skill") windupFrac = Math.min(1, p.action.t / Math.max(0.01, p.action.impactAt));
    animateRig(pr, p.alive ? p.anim : "dead", p.action ? p.action.t : 0, 4.6, this.time, { windupFrac, flash: p.flash });
    if (!p.alive) { pr.root.rotation.z = Math.min(Math.PI / 2, p.deadT * 4); pr.root.position.y = -Math.min(0.3, p.deadT * 0.2); } else pr.root.rotation.z = 0;
    const camo = !!p.statuses.camo;
    for (const m of pr.meshes) m.visibility = camo ? 0.35 : 1;
    if (p.furnace && Math.random() < 0.5) this.fx.add.emit(px + (Math.random() - 0.5) * 0.6, 1 + Math.random(), pz + (Math.random() - 0.5) * 0.6, 0, 1.5, 0, 0.5, 0.2, this.fx.col("ember"), 1, -1, 0.5);
    if (p.statuses.guard && Math.random() < 0.4) this.fx.add.emit(px + (Math.random() - 0.5) * 1.2, 0.5 + Math.random(), pz + (Math.random() - 0.5) * 1.2, 0, 0.5, 0, 0.4, 0.2, this.fx.col("gold"), 1, 0, 0.5);
    // enemies
    const live = new Set<number>();
    let castersDirty = false;
    for (const e of game.enemies) {
      if (!e.alive && e.deadT > 3.5) continue;
      live.add(e.id);
      let r = this.enemyRigs.get(e.id);
      if (!r) { r = buildEnemyRig(this.kit, e); this.enemyRigs.set(e.id, r); castersDirty = true; }
      const ex = e.px + (e.x - e.px) * alpha, ez = e.py + (e.y - e.py) * alpha;
      r.root.position.set(ex, 0, ez);
      r.root.rotation.y = -e.facing;
      const frac = e.ai === "telegraph" && e.attack ? 1 - e.aiT / Math.max(0.01, e.attack.windup / 1000) : e.ai === "telegraph" ? 0.7 : 0;
      animateRig(r, e.alive ? e.anim : "dead", e.animT, e.speed, this.time + e.id, { windupFrac: frac, flash: e.flash, staggered: (e.boss?.staggeredT ?? 0) > 0, armor: e.boss?.armor });
      if (!e.alive) {
        r.root.rotation.z = Math.min(Math.PI / 2, e.deadT * 5) * (e.isBoss ? 0.3 : 1);
        r.root.position.y = -Math.max(0, e.deadT - 1.5) * 0.6;
        if (r.ring) r.ring.setEnabled(false);
      } else {
        r.root.rotation.z = 0; r.root.position.y = 0;
        if (e.statuses.ward && Math.random() < 0.3) this.fx.add.emit(ex + (Math.random() - 0.5), 0.3 + Math.random() * 1.6, ez + (Math.random() - 0.5), 0, 0.3, 0, 0.5, 0.25, this.fx.col("blight"), 1, 0, 0.5);
        if (e.statuses.shell && Math.random() < 0.6) this.fx.add.emit(ex + (Math.random() - 0.5) * 1.8, 0.4 + Math.random() * 1.6, ez + (Math.random() - 0.5) * 1.8, 0, 0, 0, 0.3, 0.3, new Color3(0.9, 0.95, 1), 1, 0, 0);
        if (e.statuses.burn && Math.random() < 0.3) this.fx.add.emit(ex, 0.6 + Math.random(), ez, 0, 1.2, 0, 0.4, 0.2, this.fx.col("ember"), 1, -1, 0.5);
        if (e.statuses.mark && Math.random() < 0.15) this.fx.add.emit(ex, 2.2, ez, 0, 0.2, 0, 0.3, 0.18 + 0.05 * e.statuses.mark.stacks, this.fx.col("player"), 1, 0, 0);
        if (e.ai === "telegraph" && e.heavy && Math.random() < 0.5) this.fx.add.emit(ex, 1.6, ez, 0, 0.5, 0, 0.3, 0.35, this.fx.col(e.attack?.type ?? "ember"), 1, 0, 0);
        if (e.isElite && Math.random() < 0.15 && e.elite[0]) this.fx.add.emit(ex + (Math.random() - 0.5), 0.2, ez + (Math.random() - 0.5), 0, 1.2, 0, 0.8, 0.18, hex(EliteColor(e.elite[0])), 1, -0.5, 0.5);
        if (r.ring && e.isElite) r.ring.scaling.setAll((1 + Math.sin(this.time * 4) * 0.04) / r.scale);
      }
    }
    for (const [id, r] of this.enemyRigs) if (!live.has(id)) { disposeRig(r); this.enemyRigs.delete(id); }
    if (castersDirty && this.shadow && this.time % 1 < 0.05) this.refreshCasters();
    else if (castersDirty) this.refreshCasters();
    // hover ring
    const he = this.hoverEnemy !== null ? game.enemyById(this.hoverEnemy) : null;
    if (he && he.alive) { this.hoverRing.setEnabled(true); this.hoverRing.position.set(he.x, 0.06, he.y); this.hoverRing.scaling.setAll(Math.max(0.6, he.radius * 1.3)); }
    else this.hoverRing.setEnabled(false);
    // animated props & ambient emitters
    const zv = this.zoneView!;
    for (const a of zv.animated) {
      if (a.kind === "orrery") for (const c of a.node.getChildren()) { const md = (c as any).metadata; if (md?.spin) (c as AbstractMesh).rotation.y += md.spin * dt; }
      else a.node.position.y = Math.sin(this.time * 1.4) * 0.15;
    }
    const pp = this.fx.settings.particles;
    for (const em of zv.emitters) {
      if (Math.abs(em.x - px) > 26 || Math.abs(em.z - pz) > 26) continue;
      const r = Math.random();
      if (em.kind === "fire" && r < 0.9 * pp) this.fx.add.emit(em.x + (Math.random() - 0.5) * 0.8, em.y, em.z + (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.4, 2 + Math.random() * 1.5, (Math.random() - 0.5) * 0.4, 0.9, 0.35, this.fx.col("ember"), 1, -0.5, 0.4);
      else if (em.kind === "torch" && r < 0.35 * pp) this.fx.add.emit(em.x, em.y, em.z, 0, 1.2, 0, 0.5, 0.18, this.fx.col("ember"), 1, -0.3, 0.4);
      else if (em.kind === "crystal" && r < 0.08 * pp) this.fx.add.emit(em.x + (Math.random() - 0.5), em.y, em.z + (Math.random() - 0.5), 0, 0.4, 0, 1.4, 0.12, this.fx.col("frost"), 1, -0.1, 0.2);
      else if (em.kind === "candle" && r < 0.05 * pp) this.fx.add.emit(em.x, em.y, em.z, 0, 0.5, 0, 0.5, 0.1, this.fx.col("gold"), 1, -0.3, 0.4);
    }
    // drifting ash in open-air zones
    if (game.zone.theme !== "archive" && Math.random() < 0.7 * pp) this.fx.smoke.emit(px + (Math.random() - 0.5) * 30, 6 + Math.random() * 4, pz + (Math.random() - 0.5) * 30, 0.6, -0.5, 0.3, 6, 0.08, new Color3(0.75, 0.72, 0.7), 0.7, 0, 0);
    if (game.zone.theme !== "archive" && Math.random() < 0.12 * pp) this.fx.add.emit(px + (Math.random() - 0.5) * 30, 0.2, pz + (Math.random() - 0.5) * 30, 0.3, 0.6, 0.2, 3, 0.07, this.fx.col("ember"), 1, -0.05, 0);
    // wall cutaway in front of the player (occluder fade substitute)
    this.updateWallCutaway(px, pz);
    this.updatePropCutaway(px, pz);
    this.fx.sync(game, alpha, dt, this.rig.cam.absoluteRotation ?? Quaternion.Identity());
    this.overlay.update(game, this.scene, this.rig.cam, dt, alpha, this.hoverInteract);
    this.scene.render();
    this.dynamicResolution(dt);
  }

  private updateWallCutaway(px: number, pz: number) {
    const w = this.zoneView?.walls;
    if (!w) return;
    // camera sits toward -x,-z: walls in that half-plane near the player are lowered
    let changed = false;
    const fx = Math.SQRT1_2, fz = Math.SQRT1_2;
    for (let i = 0; i < w.count; i++) {
      const cx = w.centers[i * 2], cz = w.centers[i * 2 + 1];
      const dx = cx - px, dz = cz - pz;
      if (Math.abs(dx) > 9 || Math.abs(dz) > 9) { if (w.cur[i] !== w.heights[i]) { w.cur[i] = w.heights[i]; changed = true; this.setWall(w, i); } continue; }
      const front = dx * fx + dz * fz; // negative = between camera and player
      const side = Math.abs(-dx * fz + dz * fx);
      const want = front < 0.3 && front > -7 && side < 5.5 ? 0.35 : w.heights[i];
      const cur = w.cur[i] + (want - w.cur[i]) * 0.25;
      if (Math.abs(cur - w.cur[i]) > 0.005) { w.cur[i] = Math.abs(cur - want) < 0.01 ? want : cur; changed = true; this.setWall(w, i); }
    }
    if (changed) w.mesh.thinInstanceBufferUpdated("matrix");
  }

  private updatePropCutaway(px: number, pz: number) {
    const zv = this.zoneView;
    if (!zv) return;
    const fx = Math.SQRT1_2, fz = Math.SQRT1_2;
    for (const c of zv.cuts) {
      let changed = false;
      for (let i = 0; i < c.count; i++) {
        const dx = c.centers[i * 2] - px, dz = c.centers[i * 2 + 1] - pz;
        let want = 1;
        if (Math.abs(dx) < 10 && Math.abs(dz) < 10) {
          const front = dx * fx + dz * fz;
          const side = Math.abs(-dx * fz + dz * fx);
          if (front < 0.5 && front > -8 && side < 3.2 + Math.max(0, -front) * 0.25) want = 0.22;
        }
        if (Math.abs(c.cur[i] - want) < 0.005) continue;
        c.cur[i] += (want - c.cur[i]) * 0.2;
        if (Math.abs(c.cur[i] - want) < 0.01) c.cur[i] = want;
        const s = c.scales[i];
        Matrix.ComposeToRef(new Vector3(s, s * c.cur[i], s), Quaternion.RotationAxis(Vector3.Up(), -c.rots[i]), new Vector3(c.centers[i * 2], c.ys[i], c.centers[i * 2 + 1]), this.wallCut);
        c.mesh.thinInstanceSetMatrixAt(i, this.wallCut, false);
        changed = true;
      }
      if (changed) c.mesh.thinInstanceBufferUpdated("matrix");
    }
  }

  private setWall(w: NonNullable<ZoneView["walls"]>, i: number) {
    const h = w.cur[i];
    Matrix.ScalingToRef(1, h, 1, this.wallCut);
    this.wallCut.setTranslationFromFloats(w.centers[i * 2], h / 2, w.centers[i * 2 + 1]);
    w.mesh.thinInstanceSetMatrixAt(i, this.wallCut, false);
  }

  private dynamicResolution(dt: number) {
    if (!this.settings.dynamicResolution) return;
    this.fpsAcc += dt; this.fpsN++;
    if (this.fpsAcc < 2) return;
    const fps = this.fpsN / this.fpsAcc;
    this.fpsAcc = 0; this.fpsN = 0;
    const base = this.settings.quality === "low" ? 1.5 : 1;
    if (fps < 48 && this.scaleLevel < base + 0.6) this.scaleLevel = Math.min(base + 0.6, this.scaleLevel + 0.15);
    else if (fps > 58 && this.scaleLevel > base) this.scaleLevel = Math.max(base, this.scaleLevel - 0.1);
    this.engine.setHardwareScalingLevel(this.scaleLevel);
  }

  fps() { return this.engine.getFps(); }
}

function EliteColor(id: string): string {
  return ({ ember_wake: "#ff6a2a", frost_pulse: "#a8e4ff", rallying: "#ffd060", mirror_shell: "#e0f0ff", vampiric_bond: "#d02040" } as Record<string, string>)[id] ?? "#ffffff";
}
