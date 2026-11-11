// Order execution: production queues, construction, worker economy FSM, combat order logic,
// abilities. Orders never get overridden by auto-acquisition unless they become invalid.
import { ABILITIES, FACTIONS, STRUCTURES, TECHS, UNITS } from '../faction-data';
import { LATE_GAME_TICK, type Sim } from './sim';
import { Kind, type Order } from './types';
import { moveTo, moveToEntity, ringSeeds } from './movement';
import { acquireTarget, effectiveRange } from './combat';

// ------------------------------------------------------------------ production & construction

export function completeStructure(sim: Sim, id: number) {
  const d = sim.sdef(id);
  const o = sim.owner[id];
  sim.built[id] = 1;
  sim.progress[id] = 1;
  if (sim.hp[id] > sim.maxHp[id] - 1) sim.hp[id] = sim.maxHp[id];
  const p = sim.players[o];
  p.stats.structuresBuilt++;
  sim.events.push({ type: 'built', id, owner: o, def: d.id, x: sim.x[id], y: sim.y[id] });
  sim.alert(o, 'built', `${d.name} complete`, sim.x[id], sim.y[id]);
  if (d.isHQ) {
    p.stats.expansions.push(sim.tick);
    sim.addTimeline(o, `Expanded: new ${d.name}`, 'expand');
    sim.alert(o, 'expansion', 'Expansion established', sim.x[id], sim.y[id]);
  } else if (d.researches.length || d.trains.length) sim.addTimeline(o, `${d.name} complete`, d.researches.length ? 'tech' : 'econ');
  else if (d.isExtractor && sim.structuresOf(o).filter((s) => sim.sdef(s).isExtractor).length === 1) sim.addTimeline(o, 'First Flux extractor online', 'econ');
}

export function advanceConstruction(sim: Sim, id: number, rate = 1) {
  if (sim.built[id]) return;
  const d = sim.sdef(id);
  const inc = rate / d.buildTime;
  sim.progress[id] = Math.min(1, sim.progress[id] + inc);
  sim.hp[id] = Math.min(sim.maxHp[id], sim.hp[id] + sim.maxHp[id] * 0.9 * inc);
  if (sim.progress[id] >= 1 - 1e-9) completeStructure(sim, id);
}

export function updateProduction(sim: Sim) {
  for (let id = 1; id < sim.nextId; id++) {
    if (!sim.alive[id] || sim.kind[id] !== Kind.Structure) continue;
    const owner = sim.owner[id];
    if (owner < 0) continue;
    const e = sim.ext[id];
    const p = sim.players[owner];
    if (!sim.built[id]) {
      if (e.builder === -2) advanceConstruction(sim, id);
      continue;
    }
    const item = e.queue[0];
    if (!item) continue;
    if (!item.started) {
      if (item.kind === 'unit') {
        const ud = UNITS[item.def];
        if (sim.missingRequirements(owner, ud.requires).length) { item.paused = 'prereq'; continue; }
        if (p.supplyUsed + ud.supply > p.supplyCap) {
          if (item.paused !== 'supply' || sim.tick - p.lastSupplyAlert > 200) {
            if (sim.tick - p.lastSupplyAlert > 120) {
              sim.alert(owner, 'supply', p.supplyCap >= 100 ? 'Supply limit reached' : `Supply blocked — build a ${STRUCTURES[FACTIONS[p.faction].supplyStructure].name}`, sim.x[id], sim.y[id]);
              p.lastSupplyAlert = sim.tick;
            }
          }
          item.paused = 'supply';
          continue;
        }
        p.supplyUsed += ud.supply;
      }
      item.started = true;
      item.paused = '';
    }
    item.progress++;
    if (item.progress >= item.total) {
      e.queue.shift();
      if (item.kind === 'unit') spawnProduced(sim, id, item.def);
      else finishResearch(sim, owner, item.def, id);
    }
  }
}

function finishResearch(sim: Sim, owner: number, tech: string, at: number) {
  const td = TECHS[tech];
  const p = sim.players[owner];
  p.techs.add(tech);
  if (td.effect.attackLevel) p.attackLevel = Math.max(p.attackLevel, td.effect.attackLevel);
  if (td.effect.armorLevel) p.armorLevel = Math.max(p.armorLevel, td.effect.armorLevel);
  sim.events.push({ type: 'research', id: at, owner, def: tech });
  sim.alert(owner, 'research', `Research complete: ${td.name}`, sim.x[at], sim.y[at]);
  sim.addTimeline(owner, `Researched ${td.name}`, 'tech');
}

function spawnProduced(sim: Sim, sid: number, defId: string) {
  const owner = sim.owner[sid];
  const e = sim.ext[sid];
  const d = sim.sdef(sid);
  let dx = e.hasRally ? e.rallyX - sim.x[sid] : sim.map.size / 2 - sim.x[sid];
  let dy = e.hasRally ? e.rallyY - sim.y[sid] : sim.map.size / 2 - sim.y[sid];
  const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
  const r = d.size / 2 + 1.0;
  const u = sim.spawnUnit(defId, owner, sim.x[sid] + dx * r, sim.y[sid] + dy * r);
  sim.fx[u] = dx; sim.fy[u] = dy;
  const p = sim.players[owner];
  p.stats.unitsCreated++;
  if (p.stats.unitsCreated === 8) sim.addTimeline(owner, 'Army production underway', 'econ');
  sim.alert(owner, 'unit', `${UNITS[defId].name} ready`, sim.x[u], sim.y[u]);
  if (e.hasRally) {
    const t = e.rallyTarget;
    if (UNITS[defId].worker && t > 0 && sim.alive[t] && (sim.kind[t] === Kind.Ore || (sim.kind[t] === Kind.Structure && sim.sdef(t).isExtractor))) {
      sim.pushOrder(u, { t: 'gather', target: t }, false);
    } else if (!UNITS[defId].worker || !(t > 0)) {
      sim.pushOrder(u, { t: 'move', x: e.rallyX, y: e.rallyY, attack: false, force: false }, false);
    } else sim.pushOrder(u, { t: 'move', x: e.rallyX, y: e.rallyY, attack: false, force: false }, false);
  }
}

// ------------------------------------------------------------------ unit orders

export function updateUnits(sim: Sim) {
  for (let id = 1; id < sim.nextId; id++) {
    if (!sim.alive[id] || sim.kind[id] !== Kind.Unit) continue;
    const e = sim.ext[id];
    e.engage = -1;
    if (e.toggleTicks > 0) { e.toggleTicks--; e.hasGoal = false; continue; }
    if (e.pathFailed) {
      e.pathFailed = false;
      const o = e.orders[0];
      if (o && o.t !== 'gather') {
        sim.alert(sim.owner[id], 'invalid', 'Path blocked — order cancelled', sim.x[id], sim.y[id]);
        nextOrder(sim, id);
      }
    }
    const o = e.orders[0];
    if (!o) { idle(sim, id); continue; }
    e.hasAnchor = false;
    switch (o.t) {
      case 'move': doMove(sim, id, o); break;
      case 'patrol': doPatrol(sim, id, o); break;
      case 'attack': doAttack(sim, id, o); break;
      case 'hold': doHold(sim, id); break;
      case 'guard': doGuard(sim, id, o); break;
      case 'gather': doGather(sim, id, o); break;
      case 'build': doBuild(sim, id, o); break;
      case 'repair': doRepair(sim, id, o); break;
      case 'capture': doCapture(sim, id, o); break;
      case 'ability': doAbility(sim, id, o); break;
    }
  }
}

function nextOrder(sim: Sim, id: number) {
  const e = sim.ext[id];
  e.orders.shift();
  e.hasGoal = false;
  e.phase = 'none';
  e.focusTarget = -1;
  e.repaths = 0;
}

function validTarget(sim: Sim, id: number, t: number): boolean {
  return t > 0 && sim.alive[t] === 1 && sim.owner[t] !== sim.owner[id] && sim.isVisibleTo(sim.owner[id], t);
}

/** approach + engage target; returns false if target cannot be engaged */
function engage(sim: Sim, id: number, t: number, canMove: boolean): boolean {
  const w = sim.udef(id).weapon;
  if (!w) return false;
  if (sim.isHover(t) && !w.canTargetHover) return false;
  const range = effectiveRange(sim, id, w);
  const d = sim.edgeDist(id, t);
  const e = sim.ext[id];
  if (d <= range) {
    if (w.minRange && sim.dist(id, t) < w.minRange) {
      if (!canMove) return false;
      // back off to get outside minimum range
      const dx = sim.x[id] - sim.x[t], dy = sim.y[id] - sim.y[t];
      const l = Math.hypot(dx, dy) || 1;
      moveTo(sim, id, sim.x[id] + (dx / l) * 2, sim.y[id] + (dy / l) * 2, 0.3);
      return true;
    }
    e.engage = t;
    e.hasGoal = false;
    return true;
  }
  if (!canMove || e.braced || e.curled) return false;
  moveToEntity(sim, id, t, range * 0.9);
  e.engage = -1;
  return true;
}

function idle(sim: Sim, id: number) {
  const e = sim.ext[id];
  const d = sim.udef(id);
  if (!e.hasAnchor) { e.hasAnchor = true; e.anchorX = sim.x[id]; e.anchorY = sim.y[id]; e.focusTarget = -1; }
  if (!d.weapon || d.worker) return;
  if (e.curled) return;
  const canMove = !e.braced;
  if (e.focusTarget > 0 && (!validTarget(sim, id, e.focusTarget) || Math.hypot(sim.x[e.focusTarget] - e.anchorX, sim.y[e.focusTarget] - e.anchorY) > d.sight + 4)) e.focusTarget = -1;
  if (e.focusTarget < 0 && (sim.tick + id) % 4 === 0) e.focusTarget = acquireTarget(sim, id, canMove ? d.sight : effectiveRange(sim, id, d.weapon) + sim.radius[id] + 0.5);
  if (e.focusTarget > 0) {
    if (!engage(sim, id, e.focusTarget, canMove)) e.focusTarget = -1;
    return;
  }
  // return to anchor after a chase
  if (canMove && Math.hypot(sim.x[id] - e.anchorX, sim.y[id] - e.anchorY) > 1.5) moveTo(sim, id, e.anchorX, e.anchorY, 0.6);
}

function groupMoveTo(sim: Sim, id: number, x: number, y: number, range: number, gc?: number): boolean {
  if (gc === undefined) return moveTo(sim, id, x, y, range);
  return moveTo(sim, id, x, y, range, 'c' + gc, () => [gc]);
}

function attackMoveStep(sim: Sim, id: number, x: number, y: number, gc?: number): boolean {
  const e = sim.ext[id];
  const d = sim.udef(id);
  if (d.weapon && !e.curled) {
    if (e.focusTarget > 0 && (!validTarget(sim, id, e.focusTarget) || sim.dist(id, e.focusTarget) > d.sight + 3)) e.focusTarget = -1;
    if (e.focusTarget < 0 && (sim.tick + id) % 4 === 0) e.focusTarget = acquireTarget(sim, id, d.sight);
    if (e.focusTarget > 0) {
      if (engage(sim, id, e.focusTarget, true)) return false;
      e.focusTarget = -1;
    }
  }
  return groupMoveTo(sim, id, x, y, 0.35, gc);
}

function doMove(sim: Sim, id: number, o: Extract<Order, { t: 'move' }>) {
  const arrived = o.attack ? attackMoveStep(sim, id, o.x, o.y, o.gc) : groupMoveTo(sim, id, o.x, o.y, 0.3, o.gc);
  if (arrived) nextOrder(sim, id);
}

function doPatrol(sim: Sim, id: number, o: Extract<Order, { t: 'patrol' }>) {
  if (attackMoveStep(sim, id, o.x, o.y, o.gc)) {
    const tx = o.x, ty = o.y;
    o.x = o.ox; o.y = o.oy; o.ox = tx; o.oy = ty; o.gc = undefined;
    sim.ext[id].hasGoal = false;
    if (sim.ext[id].orders.length > 1) nextOrder(sim, id); // queued orders after patrol take over
  }
}

function doAttack(sim: Sim, id: number, o: Extract<Order, { t: 'attack' }>) {
  const t = o.target;
  const okTarget = t > 0 && sim.alive[t] && sim.owner[t] !== sim.owner[id] && (sim.isVisibleTo(sim.owner[id], t) || sim.kind[t] === Kind.Barrier);
  if (!okTarget) { nextOrder(sim, id); return; }
  if (!engage(sim, id, t, true)) nextOrder(sim, id);
}

function doHold(sim: Sim, id: number) {
  const e = sim.ext[id];
  const d = sim.udef(id);
  e.hasGoal = false;
  if (!d.weapon || e.curled) return;
  const r = effectiveRange(sim, id, d.weapon) + sim.radius[id] + 0.6;
  if (e.focusTarget > 0 && (!validTarget(sim, id, e.focusTarget) || sim.edgeDist(id, e.focusTarget) > r)) e.focusTarget = -1;
  if (e.focusTarget < 0 && (sim.tick + id) % 3 === 0) e.focusTarget = acquireTarget(sim, id, r);
  if (e.focusTarget > 0 && !engage(sim, id, e.focusTarget, false)) e.focusTarget = -1;
}

function doGuard(sim: Sim, id: number, o: Extract<Order, { t: 'guard' }>) {
  const g = o.target;
  if (!(g > 0 && sim.alive[g])) { nextOrder(sim, id); return; }
  const e = sim.ext[id];
  const d = sim.udef(id);
  if (d.weapon) {
    if (e.focusTarget > 0 && (!validTarget(sim, id, e.focusTarget) || sim.dist(g, e.focusTarget) > 9)) e.focusTarget = -1;
    if (e.focusTarget < 0 && (sim.tick + id) % 4 === 0) {
      const t = acquireTarget(sim, id, d.sight);
      if (t > 0 && sim.dist(g, t) < 8) e.focusTarget = t;
    }
    if (e.focusTarget > 0 && engage(sim, id, e.focusTarget, true)) return;
  }
  if (sim.dist(id, g) > 3.2) moveTo(sim, id, sim.x[g], sim.y[g], 2.4, 'm' + Math.floor(sim.y[g] / 3) * sim.map.size + Math.floor(sim.x[g] / 3));
  else e.hasGoal = false;
}

// ------------------------------------------------------------------ workers

function validNode(sim: Sim, id: number, node: number): boolean {
  if (!(node > 0 && sim.alive[node])) return false;
  const k = sim.kind[node];
  if (k === Kind.Ore) return sim.ext[node].amount > 0;
  if (k === Kind.Structure) return sim.owner[node] === sim.owner[id] && !!sim.sdef(node).isExtractor && sim.built[node] === 1 && sim.ext[node].amount > 0;
  return false;
}

function findNode(sim: Sim, id: number, x: number, y: number, flux: boolean, maxD: number, exclude = -1): number {
  let best = -1, bd = 1e9;
  for (let j = 1; j < sim.nextId; j++) {
    if (j === exclude || !validNode(sim, id, j)) continue;
    if ((sim.kind[j] === Kind.Structure) !== flux) continue;
    const d = Math.hypot(sim.x[j] - x, sim.y[j] - y) + (sim.ext[j].miner > 0 ? 3 : 0);
    if (d < bd && d < maxD) { bd = d; best = j; }
  }
  return best;
}

export function nearestDropoff(sim: Sim, owner: number, x: number, y: number): number {
  let best = -1, bd = 1e9;
  for (let j = 1; j < sim.nextId; j++) {
    if (!sim.alive[j] || sim.owner[j] !== owner || sim.kind[j] !== Kind.Structure || !sim.built[j] || !sim.sdef(j).isDropoff) continue;
    const d = Math.hypot(sim.x[j] - x, sim.y[j] - y);
    if (d < bd) { bd = d; best = j; }
  }
  return best;
}

function minerValid(sim: Sim, node: number): boolean {
  const m = sim.ext[node].miner;
  if (m <= 0) return false;
  if (!sim.alive[m]) return false;
  const me = sim.ext[m];
  return me.gatherNode === node && (me.phase === 'mining');
}

function doGather(sim: Sim, id: number, o: Extract<Order, { t: 'gather' }>) {
  const e = sim.ext[id];
  let node = o.target;
  if (!validNode(sim, id, node)) {
    const wasFlux = node > 0 && sim.kind[node] === Kind.Structure;
    const alt = findNode(sim, id, sim.x[node] || sim.x[id], sim.y[node] || sim.y[id], wasFlux, 14);
    if (alt < 0) {
      if (e.carryAmount > 0 && e.phase !== 'toDrop') e.phase = 'toDrop';
      if (e.carryAmount <= 0) { nextOrder(sim, id); return; }
    } else { o.target = node = alt; if (e.phase === 'mining' || e.phase === 'waiting') e.phase = 'toNode'; }
  }
  const isFlux = node > 0 && sim.kind[node] === Kind.Structure;
  if (e.phase === 'none') e.phase = e.carryAmount > 0 ? 'toDrop' : 'toNode';
  if (e.carryAmount > 0 && e.phase === 'toNode' && ((isFlux && e.carry === 'ore') || (!isFlux && e.carry === 'flux'))) e.phase = 'toDrop';
  switch (e.phase) {
    case 'toNode': {
      if (e.carryAmount >= 4) { e.phase = 'toDrop'; break; }
      if (moveToEntity(sim, id, node, 0.35)) {
        e.gatherNode = node;
        if (!minerValid(sim, node)) { sim.ext[node].miner = id; e.phase = 'mining'; e.phaseTicks = 32; }
        else { e.phase = 'waiting'; e.phaseTicks = 0; }
      }
      break;
    }
    case 'waiting': {
      e.hasGoal = false;
      e.phaseTicks++;
      if (!minerValid(sim, node)) { sim.ext[node].miner = id; e.gatherNode = node; e.phase = 'mining'; e.phaseTicks = 32; break; }
      if (e.phaseTicks > 14 && !isFlux) {
        const alt = findNode(sim, id, sim.x[node], sim.y[node], false, 9, node);
        if (alt > 0 && !minerValid(sim, alt)) { o.target = alt; e.phase = 'toNode'; }
        else e.phaseTicks = 0;
      }
      break;
    }
    case 'mining': {
      e.hasGoal = false;
      const dx = sim.x[node] - sim.x[id], dy = sim.y[node] - sim.y[id];
      const l = Math.hypot(dx, dy) || 1; sim.fx[id] = dx / l; sim.fy[id] = dy / l;
      if (--e.phaseTicks <= 0) {
        const ne = sim.ext[node];
        const bonus = sim.tick >= LATE_GAME_TICK ? 1.15 : 1;
        const base = isFlux ? 4 : 5;
        const take = Math.min(ne.amount, base);
        ne.amount -= take;
        e.carry = isFlux ? 'flux' : 'ore';
        e.carryAmount = take * bonus;
        ne.miner = -1;
        e.phase = 'toDrop';
        if (ne.amount <= 0) depleted(sim, id, node);
      }
      break;
    }
    case 'toDrop': {
      const drop = nearestDropoff(sim, sim.owner[id], sim.x[id], sim.y[id]);
      if (drop < 0) { e.hasGoal = false; break; }
      if (moveToEntity(sim, id, drop, 0.45)) {
        const p = sim.players[sim.owner[id]];
        if (e.carry === 'ore') { p.ore += e.carryAmount; p.stats.oreCollected += e.carryAmount; }
        else if (e.carry === 'flux') { p.flux += e.carryAmount; p.stats.fluxCollected += e.carryAmount; }
        sim.events.push({ type: 'deposit', id, owner: sim.owner[id], kind: e.carry, value: e.carryAmount, x: sim.x[id], y: sim.y[id] });
        e.carry = ''; e.carryAmount = 0;
        e.phase = 'toNode';
      }
      break;
    }
    default: e.phase = 'toNode';
  }
}

function depleted(sim: Sim, worker: number, node: number) {
  const owner = sim.owner[worker];
  if (sim.kind[node] === Kind.Ore) {
    const base = sim.ext[node].base;
    sim.kill(node);
    let left = 0;
    for (let j = 1; j < sim.nextId; j++) if (sim.alive[j] && sim.kind[j] === Kind.Ore && sim.ext[j].base === base) left++;
    if (left === 0) sim.alert(owner, 'depleted', 'Prism Ore field depleted — expand!', sim.x[node], sim.y[node]);
  } else sim.alert(owner, 'depleted', 'Flux vent exhausted', sim.x[node], sim.y[node]);
}

function rectDist(x: number, y: number, tx: number, ty: number, size: number) {
  const cx = tx + size / 2, cy = ty + size / 2, h = size / 2;
  return Math.hypot(Math.max(Math.abs(x - cx) - h, 0), Math.max(Math.abs(y - cy) - h, 0));
}

function finishBuild(sim: Sim, id: number) {
  const e = sim.ext[id];
  const resume = e.resumeGather;
  nextOrder(sim, id);
  e.buildSite = -1;
  if (!e.orders.length && resume > 0 && validNode(sim, id, resume)) sim.pushOrder(id, { t: 'gather', target: resume }, false);
  else if (!e.orders.length && resume > 0) {
    const alt = findNode(sim, id, sim.x[id], sim.y[id], false, 16);
    if (alt > 0) sim.pushOrder(id, { t: 'gather', target: alt }, false);
  }
}

function doBuild(sim: Sim, id: number, o: Extract<Order, { t: 'build' }>) {
  const e = sim.ext[id];
  const d = STRUCTURES[o.def];
  const owner = sim.owner[id];
  if (e.phase === 'constructing' || e.phase === 'planting') {
    const site = e.buildSite;
    if (!(site > 0 && sim.alive[site]) || sim.built[site]) { finishBuild(sim, id); return; }
    if (e.phase === 'planting') {
      e.hasGoal = false;
      if (--e.phaseTicks <= 0) { sim.ext[site].builder = -2; finishBuild(sim, id); }
      return;
    }
    if (sim.edgeDist(id, site) > 1.2 && !moveToEntity(sim, id, site, 0.6)) return;
    e.hasGoal = false;
    sim.ext[site].builder = id;
    const dx = sim.x[site] - sim.x[id], dy = sim.y[site] - sim.y[id];
    const l = Math.hypot(dx, dy) || 1; sim.fx[id] = dx / l; sim.fy[id] = dy / l;
    advanceConstruction(sim, site);
    if (sim.tick % 8 === 0) sim.events.push({ type: 'construct', id, target: site, owner, x: sim.x[id], y: sim.y[id] });
    if (sim.built[site]) finishBuild(sim, id);
    return;
  }
  // travelling to the site
  const rd = rectDist(sim.x[id], sim.y[id], o.tx, o.ty, d.size);
  if (rd > 1.1) {
    const cells = sim.footprint(o.tx, o.ty, d.size);
    const blocked = cells.some((c) => sim.nav.occ[c]);
    if (!moveTo(sim, id, o.tx + d.size / 2, o.ty + d.size / 2, -1, 'b' + o.tx + ',' + o.ty + ',' + d.size + (blocked ? 'x' : ''), () => ringSeeds(sim, cells))) return;
  }
  const p = sim.players[owner];
  const pl = sim.checkPlacement(owner, d.id, o.tx, o.ty, id);
  if (!pl.ok) { sim.alert(owner, 'invalid', `Cannot build ${d.name}: ${pl.reason}`, o.tx, o.ty); finishBuild(sim, id); return; }
  if (sim.missingRequirements(owner, d.requires).length) { sim.alert(owner, 'invalid', `Cannot build ${d.name}: missing prerequisite`); finishBuild(sim, id); return; }
  if (p.ore < d.cost.ore || p.flux < d.cost.flux) { sim.alert(owner, 'resources', p.ore < d.cost.ore ? 'Not enough Prism Ore' : 'Not enough Flux', sim.x[id], sim.y[id]); finishBuild(sim, id); return; }
  p.ore -= d.cost.ore; p.flux -= d.cost.flux;
  const site = sim.spawnStructure(d.id, owner, o.tx, o.ty, false);
  e.buildSite = site;
  e.hasGoal = false;
  sim.ext[site].builder = id;
  if (FACTIONS[p.faction].selfGrowingStructures) { e.phase = 'planting'; e.phaseTicks = 30; }
  else e.phase = 'constructing';
  sim.events.push({ type: 'construct', id, target: site, owner, x: sim.x[id], y: sim.y[id], kind: 'start' });
}

function doRepair(sim: Sim, id: number, o: Extract<Order, { t: 'repair' }>) {
  const t = o.target;
  const e = sim.ext[id];
  if (!(t > 0 && sim.alive[t]) || (sim.built[t] && sim.hp[t] >= sim.maxHp[t])) { nextOrder(sim, id); return; }
  if (sim.edgeDist(id, t) > 1.2 && !moveToEntity(sim, id, t, 0.5)) return;
  e.hasGoal = false;
  const dx = sim.x[t] - sim.x[id], dy = sim.y[t] - sim.y[id];
  const l = Math.hypot(dx, dy) || 1; sim.fx[id] = dx / l; sim.fy[id] = dy / l;
  if (!sim.built[t] && sim.kind[t] === Kind.Structure) {
    const se = sim.ext[t];
    if (se.builder === -2) { nextOrder(sim, id); return; }
    se.builder = id;
    advanceConstruction(sim, t);
    if (sim.built[t]) nextOrder(sim, id);
    return;
  }
  const rate = sim.kind[t] === Kind.Structure ? 0.5 : 0.3;
  sim.hp[t] = Math.min(sim.maxHp[t], sim.hp[t] + rate);
  if (sim.tick % 8 === 0) sim.events.push({ type: 'heal', id: t, owner: sim.owner[id], x: sim.x[t], y: sim.y[t], kind: 'weld' });
}

function doCapture(sim: Sim, id: number, o: Extract<Order, { t: 'capture' }>) {
  const t = o.target;
  if (!(t > 0 && sim.alive[t])) { nextOrder(sim, id); return; }
  const pe = sim.ext[t];
  if (pe.captureOwner === sim.owner[id] && !pe.contested) { nextOrder(sim, id); return; }
  if (sim.dist(id, t) > 2.6) moveTo(sim, id, sim.x[t], sim.y[t], 2.2, 'e' + t, () => ringSeeds(sim, pe.cells));
  else sim.ext[id].hasGoal = false;
}

// ------------------------------------------------------------------ abilities

function nearGrove(sim: Sim, id: number): number {
  for (const s of sim.structuresOf(sim.owner[id])) {
    if (!sim.built[s]) continue;
    const sd = sim.sdef(s);
    if ((sd.isHQ || sd.id === 'root_node') && sim.edgeDist(id, s) < 6) return s;
  }
  return -1;
}

function doAbility(sim: Sim, id: number, o: Extract<Order, { t: 'ability' }>) {
  const ab = ABILITIES[o.ability];
  const e = sim.ext[id];
  const owner = sim.owner[id];
  const p = sim.players[owner];
  if (!ab) { nextOrder(sim, id); return; }
  const tgt = o.target;
  const hasT = tgt > 0 && sim.alive[tgt] === 1;
  if (ab.target === 'unit' && !hasT) { nextOrder(sim, id); return; }
  const tx = hasT ? sim.x[tgt] : o.x, ty = hasT ? sim.y[tgt] : o.y;
  if (ab.id !== 'rootstep') {
    const d = hasT ? sim.edgeDist(id, tgt) : Math.hypot(tx - sim.x[id], ty - sim.y[id]);
    if (d > ab.range) {
      if (hasT) moveToEntity(sim, id, tgt, ab.range * 0.9); else moveTo(sim, id, tx, ty, ab.range * 0.9);
      return;
    }
  }
  e.hasGoal = false;
  const fail = (msg: string) => { sim.alert(owner, 'invalid', msg, sim.x[id], sim.y[id]); nextOrder(sim, id); };
  if (sim.tick < e.silencedUntil) return fail('Silenced');
  if ((e.abilityReady[ab.id] ?? 0) > sim.tick) return fail(`${ab.name} is cooling down`);
  if (ab.energy && e.energy < ab.energy) return fail('Not enough energy');
  if (ab.cost && (p.ore < ab.cost.ore || p.flux < ab.cost.flux)) return fail('Not enough Flux');
  switch (ab.id) {
    case 'emergency_weld': {
      if (sim.kind[tgt] !== Kind.Structure || sim.owner[tgt] !== owner) return fail('Target a friendly structure');
      sim.ext[tgt].regenTicks = 80; sim.ext[tgt].regenPerTick = 60 / 80;
      break;
    }
    case 'sensor_spike': {
      const s = spawnSpike(sim, owner, tx, ty);
      if (s < 0) return fail('Cannot place a sensor there');
      break;
    }
    case 'rootstep': {
      const from = nearGrove(sim, id);
      if (from < 0) return fail('Rootstep: stand near a friendly grove');
      if (!(sim.kind[tgt] === Kind.Structure && sim.owner[tgt] === owner && sim.built[tgt] && (sim.sdef(tgt).isHQ || sim.sdef(tgt).id === 'root_node')) || tgt === from) return fail('Rootstep: target another friendly grove');
      const c = sim.nav.nearestPassable(Math.floor(sim.x[tgt] + sim.sdef(tgt).size / 2 + 1), Math.floor(sim.y[tgt]), 8);
      if (c < 0) return fail('No room at the destination grove');
      sim.events.push({ type: 'ability', id, owner, kind: 'rootstep', x: sim.x[id], y: sim.y[id], x2: (c % sim.map.size) + 0.5, y2: ((c / sim.map.size) | 0) + 0.5 });
      sim.x[id] = sim.px[id] = (c % sim.map.size) + 0.5; sim.y[id] = sim.py[id] = ((c / sim.map.size) | 0) + 0.5;
      break;
    }
    case 'mend_spores':
      sim.zones.push({ id: sim.zones.length + sim.tick * 8, owner, kind: 'mend', x: tx, y: ty, r: ab.radius ?? 3, start: sim.tick, end: sim.tick + 100 });
      break;
    case 'silence_patch':
      sim.zones.push({ id: sim.zones.length + sim.tick * 8, owner, kind: 'silence', x: tx, y: ty, r: ab.radius ?? 2.6, start: sim.tick + 24, end: sim.tick + 24 + 60 });
      break;
  }
  if (ab.energy) e.energy -= ab.energy;
  if (ab.cost) { p.ore -= ab.cost.ore; p.flux -= ab.cost.flux; }
  e.abilityReady[ab.id] = sim.tick + ab.cooldown;
  if (ab.id !== 'rootstep') sim.events.push({ type: 'ability', id, owner, kind: ab.id, x: tx, y: ty, radius: ab.radius, target: tgt });
  nextOrder(sim, id);
}

function spawnSpike(sim: Sim, owner: number, x: number, y: number): number {
  if (x < 2 || y < 2 || x > sim.map.size - 2 || y > sim.map.size - 2) return -1;
  // spikes are lightweight entities: reuse the unit lifecycle for hp/visibility
  const id = sim.spawnUnit('kestrel', owner, x, y); // temporary def for allocation
  sim.kind[id] = Kind.Spike;
  sim.hp[id] = sim.maxHp[id] = 20;
  sim.radius[id] = 0.3;
  sim.x[id] = sim.px[id] = x; sim.y[id] = sim.py[id] = y;
  const e = sim.ext[id];
  e.cloaked = true;
  e.expires = sim.tick + 400;
  sim.events.pop(); // drop the synthetic unit spawn event
  sim.events.push({ type: 'spawn', id, owner, def: 'sensor_spike', x, y });
  return id;
}

void ringSeeds;
