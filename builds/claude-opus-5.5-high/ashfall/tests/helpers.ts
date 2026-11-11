import { Game } from "../src/sim/game";
import { emptyIntents, type Intents } from "../src/sim/player";
import { generateZone } from "../src/world";
import type { ZoneId } from "../src/world/types";
import type { ClassId } from "../src/data/types";
import { dist } from "../src/core/math";

export function newGame(cls: ClassId = "cinder", seed = 1234): Game {
  const g = Game.create("Tester", cls, seed, 1_700_000_000_000);
  g.loadZone(generateZone("refuge", g.zoneSeed("refuge"), "normal"), "start");
  return g;
}

export function goto(g: Game, id: ZoneId, entry = "start") {
  g.requestZone(id, entry);
  g.resolvePendingZoneSync();
}

export function run(g: Game, ticks: number, f?: (g: Game, i: Intents, t: number) => void) {
  for (let t = 0; t < ticks; t++) {
    const i = emptyIntents();
    i.cursorX = g.player.x + 1; i.cursorY = g.player.y;
    f?.(g, i, t);
    g.step(i);
    if (g.pendingZone) g.resolvePendingZoneSync();
  }
}

/** Simple fighting bot: walks to and attacks the nearest live enemy, uses the core skill, drinks potions. */
export function botFight(g: Game, ticks: number, opts: { useCore?: boolean; maxDist?: number } = {}) {
  run(g, ticks, (g, i, t) => {
    const p = g.player;
    if (!p.alive) return;
    let best = null as null | (typeof g.enemies)[number], bd = opts.maxDist ?? 40;
    for (const e of g.enemies) {
      if (!e.alive || e.def.behavior === "dummy" && e.role !== "conduit") continue;
      if (e.boss?.invulnerable) continue;
      const d = dist(p.x, p.y, e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    }
    if (p.hp < p.maxHp * 0.4 && t % 20 === 0) i.potion = 0;
    if (!best) return;
    i.cursorX = best.x; i.cursorY = best.y;
    i.hoverEnemy = best.id;
    i.primaryDown = true;
    i.primaryPressed = t % 6 === 0;
    if (opts.useCore !== false && p.focus > 30 && bd < 4 && t % 3 === 0) { i.secondaryDown = true; i.secondaryPressed = true; i.primaryPressed = false; }
  });
}

export function hashState(g: Game): string {
  const parts = [g.tick, g.player.x.toFixed(4), g.player.y.toFixed(4), g.player.hp.toFixed(3), g.ch.xp, g.ch.gold, g.enemies.length];
  for (const e of g.enemies) parts.push(e.id, e.x.toFixed(3), e.y.toFixed(3), e.hp.toFixed(2), e.ai);
  return parts.join("|");
}
