// World data types for Galeport. Everything here is plain data so it can be tested in Node.

export type Surface = "asphalt" | "pavement" | "wet" | "cobble" | "grass" | "sand" | "metal" | "water";
export type District = "harbor" | "oldsteps" | "beach" | "highline" | "civic" | "lantern";
export type EdgeKind = "street" | "boulevard" | "highline" | "cobble";

export interface RoadNode {
  id: number;
  x: number;
  z: number;
  edges: number[];
  signal: boolean;
  signalOffset: number;
}

export interface RoadEdge {
  id: number;
  a: number;
  b: number;
  kind: EdgeKind;
  lanes: number; // per direction
  laneWidth: number;
  halfWidth: number;
  sidewalk: number;
  speed: number; // m/s
  length: number;
  dx: number; // unit dir a->b
  dz: number;
  district: District;
  rushLane: boolean; // marked oncoming-scoring segment
  axis: 0 | 1; // 0 = east-west dominant, 1 = north-south dominant
}

/** Oriented box collider in the xz plane with a vertical extent. */
export interface Collider {
  cx: number;
  cz: number;
  hx: number;
  hz: number;
  yaw: number;
  c: number; // cos(yaw)
  s: number; // sin(yaw)
  minY: number;
  maxY: number;
  kind: "building" | "landmark" | "wall" | "rail" | "tree" | "container" | "rock";
}

export interface Building {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  baseY: number;
  height: number;
  district: District;
  color: [number, number, number];
  roof: [number, number, number];
  neon: boolean;
  style: number;
}

/** Piecewise linear height profile along a volume's long axis (u in [0,1]). Repeated u = discontinuity. */
export type Profile = [number, number][];

export interface Volume {
  id: string;
  cx: number;
  cz: number;
  yaw: number; // long axis direction heading
  halfLen: number;
  halfWid: number;
  mode: "rel" | "abs";
  baseY: number;
  profile: Profile;
  surface?: Surface;
  visual: "ramp" | "deck" | "stairs" | "terrace" | "ferry";
}

export interface CutRegion {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  depth: number;
  waterDepth: number; // water surface below terrain
}

export interface Shortcut {
  id: string;
  name: string;
  district: District;
  kind: string; // alley, ramp, garage, grass terrace, tunnel, deck, ferry, tram lane, beach, stairs
  points: [number, number][];
  width: number;
  surface: Surface;
  roofed: boolean;
  /** gate segments at both ends: [x1,z1,x2,z2] */
  gateA: [number, number, number, number];
  gateB: [number, number, number, number];
  color: string;
}

export type LandmarkType =
  | "lighthouse" | "ferris" | "dome" | "clocktower" | "stadium" | "pagoda" | "mast" | "hall"
  | "hotel" | "arch" | "chapel" | "tent" | "tower" | "pier" | "theater" | "depot";

export interface Destination {
  id: number;
  name: string;
  district: District;
  landmark: LandmarkType;
  color: string;
  /** arrival ring center (in curb lane) */
  x: number;
  z: number;
  edge: number;
  /** landmark center + footprint radius */
  lx: number;
  lz: number;
  lr: number;
  facing: number; // yaw from landmark toward the road
  scenic: boolean;
}

export interface PickupSpot {
  id: number;
  x: number; // ring center (curb lane)
  z: number;
  px: number; // passenger standing point (sidewalk)
  pz: number;
  edge: number;
  district: District;
  yaw: number; // lane heading at the spot
}

export interface Zone {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  surface: Surface;
  kind: "park" | "plaza" | "beach" | "quay" | "lawn";
}

export interface ItemSpawn {
  id: number;
  kind: "token" | "spark" | "repair";
  x: number;
  z: number;
}

export interface PropSpawn {
  id: number;
  kind: "cone" | "crate" | "chair" | "barrier";
  x: number;
  z: number;
  yaw: number;
}

export interface TreeSpawn {
  x: number;
  z: number;
  kind: "round" | "palm" | "cypress";
  scale: number;
}
