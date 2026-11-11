// Weapon state machine: cadence, ammo, reload stages, ADS, spread and recoil.
// Owned by the authoritative room; the client only renders its results.
import { WEAPONS, WeaponDef, FireMode, ReloadStages, recoilPatternKick } from "../content/weapons";
import { ATTACHMENTS } from "../content/items";
import { Rng, clamp } from "./math";

export interface WeaponStats {
  def: WeaponDef;
  interval: number;
  mag: number;
  reserveMax: number;
  reloadTac: ReloadStages;
  reloadEmpty: ReloadStages;
  adsTime: number;
  adsZoom: number;
  adsMove: number;
  sprintToFire: number;
  swapTime: number;
  hip: WeaponDef["hip"];
  ads: WeaponDef["ads"];
  recoilV: number;
  recoilH: number;
  recoilVar: number;
  recoilRecover: number;
  rangeMult: number;
  suppressed: boolean;
  flashScale: number;
  attachments: string[];
}

const scaleStages = (r: ReloadStages, k: number): ReloadStages => ({
  magOut: r.magOut * k, magIn: r.magIn * k, total: r.total * k, chamber: r.chamber !== undefined ? r.chamber * k : undefined,
});

export function computeStats(defId: string, attachmentIds: string[], perks: string[]): WeaponStats {
  const def = WEAPONS[defId];
  if (!def) throw new Error(`Unknown weapon ${defId}`);
  let adsTime = def.adsTime, adsZoom = def.adsZoom, adsMove = def.adsMove, recoil = 1, recoilH = 1, hipSpread = 1, adsSpread = 1;
  let magMult = 1, reload = 1, range = 1, suppressed = false, flashScale = 1, sprintToFire = def.sprintToFire;
  const valid: string[] = [];
  for (const id of attachmentIds) {
    const a = ATTACHMENTS[id];
    if (!a || !a.classes.includes(def.cls)) continue;
    valid.push(id);
    const m = a.mods;
    if (m.adsTime) adsTime *= m.adsTime;
    if (m.adsZoom) adsZoom = def.cls === "rifle" || def.cls === "battle" || def.cls === "lmg" ? Math.max(m.adsZoom, m.adsZoom) : m.adsZoom;
    if (m.adsMove) adsMove *= m.adsMove;
    if (m.recoil) recoil *= m.recoil;
    if (m.recoilH) recoilH *= m.recoilH;
    if (m.hipSpread) hipSpread *= m.hipSpread;
    if (m.adsSpread) adsSpread *= m.adsSpread;
    if (m.mag) magMult *= m.mag;
    if (m.reload) reload *= m.reload;
    if (m.range) range *= m.range;
    if (m.suppressed) suppressed = true;
    if (m.flashScale !== undefined) flashScale *= m.flashScale;
    if (m.sprintToFire) sprintToFire *= m.sprintToFire;
  }
  if (perks.includes("fleetBoots")) sprintToFire *= 0.75;
  const swapTime = def.swapTime * (perks.includes("rapidReady") ? 0.65 : 1);
  const mag = Math.max(1, Math.round(def.mag * magMult));
  return {
    def,
    interval: 60 / def.rpm,
    mag,
    reserveMax: mag * def.reserveMags,
    reloadTac: scaleStages(def.reload.tactical, reload),
    reloadEmpty: scaleStages(def.reload.empty, reload),
    adsTime: clamp(adsTime, 0.12, 0.4),
    adsZoom, adsMove: clamp(adsMove, 0.4, 1), sprintToFire, swapTime,
    hip: { ...def.hip, base: def.hip.base * hipSpread, max: def.hip.max * hipSpread },
    ads: { ...def.ads, base: def.ads.base * adsSpread },
    recoilV: def.recoil.vertical * recoil,
    recoilH: def.recoil.horizontal * recoil * recoilH,
    recoilVar: def.recoil.variance,
    recoilRecover: def.recoil.recover,
    rangeMult: range,
    suppressed, flashScale, attachments: valid,
  };
}

export interface ReloadRun { kind: "tactical" | "empty"; t: number; stages: ReloadStages; magOut: boolean; magIn: boolean; chamber: boolean }

export interface WeaponRuntime {
  stats: WeaponStats;
  ammo: number;
  reserve: number;
  modeIdx: number;
  cooldown: number;
  burstLeft: number;
  shotIndex: number;
  bloomHip: number;
  bloomAds: number;
  sinceShot: number;
  reload: ReloadRun | null;
  shotsFired: number;
  hits: number;
}

export function newWeapon(stats: WeaponStats): WeaponRuntime {
  return { stats, ammo: stats.mag, reserve: stats.reserveMax, modeIdx: 0, cooldown: 0, burstLeft: 0, shotIndex: 0, bloomHip: 0, bloomAds: 0, sinceShot: 9, reload: null, shotsFired: 0, hits: 0 };
}

export interface ArmsState {
  weapons: [WeaponRuntime, WeaponRuntime];
  active: 0 | 1;
  swapT: number; // remaining raise time
  swapDur: number;
  ads: number;
  sinceSprint: number;
  melee: { t: number; hit: boolean } | null;
  firePrev: boolean;
  modePrev: boolean;
  meleePrev: boolean;
  inspect: number;
}

export function newArms(primary: WeaponStats, sidearm: WeaponStats): ArmsState {
  return { weapons: [newWeapon(primary), newWeapon(sidearm)], active: 0, swapT: 0, swapDur: 0, ads: 0, sinceSprint: 9, melee: null, firePrev: false, modePrev: false, meleePrev: false, inspect: 0 };
}

export interface ArmsInput {
  fire: boolean; ads: boolean; reload: boolean; slot: 0 | 1; mode: boolean; melee: boolean; inspect: boolean;
}
export interface ArmsContext { dt: number; sprinting: boolean; speedFrac: number; crouch: boolean; onGround: boolean; busy: boolean; rng: Rng }

export interface ShotRequest { weapon: WeaponStats; spreadDeg: number; pellets: number; kick: { pitch: number; yaw: number }; shotIndex: number }
export type ArmsEvent =
  | { type: "shot"; shot: ShotRequest }
  | { type: "dry" }
  | { type: "reload"; stage: "start" | "magOut" | "magIn" | "chamber" | "done"; kind: "tactical" | "empty" }
  | { type: "swap"; to: 0 | 1 }
  | { type: "melee" }
  | { type: "meleeHit" }
  | { type: "mode"; mode: FireMode };

export function currentMode(w: WeaponRuntime): FireMode { return w.stats.def.modes[w.modeIdx % w.stats.def.modes.length]; }

export function currentSpread(arms: ArmsState, ctx: { speedFrac: number; crouch: boolean; onGround: boolean }): number {
  const w = arms.weapons[arms.active];
  const s = w.stats;
  let hip = s.hip.base + s.hip.move * clamp(ctx.speedFrac, 0, 1.4) + w.bloomHip;
  if (ctx.crouch) hip *= 0.8;
  if (!ctx.onGround) hip *= 1.6;
  hip = Math.min(hip, s.hip.max * (ctx.onGround ? 1 : 1.5));
  let ads = s.ads.base + w.bloomAds + s.hip.move * 0.12 * clamp(ctx.speedFrac, 0, 1);
  ads = Math.min(ads, s.ads.max + s.hip.move * 0.12);
  const k = arms.ads * arms.ads;
  return hip + (ads - hip) * k;
}

const startReload = (w: WeaponRuntime, out: ArmsEvent[]) => {
  if (w.reload || w.ammo >= w.stats.mag || w.reserve <= 0) return;
  const kind = w.ammo === 0 ? "empty" : "tactical";
  w.reload = { kind, t: 0, stages: kind === "empty" ? w.stats.reloadEmpty : w.stats.reloadTac, magOut: false, magIn: false, chamber: false };
  w.burstLeft = 0;
  out.push({ type: "reload", stage: "start", kind });
};

export function stepArms(arms: ArmsState, inp: ArmsInput, ctx: ArmsContext, out: ArmsEvent[]): void {
  const dt = ctx.dt;
  const w = arms.weapons[arms.active];
  const s = w.stats;
  w.cooldown -= dt; // may go slightly negative so fire cadence is not quantised to the tick
  w.sinceShot += dt;
  for (const ww of arms.weapons) {
    ww.bloomHip = Math.max(0, ww.bloomHip - ww.stats.hip.recover * dt * (ctx.crouch ? 1.35 : 1));
    ww.bloomAds = Math.max(0, ww.bloomAds - ww.stats.hip.recover * 0.25 * dt);
    if (ww.sinceShot > 0.35) ww.shotIndex = 0;
  }
  arms.sinceSprint = ctx.sprinting ? 0 : arms.sinceSprint + dt;
  if (arms.swapT > 0) arms.swapT = Math.max(0, arms.swapT - dt);
  if (arms.inspect > 0) arms.inspect = Math.max(0, arms.inspect - dt);

  // Melee
  const meleePressed = inp.melee && !arms.meleePrev;
  arms.meleePrev = inp.melee;
  if (arms.melee) {
    arms.melee.t += dt;
    if (!arms.melee.hit && arms.melee.t >= 0.12) { arms.melee.hit = true; out.push({ type: "meleeHit" }); }
    if (arms.melee.t >= 0.55) arms.melee = null;
  } else if (meleePressed && !ctx.busy) {
    arms.melee = { t: 0, hit: false };
    w.reload = null;
    arms.inspect = 0;
    out.push({ type: "melee" });
  }

  // Swap
  if (inp.slot !== arms.active && arms.swapT <= 0 && !arms.melee) {
    w.reload = null; w.burstLeft = 0;
    arms.active = inp.slot;
    const nw = arms.weapons[arms.active];
    arms.swapDur = arms.swapT = (s.swapTime * 0.45 + nw.stats.swapTime * 0.55);
    arms.inspect = 0;
    out.push({ type: "swap", to: arms.active });
    return;
  }

  // Fire mode toggle
  if (inp.mode && !arms.modePrev && s.def.modes.length > 1) {
    w.modeIdx = (w.modeIdx + 1) % s.def.modes.length;
    out.push({ type: "mode", mode: currentMode(w) });
  }
  arms.modePrev = inp.mode;

  // ADS
  const wantAds = inp.ads && !ctx.sprinting && arms.swapT <= 0 && !arms.melee && !ctx.busy;
  arms.ads = clamp(arms.ads + (wantAds ? dt / s.adsTime : -dt / (s.adsTime * 0.8)), 0, 1);

  if (inp.inspect && !inp.fire && !inp.ads && !w.reload && arms.swapT <= 0) arms.inspect = 2.2;

  // Reload progress
  if (w.reload) {
    const r = w.reload;
    r.t += dt * (ctx.sprinting ? 0.85 : 1);
    if (!r.magOut && r.t >= r.stages.magOut) { r.magOut = true; out.push({ type: "reload", stage: "magOut", kind: r.kind }); }
    if (!r.magIn && r.t >= r.stages.magIn) {
      r.magIn = true;
      const need = s.mag - w.ammo;
      const take = Math.min(need, w.reserve);
      w.ammo += take; w.reserve -= take;
      out.push({ type: "reload", stage: "magIn", kind: r.kind });
    }
    if (r.kind === "empty" && !r.chamber && r.stages.chamber !== undefined && r.t >= r.stages.chamber) { r.chamber = true; out.push({ type: "reload", stage: "chamber", kind: r.kind }); }
    if (r.t >= r.stages.total) { w.reload = null; out.push({ type: "reload", stage: "done", kind: r.kind }); }
  }
  if (inp.reload && !w.reload && !arms.melee && arms.swapT <= 0) { arms.inspect = 0; startReload(w, out); }

  // Fire
  const mode = currentMode(w);
  const pressed = inp.fire && !arms.firePrev;
  arms.firePrev = inp.fire;
  const ready = arms.swapT <= 0 && !arms.melee && !ctx.sprinting && arms.sinceSprint >= s.sprintToFire && !ctx.busy;
  let wantShot = false;
  if (mode === "auto") wantShot = inp.fire;
  else if (mode === "burst") { if (pressed && w.burstLeft === 0 && w.cooldown <= 0) w.burstLeft = s.def.burst ?? 3; wantShot = w.burstLeft > 0; }
  else wantShot = pressed;

  if (wantShot && ready && w.cooldown <= 0) {
    if (w.reload && w.ammo > 0 && !w.reload.magOut) w.reload = null; // tactical reload interrupted by firing
    if (w.reload) return;
    if (w.ammo <= 0) {
      w.burstLeft = 0;
      if (pressed || mode === "auto") { out.push({ type: "dry" }); w.cooldown = 0.25; startReload(w, out); }
      return;
    }
    w.ammo--;
    w.shotsFired++;
    w.cooldown = Math.max(w.cooldown, -dt) + s.interval;
    if (mode === "burst") { w.burstLeft--; if (w.burstLeft === 0) w.cooldown += 0.14; }
    arms.inspect = 0;
    const spreadDeg = currentSpread(arms, ctx);
    const base = recoilPatternKick(s.def, w.shotIndex);
    const scale = s.def.recoil.vertical > 0 ? s.recoilV / s.def.recoil.vertical : 1;
    const hscale = s.def.recoil.horizontal > 0 ? s.recoilH / s.def.recoil.horizontal : 1;
    let k = (1 - 0.15 * arms.ads) * (ctx.crouch && s.def.crouchRecoilMult ? s.def.crouchRecoilMult : 1);
    const kick = {
      pitch: -(base.pitch * scale * k) * (1 + ctx.rng.gauss() * s.recoilVar),
      yaw: base.yaw * hscale * k + ctx.rng.gauss() * s.recoilVar * s.recoilH * 2,
    };
    w.bloomHip = Math.min(w.bloomHip + s.hip.perShot, s.hip.max);
    w.bloomAds = Math.min(w.bloomAds + s.ads.perShot, s.ads.max);
    w.shotIndex++;
    w.sinceShot = 0;
    out.push({ type: "shot", shot: { weapon: s, spreadDeg, pellets: s.def.pellets, kick, shotIndex: w.shotIndex } });
    if (w.ammo === 0 && w.reserve > 0) startReload(w, out);
  } else if (w.cooldown < 0) w.cooldown = 0; // no banking of cadence while not firing
  if (mode === "burst" && w.burstLeft > 0 && (w.ammo <= 0 || !ready)) w.burstLeft = 0;
}

export function refillAmmo(arms: ArmsState, fraction = 1) {
  for (const w of arms.weapons) w.reserve = Math.min(w.stats.reserveMax, w.reserve + Math.ceil(w.stats.reserveMax * fraction));
}
