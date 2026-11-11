// Three.js presentation layer. Reads simulation state, consumes events; never mutates the simulation.
import * as THREE from 'three';
import { BASE_BY_ID } from '../data/items';
import { ELITE_MODS } from '../data/enemies';
import { hasEffect, getEffect } from '../sim/combat';
import type { Enemy, Pickup } from '../sim/entities';
import type { Game } from '../sim/game';
import { FLOOR, WALL } from '../sim/nav';
import type { GameEvent } from '../sim/types';
import { buildRefuge, type Zone } from '../sim/world';
import { hash2 } from './geo';
import { buildEnemy, buildNpc, buildPlayer, type ActorModel, type AnimCtx } from './models';
import { propGeo } from './props';
import { makeFloorTexture, makeStoneTexture } from './textures';
import { DecalPool, Particles } from './vfx';

export interface ViewSettings {
  shadows: 'off' | 'low' | 'high';
  particles: number; // 0.25..1
  shake: number; // 0..1
  reducedMotion: boolean;
  colorblind: boolean;
  dynamicRes: boolean;
  pixelRatioCap: number;
}
export const DEFAULT_VIEW_SETTINGS: ViewSettings = { shadows: 'high', particles: 1, shake: 1, reducedMotion: false, colorblind: false, dynamicRes: true, pixelRatioCap: 1.5 };

export interface PickResult {
  gx: number;
  gz: number;
  enemy?: number;
  interact?: string;
  pickup?: number;
}

interface ActorView {
  model: ActorModel;
  phase: number;
  markMesh?: THREE.Mesh;
  wardMesh?: THREE.Mesh;
  eliteRing?: THREE.Mesh;
  fade: number;
  lastX: number;
  lastZ: number;
  isElite: boolean;
  slow?: THREE.Mesh;
  shadows?: boolean;
}

const RARITY_COL: Record<string, number> = { worn: 0xb8b8b8, tempered: 0x6aa8ff, inscribed: 0xffd45a, relic: 0xff7a3a };
const SKY: Record<string, number> = { town: 0x151821, wild: 0x15151a, crypt: 0x0d1317 };
const PITCH = (38 * Math.PI) / 180;
const YAW = (45 * Math.PI) / 180;

export class GameView {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  game: Game | null = null;
  settings: ViewSettings = { ...DEFAULT_VIEW_SETTINGS };
  private zoneGroup = new THREE.Group();
  private zoneRef: Zone | null = null;
  private actors = new Map<number, ActorView>();
  private playerView: ActorView | null = null;
  private playerKey = '';
  private npcViews = new Map<string, { model: ActorModel; x: number; z: number }>();
  private projViews = new Map<number, THREE.Object3D>();
  private pickupViews = new Map<number, THREE.Object3D>();
  private standardViews: THREE.Group[] = [];
  private trapViews: THREE.Mesh[] = [];
  private cageNpc: ActorModel | null = null;
  decals: DecalPool;
  particles: Particles;
  private hemi = new THREE.HemisphereLight(0x8a9cc8, 0x4a3a30, 0.95);
  private moon = new THREE.DirectionalLight(0xb8c8ff, 1.6);
  private lights: THREE.PointLight[] = [];
  private flash = new THREE.PointLight(0xffa060, 0, 14);
  private zoneLights: { x: number; z: number; color: number; intensity: number; dist: number; flicker: boolean }[] = [];
  private wallMesh: THREE.InstancedMesh | null = null;
  private wallData: { x: number; z: number; h: number; scale: number; target: number }[] = [];
  private wallSig = '';
  private occluders: { mesh: THREE.InstancedMesh; idx: number; x: number; z: number; sy: number; target: number; cur: number; m: THREE.Matrix4; pos: THREE.Vector3; rot: THREE.Quaternion; sx: number }[] = [];
  private occMeshes = new Set<THREE.InstancedMesh>();
  private glowMats: THREE.Material[] = [];
  private camPos = new THREE.Vector3();
  private camTarget = new THREE.Vector3();
  private camLook = new THREE.Vector3();
  private zoomTarget = 18;
  private zoom = 18;
  private shakeAmt = { hit: 0, boss: 0, env: 0 };
  private shakeOff = new THREE.Vector3();
  private time = 0;
  private lastLightSort = 0;
  private hoverRing: THREE.Mesh;
  private enemyRing: THREE.Mesh;
  private moveMarker: THREE.Mesh;
  private moveMarkerT = 0;
  invalidMarkerT = 0;
  private interpAlpha = 1;
  private tmpV = new THREE.Vector3();
  private raycaster = new THREE.Raycaster();
  private plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private frameMs = 16;
  private needResize = false;
  private resScale = 1;
  private lastResAdj = 0;
  private cvSize = { w: 1, h: 1 };
  menu: { mode: 'off' | 'title' | 'create'; cls: 'cinder' | 'ranger'; look: number } = { mode: 'off', cls: 'cinder', look: 0 };
  private menuModel: ActorModel | null = null;
  private menuModelKey = '';
  private orbit = 0;
  private stoneTex: THREE.CanvasTexture;
  private wallMat: THREE.MeshStandardMaterial;
  private floorTex: THREE.CanvasTexture | null = null;
  private propMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0.0, emissive: 0x14161c, emissiveIntensity: 1 });
  private propGlowMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  private fireMeshes: { mesh: THREE.Object3D; base: number; ph: number }[] = [];
  lowestFps = 60;

  constructor(readonly canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.5;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.5, 220);
    this.scene.add(this.zoneGroup, this.hemi, new THREE.AmbientLight(0x8a90b4, 0.72), this.moon, this.moon.target, this.flash);
    this.scene.background = new THREE.Color(SKY.wild);
    this.scene.fog = new THREE.Fog(SKY.wild, 46, 96);
    this.moon.castShadow = true;
    this.moon.shadow.mapSize.set(2048, 2048);
    const sc = this.moon.shadow.camera;
    sc.left = -30;
    sc.right = 30;
    sc.top = 30;
    sc.bottom = -30;
    sc.near = 1;
    sc.far = 120;
    this.moon.shadow.bias = -0.0006;
    this.moon.shadow.normalBias = 0.04;
    for (let i = 0; i < 6; i++) {
      const l = new THREE.PointLight(0xff9a50, 0, 12, 1.6);
      this.lights.push(l);
      this.scene.add(l);
    }
    this.decals = new DecalPool(this.scene);
    this.particles = new Particles(this.scene);
    this.stoneTex = makeStoneTexture(this.renderer);
    this.wallMat = new THREE.MeshStandardMaterial({ map: this.stoneTex, roughness: 0.92, metalness: 0.0, color: 0xf2eee8, emissive: 0x20232c, emissiveIntensity: 1 });
    const rg = new THREE.RingGeometry(0.85, 1.0, 32);
    rg.rotateX(-Math.PI / 2);
    this.hoverRing = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.8, depthWrite: false, toneMapped: false }));
    this.hoverRing.visible = false;
    this.hoverRing.renderOrder = 3;
    this.enemyRing = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: 0xff7a50, transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false }));
    this.enemyRing.visible = false;
    this.enemyRing.renderOrder = 3;
    const mg = new THREE.RingGeometry(0.3, 0.4, 20);
    mg.rotateX(-Math.PI / 2);
    this.moveMarker = new THREE.Mesh(mg, new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.8, depthWrite: false, toneMapped: false }));
    this.moveMarker.visible = false;
    this.scene.add(this.hoverRing, this.enemyRing, this.moveMarker);
    this.resize();
  }

  // ------------------------------------------------------------ settings
  apply(s: Partial<ViewSettings>) {
    Object.assign(this.settings, s);
    const sh = this.settings.shadows;
    this.renderer.shadowMap.enabled = sh !== 'off';
    this.moon.castShadow = sh !== 'off';
    const size = sh === 'high' ? 2048 : 1024;
    if (this.moon.shadow.mapSize.x !== size) {
      this.moon.shadow.mapSize.set(size, size);
      this.moon.shadow.map?.dispose();
      this.moon.shadow.map = null;
    }
    this.particles.density = this.settings.particles;
    this.decals.style.stripes = this.settings.colorblind;
    this.resize();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, this.settings.pixelRatioCap) * this.resScale;
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.cvSize = { w, h };
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.particles.setViewport(h * dpr, this.camera.fov);
  }

  // ------------------------------------------------------------ zone build
  setGame(g: Game) {
    this.game = g;
    this.menu.mode = 'off';
    this.buildZone(g.zone);
    this.resetCamera();
  }

  showMenu(mode: 'title' | 'create', cls: 'cinder' | 'ranger' = 'cinder', look = 0) {
    this.menu = { mode, cls, look };
    this.game = null;
    if (mode === 'create') this.camTarget.set(24 - 2.1, 0.5, 23 + 2.1);
    else this.camTarget.set(24, 0, 18);
    if (!this.zoneRef || this.zoneRef.id !== 'refuge') this.buildZone(buildRefuge());
    for (const [id, a] of this.actors) {
      this.zoneGroup.remove(a.model.root);
      a.model.dispose();
      this.actors.delete(id);
    }
    if (this.playerView) {
      this.scene.remove(this.playerView.model.root);
      this.playerView = null;
    }
    this.clearDynamic();
  }

  private clearDynamic() {
    for (const [, o] of this.projViews) this.scene.remove(o);
    this.projViews.clear();
    for (const [, o] of this.pickupViews) this.scene.remove(o);
    this.pickupViews.clear();
    this.decals.clear();
  }

  private disposeZone() {
    this.zoneGroup.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && (o as THREE.InstancedMesh).isInstancedMesh) (o as THREE.InstancedMesh).dispose();
    });
    this.zoneGroup.clear();
    for (const l of this.lights) l.intensity = 0;
    this.floorTex?.dispose();
    this.occluders = [];
    this.occMeshes.clear();
    this.wallMesh = null;
    this.fireMeshes = [];
    for (const [, n] of this.npcViews) n.model.dispose();
    this.npcViews.clear();
    this.cageNpc?.dispose();
    this.cageNpc = null;
    this.trapViews = [];
  }

  buildZone(zone: Zone) {
    this.disposeZone();
    this.clearDynamic();
    for (const [id, a] of this.actors) {
      a.model.dispose();
      this.actors.delete(id);
    }
    this.zoneRef = zone;
    const sky = SKY[zone.theme];
    (this.scene.background as THREE.Color).setHex(sky);
    (this.scene.fog as THREE.Fog).color.setHex(sky);
    (this.scene.fog as THREE.Fog).near = zone.theme === 'crypt' ? 34 : 46;
    this.hemi.color.setHex(zone.theme === 'crypt' ? 0x5a7a90 : zone.theme === 'town' ? 0x8090b8 : 0x6c7fa8);
    this.hemi.intensity = zone.theme === 'crypt' ? 1.0 : 0.95;
    this.moon.color.setHex(zone.theme === 'crypt' ? 0x9fc0d8 : zone.theme === 'town' ? 0xc0c8ff : 0xaec2ff);
    // floor
    this.floorTex = makeFloorTexture(zone, this.renderer);
    const fg = new THREE.PlaneGeometry(zone.w, zone.h);
    fg.rotateX(-Math.PI / 2);
    const floor = new THREE.Mesh(fg, new THREE.MeshStandardMaterial({ map: this.floorTex, roughness: 0.95, metalness: 0 }));
    floor.position.set(zone.w / 2, 0, zone.h / 2);
    floor.receiveShadow = true;
    this.zoneGroup.add(floor);
    this.rebuildWalls(zone);
    // props
    const byType = new Map<string, typeof zone.props>();
    for (const p of zone.props) {
      if (!byType.has(p.type)) byType.set(p.type, []);
      byType.get(p.type)!.push(p);
    }
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const col = new THREE.Color();
    for (const [type, list] of byType) {
      const pg = propGeo(type as never);
      const mesh = new THREE.InstancedMesh(pg.lit, this.propMat, list.length);
      const gmesh = pg.glow ? new THREE.InstancedMesh(pg.glow, this.propGlowMat, list.length) : null;
      const flatDecal = type === 'pool' || type === 'rune' || type === 'dais' || type === 'bones';
      list.forEach((p, i) => {
        e.set(0, p.rot, 0);
        q.setFromEuler(e);
        const sc = p.s;
        m4.compose(new THREE.Vector3(p.x, 0, p.z), q, new THREE.Vector3(sc, sc, sc));
        mesh.setMatrixAt(i, m4);
        gmesh?.setMatrixAt(i, m4);
        col.setHex(p.tint ?? 0xffffff);
        if (p.tint !== undefined) col.lerp(new THREE.Color(0xffffff), 0.6);
        const v = 0.85 + hash2(p.x * 3, p.z * 3) * 0.3;
        col.multiplyScalar(v);
        mesh.setColorAt(i, col);
        if (p.tall) {
          const o = { mesh, idx: i, x: p.x, z: p.z, sy: 1, target: 1, cur: 1, m: m4.clone(), pos: new THREE.Vector3(p.x, 0, p.z), rot: q.clone(), sx: sc };
          this.occluders.push(o);
          if (gmesh) this.occluders.push({ ...o, mesh: gmesh });
        }
      });
      mesh.castShadow = !flatDecal;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      if (gmesh) {
        gmesh.frustumCulled = false;
        this.zoneGroup.add(gmesh);
        if (type === 'brazier' || type === 'campfire' || type === 'lamppost') this.fireMeshes.push({ mesh: gmesh, base: 1, ph: Math.random() * 6 });
      }
      this.zoneGroup.add(mesh);
      if (p0(list).tall) {
        this.occMeshes.add(mesh);
        if (gmesh) this.occMeshes.add(gmesh);
      }
    }
    this.zoneLights = zone.lights.map((l) => ({ ...l, flicker: !!l.flicker }));
    // traps
    for (const t of zone.traps) {
      const g = new THREE.Group();
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(t.r, t.r, 0.06, 12), new THREE.MeshStandardMaterial({ color: 0x4a4a4c, roughness: 0.6, metalness: 0.4 }));
      plate.position.y = 0.04;
      g.add(plate);
      const spikes = new THREE.Group();
      for (let i = 0; i < 7; i++) {
        const sp = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.7, 4), new THREE.MeshStandardMaterial({ color: 0xa0a0a4, metalness: 0.6, roughness: 0.4 }));
        sp.position.set(Math.cos(i * 0.9) * t.r * 0.55, 0.0, Math.sin(i * 0.9) * t.r * 0.55);
        spikes.add(sp);
      }
      spikes.position.y = -0.4;
      g.add(spikes);
      g.position.set(t.x, 0, t.z);
      g.userData.spikes = spikes;
      this.zoneGroup.add(g);
      this.trapViews.push(plate);
      (plate as unknown as { userData: Record<string, unknown> }).userData.group = g;
    }
    // NPCs
    for (const it of zone.interactables) {
      if (['captain', 'vendor', 'healer', 'artificer'].includes(it.kind)) {
        const model = buildNpc(it.kind);
        model.root.position.set(it.x, 0, it.z);
        this.zoneGroup.add(model.root);
        this.npcViews.set(it.id, { model, x: it.x, z: it.z });
      }
      if (it.kind === 'cage') {
        this.cageNpc = buildNpc('artificer');
        this.cageNpc.root.position.set(it.x, 0, it.z);
        this.zoneGroup.add(this.cageNpc.root);
      }
    }
    this.camTarget.set(zone.playerStart.x, 0, zone.playerStart.z);
  }

  private rebuildWalls(zone: Zone) {
    if (this.wallMesh) {
      this.zoneGroup.remove(this.wallMesh);
      this.wallMesh.dispose();
      this.occMeshes.delete(this.wallMesh);
      this.occluders = this.occluders.filter((o) => o.mesh !== this.wallMesh);
    }
    const w = zone.w;
    const cells = zone.grid.cells;
    const exposed: { x: number; z: number }[] = [];
    for (let z = 0; z < zone.h; z++)
      for (let x = 0; x < w; x++) {
        if (cells[z * w + x] !== WALL) continue;
        let ex = false;
        for (let dz = -1; dz <= 1 && !ex; dz++)
          for (let dx = -1; dx <= 1 && !ex; dx++) {
            const nx = x + dx;
            const nz = z + dz;
            if (nx < 0 || nz < 0 || nx >= w || nz >= zone.h) continue;
            if (cells[nz * w + nx] !== WALL) ex = true;
          }
        if (ex) exposed.push({ x, z });
      }
    const geo = new THREE.BoxGeometry(1, 1, 1);
    geo.translate(0, 0.5, 0);
    const mesh = new THREE.InstancedMesh(geo, this.wallMat, Math.max(1, exposed.length));
    const m4 = new THREE.Matrix4();
    const col = new THREE.Color();
    this.wallData = [];
    exposed.forEach((c, i) => {
      const edge = c.x <= 1 || c.z <= 1 || c.x >= w - 2 || c.z >= zone.h - 2;
      const hgt = (zone.theme === 'crypt' ? 3.4 : 2.6) + smoothNoise(c.x * 0.18, c.z * 0.18) * 1.5 + hash2(c.x, c.z) * 0.18 + (edge ? 0.5 : 0);
      m4.compose(new THREE.Vector3(c.x + 0.5, 0, c.z + 0.5), new THREE.Quaternion(), new THREE.Vector3(1.002, hgt, 1.002));
      mesh.setMatrixAt(i, m4);
      const v = 0.78 + hash2(c.x * 7, c.z * 5) * 0.4;
      col.setRGB(v, v * 0.98, v * 0.95);
      mesh.setColorAt(i, col);
      this.wallData.push({ x: c.x + 0.5, z: c.z + 0.5, h: hgt, scale: 1, target: 1 });
      this.occluders.push({ mesh, idx: i, x: c.x + 0.5, z: c.z + 0.5, sy: hgt, target: 1, cur: 1, m: m4.clone(), pos: new THREE.Vector3(c.x + 0.5, 0, c.z + 0.5), rot: new THREE.Quaternion(), sx: 1.002 });
    });
    mesh.count = exposed.length;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    this.zoneGroup.add(mesh);
    this.wallMesh = mesh;
    this.occMeshes.add(mesh);
    this.wallSig = this.doorSig(zone);
  }

  private doorSig(zone: Zone): string {
    let s = '';
    for (const it of zone.interactables) if (it.cells) s += it.state.open ? '1' : '0';
    return s;
  }

  // ------------------------------------------------------------ camera
  resetCamera() {
    if (!this.game) return;
    const p = this.game.player;
    this.camTarget.set(p.x, 0, p.z);
    this.zoom = this.zoomTarget;
  }
  setZoom(delta: number) {
    const boss = this.game?.boss?.boss_state?.engaged;
    const min = boss ? 16 : 13;
    this.zoomTarget = Math.max(min, Math.min(24, this.zoomTarget + delta));
  }
  addShake(src: 'hit' | 'boss' | 'env', amt: number) {
    if (this.settings.reducedMotion) return;
    this.shakeAmt[src] = Math.min(0.5, Math.max(this.shakeAmt[src], amt * this.settings.shake));
  }

  private updateCamera(dt: number) {
    const g = this.game;
    const target = this.tmpV;
    if (g) {
      const p = g.player;
      const ax = p.px + (p.x - p.px) * this.interpAlpha;
      const az = p.pz + (p.z - p.pz) * this.interpAlpha;
      // movement anticipation up to 1.2 units
      const spd = Math.hypot(p.vx, p.vz);
      const ant = Math.min(1.2, spd * 0.25);
      const dir = spd > 0.1 ? new THREE.Vector2(p.vx / spd, p.vz / spd) : new THREE.Vector2(0, 0);
      target.set(ax + dir.x * ant, 0, az + dir.y * ant);
      const boss = g.boss;
      if (boss && boss.boss_state?.engaged && g.zone.bossArena) {
        const a = g.zone.bossArena;
        target.x += (a.x - target.x) * 0.32;
        target.z += (a.z - target.z) * 0.32;
        if (this.zoomTarget < 16) this.zoomTarget = 16;
      }
    } else {
      this.orbit += dt * 0.08;
      if (this.menu.mode === 'create') target.set(24 - 2.1, 0.5, 23 + 2.1);
      else target.set(24 + Math.cos(this.orbit) * 3, 0, 18 + Math.sin(this.orbit * 0.8) * 2);
    }
    // soft lag (~70ms) with a per-frame snap limit of 0.4 units
    const k = 1 - Math.exp(-dt / 0.07);
    const dx = (target.x - this.camTarget.x) * k;
    const dz = (target.z - this.camTarget.z) * k;
    const len = Math.hypot(dx, dz);
    const lim = 0.4;
    const sc = len > lim ? lim / len : 1;
    this.camTarget.x += dx * sc;
    this.camTarget.z += dz * sc;
    // zoom easing ~120ms
    this.zoom += (this.zoomTarget - this.zoom) * (1 - Math.exp(-dt / 0.06));
    let dist = this.zoom;
    let pitch = PITCH;
    let yaw = YAW;
    if (!this.game) {
      if (this.menu.mode === 'create') {
        dist = 9.5;
        pitch = (22 * Math.PI) / 180;
        yaw = YAW + Math.sin(this.orbit * 2) * 0.25;
      } else {
        dist = 24;
        pitch = (32 * Math.PI) / 180;
        yaw = YAW + this.orbit * 0.5;
      }
    }
    const hd = dist * Math.cos(pitch);
    this.camPos.set(this.camTarget.x + Math.sin(yaw) * hd, dist * Math.sin(pitch), this.camTarget.z + Math.cos(yaw) * hd);
    this.camLook.copy(this.camTarget);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
    this.camera.updateMatrixWorld(true);
    // shake is applied after storing the unshaken camera so pointer rays are unaffected
    const sh = this.shakeAmt;
    for (const k2 of ['hit', 'boss', 'env'] as const) sh[k2] = Math.max(0, sh[k2] - dt * 1.8);
    const total = Math.min(0.5, sh.hit + sh.boss + sh.env);
    this.unshaken = this.camera.matrixWorld.clone();
    this.unshakenInv = this.camera.matrixWorldInverse.clone();
    this.unshakenProj = this.camera.projectionMatrix.clone();
    if (total > 0.002 && !this.settings.reducedMotion) {
      this.shakeOff.set((Math.random() - 0.5) * total, (Math.random() - 0.5) * total * 0.6, (Math.random() - 0.5) * total);
      this.camera.position.add(this.shakeOff);
      this.camera.updateMatrixWorld(true);
    }
  }
  private pickCam = new THREE.PerspectiveCamera();
  private unshaken = new THREE.Matrix4();
  private unshakenInv = new THREE.Matrix4();
  private unshakenProj = new THREE.Matrix4();

  // ------------------------------------------------------------ picking / projection
  /** Projects a world point to CSS pixel coordinates using the (unshaken) camera. */
  project(x: number, y: number, z: number, out = { x: 0, y: 0, vis: true }): { x: number; y: number; vis: boolean } {
    const v = this.tmpV.set(x, y, z).applyMatrix4(this.unshakenInv).applyMatrix4(this.unshakenProj);
    out.x = (v.x * 0.5 + 0.5) * this.cvSize.w;
    out.y = (-v.y * 0.5 + 0.5) * this.cvSize.h;
    out.vis = v.z < 1 && v.z > -1;
    return out;
  }

  groundAt(clientX: number, clientY: number): { x: number; z: number } {
    const r = this.canvas.getBoundingClientRect();
    const nx = ((clientX - r.left) / r.width) * 2 - 1;
    const ny = -((clientY - r.top) / r.height) * 2 + 1;
    const cam = this.pickCam;
    cam.matrixWorld.copy(this.unshaken);
    cam.matrixWorldInverse.copy(this.unshakenInv);
    cam.projectionMatrix.copy(this.unshakenProj);
    cam.projectionMatrixInverse.copy(this.unshakenProj).invert();
    this.raycaster.setFromCamera(new THREE.Vector2(nx, ny), cam);
    const hit = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(this.plane, hit)) return { x: hit.x, z: hit.z };
    return { x: this.camTarget.x, z: this.camTarget.z };
  }

  pick(clientX: number, clientY: number): PickResult {
    const g = this.game;
    const rect = this.canvas.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    const gp = this.groundAt(clientX, clientY);
    const res: PickResult = { gx: gp.x, gz: gp.z };
    if (!g) return res;
    const pt = { x: 0, y: 0, vis: true };
    const pt2 = { x: 0, y: 0, vis: true };
    let best = 1e9;
    for (const e of g.enemies) {
      if (!e.alive) continue;
      const av = this.actors.get(e.id);
      const h = (av?.model.height ?? 1.5) * e.def.scale * (e.elite ? 1.18 : 1);
      this.project(e.x, 0.1, e.z, pt);
      this.project(e.x, h, e.z, pt2);
      // distance from pointer to the foot-head segment
      const sx = pt2.x - pt.x;
      const sy = pt2.y - pt.y;
      const l2 = sx * sx + sy * sy || 1;
      const t = Math.max(0, Math.min(1, ((mx - pt.x) * sx + (my - pt.y) * sy) / l2));
      const px = pt.x + sx * t;
      const py = pt.y + sy * t;
      const d = Math.hypot(mx - px, my - py);
      const pxScale = Math.abs(sy) / Math.max(0.5, h);
      const rad = Math.max(16, e.r * pxScale * 1.1 + 10);
      const score = d / rad;
      if (score < 1 && score < best) {
        // prefer real threats over neutral props
        const bias = e.neutral ? 0.35 : 0;
        if (score + bias < best) {
          best = score + bias;
          res.enemy = e.id;
        }
      }
    }
    // interactables
    let bi = 1e9;
    for (const it of g.zone.interactables) {
      if (it.hidden) continue;
      this.project(it.x, 1.0, it.z, pt);
      const d = Math.hypot(mx - pt.x, my - pt.y);
      const near = Math.hypot(gp.x - it.x, gp.z - it.z) < it.r + 0.6;
      if ((d < 46 || near) && d < bi) {
        bi = d;
        res.interact = it.id;
      }
    }
    return res;
  }

  setHover(h: { kind: 'enemy' | 'interact' | 'pickup' | null; id?: number | string }) {
    this.hoverKind = h.kind;
    this.hoverId = h.id;
  }
  private hoverKind: 'enemy' | 'interact' | 'pickup' | null = null;
  private hoverId: number | string | undefined;
  showMoveMarker(x: number, z: number) {
    this.moveMarker.position.set(x, 0.08, z);
    this.moveMarker.visible = true;
    this.moveMarkerT = 0.5;
    (this.moveMarker.material as THREE.MeshBasicMaterial).color.setHex(0xffe08a);
  }
  showInvalidMarker(x: number, z: number) {
    this.moveMarker.position.set(x, 0.08, z);
    this.moveMarker.visible = true;
    this.moveMarkerT = 0.6;
    (this.moveMarker.material as THREE.MeshBasicMaterial).color.setHex(0xff4a3a);
  }

  // ------------------------------------------------------------ events -> VFX
  handleEvents(events: GameEvent[]) {
    const g = this.game;
    if (!g) return;
    const P = this.particles;
    for (const ev of events) {
      switch (ev.t) {
        case 'zone': {
          this.buildZone(g.zone);
          this.resetCamera();
          break;
        }
        case 'hit': {
          const col = { phys: 0xfff0d8, ember: 0xff8a40, frost: 0xbfe4ff, blight: 0xc58aff }[ev.dtype];
          if (ev.onPlayer) {
            P.burst(ev.x, ev.z, { count: 10, color: 0xff3a2a, color2: 0xff9a60, speed: 3, up: 2.5, life: 0.5, size: 0.28, y: 1.2 });
            if (ev.amount > 1) this.addShake('hit', Math.min(0.4, 0.1 + ev.amount / (g.player.maxHp * 2.2)));
          } else {
            P.burst(ev.x, ev.z, { count: ev.crit ? 18 : ev.blocked ? 6 : 9, color: ev.blocked ? 0xcfd8e0 : col, color2: 0xffffff, speed: ev.crit ? 5 : 3.5, up: 3, life: 0.4, size: ev.crit ? 0.4 : 0.26, y: 1.0 });
            if (ev.crit) this.addShake('hit', 0.1);
          }
          break;
        }
        case 'die': {
          const def = g.enemies.find((e) => e.id === ev.enemy)?.def;
          const c = def?.accent ?? 0xffffff;
          P.burst(ev.x, ev.z, { count: ev.boss ? 70 : ev.elite ? 34 : 16, color: 0x2a2624, color2: c, speed: ev.boss ? 7 : 3.5, up: 4, life: 0.9, size: ev.boss ? 0.8 : 0.4, y: 0.8, gravity: 4 });
          if (ev.boss) this.addShake('boss', 0.45);
          break;
        }
        case 'swing': {
          const sk = ev.skill;
          if (sk === 'iron_litany' || sk === 'brand_arc') {
            const hot = sk === 'brand_arc';
            P.burst(ev.x + Math.cos(ev.dir) * 1.6, ev.z + Math.sin(ev.dir) * 1.6, { count: hot ? 34 : 14, color: hot ? 0xff7a30 : 0xffe9c0, color2: hot ? 0xffd070 : 0xffffff, speed: hot ? 7 : 5, up: 0.5, life: hot ? 0.5 : 0.28, size: hot ? 0.55 : 0.32, y: 1.0, dir: ev.dir, cone: hot ? 1.3 : 1.0, drag: 3.2, gravity: 1 });
            if (hot) this.flashAt(ev.x + Math.cos(ev.dir) * 2, ev.z + Math.sin(ev.dir) * 2, 0xff8a40, 3.2);
          } else if (sk === 'splinter_volley') {
            P.burst(ev.x + Math.cos(ev.dir), ev.z + Math.sin(ev.dir), { count: 16, color: 0xe8e0c8, color2: 0x9fd4ff, speed: 9, up: 0.3, life: 0.25, size: 0.3, y: 1.0, dir: ev.dir, cone: 0.5, drag: 2, gravity: 0 });
          } else if (sk === 'quickshot' || sk === 'ghostline') {
            P.burst(ev.x + Math.cos(ev.dir) * 0.8, ev.z + Math.sin(ev.dir) * 0.8, { count: 5, color: sk === 'ghostline' ? 0x9fd4ff : 0xffe9c0, speed: 3, up: 0.2, life: 0.2, size: 0.24, y: 1.1, dir: ev.dir, cone: 0.4, gravity: 0 });
          }
          break;
        }
        case 'fx':
          this.fx(ev);
          break;
        case 'levelup':
          for (let i = 0; i < 60; i++) {
            const a = Math.random() * 6.28;
            P.emit(g.player.x + Math.cos(a) * 0.5, 0.2, g.player.z + Math.sin(a) * 0.5, Math.cos(a) * 1.2, 5 + Math.random() * 4, Math.sin(a) * 1.2, 1.2, 0.5, 0xffd56a, 4, 0.4);
          }
          this.flashAt(g.player.x, g.player.z, 0xffd56a, 4, 0.5);
          break;
        case 'shake':
          this.addShake(ev.amount > 0.4 ? 'boss' : 'env', ev.amount);
          break;
        case 'cast':
          if (ev.skill === 'cinder_ring') P.burst(ev.x, ev.z, { count: 20, color: 0xffd56a, speed: 3, up: 4, life: 0.65, size: 0.4, y: 0.2, radius: 3, spread: 0.3 });
          break;
        default:
          break;
      }
    }
  }

  private flashAt(x: number, z: number, color: number, intensity: number, dur = 0.18) {
    this.flash.color.setHex(color);
    this.flash.position.set(x, 1.6, z);
    this.flash.intensity = intensity * 2.4;
    this.flashDecay = intensity * 2.4 / dur;
  }
  private flashDecay = 0;

  private fx(ev: Extract<GameEvent, { t: 'fx' }>) {
    const P = this.particles;
    const c = ev.color ?? 0xffffff;
    switch (ev.id) {
      case 'hazardPop':
      case 'poolBurst': {
        const r = ev.r ?? 2;
        for (let i = 0; i < Math.min(40, 12 + r * 5); i++) {
          const a = Math.random() * 6.28;
          const rr = Math.sqrt(Math.random()) * r;
          P.emit(ev.x + Math.cos(a) * rr, 0.2, ev.z + Math.sin(a) * rr, Math.cos(a) * 1.2, 2 + Math.random() * 3, Math.sin(a) * 1.2, 0.7, 0.45, c, 3, 0.8);
        }
        this.flashAt(ev.x, ev.z, c, 2.4);
        break;
      }
      case 'ringBurst': {
        const r = ev.r ?? 4;
        for (let i = 0; i < 70; i++) {
          const a = (i / 70) * 6.28;
          P.emit(ev.x, 0.4, ev.z, Math.cos(a) * r * 2.4, 2.5, Math.sin(a) * r * 2.4, 0.5, 0.55, i % 2 ? 0xffd070 : c, 2, 3.2);
        }
        this.flashAt(ev.x, ev.z, c, 4, 0.3);
        break;
      }
      case 'frostPulse': {
        const r = ev.r ?? 4;
        for (let i = 0; i < 44; i++) {
          const a = (i / 44) * 6.28;
          P.emit(ev.x, 0.5, ev.z, Math.cos(a) * r * 2.2, 1, Math.sin(a) * r * 2.2, 0.5, 0.45, c, 1, 3);
        }
        break;
      }
      case 'rush':
        P.burst(ev.x, ev.z, { count: 26, color: 0xffd56a, color2: 0xffffff, speed: 6, up: 1, life: 0.4, size: 0.4, y: 0.8, dir: (ev.dir ?? 0) + Math.PI, cone: 0.7 });
        break;
      case 'evade':
        P.burst(ev.x, ev.z, { count: 16, color: 0x5ee0d0, color2: 0xffffff, speed: 3, up: 0.8, life: 0.35, size: 0.3, y: 0.6, dir: (ev.dir ?? 0) + Math.PI, cone: 0.9 });
        break;
      case 'stance':
        P.burst(ev.x, ev.z, { count: 40, color: 0xff6a2a, color2: 0xffd070, speed: 2, up: 5, life: 0.8, size: 0.5, y: 0.2, radius: 0.8, gravity: -2 });
        this.flashAt(ev.x, ev.z, 0xff7a30, 3, 0.3);
        break;
      case 'standard':
        P.burst(ev.x, ev.z, { count: 40, color: 0xffd56a, color2: 0xffffff, speed: 4, up: 3, life: 0.7, size: 0.4, y: 0.2, radius: ev.r ?? 4 });
        break;
      case 'trapPlace':
        P.burst(ev.x, ev.z, { count: 14, color: 0xa855f7, speed: 2, up: 2, life: 0.5, size: 0.3, y: 0.2, radius: 1 });
        break;
      case 'trapSnap':
        P.burst(ev.x, ev.z, { count: 36, color: 0xa855f7, color2: 0xe0b0ff, speed: 5, up: 4, life: 0.6, size: 0.45, y: 0.3, radius: 1 });
        this.flashAt(ev.x, ev.z, 0xa855f7, 3);
        break;
      case 'cloak':
      case 'flask':
        P.burst(ev.x, ev.z, { count: 30, color: c, speed: 3, up: 3, life: 0.7, size: 0.4, y: 0.6, radius: 1 });
        break;
      case 'barrage':
        break;
      case 'arrowHit':
        P.burst(ev.x, ev.z, { count: 5, color: c, speed: 2.2, up: 1.5, life: 0.25, size: 0.2, y: 1.0 });
        break;
      case 'markBurst':
        P.burst(ev.x, ev.z, { count: 30, color: 0x9fd4ff, color2: 0xffffff, speed: 5, up: 3, life: 0.5, size: 0.4, y: 1.0 });
        this.flashAt(ev.x, ev.z, 0x9fd4ff, 3);
        break;
      case 'armorBreak':
        P.burst(ev.x, ev.z, { count: 60, color: 0xffd060, color2: 0xff7a30, speed: 8, up: 5, life: 0.9, size: 0.6, y: 1.5 });
        this.flashAt(ev.x, ev.z, 0xffd060, 5, 0.4);
        break;
      case 'urnBreak':
        P.burst(ev.x, ev.z, { count: 16, color: 0x8a7a60, color2: 0xc9a468, speed: 3.5, up: 4, life: 0.8, size: 0.32, y: 0.6, gravity: 9 });
        break;
      case 'waypoint':
        for (let i = 0; i < 70; i++) {
          const a = Math.random() * 6.28;
          P.emit(ev.x + Math.cos(a) * 1.2, 0.1, ev.z + Math.sin(a) * 1.2, 0, 3 + Math.random() * 6, 0, 1.4, 0.5, c, -1, 0.2);
        }
        this.flashAt(ev.x, ev.z, c, 5, 0.6);
        break;
      case 'taunt':
        P.burst(ev.x, ev.z, { count: 24, color: 0xffd56a, speed: 6, up: 0.6, life: 0.5, size: 0.3, y: 0.4, radius: 1 });
        break;
    }
  }

  // ------------------------------------------------------------ frame update
  update(dt: number, alpha: number, ticksThisFrame: number) {
    this.time += dt;
    this.interpAlpha = alpha;
    if (this.needResize) {
      this.needResize = false;
      this.resize();
    }
    const t0 = performance.now();
    this.updateCamera(dt);
    const g = this.game;
    if (g && g.zone !== this.zoneRef) {
      this.buildZone(g.zone);
      this.resetCamera();
    }
    if (g) {
      this.syncActors(g, dt, alpha);
      this.syncProjectiles(g, dt, alpha);
      this.syncPickups(g, dt);
      this.syncStandards(g);
      this.decals.update(g.hazards, this.time);
      this.updateTraps(g);
      this.updateInteractables(g, dt);
      if (this.wallMesh && this.zoneRef) {
        const sig = this.doorSig(this.zoneRef);
        if (sig !== this.wallSig) this.rebuildWalls(this.zoneRef);
      }
    } else {
      this.updateMenuStage(dt);
    }
    this.updateOcclusion(dt);
    this.updateLights(dt);
    this.updateHover(g);
    this.updateAmbient(dt);
    this.particles.update(dt);
    // moon follows player/target for shadows
    this.moon.position.set(this.camTarget.x - 22, 38, this.camTarget.z - 14);
    this.moon.target.position.set(this.camTarget.x, 0, this.camTarget.z);
    this.moon.target.updateMatrixWorld();
    this.renderer.render(this.scene, this.camera);
    void ticksThisFrame;
    // dynamic resolution
    const ms = performance.now() - t0 + 0;
    this.frameMs = this.frameMs * 0.95 + Math.max(ms, dt * 1000 * 0.5) * 0.05;
    if (this.settings.dynamicRes && this.time - this.lastResAdj > 1.5) {
      const frame = dt * 1000;
      if (frame > 24 && this.resScale > 0.6) {
        this.resScale -= 0.1;
        this.lastResAdj = this.time;
        this.needResize = true;
      } else if (frame < 14 && this.resScale < 1) {
        this.resScale = Math.min(1, this.resScale + 0.05);
        this.lastResAdj = this.time;
        this.needResize = true;
      }
    }
  }

  private ctxFor(e: { vx: number; vz: number }, maxSpeed: number, view: ActorView, dt: number): { speed: number } {
    const sp = Math.hypot(e.vx, e.vz);
    const s = Math.min(1, sp / Math.max(0.5, maxSpeed));
    view.phase += dt * (3 + sp * 2.2);
    return { speed: s };
  }

  private syncActors(g: Game, dt: number, alpha: number) {
    const seen = new Set<number>();
    const pl = g.player;
    const camX = this.camTarget.x;
    const camZ = this.camTarget.z;
    // enemies
    for (const e of g.enemies) {
      seen.add(e.id);
      let v = this.actors.get(e.id);
      if (!v) {
        const model = buildEnemy(e.type, e.elite);
        this.zoneGroup.add(model.root);
        v = { model, phase: Math.random() * 6, fade: 1, lastX: e.x, lastZ: e.z, isElite: e.elite };
        if (e.elite) {
          const rg = new THREE.RingGeometry(0.9, 1.15, 32);
          rg.rotateX(-Math.PI / 2);
          const mod = ELITE_MODS.find((m) => m.id === e.mods[0]);
          v.eliteRing = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: mod?.color ?? 0xffd060, transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false }));
          v.eliteRing.position.y = 0.07;
          v.eliteRing.scale.setScalar(e.def.scale * 1.5);
          model.root.add(v.eliteRing);
        }
        this.actors.set(e.id, v);
      }
      const x = e.px + (e.x - e.px) * alpha;
      const z = e.pz + (e.z - e.pz) * alpha;
      const dist = Math.hypot(x - camX, z - camZ);
      const vis = dist < 46;
      v.model.root.visible = vis;
      if (!vis) continue;
      const wantShadow = this.settings.shadows !== 'off' && dist < 24;
      if (v.shadows !== wantShadow) {
        v.shadows = wantShadow;
        v.model.root.traverse((o) => {
          if ((o as THREE.Mesh).isMesh) o.castShadow = wantShadow;
        });
      }
      v.model.root.position.set(x, 0, z);
      v.model.root.rotation.y = Math.PI / 2 - e.facing;
      const sp = this.ctxFor(e, Math.max(0.5, e.def.speed || 1), v, dt);
      let atk = -1;
      if (e.atk) atk = e.atk.t <= e.atk.windup ? e.atk.t / Math.max(0.01, e.atk.windup) : 1 + (e.atk.t - e.atk.windup) / 0.25;
      const deadK = e.alive ? 0 : Math.min(1, 1 - e.fadeT / 2.6);
      const bs = e.boss_state;
      const ctx: AnimCtx = {
        dt, time: this.time + e.id, speed: e.alive ? sp.speed : 0, phase: v.phase, atk: e.alive ? atk : -1, cast: -1, castKind: '', flash: e.hitFlash, dead: deadK, heat: 0,
        boss: bs ? { phase: bs.phase, invuln: bs.invuln, broken: bs.broken > 0, pattern: bs.pattern ?? '', armor: bs.armor } : null, moveDir: 0,
      };
      v.model.update(ctx);
      // fade corpses
      if (!e.alive) {
        const o = Math.max(0, Math.min(1, e.fadeT / 1.2));
        v.model.root.traverse((c) => {
          const m = c as THREE.Mesh;
          if (m.isMesh) {
            const mat = m.material as THREE.Material;
            mat.transparent = true;
            mat.opacity = o;
          }
        });
        if (v.eliteRing) v.eliteRing.visible = false;
      } else {
        // slowed tint via emissive handled by flash; marks and wards as floating indicators
        const mk = getEffect(e, 'mark');
        if (mk && !v.markMesh) {
          v.markMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), new THREE.MeshBasicMaterial({ color: 0x9fd4ff, toneMapped: false }));
          v.model.root.add(v.markMesh);
        }
        if (v.markMesh) {
          v.markMesh.visible = !!mk;
          if (mk) {
            v.markMesh.position.set(0, (v.model.height + 0.55) / (e.def.scale * (e.elite ? 1.18 : 1)) * 1, 0);
            v.markMesh.rotation.y = this.time * 3;
            v.markMesh.scale.setScalar(0.8 + mk.mag * 0.3);
          }
        }
        const ward = hasEffect(e, 'ward');
        if (ward && !v.wardMesh) {
          v.wardMesh = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 8), new THREE.MeshBasicMaterial({ color: 0xb36bff, transparent: true, opacity: 0.18, depthWrite: false, toneMapped: false }));
          v.wardMesh.position.y = 0.9;
          v.model.root.add(v.wardMesh);
        }
        if (v.wardMesh) v.wardMesh.visible = ward;
        if (hasEffect(e, 'burn') && Math.random() < 0.35) this.particles.emit(x + (Math.random() - 0.5) * 0.5, 0.8 + Math.random() * 0.8, z + (Math.random() - 0.5) * 0.5, 0, 1.5, 0, 0.5, 0.3, 0xff7a30, -1, 0.2);
        if (v.eliteRing) {
          v.eliteRing.rotation.y = this.time * 0.8;
          (v.eliteRing.material as THREE.MeshBasicMaterial).opacity = 0.6 + 0.3 * Math.sin(this.time * 3);
        }
        // telegraph glow flicker for attack windup
        if (e.atk && e.atk.t < e.atk.windup && Math.random() < 0.5) this.particles.emit(x + (Math.random() - 0.5), 0.7 + Math.random(), z + (Math.random() - 0.5), 0, 1, 0, 0.3, 0.24, 0xff7a40, 0, 1);
      }
      v.lastX = x;
      v.lastZ = z;
    }
    for (const [id, v] of this.actors) {
      if (!seen.has(id)) {
        this.zoneGroup.remove(v.model.root);
        v.model.dispose();
        this.actors.delete(id);
      }
    }
    // player
    const key = `${g.ch.cls}${g.ch.look.body}`;
    if (!this.playerView || this.playerKey !== key) {
      if (this.playerView) {
        this.scene.remove(this.playerView.model.root);
        this.playerView.model.dispose();
      }
      const model = buildPlayer(g.ch.cls, g.ch.look.body);
      const accents = [0xffb347, 0x5ee0d0, 0xd8dde4];
      model.tintAccent?.(accents[g.ch.look.body % 3]);
      this.scene.add(model.root);
      this.playerView = { model, phase: 0, fade: 1, lastX: 0, lastZ: 0, isElite: false };
      this.playerKey = key;
    }
    const pv = this.playerView;
    const wb = g.ch.equip.weapon ? BASE_BY_ID[g.ch.equip.weapon.base] : null;
    pv.model.setLoadout?.(wb?.weaponType ?? 'mace', !!g.ch.equip.offhand);
    const px = pl.px + (pl.x - pl.px) * alpha;
    const pz = pl.pz + (pl.z - pl.pz) * alpha;
    pv.model.root.position.set(px, 0, pz);
    pv.model.root.rotation.y = Math.PI / 2 - pl.facing;
    const sp = this.ctxFor(pl, pl.speed, pv, dt);
    let atk = -1;
    let cast = -1;
    let castKind = '';
    if (pl.cast) {
      const c = pl.cast;
      const wp = Math.min(1, c.t / Math.max(0.01, c.wind));
      cast = c.t < c.wind ? wp : 1 + Math.min(1, (c.t - c.wind) / 0.25);
      castKind = g.ch.cls === 'ranger' ? 'bow' : '';
      if (g.ch.cls === 'cinder') atk = cast;
      else atk = -1;
    }
    const dashing = !!pl.dash;
    const ctx: AnimCtx = { dt, time: this.time, speed: dashing ? 1 : sp.speed, phase: pv.phase, atk: g.ch.cls === 'cinder' ? atk : -1, cast: g.ch.cls === 'ranger' ? (cast >= 0 ? Math.min(1, cast) : -1) : -1, castKind, flash: pl.hitFlash, dead: pl.dead ? Math.min(1, pl.reviveT * 1.4) : 0, heat: g.ch.cls === 'cinder' ? pl.heat / 100 : 0, boss: null, moveDir: 0 };
    pv.model.update(ctx);
    const cloaked = hasEffect(pl, 'cloak');
    pv.model.root.traverse((c) => {
      const m = c as THREE.Mesh;
      if (m.isMesh) {
        const mat = m.material as THREE.Material;
        mat.transparent = cloaked;
        mat.opacity = cloaked ? 0.32 : 1;
      }
    });
    if (dashing && Math.random() < 0.8) this.particles.emit(px, 0.5 + Math.random() * 0.8, pz, 0, 0.5, 0, 0.35, 0.3, g.ch.cls === 'ranger' ? 0x5ee0d0 : 0xffd56a, 0, 1);
    if (hasEffect(pl, 'furnace') && Math.random() < 0.6) this.particles.emit(px + (Math.random() - 0.5) * 0.8, 1 + Math.random() * 0.8, pz + (Math.random() - 0.5) * 0.8, 0, 2.2, 0, 0.6, 0.35, 0xff7a30, -1, 0.3);
    if (hasEffect(pl, 'guard') && Math.random() < 0.3) this.particles.emit(px + (Math.random() - 0.5) * 1.2, 0.6 + Math.random() * 1.2, pz + (Math.random() - 0.5) * 1.2, 0, 0.6, 0, 0.5, 0.25, 0xffd56a, 0, 1);
    if (pl.channel) {
      const k = pl.channel.t / pl.channel.dur;
      for (let i = 0; i < 2; i++) {
        const a = Math.random() * 6.28;
        this.particles.emit(px + Math.cos(a) * (1.4 - k), 0.1, pz + Math.sin(a) * (1.4 - k), 0, 3 + k * 3, 0, 0.6, 0.35, 0x7ab8ff, -1, 0.5);
      }
    }
    void seen;
  }

  private projGeos = new Map<string, THREE.BufferGeometry>();
  private projGeo(kind: string): THREE.BufferGeometry {
    let g = this.projGeos.get(kind);
    if (!g) {
      switch (kind) {
        case 'arrow':
          g = new THREE.CylinderGeometry(0.025, 0.025, 0.9, 5);
          g.rotateZ(Math.PI / 2);
          break;
        case 'ghost':
          g = new THREE.CylinderGeometry(0.06, 0.06, 1.6, 6);
          g.rotateZ(Math.PI / 2);
          break;
        case 'wave':
          g = new THREE.TorusGeometry(0.7, 0.08, 4, 14, Math.PI);
          g.rotateY(Math.PI / 2);
          g.rotateX(-Math.PI / 2);
          break;
        default:
          g = new THREE.SphereGeometry(0.2, 8, 6);
      }
      this.projGeos.set(kind, g);
    }
    return g;
  }

  private syncProjectiles(g: Game, dt: number, alpha: number) {
    const seen = new Set<number>();
    for (const p of g.projectiles) {
      if (p.dead || p.special === 'visual') {
        // visual arrows: just particles
        if (p.special === 'visual' && !p.dead) this.particles.emit(p.x, 1, p.z, 0, 0, 0, 0.25, 0.22, 0xe8e0c8, 0, 3);
        continue;
      }
      seen.add(p.id);
      let o = this.projViews.get(p.id);
      if (!o) {
        const mat = new THREE.MeshBasicMaterial({ color: p.color, toneMapped: false });
        o = new THREE.Mesh(this.projGeo(p.kind), mat);
        this.scene.add(o);
        this.projViews.set(p.id, o);
      }
      o.position.set(p.x - p.vx * dt * (1 - alpha), 1.0, p.z - p.vz * dt * (1 - alpha));
      o.rotation.y = -Math.atan2(p.vz, p.vx);
      this.particles.emit(p.x, 1.0, p.z, (Math.random() - 0.5) * 0.6, 0.2, (Math.random() - 0.5) * 0.6, p.kind === 'ghost' ? 0.5 : 0.28, p.kind === 'wave' ? 0.5 : 0.28, p.color, 0, 2);
    }
    for (const [id, o] of this.projViews) {
      if (!seen.has(id)) {
        this.scene.remove(o);
        this.projViews.delete(id);
      }
    }
  }

  private pickupMesh(k: Pickup): THREE.Object3D {
    const grp = new THREE.Group();
    const add = (geo: THREE.BufferGeometry, color: number, glow = true, y = 0.5) => {
      const m = glow ? new THREE.MeshBasicMaterial({ color, toneMapped: false }) : new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.4 });
      const mesh = new THREE.Mesh(geo, m);
      mesh.position.y = y;
      grp.add(mesh);
      return mesh;
    };
    switch (k.kind) {
      case 'gold':
        add(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 10), 0xffcc40, false, 0.15);
        add(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 10), 0xe0aa30, false, 0.2).position.x = 0.12;
        break;
      case 'dust':
        add(new THREE.OctahedronGeometry(0.16), 0x7ae8ff, true, 0.45);
        break;
      case 'potion': {
        const col = { health: 0xe0505a, focus: 0x4a8cff, cleanse: 0xf0f4f6, tonic: 0xe8b84a }[k.potion ?? 'health'];
        add(new THREE.CylinderGeometry(0.08, 0.12, 0.28, 8), col, true, 0.3);
        add(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 6), 0x8a8a8a, false, 0.52);
        break;
      }
      case 'echo': {
        const w = add(new THREE.ConeGeometry(0.4, 1.8, 8), 0x9fd4ff, true, 1.0);
        (w.material as THREE.MeshBasicMaterial).transparent = true;
        (w.material as THREE.MeshBasicMaterial).opacity = 0.45;
        (w.material as THREE.MeshBasicMaterial).blending = THREE.AdditiveBlending;
        add(new THREE.SphereGeometry(0.22, 8, 6), 0xffffff, true, 1.0);
        break;
      }
      case 'item': {
        const r = k.item!.rarity;
        const col = RARITY_COL[r];
        const group = BASE_BY_ID[k.item!.base].group;
        const geo = r === 'relic' ? new THREE.ConeGeometry(0.2, 0.7, 5) : r === 'inscribed' ? new THREE.IcosahedronGeometry(0.26) : r === 'tempered' ? new THREE.OctahedronGeometry(0.26) : group === 'glyph' ? new THREE.TetrahedronGeometry(0.22) : new THREE.BoxGeometry(0.34, 0.34, 0.34);
        add(geo, col, true, 0.55);
        if (r === 'inscribed' || r === 'relic') {
          const beam = add(new THREE.CylinderGeometry(0.05, 0.28, 3.2, 8, 1, true), col, true, 1.6);
          const bm = beam.material as THREE.MeshBasicMaterial;
          bm.transparent = true;
          bm.opacity = 0.35;
          bm.blending = THREE.AdditiveBlending;
          bm.depthWrite = false;
          bm.side = THREE.DoubleSide;
        }
        if (group === 'glyph') add(new THREE.TorusGeometry(0.22, 0.03, 4, 12), 0xffffff, true, 0.55);
        break;
      }
      default:
        break;
    }
    return grp;
  }

  private syncPickups(g: Game, dt: number) {
    const seen = new Set<number>();
    for (const k of g.pickups) {
      if (k.dead) continue;
      seen.add(k.id);
      let o = this.pickupViews.get(k.id);
      if (!o) {
        o = this.pickupMesh(k);
        this.scene.add(o);
        this.pickupViews.set(k.id, o);
        // drop pop
        if (k.kind === 'item') this.particles.burst(k.x, k.z, { count: 8, color: RARITY_COL[k.item!.rarity], speed: 2, up: 3, life: 0.5, size: 0.3, y: 0.3 });
      }
      const pop = Math.min(1, k.age * 3);
      const bounce = Math.abs(Math.sin(Math.min(k.age, 1) * 3 * Math.PI)) * (1 - Math.min(1, k.age)) * 1.2;
      o.position.set(k.x, bounce + (k.kind === 'item' ? Math.sin(this.time * 2 + k.id) * 0.06 : 0), k.z);
      o.rotation.y = this.time * 1.4 + k.id;
      o.scale.setScalar(0.4 + 0.6 * pop);
      if (k.kind === 'echo' && Math.random() < 0.5) this.particles.emit(k.x + (Math.random() - 0.5) * 0.6, 0.3, k.z + (Math.random() - 0.5) * 0.6, 0, 2, 0, 1, 0.3, 0x9fd4ff, -0.5, 0.2);
      if (k.kind === 'item' && (k.item!.rarity === 'inscribed' || k.item!.rarity === 'relic') && Math.random() < 0.2) this.particles.emit(k.x, 0.4, k.z, (Math.random() - 0.5) * 0.5, 2, (Math.random() - 0.5) * 0.5, 0.8, 0.25, RARITY_COL[k.item!.rarity], -0.5, 0.3);
    }
    for (const [id, o] of this.pickupViews) {
      if (!seen.has(id)) {
        this.scene.remove(o);
        this.pickupViews.delete(id);
      }
    }
    void dt;
  }

  private syncStandards(g: Game) {
    while (this.standardViews.length < g.standards.length) {
      const grp = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.6, 6), new THREE.MeshStandardMaterial({ color: 0x4a3a2c }));
      pole.position.y = 1.3;
      const flag = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.04), new THREE.MeshBasicMaterial({ color: 0xffd56a, toneMapped: false }));
      flag.position.set(0.45, 2.2, 0);
      grp.add(pole, flag);
      this.scene.add(grp);
      this.standardViews.push(grp);
    }
    this.standardViews.forEach((v, i) => {
      const s = g.standards[i];
      v.visible = !!s;
      if (s) {
        v.position.set(s.x, 0, s.z);
        v.children[1].rotation.y = Math.sin(this.time * 2) * 0.3;
        if (Math.random() < 0.3) {
          const a = Math.random() * 6.28;
          this.particles.emit(s.x + Math.cos(a) * s.r, 0.1, s.z + Math.sin(a) * s.r, 0, 1.4, 0, 0.8, 0.28, 0xffd56a, -0.5, 0.3);
        }
      }
    });
  }

  private updateTraps(g: Game) {
    const z = g.zone;
    if (!z.traps.length) return;
    z.traps.forEach((t, i) => {
      const plate = this.trapViews[i];
      if (!plate) return;
      const grp = (plate as unknown as { userData: { group: THREE.Group } }).userData.group;
      const phase = ((g.time + t.phase) % t.period) / t.period;
      const spikes = grp.userData.spikes as THREE.Group;
      const warn = phase > 0.72 && phase < 0.9;
      const up = phase >= 0.9;
      spikes.position.y = up ? 0.12 : warn ? -0.25 + Math.sin(this.time * 30) * 0.03 : -0.4;
      (plate.material as THREE.MeshStandardMaterial).emissive.setHex(warn ? 0xff4a2a : up ? 0xff2a1a : 0x000000);
      (plate.material as THREE.MeshStandardMaterial).emissiveIntensity = warn || up ? 0.9 : 0;
    });
  }

  private updateInteractables(g: Game, dt: number) {
    const z = g.zone;
    const pl = g.player;
    for (const it of z.interactables) {
      const npc = this.npcViews.get(it.id);
      if (npc) {
        const d = Math.hypot(pl.x - npc.x, pl.z - npc.z);
        npc.model.root.visible = !(it.kind === 'artificer' && !it.state.rescued);
        if (d < 9) {
          const want = Math.atan2(pl.z - npc.z, pl.x - npc.x);
          npc.model.root.rotation.y += (Math.PI / 2 - want - npc.model.root.rotation.y) * Math.min(1, dt * 3);
        }
        npc.model.update({ dt, time: this.time + npc.x, speed: 0, phase: 0, atk: -1, cast: -1, castKind: '', flash: 0, dead: 0, heat: 0, boss: null, moveDir: 0 });
      }
      if (it.kind === 'cage' && this.cageNpc) {
        this.cageNpc.root.visible = !it.used;
        this.cageNpc.update({ dt, time: this.time, speed: 0, phase: 0, atk: -1, cast: -1, castKind: '', flash: 0, dead: 0, heat: 0, boss: null, moveDir: 0 });
      }
      if ((it.kind === 'waypoint' || it.kind === 'portal_return' || it.kind === 'portal_ashen' || it.kind === 'hunt_exit' || it.kind === 'exit_summary' || it.kind === 'shrine') && !it.hidden && Math.random() < 0.35) {
        const col = it.kind === 'portal_ashen' ? 0xff9a50 : it.kind === 'shrine' ? (it.used ? 0x444444 : 0x5ee0a0) : it.kind === 'waypoint' && !g.ch.waypoints.includes(String(it.state.id)) ? 0x8899aa : 0x5ee8ff;
        const a = Math.random() * 6.28;
        this.particles.emit(it.x + Math.cos(a) * 1.0, 0.1, it.z + Math.sin(a) * 1.0, 0, 1.5 + Math.random() * 1.5, 0, 1.2, 0.3, col, -0.4, 0.3);
      }
    }
  }

  private updateOcclusion(dt: number) {
    if (!this.game && this.menu.mode === 'title') return;
    const cx = this.camTarget.x;
    const cz = this.camTarget.z;
    const cdx = Math.sin(YAW);
    const cdz = Math.cos(YAW);
    const dirty = new Set<THREE.InstancedMesh>();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const m4 = new THREE.Matrix4();
    for (const o of this.occluders) {
      const rx = o.x - cx;
      const rz = o.z - cz;
      if (Math.abs(rx) > 14 || Math.abs(rz) > 14) {
        if (o.cur !== 1) {
          o.target = 1;
        } else continue;
      } else {
        const along = rx * cdx + rz * cdz;
        const perp = Math.abs(rx * cdz - rz * cdx);
        o.target = along > 0.4 && along < 11 && perp < 3.6 ? 0.16 : 1;
      }
      if (Math.abs(o.cur - o.target) < 0.004) {
        if (o.cur !== o.target) {
          o.cur = o.target;
        } else continue;
      } else o.cur += (o.target - o.cur) * Math.min(1, dt * 9);
      q.copy(o.rot);
      s.set(o.sx, o.sx * 0 + (o.mesh === this.wallMesh ? o.sy : o.sx) * o.cur, o.sx);
      m4.compose(o.pos, q, s);
      o.mesh.setMatrixAt(o.idx, m4);
      dirty.add(o.mesh);
    }
    for (const m of dirty) m.instanceMatrix.needsUpdate = true;
  }

  private updateLights(dt: number) {
    this.lastLightSort -= dt;
    const cx = this.camTarget.x;
    const cz = this.camTarget.z;
    if (this.lastLightSort <= 0) {
      this.lastLightSort = 0.25;
      const sorted = this.zoneLights.map((l) => ({ l, d: Math.hypot(l.x - cx, l.z - cz) })).filter((x) => x.d < 34).sort((a, b) => a.d - b.d).slice(0, this.lights.length);
      this.assigned = sorted.map((s) => s.l);
    }
    this.lights.forEach((pl, i) => {
      const l = this.assigned[i];
      if (!l) {
        pl.intensity = 0;
        return;
      }
      pl.position.set(l.x, 2.2, l.z);
      pl.color.setHex(l.color);
      pl.distance = l.dist;
      const f = l.flicker ? 0.82 + 0.18 * Math.sin(this.time * 9 + l.x * 3) * Math.sin(this.time * 5.3 + l.z) : 1;
      pl.intensity = l.intensity * 14 * f;
    });
    if (this.flashDecay > 0) {
      this.flash.intensity = Math.max(0, this.flash.intensity - this.flashDecay * dt);
      if (this.flash.intensity <= 0) this.flashDecay = 0;
    }
    for (const f of this.fireMeshes) {
      const s = 1 + Math.sin(this.time * 12 + f.ph) * 0.12;
      f.mesh.scale.set(1, s, 1);
    }
  }
  private assigned: { x: number; z: number; color: number; intensity: number; dist: number; flicker: boolean }[] = [];

  private updateHover(g: Game | null) {
    this.hoverRing.visible = false;
    this.enemyRing.visible = false;
    if (this.moveMarkerT > 0) {
      this.moveMarkerT -= 1 / 60;
      const s = 1 + (0.5 - this.moveMarkerT) * 1.2;
      this.moveMarker.scale.setScalar(s);
      (this.moveMarker.material as THREE.MeshBasicMaterial).opacity = Math.max(0, this.moveMarkerT * 1.6);
      if (this.moveMarkerT <= 0) this.moveMarker.visible = false;
    }
    if (!g) return;
    if (this.hoverKind === 'enemy' && typeof this.hoverId === 'number') {
      const e = g.enemies.find((x) => x.id === this.hoverId);
      if (e && e.alive) {
        this.enemyRing.visible = true;
        this.enemyRing.position.set(e.x, 0.1, e.z);
        this.enemyRing.scale.setScalar(e.r * 1.7 + 0.4 + Math.sin(this.time * 6) * 0.05);
        (this.enemyRing.material as THREE.MeshBasicMaterial).color.setHex(e.neutral ? 0xd8c8a0 : 0xff6a4a);
      }
    } else if (this.hoverKind === 'interact' && typeof this.hoverId === 'string') {
      const it = g.zone.interactables.find((x) => x.id === this.hoverId);
      if (it && !it.hidden) {
        this.hoverRing.visible = true;
        this.hoverRing.position.set(it.x, 0.1, it.z);
        this.hoverRing.scale.setScalar(it.r * 0.9 + 0.2 + Math.sin(this.time * 5) * 0.05);
      }
    }
  }

  private updateAmbient(dt: number) {
    // drifting ash motes around the camera target
    const z = this.zoneRef;
    if (!z) return;
    const rate = z.theme === 'town' ? 2.5 : z.theme === 'wild' ? 4 : 2;
    const n = rate * dt * 60 * 0.5;
    for (let i = 0; i < n; i++) {
      if (Math.random() > 0.5) continue;
      const x = this.camTarget.x + (Math.random() - 0.5) * 36;
      const zz = this.camTarget.z + (Math.random() - 0.5) * 36;
      this.particles.emit(x, 2 + Math.random() * 6, zz, 0.6 + Math.random() * 0.5, -0.4 - Math.random() * 0.5, 0.3 + Math.random() * 0.4, 4 + Math.random() * 3, 0.1 + Math.random() * 0.1, z.theme === 'crypt' ? 0x7aa0b0 : 0xb0a090, 0, 0);
    }
    // braziers/campfires emit embers
    if (Math.random() < 0.6) {
      const l = this.assigned[Math.floor(Math.random() * Math.max(1, this.assigned.length))];
      if (l && Math.hypot(l.x - this.camTarget.x, l.z - this.camTarget.z) < 30) this.particles.emit(l.x + (Math.random() - 0.5) * 0.4, 1.3, l.z + (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.6, 1.5 + Math.random() * 1.5, (Math.random() - 0.5) * 0.6, 1.2, 0.14, l.color === 0x5ee8ff ? 0x9ff4ff : 0xffa040, -0.2, 0.1);
    }
  }

  private updateMenuStage(dt: number) {
    const key = `${this.menu.mode}${this.menu.cls}${this.menu.look}`;
    if (this.menu.mode === 'create') {
      if (!this.menuModel || this.menuModelKey !== key) {
        if (this.menuModel) {
          this.scene.remove(this.menuModel.root);
          this.menuModel.dispose();
        }
        this.menuModel = buildPlayer(this.menu.cls, this.menu.look);
        const accents = [0xffb347, 0x5ee0d0, 0xd8dde4];
        this.menuModel.tintAccent?.(accents[this.menu.look % 3]);
        this.menuModel.root.position.set(24, 0, 23);
        this.menuModel.setLoadout?.('mace', true);
        this.scene.add(this.menuModel.root);
        this.menuModelKey = key;
      }
      this.menuModel.root.visible = true;
      this.menuModel.root.rotation.y = Math.PI / 2 - (-0.9 + Math.sin(this.time * 0.5) * 0.4);
      this.menuModel.update({ dt, time: this.time, speed: 0, phase: 0, atk: -1, cast: -1, castKind: '', flash: 0, dead: 0, heat: 0.3, boss: null, moveDir: 0 });
    } else if (this.menuModel) {
      this.menuModel.root.visible = false;
    }
  }

  dispose() {
    this.renderer.dispose();
  }
}

function smoothNoise(x: number, z: number): number {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const fx = x - x0;
  const fz = z - z0;
  const sx = fx * fx * (3 - 2 * fx);
  const sz = fz * fz * (3 - 2 * fz);
  const a = hash2(x0, z0);
  const b = hash2(x0 + 1, z0);
  const c = hash2(x0, z0 + 1);
  const d = hash2(x0 + 1, z0 + 1);
  return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz;
}

function p0<T>(l: T[]): T {
  return l[0];
}

export { ELITE_MODS, FLOOR };
