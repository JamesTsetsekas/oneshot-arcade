import { emptyInput } from '../sim/types';
import type { InputFrame } from '../sim/types';
import type { Settings } from '../core/settings';

export type Action =
  | 'forward' | 'back' | 'left' | 'right' | 'sprint' | 'crouch' | 'jump' | 'interact' | 'exit' | 'reload' | 'throwItem' | 'holster' | 'swap'
  | 'horn' | 'camCycle' | 'lookBack' | 'heal' | 'map' | 'phone' | 'radio' | 'cycleWeapon' | 'pause';

export const ACTION_LABELS: Record<Action, string> = {
  forward: 'Move forward / throttle', back: 'Move back / brake', left: 'Move left / steer left', right: 'Move right / steer right', sprint: 'Sprint', crouch: 'Crouch',
  jump: 'Jump / vault / handbrake', interact: 'Interact / enter vehicle', exit: 'Melee on foot / exit vehicle', reload: 'Reload', throwItem: 'Throw gadget', holster: 'Holster',
  swap: 'Shoulder swap', horn: 'Horn', camCycle: 'Vehicle camera', lookBack: 'Look back', heal: 'Use medkit', map: 'Map', phone: 'Phone', radio: 'Radio station', cycleWeapon: 'Next weapon', pause: 'Pause',
};

export const DEFAULT_BINDINGS: Record<Action, string> = {
  forward: 'KeyW', back: 'KeyS', left: 'KeyA', right: 'KeyD', sprint: 'ShiftLeft', crouch: 'ControlLeft', jump: 'Space', interact: 'KeyE', exit: 'KeyF', reload: 'KeyR',
  throwItem: 'KeyG', holster: 'KeyH', swap: 'KeyX', horn: 'KeyH', camCycle: 'KeyC', lookBack: 'KeyX', heal: 'KeyZ', map: 'KeyM', phone: 'KeyP', radio: 'KeyT', cycleWeapon: 'Tab', pause: 'Escape',
};

const BIND_KEY = 'meridian.bindings.v1';

export function loadBindings(): Record<Action, string> {
  try {
    const raw = localStorage.getItem(BIND_KEY);
    if (raw) return { ...DEFAULT_BINDINGS, ...(JSON.parse(raw) as Partial<Record<Action, string>>) };
  } catch { /* ignore */ }
  return { ...DEFAULT_BINDINGS };
}
export function saveBindings(b: Record<Action, string>): void {
  try { localStorage.setItem(BIND_KEY, JSON.stringify(b)); } catch { /* ignore */ }
}

export class Input {
  bindings = loadBindings();
  private down = new Set<string>();
  private pressed = new Set<string>();
  private mouseDown = new Set<number>();
  private mousePressed = new Set<number>();
  private dx = 0;
  private dy = 0;
  private wheel = 0;
  private aimToggled = false;
  locked = false;
  onPauseKey: (() => void) | null = null;
  onKey: ((code: string, e: KeyboardEvent) => boolean) | null = null;
  rebinding: ((code: string) => void) | null = null;
  enabled = true;

  attach(canvas: HTMLCanvasElement): void {
    window.addEventListener('keydown', (e) => {
      if (this.rebinding) { e.preventDefault(); const cb = this.rebinding; this.rebinding = null; cb(e.code); return; }
      if (this.onKey && this.onKey(e.code, e)) { e.preventDefault(); return; }
      if (!this.enabled) return;
      if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'F1', 'F5'].includes(e.code) || (e.code.startsWith('Key') && !e.ctrlKey && !e.metaKey)) e.preventDefault();
      if (!e.repeat) this.pressed.add(e.code);
      this.down.add(e.code);
    });
    window.addEventListener('keyup', (e) => { this.down.delete(e.code); });
    window.addEventListener('blur', () => { this.down.clear(); this.mouseDown.clear(); });
    canvas.addEventListener('mousedown', (e) => {
      if (!this.enabled) return;
      this.mouseDown.add(e.button);
      this.mousePressed.add(e.button);
      if (!this.locked) canvas.requestPointerLock?.();
    });
    window.addEventListener('mouseup', (e) => { this.mouseDown.delete(e.button); });
    window.addEventListener('mousemove', (e) => { if (this.locked && this.enabled) { this.dx += e.movementX; this.dy += e.movementY; } });
    window.addEventListener('wheel', (e) => { if (this.enabled && this.locked) this.wheel += Math.sign(e.deltaY); }, { passive: true });
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === canvas;
      if (!this.locked && this.enabled) this.onPauseKey?.();
    });
  }

  requestLock(canvas: HTMLCanvasElement): void { try { canvas.requestPointerLock?.(); } catch { /* ignore */ } }

  isDown(a: Action): boolean { return this.down.has(this.bindings[a]); }
  wasPressed(a: Action): boolean { return this.pressed.has(this.bindings[a]); }
  rawPressed(code: string): boolean { return this.pressed.has(code); }

  /** Build one frame of input. Edge-triggered flags stay latched until endFrame(). */
  build(settings: Settings, inVehicle: boolean): InputFrame {
    const f = emptyInput();
    const d = (a: Action) => this.isDown(a);
    const p = (a: Action) => this.wasPressed(a);
    f.moveY = (d('forward') ? 1 : 0) - (d('back') ? 1 : 0);
    f.moveX = (d('right') ? 1 : 0) - (d('left') ? 1 : 0);
    f.throttle = f.moveY;
    f.steer = f.moveX;
    f.sprint = d('sprint');
    f.crouch = d('crouch');
    f.jump = p('jump');
    f.handbrake = d('jump');
    f.interact = p('interact');
    f.exit = p('exit');
    f.reload = p('reload');
    f.throwItem = p('throwItem');
    f.holster = !inVehicle && p('holster');
    f.horn = inVehicle && d('horn');
    f.swap = !inVehicle && p('swap');
    f.lookBack = inVehicle && d('lookBack');
    f.camCycle = inVehicle && p('camCycle');
    f.heal = p('heal');
    f.fire = this.mouseDown.has(0);
    f.firePressed = this.mousePressed.has(0);
    if (settings.toggleAim) { if (this.mousePressed.has(2)) this.aimToggled = !this.aimToggled; f.aim = this.aimToggled; }
    else f.aim = this.mouseDown.has(2);
    f.cycle = p('cycleWeapon') ? 1 : this.wheel;
    const digits = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'];
    f.select = digits.findIndex((c) => this.pressed.has(c));
    const sens = 0.0022 * settings.sensitivity;
    f.lookDX = this.dx * sens;
    f.lookDY = this.dy * sens * (settings.invertY ? -1 : 1);
    return f;
  }

  endFrame(): void {
    this.pressed.clear();
    this.mousePressed.clear();
    this.dx = 0;
    this.dy = 0;
    this.wheel = 0;
  }

  /** Release held state when opening menus. */
  reset(): void { this.down.clear(); this.mouseDown.clear(); this.pressed.clear(); this.mousePressed.clear(); this.dx = this.dy = this.wheel = 0; this.aimToggled = false; }
}
