import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { resolve,extname } from 'node:path';
const root=resolve('dist'),prefix='/arcade/protocol/';
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');if(!url.pathname.startsWith(prefix)){res.writeHead(404);res.end();return;}const rel=decodeURIComponent(url.pathname.slice(prefix.length))||'index.html';const path=resolve(root,rel);if(!path.startsWith(root+'\\')&&!path.startsWith(root+'/')&&path!==root)throw Error('outside dist');const data=await readFile(path);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'})[extname(path)]||'application/octet-stream');res.end(data);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(5230,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:720}});page.setDefaultTimeout(60000);page.setDefaultNavigationTimeout(120000);const errors=[];const failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
 await page.goto('http://127.0.0.1:5230'+prefix,{waitUntil:'networkidle'});await page.waitForSelector('#deploy');await page.screenshot({path:'oneshot/menu.png'});
 await page.click('#deploy');await page.waitForTimeout(1000);await page.keyboard.press('KeyB');await page.waitForSelector('.shop-grid');await page.click('[data-item="armor"]');await page.screenshot({path:'oneshot/requisitions.png'});await page.click('#ready');
 await page.waitForFunction(()=>window.protocolDiagnostics().phase==='live',{},{timeout:120000});await page.keyboard.down('KeyW');await page.waitForFunction(()=>window.protocolDiagnostics().z>-15,{},{timeout:60000});await page.keyboard.up('KeyW');await page.waitForTimeout(400);await page.screenshot({path:'oneshot/screenshot.png'});
 const gameplay=await page.evaluate(()=>window.protocolDiagnostics());await page.keyboard.press('Tab');await page.screenshot({path:'oneshot/scoreboard.png'});await page.keyboard.up('Tab');
 await page.mouse.down();await page.waitForFunction(()=>window.protocolDiagnostics().ammo<15,{},{timeout:15000});await page.mouse.up();await page.keyboard.press('KeyR');await page.waitForFunction(()=>window.protocolDiagnostics().ammo===15,{},{timeout:30000});await page.keyboard.press('Escape');await page.waitForSelector('#resume');await page.locator('#sens').fill('0.0025');await page.click('#resume');
 const result={gameplay,errors,failed,controlsChecked:['deploy','buy armor','close buy','forward movement','scoreboard','fire','reload','pause','sensitivity','resume'],resolution:'1280x720',subpath:prefix};
 await writeFile('oneshot/browser-check.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));if(errors.length||failed.length)process.exitCode=1;
}finally{await browser?.close();await new Promise(r=>server.close(r));}
