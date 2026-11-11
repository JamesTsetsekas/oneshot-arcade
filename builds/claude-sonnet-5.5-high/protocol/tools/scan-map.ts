import { scanMap } from '../src/sim/scanner';
import { MAP_HASH } from '../src/sim/map';
const r = scanMap();
console.log('collision hash', MAP_HASH);
console.log('stats', r.stats);
console.table(r.routes);
if (r.issues.length) { console.log('ISSUES'); for (const i of r.issues) console.log(' -', i); process.exitCode = 1; } else console.log('No issues.');
