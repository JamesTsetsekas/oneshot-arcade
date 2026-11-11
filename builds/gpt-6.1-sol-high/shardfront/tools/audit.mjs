import fs from 'node:fs';
const s=fs.readFileSync('src/main.tsx','utf8');console.log(JSON.stringify({resourceLabels:s.includes('<i>O</i>')&&s.includes('<i>F</i>'),lockfile:fs.existsSync('package-lock.json'),started:fs.readFileSync('started-at.txt','utf8').trim()}));
