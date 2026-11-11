import { angleDiff, angleTo, dist, inCone, inLine, rotateToward } from "../core/math";
import type { EnemyAttackDef } from "../data/types";
import { applyStatus, damagePlayer, dealToEnemy, hasStatus, slowFactor } from "./combat";
import type { Game } from "./game";
import { findPath, lineClear } from "./nav";
import type { Enemy } from "./types";

export const MAX_MELEE_SLOTS = 6;

const MELEE_BEHAVIORS = new Set(["swarm", "bruiser", "hooker", "shield", "flock", "bomber"]);
const RANGED_BEHAVIORS = new Set(["ranged", "support", "kiter"]);

export function heavyLimit(g: Game) {
  return g.ch.difficulty === "veteran" ? 3 : 2;
}

/** Assign attack slots: a limited number of melee enemies engage at once; bruisers take priority and fodder yields. */
export function assignSlots(g: Game) {
  const p = g.player;
  const melee = g.enemies.filter((e) => e.alive && e.aware && !e.isBoss && MELEE_BEHAVIORS.has(e.def.behavior) && dist(e.x, e.y, p.x, p.y) < 12);
  const prio = (e: Enemy) => (e.def.role === "bruiser" ? 0 : e.def.role === "controller" ? 1 : e.def.role === "skirmisher" ? 2 : 3) + dist(e.x, e.y, p.x, p.y) * 0.05 - (e.slotted ? 0.4 : 0);
  melee.sort((a, b) => prio(a) - prio(b));
  for (let i = 0; i < melee.length; i++) melee[i].slotted = i < MAX_MELEE_SLOTS;
  for (const e of g.enemies) if (!MELEE_BEHAVIORS.has(e.def.behavior)) e.slotted = true;
}

export function updateEnemy(g: Game, e: Enemy, dt: number) {
  e.px = e.x; e.py = e.y;
  if (!e.alive) return;
  if (e.hitstop > 0) { e.hitstop -= dt; return; }
  for (const k in e.cds) { e.cds[k] -= dt; if (e.cds[k] <= 0) delete e.cds[k]; }
  if (e.def.behavior === "dummy") { updateDummy(g, e, dt); return; }
  if (e.pull) {
    e.pull.t += dt;
    const k = Math.min(1, e.pull.t / e.pull.dur);
    const nx = e.pull.fx + (e.pull.tx - e.pull.fx) * k, ny = e.pull.fy + (e.pull.ty - e.pull.fy) * k;
    g.tryMove(e, nx - e.x, ny - e.y);
    if (k >= 1) e.pull = undefined;
    return;
  }
  if (hasStatus(e, "stun")) { e.anim = "stun"; if (e.ai === "telegraph") { g.clearTelegraphs(e.id); e.ai = "recover"; e.aiT = 0.3; releaseHeavy(e); } return; }
  if (e.boss) return; // boss director handles bosses
  updateEliteMods(g, e, dt);
  const p = g.player;
  const d = dist(e.x, e.y, p.x, p.y);
  // perception (throttled)
  e.perceiveT -= dt;
  if (e.perceiveT <= 0) {
    e.perceiveT = 0.25;
    const camo = hasStatus(p, "camo");
    e.sees = p.alive && !camo && d < (e.aware ? e.def.aggro + 8 : e.def.aggro) && lineClear(g.nav, e.x, e.y, p.x, p.y, 0);
    if (e.sees) { e.lastKnown = { x: p.x, y: p.y }; e.lostT = 0; if (!e.aware) { e.aware = true; e.ai = "approach"; g.alertPack(e); g.emit({ t: "sfx", id: "sfx_alert", x: e.x, y: e.y, vol: 0.4 }); } }
  }
  if (!p.alive && e.ai !== "dormant") { e.ai = "investigate"; e.aware = false; }
  const taunt = e.statuses.taunted;

  switch (e.ai) {
    case "dormant":
      e.anim = "idle";
      return;
    case "investigate": {
      if (e.sees) { e.ai = "approach"; break; }
      const t = e.lastKnown ?? e.home;
      if (dist(e.x, e.y, t.x, t.y) < 1) {
        e.lostT += dt;
        e.anim = "idle";
        if (e.lostT > 3) { e.aware = false; e.ai = "dormant"; e.lastKnown = null; navTo(g, e, e.home.x, e.home.y, dt, 0.6); }
      } else navTo(g, e, t.x, t.y, dt, 0.8);
      return;
    }
    case "telegraph": {
      e.aiT -= dt;
      const a = e.attack!;
      const frac = 1 - e.aiT / (a.windup / 1000);
      // light tracking during early anticipation, then lock
      if (frac < 0.55 && a.kind !== "explode") {
        const want = angleTo(e.x, e.y, p.x, p.y);
        e.atkAngle = rotateToward(e.atkAngle, want, (e.def.behavior === "shield" ? 0.8 : 2.2) * dt);
        e.facing = e.atkAngle;
        if (a.kind === "zone") { e.atkX = p.x; e.atkY = p.y; }
        g.updateTelegraph(e.telegraphId, e.x, e.y, e.atkAngle, a.kind === "zone" ? e.atkX : undefined, a.kind === "zone" ? e.atkY : undefined);
      }
      e.anim = "windup";
      if (e.aiT <= 0) executeAttack(g, e, a);
      return;
    }
    case "recover":
      e.aiT -= dt;
      e.anim = "recover";
      if (e.lunge) updateLunge(g, e, dt);
      if (e.aiT <= 0) { releaseHeavy(e); e.ai = e.fleeT > 0 ? "flee" : "approach"; }
      return;
    case "flee": {
      e.fleeT -= dt;
      const an = angleTo(p.x, p.y, e.x, e.y) + e.strafe * 0.6;
      navTo(g, e, e.x + Math.cos(an) * 3, e.y + Math.sin(an) * 3, dt, 1.1);
      if (e.fleeT <= 0) e.ai = "approach";
      return;
    }
    case "approach":
    case "reposition": {
      if (!e.sees) {
        e.lostT += dt;
        if (e.lostT > 1.2) { e.ai = "investigate"; break; }
      }
      // standard taunt: move to the standard and hold
      if (taunt) { navTo(g, e, taunt.mag, taunt.tick, dt, 1); e.anim = "move"; return; }
      // choose attack
      const atk = chooseAttack(g, e, d);
      if (atk) { beginTelegraph(g, e, atk); return; }
      // desired position by behavior
      const b = e.def.behavior;
      const angFromP = angleTo(p.x, p.y, e.x, e.y);
      if (RANGED_BEHAVIORS.has(b)) {
        const want = b === "support" ? 8 : b === "kiter" ? 7 : 9;
        if (d < 4.5) {
          if (b === "kiter" || b === "ranged") { e.fleeT = 0.8; e.ai = "flee"; e.strafe = e.id % 2 ? 1 : -1; return; }
        }
        if (d > want + 1.5 || !e.sees) navTo(g, e, p.x, p.y, dt, 1);
        else if (d < want - 1.5) { const an = angFromP; navTo(g, e, p.x + Math.cos(an) * want, p.y + Math.sin(an) * want, dt, 0.8); }
        else {
          // strafe to avoid stacking with other ranged
          const an = angFromP + e.strafe * 0.35;
          navTo(g, e, p.x + Math.cos(an) * want, p.y + Math.sin(an) * want, dt, 0.5);
          if (g.tick % 60 === e.id % 60) e.strafe = -e.strafe;
        }
      } else if (b === "flanker") {
        const behind = p.facing + Math.PI;
        const side = behind + e.strafe * 0.9;
        navTo(g, e, p.x + Math.cos(side) * 5, p.y + Math.sin(side) * 5, dt, 1.1);
      } else {
        const ring = p.radius + e.radius + 0.35;
        if (e.slotted) {
          if (d > ring + 0.2) navTo(g, e, p.x + Math.cos(angFromP) * ring, p.y + Math.sin(angFromP) * ring, dt, 1);
          else { e.anim = "idle"; e.facing = rotateToward(e.facing, angleTo(e.x, e.y, p.x, p.y), 6 * dt); }
        } else {
          // waiting ring: circle at a distance and yield the slot
          const wait = ring + 2.4;
          const an = angFromP + 0.4 * dt * e.strafe;
          if (Math.abs(d - wait) > 0.4) navTo(g, e, p.x + Math.cos(an) * wait, p.y + Math.sin(an) * wait, dt, 0.7);
          else e.anim = "idle";
        }
      }
      return;
    }
  }
}

function updateDummy(g: Game, e: Enemy, dt: number) {
  e.anim = "idle";
  e.dummyRegenT += dt;
  if (e.dmgTaken > 0) { e.dummyRegenT = 0; e.dmgTaken = 0; }
  if (e.dummyRegenT > 3) e.hp = e.maxHp;
}

function chooseAttack(g: Game, e: Enemy, d: number): EnemyAttackDef | null {
  const p = g.player;
  if (!p.alive || !e.sees || hasStatus(e, "taunted")) return null;
  if (!e.slotted && MELEE_BEHAVIORS.has(e.def.behavior)) return null;
  for (const a of e.def.attacks) {
    if (e.cds[a.id]) continue;
    const reach = a.range + p.radius + (a.kind === "melee" || a.kind === "slam" ? e.radius * 0.5 : 0);
    if (a.kind === "ward") {
      const ally = wardTarget(g, e);
      if (!ally) continue;
      return a;
    }
    if (d > reach) continue;
    if (a.kind === "lunge" && d < 2.2) continue;
    if (a.kind === "hook" && d < 3.5) continue;
    if (a.heavy) {
      if (g.heavyCount() >= heavyLimit(g)) continue;
    }
    if ((a.kind === "projectile" || a.kind === "hook" || a.kind === "zone") && !lineClear(g.nav, e.x, e.y, p.x, p.y, 0.2)) continue;
    return a;
  }
  return null;
}

function wardTarget(g: Game, e: Enemy): Enemy | null {
  let best: Enemy | null = null, bs = 1.01;
  for (const o of g.enemies) {
    if (!o.alive || o.statuses.ward || o.def.behavior === "dummy") continue;
    if (dist(o.x, o.y, e.x, e.y) > 9) continue;
    const frac = o.hp / o.maxHp;
    const score = frac - (o === e ? -0.2 : 0) - (o.isElite ? 0.2 : 0);
    if (score < bs) { bs = score; best = o; }
  }
  return best && g.enemies.some((o) => o.alive && o.aware && o !== e) ? best : null;
}

function beginTelegraph(g: Game, e: Enemy, a: EnemyAttackDef) {
  const p = g.player;
  e.ai = "telegraph";
  e.attack = a;
  const rally = hasStatus(e, "rallied") ? 0.8 : 1;
  e.aiT = (a.windup / 1000) * rally;
  e.atkAngle = angleTo(e.x, e.y, p.x, p.y);
  e.facing = e.atkAngle;
  e.atkX = p.x; e.atkY = p.y;
  if (a.heavy) e.heavy = true;
  if (a.lead && a.projectileSpeed) {
    const t = dist(e.x, e.y, p.x, p.y) / a.projectileSpeed;
    const vx = (p.x - p.px) / (1 / 30), vy = (p.y - p.py) / (1 / 30);
    e.atkX = p.x + vx * t * a.lead; e.atkY = p.y + vy * t * a.lead;
    e.atkAngle = angleTo(e.x, e.y, e.atkX, e.atkY);
  }
  const s = a.shape;
  const type = a.type;
  switch (a.kind) {
    case "melee":
    case "slam":
    case "lunge":
    case "hook":
    case "projectile":
      if (s.kind === "cone") e.telegraphId = g.addTelegraph({ shape: "cone", x: e.x, y: e.y, angle: e.atkAngle, r: s.radius!, r2: 0, arc: ((s.angle ?? 90) * Math.PI) / 180, len: 0, width: 0, dur: e.aiT, type, owner: e.id, follow: true });
      else if (s.kind === "circle") e.telegraphId = g.addTelegraph({ shape: "circle", x: e.x, y: e.y, angle: 0, r: s.radius!, r2: 0, arc: 0, len: 0, width: 0, dur: e.aiT, type, owner: e.id, follow: true });
      else e.telegraphId = g.addTelegraph({ shape: "line", x: e.x, y: e.y, angle: e.atkAngle, r: 0, r2: 0, arc: 0, len: s.length!, width: s.width!, dur: e.aiT, type, owner: e.id, follow: true });
      break;
    case "explode":
      e.telegraphId = g.addTelegraph({ shape: "circle", x: e.x, y: e.y, angle: 0, r: s.radius!, r2: 0, arc: 0, len: 0, width: 0, dur: e.aiT, type, owner: e.id, follow: true });
      break;
    case "zone":
      e.telegraphId = g.addTelegraph({ shape: "circle", x: e.atkX, y: e.atkY, angle: 0, r: s.radius!, r2: 0, arc: 0, len: 0, width: 0, dur: e.aiT, type, owner: e.id });
      break;
    case "ward":
      e.telegraphId = g.addTelegraph({ shape: "circle", x: e.x, y: e.y, angle: 0, r: 1.2, r2: 0, arc: 0, len: 0, width: 0, dur: e.aiT, type: "blight", owner: e.id, follow: true });
      break;
  }
  g.emit({ t: "sfx", id: a.heavy ? "sfx_tele_heavy" : a.kind === "projectile" ? "sfx_tele_ranged" : "sfx_tele", x: e.x, y: e.y, vol: a.heavy ? 0.9 : 0.5 });
}

function executeAttack(g: Game, e: Enemy, a: EnemyAttackDef) {
  const p = g.player;
  g.clearTelegraphs(e.id);
  e.cds[a.id] = a.cooldown * (hasStatus(e, "rallied") ? 0.75 : 1);
  e.ai = "recover";
  e.aiT = a.recovery / 1000;
  e.anim = "attack"; e.animT = 0;
  const dmg = e.dmg * a.dmg;
  const label = `${e.name} — ${a.id[0].toUpperCase()}${a.id.slice(1)}`;
  const s = a.shape;
  switch (a.kind) {
    case "melee":
    case "slam": {
      let hit = false;
      if (s.kind === "cone") hit = inCone(e.x, e.y, e.atkAngle, ((s.angle ?? 90) * Math.PI) / 360, s.radius!, p.x, p.y, p.radius);
      else if (s.kind === "circle") hit = dist(e.x, e.y, p.x, p.y) <= s.radius! + p.radius;
      else hit = inLine(e.x, e.y, e.atkAngle, s.length!, s.width! / 2, p.x, p.y, p.radius);
      if (hit) damagePlayer(g, dmg, a.type, e, { melee: true, label, ailment: a.ailment, heavy: a.heavy });
      g.emit({ t: "vfx", kind: a.kind === "slam" ? "slam" : "enemySwing", x: e.x + Math.cos(e.atkAngle) * (s.length ?? s.radius ?? 1) * 0.6, y: e.y + Math.sin(e.atkAngle) * (s.length ?? s.radius ?? 1) * 0.6, angle: e.atkAngle, r: s.radius ?? s.width, type: a.type });
      if (a.kind === "slam") { g.emit({ t: "shake", amp: 0.25, dur: 0.3, src: "enemy" }); g.emit({ t: "sfx", id: "sfx_slam", x: e.x, y: e.y }); }
      else g.emit({ t: "sfx", id: "sfx_enemy_swing", x: e.x, y: e.y, vol: 0.5 });
      break;
    }
    case "projectile": {
      const sp = a.projectileSpeed ?? 12;
      g.addProjectile({ team: 1, x: e.x + Math.cos(e.atkAngle) * 0.6, y: e.y + Math.sin(e.atkAngle) * 0.6, vx: Math.cos(e.atkAngle) * sp, vy: Math.sin(e.atkAngle) * sp, radius: 0.3, life: (a.range + 3) / sp, kind: a.type === "physical" ? "bolt" : "orb", pierce: 0, source: e.id, coeff: 0, dmgType: a.type, dmg });
      g.emit({ t: "sfx", id: "sfx_enemy_shot", x: e.x, y: e.y, vol: 0.5 });
      break;
    }
    case "hook": {
      const sp = 20;
      g.addProjectile({ team: 1, x: e.x, y: e.y, vx: Math.cos(e.atkAngle) * sp, vy: Math.sin(e.atkAngle) * sp, radius: 0.45, life: s.length! / sp, kind: "hook", pierce: 0, source: e.id, coeff: 0, dmgType: "physical", dmg });
      g.emit({ t: "sfx", id: "sfx_chain", x: e.x, y: e.y });
      break;
    }
    case "explode": {
      const r = s.radius!;
      if (dist(e.x, e.y, p.x, p.y) <= r + p.radius) damagePlayer(g, dmg, a.type, e, { label: `${e.name} — Burst`, heavy: true });
      for (const o of g.enemies) if (o !== e && o.alive && dist(o.x, o.y, e.x, e.y) <= r + o.radius) dealToEnemy(g, o, { ember: dmg * 1.5 }, { source: "mite", fromX: e.x, fromY: e.y });
      g.emit({ t: "vfx", kind: "explosion", x: e.x, y: e.y, r, type: "ember" });
      g.emit({ t: "sfx", id: "sfx_explode", x: e.x, y: e.y });
      g.emit({ t: "shake", amp: 0.2, dur: 0.25, src: "enemy" });
      releaseHeavy(e);
      e.hp = 0;
      g.killEnemy(e, true);
      break;
    }
    case "zone": {
      g.addZone({ team: 1, kind: "blight_cloud", x: e.atkX, y: e.atkY, r: s.radius!, dur: 5, dps: dmg, dmgType: a.type, source: e.id, data: {} });
      g.emit({ t: "sfx", id: "sfx_censer", x: e.x, y: e.y, vol: 0.5 });
      break;
    }
    case "lunge": {
      const len = s.length!;
      const ex = e.x + Math.cos(e.atkAngle) * len, ey = e.y + Math.sin(e.atkAngle) * len;
      e.lunge = { t: 0, dur: 0.28, fx: e.x, fy: e.y, tx: ex, ty: ey, hit: false };
      e.fleeT = 1.4;
      e.strafe = e.strafe || 1;
      g.emit({ t: "sfx", id: "sfx_lunge", x: e.x, y: e.y });
      break;
    }
    case "ward": {
      const ally = wardTarget(g, e);
      if (ally) { applyStatus(ally, "ward", 6); g.emit({ t: "vfx", kind: "ward", x: ally.x, y: ally.y, type: "blight" }); g.emit({ t: "sfx", id: "sfx_ward", x: ally.x, y: ally.y, vol: 0.6 }); }
      break;
    }
  }
  if (a.kind !== "lunge") e.attack = null;
}

function updateLunge(g: Game, e: Enemy, dt: number) {
  const l = e.lunge!;
  l.t += dt;
  const k = Math.min(1, l.t / l.dur);
  const nx = l.fx + (l.tx - l.fx) * k, ny = l.fy + (l.ty - l.fy) * k;
  g.tryMove(e, nx - e.x, ny - e.y);
  const p = g.player;
  if (!l.hit && dist(e.x, e.y, p.x, p.y) < e.radius + p.radius + 0.3) {
    l.hit = true;
    damagePlayer(g, e.dmg * (e.attack?.dmg ?? 1.5), "blight", e, { melee: true, label: `${e.name} — Lunge`, ailment: e.attack?.ailment });
  }
  if (k >= 1) { e.lunge = undefined; e.attack = null; }
}

export function releaseHeavy(e: Enemy) {
  e.heavy = false;
}

/** Steering: direct when the straight line is clear, otherwise a periodically re-planned grid path. */
export function navTo(g: Game, e: Enemy, tx: number, ty: number, dt: number, speedMul: number) {
  const sp = e.speed * speedMul * slowFactor(e) * (hasStatus(e, "root") ? 0 : 1);
  if (sp <= 0) { e.anim = "idle"; return; }
  let gx = tx, gy = ty;
  const d = dist(e.x, e.y, tx, ty);
  if (d < 0.15) { e.anim = "idle"; return; }
  if (!lineClear(g.nav, e.x, e.y, tx, ty, e.radius * 0.8)) {
    e.pathT -= dt;
    if (!e.path || e.pathT <= 0) { e.path = findPath(g.nav, e.x, e.y, tx, ty, 3000, e.radius * 0.8); e.pathT = 0.6 + (e.id % 5) * 0.05; }
    if (e.path && e.path.length) {
      if (dist(e.x, e.y, e.path[0].x, e.path[0].y) < 0.4) e.path.shift();
      if (e.path.length) { gx = e.path[0].x; gy = e.path[0].y; }
    }
  } else e.path = null;
  const dd = dist(e.x, e.y, gx, gy);
  if (dd < 0.01) return;
  const step = Math.min(dd, sp * dt);
  const want = angleTo(e.x, e.y, gx, gy);
  const turn = e.def.behavior === "shield" ? 1.6 : 9;
  e.facing = rotateToward(e.facing, want, turn * dt);
  // shield wardens move only roughly where they face (punishable turn time)
  const moveAng = e.def.behavior === "shield" && Math.abs(angleDiff(e.facing, want)) > 0.8 ? e.facing : want;
  g.tryMove(e, Math.cos(moveAng) * step, Math.sin(moveAng) * step);
  e.anim = "move";
}

function updateEliteMods(g: Game, e: Enemy, dt: number) {
  if (!e.elite.length) return;
  for (const m of e.elite) {
    e.modT[m] = (e.modT[m] ?? 0) - dt;
    if (e.modT[m] > 0) continue;
    switch (m) {
      case "ember_wake":
        e.modT[m] = 0.45;
        if (e.aware && Math.hypot(e.x - e.px, e.y - e.py) > 0.01) g.addZone({ team: 1, kind: "fire", x: e.x, y: e.y, r: 0.9, dur: 3, dps: e.dmg * 0.5, dmgType: "ember", source: e.id, data: {} });
        break;
      case "frost_pulse":
        if (!e.aware) { e.modT[m] = 1; break; }
        e.modT[m] = 6;
        g.addTelegraph({ shape: "circle", x: e.x, y: e.y, angle: 0, r: 4, r2: 0, arc: 0, len: 0, width: 0, dur: 1.1, type: "frost", owner: -e.id, follow: false });
        g.addZone({ team: 1, kind: "pulse", x: e.x, y: e.y, r: 4, dur: 1.1, arm: 1.1, dps: 0, dmgType: "frost", source: e.id, data: { dmg: e.dmg * 1.4, chill: true, label: `${e.name} — Frost Pulse` } });
        g.emit({ t: "sfx", id: "sfx_tele_frost", x: e.x, y: e.y, vol: 0.8 });
        break;
      case "rallying":
        e.modT[m] = 0.5;
        for (const o of g.enemies) if (o.alive && o !== e && dist(o.x, o.y, e.x, e.y) < 8) applyStatus(o, "rallied", 0.8);
        break;
      case "mirror_shell":
        if (!e.aware) { e.modT[m] = 1; break; }
        e.modT[m] = 8;
        applyStatus(e, "shell", 2);
        g.emit({ t: "sfx", id: "sfx_shell", x: e.x, y: e.y, vol: 0.6 });
        break;
      case "vampiric_bond":
        e.modT[m] = 99;
        break;
    }
  }
}
