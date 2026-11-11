// Accelerated browser campaign: ordinary simulation intents, no stat overrides.
import {chromium} from '@playwright/test';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir:'oneshot/video',size:{width:1440,height:900}}});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5210/arcade/ashfall/?verify',{waitUntil:'networkidle'});
await page.getByRole('button',{name:/Veil Ranger/}).click();
await page.getByRole('button',{name:'CREATE WARDEN'}).click();
await page.waitForFunction(()=>window.ashfallTest?.view.scene.isReady());
await page.getByRole('button',{name:'Enter the Soot March'}).click();
async function clear(){for(let batch=0;batch<100;batch++){const done=await page.evaluate(()=>{const g=window.ashfallTest.game;for(let i=0;i<180;i++){if(g.dead)g.respawn();const target=g.enemies.filter(e=>e.hp>0).sort((a,b)=>Math.hypot(a.x-g.player.x,a.z-g.player.z)-Math.hypot(b.x-g.player.x,b.z-g.player.z))[0];if(!target)return true;g.aim={x:target.x,z:target.z};g.attackTarget=target.id;if(Math.hypot(target.x-g.player.x,target.z-g.player.z)<10){g.cast(0);g.cast(1);g.cast(2);if(g.player.hp<g.player.max*.6)g.cast(3);}if(g.player.hp<g.player.max*.45)g.potion();if(target.state==='Telegraph'&&Math.hypot(target.x-g.player.x,target.z-g.player.z)<6){g.aim={x:g.player.x+(g.player.x-target.x)*3,z:g.player.z+(g.player.z-target.z)*3};g.evade();}g.tick(1/30);}return false;});await page.waitForTimeout(180);if(done)return;}throw Error('Campaign combat timeout');}
async function walk(x,z){await page.evaluate(({x,z})=>{const g=window.ashfallTest.game;g.attackTarget=null;g.command({x,z});for(let i=0;i<600&&g.target;i++)g.tick(1/30);g.interact();g.interact();},{x,z});await page.waitForTimeout(600);}
await clear();await walk(-7,9);await walk(0,31);await clear();await walk(7,18);await walk(0,31);await clear();
await page.screenshot({path:'oneshot/victory.png'});await page.waitForTimeout(1200);
await page.getByRole('button',{name:'Collect rewards & continue'}).click();
await page.keyboard.press('t');await page.waitForFunction(()=>window.ashfallTest.game.zone===0,{},{timeout:20000});
await page.getByRole('button',{name:'Veteran target hunt'}).click();await clear();await page.waitForTimeout(1000);
const result=await page.evaluate(()=>({completed:window.ashfallTest.game.completed,difficulty:window.ashfallTest.game.difficulty,victory:window.ashfallTest.game.victory,kills:window.ashfallTest.game.kills}));
if(!result.completed||result.difficulty!==1||!result.victory)throw Error('Campaign failed');
fs.writeFileSync('oneshot/campaign-results.json',JSON.stringify({result,errors,mode:'accelerated ordinary-intent simulation rendered in production browser'},null,2));
const video=page.video();await context.close();if(video)fs.renameSync(await video.path(),'oneshot/campaign.webm');await browser.close();console.log(JSON.stringify({result,errors}));
