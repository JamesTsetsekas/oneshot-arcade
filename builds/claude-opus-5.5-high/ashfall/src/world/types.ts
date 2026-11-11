import type { Difficulty } from "../data/types";

export const BLOCK = 0, FLOOR = 1, ROAD = 2, PIT = 3;

export type ZoneId = "refuge" | "training" | "march" | "archive1" | "archive2" | "archive3" | "hunt_toll" | "hunt_engine";
export type Theme = "refuge" | "march" | "archive";

export type PropKind =
  | "rock" | "tree" | "deadtree" | "ruinwall" | "pillar" | "bookcase" | "sarcophagus" | "candles" | "crystal" | "tent" | "palisade"
  | "bonfire" | "torch" | "brazier" | "cart" | "bones" | "orrery" | "giantbook" | "gear" | "banner" | "anvil" | "well" | "wallblock" | "arch" | "stairs";

export interface PropDef { kind: PropKind; x: number; y: number; rot: number; scale: number }

export type InteractKind =
  | "waypoint" | "chest" | "urn" | "lever" | "gate" | "exit" | "npc" | "cage" | "shrine" | "explosive" | "stash" | "dummy_spawner" | "hunt_portal" | "door";

export interface InteractDef {
  id: number;
  kind: InteractKind;
  x: number;
  y: number;
  name: string;
  data?: Record<string, any>;
}

export interface PackMember { enemy: string; elite?: string[]; boss?: boolean }
export interface PackDef {
  id: number;
  x: number;
  y: number;
  members: PackMember[];
  kind: "normal" | "elite" | "event" | "guardian" | "boss" | "training";
  level: number;
  points: number;
  dormant?: boolean;
}

export interface Hazard {
  id: number;
  kind: "spikes" | "vent";
  x: number;
  y: number;
  rot: number;
  period: number;
  offset: number;
}

export interface Landmark { id: string; name: string; x: number; y: number }

export interface ZoneData {
  id: ZoneId;
  name: string;
  theme: Theme;
  seed: number;
  difficulty: Difficulty;
  level: number;
  w: number;
  h: number;
  cells: Uint8Array;
  entries: Record<string, { x: number; y: number }>;
  props: PropDef[];
  interactables: InteractDef[];
  packs: PackDef[];
  hazards: Hazard[];
  landmarks: Landmark[];
  lights: { x: number; y: number; color: string; intensity: number; range: number }[];
  /** Generation metadata used by validators/tests and the automap. */
  meta: Record<string, any>;
  safe?: boolean;
}

export function idx(z: { w: number }, x: number, y: number) {
  return y * z.w + x;
}

export function walkable(z: { w: number; h: number; cells: Uint8Array }, x: number, y: number): boolean {
  const cx = Math.floor(x), cy = Math.floor(y);
  if (cx < 0 || cy < 0 || cx >= z.w || cy >= z.h) return false;
  const c = z.cells[cy * z.w + cx];
  return c === FLOOR || c === ROAD;
}
