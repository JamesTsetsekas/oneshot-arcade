// Procedural vehicle meshes from the tuning sheet. Each type yields a paint mesh (tinted per
// instance) and a trim mesh (glass, lamps, bumpers; untinted). Original proportions, no real designs.
import { Geo } from './geo';
import { VehicleSpec } from '../vehicles/specs';

const GLASS = 0x1c2630, DARK = 0x1a1c20, CHROME = 0xb9c0c6, LAMP = 0xfff3d0, TAIL = 0x8a1616, PLATE = 0xe8e6da;

function frustum(g: Geo, y0: number, y1: number, zb0: number, zb1: number, zt0: number, zt1: number, hwB: number, hwT: number, color: number, roofColor: number | null) {
  // bottom rectangle (zb0..zb1, +-hwB) at y0, top rectangle (zt0..zt1, +-hwT) at y1
  const c = [((color >> 16) & 255) / 255, ((color >> 8) & 255) / 255, (color & 255) / 255];
  const q = (a: number[], b: number[], cc: number[], d: number[], n: number[], k = 1) => g.quad(a[0], a[1], a[2], b[0], b[1], b[2], cc[0], cc[1], cc[2], d[0], d[1], d[2], n[0], n[1], n[2], c[0] * k, c[1] * k, c[2] * k);
  const A = [-hwB, y0, zb0], B = [hwB, y0, zb0], C = [hwB, y0, zb1], D = [-hwB, y0, zb1];
  const E = [-hwT, y1, zt0], F2 = [hwT, y1, zt0], G2 = [hwT, y1, zt1], H = [-hwT, y1, zt1];
  const h = y1 - y0;
  q(D, C, G2, H, [0, zb1 - zt1, h], 1.25);      // front glass (lighter so the windscreen reads)
  q(B, A, E, F2, [0, zb0 - zt0, -h], 1.0);      // rear glass
  q(C, B, F2, G2, [h, hwB - hwT, 0], 0.9); q(A, D, H, E, [-h, hwB - hwT, 0], 0.9);
  if (roofColor === null) q(E, F2, G2, H, [0, 1, 0]);
}

export function buildVehicleGeo(spec: VehicleSpec): { paint: Geo; trim: Geo } {
  const paint = new Geo(), trim = new Geo();
  const L = spec.length, W = spec.width, H = spec.height, c = spec.clearance, hw = W / 2, hl = L / 2;
  const WHITE = 0xffffff;
  if (spec.moto) {
    const r = spec.wheelRadius, wb = spec.wheelbase / 2;
    paint.box(0, r + 0.42, 0.12, 0.13, 0.13, 0.3, 0, WHITE);                 // tank
    paint.box(0, r + 0.3, wb - 0.05, 0.1, 0.1, 0.16, 0, WHITE);              // front fairing
    paint.box(0, r + 0.36, -wb + 0.2, 0.09, 0.06, 0.24, 0, WHITE);           // tail
    trim.box(0, r + 0.5, -0.28, 0.14, 0.05, 0.3, 0, DARK);                    // seat
    trim.box(0, r + 0.12, 0, 0.14, 0.2, 0.34, 0, 0x4a4f55);                   // engine
    trim.box(0, r + 0.38, wb, 0.03, 0.42, 0.04, 0, CHROME);                   // fork
    trim.box(0, r + 0.82, wb - 0.14, 0.3, 0.025, 0.03, 0, DARK);              // bars
    trim.box(0, r + 0.2, -wb + 0.1, 0.03, 0.03, 0.4, 0, CHROME);              // swingarm
    trim.box(0.12, r + 0.1, -0.5, 0.04, 0.04, 0.35, 0, CHROME);               // exhaust
    if (spec.id === 'swift') { paint.box(0, r + 0.62, -wb + 0.06, 0.2, 0.17, 0.2, 0, WHITE); trim.box(0, r + 0.8, -wb + 0.06, 0.21, 0.02, 0.21, 0, DARK); } // courier top box
    return { paint, trim };
  }
  const b = spec.body, belt = b.beltH, bodyH = belt - c;
  if (spec.cls === 'van') {
    // one tall box in paint, glazing only around the cab
    paint.box(0, c + (H - c) / 2, -0.25, hw, (H - c) / 2, hl - 0.25, 0, WHITE);
    paint.box(0, c + 0.55, hl - 0.3, hw - 0.03, 0.55, 0.3, 0, WHITE);
    trim.box(0, H - 0.6, hl - 0.52, hw - 0.12, 0.34, 0.03, 0, GLASS);                     // windscreen
    for (const s of [-1, 1]) trim.box(s * (hw + 0.005), H - 0.62, hl - 1.25, 0.012, 0.3, 0.5, 0, GLASS);
    trim.box(0, c + 0.75, 0, hw + 0.012, 0.09, hl - 0.6, 0, 0xf2b134);                    // courier stripe
    trim.box(0, c + 0.95, -hl + 0.02, hw - 0.3, 0.6, 0.02, 0, 0x3a3f46);                  // rear doors seam
  } else {
    // lower hull with a slightly dropped nose and tail
    paint.box(0, c + bodyH / 2, 0, hw, bodyH / 2, hl - 0.18, 0, WHITE);
    paint.box(0, c + bodyH * 0.42, hl - 0.2, hw - 0.06, bodyH * 0.42, 0.2, 0, WHITE);
    paint.box(0, c + bodyH * (0.46 - b.rearDrop), -hl + 0.2, hw - 0.05, bodyH * 0.44, 0.2, 0, WHITE);
    // cabin greenhouse
    const zF = hl - L * b.hood, zR = zF - L * b.cabin;
    const rakeF = Math.min(0.75, b.cabinH * 1.1), rakeR = spec.cls === 'hatch' ? 0.25 : Math.min(0.7, b.cabinH * 0.9);
    frustum(trim, belt, belt + b.cabinH, zR, zF, zR + rakeR, zF - rakeF, hw - 0.05, hw - b.taper - 0.05, GLASS, 0);
    paint.box(0, belt + b.cabinH + 0.02, (zR + rakeR + zF - rakeF) / 2, hw - b.taper - 0.02, 0.035, (zF - rakeF - zR - rakeR) / 2 + 0.04, 0, WHITE);
    // pillars
    for (const s of [-1, 1]) {
      const zm = (zR + zF) / 2;
      paint.box(s * (hw - b.taper * 0.5 - 0.05), belt + b.cabinH / 2, zm, 0.035, b.cabinH / 2, 0.05, 0, WHITE);
    }
    if (spec.cls === 'muscle') { paint.box(0, belt + 0.03, hl - L * b.hood * 0.5, 0.28, 0.035, L * b.hood * 0.32, 0, WHITE); trim.box(0, belt + 0.13, -hl + 0.16, hw - 0.1, 0.02, 0.1, 0, DARK); }
    if (spec.cls === 'police') {
      for (const s of [-1, 1]) trim.box(s * (hw + 0.006), c + bodyH * 0.55, -0.15, 0.01, bodyH * 0.3, L * 0.26, 0, 0x1f3a7a);
      trim.box(0, belt + b.cabinH + 0.09, -0.1, 0.5, 0.04, 0.14, 0, DARK);
      trim.box(0, c + bodyH * 0.5, hl + 0.06, hw - 0.15, 0.16, 0.05, 0, DARK); // push bar
    }
  }
  // shared trim: bumpers, arches, lamps, plates, sills
  trim.box(0, c + 0.12, hl - 0.02, hw - 0.02, 0.1, 0.06, 0, DARK); trim.box(0, c + 0.12, -hl + 0.02, hw - 0.02, 0.1, 0.06, 0, DARK);
  trim.box(0, c + 0.03, 0, hw - 0.08, 0.05, hl - 0.3, 0, DARK);
  const ly = spec.cls === 'van' ? c + 0.62 : c + bodyH * 0.62;
  for (const s of [-1, 1]) {
    trim.box(s * (hw - 0.24), ly, hl + 0.005, 0.17, 0.07, 0.02, 0, LAMP);
    trim.box(s * (hw - 0.22), ly + 0.02, -hl - 0.005, 0.18, 0.06, 0.02, 0, TAIL);
    for (const z of [spec.wheelbase / 2, -spec.wheelbase / 2]) trim.box(s * (hw - 0.02), spec.wheelRadius * 1.05, z, 0.04, spec.wheelRadius * 0.95, spec.wheelRadius * 1.15, 0, DARK);
    trim.box(s * (hw + 0.07), belt + 0.04, hl - L * (spec.cls === 'van' ? 0.14 : b.hood) - 0.1, 0.06, 0.04, 0.05, 0, DARK); // mirrors
  }
  trim.box(0, c + bodyH * 0.45, hl + 0.005, hw * 0.42, 0.07, 0.015, 0, 0x2a2d32);   // grille
  trim.box(0, c + 0.2, -hl - 0.012, 0.24, 0.06, 0.01, 0, PLATE);
  return { paint, trim };
}

/** Unit wheel: cylinder of radius 1 and half-width 1, axle along X. */
export function buildWheelGeo(): Geo {
  const g = new Geo(), n = 12;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, am = (a0 + a1) / 2;
    const y0 = Math.cos(a0), z0 = Math.sin(a0), y1 = Math.cos(a1), z1 = Math.sin(a1);
    g.quad(-1, y0, z0, 1, y0, z0, 1, y1, z1, -1, y1, z1, 0, Math.cos(am), Math.sin(am), 0.09, 0.09, 0.1);
    for (const s of [-1, 1]) {
      g.tri(s, 0, 0, s, y0, z0, s, y1, z1, s, 0, 0, 0.1, 0.1, 0.11);
      g.tri(s * 1.02, 0, 0, s * 1.02, y0 * 0.6, z0 * 0.6, s * 1.02, y1 * 0.6, z1 * 0.6, s, 0, 0, i % 3 === 0 ? 0.42 : 0.6, i % 3 === 0 ? 0.44 : 0.62, i % 3 === 0 ? 0.46 : 0.65);
    }
  }
  return g;
}
