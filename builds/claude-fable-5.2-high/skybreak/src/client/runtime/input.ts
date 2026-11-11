// client-runtime: keyboard / mouse capture and input-frame assembly. Fully remappable.
import { clamp } from "../../shared/math";
import { Btn, type InputFrame } from "../../shared/protocol/protocol";
import { settingsStore, type Action } from "./settings";

export class Input {
  private down = new Set<string>();
  private actionDown = new Map<Action, boolean>();
  /** Edge-latched buttons since the last sim tick. */
  private latched = 0;
  yaw = 0;
  pitch = 0;
  /** Free-look offsets (camera only). */
  lookYaw = 0;
  lookPitch = 0;
  shoulder = 1;
  slot = 0;
  wheel = 0;
  locked = false;
  enabled = false;
  adsToggle = false;
  crouchToggle = false;
  private fire = false;
  private adsHeld = false;
  private seq = 0;
  sensScale = 1;
  onAction: (a: Action) => void = () => {};
  onMiddle: () => void = () => {};
  onLockChange: (locked: boolean) => void = () => {};

  constructor(private canvas: HTMLCanvasElement) {
    window.addEventListener("keydown", this.keyDown);
    window.addEventListener("keyup", this.keyUp);
    window.addEventListener("blur", this.clear);
    canvas.addEventListener("mousedown", this.mouseDown);
    window.addEventListener("mouseup", this.mouseUp);
    window.addEventListener("mousemove", this.mouseMove);
    canvas.addEventListener("wheel", this.onWheel, { passive: false });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    document.addEventListener("pointerlockchange", () => {
      this.locked = document.pointerLockElement === this.canvas;
      if (!this.locked) this.clear();
      this.onLockChange(this.locked);
    });
  }

  requestLock(): void {
    if (document.pointerLockElement === this.canvas) return;
    try {
      const p = this.canvas.requestPointerLock() as unknown as Promise<void> | undefined;
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch {
      /* pointer lock refused (e.g. too soon after Escape); the pause overlay offers a retry */
    }
  }
  exitLock(): void {
    if (document.pointerLockElement) document.exitPointerLock();
  }

  private clear = (): void => {
    this.down.clear();
    this.actionDown.clear();
    this.fire = false;
    this.adsHeld = false;
  };

  private actionsFor(code: string): Action[] {
    const binds = settingsStore.value.binds;
    const out: Action[] = [];
    for (const a of Object.keys(binds) as Action[]) if (binds[a].includes(code)) out.push(a);
    return out;
  }

  private keyDown = (e: KeyboardEvent): void => {
    if (!this.enabled) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
    const acts = this.actionsFor(e.code);
    if (acts.length || e.code === "Tab" || e.code === "AltLeft" || e.code === "Space") e.preventDefault();
    if (e.repeat) return;
    this.down.add(e.code);
    for (const a of acts) {
      this.actionDown.set(a, true);
      this.press(a);
      this.onAction(a);
    }
  };

  private keyUp = (e: KeyboardEvent): void => {
    this.down.delete(e.code);
    for (const a of this.actionsFor(e.code)) {
      // an action stays held while any of its other binds is down
      const still = settingsStore.value.binds[a].some((c) => this.down.has(c));
      this.actionDown.set(a, still);
    }
  };

  private press(a: Action): void {
    switch (a) {
      case "jump": this.latched |= Btn.Jump; break;
      case "interact": this.latched |= Btn.Interact; break;
      case "reload": this.latched |= Btn.Reload; break;
      case "melee": this.latched |= Btn.Melee; break;
      case "sail": this.latched |= Btn.Sail; break;
      case "throw": this.latched |= Btn.Throw; break;
      case "crouch":
        this.latched |= Btn.Crouch;
        if (settingsStore.value.toggleCrouch) this.crouchToggle = !this.crouchToggle;
        break;
      case "shoulder": this.shoulder = -this.shoulder; break;
      case "slot1": this.slot = 0; break;
      case "slot2": this.slot = 1; break;
      case "slot3": this.slot = 2; break;
      case "slot4": this.slot = 3; break;
      case "slot5": this.slot = 4; break;
      default: break;
    }
  }

  private mouseDown = (e: MouseEvent): void => {
    if (!this.enabled) return;
    if (!this.locked) {
      this.requestLock();
      return;
    }
    if (e.button === 0) {
      this.fire = true;
      this.latched |= Btn.Fire;
    } else if (e.button === 2) {
      this.adsHeld = true;
      if (settingsStore.value.toggleAds) this.adsToggle = !this.adsToggle;
    } else if (e.button === 1) {
      e.preventDefault();
      this.onMiddle();
    }
  };
  private mouseUp = (e: MouseEvent): void => {
    if (e.button === 0) this.fire = false;
    else if (e.button === 2) this.adsHeld = false;
  };
  private mouseMove = (e: MouseEvent): void => {
    if (!this.locked || !this.enabled) return;
    const s = settingsStore.value;
    const k = 0.0022 * s.sens * this.sensScale;
    const dx = clamp(e.movementX, -400, 400) * k;
    const dy = clamp(e.movementY, -400, 400) * k * (s.invertY ? -1 : 1);
    if (this.held("freelook")) {
      this.lookYaw += dx;
      this.lookPitch = clamp(this.lookPitch - dy, -1.2, 1.2);
    } else {
      this.yaw += dx;
      this.pitch = clamp(this.pitch - dy, -1.45, 1.45);
    }
  };
  private onWheel = (e: WheelEvent): void => {
    if (!this.enabled) return;
    e.preventDefault();
    this.wheel += e.deltaY > 0 ? 1 : -1;
  };

  held(a: Action): boolean {
    return this.actionDown.get(a) === true;
  }

  get ads(): boolean {
    return settingsStore.value.toggleAds ? this.adsToggle : this.adsHeld;
  }

  /** Builds the next sequenced input frame and clears the edge latch. */
  frame(viewTime: number, active: boolean): InputFrame {
    let buttons = 0;
    let moveX = 0,
      moveZ = 0;
    if (active) {
      if (this.held("forward")) moveZ += 1;
      if (this.held("back")) moveZ -= 1;
      if (this.held("right")) moveX += 1;
      if (this.held("left")) moveX -= 1;
      if (this.fire) buttons |= Btn.Fire;
      if (this.ads) buttons |= Btn.Ads;
      if (this.held("sprint")) buttons |= Btn.Sprint;
      if (settingsStore.value.toggleCrouch ? this.crouchToggle : this.held("crouch")) buttons |= Btn.Crouch;
      if (this.held("jump")) buttons |= Btn.Jump;
      if (this.held("interact")) buttons |= Btn.Interact;
      if (this.held("reload")) buttons |= Btn.Reload;
    }
    const pressed = active ? this.latched : 0;
    this.latched = 0;
    if (!this.held("freelook")) {
      this.lookYaw *= 0.7;
      this.lookPitch *= 0.7;
    }
    return { seq: ++this.seq, moveX, moveZ, yaw: this.yaw, pitch: this.pitch, buttons, pressed, slot: this.slot, shoulder: this.shoulder, viewTime };
  }

  resetView(yaw: number, pitch = 0): void {
    this.yaw = yaw;
    this.pitch = pitch;
    this.lookYaw = 0;
    this.lookPitch = 0;
    this.adsToggle = false;
    this.crouchToggle = false;
  }
}
