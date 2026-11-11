// usage: node tools/patch.cjs <file> <<< JSON array of [old,new] pairs (new line separated JSON)
const fs = require('fs');
const file = process.argv[2];
let s = fs.readFileSync(file, 'utf8');
const reps = JSON.parse(fs.readFileSync(0, 'utf8'));
for (const [a, b] of reps) { if (!s.includes(a)) { console.error('MISSING in ' + file + ': ' + a.slice(0, 80)); process.exit(1); } s = s.split(a).join(b); }
fs.writeFileSync(file, s);
console.log('patched', file, reps.length);
