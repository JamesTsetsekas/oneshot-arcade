// Rebindable keyboard/mouse input with context-sensitive actions (on foot vs vehicle).
import type { InputState } from "../sim/game";

export type Action =
  | "forward" | "back" | "left" | "right" | "sprint" | "walk" | "crouch" | "jump" | "interact" | "reload" | "melee" | "throw"
  | "gadget" | "wheel" | "map" | "phone" | "shoulder" | "holster" | "pause" | "medkit"
  | "handbrake" | "exit" | "horn" | "camera" | "lookback" | "radio" | "reset" | "slot1" | "slot2" | "slot3" | "slot4";

export const DEFAULT_BINDS: Record<Action, string> = {
  forward: "KeyW", back: "KeyS", left: "KeyA", right: "KeyD", sprint: "ShiftLeft", walk: "AltLeft", crouch: "ControlLeft", jump: "Space",
  interact: "KeyE", reload: "KeyR", melee: "KeyF", throw: "KeyG", gadget: "KeyQ", wheel: "Tab", map: "KeyM", phone: "KeyP",
  shoulder: "KeyX", holster: "KeyH", pause: "Escape", medkit: "KeyB",
  handbrake: "Space", exit: "KeyF", horn: "KeyH", camera: "KeyC", lookback: "KeyX", radio: "KeyQ", reset: "KeyR",
  slot1: "Digit1", slot2: "Digit2", slot3: "Digit3", slot4: "Digit4",
};

export const ACTION_LABEL: Record<Action, string> = {
  forward: "Forward / throttle", back: "Back / brake-reverse", left: "Left / steer left", right: "Right / steer right", sprint: "Sprint",
  walk: "Walk", crouch: "Crouch (toggle)", jump: "Jump / vault / mantle", interact: "Interact / enter vehicle", reload: "Reload",
  melee: "Melee / takedown", throw: "Throw gadget", gadget: "Cycle gadget", wheel: "Weapon wheel (hold)", map: "Map", phone: "Phone",
  shoulder: "Shoulder swap", holster: "Holster", pause: "Pause", medkit: "Use medkit", handbrake: "Handbrake (vehicle)",
  exit: "Exit vehicle", horn: "Horn (vehicle)", camera: "Vehicle camera", lookback: "Look back (vehicle)", radio: "Next radio station",
  reset: "Reset vehicle (races, hold)", slot1: "Unarmed", slot2: "Melee", slot3: "Sidearm", slot4: "Long gun",
};

/** Actions that only apply on foot vs in a vehicle may share keys; within one context keys must be unique. */
export const FOOT_ACTIONS: Action[] = ["forward", "back", "left", "right", "sprint", "walk", "crouch", "jump", "interact", "reload", "melee", "throw", "gadget", "wheel", "map", "phone", "shoulder", "holster", "pause", "medkit", "slot1", "slot2", "slot3", "slot4"];
export const VEHICLE_ACTIONS: Action[] = ["forward", "back", "left", "right", "handbrake", "exit", "horn", "camera", "lookback", "radio", "reset", "map", "phone", "pause", "interact"];

export function bindingConflicts(binds: Record<Action, string>): string[] {
  const out: string[] = [];
  for (const ctx of [FOOT_ACTIONS, VEHICLE_ACTIONS]) {
    const seen = new Map<string, Action>();
    for (const a of ctx) {
      const k = binds[a];
      if (seen.has(k)) out.push(`${ACTION_LABEL[seen.get(k)!]} and ${ACTION_LABEL[a]} both use ${k}`);
      else seen.set(k, a);
    }
  }
  return out;
}

export class Input {
  down = new Set<string>();
  pressed = new Set<string>();
  mouseDX = 0; mouseDY = 0;
  lmb = false; rmb = false; lmbPressed = false;
  binds: Record<Action, string>;
  locked = false;
  aimToggle = false; aimLatched = false;
  sprintToggle = false; sprintLatched = false;
  enabled = true;
  listeners: ((code: string) => boolean)[] = [];
  private steer = 0;

  constructor(private canvas: HTMLCanvasElement, binds: Partial<Record<Action, string>>) {
    this.binds = { ...DEFAULT_BINDS, ...binds };
    window.addEventListener("keydown", (e) => {
      for (const l of this.listeners) if (l(e.code)) { e.preventDefault(); return; }
      if (["Tab", "Space", "AltLeft", "ControlLeft", "KeyF", "Escape"].includes(e.code) || e.code.startsWith("Arrow")) e.preventDefault();
      if (!this.down.has(e.code)) this.pressed.add(e.code);
      this.down.add(e.code);
    });
    window.addEventListener("keyup", (e) => { this.down.delete(e.code); });
    window.addEventListener("blur", () => { this.down.clear(); this.lmb = this.rmb = false; });
    canvas.addEventListener("mousedown", (e) => {
      if (!this.enabled) return;
      if (!this.locked) { this.requestLock(); }
      if (e.button === 0) { this.lmb = true; this.lmbPressed = true; }
      if (e.button === 2) { this.rmb = true; if (this.aimToggle) this.aimLatched = !this.aimLatched; }
    });
    window.addEventListener("mouseup", (e) => { if (e.button === 0) this.lmb = false; if (e.button === 2) this.rmb = false; });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    document.addEventListener("pointerlockchange", () => { this.locked = document.pointerLockElement === canvas; });
    window.addEventListener("mousemove", (e) => { if (this.locked) { this.mouseDX += e.movementX; this.mouseDY += e.movementY; } });
  }

  requestLock() { try { const p = this.canvas.requestPointerLock() as unknown as Promise<void> | undefined; p?.catch?.(() => {}); } catch { /* ignore */ } }
  releaseLock() { if (document.pointerLockElement) document.exitPointerLock(); }

  isDown(a: Action) { return this.down.has(this.binds[a]); }
  wasPressed(a: Action) { return this.pressed.has(this.binds[a]); }

  /** Fill the sim input state (accumulating one-shot presses until the sim consumes them). */
  fill(s: InputState, inVehicle: boolean, dt: number) {
    if (!this.enabled) { this.pressed.clear(); this.mouseDX = this.mouseDY = 0; this.lmbPressed = false; s.moveX = s.moveZ = 0; s.throttle = s.brake = s.steer = 0; s.fireHeld = s.aimHeld = false; return; }
    const f = this.isDown("forward") ? 1 : 0, b = this.isDown("back") ? 1 : 0, l = this.isDown("left") ? 1 : 0, r = this.isDown("right") ? 1 : 0;
    s.moveZ = f - b; s.moveX = r - l;
    const mag = Math.hypot(s.moveX, s.moveZ); if (mag > 1) { s.moveX /= mag; s.moveZ /= mag; }
    s.lookDX += this.mouseDX; s.lookDY += this.mouseDY;
    this.mouseDX = this.mouseDY = 0;
    if (this.sprintToggle) { if (this.wasPressed("sprint")) this.sprintLatched = !this.sprintLatched; if (mag < 0.1) this.sprintLatched = false; s.sprint = this.sprintLatched; }
    else s.sprint = this.isDown("sprint");
    s.walk = this.isDown("walk");
    s.aimHeld = this.aimToggle ? this.aimLatched : this.rmb;
    s.fireHeld = this.lmb;
    if (this.lmbPressed) s.firePressed = true;
    this.lmbPressed = false;
    s.interactHeld = this.isDown("interact");
    if (inVehicle) {
      s.throttle = f; s.brake = b;
      const target = r - l;
      // keyboard steering smoothing happens in the vehicle; light filtering here
      this.steer += (target - this.steer) * Math.min(1, dt * 14);
      s.steer = Math.abs(this.steer) < 0.02 ? 0 : this.steer;
      s.handbrake = this.isDown("handbrake");
      s.horn = this.isDown("horn");
      s.lookBack = this.isDown("lookback");
      s.resetHeld = this.isDown("reset");
      if (this.wasPressed("exit")) s.exitPressed = true;
      if (this.wasPressed("camera")) s.camCycle = true;
      if (this.wasPressed("radio")) s.radioNext = true;
      if (this.wasPressed("interact")) s.interactPressed = true;
      if (this.wasPressed("reload")) s.reloadPressed = true;
    } else {
      s.throttle = s.brake = s.steer = 0; s.handbrake = false; s.horn = false; s.lookBack = false; s.resetHeld = false;
      if (this.wasPressed("jump")) s.jumpPressed = true;
      if (this.wasPressed("interact")) s.interactPressed = true;
      if (this.wasPressed("reload")) s.reloadPressed = true;
      if (this.wasPressed("melee")) s.meleePressed = true;
      if (this.wasPressed("throw")) s.throwPressed = true;
      if (this.wasPressed("gadget")) s.gadgetCycle = true;
      if (this.wasPressed("crouch")) s.crouchPressed = true;
      if (this.wasPressed("holster")) s.holsterPressed = true;
      if (this.wasPressed("shoulder")) s.shoulderPressed = true;
      if (this.wasPressed("medkit")) s.medkitPressed = true;
      if (this.wasPressed("slot1")) s.slot = 0;
      if (this.wasPressed("slot2")) s.slot = 1;
      if (this.wasPressed("slot3")) s.slot = 2;
      if (this.wasPressed("slot4")) s.slot = 3;
    }
  }

  endFrame() { this.pressed.clear(); }
}
