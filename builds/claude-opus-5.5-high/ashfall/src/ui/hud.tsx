import React, { useEffect, useRef } from "react";
import { controller } from "../app/controller";
import { POTION_INFO, type PotionKind } from "../data/items";
import { SKILL_BY_ID } from "../data/skills";
import { RARITY_COLOR } from "../items/item";
import type { Game } from "../sim/game";
import { BLOCK, FLOOR, PIT, ROAD } from "../world/types";
import { store, useStore, type SkillSlot } from "./store";

function Orb({ frac, color, label, sub, side }: { frac: number; color: string; label: string; sub?: string; side: "left" | "right" }) {
  return (
    <div className={`orb ${side}`}>
      <div className="orb-fill" style={{ height: `${Math.max(0, Math.min(1, frac)) * 100}%`, background: color }} />
      <div className="orb-glass" />
      <div className="orb-text">{label}{sub && <small>{sub}</small>}</div>
    </div>
  );
}

function SlotView({ s, cost }: { s: SkillSlot; cost?: number }) {
  const def = s.id ? SKILL_BY_ID[s.id] : null;
  return (
    <div className={`skill ${!s.id ? "empty" : ""} ${!s.affordable ? "poor" : ""} ${s.active ? "active" : ""}`} title={def ? `${def.name}` : "Empty — assign in Skills (K)"}>
      <div className="skill-icon">{s.icon}</div>
      {s.cdFrac > 0 && <div className="skill-cd" style={{ background: `conic-gradient(rgba(0,0,0,0.72) ${s.cdFrac * 360}deg, transparent 0)` }}><span>{s.cdLeft > 0 ? s.cdLeft.toFixed(s.cdLeft < 2 ? 1 : 0) : ""}</span></div>}
      {s.charges !== null && <div className="skill-charges">{s.charges}</div>}
      <div className="skill-key">{s.key}</div>
      {def && def.cost > 0 && <div className="skill-cost">{cost ?? def.cost}</div>}
    </div>
  );
}

export function Hud() {
  const hud = useStore((s) => s.hud);
  const toasts = useStore((s) => s.toasts);
  const subtitle = useStore((s) => s.subtitle);
  const zoneBanner = useStore((s) => s.zoneBanner);
  useEffect(() => {
    const t = setInterval(() => {
      const now = performance.now();
      const s = store.get();
      const keep = s.toasts.filter((x) => now - x.t < 4200);
      const patch: any = {};
      if (keep.length !== s.toasts.length) patch.toasts = keep;
      if (s.subtitle && now - s.subtitle.t > 5000) patch.subtitle = null;
      if (s.zoneBanner && now - s.zoneBanner.t > 3200) patch.zoneBanner = null;
      if (Object.keys(patch).length) store.set(patch);
    }, 250);
    return () => clearInterval(t);
  }, []);
  if (!hud) return null;
  const kinds: PotionKind[] = ["health", "focus", "cleanse", "tonic"];
  return (
    <div className="hud">
      {hud.boss && (
        <div className="bossbar">
          <div className="boss-name">{hud.boss.name}{hud.boss.enraged ? " — ENRAGED" : ""} <small>Phase {hud.boss.phase}</small></div>
          <div className="bar big"><i style={{ width: `${hud.boss.hp * 100}%` }} className={hud.boss.invuln ? "invuln" : ""} /></div>
          {hud.boss.invuln && <div className="boss-note">Shielded — destroy the Conduits</div>}
          {hud.boss.armor !== null && <div className="bar armor" title="Armor plates: halve damage until broken; breaking them staggers the boss"><i style={{ width: `${hud.boss.armor * 100}%` }} /><span>Armor</span></div>}
          {hud.boss.stagger !== null && <div className="bar stagger" title="Fill to stagger the Engine before it overloads"><i style={{ width: `${hud.boss.stagger * 100}%` }} /><span>Stagger</span></div>}
        </div>
      )}
      {!hud.boss && hud.target && (
        <div className="targetbar">
          <div className="boss-name" style={{ color: hud.target.elite ? "#ffd060" : "#e8e0d0" }}>{hud.target.name} <small>Lv {hud.target.level}</small></div>
          {hud.target.mods.length > 0 && <div className="target-mods">{hud.target.mods.join(" · ")}</div>}
          <div className="bar"><i style={{ width: `${hud.target.hp * 100}%` }} /></div>
          {hud.target.info && <div className="boss-note">{hud.target.info}</div>}
        </div>
      )}
      {hud.huntTime !== null && <div className="hunt-timer">⌛ {hud.huntTime.toFixed(1)} s</div>}
      <Minimap />
      <div className="tracker">
        <div className="tracker-zone">{hud.zone}{hud.difficulty === "veteran" ? " · Veteran" : ""}</div>
        {hud.quests.map((q) => <div key={q.name} className={`tracker-q ${q.optional ? "opt" : ""}`}><b>{q.name}</b><span>{q.step}</span></div>)}
      </div>
      <div className="toasts">{toasts.map((t) => <div key={t.id} className={`toast ${t.kind}`}>{t.text}</div>)}</div>
      {subtitle && <div className="subtitle"><b>{subtitle.who}:</b> {subtitle.text}</div>}
      {zoneBanner && <div className="zonebanner">{zoneBanner.name}</div>}
      {hud.channel !== null && <div className="channel"><span>Opening town-gate…</span><div className="bar"><i style={{ width: `${hud.channel * 100}%` }} /></div></div>}
      <div className="statuses">{hud.statuses.map((s) => <div key={s.id} className={`status ${s.good ? "good" : "bad"}`}>{s.label}<small>{s.left < 99 ? `${s.left.toFixed(0)}s` : ""}</small></div>)}</div>
      <div className="bottom">
        <Orb side="left" frac={hud.hp / hud.maxHp} color="radial-gradient(circle at 40% 30%, #ff6a6a, #a01020 55%, #4a0610)" label={`${Math.ceil(hud.hp)}`} sub={`/ ${hud.maxHp}`} />
        <div className="centerbar">
          <div className="resource-row">
            {hud.cls === "cinder" ? (
              <div className="heat" title="Heat: gained when hit or blocking; spent by Cinder Ring and Furnace Heart"><div className="heat-fill" style={{ width: `${hud.heat}%` }} /><span>Heat {Math.round(hud.heat)}{hud.furnace ? " · Furnace" : ""}</span></div>
            ) : (
              <div className={`trace ${hud.markReady ? "ready" : ""}`} title="Move at least 2 m between Quickshots to apply a Trace mark">{hud.markReady ? "⌖ Trace ready" : "⌖ Move to Trace"}</div>
            )}
            <div className="evade" title="Evade charges (Space)">{Array.from({ length: hud.evadeMax }, (_, i) => <i key={i} className={i < hud.evade ? "on" : i === hud.evade ? "fill" : ""} style={i === hud.evade ? { background: `linear-gradient(90deg, #3ff0d0 ${hud.evadeFrac * 100}%, #233 0)` } : undefined} />)}</div>
          </div>
          <div className="skillbar">
            <SlotView s={hud.basic} />
            {hud.slots.map((s, i) => <SlotView key={i} s={s} />)}
            <div className="belt">
              {kinds.map((k, i) => (
                <div key={k} className={`potion ${hud.belt[k] ? "" : "empty"}`} title={`${POTION_INFO[k].name}: ${POTION_INFO[k].desc}`}>
                  <div className="potion-glass" style={{ background: POTION_INFO[k].color }} />
                  <span className="potion-n">{hud.belt[k]}/{hud.beltCap}</span>
                  <span className="skill-key">{hud.potionKeys[i]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="xpbar" title={`Level ${hud.level}: ${hud.xp} / ${hud.xpNext} XP`}><i style={{ width: `${(hud.xp / hud.xpNext) * 100}%` }} /><span>Level {hud.level}{hud.skillPoints > 0 ? ` · ${hud.skillPoints} skill pt (K)` : ""}{hud.attrPoints > 0 ? ` · ${hud.attrPoints} attr pt (C)` : ""}</span></div>
          <div className="menubtns">
            {[["inventory", "Inventory"], ["skills", "Skills"], ["character", "Character"], ["quests", "Quests"], ["map", "Map"]].map(([p, l]) => <button key={p} onClick={() => controller.openPanel(p as any)}>{l}</button>)}
            <span className="gold">◉ {hud.gold} gold · ✦ {hud.dust} dust</span>
          </div>
        </div>
        <Orb side="right" frac={hud.focus / hud.maxFocus} color="radial-gradient(circle at 40% 30%, #7ab0ff, #1a40a0 55%, #081840)" label={`${Math.floor(hud.focus)}`} sub={`/ ${hud.maxFocus} Focus`} />
      </div>
      {hud.fps > 0 && (window as any).__ashSettings?.showFps && <div className="fps">{hud.fps.toFixed(0)} fps</div>}
    </div>
  );
}

const S = Math.SQRT1_2;
let mapCache: { zone: string; tick: number; canvas: HTMLCanvasElement } | null = null;

/** Paints explored cells (1 px per cell) into a cached offscreen canvas. */
function exploredImage(g: Game): HTMLCanvasElement {
  const z = g.zone;
  if (mapCache && mapCache.zone === z.id + z.seed && g.tick - mapCache.tick < 10) return mapCache.canvas;
  const c = mapCache && mapCache.zone === z.id + z.seed ? mapCache.canvas : document.createElement("canvas");
  c.width = z.w; c.height = z.h;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(z.w, z.h);
  const cells = g.nav.cells;
  for (let y = 0; y < z.h; y++)
    for (let x = 0; x < z.w; x++) {
      const i = y * z.w + x;
      if (!g.explored[i]) continue;
      const cl = cells[i];
      let r = 0, gg = 0, b = 0, a = 0;
      if (cl === BLOCK) {
        let edge = false;
        for (let d = 0; d < 4 && !edge; d++) { const nx = x + [1, -1, 0, 0][d], ny = y + [0, 0, 1, -1][d]; const nc = cells[ny * z.w + nx]; if (nc === FLOOR || nc === ROAD) edge = true; }
        if (edge) { r = 165; gg = 150; b = 135; a = 170; }
      } else if (cl === PIT) { r = 25; gg = 12; b = 35; a = 220; }
      else if (cl === ROAD) { r = 175; gg = 145; b = 100; a = 150; }
      else { r = 95; gg = 90; b = 90; a = 130; }
      img.data.set([r, gg, b, a], i * 4);
    }
  ctx.putImageData(img, 0, 0);
  mapCache = { zone: z.id + z.seed, tick: g.tick, canvas: c };
  return c;
}

/**
 * Draws the automap rotated to match the fixed 45° camera so screen-up on the map equals screen-up in the world.
 * Only explored cells are shown; the procedural layout is never revealed in advance.
 */
export function drawMap(ctx: CanvasRenderingContext2D, g: Game, W: number, H: number, opts: { full: boolean; scale?: number; alpha?: number }) {
  const z = g.zone, p = g.player;
  const full = opts.full;
  const scale = full ? (Math.min(W, H) / ((z.w + z.h) * S)) * 0.96 : opts.scale ?? 2.4;
  const fx = full ? z.w / 2 : p.x, fy = full ? z.h / 2 : p.y;
  const cx = W / 2, cy = H / 2;
  const proj = (wx: number, wy: number): [number, number] => [cx + (S * (wx - fx) - S * (wy - fy)) * scale, cy + (-S * (wx - fx) - S * (wy - fy)) * scale];
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = full && opts.alpha !== undefined ? "rgba(0,0,0,0)" : full ? "rgba(10,8,12,0.92)" : "rgba(10,8,12,0.75)";
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.transform(S * scale, -S * scale, -S * scale, -S * scale, 0, 0);
  ctx.translate(-fx, -fy);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(exploredImage(g), 0, 0);
  ctx.restore();
  const seen = (x: number, y: number) => g.explored[Math.floor(y) * z.w + Math.floor(x)] === 1;
  const dot = (x: number, y: number, col: string, r: number, sym?: string) => {
    if (!seen(x, y)) return;
    const [sx, sy] = proj(x, y);
    if (sym) { ctx.fillStyle = col; ctx.font = `${Math.max(11, r * 3)}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(sym, sx, sy); return; }
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
  };
  for (const it of g.interactables) {
    if (it.hidden) continue;
    if (it.kind === "waypoint") dot(it.x, it.y, g.ch.waypoints.includes(it.data.wp) ? "#3ff0d0" : "#6a8a90", 5, "◈");
    else if (it.kind === "exit") dot(it.x, it.y, it.data.requires && !g.ch.flags[it.data.requires] ? "#ff5030" : "#9fdcff", 5, "⇵");
    else if (it.kind === "npc") dot(it.x, it.y, "#ffd060", 4, "●");
    else if (it.kind === "chest" && !it.open) dot(it.x, it.y, "#e0b040", 3);
    else if (it.kind === "cage" && !it.open) dot(it.x, it.y, "#ffd060", 5, "!");
    else if (it.kind === "lever" && !it.open) dot(it.x, it.y, "#ffd060", 4, "⌐");
    else if (it.kind === "stash") dot(it.x, it.y, "#e0b040", 4, "▣");
    else if (it.kind === "portal" || it.kind === "hunt_portal") dot(it.x, it.y, "#60c0ff", 5, "◎");
  }
  if (full) for (const lm of z.landmarks) if (seen(lm.x, lm.y)) { const [sx, sy] = proj(lm.x, lm.y); ctx.fillStyle = "rgba(230,220,200,0.85)"; ctx.font = "12px Georgia"; ctx.textAlign = "center"; ctx.fillText(lm.name, sx, sy - 12); }
  if (g.ch.echo && g.ch.echo.zone === z.id) dot(g.ch.echo.x, g.ch.echo.y, "#40ffe0", 5, "☽");
  for (const pk of g.pickups) if (pk.kind === "item" && pk.item && pk.item.rarity !== "worn") dot(pk.x, pk.y, RARITY_COLOR[pk.item.rarity], 2);
  for (const e of g.enemies) if (e.alive && e.aware && e.def.behavior !== "dummy" && Math.hypot(e.x - p.x, e.y - p.y) < 20) dot(e.x, e.y, e.isBoss ? "#ff3010" : e.isElite ? "#ffb030" : "#e04040", e.isBoss ? 5 : 2.5);
  // player arrow (facing transformed into map space)
  const [sx, sy] = proj(p.x, p.y);
  const dx = Math.cos(p.facing), dy = Math.sin(p.facing);
  const ax = S * dx - S * dy, ay = -S * dx - S * dy;
  const nx = -ay, ny = ax;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(sx + ax * 8, sy + ay * 8);
  ctx.lineTo(sx - ax * 5 + nx * 5, sy - ay * 5 + ny * 5);
  ctx.lineTo(sx - ax * 2, sy - ay * 2);
  ctx.lineTo(sx - ax * 5 - nx * 5, sy - ay * 5 - ny * 5);
  ctx.closePath(); ctx.fill();
}

function Minimap() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const t = setInterval(() => {
      const g = controller.game, c = ref.current;
      if (!g || !c) return;
      const ctx = c.getContext("2d")!;
      ctx.save();
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.beginPath(); ctx.arc(c.width / 2, c.height / 2, c.width / 2 - 2, 0, Math.PI * 2); ctx.clip();
      drawMap(ctx, g, c.width, c.height, { full: false, scale: 2.6 });
      ctx.restore();
    }, 100);
    return () => clearInterval(t);
  }, []);
  return <canvas ref={ref} className="minimap" width={200} height={200} />;
}

export function MapCanvas({ overlay }: { overlay?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const draw = () => {
      const g = controller.game, c = ref.current;
      if (!g || !c) return;
      const ctx = c.getContext("2d")!;
      drawMap(ctx, g, c.width, c.height, { full: true, alpha: overlay ? 0.5 : undefined });
    };
    draw();
    const t = setInterval(draw, 200);
    return () => clearInterval(t);
  }, [overlay]);
  return <canvas ref={ref} className={overlay ? "automap" : "fullmap"} width={overlay ? 900 : 760} height={overlay ? 900 : 760} />;
}
