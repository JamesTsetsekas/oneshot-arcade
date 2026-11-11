import { describe, expect, it } from "vitest";
import {
  CHAIN_TIMEOUT, fareBreakdown, gradeFor, parTime, Pulse, rankFor, shiftAward, SHIFT_AWARD_CAP, Tailwind, tierForLength, TIER_MULTS,
} from "../src/sim/score/score";

describe("Pulse chain", () => {
  it("climbs 1x -> 2x -> 3x -> 5x through varied events", () => {
    const p = new Pulse();
    const kinds = ["nearMiss", "drift", "air", "oncoming", "shortcut"] as const;
    const seen = new Set<number>();
    for (let i = 0; i < 40; i++) {
      p.add(kinds[i % kinds.length], 300);
      seen.add(p.mult);
    }
    expect([...seen].sort((a, b) => a - b)).toEqual([...TIER_MULTS]);
  });

  it("decays after 3.5 s without an event", () => {
    const p = new Pulse();
    p.add("drift", 900);
    expect(p.mult).toBe(2);
    let ended = false;
    for (let t = 0; t < CHAIN_TIMEOUT - 0.1; t += 1 / 60) ended ||= p.step(1 / 60);
    expect(ended).toBe(false);
    for (let t = 0; t < 0.2; t += 1 / 60) ended ||= p.step(1 / 60);
    expect(ended).toBe(true);
    expect(p.mult).toBe(1);
  });

  it("a bump drops one tier, a hard crash resets", () => {
    const p = new Pulse();
    for (let i = 0; i < 12; i++) p.add(i % 2 ? "drift" : "air", 400);
    const tier = p.tier;
    expect(tier).toBeGreaterThanOrEqual(2);
    expect(p.collide(false)).toBe("drop");
    expect(p.tier).toBe(tier - 1);
    expect(p.collide(true)).toBe("reset");
    expect(p.tier).toBe(0);
    expect(p.count).toBe(0);
  });

  it("repeating one action yields diminishing charge (anti-farm)", () => {
    const farm = new Pulse();
    for (let i = 0; i < 30; i++) farm.add("nearMiss", 200);
    const varied = new Pulse();
    for (let i = 0; i < 30; i++) varied.add(i % 2 ? "nearMiss" : "drift", 200);
    expect(farm.charge).toBeLessThan(varied.charge * 0.3);
    expect(farm.tier).toBeLessThan(varied.tier);
  });

  it("multiplier applies to awarded points", () => {
    const p = new Pulse();
    p.add("drift", 1000);
    const r = p.add("air", 100);
    expect(r.mult).toBe(2);
    expect(r.points).toBe(200);
  });
});

describe("Tailwind", () => {
  it("lasts at most 2.2 s on a full meter and cannot recharge while active", () => {
    const t = new Tailwind();
    t.meter = 1;
    expect(t.step(1 / 60, true)).toBe("start");
    let time = 1 / 60;
    while (t.active && time < 5) {
      t.charge(0.5);
      t.step(1 / 60, true);
      time += 1 / 60;
    }
    expect(time).toBeLessThanOrEqual(2.25);
    expect(time).toBeGreaterThan(2.1);
  });
  it("needs a minimum charge", () => {
    const t = new Tailwind();
    t.meter = 0.1;
    expect(t.step(1 / 60, true)).toBe(null);
  });
});

describe("fares and grades", () => {
  it("grades by remaining patience", () => {
    expect(gradeFor(30, 40)).toBe("Blazing");
    expect(gradeFor(10, 40)).toBe("Blazing");
    expect(gradeFor(9, 40)).toBe("Fast");
    expect(gradeFor(4, 40)).toBe("Fast");
    expect(gradeFor(3, 40)).toBe("Close");
    expect(gradeFor(-1, 40)).toBe("Late");
    expect(gradeFor(-2.5, 40)).toBe("Failed");
  });
  it("par times respect tier ranges", () => {
    expect(tierForLength(300)).toBe("short");
    expect(tierForLength(600)).toBe("medium");
    expect(tierForLength(1200)).toBe("long");
    for (const len of [50, 300, 2000]) {
      const p = parTime(len, "short");
      expect(p).toBeGreaterThanOrEqual(20);
      expect(p).toBeLessThanOrEqual(35);
    }
    expect(parTime(3000, "long")).toBe(80);
  });
  it("shift-time awards follow grade + tier and are capped", () => {
    expect(shiftAward("Blazing", "long", 80)).toBeLessThanOrEqual(SHIFT_AWARD_CAP);
    expect(shiftAward("Blazing", "short", 30)).toBeGreaterThan(shiftAward("Close", "short", 30));
    expect(shiftAward("Fast", "long", 60) - shiftAward("Fast", "short", 60)).toBe(2);
    expect(shiftAward("Failed", "long", 80)).toBe(0);
  });
  it("fare breakdown sums its parts", () => {
    const b = fareBreakdown({ tier: "medium", grade: "Fast", timeLeft: 6, par: 40, tips: 520, precise: true, discovery: 1000 });
    expect(b.total).toBe(b.base + b.time + b.tips + b.accuracy + b.discovery + b.preference);
    const fail = fareBreakdown({ tier: "long", grade: "Failed", timeLeft: -3, par: 60, tips: 800, precise: false, discovery: 0 });
    expect(fail.base).toBe(0);
    expect(fail.total).toBe(400);
  });
  it("ranks", () => {
    expect(rankFor(60000, "arcade")).toBe("S");
    expect(rankFor(100, "arcade")).toBe("D");
  });
});
