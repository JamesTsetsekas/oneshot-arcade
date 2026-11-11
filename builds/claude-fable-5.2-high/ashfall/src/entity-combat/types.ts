import type { Vec } from '../core/math';

export const TICK_HZ = 30;
export const DT = 1 / TICK_HZ;
export const CELL = 2;

export type DamageType = 'physical' | 'ember' | 'frost' | 'blight';
export type ClassId = 'cinder' | 'ranger';
export type Stats = Record<string, number>;
export type EquipSlot = 'main' | 'off' | 'head' | 'chest' | 'gloves' | 'boots' | 'belt' | 'amulet' | 'ring1' | 'ring2';
export const EQUIP_SLOTS: EquipSlot[] = ['main', 'off', 'head', 'chest', 'gloves', 'boots', 'belt', 'amulet', 'ring1', 'ring2'];

export type StatusId = 'burn' | 'blight' | 'chill' | 'root' | 'stun' | 'guard' | 'cloak' | 'trace' | 'furnace'
  | 'standard' | 'tonic' | 'rally' | 'ward' | 'shell' | 'expose' | 'haste' | 'cleansed' | 'taunt' | 'burrow';
export interface Status { id: StatusId; t: number; power: number; stacks: number; src: number }

export interface RolledAffix { id: string; tier: number; value: number }
export interface Item {
  id: string; kind: 'gear' | 'glyph'; base: string; rarity: 0 | 1 | 2 | 3; ilvl: number;
  affixes: RolledAffix[]; relic?: string; identified: boolean; sockets: number; glyphs: string[];
  dur: number; fav?: boolean; rerolls: number; x: number; y: number;
}
export interface Loadout { name: string; ranks: Record<string, number>; hotbar: (string | null)[] }
export interface Hero {
  id: string; name: string; cls: ClassId; look: number; level: number; xp: number;
  attrs: { might: number; finesse: number; will: number; vigor: number }; attrPoints: number; skillPoints: number;
  ranks: Record<string, number>; hotbar: (string | null)[];
  equip: Partial<Record<EquipSlot, Item>>; inv: Item[]; stash: Item[];
  gold: number; dust: number; belt: number[]; beltCap: number;
  quest: number; flags: Record<string, boolean>; waypoints: string[];
  difficulty: number; maxDifficulty: number; runSeed: number; runs: number;
  relicPity: number; echo: { zone: string; x: number; y: number; gold: number } | null; blessing: number;
  loadouts: (Loadout | null)[]; vendorSeed: number;
  stats: { kills: number; deaths: number; playTime: number; runTime: number; bestHunt: Record<string, number>; lastDeath: string; damageDealt: number; elites: number };
  zone: string; createdAt: number;
}

export interface AiState {
  state: 'dormant' | 'investigate' | 'approach' | 'reposition' | 'telegraph' | 'execute' | 'recover' | 'flee' | 'dead';
  t: number; atk: number; cds: number[]; homeX: number; homeY: number; lastX: number; lastY: number;
  path: Vec[]; repath: number; slot: number; strafe: number; aimX: number; aimY: number; areaId: number;
  modT: number[]; think: number; lungeT: number; wardId: number;
}
export interface BossState {
  phase: number; t: number; next: number; last: string; armor: number; maxArmor: number; armorBroken: number;
  stagger: number; staggered: number; enrage: boolean; elapsed: number; beamAng: number; beamDir: number; beams: number[];
  cast: number; castMax: number; castNeed: number; castDmg: number; summonT: number; quadT: number; boltT: number;
  conduits: number[]; started: boolean; busy: number;
}
export interface Actor {
  id: number; kind: 'player' | 'enemy' | 'npc' | 'dummy' | 'prop' | 'ward' | 'standard' | 'conduit'; def: string; name: string;
  x: number; y: number; px: number; py: number; facing: number; r: number;
  hp: number; maxHp: number; team: 0 | 1 | 2; dead: boolean; deadT: number; lvl: number;
  statuses: Status[]; kx: number; ky: number;
  anim: string; animT: number; animDur: number;
  dmg: number; speed: number; armor: number; res: Partial<Record<DamageType, number>>;
  mods: string[]; elite: boolean; boss: boolean; heavy: boolean; pack: number;
  ai?: AiState; bs?: BossState; untargetable?: boolean; invuln?: boolean; owner?: number; life?: number;
  noXp?: boolean; dmgTaken?: number;
}
export interface Src { id: number; name: string; team: number; coef?: number; skill?: string; dmg?: number; crit?: boolean; tags?: string[] }
export interface Area {
  id: number; shape: 'circle' | 'cone' | 'rect'; x: number; y: number; dir: number; r: number; angle: number; len: number; width: number;
  delay: number; t: number; dur: number; tick: number; nextTick: number; src: Src; dtype: DamageType;
  status?: { id: StatusId; t: number; power: number }; hitAll?: boolean; knock?: number; follow?: number; cancelOnOwner?: boolean;
  tag?: string; fx?: string; done?: boolean; heavy?: boolean; hitIds?: number[]; silent?: boolean; vx?: number; vy?: number; trig?: number; melee?: boolean; fired?: boolean;
}
export interface Projectile {
  id: number; x: number; y: number; px: number; py: number; vx: number; vy: number; r: number; ttl: number;
  src: Src; dtype: DamageType; pierce: number; hit: number[]; kind: string; special?: string; done?: boolean;
}
export interface Pickup { id: number; x: number; y: number; kind: 'gold' | 'dust' | 'potion' | 'item' | 'globe' | 'echo'; amount: number; potion?: number; item?: Item; t: number }
export interface Interactable {
  id: number; x: number; y: number;
  type: 'waypoint' | 'exit' | 'npc' | 'chest' | 'lever' | 'door' | 'shrine' | 'cage' | 'stash' | 'portal' | 'trap' | 'landmark';
  label: string; state: number; to?: string; npc?: string; cells?: number[]; key?: string; t?: number;
}
export interface Prop { type: string; x: number; y: number; rot: number; scale: number }
export interface Zone {
  id: string; name: string; kind: 'town' | 'wild' | 'crypt'; level: number; w: number; h: number; seed: number;
  cells: Uint8Array; discovered: Uint8Array; props: Prop[];
  actors: Actor[]; projectiles: Projectile[]; areas: Area[]; pickups: Pickup[]; inter: Interactable[];
  entries: Record<string, Vec>; time: number; safe: boolean; landmarks: Record<string, Vec>;
  arena?: { x: number; y: number; r: number }; tiles: { name: string; gx: number; gy: number }[]; edges: string[];
  spawns: { x: number; y: number; kind: string }[];
}

export type EvType = 'hit' | 'death' | 'sfx' | 'fx' | 'toast' | 'pickup' | 'levelup' | 'quest' | 'zone' | 'block' | 'evade'
  | 'heal' | 'playerDeath' | 'invalid' | 'victory' | 'swing' | 'bossPhase' | 'save' | 'drop' | 'ui';
export interface Ev { type: EvType; x: number; y: number; a?: number; b?: number; s?: string; id?: number; crit?: boolean; dtype?: DamageType; text?: string; dot?: boolean }

export type Intent =
  | { type: 'move'; x: number; y: number }
  | { type: 'attack'; target: number; x: number; y: number }
  | { type: 'skill'; slot: number; x: number; y: number }
  | { type: 'basic'; x: number; y: number }
  | { type: 'evade'; x: number; y: number }
  | { type: 'potion'; slot: number }
  | { type: 'interact'; id: number }
  | { type: 'pickup'; id: number }
  | { type: 'gate' }
  | { type: 'stop' };

export const DTYPE_COLOR: Record<DamageType, string> = { physical: '#e8e4da', ember: '#ff7a3a', frost: '#9fd8ff', blight: '#b36bff' };
