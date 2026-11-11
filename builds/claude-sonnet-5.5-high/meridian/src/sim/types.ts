import type { V2 } from '../core/math';

export interface InputFrame {
  moveX: number; moveY: number;        // strafe right+, forward+
  lookDX: number; lookDY: number;
  sprint: boolean; crouch: boolean; jump: boolean;
  interact: boolean;                   // E pressed
  exit: boolean;                       // F pressed (exit vehicle / melee on foot)
  fire: boolean; firePressed: boolean; aim: boolean;
  reload: boolean; throwItem: boolean; holster: boolean; swap: boolean;
  select: number;                      // -1 none, 0..4 slot
  cycle: number;                       // wheel +1/-1
  throttle: number; steer: number; handbrake: boolean; horn: boolean;
  camCycle: boolean; lookBack: boolean;
  heal: boolean;
}

export const emptyInput = (): InputFrame => ({
  moveX: 0, moveY: 0, lookDX: 0, lookDY: 0, sprint: false, crouch: false, jump: false, interact: false, exit: false,
  fire: false, firePressed: false, aim: false, reload: false, throwItem: false, holster: false, swap: false, select: -1, cycle: 0,
  throttle: 0, steer: 0, handbrake: false, horn: false, camCycle: false, lookBack: false, heal: false,
});

export type HumanKind = 'player' | 'ped' | 'police' | 'guard' | 'rival';
export type PedState =
  | 'Spawn' | 'WalkRoute' | 'WaitSignal' | 'CrossStreet' | 'Browse' | 'Talk' | 'Work' | 'ReactCurious' | 'Panic' | 'Flee'
  | 'Hide' | 'CallEmergency' | 'AssistInjured' | 'Despawn' | 'Down' | 'Dead' | 'Chase' | 'Arrest' | 'Shoot' | 'Guard' | 'Search' | 'Cuffed' | 'Idle';

export interface Human {
  id: number;
  kind: HumanKind;
  role: string;
  x: number; z: number; y: number; vy: number;
  vx: number; vz: number;
  heading: number;
  hp: number; maxHp: number; armor: number;
  alive: boolean;
  /** Knocked out by non-lethal means until this time (sim seconds). */
  koUntil: number;
  state: PedState;
  stateT: number;
  variant: number;
  outfit: number;
  anim: number;            // walk phase
  speed: number;
  crouch: boolean;
  swimming: boolean;
  vehicleId: number | null;
  // ai
  fear: number;
  courage: number;
  hasPhone: boolean;
  reportT: number;         // >0 while placing an emergency call
  reportEvidence: number;  // evidence id being reported
  path: number[];
  pathI: number;
  nodeFrom: number;
  nodeTo: number;
  waitUntil: number;
  target: V2 | null;
  threat: V2 | null;
  talkWith: number;
  bark: string;
  barkT: number;
  weapon: string;
  fireCd: number;
  nextThink: number;
  seenPlayerT: number;
  tag?: string;
  harmed: boolean;
  cuffT: number;
}

export type CrimeType = 'vehicle-theft' | 'assault' | 'weapon-display' | 'gunfire' | 'trespass' | 'property-damage' | 'collision-injury' | 'attack-police';

export interface Evidence {
  id: number;
  type: CrimeType;
  severity: number;
  time: number;
  x: number; z: number;
  suspectOutfit: number;
  vehicleId: number | null;
  plate: string | null;
  witnesses: number[];
  camera: number | null;
  confidence: number;
  status: 'pending' | 'reported' | 'void' | 'observed';
}

export type IdentState = 'Unnoticed' | 'Witness Reporting' | 'Identified' | 'Pursuit' | 'Search' | 'Cooling';

export interface Inventory {
  sidearm: string;
  longGun: string | null;
  melee: string;
  gadgets: [string | null, string | null];
  ammo: Record<string, number>;   // reserve by ammo category
  mags: Record<string, number>;   // loaded rounds per weapon
  gadgetCount: Record<string, number>;
  medkits: number;
  armorPlates: number;
  owned: string[];
}

export interface PlayerState {
  human: Human;
  inv: Inventory;
  cash: number;
  trust: number;           // 0..5 level
  trustXp: number;
  stamina: number;
  camYaw: number; camPitch: number;
  shoulder: 1 | -1;
  slot: number;            // equipped slot 0 melee 1 sidearm 2 long
  holstered: boolean;
  aiming: boolean;
  reloadT: number;
  fireCd: number;
  spread: number;
  lastDamageT: number;
  vaultT: number;
  vaultFrom: V2 | null; vaultTo: V2 | null; vaultY: number;
  enterT: number;
  enterTarget: number | null;
  exitCool: number;
  swimT: number;
  steerIn: number; throttleIn: number;
  ownedVehicles: number[]; // vehicle ids in garage slots
  discovered: string[];
  outfit: number;
  stats: { civilianHarm: number; crimes: number; distance: number; kills: number };
  aimPoint: { x: number; y: number; z: number; hitKind: string };
}
