import type { Difficulty } from "../data/types";
import { generateArchive3, generateArchiveFloor } from "./archive";
import { generateMarch } from "./march";
import { generateHunt, generateRefuge, generateTraining } from "./refuge";
import type { ZoneData, ZoneId } from "./types";

export const ZONE_NAMES: Record<ZoneId, string> = {
  refuge: "Ember Refuge", training: "Training Cell", march: "The Soot March", archive1: "Hollow Archive I", archive2: "Hollow Archive II",
  archive3: "Hollow Archive III", hunt_toll: "Target Hunt: Toll-Keeper", hunt_engine: "Target Hunt: Orison Engine",
};

export const WAYPOINTS: Record<string, { zone: ZoneId; entry: string; name: string }> = {
  refuge: { zone: "refuge", entry: "waypoint", name: "Ember Refuge" },
  ashway: { zone: "march", entry: "waypoint", name: "Ashway Shrine" },
  depths: { zone: "archive2", entry: "waypoint", name: "Archive Depths" },
  threshold: { zone: "archive3", entry: "threshold", name: "Engine Threshold" },
};

/** Deterministic zone generation (pure; safe to run in a worker). */
export function generateZone(id: ZoneId, seed: number, difficulty: Difficulty): ZoneData {
  let z: ZoneData;
  switch (id) {
    case "refuge": z = generateRefuge(seed, difficulty); break;
    case "training": z = generateTraining(seed, difficulty); break;
    case "march": z = generateMarch(seed, difficulty); break;
    case "archive1": z = generateArchiveFloor(seed, difficulty, 1); break;
    case "archive2": z = generateArchiveFloor(seed, difficulty, 2); break;
    case "archive3": z = generateArchive3(seed, difficulty); break;
    case "hunt_toll": z = generateHunt(seed, difficulty, "tollkeeper"); break;
    case "hunt_engine": z = generateHunt(seed, difficulty, "engine"); break;
  }
  // waypoint entries: stand just south of each waypoint
  for (const it of z.interactables) if (it.kind === "waypoint" && !z.entries.waypoint) z.entries.waypoint = { x: it.x, y: it.y + 2 };
  return z;
}
