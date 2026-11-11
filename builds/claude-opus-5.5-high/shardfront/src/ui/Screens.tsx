import { useEffect, useRef, useState } from 'react';
import { ABILITIES, FACTIONS, STRUCTURES, TECHS, UNITS, factionStructures, factionTechs, factionUnits, requirementName, type FactionId } from '../faction-data';
import { createGlassRavine, F_BRUSH, F_CHASM, F_CLIFF, F_RAMP, F_ROCK } from '../world/map';
import { iconFor, structureDetail, weaponText } from '../game/client';
import { ACTION_LABELS, DEFAULT_BINDINGS, keyLabel, type Action } from '../input-camera/bindings';
import { BANNERS, type MatchRecord, type Profile, type Settings } from '../persistence/store';
import type { MatchRunner } from '../game/runner';
import type { Sim } from '../simulation-core/sim';

export type Difficulty = 'easy' | 'normal' | 'hard';

// ------------------------------------------------------------------ main menu
export function MainMenu({ profile, go, notice }: { profile: Profile; go: (s: string) => void; notice: string }) {
  const total = profile.mastery.helix + profile.mastery.verdant;
  const banner = BANNERS.find((b) => b.id === profile.banner) ?? BANNERS[0];
  const next = BANNERS.find((b) => b.xp > total);
  const items: [string, string, string][] = [
    ['setup', 'Play', 'Skirmish vs AI on Glass Ravine'],
    ['tutorial', 'Tutorial', profile.tutorialComplete ? 'Completed — replay anytime' : 'Learn the loop in ~8 minutes'],
    ['archive', 'Tech Archive', 'Units, structures, counters'],
    ['replays', 'Replays', 'Match history & recorded games'],
    ['settings', 'Settings', 'Graphics, audio, controls'],
    ['credits', 'Credits', ''],
  ];
  return (
    <div className="screen">
      <div className="bgArt" />
      <ShardLines />
      <div className="menuWrap">
        <div>
          <h1 className="logo">SHARD<span>FRONT</span></h1>
          <div className="tag">Real-time strategy on a fractured moon</div>
          <div className="menuList">
            {items.map(([id, label, sub]) => (
              <button key={id} className="menuBtn" onClick={() => go(id)} autoFocus={id === 'setup'}>{label}<small>{sub}</small></button>
            ))}
          </div>
          {notice && <div className="panel" style={{ marginTop: 24, borderColor: 'rgba(255,196,107,0.5)', color: 'var(--amber)' }}>{notice}</div>}
        </div>
        <div className="profileCard">
          <h3>Commander profile</h3>
          <div className="banner" style={{ background: banner.color }} />
          <div className="xpRow"><span>Banner</span><b>{banner.id}</b></div>
          {(['helix', 'verdant'] as const).map((f) => (
            <div key={f}>
              <div className="xpRow"><span style={{ color: FACTIONS[f].color }}>{FACTIONS[f].name} mastery</span><b>{profile.mastery[f]} XP</b></div>
              <div className="xpBar"><i style={{ width: `${Math.min(100, (profile.mastery[f] % 1000) / 10)}%`, background: FACTIONS[f].color }} /></div>
            </div>
          ))}
          <div className="muted" style={{ fontSize: 12 }}>{next ? `${next.xp - total} XP to unlock the “${next.id}” banner` : 'All banners unlocked'} · cosmetic only</div>
          <div>{profile.badges.map((b) => <span key={b} className="badge">{b}</span>)}</div>
        </div>
      </div>
    </div>
  );
}

function ShardLines() {
  return (
    <svg className="shardLines" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <g stroke="#7ff5e0" strokeWidth="0.6" fill="none">
        <path d="M0 520 L260 380 L420 420 L610 250 L1000 120" />
        <path d="M120 600 L300 430 L380 470" />
        <path d="M610 250 L700 330 L880 300" />
        <path d="M480 0 L520 140 L610 250" opacity="0.6" />
      </g>
      <g fill="#7ff5e0" opacity="0.25"><polygon points="610,250 640,210 655,262" /><polygon points="260,380 280,350 300,392" /></g>
    </svg>
  );
}

// ------------------------------------------------------------------ map preview
export function MapPreview({ size = 300 }: { size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const m = createGlassRavine();
    const n = m.size;
    const img = new ImageData(n, n);
    for (let i = 0; i < n * n; i++) {
      const f = m.flags[i], lv = m.level[i];
      let col = [[40, 44, 52], [70, 76, 86], [140, 136, 126]][lv];
      if (f & F_CHASM) col = [8, 34, 40];
      else if (f & (F_ROCK | F_CLIFF)) col = [22, 23, 28];
      else if (f & F_RAMP) col = [110, 104, 92];
      if (f & F_BRUSH) col = [30, 70, 66];
      img.data.set([col[0], col[1], col[2], 255], i * 4);
    }
    for (const r of m.resources) { const i = r.y * n + r.x; img.data.set(r.kind === 'ore' ? [57, 224, 208, 255] : [255, 139, 46, 255], i * 4); }
    const tmp = document.createElement('canvas'); tmp.width = n; tmp.height = n;
    tmp.getContext('2d')!.putImageData(img, 0, 0);
    const ctx = c.getContext('2d')!;
    c.width = size; c.height = size;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, 0, 0, size, size);
    const s = size / n;
    m.starts.forEach((p, i) => { ctx.fillStyle = i === 0 ? '#3fa9ff' : '#ff5247'; ctx.beginPath(); ctx.arc(p.x * s, p.y * s, 6, 0, Math.PI * 2); ctx.fill(); });
    for (const p of m.pylons) { ctx.strokeStyle = '#e8f1ff'; ctx.beginPath(); ctx.arc(p.x * s, p.y * s, 5, 0, Math.PI * 2); ctx.stroke(); }
    ctx.fillStyle = '#bfe9ff'; for (const b of m.barriers) ctx.fillRect(b.x * s - 3, b.y * s - 3, 6, 6);
  }, [size]);
  return <canvas ref={ref} className="mapPreview" style={{ maxWidth: size }} aria-label="Glass Ravine map preview" />;
}

// ------------------------------------------------------------------ skirmish setup
export function SkirmishSetup({ onStart, onBack }: { onStart: (f: FactionId, enemy: FactionId, d: Difficulty) => void; onBack: () => void }) {
  const [faction, setFaction] = useState<FactionId>('helix');
  const [enemy, setEnemy] = useState<FactionId | 'random'>('random');
  const [diff, setDiff] = useState<Difficulty>('normal');
  const diffs: [Difficulty, string, string][] = [
    ['easy', 'Easy', 'Slow decisions, small worker count, late tech, no counter-scouting.'],
    ['normal', 'Normal', 'Scouts before countering, expands, upgrades, retreats from bad fights.'],
    ['hard', 'Hard', 'Faster decision cadence, harassment squads, sharper micro. Same rules and vision as you.'],
  ];
  return (
    <div className="screen">
      <div className="bgArt" />
      <div className="page">
        <div className="pageHead"><h2>Skirmish</h2><button className="btn ghost" onClick={onBack}>Back</button></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 24 }}>
          <div>
            <div className="label">Your faction</div>
            <div className="grid2">
              {(['helix', 'verdant'] as const).map((f) => (
                <button key={f} className={'factionCard' + (faction === f ? ' sel' : '')} style={{ ['--fc' as string]: FACTIONS[f].color }} onClick={() => setFaction(f)}>
                  <h3>{FACTIONS[f].name}</h3>
                  <div className="muted" style={{ fontStyle: 'italic', fontSize: 13 }}>{FACTIONS[f].tagline}</div>
                  <p>{FACTIONS[f].description}</p>
                  <div className="roster">{factionUnits(f).map((u) => `${iconFor(u.id)} ${u.name}`).join('  ·  ')}</div>
                </button>
              ))}
            </div>
            <div className="label" style={{ marginTop: 22 }}>Opponent faction</div>
            <div className="diffRow">
              {(['random', 'helix', 'verdant'] as const).map((f) => (
                <button key={f} className={'diffBtn' + (enemy === f ? ' sel' : '')} onClick={() => setEnemy(f)}><b>{f === 'random' ? 'Random' : FACTIONS[f].name}</b></button>
              ))}
            </div>
            <div className="label" style={{ marginTop: 22 }}>AI difficulty</div>
            <div className="diffRow">
              {diffs.map(([d, n, t]) => <button key={d} className={'diffBtn' + (diff === d ? ' sel' : '')} onClick={() => setDiff(d)}><b>{n}</b><span>{t}</span></button>)}
            </div>
          </div>
          <div>
            <div className="label">Map — Glass Ravine (1v1)</div>
            <MapPreview size={320} />
            <p className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>Protected corner mains, a natural behind each ramp, two risky side expansions, a hover-only chasm crossed by two bridges, and a sealed lower route through the center. Watch Pylons overlook both bridges.</p>
            <button className="btn primary" style={{ width: '100%', padding: '14px 0', fontSize: 16 }} onClick={() => onStart(faction, enemy === 'random' ? (Math.random() < 0.5 ? 'helix' : 'verdant') : enemy, diff)}>Start match</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ settings
export function SettingsScreen({ settings, onChange, onBack, onReset, inGame, onBenchmark }: { settings: Settings; onChange: (s: Settings) => void; onBack: () => void; onReset: () => void; inGame?: boolean; onBenchmark?: () => void }) {
  const [listen, setListen] = useState<Action | null>(null);
  const s = settings;
  const set = (fn: (d: Settings) => void) => { const d = structuredClone(s); fn(d); onChange(d); };
  useEffect(() => {
    if (!listen) return;
    const h = (e: KeyboardEvent) => {
      e.preventDefault(); e.stopPropagation();
      if (e.code !== 'Escape') set((d) => { d.bindings[listen] = e.code; });
      setListen(null);
    };
    window.addEventListener('keydown', h, true);
    return () => window.removeEventListener('keydown', h, true);
  });
  const dupes = new Set<string>();
  const seen = new Map<string, Action>();
  // slot keys may intentionally share a key with a global action (the command card wins in context)
  for (const a of Object.keys(s.bindings) as Action[]) {
    const k = s.bindings[a];
    const prev = seen.get(k);
    if (prev && prev.startsWith('slot') === a.startsWith('slot')) { dupes.add(a); dupes.add(prev); }
    seen.set(k, a);
  }
  return (
    <div className={inGame ? '' : 'screen'} style={inGame ? { position: 'absolute', inset: 0, overflow: 'auto', background: 'rgba(5,7,10,0.96)', zIndex: 30 } : undefined}>
      {!inGame && <div className="bgArt" />}
      <div className="page">
        <div className="pageHead"><h2>Settings</h2><button className="btn" onClick={onBack}>Done</button></div>
        <div className="grid2">
          <div className="panel">
            <div className="label">Graphics</div>
            <div className="setRow"><span>Preset</span>
              <select value={s.graphics.quality} onChange={(e) => set((d) => {
                d.graphics.quality = e.target.value as Settings['graphics']['quality'];
                if (d.graphics.quality === 'low') { d.graphics.shadows = false; d.graphics.effects = 0.5; d.graphics.renderScale = 0.75; }
                if (d.graphics.quality === 'medium') { d.graphics.shadows = true; d.graphics.effects = 1; d.graphics.renderScale = 1; }
                if (d.graphics.quality === 'high') { d.graphics.shadows = true; d.graphics.effects = 1; d.graphics.renderScale = 1; }
              })}>
                <option value="low">Low (30 FPS fallback)</option><option value="medium">Medium</option><option value="high">High</option>
              </select></div>
            <div className="setRow"><span>Render scale {Math.round(s.graphics.renderScale * 100)}%</span><input type="range" min={0.5} max={1.5} step={0.05} value={s.graphics.renderScale} onChange={(e) => set((d) => { d.graphics.renderScale = +e.target.value; })} /></div>
            <div className="setRow"><span>Shadows</span><input type="checkbox" checked={s.graphics.shadows} onChange={(e) => set((d) => { d.graphics.shadows = e.target.checked; })} /></div>
            <div className="setRow"><span>Effects density {Math.round(s.graphics.effects * 100)}%</span><input type="range" min={0} max={1} step={0.05} value={s.graphics.effects} onChange={(e) => set((d) => { d.graphics.effects = +e.target.value; })} /></div>
            <div className="setRow"><span>Anti-aliasing (applies next match)</span><input type="checkbox" checked={s.graphics.antialias} onChange={(e) => set((d) => { d.graphics.antialias = e.target.checked; })} /></div>
            <div className="setRow"><span>Team colors</span>
              <select value={s.graphics.colorblind} onChange={(e) => set((d) => { d.graphics.colorblind = e.target.value as 'none'; })}>
                <option value="none">Standard (blue / red)</option><option value="deuteranopia">Deuteranopia (blue / orange)</option><option value="protanopia">Protanopia (blue / yellow)</option><option value="tritanopia">Tritanopia (magenta / teal)</option>
              </select></div>
            <div className="setRow"><span>Reduced motion (no screen shake)</span><input type="checkbox" checked={s.graphics.reducedMotion} onChange={(e) => set((d) => { d.graphics.reducedMotion = e.target.checked; })} /></div>
          </div>
          <div className="panel">
            <div className="label">Audio</div>
            {(['master', 'music', 'sfx', 'ui'] as const).map((k) => (
              <div key={k} className="setRow"><span>{({ master: 'Master', music: 'Music', sfx: 'Combat & world', ui: 'Interface & alerts' })[k]} {Math.round(s.audio[k] * 100)}%</span>
                <input type="range" min={0} max={1} step={0.05} value={s.audio[k]} onChange={(e) => set((d) => { d.audio[k] = +e.target.value; })} /></div>
            ))}
            <div className="label" style={{ marginTop: 18 }}>Camera & interface</div>
            <div className="setRow"><span>Edge scrolling</span><input type="checkbox" checked={s.camera.edgeScroll} onChange={(e) => set((d) => { d.camera.edgeScroll = e.target.checked; })} /></div>
            <div className="setRow"><span>Pan speed {s.camera.panSpeed.toFixed(2)}×</span><input type="range" min={0.4} max={2.5} step={0.05} value={s.camera.panSpeed} onChange={(e) => set((d) => { d.camera.panSpeed = +e.target.value; })} /></div>
            <div className="setRow"><span>Commander name</span><input type="text" maxLength={24} value={s.playerName} onChange={(e) => set((d) => { d.playerName = e.target.value.replace(/[\u0000-\u001f<>]/g, '').slice(0, 24); })} /></div>
            {!inGame && <div className="setRow"><span>Local data (settings, profile, history, replays)</span><button className="btn danger" onClick={onReset}>Reset all</button></div>}
            {!inGame && onBenchmark && <div className="setRow"><span>Benchmark: 220 units in combat for 20 s (reports median FPS and 1% low)</span><button className="btn" onClick={onBenchmark}>Run</button></div>}
          </div>
          <div className="panel" style={{ gridColumn: '1 / -1' }}>
            <div className="label">Key bindings — click a key, then press the new key (Esc cancels)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', columnGap: 24 }}>
              {(Object.keys(DEFAULT_BINDINGS) as Action[]).map((a) => (
                <div key={a} className="setRow" data-rebind>
                  <span>{ACTION_LABELS[a]}{dupes.has(a) && <span style={{ color: 'var(--red)' }}> · conflict</span>}</span>
                  <button className={'keyBtn' + (listen === a ? ' listening' : '')} onClick={() => setListen(a)}>{listen === a ? 'press…' : keyLabel(s.bindings[a])}</button>
                </div>
              ))}
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>Command-card slots are contextual: when a slot key is also a global key (e.g. F focus / slot 5), the command card wins while it shows a button there. Control groups use number keys with Ctrl/Shift.</div>
            <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => set((d) => { d.bindings = { ...DEFAULT_BINDINGS }; })}>Restore default bindings</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ tech archive
export function TechArchive({ onBack }: { onBack: () => void }) {
  const [faction, setFaction] = useState<FactionId>('helix');
  const [sel, setSel] = useState<string>('fabricator');
  const u = UNITS[sel], s = STRUCTURES[sel], t = TECHS[sel];
  return (
    <div className="screen">
      <div className="bgArt" />
      <div className="page">
        <div className="pageHead"><h2>Tech Archive</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['helix', 'verdant'] as const).map((f) => <button key={f} className={'btn' + (faction === f ? ' primary' : ' ghost')} onClick={() => { setFaction(f); setSel(factionUnits(f)[0].id); }}>{FACTIONS[f].name}</button>)}
            <button className="btn ghost" onClick={onBack}>Back</button>
          </div>
        </div>
        <div className="archive">
          <div className="panel archList">
            <div className="archHead">Units</div>
            {factionUnits(faction).map((x) => <button key={x.id} className={'archItem' + (sel === x.id ? ' sel' : '')} onClick={() => setSel(x.id)}>{iconFor(x.id)} {x.name}<small>{x.cost.ore}/{x.cost.flux}</small></button>)}
            <div className="archHead">Structures</div>
            {factionStructures(faction).map((x) => <button key={x.id} className={'archItem' + (sel === x.id ? ' sel' : '')} onClick={() => setSel(x.id)}>{iconFor(x.id)} {x.name}<small>{x.cost.ore}/{x.cost.flux}</small></button>)}
            <div className="archHead">Research</div>
            {factionTechs(faction).map((x) => <button key={x.id} className={'archItem' + (sel === x.id ? ' sel' : '')} onClick={() => setSel(x.id)}>{iconFor(x.id)} {x.name}<small>{x.cost.ore}/{x.cost.flux}</small></button>)}
          </div>
          <div className="panel">
            {u && (<>
              <h2 style={{ marginTop: 0 }}>{iconFor(u.id)} {u.name}</h2>
              <p className="muted">{u.role}</p>
              <div className="kv">
                <div>Cost</div><div>{u.cost.ore} Ore · {u.cost.flux} Flux · {u.supply} Supply · {Math.round(u.buildTime / 20)} s</div>
                <div>Produced at</div><div>{STRUCTURES[u.producedAt].name}{u.requires.length ? ` · requires ${u.requires.map(requirementName).join(', ')}` : ''}</div>
                <div>Durability</div><div>{u.hp} HP · armor {u.armor}</div>
                <div>Mobility</div><div>speed {u.speed} · sight {u.sight}{u.hover ? ' · hovering (crosses the chasm)' : ''}</div>
                <div>Tags</div><div>{u.tags.join(', ')}</div>
                <div>Weapon</div><div>{u.weapon ? weaponText(u.weapon) : 'None'}</div>
                <div>Abilities</div><div>{u.abilities.length ? u.abilities.map((a) => `${ABILITIES[a].name} — ${ABILITIES[a].description}`).join(' | ') : '—'}</div>
                <div>Strong vs</div><div style={{ color: 'var(--green)' }}>{u.strongVs}</div>
                <div>Weak vs</div><div style={{ color: 'var(--red)' }}>{u.weakVs}</div>
              </div>
            </>)}
            {s && (<>
              <h2 style={{ marginTop: 0 }}>{iconFor(s.id)} {s.name}</h2>
              <p className="muted">{s.role}</p>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.6 }}>{`Cost ${s.cost.ore} Ore · ${s.cost.flux} Flux\n` + structureDetail(s.id)}</pre>
              {s.trains.length > 0 && <p>Trains: {s.trains.map((x) => UNITS[x].name).join(', ')}</p>}
              {s.researches.length > 0 && <p>Researches: {s.researches.map((x) => TECHS[x].name).join(', ')}</p>}
            </>)}
            {t && (<>
              <h2 style={{ marginTop: 0 }}>{iconFor(t.id)} {t.name}</h2>
              <p>{t.description}</p>
              <div className="kv"><div>Cost</div><div>{t.cost.ore} Ore · {t.cost.flux} Flux · {Math.round(t.time / 20)} s</div><div>Researched at</div><div>{STRUCTURES[t.at].name}</div><div>Requires</div><div>{t.requires.map(requirementName).join(', ') || '—'}</div></div>
            </>)}
            <div className="label" style={{ marginTop: 24 }}>Shared rules</div>
            <p className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>Damage = (base + tag bonuses) × attack upgrades − armor (minimum 0.5), then armor upgrades. High ground grants +2 sight and blocks vision from below. Brush hides units inside it. No friendly fire. Three attack and three armor upgrades per faction (tier 1, then tier 2), each ≤ 6%. After 18 minutes, harvest yields rise 15% and the center pulses a map-wide reveal every 90 s.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ replays / history
export function ReplaysScreen({ matches, onWatch, onBack }: { matches: MatchRecord[]; onWatch: (m: MatchRecord) => void; onBack: () => void }) {
  return (
    <div className="screen">
      <div className="bgArt" />
      <div className="page">
        <div className="pageHead"><h2>Replays & history</h2><button className="btn ghost" onClick={onBack}>Back</button></div>
        {!matches.length && <div className="panel muted">No matches recorded yet. Finish a skirmish or the tutorial to record one.</div>}
        <div className="list">
          {matches.map((m) => (
            <div key={m.id} className="listRow">
              <div>
                <b style={{ color: m.result === 'victory' ? 'var(--teal)' : 'var(--red)' }}>{m.result === 'victory' ? 'Victory' : 'Defeat'}</b>
                {' '}· {FACTIONS[m.faction as FactionId]?.name ?? m.faction} vs {FACTIONS[m.enemyFaction as FactionId]?.name ?? m.enemyFaction} ({m.mode === 'tutorial' ? 'tutorial' : m.difficulty})
                <div className="muted" style={{ fontSize: 12 }}>{new Date(m.date).toLocaleString()} · {fmt(m.durationTicks)} · {m.stats.unitsCreated} units built · {m.stats.kills} kills · {Math.round(m.stats.oreCollected)} ore</div>
              </div>
              <div />
              {m.replayId ? <button className="btn" onClick={() => onWatch(m)}>Watch replay</button> : <span className="muted">no replay</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Credits({ onBack }: { onBack: () => void }) {
  return (
    <div className="screen">
      <div className="bgArt" />
      <div className="page" style={{ maxWidth: 820 }}>
        <div className="pageHead"><h2>Credits</h2><button className="btn ghost" onClick={onBack}>Back</button></div>
        <div className="panel" style={{ lineHeight: 1.7 }}>
          <p><b>Shardfront</b> — an original real-time strategy vertical slice.</p>
          <p>Design, code, procedural models, procedural audio and the Glass Ravine map were all authored for this project. No third-party art, audio or game content is used; every model is built from code primitives and every sound is synthesized live with the Web Audio API.</p>
          <p>Built with <b>Three.js</b> (MIT), <b>React</b> (MIT), <b>Vite</b> (MIT) and <b>TypeScript</b> (Apache-2.0). Tested with <b>Vitest</b> (MIT) and <b>Playwright</b> (Apache-2.0).</p>
          <p className="muted">No telemetry, accounts, or network services. All progress stays in this browser (IndexedDB).</p>
        </div>
      </div>
    </div>
  );
}

const fmt = (ticks: number) => { const s = Math.floor(ticks / 20); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

// ------------------------------------------------------------------ post game
export function PostGame({ runner, onRematch, onLobby, onReplay, xpGained }: { runner: MatchRunner; onRematch: () => void; onLobby: () => void; onReplay: () => void; xpGained: number }) {
  const sim = runner.sim;
  const win = sim.winner === 0;
  const isReplay = !!runner.replay;
  const p = sim.players;
  const rows: [string, (i: number) => string | number][] = [
    ['Faction', (i) => FACTIONS[p[i].faction].name],
    ['Prism Ore collected', (i) => Math.round(p[i].stats.oreCollected)],
    ['Flux collected', (i) => Math.round(p[i].stats.fluxCollected)],
    ['Units created', (i) => p[i].stats.unitsCreated],
    ['Units lost', (i) => p[i].stats.unitsLost],
    ['Kills', (i) => p[i].stats.kills],
    ['Structures built', (i) => p[i].stats.structuresBuilt],
    ['Expansions', (i) => p[i].stats.expansions.length ? p[i].stats.expansions.map(fmt).join(', ') : '—'],
    ['Peak army value', (i) => Math.max(0, ...p[i].stats.samples.map((s) => s.army))],
    ['Research completed', (i) => p[i].techs.size],
  ];
  return (
    <div className="screen">
      <div className="bgArt" />
      <div className="page">
        <div className="pageHead">
          <div>
            <h1 className={'result ' + (win || isReplay ? 'win' : 'loss')}>{isReplay ? 'REPLAY' : win ? 'VICTORY' : 'DEFEAT'}</h1>
            <div className="muted">Glass Ravine · {fmt(sim.tick)} · {sim.setup.mode === 'tutorial' ? 'Tutorial' : `vs ${sim.setup.players[1].ai ?? 'player'} AI`}{!isReplay && xpGained > 0 ? ` · +${xpGained} mastery XP` : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {!isReplay && <button className="btn primary" onClick={onRematch}>Rematch</button>}
            <button className="btn" onClick={onReplay}>{isReplay ? 'Watch again' : 'Watch replay'}</button>
            <button className="btn ghost" onClick={onLobby}>Main menu</button>
          </div>
        </div>
        <div className="grid2">
          <div className="panel">
            <div className="label">Metrics</div>
            <table className="statsTable"><thead><tr><th /><th style={{ color: '#3fa9ff' }}>{p[0].name}</th><th style={{ color: '#ff5247' }}>{p[1].name}</th></tr></thead>
              <tbody>{rows.map(([k, f]) => <tr key={k}><td>{k}</td><td>{f(0)}</td><td>{f(1)}</td></tr>)}</tbody></table>
          </div>
          <div className="panel">
            <div className="label">Army value over time</div>
            <Chart sim={sim} field="army" />
            <div className="label" style={{ marginTop: 14 }}>Resources collected over time</div>
            <Chart sim={sim} field="res" />
          </div>
          <div className="panel" style={{ gridColumn: '1 / -1' }}>
            <div className="label">Timeline of major events</div>
            <div className="timeline">
              {sim.timeline.map((e, i) => (
                <div key={i}><span className="muted">{fmt(e.tick)}</span><span className="dot" style={{ background: e.player < 0 ? '#e8f1ff' : e.player === 0 ? '#3fa9ff' : '#ff5247' }} /><span>{e.player >= 0 ? `${p[e.player].name}: ` : ''}{e.text}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Chart({ sim, field }: { sim: Sim; field: 'army' | 'res' }) {
  const W = 520, H = 150, pad = 28;
  const series = sim.players.map((p) => p.stats.samples.map((s) => ({ t: s.tick, v: field === 'army' ? s.army : s.ore + s.flux })));
  const maxT = Math.max(1, ...series.flat().map((s) => s.t));
  const maxV = Math.max(1, ...series.flat().map((s) => s.v));
  const path = (pts: { t: number; v: number }[]) => pts.map((s, i) => `${i ? 'L' : 'M'}${pad + (s.t / maxT) * (W - pad - 6)},${H - pad + 6 - (s.v / maxV) * (H - pad - 4)}`).join(' ');
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={field === 'army' ? 'Army value chart' : 'Resources chart'}>
      <line x1={pad} y1={H - pad + 6} x2={W} y2={H - pad + 6} stroke="rgba(255,255,255,0.15)" />
      <line x1={pad} y1={4} x2={pad} y2={H - pad + 6} stroke="rgba(255,255,255,0.15)" />
      <text x={2} y={12}>{Math.round(maxV)}</text>
      <text x={W - 34} y={H - 4}>{fmt(maxT)}</text>
      {series.map((s, i) => <path key={i} d={path(s)} fill="none" stroke={i === 0 ? '#3fa9ff' : '#ff5247'} strokeWidth={2} />)}
    </svg>
  );
}
