import { useEffect, useRef, useState } from 'react';
import type { CardButton, GameClient } from '../game/client';
import { iconFor } from '../game/client';
import { useStore } from './store';
import { FACTIONS } from '../faction-data';

export function Hud({ client, onOpenSettings, onQuit }: { client: GameClient; onOpenSettings: () => void; onQuit: (surrender: boolean) => void }) {
  const h = useStore(client.hud);
  const mmRef = useRef<HTMLCanvasElement>(null);
  const [tip, setTip] = useState<CardButton | null>(null);
  const [tipExpanded, setTipExpanded] = useState(false);
  useEffect(() => { client.attachMinimap(mmRef.current); }, [client]);
  useEffect(() => {
    if (!tip) { setTipExpanded(false); return; }
    const t = setTimeout(() => setTipExpanded(true), 350); // layered tooltip: details after 350 ms
    return () => clearTimeout(t);
  }, [tip]);
  const replay = h.mode === 'replay';
  const blocked = h.supplyUsed >= h.supplyCap && h.supplyCap < 100;
  const p = h.primary;
  const subs = h.groups;
  return (
    <div className="hud">
      {!replay && (
        <div className="topRight">
          <div className="hudPanel res ore" title="Prism Ore: workers, basic units, structures"><div className="v">{h.ore}</div><div className="k">Prism Ore</div></div>
          <div className="hudPanel res flux" title="Flux: specialists, abilities, technology"><div className="v">{h.flux}</div><div className="k">Flux</div></div>
          <div className={'hudPanel res supply' + (blocked ? ' blocked' : '')} title="Supply used / cap"><div className="v">{h.supplyUsed}/{h.supplyCap}</div><div className="k">Supply</div></div>
          <div className="hudPanel res" title={`Workers (${h.idleWorkers} idle)`}><div className="v">{h.workers}{h.idleWorkers > 0 && <span style={{ fontSize: 12, color: 'var(--amber)' }}> ({h.idleWorkers} idle)</span>}</div><div className="k">Workers</div></div>
          <div className="hudPanel res time"><div className="v">{h.time}</div><div className="k">{h.lateGame ? 'Endgame surge' : 'Match time'}</div></div>
        </div>
      )}
      {replay && h.replay && (
        <div className="hudPanel replayBar">
          {h.replay.players.map((pl, i) => (
            <div key={i} className="pl"><b style={{ color: client.renderer.teamHex(i) }}>{pl.name}</b> · {FACTIONS[pl.faction as 'helix'].name}<br />Ore {pl.ore} · Flux {pl.flux} · Supply {pl.supply} · Army {pl.army}</div>
          ))}
          <div className="pl">{h.time}<br /><span style={{ color: h.replay.hashOk ? 'var(--green)' : 'var(--red)' }}>{h.replay.hashOk ? `✓ ${h.replay.checked} state hashes match` : '✕ state hash mismatch'}</span></div>
          {[1, 2, 4, 8].map((s) => <button key={s} className="btn ghost" style={{ padding: '4px 10px' }} onClick={() => client.setSpeed(s)} aria-pressed={h.speed === s}>{s}×</button>)}
          <button className="btn ghost" style={{ padding: '4px 10px' }} onClick={() => client.togglePause()}>{h.paused ? '▶' : '❚❚'}</button>
        </div>
      )}
      {h.objective && !replay && (
        <div className={'hudPanel objective' + (h.mode === 'tutorial' ? ' tutorial' : '')}>
          <div className="t">{h.mode === 'tutorial' ? `Tutorial ${h.objective.step}/${h.objective.total} — ${h.objective.title}` : h.objective.title}</div>
          <div className="d">{h.objective.text}</div>
        </div>
      )}
      {h.hint && <div className="hudPanel hint">{h.hint}</div>}
      <div className="menuBar">
        <button onClick={() => client.setMenuOpen(true)} title="Menu (F10 / Esc)">Menu</button>
        {!replay && <button onClick={() => client.togglePause()} title="Pause">{h.paused ? 'Resume' : 'Pause'}</button>}
      </div>
      {h.perf && (
        <div className="hudPanel perf" style={{ top: 48 }}>
          FPS {h.perf.fps.toFixed(0)} · frame {h.perf.frameMs.toFixed(1)} ms<br />
          sim {h.perf.simMs.toFixed(2)} ms/tick · draw calls {h.perf.calls}<br />
          triangles {(h.perf.tris / 1000).toFixed(0)}k · entities {h.perf.entities} · units {h.perf.units}<br />
          flow fields built {h.perf.fields}{h.perf.heapMb ? ` · heap ${h.perf.heapMb.toFixed(0)} MB` : ''}<br />
          {h.aiStates.map((s, i) => <span key={i}>AI {s}<br /></span>)}
          <span className="muted">F9 nav overlay · ` toggle</span>
        </div>
      )}
      <div className="alerts" aria-live="polite">
        {h.alerts.map((a) => <div key={a.id} className={'alert ' + a.kind}>{a.text}</div>)}
      </div>
      {!replay && h.ctrlGroups.some((c) => c > 0) && (
        <div className="ctrlGroups">{h.ctrlGroups.map((c, i) => (c > 0 ? <span key={i}><b>{i}</b> · {c}</span> : null))}</div>
      )}
      {tip && (
        <div className="hudPanel tooltip">
          <h5>{tip.label} <kbd>{tip.key}</kbd></h5>
          {tip.cost && (
            <div className="cost">
              {tip.cost.ore > 0 && <span style={{ color: 'var(--ore)' }}>{tip.cost.ore} Ore</span>}
              {tip.cost.flux > 0 && <span style={{ color: 'var(--flux)' }}>{tip.cost.flux} Flux</span>}
              {tip.cost.supply ? <span>{tip.cost.supply} Supply</span> : null}
              {tip.cost.energy ? <span style={{ color: 'var(--violet)' }}>{tip.cost.energy} Energy</span> : null}
            </div>
          )}
          <div>{tip.tooltip}</div>
          {tipExpanded && tip.detail && <pre>{tip.detail}</pre>}
          {!tip.enabled && tip.reason && <div className="why">{tip.reason}</div>}
        </div>
      )}
      <div className="bottom">
        <div className="hudPanel minimapBox">
          {h.bases.length > 0 && <div className="econ">{h.bases.map((b, i) => <span key={i} style={{ marginRight: 10 }} title="Ore workers / ideal · Flux workers / ideal">Base {i + 1}: <b style={{ color: b.workers > b.ideal ? 'var(--amber)' : 'var(--ore)' }}>{b.workers}/{b.ideal}</b>{b.fluxIdeal > 0 && <> · <b style={{ color: 'var(--flux)' }}>{b.fluxWorkers}/{b.fluxIdeal}</b></>}{b.workers > b.ideal ? ' (oversaturated)' : ''}</span>)}</div>}
          <canvas ref={mmRef} aria-label="Minimap: left-click to move the camera, right-click to order" />
        </div>
        <div className="hudPanel selPanel">
          {!p && <div className="selInfo"><div className="role" style={{ marginTop: 40, textAlign: 'center' }}>Nothing selected — left-click or drag to select. Right-click to command.</div></div>}
          {p && h.selectionCount === 1 && (
            <>
              <div className="portrait">
                <div className="ic" style={{ color: client.renderer.teamHex(p.owner) }}>{iconFor(p.def)}</div>
                <div className="hpTxt">{p.hp}/{p.maxHp}</div>
                <div className="bar"><i style={{ width: `${(p.hp / p.maxHp) * 100}%`, background: p.hp / p.maxHp > 0.6 ? '#53e08a' : p.hp / p.maxHp > 0.3 ? '#f2c94c' : '#ff5a4f' }} /></div>
              </div>
              <div className="selInfo">
                <h4>{p.name}</h4>
                <div className="role">{p.role}</div>
                {p.weapon && <div className="stat">⚔ {p.weapon}</div>}
                <div className="stat">Armor {p.armor} · {p.tags.filter((t) => t !== 'Structure').join(' · ')}{p.order ? ` · ${p.order}` : ''}{p.carry ? ` · carrying ${p.carry}` : ''}</div>
                {p.amount !== undefined && <div className="stat">Remaining: {p.amount}</div>}
                {p.energy !== undefined && <div className="stat" style={{ color: 'var(--violet)' }}>Energy {p.energy}/{p.energyMax}</div>}
                {p.shield !== undefined && <div className="stat" style={{ color: '#7fdcff' }}>Frontal shield {p.shield}/160</div>}
                {p.progress !== undefined && <><div className="stat">Construction {(p.progress * 100).toFixed(0)}%</div><div className="bar"><i style={{ width: `${p.progress * 100}%`, background: 'var(--amber)' }} /></div></>}
                {p.strongVs && <div className="stat" style={{ fontSize: 11 }}><span style={{ color: 'var(--green)' }}>Strong:</span> {p.strongVs} <span style={{ color: 'var(--red)' }}>Weak:</span> {p.weakVs}</div>}
                <div className="chips">{p.status.map((s) => <span key={s} className={'chip' + (/Slow|Silenc|block/.test(s) ? ' warn' : '')}>{s}</span>)}</div>
                {p.queue.length > 0 && (
                  <div className="queue">
                    {p.queue.map((q, i) => (
                      <button key={i} className={'qitem' + (q.paused ? ' paused' : '')} title={`${q.name}${q.paused ? ' — ' + q.paused : ''} (click to cancel, full refund)`} onClick={() => client.cancelQueue(i)}>
                        {iconFor(q.def)}<i style={{ width: `${q.progress * 100}%` }} />
                      </button>
                    ))}
                    {p.queue[0]?.paused && <span className="chip warn" style={{ alignSelf: 'center' }}>{p.queue[0].paused}</span>}
                  </div>
                )}
              </div>
            </>
          )}
          {p && h.selectionCount > 1 && (
            <div className="selInfo">
              <h4>{h.selectionCount} selected <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>· Tab cycles subgroup · click to narrow</span></h4>
              <div className="groupGrid" style={{ marginTop: 8 }}>
                {subs.map((g) => (
                  <button key={g.def} className={'gcell' + (g.def === h.subgroup ? ' active' : '') + (g.kind === 'enemy' ? ' enemy' : '')} title={g.name} onClick={() => client.selectOnly(g.def)}>
                    {iconFor(g.def)}<b>{g.count}</b>
                  </button>
                ))}
              </div>
              {p.queue.length > 0 && <div className="queue">{p.queue.map((q, i) => <div key={i} className={'qitem' + (q.paused ? ' paused' : '')}>{iconFor(q.def)}<i style={{ width: `${q.progress * 100}%` }} /></div>)}</div>}
            </div>
          )}
        </div>
        {!replay && (
          <div className="hudPanel card">
            <div className="cardTitle">{h.cardTitle || 'Commands'}</div>
            <div className="cardGrid">
              {h.card.map((b) => (
                <button key={b.id} className={'cbtn' + (b.enabled ? '' : ' off') + (b.active ? ' on' : '')}
                  onMouseEnter={() => setTip(b)} onMouseLeave={() => setTip(null)} onClick={() => client.pressButton(b.id)}>
                  <span className="k">{b.key}</span>
                  <span className="i">{b.icon}</span>
                  <span className="n">{b.label}</span>
                  {b.progress !== undefined && <span className="cd" style={{ width: `${b.progress * 100}%` }} />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {h.gameOver && <div className="banner-big" style={{ color: replay ? '#fff' : h.mode !== 'benchmark' && client.sim.winner === 0 ? 'var(--teal)' : 'var(--red)' }}>{replay ? 'REPLAY COMPLETE' : client.sim.winner === 0 ? 'VICTORY' : 'DEFEAT'}</div>}
      {h.menuOpen && (
        <div className="modalBack" onClick={() => client.setMenuOpen(false)}>
          <div className="hudPanel modal" onClick={(e) => e.stopPropagation()}>
            <h2>Paused</h2>
            <div className="stack">
              <button className="btn primary" onClick={() => client.setMenuOpen(false)}>Resume</button>
              <button className="btn" onClick={onOpenSettings}>Settings</button>
              {!replay && h.mode !== 'benchmark' && <button className="btn danger" onClick={() => onQuit(true)}>Surrender</button>}
              <button className="btn ghost" onClick={() => onQuit(false)}>{replay || h.mode === 'benchmark' ? 'Return to menu' : 'Abandon to menu (no record)'}</button>
            </div>
            <div className="label" style={{ marginTop: 20 }}>Quick controls</div>
            <div className="controlsGrid muted">
              <kbd>LMB</kbd><span>select · drag box · double-click/Ctrl+click same type</span>
              <kbd>RMB</kbd><span>move / attack / gather / repair / capture / rally (Shift queues, Alt force-moves)</span>
              <kbd>A S H P G</kbd><span>attack-move · stop · hold · patrol · guard</span>
              <kbd>B</kbd><span>construction palette (workers) · <kbd>R</kbd> rally mode</span>
              <kbd>Q W E</kbd><span>abilities / production slots</span>
              <kbd>Ctrl+1–9</kbd><span>assign group · 1–9 select · double-tap to center</span>
              <kbd>Space</kbd><span>jump to latest alert · <kbd>Home</kbd> base · <kbd>F</kbd> focus · <kbd>Tab</kbd> subgroup</span>
            </div>
          </div>
        </div>
      )}
      {h.contextLost && (
        <div className="modalBack">
          <div className="hudPanel modal">
            <h2>Graphics context lost</h2>
            <p>The browser reset the GPU context. The simulation is paused and safe.</p>
            <div className="stack">
              <button className="btn primary" onClick={() => client.restoreFromContextLoss()}>Try to resume</button>
              <button className="btn ghost" onClick={() => onQuit(false)}>Return to menu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
