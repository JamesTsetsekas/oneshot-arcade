// unit behaviour: order execution, economy (gather / build / repair), abilities.
import { defIndex, type Tag } from '../data';
import { TD } from './ext';
import { acquire, advanceBuild, canTarget, combatStep, fire, healStep, MODE_BRACE, MODE_CURL, targetRadius } from './combat';
import { goalCellFor, moveTo, nudgeOut, tryMove, turnTo } from './move';
import { Ord, type Order } from './types';
import type { Sim } from './sim';

export { nudgeOut };

const ORE_CARRY = 5;
const FLUX_CARRY = 4;
const GATHER_TICKS = 32;

export function updateUnit(sim: Sim, id: number) {
  const td = TD[sim.type[id]];
  const e = sim.ext[id];
  const o = sim.owner[id];
  const t = sim.tick;
  e.moving = false;
  e.turn = 0;
  if (e.cd > 0) e.cd--;
  for (let i = 0; i < 4; i++) if (e.cds[i] > 0) e.cds[i]--;
  if (e.mode > 0 && e.mode < 30) e.mode++;
  if (td.def.shield && t - e.lastHit > 100) e.shield = Math.min(td.def.shield, e.shield + 0.4);
  if (td.def.faction === 'verdant' && t - e.lastHit > 100 && sim.hp[id] < td.maxHp) sim.hp[id] = Math.min(td.maxHp, sim.hp[id] + 0.02);
  if (td.def.id === 'crownbeast' && t % 10 === 0 && t >= e.silUntil) {
    sim.near(sim.x[id], sim.y[id], 7, (v) => {
      if (sim.owner[v] !== o || !TD[sim.type[v]].def.tags.includes('Biological' as Tag)) return;
      const vt = TD[sim.type[v]];
      if (vt.isUnit && t - sim.ext[v].lastHit > 100 && sim.hp[v] < vt.maxHp) sim.hp[v] = Math.min(vt.maxHp, sim.hp[v] + 1.5);
    });
  }
  if ((t + id) % 20 === 0) nudgeOut(sim, id);

  if (e.chT > 0) { channel(sim, id); return; }
  if (e.wind > 0) {
    e.wind--;
    if (e.wind === 0) {
      const tid = e.target;
      const w = td.def.weapon;
      if (w && tid >= 0 && sim.alive[tid] && canTarget(sim, id, tid, true)) {
        const edge = Math.hypot(sim.x[tid] - sim.x[id], sim.y[tid] - sim.y[id]) - targetRadius(sim, tid);
        if (edge <= w.range + 2.5) fire(sim, id, tid);
      }
    }
    return;
  }
  const healing = td.heal ? healStep(sim, id) : false;
  const ord = e.orders[0];
  if (!ord) { idle(sim, id, healing); return; }

  let done = false;
  switch (ord.k) {
    case Ord.Move: {
      if (e.mode > 0 && td.def.id !== 'bulwark' && td.def.id !== 'carapace_guard') e.mode = 0;
      const r = moveTo(sim, id, ord.x, ord.y, ord.r, goalCellFor(sim, ord.x, ord.y), () => [goalCellFor(sim, ord.x, ord.y)]);
      done = r !== 0;
      break;
    }
    case Ord.AttackMove:
    case Ord.Patrol: {
      done = attackMoveStep(sim, id, ord);
      break;
    }
    case Ord.Attack: {
      const tid = ord.t;
      if (!td.canAttack || !sim.alive[tid]) { done = true; break; }
      if (!canTarget(sim, id, tid, true)) { ord.k = Ord.AttackMove; ord.r = 0.9; e.target = -1; break; }
      ord.x = sim.x[tid]; ord.y = sim.y[tid];
      e.target = tid;
      const r = combatStep(sim, id, tid, true);
      if (r === 2) done = true;
      break;
    }
    case Ord.Hold: {
      if (!td.canAttack) break;
      const w = td.def.weapon!;
      if (e.target >= 0 && !(sim.alive[e.target] && canTarget(sim, id, e.target, false))) e.target = -1;
      if (e.target < 0 && (t + id) % 4 === 0) e.target = acquire(sim, id, w.range + (e.mode >= MODE_BRACE ? 2 : 0));
      if (e.target >= 0 && combatStep(sim, id, e.target, false) === 2) e.target = -1;
      break;
    }
    case Ord.Gather: done = gatherStep(sim, id, ord); break;
    case Ord.Build: done = buildStep(sim, id, ord); break;
    case Ord.Resume: done = attendStep(sim, id, ord); break;
    case Ord.Repair: done = repairStep(sim, id, ord); break;
    case Ord.Ability: done = abilityStep(sim, id, ord); break;
    case Ord.Capture: done = captureStep(sim, id, ord); break;
    default: done = true;
  }
  if (done) {
    if (e.orders[0] === ord) e.orders.shift();
    e.target = -1;
    e.gkey = -1;
    if (ord.k === Ord.Move || ord.k === Ord.AttackMove) { e.homeX = sim.x[id]; e.homeY = sim.y[id]; }
  }
}

function idle(sim: Sim, id: number, healing: boolean) {
  const td = TD[sim.type[id]];
  const e = sim.ext[id];
  const t = sim.tick;
  if (td.canAttack && !td.isWorker) {
    const w = td.def.weapon!;
    if (e.target >= 0 && !(sim.alive[e.target] && canTarget(sim, id, e.target, false))) e.target = -1;
    if (e.target < 0 && (t + id) % 4 === 0) e.target = acquire(sim, id, w.range + 1.5 + (e.mode >= MODE_BRACE ? 2 : 0));
    if (e.target < 0 && e.lastAttacker >= 0 && t - e.lastHit < 60 && sim.alive[e.lastAttacker] && canTarget(sim, id, e.lastAttacker, false)) {
      const d = Math.hypot(sim.x[e.lastAttacker] - sim.x[id], sim.y[e.lastAttacker] - sim.y[id]);
      if (d < 14) e.target = e.lastAttacker;
    }
    if (e.target >= 0) {
      const r = combatStep(sim, id, e.target, true);
      if (r === 2) e.target = -1;
    }
    return;
  }
  if (td.isWorker && e.lastAttacker >= 0 && t - e.lastHit < 40) { /* workers do not retaliate automatically */ }
  if (td.heal && !healing && (t + id) % 10 === 0) {
    // look for damaged friends to follow
    let best = -1, bd = 1e9;
    sim.near(sim.x[id], sim.y[id], 14, (v) => {
      if (v === id || sim.owner[v] !== sim.owner[id]) return;
      const vt = TD[sim.type[v]];
      if (!vt.isUnit || !vt.def.tags.includes(td.healTag as Tag) || sim.hp[v] >= vt.maxHp - 0.5) return;
      const d = Math.hypot(sim.x[v] - sim.x[id], sim.y[v] - sim.y[id]);
      if (d < bd) { bd = d; best = v; }
    });
    e.target = best;
  }
  if (td.heal && e.target >= 0 && sim.alive[e.target] && sim.hp[e.target] < TD[sim.type[e.target]].maxHp - 0.5) {
    moveTo(sim, id, sim.x[e.target], sim.y[e.target], 3.5, goalCellFor(sim, sim.x[e.target], sim.y[e.target]), () => [goalCellFor(sim, sim.x[e.target], sim.y[e.target])]);
  }
}

function attackMoveStep(sim: Sim, id: number, ord: Order): boolean {
  const td = TD[sim.type[id]];
  const e = sim.ext[id];
  if (td.canAttack && !td.isWorker) {
    const w = td.def.weapon!;
    if (e.target >= 0 && !(sim.alive[e.target] && canTarget(sim, id, e.target, false))) e.target = -1;
    if (e.target < 0 && (sim.tick + id) % 4 === 0) e.target = acquire(sim, id, Math.max(w.range + 3, 8));
    if (e.target >= 0) {
      const r = combatStep(sim, id, e.target, true);
      if (r === 2) e.target = -1;
      return false;
    }
  }
  const r = moveTo(sim, id, ord.x, ord.y, ord.r, goalCellFor(sim, ord.x, ord.y), () => [goalCellFor(sim, ord.x, ord.y)]);
  if (r !== 0) {
    if (ord.k === Ord.Patrol) {
      const nx = ord.a, ny = ord.b;
      ord.a = ord.x; ord.b = ord.y; ord.x = nx; ord.y = ny;
      e.gkey = -1;
      return false;
    }
    return true;
  }
  return false;
}

// ---------------- gathering ----------------
function hasTap(sim: Sim, vent: number, owner: number): boolean {
  const f = sim.players[owner].faction;
  const tapIdx = defIndex[f.tap];
  const vx = sim.x[vent], vy = sim.y[vent];
  for (const s of sim.ids) {
    if (sim.alive[s] && sim.type[s] === tapIdx && sim.owner[s] === owner && sim.ext[s].done && Math.abs(sim.x[s] - vx) < 0.8 && Math.abs(sim.y[s] - vy) < 0.8) return true;
  }
  return false;
}

function nodeUsable(sim: Sim, node: number, owner: number): boolean {
  if (!sim.alive[node]) return false;
  const e = sim.ext[node];
  if (e.amount <= 0) return false;
  if (sim.type[node] === defIndex['flux_vent']) return hasTap(sim, node, owner);
  return sim.type[node] === defIndex['ore_seam'];
}

function findAltNode(sim: Sim, id: number, nx: number, ny: number, ofType: number, requireFree: boolean): number {
  const owner = sim.owner[id];
  let best = -1, bd = 1e9;
  for (const n of sim.ids) {
    if (!sim.alive[n] || sim.type[n] !== ofType) continue;
    const d = Math.hypot(sim.x[n] - nx, sim.y[n] - ny);
    if (d > 16) continue;
    if (!nodeUsable(sim, n, owner)) continue;
    const r = sim.ext[n].res;
    const busy = r >= 0 && r !== id && sim.alive[r] && sim.ext[r].wph === 1;
    if (requireFree && busy) continue;
    // prefer closer to the worker
    const dw = Math.hypot(sim.x[n] - sim.x[id], sim.y[n] - sim.y[id]);
    const score = dw + (busy ? 6 : 0);
    if (score < bd) { bd = score; best = n; }
  }
  return best;
}

function nearestDropoff(sim: Sim, id: number): number {
  const owner = sim.owner[id];
  let best = -1, bd = 1e9;
  for (const s of sim.ids) {
    if (!sim.alive[s] || sim.owner[s] !== owner || !TD[sim.type[s]].isHall || !sim.ext[s].done) continue;
    const d = Math.hypot(sim.x[s] - sim.x[id], sim.y[s] - sim.y[id]);
    if (d < bd) { bd = d; best = s; }
  }
  return best;
}

function ringGoals(sim: Sim, s: number) {
  const e = sim.ext[s];
  return () => sim.nav.ringCells(e.ox, e.oy, e.fw, e.fh);
}

export function depleteNode(sim: Sim, node: number) {
  const e = sim.ext[node];
  if (!sim.alive[node]) return;
  sim.alive[node] = 0;
  sim.nav.setFootprint(e.ox, e.oy, e.fw, e.fh, -1);
  sim.events.push({ k: 'depleted', tick: sim.tick, owner: -1, x: sim.x[node], y: sim.y[node], id: node, a: sim.type[node] });
  if (sim.type[node] !== defIndex['ore_seam']) return;
  // any ore left near this base?
  for (const n of sim.ids) {
    if (sim.alive[n] && sim.type[n] === defIndex['ore_seam'] && Math.hypot(sim.x[n] - sim.x[node], sim.y[n] - sim.y[node]) < 16) return;
  }
  for (const h of sim.ids) {
    if (!sim.alive[h] || !TD[sim.type[h]].isHall) continue;
    if (Math.hypot(sim.x[h] - sim.x[node], sim.y[h] - sim.y[node]) < 22) sim.alert(sim.owner[h], 'depleted', sim.x[node], sim.y[node], 'Expansion depleted');
  }
}

function gatherStep(sim: Sim, id: number, ord: Order): boolean {
  const e = sim.ext[id];
  const owner = sim.owner[id];
  const pl = sim.players[owner];
  let node = ord.t;
  if (e.wph === 0 && e.carry > 0) e.wph = 2;
  if (e.wph === 0) {
    if (!nodeUsable(sim, node, owner)) {
      const ofType = sim.alive[node] ? sim.type[node] : defIndex['ore_seam'];
      const alt = findAltNode(sim, id, ord.x, ord.y, sim.type[node] === defIndex['flux_vent'] && sim.alive[node] ? ofType : defIndex['ore_seam'], false);
      if (alt < 0) return true;
      node = ord.t = alt; ord.x = sim.x[alt]; ord.y = sim.y[alt];
    }
    const ne = sim.ext[node];
    const contact = Math.max(ne.fw, ne.fh) / 2 + 0.85;
    const r = moveTo(sim, id, sim.x[node], sim.y[node], contact, 1_000_000 + node, ringGoals(sim, node));
    if (r === 1) {
      const busy = ne.res >= 0 && ne.res !== id && sim.alive[ne.res] && sim.ext[ne.res].wph === 1 && sim.ext[ne.res].node === node;
      if (busy) {
        const alt = findAltNode(sim, id, sim.x[node], sim.y[node], sim.type[node], true);
        if (alt >= 0) { node = ord.t = alt; ord.x = sim.x[alt]; ord.y = sim.y[alt]; e.gkey = -1; }
        else { e.waitT++; turnTo(sim, id, Math.atan2(sim.y[node] - sim.y[id], sim.x[node] - sim.x[id]), 0.3); }
      } else {
        ne.res = id; e.node = node; e.gT = GATHER_TICKS; e.wph = 1;
      }
    } else if (r === 2) {
      const alt = findAltNode(sim, id, ord.x, ord.y, sim.type[node], false);
      if (alt >= 0 && alt !== node) { ord.t = alt; ord.x = sim.x[alt]; ord.y = sim.y[alt]; } else return true;
    }
    return false;
  }
  if (e.wph === 1) {
    const ne = sim.ext[e.node];
    if (!sim.alive[e.node] || ne.amount <= 0) { e.wph = 0; return false; }
    turnTo(sim, id, Math.atan2(sim.y[e.node] - sim.y[id], sim.x[e.node] - sim.x[id]), 0.5);
    e.atkTick = sim.tick;
    if (--e.gT <= 0) {
      const isFlux = sim.type[e.node] === defIndex['flux_vent'];
      const take = Math.min(ne.amount, (isFlux ? FLUX_CARRY : ORE_CARRY) * sim.gatherBonus());
      ne.amount -= take;
      e.carry = take; e.carryT = isFlux ? 2 : 1;
      if (ne.res === id) ne.res = -1;
      e.prevNode = e.node;
      e.wph = 2;
      if (ne.amount <= 0.01) depleteNode(sim, e.node);
    }
    return false;
  }
  // wph 2: return cargo
  const hall = nearestDropoff(sim, id);
  if (hall < 0) return true;
  const he = sim.ext[hall];
  const r = moveTo(sim, id, sim.x[hall], sim.y[hall], Math.max(he.fw, he.fh) / 2 + 0.85, 1_000_000 + hall, ringGoals(sim, hall));
  if (r === 1) {
    if (e.carryT === 1) { pl.ore += e.carry; pl.stats.ore += e.carry; } else if (e.carryT === 2) { pl.flux += e.carry; pl.stats.flux += e.carry; }
    e.carry = 0; e.carryT = 0; e.wph = 0;
    // next trip target
    if (!nodeUsable(sim, ord.t, owner)) {
      const alt = findAltNode(sim, id, ord.x, ord.y, sim.alive[ord.t] ? sim.type[ord.t] : defIndex['ore_seam'], false);
      if (alt < 0) return true;
      ord.t = alt; ord.x = sim.x[alt]; ord.y = sim.y[alt];
    }
  } else if (r === 2) { e.wph = 0; return false; }
  return false;
}

// ---------------- building ----------------
function resumeMining(sim: Sim, id: number) {
  const e = sim.ext[id];
  if (e.orders.length > 1) return;
  if (e.prevNode >= 0 && sim.alive[e.prevNode] && sim.ext[e.prevNode].amount > 0) {
    e.orders.push({ k: Ord.Gather, x: sim.x[e.prevNode], y: sim.y[e.prevNode], t: e.prevNode, p: 0, r: 0, a: 0, b: 0 });
  }
}

function buildStep(sim: Sim, id: number, ord: Order): boolean {
  const e = sim.ext[id];
  const owner = sim.owner[id];
  if (ord.t < 0) {
    const r = moveTo(sim, id, ord.x, ord.y, ord.r, goalCellFor(sim, ord.x, ord.y), () => [goalCellFor(sim, ord.x, ord.y)]);
    if (r === 0) return false;
    if (r === 2) return true;
    const sid = sim.placeStructure(owner, ord.p, ord.x, ord.y, id);
    if (sid < 0) return true;
    if (sim.players[owner].faction.buildMode === 'seed') {
      resumeMining(sim, id);
      return true;
    }
    ord.t = sid;
    return false;
  }
  return attendStep(sim, id, ord);
}

function attendStep(sim: Sim, id: number, ord: Order): boolean {
  const sid = ord.t;
  if (!sim.alive[sid]) return true;
  const se = sim.ext[sid];
  if (se.done) { resumeMining(sim, id); return true; }
  const reach = Math.max(se.fw, se.fh) / 2 + 1.35;
  const d = Math.hypot(sim.x[sid] - sim.x[id], sim.y[sid] - sim.y[id]);
  if (d > reach) {
    const r = moveTo(sim, id, sim.x[sid], sim.y[sid], reach - 0.3, 1_000_000 + sid, ringGoals(sim, sid));
    return r === 2;
  }
  // verdant structures grow on their own; attending adds nothing
  if (sim.players[sim.owner[id]].faction.buildMode === 'seed') return true;
  turnTo(sim, id, Math.atan2(sim.y[sid] - sim.y[id], sim.x[sid] - sim.x[id]), 0.5);
  sim.ext[id].atkTick = sim.tick;
  if (advanceBuild(sim, sid)) { resumeMining(sim, id); return true; }
  return false;
}

function repairStep(sim: Sim, id: number, ord: Order): boolean {
  const tid = ord.t;
  if (!sim.alive[tid]) return true;
  const tt = TD[sim.type[tid]];
  const owner = sim.owner[id];
  if (sim.hp[tid] >= tt.maxHp - 0.01) { resumeMining(sim, id); return true; }
  if (!tt.isStruct && !tt.def.tags.includes('Mechanical' as Tag)) return true;
  const reach = targetRadius(sim, tid) + 1.3;
  const d = Math.hypot(sim.x[tid] - sim.x[id], sim.y[tid] - sim.y[id]);
  if (d > reach) {
    return moveTo(sim, id, sim.x[tid], sim.y[tid], reach - 0.3, 1_000_000 + tid, tt.isStruct ? ringGoals(sim, tid) : () => [goalCellFor(sim, sim.x[tid], sim.y[tid])]) === 2;
  }
  const e = sim.ext[id];
  const pl = sim.players[owner];
  const rate = 0.25; // hp per tick
  const orePerHp = (0.25 * tt.def.cost.ore) / tt.maxHp;
  e.repT += rate * orePerHp;
  if (e.repT >= 1) {
    if (pl.ore < 1) { sim.alert(owner, 'invalid', sim.x[id], sim.y[id], 'Not enough Prism Ore to repair'); e.repT = 0; return true; }
    pl.ore -= 1; e.repT -= 1;
  }
  sim.hp[tid] = Math.min(tt.maxHp, sim.hp[tid] + rate);
  e.atkTick = sim.tick;
  turnTo(sim, id, Math.atan2(sim.y[tid] - sim.y[id], sim.x[tid] - sim.x[id]), 0.5);
  return false;
}

// ---------------- abilities ----------------
function abilityStep(sim: Sim, id: number, ord: Order): boolean {
  const td = TD[sim.type[id]];
  const e = sim.ext[id];
  const ab = td.def.abilities?.[ord.p];
  if (!ab) return true;
  const owner = sim.owner[id];
  const pl = sim.players[owner];
  if (sim.tick < e.silUntil) { sim.alert(owner, 'invalid', sim.x[id], sim.y[id], 'Silenced'); return true; }
  if (e.cds[ord.p] > 0) { sim.alert(owner, 'invalid', sim.x[id], sim.y[id], `${ab.name} is recharging`); return true; }
  const range = ab.range ?? 1;
  switch (ab.id) {
    case 'weld': {
      const tid = ord.t;
      if (tid < 0 || !sim.alive[tid] || sim.owner[tid] !== owner || !TD[sim.type[tid]].isStruct) return true;
      const reach = targetRadius(sim, tid) + 1.3;
      if (Math.hypot(sim.x[tid] - sim.x[id], sim.y[tid] - sim.y[id]) > reach) {
        return moveTo(sim, id, sim.x[tid], sim.y[tid], reach - 0.3, 1_000_000 + tid, ringGoals(sim, tid)) === 2;
      }
      if (pl.flux < (ab.flux ?? 0)) { sim.alert(owner, 'invalid', sim.x[id], sim.y[id], 'Not enough Flux'); return true; }
      pl.flux -= ab.flux ?? 0;
      const se = sim.ext[tid];
      se.weldLeft = 80; se.weldRate = 60 / 80;
      e.cds[ord.p] = Math.round(ab.cooldown * 20);
      e.castTick = sim.tick;
      sim.events.push({ k: 'weld', tick: sim.tick, owner, x: sim.x[id], y: sim.y[id], tx: sim.x[tid], ty: sim.y[tid], id, vis: 'weld' });
      return true;
    }
    case 'spike': case 'silence': {
      const d = Math.hypot(ord.x - sim.x[id], ord.y - sim.y[id]);
      if (d > range) {
        return moveTo(sim, id, ord.x, ord.y, range - 0.5, goalCellFor(sim, ord.x, ord.y), () => [goalCellFor(sim, ord.x, ord.y)]) === 2;
      }
      if (ab.energy && e.energy < ab.energy) { sim.alert(owner, 'invalid', sim.x[id], sim.y[id], 'Not enough energy'); return true; }
      if (ab.energy) e.energy -= ab.energy;
      e.cds[ord.p] = Math.round(ab.cooldown * 20);
      e.castTick = sim.tick;
      if (ab.id === 'spike') {
        sim.effects.push({ kind: 'spike', owner, x: ord.x, y: ord.y, r: ab.radius ?? 8, start: sim.tick, end: sim.tick + 280, born: sim.tick });
        sim.events.push({ k: 'spike', tick: sim.tick, owner, x: ord.x, y: ord.y });
      } else {
        sim.effects.push({ kind: 'silence', owner, x: ord.x, y: ord.y, r: ab.radius ?? 3, start: sim.tick + 20, end: sim.tick + 120, born: sim.tick });
        sim.events.push({ k: 'silence', tick: sim.tick, owner, x: ord.x, y: ord.y, a: ab.radius ?? 3 });
      }
      return true;
    }
    case 'rootstep': {
      const tid = ord.t;
      if (tid < 0 || !sim.alive[tid] || sim.owner[tid] !== owner) return true;
      const tt = TD[sim.type[tid]];
      if (!tt.isStruct || !tt.def.field || !sim.ext[tid].done) return true;
      // must currently stand inside a friendly grove
      let inField = false;
      for (const f of sim.fieldRadiusFor(owner)) if (Math.hypot(f.x - sim.x[id], f.y - sim.y[id]) <= f.r) inField = true;
      if (!inField) { sim.alert(owner, 'invalid', sim.x[id], sim.y[id], 'Rootstep needs a friendly grove nearby'); return true; }
      e.chT = e.chTotal = 20; e.chKind = 1; e.chTarget = tid;
      const half = sim.ext[tid].fw / 2 + 1.2;
      const ang = Math.atan2(64 - sim.y[tid], 64 - sim.x[tid]);
      e.chX = sim.x[tid] + Math.cos(ang) * half; e.chY = sim.y[tid] + Math.sin(ang) * half;
      e.cds[ord.p] = Math.round(ab.cooldown * 20);
      e.castTick = sim.tick;
      sim.events.push({ k: 'ability', tick: sim.tick, owner, x: sim.x[id], y: sim.y[id], vis: 'rootstep-start' });
      return true;
    }
  }
  return true;
}

function channel(sim: Sim, id: number) {
  const e = sim.ext[id];
  e.chT--;
  e.moving = false;
  if (e.chKind === 2) {
    // capture: abort when the pylon is gone
    const pid = e.chTarget;
    if (pid < 0 || !sim.alive[pid]) { e.chT = 0; return; }
    turnTo(sim, id, Math.atan2(sim.y[pid] - sim.y[id], sim.x[pid] - sim.x[id]), 0.4);
    if (e.chT <= 0) {
      const pe = sim.ext[pid];
      pe.capOwner = sim.owner[id];
      sim.events.push({ k: 'captured', tick: sim.tick, owner: sim.owner[id], x: sim.x[pid], y: sim.y[pid], id: pid });
      sim.alert(sim.owner[id], 'captured', sim.x[pid], sim.y[pid], 'Watch Pylon captured');
      sim.recordTimeline(sim.owner[id], 'Watch Pylon captured', 'pylon');
      e.orders.shift();
    }
    return;
  }
  if (e.chKind === 1 && e.chT <= 0) {
    sim.events.push({ k: 'ability', tick: sim.tick, owner: sim.owner[id], x: sim.x[id], y: sim.y[id], tx: e.chX, ty: e.chY, vis: 'rootstep' });
    const w = sim.nav.nearestWalkable(e.chX, e.chY, 6);
    sim.x[id] = sim.px[id] = w ? w.x : e.chX;
    sim.y[id] = sim.py[id] = w ? w.y : e.chY;
    e.gkey = -1;
  }
}

function captureStep(sim: Sim, id: number, ord: Order): boolean {
  const pid = ord.t;
  if (!sim.alive[pid]) return true;
  const pe = sim.ext[pid];
  if (pe.capOwner === sim.owner[id]) return true;
  const d = Math.hypot(sim.x[pid] - sim.x[id], sim.y[pid] - sim.y[id]);
  if (d > 2.6) {
    return moveTo(sim, id, sim.x[pid], sim.y[pid], 2.2, 1_000_000 + pid, ringGoals(sim, pid)) === 2;
  }
  const e = sim.ext[id];
  e.chT = e.chTotal = 60; e.chKind = 2; e.chTarget = pid;
  return false;
}

// ---------------- soft collision ----------------
export function separateUnits(sim: Sim) {
  for (const a of sim.ids) {
    if (!sim.alive[a]) continue;
    const ta = TD[sim.type[a]];
    if (!ta.isUnit || ta.isHover) continue;
    const ea = sim.ext[a];
    const ra = ta.def.radius;
    sim.near(sim.x[a], sim.y[a], ra + 1.3, (b) => {
      if (b <= a) return;
      const tb = TD[sim.type[b]];
      if (!tb.isUnit || tb.isHover) return;
      const eb = sim.ext[b];
      if (ta.isWorker && tb.isWorker && (ea.wph > 0 || ea.orders[0]?.k === Ord.Gather) && (eb.wph > 0 || eb.orders[0]?.k === Ord.Gather)) return;
      let dx = sim.x[a] - sim.x[b], dy = sim.y[a] - sim.y[b];
      let d = Math.hypot(dx, dy);
      const min = (ra + tb.def.radius) * 0.92;
      if (d >= min) return;
      if (d < 0.001) { dx = (a & 1) ? 1 : -1; dy = (b & 1) ? 0.5 : -0.5; d = Math.hypot(dx, dy); }
      const push = Math.min(min - d, 0.3);
      const nx = dx / d, ny = dy / d;
      let wa = 0.5, wb = 0.5;
      if (ea.moving && !eb.moving) { wa = 0.15; wb = 0.85; }
      else if (!ea.moving && eb.moving) { wa = 0.85; wb = 0.15; }
      if (ea.chT > 0) { wa = 0; wb = 1; }
      if (eb.chT > 0) { wb = 0; wa = 1; }
      tryMove(sim, a, sim.x[a] + nx * push * wa, sim.y[a] + ny * push * wa);
      tryMove(sim, b, sim.x[b] - nx * push * wb, sim.y[b] - ny * push * wb);
    });
  }
}

export { MODE_CURL };
