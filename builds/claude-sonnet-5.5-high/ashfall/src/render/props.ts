// Prop geometry builders. Each prop type yields a lit mesh (vertex coloured) and an optional emissive mesh.
import * as THREE from 'three';
import type { PropType } from '../sim/world';
import { box, cone, cyl, dodeca, ico, merge, octa, shade, sph, torus, type Part } from './geo';

export interface PropGeo {
  lit: THREE.BufferGeometry;
  glow?: THREE.BufferGeometry;
}

const STONE = 0x6b6a68;
const STONE_D = 0x4a4947;
const STONE_L = 0x8d8b86;
const BRASS = 0x8a7a42;
const VERD = 0x4f7a6a;
const WOOD = 0x4a3a2c;
const ASH = 0x2f2c2b;
const CYAN = 0x5ee8ff;
const EMBER = 0xff7a30;

const cache = new Map<PropType, PropGeo>();

export function propGeo(type: PropType): PropGeo {
  let g = cache.get(type);
  if (!g) {
    g = build(type);
    cache.set(type, g);
  }
  return g;
}

function build(type: PropType): PropGeo {
  const L: Part[] = [];
  const G: Part[] = [];
  switch (type) {
    case 'rock':
      L.push({ geo: dodeca(0.8), color: STONE_D, pos: [0, 0.45, 0], scale: [1.1, 0.75, 1] });
      L.push({ geo: dodeca(0.5), color: STONE, pos: [0.55, 0.28, 0.2], scale: [1, 0.7, 1] });
      L.push({ geo: dodeca(0.35), color: STONE_L, pos: [-0.5, 0.2, -0.3], scale: [1, 0.7, 1] });
      break;
    case 'tree':
      L.push({ geo: cyl(0.08, 0.22, 2.6, 6), color: 0x2c2420, pos: [0, 1.3, 0] });
      for (let i = 0; i < 5; i++) {
        const a = i * 1.7;
        L.push({ geo: cyl(0.02, 0.07, 1.3, 5), color: 0x2c2420, pos: [Math.cos(a) * 0.35, 2.1 + i * 0.12, Math.sin(a) * 0.35], rot: [Math.sin(a) * 0.9, 0, Math.cos(a) * -0.9 + 0.2] });
      }
      L.push({ geo: cyl(0.02, 0.05, 1.0, 5), color: 0x2c2420, pos: [0.1, 2.8, 0], rot: [0.2, 0, -0.3] });
      break;
    case 'pillar':
      L.push({ geo: cyl(0.62, 0.7, 0.28, 10), color: STONE_L, pos: [0, 0.14, 0] });
      L.push({ geo: cyl(0.42, 0.48, 3.0, 10), color: STONE, pos: [0, 1.7, 0] });
      L.push({ geo: cyl(0.6, 0.45, 0.3, 10), color: STONE_L, pos: [0, 3.3, 0] });
      L.push({ geo: cyl(0.5, 0.5, 0.06, 10), color: BRASS, pos: [0, 2.2, 0], scale: [1.12, 1, 1.12] });
      break;
    case 'ruinwall':
      L.push({ geo: box(2.6, 1.6, 0.6), color: STONE, pos: [0, 0.8, 0] });
      L.push({ geo: box(1.4, 1.0, 0.6), color: STONE_D, pos: [-0.6, 2.05, 0] });
      L.push({ geo: box(0.7, 0.6, 0.6), color: STONE_L, pos: [0.9, 1.9, 0] });
      L.push({ geo: box(0.5, 0.35, 0.5), color: STONE_D, pos: [1.5, 0.18, 0.7], rot: [0, 0.6, 0.1] });
      break;
    case 'grave':
      L.push({ geo: box(0.55, 0.9, 0.16), color: STONE, pos: [0, 0.45, 0], rot: [0, 0, 0.06] });
      L.push({ geo: cyl(0.28, 0.28, 0.16, 8), color: STONE, pos: [0, 0.9, 0], rot: [Math.PI / 2, 0, 0.06] });
      L.push({ geo: box(0.5, 0.12, 1.1), color: STONE_D, pos: [0, 0.06, 0.8] });
      break;
    case 'crate':
      L.push({ geo: box(1, 0.9, 1), color: 0x6a5238, pos: [0, 0.45, 0] });
      L.push({ geo: box(1.06, 0.12, 1.06), color: BRASS, pos: [0, 0.2, 0] });
      L.push({ geo: box(1.06, 0.12, 1.06), color: BRASS, pos: [0, 0.7, 0] });
      break;
    case 'brazier':
      L.push({ geo: cyl(0.1, 0.16, 0.9, 6), color: BRASS, pos: [0, 0.45, 0] });
      L.push({ geo: cyl(0.42, 0.22, 0.3, 10), color: shade(BRASS, 0.8), pos: [0, 1.0, 0] });
      for (let i = 0; i < 3; i++) L.push({ geo: cyl(0.04, 0.05, 0.5, 5), color: BRASS, pos: [Math.cos(i * 2.1) * 0.12, 0.2, Math.sin(i * 2.1) * 0.12], rot: [Math.sin(i * 2.1) * 0.3, 0, -Math.cos(i * 2.1) * 0.3] });
      G.push({ geo: cone(0.28, 0.7, 7), color: EMBER, pos: [0, 1.4, 0] });
      G.push({ geo: cone(0.16, 0.5, 6), color: 0xffd070, pos: [0.05, 1.45, 0.02] });
      break;
    case 'tent':
      L.push({ geo: cone(1.7, 2.1, 5), color: 0x4a4238, pos: [0, 1.05, 0], rot: [0, 0.3, 0] });
      L.push({ geo: box(0.6, 1.1, 0.06), color: 0x1d1a18, pos: [0, 0.55, 1.18], rot: [0.12, 0.3, 0] });
      L.push({ geo: cyl(0.04, 0.04, 2.8, 5), color: WOOD, pos: [0, 1.4, 0] });
      break;
    case 'banner':
      L.push({ geo: cyl(0.05, 0.05, 3.4, 6), color: WOOD, pos: [0, 1.7, 0] });
      L.push({ geo: box(0.8, 1.6, 0.04), color: 0x7a2a2a, pos: [0.45, 2.5, 0] });
      G.push({ geo: box(0.2, 0.2, 0.05), color: 0xd8b070, pos: [0.45, 2.7, 0.03] });
      L.push({ geo: sph(0.1), color: BRASS, pos: [0, 3.45, 0] });
      break;
    case 'bookcase':
      L.push({ geo: box(2.2, 2.6, 0.7), color: 0x3a2e26, pos: [0, 1.3, 0] });
      for (let r = 0; r < 4; r++) for (let i = 0; i < 6; i++) L.push({ geo: box(0.28, 0.45, 0.45), color: [0x6a3a3a, 0x3a4a5a, 0x5a5a3a, 0x4a3a5a][(i + r) % 4], pos: [-0.85 + i * 0.34, 0.4 + r * 0.6, 0.12] });
      break;
    case 'lamppost':
      L.push({ geo: cyl(0.06, 0.1, 2.8, 6), color: 0x2a2a2c, pos: [0, 1.4, 0] });
      L.push({ geo: box(0.4, 0.5, 0.4), color: 0x2a2a2c, pos: [0, 2.9, 0] });
      G.push({ geo: sph(0.17), color: 0xffc070, pos: [0, 2.9, 0] });
      break;
    case 'machine':
      L.push({ geo: cyl(0.9, 1.0, 0.5, 12), color: shade(STONE, 0.8), pos: [0, 0.25, 0] });
      L.push({ geo: cyl(0.4, 0.5, 1.8, 10), color: BRASS, pos: [0, 1.3, 0] });
      L.push({ geo: torus(0.8, 0.1, 6, 16), color: VERD, pos: [0, 1.5, 0], rot: [Math.PI / 2, 0, 0] });
      L.push({ geo: torus(0.55, 0.08, 6, 14), color: BRASS, pos: [0, 2.0, 0], rot: [Math.PI / 2.5, 0, 0.3] });
      G.push({ geo: sph(0.22), color: EMBER, pos: [0, 2.35, 0] });
      break;
    case 'bones':
      for (let i = 0; i < 5; i++) L.push({ geo: cyl(0.04, 0.05, 0.6, 5), color: 0xcfc8b4, pos: [Math.cos(i * 1.3) * 0.4, 0.05, Math.sin(i * 1.3) * 0.4], rot: [Math.PI / 2, i, 0] });
      L.push({ geo: sph(0.17, 7, 6), color: 0xcfc8b4, pos: [0.1, 0.15, 0.1], scale: [1, 0.9, 1.1] });
      break;
    case 'statue':
      L.push({ geo: box(1.2, 0.5, 1.2), color: STONE_D, pos: [0, 0.25, 0] });
      L.push({ geo: cyl(0.35, 0.45, 1.8, 8), color: STONE, pos: [0, 1.4, 0] });
      L.push({ geo: sph(0.3), color: STONE_L, pos: [0, 2.5, 0] });
      L.push({ geo: box(1.5, 0.22, 0.3), color: STONE, pos: [0, 2.0, 0] });
      G.push({ geo: sph(0.06), color: CYAN, pos: [0.1, 2.52, 0.26] });
      break;
    case 'arch':
      L.push({ geo: box(0.9, 4.2, 0.9), color: STONE, pos: [-1.9, 2.1, 0] });
      L.push({ geo: box(0.9, 4.2, 0.9), color: STONE, pos: [1.9, 2.1, 0] });
      L.push({ geo: box(4.7, 0.8, 1.0), color: STONE_L, pos: [0, 4.3, 0] });
      L.push({ geo: box(1.2, 0.4, 1.2), color: STONE_D, pos: [-1.9, 0.2, 0] });
      L.push({ geo: box(1.2, 0.4, 1.2), color: STONE_D, pos: [1.9, 0.2, 0] });
      G.push({ geo: octa(0.3), color: CYAN, pos: [0, 4.3, 0.55], scale: [1, 1.3, 0.4] });
      break;
    case 'anvil':
      L.push({ geo: box(0.7, 0.5, 0.5), color: 0x3a3a3c, pos: [0, 0.8, 0] });
      L.push({ geo: box(0.4, 0.5, 0.35), color: 0x2a2a2c, pos: [0, 0.4, 0] });
      L.push({ geo: cone(0.18, 0.5, 4), color: 0x3a3a3c, pos: [0.5, 0.82, 0], rot: [0, 0, -Math.PI / 2] });
      G.push({ geo: box(0.4, 0.04, 0.3), color: EMBER, pos: [0, 1.07, 0] });
      break;
    case 'stairs':
      for (let i = 0; i < 5; i++) L.push({ geo: box(2.6, 0.18 * (i + 1), 0.6), color: shade(STONE_L, 0.8 + i * 0.05), pos: [0, 0.09 * (i + 1), -i * 0.5] });
      G.push({ geo: box(2.2, 0.04, 0.3), color: CYAN, pos: [0, 0.95, -2.2] });
      break;
    case 'bell':
      L.push({ geo: cyl(0.2, 0.9, 1.3, 12), color: BRASS, pos: [0, 1.7, 0] });
      L.push({ geo: sph(0.2), color: shade(BRASS, 0.7), pos: [0, 0.95, 0] });
      L.push({ geo: box(1.6, 0.18, 0.2), color: WOOD, pos: [0, 2.55, 0] });
      L.push({ geo: box(0.2, 2.7, 0.2), color: WOOD, pos: [-0.8, 1.3, 0] });
      L.push({ geo: box(0.2, 2.7, 0.2), color: WOOD, pos: [0.8, 1.3, 0] });
      break;
    case 'cage':
      for (let i = 0; i < 8; i++) L.push({ geo: cyl(0.035, 0.035, 2.2, 5), color: 0x3a3a3c, pos: [Math.cos((i / 8) * 6.283) * 1.0, 1.1, Math.sin((i / 8) * 6.283) * 1.0] });
      L.push({ geo: torus(1.0, 0.05, 5, 16), color: 0x3a3a3c, pos: [0, 2.2, 0], rot: [Math.PI / 2, 0, 0] });
      L.push({ geo: torus(1.0, 0.05, 5, 16), color: 0x3a3a3c, pos: [0, 0.05, 0], rot: [Math.PI / 2, 0, 0] });
      L.push({ geo: cone(1.05, 0.5, 8), color: 0x2a2a2c, pos: [0, 2.45, 0] });
      break;
    case 'conduit':
      L.push({ geo: cyl(0.6, 0.8, 0.4, 8), color: STONE_D, pos: [0, 0.2, 0] });
      G.push({ geo: octa(0.6), color: CYAN, pos: [0, 1.4, 0], scale: [0.8, 1.7, 0.8] });
      break;
    case 'spikes':
      for (let i = 0; i < 7; i++) L.push({ geo: cone(0.08, 0.6, 4), color: 0x7a7a7c, pos: [Math.cos(i * 0.9) * 0.4, 0.3, Math.sin(i * 0.9) * 0.4] });
      break;
    case 'orrery':
      L.push({ geo: cyl(1.2, 1.5, 0.5, 14), color: shade(STONE, 0.7), pos: [0, 0.25, 0] });
      L.push({ geo: cyl(0.18, 0.24, 2.6, 8), color: BRASS, pos: [0, 1.6, 0] });
      L.push({ geo: torus(1.5, 0.07, 6, 28), color: BRASS, pos: [0, 2.2, 0], rot: [Math.PI / 2, 0, 0] });
      L.push({ geo: torus(1.15, 0.06, 6, 24), color: VERD, pos: [0, 2.2, 0], rot: [0.4, 0, 0.5] });
      L.push({ geo: torus(0.8, 0.06, 6, 20), color: BRASS, pos: [0, 2.2, 0], rot: [1.1, 0.7, 0] });
      G.push({ geo: sph(0.3, 10, 8), color: CYAN, pos: [0, 2.2, 0] });
      G.push({ geo: sph(0.12), color: EMBER, pos: [1.5, 2.2, 0] });
      break;
    case 'colossus':
      L.push({ geo: box(3.0, 9, 1.6), color: shade(STONE, 0.75), pos: [-3.2, 4.5, 0] });
      L.push({ geo: box(3.0, 9, 1.6), color: shade(STONE, 0.75), pos: [3.2, 4.5, 0] });
      L.push({ geo: box(9.5, 2.4, 1.8), color: STONE_D, pos: [0, 9.2, 0] });
      L.push({ geo: box(2.4, 1.6, 1.4), color: STONE, pos: [0, 11.0, 0] });
      L.push({ geo: sph(0.9), color: STONE_L, pos: [0, 12.2, 0] });
      for (let i = 0; i < 5; i++) L.push({ geo: box(0.4, 7, 0.3), color: BRASS, pos: [-1.6 + i * 0.8, 3.6, 0.6] });
      G.push({ geo: octa(0.5), color: CYAN, pos: [0, 12.2, 0.4], scale: [1, 1.4, 0.5] });
      G.push({ geo: box(2.4, 0.15, 0.1), color: EMBER, pos: [0, 9.2, 0.95] });
      break;
    case 'wagon':
      L.push({ geo: box(2.2, 0.35, 1.2), color: WOOD, pos: [0, 0.8, 0] });
      L.push({ geo: box(2.2, 0.5, 0.08), color: 0x5a4636, pos: [0, 1.15, 0.6] });
      L.push({ geo: box(2.2, 0.5, 0.08), color: 0x5a4636, pos: [0, 1.15, -0.6] });
      L.push({ geo: cyl(0.55, 0.55, 0.1, 10), color: 0x3a2e24, pos: [0.7, 0.55, 0.7], rot: [Math.PI / 2, 0, 0] });
      L.push({ geo: cyl(0.55, 0.55, 0.1, 10), color: 0x3a2e24, pos: [-0.7, 0.55, -0.7], rot: [Math.PI / 2, 0, 0.3] });
      break;
    case 'fence':
      for (let i = 0; i < 5; i++) L.push({ geo: cyl(0.05, 0.06, 1.1, 5), color: WOOD, pos: [-1 + i * 0.5, 0.55, 0] });
      L.push({ geo: box(2.2, 0.08, 0.06), color: WOOD, pos: [0, 0.85, 0] });
      L.push({ geo: box(2.2, 0.08, 0.06), color: WOOD, pos: [0, 0.45, 0] });
      break;
    case 'obelisk':
      L.push({ geo: cyl(0.9, 1.1, 0.35, 8), color: STONE_D, pos: [0, 0.18, 0] });
      L.push({ geo: cyl(0.35, 0.55, 3.6, 4), color: 0x2e3b40, pos: [0, 2.0, 0], rot: [0, Math.PI / 4, 0] });
      L.push({ geo: cone(0.36, 0.8, 4), color: 0x2e3b40, pos: [0, 4.2, 0], rot: [0, Math.PI / 4, 0] });
      G.push({ geo: box(0.08, 3.0, 0.62), color: CYAN, pos: [0, 2.0, 0], scale: [1, 1, 1] });
      G.push({ geo: box(0.62, 3.0, 0.08), color: CYAN, pos: [0, 2.0, 0] });
      G.push({ geo: octa(0.18), color: 0xbff6ff, pos: [0, 4.9, 0], scale: [1, 1.5, 1] });
      break;
    case 'chain_post':
      L.push({ geo: cyl(0.12, 0.16, 1.8, 6), color: 0x2a2a2c, pos: [0, 0.9, 0] });
      L.push({ geo: torus(0.3, 0.05, 5, 10), color: 0x4a4a4c, pos: [0, 1.5, 0], rot: [Math.PI / 2, 0, 0] });
      L.push({ geo: sph(0.14), color: 0x5a5a5c, pos: [0, 1.85, 0] });
      break;
    case 'pool':
      L.push({ geo: new THREE.CircleGeometry(0.6, 16), color: 0x1a2a2e, pos: [0, 0.03, 0], rot: [-Math.PI / 2, 0, 0] });
      G.push({ geo: new THREE.CircleGeometry(0.4, 16), color: 0x2a5a55, pos: [0, 0.05, 0], rot: [-Math.PI / 2, 0, 0] });
      break;
    case 'campfire':
      for (let i = 0; i < 6; i++) L.push({ geo: cyl(0.06, 0.06, 0.8, 5), color: 0x2c2018, pos: [Math.cos(i * 1.05) * 0.25, 0.15, Math.sin(i * 1.05) * 0.25], rot: [Math.sin(i) * 0.9, i, 0.9] });
      for (let i = 0; i < 6; i++) L.push({ geo: dodeca(0.15), color: STONE, pos: [Math.cos(i * 1.05) * 0.65, 0.1, Math.sin(i * 1.05) * 0.65] });
      G.push({ geo: cone(0.3, 0.8, 7), color: EMBER, pos: [0, 0.6, 0] });
      G.push({ geo: cone(0.17, 0.55, 6), color: 0xffd070, pos: [0, 0.6, 0] });
      break;
    case 'column_lib':
      L.push({ geo: cyl(1.1, 1.3, 0.4, 10), color: shade(STONE, 0.8), pos: [0, 0.2, 0] });
      for (let i = 0; i < 9; i++) L.push({ geo: box(0.7, 0.35, 0.5), color: [0x6a3a3a, 0x3a4a5a, 0x5a5a3a, 0x4a3a5a][i % 4], pos: [Math.cos(i * 0.7) * 0.2, 0.6 + i * 0.5, Math.sin(i * 0.7) * 0.2], rot: [0, i * 0.9, 0] });
      G.push({ geo: cyl(0.1, 0.1, 5.5, 6), color: CYAN, pos: [0, 3, 0] });
      G.push({ geo: sph(0.3), color: 0xbff6ff, pos: [0, 5.9, 0] });
      break;
    case 'dais':
      L.push({ geo: cyl(1.0, 1.1, 0.14, 24), color: shade(STONE, 0.9), pos: [0, 0.07, 0] });
      G.push({ geo: new THREE.RingGeometry(0.72, 0.8, 28), color: CYAN, pos: [0, 0.16, 0], rot: [-Math.PI / 2, 0, 0] });
      break;
    case 'rune':
      G.push({ geo: new THREE.RingGeometry(0.85, 0.95, 36), color: CYAN, pos: [0, 0.05, 0], rot: [-Math.PI / 2, 0, 0] });
      G.push({ geo: new THREE.RingGeometry(0.5, 0.55, 6), color: CYAN, pos: [0, 0.05, 0], rot: [-Math.PI / 2, 0, 0.3] });
      G.push({ geo: new THREE.RingGeometry(0.15, 0.2, 4), color: CYAN, pos: [0, 0.05, 0], rot: [-Math.PI / 2, 0, 0] });
      break;
    case 'urn':
      L.push({ geo: sph(0.4, 9, 7), color: 0x6a5a48, pos: [0, 0.5, 0], scale: [1, 1.15, 1] });
      L.push({ geo: cyl(0.2, 0.28, 0.22, 8), color: 0x5a4a38, pos: [0, 1.0, 0] });
      break;
    default:
      L.push({ geo: ico(0.4), color: STONE });
  }
  const out: PropGeo = { lit: L.length ? merge(L) : new THREE.BufferGeometry() };
  if (G.length) out.glow = merge(G);
  void ASH;
  return out;
}
