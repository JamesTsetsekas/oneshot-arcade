// The headless game simulation: owns every gameplay system and advances them on a fixed 60 Hz step.
// No rendering, audio or DOM here, so the whole loop is testable in Node.
import { Physics, DT, RAPIER, GRP_WORLD, DYN_SPECS } from '../physics/physics';
import { Bus } from '../core/events';
import { Rng, clamp, smoothstep, approach, quatFromYaw } from '../core/math';
import { VehicleSystem, Vehicle } from '../vehicles/vehicle';
import { Player, PlayerInput, emptyInput, Interactable, OUTFITS } from '../character/player';
import { Actors } from '../character/actors';
import { Traffic } from '../traffic/traffic';
import { Pedestrians } from '../pedestrians/pedestrians';
import { Police } from '../police/police';
import { Dispatch } from '../police/units';
import { Signals } from '../world/roads';
import { MissionRunner, MissionDef, Progress } from '../missions/graph';
import { STORY, STORY_ORDER, GIVER_ANCHOR, makeCourier, makeCircuit, makeRecovery } from '../missions/data';
import { ANCHORS, surfaceY, WATER_Y } from '../world/district';
import { dynProps, cameras, WAREHOUSE } from '../world/lots';
import { WEAPONS, AMMO_PRICES, LIMITS, AmmoType, defaultInventory, Inventory } from '../character/weapons';

export const DAY_SECONDS = 2700; // one afternoon-to-night cycle in 45 minutes
export const START_HOUR = 14, END_HOUR = 24;
export class Clock {
  t = 0; paused = false;
  get hour() { return START_HOUR + (Math.min(this.t, DAY_SECONDS) / DAY_SECONDS) * (END_HOUR - START_HOUR); }
  get night() { return smoothstep(18.7, 20.3, this.hour); }
  get sunset() { return smoothstep(17.2, 19.0, this.hour) * (1 - smoothstep(19.6, 20.6, this.hour)); }
  advanceTo(hour: number) { const t = ((hour - START_HOUR) / (END_HOUR - START_HOUR)) * DAY_SECONDS; if (t > this.t) this.t = t; }
  get label() { const h = this.hour % 24, hh = Math.floor(h), mm = Math.floor((h - hh) * 60); return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`; }
}
export interface Weather { forceRain: boolean | null; raining: boolean; rain: number; wetness: number }
export const TRUST_LEVELS = [0, 100, 250, 450, 700, 1000];
export interface ShopItem { id: string; label: string; price: number; detail: string; owned?: boolean; disabled?: string }
export interface SaveData {
  version: number; savedAt: number; playTime: number;
  player: { x: number; z: number; yaw: number; health: number; outfit: number; ownedOutfits: number[] };
  inv: Inventory; cash: number; trust: number; clock: number; forceRain: boolean | null; wetness: number;
  progress: Progress; owned: { type: string; color: number; x: number; z: number; yaw: number } | null;
  stats: Record<string, number>; seed: number;
}
export const SAVE_VERSION = 2;
const DOORS: Record<string, { x: number; y: number; z: number; hx: number; hy: number; hz: number; color: number }> = {
  'wh-side': { x: WAREHOUSE.sideDoor.x, y: 1.4, z: WAREHOUSE.sideDoor.z, hx: 0.16, hy: 1.5, hz: 1.35, color: 0x35685f },
};
export interface Gadget { kind: 'chirper' | 'smoke'; x: number; y: number; z: number; t: number; life: number; sx: number; sy: number; sz: number }
export type UiRequest = { kind: 'shop'; shop: 'mart' | 'supply' | 'clothing' | 'garage' } | { kind: 'safehouse' } | { kind: 'contact'; mission: string } | { kind: 'result' } | { kind: 'down' };

export class Sim {
  bus = new Bus();
  rng: Rng;
  time = 0; tick = 0; playTime = 0;
  vehicles: VehicleSystem; player: Player; actors: Actors; traffic: Traffic; peds: Pedestrians;
  police: Police; dispatch: Dispatch; signals = new Signals(); missions: MissionRunner;
  clock = new Clock();
  weather: Weather = { forceRain: null, raining: false, rain: 0, wetness: 0 };
  economy = { cash: 150, trust: 0 };
  interactables: Interactable[] = [];
  gadgets: Gadget[] = [];
  input: PlayerInput = emptyInput();
  view = { x: 0, y: 2, z: 0, fx: 0, fz: 1, external: false };
  godMode = false; damageScale = 1; toggleCrouch = false; steerSensitivity = 1;
  ownedOutfits = new Set<number>([0]);
  props: { kind: keyof typeof DYN_SPECS; body: RAPIER.RigidBody; idx: number }[] = [];
  doors = new Map<string, RAPIER.Collider>();
  autosaveWanted = ''; ui: ((r: UiRequest) => void) | null = null;
  activityOffers: MissionDef[] = [];
  private sched: { t: number; fn: () => void }[] = [];
  private propLive = new Map<number, RAPIER.RigidBody>();
  private propT = 0; private downT = 0; private offerSeed = 1;
  seed: number;

  constructor(public phys: Physics, seed = 1337) {
    this.seed = seed; this.rng = new Rng(seed);
    this.vehicles = new VehicleSystem(phys, this.bus);
    const s = ANCHORS.safehouse;
    this.player = new Player(this, s.x - 4, s.z - 0.5, Math.PI / 2);
    this.actors = new Actors(this);
    this.police = new Police(this);
    this.dispatch = new Dispatch(this);
    this.traffic = new Traffic(this);
    this.peds = new Pedestrians(this);
    this.missions = new MissionRunner(this);
    this.missions.onComplete = (r) => {
      if (r.id === 'circuit') {
        const p = this.missions.progress;
        if (!p.circuitBest || r.time < p.circuitBest) { p.circuitBest = r.time; p.ghost = this.missions.ghostSamples.slice(0, 2400); this.bus.emit('toast', { text: `New best circuit time ${r.time.toFixed(1)} s`, kind: 'good' }); }
      }
      this.refreshOffers(); this.ui?.({ kind: 'result' });
    };
    this.bus.on('vehicleImpact', (e) => {
      const v = this.player.vehicle;
      if (v && e.vehicleId === v.id) {
        this.player.stats.crashes++;
        this.bus.emit('shake', { amount: clamp(e.dv / 14, 0.15, 1) });
        const thr = v.isMoto ? 5 : 9;
        if (e.dv > thr) this.player.takeDamage((e.dv - thr) * (v.isMoto ? 4 : 2.2), 'crash');
        if (v.isMoto && e.dv > 11 && !this.player.downed) { const vx = v.vx, vz = v.vz; this.player.exitVehicle(true); this.player.body.knockDown(1.6, vx * 0.5, vz * 0.5); }
      }
      this.bus.emit('noise', { kind: 'crash', x: e.x, z: e.z, radius: clamp(e.dv * 3, 10, 30), byPlayer: e.byPlayer });
      this.bus.emit('sfx', { name: 'crash', x: e.x, y: e.y, z: e.z, vol: clamp(e.dv / 12, 0.2, 1) });
      this.bus.emit('vfx', { kind: 'sparks', x: e.x, y: e.y, z: e.z, n: Math.min(14, Math.round(e.dv)) });
    });
    this.bus.on('playerDown', () => { this.downT = 0; });
    this.registerWorldInteractables();
    this.refreshOffers();
  }
  static async create(seed = 1337): Promise<Sim> { return new Sim(await Physics.create(), seed); }

  // ------------------------------------------------------------------ helpers used across systems
  schedule(delay: number, fn: () => void) { this.sched.push({ t: this.time + delay, fn }); }
  requestAutosave(reason: string) { this.autosaveWanted = reason; }
  /** Line of sight through static geometry and active smoke clouds. */
  losClear(ax: number, ay: number, az: number, bx: number, by: number, bz: number): boolean {
    for (const g of this.gadgets) {
      if (g.kind !== 'smoke' || g.t < 0.5) continue;
      const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
      const t = clamp(((g.x - ax) * dx + (g.z - az) * dz) / l2, 0, 1);
      if (Math.hypot(ax + dx * t - g.x, az + dz * t - g.z) < 5.2) return false;
    }
    return this.phys.los(ax, ay, az, bx, by, bz);
  }
  /** Conservative "could the camera see this point" test used to keep spawns/despawns out of view. */
  isVisible(x: number, y: number, z: number): boolean {
    const v = this.view, dx = x - v.x, dz = z - v.z, d = Math.hypot(dx, dz);
    if (d > 330) return false;
    if (d > 4 && (dx * v.fx + dz * v.fz) / d < 0.42) return false;
    return this.phys.los(v.x, v.y, v.z, x, y, z);
  }
  get trustLevel() { let l = 0; while (l < 5 && this.economy.trust >= TRUST_LEVELS[l + 1]) l++; return l; }
  onPlayerVehicleChanged(_v: Vehicle | null) { /* hook for the presentation layer */ }
  spawnMissionVehicle(type: string, x: number, z: number, yaw: number, color?: number): Vehicle {
    for (const o of [...this.vehicles.list]) if (Math.hypot(o.x - x, o.z - z) < 5.5 && o.driver === 'none' && !o.ref && o !== this.player.ownedVehicle) this.vehicles.remove(o);
    return this.vehicles.spawn(type, x, z, yaw, color, surfaceY(x, z));
  }
  setDoor(id: string, open: boolean) {
    const d = DOORS[id]; if (!d) return;
    const cur = this.doors.get(id);
    if (open && cur) { this.phys.world.removeCollider(cur, false); this.doors.delete(id); this.bus.emit('sfx', { name: 'door', x: d.x, y: d.y, z: d.z }); }
    else if (!open && !cur) this.doors.set(id, this.phys.world.createCollider(RAPIER.ColliderDesc.cuboid(d.hx, d.hy, d.hz).setTranslation(d.x, d.y, d.z).setCollisionGroups(GRP_WORLD)));
  }
  resetDoors() { for (const id of [...this.doors.keys()]) this.setDoor(id, true); }
  closedDoors() { return [...this.doors.keys()].map((id) => DOORS[id]); }
  disableCameraGroup(group: string) { for (const c of cameras) if (c.group === group) this.police.disabledCameras.add(c.id); this.bus.emit('toast', { text: 'Camera feed cut', kind: 'good' }); }

  // ------------------------------------------------------------------ economy / shops
  shopItems(shop: 'mart' | 'supply' | 'clothing' | 'garage'): ShopItem[] {
    const p = this.player, inv = p.inv, out: ShopItem[] = [];
    if (shop === 'mart') {
      out.push({ id: 'medkit', label: 'Medkit', price: 90, detail: `Restores 60 health. Carrying ${inv.medkits}/${LIMITS.medkits}.`, disabled: inv.medkits >= LIMITS.medkits ? 'Full' : undefined });
      out.push({ id: 'chirper', label: 'Distraction chirper', price: 60, detail: `Nonlethal. Draws bystanders and guards to a noise. ${inv.chirper}/${LIMITS.chirper}.`, disabled: inv.chirper >= LIMITS.chirper ? 'Full' : undefined });
      out.push({ id: 'smoke', label: 'Smoke canister', price: 120, detail: `Nonlethal. Blocks sight lines for 14 s. ${inv.smoke}/${LIMITS.smoke}.`, disabled: inv.smoke >= LIMITS.smoke ? 'Full' : undefined });
    } else if (shop === 'supply') {
      out.push({ id: 'armor', label: 'Light armor plate', price: 300, detail: `Absorbs 70% of damage until worn out. ${Math.round(inv.armor)}/${LIMITS.armor}.`, disabled: inv.armor >= LIMITS.armor ? 'Full' : undefined });
      for (const w of Object.values(WEAPONS)) if (w.price > 0) {
        const have = inv.sidearm === w.id || inv.long === w.id;
        out.push({ id: 'w:' + w.id, label: `${w.name} (${w.lethal ? 'lethal' : 'nonlethal'})`, price: w.price, detail: w.blurb + (this.trustLevel < 1 ? ' Requires Trust 1.' : ''), owned: have, disabled: have ? 'Owned' : this.trustLevel < 1 ? 'Trust 1' : undefined });
      }
      const types = new Set<AmmoType>(['cell']);
      if (inv.sidearm) types.add(WEAPONS[inv.sidearm].ammo); if (inv.long) types.add(WEAPONS[inv.long].ammo);
      for (const t of types) out.push({ id: 'a:' + t, label: AMMO_PRICES[t].label, price: AMMO_PRICES[t].price, detail: `In reserve: ${inv.ammo[t]}` });
    } else if (shop === 'clothing') {
      OUTFITS.forEach((o, i) => out.push({ id: 'o:' + i, label: o.name, price: this.ownedOutfits.has(i) ? 0 : o.price, detail: i === p.outfit ? 'Wearing now' : this.ownedOutfits.has(i) ? 'Owned — change into it' : 'Changing clothes out of sight weakens a description', owned: this.ownedOutfits.has(i), disabled: i === p.outfit ? 'Worn' : undefined }));
    } else {
      const v = p.vehicle;
      if (!v) out.push({ id: 'none', label: 'Drive a vehicle into the bay', price: 0, detail: 'Repairs and resprays need a vehicle.', disabled: '—' });
      else {
        const dmg = 100 - Math.min(v.engine, v.hull), cost = Math.round(40 + dmg * 6);
        out.push({ id: 'repair', label: `Repair ${v.spec.name}`, price: cost, detail: `Engine ${Math.round(v.engine)}% · Body ${Math.round(v.hull)}%`, disabled: dmg < 1 && !v.wheels.some((w) => w.burst) ? 'No damage' : undefined });
        out.push({ id: 'respray', label: 'Respray + new plates', price: 180, detail: 'A different colour and plate breaks a vehicle description if nobody is watching.' });
        if (!v.owned && v.spec.cls !== 'police') out.push({ id: 'keep', label: `Register as your vehicle`, price: 600, detail: 'Papers, no questions. Replaces your current registered vehicle.', disabled: this.trustLevel < 2 ? 'Trust 2' : undefined });
      }
    }
    return out;
  }
  buy(shop: 'mart' | 'supply' | 'clothing' | 'garage', id: string): boolean {
    const item = this.shopItems(shop).find((i) => i.id === id), p = this.player, inv = p.inv;
    if (!item || item.disabled || this.economy.cash < item.price) { this.bus.emit('sfx', { name: 'deny' }); return false; }
    this.economy.cash -= item.price;
    if (id === 'medkit') inv.medkits++; else if (id === 'chirper') inv.chirper++; else if (id === 'smoke') inv.smoke++;
    else if (id === 'armor') inv.armor = LIMITS.armor;
    else if (id.startsWith('w:')) { const w = WEAPONS[id.slice(2)]; if (w.slot === 'sidearm') inv.sidearm = w.id; else inv.long = w.id; inv.mags[w.id] = w.mag; inv.ammo[w.ammo] += w.mag; }
    else if (id.startsWith('a:')) { const t = id.slice(2) as AmmoType; inv.ammo[t] += AMMO_PRICES[t].amount; }
    else if (id.startsWith('o:')) {
      const i = Number(id.slice(2)); this.ownedOutfits.add(i); p.outfit = i;
      if (this.police.tier > 0 && !this.police.visible) this.bus.emit('toast', { text: 'New look. The description on the radio no longer fits.', kind: 'good' });
    } else if (id === 'repair' && p.vehicle) p.vehicle.repair();
    else if (id === 'respray' && p.vehicle) {
      const v = p.vehicle, cols = v.spec.colors.filter((c) => c !== v.color);
      v.color = cols.length ? this.rng.pick(cols) : v.color; v.plate = v.plate.split('').reverse().join('').replace('-', '') .slice(0, 3) + '-' + String(100 + this.rng.int(0, 899));
      if (!this.police.visible && this.police.knownVehicleId === v.id) { this.police.knownVehicleId = -1; this.bus.emit('toast', { text: 'Fresh paint, fresh plates. Vehicle description cleared.', kind: 'good' }); }
    } else if (id === 'keep' && p.vehicle) { const old = p.ownedVehicle; if (old && old !== p.vehicle) { old.owned = false; old.persistent = false; } p.vehicle.owned = true; p.vehicle.stolen = true; p.ownedVehicle = p.vehicle; }
    this.bus.emit('sfx', { name: 'buy' });
    return true;
  }
  /** Safehouse rest: heal, clear the day back to afternoon, and request a manual save. */
  rest() {
    if (this.police.tier > 0) { this.bus.emit('toast', { text: 'You cannot rest while the search is on.', kind: 'bad' }); return false; }
    this.player.heal(100); this.clock.t = 0; this.weather.forceRain = null; this.weather.rain = 0; this.weather.wetness = 0;
    this.requestAutosave('rest');
    return true;
  }
  recallBike() {
    const b = ANCHORS.bikeSpot, p = this.player;
    const v = p.ownedVehicle && this.vehicles.list.includes(p.ownedVehicle) ? p.ownedVehicle : null;
    if (v && p.vehicle === v) return;
    if (v) { v.teleport(b.x, surfaceY(b.x, b.z), b.z, b.yaw); v.repair(); }
    else { const nv = this.spawnMissionVehicle('swift', b.x, b.z, b.yaw, 0xf2b134); nv.owned = true; nv.stolen = true; nv.persistent = true; p.ownedVehicle = nv; }
  }
  respawnAtSafehouse(charge: boolean) {
    const s = ANCHORS.safehouse;
    if (charge) { const fee = Math.min(this.economy.cash, 120); this.economy.cash -= fee; this.bus.emit('toast', { text: `Patched up at the Quay Clinic. Fee: $${fee}`, kind: 'bad' }); }
    this.police.clear('reset'); this.dispatch.standDown(true);
    this.player.respawn(s.x - 4, s.z - 0.5, Math.PI / 2, 100);
  }
  refreshOffers() { const s = this.offerSeed++; this.activityOffers = [makeCourier(s * 3 + 1), makeCourier(s * 3 + 2), makeRecovery(s), makeCircuit()]; }
  nextStory(): MissionDef | null { return STORY.find((m) => !this.missions.progress.completed[m.id]) ?? null; }
  startMission(def: MissionDef, replay = false): boolean {
    if (this.missions.busy) { this.bus.emit('toast', { text: 'Finish or abandon the current job first.', kind: 'info' }); return false; }
    if (this.police.tier > 0) { this.bus.emit('toast', { text: 'Lose the Alert before taking a job.', kind: 'info' }); return false; }
    if (replay && def.kind === 'story') { // clean authored loadout for replays; the main save keeps its own inventory
      this.replayStash = { inv: JSON.parse(JSON.stringify(this.player.inv)), cash: this.economy.cash };
      this.player.inv = defaultInventory();
    }
    return this.missions.start(def, replay);
  }
  replayStash: { inv: Inventory; cash: number } | null = null;

  private registerWorldInteractables() {
    const at = (id: string, a: { x: number; z: number }, r: number, label: () => string | null, use: () => void, vehicleOk = false) => this.interactables.push({ id, x: a.x, z: a.z, r, label, use, vehicleOk });
    const free = () => !this.missions.busy;
    at('shop-mart', ANCHORS.quayMart, 3, () => 'E — Shop at Quay Mart', () => this.ui?.({ kind: 'shop', shop: 'mart' }));
    at('shop-supply', ANCHORS.supply, 3, () => 'E — Shop at Harbor Supply', () => this.ui?.({ kind: 'shop', shop: 'supply' }));
    at('shop-clothing', ANCHORS.clothing, 3, () => 'E — Browse Thread & Tide', () => this.ui?.({ kind: 'shop', shop: 'clothing' }));
    at('shop-garage', ANCHORS.garage, 7, () => (this.player.vehicle ? 'E — Breakwater Auto: repair / respray' : 'E — Breakwater Auto & Marine'), () => this.ui?.({ kind: 'shop', shop: 'garage' }), true);
    at('safehouse', ANCHORS.safehouse, 3, () => 'E — Safehouse: rest, save, replay jobs', () => this.ui?.({ kind: 'safehouse' }));
    for (const who of ['depot', 'odalys'] as const) {
      at('contact-' + who, ANCHORS[who], 3.2, () => {
        const n = this.nextStory();
        if (!free() || !n || GIVER_ANCHOR[n.id] !== who) return null;
        return `E — Talk to ${n.giver}: “${n.title}”`;
      }, () => { const n = this.nextStory(); if (n) this.ui?.({ kind: 'contact', mission: n.id }); });
    }
  }

  // ------------------------------------------------------------------ save / load
  serialize(): SaveData {
    const p = this.player, ov = p.ownedVehicle && this.vehicles.list.includes(p.ownedVehicle) ? p.ownedVehicle : null;
    const s = ANCHORS.safehouse;
    // only ever save a safe on-foot spot: current position if calm and grounded, else the safehouse door
    const calm = !p.vehicle && p.body.grounded && this.police.tier === 0 && !p.downed && !this.missions.busy && p.body.y > WATER_Y;
    return {
      version: SAVE_VERSION, savedAt: Date.now(), playTime: this.playTime, seed: this.seed,
      player: { x: calm ? p.body.x : s.x, z: calm ? p.body.z : s.z - 0.5, yaw: calm ? p.body.yaw : 0, health: Math.max(30, p.health), outfit: p.outfit, ownedOutfits: [...this.ownedOutfits] },
      inv: JSON.parse(JSON.stringify(this.replayStash ? this.replayStash.inv : p.inv)), cash: this.economy.cash, trust: this.economy.trust,
      clock: this.clock.t, forceRain: this.weather.forceRain, wetness: this.weather.wetness,
      progress: JSON.parse(JSON.stringify(this.missions.progress)),
      owned: ov ? { type: ov.spec.id, color: ov.color, x: ov.x, z: ov.z, yaw: ov.yaw } : null,
      stats: { ...p.stats, crimes: this.police.stats.crimes, escapes: this.police.stats.escapes, arrests: this.police.stats.arrests },
    };
  }
  applySave(d: SaveData) {
    const p = this.player;
    p.respawn(d.player.x, d.player.z, d.player.yaw, d.player.health);
    p.outfit = d.player.outfit; this.ownedOutfits = new Set(d.player.ownedOutfits);
    p.inv = JSON.parse(JSON.stringify(d.inv)); this.economy.cash = d.cash; this.economy.trust = d.trust;
    this.clock.t = d.clock; this.weather.forceRain = d.forceRain; this.weather.wetness = d.wetness; this.weather.rain = d.forceRain ? 1 : 0;
    this.missions.progress = JSON.parse(JSON.stringify(d.progress)); this.playTime = d.playTime;
    Object.assign(p.stats, { shotsFired: d.stats.shotsFired ?? 0, civiliansHurt: d.stats.civiliansHurt ?? 0, crashes: d.stats.crashes ?? 0, distance: d.stats.distance ?? 0 });
    if (d.owned) { const v = this.spawnMissionVehicle(d.owned.type, d.owned.x, d.owned.z, d.owned.yaw, d.owned.color); v.owned = true; v.stolen = true; v.persistent = true; p.ownedVehicle = v; }
  }
  /** Populate the streets around the player (new game / after load). */
  prewarm() {
    this.view.x = this.player.x; this.view.z = this.player.z;
    this.traffic.prewarm(); this.peds.prewarm();
    for (let i = 0; i < 30; i++) this.step();
  }

  // ------------------------------------------------------------------ the fixed step
  step(dt: number = DT) {
    this.time += dt; this.tick++; this.playTime += dt;
    const p = this.player;
    if (!this.clock.paused) this.clock.t = Math.min(DAY_SECONDS, this.clock.t + dt);
    const w = this.weather;
    w.raining = w.forceRain ?? this.clock.hour >= 21.3;
    w.rain = approach(w.rain, w.raining ? 1 : 0, dt * 0.06);
    w.wetness = approach(w.wetness, w.rain > 0.2 ? 1 : 0, dt * (w.rain > 0.2 ? 0.05 : 0.012));
    this.vehicles.wetness = w.wetness;
    this.signals.update(dt);
    for (let i = this.sched.length - 1; i >= 0; i--) if (this.sched[i].t <= this.time) { const f = this.sched[i].fn; this.sched.splice(i, 1); f(); }
    if (!this.view.external) { this.view.x = p.x - Math.sin(this.input.camYaw) * 4; this.view.z = p.z - Math.cos(this.input.camYaw) * 4; this.view.y = p.y + 2; this.view.fx = Math.sin(this.input.camYaw); this.view.fz = Math.cos(this.input.camYaw); }

    p.update(this.input, dt);
    this.traffic.update(dt);
    this.peds.update(dt);
    this.actors.update(dt);
    this.dispatch.update(dt);
    this.police.update(dt);
    this.missions.update(dt);
    this.updateGadgets(dt);

    this.vehicles.preStep(dt);
    this.phys.step();
    this.vehicles.postStep(dt);
    p.body.sync(); this.actors.sync();
    this.characterVehicleContacts();
    if (this.tick % 20 === 0) this.streamProps();

    // incapacitated outside a mission: clinic respawn after a beat (missions show Retry/Abandon instead)
    if (p.downed) { this.downT += dt; if (this.downT > 3.2 && !this.missions.busy) this.respawnAtSafehouse(true); else if (this.downT > 1.5 && this.missions.busy && this.downT - dt <= 1.5) this.ui?.({ kind: 'down' }); }
    // a replayed story mission returns the main save's inventory when it ends
    if (this.replayStash && !this.missions.busy) { p.inv = this.replayStash.inv; this.replayStash = null; }
    // edge inputs are consumed once per step
    const i = this.input; i.jump = i.interact = i.enterExit = i.firePressed = i.reload = i.melee = i.gadget = i.gadgetCycle = i.medkit = i.holster = false; i.slot = -1;
  }
  private updateGadgets(dt: number) {
    for (let k = this.gadgets.length - 1; k >= 0; k--) {
      const g = this.gadgets[k], before = g.t; g.t += dt;
      if (before < 0 && g.t >= 0) { this.bus.emit('sfx', { name: g.kind === 'smoke' ? 'smoke' : 'chirp', x: g.x, y: g.y, z: g.z }); if (g.kind === 'smoke') this.bus.emit('vfx', { kind: 'smokebomb', x: g.x, y: g.y + 0.5, z: g.z, n: 40 }); }
      if (g.t >= 0 && g.kind === 'chirper' && Math.floor(g.t) !== Math.floor(before)) { this.bus.emit('noise', { kind: 'chirper', x: g.x, z: g.z, radius: 22, byPlayer: true }); this.bus.emit('sfx', { name: 'chirp', x: g.x, y: g.y, z: g.z }); }
      if (g.t >= 0 && g.kind === 'smoke' && this.tick % 12 === 0) this.bus.emit('vfx', { kind: 'smokebomb', x: g.x, y: g.y + 0.5, z: g.z, n: 6 });
      if (g.t > g.life) this.gadgets.splice(k, 1);
    }
  }
  /** Vehicles pass through character capsules physically; contact is resolved here (push or knock down). */
  private characterVehicleContacts() {
    const p = this.player;
    const test = (b: { x: number; y: number; z: number }, skip: Vehicle | null, hit: (v: Vehicle, sp: number) => void, push: (dx: number, dz: number) => void) => {
      for (const v of this.vehicles.list) {
        if (v === skip || v.asleep) continue;
        const dx = b.x - v.x, dz = b.z - v.z;
        if (dx * dx + dz * dz > 49 || Math.abs(v.y - b.y) > 2.2) continue;
        const c = Math.cos(v.yaw), s = Math.sin(v.yaw), lx = dx * c - dz * s, lz = dx * s + dz * c;
        const hw = v.spec.width / 2 + 0.3, hl = v.spec.length / 2 + 0.3;
        if (Math.abs(lx) > hw || Math.abs(lz) > hl) continue;
        const toward = v.speedAbs > 0.1 ? (v.vx * dx + v.vz * dz) / (Math.hypot(dx, dz) * v.speedAbs + 1e-6) : 0;
        if (v.speedAbs > 3.5 && toward > 0.2) hit(v, v.speedAbs);
        else if (v.speedAbs > 0.6) { const side = lx >= 0 ? 1 : -1, d = hw - Math.abs(lx) + 0.02; push(c * side * d, -s * side * d); }
        return;
      }
    };
    if (!p.vehicle && !p.downed && p.body.state !== 'mantle') {
      test(p.body, null, (v, sp) => {
        if (p.body.state === 'down') return;
        p.body.knockDown(1.5, v.vx * 0.7, v.vz * 0.7); p.takeDamage((sp - 3) * 5.5, 'vehicle');
        this.bus.emit('sfx', { name: 'thud', x: p.x, y: p.y + 1, z: p.z });
      }, (dx, dz) => p.body.teleport(p.body.x + dx, p.body.y, p.body.z + dz));
    }
    for (const a of this.actors.list) {
      if (a.dead || a.inVehicle || a.body.state === 'down') continue;
      test(a.body, a.unit?.vehicle ?? null, (v, sp) => {
        const byPlayer = v.driver === 'player';
        a.body.knockDown(2.5, v.vx * 0.6, v.vz * 0.6); a.stunT = Math.max(a.stunT, sp > 10 ? 20 : 4);
        if (sp > 12) a.hit(60, true, byPlayer); else if (byPlayer && a.faction === 'police') this.police.crime('attackPolice', a.x, a.z, { source: 'police', scale: 0.6 });
        this.bus.emit('sfx', { name: 'thud', x: a.x, y: a.y + 1, z: a.z });
      }, () => { /* officers hold their ground against creeping vehicles */ });
    }
  }
  /** Dynamic props (bins, crates, cones, barriers) exist physically only near the player. */
  private streamProps() {
    const px = this.player.x, pz = this.player.z;
    dynProps.forEach((d, idx) => {
      const dist = Math.hypot(d.x - px, d.z - pz), live = this.propLive.get(idx);
      if (!live && dist < 85 && this.propLive.size < 70) {
        const body = this.phys.addDynProp(d.kind, d.x, surfaceY(d.x, d.z), d.z, d.yaw);
        this.propLive.set(idx, body); this.props.push({ kind: d.kind, body, idx });
      } else if (live && dist > 115) {
        this.phys.world.removeRigidBody(live); this.propLive.delete(idx);
        const i = this.props.findIndex((q) => q.idx === idx); if (i >= 0) this.props.splice(i, 1);
      }
    });
  }
}
export { STORY, STORY_ORDER, quatFromYaw };
