import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:5200/play/shardfront/');await page.getByRole('button',{name:'DEPLOY TO RAVINE'}).click();await page.waitForTimeout(3000);await page.screenshot({path:'oneshot/layout.png'});console.log(JSON.stringify({errors}));await browser.close();
