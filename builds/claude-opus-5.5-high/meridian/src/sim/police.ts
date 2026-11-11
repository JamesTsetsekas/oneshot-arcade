// Crime evidence, identification and the five-tier Alert response.
// Crimes only become known through valid observers: police (instant), security cameras
// (instant), or civilian witnesses who must complete a 2–5 s phone call. Response units
// spawn out of view at stations/road portals, drive physically, pursue, search the
// last-known area on a shared blackboard, and stand down after a tier-specific cooldown.

import { clamp, dist2, Rng, wrapAngle } from "../core/math";
import { Character } from "./character";
import { Vehicle } from "./vehicle";
import { DriveAI } from "./drive-ai";
import { WEAPONS } from "./weapons";
import type { Game } from "./game";
import { DISTRICT_NAMES, districtAt } from "../world/district";

export type CrimeType = "theft" | "assault" | "weapon" | "gunfire" | "trespass" | "property" | "collision" | "attackPolice" | "murder" | "killPolice";
export const CRIME_LABEL: Record<CrimeType, string> = {
  theft: "vehicle theft", assault: "assault", weapon: "weapon display", gunfire: "gunfire", trespass: "trespass",
  property: "property damage", collision: "hit-and-run", attackPolice: "attacking an officer", murder: "homicide", killPolice: "killing an officer",
};
export const CRIME_TIER: Record<CrimeType, number> = {
  theft: 1, property: 1, trespass: 1, weapon: 1, assault: 2, collision: 2, gunfire: 2, attackPolice: 3, murder: 3, killPolice: 4,
};
export const CRIME_SEVERITY: Record<CrimeType, number> = {
  theft: 1, property: 0.4, trespass: 1, weapon: 1, assault: 2, collision: 2, gunfire: 2.5, attackPolice: 3.5, murder: 4, killPolice: 5,
};

export interface SuspectDesc { outfit: number; vehicleId: number | null; vehicleName: string | null; plate: string | null }

export interface CrimeRecord {
  id: number;
  type: CrimeType;
  severity: number;
  time: number;
  x: number; z: number;
  suspect: SuspectDesc;
  witnesses: string[];
  cameraId: string | null;
  policeWitness: string | null;
  confidence: number;
  reported: boolean;
}

export type IdState = "Unnoticed" | "Witness Reporting" | "Identified" | "Pursuit" | "Search" | "Cooling";

export interface SecCam {
  id: string; x: number; y: number; z: number; yaw0: number; yaw: number; sweep: number; fov: number; range: number;
  disabledUntil: number; restricted: boolean; label: string;
}

export interface Unit {
  id: number;
  vehicle: Vehicle;
  officers: Character[];
  state: "Patrol" | "Respond" | "Pursue" | "Search" | "Roadblock" | "Return";
  ai: DriveAI;
  route: number[];
  routeT: number;
  deployed: boolean;
  searchX: number; searchZ: number;
}

interface Call { witness: Character; crime: CrimeRecord; t: number; dur: number; started: boolean }

export const SEARCH_TIME = [0, 22, 30, 40, 52, 65];
export const UNITS_FOR_TIER = [0, 1, 2, 3, 4, 5];

export class PoliceSystem {
  tier = 0;
  heat = 0;
  identified = false;
  state: IdState = "Unnoticed";
  lkpX = 0; lkpZ = 0;
  searchR = 30;
  searchT = 0;
  seenT = -100;
  suspicion = 0;
  shotPolice = false;
  maxTier = 4;
  crimes: CrimeRecord[] = [];
  calls: Call[] = [];
  units: Unit[] = [];
  footOfficers: Character[] = [];
  budget = 0;
  cameras: SecCam[] = [];
  drone: { x: number; y: number; z: number; active: boolean; tx: number; tz: number } = { x: 0, y: 30, z: 0, active: false, tx: 0, tz: 0 };
  spikes: { x: number; z: number; hw: number; hl: number; yaw: number; until: number }[] = [];
  arrest: { officer: Character; t: number; comply: number } | null = null;
  desc: SuspectDesc = { outfit: 0, vehicleId: null, vehicleName: null, plate: null };
  seenNow = false;
  private rng = new Rng(555);
  private crimeSeq = 1;
  private unitSeq = 1;
  private dispatchCd = 0;
  private radioCd = 0;
  private roadblockDone = false;
  patrolTarget = 2;
  stats = { spawned: 0, peakUnits: 0 };

  constructor(private g: Game) {
    const cam = (id: string, x: number, y: number, z: number, yaw: number, sweep: number, restricted: boolean, label: string): SecCam =>
      ({ id, x, y, z, yaw0: yaw, yaw, sweep, fov: 0.42, range: 19, disabledUntil: -1, restricted, label });
    this.cameras = [
      cam("shed-a", -323.5, 6, -137, Math.PI * 0.75, 0.7, true, "Shed 4 camera A"),
      cam("shed-b", -276.5, 6, -163, -Math.PI * 0.25, 0.7, true, "Shed 4 camera B"),
      cam("port-a", 239, 4.6, -309, Math.PI * 0.8, 0.6, true, "Port office camera"),
      cam("store", 37, 4, -127, -Math.PI * 0.3, 0.4, false, "Harbor Supply camera"),
      cam("glass-1", 210, 7, -105, Math.PI * 0.75, 0.8, false, "Glassline plaza camera"),
      cam("glass-2", 290, 7, -20, -Math.PI * 0.6, 0.8, false, "Glassline tower camera"),
      cam("police", 262, 5, -116, Math.PI * 0.25, 0.9, false, "Substation camera"),
    ];
  }

  get lethalAuthorized() { return this.tier >= 3 || this.shotPolice; }
  get searchDuration() { return SEARCH_TIME[this.tier] ?? 30; }
  get unitCount() { return this.units.length; }

  private currentDesc(): SuspectDesc {
    const pv = this.g.player.vehicle;
    return { outfit: this.g.inv.outfit, vehicleId: pv ? pv.id : null, vehicleName: pv ? pv.spec.name : null, plate: pv ? pv.plate : null };
  }

  private describe(d: SuspectDesc) {
    const o = ["teal courier jacket", "canvas dock jacket", "striped market shirt", "grey office jacket", "dark night coat"][d.outfit] ?? "jacket";
    return d.vehicleName ? `in a ${d.vehicleName}, plate ${d.plate}` : `on foot, wearing a ${o}`;
  }

  private radio(text: string, force = false) {
    if (!force && this.radioCd > 0) return;
    this.radioCd = 5;
    this.g.subtitle("Dispatch", text, 3.6, "dispatch");
  }

  /** Is a security camera currently seeing the given point? */
  cameraSees(cam: SecCam, x: number, y: number, z: number): boolean {
    if (cam.disabledUntil > this.g.time) return false;
    const d = dist2(cam.x, cam.z, x, z);
    if (d > cam.range) return false;
    const a = Math.abs(wrapAngle(Math.atan2(x - cam.x, z - cam.z) - cam.yaw));
    if (a > cam.fov) return false;
    return this.g.world.lineOfSight(cam.x, cam.y, cam.z, x, y, z);
  }

  /** Police on foot or in vehicles who can see a point. */
  private officerSees(x: number, y: number, z: number, range = 45): Character | null {
    for (const c of this.g.chars) {
      if (c.kind !== "police" || !c.alive || c.status !== "normal") continue;
      const ox = c.vehicle ? c.vehicle.x : c.x, oz = c.vehicle ? c.vehicle.z : c.z;
      const oy = c.vehicle ? c.vehicle.y + 1.3 : c.eyeY;
      const d = dist2(ox, oz, x, z);
      if (d > range) continue;
      const yaw = c.vehicle ? c.vehicle.yaw : c.yaw;
      const a = Math.abs(wrapAngle(Math.atan2(x - ox, z - oz) - yaw));
      if (a > (c.vehicle ? 1.4 : 1.2) && d > 8) continue;
      if (this.g.world.lineOfSight(ox, oy, oz, x, y, z)) return c;
    }
    return null;
  }

  /** Entry point for every player crime. */
  reportCrime(type: CrimeType, x: number, z: number, y = 1): CrimeRecord {
    const crime: CrimeRecord = {
      id: this.crimeSeq++, type, severity: CRIME_SEVERITY[type], time: this.g.time, x, z,
      suspect: this.currentDesc(), witnesses: [], cameraId: null, policeWitness: null, confidence: 0, reported: false,
    };
    this.crimes.push(crime);
    if (this.crimes.length > 40) this.crimes.shift();
    this.g.stats.crimes++;
    const cop = this.officerSees(x, y + 0.5, z, type === "gunfire" ? 70 : 45);
    if (cop) {
      crime.policeWitness = cop.id; crime.confidence = 1;
      this.commit(crime, true);
      return crime;
    }
    for (const cam of this.cameras) {
      if (this.cameraSees(cam, x, y + 0.5, z)) {
        crime.cameraId = cam.id; crime.confidence = 0.9;
        this.commit(crime, false);
        return crime;
      }
    }
    // civilian witnesses: plausible view/hearing; first two make the call
    const hear = type === "gunfire" ? 55 : type === "property" ? 10 : 18;
    const see = type === "property" ? 18 : 32;
    const wits = this.g.peds.witnessesFor(x, y + 0.5, z, hear, see);
    wits.sort((a, b) => dist2(a.x, a.z, x, z) - dist2(b.x, b.z, x, z));
    for (const w of wits.slice(0, 2)) {
      if (this.calls.some((c) => c.witness === w)) continue;
      crime.witnesses.push(w.id);
      this.calls.push({ witness: w, crime, t: -this.rng.range(0.5, 1.4), dur: this.rng.range(2, 5), started: false });
    }
    if (crime.witnesses.length && this.state === "Unnoticed") this.state = "Witness Reporting";
    return crime;
  }

  /** A witness call was interrupted (distraction or witness incapacitated). */
  interruptCall(w: Character) {
    const i = this.calls.findIndex((c) => c.witness === w);
    if (i >= 0) {
      this.calls.splice(i, 1);
      this.g.peds.setCalling(w, false);
      if (!this.calls.length && this.state === "Witness Reporting") this.state = this.tier > 0 ? "Search" : "Unnoticed";
    }
  }

  private commit(crime: CrimeRecord, seen: boolean) {
    crime.reported = true;
    const prevTier = this.tier;
    this.heat += crime.severity;
    let t = Math.max(this.tier, CRIME_TIER[crime.type]);
    if (this.tier > 0 && crime.type !== "property") t = Math.max(t, Math.min(this.tier + (this.heat > 4 * (this.tier + 1) ? 1 : 0), 4));
    this.tier = clamp(t, this.tier, this.maxTier);
    if (this.tier > prevTier) {
      this.budget += 2 + this.tier * 2;
      this.g.emit({ type: "alert", x: crime.x, y: 0, z: crime.z, tier: this.tier });
    }
    this.identified = true;
    this.desc = crime.suspect;
    this.lkpX = crime.x; this.lkpZ = crime.z;
    this.searchT = this.searchDuration;
    this.searchR = 35 + this.tier * 15;
    if (seen) { this.state = "Pursuit"; this.seenT = this.g.time; }
    else if (this.state !== "Pursuit") this.state = "Search";
    const where = DISTRICT_NAMES[districtAt(crime.x, crime.z)];
    this.radio(`Report of ${CRIME_LABEL[crime.type]} in ${where}. Suspect ${this.describe(crime.suspect)}.`, true);
  }

  /** Player hurt or killed an officer etc. */
  escalate(type: CrimeType, x: number, z: number) {
    if (type === "attackPolice" || type === "killPolice") this.shotPolice = true;
    const crime = this.reportCrime(type, x, z);
    if (!crime.reported) {
      // the officer who was attacked always knows
      crime.policeWitness = "victim";
      this.commit(crime, true);
    }
  }

  /** Mission hook: force a minimum tier with identification (e.g. finale escape). */
  forceTier(t: number) {
    this.maxTier = Math.max(this.maxTier, t);
    this.tier = Math.max(this.tier, t);
    this.budget += 2 + t * 2;
    this.identified = true;
    this.desc = this.currentDesc();
    const P = this.g.playerPos();
    this.lkpX = P.x; this.lkpZ = P.z;
    this.state = "Pursuit"; this.seenT = this.g.time;
    this.searchT = this.searchDuration;
    this.radio(`All units, priority alert at the Breakwater. Suspect ${this.describe(this.desc)}.`, true);
  }

  onOutfitChanged() {
    // disguise only helps when no one is watching
    if (this.seenNow) { this.desc = this.currentDesc(); return; }
    if (this.identified) this.g.toast("Outfit changed out of sight — description no longer matches.");
  }

  clear() {
    this.tier = 0; this.heat = 0; this.identified = false; this.state = "Unnoticed"; this.shotPolice = false;
    this.maxTier = 4; this.roadblockDone = false; this.arrest = null; this.drone.active = false; this.spikes = [];
    for (const u of this.units) if (u.state !== "Patrol") u.state = "Return";
    for (const c of this.footOfficers) { const b = this.g.combat.brains.get(c.id); if (b) b.state = "Return"; }
  }

  /** Called by officers within reach of an on-foot player at low threat. */
  arrestAttempt(officer: Character) {
    if (this.tier > 2 || this.shotPolice) return;
    const P = this.g.player;
    if (P.vehicle || !P.alive) return;
    if (!this.arrest) {
      this.arrest = { officer, t: 0, comply: 0 };
      this.g.toast("Wardens: \"Hands up!\" — Hold E to comply, or run to resist.");
    }
  }

  private recognizes(dist: number): boolean {
    const pv = this.g.player.vehicle;
    const outfitMatch = this.desc.outfit === this.g.inv.outfit;
    const vehMatch = this.desc.vehicleId !== null && pv !== null && pv.id === this.desc.vehicleId;
    if (vehMatch) return true;
    if (pv) return outfitMatch && dist < 14;
    return outfitMatch;
  }

  update(dt: number) {
    const g = this.g;
    const P = g.player;
    const pv = P.vehicle;
    const px = pv ? pv.x : P.x, pz = pv ? pv.z : P.z, py = pv ? pv.y + 1 : P.chestY;
    if (this.radioCd > 0) this.radioCd -= dt;
    if (this.dispatchCd > 0) this.dispatchCd -= dt;

    // cameras sweep
    for (const cam of this.cameras) cam.yaw = cam.yaw0 + Math.sin(g.time * 0.45 + cam.x) * cam.sweep;

    // witness calls
    for (let i = this.calls.length - 1; i >= 0; i--) {
      const c = this.calls[i];
      const w = c.witness;
      if (!w.alive || w.status !== "normal" || w.removeMe) { this.calls.splice(i, 1); continue; }
      c.t += dt;
      if (c.t >= 0 && !c.started) { c.started = true; g.peds.setCalling(w, true); }
      if (c.started && c.t >= c.dur) {
        this.calls.splice(i, 1);
        g.peds.setCalling(w, false);
        if (!c.crime.reported) { c.crime.confidence = 0.6; this.commit(c.crime, false); }
      }
    }
    if (this.state === "Witness Reporting" && !this.calls.length && this.tier === 0) this.state = "Unnoticed";

    // visibility of identified player
    this.seenNow = false;
    if (this.tier > 0 && this.identified && !g.playerHidden()) {
      let observer = false, closest = Infinity;
      const cop = this.officerSees(px, py, pz, 55);
      if (cop) { observer = true; closest = dist2(cop.x, cop.z, px, pz); }
      if (!observer) for (const cam of this.cameras) if (!cam.restricted && this.cameraSees(cam, px, py, pz)) { observer = true; closest = 30; break; }
      if (!observer && this.drone.active && dist2(this.drone.x, this.drone.z, px, pz) < 55 && g.world.lineOfSight(this.drone.x, this.drone.y, this.drone.z, px, py, pz)) { observer = true; closest = 40; }
      if (observer) {
        if (this.recognizes(closest)) { this.seenNow = true; this.suspicion = 0; }
        else if (closest < 12) {
          this.suspicion += dt / 2.5;
          if (this.suspicion >= 1) { this.seenNow = true; this.desc = this.currentDesc(); this.radio("Suspect re-identified — they changed their look.", true); }
        }
      } else this.suspicion = Math.max(0, this.suspicion - dt * 0.3);
    }
    if (this.seenNow) {
      if (this.state !== "Pursuit") this.radio(`Visual on suspect ${this.describe(this.currentDesc())}.`);
      this.state = "Pursuit"; this.seenT = g.time; this.lkpX = px; this.lkpZ = pz;
      this.searchT = this.searchDuration;
      this.desc = this.currentDesc();
    } else if (this.state === "Pursuit" && g.time - this.seenT > 3) {
      this.state = "Search";
      this.searchR = 35 + this.tier * 15;
      this.radio(`Lost visual. Units, search around ${DISTRICT_NAMES[districtAt(this.lkpX, this.lkpZ)]}.`);
    }
    if (this.tier > 0 && (this.state === "Search" || this.state === "Cooling" || this.state === "Identified")) {
      this.searchT -= dt;
      this.searchR = Math.min(140, this.searchR + dt * 2);
      if (this.searchT < this.searchDuration * 0.35) this.state = "Cooling";
      if (this.searchT <= 0) {
        this.radio("Search called off. All units resume patrol.", true);
        this.clear();
      }
    }

    // arrest interaction
    if (this.arrest) {
      const a = this.arrest;
      a.t += dt;
      const d = dist2(a.officer.x, a.officer.z, P.x, P.z);
      if (!a.officer.alive || a.officer.status !== "normal" || P.vehicle) this.arrest = null;
      else if (d > 6) {
        this.arrest = null;
        this.heat += 2;
        if (this.tier < 2) { this.tier = 2; this.budget += 3; }
        this.radio("Suspect is resisting! Pursuit authorized.", true);
      } else {
        const unarmedWeak = P.health < 30 && (P.weapon === "fists" || g.holstered);
        if (g.input.interactHeld) a.comply += dt; else a.comply = Math.max(0, a.comply - dt * 0.5);
        if (unarmedWeak && a.t > 4) a.comply = 2;
        if (a.comply >= 1.2) { this.arrest = null; g.busted(); }
      }
    }

    // dispatch: keep enough units for the tier, within the incident budget and global cap
    const want = this.tier > 0 ? UNITS_FOR_TIER[this.tier] : this.patrolTarget;
    const active = this.units.filter((u) => u.state !== "Return").length;
    if (active < want && this.dispatchCd <= 0 && (this.tier === 0 || this.budget > 0) && this.units.length < 6) {
      if (this.spawnUnit(this.tier > 0 ? "Respond" : "Patrol")) {
        if (this.tier > 0) this.budget--;
        this.dispatchCd = this.tier > 0 ? 3 : 8;
      } else this.dispatchCd = 1;
    }
    // patrols become responders when an alert starts
    if (this.tier > 0) for (const u of this.units) if (u.state === "Patrol") u.state = "Respond";
    // roadblock at tier 3+, once per incident
    if (this.tier >= 3 && !this.roadblockDone && this.state === "Pursuit" && pv) this.roadblock(px, pz, pv.vx, pv.vz);
    // drone at tier 4+
    this.drone.active = this.tier >= 4;
    if (this.drone.active) {
      const tx = this.state === "Pursuit" ? px : this.lkpX + Math.sin(g.time * 0.3) * this.searchR * 0.6;
      const tz = this.state === "Pursuit" ? pz : this.lkpZ + Math.cos(g.time * 0.3) * this.searchR * 0.6;
      const dx = tx - this.drone.x, dz = tz - this.drone.z, d = Math.hypot(dx, dz);
      if (d > 300) { this.drone.x = tx - 150; this.drone.z = tz - 150; }
      const sp = Math.min(16 * dt, d);
      if (d > 0.1) { this.drone.x += (dx / d) * sp; this.drone.z += (dz / d) * sp; }
      this.drone.y = g.heightAt(this.drone.x, this.drone.z) + 26;
    }
    for (let i = this.spikes.length - 1; i >= 0; i--) if (this.spikes[i].until < g.time) this.spikes.splice(i, 1);

    this.updateUnits(dt);
    this.stats.peakUnits = Math.max(this.stats.peakUnits, this.units.length);
  }

  private pickSpawn(): { x: number; z: number; yaw: number } | null {
    const g = this.g;
    const P = g.focus;
    // station lot first when it's out of view and not too close
    const st = { x: 276, z: -114, yaw: Math.PI };
    const ds = dist2(st.x, st.z, P.x, P.z);
    if (ds > 80 && ds < 330 && !g.isVisible(st.x, 1, st.z, 4) && !g.vehicles.some((v) => dist2(v.x, v.z, st.x, st.z) < 6)) return st;
    for (let k = 0; k < 30; k++) {
      const lane = g.roads.lanes[this.rng.int(0, g.roads.lanes.length - 1)];
      const s = this.rng.range(3, Math.max(4, lane.length - 3));
      const x = lane.x0 + lane.dx * s, z = lane.z0 + lane.dz * s;
      const d = dist2(x, z, P.x, P.z);
      if (d < 110 || d > 240) continue;
      if (g.isVisible(x, g.heightAt(x, z) + 1, z, 4)) continue;
      if (g.vehicles.some((v) => dist2(v.x, v.z, x, z) < 12)) continue;
      return { x, z, yaw: Math.atan2(lane.dx, lane.dz) };
    }
    return null;
  }

  private makeOfficer(x: number, z: number, armed: boolean): Character {
    const c = new Character("police", "police", this.g.makeLook("police", this.rng), x, z, this.g.groundAt(x, z));
    c.health = c.maxHealth = 100;
    this.g.combat.add(c, "police", { weapon: armed && this.tier >= 3 && this.rng.chance(0.5) ? "carbine" : "pistol", accuracy: 0.5 + this.tier * 0.05, range: 40 });
    return c;
  }

  private spawnUnit(state: Unit["state"]): boolean {
    const sp = this.pickSpawn();
    if (!sp) return false;
    const v = new Vehicle("warden", sp.x, sp.z, sp.yaw, 0);
    v.role = "police"; v.mode = "physics"; v.y = this.g.heightAt(v.x, v.z); v.savePrev(); v.despawnable = false;
    v.siren = state !== "Patrol";
    const officers = [this.makeOfficer(sp.x, sp.z, true), this.makeOfficer(sp.x, sp.z, true)];
    for (const o of officers) { o.vehicle = v; }
    // officers ride inside: remove from active combat until deployed
    v.crew = officers; v.driver = officers[0].id; v.locked = true;
    const u: Unit = { id: this.unitSeq++, vehicle: v, officers, state, ai: new DriveAI(), route: [], routeT: 0, deployed: false, searchX: this.lkpX, searchZ: this.lkpZ };
    this.units.push(u);
    this.g.addVehicle(v);
    this.stats.spawned++;
    return true;
  }

  private roadblock(px: number, pz: number, vx: number, vz: number) {
    const g = this.g;
    const sp = Math.hypot(vx, vz);
    if (sp < 6) return;
    const fx = vx / sp, fz = vz / sp;
    let best: { x: number; z: number; id: number } | null = null, bd = Infinity;
    for (const n of g.roads.nodes) {
      const dx = n.x - px, dz = n.z - pz, d = Math.hypot(dx, dz);
      if (d < 110 || d > 230) continue;
      if ((dx * fx + dz * fz) / d < 0.75) continue;
      if (g.isVisible(n.x, 1, n.z, 8)) continue;
      const score = Math.abs(d - 160);
      if (score < bd) { bd = score; best = { x: n.x, z: n.z, id: n.id }; }
    }
    if (!best || this.budget < 2) return;
    this.roadblockDone = true;
    this.budget -= 2;
    // two cars across the approach the player will use
    const ax = -fx, az = -fz; // approach direction from node toward player
    const ox = best.x + ax * 14, oz = best.z + az * 14;
    const perpYaw = Math.atan2(az, -ax);
    for (const side of [-1, 1]) {
      const x = ox + -az * side * 3.2, z = oz + ax * side * 3.2;
      const v = new Vehicle("warden", x, z, perpYaw + (side > 0 ? 0.25 : -0.25), 0);
      v.role = "police"; v.siren = true; v.y = g.heightAt(x, z); v.savePrev(); v.despawnable = false; v.locked = true;
      const off = this.makeOfficer(x + ax * 3, z + az * 3, true);
      const u: Unit = { id: this.unitSeq++, vehicle: v, officers: [off], state: "Roadblock", ai: new DriveAI(), route: [], routeT: 0, deployed: true, searchX: x, searchZ: z };
      this.footOfficers.push(off);
      this.units.push(u);
      g.addVehicle(v);
    }
    if (this.tier >= 4) this.spikes.push({ x: ox + ax * 12, z: oz + az * 12, hw: 4, hl: 0.6, yaw: Math.atan2(ax, az), until: g.time + 60 });
    this.radio(`Roadblock set at ${DISTRICT_NAMES[districtAt(best.x, best.z)]}.`, true);
  }

  private updateUnits(dt: number) {
    const g = this.g;
    const P = g.player;
    const pv = P.vehicle;
    const px = pv ? pv.x : P.x, pz = pv ? pv.z : P.z;
    for (let i = this.units.length - 1; i >= 0; i--) {
      const u = this.units[i];
      const v = u.vehicle;
      if (!g.vehicles.includes(v)) { this.units.splice(i, 1); continue; }
      if (v.driver === "player") { this.units.splice(i, 1); continue; }
      const d = dist2(v.x, v.z, px, pz);
      if (this.tier === 0 && u.state !== "Patrol" && u.state !== "Return") u.state = "Return";
      if (u.state === "Pursue" && this.state !== "Pursuit") { u.state = "Search"; u.searchX = this.lkpX; u.searchZ = this.lkpZ; u.routeT = 0; }
      if ((u.state === "Respond" || u.state === "Search") && this.state === "Pursuit") u.state = "Pursue";
      if (u.state === "Respond" && this.state !== "Pursuit") u.state = "Search";
      v.siren = u.state === "Pursue" || u.state === "Respond" || u.state === "Roadblock" || (u.state === "Search" && this.tier >= 2);

      // deploy officers when the player is on foot nearby
      if (!u.deployed && u.state === "Pursue" && !pv && d < 24 && v.speed < 5) this.deploy(u);
      if (!u.deployed && v.stalled && this.tier > 0) this.deploy(u);
      if (!unitDriverAlive(u)) { g.stepVehicle(v, dt, { throttle: 0, brake: 1, steer: 0, handbrake: true }); continue; }

      let ctl = { throttle: 0, brake: 1, steer: 0, handbrake: false };
      u.routeT -= dt;
      const avoid = (x: number, z: number, dx: number, dz: number) => g.traffic.probe(v, 16, null).dist;
      switch (u.state) {
        case "Patrol": {
          if (u.routeT <= 0 || u.ai.done || !u.route.length) {
            const n = g.roads.nodes[this.rng.int(0, g.roads.nodes.length - 1)];
            u.route = g.roads.gpsRoute(v.x, v.z, n.x, n.z);
            u.routeT = 40; u.ai.setRoute(u.route);
          }
          ctl = u.ai.update(v, dt, { route: u.route, maxSpeed: 11, laneOffset: 1.75, arrive: true }, avoid);
          if (dist2(v.x, v.z, g.focus.x, g.focus.z) > 320 && !g.isVisible(v.x, v.y + 1, v.z, 3)) { this.removeUnit(i); continue; }
          break;
        }
        case "Respond": case "Search": {
          if (u.routeT <= 0 || u.ai.done) {
            const a = this.rng.range(0, Math.PI * 2), r = this.rng.range(0, this.searchR);
            u.searchX = this.lkpX + Math.sin(a) * r; u.searchZ = this.lkpZ + Math.cos(a) * r;
            // investigate the abandoned identified vehicle
            if (this.desc.vehicleId !== null && !pv && this.rng.chance(0.5)) {
              const av = g.vehicles.find((q) => q.id === this.desc.vehicleId);
              if (av) { u.searchX = av.x; u.searchZ = av.z; }
            }
            u.route = g.roads.gpsRoute(v.x, v.z, u.searchX, u.searchZ);
            u.ai.setRoute(u.route);
            u.routeT = 14;
          }
          ctl = u.ai.update(v, dt, { route: u.route, maxSpeed: u.state === "Respond" ? 24 : 13, arrive: true }, avoid);
          break;
        }
        case "Pursue": {
          if (u.routeT <= 0) { u.route = g.roads.gpsRoute(v.x, v.z, px, pz); u.ai.setRoute(u.route); u.routeT = 1.5; }
          const chase = d < 45 && g.world.lineOfSight(v.x, v.y + 1.2, v.z, px, (pv ? pv.y : P.y) + 1, pz)
            ? { x: px, z: pz, vx: pv ? pv.vx : P.vx, vz: pv ? pv.vz : P.vz } : null;
          ctl = u.ai.update(v, dt, { route: u.route, chase, maxSpeed: 34, aggressive: this.tier >= 2 && !!pv }, avoid);
          if (!pv && d < 10) { ctl.throttle = 0; ctl.brake = 1; }
          break;
        }
        case "Roadblock": {
          ctl = { throttle: 0, brake: 1, steer: 0, handbrake: true };
          break;
        }
        case "Return": {
          if (u.routeT <= 0) {
            const far = g.roads.nodes.reduce((a, n) => (dist2(n.x, n.z, px, pz) > dist2(a.x, a.z, px, pz) ? n : a));
            u.route = g.roads.gpsRoute(v.x, v.z, far.x, far.z); u.ai.setRoute(u.route); u.routeT = 30;
          }
          ctl = u.ai.update(v, dt, { route: u.route, maxSpeed: 13, laneOffset: 1.75 }, avoid);
          if (d > 140 && !g.isVisible(v.x, v.y + 1, v.z, 3)) { this.removeUnit(i); continue; }
          break;
        }
      }
      if (u.deployed && u.state !== "Roadblock") ctl = { throttle: 0, brake: 1, steer: 0, handbrake: true };
      g.stepVehicle(v, dt, ctl);
    }
    // clean up foot officers after the incident
    for (let i = this.footOfficers.length - 1; i >= 0; i--) {
      const c = this.footOfficers[i];
      const d = dist2(c.x, c.z, px, pz);
      if (c.removeMe) { this.footOfficers.splice(i, 1); continue; }
      if ((this.tier === 0 || !c.alive) && d > 60 && !g.isVisible(c.x, c.y + 1, c.z, 1)) {
        c.removeMe = true; g.combat.remove(c); this.footOfficers.splice(i, 1);
      }
    }
  }

  private deploy(u: Unit) {
    u.deployed = true;
    const v = u.vehicle;
    const g = this.g;
    u.officers.forEach((o, k) => {
      if (!o.alive) return;
      o.vehicle = null;
      const side = k === 0 ? -1 : 1;
      o.x = v.x + Math.cos(v.yaw) * (v.hw + 0.8) * side; o.z = v.z - Math.sin(v.yaw) * (v.hw + 0.8) * side;
      o.y = g.groundAt(o.x, o.z); o.savePrev();
      const b = g.combat.brains.get(o.id);
      if (b) { b.state = "Chase"; b.homeX = o.x; b.homeZ = o.z; }
      this.footOfficers.push(o);
    });
    v.crew = []; v.driver = null;
  }

  private removeUnit(i: number) {
    const u = this.units[i];
    for (const o of u.officers) { if (o.vehicle === u.vehicle) { o.removeMe = true; this.g.combat.remove(o); } }
    this.units.splice(i, 1);
    this.g.removeVehicle(u.vehicle);
  }

  /** Player took an officer's weapon fire etc. */
  policeHurtByPlayer(c: Character, killed: boolean) {
    this.escalate(killed ? "killPolice" : "attackPolice", c.x, c.z);
  }

  weaponFor(c: Character) { return WEAPONS[c.weapon]; }
}

export function unitDriverAlive(u: Unit) {
  return u.vehicle.driver !== null && u.officers.some((o) => o.alive && o.vehicle === u.vehicle);
}
