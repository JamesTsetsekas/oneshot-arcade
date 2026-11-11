import { getK17 } from "../src/shared/map/k17";
import { CollisionWorld } from "../src/shared/sim/collision";
import { getNav } from "../src/shared/bots/nav";

const map = getK17();
const col = new CollisionWorld(map);
const nav = getNav(col);
console.log(`boxes=${map.boxes.length} navNodes=${nav.nodes.length} spawns=${map.spawns.length}`);
const nodeAt = new Set(nav.nodes.map((n) => `${n.x},${n.z}`));
const lines: string[] = [];
for (let z = 38; z >= -37; z--) {
  let row = "";
  for (let x = -57; x <= 57; x++) {
    const solidWall = col.blocked(x, 0.05, z, 0.2, 1.8);
    const cover = col.overlaps(x, 0.05, z, 0.2, 0.3);
    const ch = solidWall ? (map.solidAt(x, z) ? "#" : "o") : map.indoorAt(x, z) ? "." : ",";
    row += nodeAt.has(`${x},${z}`) && !solidWall ? "+" : cover && !solidWall ? "c" : ch;
  }
  lines.push(String(z).padStart(4) + " " + row);
}
console.log(lines.join("\n"));
