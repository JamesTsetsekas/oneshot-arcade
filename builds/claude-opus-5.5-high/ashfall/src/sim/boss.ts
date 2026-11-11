import { angleTo, dist, inCone, inLine, rotateToward } from "../core/math";
import type { EnemyDef } from "../data/types";
import { applyStatus, damagePlayer, hasStatus } from "./combat";
import type { Game } from "./game";
import { navTo } from "./ai";
import type { BossState, Enemy } from "./types";

export const BOSS_DEFS: Record<string, EnemyDef> = {
  tollkeeper: {
    id: "tollkeeper", name: "The Toll-Keeper", role: "bruiser", behavior: "bruiser", hp: 560, dmg: 11, speed: 2.7, radius: 1.1, armor: 30,
    res: { ember: 20, frost: 20, blight: 20 }, xp: 320, aggro: 0, light: false, color: "#ff7a40", attacks: [],
    flavor: "A hooded gatekeeper hung with chains and lanterns. Its plated hide must be broken.",
  },
  engine: {
    id: "engine", name: "Orison Engine", role: "bruiser", behavior: "bruiser", hp: 1500, dmg: 12, speed: 0, radius: 2.4, armor: 40,
    res: { ember: 25, frost: 25, blight: 25 }, xp: 900, aggro: 0, light: false, color: "#40e0ff", attacks: [],
    flavor: "A machine-organism wound around the buried star. It prays in beams of light.",
  },
  conduit: {
    id: "conduit", name: "Star Conduit", role: "controller", behavior: "dummy", hp: 120, dmg: 0, speed: 0, radius: 0.8, armor: 10,
    res: {}, xp: 20, aggro: 0, light: false, color: "#60f0ff", attacks: [], flavor: "Feeds the Engine's shell.",
  },
  repair_scribe: {
    id: "repair_scribe", name: "Repair Scribe", role: "fodder", behavior: "support", hp: 26, dmg: 3, speed: 3.2, radius: 0.45, armor: 0,
    res: {}, xp: 8, aggro: 30, light: true, color: "#9cf0ff", attacks: [], flavor: "Mends the Engine while it lives.",
  },
};

export function newBossState(kind: "tollkeeper" | "engine", e: Enemy): BossState {
  return {
    kind, phase: 1, t: 0, nextAt: 1.5, last: [], armor: kind === "tollkeeper" ? e.maxHp * 0.22 : 0, armorMax: kind === "tollkeeper" ? e.maxHp * 0.22 : 0, armorRegenT: 0,
    stagger: 0, staggerMax: e.maxHp * 0.12, staggeredT: 0, enraged: false,
    beams: [], beamCycleT: 0, summonT: 8, quadT: 3, overloadT: 22, invulnerable: false, conduits: [], stomp: 0, active: false, homeX: e.x, homeY: e.y,
  };
}

/** Anti-repeat weighted choice: never the same move twice in a row. */
function choose(g: Game, b: BossState, opts: [string, number][]): string {
  const filtered = opts.filter(([id, w]) => w > 0 && id !== b.last[b.last.length - 1]);
  const pick = g.combatRng.weighted(filtered.length ? filtered : opts, (o) => o[1])![0];
  b.last.push(pick);
  if (b.last.length > 4) b.last.shift();
  return pick;
}

export function updateBoss(g: Game, e: Enemy, dt: number) {
  const b = e.boss!;
  if (!b.active) {
    e.anim = "idle";
    const p = g.player;
    const arena = g.zone.meta.arena as { x: number; y: number; r: number } | undefined;
    if (arena && p.alive && dist(p.x, p.y, arena.x, arena.y) < arena.r - 1.5) g.startBossFight(e);
    return;
  }
  b.t += dt;
  if (!b.enraged && b.t > (b.kind === "tollkeeper" ? 180 : 300)) {
    b.enraged = true;
    g.emit({ t: "toast", text: `${e.name} is enraged!`, kind: "warn" });
    g.emit({ t: "sfx", id: "sfx_enrage" });
  }
  if (b.kind === "tollkeeper") updateTollKeeper(g, e, b, dt);
  else updateEngine(g, e, b, dt);
}

// ───────────────────────── Toll-Keeper ─────────────────────────
function updateTollKeeper(g: Game, e: Enemy, b: BossState, dt: number) {
  const p = g.player;
  const vet = g.ch.difficulty === "veteran";
  const spd = b.enraged ? 1.4 : 1;
  const dmgMul = b.enraged ? 1.5 : 1;
  if (b.staggeredT > 0) {
    b.staggeredT -= dt;
    e.anim = "stun";
    if (b.staggeredT <= 0) { e.ai = "approach"; b.nextAt = b.t + 0.6; }
    return;
  }
  if (b.armor <= 0) {
    b.armorRegenT -= dt;
    if (b.armorRegenT <= 0) { b.armor = b.armorMax; g.emit({ t: "toast", text: "The Toll-Keeper's plates reform", kind: "warn" }); }
  }
  const d = dist(e.x, e.y, p.x, p.y);
  if (d < 3.4) b.stomp += dt; else b.stomp = Math.max(0, b.stomp - dt);
  b.summonT -= dt;
  if (e.ai === "telegraph") {
    e.aiT -= dt;
    e.anim = "windup";
    if (e.aiT <= 0) resolveToll(g, e, b, dmgMul, vet);
    return;
  }
  if (e.ai === "recover") {
    e.aiT -= dt; e.anim = "recover";
    if (e.aiT <= 0) {
      e.ai = "approach";
      if ((b as any).queued) { const q = (b as any).queued; (b as any).queued = null; startToll(g, e, b, q, spd); }
    }
    return;
  }
  // approach
  if (d > 3.2) navTo(g, e, p.x, p.y, dt, 1 * spd);
  else { e.anim = "idle"; e.facing = rotateToward(e.facing, angleTo(e.x, e.y, p.x, p.y), 3 * dt); }
  if (b.t >= b.nextAt && p.alive) {
    const lanterns = g.enemies.filter((o) => o.alive && o.summoned).length;
    const move = choose(g, b, [
      ["sweep", d < 7.5 ? 3 : 0],
      ["lash", d < 12 ? 2 : 0],
      ["summon", b.summonT <= 0 && lanterns < 3 ? 2.5 : 0],
      ["stomp", b.stomp > 1.4 ? 5 : 0],
    ]);
    startToll(g, e, b, move, spd);
  }
}

function startToll(g: Game, e: Enemy, b: BossState, move: string, spd: number) {
  const p = g.player;
  e.ai = "telegraph";
  (e as any).bossMove = move;
  e.atkAngle = angleTo(e.x, e.y, p.x, p.y);
  e.facing = e.atkAngle;
  g.clearTelegraphs(e.id);
  switch (move) {
    case "sweep":
      e.aiT = 1.1 / spd;
      e.telegraphId = g.addTelegraph({ shape: "cone", x: e.x, y: e.y, angle: e.atkAngle, r: 7, r2: 0, arc: (200 * Math.PI) / 180, len: 0, width: 0, dur: e.aiT, type: "physical", owner: e.id });
      g.emit({ t: "sfx", id: "sfx_tele_heavy", x: e.x, y: e.y });
      break;
    case "sweep2":
      e.aiT = 0.75 / spd;
      e.atkAngle += Math.PI;
      e.telegraphId = g.addTelegraph({ shape: "cone", x: e.x, y: e.y, angle: e.atkAngle, r: 7, r2: 0, arc: (160 * Math.PI) / 180, len: 0, width: 0, dur: e.aiT, type: "physical", owner: e.id });
      g.emit({ t: "sfx", id: "sfx_tele_heavy", x: e.x, y: e.y });
      break;
    case "lash":
      e.aiT = 0.85 / spd;
      e.telegraphId = g.addTelegraph({ shape: "line", x: e.x, y: e.y, angle: e.atkAngle, r: 0, r2: 0, arc: 0, len: 12, width: 1.9, dur: e.aiT, type: "physical", owner: e.id });
      g.emit({ t: "sfx", id: "sfx_chain", x: e.x, y: e.y });
      break;
    case "stomp":
      e.aiT = 0.8 / spd;
      e.telegraphId = g.addTelegraph({ shape: "circle", x: e.x, y: e.y, angle: 0, r: 3.6, r2: 0, arc: 0, len: 0, width: 0, dur: e.aiT, type: "physical", owner: e.id });
      g.emit({ t: "sfx", id: "sfx_tele_heavy", x: e.x, y: e.y });
      break;
    case "summon": {
      e.aiT = 1.1 / spd;
      const arena = g.zone.meta.arena as { x: number; y: number; r: number };
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i < 3; i++) {
        const a = g.combatRng.range(0, Math.PI * 2);
        const r = g.combatRng.range(4, arena.r - 1.5);
        const x = arena.x + Math.cos(a) * r, y = arena.y + Math.sin(a) * r;
        if (dist(x, y, p.x, p.y) < 4) continue; // never spawn on top of the player
        pts.push({ x, y });
        g.addTelegraph({ shape: "ring", x, y, angle: 0, r: 0.9, r2: 0.6, arc: 0, len: 0, width: 0, dur: e.aiT, type: "ember", owner: e.id });
      }
      (e as any).summonPts = pts;
      g.emit({ t: "sfx", id: "sfx_summon", x: e.x, y: e.y });
      g.emit({ t: "subtitle", who: "The Toll-Keeper", text: "Light the way… for the toll." });
      break;
    }
  }
}

function resolveToll(g: Game, e: Enemy, b: BossState, dmgMul: number, vet: boolean) {
  const p = g.player;
  const move = (e as any).bossMove as string;
  g.clearTelegraphs(e.id);
  e.ai = "recover";
  e.aiT = (b.enraged ? 0.6 : 0.95);
  e.anim = "attack"; e.animT = 0;
  b.nextAt = b.t + e.aiT + 0.4;
  const dmg = e.dmg * dmgMul;
  switch (move) {
    case "sweep":
    case "sweep2":
      if (inCone(e.x, e.y, e.atkAngle, ((move === "sweep" ? 200 : 160) * Math.PI) / 360, 7, p.x, p.y, p.radius)) damagePlayer(g, dmg * 2.3, "physical", e, { melee: true, label: "The Toll-Keeper — Chain Sweep", heavy: true });
      g.emit({ t: "vfx", kind: "chainsweep", x: e.x, y: e.y, angle: e.atkAngle, r: 7, type: "physical" });
      g.emit({ t: "sfx", id: "sfx_slam", x: e.x, y: e.y });
      g.emit({ t: "shake", amp: 0.2, dur: 0.25, src: "boss" });
      if (move === "sweep" && vet) (b as any).queued = "sweep2";
      if (move === "sweep2") e.aiT = 0.9;
      break;
    case "lash":
      if (inLine(e.x, e.y, e.atkAngle, 12, 0.95, p.x, p.y, p.radius)) damagePlayer(g, dmg * 2.0, "physical", e, { label: "The Toll-Keeper — Chain Lash", ailment: { type: "slow", chance: 1 }, heavy: true });
      g.emit({ t: "vfx", kind: "lash", x: e.x, y: e.y, angle: e.atkAngle, r: 12, type: "physical" });
      break;
    case "stomp":
      if (dist(e.x, e.y, p.x, p.y) < 3.6 + p.radius) damagePlayer(g, dmg * 1.6, "physical", e, { melee: true, label: "The Toll-Keeper — Stomp", ailment: { type: "knockback", chance: 1 }, heavy: true });
      g.emit({ t: "vfx", kind: "slam", x: e.x, y: e.y, r: 3.6, type: "physical" });
      g.emit({ t: "shake", amp: 0.3, dur: 0.3, src: "boss" });
      b.stomp = 0;
      break;
    case "summon": {
      b.summonT = vet ? 12 : 16;
      for (const pt of ((e as any).summonPts ?? []) as { x: number; y: number }[]) {
        const m = g.spawnEnemy("lantern_mite", pt.x, pt.y, e.level - 1, [], e.packId);
        if (m) { m.summoned = true; m.aware = true; m.ai = "approach"; m.role = "lantern"; }
      }
      break;
    }
  }
}

// ───────────────────────── Orison Engine ─────────────────────────
function updateEngine(g: Game, e: Enemy, b: BossState, dt: number) {
  const p = g.player;
  const vet = g.ch.difficulty === "veteran";
  const arena = g.zone.meta.arena as { x: number; y: number; r: number };
  const speedMul = b.enraged ? 1.6 : 1;
  const dmgMul = b.enraged ? 1.5 : 1;
  e.anim = b.staggeredT > 0 ? "stun" : "idle";
  e.facing = angleTo(e.x, e.y, p.x, p.y);

  // phase transitions
  if (b.phase === 1 && e.hp <= e.maxHp * 0.66) {
    b.phase = 2;
    b.invulnerable = true;
    e.hp = Math.ceil(e.maxHp * 0.66);
    setBeams(g, e, b, []);
    b.quadT = 2.5;
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
      const c = g.spawnEnemy("conduit", arena.x + Math.cos(a) * 8, arena.y + Math.sin(a) * 8, e.level, [], e.packId);
      if (c) { c.role = "conduit"; c.maxHp = c.hp = Math.round(e.maxHp * 0.055); c.aware = true; c.ai = "approach"; b.conduits.push(c.id); }
    }
    g.emit({ t: "bossPhase", name: e.name, phase: 2 });
    g.emit({ t: "toast", text: "The Engine shields itself — destroy the three Conduits!", kind: "warn" });
    g.emit({ t: "subtitle", who: "Orison Engine", text: "THE CHOIR WILL NOT BE SILENCED." });
  }
  if (b.phase === 2) {
    const alive = b.conduits.filter((id) => g.enemyById(id)?.alive).length;
    if (alive === 0) {
      b.phase = 3;
      b.invulnerable = false;
      e.hp = Math.min(e.hp, Math.ceil(e.maxHp * 0.33));
      b.overloadT = 20;
      b.stagger = 0;
      setBeams(g, e, b, [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((a) => ({ angle: a + b.t * 0.1, speed: 0.22 })));
      g.emit({ t: "bossPhase", name: e.name, phase: 3 });
      g.emit({ t: "toast", text: "The Engine's core is exposed — fill its stagger meter before it overloads!", kind: "warn" });
    }
  }
  if (b.phase === 1 && b.beams.length === 0) {
    setBeams(g, e, b, vet ? [{ angle: 0, speed: 0.32 }, { angle: Math.PI, speed: -0.3 }] : [{ angle: 0, speed: 0.32 }, { angle: Math.PI, speed: 0.32 }]);
  }

  // beams: warm (telegraph only) → active → off
  if (b.staggeredT > 0) {
    b.staggeredT -= dt;
    for (const bm of b.beams) bm.active = false;
    g.clearTelegraphs(e.id, "beam");
    if (b.staggeredT <= 0) { b.stagger = 0; b.overloadT = 20; b.beamCycleT = 0; }
  } else if (b.beams.length) {
    b.beamCycleT += dt;
    const warm = 1.4, on = b.phase === 3 ? 5.5 : 5, off = b.phase === 3 ? 3.5 : 3;
    const cyc = b.beamCycleT % (warm + on + off);
    const phase = cyc < warm ? "warm" : cyc < warm + on ? "on" : "off";
    for (let i = 0; i < b.beams.length; i++) {
      const bm = b.beams[i];
      if (phase !== "off") bm.angle += bm.speed * speedMul * dt;
      bm.active = phase === "on";
      const tid = `beam${i}`;
      if (phase === "off") g.clearTelegraphs(e.id, tid);
      else g.upsertBeamTelegraph(e, tid, bm.angle, arena.r, phase === "warm");
      if (bm.active && g.tick % 6 === 0 && inLine(e.x, e.y, bm.angle, arena.r + 1, 0.7, p.x, p.y, p.radius)) {
        damagePlayer(g, e.dmg * 0.9 * dmgMul, "ember", e, { label: "Orison Engine — Orison Beam", unblockable: true });
      }
    }
  }

  // bolts
  (e as any).boltT = ((e as any).boltT ?? 2) - dt;
  if ((e as any).boltT <= 0 && b.staggeredT <= 0 && p.alive) {
    (e as any).boltT = b.phase === 2 ? 2.4 : 3.2;
    const a = angleTo(e.x, e.y, p.x, p.y);
    g.addProjectile({ team: 1, x: e.x + Math.cos(a) * 2.6, y: e.y + Math.sin(a) * 2.6, vx: Math.cos(a) * 10, vy: Math.sin(a) * 10, radius: 0.4, life: 2, kind: "orb", pierce: 0, source: e.id, coeff: 0, dmgType: "frost", dmg: e.dmg * 1.1 * dmgMul });
    g.emit({ t: "sfx", id: "sfx_tele_ranged", x: e.x, y: e.y, vol: 0.5 });
  }

  // repair scribes (phase 1)
  if (b.phase === 1) {
    b.summonT -= dt;
    if (b.summonT <= 0) {
      b.summonT = 20;
      for (let i = 0; i < 2; i++) {
        const a = g.combatRng.range(0, Math.PI * 2);
        const s = g.spawnEnemy("repair_scribe", arena.x + Math.cos(a) * (arena.r - 1.5), arena.y + Math.sin(a) * (arena.r - 1.5), e.level - 2, [], e.packId);
        if (s) { s.role = "repair"; s.summoned = true; s.aware = true; s.ai = "approach"; }
      }
      g.emit({ t: "toast", text: "Repair Scribes arrive — they mend the Engine!", kind: "warn" });
    }
  }
  for (const s of g.enemies) {
    if (!s.alive || s.role !== "repair") continue;
    const dd = dist(s.x, s.y, e.x, e.y);
    if (dd > e.radius + 2.5) navTo(g, s, e.x, e.y, dt, 1);
    else { s.anim = "cast"; if (!b.invulnerable) e.hp = Math.min(e.maxHp * (b.phase === 1 ? 1 : 0.33), e.hp + e.maxHp * 0.012 * dt); if (g.tick % 15 === 0) g.emit({ t: "vfx", kind: "repair", x: s.x, y: s.y, x2: e.x, y2: e.y, type: "frost" }); }
  }

  // quadrant blight (phase 2, and veteran phase 3)
  if (b.phase === 2 || (b.phase === 3 && vet)) {
    b.quadT -= dt;
    if (b.quadT <= 0) {
      b.quadT = b.phase === 2 ? 4.5 : 7;
      const n = vet && b.phase === 2 ? 2 : 1;
      const qs = g.combatRng.shuffle([0, 1, 2, 3]).slice(0, n);
      for (const q of qs) {
        const ang = q * (Math.PI / 2) + Math.PI / 4;
        g.addTelegraph({ shape: "quadrant", x: arena.x, y: arena.y, angle: ang, r: arena.r, r2: 0, arc: Math.PI / 2, len: 0, width: 0, dur: 2.0, type: "blight", owner: -1 });
        g.addZone({ team: 1, kind: "quadrant", x: arena.x, y: arena.y, r: arena.r, angle: ang, len: 0, width: 0, dur: 5, arm: 2.0, dps: e.dmg * 1.1 * dmgMul, dmgType: "blight", source: e.id, data: { label: "Orison Engine — Delayed Blight" } });
      }
      g.emit({ t: "sfx", id: "sfx_tele_blight", vol: 0.8 });
    }
  }

  // phase 3 stagger race / overload
  if (b.phase === 3 && b.staggeredT <= 0) {
    if (b.stagger >= b.staggerMax) {
      b.staggeredT = 6;
      g.clearTelegraphs(e.id, "overload");
      g.emit({ t: "toast", text: "The Engine staggers! Strike now!", kind: "info" });
      g.emit({ t: "sfx", id: "sfx_shatter", x: e.x, y: e.y });
      g.emit({ t: "shake", amp: 0.35, dur: 0.4, src: "boss" });
    } else {
      b.overloadT -= dt;
      if (b.overloadT <= 2.5 && !(e as any).overloading) {
        (e as any).overloading = true;
        g.addTelegraph({ shape: "donut", x: e.x, y: e.y, angle: 0, r: arena.r + 1, r2: 4.6, arc: 0, len: 0, width: 0, dur: 2.5, type: "frost", owner: e.id });
        g.emit({ t: "toast", text: "Overload! Get close to the Engine!", kind: "warn" });
        g.emit({ t: "sfx", id: "sfx_tele_heavy", vol: 1 });
      }
      if (b.overloadT <= 0) {
        (e as any).overloading = false;
        b.overloadT = 20;
        if (dist(e.x, e.y, p.x, p.y) > 4.6) damagePlayer(g, e.dmg * 4.5 * dmgMul, "frost", e, { label: "Orison Engine — Overload", unblockable: true, heavy: true, ailment: { type: "chill", chance: 1 } });
        g.emit({ t: "vfx", kind: "overload", x: e.x, y: e.y, r: arena.r, type: "frost" });
        g.emit({ t: "shake", amp: 0.4, dur: 0.5, src: "boss" });
      }
    }
  }
}

function setBeams(g: Game, e: Enemy, b: BossState, beams: { angle: number; speed: number }[]) {
  for (let i = 0; i < 4; i++) g.clearTelegraphs(e.id, `beam${i}`);
  b.beams = beams.map((x) => ({ ...x, active: false, warmT: 0, offT: 0 }));
  b.beamCycleT = 0;
}

export function engineVulnerable(e: Enemy) {
  return !e.boss?.invulnerable;
}

export { hasStatus, applyStatus };
