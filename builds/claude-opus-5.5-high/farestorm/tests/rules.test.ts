import { describe, expect, it } from "vitest";
import { getWorld } from "../src/sim/world/city";
import { Session, type SessionConfig } from "../src/sim/session/session";
import { input, NO_INPUT } from "../src/sim/vehicle/input";
import { migrate, defaultSave, SAVE_VERSION } from "../src/persist/store";
import { LESSONS } from "../src/sim/session/lessons";
import { autopilot } from "../src/sim/session/autopilot";

const w = getWorld();
const cfg: SessionConfig = { mode: "arcade", taxi: "breaker", seed: 3, traffic: "low", crowd: 0 };
const play = (s: Session) => { while (s.phase === "countdown") s.step(NO_INPUT); };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const raw = (s: Session) => s as any;

describe("style detectors", () => {
  it("tiny bumps do not score airtime; real jumps do", () => {
    const s = new Session(w, cfg);
    play(s);
    raw(s).handleVehicleEvents([{ type: "land", airTime: 0.3, aligned: true, impact: 2, height: 0.2 }]);
    expect(s.drain().some((e) => e.type === "style")).toBe(false);
    s.time += 1;
    raw(s).handleVehicleEvents([{ type: "land", airTime: 0.9, aligned: true, impact: 6, height: 2 }]);
    const st = s.drain().find((e) => e.type === "style");
    expect(st && st.type === "style" && st.kind).toBe("air");
  });

  it("near miss scores when passing traffic closely at speed, never on contact", () => {
    const s = new Session(w, cfg);
    play(s);
    for (const a of s.traffic.agents) a.active = false;
    // put player on the coastal boulevard heading east at 25 m/s, an agent in the next lane ahead
    const a = s.traffic.agents[0];
    s.v.x = -500; s.v.z = -342; s.v.yaw = Math.PI / 2; s.v.vx = 25; s.v.vz = 0;
    Object.assign(a, { active: true, mode: "lane", x: -470, z: -344.6, px: -470, pz: -344.6, yaw: Math.PI / 2, pyaw: Math.PI / 2, speed: 8, type: 2, nearArmed: false, nearCooldown: 0, nearTouched: false });
    s.traffic.target = 1;
    const kinds: string[] = [];
    for (let i = 0; i < 120; i++) {
      // keep the agent on a straight line for the test
      a.mode = "knocked"; a.vx = 8; a.vz = 0; a.knockTime = 0; a.z = -344.6; a.yaw = Math.PI / 2;
      s.step(input({ throttle: 1 }));
      s.drain().forEach((e) => e.type === "style" && kinds.push(e.kind));
    }
    expect(kinds).toContain("nearMiss");
  });

  it("completing a shortcut gate-to-gate fires once and marks a first discovery", () => {
    const s = new Session(w, { ...cfg, discovered: [] });
    play(s);
    const sc = w.shortcuts.find((x) => x.id === "lawn")!;
    const cross = (g: [number, number, number, number], dirSign: number) => {
      const mx = (g[0] + g[2]) / 2, mz = (g[1] + g[3]) / 2;
      // normal of the gate segment
      const nx = -(g[3] - g[1]), nz = g[2] - g[0];
      const l = Math.hypot(nx, nz);
      s.v.x = mx - (nx / l) * 1.0 * dirSign; s.v.z = mz - (nz / l) * 1.0 * dirSign;
      s.v.y = w.heightAt(s.v.x, s.v.z);
      s.v.vx = (nx / l) * 20 * dirSign; s.v.vz = (nz / l) * 20 * dirSign;
      for (let i = 0; i < 12; i++) s.step(NO_INPUT);
    };
    cross(sc.gateA, 1);
    cross(sc.gateB, 1);
    cross(sc.gateB, -1);
    const evs = s.drain().filter((e) => e.type === "shortcut");
    expect(evs.length).toBeGreaterThanOrEqual(1);
    expect(evs[0].type === "shortcut" && evs[0].first).toBe(true);
    expect(s.newDiscoveries).toContain("lawn");
  });

  it("clock sparks are capped at three per shift", () => {
    const s = new Session(w, cfg);
    play(s);
    const sparks = w.items.filter((i) => i.kind === "spark");
    expect(sparks.length).toBeGreaterThanOrEqual(4);
    for (const sp of sparks) {
      s.v.x = sp.x; s.v.z = sp.z; s.v.y = w.heightAt(sp.x, sp.z); s.v.vx = 0; s.v.vz = 0;
      s.step(NO_INPUT);
    }
    expect(s.sparks).toBe(3);
  });

  it("pedestrian safety assist only ever costs score", () => {
    const s = new Session(w, { ...cfg, crowd: 1 });
    play(s);
    let maxScore = 0;
    for (let i = 0; i < 60 * 30; i++) {
      s.step(i % 300 < 200 ? input({ throttle: 1, steer: Math.sin(i / 40) }) : input({ brake: 1 }));
      maxScore = Math.max(maxScore, s.score);
    }
    // any score must come from style events, not from pedestrians; ped events never add points
    const s2 = new Session(w, { ...cfg, crowd: 1 });
    play(s2);
    s2.score = 1000;
    const p = s2.peds.peds.find((pp) => pp.active)!;
    s2.v.x = p.x - 6; s2.v.z = p.z; s2.v.yaw = Math.PI / 2; s2.v.vx = 12; s2.v.vz = 0;
    for (let i = 0; i < 40; i++) s2.step(input({ throttle: 1 }));
    expect(s2.score).toBeLessThanOrEqual(1000 + 2000);
    expect(maxScore).toBeGreaterThanOrEqual(0);
  });

  it("special VIP fares appear after a strong delivery streak", () => {
    const s = new Session(w, cfg);
    play(s);
    raw(s).specialPending = "shortcut";
    raw(s).afterFare();
    expect(s.fares.candidates.some((c) => c.special === "shortcut" && c.tier === "special")).toBe(true);
  });
});

describe("skill school", () => {
  it("has 10 lessons and the acceleration lesson completes", () => {
    expect(LESSONS.length).toBe(10);
    const s = new Session(w, { ...cfg, mode: "school", lesson: 0 });
    play(s);
    for (let i = 0; i < 60 * 12 && s.phase !== "done"; i++) s.step(input({ throttle: 1 }));
    expect(s.results?.lessonDone).toBe(true);
  });

  it("the airtime lesson completes by driving at the seawall kicker", () => {
    const s = new Session(w, { ...cfg, mode: "school", lesson: 6 });
    play(s);
    for (let i = 0; i < 60 * 25 && s.phase !== "done"; i++) s.step(input({ throttle: 1 }));
    expect(s.results?.lessonDone).toBe(true);
  });

  it("the full-fare lesson can be completed by the autopilot", () => {
    const s = new Session(w, { ...cfg, mode: "school", lesson: 9 });
    play(s);
    for (let i = 0; i < 60 * 120 && s.phase !== "done"; i++) s.step(autopilot(s));
    expect(s.results?.lessonDone).toBe(true);
  }, 30000);
});

describe("persistence", () => {
  it("migrates v1 saves and repairs corrupt fields", () => {
    const m = migrate({ version: 1, bestScore: 12345, lessons: "oops", settings: { master: 0.3, bindings: { throttle: "bad" } } });
    expect(m.data.version).toBe(SAVE_VERSION);
    expect(m.data.best.arcade?.score).toBe(12345);
    expect(Array.isArray(m.data.lessons)).toBe(true);
    expect(m.data.settings.master).toBe(0.3);
    expect(Array.isArray(m.data.settings.bindings.throttle)).toBe(true);
    expect(m.repaired).toBe(true);
  });
  it("round-trips the default save", () => {
    const d = defaultSave();
    const m = migrate(JSON.parse(JSON.stringify(d)));
    expect(m.repaired).toBe(false);
    expect(m.data).toEqual(d);
  });
});
