// Keyboard and mouse input with Pointer Lock. Mouse deltas are applied 1:1 (no acceleration);
// buttons are sampled once per fixed simulation step.
import { BTN } from '../protocol/types';
import type { Settings } from './settings';

export type Action =
  | 'slot1'
  | 'slot2'
  | 'slot3'
  | 'util0'
  | 'util1'
  | 'util2'
  | 'util3'
  | 'quick'
  | 'drop'
  | 'buy'
  | 'map'
  | 'inspect'
  | 'next'
  | 'prev'
  | 'ready'
  | 'fps'
  | 'escape'
  | 'scoreDown'
  | 'scoreUp'
  | 'click';

const KEY_ACTIONS: Record<string, Action> = {
  Digit1: 'slot1',
  Digit2: 'slot2',
  Digit3: 'slot3',
  Digit4: 'util0',
  Digit5: 'util1',
  Digit6: 'util2',
  Digit7: 'util3',
  KeyQ: 'quick',
  KeyG: 'drop',
  KeyB: 'buy',
  KeyM: 'map',
  KeyF: 'inspect',
  Enter: 'ready',
  F3: 'fps',
};

/** Radians of view rotation per pixel of mouse travel at sensitivity 1.0. */
export const RAD_PER_PIXEL = 0.001;

export class Input {
  yaw = 0;
  pitch = 0;
  /** multiplier applied while scoped (fov ratio x user scope sensitivity) */
  zoomFactor = 1;
  private keys = new Set<string>();
  private mouse = 0;
  private crouchToggle = false;
  private walkToggle = false;
  captured = false;
  /** set by the game: when false, gameplay keys are ignored (menus open) */
  enabled = false;
  onAction: (a: Action) => void = () => {};
  onLockChange: (locked: boolean) => void = () => {};
  /** set true to keep working without Pointer Lock (automation / headless capture) */
  forceCapture = false;
  private lockRequested = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private settings: () => Settings,
  ) {
    window.addEventListener('keydown', (e) => this.keyDown(e));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.mouse = 0;
    });
    // pointer events (not mouse events): they keep firing regardless of how the renderer treats the canvas
    canvas.addEventListener('pointerdown', (e) => {
      if (!this.isCaptured()) {
        this.onAction('click');
        return;
      }
      this.mouse |= 1 << e.button;
      e.preventDefault();
    });
    window.addEventListener('pointerup', (e) => {
      this.mouse &= ~(1 << e.button);
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('mousemove', (e) => {
      if (!this.isCaptured() || !this.enabled) return;
      const s = this.settings().sensitivity * RAD_PER_PIXEL * this.zoomFactor;
      this.yaw += e.movementX * s;
      this.pitch -= e.movementY * s;
      const lim = 1.55;
      if (this.pitch > lim) this.pitch = lim;
      if (this.pitch < -lim) this.pitch = -lim;
      if (this.yaw > Math.PI) this.yaw -= Math.PI * 2;
      if (this.yaw < -Math.PI) this.yaw += Math.PI * 2;
    });
    window.addEventListener(
      'wheel',
      (e) => {
        if (!this.isCaptured() || !this.enabled) return;
        this.onAction(e.deltaY > 0 ? 'next' : 'prev');
      },
      { passive: true },
    );
    document.addEventListener('pointerlockchange', () => {
      this.captured = document.pointerLockElement === this.canvas;
      if (!this.captured) {
        this.keys.clear();
        this.mouse = 0;
      }
      this.onLockChange(this.captured);
    });
    document.addEventListener('pointerlockerror', () => this.onLockChange(false));
  }

  isCaptured(): boolean {
    return this.captured || this.forceCapture;
  }

  requestLock(): void {
    if (this.forceCapture || this.captured) return;
    const now = performance.now();
    if (now - this.lockRequested < 250) return;
    this.lockRequested = now;
    try {
      // raw, unaccelerated deltas where the browser supports them
      const req = this.canvas.requestPointerLock as unknown as (o?: { unadjustedMovement: boolean }) => Promise<void> | undefined;
      const p = req.call(this.canvas, { unadjustedMovement: true });
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          const q = req.call(this.canvas);
          if (q && typeof q.catch === 'function') q.catch(() => this.onLockChange(false));
        });
      }
    } catch {
      this.onLockChange(false);
    }
  }

  releaseLock(): void {
    if (document.pointerLockElement) document.exitPointerLock();
  }

  private keyDown(e: KeyboardEvent): void {
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.code === 'Tab') {
      e.preventDefault();
      if (!e.repeat) this.onAction('scoreDown');
      return;
    }
    if (e.code === 'Escape') {
      this.onAction('escape');
      return;
    }
    // while playing, keep browser shortcuts (Ctrl+S, Ctrl+D, Space scrolling...) from firing on movement keys
    if (this.enabled && this.isCaptured() && !['F5', 'F11', 'F12'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    this.keys.add(e.code);
    const s = this.settings();
    if (s.toggleCrouch && (e.code === 'ControlLeft' || e.code === 'KeyC')) this.crouchToggle = !this.crouchToggle;
    if (s.toggleWalk && e.code === 'ShiftLeft') this.walkToggle = !this.walkToggle;
    const a = KEY_ACTIONS[e.code];
    if (a) this.onAction(a);
  }

  attachKeyUp(): void {
    window.addEventListener('keyup', (e) => {
      if (e.code === 'Tab') this.onAction('scoreUp');
    });
  }

  /** Button bitmask for this simulation step. */
  sample(): number {
    if (!this.enabled || !this.isCaptured()) return 0;
    const k = this.keys;
    const s = this.settings();
    let b = 0;
    if (k.has('KeyW') || k.has('ArrowUp')) b |= BTN.FWD;
    if (k.has('KeyS') || k.has('ArrowDown')) b |= BTN.BACK;
    if (k.has('KeyA') || k.has('ArrowLeft')) b |= BTN.LEFT;
    if (k.has('KeyD') || k.has('ArrowRight')) b |= BTN.RIGHT;
    if (k.has('Space')) b |= BTN.JUMP;
    if (s.toggleCrouch ? this.crouchToggle : k.has('ControlLeft') || k.has('KeyC')) b |= BTN.CROUCH;
    if (s.toggleWalk ? this.walkToggle : k.has('ShiftLeft')) b |= BTN.WALK;
    if (k.has('KeyE')) b |= BTN.USE;
    if (k.has('KeyR')) b |= BTN.RELOAD;
    if (this.mouse & 1) b |= BTN.FIRE;
    if (this.mouse & 4) b |= BTN.ALT;
    return b;
  }

  fireHeld(): boolean {
    return (this.mouse & 1) !== 0 && this.isCaptured();
  }

  /** Programmatic input for automation hooks. */
  setKey(code: string, down: boolean): void {
    if (down) this.keys.add(code);
    else this.keys.delete(code);
  }
  setMouse(button: number, down: boolean): void {
    if (down) this.mouse |= 1 << button;
    else this.mouse &= ~(1 << button);
  }
}
