import { AudioSys } from "../audio/audio";
import { mixSeed } from "../core/rng";
import { SKILL_BY_ID, basicSkill } from "../data/skills";
import { ELITE_BY_ID } from "../data/enemies";
import type { ClassId } from "../data/types";
import { openRepository, type Profile, type SaveRepository } from "../persistence/save";
import { newCharacter, xpToNext, type CharacterData } from "../progression/character";
import { QUEST_BY_ID, questStepText } from "../progression/quests";
import { Renderer } from "../render/renderer";
import { Game } from "../sim/game";
import { DT, type GameEvent } from "../sim/types";
import { skillCooldown } from "../data/skills";
import { generateZone } from "../world";
import type { ZoneData, ZoneId } from "../world/types";
import { store, toast, type HudSnapshot, type Panel } from "../ui/store";
import { Input } from "./input";
import { keyName, mergeSettings, type Action, type Settings } from "./settings";

const STATUS_LABEL: Record<string, [string, boolean]> = {
  burn: ["Burning", false], blight: ["Blighted", false], chill: ["Chilled", false], slow: ["Slowed", false], root: ["Rooted", false], stun: ["Stunned", false],
  guard: ["Guard", true], camo: ["Mothcloak", true], evadeNext: ["Guaranteed evade", true], tonic: ["Gold Tonic", true], cleanseImm: ["Ailment immunity", true],
  blessing: ["Echo blessing", true], shrine: ["Ember Shrine", true], standard: ["Ashen Standard", true],
};

export class Controller {
  repo!: SaveRepository;
  profile: Profile = { settings: {}, tutorial: {}, cosmetics: {} };
  settings: Settings = mergeSettings(undefined);
  game: Game | null = null;
  renderer: Renderer | null = null;
  audio = new AudioSys();
  input!: Input;
  canvas!: HTMLCanvasElement;
  overlayEl!: HTMLElement;
  private worker: Worker | null = null;
  private reqId = 1;
  private pending = new Map<number, (z: ZoneData) => void>();
  private acc = 0;
  private last = 0;
  private hudT = 0;
  private saveT = 0;
  private saving = false;
  private saveQueued = false;
  private loadingZone = false;
  private running = false;
  private fpsT = 0;

  async boot(canvas: HTMLCanvasElement, overlay: HTMLElement) {
    this.canvas = canvas;
    this.overlayEl = overlay;
    // capability check: WebGL 2 is required
    const test = document.createElement("canvas");
    const gl = test.getContext("webgl2");
    if (!gl) {
      store.set({ screen: "error", error: { title: "WebGL 2 is not available", detail: "Ashfall Covenant needs a browser with WebGL 2 enabled (current Chrome, Edge or Firefox). Check that hardware acceleration is on in your browser settings, then reload." } });
      return;
    }
    const { repo, persistent } = await openRepository();
    this.repo = repo;
    this.profile = await repo.profile();
    this.settings = mergeSettings(this.profile.settings as Partial<Settings>);
    this.applyAudioSettings();
    this.input = new Input(canvas, overlay, () => this.settings, () => this.renderer);
    this.input.enabled = false;
    this.input.onEscape = () => this.escape();
    this.input.onUiAction = (a) => this.uiAction(a);
    this.input.onAnyInput = () => this.audio.init();
    try {
      this.worker = new Worker(new URL("../workers/zoneWorker.ts", import.meta.url), { type: "module" });
      this.worker.onmessage = (e) => { const cb = this.pending.get(e.data.req); this.pending.delete(e.data.req); if (cb) cb(e.data.zone ?? null); };
      this.worker.onerror = () => { this.worker = null; };
    } catch { this.worker = null; }
    await this.refreshSaves();
    store.set({ screen: "menu", persistent, notice: persistent ? null : "Browser storage is unavailable (private mode?). Progress will not persist after closing this tab." });
  }

  async refreshSaves() {
    store.set({ saves: await this.repo.list() });
  }

  applyAudioSettings() {
    this.audio.vol = { ...this.settings.volumes };
    this.audio.applyVolumes();
  }

  async saveSettings(s: Settings) {
    this.settings = s;
    this.profile.settings = s as any;
    await this.repo.saveProfile(this.profile);
    this.applyAudioSettings();
    if (this.renderer) this.renderer.applySettings(this.renderSettings());
    if (this.game) this.game.settings = { autoPickup: s.autoPickup, attackWithoutMove: s.attackWithoutMove };
    store.bump();
  }

  private renderSettings() {
    const s = this.settings;
    return { quality: s.quality, dynamicResolution: s.dynamicResolution, shadows: s.shadows, particles: s.particles, screenShake: s.screenShake, reducedMotion: s.reducedMotion, colorblind: s.colorblind, reducedFlash: s.reducedFlash, gore: s.gore, damageNumbers: s.damageNumbers, labels: s.labels, orbit: s.orbit };
  }

  // ───────────────────────── session lifecycle ─────────────────────────
  async createCharacter(name: string, cls: ClassId, preset: CharacterData["preset"]) {
    const seed = mixSeed(Date.now() & 0xffffffff, Math.floor(Math.random() * 1e9));
    const ch = newCharacter(name.trim() || "Warden", cls, preset, seed, Date.now());
    await this.repo.save(ch);
    this.profile.lastCharacter = ch.id;
    await this.repo.saveProfile(this.profile);
    await this.startGame(ch, true);
  }

  async loadCharacter(id: string) {
    const r = await this.repo.load(id);
    if (!r.data) { store.set({ notice: r.error ?? "Could not load save." }); await this.refreshSaves(); return; }
    if (r.recovered) toast(r.error ?? "Recovered from backup", "warn");
    this.profile.lastCharacter = id;
    await this.repo.saveProfile(this.profile);
    await this.startGame(r.data, false);
  }

  private async startGame(ch: CharacterData, fresh: boolean) {
    store.set({ loading: "Kindling the frontier…", screen: "game", panel: null, death: null, summary: false, actBanner: false, paused: false });
    this.game = new Game(ch, { autoPickup: this.settings.autoPickup, attackWithoutMove: this.settings.attackWithoutMove });
    if (!this.renderer) {
      try {
        this.renderer = new Renderer(this.canvas, this.overlayEl, this.renderSettings());
        this.renderer.overlay.onLabelClick = (pid) => { if (this.game) { this.game.player.pendingInteract = -pid; this.game.player.attackTarget = null; this.game.player.path = null; } };
      } catch (e) {
        store.set({ screen: "error", error: { title: "Graphics initialisation failed", detail: String(e) } });
        return;
      }
    } else this.renderer.rebuildPlayer(this.game);
    // resume at last location if it was a checkpointed zone, otherwise the refuge
    const loc = ch.location;
    const zone: ZoneId = loc && !["hunt_toll", "hunt_engine", "training"].includes(loc.zone) ? (loc.zone as ZoneId) : "refuge";
    const z = await this.fetchZone(zone);
    this.game.loadZone(z, "start", loc && loc.zone === zone ? { x: loc.x, y: loc.y } : undefined);
    if (this.game.ch.blessing > 0) this.game.player.statuses.blessing = { id: "blessing", t: 0, dur: this.game.ch.blessing, mag: 0, stacks: 1, src: 0, tick: 0 };
    this.renderer.buildZone(this.game);
    this.renderer.rebuildPlayer(this.game);
    const tut = this.profile.tutorial;
    store.set({ loading: null, tutorial: { steps: { ...tut }, visible: !tut.done && fresh } });
    this.input.enabled = true;
    this.audio.init();
    this.bannerZone();
    if (!this.running) { this.running = true; this.last = performance.now(); requestAnimationFrame((t) => this.frame(t)); }
    this.requestSave();
  }

  fetchZone(id: ZoneId): Promise<ZoneData> {
    const g = this.game!;
    const seed = g.zoneSeed(id), diff = g.ch.difficulty;
    if (!this.worker) return Promise.resolve(generateZone(id, seed, diff));
    return new Promise((res) => {
      const req = this.reqId++;
      const timeout = setTimeout(() => { if (this.pending.has(req)) { this.pending.delete(req); res(generateZone(id, seed, diff)); } }, 4000);
      this.pending.set(req, (z) => { clearTimeout(timeout); res(z ?? generateZone(id, seed, diff)); });
      this.worker!.postMessage({ req, id, seed, difficulty: diff });
    });
  }

  private async resolveZone() {
    const g = this.game!;
    const pz = g.pendingZone!;
    this.loadingZone = true;
    store.set({ loading: "…" });
    const z = await this.fetchZone(pz.id);
    if (this.game !== g) return;
    g.loadZone(z, pz.entry, pz.pos);
    this.renderer!.buildZone(g);
    this.loadingZone = false;
    store.set({ loading: null, panel: null });
    this.bannerZone();
    this.requestSave();
  }

  private bannerZone() {
    if (!this.game) return;
    store.set({ zoneBanner: { name: this.game.zone.name, t: performance.now() } });
  }

  async quitToMenu() {
    await this.saveNow();
    this.input.enabled = false;
    this.game = null;
    store.set({ screen: "menu", panel: null, paused: false, death: null, summary: false, actBanner: false, hud: null });
    await this.refreshSaves();
  }

  requestSave() {
    this.saveQueued = true;
  }

  async saveNow() {
    if (!this.game || this.saving) return;
    this.saving = true;
    try { await this.repo.save(this.game.snapshot()); } catch (e) { toast("Saving failed — storage may be full.", "warn"); }
    this.saving = false;
    this.saveQueued = false;
  }

  // ───────────────────────── UI routing ─────────────────────────
  escape() {
    const s = store.get();
    if (s.screen !== "game") { if (s.screen === "settings" || s.screen === "credits" || s.screen === "create" || s.screen === "characters") store.set({ screen: s.settingsFrom === "pause" && s.screen === "settings" ? "game" : "menu" }); return; }
    if (s.confirm) { store.set({ confirm: null }); return; }
    if (s.panel) { this.closePanel(); return; }
    if (s.automap) { store.set({ automap: false }); return; }
    if (s.death || s.summary) return;
    store.set({ paused: !s.paused });
    this.input.enabled = !store.get().paused;
  }

  openPanel(p: Panel) {
    const s = store.get();
    store.set({ panel: s.panel === p ? null : p });
  }
  closePanel() { store.set({ panel: null, dialogNpc: null }); }

  private uiAction(a: Action) {
    const s = store.get();
    if (s.screen !== "game" || s.paused || s.death) return;
    if (a === "automap") { store.set({ automap: !s.automap }); return; }
    const map: Partial<Record<Action, Panel>> = { inventory: "inventory", skills: "skills", character: "character", quests: "quests", map: "map" };
    const p = map[a];
    if (p) this.openPanel(p);
  }

  respawn() {
    if (!this.game) return;
    this.game.respawn();
    store.set({ death: null });
  }

  completeTutorial(step: string) {
    const t = store.get().tutorial;
    if (!t.visible || t.steps[step]) return;
    const steps = { ...t.steps, [step]: true };
    const all = ["move", "attack", "skill", "evade", "potion", "talk"].every((k) => steps[k]);
    store.set({ tutorial: { steps, visible: !all } });
    this.profile.tutorial = { ...steps, done: all };
    this.repo.saveProfile(this.profile);
    if (all) toast("Tutorial complete. The gate to the Soot March lies east.", "quest");
  }
  skipTutorial() {
    this.profile.tutorial = { ...this.profile.tutorial, done: true };
    this.repo.saveProfile(this.profile);
    store.set({ tutorial: { steps: store.get().tutorial.steps, visible: false } });
  }

  // ───────────────────────── frame loop ─────────────────────────
  private frame(now: number) {
    requestAnimationFrame((t) => this.frame(t));
    const g = this.game, r = this.renderer;
    if (!g || !r) { this.last = now; return; }
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    const s = store.get();
    const simPaused = s.paused || !!s.loading || s.screen !== "game";
    if (!simPaused && !g.pendingZone) {
      this.acc += dt;
      let steps = 0;
      while (this.acc >= DT && steps < 4) {
        const intents = this.input.consume(g, r);
        this.trackTutorial(intents);
        g.step(intents);
        this.acc -= DT;
        steps++;
        if (g.pendingZone) break;
      }
      if (steps === 4) this.acc = 0;
    } else { this.input.hoverIdle(g, r); }
    const evs = g.drain();
    if (evs.length) this.handleEvents(evs, g);
    r.onEvents(evs, g);
    if (g.pendingZone && !this.loadingZone) this.resolveZone();
    if (this.loadingZone) return;
    r.frame(g, Math.min(1, this.acc / DT), dt);
    this.audio.setListener(g.player.x, g.player.y);
    const theme = g.activeBoss !== null ? "boss" : g.zone.theme;
    this.audio.update(dt, g.player.alive ? g.player.hp / g.player.maxHp : 0, theme);
    this.hudT -= dt;
    if (this.hudT <= 0) { this.hudT = 0.08; store.set({ hud: this.snapshotHud(g, r) }); }
    this.saveT += dt;
    if (this.saveT > 60) { this.saveT = 0; this.requestSave(); }
    if (this.saveQueued && !this.saving) this.saveNow();
  }

  private trackTutorial(i: ReturnType<Input["consume"]>) {
    if (!store.get().tutorial.visible) return;
    if (i.primaryPressed && i.hoverEnemy === null && i.hoverInteract === null) this.completeTutorial("move");
    if (i.primaryPressed && i.hoverEnemy !== null) this.completeTutorial("attack");
    if (i.secondaryPressed) this.completeTutorial("skill");
    if (i.evade) this.completeTutorial("evade");
    if (i.potion !== null) this.completeTutorial("potion");
  }

  private handleEvents(evs: GameEvent[], g: Game) {
    for (const ev of evs) {
      switch (ev.t) {
        case "sfx": this.audio.play(ev.id, ev.x, ev.y, ev.vol ?? 1); break;
        case "toast": toast(ev.text, ev.kind ?? "info"); break;
        case "subtitle": if (this.settings.subtitles) store.set({ subtitle: { who: ev.who, text: ev.text, t: performance.now() } }); break;
        case "loot": if (ev.rarity === "relic" || ev.rarity === "inscribed") toast(`Picked up ${ev.name}`, "loot"); store.bump(); break;
        case "panel":
          if (ev.panel === "dialog") { store.set({ panel: "dialog", dialogNpc: ev.data?.npc ?? null }); if (ev.data?.npc === "ivra") this.completeTutorial("talk"); }
          else store.set({ panel: ev.panel as Panel });
          break;
        case "playerDeath": store.set({ death: { cause: ev.cause, type: ev.type }, panel: null }); this.requestSave(); break;
        case "actComplete": setTimeout(() => store.set({ actBanner: true }), 2500); this.audio.setTheme("victory"); break;
        case "save": this.requestSave(); break;
        case "levelup": store.bump(); break;
        case "zone": store.bump(); break;
        case "bossPhase": this.audio.duck(0.3, 1.5); break;
      }
    }
  }

  private snapshotHud(g: Game, r: Renderer): HudSnapshot {
    const p = g.player, ch = g.ch, st = g.stats;
    const keys = this.settings.keys;
    const mkSlot = (id: string | null, key: string) => {
      if (!id) return { id: null, icon: "", name: "", cdFrac: 0, cdLeft: 0, charges: null, affordable: true, key };
      const s = SKILL_BY_ID[id];
      const cd = skillCooldown(s, st.cdr);
      let cdLeft = p.cds[id] ?? 0;
      let charges: number | null = null;
      if (s.charges) {
        const c = p.charges[id];
        const max = s.charges + (id === "snare_bloom" && st.relics.has("snarewood") ? 1 : 0);
        charges = c ? c.n : max;
        if (c && c.n < max) cdLeft = cd - c.t;
        if (charges > 0) cdLeft = 0;
      }
      const affordable = p.focus >= s.cost && (id !== "furnace_heart" || p.furnace || p.heat >= (s.heatCost ?? 0));
      return { id, icon: s.icon, name: s.name, cdFrac: cd > 0 ? Math.max(0, cdLeft / cd) : 0, cdLeft, charges, affordable, key, active: id === "furnace_heart" && p.furnace };
    };
    const slots = [mkSlot(ch.hotbar[0], "RMB"), ...[1, 2, 3, 4].map((i) => mkSlot(ch.hotbar[i], keyName(keys[`skill${i}` as Action])))];
    const basic = mkSlot(basicSkill(ch.classId), "LMB");
    const statuses = Object.values(p.statuses).filter((s) => STATUS_LABEL[s.id]).map((s) => ({ id: s.id, label: STATUS_LABEL[s.id][0], left: Math.max(0, s.dur - s.t), good: STATUS_LABEL[s.id][1] }));
    if (p.furnace) statuses.push({ id: "furnace", label: "Furnace Heart", left: p.heat / 8, good: true });
    let boss: HudSnapshot["boss"] = null;
    if (g.activeBoss !== null) {
      const b = g.enemyById(g.activeBoss);
      if (b && b.alive && b.boss) boss = { name: b.name, hp: b.hp / b.maxHp, phase: b.boss.phase, armor: b.boss.kind === "tollkeeper" ? b.boss.armor / b.boss.armorMax : null, stagger: b.boss.kind === "engine" && b.boss.phase === 3 ? b.boss.stagger / b.boss.staggerMax : null, invuln: b.boss.invulnerable, enraged: b.boss.enraged };
    }
    let target: HudSnapshot["target"] = null;
    const he = r.hoverEnemy !== null ? g.enemyById(r.hoverEnemy) : null;
    if (he && he.alive && !he.isBoss) {
      const info: string[] = [];
      if (he.statuses.ward) info.push("Warded (−50% damage)");
      if (he.def.behavior === "shield") info.push("Shield: 75% less damage from the front");
      if (he.statuses.mark) info.push(`Trace ×${he.statuses.mark.stacks}`);
      if (he.statuses.shell) info.push("Mirror Shell: reflects projectiles");
      target = { name: he.name, hp: he.hp / he.maxHp, mods: he.elite.map((m) => ELITE_BY_ID[m]?.name ?? m), info: info.join(" · "), level: he.level, elite: he.isElite };
    }
    const quests = Object.entries(ch.quests).filter(([, q]) => q.status === "active").map(([id, q]) => ({ name: QUEST_BY_ID[id].name, step: questStepText(id, q), optional: !!QUEST_BY_ID[id].optional }));
    this.fpsT = r.fps();
    return {
      hp: p.hp, maxHp: p.maxHp, focus: p.focus, maxFocus: p.maxFocus, heat: p.heat, cls: ch.classId, level: ch.level, xp: ch.xp, xpNext: xpToNext(ch.level), gold: ch.gold, dust: ch.dust,
      belt: { ...ch.belt }, beltCap: ch.beltCap, slots, basic, evade: p.evadeCharges, evadeMax: st.evadeCharges, evadeFrac: p.evadeCharges < st.evadeCharges ? p.evadeT / st.evadeRecharge : 0,
      statuses, boss, target, channel: p.action?.kind === "channel" ? p.action.t / p.action.dur : null, quests, zone: g.zone.name, fps: this.fpsT,
      markReady: ch.classId === "ranger" && (p.movedSinceShot >= 2 || !!ch.ranks.thousand_trails), difficulty: ch.difficulty, skillPoints: ch.skillPoints, attrPoints: ch.attrPoints,
      potionKeys: [1, 2, 3, 4].map((i) => keyName(keys[`potion${i}` as Action])), huntTime: g.hunt ? g.time - g.hunt.t0 : null, furnace: p.furnace,
    };
  }
}

export const controller = new Controller();
