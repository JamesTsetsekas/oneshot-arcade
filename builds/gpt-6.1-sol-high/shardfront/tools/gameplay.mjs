import {chromium} from 'playwright';
import * as THREE from 'three';
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
const cam=new THREE.PerspectiveCamera(45,1440/680,.1,300);cam.position.set(27,42,63+42*.7);cam.lookAt(27,0,63);cam.updateMatrixWorld();
const point=(x,z,y=0)=>{const p=new THREE.Vector3(x,y,z).project(cam);return {x:(p.x+1)*720,y:(1-p.y)*340};};
const clickWorld=async(x,z,button='left')=>{const p=point(x,z,1);await page.mouse.click(p.x,p.y,{button});await page.waitForTimeout(300);};
await page.goto('http://127.0.0.1:5200/play/shardfront/');await page.getByRole('button',{name:'DEPLOY TO RAVINE'}).click();await page.waitForTimeout(2500);
// Select harvesting workers through their screen-space region.
await page.mouse.move(405,465);await page.mouse.down();await page.mouse.move(575,590,{steps:8});await page.mouse.up();await page.waitForTimeout(300);
await page.getByRole('button',{name:'Construct',exact:false}).click();await page.getByRole('button',{name:'Assembly Bay',exact:false}).click();await clickWorld(30,65);
await page.getByRole('button',{name:'Construct',exact:false}).click();await page.getByRole('button',{name:'Flux Tap',exact:false}).click();await clickWorld(12,53);
await page.waitForTimeout(10000);
await clickWorld(30,65);await page.getByRole('button',{name:'Bulwark',exact:false}).click({clickCount:4,delay:150});await page.waitForTimeout(18000);
await page.screenshot({path:'oneshot/screenshot.png'});
await page.keyboard.press('F3');await page.waitForTimeout(500);await page.screenshot({path:'oneshot/debug.png'});
console.log(JSON.stringify({errors,body:await page.locator('body').innerText()}));await browser.close();
