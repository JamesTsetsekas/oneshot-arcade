import fs from 'node:fs';import path from 'node:path';
const root=process.cwd();if(!fs.existsSync(path.join(root,'ONESHOT.md'))||path.basename(root)!=='crownfall')throw new Error('Run only from the Crownfall workspace');
for(const name of ['node_modules','dist']){const target=path.resolve(root,name);if(path.dirname(target)!==root)throw new Error('Unsafe target');fs.rmSync(target,{recursive:true,force:true,maxRetries:5,retryDelay:300});console.log(`Removed ${name}`);}
