// GameSession: owns one Practice match (local authoritative world + renderer + HUD + input + audio) and runs the frame loop.
import { World, eyePos } from "../../shared/sim/world";
import { SIM_DT } from "../../shared/protocol";
import type { SimEvent } from "../../shared/protocol";
import type { MatchConfig, PlayerState } from "../../shared/sim/types";
import { defaultLoadouts, type Loadout } from "../../shared/content/loadout";
import { Renderer } from "../renderer/scene";
import { Hud } from "../ui/hud";
import { InputManager } from "./input";
import { AudioEngine } from "../audio/audio";
import { applyMatchResult, type MatchResult, type Profile } from "./profile";
import type { Settings } from "./settings";
import { Rng, clamp, lerp } from "../../shared/math";
import { Vector3, Color3 } from "@babylonjs/core";

const BOT_NAMES = ["Vesper", "Rook", "Halo", "Marlow", "Tern", "Okoro", "Quill", "Brandt", "Sable", "Lumen", "Ibis", "Corvus", "Dunmore", "Teal", "Ashby", "Nyx", "Gannet", "Pike", "Wren", "Solis"];

export interface PracticeConfig {
  difficulty: "easy" | "normal" | "hard";
  scoreLimit: number;
  timeLimit: number;
  allies: number; // bots on the player's team (0-5)
  enemies: number; // 1-6
  seed?: number;
}
export const DEFAULT_PRACTICE: PracticeConfig = { difficulty: "normal", scoreLimit: 75, timeLimit: 480, allies: 5, enemies: 6 };

export interface SessionCallbacks {
  onPauseRequest(reason: "escape" | "lockLost"): void;
  onEnded(world: World, me: PlayerState, result: MatchResult): void;
  onError(msg: string): void;
  onLockError(msg: string): void;
}

export class GameSession {
  world: World;
  renderer: Renderer;
  hud: Hud;
  input: InputManager;
  me: PlayerState;
  paused = true;
  disposed = false;
  /** Automation only: run the whole pipeline faster than real time. */
  timeScale = 1;
  private last = 0;
  private acc = 0;
  private raf = 0;
  private time = 0;
  private endHandled = false;
  private endAt = 0;
  private result: MatchResult | null = null;
  private matchId: string;
  private loadouts: Loadout[];
  private pendingLoadout = -1;
  private fpsTimer = 0;
  private slowFrames = 0;
  private fastFrames = 0;
  private scaleNow: number;
  private lastLead = -1;
  private wasAlive = true;
  private scoreboardKey = false;
  private contextLost = false;
  private holdAtDeath = false;

  constructor(private canvas: HTMLCanvasElement, hudParent: HTMLElement, private settings: () => Settings, private profile: Profile, private audio: AudioEngine, private cfg: PracticeConfig, private cb: SessionCallbacks) {
    const seed = cfg.seed ?? (Math.floor(Math.random() * 1e9) >>> 0);
    const mc: Partial<MatchConfig> = { scoreLimit: cfg.scoreLimit, timeLimit: cfg.timeLimit, difficulty: cfg.difficulty, seed, warmup: 8 };
    this.world = new World(mc);
    this.matchId = `${seed}-${Date.now()}`;
    this.loadouts = profile.loadouts;
    const rng = new Rng(seed ^ 0x9e3779b9);
    const defs = defaultLoadouts();
    const names = [...BOT_NAMES].sort(() => rng.next() - 0.5);
    this.me = this.world.addPlayer({ name: "You", team: 0, isBot: false, loadout: this.loadouts[profile.selected] });
    let ni = 0;
    for (let i = 0; i < cfg.allies; i++) this.world.addPlayer({ name: names[ni++ % names.length], team: 0, isBot: true, loadout: defs[rng.int(defs.length)] });
    for (let i = 0; i < cfg.enemies; i++) this.world.addPlayer({ name: names[ni++ % names.length], team: 1, isBot: true, loadout: defs[rng.int(defs.length)] });
    this.input = new InputManager(canvas, settings, {
      onLockChange: (locked) => this.onLockChange(locked),
      onLockError: (m) => this.cb.onLockError(m),
      onScoreboard: (s) => { this.scoreboardKey = s; this.hud.setScoreboard(s); },
      onPauseKey: () => {},
      onLoadoutKey: () => this.toggleLoadoutPanel(),
      onInspect: () => this.renderer.vm.startInspect(),
      onPing: () => this.ping(),
      onKeyAny: () => { this.renderer.vm.cancelInspect(); },
    });
    const palette = paletteFor(settings().colorblind);
    this.renderer = new Renderer(canvas, settings(), this.world, palette);
    this.renderer.localId = this.me.id;
    this.hud = new Hud(hudParent, this.me.id, settings, this.world);
    this.hud.setPalette(palette);
    this.scaleNow = settings().renderScale;
    this.world.tick(); // spawn everyone, start warm-up
    this.input.setView(this.me.yaw, 0);
    canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); this.contextLost = true; this.cb.onError("Graphics context lost. The GPU reset or ran out of memory. Reload the page to continue."); });
    window.addEventListener("resize", this.onResize);
    document.addEventListener("visibilitychange", this.onVis);
    (window as unknown as { __breachline?: unknown }).__breachline = { session: this };
  }

  private onResize = (): void => { this.renderer.resize(); };
  private onVis = (): void => { if (document.hidden && !this.paused && this.world.match.phase !== "ended") this.requestPause("lockLost"); };

  // ----------------------------------------------------------------- lifecycle
  start(): void {
    this.paused = false;
    this.input.enabled = true;
    this.last = performance.now();
    this.audio.startMusic("match");
    if (!this.raf) this.raf = requestAnimationFrame(this.loop);
  }
  async resume(): Promise<void> {
    this.paused = false;
    this.input.enabled = true;
    this.input.flush();
    this.last = performance.now();
    this.hud.showLockHint(false);
    await this.input.lock();
    await this.audio.resume();
    if (!this.raf) this.raf = requestAnimationFrame(this.loop);
  }
  pause(): void { this.paused = true; this.input.unlock(); }
  private requestPause(reason: "escape" | "lockLost"): void {
    if (this.paused) return;
    this.paused = true;
    this.input.resetToggles();
    this.cb.onPauseRequest(reason);
  }
  private onLockChange(locked: boolean): void {
    if (!locked && !this.paused && !this.endHandled && !this.disposed) this.requestPause("escape");
  }
  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
    document.removeEventListener("visibilitychange", this.onVis);
    this.input.dispose();
    this.input.unlock();
    this.hud.dispose();
    this.renderer.dispose();
    this.audio.stopMusic();
    const w = window as unknown as { __breachline?: unknown };
    if (w.__breachline && (w.__breachline as { session: unknown }).session === this) delete w.__breachline;
  }
  applySettings(): void {
    const s = this.settings();
    this.renderer.applySettings(s);
    this.scaleNow = s.renderScale;
    this.hud.setPalette(paletteFor(s.colorblind));
    this.audio.applyVolumes();
  }

  // ----------------------------------------------------------------- loop
  private loop = (ts: number): void => {
    this.raf = 0;
    if (this.disposed || this.contextLost) return;
    const now = performance.now();
    let dt = (now - this.last) / 1000;
    this.last = now;
    dt = clamp(dt, 0, 0.1) * this.timeScale;
    if (this.paused) { this.renderIdle(dt); this.raf = requestAnimationFrame(this.loop); return; }
    this.time += dt;
    const w = this.world, me = this.me;
    const s = this.settings();
    // ---- input -> command
    const d = this.input.takeDeltas();
    if (this.input.enabled && w.match.phase !== "ended") {
      if (me.alive) me.cmd = this.input.buildCmd(me.slot);
      else { me.cmd = { ...me.cmd, fire: false, ads: false, forward: 0, strafe: 0, sprint: false }; this.input.flush(); }
    } else me.cmd = { ...me.cmd, fire: false, forward: 0, strafe: 0 };
    // ADS sensitivity scaling (per optic)
    const w0 = me.weapons[me.slot];
    this.input.adsSensScale = lerp(1, clamp(w0.stats.adsFov, 0.3, 1) * s.adsSensMul * 1.15, me.adsT);
    // ---- fixed-step simulation
    this.acc += dt;
    let steps = 0;
    const maxSteps = Math.ceil(6 * this.timeScale);
    while (this.acc >= SIM_DT && steps < maxSteps) { w.tick(); this.acc -= SIM_DT; steps++; if (steps === 1) { /* edge flags consumed by first tick */ } }
    if (steps === maxSteps) this.acc = 0;
    const events = w.drainEvents();
    for (const e of events) this.route(e);
    // match end
    if (w.match.phase === "ended" && !this.endHandled) this.handleEnd();
    if (this.endHandled && this.result && performance.now() > this.endAt && !this.paused) { this.paused = true; this.input.unlock(); const res = this.result; this.result = null; this.cb.onEnded(w, me, res); return; }
    // ---- render
    const alpha = this.acc / SIM_DT;
    const spreadDeg = this.currentSpreadDeg();
    this.renderer.frame(w, alpha, dt, this.time, me, { yaw: this.input.yaw, pitch: this.input.pitch, dYaw: d.dYaw, dPitch: d.dPitch }, {
      showMarkers: true, speed: Math.hypot(me.vel.x, me.vel.z), cookingKind: me.cooking?.kind ?? "", hideViewmodel: !me.alive,
    });
    const eye = eyePos(me);
    const inSmoke = w.col.inSmoke(eye, w.time);
    const vfovRad = this.renderer.camera.fov;
    const spreadPx = Math.tan(spreadDeg * Math.PI / 180) / Math.tan(vfovRad / 2) * (this.canvas.clientHeight / 2);
    this.fpsTimer += dt;
    this.hud.update(w, me, this.input.yaw, { spreadPx, fps: this.renderer.fpsSmooth, ping: 0, showFps: s.showFps, time: this.time, viewPitch: this.input.pitch, inSmoke });
    // ---- audio listener & music
    this.audio.setListener(eye, this.me.alive ? this.input.yaw : this.renderer.camera.rotation.y, this.input.pitch, w.map.indoorAt(me.pos.x, me.pos.z));
    this.audio.update(dt, { health: me.health, alive: me.alive });
    const combat = clamp((w.time - me.lastShotNoiseAt < 4 ? 0.5 : 0) + (w.time - me.lastDamageAt < 5 ? 0.5 : 0), 0, 1);
    const nearEnd = Math.max(w.match.teamScore[0], w.match.teamScore[1]) / w.cfg.scoreLimit;
    this.audio.setIntensity(clamp(0.7 - combat * 0.45 + (nearEnd > 0.8 ? 0.3 : 0), 0.2, 1));
    // ---- dynamic resolution
    this.dynamicResolution(dt);
    // respawn: reset view to spawn orientation
    if (me.alive && !this.wasAlive) { this.input.setView(me.yaw, 0); this.input.resetToggles(); this.renderer.vm.cancelInspect(); if (this.pendingLoadout >= 0) this.pendingLoadout = -1; }
    this.wasAlive = me.alive;
    this.raf = requestAnimationFrame(this.loop);
  };

  private renderIdle(dt: number): void {
    // keep the scene visible behind menus without advancing simulation
    const me = this.me;
    try {
      this.renderer.frame(this.world, 0, 0, this.time, me, { yaw: this.input.yaw, pitch: this.input.pitch, dYaw: 0, dPitch: 0 }, { showMarkers: true, speed: 0, cookingKind: "", hideViewmodel: !me.alive });
    } catch { /* render errors while paused are non-fatal */ }
    void dt;
  }

  private dynamicResolution(dt: number): void {
    const s = this.settings();
    if (!s.dynamicResolution) return;
    const ms = this.renderer.frameMsSmooth;
    const max = s.renderScale;
    if (ms > 22) { this.slowFrames += dt; this.fastFrames = 0; } else if (ms < 13) { this.fastFrames += dt; this.slowFrames = 0; } else { this.slowFrames = 0; this.fastFrames = 0; }
    if (this.slowFrames > 1.2 && this.scaleNow > 0.5) { this.scaleNow = Math.max(0.5, this.scaleNow - 0.07); this.renderer.setRenderScale(this.scaleNow); this.slowFrames = 0; }
    if (this.fastFrames > 3 && this.scaleNow < max) { this.scaleNow = Math.min(max, this.scaleNow + 0.05); this.renderer.setRenderScale(this.scaleNow); this.fastFrames = 0; }
  }

  private currentSpreadDeg(): number {
    const me = this.me;
    const w = me.weapons[me.slot];
    const st = w.stats;
    const hip = st.hipSpread + st.hipSpreadMove * clamp(Math.hypot(me.vel.x, me.vel.z) / 5.2, 0, 1.3) * (1 - me.adsT);
    let sp = lerp(hip, st.adsSpread, me.adsT);
    if (me.crouching) sp *= st.def.crouchSpreadMul;
    if (!me.onGround) sp += 2.5;
    return sp + w.bloom;
  }

  // ----------------------------------------------------------------- events
  private audioOpts(pos: { x: number; y: number; z: number }, gain = 1): { pos: { x: number; y: number; z: number }; occluded: boolean; indoor: boolean; gain: number } {
    const eye = eyePos(this.me);
    const occluded = !this.world.col.lineClear(eye, pos, this.world.time, true);
    return { pos, occluded, indoor: this.world.map.indoorAt(pos.x, pos.z), gain };
  }

  private route(e: SimEvent): void {
    const w = this.world, me = this.me, a = this.audio;
    this.renderer.handleEvent(e, w, me.id);
    this.hud.onEvent(e, w);
    switch (e.t) {
      case "shot": {
        const p = w.players[e.id];
        if (!p) break;
        if (e.id === me.id) a.shot(e.weapon, e.suppressed, { local: true });
        else a.shot(e.weapon, e.suppressed, { ...this.audioOpts(e.origin) });
        break;
      }
      case "empty": if (e.id === me.id) a.dryFire({}); break;
      case "reload": {
        if (e.stage === "cancel") break;
        const p = w.players[e.id];
        if (e.id === me.id) a.reload(e.stage, {}); else if (p) a.reload(e.stage, this.audioOpts(p.pos));
        break;
      }
      case "step": { if (e.id === me.id) a.step(e.surface, e.loud * 0.5, {}); else a.step(e.surface, e.loud, this.audioOpts(e.pos)); break; }
      case "impact": { if (Math.hypot(e.pos.x - me.pos.x, e.pos.z - me.pos.z) < 45) a.impact(e.surface, this.audioOpts(e.pos)); break; }
      case "hit": {
        if (e.attacker === me.id) a.hitMarker(e.kill ? "kill" : e.zone === "head" ? "head" : "normal");
        if (e.victim === me.id) a.damage(e.damage);
        break;
      }
      case "explode": a.explosion(e.kind, this.audioOpts(e.pos, 1)); break;
      case "throw": { const p = w.players[e.id]; if (p) { if (e.id === me.id) a.throwSfx(e.kind, {}); else a.throwSfx(e.kind, this.audioOpts(p.pos)); } break; }
      case "smoke": a.smoke(this.audioOpts(e.pos)); break;
      case "glass": a.glass(this.audioOpts(e.pos)); break;
      case "jump": { const p = w.players[e.id]; if (p && e.id !== me.id) a.jump(this.audioOpts(p.pos)); else a.jump({}); break; }
      case "land": { const p = w.players[e.id]; if (p) a.land(e.hard, e.id === me.id ? {} : this.audioOpts(p.pos)); break; }
      case "mantle": { const p = w.players[e.id]; if (p) a.mantle(e.id === me.id ? {} : this.audioOpts(p.pos)); break; }
      case "melee": { const p = w.players[e.id]; if (p) a.melee(e.hit, e.id === me.id ? {} : this.audioOpts(p.pos)); break; }
      case "swap": { const p = w.players[e.id]; if (p) a.swap(e.id === me.id ? {} : this.audioOpts(p.pos)); break; }
      case "dart": a.reconPulse(this.audioOpts(e.pos, 0.6)); break;
      case "supportReady": if (e.player === me.id) a.stinger("ready"); break;
      case "supportWarn": a.mortarWhistle(this.audioOpts(e.pos), e.seconds); if (e.support === "flight" && me.team === e.team) { a.siren(); a.jetPass(this.audioOpts(e.pos)); } break;
      case "supportUse": {
        if (e.support === "recon" && e.team === me.team) a.reconPulse({});
        if (e.support === "flight" && e.team !== me.team) { a.siren(); }
        break;
      }
      case "phase": {
        if (e.phase === "live") a.stinger("start");
        if (e.phase === "sudden") { a.stinger("sudden"); this.hud.announce("SUDDEN DEATH"); }
        break;
      }
      case "teamScore": {
        const lead = w.match.teamScore[0] > w.match.teamScore[1] ? 0 : w.match.teamScore[1] > w.match.teamScore[0] ? 1 : -1;
        if (lead !== this.lastLead && lead >= 0 && this.lastLead !== -1) { a.stinger("lead"); this.hud.announce(lead === me.team ? "YOUR TEAM TAKES THE LEAD" : "ENEMY TEAM TAKES THE LEAD"); }
        if (lead >= 0) this.lastLead = lead; else if (this.lastLead === -1) this.lastLead = -1;
        const lim = w.cfg.scoreLimit;
        if ([Math.floor(lim * 0.5), Math.floor(lim * 0.8)].includes(e.score)) this.hud.announce(e.team === me.team ? `Your team: ${e.score} points` : `Enemy team: ${e.score} points`);
        break;
      }
      case "spawn": if (e.id === me.id) { this.input.setView(me.yaw, 0); } break;
      case "kill": if (e.victim === me.id) { this.holdAtDeath = true; } break;
      default: break;
    }
  }

  private ping(): void {
    const me = this.me;
    if (!me.alive) return;
    const eye = eyePos(me);
    const d = { x: Math.sin(me.yaw) * Math.cos(me.pitch), y: Math.sin(me.pitch), z: Math.cos(me.yaw) * Math.cos(me.pitch) };
    const hit = this.world.col.raycast(eye, d, 120, true);
    if (!hit) return;
    this.renderer.vfx.ring(new Vector3(hit.point.x, Math.max(0.1, hit.point.y), hit.point.z), new Color3(1, 0.85, 0.3), 2.4, 1.5);
    this.audio.stinger("ready");
    this.hud.announce("Ping placed");
  }

  private toggleLoadoutPanel(): void {
    if (this.me.alive) return;
    if (this.hud.loadoutPanelOpen) { this.hud.closeLoadoutPanel(); return; }
    this.hud.onPickLoadout = (i) => this.pickLoadout(i);
    this.hud.openLoadoutPanel(this.loadouts.map((l) => l.name), this.pendingLoadout >= 0 ? this.pendingLoadout : this.profile.selected);
    const onKey = (ev: KeyboardEvent) => {
      if (!this.hud.loadoutPanelOpen) { document.removeEventListener("keydown", onKey); return; }
      const n = parseInt(ev.key, 10);
      if (n >= 1 && n <= 5) { this.pickLoadout(n - 1); this.hud.openLoadoutPanel(this.loadouts.map((l) => l.name), n - 1); }
    };
    document.addEventListener("keydown", onKey);
  }
  private pickLoadout(i: number): void {
    this.pendingLoadout = i;
    this.world.queueLoadout(this.me, this.loadouts[i]);
    this.hud.announce(`${this.loadouts[i].name} loadout applies on next spawn`);
  }

  private handleEnd(): void {
    this.endHandled = true;
    const w = this.world, m = w.match;
    const won = m.winner === this.me.team;
    const draw = m.winner === 2;
    this.hud.showEnd(draw ? "DRAW" : won ? "VICTORY" : "DEFEAT", draw ? "draw" : won ? "win" : "loss");
    this.audio.stinger(draw ? "lead" : won ? "win" : "lose");
    this.result = applyMatchResult(this.profile, this.me, won, draw, true, this.matchId);
    this.endAt = performance.now() + 4200;
    this.input.enabled = false;
  }

  // ----------------------------------------------------------------- tools
  /** Automation hook: run the match without a real Pointer Lock (headless browsers cannot grant it). */
  forceRun(): void {
    this.paused = false; this.input.enabled = true; this.input.locked = true; this.last = performance.now();
    this.hud.showLockHint(false);
    if (!this.raf) this.raf = requestAnimationFrame(this.loop);
  }
  /** For automated checks: teleport the local player and set view. */
  debugPlace(x: number, z: number, yaw: number, pitch = 0): void {
    const p = this.me;
    p.pos.x = x; p.pos.z = z; p.pos.y = 0; p.prevPos = { ...p.pos }; p.yaw = yaw; p.pitch = pitch;
    this.input.setView(yaw, pitch);
  }
  get matchEnded(): boolean { return this.endHandled; }
  get currentLoadouts(): Loadout[] { return this.loadouts; }
}

export function paletteFor(mode: string): [string, string] {
  if (mode === "deuteranopia" || mode === "protanopia") return ["#4aa3ff", "#ffd60a"];
  if (mode === "tritanopia") return ["#35e8c6", "#ff2e6e"];
  return ["#35c6e8", "#ff8a1f"];
}
