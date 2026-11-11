import { allDefs, secToTicks, type EntityDef } from '../data';
import type { Order, QItem } from './types';

/** Sparse / cold per-entity state. Hot numeric state (position, hp, owner, type) lives in typed arrays on the Sim. */
export class Ext {
  orders: Order[] = [];
  // movement
  gkey = -1;
  stuck = 0;
  lastD = 1e9;
  chk = 0;
  dirx = 0;
  diry = 0;
  failTick = -99999;
  moving = false;
  los = false;
  losAge = 99;
  homeX = 0;
  homeY = 0;
  walkPhase = 0;
  slotX = 0;
  slotY = 0;
  hasSlot = false;
  // combat
  target = -1;
  cd = 0;
  wind = 0;
  deploy = 0;
  lastHit = -99999;
  lastAtk = -99999;
  lastAttacker = -1;
  acq = 0;
  mode = 0; // brace/curl counter
  shield = 0;
  slowUntil = 0;
  slowF = 1;
  silUntil = 0;
  energy = 0;
  cds = [0, 0, 0, 0];
  // worker
  carry = 0;
  carryT = 0; // 0 none 1 ore 2 flux
  wph = 0;
  gT = 0;
  node = -1;
  prevNode = -1;
  waitT = 0;
  repT = 0;
  // structure
  prog = 0;
  total = 0;
  done = true;
  q: QItem[] = [];
  rallyX = 0;
  rallyY = 0;
  rallyT = -1;
  hasRally = false;
  builder = -1;
  ox = 0;
  oy = 0;
  fw = 0;
  fh = 0;
  upgrading = '';
  // resource node / pylon / pod
  amount = 0;
  res = -1;
  maxAmount = 0;
  capT = 0;
  capOwner = -1;
  // channel (rootstep, capture)
  chT = 0;
  chTotal = 0;
  chKind = 0;
  chX = 0;
  chY = 0;
  chTarget = -1;
  weldLeft = 0;
  weldRate = 0;
  born = 0;
  /** renderer hints */
  atkTick = -99999;
  castTick = -99999;
  turn = 0;
}

export interface TDef {
  idx: number;
  def: EntityDef;
  speed: number; // units per tick
  periodT: number;
  windT: number;
  setupT: number;
  buildT: number;
  delayT: number;
  isUnit: boolean;
  isStruct: boolean;
  isNeutral: boolean;
  w: number;
  h: number;
  canAttack: boolean;
  isHall: boolean;
  isWorker: boolean;
  isHover: boolean;
  maxHp: number;
  maxEnergy: number;
  heal: number; // hp per tick for healers
  healTag: string;
}

export const TD: TDef[] = allDefs.map((def, idx) => ({
  idx,
  def,
  speed: def.speed / 20,
  periodT: def.weapon ? secToTicks(def.weapon.period) : 0,
  windT: def.weapon?.windup ? secToTicks(def.weapon.windup) : 0,
  setupT: def.weapon?.setup ? secToTicks(def.weapon.setup) : 0,
  buildT: secToTicks(def.buildTime),
  delayT: def.weapon?.delayed ? secToTicks(def.weapon.delayed) : 0,
  isUnit: def.kind === 'unit',
  isStruct: def.kind === 'structure',
  isNeutral: def.kind === 'neutral',
  w: def.size ?? 1,
  h: def.size ?? 1,
  canAttack: !!def.weapon,
  isHall: !!def.isHall,
  isWorker: !!def.worker,
  isHover: !!def.hover,
  maxHp: def.hp,
  maxEnergy: def.energy ?? 0,
  heal: def.id === 'mender_rig' || def.id === 'bloom_sage' ? 12 / 20 : 0,
  healTag: def.id === 'mender_rig' ? 'Mechanical' : def.id === 'bloom_sage' ? 'Biological' : '',
}));
