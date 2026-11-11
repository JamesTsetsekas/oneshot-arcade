// In-frame HUD: plain DOM, updated directly each frame (no React in the hot
// path). Shows only information present in the client's legal snapshot.

import { UTILITY, TICK_RATE } from '../content/rules';
import { WEAPONS } from '../content/weapons';
import type { GameMap } from '../map/runtime';
import type { GameEvent, Snapshot, SnapPlayer, Side } from '../protocol/messages';
import { iffColors, type Settings } from '../client/settings';

const el = (tag: string, cls: string, parent?: HTMLElement, html = ''): HTMLElement => {
  const e = document.createElement(tag);
  e.className = cls;
  if (html) e.innerHTML = html;
  parent?.appendChild(e);
  return e;
};

const fmtTime = (s: number): string => {
  s = Math.max(0, Math.ceil(s));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const SIDE_NAME: Record<Side, string> = { intrusion: 'INTRUSION', custodian: 'CUSTODIANS' };

export const ITEM_NAME = (id: string): string => {
  if (id in WEAPONS) return WEAPONS[id as keyof typeof WEAPONS].name;
  if (id in UTILITY) return UTILITY[id as keyof typeof UTILITY].name;
  if (id === 'vest') return 'Vest';
  if (id === 'vesthelm') return 'Vest + Helmet';
  if (id === 'kit') return 'Defuse Tool';
  if (id === 'spike') return 'Cipher Spike';
  return id;
};

interface Feed {
  html: string;
  t: number;
  el: HTMLElement;
}

export class Hud {
  readonly root: HTMLElement;
  private settings: Settings;
  private map: GameMap;
  private c = {} as Record<string, HTMLElement>;
  private feed: Feed[] = [];
  private radio: Feed[] = [];
  private dmgLog: Feed[] = [];
  private captions: Feed[] = [];
  private hitT = 0;
  private hitKill = false;
  private hitHead = false;
  private hurtT = 0;
  private dmgDirs: { ang: number; t: number; el: HTMLElement }[] = [];
  private flashT0 = 0;
  private flashDur = 0;
  private flashAmt = 0;
  private bannerUntil = 0;
  private radar: HTMLCanvasElement;
  private radarBase: HTMLCanvasElement;
  private bigMap: HTMLCanvasElement;
  private pulses: { x: number; z: number; wedges: number[]; t: number }[] = [];
  private names = new Map<number, { name: string; team: number }>();
  private lastSnap: Snapshot | null = null;
  time = 0;
  showMap = false;

  constructor(parent: HTMLElement, settings: Settings, map: GameMap) {
    this.settings = settings;
    this.map = map;
    const r = el('div', 'hud', parent);
    this.root = r;
    const c = this.c;
    c.flash = el('div', 'hud-flash', r);
    c.smoke = el('div', 'hud-smoke', r);
    c.hurt = el('div', 'hud-hurt', r);
    c.scope = el('div', 'hud-scope', r, '<div class="scope-h"></div><div class="scope-v"></div>');
    c.top = el('div', 'hud-top', r);
    c.scoreL = el('div', 'score-team left', c.top);
    c.clock = el('div', 'score-clock', c.top);
    c.scoreR = el('div', 'score-team right', c.top);
    c.pipsL = el('div', 'pips left', c.top);
    c.pipsR = el('div', 'pips right', c.top);
    c.phase = el('div', 'hud-phase', r);
    c.banner = el('div', 'hud-banner', r);
    c.feed = el('div', 'hud-feed', r);
    c.radioBox = el('div', 'hud-radio', r);
    c.loc = el('div', 'hud-loc', r);
    c.money = el('div', 'hud-money', r);
    c.vitals = el('div', 'hud-vitals', r);
    c.ammo = el('div', 'hud-ammo', r);
    c.slots = el('div', 'hud-slots', r);
    c.prompt = el('div', 'hud-prompt', r);
    c.progress = el('div', 'hud-progress', r, '<div class="bar"><div class="fill"></div></div><div class="lbl"></div>');
    c.spec = el('div', 'hud-spec', r);
    c.captions = el('div', 'hud-captions', r);
    c.dmglog = el('div', 'hud-dmglog', r);
    c.cross = el('div', 'hud-cross', r);
    c.hit = el('div', 'hud-hit', r, '<i></i><i></i><i></i><i></i>');
    c.dmgdirs = el('div', 'hud-dmgdirs', r);
    c.fps = el('div', 'hud-fps', r);
    this.radar = el('canvas', 'hud-radar', r) as HTMLCanvasElement;
    this.radar.width = 220;
    this.radar.height = 220;
    this.bigMap = el('canvas', 'hud-bigmap', r) as HTMLCanvasElement;
    this.bigMap.width = 900;
    this.bigMap.height = 720;
    this.radarBase = document.createElement('canvas');
    this.drawRadarBase();
    this.buildCrosshair();
  }

  applySettings(s: Settings): void {
    this.settings = s;
    this.buildCrosshair();
  }

  private buildCrosshair(): void {
    const ch = this.settings.crosshair;
    const outline = ch.outline ? 'box-shadow:0 0 0 1px rgba(0,0,0,0.85);' : '';
    const bar = (cls: string) => `<i class="${cls}" style="background:${ch.color};${outline}"></i>`;
    this.c.cross.innerHTML = bar('l') + bar('r') + bar('t') + bar('b') + (ch.dot ? `<i class="d" style="background:${ch.color};${outline}"></i>` : '');
  }

  private drawRadarBase(): void {
    const m = this.map;
    const cv = this.radarBase;
    cv.width = m.nx;
    cv.height = m.nz;
    const ctx = cv.getContext('2d')!;
    const img = ctx.createImageData(m.nx, m.nz);
    for (let iz = 0; iz < m.nz; iz++)
      for (let ix = 0; ix < m.nx; ix++) {
        const i = iz * m.nx + ix;
        // flip z so north is up
        const o = ((m.nz - 1 - iz) * m.nx + ix) * 4;
        const reg = m.cellRegion[i];
        if (reg < 0) {
          img.data[o + 3] = 0;
          continue;
        }
        const r = m.def.regions[reg];
        const f = m.cellFloor[i];
        let col = [70, 78, 88];
        if (r.style === 'yard' || r.style === 'lane') col = [88, 92, 98];
        if (r.style === 'lab') col = [70, 98, 82];
        if (r.style === 'hall') col = [86, 70, 96];
        if (r.style === 'garden') col = [52, 70, 50];
        if (r.style === 'crawl') col = [100, 86, 60];
        const lift = f * 12;
        img.data[o] = col[0] + lift;
        img.data[o + 1] = col[1] + lift;
        img.data[o + 2] = col[2] + lift;
        img.data[o + 3] = 235;
      }
    // props as darker cells
    ctx.putImageData(img, 0, 0);
    ctx.fillStyle = 'rgba(20,22,26,0.85)';
    for (const b of m.boxes) {
      if (b.kind !== 'prop' || b.maxY - b.minY < 0.9) continue;
      const x = (b.minX - m.x0) / m.cell;
      const y = m.nz - (b.maxZ - m.z0) / m.cell;
      ctx.fillRect(x, y, (b.maxX - b.minX) / m.cell, (b.maxZ - b.minZ) / m.cell);
    }
    ctx.fillStyle = 'rgba(255,47,176,0.22)';
    ctx.strokeStyle = 'rgba(255,90,190,0.9)';
    ctx.lineWidth = 1;
    for (const v of m.def.vaults) {
      const x = (v.rect[0] - m.x0) / m.cell;
      const y = m.nz - (v.rect[3] - m.z0) / m.cell;
      const w = (v.rect[2] - v.rect[0]) / m.cell;
      const h = (v.rect[3] - v.rect[1]) / m.cell;
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(v.id, x + w / 2 - 5, y + h / 2 + 5);
      ctx.fillStyle = 'rgba(255,47,176,0.22)';
    }
  }

  private toMap(x: number, z: number): [number, number] {
    const m = this.map;
    return [(x - m.x0) / m.cell, m.nz - (z - m.z0) / m.cell];
  }

  // ------------------------------------------------------------------ events
  onEvent(ev: GameEvent, myId: number, snap: Snapshot | null): void {
    const nameOf = (id: number) => this.names.get(id)?.name ?? '?';
    const sideCol = (id: number) => {
      const t = this.names.get(id)?.team;
      if (t === undefined || !snap) return '#ccc';
      const iff = iffColors(this.settings.colorblind);
      return snap.teams[t as 0 | 1].side === 'intrusion' ? iff.intrusion : iff.custodian;
    };
    switch (ev.e) {
      case 'kill': {
        const k = ev.killer >= 0 ? `<b style="color:${sideCol(ev.killer)}">${esc(nameOf(ev.killer))}</b>` : '';
        const a = ev.assister >= 0 ? ` + <span style="color:${sideCol(ev.assister)}">${esc(nameOf(ev.assister))}</span>` : '';
        const tags = `${ev.wall ? '<em class="tag">WALL</em>' : ''}${ev.head ? '<em class="tag hs">HEAD</em>' : ''}`;
        const mine = ev.killer === myId || ev.victim === myId ? ' mine' : '';
        this.pushFeed(this.feed, this.c.feed, `<div class="kf${mine}">${k}${a} <span class="wpn">${esc(ev.weapon)}</span>${tags} <b style="color:${sideCol(ev.victim)}">${esc(nameOf(ev.victim))}</b></div>`, 5);
        break;
      }
      case 'hit':
        if (ev.src === myId) {
          this.hitT = 0.22;
          this.hitKill = ev.kill;
          this.hitHead = ev.head;
          if (snap?.practice) this.pushFeed(this.dmgLog, this.c.dmglog, `<div>${ev.dmg} → ${ev.zone}${ev.armor ? ' (armored)' : ''}${ev.wall ? ' through wall' : ''}${ev.kill ? ' — KILL' : ''}</div>`, 8, 8);
        }
        break;
      case 'hurt':
        if (ev.dst === myId) {
          this.hurtT = 0.5;
          if (snap) {
            const me = snap.players.find((p) => p.id === myId);
            if (me && ev.src >= 0) {
              const ang = Math.atan2(ev.fromX - me.x, ev.fromZ - me.z) - me.yaw;
              const d = el('div', 'dmgdir', this.c.dmgdirs);
              this.dmgDirs.push({ ang, t: 1.2, el: d });
            }
          }
        }
        break;
      case 'blind':
        if (ev.dst === myId) {
          this.flashT0 = this.time;
          this.flashDur = ev.duration;
          this.flashAmt = ev.amount;
        }
        break;
      case 'radio': {
        this.pushFeed(this.radio, this.c.radioBox, `<div><b style="color:${sideCol(ev.src)}">${esc(nameOf(ev.src))}</b>: ${esc(ev.text)}</div>`, 7, 6);
        break;
      }
      case 'pulse':
        this.pulses.push({ x: ev.x, z: ev.z, wedges: ev.wedges, t: 2.5 });
        if (ev.wedges.some((w) => w)) this.caption('Pulse Shard: movement detected');
        break;
      case 'purchase':
        if (ev.player === myId && !ev.ok) this.caption(ev.reason ?? 'Cannot buy');
        break;
      case 'planted':
        this.banner(`CIPHER ARMED · VAULT ${ev.site}`, 'warn', 2.5);
        this.caption(`[Cipher armed at ${ev.site} — beeping]`);
        break;
      case 'defuseStart':
        if (snap && snap.you.side === 'intrusion') this.caption('[Disarm started]');
        break;
      case 'defused':
        this.caption('[Cipher disarmed]');
        break;
      case 'spikeDropped':
        this.caption('[Cipher dropped]');
        break;
      case 'smoke':
        break;
      case 'flash':
        break;
      case 'roundStart':
        this.c.dmglog.innerHTML = '';
        this.dmgLog = [];
        break;
      case 'halftime':
        this.banner('HALFTIME · SIDES SWAP', 'info', 4);
        break;
      case 'overtime':
        this.banner('OVERTIME', 'info', 4);
        break;
      case 'roundEnd': {
        const r = ev.record;
        const reason = r.reason === 'defused' ? 'Cipher disarmed' : r.reason === 'detonated' ? 'Cipher detonated' : r.reason === 'time' ? 'Time expired' : 'Team eliminated';
        const won = snap ? r.winner === snap.you.team : false;
        this.banner(`<div class="big">${SIDE_NAME[r.winnerSide]} WIN</div><div class="sub">${reason}</div><div class="sub2">${esc(r.decisive)}</div>`, won ? 'win' : 'lose', 5.5);
        break;
      }
    }
  }

  setNames(snap: Snapshot): void {
    for (const p of snap.players) this.names.set(p.id, { name: p.name, team: p.team });
  }
  setNameList(list: { id: number; name: string; team: number }[]): void {
    for (const p of list) this.names.set(p.id, { name: p.name, team: p.team });
  }

  caption(text: string): void {
    if (!this.settings.captions && text.startsWith('[')) return;
    this.pushFeed(this.captions, this.c.captions, `<div>${esc(text)}</div>`, 2.6, 3);
  }

  banner(html: string, kind: string, dur: number): void {
    this.c.banner.innerHTML = `<div class="b ${kind}">${html}</div>`;
    this.bannerUntil = this.time + dur;
    this.c.banner.style.opacity = '1';
  }

  private pushFeed(list: Feed[], box: HTMLElement, html: string, life: number, max = 5): void {
    const e = document.createElement('div');
    e.innerHTML = html;
    const node = e.firstElementChild as HTMLElement;
    box.appendChild(node);
    list.push({ html, t: life, el: node });
    while (list.length > max) list.shift()!.el.remove();
  }

  // ------------------------------------------------------------------ frame
  update(
    dt: number,
    snap: Snapshot,
    players: Map<number, SnapPlayer>,
    view: { x: number; y: number; z: number; yaw: number; fov: number; insideSmoke: number; spectating: string | null },
    fps: number,
  ): void {
    this.time += dt;
    this.lastSnap = snap;
    const c = this.c;
    const you = snap.you;
    const tick = snap.tick;
    const iff = iffColors(this.settings.colorblind);
    const myT = snap.teams[you.team];
    const enT = snap.teams[you.team === 0 ? 1 : 0];
    const col = (s: Side) => (s === 'intrusion' ? iff.intrusion : iff.custodian);
    this.setNames(snap);

    // score / clock
    setHtml(c.scoreL, `<span class="side" style="color:${col(myT.side)}">${SIDE_NAME[myT.side]}</span><span class="n">${myT.score}</span>`);
    setHtml(c.scoreR, `<span class="n">${enT.score}</span><span class="side" style="color:${col(enT.side)}">${SIDE_NAME[enT.side]}</span>`);
    const left = (snap.phaseEndTick - tick) / TICK_RATE;
    let clock = '';
    if (snap.practice) clock = '<span class="practice">PRACTICE</span>';
    else if (snap.phase === 'planted') {
      const urgent = left < 10;
      clock = `<span class="spikeclock${urgent ? ' urgent' : ''}">◆ ${left.toFixed(1)}</span>`;
    } else if (snap.phase === 'buy') clock = `<span class="buy">BUY ${fmtTime(left)}</span>`;
    else if (snap.phase === 'live') clock = fmtTime(left);
    else if (snap.phase === 'roundEnd') clock = '—';
    else clock = 'END';
    setHtml(c.clock, `${clock}<div class="round">ROUND ${snap.round}</div>`);
    const pips = (alive: number, total: number, color: string) => Array.from({ length: total }, (_, i) => `<i style="background:${i < alive ? color : 'rgba(255,255,255,0.12)'}"></i>`).join('');
    setHtml(c.pipsL, pips(myT.alive, 5, col(myT.side)));
    setHtml(c.pipsR, pips(enT.alive, 5, col(enT.side)));

    // phase strip
    let phaseTxt = '';
    if (snap.phase === 'buy') phaseTxt = you.inBuyZone ? 'BUY PHASE — press <b>B</b> to buy' : 'BUY PHASE';
    if (snap.practice) phaseTxt = 'PRACTICE — <b>B</b> buy anything · targets respawn · Esc for menu';
    setHtml(c.phase, phaseTxt);

    // location / money
    setHtml(c.loc, esc(this.map.callout(view.x, view.z)));
    setHtml(c.money, snap.phase === 'buy' || snap.practice ? `$${you.money.toLocaleString()}` : `<span class="dim">$${you.money.toLocaleString()}</span>`);

    // vitals
    const alive = you.alive;
    setHtml(
      c.vitals,
      alive
        ? `<div class="hp${you.health <= 25 ? ' low' : ''}"><span class="ico">✚</span>${you.health}</div><div class="ar"><span class="ico">${you.helmet ? '⛨' : '◇'}</span>${you.armor}</div>${you.kit ? '<div class="kit">KIT</div>' : ''}${you.hasSpike ? '<div class="spk">◆ CIPHER</div>' : ''}`
        : '',
    );

    // ammo / weapon
    let ammo = '';
    if (alive) {
      const w = you.active === 'primary' ? you.primary : you.active === 'secondary' ? you.secondary : null;
      if (w) ammo = `<div class="mag${w.mag === 0 ? ' empty' : ''}">${w.mag}<span class="res">/ ${w.reserve}</span></div><div class="wn">${WEAPONS[w.id].name}${WEAPONS[w.id].burst ? (you.burstMode ? ' · BURST' : ' · SEMI') : ''}</div>`;
      else if (you.active === 'tool') ammo = `<div class="wn">${WEAPONS.tool.name}</div>`;
      else if (you.active === 'util') ammo = `<div class="wn">${ITEM_NAME(you.utils[you.utilIndex] ?? '')}</div><div class="hint">LMB throw · RMB lob</div>`;
      else if (you.active === 'spike') ammo = `<div class="wn">Cipher Spike</div><div class="hint">Hold E in a vault</div>`;
    }
    setHtml(c.ammo, ammo);
    const slotHtml = alive
      ? [
          you.primary ? `<div class="slot${you.active === 'primary' ? ' on' : ''}"><k>1</k>${WEAPONS[you.primary.id].name}</div>` : '',
          you.secondary ? `<div class="slot${you.active === 'secondary' ? ' on' : ''}"><k>2</k>${WEAPONS[you.secondary.id].name}</div>` : '',
          `<div class="slot${you.active === 'tool' || you.active === 'spike' ? ' on' : ''}"><k>3</k>${you.hasSpike ? 'Tool / Cipher' : 'Tool'}</div>`,
          `<div class="utilrow">${you.utils.map((u, i) => `<span class="u${you.active === 'util' && you.utilIndex === i ? ' on' : ''}" style="border-color:${UTILITY[u].color}"><k>${4 + i}</k>${UTILITY[u].name.split(' ')[0]}</span>`).join('')}</div>`,
        ].join('')
      : '';
    setHtml(c.slots, slotHtml);

    // crosshair: dynamic gap visualizes allowed inaccuracy only
    const scoped = you.scopeFov > 0;
    c.cross.style.display = alive && !scoped && you.active !== 'util' ? 'block' : 'none';
    const ch = this.settings.crosshair;
    const w = window.innerWidth;
    const spreadPx = ch.dynamic ? (Math.tan(you.spread) / Math.tan(((view.fov / 2) * Math.PI) / 180)) * (w / 2) : 0;
    const gap = ch.gap + Math.min(60, spreadPx);
    const bars = c.cross.children;
    for (let i = 0; i < bars.length; i++) {
      const b = bars[i] as HTMLElement;
      const k = b.className;
      if (k === 'l' || k === 'r') {
        b.style.width = `${ch.length}px`;
        b.style.height = `${ch.thickness}px`;
        b.style.transform = `translate(${k === 'l' ? -gap - ch.length : gap}px, ${-ch.thickness / 2}px)`;
      } else if (k === 't' || k === 'b') {
        b.style.width = `${ch.thickness}px`;
        b.style.height = `${ch.length}px`;
        b.style.transform = `translate(${-ch.thickness / 2}px, ${k === 't' ? -gap - ch.length : gap}px)`;
      } else {
        b.style.width = `${ch.thickness}px`;
        b.style.height = `${ch.thickness}px`;
        b.style.transform = `translate(${-ch.thickness / 2}px, ${-ch.thickness / 2}px)`;
      }
    }
    c.scope.style.display = scoped && alive ? 'block' : 'none';

    // hitmarker
    this.hitT -= dt;
    c.hit.style.opacity = this.hitT > 0 ? String(Math.min(1, this.hitT * 6)) : '0';
    c.hit.className = `hud-hit${this.hitKill ? ' kill' : this.hitHead ? ' head' : ''}`;

    // hurt vignette, damage direction
    this.hurtT = Math.max(0, this.hurtT - dt);
    c.hurt.style.opacity = String(this.hurtT * 1.4 + (alive && you.health < 30 ? 0.25 : 0));
    this.dmgDirs = this.dmgDirs.filter((d) => {
      d.t -= dt;
      if (d.t <= 0) {
        d.el.remove();
        return false;
      }
      d.el.style.transform = `rotate(${d.ang}rad)`;
      d.el.style.opacity = String(Math.min(1, d.t));
      return true;
    });

    // flash: identical duration for everyone; reduced-flash lowers pure white only
    const fe = this.time - this.flashT0;
    let fa = 0;
    if (fe < this.flashDur) {
      const hold = this.flashDur * 0.55;
      fa = fe < hold ? this.flashAmt : this.flashAmt * (1 - (fe - hold) / (this.flashDur - hold));
    }
    const reduced = this.settings.reducedFlash;
    c.flash.style.opacity = String(Math.min(1, fa * 1.05));
    c.flash.style.background = reduced ? 'rgb(200,200,205)' : '#fff';

    // smoke from inside
    c.smoke.style.opacity = String(Math.min(0.97, view.insideSmoke));

    // prompts & progress
    let prompt = '';
    if (alive) {
      if (snap.spike.state === 'planted' && you.side === 'custodian' && you.defuseProgress === 0) {
        const d = Math.hypot(view.x - snap.spike.x, view.z - snap.spike.z);
        if (d < 1.6) prompt = `Hold <b>E</b> to disarm (${you.kit ? '5' : '8'} s)`;
      }
      if (you.hasSpike && you.armProgress === 0 && (snap.phase === 'live' || snap.practice)) {
        if (this.map.vaultAt({ x: view.x, y: view.y - 1.6, z: view.z })) prompt = 'Hold <b>E</b> to arm the Cipher (3.2 s)';
      }
      if (snap.phase === 'buy' && you.inBuyZone && !prompt) prompt = '';
    }
    setHtml(c.prompt, prompt);
    const prog = you.armProgress || you.defuseProgress;
    c.progress.style.display = prog > 0 ? 'block' : 'none';
    if (prog > 0) {
      (c.progress.querySelector('.fill') as HTMLElement).style.width = `${prog * 100}%`;
      (c.progress.querySelector('.lbl') as HTMLElement).textContent = you.armProgress ? 'ARMING CIPHER' : 'DISARMING CIPHER';
    }

    // spectate
    setHtml(c.spec, !alive && view.spectating ? `SPECTATING <b>${esc(view.spectating)}</b> · LMB/RMB cycle` : !alive && snap.phase !== 'roundEnd' ? 'ELIMINATED — waiting for next round' : '');

    // feeds aging
    for (const list of [this.feed, this.radio, this.captions, this.dmgLog]) {
      for (let i = list.length - 1; i >= 0; i--) {
        list[i].t -= dt;
        if (list[i].t <= 0) {
          list[i].el.remove();
          list.splice(i, 1);
        } else if (list[i].t < 0.5) list[i].el.style.opacity = String(list[i].t * 2);
      }
    }
    if (this.time > this.bannerUntil) c.banner.style.opacity = '0';

    c.fps.style.display = this.settings.showFps ? 'block' : 'none';
    if (this.settings.showFps) c.fps.textContent = `${fps.toFixed(0)} FPS`;

    this.drawRadar(snap, players, view);
    this.bigMap.style.display = this.showMap ? 'block' : 'none';
    if (this.showMap) this.drawBigMap(snap, players);
  }

  private drawMarkers(ctx: CanvasRenderingContext2D, snap: Snapshot, players: Map<number, SnapPlayer>, scale: number, tx: (x: number, z: number) => [number, number]): void {
    const iff = iffColors(this.settings.colorblind);
    const you = snap.you;
    // pulses
    for (const p of this.pulses) {
      const [x, y] = tx(p.x, p.z);
      ctx.strokeStyle = 'rgba(79,240,255,0.5)';
      ctx.beginPath();
      ctx.arc(x, y, 15 * scale, 0, Math.PI * 2);
      ctx.stroke();
      p.wedges.forEach((on, i) => {
        if (!on) return;
        const a0 = -Math.PI + (i / p.wedges.length) * Math.PI * 2;
        const a1 = a0 + (Math.PI * 2) / p.wedges.length;
        ctx.fillStyle = `rgba(79,240,255,${0.35 * Math.min(1, p.t)})`;
        ctx.beginPath();
        ctx.moveTo(x, y);
        // world bearing atan2(dx,dz); canvas: x right, y down = -z
        for (let k = 0; k <= 8; k++) {
          const a = a0 + ((a1 - a0) * k) / 8;
          ctx.lineTo(x + Math.sin(a) * 15 * scale, y - Math.cos(a) * 15 * scale);
        }
        ctx.closePath();
        ctx.fill();
      });
    }
    // spike
    const sp = snap.spike;
    if (sp.known && sp.state !== 'carried' && sp.state !== 'none') {
      const [x, y] = tx(sp.x, sp.z);
      ctx.fillStyle = sp.state === 'planted' ? (Math.floor(this.time * 4) % 2 ? '#ff2fb0' : '#ffffff') : '#ff2fb0';
      ctx.beginPath();
      ctx.moveTo(x, y - 6);
      ctx.lineTo(x + 6, y);
      ctx.lineTo(x, y + 6);
      ctx.lineTo(x - 6, y);
      ctx.fill();
    }
    // teammates only (no enemy positions on the map)
    for (const p of players.values()) {
      if (p.team !== you.team) continue;
      const [x, y] = tx(p.x, p.z);
      const side = snap.teams[p.team].side;
      ctx.fillStyle = p.alive ? (side === 'intrusion' ? iff.intrusion : iff.custodian) : 'rgba(255,255,255,0.3)';
      if (!p.alive) {
        ctx.font = '10px sans-serif';
        ctx.fillText('✕', x - 3, y + 3);
        continue;
      }
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(p.yaw);
      ctx.beginPath();
      if (p.id === you.id) {
        ctx.moveTo(0, -8);
        ctx.lineTo(5, 5);
        ctx.lineTo(0, 2);
        ctx.lineTo(-5, 5);
        ctx.fillStyle = '#ffffff';
      } else {
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
      }
      ctx.fill();
      if (p.hasSpike) {
        ctx.fillStyle = '#ff2fb0';
        ctx.fillRect(-2, -2, 4, 4);
      }
      ctx.restore();
    }
  }

  private drawRadar(snap: Snapshot, players: Map<number, SnapPlayer>, view: { x: number; z: number }): void {
    const ctx = this.radar.getContext('2d')!;
    const W = this.radar.width;
    ctx.clearRect(0, 0, W, W);
    ctx.save();
    ctx.beginPath();
    ctx.arc(W / 2, W / 2, W / 2 - 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = 'rgba(8,10,14,0.65)';
    ctx.fillRect(0, 0, W, W);
    const scale = 2.6; // px per metre
    const [cx, cy] = this.toMap(view.x, view.z);
    const k = scale * this.map.cell;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.radarBase, W / 2 - cx * k, W / 2 - cy * k, this.map.nx * k, this.map.nz * k);
    const tx = (x: number, z: number): [number, number] => {
      const [mx, my] = this.toMap(x, z);
      return [W / 2 + (mx - cx) * k, W / 2 + (my - cy) * k];
    };
    for (const p of this.pulses) p.t -= 1 / 60;
    this.pulses = this.pulses.filter((p) => p.t > 0);
    this.drawMarkers(ctx, snap, players, scale, tx);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(W / 2, W / 2, W / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  private drawBigMap(snap: Snapshot, players: Map<number, SnapPlayer>): void {
    const cv = this.bigMap;
    const ctx = cv.getContext('2d')!;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = 'rgba(6,8,12,0.88)';
    ctx.fillRect(0, 0, cv.width, cv.height);
    const k = Math.min(cv.width / this.map.nx, cv.height / this.map.nz) * 0.95;
    const ox = (cv.width - this.map.nx * k) / 2;
    const oy = (cv.height - this.map.nz * k) / 2;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.radarBase, ox, oy, this.map.nx * k, this.map.nz * k);
    const tx = (x: number, z: number): [number, number] => {
      const [mx, my] = this.toMap(x, z);
      return [ox + mx * k, oy + my * k];
    };
    // callouts
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    const done = new Set<string>();
    for (const r of this.map.def.regions) {
      if (done.has(r.callout)) continue;
      done.add(r.callout);
      const [x, y] = tx((r.rect[0] + r.rect[2]) / 2, (r.rect[1] + r.rect[3]) / 2);
      const w = ctx.measureText(r.callout).width;
      ctx.fillText(r.callout, x - w / 2, y);
    }
    this.drawMarkers(ctx, snap, players, k / this.map.cell, tx);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px "Segoe UI", sans-serif';
    ctx.fillText('APERTURE ANNEX — TACTICAL MAP (teammates & known objective only)', 20, 28);
  }

  setVisible(v: boolean): void {
    this.root.style.display = v ? 'block' : 'none';
  }

  dispose(): void {
    this.root.remove();
  }
}

function setHtml(e: HTMLElement, html: string): void {
  if ((e as unknown as { _h?: string })._h !== html) {
    e.innerHTML = html;
    (e as unknown as { _h?: string })._h = html;
  }
}

export function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}
