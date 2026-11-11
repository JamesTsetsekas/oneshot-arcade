// Loot fairness report: weapons per expected player, chest density and rarity mix per location,
// measured over real seeded match setups (the same code path the game uses).
import { Match } from "../src/server/match/match";
import { RARITIES } from "../src/shared/content/weapons";
import { LOCATIONS } from "../src/shared/world/island";

const runs = Number(process.argv[2] ?? 40);
const per = LOCATIONS.map(() => ({ weapons: 0, items: 0, ammo: 0, chests: 0, lockers: 0, vaults: 0 }));
const rarity = [0, 0, 0, 0, 0];
let totalWeapons = 0;
let minClusterWeapons = Infinity;
for (let r = 0; r < runs; r++) {
  const m = new Match({ seed: 5000 + r * 131, mode: "solo", pace: "standard", seats: 24, human: null });
  const perLoc = LOCATIONS.map(() => 0);
  for (const l of m.loot.values()) {
    let best = -1;
    let bd = 1e9;
    for (const loc of LOCATIONS) {
      const d = Math.hypot(l.x - loc.x, l.z - loc.z);
      if (d < loc.r * 1.4 && d < bd) {
        bd = d;
        best = loc.idx;
      }
    }
    if (best < 0) continue;
    if (l.kind === "weapon") {
      per[best]!.weapons++;
      perLoc[best]!++;
      rarity[l.rarity ?? 0]!++;
      totalWeapons++;
    } else if (l.kind === "item") per[best]!.items++;
    else per[best]!.ammo++;
  }
  for (const c of m.chests) {
    if (c.loc < 0) continue;
    if (c.kind === "chest") per[c.loc]!.chests++;
    else if (c.kind === "locker") per[c.loc]!.lockers++;
    else per[c.loc]!.vaults++;
  }
  minClusterWeapons = Math.min(minClusterWeapons, ...perLoc);
}
console.log(`Loot report over ${runs} seeded match setups (floor loot at match start; chests add ~1.45 weapons each when opened)\n`);
console.log("location".padEnd(18), "tier", "floor weapons", "items", "ammo", "chests", "lockers", "vaults", "weapons incl. chests");
let grand = 0;
for (const l of LOCATIONS) {
  const p = per[l.idx]!;
  const withChests = p.weapons / runs + (p.chests / runs) * 1.45 + (p.vaults / runs) * 2;
  grand += withChests;
  console.log(
    l.name.padEnd(18), String(l.tier).padStart(4), (p.weapons / runs).toFixed(1).padStart(13), (p.items / runs).toFixed(1).padStart(5),
    (p.ammo / runs).toFixed(1).padStart(4), (p.chests / runs).toFixed(1).padStart(6), (p.lockers / runs).toFixed(1).padStart(7),
    (p.vaults / runs).toFixed(1).padStart(6), withChests.toFixed(1).padStart(20),
  );
}
console.log(`\nfloor weapons per match: ${(totalWeapons / runs).toFixed(1)}  ->  ${(totalWeapons / runs / 24).toFixed(2)} per player before any container is opened`);
console.log(`weapons including containers: ${grand.toFixed(1)}  ->  ${(grand / 24).toFixed(2)} per player`);
console.log(`fewest floor weapons seen at any location in any setup: ${minClusterWeapons} (every location guarantees at least one)`);
const rt = rarity.reduce((a, b) => a + b, 0);
console.log("floor weapon rarity mix: " + RARITIES.map((q, i) => `${q.name} ${((rarity[i]! / rt) * 100).toFixed(1)}%`).join(", "));
