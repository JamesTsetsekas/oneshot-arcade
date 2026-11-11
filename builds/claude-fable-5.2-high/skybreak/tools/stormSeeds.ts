// Storm seed viewer: prints the planned Calmfield centres for a set of seeds and validates nesting and land cover.
import { Storm } from "../src/server/match/storm";
import { Rng } from "../src/shared/math";
import { buildIsland } from "../src/shared/world/island";

const n = Number(process.argv[2] ?? 12);
const isl = buildIsland();
console.log(`valid final-field centres authored + validated: ${isl.finalCenters.length}\n`);
let worstLand = 1;
for (let s = 0; s < n; s++) {
  const seed = 9000 + s * 977;
  const st = new Storm(new Rng(seed).fork(11), isl.finalCenters, "standard");
  const parts: string[] = [];
  let nested = true;
  for (let i = 0; i <= 5; i++) {
    const c = st.centers[i]!;
    const r = st.phases[i]!.toR;
    let land = 0, total = 0;
    for (let a = 0; a < 24; a++)
      for (const k of [0.3, 0.6, 0.9]) {
        total++;
        if (isl.world.terrain(c[0] + Math.sin((a / 24) * 6.283) * r * k, c[1] + Math.cos((a / 24) * 6.283) * r * k) > 0) land++;
      }
    const frac = land / total;
    if (i >= 3) worstLand = Math.min(worstLand, frac);
    if (i > 0) {
      const p = st.centers[i - 1]!;
      if (Math.hypot(p[0] - c[0], p[1] - c[1]) > st.phases[i - 1]!.toR - r + 1e-6) nested = false;
    }
    parts.push(`P${i} r${r} (${c[0].toFixed(0)},${c[1].toFixed(0)}) land ${(frac * 100).toFixed(0)}%`);
  }
  const legs = [6, 7, 8].map((i) => `(${st.centers[i]![0].toFixed(0)},${st.centers[i]![1].toFixed(0)})`).join(" -> ");
  console.log(`seed ${seed}: nested=${nested}\n  ${parts.join("\n  ")}\n  endgame legs ${legs}`);
}
console.log(`\nlowest land coverage of any phase 3-5 field: ${(worstLand * 100).toFixed(0)}%`);
