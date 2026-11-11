// "shared-protocol": versioned input commands, simulation events and loadout shape.
// In the local Practice build these are passed in-process; the same shapes would be serialized for a room server.
import type { Vec3 } from "./math";

export const PROTOCOL_VERSION = 1;
export const RULESET_VERSION = "tc-1.0";
export const SIM_HZ = 60;
export const SIM_DT = 1 / SIM_HZ;

/** One input frame. Edge-triggered buttons (reload, melee, ...) are set for exactly one tick. */
export interface InputCmd {
  seq: number;
  forward: number; // -1..1
  strafe: number; // -1..1 (right positive)
  yaw: number; // radians, absolute view yaw
  pitch: number; // radians, absolute view pitch (before recoil)
  fire: boolean;
  ads: boolean;
  sprint: boolean;
  crouch: boolean; // desired crouch state (client resolves toggle/hold)
  jump: boolean;
  reload: boolean;
  melee: boolean;
  lethal: boolean; // press: start cook / release: throw handled via lethalHeld
  lethalHeld: boolean;
  tactical: boolean;
  selectSlot: -1 | 0 | 1; // -1 none
  supportCycle: boolean;
  supportDeploy: boolean;
  interact: boolean;
  fireModeToggle: boolean;
}
export const emptyInput = (): InputCmd => ({
  seq: 0, forward: 0, strafe: 0, yaw: 0, pitch: 0, fire: false, ads: false, sprint: false, crouch: false,
  jump: false, reload: false, melee: false, lethal: false, lethalHeld: false, tactical: false, selectSlot: -1,
  supportCycle: false, supportDeploy: false, interact: false, fireModeToggle: false,
});

export type HitZone = "head" | "upper" | "lower" | "limb";
export type SurfaceTag = "concrete" | "metal" | "glass" | "dirt" | "wood" | "flesh" | "water";

export type SimEvent =
  | { t: "shot"; id: number; weapon: string; origin: Vec3; dir: Vec3; suppressed: boolean; hit?: Vec3; surface?: SurfaceTag; normal?: Vec3; tracer: boolean }
  | { t: "impact"; pos: Vec3; normal: Vec3; surface: SurfaceTag }
  | { t: "hit"; attacker: number; victim: number; zone: HitZone; damage: number; kill: boolean; weapon: string; pos: Vec3; armorLike?: boolean }
  | { t: "damaged"; victim: number; attacker: number; from: Vec3; damage: number; source: string }
  | { t: "kill"; attacker: number; victim: number; weapon: string; headshot: boolean; assists: number[]; distance: number; support?: boolean }
  | { t: "assist"; player: number; victim: number }
  | { t: "spawn"; id: number; pos: Vec3; reason: string }
  | { t: "reload"; id: number; stage: "start" | "magOut" | "magIn" | "end" | "cancel"; empty: boolean }
  | { t: "empty"; id: number }
  | { t: "swap"; id: number; slot: number }
  | { t: "melee"; id: number; hit: boolean }
  | { t: "jump"; id: number }
  | { t: "land"; id: number; hard: boolean }
  | { t: "mantle"; id: number }
  | { t: "step"; id: number; pos: Vec3; loud: number; surface: SurfaceTag }
  | { t: "throw"; id: number; kind: string; pos: Vec3 }
  | { t: "explode"; kind: string; pos: Vec3; radius: number; owner: number }
  | { t: "flash"; victim: number; intensity: number; owner: number }
  | { t: "smoke"; pos: Vec3; radius: number; duration: number }
  | { t: "dart"; pos: Vec3 }
  | { t: "glass"; id: number; pos: Vec3 }
  | { t: "momentum"; player: number; value: number; tier: number }
  | { t: "supportReady"; player: number; support: string }
  | { t: "supportUse"; player: number; support: string; pos: Vec3; team: number }
  | { t: "supportWarn"; support: string; team: number; pos: Vec3; seconds: number }
  | { t: "supportDestroyed"; support: string; by: number; pos: Vec3 }
  | { t: "score"; player: number; points: number; label: string }
  | { t: "teamScore"; team: number; score: number }
  | { t: "phase"; phase: string }
  | { t: "announce"; text: string }
  | { t: "medal"; player: number; text: string }
  | { t: "regen"; id: number };
