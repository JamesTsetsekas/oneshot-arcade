import fs from 'node:fs';
let r=fs.readFileSync('src/renderer.ts','utf8').replace('map:this.fogTexture,transparent:true,depthWrite:false','map:this.fogTexture,transparent:true,depthWrite:false,fog:false');fs.writeFileSync('src/renderer.ts',r);
let s=fs.readFileSync('src/main.tsx','utf8').replace('<i>?</i>','<i>O</i>').replace('<i>?</i>','<i>F</i>');fs.writeFileSync('src/main.tsx',s);
