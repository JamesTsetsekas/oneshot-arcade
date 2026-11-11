export { newCharacter, computeDerived, addXp, rankUp, canRankUp, respecAll } from '../src/sim/character';
import { xpForLevel, MAX_LEVEL } from '../src/data/skills';

export function xpForLevelCheck(): boolean {
  let prev = 0;
  for (let l = 1; l < MAX_LEVEL; l++) {
    const x = xpForLevel(l);
    if (x <= prev) return false;
    prev = x;
  }
  return true;
}
