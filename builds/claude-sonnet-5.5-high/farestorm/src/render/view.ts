import * as THREE from 'three';
import { ARCHETYPES, TIER_INFO } from '../sim/data';
import { clamp, damp, wrapAngle } from '../sim/math';
import { Rng } from '../sim/rng';
import type { GameEvent, Sim } from '../sim/sim';
import type { Tier } from '../sim/rules';
import type { Fare } from '../sim/fares';
import { forwardOf, rightOf } from '../sim/vehicle';
import { ChaseCamera } from './camera';
import { buildCity, type CityBuild } from './city';
import { signalState } from '../sim/traffic';
import { Particles, Skids } from './vfx';
import { TrafficRenderer, buildTaxi, setTaxiColor, type TaxiRig } from './vehicles';

export interface ViewSettings {
  shadows: boolean;
  resolutionScale: number; // 0.5..1
  dynamicRes: boolean;
  reducedMotion: boolean;
  shake: number;
  fov: number;
  crowd: boolean;
  guidance: 'route' | 'direct';
}

interface FareVis {
  group: THREE.Group;
  beacon: THREE.Mesh;
  ring: THREE.Mesh;
  sprite: THREE.Sprite;
  figure: THREE.Group;
  arm: THREE.Mesh;
  fareId: number;
  x: number;
  z: number;
  tier: Tier;
}

const TIER_HEX = (t: Tier) => TIER_INFO[t].color;

function glyphTexture(shape: string, color: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d')!;
  g.translate(64, 64);
  g.lineJoin = 'round';
  g.fillStyle = color;
  g.strokeStyle = '#10141c';
  g.lineWidth = 10;
  g.beginPath();
  if (shape === 'circle') g.arc(0, 0, 42, 0, Math.PI * 2);
  else if (shape === 'diamond') { g.moveTo(0, -52); g.lineTo(46, 0); g.lineTo(0, 52); g.lineTo(-46, 0); g.closePath(); }
  else if (shape === 'star') {
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 22 : 54; const a = -Math.PI / 2 + (i * Math.PI) / 5; if (i === 0) g.moveTo(Math.cos(a) * r, Math.sin(a) * r); else g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    g.closePath();
  } else { // flag / destination pin
    g.moveTo(0, 54); g.bezierCurveTo(-52, -6, -44, -52, 0, -52); g.bezierCurveTo(44, -52, 52, -6, 0, 54);
  }
  g.stroke();
  g.fill();
  g.fillStyle = 'rgba(255,255,255,0.55)';
  g.beginPath(); g.arc(-12, -14, 10, 0, Math.PI * 2); g.fill();
  if (shape === 'pin') { g.fillStyle = '#10141c'; g.beginPath(); g.arc(0, -6, 14, 0, Math.PI * 2); g.fill(); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function labelTexture(text: string, accent = '#ffffff'): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 96;
  const g = c.getContext('2d')!;
  g.font = '800 44px "Trebuchet MS", "Segoe UI", sans-serif';
  const w = Math.min(500, g.measureText(text).width + 40);
  g.fillStyle = 'rgba(14,18,28,0.78)';
  const x = (512 - w) / 2;
  g.beginPath(); g.roundRect(x, 14, w, 68, 20); g.fill();
  g.strokeStyle = accent; g.lineWidth = 4; g.stroke();
  g.fillStyle = '#fff';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 256, 49, 470);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class GameView {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly chase = new ChaseCamera();
  city: CityBuild;
  taxi: TaxiRig;
  traffic = new TrafficRenderer(96);
  smoke = new Particles(1400, false);
  glowFx = new Particles(900, true);
  skids = new Skids();
  private sun = new THREE.DirectionalLight(0xfff0d6, 2.6);
  private hemi = new THREE.HemisphereLight(0xcfe8ff, 0xe8d2b0, 1.5);
  private sky: THREE.Mesh;
  private skyMat: THREE.ShaderMaterial;
  private fares: FareVis[] = [];
  private destGroup = new THREE.Group();
  private destBeacon: THREE.Mesh;
  private destRing: THREE.Mesh;
  private destSprite: THREE.Sprite;
  private arrow = new THREE.Group();
  private arrowMat = new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true, opacity: 0.95 });
  private tokens: { mesh: THREE.Mesh; id: number; kind: string }[] = [];
  private labels: { sprite: THREE.Sprite; x: number; z: number; y: number }[] = [];
  private pedBody: THREE.InstancedMesh;
  private pedHead: THREE.InstancedMesh;
  private peds: { block: number; s: number; dir: number; speed: number; off: number; hop: number }[] = [];
  private time = 0;
  private lastCandKey = '';
  private lastDest = -1;
  private glyphs: Record<string, THREE.CanvasTexture> = {};
  private frameTimes: number[] = [];
  private pixelRatio = 1;
  private lastSun = -1;
  private tmpV = new THREE.Vector3();
  private rng = new Rng(77);
  private skidAcc = 0;
  private prevFwd = 0;
  private squat = 0;
  private bob = 0;
  settings: ViewSettings;
  menuMode = false;
  private taxiId = '';

  constructor(public canvas: HTMLCanvasElement, private sim: Sim, settings: ViewSettings, colorIndex: number) {
    this.settings = settings;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = settings.shadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene.background = new THREE.Color(0xf6d4aa);
    this.scene.fog = new THREE.Fog(0xf6d4aa, 160, 760);

    // lights
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = -70; sc.right = 70; sc.top = 70; sc.bottom = -70; sc.near = 10; sc.far = 330;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.5;
    this.scene.add(this.sun, this.sun.target, this.hemi);

    // sky dome
    this.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uTop: { value: new THREE.Color(0x3d9be9) }, uHor: { value: new THREE.Color(0xfbd9b0) }, uSun: { value: new THREE.Vector3(0.5, 0.5, 0.2) } },
      vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uSun; varying vec3 vD;
        void main(){ float h = clamp(vD.y,0.0,1.0); vec3 c = mix(uHor, uTop, pow(h,0.55));
          float s = max(dot(normalize(vD), normalize(uSun)),0.0); c += vec3(1.0,0.82,0.55)*pow(s,24.0)*0.5 + vec3(1.0,0.95,0.8)*pow(s,900.0)*2.0;
          // soft cloud bands
          float b = smoothstep(0.08,0.22,h)*smoothstep(0.45,0.2,h); float n = sin(vD.x*14.0+vD.z*9.0)*sin(vD.z*11.0-vD.x*5.0); c = mix(c, vec3(1.0), clamp(n,0.0,1.0)*b*0.35);
          gl_FragColor = vec4(c,1.0); }`,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1800, 24, 16), this.skyMat);
    this.sky.renderOrder = -10;
    this.scene.add(this.sky);

    // world
    this.city = buildCity(sim.world);
    this.scene.add(this.city.group);
    this.scene.add(this.traffic.group, this.smoke.points, this.glowFx.points, this.skids.mesh);

    // taxi
    this.taxi = buildTaxi(sim.spec, colorIndex);
    this.taxiId = sim.spec.id;
    this.scene.add(this.taxi.root);

    // glyph textures
    for (const t of ['short', 'medium', 'long'] as Tier[]) this.glyphs[t] = glyphTexture(TIER_INFO[t].shape, TIER_INFO[t].css);
    this.glyphs.pin = glyphTexture('pin', '#ffffff');

    // fare candidate visuals
    for (let i = 0; i < 8; i++) this.fares.push(this.makeFareVis());

    // destination visual
    this.destBeacon = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 220, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
    this.destBeacon.position.y = 110;
    this.destRing = new THREE.Mesh(new THREE.RingGeometry(7.4, 8.6, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
    this.destRing.position.y = 0.15;
    this.destSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glyphs.pin, transparent: true, depthTest: false, sizeAttenuation: false }));
    this.destSprite.scale.set(0.07, 0.07, 1);
    this.destSprite.position.y = 14;
    this.destSprite.renderOrder = 8;
    this.destGroup.add(this.destBeacon, this.destRing, this.destSprite);
    this.destGroup.visible = false;
    this.scene.add(this.destGroup);

    // route arrow: a flat chevron hovering above the roof, always drawn on top
    const sh = new THREE.Shape();
    sh.moveTo(0, 1.5); sh.lineTo(1.0, -0.2); sh.lineTo(0.38, -0.2); sh.lineTo(0.38, -1.1); sh.lineTo(-0.38, -1.1); sh.lineTo(-0.38, -0.2); sh.lineTo(-1.0, -0.2); sh.closePath();
    const ag = new THREE.ExtrudeGeometry(sh, { depth: 0.18, bevelEnabled: false });
    ag.rotateX(-Math.PI / 2); // shape +y -> world +z (forward), flat
    const body = new THREE.Mesh(ag, this.arrowMat);
    body.renderOrder = 10;
    this.arrow.add(body);
    this.arrow.renderOrder = 10;
    this.scene.add(this.arrow);

    // pickup tokens
    for (const t of sim.world.tokens) {
      const m = new THREE.Mesh(
        t.kind === 'spark' ? new THREE.OctahedronGeometry(0.9, 0) : new THREE.IcosahedronGeometry(0.8, 0),
        new THREE.MeshBasicMaterial({ color: t.kind === 'spark' ? 0xffe14d : 0x40f0ff, fog: true }),
      );
      m.position.set(t.x, 1.5, t.z);
      this.scene.add(m);
      this.tokens.push({ mesh: m, id: t.id, kind: t.kind });
    }

    // destination name labels
    for (const d of sim.world.destinations) {
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture(d.name, TIER_INFO.short.css), transparent: true, depthWrite: false, fog: false }));
      spr.scale.set(26, 4.9, 1);
      const y = d.landmark.h + 12;
      spr.position.set(d.landmark.x, y, d.landmark.z);
      spr.renderOrder = 4;
      this.scene.add(spr);
      this.labels.push({ sprite: spr, x: d.landmark.x, z: d.landmark.z, y });
    }

    // pedestrians
    const pg = new THREE.CapsuleGeometry(0.28, 0.75, 3, 6).translate(0, 0.78, 0);
    const hg = new THREE.SphereGeometry(0.22, 8, 6).translate(0, 1.62, 0);
    this.pedBody = new THREE.InstancedMesh(pg, new THREE.MeshLambertMaterial({ color: 0xffffff }), 100);
    this.pedHead = new THREE.InstancedMesh(hg, new THREE.MeshLambertMaterial({ color: 0xe8b48f }), 100);
    this.pedBody.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(300), 3);
    const shirts = [0xff5e57, 0x19b3a6, 0xffd34d, 0x2f6bff, 0xa855f7, 0xf472b6, 0x7be0b0, 0xffffff, 0x1f2a44];
    const nb = sim.world.blocks.length;
    for (let i = 0; i < 100; i++) {
      this.peds.push({ block: this.rng.int(0, nb - 1), s: this.rng.range(0, 400), dir: this.rng.chance(0.5) ? 1 : -1, speed: this.rng.range(1.1, 1.8), off: this.rng.range(0.6, 2.2), hop: 0 });
      this.pedBody.setColorAt(i, new THREE.Color(shirts[i % shirts.length]));
    }
    this.pedBody.frustumCulled = false;
    this.pedHead.frustumCulled = false;
    this.scene.add(this.pedBody, this.pedHead);

    this.resize();
  }

  // ------------------------------------------------------------------ construction helpers
  private makeFareVis(): FareVis {
    const group = new THREE.Group();
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 90, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
    beacon.position.y = 45;
    const ring = new THREE.Mesh(new THREE.RingGeometry(3.0, 3.6, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
    ring.position.y = 0.16;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glyphs.short, transparent: true, depthTest: false, sizeAttenuation: false, fog: false }));
    sprite.scale.set(0.05, 0.05, 1);
    sprite.position.y = 9;
    sprite.renderOrder = 7;
    // waiting passenger figure
    const figure = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.8, 3, 6), new THREE.MeshLambertMaterial({ color: 0xff3d81 }));
    body.position.y = 0.95;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), new THREE.MeshLambertMaterial({ color: 0xe8b48f }));
    head.position.y = 1.7;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.7, 0.14), new THREE.MeshLambertMaterial({ color: 0xe8b48f }));
    arm.position.set(0.4, 1.7, 0);
    figure.add(body, head, arm);
    figure.position.set(2.4, 0, 0);
    group.add(beacon, ring, sprite, figure);
    group.visible = false;
    this.scene.add(group);
    return { group, beacon, ring, sprite, figure, arm, fareId: -1, x: 0, z: 0, tier: 'short' };
  }

  setTaxiColor(i: number): void {
    setTaxiColor(this.taxi, i);
  }

  /** swap the simulation (new run / menu preview): rebuilds the taxi rig and clears per-run visuals */
  setSim(sim: Sim, colorIndex: number): void {
    this.sim = sim;
    this.scene.remove(this.taxi.root);
    this.taxi = buildTaxi(sim.spec, colorIndex);
    this.taxiId = sim.spec.id;
    this.scene.add(this.taxi.root);
    this.lastCandKey = '';
    this.prevFwd = 0;
    for (const f of this.fares) { f.group.visible = false; f.fareId = -1; }
    this.chase.reset();
    this.lastSun = -1;
  }

  resize(): void {
    const w = this.canvas.clientWidth || window.innerWidth, h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setPixelRatio(this.pixelRatio * Math.min(window.devicePixelRatio || 1, 2) * this.settings.resolutionScale);
    this.renderer.setSize(w, h, false);
    this.chase.cam.aspect = w / h;
    this.chase.cam.updateProjectionMatrix();
    const s = (h * this.renderer.getPixelRatio()) / (2 * Math.tan((this.chase.cam.fov * Math.PI) / 360));
    this.smoke.setScale(s);
    this.glowFx.setScale(s);
  }

  applySettings(s: ViewSettings): void {
    this.settings = s;
    this.renderer.shadowMap.enabled = s.shadows;
    this.sun.castShadow = s.shadows;
    this.chase.reducedMotion = s.reducedMotion;
    this.chase.shakeScale = s.shake;
    this.chase.fovBase = s.fov;
    this.resize();
  }

  project(x: number, y: number, z: number): { x: number; y: number; behind: boolean } {
    this.tmpV.set(x, y, z).project(this.chase.cam);
    return { x: (this.tmpV.x * 0.5 + 0.5), y: (-this.tmpV.y * 0.5 + 0.5), behind: this.tmpV.z > 1 };
  }

  // ------------------------------------------------------------------ events -> VFX
  onEvent(e: GameEvent): void {
    const v = this.sim.vehicle;
    switch (e.type) {
      case 'collision': {
        const n = Math.min(26, 6 + Math.floor(e.impact * 1.3));
        for (let i = 0; i < n; i++) {
          const a = this.rng.range(0, Math.PI * 2), sp = this.rng.range(2, 6 + e.impact * 0.4);
          this.glowFx.emit(e.x, 0.8, e.z, Math.cos(a) * sp, this.rng.range(1, 5), Math.sin(a) * sp, this.rng.range(0.25, 0.6), 0.2, 0xffc36b, 1, -0.2, 1.2, 12);
        }
        for (let i = 0; i < 8; i++) this.smoke.emit(e.x, 0.6, e.z, this.rng.range(-2, 2), this.rng.range(0.5, 2), this.rng.range(-2, 2), 0.9, 1.4, 0xd6cfc4, 0.5, 3, 2);
        this.chase.impulse(clamp(e.impact / 22, 0.1, 0.9));
        break;
      }
      case 'vehicle': {
        const ev = e.ev;
        if (ev.type === 'landing') {
          for (let i = 0; i < 16; i++) this.smoke.emit(v.x + this.rng.range(-1.2, 1.2), 0.3, v.z + this.rng.range(-2, 2), this.rng.range(-4, 4), this.rng.range(0.5, 2), this.rng.range(-4, 4), 0.8, 1.2, 0xe0d6c2, 0.55, 3, 2);
          this.chase.impulse(clamp(ev.impact / 20, 0, 0.5));
        }
        if (ev.type === 'surge' || ev.type === 'snapDrift' || ev.type === 'gripTurn') {
          for (let i = 0; i < 10; i++) this.glowFx.emit(v.x, 0.5, v.z, this.rng.range(-3, 3), this.rng.range(0.5, 2), this.rng.range(-3, 3), 0.4, 0.5, 0xfff0a0, 0.9, 0, 3);
        }
        break;
      }
      case 'delivered': {
        const colors = [0xff5e57, 0xffd34d, 0x19b3a6, 0x2f6bff, 0xff3df2, 0x7cff6b];
        const n = e.breakdown.grade === 'blazing' ? 70 : 38;
        for (let i = 0; i < n; i++) {
          const a = this.rng.range(0, Math.PI * 2), sp = this.rng.range(3, 11);
          this.glowFx.emit(v.x, 1.5, v.z, Math.cos(a) * sp, this.rng.range(6, 15), Math.sin(a) * sp, this.rng.range(0.9, 1.6), 0.2, colors[i % colors.length], 0.95, 0, 0.8, 14);
        }
        break;
      }
      case 'boarded':
        for (let i = 0; i < 24; i++) this.glowFx.emit(e.fare.pickup.x, 1, e.fare.pickup.z, this.rng.range(-3, 3), this.rng.range(2, 8), this.rng.range(-3, 3), 0.8, 0.2, TIER_HEX(e.fare.tier), 1, 0, 1.5, 6);
        break;
      case 'token':
        for (let i = 0; i < 16; i++) this.glowFx.emit(v.x, 1.5, v.z, this.rng.range(-5, 5), this.rng.range(1, 6), this.rng.range(-5, 5), 0.6, 0.2, e.kind === 'spark' ? 0xffe14d : 0x40f0ff, 1, 0, 2, 6);
        break;
      case 'respawn':
        for (let i = 0; i < 30; i++) this.glowFx.emit(v.x, 1, v.z, this.rng.range(-6, 6), this.rng.range(0, 8), this.rng.range(-6, 6), 0.7, 0.6, 0xbfe9ff, 1, 0, 2);
        break;
      default: break;
    }
  }

  // ------------------------------------------------------------------ per-frame
  update(alpha: number, dt: number, extra: { camBack?: boolean } = {}): void {
    const sim = this.sim;
    const v = sim.vehicle;
    this.time += dt;
    const x = v.px + (v.x - v.px) * alpha, z = v.pz + (v.z - v.pz) * alpha, y = v.py + (v.y - v.py) * alpha;
    const h = v.ph + wrapAngle(v.h - v.ph) * alpha;

    // taxi rig
    const t = this.taxi;
    t.root.position.set(x, y, z);
    t.root.rotation.y = h;
    const accel = (v.fwd - this.prevFwd) / Math.max(dt, 1e-3);
    this.prevFwd = v.fwd;
    this.squat = damp(this.squat, clamp(-accel * 0.0035, -0.07, 0.07), 7, dt);
    this.bob = damp(this.bob, v.surface === 'cobble' || v.surface === 'sand' ? Math.sin(this.time * 60) * Math.min(0.03, v.speed * 0.001) : 0, 20, dt);
    t.body.rotation.x = -v.pitch + this.squat;
    t.body.rotation.z = v.roll;
    t.body.position.y = this.bob;
    const spin = v.fwd / t.wheelRadius * dt;
    for (const w of t.wheels) w.rotation.x += spin;
    for (const p of t.steerPivots) p.rotation.y = -v.steer * 0.5;
    t.turbine.rotation.y += dt * (3 + v.speed * 0.5);
    t.boostGlow.visible = v.boosting;
    if (v.boosting) t.boostGlow.scale.set(1, 1, 0.8 + Math.random() * 0.5);
    t.brakeMat.color.setHex(this.lastBrake ? 0xff2a2a : 0x7a1414);
    t.passenger.visible = !!sim.trip;
    if (sim.trip) {
      const m = (t.passenger.children[1] as THREE.Mesh).material as THREE.MeshLambertMaterial;
      m.color.setHex(ARCHETYPES[sim.trip.fare.archetype].shirt);
      t.displayMat.color.setHex(TIER_HEX(sim.trip.fare.tier));
    } else t.displayMat.color.setHex(0x40f0ff);

    // camera
    this.chase.setLookBack(!!extra.camBack);
    if (!this.menuMode) this.chase.update(v, alpha, dt, sim.world, v.boosting, sim.phase === 'countdown');

    // sun & sky progression
    const prog = clamp(sim.time / (sim.mode === 'quick' ? 300 : 420), 0, 1);
    this.updateSun(prog, x, z);
    this.sky.position.copy(this.chase.cam.position);
    this.city.waterMat.uniforms.uTime.value = this.time;

    // traffic
    this.traffic.update(sim.traffic.agents, alpha);

    // signals (recolour only when phase changes)
    this.updateSignals();

    // vfx
    this.updateVfx(dt, x, y, z, h);
    this.smoke.update(dt);
    this.glowFx.update(dt);

    // fares, destination, arrow
    this.updateFareVisuals(dt, x, z);
    this.updateArrow(x, y, z);
    this.updateTokens();
    this.updateLabels();
    this.updatePeds(dt, x, z);
  }
  private lastBrake = false;
  setBrake(b: boolean): void {
    this.lastBrake = b;
  }

  private sigAcc = 0;
  private updateSignals(): void {
    this.sigAcc += 1;
    if (this.sigAcc % 8 !== 0) return;
    const heads = this.city.signalHeads;
    const map = this.city.signalMap;
    const tm = this.sim.traffic.time;
    const c = new THREE.Color();
    for (let i = 0; i < map.length; i++) {
      const s = signalState(map[i].node, map[i].axis, tm);
      c.setHex(s === 0 ? 0x30ff7a : s === 1 ? 0xffd23a : 0xff3b3b);
      heads.setColorAt(i, c);
    }
    if (heads.instanceColor) heads.instanceColor.needsUpdate = true;
  }

  private updateSun(prog: number, px: number, pz: number): void {
    const el = 0.78 - prog * 0.38; // elevation (radians-ish) drops toward sunset
    const az = 0.9 + prog * 0.35;
    const dir = new THREE.Vector3(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)).normalize();
    this.sun.position.set(px + dir.x * 160, dir.y * 160, pz + dir.z * 160);
    this.sun.target.position.set(px, 0, pz);
    if (Math.abs(prog - this.lastSun) < 0.01) return;
    this.lastSun = prog;
    const warm = new THREE.Color().setHex(0xfff0d6).lerp(new THREE.Color(0xffb27a), prog);
    this.sun.color.copy(warm);
    this.sun.intensity = 2.6 - prog * 0.5;
    this.hemi.intensity = 1.5 - prog * 0.2;
    const hor = new THREE.Color(0xfbdcb4).lerp(new THREE.Color(0xff9d78), prog);
    const top = new THREE.Color(0x3d9be9).lerp(new THREE.Color(0x6a62d6), prog);
    this.skyMat.uniforms.uHor.value.copy(hor);
    this.skyMat.uniforms.uTop.value.copy(top);
    this.skyMat.uniforms.uSun.value.copy(dir);
    (this.scene.fog as THREE.Fog).color.copy(hor);
    (this.scene.background as THREE.Color).copy(hor);
    (this.city.waterMat.uniforms.uFog.value as THREE.Color).copy(hor);
  }

  private updateVfx(dt: number, x: number, y: number, z: number, h: number): void {
    const v = this.sim.vehicle;
    const spec = v.surface;
    const [fx, fz] = forwardOf(h);
    const [rx, rz] = rightOf(h);
    const rearOff = -this.sim.spec.length / 2 + 0.85;
    const sliding = !v.airborne && v.speed > 7 && (Math.abs(v.slip) > 0.22 || (v.drifting && Math.abs(v.slip) > 0.1));
    if (sliding) {
      for (const s of [-1, 1]) {
        const wx = x + fx * rearOff + rx * s * (this.sim.spec.width / 2 - 0.15), wz = z + fz * rearOff + rz * s * (this.sim.spec.width / 2 - 0.15);
        if (this.rng.chance(0.75)) this.smoke.emit(wx, 0.3, wz, this.rng.range(-1, 1) - v.vx * 0.15, this.rng.range(0.6, 1.8), this.rng.range(-1, 1) - v.vz * 0.15, this.rng.range(0.7, 1.2), 0.9, 0xe9e5de, 0.5, 2.6, 1.8);
        this.skidAcc += v.speed * dt;
        if (this.skidAcc > 0.9) { this.skids.add(wx, wz, Math.atan2(v.vx, v.vz)); }
      }
      if (this.skidAcc > 0.9) this.skidAcc = 0;
    }
    if (!v.airborne && v.speed > 9 && (spec === 'sand' || spec === 'grass' || spec === 'shallow')) {
      const col = spec === 'sand' ? 0xe9cf90 : spec === 'grass' ? 0x6ccf86 : 0xbfe9ff;
      for (let i = 0; i < 2; i++) this.smoke.emit(x + fx * rearOff, 0.4, z + fz * rearOff, this.rng.range(-1.5, 1.5) - v.vx * 0.2, this.rng.range(1, 3), this.rng.range(-1.5, 1.5) - v.vz * 0.2, 0.8, 1.1, col, 0.6, 2.4, 2);
    }
    if (v.boosting) {
      for (let i = 0; i < 3; i++) this.glowFx.emit(x + fx * (rearOff - 0.6) + rx * this.rng.range(-0.35, 0.35), 0.6 + y, z + fz * (rearOff - 0.6) + rz * this.rng.range(-0.35, 0.35), -fx * 6 + this.rng.range(-0.5, 0.5), this.rng.range(-0.2, 0.5), -fz * 6 + this.rng.range(-0.5, 0.5), 0.45, 0.9, i % 2 ? 0x7ef6ff : 0xff9af2, 0.85, -1.2, 2);
    }
    if (this.sim.speedKmh > 90 && this.rng.chance(0.4) && !this.settings.reducedMotion) {
      // wind streaks drifting past the cab
      const a = this.rng.range(0, Math.PI * 2), r = this.rng.range(3, 7);
      this.glowFx.emit(x + fx * 6 + Math.cos(a) * r, y + this.rng.range(0.5, 3.5), z + fz * 6 + Math.sin(a) * r, -fx * v.speed, 0, -fz * v.speed, 0.18, 0.18, 0xffffff, 0.35, 0, 0);
    }
  }

  private updateFareVisuals(dt: number, px: number, pz: number): void {
    const sim = this.sim;
    const cands = sim.trip ? [] : sim.fares.candidates;
    const key = cands.map((c) => c.id).join(',');
    if (key !== this.lastCandKey) {
      this.lastCandKey = key;
      cands.forEach((c, i) => this.bindFare(this.fares[i], c));
      for (let i = cands.length; i < this.fares.length; i++) { this.fares[i].group.visible = false; this.fares[i].fareId = -1; }
    }
    for (let i = 0; i < cands.length && i < this.fares.length; i++) {
      const fv = this.fares[i];
      const d = Math.hypot(fv.x - px, fv.z - pz);
      const pulse = 1 + Math.sin(this.time * 4 + i) * 0.06;
      fv.ring.scale.setScalar(pulse);
      fv.beacon.visible = d > 14;
      (fv.beacon.material as THREE.MeshBasicMaterial).opacity = clamp(d / 160, 0.18, 0.42);
      const s = d < 40 ? 0.04 : d < 500 ? 0.05 : 0.04;
      fv.sprite.scale.set(s, s, 1);
      fv.sprite.position.y = 6 + clamp(d * 0.02, 0, 14);
      fv.sprite.visible = d < 560 && d > 8;
      fv.arm.rotation.z = Math.sin(this.time * 7 + i) * 0.6 - 0.6;
      fv.arm.position.y = 1.7 + Math.sin(this.time * 7 + i) * 0.08;
      fv.figure.rotation.y = Math.atan2(px - fv.x, pz - fv.z) - 0.4;
      fv.figure.position.y = Math.abs(Math.sin(this.time * 3 + i)) * 0.06;
    }
    // destination
    const trip = sim.trip;
    this.destGroup.visible = !!trip;
    if (trip) {
      const d = trip.fare.dest;
      this.destGroup.position.set(d.x, 0, d.z);
      const col = TIER_HEX(trip.fare.tier);
      (this.destBeacon.material as THREE.MeshBasicMaterial).color.setHex(col);
      (this.destRing.material as THREE.MeshBasicMaterial).color.setHex(col);
      this.destRing.scale.setScalar(1 + Math.sin(this.time * 5) * 0.05);
      const dist = Math.hypot(d.x - px, d.z - pz);
      (this.destSprite.material as THREE.SpriteMaterial).color.setHex(col);
      this.destSprite.position.y = 8 + clamp(dist * 0.03, 0, 24);
      this.destSprite.visible = dist > 16;
      const sc = clamp(0.07 - dist * 0.00002, 0.045, 0.07);
      this.destSprite.scale.set(sc, sc, 1);
      this.destBeacon.visible = dist > 18;
      if (this.lastDest !== d.id) this.lastDest = d.id;
    }
    void dt;
  }

  private bindFare(fv: FareVis, f: Fare): void {
    fv.fareId = f.id;
    fv.x = f.pickup.x; fv.z = f.pickup.z; fv.tier = f.tier;
    fv.group.position.set(f.pickup.x, 0, f.pickup.z);
    fv.group.visible = true;
    const col = TIER_HEX(f.tier);
    (fv.beacon.material as THREE.MeshBasicMaterial).color.setHex(col);
    (fv.ring.material as THREE.MeshBasicMaterial).color.setHex(col);
    (fv.sprite.material as THREE.SpriteMaterial).map = this.glyphs[f.tier];
    (fv.sprite.material as THREE.SpriteMaterial).needsUpdate = true;
    const a = ARCHETYPES[f.archetype];
    const body = fv.figure.children[0] as THREE.Mesh;
    (body.material as THREE.MeshLambertMaterial).color.setHex(a.shirt);
    ((fv.figure.children[1] as THREE.Mesh).material as THREE.MeshLambertMaterial).color.setHex(a.skin);
    ((fv.figure.children[2] as THREE.Mesh).material as THREE.MeshLambertMaterial).color.setHex(a.skin);
    // ring height = visual stop ring (5 m) vs required 3.5 m: draw the stop radius
    fv.ring.scale.setScalar(1);
  }

  private updateArrow(x: number, y: number, z: number): void {
    const g = this.sim.phase === 'running' ? this.sim.guidance(this.settings.guidance === 'direct') : null;
    this.arrow.visible = !!g;
    if (!g) return;
    const ang = Math.atan2(g.x - x, g.z - z);
    this.arrow.position.set(x, y + 2.9 + Math.sin(this.time * 5) * 0.08, z);
    this.arrow.rotation.y = ang;
    const col = g.kind === 'dest' && this.sim.trip ? TIER_HEX(this.sim.trip.fare.tier) : 0xffffff;
    this.arrowMat.color.setHex(col);
    this.arrow.scale.setScalar(g.kind === 'dest' ? 1.0 : 0.75);
  }

  private updateTokens(): void {
    for (const tk of this.tokens) {
      const gone = this.sim.collected.has(tk.id);
      tk.mesh.visible = !gone;
      if (!gone) {
        tk.mesh.rotation.y += 0.04;
        tk.mesh.position.y = 1.6 + Math.sin(this.time * 3 + tk.id) * 0.25;
      }
    }
  }

  private updateLabels(): void {
    const c = this.chase.cam.position;
    for (const l of this.labels) {
      const d = Math.hypot(l.x - c.x, l.z - c.z);
      const op = d < 120 ? d / 120 : d > 340 ? 0 : 1 - (d - 120) / 220;
      l.sprite.visible = op > 0.04;
      (l.sprite.material as THREE.SpriteMaterial).opacity = clamp(op, 0, 1) * 0.95;
      const s = clamp(d / 160, 0.7, 1.9);
      l.sprite.scale.set(26 * s, 4.9 * s, 1);
    }
  }

  private updatePeds(dt: number, px: number, pz: number): void {
    const w = this.sim.world;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    let n = 0;
    const show = this.settings.crowd;
    for (const p of this.peds) {
      const blk = w.blocks[p.block];
      const r = blk.rect;
      const ins = 1.5 + p.off * 0.35;
      const W = r.maxX - r.minX - ins * 2, H = r.maxZ - r.minZ - ins * 2;
      const P = 2 * (W + H);
      p.s = (p.s + p.dir * p.speed * dt + P) % P;
      let x: number, z: number, dx: number, dz: number;
      const s = p.s;
      if (s < W) { x = r.minX + ins + s; z = r.minZ + ins; dx = 1; dz = 0; }
      else if (s < W + H) { x = r.maxX - ins; z = r.minZ + ins + (s - W); dx = 0; dz = 1; }
      else if (s < 2 * W + H) { x = r.maxX - ins - (s - W - H); z = r.maxZ - ins; dx = -1; dz = 0; }
      else { x = r.minX + ins; z = r.maxZ - ins - (s - 2 * W - H); dx = 0; dz = -1; }
      const d = Math.hypot(x - px, z - pz);
      if (!show || d > 170) continue;
      // hop away when the taxi is close and fast
      let ox = 0, oz = 0;
      if (d < 6 && this.sim.vehicle.speed > 4) { p.hop = 0.5; }
      if (p.hop > 0) { p.hop -= dt; const k = Math.sin((p.hop / 0.5) * Math.PI) * 0.8; ox = (x - px) / Math.max(d, 0.1) * 1.2; oz = (z - pz) / Math.max(d, 0.1) * 1.2; x += ox; z += oz; e.set(0, 0, 0); m.makeTranslation(x, k, z); }
      const yaw = Math.atan2(p.dir * dx, p.dir * dz);
      const bob = Math.abs(Math.sin(this.time * 6 + p.block)) * 0.07;
      e.set(0, yaw, 0);
      q.setFromEuler(e);
      m.compose(this.tmpV.set(x, bob + (p.hop > 0 ? Math.sin((p.hop / 0.5) * Math.PI) * 0.8 : 0), z), q, new THREE.Vector3(1, 1, 1));
      this.pedBody.setMatrixAt(n, m);
      this.pedHead.setMatrixAt(n, m);
      n++;
    }
    this.pedBody.count = this.pedHead.count = n;
    this.pedBody.instanceMatrix.needsUpdate = true;
    this.pedHead.instanceMatrix.needsUpdate = true;
    if (this.pedBody.instanceColor) this.pedBody.instanceColor.needsUpdate = true;
  }

  // ------------------------------------------------------------------ draw
  render(frameMs: number): void {
    // dynamic resolution
    if (this.settings.dynamicRes) {
      this.frameTimes.push(frameMs);
      if (this.frameTimes.length >= 45) {
        const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
        this.frameTimes.length = 0;
        const before = this.pixelRatio;
        if (avg > 20 && this.pixelRatio > 0.55) this.pixelRatio = Math.max(0.55, this.pixelRatio - 0.1);
        else if (avg < 13 && this.pixelRatio < 1) this.pixelRatio = Math.min(1, this.pixelRatio + 0.05);
        if (this.pixelRatio !== before) this.resize();
      }
    }
    this.renderer.render(this.scene, this.chase.cam);
  }

  get info(): { calls: number; tris: number; ratio: number } {
    const i = this.renderer.info.render;
    return { calls: i.calls, tris: i.triangles, ratio: this.pixelRatio };
  }

  dispose(): void {
    this.renderer.dispose();
  }
}
