import * as THREE from 'three';
import { TAXI_COLORS, type TaxiSpec } from '../sim/data';
import { TRAFFIC_COLORS, VEHICLE_TYPES, type Agent } from '../sim/traffic';
import { Geo } from './geo';

export interface TaxiRig {
  root: THREE.Group; // world position + yaw
  body: THREE.Group; // pitch / roll / bob
  wheels: THREE.Group[]; // spin groups
  steerPivots: THREE.Group[]; // front wheel steering
  turbine: THREE.Group;
  display: THREE.Mesh;
  displayMat: THREE.MeshBasicMaterial;
  brakeMat: THREE.MeshBasicMaterial;
  headMat: THREE.MeshBasicMaterial;
  passenger: THREE.Group;
  boostGlow: THREE.Mesh;
  spec: TaxiSpec;
  bodyMat: THREE.MeshLambertMaterial;
  trimMat: THREE.MeshLambertMaterial;
  wheelRadius: number;
  halfTrack: number;
  wheelZ: number[];
}

const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);

export function buildTaxi(spec: TaxiSpec, colorIndex: number): TaxiRig {
  const pal = TAXI_COLORS[colorIndex % TAXI_COLORS.length];
  const L = spec.length, W = spec.width;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const bodyMat = new THREE.MeshLambertMaterial({ color: pal.body });
  const trimMat = new THREE.MeshLambertMaterial({ color: pal.trim });
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x23272f });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x1d3b4a });
  const add = (g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = body) => {
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };
  // chassis: lower sill in trim colour, upper body in body colour (stepped for a chunky silhouette)
  add(box(W, 0.32, L), trimMat, 0, 0.38, 0);
  add(box(W * 0.98, 0.46, L * 0.98), bodyMat, 0, 0.78, 0);
  // hood and trunk slopes
  const hoodLen = spec.id === 'gull' ? 0.9 : 1.2;
  add(box(W * 0.94, 0.14, hoodLen), bodyMat, 0, 1.05, L / 2 - hoodLen / 2 - 0.1);
  add(box(W * 0.94, 0.16, spec.id === 'tempest' ? 0.5 : 0.9), bodyMat, 0, 1.05, -L / 2 + 0.55);
  // cabin
  const cabLen = spec.id === 'tempest' ? L * 0.68 : spec.id === 'gull' ? L * 0.52 : L * 0.5;
  const cabZ = spec.id === 'tempest' ? -0.35 : -0.15;
  add(box(W * 0.9, 0.56, cabLen), glassMat, 0, 1.3, cabZ);
  add(box(W * 0.94, 0.1, cabLen * 0.96), bodyMat, 0, 1.62, cabZ);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(box(0.1, 0.56, 0.1), bodyMat, sx * W * 0.45, 1.3, cabZ + sz * cabLen * 0.5);
  // body stripe: wave dashes along the flanks
  for (const sx of [-1, 1]) for (let k = 0; k < 5; k++) add(box(0.04, 0.12, 0.34), trimMat, sx * (W / 2 + 0.01), 0.82, -L / 2 + 0.5 + k * ((L - 1) / 4));
  // roof turbine (rotating) + fare display
  const turbine = new THREE.Group();
  turbine.position.set(0, 1.84, cabZ - 0.2);
  add(new THREE.CylinderGeometry(0.2, 0.26, 0.2, 10), darkMat, 0, 0, 0, turbine);
  for (let k = 0; k < 4; k++) {
    const blade = add(box(0.62, 0.05, 0.16), trimMat, 0, 0.14, 0, turbine);
    blade.rotation.y = (k / 4) * Math.PI * 2;
    blade.position.set(Math.cos((k / 4) * Math.PI * 2) * 0.28, 0.14, Math.sin((k / 4) * Math.PI * 2) * -0.28);
  }
  body.add(turbine);
  const displayMat = new THREE.MeshBasicMaterial({ color: 0x2ee6a0 });
  const display = add(box(0.82, 0.2, 0.3), displayMat, 0, 1.78, cabZ + cabLen * 0.18 + 0.15);
  display.castShadow = false;
  // lights
  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff4c8 });
  const brakeMat = new THREE.MeshBasicMaterial({ color: 0x7a1414 });
  for (const sx of [-1, 1]) {
    add(box(0.34, 0.16, 0.06), headMat, sx * (W / 2 - 0.3), 0.8, L / 2 + 0.01).castShadow = false;
    add(box(0.34, 0.14, 0.06), brakeMat, sx * (W / 2 - 0.3), 0.85, -L / 2 - 0.01).castShadow = false;
  }
  add(box(W * 0.9, 0.2, 0.06), darkMat, 0, 0.5, L / 2 + 0.02); // grille
  // driver + passenger silhouettes
  const driver = new THREE.Group();
  add(new THREE.SphereGeometry(0.17, 8, 6), new THREE.MeshLambertMaterial({ color: 0xe8b48f }), 0, 1.35, 0, driver);
  add(box(0.34, 0.34, 0.2), new THREE.MeshLambertMaterial({ color: 0x2d3a52 }), 0, 1.08, 0, driver);
  driver.position.set(-W * 0.2, 0.02, cabZ + cabLen * 0.18);
  body.add(driver);
  const passenger = new THREE.Group();
  passenger.visible = false;
  add(new THREE.SphereGeometry(0.17, 8, 6), new THREE.MeshLambertMaterial({ color: 0xe8b48f }), 0, 1.35, 0, passenger);
  add(box(0.34, 0.34, 0.2), new THREE.MeshLambertMaterial({ color: 0xff3d81 }), 0, 1.08, 0, passenger);
  passenger.position.set(W * 0.2, 0.02, cabZ - cabLen * 0.2);
  body.add(passenger);
  // wheels
  const wheelR = 0.36;
  const wheelZ = [L / 2 - 0.85, -L / 2 + 0.85];
  const wheels: THREE.Group[] = [];
  const steerPivots: THREE.Group[] = [];
  const tyre = new THREE.CylinderGeometry(wheelR, wheelR, 0.26, 14).rotateZ(Math.PI / 2);
  const rim = new THREE.CylinderGeometry(wheelR * 0.55, wheelR * 0.55, 0.28, 8).rotateZ(Math.PI / 2);
  const rimMat = new THREE.MeshLambertMaterial({ color: pal.trim });
  const halfTrack = W / 2 - 0.1;
  for (const wz of wheelZ) for (const sx of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(sx * halfTrack, wheelR, wz);
    const spin = new THREE.Group();
    add(tyre, darkMat, 0, 0, 0, spin);
    add(rim, rimMat, 0, 0, 0, spin).castShadow = false;
    pivot.add(spin);
    root.add(pivot);
    wheels.push(spin);
    if (wz > 0) steerPivots.push(pivot);
  }
  // boost flame
  const boostGlow = new THREE.Mesh(new THREE.ConeGeometry(0.4, 2.6, 8).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x7ef6ff, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }));
  boostGlow.position.set(0, 0.55, -L / 2 - 1.3);
  boostGlow.visible = false;
  body.add(boostGlow);
  // blob shadow (kept even with real shadows for grounding)
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.5, L * 1.25).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }));
  blob.position.y = 0.09;
  root.add(blob);
  return { root, body, wheels, steerPivots, turbine, display, displayMat, brakeMat, headMat, passenger, boostGlow, spec, bodyMat, trimMat, wheelRadius: wheelR, halfTrack, wheelZ };
}

export function setTaxiColor(rig: TaxiRig, colorIndex: number): void {
  const pal = TAXI_COLORS[colorIndex % TAXI_COLORS.length];
  rig.bodyMat.color.setHex(pal.body);
  rig.trimMat.color.setHex(pal.trim);
}

// ----------------------------------------------------------------------------- traffic
function trafficGeometry(type: number): THREE.BufferGeometry {
  const g = new Geo();
  const vt = VEHICLE_TYPES[type];
  const L = vt.len, W = vt.wid;
  const WHITE = 0xffffff, GLASS = 0x26414f, DARK = 0x20242b;
  const wheelR = type >= 3 ? 0.5 : 0.34;
  const body = (y0: number, h: number, len: number, z: number, wid = W, col = WHITE) => g.box(0, y0, z, wid, h, len, col, { noBottom: true });
  const wheels = (zs: number[]) => { for (const z of zs) for (const sx of [-1, 1]) g.box(sx * (W / 2 - 0.05), 0, z, 0.3, wheelR * 2, wheelR * 2, DARK); };
  switch (type) {
    case 0: // hatch
      body(0.3, 0.7, L, 0);
      body(1.0, 0.55, L * 0.56, -0.2, W * 0.92, GLASS);
      body(1.55, 0.08, L * 0.5, -0.2, W * 0.95, WHITE);
      wheels([L / 2 - 0.7, -L / 2 + 0.7]);
      break;
    case 1: // sedan
      body(0.3, 0.7, L, 0);
      body(1.0, 0.52, L * 0.5, -0.15, W * 0.92, GLASS);
      body(1.52, 0.08, L * 0.44, -0.15, W * 0.95, WHITE);
      wheels([L / 2 - 0.8, -L / 2 + 0.8]);
      break;
    case 2: // van
      body(0.35, 0.85, L, 0);
      body(1.2, 0.7, L * 0.72, -0.4, W * 0.94, GLASS);
      body(1.88, 0.1, L * 0.7, -0.4, W * 0.98, WHITE);
      wheels([L / 2 - 0.9, -L / 2 + 0.9]);
      break;
    case 3: // truck: cab + cargo
      body(0.45, 1.5, 2.2, L / 2 - 1.1);
      body(1.4, 0.7, 1.8, L / 2 - 1.2, W * 0.9, GLASS);
      g.box(0, 0.7, -1.1, W, 2.4, L - 2.5, 0xe9e4d8, { noBottom: true });
      wheels([L / 2 - 1.2, -L / 2 + 1.0, -L / 2 + 2.3]);
      break;
    default: // bus
      body(0.45, 2.5, L, 0);
      body(1.3, 0.9, L * 0.96, 0, W * 1.01, GLASS);
      g.box(0, 2.95, 0, W * 0.96, 0.12, L * 0.98, 0xf4f0e6);
      wheels([L / 2 - 1.6, -L / 2 + 1.8]);
      break;
  }
  return g.build();
}

export class TrafficRenderer {
  group = new THREE.Group();
  meshes: THREE.InstancedMesh[] = [];
  private tmp = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private p = new THREE.Vector3();
  private s = new THREE.Vector3();
  private col = new THREE.Color();
  private e = new THREE.Euler();
  private counts: number[] = [];
  constructor(max = 90) {
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    for (let t = 0; t < VEHICLE_TYPES.length; t++) {
      const m = new THREE.InstancedMesh(trafficGeometry(t), mat, max);
      m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3);
      m.castShadow = true;
      m.frustumCulled = false;
      m.count = 0;
      this.meshes.push(m);
      this.group.add(m);
    }
  }
  update(agents: Agent[], alpha: number): void {
    this.counts = this.meshes.map(() => 0);
    for (const a of agents) {
      if (!a.alive) continue;
      const m = this.meshes[a.type];
      const i = this.counts[a.type]++;
      if (i >= m.instanceMatrix.count) continue;
      const x = a.px + (a.x - a.px) * alpha, z = a.pz + (a.z - a.pz) * alpha;
      let dh = a.h - a.ph;
      while (dh > Math.PI) dh -= Math.PI * 2;
      while (dh < -Math.PI) dh += Math.PI * 2;
      const h = a.ph + dh * alpha;
      const tilt = a.state === 'wreck' ? Math.min(0.12, Math.hypot(a.vx, a.vz) * 0.01) : 0;
      this.e.set(tilt, h, tilt * 0.6, 'YXZ');
      this.q.setFromEuler(this.e);
      const sc = Math.min(1, a.fade);
      this.p.set(x, 0, z);
      this.s.set(sc, sc, sc);
      this.tmp.compose(this.p, this.q, this.s);
      m.setMatrixAt(i, this.tmp);
      this.col.setHex(TRAFFIC_COLORS[a.color % TRAFFIC_COLORS.length]);
      m.setColorAt(i, this.col);
    }
    for (let t = 0; t < this.meshes.length; t++) {
      const m = this.meshes[t];
      m.count = Math.min(this.counts[t], m.instanceMatrix.count);
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  }
}
