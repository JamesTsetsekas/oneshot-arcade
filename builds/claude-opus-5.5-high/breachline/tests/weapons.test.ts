import { describe, it, expect } from "vitest";
import { computeStats, newArms, stepArms, ArmsEvent, ArmsInput } from "../src/shared/weapon-sim";
import { WEAPONS, PRIMARY_IDS, SIDEARM_IDS, damageAtRange, zoneMultiplier } from "../src/content/weapons";
import { Rng } from "../src/shared/math";

const DT = 1 / 60;
const idle: ArmsInput = { fire: false, ads: false, reload: false, slot: 0, mode: false, melee: false, inspect: false };
const ctx = (o = {}) => ({ dt: DT, sprinting: false, speedFrac: 0, crouch: false, onGround: true, busy: false, rng: new Rng(1), ...o });

function armsFor(id: string, atts: string[] = []) {
  const prim = WEAPONS[id].slot === "primary" ? id : "jackal";
  const a = newArms(computeStats(prim, atts, []), computeStats(WEAPONS[id].slot === "sidearm" ? id : "relay", [], []));
  if (WEAPONS[id].slot === "sidearm") { a.active = 1; }
  return a;
}

describe("weapon state machine", () => {
  it("fires each automatic weapon at its RPM", () => {
    for (const id of ["jackal", "kestrel", "anchor", "cinder"]) {
      const a = armsFor(id);
      const slot = WEAPONS[id].slot === "sidearm" ? 1 : 0;
      const w = a.weapons[slot];
      w.ammo = 999;
      let shots = 0;
      for (let t = 0; t < 120; t++) { const ev: ArmsEvent[] = []; stepArms(a, { ...idle, fire: true, slot }, ctx(), ev); shots += ev.filter((e) => e.type === "shot").length; }
      const expected = (WEAPONS[id].rpm / 60) * 2;
      expect(Math.abs(shots - expected)).toBeLessThanOrEqual(expected * 0.12 + 1);
    }
  });

  it("semi-auto requires releasing the trigger and caps cadence", () => {
    const a = armsFor("mesa");
    let shots = 0;
    for (let t = 0; t < 60; t++) { const ev: ArmsEvent[] = []; stepArms(a, { ...idle, fire: true }, ctx(), ev); shots += ev.filter((e) => e.type === "shot").length; }
    expect(shots).toBe(1);
    shots = 0;
    for (let t = 0; t < 120; t++) { const ev: ArmsEvent[] = []; stepArms(a, { ...idle, fire: t % 2 === 0 }, ctx(), ev); shots += ev.filter((e) => e.type === "shot").length; }
    expect(shots).toBeLessThanOrEqual(13); // 360 RPM cap -> 12 in 2 s
  });

  it("consumes ammo and reloads through ordered stages; empty and tactical timings differ", () => {
    const a = armsFor("jackal");
    const w = a.weapons[0];
    const stages: string[] = [];
    while (w.ammo > 0) { const ev: ArmsEvent[] = []; stepArms(a, { ...idle, fire: true }, ctx(), ev); }
    let t = 0;
    for (; t < 300; t++) { const ev: ArmsEvent[] = []; stepArms(a, idle, ctx(), ev); for (const e of ev) if (e.type === "reload") stages.push(`${e.kind}:${e.stage}`); if (!w.reload && w.ammo > 0) break; }
    expect(stages).toEqual(["empty:start", "empty:magOut", "empty:magIn", "empty:chamber", "empty:done"].slice(1));
    expect(w.ammo).toBe(30);
    expect(w.reserve).toBe(120 - 30);
    const s = computeStats("jackal", [], []);
    expect(s.reloadEmpty.total).toBeGreaterThan(s.reloadTac.total);
  });

  it("interrupting after magazine-in keeps the new magazine; before it keeps the old count", () => {
    for (const [cut, expectAmmo] of [[1.4, 30], [0.3, 10]] as const) {
      const a = armsFor("jackal");
      const w = a.weapons[0];
      w.ammo = 10;
      const ev: ArmsEvent[] = [];
      stepArms(a, { ...idle, reload: true }, ctx(), ev);
      for (let t = 0; t < cut * 60; t++) stepArms(a, idle, ctx(), []);
      stepArms(a, { ...idle, slot: 1 }, ctx(), []); // swap interrupts
      expect(a.weapons[0].reload).toBeNull();
      expect(a.weapons[0].ammo).toBe(expectAmmo);
    }
  });

  it("burst mode fires three rounds per trigger pull", () => {
    const a = armsFor("jackal");
    stepArms(a, { ...idle, mode: true }, ctx(), []);
    let shots = 0;
    for (let t = 0; t < 40; t++) { const ev: ArmsEvent[] = []; stepArms(a, { ...idle, fire: t < 3 }, ctx(), ev); shots += ev.filter((e) => e.type === "shot").length; }
    expect(shots).toBe(3);
  });

  it("cannot fire while sprinting or before sprint-to-fire elapses", () => {
    const a = armsFor("jackal");
    let ev: ArmsEvent[] = [];
    stepArms(a, { ...idle, fire: true }, ctx({ sprinting: true }), ev);
    expect(ev.some((e) => e.type === "shot")).toBe(false);
    ev = [];
    stepArms(a, { ...idle, fire: true }, ctx(), ev);
    expect(ev.some((e) => e.type === "shot")).toBe(false);
    for (let t = 0; t < 20; t++) stepArms(a, { ...idle, fire: true }, ctx(), ev);
    expect(ev.some((e) => e.type === "shot")).toBe(true);
  });

  it("ADS transitions within the 140-320 ms window and reduces spread", () => {
    for (const id of [...PRIMARY_IDS, ...SIDEARM_IDS]) {
      const s = computeStats(id, [], []);
      expect(s.adsTime).toBeGreaterThanOrEqual(0.14);
      expect(s.adsTime).toBeLessThanOrEqual(0.32);
      expect(s.ads.base).toBeLessThan(s.hip.base);
    }
  });

  it("falloff is monotonic and the Warden is lethal to head/upper only inside 45 m", () => {
    for (const id of [...PRIMARY_IDS, ...SIDEARM_IDS]) {
      const d = WEAPONS[id];
      let prev = Infinity;
      for (let r = 0; r < 120; r += 5) { const v = damageAtRange(d, r); expect(v).toBeLessThanOrEqual(prev + 1e-9); prev = v; }
    }
    const w = WEAPONS.warden;
    expect(damageAtRange(w, 40) * zoneMultiplier(w, "upper", 40)).toBeGreaterThanOrEqual(100);
    expect(damageAtRange(w, 40) * zoneMultiplier(w, "head", 40)).toBeGreaterThanOrEqual(100);
    expect(damageAtRange(w, 60) * zoneMultiplier(w, "upper", 60)).toBeLessThan(100);
    expect(damageAtRange(w, 60) * zoneMultiplier(w, "head", 60)).toBeLessThan(100);
    expect(damageAtRange(w, 10) * zoneMultiplier(w, "lower", 10)).toBeLessThan(100);
  });

  it("keeps full-auto body-shot time-to-kill above 150 ms at intended range", () => {
    for (const id of [...PRIMARY_IDS, ...SIDEARM_IDS]) {
      const d = WEAPONS[id];
      if (!d.modes.includes("auto")) continue;
      const per = damageAtRange(d, d.damage.nearRange * 0.5) * d.zones.upper;
      const shots = Math.ceil(100 / per);
      const ttk = (shots - 1) * (60 / d.rpm);
      expect(ttk).toBeGreaterThan(0.15);
    }
  });

  it("recoil kicks the view upward deterministically with seeded variance", () => {
    const run = (seed: number) => { const a = armsFor("jackal"); const out: number[] = []; for (let t = 0; t < 30; t++) { const ev: ArmsEvent[] = []; stepArms(a, { ...idle, fire: true }, { ...ctx(), rng: new Rng(seed) }, ev); for (const e of ev) if (e.type === "shot") out.push(e.shot.kick.pitch); } return out; };
    const a = run(5), b = run(5);
    expect(a).toEqual(b);
    expect(a.every((p) => p < 0)).toBe(true);
  });
});
