// Scoreboard, tactical map overlay and the post-match analysis screen (timeline, economy chart, player table).

import { UTILITY } from '../content/economy';
import { WEAPONS } from '../content/weapons';
import type { RosterEntry, Snapshot } from '../protocol/schema';
import type { Side } from '../sim/types';
import { el, esc } from './hud';
import { MapDraw, drawMap } from './minimap';

const sideName = (s: Side) => (s === 'cus' ? 'Custodian' : 'Intrusion');

function eqText(r: RosterEntry): string {
  const parts = [r.primary ? WEAPONS[r.primary].name : r.secondary ? WEAPONS[r.secondary].name : 'Pistol'];
  if ((r.armor ?? 0) > 0) parts.push(r.helmet ? 'Vest+Helm' : 'Vest');
  if (r.kit) parts.push('Kit');
  for (const u of r.util ?? []) parts.push(UTILITY[u].name.split(' ')[0]);
  return parts.join(' · ');
}

export class Scoreboard {
  readonly root: HTMLElement;
  private box: HTMLElement;
  private shown = false;
  constructor(parent: HTMLElement) {
    this.root = el('div', 'overlay pass hidden');
    this.box = el('div', 'sb');
    this.root.append(this.box);
    parent.append(this.root);
  }
  show(v: boolean): void { this.shown = v; this.root.classList.toggle('hidden', !v); }
  update(snap: Snapshot): void {
    if (!this.shown) return;
    const roster = snap.roster ?? [];
    const meId = snap.self.id;
    const mySquad = meId < 5 ? 0 : 1;
    const mySide = snap.squadSide[mySquad];
    const buy = snap.phase === 'buy';
    const mk = (squad: 0 | 1): string => {
      const side = snap.squadSide[squad];
      const mine = squad === mySquad;
      const rows = roster.filter((r) => r.squad === squad).sort((a, b) => b.score - a.score || b.kills - a.kills);
      return `<h3 class="${side}-h">${sideName(side)}${mine ? ' (your team)' : ''} — ${snap.score[squad]}</h3>
      <table><thead><tr><th>Player</th>${mine ? `<th style="text-align:left">${buy ? 'Equipment' : 'Equipment'}</th><th>$</th>` : ''}<th>K</th><th>D</th><th>A</th><th>DMG</th><th>HS%</th><th>Plant/Def</th><th>Ping</th></tr></thead><tbody>
      ${rows.map((r) => `<tr class="${r.id === meId ? 'me' : ''}${r.alive ? '' : ' dead'}"><td>${esc(r.name)}${r.controller === 'bot' ? ' <small style="color:var(--dim)">BOT</small>' : ''}</td>${mine ? `<td class="eqcell">${esc(eqText(r))}</td><td style="color:#9dff9a">${r.money !== undefined ? '$' + r.money.toLocaleString() : ''}</td>` : ''}<td>${r.kills}</td><td>${r.deaths}</td><td>${r.assists}</td><td>${r.damage}</td><td>${r.kills ? Math.round((r.headshots / r.kills) * 100) : 0}</td><td>${r.plants}/${r.defuses}</td><td>${r.controller === 'bot' ? '—' : r.ping}</td></tr>`).join('')}
      </tbody></table>`;
    };
    const header = `<div style="display:flex;justify-content:space-between;align-items:baseline"><b style="letter-spacing:.2em;text-transform:uppercase">Aperture Annex · Cipher Breach</b><span style="color:var(--dim);font-size:13px;letter-spacing:.1em">Round ${snap.round} · ${sideName(mySide)} side</span></div>`;
    this.box.innerHTML = header + mk(mySquad) + mk((1 - mySquad) as 0 | 1);
  }
}

export class TacticalMap {
  readonly root: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  open = false;
  constructor(parent: HTMLElement) {
    this.root = el('div', 'overlay pass hidden');
    const box = el('div', 'tacmap');
    this.canvas = el('canvas');
    this.canvas.width = 1152; this.canvas.height = 864;
    this.ctx = this.canvas.getContext('2d')!;
    const cap = el('div', 'cap', 'Tactical map · teammates, the Spike when known, smoke, and only what your team can legally see · <kbd>M</kbd> close');
    box.append(this.canvas, cap);
    this.root.append(box);
    parent.append(this.root);
  }
  show(v: boolean): void { this.open = v; this.root.classList.toggle('hidden', !v); }
  update(d: MapDraw): void { if (this.open) drawMap(this.ctx, this.canvas.width, this.canvas.height, d, true); }
}

export interface EndData {
  snap: Snapshot;
  winnerSquad: 0 | 1 | -1;
  names: string[];
  colors: { cus: string; int: string };
}

export class EndScreen {
  readonly root: HTMLElement;
  onRematch: () => void = () => undefined;
  onMenu: () => void = () => undefined;
  constructor(parent: HTMLElement) {
    this.root = el('div', 'overlay hidden');
    parent.append(this.root);
  }
  hide(): void { this.root.classList.add('hidden'); this.root.innerHTML = ''; }

  show(d: EndData): void {
    const snap = d.snap;
    const mySquad = snap.self.id < 5 ? 0 : 1;
    const won = d.winnerSquad === mySquad;
    const draw = d.winnerSquad === -1;
    const rounds = snap.rounds ?? [];
    const roster = snap.roster ?? [];
    const box = el('div', 'end');
    const head = `<div class="headline"><span class="res ${draw ? '' : won ? 'win' : 'lose'}">${draw ? 'Draw' : won ? 'Victory' : 'Defeat'}</span><span class="sc">${snap.score[mySquad]} : ${snap.score[1 - mySquad]}</span><span style="color:var(--dim);letter-spacing:.12em;text-transform:uppercase;font-size:13px">Cipher Breach · Aperture Annex · ${rounds.length} rounds · unranked (rating hidden)</span></div>`;
    const tl = `<h3 style="letter-spacing:.18em;text-transform:uppercase;font-size:13px;color:var(--dim);margin:14px 0 4px">Round timeline</h3><div class="timeline">${rounds.map((r) => {
      const w = r.winnerSquad === mySquad;
      const icon = r.reason === 'detonated' ? '✹' : r.reason === 'disarmed' ? '✔' : r.reason === 'timeExpired' ? '⏱' : '✖';
      return `<div class="tl ${w ? 'w' : 'l'}" title="${esc(r.reason)}${r.planted ? ' · Cipher armed' : ''}"><span class="rn">R${r.round}</span><span class="ic" style="color:${r.winnerSide === 'cus' ? d.colors.cus : d.colors.int}">${icon}</span>${r.planted ? '<span style="color:var(--accent)">armed</span>' : '&nbsp;'}</div>`;
    }).join('')}</div>`;
    const rows = (squad: 0 | 1): string => {
      const mine = squad === mySquad;
      return roster.filter((r) => r.squad === squad).sort((a, b) => b.score - a.score).map((r) => {
        const acc = r.shots ? Math.round((r.hits / r.shots) * 100) : 0;
        return `<tr class="${r.id === snap.self.id ? 'me' : ''}"><td>${esc(r.name)}</td><td>${r.kills}</td><td>${r.deaths}</td><td>${r.assists}</td><td>${r.damage}</td><td>${r.kills ? Math.round((r.headshots / r.kills) * 100) : 0}%</td><td>${acc}%</td><td>${r.plants}/${r.defuses}</td><td>${r.utilDamage}</td><td>${r.flashed}</td></tr>`;
      }).join('') + (mine ? '' : '');
    };
    const table = (squad: 0 | 1, title: string): string => `<h3 style="letter-spacing:.18em;text-transform:uppercase;font-size:13px;margin:12px 0 4px">${title}</h3><table><thead><tr><th>Player</th><th>K</th><th>D</th><th>A</th><th>DMG</th><th>HS</th><th>ACC</th><th>Plant/Def</th><th>Util DMG</th><th>Flashed</th></tr></thead><tbody>${rows(squad)}</tbody></table>`;
    box.innerHTML = head + tl + `<div class="charts"><div><canvas id="econ-chart" width="720" height="300"></canvas><div style="color:var(--dim);font-size:12px;letter-spacing:.08em;margin-top:4px">Team equipment value at round start (solid) and bank before buying (dashed). Your team is bright; the opponent is dim.</div></div><div>${table(mySquad, 'Your team')}${table((1 - mySquad) as 0 | 1, 'Opponents')}</div></div>
      <div class="row" style="margin-top:18px"><button class="btn primary" id="end-rematch">Play again</button><button class="btn" id="end-menu">Main menu</button></div>`;
    this.root.innerHTML = '';
    this.root.append(box);
    this.root.classList.remove('hidden');
    box.querySelector('#end-rematch')!.addEventListener('click', () => this.onRematch());
    box.querySelector('#end-menu')!.addEventListener('click', () => this.onMenu());
    this.drawChart(box.querySelector('#econ-chart') as HTMLCanvasElement, snap, mySquad, d.colors);
  }

  private drawChart(c: HTMLCanvasElement, snap: Snapshot, mySquad: 0 | 1, colors: { cus: string; int: string }): void {
    const ctx = c.getContext('2d')!;
    const rounds = snap.rounds ?? [];
    const W = c.width, H = c.height, pad = 38;
    ctx.clearRect(0, 0, W, H);
    ctx.font = '12px "Segoe UI", sans-serif';
    if (!rounds.length) return;
    const maxV = Math.max(5000, ...rounds.flatMap((r) => [r.equipValue[0], r.equipValue[1], r.moneyBefore[0], r.moneyBefore[1]])) * 1.1;
    const x = (i: number) => pad + (i / Math.max(1, rounds.length - 1)) * (W - pad * 2);
    const y = (v: number) => H - pad - (v / maxV) * (H - pad * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let g = 0; g <= 4; g++) {
      const v = (maxV / 4) * g;
      ctx.beginPath(); ctx.moveTo(pad, y(v)); ctx.lineTo(W - pad, y(v)); ctx.stroke();
      ctx.fillText('$' + Math.round(v / 1000) + 'k', 4, y(v) + 4);
    }
    rounds.forEach((r, i) => { ctx.fillText('R' + r.round, x(i) - 8, H - 12); });
    const line = (sel: (r: typeof rounds[number]) => number, color: string, dashed: boolean, w: number) => {
      ctx.strokeStyle = color; ctx.lineWidth = w; ctx.setLineDash(dashed ? [5, 4] : []);
      ctx.beginPath();
      rounds.forEach((r, i) => { const px = x(i), py = y(sel(r)); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
      ctx.stroke(); ctx.setLineDash([]);
    };
    // sides by round: use the side that squad played each round
    const colorOf = (squad: 0 | 1, bright: boolean) => {
      const r0 = rounds[0];
      const sideFirst: Side = (squad === r0.winnerSquad ? r0.winnerSide : r0.winnerSide === 'cus' ? 'int' : 'cus');
      void sideFirst;
      return squad === mySquad ? (bright ? '#ffffff' : '#c8d2dc') : (bright ? '#ff7a90' : '#a05a68');
    };
    line((r) => r.equipValue[1 - mySquad], colorOf((1 - mySquad) as 0 | 1, true), false, 2);
    line((r) => r.moneyBefore[1 - mySquad], colorOf((1 - mySquad) as 0 | 1, false), true, 1.4);
    line((r) => r.equipValue[mySquad], colorOf(mySquad, true), false, 2.6);
    line((r) => r.moneyBefore[mySquad], colorOf(mySquad, false), true, 1.6);
    // winners markers
    rounds.forEach((r, i) => {
      ctx.fillStyle = r.winnerSquad === mySquad ? '#6dffd9' : '#ff5d73';
      ctx.fillRect(x(i) - 3, pad - 18, 6, 6);
    });
    void colors;
  }
}
