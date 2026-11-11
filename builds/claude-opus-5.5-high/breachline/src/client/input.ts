// Keyboard/mouse input with remappable binds, hold/toggle modes and Pointer Lock
// (raw/unadjusted movement where available; the game adds no acceleration).
import { Settings } from "../profile/profile";
import { BTN } from "../shared/protocol";
import { DEG, clamp } from "../shared/math";

export class Input {
  down = new Set<string>();
  pressedOnce = new Set<string>();
  yaw = 0; pitch = 0;
  lookDX = 0; lookDY = 0;
  slot: 0 | 1 = 0;
  supportSel = 0;
  adsToggled = false; crouchToggled = false; sprintToggled = false;
  locked = false;
  enabled = true;
  zoom = 1;
  scoped = false;
  onLockChange: (locked: boolean) => void = () => {};
  onPointerLockError: () => void = () => {};
  private codeToActions = new Map<string, string[]>();

  constructor(private canvas: HTMLCanvasElement, public settings: Settings) {
    this.rebind();
    window.addEventListener("keydown", this.onKey, true);
    window.addEventListener("keyup", this.onKeyUp, true);
    window.addEventListener("mousedown", this.onMouseDown, true);
    window.addEventListener("mouseup", this.onMouseUp, true);
    window.addEventListener("mousemove", this.onMove, true);
    window.addEventListener("wheel", this.onWheel, { passive: false });
    window.addEventListener("contextmenu", this.prevent);
    window.addEventListener("blur", this.onBlur);
    document.addEventListener("pointerlockchange", this.onLock);
    document.addEventListener("pointerlockerror", this.onLockErr);
  }

  rebind() {
    this.codeToActions.clear();
    for (const [action, code] of Object.entries(this.settings.binds)) {
      const list = this.codeToActions.get(code) ?? [];
      list.push(action);
      this.codeToActions.set(code, list);
    }
  }

  dispose() {
    window.removeEventListener("keydown", this.onKey, true);
    window.removeEventListener("keyup", this.onKeyUp, true);
    window.removeEventListener("mousedown", this.onMouseDown, true);
    window.removeEventListener("mouseup", this.onMouseUp, true);
    window.removeEventListener("mousemove", this.onMove, true);
    window.removeEventListener("wheel", this.onWheel);
    window.removeEventListener("contextmenu", this.prevent);
    window.removeEventListener("blur", this.onBlur);
    document.removeEventListener("pointerlockchange", this.onLock);
    document.removeEventListener("pointerlockerror", this.onLockErr);
    if (document.pointerLockElement) document.exitPointerLock();
  }

  requestLock() {
    try {
      const r = (this.canvas.requestPointerLock as unknown as (o?: { unadjustedMovement?: boolean }) => Promise<void> | void).call(this.canvas, { unadjustedMovement: true });
      if (r && typeof (r as Promise<void>).catch === "function") (r as Promise<void>).catch(() => {
        // raw input not supported: retry with default movement
        try { const r2 = this.canvas.requestPointerLock() as unknown as Promise<void> | undefined; r2?.catch?.(() => this.onPointerLockError()); } catch { this.onPointerLockError(); }
      });
    } catch { this.onPointerLockError(); }
  }

  private prevent = (e: Event) => { if (this.enabled) e.preventDefault(); };
  private onBlur = () => { this.down.clear(); };
  private onLock = () => { this.locked = document.pointerLockElement === this.canvas; this.onLockChange(this.locked); if (!this.locked) this.down.clear(); };
  private onLockErr = () => { this.onPointerLockError(); };

  private actionsOf(code: string) { return this.codeToActions.get(code) ?? []; }
  private press(code: string) {
    if (!this.down.has(code)) {
      for (const a of this.actionsOf(code)) {
        this.pressedOnce.add(a);
        if (a === "ads" && this.settings.adsMode === "toggle") this.adsToggled = !this.adsToggled;
        if ((a === "crouch" || a === "crouchAlt") && this.settings.crouchMode === "toggle") this.crouchToggled = !this.crouchToggled;
        if (a === "sprint" && this.settings.sprintMode === "toggle") this.sprintToggled = !this.sprintToggled;
        if (a === "primary") this.slot = 0;
        if (a === "sidearm") this.slot = 1;
        if (a === "supportSelect") this.supportSel++;
      }
    }
    this.down.add(code);
  }
  private onKey = (e: KeyboardEvent) => {
    if (!this.enabled) return;
    if (e.code === "Tab" || (this.locked && e.code !== "Escape" && e.code !== "F11" && e.code !== "F12")) e.preventDefault();
    if (e.repeat) return;
    this.press(e.code);
  };
  private onKeyUp = (e: KeyboardEvent) => { this.down.delete(e.code); };
  private onMouseDown = (e: MouseEvent) => { if (!this.enabled || !this.locked) return; this.press(`Mouse${e.button}`); };
  private onMouseUp = (e: MouseEvent) => { this.down.delete(`Mouse${e.button}`); };
  private onWheel = (e: WheelEvent) => { if (!this.enabled || !this.locked) return; e.preventDefault(); this.slot = this.slot === 0 ? 1 : 0; };
  private onMove = (e: MouseEvent) => {
    if (!this.enabled || !this.locked) return;
    // degrees per count: 0.022 * sensitivity, scaled for zoom (monitor-distance-like) and ADS multipliers
    const zoomScale = this.zoom > 1.01 ? (1 / this.zoom) * (this.scoped ? this.settings.scopedSens : this.settings.adsSens) : 1;
    const k = 0.022 * this.settings.sens * zoomScale * DEG;
    const dx = e.movementX * k, dy = e.movementY * k * (this.settings.invertY ? -1 : 1);
    if (Math.abs(e.movementX) > 2000 || Math.abs(e.movementY) > 2000) return; // browser glitch guard
    this.yaw += dx; this.pitch = clamp(this.pitch + dy, -89 * DEG, 89 * DEG);
    this.lookDX += dx; this.lookDY += dy;
  };

  isDown(action: string): boolean {
    const code = this.settings.binds[action];
    return !!code && this.down.has(code);
  }
  consume(action: string): boolean { const had = this.pressedOnce.has(action); this.pressedOnce.delete(action); return had; }

  addRecoil(pitchDeg: number, yawDeg: number) {
    this.pitch = clamp(this.pitch + pitchDeg * DEG, -89 * DEG, 89 * DEG);
    this.yaw += yawDeg * DEG;
  }

  buttons(): number {
    let b = 0;
    const s = this.settings;
    if (this.isDown("fire")) b |= BTN.fire;
    if (s.adsMode === "hold" ? this.isDown("ads") : this.adsToggled) b |= BTN.ads;
    if (this.isDown("jump")) b |= BTN.jump;
    const crouchHeld = this.isDown("crouch") || this.isDown("crouchAlt");
    if (s.crouchMode === "hold" ? crouchHeld : this.crouchToggled) b |= BTN.crouch;
    if (s.sprintMode === "hold" ? this.isDown("sprint") : this.sprintToggled) b |= BTN.sprint;
    if (this.isDown("reload")) b |= BTN.reload;
    if (this.isDown("melee")) b |= BTN.melee;
    if (this.isDown("lethal")) b |= BTN.lethal;
    if (this.isDown("tactical")) b |= BTN.tactical;
    if (this.isDown("mode")) b |= BTN.mode;
    if (this.isDown("supportDeploy")) b |= BTN.deploy;
    if (this.isDown("inspect")) b |= BTN.inspect;
    if (this.isDown("ping")) b |= BTN.ping;
    return b;
  }
  axes(): { mx: number; mz: number } {
    const mz = (this.isDown("forward") ? 1 : 0) - (this.isDown("back") ? 1 : 0);
    const mx = (this.isDown("right") ? 1 : 0) - (this.isDown("left") ? 1 : 0);
    if (mz <= 0 && this.settings.sprintMode === "toggle") this.sprintToggled = false;
    return { mx, mz };
  }
  resetToggles() { this.adsToggled = false; this.crouchToggled = false; this.sprintToggled = false; }
}
