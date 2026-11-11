// protocol/visibility filter: builds the team-filtered Snapshot a client is allowed to see.

import { XP_TABLE } from '../shared/heroes';
import { ITEMS } from '../shared/items';
import { GameEvent, HeroPublic, ObjectiveView, ProjView, ST, SelfView, Snapshot, TeamView, UnitView, ZoneView } from '../shared/protocol';
import { MONSTERS, RULES } from '../shared/units';
import { bountyOf, rooted, structVulnerable, totalShield } from './combat';
import { canShop } from './hero';
import type { Emitted, Unit } from './types';
import { pointVisible } from './vision';
import type { World } from './world';

const r2 = (v: number): number => Math.round(v * 100) / 100;

function statusBits(w: World, u: Unit, viewer: 0 | 1): number {
  let st = 0;
  for (const e of u.effects) {
    switch (e.type) {
      case 'stun':
        st |= ST.STUN;
        break;
      case 'root':
        st |= ST.ROOT;
        break;
      case 'slow':
        st |= ST.SLOW;
        break;
      case 'silence':
        st |= ST.SILENCE;
        break;
      case 'airborne':
        st |= ST.AIRBORNE;
        break;
      case 'reveal':
        st |= ST.REVEALED;
        break;
      case 'speed':
        st |= ST.HASTED;
        break;
      case 'parcel':
        st |= ST.PARCEL;
        break;
      case 'prism':
        st |= ST.MARKED;
        break;
      case 'empower':
        st |= ST.EMPOWERED;
        break;
      case 'dr':
        st |= ST.HARDENED;
        break;
      case 'blind':
        st |= ST.BLIND;
        break;
    }
  }
  if (u.brush >= 0) st |= ST.IN_BRUSH;
  if (u.struct && !structVulnerable(w, u)) st |= ST.INVULN;
  if (u.kind === 'ward' && u.disabledUntil > w.tick) st |= ST.DISABLED;
  if (u.hero) {
    const h = u.hero;
    if (h.recallUntil > 0) st |= ST.RECALL;
    if (h.casting) st |= ST.CHANNEL;
    if (h.heroId === 'vey' && (h.p.refractUntil ?? 0) >= w.tick && u.brush < 0) {
      // Refraction's warning glint: the owner's team always sees it, enemies only up close
      if (u.team === viewer) st |= ST.GLINT;
      else for (const e of w.heroes) if (e.team === viewer && e.alive && Math.hypot(e.x - u.x, e.y - u.y) < 5.5) st |= ST.GLINT;
    }
  }
  if (rooted(u)) st |= ST.ROOT;
  return st;
}

function unitView(w: World, u: Unit, viewer: 0 | 1): UnitView {
  return {
    id: u.id,
    k: u.kind,
    s: u.sub,
    t: u.team,
    x: r2(u.x),
    y: r2(u.y),
    f: r2(u.facing),
    r: u.radius,
    hp: Math.max(0, Math.round(u.hp)),
    mhp: Math.round(u.stats.maxHp),
    sh: Math.round(totalShield(u)),
    mp: Math.round(u.mana),
    mmp: Math.round(u.stats.maxMana),
    lvl: u.level,
    st: statusBits(w, u, viewer),
    an: u.anim,
    at: u.animAt,
    ad: u.animDur,
    tg: u.struct || u.hero ? u.attackTarget || (u.hero?.order.t === 'attack' ? u.hero.order.id : 0) : 0,
    rp: u.struct ? u.struct.ramp : 0,
    dead: u.struct && !u.alive ? true : undefined,
    nm: u.hero ? u.hero.name : undefined,
  };
}

export function heroPublic(w: World, u: Unit, viewer: 0 | 1 | -1): HeroPublic {
  const h = u.hero!;
  const vis = viewer < 0 || u.team === viewer || (u.alive && u.visUntil[viewer as 0 | 1] >= w.tick);
  const seen = viewer < 0 ? { x: u.x, y: u.y } : h.lastSeen[viewer as 0 | 1];
  return {
    id: u.id,
    hero: h.heroId,
    name: h.name,
    team: u.team as 0 | 1,
    bot: h.bot,
    lvl: h.level,
    k: h.k,
    d: h.d,
    a: h.a,
    cs: h.cs,
    items: h.inv.filter((s) => s && ITEMS[s.id].tier !== 'consumable').map((s) => s!.id),
    alive: u.alive,
    respawn: u.alive ? 0 : Math.max(0, Math.ceil((h.respawnAt - w.tick) / 30)),
    bounty: bountyOf(w, u),
    wards: h.wardsPlaced,
    dmg: Math.round(h.dmgHeroes),
    sdmg: Math.round(h.dmgStructs),
    taken: Math.round(h.dmgTaken),
    heal: Math.round(h.healing),
    gold: Math.round(h.goldEarned),
    obj: h.objectives,
    visible: vis && u.alive,
    x: r2(vis ? u.x : seen.x),
    y: r2(vis ? u.y : seen.y),
    hpPct: vis ? u.hp / u.stats.maxHp : -1,
  };
}

const BUFF_NAMES: Record<string, string> = {
  buff_brass: 'brass',
  buff_mist: 'mist',
  hot: 'draught',
  mot: 'phial',
  dr: 'bogskin',
  draft: 'draft',
  stun: 'stun',
  root: 'root',
  silence: 'silence',
  slow: 'slow',
  airborne: 'airborne',
  blind: 'hush',
  parcel: 'parcel',
  prism: 'prism',
  dot: 'burn',
  dotp: 'burn',
  reveal: 'revealed',
};

function selfView(w: World, u: Unit): SelfView {
  const h = u.hero!;
  const t = w.tick;
  const s = u.stats;
  const buffs: SelfView['buffs'] = [];
  for (const e of u.effects) {
    const id = BUFF_NAMES[e.type];
    if (id && !buffs.some((b) => b.id === id)) buffs.push({ id, left: (e.until - t) / 30, total: e.total / 30, n: 0 });
  }
  if (h.heroId === 'brannoch' && (h.p.stacks ?? 0) > 0) buffs.push({ id: 'stone', left: 0, total: 0, n: h.p.stacks });
  for (const b of w.teams[u.team as 0 | 1].buffs) if (b.until > t) buffs.push({ id: b.id, left: (b.until - t) / 30, total: b.id === 'colossus' ? RULES.colossusBuff : RULES.catalystBuff, n: 0 });
  let passive = 0;
  if (h.heroId === 'suri') passive = h.p.charge ?? 0;
  else if (h.heroId === 'vey') passive = Math.max(0, ((h.p.refractUntil ?? 0) - t) / 120);
  else if (h.heroId === 'brannoch') passive = (h.p.stacks ?? 0) / 4;
  else if (h.heroId === 'kesh') passive = 1 - Math.max(0, Math.min(1, ((h.p.healReady ?? 0) - t) / 120));
  return {
    id: u.id,
    gold: Math.floor(h.gold),
    xp: Math.round(h.xp),
    xpPrev: XP_TABLE[h.level - 1],
    xpNext: h.level >= XP_TABLE.length ? XP_TABLE[XP_TABLE.length - 1] : XP_TABLE[h.level],
    lvl: h.level,
    skillPts: h.skillPts,
    ranks: h.ranks.slice(),
    cds: h.cdUntil.map((c) => Math.max(0, (c - t) / 30)),
    cdMax: h.cdTotal.map((c) => c / 30),
    recast: h.recast.map((r) => !!r),
    talents: h.talents.slice(),
    inv: h.inv.map((x) => (x ? { ...x } : null)),
    itemCds: h.inv.map((x) => (x ? Math.max(0, ((h.itemCd[x.id] ?? 0) - t) / 30) : 0)),
    wardCharges: h.wardCharges,
    wardCd: h.wardCharges < RULES.wardCharges ? Math.max(0, (h.wardNextAt - t) / 30) : 0,
    wardsMax: RULES.wardCharges,
    stats: {
      ad: Math.round(s.ad),
      ap: Math.round(s.ap),
      as: r2(s.as),
      armor: Math.round(s.armor),
      ward: Math.round(s.ward),
      speed: r2(s.speed),
      haste: Math.round(s.haste),
      crit: Math.round(s.crit),
      range: s.range,
      hpRegen: r2(s.hpRegen),
      manaRegen: r2(s.manaRegen),
      lifesteal: Math.round(s.lifesteal),
      armorPen: s.armorPen,
      wardPen: s.wardPen,
    },
    buffs,
    inFountain: canShop(u),
    canUndo: h.undo.length > 0,
    recall: h.recallUntil > 0 ? (h.recallUntil - t) / 30 : 0,
    recallTotal: h.recallUntil > 0 ? (h.recallUntil - h.recallStart) / 30 : 0,
    alive: u.alive,
    respawn: u.alive ? 0 : Math.max(0, (h.respawnAt - t) / 30),
    orderTarget: h.order.t === 'attack' ? h.order.id : h.order.t === 'amove' ? h.order.tgt : 0,
    recap: !u.alive && h.recap ? h.recap.map((l) => ({ src: l.srcName, label: l.label, amount: Math.round(l.amount), type: l.type })) : null,
    passive,
    passiveN: h.heroId === 'brannoch' ? (h.p.stacks ?? 0) : 0,
  };
}

export function buildSnapshot(w: World, team: 0 | 1, heroId: number, emitted: Emitted[], paused: boolean, timeScale: number): Snapshot {
  const t = w.tick;
  const units: UnitView[] = [];
  for (const u of w.units) {
    if (u.struct) {
      units.push(unitView(w, u, team));
      continue;
    }
    if (!u.alive) continue;
    if (u.team !== team && u.visUntil[team] < t) continue; // fog filter
    units.push(unitView(w, u, team));
  }
  const projs: ProjView[] = [];
  for (const p of w.projs) {
    if (p.team !== team && !pointVisible(w, team, p.x, p.y)) continue;
    projs.push({ id: p.id, kind: p.kind, t: p.team, x: r2(p.x), y: r2(p.y), vx: r2(p.dx * p.speed), vy: r2(p.dy * p.speed), r: p.radius });
  }
  const zones: ZoneView[] = [];
  for (const z of w.zones) {
    if (z.kind === 'none') continue;
    if (z.team !== team) {
      const midVisible = z.shape !== 'circle' && pointVisible(w, team, z.x + Math.cos(z.ang) * z.r * 0.5, z.y + Math.sin(z.ang) * z.r * 0.5);
      if (!midVisible && !pointVisible(w, team, z.x, z.y)) continue;
    }
    zones.push({ id: z.id, kind: z.kind, t: z.team, shape: z.shape, x: r2(z.x), y: r2(z.y), r: z.r, w: z.w, ang: z.ang, arc: z.arc, t0: z.start, t1: z.armAt, t2: z.until, danger: z.hostile && z.team !== team });
  }
  const events: GameEvent[] = [];
  for (const e of emitted) {
    if (e.vis === 'all') events.push(e.ev);
    else if (e.vis === 'hero') {
      if (e.hero === heroId) events.push(e.ev);
    } else if (e.vis === 'team') {
      if (e.team === team) events.push(e.ev);
    } else if (pointVisible(w, team, e.x, e.y)) events.push(e.ev);
  }
  const me = w.byId.get(heroId);
  const teamView = (tm: 0 | 1): TeamView => ({
    kills: w.teams[tm].kills,
    towers: w.teams[tm].towers,
    gold: Math.round(w.teamGold(tm)),
    buffs: w.teams[tm].buffs.filter((b) => b.until > t).map((b) => ({ id: b.id, left: (b.until - t) / 30 })),
  });
  const objectives: ObjectiveView[] = [];
  for (const c of w.camps) {
    if (!MONSTERS[c.def.type].big) continue;
    const u = c.units.length ? w.byId.get(c.units[0]) : undefined;
    // objective HP is public knowledge
    objectives.push({ id: c.def.type, alive: c.alive, next: c.alive ? 0 : Math.max(0, (c.nextSpawn - t) / 30), hpPct: u ? u.hp / u.stats.maxHp : 0 });
  }
  const vision: number[] = [];
  for (const s of w.visionSrc[team]) vision.push(r2(s.x), r2(s.y), s.r);
  return {
    tick: t,
    time: t / 30,
    units,
    projs,
    zones,
    events,
    heroes: w.heroes.map((h) => heroPublic(w, h, team)),
    you: me?.hero ? selfView(w, me) : null,
    teams: [teamView(0), teamView(1)],
    objectives,
    vision,
    over: w.over ? { winner: w.over.winner, duration: w.over.tick / 30 } : null,
    paused,
    timeScale,
  };
}
