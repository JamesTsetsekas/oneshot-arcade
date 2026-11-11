// ui: in-match HUD. Pure presentation over the HudState read model; clicks dispatch through the session.
import { useEffect, useRef, useState } from 'react';
import { applyQuality, audio, debugNavOn, getSession, resumeGame, setDebugNav, surrender, toMenu, updateSettings } from '../app/app';
import { PALETTES } from '../app/settings';
import { activeSession } from '../game/session';
import { NEUTRAL } from '../sim/sim';
import { F_BRIDGE, F_BRUSH, F_CHASM, F_CLIFF, F_RAMP, F_ROCK, MAP_SIZE, VIS_SIZE, getMap } from '../world/map';
import { Glyph } from './glyphs';
import { ControlsHelp, SettingsPanel } from './Settings';
import { setState, useStore, type CardButton, type HudState } from './store';

function Cost({ b, hud }: { b: CardButton; hud: HudState }) {
  if (b.ore === undefined && b.flux === undefined) return null;
  return (
    <span className="cost">
      {b.ore ? <span className={hud.ore < b.ore ? 'res ore lack' : 'res ore'}><i />{b.ore}</span> : null}
      {b.flux ? <span className={hud.flux < b.flux ? 'res flux lack' : 'res flux'}><i />{b.flux}</span> : null}
      {b.supply ? <span className={hud.supplyUsed + b.supply > hud.supplyCap ? 'res sup lack' : 'res sup'}><i />{b.supply}</span> : null}
    </span>
  );
}

function CommandCard({ hud }: { hud: HudState }) {
  const [tip, setTip] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const timer = useRef(0);
  const cells: (CardButton | null)[] = Array.from({ length: 12 }, () => null);
  for (const b of hud.card) if (b.slot >= 0 && b.slot < 12) cells[b.slot] = b;
  const tipBtn = hud.card.find((b) => b.id === tip) ?? null;
  const enter = (id: string) => {
    setTip(id); setExpanded(false);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setExpanded(true), 350);
  };
  const leave = () => { setTip(null); window.clearTimeout(timer.current); };
  if (hud.card.length === 0) return <div className="panel card empty" />;
  return (
    <div className="panel card">
      {tipBtn && (
        <div className="tooltip">
          <div className="tt-head"><b>{tipBtn.label}</b><span className="kbd">{tipBtn.key}</span></div>
          <div className="tt-cost"><Cost b={tipBtn} hud={hud} />{tipBtn.time ? <span className="res time">{tipBtn.time}s</span> : null}</div>
          {tipBtn.reason ? <div className="tt-reason">{tipBtn.reason}</div> : null}
          <div className="tt-line">{tipBtn.tip[0]}</div>
          {expanded && tipBtn.tip.slice(1).map((l, i) => <div className="tt-line dim" key={i}>{l}</div>)}
        </div>
      )}
      <div className="card-grid">
        {cells.map((b, i) => b ? (
          <button key={b.id} className={`cbtn${b.disabled ? ' disabled' : ''}${b.active ? ' active' : ''}`} onMouseEnter={() => enter(b.id)} onMouseLeave={leave}
            onClick={() => { activeSession?.input.activate(b.id); }} aria-label={`${b.label} (${b.key})`}>
            {b.icon && <IconImg id={b.icon} />}
            {b.glyph && <Glyph name={b.glyph} />}
            <span className="hot">{b.key}</span>
            {b.count ? <span className="cnt">{b.count}</span> : null}
            {b.cooldown ? <span className="cd" style={{ height: `${Math.min(100, b.cooldown * 100)}%` }} /> : null}
            {(b.ore || b.flux) ? <span className={`mini${(b.ore ?? 0) > hud.ore || (b.flux ?? 0) > hud.flux ? ' lack' : ''}`}>{b.ore || ''}{b.flux ? <em>{b.ore ? '+' : ''}{b.flux}</em> : null}</span> : null}
          </button>
        ) : <div key={i} className="cbtn ghost" />)}
      </div>
    </div>
  );
}

function IconImg({ id }: { id: string }) {
  const src = useStore((s) => s.icons[id]);
  return src ? <img src={src} alt="" draggable={false} /> : null;
}

function Selection({ hud }: { hud: HudState }) {
  const s = hud.single;
  if (hud.selCount === 0) return <div className="panel sel empty"><span className="dim">No selection</span></div>;
  if (s) {
    const frac = s.maxHp > 0 ? s.hp / s.maxHp : 0;
    return (
      <div className={`panel sel ${s.ownerKind}`}>
        <div className="portrait">{s.icon ? <img src={s.icon} alt="" draggable={false} /> : null}</div>
        <div className="sel-main">
          <div className="sel-title"><b>{s.name}</b><span className="owner">{s.owner}</span></div>
          {s.resource >= 0 ? <div className="sel-status">{Math.ceil(s.resource)} remaining</div> : null}
          {s.maxHp > 1 && (
            <div className="bar hp"><i style={{ width: `${frac * 100}%`, background: frac > 0.6 ? '#5dea8e' : frac > 0.3 ? '#f2c94c' : '#f2584a' }} /><span>{s.hp} / {s.maxHp}</span></div>
          )}
          {s.maxShield > 0 && <div className="bar sh"><i style={{ width: `${(s.shield / s.maxShield) * 100}%` }} /><span>Shield {s.shield}</span></div>}
          {s.maxEnergy > 0 && <div className="bar en"><i style={{ width: `${(s.energy / s.maxEnergy) * 100}%` }} /><span>Energy {s.energy}</span></div>}
          {s.status ? <div className="sel-status">{s.status}</div> : null}
          {s.queue.length > 0 ? (
            <div className="queue">
              {s.queue.map((q, i) => (
                <button key={i} className={`qitem${q.paused ? ' paused' : ''}`} title={`${q.name} - click to cancel`} onClick={() => activeSession?.issue({ k: 'cancel', id: s.id, index: i })}>
                  {q.icon ? <img src={q.icon} alt="" /> : <Glyph name="tier" />}
                  {i === 0 && <span className="qbar"><i style={{ width: `${q.progress * 100}%` }} /></span>}
                </button>
              ))}
              {s.queue[0].paused ? <span className="qwarn">{s.queue[0].paused}</span> : null}
            </div>
          ) : (
            <>
              {s.stats.map((l, i) => <div className="sel-stat" key={i}>{l}</div>)}
              {s.tags.length > 0 && <div className="tags">{s.tags.map((t) => <span key={t}>{t}</span>)}</div>}
            </>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="panel sel multi">
      {hud.groups.map((g) => (
        <div key={g.def} className={`grp${g.active ? ' active' : ''}`} title={g.name}>
          {g.icon ? <img src={g.icon} alt="" draggable={false} /> : null}
          <span>{g.count}</span>
        </div>
      ))}
      <div className="multi-note">{hud.selCount} selected{hud.groups.length > 1 ? ' - Tab cycles types' : ''}</div>
    </div>
  );
}

// ---------------------------------------------------------------------- minimap
let baseCanvas: HTMLCanvasElement | null = null;
function minimapBase(): HTMLCanvasElement {
  if (baseCanvas) return baseCanvas;
  const map = getMap();
  const c = document.createElement('canvas');
  c.width = MAP_SIZE; c.height = MAP_SIZE;
  const ctx = c.getContext('2d') as CanvasRenderingContext2D;
  const img = ctx.createImageData(MAP_SIZE, MAP_SIZE);
  for (let i = 0; i < MAP_SIZE * MAP_SIZE; i++) {
    const f = map.flags[i], e = map.elev[i];
    let r = 52, g = 60, b = 74;
    if (f & F_ROCK) { r = 22; g = 25; b = 32; }
    else if (f & F_CLIFF) { r = 30; g = 34; b = 42; }
    else if (f & F_CHASM) { r = 14; g = 92; b = 96; }
    else if (f & F_BRIDGE) { r = 140; g = 150; b = 165; }
    else if (f & F_RAMP) { r = 96; g = 102; b = 116; }
    else if (f & F_BRUSH) { r = 74; g = 62; b = 120; }
    else if (e === 2) { r = 118; g = 122; b = 130; }
    else if (e === 0) { r = 36; g = 52; b = 60; }
    img.data[i * 4] = r; img.data[i * 4 + 1] = g; img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  baseCanvas = c;
  return c;
}

const fogCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;

function Minimap() {
  const ref = useRef<HTMLCanvasElement>(null);
  const tick = useStore((s) => s.minimapTick);
  const palette = useStore((s) => s.settings.palette);
  const SIZE = 216;
  useEffect(() => {
    const cv = ref.current, ses = activeSession;
    if (!cv || !ses || !fogCanvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (cv.width !== SIZE * dpr) { cv.width = SIZE * dpr; cv.height = SIZE * dpr; }
    const ctx = cv.getContext('2d') as CanvasRenderingContext2D;
    const s = ses.simulation;
    const me = ses.localPlayer;
    const obs = ses.mode !== 'play';
    const k = (SIZE * dpr) / MAP_SIZE;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(minimapBase(), 0, 0, SIZE * dpr, SIZE * dpr);
    const ps = s.players[me];
    const pal = PALETTES[palette];
    const hex = (n: number) => '#' + n.toString(16).padStart(6, '0');
    const colOf = (o: number) => (o === NEUTRAL ? hex(pal.neutral) : o === me ? hex(pal.self) : hex(pal.enemy));
    // resources + neutrals
    for (const e of s.ids) {
      if (!s.alive[e] || s.owner[e] !== NEUTRAL) continue;
      const d = s.d(e);
      if (!obs && !ps.explored[s.visIndex(s.x[e], s.z[e])]) continue;
      if (d.id === 'ore') { ctx.fillStyle = '#35e0d0'; ctx.fillRect(s.x[e] * k - 1.5 * dpr, s.z[e] * k - 1.5 * dpr, 3 * dpr, 3 * dpr); }
      else if (d.id === 'vent') { ctx.fillStyle = '#d8ff5a'; ctx.fillRect(s.x[e] * k - 2 * dpr, s.z[e] * k - 2 * dpr, 4 * dpr, 4 * dpr); }
      else if (d.id === 'watch_pylon') { ctx.fillStyle = s.capOwner[e] >= 0 ? colOf(s.capOwner[e]) : '#ffffff'; ctx.beginPath(); ctx.arc(s.x[e] * k, s.z[e] * k, 3.5 * dpr, 0, 6.3); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = dpr; ctx.stroke(); }
      else if (d.id === 'barrier') { ctx.fillStyle = '#8ff0e6'; ctx.fillRect(s.x[e] * k - 3 * dpr, s.z[e] * k - 3 * dpr, 6 * dpr, 6 * dpr); }
      else if (d.id === 'pod') { ctx.fillStyle = '#ffd27a'; ctx.fillRect(s.x[e] * k - 1.5 * dpr, s.z[e] * k - 1.5 * dpr, 3 * dpr, 3 * dpr); }
    }
    // fog
    if (!obs) {
      fogCanvas.width = VIS_SIZE; fogCanvas.height = VIS_SIZE;
      const fctx = fogCanvas.getContext('2d') as CanvasRenderingContext2D;
      const img = fctx.createImageData(VIS_SIZE, VIS_SIZE);
      for (let i = 0; i < VIS_SIZE * VIS_SIZE; i++) { img.data[i * 4 + 3] = ps.visible[i] ? 0 : ps.explored[i] ? 120 : 225; img.data[i * 4] = 4; img.data[i * 4 + 1] = 6; img.data[i * 4 + 2] = 10; }
      fctx.putImageData(img, 0, 0);
      ctx.drawImage(fogCanvas, 0, 0, SIZE * dpr, SIZE * dpr);
      for (const g of ps.ghosts.values()) {
        if (ps.visible[s.visIndex(g.x, g.z)]) continue;
        const half = Math.max(2, (s.defs[g.def].footprint / 2) * k);
        ctx.fillStyle = 'rgba(190,150,140,0.8)';
        ctx.fillRect(g.x * k - half, g.z * k - half, half * 2, half * 2);
      }
    }
    // units and structures
    for (const e of s.ids) {
      if (!s.alive[e] || s.owner[e] === NEUTRAL) continue;
      if (!obs && s.owner[e] !== me && !ps.visible[s.visIndex(s.x[e], s.z[e])]) continue;
      const d = s.d(e);
      ctx.fillStyle = colOf(s.owner[e]);
      if (d.cls === 'structure') { const half = Math.max(2 * dpr, (d.footprint / 2) * k); ctx.fillRect(s.x[e] * k - half, s.z[e] * k - half, half * 2, half * 2); }
      else ctx.fillRect(s.x[e] * k - 1.5 * dpr, s.z[e] * k - 1.5 * dpr, 3 * dpr, 3 * dpr);
    }
    // selection highlight
    ctx.fillStyle = '#ffffff';
    for (const e of ses.input.selection) if (s.alive[e] && s.owner[e] === me && s.isUnit(e)) ctx.fillRect(s.x[e] * k - dpr, s.z[e] * k - dpr, 2 * dpr, 2 * dpr);
    // alert pings
    const now = performance.now() / 1000;
    for (const a of (window as unknown as { __sfAlerts?: { x: number; z: number; t: number; kind: string }[] }).__sfAlerts ?? []) {
      const age = now - a.t;
      if (age > 6 || a.x < 0) continue;
      const rr = (4 + (age * 14) % 14) * dpr;
      ctx.strokeStyle = a.kind === 'attack' ? '#ff5a4a' : a.kind === 'good' ? '#7dff9a' : '#ffd27a';
      ctx.lineWidth = 2 * dpr; ctx.globalAlpha = Math.max(0, 1 - age / 6);
      ctx.beginPath(); ctx.arc(a.x * k, a.z * k, rr, 0, 6.3); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // camera frustum
    const r = ses.renderer;
    const pts: { x: number; z: number }[] = [];
    for (const [sx, sy] of [[0, 0], [1, 0], [1, 1], [0, 1]]) { const o = { x: 0, z: 0 }; if (r.screenToGround(sx * r.width, sy * r.height, o)) pts.push(o); }
    if (pts.length === 4) {
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.2 * dpr;
      ctx.beginPath();
      pts.forEach((p, i) => { const x = Math.max(0, Math.min(MAP_SIZE, p.x)) * k, z = Math.max(0, Math.min(MAP_SIZE, p.z)) * k; if (i === 0) ctx.moveTo(x, z); else ctx.lineTo(x, z); });
      ctx.closePath(); ctx.stroke();
    }
  }, [tick, palette]);

  const toWorld = (e: React.MouseEvent) => {
    const b = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { x: ((e.clientX - b.left) / b.width) * MAP_SIZE, z: ((e.clientY - b.top) / b.height) * MAP_SIZE };
  };
  const drag = useRef(false);
  const onDown = (e: React.MouseEvent) => {
    const ses = activeSession;
    if (!ses) return;
    const p = toWorld(e);
    if (e.button === 2 || (e.button === 0 && ses.input.mode === 'amove')) ses.input.minimapCommand(p.x, p.z, e.shiftKey);
    else if (e.button === 0) { drag.current = true; ses.renderer.rig.jump(p.x, p.z, true); }
  };
  const onMove = (e: React.MouseEvent) => {
    if (!drag.current || !activeSession) return;
    const p = toWorld(e);
    activeSession.renderer.rig.jump(p.x, p.z, true);
  };
  useEffect(() => { const up = () => { drag.current = false; }; window.addEventListener('mouseup', up); return () => window.removeEventListener('mouseup', up); }, []);
  return (
    <div className="panel minimap">
      <canvas ref={ref} style={{ width: SIZE, height: SIZE }} onMouseDown={onDown} onMouseMove={onMove} onContextMenu={(e) => e.preventDefault()} />
    </div>
  );
}

function TopBar({ hud }: { hud: HudState }) {
  const blocked = hud.supplyUsed >= hud.supplyCap;
  const sat = hud.saturation;
  return (
    <div className="panel topbar">
      <span className="res ore big" title="Prism Ore"><i />{hud.ore}</span>
      <span className="res flux big" title="Flux"><i />{hud.flux}</span>
      <span className={`res sup big${blocked ? ' lack' : ''}`} title="Supply used / cap"><i />{hud.supplyUsed}/{hud.supplyCap}</span>
      <span className="res wrk big" title={`Workers. Per base (assigned/ideal): ${sat.map((b) => `${b.workers}/${b.ideal}`).join(', ') || 'none'}`}>
        <i />{hud.workers}
        {sat.length > 0 && <em className={sat.some((b) => b.workers > b.ideal + 2) ? 'over' : ''}>{sat.map((b) => `${b.workers}/${b.ideal}`).join(' ')}</em>}
      </span>
      {hud.idleWorkers > 0 && <button className="idle" title="Idle workers - click or press . to select" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Period' }))}>{hud.idleWorkers} idle</button>}
      <span className="clock">{hud.time}</span>
      <button className="menu-btn" onClick={() => activeSession?.openMenu()} title="Menu (F10 / Esc)" aria-label="Menu">≡</button>
    </div>
  );
}

function Alerts({ hud }: { hud: HudState }) {
  // expose alert positions for minimap pings (wall-clock based fade)
  useEffect(() => {
    const now = performance.now() / 1000;
    const w = window as unknown as { __sfAlerts?: { id: number; x: number; z: number; t: number; kind: string }[] };
    const prev = w.__sfAlerts ?? [];
    w.__sfAlerts = hud.alerts.map((a) => prev.find((p) => p.id === a.id) ?? { id: a.id, x: a.x, z: a.z, t: now, kind: a.kind });
  }, [hud.alerts]);
  const notifications = useStore((s) => s.settings.notifications);
  if (!notifications) return null;
  return (
    <div className="alerts">
      {hud.alerts.map((a) => (
        <button key={a.id} className={`alert ${a.kind}`} onClick={() => { if (a.x >= 0 && activeSession) activeSession.renderer.rig.jump(a.x, a.z); }}>
          {a.text}{a.x >= 0 ? <span className="kbd small">Space</span> : null}
        </button>
      ))}
    </div>
  );
}

function ReplayBar({ hud }: { hud: HudState }) {
  const r = hud.replay;
  if (!r) return null;
  const ses = activeSession;
  return (
    <div className="panel replaybar">
      <b>{ses?.mode === 'replay' ? 'REPLAY' : 'SPECTATE'}</b>
      <button onClick={() => { if (ses) { ses.userPaused = !ses.paused; ses.setPaused(!ses.paused); ses.input.dirty = true; } }}>{r.paused ? 'Play' : 'Pause'}</button>
      {[1, 2, 4, 8].map((v) => <button key={v} className={r.speed === v ? 'on' : ''} onClick={() => ses?.setSpeed(v)}>{v}x</button>)}
      {ses?.mode === 'replay' && <span className={r.syncOk ? 'sync ok' : 'sync bad'}>{r.syncOk ? 'hashes match' : 'DESYNC'}</span>}
      {r.endTick > 0 && <span className="rbar"><i style={{ width: `${Math.min(100, (r.tick / r.endTick) * 100)}%` }} /></span>}
      <button onClick={() => toMenu()}>Exit</button>
    </div>
  );
}

function PerfPanel() {
  const p = useStore((s) => s.perf);
  const [nav, setNav] = useState(debugNavOn());
  if (!p) return null;
  return (
    <div className="panel perf">
      <div><b>{p.fps}</b> fps · frame {p.frameMs} ms · sim {p.simMs} ms/tick</div>
      <div>draw calls {p.drawCalls} · tris {(p.triangles / 1000).toFixed(0)}k · entities {p.entities}</div>
      <div>tick {p.tick} · paths {p.paths} · hash {p.hash}</div>
      {p.ai && <div>{p.ai}</div>}
      <button onClick={() => { setDebugNav(!nav); setNav(!nav); }}>{nav ? 'Hide' : 'Show'} nav / vision surfaces</button>
      {nav && <div className="legend"><i style={{ background: '#3f9bd6' }} />buildable<i style={{ background: '#2f7d4f' }} />walkable<i style={{ background: '#d6c23f' }} />ramp<i style={{ background: '#b08a2a' }} />hover-only<i style={{ background: '#7a2b2b' }} />blocked<i style={{ background: '#8a4fd0' }} />vision-blocking</div>}
    </div>
  );
}

function PauseMenu() {
  const tab = useStore((s) => s.pauseTab);
  const ses = getSession();
  const play = ses?.mode === 'play';
  return (
    <div className="overlay">
      <div className="panel modal">
        <h2>Paused</h2>
        {tab === 'main' && (
          <div className="menu-list">
            <button className="primary" onClick={() => resumeGame()}>Resume</button>
            <button onClick={() => setState({ pauseTab: 'controls' })}>Controls</button>
            <button onClick={() => setState({ pauseTab: 'settings' })}>Settings</button>
            {play && <button onClick={() => surrender()}>Surrender</button>}
            <button onClick={() => toMenu()}>Quit to menu</button>
          </div>
        )}
        {tab === 'settings' && <><SettingsPanel compact /><button onClick={() => setState({ pauseTab: 'main' })}>Back</button></>}
        {tab === 'controls' && <><ControlsHelp /><button onClick={() => setState({ pauseTab: 'main' })}>Back</button></>}
      </div>
    </div>
  );
}

export function Hud() {
  const hud = useStore((s) => s.hud);
  const pauseMenu = useStore((s) => s.pauseMenu);
  const lost = useStore((s) => s.contextLost);
  if (!hud) return null;
  const t = hud.tutorial;
  return (
    <div className={`hud faction-${hud.faction}`}>
      <div className="top-center">
        <div className="panel objective"><span className="lbl">{t ? `Tutorial ${t.step}/${t.total}` : hud.endgame ? 'Endgame' : 'Objective'}</span>{hud.objective}</div>
        {t && !t.done && <div className="panel tutorial"><p>{t.text}</p><div className="hint">▸ {t.hint}</div></div>}
        {hud.modeHint && <div className="mode-hint">{hud.modeHint}</div>}
        {hud.toast && <div className="toast">{hud.toast}</div>}
      </div>
      {!hud.replay && <TopBar hud={hud} />}
      <ReplayBar hud={hud} />
      <PerfPanel />
      <div className="bottom">
        <div className="left-col"><Alerts hud={hud} /><Minimap /></div>
        <div className="mid-col">
          {hud.controlGroups.some((n) => n > 0) && (
            <div className="groups">{hud.controlGroups.map((n, i) => n > 0 ? <button key={i} onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { code: `Digit${i}` }))}><b>{i}</b>{n}</button> : null)}</div>
          )}
          <Selection hud={hud} />
        </div>
        <CommandCard hud={hud} />
      </div>
      {pauseMenu && <PauseMenu />}
      {lost && (
        <div className="overlay"><div className="panel modal"><h2>Graphics context lost</h2><p>The browser reclaimed the graphics device. The match is paused and will resume automatically when the context is restored.</p><div className="menu-list"><button onClick={() => { audio.init(); location.reload(); }}>Reload page</button><button onClick={() => { setState({ contextLost: false }); toMenu(); }}>Return to menu</button></div></div></div>
      )}
    </div>
  );
}

export { applyQuality, updateSettings };
