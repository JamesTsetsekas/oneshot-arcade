import { newCharacter, rankUp } from '../src/sim/character';
import { Game } from '../src/sim/game';
import { skillReady } from '../src/sim/play';
import type { ClassId } from '../src/sim/types';

export function makeGame(cls: ClassId = 'cinder', seed = 12345, level = 1): Game {
  const ch = newCharacter('Tester', cls, { body: 0, voice: 0 }, seed);
  const g = new Game(ch);
  while (g.ch.level < level) g.gainXp(100000);
  if (level > 1) {
    // spend points on the class core skills
    const ids = cls === 'cinder' ? ['brand_arc', 'bastion_step', 'cinder_ring'] : ['splinter_volley', 'ghostline', 'snare_bloom'];
    for (const id of ids) rankUp(g.ch, id);
    for (let i = 0; i < 6; i++) rankUp(g.ch, ids[0]);
    g.recompute();
    g.player.hp = g.player.maxHp;
  }
  return g;
}

export function run(g: Game, seconds: number, dt = 1 / 30, hook?: (g: Game, t: number) => void) {
  const n = Math.round(seconds / dt);
  for (let i = 0; i < n; i++) {
    hook?.(g, i * dt);
    g.step(dt);
    g.events.length = 0;
  }
}

/** Simple auto-fighter: attack the nearest awake enemy, use the core skill when ready, drink potions when low. */
export function botFight(g: Game, t: number) {
  const p = g.player;
  if (p.dead) return;
  const foes = g.enemies.filter((e) => e.alive && !e.neutral && e.aggro);
  let best = null as (typeof foes)[number] | null;
  let bd = 1e9;
  for (const e of foes) {
    const d = Math.hypot(e.x - p.x, e.z - p.z);
    if (d < bd) {
      bd = d;
      best = e;
    }
  }
  if (p.hp < p.maxHp * 0.4 && g.ch.belt.health > 0) g.cmdPotion('health');
  if (!best) return;
  if (Math.floor(t * 30) % 4 === 0) {
    const rmb = g.ch.hotbar.rmb;
    const ready = rmb ? skillReady(g, rmb).ok : false;
    const inRange = g.ch.cls === 'ranger' ? bd < 8 : bd < 3.2;
    if (ready && inRange) g.cmdSkill('rmb', best.x, best.z, best.id);
    else g.cmdAttack(best.id);
  }
}
