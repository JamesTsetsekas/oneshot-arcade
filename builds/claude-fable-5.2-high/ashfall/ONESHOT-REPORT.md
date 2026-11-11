# ONESHOT REPORT — Ashfall Covenant (claude-fable-5.2-high)

## Summary

I built a playable vertical slice of Ashfall Covenant: an isometric click-to-move action RPG with two complete classes, a hub town, a seeded semi-procedural wilderness, a three-floor crypt, ten enemy families, six elite modifiers, two multi-mechanic bosses, randomized loot with crafting, IndexedDB saves, Veteran difficulty and Target Hunt. The whole core loop (create a Warden → Soot March → Toll-Keeper → rescue the Artificer → Hollow Archive → Orison Engine → Veteran / hunts) is implemented in a deterministic 30 Hz simulation that is separate from the Babylon.js renderer and the React UI, and an autopilot completes it end to end in the automated tests. Every model, texture, sound and icon is generated procedurally in code; balance and performance on real hardware were not verified by a human.

## Brief coverage

| System / criterion | Status | Note |
| --- | --- | --- |
| Launch from URL, static, any sub-path, no backend | Done | `base: './'`; production build verified in headless Edge from `/play/claude-fable-5.2-high/ashfall/` |
| Capability detection and error screens | Partial | WebGL 2, IndexedDB and graphics-init failures show an error screen; no asset-retry / low-memory / offline states (nothing is downloaded after load) |
| Offline service worker cache | Not started | Runs fully client-side, but no service worker or version manifest |
| Save: IndexedDB, versioning, checksum, backup, recovery | Done | Envelope + FNV checksum + last-good backup + migration v1→v2; tested with fake-indexeddb including a torn write |
| Core loop steps 1–10 | Done | All ten steps exist; verified by autopilot tests and partly by a scripted browser tour, not by a human playthrough |
| Character creation (two classes, cosmetic preset) | Partial | Class, name and a "bearing" preset; the preset is stored but has no visible or audible effect |
| Camera (38° pitch, 45° yaw, 42° FOV, zoom 13–24, lag, anticipation, boss framing, capped shake) | Partial | All implemented except middle-mouse orbit and occluder dithering; near-side walls are cut low instead of fading |
| Controls | Partial | Everything in the brief works except Ctrl-compare (comparison is always shown) and the attack-without-move toggle; all keys rebindable, left-handed preset, Mouse 4 = evade (fixed) |
| Player movement | Done | 4.6 m/s, evade 4.5 m / 320 ms / 3 charges / 2.8 s, A* with path smoothing, invalid-click projection, cancel windows, tracking during wind-up |
| Combat model | Done | Health, Focus, armor with diminishing returns, capped resistances, crit, block, Guard, four damage types, burn/blight/chill/root/stun/knockback, boss stagger conversion, potions/globes/shrines |
| Death, Echo, durability, town gate | Done | 10% gold Echo that never compounds, 8% Health blessing on reclaim, −5% durability, 3 s gate interrupted by damage (all unit-tested) |
| Cinder Vow (basic, 6 actives, 6 passives, 2 capstones) | Done | Every active is cast in tests and has an effect; the Heat resource, Guard, Furnace stance, taunting standard work |
| Veil Ranger (basic, 6 actives, 6 passives, 2 capstones) | Done | Trace marks from movement, Ghostline detonation, traps, cloak, backstep pool, moving arrow barrage |
| Skill data completeness and data-derived tooltips | Partial | Tags, cost, cooldown, targeting, timings, coefficients, ailments, modifier list, VFX/SFX ids, cancel window and threat field exist; the AI only reacts to cloak and taunt, not to every threat value |
| Ember Refuge | Done | Quest giver, vendor, healer, stash, waypoint, dummies with DPS readout, Artificer after rescue, Hunt portal, town-gate return portal |
| The Soot March | Partial | 4×4 grid, 10–12 tiles per seed, all seven anchors, guaranteed loop, validated reachability; 15 authored tiles instead of 20, no dead-end travel-time rule |
| Hollow Archive (three floors) | Partial | Floor 1 traps and machines, floor 2 scholars + lever shortcut + elite guardian, floor 3 authored approach, checkpoint and arena; per-floor visual landmarks are thin |
| Encounter spacing | Partial | Role-point pack budgets and no spawns within 4 m of entries (tested); ranged telegraph space and camera-occlusion spawn rules are not validated |
| Story Expedition, Normal and Veteran | Done | Veteran: new seed, level 15+ zones, two-modifier elites, more elites, boss pattern variants, resistances; completed by autopilot test |
| Target Hunt | Done | Both bosses via the Refuge portal after act completion; completion time recorded |
| Training Cell | Partial | Training dummies in town with a rolling DPS readout; no configurable cell or spawnable enemies |
| Ten normal enemy families with distinct AI | Done | Perception, investigate/last-known search, attack slots, heavy-attack tokens (max 2), kiting, flanking, shield facing, split, hooks, wards, zones |
| Elite modifiers | Done | Six modifiers with exclusions and threat budget; only the rules (not each behaviour) are unit-tested |
| Toll-Keeper | Done | Sweep, lash, slam, lantern summons, breakable armor meter, anti-repeat pattern choice, enrage, Veteran variants |
| Orison Engine (three phases) | Done | Beam lanes + repair scribes, conduits + Blight quadrants with immunity, stagger race; phase flow unit-tested |
| Death telemetry | Partial | Cause and damage type shown on death, kept in an in-memory log and the save; no export |
| Physics and interactables | Partial | Custom circle-vs-grid collision instead of Rapier; swept projectiles, traps, doors, levers, urns, explosive braziers with previews; no bridges, debris or ragdolls |
| Equipment, 10×6 grid inventory | Partial | Ten slots, two-handed rules, item sizes, sort, search filter, compare, favorite, drop, stash; click-based (no drag and drop, no rotation) |
| Rarity and affix model | Done | Worn/Tempered/Inscribed/Relic with colour + shape, 51 affixes, tiers by item level, exclusion groups, class rules, advanced range display |
| Loot rules | Done | Seeded stream, guaranteed Inscribed+ and a class weapon from bosses, relic pity (tested) |
| Content counts | Partial | 74 base items (brief: ~80), 51 affixes, 8 Relics with powers wired into the sim |
| Consumables, glyphs, Artificer crafting | Done | Four belt potions with cap, glyph sockets and 3→1 combining, identify, salvage, escalating affix reroll, repair, add socket, destruction protections |
| Progression | Done | Level 20 cap, skill and attribute points, quest rewards, optional hunter belt upgrade, respec free through 8, two loadouts |
| UI: menu, HUD, panels, vendor, death, victory, settings | Partial | All screens exist and were exercised in the browser tour; skill "tree" is a flat grid, no item-filter rules, no dynamic resolution or subtitle options |
| Ground labels and automap | Done | Rarity priority, collision avoidance, distance fade, Alt toggle; automap shows only discovered cells, in camera orientation |
| Accessibility | Partial | Reduced motion, shake toggle, colorblind-safe rarity colours, rebinding; telegraph colours are not remapped and 125%/150% scaling is unverified |
| Visual direction | Partial | Procedural low-poly models, painted ground, moon + fire lighting, shadows, bloom, semantic telegraph colours, hit-stop; no skeletal animation, LODs or painterly textures |
| Audio | Partial | Bus mixer, ducking, voice cap, ~45 synthesized cues, mood drones for town/wild/crypt/boss and a low-health heartbeat; no composed score, speech or subtitles |
| Multiplayer | Not started | Deferred by the brief; the sim only accepts typed intents, which is the extent of the preparation |
| Performance budget (60 FPS, draw calls, memory) | Not started | Not measured on a real GPU; instancing keeps draw counts low by design |
| Workers, Rapier, Recast, glTF/KTX2 pipeline, WebGPU | Not started | Replaced by simpler in-engine equivalents (see deviations) |
| Tests and tooling | Partial | 64 Vitest tests + browser tour script + balance probe; no Playwright test suite, visual regression or CI |
| Delivery artifacts | Partial | Source, build, README, asset manifest, save-format notes, seeded tests, balance tables in code; no benchmark scene, browser matrix or video capture |

## Architecture

- **Stack:** TypeScript (strict), Vite, Babylon.js (`@babylonjs/core`, tree-shaken deep imports, WebGL 2), React 19 for all menus/panels/HUD, Vitest. Chosen to follow the brief's direction; the heavier pieces (Rapier, Recast, workers) were swapped for small deterministic code that could be tested headlessly in the time available.
- **Simulation owns truth.** `game-session/session.ts` runs a fixed 30 Hz tick with no rendering or DOM dependencies. It takes typed `Intent`s and emits typed events; the renderer, audio and UI only consume state and events. That is why the whole act can be played by an autopilot inside Vitest.
- **Modules** (named after the brief): `app-shell` (boot, loop, input, overlay), `game-session`, `entity-combat` (types, stats, damage, statuses, areas, projectiles), `abilities` (skill data + execution; tooltips read the same data), `items` (content, generation, inventory, loot, economy), `progression`, `world-generation` (tiles, planners, validation), `navigation-ai` (grid, A*, AI, bosses), `renderer-vfx`, `audio`, `persistence`, `ui`.
- **Determinism:** one seeded RNG with labelled forks for layout, population, combat and loot. Zones regenerate identically from `(run seed, zone id, difficulty)`.
- **Rendering:** actors are GPU instances of merged procedural meshes; walls, rocks and particles are thin instances; telegraphs are flat decals driven directly by simulation areas, so what you see is the hitbox.

## Verification

Commands run from a clean state (`node_modules` and `dist` deleted first), Node v22.12.0, Windows 11:

- `npm ci` → installed, 0 vulnerabilities.
- `npm test` → **6 test files, 64 tests passed, 0 failed** (1.7 s). Covers RNG, tile shapes, 60 wilderness seeds and 30 seeds of every other zone (landmarks, reachability, loop, repeat caps), item generation rules over 3,000 rolls, inventory, economy and crafting, stats and damage formulas, statuses, bosses' special rules, death/Echo/town gate/potions, progression and respec, every active skill of both classes, AI telegraph-and-avoid behaviour, heavy-attacker cap, Engine phase flow, save round-trip/corruption/migration/backup recovery, and full autopilot playthroughs (both classes on Normal, one Veteran run, one Target Hunt).
- `npm run build` → type-check clean, 634 modules, `dist/index.html` 1.69 kB, main JS 1,557 kB (408 kB gzip), CSS 28 kB, 98 asset chunks, 2.5 MB total.
- `node scripts/screenshot.mjs` → served `dist/` at `http://127.0.0.1:5310/play/claude-fable-5.2-high/ashfall/` and drove headless Microsoft Edge (SwiftShader software WebGL 2) through menu → character creation → Refuge → real mouse click-to-move (player moved 1.84 m) → inventory/skills/character panels → Soot March combat → Toll-Keeper → Archive → Engine vault → map → vendor → Artificer → death screen → respawn. **No console errors, page errors or failed requests.** 17 screenshots saved in `oneshot/`.
- `npm run probe` (unboosted autopilot that never dodges): reaches the Toll-Keeper at level 2–3 and kills it in 45–54 s without dying; reaches the Orison Engine at level 7 after about 4–5.5 minutes of beelining and then dies repeatedly to beams and bolts it does not avoid.

Bugs found and fixed through this verification: enemies that orbit the player could never be hit by melee (orbit maths inverted, and attacks did not track the target), arrows were blocked by the invulnerable Engine in phase 2, knockback could wedge the player into a wall permanently, and a missing Babylon side-effect import crashed the first browser run.

What I could **not** verify:

- No human played the build. Feel, pacing, difficulty and the 20–35 minute session target are untested; the probe only shows the loop is completable and the first boss is fair for a passive player.
- Frame rate on real hardware. The headless software renderer reported 12–16 FPS at 1600×900; that says nothing about a GPU.
- Firefox and Safari, browser zoom at 125%/150%, and audio output (the headless run is muted).
- Mouse-driven attack targeting, hold-to-attack, right-click casting, label clicks and most panel buttons were not driven through real pointer events — the tour used simulation intents for combat. Only click-to-move, keyboard panel toggles and a few button clicks went through the real input path.
- Shadows only rendered with Poisson sampling under SwiftShader (PCF produced none), so I shipped Poisson; I do not know how PCF behaves on hardware.

## Assumptions and deviations

- **Quest structure.** The Artificer is caged at the tollhouse and guarded by the Toll-Keeper; she then gives the Archive Seal in town. This makes the wilderness boss the gate to the crypt and creates the return-to-town beat.
- **Physics and navigation.** Circle-vs-grid collision and grid A* with line-of-walk smoothing replace Rapier and Recast. No web workers: zone generation takes milliseconds.
- **Occlusion.** Walls with floor within two cells behind them are drawn low (a cutaway) instead of dither-fading.
- **Assets.** All procedural; no glTF, KTX2 or audio files. Skill glyphs use Unicode symbols and depend on system fonts.
- **Shortcut.** The floor-2 lever opens a sealed stair in that floor's entrance room; floor 3 also wakes its waypoint on arrival as the pre-boss checkpoint.
- **Scaling.** Heroes gain +3% damage per level and bosses always drop one class weapon, added after the probe showed weapon upgrades were too luck-dependent.
- **Zone persistence.** Cleared zones persist only for the browser session. Saves hold the hero, quests, waypoints, seed and flags; loading always resumes in the Refuge and enemies repopulate.
- **Inventory.** Click-and-button based; right-click is the contextual quick action. Comparison is always shown rather than on Ctrl.
- **Colorblind mode** changes UI rarity colours only.
- **Default zoom** is 20 units (inside the brief's 13–24 range).

## Known issues and limitations

1. Balance is tuned by autopilot only. The Orison Engine is probably hard for an under-levelled character, and elites or Archive Wardens may be spiky.
2. Performance on real GPUs is unmeasured; the JS bundle is 408 kB gzipped with no code splitting of the game itself.
3. Real-pointer combat input (attack targeting, hold, right-click) is implemented but was not exercised end to end in a browser.
4. No service worker, so "offline-capable" only holds while the page stays loaded or the browser caches it.
5. Automap discovery and cleared enemies are lost on reload; the Echo location survives.
6. No drag and drop, no item-filter rules, flat skill grid, no configurable Training Cell.
7. Animation is procedural bob/lean/swing on rigid parts; there are no skeletal rigs, LODs or authored animation sets.
8. Music is a generated drone per mood, not a score; there is no speech, so no subtitles.
9. Only the rules of elite modifiers are unit-tested, not each modifier's runtime behaviour.
10. The cosmetic "bearing" preset does nothing visible.
11. Enemies on the far side of low props can be shot over them; projectiles are only stopped by full walls and doors.
12. The Engine can be engaged from the arena edge by a ranged character standing still, where only some beams reach.

## Self-assessment

- **Playability: 7/10** — the full loop exists, saves, and is completable by an autopilot with readable telegraphs, but no human has tuned the feel or difficulty.
- **Visual polish: 6/10** — coherent mood, lighting, HUD and telegraphs, but characters are primitive assemblies with simple procedural animation.
- **Brief fidelity: 6/10** — most systems in the MVP list are present in some form, yet several technical mandates (Rapier, Recast, workers, glTF pipeline, service worker) and breadth targets (20 tiles, ~80 bases, training cell) were swapped out or fell short.
