// Pointer-lock keyboard/mouse input -> InputCmd. Render-rate view angles, per-optic sensitivity, hold/toggle options.
import { emptyInput, type InputCmd } from "../../shared/protocol";
import { clamp } from "../../shared/math";
import type { Settings } from "./settings";

export interface InputCallbacks {
  onLockChange(locked: boolean): void;
  onLockError(msg: string): void;
  onScoreboard(show: boolean): void;
  onPauseKey(): void;
  onLoadoutKey(): void;
  onInspect(): void;
  onPing(): void;
  onKeyAny(): void;
}

export class InputManager {
  keys = new Set<string>();
  buttons = new Set<number>();
  yaw = 0;
  pitch = 0;
  dYaw = 0;
  dPitch = 0;
  locked = false;
  enabled = false;
  private pressed = new Set<string>();
  private fireQueued = false;
  private wheel = 0;
  private adsToggled = false;
  private crouchToggled = false;
  private sprintToggled = false;
  private seq = 0;
  private lethalDown = false;
  private frameDYaw = 0;
  private frameDPitch = 0;
  rawSupported = false;
  adsSensScale = 1;
  private bound: Array<[EventTarget, string, EventListener]> = [];

  constructor(private canvas: HTMLCanvasElement, private settings: () => Settings, private cb: InputCallbacks) {
    const on = (t: EventTarget, type: string, fn: (e: never) => void) => { const l = fn as unknown as EventListener; t.addEventListener(type, l); this.bound.push([t, type, l]); };
    on(document, "keydown", (e: KeyboardEvent) => this.keyDown(e));
    on(document, "keyup", (e: KeyboardEvent) => this.keyUp(e));
    on(document, "mousedown", (e: MouseEvent) => this.mouseDown(e));
    on(document, "mouseup", (e: MouseEvent) => { this.buttons.delete(e.button); if (e.button === 2 && this.settings().holdAds) this.adsToggled = false; });
    on(document, "mousemove", (e: MouseEvent) => this.mouseMove(e));
    on(document, "wheel", (e: WheelEvent) => { if (this.locked) { this.wheel += Math.sign(e.deltaY); e.preventDefault(); } });
    on(document, "pointerlockchange", () => {
      const locked = document.pointerLockElement === this.canvas;
      this.locked = locked;
      if (!locked) { this.buttons.clear(); this.keys.clear(); }
      this.cb.onLockChange(locked);
    });
    on(document, "pointerlockerror", () => this.cb.onLockError("Pointer Lock was refused by the browser. Click the game again."));
    on(window, "blur", () => { this.buttons.clear(); this.keys.clear(); });
    on(document, "contextmenu", (e: Event) => { if (this.enabled) e.preventDefault(); });
  }

  dispose(): void { for (const [t, type, l] of this.bound) t.removeEventListener(type, l); this.bound = []; }

  async lock(): Promise<void> {
    try {
      const anyCanvas = this.canvas as HTMLCanvasElement & { requestPointerLock(o?: { unadjustedMovement?: boolean }): Promise<void> | void };
      let p: Promise<void> | void;
      try { p = anyCanvas.requestPointerLock({ unadjustedMovement: true }); this.rawSupported = true; } catch { p = anyCanvas.requestPointerLock(); }
      if (p && typeof (p as Promise<void>).catch === "function") await (p as Promise<void>).catch(async () => { try { await (anyCanvas.requestPointerLock() as Promise<void> | undefined); } catch { this.cb.onLockError("Pointer Lock unavailable."); } });
    } catch { this.cb.onLockError("Pointer Lock unavailable."); }
  }
  unlock(): void { if (document.pointerLockElement) document.exitPointerLock(); }

  setView(yaw: number, pitch: number): void { this.yaw = yaw; this.pitch = pitch; }
  private bindOf(action: string): string { return this.settings().keys[action]; }
  isDown(action: string): boolean { return this.keys.has(this.bindOf(action)); }
  private wasPressed(action: string): boolean { return this.pressed.has(this.bindOf(action)); }

  private keyDown(e: KeyboardEvent): void {
    if (!this.enabled) return;
    if (e.code === "Tab") e.preventDefault();
    if (["Space", "ArrowUp", "ArrowDown"].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    this.keys.add(e.code);
    this.pressed.add(e.code);
    this.cb.onKeyAny();
    if (e.code === this.bindOf("scoreboard")) this.cb.onScoreboard(true);
    if (e.code === this.bindOf("loadout")) this.cb.onLoadoutKey();
    if (e.code === this.bindOf("inspect")) this.cb.onInspect();
    if (e.code === this.bindOf("ping")) this.cb.onPing();
    const s = this.settings();
    if (e.code === this.bindOf("crouch") || e.code === this.bindOf("crouchAlt")) { if (!s.holdCrouch) this.crouchToggled = !this.crouchToggled; }
    if (e.code === this.bindOf("sprint") && !s.holdSprint) this.sprintToggled = !this.sprintToggled;
    if (e.code === this.bindOf("lethal")) this.lethalDown = true;
  }
  private keyUp(e: KeyboardEvent): void {
    this.keys.delete(e.code);
    if (e.code === this.bindOf("scoreboard")) this.cb.onScoreboard(false);
    if (e.code === this.bindOf("lethal")) this.lethalDown = false;
  }
  private mouseDown(e: MouseEvent): void {
    if (!this.enabled || !this.locked) return;
    this.buttons.add(e.button);
    this.cb.onKeyAny();
    if (e.button === 0) this.fireQueued = true;
    if (e.button === 2) { const s = this.settings(); if (!s.holdAds) this.adsToggled = !this.adsToggled; else this.adsToggled = true; }
  }
  private mouseMove(e: MouseEvent): void {
    if (!this.enabled || !this.locked) return;
    const s = this.settings();
    const k = s.sensitivity * 0.0004 * this.adsSensScale;
    const dx = e.movementX * k, dy = e.movementY * k * (s.invertY ? -1 : 1);
    this.yaw += dx;
    this.pitch = clamp(this.pitch - dy, -1.5, 1.5);
    this.frameDYaw += dx; this.frameDPitch += dy;
  }

  /** Build the per-frame command. Edge flags are set once and cleared here. */
  buildCmd(activeSlot: number): InputCmd {
    const c = emptyInput();
    const s = this.settings();
    c.seq = ++this.seq;
    c.forward = (this.isDown("forward") ? 1 : 0) - (this.isDown("back") ? 1 : 0);
    c.strafe = (this.isDown("right") ? 1 : 0) - (this.isDown("left") ? 1 : 0);
    c.yaw = this.yaw; c.pitch = this.pitch;
    c.fire = this.buttons.has(0) || this.fireQueued;
    this.fireQueued = false;
    const adsHeld = this.buttons.has(2);
    c.ads = s.holdAds ? adsHeld : this.adsToggled;
    c.sprint = s.holdSprint ? this.isDown("sprint") : this.sprintToggled;
    const crouchHeld = this.isDown("crouch") || this.keys.has(this.bindOf("crouchAlt"));
    c.crouch = s.holdCrouch ? crouchHeld : this.crouchToggled;
    c.jump = this.wasPressed("jump") || (this.isDown("jump") && false);
    c.reload = this.wasPressed("reload");
    c.melee = this.wasPressed("melee");
    c.lethal = this.wasPressed("lethal");
    c.lethalHeld = this.lethalDown;
    c.tactical = this.wasPressed("tactical");
    c.interact = this.wasPressed("interact");
    c.fireModeToggle = this.wasPressed("fireMode");
    c.supportCycle = this.wasPressed("supportSelect");
    c.supportDeploy = this.wasPressed("supportDeploy");
    if (this.wasPressed("primary")) c.selectSlot = 0;
    else if (this.wasPressed("secondary")) c.selectSlot = 1;
    else if (this.wheel !== 0) c.selectSlot = activeSlot === 0 ? 1 : 0;
    this.wheel = 0;
    // sprint auto-cancels toggles when moving stops
    if (c.forward <= 0) this.sprintToggled = false;
    this.pressed.clear();
    return c;
  }

  /** Mouse delta accumulated since last call (for viewmodel sway). */
  takeDeltas(): { dYaw: number; dPitch: number } {
    const d = { dYaw: this.frameDYaw, dPitch: this.frameDPitch };
    this.frameDYaw = 0; this.frameDPitch = 0;
    return d;
  }

  resetToggles(): void { this.adsToggled = false; this.crouchToggled = false; this.sprintToggled = false; }
  /** Forget edge flags so a pause/menu key press does not leak into gameplay. */
  flush(): void { this.pressed.clear(); this.fireQueued = false; this.wheel = 0; }
  anyGameKeyHeld(): boolean { return this.keys.size > 0 || this.buttons.size > 0; }
}
