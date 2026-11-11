// client-ui: the island map, rendered once from the same sources as the 3D world (heights, palette, structures).
import { BoxFlag } from "../../shared/world/collision";
import type { IslandData } from "../../shared/world/island";
import { terrainColor } from "../renderer/palette";

export const MAP_WORLD = 1360; // metres covered by the map image (centred on the island)
export const MAP_PX = 720;

export function worldToMap(x: number, z: number, size: number): [number, number] {
  return [(x / MAP_WORLD + 0.5) * size, (0.5 - z / MAP_WORLD) * size];
}
export function mapToWorld(px: number, py: number, size: number): [number, number] {
  return [(px / size - 0.5) * MAP_WORLD, (0.5 - py / size) * MAP_WORLD];
}

export function renderIslandMap(isl: IslandData): HTMLCanvasElement {
  const S = MAP_PX;
  const cv = document.createElement("canvas");
  cv.width = S;
  cv.height = S;
  const ctx = cv.getContext("2d")!;
  const img = ctx.createImageData(S, S);
  const col = [0, 0, 0];
  const hf = isl.hf;
  for (let py = 0; py < S; py++)
    for (let px = 0; px < S; px++) {
      const [x, z] = mapToWorld(px + 0.5, py + 0.5, S);
      const h = hf.height(x, z);
      const i = (py * S + px) * 4;
      if (h < -0.15) {
        // void-sea: depth-tinted
        const d = Math.min(1, -h / 12);
        img.data[i] = 30 + (1 - d) * 60;
        img.data[i + 1] = 118 + (1 - d) * 70;
        img.data[i + 2] = 150 + (1 - d) * 50;
      } else {
        terrainColor(isl, x, z, col);
        // hillshade from the north-west
        const shade = 0.82 + Math.max(-0.3, Math.min(0.3, (hf.height(x - 3, z + 3) - hf.height(x + 3, z - 3)) * -0.045));
        const lift = 1 + Math.min(0.18, h / 300);
        img.data[i] = Math.min(255, col[0]! * 255 * shade * lift);
        img.data[i + 1] = Math.min(255, col[1]! * 255 * shade * lift);
        img.data[i + 2] = Math.min(255, col[2]! * 255 * shade * lift);
      }
      img.data[i + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  const k = S / MAP_WORLD;
  // tree canopy stipple
  ctx.fillStyle = "rgba(34,92,58,0.55)";
  for (const t of isl.trees) {
    const [px, py] = worldToMap(t.x, t.z, S);
    ctx.beginPath();
    ctx.arc(px, py, Math.max(0.9, 1.6 * t.s * k * 1.6), 0, Math.PI * 2);
    ctx.fill();
  }
  // structure footprints
  for (const b of isl.world.boxes) {
    if (b.flags & BoxFlag.NoRender) continue;
    if (b.hx < 1.2 && b.hz < 1.2) continue;
    if (b.hy * 2 < 0.25 && b.hx < 2) continue;
    const [px, py] = worldToMap(b.x, b.z, S);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(b.yaw);
    const r = (b.color >> 16) & 255,
      g = (b.color >> 8) & 255,
      bl = b.color & 255;
    ctx.fillStyle = `rgb(${Math.round(r * 0.82)},${Math.round(g * 0.8)},${Math.round(bl * 0.76)})`;
    ctx.fillRect(-b.hx * k, -b.hz * k, b.hx * 2 * k, b.hz * 2 * k);
    ctx.restore();
  }
  // traversal links
  ctx.strokeStyle = "rgba(60,40,20,0.75)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 2]);
  for (const z of isl.ziplines) {
    const [ax, ay] = worldToMap(z.ax, z.az, S);
    const [bx, by] = worldToMap(z.bx, z.bz, S);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  for (const v of isl.vents) {
    const [px, py] = worldToMap(v.x, v.z, S);
    ctx.fillStyle = "#7ff5e6";
    ctx.strokeStyle = "#0c5e58";
    ctx.beginPath();
    ctx.arc(px, py, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  return cv;
}
