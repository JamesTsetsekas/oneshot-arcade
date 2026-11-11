import { Sim } from '../src/sim/sim';
const sim = new Sim({ seed: 1, factions: ['verdant', 'helix'], ai: ['normal', 'normal'], mode: 'skirmish' });
for (let i = 0; i < 11600; i++) { sim.step(); sim.events.length = 0; }
sim.prof = {};
let worst = 0;
for (let i = 0; i < 400; i++) { const s = performance.now(); sim.step(); sim.events.length = 0; worst = Math.max(worst, performance.now() - s); }
console.log('worst', worst.toFixed(0), JSON.stringify(Object.fromEntries(Object.entries(sim.prof).map(([k, v]) => [k, +(v / 400).toFixed(2)]))), 'ids', sim.ids.length);
