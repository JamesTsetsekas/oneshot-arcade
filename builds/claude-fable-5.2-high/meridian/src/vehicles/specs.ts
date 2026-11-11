// Vehicle tuning sheet: eight original South Quay vehicles. All numbers are SI units.
export type VehClass = 'compact' | 'sedan' | 'hatch' | 'muscle' | 'van' | 'police' | 'moto';
export interface VehicleSpec {
  id: string; name: string; maker: string; cls: VehClass; moto: boolean;
  mass: number; length: number; width: number; height: number; clearance: number;
  wheelbase: number; track: number; wheelRadius: number; comH: number;
  suspFreq: number; suspDamp: number; suspRest: number; suspTravel: number;
  drive: 'fwd' | 'rwd' | 'awd'; maxForce: number; power: number; topSpeed: number;
  brakeForce: number; gripF: number; gripR: number; handbrakeGrip: number;
  steerMax: number; steerHigh: number; drag: number; rollInfluence: number;
  seats: number; colors: number[]; traffic: number; // spawn weight in civilian traffic
  // body profile for the procedural mesh: hood/cabin proportions
  body: { hood: number; cabin: number; cabinH: number; beltH: number; taper: number; rearDrop: number };
}
const CAR_COLORS = [0xd9482b, 0x1f7a8c, 0xf2b134, 0xe8e2d0, 0x3a4048, 0x2a9d6f, 0x7c8cff, 0xc2456e, 0x9aa7b0, 0xf0f0f0];

export const VEHICLES: Record<string, VehicleSpec> = {
  dart: {
    id: 'dart', name: 'Dart', maker: 'Kestrel', cls: 'compact', moto: false,
    mass: 1050, length: 3.8, width: 1.7, height: 1.45, clearance: 0.24, wheelbase: 2.45, track: 1.46, wheelRadius: 0.31, comH: 0.42,
    suspFreq: 2.0, suspDamp: 0.55, suspRest: 0.3, suspTravel: 0.2,
    drive: 'fwd', maxForce: 5200, power: 80000, topSpeed: 44, brakeForce: 11000, gripF: 1.15, gripR: 1.2, handbrakeGrip: 0.42,
    steerMax: 0.6, steerHigh: 0.11, drag: 0.42, rollInfluence: 0.12, seats: 4, colors: CAR_COLORS, traffic: 3,
    body: { hood: 0.24, cabin: 0.56, cabinH: 0.56, beltH: 0.78, taper: 0.14, rearDrop: 0.02 },
  },
  tern: {
    id: 'tern', name: 'Tern', maker: 'Moreno', cls: 'sedan', moto: false,
    mass: 1350, length: 4.6, width: 1.8, height: 1.42, clearance: 0.24, wheelbase: 2.75, track: 1.54, wheelRadius: 0.33, comH: 0.44,
    suspFreq: 1.8, suspDamp: 0.55, suspRest: 0.3, suspTravel: 0.2,
    drive: 'fwd', maxForce: 6400, power: 105000, topSpeed: 48, brakeForce: 14000, gripF: 1.15, gripR: 1.2, handbrakeGrip: 0.42,
    steerMax: 0.58, steerHigh: 0.1, drag: 0.44, rollInfluence: 0.12, seats: 4, colors: CAR_COLORS, traffic: 4,
    body: { hood: 0.27, cabin: 0.45, cabinH: 0.5, beltH: 0.8, taper: 0.16, rearDrop: 0.03 },
  },
  coaster: {
    id: 'coaster', name: 'Coaster', maker: 'Halden', cls: 'hatch', moto: false,
    mass: 1180, length: 4.1, width: 1.74, height: 1.5, clearance: 0.26, wheelbase: 2.55, track: 1.48, wheelRadius: 0.32, comH: 0.45,
    suspFreq: 1.9, suspDamp: 0.5, suspRest: 0.31, suspTravel: 0.21,
    drive: 'fwd', maxForce: 5400, power: 78000, topSpeed: 42, brakeForce: 12000, gripF: 1.1, gripR: 1.15, handbrakeGrip: 0.42,
    steerMax: 0.6, steerHigh: 0.11, drag: 0.46, rollInfluence: 0.13, seats: 4, colors: CAR_COLORS, traffic: 3,
    body: { hood: 0.2, cabin: 0.62, cabinH: 0.6, beltH: 0.8, taper: 0.1, rearDrop: 0.0 },
  },
  cutlass: {
    id: 'cutlass', name: 'Cutlass', maker: 'Brask', cls: 'muscle', moto: false,
    mass: 1600, length: 4.85, width: 1.9, height: 1.32, clearance: 0.2, wheelbase: 2.85, track: 1.6, wheelRadius: 0.35, comH: 0.4,
    suspFreq: 2.0, suspDamp: 0.6, suspRest: 0.27, suspTravel: 0.17,
    drive: 'rwd', maxForce: 11500, power: 270000, topSpeed: 62, brakeForce: 18000, gripF: 1.25, gripR: 1.2, handbrakeGrip: 0.38,
    steerMax: 0.58, steerHigh: 0.085, drag: 0.4, rollInfluence: 0.1, seats: 2, colors: [0xd9482b, 0x2c3036, 0xf2b134, 0x1f7a8c, 0x6a3d9a], traffic: 1,
    body: { hood: 0.36, cabin: 0.36, cabinH: 0.44, beltH: 0.76, taper: 0.2, rearDrop: 0.06 },
  },
  portage: {
    id: 'portage', name: 'Portage', maker: 'Halden', cls: 'van', moto: false,
    mass: 2300, length: 5.4, width: 2.0, height: 2.25, clearance: 0.3, wheelbase: 3.3, track: 1.7, wheelRadius: 0.36, comH: 0.68,
    suspFreq: 1.7, suspDamp: 0.6, suspRest: 0.32, suspTravel: 0.2,
    drive: 'rwd', maxForce: 8200, power: 115000, topSpeed: 38, brakeForce: 20000, gripF: 1.05, gripR: 1.1, handbrakeGrip: 0.5,
    steerMax: 0.56, steerHigh: 0.11, drag: 0.7, rollInfluence: 0.06, seats: 2, colors: [0xe8e2d0, 0xf2b134, 0x9aa7b0, 0x1f7a8c], traffic: 1.4,
    body: { hood: 0.12, cabin: 0.88, cabinH: 1.05, beltH: 1.15, taper: 0.04, rearDrop: 0.0 },
  },
  warden: {
    id: 'warden', name: 'Warden Interceptor', maker: 'Halden', cls: 'police', moto: false,
    mass: 1750, length: 4.9, width: 1.9, height: 1.46, clearance: 0.24, wheelbase: 2.9, track: 1.6, wheelRadius: 0.35, comH: 0.42,
    suspFreq: 2.0, suspDamp: 0.6, suspRest: 0.29, suspTravel: 0.19,
    drive: 'awd', maxForce: 11500, power: 250000, topSpeed: 62, brakeForce: 20000, gripF: 1.3, gripR: 1.3, handbrakeGrip: 0.42,
    steerMax: 0.58, steerHigh: 0.09, drag: 0.42, rollInfluence: 0.1, seats: 4, colors: [0xf4f6f8], traffic: 0,
    body: { hood: 0.29, cabin: 0.44, cabinH: 0.52, beltH: 0.82, taper: 0.15, rearDrop: 0.03 },
  },
  swift: {
    id: 'swift', name: 'Swift 250', maker: 'Kestrel', cls: 'moto', moto: true,
    mass: 280, length: 2.05, width: 0.6, height: 1.5, clearance: 0.26, wheelbase: 1.4, track: 0.26, wheelRadius: 0.3, comH: 0.5,
    suspFreq: 2.2, suspDamp: 0.6, suspRest: 0.26, suspTravel: 0.17,
    drive: 'rwd', maxForce: 1900, power: 32000, topSpeed: 40, brakeForce: 3600, gripF: 1.25, gripR: 1.25, handbrakeGrip: 0.5,
    steerMax: 0.52, steerHigh: 0.09, drag: 0.22, rollInfluence: 0.0, seats: 1, colors: [0xf2b134, 0x35e0d0, 0xd9482b], traffic: 0.7,
    body: { hood: 0, cabin: 0, cabinH: 0, beltH: 0.9, taper: 0, rearDrop: 0 },
  },
  sirocco: {
    id: 'sirocco', name: 'Sirocco', maker: 'Ostrava', cls: 'moto', moto: true,
    mass: 320, length: 2.15, width: 0.62, height: 1.42, clearance: 0.22, wheelbase: 1.46, track: 0.26, wheelRadius: 0.31, comH: 0.48,
    suspFreq: 2.4, suspDamp: 0.62, suspRest: 0.24, suspTravel: 0.15,
    drive: 'rwd', maxForce: 3300, power: 78000, topSpeed: 58, brakeForce: 4600, gripF: 1.35, gripR: 1.3, handbrakeGrip: 0.5,
    steerMax: 0.5, steerHigh: 0.075, drag: 0.2, rollInfluence: 0.0, seats: 1, colors: [0xd9482b, 0x2c3036, 0x7c8cff], traffic: 0.4,
    body: { hood: 0, cabin: 0, cabinH: 0, beltH: 0.85, taper: 0, rearDrop: 0 },
  },
};
export const VEHICLE_IDS = Object.keys(VEHICLES);
export const TRAFFIC_TYPES = VEHICLE_IDS.filter((id) => VEHICLES[id].traffic > 0);
