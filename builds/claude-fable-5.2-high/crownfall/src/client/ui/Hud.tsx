// client-ui: in-match HUD. Reads the batched HUD store (10 Hz) — never the per-frame world.

import { ReactElement, ReactNode, useEffect, useRef, useState } from 'react';
import { HEROES, MAX_BASIC_RANK, MAX_LEVEL, ULT_LEVELS, describeAbility, describePassive } from '../../shared/heroes';
import { ITEMS, TALENTS } from '../../shared/items';
import type { HeroPublic } from '../../shared/protocol';
import { TEAM_NAMES } from '../../shared/units';
import { audio } from '../audio/audio';
import { GameClient, TUTORIAL_STEPS } from '../game';
import { MINI } from '../render/minimap';
import { getSettings, keyName, setSettings } from '../runtime/persist';
import { hud, useHud } from '../runtime/store';
import { AbilityIcon, Glyph, HeroIcon, ItemIcon, TalentIcon, Tile } from './icons';
import { Shop } from './Shop';

const fmtTime = (t: number): string => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

function Tip({ children, tip, wide }: { children: ReactNode; tip: ReactNode; wide?: boolean }): ReactElement {
  return (
    <div className="tipwrap">
      {children}
      <div className={`tip${wide ? ' wide' : ''}`}>{tip}</div>
    </div>
  );
}

const BUFF_INFO: Record<string, { name: string; glyph: string; color: number; bad?: boolean; desc: string }> = {
  brass: { name: 'Brass Vigor', glyph: 'blade', color: 0xd9a03a, desc: 'Brassmaw buff: bonus attack damage and 15% attack speed.' },
  mist: { name: 'Mist Clarity', glyph: 'vial', color: 0x6fa0e0, desc: 'Mistwarden buff: +10 haste and mana regeneration.' },
  gale: { name: 'Tailwind', glyph: 'guiding_draft', color: 0x7fe0ff, desc: 'Gale Catalyst: +12% move speed out of combat.' },
  forge: { name: 'Sunder', glyph: 'maul', color: 0xff9a4a, desc: 'Forge Catalyst: +20% damage to structures.' },
  colossus: { name: 'Aether Tide', glyph: 'citybreaker', color: 0xff5ad6, desc: 'Aether Colossus: nearby allied minions are empowered; recall takes 4 s.' },
  draught: { name: 'Amber Draught', glyph: 'potion', color: 0xe0a040, desc: 'Restoring health.' },
  phial: { name: 'Spark Phial', glyph: 'phial', color: 0x5aa2ff, desc: 'Restoring mana.' },
  bogskin: { name: 'Bogskin', glyph: 'bogskin', color: 0x6fbf5a, desc: 'Taking reduced damage.' },
  draft: { name: 'Guiding Draft', glyph: 'guiding_draft', color: 0x9be7d8, desc: 'Next ability hit on a hero reveals them.' },
  stone: { name: 'Set in Stone', glyph: 'brannoch', color: 0xc9a25a, desc: 'Bonus armor and ward per stack.' },
  stun: { name: 'Stunned', glyph: 'citybreaker', color: 0xc03a2a, bad: true, desc: 'Cannot act.' },
  root: { name: 'Rooted', glyph: 'anchor_line', color: 0xc03a2a, bad: true, desc: 'Cannot move or dash.' },
  silence: { name: 'Silenced', glyph: 'redaction', color: 0xc03a2a, bad: true, desc: 'Cannot cast abilities.' },
  slow: { name: 'Slowed', glyph: 'fen_claim', color: 0x4a70c0, bad: true, desc: 'Moving slower.' },
  airborne: { name: 'Airborne', glyph: 'hop', color: 0xc03a2a, bad: true, desc: 'Knocked up. Cannot be cleansed.' },
  hush: { name: 'Hushed', glyph: 'hush_field', color: 0x7a5ad0, bad: true, desc: 'Vision reduced and audio muffled.' },
  parcel: { name: 'Parcel Charge', glyph: 'parcel_charge', color: 0xff8a3c, bad: true, desc: 'A charge is about to detonate on you.' },
  prism: { name: 'Prism Sentence', glyph: 'prism_sentence', color: 0x7fe3ff, bad: true, desc: 'Break line of sight to reduce the strike!' },
  burn: { name: 'Burning', glyph: 'flame', color: 0xff7a4a, bad: true, desc: 'Taking damage over time.' },
  revealed: { name: 'Revealed', glyph: 'hush_field', color: 0xff5ad6, bad: true, desc: 'The enemy team can see you.' },
};

// ---- top bar ----------------------------------------------------------------------------------

function TopBar(): ReactElement | null {
  const teams = useHud((s) => s.teams);
  const time = useHud((s) => Math.floor(s.time));
  const structs = useHud((s) => s.structs);
  const objectives = useHud((s) => s.objectives);
  const viewer = useHud((s) => s.viewer);
  if (!teams) return null;
  const left = viewer;
  const right = (1 - viewer) as 0 | 1;
  const objName: Record<string, string> = { catalystN: 'Gale', catalystS: 'Forge', colossus: 'Colossus' };
  const objGlyph: Record<string, string> = { catalystN: 'guiding_draft', catalystS: 'maul', colossus: 'citybreaker' };
  return (
    <div className="topbar">
      <div className="tb-team ally">
        <span className="tb-name">{TEAM_NAMES[left]}</span>
        <span className="tb-towers" title="Towers standing">
          <Glyph id="tower" size={14} /> {structs.alive[left]}
        </span>
        <span className="tb-kills">{teams[left].kills}</span>
      </div>
      <div className="tb-clock">
        <div className="tb-time">{fmtTime(time)}</div>
        <div className="tb-gold">
          {Math.round((teams[left].gold - teams[right].gold) / 100) / 10 >= 0 ? '+' : ''}
          {(Math.round((teams[left].gold - teams[right].gold) / 100) / 10).toFixed(1)}k gold
        </div>
      </div>
      <div className="tb-team enemy">
        <span className="tb-kills">{teams[right].kills}</span>
        <span className="tb-towers" title="Towers standing">
          <Glyph id="tower" size={14} /> {structs.alive[right]}
        </span>
        <span className="tb-name">{TEAM_NAMES[right]}</span>
      </div>
      <div className="tb-objectives">
        {objectives.map((o) => (
          <Tip key={o.id} tip={<div className="tt-body">{o.id === 'colossus' ? 'Aether Colossus — central pit. Empowers your minions and speeds recall for 150 s.' : o.id === 'catalystN' ? 'Gale Catalyst — north river. Team move speed out of combat for 4 min.' : 'Forge Catalyst — south river. +20% structure damage for 4 min.'}</div>}>
            <div className={`obj ${o.alive ? 'live' : ''}`}>
              <Glyph id={objGlyph[o.id]} size={14} />
              <span>{objName[o.id]}</span>
              <b>{o.alive ? (o.hpPct < 1 ? `${Math.ceil(o.hpPct * 100)}%` : 'LIVE') : fmtTime(o.next)}</b>
            </div>
          </Tip>
        ))}
      </div>
    </div>
  );
}

// ---- feed, announcements, toast -----------------------------------------------------------------

function Feed(): ReactElement {
  const feed = useHud((s) => s.feed);
  const viewer = useHud((s) => s.viewer);
  return (
    <div className="feed">
      {feed.map((f) =>
        f.kind === 'kill' ? (
          <div key={f.id} className={`feed-item ${f.team === viewer ? 'good' : 'bad'}`}>
            {f.killer ? <HeroIcon id={f.killer} size={22} /> : <Glyph id="tower" size={18} />}
            <span>{f.killerName}</span>
            <Glyph id="skull" size={14} />
            {f.victim && <HeroIcon id={f.victim} size={22} />}
            <span>{f.victimName}</span>
            {!!f.assists && <em>+{f.assists} assist</em>}
          </div>
        ) : (
          <div key={f.id} className={`feed-item info ${f.team === 2 ? '' : f.team === viewer ? 'good' : 'bad'}`}>
            {f.text}
          </div>
        ),
      )}
    </div>
  );
}

function Banner(): ReactElement | null {
  const a = useHud((s) => s.announce);
  if (!a) return null;
  return (
    <div key={a.at} className={`banner ${a.tone}`} role="status" aria-live="polite">
      {a.msg}
    </div>
  );
}

function Toast(): ReactElement | null {
  const t = useHud((s) => s.toast);
  if (!t) return null;
  return (
    <div key={t.at} className="toast" role="status">
      {t.msg}
    </div>
  );
}

// ---- ability bar --------------------------------------------------------------------------------

function CdOverlay({ left, max }: { left: number; max: number }): ReactElement | null {
  if (left <= 0.05) return null;
  const pct = Math.min(100, (left / Math.max(0.1, max)) * 100);
  return (
    <div className="cd" style={{ background: `conic-gradient(#0009 ${pct}%, #0000 0)` }}>
      <span>{left >= 10 ? Math.ceil(left) : left.toFixed(1)}</span>
    </div>
  );
}

function canRank(lvl: number, ranks: number[], slot: number): boolean {
  if (slot === 3) return ranks[3] < ULT_LEVELS.filter((l) => lvl >= l).length;
  return ranks[slot] < MAX_BASIC_RANK && ranks[slot] < Math.ceil(lvl / 2);
}

function AbilityBar({ client }: { client: GameClient }): ReactElement | null {
  const you = useHud((s) => s.you);
  const self = useHud((s) => s.self);
  const heroId = useHud((s) => s.heroId);
  const aiming = useHud((s) => s.aiming);
  if (!you) return null;
  const def = HEROES[heroId];
  const keys = getSettings().keys;
  const hp = self?.hp ?? 0;
  const mhp = self?.mhp ?? 1;
  const sh = self?.sh ?? 0;
  const mp = self?.mp ?? 0;
  const mmp = self?.mmp ?? 0;
  const total = Math.max(mhp, hp + sh);
  const xpPct = you.lvl >= MAX_LEVEL ? 100 : ((you.xp - you.xpPrev) / Math.max(1, you.xpNext - you.xpPrev)) * 100;
  const slotKeys = [keys.q, keys.w, keys.e, keys.r];
  return (
    <div className="abar">
      <div className="slots">
        <Tip
          wide
          tip={
            <>
              <div className="tt-title">{def.passive.name} · Passive</div>
              <div className="tt-body">{describePassive(def, you.lvl)}</div>
            </>
          }
        >
          <div className="slot passive">
            <Tile glyph={heroId} color={def.color} size={40} round />
            <div className="pmeter">
              <div style={{ width: `${Math.round(you.passive * 100)}%` }} />
            </div>
          </div>
        </Tip>
        {def.abilities.map((a, i) => {
          const rank = you.ranks[i];
          const cost = a.cost[Math.max(0, Math.min(a.cost.length - 1, rank - 1))];
          const noMana = rank > 0 && mp < cost;
          const rankable = you.skillPts > 0 && canRank(you.lvl, you.ranks, i);
          return (
            <div className="slotcol" key={a.id}>
              {rankable && (
                <button
                  className="rankup"
                  title={`Rank up ${a.name} (Shift+${a.key})`}
                  onClick={() => {
                    client.send({ t: 'rank', slot: i });
                    audio.play('ui');
                  }}
                >
                  +
                </button>
              )}
              <Tip
                wide
                tip={
                  <>
                    <div className="tt-title">
                      {a.name} <span className="tt-key">{keyName(slotKeys[i])}</span>
                      {a.ult && <span className="tt-ult">ULTIMATE</span>}
                    </div>
                    <div className="tt-meta">
                      {rank > 0 ? `Rank ${rank}` : 'Not learned'} · Cost {a.cost.join('/')} {def.resource} · Cooldown {a.cd.join('/')} s{a.range > 0 ? ` · Range ${a.range} m` : ''}
                    </div>
                    <div className="tt-body">{describeAbility(a, rank)}</div>
                    {rank < (a.ult ? 2 : 4) && <div className="tt-next">All ranks: {describeAbility(a, 0)}</div>}
                  </>
                }
              >
                <button className={`slot ability ${aiming === i ? 'aiming' : ''} ${you.recast[i] ? 'recast' : ''} ${a.ult ? 'ult' : ''}`} onClick={() => client.input.beginCast(i)}>
                  <AbilityIcon hero={heroId} slot={i} size={54} dim={rank === 0 || !you.alive} />
                  {noMana && <div className="nomana" />}
                  <CdOverlay left={you.recast[i] ? 0 : you.cds[i]} max={you.cdMax[i]} />
                  <kbd>{keyName(slotKeys[i])}</kbd>
                  <div className="pips">
                    {Array.from({ length: a.ult ? 2 : 4 }, (_, k) => (
                      <b key={k} className={k < rank ? 'on' : ''} />
                    ))}
                  </div>
                </button>
              </Tip>
            </div>
          );
        })}
        <div className="sep" />
        {you.talents.map((tid, i) => {
          const t = TALENTS[tid];
          return (
            <Tip
              key={tid}
              tip={
                <>
                  <div className="tt-title">
                    {t.name} <span className="tt-key">{keyName(i === 0 ? keys.d : keys.f)}</span>
                  </div>
                  <div className="tt-meta">Talent · Cooldown {t.cd} s</div>
                  <div className="tt-body">{t.desc}</div>
                </>
              }
            >
              <button className={`slot talent ${aiming === 4 + i ? 'aiming' : ''}`} onClick={() => client.input.beginCast(4 + i)}>
                <TalentIcon id={tid} size={42} dim={!you.alive} />
                <CdOverlay left={you.cds[4 + i]} max={you.cdMax[4 + i]} />
                <kbd>{keyName(i === 0 ? keys.d : keys.f)}</kbd>
              </button>
            </Tip>
          );
        })}
        <Tip
          tip={
            <>
              <div className="tt-title">
                Ward Trinket <span className="tt-key">{keyName(keys.ward)} / 4</span>
              </div>
              <div className="tt-body">Place a ward at the cursor (6 m). Grants vision for 90 s and sees into the brush it stands in. Two charges.</div>
            </>
          }
        >
          <div className="slot talent">
            <Tile glyph="ward" color={0xc9a25a} size={42} round dim={you.wardCharges === 0} />
            {you.wardCharges === 0 && <CdOverlay left={you.wardCd} max={55} />}
            <kbd>{keyName(keys.ward)}</kbd>
            <em className="count">{you.wardCharges}</em>
          </div>
        </Tip>
        <div className="sep" />
        <div className="items">
          {you.inv.map((s, i) => (
            <div key={i} className="slot item">
              {s ? (
                <Tip
                  tip={
                    <>
                      <div className="tt-title">{ITEMS[s.id].name}</div>
                      <div className="tt-body">
                        {ITEMS[s.id].active?.desc ?? ITEMS[s.id].passive ?? 'Passive stats.'}
                        {ITEMS[s.id].active ? ` (press ${i + 1})` : ''}
                      </div>
                    </>
                  }
                >
                  <button onClick={() => ITEMS[s.id].active && client.send({ t: 'item', slot: i, x: 0, y: 0 })}>
                    <ItemIcon id={s.id} size={34} />
                    <CdOverlay left={you.itemCds[i]} max={ITEMS[s.id].active?.cd ?? 1} />
                    {s.n > 1 && <em className="count">{s.n}</em>}
                  </button>
                </Tip>
              ) : (
                <div className="empty" />
              )}
              <kbd>{i + 1}</kbd>
            </div>
          ))}
        </div>
        <div className="sidebtns">
          <button className={`gold ${you.inFountain ? 'can' : ''}`} onClick={() => hud.set({ shopOpen: !hud.get().shopOpen })} title={`Shop (${keyName(keys.shop)})`}>
            <Glyph id="coin" size={16} color="#ffd24a" />
            <b>{you.gold}</b>
            <kbd>{keyName(keys.shop)}</kbd>
          </button>
          <button className="recall" onClick={() => client.send({ t: 'recall' })} title="Recall to the fountain (7 s channel)">
            <Glyph id="recall" size={15} /> Recall <kbd>{keyName(keys.recall)}</kbd>
          </button>
        </div>
      </div>
      <div className="bars">
        <div className="bar hp">
          <div className="fill" style={{ width: `${(hp / total) * 100}%` }} />
          {sh > 0 && <div className="fill shield" style={{ left: `${(hp / total) * 100}%`, width: `${(sh / total) * 100}%` }} />}
          <span>
            {Math.ceil(hp)} / {mhp}
            {sh > 0 ? ` (+${sh})` : ''}
          </span>
          <i>+{you.stats.hpRegen.toFixed(1)}</i>
        </div>
        <div className={`bar mp ${def.resource === 'Energy' ? 'energy' : ''}`}>
          <div className="fill" style={{ width: `${mmp > 0 ? (mp / mmp) * 100 : 0}%` }} />
          <span>
            {Math.floor(mp)} / {mmp} {def.resource}
          </span>
        </div>
      </div>
      <div className="xp">
        <div style={{ width: `${xpPct}%` }} />
        <span>
          Level {you.lvl}
          {you.lvl < MAX_LEVEL ? ` · ${you.xp - you.xpPrev} / ${you.xpNext - you.xpPrev} XP` : ' · MAX'}
        </span>
      </div>
      {you.recall > 0 && (
        <div className="recallbar">
          <div style={{ width: `${(1 - you.recall / Math.max(0.1, you.recallTotal)) * 100}%` }} />
          <span>Recalling… {you.recall.toFixed(1)}s (taking hero or tower damage cancels)</span>
        </div>
      )}
    </div>
  );
}

// ---- portrait / team frames -------------------------------------------------------------------

function Portrait(): ReactElement | null {
  const you = useHud((s) => s.you);
  const heroId = useHud((s) => s.heroId);
  const heroes = useHud((s) => s.heroes);
  const viewer = useHud((s) => s.viewer);
  if (!you) return null;
  const def = HEROES[heroId];
  const st = you.stats;
  const allies = heroes.filter((h) => h.team === viewer && h.id !== you.id);
  const stat = (label: string, v: number | string, tip: string): ReactElement => (
    <div className="stat" title={tip}>
      <span>{label}</span>
      <b>{v}</b>
    </div>
  );
  return (
    <div className="portrait">
      <div className="allies">
        {allies.map((a) => (
          <div key={a.id} className={`ally ${a.alive ? '' : 'dead'}`}>
            <HeroIcon id={a.hero} size={30} dim={!a.alive} />
            <div className="ally-info">
              <span>
                {a.name} <i>Lv {a.lvl}</i>
              </span>
              <div className="ally-hp">
                <div style={{ width: `${a.alive ? Math.max(0, a.hpPct) * 100 : 0}%` }} />
              </div>
            </div>
            {!a.alive && <b>{a.respawn}s</b>}
          </div>
        ))}
      </div>
      <div className="buffs">
        {you.buffs.map((b) => {
          const info = BUFF_INFO[b.id];
          if (!info) return null;
          return (
            <Tip
              key={b.id}
              tip={
                <>
                  <div className="tt-title">{info.name}</div>
                  <div className="tt-body">{info.desc}</div>
                </>
              }
            >
              <div className={`buff ${info.bad ? 'bad' : ''}`}>
                <Tile glyph={info.glyph} color={info.color} size={26} />
                <span>{b.n > 0 ? `×${b.n}` : b.left > 0 ? Math.ceil(b.left) : ''}</span>
              </div>
            </Tip>
          );
        })}
      </div>
      <div className="pcard">
        <div className="pface">
          <HeroIcon id={heroId} size={58} dim={!you.alive} />
          <b>{you.lvl}</b>
        </div>
        <div className="pinfo">
          <div className="pname">
            {def.name} <span>{def.title}</span>
          </div>
          <div className="stats">
            {stat('AD', st.ad, 'Attack damage')}
            {stat('AP', st.ap, 'Ability power')}
            {stat('AS', st.as.toFixed(2), 'Attacks per second')}
            {stat('ARM', st.armor, `Armor — reduces physical damage by ${Math.round((st.armor / (100 + st.armor)) * 100)}%`)}
            {stat('WRD', st.ward, `Ward — reduces arcane damage by ${Math.round((st.ward / (100 + st.ward)) * 100)}%`)}
            {stat('SPD', st.speed.toFixed(2), 'Move speed (m/s)')}
            {stat('HST', st.haste, 'Haste — shortens cooldowns')}
            {stat('CRT', `${st.crit}%`, 'Critical chance')}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- minimap ------------------------------------------------------------------------------------

function MinimapPanel({ client, canvasRef }: { client: GameClient | null; canvasRef: React.RefObject<HTMLCanvasElement | null> }): ReactElement {
  const locked = useHud((s) => s.camLocked);
  const drag = useRef(false);
  const act = (e: React.MouseEvent, button: number): void => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    client?.minimapAction(((e.clientX - r.left) / r.width) * MINI, ((e.clientY - r.top) / r.height) * MINI, button);
  };
  return (
    <div className="minimap">
      <canvas
        ref={canvasRef}
        onMouseDown={(e) => {
          e.preventDefault();
          drag.current = e.button === 0;
          act(e, e.button);
        }}
        onMouseMove={(e) => drag.current && e.buttons === 1 && act(e, 0)}
        onMouseUp={() => (drag.current = false)}
        onMouseLeave={() => (drag.current = false)}
        onContextMenu={(e) => e.preventDefault()}
      />
      <div className="mini-hint">
        <kbd>{keyName(getSettings().keys.lock)}</kbd> camera {locked ? 'locked' : 'free'} · <kbd>Space</kbd> centre
      </div>
    </div>
  );
}

// ---- scoreboard ---------------------------------------------------------------------------------

export function ScoreTable({ heroes, viewer, selfId, final }: { heroes: HeroPublic[]; viewer: number; selfId: number; final?: boolean }): ReactElement {
  const row = (h: HeroPublic): ReactElement => (
    <tr key={h.id} className={`${h.id === selfId ? 'me' : ''} ${h.alive || final ? '' : 'dead'}`}>
      <td className="who">
        <HeroIcon id={h.hero} size={30} dim={!h.alive && !final} />
        <div>
          <b>{h.name}</b>
          <span>
            {HEROES[h.hero].name}
            {h.bot ? ' · bot' : ''}
          </span>
        </div>
      </td>
      <td>{h.lvl}</td>
      <td className="kda">
        {h.k} / {h.d} / {h.a}
      </td>
      <td>{h.cs}</td>
      <td>
        <div className="its">
          {h.items.map((it, i) => (
            <ItemIcon key={i} id={it} size={22} />
          ))}
        </div>
      </td>
      <td>{(h.gold / 1000).toFixed(1)}k</td>
      <td>{h.dmg}</td>
      <td>{h.sdmg}</td>
      <td>{h.obj}</td>
      <td>{h.wards}</td>
      <td className="bounty">{final ? h.heal : `${h.bounty}g`}</td>
      {!final && <td>{h.alive ? '' : `${h.respawn}s`}</td>}
    </tr>
  );
  const head = (
    <tr>
      <th>Hero</th>
      <th>Lv</th>
      <th>K / D / A</th>
      <th title="Last hits">CS</th>
      <th>Items</th>
      <th>Gold</th>
      <th title="Damage to heroes">Hero dmg</th>
      <th title="Damage to structures">Struct dmg</th>
      <th title="Objective participation">Obj</th>
      <th title="Wards placed">Wards</th>
      <th>{final ? 'Healing' : 'Bounty'}</th>
      {!final && <th>Respawn</th>}
    </tr>
  );
  return (
    <div className="scoretables">
      {[viewer, 1 - viewer].map((t) => (
        <div key={t} className={`scoreteam ${t === viewer ? 'st-ally' : 'st-enemy'}`}>
          <h3>{TEAM_NAMES[t]}</h3>
          <table>
            <thead>{head}</thead>
            <tbody>{heroes.filter((h) => h.team === t).map(row)}</tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function Scoreboard(): ReactElement | null {
  const open = useHud((s) => s.scoreOpen);
  const heroes = useHud((s) => s.heroes);
  const viewer = useHud((s) => s.viewer);
  const selfId = useHud((s) => s.you?.id ?? 0);
  if (!open) return null;
  return (
    <div className="scoreboard panel">
      <ScoreTable heroes={heroes} viewer={viewer} selfId={selfId} />
      <div className="hintline">Latency: local authoritative worker · Bounty is the gold awarded for a kill (shown for both teams)</div>
    </div>
  );
}

// ---- death recap ----------------------------------------------------------------------------------

function DeathOverlay(): ReactElement | null {
  const you = useHud((s) => s.you);
  if (!you || you.alive) return null;
  const agg = new Map<string, { src: string; label: string; amount: number; type: number; n: number }>();
  for (const r of you.recap ?? []) {
    const k = r.src + r.label;
    const e = agg.get(k) ?? { src: r.src, label: r.label, amount: 0, type: r.type, n: 0 };
    e.amount += r.amount;
    e.n++;
    agg.set(k, e);
  }
  const rows = [...agg.values()].sort((a, b) => b.amount - a.amount).slice(0, 6);
  const total = rows.reduce((a, r) => a + r.amount, 0) || 1;
  return (
    <div className="death panel">
      <div className="death-title">You were felled</div>
      <div className="death-timer">Respawning in {Math.ceil(you.respawn)}s</div>
      <div className="recap">
        <div className="recap-h">Damage in the final 8 seconds</div>
        {rows.map((r, i) => (
          <div key={i} className="recap-row">
            <span className="rsrc">{r.src}</span>
            <span className="rlabel">
              {r.label}
              {r.n > 1 ? ` ×${r.n}` : ''}
            </span>
            <div className="rbar">
              <div className={`t${r.type}`} style={{ width: `${(r.amount / total) * 100}%` }} />
            </div>
            <b>{r.amount}</b>
          </div>
        ))}
        {!rows.length && <div className="recap-row">No hero damage recorded.</div>}
      </div>
      <div className="hintline">You can shop while dead — press P.</div>
    </div>
  );
}

// ---- tutorial / practice ---------------------------------------------------------------------------

function TutorialPanel(): ReactElement | null {
  const mode = useHud((s) => s.mode);
  const done = useHud((s) => s.tutorial);
  const [hidden, setHidden] = useState(false);
  if (mode !== 'tutorial' || hidden || !getSettings().tutorialHints) return null;
  const current = TUTORIAL_STEPS.find((s) => !done[s.id]);
  return (
    <div className="tutorial panel">
      <div className="tut-h">
        <b>Tutorial</b>
        <button onClick={() => setHidden(true)} title="Hide tutorial hints">
          ×
        </button>
      </div>
      {current ? <div className="tut-hint">{current.hint}</div> : <div className="tut-hint">All lessons complete! Break a Seal, destroy both Core Towers, then the Crown Engine to win.</div>}
      <ul>
        {TUTORIAL_STEPS.map((s) => (
          <li key={s.id} className={done[s.id] ? 'done' : s === current ? 'cur' : ''}>
            <i>{done[s.id] ? '✓' : '○'}</i> {s.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PracticePanel({ client }: { client: GameClient }): ReactElement | null {
  const mode = useHud((s) => s.mode);
  const scale = useHud((s) => s.timeScale);
  if (mode !== 'practice') return null;
  return (
    <div className="practice panel">
      <b>Practice tools</b>
      <div className="row">
        <button onClick={() => client.send({ t: 'cheat', kind: 'gold' })}>+1000 gold</button>
        <button onClick={() => client.send({ t: 'cheat', kind: 'level' })}>+1 level</button>
        <button onClick={() => client.send({ t: 'cheat', kind: 'refresh' })}>Reset cooldowns</button>
        <button onClick={() => client.send({ t: 'cheat', kind: 'heal' })}>Full heal</button>
      </div>
      <div className="row">
        <span>Speed</span>
        {[0.5, 1, 2, 4].map((s) => (
          <button key={s} className={Math.abs(scale - s) < 0.01 ? 'on' : ''} onClick={() => client.setTimeScale(s)}>
            {s}×
          </button>
        ))}
      </div>
      <div className="hintline">Hold Alt to show your attack range.</div>
    </div>
  );
}

// ---- pause menu -------------------------------------------------------------------------------------

function PauseMenu({ client, onLeave }: { client: GameClient; onLeave: () => void }): ReactElement | null {
  const open = useHud((s) => s.menuOpen);
  const [, force] = useState(0);
  if (!open) return null;
  const st = getSettings();
  const vol = (k: 'master' | 'music' | 'sfx'): ReactElement => (
    <label>
      {k[0].toUpperCase() + k.slice(1)}
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={st[k]}
        onChange={(e) => {
          const s = setSettings({ [k]: Number(e.target.value) });
          audio.setVolumes(s.master, s.music, s.sfx);
          force((n) => n + 1);
        }}
      />
    </label>
  );
  return (
    <div className="modal">
      <div className="panel pause">
        <h2>Paused</h2>
        <div className="pgrid">
          {vol('master')}
          {vol('music')}
          {vol('sfx')}
          <label>
            Cast mode
            <select
              value={st.castMode}
              onChange={(e) => {
                setSettings({ castMode: e.target.value as typeof st.castMode });
                force((n) => n + 1);
              }}
            >
              <option value="indicator">Quick cast with indicator (hold, release)</option>
              <option value="quick">Quick cast (instant)</option>
              <option value="normal">Normal cast (press, then click)</option>
            </select>
          </label>
        </div>
        <div className="controls">
          <b>Controls</b>
          <p>
            Right-click move / attack · A + click attack-move · Q W E R abilities · Shift+QWER rank up · D F talents · T or 4 ward · 1–6 items · B recall · P shop · S stop · H hold · Tab scoreboard · Y camera lock · Space centre · Arrows / edge / middle-drag pan · Wheel zoom · G ping · Alt show range · Esc cancel /
            pause
          </p>
        </div>
        <div className="row">
          <button className="primary" onClick={() => client.toggleMenu()}>
            Resume
          </button>
          <button onClick={onLeave}>Leave match</button>
        </div>
      </div>
    </div>
  );
}

function EndBanner(): ReactElement | null {
  const over = useHud((s) => s.over);
  const viewer = useHud((s) => s.viewer);
  if (!over) return null;
  const won = over.winner === viewer;
  return (
    <div className={`endbanner ${won ? 'win' : 'lose'}`}>
      <div>{won ? 'VICTORY' : 'DEFEAT'}</div>
      <span>{won ? 'The enemy Crown Engine is destroyed' : 'Your Crown Engine has fallen'}</span>
    </div>
  );
}

function TowerWarning(): ReactElement | null {
  const warn = useHud((s) => s.towerWarn);
  if (!warn) return null;
  return <div className="towerwarn">TOWER IS TARGETING YOU</div>;
}

/** First-minute guidance outside the tutorial: what to do before the first wave arrives. */
function StartHint(): ReactElement | null {
  const time = useHud((s) => Math.floor(s.time));
  const you = useHud((s) => s.you);
  const mode = useHud((s) => s.mode);
  const heroId = useHud((s) => s.heroId);
  if (!you || mode === 'tutorial' || time > 75) return null;
  const noItem = you.inv.every((s) => !s);
  const jungler = HEROES[heroId].builds.lane === 'jungle';
  let msg: string;
  if (noItem && you.inFountain) msg = `Press ${keyName(getSettings().keys.shop)} to open the shop and buy a starter item`;
  else if (you.skillPts > 0) msg = 'Click + above an ability (or Shift+Q) to learn it';
  else if (jungler) msg = 'You are a jungler: clear the camps in your mistwood (first spawn 0:40), then help a lane';
  else msg = 'Walk to either lane (right-click) — your allied bots cover the other. Waves arrive at 0:15';
  return <div className="starthint">{msg}</div>;
}

function Perf(): ReactElement {
  const fps = useHud((s) => s.fps);
  const dc = useHud((s) => s.drawCalls);
  const link = useHud((s) => s.link);
  return (
    <div className="perf">
      {fps} fps · {dc} draws · sim: {link}
    </div>
  );
}

export function Hud({ client, minimapRef, onLeave }: { client: GameClient | null; minimapRef: React.RefObject<HTMLCanvasElement | null>; onLeave: () => void }): ReactElement {
  const aiming = useHud((s) => s.aiming);
  const amove = useHud((s) => s.amove);
  const shop = useHud((s) => s.shopOpen);
  const scale = getSettings().uiScale;
  useEffect(() => {
    document.documentElement.style.setProperty('--ui-scale', String(scale));
  }, [scale]);
  return (
    <div className="hud">
      <TopBar />
      <Feed />
      <Banner />
      <TowerWarning />
      <StartHint />
      <TutorialPanel />
      <Scoreboard />
      <DeathOverlay />
      <EndBanner />
      <Toast />
      {(aiming >= 0 || amove) && <div className="aimhint">{amove ? 'Attack-move: left-click a location or enemy · right-click to cancel' : getSettings().castMode === 'indicator' ? 'Release the key (or left-click) to cast · right-click to cancel' : 'Left-click to cast · right-click to cancel'}</div>}
      <Portrait />
      <MinimapPanel client={client} canvasRef={minimapRef} />
      {client && <AbilityBar client={client} />}
      {client && <PracticePanel client={client} />}
      {client && shop && <Shop client={client} />}
      {client && <PauseMenu client={client} onLeave={onLeave} />}
      <Perf />
    </div>
  );
}
