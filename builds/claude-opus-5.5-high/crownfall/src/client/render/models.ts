// Procedural, original low-poly models: heroes (articulated groups), minions/monsters/structures
// (merged vertex-colored geometry so they batch into few draw calls).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { HeroId } from '../../shared/types';
import { HEROES } from '../../shared/heroes';
import { lambert, patchFog } from './fogShader';

export const TEAM_COLORS = { normal: [0x3fb6ff, 0xff7a3d], colorblind: [0x2f7bff, 0xffd23f] };
export function teamColor(team: number, cb: boolean): number {
  if (team === 2) return 0xf2d15c;
  return (cb ? TEAM_COLORS.colorblind : TEAM_COLORS.normal)[team];
}

// ---------- merged geometry helpers ----------
type G = THREE.BufferGeometry;
function colored(g: G, color: number, m?: THREE.Matrix4): G {
  let geo = g.index ? g.toNonIndexed() : g;
  if (m) geo.applyMatrix4(m);
  const c = new THREE.Color(color);
  const n = geo.getAttribute('position').count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  geo.deleteAttribute('uv');
  return geo;
}
const M = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
function merge(parts: G[]): G {
  const g = mergeGeometries(parts, false)!;
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt: number, rb: number, h: number, s = 8) => new THREE.CylinderGeometry(rt, rb, h, s);
const sph = (r: number, d = 1) => new THREE.IcosahedronGeometry(r, d);
const cone = (r: number, h: number, s = 6) => new THREE.ConeGeometry(r, h, s);

export const vcMat = () => lambert(0xffffff, { vertexColors: true });

// ---------- minions ----------
export type MinionGeoKind = 'guard' | 'bolt' | 'siege' | 'vanguard';
export function minionGeometry(kind: MinionGeoKind): { body: G; accent: G } {
  const IV = 0xe6dcc3, BR = 0xb08a3c, DK = 0x4a4152;
  if (kind === 'guard') {
    return {
      body: merge([
        colored(box(0.6, 0.6, 0.45), IV, M(0, 0.75, 0)), colored(sph(0.22), IV, M(0, 1.22, 0)),
        colored(cyl(0.09, 0.09, 0.5), DK, M(-0.16, 0.25, 0)), colored(cyl(0.09, 0.09, 0.5), DK, M(0.16, 0.25, 0)),
        colored(box(0.12, 0.7, 0.5), BR, M(0, 0.8, 0.36, 0, 0, 0)),
      ]),
      accent: merge([colored(box(0.64, 0.12, 0.5), 0xffffff, M(0, 0.98, 0)), colored(box(0.08, 0.5, 0.36), 0xffffff, M(0, 0.82, 0.44))]),
    };
  }
  if (kind === 'bolt') {
    return {
      body: merge([
        colored(cone(0.3, 0.9, 6), IV, M(0, 0.55, 0)), colored(sph(0.18), IV, M(0, 1.1, 0)),
        colored(cyl(0.03, 0.03, 0.8), BR, M(0.28, 0.8, 0, 0, 0, 0.2)),
      ]),
      accent: merge([colored(sph(0.12, 0), 0xffffff, M(0.36, 1.25, 0)), colored(box(0.5, 0.08, 0.5), 0xffffff, M(0, 0.4, 0))]),
    };
  }
  if (kind === 'siege') {
    return {
      body: merge([
        colored(box(1.1, 0.5, 0.8), BR, M(0, 0.45, 0)),
        colored(cyl(0.25, 0.25, 0.15, 10), DK, M(-0.4, 0.25, 0.45, Math.PI / 2, 0, 0)), colored(cyl(0.25, 0.25, 0.15, 10), DK, M(0.4, 0.25, 0.45, Math.PI / 2, 0, 0)),
        colored(cyl(0.25, 0.25, 0.15, 10), DK, M(-0.4, 0.25, -0.45, Math.PI / 2, 0, 0)), colored(cyl(0.25, 0.25, 0.15, 10), DK, M(0.4, 0.25, -0.45, Math.PI / 2, 0, 0)),
        colored(cyl(0.16, 0.22, 1.0, 8), IV, M(0.35, 0.95, 0, 0, 0, -1.1)),
      ]),
      accent: merge([colored(sph(0.16, 0), 0xffffff, M(0.82, 1.2, 0)), colored(box(1.12, 0.1, 0.82), 0xffffff, M(0, 0.72, 0))]),
    };
  }
  return {
    body: merge([
      colored(box(1.1, 1.0, 0.8), IV, M(0, 1.3, 0)), colored(box(0.5, 0.5, 0.5), IV, M(0, 2.0, 0)),
      colored(box(0.38, 0.9, 0.38), DK, M(-0.35, 0.45, 0)), colored(box(0.38, 0.9, 0.38), DK, M(0.35, 0.45, 0)),
      colored(box(0.35, 1.0, 0.35), IV, M(-0.78, 1.25, 0, 0, 0, 0.15)), colored(box(0.35, 1.0, 0.35), IV, M(0.78, 1.25, 0, 0, 0, -0.15)),
      colored(cone(0.25, 0.6), BR, M(-0.45, 1.95, 0)), colored(cone(0.25, 0.6), BR, M(0.45, 1.95, 0)),
    ]),
    accent: merge([colored(sph(0.2, 0), 0xffffff, M(0, 1.45, 0.42)), colored(box(1.14, 0.12, 0.84), 0xffffff, M(0, 1.7, 0))]),
  };
}

// ---------- monsters ----------
export function monsterGeometry(kind: string): G {
  const BR = 0xc29a42, IV = 0xe6dcc3, CO = 0xff7f7a, MG = 0xd04bd6, TE = 0x3ac0b0, DK = 0x3b3346;
  switch (kind) {
    case 'cogmites': return merge([
      colored(sph(0.4, 0), BR, M(0, 0.4, 0, 0, 0, 0, 1.2, 0.7, 1)), colored(cyl(0.2, 0.2, 0.08, 6), DK, M(0, 0.7, 0)),
      colored(cone(0.06, 0.4), DK, M(0.25, 0.45, 0.25, 0.8, 0, 0)), colored(cone(0.06, 0.4), DK, M(-0.25, 0.45, 0.25, 0.8, 0, 0)),
    ]);
    case 'mistlings': return merge([colored(sph(0.45, 1), 0xbfe8ff, M(0, 1.1, 0)), colored(cone(0.35, 0.8), 0x8fc8ee, M(0, 0.55, 0, Math.PI, 0, 0)), colored(sph(0.12, 0), MG, M(0, 1.15, 0.38))]);
    case 'rams': return merge([
      colored(box(1.4, 0.8, 0.8), IV, M(0, 0.9, 0)), colored(box(0.5, 0.5, 0.5), IV, M(0.85, 1.2, 0)),
      colored(new THREE.TorusGeometry(0.25, 0.08, 6, 10, Math.PI * 1.4), BR, M(0.85, 1.35, 0.3)), colored(new THREE.TorusGeometry(0.25, 0.08, 6, 10, Math.PI * 1.4), BR, M(0.85, 1.35, -0.3)),
      ...[[-0.5, 0.3], [0.5, 0.3], [-0.5, -0.3], [0.5, -0.3]].map(([x, z]) => colored(box(0.2, 0.6, 0.2), DK, M(x, 0.3, z))),
    ]);
    case 'crabs': return merge([
      colored(sph(0.6, 0), CO, M(0, 0.55, 0, 0, 0, 0, 1.3, 0.6, 1)), colored(cone(0.15, 0.6), 0xffd0c8, M(0, 0.95, 0)), colored(cone(0.12, 0.5), 0xffd0c8, M(0.3, 0.85, 0.2)),
      colored(box(0.5, 0.2, 0.25), CO, M(0.75, 0.5, 0.45, 0, -0.5, 0)), colored(box(0.5, 0.2, 0.25), CO, M(0.75, 0.5, -0.45, 0, 0.5, 0)),
    ]);
    case 'buffForge': return merge([
      colored(box(1.4, 1.6, 1.0), BR, M(0, 1.6, 0)), colored(box(0.7, 0.6, 0.7), BR, M(0, 2.7, 0)), colored(sph(0.25, 0), 0xff6a2a, M(0, 1.8, 0.52)),
      colored(box(0.5, 1.4, 0.5), DK, M(-1.0, 1.4, 0)), colored(box(0.5, 1.4, 0.5), DK, M(1.0, 1.4, 0)), colored(box(0.5, 0.9, 0.5), DK, M(-0.4, 0.45, 0)), colored(box(0.5, 0.9, 0.5), DK, M(0.4, 0.45, 0)),
      colored(new THREE.TorusGeometry(0.45, 0.1, 6, 12), 0xffcf6b, M(0, 2.7, 0, Math.PI / 2, 0, 0)),
    ]);
    case 'buffSpring': return merge([
      colored(cyl(0.35, 0.6, 1.6, 8), TE, M(0, 0.8, 0)), colored(sph(0.5, 1), 0x7fe8ff, M(0, 1.9, 0)), colored(cone(0.2, 0.8), TE, M(0.4, 2.3, 0, 0, 0, -0.6)), colored(cone(0.2, 0.8), TE, M(-0.4, 2.3, 0, 0, 0, 0.6)),
      colored(new THREE.TorusGeometry(0.8, 0.07, 6, 16), 0xbff6ff, M(0, 1.2, 0, Math.PI / 2, 0, 0)),
    ]);
    case 'catalystGale': case 'catalystForge': {
      const c = kind === 'catalystGale' ? 0x9ff0ff : 0xffa24a;
      return merge([
        colored(new THREE.OctahedronGeometry(1.1, 0), c, M(0, 2.2, 0, 0, 0, 0, 1, 1.5, 1)), colored(new THREE.OctahedronGeometry(0.4, 0), 0xffffff, M(1.2, 1.2, 0)), colored(new THREE.OctahedronGeometry(0.4, 0), 0xffffff, M(-1.0, 1.4, 0.6)),
        colored(new THREE.TorusGeometry(1.5, 0.08, 6, 24), IV, M(0, 1.6, 0, Math.PI / 2.4, 0, 0)), colored(cyl(1.2, 1.5, 0.4, 10), IV, M(0, 0.2, 0)),
      ]);
    }
    case 'colossus': return merge([
      colored(box(3.0, 2.8, 2.0), IV, M(0, 3.2, 0)), colored(box(1.4, 1.1, 1.2), IV, M(0, 5.1, 0)), colored(sph(0.5, 1), MG, M(0, 3.4, 1.05)),
      colored(box(1.0, 3.2, 1.0), BR, M(-2.1, 2.9, 0, 0, 0, 0.12)), colored(box(1.0, 3.2, 1.0), BR, M(2.1, 2.9, 0, 0, 0, -0.12)),
      colored(box(1.0, 1.8, 1.0), DK, M(-0.8, 0.9, 0)), colored(box(1.0, 1.8, 1.0), DK, M(0.8, 0.9, 0)),
      colored(cone(0.4, 1.4), MG, M(-0.9, 6.0, 0, 0, 0, 0.3)), colored(cone(0.4, 1.4), MG, M(0.9, 6.0, 0, 0, 0, -0.3)), colored(cone(0.4, 1.6), MG, M(0, 6.2, 0)),
      colored(new THREE.TorusGeometry(2.2, 0.12, 6, 24), 0xffcf6b, M(0, 3.4, 0, Math.PI / 2, 0, 0)),
    ]);
  }
  return colored(sph(0.6), 0xffffff, M(0, 0.6, 0));
}

// ---------- structures ----------
export function structureGeometry(tier: string): { body: G; crystal: G; height: number } {
  const IV = 0xece3cc, IV2 = 0xcfc3a6, BR = 0xb8913f, DK = 0x5a5068;
  if (tier === 'seal') {
    const parts: G[] = [colored(cyl(1.9, 2.1, 0.4, 12), IV2, M(0, 0.2, 0))];
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; parts.push(colored(box(0.5, 2.6, 0.7), IV, M(Math.cos(a) * 1.5, 1.5, Math.sin(a) * 1.5, 0, -a, 0.08))); parts.push(colored(box(0.6, 0.2, 0.8), BR, M(Math.cos(a) * 1.5, 2.85, Math.sin(a) * 1.5, 0, -a, 0))); }
    return { body: merge(parts), crystal: merge([colored(new THREE.TorusGeometry(0.8, 0.1, 6, 20), 0xffffff, M(0, 1.8, 0, Math.PI / 2, 0, 0)), colored(new THREE.OctahedronGeometry(0.45, 0), 0xffffff, M(0, 1.8, 0))]), height: 3.4 };
  }
  if (tier === 'engine') {
    return {
      body: merge([
        colored(cyl(2.8, 3.2, 1.0, 12), IV2, M(0, 0.5, 0)), colored(cyl(2.0, 2.6, 1.4, 12), BR, M(0, 1.7, 0)), colored(cyl(1.0, 1.8, 2.2, 10), IV, M(0, 3.4, 0)),
        ...[0, 1, 2, 3, 4].map((i) => { const a = (i / 5) * Math.PI * 2; return colored(cone(0.35, 1.6, 5), BR, M(Math.cos(a) * 1.3, 5.2, Math.sin(a) * 1.3, Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3)); }),
      ]),
      crystal: merge([colored(sph(0.9, 1), 0xffffff, M(0, 5.3, 0)), colored(new THREE.TorusGeometry(1.8, 0.09, 6, 28), 0xffffff, M(0, 4.4, 0, Math.PI / 2, 0, 0))]),
      height: 7,
    };
  }
  if (tier === 'fountain') {
    return {
      body: merge([colored(cyl(3.5, 3.8, 0.4, 16), IV2, M(0, 0.2, 0)), ...[0, 1, 2, 3, 4, 5].map((i) => { const a = (i / 6) * Math.PI * 2; return colored(box(0.4, 1.6, 0.4), IV, M(Math.cos(a) * 3.2, 0.8, Math.sin(a) * 3.2)); })]),
      crystal: merge([colored(cyl(2.6, 2.6, 0.1, 16), 0xffffff, M(0, 0.45, 0))]), height: 2,
    };
  }
  const big = tier === 'core';
  const h = big ? 7 : tier === 'guard' ? 6.4 : 5.8;
  return {
    body: merge([
      colored(cyl(1.25, 1.5, 0.8, 6), IV2, M(0, 0.4, 0)), colored(cyl(0.7, 1.05, h - 2, 6), IV, M(0, 0.8 + (h - 2) / 2, 0)),
      colored(cyl(1.0, 0.8, 0.5, 6), BR, M(0, h - 1.0, 0)), colored(box(0.2, 0.8, 0.2), DK, M(0.9, h - 0.6, 0)), colored(box(0.2, 0.8, 0.2), DK, M(-0.9, h - 0.6, 0)),
      ...(big ? [colored(cone(0.3, 1.0, 5), BR, M(0.7, h, 0.7)), colored(cone(0.3, 1.0, 5), BR, M(-0.7, h, -0.7))] : []),
    ]),
    crystal: merge([colored(new THREE.OctahedronGeometry(0.55, 0), 0xffffff, M(0, h + 0.1, 0, 0, 0, 0, 1, 1.6, 1))]),
    height: h + 0.8,
  };
}

// ---------- heroes ----------
export interface HeroRig {
  root: THREE.Group; // positioned in world
  body: THREE.Group; // animated (bob/lean)
  armL: THREE.Object3D; armR: THREE.Object3D; legL: THREE.Object3D | null; legR: THREE.Object3D | null;
  weapon: THREE.Object3D | null;
  spin: THREE.Object3D[];
  glowMats: THREE.MeshLambertMaterial[];
  allMats: THREE.Material[];
  height: number;
}

function mesh(g: G, mat: THREE.Material, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0): THREE.Mesh {
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
  return m;
}

export function buildHero(id: HeroId): HeroRig {
  const def = HEROES[id];
  const bodyM = lambert(def.colors.body);
  const accM = lambert(def.colors.accent);
  const glowM = lambert(def.colors.glow, { emissive: new THREE.Color(def.colors.glow), emissiveIntensity: 0.9 });
  const darkM = lambert(0x2b2633);
  const skinM = lambert(0xd9b38c);
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const mkLimb = (len: number, r: number, mat: THREE.Material, x: number, y: number) => {
    const piv = new THREE.Group(); piv.position.set(x, y, 0);
    piv.add(mesh(cyl(r, r * 0.85, len, 6), mat, 0, -len / 2, 0));
    body.add(piv); return piv;
  };
  let armL: THREE.Object3D, armR: THREE.Object3D, legL: THREE.Object3D | null = null, legR: THREE.Object3D | null = null, weapon: THREE.Object3D | null = null;
  const spin: THREE.Object3D[] = [];
  let height = 2;
  switch (id) {
    case 'brannoch': {
      body.add(mesh(box(1.0, 0.95, 0.7), bodyM, 0, 1.35, 0));
      body.add(mesh(box(1.3, 0.35, 0.8), accM, 0, 1.75, 0));
      body.add(mesh(box(0.45, 0.45, 0.6), bodyM, -0.72, 1.85, 0, 0, 0, 0.3));
      body.add(mesh(box(0.45, 0.45, 0.6), bodyM, 0.72, 1.85, 0, 0, 0, -0.3));
      body.add(mesh(sph(0.24), skinM, 0, 2.05, 0.05));
      body.add(mesh(box(0.5, 0.18, 0.55), accM, 0, 2.25, 0));
      legL = mkLimb(0.85, 0.17, darkM, -0.25, 0.9); legR = mkLimb(0.85, 0.17, darkM, 0.25, 0.9);
      armL = mkLimb(0.8, 0.16, bodyM, -0.68, 1.7); armR = mkLimb(0.8, 0.16, bodyM, 0.68, 1.7);
      const ham = new THREE.Group();
      ham.add(mesh(cyl(0.06, 0.06, 1.4, 6), darkM, 0, -0.2, 0));
      ham.add(mesh(box(0.7, 0.45, 0.45), bodyM, 0, -0.9, 0));
      ham.add(mesh(box(0.72, 0.12, 0.47), glowM, 0, -0.9, 0));
      ham.position.set(0, -0.75, 0.15); ham.rotation.x = Math.PI / 2.5;
      armR.add(ham); weapon = ham;
      height = 2.5;
      break;
    }
    case 'suri': {
      body.add(mesh(box(0.55, 0.7, 0.38), bodyM, 0, 1.3, 0));
      body.add(mesh(sph(0.2), skinM, 0, 1.85, 0));
      body.add(mesh(cyl(0.26, 0.24, 0.12, 8), accM, 0, 2.02, 0));
      body.add(mesh(box(0.3, 0.32, 0.22), accM, 0.32, 1.0, -0.12));
      body.add(mesh(box(0.12, 0.05, 0.9), glowM, -0.15, 1.6, -0.45, 0.4, 0, 0));
      legL = mkLimb(0.85, 0.11, darkM, -0.14, 0.95); legR = mkLimb(0.85, 0.11, darkM, 0.14, 0.95);
      armL = mkLimb(0.65, 0.09, bodyM, -0.36, 1.6); armR = mkLimb(0.65, 0.09, bodyM, 0.36, 1.6);
      const gun = new THREE.Group();
      gun.add(mesh(box(0.16, 0.16, 0.7), accM, 0, 0, 0.25));
      gun.add(mesh(box(0.6, 0.06, 0.1), darkM, 0, 0.05, 0.4));
      gun.add(mesh(sph(0.08, 0), glowM, 0, 0, 0.62));
      gun.position.set(0, -0.6, 0.1);
      armR.add(gun); weapon = gun;
      height = 2.1;
      break;
    }
    case 'oru': {
      const core = mesh(sph(0.32, 1), glowM, 0, 1.4, 0);
      body.add(core);
      const wingM = patchFog(new THREE.MeshLambertMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.75, side: THREE.DoubleSide, emissive: new THREE.Color(0x3a7fa0), emissiveIntensity: 0.5 }));
      const wl = new THREE.Group(); wl.position.set(-0.2, 1.5, -0.1);
      wl.add(mesh(new THREE.CircleGeometry(0.7, 6), wingM, -0.55, 0.2, 0, 0, 0.3, 0.4));
      wl.add(mesh(new THREE.CircleGeometry(0.45, 6), wingM, -0.45, -0.35, 0, 0, 0.3, -0.5));
      const wr = new THREE.Group(); wr.position.set(0.2, 1.5, -0.1);
      wr.add(mesh(new THREE.CircleGeometry(0.7, 6), wingM, 0.55, 0.2, 0, 0, -0.3, -0.4));
      wr.add(mesh(new THREE.CircleGeometry(0.45, 6), wingM, 0.45, -0.35, 0, 0, -0.3, 0.5));
      body.add(wl, wr);
      armL = wl; armR = wr;
      const swarm = new THREE.Group(); swarm.position.set(0, 1.4, 0);
      for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; swarm.add(mesh(sph(0.09, 0), bodyM, Math.cos(a) * 0.7, Math.sin(i * 1.7) * 0.3, Math.sin(a) * 0.7)); }
      body.add(swarm); spin.push(swarm);
      body.add(mesh(cone(0.2, 0.6), accM, 0, 0.85, 0, Math.PI, 0, 0));
      height = 2.2;
      break;
    }
    case 'kesh': {
      body.add(mesh(box(0.8, 0.75, 0.55), bodyM, 0, 1.2, 0.05, 0.35, 0, 0));
      body.add(mesh(sph(0.26), bodyM, 0, 1.6, 0.4));
      body.add(mesh(cone(0.12, 0.35), accM, 0.12, 1.62, 0.65, Math.PI / 2, 0, 0));
      for (let i = 0; i < 5; i++) body.add(mesh(cone(0.07, 0.7, 4), accM, -0.3 + i * 0.15, 1.65, -0.25, -0.5, 0, (i - 2) * 0.15));
      legL = mkLimb(0.8, 0.15, darkM, -0.22, 0.85); legR = mkLimb(0.8, 0.15, darkM, 0.22, 0.85);
      armL = mkLimb(0.8, 0.13, bodyM, -0.5, 1.45); armR = mkLimb(0.8, 0.13, bodyM, 0.5, 1.45);
      const clv = new THREE.Group();
      clv.add(mesh(cyl(0.04, 0.04, 0.5, 5), darkM, 0, 0, 0));
      clv.add(mesh(box(0.08, 0.9, 0.35), glowM, 0, -0.6, 0.12));
      clv.position.set(0, -0.8, 0.1); clv.rotation.x = Math.PI / 2.2;
      armR.add(clv); weapon = clv;
      height = 2.1;
      break;
    }
    case 'ilyra': {
      body.add(mesh(cone(0.55, 1.5, 8), bodyM, 0, 0.75, 0));
      body.add(mesh(box(0.45, 0.45, 0.3), bodyM, 0, 1.55, 0));
      body.add(mesh(sph(0.2), skinM, 0, 1.95, 0));
      body.add(mesh(cone(0.28, 0.6, 8), accM, 0, 2.3, -0.05, -0.15, 0, 0));
      armL = mkLimb(0.6, 0.08, bodyM, -0.3, 1.7); armR = mkLimb(0.6, 0.08, bodyM, 0.3, 1.7);
      const book = new THREE.Group(); book.position.set(-0.75, 1.6, 0.25);
      book.add(mesh(box(0.42, 0.08, 0.32), accM));
      book.add(mesh(box(0.38, 0.1, 0.28), lambert(0xf5ecd8), 0, 0.03, 0));
      body.add(book); spin.push(book);
      const quill = mesh(cone(0.05, 0.6, 4), glowM, 0, -0.55, 0.15, Math.PI / 2, 0, 0);
      armR.add(quill); weapon = quill;
      height = 2.5;
      break;
    }
    case 'vey': {
      body.add(mesh(box(0.45, 0.7, 0.32), bodyM, 0, 1.3, 0));
      body.add(mesh(sph(0.19), bodyM, 0, 1.85, 0));
      for (let i = 0; i < 3; i++) body.add(mesh(cone(0.06, 0.45, 4), glowM, -0.12 + i * 0.12, 2.1, -0.05, -0.2, 0, (i - 1) * 0.35));
      const capeM = patchFog(new THREE.MeshLambertMaterial({ color: 0x3a4a70, side: THREE.DoubleSide }));
      body.add(mesh(new THREE.PlaneGeometry(0.6, 1.1), capeM, 0, 1.15, -0.22, 0.15, 0, 0));
      legL = mkLimb(0.85, 0.1, darkM, -0.12, 0.95); legR = mkLimb(0.85, 0.1, darkM, 0.12, 0.95);
      armL = mkLimb(0.65, 0.08, bodyM, -0.32, 1.6); armR = mkLimb(0.65, 0.08, bodyM, 0.32, 1.6);
      const glassM = patchFog(new THREE.MeshLambertMaterial({ color: 0xc8f6ff, transparent: true, opacity: 0.8, emissive: new THREE.Color(0x5fb8d0), emissiveIntensity: 0.8 }));
      const k1 = mesh(cone(0.06, 0.7, 4), glassM, 0, -0.75, 0.1, Math.PI / 1.8, 0, 0);
      const k2 = mesh(cone(0.06, 0.7, 4), glassM, 0, -0.75, 0.1, Math.PI / 1.8, 0, 0);
      armR.add(k1); armL.add(k2); weapon = k1;
      height = 2.1;
      break;
    }
  }
  const glowMats = [glowM];
  const allMats: THREE.Material[] = [];
  root.traverse((o) => { if ((o as THREE.Mesh).isMesh) { const mm = (o as THREE.Mesh).material as THREE.Material; if (!allMats.includes(mm)) allMats.push(mm); } });
  root.scale.setScalar(1.5);
  return { root, body, armL: armL!, armR: armR!, legL, legR, weapon, spin, glowMats, allMats, height: height * 1.5 };
}

/** Animate a hero rig. an: 0 idle 1 move 2 attack 3 cast 4 channel 5 dead 6 dash 7 airborne */
export function animateHero(r: HeroRig, an: number, t: number, sinceAnim: number, id: HeroId) {
  const b = r.body;
  b.position.y = 0; b.rotation.set(0, 0, 0);
  const floaty = id === 'oru';
  if (floaty) b.position.y = 0.25 + Math.sin(t * 2.2) * 0.12;
  for (const s of r.spin) s.rotation.y = t * (id === 'oru' ? 1.6 : 0.8);
  let armL = 0, armR = 0, legL = 0, legR = 0;
  switch (an) {
    case 1: case 6: {
      const ph = t * (an === 6 ? 16 : 9.5);
      legL = Math.sin(ph) * 0.7; legR = -Math.sin(ph) * 0.7; armL = -Math.sin(ph) * 0.5; armR = Math.sin(ph) * 0.5;
      b.position.y += Math.abs(Math.sin(ph)) * 0.08; b.rotation.x = an === 6 ? 0.35 : 0.12;
      break;
    }
    case 2: {
      const k = Math.min(1, sinceAnim / 0.35);
      const swing = k < 0.45 ? -k / 0.45 * 1.8 : -1.8 + ((k - 0.45) / 0.55) * 2.6;
      armR = swing; b.rotation.y = k < 0.45 ? -0.2 : 0.25; b.rotation.x = 0.1;
      break;
    }
    case 3: case 4: {
      const k = Math.min(1, sinceAnim / 0.3);
      armL = -2.2 * k; armR = -2.2 * k; b.position.y += 0.05 * k;
      if (an === 4) { armR = -1.6; armL = -1.4; b.rotation.x = -0.1 + Math.sin(t * 30) * 0.02; }
      break;
    }
    case 5: b.rotation.z = Math.min(1.4, sinceAnim * 3); b.position.y = -Math.min(0.6, sinceAnim * 0.6); break;
    case 7: b.position.y += 1.2 + Math.sin(t * 8) * 0.1; b.rotation.x = -0.5; armL = -2.5; armR = -2.5; break;
    default: { const br = Math.sin(t * 2) * 0.05; armL = br; armR = -br; b.position.y += Math.sin(t * 2) * 0.02; }
  }
  if (floaty) { r.armL.rotation.y = Math.sin(t * 9) * 0.45; r.armR.rotation.y = -Math.sin(t * 9) * 0.45; }
  else { r.armL.rotation.x = armL; r.armR.rotation.x = armR; }
  if (r.legL) r.legL.rotation.x = legL;
  if (r.legR) r.legR.rotation.x = legR;
}
