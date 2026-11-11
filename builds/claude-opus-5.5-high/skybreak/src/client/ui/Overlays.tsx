import { useEffect, useRef, useState } from 'react';
import type { GameSession } from '../game';
import { useHud } from './store';
import { drawMap, screenToWorld } from './mapdraw';
import { SlotIcon, WeaponAdvanced, rarityColor, fmtTime } from './Hud';
import { RARITIES } from '../../shared/content/rarity';
import { WEAPONS, AMMO_TYPES, AMMO_NAMES, AMMO_CAPS } from '../../shared/content/weapons';
import { ITEMS } from '../../shared/content/items';
import { keyName, getSettings } from '../settings';

export function FullMap({ session }: { session: GameSession }) {
  const st = useHud(session.hud);
  const ref = useRef<HTMLCanvasElement>(null);
  const size = Math.min(window.innerHeight - 140, 760);
  useEffect(() => {
    if (!ref.current || !st.snap) return;
    drawMap(ref.current.getContext('2d')!, st.snap, st.yaw, { size, labels: true, pings: st.pings });
  });
  if (!st.snap) return null;
  const snap = st.snap;
  const click = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (e.button === 2) { session.queueAction({ t: 'clearMarker' }); return; }
    const w = screenToWorld(e.clientX - r.left, e.clientY - r.top, size);
    session.queueAction({ t: 'marker', x: w.x, z: w.z });
  };
  return (
    <div className="overlay map-overlay" onContextMenu={(e) => { e.preventDefault(); session.queueAction({ t: 'clearMarker' }); }}>
      <div className="ov-head">
        <h2>The Highwake</h2>
        <span className="dim">Click: place marker · Right-click: clear · <kbd>{keyName(getSettings().keys.map)}</kbd> close</span>
      </div>
      <div className="map-wrap">
        <canvas ref={ref} width={size} height={size} onMouseDown={click} className="fullmap" />
        <div className="legend">
          {snap.mode === 'solo' && <>
            <div><i className="lg storm" /> Riftstorm (current field edge)</div>
            <div><i className="lg next" /> Next Calmfield</div>
            <div><i className="lg skiff" /> Skiff path</div>
            <div><i className="lg cap" /> Supply capsule ping</div>
            <div><i className="lg car" /> Caravan drone (approximate)</div>
            <div className="dim">Phase {snap.storm.phase + 1}/{snap.storm.phases} · {snap.storm.stage === 'wait' ? 'shrinks in' : 'closing'} {fmtTime(snap.storm.endsIn)}</div>
          </>}
          <div><i className="lg you" /> You</div>
          <div><i className="lg mark" /> Your marker</div>
          <div className="dim small">Enemies never appear on the map unless legally revealed.</div>
        </div>
      </div>
    </div>
  );
}

export function Inventory({ session }: { session: GameSession }) {
  const st = useHud(session.hud);
  const [pick, setPick] = useState<number | null>(null);
  if (!st.snap) return null;
  const y = st.snap.you;
  const click = (i: number) => {
    if (pick === null) setPick(i);
    else { if (pick !== i) session.queueAction({ t: 'swap', a: pick, b: i }); setPick(null); }
  };
  const focus = pick ?? y.sel;
  const fs = y.slots[focus];
  return (
    <div className="overlay inv-overlay">
      <div className="ov-head">
        <h2>Inventory</h2>
        <span className="dim">Click a slot, then another to swap · <kbd>{keyName(getSettings().keys.inventory)}</kbd> close</span>
      </div>
      <div className="inv-grid">
        {y.slots.map((s, i) => (
          <div key={i} className={`inv-slot ${pick === i ? 'picked' : ''} ${i === y.sel ? 'sel' : ''}`} style={s?.kind === 'weapon' ? { borderColor: rarityColor(s.r) } : undefined} onClick={() => click(i)}>
            <span className="key">{i + 1}</span>
            <SlotIcon slot={s} />
            {s?.kind === 'weapon' && <div className="inv-sub" style={{ color: rarityColor(s.r) }}>{RARITIES[s.r].glyph} {RARITIES[s.r].name} · {s.mag}/{WEAPONS[s.w].mag}</div>}
            {s?.kind === 'item' && <div className="inv-sub">{ITEMS[s.id].name} · stack {ITEMS[s.id].stack}</div>}
            {s && <button className="small" onClick={(e) => { e.stopPropagation(); session.queueAction({ t: 'drop', slot: i }); }}>Drop</button>}
          </div>
        ))}
      </div>
      <div className="inv-bottom">
        <div className="inv-detail">
          <h3>Details</h3>
          {fs?.kind === 'weapon' && <><div className="dim">{WEAPONS[fs.w].blurb}</div><WeaponAdvanced w={fs.w} r={fs.r} /></>}
          {fs?.kind === 'item' && <div>{ITEMS[fs.id].blurb}</div>}
          {!fs && <div className="dim">Empty slot. Weapons, heals, shields and utilities all compete for the five slots.</div>}
          <div className="rar-legend">{RARITIES.map((r) => <span key={r.id} style={{ color: rarityColor(r.id) }}>{r.glyph} {r.name}</span>)}</div>
        </div>
        <div className="inv-ammo">
          <h3>Ammo</h3>
          {AMMO_TYPES.map((a) => (
            <div key={a} className="ammo-line">
              <span className={`am am-${a}`}>{AMMO_NAMES[a]}</span>
              <b>{y.ammo[a]}</b><span className="dim">/ {AMMO_CAPS[a]}</span>
              <button className="small" disabled={y.ammo[a] <= 0} onClick={() => session.queueAction({ t: 'dropAmmo', ammo: a, amount: Math.min(30, y.ammo[a]) })}>Drop {Math.min(30, y.ammo[a])}</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
