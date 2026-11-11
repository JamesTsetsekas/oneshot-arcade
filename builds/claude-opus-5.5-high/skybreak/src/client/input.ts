// Keyboard/mouse input with pointer lock. Press latches guarantee short
// taps are seen by the 30Hz simulation even between ticks.

import { Action, getSettings } from './settings';

export class Input {
  down = new Set<string>();
  latched = new Set<string>();
  mouseDown = [false, false, false];
  mouseLatched = [false, false, false];
  dx = 0;
  dy = 0;
  wheel = 0;
  locked = false;
  toggles = { ads: false, crouch: false, sprint: false };
  onKey: ((code: string, e: KeyboardEvent) => void) | null = null;
  onMouse: ((button: number) => void) | null = null;
  private cleanup: (() => void)[] = [];

  constructor(private el: HTMLElement) {
    const kd = (e: KeyboardEvent) => {
      if (e.code === 'Tab' || e.code === 'Space' || (e.code.startsWith('Alt'))) e.preventDefault();
      if (e.repeat) return;
      this.down.add(e.code);
      this.latched.add(e.code);
      const s = getSettings();
      if (s.crouchToggle && e.code === s.keys.crouch) this.toggles.crouch = !this.toggles.crouch;
      if (s.sprintToggle && e.code === s.keys.sprint) this.toggles.sprint = !this.toggles.sprint;
      this.onKey?.(e.code, e);
    };
    const ku = (e: KeyboardEvent) => { this.down.delete(e.code); };
    const md = (e: MouseEvent) => {
      if (!this.locked) return;
      this.mouseDown[e.button] = true;
      this.mouseLatched[e.button] = true;
      if (e.button === 2 && getSettings().adsToggle) this.toggles.ads = !this.toggles.ads;
      if (e.button === 1) e.preventDefault();
      this.onMouse?.(e.button);
    };
    const mu = (e: MouseEvent) => { this.mouseDown[e.button] = false; };
    const mm = (e: MouseEvent) => { if (this.locked) { this.dx += e.movementX; this.dy += e.movementY; } };
    const wh = (e: WheelEvent) => { if (this.locked) this.wheel += Math.sign(e.deltaY); };
    const plc = () => { this.locked = document.pointerLockElement === this.el; if (!this.locked) this.releaseAll(); };
    const blur = () => this.releaseAll();
    const ctx = (e: Event) => e.preventDefault();
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    window.addEventListener('mousedown', md);
    window.addEventListener('mouseup', mu);
    window.addEventListener('mousemove', mm);
    window.addEventListener('wheel', wh, { passive: true });
    window.addEventListener('blur', blur);
    document.addEventListener('pointerlockchange', plc);
    el.addEventListener('contextmenu', ctx);
    this.cleanup.push(() => {
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
      window.removeEventListener('mousedown', md); window.removeEventListener('mouseup', mu);
      window.removeEventListener('mousemove', mm); window.removeEventListener('wheel', wh);
      window.removeEventListener('blur', blur);
      document.removeEventListener('pointerlockchange', plc); el.removeEventListener('contextmenu', ctx);
    });
  }

  releaseAll() {
    this.down.clear();
    this.mouseDown = [false, false, false];
    this.toggles.ads = false;
  }

  requestLock() {
    try {
      const r = (this.el as HTMLElement & { requestPointerLock: (o?: unknown) => Promise<void> | void }).requestPointerLock();
      if (r && typeof (r as Promise<void>).catch === 'function') (r as Promise<void>).catch(() => { /* user gesture required */ });
    } catch { /* unsupported */ }
  }
  exitLock() { if (document.pointerLockElement) document.exitPointerLock(); }

  held(a: Action) { return this.down.has(getSettings().keys[a]); }
  /** held or tapped since last consume */
  active(a: Action) { const k = getSettings().keys[a]; return this.down.has(k) || this.latched.has(k); }
  tapped(a: Action) { return this.latched.has(getSettings().keys[a]); }
  mouse(b: number) { return this.mouseDown[b] || this.mouseLatched[b]; }
  consume() {
    this.latched.clear();
    this.mouseLatched = [false, false, false];
  }
  takeLook() { const r = { dx: this.dx, dy: this.dy }; this.dx = 0; this.dy = 0; return r; }
  takeWheel() { const w = this.wheel; this.wheel = 0; return w; }
  dispose() { this.cleanup.forEach((f) => f()); }
}
