// client-renderer: scene, camera, entity views and event-driven VFX. This layer only *reads*
// snapshots — it never feeds anything back into gameplay. All Three.js usage is behind this class
// so a WebGPU backend could replace it without touching runtime, UI or simulation code.

import * as THREE from 'three';
import { HEROES, HeroId } from '../../shared/heroes';
import { GameMap, MAP_H, MAP_W } from '../../shared/map';
import { clamp, lerpAngle } from '../../shared/math';
import { ANIM, GameEvent, ST, Snapshot, UnitView } from '../../shared/protocol';
import { MONSTERS, RULES, STRUCTS } from '../../shared/units';
import type { Settings } from '../runtime/persist';
import { FogOfWar } from './fog';
import { MinionRenderer } from './minions';
import { Rig, StructModel, animateRig, buildHero, buildMonster, buildStructure, buildWard, relColor } from './models';
import { BarInfo, Overlay } from './overlay';
import { buildTerrain, fogUniforms } from './terrain';
import { Indicators, Vfx } from './vfx';

export interface Ent {
  id: number;
  v: UnitView;
  x: number;
  y: number;
  f: number;
  h: number;
  rig: Rig | null;
  struct: StructModel | null;
  seen: boolean;
  speed: number;
  wasDead: boolean;
}

const PITCH = (52 * Math.PI) / 180;
const MINION_H: Record<string, number> = { guard: 1.75, bolt: 2.0, siege: 1.8, vanguard: 2.9 };
const DMG_COLORS = ['#ffd9b0', '#cdb0ff', '#ffffff'];

export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}

export class GameRenderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly vfx: Vfx;
  readonly indicators: Indicators;
  readonly fog: FogOfWar;
  readonly overlay: Overlay;
  readonly ents = new Map<number, Ent>();
  private minions: MinionRenderer;
  private sun: THREE.DirectionalLight;
  private raycaster = new THREE.Raycaster();
  private plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private v3 = new THREE.Vector3();
  private v3b = new THREE.Vector3();
  private ndc = new THREE.Vector2();
  private prevMap = new Map<number, UnitView>();
  private prevSnap: Snapshot | null = null;
  private lastFogTick = -10;
  private shake = 0;
  private w = 1;
  private h = 1;
  private frameNo = 0;
  camX = 20;
  camY = 57;
  camHeight = 34;
  selfId = 0;
  hoverId = 0;
  drawCalls = 0;

  constructor(
    private container: HTMLElement,
    overlayCanvas: HTMLCanvasElement,
    private map: GameMap,
    private settings: Settings,
    readonly viewer: 0 | 1,
  ) {
    const q = settings.quality;
    this.renderer = new THREE.WebGLRenderer({ antialias: q !== 'low', powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, q === 'high' ? 2 : q === 'medium' ? 1.5 : 1));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = q !== 'low';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.className = 'game-canvas';
    container.prepend(this.renderer.domElement);
    this.scene.background = new THREE.Color(0x0b1030);
    this.camera = new THREE.PerspectiveCamera(45, 16 / 9, 1, 400);

    this.scene.add(new THREE.HemisphereLight(0xd6e8ff, 0x6a5a7a, 2.1));
    this.sun = new THREE.DirectionalLight(0xfff1d6, 2.7);
    this.sun.castShadow = q !== 'low';
    const sm = q === 'high' ? 2048 : 1536;
    this.sun.shadow.mapSize.set(sm, sm);
    const sc = this.sun.shadow.camera;
    sc.left = -48;
    sc.right = 48;
    sc.top = 48;
    sc.bottom = -48;
    sc.near = 5;
    sc.far = 160;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.04;
    this.scene.add(this.sun, this.sun.target);

    this.scene.add(buildTerrain(map, q));
    this.fog = new FogOfWar(map);
    fogUniforms.uFog.value = this.fog.texture;
    this.vfx = new Vfx(this.scene, q);
    this.vfx.enemyColor = settings.colorblind ? 0xffb000 : 0xff4a3a;
    this.indicators = new Indicators(this.scene);
    this.minions = new MinionRenderer(this.scene, q !== 'low');
    this.overlay = new Overlay(overlayCanvas);
    if (settings.colorblind) this.overlay.colors = { self: '#58e07c', ally: '#3d8bff', enemy: '#ffb000', neutral: '#e8e0c0' };
    this.resize();
  }

  resize(): void {
    this.w = this.container.clientWidth || window.innerWidth;
    this.h = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(this.w, this.h);
    this.camera.aspect = this.w / this.h;
    this.camera.updateProjectionMatrix();
    this.overlay.resize(this.w, this.h, Math.min(window.devicePixelRatio || 1, 2));
    this.vfx.setViewport(this.h);
  }

  dispose(): void {
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) m.geometry?.dispose?.();
    });
  }

  // ---- camera --------------------------------------------------------------------------------

  private placeCamera(): void {
    this.camX = clamp(this.camX, 2, MAP_W - 2);
    this.camY = clamp(this.camY, 4, MAP_H - 4);
    const back = this.camHeight / Math.tan(PITCH);
    const k = Math.SQRT1_2;
    const sx = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;
    const sy = this.shake > 0 ? (Math.random() - 0.5) * this.shake : 0;
    // looking toward sim (+x, +y): camera sits back along (-x, -y)
    this.camera.position.set(this.camX - k * back + sx, this.camHeight, -(this.camY - k * back) + sy);
    this.camera.lookAt(this.camX + sx, 0, -this.camY + sy);
    this.sun.target.position.set(this.camX, 0, -this.camY);
    this.sun.position.set(this.camX - 26, 52, -this.camY + 18);
  }

  /** Pan in screen space (right / up on screen) by metres. */
  pan(right: number, up: number): void {
    const k = Math.SQRT1_2;
    this.camX += (right + up) * k;
    this.camY += (up - right) * k;
  }

  screenToGround(clientX: number, clientY: number): { x: number; y: number } | null {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const hit = this.raycaster.ray.intersectPlane(this.plane, this.v3);
    return hit ? { x: hit.x, y: -hit.z } : null;
  }

  project(x: number, y: number, h: number): { sx: number; sy: number } | null {
    this.v3.set(x, h, -y).project(this.camera);
    if (this.v3.z > 1 || this.v3.z < -1) return null;
    return { sx: (this.v3.x * 0.5 + 0.5) * this.w, sy: (-this.v3.y * 0.5 + 0.5) * this.h };
  }

  cameraQuad(): { x: number; y: number }[] {
    const r = this.renderer.domElement.getBoundingClientRect();
    const out: { x: number; y: number }[] = [];
    for (const [fx, fy] of [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]) {
      const g = this.screenToGround(r.left + fx * r.width, r.top + fy * r.height);
      if (g) out.push(g);
    }
    return out;
  }

  /** Pick the unit under the cursor (ray vs. each unit's vertical extent). */
  pick(clientX: number, clientY: number, filter: (e: Ent) => boolean): Ent | null {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.ndc, this.camera);
    let best: Ent | null = null;
    let bs = 1e9;
    for (const e of this.ents.values()) {
      if (e.v.dead || !filter(e)) continue;
      this.v3.set(e.x, 0, -e.y);
      this.v3b.set(e.x, e.h * 0.85, -e.y);
      const d = Math.sqrt(this.raycaster.ray.distanceSqToSegment(this.v3, this.v3b));
      const tol = e.v.r * 1.15 + (e.v.k === 'hero' ? 0.55 : 0.35);
      if (d > tol) continue;
      const score = d / tol - (e.v.k === 'hero' ? 0.5 : 0);
      if (score < bs) {
        bs = score;
        best = e;
      }
    }
    return best;
  }

  // ---- entities ------------------------------------------------------------------------------

  private create(v: UnitView): Ent {
    const e: Ent = { id: v.id, v, x: v.x, y: v.y, f: v.f, h: 2, rig: null, struct: null, seen: true, speed: 0, wasDead: false };
    const col = relColor(v.t, this.viewer, this.settings.colorblind);
    if (v.k === 'hero' || v.k === 'decoy') {
      e.rig = buildHero(v.s as HeroId, v.id === this.selfId ? 0x7dff9a : col, v.id === this.selfId);
      e.h = e.rig.height * 1.12 + 0.45;
      if (v.k === 'decoy' && v.t === this.viewer) {
        e.rig.root.traverse((o) => {
          const m = o as THREE.Mesh;
          if (m.isMesh && m.material instanceof THREE.MeshLambertMaterial) {
            m.material = m.material.clone();
            (m.material as THREE.MeshLambertMaterial).transparent = true;
            (m.material as THREE.MeshLambertMaterial).opacity = 0.5;
          }
        });
      }
    } else if (v.k === 'monster') {
      e.rig = buildMonster(v.s);
      e.h = e.rig.height + 0.5;
    } else if (v.k === 'ward') {
      e.rig = buildWard(col);
      e.h = 1.9;
    } else if (v.k === 'minion') {
      e.h = MINION_H[v.s] ?? 1.8;
    } else {
      e.struct = buildStructure(v.k, v.s, col);
      e.struct.root.position.set(v.x, 0, -v.y);
      e.struct.root.rotation.y = v.t === 0 ? 0 : Math.PI;
      e.h = e.struct.top + 0.6;
      this.scene.add(e.struct.root);
    }
    if (e.rig) {
      e.rig.root.position.set(v.x, 0, -v.y);
      this.scene.add(e.rig.root);
    }
    this.ents.set(v.id, e);
    return e;
  }

  private remove(e: Ent): void {
    if (e.rig) this.scene.remove(e.rig.root);
    if (e.struct) this.scene.remove(e.struct.root);
    this.ents.delete(e.id);
  }

  /** Draw one frame from the two latest snapshots. alpha in [0,1] interpolates prev -> cur. */
  frame(cur: Snapshot, prev: Snapshot | null, alpha: number, dt: number, time: number, self: UnitView | null): void {
    this.frameNo++;
    fogUniforms.uTime.value = time;
    if (prev !== this.prevSnap) {
      this.prevSnap = prev;
      this.prevMap.clear();
      if (prev) for (const u of prev.units) this.prevMap.set(u.id, u);
    }
    const tickF = cur.tick - 1 + alpha;
    for (const e of this.ents.values()) e.seen = false;
    this.minions.begin();
    this.overlay.begin();
    const bars: BarInfo[] = [];
    let towerRing: Ent | null = null;
    let towerHot = false;

    for (const v of cur.units) {
      let e = this.ents.get(v.id);
      if (!e) e = this.create(v);
      e.seen = true;
      const pv = this.prevMap.get(v.id);
      if (pv && Math.abs(pv.x - v.x) + Math.abs(pv.y - v.y) < 4) {
        e.x = pv.x + (v.x - pv.x) * alpha;
        e.y = pv.y + (v.y - pv.y) * alpha;
        e.speed = Math.hypot(v.x - pv.x, v.y - pv.y) * 30;
      } else {
        e.x = v.x;
        e.y = v.y;
        e.speed = 0;
      }
      e.f = lerpAngle(e.f, v.f, Math.min(1, dt * 16));
      e.v = v;
      const prog = v.ad > 0 ? clamp((tickF - v.at) / v.ad, 0, 1) : 0;
      const rel: BarInfo['rel'] = v.id === this.selfId ? 'self' : v.t === 2 ? 'neutral' : v.t === this.viewer ? 'ally' : 'enemy';

      if (e.rig) {
        e.rig.root.position.set(e.x, 0, -e.y);
        e.rig.root.rotation.y = e.f;
        animateRig(e.rig, { anim: v.an, prog, speed: e.speed, time, st: v.st });
        if (v.k === 'hero') this.heroFx(e, time);
      } else if (v.k === 'minion') {
        this.minions.add(v.s, e.x, e.y, e.f, relColor(v.t, this.viewer, this.settings.colorblind), v.an, prog, time, v.id, (v.st & ST.EMPOWERED) !== 0);
        if (v.st & ST.EMPOWERED && this.frameNo % 9 === v.id % 9) this.vfx.burst(e.x, e.y, 1.2, 0xff5ad6, 1, 0.6, 0.5, 0.22, 0.8, -1);
      } else if (e.struct) {
        const s = e.struct;
        const dead = !!v.dead;
        if (dead !== e.wasDead) {
          s.alive.visible = !dead;
          s.rubble.visible = dead;
          e.wasDead = dead;
        }
        if (!dead) {
          if (s.crystal) {
            s.crystal.rotation.y = time * 0.9 + v.id;
            s.crystal.position.y += Math.sin(time * 1.7 + v.id) * 0.002;
          }
          for (const sp of s.spin) sp.rotation.y += dt * ((sp.userData.speed as number) ?? 1);
          if (s.shield) s.shield.visible = (v.st & ST.INVULN) !== 0;
          if (v.tg && v.k !== 'seal') {
            const t = this.ents.get(v.tg);
            if (t && t.v.k === 'hero') {
              const a = this.project(e.x, e.y, s.top - 1.2);
              const b = this.project(t.x, t.y, 1.2);
              if (a && b) this.overlay.line(a.sx, a.sy, b.sx, b.sy, v.rp >= 2 ? 'rgba(255,60,40,0.95)' : 'rgba(255,190,90,0.9)', 2 + v.rp * 0.7);
              if (t.id === this.selfId) towerHot = true;
            }
          }
          if (self && v.t !== this.viewer && v.k !== 'seal' && v.k !== 'engine' && Math.hypot(self.x - v.x, self.y - v.y) < RULES.towerRange + 5) towerRing = e;
        }
      }
      const p = this.project(e.x, e.y, e.h);
      if (p) {
        const mon = v.k === 'monster' ? MONSTERS[v.s] : null;
        bars.push({
          id: v.id,
          sx: p.sx,
          sy: p.sy,
          kind: v.k,
          rel,
          hp: v.hp,
          mhp: v.mhp,
          sh: v.sh,
          mp: v.mp,
          mmp: v.mmp,
          lvl: v.lvl,
          st: v.st,
          name: v.nm ?? (mon ? mon.name : e.struct ? STRUCTS[v.s]?.name ?? '' : ''),
          big: !!mon?.big,
          energy: v.k === 'hero' && HEROES[v.s as HeroId]?.resource === 'Energy',
          dead: !!v.dead,
        });
      }
    }
    for (const e of [...this.ents.values()]) if (!e.seen) this.remove(e);
    this.minions.end();

    this.vfx.syncZones(cur.zones, tickF, time);
    this.vfx.syncProjs(cur.projs, clamp(alpha - 1, -1, 0.5) / 30, this.viewer);
    this.vfx.update(dt);
    this.indicators.update(dt);
    if (towerRing) this.indicators.setTowerRing(towerRing.x, towerRing.y, RULES.towerRange, true, towerHot);
    else this.indicators.setTowerRing(0, 0, 1, false, false);
    const hov = this.hoverId ? this.ents.get(this.hoverId) : undefined;
    if (hov && !hov.v.dead) this.indicators.setHover(hov.x, hov.y, hov.v.r * 1.5 + 0.3, true, hov.v.t === this.viewer ? 0x7dff9a : hov.v.t === 2 ? 0xffe07a : 0xff5f4a);
    else this.indicators.setHover(0, 0, 1, false, 0);

    if (cur.tick - this.lastFogTick >= 3 || cur.tick < this.lastFogTick) {
      this.lastFogTick = cur.tick;
      this.fog.update(cur.vision);
    }

    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 1.6);
    this.placeCamera();
    this.renderer.render(this.scene, this.camera);
    this.drawCalls = this.renderer.info.render.calls;

    // bars: minions first so hero bars sit on top
    bars.sort((a, b) => (a.kind === 'hero' ? 1 : 0) - (b.kind === 'hero' ? 1 : 0));
    for (const b of bars) this.overlay.bar(b);
    this.overlay.drawTexts(dt, (x, y, h) => this.project(x, y, h));
  }

  private heroFx(e: Ent, time: number): void {
    const v = e.v;
    const def = HEROES[v.s as HeroId];
    if (v.st & ST.RECALL && this.frameNo % 2 === 0) this.vfx.burst(e.x + Math.cos(time * 5) * 0.9, e.y + Math.sin(time * 5) * 0.9, 0.2, 0x9fd8ff, 1, 0.4, 0.8, 0.26, 2.2, -2.5);
    if (v.st & ST.HARDENED && this.frameNo % 4 === 0) this.vfx.burst(e.x, e.y, 1.2, 0x7fbf5a, 1, 1, 0.4, 0.3, 0.4, 0);
    if (v.st & ST.HASTED && e.speed > 1 && this.frameNo % 3 === 0) this.vfx.burst(e.x, e.y, 0.3, 0xfff0b0, 1, 0.5, 0.35, 0.2, 0.2, 0);
    if (v.st & ST.GLINT && this.frameNo % 12 === 0) this.vfx.burst(e.x, e.y, 2.2, 0xffffff, 2, 0.8, 0.3, 0.3, 0.5, 0);
    if (v.st & ST.REVEALED && this.frameNo % 10 === 0) this.vfx.burst(e.x, e.y, 3.2, 0xff5ad6, 1, 0.2, 0.5, 0.36, 0.2, 0);
    if (v.st & ST.STUN && this.frameNo % 6 === 0) this.vfx.burst(e.x + Math.cos(time * 8) * 0.5, e.y + Math.sin(time * 8) * 0.5, 2.9, 0xffe07a, 1, 0.2, 0.3, 0.26, 0, 0);
    if (v.st & ST.SILENCE && this.frameNo % 8 === 0) this.vfx.burst(e.x, e.y, 2.6, 0xb48cff, 1, 0.4, 0.4, 0.26, 0.2, 0);
    if (v.sh > 0 && this.frameNo % 5 === 0) this.vfx.burst(e.x + Math.cos(time * 3 + e.id) * 0.9, e.y + Math.sin(time * 3 + e.id) * 0.9, 1.3, 0x8fe6ff, 1, 0.2, 0.4, 0.24, 0.3, 0);
    if (v.an >= ANIM.cast0 && v.an <= ANIM.cast3 && this.frameNo % 3 === 0 && v.st & ST.CHANNEL) this.vfx.burst(e.x, e.y, 1.6, def.color, 1, 1.4, 0.35, 0.26, 0.6, -1);
    if (v.an === ANIM.dash && this.frameNo % 2 === 0) this.vfx.burst(e.x, e.y, 1.0, def.color, 1, 0.6, 0.35, 0.3, 0.3, 0);
  }

  addShake(amount: number, x: number, y: number): void {
    if (!this.settings.screenShake) return;
    const d = Math.hypot(x - this.camX, y - this.camY);
    if (d < 26) this.shake = Math.min(0.5, this.shake + amount * (1 - d / 26));
  }

  // ---- event-driven VFX ----------------------------------------------------------------------

  handleEvent(ev: GameEvent): void {
    const fx = this.vfx;
    switch (ev.e) {
      case 'dmg': {
        const e = this.ents.get(ev.id);
        const h = e ? e.h * 0.7 : 1.4;
        fx.burst(ev.x, ev.y, h * 0.7, ev.ty === 1 ? 0xb48cff : ev.ty === 2 ? 0xffffff : 0xffc27a, ev.a > 80 ? 4 : 2, 2.4, 0.3, 0.2, 0.4);
        if (!this.settings.damageNumbers || ev.a < 2) break;
        const self = ev.id === this.selfId;
        this.overlay.float(`d${ev.id}${ev.ty}`, ev.x, ev.y, h, ev.a, ev.crit ? '%!' : '%', self ? '#ff6a5a' : DMG_COLORS[ev.ty], ev.crit ? 19 : ev.a >= 120 ? 17 : 14);
        break;
      }
      case 'heal':
        fx.burst(ev.x, ev.y, 0.6, 0xffe07a, 8, 0.7, 0.9, 0.24, 2.4, -1.6); // upward gold motes
        this.overlay.float(`h${ev.id}`, ev.x, ev.y, 2.6, ev.a, '+%', '#7dff9a', 14);
        break;
      case 'gold':
        this.overlay.float('', ev.x, ev.y, 1.6, ev.a, `+${ev.a}g`, '#ffd24a', 14);
        fx.burst(ev.x, ev.y, 1.0, 0xffd24a, 4, 1.6, 0.5, 0.18, 1.2);
        break;
      case 'level':
        fx.ring(ev.x, ev.y, 2.4, 0xffe07a, 0.7);
        fx.burst(ev.x, ev.y, 0.4, 0xffe07a, 22, 1.6, 1.0, 0.3, 2.6, -1);
        this.overlay.float('', ev.x, ev.y, 3.2, 0, `LEVEL ${ev.lvl}`, '#ffe07a', 16);
        break;
      case 'death': {
        const structure = ev.k === 'tower' || ev.k === 'seal' || ev.k === 'core' || ev.k === 'engine';
        const col = ev.k === 'monster' ? 0xe2c66a : relColor(ev.t, this.viewer, this.settings.colorblind);
        if (structure) {
          fx.ring(ev.x, ev.y, ev.k === 'engine' ? 12 : 6, col, 0.9);
          fx.flashCircle(ev.x, ev.y, ev.k === 'engine' ? 9 : 4.5, 0xffffff, 0.5);
          fx.burst(ev.x, ev.y, 2.5, 0xe6dfc8, 60, 7, 1.3, 0.5, 0.9, 9);
          fx.burst(ev.x, ev.y, 3, col, 40, 5, 1.1, 0.45, 1.2, 2);
          this.addShake(ev.k === 'engine' ? 0.5 : 0.3, ev.x, ev.y);
        } else if (ev.k === 'hero') {
          fx.ring(ev.x, ev.y, 3, col, 0.7);
          fx.burst(ev.x, ev.y, 1.4, col, 34, 4, 1.0, 0.36, 1.0, 3);
          fx.burst(ev.x, ev.y, 1.4, 0xffffff, 12, 2, 0.6, 0.3, 1.4, 0);
        } else if (ev.k === 'monster') {
          fx.burst(ev.x, ev.y, 1.0, col, MONSTERS[ev.s]?.big ? 60 : 12, 3.5, 0.8, 0.34, 0.8, 4);
          if (MONSTERS[ev.s]?.big) fx.ring(ev.x, ev.y, 7, 0xff5ad6, 0.9);
        } else if (ev.k === 'minion') {
          fx.burst(ev.x, ev.y, 0.8, col, 6, 2.6, 0.5, 0.24, 0.8, 5);
        } else fx.burst(ev.x, ev.y, 0.8, 0xffe9a0, 6, 2, 0.5, 0.24, 0.8);
        break;
      }
      case 'cast': {
        const def = HEROES[ev.hero];
        fx.ring(ev.x, ev.y, 1.5, ev.slot >= 4 ? 0xffffff : def.color, 0.3);
        if (ev.slot === 3) fx.burst(ev.x, ev.y, 1.5, def.color, 20, 3, 0.7, 0.34, 1.0, 0);
        break;
      }
      case 'fx': {
        const c = ev.c ?? 0xffffff;
        switch (ev.fx) {
          case 'cone':
            fx.cone(ev.x, ev.y, ev.ang ?? 0, ev.r ?? 4, ev.x2 ?? 0.6, c);
            fx.burst(ev.x + Math.cos(ev.ang ?? 0) * (ev.r ?? 4) * 0.6, ev.y + Math.sin(ev.ang ?? 0) * (ev.r ?? 4) * 0.6, 0.8, c, 10, 3, 0.4, 0.3, 0.5);
            break;
          case 'rect':
            fx.rect(ev.x, ev.y, ev.ang ?? 0, ev.r ?? 6, ev.x2 ?? 2, c);
            break;
          case 'line':
            fx.beam(ev.x, ev.y, ev.x2 ?? ev.x, ev.y2 ?? ev.y, c);
            break;
          case 'blink':
            fx.beam(ev.x, ev.y, ev.x2 ?? ev.x, ev.y2 ?? ev.y, c, 0.22, 1.2, 0.35);
            fx.burst(ev.x, ev.y, 1.2, c, 14, 2.4, 0.5, 0.3, 0.8, 0);
            fx.burst(ev.x2 ?? ev.x, ev.y2 ?? ev.y, 1.2, c, 14, 2.4, 0.5, 0.3, 0.8, 0);
            fx.ring(ev.x2 ?? ev.x, ev.y2 ?? ev.y, 1.6, c, 0.35);
            break;
          case 'ring':
            fx.ring(ev.x, ev.y, ev.r ?? 2, c);
            break;
          case 'burst':
            fx.burst(ev.x, ev.y, 1.1, c, 14, 3, 0.5, 0.32, 0.7);
            fx.ring(ev.x, ev.y, ev.r ?? 1.2, c, 0.3);
            break;
          case 'slam':
            fx.ring(ev.x, ev.y, ev.r ?? 4, c, 0.55);
            fx.flashCircle(ev.x, ev.y, ev.r ?? 4, c, 0.4);
            fx.burst(ev.x, ev.y, 0.4, 0xd9cfae, 26, (ev.r ?? 4) * 1.4, 0.7, 0.38, 0.5, 6);
            this.addShake(0.22, ev.x, ev.y);
            break;
          case 'parcelBoom':
            fx.flashCircle(ev.x, ev.y, ev.r ?? 2.5, 0xff8a3c, 0.4);
            fx.ring(ev.x, ev.y, ev.r ?? 2.5, 0xffd27a, 0.4);
            fx.burst(ev.x, ev.y, 1.0, 0xff8a3c, 26, 5, 0.6, 0.4, 0.8, 3);
            this.addShake(0.12, ev.x, ev.y);
            break;
          case 'shield':
            fx.ring(ev.x, ev.y, 1.5, 0x8fe6ff, 0.4);
            fx.burst(ev.x, ev.y, 1.4, 0x8fe6ff, 10, 1.6, 0.5, 0.28, 0.6, 0);
            break;
          case 'emberHit':
            fx.burst(ev.x, ev.y, 1.2, 0xff8a3c, 12, 3.4, 0.4, 0.3, 0.6);
            break;
          case 'refractHit':
            fx.burst(ev.x, ev.y, 1.2, 0x9fecff, 14, 3.6, 0.4, 0.3, 0.6);
            fx.ring(ev.x, ev.y, 1.4, 0xffffff, 0.25);
            break;
          case 'marginBurst':
            fx.ring(ev.x, ev.y, 2.2, 0xb48cff, 0.45);
            fx.burst(ev.x, ev.y, 1.4, 0xf2e8ff, 22, 3.6, 0.6, 0.32, 0.8, 0);
            break;
          case 'mark':
            fx.ring(ev.x, ev.y, 1.8, c === 0xffffff ? 0xff5ad6 : c, 0.6);
            break;
          case 'towerLock':
            fx.ring(ev.x, ev.y, 1.6, 0xff3a2a, 0.5);
            break;
          case 'spawnBig':
            fx.ring(ev.x, ev.y, 8, 0xff5ad6, 1.1);
            fx.burst(ev.x, ev.y, 1, 0xff5ad6, 50, 4, 1.2, 0.4, 1.6, -1);
            break;
          case 'respawn':
            fx.ring(ev.x, ev.y, 2.2, 0x9fd8ff, 0.6);
            fx.burst(ev.x, ev.y, 0.3, 0x9fd8ff, 18, 1.2, 0.9, 0.3, 2.4, -2);
            break;
          case 'wallHit':
          case 'wallBreak':
            fx.burst(ev.x, ev.y, 0.9, 0xbdb49c, ev.fx === 'wallBreak' ? 22 : 6, 3, 0.6, 0.34, 0.7, 7);
            break;
          case 'ricochet':
            fx.burst(ev.x, ev.y, 1.2, 0xffe6a8, 10, 3.6, 0.3, 0.26, 0.5);
            break;
          default:
            fx.burst(ev.x, ev.y, 1.0, c === 0xffffff ? 0xcfd6ee : c, 6, 2, 0.4, 0.26, 0.6);
        }
        break;
      }
    }
  }
}
