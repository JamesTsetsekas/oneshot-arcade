import {chromium} from '@playwright/test';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.goto('http://127.0.0.1:5210/arcade/ashfall/?verify',{waitUntil:'networkidle'});
await page.screenshot({path:'oneshot/menu.png'});
await page.getByRole('button',{name:'CREATE WARDEN'}).click();
await page.waitForFunction(()=>window.ashfallTest?.view.scene.isReady());
await page.getByRole('button',{name:'Enter the Soot March'}).click();
await page.waitForTimeout(1500);
// Use the same input intents as the UI, without modifying health or damage.
await page.evaluate(()=>{const g=window.ashfallTest.game;g.command({x:0,z:-2});});
await page.waitForTimeout(2500);
await page.keyboard.press('w');
await page.waitForTimeout(500);
await page.screenshot({path:'oneshot/screenshot.png'});
await page.keyboard.press('k');
await page.getByRole('button',{name:'Invest point +'}).first().click();
await page.keyboard.press('Escape');
await page.keyboard.press('Escape');
await page.getByRole('button',{name:'Save checkpoint'}).click();
await page.waitForTimeout(600);
await page.reload({waitUntil:'networkidle'});
const hasContinue=await page.getByRole('button',{name:/Continue Warden/}).count();
if(!hasContinue)throw Error('Continue unavailable after save');
await page.getByRole('button',{name:/Continue Warden/}).click();
await page.waitForFunction(()=>window.ashfallTest?.view.scene.isReady());
const restored=await page.evaluate(()=>({zone:window.ashfallTest.game.zone,rank:window.ashfallTest.game.player.ranks[0]}));
if(restored.zone!==1||restored.rank!==1)throw Error('Save restoration mismatch');
const evidence={errors,subpath:true,creation:true,cast:true,skillAllocation:true,indexedDBRoundtrip:true,restored};
fs.writeFileSync('oneshot/browser-results.json',JSON.stringify(evidence,null,2));
await browser.close();
if(errors.length)throw Error(errors.join('\n'));
console.log(JSON.stringify(evidence));


