import { World } from "../src/shared/sim/world";
import { defaultLoadouts, type Loadout } from "../src/shared/content/loadout";
import { emptyInput, type InputCmd } from "../src/shared/protocol";
import type { PlayerState, MatchConfig } from "../src/shared/sim/types";
import { freshK17 } from "../src/shared/map/k17";

export function makeWorld(cfg: Partial<MatchConfig> = {}): World {
  return new World({ warmup: 0.05, ...cfg }, freshK17());
}

/** Two humans (no bots), already live, spawn protection cleared. */
export function duel(loadoutA: Partial<Loadout> = {}, loadoutB: Partial<Loadout> = {}, cfg: Partial<MatchConfig> = {}): { w: World; a: PlayerState; b: PlayerState } {
  const w = makeWorld(cfg);
  const base = defaultLoadouts();
  const a = w.addPlayer({ name: "A", team: 0, isBot: false, loadout: { ...base[0], ...loadoutA } });
  const b = w.addPlayer({ name: "B", team: 1, isBot: false, loadout: { ...base[0], ...loadoutB } });
  w.tick(); // spawn (warmup)
  advance(w, 1.2);
  for (const p of [a, b]) { p.spawnProtectedUntil = 0; p.swapT = 0; }
  return { w, a, b };
}

export function advance(w: World, seconds: number, each?: (w: World) => void): void {
  const n = Math.round(seconds * 60);
  for (let i = 0; i < n; i++) { each?.(w); w.tick(); }
}

export function input(p: PlayerState, patch: Partial<InputCmd>): void {
  p.cmd = { ...emptyInput(), yaw: p.yaw, pitch: p.pitch, ...patch };
}

/** Place a player at a position facing a yaw, clearing recoil. */
export function place(p: PlayerState, x: number, z: number, yaw: number, y = 0): void {
  p.pos.x = x; p.pos.y = y; p.pos.z = z; p.prevPos = { ...p.pos }; p.yaw = yaw; p.pitch = 0; p.recoilP = 0; p.recoilY = 0; p.vel = { x: 0, y: 0, z: 0 };
}
