// renderer: scene lifecycle, instanced entity views, fog-of-war texture, selection/command decals,
// 2D overlay (health bars, drag box) and sim-event driven effects. Reads simulation state; never mutates it.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { DEF_INDEX, ENTITY_DEFS } from '../data/defs';
import { PALETTES, type Settings } from '../app/settings';
import { CameraRig } from '../input/camera';
import {
  FL_ANCHOR, FL_BRACED, FL_CONSTRUCTING, FL_CURLED, FL_WORKING, MAX_ENT, NEUTRAL, OT_AMOVE, OT_ATTACK, OT_BUILD, OT_CONSTRUCT, OT_GATHER, OT_PATROL,
  type Sim, type SimEvent,
} from '../sim/sim';
import { MAP_SIZE, VIS_SIZE, heightAt } from '../world/map';
import { FxSystem } from './fx';
import { makeEntityMaterial, shared } from './materials';
import { FLUX_COLOR, ORE_COLOR, hasModel, modelGeometry } from './models';
import { TerrainView } from './terrain';

export interface Placement { def: number; x: number; z: number; ok: boolean }
export interface RangePreview { x: number; z: number; r: number; color: number }

export interface ViewState {
  player: number;
  observer: boolean;
  selection: number[];
  hover: number;
  placement: Placement | null;
  ranges: RangePreview[];
  dragBox: { x0: number; y0: number; x1: number; y1: number } | null;
  showZones: boolean;
}

interface EntMesh { mesh: THREE.InstancedMesh; team: THREE.InstancedBufferAttribute; fx: THREE.InstancedBufferAttribute; fx2: THREE.InstancedBufferAttribute; n: number; cap: number }
interface Dying { def: number; owner: number; x: number; y: number; z: number; yaw: number; t0: number; dur: number; scale: number }

const FX_COLORS: Record<string, number> = { rifle: 0xffc66b, lance: 0xfff1b8, shell: 0xffa23a, claw: 0xc8ffe6, spore: 0xb48cff, needle: 0xd9c6ff, eruption: 0x9b6bff, arc: 0x9fd8ff, tool: 0xffd27a, gore: 0xe8ffd8 };

export class GameRenderer {
  readonly canvas: HTMLCanvasElement;
  readonly gl: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly rig = new CameraRig();
  readonly fx = new FxSystem();
  settings: Settings;
  sim: Sim | null = null;
  private terrain: TerrainView | null = null;
  private sun: THREE.DirectionalLight;
  private composer: EffectComposer | null = null;
  private bloom: UnrealBloomPass | null = null;
  private ents: (EntMesh | null)[] = [];
  private spikeMesh!: EntMesh;
  private cargoMesh!: EntMesh;
  private baseRings: THREE.InstancedMesh;
  private selRings: THREE.InstancedMesh;
  private thinRings: THREE.InstancedMesh;
  private lines: THREE.LineSegments;
  private linePos: Float32Array; private lineCol: Float32Array;
  private ghost: THREE.Mesh;
  private ghostPad: THREE.Mesh;
  private fogData = new Uint8Array(VIS_SIZE * VIS_SIZE);
  private fogCur = new Float32Array(VIS_SIZE * VIS_SIZE);
  private fogTex: THREE.DataTexture;
  private yaw = new Float32Array(MAX_ENT);
  private flash = new Float32Array(MAX_ENT);
  shown = new Uint8Array(MAX_ENT);
  private sy = new Float32Array(MAX_ENT);
  private rx = new Float32Array(MAX_ENT);
  private rz = new Float32Array(MAX_ENT);
  private dying: Dying[] = [];
  private teamColors = [new THREE.Color(), new THREE.Color(), new THREE.Color()];
  private m4 = new THREE.Matrix4(); private q = new THREE.Quaternion(); private p = new THREE.Vector3(); private s = new THREE.Vector3(); private e = new THREE.Euler(); private c = new THREE.Color();
  private viewProj = new THREE.Matrix4();
  private v4 = new THREE.Vector4();
  private ray = new THREE.Raycaster();
  time = 0;
  width = 1; height = 1; dpr = 1;
  debugNav = false;
  stats = { drawCalls: 0, triangles: 0, frameMs: 0, entities: 0 };
  lost = false;

  constructor(canvas: HTMLCanvasElement, settings: Settings) {
    this.canvas = canvas;
    this.settings = settings;
    this.gl = new THREE.WebGLRenderer({ canvas, antialias: settings.antialias, powerPreference: 'high-performance', alpha: false });
    this.gl.outputColorSpace = THREE.SRGBColorSpace;
    this.gl.toneMapping = THREE.ACESFilmicToneMapping;
    this.gl.toneMappingExposure = 1.2;
    this.gl.shadowMap.enabled = settings.shadows;
    this.gl.shadowMap.type = THREE.PCFShadowMap;
    this.gl.info.autoReset = false; // counted across every pass of a frame
    this.scene.background = new THREE.Color(0x05070a);
    const hemi = new THREE.HemisphereLight(0x9bb6e0, 0x2a2018, 1.1);
    this.scene.add(hemi);
    this.sun = new THREE.DirectionalLight(0xffdcae, 2.25);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = -75; sc.right = 75; sc.top = 75; sc.bottom = -75; sc.near = 10; sc.far = 320;
    this.sun.shadow.bias = -0.0006; this.sun.shadow.normalBias = 0.6;
    this.scene.add(this.sun, this.sun.target);
    this.scene.add(this.fx.group);

    this.fogTex = new THREE.DataTexture(this.fogData, VIS_SIZE, VIS_SIZE, THREE.RedFormat, THREE.UnsignedByteType);
    this.fogTex.magFilter = THREE.LinearFilter; this.fogTex.minFilter = THREE.LinearFilter;
    this.fogTex.wrapS = this.fogTex.wrapT = THREE.ClampToEdgeWrapping;
    this.fogTex.needsUpdate = true;
    shared.uFog.value = this.fogTex;

    // entity meshes
    for (let i = 0; i < ENTITY_DEFS.length; i++) {
      const d = ENTITY_DEFS[i];
      if (!hasModel(d.id)) { this.ents.push(null); continue; }
      const cap = d.cls === 'unit' ? 240 : d.cls === 'structure' ? 56 : d.id === 'ore' ? 96 : 24;
      this.ents.push(this.makeEntMesh(d.id, cap));
    }
    this.spikeMesh = this.makeEntMesh('spike', 16);
    this.cargoMesh = this.makeEntMesh('cargo', 200);
    this.cargoMesh.mesh.castShadow = false;

    const ringGeo = new THREE.RingGeometry(0.8, 1, 40); ringGeo.rotateX(-Math.PI / 2);
    const mk = (geo: THREE.BufferGeometry, cap: number, opacity: number) => {
      const m = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ transparent: true, opacity, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }), cap);
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; m.count = 0; m.renderOrder = 10;
      m.setColorAt(0, this.c.set(1, 1, 1));
      this.scene.add(m);
      return m;
    };
    const baseGeo = new THREE.RingGeometry(0.72, 1, 28); baseGeo.rotateX(-Math.PI / 2);
    this.baseRings = mk(baseGeo, 600, 0.42);
    this.selRings = mk(ringGeo, 400, 0.95);
    const thinGeo = new THREE.RingGeometry(0.985, 1, 96); thinGeo.rotateX(-Math.PI / 2);
    this.thinRings = mk(thinGeo, 96, 0.8);

    this.linePos = new Float32Array(600 * 6); this.lineCol = new Float32Array(600 * 6);
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.BufferAttribute(this.linePos, 3).setUsage(THREE.DynamicDrawUsage));
    lg.setAttribute('color', new THREE.BufferAttribute(this.lineCol, 3).setUsage(THREE.DynamicDrawUsage));
    this.lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.75, depthTest: false, toneMapped: false }));
    this.lines.frustumCulled = false; this.lines.renderOrder = 12;
    this.scene.add(this.lines);

    this.ghost = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false }));
    this.ghost.visible = false; this.ghost.renderOrder = 14;
    const pad = new THREE.PlaneGeometry(1, 1); pad.rotateX(-Math.PI / 2);
    this.ghostPad = new THREE.Mesh(pad, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false }));
    this.ghostPad.visible = false; this.ghostPad.renderOrder = 13;
    this.scene.add(this.ghost, this.ghostPad);

    this.fx.entityPos = (id, out) => {
      const s = this.sim;
      if (!s || !s.alive[id]) return false;
      out.set(s.x[id], heightAt(s.map, s.x[id], s.z[id]) + s.d(id).height * 0.55 + (s.d(id).hover ? 2 : 0), s.z[id]);
      return true;
    };
    this.applySettings(settings);
    this.resize();
  }

  private makeEntMesh(id: string, cap: number): EntMesh {
    const geo = modelGeometry(id).clone();
    geo.userData.height = modelGeometry(id).userData.height;
    const team = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3).setUsage(THREE.DynamicDrawUsage);
    const fxA = new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4).setUsage(THREE.DynamicDrawUsage);
    const fx2 = new THREE.InstancedBufferAttribute(new Float32Array(cap * 4), 4).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('iTeam', team); geo.setAttribute('iFx', fxA); geo.setAttribute('iFx2', fx2);
    const mesh = new THREE.InstancedMesh(geo, makeEntityMaterial(geo.userData.height), cap);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false; mesh.count = 0;
    mesh.castShadow = true; mesh.receiveShadow = true;
    this.scene.add(mesh);
    return { mesh, team, fx: fxA, fx2, n: 0, cap };
  }

  applySettings(s: Settings): void {
    this.settings = s;
    const pal = PALETTES[s.palette];
    this.teamColors[2].setHex(pal.neutral, THREE.SRGBColorSpace);
    this.gl.shadowMap.enabled = s.shadows;
    this.sun.castShadow = s.shadows;
    this.fx.quality = s.effects;
    this.scene.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.Material | undefined; if (m) m.needsUpdate = true; });
    this.resize();
  }

  setSim(sim: Sim, player: number): void {
    this.sim = sim;
    if (!this.terrain) { this.terrain = new TerrainView(sim.map); this.scene.add(this.terrain.group); }
    this.fogCur.fill(0);
    this.dying.length = 0;
    this.flash.fill(0);
    this.shown.fill(0);
    this.fx.clear();
    const start = sim.map.starts[player] ?? sim.map.starts[0];
    this.rig.jump(start.x + 3, start.z - 1, true);
    this.rig.hGoal = 40;
  }

  resize(): void {
    const w = this.canvas.clientWidth || window.innerWidth, h = this.canvas.clientHeight || window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2) * this.settings.renderScale;
    this.width = w; this.height = h;
    this.gl.setPixelRatio(this.dpr);
    this.gl.setSize(w, h, false);
    this.rig.setAspect(w / h);
    this.fx.setViewport(h * this.dpr, 45);
    if (this.settings.bloom) {
      if (!this.composer) {
        const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: this.settings.antialias ? 4 : 0 });
        this.composer = new EffectComposer(this.gl, rt);
        this.composer.addPass(new RenderPass(this.scene, this.rig.camera));
        this.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.42, 0.4, 0.95);
        this.composer.addPass(this.bloom);
        this.composer.addPass(new OutputPass());
      }
      this.composer.setPixelRatio(this.dpr);
      this.composer.setSize(w, h);
    } else if (this.composer) {
      this.composer.dispose();
      this.composer = null; this.bloom = null;
    }
  }

  setDebugNav(on: boolean): void { this.debugNav = on; this.terrain?.setDebug(on); }

  // ------------------------------------------------------------------ picking helpers
  /** Ground point under a canvas-relative pixel (CSS px). */
  screenToGround(sx: number, sy: number, out: { x: number; z: number }): boolean {
    const sim = this.sim;
    if (!sim) return false;
    this.ray.setFromCamera(new THREE.Vector2((sx / this.width) * 2 - 1, -(sy / this.height) * 2 + 1), this.rig.camera);
    const o = this.ray.ray.origin, d = this.ray.ray.direction;
    if (d.y >= -1e-4) return false;
    let t = -o.y / d.y;
    for (let i = 0; i < 6; i++) {
      const x = o.x + d.x * t, z = o.z + d.z * t;
      const h = heightAt(sim.map, Math.min(MAP_SIZE - 0.01, Math.max(0, x)), Math.min(MAP_SIZE - 0.01, Math.max(0, z)));
      t = (h - o.y) / d.y;
    }
    out.x = o.x + d.x * t; out.z = o.z + d.z * t;
    return true;
  }

  /** World -> canvas-relative CSS pixels. Returns false when behind the camera. */
  worldToScreen(x: number, y: number, z: number, out: { x: number; y: number }): boolean {
    const v = this.v4.set(x, y, z, 1).applyMatrix4(this.viewProj);
    if (v.w <= 0.01) return false;
    out.x = (v.x / v.w * 0.5 + 0.5) * this.width;
    out.y = (-v.y / v.w * 0.5 + 0.5) * this.height;
    return true;
  }

  entityY(e: number): number {
    const s = this.sim as Sim;
    return heightAt(s.map, s.x[e], s.z[e]) + (s.d(e).hover ? 2 : 0);
  }

  /** Whether the local view may currently draw this entity live. */
  canSee(view: ViewState, e: number): boolean {
    const s = this.sim as Sim;
    if (view.observer) return true;
    const o = s.owner[e];
    if (o === view.player) return true;
    const ps = s.players[view.player];
    const vi = s.visIndex(s.x[e], s.z[e]);
    if (o === NEUTRAL) return ps.explored[vi] > 0;
    return ps.visible[vi] > 0;
  }

  // ------------------------------------------------------------------ sim events -> effects
  handleEvents(events: SimEvent[], view: ViewState): void {
    const s = this.sim;
    if (!s) return;
    const ps = s.players[view.player];
    const vis = (x: number, z: number) => view.observer || ps.visible[s.visIndex(x, z)] > 0;
    const fx = this.fx;
    for (const ev of events) {
      switch (ev.t) {
        case 'fire': {
          if (!vis(ev.sx, ev.sz) && !vis(ev.tx, ev.tz)) break;
          const d = s.defs[s.def[ev.id]];
          const col = FX_COLORS[ev.fx] ?? 0xffffff;
          const sy = heightAt(s.map, ev.sx, ev.sz) + d.height * 0.72 + (d.hover ? 2 : 0);
          const dx = ev.tx - ev.sx, dz = ev.tz - ev.sz;
          const dl = Math.sqrt(dx * dx + dz * dz) || 1;
          const mx = ev.sx + (dx / dl) * (d.radius + 0.4), mz = ev.sz + (dz / dl) * (d.radius + 0.4);
          const td = s.alive[ev.target] ? s.d(ev.target) : null;
          const ty = heightAt(s.map, ev.tx, ev.tz) + (td ? td.height * 0.5 + (td.hover ? 2 : 0) : 0.3);
          const dur = ev.travel / 20;
          if (ev.fx === 'eruption') { fx.burst(mx, sy + 0.6, mz, 8, 2.5, 0.5, 0.5, col, 1, -1); break; }
          if (ev.fx === 'claw' || ev.fx === 'gore' || ev.fx === 'tool') {
            fx.burst(ev.tx - (dx / dl) * 0.4, ty, ev.tz - (dz / dl) * 0.4, ev.fx === 'gore' ? 9 : 5, 3.2, 0.25, 0.32, col, 0.8, 4);
            break;
          }
          fx.burst(mx, sy, mz, ev.fx === 'shell' ? 10 : 4, ev.fx === 'shell' ? 4 : 2.2, 0.22, ev.fx === 'shell' ? 0.7 : 0.4, col, 0.5, 0, 1.4);
          if (ev.travel <= 0) { fx.beam(mx, sy, mz, ev.tx, ty, ev.tz, col, 0.22, 0.16); break; }
          if (ev.fx === 'shell') fx.projectile(mx, sy, mz, ev.tx, ty - 0.2, ev.tz, -1, dur, Math.max(3, dl * 0.38), col, 0.7, 0.8);
          else if (ev.fx === 'lance') { fx.projectile(mx, sy, mz, ev.tx, ty, ev.tz, ev.target, dur, 0, col, 0.55, 0.9); fx.beam(mx, sy, mz, ev.tx, ty, ev.tz, 0xffd27a, 0.1, 0.22); }
          else if (ev.fx === 'spore') fx.projectile(mx, sy, mz, ev.tx, ty, ev.tz, ev.target, dur, 1.4, col, 0.5, 0.6);
          else fx.projectile(mx, sy, mz, ev.tx, ty, ev.tz, ev.target, dur, 0, col, ev.fx === 'arc' ? 0.5 : 0.3, 0);
          break;
        }
        case 'impact': {
          if (!vis(ev.x, ev.z)) break;
          const y = heightAt(s.map, ev.x, ev.z);
          const col = FX_COLORS[ev.fx] ?? 0xffffff;
          if (ev.splash > 0) {
            fx.burst(ev.x, y + 0.3, ev.z, 26, 7, 0.6, 0.85, col, 1, 6, 1.2);
            fx.burst(ev.x, y + 0.2, ev.z, 10, 3, 0.9, 1.3, ev.fx === 'shell' ? 0x6b5a4a : 0x4a3a7a, 0.6, 1, 0.5);
            fx.decal(ev.x, y, ev.z, 0.4, ev.splash, 0.45, col, 0, 0.9);
            if (!this.settings.reducedMotion) fx.shake = Math.max(fx.shake, 0.22);
          } else fx.burst(ev.x, y + 0.9, ev.z, 4, 2.4, 0.25, 0.35, col, 0.7, 3);
          break;
        }
        case 'hit': this.flash[ev.id] = 1; if (ev.shield && s.alive[ev.id] && vis(s.x[ev.id], s.z[ev.id])) fx.burst(s.x[ev.id] + s.fx[ev.id], this.entityY(ev.id) + 1.5, s.z[ev.id] + s.fz[ev.id], 6, 2, 0.3, 0.5, 0x9fd8ff, 0.8, 0); break;
        case 'death': {
          const d = s.defs[ev.def];
          if (ev.killer === -2 && d.cls !== 'structure') break;
          if (!vis(ev.x, ev.z) && ev.owner !== view.player) break;
          if (!hasModel(d.id)) break;
          const y = heightAt(s.map, ev.x, ev.z) + (d.hover ? 2 : 0);
          const big = d.cls === 'structure' || d.radius > 1;
          this.dying.push({ def: ev.def, owner: ev.owner, x: ev.x, y, z: ev.z, yaw: d.cls === 'unit' ? Math.atan2(ev.fx, ev.fz) : this.yaw[ev.id], t0: this.time, dur: d.cls === 'structure' ? 1.2 : d.cls === 'unit' ? 0.7 : 0.5, scale: 1 });
          const bio = d.faction === 'chorus';
          if (d.cls === 'resource') { fx.burst(ev.x, y + 0.5, ev.z, 12, 3, 0.5, 0.5, ORE_COLOR, 1, 4); break; }
          fx.burst(ev.x, y + d.height * 0.5, ev.z, big ? 40 : 14, big ? 8 : 4.5, big ? 0.9 : 0.55, big ? 1.0 : 0.55, bio ? 0xb48cff : 0xffa23a, 1, bio ? 1.5 : 7, 1.2);
          fx.burst(ev.x, y + d.height * 0.4, ev.z, big ? 18 : 6, big ? 4 : 2.5, 1.0, big ? 1.6 : 0.9, bio ? 0x2c5448 : 0x59606d, 0.8, bio ? 0.5 : 5, 0.6);
          if (big) { fx.decal(ev.x, y, ev.z, 0.5, d.footprint > 0 ? d.footprint * 0.9 : 3, 0.6, bio ? 0xb48cff : 0xffa23a); if (!this.settings.reducedMotion) fx.shake = Math.max(fx.shake, 0.3); }
          break;
        }
        case 'telegraph': {
          if (!vis(ev.x, ev.z)) break;
          const y = heightAt(s.map, ev.x, ev.z);
          const col = ev.owner === view.player ? 0x8ab8ff : 0xff5a4a;
          fx.decal(ev.x, y, ev.z, ev.r, ev.r, ev.ticks / 20, col, 0, 0.9);
          fx.decal(ev.x, y, ev.z, 0.1, ev.r, ev.ticks / 20, col, 1, 0.8);
          break;
        }
        case 'ability': {
          if (!vis(ev.x, ev.z)) break;
          const y = heightAt(s.map, ev.x, ev.z);
          if (ev.ab === 'mend') { fx.decal(ev.x, y, ev.z, 4, 4, 4, 0x8cffb4, 0, 0.7); fx.burst(ev.x, y + 0.4, ev.z, 30, 3.2, 1.6, 0.6, 0x8cffb4, 1, -1.2); }
          else if (ev.ab === 'weld') fx.burst(ev.x, y + 2, ev.z, 24, 4, 0.8, 0.5, 0xffd27a, 1, 2);
          else if (ev.ab === 'spike') { fx.decal(ev.x, y, ev.z, 0.5, 9, 0.9, 0x9fd8ff); fx.burst(ev.x, y + 1, ev.z, 12, 3, 0.6, 0.5, 0x9fd8ff); }
          else fx.decal(ev.x, y, ev.z, 0.3, 1.6, 0.35, 0xffffff, 0, 0.7);
          break;
        }
        case 'beam': {
          if (!s.alive[ev.from] || !s.alive[ev.to] || !vis(s.x[ev.from], s.z[ev.from])) break;
          fx.beam(s.x[ev.from], this.entityY(ev.from) + 1.1, s.z[ev.from], s.x[ev.to], this.entityY(ev.to) + s.d(ev.to).height * 0.5, s.z[ev.to], 0x7dffb0, 0.12, 0.3);
          if (Math.random() < 0.5) fx.burst(s.x[ev.to], this.entityY(ev.to) + s.d(ev.to).height * 0.5, s.z[ev.to], 2, 1.5, 0.4, 0.35, 0x7dffb0, 1, -1);
          break;
        }
        case 'built': case 'placed': {
          if (!vis(s.x[ev.id], s.z[ev.id])) break;
          const d = s.defs[ev.def];
          fx.decal(s.x[ev.id], heightAt(s.map, s.x[ev.id], s.z[ev.id]), s.z[ev.id], 0.5, d.footprint * 0.8, 0.6, ev.t === 'built' ? 0xbfffe0 : 0x9fd8ff);
          break;
        }
        case 'captured': fx.decal(s.x[ev.id], heightAt(s.map, s.x[ev.id], s.z[ev.id]), s.z[ev.id], 1, 12, 1.2, ev.owner === view.player ? 0x8ab8ff : 0xff5a4a); break;
        case 'salvage': if (vis(ev.x, ev.z)) fx.burst(ev.x, heightAt(s.map, ev.x, ev.z) + 0.6, ev.z, 20, 4, 0.8, 0.6, 0xffd27a, 1, 2); break;
        case 'pulse': fx.decal(MAP_SIZE / 2, -3, MAP_SIZE / 2, 2, 110, 2.4, 0x35e0d0, 0, 1); break;
      }
    }
  }

  orderMarker(x: number, z: number, color: number): void {
    const s = this.sim;
    if (!s) return;
    const y = heightAt(s.map, Math.min(MAP_SIZE - 1, Math.max(0, x)), Math.min(MAP_SIZE - 1, Math.max(0, z)));
    this.fx.decal(x, y, z, 1.5, 0.35, 0.4, color, 0, 1);
  }

  // ------------------------------------------------------------------ per-frame sync
  private put(em: EntMesh, x: number, y: number, z: number, yaw: number, sx: number, sy: number, sz: number, team: THREE.Color,
    flash: number, build: number, move: number, phase: number, ghost: number, gait: number, alpha: number, glow: number, rx = 0, rz = 0): void {
    const i = em.n;
    if (i >= em.cap) return;
    em.n++;
    this.e.set(rx, yaw, rz, 'YXZ');
    this.q.setFromEuler(this.e);
    this.p.set(x, y, z); this.s.set(sx, sy, sz);
    this.m4.compose(this.p, this.q, this.s);
    em.mesh.setMatrixAt(i, this.m4);
    const t = em.team.array as Float32Array, a = em.fx.array as Float32Array, b = em.fx2.array as Float32Array;
    t[i * 3] = team.r; t[i * 3 + 1] = team.g; t[i * 3 + 2] = team.b;
    a[i * 4] = flash; a[i * 4 + 1] = build; a[i * 4 + 2] = move; a[i * 4 + 3] = phase;
    b[i * 4] = ghost; b[i * 4 + 1] = gait; b[i * 4 + 2] = alpha; b[i * 4 + 3] = glow;
  }

  private ringAt(mesh: THREE.InstancedMesh, i: number, x: number, y: number, z: number, r: number, color: THREE.Color, bright = 1): void {
    this.p.set(x, y, z); this.s.set(r, 1, r); this.q.identity();
    this.m4.compose(this.p, this.q, this.s);
    mesh.setMatrixAt(i, this.m4);
    this.c.copy(color).multiplyScalar(bright);
    mesh.setColorAt(i, this.c);
  }

  render(alpha: number, dt: number, view: ViewState): void {
    const sim = this.sim;
    if (!sim || this.lost) return;
    const t0 = performance.now();
    this.time += dt;
    shared.uTime.value = this.time;
    shared.uFogOn.value = view.observer ? 0 : 1;
    const pal = PALETTES[this.settings.palette];
    this.teamColors[view.player].setHex(pal.self, THREE.SRGBColorSpace);
    this.teamColors[1 - view.player].setHex(pal.enemy, THREE.SRGBColorSpace);
    const map = sim.map;
    const rig = this.rig;
    rig.update(dt, heightAt(map, rig.tx, rig.tz), this.settings.reducedMotion ? 0 : this.fx.shake);
    this.viewProj.multiplyMatrices(rig.camera.projectionMatrix, rig.camera.matrixWorldInverse);
    this.sun.position.set(rig.tx - 55, 95, rig.tz + 38);
    this.sun.target.position.set(rig.tx, 0, rig.tz - 6);
    this.sun.target.updateMatrixWorld();
    this.updateFog(sim, view, dt);

    for (const em of this.ents) if (em) em.n = 0;
    this.spikeMesh.n = 0; this.cargoMesh.n = 0;
    let nBase = 0, nSel = 0, nThin = 0, nLine = 0;
    const ps = sim.players[view.player];
    const sel = view.selection;
    const selSet = sel.length > 0 ? new Set(sel) : null;
    const ids = sim.ids;
    const time = this.time;
    const white = this.c.clone().set(1, 1, 1);
    const k = Math.min(1, dt * 14);
    let shownCount = 0;
    const tickNow = sim.tick - 1 + alpha;
    for (let ii = 0; ii < ids.length; ii++) {
      const e = ids[ii];
      if (!sim.alive[e]) { this.shown[e] = 0; continue; }
      const di = sim.def[e];
      const em = this.ents[di];
      if (!em) continue;
      const d = sim.defs[di];
      const o = sim.owner[e];
      const see = this.canSee(view, e);
      this.shown[e] = see ? 1 : 0;
      if (!see) continue;
      shownCount++;
      const x = sim.px[e] + (sim.x[e] - sim.px[e]) * alpha, z = sim.pz[e] + (sim.z[e] - sim.pz[e]) * alpha;
      let y = heightAt(map, x, z);
      let team = this.teamColors[o];
      const fl = sim.flags[e];
      if (this.flash[e] > 0) this.flash[e] = Math.max(0, this.flash[e] - dt * 7);
      if (d.cls === 'unit') {
        const target = Math.atan2(sim.fx[e], sim.fz[e]);
        let dy = target - this.yaw[e];
        while (dy > Math.PI) dy -= Math.PI * 2;
        while (dy < -Math.PI) dy += Math.PI * 2;
        this.yaw[e] += dy * k;
        const vx = sim.vx[e], vz = sim.vz[e];
        const sp = Math.sqrt(vx * vx + vz * vz);
        const move = Math.min(1, sp / Math.max(0.5, d.speed));
        let sy = 1, sxz = 1, px = x, pz = z, glow = 0, lean = 0;
        if (d.hover) y += 2 + Math.sin(time * 2.2 + e) * 0.16;
        if (d.faction === 'chorus') { const br = Math.sin(time * 2 + e * 1.7) * 0.025; sy += br; sxz -= br * 0.5; }
        const since = tickNow - sim.lastFire[e];
        if (since >= 0 && since < 5 && d.weapon) {
          const kick = (1 - since / 5) * (d.weapon.melee ? -0.35 : 0.2) * Math.min(1.6, d.radius + 0.6);
          px -= sim.fx[e] * kick; pz -= sim.fz[e] * kick;
          glow = 1 - since / 5;
        }
        if (sim.windup[e] > 0) { sy *= 0.94; glow = 1.2; lean = -0.08; }
        if (fl & FL_WORKING) { y += Math.abs(Math.sin(time * 11 + e)) * 0.05; if (Math.random() < 0.12 * this.settings.effects) this.fx.burst(x + sim.fx[e] * 0.8, y + 0.6, z + sim.fz[e] * 0.8, 1, 2, 0.3, 0.3, d.faction === 'chorus' ? 0x8cffb4 : 0xffd27a, 1, 4); }
        if (fl & FL_CURLED) { sy *= 0.72; sxz *= 1.08; }
        if (fl & FL_BRACED) { sy *= 0.9; sxz *= 1.06; }
        lean += move * 0.07;
        this.put(em, px, y, pz, this.yaw[e], sxz, sy, sxz, team, this.flash[e], 1, move, e * 1.31, 0, 6 + d.speed * 1.6, 1, glow, lean);
        if (nBase < 600) this.ringAt(this.baseRings, nBase++, x, heightAt(map, x, z) + 0.05, z, d.radius * 1.05, team, 0.55);
        if (sim.carry[e] > 0 && this.cargoMesh.n < this.cargoMesh.cap) {
          this.c.setHex(sim.carryKind[e] === 1 ? ORE_COLOR : FLUX_COLOR, THREE.SRGBColorSpace);
          this.put(this.cargoMesh, x - sim.fx[e] * 0.3, y + d.height * 0.95, z - sim.fz[e] * 0.3, time * 2 + e, 1, 1, 1, this.c, 0, 1, 0, 0, 0, 0, 1, 0.5);
        }
      } else if (d.cls === 'structure') {
        const constructing = (fl & FL_CONSTRUCTING) !== 0;
        const build = constructing ? 0.06 + 0.94 * sim.progress[e] : 1;
        let yawS = 0;
        if (d.weapon) { const tg = Math.atan2(sim.fx[e], sim.fz[e]); let dy = tg - this.yaw[e]; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; this.yaw[e] += dy * k; yawS = this.yaw[e]; }
        const since = tickNow - sim.lastFire[e];
        const active = sim.queue[e].length > 0 && sim.queue[e][0].started ? 0.5 + 0.4 * Math.sin(time * 5) : 0;
        const bio = d.faction === 'chorus' ? 1 + Math.sin(time * 1.3 + e) * 0.012 : 1;
        this.put(em, x, y, z, yawS, bio, constructing && d.faction === 'chorus' ? 0.5 + 0.5 * sim.progress[e] : bio, bio, team, this.flash[e], d.faction === 'chorus' && constructing ? 1 : build, 0, 0, 0, 0, 1, since >= 0 && since < 4 ? 1.5 : active);
        if (constructing && Math.random() < 0.25 * this.settings.effects) this.fx.particle(x + (Math.random() - 0.5) * d.footprint, y + build * d.height, z + (Math.random() - 0.5) * d.footprint, 0, 0.8, 0, 0.6, 0.35, 0, d.faction === 'chorus' ? 0x8cffb4 : 0x9fd8ff);
      } else {
        // resources and neutral objects
        let scale = 1, yawN = (e * 2.399) % 6.283;
        if (d.id === 'ore') scale = 0.55 + 0.5 * Math.min(1, sim.amount[e] / 1400);
        else if (d.id === 'watch_pylon') { yawN = 0; team = sim.capOwner[e] >= 0 ? this.teamColors[sim.capOwner[e]] : this.teamColors[2]; }
        else if (d.id === 'barrier') { const cl = sim.cells[e] as number[]; const a = cl[0], b = cl[cl.length - 1]; const ex = Math.abs((b % MAP_SIZE) - (a % MAP_SIZE)), ez = Math.abs(((b / MAP_SIZE) | 0) - ((a / MAP_SIZE) | 0)); yawN = ex <= 4 && ez >= 6 ? Math.PI / 2 : -Math.PI / 4; if (yawN !== Math.PI / 2) scale = 0.95; }
        else if (d.id === 'vent') yawN = 0;
        else if (d.id === 'pod') y += Math.sin(time * 2 + e) * 0.05;
        this.put(em, x, y, z, yawN, scale, scale, scale, team, this.flash[e], 1, 0, 0, 0, 0, 1, 0);
      }
      this.yaw[e] = this.yaw[e] || 0;
      // selection + hover rings
      const isSel = selSet !== null && selSet.has(e);
      if ((isSel || e === view.hover) && nSel < 400) {
        const r = d.footprint > 0 ? d.footprint * 0.74 : d.radius * 1.35 + 0.1;
        const col = o === view.player ? team : o === NEUTRAL ? this.teamColors[2] : team;
        this.ringAt(this.selRings, nSel++, x, heightAt(map, x, z) + 0.09, z, r, isSel ? col : white, isSel ? 1.25 : 0.45);
        if (isSel && d.weapon && d.cls === 'structure' && nThin < 96) this.ringAt(this.thinRings, nThin++, x, y + 0.15, z, d.weapon.range + d.radius, col, 0.7);
      }
      // order lines for selected own units
      if (isSel && o === view.player && nLine < 590) {
        const ords = sim.orders[e];
        let lx = x, lz = z;
        for (let oi = 0; oi < ords.length && nLine < 590; oi++) {
          const ord = ords[oi];
          let tx = ord.x, tz = ord.z;
          if ((ord.t === OT_ATTACK || ord.t === OT_GATHER || ord.t === OT_CONSTRUCT) && ord.target >= 0 && sim.alive[ord.target]) { tx = sim.x[ord.target]; tz = sim.z[ord.target]; }
          const col = ord.t === OT_ATTACK || ord.t === OT_AMOVE || ord.t === OT_PATROL ? 0xff6a4a : ord.t === OT_GATHER ? 0x35e0d0 : ord.t === OT_BUILD || ord.t === OT_CONSTRUCT ? 0xffd27a : 0x7dff9a;
          this.c.setHex(col, THREE.SRGBColorSpace);
          const j = nLine * 6;
          this.linePos[j] = lx; this.linePos[j + 1] = heightAt(map, lx, lz) + 0.25; this.linePos[j + 2] = lz;
          this.linePos[j + 3] = tx; this.linePos[j + 4] = heightAt(map, tx, tz) + 0.25; this.linePos[j + 5] = tz;
          for (let q = 0; q < 2; q++) { this.lineCol[j + q * 3] = this.c.r * (q ? 1 : 0.25); this.lineCol[j + q * 3 + 1] = this.c.g * (q ? 1 : 0.25); this.lineCol[j + q * 3 + 2] = this.c.b * (q ? 1 : 0.25); }
          nLine++;
          if (sel.length <= 12 && nSel < 400 && oi === ords.length - 1) this.ringAt(this.selRings, nSel++, tx, heightAt(map, tx, tz) + 0.08, tz, 0.35, this.c, 0.9);
          lx = tx; lz = tz;
        }
        // rally line for production structures
        if (d.cls === 'structure' && !Number.isNaN(sim.rallyX[e]) && d.trains.length > 0) {
          const j = nLine * 6;
          const tx = sim.rallyX[e], tz = sim.rallyZ[e];
          this.c.setHex(0x7dff9a, THREE.SRGBColorSpace);
          this.linePos[j] = x; this.linePos[j + 1] = y + 0.3; this.linePos[j + 2] = z;
          this.linePos[j + 3] = tx; this.linePos[j + 4] = heightAt(map, tx, tz) + 0.3; this.linePos[j + 5] = tz;
          for (let q = 0; q < 6; q += 3) { this.lineCol[j + q] = this.c.r; this.lineCol[j + q + 1] = this.c.g; this.lineCol[j + q + 2] = this.c.b; }
          nLine++;
          if (nSel < 400) this.ringAt(this.selRings, nSel++, tx, heightAt(map, tx, tz) + 0.08, tz, 0.5, this.c, 1);
        }
      }
      // construction-field rings while placing
      if (view.showZones && o === view.player && d.zone > 0 && !(fl & FL_CONSTRUCTING) && nThin < 96) this.ringAt(this.thinRings, nThin++, x, y + 0.2, z, d.zone, this.teamColors[view.player], 0.6);
    }
    this.stats.entities = shownCount;
    // last-known enemy structures under fog
    if (!view.observer) {
      for (const g of ps.ghosts.values()) {
        if (ps.visible[sim.visIndex(g.x, g.z)]) continue;
        const em = this.ents[g.def];
        if (!em) continue;
        this.put(em, g.x, heightAt(map, g.x, g.z), g.z, 0, 1, 1, 1, this.teamColors[g.owner], 0, 1, 0, 0, 1, 0, 1, 0);
      }
    }
    // sensor spikes
    for (const fxa of sim.effects) {
      if (fxa.k !== 'spike') continue;
      if (!view.observer && fxa.owner !== view.player && !ps.visible[sim.visIndex(fxa.x, fxa.z)]) continue;
      this.put(this.spikeMesh, fxa.x, heightAt(map, fxa.x, fxa.z), fxa.z, time, 1, 1, 1, this.teamColors[fxa.owner], 0, 1, 0, 0, 0, 0, 1, 0.5 + 0.5 * Math.sin(time * 4));
      if (fxa.owner === view.player && nThin < 96) this.ringAt(this.thinRings, nThin++, fxa.x, heightAt(map, fxa.x, fxa.z) + 0.15, fxa.z, fxa.r, this.teamColors[fxa.owner], 0.35);
    }
    // death animations
    for (let i = this.dying.length - 1; i >= 0; i--) {
      const dg = this.dying[i];
      const t = (time - dg.t0) / dg.dur;
      if (t >= 1) { this.dying.splice(i, 1); continue; }
      const em = this.ents[dg.def];
      if (!em) continue;
      const d = sim.defs[dg.def];
      const mech = d.faction !== 'chorus';
      const sink = d.cls === 'structure' ? t * t * d.height * 0.5 : 0;
      const sy = mech ? 1 - t * 0.55 : 1 + t * 0.15;
      this.put(em, dg.x, dg.y - sink, dg.z, dg.yaw, mech ? 1 + t * 0.1 : 1 - t * 0.25, sy, mech ? 1 + t * 0.1 : 1 - t * 0.25, this.teamColors[Math.min(2, dg.owner)], (1 - t) * 0.6, 1, 0, 0, 0, 0, 1 - t, mech ? 0 : 2 * (1 - t), mech ? t * 0.5 : 0, mech ? t * 0.35 : 0);
    }
    for (const em of this.ents) if (em) this.commit(em);
    this.commit(this.spikeMesh); this.commit(this.cargoMesh);

    // range previews and placement ghost
    for (const r of view.ranges) {
      if (nThin >= 96) break;
      this.c.setHex(r.color, THREE.SRGBColorSpace);
      const cc = this.c.clone();
      this.ringAt(this.thinRings, nThin++, r.x, heightAt(map, Math.min(MAP_SIZE - 1, Math.max(0, r.x)), Math.min(MAP_SIZE - 1, Math.max(0, r.z))) + 0.18, r.z, r.r, cc, 1);
    }
    const pl = view.placement;
    if (pl) {
      const d = sim.defs[pl.def];
      const geo = modelGeometry(d.id);
      if (this.ghost.geometry !== geo) this.ghost.geometry = geo;
      const y = heightAt(map, pl.x, pl.z);
      this.ghost.position.set(pl.x, y, pl.z);
      (this.ghost.material as THREE.MeshBasicMaterial).color.setHex(pl.ok ? 0x6dffb0 : 0xff5a4a);
      this.ghostPad.position.set(pl.x, y + 0.07, pl.z);
      this.ghostPad.scale.set(d.footprint, 1, d.footprint);
      (this.ghostPad.material as THREE.MeshBasicMaterial).color.setHex(pl.ok ? 0x2fbf7a : 0xbf2f2f);
      this.ghost.visible = true; this.ghostPad.visible = true;
    } else { this.ghost.visible = false; this.ghostPad.visible = false; }

    this.finishRings(this.baseRings, nBase); this.finishRings(this.selRings, nSel); this.finishRings(this.thinRings, nThin);
    this.lines.geometry.setDrawRange(0, nLine * 2);
    if (nLine > 0) { (this.lines.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true; (this.lines.geometry.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true; }

    this.fx.update(dt);
    this.gl.info.reset();
    if (this.composer) this.composer.render(dt);
    else this.gl.render(this.scene, rig.camera);
    this.stats.drawCalls = this.gl.info.render.calls;
    this.stats.triangles = this.gl.info.render.triangles;
    this.stats.frameMs = performance.now() - t0;
  }

  private commit(em: EntMesh): void {
    em.mesh.count = em.n;
    if (em.n === 0) return;
    em.mesh.instanceMatrix.needsUpdate = true;
    em.team.needsUpdate = true; em.fx.needsUpdate = true; em.fx2.needsUpdate = true;
  }

  private finishRings(m: THREE.InstancedMesh, n: number): void {
    m.count = n;
    if (n > 0) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
  }

  private updateFog(sim: Sim, view: ViewState, dt: number): void {
    const ps = sim.players[view.player];
    const vis = ps.visible, exp = ps.explored;
    const cur = this.fogCur, data = this.fogData;
    const k = Math.min(1, dt * 7);
    const N = VIS_SIZE;
    for (let z = 0; z < N; z++) {
      for (let x = 0; x < N; x++) {
        const i = z * N + x;
        // 3x3 box blur of the target brightness for soft fog edges
        let sum = 0, cnt = 0;
        for (let dz = -1; dz <= 1; dz++) {
          const zz = z + dz;
          if (zz < 0 || zz >= N) continue;
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx;
            if (xx < 0 || xx >= N) continue;
            const j = zz * N + xx;
            sum += vis[j] ? 255 : exp[j] ? 128 : 14;
            cnt++;
          }
        }
        const target = sum / cnt;
        cur[i] += (target - cur[i]) * k;
        data[i] = cur[i];
      }
    }
    this.fogTex.needsUpdate = true;
  }

  // ------------------------------------------------------------------ 2D overlay: health bars, progress, drag box
  drawOverlay(ctx: CanvasRenderingContext2D, view: ViewState): void {
    const sim = this.sim;
    if (!sim) return;
    const w = this.width, h = this.height;
    ctx.clearRect(0, 0, w, h);
    const pal = PALETTES[this.settings.palette];
    const hex = (n: number) => '#' + n.toString(16).padStart(6, '0');
    const selSet = new Set(view.selection);
    const scr = { x: 0, y: 0 };
    const zoomK = 44 / this.rig.h;
    for (const e of sim.ids) {
      if (!sim.alive[e] || !this.shown[e]) continue;
      const d = sim.d(e);
      if (d.cls === 'resource' || d.id === 'pod') continue;
      const o = sim.owner[e];
      const constructing = (sim.flags[e] & FL_CONSTRUCTING) !== 0;
      const hurt = sim.hp[e] < d.hp - 0.5;
      const isSel = selSet.has(e);
      const capping = d.id === 'watch_pylon' && sim.capProgress[e] > 0;
      const queue = d.cls === 'structure' && o === view.player && sim.queue[e].length > 0;
      if (!(hurt || isSel || e === view.hover || constructing || capping || queue)) continue;
      if (d.id === 'watch_pylon' && !capping) continue;
      const x = sim.px[e] + (sim.x[e] - sim.px[e]) * 1, z = sim.z[e];
      const y = heightAt(sim.map, x, z) + d.height + (d.hover ? 2.2 : 0.35);
      if (!this.worldToScreen(x, y, z, scr)) continue;
      if (scr.x < -40 || scr.y < -40 || scr.x > w + 40 || scr.y > h + 40) continue;
      const bw = Math.max(26, Math.min(110, (d.footprint > 0 ? d.footprint * 11 : d.radius * 34) * zoomK));
      const bx = Math.round(scr.x - bw / 2), by = Math.round(scr.y - 6);
      if (capping) {
        ctx.fillStyle = 'rgba(8,12,18,0.8)'; ctx.fillRect(bx - 1, by - 1, bw + 2, 6);
        ctx.fillStyle = hex(sim.capBy[e] === view.player ? pal.self : pal.enemy); ctx.fillRect(bx, by, bw * (sim.capProgress[e] / 60), 4);
        continue;
      }
      if (d.id !== 'watch_pylon' && (hurt || isSel || e === view.hover || constructing)) {
        const frac = Math.max(0, sim.hp[e] / d.hp);
        ctx.fillStyle = 'rgba(8,12,18,0.82)'; ctx.fillRect(bx - 1, by - 1, bw + 2, 6);
        ctx.fillStyle = frac > 0.6 ? '#5dea8e' : frac > 0.3 ? '#f2c94c' : '#f2584a';
        ctx.fillRect(bx, by, bw * frac, 4);
        // team accent
        ctx.fillStyle = o === NEUTRAL ? hex(pal.neutral) : hex(o === view.player ? pal.self : pal.enemy);
        ctx.fillRect(bx - 1, by + 5, bw + 2, 1.5);
        if (d.shield > 0) { ctx.fillStyle = '#8fd0ff'; ctx.fillRect(bx, by - 4, bw * (sim.shield[e] / d.shield), 2); }
        if (d.energy > 0 && (isSel || e === view.hover)) { ctx.fillStyle = '#c59bff'; ctx.fillRect(bx, by - 4, bw * (sim.energy[e] / d.energy), 2); }
      }
      if (constructing) {
        ctx.fillStyle = 'rgba(8,12,18,0.82)'; ctx.fillRect(bx - 1, by + 8, bw + 2, 5);
        ctx.fillStyle = '#9fd8ff'; ctx.fillRect(bx, by + 9, bw * sim.progress[e], 3);
      } else if (queue) {
        const it = sim.queue[e][0];
        ctx.fillStyle = 'rgba(8,12,18,0.82)'; ctx.fillRect(bx - 1, by + 8, bw + 2, 5);
        ctx.fillStyle = it.started ? '#ffd27a' : '#f2584a'; ctx.fillRect(bx, by + 9, bw * (it.started ? it.progress / it.total : 1), 3);
      }
    }
    if (view.dragBox) {
      const b = view.dragBox;
      const x = Math.min(b.x0, b.x1), y = Math.min(b.y0, b.y1), bw = Math.abs(b.x1 - b.x0), bh = Math.abs(b.y1 - b.y0);
      ctx.fillStyle = 'rgba(80,220,200,0.10)'; ctx.fillRect(x, y, bw, bh);
      ctx.strokeStyle = 'rgba(120,255,230,0.9)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, bw, bh);
    }
  }

  // ------------------------------------------------------------------ portraits rendered from the real models
  renderIcons(size = 96): Record<string, string> {
    const out: Record<string, string> = {};
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x3a2c20, 1.6));
    const sun = new THREE.DirectionalLight(0xfff0d8, 2.4); sun.position.set(-3, 5, 4); scene.add(sun);
    const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    const rt = new THREE.WebGLRenderTarget(size, size, { samples: 4 });
    const buf = new Uint8Array(size * size * 4);
    const cv = document.createElement('canvas'); cv.width = size; cv.height = size;
    const ctx = cv.getContext('2d') as CanvasRenderingContext2D;
    const prevFog = shared.uFogOn.value;
    shared.uFogOn.value = 0;
    const team = new THREE.Color().setHex(PALETTES[this.settings.palette].self, THREE.SRGBColorSpace);
    const prevTarget = this.gl.getRenderTarget();
    const prevTone = this.gl.toneMapping;
    this.gl.toneMapping = THREE.NoToneMapping;
    for (const d of ENTITY_DEFS) {
      if (!hasModel(d.id)) continue;
      const em = this.makeEntMesh(d.id, 1);
      this.scene.remove(em.mesh);
      scene.add(em.mesh);
      this.put(em, 0, 0, 0, d.cls === 'unit' ? 0.7 : 0.5, 1, 1, 1, team, 0, 1, 0, 0, 0, 0, 1, 0);
      this.commit(em);
      const hgt = em.mesh.geometry.userData.height as number;
      const bs = em.mesh.geometry.boundingSphere as THREE.Sphere;
      const r = bs.radius * 1.05;
      const dist = r / Math.sin((15 * Math.PI) / 180);
      cam.position.set(0 + dist * 0.42, bs.center.y + dist * 0.5, dist * 0.78);
      cam.lookAt(0, bs.center.y, 0);
      cam.updateMatrixWorld();
      void hgt;
      this.gl.setRenderTarget(rt);
      this.gl.setClearColor(0x000000, 0);
      this.gl.clear();
      this.gl.render(scene, cam);
      this.gl.readRenderTargetPixels(rt, 0, 0, size, size, buf);
      const img = ctx.createImageData(size, size);
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const si = ((size - 1 - y) * size + x) * 4, di = (y * size + x) * 4;
        for (let c = 0; c < 3; c++) img.data[di + c] = Math.min(255, Math.pow(buf[si + c] / 255, 1 / 2.2) * 255);
        img.data[di + 3] = buf[si + 3];
      }
      ctx.putImageData(img, 0, 0);
      out[d.id] = cv.toDataURL('image/png');
      scene.remove(em.mesh);
      em.mesh.geometry.dispose();
      (em.mesh.material as THREE.Material).dispose();
    }
    this.gl.setRenderTarget(prevTarget);
    this.gl.toneMapping = prevTone;
    this.gl.setClearColor(0x05070a, 1);
    shared.uFogOn.value = prevFog;
    rt.dispose();
    return out;
  }

  dispose(): void {
    this.composer?.dispose();
    this.gl.dispose();
  }
}

export { DEF_INDEX, FL_ANCHOR };
