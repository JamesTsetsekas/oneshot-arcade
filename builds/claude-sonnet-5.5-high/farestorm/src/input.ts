import type { SimInput } from './sim/sim';

export interface InputActions {
  pause: boolean;
  camera: boolean;
  map: boolean;
  restart: boolean;
}

/** Keyboard + gamepad -> SimInput. Edge-triggered UI actions are returned by `takeActions()`. */
export class Input {
  private keys = new Set<string>();
  private pressed = new Set<string>();
  private pad: Gamepad | null = null;
  private padPrev: boolean[] = [];
  deadzone = 0.15;
  padConnected = false;
  onDisconnect: (() => void) | null = null;
  lookBack = false;
  private enabled = true;

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
      if (!e.repeat) this.pressed.add(e.code);
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
    window.addEventListener('gamepadconnected', () => { this.padConnected = true; });
    window.addEventListener('gamepaddisconnected', () => { this.padConnected = false; this.onDisconnect?.(); });
  }

  setEnabled(b: boolean): void {
    this.enabled = b;
    if (!b) this.keys.clear();
  }

  private down(...codes: string[]): boolean {
    return codes.some((c) => this.keys.has(c));
  }

  private readPad(): Gamepad | null {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) if (p && p.connected) return p;
    return null;
  }

  read(): SimInput {
    let throttle = this.down('KeyW', 'ArrowUp') ? 1 : 0;
    let brake = this.down('KeyS', 'ArrowDown') ? 1 : 0;
    let steer = (this.down('KeyD', 'ArrowRight') ? 1 : 0) - (this.down('KeyA', 'ArrowLeft') ? 1 : 0);
    let handbrake = this.down('Space');
    let boost = this.down('ShiftLeft', 'ShiftRight');
    const resetHeld = this.down('KeyR');
    this.lookBack = this.down('KeyX');
    const p = this.readPad();
    this.pad = p;
    if (p) {
      this.padConnected = true;
      const dz = this.deadzone;
      const ax = p.axes[0] ?? 0;
      const sx = Math.abs(ax) < dz ? 0 : Math.sign(ax) * ((Math.abs(ax) - dz) / (1 - dz));
      if (sx !== 0) steer = sx;
      const rt = p.buttons[7]?.value ?? 0, lt = p.buttons[6]?.value ?? 0;
      if (rt > 0.05) throttle = Math.max(throttle, rt);
      if (lt > 0.05) brake = Math.max(brake, lt);
      if (p.buttons[0]?.pressed) handbrake = true;
      if (p.buttons[1]?.pressed) boost = true;
      if (p.buttons[3]?.pressed) this.lookBack = true;
    }
    return { throttle, brake, steer, handbrake, boost, resetHeld };
  }

  takeActions(): InputActions {
    const a: InputActions = {
      pause: this.pressed.has('Escape') || this.pressed.has('KeyP'),
      camera: this.pressed.has('KeyC'),
      map: this.pressed.has('KeyM'),
      restart: false,
    };
    // gamepad edge buttons
    if (this.pad) {
      const b = this.pad.buttons.map((x) => x.pressed);
      const edge = (i: number) => !!b[i] && !this.padPrev[i];
      if (edge(9)) a.pause = true;
      if (edge(8) || edge(14)) a.map = true;
      if (edge(12) || edge(13)) a.camera = true;
      this.padPrev = b;
    }
    this.pressed.clear();
    return a;
  }

  /** was this key newly pressed this frame (for menus / results) */
  wasPressed(code: string): boolean {
    return this.pressed.has(code);
  }
  clearPressed(): void {
    this.pressed.clear();
  }
}
