/**
 * World rules: lane waves, minion AI, structures (towers/Seals/Cores/Engine), jungle monsters,
 * neutral objectives, respawns and victory. Operates on a Sim instance.
 */
import {
  CATALYST_RESPAWN, CATALYST_SPAWN, COLOSSUS_RESPAWN, COLOSSUS_SPAWN, DT, SEAL_RESPAWN, WAVE_FIRST, WAVE_PERIOD,
} from '../shared/content';
import { dist } from '../shared/math';
import { CAMPS, STRUCTURES, TEAM_BASE, laneFor, type CampDef, type StructureDef } from '../shared/map';
import type { MinionType, Team, Unit } from './types';
import type { Sim } from './sim';

interface StructStats { hp: number; ad: number; armor: number; ward: number; range: number; radius: number; asec: number }
const STRUCT_STATS: Record<string, StructStats> = {
  outer: { hp: 1300, ad: 140, armor: 45, ward: 45, range: 9.5, radius: 1.6, asec: 1.1 },
  inner: { hp: 1500, ad: 152, armor: 50, ward: 50, range: 9.5, radius: 1.7, asec: 1.1 },
  guard: { hp: 1700, ad: 165, armor: 55, ward: 55, range: 9.8, radius: 1.8, asec: 1.05 },
  seal: { hp: 1400, ad: 0, armor: 60, ward: 60, range: 0, radius: 1.9, asec: 1 },
  core: { hp: 1900, ad: 190, armor: 60, ward: 60, range: 10, radius: 1.9, asec: 1.0 },
  engine: { hp: 2400, ad: 0, armor: 50, ward: 50, range: 0, radius: 2.8, asec: 1 },
};
export const TEAM_NAMES = ['Tidewatch', 'Cinderguard'];

interface MinionStats { hp: number; ad: number; armor: number; range: number; as: number; ms: number; radius: number; gold: number; xp: number; wind: number; proj: number }
const MINION: Record<MinionType, MinionStats> = {
  guard: { hp: 340, ad: 17, armor: 10, range: 1.5, as: 0.9, ms: 3.1, radius: 0.5, gold: 21, xp: 38, wind: 0.25, proj: 0 },
  bolt: { hp: 235, ad: 23, armor: 0, range: 6.0, as: 0.85, ms: 3.1, radius: 0.45, gold: 15, xp: 30, wind: 0.3, proj: 16 },
  siege: { hp: 580, ad: 48, armor: 22, range: 8.2, as: 0.45, ms: 2.8, radius: 0.7, gold: 42, xp: 64, wind: 0.4, proj: 14 },
  vanguard: { hp: 1350, ad: 62, armor: 28, range: 1.9, as: 0.7, ms: 3.2, radius: 0.85, gold: 70, xp: 96, wind: 0.3, proj: 0 },
};

interface MonsterSpec { name: string; hp: number; ad: number; armor: number; range: number; as: number; ms: number; radius: number; gold: number; xp: number; proj: number; big?: boolean }
const FAMILIES: Record<string, MonsterSpec[]> = {
  hounds: [0, 1, 2].map(() => ({ name: 'Mirehound', hp: 270, ad: 22, armor: 6, range: 1.5, as: 0.9, ms: 3.8, radius: 0.5, gold: 26, xp: 40, proj: 0 })),
  crag: [{ name: 'Cragback', hp: 720, ad: 36, armor: 20, range: 2, as: 0.7, ms: 3.0, radius: 0.95, gold: 55, xp: 80, proj: 0, big: true }, { name: 'Crag Pup', hp: 300, ad: 20, armor: 8, range: 1.6, as: 0.85, ms: 3.4, radius: 0.55, gold: 22, xp: 36, proj: 0 }],
  wisps: [0, 1, 2].map(() => ({ name: 'Glowwisp', hp: 210, ad: 24, armor: 2, range: 5.2, as: 0.85, ms: 3.2, radius: 0.45, gold: 26, xp: 38, proj: 13 })),
  thorn: [{ name: 'Thornback', hp: 620, ad: 32, armor: 18, range: 1.9, as: 0.75, ms: 3.1, radius: 0.9, gold: 50, xp: 72, proj: 0, big: true }, { name: 'Thornling', hp: 230, ad: 18, armor: 4, range: 1.5, as: 0.9, ms: 3.5, radius: 0.45, gold: 18, xp: 30, proj: 0 }, { name: 'Thornling', hp: 230, ad: 18, armor: 4, range: 1.5, as: 0.9, ms: 3.5, radius: 0.45, gold: 18, xp: 30, proj: 0 }],
  heartroot: [{ name: 'Heartroot Elder', hp: 1100, ad: 46, armor: 26, range: 2.2, as: 0.7, ms: 3.0, radius: 1.15, gold: 95, xp: 150, proj: 0, big: true }],
  cinder: [{ name: 'Cinder Warden', hp: 1000, ad: 52, armor: 22, range: 5.5, as: 0.7, ms: 3.0, radius: 1.1, gold: 95, xp: 150, proj: 14, big: true }],
  catalyst: [{ name: 'Twin Catalyst', hp: 3000, ad: 78, armor: 32, range: 3.2, as: 0.6, ms: 2.8, radius: 1.7, gold: 0, xp: 220, proj: 0, big: true }],
  colossus: [{ name: 'Aether Colossus', hp: 7000, ad: 118, armor: 48, range: 4.2, as: 0.55, ms: 2.8, radius: 2.5, gold: 0, xp: 400, proj: 0, big: true }],
};
const OFFSETS = [[0, 0], [1.4, 1.0], [-1.4, 1.0], [0, -1.6]];

interface CampRt { def: CampDef; members: Unit[]; respawnAt: number; spawned: boolean }

export class Rules {
  structures = new Map<string, Unit>();
  camps: CampRt[] = [];
  nextWave = WAVE_FIRST;
  waveNo = 0;
  sealRespawnAt: Record<string, number> = {};
  sealDefs = new Map<string, StructureDef>();
  alerted = new Map<number, number>();
  private towerBuf: Unit[] = [];

  constructor(private sim: Sim) {}

  init() {
    for (const d of STRUCTURES) this.spawnStructure(d);
    for (const c of CAMPS) this.camps.push({ def: c, members: [], respawnAt: c.kind === 'catalyst' ? CATALYST_SPAWN : c.kind === 'colossus' ? COLOSSUS_SPAWN : 30, spawned: false });
  }

  spawnStructure(d: StructureDef) {
    const sim = this.sim;
    const s = STRUCT_STATS[d.type];
    const kind = d.type === 'seal' ? 'seal' : d.type === 'engine' ? 'engine' : d.type === 'core' ? 'core' : 'tower';
    const u = sim.blank(kind, d.team, d.type === 'outer' ? 'Outer Tower' : d.type === 'inner' ? 'Inner Tower' : d.type === 'guard' ? 'Seal Guard Tower' : d.type === 'seal' ? 'Seal' : d.type === 'core' ? 'Core Tower' : 'Crown Engine', d.x, d.z, s.radius);
    u.stype = d.type; u.defId = d.id; u.lane = d.lane;
    u.maxHp = s.hp; u.hp = s.hp; u.ad = s.ad; u.armor = s.armor; u.ward = s.ward; u.range = s.range; u.as = 1 / s.asec; u.vision = d.type === 'engine' || d.type === 'seal' ? 8 : 12;
    u.invuln = d.type === 'seal' || d.type === 'engine' || d.type === 'core' ? true : false;
    u.facing = d.team === 0 ? 0 : Math.PI;
    this.structures.set(d.id, u);
    this.sealDefs.set(d.id, d);
    return u;
  }

  hasAlliedMinionNear(s: Unit): boolean {
    for (const u of this.sim.units) {
      if (u.dead || u.team !== s.team || u.kind !== 'minion') continue;
      const dx = u.x - s.x, dz = u.z - s.z;
      if (dx * dx + dz * dz < 14 * 14) return true;
    }
    return false;
  }

  // ------------------------------------------------------------ per tick
  step() {
    const sim = this.sim;
    const now = sim.time;
    if (sim.winner >= 0) return;
    // waves
    if (now >= this.nextWave) { this.spawnWave(); this.nextWave += WAVE_PERIOD; }
    this.updateInvulnerability();
    // minion AI staggered
    const tickPhase = sim.tick % 5;
    for (const u of sim.units) {
      if (u.dead) continue;
      if (u.kind === 'minion') { if ((u.id % 5) === tickPhase) this.minionAI(u); }
      else if (u.kind === 'monster') { if ((u.id % 3) === sim.tick % 3) this.monsterAI(u); }
      else if (u.kind === 'tower' || u.kind === 'core') this.towerAI(u);
    }
    // camps
    this.stepCamps();
    // respawn heroes
    for (const h of sim.heroes) if (h.dead && now >= h.hero!.respawnAt) sim.heroRespawn(h);
    // fountain laser
    if (sim.tick % 5 === 0) {
      for (const h of sim.heroes) {
        if (h.dead) continue;
        const f = TEAM_BASE[(1 - h.team) as 0 | 1].fountain;
        if (dist(h.x, h.z, f.x, f.z) < 8) sim.damage(null, h, 140, 'pure', { label: 'Fountain' });
      }
    }
    // seal respawns
    for (const id of Object.keys(this.sealRespawnAt)) {
      if (now >= this.sealRespawnAt[id]) {
        delete this.sealRespawnAt[id];
        const d = this.sealDefs.get(id)!;
        const u = this.spawnStructure(d);
        u.sealRespawns = 1;
        sim.teams[d.team].sealDown[d.lane] = false;
        sim.teams[(1 - d.team) as 0 | 1].vanguardLane[d.lane] = false;
        sim.emit({ t: 'announce', text: `${TEAM_NAMES[d.team]}'s Seal has re-formed`, team: d.team, priority: 2, sound: 'seal' });
      }
    }
    // structure under-attack alerts
    if (sim.tick % 10 === 0) {
      for (const s of this.structures.values()) {
        if (s.dead || now - s.lastHeroDamagedAt > 1.2) continue;
        const last = this.alerted.get(s.id) ?? -99;
        if (now - last > 12) {
          this.alerted.set(s.id, now);
          sim.emit({ t: 'announce', text: `${TEAM_NAMES[s.team]} ${s.name} under attack`, team: s.team, priority: 1, sound: 'alert' });
        }
      }
    }
  }

  private updateInvulnerability() {
    const sim = this.sim;
    for (const team of [0, 1] as const) {
      const pre = team === 0 ? 'b' : 'r';
      for (let lane = 0; lane < 2; lane++) {
        const seal = this.structures.get(`${pre}-seal-${lane}`);
        const guard = this.structures.get(`${pre}-guard-${lane}`);
        if (seal && !seal.dead) seal.invuln = !!(guard && !guard.dead);
      }
      const anySealDown = sim.teams[team].sealDown[0] || sim.teams[team].sealDown[1];
      const cores = [0, 1].map((i) => this.structures.get(`${pre}-core-${i}`)!).filter(Boolean);
      for (const c of cores) if (!c.dead) c.invuln = !anySealDown;
      const engine = this.structures.get(`${pre}-engine`);
      if (engine && !engine.dead) engine.invuln = cores.some((c) => !c.dead);
    }
  }

  // ------------------------------------------------------------ waves & minions
  spawnWave() {
    const sim = this.sim;
    this.waveNo++;
    const n = this.waveNo;
    const siege = n % 3 === 0;
    for (const team of [0, 1] as const) {
      for (let lane = 0; lane < 2; lane++) {
        const types: MinionType[] = ['guard', 'guard', 'guard', 'bolt', 'bolt', 'bolt'];
        if (siege) types.push('siege');
        if (sim.teams[team].vanguardLane[lane]) types.unshift('vanguard');
        types.forEach((t, i) => sim.after(i * 0.6, () => { if (sim.winner < 0) this.spawnMinion(team, lane, t); }));
      }
    }
    sim.teams[0].wavesSpawned++; sim.teams[1].wavesSpawned++;
  }

  private pathCache = new Map<string, { x: number; z: number }[]>();
  /** lane waypoints for a team, extended through the enemy base so waves keep pressing */
  pathFor(team: 0 | 1, lane: number) {
    const key = `${team}-${lane}`;
    let p = this.pathCache.get(key);
    if (!p) {
      const base = laneFor(team, lane);
      const eb = TEAM_BASE[(1 - team) as 0 | 1];
      const last = base[base.length - 1];
      const core = eb.cores.slice().sort((a, c) => dist(a.x, a.z, last.x, last.z) - dist(c.x, c.z, last.x, last.z))[0];
      p = [...base, { x: (core.x + last.x) / 2, z: (core.z + last.z) / 2 }, eb.engine];
      this.pathCache.set(key, p);
    }
    return p;
  }

  spawnMinion(team: Team, lane: number, type: MinionType) {
    const sim = this.sim;
    const path = this.pathFor(team as 0 | 1, lane);
    const st = MINION[type];
    const min = sim.time / 60;
    const late = Math.max(0, min - 10);
    const hpScale = 1 + 0.02 * min + 0.06 * late, adScale = 1 + 0.014 * min + 0.08 * late;
    const jitter = (sim.rng.next() - 0.5) * 2.2;
    const u = sim.blank('minion', team, type === 'guard' ? 'Guard' : type === 'bolt' ? 'Bolt' : type === 'siege' ? 'Siege' : 'Vanguard', path[0].x + jitter * 0.5, path[0].z + jitter, st.radius);
    u.mtype = type; u.lane = lane; u.wpath = path; u.wp = 1;
    u.maxHp = Math.round(st.hp * hpScale); u.hp = u.maxHp;
    u.baseAd = st.ad * adScale; u.ad = u.baseAd; u.baseAr = st.armor; u.armor = st.armor; u.ward = 0; u.baseWd = 0;
    u.range = st.range; u.as = st.as; u.baseMs = st.ms; u.ms = st.ms; u.windup = st.wind; u.projSpeed = st.proj;
    u.gold = st.gold + Math.floor(min * 0.4); u.xp = st.xp; u.vision = type === 'siege' ? 8 : 7;
    u.facing = Math.atan2(path[1].z - path[0].z, path[1].x - path[0].x);
    sim.setOrder(u, 'move', path[1].x, path[1].z);
    return u;
  }

  private pickMinionTarget(m: Unit): Unit | null {
    const sim = this.sim;
    const now = sim.time;
    const aggro = m.range > 3 ? 8 : 7;
    let best: Unit | null = null, bs = Infinity;
    for (const t of sim.units) {
      if (t.dead || t.team === m.team || t.team === 2 || t.invuln || t.kind === 'ward') continue;
      const d = dist(m.x, m.z, t.x, t.z);
      if (d > aggro + t.radius) continue;
      if (!sim.canSee(m.team, t)) continue;
      let s = d;
      if (t.kind === 'hero') {
        const aggroed = t.hero!.aggroUntil[m.team as 0 | 1] > now;
        if (!aggroed && d > 4.5) continue;
        s += aggroed ? -12 : 5;
      } else if (t.stype) {
        if (d > m.range + t.radius + 1.2) continue;
        s += 10;
      } else if (t.kind === 'decoy') s += 6;
      if (s < bs) { bs = s; best = t; }
    }
    return best;
  }

  private minionAI(m: Unit) {
    const sim = this.sim;
    const path = m.wpath!;
    while (m.wp < path.length - 1 && dist(m.x, m.z, path[m.wp].x, path[m.wp].z) < 2.6) m.wp++;
    if (sim.teams[m.team as 0 | 1].colossusUntil > sim.time) {
      if (m.scale === 1) { m.scale = 1.3; m.maxHp = Math.round(m.maxHp * 1.25); m.hp = Math.min(m.maxHp, m.hp + m.maxHp * 0.2); }
      sim.addEffect(m, 'mod', 0.6, 0, 0, { mods: { ad: m.baseAd * 0.3, armor: 12 }, tag: 'colossus' });
    } else if (m.scale !== 1) { m.scale = 1; }
    if (sim.isStunned(m)) return;
    let t = m.order.t === 'attack' ? sim.byId.get(m.order.target) : undefined;
    if (t && (t.dead || t.team === m.team || !sim.canSee(m.team, t) || (dist(m.x, m.z, t.x, t.z) > 11 && !t.stype) || t.invuln)) t = undefined;
    // re-evaluate for better targets (e.g., an aggro'd hero) periodically
    const better = this.pickMinionTarget(m);
    if (better && (!t || (better.kind === 'hero' && t.kind !== 'hero' && better.hero!.aggroUntil[m.team as 0 | 1] > sim.time))) t = better;
    if (!t && m.wp >= path.length - 1) {
      // lane finished: press on to the nearest vulnerable enemy structure
      let bd = 1e9;
      for (const s of this.structures.values()) {
        if (s.dead || s.team === m.team || s.invuln) continue;
        const d = dist(m.x, m.z, s.x, s.z);
        if (d < bd) { bd = d; t = s; }
      }
    }
    if (t) { if (m.order.t !== 'attack' || m.order.target !== t.id) sim.setOrder(m, 'attack', 0, 0, t.id); }
    else sim.setOrder(m, 'move', path[m.wp].x, path[m.wp].z);
  }

  // ------------------------------------------------------------ towers
  private towerAI(t: Unit) {
    const sim = this.sim;
    const now = sim.time;
    if (t.invuln && t.stype === 'core') { /* still shoots */ }
    // select target every 4 ticks
    if (sim.tick % 4 === (t.id % 4)) this.towerSelect(t);
    if (now < t.tnext) return;
    const tg = sim.byId.get(t.ttarget);
    if (!tg || tg.dead) { t.ttarget = 0; return; }
    const d = dist(t.x, t.z, tg.x, tg.z);
    if (d > t.range + tg.radius) { t.ttarget = 0; return; }
    t.tnext = now + 1 / t.as;
    if (t.tlastTarget === tg.id) t.tramp = Math.min(5, t.tramp + 1); else { t.tramp = 0; t.tlastTarget = tg.id; }
    const dmg = t.ad * (1 + t.tramp * 0.15) * (tg.kind === 'minion' ? 0.85 : 1);
    sim.emit({ t: 'towerShot', tower: t.id, target: tg.id });
    sim.spawnProjectile({
      team: t.team, owner: t.id, x: t.x, z: t.z + 0, dx: tg.x - t.x, dz: tg.z - t.z, speed: 32, range: 99, homing: tg.id, kind: 'tower', radius: 0.3,
      color: t.team === 0 ? 0x70c8ff : 0xff8a60, size: 0.35, fx: 'tower',
      onHit: (_p, target) => sim.damage(t, target, dmg, 'physical', { label: t.name }),
    });
  }

  private towerSelect(t: Unit) {
    const sim = this.sim;
    const now = sim.time;
    const R = t.range;
    let best: Unit | null = null;
    // priority 1: hero that attacked an allied hero inside range
    let bd = 1e9;
    for (const h of sim.heroes) {
      if (h.dead || h.team === t.team || h.invuln) continue;
      if (h.hero!.aggroUntil[t.team as 0 | 1] <= now) continue;
      const d = dist(t.x, t.z, h.x, h.z);
      if (d <= R + h.radius && d < bd && sim.canSee(t.team, h)) { bd = d; best = h; }
    }
    if (best) { t.ttarget = best.id; return; }
    const cur = sim.byId.get(t.ttarget);
    if (cur && !cur.dead && cur.team !== t.team && dist(t.x, t.z, cur.x, cur.z) <= R + cur.radius && sim.canSee(t.team, cur) && !cur.invuln) {
      // stay on a hero only if no minions around, else prefer minions
      if (cur.kind !== 'hero') return;
    }
    bd = 1e9; best = null;
    for (const u of sim.units) {
      if (u.dead || u.team === t.team || u.team === 2 || u.kind === 'ward') continue;
      if (u.kind !== 'minion' && u.kind !== 'decoy') continue;
      const d = dist(t.x, t.z, u.x, u.z);
      if (d <= R + u.radius && d < bd && sim.canSee(t.team, u)) { bd = d; best = u; }
    }
    if (!best) {
      for (const h of sim.heroes) {
        if (h.dead || h.team === t.team || h.invuln) continue;
        const d = dist(t.x, t.z, h.x, h.z);
        if (d <= R + h.radius && d < bd && sim.canSee(t.team, h)) { bd = d; best = h; }
      }
    }
    t.ttarget = best ? best.id : 0;
    if (!best) t.tramp = 0;
  }

  // ------------------------------------------------------------ jungle
  private stepCamps() {
    const sim = this.sim;
    const now = sim.time;
    for (const c of this.camps) {
      if (!c.spawned && now >= c.respawnAt) this.spawnCamp(c);
      else if (c.spawned && c.members.every((m) => m.dead)) {
        c.spawned = false; c.members = [];
        const delay = c.def.kind === 'small' ? 75 : c.def.kind === 'buff' ? 120 : c.def.kind === 'catalyst' ? CATALYST_RESPAWN : COLOSSUS_RESPAWN;
        c.respawnAt = now + delay;
      }
    }
  }

  private spawnCamp(c: CampRt) {
    const sim = this.sim;
    const fam = FAMILIES[c.def.family];
    c.spawned = true;
    const min = sim.time / 60;
    const scale = 1 + 0.012 * min;
    c.members = fam.map((spec, i) => {
      const o = OFFSETS[i % OFFSETS.length];
      const sc = spec.big ? 1.6 : 1;
      const u = sim.blank('monster', 2, spec.name, c.def.x + o[0] * sc, c.def.z + o[1] * sc, spec.radius);
      u.maxHp = Math.round(spec.hp * scale); u.hp = u.maxHp;
      u.baseAd = spec.ad * scale; u.ad = u.baseAd; u.baseAr = spec.armor; u.armor = spec.armor; u.baseWd = spec.armor * 0.6; u.ward = u.baseWd;
      u.range = spec.range; u.as = spec.as; u.baseMs = spec.ms; u.ms = spec.ms; u.projSpeed = spec.proj; u.windup = 0.32;
      u.gold = spec.gold; u.xp = spec.xp; u.vision = 0; u.lane = i;
      u.camp = { id: c.def.id, kind: c.def.kind, hx: u.x, hz: u.z, leash: c.def.kind === 'colossus' ? 12 : c.def.kind === 'catalyst' ? 9 : 11, family: c.def.family, team: c.def.team, member: i, engaged: false, target: 0, resetUntil: 0 };
      u.facing = Math.atan2(-c.def.z, -c.def.x);
      return u;
    });
    if (c.def.kind === 'catalyst' || c.def.kind === 'colossus') {
      sim.emit({ t: 'announce', text: c.def.kind === 'colossus' ? 'The Aether Colossus has risen in the Mistwood' : `The ${c.def.id === 'catalyst-n' ? 'Northern' : 'Southern'} Catalyst has awoken`, team: 2, priority: 2, sound: 'objective' });
      sim.note(c.def.kind === 'colossus' ? 'Aether Colossus spawned' : 'Catalyst spawned', 2, 'objective');
    }
  }

  private lastAttacker(m: Unit): Unit | null {
    let best: Unit | null = null, bt = -1;
    for (const [id, t] of m.damagers) {
      if (t > bt) { const a = this.sim.byId.get(id); if (a && !a.dead) { bt = t; best = a; } }
    }
    return best && this.sim.time - bt < 3 ? best : null;
  }

  private monsterAI(m: Unit) {
    const sim = this.sim;
    const now = sim.time;
    const camp = m.camp!;
    if (sim.isStunned(m)) return;
    const home = dist(m.x, m.z, camp.hx, camp.hz);
    if (camp.resetUntil > now) {
      // resetting: walk home, heal
      sim.setOrder(m, 'move', camp.hx, camp.hz);
      m.hp = Math.min(m.maxHp, m.hp + m.maxHp * 0.06);
      if (home < 0.8) { camp.resetUntil = 0; camp.engaged = false; camp.target = 0; m.hp = m.maxHp; }
      return;
    }
    if (!camp.engaged) {
      if (now - m.lastDamagedAt < 0.6) {
        const a = this.lastAttacker(m);
        if (a) {
          // alert the whole camp
          const rt = this.camps.find((c) => c.def.id === camp.id);
          for (const mm of rt?.members ?? [m]) { if (!mm.dead && mm.camp) { mm.camp.engaged = true; mm.camp.target = a.id; } }
        }
      }
      return;
    }
    const tg = sim.byId.get(camp.target);
    const targetBad = !tg || tg.dead || dist(tg.x, tg.z, camp.hx, camp.hz) > camp.leash + 3 || (tg.team !== 2 && !sim.canSee(2, tg) && dist(m.x, m.z, tg.x, tg.z) > 9);
    if (targetBad || home > camp.leash) {
      // retarget to another recent attacker nearby before giving up
      const a = this.lastAttacker(m);
      if (a && !targetBad) { camp.target = a.id; }
      else {
        const alt = a && dist(a.x, a.z, camp.hx, camp.hz) < camp.leash ? a : null;
        if (alt) { camp.target = alt.id; sim.setOrder(m, 'attack', 0, 0, alt.id); return; }
        camp.resetUntil = now + 20; camp.target = 0; camp.engaged = false;
        sim.setOrder(m, 'move', camp.hx, camp.hz);
        return;
      }
    }
    if (m.order.t !== 'attack' || m.order.target !== camp.target) sim.setOrder(m, 'attack', 0, 0, camp.target);
  }

  teamOfLastDamager(m: Unit): Team | null {
    let bt = -1, team: Team | null = null;
    for (const [id, t] of m.damagers) {
      const a = this.sim.byId.get(id);
      if (!a || (a.team !== 0 && a.team !== 1)) continue;
      if (t > bt) { bt = t; team = a.team; }
    }
    return team;
  }

  onMonsterKilled(m: Unit, killerHero: Unit | null) {
    const sim = this.sim;
    const camp = m.camp;
    if (!camp) return;
    const team = killerHero ? killerHero.team : this.teamOfLastDamager(m);
    if (team === null) return;
    const rt = this.camps.find((c) => c.def.id === camp.id);
    const allDead = rt ? rt.members.filter((x) => x !== m).every((x) => x.dead) : true;
    if (camp.kind === 'buff' && killerHero) {
      const fam = camp.family;
      if (fam === 'heartroot') sim.addEffect(killerHero, 'mod', 90, 0, killerHero.id, { mods: { hpRegen: 7, manaRegen: 3, haste: 10 }, tag: 'heartroot' });
      else sim.addEffect(killerHero, 'mod', 90, 0, killerHero.id, { mods: { as: 0.18, ad: 10 }, tag: 'cinder' });
      sim.emit({ t: 'announce', text: `${killerHero.hero!.name} claimed the ${camp.family === 'heartroot' ? 'Heartroot' : 'Cinder'} Boon`, team, priority: 0, sound: 'buff' });
    }
    if (!allDead) return;
    if (camp.kind === 'catalyst') {
      const north = camp.id === 'catalyst-n';
      const ts = sim.teams[team as 0 | 1];
      if (north) ts.buffMoveUntil = sim.time + 240; else ts.buffStructUntil = sim.time + 240;
      for (const h of sim.heroes) if (h.team === team) { sim.giveGold(h, 140); if (!h.dead && (h.id === killerHero?.id || sim.time - (m.damagers.get(h.id) ?? -99) < 12)) h.hero!.objectives++; }
      sim.emit({ t: 'announce', text: `${TEAM_NAMES[team]} claimed the ${north ? 'Northern Catalyst: swift roads' : 'Southern Catalyst: siege power'}`, team, priority: 2, sound: 'objective' });
      sim.note(`${TEAM_NAMES[team]} took the ${north ? 'Northern' : 'Southern'} Catalyst`, team, 'objective');
    } else if (camp.kind === 'colossus') {
      sim.teams[team as 0 | 1].colossusUntil = sim.time + 150;
      for (const h of sim.heroes) if (h.team === team) { sim.giveGold(h, 180); if (sim.time - (m.damagers.get(h.id) ?? -99) < 12 || h.id === killerHero?.id) h.hero!.objectives++; }
      sim.emit({ t: 'announce', text: `${TEAM_NAMES[team]} felled the Aether Colossus: minions empowered`, team, priority: 3, sound: 'objective' });
      sim.note(`${TEAM_NAMES[team]} felled the Aether Colossus`, team, 'objective');
    }
  }

  // ------------------------------------------------------------ structures
  onStructureDestroyed(s: Unit, killer: Unit | null, killerHero: Unit | null) {
    const sim = this.sim;
    const victim = s.team as 0 | 1;
    const killerTeam = (1 - victim) as 0 | 1;
    sim.teams[victim].structuresLost++;
    sim.teams[killerTeam].towers++;
    if (killerHero) killerHero.hero!.structures++;
    const isTower = s.stype === 'outer' || s.stype === 'inner' || s.stype === 'guard' || s.stype === 'core';
    if (isTower || s.stype === 'seal') {
      for (const h of sim.heroes) {
        if (h.team !== killerTeam) continue;
        sim.giveGold(h, h.id === killerHero?.id ? 220 : 110);
      }
    }
    sim.emit({ t: 'structure', id: s.id, stype: s.stype!, team: s.team, killer: killer?.id ?? 0 });
    sim.emit({ t: 'fx', kind: 'collapse', x: s.x, z: s.z, r: s.radius * 2.2, color: s.team === 0 ? 0x70c8ff : 0xff8a60, dur: 1.2 });
    sim.note(`${TEAM_NAMES[killerTeam]} destroyed ${TEAM_NAMES[victim]}'s ${s.name}`, killerTeam, 'structure');
    const text = s.stype === 'seal' ? `${TEAM_NAMES[victim]}'s Seal is broken: Vanguards advance` : s.stype === 'engine' ? 'The Crown Engine is destroyed' : `${TEAM_NAMES[victim]}'s ${s.name} has fallen`;
    sim.emit({ t: 'announce', text, team: killerTeam, priority: 3, sound: s.stype === 'seal' ? 'seal' : 'tower' });
    if (s.stype === 'seal') {
      const lane = s.lane;
      sim.teams[victim].sealDown[lane] = true;
      sim.teams[killerTeam].vanguardLane[lane] = true;
      if (s.sealRespawns < 1) this.sealRespawnAt[s.defId!] = sim.time + SEAL_RESPAWN;
    }
    if (s.stype === 'engine') this.victory(killerTeam);
  }

  victory(team: 0 | 1) {
    const sim = this.sim;
    if (sim.winner >= 0) return;
    sim.winner = team;
    sim.lastTick = sim.tick;
    sim.emit({ t: 'victory', team });
    sim.note(`${TEAM_NAMES[team]} destroyed the Crown Engine`, team, 'victory');
  }
}
void DT;
