# Meridian Run: one-shot report

Model: Fable 5.2 (Claude Code, high effort). Game: `meridian`. Date: 2026-11-11.

## Summary

I built a playable vertical slice of Meridian Run: a procedurally built 900 × 900 m harbor district with live traffic and pedestrians, eight drivable vehicles on a raycast-suspension physics model, on-foot movement and weapons, an evidence-based five-tier police Alert system, four story missions and three activities on a data-driven mission graph, shops, a day-to-night-to-rain cycle, and journaled IndexedDB saves. The gameplay simulation is headless and separate from rendering, so 65 automated tests exercise it, including a full input-driven run of the tutorial mission. The build boots and plays in headless Edge from a sub-path with no page errors, but I could not play it with a real mouse or hear its audio, so feel and sound are unverified.

## Brief coverage

| System / criterion | Status | Note |
|---|---|---|
| URL launch, menu, capability error screen | Done | WebGL 2 and WebAssembly checks; error screens for start failure and context loss |
| South Quay district, six neighbourhoods | Done | Authored grid, hill, drivable flood channel with bridges, harbor, landmarks, tunnel portals |
| Cell streaming with HLOD | Partial | 100 m cells, always-resident ground/landmarks/HLOD, detail streamed one cell per frame; no occlusion culling, no asset downloads to stream |
| Enterable interiors (seven listed) | Partial | Garage bay, warehouse hall, port office and server annex are walk-in sheds; shops, safehouse, substation and kiosk are walk-up markers |
| On-foot movement | Done | Walk/jog/sprint with stamina, crouch, jump, vault/mantle, swim and climb out; tested |
| Soft cover, lean/peek, ladders | Not started | Crouching reduces detection range only |
| Eight vehicles, raycast suspension, assists | Done | All eight pass acceleration, braking, steering, hill and balance tests |
| Vehicle damage, stall, repair | Done | Engine/steering/tyre effects, smoke, garage repair and respray; no body deformation |
| Enter/exit, theft of occupied cars, locked tag | Done | Walk to door then snap in; ejected drivers flee or report; no animations |
| Weapons (five firearms, stun projector, smoke, chirper, baton) | Partial | All work on foot with spread, falloff, recoil, reload and hit zones; no penetration, no firing from vehicles |
| Health, armor, medkits, death recovery | Done | Regen to 30, armor absorbs, clinic fee, gear kept; tested |
| Enemy AI (cover, flanks, grenades) | Partial | Officers, guards and rivals chase, arrest, strafe and shoot; no cover use |
| Pedestrian AI | Done | 17 states, roles, errands, signal-aware crossing, chatter, varied danger reactions, witness calls |
| Traffic AI | Partial | Lanes, signals, priority, yielding, lane change, siren pull-over, panic, recovery, unseen spawn/despawn; no parking or pull-out behaviour |
| Crime evidence | Done | Officer, camera or completed witness call required; calls can be interrupted nonviolently; tested |
| Alert tiers, pursuit, search, cooldown | Done | Heat-based tiers 1 to 4, mission-only tier 5, search region, vehicle/clothing changes affect recognition; tested |
| Police response depth | Partial | Budgeted units from portals, substation or unseen patrol beats; foot officers; simple roadblocks. No tactical vans, spike strips or drone |
| Arrest | Done | Detain window, comply or resist, fine, contraband, substation respawn; tested |
| Four story missions | Done | All four start, complete, fail, retry from checkpoint, abandon and replay in tests. Staging is simpler than the brief (see deviations) |
| Three activities | Done | Courier Runs (three modifiers), Street Circuit (ghost, reset penalty), Recovery Calls |
| Mission graph runtime | Done | Typed nodes, goals and conditions, validator, checkpoints, cleanup |
| Map, minimap, GPS, phone | Done | Rotating minimap, road-graph GPS that re-routes, full map with legend, filters and waypoint; phone with jobs, activities, contacts, stats |
| Economy and Trust | Done | Four shops, Trust gates gear and vehicle registration only |
| HUD and Alert beacon | Done | Segmented chevron beacon with status text, objective panel, prompts with consequences, cargo bar |
| Day/night and weather | Done | 45-minute afternoon to night, rain with wet grip and lighting |
| Save/load/recovery | Done | Journal, three rolling backups, v1→v2 migration, checksummed import/export; verified in tests and in the browser. Mission checkpoints are not persisted |
| Settings and accessibility | Done | Presets, densities, FOV, assists, hold/toggle, rebinding, subtitles, reduced motion and flashes, colourblind beacon |
| Audio | Partial | Fully procedural engine, sirens, weapons, ambience, rain and two generative radio stations. Never listened to (see Verification). No voiced speech |
| PWA / offline | Partial | Manifest and cache-first service worker; not tested offline |
| Benchmark route | Done | `?benchmark=1`, results below |
| Tooling (editors, debuggers) | Not started | Only a debug hook and two Node scripts |
| Multiplayer, cloud saves, leaderboards | Not started | Out of MVP scope per the brief; nothing implies otherwise in the UI |
| Acceptance: new user can do tutorial, free roam, save, reload, resume | Done | Tutorial played by inputs in a test; save → reload → Continue verified in headless Edge |
| Acceptance: streaming never exposes void or hitches | Partial | Ground and colliders are always loaded; slowest cell build measured 9.1 ms, above the 3 ms budget |
| Acceptance: 60 fps median at 1080p medium | Not verified | One 720p headless run on the build machine: 131.6 fps median |
| Acceptance: no proprietary content | Done | Everything is generated or written for this project |

## Architecture

Stack: strict TypeScript, Vite, Babylon.js (WebGL 2), Rapier 3D (WASM), React for menus only, Web Audio, IndexedDB, Vitest. These follow the brief's technical direction. Babylon and Rapier were kept even though a custom 2.5D engine would have been less risky, because Rapier's character controller, ray queries and rigid bodies give vault, line of sight, prop physics and vehicle collisions for free, and it runs unchanged in Node for tests.

The key decision was a **headless simulation**. `Sim` owns all gameplay on a fixed 60 Hz step and never touches rendering, audio or the DOM. `Game` runs it in the browser with an accumulator and render interpolation. That is why police, missions, traffic and saves can be tested without a browser.

The second decision was **one vehicle model for everyone**. Traffic, police, rivals and the player share the same raycast-wheel dynamics; AI differs only in who writes the throttle, brake and steering. Stealing a car is just a change of driver.

Modules mirror the brief's list:

- `app-shell`: boot, capability checks, React screens, service worker registration.
- `game-session`: `Sim` (clock, weather, economy, shops, save state, step order) and `Game` (loop, pause, autosave, benchmark).
- `world`: district source and terrain, lot generation, lane/sidewalk/route graphs, signals.
- `physics`: Rapier world, heightfield and simple colliders, collision groups, ray queries.
- `vehicles`, `character`, `traffic`, `pedestrians`, `police`, `missions`: as named.
- `renderer`: cell streaming and HLOD, procedural textures and meshes, thin-instanced actors, camera rig, effects.
- `audio`, `ui`, `persistence`: procedural audio, HUD and map painter, save repository.

Rendering uses merged per-cell meshes and a handful of thin-instanced pools for everything that moves, which keeps the scene at about 270 draw calls. More detail is in `docs/DESIGN.md`.

## Verification

All commands were run from the workspace root on Windows 11, Node 22.12.0, npm 11.4.2. The final sequence started from a clean state (`rm -rf node_modules dist`).

| Command | Result |
|---|---|
| `npm ci` | Installed; "found 0 vulnerabilities" |
| `npm test` | 6 test files, **65 passed, 0 failed**, 36.7 s |
| `npm run build` | `tsc --noEmit` clean; Vite wrote `dist/index.html` (16.0 kB), one CSS file (12.6 kB) and `index-C1tly-7g.js` (11,151.5 kB; 3,230.9 kB gzip). Vite prints a chunk-size warning |
| `node tools/smoke.mjs --scenes` | Served `dist/` at `http://127.0.0.1:5362/play/claude-fable-5.2-high/meridian/`, headless Edge. Menu → New Game → `playing`. Reported `{"drawCalls":271,"fps":128,"vehicles":35,"peds":58,"simMs":1.57,"mission":"m1","cells":12}`. Captured 12 screenshots. Save → page reload → Continue restored cash 4321, mission progress and the owned Swift. "no page errors" |
| `node tools/debug.mjs ...` (ad hoc) | Two extra captures from the same build: `oneshot/10-warehouse-gate.png` (Lost Manifest started, compound, a guard and the objective HUD on screen) and `oneshot/11-police-arrival.png` (forced Tier 2: an interceptor with its lightbar arriving, beacon showing "ALERT 2 · PURSUIT", police blip on the minimap) |
| `node tools/smoke.mjs --benchmark` | Run on the same bundle before the clean reinstall: median 131.6 fps, 1% low 108.7 fps, longest frame 17.1 ms, 261 draw calls, slowest cell build 9.1 ms (1280×720, Medium) |

What the tests cover: district data and anchors; heightfield agreement with the terrain function; lanes, routing, signals and sidewalk connectivity; all eight vehicles (settle, accelerate, brake, steer, handbrake, reverse, hill start, balance, damage, stall, repair); on-foot movement, vault, swim, combat, death recovery; entering and exiting every vehicle; two minutes of city simulation (0 traffic collisions, 363 of 364 sampled red-light approaches stopped, mean lane error 4 cm); varied pedestrian reactions; evidence rules; the Alert life cycle; recognition after vehicle and clothing changes; dispatch caps; arrest; mission validation; all four story missions and three activities including fail, retry and abandon; save round trips, journal recovery, backup recovery, migration, import and export.

What I looked at: the screenshots in `oneshot/` (menu, start, riding, sunset driving, plaza, night rain, hill view, map, continue, warehouse gate, police arrival). Several rendering bugs were found and fixed this way.

**Not verified, stated plainly:**

- **No human-in-the-loop play.** Pointer lock does not exist in the headless browser, so mouse look, aiming and overall game feel were never experienced. Keyboard driving was exercised only briefly by the smoke script.
- **Audio was never heard.** The audio code ran without errors in a muted headless browser. Mix levels and the quality of the synthesised sounds and radio are unknown.
- Missions 2 to 4 pass their tests, but those tests move the player by teleport between objectives. In the browser I saw only the start of *Lost Manifest* at the warehouse gate. The port compound, guard chases, the lock minigame overlay and the firefight have not been seen on screen.
- Police behaviour was verified by simulation tests. On screen I saw one unit arriving under a forced Tier 2 alert; I did not watch a chase, a search, an arrest or a roadblock.
- Firefox, Safari, 1920×1080, real target hardware, offline start through the service worker, and long sessions (memory growth) were not tested.
- The smoke script uses the `window.__meridian` debug hook to place the player and change the time of day for its captures, and hides the "click to capture the mouse" hint. The frames themselves are real output of the production build.

## Assumptions and deviations

- **Procedural everything.** With no asset pipeline in a one-shot, the city, vehicles, characters, textures and audio are generated in code. The look is stylised and blocky, not the glTF/KTX2 production art the brief describes.
- **Grid city.** South Quay is an authored Manhattan-style grid with a real hill and a drivable channel. Lantern Hill has steep straight streets and one pedestrian stair street instead of switchbacks.
- **Interiors.** Only open sheds are walk-in. Shops are walk-up panels. The UI never presents a door as enterable when it is not.
- **Controls.** `E` interacts and enters vehicles, `F` is melee on foot and exit in a vehicle, `H` is holster on foot and horn in a vehicle, as the brief resolves it. `F` also enters a vehicle when nothing is in melee reach. Medkit is on `Z`, radio on `N`.
- **Missions are shorter than the brief.** *Lost Manifest*: a dialogue bluff or a timing lock, three photographs, cameras with a fuse box, leave unseen. *Hot Cargo*: two witness clues, then a van that drives laps of Foundry Row and must be blocked or boxed until its driver bails, then two rival cars chase you to the garage. *Signal at the Breakwater*: optional server shutdown removes the third rival wave; the Tier 3 response is scripted through the same Alert API crimes use.
- **Police entry points** include out-of-sight "patrol beats" as well as tunnel portals and the substation, because portal-only arrivals were too slow to ever meet a tier 1 incident in the south of the district.
- **Simulation rate** is fixed at 60 Hz with catch-up steps; there is no 30 Hz mode.
- **Babylon is imported whole**, trading bundle size for reliability under one-shot conditions.
- **Tier thresholds, fines, search times and prices** are my own tuning.
- Spawn rule: vehicles and pedestrians appear only where the camera has no line of sight, or inside tunnel mouths and doorways.

## Known issues and limitations

1. Never played by a person: mouse aim, camera feel, difficulty and pacing are untuned guesses. Audio is unheard.
2. Visual fidelity is low: box-part characters with code-driven poses, no skeletal animation, no interiors, simple lighting. Lamp light pools can clip through walls on steep streets.
3. Missions 2 to 4, combat and pursuits are verified almost entirely by simulation tests; only a mission start and one police arrival were seen on screen.
4. The JavaScript bundle is 11.2 MB (3.2 MB gzip), above the brief's 10 MB shell target, and the slowest streamed cell build (9.1 ms) is above its 3 ms budget.
5. Enemy AI has no cover or flanking; police lack tactical vans, spike strips and the drone; traffic never parks.
6. Mission checkpoints are not saved to disk; quitting mid-mission restarts it.
7. Weapons cannot be used from vehicles; thin-cover penetration is not modelled.
8. One save slot; no separate Load screen.
9. The AI steering helper is tuned for lane following. Police in direct pursuit may still clip corners or get stuck briefly; stuck units re-route and are retired out of sight.

The full list is in `docs/OPERATIONS.md`.

## Self-assessment

- **Playability: 6/10.** The whole loop exists and is test-verified end to end, but nobody has held the mouse, so feel is unproven.
- **Visual polish: 5/10.** Coherent, readable and atmospheric at dusk and in rain, with a clean HUD, but the models are blocky and unanimated.
- **Brief fidelity: 6/10.** The requested stack and nearly every named system are present in some form, with interiors, animation, advanced police tools and tooling missing or thin.
