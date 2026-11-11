// client-runtime: session orchestration. Boots the island + renderer, runs matches through the loopback link,
// turns match events into presentation (VFX, audio, HUD read model) and owns the third-person camera.
import { aimDir, aimPivot } from "../shared/aim";
import { ITEMS } from "../shared/content/items";
import { CAMERA, type Pace } from "../shared/content/rules";
import { RARITIES, WEAPONS, weaponStats } from "../shared/content/weapons";
import { DEG, angleDiff, clamp, lerp, lerpAngle } from "../shared/math";
import { ActorFlag, DT, Mode, type ActionRequest, type MatchEvent, type Snapshot } from "../shared/protocol/protocol";
import { buildIsland, locationAt, type IslandData } from "../shared/world/island";
import { audio } from "./audio/audio";
import { GameRenderer } from "./renderer/renderer";
import { cssToRgb } from "./renderer/palette";
import { Input } from "./runtime/input";
import { LocalLink } from "./runtime/localLink";
import { masteryLevel, profileStore, settingsStore, type Action } from "./runtime/settings";
import { HudCanvas } from "./ui/hudCanvas";
import { renderIslandMap } from "./ui/mapRender";
import { hud, type FeedEntry, type Toast } from "./ui/store";

const nextFrame = (): Promise<void> => new Promise((r) => requestAnimationFrame(() => r()));
const tmpP = { x: 0, y: 0, z: 0 };
const tmpD = { x: 0, y: 0, z: 0 };

function causeName(cause: string): string {
  if (cause in WEAPONS) return WEAPONS[cause as keyof typeof WEAPONS].name;
  switch (cause) {
    case "storm": return "Riftstorm";
    case "fall": return "a long fall";
    case "heat": return "heat channel";
    case "melee": return "melee";
    case "gale": return "Gale Launcher";
    default: return cause;
  }
}

export class Game {
  island!: IslandData;
  renderer!: GameRenderer;
  input!: Input;
  overlay!: HudCanvas;
  mapImage!: HTMLCanvasElement;
  link: LocalLink | null = null;
  private canvas!: HTMLCanvasElement;
  private last = 0;
  private running = false;
  private names = new Map<number, string>();
  private nextId = 1;
  private feed: FeedEntry[] = [];
  private toasts: Toast[] = [];
  private pings: { kind: "capsule" | "caravan"; x: number; z: number; time: number }[] = [];
  private hudAt = 0;
  private clock = 0;
  private camBoom: number = CAMERA.boom;
  private adsT = 0;
  private shoulderS = 1;
  private eyeY = 0;
  private airT = 0;
  private shake = 0;
  private specYaw = 0;
  private specPitch = 0;
  private lastSelected = -1;
  private lastLocation = "";
  private endAt = 0;
  private deadShown = false;
  private wasAlive = true;
  private wasAegisFull = true;
  private lastAegis = 50;
  private expectUnlock = false;
  private fpsAcc = 0;
  private fpsN = 0;
  private fps = 60;
  private slowT = 0;
  private fastT = 0;
  private scale = 1;
  private camYaw = 0;
  private camPitch = 0;
  private vfov = 1;
  private px = 0;
  private py = 0;
  private pz = 0;
  private stormCountdown = -1;
  private lastStepKind = 0;
  mode: "solo" | "practice" = "solo";
  pace: Pace = "standard";

  // ------------------------------------------------------------------ boot

  async boot(canvas: HTMLCanvasElement, overlayCanvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2");
    if (!gl) {
      hud.set({ screen: "error", errorText: "Skybreak needs WebGL 2. Your browser or graphics driver does not provide it. Try a current version of Chrome, Edge or Firefox with hardware acceleration enabled." });
      return;
    }
    try {
      hud.set({ loadingLabel: "Raising the Highwake", loadingFrac: 0.05 });
      await nextFrame();
      await nextFrame();
      this.island = buildIsland();
      hud.set({ loadingLabel: "Building the world", loadingFrac: 0.45 });
      await nextFrame();
      await nextFrame();
      this.renderer = new GameRenderer(canvas, this.island, settingsStore.value.quality);
      hud.set({ loadingLabel: "Charting the map", loadingFrac: 0.8 });
      await nextFrame();
      this.mapImage = renderIslandMap(this.island);
      this.overlay = new HudCanvas(overlayCanvas);
      this.overlay.mapImage = this.mapImage;
      this.input = new Input(canvas);
      this.input.onAction = (a) => this.onAction(a);
      this.input.onMiddle = () => this.placeMarkerAtAim();
      this.input.onLockChange = (locked) => this.onLockChange(locked);
      this.renderer.world.engine.onContextLostObservable.add(() => {
        hud.set({ screen: "error", errorText: "The graphics context was lost (the GPU reset or ran out of memory). Reload the page to continue." });
        this.running = false;
      });
      window.addEventListener("resize", () => this.renderer.resize());
      window.addEventListener("beforeunload", (e) => {
        // Ctrl+W while crouch-walking would otherwise close the tab mid-match
        if (hud.get().screen === "match") {
          e.preventDefault();
          e.returnValue = "";
        }
      });
      settingsStore.subscribe(() => this.applySettings());
      this.applySettings();
      hud.set({ screen: "menu", loadingFrac: 1 });
      this.running = true;
      this.last = performance.now();
      requestAnimationFrame(this.frame);
    } catch (err) {
      console.error(err);
      hud.set({ screen: "error", errorText: "Skybreak could not start its renderer: " + (err instanceof Error ? err.message : String(err)) });
    }
  }

  private applySettings(): void {
    const s = settingsStore.value;
    audio.setVolumes(s.master, s.sfx, s.music);
    if (this.renderer && this.renderer.world.quality !== s.quality) this.renderer.setQuality(s.quality);
    if (!s.dynamicRes && this.renderer) {
      this.scale = 1;
      this.renderer.world.setRenderScale(1);
    }
  }

  // ------------------------------------------------------------------ session control

  startMatch(mode: "solo" | "practice", pace: Pace): void {
    audio.unlock();
    const p = profileStore.value;
    this.mode = mode;
    this.pace = pace;
    const seed = (Math.random() * 0x7fffffff) | 0;
    this.link = new LocalLink({ seed, mode, pace, seats: 24, human: { name: p.name || "Drifter", body: p.body, primary: p.primary, secondary: p.secondary, sail: p.sail } });
    this.names.clear();
    for (const r of this.link.welcome.roster) this.names.set(r.id, r.name);
    this.renderer.setRoster(this.link.welcome.roster);
    this.overlay.clear();
    this.feed = [];
    this.toasts = [];
    this.pings = [];
    this.deadShown = false;
    this.wasAlive = true;
    this.endAt = 0;
    this.lastSelected = -1;
    this.lastLocation = "";
    this.stormCountdown = -1;
    this.input.enabled = true;
    this.input.slot = 0;
    this.input.shoulder = 1;
    const me = this.link.curr.actors.find((a) => a.id === this.link!.welcome.youId);
    this.input.resetView(mode === "practice" ? -Math.PI / 2 : me ? me.yaw : 0);
    hud.set({
      screen: "match", overlay: "none", mode, pace, results: null, dead: null, spectating: null, feed: [], toasts: [], banner: null,
      total: this.link.welcome.roster.filter((r) => !r.name.includes("Target")).length, practiceHit: null, pings: [], focus: null, focusLoot: null,
    });
    this.banner(mode === "practice" ? "Practice Range" : "Staging Pier", mode === "practice" ? "Every weapon and item is on the racks. Targets are downrange." : "Warm up. The skiff departs shortly.", "info", 5);
    audio.setMusic(mode === "practice" ? "off" : "drop");
    this.input.requestLock();
  }

  leaveToMenu(): void {
    this.link = null;
    this.input.enabled = false;
    this.input.exitLock();
    this.renderer.resetMatch();
    audio.stopAllLoops();
    audio.setMusic("menu");
    hud.set({ screen: "menu", overlay: "none", results: null, dead: null, spectating: null, banner: null });
  }

  showResults(): void {
    if (!this.link) return;
    const res = this.link.results();
    const y = res.you;
    if (y && this.mode === "solo") {
      const p = profileStore.value;
      const won = y.placement === 1;
      const gain = 60 + y.kills * 45 + Math.max(0, 25 - y.placement) * 12 + (won ? 320 : 0);
      profileStore.set({
        matches: p.matches + 1, wins: p.wins + (won ? 1 : 0), kills: p.kills + y.kills,
        best: p.best === 0 ? y.placement : Math.min(p.best, y.placement), xp: p.xp + gain,
        history: [{ date: new Date().toISOString().slice(0, 10), placement: y.placement, kills: y.kills, damage: y.damage, pace: this.pace }, ...p.history].slice(0, 12),
      });
    }
    this.link = null;
    this.input.enabled = false;
    this.input.exitLock();
    audio.stopAllLoops();
    audio.setMusic("menu");
    hud.set({ screen: "results", overlay: "none", results: res, dead: null, spectating: null, banner: null });
  }

  setOverlay(o: "none" | "map" | "inventory" | "pause" | "settings"): void {
    const cur = hud.get().overlay;
    if (cur === o) return;
    hud.set({ overlay: o });
    if (hud.get().screen !== "match") return;
    if (o === "none") {
      if (!hud.get().dead) this.input.requestLock();
    } else if (this.input.locked) {
      this.expectUnlock = true;
      this.input.exitLock();
    }
  }

  action(req: ActionRequest): void {
    this.link?.sendAction(req);
  }

  private onLockChange(locked: boolean): void {
    hud.set({ locked });
    if (locked) {
      this.expectUnlock = false;
      return;
    }
    if (this.expectUnlock) {
      this.expectUnlock = false;
      return;
    }
    const s = hud.get();
    if (s.screen === "match" && s.overlay === "none" && !s.dead) hud.set({ overlay: "pause" });
  }

  private onAction(a: Action): void {
    const s = hud.get();
    if (s.screen !== "match" || !this.link) return;
    if (a === "map") this.setOverlay(s.overlay === "map" ? "none" : "map");
    else if (a === "inventory") this.setOverlay(s.overlay === "inventory" ? "none" : "inventory");
    else if (a === "ready" && this.link.curr.phase === "staging") {
      this.link.sendAction({ type: "ready" });
      this.toast("Ready - departing now", "good");
    } else if (a === "throw") {
      const you = this.link.curr.you;
      const cur = you.slots[you.selected];
      if (!(cur && cur.kind === "item" && ITEMS[cur.item].kind === "throw")) {
        const idx = you.slots.findIndex((q) => q && q.kind === "item" && ITEMS[q.item].kind === "throw");
        if (idx >= 0) this.input.slot = idx;
      }
    } else if (s.dead && (a === "left" || a === "right")) this.link.sendAction({ type: "spectate", dir: a === "left" ? -1 : 1 });
    else if (a === "shoulder") audio.ui("swap");
  }

  private placeMarkerAtAim(): void {
    if (!this.link) return;
    const you = this.link.curr.you;
    const pose = this.renderer.poses.get(this.link.curr.viewId);
    if (!pose || !you.alive) return;
    aimPivot({ x: pose.x, y: pose.y, z: pose.z, yaw: this.input.yaw, crouch: false }, this.input.shoulder, tmpP);
    aimDir(this.input.yaw, this.input.pitch, tmpD);
    const t = this.island.world.raycast(tmpP.x, tmpP.y, tmpP.z, tmpD.x, tmpD.y, tmpD.z, 700);
    if (t === Infinity) {
      this.link.sendAction({ type: "clearMarker" });
      return;
    }
    this.link.sendAction({ type: "marker", x: tmpP.x + tmpD.x * t, z: tmpP.z + tmpD.z * t });
    audio.ui("marker");
  }

  toast(msg: string, tone: "info" | "warn" | "good"): void {
    if (this.toasts.length && this.toasts[this.toasts.length - 1]!.msg === msg && this.clock - this.toasts[this.toasts.length - 1]!.time < 1.5) return;
    this.toasts.push({ id: this.nextId++, msg, tone, time: this.clock });
    if (this.toasts.length > 4) this.toasts.shift();
    if (tone === "warn") audio.ui("deny");
  }

  banner(title: string, sub: string, tone: "info" | "storm" | "good" | "bad", seconds = 3.5): void {
    hud.set({ banner: { title, sub, tone, until: this.clock + seconds } });
  }

  // ------------------------------------------------------------------ events -> presentation

  private handleEvent(ev: MatchEvent, snap: Snapshot): void {
    const r = this.renderer;
    const me = snap.viewId;
    switch (ev.t) {
      case "shot": {
        const def = WEAPONS[ev.weapon];
        const own = ev.actor === me;
        const col: [number, number, number] = def.cls === "rail" ? [0.6, 1, 0.95] : def.cls === "shotgun" ? [1, 0.82, 0.5] : [1, 0.94, 0.66];
        if (!def.projectile) r.tracer(ev.ox, ev.oy, ev.oz, ev.tx, ev.ty, ev.tz, col, def.cls === "dmr" ? 0.14 : 0.1, def.cls === "dmr" ? 0.09 : 0.06);
        // muzzle flash
        const dx = ev.tx - ev.ox, dy = ev.ty - ev.oy, dz = ev.tz - ev.oz;
        const dl = Math.hypot(dx, dy, dz) || 1;
        for (let i = 0; i < 3; i++) r.emit(ev.ox + (dx / dl) * 0.3, ev.oy + (dy / dl) * 0.3, ev.oz + (dz / dl) * 0.3, (dx / dl) * (4 + i * 3) + (Math.random() - 0.5) * 3, (dy / dl) * 5 + Math.random() * 2, (dz / dl) * (4 + i * 3) + (Math.random() - 0.5) * 3, 0.08, 0.26, 1, 0.92, 0.6, 0, 0);
        if (ev.hit === 1) r.burst(ev.tx, ev.ty, ev.tz, 4, 3.5, 0.35, 0.09, [0.9, 0.86, 0.72], 12);
        r.rig(ev.actor)?.kick();
        const occluded = !own && !this.island.world.lineClear(this.camX, this.camY, this.camZ, ev.ox, ev.oy, ev.oz);
        audio.gunshot(def.cls, { x: ev.ox, y: ev.oy, z: ev.oz, occluded }, own);
        if (!own) this.overlay.soundFrom(Math.atan2(ev.ox - this.px, ev.oz - this.pz), "gun");
        else if (!settingsStore.value.reducedMotion) this.shake = Math.min(1, this.shake + (def.cls === "shotgun" || def.cls === "rail" ? 0.5 : 0.14));
        break;
      }
      case "hit": {
        if (ev.attacker === me) {
          const kind = ev.killed ? "kill" : ev.broke ? "break" : ev.zone === "head" ? "head" : ev.shield ? "shield" : "health";
          this.overlay.hitmarker(kind);
          audio.ui(ev.zone === "head" ? "hitHead" : ev.shield ? "hitShield" : "hit");
          if (ev.broke) audio.ui("shieldBreak");
          const vp = ev.victim === -2 ? (snap.caravan ? { x: snap.caravan.x, y: snap.caravan.y - 1.5, z: snap.caravan.z } : null) : r.poses.get(ev.victim);
          if (vp && settingsStore.value.damageNumbers) this.overlay.damageNumber(vp.x, vp.y, vp.z, ev.dmg, ev.zone === "head" ? "head" : ev.shield ? "shield" : "health");
          if (vp) r.burst(vp.x, vp.y + 1.2, vp.z, 5, 4, 0.3, 0.09, ev.shield ? [0.45, 0.8, 1] : ev.zone === "head" ? [1, 0.85, 0.3] : [1, 0.7, 0.45], 8);
          if (ev.broke && vp) r.shell(vp.x, vp.y + 1, vp.z, 1.6, [0.5, 0.9, 1], 0.3);
          if (this.mode === "practice") hud.set({ practiceHit: { dmg: Math.round(ev.dmg * 10) / 10, zone: ev.zone, dist: Math.round(ev.dist), shield: ev.shield } });
        }
        if (ev.victim === me) {
          this.overlay.damageFrom(Math.atan2(ev.fromX - this.px, ev.fromZ - this.pz));
          audio.ui(ev.broke ? "ownShieldBreak" : ev.shield ? "hurtShield" : "hurt");
          if (!settingsStore.value.reducedMotion) this.shake = Math.min(1, this.shake + 0.35);
        }
        break;
      }
      case "kill": {
        const killer = ev.killer >= 0 ? (this.names.get(ev.killer) ?? "?") : "";
        const victim = this.names.get(ev.victim) ?? "?";
        const you = this.link!.welcome.youId;
        this.feed.push({ id: this.nextId++, killer, victim, cause: causeName(ev.cause), mine: ev.killer === you || ev.victim === you, time: this.clock });
        if (this.feed.length > 5) this.feed.shift();
        if (ev.killer === you && ev.victim !== you) {
          audio.ui("elim");
          this.banner("Eliminated " + victim, `${ev.alive} remain`, "good", 2.6);
        }
        if (ev.y > -500) r.burst(ev.x, ev.y + 1, ev.z, 14, 5, 0.7, 0.12, [0.75, 0.95, 1], 4, 0.8);
        break;
      }
      case "sound": {
        const sp = { x: ev.x, y: ev.y, z: ev.z };
        if (ev.kind === "gunfar") {
          audio.farGunfire(sp);
          this.overlay.soundFrom(Math.atan2(ev.x - this.px, ev.z - this.pz), "gun");
        } else audio.simple(ev.kind, ev.actor === me ? undefined : sp, ev.actor === me ? 0.6 : 1);
        break;
      }
      case "explode": {
        if (ev.kind === "orb") {
          r.shell(ev.x, ev.y, ev.z, ev.r, [0.65, 1, 0.85], 0.4);
          r.burst(ev.x, ev.y, ev.z, 26, 14, 0.6, 0.16, [0.7, 1, 0.88], 3, 0.3);
          audio.simple("explode", ev);
          const d = Math.hypot(ev.x - this.px, ev.z - this.pz);
          if (d < 14 && !settingsStore.value.reducedMotion) this.shake = Math.min(1, this.shake + 0.6 * (1 - d / 14));
        } else if (ev.kind === "mist") {
          r.burst(ev.x, ev.y, ev.z, 18, 7, 0.9, 0.3, [0.92, 0.94, 1], 0, 0.2);
          audio.simple("mist", ev);
        } else if (ev.kind === "rail") {
          r.burst(ev.x, ev.y, ev.z, 12, 8, 0.4, 0.1, [0.6, 1, 0.95], 6);
          r.shell(ev.x, ev.y, ev.z, 1.2, [0.6, 1, 0.95], 0.25);
        } else if (ev.kind === "capsule") {
          r.burst(ev.x, ev.y + 0.3, ev.z, 26, 9, 0.9, 0.2, [0.9, 0.85, 0.7], 10, 0.5);
          r.shell(ev.x, ev.y, ev.z, 5, [1, 0.85, 0.5], 0.5);
          audio.simple("capsule", ev);
        } else {
          r.burst(ev.x, ev.y, ev.z, 40, 14, 1.0, 0.22, [0.8, 0.6, 1], 8, 0.4);
          r.shell(ev.x, ev.y, ev.z, 8, [0.75, 0.6, 1], 0.6);
          audio.simple("explode", ev);
        }
        break;
      }
      case "storm":
        if (ev.state === "wait") {
          audio.ui("stormWarn");
          this.banner("New Calmfield revealed", "Check the map and plan your rotation", "storm", 4);
        } else if (ev.state === "shrink") {
          audio.ui("stormMove");
          this.banner(ev.phase >= 6 ? "The Calmfield is moving" : "The Riftstorm is closing", `Phase ${Math.min(ev.phase, 9)}`, "storm", 4);
        } else {
          audio.ui("final");
          this.banner("Final collapse", "The Calmfield is failing", "storm", 5);
        }
        break;
      case "ping":
        this.pings.push({ kind: ev.kind, x: ev.x, z: ev.z, time: this.clock });
        if (this.pings.length > 8) this.pings.shift();
        audio.ui("ping");
        if (ev.kind === "capsule") this.banner("Supply capsule inbound", "High-tier cache marked on your map", "info", 3.5);
        else if (!this.pings.some((p) => p.kind === "caravan" && p !== this.pings[this.pings.length - 1])) this.banner("Caravan drone sighted", "A shielded cache is crossing the island", "info", 3.5);
        break;
      case "echo":
        for (const p of ev.points) this.renderer.echoes.push({ x: p.x, y: p.y, z: p.z, yaw: p.yaw, age: p.age, until: this.renderer.time + 8 });
        this.toast(ev.points.length ? `Echo Beacon: ${ev.points.length} recent trail marks` : "Echo Beacon: no recent movement nearby", ev.points.length ? "good" : "info");
        break;
      case "toast":
        this.toast(ev.msg, ev.tone);
        break;
      case "pickup": {
        audio.ui(ev.rarity >= 3 ? "pickupEpic" : ev.rarity >= 1 ? "pickupRare" : "pickup");
        if (ev.kind !== "ammo") this.toast(`${ev.kind === "weapon" ? RARITIES[ev.rarity]!.name + " " : ""}${ev.name}`, "good");
        const c = cssToRgb(RARITIES[ev.rarity]?.color ?? "#ffffff");
        this.renderer.burst(this.px, this.py + 0.8, this.pz, 6, 2.5, 0.5, 0.08, c, -2, 0.6);
        break;
      }
      case "land": {
        const p = r.poses.get(ev.actor);
        if (!p) break;
        r.rig(ev.actor)?.landed();
        if (ev.hard) r.burst(p.x, p.y + 0.1, p.z, 10, 4, 0.5, 0.14, [0.88, 0.84, 0.7], 3, 0.1);
        audio.simple(ev.hard ? "landHard" : "land", ev.actor === me ? undefined : p, ev.actor === me ? 0.5 : 1);
        break;
      }
      case "launch": {
        const p = r.poses.get(ev.actor) ?? (ev.actor === me ? { x: this.px, y: this.py, z: this.pz } : null);
        if (!p) break;
        const sp = ev.actor === me ? undefined : p;
        if (ev.kind === "vent") {
          for (let i = 0; i < 16; i++) r.emit(p.x + (Math.random() - 0.5) * 3, p.y + Math.random(), p.z + (Math.random() - 0.5) * 3, 0, 14 + Math.random() * 10, 0, 0.7, 0.14, 0.6, 1, 0.92, 0, 0);
          audio.simple("vent", sp);
        } else if (ev.kind === "splash") {
          r.burst(p.x, 0.1, p.z, 16, 5, 0.6, 0.12, [0.8, 0.95, 1], 12, 0.9);
          audio.simple("splash", sp);
        } else audio.simple(ev.kind, sp, ev.actor === me ? 0.6 : 1);
        break;
      }
      case "phase":
        if (ev.phase === "skiff") {
          audio.ui("board");
          this.banner("All aboard", "Choose your drop. Open the map with M.", "info", 4);
          this.input.resetView(snap.skiff.yaw, -0.35);
        } else if (ev.phase === "active") {
          audio.setMusic("off");
        } else if (ev.phase === "ended") {
          const res = this.link!.results();
          const won = res.winnerId === this.link!.welcome.youId;
          audio.setMusic("off");
          audio.ui(won ? "victory" : "defeat");
          this.banner(won ? "SKYBREAK" : `${res.winnerName} wins`, won ? "Last survivor on the Highwake" : "The match is over", won ? "good" : "info", 6);
          this.endAt = this.clock + (won ? 5.5 : 4);
        }
        break;
    }
  }

  private camX = 0;
  private camY = 0;
  private camZ = 0;

  // ------------------------------------------------------------------ frame

  private frame = (now: number): void => {
    if (!this.running) return;
    requestAnimationFrame(this.frame);
    const dt = clamp((now - this.last) / 1000, 0.001, 0.1);
    this.last = now;
    this.clock += dt;
    this.fpsAcc += dt;
    this.fpsN++;
    if (this.fpsAcc >= 0.5) {
      this.fps = this.fpsN / this.fpsAcc;
      this.fpsAcc = 0;
      this.fpsN = 0;
    }
    this.dynamicResolution(dt);
    const link = this.link;
    if (!link) {
      this.menuFrame(dt);
      return;
    }
    const st = hud.get();
    const active = st.overlay === "none" && this.input.locked;
    link.update(dt, () => this.input.frame(link.viewTime, active && link.curr.you.alive && !link.curr.spectating));
    const snap = link.curr;
    const r = this.renderer;
    const youId = link.welcome.youId;

    // slot sync: follow server-initiated selection changes, handle the wheel
    if (!snap.spectating) {
      if (snap.you.selected !== this.lastSelected) {
        if (this.lastSelected >= 0 && this.input.slot !== snap.you.selected) this.input.slot = snap.you.selected;
        this.lastSelected = snap.you.selected;
      }
      if (this.input.wheel !== 0) {
        const dir = Math.sign(this.input.wheel);
        this.input.wheel = 0;
        let s = this.input.slot;
        for (let i = 0; i < 5; i++) {
          s = (s + dir + 5) % 5;
          if (snap.you.slots[s]) break;
        }
        this.input.slot = s;
        audio.ui("swap");
      }
    }

    r.hideActorId = -1;
    r.update(link.prev, snap, link.alpha, dt);
    this.updateCamera(snap, dt);
    for (const ev of link.events) this.handleEvent(ev, snap);
    link.events.length = 0;
    this.ambient(snap, dt);
    r.world.updateEnvironment(r.time, dt, this.stormParams(snap), snap.you.inStorm && !snap.spectating ? true : snap.you.inStorm);
    r.render();
    this.drawOverlay(snap, dt);
    if (this.clock >= this.hudAt) {
      this.hudAt = this.clock + 0.08;
      this.pushHud(snap);
    }

    // death / end of match flow
    const meAlive = !snap.spectating;
    if (this.wasAlive && !meAlive && this.mode === "solo" && snap.phase !== "ended") {
      this.wasAlive = false;
      const res = link.results();
      const lastKill = [...this.feed].reverse().find((f) => f.victim === this.names.get(youId));
      hud.set({ dead: { placement: res.you?.placement ?? 0, by: lastKill?.killer || (lastKill ? lastKill.cause : "the Riftstorm") }, overlay: "none" });
      audio.ui("defeat");
      audio.setMusic("off");
      this.expectUnlock = true;
      this.input.exitLock();
    }
    if (this.endAt > 0 && this.clock >= this.endAt) this.showResults();
  };

  private stormParams(snap: Snapshot): { cx: number; cz: number; r: number; visible: boolean; intensity: number } {
    const s = snap.storm;
    const visible = this.mode === "solo" && (snap.phase === "active" || snap.phase === "ended");
    return { cx: s.cx, cz: s.cz, r: s.r, visible, intensity: s.dps > 0 ? 1 : 0.38 };
  }

  private menuFrame(dt: number): void {
    const r = this.renderer;
    const t = this.clock * 0.035;
    const s = hud.get().screen;
    const rad = s === "results" ? 430 : 520;
    const x = Math.sin(t) * rad,
      z = Math.cos(t) * rad,
      y = 150 + Math.sin(t * 2.3) * 22;
    const yaw = Math.atan2(-x, -z) + 0.32;
    const pitch = -Math.atan2(y - 28, rad);
    r.time += dt;
    if (this.debugCam) r.setCamera(this.debugCam[0], this.debugCam[1], this.debugCam[2], this.debugCam[3], this.debugCam[4], 0.95);
    else r.setCamera(x, y, z, yaw, pitch, 0.95);
    r.world.updateEnvironment(r.time, dt, { cx: 0, cz: 0, r: 430, visible: false, intensity: 0 }, false);
    r.render();
    this.overlay.draw({ show: false } as never);
    audio.setListener(x, y, z, yaw);
  }

  private dynamicResolution(dt: number): void {
    if (!this.renderer || !settingsStore.value.dynamicRes) return;
    const ms = dt * 1000;
    if (ms > 21) {
      this.slowT += dt;
      this.fastT = 0;
    } else if (ms < 14) {
      this.fastT += dt;
      this.slowT = 0;
    } else {
      this.slowT = Math.max(0, this.slowT - dt);
      this.fastT = 0;
    }
    if (this.slowT > 1.5 && this.scale > 0.6) {
      this.scale = Math.max(0.6, this.scale - 0.1);
      this.slowT = 0;
      this.renderer.world.setRenderScale(this.scale);
    } else if (this.fastT > 5 && this.scale < 1) {
      this.scale = Math.min(1, this.scale + 0.1);
      this.fastT = 0;
      this.renderer.world.setRenderScale(this.scale);
    }
  }

  // ------------------------------------------------------------------ camera

  private updateCamera(snap: Snapshot, dt: number): void {
    const r = this.renderer;
    const s = settingsStore.value;
    const baseV = 2 * Math.atan(Math.tan((s.fov * DEG) / 2) / (16 / 9));
    const pose = r.poses.get(snap.viewId);
    const inp = this.input;
    if (!pose) {
      // riding the skiff: orbit camera
      const sk = snap.skiff;
      const prev = this.link!.prev?.skiff ?? sk;
      const a = this.link!.alpha;
      const sx = lerp(prev.x, sk.x, a),
        sz = lerp(prev.z, sk.z, a);
      this.camYaw = inp.yaw;
      this.camPitch = clamp(inp.pitch, -1.3, 0.3);
      aimDir(this.camYaw, this.camPitch, tmpD);
      const boom = 30;
      this.px = sx;
      this.py = sk.y;
      this.pz = sz;
      this.camX = sx - tmpD.x * boom;
      this.camY = sk.y + 5 - tmpD.y * boom;
      this.camZ = sz - tmpD.z * boom;
      this.vfov = baseV * 1.04;
      r.setCamera(this.camX, this.camY, this.camZ, this.camYaw, this.camPitch, this.vfov);
      audio.setListener(this.camX, this.camY, this.camZ, this.camYaw);
      inp.sensScale = 1;
      return;
    }
    const v = pose.view;
    this.px = pose.x;
    this.py = pose.y;
    this.pz = pose.z;
    const you = snap.you;
    let yaw: number, pitch: number;
    if (snap.spectating) {
      this.specYaw = lerpAngle(this.specYaw, pose.yaw, Math.min(1, dt * 8));
      this.specPitch = lerp(this.specPitch, pose.pitch, Math.min(1, dt * 8));
      yaw = this.specYaw;
      pitch = this.specPitch;
    } else {
      yaw = inp.yaw + inp.lookYaw + you.recoilYaw * DEG;
      pitch = clamp(inp.pitch + inp.lookPitch + you.recoilPitch * DEG, -1.5, 1.5);
      this.specYaw = yaw;
      this.specPitch = pitch;
    }
    const slot = you.slots[you.selected];
    const wst = slot && slot.kind === "weapon" ? weaponStats(slot.weapon, slot.rarity) : null;
    const air = v.mode === Mode.Freefall || v.mode === Mode.Glide;
    const wantAds = !snap.spectating ? inp.ads && !air && wst !== null && (v.flags & ActorFlag.Sprinting) === 0 && v.mode !== Mode.Mantle : (v.flags & ActorFlag.Ads) !== 0;
    this.adsT += ((wantAds ? 1 : 0) - this.adsT) * Math.min(1, dt * 13);
    this.airT += ((air ? 1 : 0) - this.airT) * Math.min(1, dt * 3.5);
    this.shoulderS += ((snap.spectating ? 1 : inp.shoulder) - this.shoulderS) * Math.min(1, dt * 10);
    const crouch = (v.flags & ActorFlag.Crouch) !== 0 || v.mode === Mode.Slide;
    aimPivot({ x: pose.x, y: pose.y, z: pose.z, yaw: snap.spectating ? yaw : inp.yaw, crouch }, this.shoulderS * (1 - this.airT * 0.75), tmpP);
    // smooth only the vertical stance change so crouching does not pop
    if (Math.abs(this.eyeY - (tmpP.y - pose.y)) > 1.5) this.eyeY = tmpP.y - pose.y;
    this.eyeY += (tmpP.y - pose.y - this.eyeY) * Math.min(1, dt * 12);
    tmpP.y = pose.y + this.eyeY + this.airT * 0.5;
    aimDir(yaw, pitch, tmpD);
    let boom = lerp(CAMERA.boom, wst ? wst.def.adsBoom : 2.2, this.adsT);
    boom = lerp(boom, 6.4, this.airT);
    if (v.mode === Mode.Dead) boom = 5.5;
    // camera collision: probe from the pivot back toward the camera, damped return
    const hit = this.island.world.raycast(tmpP.x, tmpP.y, tmpP.z, -tmpD.x, -tmpD.y, -tmpD.z, boom + 0.35);
    const allowed = hit === Infinity ? boom : Math.max(0.35, hit - 0.3);
    if (allowed < this.camBoom) this.camBoom = allowed;
    else this.camBoom = Math.min(allowed, this.camBoom + dt * 7);
    this.camBoom = Math.min(this.camBoom, boom);
    this.camX = tmpP.x - tmpD.x * this.camBoom;
    this.camY = tmpP.y - tmpD.y * this.camBoom;
    this.camZ = tmpP.z - tmpD.z * this.camBoom;
    // never let the camera dip under the terrain
    const gy = this.island.world.terrain(this.camX, this.camZ) + 0.25;
    if (this.camY < gy) this.camY = gy;
    r.hideActorId = this.camBoom < 0.8 ? snap.viewId : -1;
    const rig = r.rig(snap.viewId);
    if (rig) rig.setVisible(r.hideActorId !== snap.viewId);
    let sy = 0,
      sp = 0;
    if (this.shake > 0.001) {
      this.shake = Math.max(0, this.shake - dt * 3.2);
      sy = (Math.random() - 0.5) * 0.012 * this.shake;
      sp = (Math.random() - 0.5) * 0.012 * this.shake;
    }
    const fovMul = lerp(1, wst ? wst.def.adsFov : 0.85, this.adsT) * (1 + this.airT * 0.08) * ((v.flags & ActorFlag.Sprinting) !== 0 && !s.reducedMotion ? 1.03 : 1);
    this.vfov = baseV * fovMul;
    this.camYaw = yaw;
    this.camPitch = pitch;
    r.setCamera(this.camX, this.camY, this.camZ, yaw + sy, pitch + sp, this.vfov);
    audio.setListener(this.camX, this.camY, this.camZ, yaw);
    inp.sensScale = lerp(1, s.adsSens * (wst ? Math.max(0.35, wst.def.adsFov) : 1), this.adsT);
  }

  // ------------------------------------------------------------------ ambience

  private ambient(snap: Snapshot, dt: number): void {
    const r = this.renderer;
    const me = snap.viewId;
    const world = this.island.world;
    // footsteps from the animation phase
    for (const [id, pose] of r.poses) {
      const rig = r.rig(id);
      if (!rig || !rig.stepped) continue;
      const v = pose.view;
      const d = Math.hypot(pose.x - this.px, pose.z - this.pz);
      if (d > 45) continue;
      let surf = 0;
      if (v.mode === Mode.Swim || pose.y < -0.25) surf = 4;
      else {
        world.support(pose.x, pose.z, 0.3, pose.y + 0.3);
        if (world.supportBox >= 0) surf = world.boxes[world.supportBox]!.surf === 1 ? 1 : world.boxes[world.supportBox]!.surf === 2 ? 2 : 0;
      }
      const crouch = (v.flags & ActorFlag.Crouch) !== 0;
      const loud = crouch ? 0.35 : (v.flags & ActorFlag.Sprinting) !== 0 ? 1.2 : 0.8;
      audio.footstep(id === me ? undefined : { x: pose.x, y: pose.y, z: pose.z }, surf, id === me ? loud * 0.55 : loud);
      if (id !== me && !crouch && d < 14 && snap.phase !== "staging") this.overlay.soundFrom(Math.atan2(pose.x - this.px, pose.z - this.pz), "step");
      if (surf === 4 && Math.random() < 0.6) r.burst(pose.x, 0.05, pose.z, 3, 2, 0.35, 0.07, [0.85, 0.96, 1], 9, 0.8);
    }
    const mePose = r.poses.get(me);
    const mode = mePose ? mePose.view.mode : Mode.Skiff;
    const speed = mePose ? Math.hypot(mePose.view.vx, mePose.view.vy, mePose.view.vz) : 30;
    audio.loop("wind", mode === Mode.Freefall || mode === Mode.Glide || mode === Mode.Skiff ? clamp(speed / 60, 0.12, 0.5) : clamp((this.py - 30) / 200, 0, 0.05), "wind");
    audio.loop("zipline", mode === Mode.Zip ? 0.12 : 0, "zip");
    // storm proximity
    const st = snap.storm;
    const sv = this.stormParams(snap);
    let stormLevel = 0;
    if (sv.visible) {
      const dEdge = st.r - Math.hypot(this.px - st.cx, this.pz - st.cz);
      stormLevel = dEdge < 0 ? 0.3 : clamp(1 - dEdge / 60, 0, 1) * 0.16;
      // crystal motes drifting inward along the wall near the player
      if (dEdge < 70 && dEdge > -70 && st.r > 1) {
        const base = Math.atan2(this.px - st.cx, this.pz - st.cz);
        for (let i = 0; i < 2; i++) {
          const a = base + (Math.random() - 0.5) * (120 / Math.max(30, st.r));
          const wx = st.cx + Math.sin(a) * st.r,
            wz = st.cz + Math.cos(a) * st.r;
          const gy = Math.max(0, world.terrain(wx, wz));
          r.emit(wx, gy + Math.random() * 16, wz, -Math.sin(a) * 2.5, 0.8 + Math.random(), -Math.cos(a) * 2.5, 1.6, 0.16, 0.74, 0.5, 1, -0.4, 0.2);
        }
      }
    }
    audio.loop("storm", stormLevel, "storm");
    // heat-channel embers and vents shimmer near the camera
    for (const h of this.island.hazards) {
      if (Math.abs(h.x - this.px) > 70 || Math.abs(h.z - this.pz) > 70) continue;
      if (Math.random() < 0.5) {
        const t = (Math.random() - 0.5) * 2 * h.hz;
        r.emit(h.x + Math.sin(h.yaw) * t, h.y + 0.2, h.z + Math.cos(h.yaw) * t, (Math.random() - 0.5) * 0.6, 1.5 + Math.random() * 2, (Math.random() - 0.5) * 0.6, 1.1, 0.1, 1, 0.55, 0.15, -0.5, 0);
      }
    }
    for (const v of this.island.vents) {
      if (Math.abs(v.x - this.px) > 60 || Math.abs(v.z - this.pz) > 60) continue;
      if (Math.random() < 0.35) r.emit(v.x + (Math.random() - 0.5) * 3.5, v.y + 0.2, v.z + (Math.random() - 0.5) * 3.5, 0, 5 + Math.random() * 5, 0, 0.8, 0.1, 0.6, 1, 0.92, -1, 0);
    }
    // chest hums (short range)
    const hums: { id: number; x: number; y: number; z: number; d: number }[] = [];
    for (const c of snap.chests) {
      if (c.open || c.kind === "locker" || c.kind === "cache") continue;
      const d = Math.hypot(c.x - this.px, c.y - this.py, c.z - this.pz);
      if (d < 15) hums.push({ id: c.id, x: c.x, y: c.y, z: c.z, d });
    }
    hums.sort((a, b) => a.d - b.d);
    audio.setHums(hums);
    audio.loop("caravan", snap.caravan && snap.caravan.alive ? clamp(1 - Math.hypot(snap.caravan.x - this.px, snap.caravan.z - this.pz) / 90, 0, 1) * 0.14 : 0, "drone");
    // adaptive score: sparse tension late in the match
    if (this.mode === "solo" && snap.phase === "active") {
      const tense = snap.storm.phase >= 4 || snap.alive <= 4;
      audio.setMusic(tense ? "tension" : "off");
      // storm countdown ticks in the last five seconds before a contraction
      if (st.state === "wait" || st.state === "calm") {
        const sec = Math.ceil(st.timer);
        if (sec <= 5 && sec >= 1 && sec !== this.stormCountdown) {
          this.stormCountdown = sec;
          audio.ui("tick");
        }
      } else this.stormCountdown = -1;
    }
    // aegis recharge cue
    const aeg = snap.you.aegis;
    if (!snap.spectating && aeg > this.lastAegis + 0.01 && this.lastAegis < 49 && this.wasAegisFull) {
      audio.ui("aegis");
      this.wasAegisFull = false;
    }
    if (aeg >= 49.9 || aeg < this.lastAegis) this.wasAegisFull = true;
    this.lastAegis = aeg;
    void dt;
    void this.lastStepKind;
  }

  // ------------------------------------------------------------------ HUD

  private drawOverlay(snap: Snapshot, dt: number): void {
    const you = snap.you;
    const st = hud.get();
    const pose = this.renderer.poses.get(snap.viewId);
    const slot = you.slots[you.selected];
    const mode = pose ? pose.view.mode : Mode.Skiff;
    const air = mode === Mode.Freefall || mode === Mode.Glide || mode === Mode.Skiff;
    let cross: "none" | "dot" | "cross" | "scope" = "dot";
    if (air || mode === Mode.Dead || st.dead) cross = "none";
    else if (slot && slot.kind === "weapon") cross = this.adsT > 0.6 && (WEAPONS[slot.weapon].cls === "dmr" || WEAPONS[slot.weapon].cls === "rail") ? "scope" : "cross";
    let progress = -1;
    let color = "#ffffff";
    if (you.useT >= 0) {
      progress = you.useT;
      color = "#7af0c0";
    } else if (you.chargeT >= 0) {
      progress = you.chargeT;
      color = "#7ff5e6";
    } else if (you.reloadT >= 0) {
      progress = you.reloadT;
      color = "#ffd24a";
    } else if (st.focus && st.focus.needsSwap && snap.focus && snap.focus.hold > 0) {
      progress = snap.focus.hold;
      color = "#ffffff";
    }
    const s = settingsStore.value;
    this.overlay.draw({
      time: this.clock, dt, show: st.overlay !== "settings", camYaw: this.camYaw, vfov: this.vfov, spreadDeg: you.spread, crosshair: cross,
      progress, progressColor: color, px: this.px, pz: this.pz, playerYaw: pose ? pose.yaw : snap.skiff.yaw, storm: snap.storm,
      stormVisible: this.stormParams(snap).visible || snap.phase === "skiff", inStorm: you.inStorm, healthFrac: snap.spectating ? 1 : you.health / 100,
      marker: you.marker, skiffPath: snap.phase === "skiff" || (snap.phase === "active" && snap.skiff.active) ? this.link!.welcome.skiffPath : null,
      skiff: snap.skiff.active ? snap.skiff : null, pings: this.pings, minimap: st.overlay !== "map", soundIndicators: s.soundIndicators,
      reducedMotion: s.reducedMotion, project: (x, y, z, o) => this.renderer.project(x, y, z, o),
    });
  }

  private pushHud(snap: Snapshot): void {
    const pose = this.renderer.poses.get(snap.viewId);
    const st = snap.storm;
    const next = Math.hypot(this.px - st.nx, this.pz - st.nz) - st.nr;
    const now = this.clock;
    this.feed = this.feed.filter((f) => now - f.time < 7);
    this.toasts = this.toasts.filter((t) => now - t.time < 3.2);
    this.pings = this.pings.filter((p) => now - p.time < 26);
    const loc = pose && pose.view.mode !== Mode.Freefall && pose.view.mode !== Mode.Glide ? locationAt(this.px, this.pz) : null;
    const locName = loc ? loc.name : "";
    const cur = hud.get();
    let banner = cur.banner && cur.banner.until > now ? cur.banner : null;
    if (locName && locName !== this.lastLocation && snap.phase === "active" && !banner && this.mode === "solo") banner = { title: locName, sub: loc!.named ? "Named location" : "Landmark", tone: "info", until: now + 2.6 };
    if (locName !== this.lastLocation) this.lastLocation = locName;
    const focusLoot = snap.focus && snap.focus.kind === "loot" ? (snap.loot.find((l) => l.id === snap.focus!.id) ?? null) : null;
    hud.set({
      phase: snap.phase, phaseTimer: snap.phaseTimer, alive: snap.alive, you: snap.you, actorMode: pose ? pose.view.mode : Mode.Skiff,
      spectating: snap.spectating ? (this.names.get(snap.viewId) ?? "") : null, storm: snap.storm, distToSafe: next, focus: snap.focus, focusLoot,
      feed: this.feed, toasts: this.toasts, banner, location: locName, now, fps: Math.round(this.fps), renderScale: this.scale,
      tickMs: this.link ? this.link.tickMs : 0, pings: this.pings, onSkiff: !pose,
    });
  }

  /** Data for the full-map overlay (pulled by the map component while it is open). */
  mapState(): { px: number; pz: number; yaw: number; snap: Snapshot | null; skiffPath: { ax: number; az: number; bx: number; bz: number } | null; pings: { kind: "capsule" | "caravan"; x: number; z: number; time: number }[]; time: number; stormVisible: boolean } {
    const snap = this.link ? this.link.curr : null;
    const pose = snap ? this.renderer.poses.get(snap.viewId) : undefined;
    return {
      px: this.px, pz: this.pz, yaw: pose ? pose.yaw : snap ? snap.skiff.yaw : 0, snap,
      skiffPath: snap && (snap.phase === "skiff" || snap.skiff.active) && this.link ? this.link.welcome.skiffPath : null, pings: this.pings, time: this.clock,
      stormVisible: !!snap && (this.stormParams(snap).visible || snap.phase === "skiff"),
    };
  }

  /** Automation hook: fixed menu camera [x, y, z, yaw, pitch] for location survey captures. */
  debugCam: [number, number, number, number, number] | null = null;

  /** Automation hook (headless capture cannot take pointer lock): treat the pointer as captured. */
  debugForceLock(): void {
    this.input.locked = true;
    hud.set({ locked: true });
  }

  level(): { level: number; into: number; need: number } {
    return masteryLevel(profileStore.value.xp);
  }
}

export const game = new Game();
void angleDiff;
void DT;
