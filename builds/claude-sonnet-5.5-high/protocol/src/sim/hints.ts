// Authored bot hints for Aperture Annex: staging points, hold angles, plant spots, utility targets.
// Coordinates are world metres (x east, z south). Every point is validated reachable by the map scanner tests.

export interface P2 { x: number; z: number }
export interface HoldSpot extends P2 { yaw: number; label: string }

/** Yaw that faces from `a` towards `b`. */
export function yawTo(a: P2, b: P2): number { return Math.atan2(-(b.x - a.x), -(b.z - a.z)); }

export interface SiteHints {
  /** Lane staging points, grouped by approach lane. */
  lanes: Array<{ name: string; stage: P2[]; entry: P2; push: P2[] }>;
  plant: P2[];
  /** Where attackers hold after the Spike is armed. */
  postPlant: HoldSpot[];
  /** Cleared spots inside the site (execute). */
  clear: P2[];
  smoke: P2[];
  flash: P2[];
  /** Defender anchor positions. */
  hold: HoldSpot[];
  /** Retake staging (outside the site) then entry. */
  retake: Array<{ stage: P2; entry: P2 }>;
}

const A_PLANT: P2[] = [{ x: 19, z: 21 }, { x: 13, z: 25 }, { x: 20, z: 18 }];
const B_PLANT: P2[] = [{ x: 79, z: 13 }, { x: 85, z: 19 }, { x: 89, z: 11 }];

export const HINTS: Record<'A' | 'B', SiteHints> = {
  A: {
    lanes: [
      { name: 'Dock', stage: [{ x: 8, z: 50 }, { x: 9, z: 53 }], entry: { x: 8, z: 31 }, push: [{ x: 8, z: 29 }, { x: 8, z: 24 }] },
      { name: 'Cargo', stage: [{ x: 20, z: 50 }, { x: 19, z: 47 }], entry: { x: 20, z: 31 }, push: [{ x: 20, z: 29 }, { x: 19, z: 23 }] },
    ],
    plant: A_PLANT,
    postPlant: [
      { x: 8, z: 27, yaw: yawTo({ x: 8, z: 27 }, { x: 26, z: 12 }), label: 'dock' },
      { x: 21, z: 28, yaw: yawTo({ x: 21, z: 28 }, { x: 26, z: 14 }), label: 'cargo' },
      { x: 16, z: 16, yaw: yawTo({ x: 16, z: 16 }, { x: 29, z: 10 }), label: 'turbine' },
      { x: 22, z: 23, yaw: yawTo({ x: 22, z: 23 }, { x: 27, z: 14 }), label: 'wall' },
    ],
    clear: [{ x: 9, z: 22 }, { x: 15, z: 24 }, { x: 21, z: 16 }, { x: 12, z: 16 }],
    smoke: [{ x: 8, z: 10 }, { x: 25, z: 15 }],
    flash: [{ x: 18, z: 14 }, { x: 24, z: 24 }],
    hold: [
      { x: 27, z: 19, yaw: yawTo({ x: 27, z: 19 }, { x: 18, z: 26 }), label: 'fallback' },
      { x: 7, z: 7, yaw: yawTo({ x: 7, z: 7 }, { x: 15, z: 22 }), label: 'gantry' },
    ],
    retake: [
      { stage: { x: 26, z: 11 }, entry: { x: 22, z: 15 } },
      { stage: { x: 28, z: 27 }, entry: { x: 23, z: 25 } },
    ],
  },
  B: {
    lanes: [
      { name: 'Glass East', stage: [{ x: 90, z: 52 }, { x: 90, z: 49 }], entry: { x: 90, z: 31 }, push: [{ x: 90, z: 29 }, { x: 86, z: 22 }] },
      { name: 'Glass West', stage: [{ x: 84, z: 52 }, { x: 84, z: 49 }], entry: { x: 84, z: 31 }, push: [{ x: 84, z: 29 }, { x: 80, z: 22 }] },
    ],
    plant: B_PLANT,
    postPlant: [
      { x: 86, z: 27, yaw: yawTo({ x: 86, z: 27 }, { x: 70, z: 10 }), label: 'glass' },
      { x: 75, z: 26, yaw: yawTo({ x: 75, z: 26 }, { x: 68, z: 11 }), label: 'crawl' },
      { x: 90, z: 21, yaw: yawTo({ x: 90, z: 21 }, { x: 72, z: 11 }), label: 'rail' },
      { x: 83, z: 22, yaw: yawTo({ x: 83, z: 22 }, { x: 68, z: 9 }), label: 'mid' },
    ],
    clear: [{ x: 83, z: 19 }, { x: 85, z: 15 }, { x: 89, z: 12 }, { x: 81, z: 12 }],
    smoke: [{ x: 74, z: 12 }, { x: 88, z: 8 }],
    flash: [{ x: 80, z: 12 }, { x: 86, z: 14 }],
    hold: [
      { x: 78, z: 25, yaw: yawTo({ x: 78, z: 25 }, { x: 80, z: 36 }), label: 'south' },
      { x: 88, z: 10, yaw: yawTo({ x: 88, z: 10 }, { x: 80, z: 22 }), label: 'corner' },
    ],
    retake: [
      { stage: { x: 68, z: 11 }, entry: { x: 74, z: 14 } },
      { stage: { x: 66, z: 27 }, entry: { x: 74, z: 25 } },
    ],
  },
};

/** Mid anchor for defenders. */
export const MID_HOLD: HoldSpot = { x: 46, z: 40, yaw: yawTo({ x: 46, z: 40 }, { x: 46, z: 56 }), label: 'mid' };

/** Where bots hide when saving. */
export const SAVE_SPOTS: Record<'cus' | 'int', P2[]> = {
  cus: [{ x: 38, z: 4 }, { x: 56, z: 4 }, { x: 44, z: 14 }, { x: 52, z: 14 }, { x: 60, z: 8 }],
  int: [{ x: 30, z: 66 }, { x: 22, z: 62 }, { x: 67, z: 66 }, { x: 78, z: 62 }, { x: 50, z: 68 }],
};

export const DEFAULT_ENTRY: Record<'A' | 'B', P2> = { A: { x: 26, z: 11 }, B: { x: 68, z: 11 } };
