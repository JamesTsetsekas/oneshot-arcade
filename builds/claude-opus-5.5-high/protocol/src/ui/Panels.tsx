import type { MatchResult, RoundRecord, Side, Snapshot } from '../protocol/messages';
import type { UiState } from '../client/game';
import { WEAPONS } from '../content/weapons';
import { iffColors, type Settings } from '../client/settings';

const REASON_ICON: Record<RoundRecord['reason'], string> = { elimination: '✕', time: '⧗', detonated: '✸', defused: '✓' };
const REASON_TEXT: Record<RoundRecord['reason'], string> = { elimination: 'Team eliminated', time: 'Time expired', detonated: 'Cipher detonated', defused: 'Cipher disarmed' };
const SIDE_NAME: Record<Side, string> = { intrusion: 'Intrusion', custodian: 'Custodians' };

export function RoundStrip({ rounds, myTeam, settings, half }: { rounds: RoundRecord[]; myTeam: number; settings: Settings; half: number }) {
  const iff = iffColors(settings.colorblind);
  return (
    <div className="round-strip">
      {rounds.map((r) => (
        <div
          key={r.round}
          className={`rs ${r.winner === myTeam ? 'w' : 'l'}${r.round === half ? ' half' : ''}`}
          style={{ borderColor: r.winnerSide === 'intrusion' ? iff.intrusion : iff.custodian }}
          title={`Round ${r.round}: ${SIDE_NAME[r.winnerSide]} — ${REASON_TEXT[r.reason]}. ${r.decisive}`}
        >
          <span>{REASON_ICON[r.reason]}</span>
          <small>{r.round}</small>
        </div>
      ))}
    </div>
  );
}

export function Scoreboard({ ui, settings, half }: { ui: UiState; settings: Settings; half: number }) {
  const snap = ui.snap;
  const my = snap.you.team;
  const iff = iffColors(settings.colorblind);
  const rounds = Math.max(1, snap.round - (snap.phase === 'roundEnd' || snap.phase === 'matchEnd' ? 0 : 1));
  const team = (t: 0 | 1) => (
    <table className="sb-table">
      <thead>
        <tr>
          <th style={{ color: snap.teams[t].side === 'intrusion' ? iff.intrusion : iff.custodian }}>
            {SIDE_NAME[snap.teams[t].side]} · {snap.teams[t].score}
          </th>
          <th>K</th>
          <th>D</th>
          <th>A</th>
          <th>ADR</th>
          <th>HS%</th>
          <th>Obj</th>
          <th>{t === my ? 'Money' : ''}</th>
        </tr>
      </thead>
      <tbody>
        {ui.roster
          .filter((p) => p.team === t)
          .sort((a, b) => b.stats.kills - a.stats.kills)
          .map((p) => (
            <tr key={p.id} className={`${p.alive ? '' : 'dead'}${p.id === snap.you.id ? ' me' : ''}`}>
              <td>
                {p.name}
                {p.bot && <span className="bot">BOT</span>}
              </td>
              <td>{p.stats.kills}</td>
              <td>{p.stats.deaths}</td>
              <td>{p.stats.assists}</td>
              <td>{Math.round(p.stats.damage / rounds)}</td>
              <td>{p.stats.kills ? Math.round((p.stats.headshots / p.stats.kills) * 100) : 0}</td>
              <td>{p.stats.plants + p.stats.defuses}</td>
              <td>{p.money !== undefined ? `$${p.money}` : ''}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
  return (
    <div className="overlay sb">
      <div className="sb-title">APERTURE ANNEX · CIPHER BREACH · ROUND {snap.round}</div>
      {team(my)}
      {team(my === 0 ? 1 : 0)}
      <RoundStrip rounds={ui.rounds} myTeam={my} settings={settings} half={half} />
      <div className="dim small">Team damage is off in Unranked. Ping: local room (0 ms).</div>
    </div>
  );
}

function EconomyChart({ result, myTeam, settings }: { result: MatchResult; myTeam: number; settings: Settings }) {
  const W = 620;
  const H = 180;
  const P = 30;
  const rs = result.rounds;
  if (!rs.length) return null;
  const max = Math.max(5000, ...rs.flatMap((r) => r.money));
  const x = (i: number) => P + (i / Math.max(1, rs.length - 1)) * (W - P * 2);
  const y = (v: number) => H - P - (v / max) * (H - P * 2);
  const iff = iffColors(settings.colorblind);
  const line = (t: 0 | 1) => rs.map((r, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(r.money[t]).toFixed(1)}`).join(' ');
  const colorOf = (t: 0 | 1) => (t === myTeam ? '#ffffff' : '#9aa3ad');
  return (
    <svg className="econ" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Team money at the start of each round">
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line x1={P} x2={W - P} y1={y(max * f)} y2={y(max * f)} stroke="rgba(255,255,255,0.1)" />
          <text x={4} y={y(max * f) + 4} fill="#8a939c" fontSize="10">${Math.round((max * f) / 1000)}k</text>
        </g>
      ))}
      {rs.map((r, i) => (
        <rect key={i} x={x(i) - 4} y={H - P + 6} width={8} height={8} fill={r.winnerSide === 'intrusion' ? iff.intrusion : iff.custodian} opacity={r.winner === myTeam ? 1 : 0.45} />
      ))}
      <path d={line(0)} fill="none" stroke={colorOf(0)} strokeWidth={2} />
      <path d={line(1)} fill="none" stroke={colorOf(1)} strokeWidth={2} strokeDasharray="5 4" />
      <text x={W - P - 120} y={14} fill="#fff" fontSize="11">— your team</text>
      <text x={W - P - 120} y={28} fill="#9aa3ad" fontSize="11">- - opponents</text>
    </svg>
  );
}

export function MatchEnd({ ui, settings, onAgain, onMenu, half }: { ui: UiState; settings: Settings; onAgain: () => void; onMenu: () => void; half: number }) {
  const res = ui.result!;
  const my = ui.snap.you.team;
  const won = res.winner === my;
  const draw = res.winner === -1;
  const players = [...res.players].sort((a, b) => (a.team === b.team ? b.stats.kills - a.stats.kills : a.team === my ? -1 : 1));
  const turning = findTurningPoint(res, my);
  return (
    <div className="overlay matchend">
      <div className={`me-title ${draw ? '' : won ? 'win' : 'lose'}`}>{draw ? 'DRAW' : won ? 'VICTORY' : 'DEFEAT'}</div>
      <div className="me-score">
        {res.scores[my]} <span>–</span> {res.scores[my === 0 ? 1 : 0]}
      </div>
      <div className="dim small">
        Match {res.matchId} · {res.rounds.length} rounds · {Math.round(res.durationTicks / 64 / 60)} min · ruleset {res.ruleset} · result signed {res.signature}
      </div>
      {turning && <div className="turning">Turning point — Round {turning.round}: {turning.text}</div>}
      <div className="me-cols">
        <div>
          <div className="eyebrow">ROUND TIMELINE</div>
          <RoundStrip rounds={res.rounds} myTeam={my} settings={settings} half={half} />
          <div className="eyebrow" style={{ marginTop: 14 }}>ECONOMY (team money at round start)</div>
          <EconomyChart result={res} myTeam={my} settings={settings} />
        </div>
        <div className="me-table">
          <table className="sb-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>K</th>
                <th>D</th>
                <th>A</th>
                <th>ADR</th>
                <th>HS%</th>
                <th title="Opening duels won-lost">Open</th>
                <th>Trades</th>
                <th title="Plants / disarms">Obj</th>
                <th title="Utility damage">UD</th>
                <th title="Enemies flashed">EF</th>
                <th>Acc%</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id} className={`${p.team === my ? 'mine' : 'theirs'}${p.id === ui.snap.you.id ? ' me' : ''}`}>
                  <td>{p.name}</td>
                  <td>{p.stats.kills}</td>
                  <td>{p.stats.deaths}</td>
                  <td>{p.stats.assists}</td>
                  <td>{Math.round(p.stats.damage / Math.max(1, res.rounds.length))}</td>
                  <td>{p.stats.kills ? Math.round((p.stats.headshots / p.stats.kills) * 100) : 0}</td>
                  <td>
                    {p.stats.openingKills}-{p.stats.openingDeaths}
                  </td>
                  <td>{p.stats.trades}</td>
                  <td>
                    {p.stats.plants}/{p.stats.defuses}
                  </td>
                  <td>{p.stats.utilityDamage}</td>
                  <td>{p.stats.enemiesFlashed}</td>
                  <td>{p.stats.shots ? Math.round((p.stats.hits / p.stats.shots) * 100) : 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="dim small">Unranked: rating is hidden. Result stored locally in Match History.</div>
        </div>
      </div>
      <div className="row">
        <button className="primary" onClick={onAgain}>Play again</button>
        <button onClick={onMenu}>Main menu</button>
      </div>
    </div>
  );
}

function findTurningPoint(res: MatchResult, my: number): { round: number; text: string } | null {
  // first round after which the eventual winner never trailed again
  if (res.winner === -1) return null;
  let a = 0;
  let b = 0;
  let last = 0;
  for (const r of res.rounds) {
    if (r.winner === 0) a++;
    else b++;
    const lead = res.winner === 0 ? a - b : b - a;
    if (lead <= 0) last = r.round;
  }
  const r = res.rounds.find((x) => x.round === last + 1);
  if (!r) return null;
  return { round: r.round, text: `${r.decisive} (${r.winner === my ? 'your team' : 'opponents'} took the lead for good)` };
}

export function weaponName(id: string): string {
  return id in WEAPONS ? WEAPONS[id as keyof typeof WEAPONS].name : id;
}

export type { Snapshot };
