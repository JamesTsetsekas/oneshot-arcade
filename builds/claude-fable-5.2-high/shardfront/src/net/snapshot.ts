// network-protocol: fog-filtered state snapshots. An authoritative server would send exactly this to a client:
// its own entities, enemies it can currently see, last-known structure ghosts - never hidden enemy transforms.
import { NEUTRAL, type Sim } from '../sim/sim';

export interface EntitySnap { id: number; def: number; owner: number; x: number; z: number; hp: number; flags: number }
export interface Snapshot {
  tick: number;
  player: number;
  ore: number; flux: number; supplyUsed: number; supplyCap: number;
  entities: EntitySnap[];
  ghosts: { id: number; def: number; x: number; z: number; tick: number }[];
  hash: number;
}

export function buildFilteredSnapshot(sim: Sim, player: number): Snapshot {
  const ps = sim.players[player];
  const entities: EntitySnap[] = [];
  for (const e of sim.ids) {
    if (!sim.alive[e]) continue;
    const o = sim.owner[e];
    if (o !== player && o !== NEUTRAL && !ps.visible[sim.visIndex(sim.x[e], sim.z[e])]) continue;
    if (o === NEUTRAL && !ps.explored[sim.visIndex(sim.x[e], sim.z[e])]) continue;
    entities.push({ id: e, def: sim.def[e], owner: o, x: Math.round(sim.x[e] * 64) / 64, z: Math.round(sim.z[e] * 64) / 64, hp: Math.ceil(sim.hp[e]), flags: sim.flags[e] });
  }
  const ghosts = [...ps.ghosts.values()].filter((g) => !ps.visible[sim.visIndex(g.x, g.z)]).map((g) => ({ id: g.id, def: g.def, x: g.x, z: g.z, tick: g.tick }));
  return { tick: sim.tick, player, ore: Math.floor(ps.ore), flux: Math.floor(ps.flux), supplyUsed: ps.supplyUsed, supplyCap: ps.supplyCap, entities, ghosts, hash: sim.hash() };
}
