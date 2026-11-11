/** client-renderer: Three.js scene for The Broken Diadem. Reads simulation state; never mutates it. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { HERO_BY_ID } from '../shared/content';
import { BRUSH, CAMPS, MAP_H, MAP_W, MAP_X0, MAP_Z0, OBSTACLES, TEAM_BASE, STRUCTURES } from '../shared/map';
import { Rng, clamp, dist, lerp, lerpAngle } from '../shared/math';
import type { Sim } from '../sim/sim';
import type { Projectile, SimEvent, Unit, Zone } from '../sim/types';
import { paintMapArt, islandOutline } from './mapart';
import {
  TEAM_COLOR, TEAM_COLOR_CB, animateMonster, animateRig, buildFountain, buildHero, buildMonster, buildStructure, buildWard,
  glowMat, mesh, minionKit, stdMat, G, type ModelRig, type StructRig,
} from './models';
import { Decals, Particles, makeZoneMesh, zoneTexture } from './vfx';
import type { Settings } from './storage';

interface UView {
  id: number; kind: string; group: THREE.Group; rig?: ModelRig; srig?: StructRig; ring?: THREE.Mesh; atk: number; prevAtk: number; px: number; pz: number;
  speed: number; dead: boolean; heroId?: string; family?: string; wasVisible: boolean; hoverRing?: THREE.Mesh; fadeIn: number; height: number;
}
interface MinionPool { body: THREE.InstancedMesh; glow: THREE.InstancedMesh | null; n: number; height: number }

const MAX_MINIONS = 160;
const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const tmpV = new THREE.Vector3();
const tmpS = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

export class GameRenderer {
  readonly canvas: HTMLCanvasElement;
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(45, 16 / 9, 1, 400);
  readonly particles = new Particles(5200);
  readonly decals = new Decals();
  sim: Sim | null = null;
  settings: Settings;
  cam = { x: -55, z: 0, height: 34, shake: 0, lock: true, lookAhead: { x: 0, z: 0 } };
  private sun: THREE.DirectionalLight;
  private views = new Map<number, UView>();
  private minionPools = new Map<string, MinionPool>();
  private projViews = new Map<number, THREE.Object3D>();
  private zoneViews = new Map<number, THREE.Mesh>();
  private wallViews = new Map<number, THREE.Mesh>();
  private fogCanvas: HTMLCanvasElement;
  private fogCtx: CanvasRenderingContext2D;
  private fogTex: THREE.CanvasTexture;
  private fogMesh: THREE.Mesh;
  private fogTimer = 0;
  private fogOutline = islandOutline();
  private zoneTex = zoneTexture();
  private world = new THREE.Group();
  private dyn = new THREE.Group();
  private towerLines: THREE.Line[] = [];
  private clouds: THREE.Mesh[] = [];
  private fountains: THREE.Group[] = [];
  private hoverId = 0;
  private clock = 0;
  private lastTime = 0;
  indicator = new THREE.Group();
  private indRange: THREE.Mesh; private indShape: THREE.Mesh;
  width = 1280; height = 720;
  private pr = 1;

  constructor(canvas: HTMLCanvasElement, settings: Settings) {
    this.canvas = canvas;
    this.settings = settings;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', alpha: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.scene.background = new THREE.Color(0x0a1a36);
    this.scene.fog = new THREE.Fog(0x0a1a36, 110, 260);
    this.scene.add(this.world, this.dyn, this.particles.points, this.decals.group);
    // lights
    this.scene.add(new THREE.HemisphereLight(0xfff4e4, 0x587a60, 1.15));
    this.sun = new THREE.DirectionalLight(0xfff0d0, 2.4);
    this.sun.position.set(-26, 52, 22);
    this.sun.castShadow = true;
    const sc = this.sun.shadow.camera as THREE.OrthographicCamera;
    sc.left = -42; sc.right = 42; sc.top = 42; sc.bottom = -42; sc.near = 5; sc.far = 140;
    this.sun.shadow.bias = -0.0006;
    this.scene.add(this.sun, this.sun.target);
    // fog of war overlay
    this.fogCanvas = document.createElement('canvas');
    this.fogCanvas.width = 300; this.fogCanvas.height = 230;
    this.fogCtx = this.fogCanvas.getContext('2d')!;
    this.fogTex = new THREE.CanvasTexture(this.fogCanvas);
    this.fogTex.minFilter = THREE.LinearFilter;
    this.fogMesh = new THREE.Mesh(new THREE.PlaneGeometry(MAP_W + 2, MAP_H + 2), new THREE.MeshBasicMaterial({ map: this.fogTex, transparent: true, depthWrite: false }));
    this.fogMesh.rotation.x = -Math.PI / 2; this.fogMesh.position.y = 0.12; this.fogMesh.renderOrder = 5;
    this.scene.add(this.fogMesh);
    // aiming indicators
    this.indRange = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6 }));
    this.indShape = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.7 }));
    for (const m of [this.indRange, this.indShape]) { m.rotation.x = -Math.PI / 2; m.renderOrder = 12; m.position.y = 0.1; this.indicator.add(m); }
    this.indicator.visible = false;
    this.scene.add(this.indicator);
    this.buildWorld();
    this.applyQuality();
    this.resize();
  }

  applyQuality() {
    const q = this.settings.quality;
    this.pr = q === 'high' ? Math.min(window.devicePixelRatio || 1, 2) : q === 'medium' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1;
    this.renderer.setPixelRatio(this.pr);
    this.renderer.shadowMap.enabled = q !== 'low';
    this.renderer.shadowMap.type = q === 'high' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    this.sun.castShadow = q !== 'low';
    const ms = q === 'high' ? 2048 : 1024;
    if (this.sun.shadow.mapSize.x !== ms) { this.sun.shadow.mapSize.set(ms, ms); this.sun.shadow.map?.dispose(); (this.sun.shadow as { map: unknown }).map = null; }
    this.particles.low = this.settings.effects === 'low' || q === 'low';
    this.resize();
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth, h = this.canvas.clientHeight || window.innerHeight;
    this.width = w; this.height = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.particles.setScale(h);
  }

  // ------------------------------------------------------------ world construction
  private buildWorld() {
    const W = this.world;
    const S = 14; // px per meter
    const cv = document.createElement('canvas');
    cv.width = Math.round(MAP_W * S); cv.height = Math.round(MAP_H * S);
    const ctx = cv.getContext('2d')!;
    ctx.setTransform(S, 0, 0, S, -MAP_X0 * S, -MAP_Z0 * S);
    ctx.fillStyle = '#0a1a36'; ctx.fillRect(MAP_X0, MAP_Z0, MAP_W, MAP_H);
    paintMapArt(ctx, true);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    // island top (convex fan)
    const outline = islandOutline();
    const verts: number[] = [], uvs: number[] = [], idx: number[] = [];
    verts.push(0, 0, 0); uvs.push((0 - MAP_X0) / MAP_W, 1 - (0 - MAP_Z0) / MAP_H);
    outline.forEach((p) => { verts.push(p.x, 0, p.z); uvs.push((p.x - MAP_X0) / MAP_W, 1 - (p.z - MAP_Z0) / MAP_H); });
    for (let i = 0; i < outline.length; i++) idx.push(0, 1 + ((i + 1) % outline.length), 1 + i);
    const topGeo = new THREE.BufferGeometry();
    topGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    topGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    topGeo.setIndex(idx); topGeo.computeVertexNormals();
    const top = new THREE.Mesh(topGeo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, metalness: 0 }));
    top.receiveShadow = true;
    W.add(top);
    // rim / underside rock
    const rimPos: number[] = [], rimCol: number[] = [];
    const rock = new THREE.Color(0x6a5a78), rock2 = new THREE.Color(0x3a3050), grass = new THREE.Color(0x2a6a4a);
    for (let i = 0; i < outline.length; i++) {
      const a = outline[i], b = outline[(i + 1) % outline.length];
      const d1 = 5 + 3 * Math.sin(i * 1.7), d2 = 5 + 3 * Math.sin((i + 1) * 1.7);
      const push = (x: number, y: number, z: number, c: THREE.Color) => { rimPos.push(x, y, z); rimCol.push(c.r, c.g, c.b); };
      push(a.x, 0, a.z, grass); push(b.x, 0, b.z, grass); push(b.x * 0.92, -d2, b.z * 0.92, rock2);
      push(a.x, 0, a.z, grass); push(b.x * 0.92, -d2, b.z * 0.92, rock2); push(a.x * 0.92, -d1, a.z * 0.92, rock);
      // underside
      push(a.x * 0.92, -d1, a.z * 0.92, rock); push(b.x * 0.92, -d2, b.z * 0.92, rock2); push(0, -16, 0, rock2);
    }
    const rimGeo = new THREE.BufferGeometry();
    rimGeo.setAttribute('position', new THREE.Float32BufferAttribute(rimPos, 3));
    rimGeo.setAttribute('color', new THREE.Float32BufferAttribute(rimCol, 3));
    rimGeo.computeVertexNormals();
    const rim = new THREE.Mesh(rimGeo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, side: THREE.DoubleSide }));
    W.add(rim);
    // floating rocks & clouds around
    const rng = new Rng(11);
    for (let i = 0; i < 16; i++) {
      const a = rng.range(0, Math.PI * 2), rr = rng.range(1.12, 1.6);
      const m = mesh(G.ico(), stdMat(0x5a4c70, 0, 0, 1), { x: Math.cos(a) * 80 * rr, y: rng.range(-18, -4), z: Math.sin(a) * 62 * rr, sx: rng.range(4, 12), sy: rng.range(3, 8), sz: rng.range(4, 12), ry: rng.range(0, 3) });
      const top2 = mesh(G.cyl(), stdMat(0x3a8a5a), { x: m.position.x, y: m.position.y + m.scale.y * 0.38, z: m.position.z, sx: m.scale.x * 0.9, sy: 0.6, sz: m.scale.z * 0.9 });
      m.castShadow = false; top2.castShadow = false;
      W.add(m, top2);
    }
    for (let i = 0; i < 18; i++) {
      const c = mesh(G.sphere(), new THREE.MeshBasicMaterial({ color: 0xbfd8ff, transparent: true, opacity: 0.16, depthWrite: false }), {
        x: rng.range(-130, 130), y: rng.range(-22, -9), z: rng.range(-100, 100), sx: rng.range(14, 34), sy: 2.2, sz: rng.range(10, 20),
      });
      c.castShadow = false;
      this.clouds.push(c); W.add(c);
    }
    // obstacles: rocks, walls, pit
    const rockGeos: THREE.BufferGeometry[] = [];
    const wallGeos: THREE.BufferGeometry[] = [];
    const pitGeos: THREE.BufferGeometry[] = [];
    const place = (g: THREE.BufferGeometry, x: number, y: number, z: number, sx: number, sy: number, sz: number, ry: number, color: THREE.Color, out: THREE.BufferGeometry[]) => {
      const gg = g.index ? g.toNonIndexed() : g.clone();
      gg.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), new THREE.Vector3(sx, sy, sz)));
      gg.deleteAttribute('uv');
      const n = gg.attributes.position.count, arr = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const j = (Math.sin(i * 12.9898) * 43758.5453) % 1; const k = 0.88 + Math.abs(j) * 0.2; arr[i * 3] = color.r * k; arr[i * 3 + 1] = color.g * k; arr[i * 3 + 2] = color.b * k; }
      gg.setAttribute('color', new THREE.BufferAttribute(arr, 3));
      out.push(gg);
    };
    for (const o of OBSTACLES) {
      if (o.kind === 'struct') continue;
      if (o.kind === 'rock') {
        const h = o.r * rng.range(1.4, 2.2);
        place(G.ico(), o.ax, h * 0.35, o.az, o.r * 2.1, h, o.r * 2.1, rng.range(0, 3), new THREE.Color(0x8a86a0), rockGeos);
        place(G.ico(), o.ax + o.r * 0.6, h * 0.2, o.az - o.r * 0.4, o.r * 1.2, h * 0.6, o.r * 1.2, rng.range(0, 3), new THREE.Color(0x76728e), rockGeos);
        place(G.octa(), o.ax - o.r * 0.2, h * 0.95, o.az + o.r * 0.1, o.r * 0.5, h * 0.8, o.r * 0.5, 0, new THREE.Color(0x7fe8ff), rockGeos);
      } else {
        const len = Math.hypot(o.bx - o.ax, o.bz - o.az);
        if (len < 0.1) {
          place(G.cyl(), o.ax, 1.6, o.az, o.r * 1.9, 3.2, o.r * 1.9, 0, new THREE.Color(0xdcd2ba), wallGeos);
          place(G.cyl(), o.ax, 3.3, o.az, o.r * 2.2, 0.25, o.r * 2.2, 0, new THREE.Color(0x8a7040), wallGeos);
          place(G.octa(), o.ax, 4.1, o.az, 0.6, 1.0, 0.6, 0, new THREE.Color(0x7fe8ff), wallGeos);
          continue;
        }
        const n = Math.max(1, Math.round(len / 1.8));
        const ang = Math.atan2(o.bz - o.az, o.bx - o.ax);
        for (let i = 0; i <= n; i++) {
          const t = n === 0 ? 0 : i / n;
          const x = lerp(o.ax, o.bx, t), z = lerp(o.az, o.bz, t);
          const h = (o.kind === 'pit' ? 1.6 : 2.6) * rng.range(0.85, 1.2);
          place(G.box(), x, h / 2, z, 2.1, h, o.r * 2.2, -ang, new THREE.Color(o.kind === 'pit' ? 0x8c84a0 : 0xd6ccb4), o.kind === 'pit' ? pitGeos : wallGeos);
          place(G.box(), x, h + 0.06, z, 2.2, 0.12, o.r * 2.3, -ang, new THREE.Color(0x8a7448), o.kind === 'pit' ? pitGeos : wallGeos);
        }
      }
    }
    const matV = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.85 });
    for (const arr of [rockGeos, wallGeos, pitGeos]) {
      if (!arr.length) continue;
      const m = new THREE.Mesh(mergeGeometries(arr, false)!, matV);
      m.castShadow = true; m.receiveShadow = true;
      W.add(m);
    }
    // foliage: trees + grass tufts (instanced)
    const treeSpots: { x: number; z: number; s: number }[] = [];
    const grassSpots: { x: number; z: number; s: number }[] = [];
    for (const b of BRUSH) {
      const n = Math.round(b.r * b.r * 0.95);
      for (let i = 0; i < n; i++) {
        const a = rng.range(0, Math.PI * 2), d = Math.sqrt(rng.next()) * b.r * 0.95;
        grassSpots.push({ x: b.x + Math.cos(a) * d, z: b.z + Math.sin(a) * d, s: rng.range(0.8, 1.3) });
      }
    }
    for (let i = 0; i < 360; i++) {
      const x = rng.range(-72, 72), z = rng.range(-56, 56);
      if (!this.treeOk(x, z)) continue;
      treeSpots.push({ x, z, s: rng.range(0.8, 1.5) });
    }
    const grassMesh = new THREE.InstancedMesh(G.cone(), new THREE.MeshStandardMaterial({ color: 0x3fae6a, flatShading: true, roughness: 0.9 }), grassSpots.length);
    grassSpots.forEach((g, i) => { tmpM.compose(tmpV.set(g.x, 0.7 * g.s, g.z), tmpQ.setFromAxisAngle(UP, i), tmpS.set(0.55 * g.s, 1.5 * g.s, 0.55 * g.s)); grassMesh.setMatrixAt(i, tmpM); });
    grassMesh.castShadow = false; W.add(grassMesh);
    const trunk = new THREE.InstancedMesh(G.cyl(), new THREE.MeshStandardMaterial({ color: 0x6a4a32, flatShading: true }), treeSpots.length);
    const crown = new THREE.InstancedMesh(G.cone(), new THREE.MeshStandardMaterial({ color: 0x2f9a7a, flatShading: true, roughness: 0.8 }), treeSpots.length * 2);
    treeSpots.forEach((t, i) => {
      tmpM.compose(tmpV.set(t.x, 0.9 * t.s, t.z), tmpQ.identity(), tmpS.set(0.35 * t.s, 1.8 * t.s, 0.35 * t.s)); trunk.setMatrixAt(i, tmpM);
      tmpM.compose(tmpV.set(t.x, 2.3 * t.s, t.z), tmpQ.setFromAxisAngle(UP, i), tmpS.set(1.9 * t.s, 2.6 * t.s, 1.9 * t.s)); crown.setMatrixAt(i * 2, tmpM);
      tmpM.compose(tmpV.set(t.x, 3.5 * t.s, t.z), tmpQ.setFromAxisAngle(UP, i + 1), tmpS.set(1.3 * t.s, 2.0 * t.s, 1.3 * t.s)); crown.setMatrixAt(i * 2 + 1, tmpM);
    });
    trunk.castShadow = true; crown.castShadow = true;
    W.add(trunk, crown);
    // fountains
    for (const t of [0, 1] as const) {
      const f = buildFountain(t, this.settings.colorblind);
      const p = TEAM_BASE[t].fountain;
      f.position.set(p.x, 0, p.z);
      W.add(f); this.fountains.push(f);
    }
    // camp markers (small crystal totems for jungle camps) already painted on ground
    void CAMPS; void STRUCTURES;
  }

  private treeOk(x: number, z: number): boolean {
    // keep trees away from lanes, bases, pit, camps, structures
    if (Math.abs(x) > 71 || Math.abs(z) > 54) return false;
    if (Math.hypot(x, z) < 11) return false;
    for (const l of this.laneCache()) if (Math.hypot(l.x - x, l.z - z) < 6.5) return false;
    if (Math.abs(z) < 14 && Math.abs(x) > 40) return false;
    for (const c of CAMPS) if (Math.hypot(c.x - x, c.z - z) < 5) return false;
    for (const o of OBSTACLES) if (Math.hypot(o.ax - x, o.az - z) < o.r + 2) return false;
    return Math.abs(x) * 0.02 + Math.abs(z) * 0.02 < 2.2 && (x * x) / (72 * 72) + (z * z) / (54 * 54) < 0.9;
  }
  private laneSamples: { x: number; z: number }[] | null = null;
  private laneCache() {
    if (this.laneSamples) return this.laneSamples;
    const out: { x: number; z: number }[] = [];
    for (const lane of this.lanes()) for (let i = 0; i < lane.length - 1; i++) for (let t = 0; t < 1; t += 0.1) out.push({ x: lerp(lane[i].x, lane[i + 1].x, t), z: lerp(lane[i].z, lane[i + 1].z, t) });
    this.laneSamples = out;
    return out;
  }
  private lanes() { return LANES_REF; }

  // ------------------------------------------------------------ sim binding
  setSim(sim: Sim | null) {
    this.sim = sim;
    for (const v of this.views.values()) this.dyn.remove(v.group);
    this.views.clear();
    for (const o of this.projViews.values()) this.dyn.remove(o);
    this.projViews.clear();
    for (const o of this.zoneViews.values()) this.dyn.remove(o);
    this.zoneViews.clear();
    for (const o of this.wallViews.values()) this.dyn.remove(o);
    this.wallViews.clear();
    for (const p of this.minionPools.values()) { this.dyn.remove(p.body); if (p.glow) this.dyn.remove(p.glow); }
    this.minionPools.clear();
    this.decals.clear();
    if (sim) {
      const p = sim.player;
      this.cam.x = p.x; this.cam.z = p.z;
    }
  }

  private teamColor(team: number) { return (this.settings.colorblind ? TEAM_COLOR_CB : TEAM_COLOR)[team] ?? 0xffffff; }

  private visibleToPlayer(u: Unit): boolean {
    const sim = this.sim!;
    if (u.team === sim.player.team) return true;
    if (u.kind === 'tower' || u.kind === 'seal' || u.kind === 'core' || u.kind === 'engine') return true; // structures are remembered once seen: always drawn
    return u.visUntil[sim.player.team] > sim.time;
  }

  private createView(u: Unit): UView {
    const group = new THREE.Group();
    const v: UView = { id: u.id, kind: u.kind, group, atk: 0, prevAtk: 0, px: u.x, pz: u.z, speed: 0, dead: false, wasVisible: false, fadeIn: 0, height: 2 };
    const tc = this.teamColor(u.team);
    if (u.kind === 'hero' || u.kind === 'decoy') {
      const heroId = u.kind === 'hero' ? u.hero!.heroId : (this.sim!.byId.get(u.owner)?.hero?.heroId ?? 'vey');
      v.heroId = heroId;
      v.rig = buildHero(heroId);
      v.height = v.rig.height * 1.45;
      const wrap = new THREE.Group(); wrap.scale.setScalar(1.45); wrap.add(v.rig.group);
      group.add(wrap);
      if (u.kind === 'decoy') v.rig.group.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { const mat = (m.material as THREE.Material).clone(); mat.transparent = true; mat.opacity = 0.55; m.material = mat; } });
      const ring = new THREE.Mesh(new THREE.RingGeometry(u.radius * 1.25, u.radius * 1.55, 32), new THREE.MeshBasicMaterial({ color: tc, transparent: true, opacity: 0.9, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.09; ring.renderOrder = 6;
      group.add(ring); v.ring = ring;
      const accent = new THREE.Mesh(new THREE.CircleGeometry(u.radius * 1.25, 28), new THREE.MeshBasicMaterial({ color: tc, transparent: true, opacity: 0.16, depthWrite: false }));
      accent.rotation.x = -Math.PI / 2; accent.position.y = 0.085; accent.renderOrder = 6;
      group.add(accent);
    } else if (u.kind === 'monster') {
      const fam = u.camp!.family;
      v.family = fam;
      const big = u.radius > 0.85;
      v.rig = buildMonster(fam, big);
      v.height = v.rig.height;
      v.rig.group.scale.setScalar(fam === 'colossus' || fam === 'catalyst' ? 1 : u.radius / (big ? 1.0 : 0.5) * (big ? 0.85 : 1));
      group.add(v.rig.group);
      const ring = new THREE.Mesh(new THREE.RingGeometry(u.radius * 1.1, u.radius * 1.25, 28), new THREE.MeshBasicMaterial({ color: 0xffd060, transparent: true, opacity: 0.5, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.09;
      group.add(ring);
    } else if (u.stype) {
      v.srig = buildStructure(u.stype, u.team, this.settings.colorblind);
      v.height = v.srig.height;
      group.add(v.srig.group);
      const rr = u.radius * 1.5;
      const ring = new THREE.Mesh(new THREE.RingGeometry(rr, rr + 0.3, 40), new THREE.MeshBasicMaterial({ color: tc, transparent: true, opacity: 0.85, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.09; ring.renderOrder = 6;
      group.add(ring); v.ring = ring;
      group.rotation.y = u.team === 0 ? 0.3 : -0.3 + Math.PI;
    } else if (u.kind === 'ward') {
      group.add(buildWard(tc));
      v.height = 1;
    }
    group.position.set(u.x, 0, u.z);
    this.dyn.add(group);
    return v;
  }

  private minionPool(type: string, team: number): MinionPool {
    const key = `${type}${team}`;
    let p = this.minionPools.get(key);
    if (p) return p;
    const kit = minionKit(type, team);
    const body = new THREE.InstancedMesh(kit.body, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.75 }), MAX_MINIONS);
    body.castShadow = this.renderer.shadowMap.enabled; body.count = 0; body.frustumCulled = false;
    let glow: THREE.InstancedMesh | null = null;
    if (kit.glow) { glow = new THREE.InstancedMesh(kit.glow, new THREE.MeshBasicMaterial({ vertexColors: true }), MAX_MINIONS); glow.count = 0; glow.frustumCulled = false; this.dyn.add(glow); }
    this.dyn.add(body);
    p = { body, glow, n: 0, height: kit.height };
    this.minionPools.set(key, p);
    return p;
  }

  // ------------------------------------------------------------ per-frame
  render(now: number, alpha: number) {
    const sim = this.sim;
    const dt = Math.min(0.1, Math.max(0.001, now - this.lastTime || 0.016));
    this.lastTime = now;
    this.clock += dt;
    this.updateCamera(dt);
    this.decals.update(this.clock);
    if (sim) this.syncUnits(sim, alpha, dt);
    if (sim) { this.syncProjectiles(sim, alpha); this.syncZones(sim); this.syncWalls(sim); this.syncTowerLines(sim, alpha); this.updateFog(sim, dt); }
    this.particles.update(dt);
    for (const c of this.clouds) { c.position.x += dt * 0.6; if (c.position.x > 140) c.position.x = -140; }
    // sun follows camera for shadows
    this.sun.position.set(this.cam.x - 26, 52, this.cam.z + 22);
    this.sun.target.position.set(this.cam.x, 0, this.cam.z);
    this.sun.target.updateMatrixWorld();
    this.renderer.render(this.scene, this.camera);
  }

  private updateCamera(dt: number) {
    const sim = this.sim;
    if (sim && this.cam.lock) { this.cam.x = lerp(this.cam.x, sim.player.x, Math.min(1, dt * 10)); this.cam.z = lerp(this.cam.z, sim.player.z, Math.min(1, dt * 10)); }
    this.cam.x = clamp(this.cam.x, -66, 66); this.cam.z = clamp(this.cam.z, -52, 52);
    const h = this.cam.height, pitch = (52 * Math.PI) / 180;
    const d = h / Math.tan(pitch);
    const k = d / Math.SQRT2;
    let sx = 0, sz = 0;
    if (this.cam.shake > 0.001) { sx = (Math.random() - 0.5) * this.cam.shake; sz = (Math.random() - 0.5) * this.cam.shake; this.cam.shake *= 0.86; }
    this.camera.position.set(this.cam.x - k + sx, h, this.cam.z + k + sz);
    this.camera.lookAt(this.cam.x + sx, 0, this.cam.z + sz);
  }
  addShake(a: number) { this.cam.shake = Math.min(0.6, this.cam.shake + a * this.settings.shake); }

  private syncUnits(sim: Sim, alpha: number, dt: number) {
    const seen = new Set<number>();
    const counts = new Map<string, number>();
    const playerTeam = sim.player.team;
    const now = sim.time;
    for (const u of sim.units) {
      if (u.kind === 'minion') {
        if (u.dead || !this.visibleToPlayer(u)) continue;
        const pool = this.minionPool(u.mtype!, u.team);
        const i = pool.n++;
        if (i >= MAX_MINIONS) { pool.n = MAX_MINIONS; continue; }
        const x = lerp(u.px, u.x, alpha), z = lerp(u.pz, u.z, alpha);
        const f = lerpAngle(u.pfacing, u.facing, alpha);
        const moving = Math.hypot(u.x - u.px, u.z - u.pz) > 0.01;
        const bob = moving ? Math.abs(Math.sin(this.clock * 9 + u.id)) * 0.07 : 0;
        let lunge = 0;
        if (u.atkRelease > 0) lunge = u.projSpeed > 0 ? 0 : Math.sin(clamp(1 - (u.atkRelease - now) / u.windup, 0, 1) * Math.PI) * 0.25;
        const sc = u.scale > 1 ? 1.12 : 1;
        tmpM.compose(tmpV.set(x + Math.cos(f) * lunge, bob, z + Math.sin(f) * lunge), tmpQ.setFromAxisAngle(UP, -f + Math.PI / 2), tmpS.set(sc, sc, sc));
        pool.body.setMatrixAt(i, tmpM);
        pool.glow?.setMatrixAt(i, tmpM);
        continue;
      }
      if (u.dead && u.kind !== 'hero') continue;
      seen.add(u.id);
      let v = this.views.get(u.id);
      if (!v) { v = this.createView(u); this.views.set(u.id, v); }
      const vis = this.visibleToPlayer(u) && !(u.kind === 'hero' && u.dead);
      v.group.visible = vis;
      if (!vis) { v.wasVisible = false; continue; }
      const x = lerp(u.px, u.x, alpha), z = lerp(u.pz, u.z, alpha);
      v.group.position.x = x; v.group.position.z = z;
      const moved = Math.hypot(x - v.px, z - v.pz);
      v.px = x; v.pz = z;
      v.speed = lerp(v.speed, clamp(moved / dt / 3.6, 0, 1.4), 0.25);
      if (v.rig) {
        const f = lerpAngle(u.pfacing, u.facing, alpha);
        v.rig.group.rotation.y = -f + Math.PI / 2;
        // attack pulse
        if (u.atkRelease > 0) v.atk = Math.max(v.atk, clamp(1 - (u.atkRelease - now) / Math.max(0.05, u.windup), 0, 1) * 0.6);
        else if (v.prevAtk > 0) v.atk = 1;
        v.prevAtk = u.atkRelease;
        if (u.cast && u.hero) v.atk = Math.max(v.atk, 0.8);
        v.atk = Math.max(0, v.atk - dt * 3.5);
        if (v.heroId && v.kind !== 'monster') animateRig(v.rig, this.clock + u.id, v.speed, v.atk, v.heroId, false);
        else if (v.family) animateMonster(v.rig, this.clock + u.id, v.speed, v.atk, v.family);
        const sc = u.kind === 'hero' ? 1 : 1;
        v.rig.group.scale.y = sc;
        if (u.kind === 'hero' && u.dash && u.dash.kind === 'leap') v.group.position.y = Math.sin(clamp((now - u.dash.t0) / u.dash.dur, 0, 1) * Math.PI) * 4;
        else if (u.kind === 'hero' && this.sim!.has(u, 'airborne')) v.group.position.y = 1.5 + Math.sin(this.clock * 6) * 0.2;
        else v.group.position.y = 0;
        if (u.kind === 'hero' && v.ring) {
          const mine = u === sim.player;
          (v.ring.material as THREE.MeshBasicMaterial).color.setHex(mine ? 0xffe08a : this.teamColor(u.team));
          v.ring.scale.setScalar(mine ? 1.12 : 1);
          const hushed = u.hushed || sim.has(u, 'stun') || sim.has(u, 'root');
          (v.ring.material as THREE.MeshBasicMaterial).opacity = hushed ? 0.55 + 0.4 * Math.sin(this.clock * 12) : 0.92;
        }
        if (u.kind === 'hero' && u.team !== playerTeam && u.brush > 0) v.rig.group.visible = true;
      }
      if (v.srig) {
        for (const s of v.srig.spin) s.rotation.y = this.clock * (v.kind === 'engine' ? 0.8 : 0.6);
        if (v.srig.crystal) { v.srig.crystal.position.y += Math.sin(this.clock * 2 + u.id) * 0.002; v.srig.crystal.rotation.y = this.clock; }
        if (v.srig.shield) v.srig.shield.visible = u.invuln && !u.dead;
        const hitFlash = now - u.lastDamagedAt < 0.12;
        v.group.scale.setScalar(hitFlash ? 1.012 : 1);
        if (u.stype === 'engine' || u.stype === 'seal') v.srig.spin.forEach((s, i) => { if (i === 0 && u.stype === 'engine') s.rotation.z = this.clock * 0.5; });
      }
      if (u.kind === 'ward') {
        const eye = v.group.children[0]?.userData.eye as THREE.Object3D | undefined;
        if (eye) { eye.rotation.y = this.clock * 2; eye.position.y = 0.65 + Math.sin(this.clock * 3) * 0.08; }
        v.group.visible = vis && u.disabledUntil <= sim.time ? true : vis;
      }
      if (this.hoverId === u.id && v.ring) v.ring.scale.setScalar(1.25);
    }
    // dead structures fade: remove views for dead / missing units
    for (const [id, v] of this.views) {
      if (!seen.has(id)) {
        const u = sim.byId.get(id);
        if (!u || (u.dead && u.kind !== 'hero')) { this.dyn.remove(v.group); this.views.delete(id); }
      }
    }
    for (const [key, p] of this.minionPools) {
      p.body.count = p.n; p.body.instanceMatrix.needsUpdate = true;
      if (p.glow) { p.glow.count = p.n; p.glow.instanceMatrix.needsUpdate = true; }
      counts.set(key, p.n); p.n = 0;
    }
    // hero death fade handled by visibility; fountain pulse
    for (const f of this.fountains) f.children[4]?.scale.set(1.2, 2.2 + Math.sin(this.clock * 4) * 0.25, 1.2);
  }

  private syncProjectiles(sim: Sim, alpha: number) {
    const live = new Set<number>();
    const pt = sim.player.team;
    for (const p of sim.projectiles) {
      const owner = sim.byId.get(p.owner);
      if (p.team !== pt && owner && !this.visibleToPlayer(owner) && !sim.pointVisible(pt, p.x, p.z)) continue;
      live.add(p.id);
      let o = this.projViews.get(p.id);
      if (!o) { o = this.makeProjectile(p); this.projViews.set(p.id, o); this.dyn.add(o); }
      const x = p.x - p.dx * (1 - alpha) * p.speed / 30 * (p.homing ? 0 : 1), z = p.z - p.dz * (1 - alpha) * p.speed / 30 * (p.homing ? 0 : 1);
      o.position.set(x, p.kind === 'tower' ? 4 : 1.0, z);
      if (p.fx === 'wave') { o.rotation.y = -Math.atan2(p.dz, p.dx); }
      else o.rotation.y = -Math.atan2(p.dz, p.dx);
      if (Math.random() < (this.particles.low ? 0.25 : 0.8)) this.particles.emit(x, o.position.y, z, (Math.random() - 0.5) * 0.6, Math.random() * 0.6, (Math.random() - 0.5) * 0.6, p.color, p.fx === 'wave' ? 0.7 : 0.4, 0.4, 0);
    }
    for (const [id, o] of this.projViews) if (!live.has(id)) { this.dyn.remove(o); this.projViews.delete(id); }
  }

  private makeProjectile(p: Projectile): THREE.Object3D {
    const g = new THREE.Group();
    const c = p.color;
    if (p.fx === 'wave') {
      const m = mesh(G.sphere(), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.4, depthWrite: false }), { sx: p.radius * 2.2, sy: 1.8, sz: 1.2 });
      m.castShadow = false; g.add(m);
      const ring = mesh(G.torus(), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }), { sx: p.radius * 2.4, sy: p.radius * 2.4, sz: p.radius * 2.4, rx: Math.PI / 2 });
      ring.castShadow = false; g.add(ring);
    } else if (p.fx === 'line' || p.fx === 'bolt') {
      const m = mesh(G.sphere(), glowMat(c), { sx: 1.4, sy: 0.35, sz: 0.35 });
      m.castShadow = false; g.add(m);
      const core = mesh(G.sphere(), glowMat(0xffffff), { sx: 0.8, sy: 0.18, sz: 0.18 }); core.castShadow = false; g.add(core);
    } else if (p.fx === 'swarm') {
      for (let i = 0; i < 5; i++) { const m = mesh(G.sphere(), glowMat(i % 2 ? 0xffffff : c), { x: (i - 2) * 0.18, y: Math.sin(i * 2) * 0.25, z: Math.cos(i * 2) * 0.25, sx: 0.28 }); m.castShadow = false; g.add(m); }
    } else {
      const m = mesh(G.sphere(), glowMat(c), { sx: p.kind === 'tower' ? 0.6 : 0.3 + (p.size ?? 0.2) * 0.4 }); m.castShadow = false; g.add(m);
      if (p.kind === 'tower') { const core = mesh(G.sphere(), glowMat(0xffffff), { sx: 0.3 }); core.castShadow = false; g.add(core); }
    }
    return g;
  }

  private syncZones(sim: Sim) {
    const live = new Set<number>();
    const pt = sim.player.team;
    for (const z of sim.zones) {
      if (z.tag === 'sigil' && z.team !== pt) { /* enemy sigils are still visible gameplay boundaries */ }
      const owner = sim.byId.get(z.owner);
      if (z.team !== pt && owner && !this.visibleToPlayer(owner) && !sim.pointVisible(pt, z.x, z.z)) continue;
      live.add(z.id);
      let m = this.zoneViews.get(z.id);
      if (!m) {
        m = makeZoneMesh(this.zoneTex, z.color);
        this.zoneViews.set(z.id, m); this.dyn.add(m);
        m.userData.spawned = this.clock;
      }
      const danger = z.team !== pt && !z.friendly;
      (m.material as THREE.MeshBasicMaterial).color.setHex(danger && z.tag !== 'fen' ? 0xff6a50 : z.color);
      m.position.set(z.x, 0.1, z.z);
      const grow = Math.min(1, (this.clock - (m.userData.spawned as number)) * 6);
      const s = z.shape === 'circle' ? z.r * 2 * (0.6 + 0.4 * grow) : 1;
      if (z.shape === 'circle') m.scale.set(s, s, 1); else { m.scale.set(z.l, z.w, 1); m.rotation.z = -z.ang; }
      const left = z.until - sim.time;
      (m.material as THREE.MeshBasicMaterial).opacity = clamp(left * 2, 0, 0.8) * grow;
      m.rotation.z = z.tag === 'sigil' ? this.clock * 1.5 : 0;
      if ((z.tag === 'fen' || z.tag === 'hush') && Math.random() < 0.3) {
        const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * z.r;
        this.particles.emit(z.x + Math.cos(a) * r, 0.3, z.z + Math.sin(a) * r, 0, 0.8, 0, z.color, 0.5, 1.1, 0);
      }
    }
    for (const [id, m] of this.zoneViews) if (!live.has(id)) { this.dyn.remove(m); (m.material as THREE.Material).dispose(); this.zoneViews.delete(id); }
  }

  private syncWalls(sim: Sim) {
    const live = new Set<number>();
    for (const w of sim.walls) {
      live.add(w.id);
      let m = this.wallViews.get(w.id);
      if (!m) {
        m = mesh(G.box(), stdMat(0xe2d8c0, 0, 0, 0.8), { sx: 1.5, sy: 2.2, sz: 1.2 });
        m.receiveShadow = true;
        this.wallViews.set(w.id, m); this.dyn.add(m);
        m.userData.t0 = this.clock;
      }
      const rise = Math.min(1, (this.clock - (m.userData.t0 as number)) * 5);
      m.position.set(w.x, -1.1 + 2.2 * rise * 0.5 + 0.0, w.z);
      m.scale.y = 2.2 * rise + 0.01;
      m.position.y = m.scale.y / 2;
      m.rotation.y = Math.atan2(w.z - sim.player.z, w.x - sim.player.x);
      const dying = w.until - sim.time < 0.5;
      m.scale.x = dying ? 1.5 * (w.until - sim.time) * 2 + 0.01 : 1.5;
    }
    for (const [id, m] of this.wallViews) if (!live.has(id)) { this.dyn.remove(m); this.wallViews.delete(id); this.particles.burst(m.position.x, 1, m.position.z, 0xd8cdb0, 14, 3, 0.7, 0.4, 8); }
  }

  private syncTowerLines(sim: Sim, _alpha: number) {
    let n = 0;
    for (const u of sim.units) {
      if ((u.kind !== 'tower' && u.kind !== 'core') || u.dead || !u.ttarget) continue;
      const t = sim.byId.get(u.ttarget);
      if (!t || t.dead) continue;
      if (u.team !== sim.player.team && !this.visibleToPlayer(t)) continue;
      let line = this.towerLines[n];
      if (!line) {
        line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xff4040, transparent: true, opacity: 0.7, depthWrite: false }));
        line.renderOrder = 15; this.towerLines.push(line); this.dyn.add(line);
      }
      const pos = line.geometry.attributes.position as THREE.BufferAttribute;
      pos.setXYZ(0, u.x, 4.8, u.z); pos.setXYZ(1, t.x, 1.0, t.z); pos.needsUpdate = true;
      const aimsHero = t.kind === 'hero';
      (line.material as THREE.LineBasicMaterial).color.setHex(aimsHero ? 0xff3030 : 0xffc060);
      (line.material as THREE.LineBasicMaterial).opacity = aimsHero ? 0.5 + u.tramp * 0.1 : 0.22;
      line.visible = true; n++;
    }
    for (let i = n; i < this.towerLines.length; i++) this.towerLines[i].visible = false;
  }

  private updateFog(sim: Sim, dt: number) {
    this.fogTimer -= dt;
    if (this.fogTimer > 0) return;
    this.fogTimer = 0.1;
    const c = this.fogCtx, W = this.fogCanvas.width, H = this.fogCanvas.height;
    c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, W, H);
    c.fillStyle = 'rgba(8,16,34,0.42)';
    c.beginPath();
    for (const p of this.fogOutline) { const fx = (p.x + MAP_W / 2 + 1) * (W / (MAP_W + 2)), fz = (p.z + MAP_H / 2 + 1) * (H / (MAP_H + 2)); if (p === this.fogOutline[0]) c.moveTo(fx, fz); else c.lineTo(fx, fz); }
    c.closePath();
    c.fill();
    c.globalCompositeOperation = 'destination-out';
    const sx = W / (MAP_W + 2), sz = H / (MAP_H + 2);
    for (const o of sim.observers(sim.player.team as 0 | 1)) {
      const px = (o.x + MAP_W / 2 + 1) * sx, pz = (o.z + MAP_H / 2 + 1) * sz;
      const r = o.r * sx;
      const g = c.createRadialGradient(px, pz, r * 0.62, px, pz, r);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.beginPath(); c.ellipse(px, pz, r, o.r * sz, 0, 0, Math.PI * 2); c.fill();
    }
    c.globalCompositeOperation = 'source-over';
    this.fogTex.needsUpdate = true;
  }

  // ------------------------------------------------------------ events -> vfx
  handleEvents(events: SimEvent[]) {
    const sim = this.sim;
    if (!sim) return;
    const pt = sim.player.team;
    const lowFx = this.settings.effects === 'low';
    for (const e of events) {
      switch (e.t) {
        case 'fx': {
          if (e.team !== undefined && e.team !== pt) break;
          const c = e.color;
          if (e.kind === 'ring') { this.decals.spawn('ring', e.x, e.z, e.r, c, e.dur ?? 0.5); if (!lowFx) this.particles.burst(e.x, 0.3, e.z, c, 8, 3, 0.5, 0.3, 0); }
          else if (e.kind === 'shield') { this.decals.spawn('ring', e.x, e.z, e.r, c, e.dur ?? 0.6); this.particles.burst(e.x, 1.2, e.z, c, 10, 2, 0.6, 0.3, -1); }
          else if (e.kind === 'shock') { this.decals.spawn('ring', e.x, e.z, e.r, c, 0.55); this.decals.spawn('disc', e.x, e.z, e.r * 0.8, c, 0.4); this.particles.burst(e.x, 0.4, e.z, c, lowFx ? 8 : 30, 7, 0.6, 0.5, 5); this.addShake(0.25); }
          else if (e.kind === 'burst') { this.particles.burst(e.x, 1, e.z, c, 22, 4.5, 0.6, 0.4, 3); this.decals.spawn('disc', e.x, e.z, e.r, c, 0.35); }
          else if (e.kind === 'cone') this.decals.spawn('cone', e.x, e.z, e.r, c, e.dur ?? 0.4, e.dx ?? 1, e.dz ?? 0);
          else if (e.kind === 'rect') { const f = this.decals.spawn('rect', e.x, e.z, e.r, c, e.dur ?? 0.5, e.dx ?? 1, e.dz ?? 0); f.mesh.scale.y = 3.2; }
          else if (e.kind === 'beam') {
            this.decals.spawn('beam', e.x, e.z, e.r, c, e.dur ?? 0.3, e.dx ?? 1, e.dz ?? 0);
            const n = Math.min(40, Math.floor(e.r * 1.2));
            const d = Math.hypot(e.dx ?? 1, e.dz ?? 0) || 1;
            for (let i = 0; i < n; i++) { const t = (i / n) * e.r; this.particles.emit(e.x + (e.dx ?? 1) / d * t, 1, e.z + (e.dz ?? 0) / d * t, 0, 0.5, 0, c, 0.5, 0.4, 0); }
          } else if (e.kind === 'warn') this.decals.spawn('warn', e.x, e.z, e.r, c, e.dur ?? 1, 1, 0);
          else if (e.kind === 'heal') { for (let i = 0; i < 14; i++) this.particles.emit(e.x + (Math.random() - 0.5) * 1.2, 0.2, e.z + (Math.random() - 0.5) * 1.2, 0, 1.6 + Math.random(), 0, c, 0.28, 0.9, 0); }
          else if (e.kind === 'mark') this.decals.spawn('ring', e.x, e.z, e.r, c, e.dur ?? 1, 1, 0, { pulse: true });
          else if (e.kind === 'anchor') { this.decals.spawn('ring', e.x, e.z, e.r, c, 1.0); this.particles.burst(e.x, 0.5, e.z, c, 12, 3, 0.6, 0.3, 2); }
          else if (e.kind === 'burrow') this.particles.burst(e.x, 0.3, e.z, 0x6a4a2a, 20, 3, 0.7, 0.45, 8);
          else if (e.kind === 'collapse') { this.particles.burst(e.x, 1, e.z, 0xd8cdb0, 70, 9, 1.4, 0.8, 7); this.particles.burst(e.x, 3, e.z, c, 40, 8, 1.2, 0.6, 3); this.decals.spawn('ring', e.x, e.z, e.r * 1.6, c, 1.2); this.addShake(0.5); }
          break;
        }
        case 'hit': {
          const c = e.color;
          this.particles.burst(e.x, 0.9, e.z, c, e.big ? 18 : 8, e.big ? 5 : 3, 0.4, e.big ? 0.4 : 0.28, 6);
          if (e.big) this.decals.spawn('ring', e.x, e.z, 1.2, c, 0.3);
          break;
        }
        case 'castStart': {
          const u = sim.byId.get(e.unit);
          if (!u || !u.hero) break;
          const def = HERO_BY_ID[u.hero.heroId].abilities[e.ab];
          if (e.time < 0.25 && !def.ult) break;
          if (u.team === pt || this.visibleToPlayer(u)) {
            const danger = u.team !== pt;
            const col = danger ? 0xff5040 : 0x70d8ff;
            if (def.shape === 'circle' && def.ult || (def.key === 'R' && def.shape === 'circle')) this.decals.spawn('warn', e.x, e.z, def.size, col, e.time + 0.1, 1, 0);
            else if (def.key === 'R') this.decals.spawn('ring', u.x, u.z, 2.2, col, e.time, 1, 0);
            else if (def.shape === 'cone' && danger) this.decals.spawn('cone', u.x, u.z, def.range, col, e.time + 0.1, e.x - u.x, e.z - u.z);
          }
          break;
        }
        case 'death': {
          const u = sim.byId.get(e.unit);
          if (!u || !this.visibleToPlayer(u)) break;
          const c = u.kind === 'hero' ? HERO_BY_ID[u.hero!.heroId].accent : u.kind === 'minion' ? this.teamColor(u.team) : 0xd0c090;
          this.particles.burst(u.x, 1, u.z, c, u.kind === 'hero' ? 40 : 12, u.kind === 'hero' ? 6 : 3.5, 0.9, 0.45, 2);
          if (u.kind === 'hero') { this.decals.spawn('ring', u.x, u.z, 3, c, 0.7); this.addShake(0.2); }
          break;
        }
        case 'spawn': {
          const u = sim.byId.get(e.unit);
          if (u && this.visibleToPlayer(u)) { this.decals.spawn('ring', u.x, u.z, 2, 0xffffff, 0.6); this.particles.burst(u.x, 0.4, u.z, 0xffffff, 16, 3, 0.7, 0.3, -1); }
          break;
        }
        case 'levelup': {
          const u = sim.byId.get(e.unit);
          if (u) { this.decals.spawn('ring', u.x, u.z, 2.6, 0xffe27a, 0.8); for (let i = 0; i < 16; i++) this.particles.emit(u.x + (Math.random() - 0.5), 0.2, u.z + (Math.random() - 0.5), 0, 3 + Math.random() * 2, 0, 0xffe27a, 0.35, 1, 0); }
          break;
        }
        case 'ward': {
          this.decals.spawn('ring', e.x, e.z, 8.5, this.teamColor(e.team), 0.9);
          break;
        }
        case 'recall': {
          const u = sim.byId.get(e.unit);
          if (u && e.done) { this.decals.spawn('ring', u.x, u.z, 3, 0x9ff4ff, 0.9); this.particles.burst(u.x, 1, u.z, 0x9ff4ff, 30, 4, 0.9, 0.4, -2); }
          break;
        }
        case 'glint': {
          this.particles.burst(e.x, 1.6, e.z, 0xffffff, 6, 2, 0.4, 0.5, 0);
          break;
        }
        default: break;
      }
    }
  }

  // ------------------------------------------------------------ input helpers
  project(x: number, y: number, z: number): { x: number; y: number; visible: boolean } {
    tmpV.set(x, y, z).project(this.camera);
    return { x: (tmpV.x * 0.5 + 0.5) * this.width, y: (-tmpV.y * 0.5 + 0.5) * this.height, visible: tmpV.z < 1 && tmpV.x > -1.2 && tmpV.x < 1.2 && tmpV.y > -1.2 && tmpV.y < 1.2 };
  }
  private ray = new THREE.Raycaster();
  private plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  groundPoint(cx: number, cy: number): { x: number; z: number } {
    const rect = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
    this.ray.setFromCamera(ndc, this.camera);
    const hit = new THREE.Vector3();
    if (!this.ray.ray.intersectPlane(this.plane, hit)) return { x: this.cam.x, z: this.cam.z };
    return { x: clamp(hit.x, -74, 74), z: clamp(hit.z, -57, 57) };
  }
  /** nearest unit whose screen-space capsule contains the cursor */
  pickUnit(cx: number, cy: number, pred: (u: Unit) => boolean): Unit | null {
    const sim = this.sim;
    if (!sim) return null;
    const rect = this.canvas.getBoundingClientRect();
    const mx = cx - rect.left, my = cy - rect.top;
    let best: Unit | null = null, bd = 1e9;
    for (const u of sim.units) {
      if (u.dead || !this.visibleToPlayer(u) || !pred(u)) continue;
      const h = u.kind === 'hero' ? 2.9 : u.stype ? 4 : u.kind === 'monster' ? (u.radius > 2 ? 5 : u.radius > 0.8 ? 2.4 : 1.1) : 1.4;
      const a = this.project(u.x, 0.1, u.z), b = this.project(u.x, h, u.z);
      const rad = Math.max(14, this.project(u.x + u.radius, 0.1, u.z).x - a.x) * 1.0 + 9;
      const vx = b.x - a.x, vy = b.y - a.y, wx = mx - a.x, wy = my - a.y;
      const l2 = vx * vx + vy * vy || 1;
      const t = clamp((wx * vx + wy * vy) / l2, 0, 1);
      const d = Math.hypot(mx - (a.x + vx * t), my - (a.y + vy * t));
      const rr = u.stype ? rad * 1.5 : rad;
      if (d < rr && d < bd) { bd = d; best = u; }
    }
    return best;
  }
  setFog(on: boolean) { this.fogMesh.visible = on; }
  setHover(id: number) { this.hoverId = id; }

  /** aim indicator: shape in world space */
  showIndicator(opts: { kind: 'line' | 'circle' | 'cone' | 'rect' | 'unit' | 'self'; x: number; z: number; tx: number; tz: number; range: number; size: number; color: number; valid: boolean } | null) {
    if (!opts) { this.indicator.visible = false; return; }
    this.indicator.visible = true;
    const rm = this.indRange.material as THREE.MeshBasicMaterial, sm = this.indShape.material as THREE.MeshBasicMaterial;
    const tex = this.decals as unknown as { tex: Record<string, THREE.Texture> };
    rm.map = tex.tex.ring; rm.color.setHex(0xbfe8ff); rm.needsUpdate = true;
    this.indRange.position.set(opts.x, 0.1, opts.z); this.indRange.scale.set(opts.range * 2 + 1, opts.range * 2 + 1, 1);
    this.indRange.visible = opts.range > 0 && opts.kind !== 'self';
    const a = Math.atan2(opts.tz - opts.z, opts.tx - opts.x);
    sm.color.setHex(opts.valid ? opts.color : 0x888888);
    this.indShape.rotation.z = 0;
    switch (opts.kind) {
      case 'circle': sm.map = tex.tex.zoneEdge; this.indShape.position.set(opts.tx, 0.11, opts.tz); this.indShape.scale.set(opts.size * 2, opts.size * 2, 1); this.indShape.rotation.set(-Math.PI / 2, 0, 0); break;
      case 'unit': sm.map = tex.tex.ring; this.indShape.position.set(opts.tx, 0.11, opts.tz); this.indShape.scale.set(opts.size * 2.4, opts.size * 2.4, 1); this.indShape.rotation.set(-Math.PI / 2, 0, 0); break;
      case 'self': sm.map = tex.tex.zoneEdge; this.indShape.position.set(opts.x, 0.11, opts.z); this.indShape.scale.set(opts.size * 2, opts.size * 2, 1); this.indShape.rotation.set(-Math.PI / 2, 0, 0); break;
      case 'cone': sm.map = tex.tex.cone; this.indShape.position.set(opts.x + Math.cos(a) * opts.range * 0.54, 0.11, opts.z + Math.sin(a) * opts.range * 0.54); this.indShape.scale.set(opts.range * 1.08, opts.range * 1.08, 1); this.indShape.rotation.set(-Math.PI / 2, 0, -a); break;
      case 'line': {
        sm.map = tex.tex.rect;
        const len = opts.range;
        this.indShape.position.set(opts.x + Math.cos(a) * len / 2, 0.11, opts.z + Math.sin(a) * len / 2);
        this.indShape.scale.set(len, Math.max(0.7, opts.size * 1.6), 1); this.indShape.rotation.set(-Math.PI / 2, 0, -a);
        break;
      }
      case 'rect': {
        sm.map = tex.tex.rect;
        this.indShape.position.set(opts.tx, 0.11, opts.tz);
        this.indShape.scale.set(7, opts.size, 1); this.indShape.rotation.set(-Math.PI / 2, 0, -a);
        break;
      }
    }
    sm.needsUpdate = true;
  }

  dist = dist;
  dispose() { this.renderer.dispose(); }
}

import { LANES } from '../shared/map';
const LANES_REF = LANES;
