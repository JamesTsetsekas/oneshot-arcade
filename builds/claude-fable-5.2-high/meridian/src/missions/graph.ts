// Data-driven mission graph: typed node/goal/condition definitions, a validator, and the runtime.
// Missions only issue high-level requests (spawn, reserve, set world state, objectives); they never
// fork vehicle, police or combat logic.
import type { Sim } from '../game-session/sim';
import type { Vehicle } from '../vehicles/vehicle';
import { ANCHORS, AnchorId, Rect, inRect } from '../world/district';

export type Pos = AnchorId | { x: number; z: number };
export type Goal =
  | { g: 'goto'; pos: Pos; r: number; mode?: 'foot' | 'vehicle' | 'any'; veh?: string; stop?: boolean; area?: { x: number; z: number; r: number } }
  | { g: 'enter'; veh: string[] }
  | { g: 'interact'; pos: Pos; label: string; hold?: number; r?: number }
  | { g: 'multi'; items: { pos: Pos; label: string; hold?: number }[]; r?: number }
  | { g: 'anyOf'; options: { pos: Pos; label: string; hold?: number; next: string }[] }
  | { g: 'wait'; seconds: number; inside?: Rect }
  | { g: 'alertClear' }
  | { g: 'vehStopped'; veh: string; seconds: number }
  | { g: 'deliver'; veh: string; pos: Pos; r: number }
  | { g: 'leave'; rect: Rect; margin: number }
  | { g: 'lock'; hits: number; abort: string };
export type Cond =
  | { c: 'vehDead'; veh: string } | { c: 'cargoGone'; veh: string } | { c: 'cargoBelow'; veh: string; v: number } | { c: 'alertAtLeast'; n: number }
  | { c: 'flag'; key: string } | { c: 'notFlag'; key: string } | { c: 'impacts'; n: number } | { c: 'timeOver'; seconds: number };
export type SpawnReq =
  | { kind: 'vehicle'; ref: string; type: string; at: Pos; yaw?: number; color?: number; owned?: boolean; driver?: 'flee' | 'chase' }
  | { kind: 'actors'; group: string; faction: 'security' | 'rival'; at: number[][]; patrols?: number[][][] };
export type WorldSet =
  | { k: 'restricted'; rects: Rect[] } | { k: 'cameras'; group: string; on: boolean } | { k: 'alertTier'; tier: number }
  | { k: 'weather'; rain: boolean } | { k: 'hour'; atLeast: number } | { k: 'flag'; key: string; value?: boolean }
  | { k: 'timer'; start: boolean } | { k: 'door'; id: string; open: boolean } | { k: 'bluff'; group: string; seconds: number }
  | { k: 'alertGroup'; group: string } | { k: 'disableCamera'; group: string };
export type NodeDef =
  | { t: 'dialogue'; lines: { who: string; text: string }[]; next: string }
  | { t: 'objective'; text: string; goal: Goal; next: string; hint?: string; optional?: { text: string; flag: string; invert?: boolean }[]; side?: { pos: Pos; label: string; hold?: number; flag: string; set?: WorldSet[] }[]; timeLimit?: { seconds: number; reason: string } }
  | { t: 'spawn'; items: SpawnReq[]; next: string }
  | { t: 'set'; set: WorldSet[]; next: string }
  | { t: 'branch'; when: Cond; yes: string; no: string }
  | { t: 'choice'; prompt: string; options: { label: string; next: string }[] }
  | { t: 'checkpoint'; restore?: string[]; next: string }
  | { t: 'reward'; next: string }
  | { t: 'cleanup'; next: string }
  | { t: 'end' };
export interface MissionDef {
  id: string; title: string; giver: string; kind: 'story' | 'activity'; brief: string;
  reward: { cash: number; trust: number }; par: number; // par time in seconds for grading
  start: string; nodes: Record<string, NodeDef>;
  fails: { when: Cond; reason: string }[];
  allowAlert?: boolean; // alert is part of the script, so it is not penalised in the grade
}
export const posOf = (p: Pos) => (typeof p === 'string' ? ANCHORS[p] : p);

/** Schema check used by tests and at load time. Returns a list of problems (empty = valid). */
export function validateMission(m: MissionDef): string[] {
  const errs: string[] = [];
  const has = (id: string, from: string) => { if (!m.nodes[id]) errs.push(`${m.id}: node "${from}" points to missing "${id}"`); };
  if (!m.nodes[m.start]) errs.push(`${m.id}: missing start node`);
  let ends = 0, rewards = 0;
  for (const [id, n] of Object.entries(m.nodes)) {
    switch (n.t) {
      case 'end': ends++; break;
      case 'branch': has(n.yes, id); has(n.no, id); break;
      case 'choice': n.options.forEach((o) => has(o.next, id)); if (!n.options.length) errs.push(`${m.id}: choice "${id}" has no options`); break;
      case 'objective': has(n.next, id); if (n.goal.g === 'anyOf') n.goal.options.forEach((o) => has(o.next, id)); if (n.goal.g === 'lock') has(n.goal.abort, id); break;
      case 'checkpoint': has(n.next, id); (n.restore ?? []).forEach((r) => has(r, id)); break;
      case 'reward': rewards++; has(n.next, id); break;
      default: has(n.next, id);
    }
  }
  if (!ends) errs.push(`${m.id}: no end node`);
  if (!rewards) errs.push(`${m.id}: no reward node`);
  // reachability
  const seen = new Set<string>(), stack = [m.start];
  while (stack.length) {
    const id = stack.pop()!; if (seen.has(id) || !m.nodes[id]) continue; seen.add(id);
    const n = m.nodes[id];
    if (n.t === 'branch') stack.push(n.yes, n.no); else if (n.t === 'choice') n.options.forEach((o) => stack.push(o.next));
    else if (n.t !== 'end') { stack.push(n.next); if (n.t === 'objective' && n.goal.g === 'anyOf') n.goal.options.forEach((o) => stack.push(o.next)); }
  }
  for (const id of Object.keys(m.nodes)) if (!seen.has(id)) errs.push(`${m.id}: node "${id}" is unreachable`);
  return errs;
}

export interface Marker { x: number; z: number; r: number; label: string; kind: 'goal' | 'side' | 'area'; follow?: Vehicle }
export interface MissionResult { id: string; title: string; grade: string; score: number; time: number; cash: number; trust: number; firstTime: boolean; notes: string[] }
export interface Progress { completed: Record<string, { grade: string; time: number; score: number }>; activityRuns: Record<string, number>; circuitBest: number; ghost: number[] }
const GRADE_ORDER = ['C', 'B', 'A', 'S'];

export class MissionRunner {
  active: MissionDef | null = null;
  node = ''; replay = false;
  objective = ''; hint = ''; optional: { text: string; ok: boolean }[] = [];
  markers: Marker[] = [];
  failed: string | null = null;
  choice: { prompt: string; options: string[] } | null = null;
  lock: { needle: number; lo: number; hi: number; hits: number; need: number; dir: number } | null = null;
  timerText = ''; cargoRef = '';
  result: MissionResult | null = null;
  progress: Progress = { completed: {}, activityRuns: {}, circuitBest: 0, ghost: [] };
  refs = new Map<string, Vehicle>();
  flags = new Set<string>();
  private groups = new Set<string>();
  private elapsed = 0; private goalT = 0; private nodeT = 0; private multiDone = new Set<number>(); private timerStart = -1;
  private cp: { node: string; restore: string[]; x: number; z: number; yaw: number; vehRef: string; flags: string[]; elapsed: number } | null = null;
  private base = { hurt: 0, hull: 0 }; private impacts = 0; private alertPeak = 0; private ids: string[] = [];
  private ghostRec: number[] = []; private ghostT = 0; private resetT = 0; private lastGate: { x: number; z: number } | null = null;
  /** Hook for activities that need a custom completion step (ghost, counters). */
  onComplete: ((r: MissionResult) => void) | null = null;

  constructor(public sim: Sim) {
    sim.bus.on('vehicleImpact', (e) => { if (this.active && e.byPlayer && e.dv > 4) this.impacts++; });
    sim.bus.on('playerDown', () => { if (this.active && !this.failed) this.fail('You were incapacitated.'); });
    sim.bus.on('arrested', () => { if (this.active && !this.failed) this.fail('You were arrested.'); });
  }
  get busy() { return !!this.active; }
  isUnlocked(id: string, order: string[]): boolean { const i = order.indexOf(id); return i <= 0 || !!this.progress.completed[order[i - 1]]; }

  start(def: MissionDef, replay = false): boolean {
    if (this.active) return false;
    const errs = validateMission(def);
    if (errs.length) { console.warn(errs.join('\n')); return false; }
    this.active = def; this.replay = replay || !!this.progress.completed[def.id];
    this.node = def.start; this.failed = null; this.result = null; this.choice = null; this.lock = null;
    this.flags.clear(); this.refs.clear(); this.groups.clear(); this.multiDone.clear(); this.ids = [];
    this.elapsed = 0; this.goalT = 0; this.nodeT = 0; this.impacts = 0; this.alertPeak = 0; this.timerStart = -1; this.cp = null; this.cargoRef = '';
    this.base.hurt = this.sim.player.stats.civiliansHurt; this.ghostRec = []; this.ghostT = 0;
    this.sim.bus.emit('missionChanged', {});
    this.sim.bus.emit('sfx', { name: 'mission_start' });
    return true;
  }
  private say(lines: { who: string; text: string }[]) {
    let t = 0;
    for (const l of lines) { const d = Math.max(2.4, l.text.length * 0.055); const tt = t; this.sim.schedule(tt, () => this.sim.bus.emit('subtitle', { speaker: l.who, text: l.text, dur: d })); t += d + 0.25; }
  }
  private doSpawn(items: SpawnReq[]) {
    const sim = this.sim;
    for (const it of items) {
      if (it.kind === 'vehicle') {
        const p = posOf(it.at);
        const old = this.refs.get(it.ref);
        if (old && sim.vehicles.list.includes(old)) { if (sim.player.vehicle === old) sim.player.exitVehicle(true); sim.traffic.ejectDriverSilent(old); sim.vehicles.remove(old); }
        const v = sim.spawnMissionVehicle(it.type, p.x, p.z, it.yaw ?? (p as any).yaw ?? 0, it.color);
        v.ref = it.ref; v.persistent = true; v.owned = !!it.owned; v.stolen = !!it.owned;
        this.refs.set(it.ref, v);
        if (it.driver) sim.traffic.addScripted(v, it.driver);
      } else {
        this.groups.add(it.group); sim.actors.removeGroup(it.group);
        it.at.forEach((p, i) => { const a = sim.actors.spawn(it.faction, p[0], p[1], 0, it.group); if (it.patrols && it.patrols[i]) a.patrol = it.patrols[i]; if (it.faction === 'rival') { a.alerted = true; a.tx = sim.player.x; a.tz = sim.player.z; } });
      }
    }
  }
  private doSet(sets: WorldSet[]) {
    const sim = this.sim;
    for (const s of sets) {
      switch (s.k) {
        case 'restricted': sim.police.restricted = s.rects; break;
        case 'cameras': if (s.on) sim.police.cameraGroups.add(s.group); else sim.police.cameraGroups.delete(s.group); break;
        case 'disableCamera': sim.disableCameraGroup(s.group); break;
        case 'alertTier': sim.police.forceTier(s.tier, sim.player.x, sim.player.z); break;
        case 'weather': sim.weather.forceRain = s.rain; break;
        case 'hour': sim.clock.advanceTo(s.atLeast); break;
        case 'flag': if (s.value === false) this.flags.delete(s.key); else this.flags.add(s.key); break;
        case 'timer': this.timerStart = s.start ? this.elapsed : -1; break;
        case 'door': sim.setDoor(s.id, s.open); break;
        case 'bluff': for (const a of sim.actors.list) if (a.group === s.group) a.ignoreUntil = sim.time + s.seconds; sim.police.graceUntil = sim.time + s.seconds; break;
        case 'alertGroup': sim.actors.alertGroup(s.group); break;
      }
    }
  }
  private test(c: Cond): boolean {
    const sim = this.sim;
    switch (c.c) {
      case 'vehDead': { const v = this.refs.get(c.veh); return !!v && (v.stalled || v.submerged || !sim.vehicles.list.includes(v)); }
      case 'cargoGone': { const v = this.refs.get(c.veh); return !!v && v.cargo <= 0; }
      case 'cargoBelow': { const v = this.refs.get(c.veh); return !!v && v.cargo < c.v; }
      case 'alertAtLeast': return sim.police.tier >= c.n;
      case 'flag': return this.flags.has(c.key);
      case 'notFlag': return !this.flags.has(c.key);
      case 'impacts': return this.impacts >= c.n;
      case 'timeOver': return this.timerStart >= 0 && this.elapsed - this.timerStart > c.seconds;
    }
  }
  fail(reason: string) {
    if (!this.active || this.failed) return;
    this.failed = reason; this.clearUi();
    this.sim.bus.emit('sfx', { name: 'mission_fail' }); this.sim.bus.emit('missionChanged', {});
  }
  private clearUi() { this.markers = []; this.choice = null; this.lock = null; this.removeInteracts(); this.timerText = ''; }
  private removeInteracts() {
    const list = this.sim.interactables;
    for (let i = list.length - 1; i >= 0; i--) if (this.ids.includes(list[i].id)) list.splice(i, 1);
    this.ids = [];
  }
  private addInteract(id: string, p: { x: number; z: number }, label: string, hold: number, r: number, use: () => void) {
    this.ids.push(id);
    this.sim.interactables.push({ id, x: p.x, z: p.z, r, hold, label: () => label, use, priority: 2 });
  }
  private cleanupWorld(removeAll: boolean) {
    const sim = this.sim;
    for (const g of this.groups) sim.actors.removeGroup(g);
    for (const v of this.refs.values()) {
      if (!sim.vehicles.list.includes(v)) continue;
      sim.traffic.ejectDriverSilent(v);
      v.ref = ''; v.persistent = sim.player.vehicle === v || v === sim.player.ownedVehicle;
      if (removeAll && sim.player.vehicle !== v && v !== sim.player.ownedVehicle) sim.vehicles.remove(v);
    }
    sim.police.restricted = []; sim.police.cameraGroups = new Set(['city']); sim.police.disabledCameras.clear();
    sim.police.forcedTier = 0; sim.resetDoors();
    this.clearUi();
  }
  /** Retry from the last checkpoint: release everything reserved, restore the player, re-run setup nodes. */
  retry() {
    const def = this.active; if (!def) return;
    const sim = this.sim, cp = this.cp;
    this.cleanupWorld(true); this.refs.clear(); this.groups.clear();
    sim.police.clear('reset'); sim.dispatch.standDown(true);
    this.failed = null; this.impacts = 0; this.multiDone.clear(); this.goalT = 0; this.nodeT = 0;
    if (!cp) { const id = def.id; this.active = null; sim.player.respawn(sim.player.x, sim.player.z, 0); this.start(def, this.replay); void id; }
    else {
      this.flags = new Set(cp.flags); this.elapsed = cp.elapsed;
      sim.player.respawn(cp.x, cp.z, cp.yaw, Math.max(sim.player.health, 70));
      for (const id of cp.restore) { const n = def.nodes[id]; if (n.t === 'spawn') this.doSpawn(n.items); else if (n.t === 'set') this.doSet(n.set); }
      if (cp.vehRef) { const v = this.refs.get(cp.vehRef); if (v) { v.teleport(cp.x, sim.phys.groundBelow(cp.x, 30, cp.z), cp.z, cp.yaw); sim.player.enterVehicle(v, true); } }
      this.node = cp.node;
    }
    sim.bus.emit('missionChanged', {});
  }
  /** Abandon: restore reserved actors/world state and return to free roam. */
  abandon() {
    if (!this.active) return;
    this.cleanupWorld(false);
    if (this.sim.player.downed) this.sim.respawnAtSafehouse(false);
    this.active = null; this.failed = null; this.objective = ''; this.optional = [];
    this.sim.bus.emit('missionChanged', {});
  }
  choose(i: number) {
    const n = this.active?.nodes[this.node];
    if (!n || n.t !== 'choice' || !n.options[i]) return;
    this.choice = null; this.goto(n.options[i].next);
  }
  private goto(id: string) { this.node = id; this.goalT = 0; this.nodeT = 0; this.multiDone.clear(); this.clearUi(); }

  private finish(def: MissionDef) {
    const sim = this.sim, notes: string[] = [];
    let score = 100;
    const over = Math.max(0, this.elapsed - def.par);
    if (over > 0) { const pen = Math.min(25, over * 0.2); score -= pen; notes.push(`Over par time: -${pen.toFixed(0)}`); } else notes.push('Under par time');
    const hurt = sim.player.stats.civiliansHurt - this.base.hurt;
    if (hurt > 0) { score -= hurt * 20; notes.push(`Civilians harmed (${hurt}): -${hurt * 20}`); } else notes.push('No civilians harmed');
    if (this.impacts > 0) { const pen = Math.min(20, this.impacts * 3); score -= pen; notes.push(`Collisions (${this.impacts}): -${pen}`); }
    if (!def.allowAlert && this.alertPeak > 0) { score -= this.alertPeak * 5; notes.push(`Alert reached tier ${this.alertPeak}: -${this.alertPeak * 5}`); }
    for (const n of Object.values(def.nodes)) if (n.t === 'objective' && n.optional) for (const o of n.optional) {
      const ok = o.invert ? !this.flags.has(o.flag) : this.flags.has(o.flag);
      if (ok) { score += 8; notes.push(`Optional: ${o.text} +8`); } else notes.push(`Optional missed: ${o.text}`);
    }
    score = Math.max(0, Math.min(110, Math.round(score)));
    const grade = score >= 96 ? 'S' : score >= 80 ? 'A' : score >= 60 ? 'B' : 'C';
    const mul = grade === 'S' ? 1.25 : grade === 'A' ? 1.1 : grade === 'B' ? 1 : 0.8;
    const prev = this.progress.completed[def.id];
    const firstTime = !prev;
    // story rewards pay once; replays only improve the recorded grade. Activities pay every run.
    const pays = def.kind === 'activity' || firstTime;
    const cash = pays ? Math.round(def.reward.cash * mul) : 0, trust = pays ? def.reward.trust : 0;
    if (pays) { sim.economy.cash += cash; sim.economy.trust += trust; }
    if (!prev || GRADE_ORDER.indexOf(grade) > GRADE_ORDER.indexOf(prev.grade) || (grade === prev.grade && this.elapsed < prev.time)) this.progress.completed[def.id] = { grade, time: this.elapsed, score };
    if (def.kind === 'activity') { const key = def.id.split(':')[0]; this.progress.activityRuns[key] = (this.progress.activityRuns[key] ?? 0) + 1; }
    this.result = { id: def.id, title: def.title, grade, score, time: this.elapsed, cash, trust, firstTime, notes };
    this.onComplete?.(this.result);
    sim.bus.emit('sfx', { name: 'mission_done' });
    if (cash) sim.bus.emit('toast', { text: `+$${cash}${trust ? `  ·  Trust +${trust}` : ''}`, kind: 'money' });
  }
  get ghostSamples() { return this.ghostRec; }
  /** Seconds since the mission's running timer started, or -1 when no timer is active. */
  get timerElapsed() { return this.timerStart >= 0 ? this.elapsed - this.timerStart : -1; }

  update(dt: number) {
    const def = this.active, sim = this.sim;
    if (!def || this.failed) return;
    this.elapsed += dt; this.nodeT += dt;
    this.alertPeak = Math.max(this.alertPeak, sim.police.tier);
    if (def.id.startsWith('circuit') && this.timerStart >= 0) { this.ghostT -= dt; if (this.ghostT <= 0) { this.ghostT = 0.25; this.ghostRec.push(Math.round(sim.player.x * 10) / 10, Math.round(sim.player.z * 10) / 10); } }
    for (const f of def.fails) if (this.test(f.when)) { this.fail(f.reason); return; }
    if (sim.tick % 15 === 0) for (const a of sim.actors.list) if (a.faction === 'security' && a.alerted && this.groups.has(a.group)) { this.flags.add('spotted'); break; }
    if (sim.police.tier > 0 && sim.police.restricted.length) this.flags.add('spotted');
    // Street Circuit: hold reset to return to the previous gate with a time penalty
    if (def.id === 'circuit' && sim.player.vehicle) {
      this.resetT = sim.input.resetHeld ? this.resetT + dt : 0;
      const n0 = def.nodes[this.node];
      if (this.resetT > 1 && n0.t === 'objective' && n0.goal.g === 'goto' && this.lastGate) {
        this.resetT = -1; this.elapsed += 5;
        const g0 = this.lastGate, t0 = posOf(n0.goal.pos), v = sim.player.vehicle;
        v.teleport(g0.x, sim.phys.groundBelow(g0.x, 30, g0.z), g0.z, Math.atan2(t0.x - g0.x, t0.z - g0.z));
        sim.bus.emit('toast', { text: 'Reset to last gate: +5 s', kind: 'bad' });
      }
    }
    for (let guard = 0; guard < 24; guard++) {
      const n = def.nodes[this.node];
      if (!n) { this.fail('Mission data error.'); return; }
      if (n.t === 'dialogue') { this.say(n.lines); this.goto(n.next); continue; }
      if (n.t === 'spawn') { this.doSpawn(n.items); this.goto(n.next); continue; }
      if (n.t === 'set') { this.doSet(n.set); this.goto(n.next); continue; }
      if (n.t === 'branch') { this.goto(this.test(n.when) ? n.yes : n.no); continue; }
      if (n.t === 'checkpoint') {
        const p = sim.player, v = p.vehicle;
        this.cp = { node: n.next, restore: n.restore ?? [], x: p.x, z: p.z, yaw: v ? v.yaw : p.body.yaw, vehRef: v && v.ref ? v.ref : '', flags: [...this.flags], elapsed: this.elapsed };
        sim.requestAutosave('checkpoint'); this.goto(n.next); continue;
      }
      if (n.t === 'reward') { this.finish(def); this.goto(n.next); continue; }
      if (n.t === 'cleanup') { this.cleanupWorld(false); this.goto(n.next); continue; }
      if (n.t === 'end') {
        this.active = null; this.objective = ''; this.optional = []; this.markers = []; this.timerText = '';
        sim.bus.emit('missionChanged', {}); sim.requestAutosave('mission');
        return;
      }
      if (n.t === 'choice') { if (!this.choice) { this.choice = { prompt: n.prompt, options: n.options.map((o) => o.label) }; sim.bus.emit('missionChanged', {}); } return; }
      // objective
      if (this.objective !== n.text) { this.objective = n.text; this.hint = n.hint ?? ''; sim.bus.emit('missionChanged', {}); if (this.nodeT <= dt * 1.5) sim.bus.emit('sfx', { name: 'objective' }); }
      this.optional = (n.optional ?? []).map((o) => ({ text: o.text, ok: o.invert ? !this.flags.has(o.flag) : this.flags.has(o.flag) }));
      if (n.timeLimit) {
        const left = n.timeLimit.seconds - this.nodeT;
        this.timerText = `${Math.max(0, Math.floor(left / 60))}:${String(Math.max(0, Math.floor(left % 60))).padStart(2, '0')}`;
        if (left <= 0) { this.fail(n.timeLimit.reason); return; }
      } else if (n.goal.g !== 'wait') this.timerText = this.timerStart >= 0 ? this.fmt(this.elapsed - this.timerStart) : '';
      if (n.side && this.ids.every((i) => !i.startsWith('side'))) n.side.forEach((s, i) => {
        if (this.flags.has(s.flag)) return;
        const p = posOf(s.pos);
        this.addInteract(`side${i}-${this.node}`, p, s.label, s.hold ?? 0, 2.6, () => { this.flags.add(s.flag); if (s.set) this.doSet(s.set); sim.bus.emit('sfx', { name: 'objective' }); this.removeInteracts(); });
      });
      const next = this.checkGoal(n.goal, dt);
      if (next === null) return;
      this.goto(next === '' ? n.next : next);
    }
  }
  private fmt(s: number) { return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`; }
  /** Returns null while incomplete, '' to follow `next`, or an explicit node id. */
  private checkGoal(g: Goal, dt: number): string | null {
    const sim = this.sim, p = sim.player;
    const side = this.markers.filter((m) => m.kind === 'side');
    const mark = (pos: { x: number; z: number }, r: number, label: string, follow?: Vehicle) => { this.markers = [{ x: pos.x, z: pos.z, r, label, kind: 'goal', follow }, ...side]; };
    switch (g.g) {
      case 'goto': {
        const t = posOf(g.pos);
        if (g.area) this.markers = [{ x: g.area.x, z: g.area.z, r: g.area.r, label: 'Search area', kind: 'area' }, ...side]; else mark(t, g.r, this.objective);
        if (g.mode === 'foot' && p.vehicle) return null;
        if (g.mode === 'vehicle' && !p.vehicle) return null;
        if (g.veh && p.vehicle !== this.refs.get(g.veh)) return null;
        if (Math.hypot(p.x - t.x, p.z - t.z) > g.r) return null;
        if (g.stop && p.speed > 1.2) return null;
        this.lastGate = { x: t.x, z: t.z };
        return '';
      }
      case 'enter': {
        const vs = g.veh.map((r) => this.refs.get(r)).filter(Boolean) as Vehicle[];
        this.markers = vs.map((v) => ({ x: v.x, z: v.z, r: 2.5, label: v.spec.name, kind: 'goal' as const, follow: v }));
        for (const v of vs) if (p.vehicle === v) { this.flags.add('chose:' + v.ref); return ''; }
        return null;
      }
      case 'interact': {
        const t = posOf(g.pos); mark(t, 1.6, g.label);
        if (!this.ids.includes('goal-' + this.node)) this.addInteract('goal-' + this.node, t, g.label, g.hold ?? 0, g.r ?? 2.6, () => this.flags.add('done:' + this.node));
        return this.flags.has('done:' + this.node) ? '' : null;
      }
      case 'multi': {
        this.markers = g.items.map((it, i) => ({ ...posOf(it.pos), r: 1.4, label: it.label, kind: 'goal' as const, i })).filter((m) => !this.multiDone.has(m.i)).map(({ i, ...m }) => { void i; return m; });
        g.items.forEach((it, i) => {
          const id = `multi${i}-${this.node}`;
          if (!this.multiDone.has(i) && !this.ids.includes(id)) this.addInteract(id, posOf(it.pos), it.label, it.hold ?? 0, g.r ?? 2.4, () => { this.multiDone.add(i); const k = this.ids.indexOf(id); if (k >= 0) this.ids.splice(k, 1); const li = sim.interactables.findIndex((x) => x.id === id); if (li >= 0) sim.interactables.splice(li, 1); sim.bus.emit('sfx', { name: 'camera' }); sim.bus.emit('toast', { text: `${this.multiDone.size}/${g.items.length}`, kind: 'info' }); });
        });
        return this.multiDone.size >= g.items.length ? '' : null;
      }
      case 'anyOf': {
        this.markers = g.options.map((o) => ({ ...posOf(o.pos), r: 1.6, label: o.label, kind: 'goal' as const }));
        g.options.forEach((o, i) => { const id = `any${i}-${this.node}`; if (!this.ids.includes(id)) this.addInteract(id, posOf(o.pos), o.label, o.hold ?? 0, 2.8, () => this.flags.add(`any:${this.node}:${i}`)); });
        for (let i = 0; i < g.options.length; i++) if (this.flags.has(`any:${this.node}:${i}`)) { this.flags.delete(`any:${this.node}:${i}`); return g.options[i].next; }
        return null;
      }
      case 'wait': {
        const inside = !g.inside || inRect(g.inside, p.x, p.z);
        if (inside) this.goalT += dt;
        if (g.inside) this.markers = [{ x: (g.inside.x0 + g.inside.x1) / 2, z: (g.inside.z0 + g.inside.z1) / 2, r: Math.max(g.inside.x1 - g.inside.x0, g.inside.z1 - g.inside.z0) / 2, label: 'Hold this area', kind: 'area' }];
        this.timerText = this.fmt(Math.max(0, g.seconds - this.goalT)) + (inside ? '' : ' (return to the area)');
        return this.goalT >= g.seconds ? '' : null;
      }
      case 'alertClear': {
        this.markers = [...side];
        return sim.police.tier === 0 ? '' : null;
      }
      case 'vehStopped': {
        const v = this.refs.get(g.veh); if (!v) return null;
        this.cargoRef = g.veh; mark(v, 3, v.spec.name, v);
        if (v.speedAbs < 1.6 || v.driver === 'none' || v.driver === 'player') this.goalT += dt; else this.goalT = 0;
        if (v.engine < 40 || this.goalT > g.seconds || v.driver === 'none' || v.driver === 'player') { sim.traffic.ejectDriver(v, true); return ''; }
        return null;
      }
      case 'deliver': {
        const v = this.refs.get(g.veh), t = posOf(g.pos); if (!v) return null;
        this.cargoRef = g.veh;
        if (p.vehicle !== v) { mark(v, 3, `Get back in the ${v.spec.name}`, v); return null; }
        mark(t, g.r, this.objective);
        return Math.hypot(v.x - t.x, v.z - t.z) < g.r && v.speedAbs < 1.5 ? '' : null;
      }
      case 'leave': {
        this.markers = [...side];
        const r = g.rect;
        const out = p.x < r.x0 - g.margin || p.x > r.x1 + g.margin || p.z < r.z0 - g.margin || p.z > r.z1 + g.margin;
        return out && sim.police.tier === 0 ? '' : null;
      }
      case 'lock': {
        if (!this.lock) { const lo = 0.25 + sim.rng.next() * 0.5; this.lock = { needle: 0, lo, hi: lo + 0.17, hits: 0, need: g.hits, dir: 1 }; sim.bus.emit('missionChanged', {}); }
        const L = this.lock;
        L.needle += L.dir * dt * (0.9 + L.hits * 0.25);
        if (L.needle > 1) { L.needle = 1; L.dir = -1; } else if (L.needle < 0) { L.needle = 0; L.dir = 1; }
        if (sim.input.interact) {
          if (L.needle >= L.lo && L.needle <= L.hi) { L.hits++; sim.bus.emit('sfx', { name: 'lock_ok' }); const lo = 0.2 + sim.rng.next() * 0.6; L.lo = lo; L.hi = lo + Math.max(0.1, 0.17 - L.hits * 0.025); }
          else { L.hits = Math.max(0, L.hits - 1); sim.bus.emit('sfx', { name: 'lock_bad' }); sim.bus.emit('noise', { kind: 'chirper', x: p.x, z: p.z, radius: 12, byPlayer: true }); }
        }
        if (Math.hypot(p.body.vx, p.body.vz) > 2.5) { this.lock = null; return g.abort; }
        if (L.hits >= L.need) { this.lock = null; return ''; }
        return null;
      }
    }
  }
}
