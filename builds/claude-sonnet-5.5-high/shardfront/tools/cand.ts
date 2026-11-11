import { buildMap } from '../src/sim/map';
const m = buildMap(); const N = m.size;
const ok = (x: number, y: number) => { const i = Math.floor(y) * N + Math.floor(x); return !m.blocked[i] && !m.chasm[i]; };
// find open spots (with a 3-cell clear radius) around areas of interest
const want: Array<[string, number, number]> = [['west lane mid', 14, 70], ['south lane', 70, 128], ['p0 side lane', 40, 92], ['centre-left', 48, 84], ['west lane 2', 12, 88], ['top lane', 72, 12], ['south-west corridor', 36, 100]];
for (const [n, cx, cy] of want) {
  let best: [number, number] | null = null; let bd = 1e9;
  for (let y = cy - 14; y <= cy + 14; y++) for (let x = cx - 14; x <= cx + 14; x++) {
    let clear = true; for (let dy = -3; dy <= 3 && clear; dy++) for (let dx = -3; dx <= 3; dx++) if (!ok(x + dx, y + dy) || m.brush[(y + dy) * N + x + dx]) { clear = false; break; }
    if (clear) { const d = Math.hypot(x - cx, y - cy); if (d < bd) { bd = d; best = [x + 0.5, y + 0.5]; } }
  }
  console.log(n, best);
}
