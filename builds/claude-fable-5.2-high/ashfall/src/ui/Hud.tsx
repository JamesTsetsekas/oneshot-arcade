import { useEffect, useRef } from 'react';
import { SKILL } from '../abilities/skills';
import { game } from '../app-shell/game';
import { CELL } from '../entity-combat/types';
import type { Session } from '../game-session/session';
import { POTIONS } from '../items/content';
import { QUEST, QUEST_DONE } from '../progression/quests';
import { keyName, useUi } from './store';
import { SkillTip, Tip } from './widgets';

/** Automap drawn in the same 45° orientation as the camera. Only discovered cells are ever drawn. */
export function drawMap(ctx: CanvasRenderingContext2D, s: Session, W: number, H: number, k: number): void {
  const z = s.zone, p = s.player;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.setTransform(k, -k, -k, -k, W / 2 - k * (p.x - p.y), H / 2 + k * (p.x + p.y));
  for (let cy = 0; cy < z.h; cy++) for (let cx = 0; cx < z.w; cx++) {
    const i = cy * z.w + cx;
    if (!z.discovered[i]) continue;
    const c = z.cells[i];
    if (c === 1) {
      const edge = (cx > 0 && z.cells[i - 1] !== 1) || (cx < z.w - 1 && z.cells[i + 1] !== 1) || (cy > 0 && z.cells[i - z.w] !== 1) || (cy < z.h - 1 && z.cells[i + z.w] !== 1);
      if (!edge) continue;
      ctx.fillStyle = 'rgba(20,18,16,0.85)';
    } else ctx.fillStyle = c === 2 ? 'rgba(160,122,52,0.9)' : c === 3 ? 'rgba(96,90,82,0.75)' : 'rgba(168,160,146,0.55)';
    ctx.fillRect(cx * CELL, cy * CELL, CELL + 0.05, CELL + 0.05);
  }
  const seen = (x: number, y: number) => z.discovered[Math.floor(y / CELL) * z.w + Math.floor(x / CELL)] === 1;
  const mark = (x: number, y: number, color: string, shape: 'd' | 's' | 'c', size = 1.6) => {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = color; ctx.strokeStyle = '#000'; ctx.lineWidth = 0.25;
    ctx.beginPath();
    if (shape === 'c') ctx.arc(0, 0, size * 0.6, 0, 7); else if (shape === 's') ctx.rect(-size / 2, -size / 2, size, size); else { ctx.rotate(Math.PI / 4); ctx.rect(-size / 2, -size / 2, size, size); }
    ctx.fill(); ctx.stroke(); ctx.restore();
  };
  for (const it of z.inter) {
    if (it.state < 0 || !seen(it.x, it.y)) continue;
    if (it.type === 'waypoint') mark(it.x, it.y, it.state ? '#7fe8ff' : '#3a6a72', 'd', 2.2);
    else if (it.type === 'exit' || it.type === 'portal') mark(it.x, it.y, it.to === 'refuge' || it.key ? '#ffcf7a' : '#a98aff', 's', 2);
    else if (it.type === 'npc' || it.type === 'stash') mark(it.x, it.y, '#f2ecde', 'c', 1.5);
    else if ((it.type === 'chest' || it.type === 'shrine' || it.type === 'lever' || it.type === 'cage') && !it.state) mark(it.x, it.y, it.type === 'shrine' ? '#4fe6cf' : '#e8b93c', 'c', 1.2);
  }
  for (const a of z.actors) if (!a.dead && a.kind === 'enemy' && seen(a.x, a.y) && (a.boss || a.elite) && Math.hypot(a.x - p.x, a.y - p.y) < 40) mark(a.x, a.y, a.boss ? '#ff4a3a' : '#ff9a4a', 'd', a.boss ? 2.6 : 1.6);
  if (s.hero.echo && s.hero.echo.zone === z.id) mark(s.hero.echo.x, s.hero.echo.y, '#4fe6cf', 'd', 2);
  // Quest objective marker (only once its location has been discovered).
  const q = s.hero.quest, lm = z.landmarks;
  const obj = z.id === 'march' ? (q <= 2 ? lm.waypoint : q === 3 ? lm.boss : q === 4 ? lm.cage : q === 6 ? lm.exitNext : undefined) : z.id.startsWith('archive') ? (z.id === 'archive3' ? lm.boss : lm.exitNext) : undefined;
  if (obj && seen(obj.x, obj.y) && q < QUEST_DONE) { ctx.save(); ctx.translate(obj.x, obj.y); ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 0.45; ctx.beginPath(); ctx.arc(0, 0, 2.4 + Math.sin(performance.now() / 300) * 0.4, 0, 7); ctx.stroke(); ctx.restore(); }
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.facing); ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 0.3;
  ctx.beginPath(); ctx.moveTo(1.8, 0); ctx.lineTo(-1.1, 1.1); ctx.lineTo(-0.5, 0); ctx.lineTo(-1.1, -1.1); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
export function MapCanvas({ size, scale, cls }: { size: [number, number]; scale: number; cls: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const id = setInterval(() => { const c = ref.current, s = game.session; if (c && s) drawMap(c.getContext('2d')!, s, size[0], size[1], scale); }, 120);
    return () => clearInterval(id);
  }, [size[0], size[1], scale]);
  return <canvas ref={ref} className={cls} width={size[0]} height={size[1]} />;
}
const fmtT = (t: number) => (t >= 60 ? `${Math.floor(t / 60)}m` : t >= 10 ? Math.round(t) + 's' : t.toFixed(1));

export function Hud() {
  const hud = useUi((s) => s.hud);
  const hint = useUi((s) => s.hint);
  const minimap = useUi((s) => s.settings.minimap);
  const keys = useUi((s) => s.settings.keys);
  const banner = useUi((s) => s.banner);
  const toasts = useUi((s) => s.toasts);
  const fps = useUi((s) => s.fps);
  useUi((s) => s.heroVersion);
  const s = game.session;
  if (!hud || !s) return null;
  const hero = s.hero;
  const hpPct = Math.max(0, Math.min(1, hud.hp / hud.hpMax)), fPct = Math.max(0, Math.min(1, hud.focus / hud.focusMax));
  return (
    <div className="hud">
      {banner && <div key={banner.id} className="banner"><div className="banner-main">{banner.text}</div>{banner.sub && <div className="banner-sub">{banner.sub}</div>}</div>}
      {hud.boss && (
        <div className={'bossbar' + (hud.boss.staggered ? ' staggered' : '')}>
          <div className="boss-name">{hud.boss.name}{hud.boss.phase > 1 || hud.boss.name.includes('Engine') ? ` · Phase ${['I', 'II', 'III'][hud.boss.phase - 1]}` : ''}{hud.boss.enrage ? ' · ENRAGED' : ''}{hud.boss.staggered ? ' · STAGGERED' : ''}</div>
          <div className="boss-track"><div className="boss-fill" style={{ width: hud.boss.hp * 100 + '%' }} /><div className="boss-ticks" /></div>
          {hud.boss.armor >= 0 && <div className="boss-sub armor" title="Armor meter: while it holds, damage is heavily reduced. Break it to expose the boss."><div style={{ width: hud.boss.armor * 100 + '%' }} /><span>Armor</span></div>}
          {hud.boss.cast >= 0 && <div className="boss-sub cast"><div style={{ width: hud.boss.cast * 100 + '%' }} /><i style={{ width: hud.boss.castNeed * 100 + '%' }} /><span>Orison — deal damage to break it ({Math.round(hud.boss.castNeed * 100)}%)</span></div>}
          {hud.boss.stagger > 0.02 && hud.boss.cast < 0 && <div className="boss-sub stag"><div style={{ width: hud.boss.stagger * 100 + '%' }} /><span>Stagger</span></div>}
        </div>
      )}
      {hud.target && !hud.boss && <div className="targetframe"><div className="t-name">{hud.target.name} <span>Lv {hud.target.lvl}</span></div><div className="t-track"><div style={{ width: hud.target.hp * 100 + '%' }} /></div>{hud.target.mods.map((m) => <div key={m} className="t-mod">◆ {m}</div>)}{hud.target.desc && <div className="t-desc">{hud.target.desc}</div>}</div>}
      <div className="topright">
        {minimap && <div className="minimap"><MapCanvas size={[190, 190]} scale={1.15} cls="" /><div className="zone-name">{hud.zone}</div></div>}
        <div className="tracker"><div className="tr-title">{hud.quest.title}</div><div className="tr-text">{hud.quest.text}</div></div>
        <div className="buffs">{hud.buffs.map((b) => <div key={b.id} className={'buff ' + (b.good ? 'good' : 'bad')}>{b.label} <span>{fmtT(b.t)}</span></div>)}</div>
      </div>
      <div className="toasts">{toasts.map((t) => <div key={t.id} className={'toast ' + t.kind}>{t.text}</div>)}</div>
      {hud.gate >= 0 && <div className="gatebar"><div style={{ width: hud.gate * 100 + '%' }} /><span>Opening town gate…</span></div>}
      {hud.safe && hud.dps > 1 && <div className="dps">Training readout: {Math.round(hud.dps)} DPS (5 s)</div>}
      {hint && <div className="hint"><span>{hint}</span><button onClick={() => game.skipTutorial()}>Skip tutorial</button></div>}
      <div className="bottom">
        <div className="orb hp" title={`Health ${Math.round(hud.hp)} / ${hud.hpMax}`}>
          <div className="orb-fill" style={{ height: hpPct * 100 + '%' }} />
          {hud.guard > 0 && <div className="orb-guard" style={{ height: Math.min(1, hud.guard) * 100 + '%' }} />}
          <div className="orb-text">{Math.round(hud.hp)}<small>/ {hud.hpMax}</small></div>
        </div>
        <div className="center">
          <div className="evade" title={`Evasive step charges (${keyName(keys.evade)})`}>{[0, 1, 2].map((i) => <i key={i} className={i < hud.evade ? 'on' : ''} />)}<span>{keyName(keys.evade)}</span></div>
          <div className="bar">
            <div className="belt">
              {POTIONS.map((p, i) => (
                <Tip key={i} className={'pot' + (hud.belt[i] ? '' : ' empty')} content={() => <div className="tip-card"><div className="tip-name">{p.name}</div><div className="tip-line">{p.desc}</div><div className="tip-dim">{hud.belt[i]} / {hud.beltCap} carried</div></div>}>
                  <div className="pot-fill" style={{ background: p.color }} onClick={() => game.session?.intent({ type: 'potion', slot: i })} />
                  {hud.potionCd[i] > 0 && <div className="cd" style={{ height: Math.min(1, hud.potionCd[i] / 4) * 100 + '%' }} />}
                  <b>{hud.belt[i]}</b><kbd>{keyName(keys['potion' + (i + 1)])}</kbd>
                </Tip>
              ))}
            </div>
            <div className="skills">
              {hud.slots.map((sl, i) => (
                <Tip key={i} className={`slot ${sl.dtype}${sl.id ? '' : ' none'}${sl.ok ? '' : ' no'}`} content={() => (sl.id ? <SkillTip def={SKILL[sl.id]} hero={hero} /> : <div className="tip-card"><div className="tip-dim">Empty slot — learn and assign skills in the Skills panel ({keyName(keys.skills)}).</div></div>)}>
                  <span className="glyph">{sl.icon}</span>
                  {sl.cd > 0 && <div className="cd" style={{ height: sl.cd * 100 + '%' }} />}
                  {sl.cdText && <em>{sl.cdText}</em>}
                  {sl.charges >= 0 && <b>{sl.charges}</b>}
                  <kbd>{sl.key}</kbd>
                </Tip>
              ))}
            </div>
            <div className="menu-btns">
              {([['inventory', 'Inventory', '▦'], ['skills', 'Skills', '✦'], ['character', 'Character', '☗'], ['quests', 'Quests', '❖'], ['map', 'Map', '◎']] as const).map(([id, name, ic]) => (
                <button key={id} title={`${name} (${keyName(keys[id])})`} className={(id === 'skills' || id === 'character') && hud.points > 0 ? 'pulse' : ''} onClick={() => game.togglePanel(id)}>{ic}</button>
              ))}
            </div>
          </div>
          <div className="xp" title={`Level ${hud.level} — ${Math.round(hud.xp * 100)}% to next`}><div style={{ width: hud.xp * 100 + '%' }} /><span>Level {hud.level}{hud.points > 0 ? ` · ${hud.points} unspent point${hud.points > 1 ? 's' : ''}` : ''}</span></div>
        </div>
        <div className="orb focus" title={`Focus ${Math.round(hud.focus)} / ${hud.focusMax}`}>
          <div className="orb-fill" style={{ height: fPct * 100 + '%' }} />
          <div className="orb-text">{Math.round(hud.focus)}<small>Focus</small></div>
          <div className={'resring ' + hero.cls} title={hud.resLabel}><div style={{ width: hud.res * 100 + '%' }} /><span>{hud.resLabel}{hero.cls === 'ranger' && hud.res >= 1 ? ' ✓' : ''}</span></div>
        </div>
      </div>
      <div className="gold">◉ {hud.gold} gold · ◆ {hero.dust} dust <span className="fps">{fps} fps</span></div>
      <div className="qcount">{Math.min(hero.quest, QUEST.length)}/{QUEST.length}</div>
    </div>
  );
}
