// Drives the production build like a person: menu -> Play -> Deploy -> keyboard/mouse. Reports what worked.
import { launch } from './shot.mjs';
import path from 'node:path';
import fs from 'node:fs';

const out = process.argv[2] || 'scratch-shots';
fs.mkdirSync(out, { recursive: true });
const { server, browser, page, logs, url } = await launch({ width: 1280, height: 720 });
const res = {};
try {
  await page.goto(url(''));
  await page.waitForSelector('.menu .btn');
  await page.click('.menu .btn >> nth=0');
  await page.waitForSelector('button:has-text("Deploy")');
  await page.click('button:has-text("Deploy")');
  await page.waitForSelector('text=Click to deploy', { timeout: 20000 });
  await page.screenshot({ path: path.join(out, 'deploy.png') });
  await page.click('.screen');
  await page.waitForTimeout(1500);
  res.pointerLocked = await page.evaluate(() => !!document.pointerLockElement);
  res.state0 = await page.evaluate(() => window.__lp.state());
  // buy menu auto-opens in round 1
  await page.waitForTimeout(2500);
  res.buyOpen = await page.evaluate(() => !!document.querySelector('.buy') && !document.querySelector('.buy').closest('.overlay').classList.contains('hidden'));
  await page.screenshot({ path: path.join(out, 'buy.png') });
  // buy a vest via keyboard: category 5 (Armor & Kit), item 1
  await page.keyboard.press('Digit5');
  await page.keyboard.press('Digit1');
  await page.waitForTimeout(800);
  res.afterBuy = await page.evaluate(() => { const s = window.__lp.game.net.latest.self; return { money: s.money, armor: s.armor }; });
  await page.keyboard.press('KeyB');
  await page.waitForTimeout(800);
  res.buyClosed = await page.evaluate(() => document.querySelector('.buy').closest('.overlay').classList.contains('hidden'));
  res.pointerLockedAfterBuy = await page.evaluate(() => !!document.pointerLockElement);
  // move
  const before = await page.evaluate(() => window.__lp.game.net.latest.self.pos);
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(1500);
  await page.keyboard.up('KeyD');
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => window.__lp.game.net.latest.self.pos);
  res.moved = Math.hypot(after.x - before.x, after.z - before.z);
  // scoreboard + map
  await page.keyboard.down('Tab');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, 'scoreboard.png') });
  await page.keyboard.up('Tab');
  await page.keyboard.press('KeyM');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, 'tacmap.png') });
  await page.keyboard.press('KeyM');
  // pause via exiting lock
  await page.evaluate(() => document.exitPointerLock());
  await page.waitForTimeout(600);
  res.pausedMenu = await page.evaluate(() => !!document.querySelector('.pause'));
  await page.screenshot({ path: path.join(out, 'pause.png') });
  await page.click('button:has-text("Resume")');
  await page.waitForTimeout(500);
  res.state1 = await page.evaluate(() => window.__lp.state());
} catch (e) {
  res.error = String(e);
}
console.log(JSON.stringify(res, null, 1));
if (logs.length) console.log('--- console ---\n' + logs.slice(0, 20).join('\n'));
await browser.close();
server.close();
