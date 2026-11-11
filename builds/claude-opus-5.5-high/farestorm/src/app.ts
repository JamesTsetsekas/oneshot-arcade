// App shell: boot, menus, mode routing, game loop, pause/results, records and settings.

import { Color3, Mesh, StandardMaterial } from "@babylonjs/core";
import { getWorld, type World } from "./sim/world/city";
import { Session, type Mode, type Results } from "./sim/session/session";
import { FixedStepper } from "./sim/session/stepper";
import { autopilot } from "./sim/session/autopilot";
import { LESSONS } from "./sim/session/lessons";
import { TRIALS, buildTrialChain, trialMedals } from "./sim/fares/fares";
import { TAXIS, taxiById } from "./sim/vehicle/taxis";
import { NO_INPUT } from "./sim/vehicle/input";
import { RULES_VERSION } from "./sim/score/score";
import { Renderer } from "./render/renderer";
import { Geo, hex } from "./render/geo";
import { Hud, fmtTime } from "./ui/hud";
import { ACTION_LABEL, DEFAULT_BINDINGS, Input, keyLabel, type Action } from "./input/input";
import { AudioSys } from "./audio/audio";
import { Store, type Settings } from "./persist/store";

const LIVERIES: Record<string, { name: string; body: string; trim: string; accent: string; unlock: string; need: (s: Store) => boolean }[]> = Object.fromEntries(
  TAXIS.map((t) => [t.id, [
    { name: "Storm Classic", ...t.colors, unlock: "Default", need: () => true },
    { name: "Seafoam", body: "#7fe0c8", trim: "#fff4e0", accent: "#ff6a55", unlock: "Default", need: () => true },
    { name: "Sunset Coral", body: "#ff8a5c", trim: "#2b2d42", accent: "#ffd23f", unlock: "Finish 2 Skill School lessons", need: (s: Store) => s.data.lessons.length >= 2 },
    { name: "Neon Lantern", body: "#5f2eea", trim: "#ff3ec8", accent: "#3dfcff", unlock: "Finish 5 lessons", need: (s: Store) => s.data.lessons.length >= 5 },
    { name: "Gilded Tide", body: "#f2e2b8", trim: "#1d2b44", accent: "#c9a227", unlock: "Finish all 10 lessons", need: (s: Store) => s.data.lessons.length >= 10 },
    { name: "Medal Chrome", body: "#c9d3da", trim: "#ff3fb4", accent: "#1d2b44", unlock: "Earn any Time Trial gold", need: (s: Store) => Object.values(s.data.trials).some((r) => r.medal === "gold") },
  ]]),
);

type ScreenFn = () => HTMLElement;

export class App {
  world: World;
  store = new Store();
  input!: Input;
  audio!: AudioSys;
  renderer!: Renderer;
  hud!: Hud;
  session: Session | null = null;
  stepper = new FixedStepper();
  paused = false;
  autodrive = false;
  private ui: HTMLElement;
  private screenEl: HTMLElement | null = null;
  private screenStack: ScreenFn[] = [];
  private last = performance.now();
  private endTimer = -1;
  private sel = { mode: "arcade" as Mode, trial: 0, lesson: 0 };
  private ghostMesh: Mesh | null = null;
  private ghostData: number[] | null = null;
  private lastResults: Results | null = null;
  private notice = "";
  private ctxOverlay: HTMLElement | null = null;

  constructor(private canvas: HTMLCanvasElement, ui: HTMLElement) {
    this.ui = ui;
    this.world = getWorld();
  }

  get settings(): Settings {
    return this.store.data.settings;
  }

  async boot() {
    await this.store.load();
    if (this.store.repaired) this.notice = "Some saved data was unreadable and has been repaired.";
    if (this.store.backend === "memory") this.notice = "Saving is unavailable in this browser session; progress will not persist.";
    this.input = new Input({ bindings: this.settings.bindings, deadzone: this.settings.deadzone, vibration: this.settings.vibration, steerSensitivity: this.settings.steerSensitivity });
    this.audio = new AudioSys(this.settings);
    this.renderer = new Renderer(this.canvas, this.world, this.renderSettings());
    this.hud = new Hud(this.ui, this.renderer, this.world, () => this.settings);
    this.hud.discovered = new Set(this.store.data.discovered);
    this.input.onGamepadChange = (connected) => {
      if (!connected && this.session && !this.paused && this.session.phase !== "done") {
        this.pause();
        this.hud.toast("Gamepad disconnected - paused", "", 2.5);
      }
    };
    const unlock = () => this.audio.unlock();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    this.renderer.engine.onContextLostObservable.add(() => this.showContextLost(true));
    this.renderer.engine.onContextRestoredObservable.add(() => this.showContextLost(false));
    document.body.classList.toggle("reduced", this.settings.reducedMotion);

    const params = new URLSearchParams(location.search);
    if (params.get("autodrive")) {
      this.autodrive = true;
      this.startSession(params.get("mode") === "trial" ? "trial" : "arcade", { taxi: params.get("taxi") ?? undefined, seed: params.get("seed") ? Number(params.get("seed")) : undefined });
    } else {
      this.go(() => this.mainMenu(), true);
    }
    requestAnimationFrame((t) => this.frame(t));
  }

  private renderSettings() {
    const s = this.settings;
    return { quality: s.quality, dynamicRes: s.dynamicRes, shadows: s.shadows, bloom: s.bloom, shake: s.shake, reducedMotion: s.reducedMotion, photosensitive: s.photosensitive, fovScale: s.fovScale, colorblind: s.colorblind };
  }

  private applySettings() {
    const s = this.settings;
    this.input.settings = { bindings: s.bindings, deadzone: s.deadzone, vibration: s.vibration, steerSensitivity: s.steerSensitivity };
    this.audio.applySettings(s);
    this.renderer.applySettings(this.renderSettings());
    document.body.classList.toggle("reduced", s.reducedMotion);
    this.store.save();
  }

  private showContextLost(on: boolean) {
    if (on && !this.ctxOverlay) {
      this.ctxOverlay = document.createElement("div");
      this.ctxOverlay.className = "fatal";
      this.ctxOverlay.innerHTML = `<div class="box"><h1>Graphics paused</h1><p>The WebGL context was lost (driver reset or GPU pressure). Waiting for the browser to restore it...</p><button class="btn small interactive" id="reload">Reload game</button></div>`;
      document.body.appendChild(this.ctxOverlay);
      this.ctxOverlay.querySelector("#reload")!.addEventListener("click", () => location.reload());
      if (this.session) this.pause();
    } else if (!on && this.ctxOverlay) {
      this.ctxOverlay.remove();
      this.ctxOverlay = null;
    }
  }

  // ------------------------------------------------------------------ loop
  private frame(now: number) {
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    this.input.poll();
    const s = this.session;
    if (s && !this.paused) {
      if (s.phase !== "done") {
        if (this.input.consume("pause")) this.pause();
        if (this.input.consume("camera")) { this.renderer.rig.cycle(); this.hud.toast(["Near chase", "Far chase", "Bumper"][this.renderer.rig.mode], "", 1); }
        if (this.input.consume("map")) this.hud.toggleMap();
      }
      if (!this.paused) {
        this.stepper.advance(dt, () => s.step(this.autodrive ? autopilot(s) : this.input.frame()));
        const evs = s.drain();
        this.renderer.handleEvents(evs);
        this.audio.events(evs);
        this.hud.events(evs, s);
        for (const e of evs) {
          if (e.type === "collision" && e.impact > 4) this.input.rumble(Math.min(1, e.impact / 15), 120);
          if (e.type === "end") this.endTimer = 1.4;
          if (e.type === "shortcut" && e.first) this.hud.discovered.add(e.id);
        }
      }
      if (this.endTimer > 0) {
        this.endTimer -= dt;
        if (this.endTimer <= 0) this.showResults();
      }
      this.updateGhost(s);
    } else if (s && this.paused) {
      if (this.input.consume("pause")) {
        if (this.screenStack.length <= 1) this.resume();
        else this.back();
      }
    }
    this.renderer.render(dt, s && !this.paused ? this.stepper.alpha : 1, this.input.cam());
    if (s) this.hud.update(dt, s, this.renderer.fps);
    this.audio.update(s && s.phase !== "done" ? s : null, this.paused);
    this.menuNav();
    this.input.endFrame();
    requestAnimationFrame((t) => this.frame(t));
  }

  private menuNav() {
    if (!this.screenEl) return;
    const nav = this.input.menuNav();
    const focusables = [...this.screenEl.querySelectorAll<HTMLElement>("button:not(:disabled), .card, input")];
    if (focusables.length === 0) return;
    const idx = focusables.indexOf(document.activeElement as HTMLElement);
    if (nav.down || nav.right) {
      const n = focusables[(idx + 1 + focusables.length) % focusables.length];
      n.focus();
      this.audio.ui("move");
    } else if (nav.up || nav.left) {
      const n = focusables[(idx - 1 + focusables.length) % focusables.length];
      n.focus();
      this.audio.ui("move");
    }
    if (nav.ok && document.activeElement instanceof HTMLElement && this.screenEl.contains(document.activeElement)) document.activeElement.click();
    if (nav.back || (this.input.consumeCode("Escape") && !this.session) || (this.input.consumeCode("Backspace") && !(document.activeElement instanceof HTMLInputElement))) this.back();
  }

  // ------------------------------------------------------------------ screens
  private go(fn: ScreenFn, replace = false) {
    if (replace) this.screenStack = [];
    this.screenStack.push(fn);
    this.render();
  }
  private back() {
    if (this.screenStack.length > 1) {
      this.audio.ui("back");
      this.screenStack.pop();
      this.render();
    } else if (this.session && this.paused) this.resume();
  }
  private render() {
    this.screenEl?.remove();
    const fn = this.screenStack[this.screenStack.length - 1];
    if (!fn) { this.screenEl = null; return; }
    this.screenEl = fn();
    this.ui.appendChild(this.screenEl);
    const first = this.screenEl.querySelector<HTMLElement>(".btn.primary, .card.sel, .btn");
    first?.focus({ preventScroll: true });
  }
  private closeScreens() {
    this.screenEl?.remove();
    this.screenEl = null;
    this.screenStack = [];
  }

  private btn(label: string, sub: string, onClick: () => void, cls = ""): HTMLButtonElement {
    const b = document.createElement("button");
    b.className = `btn ${cls}`;
    b.innerHTML = `${label}${sub ? `<small>${sub}</small>` : ""}`;
    b.addEventListener("click", () => { this.audio.unlock(); this.audio.ui("ok"); onClick(); });
    return b;
  }

  private mainMenu(): HTMLElement {
    const sc = document.createElement("div");
    sc.className = "screen clear";
    const m = document.createElement("div");
    m.className = "menu left";
    m.innerHTML = `<div class="logo">FARESTORM</div><div class="tagline">GALEPORT STORM CAB CO. · EST. TODAY</div>`;
    const best = this.store.data.best.arcade;
    m.append(
      this.btn("Arcade Shift", `60 seconds on the clock. Deliver to earn more.${best ? ` Best ${best.score.toLocaleString("en-US")} (${best.rank})` : ""}`, () => { this.sel.mode = "arcade"; this.go(() => this.taxiSelect()); }, "primary"),
      this.btn("Quick Shift", "Fixed 5 minutes, no time extensions.", () => { this.sel.mode = "quick"; this.go(() => this.taxiSelect()); }),
      this.btn("Time Trial", "Six fixed fare chains. Chase medals and your ghost.", () => this.go(() => this.trialList())),
      this.btn("Skill School", `10 short lessons · ${this.store.data.lessons.length}/10 done`, () => this.go(() => this.schoolList())),
      this.btn("Garage", "Pick your default cab and livery.", () => this.go(() => this.taxiSelect(true))),
      this.btn("Records", "Best scores, medals, shortcuts found.", () => this.go(() => this.records())),
      this.btn("Settings", "Audio, graphics, controls, accessibility.", () => this.go(() => this.settingsScreen())),
      this.btn("Credits", "", () => this.go(() => this.credits())),
    );
    const foot = document.createElement("div");
    foot.className = "foot";
    foot.innerHTML = `${this.notice ? `<div style="color:var(--sun)">${this.notice}</div>` : ""}Keyboard: <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> drive · <kbd>Space</kbd> drift · <kbd>Shift</kbd> Tailwind · Gamepad supported · Menus: arrows + Enter`;
    m.appendChild(foot);
    sc.appendChild(m);
    return sc;
  }

  private taxiSelect(garageOnly = false): HTMLElement {
    const sc = document.createElement("div");
    sc.className = "screen dim";
    const m = document.createElement("div");
    m.className = "menu";
    const title = garageOnly ? "Garage" : this.sel.mode === "trial" ? `Time Trial: ${TRIALS[this.sel.trial].name}` : this.sel.mode === "quick" ? "Quick Shift" : "Arcade Shift";
    m.innerHTML = `<div class="h2">${title}</div>`;
    const g = this.store.data.garage;
    const cards = document.createElement("div");
    cards.className = "cards";
    const stat = (label: string, frac: number, num: string) => `<div class="statrow"><span>${label}</span><div class="bar"><i style="width:${Math.round(frac * 100)}%"></i></div><span class="num">${num}</span></div>`;
    for (const t of TAXIS) {
      const c = document.createElement("button");
      c.className = `card ${g.taxi === t.id ? "sel" : ""}`;
      const lv = LIVERIES[t.id][g.livery[t.id] ?? 0];
      c.innerHTML = `<div class="name" style="color:${lv.body}">${t.name}</div><div class="desc">${t.tagline}</div>
        ${stat("Top speed", (t.top - 38) / 14, `${Math.round(t.top * 3.6)} km/h`)}
        ${stat("Acceleration", (t.accel - 4.8) / 2.2, `${t.id === "gull" ? "5.0" : t.id === "breaker" ? "5.3" : "5.9"} s`)}
        ${stat("Steering", (t.steerLat - 16.5) / 6, `${t.steerLat.toFixed(1)} m/s²`)}
        ${stat("Drift ease", 1 - (t.driftLat - 2.8) / 2.4, `${t.driftLat.toFixed(1)}`)}
        ${stat("Mass / shove", (t.mass - 900) / 1100, `${t.mass} kg`)}
        <div class="swatches"></div>`;
      const sw = c.querySelector(".swatches")!;
      LIVERIES[t.id].forEach((l, i) => {
        const s = document.createElement("span");
        const ok = l.need(this.store);
        s.className = `swatch ${(g.livery[t.id] ?? 0) === i ? "sel" : ""} ${ok ? "" : "locked"}`;
        s.style.background = `linear-gradient(135deg, ${l.body} 55%, ${l.accent} 55%)`;
        s.title = ok ? l.name : `${l.name} - ${l.unlock}`;
        s.addEventListener("click", (ev) => {
          ev.stopPropagation();
          if (!ok) { this.hud.toast(`Locked: ${l.unlock}`); return; }
          g.livery[t.id] = i;
          g.taxi = t.id;
          this.store.save();
          this.render();
        });
        sw.appendChild(s);
      });
      c.addEventListener("click", () => { g.taxi = t.id; this.store.save(); this.audio.ui("move"); this.render(); });
      cards.appendChild(c);
    }
    m.appendChild(cards);
    if (!garageOnly) {
      const opts = document.createElement("div");
      opts.style.marginTop = "14px";
      opts.appendChild(this.segRow("Traffic", ["low", "medium", "high"], this.settings.traffic, (v) => { this.settings.traffic = v as Settings["traffic"]; this.store.save(); }));
      opts.appendChild(this.segRow("Control preset", ["Standard", "One-button drift"], this.settings.driftAssist ? "One-button drift" : "Standard", (v) => { this.settings.driftAssist = v !== "Standard"; this.store.save(); }));
      const help = document.createElement("div");
      help.className = "foot";
      help.innerHTML = `<b>How to play:</b> pull into a fare's ring and stop. Follow the arrow (or your own shortcuts) to the destination beam and stop inside it before the passenger's patience runs out. Slides, close shaves, jumps, rush lanes and shortcuts build <b>Pulse</b> and charge <b>Tailwind</b>. Bumps cost Pulse.`;
      opts.appendChild(help);
      m.appendChild(opts);
    }
    const row = document.createElement("div");
    row.style.marginTop = "14px";
    if (!garageOnly) row.appendChild(this.btn("Start shift ▶", "", () => this.startSession(this.sel.mode, { trial: this.sel.trial }), "small primary"));
    row.appendChild(this.btn("Back", "", () => this.back(), "small"));
    m.appendChild(row);
    sc.appendChild(m);
    return sc;
  }

  private segRow(label: string, options: string[], current: string, onChange: (v: string) => void): HTMLElement {
    const r = document.createElement("div");
    r.className = "optrow";
    r.innerHTML = `<span class="lab">${label}</span>`;
    const seg = document.createElement("div");
    seg.className = "seg";
    for (const o of options) {
      const b = document.createElement("button");
      b.textContent = o;
      b.className = o === current ? "sel" : "";
      b.addEventListener("click", () => {
        seg.querySelectorAll("button").forEach((x) => x.classList.remove("sel"));
        b.classList.add("sel");
        this.audio.ui("move");
        onChange(o);
      });
      seg.appendChild(b);
    }
    r.appendChild(seg);
    return r;
  }

  private sliderRow(label: string, min: number, max: number, step: number, value: number, onChange: (v: number) => void, fmt = (v: number) => `${Math.round(v * 100)}%`): HTMLElement {
    const r = document.createElement("div");
    r.className = "optrow";
    r.innerHTML = `<span class="lab">${label}</span>`;
    const i = document.createElement("input");
    i.type = "range";
    i.min = String(min); i.max = String(max); i.step = String(step); i.value = String(value);
    const v = document.createElement("span");
    v.textContent = fmt(value);
    i.addEventListener("input", () => { v.textContent = fmt(+i.value); onChange(+i.value); });
    i.addEventListener("change", () => this.applySettings());
    r.append(i, v);
    return r;
  }

  private checkRow(label: string, value: boolean, onChange: (v: boolean) => void): HTMLElement {
    const r = document.createElement("label");
    r.className = "optrow";
    r.innerHTML = `<span class="lab">${label}</span>`;
    const i = document.createElement("input");
    i.type = "checkbox";
    i.checked = value;
    i.addEventListener("change", () => { onChange(i.checked); this.applySettings(); });
    r.appendChild(i);
    return r;
  }

  private trialList(): HTMLElement {
    const sc = document.createElement("div");
    sc.className = "screen dim";
    const m = document.createElement("div");
    m.className = "menu";
    m.innerHTML = `<div class="h2">Time Trial</div>`;
    const list = document.createElement("div");
    list.className = "list";
    for (const t of TRIALS) {
      const chain = buildTrialChain(this.world, t);
      const md = trialMedals(this.world, t, chain);
      const rec = this.store.data.trials[t.id];
      const c = document.createElement("button");
      c.className = "card";
      c.innerHTML = `<div class="name">${t.name}</div><div class="desc">${chain.map((f) => f.dest.name).join(" → ")}</div>
        <div><span class="medal gold"></span>${fmtTime(md.gold)} &nbsp; <span class="medal silver"></span>${fmtTime(md.silver)} &nbsp; <span class="medal bronze"></span>${fmtTime(md.bronze)}</div>
        <div style="margin-top:6px;font-weight:800">${rec ? `<span class="medal ${rec.medal ?? "none"}"></span>Best ${fmtTime(rec.time)}${rec.ghost ? " · ghost saved" : ""}` : "Not yet run"}</div>`;
      c.addEventListener("click", () => { this.sel.mode = "trial"; this.sel.trial = t.id; this.go(() => this.taxiSelect()); });
      list.appendChild(c);
    }
    m.appendChild(list);
    const row = document.createElement("div");
    row.style.marginTop = "14px";
    row.appendChild(this.btn("Back", "", () => this.back(), "small"));
    m.appendChild(row);
    sc.appendChild(m);
    return sc;
  }

  private schoolList(): HTMLElement {
    const sc = document.createElement("div");
    sc.className = "screen dim";
    const m = document.createElement("div");
    m.className = "menu";
    m.innerHTML = `<div class="h2">Skill School</div><div class="foot" style="margin:-6px 0 12px">Uses your Garage cab (${taxiById(this.store.data.garage.taxi).name}). Lessons unlock liveries.</div>`;
    const list = document.createElement("div");
    list.className = "list";
    for (const l of LESSONS) {
      const done = this.store.data.lessons.includes(l.id);
      const c = document.createElement("button");
      c.className = "card";
      c.innerHTML = `<div class="name">${l.id + 1}. ${l.name}${done ? '<span class="pill done">DONE</span>' : ""}</div><div class="desc">${l.brief}<br><span style="opacity:.8">${l.how}</span></div>`;
      c.addEventListener("click", () => { this.sel.lesson = l.id; this.startSession("school", { lesson: l.id }); });
      list.appendChild(c);
    }
    m.appendChild(list);
    const row = document.createElement("div");
    row.style.marginTop = "14px";
    row.appendChild(this.btn("Back", "", () => this.back(), "small"));
    m.appendChild(row);
    sc.appendChild(m);
    return sc;
  }

  private records(): HTMLElement {
    const sc = document.createElement("div");
    sc.className = "screen dim";
    const m = document.createElement("div");
    m.className = "menu";
    const d = this.store.data;
    const rec = (r?: { score: number; rank: string; deliveries: number; taxi: string; assists: boolean }) => (r ? `${r.score.toLocaleString("en-US")} · rank ${r.rank} · ${r.deliveries} fares · ${taxiById(r.taxi).name}${r.assists ? " · assist" : ""}` : "—");
    m.innerHTML = `<div class="h2">Records</div>
      <div class="settings-wrap"><div class="grid2"><div>
      <h3>Shifts</h3><div class="optrow"><span class="lab">Arcade Shift best</span><span>${rec(d.best.arcade)}</span></div>
      <div class="optrow"><span class="lab">Quick Shift best</span><span>${rec(d.best.quick)}</span></div>
      <div class="optrow"><span class="lab">Shifts driven</span><span>${d.totals.shifts}</span></div>
      <div class="optrow"><span class="lab">Passengers delivered</span><span>${d.totals.deliveries}</span></div>
      <h3>Time Trials</h3>${TRIALS.map((t) => `<div class="optrow"><span class="lab">${t.name}</span><span><span class="medal ${d.trials[t.id]?.medal ?? "none"}"></span>${d.trials[t.id] ? fmtTime(d.trials[t.id].time) : "—"}</span></div>`).join("")}
      <h3>Skill School</h3><div class="optrow"><span class="lab">Lessons</span><span>${d.lessons.length} / 10</span></div>
      </div><div><h3>Shortcuts discovered ${d.discovered.length} / ${this.world.shortcuts.length}</h3>
      ${this.world.shortcuts.map((s) => `<div class="optrow" style="margin:4px 0"><span class="lab" style="color:${d.discovered.includes(s.id) ? s.color : "#6c7890"}">${d.discovered.includes(s.id) ? s.name : "??? (" + s.district + ")"}</span><span style="opacity:.7">${d.discovered.includes(s.id) ? s.kind : ""}</span></div>`).join("")}
      </div></div><div class="foot">Records are stored locally in this browser (rules v${RULES_VERSION}). Online leaderboards are not part of this build.</div></div>`;
    const row = document.createElement("div");
    row.style.marginTop = "14px";
    row.appendChild(this.btn("Back", "", () => this.back(), "small"));
    m.appendChild(row);
    sc.appendChild(m);
    return sc;
  }

  private settingsScreen(): HTMLElement {
    const sc = document.createElement("div");
    sc.className = "screen dim";
    const m = document.createElement("div");
    m.className = "menu";
    m.innerHTML = `<div class="h2">Settings</div>`;
    const s = this.settings;
    const wrap = document.createElement("div");
    wrap.className = "settings-wrap";
    const grid = document.createElement("div");
    grid.className = "grid2";
    const col1 = document.createElement("div");
    const col2 = document.createElement("div");
    const h = (t: string) => { const e = document.createElement("h3"); e.textContent = t; return e; };
    col1.append(
      h("Audio"),
      this.sliderRow("Master", 0, 1, 0.05, s.master, (v) => { s.master = v; this.audio.applySettings(s); }),
      this.sliderRow("Music", 0, 1, 0.05, s.music, (v) => { s.music = v; this.audio.applySettings(s); }),
      this.sliderRow("Effects", 0, 1, 0.05, s.sfx, (v) => { s.sfx = v; this.audio.applySettings(s); }),
      this.sliderRow("Voices", 0, 1, 0.05, s.voice, (v) => { s.voice = v; this.audio.applySettings(s); }),
      h("Graphics"),
      this.segRow("Quality", ["low", "medium", "high"], s.quality, (v) => { s.quality = v as Settings["quality"]; this.applySettings(); }),
      this.checkRow("Dynamic resolution", s.dynamicRes, (v) => (s.dynamicRes = v)),
      this.checkRow("Shadows", s.shadows, (v) => (s.shadows = v)),
      this.checkRow("Bloom", s.bloom, (v) => (s.bloom = v)),
      this.segRow("Traffic density", ["low", "medium", "high"], s.traffic, (v) => { s.traffic = v as Settings["traffic"]; this.store.save(); }),
      this.sliderRow("Crowd density", 0, 1, 0.1, s.crowd, (v) => (s.crowd = v)),
      h("Camera & comfort"),
      this.sliderRow("Camera shake", 0, 1, 0.1, s.shake, (v) => (s.shake = v)),
      this.sliderRow("Field of view", 0.85, 1.15, 0.05, s.fovScale, (v) => (s.fovScale = v)),
      this.checkRow("Reduced motion", s.reducedMotion, (v) => (s.reducedMotion = v)),
      this.checkRow("Photosensitivity (no flashes)", s.photosensitive, (v) => (s.photosensitive = v)),
    );
    col2.append(
      h("Controls"),
      this.sliderRow("Steering sensitivity", 0.6, 1.4, 0.05, s.steerSensitivity, (v) => (s.steerSensitivity = v)),
      this.sliderRow("Keyboard steer speed", 3, 12, 0.5, s.steerSmoothing, (v) => (s.steerSmoothing = v), (v) => v.toFixed(1)),
      this.sliderRow("Gamepad dead zone", 0.02, 0.35, 0.01, s.deadzone, (v) => (s.deadzone = v)),
      this.checkRow("Vibration", s.vibration, (v) => (s.vibration = v)),
      this.checkRow("One-button drift preset", s.driftAssist, (v) => (s.driftAssist = v)),
      this.checkRow("Stability assist", s.stabilityAssist, (v) => (s.stabilityAssist = v)),
      this.segRow("Route arrow", ["road", "bearing"], s.guidance, (v) => { s.guidance = v as Settings["guidance"]; this.store.save(); }),
      h("Accessibility"),
      this.segRow("HUD scale", ["100%", "125%", "150%"], `${Math.round(s.hudScale * 100)}%`, (v) => { s.hudScale = parseInt(v) / 100; this.store.save(); }),
      this.checkRow("Subtitles", s.subtitles, (v) => (s.subtitles = v)),
      this.checkRow("Colorblind-safe fare colors", s.colorblind, (v) => (s.colorblind = v)),
      this.checkRow("Minimap", s.minimap, (v) => (s.minimap = v)),
      h("Key bindings"),
    );
    for (const a of Object.keys(ACTION_LABEL) as Action[]) {
      const r = document.createElement("div");
      r.className = "optrow";
      r.style.margin = "4px 0";
      r.innerHTML = `<span class="lab">${ACTION_LABEL[a]}</span>`;
      const b = document.createElement("button");
      b.className = "bindbtn";
      b.textContent = s.bindings[a].map(keyLabel).join(" / ");
      b.addEventListener("click", () => {
        b.classList.add("wait");
        b.textContent = "press a key";
        this.input.capturing = (code) => {
          if (code !== "Escape" || a === "pause") s.bindings[a] = [code, ...s.bindings[a].filter((k) => k !== code)].slice(0, 2);
          this.applySettings();
          this.render();
        };
      });
      r.appendChild(b);
      col2.appendChild(r);
    }
    const reset = this.btn("Reset bindings", "", () => { s.bindings = structuredClone(DEFAULT_BINDINGS); this.applySettings(); this.render(); }, "small");
    col2.appendChild(reset);
    grid.append(col1, col2);
    wrap.appendChild(grid);
    m.appendChild(wrap);
    const row = document.createElement("div");
    row.style.marginTop = "14px";
    row.appendChild(this.btn("Done", "", () => { this.applySettings(); this.back(); }, "small primary"));
    m.appendChild(row);
    sc.appendChild(m);
    return sc;
  }

  private credits(): HTMLElement {
    const sc = document.createElement("div");
    sc.className = "screen dim";
    const m = document.createElement("div");
    m.className = "menu credits";
    m.innerHTML = `<div class="h2">Credits</div>
      <p><b>Farestorm</b> is an original arcade taxi game set in the invented coastal city of Galeport. City layout, cabs, passengers, destinations, scoring names, music and sound are all original and generated procedurally in code.</p>
      <p>Built with <b>Babylon.js</b> (Apache-2.0) and TypeScript, bundled with Vite. All 3D models are built from code at load time; all textures are painted on canvas; all audio is synthesized live with the Web Audio API. No external assets, fonts, analytics or network services are used.</p>
      <p>Thanks for driving. Mind the gulls.</p>`;
    const row = document.createElement("div");
    row.appendChild(this.btn("Back", "", () => this.back(), "small"));
    m.appendChild(row);
    sc.appendChild(m);
    return sc;
  }

  // ------------------------------------------------------------------ session lifecycle
  startSession(mode: Mode, extra: { trial?: number; lesson?: number; taxi?: string; seed?: number } = {}) {
    this.closeScreens();
    const s0 = this.settings;
    const taxi = extra.taxi ?? this.store.data.garage.taxi;
    const seed = mode === "trial" ? TRIALS[extra.trial ?? 0].seed : extra.seed ?? (Date.now() & 0xffff) + 1;
    const session = new Session(this.world, {
      mode, taxi, seed, traffic: s0.traffic, crowd: s0.crowd, trial: extra.trial, lesson: extra.lesson,
      hub: mode === "arcade" || mode === "quick" ? seed % 3 : undefined,
      discovered: this.store.data.discovered,
      vehicle: { steerRate: s0.steerSmoothing, driftAssist: s0.driftAssist, stabilityAssist: s0.stabilityAssist },
      guidance: s0.guidance,
    });
    this.session = session;
    this.lastResults = null;
    this.paused = false;
    this.endTimer = -1;
    this.stepper = new FixedStepper();
    const lv = LIVERIES[taxi][this.store.data.garage.livery[taxi] ?? 0];
    this.renderer.setSession(session, { body: lv.body, trim: lv.trim, accent: lv.accent });
    this.hud.reset(session);
    this.hud.show(true);
    const best = mode === "arcade" || mode === "quick" ? this.store.data.best[mode] : undefined;
    this.hud.bestScore = best?.score ?? 0;
    this.audio.unlock();
    this.audio.startEngine(taxi);
    this.setupGhost(session);
  }

  private setupGhost(s: Session) {
    this.ghostMesh?.dispose();
    this.ghostMesh = null;
    this.ghostData = null;
    if (s.cfg.mode !== "trial") return;
    const rec = this.store.data.trials[s.cfg.trial ?? 0];
    if (!rec?.ghost || rec.ghost.length < 8) return;
    this.ghostData = rec.ghost;
    const g = new Geo();
    g.box(0, 0.7, 0, 1.9, 0.8, 4.5, hex("#8affff"));
    g.taper(0, 1.1, -0.2, 1.7, 2.4, 1.5, 1.6, 0.45, hex("#8affff"));
    const mat = new StandardMaterial("ghost", this.renderer.scene);
    mat.disableLighting = true;
    mat.emissiveColor = new Color3(0.4, 1, 1);
    mat.alpha = 0.35;
    this.ghostMesh = g.toMesh("ghost", this.renderer.scene, mat);
  }

  private updateGhost(s: Session) {
    if (!this.ghostMesh || !this.ghostData) return;
    const f = s.playTicks / 6;
    const i = Math.floor(f);
    const d = this.ghostData;
    if ((i + 1) * 4 + 3 >= d.length) { this.ghostMesh.isVisible = false; return; }
    const t = f - i;
    const a = i * 4, b = (i + 1) * 4;
    this.ghostMesh.isVisible = s.phase !== "countdown";
    this.ghostMesh.position.set(d[a] + (d[b] - d[a]) * t, d[a + 1] + (d[b + 1] - d[a + 1]) * t, d[a + 2] + (d[b + 2] - d[a + 2]) * t);
    let dy = d[b + 3] - d[a + 3];
    if (dy > Math.PI) dy -= Math.PI * 2;
    if (dy < -Math.PI) dy += Math.PI * 2;
    this.ghostMesh.rotation.y = d[a + 3] + dy * t;
  }

  private pause() {
    if (!this.session) return;
    this.paused = true;
    this.audio.ui("back");
    this.go(() => this.pauseMenu(), true);
  }
  private resume() {
    this.paused = false;
    this.closeScreens();
    this.last = performance.now();
  }
  private pauseMenu(): HTMLElement {
    const sc = document.createElement("div");
    sc.className = "screen dim";
    const m = document.createElement("div");
    m.className = "menu left";
    m.innerHTML = `<div class="h2">Paused</div>`;
    const s = this.session!;
    m.append(
      this.btn("Resume", "", () => this.resume(), "primary"),
      this.btn("Restart", "Same mode, fresh start", () => this.restart()),
      this.btn("Settings", "", () => this.go(() => this.settingsScreen())),
      this.btn(s.cfg.mode === "school" ? "Back to Skill School" : "Abandon shift", "Return to the menu (no record saved)", () => this.toMenu()),
    );
    sc.appendChild(m);
    return sc;
  }

  private restart() {
    const s = this.session;
    if (!s) return;
    this.hud.show(true);
    this.startSession(s.cfg.mode, { trial: s.cfg.trial, lesson: s.cfg.lesson, taxi: s.cfg.taxi });
  }

  private toMenu() {
    const wasSchool = this.session?.cfg.mode === "school";
    this.session = null;
    this.paused = false;
    this.renderer.setSession(null);
    this.audio.stopEngine();
    this.hud.show(false);
    this.ghostMesh?.dispose();
    this.ghostMesh = null;
    this.go(() => this.mainMenu(), true);
    if (wasSchool) this.go(() => this.schoolList());
  }

  private showResults() {
    const s = this.session!;
    const r = s.results!;
    this.lastResults = r;
    const d = this.store.data;
    let newBest = false;
    if (r.mode === "arcade" || r.mode === "quick") {
      d.totals.shifts++;
      const assists = s.cfg.vehicle?.driftAssist === true;
      const prev = d.best[r.mode];
      if (!prev || r.score > prev.score) {
        d.best[r.mode] = { score: r.score, rank: r.rank ?? "D", deliveries: r.deliveries, date: new Date().toISOString().slice(0, 10), taxi: r.taxi, assists };
        newBest = r.score > 0;
      }
    }
    d.totals.deliveries += r.deliveries;
    if (r.mode === "trial" && r.trialTime !== undefined && r.medals && s.trialIndex >= s.trialChain.length) {
      const prev = d.trials[s.cfg.trial ?? 0];
      if (!prev || r.trialTime < prev.time) {
        d.trials[s.cfg.trial ?? 0] = { time: r.trialTime, medal: r.medal ?? null, ghost: s.ghost.map((n) => Math.round(n * 100) / 100), taxi: r.taxi };
        newBest = true;
      }
    }
    if (r.mode === "school" && r.lessonDone && !d.lessons.includes(s.cfg.lesson ?? 0)) d.lessons.push(s.cfg.lesson ?? 0);
    for (const id of r.newDiscoveries) if (!d.discovered.includes(id)) d.discovered.push(id);
    this.store.save();
    this.audio.stopEngine();
    this.hud.show(false);
    this.go(() => this.resultsScreen(r, newBest), true);
  }

  private resultsScreen(r: Results, newBest: boolean): HTMLElement {
    const sc = document.createElement("div");
    sc.className = "screen dim";
    const m = document.createElement("div");
    m.className = "menu results";
    const row = (k: string, v: string) => `<span class="k">${k}</span><span class="n">${v}</span>`;
    let head = "";
    if (r.rank) head = `<div class="chunky" style="font-size:22px;color:var(--cyan)">SHIFT OVER · RANK</div><div class="rank ${r.rank}">${r.rank}</div>`;
    else if (r.mode === "trial") head = `<div class="chunky" style="font-size:22px;color:var(--cyan)">${TRIALS[this.session!.cfg.trial ?? 0].name}</div><div class="rank ${r.medal === "gold" ? "S" : r.medal === "silver" ? "A" : r.medal === "bronze" ? "B" : "D"}" style="font-size:110px">${r.trialTime !== undefined && this.session!.trialIndex >= 3 ? fmtTime(r.trialTime) : "DNF"}</div><div class="chunky" style="font-size:26px">${r.medal ? r.medal.toUpperCase() + " MEDAL" : "No medal"}</div>`;
    else head = `<div class="rank ${r.lessonDone ? "B" : "D"}" style="font-size:80px">${r.lessonDone ? "LESSON PASSED" : "LESSON ENDED"}</div>`;
    const grades = ["Blazing", "Fast", "Close", "Late", "Failed"].map((g) => `${g[0]}:${r.grades.filter((x) => x === g).length}`).join(" ");
    m.innerHTML = `${head}${newBest ? `<div class="newbest">NEW PERSONAL BEST!</div>` : ""}
      <div class="resgrid">${row("Total score", r.score.toLocaleString("en-US"))}${row("Fares", r.fares.toLocaleString("en-US"))}${row("Style tips", r.tips.toLocaleString("en-US"))}
      ${r.mode === "arcade" ? row("Time earned", `+${r.timeBonus}s`) : ""}${row("Deliveries", `${r.deliveries}${r.failed ? ` (${r.failed} lost)` : ""}`)}${row("Grades", grades)}
      ${row("Best Pulse chain", `${r.bestChain} moves`)}${row("Collisions", String(r.collisions))}${row("Shortcuts run", `${r.shortcutsRun}${r.newDiscoveries.length ? ` · ${r.newDiscoveries.length} new!` : ""}`)}
      ${row("Route efficiency", r.routeEfficiency ? `${r.routeEfficiency}% of legal route` : "—")}${row("Leaderboard", "Local records only (no online board in this build)")}</div>`;
    const btns = document.createElement("div");
    btns.append(
      this.btn(r.mode === "school" ? "Retry lesson" : "Retry ▶", "", () => this.restart(), "small primary"),
      this.btn(r.mode === "school" ? "Lessons" : "Menu", "", () => this.toMenu(), "small"),
    );
    if (r.mode === "school" && r.lessonDone && (this.session!.cfg.lesson ?? 0) < 9) {
      btns.prepend(this.btn("Next lesson ▶", "", () => this.startSession("school", { lesson: (this.session!.cfg.lesson ?? 0) + 1 }), "small primary"));
    }
    m.appendChild(btns);
    const foot = document.createElement("div");
    foot.className = "foot";
    foot.textContent = "Enter: confirm · Arrow keys: move";
    m.appendChild(foot);
    sc.appendChild(m);
    return sc;
  }
}

export { NO_INPUT };
