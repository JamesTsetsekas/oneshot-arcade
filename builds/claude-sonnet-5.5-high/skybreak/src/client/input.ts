/** Keyboard/mouse -> PlayerInput. Single-frame presses are latched so a 30 Hz tick never misses them. */
import { emptyInput, type PlayerInput } from '../sim/types';
import type { Keybinds, Settings } from './settings';

export class InputController {
  private down = new Set<string>();
  yaw = 0;
  pitch = 0;
  locked = false;
  private mouse = [false, false, false];
  private latch = { jump: false, fire: false, interact: false, reload: false, drop: false, melee: false, swap: false, throwItem: false, deploy: false };
  private slotLatch = -1;
  private cycleLatch = 0;
  private adsToggled = false;
  private sprintToggled = false;
  private crouchToggled = false;
  enabled = true;
  onToggleMap: () => void = () => {};
  onToggleInventory: () => void = () => {};
  onPing: () => void = () => {};
  onEscape: () => void = () => {};
  onLockChange: (locked: boolean) => void = () => {};
  onAnyKey: (code: string) => void = () => {};
  onClick: () => void = () => {};
  overlayOpen = false; // when true, game does not consume mouse look / fire
  moveWhileUnlocked = false; // map/inventory open: keep moving without pointer lock
  private mx = 0;
  private my = 0;

  constructor(private canvas: HTMLCanvasElement, private settings: Settings) {
    window.addEventListener('keydown', (e) => this.keyDown(e));
    window.addEventListener('keyup', (e) => this.keyUp(e));
    window.addEventListener('blur', () => { this.down.clear(); this.mouse = [false, false, false]; });
    canvas.addEventListener('mousedown', (e) => this.mouseDown(e));
    window.addEventListener('mouseup', (e) => this.mouseUp(e));
    window.addEventListener('mousemove', (e) => this.mouseMove(e));
    canvas.addEventListener('wheel', (e) => { if (this.locked && !this.overlayOpen) { this.cycleLatch = e.deltaY > 0 ? 1 : -1; e.preventDefault(); } }, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === canvas;
      if (!this.locked) { this.mouse = [false, false, false]; }
      this.onLockChange(this.locked);
    });
  }

  requestLock(): void {
    try {
      const r = this.canvas.requestPointerLock() as unknown as Promise<void> | undefined;
      if (r && typeof r.catch === 'function') r.catch(() => {});
    } catch { /* pointer lock unavailable */ }
  }
  exitLock(): void { if (document.pointerLockElement) document.exitPointerLock(); }

  private keyDown(e: KeyboardEvent): void {
    if (e.repeat) { if (this.locked) e.preventDefault(); return; }
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return;
    this.onAnyKey(e.code);
    if (e.code === 'Escape') { this.onEscape(); return; }
    if (this.locked || this.enabled) {
      if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ControlLeft'].includes(e.code)) e.preventDefault();
    }
    this.down.add(e.code);
    if (!this.enabled) return;
    const k = this.settings.keys;
    if (e.code === k.jump) this.latch.jump = true;
    if (e.code === k.interact) this.latch.interact = true;
    if (e.code === k.reload) this.latch.reload = true;
    if (e.code === k.drop) this.latch.drop = true;
    if (e.code === k.melee) this.latch.melee = true;
    if (e.code === k.swapShoulder) this.latch.swap = true;
    if (e.code === k.throwItem) this.latch.throwItem = true;
    if (e.code === k.deploy) this.latch.deploy = true;
    if (e.code === k.map) this.onToggleMap();
    if (e.code === k.inventory) this.onToggleInventory();
    const slots: (keyof Keybinds)[] = ['slot1', 'slot2', 'slot3', 'slot4', 'slot5'];
    slots.forEach((s, i) => { if (e.code === k[s]) this.slotLatch = i; });
    if (this.settings.sprintToggle && e.code === k.sprint) this.sprintToggled = !this.sprintToggled;
    if (this.settings.crouchToggle && (e.code === k.crouch || e.code === 'KeyC')) this.crouchToggled = !this.crouchToggled;
  }
  private keyUp(e: KeyboardEvent): void { this.down.delete(e.code); }

  private mouseDown(e: MouseEvent): void {
    this.onClick();
    if (!this.locked || this.overlayOpen) return;
    this.mouse[e.button] = true;
    if (e.button === 0) this.latch.fire = true;
    if (e.button === 2 && this.settings.adsToggle) this.adsToggled = !this.adsToggled;
    if (e.button === 1) { this.onPing(); e.preventDefault(); }
  }
  private mouseUp(e: MouseEvent): void { this.mouse[e.button] = false; }
  private mouseMove(e: MouseEvent): void {
    if (!this.locked || this.overlayOpen) return;
    this.mx += e.movementX; this.my += e.movementY;
  }

  /** Apply accumulated mouse movement; called once per render frame. */
  applyLook(ads: boolean): void {
    const s = this.settings;
    const sens = 0.0022 * s.sens * (ads ? s.adsSens : 1);
    this.yaw -= this.mx * sens;
    this.pitch -= this.my * sens * (s.invertY ? -1 : 1);
    this.mx = 0; this.my = 0;
    this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));
    while (this.yaw > Math.PI) this.yaw -= Math.PI * 2;
    while (this.yaw < -Math.PI) this.yaw += Math.PI * 2;
  }

  held(action: keyof Keybinds): boolean {
    return this.down.has(this.settings.keys[action]);
  }

  adsHeld(): boolean {
    if (!this.locked || this.overlayOpen) return false;
    return this.settings.adsToggle ? this.adsToggled : this.mouse[2];
  }
  resetToggles(): void { this.adsToggled = false; this.sprintToggled = false; this.crouchToggled = false; }

  build(): PlayerInput {
    const i = emptyInput();
    i.yaw = this.yaw; i.pitch = this.pitch;
    if (!this.enabled) return i;
    const active = (this.locked && !this.overlayOpen) || this.moveWhileUnlocked;
    if (active) {
      i.moveF = (this.held('forward') ? 1 : 0) - (this.held('back') ? 1 : 0);
      i.moveR = (this.held('right') ? 1 : 0) - (this.held('left') ? 1 : 0);
      i.jump = this.held('jump') || this.latch.jump;
      i.sprint = this.settings.sprintToggle ? this.sprintToggled : this.held('sprint');
      i.crouch = this.settings.crouchToggle ? this.crouchToggled : (this.held('crouch') || this.down.has('KeyC'));
      i.fire = !this.overlayOpen && (this.mouse[0] || this.latch.fire);
      i.ads = this.adsHeld();
      i.reload = this.latch.reload;
      i.interact = this.held('interact') || this.latch.interact;
      i.drop = this.latch.drop;
      i.melee = this.latch.melee;
      i.swapShoulder = this.latch.swap;
      i.throwItem = this.latch.throwItem;
      i.deploy = this.latch.deploy;
      i.slot = this.slotLatch;
      i.cycle = this.cycleLatch;
    }
    this.latch = { jump: false, fire: false, interact: false, reload: false, drop: false, melee: false, swap: false, throwItem: false, deploy: false };
    this.slotLatch = -1; this.cycleLatch = 0;
    return i;
  }

  /** Test/automation hook: set state without real devices. */
  debugSet(o: { forward?: boolean; fire?: boolean; yaw?: number; pitch?: number; sprint?: boolean; locked?: boolean }): void {
    if (o.forward !== undefined) { if (o.forward) this.down.add(this.settings.keys.forward); else this.down.delete(this.settings.keys.forward); }
    if (o.sprint !== undefined) { if (o.sprint) this.down.add(this.settings.keys.sprint); else this.down.delete(this.settings.keys.sprint); }
    if (o.fire !== undefined) this.mouse[0] = o.fire;
    if (o.yaw !== undefined) this.yaw = o.yaw;
    if (o.pitch !== undefined) this.pitch = o.pitch;
    if (o.locked !== undefined) this.locked = o.locked;
  }
}
