// Location tour in Practice mode (harness teleports the local player) to review
// how each area renders. Output: oneshot/tour-*.png
import { chromium } from 'playwright-core';
import { serve } from './serve.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const srv = await serve();
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--ignore-gpu-blocklist', '--enable-gpu', '--use-angle=d3d11'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
await p.goto('http://localhost:5432/play/claude-opus-5.5-high/protocol/?harness=1&autostart=practice');
await p.waitForFunction(() => !!window.__lp, null, { timeout: 60000 });
await p.evaluate(() => window.__lp.resume());
const spots = [
  ['hydroponics', 26.5, 12.5, 2.4, 0.05],
  ['turbine-hall', -33, 16, 3.5, 0.08],
  ['calibration', -6, -14, 0.6, 0.02],
  ['glass', 11, -2, 1.57, 0.02],
  ['atrium', 0, 30, 3.14, 0.05],
];
for (const [name, x, z, yaw, pitch] of spots) {
  await p.evaluate(([x, z, yaw, pitch]) => {
    const s = window.__lp;
    const q = s.room.players[s.humanId];
    q.pos = { x, y: Math.max(0, s.map.floorHeight(x, z, 6)), z };
    q.vel = { x: 0, y: 0, z: 0 };
    s.input.yaw = yaw;
    s.input.pitch = pitch;
    s.ui.paused = false;
  }, [x, z, yaw, pitch]);
  await sleep(900);
  await p.screenshot({ path: `oneshot/tour-${name}.png` });
  console.log('captured', name);
}
await b.close();
srv.close();
