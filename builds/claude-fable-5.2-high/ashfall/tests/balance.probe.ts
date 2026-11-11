// @ts-nocheck
// Balance probe (content tool, not part of `npm test`): an unboosted autopilot that never dodges plays the act and logs
// pacing, level and boss time-to-kill to probe.log. Run with `npm run probe`.
import { appendFileSync, writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { BASE } from '../src/items/content';
import { equipItem, slotFor } from '../src/items/inventory';
import { allocAttr, rankUp } from '../src/progression/progression';
import { identify } from '../src/items/economy';
import { botStep, makeSession } from './helpers';
import type { Item } from '../src/entity-combat/types';

const score = (it: Item) => { const b = BASE[it.base]; return (b.dmg ? (b.dmg[0] + b.dmg[1]) * b.aps! * 4 : 0) + (b.armor ?? 0) + it.affixes.length * 6 + it.ilvl; };
it('balance probe (unboosted bot, no dodging)', () => {
  writeFileSync('probe.log', '');
  for (const [cls, seed] of [['cinder', 11], ['ranger', 12], ['cinder', 13]] as const) {
    const s = makeSession(cls, seed);
    const h = s.hero;
    let lastQ = -1, lastZone = '', bossStart = 0, deathsAt = 0;
    for (let t = 0; t < 30 * 60 * 12; t++) {
      botStep(s, t);
      // fair-ish helpers: pick up items, equip upgrades, spend points, buy potions in town
      if (t % 30 === 0) {
        for (const pk of s.zone.pickups) if (pk.kind === 'item' && Math.hypot(pk.x - s.player.x, pk.y - s.player.y) < 6) s.takeItem(pk.id);
        for (const it of [...h.inv]) {
          if (it.kind !== 'gear') continue;
          if (!it.identified && h.flags.artificer) identify(h, it.id);
          const slot = slotFor(h, it); const cur = slot ? h.equip[slot] : undefined; const b = BASE[it.base];
          if (b.cls && b.cls !== cls) continue;
          if (b.slot === 'main' && !b.twoHand && h.equip.main && BASE[h.equip.main.base].twoHand) continue;
          if (it.identified && (!cur || score(it) > score(cur))) { equipItem(h, it.id); s.refresh(); }
        }
        const core = cls === 'cinder' ? 'brand_arc' : 'splinter_volley';
        while (h.skillPoints > 0 && !rankUp(h, core)) { /* spend */ }
        const pas = cls === 'cinder' ? ['kindling', 'tempered_guard', 'deep_draught'] : ['deep_traces', 'second_wind', 'fleetfoot'];
        for (const p of pas) while (h.skillPoints > 0 && !rankUp(h, p)) { /* spend */ }
        while (h.attrPoints > 0) allocAttr(h, cls === 'cinder' ? 'might' : 'finesse');
        if (s.zone.id === 'refuge') { while (h.belt[0] < h.beltCap && h.gold >= 30) { h.gold -= 20; h.belt[0]++; } }
        s.refresh();
      }
      s.tick();
      const boss = s.zone.actors.find((a) => a.boss && !a.dead && a.bs?.started);
      if (boss && !bossStart) { bossStart = s.time; deathsAt = h.stats.deaths; appendFileSync('probe.log', `  [${cls}] boss ${boss.name} start t=${(s.time / 60).toFixed(1)}m lvl=${h.level} hp=${s.stats.hpMax} dmg=${s.stats.dmgMin.toFixed(0)}-${s.stats.dmgMax.toFixed(0)} aps=${s.stats.aps.toFixed(2)} armor=${s.stats.armorTotal} potions=${h.belt[0]} bossHp=${boss.maxHp}\n`); }
      for (const e of s.events) if (e.type === 'victory') { appendFileSync('probe.log', `  [${cls}] boss down after ${(s.time - bossStart).toFixed(0)}s, deaths during=${h.stats.deaths - deathsAt}\n`); bossStart = 0; }
      if (bossStart && !boss && s.player.dead) bossStart = 0;
      s.events.length = 0;
      if (h.quest !== lastQ) { lastQ = h.quest; lastZone = s.zone.id; appendFileSync('probe.log', `[${cls} ${seed}] t=${(s.time / 60).toFixed(1)}m quest=${h.quest} zone=${s.zone.id} lvl=${h.level} deaths=${h.stats.deaths} kills=${h.stats.kills} gold=${h.gold} potions=${h.belt[0]}\n`); }
      if (h.quest >= 9) break;
    }
    appendFileSync('probe.log', `== ${cls} ${seed}: final quest=${h.quest} t=${(s.time / 60).toFixed(1)}m lvl=${h.level} deaths=${h.stats.deaths} kills=${h.stats.kills} lastDeath=${h.stats.lastDeath}\n`);
  }
}, 600000);
