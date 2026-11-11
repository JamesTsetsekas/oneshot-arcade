/**
 * Data-driven mission graph runtime. Mission scripts are plain data (see missionDefs.ts); the runtime talks
 * to the game only through MissionHost - scripts may request spawns and set goals but cannot fork vehicle,
 * police or combat logic, and cannot teleport traffic/police into view.
 */

export interface Line { who: string; text: string; ms?: number }
export interface Marker { x: number; z: number; r?: number; label?: string; tag?: string; icon?: string }

export type SpawnSpec =
  | { kind: 'vehicle'; tag: string; def: string; x: number; z: number; heading: number; color?: number; behavior: 'parked' | 'flee' | 'idle'; cargo?: boolean; locked?: boolean; ownedByPlayer?: boolean; farFrom?: { x: number; z: number; min: number } }
  | { kind: 'npc'; tag: string; x: number; z: number; role: string; variant?: number }
  | { kind: 'chasers'; tag: string; count: number; def: string; behind: number };

export type Cond =
  | { c: 'zone'; x: number; z: number; r: number; tag?: string; stop?: boolean; onFoot?: boolean }
  | { c: 'interact'; x: number; z: number; r: number; prompt: string; onFoot?: boolean }
  | { c: 'enterVehicle'; tag: string }
  | { c: 'inVehicle' }
  | { c: 'sees'; tag: string; range: number }
  | { c: 'vehicleStopped'; tag: string }
  | { c: 'wait'; s: number }
  | { c: 'flag'; key: string };

export type FailCond =
  | { c: 'timeUp'; s: number; fromObjective?: string }
  | { c: 'vehicleDead'; tag: string }
  | { c: 'cargoLost'; tag: string }
  | { c: 'tierAtLeast'; tier: number };

export type MissionNode =
  | { t: 'dialogue'; lines: Line[]; next: string }
  | { t: 'objective'; id: string; text: string; cond: Cond; marker?: Marker; next: string; timer?: number }
  | { t: 'spawn'; spawn: SpawnSpec; next: string }
  | { t: 'set'; key: string; value: number | string | boolean; next: string }
  | { t: 'branch'; key: string; equals: number | string | boolean; then: string; else: string }
  | { t: 'choice'; prompt: string; options: Array<{ text: string; set: Record<string, number | string | boolean>; cost?: number; next: string }> }
  | { t: 'checkpoint'; id: string; restore: SpawnSpec[]; next: string }
  | { t: 'signal'; axis: 'x' | 'z'; next: string }
  | { t: 'reward'; next: string }
  | { t: 'cleanup'; tags: string[]; keep?: string[]; next: string }
  | { t: 'end' };

export interface MissionDef {
  id: string;
  title: string;
  kind: 'story' | 'activity';
  giver: string;
  summary: string;
  reward: { cash: number; trust: number };
  optional: Array<{ id: string; text: string; /** evaluated at completion */ rule: 'time' | 'nocrime' | 'nodamage' | 'safe' | 'cargo'; limit?: number }>;
  requires?: { mission?: string; trust?: number };
  start: string;
  nodes: Record<string, MissionNode>;
  fails: Array<{ when: FailCond; reason: string }>;
  repeatable: boolean;
  version: number;
}

export interface MissionStats { damageTaken: number; civilianHarm: number; crimes: number; vehicleImpacts: number; cargo: number | null }

export interface MissionHost {
  time(): number;
  player(): { x: number; z: number; onFoot: boolean; vehicleTag: string | null; speed: number; tier: number };
  vehicle(tag: string): { x: number; z: number; speed: number; healthPct: number; cargo: number | null; alive: boolean; driverIsPlayer: boolean; disabled: boolean } | null;
  canSee(tag: string, range: number): boolean;
  consumeInteract(): boolean;
  setPrompt(text: string | null): void;
  say(line: Line): void;
  banner(title: string, sub: string): void;
  setObjective(text: string, timer: number | null): void;
  setMarker(m: Marker | null): void;
  spawn(spec: SpawnSpec): void;
  cleanup(tags: string[], keep: string[]): void;
  reward(cash: number, trust: number, grade: string, notes: string[]): void;
  spend(cash: number): boolean;
  restore(checkpoint: { id: string; specs: SpawnSpec[] }): void;
  checkpoint(id: string): void;
  requestGreen(axis: 'x' | 'z'): void;
  stats(): MissionStats;
  failed(reason: string): void;
  completed(result: MissionResult): void;
  choose(prompt: string, options: string[], cb: (i: number) => void): void;
}

export interface MissionResult { id: string; grade: 'S' | 'A' | 'B' | 'C'; cash: number; trust: number; time: number; notes: string[]; optionalDone: string[] }

export type MissionStatus = 'idle' | 'running' | 'failed' | 'complete';

export interface MissionSnapshot { id: string; node: string; flags: Record<string, number | string | boolean>; elapsed: number; checkpoint: string | null; status: MissionStatus; objStart: number }

/** Validate a mission definition: every `next` resolves, start exists, an end is reachable. */
export function validateMission(def: MissionDef): string[] {
  const errors: string[] = [];
  const ids = new Set(Object.keys(def.nodes));
  if (!ids.has(def.start)) errors.push('start node missing');
  let hasEnd = false;
  const check = (from: string, to: string | undefined) => { if (to !== undefined && !ids.has(to)) errors.push(`${from} -> ${to} unresolved`); };
  for (const [id, n] of Object.entries(def.nodes)) {
    switch (n.t) {
      case 'branch': check(id, n.then); check(id, n.else); break;
      case 'choice': n.options.forEach((o) => check(id, o.next)); break;
      case 'end': hasEnd = true; break;
      default: check(id, (n as { next: string }).next);
    }
  }
  if (!hasEnd) errors.push('no end node');
  if (!def.reward || def.reward.cash < 0) errors.push('bad reward');
  return errors;
}

export class MissionRuntime {
  status: MissionStatus = 'idle';
  def: MissionDef | null = null;
  node = '';
  flags: Record<string, number | string | boolean> = {};
  elapsed = 0;
  objStart = 0;
  checkpoint: { id: string; specs: SpawnSpec[]; node: string } | null = null;
  rewarded = false;
  currentObjective: { text: string; timer: number | null; marker: Marker | null; optional: string[] } | null = null;
  private waitT = 0;
  private dialogueT = 0;
  private dialogueQueue: Line[] = [];
  private choosing = false;
  private failReason = '';
  private startT = 0;
  private pendingNext: string | null = null;

  constructor(private host: MissionHost) {}

  get running(): boolean { return this.status === 'running'; }

  start(def: MissionDef): void {
    const errs = validateMission(def);
    if (errs.length) throw new Error('mission invalid: ' + errs.join('; '));
    this.def = def;
    this.status = 'running';
    this.flags = {};
    this.elapsed = 0;
    this.checkpoint = null;
    this.rewarded = false;
    this.startT = this.host.time();
    this.objStart = this.elapsed;
    this.node = def.start;
    this.currentObjective = null;
    this.dialogueQueue = [];
    this.dialogueT = 0;
    this.waitT = 0;
    this.choosing = false;
    this.host.banner(def.title, def.summary);
    this.advance();
  }

  snapshot(): MissionSnapshot | null {
    if (!this.def || this.status === 'idle') return null;
    return { id: this.def.id, node: this.checkpoint ? this.checkpoint.node : this.node === '__dialogue__' ? (this.pendingNext ?? this.def.start) : this.node, flags: { ...this.flags }, elapsed: this.elapsed, checkpoint: this.checkpoint?.id ?? null, status: this.status, objStart: this.objStart };
  }

  /** Resume from a saved snapshot (checkpoint or start). */
  resume(def: MissionDef, snap: MissionSnapshot): void {
    this.def = def;
    this.status = 'running';
    this.flags = { ...snap.flags };
    this.elapsed = snap.elapsed;
    this.rewarded = false;
    this.currentObjective = null;
    this.dialogueQueue = [];
    this.choosing = false;
    this.checkpoint = null;
    this.node = def.start;
    if (snap.checkpoint) {
      for (const n of Object.values(def.nodes)) {
        if (n.t === 'checkpoint' && n.id === snap.checkpoint) { this.checkpoint = { id: n.id, specs: n.restore, node: n.next }; this.node = n.next; this.host.restore({ id: n.id, specs: n.restore }); }
      }
    }
    this.objStart = this.elapsed;
    this.advance();
  }

  /** Abandon: clean everything up and return to free roam without rewards. */
  abandon(): void {
    if (!this.def) return;
    const tags = this.allTags();
    this.host.cleanup(tags, []);
    this.host.setObjective('', null);
    this.host.setMarker(null);
    this.host.setPrompt(null);
    this.status = 'idle';
    this.def = null;
    this.currentObjective = null;
  }

  retry(): void {
    if (!this.def || this.status !== 'failed') return;
    this.status = 'running';
    this.failReason = '';
    if (this.checkpoint) {
      this.host.restore({ id: this.checkpoint.id, specs: this.checkpoint.specs });
      this.node = this.checkpoint.node;
    } else {
      this.host.cleanup(this.allTags(), []);
      this.node = this.def.start;
      this.flags = {};
      this.elapsed = 0;
    }
    this.currentObjective = null;
    this.objStart = this.elapsed;
    this.advance();
  }

  private allTags(): string[] {
    const tags = new Set<string>();
    if (!this.def) return [];
    for (const n of Object.values(this.def.nodes)) {
      if (n.t === 'spawn') tags.add(n.spawn.tag);
      if (n.t === 'checkpoint') n.restore.forEach((s) => tags.add(s.tag));
    }
    return [...tags];
  }

  private fail(reason: string): void {
    if (this.status !== 'running') return;
    this.status = 'failed';
    this.failReason = reason;
    this.host.setPrompt(null);
    this.host.failed(reason);
  }

  /** Called when the player is incapacitated or arrested while a mission runs. */
  playerFailed(reason: string): void { this.fail(reason); }

  /** Run non-blocking nodes until we hit a blocking one. */
  private advance(): void {
    if (!this.def) return;
    let guard = 0;
    while (guard++ < 200 && this.status === 'running') {
      const n = this.def.nodes[this.node];
      if (!n) { this.fail('Mission script error'); return; }
      switch (n.t) {
        case 'dialogue':
          this.dialogueQueue = [...n.lines];
          this.dialogueT = 0;
          this.pendingNext = n.next;
          this.node = '__dialogue__';
          this.nextDialogueLine();
          return;
        case 'objective':
          this.currentObjective = { text: n.text, timer: n.timer ?? null, marker: n.marker ?? null, optional: [] };
          this.objStart = this.elapsed;
          this.host.setObjective(n.text, n.timer ?? null);
          this.host.setMarker(n.marker ?? null);
          this.waitT = 0;
          return;
        case 'spawn': this.host.spawn(n.spawn); this.node = n.next; break;
        case 'set': this.flags[n.key] = n.value; this.node = n.next; break;
        case 'branch': this.node = this.flags[n.key] === n.equals ? n.then : n.else; break;
        case 'checkpoint': this.checkpoint = { id: n.id, specs: n.restore, node: n.next }; this.host.checkpoint(n.id); this.node = n.next; break;
        case 'signal': this.host.requestGreen(n.axis); this.node = n.next; break;
        case 'choice':
          if (!this.choosing) {
            this.choosing = true;
            const opts = n.options;
            this.host.choose(n.prompt, opts.map((o) => o.text + (o.cost ? ` ($${o.cost})` : '')), (i) => {
              const o = opts[Math.max(0, Math.min(opts.length - 1, i))];
              if (o.cost && !this.host.spend(o.cost)) { this.host.say({ who: 'Rowan', text: "Not enough cash for that. I'll ask nicely.", ms: 2200 }); const alt = opts.find((q) => !q.cost) ?? opts[0]; Object.assign(this.flags, alt.set); this.node = alt.next; }
              else { Object.assign(this.flags, o.set); this.node = o.next; }
              this.choosing = false;
              this.advance();
            });
          }
          return;
        case 'reward': this.giveReward(); this.node = n.next; break;
        case 'cleanup': this.host.cleanup(n.tags, n.keep ?? []); this.node = n.next; break;
        case 'end':
          if (this.status === 'running' && this.node !== '__dialogue__') {
            this.status = 'complete';
            this.host.setObjective('', null);
            this.host.setMarker(null);
            this.host.setPrompt(null);
          }
          return;
      }
    }
  }

  private nextDialogueLine(): void {
    const line = this.dialogueQueue.shift();
    if (!line) {
      this.node = this.pendingNext ?? '';
      this.pendingNext = null;
      this.advance();
      return;
    }
    this.host.say(line);
    this.dialogueT = (line.ms ?? Math.max(2200, line.text.length * 55)) / 1000;
  }

  private giveReward(): void {
    if (!this.def || this.rewarded) return;
    this.rewarded = true; // rewards pay exactly once per run
    const stats = this.host.stats();
    const elapsed = this.elapsed;
    let score = 62;
    const done: string[] = [];
    const notes: string[] = [];
    for (const o of this.def.optional) {
      let ok = false;
      switch (o.rule) {
        case 'time': ok = elapsed <= (o.limit ?? 180); break;
        case 'nocrime': ok = stats.crimes === 0; break;
        case 'nodamage': ok = stats.vehicleImpacts <= (o.limit ?? 2); break;
        case 'safe': ok = stats.civilianHarm === 0; break;
        case 'cargo': ok = (stats.cargo ?? 100) >= (o.limit ?? 70); break;
      }
      if (ok) { score += 12; done.push(o.id); }
    }
    if (stats.civilianHarm > 0) { score -= 30; notes.push('Civilians were harmed: reward reduced'); }
    if (stats.crimes > 3) { score -= 8; notes.push('Heavy police attention'); }
    score -= Math.min(15, stats.vehicleImpacts * 1.5);
    if (stats.cargo !== null) score += Math.round((stats.cargo - 100) * 0.15);
    const grade: MissionResult['grade'] = score >= 88 ? 'S' : score >= 72 ? 'A' : score >= 56 ? 'B' : 'C';
    const mul = { S: 1.3, A: 1.15, B: 1, C: 0.8 }[grade] * (stats.civilianHarm > 0 ? 0.6 : 1);
    const cash = Math.round(this.def.reward.cash * mul);
    this.host.reward(cash, this.def.reward.trust, grade, notes);
    this.host.completed({ id: this.def.id, grade, cash, trust: this.def.reward.trust, time: elapsed, notes, optionalDone: done });
  }

  /** Per-frame update. */
  update(dt: number): void {
    if (this.status !== 'running' || !this.def) return;
    this.elapsed += dt;
    const def = this.def;
    // fail conditions (checked during dialogue too)
    const pl = this.host.player();
    for (const f of def.fails) {
      const w = f.when;
      if (w.c === 'timeUp') { if (this.currentObjective && this.currentObjective.timer !== null && this.elapsed - this.objStart > this.currentObjective.timer) { this.fail(f.reason); return; } }
      else if (w.c === 'vehicleDead') { const v = this.host.vehicle(w.tag); if (v && (!v.alive || (v.healthPct <= 0 && v.disabled))) { this.fail(f.reason); return; } }
      else if (w.c === 'cargoLost') { const v = this.host.vehicle(w.tag); if (v && v.cargo !== null && v.cargo <= 0) { this.fail(f.reason); return; } }
      else if (w.c === 'tierAtLeast') { if (pl.tier >= w.tier && this.currentObjective) { this.fail(f.reason); return; } }
    }
    // dialogue pacing
    if (this.node === '__dialogue__') {
      this.dialogueT -= dt;
      if (this.dialogueT <= 0) this.nextDialogueLine();
      return;
    }
    const n = def.nodes[this.node];
    if (!n || n.t !== 'objective') return;
    // timed objective with its own limit (no explicit fail cond => fail on expiry)
    if (n.timer !== undefined && this.elapsed - this.objStart > n.timer && !def.fails.some((f) => f.when.c === 'timeUp')) { this.fail('Out of time'); return; }
    if (this.currentObjective) this.currentObjective.timer = n.timer !== undefined ? Math.max(0, n.timer - (this.elapsed - this.objStart)) : null;
    if (this.evalCond(n.cond, dt)) {
      this.host.setPrompt(null);
      this.node = n.next;
      this.currentObjective = null;
      this.advance();
    }
  }

  private evalCond(c: Cond, dt: number): boolean {
    const p = this.host.player();
    switch (c.c) {
      case 'zone': {
        const near = Math.hypot(p.x - c.x, p.z - c.z) < c.r;
        if (c.tag) {
          const v = this.host.vehicle(c.tag);
          if (!v) return false;
          const vin = Math.hypot(v.x - c.x, v.z - c.z) < c.r;
          if (c.onFoot) return vin && p.vehicleTag === null;
          if (c.stop) return vin && Math.abs(v.speed) < 1.2 && p.vehicleTag === c.tag;
          return vin && p.vehicleTag === c.tag;
        }
        if (c.onFoot) return near && p.onFoot;
        if (c.onFoot === false) return near && !p.onFoot;
        return near && (!c.stop || p.speed < 1.2);
      }
      case 'interact': {
        const near = Math.hypot(p.x - c.x, p.z - c.z) < c.r && (c.onFoot === false || p.onFoot);
        this.host.setPrompt(near ? c.prompt : null);
        if (near && this.host.consumeInteract()) return true;
        return false;
      }
      case 'enterVehicle': return p.vehicleTag === c.tag;
      case 'inVehicle': return !p.onFoot;
      case 'sees': return this.host.canSee(c.tag, c.range);
      case 'vehicleStopped': { const v = this.host.vehicle(c.tag); return !!v && (v.disabled || Math.abs(v.speed) < 0.8); }
      case 'wait': this.waitT += dt; return this.waitT >= c.s;
      case 'flag': return !!this.flags[c.key];
    }
  }
}
