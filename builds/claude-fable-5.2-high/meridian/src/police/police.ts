// Crime evidence and the five-tier Alert state machine.
// A crime only matters if something plausibly observed it: an officer, a camera, or a civilian
// witness who completes a 2-5 s phone call. Alert then moves Pursuit -> Search -> Cooling -> clear.
import type { Sim } from '../game-session/sim';
import type { Vehicle } from '../vehicles/vehicle';
import type { Unit } from './units';
import { cameras, CameraDef } from '../world/lots';
import { ANCHORS, zoneAt, ZONE_NAMES } from '../world/district';
import { angleDiff } from '../core/math';
import { OUTFITS } from '../character/player';

export type CrimeType = 'vehicleTheft' | 'vehicleTheftParked' | 'assault' | 'assaultLethal' | 'weaponDisplay' | 'gunfire' | 'trespass'
  | 'propertyDamage' | 'collisionInjury' | 'collisionMinor' | 'attackPolice' | 'evading' | 'resistArrest';
export const CRIMES: Record<CrimeType, { label: string; severity: number; sight: number; hear: number; call: number; cooldown: number }> = {
  vehicleTheft: { label: 'vehicle theft', severity: 22, sight: 30, hear: 0, call: 0.8, cooldown: 1 },
  vehicleTheftParked: { label: 'vehicle tampering', severity: 12, sight: 16, hear: 0, call: 0.35, cooldown: 1 },
  assault: { label: 'assault', severity: 20, sight: 28, hear: 0, call: 0.7, cooldown: 1 },
  assaultLethal: { label: 'shooting victim', severity: 60, sight: 40, hear: 0, call: 0.9, cooldown: 0.5 },
  weaponDisplay: { label: 'armed individual', severity: 8, sight: 14, hear: 0, call: 0.3, cooldown: 6 },
  gunfire: { label: 'shots fired', severity: 30, sight: 40, hear: 65, call: 0.6, cooldown: 2.5 },
  trespass: { label: 'trespass', severity: 12, sight: 0, hear: 0, call: 0, cooldown: 6 },
  propertyDamage: { label: 'hit and run', severity: 8, sight: 22, hear: 0, call: 0.3, cooldown: 3 },
  collisionInjury: { label: 'pedestrian struck', severity: 45, sight: 35, hear: 0, call: 0.85, cooldown: 0.5 },
  collisionMinor: { label: 'pedestrian knocked down', severity: 18, sight: 28, hear: 0, call: 0.5, cooldown: 0.5 },
  attackPolice: { label: 'officer attacked', severity: 70, sight: 0, hear: 0, call: 0, cooldown: 0.5 },
  evading: { label: 'failure to stop', severity: 22, sight: 0, hear: 0, call: 0, cooldown: 8 },
  resistArrest: { label: 'resisting arrest', severity: 25, sight: 0, hear: 0, call: 0, cooldown: 6 },
};
export interface CrimeRecord {
  id: number; type: CrimeType; severity: number; time: number; x: number; z: number; zone: string;
  suspect: { outfit: number; vehicleId: number; vehicleDesc: string; plate: string };
  witnesses: number[]; cameraId: string | null; confidence: number; reported: boolean;
  source: 'police' | 'camera' | 'witness' | 'guard' | null; pending: number;
}
export type AlertStatus = 'Unnoticed' | 'Witness Reporting' | 'Identified' | 'Pursuit' | 'Search' | 'Cooling';
export const TIER_HEAT = [0, 10, 30, 65, 110, 1e9];
export const SEARCH_TIME = [0, 16, 24, 34, 46, 60];
export const SEARCH_RADIUS = [0, 90, 130, 180, 230, 280];
const COLOR_NAMES: [number, string][] = [[0xd9482b, 'red'], [0x1f7a8c, 'teal'], [0xf2b134, 'yellow'], [0xe8e2d0, 'cream'], [0x3a4048, 'charcoal'], [0x2a9d6f, 'green'], [0x7c8cff, 'blue'], [0xc2456e, 'magenta'], [0x9aa7b0, 'silver'], [0xf0f0f0, 'white'], [0x2c3036, 'black'], [0x6a3d9a, 'purple'], [0x35e0d0, 'aqua'], [0xf4f6f8, 'white']];
export const colorName = (c: number) => COLOR_NAMES.find((n) => n[0] === c)?.[1] ?? 'grey';

export class Police {
  // --- alert state
  tier = 0; heat = 0; status: AlertStatus = 'Unnoticed';
  lastKnown = { x: 0, z: 0, vx: 0, vz: 0, t: -99 };
  searchR = 0; unseenT = 0; coolT = 0; seenNow = false; seenBy = '';
  /** Sight state from the last completed tick (stable for other systems and the HUD). */
  visible = false;
  identified = false; descKnown = false; knownOutfit = -1; knownVehicleId = -1; knownVehicleDesc = '';
  incidentStart = 0; budgetUsed = 0; forcedTier = 0; lastCrimeT = -99;
  records: CrimeRecord[] = [];
  units: Unit[] = [];
  // --- arrest negotiation
  detain = 0; detainOfficer = -1;
  // --- cameras
  cameraGroups = new Set<string>(['city']);
  disabledCameras = new Set<string>();
  cameraSees = new Map<string, number>(); // id -> seconds of continuous sight
  /** Restricted zones (missions): being seen inside by a camera/guard is trespass. */
  restricted: { x0: number; z0: number; x1: number; z1: number }[] = [];
  /** While a bluff holds, cameras do not flag the visitor as a trespasser. */
  graceUntil = 0;
  onArrest: (() => void) | null = null;
  stats = { crimes: 0, reported: 0, escapes: 0, arrests: 0 };
  private nextId = 1; private lastByType = new Map<string, number>();
  private tierAnnounced = 0;

  constructor(public sim: Sim) {
    sim.interactables.push({
      id: 'arrest-comply', x: 0, z: 0, r: 6, hold: 0.9, vehicleOk: true,
      label: () => (this.detain > 0 ? `Hold E — Comply with arrest (fine $${this.fineAmount()})` : null),
      use: () => this.arrest(),
    });
  }
  get pendingCalls() { let n = 0; for (const r of this.records) n += r.pending; return n; }
  fineAmount() { return 80 + this.tier * 120; }
  cameraYaw(c: CameraDef) { return c.yaw + Math.sin(this.sim.time * 0.45 + c.x) * c.sweep; }
  cameraActive(c: CameraDef) { return this.cameraGroups.has(c.group) && !this.disabledCameras.has(c.id); }
  private cameraCanSee(c: CameraDef, x: number, y: number, z: number) {
    if (!this.cameraActive(c)) return false;
    const d = Math.hypot(x - c.x, z - c.z);
    if (d > c.range) return false;
    if (Math.abs(angleDiff(Math.atan2(x - c.x, z - c.z), this.cameraYaw(c))) > c.fov) return false;
    // the lens sits just proud of its mast so the mount never blocks its own view
    const f = this.cameraYaw(c);
    return this.sim.losClear(c.x + Math.sin(f) * 0.5, c.y + 0.25, c.z + Math.cos(f) * 0.5, x, y, z);
  }
  inRestricted(x: number, z: number) { return this.restricted.some((r) => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1); }

  /** Something illegal just happened at (x,z). Evidence is created only through valid observers. */
  crime(type: CrimeType, x: number, z: number, opts: { vehicle?: Vehicle | null; source?: CrimeRecord['source']; scale?: number } = {}): CrimeRecord | null {
    const sim = this.sim, def = CRIMES[type];
    const last = this.lastByType.get(type) ?? -99;
    if (sim.time - last < def.cooldown) return null;
    this.lastByType.set(type, sim.time);
    const pv = opts.vehicle ?? sim.player.vehicle;
    const rec: CrimeRecord = {
      id: this.nextId++, type, severity: def.severity * (opts.scale ?? 1), time: sim.time, x, z, zone: ZONE_NAMES[zoneAt(x, z)],
      suspect: { outfit: sim.player.outfit, vehicleId: pv ? pv.id : -1, vehicleDesc: pv ? `${colorName(pv.color)} ${pv.spec.name}` : '', plate: pv ? pv.plate : '' },
      witnesses: [], cameraId: null, confidence: 0, reported: false, source: null, pending: 0,
    };
    this.records.push(rec); if (this.records.length > 40) this.records.shift();
    this.stats.crimes++; this.lastCrimeT = sim.time;
    const y = sim.player.y + 1.2;
    // 1) officers who can see the suspect or the scene
    if (opts.source === 'police' || opts.source === 'guard' || this.seenNow || this.visible || sim.dispatch.anyOfficerSees(x, y, z, 50)) { this.report(rec, opts.source ?? 'police', 1); return rec; }
    // 2) cameras
    for (const c of cameras) if (this.cameraCanSee(c, x, y, z)) { rec.cameraId = c.id; this.report(rec, 'camera', 0.85); return rec; }
    if (opts.source === 'camera') { this.report(rec, 'camera', 0.85); return rec; }
    // 3) civilian witnesses with a phone; the call takes 2-5 s and can be interrupted nonviolently
    if (def.call > 0) {
      const callers = sim.peds.witnessCrime(rec.id, x, z, def.sight, def.hear, def.call, 2);
      rec.witnesses = callers; rec.pending = callers.length;
    }
    return rec;
  }
  cancelCall(crimeId: number, pedId: number) {
    const r = this.records.find((c) => c.id === crimeId);
    if (r && r.pending > 0 && r.witnesses.includes(pedId)) r.pending--;
  }
  completeCall(crimeId: number, pedId: number, sawIt: boolean) {
    const r = this.records.find((c) => c.id === crimeId);
    if (!r || !r.witnesses.includes(pedId)) return;
    r.pending = Math.max(0, r.pending - 1);
    if (!r.reported) this.report(r, 'witness', sawIt ? 0.8 : 0.4);
  }
  /** A report reaches dispatch: add heat, record the description, set the investigation area. */
  report(rec: CrimeRecord, source: NonNullable<CrimeRecord['source']>, confidence: number) {
    if (rec.reported) return;
    const sim = this.sim;
    rec.reported = true; rec.source = source; rec.confidence = confidence;
    this.stats.reported++;
    if (this.tier === 0 && this.heat === 0) { this.incidentStart = sim.time; this.budgetUsed = 0; this.identified = false; this.descKnown = false; this.knownOutfit = -1; this.knownVehicleId = -1; }
    this.heat += rec.severity * (0.5 + 0.5 * confidence);
    if (confidence >= 0.6) {
      this.descKnown = true; this.knownOutfit = rec.suspect.outfit;
      if (rec.suspect.vehicleId >= 0) { this.knownVehicleId = rec.suspect.vehicleId; this.knownVehicleDesc = rec.suspect.vehicleDesc; }
    }
    if (source === 'police' || source === 'guard') this.identified = true;
    if (!this.seenNow) { this.lastKnown.x = rec.x; this.lastKnown.z = rec.z; this.lastKnown.vx = 0; this.lastKnown.vz = 0; this.lastKnown.t = sim.time; this.searchR = 55; }
    this.unseenT = Math.min(this.unseenT, 2); this.coolT = 0;
    this.retier();
    // dispatch chatter comes only from evidence actually held
    const desc = this.descKnown ? (rec.suspect.vehicleDesc ? `Suspect in a ${rec.suspect.vehicleDesc}, plate ${rec.suspect.plate}.` : `Suspect on foot, ${OUTFITS[rec.suspect.outfit].name.toLowerCase()}.`) : 'No description yet.';
    sim.bus.emit('subtitle', { speaker: 'Dispatch', text: `${source === 'camera' ? 'Camera flag' : source === 'witness' ? 'Caller reports' : 'Unit reports'} ${CRIMES[rec.type].label}, ${rec.zone}. ${desc}`, dur: 4.5 });
  }
  private retier() {
    let t = 0;
    while (t < 4 && this.heat >= TIER_HEAT[t + 1]) t++;
    t = Math.max(t, this.forcedTier);
    if (t !== this.tier) {
      const up = t > this.tier;
      this.tier = t;
      if (up && t > this.tierAnnounced) { this.tierAnnounced = t; this.sim.bus.emit('sfx', { name: 'alert_up' }); }
      this.sim.bus.emit('alertChanged', { tier: this.tier, status: this.status });
    }
  }
  /** Mission API: a scripted response level (e.g. the finale's Tier 3 search). */
  forceTier(tier: number, x: number, z: number) {
    const sim = this.sim;
    this.forcedTier = tier; this.heat = Math.max(this.heat, TIER_HEAT[Math.min(tier, 4)]);
    this.identified = true; this.descKnown = true; this.knownOutfit = sim.player.outfit; this.knownVehicleId = sim.player.vehicle ? sim.player.vehicle.id : -1;
    this.lastKnown.x = x; this.lastKnown.z = z; this.lastKnown.t = sim.time; this.searchR = 60; this.unseenT = 0; this.coolT = 0;
    if (this.tier === 0) { this.incidentStart = sim.time; this.budgetUsed = 0; }
    this.retier();
  }
  clear(reason: 'escaped' | 'arrest' | 'reset' = 'reset') {
    if (reason === 'escaped' && this.tier > 0) { this.stats.escapes++; this.sim.bus.emit('toast', { text: 'Alert cleared — you slipped the search', kind: 'good' }); this.sim.bus.emit('sfx', { name: 'alert_clear' }); }
    this.tier = 0; this.heat = 0; this.forcedTier = 0; this.status = 'Unnoticed'; this.unseenT = 0; this.coolT = 0; this.identified = false; this.descKnown = false;
    this.knownOutfit = -1; this.knownVehicleId = -1; this.detain = 0; this.tierAnnounced = 0; this.seenNow = false; this.visible = false;
    for (const r of this.records) r.pending = 0;
    this.sim.bus.emit('alertChanged', { tier: 0, status: this.status });
  }
  /** Would an officer at this range recognise the player right now? (vehicle / clothing changes matter) */
  recognises(dist: number): boolean {
    const p = this.sim.player;
    if (this.tier === 0) return false;
    if (this.sim.time - this.lastCrimeT < 2.5 || (p.lethalArmed && dist < 40)) return true;
    if (!this.descKnown) return dist < 10 && this.identified;
    if (p.vehicle) {
      if (p.vehicle.id === this.knownVehicleId) return dist < 75;
      return dist < 13 && this.knownOutfit === p.outfit;
    }
    if (this.knownOutfit === p.outfit) return dist < (this.knownVehicleId >= 0 && !this.identified ? 25 : 55);
    return dist < 8 && this.identified;
  }
  /** Called by units/cameras each tick they have recognised sight of the player. */
  sight(by: string) {
    const p = this.sim.player;
    this.seenNow = true; this.seenBy = by; this.identified = true; this.descKnown = true;
    this.knownOutfit = p.outfit; this.knownVehicleId = p.vehicle ? p.vehicle.id : this.knownVehicleId;
  }
  /** Low-threat arrest: fine, lose contraband, respawn at the substation. */
  arrest() {
    const sim = this.sim, p = sim.player;
    const fine = Math.min(sim.economy.cash, this.fineAmount());
    sim.economy.cash -= fine;
    p.inv.long = null; p.inv.ammo.smg = 0; p.inv.ammo.rifle = 0; p.inv.ammo.shell = 0; if (p.slot === 'long') p.slot = 'none';
    this.stats.arrests++;
    this.clear('arrest');
    sim.dispatch.standDown(true);
    p.respawn(ANCHORS.precinct.x, ANCHORS.precinct.z - 2.5, Math.PI, Math.max(p.health, 40));
    sim.bus.emit('arrested', { fine });
    sim.bus.emit('toast', { text: `Released from Glassline Substation. Fine paid: $${fine}. Long guns confiscated.`, kind: 'bad' });
    this.onArrest?.();
  }

  update(dt: number) {
    const sim = this.sim, p = sim.player;
    // cameras: continuous sight inside restricted zones is trespass; during an alert they also feed identification
    for (const c of cameras) {
      if (!this.cameraActive(c)) { this.cameraSees.delete(c.id); continue; }
      const sees = !p.downed && this.cameraCanSee(c, p.x, p.y + 1.2, p.z);
      const t = sees ? (this.cameraSees.get(c.id) ?? 0) + dt : 0;
      this.cameraSees.set(c.id, t);
      if (sees && t > 1.1 && sim.time > this.graceUntil && this.inRestricted(p.x, p.z)) this.crime('trespass', p.x, p.z, { source: 'camera' });
      if (sees && this.tier > 0 && this.recognises(Math.hypot(p.x - c.x, p.z - c.z))) this.sight('camera');
    }
    this.visible = this.seenNow;
    if (this.tier === 0) {
      this.status = this.pendingCalls > 0 ? 'Witness Reporting' : 'Unnoticed';
      this.seenNow = false; this.detain = 0;
      return;
    }
    const prev = this.status;
    if (this.seenNow) {
      this.unseenT = 0; this.coolT = 0;
      this.lastKnown.x = p.x; this.lastKnown.z = p.z; this.lastKnown.t = sim.time;
      const pv = p.vehicle; this.lastKnown.vx = pv ? pv.vx : p.body.vx; this.lastKnown.vz = pv ? pv.vz : p.body.vz;
      this.searchR = 55;
      this.status = this.tier >= 2 ? 'Pursuit' : 'Identified';
      // tier 1 is a stop attempt: driving or running off escalates
      if (this.tier === 1 && p.speed > 7.5 && sim.time - this.incidentStart > 3) this.crime('evading', p.x, p.z, { source: 'police' });
    } else {
      this.unseenT += dt;
      this.searchR = Math.min(SEARCH_RADIUS[this.tier], 55 + this.unseenT * 3.2);
      if (this.status !== 'Cooling') this.status = this.unseenT > 1.5 ? 'Search' : this.status === 'Unnoticed' || this.status === 'Witness Reporting' ? 'Search' : this.status;
      const outside = Math.hypot(p.x - this.lastKnown.x, p.z - this.lastKnown.z) > this.searchR;
      const need = SEARCH_TIME[this.tier];
      if (this.status === 'Search' && ((this.unseenT > need && outside) || this.unseenT > need * 1.7)) { this.status = 'Cooling'; this.coolT = 0; }
      if (this.status === 'Cooling') { this.coolT += dt; if (this.coolT > 6) { this.clear('escaped'); sim.dispatch.standDown(false); return; } }
    }
    if (this.detain > 0) {
      const it = sim.interactables.find((i) => i.id === 'arrest-comply')!;
      it.x = p.x; it.z = p.z;
    }
    if (prev !== this.status) sim.bus.emit('alertChanged', { tier: this.tier, status: this.status });
    this.seenNow = false; // units re-assert sight every tick
  }
}
