// renderer/assets: original procedural hard-surface (Directorate) and organic (Chorus) models built from primitives.
// Local space: +X forward, +Y up, +Z right. Each model is split into four render groups so a whole unit type draws in 4 instanced calls.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type Group = 'body' | 'head' | 'glow' | 'team';
type V3 = [number, number, number];
export interface Part { t: 'b' | 'c' | 'k' | 's' | 'o'; p: V3; s: V3; c: number; g: Group; r?: V3; n?: number }

const b = (p: V3, s: V3, c: number, g: Group = 'body', r?: V3): Part => ({ t: 'b', p, s, c, g, r });
const cy = (p: V3, rad: number, h: number, c: number, g: Group = 'body', r?: V3, n = 10): Part => ({ t: 'c', p, s: [rad, h, rad], c, g, r, n });
const kn = (p: V3, rad: number, h: number, c: number, g: Group = 'body', r?: V3, n = 8): Part => ({ t: 'k', p, s: [rad, h, rad], c, g, r, n });
const sp = (p: V3, s: V3, c: number, g: Group = 'body', r?: V3): Part => ({ t: 's', p, s, c, g, r });
const oc = (p: V3, s: V3, c: number, g: Group = 'glow', r?: V3): Part => ({ t: 'o', p, s, c, g, r });

// palettes
const ST = 0x6a7480, DK = 0x39414b, LT = 0x9ea7b1, AM = 0xffc04d, CR = 0xe6dfcb, RS = 0x8b5a3c;
const BK = 0x4c5c42, MB = 0x7b58ad, VI = 0xb894ff, TL = 0x4fe6c4, LF = 0x78964c, PL = 0x2e3b31, FL = 0xd9a6ff;
const T = 0xffffff;

export const MODELS: Record<string, Part[]> = {
  // ---------- Helix Directorate units ----------
  fabricator: [
    b([0, 0.5, 0], [0.74, 0.3, 0.56], ST), b([-0.08, 0.72, 0], [0.42, 0.2, 0.4], LT),
    b([0.1, 0.24, 0.32], [0.55, 0.2, 0.14], DK), b([0.1, 0.24, -0.32], [0.55, 0.2, 0.14], DK),
    cy([-0.28, 0.78, 0], 0.15, 0.36, DK, 'body', [0, 0, Math.PI / 2]),
    b([-0.34, 0.6, 0], [0.08, 0.08, 0.5], T, 'team'),
    sp([0.28, 0.76, 0.12], [0.06, 0.06, 0.06], AM, 'glow'),
    b([0.5, 0.52, 0], [0.62, 0.1, 0.12], DK, 'head'), b([0.84, 0.52, 0], [0.12, 0.2, 0.2], AM, 'head'),
  ],
  kestrel: [
    b([0, 0.4, 0], [1.0, 0.2, 0.46], ST), b([0.38, 0.5, 0], [0.34, 0.14, 0.34], LT),
    cy([0.28, 0.28, 0.34], 0.28, 0.16, DK, 'body', [Math.PI / 2, 0, 0], 12), cy([0.28, 0.28, -0.34], 0.28, 0.16, DK, 'body', [Math.PI / 2, 0, 0], 12),
    cy([-0.34, 0.28, 0.34], 0.28, 0.16, DK, 'body', [Math.PI / 2, 0, 0], 12), cy([-0.34, 0.28, -0.34], 0.28, 0.16, DK, 'body', [Math.PI / 2, 0, 0], 12),
    b([-0.1, 0.52, 0], [0.5, 0.05, 0.1], T, 'team'),
    cy([-0.3, 0.8, 0], 0.025, 0.6, DK, 'head'), sp([-0.3, 1.12, 0], [0.07, 0.07, 0.07], AM, 'glow'),
    b([0.5, 0.48, 0], [0.24, 0.08, 0.08], DK, 'head'),
  ],
  bulwark: [
    b([0, 0.5, 0.2], [0.26, 0.7, 0.24], DK), b([0, 0.5, -0.2], [0.26, 0.7, 0.24], DK),
    b([0, 0.5 + 0.55, 0], [0.62, 0.52, 0.74], ST), b([0.08, 1.12, 0], [0.44, 0.22, 0.6], LT),
    b([-0.34, 1.0, 0], [0.1, 0.3, 0.6], T, 'team'),
    b([0, 1.05, 0.45], [0.32, 0.3, 0.14], DK), b([0, 1.05, -0.45], [0.32, 0.3, 0.14], DK),
    b([0.58, 1.08, 0.12], [0.9, 0.14, 0.14], DK, 'head'), b([0.18, 1.34, -0.1], [0.28, 0.14, 0.24], LT, 'head'),
    b([0.28, 1.34, -0.1], [0.06, 0.06, 0.2], AM, 'glow'),
  ],
  arc_lancer: [
    b([0, 0.45, 0.28], [0.3, 0.7, 0.26], DK), b([0, 0.45, -0.28], [0.3, 0.7, 0.26], DK),
    b([-0.05, 1.05, 0], [0.7, 0.5, 0.7], ST), b([-0.2, 1.1, 0], [0.4, 0.26, 0.8], RS),
    b([-0.4, 1.0, 0], [0.1, 0.34, 0.64], T, 'team'),
    cy([0.9, 1.15, 0], 0.09, 1.8, DK, 'head', [0, 0, Math.PI / 2]),
    cy([0.5, 1.15, 0], 0.15, 0.12, AM, 'glow', [0, 0, Math.PI / 2]), cy([1.1, 1.15, 0], 0.13, 0.1, AM, 'glow', [0, 0, Math.PI / 2]),
    sp([1.82, 1.15, 0], [0.1, 0.1, 0.1], AM, 'glow'),
  ],
  mender_rig: [
    sp([0, 0.66, 0], [0.62, 0.34, 0.62], LT), sp([0, 0.9, 0], [0.4, 0.22, 0.4], CR),
    b([0.28, 0.3, 0.4], [0.1, 0.5, 0.1], DK, 'body', [0, 0, 0.3]), b([0.28, 0.3, -0.4], [0.1, 0.5, 0.1], DK, 'body', [0, 0, 0.3]), b([-0.38, 0.3, 0], [0.1, 0.5, 0.1], DK, 'body', [0, 0, -0.3]),
    b([0, 0.62, 0], [1.0, 0.06, 0.06], T, 'team'),
    b([0, 1.1, 0], [0.16, 0.34, 0.1], 0xff6a5a, 'glow'), b([0, 1.1, 0], [0.34, 0.12, 0.1], 0xff6a5a, 'glow'),
    cy([0, 1.3, 0], 0.03, 0.4, DK, 'head'), sp([0, 1.54, 0], [0.09, 0.09, 0.09], AM, 'glow'),
  ],
  mortar_crawler: [
    b([0, 0.36, 0.5], [1.5, 0.34, 0.3], DK), b([0, 0.36, -0.5], [1.5, 0.34, 0.3], DK),
    b([0, 0.55, 0], [1.3, 0.3, 0.8], ST), b([-0.3, 0.78, 0], [0.7, 0.2, 0.6], LT),
    b([-0.6, 0.62, 0], [0.12, 0.12, 0.8], T, 'team'),
    cy([0.35, 1.05, 0], 0.17, 1.4, DK, 'head', [0, 0, -0.95]), cy([0.6, 1.3, 0], 0.22, 0.14, AM, 'glow', [0, 0, -0.95]),
    b([-0.45, 0.95, 0], [0.26, 0.2, 0.4], RS, 'head'),
  ],
  aegis_frame: [
    b([0, 0.55, 0.38], [0.44, 0.9, 0.4], DK), b([0, 0.55, -0.38], [0.44, 0.9, 0.4], DK),
    b([-0.05, 1.45, 0], [0.9, 0.7, 1.1], ST), b([-0.2, 1.65, 0], [0.5, 0.3, 1.2], RS),
    b([-0.5, 1.4, 0], [0.12, 0.4, 0.9], T, 'team'),
    b([0.66, 1.35, 0], [0.12, 1.25, 1.5], LT), b([0.74, 1.35, 0], [0.04, 1.1, 1.3], AM, 'glow'),
    b([0.5, 1.9, 0.3], [0.8, 0.18, 0.18], DK, 'head'), b([0.1, 1.9, 0.0], [0.36, 0.22, 0.4], LT, 'head'),
  ],
  // ---------- Verdant Chorus units ----------
  tender: [
    sp([0, 0.46, 0], [0.4, 0.3, 0.34], BK), sp([0.12, 0.72, 0], [0.24, 0.22, 0.22], LF),
    kn([0.28, 0.2, 0.22], 0.05, 0.4, PL, 'body', [0, 0, 1.2]), kn([0.28, 0.2, -0.22], 0.05, 0.4, PL, 'body', [0, 0, 1.2]),
    kn([-0.2, 0.2, 0.22], 0.05, 0.4, PL, 'body', [0, 0, -1.2]), kn([-0.2, 0.2, -0.22], 0.05, 0.4, PL, 'body', [0, 0, -1.2]),
    sp([-0.22, 0.62, 0], [0.12, 0.1, 0.3], T, 'team'),
    sp([0.34, 0.86, 0], [0.07, 0.07, 0.07], TL, 'glow'),
    kn([0.46, 0.55, 0], 0.06, 0.6, LF, 'head', [0, 0, -1.4]),
  ],
  glimmerwing: [
    sp([0, 0.3, 0], [0.34, 0.14, 0.14], BK), sp([0.3, 0.32, 0], [0.12, 0.1, 0.1], LF),
    kn([-0.46, 0.3, 0], 0.07, 0.5, VI, 'body', [0, 0, -Math.PI / 2]),
    b([0.0, 0.52, 0.0], [0.08, 0.06, 0.4], T, 'team'),
    b([-0.05, 0.4, 0.55], [0.5, 0.025, 0.9], VI, 'head', [0.4, 0, 0]), b([-0.05, 0.4, -0.55], [0.5, 0.025, 0.9], VI, 'head', [-0.4, 0, 0]),
    sp([0.42, 0.34, 0], [0.05, 0.05, 0.05], TL, 'glow'),
  ],
  thornling: [
    sp([0, 0.36, 0], [0.5, 0.26, 0.3], BK), sp([0.4, 0.4, 0], [0.2, 0.2, 0.2], LF),
    kn([0.52, 0.5, 0.1], 0.05, 0.3, FL, 'body', [0, 0, -1.2]), kn([0.52, 0.5, -0.1], 0.05, 0.3, FL, 'body', [0, 0, -1.2]),
    kn([-0.05, 0.62, 0], 0.07, 0.3, VI, 'body'), kn([-0.25, 0.58, 0], 0.07, 0.28, VI, 'body'), kn([0.15, 0.6, 0], 0.07, 0.28, VI, 'body'),
    kn([0.3, 0.14, 0.22], 0.04, 0.3, PL, 'body', [0, 0, 0.9]), kn([-0.3, 0.14, 0.22], 0.04, 0.3, PL, 'body', [0, 0, -0.9]),
    kn([0.3, 0.14, -0.22], 0.04, 0.3, PL, 'body', [0, 0, 0.9]), kn([-0.3, 0.14, -0.22], 0.04, 0.3, PL, 'body', [0, 0, -0.9]),
    sp([-0.34, 0.42, 0], [0.1, 0.06, 0.2], T, 'team'),
    sp([0.5, 0.46, 0.08], [0.04, 0.04, 0.04], TL, 'glow'), sp([0.5, 0.46, -0.08], [0.04, 0.04, 0.04], TL, 'glow'),
  ],
  sporecaster: [
    sp([0, 0.7, 0], [0.34, 0.5, 0.3], BK), sp([-0.2, 1.05, 0], [0.3, 0.3, 0.3], MB), sp([-0.2, 1.05, 0], [0.18, 0.18, 0.18], TL, 'glow'),
    kn([0.1, 0.25, 0.2], 0.05, 0.6, PL, 'body', [0, 0, 0.2]), kn([0.1, 0.25, -0.2], 0.05, 0.6, PL, 'body', [0, 0, 0.2]),
    sp([-0.34, 0.65, 0], [0.08, 0.14, 0.32], T, 'team'),
    kn([0.5, 0.92, 0], 0.1, 0.6, LF, 'head', [0, 0, -Math.PI / 2 + 0.2]), sp([0.82, 0.96, 0], [0.07, 0.07, 0.07], TL, 'glow'),
  ],
  carapace_guard: [
    sp([0, 0.62, 0], [0.9, 0.62, 0.8], PL), sp([-0.05, 0.86, 0], [0.8, 0.4, 0.72], BK),
    kn([0.0, 1.28, 0], 0.12, 0.3, VI, 'body'), kn([-0.35, 1.18, 0], 0.1, 0.26, VI, 'body'), kn([0.35, 1.18, 0], 0.1, 0.26, VI, 'body'),
    b([-0.5, 0.78, 0], [0.1, 0.1, 1.0], T, 'team'),
    kn([0.3, 0.2, 0.5], 0.08, 0.5, PL, 'body', [0, 0, 0.4]), kn([0.3, 0.2, -0.5], 0.08, 0.5, PL, 'body', [0, 0, 0.4]), kn([-0.3, 0.2, 0.5], 0.08, 0.5, PL, 'body'), kn([-0.3, 0.2, -0.5], 0.08, 0.5, PL, 'body'),
    sp([0.78, 0.6, 0], [0.22, 0.2, 0.22], LF, 'head'), sp([0.9, 0.62, 0.1], [0.04, 0.04, 0.04], TL, 'glow'),
  ],
  bloom_sage: [
    kn([0, 0.6, 0], 0.46, 1.2, MB, 'body', undefined, 10), sp([0, 1.3, 0], [0.22, 0.22, 0.22], FL),
    b([-0.05, 0.85, 0], [0.9, 0.06, 0.06], T, 'team', [0, 1.57, 0]),
    ...[0, 1, 2, 3, 4].map((i): Part => ({ t: 'k', p: [Math.cos(i * 1.2566) * 0.3, 1.6, Math.sin(i * 1.2566) * 0.3], s: [0.1, 0.4, 0.1], c: VI, g: 'head', r: [Math.sin(i * 1.2566) * 0.5, 0, -Math.cos(i * 1.2566) * 0.5], n: 6 })),
    sp([0, 1.45, 0], [0.12, 0.12, 0.12], TL, 'glow'),
  ],
  rift_stag: [
    sp([0, 0.95, 0], [0.7, 0.4, 0.38], BK),
    kn([0.5, 0.45, 0.2], 0.05, 0.9, PL, 'body', [0, 0, 0.18]), kn([0.5, 0.45, -0.2], 0.05, 0.9, PL, 'body', [0, 0, 0.18]),
    kn([-0.5, 0.45, 0.2], 0.05, 0.9, PL, 'body', [0, 0, -0.18]), kn([-0.5, 0.45, -0.2], 0.05, 0.9, PL, 'body', [0, 0, -0.18]),
    sp([-0.55, 1.05, 0], [0.12, 0.08, 0.34], T, 'team'),
    kn([0.62, 1.3, 0], 0.12, 0.5, BK, 'head', [0, 0, -0.7]), sp([0.82, 1.52, 0], [0.12, 0.12, 0.12], LF, 'head'),
    kn([0.84, 1.9, 0.18], 0.04, 0.7, VI, 'head', [0.5, 0, 0.2]), kn([0.84, 1.9, -0.18], 0.04, 0.7, VI, 'head', [-0.5, 0, 0.2]),
    kn([0.84, 2.2, 0.4], 0.03, 0.4, FL, 'head', [0.9, 0, 0.1]), kn([0.84, 2.2, -0.4], 0.03, 0.4, FL, 'head', [-0.9, 0, 0.1]),
    sp([0.4, 1.0, 0], [0.12, 0.1, 0.1], TL, 'glow'),
  ],
  crownbeast: [
    sp([0, 1.2, 0], [1.1, 0.8, 0.9], BK), sp([0.3, 1.55, 0], [0.5, 0.45, 0.5], LF),
    kn([0.5, 0.55, 0.45], 0.16, 1.1, PL, 'body'), kn([0.5, 0.55, -0.45], 0.16, 1.1, PL, 'body'), kn([-0.5, 0.55, 0.45], 0.16, 1.1, PL, 'body'), kn([-0.5, 0.55, -0.45], 0.16, 1.1, PL, 'body'),
    sp([-0.8, 1.45, 0], [0.14, 0.2, 0.7], T, 'team'),
    ...[0, 1, 2, 3, 4, 5, 6].map((i): Part => ({ t: 'k', p: [0.45 + Math.cos(i * 0.9) * 0.28, 2.05, Math.sin(i * 0.9) * 0.4], s: [0.08, 0.5, 0.08], c: FL, g: 'head', r: [Math.sin(i * 0.9) * 0.4, 0, -Math.cos(i * 0.9) * 0.2], n: 6 })),
    sp([0.1, 1.3, 0], [0.26, 0.26, 0.26], VI, 'glow'), sp([0.62, 1.6, 0.18], [0.07, 0.07, 0.07], TL, 'glow'),
  ],
  // ---------- Helix structures ----------
  core_relay: [
    b([0, 0.2, 0], [4.7, 0.4, 4.7], DK), b([0, 0.7, 0], [3.4, 0.6, 3.4], ST), b([0, 1.35, 0], [2.4, 0.8, 2.4], LT),
    cy([0, 2.3, 0], 0.7, 1.4, ST, 'body', undefined, 12), cy([0, 3.2, 0], 0.4, 0.6, DK),
    b([1.9, 0.9, 1.9], [0.9, 1.4, 0.9], RS), b([-1.9, 0.9, 1.9], [0.9, 1.4, 0.9], RS), b([1.9, 0.9, -1.9], [0.9, 1.4, 0.9], RS), b([-1.9, 0.9, -1.9], [0.9, 1.4, 0.9], RS),
    b([0, 0.43, 2.2], [4.7, 0.1, 0.16], T, 'team'), b([0, 0.43, -2.2], [4.7, 0.1, 0.16], T, 'team'), b([2.2, 0.43, 0], [0.16, 0.1, 4.7], T, 'team'), b([-2.2, 0.43, 0], [0.16, 0.1, 4.7], T, 'team'),
    sp([0, 3.75, 0], [0.4, 0.4, 0.4], AM, 'glow'), cy([0, 1.8, 0], 0.9, 0.12, AM, 'glow'),
    cy([0, 3.9, 0], 0.04, 1.0, DK, 'head'),
  ],
  grid_pylon: [
    b([0, 0.15, 0], [1.8, 0.3, 1.8], DK), b([0, 1.0, 0], [0.9, 1.4, 0.9], ST), b([0, 1.9, 0], [0.55, 0.5, 0.55], LT),
    b([0, 0.34, 0.92], [1.8, 0.08, 0.1], T, 'team'), b([0, 0.34, -0.92], [1.8, 0.08, 0.1], T, 'team'),
    oc([0, 2.5, 0], [0.34, 0.6, 0.34], AM), b([0.46, 1.0, 0], [0.04, 1.2, 0.18], AM, 'glow'), b([-0.46, 1.0, 0], [0.04, 1.2, 0.18], AM, 'glow'),
  ],
  assembly_bay: [
    b([0, 0.2, 0], [2.9, 0.4, 2.9], DK), b([-0.2, 0.95, 0], [2.4, 1.1, 2.6], ST), b([0.1, 1.65, 0], [2.0, 0.3, 2.4], LT),
    b([1.1, 0.8, 0], [0.12, 0.9, 1.5], AM, 'glow'), b([-0.3, 1.95, 0.6], [1.2, 0.2, 0.3], RS), b([-0.3, 1.95, -0.6], [1.2, 0.2, 0.3], RS),
    b([0, 0.43, 1.45], [2.9, 0.08, 0.12], T, 'team'), b([0, 0.43, -1.45], [2.9, 0.08, 0.12], T, 'team'), b([1.45, 0.43, 0], [0.12, 0.08, 2.9], T, 'team'),
    cy([-0.9, 2.3, 0.9], 0.12, 0.8, DK, 'head'), b([-0.2, 2.65, 0.9], [1.5, 0.1, 0.1], DK, 'head'),
  ],
  signal_foundry: [
    b([0, 0.2, 0], [2.9, 0.4, 2.9], DK), b([0, 0.9, 0], [2.1, 1.0, 2.1], ST), b([0, 1.55, 0], [1.4, 0.4, 1.4], LT),
    b([0, 0.43, 1.45], [2.9, 0.08, 0.12], T, 'team'), b([0, 0.43, -1.45], [2.9, 0.08, 0.12], T, 'team'), b([1.45, 0.43, 0], [0.12, 0.08, 2.9], T, 'team'),
    cy([0, 2.0, 0], 0.12, 1.0, DK), kn([0, 2.9, 0], 0.9, 0.5, CR, 'head', [Math.PI, 0, 0], 14), sp([0, 2.95, 0], [0.14, 0.14, 0.14], AM, 'glow'),
    b([0.9, 1.0, 0.9], [0.3, 1.4, 0.3], RS), b([-0.9, 1.0, -0.9], [0.3, 1.4, 0.3], RS),
  ],
  flux_tap: [
    cy([0, 0.15, 0], 1.45, 0.3, DK, 'body', undefined, 12), cy([0, 0.9, 0], 0.7, 1.3, ST, 'body', undefined, 12), cy([0, 1.65, 0], 0.5, 0.25, LT),
    b([1.25, 0.34, 0], [0.12, 0.08, 2.4], T, 'team'), b([-1.25, 0.34, 0], [0.12, 0.08, 2.4], T, 'team'),
    cy([0, 1.1, 0], 0.76, 0.18, AM, 'glow', undefined, 12), oc([0, 2.1, 0], [0.3, 0.6, 0.3], 0x7ff3ff),
    b([0.9, 0.7, 0.9], [0.14, 1.2, 0.14], DK, 'body', [0.25, 0, -0.25]), b([-0.9, 0.7, -0.9], [0.14, 1.2, 0.14], DK, 'body', [-0.25, 0, 0.25]),
  ],
  sentry_arc: [
    b([0, 0.15, 0], [1.8, 0.3, 1.8], DK), cy([0, 0.6, 0], 0.5, 0.6, ST, 'body', undefined, 8),
    b([0, 0.34, 0.92], [1.8, 0.08, 0.1], T, 'team'), b([0, 0.34, -0.92], [1.8, 0.08, 0.1], T, 'team'),
    b([0.1, 1.1, 0], [0.8, 0.4, 0.8], LT, 'head'), b([0.7, 1.1, 0.2], [0.8, 0.1, 0.1], DK, 'head'), b([0.7, 1.1, -0.2], [0.8, 0.1, 0.1], DK, 'head'), b([0.5, 1.28, 0], [0.2, 0.1, 0.3], AM, 'glow'),
  ],
  // ---------- Verdant structures ----------
  heartgrove: [
    sp([0, 0.5, 0], [2.4, 0.9, 2.4], PL), sp([0, 1.2, 0], [1.7, 1.1, 1.7], BK),
    ...[0, 1, 2, 3, 4, 5].map((i): Part => ({ t: 'k', p: [Math.cos(i * 1.047) * 1.6, 1.4, Math.sin(i * 1.047) * 1.6], s: [0.5, 2.2, 0.5], c: i % 2 ? MB : LF, g: 'body', r: [Math.sin(i * 1.047) * 0.4, 0, -Math.cos(i * 1.047) * 0.4], n: 7 })),
    cy([0, 0.3, 2.3], 0.01, 0.01, T, 'team'),
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((i): Part => ({ t: 's', p: [Math.cos(i * 0.785) * 2.3, 0.18, Math.sin(i * 0.785) * 2.3], s: [0.34, 0.12, 0.34], c: T, g: 'team' })),
    sp([0, 2.1, 0], [0.7, 0.7, 0.7], VI, 'glow'), sp([0, 2.1, 0], [0.4, 0.4, 0.4], TL, 'glow'),
    kn([0, 3.3, 0], 0.15, 1.2, FL, 'head', undefined, 6),
  ],
  root_node: [
    sp([0, 0.3, 0], [1.0, 0.4, 1.0], PL), kn([0, 1.1, 0], 0.4, 1.8, BK, 'body', undefined, 8), kn([0.5, 0.6, 0.2], 0.14, 1.0, LF, 'body', [0, 0, -0.6]), kn([-0.4, 0.6, -0.3], 0.14, 1.0, LF, 'body', [0, 0, 0.6]),
    ...[0, 1, 2, 3].map((i): Part => ({ t: 's', p: [Math.cos(i * 1.57) * 0.95, 0.14, Math.sin(i * 1.57) * 0.95], s: [0.22, 0.1, 0.22], c: T, g: 'team' })),
    sp([0, 2.1, 0], [0.34, 0.34, 0.34], VI, 'glow'),
  ],
  brood_hollow: [
    sp([0, 0.4, 0], [1.8, 0.6, 1.8], PL), sp([0, 1.0, 0], [1.4, 1.1, 1.4], BK), sp([0, 1.7, 0], [0.9, 0.5, 0.9], LF),
    sp([0.95, 0.75, 0], [0.5, 0.7, 0.62], 0x151a16), sp([1.0, 0.75, 0], [0.34, 0.5, 0.42], VI, 'glow'),
    ...[0, 1, 2, 3, 4, 5].map((i): Part => ({ t: 's', p: [Math.cos(i * 1.047) * 1.55, 0.14, Math.sin(i * 1.047) * 1.55], s: [0.3, 0.1, 0.3], c: T, g: 'team' })),
    kn([-0.5, 2.0, 0.4], 0.1, 0.8, FL, 'head', [0.3, 0, 0.2], 6), kn([-0.2, 2.1, -0.5], 0.1, 0.7, FL, 'head', [-0.3, 0, -0.2], 6),
  ],
  memory_bloom: [
    sp([0, 0.3, 0], [1.6, 0.4, 1.6], PL), cy([0, 1.2, 0], 0.3, 2.0, BK, 'body', undefined, 8),
    ...[0, 1, 2, 3, 4, 5, 6].map((i): Part => ({ t: 'k', p: [Math.cos(i * 0.8976) * 0.8, 2.25, Math.sin(i * 0.8976) * 0.8], s: [0.45, 1.5, 0.12], c: i % 2 ? MB : FL, g: 'head', r: [Math.sin(i * 0.8976) * 0.9, 0, -Math.cos(i * 0.8976) * 0.9], n: 4 })),
    ...[0, 1, 2, 3, 4, 5].map((i): Part => ({ t: 's', p: [Math.cos(i * 1.047) * 1.5, 0.14, Math.sin(i * 1.047) * 1.5], s: [0.28, 0.1, 0.28], c: T, g: 'team' })),
    sp([0, 2.4, 0], [0.4, 0.4, 0.4], TL, 'glow'),
  ],
  flux_tap_v: [
    sp([0, 0.25, 0], [1.5, 0.4, 1.5], PL), ...[0, 1, 2, 3, 4].map((i): Part => ({ t: 'k', p: [Math.cos(i * 1.2566) * 0.7, 0.9, Math.sin(i * 1.2566) * 0.7], s: [0.2, 1.8, 0.2], c: i % 2 ? BK : LF, g: 'body', r: [Math.sin(i * 1.2566) * 0.25, 0, -Math.cos(i * 1.2566) * 0.25], n: 6 })),
    ...[0, 1, 2, 3].map((i): Part => ({ t: 's', p: [Math.cos(i * 1.57) * 1.4, 0.12, Math.sin(i * 1.57) * 1.4], s: [0.26, 0.1, 0.26], c: T, g: 'team' })),
    sp([0, 1.1, 0], [0.5, 0.5, 0.5], 0x7ff3ff, 'glow'), oc([0, 2.0, 0], [0.25, 0.5, 0.25], VI),
  ],
  needle_pod: [
    sp([0, 0.3, 0], [0.95, 0.4, 0.95], PL), sp([0, 0.95, 0], [0.7, 0.8, 0.7], BK),
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((i): Part => ({ t: 'k', p: [Math.cos(i * 0.785) * 0.55, 1.45, Math.sin(i * 0.785) * 0.55], s: [0.07, 0.8, 0.07], c: FL, g: 'head', r: [Math.sin(i * 0.785) * 0.5, 0, -Math.cos(i * 0.785) * 0.5], n: 5 })),
    ...[0, 1, 2, 3].map((i): Part => ({ t: 's', p: [Math.cos(i * 1.57) * 0.95, 0.1, Math.sin(i * 1.57) * 0.95], s: [0.2, 0.08, 0.2], c: T, g: 'team' })),
    sp([0, 1.3, 0], [0.2, 0.2, 0.2], TL, 'glow'),
  ],
  // ---------- neutrals ----------
  ore_seam: [
    sp([0, 0.1, 0], [1.1, 0.2, 1.1], 0x2a3238),
    oc([0.0, 0.6, 0.0], [0.38, 1.1, 0.38], 0x44e9d0), oc([0.5, 0.4, 0.3], [0.26, 0.7, 0.26], 0x69f4e0), oc([-0.45, 0.35, -0.2], [0.24, 0.62, 0.24], 0x2fbfae), oc([0.1, 0.3, -0.5], [0.2, 0.5, 0.2], 0x7df7e8),
  ],
  flux_vent: [
    cy([0, 0.08, 0], 1.45, 0.16, 0x1b2026, 'body', undefined, 14), cy([0, 0.14, 0], 1.0, 0.1, 0x273039, 'body', undefined, 14), cy([0, 0.2, 0], 0.6, 0.06, 0xff8be0, 'glow', undefined, 14),
    kn([0, 0.5, 0], 0.18, 0.7, 0xffb0ec, 'glow', undefined, 6),
  ],
  watch_pylon: [
    cy([0, 0.14, 0], 1.0, 0.28, DK, 'body', undefined, 10), b([0, 1.2, 0], [0.5, 2.2, 0.5], ST), oc([0, 2.7, 0], [0.4, 0.7, 0.4], 0x8fe9ff),
    cy([0, 0.4, 0], 1.05, 0.08, T, 'team', undefined, 14), cy([0, 1.6, 0], 0.65, 0.05, T, 'team', undefined, 14),
  ],
  salvage_pod: [
    sp([0, 0.35, 0], [0.5, 0.35, 0.36], 0x7d7466), b([0, 0.4, 0], [0.5, 0.06, 0.38], AM, 'glow'), oc([0, 0.9, 0], [0.14, 0.28, 0.14], AM),
  ],
  crystal_barrier: [
    sp([0, 0.2, 0], [1.6, 0.4, 1.6], 0x2a3138),
    oc([0, 1.1, 0], [0.7, 2.2, 0.7], 0x9d7cff), oc([0.7, 0.8, 0.4], [0.5, 1.6, 0.5], 0x7cdcff), oc([-0.7, 0.7, -0.3], [0.5, 1.4, 0.5], 0xc690ff), oc([0.1, 0.6, -0.8], [0.4, 1.2, 0.4], 0x69f4e0), oc([-0.5, 0.5, 0.7], [0.36, 1.0, 0.36], 0x9d7cff),
  ],
};

function partGeometry(p: Part): THREE.BufferGeometry {
  let g: THREE.BufferGeometry;
  switch (p.t) {
    case 'b': g = new THREE.BoxGeometry(p.s[0], p.s[1], p.s[2]); break;
    case 'c': g = new THREE.CylinderGeometry(p.s[0], p.s[0], p.s[1], p.n ?? 10); break;
    case 'k': g = new THREE.ConeGeometry(p.s[0], p.s[1], p.n ?? 8); break;
    case 's': g = new THREE.SphereGeometry(1, 12, 8); g.scale(p.s[0], p.s[1], p.s[2]); break;
    case 'o': g = new THREE.OctahedronGeometry(1, 0); g.scale(p.s[0], p.s[1], p.s[2]); break;
  }
  if (p.r) {
    const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(p.r[0], p.r[1], p.r[2]));
    g.applyMatrix4(m);
  }
  g.translate(p.p[0], p.p[1], p.p[2]);
  g = g.index ? g.toNonIndexed() : g;
  g.deleteAttribute('uv');
  const n = g.attributes.position.count;
  const col = new THREE.Color(p.c);
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b; }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return g;
}

export interface BuiltModel { body: THREE.BufferGeometry | null; head: THREE.BufferGeometry | null; glow: THREE.BufferGeometry | null; team: THREE.BufferGeometry | null; height: number }
const cache = new Map<string, BuiltModel>();
export function buildModel(key: string): BuiltModel {
  const hit = cache.get(key);
  if (hit) return hit;
  const parts = MODELS[key];
  if (!parts) throw new Error('no model ' + key);
  const by: Record<Group, THREE.BufferGeometry[]> = { body: [], head: [], glow: [], team: [] };
  let height = 0;
  for (const p of parts) { by[p.g].push(partGeometry(p)); height = Math.max(height, p.p[1] + p.s[1] * 0.5); }
  const m = (l: THREE.BufferGeometry[]) => (l.length ? mergeGeometries(l, false) : null);
  const built = { body: m(by.body), head: m(by.head), glow: m(by.glow), team: m(by.team), height };
  cache.set(key, built);
  return built;
}

/** one merged geometry (all groups) for placement ghosts / UI portraits */
export function buildMerged(key: string): THREE.BufferGeometry {
  const parts = MODELS[key];
  return mergeGeometries(parts.map(partGeometry), false);
}
