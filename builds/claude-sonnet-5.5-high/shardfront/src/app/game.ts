// app: a running match. Owns the fixed-step loop (20 Hz sim, interpolated render at display rate), wires sim <-> renderer <-> audio <-> HUD.
import { defIndex as allDefsIndex, type FactionId } from '../data';
import { Sim } from '../sim/sim';
import { TD } from '../sim/ext';
import type { Command, SimConfig, SimEvent } from '../sim/types';
import { GameRenderer, type Settings, type ViewState } from '../render/renderer';
import { Input } from '../input/input';
import { Hud } from '../ui/hud';
import { audio } from '../audio/audio';
import type { App } from './app';
import type { ReplayRecord } from './persist';
import { Tutorial } from './tutorial';
import { PROTOCOL_VERSION } from '../sim/types';

export interface GameOptions {
  mode: 'skirmish' | 'tutorial' | 'replay';
  faction: FactionId;
  enemy: FactionId;
  difficulty: string;
  seed: number;
  replay?: ReplayRecord;
}

const DT = 1 / 20;

export class Game {
  sim: Sim;
  renderer: GameRenderer;
  hud: Hud;
  input: Input;
  tutorial: Tutorial | null = null;
  local: number;
  fogEnabled = true;
  paused = false;
  userPaused = false;
  speed = 1;
  private acc = 0;
  private last = 0;
  private raf = 0;
  private view: ViewState;
  private viewport: HTMLDivElement;
  private root: HTMLDivElement;
  private alertPos: { x: number; y: number } | null = null;
  private combat = 0;
  private endTimer = -1;
  ended = false;
  private replayIdx = 0;
  private pauseEl: HTMLElement | null = null;
  private fps = 60;
  private frameMs = 16;
  private fpsAcc = 0;
  private frames = 0;
  private markerT = 0;
  private lostEl: HTMLElement | null = null;
  verified: 'pending' | 'ok' | 'mismatch' = 'pending';
  private replayBar: HTMLElement | null = null;
  private onVis: () => void;
  private onResize: () => void;
  bench: { t0: number; frames: number[]; done: boolean; result?: { medianFps: number; low1Fps: number; units: number; frames: number } } | null = null;

  constructor(public app: App, container: HTMLElement, public opts: GameOptions, public settings: Settings) {
    const cfg: SimConfig = opts.replay
      ? opts.replay.cfg
      : {
          seed: opts.seed,
          factions: [opts.faction, opts.enemy],
          ai: [null, opts.difficulty],
          mode: opts.mode === 'tutorial' ? 'tutorial' : 'skirmish',
          passiveAi: opts.mode === 'tutorial',
          startOre: opts.mode === 'tutorial' ? 450 : undefined,
        };
    this.sim = new Sim(cfg);
    this.local = opts.mode === 'replay' ? -1 : 0;
    this.root = document.createElement('div');
    this.root.id = 'game';
    container.appendChild(this.root);
    this.viewport = document.createElement('div');
    this.viewport.id = 'viewport';
    this.root.appendChild(this.viewport);
    this.renderer = new GameRenderer(this.viewport, this.sim, settings);
    this.input = new Input(this, this.viewport);
    this.hud = new Hud(this, this.root);
    this.view = this.input.buildView();
    this.centerOnBase(true);
    this.renderer.cam.targetHeight = this.renderer.cam.height = 34;
    if (opts.mode === 'tutorial') { this.tutorial = new Tutorial(this); this.tutorial.render(); }
    else if (opts.mode === 'skirmish') this.hud.setObjective('Objective', 'Destroy the enemy base');
    if (opts.mode === 'replay') this.buildReplayBar();
    audio.init();
    audio.setVolumes(settings, settings.masterMuted);
    audio.startMusic(this.sim.players[0].faction.id);
    this.onVis = () => { if (document.hidden && this.opts.mode !== 'replay' && !this.paused) { this.openPause(); } };
    document.addEventListener('visibilitychange', this.onVis);
    this.onResize = () => this.renderer.resize();
    window.addEventListener('resize', this.onResize);
    const cv = this.renderer.renderer.domElement;
    cv.addEventListener('webglcontextlost', () => this.showContextLost(true));
    cv.addEventListener('webglcontextrestored', () => this.showContextLost(false));
    this.last = performance.now();
    this.raf = requestAnimationFrame((t) => this.frame(t));
    this.hud.refresh(true);
  }

  /** Reproducible benchmark scene: 220 active units in a large skirmish, fog off, fixed camera. */
  startBenchmark() {
    const sim = this.sim;
    sim.cfg.noVictory = true;
    for (const p of sim.players) p.ai = null;
    this.fogEnabled = false;
    const D = (id: string) => allDefsIndex[id];
    const left = ['bulwark', 'bulwark', 'arc_lancer', 'bulwark', 'mortar_crawler', 'kestrel'];
    const right = ['thornling', 'thornling', 'sporecaster', 'thornling', 'carapace_guard', 'rift_stag'];
    for (let i = 0; i < 110; i++) {
      sim.spawn(D(left[i % left.length]), 0, 58 + (i % 10) * 1.25, 63 + Math.floor(i / 10) * 1.25, { face: 0 });
      sim.spawn(D(right[i % right.length]), 1, 86 - (i % 10) * 1.25, 63 + Math.floor(i / 10) * 1.25, { face: Math.PI });
    }
    const mine = sim.ids.filter((id) => sim.owner[id] === 0 && sim.td(id).isUnit && !sim.td(id).isWorker && sim.alive[id]);
    const theirs = sim.ids.filter((id) => sim.owner[id] === 1 && sim.td(id).isUnit && !sim.td(id).isWorker && sim.alive[id]);
    sim.issue({ c: 'order', ord: 'attackMove', ids: mine, x: 86, y: 72, player: 0 }, false);
    sim.issue({ c: 'order', ord: 'attackMove', ids: theirs, x: 58, y: 72, player: 1 }, false);
    const cam = this.renderer.cam;
    cam.setTarget(72, 74, true);
    cam.targetHeight = cam.height = 40;
    this.bench = { t0: performance.now(), frames: [], done: false };
    this.hud.toast('Benchmark running for 20 s…');
  }
  private finishBenchmark() {
    const b = this.bench!;
    b.done = true;
    const f = b.frames.slice(5).sort((x, y) => x - y);
    const med = f[Math.floor(f.length / 2)] || 16.7;
    const p99 = f[Math.floor(f.length * 0.99)] || med;
    b.result = { medianFps: +(1000 / med).toFixed(1), low1Fps: +(1000 / p99).toFixed(1), units: this.sim.ids.filter((id) => this.sim.alive[id] && this.sim.td(id).isUnit).length, frames: f.length };
    (window as unknown as { __bench: unknown }).__bench = b.result;
    this.hud.toast(`Benchmark: median ${b.result.medianFps} FPS · 1% low ${b.result.low1Fps} FPS · ${b.result.units} units`);
    this.settings.showStats = true;
  }

  localFaction(): FactionId { return this.sim.players[Math.max(0, this.local)].faction.id; }

  // ------------------------------------------------------------ commands
  cmd(c: Omit<Command, 'player'>) {
    if (this.local < 0 || this.sim.over || this.paused) return;
    this.sim.issue({ ...c, player: this.local } as Command);
  }
  centerOnBase(snap = false) {
    const sim = this.sim;
    const p = Math.max(0, this.local);
    const hall = sim.ids.find((id) => sim.alive[id] && sim.owner[id] === p && TD[sim.type[id]].isHall);
    const s = sim.map.starts[p];
    const x = hall !== undefined ? sim.x[hall] : s.x, y = hall !== undefined ? sim.y[hall] : s.y;
    this.renderer.cam.setTarget(x, y + 3, snap);
  }
  lastAlertPos() { return this.alertPos; }
  debugLines(): string[] {
    if (!this.settings.showStats) return [];
    const sim = this.sim;
    const r = this.renderer;
    return [
      `FPS ${this.fps.toFixed(0)}  frame ${this.frameMs.toFixed(1)} ms`,
      `tick ${sim.tick}  entities ${sim.ids.length}  projectiles ${sim.projectiles.length}`,
      `draw calls ${r.drawCalls}  tris ${(r.triangles / 1000).toFixed(0)}k`,
      `fog ${this.fogEnabled ? 'on' : 'off'}  speed x${this.speed}`,
    ];
  }

  // ------------------------------------------------------------ loop
  private frame(now: number) {
    this.raf = requestAnimationFrame((t) => this.frame(t));
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.25) dt = 0.25;
    if (this.bench && !this.bench.done) this.bench.frames.push(dt * 1000);
    this.fpsAcc += dt; this.frames++;
    if (this.fpsAcc >= 0.5) { this.fps = this.frames / this.fpsAcc; this.frameMs = (this.fpsAcc / this.frames) * 1000; this.fpsAcc = 0; this.frames = 0; }
    const sim = this.sim;
    if (!this.paused && !this.renderer.lost) {
      this.acc += dt * this.speed;
      let steps = 0;
      while (this.acc >= DT && steps < 6) {
        this.acc -= DT;
        this.stepSim();
        steps++;
        if (sim.over) break;
      }
      if (steps >= 6) this.acc = 0;
    }
    this.input.update(dt);
    this.view = this.input.buildView();
    const alpha = this.paused ? 1 : Math.min(1, this.acc / DT);
    this.renderer.render(sim, alpha, dt, this.view);
    audio.setListener(this.renderer.cam.tx, this.renderer.cam.tz);
    this.hud.update(dt);
    this.tutorial?.update();
    if (this.tutorial?.marker && !this.tutorial.finished) {
      this.markerT -= dt;
      if (this.markerT <= 0) { this.markerT = 1.6; this.renderer.vfx.ring(this.tutorial.marker.x, 0.2, this.tutorial.marker.y, 0.5, 5, 1.4, 0x46e6d0); }
    }
    this.updateReplayBar();
    if (this.bench && !this.bench.done && performance.now() - this.bench.t0 > 20000) this.finishBenchmark();
    if (this.endTimer >= 0) {
      this.endTimer -= dt;
      if (this.endTimer < 0) void this.finish();
    }
  }

  private stepSim() {
    const sim = this.sim;
    // replay: inject recorded commands for this tick
    if (this.opts.replay) {
      const cmds = this.opts.replay.commands;
      while (this.replayIdx < cmds.length && (cmds[this.replayIdx].tick ?? 0) <= sim.tick) {
        sim.applyCommand(cmds[this.replayIdx++]);
      }
    }
    sim.step();
    const evs = sim.events;
    sim.events = [];
    this.handleEvents(evs);
    this.combat *= 0.995;
    if (sim.tick % 20 === 0) audio.setIntensity(Math.min(1, this.combat / 14));
    if (this.opts.replay && sim.tick % 100 === 0) this.verifyHash();
    if (sim.over && this.endTimer < 0 && !this.ended) {
      this.endTimer = 1.8;
      if (this.local >= 0) audio.ui_(sim.winner === this.local ? 'victory' : 'defeat');
      this.hud.setObjective('Result', sim.winner === this.local ? 'Victory' : 'Defeat');
    }
  }

  private verifyHash() {
    const rep = this.opts.replay!;
    const sim = this.sim;
    const rec = rep.hashes.find((h) => h[0] === sim.tick);
    const mine = sim.hashes.find((h) => h[0] === sim.tick);
    if (rec && mine) { if (rec[1] !== mine[1]) this.verified = 'mismatch'; else if (this.verified !== 'mismatch') this.verified = 'ok'; }
  }

  private handleEvents(evs: SimEvent[]) {
    if (!evs.length) return;
    const sim = this.sim, loc = this.local;
    this.renderer.handleEvents(sim, evs, this.view);
    const fac = (this.local >= 0 ? sim.players[this.local].faction.id : 'helix') as 'helix' | 'verdant';
    for (const ev of evs) {
      switch (ev.k) {
        case 'shot': {
          const vis = loc < 0 || sim.cellVisible(loc, ev.x, ev.y) || sim.cellVisible(loc, ev.tx ?? ev.x, ev.ty ?? ev.y);
          if (!vis) break;
          audio.world('shot_' + (ev.vis === 'weld' ? 'claw' : ev.vis ?? 'rifle'), ev.x, ev.y);
          this.combat += 0.25;
          break;
        }
        case 'hit': {
          if (loc >= 0 && !sim.cellVisible(loc, ev.x, ev.y)) break;
          audio.world((ev.a ?? 0) > 25 ? 'impact_big' : 'impact', ev.x, ev.y);
          this.combat += 0.3;
          break;
        }
        case 'death': {
          if (loc >= 0 && !sim.cellVisible(loc, ev.x, ev.y) && ev.owner !== loc) break;
          const td = TD[ev.a ?? 0];
          if (td.isNeutral || ev.text === 'cancel') break;
          audio.world(td.isStruct ? 'death_struct' : 'death', ev.x, ev.y);
          this.combat += td.isStruct ? 2 : 0.6;
          break;
        }
        case 'erupt': if (loc < 0 || sim.cellVisible(loc, ev.x, ev.y)) audio.world('erupt', ev.x, ev.y); break;
        case 'weld': if (loc < 0 || sim.cellVisible(loc, ev.x, ev.y)) audio.world('heal', ev.x, ev.y); break;
        case 'placed': if (ev.owner === loc) audio.world('build', ev.x, ev.y); break;
        case 'alert':
          if (ev.owner === loc || (ev.vis === 'pulse')) {
            this.hud.pushAlert(ev.text ?? '', ev.vis ?? 'info', ev.x, ev.y);
            if (ev.vis === 'attack') { this.alertPos = { x: ev.x, y: ev.y }; this.input.lastAlert = this.alertPos; audio.ui_('attack'); }
            else if (ev.vis === 'built') audio.ui_('complete');
            else if (ev.vis === 'trained') audio.ui_('trained', fac);
            else if (ev.vis === 'researched') audio.ui_('research');
            else if (ev.vis === 'supply') audio.ui_('supply');
            else if (ev.vis === 'depleted') audio.ui_('depleted');
            else if (ev.vis === 'captured') audio.ui_('captured');
            else if (ev.vis === 'pod') audio.ui_('pod');
            else if (ev.vis === 'pulse') audio.ui_('pulse');
            if (ev.vis === 'attack' || ev.vis === 'depleted') { /* ping handled by hud.pushAlert */ }
          }
          break;
        case 'invalid':
          if (ev.owner === loc) { this.hud.toast(ev.text ?? 'Invalid'); audio.ui_('error'); }
          break;
        case 'captured': if (ev.owner === loc) audio.ui_('captured'); break;
        case 'pod': if (ev.owner === loc) { audio.ui_('pod'); this.hud.pushAlert('Salvage pod: +100 Ore, +40 Flux', 'built', ev.x, ev.y); } break;
        default: break;
      }
    }
    this.hud.refresh(false);
  }

  // ------------------------------------------------------------ pause / end
  openPause() {
    if (this.pauseEl || this.ended) return;
    this.paused = true;
    this.input.enabled = false;
    this.pauseEl = this.app.showPauseMenu(this, () => this.closePause());
  }
  closePause() {
    this.pauseEl?.remove(); this.pauseEl = null;
    this.paused = false;
    this.input.enabled = true;
    this.last = performance.now();
    this.renderer.renderer.domElement.focus();
  }
  private showContextLost(lost: boolean) {
    if (lost && !this.lostEl) {
      this.paused = true;
      const el = document.createElement('div');
      el.className = 'ctxlost';
      el.innerHTML = '<div class="panelbox"><h2>Graphics context lost</h2><p class="help">The GPU driver reset the graphics context. The match is paused and will resume automatically if the context is restored.</p><button class="btn primary" id="cl-menu">Return to main menu</button></div>';
      this.root.appendChild(el);
      (el.querySelector('#cl-menu') as HTMLElement).onclick = () => this.app.exitToMenu();
      this.lostEl = el;
    } else if (!lost && this.lostEl) {
      this.lostEl.remove(); this.lostEl = null;
      if (!this.pauseEl) this.paused = false;
    }
  }

  private buildReplayBar() {
    const bar = document.createElement('div');
    bar.className = 'replaybar hudbox';
    bar.innerHTML = `<b style="letter-spacing:.2em;font-size:10px;color:#9fb3c4">REPLAY</b>
      <button class="btn small" data-s="0">Pause</button><button class="btn small" data-s="1">1×</button><button class="btn small" data-s="2">2×</button><button class="btn small" data-s="4">4×</button><button class="btn small" data-s="8">8×</button>
      <button class="btn small" data-a="fog">Fog: off</button><button class="btn small" data-a="exit">Exit</button><span id="rp-info" style="color:#9fb3c4;min-width:210px"></span>`;
    this.root.appendChild(bar);
    this.replayBar = bar;
    this.fogEnabled = false;
    bar.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest('button') as HTMLElement | null;
      if (!b) return;
      if (b.dataset.s !== undefined) { const s = parseInt(b.dataset.s, 10); if (s === 0) this.userPaused = !this.userPaused; else { this.speed = s; this.userPaused = false; } this.paused = this.userPaused; }
      if (b.dataset.a === 'fog') { this.fogEnabled = !this.fogEnabled; b.textContent = 'Fog: ' + (this.fogEnabled ? 'on' : 'off'); }
      if (b.dataset.a === 'exit') this.app.exitToMenu();
    });
  }
  private updateReplayBar() {
    if (!this.replayBar) return;
    const info = this.replayBar.querySelector('#rp-info') as HTMLElement;
    const rep = this.opts.replay!;
    const t = Math.floor(this.sim.tick / 20);
    const total = Math.floor(rep.ticks / 20);
    const v = this.verified === 'ok' ? '✓ hashes match' : this.verified === 'mismatch' ? '✗ HASH MISMATCH' : 'verifying…';
    info.textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')} / ${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')} · ${v}`;
  }

  private async finish() {
    if (this.ended) return;
    this.ended = true;
    await this.tutorial?.finalize();
    await this.app.onMatchEnd(this);
  }

  async onTutorialDone() { await this.app.markTutorialDone(); this.hud.pushAlert('Tutorial complete - badge earned', 'built', 0, 0); }

  replayRecord(): ReplayRecord {
    const sim = this.sim;
    return {
      id: 'r' + Date.now().toString(36), date: Date.now(), version: PROTOCOL_VERSION, cfg: sim.cfg, commands: sim.log.slice(), hashes: sim.hashes.slice(), ticks: sim.tick, winner: sim.winner,
      label: `${sim.players[0].faction.name} vs ${sim.players[1].faction.name}`,
    };
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    document.removeEventListener('visibilitychange', this.onVis);
    window.removeEventListener('resize', this.onResize);
    audio.stopMusic();
    this.input.detach();
    this.hud.dispose();
    this.renderer.dispose();
    this.pauseEl?.remove();
    this.root.remove();
  }
}
