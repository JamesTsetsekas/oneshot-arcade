// client-runtime: owns the Babylon engine/scene, drives the authoritative
// match through a LocalTransport at a fixed 30Hz, interpolates entity views,
// runs the camera rig, and publishes a batched HUD read model.

import {
  Engine, Scene, FreeCamera, Vector3, HemisphericLight, DirectionalLight, Color3, ShadowGenerator, FxaaPostProcess, Camera, Matrix,
} from '@babylonjs/core';
import { Match } from '../server/match';
import { BotBrain } from '../server/bots/brain';
import { DT } from '../shared/content/rules';
import { WEAPONS, weaponStats } from '../shared/content/weapons';
import { ITEMS } from '../shared/content/items';
import { getIsland } from '../shared/world/island';
import { getCollisionWorld } from '../shared/world/collision';
import { cameraRig, BOOM_HIP } from '../shared/sim/aim';
import { BTN, InputFrame, InvAction, Snapshot, GameEvent, ActorView, MatchResult } from '../shared/protocol/messages';
import type { MatchPace } from '../shared/content/rules';
import { Input } from './input';
import { audio } from './audio/audio';
import { buildWorld, WorldVisuals } from './render/world';
import { ActorModel, clearActorMaterialCache } from './render/actors';
import { FxSystem } from './render/fx';
import { getSettings, subscribeSettings, Settings, getProfile } from './settings';
import { HudStore, HudState } from './ui/store';

export interface SessionOptions { mode: 'solo' | 'practice'; pace: MatchPace; seed: number; autopilot?: boolean; staging?: number }

/** In-process transport: same message shapes a WebSocket client would use. */
class LocalTransport {
  constructor(private match: Match, private playerId: number) {}
  send(frame: InputFrame) { this.match.step(new Map([[this.playerId, frame]])); }
  receive(): { snap: Snapshot; events: GameEvent[] } { return { snap: this.match.snapshotFor(this.playerId), events: this.match.eventsFor(this.playerId) }; }
}

export class GameSession {
  engine!: Engine;
  scene!: Scene;
  camera!: FreeCamera;
  shadow: ShadowGenerator | null = null;
  sun!: DirectionalLight;
  world!: WorldVisuals;
  fx!: FxSystem;
  match!: Match;
  transport!: LocalTransport;
  input: Input;
  hud = new HudStore();
  private actors = new Map<number, ActorModel>();
  private me!: ActorModel;
  private prev: Snapshot | null = null;
  private cur: Snapshot | null = null;
  private prevActors = new Map<number, ActorView>();
  private acc = 0;
  private last = 0;
  private raf = 0;
  private yaw = 0;
  private pitch = 0;
  private freeLook = 0;
  private kick = { p: 0, y: 0 };
  private camShake = 0;
  private camDist = BOOM_HIP;
  private fovCur = 90;
  private seq = 0;
  private selSlot = 0;
  private actions: InvAction[] = [];
  private fxaa: FxaaPostProcess | null = null;
  private frameTimes: number[] = [];
  private scaleLevel = 1;
  private ended = false;
  private endAt = 0;
  private paused = false;
  private unsub: (() => void) | null = null;
  private practice = { dmg: 0, hits: 0, last: 0, window: [] as { t: number; d: number }[] };
  private damageNums: { x: number; y: number; z: number; amt: number; kind: string; t: number; id: number }[] = [];
  private dnId = 0;
  private fireLatch = false;
  private contextLost = false;
  onEnd: ((r: MatchResult) => void) | null = null;
  onError: ((msg: string) => void) | null = null;

  constructor(public canvas: HTMLCanvasElement, public opts: SessionOptions) {
    this.input = new Input(canvas);
  }

  async init(progress: (label: string, k: number) => void) {
    const tick = () => new Promise((r) => setTimeout(r, 16));
    progress('Initialising WebGL 2 renderer', 0.05); await tick();
    const s = getSettings();
    this.engine = new Engine(this.canvas, false, { preserveDrawingBuffer: true, stencil: true, antialias: false, powerPreference: 'high-performance' }, true);
    if (this.engine.webGLVersion < 2) throw new Error('WEBGL2');
    this.engine.onContextLostObservable.add(() => { this.contextLost = true; this.onError?.('The graphics context was lost. Reload to continue.'); });
    this.scene = new Scene(this.engine);
    this.scene.skipPointerMovePicking = true;
    this.camera = new FreeCamera('cam', new Vector3(0, 10, 0), this.scene);
    this.camera.minZ = 0.15;
    this.camera.maxZ = 5000;
    this.camera.fovMode = Camera.FOVMODE_HORIZONTAL_FIXED;
    this.camera.inputs.clear();
    const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), this.scene);
    hemi.intensity = 0.62;
    hemi.diffuse = new Color3(0.9, 0.98, 1);
    hemi.groundColor = new Color3(0.42, 0.36, 0.3);
    this.sun = new DirectionalLight('sun', new Vector3(0.45, -0.62, -0.35), this.scene);
    this.sun.intensity = 1.15;
    this.sun.diffuse = new Color3(1, 0.95, 0.85);

    progress('Verifying content manifest', 0.15); await tick();
    const island = getIsland();
    progress(`Building collision cells (manifest ${island.manifestHash})`, 0.3); await tick();
    getCollisionWorld(island);
    progress(this.opts.mode === 'solo' ? 'Assigning local room and baking bot navigation' : 'Preparing Practice Range', 0.45); await tick();
    const prof = getProfile();
    this.match = new Match({ seed: this.opts.seed, mode: this.opts.mode, pace: this.opts.pace, humans: [{ name: prof.name || 'You', body: prof.body, glider: prof.glider }], stagingSeconds: this.opts.staging });
    // Attract/autopilot mode (used for automated screenshots): the local seat is driven by the bot AI.
    if (this.opts.autopilot && this.opts.mode === 'solo') this.match.players[0].bot = new BotBrain(this.match.players[0], 0.77);
    this.transport = new LocalTransport(this.match, 0);
    progress('Streaming island cells', 0.6); await tick();
    this.world = buildWorld(this.scene, island, s.foliage, (k) => progress('Streaming island cells', 0.6 + k * 0.3));
    this.fx = new FxSystem(this.scene);
    this.applySettings(s);
    this.unsub = subscribeSettings(() => this.applySettings(getSettings()));
    progress(this.opts.mode === 'solo' ? 'Filling empty seats with bots' : 'Spawning target bots', 0.95); await tick();
    this.me = new ActorModel(this.scene, prof.body, prof.glider, this.shadow);
    const first = this.transport.receive();
    this.cur = first.snap;
    this.prev = first.snap;
    this.yaw = first.snap.you.yaw;
    this.input.onKey = (code) => this.onKey(code);
    this.input.onMouse = (b) => this.onMouse(b);
    progress('Ready', 1);
  }

  private applySettings(s: Settings) {
    if (!this.scene) return;
    this.scaleLevel = 1 / s.renderScale;
    this.engine.setHardwareScalingLevel(this.scaleLevel);
    this.world?.setViewDistance(s.viewDistance);
    this.camera.maxZ = Math.max(800, s.viewDistance * 2.5);
    if (s.shadows !== 'off' && !this.shadow) {
      this.shadow = new ShadowGenerator(s.shadows === 'high' ? 2048 : 1024, this.sun);
      this.shadow.usePercentageCloserFiltering = true;
      this.shadow.bias = 0.0015;
      this.shadow.normalBias = 0.02;
      this.sun.autoUpdateExtends = false;
      this.sun.shadowMinZ = 1; this.sun.shadowMaxZ = 500;
      for (const m of this.world.staticMeshes) if (!m.name.startsWith('terrain')) this.shadow.addShadowCaster(m, false);
      for (const a of this.actors.values()) a.meshes.forEach((m) => this.shadow!.addShadowCaster(m, false));
      this.me?.meshes.forEach((m) => this.shadow!.addShadowCaster(m, false));
    } else if (s.shadows === 'off' && this.shadow) {
      this.shadow.dispose();
      this.shadow = null;
    } else if (this.shadow) {
      this.shadow.mapSize = s.shadows === 'high' ? 2048 : 1024;
    }
    const range = s.shadows === 'high' ? 90 : 55;
    this.sun.orthoLeft = -range; this.sun.orthoRight = range; this.sun.orthoTop = range; this.sun.orthoBottom = -range;
    if (s.fxaa && !this.fxaa) this.fxaa = new FxaaPostProcess('fxaa', 1.0, this.camera);
    else if (!s.fxaa && this.fxaa) { this.fxaa.dispose(this.camera); this.fxaa = null; }
    this.fx.effectsLow = s.effects === 'low';
    this.fx.photosensitive = s.photosensitive;
    this.fx.colorblind = s.colorblind;
    audio.applyVolumes();
  }

  start() {
    audio.ensure();
    audio.playMusic(this.opts.mode === 'solo' ? 'match' : 'none');
    this.last = performance.now();
    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop);
      this.frame(now);
    };
    this.raf = requestAnimationFrame(loop);
    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => this.engine.resize();

  setPaused(p: boolean) { this.paused = p; if (!p) this.last = performance.now(); }

  // ---------------------------------------------------------------- input
  private onKey(code: string) {
    const k = getSettings().keys;
    const st = this.hud.state;
    if (code === 'Escape' && st.overlay !== 'none') { this.closeOverlay(); return; }
    if (code === k.inventory) { this.toggleOverlay('inventory'); return; }
    if (code === k.map) { this.toggleOverlay('map'); return; }
    if (st.overlay !== 'none') return;
    for (let i = 0; i < 5; i++) if (code === k[`slot${i + 1}` as 'slot1']) this.selSlot = i;
    if (code === k.shoulder) this.actions.push({ t: 'shoulder' });
    if (code === k.ready && this.cur?.phase === 'staging') { this.actions.push({ t: 'ready' }); this.hud.toast('Ready — skiff departs in 3s', 0); }
    if (code === k.throw) {
      const sl = this.cur?.you.slots[this.selSlot];
      if (sl?.kind === 'item' && (ITEMS[sl.id].kind === 'throwable' || ITEMS[sl.id].kind === 'utility')) this.fireLatch = true;
      else {
        const idx = this.cur?.you.slots.findIndex((x) => x?.kind === 'item' && ITEMS[x.id].kind === 'throwable') ?? -1;
        if (idx >= 0) { this.selSlot = idx; this.hud.toast(`Equipped ${ITEMS[(this.cur!.you.slots[idx] as { id: keyof typeof ITEMS }).id].name} — G or LMB to throw`, 0); }
      }
    }
  }

  private onMouse(b: number) {
    if (b === 1 && this.cur && this.cur.you.alive) {
      // middle mouse: ping/marker at aim point
      const y = this.cur.you;
      const rig = cameraRig(y.x, y.y, y.z, this.yaw, this.pitch, y.crouch, BOOM_HIP, y.shoulder);
      const hit = getCollisionWorld(getIsland()).raycast(rig.origin, rig.dir, 600);
      if (hit) { this.actions.push({ t: 'marker', x: hit.x, z: hit.z }); this.hud.toast('Marker placed', 0); }
    }
  }

  toggleOverlay(o: 'inventory' | 'map') {
    const st = this.hud.state;
    const next = st.overlay === o ? 'none' : o;
    this.hud.set({ overlay: next });
    if (next === 'none') this.input.requestLock();
    else { this.input.exitLock(); }
  }
  closeOverlay() { this.hud.set({ overlay: 'none' }); this.input.requestLock(); }
  queueAction(a: InvAction) { this.actions.push(a); }

  private buildFrame(): InputFrame {
    const i = this.input;
    const s = getSettings();
    const overlay = this.hud.state.overlay !== 'none' || this.paused;
    const look = i.takeLook();
    const you = this.cur?.you;
    const ads = !!you?.ads;
    const st = you && you.slots[you.sel]?.kind === 'weapon' ? weaponStats((you.slots[you.sel] as { w: keyof typeof WEAPONS }).w, (you.slots[you.sel] as { r: 0 }).r) : null;
    const zoom = ads && st ? st.adsZoom : 1;
    const sens = 0.0022 * s.sens * (ads ? s.adsSens * zoom : 1);
    const air = you && (you.mode === 'freefall' || you.mode === 'glide' || you.mode === 'skiff');
    if (!overlay) {
      if (i.held('freelook') && air) this.freeLook += look.dx * sens;
      else {
        this.yaw += look.dx * sens;
        this.pitch -= look.dy * sens * (s.invertY ? -1 : 1);
        this.freeLook *= 0.8;
      }
    }
    // recoil kick (deterministic pattern from server event), applied over a few frames
    this.pitch += this.kick.p * 0.5; this.yaw += this.kick.y * 0.5;
    this.kick.p *= 0.5; this.kick.y *= 0.5;
    this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));
    const wheel = i.takeWheel();
    if (wheel && !overlay) this.selSlot = (this.selSlot + (wheel > 0 ? 1 : 4)) % 5;
    let b = 0;
    if (!overlay && i.locked) {
      if (i.mouse(0) || this.fireLatch) b |= BTN.fire;
      if (s.adsToggle ? i.toggles.ads : i.mouse(2)) b |= BTN.ads;
      if (i.active('jump')) b |= BTN.jump;
      if (s.sprintToggle ? i.toggles.sprint : i.held('sprint')) b |= BTN.sprint;
      if (s.crouchToggle ? i.toggles.crouch : i.held('crouch')) b |= BTN.crouch;
      if (i.active('interact')) b |= BTN.interact;
      if (i.active('reload')) b |= BTN.reload;
      if (i.active('melee')) b |= BTN.melee;
      if (i.active('deploy')) b |= BTN.deploy;
      if (i.held('walk')) b |= BTN.walk;
    }
    this.fireLatch = false;
    const mx = overlay ? 0 : (i.held('right') ? 1 : 0) - (i.held('left') ? 1 : 0);
    const mz = overlay ? 0 : (i.held('forward') ? 1 : 0) - (i.held('back') ? 1 : 0);
    if (s.sprintToggle && mz <= 0) i.toggles.sprint = false;
    i.consume();
    const f: InputFrame = { seq: ++this.seq, mx, mz, yaw: this.yaw, pitch: this.pitch, buttons: b, slot: this.selSlot };
    if (this.actions.length) { f.actions = this.actions; this.actions = []; }
    return f;
  }

  // ---------------------------------------------------------------- loop
  private frame(now: number) {
    if (this.contextLost) return;
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    if (!this.paused && !this.ended) {
      this.acc += dt;
      let steps = 0;
      while (this.acc >= DT && steps < 5) {
        this.transport.send(this.buildFrame());
        const { snap, events } = this.transport.receive();
        if (this.opts.autopilot && snap.you.alive) { this.yaw = this.match.players[0].ms.yaw; this.pitch = this.match.players[0].ms.pitch; }
        this.prev = this.cur;
        if (this.prev) for (const p of this.prev.players) this.prevActors.set(p.id, p);
        this.cur = snap;
        this.handleEvents(events);
        this.acc -= DT;
        steps++;
      }
      if (steps === 5) this.acc = 0;
    } else if (this.ended && performance.now() > this.endAt) {
      this.finish();
      return;
    }
    const alpha = Math.min(1, this.acc / DT);
    this.render(dt, alpha);
    this.dynamicResolution(dt);
  }

  private dynamicResolution(dt: number) {
    const s = getSettings();
    this.frameTimes.push(dt);
    if (this.frameTimes.length < 45) return;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.frameTimes = [];
    this.hud.set({ fps: Math.round(1 / avg) });
    if (!s.dynamicRes) return;
    const base = 1 / s.renderScale;
    if (avg > 1 / 50 && this.scaleLevel < base * 1.8) this.scaleLevel = Math.min(base * 1.8, this.scaleLevel * 1.12);
    else if (avg < 1 / 62 && this.scaleLevel > base) this.scaleLevel = Math.max(base, this.scaleLevel / 1.08);
    this.engine.setHardwareScalingLevel(this.scaleLevel);
  }

  private lerpActor(p: ActorView, alpha: number): ActorView {
    const q = this.prevActors.get(p.id);
    if (!q) return p;
    const d = Math.hypot(p.x - q.x, p.z - q.z);
    if (d > 12) return p; // teleport (skiff exit etc.)
    let dy = p.yaw - q.yaw;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    return { ...p, x: q.x + (p.x - q.x) * alpha, y: q.y + (p.y - q.y) * alpha, z: q.z + (p.z - q.z) * alpha, yaw: q.yaw + dy * alpha };
  }

  private render(dt: number, alpha: number) {
    const snap = this.cur!;
    const prev = this.prev ?? snap;
    const s = getSettings();
    this.fx.update(dt);
    this.world.skyMat.setFloat('time', this.fx.time);
    for (const sp of this.world.spinners) sp.node.rotation.z += dt * sp.speed;
    this.world.vents.forEach((v, i) => { v.visibility = 0.7 + Math.sin(this.fx.time * 3 + i) * 0.3; });
    const y = snap.you, py = prev.you;
    const tele = Math.hypot(y.x - py.x, y.z - py.z) > 12;
    const me = { x: tele ? y.x : py.x + (y.x - py.x) * alpha, y: tele ? y.y : py.y + (y.y - py.y) * alpha, z: tele ? y.z : py.z + (y.z - py.z) * alpha };

    // actors
    const seen = new Set<number>();
    const spect = snap.spectating;
    for (const p of snap.players) {
      seen.add(p.id);
      let a = this.actors.get(p.id);
      if (!a) { a = new ActorModel(this.scene, p.body, p.glider, this.shadow); this.actors.set(p.id, a); }
      const v = this.lerpActor(p, alpha);
      a.update(v, dt, true);
    }
    for (const [id, a] of this.actors) if (!seen.has(id)) { a.dispose(); this.actors.delete(id); }
    const mySlot = y.slots[y.sel];
    this.me.setVisible(y.alive && y.mode !== 'skiff');
    this.me.update({ ...me, yaw: this.yaw, pitch: this.pitch, mode: y.mode, crouch: y.crouch, slide: y.slide, vx: y.vx, vz: y.vz, alive: y.alive, weapon: mySlot?.kind === 'weapon' ? mySlot.w : null, rarity: mySlot?.kind === 'weapon' ? mySlot.r : 0, healing: !!y.use }, dt, false);

    this.fx.syncLoot(snap.loot, y.focus?.t === 'loot' ? y.focus.id : -1);
    this.fx.syncContainers(snap.containers);
    this.fx.syncProjectiles(snap.projectiles, alpha);
    this.fx.syncSmokes(snap.smokes);
    this.fx.syncSkiff(snap.skiff);
    this.fx.syncCapsules(snap.capsules);
    this.fx.syncCaravan(snap.caravan);
    const w = getCollisionWorld(getIsland());
    this.fx.syncMarker(snap.marker, snap.marker ? w.terrain(snap.marker.x, snap.marker.z) : 0);
    this.fx.syncStorm(snap.storm, new Vector3(me.x, me.y, me.z), snap.mode === 'solo' && snap.phase !== 'staging');

    // camera
    let cx = me.x, cyy = me.y, cz = me.z, cyaw = this.yaw + this.freeLook, cpitch = this.pitch, crouch = y.crouch;
    let boom = BOOM_HIP;
    let fov = s.fov;
    if (spect) {
      const t = snap.players.find((p) => p.id === spect.id);
      if (t) { const v = this.lerpActor(t, alpha); cx = v.x; cyy = v.y; cz = v.z; cyaw = v.yaw; cpitch = v.pitch; crouch = v.crouch; }
      boom = 4;
    } else if (y.mode === 'skiff' && snap.skiff) {
      cx = snap.skiff.x; cyy = snap.skiff.y + 3; cz = snap.skiff.z; boom = 26; fov += 8;
    } else if (y.mode === 'freefall') { boom = 6; fov += 10; }
    else if (y.mode === 'glide') { boom = 6.5; fov += 6; }
    else if (y.ads && mySlot?.kind === 'weapon') {
      const st = weaponStats(mySlot.w, mySlot.r);
      boom = WEAPONS[mySlot.w].adsBoom;
      fov = s.fov * st.adsZoom;
    } else if (y.sprinting && !s.reducedMotion) fov += 4;
    this.fovCur += (fov - this.fovCur) * Math.min(1, dt * 12);
    const rig = cameraRig(cx, cyy, cz, cyaw, cpitch, crouch, boom, y.shoulder);
    // camera collision: cast from pivot toward the boom end, damped return
    const sh = { x: rig.pivot.x + rig.right.x * 0.55 * y.shoulder, y: rig.pivot.y + 0.35, z: rig.pivot.z + rig.right.z * 0.55 * y.shoulder };
    const dx = rig.origin.x - sh.x, dy = rig.origin.y - sh.y, dz = rig.origin.z - sh.z;
    const L = Math.hypot(dx, dy, dz) || 1;
    const hit = w.raycast(sh, { x: dx / L, y: dy / L, z: dz / L }, L + 0.3, true);
    const want = hit ? Math.max(0.4, hit.t - 0.3) : L;
    this.camDist = want < this.camDist ? want : this.camDist + (want - this.camDist) * Math.min(1, dt * 5);
    let px = sh.x + (dx / L) * this.camDist, pyy = sh.y + (dy / L) * this.camDist, pz = sh.z + (dz / L) * this.camDist;
    if (y.mode !== 'skiff') pyy = Math.max(pyy, w.terrain(px, pz) + 0.3);
    if (this.camShake > 0 && !s.reducedMotion) {
      const k = this.camShake * 0.06;
      px += (Math.random() - 0.5) * k; pyy += (Math.random() - 0.5) * k;
      this.camShake = Math.max(0, this.camShake - dt * 4);
    }
    this.camera.position.set(px, pyy, pz);
    this.camera.rotation.set(-cpitch, cyaw, 0);
    this.camera.fov = (this.fovCur * Math.PI) / 180;
    if (this.shadow) this.sun.position.set(me.x + 120, me.y + 165, me.z + 95);
    audio.setListener({ x: me.x, y: me.y + 1.6, z: me.z }, this.yaw);
    const inStorm = y.inStorm;
    const dStorm = Math.hypot(me.x - snap.storm.cur.x, me.z - snap.storm.cur.z) - snap.storm.cur.r;
    audio.setAmbience(snap.mode === 'solo' && snap.phase !== 'staging' ? (inStorm ? 1 : Math.max(0, 1 + dStorm / 40) * 0.5) : 0, y.mode === 'freefall' ? 1 : y.mode === 'glide' ? 0.55 : 0);
    audio.tension = Math.min(1, snap.storm.phase / 7 + (snap.alive < 6 ? 0.3 : 0));
    if (this.fx.time % 0.5 < dt) {
      audio.updateHums(snap.containers.filter((c) => c.kind === 'chest' && !c.opened && Math.hypot(c.x - me.x, c.z - me.z) < 16).sort((a, b) => Math.hypot(a.x - me.x, a.z - me.z) - Math.hypot(b.x - me.x, b.z - me.z)));
    }
    this.scene.render();
    this.publishHud(snap);
  }

  private project(x: number, y: number, z: number): { x: number; y: number } | null {
    const v = Vector3.Project(new Vector3(x, y, z), Matrix.Identity(), this.scene.getTransformMatrix(), this.camera.viewport.toGlobal(this.engine.getRenderWidth(), this.engine.getRenderHeight()));
    if (v.z < 0 || v.z > 1) return null;
    const sx = this.canvas.clientWidth / this.engine.getRenderWidth();
    return { x: v.x * sx, y: v.y * sx };
  }

  private publishHud(snap: Snapshot) {
    const now = this.fx.time;
    this.damageNums = this.damageNums.filter((d) => now - d.t < 0.9);
    const nums = this.damageNums.map((d) => {
      const p = this.project(d.x, d.y + (now - d.t) * 0.8, d.z);
      return p ? { id: d.id, x: p.x, y: p.y, amt: d.amt, kind: d.kind, age: now - d.t } : null;
    }).filter(Boolean) as HudState['damageNums'];
    this.hud.set({ snap, yaw: this.yaw, damageNums: nums, now, selSlot: this.selSlot, locked: this.input.locked });
  }

  // ---------------------------------------------------------------- events
  private handleEvents(events: GameEvent[]) {
    const y = this.cur!.you;
    const now = this.fx.time;
    const angTo = (x: number, z: number) => Math.atan2(x - y.x, z - y.z) - this.yaw;
    for (const e of events) {
      switch (e.e) {
        case 'shot': {
          const own = e.by === y.id;
          const pos = { x: e.fx, y: e.fy, z: e.fz };
          audio.shot(WEAPONS[e.w].cls, own ? null : pos, own);
          if (e.tx !== 0 || e.tz !== 0) {
            this.fx.flash(new Vector3(e.fx, e.fy, e.fz));
            if (WEAPONS[e.w].pellets === 1 || own) this.fx.tracer(new Vector3(e.fx, e.fy, e.fz), new Vector3(e.tx, e.ty, e.tz));
          }
          if (!own) this.hud.sound('Gunfire', angTo(e.fx, e.fz), Math.hypot(e.fx - y.x, e.fz - y.z) < 60);
          break;
        }
        case 'hit': {
          if (e.to !== y.id) break;
          const kind = e.kill ? 'kill' : e.zone === 'head' ? 'head' : e.shield ? 'shield' : 'health';
          this.hud.hitMarker(kind, e.broke);
          audio.hitMarker(e.broke ? 'break' : kind === 'kill' ? 'kill' : kind as 'head');
          this.damageNums.push({ x: e.x + (Math.random() - 0.5) * 0.4, y: e.y, z: e.z, amt: e.amt, kind, t: now, id: ++this.dnId });
          if (this.cur!.mode === 'practice') {
            this.practice.dmg += e.amt; this.practice.hits++; this.practice.last = e.amt;
            this.practice.window.push({ t: now, d: e.amt });
            this.practice.window = this.practice.window.filter((w) => now - w.t < 3);
            this.hud.set({ practice: { last: e.amt, total: this.practice.dmg, dps: Math.round(this.practice.window.reduce((a, b) => a + b.d, 0) / 3), hits: this.practice.hits } });
          }
          break;
        }
        case 'hurt':
          if (e.to !== y.id || e.amt <= 0) break;
          audio.hurt(e.shield, e.broke);
          if (e.kind === 'weapon' || e.kind === 'melee' || e.kind === 'orb') this.hud.hurt(angTo(e.fromX, e.fromZ), e.shield);
          this.camShake = Math.min(1, this.camShake + e.amt / 40);
          break;
        case 'recoil':
          if (e.to !== y.id) break;
          this.kick.p += (e.p * Math.PI) / 180 * (getSettings().reducedMotion ? 0.9 : 1);
          this.kick.y += (e.y * Math.PI) / 180;
          break;
        case 'kill':
          this.hud.kill(e.kName, e.vName, e.cause, e.killer === y.id, e.victim === y.id);
          if (e.killer === y.id && this.cur!.mode === 'solo') { this.hud.toast(`Eliminated ${e.vName}`, 3); audio.hitMarker('kill'); }
          if (e.victim === y.id) { this.hud.toast(`You were eliminated — ${this.match.players[0].stats.deathCause ?? ''}`, 0); this.input.exitLock(); }
          break;
        case 'impact': this.fx.impact(new Vector3(e.x, e.y, e.z), e.player); break;
        case 'explode': this.fx.explosion(new Vector3(e.x, e.y, e.z), e.r, e.kind); audio.explode(e, e.kind); break;
        case 'pickup': if (e.to === y.id) { this.hud.toast(e.label, e.rarity); audio.ui('pickup', e.rarity); } break;
        case 'denied': if (e.to === y.id) { this.hud.toast(e.reason, -1); audio.ui('deny'); } break;
        case 'open': audio.move('mantle', e); if (e.kind === 'chest') audio.ui('pickup', 2); break;
        case 'reload': audio.reload(e.by === y.id ? null : e); break;
        case 'charge': audio.ui('charge'); break;
        case 'move': {
          audio.move(e.kind, e.by === y.id ? null : e);
          if (e.by !== y.id && (e.kind === 'zip' || e.kind === 'vent')) this.hud.sound(e.kind === 'zip' ? 'Zipline' : 'Air vent', angTo(e.x, e.z), true);
          break;
        }
        case 'footstep':
          if (e.by === y.id) { audio.footstep(e, false, y.mode === 'swim'); break; }
          audio.footstep(e, e.loud, false);
          this.hud.sound('Footsteps', angTo(e.x, e.z), true);
          break;
        case 'heal':
          if (e.to !== y.id) break;
          if (e.kind === 'start') audio.ui('heal');
          if (e.kind === 'done') audio.ui('healDone');
          if (e.kind === 'cancel') this.hud.toast(`${ITEMS[e.item].name} cancelled`, -1);
          break;
        case 'aegis': if (e.to === y.id && e.kind === 'recharge') audio.ui('aegis'); break;
        case 'storm':
          audio.ui('storm');
          this.hud.toast(e.kind === 'reveal' ? 'Next Calmfield revealed — check your map (M)' : e.kind === 'final' ? 'Final collapse!' : 'The Riftstorm is closing in', -2);
          break;
        case 'capsule': audio.ui('capsule'); this.hud.toast('Supply capsule inbound — marked on map', 4); this.hud.ping('capsule', e.x, e.z); break;
        case 'caravan':
          if (e.kind === 'spawn') { this.hud.toast('Caravan drone sighted — shields up, high-value cargo', 4); audio.ui('capsule'); }
          if (e.kind === 'down') this.hud.toast('Caravan drone downed!', 4);
          this.hud.ping(e.kind === 'down' ? 'caravanDown' : 'caravan', e.x, e.z);
          break;
        case 'echo':
          if (e.to !== y.id) break;
          audio.ui('echo');
          this.fx.echoTrails(e.trails, (x, z) => getCollisionWorld(getIsland()).support(x, z, 0.3, 200));
          this.hud.toast(e.trails.length ? `Echo: ${e.trails.length} trail${e.trails.length > 1 ? 's' : ''} revealed` : 'Echo: no recent movement nearby', 0);
          break;
        case 'grapple': if (e.by === y.id && e.ok) audio.move('zip', null); break;
        case 'phase':
          if (e.phase === 'skiff') { this.hud.toast('Aboard the transit skiff — SPACE to jump when over the island', 0); audio.playMusic('match'); }
          break;
        case 'win':
          audio.ui('win');
          this.ended = true;
          this.endAt = performance.now() + 4500;
          this.hud.set({ winner: e.name });
          this.input.exitLock();
          break;
      }
    }
  }

  /** Leave to results (spectating / after win) or back to menu (practice). */
  finish() {
    if (!this.onEnd) return;
    const cb = this.onEnd;
    this.onEnd = null;
    cb(this.match.resultFor(0));
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    this.unsub?.();
    this.input.exitLock();
    this.input.dispose();
    audio.stopAll();
    this.fx?.dispose();
    clearActorMaterialCache();
    this.scene?.dispose();
    this.engine?.dispose();
  }
}
