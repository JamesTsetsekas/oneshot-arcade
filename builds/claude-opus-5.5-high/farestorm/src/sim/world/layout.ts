// Authored layout data for Galeport: grid, districts, destinations, shortcuts and set pieces.
// The generator in city.ts turns this into roads, blocks, colliders and metadata.

import type { District, LandmarkType, Profile, Surface } from "./types";

export const COLS = [-640, -500, -360, -220, -80, 60, 200, 340, 480, 620] as const;
export const ROWS = [-340, -220, -100, 20, 140, 260, 380] as const;
export const QUAY_Z = -405;
export const QUAY_EDGE_Z = -472;
export const INLET = { minX: 392, maxX: 428, maxZ: -362 };
export const BOUNDS = { minX: -688, maxX: 688, minZ: -520, maxZ: 436 };
export const CANAL = { minZ: 72, maxZ: 88, minX: -688, maxX: -300 };
export const BEACH_WALL_Z = -361;
export const BEACH_GAPS = [-620, -420, -230, -110];

/** Grid edges removed for block variety: [col, row, col2, row2] in grid indices. */
export const REMOVED_EDGES: [number, number, number, number][] = [
  [3, 5, 3, 6], // Old Steps: long block between Bellstair and the stair run
  [7, 4, 7, 5], // Civic north: wide block
  [7, 1, 8, 1], // Harbor/Highline inland
  [0, 5, 1, 5], // Old Steps west: merged terrace block
];

/** Edges marked as Rush Lanes (oncoming-scoring segments): [col,row,col2,row2]. */
export const RUSH_LANES: [number, number, number, number][] = [
  [0, 3, 1, 3], [1, 3, 2, 3], [2, 3, 3, 3],
  [4, 1, 4, 2], [4, 2, 4, 3],
  [6, 2, 6, 3], [6, 3, 6, 4],
  [1, 2, 2, 2], [2, 2, 3, 2],
  [3, 4, 4, 4], [4, 4, 5, 4],
  [7, 2, 8, 2],
];

/** Hill crests (Highline drops) that throw the taxi airborne at high speed. */
export const CRESTS = [
  { x: 620, z: -160, h: 2.6, w: 19, span: 34 },
  { x: 620, z: 200, h: 2.4, w: 19, span: 34 },
  { x: 60, z: 80, h: 1.8, w: 17, span: 26 },
  { x: -360, z: -160, h: 1.9, w: 17, span: 22 },
];

export interface DestinationDef {
  name: string;
  district: District;
  block: [number, number]; // ci, ri (ri -1 = coast strip, -2 = quay south)
  side: "N" | "S" | "E" | "W";
  t: number;
  landmark: LandmarkType;
  color: string;
  r: number;
  scenic?: boolean;
}

export const DESTINATIONS: DestinationDef[] = [
  // Harbor Loop
  { name: "Gullwing Ferry Terminal", district: "harbor", block: [5, -1], side: "N", t: 0.5, landmark: "hall", color: "#19b5b0", r: 15, scenic: true },
  { name: "Lumen Point Lighthouse", district: "harbor", block: [8, -2], side: "N", t: 0.55, landmark: "lighthouse", color: "#ff6a55", r: 9, scenic: true },
  { name: "Saltworks Market Hall", district: "harbor", block: [7, 0], side: "S", t: 0.5, landmark: "tent", color: "#ff9a2e", r: 14 },
  { name: "Tidewater Aquarium", district: "harbor", block: [6, 1], side: "S", t: 0.5, landmark: "dome", color: "#33d6e8", r: 15, scenic: true },
  { name: "Brine Exchange", district: "harbor", block: [6, -2], side: "N", t: 0.45, landmark: "depot", color: "#e2483d", r: 13 },
  // Sunward Beach
  { name: "Sunward Pier Wheel", district: "beach", block: [1, -1], side: "N", t: 0.35, landmark: "ferris", color: "#ff5f8f", r: 12, scenic: true },
  { name: "Coral Grand Hotel", district: "beach", block: [2, 0], side: "E", t: 0.3, landmark: "hotel", color: "#ff8a6b", r: 14 },
  { name: "Breakline Surf Club", district: "beach", block: [3, -1], side: "N", t: 0.5, landmark: "pier", color: "#1fc7b8", r: 11 },
  { name: "Lido Azul Pools", district: "beach", block: [0, 0], side: "S", t: 0.5, landmark: "arch", color: "#3fa9ff", r: 13 },
  { name: "Seashell Bandstand", district: "beach", block: [1, 1], side: "N", t: 0.5, landmark: "dome", color: "#ffb3c7", r: 12, scenic: true },
  { name: "Driftwood Café", district: "beach", block: [0, -1], side: "N", t: 0.6, landmark: "tent", color: "#ffc85a", r: 10 },
  // Lantern Ward
  { name: "Lantern Night Market", district: "lantern", block: [0, 2], side: "W", t: 0.5, landmark: "tent", color: "#ff3b6b", r: 12 },
  { name: "Paper Moon Theater", district: "lantern", block: [2, 3], side: "S", t: 0.6, landmark: "theater", color: "#a35cff", r: 13 },
  { name: "Neon Arcade Hall", district: "lantern", block: [0, 3], side: "N", t: 0.5, landmark: "hall", color: "#ff3ec8", r: 12 },
  { name: "Canal Gate Teahouse", district: "lantern", block: [1, 2], side: "N", t: 0.3, landmark: "pagoda", color: "#e8453c", r: 11, scenic: true },
  { name: "Noodle Bridge Kitchens", district: "lantern", block: [2, 2], side: "W", t: 0.5, landmark: "hall", color: "#ffa62b", r: 12 },
  { name: "Lantern Belltower", district: "lantern", block: [1, 4], side: "S", t: 0.5, landmark: "tower", color: "#ffd36b", r: 9, scenic: true },
  // Old Steps
  { name: "Bellstair Chapel", district: "oldsteps", block: [2, 5], side: "S", t: 0.5, landmark: "chapel", color: "#f4e6c8", r: 12, scenic: true },
  { name: "Terrace Tram Depot", district: "oldsteps", block: [5, 5], side: "N", t: 0.5, landmark: "depot", color: "#ff6f59", r: 12 },
  { name: "Fig Market Steps", district: "oldsteps", block: [3, 4], side: "N", t: 0.5, landmark: "tent", color: "#7ccf4a", r: 12 },
  { name: "Old Funicular Station", district: "oldsteps", block: [0, 5], side: "E", t: 0.5, landmark: "arch", color: "#21b3a4", r: 12 },
  { name: "Copperwing Observatory", district: "oldsteps", block: [4, 5], side: "N", t: 0.25, landmark: "dome", color: "#d9874a", r: 12, scenic: true },
  // Civic Crown
  { name: "Museum of Tides", district: "civic", block: [4, 2], side: "N", t: 0.25, landmark: "dome", color: "#e9f4f2", r: 13, scenic: true },
  { name: "Crown Stadium", district: "civic", block: [6, 2], side: "E", t: 0.4, landmark: "stadium", color: "#2a7fff", r: 34 },
  { name: "City Hall Clocktower", district: "civic", block: [4, 3], side: "S", t: 0.5, landmark: "clocktower", color: "#f2e2b8", r: 11, scenic: true },
  { name: "Galeport Central Station", district: "civic", block: [5, 3], side: "W", t: 0.5, landmark: "hall", color: "#18a6a0", r: 16 },
  { name: "Civic Library", district: "civic", block: [3, 3], side: "E", t: 0.5, landmark: "theater", color: "#c8a07a", r: 13 },
  { name: "Opera Dome", district: "civic", block: [6, 3], side: "N", t: 0.5, landmark: "dome", color: "#ff7a5c", r: 14 },
  // Highline
  { name: "Highline Observation Tower", district: "highline", block: [8, 4], side: "S", t: 0.5, landmark: "tower", color: "#2fd1c5", r: 8, scenic: true },
  { name: "Vantage Tech Campus", district: "highline", block: [8, 2], side: "W", t: 0.7, landmark: "tower", color: "#7aa8ff", r: 13 },
  { name: "Galeport General Hospital", district: "highline", block: [7, 3], side: "E", t: 0.5, landmark: "hall", color: "#e8fbff", r: 14 },
  { name: "Wavecrest Radio Mast", district: "highline", block: [7, 5], side: "S", t: 0.5, landmark: "mast", color: "#ff4d4d", r: 9, scenic: true },
];

export interface VolumeDef {
  center: [number, number];
  yaw: number;
  halfLen: number;
  halfWid: number;
  mode: "rel" | "abs";
  profile: Profile;
  surface?: Surface;
  visual: "ramp" | "deck" | "stairs" | "terrace" | "ferry";
  baseY?: number;
}

export interface ShortcutDef {
  id: string;
  name: string;
  district: District;
  kind: string;
  points: [number, number][];
  width: number;
  surface: Surface;
  roofed?: boolean;
  color: string;
  volumes?: VolumeDef[];
  clearance?: number;
}

const H = Math.PI / 2;

/** Sawtooth profile: each step rises gently then drops (a repeated u value is a discontinuity). */
function stairs(steps: number, rise: number): Profile {
  const p: Profile = [];
  for (let k = 0; k < steps; k++) {
    p.push([k / steps, 0]);
    p.push([(k + 1) / steps, rise]);
  }
  return p;
}

export const SHORTCUTS: ShortcutDef[] = [
  { id: "kettle", name: "Kettle Alley", district: "lantern", kind: "neon alley", points: [[-570, -100], [-570, 20]], width: 7, surface: "wet", color: "#ff3ec8" },
  { id: "arcade", name: "Paper Lantern Arcade", district: "lantern", kind: "covered arcade", points: [[-500, 40], [-360, 40]], width: 8, surface: "pavement", roofed: true, color: "#ffb13b" },
  {
    id: "canal", name: "Lantern Canal Leap", district: "lantern", kind: "canal jump", points: [[-430, 20], [-430, 140]], width: 8, surface: "pavement", color: "#5cf2ff",
    volumes: [
      { center: [-430, 63], yaw: 0, halfLen: 7, halfWid: 4, mode: "rel", profile: [[0, 0], [1, 1.9]], visual: "ramp", surface: "metal" },
      { center: [-430, 97], yaw: Math.PI, halfLen: 7, halfWid: 4, mode: "rel", profile: [[0, 0], [1, 1.9]], visual: "ramp", surface: "metal" },
    ],
    clearance: 5,
  },
  {
    id: "stairs", name: "Old Steps Stair Run", district: "oldsteps", kind: "stair street", points: [[-150, 380], [-150, 260]], width: 7, surface: "cobble", color: "#ffd36b",
    volumes: [{ center: [-150, 320], yaw: Math.PI, halfLen: 50, halfWid: 3.5, mode: "rel", profile: stairs(9, 0.42), visual: "stairs", surface: "cobble" }],
  },
  { id: "market", name: "Market Terrace Cut", district: "oldsteps", kind: "market lane", points: [[-80, 260], [60, 380]], width: 7, surface: "cobble", color: "#7ccf4a" },
  { id: "tram", name: "Tram Yard Lane", district: "oldsteps", kind: "tram maintenance lane", points: [[60, 320], [200, 320]], width: 8, surface: "metal", color: "#ff6f59" },
  {
    id: "terrace", name: "Switchback Drop", district: "oldsteps", kind: "grass terrace", points: [[-430, 380], [-430, 260]], width: 9, surface: "grass", color: "#9be35a",
    volumes: [{ center: [-430, 320], yaw: Math.PI, halfLen: 48, halfWid: 4.5, mode: "rel", profile: stairs(3, 1.15), visual: "terrace", surface: "grass" }],
    clearance: 4,
  },
  { id: "sands", name: "Boardwalk Sands", district: "beach", kind: "beach run", points: [[-620, -340], [-620, -395], [-230, -395], [-230, -340]], width: 9, surface: "sand", color: "#ffd38a" },
  { id: "dunes", name: "Dune Hop", district: "beach", kind: "dune jumps", points: [[-420, -340], [-420, -386], [-110, -386], [-110, -340]], width: 9, surface: "sand", color: "#ffb35c" },
  { id: "hotel", name: "Hotel Forecourt Loop", district: "beach", kind: "forecourt cut", points: [[-360, -340], [-220, -220]], width: 8, surface: "pavement", color: "#ff8a6b" },
  {
    id: "seawall", name: "Seawall Kicker", district: "harbor", kind: "seawall jump", points: [[340, -405], [480, -405]], width: 9, surface: "pavement", color: "#3fd0ff",
    volumes: [
      { center: [384, -405], yaw: H, halfLen: 6, halfWid: 4.5, mode: "rel", profile: [[0, 0], [1, 3.0]], visual: "ramp", surface: "metal" },
      { center: [436, -405], yaw: -H, halfLen: 6, halfWid: 4.5, mode: "rel", profile: [[0, 0], [1, 3.0]], visual: "ramp", surface: "metal" },
    ],
  },
  {
    id: "ferry", name: "Ferry Hold", district: "harbor", kind: "ferry deck", points: [[340, -405], [372, -460], [448, -460], [480, -405]], width: 9, surface: "metal", color: "#19b5b0",
    volumes: [{ center: [410, -460], yaw: H, halfLen: 40, halfWid: 8.5, mode: "abs", baseY: 1.5, profile: [[0, 0], [0.15, 1.4], [0.85, 1.4], [1, 0]], visual: "ferry", surface: "metal" }],
  },
  { id: "containers", name: "Container Canyon", district: "harbor", kind: "container lane", points: [[200, -375], [340, -375]], width: 8, surface: "metal", color: "#ff9a2e" },
  {
    id: "garage", name: "Crown Garage Cut", district: "civic", kind: "parking deck", points: [[60, -40], [200, -40]], width: 10, surface: "metal", color: "#2a7fff",
    volumes: [{ center: [130, -40], yaw: H, halfLen: 62, halfWid: 5, mode: "abs", profile: [[0, 0], [0.25, 5.5], [0.88, 5.5], [0.88, 0]], visual: "deck", surface: "metal" }],
    clearance: 5,
  },
  { id: "lawn", name: "Museum Lawn", district: "civic", kind: "grass cut", points: [[-80, -100], [60, 20]], width: 8, surface: "grass", color: "#9be35a" },
  { id: "stadium", name: "Stadium Service Road", district: "civic", kind: "service road", points: [[200, -60], [230, 10], [270, 20]], width: 8, surface: "asphalt", color: "#ffd36b" },
  {
    id: "construction", name: "Highline Construction Deck", district: "highline", kind: "construction deck", points: [[480, -100], [620, 20]], width: 9, surface: "metal", color: "#ffcc33",
    volumes: [{ center: [550, -40], yaw: Math.atan2(140, 120), halfLen: 52, halfWid: 4.5, mode: "abs", profile: [[0, 0], [0.3, 3], [0.6, 3], [0.72, 4.2], [0.72, 0]], visual: "deck", surface: "metal" }],
    clearance: 6,
  },
  {
    id: "overpass", name: "Overpass Gap", district: "highline", kind: "overpass gap", points: [[480, 200], [620, 200]], width: 9, surface: "metal", color: "#ff4d8d",
    volumes: [
      { center: [517, 200], yaw: H, halfLen: 25, halfWid: 4.5, mode: "abs", profile: [[0, 0], [0.55, 5], [0.8, 5], [1, 6.2]], visual: "deck", surface: "metal" },
      { center: [580, 200], yaw: H, halfLen: 20, halfWid: 4.5, mode: "abs", profile: [[0, 5], [0.45, 5], [1, 0]], visual: "deck", surface: "metal" },
    ],
    clearance: 6,
  },
];

/** Blocks without generic buildings. */
export const OPEN_BLOCKS: { block: [number, number]; kind: "park" | "plaza" | "lawn"; surface: Surface }[] = [
  { block: [4, 2], kind: "lawn", surface: "grass" },
  { block: [4, 3], kind: "plaza", surface: "pavement" },
  { block: [4, 4], kind: "park", surface: "grass" },
  { block: [1, 5], kind: "park", surface: "grass" },
];

/** Repair arches placed in curb lanes: [col,row,col2,row2, t, side]. */
export const REPAIR_ARCHES: [number, number, number, number, number, number][] = [
  [2, 0, 3, 0, 0.5, 1],
  [5, 3, 5, 4, 0.5, -1],
  [8, 1, 8, 2, 0.5, 1],
  [0, 4, 0, 5, 0.5, 1],
];
