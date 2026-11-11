import fs from 'node:fs';
let s=fs.readFileSync('src/main.tsx','utf8');
s=s.replaceAll('>?</span>','>&#9671;</span>').replaceAll('>?</button>','>PAUSE</button>').replaceAll("?'?':'?'","?'S':'U'").replaceAll("?'?':'?'","?'F':'B'").replaceAll('} ? ', '} O ').replaceAll('} ?`','} F`').replaceAll('150 ? / 60 ?', '150 O / 60 F').replaceAll('10 ?','10 F').replaceAll('RAVINE <span>?','RAVINE <span>+').replaceAll('DEPLOY AGAIN ?', 'DEPLOY AGAIN +');
// Keep canvas keyboard commands active after using the command deck.
s=s.replace("if(e.target instanceof HTMLButtonElement||e.target instanceof HTMLSelectElement)return;","if(e.target instanceof HTMLSelectElement)return;");
fs.writeFileSync('src/main.tsx',s);
let r=fs.readFileSync('src/renderer.ts','utf8').replace('this.fogMesh.position.set(56,5.8,44)','this.fogMesh.position.set(56,.08,44)');fs.writeFileSync('src/renderer.ts',r);
