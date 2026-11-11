# Ashfall Covenant

An original isometric browser action RPG — a playable vertical slice built in one shot for Oneshot Arcade.

You are a Warden of Ember Refuge on the ash-covered frontier of Varrow. Wake the Ashway waypoint in the semi-procedural
Soot March, break the Toll-Keeper, free the Artificer, descend three floors of the Hollow Archive and silence the
three-phase Orison Engine. Then raise the difficulty to Veteran or hunt the bosses again for better loot.

Everything runs client-side: no backend, no accounts, no telemetry. Progress is saved to IndexedDB.

## Run it

Requires Node.js 22.12+ and npm.

```bash
npm ci
npm run dev        # dev server on http://localhost:5310
npm run build      # type-check + static production build in dist/ (relative URLs, works from any sub-path)
npm run preview    # serve dist/ on http://localhost:5311
npm test           # 64 headless Vitest tests of the simulation, rules, world generation and saves
npm run probe      # optional balance probe: an unboosted autopilot plays the act, writes probe.log
npm run screenshot # optional: serves dist/ from a sub-path and captures the screenshots in oneshot/ (needs Edge or Chrome)
```

Target: desktop Chrome / Edge with WebGL 2, keyboard and mouse, 1280×720 or larger. A clear error screen is shown if
WebGL 2 or IndexedDB is missing.

## Controls (all keys rebindable in Settings; a left-handed preset is included)

| Input | Action |
| --- | --- |
| Left click | Move · attack the enemy under the cursor · interact · pick up. Hold to keep moving / attacking |
| Right click | Skill slot 1 (your core skill) |
| Q W E R | Skill slots 2–5 |
| 1 2 3 4 | Belt: Red Draught, Blue Draught, White Salt, Gold Tonic |
| Space (or Mouse 4) | Evasive step toward the cursor (3 charges) |
| Shift (hold) | Stand still and attack toward the cursor |
| F | Interact with / pick up the nearest thing |
| T | Channel a town gate (3 s, interrupted by damage); a return portal waits in the Refuge |
| I / K / C / J / M | Inventory / Skills / Character / Quest log / Full map |
| Tab | Toggle minimap · Alt toggles ground item labels · Mouse wheel zooms |
| Esc | Close panels, or pause and open the menu |

Inventory: click an item to select it and use the action buttons (Equip, Favorite, Drop, Sell, Stash, Salvage…);
right-click is the quick action (equip, or sell / stash when those windows are open). Tooltips always show a side-by-side
comparison with what you have equipped.

## What is in the slice

- **Two complete classes** — Cinder Vow (melee, Heat) and Veil Ranger (bow and traps, Trace marks): a basic attack,
  six active skills, six passives and two mutually exclusive capstones each, all data-driven. Six actives compete for
  five hotbar slots. Level cap 20, attributes, free respec through level 8, two loadout snapshots.
- **World** — Ember Refuge hub (quest giver, vendor, healer, stash, waypoint, training dummies with a DPS readout,
  Artificer after rescue, Hunt portal after the act); the Soot March (seeded: 10–12 of 15 authored tiles on a 4×4 grid with
  required landmarks and at least one loop); the Hollow Archive (two seeded room-graph floors with traps, a lever
  shortcut and an elite guardian, plus an authored boss vault with a checkpoint waypoint).
- **Enemies** — ten families with distinct behaviours (attack slots, heavy-attack tokens, kiting, flanking, shield
  facing, split-on-half, self-destruct, hooks, wards, lingering zones), six elite modifiers with exclusions and a threat
  budget, and two bosses: the Toll-Keeper (armor meter, sweeps, lashes, lantern adds) and the Orison Engine (rotating
  beam lanes and repair scribes → conduits and Blight quadrants → a stagger race).
- **Loot** — 74 base items, 51 affixes with tiers, incompatibility groups and class rules, four rarities, eight Relics
  with special powers, glyphs and sockets, 10×6 grid inventory, stash, vendor, identification, salvage, affix reroll,
  repair, relic bad-luck protection and guaranteed boss rewards. Loot and layouts are deterministic per seed.
- **Rules** — fixed 30 Hz simulation with render interpolation, telegraphed enemy attacks, finite healing, death with a
  reclaimable Echo (10% gold, never compounding) and durability loss, Normal and Veteran difficulty, Target Hunt.
- **Persistence** — versioned, checksummed IndexedDB saves with an automatic last-good backup and migration path.

See `ONESHOT-REPORT.md` for exact coverage of the brief, verification evidence, deviations and known issues.

## Project layout

```
src/app-shell        boot, capability checks, main loop, input, world-anchored overlay
src/game-session     Session: fixed tick, player controller, zones, quests hooks, death/respawn
src/entity-combat    shared types, derived stats, damage resolution, statuses, areas, projectiles
src/abilities        skill data (single source for sim + tooltips) and skill execution
src/items            bases, affixes, relics, generation, grid inventory, loot rules, vendor and crafting
src/progression      XP, points, respec, loadouts, quest line
src/world-generation authored tiles, seeded planners, zone assembly and validation
src/navigation-ai    grid collision / A* / line of sight, enemy data, AI state machines, boss directors
src/renderer-vfx     Babylon.js scene, procedural models, actor views, telegraphs, particles
src/audio            Web Audio mixer and synthesized cues
src/persistence      IndexedDB repository, save envelope, checksum, migrations
src/ui               React HUD, panels, dialogs, menus, settings
tests                Vitest suites plus the autopilot balance probe
scripts              production-build screenshot tour (Playwright + system Edge/Chrome)
```

## Save format

One record per character in the `saves` object store: `{ id, version, savedAt, checksum, data, meta }` where `data` is the
hero JSON and `checksum` is FNV-1a over it. Before each write the previous record is copied to `backups` if it still
verifies; loading falls back to the backup when the main record is corrupt. `MIGRATIONS` in `src/persistence/save.ts`
upgrades older versions one step at a time (current version: 2).
