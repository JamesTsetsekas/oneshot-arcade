// In-match HUD: a lightweight batched DOM layer (no React in the per-frame path).
// Values are diffed before touching the DOM to avoid layout thrash.
import { Snapshot, GameEvent, DeathRecap, PlayerSnap, Team } from "../shared/protocol";
import { MapDef } from "../content/map-k17";
import { EQUIPMENT, SUPPORT } from "../content/items";
import { WEAPONS } from "../content/weapons";
import { MOMENTUM } from "../content/tuning";
import { Settings } from "../profile/profile";
import { DEG, wrapAngle } from "../shared/math";

export const TEAM_NAMES = ["Halyard Security", "Vantor Response"];
const h = (tag: string, cls = "", parent?: HTMLElement, html = ""): HTMLElement => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  parent?.appendChild(e);
  return e;
};
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

export interface HudView {
  snap: Snapshot;
  yaw: number;
  vfov: number;
  w: number; h: number;
  enemyUnderCrosshair: string | null;
  settings: Settings;
  fps: number;
  project: (p: { x: number; y: number; z: number }) => { x: number; y: number; behind: boolean };
  scoped: boolean;
  camPos: { x: number; y: number; z: number };
}

export class Hud {
  root: HTMLElement;
  private els: Record<string, HTMLElement> = {};
  private cache: Record<string, string> = {};
  private mini: HTMLCanvasElement;
  private miniBg: HTMLCanvasElement;
  private dmg: { el: HTMLElement; dir: { x: number; z: number }; t: number }[] = [];
  private hitT = 9; private hitKind = "";
  private feed: { el: HTMLElement; t: number }[] = [];
  private popups: { el: HTMLElement; t: number }[] = [];
  private medalT = 9;
  private announceT = 9;
  private names = new Map<number, PlayerSnap>();
  private localTeam: Team = 0;
  private localId = -1;
  private recapShown = false;
  private hintT = 9;
  private markerPool: HTMLElement[] = [];
  scoreboardVisible = false;
  loadoutPickerOpen = false;
  private time = 0;

  constructor(container: HTMLElement, private map: MapDef) {
    const r = h("div", "hud", container);
    this.root = r;
    const E = (k: string, cls: string, parent: HTMLElement = r, html = "") => (this.els[k] = h("div", cls, parent, html));
    E("vignette", "hud-vignette"); E("flash", "hud-flash"); E("scope", "hud-scope", r, `<div class="scope-ring"></div><div class="scope-h"></div><div class="scope-v"></div>`);
    E("markers", "hud-markers");
    const ch = E("crosshair", "hud-crosshair");
    for (const k of ["t", "b", "l", "r"]) this.els[`ch_${k}`] = h("div", `ch-line ch-${k}`, ch);
    this.els.ch_dot = h("div", "ch-dot", ch);
    E("hitmarker", "hud-hitmarker", r, `<i></i><i></i><i></i><i></i>`);
    const dmgWrap = E("dmg", "hud-dmg");
    for (let i = 0; i < 6; i++) this.dmg.push({ el: h("div", "dmg-arc", dmgWrap), dir: { x: 0, z: 0 }, t: 9 });
    E("enemyName", "hud-enemy-name");
    const top = E("top", "hud-top");
    this.els.scoreA = h("div", "score score-a", top); this.els.clock = h("div", "clock", top); this.els.scoreB = h("div", "score score-b", top);
    this.els.phase = h("div", "phase", top);
    this.els.barA = h("div", "sbar sbar-a", top, "<span></span>"); this.els.barB = h("div", "sbar sbar-b", top, "<span></span>");
    const mm = E("minimap", "hud-minimap");
    this.mini = h("canvas", "", mm) as HTMLCanvasElement; this.mini.width = 220; this.mini.height = 220;
    this.els.zone = h("div", "mm-zone", mm);
    this.miniBg = document.createElement("canvas");
    this.drawMinimapBg();
    E("feed", "hud-feed");
    E("net", "hud-net");
    const hp = E("health", "hud-health");
    this.els.hpBar = h("div", "hp-bar", hp, "<span></span>"); this.els.hpNum = h("div", "hp-num", hp);
    this.els.equip = h("div", "hud-equip", hp);
    const am = E("ammo", "hud-ammo");
    this.els.wName = h("div", "w-name", am); this.els.ammoNum = h("div", "ammo-num", am); this.els.ammoMode = h("div", "ammo-mode", am); this.els.sidearm = h("div", "ammo-side", am);
    const mo = E("momentum", "hud-momentum");
    this.els.moPips = h("div", "mo-pips", mo); this.els.moLabel = h("div", "mo-label", mo);
    for (let i = 1; i <= 8; i++) h("div", `pip ${MOMENTUM.tiers.includes(i as 3 | 5 | 8) ? "tier" : ""}`, this.els.moPips);
    this.els.support = h("div", "hud-support", r);
    E("popups", "hud-popups"); E("medal", "hud-medal"); E("announce", "hud-announce");
    E("hint", "hud-hint"); E("protect", "hud-protect", r, "SPAWN PROTECTION");
    E("warmup", "hud-warmup"); E("recap", "hud-recap"); E("scoreboard", "hud-scoreboard"); E("fps", "hud-fps"); E("uplink", "hud-uplink");
    E("reload", "hud-reload"); E("cook", "hud-cook");
  }

  private set(k: string, html: string) { if (this.cache[k] !== html) { this.cache[k] = html; this.els[k].innerHTML = html; } }
  private style(el: HTMLElement, key: string, prop: string, value: string) {
    const ck = `${key}:${prop}`;
    if (this.cache[ck] !== value) { this.cache[ck] = value; el.style.setProperty(prop, value); }
  }
  private show(k: string, on: boolean) { this.style(this.els[k], k, "display", on ? "" : "none"); }

  private drawMinimapBg() {
    const c = this.miniBg; const S = 4; // px per metre
    c.width = 120 * S; c.height = 100 * S;
    const g = c.getContext("2d")!;
    g.fillStyle = "rgba(10,20,28,0.0)"; g.fillRect(0, 0, c.width, c.height);
    const X = (x: number) => (x + 60) * S, Z = (z: number) => (50 - z) * S;
    g.fillStyle = "rgba(60,72,80,0.85)"; g.fillRect(X(-57.5), Z(47.5), 115 * S, 95 * S);
    g.fillStyle = "rgba(78,88,92,0.9)"; g.fillRect(X(-57.5), Z(47.5), 115 * S, 27.5 * S);
    const sorted = [...this.map.boxes].filter((b) => !b.noRender && b.max.y > 0.3 && b.max.y - b.min.y < 12 && b.max.x - b.min.x < 60).sort((a, b) => a.max.y - b.max.y);
    for (const b of sorted) {
      const hgt = b.max.y;
      if (b.roofOf) { g.fillStyle = "rgba(120,132,140,0.55)"; }
      else if (b.mat === "glass") g.fillStyle = "rgba(120,200,220,0.8)";
      else g.fillStyle = hgt > 2.6 ? "rgba(196,204,208,0.95)" : hgt > 1.5 ? "rgba(160,170,176,0.95)" : "rgba(120,130,136,0.95)";
      g.fillRect(X(b.min.x), Z(b.max.z), (b.max.x - b.min.x) * S, (b.max.z - b.min.z) * S);
    }
    g.strokeStyle = "rgba(230,240,245,0.6)"; g.lineWidth = 2; g.strokeRect(X(-57.5), Z(47.5), 115 * S, 95 * S);
    g.fillStyle = "rgba(41,182,200,0.25)"; g.fillRect(X(-57.5), Z(18), 11 * S, 36 * S);
    g.fillStyle = "rgba(226,112,43,0.25)"; g.fillRect(X(46.5), Z(18), 11 * S, 36 * S);
  }

  setLocal(id: number, team: Team) { this.localId = id; this.localTeam = team; }

  private friendColor(team: Team, s: Settings) {
    const friend = team === this.localTeam;
    if (s.colorblind) return friend ? "#4d8dff" : "#ffd21a";
    return friend ? "#38d8ea" : "#ff6a2a";
  }

  private drawMinimap(v: HudView) {
    const g = this.mini.getContext("2d")!;
    const W = this.mini.width, H = this.mini.height;
    const me = v.snap.players.find((p) => p.id === this.localId);
    if (!me) return;
    const S = 4, scale = 0.62; // show ~ 88 m across
    g.clearRect(0, 0, W, H);
    g.save();
    g.beginPath(); g.arc(W / 2, H / 2, W / 2 - 2, 0, Math.PI * 2); g.clip();
    g.fillStyle = "rgba(8,16,22,0.72)"; g.fillRect(0, 0, W, H);
    g.translate(W / 2, H / 2);
    g.rotate(-v.yaw);
    g.scale(scale, scale);
    g.drawImage(this.miniBg, -(me.pos.x + 60) * S, -(50 - me.pos.z) * S);
    const P = (x: number, z: number) => [(x - me.pos.x) * S, -(z - me.pos.z) * S] as const;
    // teammates
    for (const p of v.snap.players) {
      if (!p.alive || p.id === this.localId || p.team !== this.localTeam) continue;
      const [x, y] = P(p.pos.x, p.pos.z);
      g.save(); g.translate(x, y); g.rotate(p.yaw);
      g.fillStyle = this.friendColor(p.team, v.settings);
      g.beginPath(); g.moveTo(0, -9); g.lineTo(6, 6); g.lineTo(-6, 6); g.closePath(); g.fill();
      g.restore();
    }
    // radar blips: only information this team is entitled to
    for (const b of v.snap.radar) {
      const [x, y] = P(b.x, b.z);
      if (b.kind === "ping") { g.strokeStyle = "#ffe066"; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y - 9); g.lineTo(x + 9, y); g.lineTo(x, y + 9); g.lineTo(x - 9, y); g.closePath(); g.stroke(); continue; }
      const alpha = b.kind === "fire" ? Math.max(0, 1 - b.age / 1.2) : 1;
      g.fillStyle = v.settings.colorblind ? `rgba(255,210,26,${alpha})` : `rgba(255,70,50,${alpha})`;
      g.beginPath(); g.arc(x, y, b.kind === "fire" ? 7 : 8, 0, Math.PI * 2); g.fill();
      if (b.kind !== "fire") { g.strokeStyle = "rgba(255,255,255,0.7)"; g.lineWidth = 1.5; g.stroke(); }
    }
    // enemy support devices visible to us are shown at their position (they're loud and visible)
    for (const d of v.snap.devices) {
      const [x, y] = P(d.pos.x, d.pos.z);
      g.fillStyle = d.team === this.localTeam ? "#38d8ea" : "#ff6a2a";
      g.fillRect(x - 6, y - 6, 12, 12);
    }
    for (const s of v.snap.strikes) {
      if (s.kind === "mortar" && s.impactAt > 0) { const [x, y] = P(s.pos.x, s.pos.z); g.strokeStyle = "rgba(255,60,40,0.9)"; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 6 * S, 0, Math.PI * 2); g.stroke(); }
      if (s.kind === "flight" && s.dir && s.impactAt > -3) {
        const [x0, y0] = P(s.pos.x, s.pos.z); const [x1, y1] = P(s.pos.x + s.dir.x * 200, s.pos.z + s.dir.z * 200);
        g.strokeStyle = s.team === this.localTeam ? "rgba(56,216,234,0.5)" : "rgba(255,60,40,0.6)"; g.lineWidth = 9 * S; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      }
    }
    for (const sm of v.snap.smokes) { const [x, y] = P(sm.pos.x, sm.pos.z); g.fillStyle = "rgba(220,225,230,0.5)"; g.beginPath(); g.arc(x, y, sm.radius * S, 0, Math.PI * 2); g.fill(); }
    g.restore();
    // self arrow (always up)
    g.fillStyle = "#ffffff";
    g.beginPath(); g.moveTo(W / 2, H / 2 - 10); g.lineTo(W / 2 + 7, H / 2 + 7); g.lineTo(W / 2, H / 2 + 3); g.lineTo(W / 2 - 7, H / 2 + 7); g.closePath(); g.fill();
    // north tick
    g.save(); g.translate(W / 2, H / 2); g.rotate(-v.yaw); g.fillStyle = "rgba(255,255,255,0.8)"; g.font = "bold 12px sans-serif"; g.textAlign = "center"; g.fillText("N", 0, -H / 2 + 16); g.restore();
    g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = 2; g.beginPath(); g.arc(W / 2, H / 2, W / 2 - 2, 0, Math.PI * 2); g.stroke();
  }

  update(v: HudView, dt: number, zoneName: string) {
    this.time += dt;
    const s = v.snap, L = s.local, st = v.settings;
    for (const p of s.players) this.names.set(p.id, p);
    const me = s.players.find((p) => p.id === this.localId)!;
    const alive = L.alive;
    const live = s.match.phase !== "ended";
    this.root.classList.toggle("dead", !alive);
    this.root.classList.toggle("colorblind", st.colorblind);

    // --- top bar
    const ours = s.match.scores[this.localTeam], theirs = s.match.scores[this.localTeam === 0 ? 1 : 0];
    this.set("scoreA", `<b>${ours}</b><small>${this.localTeam === 0 ? "HALYARD" : "VANTOR"}</small>`);
    this.set("scoreB", `<b>${theirs}</b><small>${this.localTeam === 0 ? "VANTOR" : "HALYARD"}</small>`);
    const c = Math.ceil(s.match.clock);
    this.set("clock", `${Math.floor(c / 60)}:${String(c % 60).padStart(2, "0")}`);
    const phaseLabel = s.match.phase === "warmup" ? "WARMUP" : s.match.phase === "suddenDeath" ? `SUDDEN DEATH · FIRST TO +5` : s.match.phase === "ended" ? "MATCH OVER" : `TEAM CLASH · ${s.match.scoreLimit}`;
    this.set("phase", phaseLabel);
    this.style(this.els.barA.firstElementChild as HTMLElement, "barA", "width", `${Math.min(100, (ours / s.match.scoreLimit) * 100)}%`);
    this.style(this.els.barB.firstElementChild as HTMLElement, "barB", "width", `${Math.min(100, (theirs / s.match.scoreLimit) * 100)}%`);

    // --- warmup countdown
    this.show("warmup", s.match.phase === "warmup");
    if (s.match.phase === "warmup") this.set("warmup", `<small>MATCH BEGINS IN</small><b>${Math.ceil(s.match.clock)}</b><span>Relay Station K-17 · Team Clash · First to ${s.match.scoreLimit}</span>`);

    // --- crosshair: spread angle -> pixels
    const pxPerRad = (v.h / 2) / Math.tan(v.vfov / 2);
    const gap = Math.max(3, Math.tan(L.spread * DEG) * pxPerRad);
    const showCh = alive && L.ads < 0.55 && !L.sprinting && L.swapT <= 0;
    this.show("crosshair", showCh || (alive && L.ads >= 0.55 && !v.scoped));
    const chColor = v.enemyUnderCrosshair ? (st.colorblind ? "#ffd21a" : "#ff5040") : st.crosshairColor;
    this.style(this.els.crosshair, "chc", "--ch-color", chColor);
    this.style(this.els.crosshair, "chg", "--ch-gap", `${gap.toFixed(1)}px`);
    this.style(this.els.crosshair, "chlines", "--ch-lines", showCh && st.reticle !== "dot" ? "1" : "0");
    this.style(this.els.crosshair, "chdot", "--ch-dot", L.ads >= 0.55 || st.reticle === "dot" || st.reticle === "ring" ? "1" : "0");
    this.root.dataset.reticle = st.reticle;
    this.show("scope", v.scoped && alive);
    this.show("enemyName", !!v.enemyUnderCrosshair && alive);
    if (v.enemyUnderCrosshair) this.set("enemyName", esc(v.enemyUnderCrosshair));

    // --- hit marker
    this.hitT += dt;
    const hm = this.els.hitmarker;
    this.style(hm, "hm", "opacity", this.hitT < 0.16 ? String(1 - this.hitT / 0.16) : "0");
    this.style(hm, "hmk", "--hm-color", this.hitKind === "kill" ? "#ff3b30" : this.hitKind === "head" ? "#ffd166" : this.hitKind === "protected" ? "#7fb3ff" : this.hitKind === "device" ? "#38d8ea" : "#ffffff");
    this.style(hm, "hms", "transform", `translate(-50%,-50%) scale(${this.hitKind === "kill" ? 1.35 : 1})`);

    // --- damage direction
    for (const d of this.dmg) {
      d.t += dt;
      const on = d.t < 1.4;
      this.style(d.el, `dmg${this.dmg.indexOf(d)}`, "opacity", on ? String(Math.min(1, 1.4 - d.t)) : "0");
      if (on) {
        const ang = Math.atan2(d.dir.x, d.dir.z);
        const rel = wrapAngle(ang - v.yaw);
        this.style(d.el, `dmgr${this.dmg.indexOf(d)}`, "transform", `translate(-50%,-50%) rotate(${(rel / DEG).toFixed(1)}deg)`);
      }
    }

    // --- health, vignette, flash
    const hpK = Math.max(0, L.health) / 100;
    this.style(this.els.hpBar.firstElementChild as HTMLElement, "hpw", "width", `${(hpK * 100).toFixed(0)}%`);
    this.style(this.els.hpBar.firstElementChild as HTMLElement, "hpc", "background", hpK < 0.35 ? "#ff4b3a" : hpK < 0.7 ? "#ffc247" : "#e9f1f4");
    this.set("hpNum", `${Math.ceil(Math.max(0, L.health))}`);
    this.style(this.els.vignette, "vig", "opacity", alive ? String(Math.max(0, (0.7 - hpK) * 1.4)) : "0");
    const flashColor = st.photosensitive ? "rgba(40,44,50,1)" : "rgba(255,255,255,1)";
    this.style(this.els.flash, "flc", "background", flashColor);
    this.style(this.els.flash, "flo", "opacity", String(Math.min(st.photosensitive ? 0.85 : 1, L.flash)));
    this.show("protect", L.protected && alive);

    // --- equipment
    const eq = (slot: { id: string; count: number; charge: number }, key: string) => {
      const d = EQUIPMENT[slot.id];
      const pct = slot.count > 0 ? 100 : Math.round(slot.charge * 100);
      return `<div class="eq ${slot.count > 0 ? "ready" : ""}"><kbd>${key}</kbd><span>${d.name}</span><i style="width:${pct}%"></i></div>`;
    };
    this.set("equip", eq(L.lethal, keyLabel(st.binds.lethal)) + eq(L.tactical, keyLabel(st.binds.tactical)));

    // --- ammo
    const wId = me?.weapon ?? "jackal";
    this.set("wName", esc(L.weaponName));
    const low = L.ammo <= Math.ceil(L.mag * 0.25);
    this.set("ammoNum", `<b class="${L.ammo === 0 ? "empty" : low ? "low" : ""}">${L.ammo}</b><span>/ ${L.reserve}</span>`);
    this.set("ammoMode", `${L.mode.toUpperCase()}${WEAPONS[wId]?.modes.length > 1 ? ` <kbd>${keyLabel(st.binds.mode)}</kbd>` : ""}`);
    this.set("sidearm", `<kbd>${L.slot === 0 ? keyLabel(st.binds.sidearm) : keyLabel(st.binds.primary)}</kbd> ${L.slot === 0 ? "Sidearm" : "Primary"} · ${L.sidearmAmmo}`);
    // reload / cook progress
    this.show("reload", !!L.reload && alive);
    if (L.reload) this.set("reload", `<span>${L.reload.kind === "empty" ? "EMPTY RELOAD" : "RELOADING"}</span><i style="width:${Math.min(100, (L.reload.t / L.reload.total) * 100).toFixed(0)}%"></i>`);
    else if (alive && L.ammo === 0 && L.reserve === 0) { this.show("reload", true); this.set("reload", `<span>NO AMMO — SWITCH WEAPON</span>`); }
    else if (alive && low && L.reserve > 0) { this.show("reload", true); this.set("reload", `<span class="pulse">RELOAD <kbd>${keyLabel(st.binds.reload)}</kbd></span>`); }
    this.show("cook", L.cooking >= 0 && alive);
    if (L.cooking >= 0) { const fuse = EQUIPMENT[L.lethal.id].fuse; this.set("cook", `COOKING ${(Math.max(0, fuse - L.cooking)).toFixed(1)}s`); }

    // --- momentum + support
    const pips = this.els.moPips.children;
    for (let i = 0; i < pips.length; i++) (pips[i] as HTMLElement).classList.toggle("on", L.momentum >= i + 1 - 1e-6);
    this.set("moLabel", `MOMENTUM ${L.momentum % 1 ? L.momentum.toFixed(1) : L.momentum}`);
    let sup = "";
    if (L.supportReady.length) {
      sup = L.supportReady.map((id, i) => `<div class="sup ${i === L.supportSel ? "sel" : ""}"><b>${SUPPORT[id].name}</b><small>T${SUPPORT[id].tier}</small></div>`).join("");
      sup += `<div class="sup-keys"><kbd>${keyLabel(st.binds.supportSelect)}</kbd> select · <kbd>${keyLabel(st.binds.supportDeploy)}</kbd> deploy</div>`;
    }
    this.set("support", sup);
    this.show("uplink", L.uplink > 0);
    if (L.uplink > 0) this.set("uplink", `TEAM UPLINK ${Math.ceil(L.uplink)}s`);

    // --- feed / popups / medal / announce timers
    for (const f of this.feed) { f.t += dt; if (f.t > 6) f.el.remove(); else f.el.style.opacity = String(Math.min(1, 6 - f.t)); }
    this.feed = this.feed.filter((f) => f.t <= 6);
    for (const p of this.popups) { p.t += dt; if (p.t > 1.6) p.el.remove(); else { p.el.style.opacity = String(Math.min(1, 1.6 - p.t)); } }
    this.popups = this.popups.filter((p) => p.t <= 1.6);
    this.medalT += dt; this.style(this.els.medal, "medal", "opacity", this.medalT < 1.8 ? String(Math.min(1, 1.8 - this.medalT)) : "0");
    this.announceT += dt; this.style(this.els.announce, "ann", "opacity", this.announceT < 3.2 ? String(Math.min(1, 3.2 - this.announceT)) : "0");
    this.hintT += dt; this.style(this.els.hint, "hint", "opacity", this.hintT < 2.6 ? String(Math.min(1, 2.6 - this.hintT)) : "0");

    // --- minimap
    this.drawMinimap(v);
    this.set("zone", esc(zoneName));
    this.set("net", `PRACTICE · LOCAL ROOM · 60 Hz · 0 ms`);
    this.show("fps", st.showFps); if (st.showFps) this.set("fps", `${v.fps.toFixed(0)} FPS`);

    // --- world markers (pings, munitions eye, mortar targets)
    let mi = 0;
    const marker = (x: number, y: number, cls: string, text: string) => {
      let el = this.markerPool[mi];
      if (!el) { el = h("div", "", this.els.markers); this.markerPool[mi] = el; }
      mi++;
      el.className = `marker ${cls}`;
      el.style.transform = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px)`;
      if (el.textContent !== text) el.textContent = text;
      el.style.display = "";
    };
    for (const b of s.radar) if (b.kind === "ping") {
      const pr = v.project({ x: b.x, y: me.pos.y + 1, z: b.z });
      if (!pr.behind) marker(pr.x, pr.y, "ping", `${Math.round(Math.hypot(b.x - me.pos.x, b.z - me.pos.z))}m`);
    }
    for (const st2 of s.strikes) if (st2.kind === "mortar" && st2.impactAt > 0) {
      const pr = v.project({ x: st2.pos.x, y: st2.pos.y + 1, z: st2.pos.z });
      if (!pr.behind) marker(pr.x, pr.y, "danger", "MORTAR");
    }
    const munitions = s.footprints && me;
    void munitions;
    for (const q of s.projectiles) {
      if (q.team === this.localTeam || (q.kind !== "breachMine" && q.kind !== "adhesive" && q.kind !== "frag")) continue;
      const d = Math.hypot(q.pos.x - me.pos.x, q.pos.y - me.pos.y, q.pos.z - me.pos.z);
      // Frag danger indicator for nearby live grenades (as in the genre); Munitions Eye extends to mines/charges
      const eye = (this as unknown as { munitionsEye?: boolean }).munitionsEye;
      if ((q.kind === "frag" && d < 8) || (eye && d < 20)) {
        const pr = v.project(q.pos);
        if (!pr.behind) marker(pr.x, pr.y, "danger", q.kind === "frag" ? "!" : "MINE");
      }
    }
    for (; mi < this.markerPool.length; mi++) this.markerPool[mi].style.display = "none";

    // --- scoreboard
    this.show("scoreboard", this.scoreboardVisible || (s.match.phase === "ended" && live));
    if (this.scoreboardVisible) this.renderScoreboard(s);

    // --- death recap / respawn
    this.show("recap", !alive && s.match.phase !== "ended");
    if (!alive) {
      const rc = this.els.recap.querySelector(".respawn");
      if (rc) rc.textContent = L.respawnIn > 0 ? `Respawning in ${L.respawnIn.toFixed(1)}s` : "Deploying…";
    } else if (this.recapShown) { this.recapShown = false; }
  }

  munitionsEye = false;

  renderScoreboard(s: Snapshot) {
    const row = (p: PlayerSnap) => `<tr class="${p.id === this.localId ? "me" : ""} ${p.alive ? "" : "deadrow"}"><td>${esc(p.name)}${p.bot ? ' <em>BOT</em>' : ""}</td><td>${p.score}</td><td>${p.kills}</td><td>${p.deaths}</td><td>${p.assists}</td><td>${p.supportDestroyed}</td><td>${p.bot ? "—" : `${p.ping}`}</td></tr>`;
    const team = (t: Team) => {
      const list = s.players.filter((p) => p.team === t).sort((a, b) => b.score - a.score);
      return `<div class="sb-team ${t === this.localTeam ? "friendly" : "enemy"}"><h3>${TEAM_NAMES[t]} <span>${s.match.scores[t]}</span></h3><table><thead><tr><th>Name</th><th>Score</th><th>K</th><th>D</th><th>A</th><th>Sup.</th><th>Ping</th></tr></thead><tbody>${list.map(row).join("")}</tbody></table></div>`;
    };
    this.set("scoreboard", team(this.localTeam) + team(this.localTeam === 0 ? 1 : 0) + `<div class="sb-foot">Practice room · local authoritative simulation · hold Tab</div>`);
  }

  showRecap(r: DeathRecap, loadoutKey: string) {
    this.recapShown = true;
    const dirDeg = 0;
    void dirDeg;
    const hits = r.hits.slice(-8).map((x) => `<li><span class="t">${x.t.toFixed(1)}s</span><span class="who">${esc(x.attacker)}</span><span class="src">${esc(x.source)}</span><span class="zone">${x.zone}</span><b>-${x.damage}</b></li>`).join("");
    const killer = r.killer ?? "the station";
    this.els.recap.innerHTML = `
      <div class="recap-card">
        <div class="recap-head"><small>ELIMINATED BY</small><h2>${esc(killer)}</h2>
          <div class="recap-meta"><span>${esc(r.weapon)}</span>${r.distance ? `<span>${r.distance} m</span>` : ""}${r.headshot ? `<span class="hs">HEADSHOT</span>` : ""}${r.killerHealth !== null ? `<span>Their health ${r.killerHealth}</span>` : ""}${r.sourceKind === "support" ? `<span class="hs">SUPPORT ACTION</span>` : ""}</div>
        </div>
        <div class="recap-body"><div class="recap-dir"><div class="arrow" data-dir="${Math.atan2(r.finalDir.x, r.finalDir.z)}"></div><small>Final hit direction</small></div>
        <ol class="recap-hits">${hits || "<li>No recorded hits</li>"}</ol></div>
        <div class="respawn"></div>
        <div class="recap-keys"><kbd>${loadoutKey}</kbd> change loadout for next spawn</div>
      </div>`;
  }

  /** Rotate recap arrow relative to current view. */
  updateRecapArrow(yaw: number) {
    const a = this.els.recap.querySelector(".arrow") as HTMLElement | null;
    if (!a) return;
    const dir = parseFloat(a.dataset.dir ?? "0");
    a.style.transform = `rotate(${(wrapAngle(dir - yaw) / DEG).toFixed(0)}deg)`;
  }

  onEvent(e: GameEvent, settings: Settings, playSound: (n: string, g?: number) => void) {
    const L = this.localId;
    switch (e.type) {
      case "hit":
        if (e.attacker === L) {
          this.hitT = 0;
          this.hitKind = e.protectedHit ? "protected" : e.device ? "device" : e.kill ? "kill" : e.zone === "head" ? "head" : "hit";
          if (settings.hitmarkerAudio) playSound(e.kill ? "hitKill" : e.zone === "head" ? "hitHead" : "hit", e.kill ? 0.7 : 0.45);
        }
        break;
      case "damaged":
        if (e.victim === L) {
          const slot = this.dmg.reduce((a, b) => (b.t > a.t ? b : a));
          slot.t = 0; slot.dir = { x: e.dir.x, z: e.dir.z };
        }
        break;
      case "kill": {
        const k = e.killer !== null ? this.names.get(e.killer) : null;
        const vi = this.names.get(e.victim);
        const kc = k ? (k.team === this.localTeam ? "f" : "e") : "";
        const vc = vi ? (vi.team === this.localTeam ? "f" : "e") : "";
        const el = h("div", `feed-row ${e.killer === L || e.victim === L ? "mine" : ""}`, this.els.feed,
          `${k && e.killer !== e.victim ? `<b class="${kc}">${esc(k.name)}</b>` : ""}<span class="wpn">${esc(e.weapon)}${e.headshot ? " ◎" : ""}</span><b class="${vc}">${esc(vi?.name ?? "?")}</b>`);
        this.feed.push({ el, t: 0 });
        if (this.feed.length > 6) { this.feed[0].el.remove(); this.feed.shift(); }
        break;
      }
      case "score":
        if (e.player === L) {
          const el = h("div", "popup", this.els.popups, e.amount ? `<b>+${e.amount}</b> ${esc(e.label)}` : esc(e.label));
          this.popups.push({ el, t: 0 });
          if (this.popups.length > 4) { this.popups[0].el.remove(); this.popups.shift(); }
        }
        break;
      case "medal":
        if (e.player === L) { this.medalT = 0; this.els.medal.textContent = e.label.toUpperCase(); }
        break;
      case "announce":
        if (settings.subtitles) { this.announceT = 0; this.els.announce.textContent = e.text; this.els.announce.dataset.tone = e.tone; }
        break;
      case "supportReady":
        if (e.player === L) { this.announceT = 0; this.els.announce.textContent = `${SUPPORT[e.id].name} ready`; this.els.announce.dataset.tone = "good"; }
        break;
      case "supportWarning":
        if (e.team === this.localTeam && e.id === "interdictionFlight") { this.announceT = -1; this.els.announce.textContent = "⚠ ENEMY INTERDICTION FLIGHT — GET UNDER COVER"; this.els.announce.dataset.tone = "warn"; }
        if (e.team === this.localTeam && e.id === "mortarMark") { this.announceT = 0; this.els.announce.textContent = "⚠ MORTAR INCOMING — MOVE"; this.els.announce.dataset.tone = "warn"; }
        if (e.team === this.localTeam && e.id === "reconPulse") this.hint("Enemy recon pulse — you are revealed");
        break;
      case "uiError":
        this.hint(e.text);
        break;
      default: break;
    }
  }

  hint(text: string) { this.hintT = 0; this.els.hint.textContent = text; }

  dispose() { this.root.remove(); }
}

export function keyLabel(code: string | undefined): string {
  if (!code) return "?";
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  const map: Record<string, string> = { Mouse0: "LMB", Mouse1: "MMB", Mouse2: "RMB", Mouse3: "M4", Mouse4: "M5", Space: "Space", ShiftLeft: "Shift", ShiftRight: "RShift", ControlLeft: "Ctrl", ControlRight: "RCtrl", AltLeft: "Alt", Tab: "Tab", Backquote: "`", CapsLock: "Caps" };
  return map[code] ?? code;
}
