import { buildMap, mapToAscii } from '../src/sim/map';
const m = buildMap();
const rows = mapToAscii(m, 2).split('\n').map((r) => r.split(''));
for (const r of m.resources) { const x = Math.floor(r.x / 2), y = Math.floor(r.y / 2); rows[y][x] = r.kind === 'ore' ? 'o' : 'V'; }
for (const s of m.sites) rows[Math.floor(s.y / 2)][Math.floor(s.x / 2)] = 'H';
for (const p of m.pylons) rows[Math.floor(p.y / 2)][Math.floor(p.x / 2)] = 'P';
for (const p of m.pods) rows[Math.floor(p.y / 2)][Math.floor(p.x / 2)] = 's';
for (const b of m.barriers) rows[Math.floor(b.y / 2)][Math.floor(b.x / 2)] = 'C';
console.log(rows.map((r) => r.join('')).join('\n'));
