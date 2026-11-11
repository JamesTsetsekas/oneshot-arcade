// content-data: map schema shared by the simulation (collision, nav, spawns) and the renderer.
export type MatId =
  | 'ground' | 'deck' | 'concrete' | 'composite' | 'compositeDark' | 'metal' | 'thinMetal' | 'orange' | 'cyan'
  | 'wood' | 'glass' | 'rail' | 'grate' | 'rock' | 'containerA' | 'containerB' | 'containerC' | 'boundary'
  | 'roof' | 'pipe' | 'vehicle' | 'interior' | 'floor';

export interface MatProps {
  /** penetration energy cost; Infinity = structural */
  pen: number;
  /** vision (bot perception) passes through */
  see: boolean;
  /** surface family for impact VFX / audio / footsteps */
  surf: 'concrete' | 'metal' | 'wood' | 'glass' | 'dirt';
}

export const MATS: Record<MatId, MatProps> = {
  ground: { pen: Infinity, see: false, surf: 'concrete' },
  deck: { pen: Infinity, see: false, surf: 'concrete' },
  floor: { pen: Infinity, see: false, surf: 'concrete' },
  concrete: { pen: Infinity, see: false, surf: 'concrete' },
  composite: { pen: Infinity, see: false, surf: 'concrete' },
  compositeDark: { pen: Infinity, see: false, surf: 'concrete' },
  interior: { pen: Infinity, see: false, surf: 'concrete' },
  roof: { pen: Infinity, see: false, surf: 'metal' },
  metal: { pen: Infinity, see: false, surf: 'metal' },
  orange: { pen: Infinity, see: false, surf: 'metal' },
  cyan: { pen: Infinity, see: false, surf: 'metal' },
  vehicle: { pen: Infinity, see: false, surf: 'metal' },
  rock: { pen: Infinity, see: false, surf: 'dirt' },
  pipe: { pen: Infinity, see: false, surf: 'metal' },
  containerA: { pen: Infinity, see: false, surf: 'metal' },
  containerB: { pen: Infinity, see: false, surf: 'metal' },
  containerC: { pen: Infinity, see: false, surf: 'metal' },
  thinMetal: { pen: 1.0, see: false, surf: 'metal' },
  grate: { pen: 0.8, see: false, surf: 'metal' },
  wood: { pen: 1.6, see: false, surf: 'wood' },
  glass: { pen: 0.05, see: true, surf: 'glass' },
  rail: { pen: 0.3, see: true, surf: 'metal' },
  boundary: { pen: Infinity, see: true, surf: 'concrete' },
};

export type RampDir = 'x+' | 'x-' | 'z+' | 'z-';

export interface Solid {
  kind: 'box' | 'ramp' | 'cyl';
  min: [number, number, number];
  max: [number, number, number];
  mat: MatId;
  /** ramps rise toward this direction (low edge at min.y, high edge at max.y) */
  dir?: RampDir;
  /** breakable glass pane id */
  glass?: number;
  /** collision only, not rendered */
  hidden?: boolean;
}

export type Decor =
  | { k: 'box'; min: [number, number, number]; max: [number, number, number]; mat: MatId | 'paint' | 'paintWhite' | 'lamp' | 'cyanGlow' | 'orangeGlow' | 'dark' | 'screen' }
  | { k: 'cyl'; a: [number, number, number]; b: [number, number, number]; r: number; mat: MatId | 'dark' | 'paintWhite' | 'cyanGlow' }
  | { k: 'sign'; pos: [number, number, number]; w: number; h: number; face: RampDir; text: string; sub?: string; tone: 'cyan' | 'orange' | 'white' }
  | { k: 'dish'; pos: [number, number, number] }
  | { k: 'mast'; pos: [number, number, number]; h: number };

export interface SpawnPoint { x: number; y: number; z: number; yaw: number; group: number; home: 0 | 1 }
export interface InterestNode { x: number; y: number; z: number; hold: boolean; yaw: number; name: string }
export interface Zone { name: string; district: number; minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number; indoor: boolean }
export interface Lamp { x: number; y: number; z: number; r: number; color: [number, number, number]; power: number }

export interface MapDef {
  id: string;
  name: string;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  waterY: number;
  solids: Solid[];
  decor: Decor[];
  spawns: SpawnPoint[];
  interest: InterestNode[];
  zones: Zone[];
  lamps: Lamp[];
  glassCount: number;
  districts: string[];
}

/** Height of a solid's top surface at (x, z), assuming (x, z) is inside its footprint. */
export function solidTopAt(s: Solid, x: number, z: number): number {
  if (s.kind !== 'ramp') return s.max[1];
  let t = 0;
  switch (s.dir) {
    case 'x+': t = (x - s.min[0]) / (s.max[0] - s.min[0]); break;
    case 'x-': t = (s.max[0] - x) / (s.max[0] - s.min[0]); break;
    case 'z+': t = (z - s.min[2]) / (s.max[2] - s.min[2]); break;
    default: t = (s.max[2] - z) / (s.max[2] - s.min[2]); break;
  }
  t = Math.max(0, Math.min(1, t));
  return s.min[1] + (s.max[1] - s.min[1]) * t;
}

export function zoneAt(map: MapDef, x: number, y: number, z: number): Zone | null {
  let best: Zone | null = null;
  let bestVol = Infinity;
  for (const zn of map.zones) {
    if (x >= zn.minX && x <= zn.maxX && z >= zn.minZ && z <= zn.maxZ && y >= zn.minY && y <= zn.maxY) {
      const vol = (zn.maxX - zn.minX) * (zn.maxZ - zn.minZ) * (zn.maxY - zn.minY);
      if (vol < bestVol) { best = zn; bestVol = vol; }
    }
  }
  return best;
}
