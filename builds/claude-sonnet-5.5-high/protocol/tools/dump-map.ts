import { dumpGrid, BOXES, MAP_HASH } from '../src/sim/map';
const rows = dumpGrid().split('\n');
console.log('    ' + Array.from({ length: 48 }, (_, i) => (i % 10 === 0 ? String(i / 10) : ' ')).join(''));
console.log('    ' + Array.from({ length: 48 }, (_, i) => String(i % 10)).join(''));
rows.forEach((r, i) => console.log(String(i).padStart(3, ' ') + ' ' + r));
console.log('boxes', BOXES.length, 'hash', MAP_HASH);
