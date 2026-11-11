# Ashfall Covenant

An original isometric browser action RPG (vertical slice). You are a Warden on the ash-buried frontier of Varrow. From Ember Refuge you cross the semi-procedural Soot March, break the Toll-Keeper, free Calder the Artificer from the Hollow Archive, and silence the three-phase Orison Engine. Then Veteran difficulty, Target Hunt, and reseeded expeditions open up for farming.

Everything runs client-side. There is no backend, no account, and no telemetry. Saves go to IndexedDB.

## Run it

Requires Node.js 22.12+ and npm.

```bash
npm ci          # install exact locked dependencies
npm run dev     # dev server on http://localhost:5410
npm run build   # typecheck + static build to dist/ (relative URLs, works from any sub-path)
npm test        # 109 headless Vitest tests (simulation, rules, generation, loot, saves)
npm run preview # serve dist/ on port 5411
npm run shot    # optional: headless-browser screenshots of the production build (needs local Chrome/Edge)
```

Target: desktop Chrome/Edge with WebGL 2, keyboard and mouse, 1280×720 or larger. If WebGL 2 is missing, an error screen explains why.

## Controls (rebindable in Settings → Controls; includes a left-handed preset)

| Input | Action |
|---|---|
| Left click ground | Move (hold to keep moving) |
| Left click enemy | Basic attack (hold to keep attacking) |
| Right click | Core skill (Brand Arc / Splinter Volley) |
| Q W E R | Active skill slots |
| 1 2 3 4 | Red Draught, Blue Draught, White Draught, Gold Tonic |
| Space | Evasive step toward the cursor (3 charges) |
| Shift | Stand still and attack in place |
| Alt | Show all ground labels |
| Ctrl | Compare with the equipped item |
| F | Interact or pick up |
| T | Town-gate channel (damage interrupts it) |
| I / K / C / J | Inventory / Skills / Character / Quest log |
| Tab / M | Automap overlay / full map |
| Mouse wheel | Zoom (13–24 m) |
| Esc | Pause menu, or close a panel |

## What's in the slice

- **Two classes, both complete.** Cinder Vow (Heat, mace and shield or maul) and Veil Ranger (Trace marks, bow, traps). Each has a basic attack, 6 actives, 6 passives and 2 mutually exclusive capstones. The level cap is 20, with respec and two loadout snapshots.
- **Ember Refuge.** Marshal Ivra (quests and difficulty), Odo (vendor), Sister Wren (healer), stash, Calder (Artificer, after you rescue him), waypoint, training dummies, a Training Cell, and a Target Hunt portal.
- **The Soot March.** Built from 20 authored tile templates on a 4×4 grid (10–12 tiles per seed). It always contains the refuge gate, the ruined tollhouse, the Ashway waypoint, a hunter camp event, an elite ring, and the Toll-Keeper's boss gate. Every seed has at least one loop and an openable shortcut barricade.
- **Hollow Archive, three floors.** Floor 1 has trap rooms (spikes, flame vents), a brass orrery landmark, and the Artificer's cage. Floor 2 has scholars, a lever-and-portcullis shortcut, and an elite guardian. Floor 3 is a handcrafted approach, a checkpoint waypoint, and the Orison Engine arena.
- **Enemies.** 10 normal types, each with its own behaviour, plus 5 elite modifiers with exclusions and a threat budget. The two bosses use phases, armor and stagger meters, enrage timers, and anti-repeat patterns.
- **Loot.** 81 base items, 65 affixes, 8 Relics, and 15 glyphs, across 4 rarities that use shape as well as colour. Identify, salvage, single-affix reroll, repair, sockets and glyph combining. Includes a vendor, a stash, and bad-luck protection for Relics.
- **Death and Echo.** Dying drops an Echo holding 10% of your gold, and you lose 5% durability. Reclaiming the Echo restores the gold and gives a +8% maximum-health blessing.
- **Modes.** Normal → Veteran, Target Hunt with best times, a Training Cell with a damage breakdown, and reseeded expeditions.
- **Persistence.** IndexedDB saves with versioning, checksums, an atomic backup of the previous save, recovery, and migrations.
- **Procedural assets.** All art, audio and music are generated at runtime. See `ASSETS.md`.

See `ONESHOT-REPORT.md` for exact coverage, verification, and known issues.
