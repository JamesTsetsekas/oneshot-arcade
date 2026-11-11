// Keyboard + gamepad input with remappable bindings. Produces the fixed-step InputFrame for the
// simulation and a separate view-control state for the camera/UI.
import { InputFrame } from '../vehicle/vehicle';
import { clamp } from '../core/math';

export type Action =
  | 'throttle' | 'brake' | 'left' | 'right' | 'handbrake' | 'boost' | 'reset' | 'lookBack' | 'glanceL' | 'glanceR'
  | 'camera' | 'map' | 'pause' | 'horn';

export const ACTION_LABELS: Record<Action, string> = {
  throttle: 'Throttle', brake: 'Brake / Reverse', left: 'Steer left', right: 'Steer right', handbrake: 'Handbrake / Drift',
  boost: 'Tailwind boost', reset: 'Reset (hold)', lookBack: 'Look back', glanceL: 'Glance left', glanceR: 'Glance right',
  camera: 'Cycle camera', map: 'Toggle map', pause: 'Pause', horn: 'Horn',
};
export type Bindings = Record<Action, string[]>;
export const DEFAULT_BINDINGS: Bindings = {
  throttle: ['KeyW', 'ArrowUp'], brake: ['KeyS', 'ArrowDown'], left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'],
  handbrake: ['Space'], boost: ['ShiftLeft', 'ShiftRight'], reset: ['KeyR'], lookBack: ['KeyX'], glanceL: ['KeyQ'], glanceR: ['KeyE'],
  camera: ['KeyC'], map: ['KeyM'], pause: ['Escape', 'KeyP'], horn: ['KeyH'],
};
export function keyLabel(code: string): string {
  return code.replace(/^Key/, '').replace(/^Digit/, '').replace('Arrow', 'Arrow ').replace('ShiftLeft', 'L-Shift').replace('ShiftRight', 'R-Shift').replace('ControlLeft', 'L-Ctrl').replace('ControlRight', 'R-Ctrl');
}

export interface ViewControls {
  lookBack: boolean;
  glance: number; // -1 left, 1 right
  lookX: number; // free-look yaw rate / offset input
  lookY: number;
  dragging: boolean;
}

export class InputManager {
  bindings: Bindings = JSON.parse(JSON.stringify(DEFAULT_BINDINGS));
  steerSensitivity = 1;
  deadZone = 0.14;
  vibration = true;
  gamepadConnected = false;
  gamepadName = '';
  enabled = true;
  /** Fired once per press for UI-level actions. */
  onAction: (a: Action) => void = () => {};
  onGamepadChange: (connected: boolean, name: string) => void = () => {};
  onAnyKey: (() => void) | null = null;
  private keys = new Set<string>();
  private mouseDX = 0;
  private mouseDY = 0;
  private dragging = false;
  private padPrev: boolean[] = [];
  private codeToActions = new Map<string, Action[]>();

  constructor(private canvas: HTMLElement) {
    this.rebuild();
    window.addEventListener('keydown', (e) => {
      if (e.repeat) { if (this.codeToActions.has(e.code)) e.preventDefault(); return; }
      if (this.onAnyKey) { this.onAnyKey(); }
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      const acts = this.codeToActions.get(e.code);
      if (!acts) return;
      if (this.enabled) e.preventDefault();
      this.keys.add(e.code);
      for (const a of acts) this.onAction(a);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
    canvas.addEventListener('mousedown', (e) => { if (e.button === 2 || e.button === 0) this.dragging = true; });
    window.addEventListener('mouseup', () => (this.dragging = false));
    window.addEventListener('mousemove', (e) => { if (this.dragging) { this.mouseDX += e.movementX; this.mouseDY += e.movementY; } });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('gamepadconnected', (e) => { this.gamepadConnected = true; this.gamepadName = e.gamepad.id; this.onGamepadChange(true, e.gamepad.id); });
    window.addEventListener('gamepaddisconnected', () => { this.gamepadConnected = false; this.onGamepadChange(false, ''); });
  }

  rebuild(): void {
    this.codeToActions.clear();
    for (const a of Object.keys(this.bindings) as Action[]) for (const code of this.bindings[a]) {
      if (!this.codeToActions.has(code)) this.codeToActions.set(code, []);
      this.codeToActions.get(code)!.push(a);
    }
  }
  setBinding(a: Action, code: string): void {
    for (const k of Object.keys(this.bindings) as Action[]) this.bindings[k] = this.bindings[k].filter((c) => c !== code);
    this.bindings[a] = [code, ...this.bindings[a].slice(1)];
    this.rebuild();
  }
  private down(a: Action): boolean {
    for (const c of this.bindings[a]) if (this.keys.has(c)) return true;
    return false;
  }
  private pad(): Gamepad | null {
    if (!navigator.getGamepads) return null;
    for (const p of navigator.getGamepads()) if (p && p.connected) return p;
    return null;
  }
  private axis(v: number): number {
    const a = Math.abs(v);
    if (a < this.deadZone) return 0;
    return Math.sign(v) * ((a - this.deadZone) / (1 - this.deadZone));
  }

  /** Sample the driving input for one simulation step. */
  frame(): InputFrame {
    let throttle = this.down('throttle') ? 1 : 0;
    let brake = this.down('brake') ? 1 : 0;
    let steer = (this.down('right') ? 1 : 0) - (this.down('left') ? 1 : 0);
    let handbrake = this.down('handbrake');
    let boost = this.down('boost');
    let reset = this.down('reset');
    const p = this.pad();
    if (p) {
      throttle = Math.max(throttle, p.buttons[7]?.value ?? 0);
      brake = Math.max(brake, p.buttons[6]?.value ?? 0);
      const sx = this.axis(p.axes[0] ?? 0);
      if (Math.abs(sx) > Math.abs(steer)) steer = sx;
      if (p.buttons[14]?.pressed) steer = -1;
      if (p.buttons[15]?.pressed) steer = 1;
      handbrake = handbrake || !!p.buttons[0]?.pressed;
      boost = boost || !!p.buttons[1]?.pressed;
      reset = reset || !!p.buttons[2]?.pressed;
    }
    if (!this.enabled) return { throttle: 0, brake: 0, steer: 0, handbrake: false, boost: false, reset: false };
    return { throttle, brake, steer: clamp(steer * this.steerSensitivity, -1, 1), handbrake, boost, reset };
  }

  /** Sample camera controls and fire edge-triggered gamepad actions. Call once per rendered frame. */
  view(): ViewControls {
    const v: ViewControls = { lookBack: this.down('lookBack'), glance: (this.down('glanceR') ? 1 : 0) - (this.down('glanceL') ? 1 : 0), lookX: this.mouseDX * 0.004, lookY: this.mouseDY * 0.004, dragging: this.dragging };
    this.mouseDX = 0;
    this.mouseDY = 0;
    const p = this.pad();
    if (p) {
      const rx = this.axis(p.axes[2] ?? 0), ry = this.axis(p.axes[3] ?? 0);
      if (rx || ry) { v.lookX += rx * 0.06; v.lookY += ry * 0.04; v.dragging = true; }
      v.lookBack = v.lookBack || !!p.buttons[3]?.pressed;
      const edge = (i: number, a: Action) => {
        const now = !!p.buttons[i]?.pressed;
        if (now && !this.padPrev[i]) this.onAction(a);
        this.padPrev[i] = now;
      };
      edge(9, 'pause');
      edge(12, 'camera');
      edge(13, 'map');
      edge(0, 'handbrake');
    }
    return v;
  }

  rumble(strength: number, ms: number): void {
    if (!this.vibration) return;
    const p = this.pad() as (Gamepad & { vibrationActuator?: { playEffect?: (t: string, o: object) => Promise<unknown> } }) | null;
    try {
      p?.vibrationActuator?.playEffect?.('dual-rumble', { duration: ms, strongMagnitude: clamp(strength, 0, 1), weakMagnitude: clamp(strength * 0.6, 0, 1) })?.catch(() => {});
    } catch { /* unsupported */ }
  }
}
