// server-match: authoritative weapons, items, projectiles and damage. The server owns cadence, ammo,
// recoil, the bloom seed, hit zones, falloff, shields and death.
import {
  AEGIS_MAX, BEACON_RADIUS, GRAPPLE_RANGE, HEALTH_MAX, ITEMS, MIST_RADIUS, ORB_DAMAGE, ORB_IMPULSE, ORB_RADIUS, RESERVE_MAX,
  type ItemId,
} from "../../shared/content/items";
import { aimDir, aimPivot } from "../../shared/aim";
import { LAG_COMP_MAX, MELEE_COOLDOWN, MELEE_DAMAGE, MELEE_RANGE, MOVE } from "../../shared/content/rules";
import { WEAPONS, falloffMult, recoilKick, weaponStats, type WeaponStats } from "../../shared/content/weapons";
import { DEG, Rng, clamp, hashInt } from "../../shared/math";
import { Btn, DT, Mode } from "../../shared/protocol/protocol";
import { HIST, type Actor } from "./actor";
import type { Match } from "./match";

export interface Projectile {
  id: number;
  kind: "rail" | "orb" | "mist" | "gale";
  owner: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  gravity: number;
  born: number;
  damage: number;
  head: number;
  radius: number;
  impulse: number;
}

export type Zone = "head" | "torso" | "limb";

/** Ray (normalised) against a vertical capsule; returns entry distance or Infinity. */
export function rayCapsule(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, cx: number, y0: number, y1: number, cz: number, r: number, maxT: number): number {
  const sy = y1 - y0;
  const wx = ox - cx,
    wy = oy - y0,
    wz = oz - cz;
  const b = dy * sy;
  const c = sy * sy;
  const d = dx * wx + dy * wy + dz * wz;
  const e = sy * wy;
  const denom = c - b * b;
  // closest approach of the infinite lines, then clamp to the segment and the ray
  let t = denom > 1e-6 ? (b * e - c * d) / denom : -d;
  if (t < 0) t = 0;
  const s = c > 1e-9 ? clamp((e + b * t) / c, 0, 1) : 0;
  t = -(dx * wx + dy * (wy - s * sy) + dz * wz);
  if (t < 0) t = 0;
  if (t > maxT + r) return Infinity;
  const px = ox + dx * t - cx,
    py = oy + dy * t - (y0 + s * sy),
    pz = oz + dz * t - cz;
  const dist2 = px * px + py * py + pz * pz;
  if (dist2 > r * r) return Infinity;
  const entry = Math.max(0, t - Math.sqrt(r * r - dist2));
  return entry <= maxT ? entry : Infinity;
}

const hitOut = { t: Infinity, zone: "torso" as Zone };

/** Ray against one actor's hit zones at an explicit position (for lag-compensated tests). */
export function rayActorAt(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, x: number, y: number, z: number, crouch: boolean, maxT: number): number {
  hitOut.t = Infinity;
  // broad phase
  const bx = x - ox,
    by = y + 0.9 - oy,
    bz = z - oz;
  const proj = bx * dx + by * dy + bz * dz;
  if (proj < -1.5 || proj > maxT + 1.5) return Infinity;
  const perp2 = bx * bx + by * by + bz * bz - proj * proj;
  if (perp2 > 1.7 * 1.7) return Infinity;
  const top = crouch ? MOVE.crouchHeight : MOVE.height;
  const headY = y + top - 0.21;
  const th = rayCapsule(ox, oy, oz, dx, dy, dz, x, headY - 0.02, headY + 0.02, z, 0.215, maxT);
  const tt = rayCapsule(ox, oy, oz, dx, dy, dz, x, y + top * 0.47, y + top * 0.76, z, 0.3, maxT);
  const tl = rayCapsule(ox, oy, oz, dx, dy, dz, x, y + 0.14, y + top * 0.44, z, 0.26, maxT);
  let best = Infinity;
  if (tt < best) {
    best = tt;
    hitOut.zone = "torso";
  }
  if (tl < best) {
    best = tl;
    hitOut.zone = "limb";
  }
  if (th < best + 0.25 && th !== Infinity) {
    best = Math.min(best, th);
    hitOut.zone = "head";
  }
  hitOut.t = best;
  return best;
}

const tmpP = { x: 0, y: 0, z: 0 };
const tmpD = { x: 0, y: 0, z: 0 };
const rewind = { x: 0, y: 0, z: 0, crouch: false };

/** Rewinds an actor to the shooter's view time (clamped) using the per-tick history ring. */
function rewound(m: Match, t: Actor, viewTime: number): void {
  rewind.x = t.x;
  rewind.y = t.y;
  rewind.z = t.z;
  rewind.crouch = t.crouch || t.mode === Mode.Slide;
  const back = clamp(m.time - viewTime, 0, LAG_COMP_MAX);
  // hist[head] was recorded at the end of the previous tick, i.e. one DT before m.time
  const ticks = back / DT - 1;
  if (ticks <= 0 || m.tick < HIST + 2) return;
  const i0 = Math.min(HIST - 2, Math.floor(ticks));
  const f = Math.min(1, ticks - i0);
  const h = t.hist;
  const a = (((m.histHead - i0) % HIST) + HIST) % HIST;
  const b = (((m.histHead - i0 - 1) % HIST) + HIST) % HIST;
  const dxh = h[b * 4]! - h[a * 4]!;
  const dzh = h[b * 4 + 2]! - h[a * 4 + 2]!;
  // never interpolate across a teleport (boarding, respawn)
  if (dxh * dxh + dzh * dzh > 9 || Math.abs(h[a * 4]! - t.x) + Math.abs(h[a * 4 + 2]! - t.z) > 12) return;
  rewind.x = h[a * 4]! + dxh * f;
  rewind.y = h[a * 4 + 1]! + (h[b * 4 + 1]! - h[a * 4 + 1]!) * f;
  rewind.z = h[a * 4 + 2]! + dzh * f;
  rewind.crouch = h[a * 4 + 3]! > 0.5;
}

interface CastResult {
  t: number;
  actor: Actor | null;
  zone: Zone;
  caravan: boolean;
}
const cast: CastResult = { t: Infinity, actor: null, zone: "torso", caravan: false };

function castAll(m: Match, shooter: Actor, ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, maxT: number, viewTime: number): CastResult {
  let best = m.world.raycast(ox, oy, oz, dx, dy, dz, maxT);
  cast.actor = null;
  cast.caravan = false;
  for (const t of m.actors) {
    if (t === shooter || !t.alive || t.mode === Mode.Skiff || t.mode === Mode.Dead) continue;
    const ddx = t.x - ox,
      ddz = t.z - oz;
    if (ddx * ddx + ddz * ddz > (maxT + 3) * (maxT + 3)) continue;
    rewound(m, t, viewTime);
    const th = rayActorAt(ox, oy, oz, dx, dy, dz, rewind.x, rewind.y, rewind.z, rewind.crouch, Math.min(best, maxT));
    if (th < best) {
      best = th;
      cast.actor = t;
      cast.zone = hitOut.zone;
    }
  }
  const cv = m.caravan;
  if (cv && cv.alive) {
    const tc = rayCapsule(ox, oy, oz, dx, dy, dz, cv.x, cv.y - 0.3, cv.y + 0.3, cv.z, 1.7, Math.min(best, maxT));
    if (tc < best) {
      best = tc;
      cast.actor = null;
      cast.caravan = true;
    }
  }
  cast.t = best;
  return cast;
}

export function currentSpread(a: Actor, st: WeaponStats): number {
  const ads = (a.input.buttons & Btn.Ads) !== 0 && a.mode !== Mode.Zip;
  let s = ads ? st.spreadAds : st.spreadHip;
  const speed = Math.hypot(a.vx, a.vz);
  if (a.crouch) s *= 0.8;
  if (a.mode === Mode.Air || a.mode === Mode.Zip) s = s * 1.8 + 1.2;
  else if (a.mode === Mode.Slide) s = s * 1.5 + 0.6;
  else s += Math.min(1, speed / MOVE.sprint) * (ads ? 0.35 : 1.0) * (st.def.cls === "dmr" || st.def.cls === "rail" ? 2.2 : 1);
  return s + a.bloom * (ads ? 0.45 : 1);
}

function muzzle(a: Actor, out: { x: number; y: number; z: number }): void {
  const sh = a.input.shoulder >= 0 ? 1 : -1;
  out.x = a.x + Math.sin(a.yaw) * 0.45 + Math.cos(a.yaw) * 0.28 * sh;
  out.y = a.y + (a.crouch ? 0.92 : 1.36);
  out.z = a.z + Math.cos(a.yaw) * 0.45 - Math.sin(a.yaw) * 0.28 * sh;
}

function shotDirection(m: Match, a: Actor, st: WeaponStats, pellet: number, patternSeed: number): void {
  // aim + accumulated recoil, then seeded bloom inside the current cone
  aimDir(a.yaw + a.recoilY * DEG, clamp(a.pitch + a.recoilP * DEG, -1.5, 1.5), tmpD);
  const spread = currentSpread(a, st) * DEG;
  const rng = new Rng(hashInt(m.cfg.seed, a.id * 7919 + pellet * 131, patternSeed));
  const ang = rng.next() * Math.PI * 2;
  // pellets fill the cone evenly; single shots cluster toward the centre
  const rad = (st.pellets > 1 ? Math.sqrt((pellet + rng.next()) / st.pellets) : Math.sqrt(rng.next()) * rng.next() * 1.6) * spread;
  // build an orthonormal basis around the aim direction
  const fx = tmpD.x,
    fy = tmpD.y,
    fz = tmpD.z;
  let rx = fz,
    rz = -fx;
  const rl = Math.hypot(rx, rz) || 1;
  rx /= rl;
  rz /= rl;
  const ux = fy * rz,
    uy = fz * rx - fx * rz,
    uz = -fy * rx;
  const ca = Math.cos(ang) * Math.tan(rad),
    sa = Math.sin(ang) * Math.tan(rad);
  let dx = fx + rx * ca + ux * sa,
    dy = fy + uy * sa,
    dz = fz + rz * ca + uz * sa;
  const dl = Math.hypot(dx, dy, dz);
  tmpD.x = dx / dl;
  tmpD.y = dy / dl;
  tmpD.z = dz / dl;
}

const mz = { x: 0, y: 0, z: 0 };

function fireWeapon(m: Match, a: Actor, st: WeaponStats): void {
  const def = st.def;
  const slot = a.slots[a.selected]!;
  if (slot.kind !== "weapon") return;
  slot.mag--;
  a.shotCounter++;
  a.stats.shots++;
  if (m.time - a.lastShot > 0.4) a.burst = 0;
  a.lastShot = m.time;
  const sh = a.input.shoulder >= 0 ? 1 : -1;
  muzzle(a, mz);
  m.noise(a, st.audible);

  if (def.projectile) {
    shotDirection(m, a, st, 0, a.shotCounter);
    aimPivot(a, sh, tmpP);
    // converge the bolt on what the crosshair sees
    const hit = castAll(m, a, tmpP.x, tmpP.y, tmpP.z, tmpD.x, tmpD.y, tmpD.z, 300, a.input.viewTime);
    const range = hit.t === Infinity ? 300 : Math.max(6, hit.t);
    const tx = tmpP.x + tmpD.x * range,
      ty = tmpP.y + tmpD.y * range,
      tz = tmpP.z + tmpD.z * range;
    let dx = tx - mz.x,
      dy = ty - mz.y,
      dz = tz - mz.z;
    const dl = Math.hypot(dx, dy, dz);
    dx /= dl;
    dy /= dl;
    dz /= dl;
    const isRail = def.id === "longwake";
    m.projectiles.push({
      id: m.nextId++, kind: isRail ? "rail" : "gale", owner: a.id, x: mz.x, y: mz.y, z: mz.z,
      vx: dx * st.projSpeed, vy: dy * st.projSpeed + (isRail ? 0 : 2.5), vz: dz * st.projSpeed,
      gravity: def.projectile.gravity, born: m.time, damage: st.damage, head: def.head, radius: st.radius, impulse: def.projectile.impulse,
    });
    m.emit({ t: "shot", actor: a.id, weapon: def.id, ox: mz.x, oy: mz.y, oz: mz.z, tx: mz.x + dx * 3, ty: mz.y + dy * 3, tz: mz.z + dz * 3, hit: 0 });
  } else {
    let total = 0;
    let headHits = 0;
    let victim: Actor | null = null;
    let zoneBest: Zone = "limb";
    let dist = 0;
    for (let p = 0; p < st.pellets; p++) {
      shotDirection(m, a, st, p, a.shotCounter);
      aimPivot(a, sh, tmpP);
      // 1) camera ray from the aim pivot finds the target point
      const c1 = castAll(m, a, tmpP.x, tmpP.y, tmpP.z, tmpD.x, tmpD.y, tmpD.z, def.range, a.input.viewTime);
      const range = c1.t === Infinity ? def.range : c1.t;
      const tx = tmpP.x + tmpD.x * range,
        ty = tmpP.y + tmpD.y * range,
        tz = tmpP.z + tmpD.z * range;
      // 2) muzzle-to-target obstruction check prevents shooting around corners
      let dx = tx - mz.x,
        dy = ty - mz.y,
        dz = tz - mz.z;
      const len = Math.hypot(dx, dy, dz);
      dx /= len;
      dy /= len;
      dz /= len;
      const c2 = castAll(m, a, mz.x, mz.y, mz.z, dx, dy, dz, len + 0.4, a.input.viewTime);
      const tEnd = c2.t === Infinity ? len : c2.t;
      const ex = mz.x + dx * tEnd,
        ey = mz.y + dy * tEnd,
        ez = mz.z + dz * tEnd;
      let hitKind: 0 | 1 | 2 = c2.t === Infinity ? 0 : 1;
      if (c2.actor) {
        hitKind = 2;
        const zm = c2.zone === "head" ? def.head : c2.zone === "limb" ? def.limb : 1;
        const dmg = st.damage * falloffMult(def, st, tEnd) * zm;
        if (st.pellets > 1) {
          if (!victim || victim === c2.actor) {
            victim = c2.actor;
            total += dmg;
            if (c2.zone === "head") headHits++;
            if (c2.zone === "head" || (c2.zone === "torso" && zoneBest !== "head")) zoneBest = c2.zone;
            dist = tEnd;
          }
        } else {
          m.damage(c2.actor, dmg, a.id, def.id, c2.zone, false, tEnd);
        }
      } else if (c2.caravan) {
        hitKind = 2;
        m.damageCaravan(a, st.damage * falloffMult(def, st, tEnd));
      }
      if (st.pellets === 1 || p % 2 === 0) m.emit({ t: "shot", actor: a.id, weapon: def.id, ox: mz.x, oy: mz.y, oz: mz.z, tx: ex, ty: ey, tz: ez, hit: hitKind });
    }
    if (victim && total > 0) {
      // one seeded pattern per shot; aggregate clamped to reduce extreme RNG
      const capMax = def.maxAggregate * (st.damage / def.damage) * (st.pellets / def.pellets) * (headHits > st.pellets / 2 ? def.head : 1);
      total = clamp(total, def.minAggregate, capMax);
      m.damage(victim, total, a.id, def.id, zoneBest, false, dist);
    }
  }
  // recoil + bloom
  const [kv, kh] = recoilKick(st, a.burst);
  const ads = (a.input.buttons & Btn.Ads) !== 0;
  const k = (ads ? 0.75 : 1) * (a.crouch ? 0.85 : 1);
  a.recoilP += kv * k;
  a.recoilY += kh * k;
  a.bloom = Math.min(def.bloomMax, a.bloom + def.bloomPerShot);
  a.burst++;
}

function startReload(m: Match, a: Actor): void {
  const slot = a.slots[a.selected];
  if (!slot || slot.kind !== "weapon" || a.reloadEnd >= 0) return;
  const st = weaponStats(slot.weapon, slot.rarity);
  if (slot.mag >= st.mag || a.ammo[st.def.ammo] <= 0) return;
  a.reloadStart = m.time;
  a.reloadEnd = m.time + st.reload;
  a.chargeEnd = -1;
  m.emit({ t: "sound", kind: "reload", x: a.x, y: a.y + 1.2, z: a.z, actor: a.id });
}

function cancelUse(a: Actor): void {
  a.useItem = null;
  a.useEnd = -1;
  a.useStart = -1;
}

function removeOne(a: Actor, slotIdx: number): void {
  const s = a.slots[slotIdx];
  if (!s || s.kind !== "item") return;
  s.count--;
  if (s.count <= 0) a.slots[slotIdx] = null;
}

function throwItem(m: Match, a: Actor, kind: "orb" | "mist"): void {
  const sh = a.input.shoulder >= 0 ? 1 : -1;
  aimDir(a.yaw, clamp(a.pitch + 0.16, -1.4, 1.4), tmpD);
  muzzle(a, mz);
  const speed = 24;
  m.projectiles.push({
    id: m.nextId++, kind, owner: a.id, x: mz.x + Math.cos(a.yaw) * 0.1 * sh, y: mz.y + 0.25, z: mz.z,
    vx: tmpD.x * speed + a.vx * 0.5, vy: tmpD.y * speed + 2, vz: tmpD.z * speed + a.vz * 0.5,
    gravity: 18, born: m.time, damage: ORB_DAMAGE, head: 1, radius: kind === "orb" ? ORB_RADIUS : MIST_RADIUS, impulse: ORB_IMPULSE,
  });
  m.emit({ t: "sound", kind: "throw", x: a.x, y: a.y + 1.4, z: a.z, actor: a.id });
}

function useItem(m: Match, a: Actor, id: ItemId, pressed: boolean): void {
  const def = ITEMS[id];
  const now = m.time;
  if (a.useItem) return;
  if (!pressed) return;
  if (a.mode === Mode.Mantle || a.mode === Mode.Glide || a.mode === Mode.Freefall || a.mode === Mode.Skiff || a.mode === Mode.Grapple) return;
  switch (id) {
    case "injector":
    case "trauma":
      if (a.health >= HEALTH_MAX) {
        m.toast(a, "Health is already full", "info");
        return;
      }
      a.useItem = id;
      a.useStart = now;
      a.useEnd = now + def.useTime;
      a.useHealRate = id === "injector" ? 35 / def.useTime : (HEALTH_MAX - a.health) / def.useTime;
      removeOne(a, a.selected);
      m.emit({ t: "sound", kind: "heal", x: a.x, y: a.y + 1.2, z: a.z, actor: a.id });
      return;
    case "flask":
      if (a.reserve >= RESERVE_MAX) {
        m.toast(a, "Reserve Shield is full", "info");
        return;
      }
      a.useItem = id;
      a.useStart = now;
      a.useEnd = now + def.useTime;
      m.emit({ t: "sound", kind: "shieldUse", x: a.x, y: a.y + 1.2, z: a.z, actor: a.id });
      return;
    case "cell":
      if (a.aegis >= AEGIS_MAX) {
        m.toast(a, "Aegis is already full", "info");
        return;
      }
      a.useItem = id;
      a.useStart = now;
      a.useEnd = now + def.useTime;
      m.emit({ t: "sound", kind: "shieldUse", x: a.x, y: a.y + 1.2, z: a.z, actor: a.id });
      return;
    case "beacon":
      a.useItem = id;
      a.useStart = now;
      a.useEnd = now + def.useTime;
      return;
    case "orb":
    case "mist":
      if (now < a.nextThrow) return;
      a.nextThrow = now + 0.7;
      throwItem(m, a, id);
      removeOne(a, a.selected);
      return;
    case "grapple": {
      if (now < a.nextThrow || a.mode === Mode.Swim || a.mode === Mode.Zip || a.mode === Mode.Ascend) return;
      const sh = a.input.shoulder >= 0 ? 1 : -1;
      aimPivot(a, sh, tmpP);
      aimDir(a.yaw, a.pitch, tmpD);
      const t = m.world.raycast(tmpP.x, tmpP.y, tmpP.z, tmpD.x, tmpD.y, tmpD.z, GRAPPLE_RANGE);
      if (t === Infinity || t < 3) {
        m.toast(a, t < 3 ? "Too close to grapple" : "No anchor within 45 m", "warn");
        a.nextThrow = now + 0.3;
        return;
      }
      a.nextThrow = now + 0.8;
      a.grx = tmpP.x + tmpD.x * (t - 0.5);
      a.gry = tmpP.y + tmpD.y * (t - 0.5) + 0.4;
      a.grz = tmpP.z + tmpD.z * (t - 0.5);
      a.grappleEnd = now + 2.6;
      a.mode = Mode.Grapple;
      a.crouch = false;
      removeOne(a, a.selected);
      m.emit({ t: "launch", actor: a.id, kind: "grapple" });
      return;
    }
  }
}

function finishUse(m: Match, a: Actor): void {
  const id = a.useItem!;
  switch (id) {
    case "flask":
      a.reserve = Math.min(RESERVE_MAX, a.reserve + 25);
      break;
    case "cell":
      a.lastDamage = -100; // Aegis recharge begins immediately
      break;
    case "beacon": {
      const pts: { x: number; y: number; z: number; age: number; yaw: number }[] = [];
      for (const o of m.actors) {
        if (o === a || !o.alive || o.dummy) continue;
        for (const tr of o.trail) {
          const age = m.time - tr.t;
          // recent trails only, never the live position
          if (age < 1.2 || age > 12) continue;
          if (Math.hypot(tr.x - a.x, tr.z - a.z) > BEACON_RADIUS) continue;
          pts.push({ x: tr.x, y: tr.y, z: tr.z, age, yaw: tr.yaw });
        }
      }
      m.emitTo(a, { t: "echo", points: pts });
      m.emit({ t: "sound", kind: "beacon", x: a.x, y: a.y + 1, z: a.z, actor: a.id });
      break;
    }
    default:
      break;
  }
  if (id === "flask" || id === "cell" || id === "beacon") {
    // consumed on completion: find the stack (it may have moved slots)
    const idx = a.slots.findIndex((s) => s && s.kind === "item" && s.item === id);
    if (idx >= 0) removeOne(a, idx);
  }
  cancelUse(a);
}

/** Per-tick weapon / item logic for one actor. Runs after movement. */
export function stepCombat(m: Match, a: Actor, dt: number): void {
  const inp = a.input;
  const now = m.time;
  const pressed = inp.pressed;
  const held = inp.buttons;

  // recoil recovery and bloom decay
  const rec = Math.exp(-7 * dt);
  if (now - a.lastShot > 0.09) {
    a.recoilP *= rec;
    a.recoilY *= rec;
    a.bloom = Math.max(0, a.bloom - 3.2 * dt);
  }

  // slot selection (server-validated)
  if (inp.slot !== a.lastInputSlot) {
    a.lastInputSlot = inp.slot;
    const s = clamp(inp.slot | 0, 0, a.slots.length - 1);
    if (s !== a.selected) m.selectSlot(a, s);
  }

  // channelled items
  if (a.useItem) {
    if (a.useItem === "injector" || a.useItem === "trauma") a.health = Math.min(HEALTH_MAX, a.health + a.useHealRate * dt);
    if (now >= a.useEnd) finishUse(m, a);
    else if (pressed & (Btn.Melee | Btn.Reload)) cancelUse(a);
  }

  const busyMode = a.mode === Mode.Mantle || a.mode === Mode.Glide || a.mode === Mode.Freefall || a.mode === Mode.Skiff || a.mode === Mode.Ascend || a.mode === Mode.Grapple || a.mode === Mode.Dead;

  // melee
  if (pressed & Btn.Melee && now >= a.nextMelee && !busyMode && !a.useItem && a.mode !== Mode.Swim) {
    a.nextMelee = now + MELEE_COOLDOWN;
    a.reloadEnd = -1;
    m.emit({ t: "sound", kind: "melee", x: a.x, y: a.y + 1.2, z: a.z, actor: a.id });
    const fx = Math.sin(a.yaw),
      fz = Math.cos(a.yaw);
    for (const t of m.actors) {
      if (t === a || !t.alive) continue;
      const dx = t.x - a.x,
        dz = t.z - a.z;
      const d = Math.hypot(dx, dz);
      if (d > MELEE_RANGE || Math.abs(t.y - a.y) > 1.6) continue;
      if (d > 0.3 && (dx * fx + dz * fz) / d < 0.45) continue;
      m.damage(t, MELEE_DAMAGE, a.id, "melee", "torso", false, d);
      break;
    }
  }

  const slot = a.slots[a.selected];
  if (!slot || busyMode) {
    a.reloadEnd = -1;
    a.chargeEnd = -1;
    return;
  }
  if (slot.kind === "item") {
    a.reloadEnd = -1;
    a.chargeEnd = -1;
    if (now >= a.equipUntil) useItem(m, a, slot.item, (pressed & (Btn.Fire | Btn.Throw)) !== 0);
    return;
  }
  if (a.useItem) return;

  const st = weaponStats(slot.weapon, slot.rarity);
  const def = st.def;
  const swimBlock = a.mode === Mode.Swim && def.cls !== "pistol";

  // reload
  if (a.reloadEnd >= 0 && now >= a.reloadEnd) {
    const have = a.ammo[def.ammo];
    if (def.shellReload) {
      if (have > 0 && slot.mag < st.mag) {
        slot.mag++;
        a.ammo[def.ammo]--;
      }
      if (slot.mag < st.mag && a.ammo[def.ammo] > 0 && !(held & Btn.Fire)) {
        a.reloadStart = now;
        a.reloadEnd = now + st.reload;
        m.emit({ t: "sound", kind: "shell", x: a.x, y: a.y + 1.2, z: a.z, actor: a.id });
      } else a.reloadEnd = -1;
    } else {
      const n = Math.min(st.mag - slot.mag, have);
      slot.mag += n;
      a.ammo[def.ammo] -= n;
      a.reloadEnd = -1;
    }
  }
  if (pressed & Btn.Reload) startReload(m, a);

  if (now < a.equipUntil || swimBlock || a.sprinting) {
    if (a.sprinting && held & Btn.Fire) a.sprinting = false;
    else return;
  }

  // rail charge release
  if (a.chargeEnd >= 0) {
    if (now >= a.chargeEnd) {
      a.chargeEnd = -1;
      if (slot.mag > 0) {
        fireWeapon(m, a, st);
        a.nextFire = now + st.interval;
      }
    }
    return;
  }

  const wantFire = def.auto ? (held & Btn.Fire) !== 0 : (pressed & Btn.Fire) !== 0;
  if (!wantFire) return;
  if (a.reloadEnd >= 0) {
    // shell reloads can be interrupted by firing; magazine reloads cannot
    if (def.shellReload && slot.mag > 0) a.reloadEnd = -1;
    else return;
  }
  if (slot.mag <= 0) {
    if (a.ammo[def.ammo] > 0) startReload(m, a);
    else if (pressed & Btn.Fire) {
      m.emit({ t: "sound", kind: "dry", x: a.x, y: a.y + 1.2, z: a.z, actor: a.id });
      m.toast(a, `Out of ${def.ammo} ammo`, "warn");
    }
    return;
  }
  if (now + 1e-6 < a.nextFire) return;
  if (st.charge > 0) {
    a.chargeStart = now;
    a.chargeEnd = now + st.charge;
    m.emit({ t: "sound", kind: "charge", x: a.x, y: a.y + 1.3, z: a.z, actor: a.id });
    return;
  }
  // cadence is exact on average even though ticks are coarser than the fire interval
  if (a.nextFire < now - DT) a.nextFire = now;
  let guard = 0;
  while (a.nextFire <= now + 1e-6 && slot.mag > 0 && guard++ < 3) {
    fireWeapon(m, a, st);
    a.nextFire += st.interval;
  }
  if (slot.mag <= 0 && a.ammo[def.ammo] > 0) startReload(m, a);
}

export function explode(m: Match, kind: "orb" | "gale", owner: number, x: number, y: number, z: number, radius: number, damage: number, impulse: number): void {
  m.emit({ t: "explode", kind: "orb", x, y, z, r: radius });
  for (const t of m.actors) {
    if (!t.alive || t.mode === Mode.Skiff || t.mode === Mode.Dead) continue;
    const dx = t.x - x,
      dy = t.y + 0.9 - y,
      dz = t.z - z;
    const d = Math.hypot(dx, dy, dz);
    if (d > radius) continue;
    const fall = 1 - (d / radius) * 0.5;
    if (t.id !== owner || kind === "gale") m.damage(t, damage * fall * (t.id === owner ? 0.4 : 1), owner, kind === "orb" ? "Wind Orb" : "gale", "torso", false, d);
    if (!t.alive || t.dummy) continue;
    if (t.mode === Mode.Zip || t.mode === Mode.Ascend || t.mode === Mode.Mantle || t.mode === Mode.Glide || t.mode === Mode.Freefall) {
      if (t.mode !== Mode.Glide && t.mode !== Mode.Freefall) t.mode = Mode.Air;
    } else if (t.mode !== Mode.Swim) t.mode = Mode.Air;
    const hl = Math.hypot(dx, dz) || 1;
    const push = impulse * fall;
    t.vx += (dx / hl) * push * (d < 0.6 ? 0.2 : 1);
    t.vz += (dz / hl) * push * (d < 0.6 ? 0.2 : 1);
    t.vy = Math.max(t.vy, 0) + push * 0.62;
    t.coyote = 0;
    t.crouch = false;
    if (t.id === owner) t.noFall = true;
  }
}

export function stepProjectiles(m: Match, dt: number): void {
  const w = m.world;
  for (let i = m.projectiles.length - 1; i >= 0; i--) {
    const p = m.projectiles[i]!;
    p.vy -= p.gravity * dt;
    const dx = p.vx * dt,
      dy = p.vy * dt,
      dz = p.vz * dt;
    const len = Math.hypot(dx, dy, dz);
    const nx = dx / len,
      ny = dy / len,
      nz = dz / len;
    let tHit = w.raycast(p.x, p.y, p.z, nx, ny, nz, len);
    let victim: Actor | null = null;
    let zone: Zone = "torso";
    for (const t of m.actors) {
      if (!t.alive || t.mode === Mode.Skiff || t.mode === Mode.Dead) continue;
      if (t.id === p.owner && m.time - p.born < 0.35) continue;
      const th = rayActorAt(p.x, p.y, p.z, nx, ny, nz, t.x, t.y, t.z, t.crouch || t.mode === Mode.Slide, Math.min(len, tHit));
      if (th < tHit) {
        tHit = th;
        victim = t;
        zone = hitOut.zone;
      }
    }
    let caravanHit = false;
    const cv = m.caravan;
    if (cv && cv.alive && p.kind === "rail") {
      const tc = rayCapsule(p.x, p.y, p.z, nx, ny, nz, cv.x, cv.y - 0.3, cv.y + 0.3, cv.z, 1.7, Math.min(len, tHit));
      if (tc < tHit) {
        tHit = tc;
        victim = null;
        caravanHit = true;
      }
    }
    const expired = m.time - p.born > 6;
    if (tHit <= len || expired) {
      const t = Math.min(tHit, len);
      const hx = p.x + nx * t,
        hy = p.y + ny * t,
        hz = p.z + nz * t;
      const owner = m.actors[p.owner];
      if (p.kind === "rail") {
        if (victim && owner) {
          const zm = zone === "head" ? p.head : zone === "limb" ? WEAPONS.longwake.limb : 1;
          m.damage(victim, p.damage * zm, p.owner, "longwake", zone, false, Math.hypot(victim.x - owner.x, victim.z - owner.z));
        } else if (caravanHit && owner) m.damageCaravan(owner, p.damage);
        m.emit({ t: "explode", kind: "rail", x: hx, y: hy, z: hz, r: 1 });
      } else if (p.kind === "mist") {
        m.mists.push({ x: hx, y: hy + 1.2, z: hz, r: MIST_RADIUS, born: m.time });
        m.emit({ t: "explode", kind: "mist", x: hx, y: hy + 1.2, z: hz, r: MIST_RADIUS });
      } else {
        explode(m, p.kind === "gale" ? "gale" : "orb", p.owner, hx - nx * 0.2, hy - ny * 0.2 + 0.1, hz - nz * 0.2, p.radius, p.damage, p.impulse);
      }
      m.projectiles.splice(i, 1);
      continue;
    }
    p.x += dx;
    p.y += dy;
    p.z += dz;
  }
}

export { aimDir, aimPivot, cancelUse, startReload };
