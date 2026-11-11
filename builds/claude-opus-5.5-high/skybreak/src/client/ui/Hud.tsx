import { useEffect, useRef } from 'react';
import type { GameSession } from '../game';
import { useHud, HudState } from './store';
import { drawMap } from './mapdraw';
import { RARITIES } from '../../shared/content/rarity';
import { WEAPONS, weaponStats, AMMO_NAMES, AMMO_TYPES, AMMO_CAPS, WeaponId, effectiveDps } from '../../shared/content/weapons';
import { ITEMS } from '../../shared/content/items';
import { getSettings, keyName } from '../settings';
import type { Slot, LootView, Snapshot } from '../../shared/protocol/messages';
import { AEGIS_MAX, RESERVE_MAX, HEALTH_MAX, MOVE } from '../../shared/content/rules';

export const rarityColor = (r: number) => (getSettings().colorblind ? RARITIES[r].colorAlt : RARITIES[r].color);
export const fmtTime = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, '0')}`;

export function SlotIcon({ slot }: { slot: Slot }) {
  if (!slot) return <span className="slot-empty">—</span>;
  if (slot.kind === 'weapon') {
    const d = WEAPONS[slot.w];
    return (
      <span className="slot-weapon">
        <span className="glyph" style={{ color: rarityColor(slot.r) }}>{RARITIES[slot.r].glyph}</span>
        <span className="wname">{d.name.split(' ')[0]}</span>
        <span className="wcls">{d.cls}</span>
      </span>
    );
  }
  const it = ITEMS[slot.id];
  return (
    <span className="slot-item">
      <span className="dot" style={{ background: it.color }} />
      <span className="wname">{it.short}</span>
      <span className="count">×{slot.n}</span>
    </span>
  );
}

function Compass({ yaw, marker, me }: { yaw: number; marker: { x: number; z: number } | null; me: { x: number; z: number } }) {
  const deg = ((yaw * 180) / Math.PI + 360) % 360;
  const marks: { d: number; l: string }[] = [];
  for (let d = 0; d < 360; d += 15) marks.push({ d, l: ({ 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW' } as Record<number, string>)[d] ?? String(d) });
  const W = 520;
  const pos = (d: number) => {
    let r = d - deg;
    while (r > 180) r -= 360;
    while (r < -180) r += 360;
    return r;
  };
  let markerDeg: number | null = null;
  if (marker) markerDeg = ((Math.atan2(marker.x - me.x, marker.z - me.z) * 180) / Math.PI + 360) % 360;
  return (
    <div className="compass" style={{ width: W }}>
      {marks.map((m) => {
        const r = pos(m.d);
        if (Math.abs(r) > 75) return null;
        return <span key={m.d} className={m.l.length <= 2 && isNaN(Number(m.l)) ? 'cardinal' : 'tick'} style={{ left: W / 2 + (r / 75) * (W / 2) }}>{m.l}</span>;
      })}
      {markerDeg !== null && Math.abs(pos(markerDeg)) < 75 && <span className="cmarker" style={{ left: W / 2 + (pos(markerDeg) / 75) * (W / 2) }}>▼ {Math.round(Math.hypot(marker!.x - me.x, marker!.z - me.z))}m</span>}
      <span className="cneedle">{Math.round(deg)}°</span>
    </div>
  );
}

function Minimap({ st }: { st: HudState }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const last = useRef(0);
  useEffect(() => {
    const snap = st.snap;
    if (!ref.current || !snap) return;
    if (st.now - last.current < 0.1) return;
    last.current = st.now;
    const g = ref.current.getContext('2d')!;
    drawMap(g, snap, st.yaw, { size: 210, center: { x: snap.you.x, z: snap.you.z }, span: snap.you.mode === 'freefall' || snap.you.mode === 'skiff' || snap.you.mode === 'glide' ? 700 : 260, labels: false, pings: st.pings });
  });
  return <canvas ref={ref} width={210} height={210} className="minimap" />;
}

function StatRow({ label, a, b, better }: { label: string; a: string; b?: string; better?: boolean | null }) {
  return (
    <div className="srow"><span>{label}</span><b>{a}</b>{b !== undefined && <i className={better === null ? '' : better ? 'up' : 'down'}>{better === null ? '' : better ? '▲' : '▼'} {b}</i>}</div>
  );
}

function PickupPrompt({ snap }: { snap: Snapshot }) {
  const y = snap.you;
  const f = y.focus;
  if (!f) return null;
  const ik = keyName(getSettings().keys.interact);
  if (f.t === 'zip' || f.t === 'ascend') return <div className="prompt"><kbd>{keyName(getSettings().keys.jump)}</kbd>/<kbd>{ik}</kbd> {f.t === 'zip' ? 'Ride zipline' : 'Use ascender'}</div>;
  if (f.t === 'container') {
    const label = { chest: 'Open Resonance Chest', locker: 'Open Supply Locker', cache: 'Search Cache', capsule: 'Open Supply Capsule', caravan: 'Loot Caravan Cargo' }[f.kind] ?? 'Open';
    return <div className="prompt"><kbd>{ik}</kbd> {label}</div>;
  }
  const it = snap.loot.find((l) => l.id === f.id);
  if (!it) return null;
  return <LootCard it={it} snap={snap} needsHold={f.needsHold} hold={y.holdProgress} swapSlot={f.swapSlot} ik={ik} />;
}

function LootCard({ it, snap, needsHold, hold, swapSlot, ik }: { it: LootView; snap: Snapshot; needsHold: boolean; hold: number; swapSlot: number; ik: string }) {
  if (it.kind === 'ammo') return <div className="prompt"><kbd>{ik}</kbd> {AMMO_NAMES[it.ammo!]} Ammo ×{it.amount} <span className="dim">({snap.you.ammo[it.ammo!]}/{AMMO_CAPS[it.ammo!]})</span></div>;
  if (it.kind === 'item') {
    const d = ITEMS[it.item!];
    return (
      <div className="lootcard">
        <div className="lc-title"><span className="dot" style={{ background: d.color }} /> {d.name} ×{it.n}</div>
        <div className="lc-blurb">{d.blurb}</div>
        <div className="lc-action"><kbd>{ik}</kbd> {needsHold ? `Hold to swap with slot ${swapSlot + 1}` : 'Pick up'}{needsHold && <span className="holdbar"><span style={{ width: `${hold * 100}%` }} /></span>}</div>
      </div>
    );
  }
  const st = weaponStats(it.w!, it.r!);
  const cur = snap.you.slots[snap.you.sel];
  const cst = cur?.kind === 'weapon' ? weaponStats(cur.w, cur.r) : null;
  const cmp = (a: number, b: number | undefined, higherBetter = true) => (b === undefined ? null : Math.abs(a - b) < 1e-3 ? null : higherBetter ? a > b : a < b);
  const dmg = st.damage * st.def.pellets, cdmg = cst ? cst.damage * cst.def.pellets : undefined;
  const rr = RARITIES[it.r!];
  return (
    <div className="lootcard" style={{ borderColor: rarityColor(it.r!) }}>
      <div className="lc-title" style={{ color: rarityColor(it.r!) }}>{rr.glyph} {rr.name} {st.def.name}</div>
      <div className="lc-sub">{st.def.cls.toUpperCase()} · {AMMO_NAMES[st.def.ammo]} ammo · {st.def.blurb}</div>
      <StatRow label="Damage" a={dmg.toFixed(0)} b={cst ? cdmg!.toFixed(0) : undefined} better={cmp(dmg, cdmg)} />
      <StatRow label="Fire rate" a={`${(60 / st.interval).toFixed(0)}/m`} b={cst ? `${(60 / cst.interval).toFixed(0)}` : undefined} better={cmp(1 / st.interval, cst ? 1 / cst.interval : undefined)} />
      <StatRow label="Magazine" a={String(st.mag)} b={cst ? String(cst.mag) : undefined} better={cmp(st.mag, cst?.mag)} />
      <StatRow label="DPS" a={effectiveDps(st).toFixed(0)} b={cst ? effectiveDps(cst).toFixed(0) : undefined} better={cmp(effectiveDps(st), cst ? effectiveDps(cst) : undefined)} />
      {it.r! >= 3 && <div className="lc-attach">♛ {st.def.masterwork.name}: {st.def.masterwork.desc}</div>}
      {it.r === 4 && <div className="lc-attach proto">★ {st.def.prototype.name}: {st.def.prototype.desc} · Drawback: {st.def.prototype.drawback}</div>}
      {cst && <div className="lc-vs">vs. equipped {RARITIES[cst.rarity].name} {cst.def.name}</div>}
      <div className="lc-action"><kbd>{ik}</kbd> {needsHold ? `Hold to swap with slot ${swapSlot + 1}` : 'Pick up'}{needsHold && <span className="holdbar"><span style={{ width: `${hold * 100}%` }} /></span>}</div>
    </div>
  );
}

function Crosshair({ st }: { st: HudState }) {
  const y = st.snap!.you;
  const sl = y.slots[y.sel];
  const spread = sl?.kind === 'weapon' ? y.spread : 0.8;
  const px = Math.max(4, Math.min(60, spread * 9 * (90 / getSettings().fov)));
  const hm = st.hitMarkers[st.hitMarkers.length - 1];
  const hmColor = hm ? (hm.kind === 'head' ? '#ffd23d' : hm.kind === 'shield' ? '#4ad8ff' : hm.kind === 'kill' ? '#ff4d6d' : '#ffffff') : '';
  return (
    <div className="crosshair">
      {sl?.kind === 'weapon' && WEAPONS[sl.w].pellets > 1 ? <div className="xh-ring" style={{ width: px * 2, height: px * 2 }} /> : (
        <>
          <i style={{ transform: `translate(-50%, ${-px - 8}px)` }} className="v" />
          <i style={{ transform: `translate(-50%, ${px}px)` }} className="v" />
          <i style={{ transform: `translate(${-px - 8}px, -50%)` }} className="h" />
          <i style={{ transform: `translate(${px}px, -50%)` }} className="h" />
        </>
      )}
      <b className="xh-dot" />
      {hm && <div className={`hitmarker ${hm.broke ? 'broke' : ''}`} style={{ color: hmColor }}>✕</div>}
    </div>
  );
}

export function Hud({ session, onLeave, onResume, onSettings }: { session: GameSession; onLeave: () => void; onResume: () => void; onSettings: () => void }) {
  const st = useHud(session.hud);
  const snap = st.snap;
  if (!snap) return null;
  const y = snap.you;
  const s = getSettings();
  const keys = s.keys;
  const sl = y.slots[y.sel];
  const storm = snap.storm;
  const solo = snap.mode === 'solo';
  const outsideNext = storm.next ? Math.max(0, Math.hypot(y.x - storm.next.x, y.z - storm.next.z) - storm.next.r) : 0;
  const airborne = y.mode === 'freefall' || y.mode === 'glide';
  const dead = !y.alive;
  const showPause = !session.opts.autopilot && !st.locked && st.overlay === 'none' && !st.winner;
  return (
    <div className={`hud ${y.inStorm ? 'in-storm' : ''} ${s.reducedMotion ? 'reduced' : ''}`}>
      {y.inStorm && <div className="storm-vignette" />}
      {/* top-left: kill feed */}
      <div className="feed">
        {st.feed.map((f) => <div key={f.id} className={f.mine ? 'mine' : ''}>{f.text}</div>)}
      </div>
      {/* top-center */}
      <div className="topbar">
        {solo && (
          <div className="counters">
            <span className="alive"><b>{snap.alive}</b> alive</span>
            <span className="elims"><b>{y.kills}</b> elims</span>
          </div>
        )}
        <Compass yaw={st.yaw} marker={snap.marker} me={y} />
      </div>
      {/* top-right: minimap + field */}
      <div className="mapbox">
        <Minimap st={st} />
        {solo && snap.phase !== 'staging' && (
          <div className="fieldinfo">
            <div>{storm.stage === 'wait' ? 'Field shrinks in' : storm.stage === 'shrink' ? 'Closing' : 'Final collapse'} <b>{fmtTime(storm.endsIn)}</b></div>
            <div className="dim">Phase {storm.phase + 1}/{storm.phases} · Storm {storm.damage}/s</div>
            {outsideNext > 0 && y.alive && <div className="warn">{Math.round(outsideNext)}m to next Calmfield</div>}
          </div>
        )}
        {snap.mode === 'practice' && <div className="fieldinfo"><b>Practice Range</b><div className="dim">No storm · items respawn</div></div>}
      </div>
      {/* staging / insertion panel */}
      {snap.phase === 'staging' && (
        <div className="banner">
          <div className="b-title">Staging Pier</div>
          <div>Skiff departs in <b>{fmtTime(snap.phaseLeft)}</b> · {snap.total} seats filled ({snap.total - 1} bots)</div>
          <div className="dim">Movement & equipment practice — no damage. Racks do not carry into the match. <kbd>{keyName(keys.ready)}</kbd> ready up</div>
        </div>
      )}
      {y.mode === 'skiff' && snap.skiff && (
        <div className="banner">
          <div className="b-title">Transit Skiff</div>
          {snap.skiff.jumpOpen ? <div><kbd>{keyName(keys.jump)}</kbd> Jump — place a marker with <kbd>{keyName(keys.map)}</kbd></div> : <div className="dim">Jump opens over The Highwake…</div>}
          <div className="dim">Auto-ejects at the far shore</div>
        </div>
      )}
      {airborne && (
        <div className="alt">
          <div className="alt-v">{Math.round(y.agl)}<small>m</small></div>
          <div>{y.mode === 'glide' ? 'Wing-sail deployed' : `Freefall · auto-deploy at ${MOVE.glideAutoDeploy}m`}</div>
          <div className="dim">{y.mode === 'freefall' ? <><kbd>{keyName(keys.deploy)}</kbd> deploy now · look down + <kbd>{keyName(keys.forward)}</kbd> to dive</> : <>W faster · S brake · <kbd>{keyName(keys.freelook)}</kbd> free-look</>}</div>
        </div>
      )}
      {y.mode === 'air' && y.canGlide && <div className="alt"><div className="dim"><kbd>{keyName(keys.deploy)}</kbd> Deploy wing-sail</div></div>}
      {/* centre */}
      {!dead && y.mode !== 'skiff' && <Crosshair st={st} />}
      <div className="hurts">
        {st.hurts.map((h) => <div key={h.id} className={`hurt ${h.shield ? 'shield' : ''}`} style={{ transform: `translate(-50%,-50%) rotate(${h.angle}rad)`, opacity: 1 - (st.now - h.t) / 1.2 }} />)}
      </div>
      {s.soundViz && (
        <div className="sounds">
          {st.sounds.map((so) => (
            <div key={so.id} className={`snd ${so.near ? 'near' : ''}`} style={{ transform: `translate(-50%,-50%) rotate(${so.angle}rad) translateY(-150px) rotate(${-so.angle}rad)`, opacity: 1 - (st.now - so.t) / 1.2 }}>
              {so.label === 'Gunfire' ? '✸' : so.label === 'Footsteps' ? '⋯' : '◌'}<small>{so.label}</small>
            </div>
          ))}
        </div>
      )}
      {s.captions && st.sounds.length > 0 && (
        <div className="captions">{[...new Set(st.sounds.map((so) => `[${so.label} ${dirName(so.angle)}]`))].slice(-3).join('  ')}</div>
      )}
      <div className="dmgnums">
        {st.damageNums.map((d) => <span key={d.id} className={`dn ${d.kind}`} style={{ left: d.x, top: d.y, opacity: 1 - d.age / 0.9 }}>{d.amt}</span>)}
      </div>
      {!dead && <div className="center-low">
        <PickupPrompt snap={snap} />
        {y.use && <div className="usebar"><span>{ITEMS[y.use.id].name}</span><div><i style={{ width: `${(1 - y.use.left / y.use.total) * 100}%` }} /></div></div>}
        {y.reloadLeft > 0 && <div className="usebar reload"><span>Reloading</span><div><i style={{ width: `${(1 - y.reloadLeft / Math.max(0.01, y.reloadTotal)) * 100}%` }} /></div></div>}
        {y.chargeLeft > 0 && <div className="usebar charge"><span>Charging rail</span></div>}
      </div>}
      <div className="toasts">
        {st.toasts.map((t) => <div key={t.id} className={`toast ${t.rarity === -1 ? 'deny' : t.rarity === -2 ? 'storm' : ''}`} style={t.rarity > 0 ? { borderColor: rarityColor(Math.min(4, t.rarity)) } : undefined}>{t.text}</div>)}
      </div>
      {/* bottom-left: vitals */}
      {!dead && (
        <div className="vitals">
          <div className="bar reserve" title="Reserve Shield"><i style={{ width: `${(y.reserve / RESERVE_MAX) * 100}%` }} /><span>RESERVE {Math.ceil(y.reserve)}</span></div>
          <div className={`bar aegis ${y.aegisRecharging ? 'charging' : ''}`} title="Aegis (recharges after 8s)"><i style={{ width: `${(y.aegis / AEGIS_MAX) * 100}%` }} /><span>AEGIS {Math.ceil(y.aegis)}</span></div>
          <div className={`bar health ${y.health < 30 ? 'low' : ''}`}><i style={{ width: `${(y.health / HEALTH_MAX) * 100}%` }} /><span>HEALTH {Math.ceil(y.health)}</span></div>
          <div className="stamina"><i style={{ width: `${(y.stamina / MOVE.staminaMax) * 100}%` }} /></div>
          <div className="modeline dim">{modeLabel(y.mode, y.crouch, y.slide, y.sprinting)}</div>
        </div>
      )}
      {/* bottom-right: slots + ammo */}
      {!dead && (
        <div className="slots">
          {sl?.kind === 'weapon' && (
            <div className="ammo-main">
              <b>{sl.mag}</b><span>/ {y.ammo[WEAPONS[sl.w].ammo]}</span>
              <small>{AMMO_NAMES[WEAPONS[sl.w].ammo]}</small>
            </div>
          )}
          <div className="slotrow">
            {y.slots.map((x, i) => (
              <div key={i} className={`slot ${i === y.sel ? 'sel' : ''}`} style={x?.kind === 'weapon' ? { borderColor: rarityColor(x.r) } : undefined}>
                <span className="key">{i + 1}</span>
                <SlotIcon slot={x} />
                {x?.kind === 'weapon' && <span className="mag">{x.mag}</span>}
              </div>
            ))}
          </div>
          <div className="ammorow">
            {AMMO_TYPES.map((a) => <span key={a} className={`am am-${a}`}>{AMMO_NAMES[a][0]} {y.ammo[a]}</span>)}
          </div>
          <div className="hint dim"><kbd>{keyName(keys.inventory)}</kbd> inventory · <kbd>{keyName(keys.map)}</kbd> map</div>
        </div>
      )}
      {snap.mode === 'practice' && (
        <div className="practice">
          <div className="b-title">Range Data</div>
          <div>Last hit <b>{st.practice?.last ?? 0}</b> · 3s DPS <b>{st.practice?.dps ?? 0}</b></div>
          <div>Total <b>{st.practice?.total ?? 0}</b> · Hits <b>{st.practice?.hits ?? 0}</b></div>
          {sl?.kind === 'weapon' && <WeaponAdvanced w={sl.w} r={sl.r} />}
          <div className="dim">Racks: all 9 weapons, 8 items, ammo. Course: mantle blocks, ascender tower, zipline, air vent, swim pool.</div>
        </div>
      )}
      {dead && solo && !st.winner && (
        <div className="spectate">
          <div className="b-title">Eliminated · #{y.placement}</div>
          {snap.spectating ? <div>Spectating <b>{snap.spectating.name}</b> · HP {snap.spectating.health} · Shield {snap.spectating.shield}</div> : <div className="dim">Finding a player to follow…</div>}
          <div className="row">
            <button onClick={onLeave}>Leave to results</button>
            <span className="dim">Click to capture the mouse, then LMB: next player</span>
          </div>
        </div>
      )}
      {st.winner && (
        <div className="winner">
          <div className="w-big">{st.winner === y.name && y.alive ? 'LAST ONE STANDING' : `${st.winner} wins`}</div>
          <div className="dim">The Highwake is quiet again…</div>
        </div>
      )}
      {showPause && !dead && (
        <div className="pause">
          <div className="pause-card">
            <div className="b-title">{snap.mode === 'practice' ? 'Practice Range' : 'Paused (local match)'}</div>
            <button className="primary" onClick={onResume}>Resume</button>
            <button onClick={onSettings}>Settings</button>
            <button onClick={onLeave}>{snap.mode === 'practice' ? 'Leave Practice' : 'Forfeit & leave'}</button>
            <div className="dim small">Click Resume to capture the mouse. WASD move · Mouse aim · LMB fire · RMB aim · Shift sprint · Ctrl crouch/slide · Space jump/mantle · E interact · R reload · 1–5 slots · G throw · X shoulder · Z wing-sail · Tab inventory · M map</div>
          </div>
        </div>
      )}
      {s.showFps && <div className="fps">{st.fps} fps</div>}
    </div>
  );
}

function dirName(a: number) {
  let d = ((a * 180) / Math.PI) % 360;
  if (d < 0) d += 360;
  const names = ['ahead', 'ahead-right', 'right', 'behind-right', 'behind', 'behind-left', 'left', 'ahead-left'];
  return names[Math.round(d / 45) % 8];
}

function modeLabel(mode: string, crouch: boolean, slide: boolean, sprint: boolean) {
  if (slide) return 'Sliding';
  if (mode === 'ground') return crouch ? 'Crouched' : sprint ? 'Sprinting' : '';
  return ({ swim: 'Swimming (sidearm only)', zip: 'Zipline — Space to dismount', ascend: 'Ascending', mantle: 'Mantling', grapple: 'Grappling', air: '' } as Record<string, string>)[mode] ?? '';
}

export function WeaponAdvanced({ w, r }: { w: WeaponId; r: number }) {
  const st = weaponStats(w, r as 0);
  return (
    <div className="adv">
      <div>{RARITIES[r].glyph} {RARITIES[r].name} {st.def.name}</div>
      <div>Dmg {st.damage.toFixed(1)}{st.def.pellets > 1 ? ` ×${st.def.pellets}` : ''} · Head ×{st.headMult} · Limb ×{st.def.limbMult}</div>
      <div>RPM {(60 / st.interval).toFixed(0)} · Mag {st.mag} · Reload {(st.reload + st.perShell * st.mag).toFixed(2)}s</div>
      <div>{st.projectile ? `Projectile ${st.projectile.speed.toFixed(0)} m/s, drop ${st.projectile.gravity}` : `Falloff ${st.falloffStart}–${st.falloffEnd}m → ×${st.def.falloffMin}`}</div>
      <div>Spread hip {st.hipSpread.toFixed(2)}° / ADS {st.adsSpread.toFixed(2)}° · Bloom +{st.bloomPerShot.toFixed(2)}°</div>
      <div>Sustained DPS {effectiveDps(st).toFixed(0)}</div>
    </div>
  );
}
