// In-game HUD (DOM): shift clock, fare panel, score, Pulse + callouts, Tailwind/speed, minimap,
// delivery breakdown, subtitles, toasts, off-screen edge indicators, speed lines, lesson panel.

import type { GameEvent, Session } from "../sim/session/session";
import { ARCHETYPES, PREF_INFO } from "../sim/fares/archetypes";
import { TIER_INFO } from "../sim/score/score";
import type { Renderer } from "../render/renderer";
import type { Settings } from "../persist/store";
import { MapRenderer } from "./minimap";
import { keyLabel } from "../input/input";

const el = (tag: string, cls = "", html = "") => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
};

export function shapeSvg(shape: string, color: string, size = 18): string {
  const s = size;
  const p = shape === "circle" ? `<circle cx="9" cy="9" r="7"/>` :
    shape === "diamond" ? `<polygon points="9,1 17,9 9,17 1,9"/>` :
    shape === "star" ? `<polygon points="9,0.5 11.3,6.3 17.5,6.6 12.6,10.5 14.3,16.6 9,13.2 3.7,16.6 5.4,10.5 0.5,6.6 6.7,6.3"/>` :
    `<polygon points="9,1 16,5 16,13 9,17 2,13 2,5"/>`;
  return `<svg class="shape" viewBox="0 0 18 18" width="${s}" height="${s}" fill="${color}" stroke="#0b0f17" stroke-width="1.5">${p}</svg>`;
}

export function fmtTime(t: number): string {
  t = Math.max(0, t);
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return m > 0 ? `${m}:${s.toFixed(0).padStart(2, "0")}` : s.toFixed(1);
}

export class Hud {
  root: HTMLElement;
  private clockT: HTMLElement;
  private clockL: HTMLElement;
  private award: HTMLElement;
  private fare: HTMLElement;
  private scoreV: HTMLElement;
  private tips: HTMLElement;
  private best: HTMLElement;
  private mult: HTMLElement;
  private chain: HTMLElement;
  private tier: HTMLElement;
  private callouts: HTMLElement;
  private spd: HTMLElement;
  private meter: HTMLElement;
  private meterFill: HTMLElement;
  private tlbl: HTMLElement;
  private extra: HTMLElement;
  private mini: HTMLCanvasElement;
  private miniWrap: HTMLElement;
  private center: HTMLElement;
  private toastEl: HTMLElement;
  private countdown: HTMLElement;
  private subtitle: HTMLElement;
  private edges: HTMLElement;
  private tags: HTMLElement;
  private lines: HTMLCanvasElement;
  private lesson: HTMLElement;
  private hint: HTMLElement;
  private mapView: HTMLElement;
  private mapCanvas: HTMLCanvasElement;
  map: MapRenderer;
  mapOpen = false;
  private toastT = 0;
  private subT = 0;
  private centerT = 0;
  private cdT = 0;
  private lastMult = 1;
  private shownScore = 0;
  bestScore = 0;
  discovered = new Set<string>();

  constructor(parent: HTMLElement, private renderer: Renderer, world: import("../sim/world/city").World, private settings: () => Settings) {
    this.map = new MapRenderer(world);
    const r = (this.root = el("div", "hud hidden"));
    this.lines = el("canvas", "speedlines") as HTMLCanvasElement;
    r.appendChild(this.lines);
    this.tags = el("div");
    r.appendChild(this.tags);
    this.edges = el("div");
    r.appendChild(this.edges);
    const clock = el("div", "clock");
    this.clockL = el("div", "lbl chunky", "SHIFT CLOCK");
    this.clockT = el("div", "t chunky", "60.0");
    this.award = el("div", "award chunky", "+0");
    clock.append(this.clockL, this.clockT, this.award);
    r.appendChild(clock);
    this.fare = el("div", "farepanel");
    r.appendChild(this.fare);
    this.lesson = el("div", "lesson");
    this.lesson.style.display = "none";
    r.appendChild(this.lesson);
    const score = el("div", "score");
    score.append(el("div", "s chunky", "FARES"));
    this.scoreV = el("div", "v chunky", "0");
    this.tips = el("div", "tips chunky", "");
    this.best = el("div", "best", "");
    score.append(this.scoreV, this.tips, this.best);
    r.appendChild(score);
    const pulse = el("div", "pulse");
    pulse.append(el("div", "lbl chunky", "PULSE"));
    this.mult = el("div", "mult chunky", "1×");
    const cb = el("div", "chainbar");
    this.chain = el("i");
    cb.appendChild(this.chain);
    const tb = el("div", "tierbar");
    this.tier = el("i");
    tb.appendChild(this.tier);
    this.callouts = el("div", "callouts");
    pulse.append(this.mult, cb, tb, this.callouts);
    r.appendChild(pulse);
    const tw = el("div", "tailwind");
    this.spd = el("div", "spd chunky", "0<small> KM/H</small>");
    this.meter = el("div", "meter");
    this.meterFill = el("i");
    this.meter.appendChild(this.meterFill);
    this.tlbl = el("div", "tlbl chunky", "TAILWIND");
    this.extra = el("div", "extra", "");
    tw.append(this.spd, this.meter, this.tlbl, this.extra);
    r.appendChild(tw);
    this.miniWrap = el("div", "minimap");
    this.mini = el("canvas") as HTMLCanvasElement;
    this.mini.width = 300;
    this.mini.height = 300;
    this.miniWrap.appendChild(this.mini);
    r.appendChild(this.miniWrap);
    this.center = el("div", "overlay-center");
    r.appendChild(this.center);
    this.toastEl = el("div", "toast");
    r.appendChild(this.toastEl);
    this.countdown = el("div", "countdown");
    r.appendChild(this.countdown);
    this.subtitle = el("div", "subtitle");
    r.appendChild(this.subtitle);
    this.hint = el("div", "keyhint");
    r.appendChild(this.hint);
    this.mapView = el("div", "mapview");
    this.mapView.style.display = "none";
    this.mapCanvas = el("canvas") as HTMLCanvasElement;
    this.mapView.appendChild(this.mapCanvas);
    r.appendChild(this.mapView);
    parent.appendChild(r);
  }

  show(on: boolean) {
    this.root.classList.toggle("hidden", !on);
    if (!on) { this.mapOpen = false; this.mapView.style.display = "none"; }
  }

  reset(s: Session) {
    this.callouts.innerHTML = "";
    this.center.innerHTML = "";
    this.shownScore = 0;
    this.toastT = this.subT = this.centerT = 0;
    this.toastEl.classList.remove("show");
    this.subtitle.classList.remove("show");
    this.countdown.textContent = "";
    this.lastMult = 1;
    this.clockL.textContent = s.cfg.mode === "trial" ? "TRIAL TIME" : s.cfg.mode === "school" ? "SKILL SCHOOL" : s.cfg.mode === "quick" ? "QUICK SHIFT" : "SHIFT CLOCK";
    const b = this.settings().bindings;
    this.hint.innerHTML = `<kbd>${keyLabel(b.handbrake[0])}</kbd> drift · <kbd>${keyLabel(b.boost[0])}</kbd> Tailwind · <kbd>${keyLabel(b.map[0])}</kbd> map · <kbd>${keyLabel(b.camera[0])}</kbd> camera · <kbd>Esc</kbd> pause`;
    if (s.lesson) {
      this.lesson.style.display = "block";
      this.lesson.innerHTML = `<div class="h">Lesson ${s.lesson.id + 1}: ${s.lesson.name}</div><div class="b">${s.lesson.brief}</div><div class="how">${s.lesson.how}</div><div class="msg"></div>`;
    } else this.lesson.style.display = "none";
  }

  toggleMap() {
    this.mapOpen = !this.mapOpen;
    this.mapView.style.display = this.mapOpen ? "block" : "none";
  }

  toast(text: string, cls = "", t = 2) {
    this.toastEl.textContent = text;
    this.toastEl.className = `toast show ${cls}`;
    this.toastT = t;
  }

  private callout(html: string, cls = "") {
    const c = el("div", `callout ${cls}`, html);
    this.callouts.prepend(c);
    while (this.callouts.children.length > 5) this.callouts.lastChild?.remove();
    setTimeout(() => c.classList.add("fade"), 1600);
    setTimeout(() => c.remove(), 2100);
  }

  events(evs: GameEvent[], s: Session) {
    for (const e of evs) {
      switch (e.type) {
        case "countdown": this.countdown.className = "countdown"; this.countdown.textContent = String(e.n); this.cdT = 0.7; break;
        case "go": this.countdown.className = "countdown go"; this.countdown.textContent = "GO!"; this.cdT = 0.8; break;
        case "style": this.callout(`${e.label} <b>+${e.points}</b>${e.mult > 1 ? ` <small>×${e.mult}</small>` : ""}`); break;
        case "tierUp": this.callout(`PULSE ${e.mult}×!`, "bank"); break;
        case "chainDrop": this.callout(e.reset ? "CHAIN BROKEN" : "PULSE DOWN", "drop"); break;
        case "pickup": {
          const a = ARCHETYPES[e.fare.archetype];
          this.toast(`${a.name} hops in${e.clean ? " · Clean stop!" : ""}`, "", 1.6);
          break;
        }
        case "deliver": {
          const b = e.breakdown;
          const rows = [["Base fare", b.base], ["Time bonus", b.time], ["Style tips", b.tips], ["Accuracy", b.accuracy]];
          if (b.discovery) rows.push(["Discovery", b.discovery]);
          if (b.preference) rows.push(["Passenger bonus", b.preference]);
          this.center.innerHTML = `<div class="grade ${e.grade}">${e.grade.toUpperCase()}!</div>${e.special ? `<div class="chunky" style="color:var(--cyan);font-size:20px">VIP CONDITION MET ×1.6</div>` : ""}
            <div class="breakdown">${rows.map(([k, n]) => `<span class="k">${k}</span><span class="n">${n}</span>`).join("")}<span class="k tot">Total</span><span class="n tot">${b.total}</span></div>`;
          this.centerT = 2.4;
          if (e.timeAward > 0) {
            this.award.textContent = `+${e.timeAward}s`;
            this.award.classList.remove("show");
            void this.award.offsetWidth;
            this.award.classList.add("show");
          }
          break;
        }
        case "fareFail":
          this.center.innerHTML = `<div class="grade Failed">FARE LOST</div><div class="breakdown"><span class="k">${ARCHETYPES[e.fare.archetype].name} bailed out</span><span class="n"></span></div>`;
          this.centerT = 2;
          break;
        case "shortcut": this.toast(e.first ? `NEW SHORTCUT: ${e.name}!` : e.name, "find", 2.2); break;
        case "item": this.toast(e.kind === "token" ? "Tailwind token +" : e.kind === "spark" ? "Clock spark +1s" : "Repair arch: handling restored", "find", 1.4); break;
        case "reset": this.toast(e.penalty ? `Reset  −${e.penalty}s` : "Reset", "", 1.4); break;
        case "pedPenalty": this.toast("Careful! Pedestrian  −150", "", 1.4); break;
        case "splash": this.toast("SPLASH!", "", 1.2); break;
        case "bark":
          if (this.settings().subtitles) {
            this.subtitle.innerHTML = `<b>${ARCHETYPES[e.archetype].name}:</b> ${e.text}`;
            this.subtitle.classList.add("show");
            this.subT = 2.6;
          }
          break;
        case "lessonDone": this.toast("LESSON COMPLETE!", "find", 2.5); break;
      }
    }
    void s;
  }

  update(dt: number, s: Session, fps: number) {
    const set = this.settings();
    document.documentElement.style.setProperty("--hud-scale", String(set.hudScale));
    // timers
    if (this.toastT > 0 && (this.toastT -= dt) <= 0) this.toastEl.classList.remove("show");
    if (this.subT > 0 && (this.subT -= dt) <= 0) this.subtitle.classList.remove("show");
    if (this.centerT > 0 && (this.centerT -= dt) <= 0) this.center.innerHTML = "";
    if (this.cdT > 0 && (this.cdT -= dt) <= 0) this.countdown.textContent = "";

    // clock
    if (s.cfg.mode === "trial") this.clockT.textContent = fmtTime(s.trialTime);
    else if (s.cfg.mode === "school") this.clockT.textContent = s.lesson ? `${s.lesson.id + 1}/10` : "";
    else this.clockT.textContent = fmtTime(s.clock);
    this.clockT.classList.toggle("low", s.usesClock && s.clock < 10 && s.phase === "play");

    // score (rolling counter)
    const target = Math.round(s.score);
    this.shownScore += (target - this.shownScore) * Math.min(1, dt * 8);
    if (Math.abs(target - this.shownScore) < 2) this.shownScore = target;
    this.scoreV.textContent = Math.round(this.shownScore).toLocaleString("en-US");
    this.tips.textContent = s.active ? `+${Math.round(s.active.tips).toLocaleString("en-US")} tips riding` : "";
    this.best.textContent = this.bestScore > 0 && s.usesClock ? `Best ${this.bestScore.toLocaleString("en-US")}` : s.cfg.mode === "trial" && s.medals ? `Gold ${fmtTime(s.medals.gold)} · Silver ${fmtTime(s.medals.silver)} · Bronze ${fmtTime(s.medals.bronze)}` : "";

    // fare panel
    if (s.active) {
      const f = s.active.fare;
      const info = TIER_INFO[f.tier];
      const a = ARCHETYPES[f.archetype];
      const frac = Math.max(0, s.active.patience / f.par);
      const d = Math.hypot(f.dest.x - s.v.x, f.dest.z - s.v.z);
      const cls = frac < 0.1 ? "bad" : frac < 0.25 ? "warn" : "";
      this.fare.className = "farepanel show";
      this.fare.innerHTML = `<div class="row">${shapeSvg(info.shape, info.color)}<span class="dest">${f.dest.name}</span><span class="meta" style="margin-left:auto">${Math.round(d)} m</span></div>
        <div class="bar ${cls}"><i style="width:${(frac * 100).toFixed(1)}%"></i></div>
        <div class="row" style="margin-top:4px"><span class="who">${a.name} · ${PREF_INFO[a.pref].label}</span><span class="meta" style="margin-left:auto">${s.active.patience > 0 ? `${s.active.patience.toFixed(1)}s / par ${f.par}s` : `LATE ${(-s.active.patience).toFixed(1)}s`}</span></div>
        <div class="meta">${f.special ? `<span style="color:var(--cyan)">${s.specialLabel(f)}</span> · ` : ""}${PREF_INFO[a.pref].hint}</div>`;
    } else if (!s.lesson || s.lesson.goal.kind === "fare") {
      this.fare.className = "farepanel show";
      const n = s.fares.candidates.length;
      this.fare.innerHTML = `<div class="row"><span class="dest">${s.cfg.mode === "trial" ? `Fare ${s.trialIndex + 1} of 3` : "Pick a fare"}</span><span class="meta" style="margin-left:auto">${n} waiting</span></div>
        <div class="meta">${shapeSvg("circle", TIER_INFO.short.color, 13)} short &nbsp; ${shapeSvg("diamond", TIER_INFO.medium.color, 13)} cross-town &nbsp; ${shapeSvg("star", TIER_INFO.long.color, 13)} long haul &nbsp; ${shapeSvg("hexagon", TIER_INFO.special.color, 13)} VIP · stop in the ring</div>`;
    } else this.fare.className = "farepanel";
    if (s.lesson) {
      const m = this.lesson.querySelector(".msg");
      if (m) m.textContent = s.lessonMsg;
    }

    // pulse
    const mult = s.pulse.mult;
    this.mult.textContent = `${mult}×`;
    this.mult.className = `mult chunky t${s.pulse.tier}`;
    if (mult > this.lastMult) { this.mult.classList.add("bump"); }
    this.lastMult = mult;
    this.chain.style.width = `${s.pulse.timerFrac * 100}%`;
    this.tier.style.width = `${s.pulse.tierProgress * 100}%`;

    // tailwind + speed
    this.spd.innerHTML = `${Math.round(s.kmh)}<small> KM/H</small>`;
    this.meterFill.style.width = `${s.tailwind.meter * 100}%`;
    this.meter.className = `meter ${s.tailwind.ready ? "ready" : ""} ${s.tailwind.active ? "active" : ""}`;
    this.tlbl.className = `tlbl chunky ${s.tailwind.ready ? "ready" : ""}`;
    this.tlbl.textContent = s.tailwind.active ? "TAILWIND!" : s.tailwind.ready ? `TAILWIND READY · ${keyLabel(set.bindings.boost[0])}` : "TAILWIND";
    const extras: string[] = [];
    if (s.oncomingActive) extras.push("RUSH LANE!");
    if (s.v.drifting) extras.push("SLIDING");
    if (s.cleanProgress > 0.15) extras.push(`Clean sector ${Math.round(s.cleanProgress * 100)}%`);
    if (s.v.damage > 0.6) extras.push("Damaged: find a repair arch");
    if (s.canReset) extras.push(`Stuck? Hold ${keyLabel(set.bindings.reset[0])}`);
    if (s.grace > 0) extras.push("GRACE! STOP IN THE RING!");
    this.extra.textContent = extras.join(" · ");
    void fps;

    // minimap
    this.miniWrap.style.display = set.minimap ? "block" : "none";
    if (set.minimap) this.map.drawMini(this.mini, s, set.colorblind);
    if (this.mapOpen) {
      const r = this.mapView.getBoundingClientRect();
      if (this.mapCanvas.width !== Math.round(r.width)) { this.mapCanvas.width = Math.round(r.width); this.mapCanvas.height = Math.round(r.height); }
      this.map.drawFull(this.mapCanvas, s, this.discovered);
    }

    this.updateMarkers(s);
    this.speedLines(s, set);
  }

  private edgePool: HTMLElement[] = [];
  private tagPool: HTMLElement[] = [];
  private updateMarkers(s: Session) {
    const items: { x: number; y: number; z: number; color: string; shape: string; label: string }[] = [];
    if (s.active) {
      const d = s.active.fare.dest;
      items.push({ x: d.x, y: s.world.heightAt(d.x, d.z) + 4, z: d.z, color: TIER_INFO[s.active.fare.tier].color, shape: "dest", label: d.name });
    } else if (!s.lesson || s.lesson.goal.kind === "fare") {
      for (const f of s.fares.candidates) {
        const info = TIER_INFO[f.tier];
        items.push({ x: f.pickup.px, y: s.world.heightAt(f.pickup.px, f.pickup.pz) + 5.6, z: f.pickup.pz, color: info.color, shape: info.shape, label: `${f.dest.name} · ${f.par}s` });
      }
    } else if (s.target) {
      items.push({ x: s.target.x, y: s.world.heightAt(s.target.x, s.target.z) + 2, z: s.target.z, color: "#ffffff", shape: "dest", label: "Target" });
    }
    const rect = this.root.getBoundingClientRect();
    const W = rect.width, H = rect.height;
    let ei = 0, ti = 0;
    for (const it of items) {
      const p = this.renderer.project(it.x, it.y, it.z);
      if (!p) continue;
      const dist = Math.hypot(it.x - s.v.x, it.z - s.v.z);
      if (p.onScreen) {
        if (dist > 600) continue;
        let t = this.tagPool[ti];
        if (!t) { t = el("div", "tag"); this.tags.appendChild(t); this.tagPool.push(t); }
        t.style.display = "block";
        t.style.left = `${p.x}px`;
        t.style.top = `${p.y}px`;
        t.style.opacity = dist < 25 ? "0.35" : "1";
        t.innerHTML = `<div class="tn" style="color:${it.color}">${it.label}</div>${Math.round(dist)} m`;
        ti++;
      } else {
        let e = this.edgePool[ei];
        if (!e) { e = el("div", "edge"); this.edges.appendChild(e); this.edgePool.push(e); }
        const cx = W / 2, cy = H / 2;
        let dx = p.x - cx, dy = p.y - cy;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) dy = 1;
        const k = Math.min((W / 2 - 40) / Math.abs(dx || 1e-3), (H / 2 - 40) / Math.abs(dy || 1e-3));
        dx *= k; dy *= k;
        const ang = Math.atan2(dy, dx) * 57.3 + 90;
        e.style.display = "block";
        e.style.left = `${cx + dx}px`;
        e.style.top = `${cy + dy}px`;
        e.innerHTML = `<svg viewBox="0 0 34 34" style="transform:rotate(${ang}deg)"><polygon points="17,2 31,30 17,23 3,30" fill="${it.color}" stroke="#0b0f17" stroke-width="2"/></svg><div class="d">${Math.round(dist)} m</div>`;
        ei++;
      }
    }
    for (let i = ei; i < this.edgePool.length; i++) this.edgePool[i].style.display = "none";
    for (let i = ti; i < this.tagPool.length; i++) this.tagPool[i].style.display = "none";
  }

  private speedLines(s: Session, set: Settings) {
    const c = this.lines;
    const W = window.innerWidth, H = window.innerHeight;
    if (c.width !== W) { c.width = W; c.height = H; }
    const g = c.getContext("2d")!;
    g.clearRect(0, 0, W, H);
    if (set.reducedMotion) return;
    const sp = s.kmh;
    const k = Math.max(0, (sp - 90) / 90) + (s.v.boosting ? 0.6 : 0);
    if (k <= 0) return;
    g.strokeStyle = s.v.boosting ? "rgba(140,255,255,0.35)" : "rgba(255,255,255,0.22)";
    g.lineWidth = 2;
    const n = Math.round(26 * Math.min(1.5, k));
    const t = performance.now() / 1000;
    for (let i = 0; i < n; i++) {
      const a = ((i * 137.5 + Math.floor(t * 12 + i) * 31) % 360) * (Math.PI / 180);
      const r0 = Math.min(W, H) * (0.42 + ((i * 53) % 20) / 100);
      const r1 = r0 + 60 + k * 120;
      g.beginPath();
      g.moveTo(W / 2 + Math.cos(a) * r0, H / 2 + Math.sin(a) * r0);
      g.lineTo(W / 2 + Math.cos(a) * r1, H / 2 + Math.sin(a) * r1);
      g.stroke();
    }
  }
}
