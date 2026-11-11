// Client runtime for a Practice match: embedded authoritative room + local transport,
// fixed-step 60 Hz simulation, snapshot interpolation, input, HUD, audio and recovery paths.
import { Room, TICK_DT } from "../server/room";
import { GameRenderer } from "../renderer";
import { Input } from "./input";
import { Hud, keyLabel } from "../ui/hud";
import { audio } from "../audio/audio";
import { Profile, Settings } from "../profile/profile";
import { Snapshot, GameEvent, MatchResult, InputCommand, PROTOCOL_VERSION } from "../shared/protocol";
import { K17, zoneAt } from "../content/map-k17";
import { levelForXp } from "../content/progression";
import { BotDifficulty } from "../server/bots";
import { WEAPONS } from "../content/weapons";
import { Loadout, validateLoadout } from "../content/loadout";
import { viewDir, DEG } from "../shared/math";

export interface SessionOptions { difficulty: BotDifficulty; scoreLimit: number; timeLimit: number; teamSize: number; autopilot: boolean; seed?: number; warmup?: number }
export interface SessionCallbacks {
  onEnd: (r: MatchResult) => void;
  onPauseChange: (paused: boolean, reason: string) => void;
  onError: (msg: string | null) => void;
  onLoadoutPicker: (open: boolean) => void;
}

export class GameSession {
  room: Room;
  renderer: GameRenderer;
  input: Input;
  hud: Hud;
  canvas: HTMLCanvasElement;
  prev: Snapshot; cur: Snapshot;
  localId: number;
  private acc = 0;
  private last = 0;
  private raf = 0;
  private seq = 0;
  paused = false;
  private ended = false;
  private t = 0;
  private fps = 60;
  private recoilDebt = { p: 0, y: 0 };
  private throwAge = 9; private landAge = 9; private landSpeed = 0; private shake = 0;
  private whistled = new Set<number>();
  private sirenFor = new Set<number>();
  private heartbeatT = 0;
  private wasAlive = true;
  settings: Settings;
  private onResize = () => this.renderer.resize();
  private onVis = () => { if (document.hidden && !this.ended) this.pause("Paused while the tab was hidden"); };
  private hasLockedOnce = false;
  loadoutPickerOpen = false;

  constructor(private container: HTMLElement, private profile: Profile, private opts: SessionOptions, private cb: SessionCallbacks) {
    this.settings = profile.settings;
    const lo = profile.loadouts[profile.selected];
    const level = levelForXp(profile.xp);
    const loadout = validateLoadout(lo, { level, allUnlocked: profile.practiceAllUnlocked }).ok ? lo : profile.loadouts[0];
    this.room = new Room({
      seed: opts.seed ?? (Date.now() & 0xffffff), difficulty: opts.difficulty, scoreLimit: opts.scoreLimit, timeLimit: opts.timeLimit,
      local: { name: profile.name, loadout, autopilot: opts.autopilot }, botsPerTeam: [opts.teamSize, opts.teamSize],
      allUnlocked: profile.practiceAllUnlocked, level, warmup: opts.warmup,
    });
    this.localId = this.room.localId;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "game-canvas";
    this.canvas.tabIndex = 0;
    container.appendChild(this.canvas);
    this.renderer = new GameRenderer(this.canvas, this.settings, 0, loadout.primaryAttachments);
    this.hud = new Hud(container, K17);
    this.hud.setLocal(this.localId, 0);
    this.hud.munitionsEye = Object.values(loadout.perks).includes("munitionsEye");
    this.input = new Input(this.canvas, this.settings);
    this.input.enabled = !opts.autopilot;
    const me = this.room.get(this.localId)!;
    this.input.yaw = me.yaw; this.input.pitch = 0;
    this.input.onLockChange = (locked) => {
      if (locked) { this.hasLockedOnce = true; if (this.paused) this.resume(); else cb.onPauseChange(false, ""); }
      else if (!this.ended && !opts.autopilot && this.hasLockedOnce) this.pause("Paused");
    };
    this.input.onPointerLockError = () => cb.onError("Pointer Lock was refused by the browser. Click the game view again to capture the mouse (some browsers require a short delay after pressing Escape).");
    this.cur = this.room.snapshot(this.localId);
    this.prev = this.cur;
    window.addEventListener("resize", this.onResize);
    document.addEventListener("visibilitychange", this.onVis);
    this.renderer.engine.onContextLostObservable.add(() => { cb.onError("Graphics context lost — waiting for the browser to restore it…"); this.pause("Graphics context lost"); });
    this.renderer.engine.onContextRestoredObservable.add(() => { cb.onError(null); });
    audio.init();
    audio.applySettings({ master: this.settings.master, sfx: this.settings.sfx, music: this.settings.music, hitmarker: this.settings.hitmarkerAudio });
    audio.setMusic("match");
    this.canvas.addEventListener("click", () => { if (!this.input.locked && !opts.autopilot) { audio.init(); this.input.requestLock(); } });
    void PROTOCOL_VERSION;
  }

  start() {
    this.last = performance.now();
    const loop = (now: number) => { this.raf = requestAnimationFrame(loop); this.frame(now); };
    this.raf = requestAnimationFrame(loop);
  }

  pause(reason: string) {
    if (this.paused || this.ended) return;
    this.paused = true;
    this.input.resetToggles();
    this.cb.onPauseChange(true, reason);
  }
  resume() {
    if (!this.paused) return;
    this.paused = false;
    this.last = performance.now();
    this.acc = 0;
    this.cb.onPauseChange(false, "");
  }
  requestLock() { audio.init(); this.input.requestLock(); }

  applySettings(s: Settings) {
    this.settings = s;
    this.input.settings = s; this.input.rebind();
    this.renderer.applySettings(s);
    audio.applySettings({ master: s.master, sfx: s.sfx, music: s.music, hitmarker: s.hitmarkerAudio });
  }

  chooseLoadout(i: number) {
    const lo = this.profile.loadouts[i];
    if (!lo) return;
    const r = this.room.requestLoadout(this.localId, lo);
    if (r.ok) { this.profile.selected = i; this.hud.hint(`${lo.name} equipped on next spawn`); this.pendingAttachments = lo.primaryAttachments; }
    this.loadoutPickerOpen = false; this.cb.onLoadoutPicker(false);
  }
  private pendingAttachments: string[] | null = null;

  private buildCommand(): InputCommand {
    const ax = this.input.axes();
    return { seq: ++this.seq, tick: this.room.tickN, mx: ax.mx, mz: ax.mz, yaw: this.input.yaw, pitch: this.input.pitch, buttons: this.input.locked ? this.input.buttons() : 0, slot: this.input.slot, supportSel: this.input.supportSel };
  }

  private frame(now: number) {
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.25) dt = 0.25;
    this.fps += (1 / Math.max(dt, 1e-3) - this.fps) * 0.05;
    this.t += dt;
    if (!this.paused) {
      this.acc += dt;
      let n = 0;
      while (this.acc >= TICK_DT && n < 8) {
        this.acc -= TICK_DT; n++;
        if (!this.opts.autopilot) this.room.submitInput(this.localId, this.buildCommand());
        this.room.tick();
        this.prev = this.cur;
        this.cur = this.room.snapshot(this.localId);
        for (const e of this.room.drainEvents()) this.onEvent(e);
      }
      if (n === 8) this.acc = 0;
    }
    // keyboard-only UI actions
    if (this.input.consume("loadout") && !this.cur.local.alive) { this.loadoutPickerOpen = !this.loadoutPickerOpen; this.cb.onLoadoutPicker(this.loadoutPickerOpen); }
    if (this.loadoutPickerOpen) {
      for (let i = 0; i < 5; i++) if (this.input.down.has(`Digit${i + 1}`)) { this.chooseLoadout(i); this.input.slot = 0; }
      if (this.cur.local.alive) { this.loadoutPickerOpen = false; this.cb.onLoadoutPicker(false); }
    }
    this.hud.scoreboardVisible = this.input.isDown("scoreboard");
    // recoil recovery (client feel; server validates nothing finer than direction tolerance)
    const rk = Math.min(1, dt * 7);
    const rp = this.recoilDebt.p * rk, ry = this.recoilDebt.y * rk;
    this.recoilDebt.p -= rp; this.recoilDebt.y -= ry;
    this.input.pitch -= rp * DEG; this.input.yaw -= ry * DEG;

    const me = this.room.get(this.localId)!;
    const yaw = this.opts.autopilot ? me.yaw : this.input.yaw;
    const pitch = this.opts.autopilot ? me.pitch : this.input.pitch;
    const alpha = this.paused ? 1 : Math.min(1, this.acc / TICK_DT);
    this.throwAge += dt; this.landAge += dt;
    this.input.zoom = 1 + (this.cur.local.adsZoom - 1) * this.cur.local.ads;
    this.input.scoped = this.renderer.scoped;
    this.renderer.frame({ prev: this.prev, cur: this.cur, alpha, yaw, pitch, dt, t: this.t, lookDX: this.input.lookDX, lookDY: this.input.lookDY, throwAge: this.throwAge, landAge: this.landAge, landSpeed: this.landSpeed, shake: this.shake });
    this.shake = 0;
    this.input.lookDX = 0; this.input.lookDY = 0;
    // audio listener + interior reverb
    const ep = this.renderer.eyePos;
    const fwd = viewDir(yaw, pitch);
    audio.setListener({ x: ep.x, y: ep.y, z: -ep.z }, fwd);
    audio.setInterior(this.renderer.collision.hasRoof({ x: ep.x, y: ep.y, z: ep.z }, 12));
    audio.intensity = Math.max(...this.cur.match.scores) / this.cur.match.scoreLimit;
    audio.combat = Math.max(0, audio.combat - dt * 0.15);
    const loops = new Set<string>();
    for (const d of this.cur.devices) if (d.kind === "drone") { const id = `drone${d.id}`; loops.add(id); audio.loop(id, "droneHum", d.pos, 0.25); }
    audio.stopLoopsExcept(loops);
    for (const s of this.cur.strikes) {
      if (s.kind === "mortar" && s.impactAt > 0 && s.impactAt < 1.6 && !this.whistled.has(s.id)) { this.whistled.add(s.id); audio.play("whistle", { pos: s.pos, gain: 1.0, priority: 2, maxDist: 300 }); }
      if (s.kind === "flight" && s.impactAt < 0.4 && !this.sirenFor.has(s.id)) { this.sirenFor.add(s.id); audio.play("jet", { gain: 1.2, priority: 2 }); audio.play("strafe", { gain: 0.7, priority: 2, when: (audio.now || 0) + 0.8 }); }
    }
    // low-health heartbeat
    if (this.cur.local.alive && this.cur.local.health < 35) { this.heartbeatT -= dt; if (this.heartbeatT <= 0) { this.heartbeatT = 0.9; audio.play("heartbeat", { gain: 0.5, priority: 2 }); } }

    const zone = zoneAt(me.move.pos);
    this.hud.update({
      snap: this.cur, yaw, vfov: this.renderer.vfov, w: this.canvas.clientWidth, h: this.canvas.clientHeight,
      enemyUnderCrosshair: this.cur.local.alive ? this.renderer.enemyUnderCrosshair(yaw, pitch, 0, this.localId) : null,
      settings: this.settings, fps: this.fps, project: (p) => this.renderer.project(p), scoped: this.renderer.scoped, camPos: ep,
    }, dt, zone?.name ?? "Relay Station K-17");
    if (!this.cur.local.alive) this.hud.updateRecapArrow(yaw);
  }

  private onEvent(e: GameEvent) {
    const L = this.localId;
    this.renderer.handleEvent(e, L);
    this.hud.onEvent(e, this.settings, (n, g) => audio.play(n, { gain: g, bus: "ui", priority: 2 }));
    const occluded = (pos: { x: number; y: number; z: number }) => !this.renderer.collision.lineOfSight({ x: this.renderer.eyePos.x, y: this.renderer.eyePos.y, z: this.renderer.eyePos.z }, pos);
    switch (e.type) {
      case "recoil":
        if (e.player === L && !this.opts.autopilot) {
          this.input.addRecoil(e.pitch, e.yaw);
          const def = WEAPONS[this.cur.players.find((p) => p.id === L)?.weapon ?? "jackal"];
          this.recoilDebt.p += e.pitch * def.recoil.recover; this.recoilDebt.y += e.yaw * def.recoil.recover * 0.5;
        }
        break;
      case "shot": {
        const cls = WEAPONS[e.weapon]?.cls ?? "rifle";
        audio.combat = 1;
        if (e.shooter === L) {
          audio.play(e.suppressed ? "shot_suppressed" : `shot_${cls}`, { gain: e.suppressed ? 0.6 : 0.75, rate: 0.96 + Math.random() * 0.08, priority: 3 });
          if (!e.suppressed) audio.play("tail", { gain: 0.25, priority: 0 });
        } else {
          const d = Math.hypot(e.origin.x - this.renderer.eyePos.x, e.origin.z - this.renderer.eyePos.z);
          const occ = occluded(e.origin);
          audio.play(e.suppressed ? "shot_suppressed" : `shot_${cls}`, { pos: e.origin, gain: e.suppressed ? 0.5 : 1.0, occluded: occ || d > 45, rate: 0.95 + Math.random() * 0.1, priority: 2 });
          if (!e.suppressed && d > 20) audio.play("tail", { pos: e.origin, gain: 0.6, occluded: true, priority: 0 });
        }
        break;
      }
      case "dry": if (e.player === L) audio.play("dry", { gain: 0.6 }); break;
      case "reload":
        if (e.player === L) { const n = e.stage === "magOut" ? "magOut" : e.stage === "magIn" ? "magIn" : e.stage === "chamber" ? "chamber" : e.stage === "start" ? "swap" : ""; if (n) audio.play(n, { gain: 0.5 }); }
        break;
      case "swap": if (e.player === L) audio.play("swap", { gain: 0.4 }); break;
      case "melee": if (e.player === L) audio.play("melee", { gain: 0.6 }); break;
      case "footstep": {
        const box = this.renderer.collision.floorAt(e.pos.x, e.pos.z, e.pos.y + 0.05, 0.1);
        void box;
        const metal = e.pos.y > 3 && e.pos.y < 4 || Math.abs(e.pos.y - 3.6) < 0.05;
        if (e.player === L) audio.play(metal ? "stepMetal" : "step", { gain: 0.12 + e.loud * 0.12, rate: 0.9 + Math.random() * 0.2, priority: 0 });
        else audio.play(metal ? "stepMetal" : "step", { pos: e.pos, gain: 0.25 + e.loud * 0.9, rate: 0.9 + Math.random() * 0.2, occluded: occluded({ ...e.pos, y: e.pos.y + 0.5 }), priority: 1, maxDist: 30 });
        break;
      }
      case "land": if (e.player === L) { this.landAge = 0; this.landSpeed = e.speed; audio.play("land", { gain: 0.5 }); } break;
      case "jump": if (e.player === L) audio.play("step", { gain: 0.25 }); break;
      case "mantle": if (e.player === L) { audio.play("melee", { gain: 0.3, rate: 0.7 }); this.landAge = 0.05; this.landSpeed = 4; } break;
      case "throw": if (e.player === L) { this.throwAge = 0; } audio.play("pin", e.player === L ? { gain: 0.5 } : { pos: this.room.get(e.player)?.move.pos, gain: 0.6 }); break;
      case "bounce": audio.play("bounce", { pos: e.pos, gain: 0.6, priority: 1 }); break;
      case "explosion": {
        const d = Math.hypot(e.pos.x - this.renderer.eyePos.x, e.pos.y - this.renderer.eyePos.y, e.pos.z - this.renderer.eyePos.z);
        if (e.kind === "flash") audio.play("flashPop", { pos: e.pos, gain: 1, priority: 3 });
        else if (e.kind === "obscurant") audio.play("smokeHiss", { pos: e.pos, gain: 0.8, priority: 2 });
        else { audio.play("explosion", { pos: e.pos, gain: 1.2, occluded: occluded(e.pos), priority: 3, maxDist: 250 }); this.shake = Math.max(this.shake, Math.max(0, 1.6 - d / 12)); audio.combat = 1; }
        break;
      }
      case "flashed": if (e.player === L) audio.flashRing(e.amount); break;
      case "glass": audio.play("glass", { pos: e.pos, gain: 0.8, priority: 2 }); break;
      case "mineTrip": audio.play("chirp", { pos: e.pos, gain: 1, priority: 3 }); break;
      case "damaged":
        if (e.victim === L) {
          audio.play("hurt", { gain: 0.6, priority: 3 }); audio.combat = 1;
          this.shake = Math.max(this.shake, Math.min(0.8, e.damage / 50));
          // flinch: capped, small real aim displacement
          if (!this.opts.autopilot) this.input.pitch -= Math.min(0.5, e.flinch * e.damage / 60) * DEG;
        }
        break;
      case "death":
        if (e.victim === L) { this.hud.showRecap(e.recap, keyLabel(this.settings.binds.loadout)); this.input.resetToggles(); this.wasAlive = false; }
        break;
      case "spawn":
        if (e.player === L) {
          const p = this.room.get(L)!;
          this.input.yaw = p.yaw; this.input.pitch = 0; this.input.slot = 0; this.recoilDebt = { p: 0, y: 0 };
          if (this.pendingAttachments) { (this.renderer as unknown as { attachments: string[] }).attachments = this.pendingAttachments; this.renderer.vm.weaponId = ""; (this.renderer as unknown as { lastWeapon: string }).lastWeapon = ""; this.pendingAttachments = null; }
          this.hud.munitionsEye = Object.values(p.loadout.perks).includes("munitionsEye");
          this.wasAlive = true;
        }
        break;
      case "supportReady": if (e.player === L) audio.play("supportReady", { bus: "ui", gain: 0.6, priority: 3 }); break;
      case "supportWarning":
        if (e.team === 0 && e.id === "interdictionFlight") audio.play("siren", { gain: 0.6, priority: 3 });
        break;
      case "announce": audio.play(e.tone, { bus: "ui", gain: 0.45, priority: 3 }); break;
      case "score": if (e.player === L && e.amount) audio.play("score", { bus: "ui", gain: 0.25, priority: 1 }); break;
      case "matchEnd":
        this.ended = true;
        setTimeout(() => { if (document.pointerLockElement) document.exitPointerLock(); this.cb.onEnd(e.result); }, 2600);
        break;
      default: break;
    }
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
    document.removeEventListener("visibilitychange", this.onVis);
    this.input.dispose();
    this.hud.dispose();
    this.renderer.dispose();
    this.canvas.remove();
    audio.stopLoopsExcept(new Set());
  }

  /** Test/automation hook data (read-only). */
  debugState() {
    const me = this.room.get(this.localId)!;
    return { phase: this.cur.match.phase, scores: this.cur.match.scores, alive: this.cur.local.alive, fps: Math.round(this.fps), tick: this.cur.tick,
      pos: { x: +me.move.pos.x.toFixed(2), y: +me.move.pos.y.toFixed(2), z: +me.move.pos.z.toFixed(2) }, ammo: this.cur.local.ammo, locked: this.input.locked, paused: this.paused,
      shots: Object.values(me.stats.weapons).reduce((a, w) => a + w.shots, 0), kills: me.stats.kills, deaths: me.stats.deaths };
  }
}

export type { Loadout };
