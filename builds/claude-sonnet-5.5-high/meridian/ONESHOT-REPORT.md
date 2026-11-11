# Meridian Run - One-shot report

## Summary

Meridian Run is a playable vertical slice of an original browser open-world urban action game: a 7x7-street South Quay district in Port Meridian with procedural architecture, live signal-obeying traffic, ~40 pedestrians, eight driveable vehicles (cars, van, interceptor, two motorcycles), on-foot movement and hitscan combat, a witness-driven five-tier police/Alert system with pursuit, search, cooldown and arrest, a data-driven mission graph (tutorial *First Shift* and *Hot Cargo* plus generated courier, circuit and recovery activities), economy/Trust, map/GPS/phone UI, journaled IndexedDB saves and a compressed afternoon-to-rainy-night cycle. It is written in strict TypeScript on Babylon.js with a pure-TypeScript simulation layer that is covered by 60 headless tests. Everything (geometry, textures, audio, radio music, UI) is generated at runtime; the build is a static site with relative URLs.

## Brief coverage

| Area / acceptance criterion | Status | Note |
|---|---|---|
| Launch from URL, menu (Continue / New Game / Load / Settings / Credits) | Done | Living-city menu backdrop; WebGL2 capability error screen; Load = JSON save import |
| New game -> motorcycle delivery tutorial -> free roam -> save -> reload -> resume | Done (partly verified) | Mission graph, save/load and checkpoint resume covered by unit tests; tutorial flow verified up to riding the bike in a real browser, the full delivery was verified at graph/test level, not played end-to-end by hand |
| Walk / jog / sprint / crouch / jump / vault / mantle / swim | Partial | All implemented with the brief's speeds/stamina; vault/mantle are thin-obstacle only (no hand IK); swim is harbor-only; not exercised in-browser |
| Aim / fire / reload / gadgets / damage / heal / death recovery | Done | Pistol, MP, carbine, shotgun, DMR, stun, baton, smoke, chirper; death -> loft with fee and mission retry |
| Eight vehicle types, enter/exit, drive, handbrake, collide, damage, stall, repair | Done | Bicycle-model tyre physics with friction circle, not Rapier raycast suspension (see deviations) |
| Traffic obeys lanes/signals, reacts to obstruction/emergency, recovers | Done | Lane graph, signals, following, siren pull-over, panic, jam recovery, off-screen despawn; unprotected left turns are not yielded |
| Pedestrians navigate, cross on signals, activities, converse, react differently, flee/call police | Done | Sidewalk graph, 10+ states, courage-based reactions, subtitled barks; no sitting or cafe activities |
| Crimes create evidence only via valid witnesses/cameras/police; units arrive from portals; search; disguise; cooldown | Done | Tested: no-witness = no consequences, 2-5 s calls, wave-off, harming witness backfires, vehicle/outfit change |
| Arrest at low threat, fine, resume; extreme escalation capped | Done | Fine + long-gun confiscation + precinct respawn; unit cap 8, finite reinforcement budget; tier 5 is only reachable by script (no mission uses it) |
| Four story missions | Partial | 2 of 4 shipped (*First Shift*, *Hot Cargo*). *Lost Manifest* and *Signal at the Breakwater* are Not started and hidden |
| Missions: start/complete/fail/retry/abandon/replay/cleanup | Done | Checkpoint retry, abandon, replay without duplicate rewards, cleanup of tagged actors |
| Three repeatable activities | Partial | Courier Runs (fragile/urgent/quiet), Street Circuit (3 laps, local best), Recovery Calls generated and graded; no ghost replay, no verified leaderboard |
| World streaming without hitches | Not started | The whole 0.25 km² district is built once at load; no cell streaming or HLOD. Merged per-block meshes + frustum culling instead |
| Save / migration / recovery | Done | Versioned, checksummed, journaled, rolling backup, v1->v2 migration fixture, import/export (tested) |
| 60 FPS target | Not verified | Only software-rendered (SwiftShader) headless Chrome available: ~10-20 fps there, which says nothing about real GPUs. Sim cost is 0.1 ms/step in Node |
| Settings and accessibility | Done | FOV, density, quality, sensitivity, rebinding, audio buses, subtitles, reduced motion, reduced flashes (lights capped at <= 3 Hz), colour-blind beacon, driving assists, streamer mode; hold/toggle aim only |
| Six enterable interiors | Not started | Doors are facades with signage; shops/safehouse use menus |
| Map / GPS / phone | Done | Full map with legend/filters/click waypoint, GPS route on the road graph, phone tabs |
| Economy / Trust | Done | Cash, Trust 0-5 gating gear (not stats), store, kiosk, garage |
| Day-to-night / weather | Done | Hour-driven sun/moon, sky shader, windows, lamp pools; rain changes grip |
| Audio | Partial | Fully procedural: engines, tyres, sirens, weapons, ambience, two synthesized radio stations, streamer mode. No occlusion/reverb zones, no per-vehicle audio sets |
| PWA / offline | Partial | Manifest + network-first service worker; not tested offline |
| Tooling (editors, debugger, benchmark) | Partial | Headless benchmark (`tests/perf.test.ts`), FPS overlay (F3), Playwright scripts; no editors |
| No proprietary assets | Done | All original (ASSETS.md) |

## Architecture

* **Stack**: TypeScript (strict), Vite, Babylon.js 8 (WebGL 2), Vitest, plain DOM for UI. Chosen because Babylon is the brief's renderer, and Vite gives a fully static build with `base: "./"`.
* **`src/sim`** - pure simulation, no DOM/WebGL, fixed 60 Hz: `world` (deterministic district generation + spatial-hash colliders + raycasts), `nav` (lane graph, sidewalk graph, A*, signals), `vehicle` (data-driven defs, bicycle model, damage), `collision`, `player`/`camera`/`combat`/`weapons`, `traffic`, `peds`, `police`, `chase` (scripted rivals), `missions` + `missionDefs` (graph runtime behind a narrow `MissionHost`), `economy`, `game` (orchestrator, prompts, save snapshots).
* **`src/render`** - procedural world builder (merged per-block meshes, canvas textures, shaders for sky/water), instanced vehicle/character renderers, pooled VFX, shadows (one directional light that follows the player), glow overlays for night windows. Rendering reads sim state with 60 Hz -> display-rate interpolation.
* **`src/ui`, `src/audio`, `src/input`, `src/persistence`** - HUD/minimap/panels, Web Audio synthesis, rebindable input, IndexedDB save repository.
* Missions are data; scripts talk to the game only through typed host calls and cannot spawn traffic/police into view.

## Verification

Commands actually run from a clean checkout state (node_modules and dist deleted first):

* `npm ci` - OK.
* `npm test` - **7 files, 60 tests passed, 0 failed** (vehicle dynamics and stability, collisions, world/nav/signals, weapons, economy, police evidence/arrest/cooldown/caps, mission runtime with a fake host and in the live game, save journal/backup/migration/import-export, perf benchmark).
* `npm run build` - `tsc --noEmit` then `vite build`: OK, `dist/index.html` plus one ~6.2 MB JS chunk (1.4 MB gzip; Babylon is not tree-shaken well) - this exceeds Vite's default chunk warning, which is silenced.
* Served `dist/` under `/play/claude-sonnet-5.5-high/meridian/` with `scripts/serve-subpath.mjs`; headless Chrome (SwiftShader) loaded it with no console errors, started a new game, mounted the bike and rode it; `oneshot/screenshot.png` is that production-build capture (1280x720). Extra captures in `oneshot/`: menu, gunfight with Dispatch response, map panel, night/rain, police chase.
* Sim benchmark (`tests/perf.test.ts`): ~0.1 ms per 60 Hz step average with 20 vehicles and 40 humans (max ~1.6 ms) in Node.

Could not verify: real-GPU frame rate (target 60 FPS / 30 FPS low), actual audio output (headless), service-worker offline use, Firefox/Safari, the full *Hot Cargo* chase played by hand, the street circuit loop in a browser, pointer-lock mouse feel, and IndexedDB behaviour in a real profile (only the memory backend is tested). A bug found late (a collider-query dedupe optimisation that disabled all collisions) was caught by the tests and fixed; browser screenshots taken between that regression and its fix (night, chase) were rendered without collisions but are only visual.

## Assumptions and deviations

* **Physics**: no Rapier. Vehicles use a 2D bicycle model with friction circle, speed-sensitive grip-limited steering and visual pitch/roll (no per-wheel raycast suspension); characters/projectiles use custom circle-vs-AABB and hitscan. Chosen for determinism, testability and time.
* **UI**: plain DOM instead of React; HUD/menus are batched DOM updates.
* **World**: ~490 m road grid (~0.25 km²), flat terrain, no streaming/HLOD/LODs, no baked GI (hemispheric + one directional light + emissive), no interiors; Lantern Hill is faked with building heights; Canal Loop is a park with shallow water.
* **Navigation**: A* over intersection/sidewalk graphs on the main thread (not Web Workers); cheap enough at this scale.
* **Missions**: two of four story missions; *Hot Cargo* replaces witness-clue tracking with a two-radius search area chosen by dialogue.
* **Assets**: procedural low-poly; no skeletal animation, only procedural limb swing; no glTF/KTX2/OGG pipeline.
* **Time of day**: 7 in-game hours in ~45 real minutes, night passes 3x faster; rain starts after ~20:50.
* **Saves**: autosave only when safe (no alert, no recent crash); mission resume restarts from the last checkpoint/start.

## Known issues and limitations

* Performance is unproven on real hardware; ~130k visible triangles and ~100-150 draw calls in typical views (measured via Babylon), which should be fine but is not benchmarked.
* Character and vehicle art is blocky; no animation blending, no vehicle interiors, drivers are not drawn, no ragdolls (down state is a flat tilt).
* Night windows rely on an additive overlay mesh; very close walls can look flat/bright. Wet-road reflections are approximated with lamp pools and specular only.
* Traffic does not yield on unprotected left turns; police can get stuck in dead-end geometry and rely on a back-up/reposition recovery.
* Only the baton, pistol, long gun and two gadgets are carried (by design); weapon wheel is key-driven, not a wheel UI.
* Rebinding supports keyboard keys only; mouse buttons are fixed.
* No fuel, no tow/impound fee system, no clothing beyond five jackets, no horn/radio for NPC cars.
* The service worker and PWA are untested offline; mobile/touch is unsupported.

## Self-assessment

* **Playability: 6/10** - the core loop (ride, steal, shoot, evade police, deliver, shop, save) is implemented and unit-tested, but I could only hand-play pieces of it in a slow software renderer, and feel/tuning is unproven.
* **Visual polish: 6/10** - coherent daylight, dusk and rainy-night looks with textured facades, shadows, lamp pools and a clean HUD, held back by blocky procedural characters/vehicles and no real animation.
* **Brief fidelity: 5/10** - strong on the systemic design (evidence-driven police, witnesses, mission graph, saves, accessibility) but missing two story missions, interiors, streaming, Rapier/React/workers and the full district size.
