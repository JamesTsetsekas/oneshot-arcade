// Small procedural-geometry toolkit: compose primitives with vertex colours into single merged geometries.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export interface Part {
  geo: THREE.BufferGeometry;
  color: number;
  pos?: [number, number, number];
  rot?: [number, number, number];
  scale?: [number, number, number];
}

const m4 = new THREE.Matrix4();
const q = new THREE.Quaternion();
const e = new THREE.Euler();
const v3 = new THREE.Vector3();
const s3 = new THREE.Vector3();
const c = new THREE.Color();

export function merge(parts: Part[]): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];
  for (const p of parts) {
    let g = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone();
    e.set(p.rot?.[0] ?? 0, p.rot?.[1] ?? 0, p.rot?.[2] ?? 0);
    q.setFromEuler(e);
    v3.set(p.pos?.[0] ?? 0, p.pos?.[1] ?? 0, p.pos?.[2] ?? 0);
    s3.set(p.scale?.[0] ?? 1, p.scale?.[1] ?? 1, p.scale?.[2] ?? 1);
    m4.compose(v3, q, s3);
    g.applyMatrix4(m4);
    const n = g.getAttribute('position').count;
    const col = new Float32Array(n * 3);
    c.setHex(p.color);
    for (let i = 0; i < n; i++) {
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    if (!g.getAttribute('uv')) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    g.deleteAttribute('uv1' as never);
    geos.push(g);
  }
  const out = mergeGeometries(geos, false) ?? new THREE.BufferGeometry();
  out.computeBoundingSphere();
  return out;
}

export const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
export const cyl = (rt: number, rb: number, h: number, seg = 10) => new THREE.CylinderGeometry(rt, rb, h, seg);
export const sph = (r: number, ws = 10, hs = 8) => new THREE.SphereGeometry(r, ws, hs);
export const cone = (r: number, h: number, seg = 8) => new THREE.ConeGeometry(r, h, seg);
export const torus = (r: number, t: number, rs = 8, ts = 18) => new THREE.TorusGeometry(r, t, rs, ts);
export const ico = (r: number, d = 0) => new THREE.IcosahedronGeometry(r, d);
export const dodeca = (r: number) => new THREE.DodecahedronGeometry(r, 0);
export const octa = (r: number) => new THREE.OctahedronGeometry(r, 0);

/** Seeded pseudo random for visuals (separate from sim RNG). */
export function hash2(x: number, z: number): number {
  let h = Math.imul(Math.floor(x) * 374761393 + Math.floor(z) * 668265263, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export function shade(hex: number, f: number): number {
  const col = new THREE.Color(hex);
  col.multiplyScalar(f);
  return col.getHex();
}
