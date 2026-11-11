// client-runtime: match orchestration. Fixed 60 Hz input/prediction ticks are decoupled from rendering; the
// authoritative room runs elsewhere (Web Worker in Practice) and is reached only through the protocol.
import { AudioSys } from '../audio/audio';
import { K17 } from '../content/k17';
import { SUPPORT_BY_ID, SUPPORT_TUNING as ST } from '../content/kit';
import { ResolvedLoadout, resolveLoadout } from '../content/loadout';
import { MATS, zoneAt } from '../content/mapTypes';
import { DT, MATCH, TEAM_NAMES } from '../content/tuning';
import { WEAPON_BY_ID, WEAPONS } from '../content/weapons';
import type { PracticeOptions, Profile, Settings } from '../profile/profile';
import { decodeSnapshot, encodeCmd, PF, quantizeCmd, Snapshot, SnapSelf } from '../protocol/codec';
import { ENT, GameEvent, MatchConfig, MatchResult, PHASE_LIVE, PHASE_POST, PHASE_SUDDEN, PHASE_WARMUP, PROTOCOL_VERSION, RosterEntry, ServerMsg } from '../protocol/messages';
import { Character, CharacterPool, CharPose, TEAM_ACCENT } from '../render/characters';
import { EntityViews } from '../render/entities';
import { Renderer } from '../render/renderer';
import { Vfx } from '../render/vfx';
import { Viewmodel } from '../render/viewmodel';
import { eyeHeight } from '../sim/hitboxes';
import type { Rapier } from '../sim/physics';
import { BTN, currentSpread, InputCmd, PlayerState, recoilKick, SimEvent } from '../sim/player';
import { World } from '../sim/world';
import { BoardRow, Hud, HudState, HudTag, MiniDot, MiniLine } from '../ui/hud';
import { Autopilot } from './autopilot';
import { Input } from './input';
import { Interp } from './interp';
import { Connection, LATENCY_PRESETS, LatencySim, WorkerConnection } from './net';
import { Predictor } from './prediction';

export interface GameCallbacks {
  onResult(result: MatchResult): void;
  onError(code: string, detail: string): void;
  onPause(paused: boolean): void;
  onMatchReady(): void;
}

const SRC_NAMES: Record<string, string> = { melee: 'Melee', frag: 'Fragmentation Charge', sticky: 'Adhesive Charge', mine: 'Breach Mine', mortar: 'Mortar Mark', flight: 'Interdiction Flight' };
const srcName = (src: string): string => WEAPON_BY_ID[src]?.name ?? SRC_NAMES[src] ?? src;
const smooth = (t: number): number => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };

export class Game {
  readonly renderer: Renderer;
  readonly audio = new AudioSys();
  readonly hud: Hud;
  readonly input: Input;
  mode: 'attract' | 'match' = 'attract';
  demo = false;
  private world: World;
  private vfx: Vfx;
  private chars: CharacterPool;
  private ents: EntityViews;
  private vm: Viewmodel;
  private interp = new Interp();
  private conn: Connection | null = null;
  private pred: Predictor | null = null;
  private auto: Autopilot | null = null;
  private settings: Settings;
  private profile: Profile;
  private roster = new Map<number, RosterEntry>();
  private you = -1;
  private team: 0 | 1 = 0;
  private cfg: MatchConfig | null = null;
  private loadouts: ResolvedLoadout[] = [];
  private nextLoadout = 0;
  private self: SnapSelf | null = null;
  private snap: Snapshot | null = null;
  private wasAlive = false;
  private seq = 0;
  private acc = 0;
  private last = 0;
  private supportSel = 0;
  private ended = false;
  private paused = false;
  private eyeY = 1.68;
  private bob = 0;
  private stepDist = 0;
  private remote = new Map<number, { x: number; z: number; step: number; print: number; fireT: number }>();
  private pings: { x: number; y: number; z: number; t: number }[] = [];
  private flightImpact = new Map<number, number>();
  private strafes: { x: number; z: number; yaw: number; t: number; next: number }[] = [];
  private death = { x: 0, y: 0, z: 0, kx: 0, ky: 0, kz: 0, t: 0, yaw: 0 };
  private stats: BoardRow[] = [];
  private attractT = 0;
  private fps = 60;
  private state: HudState;
  private pose: CharPose = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, crouch: false, sprint: false, ads: false, reload: false, alive: true, speed: 0, weapon: 0, firing: false };
  private kickOut = { yaw: 0, pitch: 0 };
  private disposed = false;
  private netBytes = 0;
  private netRate = 0;
  private netT = 0;
  private indoor = 0;
  private scratchTags: HudTag[] = [];
  private scratchDots: MiniDot[] = [];
  private scratchLines: MiniLine[] = [];
  private lastSupports = 0;
  private recoverPrompt = '';

  constructor(private R: Rapier, canvas: HTMLCanvasElement, hudRoot: HTMLElement, profile: Profile, private cb: GameCallbacks) {
    this.profile = profile;
    this.settings = profile.settings;
    // The renderer keeps its own permanent collision world for light baking / probes; the prediction world is
    // rebuilt every match so breakable glass starts intact.
    this.world = new World(R, K17);
    this.renderer = new Renderer(canvas, new World(R, K17), K17, this.settings.quality, this.settings.renderScale);
    this.vfx = new Vfx(this.renderer.scene, this.renderer);
    this.chars = new CharacterPool(this.renderer.scene, this.renderer);
    this.ents = new EntityViews(this.renderer.scene, this.vfx, TEAM_ACCENT[this.settings.colorblind] ?? TEAM_ACCENT.off);
    this.vm = new Viewmodel(this.renderer.scene, this.renderer);
    this.hud = new Hud(hudRoot, K17);
    this.input = new Input(canvas, this.settings);
    this.state = this.blankState();
    this.applySettings(this.settings);
    this.input.onLockChange = (locked) => {
      if (this.mode !== 'match' || this.ended || this.demo) return;
      this.paused = !locked;
      this.cb.onPause(!locked);
    };
    this.input.onLockError = () => { if (this.mode === 'match' && !this.demo) this.cb.onError('pointerlock', 'The browser refused Pointer Lock. Click the game view and press Resume to try again.'); };
    this.input.onAction = (a, n) => {
      if (a === 'supportSelect') this.cycleSupport();
      else if (a === 'inspect') this.vm.inspect();
      else if (a === 'loadout' && n !== undefined && this.self && !this.self.alive && n < this.loadouts.length) { this.nextLoadout = n; this.conn?.send({ m: 'loadout', index: n }); this.audio.ui('click'); }
    };
    this.renderer.onContextLost = () => this.cb.onError('context', 'The graphics context was lost. The game will resume when the browser restores it.');
    this.renderer.onContextRestored = () => this.cb.onError('context-restored', '');
    document.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('resize', this.onResize);
    this.last = performance.now();
    this.renderer.engine.runRenderLoop(() => this.frame());
  }

  private onResize = (): void => this.renderer.resize();
  private onVisibility = (): void => {
    if (document.hidden) return;
    // returning to the tab: drop the stale snapshot buffer instead of fast-forwarding through it
    this.interp.reset();
    this.acc = 0;
    this.last = performance.now();
  };

  private blankState(): HudState {
    return {
      visible: false, alive: false, team: 0, health: 100, protect: false, revealed: false, weaponName: '', mag: 0, magSize: 30, reserve: 0, altName: '', altMag: 0, reloading: false,
      lethalName: '', lethalReady: 1, tacticalName: '', tacticalReady: 1, spread: 6, showCrosshair: true, scope: 0, score: [0, 0], scoreLimit: 75, timeLeft: 0, phase: 0, momentum: 0,
      supports: [], supportSel: 0, uplink: false, flash: 0, flashDark: false, smoke: 0, respawnIn: 0, loadoutNames: [], loadoutSel: 0, zone: '', showBoard: false,
      tags: [], dots: [], lines: [], selfX: 0, selfZ: 0, selfYaw: 0, debug: '', countdown: 0, prompt: '',
    };
  }

  applySettings(s: Settings): void {
    this.settings = s;
    this.input.rebind(s);
    this.audio.setVolumes(s.master, s.sfx, s.music);
    this.audio.hitSounds = s.hitSound;
    this.renderer.setQuality(s.quality, s.renderScale);
    const acc = TEAM_ACCENT[s.colorblind] ?? TEAM_ACCENT.off;
    this.chars.setAccents(s.colorblind);
    this.ents.setAccents(acc);
    document.documentElement.style.setProperty('--t0', acc[0]);
    document.documentElement.style.setProperty('--t1', acc[1]);
  }

  // ------------------------------------------------------------------ match lifecycle
  startMatch(profile: Profile, opts: PracticeOptions): void {
    this.leaveMatch(true);
    this.profile = profile;
    this.settings = profile.settings;
    // fresh collision world so breakable glass is intact again
    this.world.dispose();
    this.world = new World(this.R, K17);
    this.renderer.rebuildGlass();
    this.loadouts = profile.loadouts.map(resolveLoadout);
    this.nextLoadout = profile.selected;
    const cfg: MatchConfig = {
      seed: Math.floor(Math.random() * 1e9) + 1, teamSize: opts.teamSize, scoreLimit: opts.scoreLimit, timeLimit: opts.timeLimit,
      difficulty: opts.difficulty, warmup: MATCH.warmup, mapId: 'k17', humanTeam: opts.team,
    };
    this.cfg = cfg;
    const base = new WorkerConnection();
    const lat = LATENCY_PRESETS[opts.latency] ?? LATENCY_PRESETS.off;
    const conn = (this.conn = new LatencySim(base, lat));
    conn.onMessage = (m) => this.onServer(m);
    conn.onError = (d) => this.cb.onError('server', d);
    conn.send({ m: 'hello', version: PROTOCOL_VERSION, name: profile.name, loadouts: profile.loadouts, loadout: profile.selected, config: cfg });
    this.mode = 'match';
    this.ended = false;
    this.paused = false;
    this.seq = 0;
    this.acc = 0;
    this.you = -1;
    this.self = null; this.snap = null; this.pred = null;
    this.wasAlive = false;
    this.supportSel = 0; this.lastSupports = 0;
    this.interp.reset();
    this.hud.reset();
    this.vfx.clear();
    this.ents.clear();
    this.pings.length = 0; this.strafes.length = 0; this.flightImpact.clear(); this.remote.clear();
    this.input.enabled = true;
    this.input.resetLatches();
    this.audio.music('match');
    this.audio.setIntensity(0.35);
    if (this.demo) this.auto = new Autopilot();
  }

  leaveMatch(silent = false): void {
    if (this.conn) { this.conn.close(); this.conn = null; }
    this.mode = 'attract';
    this.pred = null;
    this.input.enabled = false;
    this.input.exitLock();
    this.state.visible = false;
    this.hud.frame(this.state, 0);
    this.chars.dispose();
    this.ents.clear();
    this.vfx.clear();
    this.roster.clear();
    if (!silent) this.audio.music('menu');
  }

  resume(): void { this.audio.unlock(); this.input.requestLock(); }
  isEnded(): boolean { return this.ended; }

  private cycleSupport(): void {
    if (!this.self) return;
    for (let i = 1; i <= 3; i++) {
      const t = (this.supportSel + i) % 3;
      if (this.self.supports & (1 << t)) { this.supportSel = t; this.audio.ui('click'); return; }
    }
  }

  // ------------------------------------------------------------------ network
  private onServer(m: ServerMsg): void {
    if (this.disposed) return;
    switch (m.m) {
      case 'welcome':
        this.you = m.you;
        this.roster.clear();
        for (const r of m.roster) this.roster.set(r.id, r);
        this.team = this.roster.get(m.you)!.team;
        this.pred = new Predictor(this.world, m.you, this.loadouts[this.nextLoadout]);
        this.stats = m.roster.map((r) => ({ id: r.id, name: r.name, team: r.team, bot: r.bot, kills: 0, deaths: 0, assists: 0, score: 0, me: r.id === m.you }));
        this.hud.setBoard(this.stats);
        this.cb.onMatchReady();
        break;
      case 'reject':
        this.cb.onError(m.code === 'version' ? 'version' : m.code === 'full' ? 'full' : 'loadout', m.detail);
        break;
      case 'snap': {
        const s = decodeSnapshot(m.data);
        if (!s) return;
        this.netBytes += m.data.byteLength;
        this.onSnapshot(s);
        break;
      }
      case 'events':
        for (const e of m.list) this.onEvent(e);
        break;
      case 'result':
        this.ended = true;
        this.input.enabled = false;
        this.input.exitLock();
        this.audio.music('menu');
        this.cb.onResult(m.result);
        break;
    }
  }

  private onSnapshot(s: Snapshot): void {
    const now = performance.now();
    this.interp.push(s, now);
    this.snap = s;
    const self = s.self;
    this.self = self;
    const pred = this.pred;
    if (!pred) return;
    const respawned = self.alive && !this.wasAlive;
    const lo = this.loadouts[Math.min(self.loadout, this.loadouts.length - 1)];
    if (pred.loadout !== lo) pred.setLoadout(lo);
    pred.setPhase(s.phase, s.timeLeft, now);
    pred.equipMult = self.uplink ? ST.uplinkRecharge : 1;
    pred.reconcile(self, s.ack, respawned, now);
    if (respawned) {
      this.input.resetLatches();
      this.vm.raise();
      this.hud.hideRecap();
      this.eyeY = self.state.py + eyeHeight(0);
      this.audio.ui('ready');
    }
    if (!self.alive && this.wasAlive) this.onDeath();
    this.wasAlive = self.alive;
    for (const id of this.world.syncGlass(s.glass)) this.renderer.breakGlass(id);
    // newly banked support actions: select the best one automatically
    if (self.supports & ~this.lastSupports) { for (let t = 2; t >= 0; t--) if ((self.supports & ~this.lastSupports) & (1 << t)) { this.supportSel = t; break; } }
    if (!(self.supports & (1 << this.supportSel))) { for (let t = 2; t >= 0; t--) if (self.supports & (1 << t)) { this.supportSel = t; break; } }
    this.lastSupports = self.supports;
  }

  private onDeath(): void {
    const st = this.pred?.prev ?? this.snap?.self.state;
    if (st) { this.death.x = st.px; this.death.y = st.py; this.death.z = st.pz; }
    this.death.t = 0;
    this.death.yaw = this.input.viewYaw;
    this.audio.death();
  }

  private name(id: number): string { return this.roster.get(id)?.name ?? '?'; }
  private teamOf(id: number): 0 | 1 { return this.roster.get(id)?.team ?? 0; }

  private onEvent(e: GameEvent): void {
    const hud = this.hud, audio = this.audio, cam = this.renderer.camera.position;
    switch (e.e) {
      case 'shot': {
        const w = WEAPONS[e.w];
        const ch = this.chars.chars.get(e.p);
        let ox = e.o[0], oy = e.o[1], oz = e.o[2];
        if (ch) { ch.computePoints(); ox = ch.muzzle.x; oy = ch.muzzle.y; oz = ch.muzzle.z; }
        const friendly = this.teamOf(e.p) === this.team;
        for (let i = 0; i < e.surf.length; i++) {
          const ex = e.ends[i * 3], ey = e.ends[i * 3 + 1], ez = e.ends[i * 3 + 2];
          if (i % 2 === 0 || e.surf.length === 1) this.vfx.tracer(ox, oy, oz, ex, ey, ez, friendly, false);
          if (e.surf[i]) this.impactAt(ex, ey, ez, ex - e.o[0], ey - e.o[1], ez - e.o[2], e.surf[i], i === 0);
        }
        const dx = e.ends[0] - e.o[0], dy = e.ends[1] - e.o[1], dz = e.ends[2] - e.o[2];
        const dl = Math.hypot(dx, dy, dz) || 1;
        this.vfx.muzzle(ox, oy, oz, dx / dl, dy / dl, dz / dl, e.sup);
        if (!e.sup && Math.hypot(ox - cam.x, oz - cam.z) < 30) { const l = this.renderer.muzzleLight; l.position.set(ox, oy, oz); l.intensity = Math.max(l.intensity, 2.2); }
        const occluded = !this.world.visible(cam.x, cam.y, cam.z, ox, oy, oz);
        audio.gunshot(w, { x: ox, y: oy, z: oz }, e.sup, occluded, this.indoor > 0.5);
        const r = this.remote.get(e.p);
        if (r) r.fireT = performance.now();
        break;
      }
      case 'hit': {
        const kind = e.device ? 'device' : e.kill ? 'kill' : e.zone === 0 ? 'head' : 'hit';
        hud.hitMarker(kind);
        audio.hitMarker(kind);
        if (!e.device) this.vfx.impact(e.x, e.y, e.z, 0, 0.3, 0, 6);
        break;
      }
      case 'dmg': {
        hud.damageFrom(e.fx, e.fz, e.amount);
        audio.damage(e.amount);
        const lo = this.pred?.loadout;
        const fl = Math.min(0.9, (e.amount / 40) * (lo ? lo.weapons[0].flinch : 0.5)); // capped flinch
        this.input.kick((Math.random() - 0.5) * fl, fl * 0.5, 12);
        this.vfx.shake = Math.max(this.vfx.shake, Math.min(0.5, e.amount / 80));
        break;
      }
      case 'kill': {
        const mine = e.killer === this.you || e.victim === this.you || e.assists.includes(this.you);
        hud.killFeed(this.name(e.killer), this.teamOf(e.killer), this.name(e.victim), this.teamOf(e.victim), srcName(e.src), e.head, mine);
        break;
      }
      case 'score':
        hud.scorePopup(e.label, e.amount);
        audio.ui('score');
        break;
      case 'recap':
        this.death.kx = e.kx; this.death.ky = e.ky; this.death.kz = e.kz;
        hud.showRecap(this.name(e.killer), this.teamOf(e.killer), srcName(e.src), e.dist, e.hits, e.killerHealth, e.killer === this.you);
        break;
      case 'explode': {
        const d = Math.hypot(e.x - cam.x, e.y - cam.y, e.z - cam.z);
        this.vfx.explosion(e.x, e.y, e.z, e.r, e.kind, d);
        audio.explosion({ x: e.x, y: e.y, z: e.z }, e.kind === 'flash' || e.kind === 'smoke' || e.kind === 'device' ? e.kind : 'frag');
        break;
      }
      case 'announce': this.announce(e.key, e.team, e.text); break;
      case 'support': this.onSupport(e); break;
      case 'supportReady': {
        const lo = this.pred?.loadout;
        const def = lo ? SUPPORT_BY_ID[lo.supports[e.tier]] : null;
        hud.announce(`${def ? def.name : 'Support'} ready`, 'Press 4 to deploy · 3 to cycle', 'gold', 3);
        audio.ui('ready');
        if (this.settings.subtitles) hud.subtitle(`Control: ${def ? def.name : 'Support action'} is ready.`);
        break;
      }
      case 'melee': {
        const p = this.interp.players.get(e.p);
        if (e.p !== this.you && p && Math.hypot(p.x - cam.x, p.z - cam.z) < 12) audio.melee(false);
        break;
      }
      case 'throw': if (e.p !== this.you) { const p = this.interp.players.get(e.p); if (p && Math.hypot(p.x - cam.x, p.z - cam.z) < 14) audio.throwSound(); } break;
      case 'glass': this.vfx.glassShatter(e.x, e.y, e.z); audio.glass({ x: e.x, y: e.y, z: e.z }); break;
      case 'stats': {
        for (let i = 0; i < e.rows.length; i += 5) {
          const row = this.stats.find((r) => r.id === e.rows[i]);
          if (row) { row.kills = e.rows[i + 1]; row.deaths = e.rows[i + 2]; row.assists = e.rows[i + 3]; row.score = e.rows[i + 4]; }
        }
        hud.setBoard(this.stats);
        break;
      }
      case 'ping': this.pings.push({ x: e.x, y: e.y, z: e.z, t: 5 }); audio.ui('ping'); break;
      case 'pickup': hud.scorePopup(e.kind === 'pod' ? 'Ammo Pod restock' : 'Ammo scavenged', 0); audio.ui('pickup'); break;
      case 'phase': if (e.phase === PHASE_POST) { this.input.enabled = false; } break;
      // view angles are client-owned, so the server tells us which way a fresh spawn faces
      case 'spawn': if (e.id === this.you) this.input.setView(e.yaw, 0); break;
      default: break;
    }
  }

  private impactAt(x: number, y: number, z: number, dx: number, dy: number, dz: number, surf: number, sound: boolean): void {
    const l = Math.hypot(dx, dy, dz) || 1;
    // recover the surface normal with a short local ray so decals sit flat
    const h = surf === 6 ? null : this.world.raycast(x - (dx / l) * 0.3, y - (dy / l) * 0.3, z - (dz / l) * 0.3, dx / l, dy / l, dz / l, 0.6, 'bullet');
    if (h) this.vfx.impact(x, y, z, h.nx, h.ny, h.nz, surf); else this.vfx.impact(x, y, z, -dx / l, -dy / l, -dz / l, surf);
    if (sound) this.audio.impact(surf, { x, y, z });
  }

  private announce(key: string, team: number | undefined, text?: string): void {
    const hud = this.hud, audio = this.audio, mine = team === this.team;
    const say = (line: string) => { if (this.settings.subtitles) hud.subtitle('Control: ' + line); };
    switch (key) {
      case 'warmup': hud.announce('Relay Station K-17', `Team Clash · first to ${this.cfg?.scoreLimit ?? 75}`, '', 4); break;
      case 'start': hud.announce('Engage', `You are ${TEAM_NAMES[this.team]}`, 'good', 2.5); audio.stinger('start'); say('Station is live. Clear them out.'); break;
      case 'lead': hud.announce(mine ? 'Lead taken' : 'Lead lost', '', mine ? 'good' : 'danger', 2); audio.stinger(mine ? 'lead' : 'behind'); say(mine ? 'We are ahead. Keep the pressure on.' : 'They have the lead. Take it back.'); break;
      case 'half': hud.announce(`${TEAM_NAMES[team ?? 0]} at the halfway mark`, '', mine ? 'good' : 'danger', 2.2); break;
      case 'near': hud.announce(mine ? 'Almost there' : 'Hostiles near the limit', mine ? 'Close it out' : 'Deny them', mine ? 'good' : 'danger', 2.6); audio.stinger('near'); this.audio.setIntensity(0.95); say(mine ? 'A few more and the station is ours.' : 'They are about to win this. Stop them.'); break;
      case 'sudden': hud.announce('Sudden death', 'First to +5 or lead at 60 seconds', 'gold', 4); audio.stinger('sudden'); this.audio.setIntensity(1); say('Scores level. Sudden death.'); break;
      case 'win': hud.announce(mine ? 'Victory' : 'Defeat', TEAM_NAMES[team ?? 0] + ' hold K-17', mine ? 'good' : 'danger', 6); audio.stinger(mine ? 'win' : 'loss'); break;
      case 'draw': hud.announce('Draw', 'Nobody holds K-17', 'gold', 6); audio.stinger('draw'); break;
      case 'supportDenied': hud.announce('Cannot deploy', text ?? '', 'danger', 2.4); audio.ui('deny'); break;
    }
  }

  private onSupport(e: Extract<GameEvent, { e: 'support' }>): void {
    const hud = this.hud, audio = this.audio, friendly = e.team === this.team;
    const pos = e.x !== undefined ? { x: e.x, y: e.y ?? 0, z: e.z ?? 0 } : null;
    const say = (line: string) => { if (this.settings.subtitles) hud.subtitle('Control: ' + line); };
    const who = e.owner >= 0 ? this.name(e.owner) : '';
    if (e.phase === 'start' || e.phase === 'warn') {
      switch (e.kind) {
        case 'recon': hud.announce(friendly ? 'Recon Sweep online' : 'Hostile Recon Sweep', friendly ? who : 'You are being scanned', friendly ? 'good' : 'danger'); audio.warning('recon', !friendly, null); say(friendly ? 'Sweep is up. Check your map.' : 'Enemy sweep in progress.'); break;
        case 'pod': if (friendly) { hud.announce('Ammo Pod deployed', who, 'good', 1.8); audio.warning('pod', false, null); } break;
        case 'drone': hud.announce(friendly ? 'Hunter Drone airborne' : 'Hostile Hunter Drone', friendly ? who : 'Shoot it down or stay under cover', friendly ? 'good' : 'danger'); audio.warning('drone', !friendly, null); say(friendly ? 'Drone is marking targets.' : 'Enemy drone overhead.'); break;
        case 'mortar': hud.announce(friendly ? 'Mortar Mark away' : 'Mortar Mark incoming', friendly ? who : 'Leave the red ring or get under a roof', friendly ? 'good' : 'danger', 3); audio.warning('mortar', !friendly, pos); say(friendly ? 'Shells are on the way.' : 'Incoming mortar. Move.'); break;
        case 'flight': hud.announce(friendly ? 'Interdiction Flight inbound' : 'Interdiction Flight inbound', friendly ? who : 'Get indoors or clear the marked lane', friendly ? 'good' : 'danger', 3.4); audio.warning('flight', !friendly, null); say(friendly ? 'Strike aircraft on approach.' : 'Enemy air strike. Get inside!'); break;
        case 'uplink': hud.announce(friendly ? 'Team Uplink active' : 'Hostile Team Uplink', friendly ? 'Faster equipment · shared assists' : 'Deny them kills for 20 seconds', friendly ? 'good' : 'danger'); audio.warning('uplink', !friendly, null); break;
      }
    } else if (e.phase === 'impact') {
      if (e.kind === 'flight' && pos) {
        const now = performance.now() / 1000;
        // bind the pass to the matching telegraph entity for the aircraft silhouette
        for (const en of this.interp.entities) if (en.type === ENT.FLIGHT && Math.abs(en.x - pos.x) + Math.abs(en.z - pos.z) < 2) this.flightImpact.set(en.id, now);
        this.strafes.push({ x: pos.x, z: pos.z, yaw: e.yaw ?? 0, t: 0, next: 0 });
      } else if (e.kind === 'recon' && friendly) audio.ui('ping');
    }
  }

  // ------------------------------------------------------------------ fixed tick: input -> prediction -> network
  private tick(now: number): void {
    const pred = this.pred, conn = this.conn;
    if (!pred || !conn || this.you < 0 || this.ended || !this.self) return; // wait for the first snapshot
    let s = this.input.sample();
    if (this.auto) s = this.auto.drive(this.input, this.interp, pred.state, this.team, this.roster, this.world, this.self);
    else if (this.paused) s = { mx: 0, mz: 0, buttons: 0, slot: s.slot };
    const cmd: InputCmd = quantizeCmd({ seq: ++this.seq, rt: this.interp.renderTick(now), mx: s.mx, mz: s.mz, yaw: this.input.viewYaw, pitch: this.input.viewPitch, buttons: s.buttons, slot: s.slot, sel: this.supportSel });
    if (pred.state) {
      const evs = pred.predict(cmd, now);
      for (let i = 0; i < evs.length; i++) this.onSimEvent(evs[i], pred.state);
    }
    const data = encodeCmd(cmd);
    conn.send({ m: 'cmd', data }, [data]);
  }

  /** Cosmetic feedback for locally predicted events (the server remains authoritative for outcomes). */
  private onSimEvent(ev: SimEvent, st: PlayerState): void {
    const lo = this.pred!.loadout, audio = this.audio;
    this.vm.onEvent(ev, lo);
    switch (ev.t) {
      case 'shot': {
        const w = lo.weapons[ev.slot];
        audio.gunshot(w.def, null, w.suppressed, false, this.indoor > 0.5);
        recoilKick(w, ev.burst, ev.ads, st.crouch === 1, this.you, ev.seq, this.kickOut);
        this.input.kick(this.kickOut.yaw, this.kickOut.pitch, w.def.recoil.settle);
        if (!w.suppressed) { const l = this.renderer.muzzleLight; l.position.copyFrom(this.renderer.camera.position); l.intensity = 3.2; }
        const mz = this.vm.muzzleWorld;
        for (let k = 0; k < ev.dirs.length; k += 3) {
          const dx = ev.dirs[k], dy = ev.dirs[k + 1], dz = ev.dirs[k + 2];
          const tr = this.world.traceBullet(ev.ox, ev.oy, ev.oz, dx, dy, dz, 220, w.def.penetration);
          const ex = ev.ox + dx * tr.end, ey = ev.oy + dy * tr.end, ez = ev.oz + dz * tr.end;
          if (k % 6 === 0) this.vfx.tracer(mz.x, mz.y, mz.z, ex, ey, ez, true, true);
          for (const wall of tr.walls) {
            if (wall.glass >= 0 && !wall.stopped) continue;
            const hx = ev.ox + dx * wall.t, hy = ev.oy + dy * wall.t, hz = ev.oz + dz * wall.t;
            const surf = { concrete: 1, metal: 2, wood: 3, glass: 4, dirt: 5 }[MATS[wall.mat].surf] ?? 1;
            this.vfx.impact(hx, hy, hz, wall.nx, wall.ny, wall.nz, surf);
            if (k === 0 && wall.stopped) audio.impact(surf, { x: hx, y: hy, z: hz });
          }
        }
        if (w.def.fire !== 'pump' && w.def.fire !== 'bolt') {
          const cy = Math.cos(st.yaw), sy = Math.sin(st.yaw);
          this.vfx.shellCasing(mz.x - sy * 0.25 + cy * 0.05, mz.y, mz.z - cy * 0.25 - sy * 0.05, cy * 2.2 + st.vx, 1.8, -sy * 2.2 + st.vz);
        } else setTimeout(() => (w.def.fire === 'pump' ? audio.pump() : audio.reloadStage(3)), w.def.fire === 'pump' ? 180 : 320);
        break;
      }
      case 'dry': audio.dryFire(); break;
      case 'reload': audio.reloadStage(0); break;
      case 'reloadStage': audio.reloadStage(ev.stage); break;
      case 'shell': audio.shell(); break;
      case 'swapStart': audio.swap(); break;
      case 'melee': audio.melee(false); break;
      case 'cook': audio.pin(); break;
      case 'throw': audio.throwSound(); break;
      case 'land': audio.land(ev.speed); if (ev.speed > 4) this.vfx.dust(st.px, st.py, st.pz, 4); break;
      case 'mantle': audio.mantle(); break;
      case 'jump': audio.footstep('concrete', null, 0.7); break;
      default: break;
    }
  }

  // ------------------------------------------------------------------ render frame
  private frame(): void {
    if (this.disposed) return;
    const now = performance.now();
    const dt = Math.min(0.1, Math.max(0.0005, (now - this.last) / 1000));
    this.last = now;
    this.fps += (1 / dt - this.fps) * 0.05;
    if (this.mode === 'attract') {
      this.attractT += dt;
      const a = this.attractT * 0.045 + 0.6, r = 70;
      this.attractCam(a, r);
      this.vm.update({ dt, state: null, lo: null, mouseDx: 0, mouseDy: 0, vfov: 1, vmFovH: 65, bobScale: 0, hidden: true, teamColor: [0, 0, 0] });
      this.vfx.update(dt);
      this.renderer.render(dt);
      return;
    }
    (this.conn as LatencySim | null)?.pump();
    this.acc += dt;
    let n = 0;
    while (this.acc >= DT && n < 5) { this.tick(now); this.acc -= DT; n++; }
    if (n === 5) this.acc = 0;
    const alpha = this.acc / DT;
    this.input.frame(dt);
    this.interp.sample(now);
    this.netT += dt;
    if (this.netT >= 1) { this.netRate = this.netBytes / this.netT / 1024; this.netBytes = 0; this.netT = 0; }
    this.updateView(dt, alpha, now);
    this.vfx.update(dt);
    this.renderer.render(dt);
  }

  private attractCam(a: number, r: number): void {
    const x = Math.sin(a) * r, z = -Math.cos(a) * r * 0.82, y = 17 + Math.sin(this.attractT * 0.11) * 3;
    const yaw = Math.atan2(-x, -z + 4);
    const pitch = Math.atan2(4 - y, Math.hypot(x, z));
    this.renderer.setCamera(x, y, z, yaw, pitch, 0, 0.92);
  }

  private vfovBase(): number { return 2 * Math.atan(Math.tan((this.settings.fov * Math.PI) / 360) * (9 / 16)); }

  private updateView(dt: number, alpha: number, now: number): void {
    const pred = this.pred, self = this.self, snap = this.snap, st = pred?.state ?? null;
    const hs = this.state;
    const R = this.renderer, cam = R.camera;
    if (!pred || !self || !snap) { hs.visible = false; this.hud.frame(hs, dt); return; }
    pred.decay(dt);
    const lo = pred.loadout;
    const base = this.vfovBase();
    let vfov = base, scope = 0, camX = 0, camY = 0, camZ = 0, yaw = this.input.viewYaw, pitch = this.input.viewPitch, roll = 0;
    const mdx = this.input.frameDx, mdy = this.input.frameDy;
    this.input.frameDx = 0; this.input.frameDy = 0;
    const motion = this.settings.reducedMotion ? 0.25 : 1;
    if (st && self.alive) {
      const prev = pred.prev ?? st;
      const px = prev.px + (st.px - prev.px) * alpha + pred.errX, py = prev.py + (st.py - prev.py) * alpha + pred.errY, pz = prev.pz + (st.pz - prev.pz) * alpha + pred.errZ;
      const ct = prev.crouchT + (st.crouchT - prev.crouchT) * alpha;
      const eyeTarget = py + eyeHeight(ct);
      // smooth the vertical only while grounded (hides step-ups); airborne motion is exact
      if (st.grounded && Math.abs(eyeTarget - this.eyeY) < 0.6) this.eyeY += (eyeTarget - this.eyeY) * (1 - Math.exp(-28 * dt)); else this.eyeY = eyeTarget;
      const speed = Math.hypot(st.vx, st.vz);
      const w = lo.weapons[st.slot];
      const adsE = smooth(st.adsT);
      const zoom = 1 + (w.adsZoom - 1) * adsE;
      vfov = 2 * Math.atan(Math.tan(base / 2) / zoom);
      if (st.sprint && !this.settings.reducedMotion) vfov *= 1.035;
      // ADS sensitivity scales with the optic's focal length (monitor-distance style), blended over the ADS transition
      this.input.sensScale = 1 + (this.settings.adsSens * (Math.tan(vfov / 2) / Math.tan(base / 2)) - 1) * adsE;
      if (w.adsZoom >= 3.5) scope = smooth((st.adsT - 0.82) / 0.18);
      // decorative camera layers (never touch the aim ray)
      if (st.grounded) this.bob += dt * speed * 1.32;
      const bobAmt = Math.min(1, speed / 6) * this.settings.bob * motion * (1 - adsE * 0.8);
      camX = px; camZ = pz;
      camY = this.eyeY + Math.abs(Math.sin(this.bob)) * 0.022 * bobAmt - 0.011 * bobAmt;
      roll = Math.sin(this.bob) * 0.0035 * bobAmt + (st.vx * Math.cos(st.yaw) - st.vz * Math.sin(st.yaw)) * -0.0018 * motion;
      const sh = this.vfx.shake * this.settings.shake * motion;
      if (sh > 0.002) { yaw += (Math.random() - 0.5) * 0.03 * sh; pitch += (Math.random() - 0.5) * 0.03 * sh; roll += (Math.random() - 0.5) * 0.02 * sh; }
      // local footsteps
      if (st.grounded && speed > 1.6) {
        this.stepDist += speed * dt;
        const stride = st.sprint ? 2.5 : st.crouch ? 1.7 : 2.1;
        if (this.stepDist > stride) { this.stepDist = 0; this.audio.footstep(this.surfaceAt(px, py, pz), null, st.sprint ? 1 : st.crouch ? 0.35 : 0.7); }
      }
      this.audio.setIntensity(snap.phase === PHASE_SUDDEN ? 1 : Math.max(0.35, Math.max(snap.score0, snap.score1) / Math.max(1, this.cfg?.scoreLimit ?? 75)));
    } else {
      // death view: pull back from the body and turn toward the killer
      const d = this.death;
      d.t += dt;
      const u = Math.min(1, d.t / 1.1);
      let dx = d.kx - d.x, dz = d.kz - d.z;
      const dl = Math.hypot(dx, dz);
      if (dl > 0.5) { dx /= dl; dz /= dl; } else { dx = Math.sin(d.yaw); dz = Math.cos(d.yaw); }
      const back = 2.6 * smooth(u), up = 1.3 + 0.9 * smooth(u);
      let cx = d.x - dx * back, cz = d.z - dz * back;
      const cy = d.y + up;
      // keep the camera out of walls
      const h = this.world.raycast(d.x, d.y + 1.3, d.z, -dx, 0, -dz, back + 0.3, 'bullet');
      if (h) { cx = d.x - dx * Math.max(0, h.t - 0.3); cz = d.z - dz * Math.max(0, h.t - 0.3); }
      camX = cx; camY = cy; camZ = cz;
      const tyaw = Math.atan2(dx, dz);
      let dy = tyaw - d.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
      d.yaw += dy * (1 - Math.exp(-3 * dt));
      yaw = d.yaw; pitch = -0.28 * smooth(u);
      vfov = base;
      this.input.sensScale = 1;
    }
    R.setCamera(camX, camY, camZ, yaw, pitch, roll, vfov);
    const cp = Math.cos(pitch);
    this.audio.setListener(camX, camY, camZ, Math.sin(yaw) * cp, Math.sin(pitch), Math.cos(yaw) * cp);
    const zn = zoneAt(K17, camX, camY - 0.5, camZ);
    this.indoor += ((zn && zn.indoor ? 1 : 0) - this.indoor) * (1 - Math.exp(-4 * dt));
    this.audio.setIndoor(this.indoor);

    // viewmodel
    const acc = TEAM_ACCENT[this.settings.colorblind] ?? TEAM_ACCENT.off;
    this.vm.update({
      dt, state: self.alive ? st : null, lo, mouseDx: mdx, mouseDy: mdy, vfov, vmFovH: this.settings.vmFov, bobScale: this.settings.bob * motion,
      hidden: !self.alive || scope > 0.5 || snap.phase === PHASE_POST, teamColor: this.team === 0 ? [0.19, 0.24, 0.31] : [0.37, 0.31, 0.23],
    });
    void acc;

    // remote operators
    const tags = this.scratchTags, dots = this.scratchDots, lines = this.scratchLines;
    tags.length = 0; dots.length = 0; lines.length = 0;
    const vp = R.scene.getTransformMatrix().m;
    const W = R.canvas.clientWidth, H = R.canvas.clientHeight;
    const project = (x: number, y: number, z: number): [number, number, number] | null => {
      const w = vp[3] * x + vp[7] * y + vp[11] * z + vp[15];
      if (w < 0.2) return null;
      const sx = (vp[0] * x + vp[4] * y + vp[8] * z + vp[12]) / w, sy = (vp[1] * x + vp[5] * y + vp[9] * z + vp[13]) / w;
      if (sx < -1.1 || sx > 1.1 || sy < -1.1 || sy > 1.1) return null;
      return [(sx * 0.5 + 0.5) * W, (1 - (sy * 0.5 + 0.5)) * H, w];
    };
    const fx = Math.sin(yaw) * cp, fy = Math.sin(pitch), fz = Math.cos(yaw) * cp;
    const pose = this.pose;
    const trace = lo.perks.trace;
    for (const rp of this.interp.players.values()) {
      const info = this.roster.get(rp.id);
      if (!info) continue;
      const ch = this.chars.get(rp.id, info.team);
      if (!rp.present) { ch.setVisible(false); continue; }
      ch.setVisible(true);
      const alive = (rp.flags & PF.ALIVE) !== 0;
      const speed = Math.hypot(rp.vx, rp.vz);
      let rem = this.remote.get(rp.id);
      if (!rem) { rem = { x: rp.x, z: rp.z, step: 0, print: 0, fireT: 0 }; this.remote.set(rp.id, rem); }
      pose.x = rp.x; pose.y = rp.y; pose.z = rp.z; pose.yaw = rp.yaw; pose.pitch = rp.pitch;
      pose.crouch = (rp.flags & PF.CROUCH) !== 0; pose.sprint = (rp.flags & PF.SPRINT) !== 0; pose.ads = (rp.flags & PF.ADS) !== 0; pose.reload = (rp.flags & PF.RELOAD) !== 0;
      pose.alive = alive; pose.speed = speed; pose.weapon = rp.weapon; pose.firing = now - rem.fireT < 150;
      const enemy = info.team !== this.team;
      const glint = enemy && alive && pose.ads && WEAPONS[rp.weapon]?.glint === true;
      ch.update(dt, pose, glint);
      if (alive) {
        const moved = Math.hypot(rp.x - rem.x, rp.z - rem.z);
        rem.x = rp.x; rem.z = rp.z;
        if (moved < 3) {
          rem.step += moved;
          if (rem.step > (pose.sprint ? 2.5 : 2.1) && speed > 1.5) {
            rem.step = 0;
            const d = Math.hypot(rp.x - camX, rp.z - camZ);
            if (d < 26) this.audio.footstep(this.surfaceAt(rp.x, rp.y, rp.z), { x: rp.x, y: rp.y, z: rp.z }, pose.sprint ? 1 : pose.crouch ? 0.3 : 0.6);
          }
          if (trace && enemy && pose.sprint) { rem.print += moved; if (rem.print > 1.3) { rem.print = 0; this.vfx.footprint(rp.x, rp.y, rp.z, rp.yaw); } }
        }
        // tags + minimap
        const hy = rp.y + (pose.crouch ? 1.45 : 2.0);
        if (!enemy) {
          dots.push({ x: rp.x, z: rp.z, kind: 'mate', yaw: rp.yaw });
          const d = Math.hypot(rp.x - camX, rp.z - camZ);
          if (d < 70) { const p = project(rp.x, hy, rp.z); if (p) tags.push({ x: p[0], y: p[1], text: info.name, kind: 'mate', alpha: d < 6 ? 0.45 : 0.9 }); }
        } else {
          if (rp.flags & PF.REVEALED) dots.push({ x: rp.x, z: rp.z, kind: 'enemy' });
          if (rp.flags & PF.MARKED) { const p = project(rp.x, hy, rp.z); if (p) tags.push({ x: p[0], y: p[1], text: '', kind: 'mark', alpha: 0.95 }); }
          else if (self.alive) {
            // enemy name only when the crosshair is on a visible target
            const ex = rp.x - camX, ey = rp.y + 1.2 - camY, ez = rp.z - camZ, d = Math.hypot(ex, ey, ez);
            if (d < 70 && d > 0.1 && (ex * fx + ey * fy + ez * fz) / d > 0.9988 && this.world.visible(camX, camY, camZ, rp.x, rp.y + 1.2, rp.z)) {
              const p = project(rp.x, hy, rp.z);
              if (p) tags.push({ x: p[0], y: p[1], text: info.name, kind: 'enemy', alpha: 1 });
            }
          }
        }
      }
    }
    // own body is only visible in the death view
    if (this.you >= 0) {
      const me = this.chars.get(this.you, this.team);
      if (!self.alive && snap.phase !== PHASE_WARMUP) {
        me.setVisible(true);
        pose.x = this.death.x; pose.y = this.death.y; pose.z = this.death.z; pose.yaw = this.input.viewYaw; pose.pitch = 0;
        pose.crouch = false; pose.sprint = false; pose.ads = false; pose.reload = false; pose.alive = false; pose.speed = 0; pose.weapon = lo.weapons[0].def.idx; pose.firing = false;
        me.update(dt, pose, false);
      } else me.setVisible(false);
    }

    // entities, telegraphs and strafing runs
    const nowS = now / 1000;
    this.ents.update(dt, this.interp.entities, this.flightImpact, nowS);
    for (const e of this.interp.entities) {
      const mine = e.team === this.team;
      if (e.type === ENT.MORTAR) {
        if (!mine) { dots.push({ x: e.x, z: e.z, kind: 'danger', r: ST.mortarRadius }); const p = project(e.x, e.y + 1.6, e.z); if (p) tags.push({ x: p[0], y: p[1], text: `MORTAR ${Math.hypot(e.x - camX, e.z - camZ).toFixed(0)} m`, kind: 'warn', alpha: 1 }); }
        else dots.push({ x: e.x, z: e.z, kind: 'ping' });
      } else if (e.type === ENT.FLIGHT) {
        lines.push({ x: e.x, z: e.z, yaw: (e.a / 255) * Math.PI * 2, len: ST.flightLength, width: ST.flightWidth });
      } else if (e.type === ENT.POD || e.type === ENT.DRONE) {
        if (mine) { dots.push({ x: e.x, z: e.z, kind: 'device' }); if (e.type === ENT.POD) { const p = project(e.x, e.y + 1.5, e.z); if (p) tags.push({ x: p[0], y: p[1], text: 'AMMO POD', kind: 'pod', alpha: 0.9 }); } }
        else if (e.type === ENT.DRONE) { const p = project(e.x, e.y + 0.6, e.z); if (p) tags.push({ x: p[0], y: p[1], text: 'DRONE', kind: 'eq', alpha: 0.9 }); }
      } else if (!mine && lo.perks.munitions && (e.type === ENT.MINE || e.type === ENT.FRAG || e.type === ENT.STICKY || e.type === ENT.DART)) {
        if (Math.hypot(e.x - camX, e.z - camZ) < 18) { const p = project(e.x, e.y + 0.4, e.z); if (p) tags.push({ x: p[0], y: p[1], text: e.type === ENT.MINE ? 'MINE' : e.type === ENT.DART ? 'DART' : 'CHARGE', kind: 'eq', alpha: 1 }); }
      } else if (e.type === ENT.FRAG && Math.hypot(e.x - camX, e.z - camZ) < 8) {
        const p = project(e.x, e.y + 0.4, e.z); if (p) tags.push({ x: p[0], y: p[1], text: 'FRAG', kind: 'warn', alpha: 1 });
      }
    }
    for (let i = this.strafes.length - 1; i >= 0; i--) {
      const s = this.strafes[i];
      s.t += dt;
      while (s.next < s.t && s.next < ST.flightDuration) {
        const front = (s.next / ST.flightDuration) * ST.flightLength;
        for (const side of [-1, 1]) {
          const lat = side * (0.8 + Math.random() * 2.2);
          const x = s.x + Math.sin(s.yaw) * front + Math.cos(s.yaw) * lat, z = s.z + Math.cos(s.yaw) * front - Math.sin(s.yaw) * lat;
          const g = this.world.raycast(x, 30, z, 0, -1, 0, 40, 'bullet');
          const y = g ? 30 - g.t : 0;
          this.vfx.strafeHit(x, y, z);
          if (Math.random() < 0.5) this.audio.explosion({ x, y, z }, 'device');
        }
        const d = Math.hypot(s.x + Math.sin(s.yaw) * front - camX, s.z + Math.cos(s.yaw) * front - camZ);
        this.vfx.shake = Math.max(this.vfx.shake, Math.max(0, 0.9 - d / 30));
        s.next += 0.045;
      }
      if (s.t > ST.flightDuration + 0.5) this.strafes.splice(i, 1);
    }
    for (let i = this.pings.length - 1; i >= 0; i--) {
      const pg = this.pings[i];
      pg.t -= dt;
      if (pg.t <= 0) { this.pings.splice(i, 1); continue; }
      dots.push({ x: pg.x, z: pg.z, kind: 'ping', alpha: Math.min(1, pg.t) });
      const p = project(pg.x, pg.y + 0.4, pg.z);
      if (p) tags.push({ x: p[0], y: p[1], text: `${Math.hypot(pg.x - camX, pg.z - camZ).toFixed(0)} m`, kind: 'ping', alpha: Math.min(1, pg.t) });
    }

    // HUD state
    hs.visible = true;
    hs.alive = self.alive;
    hs.team = this.team;
    hs.health = self.health;
    hs.protect = self.protect && self.alive;
    hs.revealed = self.revealed && self.alive;
    hs.uplink = self.uplink;
    hs.phase = snap.phase;
    hs.timeLeft = snap.timeLeft;
    hs.score[0] = snap.score0; hs.score[1] = snap.score1;
    hs.scoreLimit = snap.phase === PHASE_SUDDEN ? Math.max(snap.score0, snap.score1) + 1 : this.cfg?.scoreLimit ?? 75;
    hs.momentum = self.momentum;
    hs.flash = self.flash; hs.flashDark = this.settings.flashDark;
    hs.smoke = this.vfx.insideSmoke(camX, camY, camZ);
    hs.respawnIn = self.respawnIn;
    hs.loadoutSel = this.nextLoadout;
    if (hs.loadoutNames.length !== this.loadouts.length) hs.loadoutNames = this.loadouts.map((l) => l.src.name);
    hs.showBoard = this.input.scoreboard || snap.phase === PHASE_POST;
    hs.zone = zn ? zn.name : 'Station grounds';
    hs.selfX = camX; hs.selfZ = camZ; hs.selfYaw = yaw;
    hs.countdown = snap.phase === PHASE_WARMUP ? snap.timeLeft : 0;
    hs.scope = scope;
    hs.supportSel = this.supportSel;
    if (hs.supports.length !== 3) hs.supports = [0, 1, 2].map(() => ({ name: '', cost: 0, ready: false, blocked: false }));
    for (let t = 0; t < 3; t++) {
      const def = SUPPORT_BY_ID[lo.supports[t]];
      const sp = hs.supports[t];
      sp.name = def.name; sp.cost = def.cost; sp.ready = (self.supports & (1 << t)) !== 0; sp.blocked = t === 2 && self.tier8Busy && sp.ready;
    }
    if (st && self.alive) {
      const w = lo.weapons[st.slot], o = lo.weapons[st.slot ? 0 : 1];
      hs.weaponName = w.def.name;
      hs.mag = st.slot ? st.mag1 : st.mag0; hs.magSize = w.mag; hs.reserve = st.slot ? st.res1 : st.res0;
      hs.altName = o.def.name; hs.altMag = st.slot ? st.mag0 : st.mag1;
      hs.reloading = st.reloadT >= 0;
      hs.lethalName = lo.lethal.id; hs.lethalReady = st.lethal >= 1 ? 1 : st.lethalRe / lo.lethal.recharge;
      hs.tacticalName = lo.tactical.id; hs.tacticalReady = st.tactical >= 1 ? 1 : st.tacticalRe / lo.tactical.recharge;
      const spreadPx = (Math.tan((currentSpread(st, w) * Math.PI) / 180) / Math.tan(vfov / 2)) * (H / 2);
      hs.spread = Math.max(3, Math.min(90, spreadPx));
      hs.showCrosshair = st.adsT < 0.6 && !st.sprint && st.mantleT < 0 && snap.phase !== PHASE_POST;
      const mag = hs.mag;
      hs.prompt = st.reloadT >= 0 ? '' : mag === 0 && hs.reserve === 0 ? 'Out of ammo · switch weapon [2]' : mag === 0 ? 'Reloading' : mag <= w.mag * 0.25 ? 'Low ammo · reload [R]' : '';
      dots.push({ x: st.px, z: st.pz, kind: 'self', yaw });
    } else { hs.showCrosshair = false; hs.prompt = ''; hs.reloading = false; }
    if (snap.phase === PHASE_LIVE && this.recoverPrompt) hs.prompt = this.recoverPrompt;
    hs.tags = tags; hs.dots = dots; hs.lines = lines;
    hs.debug = this.settings.showFps
      ? `${this.fps.toFixed(0)} fps  ${this.netRate.toFixed(1)} KB/s down\nrecon ${pred.stats.reconciles} snap ${pred.stats.snaps} err ${(pred.stats.lastError * 100).toFixed(1)} cm\nrtt ${pred.stats.rttMs.toFixed(0)} ms pending ${pred.stats.pending} delay ${(this.interp.delayTicks * 16.7).toFixed(0)} ms age ${this.interp.snapshotAgeMs.toFixed(0)} ms`
      : '';
    this.recoverPrompt = this.interp.snapshotAgeMs > 1500 && !this.ended ? 'Connection to the match server interrupted…' : '';
    this.hud.frame(hs, dt);
  }

  private surfaceAt(x: number, y: number, z: number): string {
    const h = this.world.raycast(x, y + 0.4, z, 0, -1, 0, 1.2, 'bullet');
    return h ? MATS[h.mat].surf : 'concrete';
  }

  /** Debug / automated-test hooks. */
  debugInfo(): Record<string, unknown> {
    return {
      mode: this.mode, you: this.you, alive: this.self?.alive, health: this.self?.health, phase: this.snap?.phase, score: this.snap ? [this.snap.score0, this.snap.score1] : null,
      fps: this.fps, recon: this.pred?.stats, kb: this.netRate, players: this.interp.players.size, tick: this.snap?.tick, ended: this.ended,
      me: this.stats.find((r) => r.me) ?? null,
    };
  }

  dispose(): void {
    this.disposed = true;
    this.leaveMatch(true);
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('resize', this.onResize);
    this.input.dispose();
    this.renderer.dispose();
  }
}
