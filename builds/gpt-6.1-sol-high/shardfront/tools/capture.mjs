import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-web-security']});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.goto('http://127.0.0.1:5200/play/shardfront/');await page.getByRole('button',{name:'DEPLOY TO RAVINE'}).click();await page.waitForTimeout(3000);
await page.screenshot({path:'oneshot/initial.png'});
console.log(JSON.stringify({errors,title:await page.title(),body:(await page.locator('body').innerText()).slice(0,1500)}));await browser.close();
