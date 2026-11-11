// In-world HUD: plain DOM with batched writes (only touched when values change) + canvas minimap.
import type { Game } from "../sim/game";
import { WEAPONS, GADGETS } from "../sim/weapons";
import { fmtClock, fmtTime, clamp } from "../core/math";
import { X_LINES, Z_LINES, hasEdgeEW, hasEdgeNS, xHalfW, zHalfW, QUAY_Z, CANAL_Z0, CANAL_Z1, onPier } from "../world/district";

const el = (tag: string, cls: string, parent: HTMLElement, html = "") => { const e = document.createElement(tag); e.className = cls; if (html) e.innerHTML = html; parent.appendChild(e); return e; };

export class Hud {
  root: HTMLElement;
  private cache = new Map<HTMLElement, string>();
  private mm: HTMLCanvasElement; private mctx: CanvasRenderingContext2D;
  private base: HTMLCanvasElement;
  e: Record<string, HTMLElement> = {};

  constructor(parent: HTMLElement, private g: Game) {
    this.root = el("div", "hud", parent);
    const R = this.root;
    this.e.vignette = el("div", "vignette", R);
    this.e.fade = el("div", "fade", R);
    const tl = el("div", "hud-objective", R);
    this.e.mtitle = el("div", "mtitle", tl);
    this.e.obj = el("div", "obj", tl);
    this.e.opt = el("div", "opt", tl);
    this.e.timer = el("div", "timer", tl);
    const tr = el("div", "hud-tr glass", R);
    this.e.cash = el("div", "cash", tr);
    this.e.clock = el("div", "clock", tr);
    this.e.district = el("div", "district", tr);
    const al = el("div", "alert", R);
    this.e.beacon = el("div", "beacon", al);
    for (let i = 0; i < 5; i++) el("span", "seg", this.e.beacon);
    this.e.alertLabel = el("div", "alert-label", al);
    const bl = el("div", "hud-bl", R);
    this.mm = el("canvas", "minimap", bl) as HTMLCanvasElement;
    this.mm.width = 230; this.mm.height = 230;
    this.mctx = this.mm.getContext("2d")!;
    const bars = el("div", "bars", bl);
    this.e.hp = el("div", "bar hp", bars, "<i></i>");
    this.e.ar = el("div", "bar ar", bars, "<i></i>");
    this.e.st = el("div", "bar st", bars, "<i></i>");
    const br = el("div", "hud-br glass", R);
    this.e.weapon = el("div", "weapon", br);
    this.e.ammo = el("div", "ammo", br);
    this.e.gadget = el("div", "gadget", br);
    this.e.veh = el("div", "veh", br);
    this.e.cross = el("div", "crosshair", R, "<i></i><i></i><i></i><i></i>");
    this.e.hit = el("div", "hitmark", R, "✕");
    this.e.prompt = el("div", "prompt", R);
    this.e.subs = el("div", "subs", R);
    this.e.toasts = el("div", "toasts", R);
    this.e.banner = el("div", "banner", R);
    this.e.lock = el("div", "lockpick glass", R, `<div class="lp-title">Bypass the lock — press E in the green zone</div><div class="lp-track"><div class="lp-zone"></div><div class="lp-needle"></div></div><div class="lp-stat"></div>`);
    this.e.audio = el("div", "audio-hint", R, "Click to enable sound");
    this.base = document.createElement("canvas");
    this.base.width = this.base.height = 900;
    this.drawBaseMap(this.base.getContext("2d")!);
  }

  static drawRoads(ctx: CanvasRenderingContext2D, scale: number, ox: number, oz: number) {
    // world (x, z) -> canvas (ox + x*scale, oz - z*scale)
    const X = (x: number) => ox + x * scale, Y = (z: number) => oz - z * scale;
    ctx.fillStyle = "#1b4a5a"; ctx.fillRect(X(-450), Y(QUAY_Z), 900 * scale, (QUAY_Z + 450) * scale);
    ctx.fillStyle = "#cfc6b4";
    ctx.fillRect(X(-330), Y(QUAY_Z), 60 * scale, 60 * scale); ctx.fillRect(X(140), Y(QUAY_Z), 20 * scale, 60 * scale);
    ctx.fillStyle = "#1f5a6a"; ctx.fillRect(X(-450), Y(CANAL_Z1), 900 * scale, (CANAL_Z1 - CANAL_Z0) * scale);
    ctx.fillStyle = "#6f6a62";
    for (let i = 0; i < 9; i++) for (let j = 0; j < 8; j++) if (hasEdgeNS(i, j)) { const hw = xHalfW(i); ctx.fillRect(X(X_LINES[i] - hw), Y(Z_LINES[j + 1] + hw), hw * 2 * scale, (Z_LINES[j + 1] - Z_LINES[j] + hw * 2) * scale); }
    for (let j = 0; j < 9; j++) for (let i = 0; i < 8; i++) if (hasEdgeEW(i, j)) { const hw = zHalfW(j); ctx.fillRect(X(X_LINES[i] - hw), Y(Z_LINES[j] + hw), (X_LINES[i + 1] - X_LINES[i] + hw * 2) * scale, hw * 2 * scale); }
    void onPier;
  }

  private drawBaseMap(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#e6dcc6"; ctx.fillRect(0, 0, 900, 900);
    ctx.fillStyle = "#cdbf9f";
    for (const b of this.g.d.buildings) ctx.fillRect(b.x0 + 450, 450 - b.z1, b.x1 - b.x0, b.z1 - b.z0);
    Hud.drawRoads(ctx, 1, 450, 450);
  }

  private set(e: HTMLElement, html: string) { if (this.cache.get(e) !== html) { this.cache.set(e, html); e.innerHTML = html; } }
  private show(e: HTMLElement, on: boolean) { const v = on ? "" : "none"; if (e.style.display !== v) e.style.display = v; }

  update(audioState: string) {
    const g = this.g, ui = g.ui, P = g.player, inv = g.inv;
    const playing = !g.attract;
    this.show(this.root, playing);
    if (!playing) return;
    const s = g.settings;
    this.root.style.setProperty("--subscale", String(s.subtitleSize));
    this.root.classList.toggle("cb", s.colorblind);
    // objective
    this.set(this.e.mtitle, g.mission ? ui.missionTitle : "");
    this.set(this.e.obj, ui.objective);
    this.set(this.e.opt, ui.optional.map((o) => `<div class="${o.done ? "done" : ""}">${o.done ? "◆" : "◇"} ${o.text}</div>`).join(""));
    this.set(this.e.timer, ui.timer !== null ? `⏱ ${fmtTime(ui.timer)}` : "");
    // top right
    this.set(this.e.cash, `$${inv.cash.toLocaleString()} <span class="trust">Trust ${inv.trust}</span>`);
    this.set(this.e.clock, `${fmtClock(g.clock.hour)}${g.weather.rain > 0.3 ? " · rain" : ""}`);
    this.set(this.e.district, g.districtName());
    // alert beacon
    const pol = g.police;
    const segs = this.e.beacon.children;
    const flash = !s.photosensitive && Math.floor(g.time * 2) % 2 === 0;
    for (let i = 0; i < 5; i++) {
      const on = i < pol.tier;
      const cls = `seg${on ? " on" : ""}${on && pol.state === "Pursuit" && flash ? " flash" : ""}${on && (pol.state === "Search" || pol.state === "Cooling") ? " search" : ""}`;
      if ((segs[i] as HTMLElement).className !== cls) (segs[i] as HTMLElement).className = cls;
    }
    const showAlert = pol.tier > 0 || pol.state === "Witness Reporting";
    this.show(this.e.beacon.parentElement!, showAlert);
    const label = pol.state === "Search" ? `Search · ${Math.ceil(Math.max(0, pol.searchT))}s` : pol.state === "Cooling" ? `Cooling · ${Math.ceil(Math.max(0, pol.searchT))}s` : pol.state;
    this.set(this.e.alertLabel, `${label}${pol.tier ? ` · Tier ${pol.tier}` : ""}`);
    // bars
    (this.e.hp.firstChild as HTMLElement).style.width = `${clamp(P.health, 0, 100)}%`;
    (this.e.ar.firstChild as HTMLElement).style.width = `${(inv.armor / 50) * 100}%`;
    this.show(this.e.ar, inv.armor > 0);
    (this.e.st.firstChild as HTMLElement).style.width = `${(g.stamina / 8) * 100}%`;
    this.show(this.e.st, g.stamina < 7.9 && !P.vehicle);
    this.e.hp.classList.toggle("low", P.health < 30);
    // weapon / vehicle
    const v = P.vehicle;
    const w = g.holstered ? WEAPONS.fists : WEAPONS[P.weapon];
    this.set(this.e.weapon, `${w.name} ${w.slot === "none" ? "" : `<span class="tag ${w.lethal ? "lethal" : "nonlethal"}">${w.lethal ? "lethal" : "nonlethal"}</span>`}`);
    this.set(this.e.ammo, w.ammo ? `${inv.mags[w.id] ?? 0} <small>/ ${inv.ammo[w.ammo]}</small>${P.reloadTimer > 0 ? " <small>reloading…</small>" : ""}` : "");
    this.set(this.e.gadget, `${GADGETS[inv.selectedGadget].name} ×${inv.gadgets[inv.selectedGadget]} · Medkits ×${inv.medkits}`);
    if (v) {
      const kmh = Math.round(v.speed * 3.6);
      this.set(this.e.veh, `<b>${kmh}</b> km/h · ${v.gear < 0 ? "R" : v.gear} · <span class="${v.health < 40 ? "warn" : ""}">${v.conditionLabel}</span>${v.tiresPopped ? ' · <span class="warn">Tires</span>' : ""}${g.radioStation ? ` · ${["", "Tidewave 88.4", "Hillside 94.1"][g.radioStation]}` : ""}${g.pkg.fragile && g.mission?.def.kind === "courier" ? ` · Package ${Math.round(g.pkg.integrity)}%` : ""}${v.tag === "hot_van" ? ` · Cargo ${Math.round(v.cargo)}%` : ""}`);
    } else this.set(this.e.veh, "");
    // crosshair
    this.show(this.e.cross, !!P.aiming);
    this.show(this.e.hit, ui.hitMarker > 0);
    this.set(this.e.prompt, ui.prompt ? `<span>${ui.prompt}</span>` : "");
    this.show(this.e.prompt, !!ui.prompt);
    this.set(this.e.subs, s.subtitles ? ui.subtitles.map((q) => `<div class="sub ${q.kind}"><b>${q.speaker}:</b> ${q.text}</div>`).join("") : "");
    this.set(this.e.toasts, ui.toasts.map((t) => `<div class="toast glass">${t.text}</div>`).join(""));
    this.set(this.e.banner, ui.banner ? `<div class="b-title">${ui.banner.title}</div><div class="b-sub">${ui.banner.sub}</div>` : "");
    this.e.vignette.style.opacity = String(clamp(ui.damageFlash * 2, 0, 0.8) + (P.health < 30 ? 0.35 : 0));
    this.e.fade.style.opacity = String(ui.fade);
    // lockpick
    const lp = ui.lockpick;
    this.show(this.e.lock, !!lp);
    if (lp) {
      const pos = (Math.sin(lp.t * 2.6) + 1) / 2;
      (this.e.lock.querySelector(".lp-needle") as HTMLElement).style.left = `${pos * 100}%`;
      const z = this.e.lock.querySelector(".lp-zone") as HTMLElement;
      z.style.left = `${(lp.zone - lp.width / 2) * 100}%`; z.style.width = `${lp.width * 100}%`;
      this.set(this.e.lock.querySelector(".lp-stat") as HTMLElement, `Pins ${lp.hits}/3 · Slips ${lp.misses}/2`);
    }
    this.show(this.e.audio, audioState !== "running");
    this.drawMinimap();
  }

  private drawMinimap() {
    const g = this.g, c = this.mctx, W = 230, H = 230;
    const p = g.playerPos();
    const inV = !!g.player.vehicle;
    const scale = inV ? 0.9 : 1.6; // px per meter
    const rot = g.settings.minimapRotate ? g.cam.yaw : 0;
    c.save();
    c.clearRect(0, 0, W, H);
    c.beginPath(); c.arc(W / 2, H / 2, W / 2 - 2, 0, Math.PI * 2); c.clip();
    c.fillStyle = "#e6dcc6"; c.fillRect(0, 0, W, H);
    c.translate(W / 2, H / 2);
    c.rotate(-rot);
    c.scale(scale, scale);
    c.drawImage(this.base, -(p.x + 450), -(450 - p.z));
    const T = (x: number, z: number) => [x - p.x, -(z - p.z)] as const;
    // GPS route
    const gps = g.ui.gps;
    if (gps && gps.length >= 4) {
      c.strokeStyle = "#7b3fe4"; c.lineWidth = 4 / scale * 1.4; c.lineJoin = "round";
      c.beginPath();
      for (let i = 0; i < gps.length; i += 2) { const [x, y] = T(gps[i], gps[i + 1]); if (i === 0) c.moveTo(x, y); else c.lineTo(x, y); }
      c.stroke();
    }
    // search area (last known region), not exact police positions
    const pol = g.police;
    if (pol.tier > 0 && (pol.state === "Search" || pol.state === "Cooling")) {
      const [x, y] = T(pol.lkpX, pol.lkpZ);
      c.fillStyle = g.settings.colorblind ? "rgba(255,200,0,0.18)" : "rgba(220,60,60,0.12)";
      c.strokeStyle = g.settings.colorblind ? "rgba(255,200,0,0.7)" : "rgba(220,60,60,0.7)"; c.lineWidth = 2 / scale;
      c.beginPath(); c.arc(x, y, pol.searchR, 0, Math.PI * 2); c.fill(); c.setLineDash([6 / scale, 4 / scale]); c.stroke(); c.setLineDash([]);
    }
    // visible police only during pursuit
    if (pol.state === "Pursuit") for (const v of g.vehicles) if (v.role === "police" && Math.hypot(v.x - p.x, v.z - p.z) < 120) {
      const [x, y] = T(v.x, v.z); c.fillStyle = Math.floor(g.time * 2) % 2 ? "#d33" : "#36f"; c.beginPath(); c.arc(x, y, 4 / scale * 1.5, 0, Math.PI * 2); c.fill();
    }
    // markers
    for (const m of g.ui.markers) {
      const [x, y] = T(m.x, m.z);
      if (m.kind === "area") { c.fillStyle = "rgba(255,190,40,0.2)"; c.strokeStyle = "rgba(230,150,20,0.8)"; c.lineWidth = 2 / scale; c.beginPath(); c.arc(x, y, m.r, 0, Math.PI * 2); c.fill(); c.stroke(); continue; }
      this.pin(c, x, y, scale, "#f5a623", W);
    }
    if (g.ui.waypoint) { const [x, y] = T(g.ui.waypoint.x, g.ui.waypoint.z); this.pin(c, x, y, scale, "#7b3fe4", W); }
    // contacts / shops when idle
    if (!g.mission) for (const it of g.d.interacts) {
      if (it.kind !== "contact" && it.kind !== "shop" && it.kind !== "rest" && it.kind !== "kiosk" && it.kind !== "repair") continue;
      const [x, y] = T(it.x, it.z);
      c.fillStyle = it.kind === "contact" ? "#e94f37" : it.kind === "rest" ? "#2a9d8f" : "#264653";
      c.beginPath(); c.arc(x, y, 5 / scale, 0, Math.PI * 2); c.fill();
    }
    c.restore();
    // player arrow (center)
    c.save();
    c.translate(W / 2, H / 2);
    const py = g.player.vehicle ? g.player.vehicle.yaw : g.player.yaw;
    c.rotate(py - rot);
    c.fillStyle = "#0b6e75"; c.strokeStyle = "#fff"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, -9); c.lineTo(6, 7); c.lineTo(0, 3); c.lineTo(-6, 7); c.closePath(); c.fill(); c.stroke();
    c.restore();
    // north indicator
    c.save(); c.translate(W / 2, H / 2); c.rotate(-rot); c.fillStyle = "#333"; c.font = "bold 12px Bahnschrift, sans-serif"; c.textAlign = "center"; c.fillText("N", 0, -W / 2 + 14); c.restore();
  }

  private pin(c: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string, W: number) {
    // clamp to minimap edge
    const R = (W / 2 - 12) / scale;
    const d = Math.hypot(x, y);
    if (d > R) { x = (x / d) * R; y = (y / d) * R; }
    c.fillStyle = color; c.strokeStyle = "#fff"; c.lineWidth = 2 / scale;
    c.beginPath(); c.arc(x, y, 6 / scale, 0, Math.PI * 2); c.fill(); c.stroke();
  }
}
