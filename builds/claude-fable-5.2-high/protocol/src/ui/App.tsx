// React shell: menus, buy menu, scoreboard, pause and results. The in-frame HUD lives in hud.ts.
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { Difficulty } from '../bots/bots';
import type { GameClient, MatchConfig } from '../client/game';
import type { Settings } from '../client/settings';
import { EQUIPMENT, UTILITY, UTILITY_LIST, type EquipId, type UtilityId } from '../content/rules';
import { BUYABLE_WEAPONS, WEAPONS, isWeaponId, type WeaponDef } from '../content/weapons';
import type { BuyItem, MatchSummary, RosterEntry, Side } from '../protocol/types';
import type { BuyView, UiStore } from './store';

const SIDE_LABEL: Record<Side, string> = { atk: 'Intrusion', def: 'Custodian' };

export function App({ game, store }: { game: GameClient; store: UiStore }): ReactNode {
  const st = useSyncExternalStore(store.subscribe, store.get);
  if (st.screen === 'error')
    return (
      <div className="center-screen loading">
        <div className="err">
          <h1>Unable to start</h1>
          <p>{st.error}</p>
        </div>
      </div>
    );
  if (st.screen === 'loading')
    return (
      <div className="center-screen loading">
        <div className="logo">
          Last <span>Protocol</span>
        </div>
        <div className="tagline" style={{ marginBottom: 0 }}>
          {st.loadingText || 'Loading'}
        </div>
        <div className="bar">
          <i />
        </div>
      </div>
    );
  if (st.screen === 'menu') return <Menu game={game} store={store} />;
  return (
    <>
      {st.scoreboard && st.board && st.overlay === '' && (
        <div className="center-screen" style={{ background: 'rgba(6,8,11,0.35)', backdropFilter: 'none', pointerEvents: 'none' }}>
          <Scoreboard board={st.board} />
        </div>
      )}
      {st.overlay === 'buy' && st.buy && <BuyMenu game={game} buy={st.buy} msg={st.buyMsg} />}
      {st.overlay === 'pause' && <Pause game={game} store={store} />}
      {st.overlay === 'result' && st.summary && st.board && <Result game={game} summary={st.summary} myTeam={st.board.myTeam} myId={st.board.myId} mode={st.board.mode} />}
      {st.needClick && st.overlay === '' && <div className="click-resume">Click to resume</div>}
    </>
  );
}

// ------------------------------------------------------------------ main menu
type Tab = 'play' | 'practice' | 'learn' | 'settings' | 'history' | 'credits';

function Menu({ game, store }: { game: GameClient; store: UiStore }): ReactNode {
  const st = useSyncExternalStore(store.subscribe, store.get);
  const [tab, setTab] = useState<Tab>('play');
  const [mode, setMode] = useState<'quick' | 'full'>('quick');
  const [side, setSide] = useState<Side | 'random'>('atk');
  const [diff, setDiff] = useState<Difficulty>('normal');
  const click = (): void => {
    game.audio.unlock();
    game.audio.setMusic(true);
    game.audio.play('ui_click');
  };
  const go = (cfg: MatchConfig): void => {
    game.audio.unlock();
    game.audio.play('ui_click');
    game.startMatch(cfg);
  };
  const nav = (id: Tab, label: string, sub: string): ReactNode => (
    <button
      className={tab === id ? 'sel' : ''}
      onMouseEnter={() => game.audio.play('ui_hover')}
      onClick={() => {
        click();
        setTab(id);
      }}
    >
      {label}
      <small>{sub}</small>
    </button>
  );
  return (
    <div className="screen menu-bg" onMouseDown={() => game.audio.unlock()}>
      <div className="menu-col">
        <div className="logo">
          Last
          <br />
          <span>Protocol</span>
        </div>
        <div className="tagline">Cipher Breach · Aperture Annex · 5v5</div>
        <div className="nav">
          {nav('play', 'Play', 'Unranked Cipher Breach with bot teammates and opponents')}
          {nav('practice', 'Practice', 'Unlimited funds, buy anywhere, throw previews')}
          {nav('learn', 'Learn', 'Rules, controls and the map')}
          {nav('settings', 'Settings', 'Aim, crosshair, audio, accessibility')}
          {nav('history', 'Match history', 'Recent results on this device')}
          {nav('credits', 'Credits', 'What this build is made of')}
        </div>
        <div className="foot">
          Vertical slice · single-player against server-side bots
          <br />
          Authoritative 64 Hz simulation runs locally — no account, no network
        </div>
      </div>
      <div className="side-panel panel">
        {tab === 'play' && (
          <>
            <h2>Unranked Cipher Breach</h2>
            <p>Two teams of five. Intrusion carries the Cipher Spike and must arm it at Vault A or Vault B. Custodians stop the arm or disarm the Spike. One life per round; money carries over.</p>
            <h3>Match length</h3>
            <div className="opts">
              <Opt sel={mode === 'quick'} onClick={() => setMode('quick')} title="Quick" sub="First to 5 · swap after 4 · about 12 minutes" />
              <Opt sel={mode === 'full'} onClick={() => setMode('full')} title="Full" sub="First to 9 · swap after 8 · win by 2, max 20" />
            </div>
            <h3>Starting side</h3>
            <div className="opts">
              <Opt cls="atk" sel={side === 'atk'} onClick={() => setSide('atk')} title="Intrusion" sub="Attack: arm the Spike" />
              <Opt cls="def" sel={side === 'def'} onClick={() => setSide('def')} title="Custodian" sub="Defend: deny or disarm" />
              <Opt sel={side === 'random'} onClick={() => setSide('random')} title="Random" sub="Let the server pick" />
            </div>
            <h3>Bot difficulty</h3>
            <div className="opts">
              <Opt sel={diff === 'easy'} onClick={() => setDiff('easy')} title="Recruit" sub="Slow reactions, loose aim" />
              <Opt sel={diff === 'normal'} onClick={() => setDiff('normal')} title="Regular" sub="A fair fight" />
              <Opt sel={diff === 'hard'} onClick={() => setDiff('hard')} title="Veteran" sub="Fast, accurate, disciplined" />
            </div>
            <button className="cta" onClick={() => go({ mode, side, difficulty: diff })}>
              Start match
            </button>
            <p style={{ color: 'var(--dim)', fontSize: 12, marginTop: 12 }}>
              The match requests fullscreen and mouse capture. <span className="kbd">Esc</span> pauses (the local server pauses with you).
            </p>
          </>
        )}
        {tab === 'practice' && (
          <>
            <h2>Practice range</h2>
            <p>The full map and rules with training wheels: unlimited money, buying anywhere at any time, ten-minute rounds, and a live trajectory preview while a utility item is in hand.</p>
            <ul>
              <li>Preview arcs use the same deterministic projectile simulation as the server.</li>
              <li>Bots still play the round — pick Recruit for a calmer session.</li>
              <li>Spray at a wall to learn each recoil path: every weapon climbs, then sways the same way every time.</li>
            </ul>
            <h3>Starting side</h3>
            <div className="opts">
              <Opt cls="atk" sel={side === 'atk'} onClick={() => setSide('atk')} title="Intrusion" sub="Attack" />
              <Opt cls="def" sel={side === 'def'} onClick={() => setSide('def')} title="Custodian" sub="Defend" />
            </div>
            <h3>Bot difficulty</h3>
            <div className="opts">
              <Opt sel={diff === 'easy'} onClick={() => setDiff('easy')} title="Recruit" sub="" />
              <Opt sel={diff === 'normal'} onClick={() => setDiff('normal')} title="Regular" sub="" />
              <Opt sel={diff === 'hard'} onClick={() => setDiff('hard')} title="Veteran" sub="" />
            </div>
            <button className="cta" onClick={() => go({ mode: 'practice', side: side === 'random' ? 'atk' : side, difficulty: diff })}>
              Enter practice
            </button>
          </>
        )}
        {tab === 'learn' && <Learn />}
        {tab === 'settings' && <SettingsPanel game={game} settings={st.settings} />}
        {tab === 'history' && (
          <>
            <h2>Match history</h2>
            {st.history.length === 0 && <p>No finished matches yet. Results are stored only in this browser.</p>}
            {st.history.length > 0 && (
              <table className="sb">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Mode</th>
                    <th>Result</th>
                    <th>Score</th>
                    <th>K / D / A</th>
                  </tr>
                </thead>
                <tbody>
                  {st.history.map((h, i) => (
                    <tr key={i}>
                      <td>{new Date(h.date).toLocaleString()}</td>
                      <td>{h.mode}</td>
                      <td style={{ color: h.won === null ? 'var(--dim)' : h.won ? 'var(--good)' : 'var(--enemy)' }}>{h.won === null ? 'Draw' : h.won ? 'Win' : 'Loss'}</td>
                      <td>
                        {h.score[0]} – {h.score[1]}
                      </td>
                      <td>
                        {h.kills} / {h.deaths} / {h.assists}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
        {tab === 'credits' && (
          <>
            <h2>Credits</h2>
            <p>Last Protocol is an original tactical shooter slice built for Oneshot Arcade.</p>
            <ul>
              <li>All geometry, textures, models, effects and audio are generated procedurally in code. No third-party art, sound or map data is included.</li>
              <li>Rendering: Babylon.js (Apache-2.0). Interface shell: React (MIT). Tooling: Vite, TypeScript, Vitest.</li>
              <li>Faction, map, weapon and utility names are fictional and original to this project.</li>
            </ul>
            <p style={{ color: 'var(--dim)' }}>See ASSETS.md and ONESHOT-REPORT.md in the source for details.</p>
          </>
        )}
      </div>
    </div>
  );
}

function Opt({ sel, onClick, title, sub, cls = '' }: { sel: boolean; onClick: () => void; title: string; sub: string; cls?: string }): ReactNode {
  return (
    <button className={`opt ${cls} ${sel ? 'sel' : ''}`} onClick={onClick}>
      {title}
      {sub && <small>{sub}</small>}
    </button>
  );
}

function Learn(): ReactNode {
  const keys: [string, string][] = [
    ['W A S D', 'Move'],
    ['Mouse', 'Aim'],
    ['Left click', 'Fire / throw'],
    ['Right click', 'Scope / soft lob'],
    ['Shift', 'Walk silently'],
    ['Ctrl or C', 'Crouch'],
    ['Space', 'Jump'],
    ['R', 'Reload'],
    ['E', 'Arm / disarm / swap weapon'],
    ['B', 'Buy menu (spawn, buy phase)'],
    ['Enter', 'Ready up (ends buy early)'],
    ['1 2 3', 'Primary / sidearm / tool'],
    ['4 – 7', 'Utility slots'],
    ['Q / wheel', 'Last weapon / cycle'],
    ['G', 'Drop weapon (tool out: drop Spike)'],
    ['F', 'Inspect'],
    ['Tab', 'Scoreboard and economy'],
    ['M', 'Tactical map'],
    ['Esc', 'Pause'],
    ['F3', 'Performance overlay'],
  ];
  return (
    <>
      <h2>How to play</h2>
      <h3>The round</h3>
      <ul>
        <li>Buy phase (20 s): spend in your spawn. Barriers drop when it ends.</li>
        <li>Action (1:45): Intrusion arms the Spike in a vault (hold E for 3.2 s). Custodians win on time, elimination, or a disarm (8 s, 5 s with a kit).</li>
        <li>Once armed the Spike detonates after 35 s. Beeps speed up at 20, 10 and 5 seconds.</li>
        <li>Dead players spectate teammates only. Survivors keep their gear into the next round.</li>
      </ul>
      <h3>Gunfight rules</h3>
      <ul>
        <li>Stop before you shoot: accuracy is tight only below a slow walk. Counter-strafing stops you faster.</li>
        <li>Every automatic weapon has a fixed recoil path. Pull against it; tap or burst at range.</li>
        <li>Wood crates, the hazard-striped service panel, planters and glass can be shot through with enough weapon.</li>
        <li>Running is loud. Walking and crouching are nearly silent.</li>
      </ul>
      <h3>Controls</h3>
      <div className="keys">
        {keys.map(([k, v]) => (
          <KeyRow key={k} k={k} v={v} />
        ))}
      </div>
    </>
  );
}

function KeyRow({ k, v }: { k: string; v: string }): ReactNode {
  return (
    <>
      <span className="kbd">{k}</span>
      <span>{v}</span>
    </>
  );
}

// ------------------------------------------------------------------ settings
function SettingsPanel({ game, settings }: { game: GameClient; settings: Settings }): ReactNode {
  const set = (patch: Partial<Settings>): void => game.applySettings({ ...settings, ...patch });
  const xh = settings.crosshair;
  const setX = (patch: Partial<Settings['crosshair']>): void => set({ crosshair: { ...xh, ...patch } });
  const range = (label: string, value: number, min: number, max: number, step: number, on: (v: number) => void, fmt: (v: number) => string = (v) => String(v)): ReactNode => (
    <div className="row">
      <label>{label}</label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => on(Number(e.target.value))} />
      <span className="val">{fmt(value)}</span>
    </div>
  );
  const check = (label: string, value: boolean, on: (v: boolean) => void): ReactNode => (
    <div className="row">
      <label>{label}</label>
      <input type="checkbox" checked={value} onChange={(e) => on(e.target.checked)} />
    </div>
  );
  const t = xh.thickness;
  return (
    <>
      <h2>Settings</h2>
      <h3>Aim</h3>
      {range('Mouse sensitivity', settings.sensitivity, 0.1, 4, 0.01, (v) => set({ sensitivity: v }), (v) => v.toFixed(2))}
      {range('Scoped sensitivity multiplier', settings.scopeSensitivity, 0.3, 2, 0.01, (v) => set({ scopeSensitivity: v }), (v) => v.toFixed(2))}
      {range('Field of view (horizontal)', settings.fov, 80, 105, 1, (v) => set({ fov: v }), (v) => v + '°')}
      {check('Toggle crouch (instead of hold)', settings.toggleCrouch, (v) => set({ toggleCrouch: v }))}
      {check('Toggle walk (instead of hold)', settings.toggleWalk, (v) => set({ toggleWalk: v }))}
      <h3>Crosshair</h3>
      <div style={{ display: 'flex', gap: 16 }}>
        <div className="xh-prev">
          <div className={'h-cross' + (xh.outline ? ' outline' : '')} style={{ ['--xh' as string]: xh.color }}>
            <i style={{ left: -xh.gap - xh.length, top: -t / 2, width: xh.length, height: t }} />
            <i style={{ left: xh.gap, top: -t / 2, width: xh.length, height: t }} />
            <i style={{ left: -t / 2, top: -xh.gap - xh.length, width: t, height: xh.length }} />
            <i style={{ left: -t / 2, top: xh.gap, width: t, height: xh.length }} />
            {xh.dot && <i style={{ left: -t / 2, top: -t / 2, width: t, height: t }} />}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          {range('Gap', xh.gap, 0, 12, 1, (v) => setX({ gap: v }))}
          {range('Length', xh.length, 2, 16, 1, (v) => setX({ length: v }))}
          {range('Thickness', xh.thickness, 1, 5, 1, (v) => setX({ thickness: v }))}
        </div>
      </div>
      <div className="row">
        <label>Colour</label>
        <select value={xh.color} onChange={(e) => setX({ color: e.target.value })}>
          <option value="#5dffb0">Mint</option>
          <option value="#ffffff">White</option>
          <option value="#ffe14a">Yellow</option>
          <option value="#4ad8ff">Cyan</option>
          <option value="#ff5fd0">Magenta</option>
          <option value="#ff5a4a">Red</option>
        </select>
      </div>
      {check('Centre dot', xh.dot, (v) => setX({ dot: v }))}
      {check('Dark outline', xh.outline, (v) => setX({ outline: v }))}
      {check('Dynamic gap shows current inaccuracy', xh.dynamic, (v) => setX({ dynamic: v }))}
      <h3>Audio</h3>
      {range('Master volume', settings.volume, 0, 1, 0.01, (v) => set({ volume: v }), (v) => Math.round(v * 100) + '%')}
      {range('Menu music', settings.musicVolume, 0, 1, 0.01, (v) => set({ musicVolume: v }), (v) => Math.round(v * 100) + '%')}
      <h3>Accessibility and visibility</h3>
      <div className="row">
        <label>Team identification colours</label>
        <select value={settings.palette} onChange={(e) => set({ palette: e.target.value as Settings['palette'] })}>
          <option value="default">Amber / Cyan</option>
          <option value="alt">Orange / Blue</option>
          <option value="contrast">Yellow / Violet</option>
        </select>
      </div>
      {check('Reduced flash (dark instead of white, same duration)', settings.reduceFlash, (v) => set({ reduceFlash: v }))}
      {check('Reduced motion (no camera shake)', settings.reduceMotion, (v) => set({ reduceMotion: v }))}
      {check('Captions for objective and utility sounds', settings.captions, (v) => set({ captions: v }))}
      {check('Blood puffs (off: sparks)', settings.blood, (v) => set({ blood: v }))}
      {check('Left-handed viewmodel (cosmetic)', settings.leftHand, (v) => set({ leftHand: v }))}
      <h3>Video</h3>
      {range('Render scale', settings.renderScale, 0.5, 1, 0.05, (v) => set({ renderScale: v }), (v) => Math.round(v * 100) + '%')}
      {check('Performance overlay (F3)', settings.showFps, (v) => set({ showFps: v }))}
      <div className="row">
        <label>Player name</label>
        <input type="text" maxLength={14} value={settings.name} onChange={(e) => set({ name: e.target.value })} />
      </div>
      <p style={{ color: 'var(--dim)', fontSize: 12 }}>
        Veil smoke, Thermite borders and flash duration are identical at every setting, so no option here changes what you can see of an opponent.
      </p>
    </>
  );
}

// ------------------------------------------------------------------ pause
function Pause({ game, store }: { game: GameClient; store: UiStore }): ReactNode {
  const st = useSyncExternalStore(store.subscribe, store.get);
  const [showSettings, setShow] = useState(false);
  if (showSettings)
    return (
      <div className="center-screen">
        <div className="panel" style={{ width: 'min(620px,92vw)', maxHeight: '88vh', overflowY: 'auto', padding: '22px 26px' }}>
          <div className="side-panel" style={{ position: 'static', width: 'auto', padding: 0, overflow: 'visible' }}>
            <SettingsPanel game={game} settings={st.settings} />
          </div>
          <button className="cta ghost" onClick={() => setShow(false)}>
            Back
          </button>
        </div>
      </div>
    );
  return (
    <div className="center-screen">
      <div className="panel pause">
        <h2>Paused</h2>
        <button className="cta" style={{ marginTop: 0 }} onClick={() => game.resume()}>
          Resume
        </button>
        <button className="cta ghost" style={{ marginTop: 0 }} onClick={() => setShow(true)}>
          Settings
        </button>
        <button className="cta ghost" style={{ marginTop: 0 }} onClick={() => game.quitToMenu()}>
          Leave match
        </button>
        <p style={{ color: 'var(--dim)', fontSize: 12, margin: '6px 0 0' }}>The local match server is paused. Press Esc or Resume to continue.</p>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ buy menu
type Cat = 'Sidearms' | 'SMGs' | 'Rifles' | 'Heavy' | 'Gear' | 'Utility';
const CATS: Cat[] = ['Sidearms', 'SMGs', 'Rifles', 'Heavy', 'Gear', 'Utility'];

interface Entry {
  id: BuyItem;
  name: string;
  price: number;
  desc: string;
  weapon?: WeaponDef;
}

function entries(cat: Cat, buy: BuyView): Entry[] {
  if (cat === 'Gear') {
    const list: EquipId[] = buy.side === 'def' ? ['vest', 'vesthelm', 'kit'] : ['vest', 'vesthelm'];
    return list.map((id) => ({ id, name: EQUIPMENT[id].name, price: id === 'vesthelm' && buy.armor >= 100 && !buy.helmet ? 350 : EQUIPMENT[id].price, desc: EQUIPMENT[id].desc }));
  }
  if (cat === 'Utility') return UTILITY_LIST.map((u) => ({ id: u.id, name: u.name, price: u.price, desc: u.desc }));
  return BUYABLE_WEAPONS.filter((w) => w.category === cat).map((w) => ({ id: w.id, name: w.name, price: w.price, desc: w.desc, weapon: w }));
}

function blockReason(e: Entry, buy: BuyView): string {
  if (!buy.canBuy) return buy.phase === 'buy' ? 'Return to spawn' : 'Buy phase over';
  if (isWeaponId(e.id)) {
    if (buy.primary === e.id || buy.sidearm === e.id) return 'Equipped';
  } else if (e.id in UTILITY) {
    if (buy.util.length >= 4) return 'Utility full';
    if (buy.util.filter((u) => u === e.id).length >= UTILITY[e.id as UtilityId].cap) return 'Limit reached';
  } else if (e.id === 'kit') {
    if (buy.kit) return 'Owned';
  } else if (e.id === 'vest') {
    if (buy.armor >= 100) return 'Owned';
  } else if (e.id === 'vesthelm') {
    if (buy.armor >= 100 && buy.helmet) return 'Owned';
  }
  if (!buy.infinite && buy.money < e.price) return 'Insufficient funds';
  return '';
}

function BuyMenu({ game, buy, msg }: { game: GameClient; buy: BuyView; msg: string }): ReactNode {
  const [cat, setCat] = useState<Cat>('Rifles');
  const [step, setStep] = useState<'cat' | 'item'>('cat');
  const list = entries(cat, buy);
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.repeat) return;
      const n = e.code.startsWith('Digit') ? Number(e.code.slice(5)) : -1;
      if (e.code === 'Backspace' || n === 0) {
        setStep('cat');
        return;
      }
      if (n < 1) return;
      if (step === 'cat') {
        if (n <= CATS.length) {
          setCat(CATS[n - 1]);
          setStep('item');
          game.audio.play('ui_click');
        }
      } else if (n <= list.length) game.buy(list[n - 1].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, cat, list, game]);
  const stat = (label: string, v: number): ReactNode => (
    <div className="stat">
      {label}
      <i>
        <b style={{ width: `${Math.max(4, Math.min(100, v * 100))}%` }} />
      </i>
    </div>
  );
  return (
    <div className="center-screen" style={{ background: 'rgba(6,8,11,0.55)' }}>
      <div className="panel buy" onContextMenu={(e) => e.preventDefault()}>
        <div className="buy-head">
          <h2>Requisition — {SIDE_LABEL[buy.side]}</h2>
          {buy.phase === 'buy' && <span className="buy-time">{buy.timeLeft.toFixed(0)}s</span>}
          <span className="buy-money">{buy.infinite ? '∞' : '$' + buy.money.toLocaleString('en-US')}</span>
        </div>
        <div className="buy-cats">
          {CATS.map((c, i) => (
            <button
              key={c}
              className={c === cat ? 'sel' : ''}
              onClick={() => {
                setCat(c);
                setStep('item');
                game.audio.play('ui_click');
              }}
            >
              <b style={{ color: step === 'cat' ? 'var(--warn)' : undefined }}>{i + 1}</b>
              {c}
            </button>
          ))}
        </div>
        <div className="buy-items">
          {list.map((e, i) => {
            const why = blockReason(e, buy);
            const owned = why === 'Equipped' || why === 'Owned';
            const refundable = buy.refundable.includes(e.id);
            const w = e.weapon;
            return (
              <button
                key={e.id}
                className={`item ${why && !owned ? 'blocked' : ''} ${owned ? 'owned' : ''}`}
                onMouseEnter={() => game.audio.play('ui_hover')}
                onClick={() => game.buy(e.id)}
                onContextMenu={(ev) => {
                  ev.preventDefault();
                  if (refundable) game.refund(e.id);
                }}
              >
                <span className="k" style={{ color: step === 'item' ? 'var(--warn)' : undefined }}>
                  {i + 1}
                </span>
                <div className="nm">{e.name}</div>
                <div className="pr">${e.price.toLocaleString('en-US')}</div>
                <div className="ds">{e.desc}</div>
                {w && (
                  <>
                    {stat('Damage', (w.damage * (w.pellets ?? 1)) / 120)}
                    {stat('Rate', w.rpm / 1000)}
                    {stat('Armor', (w.armorPen - 0.4) / 0.55)}
                    {stat('Mobility', (w.moveSpeed - 4) / 1.3)}
                  </>
                )}
                {why && <span className="why">{why}</span>}
                {refundable && <span className="refund">right-click: refund</span>}
              </button>
            );
          })}
        </div>
        <div className="buy-side">
          <h4>Your loadout</h4>
          <div className="mate">
            <span>{buy.primary ? WEAPONS[buy.primary as keyof typeof WEAPONS].name : 'No primary'}</span>
            <span />
            <small>
              {buy.sidearm ? WEAPONS[buy.sidearm as keyof typeof WEAPONS].name : 'No sidearm'} · armor {buy.armor}
              {buy.helmet ? ' + helmet' : ''}
              {buy.kit ? ' · kit' : ''}
            </small>
            <small>{buy.util.length ? buy.util.map((u) => UTILITY[u as UtilityId].name).join(', ') : 'No utility'}</small>
          </div>
          <div className="mate">
            <span>Next round, at minimum</span>
            <span className="m">${buy.nextMin.toLocaleString('en-US')}</span>
            <small>your money plus the loss bonus if this round is lost</small>
          </div>
          <h4 style={{ marginTop: 16 }}>Team</h4>
          {buy.mates.map((m) => (
            <Mate key={m.id} m={m} />
          ))}
        </div>
        <div className="buy-foot">
          <span>
            <span className="kbd">1–6</span> category, then <span className="kbd">1–5</span> to buy
          </span>
          <span>
            <span className="kbd">0</span> back
          </span>
          <span>Right-click an item bought this round to refund it</span>
          <span>
            <span className="kbd">B</span> / <span className="kbd">Esc</span> close
          </span>
          <span className="msg">{msg}</span>
        </div>
      </div>
    </div>
  );
}

function Mate({ m }: { m: RosterEntry }): ReactNode {
  const gun = m.primary ? WEAPONS[m.primary as keyof typeof WEAPONS].name : m.sidearm ? WEAPONS[m.sidearm as keyof typeof WEAPONS].name : '—';
  return (
    <div className="mate" style={{ opacity: m.alive ? 1 : 0.5 }}>
      <span>
        {m.name}
        {m.hasSpike ? ' ◆' : ''}
      </span>
      <span className="m">${Math.max(0, m.money).toLocaleString('en-US')}</span>
      <small>
        {gun} · armor {Math.max(0, m.armor)}
        {m.helmet ? '+H' : ''}
        {m.kit ? ' · kit' : ''} · {Math.max(0, m.utilCount)} utility
      </small>
    </div>
  );
}

// ------------------------------------------------------------------ scoreboard
function Scoreboard({ board }: { board: { roster: RosterEntry[]; score: [number, number]; sides: [Side, Side]; round: number; myTeam: number; myId: number; mode: string } }): ReactNode {
  const teams = [board.myTeam, 1 - board.myTeam];
  return (
    <div className="panel board">
      <h2>
        {board.score[board.myTeam]} – {board.score[1 - board.myTeam]}
      </h2>
      <div className="meta">
        {board.mode} · Aperture Annex · Round {board.round}
      </div>
      <table className="sb">
        <thead>
          <tr>
            <th>Player</th>
            <th>K</th>
            <th>D</th>
            <th>A</th>
            <th>Money</th>
            <th>Equipment</th>
            <th>Ping</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t) => (
            <TeamRows key={t} board={board} team={t} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TeamRows({ board, team }: { board: { roster: RosterEntry[]; sides: [Side, Side]; myTeam: number; myId: number }; team: number }): ReactNode {
  const rows = board.roster.filter((r) => r.team === team).sort((a, b) => b.k - a.k || a.d - b.d);
  const side = board.sides[team];
  return (
    <>
      <tr className="teamrow">
        <td colSpan={7} style={{ color: `var(--${side})` }}>
          {SIDE_LABEL[side]} {team === board.myTeam ? '· your team' : ''}
        </td>
      </tr>
      {rows.map((r) => (
        <tr key={r.id} className={`${r.alive ? '' : 'dead'} ${r.id === board.myId ? 'me' : ''}`}>
          <td>
            {r.name}
            {r.bot ? '' : ' (you)'}
            {r.hasSpike ? ' ◆' : ''}
          </td>
          <td>{r.k}</td>
          <td>{r.d}</td>
          <td>{r.a}</td>
          <td>{r.money >= 0 ? '$' + r.money.toLocaleString('en-US') : '—'}</td>
          <td style={{ color: 'var(--dim)' }}>
            {team === board.myTeam
              ? `${r.primary ? WEAPONS[r.primary as keyof typeof WEAPONS].name : r.sidearm ? WEAPONS[r.sidearm as keyof typeof WEAPONS].name : '—'}${r.armor > 0 ? ' · armor' : ''}${r.kit ? ' · kit' : ''}`
              : 'hidden'}
          </td>
          <td>{r.bot ? 'bot' : '0'}</td>
        </tr>
      ))}
    </>
  );
}

// ------------------------------------------------------------------ results
const REASON: Record<string, string> = { eliminated: 'Elim', time: 'Time', detonated: 'Boom', disarmed: 'Disarm' };

function Result({ game, summary, myTeam, myId, mode }: { game: GameClient; summary: MatchSummary; myTeam: number; myId: number; mode: string }): ReactNode {
  const won = summary.winnerTeam < 0 ? null : summary.winnerTeam === myTeam;
  const rounds = summary.rounds;
  const maxEq = Math.max(1000, ...rounds.map((r) => Math.max(r.equip[0], r.equip[1])));
  const W = 1000;
  const H = 150;
  const px = (i: number): number => (rounds.length <= 1 ? W / 2 : 20 + (i / (rounds.length - 1)) * (W - 40));
  const py = (v: number): number => H - 14 - (v / maxEq) * (H - 30);
  const line = (team: number): string => rounds.map((r, i) => `${px(i).toFixed(1)},${py(r.equip[team]).toFixed(1)}`).join(' ');
  const swapAt = game.rules.swapAfter;
  const players = summary.players.slice().sort((a, b) => (a.team === myTeam ? 0 : 1) - (b.team === myTeam ? 0 : 1) || b.kills - a.kills);
  return (
    <div className="center-screen">
      <div className="panel result">
        <div className="head">
          <div className={`verdict ${won === null ? '' : won ? 'win' : 'loss'}`}>{won === null ? 'Draw' : won ? 'Victory' : 'Defeat'}</div>
          <div className="final">
            {summary.score[myTeam]} – {summary.score[1 - myTeam]}
          </div>
          <div style={{ color: 'var(--dim)', fontSize: 12, letterSpacing: '0.1em' }}>
            {mode} · Aperture Annex · {rounds.length} rounds · {Math.round(summary.ticks / 64 / 60)} min
          </div>
        </div>
        <div className="legend">Round timeline — green: your team won the round</div>
        <div className="timeline">
          {rounds.map((r) => (
            <div key={r.n} className={`rchip ${r.winnerTeam === myTeam ? 'won' : ''} ${r.n === swapAt + 1 ? 'half' : ''}`} title={`Round ${r.n}`}>
              <b>{r.n}</b>
              {REASON[r.reason]}
              {r.planted ? ' ' + r.site : ''}
            </div>
          ))}
        </div>
        <div className="legend">
          <span>
            <i style={{ background: 'var(--good)' }} />
            Your team equipment value
          </span>
          <span>
            <i style={{ background: 'var(--enemy)' }} />
            Opponent equipment value
          </span>
          <span>Economy by round (max ${maxEq.toLocaleString('en-US')})</span>
        </div>
        <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          {rounds.map((r, i) => (
            <rect key={r.n} x={px(i) - 3} y={0} width={6} height={H} fill={r.winnerTeam === myTeam ? 'rgba(93,255,176,0.07)' : 'rgba(255,107,91,0.07)'} />
          ))}
          <polyline points={line(1 - myTeam)} fill="none" stroke="#ff6b5b" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          <polyline points={line(myTeam)} fill="none" stroke="#5dffb0" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        </svg>
        <table className="sb">
          <thead>
            <tr>
              <th>Player</th>
              <th>K</th>
              <th>D</th>
              <th>A</th>
              <th>Damage</th>
              <th>HS%</th>
              <th>Acc%</th>
              <th>Opening</th>
              <th>Trades</th>
              <th>Arm / Disarm</th>
              <th>Util dmg</th>
              <th>Flashed</th>
              <th>Spent</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => (
              <tr key={p.id} className={p.id === myId ? 'me' : ''} style={i === 5 ? { borderTop: '2px solid var(--line)' } : undefined}>
                <td className={p.team === myTeam ? 'ally' : 'enemy'}>
                  {p.name}
                  {p.id === myId && !p.bot ? ' (you)' : ''}
                </td>
                <td>{p.kills}</td>
                <td>{p.deaths}</td>
                <td>{p.assists}</td>
                <td>{p.damage}</td>
                <td>{p.kills ? Math.round((p.headshots / p.kills) * 100) : 0}</td>
                <td>{p.shots ? Math.round((p.hits / p.shots) * 100) : 0}</td>
                <td>
                  {p.openingKills}–{p.openingDeaths}
                </td>
                <td>{p.trades}</td>
                <td>
                  {p.plants} / {p.defuses}
                </td>
                <td>{p.utilDamage}</td>
                <td>{p.flashed}</td>
                <td>${p.spent.toLocaleString('en-US')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ color: 'var(--dim)', fontSize: 11, marginBottom: 8 }}>
          Match {summary.matchId} · ruleset {summary.ruleset} · map {summary.map} · collision {summary.collisionHash} · log {summary.logHash}
        </div>
        <div className="btnrow">
          <button className="cta" onClick={() => game.config && game.startMatch({ ...game.config, seed: undefined })}>
            Play again
          </button>
          <button className="cta ghost" onClick={() => game.quitToMenu()}>
            Main menu
          </button>
        </div>
      </div>
    </div>
  );
}
