import { angleTo, clamp, dist, inCone, inLine, pointSegDist } from "../core/math";
import { SKILL_BY_ID, basicSkill, skillCoeff, skillCooldown } from "../data/skills";
import type { SkillDef } from "../data/types";
import type { PotionKind } from "../data/items";
import { applyStatus, hasStatus, healPlayer, interruptEnemy, LESSER, playerHit, removeStatus, slowFactor } from "./combat";
import type { Game } from "./game";
import { circleFree, findPath, lineClear, nearestOpen } from "./nav";
import { DT, type Enemy, type PlayerAction } from "./types";

export const EVADE_DIST = 4.5, EVADE_TIME = 0.32;
export const INTERACT_RANGE = 2.2;

export interface Intents {
  cursorX: number; cursorY: number;
  primaryDown: boolean; primaryPressed: boolean;
  secondaryDown: boolean; secondaryPressed: boolean;
  standStill: boolean;
  skillPressed: number | null; // 1..4 = Q W E R
  evade: boolean;
  potion: number | null;
  interact: boolean;
  townGate: boolean;
  hoverEnemy: number | null;
  hoverInteract: number | null;
}

export function emptyIntents(): Intents {
  return { cursorX: 0, cursorY: 0, primaryDown: false, primaryPressed: false, secondaryDown: false, secondaryPressed: false, standStill: false, skillPressed: null, evade: false, potion: null, interact: false, townGate: false, hoverEnemy: null, hoverInteract: null };
}

const actionLocked = (a: PlayerAction | null) => !!a && (a.kind === "evade" || a.kind === "dash" || a.kind === "leap" || (a.kind === "skill" && a.t < a.cancelAt));

export function updatePlayer(g: Game, inp: Intents, dt: number) {
  const p = g.player;
  if (!p.alive) return;
  const st = g.stats;
  p.px = p.x; p.py = p.y;
  // resources & timers
  p.focus = Math.min(p.maxFocus, p.focus + st.focusRegen * dt);
  if (p.evadeCharges < st.evadeCharges) { p.evadeT += dt; if (p.evadeT >= st.evadeRecharge) { p.evadeT = 0; p.evadeCharges++; } }
  for (const k in p.cds) { p.cds[k] -= dt; if (p.cds[k] <= 0) { delete p.cds[k]; g.emit({ t: "sfx", id: "sfx_ready", vol: 0.25 }); } }
  for (const k in p.charges) {
    const c = p.charges[k];
    const s = SKILL_BY_ID[k];
    const max = maxCharges(g, s);
    if (c.n < max) { c.t += dt * (k === "snare_bloom" ? 1 + 0.08 * (g.ch.ranks.trapwright ?? 0) : 1); const cd = skillCooldown(s, st.cdr); if (c.t >= cd) { c.t = 0; c.n++; } }
  }
  p.potionCd = Math.max(0, p.potionCd - dt);
  p.relicCd = Math.max(0, p.relicCd - dt);
  if (g.ch.classId === "cinder") {
    if (p.furnace) {
      p.heat -= 8 * dt;
      if (p.heat <= 0) { p.heat = 0; p.furnace = false; g.statsDirty = true; g.emit({ t: "toast", text: "Furnace Heart gutters out" }); }
    } else if (g.time - p.lastHitT > 4) p.heat = Math.max(0, p.heat - 3 * dt);
    if (g.ch.ranks.living_crucible && p.heat >= 100) {
      p.heat = 0;
      g.emberBurst(p.x, p.y, 4.5, SKILL_BY_ID.living_crucible.coeff.base, "living_crucible");
      delete p.cds.cinder_ring;
      g.emit({ t: "toast", text: "Living Crucible vents!", kind: "info" });
    }
  }
  if (p.hot) { const h = Math.min(p.hot.t, dt); healPlayer(g, p.hot.perSec * h, false); p.hot.t -= dt; if (p.hot.t <= 0) p.hot = null; }
  const moved = Math.hypot(p.x - p.px, p.y - p.py);
  if (p.action || moved > 0.001) p.stillT = 0;

  if (hasStatus(p, "stun")) {
    if (p.action && p.action.kind !== "evade") p.action = null;
    p.anim = "stun";
    return;
  }

  // ── discrete intents ──
  if (inp.evade) startEvade(g, inp);
  if (inp.potion !== null) drinkPotion(g, (["health", "focus", "cleanse", "tonic"] as PotionKind[])[inp.potion]);
  if (inp.townGate) startTownGate(g);
  if (inp.interact) {
    const target = inp.hoverInteract ?? g.nearestInteractable(p.x, p.y, 3.2);
    if (target !== null) { p.pendingInteract = target; p.attackTarget = null; p.moveTarget = null; p.path = null; }
  }
  if (inp.skillPressed !== null) tryCast(g, inp.skillPressed, inp);
  else if (inp.secondaryDown) tryCast(g, 0, inp, !inp.secondaryPressed);

  // primary click / hold
  if (inp.primaryPressed) {
    if (inp.hoverEnemy !== null) {
      p.attackTarget = inp.hoverEnemy; p.pendingInteract = null; p.moveTarget = null; p.path = null;
      if (inp.standStill || g.settings.attackWithoutMove) { castBasicAt(g, inp.cursorX, inp.cursorY, inp.hoverEnemy, true); }
    } else if (inp.standStill) {
      castBasicAt(g, inp.cursorX, inp.cursorY, null, true);
    } else if (inp.hoverInteract !== null) {
      p.pendingInteract = inp.hoverInteract; p.attackTarget = null; p.moveTarget = null; p.path = null;
    } else {
      p.attackTarget = null; p.pendingInteract = null;
      moveTo(g, inp.cursorX, inp.cursorY, true);
    }
  } else if (inp.primaryDown && p.attackTarget === null && p.pendingInteract === null && !inp.standStill) {
    if (g.tick % 4 === 0) moveTo(g, inp.cursorX, inp.cursorY, false);
  } else if (inp.primaryDown && inp.standStill && !p.action) {
    castBasicAt(g, inp.cursorX, inp.cursorY, inp.hoverEnemy, true);
  }

  // ── action progression ──
  if (p.action) updateAction(g, dt);
  if (p.action?.kind === "evade" || p.action?.kind === "dash" || p.action?.kind === "leap") return;

  // attack target pursuit
  if (p.attackTarget !== null && !p.action) {
    const e = g.enemyById(p.attackTarget);
    if (!e || !e.alive) { p.attackTarget = null; }
    else {
      const s = SKILL_BY_ID[basicSkill(g.ch.classId)];
      const d = dist(p.x, p.y, e.x, e.y);
      const inRange = s.tags.includes("melee") ? d <= s.range + e.radius : d <= s.range && lineClear(g.nav, p.x, p.y, e.x, e.y, 0.1);
      if (inRange) {
        castBasicAt(g, e.x, e.y, e.id, false);
        if (!inp.primaryDown) p.attackTarget = null; // one click = one attack; hold to continue
        p.path = null;
      } else if (!p.path || g.tick % 8 === 0) {
        p.path = findPath(g.nav, p.x, p.y, e.x, e.y) ?? null;
      }
    }
  }
  // pending interaction
  if (p.pendingInteract !== null && !p.action) {
    const pos = g.interactPos(p.pendingInteract);
    if (!pos) p.pendingInteract = null;
    else if (dist(p.x, p.y, pos.x, pos.y) <= INTERACT_RANGE) {
      const id = p.pendingInteract;
      p.pendingInteract = null; p.path = null;
      g.interact(id);
    } else if (!p.path || g.tick % 10 === 0) {
      const tgt = nearestOpen(g.nav, pos.x, pos.y, 3);
      p.path = tgt ? findPath(g.nav, p.x, p.y, tgt.x, tgt.y) : null;
      if (!p.path) p.pendingInteract = null;
    }
  }

  // movement
  if (actionLocked(p.action)) { p.anim = p.action?.kind === "channel" ? "channel" : p.anim; return; }
  if (p.action?.kind === "channel") { if (p.path) { p.action = null; } else { p.anim = "channel"; return; } }
  if (p.action?.kind === "skill" && p.path) p.action = null; // cancel window: movement cancels recovery
  if (p.action) return;
  if (p.path && p.path.length) {
    const speed = st.moveSpeed * slowFactor(p) * (hasStatus(p, "camo") ? 1.4 : 1) * (hasStatus(p, "root") ? 0 : 1);
    let remaining = speed * dt;
    while (remaining > 0 && p.path.length) {
      const wp = p.path[0];
      const d = dist(p.x, p.y, wp.x, wp.y);
      if (d <= remaining) { p.x = wp.x; p.y = wp.y; remaining -= d; p.path.shift(); }
      else { p.x += ((wp.x - p.x) / d) * remaining; p.y += ((wp.y - p.y) / d) * remaining; remaining = 0; }
      p.facing = angleTo(p.px, p.py, wp.x, wp.y);
    }
    if (!p.path.length) p.path = null;
    const m = Math.hypot(p.x - p.px, p.y - p.py);
    p.movedSinceShot += m;
    p.anim = m > 0.001 ? "move" : "idle";
  } else {
    p.anim = "idle";
    p.stillT += dt;
  }
}

export function moveTo(g: Game, x: number, y: number, showInvalid: boolean) {
  const p = g.player;
  let tx = x, ty = y;
  const n = nearestOpen(g.nav, x, y, 6);
  if (!n) { if (showInvalid) g.emit({ t: "invalid", x, y }); return; }
  if (Math.hypot(n.x - x, n.y - y) > 1.5 && showInvalid) g.emit({ t: "invalid", x, y });
  tx = n.x; ty = n.y;
  if (g.arena) { const a = g.arena; const d = Math.hypot(tx - a.x, ty - a.y); if (d > a.r - 0.6) { tx = a.x + ((tx - a.x) / d) * (a.r - 0.6); ty = a.y + ((ty - a.y) / d) * (a.r - 0.6); } }
  if (lineClear(g.nav, p.x, p.y, tx, ty, 0.3)) p.path = [{ x: tx, y: ty }];
  else p.path = findPath(g.nav, p.x, p.y, tx, ty);
  p.moveTarget = { x: tx, y: ty };
}

function maxCharges(g: Game, s: SkillDef) {
  return (s.charges ?? 1) + (s.id === "snare_bloom" && g.stats.relics.has("snarewood") ? 1 : 0);
}

function castBasicAt(g: Game, x: number, y: number, targetId: number | null, standing: boolean) {
  const p = g.player;
  if (p.action && actionLocked(p.action)) return;
  if (p.action?.kind === "skill" && !p.action.impactDone) return;
  const s = SKILL_BY_ID[basicSkill(g.ch.classId)];
  startSkill(g, s, 1, x, y, targetId);
  p.standing = standing;
}

/** Hotbar slot 0 = right mouse, 1-4 = Q W E R. */
export function tryCast(g: Game, slot: number, inp: Intents, held = false): boolean {
  const p = g.player;
  const id = g.ch.hotbar[slot];
  if (!id) return false;
  const s = SKILL_BY_ID[id];
  const rank = g.stats.rank(id);
  if (rank <= 0) return false;
  if (p.action && actionLocked(p.action)) return false;
  if (p.action?.kind === "skill" && !p.action.impactDone) return false;
  const usesCharges = !!s.charges;
  if (usesCharges) {
    const c = (p.charges[id] ??= { n: maxCharges(g, s), t: 0 });
    if (c.n <= 0) { if (!held) invalid(g, "Recharging"); return false; }
  } else if (p.cds[id]) { if (!held) invalid(g, "Not ready"); return false; }
  if (s.id === "furnace_heart") {
    if (p.furnace) { p.furnace = false; g.statsDirty = true; p.cds[id] = 1; g.emit({ t: "sfx", id: "sfx_ignite", vol: 0.4 }); return true; }
    if (p.heat < (s.heatCost ?? 0)) { if (!held) invalid(g, "Not enough Heat"); return false; }
  }
  if (p.focus < s.cost) { if (!held) invalid(g, "Not enough Focus"); return false; }
  p.focus -= s.cost;
  if (usesCharges) p.charges[id].n--;
  else if (s.cooldown > 0) p.cds[id] = skillCooldown(s, g.stats.cdr);
  let tx = inp.cursorX, ty = inp.cursorY;
  let target: number | null = inp.hoverEnemy;
  if (s.targeting === "ground") {
    const d = dist(p.x, p.y, tx, ty);
    if (d > s.range) { tx = p.x + ((tx - p.x) / d) * s.range; ty = p.y + ((ty - p.y) / d) * s.range; }
  }
  p.attackTarget = null; p.path = null; p.pendingInteract = null;
  startSkill(g, s, rank, tx, ty, target);
  return true;
}

function invalid(g: Game, text: string) {
  g.emit({ t: "sfx", id: "sfx_invalid", vol: 0.5 });
  g.emit({ t: "toast", text, kind: "warn" });
}

function startSkill(g: Game, s: SkillDef, rank: number, tx: number, ty: number, targetId: number | null) {
  const p = g.player;
  const spd = g.stats.attackSpeed * (p.furnace ? 1 + (0.2 + 0.04 * (g.stats.rank("furnace_heart") - 1)) : 1);
  const total = (s.timing.impact + s.timing.recovery) / 1000 / spd;
  const impactAt = s.timing.impact / 1000 / spd;
  const basic = s.kind === "basic";
  if (basic) { if (g.time - p.comboT > 1.4) p.combo = 0; }
  // breaking camouflage
  if (hasStatus(p, "camo") && s.id !== "mothcloak") breakCamo(g);
  p.action = { kind: "skill", skill: s, t: 0, total, impactAt, cancelAt: Math.max(impactAt, total * s.timing.cancel), impactDone: false, targetId, tx, ty, angle: angleTo(p.x, p.y, tx, ty), rank, combo: p.combo, basic };
  p.facing = p.action.angle;
  p.anim = "windup"; p.animT = 0;
  g.emit({ t: "sfx", id: s.id === "iron_litany" ? "sfx_swing" : s.sfx, x: p.x, y: p.y, vol: 0.6 });
}

function breakCamo(g: Game) {
  const p = g.player;
  removeStatus(p, "camo");
  if (g.stats.relics.has("moth_queen")) for (const e of g.enemies) if (e.alive && dist(e.x, e.y, p.x, p.y) < 5) addMarks(g, e, 2);
}

export function addMarks(g: Game, e: Enemy, n: number) {
  const s = applyStatus(e, "mark", 8, 0, g.player.id, g.player.marksMax);
  s.stacks = Math.min(g.player.marksMax, s.stacks + n - 1);
  g.emit({ t: "vfx", kind: "mark", x: e.x, y: e.y, type: "player" });
}

function updateAction(g: Game, dt: number) {
  const p = g.player;
  const a = p.action!;
  a.t += dt;
  switch (a.kind) {
    case "skill": {
      // rotate toward a live target during anticipation
      if (!a.impactDone && a.targetId !== null) {
        const e = g.enemyById(a.targetId);
        if (e && e.alive) { a.tx = e.x; a.ty = e.y; a.angle = angleTo(p.x, p.y, e.x, e.y); p.facing = a.angle; }
      }
      p.anim = a.impactDone ? "recover" : "windup";
      if (!a.impactDone && a.t >= a.impactAt) {
        a.impactDone = true;
        p.anim = "attack"; p.animT = 0;
        executeSkill(g, a);
        if (a.basic) { p.combo = (p.combo + 1) % 3; p.comboT = g.time; p.basicCount++; }
      }
      if (a.t >= a.total) p.action = null;
      break;
    }
    case "evade":
    case "leap":
    case "dash": {
      const k = clamp(a.t / a.dur, 0, 1);
      const ease = 1 - (1 - k) * (1 - k);
      const nx = a.fx + (a.tx - a.fx) * ease, ny = a.fy + (a.ty - a.fy) * ease;
      if (circleFree(g.nav, nx, ny, p.radius * 0.8)) { p.x = nx; p.y = ny; }
      p.anim = "evade";
      if (a.kind === "dash") {
        for (const e of g.enemies) {
          if (!e.alive || a.hit.has(e.id) || e.training && false) continue;
          if (dist(e.x, e.y, p.x, p.y) < e.radius + p.radius + 0.6) {
            a.hit.add(e.id);
            playerHit(g, e, skillCoeff(a.skill, a.rank), a.skill.id, { ailment: { type: "stagger", chance: 1 }, heavy: true });
            if (e.def.light && LESSER(e)) { interruptEnemy(g, e); const an = angleTo(p.x, p.y, e.x, e.y); g.pushActor(e, Math.cos(an) * 1.4, Math.sin(an) * 1.4); }
          }
        }
      }
      if (g.stats.relics.has("ashwalker") && a.kind === "evade" && g.tick % 3 === 0) g.addZone({ team: 0, kind: "ember_trail", x: p.x, y: p.y, r: 1.1, dur: 2, dps: 0, dmgType: "ember", source: p.id, data: { coeff: 0.25 } });
      if (a.t >= a.dur) {
        p.action = null;
        if (a.kind === "dash") { applyStatus(p, "guard", g.ch.ranks.unbroken_oath ? 4 : 2); g.statsDirty = true; }
      }
      break;
    }
    case "channel": {
      p.anim = "channel";
      if (a.t >= a.dur) { p.action = null; g.townGate(); }
      break;
    }
  }
}

function executeSkill(g: Game, a: Extract<PlayerAction, { kind: "skill" }>) {
  const p = g.player;
  const s = a.skill;
  const coeff = skillCoeff(s, a.rank);
  const ang = a.angle;
  const cx = Math.cos(ang), cy = Math.sin(ang);
  switch (s.id) {
    // ── Cinder Vow ──
    case "iron_litany": {
      let hitAny = false;
      for (const e of g.enemies) {
        if (!e.alive) continue;
        if (inCone(p.x, p.y, ang, (55 * Math.PI) / 180, s.range, e.x, e.y, e.radius)) {
          hitAny = true;
          playerHit(g, e, coeff * (a.combo === 2 ? 1.25 : 1), s.id, { ailment: s.ailment, heavy: a.combo === 2 });
        }
      }
      g.igniteBraziersInCone(p.x, p.y, ang, s.range);
      g.emit({ t: "vfx", kind: "swing", x: p.x, y: p.y, angle: ang, r: s.range, type: "physical" });
      if (hitAny) g.emit({ t: "sfx", id: "sfx_hit_heavy", x: p.x, y: p.y });
      if (a.combo === 2) {
        g.addProjectile({ team: 0, x: p.x + cx * 0.8, y: p.y + cy * 0.8, vx: cx * 14, vy: cy * 14, radius: 0.8, life: 0.32, kind: "wave", pierce: 99, source: p.id, skill: s.id, rank: 1, coeff: 0.6, dmgType: "physical", dmg: 0 });
        g.emit({ t: "shake", amp: 0.08, dur: 0.12, src: "player" });
      }
      if (g.stats.relics.has("starfall_litany") && p.basicCount % 4 === 3) {
        g.addZone({ team: 0, kind: "eruption", x: a.tx, y: a.ty, r: 1.8, dur: 0.35, arm: 0.35, dps: 0, dmgType: "frost", source: p.id, data: { coeff: 1.2, skill: "starfall" } });
      }
      break;
    }
    case "brand_arc": {
      for (const e of g.enemies) {
        if (!e.alive) continue;
        if (inCone(p.x, p.y, ang, (80 * Math.PI) / 180, s.range, e.x, e.y, e.radius)) {
          const burning = hasStatus(e, "burn");
          playerHit(g, e, coeff, s.id, { ailment: s.ailment, mult: burning ? 1.4 : 1 });
          if (burning && g.stats.relics.has("oathbreaker")) p.focus = Math.min(p.maxFocus, p.focus + 3);
        }
      }
      g.igniteBraziersInCone(p.x, p.y, ang, s.range);
      g.emit({ t: "vfx", kind: "flamesweep", x: p.x, y: p.y, angle: ang, r: s.range, type: "ember" });
      break;
    }
    case "bastion_step": {
      const d = Math.min(s.range, dist(p.x, p.y, a.tx, a.ty));
      const end = g.castClamp(p.x, p.y, ang, Math.max(1.5, d));
      p.action = { kind: "dash", t: 0, dur: 0.26, fx: p.x, fy: p.y, tx: end.x, ty: end.y, skill: s, rank: a.rank, hit: new Set() };
      g.emit({ t: "vfx", kind: "dash", x: p.x, y: p.y, angle: ang, type: "player" });
      break;
    }
    case "cinder_ring": {
      const heat = p.heat;
      p.heat = 0;
      const r = s.range + heat * 0.01;
      g.addZone({ team: 0, kind: "ring", x: p.x, y: p.y, r, dur: 0.65, arm: 0.65, dps: 0, dmgType: "ember", source: p.id, data: { coeff: coeff * (1 + heat / 100), skill: s.id, follow: false } });
      g.addTelegraph({ shape: "circle", x: p.x, y: p.y, angle: 0, r, r2: 0, arc: 0, len: 0, width: 0, dur: 0.65, type: "player", owner: p.id });
      break;
    }
    case "vow_chain": {
      g.addProjectile({ team: 0, x: p.x + cx * 0.6, y: p.y + cy * 0.6, vx: cx * 24, vy: cy * 24, radius: 0.45, life: s.range / 24, kind: "chain", pierce: 0, source: p.id, skill: s.id, rank: a.rank, coeff, dmgType: "physical", dmg: 0 });
      break;
    }
    case "furnace_heart": {
      p.furnace = true;
      g.statsDirty = true;
      g.emit({ t: "vfx", kind: "furnace", x: p.x, y: p.y, type: "ember" });
      g.emit({ t: "toast", text: "Furnace Heart ignites" });
      break;
    }
    case "ashen_standard": {
      const pt = nearestOpen(g.nav, a.tx, a.ty, 3) ?? { x: p.x, y: p.y };
      g.addZone({ team: 0, kind: "standard", x: pt.x, y: pt.y, r: 5, dur: 8, dps: 0, dmgType: "ember", source: p.id, data: { coeff, pulse: 0 } });
      g.emit({ t: "vfx", kind: "standard", x: pt.x, y: pt.y, type: "player" });
      break;
    }
    // ── Veil Ranger ──
    case "quickshot": {
      const empowered = !!g.ch.ranks.patient_hunter && p.stillT >= 1;
      const mark = p.movedSinceShot >= 2 || !!g.ch.ranks.thousand_trails;
      p.movedSinceShot = 0;
      g.addProjectile({ team: 0, x: p.x + cx * 0.6, y: p.y + cy * 0.6, vx: cx * 26, vy: cy * 26, radius: 0.25, life: s.range / 26 + 0.1, kind: "arrow", pierce: empowered ? 3 : 0, source: p.id, skill: s.id, rank: 1, coeff: coeff * (empowered ? 2.5 : 1), dmgType: "physical", dmg: 0, empowered, mark });
      p.stillT = 0;
      if (g.stats.relics.has("starfall_litany") && p.basicCount % 4 === 3) g.addZone({ team: 0, kind: "eruption", x: a.tx, y: a.ty, r: 1.8, dur: 0.35, arm: 0.35, dps: 0, dmgType: "frost", source: p.id, data: { coeff: 1.2, skill: "starfall" } });
      break;
    }
    case "splinter_volley": {
      for (let i = 0; i < 5; i++) {
        const an = ang + ((i - 2) / 2) * (20 * Math.PI) / 180;
        g.addProjectile({ team: 0, x: p.x + Math.cos(an) * 0.5, y: p.y + Math.sin(an) * 0.5, vx: Math.cos(an) * 22, vy: Math.sin(an) * 22, radius: 0.25, life: s.range / 22, kind: "splinter", pierce: 0, source: p.id, skill: s.id, rank: a.rank, coeff, dmgType: "physical", dmg: 0 });
      }
      break;
    }
    case "ghostline": {
      g.addProjectile({ team: 0, x: p.x + cx * 0.6, y: p.y + cy * 0.6, vx: cx * 30, vy: cy * 30, radius: 0.45, life: s.range / 30, kind: "ghost", pierce: 99, source: p.id, skill: s.id, rank: a.rank, coeff, dmgType: "frost", dmg: 0 });
      break;
    }
    case "snare_bloom": {
      const pt = nearestOpen(g.nav, a.tx, a.ty, 3) ?? { x: p.x, y: p.y };
      g.addZone({ team: 0, kind: "trap", x: pt.x, y: pt.y, r: 1.6, dur: 20, arm: 0.5, dps: 0, dmgType: "blight", source: p.id, data: { coeff } });
      break;
    }
    case "mothcloak": {
      const dur = (1.5 + 0.2 * (a.rank - 1)) * (g.stats.relics.has("moth_queen") ? 2 : 1);
      applyStatus(p, "camo", dur);
      applyStatus(p, "evadeNext", Math.max(4, dur));
      for (const e of g.enemies) if (e.alive && e.aware && !e.isBoss) { e.lastKnown = { x: p.x, y: p.y }; if (e.ai === "telegraph") interruptEnemy(g, e); }
      g.emit({ t: "vfx", kind: "moth", x: p.x, y: p.y, type: "player" });
      break;
    }
    case "backstep_flask": {
      const back = ang + Math.PI;
      const end = g.castClamp(p.x, p.y, back, 5);
      g.addZone({ team: 0, kind: "blight_pool", x: p.x, y: p.y, r: 2.2, dur: 3, dps: 0, dmgType: "blight", source: p.id, data: { coeff, tick: 0.5 } });
      p.action = { kind: "leap", t: 0, dur: 0.3, fx: p.x, fy: p.y, tx: end.x, ty: end.y };
      break;
    }
    case "horizon_call": {
      g.addZone({ team: 0, kind: "rain", x: p.x + cx * 1.5, y: p.y + cy * 1.5, r: 1.5, angle: ang, len: 12, width: 3, dur: 2, dps: 0, dmgType: "physical", source: p.id, data: { coeff } });
      g.addTelegraph({ shape: "line", x: p.x + cx * 1.5, y: p.y + cy * 1.5, angle: ang, r: 0, r2: 0, arc: 0, len: 12, width: 3, dur: 2, type: "player", owner: p.id });
      break;
    }
  }
}

function startEvade(g: Game, inp: Intents) {
  const p = g.player;
  if (p.evadeCharges <= 0) { invalid(g, "No evade charges"); return; }
  if (p.action?.kind === "evade" || p.action?.kind === "dash" || p.action?.kind === "leap") return;
  if (hasStatus(p, "root")) { invalid(g, "Rooted"); return; }
  let ang = p.facing;
  if (Math.hypot(inp.cursorX - p.x, inp.cursorY - p.y) > 0.4) ang = angleTo(p.x, p.y, inp.cursorX, inp.cursorY);
  const end = g.castClamp(p.x, p.y, ang, EVADE_DIST);
  p.evadeCharges--;
  p.action = { kind: "evade", t: 0, dur: EVADE_TIME, fx: p.x, fy: p.y, tx: end.x, ty: end.y };
  p.path = null; p.attackTarget = null;
  p.facing = ang;
  g.emit({ t: "sfx", id: "sfx_evade", x: p.x, y: p.y, vol: 0.7 });
  g.emit({ t: "vfx", kind: "evade", x: p.x, y: p.y, angle: ang, type: "player" });
}

export function drinkPotion(g: Game, kind: PotionKind) {
  const p = g.player;
  const ch = g.ch;
  if (ch.belt[kind] <= 0) { invalid(g, "Belt slot empty"); return; }
  if (p.potionCd > 0) return;
  ch.belt[kind]--;
  p.potionCd = 0.5;
  const pw = g.stats.potionPower;
  switch (kind) {
    case "health": p.hot = { t: 1.5, perSec: (p.maxHp * 0.45 * pw) / 1.5 }; break;
    case "focus": p.focus = Math.min(p.maxFocus, p.focus + p.maxFocus * 0.6 * pw); break;
    case "cleanse": for (const s of ["burn", "blight", "chill", "slow", "root", "stun"]) removeStatus(p, s); applyStatus(p, "cleanseImm", 3); break;
    case "tonic": applyStatus(p, "tonic", 10 * pw); break;
  }
  g.emit({ t: "sfx", id: "sfx_potion", vol: 0.7 });
  g.emit({ t: "vfx", kind: "potion", x: p.x, y: p.y, type: kind === "health" ? "heal" : "player" });
}

function startTownGate(g: Game) {
  const p = g.player;
  if (g.zone.safe) { invalid(g, "Already in a safe place"); return; }
  if (g.arena) { invalid(g, "The arena is sealed"); return; }
  p.action = { kind: "channel", t: 0, dur: 2.5 };
  p.path = null; p.attackTarget = null;
  g.emit({ t: "sfx", id: "sfx_channel", vol: 0.6 });
}

/** Projectile → enemy collision; swept along the segment travelled this tick. */
export function updatePlayerProjectileHits(g: Game) {
  for (const pr of g.projectiles) {
    if (pr.team !== 0 || pr.life <= 0) continue;
    for (const e of g.enemies) {
      if (!e.alive || pr.hit.includes(e.id)) continue;
      if (pointSegDist(e.x, e.y, pr.px, pr.py, pr.x, pr.y) > e.radius + pr.radius) continue;
      // mirror shell reflects projectiles
      if (hasStatus(e, "shell") && pr.kind !== "wave") {
        pr.team = 1; pr.vx = -pr.vx; pr.vy = -pr.vy; pr.dmg = e.dmg * 0.8; pr.reflected = true; pr.hit = [];
        pr.life = Math.max(pr.life, 0.6);
        g.emit({ t: "sfx", id: "sfx_reflect", x: e.x, y: e.y });
        break;
      }
      pr.hit.push(e.id);
      onProjectileHit(g, pr, e);
      if (pr.hit.length > pr.pierce) { pr.life = 0; break; }
    }
  }
}

function onProjectileHit(g: Game, pr: (typeof g.projectiles)[number], e: Enemy) {
  const p = g.player;
  const s = pr.skill ? SKILL_BY_ID[pr.skill] : undefined;
  switch (pr.kind) {
    case "arrow":
    case "splinter":
      playerHit(g, e, pr.coeff, pr.skill!, { projectile: true, fromX: pr.px, fromY: pr.py, heavy: pr.empowered });
      if (pr.mark) addMarks(g, e, 1);
      break;
    case "wave":
      playerHit(g, e, pr.coeff, pr.skill!, { projectile: true, fromX: p.x, fromY: p.y, ailment: { type: "stagger", chance: 0.5 } });
      break;
    case "chain": {
      playerHit(g, e, pr.coeff, pr.skill!, { projectile: true, fromX: p.x, fromY: p.y, ailment: { type: "stagger", chance: 1 } });
      if (e.def.light && LESSER(e)) {
        const an = angleTo(p.x, p.y, e.x, e.y);
        e.pull = { t: 0, dur: 0.2, fx: e.x, fy: e.y, tx: p.x + Math.cos(an) * (1.4 + e.radius), ty: p.y + Math.sin(an) * (1.4 + e.radius) };
        interruptEnemy(g, e);
      } else {
        const an = angleTo(e.x, e.y, p.x, p.y);
        const tx = e.x + Math.cos(an) * (e.radius + 1.2), ty = e.y + Math.sin(an) * (e.radius + 1.2);
        p.action = { kind: "leap", t: 0, dur: 0.25, fx: p.x, fy: p.y, tx, ty };
      }
      g.emit({ t: "vfx", kind: "chainhit", x: e.x, y: e.y, x2: p.x, y2: p.y, type: "physical" });
      break;
    }
    case "ghost": {
      const marks = e.statuses.mark?.stacks ?? 0;
      const det = (pr as any).det ?? 0;
      const bonus = g.stats.relics.has("long_thread") ? 1 + 0.15 * det : 1;
      playerHit(g, e, pr.coeff * bonus, pr.skill!, { projectile: true, fromX: pr.px, fromY: pr.py, ailment: s?.ailment });
      if (marks > 0) {
        removeStatus(e, "mark");
        (pr as any).det = det + marks;
        const md = 1 + (g.stats.raw.markDamage ?? 0) / 100;
        for (const o of g.enemies) if (o.alive && dist(o.x, o.y, e.x, e.y) < 2.5) playerHit(g, o, 0.6 * marks * md, "ghostline", { dmgType: "frost", noCrit: false });
        const sb = g.ch.ranks.steady_breath ?? 0;
        if (sb) p.focus = Math.min(p.maxFocus, p.focus + 2 * sb * marks);
        if (g.ch.ranks.thousand_trails) for (const o of g.enemies) if (o.alive && o !== e && dist(o.x, o.y, e.x, e.y) < 4) addMarks(g, o, 2);
        g.emit({ t: "vfx", kind: "detonate", x: e.x, y: e.y, r: 2.5, type: "frost" });
        g.emit({ t: "sfx", id: "sfx_detonate", x: e.x, y: e.y });
      }
      break;
    }
  }
}

export { DT };
