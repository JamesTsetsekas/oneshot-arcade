// Scene lifecycle and entity views. The renderer only *reads* simulation state (through the
// viewer's fog filter) and turns simulation events into feedback; it never decides gameplay.
import * as THREE from 'three';
import { STRUCTURES, UNITS } from '../faction-data';
import type { Sim } from '../simulation-core/sim';
import { Kind, type SimEvent } from '../simulation-core/types';
import { terrainHeight } from '../world/map';
import { decorGeometry, modelFor, type ModelGeo } from './models';
import { buildTerrain, updateFog, type TerrainView } from './terrain';
import { GpuParticles, Tracers, makeZoneMaterial } from './vfx';

export type Quality = 'low' | 'medium' | 'high';
export interface RenderSettings {
  quality: Quality; renderScale: number; shadows: boolean; effects: number; antialias: boolean;
  colorblind: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia'; reducedMotion: boolean;
}

export const TEAM_PALETTES: Record<RenderSettings['colorblind'], [string, string]> = {
  none: ['#3fa9ff', '#ff5247'],
  deuteranopia: ['#3b82ff', '#ffa31a'],
  protanopia: ['#2f8cff', '#f2d22e'],
  tritanopia: ['#ff4fa0', '#1ec8a8'],
};

interface InstGroup { body: THREE.InstancedMesh; glow: THREE.InstancedMesh | null; accent: THREE.InstancedMesh | null; cap: number; n: number; geo: ModelGeo }
interface AnimState { hitUntil: number; recoilUntil: number; windupUntil: number; buildPulse: number }
interface Corpse { key: string; size: number; x: number; y: number; h: number; yaw: number; owner: number; t0: number; life: number; faction: string; isStructure: boolean }

export interface PlacementPreview { def: string; tx: number; ty: number; cells: { c: number; ok: boolean }[]; ok: boolean; zones: { x: number; y: number; r: number }[] }

const UP = new THREE.Vector3(0, 1, 0);
/** units render slightly larger than their collision circle for readability at RTS zoom */
export const UNIT_VIS_SCALE = 1.25;

export class GameRenderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly sim: Sim;
  viewer: number; // -1 = omniscient (replay)
  settings: RenderSettings;
  terrain: TerrainView;
  particles: GpuParticles;
  tracers: Tracers;
  private sun: THREE.DirectionalLight;
  private groups = new Map<string, InstGroup>();
  private ghostGroups = new Map<string, THREE.InstancedMesh>();
  private ghostMat = new THREE.MeshBasicMaterial({ color: 0x8a93a3, transparent: true, opacity: 0.35, depthWrite: false });
  private anim = new Map<number, AnimState>();
  private corpses: Corpse[] = [];
  private selRings: THREE.InstancedMesh;
  private projMesh: THREE.InstancedMesh;
  private zonePool: THREE.Mesh[] = [];
  private placeCells: THREE.InstancedMesh;
  private placeGhost: THREE.Mesh;
  private placeRange: THREE.Mesh;
  private placeCone: THREE.Mesh;
  private fogSmooth: Float32Array;
  private m4 = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private e = new THREE.Euler();
  private v3 = new THREE.Vector3();
  private s3 = new THREE.Vector3();
  private col = new THREE.Color();
  private rngState = 12345;
  private teamColors: THREE.Color[] = [];
  shake = 0;
  time = 0;
  placement: PlacementPreview | null = null;
  fogEnabled = true;
  private dust: THREE.Points;
  contextLost = false;

  constructor(canvas: HTMLCanvasElement, sim: Sim, viewer: number, settings: RenderSettings) {
    this.sim = sim;
    this.viewer = viewer;
    this.settings = settings;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: settings.antialias, powerPreference: 'high-performance', stencil: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    this.camera = new THREE.PerspectiveCamera(45, 16 / 9, 1, 400);
    this.scene.background = new THREE.Color('#07090d');
    this.scene.fog = new THREE.Fog('#07090d', 90, 200);

    const hemi = new THREE.HemisphereLight('#b9c6d8', '#2a2018', 1.1);
    this.scene.add(hemi);
    this.sun = new THREE.DirectionalLight('#ffe2b8', 2.4);
    this.sun.position.set(-40, 80, 30);
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = -45; sc.right = 45; sc.top = 45; sc.bottom = -45; sc.near = 1; sc.far = 220;
    this.sun.shadow.bias = -0.0008;
    this.scene.add(this.sun, this.sun.target);
    const rim = new THREE.DirectionalLight('#6fd6ff', 0.35);
    rim.position.set(50, 30, -60);
    this.scene.add(rim);

    this.terrain = buildTerrain(sim.map);
    this.scene.add(this.terrain.mesh);
    this.fogSmooth = new Float32Array(sim.map.size * sim.map.size);
    this.buildStatic();

    this.particles = new GpuParticles(settings.quality === 'low' ? 6000 : 18000);
    this.scene.add(this.particles.points);
    this.tracers = new Tracers(512);
    this.scene.add(this.tracers.mesh);

    const ringGeo = new THREE.RingGeometry(0.86, 1.0, 32);
    ringGeo.rotateX(-Math.PI / 2);
    this.selRings = new THREE.InstancedMesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false }), 512);
    this.selRings.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(512 * 3), 3);
    this.selRings.frustumCulled = false; this.selRings.renderOrder = 5;
    this.scene.add(this.selRings);

    this.projMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.16, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), 512);
    this.projMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(512 * 3), 3);
    this.projMesh.frustumCulled = false;
    this.scene.add(this.projMesh);

    const cellGeo = new THREE.PlaneGeometry(0.92, 0.92); cellGeo.rotateX(-Math.PI / 2);
    this.placeCells = new THREE.InstancedMesh(cellGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, depthWrite: false }), 64);
    this.placeCells.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(64 * 3), 3);
    this.placeCells.frustumCulled = false; this.placeCells.count = 0;
    this.scene.add(this.placeCells);
    this.placeGhost = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x66ff99, transparent: true, opacity: 0.4, depthWrite: false }));
    this.placeGhost.visible = false;
    this.scene.add(this.placeGhost);
    const pr = new THREE.PlaneGeometry(2, 2); pr.rotateX(-Math.PI / 2);
    this.placeRange = new THREE.Mesh(pr, makeZoneMaterial(new THREE.Color('#ffd27a')));
    this.placeRange.visible = false; this.placeRange.renderOrder = 4;
    this.scene.add(this.placeRange);
    const coneGeo = new THREE.CircleGeometry(1, 24, -Math.PI * 80 / 180 + Math.PI / 2, Math.PI * 160 / 180); coneGeo.rotateX(-Math.PI / 2);
    this.placeCone = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide }));
    this.placeCone.visible = false;
    this.scene.add(this.placeCone);

    // subtle drifting dust (decorative, never obscures information)
    const dg = new THREE.BufferGeometry();
    const dp = new Float32Array(900 * 3);
    for (let i = 0; i < 900; i++) { dp[i * 3] = this.rnd() * 144; dp[i * 3 + 1] = 1 + this.rnd() * 10; dp[i * 3 + 2] = this.rnd() * 144; }
    dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    this.dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: '#c9b79a', size: 0.08, transparent: true, opacity: 0.35, depthWrite: false }));
    this.scene.add(this.dust);

    this.applySettings(settings);
  }

  rnd() { this.rngState = (this.rngState * 1664525 + 1013904223) >>> 0; return this.rngState / 4294967296; }

  applySettings(s: RenderSettings) {
    this.settings = s;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr * s.renderScale);
    const shadows = s.shadows && s.quality !== 'low';
    this.renderer.shadowMap.enabled = shadows;
    this.renderer.shadowMap.type = s.quality === 'high' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    this.sun.castShadow = shadows;
    this.sun.shadow.mapSize.set(s.quality === 'high' ? 2048 : 1024, s.quality === 'high' ? 2048 : 1024);
    this.particles.scale = s.effects * (s.quality === 'low' ? 0.4 : 1);
    this.dust.visible = s.quality !== 'low';
    this.teamColors = TEAM_PALETTES[s.colorblind].map((c) => new THREE.Color(c));
    for (const g of this.groups.values()) { g.body.castShadow = shadows; }
    this.renderer.shadowMap.needsUpdate = true;
  }

  teamColor(owner: number): THREE.Color {
    if (owner < 0) return this.col.set('#e8f1ff');
    return this.teamColors[owner] ?? this.col.set('#ffffff');
  }
  teamHex(owner: number): string { return owner < 0 ? '#e8f1ff' : '#' + (this.teamColors[owner] ?? new THREE.Color('#fff')).getHexString(); }

  resize(w: number, h: number) {
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
  }

  private buildStatic() {
    const map = this.sim.map;
    // decor props, instanced per kind
    for (const kind of ['crystal', 'rock', 'spire'] as const) {
      const items = map.decor.filter((d) => d.kind === kind);
      if (!items.length) continue;
      const g = decorGeometry(kind);
      const mk = (geo: THREE.BufferGeometry | null, mat: THREE.Material) => {
        if (!geo) return;
        const im = new THREE.InstancedMesh(geo, mat, items.length);
        items.forEach((d, i) => {
          this.q.setFromAxisAngle(UP, d.r);
          this.m4.compose(new THREE.Vector3(d.x, terrainHeight(map, d.x, d.y) - 0.1, d.y), this.q, new THREE.Vector3(d.s, d.s, d.s));
          im.setMatrixAt(i, this.m4);
        });
        im.castShadow = true; im.receiveShadow = true;
        this.scene.add(im);
      };
      mk(g.body, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }));
      mk(g.glow, new THREE.MeshBasicMaterial({ vertexColors: true }));
    }
    // brush fronds
    const fronds: { x: number; y: number; s: number; r: number }[] = [];
    let seed = 99;
    const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (const b of map.brushPatches) for (let k = 0; k < b.r * b.r * 4; k++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * b.r;
      fronds.push({ x: b.x + Math.cos(a) * d, y: b.y + Math.sin(a) * d, s: 0.7 + r() * 0.8, r: r() * 6 });
    }
    const fg = new THREE.ConeGeometry(0.22, 1.6, 4); fg.translate(0, 0.8, 0);
    const fm = new THREE.InstancedMesh(fg, new THREE.MeshStandardMaterial({ color: '#2f6b63', roughness: 0.6, emissive: '#0d2c2a' }), fronds.length);
    fronds.forEach((f, i) => {
      this.e.set((r() - 0.5) * 0.5, f.r, (r() - 0.5) * 0.5);
      this.q.setFromEuler(this.e);
      this.m4.compose(new THREE.Vector3(f.x, terrainHeight(map, f.x, f.y), f.y), this.q, new THREE.Vector3(f.s, f.s * (0.8 + r() * 0.6), f.s));
      fm.setMatrixAt(i, this.m4);
    });
    fm.castShadow = true;
    this.scene.add(fm);
    // bridges
    for (const b of map.bridges) {
      const deck = new THREE.Mesh(new THREE.BoxGeometry(b.width + 0.6, 0.5, b.len + 2), new THREE.MeshStandardMaterial({ color: '#5a5f66', roughness: 0.7, metalness: 0.3 }));
      deck.position.set(b.x, 2.45, b.y);
      deck.rotation.y = Math.atan2(b.dx, b.dy);
      deck.receiveShadow = true; deck.castShadow = true;
      this.scene.add(deck);
      for (const s of [-1, 1]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, b.len + 2), new THREE.MeshBasicMaterial({ color: '#ffb35c' }));
        rail.position.set(b.x + Math.cos(Math.atan2(b.dx, b.dy)) * s * (b.width / 2 + 0.2), 2.85, b.y - Math.sin(Math.atan2(b.dx, b.dy)) * s * (b.width / 2 + 0.2));
        rail.rotation.y = Math.atan2(b.dx, b.dy);
        this.scene.add(rail);
      }
    }
    // chasm glow floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), new THREE.MeshBasicMaterial({ color: '#0b3c42' }));
    floor.rotation.x = -Math.PI / 2; floor.position.set(72, -5.5, 72);
    this.scene.add(floor);
    // outer ground skirt so the camera never exposes void geometry
    const skirtMat = new THREE.MeshStandardMaterial({ color: '#191b20', roughness: 1 });
    for (const [x, z, w, d] of [[72, -148, 600, 300], [72, 292, 600, 300], [-150, 72, 300, 144], [294, 72, 300, 144]]) {
      const sk = new THREE.Mesh(new THREE.PlaneGeometry(w, d), skirtMat);
      sk.rotation.x = -Math.PI / 2; sk.position.set(x, 2.6, z);
      this.scene.add(sk);
    }
  }

  private group(key: string, size: number, isStructure: boolean, faction: string): InstGroup {
    const k = key + ':' + size;
    let g = this.groups.get(k);
    if (g && g.n < g.cap) return g;
    const geo = modelFor(key, size);
    const cap = g ? g.cap * 2 : isStructure ? 48 : 128;
    const verdant = faction === 'verdant';
    const bodyMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: verdant ? 0.45 : 0.62, metalness: verdant ? 0.05 : 0.35, emissive: verdant ? new THREE.Color('#1a0f26') : new THREE.Color('#000000') });
    const body = new THREE.InstancedMesh(geo.body, bodyMat, cap);
    body.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3).fill(1), 3);
    body.castShadow = this.settings.shadows && this.settings.quality !== 'low';
    body.receiveShadow = true;
    body.frustumCulled = false;
    const glow = geo.glow ? new THREE.InstancedMesh(geo.glow, new THREE.MeshBasicMaterial({ vertexColors: true }), cap) : null;
    const accent = geo.accent ? new THREE.InstancedMesh(geo.accent, new THREE.MeshBasicMaterial({ color: 0xffffff }), cap) : null;
    if (accent) accent.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3).fill(1), 3);
    for (const m of [glow, accent]) if (m) m.frustumCulled = false;
    if (g) {
      // grow: dispose old
      this.scene.remove(g.body); g.glow && this.scene.remove(g.glow); g.accent && this.scene.remove(g.accent);
      g.body.dispose(); g.glow?.dispose(); g.accent?.dispose();
    }
    this.scene.add(body); glow && this.scene.add(glow); accent && this.scene.add(accent);
    g = { body, glow, accent, cap, n: 0, geo };
    this.groups.set(k, g);
    return g;
  }

  private ghostGroup(key: string, size: number): THREE.InstancedMesh {
    const k = key + ':' + size;
    let g = this.ghostGroups.get(k);
    if (!g) {
      g = new THREE.InstancedMesh(modelFor(key, size).body, this.ghostMat, 32);
      g.frustumCulled = false; g.renderOrder = 3;
      this.ghostGroups.set(k, g);
      this.scene.add(g);
    }
    return g;
  }

  private putInstance(g: InstGroup, pos: THREE.Vector3, yaw: number, scale: THREE.Vector3, tint: number, team: THREE.Color, pitch = 0, roll = 0) {
    const i = g.n++;
    this.e.set(pitch, yaw, roll, 'YXZ');
    this.q.setFromEuler(this.e);
    this.m4.compose(pos, this.q, scale);
    g.body.setMatrixAt(i, this.m4);
    g.glow?.setMatrixAt(i, this.m4);
    if (g.accent) { g.accent.setMatrixAt(i, this.m4); g.accent.setColorAt(i, team); }
    this.col.setRGB(tint, tint, tint);
    g.body.setColorAt(i, this.col);
  }

  visibleToViewer(id: number): boolean {
    if (this.viewer < 0) return true;
    return this.sim.isVisibleTo(this.viewer, id);
  }
  cellVisible(x: number, y: number): boolean {
    if (this.viewer < 0 || !this.fogEnabled) return true;
    const n = this.sim.map.size;
    const cx = Math.floor(x), cy = Math.floor(y);
    if (cx < 0 || cy < 0 || cx >= n || cy >= n) return false;
    return this.sim.players[this.viewer].visible[cy * n + cx] === 1;
  }

  /** world position of an entity at render time (interpolated) */
  entityPos(id: number, alpha: number, out: THREE.Vector3): THREE.Vector3 {
    const sim = this.sim;
    const x = sim.px[id] + (sim.x[id] - sim.px[id]) * alpha;
    const y = sim.py[id] + (sim.y[id] - sim.py[id]) * alpha;
    let h = terrainHeight(sim.map, x, y);
    if (sim.kind[id] === Kind.Unit && sim.isHover(id)) h = Math.max(h, 1.2) + 1.6 + Math.sin(this.time * 2 + id) * 0.12;
    return out.set(x, h, y);
  }

  // --------------------------------------------------------------- events -> feedback
  handleEvents(events: SimEvent[]) {
    const t = this.time;
    const sim = this.sim;
    const map = sim.map;
    const fx = this.settings.effects;
    for (const ev of events) {
      const x = ev.x ?? 0, y = ev.y ?? 0;
      const vis = this.cellVisible(x, y);
      switch (ev.type) {
        case 'shot': {
          if (!vis && !this.cellVisible(ev.x2 ?? 0, ev.y2 ?? 0)) break;
          const h0 = terrainHeight(map, x, y) + (ev.id && sim.alive[ev.id] && sim.kind[ev.id] === Kind.Structure ? 1.1 : 0.9);
          const h1 = terrainHeight(map, ev.x2 ?? 0, ev.y2 ?? 0) + 0.6;
          const owner = ev.owner ?? 0;
          const a = this.anim.get(ev.id ?? 0) ?? this.newAnim(ev.id ?? 0);
          a.recoilUntil = t + 0.12;
          const k = ev.kind;
          if (k === 'rifle' || k === 'arc') {
            const c = k === 'arc' ? new THREE.Color('#bff4ff') : new THREE.Color('#ffd08a');
            this.tracers.add(new THREE.Vector3(x, h0, y), new THREE.Vector3(ev.x2, h1, ev.y2), t, k === 'arc' ? 0.14 : 0.07, k === 'arc' ? 0.12 : 0.05, c);
            this.particles.burst(x, h0, y, 4, 2, t, 0.12, 0.35, 0, c, () => this.rnd(), 0.2);
          } else if (k === 'lance_pen') {
            this.tracers.add(new THREE.Vector3(x, h1, y), new THREE.Vector3(ev.x2, h1, ev.y2), t, 0.15, 0.1, new THREE.Color('#d7f5ff'));
          } else if (k === 'eruption') {
            // telegraph: zone decal visualised from sim.zones; add a breath of spores at the stag
            this.particles.burst(x, h0 + 1, y, 6, 1.5, t, 0.5, 0.5, -0.5, new THREE.Color('#d9a3ff'), () => this.rnd());
          } else if (k === 'melee' || k === 'bite' || k === 'torch') {
            this.particles.burst(ev.x2 ?? x, h1, ev.y2 ?? y, 3, 1.5, t, 0.2, 0.3, 2, new THREE.Color(k === 'torch' ? '#ffcf70' : '#f0c8ff'), () => this.rnd());
          } else {
            this.particles.burst(x, h0, y, 3, 1.2, t, 0.15, 0.4, 0, this.teamColor(owner).clone().lerp(new THREE.Color('#ffffff'), 0.5), () => this.rnd(), 0.2);
          }
          break;
        }
        case 'windup': {
          const a = this.anim.get(ev.id ?? 0) ?? this.newAnim(ev.id ?? 0);
          a.windupUntil = t + (ev.duration ?? 2) / 20;
          break;
        }
        case 'impact': {
          if (!vis) break;
          const h = terrainHeight(map, x, y) + 0.5;
          const k = ev.kind;
          if (ev.target && sim.alive[ev.target]) { const a = this.anim.get(ev.target) ?? this.newAnim(ev.target); a.hitUntil = t + 0.09; }
          if (k === 'shell' || k === 'eruption') {
            const c = k === 'shell' ? new THREE.Color('#ffae4f') : new THREE.Color('#c77dff');
            this.particles.burst(x, h, y, 26, 4.5, t, 0.6, 0.9, 6, c, () => this.rnd(), 0.8);
            this.particles.burst(x, h, y, 12, 1.2, t, 1.1, 1.2, -0.3, new THREE.Color('#3a3530'), () => this.rnd(), 0.6);
            if (!this.settings.reducedMotion) this.shake = Math.max(this.shake, 3);
          } else if (k === 'shield') {
            this.particles.burst(x, h + 0.6, y, 6, 2, t, 0.25, 0.5, 0, new THREE.Color('#9fe8ff'), () => this.rnd(), 0.2);
          } else {
            const c = k === 'spore' ? new THREE.Color('#b8ffb0') : k === 'lance' ? new THREE.Color('#d7f5ff') : k === 'needle' ? new THREE.Color('#e0c0ff') : new THREE.Color('#ffd9a0');
            this.particles.burst(x, h, y, 5 * fx + 2, 2.2, t, 0.25, 0.4, 4, c, () => this.rnd(), 0.4);
          }
          break;
        }
        case 'death': {
          if (ev.kind === 'silent') break;
          if (!vis && this.viewer >= 0 && ev.owner !== this.viewer) break;
          const def = ev.def ?? '';
          const isS = !!STRUCTURES[def];
          const faction = UNITS[def]?.faction ?? STRUCTURES[def]?.faction ?? 'neutral';
          const h = terrainHeight(map, x, y);
          const key = def === 'vent' || def === 'ore' || def === 'barrier' || def === 'pylon' || def === 'pod' ? def : def;
          if (UNITS[def] || isS || def === 'barrier') {
            this.corpses.push({ key, size: isS ? STRUCTURES[def].size : 0, x, y, h, yaw: ev.id ? Math.atan2(sim.fx[ev.id], sim.fy[ev.id]) : 0, owner: ev.owner ?? -1, t0: t, life: isS ? 1.2 : faction === 'verdant' ? 0.9 : 0.6, faction, isStructure: isS });
          }
          const big = isS ? 3 : (UNITS[def]?.radius ?? 0.5) * 2;
          if (faction === 'verdant') {
            this.particles.burst(x, h + 0.6, y, 18 * big, 1.6, t, 1.4, 0.7, -0.6, new THREE.Color('#d7a6ff'), () => this.rnd(), 0.5);
            this.particles.burst(x, h + 0.4, y, 8 * big, 2.5, t, 0.5, 0.5, 3, new THREE.Color('#7ff5e0'), () => this.rnd(), 0.5);
          } else if (def === 'barrier') {
            this.particles.burst(x, h + 1, y, 70, 6, t, 1.2, 0.9, 7, new THREE.Color('#bfe9ff'), () => this.rnd(), 0.9);
          } else if (def !== 'ore' && def !== 'pod') {
            this.particles.burst(x, h + 0.6, y, 20 * big, 4, t, 0.5, 0.6, 6, new THREE.Color('#ffb14a'), () => this.rnd(), 0.7);
            this.particles.burst(x, h + 0.4, y, 10 * big, 2, t, 1.0, 0.8, 8, new THREE.Color('#2b2b2e'), () => this.rnd(), 0.9);
          } else if (def === 'ore') {
            this.particles.burst(x, h + 0.6, y, 20, 2.5, t, 0.8, 0.5, 4, new THREE.Color('#5ff0e0'), () => this.rnd(), 0.7);
          }
          if (isS && !this.settings.reducedMotion && vis) this.shake = Math.max(this.shake, 4);
          break;
        }
        case 'heal': {
          if (!vis) break;
          const h = terrainHeight(map, x, y) + 0.8;
          if (ev.kind === 'mender' && ev.x2 !== undefined) this.tracers.add(new THREE.Vector3(ev.x2, terrainHeight(map, ev.x2, ev.y2 ?? 0) + 1, ev.y2), new THREE.Vector3(x, h, y), t, 0.3, 0.05, new THREE.Color('#ffe9a8'));
          this.particles.burst(x, h, y, 3, 0.8, t, 0.7, 0.35, -1, new THREE.Color(ev.kind === 'aura' ? '#c49cff' : '#ffe08a'), () => this.rnd(), 1.0);
          break;
        }
        case 'construct': {
          if (!vis) break;
          const h = terrainHeight(map, x, y) + 0.7;
          const faction = this.sim.players[ev.owner ?? 0]?.faction;
          this.particles.burst(x + (sim.fx[ev.id ?? 0] ?? 0) * 0.6, h, y + (sim.fy[ev.id ?? 0] ?? 0) * 0.6, 4, 2.5, t, 0.3, 0.3, 6, new THREE.Color(faction === 'verdant' ? '#c9a2ff' : '#ffe1a0'), () => this.rnd(), 0.6);
          break;
        }
        case 'built': {
          if (!vis) break;
          const h = terrainHeight(map, x, y) + 0.3;
          for (let i = 0; i < 40; i++) {
            const a = (i / 40) * Math.PI * 2;
            this.particles.emit(x, h, y, Math.cos(a) * 4, 0.6, Math.sin(a) * 4, t, 0.6, 0.6, 0, this.teamColor(ev.owner ?? 0));
          }
          break;
        }
        case 'ability': {
          if (!vis) break;
          const h = terrainHeight(map, x, y) + 0.5;
          if (ev.kind === 'rootstep') {
            this.particles.burst(x, h, y, 30, 2, t, 0.8, 0.6, -1, new THREE.Color('#d7a6ff'), () => this.rnd(), 1);
            this.particles.burst(ev.x2 ?? x, terrainHeight(map, ev.x2 ?? x, ev.y2 ?? y) + 0.5, ev.y2 ?? y, 30, 2, t + 0.05, 0.8, 0.6, -1, new THREE.Color('#d7a6ff'), () => this.rnd(), 1);
          } else if (ev.kind === 'sensor_spike') {
            for (let i = 0; i < 30; i++) { const a = (i / 30) * Math.PI * 2; this.particles.emit(x, h, y, Math.cos(a) * 6, 0, Math.sin(a) * 6, t, 1, 0.4, 0, new THREE.Color('#ffc46b')); }
          } else if (ev.kind === 'brace' || ev.kind === 'curl' || ev.kind === 'setup') {
            this.particles.burst(x, h - 0.3, y, 8, 1.5, t, 0.4, 0.5, 2, new THREE.Color('#8f8a80'), () => this.rnd(), 0.3);
          } else if (ev.kind === 'emergency_weld') {
            this.particles.burst(x, h + 1, y, 20, 2.5, t, 0.6, 0.4, 5, new THREE.Color('#ffd27a'), () => this.rnd(), 0.8);
          }
          break;
        }
        case 'capture': case 'pod': {
          const h = terrainHeight(map, x, y) + 0.5;
          for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; this.particles.emit(x, h, y, Math.cos(a) * 5, 1.5, Math.sin(a) * 5, t, 0.9, 0.6, 0, ev.type === 'pod' ? new THREE.Color('#ffe08a') : this.teamColor(ev.owner ?? 0)); }
          break;
        }
        case 'pulse': {
          for (let i = 0; i < 160; i++) { const a = (i / 160) * Math.PI * 2; this.particles.emit(72, 1.5, 72, Math.cos(a) * 40, 0.5, Math.sin(a) * 40, t, 2.2, 1.6, 0, new THREE.Color('#7ff5e0')); }
          break;
        }
        case 'deposit': {
          if (!vis) break;
          const h = terrainHeight(map, x, y) + 0.9;
          this.particles.burst(x, h, y, 3, 1, t, 0.4, 0.35, -2, new THREE.Color(ev.kind === 'flux' ? '#ffa14a' : '#5ff0e0'), () => this.rnd(), 0.8);
          break;
        }
      }
    }
  }
  private newAnim(id: number): AnimState { const a = { hitUntil: 0, recoilUntil: 0, windupUntil: 0, buildPulse: 0 }; this.anim.set(id, a); return a; }

  // --------------------------------------------------------------- frame
  render(alpha: number, dt: number, selection: Set<number>, hover: number) {
    if (this.contextLost) return;
    this.time += dt;
    const t = this.time;
    const sim = this.sim;
    const map = sim.map;
    for (const g of this.groups.values()) g.n = 0;
    const ghostCounts = new Map<string, number>();
    const pos = this.v3, scl = this.s3;
    const one = new THREE.Vector3(1, 1, 1);
    let rings = 0;
    const ringColor = new THREE.Color();
    const addRing = (x: number, h: number, y: number, r: number, c: THREE.Color) => {
      if (rings >= 512) return;
      this.m4.compose(new THREE.Vector3(x, h + 0.08, y), this.q.identity(), new THREE.Vector3(r, 1, r));
      this.selRings.setMatrixAt(rings, this.m4);
      this.selRings.setColorAt(rings, c);
      rings++;
    };

    for (let id = 1; id < sim.nextId; id++) {
      if (!sim.alive[id]) continue;
      const k = sim.kind[id];
      if (k === Kind.None) continue;
      if (this.fogEnabled && this.viewer >= 0 && sim.owner[id] !== this.viewer) {
        if (k === Kind.Unit || k === Kind.Spike) { if (!this.visibleToViewer(id)) continue; }
        else if (k === Kind.Structure) { if (!this.visibleToViewer(id)) continue; }
        else if (!sim.players[this.viewer].explored[Math.floor(sim.y[id]) * map.size + Math.floor(sim.x[id])]) continue;
      }
      const owner = sim.owner[id];
      const team = this.teamColor(owner);
      const a = this.anim.get(id);
      const tint = a && a.hitUntil > t ? 2.2 : 1;
      if (k === Kind.Unit) {
        const d = sim.udef(id);
        const e = sim.ext[id];
        this.entityPos(id, alpha, pos);
        let yaw = Math.atan2(sim.fx[id], sim.fy[id]);
        let pitch = 0, roll = 0;
        const moving = sim.moving[id] === 1;
        let bob = 0;
        if (moving && !d.hover) {
          bob = Math.abs(Math.sin(t * d.speed * 3.2 + id)) * (d.tags.includes('Biological') ? 0.09 : 0.05);
          pitch = 0.07;
          roll = Math.sin(t * d.speed * 1.6 + id) * 0.04;
        }
        if (e.phase === 'mining' || e.phase === 'constructing' || e.phase === 'planting') { pitch = 0.25 + Math.sin(t * 14 + id) * 0.12; }
        if (a && a.windupUntil > t) pitch -= 0.08;
        let rx = 0, rz = 0;
        if (a && a.recoilUntil > t) { const k2 = (a.recoilUntil - t) / 0.12; rx = -sim.fx[id] * 0.12 * k2; rz = -sim.fy[id] * 0.12 * k2; }
        scl.copy(one);
        if (e.braced) { scl.set(1.08, 0.86, 1.08); }
        if (e.curled) { scl.set(1.1, 0.7, 1.1); }
        scl.multiplyScalar(UNIT_VIS_SCALE);
        if (d.weapon?.setupTicks && e.setup > 0) { pitch = -0.12 * Math.min(1, e.setup / (d.weapon.setupTicks ?? 1)); }
        if (d.hover) roll = Math.sin(t * 3 + id) * 0.08;
        if (e.carryAmount > 0 && !moving) bob += 0;
        pos.y += bob; pos.x += rx; pos.z += rz;
        if (d.id === 'glimmerwing') yaw += Math.sin(t * 2 + id) * 0.1;
        const g = this.group(d.id, 0, false, d.faction);
        this.putInstance(g, pos, yaw, scl, tint, team, pitch, roll);
        if (selection.has(id)) addRing(pos.x, terrainHeight(map, pos.x, pos.z), pos.z, d.radius * 1.35 * UNIT_VIS_SCALE, ringColor.set(owner === this.viewer || this.viewer < 0 ? '#5cff8a' : '#ff5c5c'));
        else if (hover === id) addRing(pos.x, terrainHeight(map, pos.x, pos.z), pos.z, d.radius * 1.3 * UNIT_VIS_SCALE, ringColor.set('#cfd8e6'));
        // carried resource marker (visible load)
        if (e.carryAmount > 0 && (t * 60 + id) % 6 < 1) this.particles.emit(pos.x, pos.y + 1.0, pos.z, 0, 0.3, 0, t, 0.2, 0.45, 0, e.carry === 'flux' ? new THREE.Color('#ffa14a') : new THREE.Color('#5ff0e0'));
        // hover scouts cast a contact blob of light under them
        continue;
      }
      if (k === Kind.Structure) {
        const d = sim.sdef(id);
        pos.set(sim.x[id], terrainHeight(map, sim.x[id], sim.y[id]) - 0.05, sim.y[id]);
        const p = sim.built[id] ? 1 : sim.progress[id];
        scl.set(1, 0.12 + 0.88 * p, 1);
        let yaw = 0;
        if (d.weapon) yaw = Math.atan2(sim.fx[id], sim.fy[id]);
        const g = this.group(d.id, d.size, true, d.faction);
        this.putInstance(g, pos, yaw, scl, sim.built[id] ? tint : tint * 0.75, team);
        if (!sim.built[id] && (t * 30 + id) % 3 < 1) this.particles.emit(sim.x[id] + (this.rnd() - 0.5) * d.size, pos.y + p * 2, sim.y[id] + (this.rnd() - 0.5) * d.size, 0, 1.5, 0, t, 0.5, 0.5, 0, d.faction === 'verdant' ? new THREE.Color('#c9a2ff') : new THREE.Color('#ffd27a'));
        if (selection.has(id)) addRing(sim.x[id], pos.y, sim.y[id], d.size * 0.78, ringColor.set(owner === this.viewer || this.viewer < 0 ? '#5cff8a' : '#ff5c5c'));
        else if (hover === id) addRing(sim.x[id], pos.y, sim.y[id], d.size * 0.75, ringColor.set('#cfd8e6'));
        if (d.isExtractor && sim.built[id] && (t * 20 + id) % 4 < 1) this.particles.emit(sim.x[id], pos.y + 2.6, sim.y[id], (this.rnd() - 0.5) * 0.4, 1.8, (this.rnd() - 0.5) * 0.4, t, 1.2, 0.7, -0.2, new THREE.Color('#ff9a3c'));
        continue;
      }
      // neutrals
      let key = '';
      let s = 1;
      if (k === Kind.Ore) { key = 'ore'; const e = sim.ext[id]; s = 0.55 + 0.45 * Math.min(1, e.amount / Math.max(1, e.maxAmount)); }
      else if (k === Kind.Vent) { key = 'vent'; if ((t * 15 + id) % 3 < 1 && this.cellVisible(sim.x[id], sim.y[id])) this.particles.emit(sim.x[id] + (this.rnd() - 0.5), terrainHeight(map, sim.x[id], sim.y[id]) + 0.4, sim.y[id] + (this.rnd() - 0.5), 0, 1.4, 0, t, 1.4, 0.8, -0.2, new THREE.Color('#ff7a2a')); }
      else if (k === Kind.Pylon) key = 'pylon';
      else if (k === Kind.Barrier) key = 'barrier';
      else if (k === Kind.Pod) key = 'pod';
      else if (k === Kind.Spike) key = 'sensor_spike';
      if (!key) continue;
      pos.set(sim.x[id], terrainHeight(map, sim.x[id], sim.y[id]) - 0.05, sim.y[id]);
      if (k === Kind.Pod) pos.y += 0.2 + Math.sin(t * 2 + id) * 0.08;
      scl.set(s, s, s);
      let acc = team;
      if (k === Kind.Pylon) {
        const pe = sim.ext[id];
        acc = pe.captureOwner >= 0 ? this.teamColor(pe.captureOwner) : this.col.set('#e8f1ff');
        if (pe.contested && Math.floor(t * 4) % 2 === 0) acc = this.col.set('#ffffff');
        if (pe.captureProgress > 0 && pe.captureBy >= 0 && (t * 20) % 2 < 1) {
          const ang = t * 6;
          this.particles.emit(sim.x[id] + Math.cos(ang) * 2, pos.y + 0.3, sim.y[id] + Math.sin(ang) * 2, 0, 1.5, 0, t, 0.6, 0.6, 0, this.teamColor(pe.captureBy));
        }
      }
      const g = this.group(key, 0, k !== Kind.Spike, 'neutral');
      this.putInstance(g, pos, k === Kind.Barrier ? id : k === Kind.Ore ? id * 1.7 : 0, scl, tint, acc);
      if (selection.has(id) || hover === id) addRing(pos.x, pos.y, pos.z, k === Kind.Barrier ? 2.4 : k === Kind.Vent ? 1.8 : 1.1, ringColor.set(hover === id && !selection.has(id) ? '#cfd8e6' : '#ffe27a'));
    }
    // corpses: collapse (Helix) / dissolve (Chorus), never hide lethal feedback
    this.corpses = this.corpses.filter((c) => t - c.t0 < c.life);
    for (const c of this.corpses) {
      const k = (t - c.t0) / c.life;
      const g = this.group(c.key, c.size, c.isStructure, c.faction);
      if (c.faction === 'verdant') scl.set(1 + k * 0.3, Math.max(0.05, 1 - k), 1 + k * 0.3);
      else scl.set(1, Math.max(0.05, 1 - k * 0.8), 1);
      if (!c.isStructure) scl.multiplyScalar(UNIT_VIS_SCALE);
      pos.set(c.x, c.h - k * (c.isStructure ? 1.5 : 0.4), c.y);
      this.putInstance(g, pos, c.yaw, scl, 0.35, this.teamColor(c.owner), c.faction === 'helix' ? k * 0.6 : 0, c.faction === 'helix' ? k * 0.3 : 0);
    }
    for (const g of this.groups.values()) {
      for (const m of [g.body, g.glow, g.accent]) {
        if (!m) continue;
        m.count = g.n;
        m.instanceMatrix.needsUpdate = true;
        if (m.instanceColor) m.instanceColor.needsUpdate = true;
      }
    }
    // last-known structure ghosts (desaturated, fogged)
    if (this.viewer >= 0 && this.fogEnabled) {
      for (const gm of this.ghostGroups.values()) gm.count = 0;
      for (const gh of sim.players[this.viewer].ghosts.values()) {
        if (sim.alive[gh.id] && sim.isVisibleTo(this.viewer, gh.id)) continue;
        const gm = this.ghostGroup(gh.def, gh.size);
        const n = ghostCounts.get(gh.def) ?? 0;
        if (n >= 32) continue;
        ghostCounts.set(gh.def, n + 1);
        this.m4.compose(new THREE.Vector3(gh.x, terrainHeight(map, gh.x, gh.y), gh.y), this.q.identity(), new THREE.Vector3(1, 0.12 + 0.88 * gh.progress, 1));
        gm.setMatrixAt(n, this.m4);
        gm.count = n + 1;
        gm.instanceMatrix.needsUpdate = true;
      }
    } else for (const gm of this.ghostGroups.values()) gm.count = 0;

    this.selRings.count = rings;
    this.selRings.instanceMatrix.needsUpdate = true;
    if (this.selRings.instanceColor) this.selRings.instanceColor.needsUpdate = true;

    // projectiles (visual interpolation of simulated projectiles)
    let pn = 0;
    for (const pr of sim.projectiles) {
      if (pn >= 512) break;
      if (!this.cellVisible(pr.x, pr.y)) continue;
      const ax = pr.x + ((pr.tx - pr.x) / Math.max(1e-3, Math.hypot(pr.tx - pr.x, pr.ty - pr.y))) * pr.speed * alpha;
      const ay = pr.y + ((pr.ty - pr.y) / Math.max(1e-3, Math.hypot(pr.tx - pr.x, pr.ty - pr.y))) * pr.speed * alpha;
      const prog = Math.min(1, (pr.traveled + pr.speed * alpha) / Math.max(0.1, pr.total));
      let h = terrainHeight(map, ax, ay) + 0.9;
      if (pr.arc) h += Math.sin(prog * Math.PI) * Math.min(6, pr.total * 0.5);
      const sz = pr.kind === 'shell' ? 1.6 : pr.kind === 'lance' ? 1.3 : 1;
      this.m4.compose(new THREE.Vector3(ax, h, ay), this.q.identity(), new THREE.Vector3(sz, sz, sz));
      this.projMesh.setMatrixAt(pn, this.m4);
      this.projMesh.setColorAt(pn, this.col.set(pr.kind === 'spore' ? '#b8ffb0' : pr.kind === 'lance' ? '#e6fbff' : pr.kind === 'needle' ? '#e3b8ff' : '#ffb14a'));
      if (pr.kind === 'shell' || pr.kind === 'lance') this.particles.emit(ax, h, ay, 0, 0.2, 0, t, 0.3, pr.kind === 'shell' ? 0.6 : 0.4, 0, pr.kind === 'shell' ? new THREE.Color('#ff9a3c') : new THREE.Color('#9fe8ff'));
      pn++;
    }
    this.projMesh.count = pn;
    this.projMesh.instanceMatrix.needsUpdate = true;
    if (this.projMesh.instanceColor) this.projMesh.instanceColor.needsUpdate = true;

    // area effects show edge, fill, ownership and activation time
    let zi = 0;
    const zoneMesh = () => {
      let m = this.zonePool[zi];
      if (!m) {
        const g = new THREE.PlaneGeometry(2, 2); g.rotateX(-Math.PI / 2);
        m = new THREE.Mesh(g, makeZoneMaterial(new THREE.Color('#fff')));
        m.renderOrder = 4; m.frustumCulled = false;
        this.zonePool.push(m); this.scene.add(m);
      }
      zi++;
      m.visible = true;
      return m;
    };
    for (const z of sim.zones) {
      if (!this.cellVisible(z.x, z.y) && z.owner !== this.viewer) continue;
      const m = zoneMesh();
      const mat = m.material as THREE.ShaderMaterial;
      const active = sim.tick >= z.start;
      const telegraph = z.kind === 'mend' ? 1 : Math.min(1, 1 - (z.start - sim.tick) / (z.kind === 'eruption' ? 24 : 24));
      mat.uniforms.uColor.value.set(z.kind === 'mend' ? '#7dffb2' : z.kind === 'silence' ? '#c08bff' : z.owner === this.viewer ? '#d79bff' : '#ff6b6b');
      mat.uniforms.uColor.value.lerp(this.teamColor(z.owner), 0.25);
      mat.uniforms.uActive.value = active ? 1 : 0;
      mat.uniforms.uProgress.value = telegraph;
      mat.uniforms.uTime.value = t;
      m.position.set(z.x, terrainHeight(map, z.x, z.y) + 0.15, z.y);
      m.scale.set(z.r, 1, z.r);
      if (z.kind === 'mend' && (t * 30) % 2 < 1) this.particles.emit(z.x + (this.rnd() - 0.5) * z.r * 1.6, m.position.y, z.y + (this.rnd() - 0.5) * z.r * 1.6, 0, 1.2, 0, t, 0.9, 0.45, -0.3, new THREE.Color('#9dffc4'));
    }
    // build-zone circles during placement
    if (this.placement) for (const zc of this.placement.zones) {
      const m = zoneMesh();
      const mat = m.material as THREE.ShaderMaterial;
      mat.uniforms.uColor.value.set(this.sim.players[Math.max(0, this.viewer)].faction === 'verdant' ? '#b48cff' : '#ffc46b').multiplyScalar(0.5);
      mat.uniforms.uActive.value = 0; mat.uniforms.uProgress.value = 0; mat.uniforms.uTime.value = 0;
      m.position.set(zc.x, terrainHeight(map, zc.x, zc.y) + 0.12, zc.y);
      m.scale.set(zc.r, 1, zc.r);
    }
    for (let i = zi; i < this.zonePool.length; i++) this.zonePool[i].visible = false;

    this.updatePlacement();
    this.tracers.update(t);
    this.particles.flush(t, this.renderer.domElement.clientHeight || 720);
    const dp = this.dust.geometry.attributes.position as THREE.BufferAttribute;
    if (this.dust.visible) { this.dust.position.x = Math.sin(t * 0.05) * 3; this.dust.position.z = (t * 0.4) % 6; }
    void dp;

    // fog texture
    if (this.viewer >= 0) {
      const p = sim.players[this.viewer];
      updateFog(this.terrain, p.visible, p.explored, this.fogSmooth, dt, !this.fogEnabled);
    } else {
      this.terrain.uniforms.uFogEnabled.value = 0;
    }
    // shadow camera follows the view
    const tgt = this.camTarget;
    this.sun.target.position.set(tgt.x, 0, tgt.z);
    this.sun.position.set(tgt.x - 40, 80, tgt.z + 30);
    // camera shake (2–4 px impulse; disabled with reduced motion)
    const base = this.camera.position.clone();
    if (this.shake > 0.05) {
      const px = (this.rnd() - 0.5) * this.shake * 0.02, pz = (this.rnd() - 0.5) * this.shake * 0.02;
      this.camera.position.x += px * this.camera.position.y * 0.05; this.camera.position.z += pz * this.camera.position.y * 0.05;
      this.shake *= Math.pow(0.02, dt);
    }
    this.renderer.render(this.scene, this.camera);
    this.camera.position.copy(base);
  }
  camTarget = new THREE.Vector3(72, 0, 72);

  private updatePlacement() {
    const p = this.placement;
    if (!p) { this.placeCells.count = 0; this.placeGhost.visible = false; this.placeRange.visible = false; this.placeCone.visible = false; return; }
    const map = this.sim.map;
    const n = map.size;
    let i = 0;
    for (const c of p.cells) {
      if (i >= 64) break;
      const x = (c.c % n) + 0.5, y = ((c.c / n) | 0) + 0.5;
      this.m4.compose(new THREE.Vector3(x, terrainHeight(map, x, y) + 0.1, y), this.q.identity(), new THREE.Vector3(1, 1, 1));
      this.placeCells.setMatrixAt(i, this.m4);
      this.placeCells.setColorAt(i, this.col.set(c.ok ? '#3dff7a' : '#ff3d3d'));
      i++;
    }
    this.placeCells.count = i;
    this.placeCells.instanceMatrix.needsUpdate = true;
    if (this.placeCells.instanceColor) this.placeCells.instanceColor.needsUpdate = true;
    const d = STRUCTURES[p.def];
    const cx = p.tx + d.size / 2, cy = p.ty + d.size / 2;
    const h = terrainHeight(map, cx, cy);
    const geo = modelFor(d.id, d.size).body;
    if (this.placeGhost.geometry !== geo) this.placeGhost.geometry = geo;
    (this.placeGhost.material as THREE.MeshBasicMaterial).color.set(p.ok ? '#66ff99' : '#ff6666');
    this.placeGhost.position.set(cx, h, cy);
    this.placeGhost.visible = true;
    if (d.weapon) {
      this.placeRange.visible = true;
      this.placeRange.position.set(cx, h + 0.15, cy);
      this.placeRange.scale.set(d.weapon.range + d.size / 2, 1, d.weapon.range + d.size / 2);
      if (d.weapon.coneHalfAngle) {
        this.placeCone.visible = true;
        this.placeCone.position.set(cx, h + 0.2, cy);
        const r = d.weapon.range + d.size / 2;
        this.placeCone.scale.set(r, 1, r);
        this.placeCone.rotation.y = Math.atan2(72 - cx, 72 - cy) - Math.PI / 2 + Math.PI / 2;
      } else this.placeCone.visible = false;
    } else { this.placeRange.visible = false; this.placeCone.visible = false; }
  }

  // --------------------------------------------------------------- helpers for input/UI
  project(x: number, h: number, y: number, w: number, hgt: number): { x: number; y: number; behind: boolean } {
    const v = this.v3.set(x, h, y).project(this.camera);
    return { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * hgt, behind: v.z > 1 };
  }

  /** Ray-march the heightfield (exact, fast, DPR independent given CSS pixel input). */
  pickGround(sx: number, sy: number, w: number, h: number): { x: number; y: number } {
    const ndc = new THREE.Vector3((sx / w) * 2 - 1, -(sy / h) * 2 + 1, 0.5);
    ndc.unproject(this.camera);
    const o = this.camera.position.clone();
    const d = ndc.sub(o).normalize();
    const map = this.sim.map;
    let t = 0, prevT = 0;
    for (let i = 0; i < 600; i++) {
      const p = o.clone().addScaledVector(d, t);
      const th = terrainHeight(map, p.x, p.z);
      if (p.y <= Math.max(th, -1)) {
        let lo = prevT, hi = t;
        for (let k = 0; k < 12; k++) {
          const mid = (lo + hi) / 2;
          const q = o.clone().addScaledVector(d, mid);
          if (q.y <= Math.max(terrainHeight(map, q.x, q.z), -1)) hi = mid; else lo = mid;
        }
        const q = o.clone().addScaledVector(d, hi);
        return { x: q.x, y: q.z };
      }
      prevT = t;
      t += 0.5;
    }
    // fall back to the y=0 plane
    const tt = -o.y / d.y;
    return { x: o.x + d.x * tt, y: o.z + d.z * tt };
  }

  setDebugOverlay(on: boolean) { this.terrain.uniforms.uDebug.value = on ? 1 : 0; }

  stats() {
    const i = this.renderer.info;
    return { calls: i.render.calls, triangles: i.render.triangles, geometries: i.memory.geometries, textures: i.memory.textures };
  }

  dispose() {
    this.renderer.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose()); else mat?.dispose();
    });
  }
}
