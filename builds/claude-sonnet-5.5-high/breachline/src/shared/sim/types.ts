import type { Vec3 } from "../math";
import type { Loadout, WeaponStats } from "../content/loadout";
import type { InputCmd, SurfaceTag } from "../protocol";

export type Difficulty = "easy" | "normal" | "hard";

export interface MatchConfig {
  scoreLimit: number;
  timeLimit: number; // seconds
  warmup: number;
  difficulty: Difficulty;
  seed: number;
  suddenDeathSeconds: number;
  suddenDeathBonus: number;
  respawnDelay: number;
  botsOnly?: boolean; // headless simulation: every seat is a bot
  teamSize: number;
}

export const DEFAULT_CONFIG: MatchConfig = {
  scoreLimit: 75, timeLimit: 480, warmup: 8, difficulty: "normal", seed: 1337, suddenDeathSeconds: 60, suddenDeathBonus: 5,
  respawnDelay: 3, teamSize: 6,
};

export interface WeaponState {
  id: string;
  stats: WeaponStats;
  ammo: number;
  reserve: number;
  nextFireAt: number;
  reloadT: number; // seconds into reload, -1 when not reloading
  reloadTotal: number;
  reloadEmpty: boolean;
  reloadStage: number; // 0 start, 1 magOut fired, 2 magIn fired
  shellT: number;
  shotIndex: number;
  lastShotAt: number;
  bloom: number;
  cycling: number; // bolt/pump cycling time remaining
  shotsFired: number;
  shotsHit: number;
  kills: number;
  headshots: number;
}

export interface DamageEntry { t: number; attacker: number; amount: number; zone: string; weapon: string; from: Vec3; support: boolean }

export interface RecapInfo {
  attacker: number; // -1 environment
  attackerName: string;
  attackerTeam: number;
  weapon: string;
  weaponClass: string;
  distance: number;
  headshot: boolean;
  timeline: Array<{ ago: number; amount: number; zone: string }>;
  fromYaw: number; // world yaw from victim towards attacker
  support: string;
  killerPos: Vec3;
  killerAimYaw: number;
  killerAimPitch: number;
}

export interface PlayerStats {
  kills: number; deaths: number; assists: number; score: number; headshots: number; supportKills: number;
  shots: number; hits: number; bestMomentum: number; damage: number; supportDestroyed: number; streak: number; bestStreak: number;
  medals: number;
}

export interface PlayerState {
  id: number;
  name: string;
  team: 0 | 1;
  isBot: boolean;
  loadout: Loadout;
  perks: string[];
  alive: boolean;
  pos: Vec3;
  prevPos: Vec3;
  vel: Vec3;
  yaw: number;
  pitch: number;
  prevYaw: number;
  prevPitch: number;
  recoilP: number; // radians
  recoilY: number;
  onGround: boolean;
  crouching: boolean;
  crouchT: number;
  sprinting: boolean;
  sprintHold: number;
  sprintOutT: number;
  adsT: number;
  health: number;
  lastDamageAt: number;
  regenCarry: number;
  weapons: [WeaponState, WeaponState];
  slot: 0 | 1;
  swapT: number;
  swapTotal: number;
  mantle: null | { t: number; dur: number; start: Vec3; end: Vec3 };
  meleeT: number; // >0 while winding up
  meleeCd: number;
  meleePending: boolean;
  equip: { lethal: number; tactical: number; lethalCharge: number; tacticalCharge: number };
  cooking: null | { since: number; kind: string };
  momentum: number;
  supportReady: [boolean, boolean, boolean];
  supportSelected: number; // 0..2 or -1
  supportUsed: [boolean, boolean, boolean];
  stats: PlayerStats;
  weaponStats: Record<string, { shots: number; hits: number; kills: number; headshots: number }>;
  damageLog: DamageEntry[];
  spawnProtectedUntil: number;
  spawnPos: Vec3;
  respawnAt: number;
  deadAt: number;
  recap: RecapInfo | null;
  flashedUntil: number;
  flashPower: number;
  revealedUntil: [number, number]; // visible to team 0 / team 1 radar via scans
  cmd: InputCmd;
  prevFire: boolean;
  prevLethalHeld: boolean;
  stepDist: number;
  lastMoveSpeed: number;
  lastFootstepLoud: number;
  lastShotNoiseAt: number;
  lastShotSuppressed: boolean;
  spawnedAt: number;
  hitConfirmUntil: number;
  lastSeenBy: number;
  footprints: Array<{ x: number; z: number; t: number }>;
  killedBy: number;
  kdSeed: number;
}

export interface Projectile {
  id: number;
  kind: "frag" | "adhesive" | "mine" | "flash" | "obscurant" | "dart";
  owner: number;
  team: 0 | 1;
  pos: Vec3;
  vel: Vec3;
  born: number;
  fuseAt: number; // detonate time (not for mines until armed+triggered)
  stuck: boolean;
  stuckTo: number; // player id or -1
  stuckOffset: Vec3;
  normal: Vec3;
  armAt: number;
  alive: boolean;
  pulses: number;
  nextPulse: number;
  rolling: boolean;
}

export type DeployKind = "pod" | "drone";
export interface Deployable {
  id: number;
  kind: DeployKind;
  team: 0 | 1;
  owner: number;
  pos: Vec3;
  hp: number;
  until: number;
  born: number;
  lastUse: Record<number, number>;
  phase: number;
}

export interface SupportEvent {
  id: number;
  kind: "mortar" | "flight" | "recon";
  team: 0 | 1;
  owner: number;
  pos: Vec3;
  dir: Vec3;
  t0: number;
  shells: Array<{ at: number; pos: Vec3; done: boolean }>;
  until: number;
  pulses?: number[];
}

export interface MatchState {
  phase: "warmup" | "live" | "sudden" | "ended";
  clock: number; // seconds elapsed in live phase
  phaseT: number; // seconds into phase
  teamScore: [number, number];
  winner: -1 | 0 | 1 | 2; // 2 = draw
  suddenTarget: number;
  endReason: string;
  endedAt: number;
}

export interface SurfaceInfo { tag: SurfaceTag }
