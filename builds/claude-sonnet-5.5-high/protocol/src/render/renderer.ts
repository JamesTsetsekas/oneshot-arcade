// Scene controller: characters, viewmodel, grenades, smoke, fire, tracers, decals. All gameplay-relevant volumes
// (smoke boundary, fire cells, bombsite zones) come from authoritative snapshot data so presets never change visibility.

import * as THREE from 'three';
import type { UtilityId } from '../content/economy';
import { WEAPONS, WeaponId } from '../content/weapons';
import { Settings } from '../client/settings';
import type { RenderedPlayer } from '../client/netcode';
import type { PlayerSnap, Snapshot } from '../protocol/schema';
import { lineOfSight } from '../sim/collision';
import { Vec3, clamp, lerp } from '../sim/math';
import { eyeHeight } from '../sim/movement';
import { kickNow } from '../sim/weapons';
import type { GameEvent, Side } from '../sim/types';
import { MATERIALS, MaterialId } from '../sim/map';
import { CharacterRig, PALETTES, WeaponModel, buildCharacter, buildGrenadeModel, buildSpikeModel, buildWeaponModel, rigPaletteKey, setRigWeapon } from './models';
import { glowTexture } from './textures';
import { WorldVisuals, buildWorld } from './world';

export interface CameraState {
  pos: Vec3;
  yaw: number;
  pitch: number;
  /** Recoil kick added on top of the view (radians). */
  kickPitch: number;
  kickYaw: number;
  /** Scope level and horizontal FOV override (degrees at 16:9). */
  zoomFov: number | null;
  roll: number;
}

export interface ViewmodelState {
  weapon: WeaponId | null;
  visible: boolean;
  speed: number;
  onGround: boolean;
  crouch: number;
  /** Seconds since the last shot / reload start / draw start. */
  sinceShot: number;
  reloading: boolean;
  reloadProgress: number;
  drawProgress: number;
  inspect: number;
  swingT: number;
  swayX: number;
  swayY: number;
  interacting: boolean;
}

interface Tracer { mesh: THREE.Mesh; life: number; max: number }
interface Particle { mesh: THREE.Mesh; vel: THREE.Vector3; life: number; max: number; grav: number }
interface Corpse { rig: CharacterRig; t: number; spin: number }

const smokeVert = `
varying vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const smokeFrag = `
uniform vec3 uCenter; uniform float uRadius; uniform float uTime; uniform float uFade;
varying vec3 vWorld;
float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
void main() {
  vec3 ro = cameraPosition;
  vec3 rd = normalize(vWorld - ro);
  float dist = length(vWorld - ro);
  vec3 oc = ro - uCenter;
  float b = dot(oc, rd);
  float c = dot(oc, oc) - uRadius * uRadius;
  float disc = b * b - c;
  if (disc < 0.0) discard;
  float s = sqrt(disc);
  float t0 = max(-b - s, 0.0);
  float t1 = min(-b + s, dist);
  float thick = max(t1 - t0, 0.0);
  float a = clamp(thick / 0.5, 0.0, 1.0) * 0.975 * uFade;
  vec3 mid = ro + rd * (t0 + t1) * 0.5;
  float n = noise(mid * 1.1 + vec3(uTime * 0.12, uTime * 0.05, 0.0)) * 0.6 + noise(mid * 2.7 - uTime * 0.2) * 0.4;
  vec3 col = mix(vec3(0.50, 0.57, 0.66), vec3(0.82, 0.87, 0.94), n);
  col *= 0.88 + 0.12 * clamp(thick / (uRadius * 1.6), 0.0, 1.0);
  gl_FragColor = vec4(col, a);
}`;

export class GameRenderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.05, 160);
  readonly vmScene = new THREE.Scene();
  readonly vmCamera = new THREE.PerspectiveCamera(62, 16 / 9, 0.01, 10);
  world: WorldVisuals;
  private rigs = new Map<number, CharacterRig>();
  private rigSides = new Map<number, Side>();
  private rigPrev = new Map<number, { x: number; z: number }>();
  private rigSpeed = new Map<number, number>();
  private grenades = new Map<number, THREE.Object3D>();
  private smokes = new Map<number, THREE.Mesh>();
  private fires = new Map<number, THREE.Group>();
  private drops = new Map<number, THREE.Object3D>();
  private spikeObj: THREE.Group;
  private spikeLight: THREE.PointLight;
  private tracers: Tracer[] = [];
  private particles: Particle[] = [];
  private decals: THREE.Mesh[] = [];
  private partInst!: THREE.InstancedMesh;
  private decalInst!: THREE.InstancedMesh;
  private decalCount = 0;
  private tmpColor = new THREE.Color();
  private hideMat = new THREE.Matrix4().makeScale(0, 0, 0);
  private decalIdx = 0;
  private corpses: Corpse[] = [];
  private muzzleSprite: THREE.Sprite;
  private flashLights: THREE.PointLight[] = [];
  private flashLightIdx = 0;
  private glowTex = glowTexture();
  private vmGroup = new THREE.Group();
  private vmModel: WeaponModel | null = null;
  private vmWeapon: WeaponId | null = null;
  private vmMuzzle: THREE.Sprite;
  private vmMuzzleT = 0;
  private bob = 0;
  private time = 0;
  private settings: Settings;
  private aspect = 16 / 9;
  private smokeMat: THREE.ShaderMaterial[] = [];
  private pulseRings: Array<{ mesh: THREE.Mesh; life: number }> = [];
  private trajectory: THREE.Line;
  stats = { drawCalls: 0, triangles: 0 };
  private qualityApplied = '';

  constructor(private canvas: HTMLCanvasElement, settings: Settings) {
    this.settings = settings;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.autoClear = false;
    this.renderer.info.autoReset = false;
    this.scene.background = new THREE.Color(0x101419);
    this.world = buildWorld(this.scene);

    // viewmodel lighting
    this.vmScene.add(new THREE.HemisphereLight(0xffffff, 0x7a808c, 2.0));
    const vmSun = new THREE.DirectionalLight(0xfff2e0, 2.2);
    vmSun.position.set(1, 2, 1.5);
    this.vmScene.add(vmSun);
    this.vmScene.add(this.vmGroup);
    this.vmMuzzle = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color: 0xffd9a0, blending: THREE.AdditiveBlending, transparent: true, depthTest: false }));
    this.vmMuzzle.scale.setScalar(0.22);
    this.vmMuzzle.visible = false;
    this.vmScene.add(this.vmMuzzle);

    // tracer / particle / decal pools
    for (let i = 0; i < 32; i++) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 1), new THREE.MeshBasicMaterial({ color: 0xffe8b0, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
      m.visible = false; this.scene.add(m);
      this.tracers.push({ mesh: m, life: 0, max: 0.08 });
    }
    const pGeo = new THREE.PlaneGeometry(0.05, 0.05);
    for (let i = 0; i < 140; i++) {
      const m = new THREE.Mesh(pGeo);
      m.visible = false;
      this.particles.push({ mesh: m, vel: new THREE.Vector3(), life: 0, max: 0.4, grav: 6 });
    }
    this.partInst = new THREE.InstancedMesh(pGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), 140);
    this.partInst.frustumCulled = false; this.partInst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.partInst.setColorAt(0, new THREE.Color(1, 1, 1));
    this.scene.add(this.partInst);
    const decalMat = new THREE.MeshBasicMaterial({ map: this.glowTex, color: 0x05070a, transparent: true, opacity: 0.7, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
    const dGeo = new THREE.PlaneGeometry(0.17, 0.17);
    for (let i = 0; i < 120; i++) { const m = new THREE.Mesh(dGeo); m.visible = false; this.decals.push(m); }
    this.decalInst = new THREE.InstancedMesh(dGeo, decalMat, 120);
    this.decalInst.frustumCulled = false; this.decalInst.count = 0;
    this.scene.add(this.decalInst);
    this.muzzleSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glowTex, color: 0xffcf80, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
    this.muzzleSprite.scale.setScalar(0.5); this.muzzleSprite.visible = false;
    this.scene.add(this.muzzleSprite);
    for (let i = 0; i < 3; i++) { const l = new THREE.PointLight(0xffc070, 0, 9, 2); this.scene.add(l); this.flashLights.push(l); }

    this.spikeObj = buildSpikeModel();
    this.spikeObj.visible = false;
    this.scene.add(this.spikeObj);
    this.spikeLight = new THREE.PointLight(0xff3fa6, 0, 7, 2);
    this.scene.add(this.spikeLight);

    const tg = new THREE.BufferGeometry().setFromPoints(new Array(60).fill(0).map(() => new THREE.Vector3()));
    this.trajectory = new THREE.Line(tg, new THREE.LineBasicMaterial({ color: 0x6dffd9, transparent: true, opacity: 0.8 }));
    this.trajectory.visible = false; this.trajectory.frustumCulled = false;
    this.scene.add(this.trajectory);

    this.applyQuality();
    this.resize();
  }

  setSettings(s: Settings): void { this.settings = s; this.applyQuality(); }

  applyQuality(): void {
    const q = this.settings.quality;
    if (this.qualityApplied === q + this.settings.resolutionScale) return;
    this.qualityApplied = q + this.settings.resolutionScale;
    const dpr = Math.min(window.devicePixelRatio || 1, q === 'high' ? 2 : q === 'medium' ? 1.25 : 1);
    this.renderer.setPixelRatio(dpr * this.settings.resolutionScale * (q === 'low' ? 0.8 : 1));
    this.world.setShadowQuality(q === 'low' ? 'off' : q === 'high' ? 'high' : 'low');
    this.resize();
  }

  resize(): void {
    const w = this.canvas.clientWidth || window.innerWidth, h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.aspect = w / h;
    this.camera.aspect = this.aspect; this.vmCamera.aspect = this.aspect;
    this.camera.updateProjectionMatrix(); this.vmCamera.updateProjectionMatrix();
  }

  /** Horizontal FOV (at the given aspect) to vertical FOV. */
  private vFov(hFovDeg: number): number {
    const h = (hFovDeg * Math.PI) / 360;
    return (2 * Math.atan(Math.tan(h) / this.aspect) * 180) / Math.PI;
  }

  private ensureRig(p: PlayerSnap, side: Side): CharacterRig {
    let rig = this.rigs.get(p.id);
    const pal = PALETTES[this.settings.colorblind];
    if (!rig || this.rigSides.get(p.id) !== side || rig.paletteKey !== rigPaletteKey(side, pal)) {
      if (rig) this.scene.remove(rig.root);
      rig = buildCharacter(side, pal);
      this.rigs.set(p.id, rig);
      this.rigSides.set(p.id, side);
      this.scene.add(rig.root);
    }
    return rig;
  }

  // ------------------------------------------------------------------ events
  handleEvent(e: GameEvent, snap: Snapshot, selfId: number): void {
    switch (e.t) {
      case 'shot': {
        // Tracer (from muzzle area to impact)
        const o = new THREE.Vector3(e.o.x, e.o.y - 0.12, e.o.z), end = new THREE.Vector3(e.e.x, e.e.y, e.e.z);
        if (e.id !== selfId) { this.spawnTracer(o, end); this.muzzleFlash(o, e.id); }
        else this.spawnTracer(o.clone().add(new THREE.Vector3().subVectors(end, o).normalize().multiplyScalar(1.2)), end);
        break;
      }
      case 'impact': this.spawnImpact(e.p, e.n, e.mat); break;
      case 'kill': this.spawnCorpse(e, snap); break;
      case 'nade':
        if (e.kind === 'pulsePing') this.spawnPulseRing(e.p);
        if (e.kind === 'flash') this.flashLight(e.p, 0xffffff, 6, 0.25);
        if (e.kind === 'frag') { this.flashLight(e.p, 0xff9a4a, 8, 0.3); this.burst(e.p, 28, 0xffa860, 7); }
        if (e.kind === 'thermite') this.flashLight(e.p, 0xff7a2a, 4, 0.4);
        break;
      case 'spike':
        if (e.kind === 'explode') { this.flashLight(e.p, 0xff8a3a, 16, 0.6); this.burst(e.p, 60, 0xff9a50, 11); }
        break;
      default: break;
    }
  }

  private flashLight(p: Vec3, color: number, intensity: number, life: number): void {
    const l = this.flashLights[this.flashLightIdx++ % this.flashLights.length];
    l.position.set(p.x, p.y + 0.6, p.z); l.color.setHex(color); l.intensity = intensity * 3; (l as any)._life = life;
  }

  private spawnTracer(from: THREE.Vector3, to: THREE.Vector3): void {
    const t = this.tracers.find((x) => x.life <= 0) ?? this.tracers[0];
    const d = new THREE.Vector3().subVectors(to, from);
    const len = d.length();
    if (len < 0.3) return;
    t.mesh.position.copy(from).addScaledVector(d, 0.5);
    t.mesh.scale.set(1, 1, len);
    t.mesh.lookAt(to);
    t.mesh.visible = true; t.life = t.max;
    (t.mesh.material as THREE.MeshBasicMaterial).opacity = 0.8;
  }

  private muzzleFlash(o: THREE.Vector3, id: number): void {
    this.muzzleSprite.position.copy(o);
    this.muzzleSprite.visible = true;
    this.muzzleFlashT = 0.05;
    void id;
  }
  private muzzleFlashT = 0;

  private burst(p: Vec3, n: number, color: number, speed: number): void {
    for (let i = 0; i < n; i++) {
      const pt = this.particles.find((x) => x.life <= 0);
      if (!pt) return;
      pt.mesh.position.set(p.x, p.y + 0.3, p.z);
      pt.vel.set((Math.random() - 0.5) * speed, Math.random() * speed * 0.8, (Math.random() - 0.5) * speed);
      pt.life = pt.max = 0.5 + Math.random() * 0.5; pt.grav = 8;
      pt.mesh.userData.color = color;
      pt.mesh.scale.setScalar(2.4);
      pt.mesh.visible = true;
    }
  }

  private spawnImpact(p: Vec3, n: Vec3, mat: MaterialId | 'player' | 'ground' | 'head'): void {
    const isBody = mat === 'player' || mat === 'head';
    const q = this.settings.quality;
    const count = q === 'low' ? 2 : 5;
    const color = isBody ? 0xb8353f : mat === 'metal' ? 0xffd890 : mat === 'foliage' ? 0x7cc86a : mat === 'glass' ? 0xcff4ff : 0xd8d2c4;
    for (let i = 0; i < count; i++) {
      const pt = this.particles.find((x) => x.life <= 0);
      if (!pt) break;
      pt.mesh.position.set(p.x + n.x * 0.03, p.y + n.y * 0.03, p.z + n.z * 0.03);
      pt.vel.set(n.x * 2 + (Math.random() - 0.5) * 2, n.y * 2 + Math.random() * 1.5, n.z * 2 + (Math.random() - 0.5) * 2);
      pt.life = pt.max = isBody ? 0.35 : 0.3; pt.grav = 7;
      pt.mesh.userData.color = color;
      pt.mesh.scale.setScalar(isBody ? 1.2 : 0.9);
      pt.mesh.visible = true;
    }
    if (!isBody && mat !== 'glass' && mat !== 'foliage') {
      const d = this.decals[this.decalIdx++ % this.decals.length];
      d.position.set(p.x + n.x * 0.01, p.y + n.y * 0.01, p.z + n.z * 0.01);
      d.lookAt(p.x + n.x, p.y + n.y, p.z + n.z);
      d.rotateZ(Math.random() * 6.28);
      d.scale.setScalar(MATERIALS[mat as MaterialId]?.cost < 10 ? 1.3 : 0.8);
      d.updateMatrix();
      const di = (this.decalIdx - 1) % this.decals.length;
      this.decalInst.setMatrixAt(di, d.matrix);
      this.decalCount = Math.max(this.decalCount, di + 1);
      this.decalInst.count = this.decalCount;
      this.decalInst.instanceMatrix.needsUpdate = true;
    }
  }

  private spawnPulseRing(p: Vec3): void {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.26, 40), new THREE.MeshBasicMaterial({ color: 0x4de0ff, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(p.x, p.y + 0.1, p.z);
    this.scene.add(m);
    this.pulseRings.push({ mesh: m, life: 1.1 });
  }

  private spawnCorpse(e: Extract<GameEvent, { t: 'kill' }>, snap: Snapshot): void {
    const sideSquad = snap.squadSide;
    const squadIdx = e.victim < 5 ? 0 : 1;
    const side = sideSquad[squadIdx];
    const rig = buildCharacter(side, PALETTES[this.settings.colorblind]);
    rig.root.position.set(e.pos.x, e.pos.y, e.pos.z);
    const old = this.rigs.get(e.victim);
    rig.root.rotation.y = old ? old.root.rotation.y : Math.random() * 6;
    rig.body.rotation.x = 0;
    this.scene.add(rig.root);
    this.corpses.push({ rig, t: 0, spin: (Math.random() - 0.5) * 0.6 });
    if (this.corpses.length > 6) { const c = this.corpses.shift()!; this.scene.remove(c.rig.root); }
    this.burst(e.pos, 6, 0x9a2a33, 3);
  }

  clearRound(): void {
    for (const c of this.corpses) this.scene.remove(c.rig.root);
    this.corpses = [];
    this.decalCount = 0; this.decalInst.count = 0; this.decalIdx = 0;
    for (const r of this.pulseRings) this.scene.remove(r.mesh);
    this.pulseRings = [];
  }

  // ------------------------------------------------------------------ frame
  render(dt: number, snap: Snapshot, remote: RenderedPlayer[], cam: CameraState, vm: ViewmodelState, serverTime: number, selfId: number, practiceTrajectory: Vec3[] | null, spectatingId: number | null): void {
    this.time += dt;
    this.applyQuality();
    const camPos = new THREE.Vector3(cam.pos.x, cam.pos.y, cam.pos.z);

    // ---- camera
    const hf = cam.zoomFov ?? this.settings.fov;
    this.camera.fov = this.vFov(hf);
    this.camera.position.copy(camPos);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.set(clamp(cam.pitch + cam.kickPitch, -1.55, 1.55), cam.yaw + cam.kickYaw, cam.roll);
    this.camera.updateProjectionMatrix();
    this.vmCamera.fov = 60;
    this.vmCamera.updateProjectionMatrix();

    const eye = { x: cam.pos.x, y: cam.pos.y, z: cam.pos.z };
    const sideOf = (id: number): Side => snap.squadSide[id < 5 ? 0 : 1];

    // ---- remote players
    const seen = new Set<number>();
    for (const rp of remote) {
      if (rp.id === selfId) continue;
      const side = sideOf(rp.id);
      const rig = this.ensureRig(rp, side);
      seen.add(rp.id);
      if (!rp.alive) { rig.root.visible = false; continue; }
      const enemy = rp.spotted;
      // Smoke hides anyone inside or behind the authoritative volume (same rule the server uses).
      let hidden = false;
      if (enemy) {
        const chest = { x: rp.pos.x, y: rp.pos.y + 1.1, z: rp.pos.z };
        for (const s of snap.smokes) {
          if (s.bloomIn > 0) continue;
          if (segSphere(eye, chest, s, s.r) > 0.5) { hidden = true; break; }
        }
      }
      // Players do not collide with each other in this slice, so hide a model the camera is inside of.
      const tooClose = Math.hypot(rp.pos.x - eye.x, rp.pos.z - eye.z) < 1.05 && Math.abs(rp.pos.y + 0.9 - eye.y) < 1.4;
      rig.root.visible = !hidden && !tooClose && !(spectatingId === rp.id);
      rig.root.position.set(rp.pos.x, rp.pos.y, rp.pos.z);
      rig.root.rotation.y = rp.yaw;
      setRigWeapon(rig, rp.weapon);
      // speed estimate for gait
      const prev = this.rigPrev.get(rp.id);
      let spd = this.rigSpeed.get(rp.id) ?? 0;
      if (prev) { const inst = Math.hypot(rp.pos.x - prev.x, rp.pos.z - prev.z) / Math.max(dt, 0.001); spd = lerp(spd, Math.min(inst, 7), 0.25); }
      this.rigPrev.set(rp.id, { x: rp.pos.x, z: rp.pos.z });
      this.rigSpeed.set(rp.id, spd);
      this.animateRig(rig, rp, spd, dt, camPos);
    }
    for (const [id, rig] of this.rigs) if (!seen.has(id)) rig.root.visible = false;

    // corpses
    for (const c of this.corpses) {
      c.t += dt;
      const k = Math.min(1, c.t / 0.55);
      const e = 1 - Math.pow(1 - k, 3);
      c.rig.body.rotation.x = -Math.PI / 2 * e;
      c.rig.body.position.set(0, 0.18 * e, 0.0 + 0.5 * e);
      c.rig.root.rotation.y += c.spin * dt * (1 - k);
      c.rig.legL.rotation.x = 0.3 * e; c.rig.legR.rotation.x = -0.2 * e;
      c.rig.armR.rotation.x = 0.4 * e; c.rig.armL.rotation.x = 0.9 * e;
    }

    // ---- grenades
    const gSeen = new Set<number>();
    for (const g of snap.grenades) {
      gSeen.add(g.id);
      let o = this.grenades.get(g.id);
      if (!o) { o = buildGrenadeModel(g.type as UtilityId); this.scene.add(o); this.grenades.set(g.id, o); }
      o.position.set(g.x, g.y, g.z);
      o.rotation.x += dt * (g.landed ? 0 : 9); o.rotation.z += dt * (g.landed ? 0 : 6);
      if (g.type === 'pulse' && g.landed) o.rotation.y += dt * 3;
    }
    for (const [id, o] of this.grenades) if (!gSeen.has(id)) { this.scene.remove(o); this.grenades.delete(id); }

    // ---- smokes (shader boundary == authoritative sphere)
    const sSeen = new Set<number>();
    for (const s of snap.smokes) {
      sSeen.add(s.id);
      let m = this.smokes.get(s.id);
      if (!m) {
        const mat = new THREE.ShaderMaterial({
          vertexShader: smokeVert, fragmentShader: smokeFrag, side: THREE.BackSide, transparent: true, depthWrite: false,
          uniforms: { uCenter: { value: new THREE.Vector3(s.x, s.y, s.z) }, uRadius: { value: s.r }, uTime: { value: 0 }, uFade: { value: 0 } },
        });
        m = new THREE.Mesh(new THREE.SphereGeometry(s.r, 40, 28), mat);
        m.position.set(s.x, s.y, s.z);
        m.renderOrder = 3; m.frustumCulled = false;
        this.scene.add(m); this.smokes.set(s.id, m); this.smokeMat.push(mat);
      }
      const mat = m.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = this.time;
      const fadeIn = clamp(1 - s.bloomIn / 0.4, 0, 1);
      const fadeOut = clamp(s.remaining / 1.5, 0, 1);
      mat.uniforms.uFade.value = fadeIn * fadeOut;
    }
    for (const [id, m] of this.smokes) if (!sSeen.has(id)) { this.scene.remove(m); (m.material as THREE.Material).dispose(); m.geometry.dispose(); this.smokes.delete(id); }

    // ---- fires: crisp cell-bordered flames
    const fSeen = new Set<number>();
    for (const f of snap.fires) {
      fSeen.add(f.id);
      let grp = this.fires.get(f.id);
      if (!grp) {
        grp = new THREE.Group();
        const baseMat = new THREE.MeshBasicMaterial({ color: 0xa3260c, transparent: true, opacity: 0.85, depthWrite: false });
        const hotMat = new THREE.MeshBasicMaterial({ color: 0xff9a2a, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending });
        for (let i = 0; i < f.cells.length; i += 3) {
          const x = f.cells[i], y = f.cells[i + 1], z = f.cells[i + 2];
          const b = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0).rotateX(-Math.PI / 2), baseMat);
          b.position.set(x, y + 0.03, z);
          const h = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.86).rotateX(-Math.PI / 2), hotMat);
          h.position.set(x, y + 0.045, z);
          const flame = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.9, 5), hotMat);
          flame.position.set(x + (((i * 7) % 5) - 2) * 0.06, y + 0.4, z + (((i * 3) % 5) - 2) * 0.06);
          flame.userData.seed = i;
          grp.add(b, h, flame);
        }
        const l = new THREE.PointLight(0xff7a2a, 3, 8, 2);
        l.position.set(f.cells[0], f.cells[1] + 1, f.cells[2]);
        grp.add(l);
        this.scene.add(grp); this.fires.set(f.id, grp);
      }
      for (const ch of grp.children) {
        if (ch instanceof THREE.Mesh && ch.userData.seed !== undefined) {
          const sd = ch.userData.seed as number;
          ch.scale.set(1, 0.6 + 0.6 * Math.abs(Math.sin(this.time * 9 + sd)), 1);
        }
      }
      const fade = clamp(f.remaining / 0.8, 0, 1);
      grp.visible = fade > 0.02;
    }
    for (const [id, g] of this.fires) if (!fSeen.has(id)) { this.scene.remove(g); this.fires.delete(id); }

    // ---- dropped weapons
    const dSeen = new Set<number>();
    for (const d of snap.drops) {
      dSeen.add(d.id);
      let o = this.drops.get(d.id);
      if (!o) { const m = buildWeaponModel(d.weapon); o = m.group; this.scene.add(o); this.drops.set(d.id, o); }
      o.position.set(d.x, d.y + 0.12, d.z);
      o.rotation.set(0, d.id * 1.7, Math.PI / 2 * 0.0);
      o.rotateZ(Math.PI / 2);
      o.rotation.y += this.time * 0.8;
    }
    for (const [id, o] of this.drops) if (!dSeen.has(id)) { this.scene.remove(o); this.drops.delete(id); }

    // ---- spike
    const sp = snap.spike;
    if (sp.pos && (sp.state === 'planted' || sp.state === 'dropped' || sp.state === 'defused')) {
      this.spikeObj.visible = true;
      this.spikeObj.position.set(sp.pos.x, sp.pos.y, sp.pos.z);
      const pulse = sp.state === 'planted' ? 0.5 + 0.5 * Math.abs(Math.sin(this.time * (sp.remaining < 10 ? 10 : 4))) : 0.2;
      this.spikeLight.position.set(sp.pos.x, sp.pos.y + 0.4, sp.pos.z);
      this.spikeLight.intensity = (sp.state === 'defused' ? 0 : pulse * 4);
    } else { this.spikeObj.visible = false; this.spikeLight.intensity = 0; }

    // ---- tracers / particles / lights decay
    for (const t of this.tracers) if (t.life > 0) { t.life -= dt; (t.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, t.life / t.max) * 0.8; if (t.life <= 0) t.mesh.visible = false; }
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.life > 0) {
        p.life -= dt; p.vel.y -= p.grav * dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        p.mesh.quaternion.copy(this.camera.quaternion);
        const k = Math.max(0, p.life / p.max);
        const sc = p.mesh.scale.x;
        p.mesh.scale.setScalar(sc * (0.97 + 0.03 * k));
        p.mesh.updateMatrix();
        this.tmpColor.setHex((p.mesh.userData.color as number) ?? 0xffd9a0).multiplyScalar(k);
        this.partInst.setMatrixAt(i, k > 0 ? p.mesh.matrix : this.hideMat);
        this.partInst.setColorAt(i, this.tmpColor);
      } else this.partInst.setMatrixAt(i, this.hideMat);
    }
    this.partInst.instanceMatrix.needsUpdate = true;
    if (this.partInst.instanceColor) this.partInst.instanceColor.needsUpdate = true;
    for (const l of this.flashLights) { const life = ((l as any)._life ?? 0) - dt; (l as any)._life = life; if (life <= 0) l.intensity = 0; }
    if (this.muzzleFlashT > 0) { this.muzzleFlashT -= dt; if (this.muzzleFlashT <= 0) this.muzzleSprite.visible = false; }
    for (let i = this.pulseRings.length - 1; i >= 0; i--) {
      const r = this.pulseRings[i]; r.life -= dt;
      const k = 1 - r.life / 1.1;
      r.mesh.scale.setScalar(1 + k * 40);
      (r.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 * (1 - k));
      if (r.life <= 0) { this.scene.remove(r.mesh); this.pulseRings.splice(i, 1); }
    }

    // ---- grenade trajectory preview (practice only)
    if (practiceTrajectory && practiceTrajectory.length > 1) {
      const pos = this.trajectory.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < 60; i++) { const p = practiceTrajectory[Math.min(i, practiceTrajectory.length - 1)]; pos.setXYZ(i, p.x, p.y, p.z); }
      pos.needsUpdate = true;
      this.trajectory.visible = true;
    } else this.trajectory.visible = false;

    // ---- viewmodel
    this.updateViewmodel(dt, vm, cam);

    // ---- draw
    this.renderer.info.reset();
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    if (vm.visible && vm.weapon) {
      this.renderer.clearDepth();
      this.renderer.render(this.vmScene, this.vmCamera);
    }
    const info = this.renderer.info.render;
    this.stats.drawCalls = info.calls; this.stats.triangles = info.triangles;
  }

  private animateRig(rig: CharacterRig, p: PlayerSnap, speed: number, dt: number, camPos: THREE.Vector3): void {
    const run = Math.min(1, speed / 3.2);
    rig.phase += speed * dt * 2.3;
    const swing = Math.sin(rig.phase) * 0.75 * run;
    rig.legL.rotation.x = swing; rig.legR.rotation.x = -swing;
    const crouch = p.crouch;
    rig.body.scale.y = lerp(1, 0.74, crouch);
    rig.body.position.y = 0;
    const aim = clamp(p.pitch, -1.2, 1.2);
    const util = p.weapon === 'util';
    rig.armR.rotation.x = util ? 0.3 + swing * 0.3 : Math.PI / 2 + aim;
    rig.armR.rotation.z = util ? 0 : -0.05;
    rig.armL.rotation.x = util ? 0.3 - swing * 0.3 : Math.PI / 2 + aim * 0.9 - (p.reloading ? 0.5 : 0);
    rig.armL.rotation.z = util ? 0 : 0.42;
    rig.head.rotation.x = -aim * 0.5;
    rig.body.rotation.x = 0.06 * run;
    // melee swing
    if (p.swing && p.weapon === 'tool') rig.armR.rotation.x += Math.sin(this.time * 30) * 0.6;
    // scope glint: visible only at a narrow angle facing the viewer
    if (p.scoped && p.spotted) {
      const dx = camPos.x - p.pos.x, dz = camPos.z - p.pos.z;
      const d = Math.hypot(dx, dz) || 1;
      const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw);
      const cosA = (dx * fx + dz * fz) / d;
      rig.glint.visible = cosA > 0.985;
      if (rig.glint.visible) {
        (rig.glint.material as THREE.MeshBasicMaterial).opacity = 0.6 + 0.4 * Math.sin(this.time * 14);
        rig.glint.position.set(0.18, 1.6, -0.5);
        rig.glint.quaternion.copy(this.camera.quaternion);
        rig.glint.scale.setScalar(2 + d * 0.05);
      }
    } else rig.glint.visible = false;
  }

  // ------------------------------------------------------------------ viewmodel
  private updateViewmodel(dt: number, vm: ViewmodelState, cam: CameraState): void {
    if (vm.weapon !== this.vmWeapon) {
      if (this.vmModel) this.vmGroup.remove(this.vmModel.group);
      this.vmWeapon = vm.weapon;
      this.vmModel = vm.weapon ? buildWeaponModel(vm.weapon) : null;
      if (this.vmModel) { this.addHands(this.vmModel, vm.weapon!); this.vmGroup.add(this.vmModel.group); }
    }
    if (!this.vmModel || !vm.weapon) return;
    const def = WEAPONS[vm.weapon];
    const left = this.settings.leftHand ? -1 : 1;
    const reduce = this.settings.reduceMotion ? 0.25 : 1;
    this.bob += dt * (vm.speed > 0.5 && vm.onGround ? vm.speed * 2.3 : 0);
    const bobAmt = Math.min(1, vm.speed / 4.5) * (vm.onGround ? 1 : 0.2) * reduce;
    const bx = Math.sin(this.bob) * 0.006 * bobAmt, by = Math.abs(Math.cos(this.bob)) * 0.008 * bobAmt;

    const mdl = this.vmModel.group;
    const cls = def.cls;
    // base placement by class
    const base = new THREE.Vector3(0.12 * left, -0.13, -0.3);
    if (cls === 'pistol') base.set(0.1 * left, -0.1, -0.27);
    if (cls === 'sniper' || cls === 'dmr') base.set(0.13 * left, -0.15, -0.3);
    if (cls === 'melee') base.set(0.15 * left, -0.17, -0.36);
    mdl.scale.setScalar(cls === 'pistol' ? 0.7 : 0.62);
    // reload dip, draw rise, inspect twirl
    const dip = vm.reloading ? Math.sin(Math.min(1, vm.reloadProgress) * Math.PI) : 0;
    const draw = 1 - clamp(vm.drawProgress, 0, 1);
    const kick = Math.exp(-vm.sinceShot * 18);
    const sway = this.settings.reduceMotion ? 0 : 1;
    const swayX = clamp(vm.swayX * -0.00035, -0.03, 0.03) * sway, swayY = clamp(vm.swayY * 0.00035, -0.03, 0.03) * sway;
    mdl.position.set(base.x + bx + swayX, base.y - by - dip * 0.12 - draw * 0.25 + swayY, base.z + kick * 0.05 * (cls === 'sniper' ? 2 : 1) + (vm.interacting ? 0.05 : 0));
    mdl.rotation.set(kick * 0.07 + dip * 0.5 + draw * 0.6 + (vm.interacting ? 0.5 : 0), dip * 0.2 * left + (vm.inspect > 0 ? Math.sin(vm.inspect * 3) * 0.5 : 0), (vm.inspect > 0 ? Math.sin(vm.inspect * 2.2) * 0.4 : 0));
    // moving parts
    if (this.vmModel.mover) {
      const k2 = Math.exp(-vm.sinceShot * 9);
      if (cls === 'pistol') this.vmModel.mover.position.z = k2 * 0.03;
      else if (cls === 'sniper' || cls === 'dmr') this.vmModel.mover.position.z = (vm.sinceShot < 0.9 && vm.sinceShot > 0.25 ? Math.sin((vm.sinceShot - 0.25) * 5) * 0.05 : 0);
      else if (cls === 'shotgun') this.vmModel.mover.position.z = vm.sinceShot > 0.2 && vm.sinceShot < 0.7 ? Math.sin((vm.sinceShot - 0.2) * 6.3) * 0.12 : 0;
    }
    this.vmGroup.scale.x = left;

    // viewmodel muzzle flash
    if (vm.sinceShot < 0.045 && def.mode !== 'melee') {
      const m = this.vmModel.muzzle.getWorldPosition(new THREE.Vector3());
      this.vmMuzzle.position.copy(m); this.vmMuzzle.visible = true;
      this.vmMuzzle.scale.setScalar(0.12 + Math.random() * 0.12);
    } else this.vmMuzzle.visible = false;
    void cam;
  }

  private addHands(model: WeaponModel, id: WeaponId): void {
    const def = WEAPONS[id];
    const glove = new THREE.MeshStandardMaterial({ color: 0x1a1d21, roughness: 0.75, metalness: 0.1 });
    const sleeve = new THREE.MeshStandardMaterial({ color: 0x8a96a6, roughness: 0.85 });
    const band = new THREE.MeshBasicMaterial({ color: 0x2fe0ff });
    const g = model.group;
    const mk = (w: number, h: number, d: number, m: THREE.Material, p: THREE.Vector3, rx = 0, ry = 0): void => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      mesh.position.copy(p); mesh.rotation.set(rx, ry, 0);
      g.add(mesh);
    };
    const gr = model.gripHand, sp = model.supportHand;
    mk(0.06, 0.085, 0.1, glove, gr.clone().add(new THREE.Vector3(0.0, 0.01, 0.0)));
    mk(0.065, 0.02, 0.07, band, gr.clone().add(new THREE.Vector3(0, -0.035, 0.09)));
    mk(0.075, 0.075, 0.5, sleeve, gr.clone().add(new THREE.Vector3(0.03, -0.06, 0.36)), 0.2, -0.1);
    if (def.cls !== 'pistol' && def.cls !== 'melee') {
      mk(0.06, 0.07, 0.11, glove, sp.clone());
      mk(0.065, 0.02, 0.07, band, sp.clone().add(new THREE.Vector3(0, -0.04, 0.09)));
      mk(0.075, 0.075, 0.5, sleeve, sp.clone().add(new THREE.Vector3(-0.1, -0.1, 0.34)), 0.18, 0.28);
    } else if (def.cls === 'pistol') {
      mk(0.055, 0.07, 0.1, glove, new THREE.Vector3(-0.02, -0.065, 0.015));
      mk(0.075, 0.075, 0.5, sleeve, new THREE.Vector3(-0.07, -0.11, 0.3), 0.18, 0.3);
    }
  }

  /** Muzzle flash light bump for the local player. */
  localShotFlash(p: Vec3): void { this.flashLight(p, 0xffc070, 1.4, 0.04); }

  dispose(): void { this.renderer.dispose(); }
}

function segSphere(a: Vec3, b: Vec3, c: { x: number; y: number; z: number }, r: number): number {
  const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
  const len = Math.hypot(dx, dy, dz);
  if (len < 1e-6) return 0;
  const ux = dx / len, uy = dy / len, uz = dz / len;
  const ox = a.x - c.x, oy = a.y - c.y, oz = a.z - c.z;
  const bb = ox * ux + oy * uy + oz * uz;
  const cc = ox * ox + oy * oy + oz * oz - r * r;
  const disc = bb * bb - cc;
  if (disc <= 0) return 0;
  const s = Math.sqrt(disc);
  return Math.max(0, Math.min(len, -bb + s) - Math.max(0, -bb - s));
}

export { eyeHeight, kickNow, lineOfSight };
