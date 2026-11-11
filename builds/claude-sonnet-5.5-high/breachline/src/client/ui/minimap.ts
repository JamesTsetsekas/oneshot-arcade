// Rotating minimap. It only ever draws information the local player is allowed to know:
// teammates, boundaries, enemies that fired an unsuppressed weapon in the last ~1.2 s, scan/drone/dart reveals,
// telegraphed strikes, own support devices, and (perk-gated) hostile equipment and footprints.
import type { World } from "../../shared/sim/world";
import type { PlayerState } from "../../shared/sim/types";

const PX = 3; // px per metre in the baked map
const SIZE = 184;
const VIEW_M = 36; // metres visible from centre to edge
let cachedBase: HTMLCanvasElement | null = null;

function bakeMap(world: World): HTMLCanvasElement {
  if (cachedBase) return cachedBase;
  const W = 115, H = 95;
  const c = document.createElement("canvas");
  c.width = W * PX; c.height = H * PX;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0a1219"; g.fillRect(0, 0, c.width, c.height);
  const map = world.map;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const x = i - 57, z = j - 47;
    const solid = map.solidAt(x, z);
    const px = i * PX, py = (H - 1 - j) * PX;
    if (z < -36 || z > 38) { g.fillStyle = z < -36 ? "#0f2a3a" : "#10171d"; g.fillRect(px, py, PX, PX); continue; }
    if (solid) { g.fillStyle = "#16212b"; g.fillRect(px, py, PX, PX); }
    else { g.fillStyle = map.indoorAt(x, z) ? "#3c5163" : "#587184"; g.fillRect(px, py, PX, PX); }
  }
  // cover blocks
  g.fillStyle = "#26323d";
  for (const b of world.map.boxes) {
    if (b.kind !== "cover" && b.kind !== "pedestal") continue;
    g.fillRect((b.min.x + 57.5) * PX, (47.5 - b.max.z) * PX, (b.max.x - b.min.x) * PX, (b.max.z - b.min.z) * PX);
  }
  cachedBase = c;
  return c;
}

export class Minimap {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private base: HTMLCanvasElement;
  private lastFootT = 0;

  constructor(parent: HTMLElement, world: World) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = SIZE; this.canvas.height = SIZE;
    this.canvas.className = "mm-canvas";
    parent.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d")!;
    this.base = bakeMap(world);
  }

  draw(world: World, me: PlayerState, viewYaw: number, time: number): void {
    const g = this.ctx;
    const scale = SIZE / (VIEW_M * 2); // px per metre on screen
    g.clearRect(0, 0, SIZE, SIZE);
    g.save();
    g.beginPath(); g.rect(0, 0, SIZE, SIZE); g.clip();
    g.translate(SIZE / 2, SIZE / 2);
    g.rotate(-viewYaw); // rotate so facing is up
    // base map: world (x,z) -> base pixel ((x+57.5)*PX, (47.5-z)*PX)
    g.scale(scale / PX, scale / PX);
    g.translate(-(me.pos.x + 57.5) * PX, -(47.5 - me.pos.z) * PX);
    g.drawImage(this.base, 0, 0);
    g.restore();

    const toScreen = (x: number, z: number) => {
      const dx = x - me.pos.x, dz = z - me.pos.z;
      // world +z is "up" when yaw=0. Rotating the world by +yaw about the view centre.
      const c = Math.cos(viewYaw), s = Math.sin(viewYaw);
      const rx = dx * c - dz * s, rz = dx * s + dz * c;
      return { x: SIZE / 2 + rx * scale, y: SIZE / 2 - rz * scale };
    };
    const tri = (x: number, z: number, yaw: number, color: string, size = 5, outline = "#001018") => {
      const p = toScreen(x, z);
      if (p.x < -6 || p.y < -6 || p.x > SIZE + 6 || p.y > SIZE + 6) return;
      g.save(); g.translate(p.x, p.y); g.rotate(yaw - viewYaw + 0);
      g.beginPath(); g.moveTo(0, -size); g.lineTo(size * 0.75, size * 0.8); g.lineTo(0, size * 0.35); g.lineTo(-size * 0.75, size * 0.8); g.closePath();
      g.fillStyle = color; g.fill(); g.lineWidth = 1.2; g.strokeStyle = outline; g.stroke();
      g.restore();
    };
    const dot = (x: number, z: number, color: string, r = 3.4, ring = false) => {
      const p = toScreen(x, z);
      g.beginPath(); g.arc(p.x, p.y, r, 0, 7);
      if (ring) { g.strokeStyle = color; g.lineWidth = 1.6; g.stroke(); } else { g.fillStyle = color; g.fill(); g.strokeStyle = "#001018"; g.lineWidth = 1; g.stroke(); }
    };
    const cs = getComputedStyle(this.canvas.parentElement!.parentElement!);
    const t0 = cs.getPropertyValue("--t0").trim() || "#35c6e8";
    const t1 = cs.getPropertyValue("--t1").trim() || "#ff8a1f";
    const mine = me.team === 0 ? t0 : t1;
    const theirs = me.team === 0 ? t1 : t0;

    // telegraphed strikes
    for (const e of world.supportEvents) {
      if (e.kind === "mortar" || e.kind === "flight") {
        const p = toScreen(e.pos.x, e.pos.z);
        g.beginPath(); g.arc(p.x, p.y, (e.kind === "mortar" ? 6.5 : 12) * scale, 0, 7);
        g.strokeStyle = e.team === me.team ? "rgba(120,220,255,0.8)" : "rgba(255,70,60,0.9)"; g.lineWidth = 2; g.setLineDash([4, 3]); g.stroke(); g.setLineDash([]);
      }
    }
    // own devices; hostile devices only with Munitions Eye
    const eye = me.perks.includes("munitions");
    for (const d of world.deployables) {
      if (d.team === me.team) dot(d.pos.x, d.pos.z, d.kind === "drone" ? "#b9f3ff" : "#ffd27a", 3.6, d.kind === "drone");
      else if (eye) dot(d.pos.x, d.pos.z, "#ff5d73", 3.4, true);
    }
    if (eye) for (const pr of world.projectiles) if (pr.team !== me.team) dot(pr.pos.x, pr.pos.z, "#ff5d73", 2.2);
    // footprints (Trace Reader)
    if (me.perks.includes("tracereader")) {
      for (const q of world.players) {
        if (!q.alive || q.team === me.team) continue;
        for (const f of q.footprints) if (world.time - f.t < 6) { const p = toScreen(f.x, f.z); g.fillStyle = `rgba(255,180,120,${0.7 * (1 - (world.time - f.t) / 6)})`; g.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); }
      }
    }
    // teammates
    for (const q of world.players) {
      if (!q.alive || q.team !== me.team || q.id === me.id) continue;
      tri(q.pos.x, q.pos.z, q.yaw, mine, 5);
    }
    // enemies: only what the local player's team legitimately knows
    for (const q of world.players) {
      if (!q.alive || q.team === me.team) continue;
      const scanned = q.revealedUntil[me.team] > world.time;
      const firing = world.time - q.lastShotNoiseAt < 1.2 && !q.lastShotSuppressed;
      if (scanned) { tri(q.pos.x, q.pos.z, q.yaw, theirs, 5.4); const p = toScreen(q.pos.x, q.pos.z); g.beginPath(); g.arc(p.x, p.y, 8 + 2 * Math.sin(time * 8), 0, 7); g.strokeStyle = theirs; g.globalAlpha = 0.5; g.lineWidth = 1.2; g.stroke(); g.globalAlpha = 1; }
      else if (firing) dot(q.pos.x, q.pos.z, theirs, 3.2);
    }
    // me
    tri(me.pos.x, me.pos.z, viewYaw, "#ffffff", 6.2);
    void this.lastFootT;
  }
}
