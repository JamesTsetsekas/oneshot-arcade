// Balance probe (not part of the default run): BALANCE=1 npx vitest run tests/zz-balance.test.ts
import { describe, it } from 'vitest';
import { RULES_QUICK } from '../../src/content/rules';
import { getAnnex } from '../../src/map/annex';
import { runHeadlessMatch } from '../../src/server/room';

describe.runIf(!!(globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env.BALANCE)('balance probe', () => {
  it('prints side win rates over many seeds', () => {
    const map = getAnnex();
    const reasons: Record<string, number> = {};
    let rounds = 0;
    let atk = 0;
    let planted = 0;
    const site: Record<string, [number, number]> = { A: [0, 0], B: [0, 0], none: [0, 0] };
    let dur = 0;
    for (let seed = 100; seed < 100 + Number((globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env.BALANCE_N || 14); seed++) {
      const r = runHeadlessMatch({ map, rules: RULES_QUICK, seed, team0Side: seed % 2 ? 'atk' : 'def', difficulty: ((globalThis as unknown as { process: { env: Record<string, string | undefined> } }).process.env.BALANCE_DIFF as 'normal') || 'normal' });
      for (const rd of r.match.summary!.rounds) {
        rounds++;
        dur += rd.duration;
        reasons[rd.winnerSide + ':' + rd.reason] = (reasons[rd.winnerSide + ':' + rd.reason] ?? 0) + 1;
        if (rd.winnerSide === 'atk') atk++;
        if (rd.planted) planted++;
        const k = rd.planted ? rd.site : 'none';
        site[k][rd.winnerSide === 'atk' ? 0 : 1]++;
      }
    }
    console.log(`rounds ${rounds} atk ${((atk / rounds) * 100).toFixed(0)}% planted ${((planted / rounds) * 100).toFixed(0)}% avg ${(dur / rounds).toFixed(0)}s`);
    console.log(JSON.stringify(reasons), JSON.stringify(site));
  });
});
