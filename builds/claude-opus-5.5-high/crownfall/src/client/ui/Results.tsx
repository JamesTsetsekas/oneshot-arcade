// Post-match analysis: result, timeline, gold graph, per-player stats/builds, commendation, progression.
import React, { useState } from 'react';
import type { MatchResult } from '../../protocol/messages';
import { HEROES } from '../../shared/heroes';
import { ItemIcon, Portrait } from './icons';
import { fmtTime } from './Hud';

export function Results({ r, reward, onRequeue, onMenu, onReview }: { r: MatchResult; reward: { xp: number; mastery: number } | null; onRequeue: () => void; onMenu: () => void; onReview: () => void }) {
  const win = r.winner === r.humanTeam;
  const [commend, setCommend] = useState<number | null>(null);
  const maxG = Math.max(1, ...r.goldGraph.map((g) => Math.max(g[1], g[2])));
  const W = 520, H = 140;
  const path = (i: 1 | 2) => r.goldGraph.map((g, k) => `${k ? 'L' : 'M'}${(g[0] / Math.max(1, r.duration)) * W},${H - (g[i] / maxG) * H}`).join(' ');
  const mvp = [...r.score].sort((a, b) => (b.k * 3 + b.a * 1.5 + b.structures * 2 + b.objectives * 2 - b.d) - (a.k * 3 + a.a * 1.5 + a.structures * 2 + a.objectives * 2 - a.d))[0];
  return (
    <div className="screen results">
      <h1 className={win ? 'win' : 'loss'}>{win ? 'Victory' : 'Defeat'}</h1>
      <div className="muted">{r.mode} · {fmtTime(r.duration)} · {r.winner === 0 ? 'Dawn' : 'Dusk'} Guild seized the Crown Engine</div>
      {reward && <div className="reward">+{reward.xp} profile XP · +{reward.mastery} {HEROES[r.score.find((s) => s.slot === 0)!.hero].name} mastery</div>}
      <div className="results-grid">
        <div>
          {[0, 1].map((t) => (
            <table key={t} className={`sb t${t}`}>
              <thead><tr><th colSpan={2}>{t === 0 ? 'Dawn' : 'Dusk'}{r.winner === t ? ' 👑' : ''}</th><th>K/D/A</th><th>CS</th><th>Gold</th><th>Hero dmg</th><th>Taken</th><th>Struct dmg</th><th>Heal</th><th>Wards</th><th>Obj</th><th>Items</th><th>Skills</th><th /></tr></thead>
              <tbody>{r.score.filter((s) => s.team === t).map((s) => (
                <tr key={s.slot} className={s.slot === 0 ? 'me' : ''}>
                  <td><Portrait hero={s.hero} size={32} /></td><td><b>{s.name}</b>{mvp.slot === s.slot && <span className="badge">MVP</span>}<div className="muted small">{HEROES[s.hero].name} · L{s.level}</div></td>
                  <td>{s.k}/{s.d}/{s.a}</td><td>{s.cs}</td><td>{s.gold}</td><td>{s.dmgHeroes}</td><td>{s.dmgTaken}</td><td>{s.dmgStructures}</td><td>{s.healing}</td><td>{s.wardScore}</td><td>{s.objectives}</td>
                  <td className="sb-items">{s.items.map((i, k) => <ItemIcon key={k} id={i} size={22} />)}</td>
                  <td className="small mono">{s.skillOrder.join('')}</td>
                  <td>{s.slot !== 0 && s.team === r.humanTeam && <button className={`btn tiny ${commend === s.slot ? 'on' : ''}`} disabled={commend !== null} onClick={() => setCommend(s.slot)}>{commend === s.slot ? 'Commended' : 'Commend'}</button>}</td>
                </tr>
              ))}</tbody>
            </table>
          ))}
        </div>
        <div className="side">
          <h3>Team gold</h3>
          <svg width={W} height={H + 10} className="graph">
            <path d={path(1)} stroke="#3fb6ff" strokeWidth="2.5" fill="none" />
            <path d={path(2)} stroke="#ff7a3d" strokeWidth="2.5" fill="none" />
          </svg>
          <h3>Timeline</h3>
          <div className="timeline">{r.timeline.map((e, i) => <div key={i} className={`tl t${e.team}`}><span>{fmtTime(e.t)}</span>{e.text}</div>)}</div>
        </div>
      </div>
      <div className="row center">
        <button className="btn primary big" onClick={onRequeue}>Play again</button>
        <button className="btn big" onClick={onReview}>Build review</button>
        <button className="btn big" onClick={onMenu}>Main menu</button>
      </div>
    </div>
  );
}
