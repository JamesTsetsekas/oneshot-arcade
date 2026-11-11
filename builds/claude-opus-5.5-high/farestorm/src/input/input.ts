// Keyboard + mouse + gamepad -> InputFrame, plus camera controls and UI actions. Remappable.

import type { InputFrame } from "../sim/vehicle/input";
import type { CamControls } from "../render/camera";

export type Action =
  | "throttle" | "brake" | "left" | "right" | "handbrake" | "boost" | "interact" | "horn" | "reset"
  | "glanceLeft" | "glanceRight" | "lookBack" | "camera" | "map" | "pause";

export const ACTION_LABEL: Record<Action, string> = {
  throttle: "Throttle", brake: "Brake / reverse", left: "Steer left", right: "Steer right", handbrake: "Handbrake / drift",
  boost: "Tailwind boost", interact: "Pick up / confirm", horn: "Horn", reset: "Reset (hold)", glanceLeft: "Glance left",
  glanceRight: "Glance right", lookBack: "Look back", camera: "Cycle camera", map: "City map", pause: "Pause",
};

export const DEFAULT_BINDINGS: Record<Action, string[]> = {
  throttle: ["KeyW", "ArrowUp"],
  brake: ["KeyS", "ArrowDown"],
  left: ["KeyA", "ArrowLeft"],
  right: ["KeyD", "ArrowRight"],
  handbrake: ["Space"],
  boost: ["ShiftLeft", "ShiftRight"],
  interact: ["KeyE"],
  horn: ["KeyH"],
  reset: ["KeyR"],
  glanceLeft: ["KeyZ"],
  glanceRight: ["KeyC"],
  lookBack: ["KeyX"],
  camera: ["KeyV"],
  map: ["KeyM", "Tab"],
  pause: ["Escape", "KeyP"],
};

export interface InputSettings {
  bindings: Record<Action, string[]>;
  deadzone: number;
  vibration: boolean;
  steerSensitivity: number; // 0.6..1.4
}

export class Input {
  private down = new Set<string>();
  private pressed = new Set<string>();
  private mouseDown = false;
  private mouseYaw = 0;
  private lastMouse = 0;
  gamepadConnected = false;
  onGamepadChange: ((connected: boolean) => void) | null = null;
  private padPrev: boolean[] = [];
  private padPressed = new Set<number>();
  settings: InputSettings;
  capturing: ((code: string) => void) | null = null;
  lastDevice: "keyboard" | "gamepad" = "keyboard";

  constructor(settings: InputSettings) {
    this.settings = settings;
    window.addEventListener("keydown", (e) => {
      if (this.capturing) {
        e.preventDefault();
        const cb = this.capturing;
        this.capturing = null;
        cb(e.code);
        return;
      }
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"].includes(e.code) && !(e.target instanceof HTMLInputElement)) e.preventDefault();
      if (!this.down.has(e.code)) this.pressed.add(e.code);
      this.down.add(e.code);
      this.lastDevice = "keyboard";
    });
    window.addEventListener("keyup", (e) => this.down.delete(e.code));
    window.addEventListener("blur", () => this.down.clear());
    window.addEventListener("pointerdown", (e) => {
      if ((e.target as HTMLElement)?.tagName === "CANVAS") { this.mouseDown = true; this.lastMouse = e.clientX; }
    });
    window.addEventListener("pointerup", () => (this.mouseDown = false));
    window.addEventListener("pointermove", (e) => {
      if (!this.mouseDown) return;
      this.mouseYaw += (e.clientX - this.lastMouse) * 0.006;
      this.mouseYaw = Math.max(-2.6, Math.min(2.6, this.mouseYaw));
      this.lastMouse = e.clientX;
    });
    window.addEventListener("gamepadconnected", () => { this.gamepadConnected = true; this.onGamepadChange?.(true); });
    window.addEventListener("gamepaddisconnected", () => {
      this.gamepadConnected = !!this.pad();
      this.onGamepadChange?.(false);
    });
  }

  private pad(): Gamepad | null {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) if (p && p.connected) return p;
    return null;
  }

  private key(a: Action): boolean {
    for (const k of this.settings.bindings[a]) if (this.down.has(k)) return true;
    return false;
  }
  /** Edge-triggered action (consumed). */
  consume(a: Action): boolean {
    let hit = false;
    for (const k of this.settings.bindings[a]) if (this.pressed.has(k)) { hit = true; this.pressed.delete(k); }
    const padMap: Partial<Record<Action, number>> = { pause: 9, camera: 12, map: 13, interact: 2 };
    const b = padMap[a];
    if (b !== undefined && this.padPressed.has(b)) { hit = true; this.padPressed.delete(b); }
    return hit;
  }
  consumeCode(code: string): boolean {
    if (this.pressed.has(code)) { this.pressed.delete(code); return true; }
    return false;
  }
  padButtonPressed(b: number): boolean {
    if (this.padPressed.has(b)) { this.padPressed.delete(b); return true; }
    return false;
  }

  /** Call once per rendered frame before reading. */
  poll() {
    const p = this.pad();
    this.padPressed.clear();
    if (!p) return;
    p.buttons.forEach((b, i) => {
      const was = this.padPrev[i] ?? false;
      if (b.pressed && !was) { this.padPressed.add(i); this.lastDevice = "gamepad"; }
      this.padPrev[i] = b.pressed;
    });
  }
  endFrame() {
    this.pressed.clear();
  }

  frame(): InputFrame {
    const p = this.pad();
    let throttle = this.key("throttle") ? 1 : 0;
    let brake = this.key("brake") ? 1 : 0;
    let steer = (this.key("right") ? 1 : 0) - (this.key("left") ? 1 : 0);
    let handbrake = this.key("handbrake");
    let boost = this.key("boost");
    let reset = this.key("reset");
    let horn = this.key("horn");
    let interact = this.key("interact");
    if (p) {
      const dz = this.settings.deadzone;
      const ax = p.axes[0] ?? 0;
      const sx = Math.abs(ax) < dz ? 0 : Math.sign(ax) * ((Math.abs(ax) - dz) / (1 - dz));
      if (Math.abs(sx) > 0) { steer = sx; this.lastDevice = "gamepad"; }
      const rt = p.buttons[7]?.value ?? 0, lt = p.buttons[6]?.value ?? 0;
      if (rt > 0.05) throttle = Math.max(throttle, rt);
      if (lt > 0.05) brake = Math.max(brake, lt);
      handbrake ||= !!p.buttons[0]?.pressed;
      boost ||= !!p.buttons[1]?.pressed;
      reset ||= !!p.buttons[8]?.pressed;
      horn ||= !!p.buttons[10]?.pressed;
      interact ||= !!p.buttons[2]?.pressed;
    }
    steer = Math.max(-1, Math.min(1, steer * this.settings.steerSensitivity));
    return { throttle, brake, steer, handbrake, boost, reset, horn, interact };
  }

  cam(): CamControls {
    const p = this.pad();
    let glance = (this.key("glanceRight") ? 1 : 0) - (this.key("glanceLeft") ? 1 : 0);
    let lookBack = this.key("lookBack");
    let freeYaw = this.mouseYaw;
    let freeActive = this.mouseDown;
    if (!this.mouseDown) this.mouseYaw *= 0.9;
    if (p) {
      const rx = p.axes[2] ?? 0;
      if (Math.abs(rx) > 0.25) { freeYaw = rx * 2.6; freeActive = true; }
      if (p.buttons[3]?.pressed) lookBack = true; // Y / Triangle
      if (p.buttons[4]?.pressed) glance = -1;
      if (p.buttons[5]?.pressed) glance = 1;
    }
    return { glance, lookBack, freeYaw, freeActive };
  }

  rumble(strength: number, ms: number) {
    if (!this.settings.vibration) return;
    const p = this.pad() as (Gamepad & { vibrationActuator?: { playEffect: (t: string, o: object) => Promise<unknown> } }) | null;
    p?.vibrationActuator?.playEffect?.("dual-rumble", { duration: ms, strongMagnitude: strength, weakMagnitude: strength * 0.6 }).catch(() => {});
  }

  /** Menu navigation helpers (keyboard arrows / d-pad / A / B) */
  menuNav(): { up: boolean; down: boolean; left: boolean; right: boolean; ok: boolean; back: boolean } {
    const r = {
      up: this.consumeCode("ArrowUp") || this.padButtonPressed(12),
      down: this.consumeCode("ArrowDown") || this.padButtonPressed(13),
      left: this.consumeCode("ArrowLeft") || this.padButtonPressed(14),
      right: this.consumeCode("ArrowRight") || this.padButtonPressed(15),
      ok: this.padButtonPressed(0),
      back: this.padButtonPressed(1),
    };
    return r;
  }
}

export function keyLabel(code: string): string {
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  const map: Record<string, string> = { Space: "Space", ShiftLeft: "L-Shift", ShiftRight: "R-Shift", ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→", Escape: "Esc", Tab: "Tab", Enter: "Enter" };
  return map[code] ?? code;
}
