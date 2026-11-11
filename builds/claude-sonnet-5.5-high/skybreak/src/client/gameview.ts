/** Scene orchestration: actors, loot, effects, projectiles, camera, quality. */
import * as THREE from 'three';
import { AMMO_COLORS, ITEMS, MOVE, RARITIES, WEAPONS, type RarityShape } from '../shared/content';
import { clamp, dirFromYawPitch, rightFromYaw } from '../shared/math';
import type { GameEvent, LootEntity, Player } from '../sim/types';
import type { Match } from '../sim/match';
import { cameraPose, eyeHeight, muzzlePos } from '../sim/camera';
import { buildActor, buildItemModel, buildSkiff, buildWeapon, lambert, type ActorParts } from './models';
import { buildSky, buildWorldView, StormView, type WorldView } from './worldview';
import type { Quality, Settings } from './settings';

export const QUALITY = {
  low: { shadowSize: 0, pixel: 0.7, trees: 380, actorDist: 140, effects: 0.4 },
  medium: { shadowSize: 1536, pixel: 1, trees: 760, actorDist: 220, effects: 0.75 },
  high: { shadowSize: 2048, pixel: 1, trees: 1200, actorDist: 300, effects: 1 },
} as const;

interface Tracer { mesh: THREE.Mesh; life: number }
interface Puff { sprite: THREE.Sprite; life: number; max: number; vel: THREE.Vector3; grow: number }

const shapeTextures = new Map<string, THREE.CanvasTexture>();
export function shapeTexture(shape: RarityShape, color: string): THREE.CanvasTexture {
  const k = shape + color;
  let t = shapeTextures.get(k);
  if (t) return t;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  drawRarityShape(c.getContext('2d')!, shape, color, 32, 32, 24, true);
  t = new THREE.CanvasTexture(c);
  shapeTextures.set(k, t);
  return t;
}

export function drawRarityShape(ctx: CanvasRenderingContext2D, shape: RarityShape, color: string, cx: number, cy: number, r: number, outline = false): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = 'rgba(10,20,30,0.85)';
  ctx.lineWidth = Math.max(2, r * 0.18);
  ctx.beginPath();
  switch (shape) {
    case 'circle': ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2); break;
    case 'chevron':
      ctx.moveTo(cx - r, cy - r * 0.1); ctx.lineTo(cx, cy - r * 0.9); ctx.lineTo(cx + r, cy - r * 0.1);
      ctx.lineTo(cx + r, cy + r * 0.45); ctx.lineTo(cx, cy - r * 0.2); ctx.lineTo(cx - r, cy + r * 0.45); ctx.closePath(); break;
    case 'diamond': ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r * 0.8, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r * 0.8, cy); ctx.closePath(); break;
    case 'crown':
      ctx.moveTo(cx - r, cy + r * 0.7); ctx.lineTo(cx - r, cy - r * 0.5); ctx.lineTo(cx - r * 0.45, cy + r * 0.1); ctx.lineTo(cx, cy - r * 0.8);
      ctx.lineTo(cx + r * 0.45, cy + r * 0.1); ctx.lineTo(cx + r, cy - r * 0.5); ctx.lineTo(cx + r, cy + r * 0.7); ctx.closePath(); break;
    case 'star': for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.closePath(); break;
  }
  ctx.fill();
  if (outline) ctx.stroke();
  ctx.restore();
}

interface ActorView { parts: ActorParts; flash: THREE.Sprite; flashT: number; phase: number; lastWeapon: string; prevSpeed: number; name?: THREE.Sprite }

export class GameView {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.1, 5000);
  private world!: WorldView;
  private sky = buildSky();
  private storm = new StormView();
  private sun = new THREE.DirectionalLight(0xfff0d0, 2.1);
  private hemi = new THREE.HemisphereLight(0xd6f0ff, 0xcdbf98, 1.75);
  private match!: Match;
  private actors = new Map<number, ActorView>();
  private lootViews = new Map<number, THREE.Object3D>();
  private chestViews = new Map<number, { root: THREE.Group; lid: THREE.Mesh; open: number; kind: 'chest' | 'locker' }>();
  private projViews = new Map<number, THREE.Mesh>();
  private smokeViews = new Map<number, THREE.Group>();
  private capsuleViews = new Map<number, THREE.Group>();
  private tracers: Tracer[] = [];
  private puffs: Puff[] = [];
  private rings: { mesh: THREE.Mesh; life: number }[] = [];
  private skiffMesh = buildSkiff();
  private grappleLine: THREE.Line | null = null;
  private prev = new Map<number, { x: number; y: number; z: number; yaw: number }>();
  private t = 0;
  private quality: Quality = 'medium';
  private settings: Settings;
  private tracerGeo = new THREE.BoxGeometry(0.035, 0.035, 1);
  private tracerMat = new THREE.MeshBasicMaterial({ color: 0xfff1b8, transparent: true, opacity: 0.95, fog: false });
  private puffTex: THREE.CanvasTexture;
  private flashTex: THREE.CanvasTexture;
  private hideId = -1;
  private beaconDots: THREE.Mesh[] = [];

  constructor(canvas: HTMLCanvasElement, settings: Settings) {
    this.settings = settings;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: settings.quality !== 'low', powerPreference: 'high-performance', preserveDrawingBuffer: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene.fog = new THREE.Fog(0xcfeaf0, 260, 1300);
    this.scene.background = new THREE.Color(0x8fdcf0);
    this.scene.add(this.sky.mesh, this.sky.clouds, this.sun, this.sun.target, this.hemi, this.storm.group, this.skiffMesh);
    this.sun.position.set(-90, 140, 60);
    this.sun.castShadow = true;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.5;
    const sc = this.sun.shadow.camera;
    sc.left = -70; sc.right = 70; sc.top = 70; sc.bottom = -70; sc.near = 10; sc.far = 400;
    this.puffTex = radialTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0)');
    this.flashTex = radialTexture('rgba(255,240,170,1)', 'rgba(255,160,40,0)');
    this.setQuality(settings.quality);
  }

  setQuality(q: Quality): void {
    this.quality = q;
    const Q = QUALITY[q];
    this.sun.castShadow = Q.shadowSize > 0;
    if (Q.shadowSize > 0) {
      this.sun.shadow.mapSize.set(Q.shadowSize, Q.shadowSize);
      this.sun.shadow.map?.dispose(); this.sun.shadow.map = null as never;
    }
    this.world?.setQuality(q);
    this.scene.fog = new THREE.Fog(0xcfeaf0, q === 'low' ? 160 : 260, q === 'low' ? 800 : 1300);
  }

  setPixelRatio(r: number): void { this.renderer.setPixelRatio(r); }
  resize(w: number, h: number): void {
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /** Bind a match: build the world meshes and clear all dynamic views. */
  setMatch(m: Match): void {
    if (this.world) { this.scene.remove(this.world.group); disposeGroup(this.world.group); }
    for (const a of this.actors.values()) this.scene.remove(a.parts.root);
    this.actors.clear();
    for (const v of this.lootViews.values()) this.scene.remove(v);
    this.lootViews.clear();
    for (const v of this.chestViews.values()) this.scene.remove(v.root);
    this.chestViews.clear();
    this.prev.clear();
    this.match = m;
    this.world = buildWorldView(m.world);
    this.scene.add(this.world.group);
    this.world.setQuality(this.quality);
    // skiff only exists in quick drop matches
    this.skiffMesh.visible = m.mode === 'quick';
    this.storm.group.visible = m.mode === 'quick';
  }

  snapshot(): void {
    for (const p of this.match.players) {
      const e = this.prev.get(p.id);
      if (e) { e.x = p.x; e.y = p.y; e.z = p.z; e.yaw = p.yaw; } else this.prev.set(p.id, { x: p.x, y: p.y, z: p.z, yaw: p.yaw });
    }
  }
  interp(p: Player, alpha: number): { x: number; y: number; z: number; yaw: number } {
    const e = this.prev.get(p.id);
    if (!e) return { x: p.x, y: p.y, z: p.z, yaw: p.yaw };
    const far = Math.hypot(p.x - e.x, p.z - e.z) > 8 || Math.abs(p.y - e.y) > 8;
    if (far) return { x: p.x, y: p.y, z: p.z, yaw: p.yaw };
    let dy = p.yaw - e.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
    return { x: e.x + (p.x - e.x) * alpha, y: e.y + (p.y - e.y) * alpha, z: e.z + (p.z - e.z) * alpha, yaw: e.yaw + dy * alpha };
  }

  /* --------------------------------------------------------- events */
  onEvent(e: GameEvent): void {
    const Q = QUALITY[this.quality];
    switch (e.type) {
      case 'shot': {
        const p = this.match.players[e.pid];
        const a = this.actors.get(e.pid);
        if (a) a.flashT = 0.06;
        // tracer from the (visual) muzzle
        const len = Math.hypot(e.tx - e.ox, e.ty - e.oy, e.tz - e.oz);
        if (len > 1 && this.tracers.length < 70 * Q.effects + 10) {
          const rail = e.weapon === 'longwake';
          const m = new THREE.Mesh(this.tracerGeo, this.tracerMat);
          m.position.set((e.ox + e.tx) / 2, (e.oy + e.ty) / 2, (e.oz + e.tz) / 2);
          m.scale.set(rail ? 3 : 1, rail ? 3 : 1, len);
          m.lookAt(e.tx, e.ty, e.tz);
          this.scene.add(m);
          this.tracers.push({ mesh: m, life: 0.07 });
        }
        if (e.hit === 'world') this.spawnPuff(e.tx, e.ty, e.tz, 0xe8dcc4, 0.55, 0.4, 2);
        if (e.hit === 'player') this.spawnPuff(e.tx, e.ty, e.tz, 0xfff2c0, 0.5, 0.25, 3);
        void p;
        break;
      }
      case 'explosion': {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), new THREE.MeshBasicMaterial({ color: e.kind === 'gale' ? 0x9fe8ff : 0xc8f4ff, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
        mesh.position.set(e.x, e.y, e.z); mesh.scale.setScalar(0.5);
        mesh.userData.r = e.r;
        this.scene.add(mesh);
        this.rings.push({ mesh, life: 0.38 });
        for (let i = 0; i < 8; i++) this.spawnPuff(e.x + (Math.random() - 0.5) * 2, e.y + Math.random(), e.z + (Math.random() - 0.5) * 2, 0xdff9ff, 0.8, 0.5, 4);
        break;
      }
      case 'chest': {
        for (let i = 0; i < 10; i++) this.spawnPuff(e.x, e.y + 1, e.z, 0xffe9a0, 0.7, 0.6, 3);
        const v = this.chestViews.get(e.id);
        if (v) v.open = 1;
        break;
      }
      case 'kill': {
        const v = this.match.players[e.victim];
        if (v) for (let i = 0; i < 6; i++) this.spawnPuff(v.x, v.y + 1, v.z, 0xffffff, 0.6, 0.5, 3);
        break;
      }
      case 'smoke': break;
      case 'deploy': break;
      default: break;
    }
  }

  private spawnPuff(x: number, y: number, z: number, color: number, size: number, life: number, speed: number): void {
    if (this.puffs.length > 140) return;
    const mat = new THREE.SpriteMaterial({ map: this.puffTex, color, transparent: true, depthWrite: false, opacity: 0.9, fog: true });
    const s = new THREE.Sprite(mat);
    s.position.set(x, y, z);
    s.scale.setScalar(size);
    this.scene.add(s);
    this.puffs.push({ sprite: s, life, max: life, vel: new THREE.Vector3((Math.random() - 0.5) * speed, Math.random() * speed * 0.7, (Math.random() - 0.5) * speed), grow: size * 1.8 });
  }

  /* ------------------------------------------------------- per frame */
  render(dt: number, alpha: number, hide: number, camPose: { pos: THREE.Vector3; dir: THREE.Vector3; fov: number }, focusId: number, humanId: number, localPlayerPose?: { x: number; y: number; z: number; yaw: number }): void {
    this.t += dt;
    this.hideId = hide;
    const m = this.match;
    const Q = QUALITY[this.quality];
    // camera
    this.camera.position.copy(camPose.pos);
    this.camera.lookAt(camPose.pos.x + camPose.dir.x, camPose.pos.y + camPose.dir.y, camPose.pos.z + camPose.dir.z);
    this.camera.fov = camPose.fov;
    this.camera.updateProjectionMatrix();

    // sun/shadow follows the camera focus
    const fx = localPlayerPose?.x ?? camPose.pos.x, fy = localPlayerPose?.y ?? camPose.pos.y, fz = localPlayerPose?.z ?? camPose.pos.z;
    const snap = 1.0;
    const sx = Math.round(fx / snap) * snap, sz = Math.round(fz / snap) * snap;
    this.sun.target.position.set(sx, fy, sz);
    this.sun.position.set(sx - 80, fy + 120, sz + 55);
    this.sun.target.updateMatrixWorld();

    this.world.update(this.t, camPose.pos);
    this.sky.update(this.t, camPose.pos);

    // storm
    if (m.mode === 'quick') {
      const s = m.storm;
      const showWall = m.clock > 20 || s.phase > 0;
      this.storm.update(this.t, s.cx, s.cz, Math.max(s.r, 1), s.nextX, s.nextZ, Math.max(s.nextR, 1), s.stage !== 'done' && s.r < 5000 && s.phase > 0, camPose.pos, showWall && s.phase >= 1);
      // before phase 1 starts (whole island), draw the ring at the island edge only when storm is hidden
    }

    this.updateActors(dt, alpha, humanId);
    this.updateLoot(camPose.pos, focusId);
    this.updateProjectiles();
    this.updateSmokes();
    this.updateCapsules();
    this.updateSkiff();
    this.updateFx(dt);
    this.updateBeacons(humanId);
    this.updateGrapple(humanId);
    void Q;
    this.renderer.render(this.scene, this.camera);
  }

  private updateSkiff(): void {
    const m = this.match;
    if (m.mode !== 'quick') return;
    const s = m.skiff;
    const yaw = Math.atan2(s.dirX, s.dirZ);
    this.skiffMesh.position.set(s.x, s.y - 0.3, s.z);
    this.skiffMesh.rotation.y = yaw;
    const blades = this.skiffMesh.getObjectByName('blades');
    this.skiffMesh.traverse((o) => { if (o.name === 'blades') o.rotation.z += 0.3; });
    void blades;
    // hide the skiff after it leaves the island
    this.skiffMesh.visible = !(m.phase === 'live' && Math.hypot(s.x, s.z) > 1100) && m.phase !== 'ended';
    if (m.phase === 'staging') {
      // docked at the pier, slightly offset so the pier remains visible
      this.skiffMesh.position.set(s.startX + s.dirX * 28, s.y - 0.4, s.startZ + s.dirZ * 28);
    }
  }

  private actorFor(p: Player): ActorView {
    let a = this.actors.get(p.id);
    if (!a) {
      const parts = buildActor(p.cosmetic, p.id);
      const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.flashTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
      flash.scale.setScalar(0.7); flash.visible = false;
      parts.hand.add(flash);
      this.scene.add(parts.root);
      a = { parts, flash, flashT: 0, phase: Math.random() * 6, lastWeapon: '', prevSpeed: 0 };
      this.actors.set(p.id, a);
    }
    return a;
  }

  private updateActors(dt: number, alpha: number, humanId: number): void {
    const m = this.match;
    const Q = QUALITY[this.quality];
    for (const p of m.players) {
      const a = this.actorFor(p);
      const visible = p.alive && p.mode !== 'dead' && !(p.id === this.hideId);
      a.parts.root.visible = visible;
      if (!visible) continue;
      const ip = this.interp(p, alpha);
      const dx = ip.x - this.camera.position.x, dz = ip.z - this.camera.position.z;
      if (dx * dx + dz * dz > Q.actorDist * Q.actorDist && p.id !== humanId) { a.parts.root.visible = false; continue; }
      const root = a.parts.root;
      root.position.set(ip.x, ip.y, ip.z);
      root.rotation.y = ip.yaw;
      const speed = Math.hypot(p.vx, p.vz);
      a.phase += dt * (3 + speed * 1.6);
      const swing = p.mode === 'ground' && p.onGround ? Math.min(1, speed / 6) : 0;
      const s = Math.sin(a.phase) * 0.9 * swing;
      const parts = a.parts;
      parts.legL.rotation.x = s; parts.legR.rotation.x = -s;
      parts.armL.rotation.x = -s * 0.7;
      // body posture
      let bodyPitch = 0, bodyY = 0, scaleY = 1, lean = 0;
      if (p.crouching && !p.sliding) { scaleY = 0.78; }
      if (p.sliding) { bodyPitch = -0.9; bodyY = -0.1; scaleY = 0.9; }
      if (p.mode === 'freefall') { bodyPitch = 1.35; bodyY = 0.1; parts.legL.rotation.x = 0.4; parts.legR.rotation.x = -0.2; }
      if (p.mode === 'glide') { bodyPitch = 0.35; }
      if (p.mode === 'swim') { bodyPitch = 1.2; bodyY = -0.2; parts.legL.rotation.x = Math.sin(a.phase * 1.5) * 0.5; parts.legR.rotation.x = -Math.sin(a.phase * 1.5) * 0.5; }
      if (p.mode === 'zipline') { parts.armL.rotation.x = -3; parts.armR.rotation.x = -3; }
      if (p.mode === 'mantle') { bodyPitch = 0.4; }
      lean = p.sprinting ? 0.22 : 0;
      parts.body.rotation.x = bodyPitch + lean;
      parts.body.position.y = bodyY;
      parts.body.scale.y = scaleY;
      parts.wing.visible = p.mode === 'glide';
      if (p.mode === 'zipline') parts.body.position.y = 0.2;
      // weapon in hand
      const sel = p.slots[p.selected];
      const key = sel && sel.kind === 'weapon' ? `${sel.weapon}${sel.rarity}` : sel ? `i:${sel.item}` : '';
      if (key !== a.lastWeapon) {
        if (parts.weapon) { parts.hand.remove(parts.weapon); parts.weapon = null; }
        if (sel && sel.kind === 'weapon') {
          const w = buildWeapon(sel.weapon, sel.rarity); w.scale.setScalar(1.7); parts.weapon = w; parts.hand.add(w);
        } else if (sel && sel.kind === 'item') {
          const w = buildItemModel(sel.item); w.position.set(0, 0, 0.1); parts.weapon = w; parts.hand.add(w);
        }
        a.lastWeapon = key;
      }
      const armed = !!sel && sel.kind === 'weapon' && (p.mode === 'ground' || p.mode === 'swim');
      const item = !!sel && sel.kind === 'item' && p.mode === 'ground';
      const side = p.shoulder >= 0 ? -1 : 1; // local +x is the character's left
      const holder = side < 0 ? parts.armL : parts.armR;
      const free = side < 0 ? parts.armR : parts.armL;
      const pitchA = clamp(p.pitch, -0.9, 0.9);
      if (armed || item) {
        holder.rotation.x = -1.45 - pitchA * 0.9;
        free.rotation.x = armed ? -1.2 - pitchA * 0.9 : s * 0.7;
        free.rotation.z = armed ? side * -0.35 : 0;
        parts.hand.position.set(side * 0.36, p.crouching ? 1.06 : 1.34, 0.5);
        parts.hand.rotation.set(-pitchA, -side * 0.1, 0);
      } else {
        holder.rotation.x = p.mode === 'zipline' ? -3 : s * 0.7;
        free.rotation.x = p.mode === 'zipline' ? -3 : -s * 0.7;
        free.rotation.z = 0;
        parts.hand.position.set(side * 0.3, 1.2, 0.3);
        parts.hand.rotation.set(0, 0, 0);
      }
      if (parts.weapon) parts.weapon.visible = p.mode !== 'freefall' && p.mode !== 'glide' && p.mode !== 'zipline' && (p.mode !== 'swim' || armed);
      parts.using.visible = !!p.using;
      if (p.using) parts.using.position.y = 1.4 + Math.sin(this.t * 10) * 0.03;
      // muzzle flash
      a.flashT -= dt;
      a.flash.visible = a.flashT > 0 && !!parts.weapon;
      if (a.flash.visible) a.flash.position.set(0, 0.04, WEAPONS[(sel as { weapon: keyof typeof WEAPONS }).weapon]?.kind === 'projectile' ? 1.2 : 0.8);
      // hit flash tint is HUD-side
      // dummies get a floating health bar
      if (p.dummy && !a.name) {
        const c = document.createElement('canvas'); c.width = 128; c.height = 16;
        const tex = new THREE.CanvasTexture(c);
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
        sp.scale.set(1.4, 0.18, 1); sp.position.y = 2.3; sp.renderOrder = 10;
        sp.userData.canvas = c; sp.userData.tex = tex;
        parts.root.add(sp);
        a.name = sp;
      }
      if (a.name) {
        const c = a.name.userData.canvas as HTMLCanvasElement;
        const ctx = c.getContext('2d')!;
        ctx.clearRect(0, 0, 128, 16);
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, 128, 16);
        ctx.fillStyle = p.health > 50 ? '#7be07b' : '#e0a050';
        ctx.fillRect(2, 2, Math.max(0, 124 * (p.health / 100)), 12);
        (a.name.userData.tex as THREE.CanvasTexture).needsUpdate = true;
      }
    }
  }

  private lootBeaconMat = new Map<string, THREE.MeshBasicMaterial>();
  private makeLootView(e: LootEntity): THREE.Object3D {
    const g = new THREE.Group();
    const d = e.data;
    let rarity = 0, color = '#ffffff';
    if (d.kind === 'weapon') {
      rarity = d.rarity; color = RARITIES[rarity].color;
      const w = buildWeapon(d.weapon, d.rarity); w.scale.setScalar(1.35); w.position.y = 0.55; w.rotation.y = 0; w.name = 'model';
      g.add(w);
    } else if (d.kind === 'item') {
      color = ITEMS[d.item].color; const mdl = buildItemModel(d.item); mdl.position.y = 0.55; mdl.name = 'model'; g.add(mdl);
    } else if (d.kind === 'ammo') {
      color = AMMO_COLORS[d.ammo];
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.22), lambert(color, color)); b.position.y = 0.3; b.name = 'model'; b.castShadow = true; g.add(b);
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.2), lambert('#444')); b2.position.set(0.16, 0.22, 0.1); g.add(b2);
    } else {
      color = '#f2d27a';
      const bag = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.5), lambert('#8a6a45', '#3a2a10')); bag.position.y = 0.3; bag.name = 'model'; bag.castShadow = true; g.add(bag);
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.1, 0.52), lambert('#e7c36a')); strap.position.y = 0.4; g.add(strap);
    }
    // base ring
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.42, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(color), side: THREE.DoubleSide, transparent: true, opacity: 0.75 }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04; g.add(ring);
    // close-range beam (subtle) + rarity shape icon
    const bm = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: 0.07, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.12, 3.0, 8, 1, true), bm);
    beam.position.y = 1.7; beam.name = 'beam'; g.add(beam);
    if (d.kind === 'weapon' || e.priority) {
      const shape: RarityShape = d.kind === 'weapon' ? RARITIES[rarity].shape : 'star';
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: shapeTexture(shape, this.settings.colorblind && d.kind === 'weapon' ? RARITIES[rarity].colorBlind : color), transparent: true, depthTest: false, fog: false }));
      sp.scale.set(0.38, 0.38, 1); sp.position.y = 1.2; sp.name = 'icon'; sp.renderOrder = 8; g.add(sp);
    }
    g.position.set(e.x, e.y, e.z);
    return g;
  }

  private updateLoot(cam: THREE.Vector3, focusId: number): void {
    const m = this.match;
    const near2 = 80 * 80;
    // remove deleted
    for (const [id, v] of this.lootViews) {
      if (!m.loot.has(id)) { this.scene.remove(v); this.lootViews.delete(id); }
    }
    let count = 0;
    for (const e of m.loot.values()) {
      const dx = e.x - cam.x, dz = e.z - cam.z;
      const d2 = dx * dx + dz * dz;
      let v = this.lootViews.get(e.id);
      if (d2 > near2 && !(e.priority && d2 < 150 * 150)) { if (v) v.visible = false; continue; }
      if (count++ > 170) { if (v) v.visible = false; continue; }
      if (!v) { v = this.makeLootView(e); this.scene.add(v); this.lootViews.set(e.id, v); }
      v.visible = true;
      const model = v.getObjectByName('model');
      if (model) { model.rotation.y = this.t * 0.9 + e.id; model.position.y = (e.data.kind === 'ammo' || e.data.kind === 'cache' ? 0.3 : 0.55) + Math.sin(this.t * 2 + e.id) * 0.05; }
      const beam = v.getObjectByName('beam');
      if (beam) { (beam as THREE.Mesh).visible = d2 < 38 * 38 && (e.data.kind !== 'ammo'); }
      const icon = v.getObjectByName('icon');
      if (icon) icon.visible = d2 < 45 * 45;
      const s = e.id === focusId ? 1.25 : 1;
      v.scale.setScalar(s);
    }
    // chests
    for (const c of m.chests.values()) {
      const dx = c.x - cam.x, dz = c.z - cam.z;
      let v = this.chestViews.get(c.id);
      if (dx * dx + dz * dz > 120 * 120) { if (v) v.root.visible = false; continue; }
      if (!v) {
        const root = new THREE.Group();
        const isChest = c.kind === 'chest';
        const body = new THREE.Mesh(new THREE.BoxGeometry(isChest ? 1.1 : 0.9, isChest ? 0.6 : 1.5, isChest ? 0.7 : 0.7), lambert(isChest ? '#7a4a2a' : '#4f7894'));
        body.position.y = isChest ? 0.3 : 0.75; body.castShadow = true; root.add(body);
        const lid = new THREE.Mesh(new THREE.BoxGeometry(isChest ? 1.14 : 0.94, 0.16, isChest ? 0.74 : 0.74), lambert(isChest ? '#e6b84a' : '#8fd0e8', isChest ? '#b8860b' : '#2a6a88'));
        lid.position.y = isChest ? 0.68 : 1.58; lid.castShadow = true; root.add(lid);
        const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.12), lambert('#fff1a8', '#ffd54a')); gem.position.set(0, isChest ? 0.75 : 1.78, 0.38); gem.name = 'gem'; root.add(gem);
        root.position.set(c.x, c.y, c.z);
        this.scene.add(root);
        v = { root, lid, open: 0, kind: c.kind };
        this.chestViews.set(c.id, v);
      }
      v.root.visible = true;
      if (c.opened) { v.lid.rotation.x = -1.1; v.lid.position.y = v.kind === 'chest' ? 0.85 : 1.58; const g = v.root.getObjectByName('gem'); if (g) g.visible = false; }
      else { const g = v.root.getObjectByName('gem'); if (g) g.rotation.y = this.t * 1.5; }
    }
  }

  private updateProjectiles(): void {
    const m = this.match;
    const alive = new Set<number>();
    for (const pr of m.projectiles) {
      alive.add(pr.id);
      let v = this.projViews.get(pr.id);
      if (!v) {
        const col = pr.kind === 'rail' ? 0xd9c4ff : pr.kind === 'mist' ? 0xddd8ff : 0x9be7ff;
        v = new THREE.Mesh(pr.kind === 'rail' ? new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6) : new THREE.IcosahedronGeometry(pr.kind === 'gale' ? 0.28 : 0.2, 1), new THREE.MeshBasicMaterial({ color: col, fog: false }));
        this.scene.add(v);
        this.projViews.set(pr.id, v);
      }
      v.position.set(pr.x, pr.y, pr.z);
      if (pr.kind === 'rail') v.lookAt(pr.x + pr.vx, pr.y + pr.vy, pr.z + pr.vz), v.rotateX(Math.PI / 2);
      if (this.tracers.length < 80 && (pr.kind !== 'rail' || Math.random() < 0.7)) this.spawnPuff(pr.x, pr.y, pr.z, pr.kind === 'rail' ? 0xd9c4ff : 0xbff0ff, 0.35, 0.3, 0.2);
    }
    for (const [id, v] of this.projViews) if (!alive.has(id)) { this.scene.remove(v); this.projViews.delete(id); }
  }

  private updateSmokes(): void {
    const m = this.match;
    const alive = new Set<number>();
    for (const s of m.smokes) {
      alive.add(s.id);
      let g = this.smokeViews.get(s.id);
      if (!g) {
        g = new THREE.Group();
        const mat = new THREE.MeshLambertMaterial({ color: 0xd8d2f0, transparent: true, opacity: 0.8, emissive: 0x6a5fa0, emissiveIntensity: 0.25 });
        for (let i = 0; i < 9; i++) {
          const b = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), mat);
          const a = (i / 9) * Math.PI * 2, r = i === 0 ? 0 : s.r * 0.55;
          b.position.set(Math.cos(a) * r, 1.5 + (i % 3) * 0.9, Math.sin(a) * r);
          b.scale.setScalar(s.r * (i === 0 ? 0.72 : 0.5));
          g.add(b);
        }
        g.position.set(s.x, s.y, s.z);
        this.scene.add(g);
        this.smokeViews.set(s.id, g);
      }
      const k = Math.min(1, s.t / 0.6) * (s.t > s.life - 1.2 ? Math.max(0, (s.life - s.t) / 1.2) : 1);
      g.scale.setScalar(Math.max(0.01, k));
      g.rotation.y = this.t * 0.1;
    }
    for (const [id, g] of this.smokeViews) if (!alive.has(id)) { this.scene.remove(g); this.smokeViews.delete(id); }
  }

  private updateCapsules(): void {
    const m = this.match;
    for (const c of m.capsules) {
      let g = this.capsuleViews.get(c.id);
      if (!g) {
        g = new THREE.Group();
        const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 2, 10), lambert('#e7d9bb'));
        pod.position.y = 1; pod.castShadow = true; g.add(pod);
        const band = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.12, 0.5, 10), lambert('#ffc83d', '#a87a00')); band.position.y = 1; g.add(band);
        const chute = new THREE.Mesh(new THREE.SphereGeometry(3.4, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xff7b4a, side: THREE.DoubleSide, emissive: 0xff5a2a, emissiveIntensity: 0.15 }));
        chute.position.y = 6.2; chute.name = 'chute'; g.add(chute);
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.8, 120, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd45a, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
        beam.position.y = 60; g.add(beam);
        this.scene.add(g);
        this.capsuleViews.set(c.id, g);
      }
      g.position.set(c.x, c.y, c.z);
      const chute = g.getObjectByName('chute');
      if (chute) chute.visible = !c.landed;
    }
  }

  private updateBeacons(humanId: number): void {
    const m = this.match;
    const h = m.players[humanId];
    const trails = h ? m.beaconTrails(h) : [];
    while (this.beaconDots.length < trails.length) {
      const d = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe36b, transparent: true, opacity: 0.8, depthTest: false }));
      d.renderOrder = 9; this.scene.add(d); this.beaconDots.push(d);
    }
    this.beaconDots.forEach((d, i) => {
      if (i < trails.length) {
        const t = trails[i];
        d.visible = true; d.position.set(t.x, m.world.heightAt(t.x, t.z) + 0.8, t.z);
        (d.material as THREE.MeshBasicMaterial).opacity = clamp(1 - t.age / 14, 0.15, 0.85);
        d.scale.setScalar(0.6 + (1 - clamp(t.age / 14, 0, 1)) * 0.6);
      } else d.visible = false;
    });
  }

  private updateGrapple(humanId: number): void {
    const p = this.match.players[humanId];
    if (p && p.mode === 'grapple' && p.grapple) {
      if (!this.grappleLine) {
        this.grappleLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xffd166 }));
        this.scene.add(this.grappleLine);
      }
      const a = this.grappleLine.geometry.attributes.position as THREE.BufferAttribute;
      a.setXYZ(0, p.x, p.y + 1.2, p.z); a.setXYZ(1, p.grapple.x, p.grapple.y, p.grapple.z); a.needsUpdate = true;
      this.grappleLine.visible = true;
    } else if (this.grappleLine) this.grappleLine.visible = false;
  }

  private updateFx(dt: number): void {
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.life -= dt;
      if (t.life <= 0) { this.scene.remove(t.mesh); this.tracers.splice(i, 1); }
    }
    for (let i = this.puffs.length - 1; i >= 0; i--) {
      const p = this.puffs[i];
      p.life -= dt;
      if (p.life <= 0) { this.scene.remove(p.sprite); (p.sprite.material as THREE.Material).dispose(); this.puffs.splice(i, 1); continue; }
      const k = p.life / p.max;
      p.sprite.position.addScaledVector(p.vel, dt);
      p.sprite.scale.setScalar(p.sprite.scale.x + p.grow * dt);
      (p.sprite.material as THREE.SpriteMaterial).opacity = k * 0.85;
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life -= dt;
      const k = 1 - r.life / 0.38;
      r.mesh.scale.setScalar(Math.max(0.3, (r.mesh.userData.r as number) * k));
      (r.mesh.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - k);
      if (r.life <= 0) { this.scene.remove(r.mesh); (r.mesh.material as THREE.Material).dispose(); this.rings.splice(i, 1); }
    }
  }

  /** Third-person camera pose for a player (interpolated), including shoulder swap, ADS and collision. */
  poseFor(p: Player, ip: { x: number; y: number; z: number }, lookYaw: number, lookPitch: number, reduceRecoil: number): { pos: THREE.Vector3; dir: THREE.Vector3; fov: number; pivot: THREE.Vector3 } {
    const proxy = { ...p, x: ip.x, y: ip.y, z: ip.z, yaw: lookYaw, pitch: lookPitch } as Player;
    const sel = p.slots[p.selected];
    let adsBoom = 2.3;
    let adsFov = 0.85;
    if (sel && sel.kind === 'weapon') { adsBoom = WEAPONS[sel.weapon].adsBoom; adsFov = WEAPONS[sel.weapon].adsFov; }
    // visual recoil is scaled by the accessibility setting without touching the authoritative aim
    proxy.recoilP = p.recoilP * reduceRecoil; proxy.recoilY = p.recoilY * reduceRecoil;
    let boom = adsBoom;
    if (p.mode === 'freefall' || p.mode === 'glide') { proxy.adsT = 0; boom = 4.5; }
    const base = cameraPose(this.match.world, proxy, boom);
    let pos = base.pos;
    let dir = base.dir;
    const baseFov = this.settings.fov;
    let hfov = baseFov;
    if (p.mode === 'freefall' || p.mode === 'glide') {
      hfov += 8 + Math.min(10, Math.hypot(p.vx, p.vy, p.vz) * 0.1);
      // pull back further and look ahead along velocity
      const back = p.mode === 'glide' ? 6.5 : 5.2;
      const d = dirFromYawPitch(lookYaw, lookPitch);
      pos = { x: base.pivot.x - d.x * back, y: base.pivot.y - d.y * back + 1.0, z: base.pivot.z - d.z * back };
      dir = d;
    }
    hfov = hfov * (1 + (adsFov - 1) * p.adsT);
    const aspect = this.camera.aspect || 16 / 9;
    const vfov = 2 * Math.atan(Math.tan((hfov * Math.PI) / 360) / aspect) * (180 / Math.PI);
    void rightFromYaw; void eyeHeight; void muzzlePos; void MOVE;
    return { pos: new THREE.Vector3(pos.x, pos.y, pos.z), dir: new THREE.Vector3(dir.x, dir.y, dir.z), fov: vfov, pivot: new THREE.Vector3(base.pivot.x, base.pivot.y, base.pivot.z) };
  }

  worldPointToScreen(x: number, y: number, z: number): { x: number; y: number; behind: boolean } {
    const v = new THREE.Vector3(x, y, z).project(this.camera);
    return { x: (v.x * 0.5 + 0.5), y: (-v.y * 0.5 + 0.5), behind: v.z > 1 };
  }

  get domElement(): HTMLCanvasElement { return this.renderer.domElement; }
}

function radialTexture(inner: string, outer: string): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 31);
  g.addColorStop(0, inner); g.addColorStop(1, outer);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function disposeGroup(g: THREE.Object3D): void {
  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
  });
}
