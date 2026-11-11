import { describe, expect, it } from "vitest";
import { getWorld } from "../src/sim/world/city";
import { Session, type SessionConfig } from "../src/sim/session/session";
import { FixedStepper } from "../src/sim/session/stepper";
import { input, NO_INPUT } from "../src/sim/vehicle/input";
import { buildTrialChain, TRIALS } from "../src/sim/fares/fares";
import { autopilot } from "../src/sim/session/autopilot";

const w = getWorld();
const base: SessionConfig = { mode: "arcade", taxi: "breaker", seed: 7, traffic: "medium", crowd: 0.6 };

function startPlaying(s: Session) {
  while (s.phase === "countdown") s.step(NO_INPUT);
}

describe("session rules", () => {
  it("keeps at least five distributed fare candidates", () => {
    const s = new Session(w, base);
    expect(s.fares.candidates.length).toBeGreaterThanOrEqual(5);
    const tiers = new Set(s.fares.candidates.map((c) => c.tier));
    expect(tiers.has("short")).toBe(true);
    expect(tiers.has("medium")).toBe(true);
    expect(tiers.has("long")).toBe(true);
    const dests = new Set(s.fares.candidates.map((c) => c.dest.id));
    expect(dests.size).toBe(s.fares.candidates.length);
  });

  it("pickup requires a stop inside the ring; delivery awards fare and shift time", () => {
    const s = new Session(w, { ...base, traffic: "low", crowd: 0 });
    startPlaying(s);
    const c = s.fares.candidates[0];
    // drive-through at speed does not board
    s.v.x = c.pickup.x; s.v.z = c.pickup.z; s.v.vx = 12; s.v.vz = 0;
    s.step(NO_INPUT);
    expect(s.active).toBeNull();
    // stopped in the ring boards
    s.v.x = c.pickup.x; s.v.z = c.pickup.z; s.v.vx = 0; s.v.vz = 0; s.v.yaw = c.pickup.yaw;
    s.step(input({ brake: 1 }));
    expect(s.active?.fare.id).toBe(c.id);
    const clockBefore = s.clock;
    const scoreBefore = s.score;
    // teleport to the destination and stop
    const d = s.active!.fare.dest;
    s.v.x = d.x; s.v.z = d.z; s.v.y = w.heightAt(d.x, d.z); s.v.vx = 0; s.v.vz = 0;
    const evs: string[] = [];
    s.step(input({ brake: 1 }));
    evs.push(...s.drain().map((e) => e.type));
    expect(evs).toContain("deliver");
    expect(s.active).toBeNull();
    expect(s.score).toBeGreaterThan(scoreBefore + 1000);
    expect(s.clock).toBeGreaterThan(clockBefore + 5);
    expect(s.stats.deliveries).toBe(1);
    expect(s.fares.candidates.length).toBeGreaterThanOrEqual(5);
  });

  it("a passenger bails after patience + 2 s grace", () => {
    const s = new Session(w, { ...base, traffic: "low", crowd: 0 });
    startPlaying(s);
    const c = s.fares.candidates[0];
    s.v.x = c.pickup.x; s.v.z = c.pickup.z; s.v.vx = 0; s.v.vz = 0;
    s.step(input({ brake: 1 }));
    expect(s.active).not.toBeNull();
    s.clock = 999;
    const types: string[] = [];
    for (let i = 0; i < 60 * (c.par + 3); i++) {
      s.step(input({ brake: 1 }));
      types.push(...s.drain().map((e) => e.type));
    }
    expect(types).toContain("fareFail");
    expect(s.active).toBeNull();
  });

  it("shift ends when the clock runs out and produces a rank", () => {
    const s = new Session(w, { ...base, traffic: "low", crowd: 0 });
    startPlaying(s);
    for (let i = 0; i < 60 * 61 && s.phase !== "done"; i++) s.step(NO_INPUT);
    expect(s.phase).toBe("done");
    expect(s.results?.rank).toBe("D");
  });

  it("idle handbrake spinning and Tailwind cannot farm score", () => {
    const s = new Session(w, { ...base, traffic: "low", crowd: 0 });
    startPlaying(s);
    s.tailwind.meter = 1;
    for (let i = 0; i < 60 * 40; i++) s.step(input({ steer: i % 60 < 30 ? 1 : -1, handbrake: i % 8 < 4, boost: true, throttle: 0.15 }));
    expect(s.score).toBe(0);
  });

  it("reset puts the taxi back on a road within 2 s with a 3 s clock penalty", () => {
    const s = new Session(w, { ...base, traffic: "low", crowd: 0 });
    startPlaying(s);
    s.v.x = 130; s.v.z = 60; // middle of a block
    const clock = s.clock;
    let frames = 0;
    while (frames < 120) {
      s.step(input({ reset: true }));
      frames++;
      if (s.drain().some((e) => e.type === "reset")) break;
    }
    expect(frames).toBeLessThan(120);
    const ne = w.nearestEdge(s.v.x, s.v.z)!;
    expect(ne.dist).toBeLessThan(ne.edge.halfWidth);
    expect(s.clock).toBeLessThan(clock - 2.9);
  });

  it("driving into the sea splashes and respawns on a road", () => {
    const s = new Session(w, { ...base, traffic: "low", crowd: 0 });
    startPlaying(s);
    s.v.x = 300; s.v.z = -490; s.v.y = -2;
    const types: string[] = [];
    for (let i = 0; i < 120; i++) { s.step(NO_INPUT); types.push(...s.drain().map((e) => e.type)); }
    expect(types).toContain("splash");
    expect(types).toContain("reset");
    expect(w.waterAt(s.v.x, s.v.z)).toBeNull();
  });

  it("is deterministic and frame-rate independent", () => {
    const script = (tick: number) => input({ throttle: tick % 400 < 300 ? 1 : 0, steer: Math.sin(tick / 50) * 0.8, handbrake: tick % 300 === 150 });
    const run = (frameDt: number[]) => {
      const s = new Session(w, base);
      const st = new FixedStepper();
      let i = 0;
      while (s.tick < 1500) {
        st.advance(frameDt[i++ % frameDt.length], () => { if (s.tick < 1500) s.step(script(s.tick)); });
      }
      while (s.tick > 1500) break;
      return s.hash();
    };
    const h60 = run([1 / 60]);
    const h144 = run([1 / 144]);
    const hJitter = run([1 / 30, 1 / 90, 1 / 45, 1 / 120]);
    expect(h144).toBe(h60);
    expect(hJitter).toBe(h60);
  });

  it("time trial chains are fixed by seed", () => {
    for (const t of TRIALS) {
      const a = buildTrialChain(w, t).map((f) => `${f.pickup.id}->${f.dest.id}:${f.par}`);
      const b = buildTrialChain(w, t).map((f) => `${f.pickup.id}->${f.dest.id}:${f.par}`);
      expect(a.length).toBe(3);
      expect(a).toEqual(b);
    }
  });

  it("an autopilot can complete real fares through city traffic", () => {
    const s = new Session(w, { ...base, traffic: "low", crowd: 0.4, seed: 11 });
    startPlaying(s);
    s.clock = 900;
    for (let i = 0; i < 60 * 240 && s.stats.deliveries < 2; i++) s.step(autopilot(s));
    expect(s.stats.deliveries).toBeGreaterThanOrEqual(1);
  }, 60000);
});
