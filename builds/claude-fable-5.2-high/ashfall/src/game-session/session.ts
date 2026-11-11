import { beginSkill, executeSkill, projectileHit } from '../abilities/execute';
import { SKILL, basicOf, skillRank, type SkillDef } from '../abilities/skills';
import { type Vec, angTo, dist } from '../core/math';
import { Rng, hashSeed } from '../core/rng';
import { addStatus, getStatus, hasStatus, healPlayer, integrateKnock, playerHit, removeStatus, spawnArea, spawnEnemy, tickStatuses, updateAreas, updateProjectiles } from '../entity-combat/combat';
import { computeStats } from '../entity-combat/stats';
import { CELL, DT, type Actor, type DamageType, type Ev, type Hero, type Intent, type Interactable, type Projectile, type Src, type Stats, type Status, type Zone } from '../entity-combat/types';
import { POTIONS } from '../items/content';
import { itemName } from '../items/generate';
import { addItem } from '../items/inventory';
import { chestLoot, rollDrops } from '../items/loot';
import { aiTick, assignSlots, separate } from '../navigation-ai/ai';
import { initBoss, resetBoss } from '../navigation-ai/boss';
import { ELITE_MODS, ENEMY, MOD, ZONE_ENEMIES, scaleDmg } from '../navigation-ai/enemies';
import { FLOOR, circleFree, findPath, los, moveCircle, nearestFree } from '../navigation-ai/grid';
import { grantXp } from '../progression/progression';
import { QUEST_DONE, questTrigger } from '../progression/quests';
import { ZONE_INFO, generateZone } from '../world-generation/generate';

export interface Dash { vx: number; vy: number; t: number; hit: number[]; skill: string; coef: number; phase: boolean }
export interface Action { def: SkillDef; rank: number; t: number; wind: number; total: number; cancel: number; fired: boolean; ax: number; ay: number; target: number }
export interface PlayerCtl {
  path: Vec[]; intent: Intent | null; action: Action | null; cds: Record<string, number>; charges: Record<string, number>;
  evade: number; evadeT: number; dash: Dash | null; combo: number; moved: number; still: number; heat: number; focus: number;
  potionCd: number[]; gate: number; lastHit: number; lastSrc: string; lastType: DamageType; ccT: number; repath: number; invalidT: number;
}
export const EVADE_MAX = 3;
export const GATE_TIME = 3;
const newPc = (): PlayerCtl => ({ path: [], intent: null, action: null, cds: {}, charges: {}, evade: EVADE_MAX, evadeT: 0, dash: null, combo: 0, moved: 0, still: 0, heat: 0, focus: 0,
  potionCd: [0, 0, 0, 0], gate: -1, lastHit: 99, lastSrc: '', lastType: 'physical', ccT: 0, repath: 0, invalidT: 0 });

/** Owns simulation truth for one character: fixed 30 Hz ticks, zones, quests and typed events for presentation layers. */
export class Session {
  hero: Hero; zone!: Zone; player!: Actor; pc: PlayerCtl = newPc(); stats: Stats;
  rng: Rng; lootRng: Rng; events: Ev[] = []; time = 0; zones = new Map<string, Zone>();
  dps: [number, number][] = []; dirty = true; saveRequested = false; saveT = 0;
  portal: { zone: string; x: number; y: number } | null = null; huntStart = 0; deathLog: { time: number; zone: string; cause: string; level: number }[] = [];
  summary: { time: number; kills: number; deaths: number; level: number; difficulty: number; hunt?: string } | null = null;
  private nid = 1000;

  constructor(hero: Hero) {
    this.hero = hero;
    this.stats = computeStats(hero);
    this.rng = new Rng(hashSeed(hero.runSeed, 'combat' + hero.runs));
    this.lootRng = new Rng(hashSeed(hero.runSeed, `loot${hero.runs}:${hero.stats.kills}`));
    this.enterZone('refuge', 'start');
    this.player.hp = this.stats.hpMax; this.pc.focus = this.stats.focusMax;
  }
  id() { return this.nid++; }
  emit(e: Ev) { this.events.push(e); }
  toast(text: string, s?: string) { this.emit({ type: 'toast', x: this.player.x, y: this.player.y, text, s }); }
  actor(id: number): Actor | undefined { return this.zone.actors.find((a) => a.id === id); }
  /** Recompute derived stats after any hero mutation (gear, points, blessing). */
  refresh(): void {
    this.stats = computeStats(this.hero);
    if (this.player) { this.player.maxHp = this.stats.hpMax; this.player.hp = Math.min(this.player.hp, this.stats.hpMax); }
    this.pc.focus = Math.min(this.pc.focus, this.stats.focusMax);
    this.dirty = true;
  }
  quest(key: string): void {
    const done = questTrigger(this.hero, key);
    if (!done.length) return;
    let xp = 0;
    for (const q of done) { xp += q.xp; this.hero.gold += q.gold; this.hero.skillPoints += q.sp ?? 0; }
    this.giveXp(xp);
    this.emit({ type: 'quest', x: this.player.x, y: this.player.y, text: done[done.length - 1].title, a: xp });
    this.dirty = true; this.saveRequested = true;
  }
  giveXp(xp: number): void {
    const lv = grantXp(this.hero, xp * (1 + (this.stats.xpPct ?? 0) / 100));
    if (lv > 0) {
      this.refresh();
      this.player.hp = this.stats.hpMax; this.pc.focus = this.stats.focusMax;
      this.emit({ type: 'levelup', x: this.player.x, y: this.player.y, a: this.hero.level });
    }
    this.dirty = true;
  }
  // ─────────────── zones ───────────────
  private populate(zone: Zone): void {
    const prev = this.zone;
    this.zone = zone;
    const hero = this.hero, rng = new Rng(hashSeed(zone.seed, 'pop')), vet = hero.difficulty > 0;
    const table = ZONE_ENEMIES[zone.id] ?? ZONE_ENEMIES.march;
    let pack = 1;
    for (const sp of zone.spawns) {
      const [kind, off] = sp.kind.split(':');
      const lvl = zone.level + Number(off);
      if (kind === 'urn' || kind === 'brazier' || kind === 'dummy') { spawnEnemy(this, kind, sp.x, sp.y, zone.level); continue; }
      if (kind === 'B') {
        const def = zone.id === 'march' || zone.id === 'hunt_toll' ? 'tollkeeper' : 'engine';
        if (zone.id === 'march' && hero.flags.toll_dead) continue;
        if (zone.id === 'archive3' && hero.flags.engine_dead) continue;
        const b = spawnEnemy(this, def, sp.x, sp.y, zone.level + (def === 'tollkeeper' ? 4 : 1));
        b.bs = initBoss(b);
        continue;
      }
      const id = pack++;
      const put = (def: string, o: Partial<Actor> = {}) => {
        const ang = rng.range(0, 6.28), d = rng.range(0.4, 3);
        const pos = nearestFree(zone, sp.x + Math.cos(ang) * d, sp.y + Math.sin(ang) * d, ENEMY[def].r) ?? { x: sp.x, y: sp.y };
        return spawnEnemy(this, def, pos.x, pos.y, lvl, { pack: id, ...o });
      };
      let budget = kind === 'p' ? rng.int(4, 6) : kind === 'P' ? rng.int(7, 10) : rng.int(4, 6);
      if (vet) budget += 2;
      if (kind === 'E' || (vet && kind === 'P' && rng.chance(0.4))) {
        const base = rng.weighted(table.filter(([d]) => d !== 'mite' && d !== 'crawler'), (t) => t[1])[0];
        const mods: string[] = [];
        let threat = vet ? 5 : 3;
        for (const m of rng.shuffle([...ELITE_MODS])) {
          if (mods.length >= (vet ? 2 : 1) || m.cost > threat || mods.some((x) => MOD[x].excl.includes(m.id))) continue;
          mods.push(m.id); threat -= m.cost;
        }
        put(base, { elite: true, mods, name: `${mods.map((m) => MOD[m].name).join(' ')} ${ENEMY[base].name}` });
      }
      let guard = 0;
      while (budget > 0 && guard++ < 30) {
        const opts = table.filter(([d]) => ENEMY[d].points <= budget);
        if (!opts.length) break;
        const d = rng.weighted(opts, (t) => t[1])[0];
        put(d); budget -= ENEMY[d].points;
        if (d === 'crawler' && budget > 0) { put(d); budget--; }
      }
    }
    for (const it of zone.inter) {
      if (it.type === 'waypoint' && hero.waypoints.includes(it.key!)) it.state = 1;
      if (it.type === 'chest' && hero.flags[`chest:${zone.id}:${it.id}`]) it.state = 1;
      if (it.type === 'cage' && (hero.flags.artificer || zone.id !== 'march')) it.state = 1;
      if ((it.type === 'lever' || it.type === 'door') && hero.flags.shortcut) { it.state = 1; if (it.cells) for (const c of it.cells) zone.cells[c] = FLOOR; }
    }
    this.zone = prev;
  }
  enterZone(id: string, entry: string, at?: Vec): void {
    const hero = this.hero;
    if (this.zone && this.player) this.zone.actors = this.zone.actors.filter((a) => a !== this.player);
    let zone = this.zones.get(id);
    if (!zone) { zone = generateZone(id, hero.runSeed, hero.difficulty); this.zones.set(id, zone); this.populate(zone); }
    this.zone = zone;
    const pos = at ?? zone.entries[entry] ?? zone.entries.start;
    const free = nearestFree(zone, pos.x, pos.y) ?? pos;
    if (!this.player) {
      this.player = { id: 1, kind: 'player', def: hero.cls, name: hero.name, x: free.x, y: free.y, px: free.x, py: free.y, facing: -Math.PI / 2, r: 0.45, hp: this.stats.hpMax, maxHp: this.stats.hpMax,
        team: 0, dead: false, deadT: 0, lvl: hero.level, statuses: [], kx: 0, ky: 0, anim: 'idle', animT: 0, animDur: 1, dmg: 0, speed: 0, armor: 0, res: {}, mods: [], elite: false, boss: false, heavy: false, pack: 0 };
    }
    const p = this.player;
    p.x = p.px = free.x; p.y = p.py = free.y; p.kx = p.ky = 0;
    zone.actors.push(p);
    const pc = this.pc;
    pc.path = []; pc.intent = null; pc.action = null; pc.dash = null; pc.gate = -1;
    hero.zone = id;
    for (const it of zone.inter) {
      if (it.npc === 'artificer') it.state = hero.flags.artificer ? 0 : -1;
      if (it.key === 'hunt') it.state = hero.flags.act_done ? 0 : -1;
    }
    zone.inter = zone.inter.filter((i) => i.key !== 'return');
    if (id === 'refuge') {
      p.hp = this.stats.hpMax; p.statuses = [];
      if (this.portal) zone.inter.push({ id: this.id(), x: zone.entries.start.x + 3, y: zone.entries.start.y - 1, type: 'portal', label: `Return to ${ZONE_INFO[this.portal.zone].name}`, state: 0, key: 'return' });
    }
    if (hero.echo && hero.echo.zone === id && !zone.pickups.some((k) => k.kind === 'echo')) zone.pickups.push({ id: this.id(), x: hero.echo.x, y: hero.echo.y, kind: 'echo', amount: hero.echo.gold, t: 0 });
    if (id.startsWith('hunt_')) this.huntStart = this.time;
    // Checkpoint immediately before the boss arena: the vault waypoint wakes on arrival.
    if (id === 'archive3' && !hero.waypoints.includes('archive3')) { hero.waypoints.push('archive3'); for (const it of zone.inter) if (it.type === 'waypoint') it.state = 1; }
    this.reveal();
    this.emit({ type: 'zone', x: p.x, y: p.y, s: id, text: zone.name });
    this.quest('enter:' + id);
    this.saveRequested = true; this.dirty = true;
  }
  private reveal(): void {
    const z = this.zone, p = this.player, cx = Math.floor(p.x / CELL), cy = Math.floor(p.y / CELL), R = 6;
    for (let y = Math.max(0, cy - R); y <= Math.min(z.h - 1, cy + R); y++) for (let x = Math.max(0, cx - R); x <= Math.min(z.w - 1, cx + R); x++)
      if ((x - cx) ** 2 + (y - cy) ** 2 <= R * R) z.discovered[y * z.w + x] = 1;
  }
  /** Starts a fresh seeded expedition (story replay or Veteran) keeping the character. */
  newExpedition(difficulty: number): void {
    const h = this.hero;
    h.difficulty = Math.min(difficulty, h.maxDifficulty); h.runs++; h.runSeed = hashSeed(h.runSeed, 'run' + h.runs);
    h.quest = 1; h.waypoints = ['refuge']; h.echo = null; h.stats.runTime = 0;
    for (const k of Object.keys(h.flags)) if (k === 'toll_dead' || k === 'engine_dead' || k === 'shortcut' || k.startsWith('chest:') || k === 'hunter_done') delete h.flags[k];
    h.vendorSeed = hashSeed(h.runSeed, 'vendor');
    this.zones.clear(); this.portal = null; this.summary = null;
    this.rng = new Rng(hashSeed(h.runSeed, 'combat' + h.runs));
    this.lootRng = new Rng(hashSeed(h.runSeed, 'loot' + h.runs));
    this.enterZone('refuge', 'start');
    this.toast(difficulty > 0 ? 'Veteran expedition begins' : 'A new expedition begins', 'quest');
  }
  startHunt(target: 'toll' | 'engine'): void {
    this.zones.delete('hunt_' + target);
    this.hero.runSeed = hashSeed(this.hero.runSeed, 'hunt' + this.time.toFixed(2));
    this.enterZone('hunt_' + target, 'start');
  }
  travelWaypoint(zoneId: string): void {
    if (!this.hero.waypoints.includes(zoneId) || zoneId === this.zone.id) return;
    this.emit({ type: 'sfx', x: this.player.x, y: this.player.y, s: 'waypoint' });
    this.enterZone(zoneId, 'waypoint');
  }
  // ─────────────── player commands ───────────────
  intent(i: Intent): void {
    const p = this.player, pc = this.pc, z = this.zone;
    if (p.dead) return;
    if (i.type === 'potion') { this.usePotion(i.slot); return; }
    if (i.type !== 'gate' && pc.gate >= 0) pc.gate = -1;
    if (i.type === 'evade') { this.evade(i.x, i.y); return; }
    if (i.type === 'gate') {
      if (z.safe) { this.toast('You are already in the Refuge'); return; }
      if (pc.gate < 0) { pc.gate = 0; pc.intent = null; pc.path = []; this.emit({ type: 'sfx', x: p.x, y: p.y, s: 'gate_start' }); }
      return;
    }
    if (i.type === 'move' || i.type === 'interact' || i.type === 'pickup') {
      let tx: number, ty: number;
      if (i.type === 'move') { tx = i.x; ty = i.y; }
      else {
        const t = i.type === 'interact' ? z.inter.find((k) => k.id === i.id) : z.pickups.find((k) => k.id === i.id);
        if (!t) return;
        tx = t.x; ty = t.y;
      }
      const goal = nearestFree(z, tx, ty, p.r);
      if (!goal) { this.invalid(tx, ty); return; }
      if (i.type === 'move' && dist(goal.x, goal.y, tx, ty) > 1.5) this.invalid(tx, ty);
      const path = findPath(z, p.x, p.y, goal.x, goal.y, p.r);
      if (!path) { this.invalid(tx, ty); return; }
      pc.path = path;
    }
    pc.intent = i;
  }
  private invalid(x: number, y: number): void {
    if (this.pc.invalidT > 0) return;
    this.pc.invalidT = 0.4;
    this.emit({ type: 'invalid', x, y });
  }
  usePotion(slot: number): void {
    const h = this.hero, pc = this.pc, p = this.player, st = this.stats;
    if (p.dead || pc.potionCd[slot] > 0) return;
    if (h.belt[slot] <= 0) { this.emit({ type: 'sfx', x: p.x, y: p.y, s: 'invalid' }); return; }
    const m = 1 + (st.potionPct ?? 0) / 100;
    if (slot === 0) { if (p.hp >= st.hpMax) return; healPlayer(this, st.hpMax * 0.4 * m); }
    else if (slot === 1) { if (pc.focus >= st.focusMax) return; pc.focus = Math.min(st.focusMax, pc.focus + st.focusMax * 0.6 * m); }
    else if (slot === 2) { for (const id of ['burn', 'blight', 'chill', 'root', 'stun'] as const) removeStatus(p, id); addStatus(this, p, 'cleansed', 3 * m, 0, p.id); }
    else addStatus(this, p, 'tonic', 20 * m, 25, p.id);
    h.belt[slot]--; pc.potionCd[slot] = slot === 0 ? 4 : 2;
    this.emit({ type: 'sfx', x: p.x, y: p.y, s: 'potion' });
    this.emit({ type: 'fx', x: p.x, y: p.y, s: 'potion', a: slot });
    this.dirty = true;
  }
  private evade(x: number, y: number): void {
    const p = this.player, pc = this.pc;
    if (pc.evade <= 0 || pc.dash || hasStatus(p, 'stun') || hasStatus(p, 'root')) { if (pc.evade <= 0) this.emit({ type: 'sfx', x: p.x, y: p.y, s: 'invalid' }); return; }
    const a = dist(p.x, p.y, x, y) < 0.3 ? p.facing : angTo(p.x, p.y, x, y);
    pc.evade--; pc.action = null; pc.intent = null; pc.path = [];
    pc.dash = { vx: Math.cos(a) * 4.5 / 0.32, vy: Math.sin(a) * 4.5 / 0.32, t: 0.32, hit: [], skill: '', coef: 0, phase: true };
    p.facing = a;
    if (this.stats.relic_mothwing) addStatus(this, p, 'haste', 2, 0.3, p.id);
    this.emit({ type: 'evade', x: p.x, y: p.y, b: a });
    this.emit({ type: 'sfx', x: p.x, y: p.y, s: 'evade' });
  }
  skillState(slot: number): { def: SkillDef | null; cd: number; cdMax: number; charges: number; ok: boolean } {
    const id = this.hero.hotbar[slot];
    const def = id ? SKILL[id] : null;
    if (!def) return { def: null, cd: 0, cdMax: 0, charges: 0, ok: false };
    const max = this.maxCharges(def);
    const ch = max ? this.pc.charges[def.id] ?? max : 0;
    const cd = max ? (ch > 0 ? 0 : this.pc.cds[def.id] ?? 0) : this.pc.cds[def.id] ?? 0;
    return { def, cd, cdMax: def.cooldown, charges: ch, ok: cd <= 0 && this.pc.focus >= def.cost };
  }
  private maxCharges(def: SkillDef) { return def.charges ? def.charges + (def.id === 'snare_bloom' && this.stats.cap_patient_hunter ? 1 : 0) : 0; }
  private startAction(def: SkillDef, ax: number, ay: number, target = 0): boolean {
    const p = this.player, pc = this.pc, st = this.stats;
    const rank = Math.max(1, skillRank(this.hero.ranks, st, def.id));
    if (def.kind !== 'basic') {
      const max = this.maxCharges(def);
      if (max) {
        const ch = pc.charges[def.id] ?? max;
        if (ch <= 0) return false;
        pc.charges[def.id] = ch - 1;
        if (!pc.cds[def.id] || pc.cds[def.id] <= 0) pc.cds[def.id] = def.cooldown;
      } else {
        if ((pc.cds[def.id] ?? 0) > 0) return false;
        if (def.cooldown) pc.cds[def.id] = def.cooldown * (def.id === 'cinder_ring' && st.cap_living_crucible ? 0.7 : 1);
      }
      if (pc.focus < def.cost) { if (max) pc.charges[def.id]++; else pc.cds[def.id] = 0; return false; }
      pc.focus -= def.cost;
    }
    const fur = getStatus(p, 'furnace');
    const speedy = def.tags.includes('melee') || def.tags.includes('ranged');
    const haste = 1 + ((st.attackSpeed ?? 0) + 0.4 * (st.finesse ?? 0) + (fur ? SKILL.furnace_heart.p.as : 0)) / 100;
    let total = def.total, wind = def.windup;
    if (def.kind === 'basic') { total = 1000 / (st.aps * (fur ? 1 + SKILL.furnace_heart.p.as / 100 : 1)); wind = total * (def.windup / def.total); }
    else if (speedy) { total /= haste; wind /= haste; }
    pc.action = { def, rank, t: 0, wind, total, cancel: def.cancel, fired: false, ax, ay, target };
    if (def.targeting !== 'self') p.facing = angTo(p.x, p.y, ax, ay);
    pc.path = [];
    beginSkill(this, def, rank);
    this.emit({ type: 'sfx', x: p.x, y: p.y, s: 'windup_' + (def.tags.includes('melee') ? 'melee' : def.tags.includes('ranged') ? 'bow' : 'cast') });
    return true;
  }
  private playerTick(): void {
    const p = this.player, pc = this.pc, st = this.stats, z = this.zone, hero = this.hero;
    for (const k of Object.keys(pc.cds)) {
      if (pc.cds[k] <= 0) continue;
      pc.cds[k] -= DT;
      const def = SKILL[k], max = def ? this.maxCharges(def) : 0;
      if (pc.cds[k] <= 0 && max) {
        pc.charges[k] = Math.min(max, (pc.charges[k] ?? max) + 1);
        pc.cds[k] = pc.charges[k] < max ? def.cooldown : 0;
      }
      if (pc.cds[k] <= 0 && !max && hero.hotbar.includes(k)) this.emit({ type: 'sfx', x: p.x, y: p.y, s: 'ready' });
    }
    for (let i = 0; i < 4; i++) if (pc.potionCd[i] > 0) pc.potionCd[i] -= DT;
    if (pc.evade < EVADE_MAX) { pc.evadeT += DT * (1 + (st.evadeCdr ?? 0) / 100); if (pc.evadeT >= 2.8) { pc.evadeT = 0; pc.evade++; } }
    pc.lastHit += DT; if (pc.ccT > 0) pc.ccT -= DT; if (pc.invalidT > 0) pc.invalidT -= DT;
    if (hero.blessing > 0) { hero.blessing -= DT; if (hero.blessing <= 0) { hero.blessing = 0; this.refresh(); this.toast("The Echo's blessing fades"); } }
    if (p.dead) return;
    pc.focus = Math.min(st.focusMax, pc.focus + st.regen * DT);
    if (pc.lastHit > 6) { pc.heat = Math.max(0, pc.heat - 3 * DT); if (p.hp < st.hpMax) p.hp = Math.min(st.hpMax, p.hp + st.hpMax * 0.012 * DT); }
    const fur = getStatus(p, 'furnace');
    if (fur) { pc.heat -= SKILL.furnace_heart.p.drain * DT; if (pc.heat <= 0) { pc.heat = 0; removeStatus(p, 'furnace'); } }
    integrateKnock(this, p);
    // Safety net: if anything ever leaves the Warden overlapping geometry, snap to the nearest free point.
    if (!circleFree(z, p.x, p.y, p.r - 0.02)) { const f = nearestFree(z, p.x, p.y, p.r); if (f) { p.x = f.x; p.y = f.y; } }
    if (hasStatus(p, 'stun')) { pc.action = null; pc.dash = null; p.anim = 'stun'; return; }
    if (pc.gate >= 0) {
      pc.gate += DT; p.anim = 'channel';
      if (pc.gate >= GATE_TIME) { pc.gate = -1; this.portal = { zone: z.id, x: p.x, y: p.y }; this.emit({ type: 'sfx', x: p.x, y: p.y, s: 'waypoint' }); this.enterZone('refuge', 'start'); }
      return;
    }
    if (pc.dash) {
      const d = pc.dash;
      const blocked = moveCircle(z, p, d.vx * DT, d.vy * DT, p.r);
      d.t -= DT; p.anim = 'dash';
      if (d.skill) {
        const def = SKILL[d.skill];
        for (const t of z.actors) {
          if (t.dead || t.team === 0 || t.kind === 'npc' || t.untargetable || d.hit.includes(t.id) || dist(p.x, p.y, t.x, t.y) > p.r + t.r + (def.p.width ?? 1.6) / 2) continue;
          d.hit.push(t.id);
          playerHit(this, t, def, d.coef, def.dtype);
          if (!t.heavy && !t.dead && t.kind === 'enemy') {
            addStatus(this, t, 'stun', def.p.stun, 0, p.id);
            const a = angTo(p.x, p.y, t.x, t.y); t.kx += Math.cos(a) * 5; t.ky += Math.sin(a) * 5;
          }
        }
      }
      if (d.t <= 0 || (blocked && !d.phase)) pc.dash = null;
      pc.moved += Math.hypot(d.vx, d.vy) * DT; pc.still = 0;
      return;
    }
    const act = pc.action;
    if (act) {
      act.t += DT * 1000;
      p.anim = act.def.tags.includes('melee') ? 'attack' : act.def.tags.includes('ranged') ? 'shoot' : 'cast';
      p.animT = act.t / 1000; p.animDur = act.total / 1000;
      // The Warden keeps turning toward a locked target during the anticipation, so circling enemies cannot dodge by orbiting.
      if (!act.fired && act.target) { const tg = this.actor(act.target); if (tg && !tg.dead) { act.ax = tg.x; act.ay = tg.y; p.facing = angTo(p.x, p.y, tg.x, tg.y); } }
      if (!act.fired && act.t >= act.wind) { act.fired = true; executeSkill(this, act.def, act.rank, act.ax, act.ay); }
      if (act.t >= act.total || (act.fired && act.t >= act.cancel * act.total && pc.intent)) pc.action = null;
      else { pc.still += DT; return; }
    }
    const i = pc.intent;
    const rooted = hasStatus(p, 'root');
    const chill = getStatus(p, 'chill'), haste = getStatus(p, 'haste');
    const speed = rooted ? 0 : st.move * (1 - (chill?.power ?? 0)) * (1 + (haste?.power ?? 0));
    const walk = (): boolean => {
      while (pc.path.length && dist(p.x, p.y, pc.path[0].x, pc.path[0].y) < 0.12) pc.path.shift();
      if (!pc.path.length || speed <= 0) return false;
      const g = pc.path[0], a = angTo(p.x, p.y, g.x, g.y), step = Math.min(speed * DT, dist(p.x, p.y, g.x, g.y));
      const bx = p.x, by = p.y;
      moveCircle(z, p, Math.cos(a) * step, Math.sin(a) * step, p.r);
      for (const o of z.actors) {
        if (o.dead || !o.heavy || o === p || o.untargetable || o.kind === 'standard') continue;
        const min = o.r + p.r * 0.9, dd = dist(p.x, p.y, o.x, o.y);
        if (dd < min && dd > 1e-3) moveCircle(z, p, ((p.x - o.x) / dd) * (min - dd), ((p.y - o.y) / dd) * (min - dd), p.r);
      }
      const mv = dist(bx, by, p.x, p.y);
      pc.moved += mv; pc.still = 0;
      p.facing = a; p.anim = 'walk';
      if (mv < step * 0.2) { pc.repath -= DT * 4; }
      return true;
    };
    if (!i) { p.anim = 'idle'; pc.still += DT; return; }
    switch (i.type) {
      case 'move':
        if (!walk()) { pc.intent = null; p.anim = 'idle'; }
        break;
      case 'basic':
        this.startAction(basicOf(hero.cls), i.x, i.y); pc.intent = null;
        break;
      case 'skill': {
        const def = hero.hotbar[i.slot] ? SKILL[hero.hotbar[i.slot]!] : null;
        pc.intent = null;
        if (!def || !hero.ranks[def.id]) break;
        if (!this.startAction(def, i.x, i.y) && pc.invalidT <= 0) { pc.invalidT = 0.5; this.emit({ type: 'sfx', x: p.x, y: p.y, s: 'invalid' }); }
        break;
      }
      case 'attack': {
        const t = this.actor(i.target);
        if (!t || t.dead || t.untargetable) { pc.intent = null; p.anim = 'idle'; break; }
        const def = basicOf(hero.cls), d = dist(p.x, p.y, t.x, t.y);
        if (d <= def.range + t.r && (def.range < 4 || los(z, p.x, p.y, t.x, t.y))) { this.startAction(def, t.x, t.y, t.id); pc.intent = null; break; }
        pc.repath -= DT;
        if (pc.repath <= 0 || !pc.path.length) { pc.repath = 0.3; pc.path = findPath(z, p.x, p.y, t.x, t.y, p.r) ?? []; }
        if (!walk() && !pc.path.length) { pc.intent = null; p.anim = 'idle'; }
        break;
      }
      case 'interact': {
        const it = z.inter.find((k) => k.id === i.id);
        if (!it || it.state < 0) { pc.intent = null; break; }
        if (dist(p.x, p.y, it.x, it.y) <= 2.4) { pc.intent = null; pc.path = []; p.anim = 'idle'; this.interact(it); }
        else if (!walk()) pc.intent = null;
        break;
      }
      case 'pickup': {
        const pk = z.pickups.find((k) => k.id === i.id);
        if (!pk) { pc.intent = null; break; }
        if (dist(p.x, p.y, pk.x, pk.y) <= 1.7) { pc.intent = null; pc.path = []; p.anim = 'idle'; this.takeItem(pk.id); }
        else if (!walk()) pc.intent = null;
        break;
      }
      default: pc.intent = null;
    }
  }
  takeItem(id: number): boolean {
    const z = this.zone, pk = z.pickups.find((k) => k.id === id), p = this.player;
    if (!pk || pk.kind !== 'item' || !pk.item) return false;
    if (!addItem(this.hero.inv, pk.item)) { this.toast('Inventory is full'); this.emit({ type: 'sfx', x: p.x, y: p.y, s: 'invalid' }); return false; }
    z.pickups = z.pickups.filter((k) => k !== pk);
    this.emit({ type: 'pickup', x: pk.x, y: pk.y, s: 'item', a: pk.item.rarity, text: itemName(pk.item) });
    this.dirty = true;
    return true;
  }
  // ─────────────── world interactions ───────────────
  interact(it: Interactable): void {
    const hero = this.hero, p = this.player, z = this.zone;
    const ui = (s: string) => this.emit({ type: 'ui', x: it.x, y: it.y, s });
    switch (it.type) {
      case 'waypoint':
        if (!it.state) {
          it.state = 1;
          if (!hero.waypoints.includes(it.key!)) hero.waypoints.push(it.key!);
          this.emit({ type: 'fx', x: it.x, y: it.y, s: 'waypoint', a: 3 }); this.emit({ type: 'sfx', x: it.x, y: it.y, s: 'waypoint' });
          this.toast(`${it.label} awakened`, 'quest');
          this.quest('waypoint:' + z.id);
          this.saveRequested = true;
        } else ui('waypoint');
        break;
      case 'exit':
        if (it.to === 'archive1' && hero.quest < 6) { this.toast('The crypt door is sealed. The Artificer may know how to open it.'); break; }
        this.emit({ type: 'sfx', x: p.x, y: p.y, s: 'door' });
        this.enterZone(it.to!, 'from:' + z.id);
        break;
      case 'npc':
        if (it.npc === 'elder') this.quest('talk:elder');
        if (it.npc === 'artificer') this.quest('talk:artificer');
        if (it.npc === 'healer') { p.hp = this.stats.hpMax; this.emit({ type: 'heal', x: p.x, y: p.y, a: 0 }); this.emit({ type: 'sfx', x: p.x, y: p.y, s: 'potion' }); }
        if (it.npc === 'hunter' && !hero.flags.hunter_done) {
          const left = z.actors.filter((a) => a.kind === 'enemy' && !a.dead && dist(a.x, a.y, it.x, it.y) < 20).length;
          if (!left) { hero.flags.hunter_done = true; if (!hero.flags.hunter_belt) { hero.flags.hunter_belt = true; hero.beltCap++; } this.giveXp(150); this.toast('Belt capacity permanently increased', 'quest'); this.emit({ type: 'sfx', x: p.x, y: p.y, s: 'quest' }); this.dirty = true; }
        }
        ui(it.npc!);
        break;
      case 'chest':
        if (it.state) break;
        it.state = 1; hero.flags[`chest:${z.id}:${it.id}`] = true;
        chestLoot(this, it.x, it.y);
        this.emit({ type: 'sfx', x: it.x, y: it.y, s: 'chest' }); this.emit({ type: 'fx', x: it.x, y: it.y, s: 'chest', a: 1 });
        break;
      case 'lever':
        if (it.state) break;
        it.state = 1; hero.flags.shortcut = true;
        for (const d of z.inter) if (d.type === 'door' && d.cells) { d.state = 1; for (const c of d.cells) z.cells[c] = FLOOR; }
        this.toast('A sealed stair grinds open near the floor entrance', 'quest');
        this.emit({ type: 'sfx', x: it.x, y: it.y, s: 'door' });
        break;
      case 'door': if (!it.state) this.toast('Sealed. A lever deeper on this floor opens it.'); break;
      case 'shrine':
        if (it.state) break;
        it.state = 1; p.hp = this.stats.hpMax; this.pc.focus = this.stats.focusMax; this.pc.evade = EVADE_MAX;
        addStatus(this, p, 'tonic', 45, 15, p.id);
        this.emit({ type: 'fx', x: it.x, y: it.y, s: 'waypoint', a: 2 }); this.emit({ type: 'sfx', x: it.x, y: it.y, s: 'shrine' });
        this.toast('The shrine restores you');
        break;
      case 'cage':
        if (it.state) break;
        if (z.actors.some((a) => a.def === 'tollkeeper' && !a.dead)) { this.toast('The Toll-Keeper holds the key.'); break; }
        it.state = 1; hero.flags.artificer = true;
        this.emit({ type: 'sfx', x: it.x, y: it.y, s: 'door' });
        this.toast('Artificer Ilse: "My thanks, Warden. Find me at the Refuge."', 'quest');
        this.quest('cage');
        break;
      case 'stash': ui('stash'); break;
      case 'portal':
        if (it.key === 'hunt') ui('hunt');
        else if (it.key === 'return' && this.portal) { const pt = this.portal; this.portal = null; this.emit({ type: 'sfx', x: p.x, y: p.y, s: 'waypoint' }); this.enterZone(pt.zone, 'start', pt); }
        else if (it.key === 'town') { this.emit({ type: 'sfx', x: p.x, y: p.y, s: 'waypoint' }); this.enterZone('refuge', 'waypoint'); }
        break;
      default: break;
    }
  }
  // ─────────────── combat hooks ───────────────
  onProjectileHit(pr: Projectile, t: Actor): void { projectileHit(this, pr, t); }
  onStatusEnd(st: Status): void {
    if (st.id === 'guard' && this.stats.cap_unbroken_oath && !this.player.dead) {
      spawnArea(this, { shape: 'circle', x: this.player.x, y: this.player.y, r: 4, src: { id: this.player.id, name: this.hero.name, team: 0, coef: 1.5, skill: 'cinder_ring' }, dtype: 'ember', fx: 'explosion' });
    }
  }
  onKill(a: Actor, _src: Src): void {
    const hero = this.hero, def = ENEMY[a.def];
    if (a.def === 'urn') { rollDrops(this, a); return; }
    if (a.kind === 'conduit') { this.emit({ type: 'fx', x: a.x, y: a.y, s: 'break', a: 2.5 }); return; }
    if (a.kind !== 'enemy') return;
    hero.stats.kills++;
    if (a.elite) hero.stats.elites++;
    if (this.stats.hpOnKill) healPlayer(this, this.stats.hpOnKill, true);
    if (!a.noXp) {
      const gap = hero.level - a.lvl;
      this.giveXp(def.xp * (1 + 0.16 * (a.lvl - 1)) * (a.elite ? 4 : 1) * (gap > 5 ? 0.4 : gap > 3 ? 0.7 : 1));
      rollDrops(this, a);
    }
    if (a.boss) {
      for (const ar of this.zone.areas) if (ar.src.id === a.id) ar.done = true;
      for (const o of this.zone.actors) if (!o.dead && o.kind !== 'player' && (o.owner === a.id || o.def === 'conduit' || (o.def === 'mite' && o.noXp))) { o.dead = true; o.deadT = 0; this.emit({ type: 'death', x: o.x, y: o.y, id: o.id, s: o.def, a: o.r }); }
      const hunt = this.zone.id.startsWith('hunt_');
      if (hunt) {
        const t = this.time - this.huntStart, key = `${a.def}_${hero.difficulty}`;
        const best = hero.stats.bestHunt[key];
        if (!best || t < best) hero.stats.bestHunt[key] = t;
        this.summary = { time: t, kills: hero.stats.kills, deaths: hero.stats.deaths, level: hero.level, difficulty: hero.difficulty, hunt: a.name };
        this.zone.inter.push({ id: this.id(), x: a.x, y: a.y + 3, type: 'portal', label: 'Portal to Ember Refuge', state: 0, key: 'town' });
        this.emit({ type: 'victory', x: a.x, y: a.y, s: 'hunt', text: a.name });
      } else if (a.def === 'tollkeeper') { hero.flags.toll_dead = true; this.quest('kill:tollkeeper'); this.emit({ type: 'victory', x: a.x, y: a.y, s: 'boss', text: a.name }); }
      else {
        hero.flags.engine_dead = true; hero.flags.act_done = true;
        hero.maxDifficulty = Math.max(hero.maxDifficulty, Math.min(1, hero.difficulty + 1));
        this.quest('kill:engine');
        this.summary = { time: hero.stats.runTime, kills: hero.stats.kills, deaths: hero.stats.deaths, level: hero.level, difficulty: hero.difficulty };
        this.zone.inter.push({ id: this.id(), x: a.x, y: a.y + 4, type: 'portal', label: 'Portal to Ember Refuge', state: 0, key: 'town' });
        this.emit({ type: 'victory', x: a.x, y: a.y, s: 'act', text: a.name });
      }
      this.saveRequested = true;
    }
    this.dirty = true;
  }
  /** Death: Echo holds 10% of carried gold (never compounding), durability -5%, respawn at the last waypoint. */
  playerDeath(src: Src, dtype: DamageType): void {
    const hero = this.hero, p = this.player, z = this.zone;
    p.dead = true; p.anim = 'dead'; p.statuses = [];
    this.pc.action = null; this.pc.intent = null; this.pc.dash = null; this.pc.path = []; this.pc.gate = -1;
    hero.stats.deaths++;
    const cause = `${src.name} · ${dtype}`;
    hero.stats.lastDeath = cause;
    this.deathLog.push({ time: this.time, zone: z.id, cause, level: hero.level });
    {
      if (hero.echo) {
        const old = this.zones.get(hero.echo.zone);
        if (old) old.pickups = old.pickups.filter((k) => k.kind !== 'echo');
        hero.echo = { zone: z.id, x: p.x, y: p.y, gold: hero.echo.gold };
      } else {
        const lost = Math.floor(hero.gold * 0.1);
        hero.gold -= lost;
        hero.echo = { zone: z.id, x: p.x, y: p.y, gold: lost };
      }
    }
    hero.blessing = 0;
    for (const it of Object.values(hero.equip)) if (it) it.dur = Math.max(0, it.dur - 5);
    this.refresh();
    this.emit({ type: 'playerDeath', x: p.x, y: p.y, text: cause, s: dtype });
    this.saveRequested = true;
  }
  respawnZone(): string {
    const id = this.zone.id, wp = this.hero.waypoints;
    if (wp.includes(id)) return id;
    if ((id === 'archive1' || id === 'archive2') && wp.includes('march')) return 'march';
    return 'refuge';
  }
  respawn(): void {
    const p = this.player, z = this.zone;
    if (!p.dead) return;
    for (const a of z.actors) {
      if (a.dead || a.kind !== 'enemy') continue;
      if (a.boss) resetBoss(this, a);
      else if (a.ai) { a.ai.state = 'investigate'; a.ai.lastX = a.ai.homeX; a.ai.lastY = a.ai.homeY; a.ai.t = 0; a.hp = a.maxHp; }
    }
    z.projectiles = []; z.areas = z.areas.filter((a) => a.src.team === 0 && false);
    const target = this.respawnZone();
    p.dead = false; p.hp = this.stats.hpMax; p.anim = 'idle'; p.statuses = [];
    this.pc = { ...newPc(), cds: this.pc.cds, charges: this.pc.charges, focus: this.stats.focusMax };
    this.enterZone(target, 'waypoint');
  }
  // ─────────────── fixed tick ───────────────
  tick(): void {
    const z = this.zone, p = this.player, hero = this.hero;
    this.time += DT; z.time += DT; hero.stats.playTime += DT;
    if (hero.quest < QUEST_DONE) hero.stats.runTime += DT;
    const tickN = Math.round(z.time / DT);
    for (const a of z.actors) { a.px = a.x; a.py = a.y; }
    this.playerTick();
    const std = z.actors.find((a) => a.kind === 'standard' && !a.dead);
    if (std) {
      std.life! -= DT;
      const def = SKILL.ashen_standard;
      if (dist(p.x, p.y, std.x, std.y) < def.p.r) addStatus(this, p, 'standard', 0.3, std.dmg, std.id);
      if (tickN % Math.round(def.p.taunt / DT) === 0) {
        for (const e of z.actors) if (e.kind === 'enemy' && !e.dead && !e.elite && !e.boss && dist(e.x, e.y, std.x, std.y) < def.p.r) addStatus(this, e, 'taunt', 2, 0, std.id);
        this.emit({ type: 'fx', x: std.x, y: std.y, s: 'taunt', a: def.p.r });
      }
      if (std.life! <= 0) { std.dead = true; std.deadT = 99; }
    }
    if (!z.safe) {
      assignSlots(this);
      for (const a of [...z.actors]) {
        if (a.dead) continue;
        if (a.kind === 'enemy') aiTick(this, a);
        else if (a.kind === 'ward' && tickN % 6 === 0) for (const e of z.actors) if (e.kind === 'enemy' && !e.dead && dist(e.x, e.y, a.x, a.y) < 7) addStatus(this, e, 'ward', 0.35, 0.4, a.id);
      }
      separate(this);
    }
    const dot = tickN % 15 === 0;
    for (const a of [...z.actors]) {
      if (a.dead) { a.deadT += DT; continue; }
      tickStatuses(this, a, dot);
      if (a.kind !== 'player') integrateKnock(this, a);
      if (a.kind === 'dummy' && a.hp < a.maxHp * 0.5) a.hp = a.maxHp;
    }
    updateProjectiles(this);
    updateAreas(this);
    // Pickups: gold, dust, globes and (below belt cap) potions are auto-collected.
    if (!p.dead) {
      for (const k of z.pickups) {
        k.t += DT;
        if (k.kind === 'item' || k.t < 0.35) continue;
        const d = dist(p.x, p.y, k.x, k.y);
        if (k.kind === 'potion' && hero.belt[k.potion!] >= hero.beltCap) continue;
        if (k.kind === 'globe' && p.hp >= this.stats.hpMax && d > 1) continue;
        if (d < 4.2 && k.kind !== 'echo') { const a = angTo(k.x, k.y, p.x, p.y), sp = Math.min(d, 13 * DT); k.x += Math.cos(a) * sp; k.y += Math.sin(a) * sp; }
        if (d > 1.1) continue;
        k.amount = k.amount || 0; k.t = -1;
        if (k.kind === 'gold') hero.gold += k.amount;
        else if (k.kind === 'dust') hero.dust += k.amount;
        else if (k.kind === 'potion') hero.belt[k.potion!]++;
        else if (k.kind === 'globe') healPlayer(this, this.stats.hpMax * k.amount);
        else if (k.kind === 'echo') { hero.gold += k.amount; hero.echo = null; hero.blessing = 300; this.refresh(); this.toast(`Echo reclaimed: +${k.amount} gold and an 8% Health blessing`, 'quest'); }
        this.emit({ type: 'pickup', x: k.x, y: k.y, s: k.kind, a: k.amount, text: k.kind === 'potion' ? POTIONS[k.potion!].name : undefined });
        this.dirty = true;
      }
      if (z.pickups.some((k) => k.t < 0)) z.pickups = z.pickups.filter((k) => k.t >= 0);
    }
    for (const it of z.inter) {
      if (it.type !== 'trap' || dist(p.x, p.y, it.x, it.y) > 22) continue;
      it.t = (it.t ?? 0) + DT;
      if (it.t >= 3.4) {
        it.t = 0;
        spawnArea(this, { shape: 'circle', x: it.x, y: it.y, r: 1.25, delay: 0.9, src: { id: 0, name: 'Floor Trap', team: 2, dmg: scaleDmg(10, z.level) }, dtype: 'physical', hitAll: true, fx: 'spike', tag: 'spike' });
      }
    }
    if (tickN % 6 === 0) this.reveal();
    if (z.actors.some((a) => a.dead && a.deadT > 2.5 && a.kind !== 'player')) z.actors = z.actors.filter((a) => !(a.dead && a.deadT > 2.5 && a.kind !== 'player'));
    while (this.dps.length && this.dps[0][0] < this.time - 5) this.dps.shift();
    this.saveT += DT;
    if (this.saveT > 40) { this.saveT = 0; this.saveRequested = true; }
  }
  /** Rolling 5-second damage per second, used by the training dummy readout. */
  get dpsNow(): number { return this.dps.reduce((n, d) => n + d[1], 0) / 5; }
  inCombat(): boolean { return this.zone.actors.some((a) => a.kind === 'enemy' && !a.dead && a.ai && a.ai.state !== 'dormant' && a.ai.state !== 'investigate'); }
}
