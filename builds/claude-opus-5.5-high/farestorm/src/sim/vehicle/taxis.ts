// Taxi tuning sheets. Versioned with the rules so records/ghosts stay comparable.

export interface TaxiSpec {
  id: "gull" | "breaker" | "tempest";
  name: string;
  tagline: string;
  mass: number; // kg
  length: number;
  width: number;
  height: number;
  wheelbase: number;
  top: number; // m/s
  accel: number; // m/s^2 at standstill
  brake: number; // m/s^2
  reverseTop: number;
  steerLow: number; // rad at low speed
  steerHigh: number; // rad at high speed
  steerLat: number; // lateral accel limit used by steering (m/s^2)
  gripLat: number; // tire lateral grip (m/s^2)
  driftLat: number; // lateral grip while drifting
  driftYaw: number; // base yaw rate held in a drift (rad/s)
  driftSteerYaw: number; // extra yaw from steering in a drift
  yawResp: number; // yaw-rate response (1/s)
  shove: number; // traffic shove multiplier
  colors: { body: string; trim: string; accent: string };
}

export const TAXIS: TaxiSpec[] = [
  {
    id: "gull", name: "Gull Compact", tagline: "Agile and eager. Easy drifts, lighter shove.",
    mass: 1050, length: 4.1, width: 1.85, height: 1.5, wheelbase: 2.5,
    top: 44, accel: 6.5, brake: 17, reverseTop: 12,
    steerLow: 0.66, steerHigh: 0.2, steerLat: 21.5, gripLat: 24, driftLat: 3.2, driftYaw: 1.05, driftSteerYaw: 0.75, yawResp: 13,
    shove: 0.8, colors: { body: "#ff6b5a", trim: "#fff1dc", accent: "#1d2b44" },
  },
  {
    id: "breaker", name: "Breaker Sedan", tagline: "The balanced storm cab. Predictable, quick, forgiving.",
    mass: 1400, length: 4.6, width: 1.92, height: 1.48, wheelbase: 2.75,
    top: 47.5, accel: 6.0, brake: 16, reverseTop: 12,
    steerLow: 0.6, steerHigh: 0.18, steerLat: 19.8, gripLat: 22.5, driftLat: 3.8, driftYaw: 0.95, driftSteerYaw: 0.65, yawResp: 11,
    shove: 1.0, colors: { body: "#18b3a6", trim: "#fff4e0", accent: "#ff7a3d" },
  },
  {
    id: "tempest", name: "Tempest Wagon", tagline: "Heavy, stable, unstoppable in traffic. Slower to rotate.",
    mass: 1900, length: 5.0, width: 2.0, height: 1.62, wheelbase: 3.0,
    top: 50.5, accel: 5.35, brake: 15, reverseTop: 11,
    steerLow: 0.55, steerHigh: 0.16, steerLat: 18.2, gripLat: 21, driftLat: 4.6, driftYaw: 0.82, driftSteerYaw: 0.55, yawResp: 8.5,
    shove: 1.45, colors: { body: "#2f5fe0", trim: "#ffe9cf", accent: "#ff9f1c" },
  },
];

export function taxiById(id: string): TaxiSpec {
  return TAXIS.find((t) => t.id === id) ?? TAXIS[1];
}

export interface SurfaceSpec {
  grip: number;
  drag: number; // extra decel m/s^2
  topMul: number;
  rumble: number; // camera/audio rumble
}

export const SURFACES: Record<string, SurfaceSpec> = {
  asphalt: { grip: 1, drag: 0, topMul: 1, rumble: 0 },
  pavement: { grip: 0.97, drag: 0.1, topMul: 1, rumble: 0.05 },
  wet: { grip: 0.8, drag: 0, topMul: 1, rumble: 0 },
  cobble: { grip: 0.9, drag: 0.35, topMul: 0.95, rumble: 0.5 },
  grass: { grip: 0.74, drag: 1.4, topMul: 0.82, rumble: 0.35 },
  sand: { grip: 0.64, drag: 2.6, topMul: 0.66, rumble: 0.4 },
  metal: { grip: 0.92, drag: 0, topMul: 1, rumble: 0.25 },
  water: { grip: 0.55, drag: 5, topMul: 0.45, rumble: 0.3 },
};
