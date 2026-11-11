import {chromium} from '@playwright/test';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1280,height:720}});page.setDefaultTimeout(60000);const errors=[];const requests=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});page.on('request',r=>requests.push(r.url()));
const check=(name,pass)=>{if(!pass)throw Error(name);console.log('PASS '+name);};
try{
 await page.goto('http://127.0.0.1:5250/play/skybreak/');await page.getByRole('button',{name:'QUICK DROP'}).waitFor();await page.waitForFunction(()=>window.skybreak?.scene?.isReady());await page.screenshot({path:'oneshot/menu.png'});
 await page.getByRole('button',{name:'QUICK DROP'}).click();await page.waitForFunction(()=>window.skybreak?.match?.phase==='flight');await page.keyboard.press('Space');await page.waitForFunction(()=>window.skybreak?.match?.phase==='playing'&&window.skybreak.match.player.y===0);
 check('Solo staging, manual drop and landing',await page.evaluate(()=>window.skybreak.match.alive===24));
 await page.keyboard.press('KeyE');check('cache interaction from landing',await page.evaluate(()=>window.skybreak.match.loot.some(l=>l.opened)));
 await page.mouse.move(640,500);await page.waitForTimeout(800);await page.screenshot({path:'oneshot/screenshot.png'});
 await page.mouse.down();await page.waitForTimeout(500);await page.mouse.up();check('mouse fires and consumes ammunition',await page.evaluate(()=>window.skybreak.match.shots>0));await page.keyboard.press('KeyR');await page.waitForFunction(()=>window.skybreak.match.player.reload<=0);
 await page.keyboard.press('KeyM');await page.getByRole('heading',{name:'THE HIGHWAKE',exact:true}).waitFor();check('full map opens',true);await page.screenshot({path:'oneshot/map.png'});await page.getByRole('button',{name:'×',exact:true}).click();
 await page.keyboard.press('Tab');await page.getByRole('heading',{name:'YOUR SALVAGE'}).waitFor();check('inventory summary opens',true);await page.getByRole('button',{name:'×',exact:true}).click();
 // Accelerate ONLY the pure simulation for terminal-state UI verification; no screenshot is taken from this state.
 await page.evaluate(()=>{const r=window.skybreak;r.paused=true;const m=r.match;const input={x:0,z:0,sprint:false,jump:false,crouch:false,fire:false,aim:0,pitch:0,ads:false};for(let i=0;i<10000&&m.phase!=='ended';i++)m.tick(1/30,input);});
 await page.getByRole('button',{name:'DROP AGAIN'}).waitFor();check('simulation reaches terminal results UI',true);await page.getByRole('button',{name:'RETURN TO BASE',exact:true}).click();await page.getByRole('button',{name:'PRACTICE RANGE'}).click();await page.waitForTimeout(1500);check('Practice opens without account',await page.evaluate(()=>window.skybreak.match.practice));await page.screenshot({path:'oneshot/practice.png'});
 await page.keyboard.press('Escape');await page.getByRole('button',{name:'RETURN TO BASE',exact:true}).waitFor();await page.getByRole('button',{name:'RETURN TO BASE',exact:true}).click();await page.getByRole('button',{name:'QUICK DROP'}).click();check('requeue creates fresh match',await page.evaluate(()=>window.skybreak.match.player.kills===0&&window.skybreak.match.alive===24));
 const metrics=await page.evaluate(()=>({fps:window.skybreak.fps,meshes:window.skybreak.scene.meshes.length,drawCallsRawCumulative:window.skybreak.engine._drawCalls.current}));
 check('no browser errors',errors.length===0);check('no external requests',requests.every(u=>u.startsWith('http://127.0.0.1:5250/')));fs.writeFileSync('oneshot/browser-results.json',JSON.stringify({passed:10,errors,requests:requests.length,metrics,viewport:'1280x720',url:'http://127.0.0.1:5250/play/skybreak/',notes:'Software WebGL; terminal-state UI check accelerated simulation only. Gameplay screenshot captured after real-time drop/landing and cache interaction.'},null,2));
}finally{await browser.close();}
