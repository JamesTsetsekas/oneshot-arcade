import { Rng } from "../core/rng";
import { ENEMY_BY_ID, ELITE_MODS, ELITE_BY_ID } from "../data/enemies";
import { ROLE_POINTS, ELITE_POINTS, type Difficulty } from "../data/types";
import { BLOCK, FLOOR, ROAD, type InteractDef, type PackDef, type PackMember, type PropDef, type PropKind, type Theme, type ZoneData, type ZoneId, type Hazard } from "./types";

export class ZoneBuilder {
  cells: Uint8Array;
  reserved: Uint8Array;
  props: PropDef[] = [];
  interactables: InteractDef[] = [];
  packs: PackDef[] = [];
  hazards: Hazard[] = [];
  landmarks: ZoneData["landmarks"] = [];
  lights: ZoneData["lights"] = [];
  entries: ZoneData["entries"] = {};
  meta: Record<string, any> = {};
  private nextId = 1;

  constructor(public id: ZoneId, public name: string, public theme: Theme, public w: number, public h: number, public seed: number, public difficulty: Difficulty, public level: number, fill = BLOCK) {
    this.cells = new Uint8Array(w * h).fill(fill);
    this.reserved = new Uint8Array(w * h);
  }

  uid() { return this.nextId++; }

  inb(x: number, y: number) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  get(x: number, y: number) { return this.inb(x, y) ? this.cells[y * this.w + x] : BLOCK; }
  set(x: number, y: number, v: number) { if (this.inb(x, y)) this.cells[y * this.w + x] = v; }
  open(x: number, y: number) { const c = this.get(x, y); return c === FLOOR || c === ROAD; }

  rect(x0: number, y0: number, w: number, h: number, v: number) {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) this.set(x, y, v);
  }
  circle(cx: number, cy: number, r: number, v: number) {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
        if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) this.set(x, y, v);
  }
  reserve(x0: number, y0: number, w: number, h: number) {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (this.inb(x, y)) this.reserved[y * this.w + x] = 1;
  }
  reserveCircle(cx: number, cy: number, r: number) {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
        if (this.inb(x, y) && (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) this.reserved[y * this.w + x] = 1;
  }
  isReserved(x: number, y: number) { return this.inb(x, y) && this.reserved[y * this.w + x] === 1; }

  /** Carve an L-shaped corridor of given width between two points. */
  corridor(ax: number, ay: number, bx: number, by: number, width: number, v = FLOOR, horizontalFirst = true) {
    const half = Math.floor(width / 2);
    const hseg = (x0: number, x1: number, y: number) => { for (let x = Math.min(x0, x1) - half; x <= Math.max(x0, x1) + half; x++) for (let k = -half; k < width - half; k++) { this.set(x, y + k, v); } };
    const vseg = (y0: number, y1: number, x: number) => { for (let y = Math.min(y0, y1) - half; y <= Math.max(y0, y1) + half; y++) for (let k = -half; k < width - half; k++) { this.set(x + k, y, v); } };
    if (horizontalFirst) { hseg(ax, bx, ay); vseg(ay, by, bx); } else { vseg(ay, by, ax); hseg(ax, bx, by); }
  }

  prop(kind: PropKind, x: number, y: number, rot = 0, scale = 1, blocks = false) {
    this.props.push({ kind, x, y, rot, scale });
    if (blocks) this.set(Math.floor(x), Math.floor(y), BLOCK);
  }
  interact(kind: InteractDef["kind"], x: number, y: number, name: string, data?: Record<string, any>): InteractDef {
    const d: InteractDef = { id: this.uid(), kind, x, y, name, data };
    this.interactables.push(d);
    this.reserveCircle(x, y, 1.6);
    return d;
  }
  pack(p: Omit<PackDef, "id">): PackDef {
    const d = { ...p, id: this.uid() };
    this.packs.push(d);
    return d;
  }
  hazard(h: Omit<Hazard, "id">) { this.hazards.push({ ...h, id: this.uid() }); }
  light(x: number, y: number, color: string, intensity = 1, range = 8) { this.lights.push({ x, y, color, intensity, range }); }
  landmark(id: string, name: string, x: number, y: number) { this.landmarks.push({ id, name, x, y }); }

  /** Find a random open, unreserved cell inside a rect with a clearance radius. */
  findSpot(rng: Rng, x0: number, y0: number, w: number, h: number, clearance = 1, tries = 60): { x: number; y: number } | null {
    for (let i = 0; i < tries; i++) {
      const x = rng.int(x0, x0 + w - 1), y = rng.int(y0, y0 + h - 1);
      let ok = true;
      for (let dy = -clearance; dy <= clearance && ok; dy++) for (let dx = -clearance; dx <= clearance && ok; dx++) if (!this.open(x + dx, y + dy) || this.isReserved(x + dx, y + dy)) ok = false;
      if (ok) return { x: x + 0.5, y: y + 0.5 };
    }
    return null;
  }

  build(): ZoneData {
    return {
      id: this.id, name: this.name, theme: this.theme, seed: this.seed, difficulty: this.difficulty, level: this.level,
      w: this.w, h: this.h, cells: this.cells, entries: this.entries, props: this.props, interactables: this.interactables,
      packs: this.packs, hazards: this.hazards, landmarks: this.landmarks, lights: this.lights, meta: this.meta,
    };
  }
}

/** Choose elite modifiers respecting exclusions and a threat budget. */
export function rollEliteMods(rng: Rng, count: number, budget = 4): string[] {
  const out: string[] = [];
  let threat = 0;
  const pool = ELITE_MODS.slice();
  rng.shuffle(pool);
  for (const m of pool) {
    if (out.length >= count) break;
    if (threat + m.threat > budget) continue;
    if (out.some((o) => ELITE_BY_ID[o].excludes.includes(m.id) || m.excludes.includes(o))) continue;
    out.push(m.id);
    threat += m.threat;
  }
  return out;
}

export function eliteModsValid(mods: string[], budget = 4): boolean {
  let t = 0;
  for (const m of mods) {
    const d = ELITE_BY_ID[m];
    if (!d) return false;
    t += d.threat;
    if (mods.some((o) => o !== m && d.excludes.includes(o))) return false;
  }
  return t <= budget && new Set(mods).size === mods.length;
}

/** Compose a pack from a weighted enemy pool to a role-point budget (normal packs target 5–10 points). */
export function composePack(rng: Rng, pool: [string, number][], budgetMin: number, budgetMax: number, elite: boolean, difficulty: Difficulty): { members: PackMember[]; points: number } {
  const target = rng.int(budgetMin, budgetMax);
  const members: PackMember[] = [];
  let pts = 0;
  if (elite) {
    // elite leader: prefer bruiser/controller
    const leaders = pool.filter(([id]) => ["bruiser", "controller", "skirmisher"].includes(ENEMY_BY_ID[id].role));
    const leader = rng.weighted(leaders.length ? leaders : pool, (p) => p[1])![0];
    const mods = rollEliteMods(rng, difficulty === "veteran" ? 2 : 1);
    members.push({ enemy: leader, elite: mods });
    pts += ROLE_POINTS[ENEMY_BY_ID[leader].role] + ELITE_POINTS;
  }
  let guard = 0;
  // ranged/controller cap to keep packs readable
  let ranged = 0;
  while (pts < target + (elite ? ELITE_POINTS : 0) && guard++ < 40) {
    const [id] = rng.weighted(pool, (p) => p[1])!;
    const d = ENEMY_BY_ID[id];
    const rp = ROLE_POINTS[d.role];
    if (pts + rp > budgetMax + (elite ? ELITE_POINTS + 4 : 0)) continue;
    const isRanged = d.behavior === "ranged" || d.behavior === "support" || d.behavior === "kiter";
    if (isRanged && ranged >= 2) continue;
    if (isRanged) ranged++;
    members.push({ enemy: id });
    pts += rp;
  }
  return { members, points: pts };
}
