/** Procedural, original low-poly models: heroes, minions, monsters, structures. No external assets. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const TEAM_COLOR = [0x3aa8ff, 0xff5a4a];
export const TEAM_COLOR_CB = [0x3a7bff, 0xffb000]; // colorblind-safe pair

const matCache = new Map<string, THREE.Material>();
export function stdMat(color: number, emissive = 0, ei = 0.0, rough = 0.7, metal = 0.1): THREE.MeshStandardMaterial {
  const k = `s${color}-${emissive}-${ei}-${rough}-${metal}`;
  let m = matCache.get(k) as THREE.MeshStandardMaterial | undefined;
  if (!m) { m = new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: ei, roughness: rough, metalness: metal, flatShading: true }); matCache.set(k, m); }
  return m;
}
export function glowMat(color: number, opacity = 1): THREE.MeshBasicMaterial {
  const k = `g${color}-${opacity}`;
  let m = matCache.get(k) as THREE.MeshBasicMaterial | undefined;
  if (!m) { m = new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity }); matCache.set(k, m); }
  return m;
}

const geoCache = new Map<string, THREE.BufferGeometry>();
function geo(key: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let g = geoCache.get(key);
  if (!g) { g = make(); geoCache.set(key, g); }
  return g;
}
export const G = {
  box: () => geo('box', () => new THREE.BoxGeometry(1, 1, 1)),
  sphere: () => geo('sph', () => new THREE.SphereGeometry(0.5, 10, 8)),
  cyl: () => geo('cyl', () => new THREE.CylinderGeometry(0.5, 0.5, 1, 10)),
  cone: () => geo('cone', () => new THREE.ConeGeometry(0.5, 1, 9)),
  octa: () => geo('oct', () => new THREE.OctahedronGeometry(0.5)),
  ico: () => geo('ico', () => new THREE.IcosahedronGeometry(0.5, 0)),
  torus: () => geo('tor', () => new THREE.TorusGeometry(0.5, 0.06, 6, 24)),
  plane: () => geo('pln', () => new THREE.PlaneGeometry(1, 1)),
  cap: () => geo('cap', () => new THREE.CapsuleGeometry(0.3, 0.6, 3, 8)),
};

interface PartOpts { x?: number; y?: number; z?: number; sx?: number; sy?: number; sz?: number; rx?: number; ry?: number; rz?: number }
export function mesh(g: THREE.BufferGeometry, m: THREE.Material, o: PartOpts = {}): THREE.Mesh {
  const me = new THREE.Mesh(g, m);
  me.position.set(o.x ?? 0, o.y ?? 0, o.z ?? 0);
  me.scale.set(o.sx ?? 1, o.sy ?? o.sx ?? 1, o.sz ?? o.sx ?? 1);
  me.rotation.set(o.rx ?? 0, o.ry ?? 0, o.rz ?? 0);
  me.castShadow = true;
  return me;
}
function pivot(x: number, y: number, z: number): THREE.Group { const g = new THREE.Group(); g.position.set(x, y, z); return g; }

export interface ModelRig {
  group: THREE.Group;
  legL?: THREE.Object3D; legR?: THREE.Object3D; armL?: THREE.Object3D; armR?: THREE.Object3D; body?: THREE.Object3D;
  spinners: THREE.Object3D[]; floaty: number; height: number; flashMats: THREE.MeshStandardMaterial[];
}
function rig(h: number): ModelRig { return { group: new THREE.Group(), spinners: [], floaty: 0, height: h, flashMats: [] }; }

// ------------------------------------------------------------------ heroes
export function buildHero(id: string): ModelRig {
  const r = rig(2.2);
  const g = r.group;
  const body = new THREE.Group(); g.add(body); r.body = body;
  const leg = (x: number, c: number, len = 0.7, w = 0.26) => { const p = pivot(x, len, 0); p.add(mesh(G.box(), stdMat(c), { y: -len / 2, sx: w, sy: len, sz: w })); g.add(p); return p; };
  switch (id) {
    case 'brannoch': {
      r.height = 2.5;
      r.legL = leg(-0.24, 0x55504a, 0.75, 0.34); r.legR = leg(0.24, 0x55504a, 0.75, 0.34);
      body.add(mesh(G.box(), stdMat(0xcfc6b2, 0, 0, 0.8, 0.15), { y: 1.3, sx: 1.0, sy: 0.9, sz: 0.65 }));
      body.add(mesh(G.box(), stdMat(0xd49a3a, 0xd49a3a, 0.25, 0.4, 0.7), { y: 0.88, sx: 1.04, sy: 0.16, sz: 0.69 }));
      body.add(mesh(G.sphere(), stdMat(0xd49a3a, 0, 0, 0.4, 0.7), { x: -0.62, y: 1.68, sx: 0.55, sy: 0.45, sz: 0.5 }));
      body.add(mesh(G.sphere(), stdMat(0xd49a3a, 0, 0, 0.4, 0.7), { x: 0.62, y: 1.68, sx: 0.55, sy: 0.45, sz: 0.5 }));
      body.add(mesh(G.box(), stdMat(0xb9ae98), { y: 1.98, sx: 0.5, sy: 0.46, sz: 0.5 }));
      body.add(mesh(G.box(), glowMat(0xffc060), { y: 1.98, z: 0.26, sx: 0.4, sy: 0.07, sz: 0.04 }));
      r.armL = pivot(-0.66, 1.55, 0); r.armL.add(mesh(G.box(), stdMat(0xb9ae98), { y: -0.4, sx: 0.28, sy: 0.8, sz: 0.28 })); body.add(r.armL);
      r.armR = pivot(0.66, 1.55, 0); r.armR.add(mesh(G.box(), stdMat(0xb9ae98), { y: -0.4, sx: 0.28, sy: 0.8, sz: 0.28 }));
      const hammer = new THREE.Group(); hammer.position.set(0, -0.8, 0.1);
      hammer.add(mesh(G.cyl(), stdMat(0x6a4a2a), { sx: 0.1, sy: 1.5, sz: 0.1, rx: Math.PI / 2, z: 0.5 }));
      hammer.add(mesh(G.box(), stdMat(0xd49a3a, 0xd49a3a, 0.2, 0.4, 0.7), { z: 1.25, sx: 0.55, sy: 0.55, sz: 0.8 }));
      r.armR.add(hammer); body.add(r.armR);
      break;
    }
    case 'suri': {
      r.legL = leg(-0.16, 0x3a2a24, 0.75, 0.17); r.legR = leg(0.16, 0x3a2a24, 0.75, 0.17);
      body.add(mesh(G.cone(), stdMat(0xe8764a), { y: 1.05, sx: 0.85, sy: 1.0, sz: 0.65 }));
      body.add(mesh(G.box(), stdMat(0xf0d8b0), { y: 1.45, sx: 0.5, sy: 0.5, sz: 0.34 }));
      body.add(mesh(G.sphere(), stdMat(0xf2c9a0), { y: 1.9, sx: 0.46 }));
      body.add(mesh(G.box(), glowMat(0xffd060), { y: 1.93, z: 0.2, sx: 0.44, sy: 0.12, sz: 0.06 }));
      body.add(mesh(G.cone(), stdMat(0xb0482a), { y: 2.2, sx: 0.5, sy: 0.35, sz: 0.5 }));
      body.add(mesh(G.box(), stdMat(0x8a5a30), { x: 0.4, y: 0.95, z: -0.2, sx: 0.3, sy: 0.4, sz: 0.22 }));
      r.armL = pivot(-0.34, 1.6, 0); r.armL.add(mesh(G.box(), stdMat(0xe8764a), { y: -0.35, sx: 0.16, sy: 0.7, sz: 0.16 })); body.add(r.armL);
      r.armR = pivot(0.34, 1.6, 0); r.armR.add(mesh(G.box(), stdMat(0xe8764a), { y: -0.35, sx: 0.16, sy: 0.7, sz: 0.16 }));
      r.armR.add(mesh(G.cyl(), stdMat(0x4a4a58, 0, 0, 0.3, 0.8), { y: -0.7, z: 0.5, sx: 0.14, sy: 1.1, sz: 0.14, rx: Math.PI / 2 }));
      r.armR.add(mesh(G.sphere(), glowMat(0xffa040), { y: -0.7, z: 1.05, sx: 0.22 }));
      body.add(r.armR);
      break;
    }
    case 'oru': {
      r.floaty = 0.3;
      body.add(mesh(G.cone(), stdMat(0xb9a8e8, 0x6a50c0, 0.15), { y: 0.95, sx: 0.95, sy: 1.5, sz: 0.95, rx: Math.PI }));
      body.add(mesh(G.sphere(), stdMat(0xf0e6ff), { y: 1.95, sx: 0.5 }));
      body.add(mesh(G.cone(), stdMat(0x6a50c0), { y: 2.3, sx: 0.55, sy: 0.6, sz: 0.55 }));
      for (let i = 0; i < 2; i++) {
        const s = i === 0 ? -1 : 1;
        const wing = mesh(G.plane(), new THREE.MeshBasicMaterial({ color: 0x9ff0ff, transparent: true, opacity: 0.7, side: THREE.DoubleSide }), { x: s * 0.7, y: 1.5, z: -0.2, sx: 1.2, sy: 1.0, ry: s * 0.6 });
        body.add(wing);
        r.spinners.push(wing);
      }
      r.armL = pivot(-0.42, 1.5, 0.1); r.armR = pivot(0.42, 1.5, 0.1);
      body.add(r.armL, r.armR);
      for (let i = 0; i < 3; i++) { const o = mesh(G.sphere(), glowMat(0x9ff0ff), { sx: 0.16 }); o.userData.orbit = i; body.add(o); r.spinners.push(o); }
      break;
    }
    case 'kesh': {
      r.height = 2.3;
      r.legL = leg(-0.28, 0x3a5a3a, 0.65, 0.3); r.legR = leg(0.28, 0x3a5a3a, 0.65, 0.3);
      body.add(mesh(G.sphere(), stdMat(0x5a9a58), { y: 1.2, sx: 1.05, sy: 1.1, sz: 0.85, rx: 0.3 }));
      body.add(mesh(G.sphere(), stdMat(0x6fb064), { y: 1.7, z: 0.2, sx: 0.55, sy: 0.5, sz: 0.55 }));
      body.add(mesh(G.cone(), stdMat(0xe8e0b0), { x: -0.2, y: 2.05, z: 0.2, sx: 0.12, sy: 0.45, sz: 0.12, rz: 0.3 }));
      body.add(mesh(G.cone(), stdMat(0xe8e0b0), { x: 0.2, y: 2.05, z: 0.2, sx: 0.12, sy: 0.45, sz: 0.12, rz: -0.3 }));
      body.add(mesh(G.sphere(), glowMat(0xd9e67a), { x: -0.14, y: 1.74, z: 0.5, sx: 0.1 }));
      body.add(mesh(G.sphere(), glowMat(0xd9e67a), { x: 0.14, y: 1.74, z: 0.5, sx: 0.1 }));
      for (let i = 0; i < 5; i++) body.add(mesh(G.cone(), stdMat(0x3a6a3a), { x: (i - 2) * 0.2, y: 1.7 - Math.abs(i - 2) * 0.12, z: -0.5, sx: 0.1, sy: 0.7, sz: 0.1, rx: -0.9 }));
      r.armL = pivot(-0.6, 1.5, 0.1); r.armL.add(mesh(G.box(), stdMat(0x4a8048), { y: -0.45, sx: 0.3, sy: 0.9, sz: 0.3 })); body.add(r.armL);
      r.armR = pivot(0.6, 1.5, 0.1); r.armR.add(mesh(G.box(), stdMat(0x4a8048), { y: -0.45, sx: 0.3, sy: 0.9, sz: 0.3 }));
      r.armR.add(mesh(G.box(), stdMat(0x9a9a80, 0xd9e67a, 0.3), { y: -0.9, z: 0.55, sx: 0.12, sy: 0.35, sz: 1.3 }));
      body.add(r.armR);
      break;
    }
    case 'ilyra': {
      r.height = 2.6;
      body.add(mesh(G.cone(), stdMat(0x6f8fe8, 0x2a40a0, 0.2), { y: 1.05, sx: 1.0, sy: 2.0, sz: 1.0 }));
      body.add(mesh(G.cyl(), stdMat(0xffe27a, 0xffe27a, 0.3, 0.4, 0.6), { y: 0.95, sx: 0.62, sy: 0.12, sz: 0.62 }));
      body.add(mesh(G.sphere(), stdMat(0xf5dcc0), { y: 2.05, sx: 0.46 }));
      body.add(mesh(G.cone(), stdMat(0x3a4aa0), { y: 2.55, sx: 0.7, sy: 0.75, sz: 0.7 }));
      body.add(mesh(G.cyl(), stdMat(0x3a4aa0), { y: 2.28, sx: 0.8, sy: 0.06, sz: 0.8 }));
      r.armL = pivot(-0.42, 1.55, 0.1); r.armR = pivot(0.42, 1.55, 0.1);
      r.armR.add(mesh(G.cyl(), stdMat(0x7a5a30), { y: -0.2, z: 0.3, sx: 0.07, sy: 1.8, sz: 0.07, rx: 0.3 }));
      r.armR.add(mesh(G.octa(), glowMat(0xffe27a), { y: 0.7, z: 0.5, sx: 0.28 }));
      body.add(r.armL, r.armR);
      const book = new THREE.Group(); book.position.set(-0.85, 1.7, 0.2);
      book.add(mesh(G.box(), stdMat(0x8a3a2a), { sx: 0.5, sy: 0.07, sz: 0.38 }));
      book.add(mesh(G.box(), glowMat(0xfff0c0), { y: 0.05, sx: 0.44, sy: 0.04, sz: 0.32 }));
      book.userData.book = true;
      body.add(book); r.spinners.push(book);
      break;
    }
    case 'vey': {
      r.legL = leg(-0.14, 0x20202c, 0.8, 0.15); r.legR = leg(0.14, 0x20202c, 0.8, 0.15);
      body.add(mesh(G.box(), stdMat(0xe6e9ff, 0x8088ff, 0.1), { y: 1.3, sx: 0.5, sy: 0.7, sz: 0.3 }));
      body.add(mesh(G.cone(), stdMat(0x2a2a40), { y: 0.95, z: -0.15, sx: 0.8, sy: 1.1, sz: 0.6, rx: 0.1 }));
      body.add(mesh(G.sphere(), stdMat(0xf0e0e0), { y: 1.88, sx: 0.4 }));
      body.add(mesh(G.cone(), stdMat(0x2a2a40), { y: 2.0, z: -0.05, sx: 0.55, sy: 0.7, sz: 0.55 }));
      body.add(mesh(G.box(), glowMat(0xff5ad2), { y: 1.86, z: 0.2, sx: 0.34, sy: 0.05, sz: 0.04 }));
      r.armL = pivot(-0.34, 1.55, 0); r.armL.add(mesh(G.box(), stdMat(0xe6e9ff), { y: -0.35, sx: 0.13, sy: 0.7, sz: 0.13 }));
      r.armL.add(mesh(G.octa(), glowMat(0xff9ae8), { y: -0.8, z: 0.3, sx: 0.2, sy: 0.9, sz: 0.1 })); body.add(r.armL);
      r.armR = pivot(0.34, 1.55, 0); r.armR.add(mesh(G.box(), stdMat(0xe6e9ff), { y: -0.35, sx: 0.13, sy: 0.7, sz: 0.13 }));
      r.armR.add(mesh(G.octa(), glowMat(0xff5ad2), { y: -0.8, z: 0.3, sx: 0.2, sy: 1.0, sz: 0.1 })); body.add(r.armR);
      break;
    }
    default:
      body.add(mesh(G.cap(), stdMat(0xcccccc), { y: 1 }));
  }
  g.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = true; });
  return r;
}

/** animate a hero rig: t seconds, speed 0..1 (run intensity), atk 0..1 swing pulse */
export function animateRig(r: ModelRig, t: number, speed: number, atk: number, id: string, dead = false) {
  const swing = Math.sin(t * 11) * 0.75 * speed;
  if (r.legL) r.legL.rotation.x = swing;
  if (r.legR) r.legR.rotation.x = -swing;
  if (r.body) {
    r.body.position.y = r.floaty ? r.floaty + Math.sin(t * 2.4) * 0.12 : Math.abs(Math.sin(t * 11)) * 0.07 * speed;
    r.body.rotation.x = speed * 0.12;
  }
  if (r.armL) r.armL.rotation.x = -swing * 0.8;
  if (r.armR) r.armR.rotation.x = swing * 0.8 - atk * 1.9;
  if (id === 'brannoch' && r.armR) r.armR.rotation.x = swing * 0.5 - atk * 2.4;
  for (const s of r.spinners) {
    if (s.userData.orbit !== undefined) {
      const a = t * 2 + s.userData.orbit * 2.1;
      s.position.set(Math.cos(a) * 0.9, 1.5 + Math.sin(t * 3 + s.userData.orbit) * 0.2, Math.sin(a) * 0.9);
    } else if (s.userData.book) {
      s.position.y = 1.7 + Math.sin(t * 2) * 0.1; s.rotation.y = t * 0.8; s.rotation.z = Math.sin(t * 1.4) * 0.15;
    } else s.rotation.y = (s.position.x < 0 ? -1 : 1) * (0.6 + Math.sin(t * 9) * 0.35);
  }
  if (dead) r.group.rotation.x = -1.4;
  else r.group.rotation.x = 0;
}

// ------------------------------------------------------------------ minions (instanced)
interface MPart { g: THREE.BufferGeometry; c: number; o: PartOpts; glow?: boolean }
function mergeParts(parts: MPart[]): THREE.BufferGeometry | null {
  const geos: THREE.BufferGeometry[] = [];
  for (const p of parts) {
    const g = p.g.index ? p.g.toNonIndexed() : p.g.clone();
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(p.o.x ?? 0, p.o.y ?? 0, p.o.z ?? 0),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(p.o.rx ?? 0, p.o.ry ?? 0, p.o.rz ?? 0)),
      new THREE.Vector3(p.o.sx ?? 1, p.o.sy ?? p.o.sx ?? 1, p.o.sz ?? p.o.sx ?? 1));
    g.applyMatrix4(m);
    g.deleteAttribute('uv');
    const col = new THREE.Color(p.c);
    const n = g.attributes.position.count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b; }
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    geos.push(g);
  }
  return geos.length ? mergeGeometries(geos, false) : null;
}

export interface MinionKit { body: THREE.BufferGeometry; glow: THREE.BufferGeometry | null; height: number }
const minionKits = new Map<string, MinionKit>();
export function minionKit(type: string, team: number): MinionKit {
  const key = `${type}${team}`;
  let k = minionKits.get(key);
  if (k) return k;
  const tc = TEAM_COLOR[team];
  const parts: MPart[] = [], glows: MPart[] = [];
  const cloth = team === 0 ? 0x2a6aa8 : 0xa83a30;
  switch (type) {
    case 'guard':
      parts.push({ g: G.cap(), c: cloth, o: { y: 0.65, sx: 1.0 } }, { g: G.sphere(), c: 0xcfc6b2, o: { y: 1.25, sx: 0.42 } }, { g: G.cone(), c: 0xb9ae98, o: { y: 1.5, sx: 0.4, sy: 0.3 } },
        { g: G.box(), c: 0xcfc6b2, o: { x: -0.32, y: 0.75, z: 0.1, sx: 0.12, sy: 0.55, sz: 0.4 } }, { g: G.cyl(), c: 0x6a4a2a, o: { x: 0.3, y: 0.7, z: 0.2, sx: 0.06, sy: 0.9, sz: 0.06 } });
      glows.push({ g: G.sphere(), c: tc, o: { y: 0.92, z: 0.26, sx: 0.14 } });
      break;
    case 'bolt':
      parts.push({ g: G.cone(), c: cloth, o: { y: 0.6, sx: 0.55, sy: 1.1, sz: 0.55 } }, { g: G.sphere(), c: 0xf0d8b8, o: { y: 1.3, sx: 0.34 } }, { g: G.cone(), c: 0x3a3a5a, o: { y: 1.6, sx: 0.4, sy: 0.4 } },
        { g: G.cyl(), c: 0x6a4a2a, o: { x: 0.28, y: 0.8, z: 0.1, sx: 0.05, sy: 1.4, sz: 0.05 } });
      glows.push({ g: G.octa(), c: tc, o: { x: 0.28, y: 1.55, z: 0.1, sx: 0.22 } });
      break;
    case 'siege':
      parts.push({ g: G.box(), c: cloth, o: { y: 0.55, sx: 0.9, sy: 0.5, sz: 1.2 } }, { g: G.cyl(), c: 0x4a4a4a, o: { y: 0.95, z: 0.5, sx: 0.28, sy: 1.2, sz: 0.28, rx: Math.PI / 2 - 0.4 } },
        { g: G.cyl(), c: 0x6a4a2a, o: { x: -0.5, y: 0.35, sx: 0.55, sy: 0.12, sz: 0.55, rz: Math.PI / 2 } }, { g: G.cyl(), c: 0x6a4a2a, o: { x: 0.5, y: 0.35, sx: 0.55, sy: 0.12, sz: 0.55, rz: Math.PI / 2 } });
      glows.push({ g: G.sphere(), c: tc, o: { y: 1.1, z: 0.95, sx: 0.2 } });
      break;
    default: // vanguard
      parts.push({ g: G.cap(), c: 0x3a3a48, o: { y: 1.0, sx: 1.9, sy: 1.8, sz: 1.9 } }, { g: G.box(), c: 0xd49a3a, o: { x: -0.7, y: 1.9, sx: 0.6, sy: 0.35, sz: 0.6 } }, { g: G.box(), c: 0xd49a3a, o: { x: 0.7, y: 1.9, sx: 0.6, sy: 0.35, sz: 0.6 } },
        { g: G.sphere(), c: 0x55556a, o: { y: 2.25, sx: 0.65 } }, { g: G.box(), c: 0x9a9aaa, o: { x: 0.8, y: 1.3, z: 0.4, sx: 0.2, sy: 1.8, sz: 0.5 } });
      glows.push({ g: G.box(), c: tc, o: { y: 2.25, z: 0.3, sx: 0.5, sy: 0.08, sz: 0.1 } }, { g: G.sphere(), c: tc, o: { y: 1.3, z: 0.52, sx: 0.3 } });
  }
  k = { body: mergeParts(parts)!, glow: mergeParts(glows), height: type === 'vanguard' ? 3.0 : type === 'siege' ? 1.6 : 1.9 };
  minionKits.set(key, k);
  return k;
}

// ------------------------------------------------------------------ monsters
export function buildMonster(family: string, big: boolean): ModelRig {
  const r = rig(big ? 3 : 1.4);
  const g = r.group;
  const body = new THREE.Group(); g.add(body); r.body = body;
  const s = big ? 1.5 : 1;
  switch (family) {
    case 'hounds':
      body.add(mesh(G.box(), stdMat(0x5a4a6a), { y: 0.5, sx: 0.5, sy: 0.45, sz: 0.9 }));
      body.add(mesh(G.box(), stdMat(0x6a5a7a), { y: 0.62, z: 0.55, sx: 0.36, sy: 0.34, sz: 0.4 }));
      body.add(mesh(G.cone(), stdMat(0x3a2a4a), { y: 0.55, z: -0.6, sx: 0.12, sy: 0.6, sz: 0.12, rx: -1.2 }));
      body.add(mesh(G.sphere(), glowMat(0xff7aa0), { x: -0.1, y: 0.7, z: 0.72, sx: 0.07 }), mesh(G.sphere(), glowMat(0xff7aa0), { x: 0.1, y: 0.7, z: 0.72, sx: 0.07 }));
      r.legL = pivot(-0.2, 0.3, 0.3); r.legR = pivot(0.2, 0.3, -0.3);
      r.legL.add(mesh(G.box(), stdMat(0x3a2a4a), { y: -0.15, sx: 0.12, sy: 0.35, sz: 0.12 })); r.legR.add(mesh(G.box(), stdMat(0x3a2a4a), { y: -0.15, sx: 0.12, sy: 0.35, sz: 0.12 }));
      g.add(r.legL, r.legR);
      break;
    case 'crag':
      body.add(mesh(G.ico(), stdMat(0x8a8a96, 0, 0, 0.9), { y: 0.8 * s, sx: 1.4 * s, sy: 1.2 * s, sz: 1.3 * s }));
      body.add(mesh(G.octa(), glowMat(0x7fe8ff), { y: 1.5 * s, x: 0.2, sx: 0.4 * s, sy: 0.8 * s, sz: 0.3 * s }));
      body.add(mesh(G.octa(), glowMat(0x7fe8ff), { y: 1.2 * s, x: -0.4 * s, sx: 0.25 * s, sy: 0.6 * s, sz: 0.25 * s, rz: 0.5 }));
      r.armL = pivot(-0.8 * s, 1, 0); r.armL.add(mesh(G.box(), stdMat(0x70707c), { y: -0.3, sx: 0.4 * s, sy: 0.8 * s, sz: 0.4 * s })); body.add(r.armL);
      r.armR = pivot(0.8 * s, 1, 0); r.armR.add(mesh(G.box(), stdMat(0x70707c), { y: -0.3, sx: 0.4 * s, sy: 0.8 * s, sz: 0.4 * s })); body.add(r.armR);
      break;
    case 'wisps':
      r.floaty = 0.6;
      body.add(mesh(G.sphere(), glowMat(0x9fffd8), { y: 0.5, sx: 0.5 }));
      body.add(mesh(G.sphere(), glowMat(0xd8fff0, 0.5), { y: 0.5, sx: 0.85 }));
      body.add(mesh(G.cone(), glowMat(0x7fd8b8, 0.7), { y: 0.1, sx: 0.3, sy: 0.6, sz: 0.3, rx: Math.PI }));
      break;
    case 'thorn':
      body.add(mesh(G.ico(), stdMat(0x3a6a3a), { y: 0.7 * s, sx: 1.1 * s, sy: 0.9 * s, sz: 1.1 * s }));
      for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; body.add(mesh(G.cone(), stdMat(0xd8e0a0), { x: Math.cos(a) * 0.55 * s, y: (0.8 + (i % 2) * 0.2) * s, z: Math.sin(a) * 0.55 * s, sx: 0.14 * s, sy: 0.7 * s, sz: 0.14 * s, rz: -Math.cos(a) * 1.0, rx: Math.sin(a) * 1.0 })); }
      body.add(mesh(G.sphere(), glowMat(0xff9040), { y: 0.9 * s, z: 0.5 * s, sx: 0.16 }));
      break;
    case 'heartroot':
      body.add(mesh(G.cyl(), stdMat(0x5a4030), { y: 1.2, sx: 1.1, sy: 2.4, sz: 1.1 }));
      body.add(mesh(G.ico(), stdMat(0x3a9a5a), { y: 2.9, sx: 2.6, sy: 1.7, sz: 2.6 }));
      body.add(mesh(G.sphere(), glowMat(0xff6aa0), { y: 1.6, z: 0.5, sx: 0.55 }));
      for (let i = 0; i < 4; i++) { const a = i * 1.57; body.add(mesh(G.cone(), stdMat(0x5a4030), { x: Math.cos(a) * 0.9, y: 0.3, z: Math.sin(a) * 0.9, sx: 0.3, sy: 1.1, sz: 0.3, rz: -Math.cos(a) * 0.9, rx: Math.sin(a) * 0.9 })); }
      r.armL = pivot(-0.9, 2, 0); r.armR = pivot(0.9, 2, 0); body.add(r.armL, r.armR);
      break;
    case 'cinder':
      body.add(mesh(G.ico(), stdMat(0x4a3a40, 0x331000, 0.3, 0.9), { y: 1.3, sx: 2.1, sy: 2.3, sz: 1.9 }));
      body.add(mesh(G.sphere(), glowMat(0xff7a30), { y: 1.4, z: 0.7, sx: 0.8 }));
      body.add(mesh(G.cone(), stdMat(0xd8c8a0), { x: -0.55, y: 2.65, sx: 0.28, sy: 1.0, sz: 0.28, rz: 0.3 }));
      body.add(mesh(G.cone(), stdMat(0xd8c8a0), { x: 0.55, y: 2.65, sx: 0.28, sy: 1.0, sz: 0.28, rz: -0.3 }));
      body.add(mesh(G.cone(), glowMat(0xff9a30, 0.8), { y: 3.3, sx: 0.5, sy: 1.1, sz: 0.5 }));
      r.armL = pivot(-1.1, 1.8, 0); r.armR = pivot(1.1, 1.8, 0); body.add(r.armL, r.armR);
      break;
    case 'catalyst':
      r.floaty = 1.2;
      for (let i = 0; i < 2; i++) { const s2 = i ? 1 : -1; const c = mesh(G.octa(), glowMat(i ? 0xff7ad8 : 0x7fe8ff), { x: s2 * 1.2, y: 1.4, sx: 1.3, sy: 2.4, sz: 1.3 }); body.add(c); r.spinners.push(c); }
      body.add(mesh(G.torus(), glowMat(0xffffff, 0.8), { y: 1.4, sx: 5, sy: 5, sz: 5, rx: Math.PI / 2 }));
      body.add(mesh(G.sphere(), glowMat(0xffffff, 0.8), { y: 1.4, sx: 0.8 }));
      break;
    case 'colossus': {
      r.height = 7;
      body.add(mesh(G.ico(), stdMat(0x8a8aa0, 0, 0, 0.9), { y: 3.2, sx: 4.2, sy: 4.8, sz: 3.8 }));
      body.add(mesh(G.ico(), stdMat(0x7a7a90, 0, 0, 0.9), { y: 6.0, sx: 2.2, sy: 1.8, sz: 2.0 }));
      body.add(mesh(G.sphere(), glowMat(0xff4ad0), { y: 3.6, z: 1.6, sx: 1.7 }));
      body.add(mesh(G.torus(), glowMat(0xff4ad0, 0.8), { y: 3.6, sx: 8, sy: 8, sz: 8, rx: Math.PI / 2 }));
      body.add(mesh(G.box(), glowMat(0xffa0ff), { y: 6.2, z: 0.95, sx: 1.4, sy: 0.18, sz: 0.1 }));
      r.armL = pivot(-2.5, 4.3, 0); r.armL.add(mesh(G.ico(), stdMat(0x7a7a90), { y: -1.5, sx: 1.7, sy: 3.4, sz: 1.7 })); body.add(r.armL);
      r.armR = pivot(2.5, 4.3, 0); r.armR.add(mesh(G.ico(), stdMat(0x7a7a90), { y: -1.5, sx: 1.7, sy: 3.4, sz: 1.7 })); body.add(r.armR);
      for (let i = 0; i < 5; i++) { const o = mesh(G.ico(), stdMat(0x6a6a80), { sx: 0.7 + (i % 2) * 0.3 }); o.userData.orbit = i; body.add(o); r.spinners.push(o); }
      break;
    }
    default:
      body.add(mesh(G.sphere(), stdMat(0x888888), { y: 0.6, sx: 1 }));
  }
  g.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = true; });
  return r;
}
export function animateMonster(r: ModelRig, t: number, speed: number, atk: number, family: string) {
  const swing = Math.sin(t * 10) * 0.7 * speed;
  if (r.legL) r.legL.rotation.x = swing;
  if (r.legR) r.legR.rotation.x = -swing;
  if (r.body) r.body.position.y = (r.floaty || 0) + (r.floaty ? Math.sin(t * 2 + 1) * 0.15 : Math.abs(Math.sin(t * 10)) * 0.05 * speed);
  if (r.armL) r.armL.rotation.x = -swing - atk * 1.4;
  if (r.armR) r.armR.rotation.x = swing - atk * 1.8;
  for (const s of r.spinners) {
    if (s.userData.orbit !== undefined) {
      const a = t * 0.8 + s.userData.orbit * 1.25; const rad = 4.6;
      s.position.set(Math.cos(a) * rad, 3 + Math.sin(t * 1.3 + s.userData.orbit) * 0.6, Math.sin(a) * rad);
      s.rotation.y = t;
    } else if (family === 'catalyst') s.rotation.y = t * 1.5;
  }
}

// ------------------------------------------------------------------ structures
export interface StructRig { group: THREE.Group; spin: THREE.Object3D[]; crystal: THREE.Mesh | null; shield: THREE.Mesh | null; teamMats: THREE.MeshBasicMaterial[]; height: number }
export function buildStructure(stype: string, team: number, cb: boolean): StructRig {
  const tc = (cb ? TEAM_COLOR_CB : TEAM_COLOR)[team];
  const g = new THREE.Group();
  const spin: THREE.Object3D[] = [];
  const teamMats: THREE.MeshBasicMaterial[] = [];
  const tm = (op = 1) => { const m = new THREE.MeshBasicMaterial({ color: tc, transparent: op < 1, opacity: op }); teamMats.push(m); return m; };
  const ivory = stdMat(0xe9dfc8, 0, 0, 0.85, 0.05), brass = stdMat(0xc9973a, 0x4a3008, 0.2, 0.35, 0.8), dark = stdMat(0x403a50, 0, 0, 0.8, 0.2);
  let crystal: THREE.Mesh | null = null, shield: THREE.Mesh | null = null, height = 6;
  const tower = (sc: number, twin: boolean) => {
    g.add(mesh(G.cyl(), ivory, { y: 0.35 * sc, sx: 2.5 * sc, sy: 0.7 * sc, sz: 2.5 * sc }));
    g.add(mesh(G.cyl(), brass, { y: 0.75 * sc, sx: 2.2 * sc, sy: 0.14 * sc, sz: 2.2 * sc }));
    g.add(mesh(G.cyl(), ivory, { y: 2.2 * sc, sx: 1.4 * sc, sy: 2.9 * sc, sz: 1.4 * sc }));
    for (let i = 0; i < 3; i++) g.add(mesh(G.cyl(), brass, { y: (1.4 + i * 1.0) * sc, sx: 1.55 * sc, sy: 0.12 * sc, sz: 1.55 * sc }));
    if (twin) for (const s of [-1, 1]) g.add(mesh(G.cyl(), ivory, { x: s * 1.2 * sc, y: 1.7 * sc, sx: 0.7 * sc, sy: 2.4 * sc, sz: 0.7 * sc }));
    g.add(mesh(G.cyl(), dark, { y: 3.8 * sc, sx: 1.8 * sc, sy: 0.3 * sc, sz: 1.8 * sc }));
    crystal = mesh(G.octa(), tm(), { y: 4.9 * sc, sx: 1.0 * sc, sy: 1.9 * sc, sz: 1.0 * sc });
    crystal.castShadow = false;
    g.add(crystal);
    const ring = mesh(G.torus(), tm(0.85), { y: 4.9 * sc, sx: 2.6 * sc, sy: 2.6 * sc, sz: 2.6 * sc, rx: Math.PI / 2.4 });
    g.add(ring); spin.push(ring);
    height = 6.4 * sc;
  };
  switch (stype) {
    case 'outer': tower(1, false); break;
    case 'inner': tower(1.1, false); break;
    case 'guard': tower(1.2, false); break;
    case 'core': tower(1.35, true); break;
    case 'seal': {
      g.add(mesh(G.cyl(), ivory, { y: 0.3, sx: 4.2, sy: 0.6, sz: 4.2 }));
      g.add(mesh(G.cyl(), brass, { y: 0.65, sx: 3.6, sy: 0.12, sz: 3.6 }));
      for (const s of [-1, 1]) g.add(mesh(G.box(), ivory, { x: s * 1.7, y: 2.0, sx: 0.7, sy: 3.4, sz: 0.9 }));
      const arch = mesh(G.torus(), tm(0.9), { y: 3.2, sx: 4.2, sy: 4.2, sz: 4.2 });
      arch.scale.z = 1; g.add(arch); spin.push(arch);
      crystal = mesh(G.octa(), tm(), { y: 3.2, sx: 1.1, sy: 1.8, sz: 1.1 }); g.add(crystal);
      shield = mesh(G.sphere(), new THREE.MeshBasicMaterial({ color: 0xff7ad8, transparent: true, opacity: 0.22, depthWrite: false }), { y: 1.8, sx: 5.4, sy: 4.4, sz: 5.4 });
      shield.castShadow = false; g.add(shield);
      height = 5;
      break;
    }
    case 'engine': {
      g.add(mesh(G.cyl(), ivory, { y: 0.5, sx: 6.2, sy: 1.0, sz: 6.2 }));
      g.add(mesh(G.cyl(), brass, { y: 1.05, sx: 5.4, sy: 0.18, sz: 5.4 }));
      const gear = new THREE.Group(); gear.position.y = 3.4;
      gear.add(mesh(G.torus(), brass, { sx: 5, sy: 5, sz: 5, rx: Math.PI / 2 }));
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; gear.add(mesh(G.box(), brass, { x: Math.cos(a) * 2.6, z: Math.sin(a) * 2.6, sx: 0.5, sy: 0.4, sz: 0.5, ry: -a })); }
      g.add(gear); spin.push(gear);
      const ring2 = mesh(G.torus(), tm(0.9), { y: 3.4, sx: 3.4, sy: 3.4, sz: 3.4, rx: 0.5 }); g.add(ring2); spin.push(ring2);
      crystal = mesh(G.sphere(), new THREE.MeshBasicMaterial({ color: 0xff4ad0 }), { y: 3.4, sx: 1.9 }); crystal.castShadow = false; g.add(crystal);
      for (const s of [-1, 1]) g.add(mesh(G.cyl(), ivory, { x: s * 2.7, y: 2, sx: 0.8, sy: 2.6, sz: 0.8 }));
      shield = mesh(G.sphere(), new THREE.MeshBasicMaterial({ color: 0xff7ad8, transparent: true, opacity: 0.18, depthWrite: false }), { y: 2.8, sx: 7.4, sy: 6, sz: 7.4 });
      shield.castShadow = false; g.add(shield);
      height = 7;
      break;
    }
  }
  return { group: g, spin, crystal, shield, teamMats, height };
}

export function buildFountain(team: number, cb: boolean): THREE.Group {
  const tc = (cb ? TEAM_COLOR_CB : TEAM_COLOR)[team];
  const g = new THREE.Group();
  g.add(mesh(G.cyl(), stdMat(0xe9dfc8), { y: 0.15, sx: 9, sy: 0.3, sz: 9 }));
  g.add(mesh(G.cyl(), new THREE.MeshBasicMaterial({ color: 0x7fe8ff, transparent: true, opacity: 0.55 }), { y: 0.34, sx: 7.4, sy: 0.05, sz: 7.4 }));
  g.add(mesh(G.torus(), new THREE.MeshBasicMaterial({ color: tc }), { y: 0.4, sx: 14, sy: 14, sz: 14, rx: Math.PI / 2 }));
  g.add(mesh(G.cyl(), stdMat(0xc9973a, 0, 0, 0.4, 0.7), { y: 0.9, sx: 1.2, sy: 1.2, sz: 1.2 }));
  g.add(mesh(G.cone(), new THREE.MeshBasicMaterial({ color: 0x9ff4ff, transparent: true, opacity: 0.7 }), { y: 2.2, sx: 1.2, sy: 2.2, sz: 1.2 }));
  return g;
}

export function buildWard(color: number): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(G.cyl(), stdMat(0x6a5a40), { y: 0.1, sx: 0.5, sy: 0.2, sz: 0.5 }));
  const eye = mesh(G.octa(), glowMat(color), { y: 0.65, sx: 0.4, sy: 0.55, sz: 0.4 });
  eye.castShadow = false;
  g.add(eye);
  g.userData.eye = eye;
  return g;
}
