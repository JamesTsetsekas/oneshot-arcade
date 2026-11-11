# Farestorm - Oneshot report

Model: Fable 5.2 (Claude Code, high effort). Date: 2026-11-11.

## Summary

Farestorm is a playable vertical slice of an original arcade taxi game: one procedurally built coastal city (Galeport,
six districts, 32 destinations, 18 shortcuts), three raycast-wheel cabs on Rapier physics, lane-following traffic with
signals, and a complete fare loop with patience grading, Pulse style chains, Tailwind boost, shift-time extension,
results, rank and local records. It ships four modes (Arcade Shift, Quick Shift, three Time Trial chains, a ten-lesson
Skill School), React menus, a DOM HUD with minimap and city map, procedural audio and music, and settings with
remapping and accessibility toggles. The simulation is renderer-independent and deterministic, so 42 headless tests
drive whole shifts, corners, jumps and traffic soaks; no human has played the build, so "feel" is tuned from telemetry
and screenshots only.

## Brief coverage

| System / criterion | Status | Note |
| --- | --- | --- |
| Core loop: select cab, start shift, pickup, deliver, time/score award, chain fares, end, rank, save, retry | Done | Driven end to end by the autopilot in tests and in the browser capture. |
| Babylon.js + WebGL 2 rendering | Done | One sun with PCF shadows, fog, bloom/FXAA pipeline, instanced props, dynamic resolution. No baked lighting, probes, LOD/HLOD, WebGPU. |
| Strict TypeScript, fixed 60 Hz sim, render interpolation, React menus, light HUD | Done | `strict` on; sim is headless-capable; HUD is imperative DOM. |
| Rapier 3D + custom raycast-wheel controller | Done | Suspension rays, impulse tyres, CCD, bounded angular velocity, upright recovery. |
| Three taxis that measurably differ | Done | Mass, 0-100 (4.8 / 5.3 / 5.9 s), top speed (154 / 163 / 170 km/h), steering, drift grip; verified by tests. |
| Surge Start, Snap Drift, Grip Turn, Tailwind | Done | Each has a condition test; Grip Turn effect itself is not separately measured. |
| Chase camera (yaw lag, FOV 78-96, look-ahead, free look, glances, look back, 3 modes, shake, tilt, collision) | Done | Reverse view is a simple rear flip. Not judged by a human for comfort. |
| Keyboard controls + remapping | Done | Rebind UI exists; not exercised by automated tests. |
| Gamepad | Partial | Implemented (analog triggers/stick, buttons, rumble, disconnect pause) but never tested on hardware. |
| Surfaces (asphalt, cobble, grass, sand, deck, dirt, shallow water) | Done | Grip, drag, dust colour, audio layer, scoring eligibility. No wet-road variant. |
| Cosmetic damage | Partial | Collisions accumulate a small acceleration penalty that resets on delivery; no visual dents. |
| Passenger markers (4 tiers by colour and shape), pickup ring, boarding, patience, grades, payout breakdown | Done | Boarding/unloading pause the clock for at most 1 s. No boarding animation; the figure disappears and a cheering figure appears at the drop. |
| 24 passenger archetypes with preferences and barks | Done | 24 named archetypes, 5 preference types, subtitle barks with cooldown and a pitched "voice" blip. No recorded voices. |
| Style events (near miss, thread, drift, air, oncoming, shortcut, clean sector, precision stop) | Done | All emitted from typed sim events; anti-farm tests for drift. Oncoming/clean-sector detectors have no dedicated tests. |
| Pulse 1x-2x-3x-5x, decay, collision loss, diminishing repeats | Done | Unit tested. |
| Galeport: six districts, three overlapping loops | Done | Grid with jittered nodes, coast boulevard, Crown Avenue, Lantern Parade, Highline viaduct + off-ramp, canal with three bridges. |
| 32 destinations with large silhouettes | Done | 32 named sites, 17 landmark generators, all mutually reachable (tested). No per-site audio. |
| 18 authored shortcuts with readable entrances | Partial | 18 exist with gates, painted corridors and entry/exit detection. Jumps (pier, canal, kicker) and corridor clearance are tested; most alleys were not individually driven; Highline Drop is untested in motion. |
| World barriers and water/void respawn | Done | Rim rock, hidden bounds, water and flip respawn with -3 s and -200 points (tested). |
| Arcade Shift / Quick Shift | Done | Tested. Arcade adds a pickup time advance (see deviations). |
| Time Trial | Partial | 3 chains (brief asks for 6), fixed seeds, par-derived medal times. |
| Skill School | Partial | 10 lessons as objectives in the open city with guidance to ramps/shortcuts, not bespoke compact courses. First three lessons are auto-tested. |
| Traffic: lane graph, signals, speed profiles, spawn/despawn, obstacle reaction, strike physics and recovery | Partial | 26/40/54 vehicles, 5 body styles x 6 colours. No lane changes, horn reaction, emergency vehicles or junction arbitration beyond signals. |
| Pedestrians | Partial | 56 decorative sidewalk walkers that hop clear of the cab. No crossings, no penalty, no brake assist (they never enter the road). |
| Items: Tailwind token, Clock spark, Repair arch | Partial | Tokens in 14 ground shortcuts and 3 capped Clock sparks over jumps (tested by teleport). Repair arch not built. |
| HUD (clock, fare panel, arrow, score, Pulse, Tailwind, speed, minimap, callouts, delivery overlay, edge indicators) | Done | Verified in screenshots at 100% scale only. |
| Menus: main, cab select, pause, results, records, settings, how to play, credits | Done | Garage is the cab-select screen (no cosmetics). |
| Settings: quality, dynamic resolution, FOV, shake, HUD scale, assists, keybinds, audio buses, subtitles, reduced motion | Partial | No colour-blind/photosensitivity presets, texture/shadow sub-options or crowd toggle. Fare tiers are distinguished by shape as well as colour. |
| Audio: engine, tyres, wind, impacts, cues, music, ducking | Partial | All procedural and wired to events; nobody has listened to it. No city-zone ambience. |
| Persistence (IndexedDB, versioned migration) | Done | Settings, profile (shortcuts, medals, lessons), run records. Reload check passed in the browser run. |
| Ghost replays, verified leaderboard, daily seed | Not started | Sim is deterministic and input-driven (tested), which is the prerequisite; nothing records or verifies. |
| PWA / offline cache, streaming cells, KTX2/glTF pipeline | Not started | No external assets exist; whole city is resident. |
| Tools: editors, par calculator, telemetry, benchmark | Partial | Telemetry and soak tests, autopilot, screenshot tour. No editors or formal benchmark route. |
| Error states (graphics init, context loss, storage failure, gamepad disconnect) | Partial | Handled in code; only the happy path was exercised. |
| Acceptance: fixed-seed Time Trial repeatable | Done | Same chain, traffic seed and medal times; determinism hash test. Not checked across different frame rates in a browser (sim is fixed-step). |
| Acceptance: 60 FPS on target hardware | Not verified | Headless Edge on the dev machine reported about 130 fps at 1600x900 medium. No target-hardware or 1%-low measurement. |
| Acceptance: no proprietary content | Done | All names, layout, art and audio are original and generated in code. |

## Architecture

- **Stack**: TypeScript (strict), Vite, Babylon.js 9 for rendering, Rapier 3D (WASM compat build) for physics, React 19
  for menus, Web Audio, IndexedDB, Vitest. These follow the brief's technical direction; the slice omits the optional
  backend, workers and asset pipeline because nothing needs them at this scale.
- **Pure-data world model** (`src/world`): authored data (`galeport.ts`) is expanded once into terrain heights, a road
  graph with all-pairs routing, buildings, structures, ramps, sites, shortcuts and props. Physics, traffic, fares,
  the renderer and the minimap all read the same model, so collision and visuals cannot drift apart.
- **Simulation core** (`physics`, `vehicle`, `traffic`, `fares`, `score`, `game-session`): no DOM or renderer imports.
  `Session.step(input)` advances one 60 Hz tick and emits typed events. Scoring consumes those events only.
- **Presentation** (`renderer`, `camera-input`, `audio`, `ui`): reads session state each frame, interpolating between
  ticks. All geometry and textures are procedural (`meshbuf.ts`, `textures.ts`).
- **App shell** (`app-shell/game.ts`): boot with capability checks, fixed-step accumulator with a catch-up cap, mode
  routing, persistence and the bridge to React through a small external store.
- Rules are versioned per module and combined into a `RULES_VERSION` saved with each record. Formulas and the tuning
  sheet are in `docs/RULES.md`.

## Verification

Commands run from a clean state (after `rm -rf node_modules dist`) on Windows 11, Node 22.12.0, npm 11.4.2:

| Command | Result |
| --- | --- |
| `npm ci` | Succeeded, 0 vulnerabilities reported. |
| `npm test` | Exit 0. 4 test files, **42 tests passed, 0 failed**, about 22 s. |
| `npm run build` | Exit 0. `tsc --noEmit` clean; Vite wrote `dist/index.html` with relative `./assets/...` URLs. Main chunk 11,047 kB (3,195 kB gzip); `dist` is 13 MB. |
| `node tools/screenshot.mjs all` | Served `dist/` at `http://127.0.0.1:5372/play/claude-fable-5.2-high/farestorm/` and drove headless Edge (playwright-core) at 1600x900. Menu, cab select, gameplay, map, pause, results all rendered; **0 console errors or warnings**; about 128-130 fps reported by the game. After a reload the menu showed "Best Arcade Shift 206", confirming IndexedDB persistence. |

What the tests cover: content counts (32 / 18 / 24), physics heightfield vs. analytic terrain, all-pairs destination
reachability, destinations and shortcut corridors clear of buildings, shortcut advantage, lane-graph closure, taxi
acceleration / top speed / braking targets and ordering, slalom stability, Surge Start window, a Snap Drift through a
90 degree junction for all three cabs, drift anti-farming, Grip Turn gating, Tailwind duration and no-recharge, ramp
airtime, the pier and canal jumps, wall collisions, harbor respawn, Pulse rules, grades, time awards, par bands,
candidate distribution, signal phases, settings migration, record ordering, a full autopilot Arcade Shift, determinism
hashes, clock expiry, manual reset penalty, Quick Shift, a Time Trial chain, Skill School lessons 1-3, pickups, and a
two-minute high-density traffic soak.

Not verified:

- **Human play.** Nobody drove the game. Handling, difficulty, score thresholds and time economy come from telemetry,
  the autopilot (which cruises at 76 km/h and crashes often) and reasoning. This is the largest unknown.
- Audio by ear, gamepad hardware, Firefox, Safari, real GPUs other than the dev machine, 1280x720 and 125/150% HUD
  scale layouts, key rebinding in the browser, the pause/settings/records screens beyond one screenshot each.
- Skill School lessons 4-10 and Time Trial routes 2-3 in a browser; most alley shortcuts driven end to end; Clock
  sparks collected during a real jump (the test teleports the cab to them).
- Frame-time budgets from the brief (draw calls, triangles, memory) were not measured.

## Assumptions and deviations

- **Pickup time advance.** The brief's delivery awards (+0 to +6 s) cannot sustain its 5-12 minute Arcade session, so
  pickups also add 46-74% of par time to the Shift Clock, shrinking as deliveries accumulate. Delivery awards follow
  the brief exactly.
- **Par formula.** Par is `6 + distance / 20` seconds; tier distance bands were chosen so par lands in the brief's
  20-35 / 35-55 / 55-80 s bands. Long fares can reach 81 s.
- **Pickup tolerance.** Boarding triggers when stopped (below 5 km/h) anywhere in a 7.5 m ring; the brief's 3.5 m and
  35 km/h entry define the "clean pickup" bonus. A rough stop costs 4% patience.
- **Glance keys.** The brief's key list conflicts with itself (E, Z/C, C). Pickup is automatic, so Q/E glance, X looks
  back and C cycles cameras.
- **Destinations double as pickup stands.** Passengers hail from the 32 named sites.
- **Arcade drift model.** Releasing the handbrake applies an explicit "exit assist" that pulls velocity onto the
  heading. It is deliberately non-physical so keyboard players can take junctions at speed.
- **Reverse camera** flips to a rear view after half a second of reversing rather than easing partially.
- **Special fares** are "Storm Express" long trips at double fare and tighter par, queued when Pulse reaches 3x.
- **Route arrow** is a tilted dial of three chevrons above the cab ("the vane"), pointing at a pursuit point 35-60 m
  along the legal route.
- **Fonts** are two OFL families bundled from npm; everything else is generated.
- Babylon is imported from the package barrel for safety, which makes the bundle larger than the brief's 8 MB shell
  budget (uncompressed).
- `?autopilot`, `?autostart` and `window.__farestorm` exist for the capture tooling and are harmless in play.

## Known issues and limitations

1. Unplayed by a human: tuning, difficulty and rank thresholds may be off. The autopilot survives 3-4 minutes.
2. The JS bundle is 11 MB (3.2 MB gzipped), there is no code splitting, and no service worker for offline play.
3. Traffic has no junction arbitration beyond signals (turning cars can pass through each other), no lane changes, and
   struck cars slide back to their lane rather than driving back.
4. Flicking a Snap Drift on a straight at high speed and then trying to return to the original heading tends to run
   wide into the kerb; the drift model is tuned for corners.
5. Ground texture is 0.68 m per pixel, so painted chevrons and kerbs are soft up close; block interiors are plain
   lawns; the world rim is a flat-topped rock wall.
6. Pedestrians are decorative; the brief's safety assist and penalty are not implemented.
7. No ghosts, replays, leaderboard, daily seed, cosmetic unlocks, repair arch, boarding animation or visual damage.
8. Time Trial has 3 routes instead of 6; Skill School reuses the open city.
9. A wheel ray that lands exactly on a heightfield grid line can miss for one tick (seen in a test at integer
   coordinates); the effect in play should be a single-frame suspension blip.
10. Tailwind tokens and Clock sparks are placed by rule, not hand-tuned; some may sit awkwardly.
11. Landmarks use a simple cylinder collider that does not match their silhouettes (arches cannot be driven through).
12. Gamepad, HUD scaling above 100% and non-Chromium browsers are untested.

## Self-assessment

- **Playability: 7/10.** The whole loop works start to finish with solid, tested handling, guidance and feedback, but
  no human has confirmed that it feels good or is balanced.
- **Visual polish: 7/10.** A cohesive, colourful low-poly city with readable HUD and menus, held back by soft ground
  textures, simple vehicles and no animation on characters.
- **Brief fidelity: 6/10.** The technical direction and most core systems are honoured in reduced form, while ghosts,
  leaderboard, PWA, half the Time Trials and several traffic/pedestrian behaviours are missing.
