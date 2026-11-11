import { test } from 'vitest';
import fs from 'node:fs';
import { createGlassRavine, F_BRUSH, F_BUILD, F_CHASM, F_CLIFF, F_RAMP, F_ROCK, F_WALK } from '../../src/world/map';
// @ts-ignore
import { encodePNG } from '../../tools/png.mjs';

test.skipIf(!process.env.MAP_PNG)('render map debug png', () => {
  const m = createGlassRavine();
  const S = 5, N = m.size;
  const rgb = new Uint8Array(N * S * N * S * 3);
  const put = (x: number, y: number, c: number[]) => { for (let oy = 0; oy < S; oy++) for (let ox = 0; ox < S; ox++) { const p = ((y * S + oy) * N * S + x * S + ox) * 3; rgb[p] = c[0]; rgb[p + 1] = c[1]; rgb[p + 2] = c[2]; } };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x, f = m.flags[i], lv = m.level[i];
    let c = [[60, 60, 70], [110, 110, 120], [170, 170, 175]][lv];
    if (!(f & F_BUILD) && (f & F_WALK)) c = c.map((v) => v - 25);
    if (f & F_RAMP) c = [190, 160, 90];
    if (f & F_BRUSH) c = [60, 130, 60];
    if (f & F_CLIFF) c = [30, 30, 30];
    if (f & F_ROCK) c = [90, 60, 40];
    if (f & F_CHASM) c = [10, 40, 60];
    put(x, y, c);
  }
  for (const r of m.resources) put(r.x, r.y, r.kind === 'ore' ? [0, 255, 230] : [255, 140, 0]);
  for (const b of m.bases) put(Math.floor(b.x), Math.floor(b.y), [255, 0, 0]);
  for (const p of m.pylons) put(p.x, p.y, [255, 255, 0]);
  for (const p of m.pods) put(p.x, p.y, [255, 0, 255]);
  for (const b of m.barriers) for (const i of b.cells) put(i % N, (i / N) | 0, [200, 230, 255]);
  fs.writeFileSync(process.env.MAP_PNG!, Buffer.from(encodePNG(N * S, N * S, Buffer.from(rgb))));
});
