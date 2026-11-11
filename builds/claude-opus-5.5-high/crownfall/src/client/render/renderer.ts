// Three.js renderer behind a small abstraction. Render state is a pure view of interpolated snapshots.
import * as THREE from 'three';
import { buildMap, MapView } from './mapView';
import { Particles, ZoneDecal, Transients, projLook } from './vfx';
import { buildHero, animateHero, HeroRig, minionGeometry, monsterGeometry, structureGeometry, vcMat, teamColor, MinionGeoKind } from './models';
import { setFogTarget, stepFog, fogUniforms, lambert } from './fogShader';
import type { InterpEnt } from '../runtime/session';
import type { Snapshot, GameEvent, StructureView } from '../../protocol/messages';
import { K, ST } from '../../protocol/messages';
import type { HeroId } from '../../shared/types';
import { clamp } from '../../shared/math';

export interface IndicatorSpec {
  kind: 'none' | 'direction' | 'point' | 'unit' | 'self' | 'ricochet';
  range: number; width?: number; radius?: number; length?: number;
  cursor: { x: number; y: number }; bounce?: Array<{ x: number; y: number }>;
}

interface HeroView { rig: HeroRig; heroId: HeroId; lastAn: number; animStart: number; team: number; deadAt: number; decoy: boolean; lastSeen: number }
interface Fading { obj: THREE.Object3D; t: number }

const PITCH = (52 * Math.PI) / 180;
const YAW = (45 * Math.PI) / 180;
export const CAM_FWD = new THREE.Vector3(Math.cos(YAW), 0, -Math.sin(YAW));
export const CAM_RIGHT = new THREE.Vector3(Math.sin(YAW), 0, Math.cos(YAW));

export class GameRenderer {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  map: MapView;
  particles: Particles;
  transients = new Transients();
  camTarget = new THREE.Vector3(-60, 0, 0);
  height = 34;
  shakeAmt = 0;
  shakeOn = true;
  colorblind = false;
  myTeam: 0 | 1 = 0;
  meId = 0;
  time = 0;
  ents: InterpEnt[] = [];
  entsById = new Map<number, InterpEnt>();
  contextLost = false;
  onContextLost: (() => void) | null = null;
  drawCalls = 0;
  triangles = 0;
  private heroes = new Map<number, HeroView>();
  private minionIM = new Map<MinionGeoKind, { body: THREE.InstancedMesh; accent: THREE.InstancedMesh }>();
  private monsters = new Map<number, THREE.Mesh>();
  private monsterGeo = new Map<string, THREE.BufferGeometry>();
  private structs = new Map<string, { body: THREE.Mesh; crystal: THREE.Mesh; bubble: THREE.Mesh; rubble: THREE.Mesh; h: number; crystalMat: THREE.MeshLambertMaterial; alive: boolean }>();
  private wards = new Map<number, THREE.Group>();
  private walls = new Map<number, THREE.Mesh>();
  private projs = new Map<number, { mesh: THREE.Mesh; look: ReturnType<typeof projLook> }>();
  private zones = new Map<number, ZoneDecal>();
  private zonePool: ZoneDecal[] = [];
  private anchorBeams = new Map<number, THREE.Mesh>();
  private rings: THREE.InstancedMesh;
  private shadows: THREE.InstancedMesh;
  private fading: Fading[] = [];
  private killedIds = new Set<number>();
  private mat4 = new THREE.Matrix4();
  private v3 = new THREE.Vector3();
  private col = new THREE.Color();
  private indRange: THREE.Mesh;
  private indAim: ZoneDecal;
  private indCircle: ZoneDecal;
  private indLine: THREE.Line;
  private towerRange: THREE.Mesh;
  private lowFx: boolean;
  private raycaster = new THREE.Raycaster();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  constructor(canvas: HTMLCanvasElement, quality: 'low' | 'high') {
    this.lowFx = quality === 'low';
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: quality === 'high', powerPreference: 'high-performance', preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === 'high' ? 1.5 : 1));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.contextLost = true; this.onContextLost?.(); });
    this.camera = new THREE.PerspectiveCamera(45, 16 / 9, 1, 500);
    this.scene.background = new THREE.Color(0x0b1430);
    this.scene.fog = new THREE.Fog(0x0b1430, 90, 220);
    this.scene.add(new THREE.HemisphereLight(0xcfe2ff, 0x4a3460, 1.45));
    const sun = new THREE.DirectionalLight(0xfff0d8, 1.6);
    sun.position.set(-40, 80, 30);
    this.scene.add(sun);
    this.map = buildMap(quality);
    this.scene.add(this.map.group);
    this.particles = new Particles(quality === 'high' ? 6000 : 2000);
    this.scene.add(this.particles.points, this.transients.group);
    // instanced minions
    for (const k of ['guard', 'bolt', 'siege', 'vanguard'] as MinionGeoKind[]) {
      const g = minionGeometry(k);
      const body = new THREE.InstancedMesh(g.body, vcMat(), 90);
      const accent = new THREE.InstancedMesh(g.accent, lambert(0xffffff, { emissive: new THREE.Color(0x222222) }), 90);
      body.count = 0; accent.count = 0;
      body.frustumCulled = false; accent.frustumCulled = false;
      accent.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(90 * 3), 3);
      this.scene.add(body, accent);
      this.minionIM.set(k, { body, accent });
    }
    // team rings & blob shadows
    this.rings = new THREE.InstancedMesh(new THREE.RingGeometry(0.82, 1, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.85, depthWrite: false }), 220);
    this.rings.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(220 * 3), 3);
    this.rings.frustumCulled = false; this.rings.renderOrder = 4;
    this.shadows = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false }), 220);
    this.shadows.frustumCulled = false; this.shadows.renderOrder = 3;
    this.scene.add(this.rings, this.shadows);
    // indicators
    this.indRange = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.6, depthWrite: false }));
    this.indRange.renderOrder = 6; this.indRange.visible = false;
    this.towerRange = new THREE.Mesh(new THREE.RingGeometry(0.96, 1, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xff4a3a, transparent: true, opacity: 0.5, depthWrite: false }));
    this.towerRange.renderOrder = 6; this.towerRange.visible = false;
    this.indAim = new ZoneDecal(); this.indAim.mesh.visible = false;
    this.indCircle = new ZoneDecal(); this.indCircle.mesh.visible = false;
    this.indLine = new THREE.Line(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(8 * 3), 3)), new THREE.LineBasicMaterial({ color: 0xffd08a, transparent: true, opacity: 0.9 }));
    this.indLine.visible = false;
    this.scene.add(this.indRange, this.towerRange, this.indAim.mesh, this.indCircle.mesh, this.indLine);
  }

  setSize(w: number, h: number) {
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // ------------------------------------------------------------------ camera
  updateCamera() {
    this.camTarget.x = clamp(this.camTarget.x, -72, 72);
    this.camTarget.z = clamp(this.camTarget.z, -55, 55);
    const horiz = this.height / Math.tan(PITCH);
    const sx = this.shakeOn && this.shakeAmt > 0 ? (Math.random() - 0.5) * this.shakeAmt : 0;
    const sz = this.shakeOn && this.shakeAmt > 0 ? (Math.random() - 0.5) * this.shakeAmt : 0;
    this.camera.position.set(this.camTarget.x - CAM_FWD.x * horiz + sx, this.height, this.camTarget.z - CAM_FWD.z * horiz + sz);
    this.camera.lookAt(this.camTarget.x + sx, 0, this.camTarget.z + sz);
    this.camera.updateMatrixWorld();
  }
  pan(dx: number, dz: number) { this.camTarget.x += dx; this.camTarget.z += dz; }
  centerOn(x: number, z: number) { this.camTarget.set(x, 0, z); }
  zoom(delta: number) { this.height = clamp(this.height + delta, 28, 42); }

  screenToGround(mx: number, my: number): { x: number; y: number } {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((mx - rect.left) / rect.width) * 2 - 1, -((my - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const hit = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.groundPlane, hit);
    return { x: hit.x, y: hit.z };
  }
  worldToScreen(x: number, h: number, z: number): { x: number; y: number; on: boolean } {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.v3.set(x, h, z).project(this.camera);
    return { x: (this.v3.x * 0.5 + 0.5) * rect.width, y: (-this.v3.y * 0.5 + 0.5) * rect.height, on: this.v3.z < 1 && Math.abs(this.v3.x) < 1.2 && Math.abs(this.v3.y) < 1.2 };
  }
  /** Screen-space pick of the nearest entity under the cursor. */
  pick(mx: number, my: number, filter: (e: InterpEnt) => boolean): InterpEnt | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const px = mx - rect.left, py = my - rect.top;
    let best: InterpEnt | null = null, bd = Infinity;
    const pxPerM = rect.height / (2 * Math.tan((22.5 * Math.PI) / 180) * (this.height / Math.sin(PITCH)));
    for (const e of this.ents) {
      if (e.k === K.Proj || e.k === K.Zone || !filter(e)) continue;
      const big = e.k === K.Tower || e.k === K.Core || e.k === K.Seal || e.k === K.Engine;
      const hh = big ? 2.5 : e.k === K.Hero ? 1.3 : 0.7;
      const s = this.worldToScreen(e.x, hh, e.y);
      const rad = Math.max(16, ((e.r ?? 0.5) + (big ? 1.2 : 0.55)) * pxPerM);
      const d = Math.hypot(s.x - px, s.y - py);
      if (d < rad && d < bd) { bd = d; best = e; }
    }
    return best;
  }

  // ------------------------------------------------------------------ frame
  frame(dt: number, time: number, ents: InterpEnt[], snap: Snapshot | null, ind: IndicatorSpec | null, showRanges: boolean) {
    if (this.contextLost) return;
    this.time = time;
    this.ents = ents;
    this.entsById.clear();
    for (const e of ents) this.entsById.set(e.id, e);
    const t = performance.now() / 1000;
    this.shakeAmt = Math.max(0, this.shakeAmt - dt * 1.5);
    this.updateCamera();
    stepFog(dt);
    for (const f of this.map.animated) f(t);
    const seen = new Set<number>();
    let ringN = 0, shadowN = 0;
    const counts = new Map<MinionGeoKind, number>();
    const addRing = (x: number, z: number, r: number, color: number, alpha = 1) => {
      if (ringN >= 220) return;
      this.mat4.compose(this.v3.set(x, 0.06, z), new THREE.Quaternion(), new THREE.Vector3(r, 1, r));
      this.rings.setMatrixAt(ringN, this.mat4);
      this.col.set(color).multiplyScalar(alpha);
      this.rings.setColorAt(ringN, this.col);
      ringN++;
    };
    const addShadow = (x: number, z: number, r: number) => {
      if (shadowN >= 220) return;
      this.mat4.compose(this.v3.set(x, 0.04, z), new THREE.Quaternion(), new THREE.Vector3(r, 1, r));
      this.shadows.setMatrixAt(shadowN++, this.mat4);
    };
    for (const e of ents) {
      seen.add(e.id);
      const tc = teamColor(e.tm, this.colorblind);
      switch (e.k) {
        case K.Hero: case K.Decoy: {
          const v = this.heroView(e);
          const dead = (e.st & ST.dead) !== 0;
          v.rig.root.visible = !dead || time - v.deadAt < 2.5;
          if (dead && v.deadAt === 0) v.deadAt = time;
          if (!dead) v.deadAt = 0;
          v.rig.root.position.set(e.x, 0, e.y);
          v.rig.root.rotation.y = -e.f + Math.PI / 2;
          const an = dead ? 5 : e.an ?? 0;
          if (an !== v.lastAn || (e.at ?? 0) !== v.animStart) { v.lastAn = an; v.animStart = e.at ?? time; }
          animateHero(v.rig, an, t, dead ? time - v.deadAt : time - v.animStart, v.heroId);
          const glow = (e.st & ST.glint) ? 1.6 + Math.sin(t * 12) * 0.6 : (e.st & ST.channel) ? 2 : 0.9;
          for (const g of v.rig.glowMats) g.emissiveIntensity = glow;
          v.lastSeen = time;
          if (!dead) { addRing(e.x, e.y, (e.r ?? 0.5) + 0.45, e.id === this.meId ? 0x7dff8a : tc); addShadow(e.x, e.y, (e.r ?? 0.5) + 0.25); }
          break;
        }
        case K.Minion: {
          const kind = (e.sub ?? 'guard') as MinionGeoKind;
          const im = this.minionIM.get(kind);
          if (!im) break;
          const n = counts.get(kind) ?? 0;
          if (n >= 90) break;
          counts.set(kind, n + 1);
          const bob = Math.abs(Math.sin(t * 8 + e.id)) * ((e.an ?? 0) === 1 ? 0.06 : 0.01);
          const lean = (e.an ?? 0) === 2 ? 0.25 * Math.max(0, 1 - (time - (e.at ?? 0)) * 3) : 0;
          const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -e.f + Math.PI / 2, 0)).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(lean, 0, 0)));
          const sc = kind === 'siege' ? 1.25 : 1.15;
          this.mat4.compose(this.v3.set(e.x, bob, e.y), q, new THREE.Vector3(sc, sc, sc));
          im.body.setMatrixAt(n, this.mat4); im.accent.setMatrixAt(n, this.mat4);
          this.col.set(tc); if (e.st & ST.empowered) this.col.lerp(new THREE.Color(0xff5ae0), 0.6);
          im.accent.setColorAt(n, this.col);
          addRing(e.x, e.y, (e.r ?? 0.45) + 0.3, tc, 0.7);
          addShadow(e.x, e.y, (e.r ?? 0.45) + 0.15);
          break;
        }
        case K.Monster: {
          let m = this.monsters.get(e.id);
          if (!m) {
            let g = this.monsterGeo.get(e.sub!);
            if (!g) { g = monsterGeometry(e.sub!); this.monsterGeo.set(e.sub!, g); }
            m = new THREE.Mesh(g, vcMat());
            this.scene.add(m);
            this.monsters.set(e.id, m);
          }
          const hover = e.sub === 'mistlings' || e.sub?.startsWith('catalyst') || e.sub === 'buffSpring' ? Math.sin(t * 2 + e.id) * 0.2 + 0.2 : 0;
          m.position.set(e.x, hover, e.y);
          m.rotation.y = -e.f + Math.PI / 2;
          if (e.sub?.startsWith('catalyst')) m.rotation.y = t * 0.5;
          const atk = (e.an ?? 0) === 2 ? Math.max(0, 1 - (time - (e.at ?? 0)) * 2.5) : 0;
          m.scale.setScalar(1 + atk * 0.08);
          m.visible = true;
          addRing(e.x, e.y, (e.r ?? 0.6) + 0.3, 0xf2d15c, 0.6);
          addShadow(e.x, e.y, (e.r ?? 0.6) + 0.2);
          break;
        }
        case K.Ward: {
          let w = this.wards.get(e.id);
          if (!w) {
            w = new THREE.Group();
            w.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 1.0, 5).translate(0, 0.5, 0), lambert(0x8a6a2c)));
            const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), new THREE.MeshBasicMaterial({ color: tc }));
            orb.position.y = 1.15; w.add(orb);
            this.scene.add(w); this.wards.set(e.id, w);
          }
          w.position.set(e.x, Math.sin(t * 3 + e.id) * 0.05, e.y);
          w.children[1].rotation.y = t * 2;
          addRing(e.x, e.y, 0.6, tc, 0.6);
          break;
        }
        case K.Wall: {
          let w = this.walls.get(e.id);
          if (!w) {
            w = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 1.8, 7).translate(0, 0.9, 0), lambert(0xd8ccb4, { emissive: new THREE.Color(0x3a2a10) }));
            this.scene.add(w); this.walls.set(e.id, w);
            this.transients.flash(e.x, e.y, 1.2, 0.4, 0xffc46b);
          }
          const age = time - e.born;
          w.position.set(e.x, Math.min(0, -1.8 + age * 9), e.y);
          addShadow(e.x, e.y, 0.9);
          break;
        }
        case K.Proj: this.updateProj(e, dt); break;
        case K.Zone: this.updateZone(e, time); break;
        default: break;
      }
    }
    // remove stale
    for (const [id, v] of this.heroes) if (!seen.has(id)) {
      if (this.killedIds.has(id)) { this.fading.push({ obj: v.rig.root, t: 0 }); } else this.scene.remove(v.rig.root);
      this.heroes.delete(id);
    }
    for (const [id, m] of this.monsters) if (!seen.has(id)) { if (this.killedIds.has(id)) this.fading.push({ obj: m, t: 0 }); else this.scene.remove(m); this.monsters.delete(id); }
    for (const [id, w] of this.wards) if (!seen.has(id)) { this.scene.remove(w); this.wards.delete(id); }
    for (const [id, w] of this.walls) if (!seen.has(id)) { this.scene.remove(w); this.walls.delete(id); this.particles.emit(w.position.x, 0.8, w.position.z, 10, new THREE.Color(0xd8ccb4), { speed: 3, grav: 9 }); }
    for (const [id, p] of this.projs) if (!seen.has(id)) { this.scene.remove(p.mesh); this.projs.delete(id); }
    for (const [id, z] of this.zones) if (!seen.has(id)) { this.scene.remove(z.mesh); this.zones.delete(id); this.zonePool.push(z); const b = this.anchorBeams.get(id); if (b) { this.scene.remove(b); this.anchorBeams.delete(id); } }
    for (const [k, im] of this.minionIM) {
      const n = counts.get(k) ?? 0;
      im.body.count = n; im.accent.count = n;
      im.body.instanceMatrix.needsUpdate = true; im.accent.instanceMatrix.needsUpdate = true;
      if (im.accent.instanceColor) im.accent.instanceColor.needsUpdate = true;
    }
    this.rings.count = ringN; this.rings.instanceMatrix.needsUpdate = true; if (this.rings.instanceColor) this.rings.instanceColor.needsUpdate = true;
    this.shadows.count = shadowN; this.shadows.instanceMatrix.needsUpdate = true;
    for (let i = this.fading.length - 1; i >= 0; i--) {
      const f = this.fading[i]; f.t += dt;
      f.obj.position.y -= dt * 1.2; f.obj.scale.multiplyScalar(1 - dt * 0.8);
      if (f.t > 1.2) { this.scene.remove(f.obj); this.fading.splice(i, 1); }
    }
    if (snap) this.updateStructures(snap.structures, t, snap);
    // tower range readability: show the nearest enemy tower range when close
    const me = this.entsById.get(this.meId);
    if (me) this.map.treeFade(me.x, me.y, this.camera.position.x, this.camera.position.z, dt);
    this.towerRange.visible = false;
    if (me && snap) {
      for (const s of snap.structures) {
        if (!s.alive || s.team === this.myTeam || (s.tier !== 'outer' && s.tier !== 'inner' && s.tier !== 'guard' && s.tier !== 'core')) continue;
        const d = Math.hypot(s.x - me.x, s.y - me.y);
        if (d < 14) { this.towerRange.visible = true; this.towerRange.position.set(s.x, 0.08, s.y); this.towerRange.scale.set(8.5, 1, 8.5); (this.towerRange.material as THREE.MeshBasicMaterial).opacity = clamp((14 - d) / 5, 0.15, 0.75); break; }
      }
    }
    this.updateIndicator(ind, me ?? null, showRanges);
    this.particles.update(dt);
    this.transients.update(dt);
    // local brush transparency
    (this.map.brushMat as THREE.MeshLambertMaterial).opacity = me && (me.st & ST.inBrush) ? 0.45 : 0.95;
    this.renderer.render(this.scene, this.camera);
    this.drawCalls = this.renderer.info.render.calls;
    this.triangles = this.renderer.info.render.triangles;
  }

  setFog(vis: Uint8Array) { setFogTarget(vis); }
  setFogEnabled(on: boolean) { fogUniforms.uFogOn.value = on ? 1 : 0; }

  private heroView(e: InterpEnt): HeroView {
    let v = this.heroes.get(e.id);
    if (!v) {
      const id = (e.sub ?? 'brannoch') as HeroId;
      const rig = buildHero(id);
      const decoy = e.k === K.Decoy;
      if (decoy) for (const m of rig.allMats) { m.transparent = true; (m as THREE.MeshLambertMaterial).opacity = 0.45; }
      this.scene.add(rig.root);
      v = { rig, heroId: id, lastAn: -1, animStart: 0, team: e.tm, deadAt: 0, decoy, lastSeen: 0 };
      this.heroes.set(e.id, v);
    }
    return v;
  }

  private updateProj(e: InterpEnt, dt: number) {
    let p = this.projs.get(e.id);
    const tc = teamColor(e.tm, this.colorblind);
    if (!p) {
      const look = projLook(e.sub ?? '', e.tm, tc);
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ color: look.color, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
      mesh.scale.set(look.size * look.stretch, look.size, look.size);
      this.scene.add(mesh);
      p = { mesh, look };
      this.projs.set(e.id, p);
    }
    const h = e.sub === 'tower-shot' ? 2.5 : e.sub?.startsWith('atk') ? 1.2 : 1.0;
    p.mesh.position.set(e.x, h, e.y);
    p.mesh.rotation.y = -e.f;
    if (p.look.trail && (!this.lowFx || Math.random() < 0.35)) this.particles.emit(e.x, h, e.y, 1, this.col.set(p.look.trail), { speed: 0.3, life: 0.35, size: p.look.size * 2.2, up: 0.2, spread: 0.1 });
    void dt;
  }

  private updateZone(e: InterpEnt, time: number) {
    let z = this.zones.get(e.id);
    if (!z) {
      z = this.zonePool.pop() ?? new ZoneDecal();
      this.scene.add(z.mesh);
      this.zones.set(e.id, z);
    }
    const u = z.mat.uniforms;
    const hostile = (e.st & 1) !== 0;
    const enemy = e.tm !== this.myTeam;
    let color = hostile ? (enemy ? (e.tm === 2 ? 0xffa020 : 0xff3a2a) : teamColor(e.tm, this.colorblind)) : 0x6fe0ff;
    const sub = e.sub ?? '';
    if (sub === 'hush') color = enemy ? 0xb06bff : 0x9f8bff;
    if (sub === 'fen') color = enemy ? 0x9fff4a : 0x7fd16b;
    if (sub === 'footnote') color = 0xff6ad5;
    if (sub === 'migration') color = enemy ? 0xff5a8a : 0xbff6ff;
    u.uColor.value.set(color);
    u.uTime.value = performance.now() / 1000;
    const dur = Math.max(0.01, (e.t1 ?? time) - (e.at ?? time));
    const prog = clamp((time - (e.at ?? time)) / dur, 0, 1);
    const tele = sub.endsWith('-tele') || sub.endsWith('slam') || sub.startsWith('draft-ring') || sub === 'prism-mark';
    u.uProgress.value = tele ? prog : 0;
    u.uHostile.value = hostile && enemy ? 1 : 0;
    u.uRing.value = sub.startsWith('draft-ring') ? 1 : 0;
    u.uAlpha.value = sub === 'anchor-line' ? 0.8 : 1;
    if (e.r !== undefined) {
      u.uRect.value = 0; u.uSize.value.set(e.r * 2, e.r * 2);
      z.mesh.scale.set(e.r * 2, e.r * 2, 1);
      z.mesh.rotation.set(-Math.PI / 2, 0, 0);
    } else {
      u.uRect.value = 1; u.uSize.value.set(e.h ?? 1, e.w ?? 1);
      z.mesh.scale.set(e.h ?? 1, e.w ?? 1, 1);
      z.mesh.rotation.set(-Math.PI / 2, 0, -(e.ang ?? 0));
    }
    z.mesh.position.set(e.x, 0.1 + (e.id % 7) * 0.004, e.y);
    if (sub === 'anchor-line' && e.own) {
      const o = this.entsById.get(e.own);
      let b = this.anchorBeams.get(e.id);
      if (!b) { b = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xffc46b, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false })); this.scene.add(b); this.anchorBeams.set(e.id, b); }
      if (o) {
        const len = Math.hypot(e.x - o.x, e.y - o.y);
        b.position.set((e.x + o.x) / 2, 1.0, (e.y + o.y) / 2);
        b.rotation.set(-Math.PI / 2, 0, -Math.atan2(e.y - o.y, e.x - o.x));
        b.scale.set(len, 0.18, 1);
      }
    }
    if (sub === 'fen' && Math.random() < (this.lowFx ? 0.2 : 0.6)) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * (e.r ?? 1);
      this.particles.emit(e.x + Math.cos(a) * r, 0.2, e.y + Math.sin(a) * r, 1, this.col.set(0x8fd16b), { speed: 0.4, life: 0.9, size: 0.5, up: 0.6 });
    }
    if (sub === 'migration' && Math.random() < 0.9) {
      const off = (Math.random() - 0.5) * (e.w ?? 8);
      const ang = e.ang ?? 0;
      this.particles.emit(e.x - Math.sin(ang) * off, 1 + Math.random(), e.y + Math.cos(ang) * off, 2, this.col.set(0xe0f4ff), { speed: 1, life: 0.6, size: 0.35, up: 0.5 });
    }
  }

  private updateStructures(list: StructureView[], t: number, snap: Snapshot) {
    for (const s of list) {
      let v = this.structs.get(s.key);
      if (!v) {
        const g = structureGeometry(s.tier);
        const body = new THREE.Mesh(g.body, vcMat());
        const crystalMat = lambert(teamColor(s.team, this.colorblind), { emissive: new THREE.Color(teamColor(s.team, this.colorblind)), emissiveIntensity: 0.9 });
        const crystal = new THREE.Mesh(g.crystal, crystalMat);
        const bubble = new THREE.Mesh(new THREE.SphereGeometry(s.tier === 'engine' ? 4 : 2.6, 20, 14), new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending }));
        bubble.position.y = 1.5;
        const rubble = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 0), lambert(0x9c917c));
        rubble.scale.set(1.4, 0.45, 1.4); rubble.position.y = 0.3;
        const grp = new THREE.Group();
        grp.add(body, crystal, bubble, rubble);
        grp.position.set(s.x, 0, s.y);
        this.scene.add(grp);
        v = { body, crystal, bubble, rubble, h: g.height, crystalMat, alive: s.alive };
        this.structs.set(s.key, v);
      }
      if (v.alive && !s.alive) {
        this.particles.emit(s.x, 3, s.y, this.lowFx ? 40 : 140, new THREE.Color(0xe8dcc0), { speed: 7, life: 1.4, size: 0.9, grav: 6, spread: 1.5 });
        this.particles.emit(s.x, 3, s.y, this.lowFx ? 20 : 60, new THREE.Color(teamColor(s.team, this.colorblind)), { speed: 5, life: 1.2, size: 0.7, up: 2 });
        this.transients.ring(s.x, s.y, 1, 9, 0.9, 0xffe0a0);
        this.shake(0.8);
      }
      v.alive = s.alive;
      v.body.visible = s.alive; v.crystal.visible = s.alive; v.rubble.visible = !s.alive;
      v.bubble.visible = s.alive && s.invuln && (s.tier === 'seal' || s.tier === 'engine' || s.tier === 'core');
      if (s.tier === 'engine') { v.crystal.rotation.y = t * 0.6; v.crystal.position.y = Math.sin(t * 1.4) * 0.15; }
      if (s.tier === 'seal') v.crystal.rotation.y = t * 1.2;
      if (s.tier !== 'engine' && s.tier !== 'seal') { v.crystal.rotation.y = t * 0.8; }
      v.crystalMat.emissiveIntensity = 0.7 + Math.sin(t * 2) * 0.2;
    }
    void snap;
  }

  private updateIndicator(ind: IndicatorSpec | null, me: InterpEnt | null, showRanges: boolean) {
    this.indRange.visible = false; this.indAim.mesh.visible = false; this.indCircle.mesh.visible = false; this.indLine.visible = false;
    if (!me) return;
    if (showRanges && (!ind || ind.kind === 'none')) {
      this.indRange.visible = true;
      const r = (me as any).range ?? 0;
      this.indRange.position.set(me.x, 0.09, me.y);
      this.indRange.scale.set(r || 2, 1, r || 2);
    }
    if (!ind || ind.kind === 'none') return;
    this.indRange.visible = ind.range > 0;
    this.indRange.position.set(me.x, 0.09, me.y);
    this.indRange.scale.set(ind.range, 1, ind.range);
    const dx = ind.cursor.x - me.x, dy = ind.cursor.y - me.y, d = Math.hypot(dx, dy) || 1;
    if (ind.kind === 'direction') {
      const len = ind.length ?? ind.range, w = ind.width ?? 1;
      const u = this.indAim.mat.uniforms;
      u.uColor.value.set(0x9fe8ff); u.uRect.value = 1; u.uSize.value.set(len, w); u.uHostile.value = 0; u.uProgress.value = 0; u.uAlpha.value = 0.9; u.uRing.value = 0;
      this.indAim.mesh.visible = true;
      this.indAim.mesh.scale.set(len, w, 1);
      this.indAim.mesh.position.set(me.x + (dx / d) * len / 2, 0.11, me.y + (dy / d) * len / 2);
      this.indAim.mesh.rotation.set(-Math.PI / 2, 0, -Math.atan2(dy, dx));
    } else if (ind.kind === 'ricochet' && ind.bounce) {
      this.indLine.visible = true;
      const pa = this.indLine.geometry.getAttribute('position') as THREE.BufferAttribute;
      const n = Math.min(8, ind.bounce.length);
      for (let i = 0; i < n; i++) pa.setXYZ(i, ind.bounce[i].x, 0.3, ind.bounce[i].y);
      pa.needsUpdate = true;
      this.indLine.geometry.setDrawRange(0, n);
      this.indLine.geometry.computeBoundingSphere();
    } else if (ind.kind === 'point' || ind.kind === 'self') {
      const r = ind.radius ?? 1;
      let cx = ind.cursor.x, cy = ind.cursor.y;
      if (ind.kind === 'self') { cx = me.x; cy = me.y; }
      else if (d > ind.range) { cx = me.x + (dx / d) * ind.range; cy = me.y + (dy / d) * ind.range; }
      const u = this.indCircle.mat.uniforms;
      u.uColor.value.set(0x9fe8ff); u.uRect.value = 0; u.uSize.value.set(r * 2, r * 2); u.uHostile.value = 0; u.uProgress.value = 0; u.uAlpha.value = 0.9; u.uRing.value = 0;
      this.indCircle.mesh.visible = true;
      this.indCircle.mesh.scale.set(r * 2, r * 2, 1);
      this.indCircle.mesh.position.set(cx, 0.12, cy);
      this.indCircle.mesh.rotation.set(-Math.PI / 2, 0, 0);
    }
  }

  shake(a: number) { if (this.shakeOn) this.shakeAmt = Math.min(1.2, this.shakeAmt + a); }

  /** Presentation for authoritative events (damage already applied server-side). */
  handleEvents(events: GameEvent[]) {
    const C = (c: number) => this.col.set(c).clone();
    const n = (hi: number) => (this.lowFx ? Math.ceil(hi / 3) : hi);
    for (const ev of events) {
      switch (ev.e) {
        case 'death': {
          this.killedIds.add(ev.id);
          const c = ev.k === K.Hero ? 0xffffff : ev.k === K.Monster ? 0xf2d15c : 0xe8dcc0;
          this.particles.emit(ev.x, 1, ev.y, n(ev.k === K.Hero ? 50 : 14), C(c), { speed: ev.k === K.Hero ? 4 : 2.5, life: 0.9, size: 0.5, grav: 3 });
          if (ev.k === K.Hero) this.transients.ring(ev.x, ev.y, 0.5, 4, 0.8, 0xffffff);
          break;
        }
        case 'level': this.transients.ring(ev.x, ev.y, 0.5, 2.2, 0.8, 0xffd36b); this.particles.emit(ev.x, 0.3, ev.y, n(24), C(0xffd36b), { speed: 1, up: 3, life: 1, size: 0.35 }); break;
        case 'heal': this.particles.emit(ev.x, 0.5, ev.y, n(Math.min(16, 4 + ev.amt / 20)), C(0xffd86b), { speed: 0.5, up: 2.5, life: 0.9, size: 0.35, spread: 0.8 }); break;
        case 'shield': this.transients.ring(ev.x, ev.y, 0.6, 1.4, 0.5, 0x7fe0ff, 1.0); this.particles.emit(ev.x, 1.2, ev.y, n(10), C(0x9ff0ff), { speed: 1.2, life: 0.6, size: 0.4 }); break;
        case 'recall': if (ev.x > -900) { if (ev.done) this.particles.emit(ev.x, 1, ev.y, n(40), C(0x9fe8ff), { speed: 2, up: 3, life: 0.8 }); else this.transients.ring(ev.x, ev.y, 1.6, 0.4, 1.0, 0x9fe8ff); } break;
        case 'ward': this.transients.ring(ev.x, ev.y, 0.3, 9, 0.9, 0xffe680); break;
        case 'attack': {
          if (!ev.ranged) {
            const tgt = this.entsById.get(ev.tgt);
            if (tgt && Math.random() < (this.lowFx ? 0.3 : 1)) this.particles.emit(tgt.x, 1, tgt.y, 3, C(0xffe0b0), { speed: 2, life: 0.25, size: 0.3 });
          }
          break;
        }
        case 'fx': this.fx(ev as Extract<GameEvent, { e: 'fx' }>, n); break;
        default: break;
      }
    }
    if (this.killedIds.size > 500) this.killedIds.clear();
  }

  private fx(ev: Extract<GameEvent, { e: 'fx' }>, n: (v: number) => number) {
    const C = (c: number) => new THREE.Color(c);
    const tr = this.transients;
    const x = ev.x, y = ev.y;
    const ang = ev.x2 !== undefined ? Math.atan2(ev.y2! - y, ev.x2! - x) : 0;
    switch (ev.kind) {
      case 'fault-hammer': tr.beam(x, y, ev.x2!, ev.y2!, 3.2, 0.35, 0xffc46b, 0.15); this.particles.emit((x + ev.x2!) / 2, 0.3, (y + ev.y2!) / 2, n(36), C(0xd8ccb4), { speed: 5, grav: 10, life: 0.7, size: 0.5, spread: 2 }); this.shake(0.3); break;
      case 'citybreaker': tr.ring(x, y, 0.5, 4.5, 0.6, 0xffc46b); tr.flash(x, y, 4, 0.5, 0xffa040); this.particles.emit(x, 0.4, y, n(90), C(0xd8ccb4), { speed: 8, grav: 12, life: 1, size: 0.7, spread: 3 }); this.shake(0.9); break;
      case 'rampart': this.particles.emit(x, 0.5, y, n(30), C(0xd8ccb4), { speed: 3, grav: 8, life: 0.7, spread: 3 }); break;
      case 'anchor-pull': tr.beam(x, y, ev.x2!, ev.y2!, 0.4, 0.4, 0xffc46b, 1.0); break;
      case 'stone-stack': tr.ring(x, y, 0.6, 1.5, 0.5, 0xd8ccb4); break;
      case 'bounce': this.particles.emit(x, 1, y, n(10), C(0xffb36b), { speed: 3, life: 0.3, size: 0.3 }); break;
      case 'parcel': tr.ring(x, y, 1.2, 0.5, 0.4, 0xff8a3a, 1.2); break;
      case 'parcel-boom': tr.flash(x, y, 3, 0.4, 0xff8a3a); tr.ring(x, y, 0.5, 3.2, 0.45, 0xffd06b); this.particles.emit(x, 1, y, n(50), C(0xffa040), { speed: 6, life: 0.6, size: 0.6 }); this.shake(0.25); break;
      case 'redline-hit': this.particles.emit(x, 1.2, y, n(40), C(0xff5a3a), { speed: 6, life: 0.5, size: 0.6 }); break;
      case 'draft': tr.ring(x, y, 0.5, 1.8, 0.5, 0x9ff0ff); break;
      case 'kesh-mark': tr.ring(x, y, 1.5, 0.6, 0.35, 0xb6ff6e, 2.0); break;
      case 'cleave1': case 'cleave2': tr.sector(x, y, ang, 3.6, (50 * Math.PI) / 180, 0.25, ev.kind === 'cleave2' ? 0xd6ff6e : 0xa0e060); break;
      case 'bogskin': tr.ring(x, y, 1.2, 1.2, 2.5, 0x7a9a4a); break;
      case 'bog-burst': tr.flash(x, y, 4, 0.4, 0x8fbf4a); tr.ring(x, y, 0.5, 4, 0.5, 0xb6ff6e); this.particles.emit(x, 0.5, y, n(40), C(0x6a8a3a), { speed: 5, grav: 6, life: 0.7 }); break;
      case 'sinkstep': this.particles.emit(x, 0.2, y, n(25), C(0x6a5a3a), { speed: 3, grav: 6, life: 0.6 }); break;
      case 'emerge': this.particles.emit(x, 0.2, y, n(25), C(0x8a7a4a), { speed: 4, grav: 6, life: 0.6 }); tr.ring(x, y, 0.5, 2, 0.4, 0xb6ff6e); break;
      case 'fen-cast': tr.ring(x, y, 1, ev.r ?? 7, 0.6, 0x9fff4a); break;
      case 'annotation': this.particles.emit(x, 2.4, y, n(6 * (ev.r ?? 1)), C(0xff6ad5), { speed: 1, life: 0.6, size: 0.4, up: 1 }); break;
      case 'margin-burst': tr.flash(x, y, 2.2, 0.35, 0xff6ad5); this.particles.emit(x, 1.4, y, n(36), C(0xff9ae8), { speed: 5, life: 0.5, size: 0.5 }); break;
      case 'redaction': tr.beam(x, y, ev.x2!, ev.y2!, 3, 0.35, 0x2a1030, 0.2); tr.beam(x, y, ev.x2!, ev.y2!, 0.6, 0.4, 0xff6ad5, 0.25); break;
      case 'footnote-echo': tr.ring(x, y, 0.5, 2, 0.4, 0xff6ad5); break;
      case 'draft-ring': tr.ring(x, y, (ev.r ?? 3) * 0.7, ev.r ?? 3, 0.4, 0xffe7c0); this.particles.emit(x, 0.4, y, n(24), C(0xf5ecd8), { speed: 4, life: 0.5, spread: ev.r ?? 3 }); break;
      case 'erase': this.particles.emit(x, 1, y, n(10), C(0x222222), { speed: 2, life: 0.4 }); break;
      case 'shardstep': tr.beam(x, y, ev.x2!, ev.y2!, 0.3, 0.3, 0xc8f6ff, 1.0); this.particles.emit(ev.x2!, 1, ev.y2!, n(20), C(0xc8f6ff), { speed: 4, life: 0.4, size: 0.35 }); break;
      case 'cut-light': tr.sector(x, y, ang, 4.2, (40 * Math.PI) / 180, 0.3, 0xc8f6ff); break;
      case 'swap': tr.beam(x, y, ev.x2!, ev.y2!, 0.15, 0.4, 0xc8f6ff, 1.2); this.particles.emit(ev.x2!, 1, ev.y2!, n(24), C(0xc8f6ff), { speed: 3, life: 0.5 }); break;
      case 'decoy-pop': this.particles.emit(x, 1, y, n(30), C(0xc8f6ff), { speed: 4, life: 0.5, size: 0.4 }); break;
      case 'prism-strike': tr.beam(ev.x2!, ev.y2!, x, y, 0.5, 0.35, 0xe8ffff, 1.2); tr.flash(x, y, 2, 0.3, 0xc8f6ff); this.particles.emit(x, 1.2, y, n(50), C(0xc8f6ff), { speed: 7, life: 0.5, size: 0.5 }); this.shake(0.3); break;
      case 'prism-weak': this.particles.emit(x, 1.2, y, n(14), C(0x88a0b0), { speed: 3, life: 0.4 }); break;
      case 'ward-disabled': tr.ring(x, y, 1, 0.3, 0.5, 0x444444); break;
      case 'blink': this.particles.emit(x, 1, y, n(20), C(0xc8f6ff), { speed: 2, life: 0.4 }); if (ev.x2 !== undefined) this.particles.emit(ev.x2, 1, ev.y2!, n(20), C(0xc8f6ff), { speed: 2, life: 0.4 }); break;
      case 'mend': this.particles.emit(x, 0.3, y, n(30), C(0xffd86b), { speed: 0.6, up: 3, life: 1.1, size: 0.4, spread: 1 }); break;
      case 'scorch': this.particles.emit(x, 1, y, n(20), C(0xff6a3d), { speed: 2, up: 2, life: 0.7 }); break;
      case 'reap': tr.beam(ev.x2!, ev.y2!, x, y, 0.25, 0.3, 0xff6ad5, 1.2); tr.flash(x, y, 1.5, 0.3, 0xff6ad5); break;
      case 'cleanse': tr.ring(x, y, 0.5, 2, 0.5, 0xffffff); break;
      case 'slam': tr.flash(x, y, ev.r ?? 3, 0.4, 0xffa020); tr.ring(x, y, 0.5, ev.r ?? 3, 0.5, 0xffd080); this.particles.emit(x, 0.3, y, n(40), C(0xd8ccb4), { speed: 5, grav: 8, spread: ev.r ?? 3 }); break;
      case 'buff-gain': this.particles.emit(x, 0.5, y, n(30), C(0xffcf6b), { speed: 1, up: 3, life: 1 }); break;
      case 'monster-reset': this.particles.emit(x, 1, y, n(10), C(0xffffff), { speed: 1, life: 0.5 }); break;
      case 'respawn': tr.ring(x, y, 0.5, 2.5, 0.6, 0x9fe8ff); break;
      case 'tower-target': break;
      case 'proj-wall': this.particles.emit(x, 1, y, n(8), C(0xffe0b0), { speed: 2, life: 0.3 }); break;
      case 'marked': tr.ring(x, y, 2, 0.6, 0.5, 0x9ff0ff, 2.2); break;
      case 'ult-warning': if (ev.r) tr.ring(x, y, ev.r * 0.2, ev.r, 0.6, 0xff3a2a); break;
      default: break;
    }
  }

  dispose() {
    this.renderer.dispose();
    this.scene.traverse((o) => { const m = o as THREE.Mesh; if (m.geometry) m.geometry.dispose(); });
  }
}
