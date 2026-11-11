// renderer: first-person viewmodel. Purely cosmetic and additive: it never moves the gameplay aim ray.
// Layers: hip/ADS pose, locomotion bob, mouse sway, sprint, recoil springs, reload stages, swap, melee, throw,
// mantle, landing dip and inspect. The viewmodel has its own FOV, emulated by scaling X/Y in view space.
import type { ResolvedLoadout } from '../content/loadout';
import { DT } from '../content/tuning';
import type { PlayerState, SimEvent } from '../sim/player';
import { Color3, CreateBox, CreatePlane, CreateSphere, Mesh, Quaternion, Scene, StandardMaterial, TransformNode, Vector3 } from './bjs';
import type { Renderer } from './renderer';
import { canvasTexture } from './textures';
import { buildWeapon, GunMats, makeGunMats, WeaponRig } from './weaponModels';

const smooth = (t: number): number => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

class Spring {
  x = 0; v = 0;
  constructor(private k: number, private c: number) {}
  step(dt: number): number {
    const n = Math.max(1, Math.ceil(dt / 0.008));
    const h = dt / n;
    for (let i = 0; i < n; i++) { this.v += (-this.k * this.x - this.c * this.v) * h; this.x += this.v * h; }
    return this.x;
  }
}

export interface ViewmodelFrame {
  dt: number;
  state: PlayerState | null;
  lo: ResolvedLoadout | null;
  mouseDx: number;
  mouseDy: number;
  vfov: number;
  vmFovH: number;
  bobScale: number;
  hidden: boolean;
  teamColor: [number, number, number];
}

export class Viewmodel {
  readonly root: TransformNode;
  private holder: TransformNode;
  private mats: GunMats;
  private rigs = new Map<string, WeaponRig>();
  private rig: WeaponRig | null = null;
  private rigKey = '';
  private armMat: StandardMaterial;
  private gloveMat: StandardMaterial;
  private fore: Mesh[] = [];
  private hands: Mesh[] = [];
  private flash: Mesh;
  private flashT = 0;
  private nade: Mesh;
  // animation state
  private kickZ = new Spring(260, 24);
  private kickRot = new Spring(210, 20);
  private kickSide = new Spring(200, 18);
  private dip = new Spring(120, 14);
  private swayX = 0; private swayY = 0;
  private bobPhase = 0;
  private sprintB = 0;
  private adsB = 0;
  private reloadT = -1; private reloadDur = 1; private reloadEmpty = false; private reloadShell = false; private shellBump = 0;
  private swapT = -1; private swapDown = 0.16; private swapUp = 0.3; private swapTo = '';
  private meleeT = -1;
  private throwT = -1;
  private boltT = -1; private boltDur = 0.07;
  private cycleT = -1; private cycleDur = 0.5;
  private inspectT = -1;
  private mantleB = 0;
  private cooking = false;
  private lastSlot = -1;
  readonly muzzleWorld = new Vector3();
  private tmpA = new Vector3(); private tmpB = new Vector3(); private tmpC = new Vector3();
  private q = new Quaternion();

  constructor(private scene: Scene, private renderer: Renderer) {
    this.root = new TransformNode('vmRoot', scene);
    this.holder = new TransformNode('vmHolder', scene);
    this.holder.parent = this.root;
    this.mats = makeGunMats(scene);
    this.armMat = new StandardMaterial('armMat', scene);
    this.armMat.diffuseColor = new Color3(0.2, 0.25, 0.32);
    this.armMat.specularColor = new Color3(0.04, 0.04, 0.04);
    this.armMat.ambientColor = new Color3(0.2, 0.25, 0.32);
    this.gloveMat = new StandardMaterial('gloveMat', scene);
    this.gloveMat.diffuseColor = new Color3(0.075, 0.078, 0.085);
    this.gloveMat.specularColor = new Color3(0.12, 0.12, 0.12);
    this.gloveMat.ambientColor = new Color3(0.075, 0.078, 0.085);
    for (let i = 0; i < 2; i++) {
      const f = CreateBox('fore' + i, { width: 0.062, height: 0.058, depth: 1 }, scene);
      f.material = this.armMat;
      const h = CreateBox('hand' + i, { width: 0.062, height: 0.07, depth: 0.1 }, scene);
      h.material = this.gloveMat;
      for (const m of [f, h]) { m.renderingGroupId = 1; m.isPickable = false; m.alwaysSelectAsActiveMesh = true; m.rotationQuaternion = new Quaternion(); }
      this.fore.push(f); this.hands.push(h);
    }
    const tex = canvasTexture(scene, 'flashTex', 128, 128, (g) => {
      g.translate(64, 64);
      for (let i = 0; i < 7; i++) {
        g.rotate((Math.PI * 2) / 7 + i * 0.37);
        const len = 30 + ((i * 37) % 28);
        const gr = g.createLinearGradient(0, 0, len, 0);
        gr.addColorStop(0, 'rgba(255,240,200,1)'); gr.addColorStop(0.4, 'rgba(255,170,70,0.75)'); gr.addColorStop(1, 'rgba(255,90,20,0)');
        g.fillStyle = gr;
        g.beginPath(); g.moveTo(0, -7); g.lineTo(len, 0); g.lineTo(0, 7); g.closePath(); g.fill();
      }
      const c = g.createRadialGradient(0, 0, 0, 0, 0, 26);
      c.addColorStop(0, 'rgba(255,255,240,1)'); c.addColorStop(1, 'rgba(255,190,90,0)');
      g.fillStyle = c; g.beginPath(); g.arc(0, 0, 26, 0, 7); g.fill();
    });
    const fm = new StandardMaterial('flashMat', scene);
    fm.disableLighting = true; fm.emissiveTexture = tex; fm.opacityTexture = tex; fm.alphaMode = 1; fm.backFaceCulling = false; fm.disableDepthWrite = true;
    this.flash = CreatePlane('vmFlash', { size: 1 }, scene);
    this.flash.material = fm;
    this.flash.renderingGroupId = 1;
    this.flash.isPickable = false;
    this.flash.setEnabled(false);
    this.nade = CreateSphere('vmNade', { diameter: 0.07, segments: 8 }, scene);
    this.nade.material = this.mats.poly;
    this.nade.renderingGroupId = 1;
    this.nade.setEnabled(false);
  }

  private rigFor(lo: ResolvedLoadout, slot: number): { rig: WeaponRig; key: string } {
    const w = lo.weapons[slot];
    const key = w.def.id + ':' + w.attachments.slice().sort().join(',');
    let rig = this.rigs.get(key);
    if (!rig) { rig = buildWeapon(this.scene, this.mats, w, key); rig.root.parent = this.holder; this.rigs.set(key, rig); }
    return { rig, key };
  }

  private show(rig: WeaponRig, key: string): void {
    if (this.rig && this.rig !== rig) this.rig.root.setEnabled(false);
    this.rig = rig; this.rigKey = key;
    rig.root.setEnabled(true);
  }

  /** Feed predicted simulation events to drive cosmetic animation. */
  onEvent(ev: SimEvent, lo: ResolvedLoadout): void {
    switch (ev.t) {
      case 'shot': {
        const rig = this.rig;
        if (!rig) break;
        const ads = this.adsB;
        this.kickZ.v -= rig.kickZ * 26 * (1 - ads * 0.35);
        this.kickRot.v -= rig.kickRot * 22 * (1 - ads * 0.55);
        this.kickSide.v += (Math.random() - 0.5) * rig.kickRot * 14;
        const w = lo.weapons[ev.slot];
        if (!w.suppressed) { this.flashT = 0.05; this.flash.rotation.z = Math.random() * 6.28; const s = (rig.pistol ? 0.13 : 0.2) * (w.def.cls === 'shotgun' || w.def.cls === 'marksman' ? 1.5 : 1) * (0.8 + Math.random() * 0.5); this.flash.scaling.set(s, s, s); }
        this.boltT = 0; this.boltDur = rig.pistol ? 0.09 : 0.07;
        if (w.def.fire === 'pump') { this.cycleT = 0; this.cycleDur = Math.min(0.6, w.interval * 0.75); }
        else if (w.def.fire === 'bolt') { this.cycleT = 0; this.cycleDur = Math.min(1.0, w.interval * 0.82); }
        this.inspectT = -1;
        break;
      }
      case 'reload': this.reloadT = 0; this.reloadDur = ev.dur; this.reloadEmpty = ev.empty; this.reloadShell = !!lo.weapons[this.lastSlot < 0 ? 0 : this.lastSlot].def.shell; this.inspectT = -1; break;
      case 'shell': this.shellBump = 1; break;
      case 'reloadEnd': this.reloadT = -1; break;
      case 'swapStart': {
        const nw = lo.weapons[ev.to];
        this.swapT = 0; this.swapDown = 0.16 * lo.perks.swapMul; this.swapUp = nw.swapTime * lo.perks.swapMul;
        this.swapTo = this.rigFor(lo, ev.to).key;
        this.reloadT = -1; this.inspectT = -1;
        break;
      }
      case 'melee': this.meleeT = 0; this.inspectT = -1; break;
      case 'cook': this.cooking = true; break;
      case 'throw': this.throwT = 0; this.cooking = false; this.inspectT = -1; break;
      case 'land': this.dip.v -= Math.min(2.2, ev.speed * 0.22); break;
      case 'jump': this.dip.v += 0.5; break;
    }
  }

  inspect(): void { if (this.reloadT < 0 && this.swapT < 0 && this.meleeT < 0) this.inspectT = 0; }
  cancelInspect(): void { this.inspectT = -1; }

  /** Raise the weapon from below (spawn / respawn). */
  raise(): void { this.swapT = this.swapDown; this.swapUp = 0.35; this.swapTo = ''; this.reloadT = -1; this.meleeT = -1; this.throwT = -1; this.cooking = false; }

  update(f: ViewmodelFrame): void {
    const { dt, state: s, lo } = f;
    const cam = this.renderer.camera;
    if (!s || !lo || f.hidden) {
      this.root.setEnabled(false);
      for (const m of [...this.fore, ...this.hands]) m.setEnabled(false);
      this.flash.setEnabled(false); this.nade.setEnabled(false);
      return;
    }
    this.root.setEnabled(true);
    for (const m of [...this.fore, ...this.hands]) m.setEnabled(true);
    this.armMat.diffuseColor.set(f.teamColor[0] * 0.7, f.teamColor[1] * 0.7, f.teamColor[2] * 0.7);
    this.armMat.ambientColor.set(f.teamColor[0] * 0.7, f.teamColor[1] * 0.7, f.teamColor[2] * 0.7);
    // which weapon is on screen (the swap animation shows the old one until the halfway point)
    const target = this.rigFor(lo, s.slot);
    if (!this.rig || (this.swapT < 0 && this.rigKey !== target.key)) this.show(target.rig, target.key);
    this.lastSlot = s.slot;
    const rig = this.rig!;
    const w = lo.weapons[s.slot];

    this.root.position.copyFrom(cam.position);
    this.root.rotation.copyFrom(cam.rotation);
    // the viewmodel FOV setting is a vertical angle for the weapon layer only
    const sc = Math.tan(f.vfov / 2) / Math.tan((f.vmFovH * Math.PI) / 360);
    this.root.scaling.set(sc, sc, 1);

    // blends
    const speed = Math.hypot(s.vx, s.vz);
    this.adsB += (smooth(s.adsT) - this.adsB) * Math.min(1, dt * 40);
    const sprintT = s.sprint || s.sprintOut > 0.02 ? 1 : 0;
    this.sprintB += (sprintT - this.sprintB) * (1 - Math.exp(-(sprintT ? 9 : 16) * dt));
    this.mantleB += ((s.mantleT >= 0 ? 1 : 0) - this.mantleB) * (1 - Math.exp(-12 * dt));
    const ads = this.adsB, sb = this.sprintB * (1 - ads);

    let px = lerp(rig.hip.x, 0, ads), py = lerp(rig.hip.y, -rig.sightY, ads), pz = lerp(rig.hip.z, rig.adsZ, ads);
    let rx = lerp(0.02, 0, ads), ry = lerp(-0.075, 0, ads), rz = lerp(-0.035, 0, ads);

    // locomotion bob
    const grounded = s.grounded === 1;
    this.bobPhase += dt * (grounded ? speed : 0) * 1.32;
    const bobAmt = (grounded ? Math.min(1, speed / 5) : 0) * f.bobScale * (1 - ads * 0.88) * (1 + sb * 1.4);
    px += Math.sin(this.bobPhase) * 0.0075 * bobAmt;
    py -= Math.abs(Math.cos(this.bobPhase)) * 0.008 * bobAmt - 0.004 * bobAmt;
    rz += Math.sin(this.bobPhase) * 0.012 * bobAmt;
    // idle breathing
    const tNow = performance.now() / 1000;
    py += Math.sin(tNow * 1.7) * 0.0012 * (1 - ads * 0.7);
    // mouse sway (weapon lags the view slightly)
    const k = 1 - Math.exp(-10 * dt);
    this.swayX += (Math.max(-0.05, Math.min(0.05, -f.mouseDx * 0.0009)) - this.swayX) * k;
    this.swayY += (Math.max(-0.04, Math.min(0.04, f.mouseDy * 0.0009)) - this.swayY) * k;
    const swayScale = (1 - ads * 0.75) * f.bobScale;
    ry += this.swayX * swayScale; rx += this.swayY * swayScale;
    px += this.swayX * 0.12 * swayScale; py -= this.swayY * 0.1 * swayScale;
    // strafe roll
    const lat = s.vx * Math.cos(s.yaw) - s.vz * Math.sin(s.yaw);
    rz -= lat * 0.006 * (1 - ads * 0.6);
    // sprint carry
    px += -0.05 * sb; py += -0.035 * sb; pz += -0.04 * sb;
    rx += 0.3 * sb; ry += -0.75 * sb; rz += 0.28 * sb;
    py += Math.sin(this.bobPhase * 2) * 0.006 * sb; px += Math.cos(this.bobPhase) * 0.012 * sb;
    // mantle
    py -= 0.2 * this.mantleB; rx += 0.55 * this.mantleB; rz += 0.3 * this.mantleB;
    // landing / jump dip
    py += this.dip.step(dt) * 0.05;
    // recoil
    pz += this.kickZ.step(dt);
    rx += this.kickRot.step(dt);
    ry += this.kickSide.step(dt) * 0.4;

    // weapon-part animation
    let magY = 0, magA = 1, boltZ = 0, pumpZ = 0;
    let leftFree = 0; // 0 = on weapon, 1 = at custom target
    const leftT = this.tmpC.set(-0.2, -0.3, 0.2);
    if (this.boltT >= 0) {
      this.boltT += dt;
      const u = this.boltT / this.boltDur;
      boltZ = -Math.sin(Math.min(1, u) * Math.PI) * (rig.pistol ? 0.035 : 0.03);
      if (u >= 1) this.boltT = -1;
    }
    if (this.cycleT >= 0) {
      this.cycleT += dt;
      const u = this.cycleT / this.cycleDur;
      if (w.def.fire === 'pump') {
        const a = smooth((u - 0.25) / 0.25) - smooth((u - 0.55) / 0.3);
        pumpZ = -0.075 * a;
        pz -= 0.012 * a; rx += 0.03 * a;
      } else {
        // bolt action: lift, pull, push, lock
        const a = smooth((u - 0.2) / 0.2) - smooth((u - 0.6) / 0.25);
        boltZ = -0.06 * a;
        rz += 0.22 * a; rx += 0.05 * a; py -= 0.012 * a; px += 0.01 * a;
      }
      if (u >= 1) this.cycleT = -1;
    }
    if (this.reloadT >= 0) {
      this.reloadT += dt;
      const dur = Math.max(0.2, this.reloadDur), u = this.reloadT / dur;
      const env = smooth(u / 0.14) * (1 - smooth((u - 0.86) / 0.14));
      rz += 0.5 * env; rx -= 0.2 * env; py -= 0.03 * env; px -= 0.02 * env; ry += 0.14 * env;
      if (this.reloadShell) {
        this.shellBump = Math.max(0, this.shellBump - dt * 4.5);
        const cyc = this.shellBump;
        leftFree = env;
        leftT.set(rig.leftHand.x - 0.02, -0.07 + cyc * 0.05, 0.08 - (1 - cyc) * 0.1);
        py += cyc * 0.008; rz += cyc * 0.05;
      } else {
        const d = w.def.reload;
        const out = smooth((u - (d.outAt - 0.1)) / 0.1), inn = smooth((u - (d.inAt - 0.13)) / 0.13);
        const away = out * (1 - inn);
        magY = -0.32 * away;
        magA = away > 0.92 ? 0 : 1;
        leftFree = smooth((u - (d.outAt - 0.2)) / 0.12) * (1 - smooth((u - (d.inAt + 0.02)) / 0.1));
        const mx = rig.mag ? 0 : 0, mz = rig.pistol ? -0.012 : 0.078;
        leftT.set(mx - 0.01, -0.1 + magY * 0.9, mz);
        py -= Math.sin(Math.min(1, Math.max(0, (u - d.inAt) / 0.06)) * Math.PI) * 0.012; // seat the magazine
        if (this.reloadEmpty && u > 0.86) {
          const c = Math.sin(Math.min(1, (u - 0.86) / 0.12) * Math.PI);
          boltZ = -0.04 * c; pz -= 0.008 * c;
          if (!rig.pistol) { leftFree = Math.max(leftFree, c * 0.9); leftT.set(0.03, 0.06, 0.0 - 0.04 * c); }
        }
      }
      if (u >= 1.05) this.reloadT = -1;
    }
    if (this.swapT >= 0) {
      this.swapT += dt;
      let a: number;
      if (this.swapT < this.swapDown) a = smooth(this.swapT / this.swapDown);
      else {
        if (this.swapTo) { const r2 = this.rigs.get(this.swapTo); if (r2) this.show(r2, this.swapTo); this.swapTo = ''; }
        a = 1 - smooth((this.swapT - this.swapDown) / Math.max(0.05, this.swapUp));
      }
      py -= 0.24 * a; rx += 0.7 * a; rz += 0.25 * a;
      if (this.swapT > this.swapDown + this.swapUp) this.swapT = -1;
    }
    if (this.meleeT >= 0) {
      this.meleeT += dt;
      const u = this.meleeT / 0.5;
      const a = u < 0.22 ? smooth(u / 0.22) : 1 - smooth((u - 0.22) / 0.78);
      px -= 0.13 * a; pz += 0.2 * a; py += 0.03 * a; ry += 0.75 * a; rz -= 0.7 * a; rx -= 0.15 * a;
      if (u >= 1) this.meleeT = -1;
    }
    let nadeVisible = false;
    if (this.cooking) {
      leftFree = 1; leftT.set(-0.16, -0.1, 0.26);
      py -= 0.03; rz += 0.12;
      nadeVisible = true;
    }
    if (this.throwT >= 0) {
      this.throwT += dt;
      const u = this.throwT / 0.45;
      const a = Math.sin(Math.min(1, u) * Math.PI);
      py -= 0.07 * a; rz += 0.22 * a; ry += 0.1 * a;
      leftFree = Math.max(leftFree, 1 - smooth((u - 0.75) / 0.25));
      const arc = smooth(u / 0.45);
      leftT.set(lerp(-0.2, 0.02, arc), lerp(-0.14, 0.1, arc), lerp(0.18, 0.62, arc));
      if (u >= 1) this.throwT = -1;
    }
    if (this.inspectT >= 0) {
      this.inspectT += dt;
      const u = this.inspectT / 2.6;
      const a = smooth(u / 0.18) * (1 - smooth((u - 0.82) / 0.18)) * (1 - ads);
      ry += (0.9 + Math.sin(u * 6.28) * 0.25) * a; rz += 0.55 * a; px -= 0.06 * a; py += 0.04 * a; rx -= 0.1 * a;
      if (u >= 1 || speed > 6 || s.reloadT >= 0) this.inspectT = -1;
    }

    this.holder.position.set(px, py, pz);
    this.holder.rotation.set(rx, ry, rz);
    if (rig.mag) { rig.mag.position.y = magY; rig.mag.setEnabled(magA > 0); }
    if (rig.bolt) rig.bolt.position.z = boltZ;
    if (rig.pump) rig.pump.position.z = pumpZ;

    // world-space points
    rig.root.computeWorldMatrix(true);
    const wm = rig.root.getWorldMatrix();
    Vector3.TransformCoordinatesToRef(rig.muzzle, wm, this.muzzleWorld);
    this.root.computeWorldMatrix(true);
    const rm = this.root.getWorldMatrix();
    // arms: elbows live in view space, hands on the weapon
    for (let i = 0; i < 2; i++) {
      const right = i === 0;
      const hand = this.tmpB;
      Vector3.TransformCoordinatesToRef(right ? rig.rightHand : rig.leftHand, wm, hand);
      if (!right && leftFree > 0) {
        // free-hand targets are authored in weapon space for magazine work, view space for throws
        const tgt = new Vector3();
        if (this.throwT >= 0 || this.cooking) Vector3.TransformCoordinatesToRef(leftT, rm, tgt); else Vector3.TransformCoordinatesToRef(leftT, wm, tgt);
        Vector3.LerpToRef(hand, tgt, leftFree, hand);
        if (nadeVisible) this.nade.position.copyFrom(hand);
      }
      // elbows hang below and behind each hand (view space), so forearms rise into frame from the bottom edge
      const elbow = this.tmpA.set(right ? 0.1 : -0.15, right ? -0.2 : -0.21, right ? -0.26 : -0.24);
      Vector3.TransformNormalToRef(elbow, rm, elbow);
      elbow.addInPlace(hand);
      const dir = hand.subtract(elbow);
      const len = dir.length();
      dir.scaleInPlace(1 / Math.max(len, 1e-4));
      Quaternion.FromLookDirectionLHToRef(dir, Vector3.UpReadOnly, this.q);
      const fore = this.fore[i], hm = this.hands[i];
      fore.position.copyFrom(elbow).addInPlace(dir.scale(len * 0.5 - 0.04));
      fore.rotationQuaternion!.copyFrom(this.q);
      fore.scaling.set(1, 1, Math.max(0.05, len - 0.02));
      hm.position.copyFrom(hand);
      hm.rotationQuaternion!.copyFrom(this.q);
    }
    this.nade.setEnabled(nadeVisible);

    // muzzle flash
    if (this.flashT > 0) {
      this.flashT -= dt;
      this.flash.setEnabled(true);
      this.flash.position.copyFrom(this.muzzleWorld);
      this.flash.billboardMode = Mesh.BILLBOARDMODE_ALL;
    } else this.flash.setEnabled(false);
  }

  /** Scoped weapons hide the model under the HUD scope overlay. */
  isScoped(): boolean { return !!this.rig && this.rig.scoped; }

  dispose(): void {
    for (const r of this.rigs.values()) r.root.dispose(false, false);
    this.rigs.clear();
  }
}

export const VIEWMODEL_TICK = DT;
