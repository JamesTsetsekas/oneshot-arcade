// Keyboard + mouse capture with rebindable actions, pointer lock and hold/toggle options.
import { Settings, Action } from './settings';
import type { PlayerInput } from '../character/player';

export class Input {
  private down = new Set<string>(); private pressed = new Set<string>();
  mouseDX = 0; mouseDY = 0; mouseL = false; mouseR = false; private mouseLPressed = false; wheel = 0;
  locked = false; enabled = false;
  private aimToggle = false; private sprintToggle = false;
  /** UI-level key presses (map, phone, pause, camera...) delivered once. */
  onAction: ((a: Action | 'pause') => void) | null = null;
  /** When set, the next key press is captured for rebinding instead of being handled. */
  capture: ((code: string) => void) | null = null;

  constructor(private canvas: HTMLCanvasElement, public settings: Settings) {
    window.addEventListener('keydown', (e) => {
      if (this.capture) { e.preventDefault(); const c = this.capture; this.capture = null; if (e.code !== 'Escape') c(e.code); return; }
      if (e.code === 'Escape') { this.onAction?.('pause'); return; }
      if (!this.enabled) return;
      if (e.code === 'Tab' || e.code === 'Space' || e.code.startsWith('Arrow') || (e.ctrlKey && this.locked)) e.preventDefault();
      if (!e.repeat) {
        this.pressed.add(e.code);
        for (const a of ['map', 'phone', 'camera', 'wheel', 'radio'] as Action[]) if (this.settings.binds[a] === e.code) this.onAction?.(a);
        if (this.settings.toggleSprint && e.code === this.settings.binds.sprint) this.sprintToggle = !this.sprintToggle;
      }
      this.down.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.down.delete(e.code));
    window.addEventListener('blur', () => { this.down.clear(); this.mouseL = this.mouseR = false; });
    canvas.addEventListener('mousedown', (e) => {
      if (!this.enabled) return;
      if (!this.locked) { this.requestLock(); return; } // the capturing click never fires a weapon
      if (e.button === 0) { this.mouseL = true; this.mouseLPressed = true; }
      if (e.button === 2) { this.mouseR = true; if (this.settings.toggleAim) this.aimToggle = !this.aimToggle; }
    });
    window.addEventListener('mouseup', (e) => { if (e.button === 0) this.mouseL = false; if (e.button === 2) this.mouseR = false; });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('mousemove', (e) => { if (this.locked && this.enabled) { this.mouseDX += e.movementX; this.mouseDY += e.movementY; } });
    window.addEventListener('wheel', (e) => { if (this.enabled) this.wheel += Math.sign(e.deltaY); }, { passive: true });
    document.addEventListener('pointerlockchange', () => { this.locked = document.pointerLockElement === this.canvas; this.onLockChange?.(this.locked); });
  }
  onLockChange: ((locked: boolean) => void) | null = null;
  requestLock() { try { const r = this.canvas.requestPointerLock() as unknown; if (r && typeof (r as Promise<void>).catch === 'function') (r as Promise<void>).catch(() => undefined); } catch { /* headless / denied */ } }
  releaseLock() { if (document.pointerLockElement) document.exitPointerLock(); }
  reset() { this.down.clear(); this.pressed.clear(); this.mouseL = this.mouseR = false; this.mouseLPressed = false; this.aimToggle = false; this.sprintToggle = false; }
  private held(a: Action) { return this.down.has(this.settings.binds[a]); }
  private hit(a: Action) { return this.pressed.has(this.settings.binds[a]); }

  /** Write the current state into the simulation input. Edge flags are only ever raised here; the sim clears them. */
  apply(inp: PlayerInput, inVehicle: boolean) {
    const b = this.settings;
    inp.moveZ = (this.held('forward') || this.down.has('ArrowUp') ? 1 : 0) - (this.held('back') || this.down.has('ArrowDown') ? 1 : 0);
    inp.moveX = (this.held('right') || this.down.has('ArrowRight') ? 1 : 0) - (this.held('left') || this.down.has('ArrowLeft') ? 1 : 0);
    if (inp.moveZ === 0 && inp.moveX === 0) this.sprintToggle = false;
    inp.sprint = b.toggleSprint ? this.sprintToggle : this.held('sprint') || this.down.has('ShiftRight');
    inp.crouch = this.held('crouch') || this.down.has('ControlRight');
    inp.handbrake = inVehicle && this.held('jump');
    inp.horn = inVehicle && this.held('holster');
    inp.interactHeld = this.held('interact'); inp.resetHeld = inVehicle && this.held('reload');
    inp.fire = !inVehicle && this.mouseL && this.locked;
    inp.aim = !inVehicle && (b.toggleAim ? this.aimToggle : this.mouseR);
    if (this.hit('interact')) inp.interact = true;
    if (!inVehicle) {
      if (this.hit('jump')) inp.jump = true;
      if (this.hit('action')) inp.melee = true;
      if (this.hit('reload')) inp.reload = true;
      if (this.hit('gadget')) inp.gadget = true;
      if (this.hit('gadgetCycle')) inp.gadgetCycle = true;
      if (this.hit('holster')) inp.holster = true;
      if (this.hit('slot1')) inp.slot = 1; else if (this.hit('slot2')) inp.slot = 2; else if (this.hit('slot3')) inp.slot = 3;
      if (this.mouseLPressed && this.locked) inp.firePressed = true;
      if (this.wheel !== 0) inp.slot = this.wheel > 0 ? 3 : 1;
    } else if (this.hit('action')) inp.enterExit = true;
    if (this.hit('medkit')) inp.medkit = true;
    this.pressed.clear(); this.mouseLPressed = false; this.wheel = 0;
  }
  lookBackHeld() { return this.held('shoulder'); }
  shoulderHit() { return this.pressed.has(this.settings.binds.shoulder); }
  takeMouse(): [number, number] { const r: [number, number] = [this.mouseDX, this.mouseDY]; this.mouseDX = 0; this.mouseDY = 0; return r; }
}
