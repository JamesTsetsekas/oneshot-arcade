// Raw keyboard/mouse input with Pointer Lock. Mouse deltas are applied with no
// acceleration; button presses between ticks are latched so taps never drop.

import { BTN, type SelectReq } from '../protocol/messages';
import { DEG, clamp } from '../sim/math';
import type { Action, Settings } from './settings';

export class InputState {
  yaw = 0;
  pitch = 0;
  private held = 0;
  private latched = 0;
  private selectQueue: SelectReq[] = [];
  private keys = new Set<string>();
  private crouchToggled = false;
  private walkToggled = false;
  locked = false;
  enabled = true;
  /** UI-level actions (buy, scoreboard...) */
  onAction: (a: Action, down: boolean) => void = () => {};
  onLockChange: (locked: boolean) => void = () => {};
  zoomScale = 1;
  private canvas: HTMLElement;
  private settings: Settings;
  private codeToAction = new Map<string, Action>();
  private disposers: (() => void)[] = [];

  constructor(canvas: HTMLElement, settings: Settings) {
    this.canvas = canvas;
    this.settings = settings;
    this.rebind(settings);
    const on = <K extends keyof DocumentEventMap>(t: K, f: (e: DocumentEventMap[K]) => void, opts?: AddEventListenerOptions) => {
      document.addEventListener(t, f as EventListener, opts);
      this.disposers.push(() => document.removeEventListener(t, f as EventListener, opts));
    };
    on('keydown', (e) => this.key(e, true));
    on('keyup', (e) => this.key(e, false));
    on('mousemove', (e) => this.mouseMove(e));
    on('mousedown', (e) => this.mouse(e, true));
    on('mouseup', (e) => this.mouse(e, false));
    on('wheel', (e) => {
      if (!this.locked) return;
      this.selectQueue.push(e.deltaY > 0 ? 'next' : 'prev');
    }, { passive: true });
    on('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.canvas;
      if (!this.locked) {
        this.held = 0;
        this.keys.clear();
      }
      this.onLockChange(this.locked);
    });
    on('contextmenu', (e) => {
      if (this.locked) e.preventDefault();
    });
  }

  rebind(s: Settings): void {
    this.settings = s;
    this.codeToAction.clear();
    for (const [a, code] of Object.entries(s.binds)) this.codeToAction.set(code, a as Action);
  }

  requestLock(): void {
    try {
      const r = (this.canvas as HTMLCanvasElement).requestPointerLock?.({ unadjustedMovement: true } as never) as unknown;
      if (r && typeof (r as Promise<void>).catch === 'function') {
        (r as Promise<void>).catch(() => {
          try {
            this.canvas.requestPointerLock();
          } catch {
            /* ignore */
          }
        });
      }
    } catch {
      try {
        this.canvas.requestPointerLock();
      } catch {
        /* ignore */
      }
    }
  }

  exitLock(): void {
    if (document.pointerLockElement) document.exitPointerLock();
  }

  dispose(): void {
    this.disposers.forEach((d) => d());
  }

  private mouseMove(e: MouseEvent): void {
    if (!this.locked || !this.enabled) return;
    const k = this.settings.sensitivity * 0.022 * DEG * this.zoomScale;
    this.yaw += e.movementX * k;
    this.pitch += e.movementY * k * (this.settings.invertY ? -1 : 1);
    this.pitch = clamp(this.pitch, -89 * DEG, 89 * DEG);
  }

  private mouse(e: MouseEvent, down: boolean): void {
    if (!this.locked) return;
    const bit = e.button === 0 ? BTN.FIRE : e.button === 2 ? BTN.ALT : 0;
    if (!bit) return;
    if (down) {
      this.held |= bit;
      this.latched |= bit;
    } else this.held &= ~bit;
  }

  private key(e: KeyboardEvent, down: boolean): void {
    const a = this.codeToAction.get(e.code);
    if (e.code === 'Tab' || (a && this.locked)) e.preventDefault();
    if (!a) return;
    if (down && e.repeat) return;
    if (!this.enabled && !['buy', 'scoreboard', 'map'].includes(a)) return;
    if (down) this.keys.add(e.code);
    else this.keys.delete(e.code);
    const bitMap: Partial<Record<Action, number>> = {
      forward: BTN.FWD, back: BTN.BACK, left: BTN.LEFT, right: BTN.RIGHT, jump: BTN.JUMP, reload: BTN.RELOAD, use: BTN.USE, inspect: BTN.INSPECT,
    };
    const bit = bitMap[a];
    if (bit) {
      if (down) {
        this.held |= bit;
        this.latched |= bit;
      } else this.held &= ~bit;
    }
    if (a === 'crouch') {
      if (this.settings.toggleCrouch) {
        if (down) this.crouchToggled = !this.crouchToggled;
      } else this.crouchToggled = down;
      if (down) this.latched |= BTN.CROUCH;
    }
    if (a === 'walk') {
      if (this.settings.toggleWalk) {
        if (down) this.walkToggled = !this.walkToggled;
      } else this.walkToggled = down;
    }
    if (down) {
      const sel: Partial<Record<Action, SelectReq>> = { primary: 'primary', secondary: 'secondary', tool: 'tool', util1: 'util0', util2: 'util1', util3: 'util2', util4: 'util3', quickSwitch: 'last' };
      const s = sel[a];
      if (s && this.locked) this.selectQueue.push(s);
    }
    this.onAction(a, down);
  }

  /** Sample buttons for one tick. */
  sample(): { buttons: number; select: SelectReq | null } {
    let b = this.held | this.latched;
    if (this.crouchToggled) b |= BTN.CROUCH;
    else b &= ~BTN.CROUCH;
    if (this.walkToggled) b |= BTN.WALK;
    this.latched = 0;
    if (!this.enabled) b = 0;
    return { buttons: b, select: this.selectQueue.shift() ?? null };
  }

  clearHeld(): void {
    this.held = 0;
    this.latched = 0;
    this.crouchToggled = false;
    this.walkToggled = false;
  }
}
