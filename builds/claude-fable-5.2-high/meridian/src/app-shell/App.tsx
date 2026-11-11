// React shell: menus, map/phone, shops, mission dialogs and settings. The in-world HUD is not React.
import { useEffect, useRef, useState, useSyncExternalStore, ReactNode } from 'react';
import { Game, SLOT } from '../game-session/game';
import { ACTION_LABELS, Action, keyName, defaultSettings, Settings } from '../core/settings';
import { STORY, STORY_ORDER } from '../missions/data';
import { MARK_STYLE } from '../ui/minimap';
import { TRUST_LEVELS } from '../game-session/sim';
import { WEAPONS } from '../character/weapons';
import { UNIT_CAP } from '../police/units';

const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function Panel(p: { title: string; children: ReactNode; wide?: boolean; onClose?: () => void; kicker?: string }) {
  return (<div className="overlay"><div className={'sheet' + (p.wide ? ' wide' : '')}>
    <header><div><div className="kicker">{p.kicker ?? 'Port Meridian · South Quay'}</div><h2>{p.title}</h2></div>{p.onClose && <button className="x" onClick={p.onClose} aria-label="Close">Esc ✕</button>}</header>
    {p.children}</div></div>);
}

export function App({ game }: { game: Game }) {
  const st = useSyncExternalStore(game.subscribe.bind(game), game.getState);
  const sim = game.sim;
  switch (st.screen) {
    case 'boot': return <div className="overlay solid"><div className="boot">Checking your browser…</div></div>;
    case 'error': return (<div className="overlay solid"><div className="sheet"><header><div><div className="kicker">Something went wrong</div><h2>Meridian Run cannot continue</h2></div></header>
      <p className="lead">{st.error}</p><div className="row"><button className="primary" onClick={() => location.reload()}>Reload</button></div></div></div>);
    case 'loading': return <div className="overlay solid"><div className="boot"><div className="logo small">MERIDIAN RUN</div><div className="loadbar"><i /></div><div>{st.loading}</div></div></div>;
    case 'menu': return <Menu game={game} />;
    case 'credits': return (<Panel title="Credits" onClose={() => game.set({ screen: game.sim ? 'paused' : 'menu' })}>
      <p className="lead">Meridian Run is an original one-shot vertical slice: an original city, characters, vehicles, missions and audio.</p>
      <ul className="plain"><li>Design, code, procedural art and procedural audio: generated for the Oneshot Arcade evaluation.</li><li>Rendering: Babylon.js (Apache-2.0). Physics: Rapier (Apache-2.0). UI shell: React (MIT).</li><li>No third-party art, audio, maps or names are bundled. See ASSETS.md.</li></ul></Panel>);
    case 'settings': return <SettingsScreen game={game} />;
    case 'paused': return (<Panel title="Paused" onClose={() => game.resume()}>
      <div className="col"><button className="primary" onClick={() => game.resume()}>Resume</button><button onClick={() => game.open('map')}>Map</button><button onClick={() => game.open('phone')}>Phone</button>
        <button onClick={() => game.set({ screen: 'settings' })}>Settings</button><button onClick={() => game.set({ screen: 'credits' })}>Credits</button>
        <button onClick={() => game.quitToMenu()}>Quit to main menu</button></div>
      <p className="hint">Progress is saved at the safehouse on Tide Street and automatically after jobs. Unsaved progress is lost when you quit.</p>
      <Controls s={game.settings} /></Panel>);
    case 'map': return <MapScreen game={game} />;
    case 'phone': return <Phone game={game} />;
    case 'shop': return <Shop game={game} />;
    case 'safehouse': return <Safehouse game={game} />;
    case 'contact': {
      const m = STORY.find((x) => x.id === st.contact)!;
      return (<Panel title={m.title} kicker={`Job from ${m.giver}`} onClose={() => game.resume()}>
        <p className="lead">{m.brief}</p><div className="stats"><span>Pay ${m.reward.cash}</span><span>Trust +{m.reward.trust}</span><span>Par {fmtTime(m.par)}</span></div>
        <p className="hint">Graded on time, collisions, civilian safety and optional goals. Harming bystanders costs you — it is never rewarded.</p>
        <div className="row"><button className="primary" onClick={() => { sim.startMission(m); game.resume(); }}>Accept job</button><button onClick={() => game.resume()}>Not now</button></div></Panel>);
    }
    case 'choice': {
      const c = sim.missions.choice;
      if (!c) { queueMicrotask(() => game.resume()); return null; }
      return (<Panel title="Your call" kicker={sim.missions.active?.title}><p className="lead">{c.prompt}</p>
        <div className="col">{c.options.map((o, i) => <button key={i} onClick={() => { sim.missions.choose(i); game.resume(); }}>{o}</button>)}</div></Panel>);
    }
    case 'failed': {
      const m = sim.missions;
      return (<Panel title={m.active ? 'Job failed' : 'Down'} kicker={m.active?.title}>
        <p className="lead">{m.failed ?? 'You were incapacitated.'}</p>
        <div className="col"><button className="primary" onClick={() => { m.retry(); game.resume(); }}>Retry from checkpoint</button>
          <button onClick={() => { m.abandon(); if (sim.player.downed) sim.respawnAtSafehouse(true); game.resume(); }}>Abandon job — return to free roam</button></div>
        <p className="hint">Abandoning releases everything the job reserved and leaves the district as it was.</p></Panel>);
    }
    case 'result': {
      const r = sim.missions.result;
      if (!r) { queueMicrotask(() => game.resume()); return null; }
      return (<Panel title={r.title} kicker="Job complete">
        <div className="grade"><span className={'g g' + r.grade}>{r.grade}</span><div><div>Score {r.score}</div><div>Time {fmtTime(r.time)}</div><div>{r.cash ? `Paid $${r.cash}` : 'Replay — no duplicate pay'}{r.trust ? ` · Trust +${r.trust}` : ''}</div></div></div>
        <ul className="plain">{r.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
        <div className="row"><button className="primary" onClick={() => game.resume()}>Continue</button></div></Panel>);
    }
    case 'wheel': {
      const p = sim.player, inv = p.inv;
      const slots: [string, string, string, boolean, () => void][] = [
        ['1', inv.sidearm ? WEAPONS[inv.sidearm].name : '—', inv.sidearm ? `LETHAL · ${inv.mags[inv.sidearm] ?? 0} / ${inv.ammo[WEAPONS[inv.sidearm].ammo]}` : 'empty', !!inv.sidearm, () => p.selectSlot('sidearm')],
        ['2', inv.long ? WEAPONS[inv.long].name : 'No long gun', inv.long ? `LETHAL · ${inv.mags[inv.long] ?? 0} / ${inv.ammo[WEAPONS[inv.long].ammo]}` : 'Harbor Supply sells them (Trust 1)', !!inv.long, () => p.selectSlot('long')],
        ['3', 'Halcyon Stun Projector', `NONLETHAL · ${inv.mags.halcyon ?? 0} / ${inv.ammo.cell}`, inv.stun, () => p.selectSlot('stun')],
        ['H', 'Holster (baton on F)', 'NONLETHAL · unarmed stance draws no attention', true, () => p.selectSlot('none')],
      ];
      return (<Panel title="Weapons & gear" onClose={() => game.resume()}><div className="col">{slots.map(([k, n, d, ok, f]) => <button key={k} disabled={!ok} onClick={() => { f(); game.resume(); }}><b>{k}</b> {n}<small>{d}</small></button>)}</div>
        <p className="hint">Gadgets: G throws, Q switches — chirper {inv.chirper}, smoke {inv.smoke}. Medkits (Z): {inv.medkits}. Armor: {Math.round(inv.armor)}/50. The game is paused while this is open.</p></Panel>);
    }
    case 'benchmark': return <Panel title="Benchmark route complete"><pre className="pre">{st.benchmark}</pre><div className="row"><button className="primary" onClick={() => location.assign(location.pathname)}>Back to game</button></div></Panel>;
    default: return st.notice && st.screen === 'playing' ? null : null;
  }
}

function Menu({ game }: { game: Game }) {
  const st = game.state;
  const [confirm, setConfirm] = useState(false);
  return (<div className="overlay menu"><div className="menu-card">
    <div className="kicker">Port Meridian · South Quay</div><div className="logo">MERIDIAN RUN</div>
    <p className="tag">A courier, a harbor city, and a contract somebody rewrote overnight.</p>
    <div className="col">
      {st.save && <button className="primary" onClick={() => game.start('continue')}>Continue<small>{st.save.missions}/4 story jobs · ${st.save.cash} · {fmtTime(st.save.playTime)} played</small></button>}
      {!confirm ? <button className={st.save ? '' : 'primary'} onClick={() => (st.save ? setConfirm(true) : game.start('new'))}>New Game</button>
        : <button className="warn" onClick={() => game.start('new')}>Start over? Your save is replaced at the first autosave</button>}
      <button onClick={() => game.set({ screen: 'settings' })}>Settings</button><button onClick={() => game.set({ screen: 'credits' })}>Credits</button>
    </div>
    {st.notice && <p className="notice">{st.notice}</p>}
    <p className="hint">Keyboard and mouse. Click the game to capture the mouse; Esc pauses. Audio starts with your first click.</p>
  </div></div>);
}
function Controls({ s }: { s: Settings }) {
  const k = (a: Action) => keyName(s.binds[a]);
  return (<div className="controls"><div><h4>On foot</h4><p>{k('forward')}{k('left')}{k('back')}{k('right')} move · Mouse look · {k('sprint')} sprint · {k('crouch')} crouch · {k('jump')} jump/vault</p><p>{k('interact')} interact/enter · RMB aim · LMB fire · {k('reload')} reload · {k('action')} baton</p><p>1/2/3 weapons · {k('holster')} holster · {k('gadget')} throw gadget · {k('gadgetCycle')} switch · {k('medkit')} medkit · {k('shoulder')} shoulder</p></div>
    <div><h4>Vehicle</h4><p>{k('forward')}/{k('back')} throttle/brake · {k('left')}/{k('right')} steer · {k('jump')} handbrake</p><p>{k('action')} exit · {k('holster')} horn · {k('camera')} camera · {k('shoulder')} look back · {k('radio')} radio</p><p>{k('map')} map · {k('phone')} phone · {k('wheel')} weapon wheel</p></div></div>);
}

function SettingsScreen({ game }: { game: Game }) {
  const s = game.settings, [, force] = useState(0), [capturing, setCapturing] = useState<Action | null>(null);
  const up = (patch: Partial<Settings>, quality = false) => { Object.assign(s, patch); game.applySettings(quality); force((n) => n + 1); };
  const Tog = (p: { k: keyof Settings; label: string; hint?: string }) => <label className="tog"><input type="checkbox" checked={!!s[p.k]} onChange={(e) => up({ [p.k]: e.target.checked } as Partial<Settings>)} /><span>{p.label}{p.hint && <small>{p.hint}</small>}</span></label>;
  const Rng = (p: { k: keyof Settings; label: string; min: number; max: number; step: number; fmt?: (v: number) => string }) => <label className="rng"><span>{p.label}</span><input type="range" min={p.min} max={p.max} step={p.step} value={s[p.k] as number} onChange={(e) => up({ [p.k]: Number(e.target.value) } as Partial<Settings>)} /><em>{p.fmt ? p.fmt(s[p.k] as number) : String(s[p.k])}</em></label>;
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  return (<Panel title="Settings" wide onClose={() => game.set({ screen: game.sim && (game as any).started ? 'paused' : 'menu' })}>
    <div className="grid2">
      <section><h4>Graphics</h4>
        <label className="rng"><span>Preset</span><select value={s.quality} onChange={(e) => up({ quality: e.target.value as Settings['quality'] }, true)}><option value="low">Low (30 FPS fallback)</option><option value="medium">Medium</option><option value="high">High</option></select><em /></label>
        <Rng k="renderScale" label="Resolution scale" min={0.5} max={1.25} step={0.05} fmt={pct} /><Rng k="viewDistance" label="Detail distance" min={120} max={280} step={10} fmt={(v) => `${v} m`} />
        <Rng k="trafficDensity" label="Traffic density" min={6} max={34} step={1} /><Rng k="pedDensity" label="Pedestrian density" min={10} max={60} step={1} />
        <Rng k="fov" label="Field of view (on foot)" min={75} max={100} step={1} fmt={(v) => `${v}°`} /><Tog k="showFps" label="Show frame rate" />
        <h4>Audio</h4><Rng k="master" label="Master" min={0} max={1} step={0.05} fmt={pct} /><Rng k="sfx" label="Effects" min={0} max={1} step={0.05} fmt={pct} /><Rng k="music" label="Radio" min={0} max={1} step={0.05} fmt={pct} /><Rng k="ambience" label="Ambience" min={0} max={1} step={0.05} fmt={pct} />
        <Tog k="streamerMode" label="Streamer mode" hint="Turns the radio stations off" />
      </section>
      <section><h4>Controls</h4>
        <Rng k="sensitivity" label="Mouse sensitivity" min={0.3} max={2.5} step={0.05} fmt={(v) => v.toFixed(2)} /><Rng k="steerSensitivity" label="Steering sensitivity" min={0.5} max={1.5} step={0.05} fmt={(v) => v.toFixed(2)} />
        <Tog k="invertY" label="Invert vertical look" /><Tog k="recenter" label="Camera returns behind vehicle" /><Rng k="recenterDelay" label="Return delay" min={0.3} max={4} step={0.1} fmt={(v) => `${v.toFixed(1)} s`} />
        <Tog k="toggleAim" label="Toggle aim" hint="Instead of holding" /><Tog k="toggleCrouch" label="Toggle crouch" /><Tog k="toggleSprint" label="Toggle sprint" />
        <Tog k="traction" label="Traction control" hint="Driving assist" /><Tog k="stability" label="Counter-steer assist" hint="Driving assist" />
        <h4>Accessibility</h4><Tog k="subtitles" label="Subtitles" /><Rng k="subtitleScale" label="Subtitle size" min={0.8} max={1.6} step={0.1} fmt={pct} />
        <Tog k="reducedMotion" label="Reduced motion" hint="No camera shake or speed FOV" /><Tog k="reducedFlashes" label="Reduced flashes" hint="Lightbars cross-fade slowly; dimmer muzzle flash" />
        <Tog k="colorblind" label="Colourblind-safe Alert beacon" hint="Blue/orange with patterns" /><Tog k="minimapRotate" label="Minimap rotates with heading" />
      </section></div>
    <h4>Key bindings <small>click a key, then press the new one (Esc cancels)</small></h4>
    <div className="binds">{(Object.keys(ACTION_LABELS) as Action[]).map((a) => (<button key={a} className={capturing === a ? 'cap' : ''} onClick={() => {
      if (!game.input) { setCapturing(a); const h = (e: KeyboardEvent) => { e.preventDefault(); window.removeEventListener('keydown', h, true); if (e.code !== 'Escape') up({ binds: { ...s.binds, [a]: e.code } }); setCapturing(null); }; window.addEventListener('keydown', h, true); return; }
      setCapturing(a); game.input.capture = (code) => { up({ binds: { ...s.binds, [a]: code } }); setCapturing(null); };
    }}><span>{ACTION_LABELS[a]}</span><kbd>{capturing === a ? 'press…' : keyName(s.binds[a])}</kbd></button>))}</div>
    <div className="row"><button onClick={() => { const d = defaultSettings(); up({ ...d }, true); }}>Restore defaults</button></div>
  </Panel>);
}

function MapScreen({ game }: { game: Game }) {
  const ref = useRef<HTMLCanvasElement>(null), [, force] = useState(0), [hover, setHover] = useState('');
  const size = Math.min(720, Math.floor(window.innerHeight * 0.74));
  useEffect(() => { const c = ref.current; if (c) game.painter.drawFull(c.getContext('2d')!, size, game.overlay); });
  const kinds = ['shop', 'contact', 'activity', 'landmark'] as const;
  return (<Panel title="South Quay" kicker="Map · click to set or clear a waypoint" wide onClose={() => game.resume()}>
    <div className="maprow"><canvas ref={ref} width={size} height={size} className="fullmap"
      onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const [x, z] = game.painter.fullToWorld(e.clientX - r.left, e.clientY - r.top, size); const m = game.overlay.marks.find((k) => k.label && Math.hypot(k.x - x, k.z - z) < 16); setHover(m?.label ?? ''); }}
      onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); const [x, z] = game.painter.fullToWorld(e.clientX - r.left, e.clientY - r.top, size); game.setWaypoint(x, z); force((n) => n + 1); }} />
      <div className="legend"><h4>Legend</h4>{(Object.keys(MARK_STYLE) as (keyof typeof MARK_STYLE)[]).filter((k) => k !== 'area' && k !== 'side').map((k) => <div key={k}><i style={{ background: MARK_STYLE[k].color }} />{MARK_STYLE[k].label}</div>)}
        <div><i style={{ background: '#ff4f9a', height: 4 }} />GPS route</div><div><i style={{ background: 'rgba(224,60,60,.5)', borderRadius: 9 }} />Police search area</div>
        <h4>Filters</h4>{kinds.map((k) => <label key={k} className="tog"><input type="checkbox" checked={game.mapFilter[k]} onChange={(e) => { game.mapFilter[k] = e.target.checked; (game as any).updateOverlay(0); force((n) => n + 1); }} /><span>{MARK_STYLE[k].label}</span></label>)}
        <p className="hint">{hover || 'Hover a marker for its name. The GPS follows roads and re-routes if you miss a turn; it never drives for you.'}</p>
        {game.waypoint && <button onClick={() => { game.waypoint = null; (game as any).updateOverlay(0); force((n) => n + 1); }}>Clear waypoint</button>}</div></div>
  </Panel>);
}

function Phone({ game }: { game: Game }) {
  const sim = game.sim, m = sim.missions, [tab, setTab] = useState<'jobs' | 'activities' | 'contacts' | 'stats'>('jobs'), [, force] = useState(0);
  const lvl = sim.trustLevel, next = TRUST_LEVELS[Math.min(5, lvl + 1)];
  const st = sim.player.stats;
  return (<Panel title="Phone" kicker={`${sim.clock.label} · $${Math.floor(sim.economy.cash)} · Trust ${lvl}${lvl < 5 ? ` (${sim.economy.trust}/${next})` : ''}`} onClose={() => game.resume()}>
    <div className="tabs">{(['jobs', 'activities', 'contacts', 'stats'] as const).map((t) => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}</div>
    {m.active && <div className="card active"><b>Active: {m.active.title}</b><span>{m.objective}</span><button className="warn" onClick={() => { m.abandon(); force((n) => n + 1); }}>Abandon job</button></div>}
    {tab === 'jobs' && <div className="list">{STORY.map((s) => { const done = m.progress.completed[s.id], open = m.isUnlocked(s.id, STORY_ORDER); return (<div key={s.id} className={'card' + (open ? '' : ' locked')}>
      <b>{s.title}{done && <span className={'g g' + done.grade}>{done.grade}</span>}</b><span>{open ? s.brief : 'Finish the previous job to unlock.'}</span>
      {open && !done && !m.active && <button onClick={() => { game.setWaypoint(...giver(s.id)); game.resume(); }}>Set GPS to {s.giver}</button>}
      {done && <small>Best {fmtTime(done.time)} · replay it from the safehouse board</small>}</div>); })}</div>}
    {tab === 'activities' && <div className="list">{!m.progress.completed.m1 && <div className="card locked"><span>Finish First Shift to open the activity board.</span></div>}
      {m.progress.completed.m1 && sim.activityOffers.map((a) => (<div key={a.id} className="card"><b>{a.title}</b><span>{a.brief}</span><small>Pay ${a.reward.cash} · Trust +{a.reward.trust}{a.id === 'circuit' && m.progress.circuitBest ? ` · Best ${m.progress.circuitBest.toFixed(1)} s (local, unverified)` : ''}</small>
        <button disabled={!!m.active} onClick={() => { if (sim.startMission(a)) game.resume(); else force((n) => n + 1); }}>Start</button></div>))}
      {m.progress.completed.m1 && <button onClick={() => { sim.refreshOffers(); force((n) => n + 1); }}>Refresh offers</button>}</div>}
    {tab === 'contacts' && <div className="list"><div className="card"><b>Imre Calloway</b><span>Dispatcher, Kestrel Couriers. Depot beside your safehouse on Tide Street.</span></div>
      <div className="card"><b>Odalys Brandt</b><span>Archivist, Dockhands Union Hall, Foundry Row.</span></div>
      <div className="card"><b>Breakwater Auto &amp; Marine</b><span>Repairs, resprays and vehicle papers on Breakwater Drive.</span></div></div>}
    {tab === 'stats' && <div className="list"><div className="card"><span>Distance travelled {(st.distance / 1000).toFixed(1)} km · Crashes {st.crashes} · Shots fired {st.shotsFired}</span>
      <span>Civilians harmed {st.civiliansHurt} · Crimes recorded {sim.police.stats.crimes} · Reported {sim.police.stats.reported}</span><span>Searches escaped {sim.police.stats.escapes} · Arrests {sim.police.stats.arrests} · Play time {fmtTime(sim.playTime)}</span>
      <small>Alert response is finite: at most {UNIT_CAP[5]} police vehicles at once.</small></div></div>}
  </Panel>);
  function giver(id: string): [number, number] { const a = id === 'm1' || id === 'm3' ? [-96, -88] : [205, -88]; return a as [number, number]; }
}

function Shop({ game }: { game: Game }) {
  const sim = game.sim, shop = game.state.shop, [, force] = useState(0);
  const title = { mart: 'Quay Mart', supply: 'Harbor Supply', clothing: 'Thread & Tide', garage: 'Breakwater Auto & Marine' }[shop];
  return (<Panel title={title} kicker={`Cash $${Math.floor(sim.economy.cash)} · Trust ${sim.trustLevel}`} onClose={() => game.resume()}>
    <div className="list">{sim.shopItems(shop).map((it) => (<div key={it.id} className="card shop"><div><b>{it.label}</b><span>{it.detail}</span></div>
      <button disabled={!!it.disabled || sim.economy.cash < it.price} onClick={() => { sim.buy(shop, it.id); force((n) => n + 1); }}>{it.disabled ?? (it.price ? `$${it.price}` : 'Wear')}</button></div>))}</div>
    <p className="hint">Trust opens gear and paperwork; it never raises health or damage.</p></Panel>);
}

function Safehouse({ game }: { game: Game }) {
  const sim = game.sim, m = sim.missions, [msg, setMsg] = useState(''), file = useRef<HTMLInputElement>(null);
  return (<Panel title="Safehouse" kicker="Tide Street" onClose={() => game.resume()}>
    <div className="col">
      <button className="primary" onClick={async () => { if (!sim.rest()) { setMsg('Not while the search is on.'); return; } sim.autosaveWanted = ''; const ok = await game.save('rest'); setMsg(ok ? 'Rested and saved. It is a fresh afternoon.' : 'Rested, but the save could not be written.'); }}>Rest and save</button>
      {m.progress.completed.m1 && <button onClick={() => { sim.recallBike(); setMsg('Your registered vehicle is parked in the courier bay outside.'); }}>Bring my vehicle to the courier bay</button>}
    </div>
    {msg && <p className="notice">{msg}</p>}
    <h4>Job board — replay</h4>
    <div className="list">{STORY.filter((s) => m.progress.completed[s.id]).map((s) => (<div key={s.id} className="card shop"><div><b>{s.title} <span className={'g g' + m.progress.completed[s.id].grade}>{m.progress.completed[s.id].grade}</span></b><span>Clean loadout, grade recorded, no duplicate pay.</span></div>
      <button disabled={!!m.active} onClick={() => { if (sim.startMission(s, true)) game.resume(); }}>Replay</button></div>))}
      {!STORY.some((s) => m.progress.completed[s.id]) && <div className="card locked"><span>Completed story jobs appear here.</span></div>}</div>
    <h4>Save file</h4>
    <div className="row"><button onClick={async () => { const t = await game.repo.exportSlot(SLOT).catch(() => null); if (!t) { setMsg('Nothing saved yet.'); return; } const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'application/json' })); a.download = 'meridian-run-save.json'; a.click(); setMsg('Save exported.'); }}>Export</button>
      <button onClick={() => file.current?.click()}>Import</button><input ref={file} type="file" accept="application/json" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { await game.repo.importSlot(SLOT, await f.text()); setMsg('Save imported. Quit to the main menu and choose Continue to load it.'); } catch (err) { setMsg('Import failed: ' + (err as Error).message); } }} /></div>
  </Panel>);
}
