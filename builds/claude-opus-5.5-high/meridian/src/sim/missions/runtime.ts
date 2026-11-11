// Versioned, data-driven mission graph runtime. Missions talk to the world only through
// the typed MissionHost command/query interface: they may reserve/spawn tagged actors and
// set high-level goals, but never reach into vehicle, police or combat internals.

export const MISSION_SCHEMA_VERSION = 1;

export interface Pt { x: number; z: number }
export interface Marker { x: number; z: number; r: number; kind: "objective" | "area" | "vehicle" | "pickup"; label?: string; tag?: string }

export type OptionalGoal =
  | { id: string; text: string; kind: "time"; seconds: number }
  | { id: string; text: string; kind: "noAlert" }
  | { id: string; text: string; kind: "noDamage" }
  | { id: string; text: string; kind: "flag"; flag: string }
  | { id: string; text: string; kind: "noCivHarm" };

export type ObjectiveSpec =
  | { kind: "reach"; text: string; x: number; z: number; r: number; inVehicle?: boolean; onFoot?: boolean; stopped?: boolean; vehicleTag?: string }
  | { kind: "enterVehicle"; text: string; tags: string[] }
  | { kind: "interact"; text: string; id: string; x: number; z: number; r: number; label: string; onFoot?: boolean }
  | { kind: "interactAll"; text: string; points: { id: string; x: number; z: number; label: string }[]; r: number }
  | { kind: "lockpick"; text: string; id: string; x: number; z: number; r: number; label: string }
  | { kind: "survive"; text: string; seconds: number; x: number; z: number; r: number }
  | { kind: "escapeAlert"; text: string }
  | { kind: "leaveArea"; text: string; x: number; z: number; r: number }
  | { kind: "stopVehicle"; text: string; tag: string; searchX: number; searchZ: number; searchR: number; revealAt: number }
  | { kind: "deliverVehicle"; text: string; tag: string; x: number; z: number; r: number }
  | { kind: "circuit"; text: string; points: Pt[]; laps: number; r: number };

export type SpawnRequest =
  | { kind: "guard"; tag: string; x: number; z: number; yaw: number; team: "security" | "rival"; weapon: string; waypoints?: Pt[]; zone?: { x0: number; z0: number; x1: number; z1: number }; hostile?: boolean }
  | { kind: "npc"; tag: string; x: number; z: number; yaw: number; role: string }
  | { kind: "vehicle"; tag: string; model: string; x: number; z: number; yaw: number; ai?: "none" | "wander" | "pursue"; crew?: number; team?: "rival" }
  | { kind: "wave"; tag: string; count: number; waves: number; interval: number; fromX: number; fromZ: number; toX: number; toZ: number }
  | { kind: "door"; id: string; locked: boolean };

export type MNode =
  | { id: string; type: "start"; next: string }
  | { id: string; type: "objective"; obj: ObjectiveSpec; optional?: OptionalGoal[]; timeLimit?: number; next: string }
  | { id: string; type: "dialogue"; lines: { speaker: string; text: string; dur?: number }[]; next: string }
  | { id: string; type: "branch"; prompt: string; options: { label: string; hint: string; next: string }[] }
  | { id: string; type: "trigger"; flag: string; next: string; elseNext?: string }
  | { id: string; type: "spawn"; requests: SpawnRequest[]; next: string }
  | { id: string; type: "world"; set: Record<string, string | number | boolean>; next: string }
  | { id: string; type: "checkpoint"; spawn: { x: number; z: number; yaw: number }; next: string }
  | { id: string; type: "fail"; reason: string }
  | { id: string; type: "reward"; cash: number; trust: number; unlock?: string[]; next: string }
  | { id: string; type: "cleanup"; next: string }
  | { id: string; type: "end" };

export type FailCond =
  | { kind: "playerDead"; reason: string }
  | { kind: "vehicleDestroyed"; tag: string; reason: string }
  | { kind: "cargoBelow"; tag: string; min: number; reason: string }
  | { kind: "vehicleEscaped"; tag: string; dist: number; reason: string }
  | { kind: "alertAbove"; tier: number; reason: string }
  | { kind: "packageBroken"; reason: string };

export interface MissionDef {
  schema: number;
  id: string;
  title: string;
  giver: string;
  kind: "story" | "courier" | "circuit" | "recovery";
  blurb: string;
  reward: { cash: number; trust: number };
  parTime: number;
  start: string;
  nodes: Record<string, MNode>;
  fail: FailCond[];
  /** reward key: rewards are paid once per key */
  rewardKey: string;
}

export interface VehicleInfo { x: number; z: number; speed: number; health: number; cargo: number; stalled: boolean; driverPresent: boolean }

export interface MissionHost {
  now(): number;
  playerPos(): Pt;
  playerVehicleTag(): string | null;
  playerVehicleSpeed(): number;
  playerOnFoot(): boolean;
  playerDead(): boolean;
  alertTier(): number;
  vehicleByTag(tag: string): VehicleInfo | null;
  consumeInteract(id: string): boolean;
  lockpick(id: string): "idle" | "running" | "success" | "fail";
  choose(prompt: string, options: { label: string; hint: string }[]): number | null;
  flag(name: string): boolean;
  setFlag(name: string, v: boolean): void;
  setMarkers(m: Marker[]): void;
  setObjective(text: string, optional: { text: string; done: boolean }[], timer: number | null): void;
  say(lines: { speaker: string; text: string; dur?: number }[]): number;
  spawn(req: SpawnRequest, missionId: string): void;
  setWorld(key: string, value: string | number | boolean): void;
  cleanup(missionId: string): void;
  restoreCheckpoint(spawn: { x: number; z: number; yaw: number }): void;
  reward(cash: number, trust: number, unlocks: string[], key: string, replay: boolean): boolean;
  civHarm(): number;
  damageTaken(): number;
  packageIntegrity(): number;
  circuitEvent(ev: "start" | "checkpoint" | "lap" | "finish", data: { lap: number; cp: number; time: number }): void;
}

export type RunStatus = "running" | "complete" | "failed" | "abandoned";

export interface Grade { letter: string; time: number; civHarm: number; damage: number; optional: { text: string; done: boolean }[]; score: number }

export class MissionRunner {
  def: MissionDef;
  status: RunStatus = "running";
  node: string;
  nodeT = 0;
  startT = 0;
  checkpointNode: string;
  checkpointSpawn: { x: number; z: number; yaw: number } | null = null;
  failReason = "";
  replay: boolean;
  optional: OptionalGoal[] = [];
  optDone = new Map<string, boolean>();
  photographed = new Set<string>();
  surviveT = 0;
  stopT = 0;
  escapeT = 0;
  lap = 0;
  cp = 0;
  circuitStart = 0;
  lapStart = 0;
  bestLap = Infinity;
  dialogueEnd = 0;
  maxAlert = 0;
  civ0 = 0;
  dmg0 = 0;
  grade: Grade | null = null;
  rewarded = false;
  checkpointsHit: string[] = [];
  private entered = false;

  constructor(def: MissionDef, replay = false) {
    if (def.schema !== MISSION_SCHEMA_VERSION) throw new Error(`Mission ${def.id} schema ${def.schema} unsupported`);
    this.def = def;
    this.node = def.start;
    this.checkpointNode = def.start;
    this.replay = replay;
  }

  begin(h: MissionHost) {
    this.startT = h.now();
    this.civ0 = h.civHarm();
    this.dmg0 = h.damageTaken();
    this.enter(h);
  }

  get current(): MNode { return this.def.nodes[this.node]; }

  private go(next: string, h: MissionHost) {
    if (!this.def.nodes[next]) throw new Error(`Mission ${this.def.id}: missing node ${next}`);
    this.node = next;
    this.nodeT = 0;
    this.entered = false;
    this.enter(h);
  }

  private enter(h: MissionHost) {
    if (this.entered) return;
    this.entered = true;
    const n = this.current;
    this.surviveT = 0; this.stopT = 0; this.escapeT = 0;
    switch (n.type) {
      case "start": this.go(n.next, h); return;
      case "dialogue": this.dialogueEnd = h.now() + h.say(n.lines); return;
      case "spawn": for (const r of n.requests) h.spawn(r, this.def.id); this.go(n.next, h); return;
      case "world": for (const [k, v] of Object.entries(n.set)) h.setWorld(k, v); this.go(n.next, h); return;
      case "checkpoint":
        this.checkpointNode = n.id; this.checkpointSpawn = n.spawn; this.checkpointsHit.push(n.id);
        this.go(n.next, h); return;
      case "fail": this.fail(n.reason, h); return;
      case "reward": {
        const unlocks = n.unlock ?? [];
        this.rewarded = h.reward(n.cash, n.trust, unlocks, this.def.rewardKey, this.replay);
        this.computeGrade(h);
        this.go(n.next, h); return;
      }
      case "cleanup": h.cleanup(this.def.id); this.go(n.next, h); return;
      case "end": this.status = "complete"; h.setMarkers([]); h.setObjective("", [], null); return;
      case "objective":
        if (n.optional) for (const o of n.optional) if (!this.optional.some((q) => q.id === o.id)) { this.optional.push(o); this.optDone.set(o.id, o.kind !== "time" && o.kind !== "flag"); }
        if (n.obj.kind === "circuit") { this.lap = 0; this.cp = 0; this.circuitStart = h.now(); this.lapStart = h.now(); h.circuitEvent("start", { lap: 0, cp: 0, time: 0 }); }
        this.updateObjectiveUi(h);
        return;
      default: return;
    }
  }

  private optionalUi() { return this.optional.map((o) => ({ text: o.text, done: !!this.optDone.get(o.id) })); }

  private updateObjectiveUi(h: MissionHost) {
    const n = this.current;
    if (n.type !== "objective") return;
    const o = n.obj;
    let text = o.text;
    if (o.kind === "interactAll") text = `${o.text} (${this.photographed.size}/${o.points.length})`;
    if (o.kind === "circuit") text = `${o.text} — Lap ${Math.min(this.lap + 1, o.laps)}/${o.laps}`;
    let timer: number | null = null;
    if (n.timeLimit) timer = Math.max(0, n.timeLimit - this.nodeT);
    if (o.kind === "survive") timer = Math.max(0, o.seconds - this.surviveT);
    if (o.kind === "circuit") timer = h.now() - this.circuitStart;
    const tOpt = this.optional.find((q) => q.kind === "time") as { seconds: number } | undefined;
    if (timer === null && tOpt) timer = Math.max(0, tOpt.seconds - (h.now() - this.startT));
    h.setObjective(text, this.optionalUi(), timer);
    const m: Marker[] = [];
    switch (o.kind) {
      case "reach": case "leaveArea": case "deliverVehicle": case "survive":
        m.push({ x: o.x, z: o.z, r: o.r, kind: o.kind === "leaveArea" ? "area" : "objective" }); break;
      case "interact": case "lockpick": m.push({ x: o.x, z: o.z, r: o.r, kind: "pickup", label: o.label }); break;
      case "interactAll": for (const p of o.points) if (!this.photographed.has(p.id)) m.push({ x: p.x, z: p.z, r: o.r, kind: "pickup", label: p.label }); break;
      case "enterVehicle": for (const t of o.tags) { const v = h.vehicleByTag(t); if (v) m.push({ x: v.x, z: v.z, r: 3, kind: "vehicle", tag: t }); } break;
      case "stopVehicle": {
        const v = h.vehicleByTag(o.tag);
        const pp = h.playerPos();
        if (v && Math.hypot(v.x - pp.x, v.z - pp.z) < o.revealAt) m.push({ x: v.x, z: v.z, r: 3, kind: "vehicle", tag: o.tag });
        else m.push({ x: o.searchX, z: o.searchZ, r: o.searchR, kind: "area", label: "Last reported sighting" });
        break;
      }
      case "circuit": {
        const p = o.points[this.cp % o.points.length];
        m.push({ x: p.x, z: p.z, r: o.r, kind: "objective" });
        break;
      }
    }
    h.setMarkers(m);
  }

  fail(reason: string, h: MissionHost) {
    if (this.status !== "running") return;
    this.status = "failed";
    this.failReason = reason;
    h.setMarkers([]);
  }

  /** Retry from the last checkpoint: clean up actors and replay the graph from it. */
  retry(h: MissionHost) {
    h.cleanup(this.def.id);
    this.status = "running";
    this.failReason = "";
    this.photographed.clear();
    if (this.checkpointSpawn) h.restoreCheckpoint(this.checkpointSpawn);
    this.node = this.checkpointNode;
    this.entered = false;
    this.nodeT = 0;
    const n = this.current;
    // checkpoint node itself re-runs and continues
    if (n.type === "checkpoint") { this.entered = true; this.go(n.next, h); }
    else this.enter(h);
  }

  abandon(h: MissionHost) {
    h.cleanup(this.def.id);
    h.setMarkers([]);
    h.setObjective("", [], null);
    this.status = "abandoned";
  }

  private computeGrade(h: MissionHost) {
    const time = h.now() - this.startT;
    const civ = h.civHarm() - this.civ0;
    const dmg = h.damageTaken() - this.dmg0;
    for (const o of this.optional) {
      if (o.kind === "flag") this.optDone.set(o.id, h.flag(o.flag));
      if (o.kind === "time") this.optDone.set(o.id, time <= o.seconds);
      if (o.kind === "noCivHarm") this.optDone.set(o.id, civ === 0);
    }
    let score = 100;
    score -= Math.max(0, time - this.def.parTime) * 0.15;
    score -= civ * 18;
    score -= dmg * 0.12;
    score -= this.maxAlert * 4;
    const opt = this.optionalUi();
    score += opt.filter((o) => o.done).length * 8;
    score = Math.max(0, Math.min(120, score));
    const letter = score >= 100 ? "S" : score >= 85 ? "A" : score >= 70 ? "B" : score >= 50 ? "C" : "D";
    this.grade = { letter, time, civHarm: civ, damage: dmg, optional: opt, score };
  }

  update(dt: number, h: MissionHost) {
    if (this.status !== "running") return;
    this.nodeT += dt;
    this.maxAlert = Math.max(this.maxAlert, h.alertTier());
    // global fail conditions
    for (const f of this.def.fail) {
      switch (f.kind) {
        case "playerDead": if (h.playerDead()) return this.fail(f.reason, h); break;
        case "vehicleDestroyed": { const v = h.vehicleByTag(f.tag); if (v && v.health <= 0) return this.fail(f.reason, h); break; }
        case "cargoBelow": { const v = h.vehicleByTag(f.tag); if (v && v.cargo < f.min) return this.fail(f.reason, h); break; }
        case "alertAbove": if (h.alertTier() > f.tier) return this.fail(f.reason, h); break;
        case "packageBroken": if (h.packageIntegrity() <= 0) return this.fail(f.reason, h); break;
        case "vehicleEscaped": {
          const n = this.current;
          if (n.type === "objective" && n.obj.kind === "stopVehicle" && n.obj.tag === f.tag) {
            const v = h.vehicleByTag(f.tag); const p = h.playerPos();
            if (v && Math.hypot(v.x - p.x, v.z - p.z) > f.dist && this.nodeT > 60) return this.fail(f.reason, h);
          }
          break;
        }
      }
    }
    // optional goal tracking
    for (const o of this.optional) {
      if (o.kind === "noAlert" && h.alertTier() > 0) this.optDone.set(o.id, false);
      if (o.kind === "noDamage" && h.damageTaken() - this.dmg0 > 0) this.optDone.set(o.id, false);
      if (o.kind === "noCivHarm" && h.civHarm() - this.civ0 > 0) this.optDone.set(o.id, false);
      if (o.kind === "flag") this.optDone.set(o.id, h.flag(o.flag));
    }
    const n = this.current;
    switch (n.type) {
      case "dialogue": if (h.now() >= this.dialogueEnd) this.go(n.next, h); return;
      case "branch": {
        const c = h.choose(n.prompt, n.options);
        if (c !== null && n.options[c]) this.go(n.options[c].next, h);
        return;
      }
      case "trigger": if (h.flag(n.flag)) this.go(n.next, h); else if (n.elseNext) this.go(n.elseNext, h); return;
      case "objective": {
        if (n.timeLimit && this.nodeT > n.timeLimit) return this.fail("Out of time.", h);
        if (this.checkObjective(n.obj, dt, h)) { this.go(n.next, h); return; }
        this.updateObjectiveUi(h);
        return;
      }
      default: return;
    }
  }

  private checkObjective(o: ObjectiveSpec, dt: number, h: MissionHost): boolean {
    const p = h.playerPos();
    const near = (x: number, z: number, r: number) => Math.hypot(p.x - x, p.z - z) <= r;
    switch (o.kind) {
      case "reach": {
        if (!near(o.x, o.z, o.r)) return false;
        if (o.onFoot && !h.playerOnFoot()) return false;
        if (o.inVehicle && h.playerOnFoot()) return false;
        if (o.vehicleTag && h.playerVehicleTag() !== o.vehicleTag) return false;
        if (o.stopped && h.playerVehicleSpeed() > 1.5) return false;
        return true;
      }
      case "enterVehicle": { const t = h.playerVehicleTag(); return t !== null && o.tags.includes(t); }
      case "interact": return h.consumeInteract(o.id) && (!o.onFoot || h.playerOnFoot());
      case "interactAll":
        for (const pt of o.points) if (!this.photographed.has(pt.id) && h.consumeInteract(pt.id)) this.photographed.add(pt.id);
        return this.photographed.size >= o.points.length;
      case "lockpick": {
        const st = h.lockpick(o.id);
        if (st === "success") return true;
        if (st === "fail") { h.setFlag("lockpickFailed", true); return true; }
        return false;
      }
      case "survive":
        if (near(o.x, o.z, o.r)) this.surviveT += dt;
        return this.surviveT >= o.seconds;
      case "escapeAlert":
        if (h.alertTier() === 0) { this.escapeT += dt; return this.escapeT > 1; }
        this.escapeT = 0; return false;
      case "leaveArea": return !near(o.x, o.z, o.r);
      case "stopVehicle": {
        const v = h.vehicleByTag(o.tag);
        if (!v) return false;
        const close = near(v.x, v.z, 30);
        if ((v.speed < 1 && close) || v.stalled || !v.driverPresent) this.stopT += dt; else this.stopT = 0;
        return this.stopT > 2.5 || (!v.driverPresent && close);
      }
      case "deliverVehicle": return h.playerVehicleTag() === o.tag && near(o.x, o.z, o.r) && h.playerVehicleSpeed() < 2;
      case "circuit": {
        const pt = o.points[this.cp % o.points.length];
        if (!near(pt.x, pt.z, o.r)) return false;
        this.cp++;
        const t = h.now();
        if (this.cp % o.points.length === 0) {
          const lapTime = t - this.lapStart;
          this.bestLap = Math.min(this.bestLap, lapTime);
          this.lapStart = t;
          this.lap++;
          if (this.lap >= o.laps) { h.circuitEvent("finish", { lap: this.lap, cp: this.cp, time: t - this.circuitStart }); return true; }
          h.circuitEvent("lap", { lap: this.lap, cp: this.cp, time: lapTime });
        } else h.circuitEvent("checkpoint", { lap: this.lap, cp: this.cp, time: t - this.circuitStart });
        return false;
      }
    }
  }
}

/** Validate a mission graph: every referenced node exists and an end is reachable. */
export function validateMission(def: MissionDef): string[] {
  const errs: string[] = [];
  const ids = new Set(Object.keys(def.nodes));
  if (!ids.has(def.start)) errs.push(`start node ${def.start} missing`);
  for (const n of Object.values(def.nodes)) {
    const nexts: string[] = [];
    if ("next" in n && n.next) nexts.push(n.next);
    if (n.type === "branch") nexts.push(...n.options.map((o) => o.next));
    if (n.type === "trigger" && n.elseNext) nexts.push(n.elseNext);
    for (const x of nexts) if (!ids.has(x)) errs.push(`${n.id} -> ${x} missing`);
  }
  // reachability of an end node
  const seen = new Set<string>();
  const stack = [def.start];
  let end = false;
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id) || !def.nodes[id]) continue;
    seen.add(id);
    const n = def.nodes[id];
    if (n.type === "end") end = true;
    if ("next" in n && n.next) stack.push(n.next);
    if (n.type === "branch") stack.push(...n.options.map((o) => o.next));
    if (n.type === "trigger" && n.elseNext) stack.push(n.elseNext);
  }
  if (!end) errs.push("no reachable end node");
  return errs;
}
