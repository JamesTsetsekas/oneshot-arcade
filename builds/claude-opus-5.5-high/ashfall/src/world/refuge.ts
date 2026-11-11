import { Rng } from "../core/rng";
import type { Difficulty } from "../data/types";
import { ZoneBuilder, composePack } from "./builder";
import { FLOOR, ROAD, type ZoneData } from "./types";

/** Ember Refuge — a handcrafted single-chunk safe hub. */
export function generateRefuge(seed: number, difficulty: Difficulty): ZoneData {
  const W = 46, H = 38;
  const zb = new ZoneBuilder("refuge", "Ember Refuge", "refuge", W, H, seed, difficulty, 1);
  zb.rect(3, 3, W - 6, H - 6, FLOOR);
  // roads
  zb.rect(22, 18, 21, 3, ROAD); // to east gate
  zb.rect(21, 6, 3, 26, ROAD);
  zb.rect(5, 18, 17, 3, ROAD);
  // east gate opening
  zb.rect(W - 3, 17, 3, 5, ROAD);
  // palisade ring
  for (let x = 3; x < W - 3; x += 2) { zb.prop("palisade", x + 1, 2.6, 0, 1); zb.prop("palisade", x + 1, H - 2.6, 0, 1); }
  for (let y = 3; y < H - 3; y += 2) { zb.prop("palisade", 2.6, y + 1, Math.PI / 2, 1); if (y < 16 || y > 21) zb.prop("palisade", W - 2.6, y + 1, Math.PI / 2, 1); }
  // bonfire
  zb.prop("bonfire", 22.5, 19.5, 0, 1.3, true);
  zb.light(22.5, 19.5, "#ff9a40", 2.0, 16);
  // NPCs and services
  zb.interact("npc", 19.5, 15.5, "Marshal Ivra", { npc: "ivra" });
  zb.interact("npc", 11.5, 9.5, "Odo the Trader", { npc: "odo" });
  zb.prop("cart", 9, 8, 0.3, 1, true);
  zb.prop("tent", 13.5, 6.5, 0, 1.2, true);
  zb.interact("npc", 11.5, 28.5, "Sister Wren", { npc: "wren" });
  zb.prop("tent", 9, 30, 0.8, 1.2, true);
  zb.interact("stash", 27.5, 13.5, "Warden's Stash");
  zb.interact("npc", 32.5, 26.5, "Calder the Artificer", { npc: "calder", requires: "artificer_rescued" });
  zb.prop("anvil", 34.5, 27.5, 0.4, 1, true);
  zb.interact("waypoint", 22.5, 27.5, "Refuge Waypoint", { wp: "refuge" });
  zb.interact("exit", W - 2, 19.5, "Gate to the Soot March", { to: "march", entry: "start" });
  zb.interact("exit", 4.2, 19.5, "Training Cell", { to: "training", entry: "start" });
  zb.prop("arch", 3.5, 19.5, Math.PI / 2, 1);
  zb.interact("hunt_portal", 31.5, 9.5, "Target Hunt Portal", { requires: "act_complete" });
  // dummies
  for (const [x, y] of [[36.5, 31.5], [39.5, 30.5], [38.5, 33.5]]) zb.interact("dummy_spawner", x, y, "Training Dummy", { dummy: true });
  // decor
  zb.prop("banner", 18, 13, 0, 1); zb.prop("banner", 27, 22, 0, 1);
  zb.prop("torch", 20, 17); zb.prop("torch", 25, 22); zb.prop("torch", 41, 16); zb.prop("torch", 41, 23); zb.prop("torch", 12, 12); zb.prop("torch", 30, 25);
  zb.light(41, 19.5, "#ff9050", 1.0, 8);
  zb.light(12, 10, "#ffa060", 0.9, 8);
  zb.light(32, 26, "#ffb060", 0.9, 8);
  zb.light(22.5, 27.5, "#50f0ff", 1.2, 8);
  zb.prop("well", 30, 18, 0, 1, true);
  zb.prop("tent", 36, 8, 2.4, 1.1, true); zb.prop("tent", 7, 14, 1.6, 1, true);
  zb.prop("deadtree", 6, 33, 0, 1.2, true); zb.prop("deadtree", 40, 5, 0, 1.3, true);
  zb.entries.start = { x: 22.5, y: 23.5 };
  zb.entries.gate = { x: W - 5, y: 19.5 };
  zb.entries.waypoint = { x: 22.5, y: 25.5 };
  zb.entries.training = { x: 6.5, y: 19.5 };
  zb.entries.portal = { x: 31.5, y: 11.5 };
  const z = zb.build();
  z.safe = true;
  return z;
}

/** Training Cell — dummies and summonable enemies, no loot or XP. */
export function generateTraining(seed: number, difficulty: Difficulty): ZoneData {
  const zb = new ZoneBuilder("training", "Training Cell", "archive", 30, 26, seed, difficulty, 1);
  zb.rect(3, 3, 24, 20, FLOOR);
  zb.entries.start = { x: 6.5, y: 13.5 };
  zb.interact("exit", 3.6, 13.5, "Back to Ember Refuge", { to: "refuge", entry: "training" });
  zb.interact("dummy_spawner", 9.5, 6.5, "Drill Bell", { drill: true });
  for (const [x, y] of [[18.5, 9.5], [21.5, 13.5], [18.5, 17.5]]) zb.interact("dummy_spawner", x, y, "Training Dummy", { dummy: true });
  for (const [x, y] of [[4, 4], [26, 4], [4, 22], [26, 22]]) zb.prop("candles", x, y);
  zb.light(15, 13, "#ffc080", 1.2, 16);
  const z = zb.build();
  z.safe = true;
  return z;
}

/** Target Hunt: a short seeded route to a defeated boss. */
export function generateHunt(seed: number, difficulty: Difficulty, boss: "tollkeeper" | "engine"): ZoneData {
  const rng = Rng.from(seed, "hunt", boss, difficulty);
  const vet = difficulty === "veteran";
  const level = boss === "tollkeeper" ? (vet ? 18 : 6) : (vet ? 24 : 13);
  const theme = boss === "tollkeeper" ? "march" : "archive";
  const W = 40, H = 64;
  const zb = new ZoneBuilder(boss === "tollkeeper" ? "hunt_toll" : "hunt_engine", boss === "tollkeeper" ? "Target Hunt — Toll Road" : "Target Hunt — Engine Vault", theme, W, H, seed, difficulty, level);
  zb.rect(14, 52, 12, 9, FLOOR);
  zb.entries.start = { x: 20.5, y: 57.5 };
  zb.interact("exit", 20.5, 59.8, "Return to Ember Refuge", { to: "refuge", entry: "portal" });
  const jog = rng.int(-5, 5);
  zb.corridor(20, 52, 20 + jog, 34, 4, ROAD, false);
  zb.rect(12 + jog, 34, 16, 10, FLOOR);
  zb.corridor(20 + jog, 34, 20, 20, 4, ROAD, false);
  const pool: [string, number][] = boss === "tollkeeper" ? [["ash_crawler", 2], ["soot_archer", 1.5], ["mire_hound", 1.5], ["bell_husk", 1]] : [["grave_scribe", 1], ["archive_warden", 1], ["quill_swarm", 1.5], ["censer_adept", 1]];
  const p = composePack(rng, pool, 6, 10, rng.chance(0.5), difficulty);
  zb.pack({ x: 20.5 + jog, y: 38.5, members: p.members, kind: p.members[0].elite ? "elite" : "normal", level, points: p.points });
  zb.circle(20, 14, boss === "tollkeeper" ? 9.5 : 13, FLOOR);
  zb.meta.arena = { x: 20, y: 14, r: boss === "tollkeeper" ? 9.5 : 13 };
  zb.pack({ x: 20, y: 13, members: [{ enemy: boss, boss: true }], kind: "boss", level: level + 2, points: 0, dormant: true });
  zb.light(20, 14, boss === "tollkeeper" ? "#ff7040" : "#40e0ff", 1.6, 18);
  zb.light(20, 38, "#ffa060", 1, 12);
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; zb.prop(theme === "march" ? "torch" : "crystal", 20 + Math.cos(a) * (zb.meta.arena.r - 0.4), 14 + Math.sin(a) * (zb.meta.arena.r - 0.4), a, 1); }
  zb.meta.hunt = boss;
  return zb.build();
}
