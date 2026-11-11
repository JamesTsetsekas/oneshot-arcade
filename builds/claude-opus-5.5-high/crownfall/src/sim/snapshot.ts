// Team-filtered snapshot serialization. Fog filtering happens BEFORE serialization:
// hidden enemy transforms never enter the message.
import type { Match } from './match';
import { scoreRows } from './match';
import type { Snapshot, EntView, PrivateState, StructureView, ObjectiveView } from '../protocol/messages';
import { K } from '../protocol/messages';
import { statusFlags, shieldTotal } from './combat';
import { packFog } from './fog';
import { abilityDef } from './abilities';
import { KITS } from './abilities';
import { ITEMS, TALENTS } from '../shared/items';
import * as R from '../shared/rules';
import { inFountain, Team } from '../shared/map';
import type { Unit } from './types';

const r2 = (v: number) => Math.round(v * 100) / 100;

function kindOf(u: Unit, team: 0 | 1): number {
  switch (u.kind) {
    case 'hero': return K.Hero;
    case 'minion': return K.Minion;
    case 'tower': return K.Tower;
    case 'seal': return K.Seal;
    case 'core': return K.Core;
    case 'engine': return K.Engine;
    case 'monster': return K.Monster;
    case 'ward': return K.Ward;
    case 'wall': return K.Wall;
    case 'fountain': return K.Fountain;
    // enemies cannot tell a decoy from the real hero
    case 'decoy': return u.team === team ? K.Decoy : K.Hero;
  }
  return 0;
}

export function entityView(m: Match, u: Unit, team: 0 | 1): EntView {
  const v: EntView = {
    id: u.id, k: kindOf(u, team), tm: u.team, x: r2(u.x), y: r2(u.y), f: r2(u.facing),
    hp: Math.round(u.hp), mhp: Math.round(u.stats.maxHp), sh: Math.round(shieldTotal(u)), st: statusFlags(m, u), sub: u.sub,
    an: u.anim, at: r2(u.animT), r: u.radius,
  };
  if (u.hero) {
    v.lv = u.hero.level; v.name = u.hero.name;
    if (u.team === team) { v.mana = Math.round(u.mana); v.mmana = Math.round(u.stats.maxMana); }
    if (u.dash?.airborne) v.an = 7;
    else if (u.dash) v.an = 6;
    if (!u.alive) v.an = 5;
  }
  if (u.kind === 'decoy') {
    const o = m.byId.get(u.decoy!.owner);
    v.lv = o?.hero?.level; v.name = o?.hero?.name;
    if (u.team !== team) { v.id = u.id; v.mhp = Math.round(o?.stats.maxHp ?? v.mhp); }
  }
  if (u.structure) { v.tgt = u.structure.target; v.ramp = u.structure.rampN; }
  if (u.ward) v.t1 = r2(u.ward.until);
  return v;
}

export function buildSnapshot(m: Match, team: 0 | 1, slot: number, sinceTick: number): Snapshot {
  const ents: EntView[] = [];
  for (const u of m.units) {
    if (!u.alive && !(u.kind === 'hero' && u.team === team)) continue;
    if (u.team !== team && !m.visibleTo(team, u)) continue;
    ents.push(entityView(m, u, team));
  }
  for (const p of m.projectiles) {
    if (!p.alive) continue;
    if (p.team !== team && !m.fogVisible(team, p.x, p.y)) continue;
    ents.push({ id: p.id, k: K.Proj, tm: p.team, x: r2(p.x), y: r2(p.y), f: r2(Math.atan2(p.dy, p.dx)), hp: 0, mhp: 0, sh: 0, st: 0, sub: p.visual, own: p.owner, r: p.radius });
  }
  for (const z of m.zones) {
    if (!z.alive) continue;
    if (z.team !== team && !z.publicTelegraph && !m.fogVisible(team, z.x, z.y)) continue;
    const e: EntView = { id: z.id, k: K.Zone, tm: z.team, x: r2(z.x), y: r2(z.y), f: 0, hp: 0, mhp: 0, sh: 0, st: z.hostile ? 1 : 0, sub: z.visual, own: z.owner, at: r2(z.start), t1: r2(z.end) };
    if (z.shape.type === 'circle' || z.shape.type === 'ring') e.r = z.shape.r;
    else { e.w = z.shape.w; e.h = z.shape.l; e.ang = r2(z.shape.ang); }
    ents.push(e);
  }
  const hu = m.heroes[slot];
  const h = hu.hero!;
  const me: PrivateState = {
    heroId: hu.id, hero: h.id, gold: Math.floor(h.gold), level: h.level, xp: Math.round(h.xp),
    xpCur: Math.round(h.xp - R.xpForLevel(h.level)), xpNext: h.level >= R.MAX_LEVEL ? 0 : R.XP_TO_NEXT[h.level],
    skillPoints: h.skillPoints,
    abilities: [0, 1, 2, 3].map((i) => {
      const def = abilityDef(hu, i);
      const rank = h.ranks[i];
      const kit = KITS[h.id].abilities[i];
      const cost = def.cost[Math.max(0, Math.min(def.cost.length, rank) - 1)];
      const recast = !!kit.canRecast?.(m, hu);
      return { cd: r2(h.cds[i]), max: r2(h.cdMax[i]), rank, cost, ready: rank > 0 && (h.cds[i] <= 0 || recast) && hu.mana >= cost, recast };
    }),
    talents: h.talents.map((t, i) => ({ id: t, cd: r2(h.talentCds[i]), max: TALENTS[t].cooldown })),
    items: h.items.map((s) => (s ? { id: s.id, count: s.count, cd: r2(s.cd) } : null)),
    wardCharges: h.wardCharges, wardRecharge: r2(R.WARD_RECHARGE - h.wardRechargeT),
    inShop: !hu.alive || inFountain(hu.team as Team, hu.x, hu.y), canUndo: h.undo.length > 0, respawnAt: r2(h.respawnAt),
    stats: { ...hu.stats, as: r2(hu.stats.as), ms: r2(hu.stats.ms), bonusAs: r2(hu.bonusAs) } as unknown as Record<string, number>,
    recallUntil: h.recall?.until ?? 0, recallStart: h.recall?.start ?? 0,
    passive: passiveView(m, hu),
    buffs: buffsView(m, hu),
    bountyTeam: 0,
  };
  const structures: StructureView[] = [];
  for (const s of m.structures.values()) {
    if (s.kind === 'fountain') continue;
    structures.push({ key: s.structure!.key, tier: s.structure!.tier, team: s.team as 0 | 1, lane: s.structure!.lane, alive: s.alive, hp: Math.round(s.hp), mhp: Math.round(s.stats.maxHp), invuln: m.structureInvulnerable(s), x: s.x, y: s.y, respawnAt: s.structure!.respawnAt });
  }
  const objectives: ObjectiveView[] = [];
  for (const c of m.camps) {
    const big = c.def.kind === 'colossus' || c.def.kind.startsWith('catalyst');
    if (!big && c.def.side !== team) {
      // enemy jungle camps: timers are not public, only state if visible
      continue;
    }
    let hp = 0, mhp = 0;
    for (const id of c.alive) { const u = m.byId.get(id); if (u && u.alive) { hp += u.hp; mhp += u.stats.maxHp; } }
    objectives.push({ key: c.def.key, kind: c.def.kind, alive: c.alive.length > 0, hp: big ? Math.round(hp) : 0, mhp: big ? Math.round(mhp) : 0, respawnAt: c.respawnAt === Infinity ? 0 : r2(c.respawnAt), x: c.def.x, y: c.def.y });
  }
  return {
    t: 'snap', tick: m.tick, time: r2(m.time), ents, fog: packFog(m.fog[team]), me, score: scoreRows(m), kills: [m.kills[0], m.kills[1]],
    structures, objectives, teamBuffs: m.teamBuffs.filter((b) => b.until > m.time).map((b) => ({ ...b })),
    events: m.eventsFor(team, slot, sinceTick), paused: m.paused, timeScale: m.timeScale,
  };
}

function passiveView(m: Match, u: Unit): { label: string; value: number; max: number } {
  const p = u.hero!.passive;
  switch (u.hero!.id) {
    case 'brannoch': return { label: 'Stone', value: p.stoneStacks ?? 0, max: 3 };
    case 'suri': return { label: 'Charge', value: Math.round(p.charge ?? 0), max: 100 };
    case 'vey': return { label: p.primed ? 'Primed' : 'Refraction', value: p.primed ? 1 : 0, max: 1 };
    case 'kesh': return { label: 'Heal', value: (p.healReady ?? 0) <= m.time ? 1 : 0, max: 1 };
    case 'ilyra': return { label: 'Notes', value: 0, max: 3 };
    case 'oru': return { label: 'Wing', value: 0, max: 0 };
  }
}

function buffsView(m: Match, u: Unit) {
  const out: Array<{ key: string; until: number; label: string }> = [];
  for (const e of u.effects) {
    if (e.kind === 'buffForge') out.push({ key: 'buffForge', until: e.until, label: 'Forgeheart: attacks burn and slow' });
    if (e.kind === 'buffSpring') out.push({ key: 'buffSpring', until: e.until, label: 'Lumen Spring: haste and mana regen' });
  }
  for (const b of m.teamBuffs) if (b.team === u.team && b.until > m.time) out.push({ key: b.kind, until: b.until, label: b.kind === 'gale' ? 'Gale: +20% speed out of combat' : b.kind === 'forge' ? 'Forge: +25% structure damage' : 'Colossus: empowered minions, 4 s recall' });
  return out;
}

void ITEMS;
