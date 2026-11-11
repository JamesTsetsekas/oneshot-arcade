import type { Vec2 } from "../core/math";
import type { DamageType, EnemyAttackDef, EnemyDef, SkillDef } from "../data/types";
import type { Item } from "../items/item";
import type { PotionKind } from "../data/items";

export const TICK_HZ = 30;
export const DT = 1 / TICK_HZ;

export type Team = 0 | 1;

export interface Status { id: string; t: number; dur: number; mag: number; stacks: number; src: number; tick: number }

export type AnimState = "idle" | "move" | "windup" | "attack" | "recover" | "evade" | "hit" | "stun" | "dead" | "channel" | "cast";

export interface ActorBase {
  id: number;
  team: Team;
  x: number; y: number; px: number; py: number;
  facing: number;
  radius: number;
  hp: number; maxHp: number;
  alive: boolean;
  statuses: Record<string, Status>;
  anim: AnimState; animT: number;
  flash: number; hitstop: number;
  deadT: number;
}

export type AIState = "dormant" | "investigate" | "approach" | "reposition" | "telegraph" | "execute" | "recover" | "flee" | "dead";

export interface BossState {
  kind: "tollkeeper" | "engine";
  phase: number;
  t: number; // fight time
  nextAt: number;
  last: string[];
  armor: number; armorMax: number; armorRegenT: number;
  stagger: number; staggerMax: number; staggeredT: number;
  enraged: boolean;
  beams: { angle: number; speed: number; active: boolean; warmT: number; offT: number }[];
  beamCycleT: number;
  summonT: number;
  quadT: number;
  overloadT: number;
  invulnerable: boolean;
  conduits: number[];
  stomp: number;
  active: boolean;
  homeX: number; homeY: number;
}

export interface Enemy extends ActorBase {
  kind: "enemy";
  def: EnemyDef;
  name: string;
  level: number;
  elite: string[];
  isElite: boolean;
  isBoss: boolean;
  guardian: boolean;
  packId: number;
  ai: AIState;
  aiT: number;
  aware: boolean;
  lastKnown: Vec2 | null;
  lostT: number;
  path: Vec2[] | null;
  pathT: number;
  attack: EnemyAttackDef | null;
  atkAngle: number; atkX: number; atkY: number;
  telegraphId: number;
  cds: Record<string, number>;
  speed: number;
  armor: number;
  res: Record<DamageType, number>;
  dmg: number;
  xp: number;
  heavy: boolean;
  slotted: boolean;
  home: Vec2;
  modT: Record<string, number>;
  split: boolean;
  training: boolean;
  summoned: boolean;
  boss?: BossState;
  role: "normal" | "conduit" | "repair" | "lantern";
  lunge?: { t: number; dur: number; fx: number; fy: number; tx: number; ty: number; hit: boolean };
  pull?: { t: number; dur: number; fx: number; fy: number; tx: number; ty: number };
  dmgTaken: number;
  perceiveT: number;
  sees: boolean;
  fleeT: number;
  strafe: number;
  dummyRegenT: number;
}

export type PlayerAction =
  | { kind: "skill"; skill: SkillDef; t: number; total: number; impactAt: number; cancelAt: number; impactDone: boolean; targetId: number | null; tx: number; ty: number; angle: number; rank: number; combo: number; basic: boolean }
  | { kind: "evade"; t: number; dur: number; fx: number; fy: number; tx: number; ty: number }
  | { kind: "dash"; t: number; dur: number; fx: number; fy: number; tx: number; ty: number; skill: SkillDef; rank: number; hit: Set<number> }
  | { kind: "channel"; t: number; dur: number }
  | { kind: "leap"; t: number; dur: number; fx: number; fy: number; tx: number; ty: number };

export interface Player extends ActorBase {
  kind: "player";
  focus: number; maxFocus: number;
  heat: number;
  marksMax: number;
  evadeCharges: number; evadeT: number;
  action: PlayerAction | null;
  path: Vec2[] | null;
  moveTarget: Vec2 | null;
  attackTarget: number | null;
  pendingInteract: number | null; // interactable id or -pickupId
  combo: number; comboT: number;
  movedSinceShot: number;
  stillT: number;
  cds: Record<string, number>;
  charges: Record<string, { n: number; t: number }>;
  potionCd: number;
  hot: { t: number; perSec: number } | null;
  furnace: boolean;
  lastHitT: number;
  basicCount: number;
  lastDamage: { source: string; type: DamageType; amount: number } | null;
  pulled?: { t: number; dur: number; fx: number; fy: number; tx: number; ty: number };
  relicCd: number;
  standing: boolean;
}

export interface Projectile {
  id: number;
  team: Team;
  x: number; y: number; px: number; py: number;
  vx: number; vy: number;
  radius: number;
  life: number;
  kind: "arrow" | "ghost" | "bolt" | "orb" | "hook" | "chain" | "wave" | "splinter";
  pierce: number;
  hit: number[];
  source: number;
  skill?: string;
  rank?: number;
  coeff: number;
  dmgType: DamageType;
  dmg: number; // for enemy projectiles: flat damage
  empowered?: boolean;
  mark?: boolean;
  reflected?: boolean;
}

export interface GroundZone {
  id: number;
  team: Team;
  kind: "fire" | "blight_cloud" | "blight_pool" | "trap" | "standard" | "ring" | "rain" | "quadrant" | "pulse" | "eruption" | "ember_trail" | "overload" | "brazier" | "spawn";
  x: number; y: number;
  r: number;
  angle: number;
  len: number;
  width: number;
  t: number;
  dur: number;
  arm: number;
  tickT: number;
  dps: number;
  dmgType: DamageType;
  source: number;
  data: Record<string, any>;
  triggered: boolean;
}

export interface Telegraph {
  id: number;
  shape: "circle" | "cone" | "line" | "ring" | "donut" | "quadrant";
  x: number; y: number;
  angle: number;
  r: number; r2: number;
  arc: number;
  len: number; width: number;
  t: number; dur: number;
  type: DamageType | "player";
  owner: number;
  follow?: boolean;
  tag?: string;
  warm?: boolean;
}

export interface Pickup {
  id: number;
  kind: "gold" | "item" | "potion" | "dust" | "globe" | "echo";
  x: number; y: number;
  amount: number;
  item?: Item;
  potion?: PotionKind;
  t: number;
}

export interface InteractRT {
  id: number;
  kind: string;
  x: number; y: number;
  name: string;
  data: Record<string, any>;
  open: boolean;
  hidden: boolean;
  fuse: number;
}

export interface HazardRT { id: number; kind: "spikes" | "vent"; x: number; y: number; rot: number; period: number; offset: number; state: "idle" | "warn" | "active"; t: number }

export type GameEvent =
  | { t: "hit"; x: number; y: number; amount: number; crit: boolean; type: DamageType; toPlayer: boolean; blocked?: boolean; evaded?: boolean; target: number; heavy?: boolean }
  | { t: "death"; id: number; x: number; y: number; enemy: string; boss: boolean; elite: boolean }
  | { t: "vfx"; kind: string; x: number; y: number; angle?: number; r?: number; type?: DamageType | "player" | "gold" | "heal"; x2?: number; y2?: number }
  | { t: "sfx"; id: string; x?: number; y?: number; vol?: number }
  | { t: "toast"; text: string; kind?: "info" | "warn" | "quest" | "loot" | "level" }
  | { t: "levelup"; level: number }
  | { t: "loot"; rarity: string; name: string }
  | { t: "zone"; id: string; name: string }
  | { t: "shake"; amp: number; dur: number; src: string }
  | { t: "invalid"; x: number; y: number }
  | { t: "panel"; panel: string; data?: any }
  | { t: "playerDeath"; cause: string; type: DamageType }
  | { t: "actComplete" }
  | { t: "bossPhase"; name: string; phase: number }
  | { t: "subtitle"; who: string; text: string }
  | { t: "save" };
