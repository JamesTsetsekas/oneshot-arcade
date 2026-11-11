import * as THREE from 'three';
import type { Landmark } from '../sim/world';
import { Geo } from './geo';

const CREAM = 0xf6efe0;
const WHITE = 0xfafafa;

/** 12 oversized destination silhouettes. `solid` receives lit geometry, `glow` receives emissive trim. */
export function buildLandmark(solid: Geo, glow: Geo, lm: Landmark): void {
  const cx = lm.x, cz = lm.z;
  const w = lm.rect.maxX - lm.rect.minX, d = lm.rect.maxZ - lm.rect.minZ;
  const s = Math.min(w, d);
  const h = lm.h;
  const A = lm.accent, C = lm.color;
  switch (lm.type) {
    case 0: { // lighthouse
      solid.box(cx, 0, cz, s * 0.7, 2, s * 0.7, 0x8a8f99);
      const bands = 5;
      for (let i = 0; i < bands; i++) {
        const y0 = 2 + (i * (h - 6)) / bands, hh = (h - 6) / bands;
        solid.cyl(cx, y0, cz, 3.2 - (i + 1) * 0.35, 3.2 - i * 0.35, hh, i % 2 ? 0xe63946 : WHITE, 14);
      }
      solid.cyl(cx, h - 4, cz, 3.4, 2.6, 1.2, 0x333844, 14);
      glow.cyl(cx, h - 2.8, cz, 2.0, 2.0, 3, 0xfff2a8, 12);
      solid.cyl(cx, h + 0.2, cz, 0.2, 3.1, 2.4, A, 14);
      break;
    }
    case 1: { // dome museum
      solid.box(cx, 0, cz, w * 0.92, 4, d * 0.92, CREAM);
      for (let i = 0; i < 9; i++) solid.cyl(cx - w * 0.38 + i * (w * 0.76) / 8, 4, cz + d * 0.4, 0.7, 0.7, 9, WHITE, 8);
      solid.box(cx, 13, cz + d * 0.4, w * 0.84, 1.2, 3, CREAM);
      solid.cyl(cx, 4, cz - 2, s * 0.26, s * 0.3, 10, 0xeadfcc, 16);
      solid.sphere(cx, 14, cz - 2, s * 0.3, A, 1, 0.85, 1, 14);
      solid.cyl(cx, 14 + s * 0.25, cz - 2, 0.15, 0.5, 6, 0xffd34d, 6);
      break;
    }
    case 2: { // clock tower
      solid.box(cx, 0, cz, s * 0.34, h, s * 0.34, C);
      solid.box(cx, h * 0.62, cz, s * 0.42, 3, s * 0.42, CREAM);
      const r = new THREE.ConeGeometry(s * 0.3, 11, 4);
      const m = new THREE.Matrix4().compose(new THREE.Vector3(cx, h + 5.5, cz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 4, 0)), new THREE.Vector3(1, 1, 1));
      solid.add(r, m, A);
      r.dispose();
      const f = s * 0.17 + 0.2;
      for (const [dx, dz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) glow.cyl(cx + dx * f, h - 8.5, cz + dz * f, 0.1, 0.1, 0.1, 0xffffff, 3);
      glow.box(cx, h - 8, cz + f, 3.6, 3.6, 0.3, 0xfff6d0);
      glow.box(cx, h - 8, cz - f, 3.6, 3.6, 0.3, 0xfff6d0);
      glow.box(cx + f, h - 8, cz, 0.3, 3.6, 3.6, 0xfff6d0);
      glow.box(cx - f, h - 8, cz, 0.3, 3.6, 3.6, 0xfff6d0);
      break;
    }
    case 3: { // ferris wheel
      const R = Math.min(s * 0.42, 16);
      const hub = R + 4;
      solid.rbox(cx - 5, hub / 2, cz, 1.2, hub + 1, 1.2, 0x8a8f99, 0, 0.18);
      solid.rbox(cx + 5, hub / 2, cz, 1.2, hub + 1, 1.2, 0x8a8f99, 0, -0.18);
      solid.box(cx, 0, cz, 16, 1.2, 8, 0x6b7280);
      solid.torus(cx, hub, cz, R, 0.45, WHITE, 0, 0);
      solid.torus(cx, hub, cz + 1.4, R, 0.3, A, 0, 0);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI;
        solid.rbox(cx, hub, cz, R * 2, 0.22, 0.22, 0xdfe3ea, 0, 0);
        void a;
      }
      for (let i = 0; i < 4; i++) solid.rbox(cx, hub, cz, 0.2, R * 2, 0.2, 0xdfe3ea, 0, 0);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const col = [0xff5e57, 0x19b3a6, 0xffd34d, 0xa855f7][i % 4];
        solid.box(cx + Math.cos(a) * R, hub + Math.sin(a) * R - 1, cz + 0.8, 2, 1.8, 2, col);
      }
      glow.cyl(cx, hub, cz, 1, 1, 1.5, 0xfff2a8, 8);
      break;
    }
    case 4: { // stadium
      solid.cyl(cx, 0, cz, s * 0.47, s * 0.43, 13, 0xefe6d2, 28);
      solid.cyl(cx, 9, cz, s * 0.49, s * 0.49, 3.2, A, 28);
      solid.cyl(cx, 12.9, cz, s * 0.4, s * 0.4, 0.3, 0x2f9e5b, 28);
      for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        solid.box(cx + dx * s * 0.46, 0, cz + dz * s * 0.46, 1, 30, 1, 0xb0b7c3);
        glow.box(cx + dx * s * 0.46, 29, cz + dz * s * 0.46, 4, 1.6, 4, 0xfff6d0);
      }
      break;
    }
    case 5: { // crown ziggurat
      const tiers = 5;
      for (let i = 0; i < tiers; i++) {
        const sc = 1 - i * 0.17;
        solid.box(cx, (i * h) / tiers, cz, w * 0.9 * sc, h / tiers, d * 0.9 * sc, i % 2 ? CREAM : C, { windows: true });
      }
      solid.cyl(cx, h, cz, 0.2, 2.2, 9, 0xffc93c, 8);
      glow.sphere(cx, h + 9.5, cz, 1.2, 0xfff2a8);
      glow.box(cx, h * 0.2, cz + d * 0.455, w * 0.5, 1, 0.3, A);
      break;
    }
    case 6: { // sail tower
      solid.box(cx - s * 0.12, 0, cz, s * 0.22, h * 0.9, s * 0.22, 0x8fb8c8, { windows: true });
      solid.rbox(cx + s * 0.05, h * 0.55, cz, 1.4, h * 1.05, s * 0.6, A, 0, 0.0);
      solid.rbox(cx + s * 0.24, h * 0.4, cz, 1.0, h * 0.7, s * 0.4, CREAM, 0, 0.0);
      solid.box(cx, 0, cz, s * 0.7, 3, s * 0.5, 0xd8cdb8);
      glow.box(cx - s * 0.12, h * 0.9, cz, 1, 1, 1, 0xff5e57);
      break;
    }
    case 7: { // arch gate
      solid.box(cx, 0, cz - 6, s * 0.2, h * 0.7, 8, C);
      solid.box(cx, 0, cz + 6, s * 0.2, h * 0.7, 8, C);
      solid.box(cx, h * 0.62, cz, s * 0.26, 8, d * 0.5, A);
      solid.torus(cx, h * 0.6, cz, 8, 1.4, WHITE, 0, Math.PI / 2, Math.PI, 20);
      glow.box(cx, h * 0.62 + 4, cz + d * 0.25, s * 0.26, 1, 0.3, 0xfff2a8);
      break;
    }
    case 8: { // cranes
      solid.box(cx, 0, cz + d * 0.22, w * 0.9, 9, d * 0.45, C, { windows: false });
      for (const dx of [-1, 1]) {
        solid.box(cx + dx * w * 0.3, 0, cz - d * 0.2, 1.8, h * 0.9, 1.8, A);
        solid.box(cx + dx * w * 0.3, 0, cz - d * 0.2 - 8, 1.8, h * 0.9, 1.8, A);
      }
      solid.box(cx, h * 0.9, cz - d * 0.2 - 4, w * 0.8, 1.8, 12, A);
      solid.box(cx + w * 0.1, h * 0.9 - 8, cz - d * 0.2 - 4, 6.1, 2.6, 2.5, 0xe2574c);
      glow.box(cx + w * 0.3, h * 0.9 + 1, cz - d * 0.2, 1, 1, 1, 0xff3d3d);
      break;
    }
    case 9: { // pagoda
      const tiers = 5;
      for (let i = 0; i < tiers; i++) {
        const sc = 1 - i * 0.16;
        const y = (i * h) / (tiers + 0.5);
        solid.box(cx, y, cz, s * 0.7 * sc, h / (tiers + 1.2), s * 0.7 * sc, i % 2 ? CREAM : C);
        solid.box(cx, y + h / (tiers + 1.2), cz, s * 0.95 * sc, 0.9, s * 0.95 * sc, A);
      }
      solid.cyl(cx, h * 0.92, cz, 0.1, 0.4, 7, 0xffd34d, 6);
      break;
    }
    case 10: { // observatory
      solid.box(cx, 0, cz, s * 0.7, 6, s * 0.7, CREAM);
      solid.cyl(cx, 6, cz, s * 0.26, s * 0.3, h * 0.45, C, 16);
      solid.sphere(cx, 6 + h * 0.45, cz, s * 0.27, WHITE, 1, 0.9, 1, 14);
      solid.rbox(cx, 6 + h * 0.45 + s * 0.2, cz + s * 0.12, 2, 12, 3.5, A, 0, 0.9);
      glow.sphere(cx, 6 + h * 0.45 + s * 0.45, cz, 0.9, 0xfff2a8);
      break;
    }
    default: { // spiral garage
      const decks = 6;
      for (let i = 0; i < decks; i++) {
        solid.cyl(cx, i * 5.2, cz, s * 0.38 - i * 0.4, s * 0.38 - i * 0.4, 1.0, i % 2 ? CREAM : C, 24);
        solid.cyl(cx, i * 5.2 + 1, cz, s * 0.36 - i * 0.4, s * 0.36 - i * 0.4, 4, 0x9da7b3, 24);
        glow.torus(cx, i * 5.2 + 2.8, cz, s * 0.37 - i * 0.4, 0.18, A, Math.PI / 2, 0, Math.PI * 2, 28);
      }
      solid.cyl(cx, decks * 5.2, cz, 0.3, 1.8, 7, 0xffd34d, 8);
      break;
    }
  }
}
