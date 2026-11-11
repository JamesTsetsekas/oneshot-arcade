// In-match HUD: plain DOM with cached refs and change-only writes (no React in the per-frame path).
import type { World } from "../../shared/sim/world";
import type { PlayerState } from "../../shared/sim/types";
import type { SimEvent } from "../../shared/protocol";
import { WEAPONS } from "../../shared/content/weapons";
import { EQUIPMENT, SUPPORTS, SUPPORT_TIERS } from "../../shared/content/gear";
import { Minimap } from "./minimap";
import { TEAM_NAMES } from "../renderer/characters";
import { angleDiff } from "../../shared/math";
import type { Settings } from "../runtime/settings";

const svg = (body: string, vb = 24) => `<svg viewBox="0 0 ${vb} ${vb}" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
export const ICONS: Record<string, string> = {
  frag: svg('<circle cx="12" cy="14" r="6.5"/><path d="M10 7.5h4M12 7.5V4m0 0h3"/><path d="M9 12l6 4M15 12l-6 4"/>'),
  adhesive: svg('<rect x="5" y="9" width="14" height="8" rx="2"/><path d="M9 9V6h6v3M8 17v2M16 17v2"/>'),
  mine: svg('<path d="M4 17h16l-2-5H6z"/><path d="M12 12V7M8 9l-2-2M16 9l2-2"/><path d="M3 20h18"/>'),
  flash: svg('<rect x="9" y="8" width="6" height="12" rx="1.5"/><path d="M12 2v3M5 6l2 2M19 6l-2 2M3 12h3M18 12h3"/>'),
  obscurant: svg('<rect x="9" y="9" width="6" height="11" rx="1.5"/><path d="M6 8c0-3 3-4 4-2 1-3 5-3 5 0 3-1 4 3 1 4H7C5 10 5 8 6 8z"/>'),
  dart: svg('<path d="M12 3l3 9-3 9-3-9z"/><circle cx="12" cy="12" r="2"/>'),
  recon: svg('<circle cx="12" cy="12" r="3"/><path d="M12 3a9 9 0 019 9M12 7a5 5 0 015 5"/>'),
  ammopod: svg('<rect x="5" y="8" width="14" height="11" rx="1.5"/><path d="M8 8V5h8v3M12 11v5M9.5 13.5h5"/>'),
  drone: svg('<rect x="9" y="10" width="6" height="4" rx="1"/><circle cx="5" cy="7" r="2.5"/><circle cx="19" cy="7" r="2.5"/><circle cx="5" cy="17" r="2.5"/><circle cx="19" cy="17" r="2.5"/><path d="M7 8l3 3M17 8l-3 3M7 16l3-3M17 16l-3-3"/>'),
  mortar: svg('<path d="M9 21l2-12M11 9l6-5"/><circle cx="17" cy="4.5" r="1.5"/><path d="M4 21h8"/><path d="M15 12l4 8"/>'),
  flight: svg('<path d="M12 3l2 6 8 4-8 1-1 6-1 2-1-2-1-6-8-1 8-4z"/>'),
  uplink: svg('<circle cx="12" cy="12" r="2.2"/><path d="M7 7a7 7 0 000 10M17 7a7 7 0 010 10M4 4a11 11 0 000 16M20 4a11 11 0 010 16"/>'),
  heart: svg('<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.4A4 4 0 0119 10c0 5.6-7 10-7 10z"/>'),
};

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", parent?: HTMLElement, html = ""): HTMLElementTagNameMap[K] => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  parent?.appendChild(e);
  return e;
};

interface FeedItem { el: HTMLElement; until: number }

export class Hud {
  root: HTMLElement;
  minimap: Minimap;
  private cache = new Map<string, string>();
  private feed: FeedItem[] = [];
  private popups: FeedItem[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private refs: Record<string, any> = {};
  private damageDirs: Array<{ el: HTMLElement; until: number; worldYaw: number }> = [];
  private hitUntil = 0;
  private announceUntil = 0;
  private scoreboardOn = false;
  private killTimes: number[] = [];
  private lastKilledBy = -1;
  private subtitleItems: FeedItem[] = [];
  private recapShown = false;
  loadoutPanelOpen = false;
  onPickLoadout: (i: number) => void = () => {};
  private multiKillAt = 0;
  private multiKillCount = 0;

  constructor(parent: HTMLElement, private localId: number, private settings: () => Settings, world: World) {
    this.root = el("div", "hud", parent);
    const r = this.refs;
    // top center score bar
    const top = el("div", "hud-score", this.root);
    r.t0name = el("div", "hs-team t0", top, `<span class="hs-dot"></span><span class="hs-name">${TEAM_NAMES[0]}</span>`);
    r.s0 = el("div", "hs-num t0", top, "0");
    const mid = el("div", "hs-mid", top);
    r.timer = el("div", "hs-timer", mid, "8:00");
    r.phase = el("div", "hs-phase", mid, "TEAM CLASH · FIRST TO 75");
    r.s1 = el("div", "hs-num t1", top, "0");
    r.t1name = el("div", "hs-team t1", top, `<span class="hs-name">${TEAM_NAMES[1]}</span><span class="hs-dot"></span>`);
    r.bar0 = el("div", "hs-bar t0", this.root); r.bar0f = el("i", "", r.bar0);
    r.bar1 = el("div", "hs-bar t1", this.root); r.bar1f = el("i", "", r.bar1);
    // minimap
    const mm = el("div", "hud-minimap", this.root);
    this.minimap = new Minimap(mm, world);
    el("div", "mm-n", mm, "N");
    // kill feed
    r.feed = el("div", "hud-feed", this.root);
    // crosshair
    const ch = el("div", "hud-cross", this.root);
    r.cross = ch;
    for (const d of ["u", "d", "l", "r"]) el("i", "cx " + d, ch);
    el("i", "cdot", ch);
    r.hit = el("div", "hud-hit", this.root, "<i></i><i></i><i></i><i></i>");
    r.dmgring = el("div", "hud-dmgring", this.root);
    r.popups = el("div", "hud-popups", this.root);
    r.announce = el("div", "hud-announce", this.root);
    r.count = el("div", "hud-count", this.root);
    // health
    const hp = el("div", "hud-health", this.root);
    r.hpnum = el("div", "hp-num", hp, "100");
    const hpcol = el("div", "hp-col", hp);
    el("div", "hp-label", hpcol, `<span class="ic">${ICONS.heart}</span>HEALTH`);
    r.hpbar = el("div", "hp-bar", hpcol); r.hpfill = el("i", "", r.hpbar);
    // equipment
    const eq = el("div", "hud-equip", this.root);
    r.lethal = el("div", "eq-tile", eq); r.tact = el("div", "eq-tile", eq);
    // ammo
    const am = el("div", "hud-ammo", this.root);
    r.wname = el("div", "am-name", am);
    const row = el("div", "am-row", am);
    r.ammo = el("div", "am-cur", row, "30");
    r.reserve = el("div", "am-res", row, "/ 120");
    r.firemode = el("div", "am-mode", am, "AUTO");
    r.reloadHint = el("div", "am-hint", am, "");
    r.swapHint = el("div", "am-swap", am, "");
    // momentum + supports
    const mo = el("div", "hud-momentum", this.root);
    r.momTrack = el("div", "mo-track", mo);
    r.momPips = [];
    for (let i = 1; i <= 8; i++) { const pip = el("i", "pip" + (i === 3 || i === 5 || i === 8 ? " tier" : ""), r.momTrack); (r.momPips as unknown as HTMLElement[]).push(pip); }
    r.momLabel = el("div", "mo-label", mo, "MOMENTUM 0");
    r.supports = el("div", "mo-supports", mo);
    r.supTiles = [] as unknown as HTMLElement;
    for (let i = 0; i < 3; i++) { const t = el("div", "sup", r.supports); (r.supTiles as unknown as HTMLElement[]).push(t); }
    // overlays
    r.vignette = el("div", "ov-vignette", this.root);
    r.flash = el("div", "ov-flash", this.root);
    r.smoke = el("div", "ov-smoke", this.root);
    r.scope = el("div", "ov-scope", this.root);
    r.recap = el("div", "hud-recap", this.root);
    r.board = el("div", "hud-board", this.root);
    r.endBanner = el("div", "hud-end", this.root);
    r.subtitles = el("div", "hud-subs", this.root);
    r.loadoutPanel = el("div", "hud-lopanel", this.root);
    r.warn = el("div", "hud-warn", this.root);
    r.fps = el("div", "hud-fps", this.root);
    r.pause = el("div", "hud-lockhint", this.root, "<b>CLICK TO RESUME</b><span>Pointer Lock was released</span>");
    r.pause.style.display = "none";
    this.setPalette(["#35c6e8", "#ff8a1f"]);
  }

  setPalette(p: [string, string]): void {
    this.root.style.setProperty("--t0", p[0]);
    this.root.style.setProperty("--t1", p[1]);
  }

  private set(key: string, el: HTMLElement, value: string, html = false): void {
    if (this.cache.get(key) === value) return;
    this.cache.set(key, value);
    if (html) el.innerHTML = value; else el.textContent = value;
  }
  private setStyle(key: string, el: HTMLElement, prop: string, value: string): void {
    const k = key + ":" + prop;
    if (this.cache.get(k) === value) return;
    this.cache.set(k, value);
    (el.style as unknown as Record<string, string>)[prop] = value;
  }
  private setClass(key: string, el: HTMLElement, cls: string): void {
    if (this.cache.get(key) === cls) return;
    this.cache.set(key, cls);
    el.className = cls;
  }

  showLockHint(show: boolean): void { this.refs.pause.style.display = show ? "flex" : "none"; }
  showEnd(text: string, cls: string): void { const b = this.refs.endBanner; b.textContent = text; b.className = "hud-end show " + cls; }
  hideEnd(): void { this.refs.endBanner.className = "hud-end"; }

  // ------------------------------------------------------------------- events
  onEvent(e: SimEvent, world: World): void {
    const me = world.players[this.localId];
    const now = performance.now();
    switch (e.t) {
      case "kill": {
        const k = e.attacker >= 0 ? world.players[e.attacker] : null;
        const v = world.players[e.victim];
        const item = el("div", "kf", this.refs.feed);
        const wd = WEAPONS[e.weapon];
        const wlabel = wd ? wd.designation : e.weapon === "frag" ? "FRAG" : e.weapon === "melee" ? "MELEE" : e.weapon.toUpperCase();
        item.innerHTML = `<span class="kn t${k ? k.team : 0}">${k ? esc(k.name) : "—"}</span><span class="kw">${esc(wlabel)}${e.headshot ? ' <b class="hs">HS</b>' : ""}</span><span class="kn t${v.team}">${esc(v.name)}</span>`;
        if ((k && k.id === this.localId) || v.id === this.localId) item.classList.add("mine");
        this.feed.push({ el: item, until: now + 5200 });
        while (this.feed.length > 6) { this.feed.shift()!.el.remove(); }
        if (e.attacker === this.localId && e.victim !== this.localId) this.localKill(e, world, now);
        if (e.victim === this.localId) { this.lastKilledBy = e.attacker; }
        break;
      }
      case "hit": {
        if (e.attacker === this.localId) {
          const h = this.refs.hit;
          h.className = "hud-hit show " + (e.kill ? "kill" : e.zone === "head" ? "head" : "");
          this.hitUntil = now + (e.kill ? 380 : 180);
        }
        break;
      }
      case "damaged": {
        if (e.victim === this.localId && me) {
          const d = el("div", "dmg", this.refs.dmgring);
          d.innerHTML = "<i></i>";
          const yaw = Math.atan2(e.from.x - me.pos.x, e.from.z - me.pos.z);
          this.damageDirs.push({ el: d, until: now + 1400, worldYaw: yaw });
        }
        break;
      }
      case "score": {
        if (e.player === this.localId) this.popup(`+${e.points}`, e.label, "score");
        break;
      }
      case "assist": break;
      case "announce": this.announce(e.text); break;
      case "momentum": if (e.player === this.localId && e.value > 0) { /* pips handled in update */ } break;
      case "supportReady": if (e.player === this.localId) this.announce(`${SUPPORTS[e.support]?.name ?? e.support} READY — press ${this.keyLabel("supportDeploy")} to deploy`); break;
      case "supportUse": {
        const mine = e.team === (me ? me.team : 0);
        const nm = SUPPORTS[e.support]?.name ?? e.support;
        if (!mine && ["mortar", "flight"].includes(e.support)) this.warn(e.support === "flight" ? "INTERDICTION FLIGHT INBOUND — GET INDOORS" : "MORTAR INBOUND — LEAVE THE MARKED AREA");
        else if (mine) this.announce(`${nm} deployed`);
        break;
      }
      case "supportWarn": if (me && e.team === me.team) this.warn(e.support === "flight" ? "INTERDICTION FLIGHT INBOUND — GET INDOORS" : "MORTAR INBOUND — LEAVE THE MARKED AREA"); break;
      case "supportDestroyed": if (e.by === this.localId) this.popup("+75", e.support === "drone" ? "DRONE DESTROYED" : "POD DESTROYED", "score"); break;
      case "flash": if (e.victim === this.localId) this.cache.set("flashStart", String(now)); break;
      case "step": case "shot": case "explode": this.audioCue(e, world); break;
      default: break;
    }
  }

  private keyLabel(action: string): string {
    const c = this.settings().keys[action] ?? "";
    return c.replace("Key", "").replace("Digit", "").replace("ShiftLeft", "Shift").replace("ControlLeft", "Ctrl") || "?";
  }

  private localKill(e: Extract<SimEvent, { t: "kill" }>, world: World, now: number): void {
    this.killTimes = this.killTimes.filter((t) => now - t < 4000);
    this.killTimes.push(now);
    const n = this.killTimes.length;
    const titles: string[] = [];
    if (e.headshot) titles.push("HEADSHOT");
    if (e.distance > 55) titles.push("LONGSHOT");
    if (this.lastKilledBy === e.victim) { titles.push("PAYBACK"); this.lastKilledBy = -1; }
    if (n === 2) titles.push("DOUBLE ELIMINATION");
    else if (n === 3) titles.push("TRIPLE ELIMINATION");
    else if (n >= 4) titles.push("MULTI ELIMINATION x" + n);
    const me = world.players[this.localId];
    if (me && me.stats.streak === 5) titles.push("5 STREAK");
    if (me && me.stats.streak === 10) titles.push("10 STREAK");
    if (e.support) titles.push("SUPPORT KILL");
    for (const t of titles.slice(0, 2)) this.popup("", t, "medal");
    void this.multiKillAt; void this.multiKillCount;
  }

  private popup(big: string, label: string, kind: string): void {
    const p = el("div", "pp " + kind, this.refs.popups, `<b>${esc(big)}</b><span>${esc(label)}</span>`);
    this.popups.push({ el: p, until: performance.now() + (kind === "medal" ? 2000 : 1500) });
    while (this.popups.length > 4) this.popups.shift()!.el.remove();
  }
  announce(text: string): void {
    const a = this.refs.announce;
    a.textContent = text; a.classList.add("show");
    this.announceUntil = performance.now() + 2600;
  }
  warn(text: string): void {
    const w = this.refs.warn;
    w.textContent = text; w.classList.add("show");
    window.setTimeout(() => w.classList.remove("show"), 3600);
  }

  /** Directional visual cues for critical sounds (accessibility). Approximate 8-way direction, no exact positions. */
  private audioCue(e: SimEvent, world: World): void {
    if (!this.settings().subtitles) return;
    const me = world.players[this.localId];
    if (!me || !me.alive) return;
    let pos: { x: number; z: number } | null = null; let text = "";
    if (e.t === "shot") {
      const p = world.players[e.id];
      if (!p || p.team === me.team || e.id === this.localId) return;
      pos = p.pos; text = "Gunfire";
      if (Math.hypot(pos.x - me.pos.x, pos.z - me.pos.z) > 55) return;
    } else if (e.t === "step") {
      const p = world.players[e.id];
      if (!p || p.team === me.team) return;
      if (Math.hypot(p.pos.x - me.pos.x, p.pos.z - me.pos.z) > Math.min(e.loud, 14)) return;
      pos = p.pos; text = "Footsteps";
    } else if (e.t === "explode" && e.kind !== "strafe" && e.kind !== "device") {
      pos = e.pos; text = e.kind === "flash" ? "Flash" : "Explosion";
      if (Math.hypot(pos.x - me.pos.x, pos.z - me.pos.z) > 40) return;
    }
    if (!pos) return;
    const rel = angleDiff(Math.atan2(pos.x - me.pos.x, pos.z - me.pos.z), me.yaw);
    const arrows = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];
    const idx = (Math.round(rel / (Math.PI / 4)) + 8) % 8;
    const key = text + arrows[idx];
    const now = performance.now();
    const ex = this.subtitleItems.find((s) => s.el.dataset.k === key);
    if (ex) { ex.until = now + 1200; return; }
    const item = el("div", "sub", this.refs.subtitles, `<b>${arrows[idx]}</b> ${text}`);
    item.dataset.k = key;
    this.subtitleItems.push({ el: item, until: now + 1200 });
    while (this.subtitleItems.length > 3) this.subtitleItems.shift()!.el.remove();
  }

  setScoreboard(on: boolean): void { this.scoreboardOn = on; this.refs.board.classList.toggle("show", on); if (!on) this.cache.delete("board"); }

  // ------------------------------------------------------------------- per frame
  update(world: World, me: PlayerState, viewYaw: number, o: { spreadPx: number; fps: number; ping: number; showFps: boolean; time: number; viewPitch: number; inSmoke: boolean }): void {
    const m = world.match;
    const now = performance.now();
    const r = this.refs;
    const w = me.weapons[me.slot];
    const def = w.stats.def;
    // ----- scores & timer
    this.set("s0", r.s0, String(m.teamScore[0]));
    this.set("s1", r.s1, String(m.teamScore[1]));
    const rem = Math.ceil(world.timeRemaining);
    const warm = m.phase === "warmup";
    this.set("timer", r.timer, m.phase === "ended" ? "0:00" : `${Math.floor(rem / 60)}:${String(rem % 60).padStart(2, "0")}`);
    const limit = m.phase === "sudden" ? m.suddenTarget : world.cfg.scoreLimit;
    this.set("phase", r.phase, m.phase === "sudden" ? `SUDDEN DEATH · FIRST TO ${m.suddenTarget}` : warm ? "WARM-UP" : `TEAM CLASH · FIRST TO ${world.cfg.scoreLimit}`);
    this.setStyle("b0", r.bar0f, "width", `${Math.min(100, (m.teamScore[0] / limit) * 100).toFixed(1)}%`);
    this.setStyle("b1", r.bar1f, "width", `${Math.min(100, (m.teamScore[1] / limit) * 100).toFixed(1)}%`);
    this.setClass("tlow", r.timer, "hs-timer" + (rem <= 30 && !warm ? " low" : ""));
    // ----- warm-up countdown
    if (warm) {
      const c = Math.ceil(world.cfg.warmup - m.phaseT);
      this.set("count", r.count, `<small>MATCH STARTS IN</small>${Math.max(0, c)}`, true);
      r.count.classList.add("show");
    } else r.count.classList.remove("show");
    // ----- health
    const hp = Math.max(0, Math.ceil(me.health));
    this.set("hp", r.hpnum, String(hp));
    this.setStyle("hpf", r.hpfill, "width", `${hp}%`);
    this.setClass("hpc", r.hpbar, "hp-bar" + (hp <= 30 ? " low" : hp < 100 ? " mid" : ""));
    this.setStyle("vig", r.vignette, "opacity", (hp < 45 && me.alive ? (1 - hp / 45) * 0.9 : 0).toFixed(2));
    // ----- ammo
    this.set("wname", r.wname, `${def.designation} · ${def.name.toUpperCase()}`);
    this.set("ammo", r.ammo, String(w.ammo));
    this.set("res", r.reserve, `/ ${w.reserve}`);
    this.setClass("ammoc", r.ammo, "am-cur" + (w.ammo <= Math.ceil(w.stats.magSize * 0.25) ? " low" : ""));
    this.set("fm", r.firemode, def.fireMode === "auto" ? "FULL AUTO" : def.fireMode === "semi" ? "SEMI" : def.fireMode === "pump" ? "PUMP" : "BOLT");
    const reloading = w.reloadT >= 0;
    const hint = reloading ? "RELOADING" : w.ammo === 0 ? (w.reserve > 0 ? `${this.keyLabel("reload")} RELOAD` : "NO AMMO") : w.ammo <= Math.ceil(w.stats.magSize * 0.25) && w.reserve > 0 ? `${this.keyLabel("reload")} RELOAD` : "";
    this.set("rh", r.reloadHint, hint);
    this.set("sw", r.swapHint, `[1] ${WEAPONS[me.weapons[0].id].designation}   [2] ${WEAPONS[me.weapons[1].id].designation}`);
    // ----- equipment
    const le = EQUIPMENT[me.loadout.lethal], te = EQUIPMENT[me.loadout.tactical];
    this.set("lethal", r.lethal, `<span class="ic">${ICONS[le.id]}</span><span class="k">${this.keyLabel("lethal")}</span><span class="n">${me.equip.lethal}</span>`, true);
    this.set("tact", r.tact, `<span class="ic">${ICONS[te.id]}</span><span class="k">${this.keyLabel("tactical")}</span><span class="n">${me.equip.tactical}</span>`, true);
    this.setClass("lc", r.lethal, "eq-tile" + (me.equip.lethal === 0 ? " empty" : ""));
    this.setClass("tc", r.tact, "eq-tile" + (me.equip.tactical === 0 ? " empty" : ""));
    // ----- momentum
    const pips = r.momPips as unknown as HTMLElement[];
    for (let i = 0; i < 8; i++) {
      const on = me.momentum > i;
      const c = "pip" + (i === 2 || i === 4 || i === 7 ? " tier" : "") + (on ? " on" : "");
      this.setClass("pip" + i, pips[i], c);
    }
    this.set("molabel", r.momLabel, `MOMENTUM ${me.momentum}`);
    const tiles = r.supTiles as unknown as HTMLElement[];
    SUPPORT_TIERS.forEach((tier, i) => {
      const sid = me.loadout.support[i];
      const def2 = SUPPORTS[sid];
      const ready = me.supportReady[i] && !me.supportUsed[i];
      const used = me.supportUsed[i];
      const sel = me.supportSelected === i && ready;
      this.setClass("supc" + i, tiles[i], "sup" + (ready ? " ready" : "") + (used ? " used" : "") + (sel ? " sel" : ""));
      this.set("sup" + i, tiles[i], `<span class="ic">${ICONS[sid]}</span><span class="t">${tier}</span><span class="nm">${def2.name}</span><span class="st">${ready ? (sel ? `[${this.keyLabel("supportDeploy")}] DEPLOY` : "READY") : used ? "USED" : `${Math.max(0, tier - me.momentum)} to go`}</span>`, true);
    });
    // ----- crosshair + hit marker
    const ads = me.adsT;
    const crossVisible = me.alive && ads < 0.55 && !o.inSmoke;
    this.setStyle("crossv", r.cross, "opacity", crossVisible ? "1" : ads > 0.55 && me.alive ? "0.0" : "0");
    this.setStyle("gap", r.cross, "--gap", `${(5 + o.spreadPx).toFixed(1)}px`);
    if (now > this.hitUntil && r.hit.classList.contains("show")) r.hit.className = "hud-hit";
    // scope overlay for marksman rifle / 2x optics
    const scoped = def.look.scope && ads > 0.88 && me.alive;
    this.setStyle("scope", r.scope, "opacity", scoped ? "1" : "0");
    // ----- flash / smoke overlays
    const fl = Math.max(0, me.flashedUntil - world.time);
    this.setStyle("flash", r.flash, "opacity", fl > 0 ? Math.min(1, fl * 1.1 * Math.max(0.4, me.flashPower)).toFixed(2) : "0");
    this.setStyle("smoke", r.smoke, "opacity", o.inSmoke ? "0.93" : "0");
    // ----- damage indicators
    for (let i = this.damageDirs.length - 1; i >= 0; i--) {
      const d = this.damageDirs[i];
      if (now > d.until) { d.el.remove(); this.damageDirs.splice(i, 1); continue; }
      const rel = angleDiff(d.worldYaw, viewYaw);
      d.el.style.transform = `rotate(${(rel * 180 / Math.PI).toFixed(1)}deg)`;
      d.el.style.opacity = String(Math.min(1, (d.until - now) / 700));
    }
    // ----- feeds
    for (let i = this.feed.length - 1; i >= 0; i--) if (now > this.feed[i].until) { this.feed[i].el.remove(); this.feed.splice(i, 1); }
    for (let i = this.popups.length - 1; i >= 0; i--) if (now > this.popups[i].until) { this.popups[i].el.remove(); this.popups.splice(i, 1); }
    for (let i = this.subtitleItems.length - 1; i >= 0; i--) if (now > this.subtitleItems[i].until) { this.subtitleItems[i].el.remove(); this.subtitleItems.splice(i, 1); }
    if (now > this.announceUntil) r.announce.classList.remove("show");
    // ----- recap
    this.updateRecap(world, me);
    // ----- minimap
    this.minimap.draw(world, me, viewYaw, o.time);
    // ----- scoreboard
    if (this.scoreboardOn) this.renderBoard(world, me);
    // ----- fps
    this.setStyle("fpsv", r.fps, "display", o.showFps ? "block" : "none");
    if (o.showFps) this.set("fps", r.fps, `${o.fps.toFixed(0)} fps · sim ${world.tickMs.toFixed(2)} ms`);
  }

  private updateRecap(world: World, me: PlayerState): void {
    const r = this.refs.recap;
    if (me.alive || !me.recap || world.match.phase === "ended") { if (this.recapShown) { r.classList.remove("show"); this.recapShown = false; this.cache.delete("recap"); this.refs.loadoutPanel.classList.remove("show"); this.loadoutPanelOpen = false; } return; }
    const rc = me.recap;
    const since = world.time - me.deadAt;
    const left = Math.max(0, me.respawnAt - world.time);
    const wd = WEAPONS[rc.weapon];
    const wlabel = wd ? `${wd.designation} ${wd.name}` : rc.weapon === "frag" ? "Fragmentation charge" : rc.weapon;
    const rel = angleDiff(rc.fromYaw, me.yaw);
    const tl = rc.timeline.map((t) => `<li><i style="width:${Math.min(100, t.amount * 1.6)}%"></i><span>${t.zone === "head" ? "HEAD" : t.zone === "upper" ? "TORSO" : t.zone === "lower" ? "WAIST" : "LIMB"}</span><b>${t.amount}</b></li>`).join("");
    const html = `<div class="rc-top"><div class="rc-arrow" style="transform:rotate(${(rel * 180 / Math.PI).toFixed(0)}deg)"><i></i></div><div class="rc-main"><small>${rc.attacker >= 0 ? "ELIMINATED BY" : "YOU DIED"}</small><h3 class="t${Math.max(0, rc.attackerTeam)}">${esc(rc.attackerName)}</h3><p>${esc(wlabel)} · ${Math.round(rc.distance)} m${rc.headshot ? " · HEADSHOT" : ""}${rc.support ? " · SUPPORT" : ""}</p></div><div class="rc-resp"><small>RESPAWN</small><b>${left > 0 ? left.toFixed(1) : "…"}</b></div></div><ul class="rc-tl">${tl}</ul><div class="rc-foot">${this.keyLabel("loadout")} change loadout · applies on next spawn</div>`;
    if (since > 0.15) {
      if (!this.recapShown) { this.recapShown = true; r.classList.add("show"); }
      const key = html;
      if (this.cache.get("recap") !== key) { this.cache.set("recap", key); r.innerHTML = html; }
    }
  }

  openLoadoutPanel(names: string[], current: number): void {
    const p = this.refs.loadoutPanel;
    this.loadoutPanelOpen = true;
    p.innerHTML = `<h4>LOADOUT · NEXT SPAWN</h4>${names.map((n, i) => `<div class="lo${i === current ? " cur" : ""}"><b>${i + 1}</b> ${esc(n)}</div>`).join("")}<small>Press 1-5 to choose, M to close</small>`;
    p.classList.add("show");
  }
  closeLoadoutPanel(): void { this.loadoutPanelOpen = false; this.refs.loadoutPanel.classList.remove("show"); }

  private renderBoard(world: World, me: PlayerState): void {
    const rows = (team: number) => world.players.filter((p) => p.team === team).sort((a, b) => b.stats.score - a.stats.score)
      .map((p) => `<tr class="${p.id === me.id ? "me" : ""}${p.alive ? "" : " dead"}"><td class="nm">${esc(p.name)}</td><td>${p.stats.score}</td><td>${p.stats.kills}</td><td>${p.stats.deaths}</td><td>${p.stats.assists}</td><td>${p.stats.supportDestroyed}</td><td>${p.isBot ? "BOT" : "0 ms"}</td></tr>`).join("");
    const head = `<tr><th class="nm"></th><th>SCORE</th><th>K</th><th>D</th><th>A</th><th>DEV</th><th>PING</th></tr>`;
    const html = `<div class="bd-wrap">${[0, 1].map((t) => `<div class="bd-team t${t}"><h3>${TEAM_NAMES[t]}<b>${world.match.teamScore[t]}</b></h3><table>${head}${rows(t)}</table></div>`).join("")}<div class="bd-foot">Practice match · ${world.cfg.difficulty} bots · rules ${"tc-1.0"} · DEV = support devices destroyed</div></div>`;
    if (this.cache.get("board") !== html) { this.cache.set("board", html); this.refs.board.innerHTML = html; }
  }

  dispose(): void { this.root.remove(); }
}

function esc(s: string): string { return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)); }
