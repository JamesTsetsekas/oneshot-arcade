// Skill School: 10 compact lessons with spawn points and objective counters.

export type LessonGoal =
  | { kind: "speed"; kmh: number }
  | { kind: "stopInBox"; x: number; z: number; r: number; minKmh: number }
  | { kind: "event"; event: "surge" | "gripTurn" | "nearMiss"; count: number }
  | { kind: "drift"; seconds: number }
  | { kind: "air"; seconds: number }
  | { kind: "shortcut"; id: string }
  | { kind: "precision"; x: number; z: number; r: number }
  | { kind: "fare" };

export interface Lesson {
  id: number;
  name: string;
  brief: string;
  how: string;
  spawn: { x: number; z: number; yaw: number };
  goal: LessonGoal;
}

const E = Math.PI / 2;

export const LESSONS: Lesson[] = [
  { id: 0, name: "Acceleration", brief: "Hit 100 km/h on the Coast Boulevard.", how: "Hold W (or RT). Keep it straight.", spawn: { x: -630, z: -342, yaw: E }, goal: { kind: "speed", kmh: 100 } },
  { id: 1, name: "Braking", brief: "Reach 60 km/h, then stop inside the glowing box.", how: "S (or LT) brakes hard. Ease off to stop on the mark.", spawn: { x: -630, z: -342, yaw: E }, goal: { kind: "stopInBox", x: -400, z: -342, r: 4.5, minKmh: 60 } },
  { id: 2, name: "Surge Start", brief: "Launch with a Surge Start.", how: "Stopped: hold S, release, then tap W within 0.22 s.", spawn: { x: -630, z: -342, yaw: E }, goal: { kind: "event", event: "surge", count: 1 } },
  { id: 3, name: "Snap Drift", brief: "Hold one drift for 1.5 seconds.", how: "Above 35 km/h steer hard and tap Space. Keep throttle and steer to hold it; countersteer to exit.", spawn: { x: -630, z: -342, yaw: E }, goal: { kind: "drift", seconds: 1.5 } },
  { id: 4, name: "Grip Turn", brief: "Tighten a drift with a Grip Turn.", how: "While drifting: tap S, then tap W.", spawn: { x: -630, z: -342, yaw: E }, goal: { kind: "event", event: "gripTurn", count: 1 } },
  { id: 5, name: "Close Shaves", brief: "Pass 3 cars closely above 50 km/h.", how: "Skim past traffic without touching. Rush Lanes (red chevrons) score oncoming too.", spawn: { x: 622.1, z: -300, yaw: 0 }, goal: { kind: "event", event: "nearMiss", count: 3 } },
  { id: 6, name: "Airtime", brief: "Fly for 0.8 seconds off the Seawall Kicker.", how: "Follow the arrow east along the quay at full speed. Small bumps don't count.", spawn: { x: 64, z: -407, yaw: E }, goal: { kind: "air", seconds: 0.8 } },
  { id: 7, name: "Shortcuts", brief: "Run the Museum Lawn shortcut.", how: "Shortcuts have coloured gate arches. Enter one gate and leave by the other.", spawn: { x: -150, z: -102.1, yaw: E }, goal: { kind: "shortcut", id: "lawn" } },
  { id: 8, name: "Pinpoint Stop", brief: "Stop dead-centre in the ring.", how: "Stop with the taxi's centre inside the inner circle (1.5 m).", spawn: { x: -630, z: -342, yaw: E }, goal: { kind: "precision", x: -520, z: -342, r: 1.5 } },
  { id: 9, name: "Full Fare", brief: "Pick up a passenger and deliver them.", how: "Stop in the pickup ring, follow the arrow, stop in the destination ring.", spawn: { x: 0, z: 0, yaw: 0 }, goal: { kind: "fare" } },
];
