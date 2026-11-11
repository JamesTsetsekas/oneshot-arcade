import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { K17 } from '../src/content/k17';
import { EQUIPMENT, PERK_GROUPS, PERKS, resolvePerks, SUPPORTS } from '../src/content/kit';
import { BOT_LOADOUTS, DEFAULT_LOADOUTS, PRACTICE_RULESET, resolveLoadout, sanitizeLoadout, validateLoadout } from '../src/content/loadout';
import { CHALLENGES, levelForXp, MAX_LEVEL, UNLOCK_TRACK, xpForLevel } from '../src/content/progression';
import { BOT_SKILL, COMBAT } from '../src/content/tuning';
import { ATTACHMENTS, damageAt, resolveWeapon, WEAPONS } from '../src/content/weapons';
import { applyMatchResult, migrateProfile, newProfile } from '../src/profile/profile';
import { MatchResult, resultChecksum } from '../src/protocol/messages';
import { Rng } from '../src/sim/math';
import { loadRapier } from '../src/sim/physics';
import { World } from '../src/sim/world';
import { chooseSpawn, evalCandidate, SpawnContext } from '../src/server/spawn';

describe('spawn director', () => {
  let world: World;
  beforeAll(async () => { world = new World(await loadRapier(), K17); });

  it('never picks a candidate with direct enemy sight inside the unsafe distance when a safe one exists (10,000 respawns)', () => {
    const rng = new Rng(2024);
    const b = K17.bounds;
    let unsafePicks = 0, noSafe = 0, sightPicks = 0;
    const groups = new Set<number>();
    for (let i = 0; i < 10000; i++) {
      const team = (i % 2) as 0 | 1;
      const nEnemies = 1 + rng.int(6), nMates = rng.int(6);
      const rnd = () => ({ x: rng.range(b.minX + 3, b.maxX - 3), y: 0.03, z: rng.range(b.minZ + 3, b.maxZ - 3) });
      // half the time enemies crowd a random staging yard to stress spawn flipping
      const crowd = rng.chance(0.5) ? K17.spawns[rng.int(K17.spawns.length)] : null;
      const enemies = Array.from({ length: nEnemies }, () => (crowd && rng.chance(0.7) ? { x: crowd.x + rng.range(-8, 8), y: 0.03, z: crowd.z + rng.range(-8, 8) } : rnd()));
      const ctx: SpawnContext = {
        team, enemies, mates: Array.from({ length: nMates }, rnd),
        deaths: Array.from({ length: rng.int(4) }, () => ({ ...rnd(), age: rng.range(0, 12) })),
        dangers: rng.chance(0.2) ? [{ ...rnd(), r: 7 }] : [],
        visible: (ax, ay, az, bx, by, bz) => world.visible(ax, ay, az, bx, by, bz),
        jitter: () => rng.next(),
      };
      const c = chooseSpawn(K17.spawns, ctx);
      groups.add(K17.spawns[c.index].group);
      const ev = evalCandidate(K17.spawns[c.index], ctx);
      if (!c.anySafe) { noSafe++; continue; }
      if (ev.unsafe || ev.danger) unsafePicks++;
      if (ev.sight) sightPicks++;
      expect(c.reason).toMatch(/^g\d#\d+ score=/); // deterministic audit string
    }
    console.log(`[spawn] 10000 respawns: unsafe picks ${unsafePicks}, no-safe-candidate cases ${noSafe}, picks with any distant sight ${sightPicks}, groups used ${groups.size}`);
    expect(unsafePicks).toBe(0);
    expect(noSafe).toBeLessThan(200);
    expect(groups.size).toBe(6);
  }, 120000);

  it('is deterministic for identical inputs and prefers the home side when all else is equal', () => {
    const ctx = (): SpawnContext => ({ team: 0, enemies: [{ x: 50, y: 0, z: 0 }], mates: [], deaths: [], dangers: [], visible: () => false, jitter: () => 0.5 });
    const a = chooseSpawn(K17.spawns, ctx()), b = chooseSpawn(K17.spawns, ctx());
    expect(a.index).toBe(b.index);
    expect(a.reason).toBe(b.reason);
    expect(K17.spawns[a.index].home).toBe(0);
    // recent deaths push the choice elsewhere
    const p = K17.spawns[a.index];
    const c = chooseSpawn(K17.spawns, { ...ctx(), deaths: [{ x: p.x, z: p.z, age: 0.5 }, { x: p.x + 1, z: p.z, age: 1 }, { x: p.x, z: p.z + 1, age: 1 }] });
    const q = K17.spawns[c.index];
    expect(c.index).not.toBe(a.index);
    expect(Math.hypot(q.x - p.x, q.z - p.z)).toBeGreaterThanOrEqual(12);
  });
});

describe('content data, loadouts and progression', () => {
  it('ships the MVP roster: 9 weapons, 11 attachments, 9 perks, 6 equipment items, 6 support actions', () => {
    expect(WEAPONS.filter((w) => w.slot === 'primary').length).toBe(6);
    expect(WEAPONS.filter((w) => w.slot === 'sidearm').length).toBe(3);
    expect(ATTACHMENTS.length).toBe(11);
    expect(PERKS.length).toBe(9);
    for (const g of PERK_GROUPS) expect(PERKS.filter((p) => p.group === g).length).toBe(3);
    expect(EQUIPMENT.filter((e) => e.kind === 'lethal').length).toBe(3);
    expect(EQUIPMENT.filter((e) => e.kind === 'tactical').length).toBe(3);
    for (const t of [0, 1, 2]) expect(SUPPORTS.filter((s) => s.tier === t).length).toBe(2);
    expect(SUPPORTS.map((s) => s.cost).sort()).toEqual([3, 3, 5, 5, 8, 8]);
    expect(DEFAULT_LOADOUTS.length).toBe(5);
  });

  it('every attachment has a visible tradeoff and every default / bot loadout is legal', () => {
    for (const a of ATTACHMENTS) { expect(a.pros.length, a.id).toBeGreaterThan(0); expect(a.cons.length, a.id).toBeGreaterThan(0); }
    for (const l of [...DEFAULT_LOADOUTS, ...BOT_LOADOUTS]) expect(validateLoadout(l, PRACTICE_RULESET), l.name).toEqual([]);
  });

  it('validates loadouts server-side: unknown ids, slot conflicts, too many attachments, locked items, version', () => {
    const base = () => JSON.parse(JSON.stringify(DEFAULT_LOADOUTS[0]));
    const bad = (mut: (l: ReturnType<typeof base>) => void, rules = PRACTICE_RULESET) => { const l = base(); mut(l); return validateLoadout(l, rules).length > 0; };
    expect(bad((l) => { l.primary = 'railgun'; })).toBe(true);
    expect(bad((l) => { l.sidearm = 'ar4'; })).toBe(true);
    expect(bad((l) => { l.attachments = ['reflex', 'optic2x']; })).toBe(true);
    expect(bad((l) => { l.attachments = ['reflex', 'suppressor', 'angledgrip', 'extmag']; })).toBe(true);
    expect(bad((l) => { l.primary = 'mr1'; l.attachments = ['reflex']; })).toBe(true); // marksman has no optic slot
    expect(bad((l) => { l.perks = ['trace', 'fleet', 'rapid']; })).toBe(true);
    expect(bad((l) => { l.lethal = 'flash'; })).toBe(true);
    expect(bad((l) => { l.supports = ['recon', 'recon', 'flight']; })).toBe(true);
    expect(bad((l) => { l.name = 'x'.repeat(40); })).toBe(true);
    expect(bad(() => {}, { version: 'old-ruleset', ownedLevel: null })).toBe(true);
    // online-style ownership: a level 1 account may not equip level-gated items
    expect(bad((l) => { l.primary = 'lmg60'; l.attachments = []; }, { version: PRACTICE_RULESET.version, ownedLevel: 1 })).toBe(true);
    expect(validateLoadout({ ...base(), attachments: ['reflex'], perks: ['fleet', 'trace', 'rapid'], lethal: 'frag', tactical: 'flash', supports: ['recon', 'drone', 'flight'] }, { version: PRACTICE_RULESET.version, ownedLevel: 1 })).toEqual([]);
    expect(validateLoadout(null, PRACTICE_RULESET).length).toBeGreaterThan(0);
    expect(sanitizeLoadout({ garbage: true }, DEFAULT_LOADOUTS[2])).toEqual(DEFAULT_LOADOUTS[2]);
  });

  it('a starter (level 1) account has a competitive choice in every category', () => {
    expect(WEAPONS.some((w) => w.slot === 'primary' && w.unlockLevel === 1)).toBe(true);
    expect(WEAPONS.some((w) => w.slot === 'sidearm' && w.unlockLevel === 1)).toBe(true);
    for (const g of PERK_GROUPS) expect(PERKS.some((p) => p.group === g && p.unlockLevel === 1)).toBe(true);
    expect(EQUIPMENT.some((e) => e.kind === 'lethal' && e.unlockLevel === 1)).toBe(true);
    expect(EQUIPMENT.some((e) => e.kind === 'tactical' && e.unlockLevel === 1)).toBe(true);
    for (const t of [0, 1, 2]) expect(SUPPORTS.some((s) => s.tier === t && s.unlockLevel === 1)).toBe(true);
  });

  it('no unlock, perk or attachment raises base health or universal damage', () => {
    const perkKeys = Object.keys(resolvePerks(PERKS.map((p) => p.id)));
    for (const k of perkKeys) expect(k.toLowerCase()).not.toMatch(/damage|health|headshot/);
    for (const w of WEAPONS) {
      const base = resolveWeapon(w, []);
      for (const a of ATTACHMENTS) {
        const st = resolveWeapon(w, [a.id]);
        for (const d of [1, 15, 40, 80]) for (const z of [0, 1, 2, 3]) expect(damageAt(st, d, z)).toBeLessThanOrEqual(damageAt(base, d, z) + 1e-9);
      }
    }
    expect(COMBAT.maxHealth).toBe(100);
    for (const s of Object.values(BOT_SKILL)) expect(Object.keys(s).join(',')).not.toMatch(/health|damage/);
    for (const l of DEFAULT_LOADOUTS) expect(resolveLoadout(l).weapons[0].def.dmgNear).toBe(WEAPONS.find((w) => w.id === l.primary)!.dmgNear);
  });

  it('levels 1-30 are monotonic and the unlock track only contains sidegrades and cosmetics', () => {
    expect(levelForXp(0)).toBe(1);
    for (let l = 1; l < MAX_LEVEL; l++) { expect(xpForLevel(l + 1)).toBeGreaterThan(xpForLevel(l)); expect(levelForXp(xpForLevel(l + 1))).toBe(l + 1); expect(levelForXp(xpForLevel(l + 1) - 1)).toBe(l); }
    expect(levelForXp(1e9)).toBe(MAX_LEVEL);
    expect(UNLOCK_TRACK.every((u) => u.level >= 1 && u.level <= MAX_LEVEL)).toBe(true);
    expect(UNLOCK_TRACK.filter((u) => u.kind === 'cosmetic').length).toBeGreaterThan(8);
    expect(CHALLENGES.length).toBe(5);
  });
});

describe('profile service (embedded)', () => {
  const result = (over: Partial<MatchResult> = {}): MatchResult => {
    const base: Omit<MatchResult, 'sig'> = {
      matchId: 'k17-test-1-p0', winner: 0, scores: [75, 60], duration: 300, suddenDeath: false, mapId: 'k17',
      players: [{ id: 0, name: 'Me', team: 0, bot: false, kills: 12, deaths: 7, assists: 9, score: 1600, bestStreak: 5, devices: 3, supportsUsed: 2 }],
      you: { id: 0, team: 0, weapons: [{ weapon: 'ar4', shots: 200, hits: 80, kills: 11, headshots: 2 }], bestStreak: 5, adsKills: 10, equipmentHits: 5, devicesDestroyed: 3, districtsVisited: 5, assists: 9, xp: [{ label: 'Match score', amount: 1600 }, { label: 'Victory', amount: 300 }], xpTotal: 1900 },
      ...over,
    };
    return { ...base, sig: resultChecksum(base) };
  };

  it('applies a match result exactly once (idempotent) and rejects tampered results', () => {
    const p = newProfile();
    const r = result();
    const a = applyMatchResult(p, r);
    expect(a.applied).toBe(true);
    expect(p.stats.matches).toBe(1); expect(p.stats.wins).toBe(1); expect(p.stats.kills).toBe(12);
    expect(p.stats.weapons.ar4.hits).toBe(80);
    const xp = p.xp;
    expect(xp).toBeGreaterThanOrEqual(1900);
    const b = applyMatchResult(p, r);
    expect(b.applied).toBe(false);
    expect(p.xp).toBe(xp); expect(p.stats.matches).toBe(1);
    // tampering with the score invalidates the room's integrity tag
    const forged = { ...result({ matchId: 'k17-test-2-p0' }) };
    forged.you = { ...forged.you, xpTotal: 999999 };
    const c = applyMatchResult(p, forged);
    expect(c.applied).toBe(false);
    expect(p.xp).toBe(xp);
  });

  it('completes onboarding challenges, grants their XP once and reports level-up unlocks', () => {
    const p = newProfile();
    const a = applyMatchResult(p, result());
    expect(a.challengesCompleted.sort()).toEqual(['ads', 'assists', 'counter', 'equipment']);
    expect(p.challenges.routes).toBe(1);
    expect(a.levelAfter).toBeGreaterThan(a.levelBefore);
    expect(a.unlocked.length).toBeGreaterThan(0);
    expect(a.unlocked.every((u) => u.level > a.levelBefore && u.level <= a.levelAfter)).toBe(true);
    const b = applyMatchResult(p, result({ matchId: 'k17-test-3-p0' }));
    expect(b.challengesCompleted).toEqual(['routes']);
    expect(p.challengesDone.length).toBe(5);
  });

  it('migrates stale or corrupt stored profiles into a legal one', () => {
    const p = migrateProfile({ name: '<script>', xp: -5, selected: 99, loadouts: [{ primary: 'nope' }, DEFAULT_LOADOUTS[1]], settings: { fov: 500, sens: 'fast', binds: { jump: 'KeyJ' } }, practice: { teamSize: 40, difficulty: 'godlike' } });
    expect(p.name).toBe('script');
    expect(p.xp).toBe(0); expect(p.selected).toBe(0);
    expect(p.loadouts.length).toBe(5);
    expect(p.loadouts[0]).toEqual(DEFAULT_LOADOUTS[0]);
    expect(p.loadouts[1]).toEqual(DEFAULT_LOADOUTS[1]);
    expect(p.settings.fov).toBe(110); expect(p.settings.sens).toBe(2.2);
    expect(p.settings.binds.jump).toBe('KeyJ'); expect(p.settings.binds.reload).toBe('KeyR');
    expect(p.practice.teamSize).toBe(6); expect(p.practice.difficulty).toBe('normal');
    expect(migrateProfile(null).loadouts.length).toBe(5);
  });
});

describe('architecture boundaries', () => {
  const src = path.resolve(__dirname, '../src');
  const files = (dir: string): string[] => fs.readdirSync(path.join(src, dir)).filter((f) => /\.tsx?$/.test(f)).map((f) => path.join(src, dir, f));
  const imports = (file: string): string[] => [...fs.readFileSync(file, 'utf8').matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);

  it('server, simulation, protocol and content never import rendering, UI, audio or client code', () => {
    for (const dir of ['server', 'sim', 'protocol', 'content']) {
      for (const f of files(dir)) {
        for (const imp of imports(f)) {
          expect(/\/(render|ui|audio|client|profile)\//.test(imp) || imp.startsWith('@babylonjs') || imp === 'react', `${path.basename(f)} imports ${imp}`).toBe(false);
        }
      }
    }
  });

  it('simulation and content have no dependency on the server; shared code stays pure', () => {
    for (const dir of ['sim', 'content', 'protocol']) for (const f of files(dir)) for (const imp of imports(f)) expect(imp.includes('/server/'), `${path.basename(f)} imports ${imp}`).toBe(false);
  });

  it('ships no proprietary names from existing shooter franchises in content or UI text', () => {
    const banned = /call of duty|modern warfare|battlefield|counter-strike|halo|valorant|ak-?47|m4a1|m16|glock|desert eagle|mp5|nuketown|rust\b|shipment|uav|predator missile|ac-130|killstreak/i;
    for (const dir of ['content', 'ui', 'server', 'client', 'render', 'audio']) for (const f of files(dir)) expect(banned.test(fs.readFileSync(f, 'utf8')), path.basename(f)).toBe(false);
  });
});
