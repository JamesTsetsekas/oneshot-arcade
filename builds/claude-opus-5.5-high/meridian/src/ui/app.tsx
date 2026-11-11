// React shell: main menu, loading, pause, map/phone, shops, inventory, mission screens, settings.
import { useEffect, useReducer, useRef, useState } from "react";
import type { Game } from "../sim/game";
import {
  WEAPONS, GADGETS, OUTFITS, AMMO_PACK, MEDKIT_PRICE, ARMOR_PRICE, GARAGE_SLOT_PRICE, carried,
  type ShopItem, type WeaponId, type AmmoType, type GadgetId,
} from "../sim/weapons";
import { STORY, STORY_GIVER, nextStory } from "../sim/missions/story";
import { fmtTime, fmtClock } from "../core/math";
import { Hud } from "./hud";
import { ACTION_LABEL, DEFAULT_BINDS, FOOT_ACTIONS, VEHICLE_ACTIONS, bindingConflicts, type Action } from "../input/input";
import type { Settings } from "../persistence/save";
import { DISTRICT_NAMES, type DistrictId } from "../world/district";

export type Screen = "loading" | "menu" | "game" | "error";
export type Overlay = null | "pause" | "map" | "phone" | "settings" | "load" | "credits" | "wheel" | "confirmNew";

export interface ShellApi {
  game: Game;
  screen: Screen;
  overlay: Overlay;
  loadProgress: number;
  loadLabel: string;
  error: string | null;
  hasSave: boolean;
  saveLabel: string;
  notice: string | null;
  setOverlay(o: Overlay): void;
  continueGame(): void;
  newGame(): void;
  loadKey(key: string): void;
  listSaves(): Promise<{ key: string; label: string; savedAt: number; ok: boolean }[]>;
  exportSave(): Promise<void>;
  importSave(file: File): Promise<void>;
  saveSettings(s: Settings): void;
  quitToMenu(): void;
  resume(): void;
  runBenchmark(): void;
  bench: { running: boolean; result: string | null };
  rebind(action: Action, done: () => void): void;
}

function useTick(ms: number) {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => { const id = setInterval(force, ms); return () => clearInterval(id); }, [ms]);
}

const Btn = (p: { onClick: () => void; children: any; disabled?: boolean; primary?: boolean; title?: string }) => (
  <button className={`btn${p.primary ? " primary" : ""}`} onClick={p.onClick} disabled={p.disabled} title={p.title}>{p.children}</button>
);

export function App({ shell }: { shell: ShellApi }) {
  useTick(100);
  const g = shell.game;
  if (shell.screen === "error") return <ErrorScreen msg={shell.error ?? "Unknown error"} />;
  if (shell.screen === "loading") return <Loading shell={shell} />;
  if (shell.screen === "menu") return <MainMenu shell={shell} />;
  const ui = g.ui;
  return (
    <>
      {ui.choice && <Choice shell={shell} />}
      {ui.panel && <Panel shell={shell} />}
      {!ui.panel && shell.overlay === "pause" && <Pause shell={shell} />}
      {!ui.panel && shell.overlay === "map" && <MapView shell={shell} />}
      {!ui.panel && shell.overlay === "phone" && <Phone shell={shell} />}
      {shell.overlay === "settings" && <SettingsView shell={shell} />}
      {shell.overlay === "wheel" && <Wheel shell={shell} />}
      {shell.notice && <div className="notice glass">{shell.notice}</div>}
    </>
  );
}

function ErrorScreen({ msg }: { msg: string }) {
  return (
    <div className="screen center">
      <div className="panel glass" style={{ maxWidth: 620 }}>
        <h1>Meridian Run can't start</h1>
        <p>{msg}</p>
        <p className="dim">Meridian Run needs a desktop browser with WebGL 2 (current Chrome, Edge or Firefox). Check that hardware acceleration is enabled in your browser settings, then reload.</p>
        <Btn onClick={() => location.reload()} primary>Reload</Btn>
      </div>
    </div>
  );
}

function Loading({ shell }: { shell: ShellApi }) {
  return (
    <div className="screen center loading">
      <div className="logo">MERIDIAN<span>RUN</span></div>
      <div className="loadbar"><i style={{ width: `${Math.round(shell.loadProgress * 100)}%` }} /></div>
      <div className="dim">{shell.loadLabel}</div>
    </div>
  );
}

function MainMenu({ shell }: { shell: ShellApi }) {
  const [saves, setSaves] = useState<{ key: string; label: string; savedAt: number; ok: boolean }[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const ov = shell.overlay;
  useEffect(() => { if (ov === "load") shell.listSaves().then(setSaves); }, [ov]);
  return (
    <div className="screen menu">
      <div className="menu-left">
        <div className="logo">MERIDIAN<span>RUN</span></div>
        <div className="tagline">Port Meridian · South Quay · one afternoon into night</div>
        {ov === null && (
          <div className="menu-buttons">
            {shell.hasSave && <Btn primary onClick={() => shell.continueGame()}>Continue <small>{shell.saveLabel}</small></Btn>}
            <Btn primary={!shell.hasSave} onClick={() => (shell.hasSave ? shell.setOverlay("confirmNew") : shell.newGame())}>New Game</Btn>
            <Btn onClick={() => shell.setOverlay("load")}>Load</Btn>
            <Btn onClick={() => shell.setOverlay("settings")}>Settings</Btn>
            <Btn onClick={() => shell.setOverlay("credits")}>Credits</Btn>
          </div>
        )}
        {ov === "confirmNew" && (
          <div className="panel glass">
            <p>Start a new game? Your autosave will be replaced after the first checkpoint (manual saves and backups stay in Load).</p>
            <Btn primary onClick={() => shell.newGame()}>Start new game</Btn> <Btn onClick={() => shell.setOverlay(null)}>Back</Btn>
          </div>
        )}
        {ov === "load" && (
          <div className="panel glass scroll">
            <h2>Load</h2>
            {!saves && <p className="dim">Reading saves…</p>}
            {saves && !saves.length && <p className="dim">No saves yet. Saves are written at safehouse rests and after missions.</p>}
            {saves?.map((s) => (
              <div className="row" key={s.key}>
                <span>{s.key.replace("slot:", "").replace("backup:", "backup ")} — {s.label} <small className="dim">{s.savedAt ? new Date(s.savedAt).toLocaleString() : ""}</small></span>
                <Btn disabled={!s.ok} onClick={() => shell.loadKey(s.key)}>{s.ok ? "Load" : "Corrupt"}</Btn>
              </div>
            ))}
            <div className="row">
              <Btn onClick={() => shell.exportSave()}>Export latest save</Btn>
              <Btn onClick={() => fileRef.current?.click()}>Import save file</Btn>
              <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) shell.importSave(f).then(() => shell.listSaves().then(setSaves)); }} />
            </div>
            <Btn onClick={() => shell.setOverlay(null)}>Back</Btn>
          </div>
        )}
        {ov === "credits" && (
          <div className="panel glass scroll">
            <h2>Credits</h2>
            <p>Meridian Run — South Quay vertical slice. An original game: city, characters, missions, vehicles, UI, music and sound are all original and generated procedurally at runtime.</p>
            <p>Built with Babylon.js (Apache-2.0), React (MIT) and Vite (MIT). No external art, audio or fonts are loaded.</p>
            <p className="dim">Built as a one-shot evaluation build by Opus 5.5.</p>
            <Btn onClick={() => shell.setOverlay(null)}>Back</Btn>
          </div>
        )}
        {ov === "settings" && <SettingsView shell={shell} />}
        {shell.notice && <div className="notice glass">{shell.notice}</div>}
      </div>
      <div className="menu-hint dim">WASD move · Mouse look · E interact/enter · F melee / exit vehicle · RMB aim · LMB fire · M map · P phone · Esc pause</div>
    </div>
  );
}

function Pause({ shell }: { shell: ShellApi }) {
  const g = shell.game;
  return (
    <div className="screen center dimbg">
      <div className="panel glass narrow">
        <h1>Paused</h1>
        <div className="dim">{g.districtName()} · {fmtClock(g.clock.hour)} · Day {g.clock.day}</div>
        <Btn primary onClick={() => shell.resume()}>Resume</Btn>
        <Btn onClick={() => shell.setOverlay("map")}>Map</Btn>
        <Btn onClick={() => shell.setOverlay("phone")}>Phone</Btn>
        <Btn onClick={() => shell.setOverlay("settings")}>Settings</Btn>
        {g.mission && <Btn onClick={() => { g.abandonMission(false); shell.resume(); }}>Abandon job: {g.mission.def.title}</Btn>}
        <Btn onClick={() => shell.quitToMenu()}>Quit to main menu</Btn>
        <p className="dim small">Progress saves when you rest at the safehouse bed and after each completed job.</p>
      </div>
    </div>
  );
}

function Choice({ shell }: { shell: ShellApi }) {
  const c = shell.game.ui.choice!;
  useEffect(() => {
    const h = (e: KeyboardEvent) => { const n = parseInt(e.key, 10); if (n >= 1 && n <= c.options.length) shell.game.ui.choiceResult = n - 1; };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [c]);
  return (
    <div className="choice glass">
      <div className="c-prompt">{c.prompt}</div>
      {c.options.map((o, i) => (
        <button key={i} className="btn choice-btn" onClick={() => (shell.game.ui.choiceResult = i)}><b>{i + 1}</b> {o.label}<small>{o.hint}</small></button>
      ))}
    </div>
  );
}

function Panel({ shell }: { shell: ShellApi }) {
  const g = shell.game;
  const ui = g.ui;
  const close = () => { g.closePanel(); shell.resume(); };
  const [msg, setMsg] = useState<string | null>(null);
  const buy = (it: ShopItem) => setMsg(g.buy(it) ?? "Purchased.");
  switch (ui.panel) {
    case "shop": {
      const items: { it: ShopItem; name: string; desc: string; price: number }[] = [
        ...(["pistol", "rifle", "shell", "stun"] as AmmoType[]).map((a) => ({ it: { kind: "ammo", ammo: a } as ShopItem, name: AMMO_PACK[a].name, desc: `+${AMMO_PACK[a].qty} (have ${g.inv.ammo[a]})`, price: AMMO_PACK[a].price })),
        { it: { kind: "medkit" }, name: "Medkit", desc: `Restores 60 health. Carry 2 (have ${g.inv.medkits}). Use with B.`, price: MEDKIT_PRICE },
        { it: { kind: "armor" }, name: "Light armor vest", desc: `Absorbs 70% of damage until worn out (${Math.round(g.inv.armor)}/50).`, price: ARMOR_PRICE },
        ...(["smoke", "chirper"] as GadgetId[]).map((k) => ({ it: { kind: "gadget", gadget: k } as ShopItem, name: GADGETS[k].name, desc: `${GADGETS[k].desc} (have ${g.inv.gadgets[k]}/${GADGETS[k].max})`, price: GADGETS[k].price })),
      ];
      return (
        <div className="screen center dimbg"><div className="panel glass wide">
          <h1>Harbor Supply</h1><p className="dim">Cash ${g.inv.cash}</p>
          <div className="grid">
            {items.map((x, i) => { const why = g.canBuy(x.it); return (
              <div className="card" key={i}><b>{x.name}</b><span className="dim small">{x.desc}</span><Btn disabled={!!why} onClick={() => buy(x.it)}>{why ?? `Buy $${x.price}`}</Btn></div>
            ); })}
          </div>
          {msg && <p>{msg}</p>}
          <Btn primary onClick={close}>Done</Btn>
        </div></div>
      );
    }
    case "kiosk":
      return (
        <div className="screen center dimbg"><div className="panel glass wide">
          <h1>Tidewear</h1>
          <p className="dim">Changing out of sight breaks your description for Wardens who haven't seen you. Officers who watch you change will still recognise you.</p>
          <div className="grid">
            {OUTFITS.map((o) => { const owned = g.inv.outfits.includes(o.id); const why = owned ? null : g.canBuy({ kind: "outfit", outfit: o.id }); return (
              <div className={`card${g.inv.outfit === o.id ? " sel" : ""}`} key={o.id}>
                <div className="swatch" style={{ background: `rgb(${o.top.map((c) => Math.round(c * 255)).join(",")})`, borderColor: `rgb(${o.accent.map((c) => Math.round(c * 255)).join(",")})` }} />
                <b>{o.name}</b>
                {owned ? <Btn disabled={g.inv.outfit === o.id} onClick={() => { g.setOutfit(o.id); setMsg(`Wearing ${o.name}.`); }}>{g.inv.outfit === o.id ? "Wearing" : "Wear"}</Btn>
                  : <Btn disabled={!!why} onClick={() => buy({ kind: "outfit", outfit: o.id })}>{why ?? `Buy $${o.price}`}</Btn>}
              </div>
            ); })}
          </div>
          {msg && <p>{msg}</p>}
          <Btn primary onClick={close}>Done</Btn>
        </div></div>
      );
    case "locker": {
      const ws = Object.values(WEAPONS).filter((w) => w.slot !== "none");
      return (
        <div className="screen center dimbg"><div className="panel glass wide">
          <h1>Gear locker</h1>
          <p className="dim">Carry one sidearm, one long gun and one melee item. Weapons unlock through story jobs and Trust — buy unlocked guns here.</p>
          <div className="grid">
            {ws.map((w) => {
              const unlocked = g.inv.unlocked.includes(w.id);
              const carriedNow = g.inv.sidearm === w.id || g.inv.long === w.id || g.inv.melee === w.id;
              const why = unlocked ? null : g.canBuy({ kind: "weapon", weapon: w.id });
              const storyLocked = !unlocked && !["pistol", "carbine", "shotgun", "marksman", "mpistol"].includes(w.id);
              return (
                <div className={`card${carriedNow ? " sel" : ""}`} key={w.id}>
                  <b>{w.name}</b> <span className={`tag ${w.lethal ? "lethal" : "nonlethal"}`}>{w.lethal ? "lethal" : "nonlethal"}</span>
                  <span className="dim small">{w.slot} · {w.desc}</span>
                  {unlocked ? <Btn disabled={carriedNow} onClick={() => { g.equipWeapon(w.id); setMsg(`${w.name} equipped.`); }}>{carriedNow ? "Carried" : "Equip"}</Btn>
                    : storyLocked ? <Btn disabled onClick={() => {}}>Locked</Btn>
                    : <Btn disabled={!!why} onClick={() => buy({ kind: "weapon", weapon: w.id })}>{why ?? `Buy $${w.price}`}</Btn>}
                </div>
              );
            })}
          </div>
          {msg && <p>{msg}</p>}
          <Btn primary onClick={close}>Done</Btn>
        </div></div>
      );
    }
    case "board":
      return (
        <div className="screen center dimbg"><div className="panel glass wide">
          <h1>Mission board</h1>
          <p className="dim">Replays use a clean authored loadout, record your grade and never pay twice.</p>
          {STORY.map((m) => { const done = g.progress.storyDone.includes(m.id); return (
            <div className="row" key={m.id}>
              <span><b>{m.title}</b> <span className="dim small">{m.blurb}</span> {g.progress.grades[m.id] && <span className="grade">{g.progress.grades[m.id]}</span>}</span>
              <Btn disabled={!done || !!g.mission} onClick={() => { g.closePanel(); g.startMission(m, true); shell.resume(); }}>{done ? "Replay" : "Locked"}</Btn>
            </div>
          ); })}
          <div className="row">
            <span><b>Safehouse garage slot</b> <span className="dim small">Park a car in the bay outside and press E to keep it.</span></span>
            <Btn disabled={!!g.canBuy({ kind: "garageSlot" })} onClick={() => buy({ kind: "garageSlot" })}>{g.canBuy({ kind: "garageSlot" }) ?? `Buy $${GARAGE_SLOT_PRICE}`}</Btn>
          </div>
          {msg && <p>{msg}</p>}
          <Btn primary onClick={close}>Done</Btn>
        </div></div>
      );
    case "rest":
      return (
        <div className="screen center dimbg"><div className="panel glass narrow">
          <h1>Rest</h1>
          <p className="dim">Resting heals you, advances time and saves your progress.</p>
          <Btn primary onClick={() => { g.rest(1); shell.resume(); }}>Nap for an hour (save)</Btn>
          <Btn onClick={() => { const h = g.clock.hour; g.rest(((19 - h) + 24) % 24 || 24); shell.resume(); }}>Sleep until evening (19:00)</Btn>
          <Btn onClick={() => { const h = g.clock.hour; g.rest(((15 - h) + 24) % 24 || 24); shell.resume(); }}>Sleep until afternoon (15:00)</Btn>
          <Btn onClick={close}>Cancel</Btn>
        </div></div>
      );
    case "police":
      return (
        <div className="screen center dimbg"><div className="panel glass narrow">
          <h1>Glassline Police Substation</h1>
          <p className="dim">Stats: {g.stats.arrests} arrests · {g.stats.crimes} reported incidents.</p>
          <Btn onClick={() => setMsg(g.payFines())}>Pay impound & fines</Btn>
          {msg && <p>{msg}</p>}
          <Btn primary onClick={close}>Leave</Btn>
        </div></div>
      );
    case "result": {
      const d = ui.panelData;
      const gr = d.grade;
      return (
        <div className="screen center dimbg"><div className="panel glass narrow">
          <div className="dim">{d.replay ? "Replay complete" : "Job complete"}</div>
          <h1>{d.def.title}</h1>
          {gr && <div className="biggrade">{gr.letter}</div>}
          {gr && <div className="stats">
            <div>Time <b>{fmtTime(gr.time)}</b></div><div>Damage taken <b>{Math.round(gr.damage)}</b></div><div>Civilians harmed <b>{gr.civHarm}</b></div>
            {gr.optional.map((o: any, i: number) => <div key={i}>{o.done ? "◆" : "◇"} {o.text}</div>)}
          </div>}
          <p>{d.rewarded ? `Paid $${d.def.reward.cash}+ · Trust +${d.def.reward.trust} xp` : d.replay ? "Replay: grade recorded, no rewards." : "Already paid for this job."}</p>
          {d.def.kind === "circuit" && d.circuitBest && <p>Best (local, unverified): {fmtTime(d.circuitBest)} · assists recorded: {g.progress.circuitAssists}</p>}
          <Btn primary onClick={close}>Continue</Btn>
        </div></div>
      );
    }
    case "fail": {
      const d = ui.panelData ?? {};
      return (
        <div className="screen center dimbg"><div className="panel glass narrow">
          <div className="dim">Job failed</div>
          <h1>{d.def?.title ?? g.mission?.def.title}</h1>
          <p>{d.reason ?? g.mission?.failReason}</p>
          <Btn primary onClick={() => { g.retryMission(); shell.resume(); }}>Retry from checkpoint</Btn>
          <Btn onClick={() => { g.abandonMission(true); if (!g.player.alive) g.respawnAfterDeath(); shell.resume(); }}>Abandon (back to contact)</Btn>
          <Btn onClick={() => { g.abandonMission(false); if (!g.player.alive) g.respawnAfterDeath(); shell.resume(); }}>Free roam</Btn>
        </div></div>
      );
    }
    case "dead":
      return (
        <div className="screen center dimbg"><div className="panel glass narrow">
          <h1>Down and out</h1>
          <p>Someone called the canal clinic. You'll be patched up — medical fee ${ui.panelData?.fee ?? 0}. You keep all your gear.</p>
          <Btn primary onClick={() => { g.respawnAfterDeath(); shell.resume(); }}>Wake up</Btn>
        </div></div>
      );
    case "busted":
      return (
        <div className="screen center dimbg"><div className="panel glass narrow">
          <h1>Booked at the substation</h1>
          <p>You complied. Fine paid: ${ui.panelData?.fine}. Confiscated as contraband: {ui.panelData?.lost} rounds of long-gun ammo. Unique gear kept.</p>
          <Btn primary onClick={close}>Walk out</Btn>
        </div></div>
      );
    default:
      return null;
  }
}

function Wheel({ shell }: { shell: ShellApi }) {
  const g = shell.game;
  const list = carried(g.inv);
  const n = list.length + 2;
  const items: { label: string; sub: string; tag: string; act: () => void; sel: boolean }[] = list.map((w, i) => {
    const s = WEAPONS[w];
    return { label: s.name, sub: s.ammo ? `${g.inv.mags[w] ?? 0}/${g.inv.ammo[s.ammo]}` : "", tag: s.lethal ? "lethal" : "nonlethal", act: () => { g.input.slot = i; }, sel: g.player.weapon === w };
  });
  for (const k of ["smoke", "chirper"] as GadgetId[]) items.push({ label: GADGETS[k].name, sub: `×${g.inv.gadgets[k]}`, tag: "gadget", act: () => { g.inv.selectedGadget = k; }, sel: g.inv.selectedGadget === k });
  return (
    <div className="wheel">
      {items.map((it, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        return (
          <button key={i} className={`wheel-item glass${it.sel ? " sel" : ""}`} style={{ left: `calc(50% + ${Math.cos(a) * 190}px)`, top: `calc(50% + ${Math.sin(a) * 190}px)` }} onMouseEnter={it.act} onClick={it.act}>
            <b>{it.label}</b><span>{it.sub}</span><span className={`tag ${it.tag}`}>{it.tag}</span>
          </button>
        );
      })}
      <div className="wheel-center glass">Hover to select · release Tab<br /><small>Medkits ×{g.inv.medkits} (B)</small></div>
    </div>
  );
}

function MapView({ shell }: { shell: ShellApi }) {
  const g = shell.game;
  const ref = useRef<HTMLCanvasElement>(null);
  const [view, setView] = useState({ cx: g.playerPos().x, cz: g.playerPos().z, scale: 1.1 });
  const [filters, setFilters] = useState({ missions: true, activities: true, services: true, landmarks: true, search: true });
  const drag = useRef<{ x: number; y: number; cx: number; cz: number } | null>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    const W = c.width, H = c.height;
    ctx.fillStyle = "#efe6d2"; ctx.fillRect(0, 0, W, H);
    const S = view.scale, ox = W / 2 - view.cx * S, oz = H / 2 + view.cz * S;
    ctx.fillStyle = "#d6c9aa";
    for (const b of g.d.buildings) ctx.fillRect(ox + b.x0 * S, oz - b.z1 * S, (b.x1 - b.x0) * S, (b.z1 - b.z0) * S);
    Hud.drawRoads(ctx, S, ox, oz);
    const P = (x: number, z: number) => [ox + x * S, oz - z * S] as const;
    // district labels
    ctx.fillStyle = "rgba(40,40,40,0.55)"; ctx.font = `bold ${Math.round(13 * Math.min(1.6, S))}px Bahnschrift, sans-serif`; ctx.textAlign = "center";
    const labels: [DistrictId, number, number][] = [["tide", -40, -160], ["foundry", -300, -230], ["glassline", 300, -60], ["lantern", -200, 300], ["breakwater", 0, -340], ["canal", 0, 75]];
    for (const [d, x, z] of labels) { const [px, py] = P(x, z); ctx.fillText(DISTRICT_NAMES[d].toUpperCase(), px, py); }
    const icon = (x: number, z: number, color: string, label: string, shape: "dot" | "sq" | "star" = "dot") => {
      const [px, py] = P(x, z);
      ctx.fillStyle = color; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
      ctx.beginPath();
      if (shape === "sq") ctx.rect(px - 6, py - 6, 12, 12); else if (shape === "star") { for (let k = 0; k < 10; k++) { const r = k % 2 ? 4 : 9, a = (k / 10) * Math.PI * 2 - Math.PI / 2; ctx.lineTo(px + Math.cos(a) * r, py + Math.sin(a) * r); } ctx.closePath(); } else ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#222"; ctx.font = "12px Bahnschrift, sans-serif"; ctx.textAlign = "left"; ctx.fillText(label, px + 10, py + 4);
    };
    if (filters.missions) {
      const next = nextStory(g.progress.storyDone);
      if (next) { const it = g.d.interacts.find((i) => i.id === STORY_GIVER[next.id])!; icon(it.x, it.z, "#e94f37", `Story: ${next.title}`, "star"); }
      for (const m of g.ui.markers) { if (m.kind === "area") { const [px, py] = P(m.x, m.z); ctx.fillStyle = "rgba(245,166,35,0.25)"; ctx.beginPath(); ctx.arc(px, py, m.r * S, 0, Math.PI * 2); ctx.fill(); } else icon(m.x, m.z, "#f5a623", "Objective"); }
    }
    if (filters.activities) { icon(-72, -140, "#2a9d8f", "Courier Runs (Mara / phone)"); icon(205, -94, "#2a9d8f", "Street Circuit start"); icon(-150, -340, "#2a9d8f", "Recovery Calls / Repair"); }
    if (filters.services) for (const it of g.d.interacts) if (["shop", "kiosk", "rest", "police"].includes(it.kind)) icon(it.x, it.z, "#264653", it.kind === "rest" ? "Safehouse" : it.label.split("—")[0].split(" counter")[0], "sq");
    if (filters.landmarks) for (const l of g.d.landmarks) if (g.progress.discovered.includes(l.id)) icon(l.x, l.z, "#8d6a9f", l.name);
    if (filters.search && g.police.tier > 0 && g.police.state !== "Pursuit") { const [px, py] = P(g.police.lkpX, g.police.lkpZ); ctx.strokeStyle = "rgba(220,50,50,0.9)"; ctx.setLineDash([8, 5]); ctx.beginPath(); ctx.arc(px, py, g.police.searchR * S, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
    if (g.ui.waypoint) icon(g.ui.waypoint.x, g.ui.waypoint.z, "#7b3fe4", "Waypoint");
    const pp = g.playerPos(); const [px, py] = P(pp.x, pp.z);
    ctx.fillStyle = "#0b6e75"; ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "#fff"; ctx.stroke();
  });
  const toWorld = (e: React.MouseEvent) => {
    const c = ref.current!; const r = c.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * c.width, y = ((e.clientY - r.top) / r.height) * c.height;
    return { x: (x - c.width / 2) / view.scale + view.cx, z: -(y - c.height / 2) / view.scale + view.cz };
  };
  return (
    <div className="screen center dimbg">
      <div className="panel glass map-panel">
        <div className="map-head"><h1>South Quay</h1><span className="dim">Click to set a GPS waypoint · right-click clears · drag to pan · wheel to zoom</span><Btn onClick={() => shell.resume()}>Close (M)</Btn></div>
        <div className="map-body">
          <canvas ref={ref} width={900} height={620} className="mapcanvas"
            onMouseDown={(e) => { if (e.button === 0) drag.current = { x: e.clientX, y: e.clientY, cx: view.cx, cz: view.cz }; }}
            onMouseMove={(e) => { const d = drag.current; if (d && (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 4)) setView({ ...view, cx: d.cx - (e.clientX - d.x) / view.scale, cz: d.cz + (e.clientY - d.y) / view.scale }); }}
            onMouseUp={(e) => { const d = drag.current; drag.current = null; if (e.button === 0 && d && Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) <= 4) { const w = toWorld(e); g.ui.waypoint = { x: w.x, z: w.z }; } }}
            onContextMenu={(e) => { e.preventDefault(); g.ui.waypoint = null; }}
            onWheel={(e) => setView({ ...view, scale: Math.min(4, Math.max(0.6, view.scale * (e.deltaY < 0 ? 1.15 : 0.87))) })} />
          <div className="legend">
            <h3>Legend & filters</h3>
            {(Object.keys(filters) as (keyof typeof filters)[]).map((k) => (
              <label key={k}><input type="checkbox" checked={filters[k]} onChange={(e) => setFilters({ ...filters, [k]: e.target.checked })} /> {k === "search" ? "Alert search area" : k[0].toUpperCase() + k.slice(1)}</label>
            ))}
            <div className="leg"><i style={{ background: "#e94f37" }} /> Story contact</div>
            <div className="leg"><i style={{ background: "#f5a623" }} /> Objective</div>
            <div className="leg"><i style={{ background: "#2a9d8f" }} /> Activity</div>
            <div className="leg"><i style={{ background: "#264653" }} /> Shop / service</div>
            <div className="leg"><i style={{ background: "#8d6a9f" }} /> Discovered landmark</div>
            <div className="leg"><i style={{ background: "#7b3fe4" }} /> Waypoint / GPS</div>
            <div className="dim small">Landmarks discovered: {g.progress.discovered.length}/{g.d.landmarks.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Phone({ shell }: { shell: ShellApi }) {
  const g = shell.game;
  const [tab, setTab] = useState<"jobs" | "contacts" | "progress">("jobs");
  const next = nextStory(g.progress.storyDone);
  const busy = !!g.mission;
  const gpsTo = (x: number, z: number) => { g.ui.waypoint = { x, z }; shell.resume(); };
  return (
    <div className="screen center dimbg">
      <div className="phone glass">
        <div className="phone-top"><b>Rowan's phone</b><span>{fmtClock(g.clock.hour)}</span></div>
        <div className="tabs">{(["jobs", "contacts", "progress"] as const).map((t) => <button key={t} className={`tab${tab === t ? " on" : ""}`} onClick={() => setTab(t)}>{t}</button>)}</div>
        {tab === "jobs" && <div className="scroll">
          {busy && <div className="card"><b>Active: {g.mission!.def.title}</b><span className="small">{g.ui.objective}</span><Btn onClick={() => { g.abandonMission(false); shell.resume(); }}>Abandon job</Btn></div>}
          {next ? <div className="card"><b>Story: {next.title}</b><span className="small dim">{next.blurb}</span><span className="small">Meet {next.giver} in person to start.</span>
            <Btn onClick={() => { const it = g.d.interacts.find((i) => i.id === STORY_GIVER[next.id])!; gpsTo(it.x, it.z); }}>Set GPS to {next.giver}</Btn></div>
            : <div className="card"><b>Story slice complete</b><span className="small dim">Replay missions from the safehouse board.</span></div>}
          <div className="card"><b>Courier Run</b><span className="small dim">Procedural pickup & drop with fragile / urgent / quiet modifiers.</span><Btn disabled={busy} onClick={() => { g.startCourier(); shell.resume(); }}>Accept a run</Btn></div>
          <div className="card"><b>Street Circuit: Glassline Loop</b><span className="small dim">3 laps through live traffic, ghost of your best run, hold R to reset (+5 s). Best: {g.progress.circuitBest ? fmtTime(g.progress.circuitBest) : "—"} (local, unverified)</span><Btn disabled={busy} onClick={() => { g.startCircuit(); shell.resume(); }}>Enter</Btn></div>
          <div className="card"><b>Recovery Call</b><span className="small dim">Find a reported stolen car in a search area and return it to Breakwater Repair. Condition bonus.</span><Btn disabled={busy} onClick={() => { g.startRecovery(); shell.resume(); }}>Take the call</Btn></div>
        </div>}
        {tab === "contacts" && <div className="scroll">
          <div className="card"><b>Mara Okoye — Quayside Couriers</b><span className="small dim">Dispatcher in the Tide Market plaza. Courier work, and she hates losing vans.</span><Btn onClick={() => gpsTo(-80, -125)}>GPS</Btn></div>
          {g.progress.storyDone.length >= 1 && <div className="card"><b>Ines Calder — journalist</b><span className="small dim">Canal path by the Glassline bridge. Chasing the automated-port contract.</span><Btn onClick={() => gpsTo(114, 58)}>GPS</Btn></div>}
          <div className="card"><b>Breakwater Repair</b><span className="small dim">Drive into the bay for repairs. Recovery calls come through here.</span><Btn onClick={() => gpsTo(-150, -352)}>GPS</Btn></div>
          <div className="card"><b>Harbor Supply</b><span className="small dim">Ammo, medkits, armor, gadgets.</span><Btn onClick={() => gpsTo(30, -112)}>GPS</Btn></div>
          <div className="card"><b>Safehouse — Rowan's Loft</b><span className="small dim">Rest & save, mission board, gear locker, garage slot.</span><Btn onClick={() => gpsTo(-55, 96)}>GPS</Btn></div>
        </div>}
        {tab === "progress" && <div className="scroll">
          <div className="card"><b>Trust {g.inv.trust}/5</b><span className="small dim">{g.inv.trustXp} xp. Trust unlocks contacts, gear stock, outfits and vehicle access — never raw damage.</span></div>
          {STORY.map((m) => <div className="row" key={m.id}><span>{m.title}</span><span>{g.progress.storyDone.includes(m.id) ? `Done ${g.progress.grades[m.id] ? "· " + g.progress.grades[m.id] : ""}` : "—"}</span></div>)}
          <div className="row"><span>Courier runs</span><span>{g.progress.courierRuns}</span></div>
          <div className="row"><span>Recoveries</span><span>{g.progress.recoveries}</span></div>
          <div className="row"><span>Landmarks</span><span>{g.progress.discovered.length}/{g.d.landmarks.length}</span></div>
          <div className="row"><span>Play time</span><span>{fmtTime(g.stats.playTime)}</span></div>
        </div>}
        <Btn onClick={() => shell.resume()}>Close (P)</Btn>
      </div>
    </div>
  );
}

function SettingsView({ shell }: { shell: ShellApi }) {
  const g = shell.game;
  const [s, setS] = useState<Settings>({ ...g.settings, binds: { ...g.settings.binds } });
  const [tab, setTab] = useState<"graphics" | "controls" | "audio" | "access" | "driving">("graphics");
  const [rebinding, setRebinding] = useState<Action | null>(null);
  const upd = (patch: Partial<Settings>) => { const n = { ...s, ...patch }; setS(n); shell.saveSettings(n); };
  const binds = { ...DEFAULT_BINDS, ...s.binds } as Record<Action, string>;
  const conflicts = bindingConflicts(binds);
  const Slider = (p: { label: string; k: keyof Settings; min: number; max: number; step: number }) => (
    <label className="set"><span>{p.label}</span><input type="range" min={p.min} max={p.max} step={p.step} value={s[p.k] as number} onChange={(e) => upd({ [p.k]: parseFloat(e.target.value) } as any)} /><b>{(s[p.k] as number).toFixed(p.step < 1 ? 1 : 0)}</b></label>
  );
  const Check = (p: { label: string; k: keyof Settings; hint?: string }) => (
    <label className="set"><span>{p.label}{p.hint && <small className="dim"> {p.hint}</small>}</span><input type="checkbox" checked={s[p.k] as boolean} onChange={(e) => upd({ [p.k]: e.target.checked } as any)} /></label>
  );
  return (
    <div className="screen center dimbg settings-screen">
      <div className="panel glass wide scroll">
        <h1>Settings</h1>
        <div className="tabs">{(["graphics", "controls", "audio", "access", "driving"] as const).map((t) => <button key={t} className={`tab${tab === t ? " on" : ""}`} onClick={() => setTab(t)}>{t === "access" ? "accessibility" : t}</button>)}</div>
        {tab === "graphics" && <div>
          <label className="set"><span>Quality preset</span><select value={s.quality} onChange={(e) => upd({ quality: e.target.value as any })}><option value="low">Low (30 FPS target, no shadows)</option><option value="medium">Medium</option><option value="high">High</option></select></label>
          <Check label="Shadows" k="shadows" />
          <Check label="Dynamic resolution" k="dynamicRes" hint="lowers render scale when frames run long" />
          <Slider label="Field of view" k="fov" min={75} max={100} step={1} />
          <Slider label="Traffic density" k="trafficDensity" min={0.3} max={1.3} step={0.1} />
          <Slider label="Pedestrian density" k="pedDensity" min={0.3} max={1.3} step={0.1} />
          <div className="row"><span>Benchmark route (30 s camera flight, current settings)</span><Btn disabled={shell.bench.running} onClick={() => shell.runBenchmark()}>{shell.bench.running ? "Running…" : "Run benchmark"}</Btn></div>
          {shell.bench.result && <p className="small">{shell.bench.result}</p>}
        </div>}
        {tab === "controls" && <div>
          <Slider label="Mouse sensitivity" k="sensitivity" min={0.3} max={2.5} step={0.1} />
          <Check label="Invert Y" k="invertY" />
          <Check label="Aim toggle (instead of hold)" k="aimToggle" />
          <Check label="Sprint toggle" k="sprintToggle" />
          <Check label="Camera recenters behind movement" k="camRecenter" />
          <Check label="Rotating minimap" k="minimapRotate" />
          <h3>Key bindings <small className="dim">(click, then press a key · on-foot and vehicle actions may share keys)</small></h3>
          {conflicts.length > 0 && <p className="warn small">{conflicts.join(" · ")}</p>}
          <div className="binds">
            {([...new Set([...FOOT_ACTIONS, ...VEHICLE_ACTIONS])] as Action[]).map((a) => (
              <div className="row" key={a}><span>{ACTION_LABEL[a]}</span>
                <button className="btn key" onClick={() => { setRebinding(a); shell.rebind(a, () => { setRebinding(null); setS({ ...g.settings, binds: { ...g.settings.binds } }); }); }}>{rebinding === a ? "press a key…" : binds[a].replace("Key", "").replace("Digit", "").replace("Left", " L")}</button>
              </div>
            ))}
          </div>
          <Btn onClick={() => upd({ binds: {} })}>Reset bindings</Btn>
        </div>}
        {tab === "audio" && <div>
          <Slider label="Master" k="master" min={0} max={1} step={0.1} />
          <Slider label="Radio / music" k="music" min={0} max={1} step={0.1} />
          <Slider label="Effects" k="sfx" min={0} max={1} step={0.1} />
          <Check label="Streamer mode" k="streamerMode" hint="disables radio music" />
        </div>}
        {tab === "access" && <div>
          <Check label="Subtitles" k="subtitles" />
          <Slider label="Subtitle size" k="subtitleSize" min={0.8} max={1.6} step={0.1} />
          <Check label="Reduced motion" k="reducedMotion" hint="no camera shake or recoil kick" />
          <Check label="Photosensitivity safe" k="photosensitive" hint="steady emergency lights, no flashing HUD" />
          <Check label="Colorblind-friendly markers" k="colorblind" hint="patterned beacon, yellow search area" />
        </div>}
        {tab === "driving" && <div>
          <Slider label="Stability assist" k="stabilityAssist" min={0} max={1} step={0.1} />
          <Check label="Traction control" k="tractionControl" />
          <p className="dim small">Assist settings are recorded with Street Circuit times.</p>
        </div>}
        <Btn primary onClick={() => shell.setOverlay(shell.screen === "game" ? "pause" : null)}>Back</Btn>
      </div>
    </div>
  );
}

export type { WeaponId };
