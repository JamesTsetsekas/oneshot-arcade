// renderer: Glass Ravine terrain mesh, bridge decks, brush and decorative crystals.
import * as THREE from 'three';
import { F_BRIDGE, F_BRUSH, F_BUILD, F_CHASM, F_CLIFF, F_RAMP, F_ROCK, F_WALK, MAP_SIZE, heightAt, type GameMap } from '../world/map';
import { GB } from './models';
import { makeWorldMaterial } from './materials';

function hash(x: number, z: number, k = 0): number {
  let h = (Math.imul(x, 374761393) + Math.imul(z, 668265263) + Math.imul(k, 2147483647)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function vnoise(x: number, z: number): number {
  const xi = Math.floor(x), zi = Math.floor(z);
  const fx = x - xi, fz = z - zi;
  const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  return (a * (1 - sx) + b * sx) * (1 - sz) + (c * (1 - sx) + d * sx) * sz;
}

const C = (hex: number) => new THREE.Color().setHex(hex, THREE.SRGBColorSpace);
const BASALT = C(0x465066), BASALT2 = C(0x5b6982), SHELF = C(0x77839a), SHELF2 = C(0x948c7c), LOW = C(0x2c4a56), LOW2 = C(0x3b6470);
const ROCK = C(0x1c2028), ROCK_TOP = C(0x424a58), DEEP = C(0x0a2a30), GLOW = C(0x1fd8c6), RAMP = C(0x565c68), BRUSHG = C(0x2f3a4a);
const DBG = { walk: C(0x2f7d4f), build: C(0x3f9bd6), blocked: C(0x7a2b2b), hover: C(0xb08a2a), brush: C(0x8a4fd0), ramp: C(0xd6c23f) };

export class TerrainView {
  readonly group = new THREE.Group();
  private mesh: THREE.Mesh;
  private colors: Float32Array;
  private baseColors: Float32Array;
  private debugColors: Float32Array | null = null;
  private map: GameMap;

  constructor(map: GameMap) {
    this.map = map;
    const S = MAP_SIZE, V = S + 1;
    const pos = new Float32Array(V * V * 3);
    const col = new Float32Array(V * V * 3);
    const glow = new Float32Array(V * V);
    const tmp = new THREE.Color();
    for (let j = 0; j < V; j++) {
      for (let i = 0; i < V; i++) {
        const k = j * V + i;
        const h = map.vertH[k];
        pos[k * 3] = i; pos[k * 3 + 1] = h; pos[k * 3 + 2] = j;
        // blend the colours of adjacent cells
        let r = 0, g = 0, b = 0, n = 0, gl = 0;
        for (let dz = -1; dz <= 0; dz++) for (let dx = -1; dx <= 0; dx++) {
          const x = Math.min(S - 1, Math.max(0, i + dx)), z = Math.min(S - 1, Math.max(0, j + dz));
          const f = map.flags[z * S + x], e = map.elev[z * S + x];
          const big = vnoise(x * 0.07, z * 0.07), fine = vnoise(x * 0.31 + 40, z * 0.31 + 9);
          if (f & F_CHASM || f & F_BRIDGE) { tmp.copy(DEEP); }
          else if (f & F_ROCK) tmp.copy(ROCK).lerp(ROCK_TOP, Math.min(1, Math.max(0, (h - 2.5) / 3)) * (0.5 + fine * 0.5));
          else if (f & F_CLIFF) tmp.copy(ROCK).lerp(ROCK_TOP, 0.25 + fine * 0.4);
          else if (f & F_RAMP) tmp.copy(RAMP).lerp(BASALT2, fine * 0.5);
          else if (e === 2) tmp.copy(SHELF).lerp(SHELF2, big).multiplyScalar(0.82 + fine * 0.25);
          else if (e === 0) tmp.copy(LOW).lerp(LOW2, fine);
          else tmp.copy(BASALT).lerp(BASALT2, big * 0.9).lerp(SHELF, Math.max(0, big - 0.62) * 1.2).multiplyScalar(0.85 + fine * 0.3);
          if (f & F_BRUSH) tmp.lerp(BRUSHG, 0.6);
          r += tmp.r; g += tmp.g; b += tmp.b; n++;
        }
        r /= n; g /= n; b /= n;
        // the rift floor glows with crystalline light
        if (h < -5) { const t = Math.min(1, (-h - 5) / 3.5); r += (GLOW.r - r) * t * 0.75; g += (GLOW.g - g) * t * 0.75; b += (GLOW.b - b) * t * 0.75; gl = t * 0.9; }
        col[k * 3] = r; col[k * 3 + 1] = g; col[k * 3 + 2] = b;
        glow[k] = gl;
      }
    }
    const idx = new Uint32Array(S * S * 6);
    let q = 0;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const a = j * V + i, b = a + 1, c = a + V, d = c + 1;
      // alternate the diagonal for a less directional look
      if ((i + j) & 1) { idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; }
      else { idx[q++] = a; idx[q++] = c; idx[q++] = d; idx[q++] = a; idx[q++] = d; idx[q++] = b; }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('aGlow', new THREE.BufferAttribute(glow, 1));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.computeVertexNormals();
    this.colors = col;
    this.baseColors = col.slice();
    this.mesh = new THREE.Mesh(geo, makeWorldMaterial({ glow: true, grid: true }));
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
    this.group.add(this.mesh);

    // apron so the camera never sees void beyond the rim
    const ag = new THREE.PlaneGeometry(900, 900);
    ag.rotateX(-Math.PI / 2);
    const apron = new THREE.Mesh(ag, new THREE.MeshBasicMaterial({ color: 0x06080b }));
    apron.position.set(S / 2, -12, S / 2);
    this.group.add(apron);
    // rim walls hide the apron seam
    const rim = new GB();
    rim.box(S + 160, 9, 80, S / 2, 4.2, -39.5, 0x151920).box(S + 160, 9, 80, S / 2, 4.2, S + 39.5, 0x151920).box(80, 9, S, -39.5, 4.2, S / 2, 0x151920).box(80, 9, S, S + 39.5, 4.2, S / 2, 0x151920);
    const rimMesh = new THREE.Mesh(rim.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }));
    this.group.add(rimMesh);
    // a ring of low-poly peaks frames the playable area
    const peaks = new GB();
    for (let side = 0; side < 4; side++) {
      for (let row = 0; row < 3; row++) {
        for (let i = -6; i < 46; i++) {
          const along = i * 4.4 + hash(i, side, row + 20) * 3;
          const out = -3 - row * 9 - hash(i, side, row + 30) * 5;
          const x = side === 0 ? along : side === 1 ? along : side === 2 ? out : S - out;
          const z = side === 0 ? out : side === 1 ? S - out : along;
          const hgt = 9 + row * 5 + hash(i, side, row + 40) * 11;
          const rad = 4.5 + hash(i, side, row + 50) * 4.5;
          const shade = hash(i, side, row + 60);
          peaks.cone(rad, hgt, x, 4 + hgt / 2, z, shade > 0.66 ? 0x232a36 : shade > 0.33 ? 0x1a202a : 0x2c3442, { seg: 5, ry: shade * 6 });
          if (shade > 0.9) peaks.octa(1.1, x + 1, 4 + hgt * 0.62, z + rad * 0.5, 0x35e0d0, { sy: 2.4, rz: 0.4, glow: 1 });
        }
      }
    }
    const peakMesh = new THREE.Mesh(peaks.build(), makeWorldMaterial({ glow: true }));
    peakMesh.castShadow = true;
    this.group.add(peakMesh);

    this.buildBridges();
    this.buildDecor();
  }

  private buildBridges(): void {
    const map = this.map, S = MAP_SIZE;
    const b = new GB();
    let any = false;
    for (let z = 0; z < S; z++) for (let x = 0; x < S; x++) {
      const f = map.flags[z * S + x];
      if (!(f & F_BRIDGE)) continue;
      any = true;
      const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => map.flags[(z + dz) * S + x + dx] & F_CHASM);
      b.box(1.02, 0.5, 1.02, x + 0.5, -0.26, z + 0.5, edge ? 0x6d7684 : (x + z) % 4 === 0 ? 0x7f8896 : 0x99a1ad);
      if (edge) b.box(0.3, 0.5, 0.3, x + 0.5, 0.2, z + 0.5, 0x3a414d).box(0.16, 0.12, 0.16, x + 0.5, 0.5, z + 0.5, 0x35e0d0, { glow: (x + z) % 2 === 0 ? 2.2 : 0 });
      if ((x * 7 + z * 3) % 11 === 0) b.box(0.5, 6, 0.5, x + 0.5, -3.5, z + 0.5, 0x2b3038);
    }
    if (!any) return;
    const mesh = new THREE.Mesh(b.build(), makeWorldMaterial({ glow: true }));
    mesh.castShadow = true; mesh.receiveShadow = true;
    this.group.add(mesh);
  }

  private buildDecor(): void {
    const map = this.map, S = MAP_SIZE;
    // brush: instanced reed tufts on brush cells
    const reed = new GB();
    for (let i = 0; i < 5; i++) {
      const a = (i * 2 * Math.PI) / 5;
      reed.cone(0.09, 1.5 + (i % 2) * 0.5, Math.sin(a) * 0.22, 0.8, Math.cos(a) * 0.22, i % 2 ? 0x5c4fa8 : 0x3d6f7a, { rx: 0.25 * Math.cos(a), rz: -0.25 * Math.sin(a), seg: 4 });
    }
    reed.ball(0.12, 0, 1.75, 0, 0xb48cff, { glow: 1.6, detail: 0 });
    const reedGeo = reed.build();
    const brushCells: number[] = [];
    const crystalCells: number[] = [];
    for (let z = 2; z < S - 2; z++) for (let x = 2; x < S - 2; x++) {
      const f = map.flags[z * S + x];
      if (f & F_BRUSH) { brushCells.push(x, z); if (hash(x, z, 5) > 0.45) brushCells.push(x + 0.5, z + 0.45); }
      else if ((f & (F_ROCK | F_CLIFF)) && hash(x, z, 9) > 0.93 && x > 5 && z > 5 && x < S - 6 && z < S - 6) crystalCells.push(x, z);
      else if ((f & F_CHASM) && hash(x, z, 11) > 0.9) crystalCells.push(x, z);
    }
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), e = new THREE.Euler();
    if (brushCells.length > 0) {
      const mesh = new THREE.InstancedMesh(reedGeo, makeWorldMaterial({ glow: true }), brushCells.length / 2);
      for (let i = 0; i < brushCells.length / 2; i++) {
        const x = brushCells[i * 2] + 0.2 + hash(i, 3, 1) * 0.6, z = brushCells[i * 2 + 1] + 0.2 + hash(i, 7, 2) * 0.6;
        e.set(0, hash(i, 1, 3) * 6.28, 0); q.setFromEuler(e);
        const sc = 0.75 + hash(i, 2, 4) * 0.6;
        p.set(x, heightAt(map, x, z) - 0.05, z); s.set(sc, sc * (0.8 + hash(i, 5, 5) * 0.5), sc);
        m4.compose(p, q, s);
        mesh.setMatrixAt(i, m4);
      }
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
    }
    if (crystalCells.length > 0) {
      const cg = new GB();
      cg.octa(0.5, 0, 0.5, 0, 0x35e0d0, { sy: 2.2, glow: 0.9 }).octa(0.32, 0.4, 0.3, 0.2, 0x35e0d0, { sy: 1.8, rz: -0.5, glow: 0.9 }).octa(0.28, -0.35, 0.25, -0.2, 0x8ff0e6, { sy: 1.6, rz: 0.5, glow: 0.7 });
      const mesh = new THREE.InstancedMesh(cg.build(), makeWorldMaterial({ glow: true }), crystalCells.length / 2);
      const V = S + 1;
      for (let i = 0; i < crystalCells.length / 2; i++) {
        const x = crystalCells[i * 2] + 0.5, z = crystalCells[i * 2 + 1] + 0.5;
        const cx = crystalCells[i * 2], cz = crystalCells[i * 2 + 1];
        const y = (map.vertH[cz * V + cx] + map.vertH[cz * V + cx + 1] + map.vertH[(cz + 1) * V + cx] + map.vertH[(cz + 1) * V + cx + 1]) / 4;
        e.set((hash(i, 1, 6) - 0.5) * 0.7, hash(i, 2, 7) * 6.28, (hash(i, 3, 8) - 0.5) * 0.7); q.setFromEuler(e);
        const sc = 0.7 + hash(i, 4, 9) * 1.3;
        p.set(x, y - 0.1, z); s.set(sc, sc, sc);
        m4.compose(p, q, s);
        mesh.setMatrixAt(i, m4);
      }
      this.group.add(mesh);
    }
  }

  /** Debug visualisation of walkable / buildable / blocked / hover-only / vision-blocking surfaces. */
  setDebug(on: boolean): void {
    const S = MAP_SIZE, V = S + 1;
    if (on && !this.debugColors) {
      const dc = new Float32Array(this.baseColors.length);
      for (let j = 0; j < V; j++) for (let i = 0; i < V; i++) {
        const x = Math.min(S - 1, i), z = Math.min(S - 1, j);
        const f = this.map.flags[z * S + x];
        const c = f & F_BRUSH ? DBG.brush : f & F_RAMP ? DBG.ramp : f & F_CHASM ? DBG.hover : f & F_BUILD ? DBG.build : f & F_WALK ? DBG.walk : f & (F_CLIFF) ? DBG.hover : DBG.blocked;
        const k = (j * V + i) * 3;
        dc[k] = c.r; dc[k + 1] = c.g; dc[k + 2] = c.b;
      }
      this.debugColors = dc;
    }
    this.colors.set(on && this.debugColors ? this.debugColors : this.baseColors);
    (this.mesh.geometry.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
  }
}
