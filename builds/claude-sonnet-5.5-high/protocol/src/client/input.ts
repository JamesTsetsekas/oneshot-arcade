// Keyboard / mouse input with Pointer Lock raw mouse look and an edge-triggered action queue.
// View angles are owned by the client (applied every frame for zero aim latency) and sent with every input command.

import { DEG } from '../sim/math';
import type { InputCmd } from '../sim/types';
import type { Settings } from './settings';

export interface InputActions {
  buy: boolean;
  scoreboard: boolean;
  map: boolean;
  pause: boolean;
  cycleSpectate: number;
}

export class InputState {
  yaw = 0;
  pitch = 0;
  keys = new Set<string>();
  buttons = new Set<number>();
  locked = false;
  private edges: { reload?: boolean; drop?: boolean; quick?: boolean; inspect?: boolean; select?: InputCmd['select'] } = {};
  private wheel = 0;
  private crouchToggle = false;
  private walkToggle = false;
  onPointerLockChange?: (locked: boolean) => void;
  onKeyAction?: (code: string, down: boolean) => void;
  onWheelSpectate?: () => void;
  /** Mouse movement since the last frame (cosmetic weapon sway). */
  swayX = 0;
  swayY = 0;
  scopeSens = 1;
  enabled = true;
  /** While true (buy menu open) digit keys go to the menu instead of weapon selection, and keys work without pointer lock. */
  captureDigits = false;
  captureWithoutLock = false;
  /** Counts accumulated while pointer locked; consumed by the game each frame. */
  private pendingDX = 0;
  private pendingDY = 0;

  constructor(private canvas: HTMLElement, private settings: () => Settings) {
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.canvas;
      if (!this.locked) { this.buttons.clear(); }
      this.onPointerLockChange?.(this.locked);
    });
    document.addEventListener('mousemove', (e) => {
      if (!this.locked || !this.enabled) return;
      this.pendingDX += e.movementX; this.pendingDY += e.movementY;
    });
    document.addEventListener('mousedown', (e) => {
      if (!this.locked) return;
      this.buttons.add(e.button);
      e.preventDefault();
    });
    document.addEventListener('mouseup', (e) => { this.buttons.delete(e.button); });
    document.addEventListener('contextmenu', (e) => { if (this.locked) e.preventDefault(); });
    document.addEventListener('wheel', (e) => {
      if (!this.locked) return;
      this.wheel += Math.sign(e.deltaY);
      e.preventDefault();
    }, { passive: false });
    window.addEventListener('keydown', (e) => this.keyDown(e));
    window.addEventListener('keyup', (e) => this.keyUp(e));
    window.addEventListener('blur', () => { this.keys.clear(); this.buttons.clear(); });
  }

  lock(): void {
    try {
      const p = (this.canvas as any).requestPointerLock({ unadjustedMovement: true });
      if (p && typeof p.catch === 'function') p.catch(() => { try { this.canvas.requestPointerLock(); } catch { /* ignore */ } });
    } catch {
      try { this.canvas.requestPointerLock(); } catch { /* ignore */ }
    }
  }

  unlock(): void { if (document.pointerLockElement) document.exitPointerLock(); }

  private keyDown(e: KeyboardEvent): void {
    if (!this.locked && !this.captureWithoutLock) { this.onKeyAction?.(e.code, true); return; }
    if (e.repeat) { if (e.code === 'Tab') e.preventDefault(); return; }
    if (['Tab', 'Space', 'ControlLeft', 'AltLeft', 'F5', 'F1'].includes(e.code) || e.code.startsWith('Digit')) e.preventDefault();
    this.keys.add(e.code);
    const s = this.settings();
    switch (e.code) {
      case 'KeyR': this.edges.reload = true; break;
      case 'KeyG': this.edges.drop = true; break;
      case 'KeyQ': this.edges.quick = true; break;
      case 'KeyF': this.edges.inspect = true; break;
      case 'Digit1': if (!this.captureDigits) this.edges.select = 'primary'; break;
      case 'Digit2': if (!this.captureDigits) this.edges.select = 'secondary'; break;
      case 'Digit3': if (!this.captureDigits) this.edges.select = 'tool'; break;
      case 'Digit4': if (!this.captureDigits) this.edges.select = 'util0'; break;
      case 'Digit5': if (!this.captureDigits) this.edges.select = 'util1'; break;
      case 'Digit6': if (!this.captureDigits) this.edges.select = 'util2'; break;
      case 'Digit7': if (!this.captureDigits) this.edges.select = 'util3'; break;
      case 'ControlLeft': case 'KeyC': if (!s.holdCrouch) this.crouchToggle = !this.crouchToggle; break;
      case 'ShiftLeft': if (!s.holdWalk) this.walkToggle = !this.walkToggle; break;
    }
    this.onKeyAction?.(e.code, true);
  }

  private keyUp(e: KeyboardEvent): void {
    this.keys.delete(e.code);
    this.onKeyAction?.(e.code, false);
  }

  /** Apply accumulated mouse deltas to the view. Called every rendered frame. */
  applyLook(extraSensMul = 1): void {
    const s = this.settings();
    const k = s.sensitivity * 0.022 * DEG * extraSensMul;
    this.yaw -= this.pendingDX * k;
    this.pitch -= this.pendingDY * k;
    this.pitch = Math.max(-1.5, Math.min(1.5, this.pitch));
    this.swayX = this.pendingDX; this.swayY = this.pendingDY;
    this.pendingDX = 0; this.pendingDY = 0;
    // keep yaw bounded
    if (this.yaw > Math.PI) this.yaw -= Math.PI * 2;
    if (this.yaw < -Math.PI) this.yaw += Math.PI * 2;
  }

  /** Sample the current input into a command (without seq / viewTick). Consumes edge actions. */
  sample(frozen: boolean): Omit<InputCmd, 'seq' | 'viewTick'> {
    const s = this.settings();
    const k = this.keys;
    const crouchHeld = k.has('ControlLeft') || k.has('KeyC');
    const crouch = s.holdCrouch ? crouchHeld : this.crouchToggle;
    const walk = s.holdWalk ? k.has('ShiftLeft') : this.walkToggle;
    let moveX = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0);
    let moveZ = (k.has('KeyW') ? 1 : 0) - (k.has('KeyS') ? 1 : 0);
    if (frozen) { moveX = 0; moveZ = 0; }
    const cmd: Omit<InputCmd, 'seq' | 'viewTick'> = {
      moveX, moveZ, yaw: this.yaw, pitch: this.pitch,
      fire: !frozen && this.buttons.has(0), alt: !frozen && this.buttons.has(2),
      jump: !frozen && k.has('Space'), crouch, walk, use: k.has('KeyE'),
    };
    if (this.edges.reload) cmd.reload = true;
    if (this.edges.drop) cmd.drop = true;
    if (this.edges.quick) cmd.quick = true;
    if (this.edges.inspect) cmd.inspect = true;
    if (this.edges.select) cmd.select = this.edges.select;
    if (this.wheel !== 0) { cmd.select = this.wheel > 0 ? 'next' : 'prev'; this.wheel = 0; this.onWheelSpectate?.(); }
    this.edges = {};
    return cmd;
  }

  /** Whether a key is held (for HUD toggles). */
  held(code: string): boolean { return this.keys.has(code); }
}
