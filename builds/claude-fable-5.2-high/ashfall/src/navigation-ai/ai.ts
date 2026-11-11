import { TAU, angDiff, angTo, dist, turnToward } from '../core/math';
import { addStatus, alertPack, damagePlayer, getStatus, hasStatus, killActor, spawnArea, spawnEnemy, spawnProjectile } from '../entity-combat/combat';
import { DT, type Actor, type Area } from '../entity-combat/types';
import type { Session } from '../game-session/session';
import { bossTick } from './boss';
import { ENEMY, type AttackDef } from './enemies';
import { circleFree, findPath, los, moveCircle, nearestFree, walkLine } from './grid';

const ROLE_PRIO: Record<string, number> = { bruiser: 0, controller: 1, skirmisher: 2, fodder: 3, boss: 0, object: 9 };
const MAX_HEAVY = 2;

/** Moves an agent toward a point: straight when the line is walkable, otherwise along a cached A* path. */
export function steer(s: Session, a: Actor, tx: number, ty: number, speed: number): void {
  const ai = a.ai!;
  const d = dist(a.x, a.y, tx, ty);
  if (d < 0.15 || speed <= 0) return;
  let gx = tx, gy = ty;
  if (!circleFree(s.zone, a.x, a.y, Math.min(0.7, a.r * 0.8) - 0.02)) { const f = nearestFree(s.zone, a.x, a.y, Math.min(0.7, a.r * 0.8)); if (f) { a.x = f.x; a.y = f.y; } }
  if (!walkLine(s.zone, a.x, a.y, tx, ty, Math.min(0.7, a.r * 0.8))) {
    ai.repath -= DT;
    if (ai.repath <= 0 || !ai.path.length) {
      ai.repath = 0.5 + (a.id % 5) * 0.06;
      ai.path = findPath(s.zone, a.x, a.y, tx, ty, Math.min(0.7, Math.min(0.7, a.r * 0.8)), 900) ?? [];
    }
    while (ai.path.length > 1 && dist(a.x, a.y, ai.path[0].x, ai.path[0].y) < 0.5) ai.path.shift();
    if (ai.path.length) { gx = ai.path[0].x; gy = ai.path[0].y; } else return;
  } else ai.path.length = 0;
  const ang = angTo(a.x, a.y, gx, gy);
  const step = Math.min(speed * DT, dist(a.x, a.y, gx, gy));
  moveCircle(s.zone, a, Math.cos(ang) * step, Math.sin(ang) * step, Math.min(0.7, Math.min(0.7, a.r * 0.8)));
  a.facing = turnToward(a.facing, ang, 10 * DT);
  a.anim = 'walk';
}
const heavyCount = (s: Session) => s.zone.actors.reduce((n, o) => n + (!o.dead && o.ai && o.ai.state === 'telegraph' && o.ai.atk >= 0 && ENEMY[o.def].attacks[o.ai.atk]?.heavy ? 1 : 0), 0);

/** Assigns the eight melee attack slots around the player; heavier roles claim first so fodder yields. */
export function assignSlots(s: Session): void {
  const p = s.player;
  const melee = s.zone.actors.filter((a) => a.kind === 'enemy' && !a.dead && !a.boss && a.ai && a.ai.state !== 'dormant' && a.ai.state !== 'investigate' && !ENEMY[a.def].keepRange && !ENEMY[a.def].flank);
  melee.sort((a, b) => ROLE_PRIO[ENEMY[a.def].role] - ROLE_PRIO[ENEMY[b.def].role] || dist(a.x, a.y, p.x, p.y) - dist(b.x, b.y, p.x, p.y));
  const taken = new Array<boolean>(8).fill(false);
  for (const a of melee) {
    const bearing = angTo(p.x, p.y, a.x, a.y);
    let best = -1, bd = Infinity;
    for (let i = 0; i < 8; i++) { if (taken[i]) continue; const d = Math.abs(angDiff(i * TAU / 8, bearing)); if (d < bd) { bd = d; best = i; } }
    a.ai!.slot = best;
    if (best >= 0) taken[best] = true;
  }
}
function startAttack(s: Session, a: Actor, atk: AttackDef, idx: number, tx: number, ty: number): void {
  const ai = a.ai!;
  const dir = angTo(a.x, a.y, tx, ty);
  a.facing = dir;
  ai.state = 'telegraph'; ai.t = atk.windup; ai.atk = idx; ai.aimX = tx; ai.aimY = ty; ai.areaId = 0;
  a.anim = 'windup'; a.animT = 0; a.animDur = atk.windup;
  const rally = hasStatus(a, 'rally') ? 1.25 : 1;
  const src = { id: a.id, name: a.name, team: 1, dmg: a.dmg * atk.mul * rally };
  let ar: Area | null = null;
  const base = { delay: atk.windup, cancelOnOwner: true, heavy: atk.heavy, dtype: atk.dtype, status: atk.status, knock: atk.knock };
  switch (atk.kind) {
    case 'area':
      ar = spawnArea(s, { ...base, shape: atk.shape!, x: a.x + Math.cos(dir) * (atk.offset ?? 0), y: a.y + Math.sin(dir) * (atk.offset ?? 0), dir, r: atk.r ?? 0, angle: atk.angle ?? 0, len: atk.len ?? 0, width: atk.width ?? 0, src, melee: true });
      break;
    case 'explode':
      ar = spawnArea(s, { ...base, shape: 'circle', x: a.x, y: a.y, r: atk.r!, src, hitAll: true, follow: a.id, fx: 'explosion' });
      break;
    case 'zone':
      ar = spawnArea(s, { ...base, cancelOnOwner: false, shape: 'circle', x: tx, y: ty, r: atk.r!, dur: atk.dur!, tick: atk.tick!, src, tag: 'pool', fx: 'burst' });
      break;
    case 'shot': case 'hook':
      ar = spawnArea(s, { ...base, shape: 'rect', x: a.x, y: a.y, dir, len: Math.min(atk.range, dist(a.x, a.y, tx, ty) + 1), width: 0.3, src: { ...src, dmg: 0 }, tag: 'aim', silent: true, follow: a.id });
      break;
    case 'lunge':
      ar = spawnArea(s, { ...base, shape: 'rect', x: a.x, y: a.y, dir, len: atk.len!, width: atk.width!, src: { ...src, dmg: 0 }, tag: 'aim', silent: true });
      break;
    case 'ward': a.anim = 'cast'; break;
  }
  if (ar) ai.areaId = ar.id;
  s.emit({ type: 'sfx', x: a.x, y: a.y, s: atk.heavy ? 'telegraph_heavy' : 'telegraph', a: atk.windup });
}
function execute(s: Session, a: Actor, atk: AttackDef): void {
  const ai = a.ai!, p = s.player;
  a.anim = 'attack'; a.animT = 0; a.animDur = 0.3;
  ai.cds[ai.atk] = atk.cd;
  ai.state = 'recover'; ai.t = atk.recover;
  const rally = hasStatus(a, 'rally') ? 1.25 : 1;
  const src = { id: a.id, name: a.name, team: 1, dmg: a.dmg * atk.mul * rally };
  switch (atk.kind) {
    case 'shot': case 'hook': {
      const d = dist(a.x, a.y, p.x, p.y), lead = atk.kind === 'shot' ? (d / atk.speed!) * 0.45 : 0;
      const tx = p.x + (p.x - p.px) / DT * lead, ty = p.y + (p.y - p.py) / DT * lead;
      const dir = getStatus(a, 'taunt') ? a.facing : angTo(a.x, a.y, tx, ty);
      a.facing = dir;
      spawnProjectile(s, { x: a.x + Math.cos(dir) * a.r, y: a.y + Math.sin(dir) * a.r, vx: Math.cos(dir) * atk.speed!, vy: Math.sin(dir) * atk.speed!, ttl: (atk.range + 4) / atk.speed!,
        src, dtype: atk.dtype, kind: atk.kind === 'hook' ? 'hook' : atk.dtype === 'blight' ? 'bolt' : 'enemy_arrow', special: atk.kind === 'hook' ? 'hook' : undefined, r: atk.kind === 'hook' ? 0.5 : 0.3 });
      s.emit({ type: 'sfx', x: a.x, y: a.y, s: 'enemy_shot' });
      break;
    }
    case 'lunge': ai.state = 'execute'; ai.lungeT = 0.26; ai.t = 0; break;
    case 'explode': {
      const ar = s.zone.areas.find((x) => x.id === ai.areaId);
      if (ar) { ar.cancelOnOwner = false; ar.follow = undefined; ar.delay = ar.t; ar.x = a.x; ar.y = a.y; }
      a.noXp = true;
      killActor(s, a, { id: a.id, name: a.name, team: 1 });
      break;
    }
    case 'ward': {
      const pos = nearestFree(s.zone, a.x + Math.cos(a.facing) * 1.5, a.y + Math.sin(a.facing) * 1.5) ?? { x: a.x, y: a.y };
      const w = spawnEnemy(s, 'ward', pos.x, pos.y, a.lvl, { pack: a.pack, owner: a.id });
      ai.wardId = w.id;
      s.emit({ type: 'fx', x: pos.x, y: pos.y, s: 'ward', a: 7 });
      break;
    }
    default: break;
  }
}
function modsTick(s: Session, a: Actor, moving: boolean, d: number): void {
  const ai = a.ai!, p = s.player;
  a.mods.forEach((m, i) => {
    ai.modT[i] -= DT;
    if (ai.modT[i] > 0) return;
    const src = { id: a.id, name: a.name, team: 1, dmg: a.dmg };
    switch (m) {
      case 'ember_wake': ai.modT[i] = 0.5; if (moving) spawnArea(s, { shape: 'circle', x: a.x, y: a.y, r: 1.3, delay: 0.5, dur: 3.2, tick: 0.5, src: { ...src, dmg: a.dmg * 0.3 }, dtype: 'ember', tag: 'fire', silent: true }); break;
      case 'mirror_shell': ai.modT[i] = 9; addStatus(s, a, 'shell', 3, 0.25, a.id); s.emit({ type: 'toast', x: a.x, y: a.y, text: 'Mirror Shell', id: a.id }); break;
      case 'rallying': ai.modT[i] = 1; for (const o of s.zone.actors) if (o.kind === 'enemy' && !o.dead && o !== a && dist(a.x, a.y, o.x, o.y) < 8) addStatus(s, o, 'rally', 1.5, 0.25, a.id); break;
      case 'frost_pulse': ai.modT[i] = 6.5; if (d < 12) spawnArea(s, { shape: 'circle', x: a.x, y: a.y, r: 5, delay: 1.15, follow: a.id, cancelOnOwner: true, src: { ...src, dmg: a.dmg * 1.1 }, dtype: 'frost', status: { id: 'chill', t: 3, power: 0.4 }, fx: 'frost', heavy: true }); break;
      case 'burrowing':
        ai.modT[i] = 10;
        if (ai.state === 'approach' && d > 3.5 && d < 14 && !hasStatus(a, 'root')) {
          ai.aimX = p.x; ai.aimY = p.y; a.untargetable = true; a.anim = 'burrow'; ai.state = 'recover'; ai.t = 1.35;
          spawnArea(s, { shape: 'circle', x: p.x, y: p.y, r: 2.5, delay: 1.3, src: { ...src, dmg: a.dmg * 1.3 }, dtype: 'physical', heavy: true, knock: 4, fx: 'burst' });
          s.emit({ type: 'fx', x: a.x, y: a.y, s: 'burrow', a: 1.2 });
        } else ai.modT[i] = 1;
        break;
      case 'vampiric_bond': ai.modT[i] = 1; if (s.zone.actors.some((o) => o !== a && !o.dead && o.kind === 'enemy' && o.pack === a.pack) && a.hp < a.maxHp) { a.hp = Math.min(a.maxHp, a.hp + a.maxHp * 0.03); s.emit({ type: 'fx', x: a.x, y: a.y, s: 'bond', a: 1 }); } break;
    }
  });
}
/** Per-agent behaviour: Dormant → Investigate → Approach/Reposition/Flee → Telegraph → Execute → Recover. */
export function aiTick(s: Session, a: Actor): void {
  if (a.boss) { bossTick(s, a); return; }
  const ai = a.ai!, def = ENEMY[a.def], z = s.zone, p = s.player;
  if (hasStatus(a, 'stun')) {
    a.anim = 'stun';
    if (ai.state === 'telegraph' || ai.state === 'execute') { ai.state = 'recover'; ai.t = 0.3; }
    return;
  }
  for (let i = 0; i < ai.cds.length; i++) if (ai.cds[i] > 0) ai.cds[i] -= DT;
  const taunt = getStatus(a, 'taunt');
  const tgt = (taunt && s.actor(taunt.src)) || p;
  const cloaked = tgt === p && hasStatus(p, 'cloak');
  const d = dist(a.x, a.y, tgt.x, tgt.y);
  const chill = getStatus(a, 'chill');
  const speed = hasStatus(a, 'root') ? 0 : a.speed * (1 - (chill?.power ?? 0)) * (hasStatus(a, 'rally') ? 1.25 : 1);
  if (ai.state === 'dormant') {
    a.anim = 'idle';
    ai.think -= DT;
    if (ai.think <= 0) {
      ai.think = 0.25;
      if (!p.dead && !cloaked && d < def.sight && (d < 4 || los(z, a.x, a.y, p.x, p.y))) { alertPack(s, a); s.emit({ type: 'sfx', x: a.x, y: a.y, s: 'aggro_' + a.def }); }
    }
    return;
  }
  if (a.mods.length) modsTick(s, a, ai.state === 'approach', d);
  const sees = !cloaked && !p.dead && d < def.sight * 1.7 && los(z, a.x, a.y, tgt.x, tgt.y);
  switch (ai.state) {
    case 'investigate': {
      if (sees) { ai.state = 'approach'; break; }
      const dd = dist(a.x, a.y, ai.lastX, ai.lastY);
      if (dd > 0.8) steer(s, a, ai.lastX, ai.lastY, speed * 0.8);
      else {
        a.anim = 'idle'; ai.t += DT;
        if (ai.t > 2.5) {
          if (dist(a.x, a.y, ai.homeX, ai.homeY) < 1.2) ai.state = 'dormant';
          else { ai.lastX = ai.homeX; ai.lastY = ai.homeY; ai.t = 0; }
        }
      }
      break;
    }
    case 'approach': case 'reposition': case 'flee': {
      if (!sees) {
        if (cloaked || p.dead || d > def.sight * 1.7) { ai.state = 'investigate'; ai.t = 0; break; }
        steer(s, a, tgt.x, tgt.y, speed); // lost sight: chase last known position through pathing
        ai.lastX = tgt.x; ai.lastY = tgt.y;
        break;
      }
      ai.lastX = tgt.x; ai.lastY = tgt.y;
      if (ai.state === 'reposition' && def.retreat) {
        ai.t -= DT;
        const away = angTo(tgt.x, tgt.y, a.x, a.y) + ai.strafe * 0.9;
        moveCircle(z, a, Math.cos(away) * speed * DT, Math.sin(away) * speed * DT, Math.min(0.7, a.r * 0.8));
        a.facing = turnToward(a.facing, away, 10 * DT); a.anim = 'walk';
        if (ai.t <= 0) ai.state = 'approach';
        break;
      }
      // Choose an attack that is ready and in range. Heavy attacks need a group token.
      let chosen = -1;
      for (let i = 0; i < def.attacks.length; i++) {
        const k = def.attacks[i];
        if (ai.cds[i] > 0 || d > k.range + tgt.r || d < (k.minRange ?? 0)) continue;
        if (k.kind === 'ward' && (hasStatus(a, 'taunt') || (ai.wardId && s.actor(ai.wardId) && !s.actor(ai.wardId)!.dead))) continue;
        if (k.heavy && heavyCount(s) >= MAX_HEAVY) continue;
        if (!k.heavy && !def.keepRange && !def.flank && ai.slot < 0 && k.kind === 'area') continue;
        chosen = i; break;
      }
      if (chosen >= 0) { startAttack(s, a, def.attacks[chosen], chosen, tgt.x, tgt.y); break; }
      if (def.keepRange) {
        const kr = def.keepRange;
        if (d < kr * 0.55) {
          ai.state = 'flee';
          let moved = false;
          for (const off of [0, 0.7, -0.7, 1.4, -1.4]) {
            const away = angTo(tgt.x, tgt.y, a.x, a.y) + off;
            if (circleFree(z, a.x + Math.cos(away) * 1.2, a.y + Math.sin(away) * 1.2, a.r)) {
              moveCircle(z, a, Math.cos(away) * speed * DT, Math.sin(away) * speed * DT, Math.min(0.7, a.r * 0.8));
              a.facing = turnToward(a.facing, away, 10 * DT); a.anim = 'walk'; moved = true; break;
            }
          }
          if (!moved) a.anim = 'idle';
        } else if (d > kr * 1.2) { ai.state = 'approach'; steer(s, a, tgt.x, tgt.y, speed); }
        else {
          ai.state = 'reposition';
          const tang = angTo(tgt.x, tgt.y, a.x, a.y) + ai.strafe * 1.45;
          if (!moveCircle(z, a, Math.cos(tang) * speed * 0.45 * DT, Math.sin(tang) * speed * 0.45 * DT, Math.min(0.7, a.r * 0.8))) a.anim = 'walk'; else ai.strafe *= -1;
          a.facing = turnToward(a.facing, angTo(a.x, a.y, tgt.x, tgt.y), 8 * DT);
        }
      } else if (def.flank) {
        const lungeReady = ai.cds[0] <= 0.4;
        if (lungeReady && d > def.attacks[0].range) steer(s, a, tgt.x, tgt.y, speed);
        else {
          const want = lungeReady ? 4.5 : 6.5;
          const tang = angTo(tgt.x, tgt.y, a.x, a.y) + ai.strafe * (d > want + 0.5 ? 2.0 : d < want - 0.5 ? 0.9 : 1.55); // offset from the outward radial: <π/2 backs off, >π/2 closes in
          if (moveCircle(z, a, Math.cos(tang) * speed * 0.8 * DT, Math.sin(tang) * speed * 0.8 * DT, Math.min(0.7, a.r * 0.8))) ai.strafe *= -1;
          a.facing = turnToward(a.facing, tang, 10 * DT); a.anim = 'walk';
        }
      } else {
        const reach = def.attacks[0]?.range ?? 1.5;
        if (ai.slot >= 0) {
          const sa = ai.slot * TAU / 8, sd = tgt.r + a.r + Math.min(0.5, reach * 0.3);
          const sx = tgt.x + Math.cos(sa) * sd, sy = tgt.y + Math.sin(sa) * sd;
          if (d > reach * 0.85 + tgt.r || !def.turn) { if (dist(a.x, a.y, sx, sy) > 0.35) steer(s, a, d > 4 ? tgt.x : sx, d > 4 ? tgt.y : sy, speed); else a.anim = 'idle'; }
          else a.anim = 'idle';
        } else {
          const tang = angTo(tgt.x, tgt.y, a.x, a.y) + ai.strafe * (d > 5 ? 2.0 : d < 3.6 ? 0.9 : 1.55);
          if (moveCircle(z, a, Math.cos(tang) * speed * 0.6 * DT, Math.sin(tang) * speed * 0.6 * DT, Math.min(0.7, a.r * 0.8))) ai.strafe *= -1;
          a.anim = 'walk';
        }
        const face = angTo(a.x, a.y, tgt.x, tgt.y);
        if (def.turn) a.facing = turnToward(a.facing, face, def.turn * DT);
        else if (a.anim === 'idle') a.facing = turnToward(a.facing, face, 8 * DT);
      }
      break;
    }
    case 'telegraph': {
      const atk = def.attacks[ai.atk];
      ai.t -= DT; a.animT += DT;
      if (atk.kind === 'shot' || atk.kind === 'hook') {
        const ar = z.areas.find((x) => x.id === ai.areaId);
        const dir = angTo(a.x, a.y, tgt.x, tgt.y);
        a.facing = turnToward(a.facing, dir, 6 * DT);
        if (ar) { ar.dir = a.facing; ar.len = Math.min(atk.range, d + 1); }
      }
      if (ai.t <= 0) execute(s, a, atk);
      break;
    }
    case 'execute': {
      const atk = def.attacks[ai.atk];
      ai.lungeT -= DT;
      const sp = atk.len! / 0.26;
      const blocked = moveCircle(z, a, Math.cos(a.facing) * sp * DT, Math.sin(a.facing) * sp * DT, Math.min(0.7, a.r * 0.8));
      if (ai.t === 0 && dist(a.x, a.y, p.x, p.y) < a.r + p.r + 0.45) {
        ai.t = 1;
        damagePlayer(s, a.dmg * atk.mul, atk.dtype, { id: a.id, name: a.name, team: 1 }, { melee: true });
      }
      if (ai.lungeT <= 0 || blocked) { ai.state = 'recover'; ai.t = atk.recover; }
      break;
    }
    case 'recover':
      ai.t -= DT;
      if (a.anim !== 'burrow') { a.animT += DT; if (a.animT > a.animDur) a.anim = 'idle'; }
      if (ai.t <= 0) {
        if (a.untargetable) { const pos = nearestFree(z, ai.aimX, ai.aimY, a.r) ?? { x: a.x, y: a.y }; a.x = a.px = pos.x; a.y = a.py = pos.y; a.untargetable = false; a.anim = 'idle'; s.emit({ type: 'fx', x: a.x, y: a.y, s: 'burrow', a: 1.5 }); }
        if (def.retreat && ai.atk >= 0 && def.attacks[ai.atk].kind === 'lunge') { ai.state = 'reposition'; ai.t = 1.1; ai.atk = -1; }
        else ai.state = 'approach';
      }
      break;
    default: break;
  }
}
/** Soft separation so packs spread instead of stacking; heavy actors and the player act as anchors. */
export function separate(s: Session): void {
  const act = s.zone.actors.filter((a) => !a.dead && !a.untargetable && (a.kind === 'enemy' || a.kind === 'conduit' || a.kind === 'dummy' || a.kind === 'prop') && (!a.ai || a.ai.state !== 'dormant' || a.kind !== 'enemy'));
  const p = s.player;
  for (let i = 0; i < act.length; i++) {
    const a = act[i];
    if (a.kind !== 'enemy' || a.speed <= 0) continue;
    if (a.ai!.state === 'execute') continue;
    for (let j = 0; j < act.length; j++) {
      if (i === j) continue;
      const b = act[j];
      const min = (a.r + b.r) * 0.92, dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
      if (d2 >= min * min || d2 < 1e-6) continue;
      const d = Math.sqrt(d2), push = (min - d) * (b.kind !== 'enemy' || b.speed <= 0 || (b.heavy && !a.heavy) ? 1 : 0.5);
      moveCircle(s.zone, a, (dx / d) * push, (dy / d) * push, Math.min(0.7, a.r * 0.8));
    }
    if (!p.dead && !s.pc.dash) {
      const min = (a.r + p.r) * 0.95, dx = a.x - p.x, dy = a.y - p.y, d2 = dx * dx + dy * dy;
      if (d2 < min * min && d2 > 1e-6) { const d = Math.sqrt(d2); moveCircle(s.zone, a, (dx / d) * (min - d), (dy / d) * (min - d), Math.min(0.7, a.r * 0.8)); }
    }
  }
}
