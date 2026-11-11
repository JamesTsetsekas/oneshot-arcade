// renderer: scene lifecycle, instanced entity views, fog, overlays, quality tiers. Never decides gameplay results.
import * as THREE from 'three';
import { TD } from '../sim/ext';
import { heightAt } from '../sim/map';
import type { Sim } from '../sim/sim';
import { FOG_VISIBLE } from '../sim/vision';
import { Ord, type SimEvent } from '../sim/types';
import { RTSCamera, CAM_FOV } from '../input/camera';
import { buildMerged, buildModel, type BuiltModel } from './models';
import { patchFog, Terrain } from './terrain';
import { Vfx } from './vfx';

export interface Settings {
  quality: 'low' | 'medium' | 'high';
  renderScale: number;
  shadows: boolean;
  effects: number; // 0..1
  antialias: boolean;
  palette: 'default' | 'deuter' | 'tritan';
  reducedMotion: boolean;
  edgeScroll: boolean;
  wasdPan: boolean;
  rotateCamera: boolean;
  scrollSpeed: number;
  master: number; sfx: number; music: number; ui: number;
  subtitles: boolean;
  keys: Record<string, string>;
  debugSurfaces: boolean;
  showStats: boolean;
  masterMuted: boolean;
}

export const PALETTES: Record<Settings['palette'], [number, number]> = {
  default: [0x3aa8ff, 0xff6a3d],
  deuter: [0x2a7fff, 0xffd23a],
  tritan: [0xff4fd8, 0x45e08a],
};

export interface PlacementView { def: number; x: number; y: number; ok: boolean; w: number; h: number; ox: number; oy: number; reason: string; fields: Array<{ x: number; y: number; r: number }>; coneFace?: number }
export interface ViewState {
  player: number; // -1 observer
  selection: Set<number>;
  hover: number;
  fogEnabled: boolean;
  placement: PlacementView | null;
  rangeCircle: { x: number; y: number; r: number } | null;
  dragBox: { x0: number; y0: number; x1: number; y1: number } | null;
  showOrders: boolean;
  rallyMode: boolean;
  statsDebug: string[];
  attackMoveMode: boolean;
}

interface Batch {
  td: (typeof TD)[number];
  model: BuiltModel;
  meshes: Partial<Record<'body' | 'head' | 'glow' | 'team', THREE.InstancedMesh>>;
  count: number;
  cap: number;
}

interface Corpse { def: number; x: number; z: number; y: number; face: number; t0: number; dur: number; team: number; scale: number }
interface Ghost { id: number; def: number; x: number; y: number; owner: number; tick: number; done: boolean; face: number }

const D = new THREE.Object3D();
const COLOR_TMP = new THREE.Color();
const GHOST_COLOR = new THREE.Color(0.5, 0.55, 0.62);

export class GameRenderer {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  cam: RTSCamera;
  terrain: Terrain;
  vfx = new Vfx();
  overlay: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  private batches = new Map<number, Batch>();
  private mats: { body: THREE.MeshStandardMaterial; head: THREE.MeshStandardMaterial; glow: THREE.MeshBasicMaterial; team: THREE.MeshBasicMaterial };
  sun: THREE.DirectionalLight;
  private corpses: Corpse[] = [];
  private ghosts = new Map<number, Ghost>();
  private phase = new Float32Array(2048);
  private roll = new Float32Array(2048);
  private headYaw = new Float32Array(2048);
  private clock = 0;
  private fogTimer = 0;
  w = 1; h = 1;
  placementMesh: THREE.Mesh | null = null;
  private placementCache = new Map<number, THREE.Mesh>();
  private footprint: THREE.Mesh;
  private pulsePool: THREE.Mesh[] = [];
  teamHex: [number, number] = PALETTES.default;
  private dust: THREE.Points;
  private rings: THREE.InstancedMesh;
  private ringCount = 0;
  lost = false;
  private tmpP = { x: 0, y: 0, z: 0 };
  private lastSettingsKey = '';
  drawCalls = 0;
  triangles = 0;

  constructor(private container: HTMLElement, private sim: Sim, private settings: Settings) {
    this.renderer = new THREE.WebGLRenderer({ antialias: settings.antialias, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    this.renderer.setClearColor(0x06080c);
    this.renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;outline:none';
    this.renderer.domElement.tabIndex = 0;
    container.appendChild(this.renderer.domElement);
    this.overlay = document.createElement('canvas');
    this.overlay.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
    container.appendChild(this.overlay);
    this.ctx = this.overlay.getContext('2d')!;

    this.cam = new RTSCamera(sim.map);
    this.scene.background = new THREE.Color(0x06080c);
    // lighting: one warm sun + hemisphere fill (baked-indirect stand-in)
    const hemi = new THREE.HemisphereLight(0xa9c3e0, 0x4a3d36, 1.05);
    this.scene.add(hemi);
    this.sun = new THREE.DirectionalLight(0xffe1b8, 2.6);
    this.sun.position.set(-40, 70, 30);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.left = -55; this.sun.shadow.camera.right = 55; this.sun.shadow.camera.top = 55; this.sun.shadow.camera.bottom = -55;
    this.sun.shadow.camera.near = 10; this.sun.shadow.camera.far = 220;
    this.sun.shadow.bias = -0.0006; this.sun.shadow.normalBias = 0.05;
    this.scene.add(this.sun); this.scene.add(this.sun.target);

    this.terrain = new Terrain(sim.map);
    this.scene.add(this.terrain.group);
    this.scene.add(this.vfx.group);

    const fogU = this.terrain.uniforms;
    const body = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.25, flatShading: true });
    const head = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.25, flatShading: true });
    const glow = new THREE.MeshBasicMaterial({ vertexColors: true });
    const team = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (const m of [body, head, glow, team]) patchFog(m, fogU);
    this.mats = { body, head, glow, team };

    // team base rings under every unit (readable team identification at any zoom)
    const rg = new THREE.RingGeometry(0.78, 1, 28);
    rg.rotateX(-Math.PI / 2);
    const rmat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide });
    patchFog(rmat, fogU);
    this.rings = new THREE.InstancedMesh(rg, rmat, 800);
    this.rings.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(800 * 3), 3);
    this.rings.frustumCulled = false;
    this.rings.count = 0;
    this.scene.add(this.rings);

    // placement footprint plate
    this.footprint = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x40ff90, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide }));
    this.footprint.rotation.x = -Math.PI / 2;
    this.footprint.visible = false;
    this.scene.add(this.footprint);

    // ambient dust motes (subtle, non-obscuring)
    const dg = new THREE.BufferGeometry();
    const dp = new Float32Array(160 * 3);
    for (let i = 0; i < 160; i++) { dp[i * 3] = Math.random() * 60 - 30; dp[i * 3 + 1] = Math.random() * 14; dp[i * 3 + 2] = Math.random() * 60 - 30; }
    dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    this.dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xcfd8e0, size: 0.09, transparent: true, opacity: 0.35, depthWrite: false }));
    this.dust.frustumCulled = false;
    this.scene.add(this.dust);

    const cv = this.renderer.domElement;
    cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.lost = true; });
    cv.addEventListener('webglcontextrestored', () => { this.lost = false; });
    this.applySettings(settings);
    this.resize();
  }

  applySettings(s: Settings) {
    this.settings = s;
    const key = JSON.stringify([s.quality, s.renderScale, s.shadows, s.palette, s.effects]);
    this.teamHex = PALETTES[s.palette];
    this.vfx.reduced = s.reducedMotion;
    this.vfx.density = s.quality === 'low' ? 0.4 : s.quality === 'medium' ? 0.75 : 1;
    this.vfx.density *= Math.max(0.2, s.effects);
    this.terrain.debugMesh.visible = s.debugSurfaces;
    this.cam.allowRotate = s.rotateCamera;
    if (key === this.lastSettingsKey) return;
    this.lastSettingsKey = key;
    const shadowOn = s.shadows && s.quality !== 'low';
    this.renderer.shadowMap.enabled = shadowOn;
    this.renderer.shadowMap.type = s.quality === 'high' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    this.sun.castShadow = shadowOn;
    const ms = s.quality === 'high' ? 2048 : 1024;
    if (this.sun.shadow.mapSize.x !== ms) { this.sun.shadow.mapSize.set(ms, ms); this.sun.shadow.map?.dispose(); this.sun.shadow.map = null; }
    this.scene.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.Material | undefined; if (m) m.needsUpdate = true; });
    this.resize();
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    const w = Math.max(2, Math.floor(rect.width)), h = Math.max(2, Math.floor(rect.height));
    this.w = w; this.h = h;
    const cap = this.settings.quality === 'high' ? 2 : this.settings.quality === 'medium' ? 1.5 : 1;
    const dpr = Math.min(window.devicePixelRatio || 1, cap) * this.settings.renderScale;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.cam.resize(w, h);
    const odpr = Math.min(window.devicePixelRatio || 1, 2);
    this.overlay.width = Math.floor(w * odpr); this.overlay.height = Math.floor(h * odpr);
    this.ctx.setTransform(odpr, 0, 0, odpr, 0, 0);
    this.vfx.setViewport(h * dpr, CAM_FOV);
  }

  getGhosts(): Ghost[] { return [...this.ghosts.values()]; }

  // ------------------------------------------------------------ batches
  private batch(def: number): Batch {
    let b = this.batches.get(def);
    if (b) return b;
    const td = TD[def];
    const model = buildModel(td.def.model);
    const cap = td.isUnit ? 360 : td.isStruct ? 100 : 160;
    const meshes: Batch['meshes'] = {};
    const mk = (g: THREE.BufferGeometry | null, mat: THREE.Material, key: 'body' | 'head' | 'glow' | 'team', cast: boolean) => {
      if (!g) return;
      const im = new THREE.InstancedMesh(g, mat, cap);
      im.frustumCulled = false;
      im.castShadow = cast; im.receiveShadow = cast;
      im.count = 0;
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      if (key === 'team') { im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3); im.instanceColor.setUsage(THREE.DynamicDrawUsage); }
      this.scene.add(im);
      meshes[key] = im;
    };
    mk(model.body, this.mats.body, 'body', true);
    mk(model.head, this.mats.head, 'head', true);
    mk(model.glow, this.mats.glow, 'glow', false);
    mk(model.team, this.mats.team, 'team', false);
    b = { td, model, meshes, count: 0, cap };
    this.batches.set(def, b);
    return b;
  }

  private ensureArrays(n: number) {
    if (this.phase.length >= n) return;
    const nn = Math.max(n, this.phase.length * 2);
    const grow = (a: Float32Array) => { const b = new Float32Array(nn); b.set(a); return b; };
    this.phase = grow(this.phase); this.roll = grow(this.roll); this.headYaw = grow(this.headYaw);
  }

  private teamColor(owner: number, capOwner = -1): THREE.Color {
    const o = owner >= 0 ? owner : capOwner;
    if (o < 0) return COLOR_TMP.setRGB(0.78, 0.8, 0.85);
    return COLOR_TMP.setHex(this.teamHex[o]);
  }

  private addInstance(b: Batch, x: number, y: number, z: number, yaw: number, pitch: number, roll: number, sx: number, sy: number, sz: number, headYaw: number, team: THREE.Color, dimmed: boolean) {
    if (b.count >= b.cap) return;
    const i = b.count++;
    D.position.set(x, y, z);
    D.rotation.order = 'YZX';
    D.rotation.set(roll, -yaw, pitch);
    D.scale.set(sx, sy, sz);
    D.updateMatrix();
    const m = b.meshes;
    if (m.body) m.body.setMatrixAt(i, D.matrix);
    if (m.glow) m.glow.setMatrixAt(i, D.matrix);
    if (m.team) {
      m.team.setMatrixAt(i, D.matrix);
      const c = dimmed ? GHOST_COLOR : team;
      m.team.instanceColor!.setXYZ(i, c.r, c.g, c.b);
    }
    if (m.head) {
      D.rotation.set(roll, -headYaw, pitch);
      D.updateMatrix();
      m.head.setMatrixAt(i, D.matrix);
    }
  }

  // ------------------------------------------------------------ events -> effects
  private visibleAt(view: ViewState, sim: Sim, x: number, y: number): boolean {
    if (view.player < 0 || !view.fogEnabled) return true;
    return sim.players[view.player].vis[sim.cellIdx(x, y)] === FOG_VISIBLE;
  }

  private weaponColor(vis: string | undefined): number {
    switch (vis) {
      case 'rifle': return 0xffd27a;
      case 'lance': return 0xaef0ff;
      case 'mortar': return 0xffa040;
      case 'spore': return 0xb6ff8a;
      case 'thorn': return 0xe9ffb0;
      case 'claw': return 0xffffff;
      case 'stag': return 0xd09bff;
      case 'arc': return 0xffe08a;
      case 'needle': return 0xe2b8ff;
      case 'beast': return 0xffd6ff;
      case 'weld': return 0x9bffe0;
      case 'heal': return 0x7dffb0;
      default: return 0xffffff;
    }
  }

  handleEvents(sim: Sim, events: SimEvent[], view: ViewState) {
    const V = this.vfx;
    const fx = this.settings.effects;
    for (const ev of events) {
      if (ev.k === 'shot') {
        if (!this.visibleAt(view, sim, ev.x, ev.y) && !this.visibleAt(view, sim, ev.tx ?? ev.x, ev.ty ?? ev.y)) continue;
        const col = this.weaponColor(ev.vis);
        const h0 = heightAt(sim.map, ev.x, ev.y), h1 = heightAt(sim.map, ev.tx ?? ev.x, ev.ty ?? ev.y);
        const isStruct = TD[ev.a ?? 0].isStruct;
        const mh = (isStruct ? 1.4 : TD[ev.a ?? 0].def.id === 'mortar_crawler' ? 1.2 : 0.95) + h0;
        const dx = (ev.tx ?? ev.x) - ev.x, dz = (ev.ty ?? ev.y) - ev.y;
        const dl = Math.hypot(dx, dz) || 1;
        const mx = ev.x + (dx / dl) * 0.7, mz = ev.y + (dz / dl) * 0.7;
        V.flash(mx, mh, mz, col, ev.vis === 'mortar' ? 1.4 : 0.6);
        if (ev.vis === 'mortar' || ev.vis === 'stag') V.burst(mx, mh, mz, 8, 0xcccccc, 1.4, 0.5, 0.5, -0.3);
        if (ev.b === 0) {
          const wide = ev.vis === 'lance' ? 0.22 : ev.vis === 'claw' || ev.vis === 'thorn' || ev.vis === 'beast' ? 0 : 0.07;
          if (wide > 0) V.beam(mx, mh, mz, ev.tx ?? ev.x, h1 + 0.8, ev.ty ?? ev.y, col, wide, ev.vis === 'lance' ? 0.16 : 0.08);
        }
      } else if (ev.k === 'hit') {
        if (!this.visibleAt(view, sim, ev.x, ev.y)) continue;
        const h = heightAt(sim.map, ev.x, ev.y);
        const big = (ev.a ?? 0) > 25;
        V.burst(ev.x, h + 0.8, ev.y, big ? 9 : 4, ev.b ? 0xffcf90 : 0xfff1c0, big ? 3.4 : 2.2, 0.35, big ? 0.5 : 0.3, 5);
        if (ev.b) V.burst(ev.x + (Math.random() - 0.5), h + 0.6, ev.y + (Math.random() - 0.5), 2, 0x8a8a8a, 0.8, 0.8, 0.9, -0.5);
      } else if (ev.k === 'death') {
        if (!this.visibleAt(view, sim, ev.x, ev.y) && ev.owner !== view.player) continue;
        const td = TD[ev.a ?? 0];
        const h = heightAt(sim.map, ev.x, ev.y);
        const verdant = td.def.faction === 'verdant';
        const dc = verdant ? 0xb894ff : 0xffb347;
        if (td.isNeutral) {
          if (td.def.id === 'crystal_barrier') { V.burst(ev.x, h + 1, ev.y, 40, 0x9d7cff, 5, 0.9, 0.7, 6); V.ring(ev.x, h, ev.y, 0.5, 4, 0.6, 0x9d7cff); }
          continue;
        }
        if (ev.text === 'cancel') continue;
        if (td.isStruct) {
          V.burst(ev.x, h + 1.2, ev.y, 46, dc, 5.5, 0.9, 1.0, 5);
          V.burst(ev.x, h + 0.8, ev.y, 16, 0x777777, 2.5, 1.4, 1.6, -0.6);
          V.ring(ev.x, h, ev.y, 0.5, td.w * 1.4, 0.7, dc);
          this.corpses.push({ def: ev.a ?? 0, x: ev.x, z: ev.y, y: h, face: ev.b ?? 0, t0: this.clock, dur: 1.2, team: ev.owner, scale: 1 });
        } else {
          V.burst(ev.x, h + 0.6, ev.y, td.def.hp > 200 ? 26 : 12, dc, td.def.hp > 200 ? 4 : 2.6, 0.7, td.def.hp > 200 ? 0.8 : 0.5, 5);
          this.corpses.push({ def: ev.a ?? 0, x: ev.x, z: ev.y, y: h, face: ev.b ?? 0, t0: this.clock, dur: verdant ? 1.0 : 0.6, team: ev.owner, scale: 1 });
        }
      } else if (ev.k === 'erupt') {
        if (!this.visibleAt(view, sim, ev.x, ev.y)) continue;
        const h = heightAt(sim.map, ev.x, ev.y);
        const r = ev.a ?? 2;
        if (ev.vis === 'eruption') { V.burst(ev.x, h + 0.3, ev.y, 34, 0xd09bff, 4.5, 0.8, 0.9, 6); V.ring(ev.x, h, ev.y, 0.3, r * 1.15, 0.45, 0xd9a6ff); }
        else { V.burst(ev.x, h + 0.4, ev.y, 26, 0xffa040, 4.5, 0.7, 0.9, 6); V.ring(ev.x, h, ev.y, 0.3, r * 1.15, 0.4, 0xffc070); V.flash(ev.x, h + 0.6, ev.y, 0xffd9a0, 2.4); }
        if (!this.settings.reducedMotion && r >= 2) this.shake = Math.max(this.shake, 1.0 * Math.min(1, fx));
      } else if (ev.k === 'weld') {
        if (!this.visibleAt(view, sim, ev.x, ev.y)) continue;
        V.beam(ev.x, heightAt(sim.map, ev.x, ev.y) + 1, ev.y, ev.tx ?? ev.x, heightAt(sim.map, ev.tx ?? ev.x, ev.ty ?? ev.y) + 0.8, ev.ty ?? ev.y, this.weaponColor(ev.vis === 'heal' ? 'heal' : 'weld'), 0.1, 0.22);
      } else if (ev.k === 'ability') {
        if (!this.visibleAt(view, sim, ev.x, ev.y)) continue;
        const h = heightAt(sim.map, ev.x, ev.y);
        V.ring(ev.x, h, ev.y, 0.3, 2.2, 0.5, 0xd9a6ff);
        V.burst(ev.x, h + 0.5, ev.y, 18, 0xd9a6ff, 2.5, 0.6, 0.5, -0.5);
        if (ev.vis === 'rootstep' && ev.tx !== undefined) { V.ring(ev.tx, heightAt(sim.map, ev.tx, ev.ty!), ev.ty!, 0.3, 2.2, 0.5, 0xd9a6ff); V.burst(ev.tx, 0.8, ev.ty!, 18, 0xd9a6ff, 2.5, 0.6, 0.5, -0.5); }
      } else if (ev.k === 'spike') {
        if (!this.visibleAt(view, sim, ev.x, ev.y)) continue;
        V.ring(ev.x, heightAt(sim.map, ev.x, ev.y), ev.y, 0.3, 8, 0.8, 0xffd27a);
      } else if (ev.k === 'silence') {
        if (!this.visibleAt(view, sim, ev.x, ev.y)) continue;
        V.ring(ev.x, heightAt(sim.map, ev.x, ev.y), ev.y, 0.3, ev.a ?? 3, 0.6, 0xb57bff);
      } else if (ev.k === 'built' || ev.k === 'trained') {
        if (!this.visibleAt(view, sim, ev.x, ev.y)) continue;
        const h = heightAt(sim.map, ev.x, ev.y);
        V.ring(ev.x, h, ev.y, 0.5, ev.k === 'built' ? 3.2 : 1.6, 0.5, this.teamHex[Math.max(0, ev.owner)]);
        V.burst(ev.x, h + 0.5, ev.y, ev.k === 'built' ? 24 : 8, this.teamHex[Math.max(0, ev.owner)], 2.8, 0.6, 0.5, -0.4);
      } else if (ev.k === 'captured' || ev.k === 'pod') {
        const h = heightAt(sim.map, ev.x, ev.y);
        V.ring(ev.x, h, ev.y, 0.5, 5, 0.9, ev.k === 'pod' ? 0xffc04d : this.teamHex[Math.max(0, ev.owner)]);
        V.burst(ev.x, h + 1, ev.y, 22, ev.k === 'pod' ? 0xffc04d : 0xb8f4ff, 3, 0.8, 0.6, -0.5);
      } else if (ev.k === 'depleted') {
        V.burst(ev.x, 0.5 + heightAt(sim.map, ev.x, ev.y), ev.y, 14, 0x44e9d0, 2, 0.7, 0.5, 2);
      } else if (ev.k === 'placed') {
        const h = heightAt(sim.map, ev.x, ev.y);
        V.burst(ev.x, h + 0.3, ev.y, 14, 0xcfd8e0, 2, 0.6, 0.8, -0.2);
      }
    }
  }
  shake = 0;

  // ------------------------------------------------------------ main draw
  render(sim: Sim, alpha: number, dt: number, view: ViewState) {
    if (this.lost) return;
    this.clock += dt;
    const sd = sim.tick;
    this.ensureArrays(sim.cap);
    const cam = this.cam;
    // camera shake (3 px style impulse), respects reduced motion
    if (this.shake > 0 && !this.settings.reducedMotion) {
      const s = this.shake * 0.12;
      cam.camera.position.x += (Math.random() - 0.5) * s; cam.camera.position.y += (Math.random() - 0.5) * s;
    }
    this.shake = Math.max(0, this.shake - dt * 5);
    // sun follows camera target so shadow map stays dense
    this.sun.position.set(cam.tx - 40, 70, cam.tz + 30);
    this.sun.target.position.set(cam.tx, 0, cam.tz);
    this.sun.target.updateMatrixWorld();

    // fog texture
    this.fogTimer -= dt;
    if (this.fogTimer <= 0) {
      this.fogTimer = 0.06;
      const all = view.player < 0 || !view.fogEnabled || sim.pulseActive();
      const pl = sim.players[Math.max(0, view.player)];
      this.terrain.updateFog(pl.vis, pl.seen, all, 0.06);
    }
    this.terrain.setFogEnabled(view.fogEnabled && view.player >= 0);

    // ---- gather instances
    for (const b of this.batches.values()) b.count = 0;
    this.ringCount = 0;
    const local = view.player;
    const ghostsSeen = new Set<number>();
    const tc = new THREE.Color();
    for (const id of sim.ids) {
      if (!sim.alive[id]) continue;
      const def = sim.type[id];
      const td = TD[def];
      const owner = sim.owner[id];
      const e = sim.ext[id];
      let vis = true;
      if (local >= 0 && view.fogEnabled && owner !== local) vis = sim.visibleTo(local, id);
      if (!vis) {
        if (owner >= 0 && td.isStruct) {
          const g = this.ghosts.get(id);
          if (g) this.drawGhost(g);
        } else if (td.isNeutral && (def === 0 || true)) {
          // neutrals are static scenery known from the start; show if explored
          if (local >= 0 && sim.players[local].seen[sim.cellIdx(sim.x[id], sim.y[id])]) { /* fallthrough to draw as explored */ } else continue;
        } else continue;
      }
      if (owner >= 0 && owner !== local && td.isStruct && vis) this.ghosts.set(id, { id, def, x: sim.x[id], y: sim.y[id], owner, tick: sim.tick, done: e.done, face: sim.face[id] });
      ghostsSeen.add(id);
      const b = this.batch(def);
      let x = sim.x[id], y = sim.y[id];
      let yaw = sim.face[id];
      let h: number;
      let pitch = 0, roll = 0, sx = 1, sy = 1, sz = 1;
      let hy = yaw;
      let yOff = 0;
      if (td.isUnit) {
        x = sim.px[id] + (sim.x[id] - sim.px[id]) * alpha;
        y = sim.py[id] + (sim.y[id] - sim.py[id]) * alpha;
        h = heightAt(sim.map, x, y);
        const moving = e.moving;
        this.phase[id] += dt * (moving ? 6 + td.def.speed * 1.6 : 1.5);
        const ph = this.phase[id];
        let bob = moving ? Math.abs(Math.sin(ph)) * 0.07 : Math.sin(ph * 0.5 + id) * 0.012;
        const wantRoll = Math.max(-0.35, Math.min(0.35, -e.turn * 1.6));
        this.roll[id] += (wantRoll - this.roll[id]) * Math.min(1, dt * 12);
        roll = this.roll[id] + (moving ? Math.sin(ph) * 0.03 : 0);
        pitch = moving ? -0.07 : 0;
        const since = sd + alpha - e.atkTick;
        if (since >= 0 && since < 5) { const k = 1 - since / 5; const rec = -0.18 * k; x += Math.cos(yaw) * rec; y += Math.sin(yaw) * rec; sx = 1 + 0.06 * k; sy = 1 - 0.05 * k; }
        if (e.wind > 0) { pitch += 0.12; sy = 1.05; }
        if (td.isWorker && e.wph === 1) { bob = Math.abs(Math.sin(ph * 3)) * 0.12; pitch = -0.25; }
        if (td.isWorker && e.orders[0] && (e.orders[0].k === Ord.Build || e.orders[0].k === Ord.Resume || e.orders[0].k === Ord.Repair) && !e.moving) { bob = Math.abs(Math.sin(ph * 3)) * 0.1; pitch = -0.2; }
        if (e.mode > 0 && td.def.id === 'carapace_guard') { const k = Math.min(1, e.mode / 10); sy = 1 - 0.3 * k; sx = sz = 1 + 0.15 * k; }
        if (e.mode > 0 && td.def.id === 'bulwark') { const k = Math.min(1, e.mode / 18); sy = 1 - 0.14 * k; pitch += 0.05 * k; }
        if (e.chT > 0) { sx = sz = 1 + Math.sin(this.clock * 30) * 0.06; }
        yOff = bob + (td.isHover ? 1.5 + Math.sin(this.clock * 2.4 + id) * 0.18 : 0);
        // turret/head tracks its target
        let want = yaw;
        if (e.target >= 0 && sim.alive[e.target] && sd - e.lastAtk < 40) want = Math.atan2(sim.y[e.target] - y, sim.x[e.target] - x);
        let d = want - this.headYaw[id];
        while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
        this.headYaw[id] += d * Math.min(1, dt * 12);
        hy = td.def.id === 'glimmerwing' || td.def.id === 'tender' || td.def.id === 'bloom_sage' ? yaw + Math.sin(this.clock * 8 + id) * 0.4 * (td.def.id === 'glimmerwing' ? 1 : 0) : this.headYaw[id];
        if (td.def.id === 'glimmerwing') { sy = 1; roll += Math.sin(this.clock * 14 + id) * 0.08; }
      } else {
        h = heightAt(sim.map, x, y);
        if (td.isStruct) {
          if (!e.done) { const k = e.total > 0 ? e.prog / e.total : 0; sy = 0.18 + 0.82 * k; const pulse = 0.85 + 0.15 * Math.sin(this.clock * 6); sx = sz = 0.7 + 0.3 * k * pulse; yOff = 0; }
          if (td.def.turret) {
            let want = sim.face[id];
            if (e.target >= 0 && sim.alive[e.target]) want = Math.atan2(sim.y[e.target] - y, sim.x[e.target] - x);
            if (td.def.weapon?.cone) hy = want; else { let d = want - this.headYaw[id]; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; this.headYaw[id] += d * Math.min(1, dt * 10); hy = this.headYaw[id]; }
          } else hy = yaw;
          const since = sd + alpha - e.atkTick;
          if (td.canAttack && since >= 0 && since < 4) { sy *= 1 + 0.04 * (1 - since / 4); }
        } else if (td.def.id === 'ore_seam' || td.def.id === 'flux_vent') {
          const k = e.maxAmount > 0 ? 0.55 + 0.45 * (e.amount / e.maxAmount) : 1;
          sx = sz = k; sy = k;
          yaw = (id * 1.7) % 6.28;
        } else if (td.def.id === 'watch_pylon') {
          yOff = 0;
        }
      }
      const dimmed = !vis;
      const team = this.teamColor(owner, e.capOwner);
      if (td.def.id === 'watch_pylon' && e.capOwner >= 0 && sim.pylonContested(id)) tc.setRGB(0.75, 0.75, 0.3);
      this.addInstance(b, x, h + yOff, y, yaw, pitch, roll, sx, sy, sz, hy, td.def.id === 'watch_pylon' && e.capOwner >= 0 && sim.pylonContested(id) ? tc : team, dimmed);
      if (td.isUnit && this.ringCount < 800) {
        const rr = td.def.radius * 1.25 + 0.12;
        D.position.set(x, h + 0.08, y); D.rotation.set(0, 0, 0); D.scale.set(rr, 1, rr); D.updateMatrix();
        this.rings.setMatrixAt(this.ringCount, D.matrix);
        this.rings.instanceColor!.setXYZ(this.ringCount, team.r, team.g, team.b);
        this.ringCount++;
      }
    }
    // drop ghosts whose real structure is gone and whose position is now visible
    if (local >= 0) {
      const pl = sim.players[local];
      for (const [id, g] of this.ghosts) {
        if (!sim.alive[id] && pl.vis[sim.cellIdx(g.x, g.y)] === FOG_VISIBLE) this.ghosts.delete(id);
        else if (!sim.alive[id] && sd - g.tick > 0 && pl.vis[sim.cellIdx(g.x, g.y)] === FOG_VISIBLE) this.ghosts.delete(id);
      }
    } else this.ghosts.clear();
    // corpses (collapse / dissolve)
    this.corpses = this.corpses.filter((c) => this.clock - c.t0 < c.dur);
    for (const c of this.corpses) {
      const k = (this.clock - c.t0) / c.dur;
      const b = this.batch(c.def);
      const td = TD[c.def];
      const s = Math.max(0.01, 1 - k * k);
      const sink = td.isStruct ? k * 1.6 : k * 0.6;
      this.addInstance(b, c.x, c.y - sink, c.z, c.face + k * 0.8, k * 0.5, k * 0.4, s, s * (1 - k * 0.3), s, c.face, this.teamColor(c.team), false);
    }
    this.rings.count = this.ringCount;
    this.rings.instanceMatrix.needsUpdate = true;
    this.rings.instanceColor!.needsUpdate = true;
    this.drawCalls = 0;
    for (const b of this.batches.values()) {
      for (const k of ['body', 'head', 'glow', 'team'] as const) {
        const m = b.meshes[k];
        if (!m) continue;
        m.count = b.count;
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
      }
    }

    // ---- projectiles
    const bolts: Array<{ x: number; y: number; z: number; color: number; size: number }> = [];
    for (const p of sim.projectiles) {
      const vx = p.x + Math.cos(Math.atan2(p.ty - p.y, p.tx - p.x)) * p.speed * alpha;
      const vy = p.y + Math.sin(Math.atan2(p.ty - p.y, p.tx - p.x)) * p.speed * alpha;
      if (!this.visibleAt(view, sim, vx, vy)) continue;
      const g = heightAt(sim.map, vx, vy);
      let hh = g + 1.0;
      let size = 0.5;
      if (p.arc) {
        const total = Math.max(1, p.total);
        const prog = Math.min(1, (sd + alpha - p.born) / total);
        hh = g + 1.0 + Math.sin(prog * Math.PI) * Math.min(8, 2 + total * 0.18);
        size = 0.8;
      }
      const col = this.weaponColor(p.visual);
      bolts.push({ x: vx, y: hh, z: vy, color: col, size });
      if (Math.random() < 0.8) this.vfx.emit(vx, hh, vy, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, 0.25, size * 0.6, col);
    }
    this.vfx.setBolts(bolts);
    // telegraphs for pending ground effects
    const tels: Array<{ x: number; y: number; z: number; r: number; color: number; fill: number }> = [];
    for (const ef of sim.effects) {
      if (!this.visibleAt(view, sim, ef.x, ef.y)) continue;
      const h = heightAt(sim.map, ef.x, ef.y);
      if (ef.kind === 'erupt') {
        const fill = Math.min(1, (sd + alpha - ef.born) / Math.max(1, ef.start - ef.born));
        tels.push({ x: ef.x, y: h, z: ef.y, r: ef.r, color: this.teamHex[Math.max(0, ef.owner)], fill });
      } else if (ef.kind === 'silence') {
        const active = sd >= ef.start;
        tels.push({ x: ef.x, y: h, z: ef.y, r: ef.r, color: active ? 0xb57bff : this.teamHex[Math.max(0, ef.owner)], fill: active ? 0.9 : Math.min(1, (sd - ef.born) / Math.max(1, ef.start - ef.born)) * 0.5 });
      } else if (ef.kind === 'spike') {
        this.vfx.emit(ef.x + (Math.random() - 0.5) * 0.4, h + 0.5 + Math.random() * 2, ef.y + (Math.random() - 0.5) * 0.4, 0, 1.2, 0, 0.5, 0.5, 0xffd27a);
      }
    }
    this.vfx.setTelegraphs(tels);
    this.vfx.update(dt);
    // dust motes drift
    const dp = this.dust.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < dp.count; i++) {
      dp.setX(i, dp.getX(i) + dt * 0.4); dp.setY(i, dp.getY(i) + Math.sin(this.clock + i) * dt * 0.1);
      if (dp.getX(i) > 30) dp.setX(i, -30);
    }
    dp.needsUpdate = true;
    this.dust.position.set(cam.tx, 0, cam.tz);
    this.dust.visible = !this.settings.reducedMotion && this.settings.quality !== 'low';

    // placement ghost
    this.updatePlacement(sim, view);
    this.renderer.render(this.scene, cam.camera);
    this.drawCalls = this.renderer.info.render.calls;
    this.triangles = this.renderer.info.render.triangles;
    this.drawOverlay(sim, view, alpha);
  }

  private drawGhost(g: Ghost) {
    const b = this.batch(g.def);
    const h = heightAt(this.sim.map, g.x, g.y);
    this.addInstance(b, g.x, h, g.y, g.face, 0, 0, 1, 1, 1, g.face, GHOST_COLOR, true);
  }

  // ------------------------------------------------------------ placement preview
  private updatePlacement(sim: Sim, view: ViewState) {
    const p = view.placement;
    if (this.placementMesh) this.placementMesh.visible = false;
    this.footprint.visible = false;
    if (!p) return;
    let m = this.placementCache.get(p.def);
    if (!m) {
      const geo = buildMerged(TD[p.def].def.model);
      m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.5, depthWrite: false }));
      this.scene.add(m);
      this.placementCache.set(p.def, m);
    }
    this.placementMesh = m;
    const cx = p.ox + p.w / 2, cz = p.oy + p.h / 2;
    const h = heightAt(sim.map, cx, cz);
    m.visible = true;
    m.position.set(cx, h, cz);
    m.rotation.y = TD[p.def].def.turret ? -(p.coneFace ?? 0) : 0;
    (m.material as THREE.MeshBasicMaterial).color.setHex(p.ok ? 0xffffff : 0xff7070);
    this.footprint.visible = true;
    this.footprint.position.set(cx, h + 0.12, cz);
    this.footprint.scale.set(p.w, p.h, 1);
    (this.footprint.material as THREE.MeshBasicMaterial).color.setHex(p.ok ? 0x40ff90 : 0xff4040);
  }

  // ------------------------------------------------------------ overlay (2D)
  worldToScreen(x: number, y: number, z: number, out = this.tmpP) {
    this.cam.project(x, y, z, this.w, this.h, out);
    return out;
  }

  private ellipse(sim: Sim, x: number, y: number, r: number, color: string, lw: number, fill?: string) {
    const h = heightAt(sim.map, x, y) + 0.06;
    const c = this.worldToScreen(x, h, y, { x: 0, y: 0, z: 0 });
    const e = this.worldToScreen(x + r, h, y, { x: 0, y: 0, z: 0 });
    const f = this.worldToScreen(x, h, y + r, { x: 0, y: 0, z: 0 });
    const rx = Math.abs(e.x - c.x) + 0.5, ry = Math.abs(f.y - c.y) + 0.5;
    if (c.z > 1 || c.z < -1) return;
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, rx, ry, 0, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    ctx.lineWidth = lw; ctx.strokeStyle = color; ctx.stroke();
  }

  private quad(sim: Sim, ox: number, oy: number, w: number, h: number, color: string, lw: number) {
    const ctx = this.ctx;
    const pts = [[ox, oy], [ox + w, oy], [ox + w, oy + h], [ox, oy + h]].map(([px, py]) => this.worldToScreen(px, heightAt(sim.map, px, py) + 0.08, py, { x: 0, y: 0, z: 0 }));
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.lineWidth = lw; ctx.strokeStyle = color; ctx.stroke();
  }

  private hex(c: number) { return '#' + c.toString(16).padStart(6, '0'); }

  private drawOverlay(sim: Sim, view: ViewState, alpha: number) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    const local = view.player;
    const myCol = this.hex(this.teamHex[Math.max(0, local)]);
    const sd = sim.tick;
    const tmp = { x: 0, y: 0, z: 0 };
    // selection rings + order lines
    for (const id of view.selection) {
      if (!sim.alive[id]) continue;
      const td = TD[sim.type[id]];
      const e = sim.ext[id];
      const ox = sim.owner[id];
      const col = this.hex(this.teamHex[Math.max(0, ox)]);
      let x = sim.x[id], y = sim.y[id];
      if (td.isUnit) { x = sim.px[id] + (sim.x[id] - sim.px[id]) * alpha; y = sim.py[id] + (sim.y[id] - sim.py[id]) * alpha; }
      if (td.isStruct || td.isNeutral) this.quad(sim, e.ox - 0.15, e.oy - 0.15, e.fw + 0.3, e.fh + 0.3, col, 2);
      else this.ellipse(sim, x, y, td.def.radius * 1.15 + 0.15, col, 2, col + '22');
      if (view.showOrders && ox === local && td.isUnit) {
        let px = x, py = y;
        ctx.lineWidth = 1.2;
        for (const o of e.orders) {
          const kindCol = o.k === Ord.AttackMove || o.k === Ord.Attack || o.k === Ord.Patrol ? '#ff6a5a' : o.k === Ord.Gather ? '#5fd7ff' : o.k === Ord.Build ? '#ffe27a' : '#7dff9a';
          const a = this.worldToScreen(px, heightAt(sim.map, px, py) + 0.3, py, tmp);
          const ax = a.x, ay = a.y;
          const tx = o.k === Ord.Attack && sim.alive[o.t] ? sim.x[o.t] : o.x, ty = o.k === Ord.Attack && sim.alive[o.t] ? sim.y[o.t] : o.y;
          const b = this.worldToScreen(tx, heightAt(sim.map, tx, ty) + 0.3, ty, tmp);
          ctx.strokeStyle = kindCol + 'bb';
          ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(b.x, b.y); ctx.stroke();
          ctx.fillStyle = kindCol;
          ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill();
          px = tx; py = ty;
        }
        // path failure / impairment status
        if (sd - e.failTick < 40) { const s = this.worldToScreen(x, heightAt(sim.map, x, y) + 2.2, y, tmp); ctx.fillStyle = '#ff7060'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center'; ctx.fillText('NO PATH', s.x, s.y); }
        if (sd < e.slowUntil) { const s = this.worldToScreen(x, heightAt(sim.map, x, y) + 2.0, y, tmp); ctx.fillStyle = '#b6ff8a'; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center'; ctx.fillText('SLOWED', s.x, s.y); }
        if (sd < e.silUntil) { const s = this.worldToScreen(x, heightAt(sim.map, x, y) + 2.0, y, tmp); ctx.fillStyle = '#c28bff'; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center'; ctx.fillText('SILENCED', s.x, s.y); }
        if (td.def.id === 'bulwark' && e.mode > 0) { const s = this.worldToScreen(x, heightAt(sim.map, x, y) + 2.0, y, tmp); ctx.fillStyle = '#ffd27a'; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center'; ctx.fillText(e.mode >= 18 ? 'BRACED' : 'BRACING', s.x, s.y); }
        if (td.def.id === 'carapace_guard' && e.mode > 0) { const s = this.worldToScreen(x, heightAt(sim.map, x, y) + 2.0, y, tmp); ctx.fillStyle = '#c9a7ff'; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center'; ctx.fillText('CURLED', s.x, s.y); }
      }
      // rally lines for selected producers
      if (td.isStruct && e.hasRally && ox === local) {
        const a = this.worldToScreen(sim.x[id], heightAt(sim.map, sim.x[id], sim.y[id]) + 0.5, sim.y[id], tmp);
        const ax = a.x, ay = a.y;
        const b = this.worldToScreen(e.rallyX, heightAt(sim.map, e.rallyX, e.rallyY) + 0.3, e.rallyY, tmp);
        ctx.strokeStyle = '#7dff9acc'; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#7dff9a'; ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill();
      }
    }
    // range circle for selected single unit / ability targeting
    if (view.rangeCircle) this.ellipse(sim, view.rangeCircle.x, view.rangeCircle.y, view.rangeCircle.r, '#ffffff66', 1.5);
    // hover
    if (view.hover >= 0 && sim.alive[view.hover] && !view.selection.has(view.hover)) {
      const id = view.hover;
      const td = TD[sim.type[id]];
      const e = sim.ext[id];
      const enemy = sim.owner[id] !== local;
      const col = enemy && sim.owner[id] >= 0 ? '#ff8a7a' : '#ffffffcc';
      if (td.isStruct || td.isNeutral) this.quad(sim, e.ox - 0.1, e.oy - 0.1, e.fw + 0.2, e.fh + 0.2, col, 1.5);
      else this.ellipse(sim, sim.x[id], sim.y[id], td.def.radius * 1.1 + 0.1, col, 1.5);
    }
    // placement helpers
    const pm = view.placement;
    if (pm) {
      for (const f of pm.fields) this.ellipse(sim, f.x, f.y, f.r, '#5fd7ff44', 1.2);
      const td = TD[pm.def];
      if (td.def.weapon) this.ellipse(sim, pm.ox + pm.w / 2, pm.oy + pm.h / 2, td.def.weapon.range, '#ffd27a88', 1.5);
      if (td.def.turret && td.def.weapon?.cone && pm.coneFace !== undefined) {
        const cx = pm.ox + pm.w / 2, cy = pm.oy + pm.h / 2, r = td.def.weapon.range, c = td.def.weapon.cone;
        ctx.beginPath();
        const c0 = this.worldToScreen(cx, heightAt(sim.map, cx, cy) + 0.2, cy, { x: 0, y: 0, z: 0 });
        ctx.moveTo(c0.x, c0.y);
        for (let i = 0; i <= 12; i++) {
          const a = pm.coneFace - c + (c * 2 * i) / 12;
          const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
          const s = this.worldToScreen(px, heightAt(sim.map, px, py) + 0.2, py, { x: 0, y: 0, z: 0 });
          ctx.lineTo(s.x, s.y);
        }
        ctx.closePath(); ctx.fillStyle = '#ffd27a22'; ctx.fill(); ctx.strokeStyle = '#ffd27acc'; ctx.lineWidth = 1.5; ctx.stroke();
      }
      if (!pm.ok && pm.reason) {
        const s = this.worldToScreen(pm.ox + pm.w / 2, heightAt(sim.map, pm.ox, pm.oy) + 3.4, pm.oy + pm.h / 2, tmp);
        ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = '#ff8a7a'; ctx.fillText(pm.reason, s.x, s.y);
      }
      // expansion sites
      if (td.isHall) for (const st of sim.map.sites) this.ellipse(sim, st.x, st.y, 5.5, '#ffe27a88', 1.5);
    }
    // expansion site markers when relevant are skipped otherwise.
    // health / progress bars
    const drawBar = (sx: number, sy: number, wpx: number, frac: number, color: string, accent: string, hgt = 4) => {
      ctx.fillStyle = 'rgba(8,10,14,0.85)'; ctx.fillRect(sx - wpx / 2 - 1, sy - 1, wpx + 2, hgt + 2);
      ctx.fillStyle = color; ctx.fillRect(sx - wpx / 2, sy, wpx * Math.max(0, Math.min(1, frac)), hgt);
      ctx.fillStyle = accent; ctx.fillRect(sx - wpx / 2 - 1, sy - 2, wpx + 2, 1);
    };
    const showAll = this.settings.showStats;
    for (const id of sim.ids) {
      if (!sim.alive[id]) continue;
      const td = TD[sim.type[id]];
      if (td.isNeutral && !(td.def.id === 'crystal_barrier')) continue;
      const ow = sim.owner[id];
      const selected = view.selection.has(id), hovered = view.hover === id;
      const e = sim.ext[id];
      const frac = sim.hp[id] / td.maxHp;
      const damaged = frac < 0.999;
      const building = td.isStruct && !e.done;
      if (td.isWorker && e.carry > 0 && ow === local && !(selected || hovered || damaged)) {
        // visible carried load: a coloured crystal above the worker
        const cx0 = sim.px[id] + (sim.x[id] - sim.px[id]) * alpha, cy0 = sim.py[id] + (sim.y[id] - sim.py[id]) * alpha;
        const cs = this.worldToScreen(cx0, heightAt(sim.map, cx0, cy0) + 1.55, cy0, tmp);
        if (cs.z < 1) {
          ctx.fillStyle = e.carryT === 1 ? '#44e9d0' : '#ff8be0'; ctx.strokeStyle = '#00000099'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(cs.x, cs.y - 5); ctx.lineTo(cs.x + 4, cs.y); ctx.lineTo(cs.x, cs.y + 5); ctx.lineTo(cs.x - 4, cs.y); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
      }
      if (!(selected || hovered || damaged || building || showAll)) continue;
      if (local >= 0 && view.fogEnabled && ow !== local && !sim.visibleTo(local, id)) continue;
      let x = sim.x[id], y = sim.y[id];
      if (td.isUnit) { x = sim.px[id] + (sim.x[id] - sim.px[id]) * alpha; y = sim.py[id] + (sim.y[id] - sim.py[id]) * alpha; }
      const hgt = heightAt(sim.map, x, y) + (td.isStruct || td.isNeutral ? (e.fw >= 5 ? 4.4 : e.fw >= 3 ? 3.4 : 2.6) : (td.def.radius > 0.9 ? 2.5 : 1.9) + (td.isHover ? 1.5 : 0));
      const s = this.worldToScreen(x, hgt, y, tmp);
      if (s.z > 1 || s.z < -1) continue;
      const wpx = td.isStruct || td.isNeutral ? Math.max(34, this.worldToScreen(x + e.fw / 2, hgt, y, { x: 0, y: 0, z: 0 }).x - s.x) * 1.6 : Math.max(24, td.def.radius * 38 * (42 / this.cam.height));
      const acc = this.hex(this.teamHex[Math.max(0, ow)]);
      const hc = frac > 0.6 ? '#5dff8a' : frac > 0.3 ? '#ffd24a' : '#ff5a4a';
      if (building) {
        drawBar(s.x, s.y, wpx, e.total ? e.prog / e.total : 0, '#e8e4d0', acc);
      } else {
        drawBar(s.x, s.y, wpx, frac, ow < 0 ? '#c8a0ff' : hc, ow < 0 ? '#9d7cff' : acc);
        if (td.def.shield && e.shield > 0) drawBar(s.x, s.y - 6, wpx, e.shield / td.def.shield, '#6fe3ff', '#6fe3ff', 3);
      }
      if (selected && td.maxEnergy > 0) drawBar(s.x, s.y + 7, wpx, e.energy / td.maxEnergy, '#6a8dff', '#6a8dff', 3);
      if (td.isWorker && e.carry > 0 && ow === local) {
        ctx.fillStyle = e.carryT === 1 ? '#44e9d0' : '#ff8be0';
        ctx.beginPath(); ctx.arc(s.x + wpx / 2 + 6, s.y + 2, 3.2, 0, Math.PI * 2); ctx.fill();
      }
      if (e.chT > 0) drawBar(s.x, s.y - 12, wpx, 1 - e.chT / Math.max(1, e.chTotal), '#9ae8ff', '#9ae8ff', 3);
    }
    // production progress for selected single producer shown in HUD; ghosts labels
    if (local >= 0) {
      ctx.font = '600 11px system-ui'; ctx.textAlign = 'center';
      for (const g of this.ghosts.values()) {
        if (sim.alive[g.id] && sim.visibleTo(local, g.id)) continue;
        const s = this.worldToScreen(g.x, heightAt(sim.map, g.x, g.y) + 4.2, g.y, tmp);
        if (s.z > 1) continue;
        const secs = Math.floor(g.tick / 20), tm = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
        ctx.fillStyle = 'rgba(8,10,14,0.7)'; ctx.fillRect(s.x - 34, s.y - 11, 68, 14);
        ctx.fillStyle = '#9fb0c0'; ctx.fillText(`last seen ${tm}`, s.x, s.y);
      }
      // watch pylon capture hints, pods
      for (const id of sim.ids) {
        if (!sim.alive[id] || TD[sim.type[id]].def.id !== 'watch_pylon') continue;
        if (!sim.players[local].seen[sim.cellIdx(sim.x[id], sim.y[id])]) continue;
        const o = sim.ext[id].capOwner;
        const s = this.worldToScreen(sim.x[id], heightAt(sim.map, sim.x[id], sim.y[id]) + 4, sim.y[id], tmp);
        if (s.z > 1) continue;
        ctx.fillStyle = o < 0 ? '#c8d0d8' : this.hex(this.teamHex[o]);
        ctx.beginPath(); ctx.moveTo(s.x, s.y + 6); ctx.lineTo(s.x - 5, s.y - 3); ctx.lineTo(s.x + 5, s.y - 3); ctx.closePath(); ctx.fill();
      }
    }
    // box select
    if (view.dragBox) {
      const b = view.dragBox;
      ctx.strokeStyle = myCol; ctx.lineWidth = 1.2; ctx.fillStyle = myCol + '22';
      ctx.fillRect(Math.min(b.x0, b.x1), Math.min(b.y0, b.y1), Math.abs(b.x1 - b.x0), Math.abs(b.y1 - b.y0));
      ctx.strokeRect(Math.min(b.x0, b.x1), Math.min(b.y0, b.y1), Math.abs(b.x1 - b.x0), Math.abs(b.y1 - b.y0));
    }
    if (view.statsDebug.length) {
      ctx.font = '12px ui-monospace,Consolas,monospace'; ctx.textAlign = 'left';
      view.statsDebug.forEach((l, i) => { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(8, 78 + i * 15, ctx.measureText(l).width + 8, 15); ctx.fillStyle = '#9ff'; ctx.fillText(l, 12, 90 + i * 15); });
    }
  }

  dispose() {
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.overlay.remove();
  }
}
