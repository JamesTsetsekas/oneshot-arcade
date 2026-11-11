// Taxi tuning sheets. Versioned with the rules so local records stay comparable.
export const TAXI_RULES_VERSION = 2;

export type TaxiId = 'gull' | 'breaker' | 'tempest';

export interface TaxiSpec {
  id: TaxiId;
  name: string;
  blurb: string;
  mass: number; // kg
  half: { x: number; y: number; z: number }; // chassis half extents
  wheelBase: number;
  track: number;
  wheelRadius: number;
  accel: number; // launch acceleration m/s^2
  topSpeed: number; // m/s
  brake: number; // m/s^2
  gripFront: number; // lateral friction coefficient
  gripRear: number;
  steerMax: number; // rad at low speed
  steerRate: number; // rad/s
  driftGrip: number; // rear grip multiplier while sliding (lower = looser)
  driftYaw: number; // yaw assist rad/s^2 while drifting
  snapKick: number; // yaw rate kick on Snap Drift rad/s
  yawInertia: number; // multiplier on box yaw inertia (higher = slower rotation)
  body: [number, number, number]; // primary paint
  accent: [number, number, number];
}

export const TAXIS: Record<TaxiId, TaxiSpec> = {
  gull: {
    id: 'gull', name: 'Gull Compact',
    blurb: 'Featherweight and eager. Snaps into drifts, gets bullied by buses.',
    mass: 1040, half: { x: 0.84, y: 0.4, z: 1.82 }, wheelBase: 2.35, track: 1.5, wheelRadius: 0.33,
    accel: 6.8, topSpeed: 45.4, brake: 17, gripFront: 1.78, gripRear: 1.7, steerMax: 0.62, steerRate: 3.4,
    driftGrip: 0.6, driftYaw: 2.9, snapKick: 1.35, yawInertia: 1.0,
    body: [0.12, 0.74, 0.7], accent: [1.0, 0.96, 0.86],
  },
  breaker: {
    id: 'breaker', name: 'Breaker Sedan',
    blurb: 'The Galeport standard. Balanced grip, honest drifts, no surprises.',
    mass: 1340, half: { x: 0.9, y: 0.42, z: 2.12 }, wheelBase: 2.72, track: 1.58, wheelRadius: 0.35,
    accel: 6.1, topSpeed: 48.6, brake: 16, gripFront: 1.72, gripRear: 1.76, steerMax: 0.58, steerRate: 3.0,
    driftGrip: 0.68, driftYaw: 2.3, snapKick: 1.15, yawInertia: 1.2,
    body: [1.0, 0.36, 0.3], accent: [1.0, 0.95, 0.84],
  },
  tempest: {
    id: 'tempest', name: 'Tempest Wagon',
    blurb: 'A heavy long-roof that shoves traffic aside and tops out fastest.',
    mass: 1880, half: { x: 0.96, y: 0.46, z: 2.34 }, wheelBase: 2.98, track: 1.66, wheelRadius: 0.37,
    accel: 5.4, topSpeed: 51.8, brake: 14.5, gripFront: 1.66, gripRear: 1.84, steerMax: 0.54, steerRate: 2.5,
    driftGrip: 0.78, driftYaw: 1.8, snapKick: 0.95, yawInertia: 1.5,
    body: [0.42, 0.3, 0.86], accent: [1.0, 0.78, 0.25],
  },
};
export const TAXI_ORDER: TaxiId[] = ['gull', 'breaker', 'tempest'];
