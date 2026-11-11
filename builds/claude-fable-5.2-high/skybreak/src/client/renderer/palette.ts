// Terrain colouring shared by the 3D terrain mesh and the 2D map so they always agree.
import { clamp, fbm2, smoothstep } from "../../shared/math";
import { LOCATIONS, type IslandData } from "../../shared/world/island";

export const PATH_EDGES: readonly [number, number][] = [
  [0, 4], [4, 2], [4, 3], [3, 5], [5, 10], [10, 7], [7, 2], [0, 12], [12, 1], [1, 6], [6, 2], [0, 9], [9, 3], [12, 8], [4, 7],
  [5, 11], [11, 3], [2, 13],
];

export const SKY = {
  zenith: [0.13, 0.47, 0.82],
  mid: [0.32, 0.74, 0.9],
  horizon: [0.78, 0.94, 0.92],
  fog: [0.72, 0.9, 0.92],
  sun: [-0.42, 0.78, 0.36],
} as const;

function distSeg(x: number, z: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax,
    dz = bz - az;
  const t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1);
  return Math.hypot(x - (ax + dx * t), z - (az + dz * t));
}

const n = { x: 0, y: 0, z: 0 };

function mix(out: number[], r: number, g: number, b: number, t: number): void {
  out[0] = out[0]! + (r - out[0]!) * t;
  out[1] = out[1]! + (g - out[1]!) * t;
  out[2] = out[2]! + (b - out[2]!) * t;
}

/** Linear-ish RGB (0..1) ground colour at a world position. */
export function terrainColor(isl: IslandData, x: number, z: number, out: number[]): void {
  const h = isl.hf.height(x, z);
  const ny = isl.hf.normal(x, z, n);
  const v = fbm2(x / 55 + 3, z / 55 + 8, 3, 91);
  const v2 = fbm2(x / 9 + 13, z / 9 + 1, 2, 17);
  // meadow greens
  out[0] = 0.36 + v * 0.2;
  out[1] = 0.62 + v * 0.16;
  out[2] = 0.27 + v * 0.06;
  mix(out, 0.56, 0.72, 0.32, smoothstep(0.45, 0.8, v2) * 0.35);
  // highland: paler, drier
  mix(out, 0.69, 0.74, 0.47, smoothstep(34, 58, h) * 0.6);
  // limestone on slopes
  const rock = smoothstep(0.86, 0.7, ny);
  mix(out, 0.86 + v2 * 0.06, 0.81 + v2 * 0.05, 0.68, rock);
  // paths
  let pd = 1e9;
  for (const [a, b] of PATH_EDGES) {
    const A = LOCATIONS[a]!,
      B = LOCATIONS[b]!;
    const d = distSeg(x, z, A.x, A.z, B.x, B.z);
    if (d < pd) pd = d;
  }
  if (h > 0.8) mix(out, 0.8, 0.7, 0.5, smoothstep(5.5, 2.0, pd + (v2 - 0.5) * 3) * 0.85 * (1 - rock));
  // location ground treatments
  const L = LOCATIONS;
  const dl = (i: number): number => Math.hypot(x - L[i]!.x, z - L[i]!.z);
  mix(out, 0.88, 0.82, 0.66, smoothstep(92, 70, dl(0)) * 0.8); // market paving
  mix(out, 0.5, 0.58, 0.55, smoothstep(105, 70, dl(1)) * 0.75); // array wet stone
  mix(out, 0.47, 0.44, 0.41, smoothstep(90, 66, dl(2)) * 0.85); // kilnworks ash
  mix(out, 0.3, 0.6, 0.24, smoothstep(118, 80, dl(3)) * 0.5 * (1 - rock)); // orchard deep green
  mix(out, 0.82, 0.8, 0.7, smoothstep(40, 22, dl(4)) * 0.6); // abbey flagstones
  mix(out, 0.66, 0.66, 0.62, smoothstep(96, 72, dl(5)) * 0.85); // docks concrete
  mix(out, 0.93, 0.91, 0.84, smoothstep(58, 30, dl(8)) * 0.85); // chalk quarry
  // shoreline sand, then seabed
  mix(out, 0.93, 0.85, 0.62, smoothstep(2.6, 0.9, h) * (1 - smoothstep(92, 76, dl(5))));
  if (h < 0.4) {
    mix(out, 0.62, 0.72, 0.6, smoothstep(0.4, -1.5, h));
    mix(out, 0.2, 0.42, 0.46, smoothstep(-1.5, -9, h));
  }
  // fine grain
  const g = 0.94 + v2 * 0.12;
  out[0] = clamp(out[0]! * g, 0, 1);
  out[1] = clamp(out[1]! * g, 0, 1);
  out[2] = clamp(out[2]! * g, 0, 1);
}

export function hexToRgb(c: number): [number, number, number] {
  return [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255];
}
export function cssToRgb(css: string): [number, number, number] {
  const v = parseInt(css.replace("#", ""), 16);
  return hexToRgb(v);
}
