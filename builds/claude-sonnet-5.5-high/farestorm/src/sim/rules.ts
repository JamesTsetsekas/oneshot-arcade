/** Versioned, centralised gameplay constants. Score logic reads only from here. */
export const RULES_VERSION = '1.0.0';
export const STEP = 1 / 60;

export const RULES = {
  shiftStart: 60,
  quickShiftLength: 300,
  endGrace: 2,
  boardingPause: 1.0,
  maxDeliveryAward: 40,

  pickup: { enterSpeedKmh: 35, stopSpeedKmh: 5, radius: 3.5, ringVisual: 5.0, cleanRadius: 1.8, roughPatiencePenalty: 3 },
  delivery: { stopSpeedKmh: 8, radius: 8.5, cleanRadius: 3.2 },

  // trip planning
  par: { perMeter: 1 / 17, base: 5, min: 20, max: 80 },
  tierPar: { short: 35, medium: 55 },
  patienceFactor: 1.25,
  fareBase: { short: 160, medium: 260, long: 380 } as Record<string, number>,
  farePerMeter: 0.8,
  timeBonusMax: 320,

  // grades (fraction of patience left)
  grade: { blazing: 0.25, fast: 0.1, close: 0.0 },
  // shift seconds awarded = par*factor + tier bonus
  gradeTimeFactor: { blazing: 1.1, fast: 0.88, close: 0.68, late: 0.42 } as Record<string, number>,
  tierTimeBonus: { short: 1, medium: 2, long: 3 } as Record<string, number>,

  // Pulse
  pulse: { decay: 3.5, tiers: [0, 3, 7, 14], mults: [1, 2, 3, 5], sameCategoryFalloff: 0.7, minFalloff: 0.25 },
  tailwind: { duration: 2.2, speedMul: 1.22, accelMul: 1.8, chargePerPoint: 1 / 1800, tokenCharge: 0.3 },

  style: {
    nearMiss: 60,
    nearMissSpeedKmh: 50,
    nearMissDist: 3.6,
    nearMissCooldown: 4,
    needle: 140,
    needleWindow: 0.7,
    driftPerSecond: 70,
    driftMinSpeedKmh: 35,
    driftMinAngleDeg: 12,
    driftMinDuration: 0.6,
    airtimeMin: 0.35,
    airtimeBase: 90,
    airtimePerSecond: 110,
    oncomingPerSecond: 60,
    oncomingMinSpeedKmh: 70,
    shortcut: 150,
    shortcutFirst: 400,
    cleanSector: 220,
    cleanSectorSeconds: 10,
    cleanSectorSpeedKmh: 60,
    precisionStop: 250,
    gripTurn: 90,
    surge: 60,
    pickupClean: 250,
  },
  collision: { minorSpeed: 4, hardSpeed: 16, chainLoss: 0.5 },
  penalties: { reset: 3, resetPoints: 150, water: 4, pedestrian: 120 },
  rank: { S: 9000, A: 6000, B: 3500, C: 1800 },
  trialMedals: { gold: 150, silver: 190, bronze: 240 },
} as const;

export type Tier = 'short' | 'medium' | 'long';
export type Grade = 'blazing' | 'fast' | 'close' | 'late' | 'failed';
export type StyleCategory =
  | 'nearMiss'
  | 'needle'
  | 'drift'
  | 'air'
  | 'oncoming'
  | 'shortcut'
  | 'clean'
  | 'precision'
  | 'tech';
