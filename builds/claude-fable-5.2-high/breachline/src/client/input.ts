// client-runtime: keyboard + mouse sampling with Pointer Lock. No acceleration is added to mouse input.
// View angles are owned here (applied per rendered frame, never interpolated) and sampled into commands per tick.
import type { Action, Settings } from '../profile/profile';
import { BTN } from '../sim/player';

const TAP_ACTIONS: Partial<Record<Action, number>> = { jump: BTN.JUMP, reload: BTN.RELOAD, melee: BTN.MELEE, lethal: BTN.LETHAL, tactical: BTN.TACTICAL, supportDeploy: BTN.SUPPORT, ping: BTN.PING };
const DEG = Math.PI / 180;

export interface InputSample { mx: number; mz: number; buttons: number; slot: number }

export class Input {
  yaw = 0;
  pitch = 0;
  /** recoil / flinch offset added on top of the player's own aim */
  kickYaw = 0;
  kickPitch = 0;
  private kickYawT = 0;
  private kickPitchT = 0;
  private settle = 8;
  private sinceKick = 1;
  locked = false;
  slot = 0;
  /** accumulated raw mouse motion since the viewmodel last read it */
  frameDx = 0;
  frameDy = 0;
  sensScale = 1;
  scoreboard = false;
  onLockChange: (locked: boolean) => void = () => {};
  onLockError: () => void = () => {};
  onAction: (a: 'supportSelect' | 'inspect' | 'loadout', n?: number) => void = () => {};
  enabled = false;
  private held = new Set<string>();
  private tapped = 0;
  private mouseL = false;
  private mouseR = false;
  private crouchLatch = false;
  private adsLatch = false;
  private sprintLatch = false;
  private byCode = new Map<string, Action>();
  private settings: Settings;
  private disposers: (() => void)[] = [];

  constructor(private canvas: HTMLCanvasElement, settings: Settings) {
    this.settings = settings;
    this.rebind(settings);
    const on = <K extends keyof DocumentEventMap>(t: EventTarget, type: K | string, fn: (e: never) => void, opts?: AddEventListenerOptions) => {
      t.addEventListener(type, fn as EventListener, opts);
      this.disposers.push(() => t.removeEventListener(type, fn as EventListener, opts));
    };
    on(document, 'keydown', (e: KeyboardEvent) => this.key(e, true));
    on(document, 'keyup', (e: KeyboardEvent) => this.key(e, false));
    on(document, 'mousemove', (e: MouseEvent) => this.move(e));
    on(document, 'mousedown', (e: MouseEvent) => this.mouse(e, true));
    on(document, 'mouseup', (e: MouseEvent) => this.mouse(e, false));
    on(document, 'wheel', (e: WheelEvent) => { if (this.locked && this.enabled && Math.abs(e.deltaY) > 0) this.slot = this.slot ? 0 : 1; }, { passive: true });
    on(document, 'contextmenu', (e: Event) => { if (this.enabled) e.preventDefault(); });
    on(document, 'pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.canvas;
      if (!this.locked) this.clear();
      this.onLockChange(this.locked);
    });
    on(document, 'pointerlockerror', () => this.onLockError());
    on(window, 'blur', () => this.clear());
  }

  rebind(settings: Settings): void {
    this.settings = settings;
    this.byCode.clear();
    for (const [action, code] of Object.entries(settings.binds) as [Action, string][]) this.byCode.set(code, action);
    // convenience aliases that are not rebindable
    if (!this.byCode.has('KeyC')) this.byCode.set('KeyC', 'crouch');
    if (!this.byCode.has('ControlRight')) this.byCode.set('ControlRight', 'crouch');
    if (!this.byCode.has('ShiftRight')) this.byCode.set('ShiftRight', 'sprint');
  }

  requestLock(): void {
    if (document.pointerLockElement === this.canvas) return;
    try {
      const p = (this.canvas.requestPointerLock as (o?: { unadjustedMovement: boolean }) => Promise<void> | void).call(this.canvas, { unadjustedMovement: true });
      if (p && typeof (p as Promise<void>).catch === 'function') (p as Promise<void>).catch(() => { try { const q = this.canvas.requestPointerLock(); if (q && typeof (q as Promise<void>).catch === 'function') (q as Promise<void>).catch(() => this.onLockError()); } catch { this.onLockError(); } });
    } catch { this.onLockError(); }
  }

  exitLock(): void { if (document.pointerLockElement === this.canvas) document.exitPointerLock(); }

  private clear(): void { this.held.clear(); this.mouseL = this.mouseR = false; this.tapped = 0; this.scoreboard = false; this.sprintLatch = false; this.adsLatch = false; }

  private key(e: KeyboardEvent, down: boolean): void {
    if (!this.enabled) return;
    const action = this.byCode.get(e.code);
    if (!this.locked) return;
    // while dead, 1-5 pick the loadout for the next life (the game ignores this when alive)
    if (down && !e.repeat && /^Digit[1-5]$/.test(e.code)) this.onAction('loadout', Number(e.code.slice(5)) - 1);
    if (e.code === 'Tab' || e.code === 'Space' || e.code.startsWith('Control') || e.code === 'KeyG' || e.code === 'KeyF' || e.code === 'KeyR') e.preventDefault();
    if (!action) {
      return;
    }
    if (down) {
      if (e.repeat) return;
      this.held.add(action);
      const tap = TAP_ACTIONS[action];
      if (tap) this.tapped |= tap;
      if (action === 'crouch' && this.settings.crouchToggle) this.crouchLatch = !this.crouchLatch;
      if (action === 'jump' || action === 'sprint') this.crouchLatch = false;
      if (action === 'sprint' && this.settings.sprintToggle) this.sprintLatch = true;
      if (action === 'primary') this.slot = 0;
      if (action === 'sidearm') this.slot = 1;
      if (action === 'supportSelect') this.onAction('supportSelect');
      if (action === 'inspect') this.onAction('inspect');
      if (action === 'scoreboard') this.scoreboard = true;
    } else {
      this.held.delete(action);
      if (action === 'scoreboard') this.scoreboard = false;
    }
  }

  private mouse(e: MouseEvent, down: boolean): void {
    if (!this.enabled || !this.locked) return;
    if (e.button === 0) { this.mouseL = down; if (down) this.tapped |= BTN.FIRE; }
    else if (e.button === 2) {
      if (this.settings.adsToggle) { if (down) this.adsLatch = !this.adsLatch; } else this.mouseR = down;
    }
  }

  private move(e: MouseEvent): void {
    if (!this.locked || !this.enabled) return;
    const dx = e.movementX || 0, dy = e.movementY || 0;
    if (Math.abs(dx) > 600 || Math.abs(dy) > 600) return; // discard browser pointer-lock warp spikes
    const k = 0.022 * DEG * this.settings.sens * this.sensScale;
    this.yaw += dx * k;
    this.pitch -= dy * k * (this.settings.invertY ? -1 : 1);
    const lim = 89 * DEG;
    if (this.pitch > lim) this.pitch = lim; else if (this.pitch < -lim) this.pitch = -lim;
    this.frameDx += dx; this.frameDy += dy;
  }

  /** Recoil / flinch impulse in degrees; settle = recovery rate in deg/s. */
  kick(yawDeg: number, pitchDeg: number, settle: number): void {
    this.kickYawT += yawDeg * DEG;
    this.kickPitchT += pitchDeg * DEG;
    this.settle = settle;
    this.sinceKick = 0;
  }

  /** Per rendered frame: ease the kick in quickly and recover once the trigger rests. */
  frame(dt: number): void {
    this.sinceKick += dt;
    const k = 1 - Math.exp(-38 * dt);
    this.kickYaw += (this.kickYawT - this.kickYaw) * k;
    this.kickPitch += (this.kickPitchT - this.kickPitch) * k;
    if (this.sinceKick > 0.1) {
      const r = Math.exp(-this.settle * 0.75 * dt);
      this.kickYawT *= r; this.kickPitchT *= r;
    }
  }

  get viewYaw(): number { return this.yaw + this.kickYaw; }
  get viewPitch(): number { return Math.max(-1.55, Math.min(1.55, this.pitch + this.kickPitch)); }

  setView(yaw: number, pitch: number): void { this.yaw = yaw; this.pitch = pitch; this.kickYaw = this.kickPitch = this.kickYawT = this.kickPitchT = 0; }
  resetLatches(): void { this.crouchLatch = false; this.adsLatch = false; this.sprintLatch = false; this.slot = 0; }

  sample(): InputSample {
    const h = this.held;
    let mx = 0, mz = 0;
    if (h.has('forward')) mz += 1;
    if (h.has('back')) mz -= 1;
    if (h.has('right')) mx += 1;
    if (h.has('left')) mx -= 1;
    let buttons = this.tapped;
    this.tapped = 0;
    if (this.mouseL) buttons |= BTN.FIRE;
    if (this.mouseR || this.adsLatch) buttons |= BTN.ADS;
    if (mz <= 0) this.sprintLatch = false;
    if (h.has('sprint') || this.sprintLatch) buttons |= BTN.SPRINT;
    if (this.settings.crouchToggle ? this.crouchLatch : h.has('crouch')) buttons |= BTN.CROUCH;
    if (h.has('jump')) buttons |= BTN.JUMP;
    if (h.has('lethal')) buttons |= BTN.LETHAL;
    return { mx, mz, buttons, slot: this.slot };
  }

  dispose(): void { for (const d of this.disposers) d(); this.disposers.length = 0; }
}
