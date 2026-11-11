import { buildIsland, LOCATIONS } from "../src/shared/world/island";
const t0 = performance.now();
const isl = buildIsland((l, f) => console.log(`  [${(performance.now() - t0).toFixed(0)}ms] ${l} ${f}`));
console.log("build ms", (performance.now() - t0).toFixed(0));
console.log("boxes", isl.world.boxes.length, "decor", isl.decor.length, "trees", isl.trees.length, "rocks", isl.rocks.length);
console.log("sockets", isl.sockets.length, "chests", isl.chests.length, "zip", isl.ziplines.length, "asc", isl.ascenders.length, "vents", isl.vents.length);
console.log("nav walk cells", isl.nav.walkCount, "finalCenters", isl.finalCenters.length, "maxH", isl.hf.maxH.toFixed(1));
for (const l of LOCATIONS) {
  const s = isl.sockets.filter((s) => s.loc === l.idx);
  const reach = s.filter((q) => isl.nav.nearestWalkable(q.x, q.z, 2) && Math.abs(isl.nav.heightAt(...(isl.nav.nearestWalkable(q.x, q.z, 2)!)) - q.y) < 1.2).length;
  console.log(l.name.padEnd(16), "h", isl.hf.height(l.x, l.z).toFixed(1).padStart(6), "sockets", s.length, "navReach", reach, "chests", isl.chests.filter((c) => c.loc === l.idx).length, "walk@", isl.nav.walkableAt(l.x + 3, l.z + 3));
}
let t1 = performance.now();
const p = isl.nav.coarsePath(-130, 190, 270, -130);
console.log("coarse path pts", p ? p.length / 2 : null, (performance.now() - t1).toFixed(1), "ms");
t1 = performance.now();
const f = isl.nav.finePath(-130 + 20, 190, -130 - 40, 190 + 30);
console.log("fine path pts", f ? f.length / 2 : null, (performance.now() - t1).toFixed(1), "ms");
// ascii map
let out = "";
for (let z = 600; z >= -600; z -= 30) {
  for (let x = -600; x <= 600; x += 15) {
    const h = isl.hf.height(x, z);
    out += h < -1 ? " " : h < 1 ? "." : h < 12 ? "-" : h < 25 ? "+" : h < 40 ? "*" : "#";
  }
  out += "\n";
}
console.log(out);
