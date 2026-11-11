// client-runtime: one match on the client. Owns the server link, snapshot interpolation buffer,
// renderer, input and audio; publishes a throttled read model to the HUD store.

import { HEROES } from '../shared/heroes';
import { getMap } from '../shared/map';
import { clamp } from '../shared/math';
import { Command, GameEvent, HeroPublic, MatchConfig, ST, Snapshot, UnitView } from '../shared/protocol';
import { TEAM_NAMES } from '../shared/units';
import { audio } from './audio/audio';
import { Input } from './input';
import { MiniPing, Minimap, miniToSim } from './render/minimap';
import { Ent, GameRenderer } from './render/renderer';
import { ServerLink, createLink } from './runtime/link';
import { getSettings } from './runtime/persist';
import { FeedItem, hud, initialHud } from './runtime/store';

export interface MatchResult {
  winner: 0 | 1;
  duration: number;
  heroes: HeroPublic[];
  timeline: { time: number; msg: string; team: number }[];
  viewer: 0 | 1;
  selfId: number;
  config: MatchConfig;
}

export const TUTORIAL_STEPS: { id: string; label: string; hint: string }[] = [
  { id: 'buy', label: 'Buy a starter item', hint: 'You start in the fountain. Press P to open the shop and buy the recommended starter.' },
  { id: 'rank', label: 'Learn an ability', hint: 'Click the + above an ability (or Shift+Q) to spend your first skill point.' },
  { id: 'move', label: 'Move with right-click', hint: 'Right-click the ground to walk. Head up a lane toward your outer tower.' },
  { id: 'attack', label: 'Attack an enemy minion', hint: 'Right-click an enemy (red) minion to basic attack it.' },
  { id: 'lasthit', label: 'Land a last hit', hint: 'Only the killing blow on a minion pays gold. Time your hit when its health is low.' },
  { id: 'cast', label: 'Cast an ability', hint: 'Hold Q to aim, release to cast. Blue shapes show range and area.' },
  { id: 'ward', label: 'Place a ward', hint: 'Press T (or 4) near brush or the river to place a ward that grants vision for 90 s.' },
  { id: 'recall', label: 'Recall to the fountain', hint: 'Press B and stand still for 7 s to return home, heal, and shop.' },
  { id: 'tower', label: 'Destroy an enemy tower', hint: 'Towers shoot minions first. Attack a tower only while your minions are tanking it — a red line means it is aiming at YOU.' },
  { id: 'objective', label: 'Claim a Catalyst or the Colossus', hint: 'Neutral objectives in the river grant team-wide buffs. Check the timers at the top of the screen.' },
];

export class GameClient {
  readonly renderer: GameRenderer;
  readonly input: Input;
  readonly minimap: Minimap;
  readonly viewer: 0 | 1;
  selfId = 0;
  private link: ServerLink;
  private cur: Snapshot | null = null;
  private prev: Snapshot | null = null;
  private curAt = 0;
  private raf = 0;
  private lastFrame = performance.now();
  private lastHud = 0;
  private lastMini = 0;
  private feedId = 1;
  private feed: FeedItem[] = [];
  private timeline: { time: number; msg: string; team: number }[] = [];
  private pings: MiniPing[] = [];
  private tutorial: Record<string, boolean> = {};
  private fpsAcc = 0;
  private fpsN = 0;
  private fps = 60;
  private finished = false;
  private disposed = false;
  private lastTowerWarn = 0;
  private resizeObs: ResizeObserver;

  constructor(
    private container: HTMLElement,
    overlay: HTMLCanvasElement,
    minimapCanvas: HTMLCanvasElement,
    readonly config: MatchConfig,
    private onOver: (r: MatchResult) => void,
    onError: (msg: string) => void,
  ) {
    const seat = config.seats[config.humanSeat];
    this.viewer = seat.team;
    const settings = getSettings();
    hud.reset({ ...initialHud(), active: true, heroId: seat.hero, viewer: seat.team, mode: config.mode, camLocked: settings.cameraLock });
    this.renderer = new GameRenderer(container, overlay, getMap(), settings, this.viewer);
    this.minimap = new Minimap(minimapCanvas, getMap());
    if (settings.colorblind) this.minimap.colors = { ally: '#3d8bff', enemy: '#ffb000', neutral: '#e8e0c0', self: '#7dff9a' };
    this.input = new Input(this, container);
    audio.setVolumes(settings.master, settings.music, settings.sfx);
    audio.startMusic();
    const forceInProc = new URLSearchParams(location.search).has('inproc');
    this.link = createLink(config, { onSnapshot: (s) => this.onSnapshot(s), onError }, forceInProc);
    hud.set({ link: this.link.kind });
    this.resizeObs = new ResizeObserver(() => this.renderer.resize());
    this.resizeObs.observe(container);
    this.raf = requestAnimationFrame(this.loop);
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObs.disconnect();
    this.link.stop();
    this.input.dispose();
    this.renderer.dispose();
    audio.stopMusic();
    audio.setMuffled(false);
    hud.set({ active: false });
  }

  send(cmd: Command): void {
    if (this.finished) return;
    this.link.send(cmd);
  }

  toast(msg: string): void {
    hud.set({ toast: { msg, at: performance.now() } });
  }

  selfEnt(): Ent | null {
    return this.renderer.ents.get(this.selfId) ?? null;
  }
  private selfView(): UnitView | null {
    return this.cur?.units.find((u) => u.id === this.selfId) ?? null;
  }

  centerOnHero(): void {
    const me = this.selfEnt();
    if (me) {
      this.renderer.camX = me.x;
      this.renderer.camY = me.y;
    }
  }
  unlockCamera(): void {
    if (hud.get().camLocked) hud.set({ camLocked: false });
  }

  toggleMenu(): void {
    const open = !hud.get().menuOpen;
    hud.set({ menuOpen: open });
    this.link.pause(open);
  }
  setTimeScale(s: number): void {
    this.link.timescale(s);
  }

  minimapAction(px: number, py: number, button: number): void {
    const p = miniToSim(px, py);
    if (button === 2) {
      this.send({ t: 'move', x: p.x, y: p.y });
      this.renderer.indicators.click(p.x, p.y, false);
    } else {
      this.unlockCamera();
      this.renderer.camX = clamp(p.x, 0, 150);
      this.renderer.camY = clamp(p.y, 0, 115);
    }
  }

  // ---- snapshots and events ------------------------------------------------------------------

  private onSnapshot(s: Snapshot): void {
    if (this.disposed) return;
    if (!this.selfId && s.you) {
      this.selfId = s.you.id;
      this.renderer.selfId = s.you.id;
      const me = s.units.find((u) => u.id === s.you!.id);
      if (me) {
        this.renderer.camX = me.x;
        this.renderer.camY = me.y;
      }
    }
    this.prev = this.cur;
    this.cur = s;
    this.curAt = performance.now();
    for (const ev of s.events) this.onEvent(ev, s);
    if (s.over && !this.finished) {
      this.finished = true;
      const won = s.over.winner === this.viewer;
      audio.play(won ? 'victory' : 'defeat');
      audio.intensity = 0;
      hud.set({ over: s.over });
      const result: MatchResult = { winner: s.over.winner, duration: s.over.duration, heroes: s.heroes, timeline: this.timeline.slice(), viewer: this.viewer, selfId: this.selfId, config: this.config };
      setTimeout(() => {
        if (!this.disposed) this.onOver(result);
      }, 4200);
    }
  }

  private heroName(id: number, s: Snapshot): { name: string; hero?: HeroPublic } {
    const h = s.heroes.find((x) => x.id === id);
    return { name: h ? h.name : 'A structure', hero: h };
  }

  private pushFeed(item: Omit<FeedItem, 'id' | 'at'>): void {
    this.feed.push({ ...item, id: this.feedId++, at: performance.now() });
    if (this.feed.length > 6) this.feed.shift();
  }

  private onEvent(ev: GameEvent, s: Snapshot): void {
    this.renderer.handleEvent(ev);
    switch (ev.e) {
      case 'atk': {
        const ranged = ev.k === 'tower' || ev.k === 'core' || ev.s === 'bolt' || ev.s === 'siege' || (ev.k === 'hero' && !HEROES[ev.s as keyof typeof HEROES]?.melee);
        audio.play(ev.k === 'tower' || ev.k === 'core' ? 'tower' : ranged ? 'shoot' : 'hit', ev.x, ev.y, ev.id % 4);
        break;
      }
      case 'cast':
        audio.play(ev.slot === 3 ? 'ult' : 'cast', ev.x, ev.y, ev.slot);
        break;
      case 'dmg':
        if (ev.id === this.selfId && ev.a > 25) audio.play('hit', ev.x, ev.y, 3);
        break;
      case 'heal':
        audio.play('heal', ev.x, ev.y);
        break;
      case 'gold':
        audio.play('gold');
        break;
      case 'level':
        if (ev.id === this.selfId) {
          audio.play('level');
          this.toast(`Level ${ev.lvl}! Spend your skill point`);
        }
        break;
      case 'death':
        if (ev.k === 'hero') audio.play('heroDie', ev.x, ev.y);
        else if (ev.k === 'minion' || ev.k === 'monster') audio.play('minionDie', ev.x, ev.y);
        else if (ev.k !== 'ward' && ev.k !== 'decoy') audio.play('structure', ev.x, ev.y);
        break;
      case 'kill': {
        const victim = this.heroName(ev.victim, s);
        const killer = ev.killer > 0 ? this.heroName(ev.killer, s) : null;
        this.pushFeed({ kind: 'kill', text: '', team: killer?.hero ? killer.hero.team : victim.hero ? 1 - victim.hero.team : 2, killer: killer?.hero?.hero, victim: victim.hero?.hero, killerName: killer ? killer.name : 'Executed', victimName: victim.name, assists: ev.assists.length, gold: ev.gold });
        audio.play('kill');
        if (ev.first) this.announce('First blood!', 'kill', killer?.hero?.team === this.viewer ? 'good' : 'bad');
        if (ev.killer === this.selfId) this.toast(`You felled ${victim.name}  +${ev.gold}g`);
        break;
      }
      case 'announce': {
        const tone = ev.team === 2 ? 'neutral' : ev.team === this.viewer ? 'good' : 'bad';
        this.announce(ev.msg, ev.kind, tone);
        this.pushFeed({ kind: 'info', text: ev.msg, team: ev.team });
        break;
      }
      case 'timeline':
        this.timeline.push({ time: ev.time, msg: ev.msg, team: ev.team });
        break;
      case 'reject':
        this.toast(ev.reason);
        audio.play('error');
        break;
      case 'bought':
        audio.play('buy');
        break;
      case 'ping':
        this.pings.push({ x: ev.x, y: ev.y, kind: ev.kind, age: 0 });
        this.renderer.vfx.ring(ev.x, ev.y, 3, ev.kind === 'danger' ? 0xff5f4a : 0x7dff9a, 1.0);
        this.renderer.vfx.ring(ev.x, ev.y, 1.5, 0xffffff, 0.6);
        audio.play('ping');
        this.pushFeed({ kind: 'info', text: `${ev.by} pings: ${ev.kind === 'danger' ? 'Danger!' : ev.kind === 'omw' ? 'On my way' : ev.kind}`, team: this.viewer });
        break;
      case 'tut':
        if (!this.tutorial[ev.step]) {
          this.tutorial = { ...this.tutorial, [ev.step]: true };
          audio.play('level');
        }
        break;
      case 'fx':
        if (ev.fx === 'slam' || ev.fx === 'parcelBoom') audio.play('slam', ev.x, ev.y);
        else if (ev.fx === 'shield') audio.play('shield', ev.x, ev.y);
        else if (ev.fx === 'blink') audio.play('dash', ev.x, ev.y);
        else if (ev.fx === 'towerLock' && ev.id === this.selfId && performance.now() - this.lastTowerWarn > 1500) {
          this.lastTowerWarn = performance.now();
          audio.play('towerLock');
          this.toast('A tower is targeting you!');
        }
        break;
    }
  }

  private announce(msg: string, kind: string, tone: 'good' | 'bad' | 'neutral'): void {
    hud.set({ announce: { msg, kind, tone, at: performance.now() } });
    audio.play('announce');
  }

  // ---- frame loop ----------------------------------------------------------------------------

  private loop = (now: number): void => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.1, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    this.fpsAcc += dt;
    this.fpsN++;
    if (this.fpsAcc >= 0.5) {
      this.fps = Math.round(this.fpsN / this.fpsAcc);
      this.fpsAcc = 0;
      this.fpsN = 0;
    }
    const cur = this.cur;
    if (!cur) return;
    const alpha = cur.paused ? 1 : clamp((now - this.curAt) / (1000 / 30 / (cur.timeScale || 1)), 0, 1.5);
    const self = this.selfView();
    this.input.update(dt);
    this.renderer.frame(cur, this.prev, Math.min(1, alpha), dt, now / 1000, self);
    audio.listener.x = this.renderer.camX;
    audio.listener.y = this.renderer.camY;

    if (now - this.lastMini > 80) {
      this.lastMini = now;
      for (const p of this.pings) p.age += 0.08;
      this.pings = this.pings.filter((p) => p.age < 3);
      this.minimap.draw(cur.units, cur.heroes, cur.objectives, this.viewer, this.selfId, this.renderer.fog.canvas, this.renderer.cameraQuad(), this.pings, cur.time);
    }
    if (now - this.lastHud > 100) {
      this.lastHud = now;
      this.publish(cur, self, now);
    }
  };

  private publish(cur: Snapshot, self: UnitView | null, now: number): void {
    const alive: [number, number] = [0, 0];
    const sealsDown: [number, number] = [0, 0];
    let towerWarn = false;
    for (const u of cur.units) {
      if (u.k === 'tower' || u.k === 'core') {
        if (!u.dead) alive[u.t as 0 | 1]++;
        if (u.tg === this.selfId && !u.dead) towerWarn = true;
      } else if (u.k === 'seal' && u.dead) sealsDown[u.t as 0 | 1]++;
    }
    // adaptive music: fight when enemy heroes are close or we are trading, contest near objectives
    let intensity = 0;
    if (self) {
      for (const u of cur.units) {
        if (u.k === 'hero' && u.t !== this.viewer && Math.hypot(u.x - self.x, u.y - self.y) < 12) intensity = 2;
        else if (u.k === 'monster' && u.r > 1.2 && Math.hypot(u.x - self.x, u.y - self.y) < 14 && intensity < 1) intensity = 1;
        else if ((u.k === 'tower' || u.k === 'core' || u.k === 'engine') && u.t !== this.viewer && !u.dead && Math.hypot(u.x - self.x, u.y - self.y) < 12 && intensity < 1) intensity = 1;
      }
      audio.setMuffled((self.st & ST.BLIND) !== 0);
    }
    audio.intensity = this.finished ? 0 : intensity;
    const cutoff = now - 9000;
    if (this.feed.length && this.feed[0].at < cutoff) this.feed = this.feed.filter((f) => f.at >= cutoff);
    const st = hud.get();
    hud.set({
      time: cur.time,
      you: cur.you,
      self: self ? { hp: self.hp, mhp: self.mhp, mp: self.mp, mmp: self.mmp, sh: self.sh, st: self.st } : null,
      heroes: cur.heroes,
      teams: cur.teams,
      objectives: cur.objectives,
      structs: { alive, total: 8, sealsDown },
      feed: this.feed,
      tutorial: this.tutorial,
      towerWarn,
      fps: this.fps,
      drawCalls: this.renderer.drawCalls,
      paused: cur.paused,
      timeScale: cur.timeScale,
      announce: st.announce && now - st.announce.at > 5200 ? null : st.announce,
      toast: st.toast && now - st.toast.at > 2600 ? null : st.toast,
    });
  }

  /** Debug/automation hook used by tools/screenshot.mjs and manual testing (never by gameplay). */
  debugState(): { time: number; self: UnitView | null; units: number; heroes: HeroPublic[]; fps: number; drawCalls: number; over: Snapshot['over'] } {
    return { time: this.cur?.time ?? 0, self: this.selfView(), units: this.cur?.units.length ?? 0, heroes: this.cur?.heroes ?? [], fps: this.fps, drawCalls: this.renderer.drawCalls, over: this.cur?.over ?? null };
  }
  debugUnits(): UnitView[] {
    return this.cur?.units ?? [];
  }
}

export const teamName = (t: number): string => TEAM_NAMES[t] ?? 'Neutral';
