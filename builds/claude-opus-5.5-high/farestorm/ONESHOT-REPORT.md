# Farestorm: One-shot Report

## Summary

I built Farestorm, a playable arcade taxi game in Babylon.js. It is set in Galeport, an original 1.4 × 1.0 km coastal city with six districts, 32 landmark destinations and 18 authored shortcuts. The full loop works from start to finish: pick a cab, start a shift, choose colour- and shape-coded fares, stop in the pickup ring, race the passenger's patience timer (drifting, skimming traffic, jumping and cutting through shortcuts to build Pulse and Tailwind), stop in the destination ring, collect the graded fare breakdown and extra shift time, chain fares until the clock runs out, then get a rank, a saved best and one-key retry. On top of that loop are Quick Shift, Time Trial (six fixed chains, medals and a saved ghost), a 10-lesson Skill School, procedural Web Audio with an adaptive original soundtrack, settings and accessibility options, and a deterministic, fixed-step simulation covered by 53 headless tests.

## Brief coverage

| System / acceptance criterion | Status | Note |
| --- | --- | --- |
| Launch → Skill School → choose taxi → Arcade Shift → pickup/deliver → award → end → rank → restart | Done | Each step was run in a real browser (see Verification). The full-fare lesson is also covered by a test. |
| Three taxis that differ measurably | Done | Gull, Breaker and Tempest: 0–100 km/h in 5.0/5.3/5.9 s, top speeds about 158/171/182 km/h, different mass, shove, steering and drift. Tested. |
| Keyboard + gamepad | Partial | Keyboard was verified in a browser. Gamepad uses the standard-mapping Gamepad API but was **not tested on hardware**. |
| Surge Start, Snap Drift, Grip Turn, Tailwind, airtime, near miss, oncoming, shortcut, clean sector, precision stop | Done | Each fires only under its own conditions. Unit tests cover surge, drift, grip turn, airtime threshold, near miss, shortcut, Tailwind cap, precision pickup. Oncoming and clean sector are implemented but have no dedicated unit test. |
| Pulse grows, decays, drops a tier on collision, resists farming | Done | 1×/2×/3×/5×, 3.5 s decay, a bump drops one tier, a crash resets, repeats give diminishing charge. A stationary-spin + boost farm scores 0 (tested). |
| Passenger candidates, pickup, patience, guidance, stop, grades, fare, tips, time extension, failure, barks | Done | Always at least 5 candidates spread over short/medium/long tiers, plus VIP specials. 24 archetypes, 9 tip preferences, subtitled chirp-voice barks with cooldowns. |
| 32 destinations reachable; 18 shortcuts with valid entry/exit and time or tactical value | Done | Tests check every hub → destination route, clear shortcut corridors and gates, and that ≥10 shortcuts beat the legal route. The others are stunt or traffic-avoidance routes. |
| Traffic obeys lanes/signals, avoids, reacts, collides and recovers, no unavoidable blockers | Partial | Lane graph, 56 signalised junctions, following, lane changes, horn reaction, knock-back and recovery, and spawn outside the view all work. AI cars do not collide with each other: a deadlock breaker briefly lets them pass through each other. |
| Pedestrian safety assist and penalty, no graphic impacts | Done | Pedestrians leap away, the cab is braked, and there is a −150 / −1 s penalty. No contact physics. The assist never adds score. |
| Fixed-seed Time Trial repeatable across frame rates | Done | Chains are fixed by seed, and the state hash is identical at 60 Hz, 144 Hz and jittered frame rates (tested). Traffic diverges once the player hits it, because traffic reacts to the player. |
| Stuck / void reset within 2 s with penalty | Done | Hold R for 0.6 s, or splash into water and auto-respawn after 1 s. Both cost −3 s and −500 (tested). The cab cannot flip, so "upside-down" can't happen. |
| Local score/ghost persistence; verified leaderboard | Partial | Scores, medals, lessons, shortcuts and Time Trial ghosts persist in IndexedDB with versioned migrations (tested). Ghost playback is a translucent cab. **No online leaderboard or verifier was built.** |
| 60 FPS on target hardware; streaming | Partial | The headless Edge capture reported 60 FPS. No real benchmark route was run. The whole city stays resident; there is no cell streaming. |
| HUD readability, 100/125/150% scaling, remapping, assists, subtitles, colour-blind, reduced motion, photosensitivity | Done | All options are present and wired up. Each one was only spot-checked visually. |
| No proprietary content | Done | All names, layout, models, textures and audio are original and generated in code. |
| Modes: Arcade, Quick Shift, Time Trial, Skill School | Done | Six trial chains, ten lessons. |
| Camera (chase spring arm, FOV 78→96°, look-ahead, glances, look-back, free look, cycle, collision, crash impulse) | Done | Free look is mouse-drag or the right stick. The camera-cycle key is V, because C is used for a glance (per the brief's Z/C resolution). |
| Surfaces (asphalt, wet, cobble, grass, sand, metal, shallow water) | Done | Each changes grip, drag, top speed, rumble audio and particles. |
| Pickups: Tailwind tokens, Clock sparks (≤3 per shift), repair arches; props scatter and reset | Done | Nothing respawns within a shift. Props are pooled and return home when out of sight. |
| Cosmetic damage | Partial | Severe damage cuts acceleration by 12% until a delivery or a repair arch. There are **no visible dents**, only a HUD note. |
| Garage, liveries, driver cosmetic | Partial | Six liveries per cab, four unlocked through Skill School and medals. No driver-outfit choice. |
| Audio (engine layers, tyres, surfaces, zones, cues, adaptive music, ducking, voices) | Partial | All synthesized and wired to events. **Not listened to**: headless capture has no audio output. |
| Tools (lane/shortcut editor, par solver, telemetry plots, traffic soak, benchmark), PWA/offline, WebGPU, Rapier, React | Not started | See Assumptions and deviations. |

## Architecture

- **Stack.** I used strict TypeScript and Vite (`base: "./"`, so the build works from any sub-path), with Babylon.js 9 on WebGL 2 for rendering, vanilla DOM for the HUD and menus, the Web Audio API for sound, IndexedDB for saves, and Vitest for tests. All art is generated in code, so the source tree is tiny and there are no asset licences to manage.
- **`src/sim` is a deterministic simulation** with no DOM and no Babylon, so it runs headless in tests:
  - `world/city.ts` + `layout.ts`: the Galeport generator. It builds the road graph and lanes, the terrain height field, authored ramp/deck/stair volumes, the canal cut, colliders (spatial hash), destinations, pickup spots, shortcuts with gates, items, props, A* legal routing and surface lookup.
  - `vehicle/vehicle.ts`: an arcade raycast-wheel cab. Four wheel samples on the height field drive a stick-or-fly rule, so ramps and crests launch the cab. It has a grip/drift bicycle model, speed-sensitive steering, Surge, Snap Drift and Grip Turn detection, SAT collisions against static colliders with 2 sub-steps, ledge blocking, and air control.
  - `traffic/traffic.ts`: lane graph with signals, Bézier turns, following, lane changes, horn reactions, knock and recovery, and out-of-view spawning. `traffic/peds.ts` handles sidewalk pedestrians with dodges.
  - `score/score.ts`: Pulse, Tailwind, grades, par times, shift-time awards, fare breakdowns and ranks, versioned as `RULES_VERSION`.
  - `fares/`: 24 archetypes plus barks, the candidate distributor, Time Trial chains and medals.
  - `session/session.ts`: the fixed 60 Hz orchestrator. It consumes `InputFrame`s, emits typed `GameEvent`s, and holds mode rules, detectors, clock, reset, lessons, ghost and input recording, and a state hash. `stepper.ts` handles fixed stepping with capped catch-up plus render interpolation.
- **`src/render`** builds merged vertex-coloured geometry (`geo.ts`), the city (`cityMesh.ts`), cabs, traffic, people and landmarks, the camera rig, particles, a sky shader, one shadow-casting sun, and bloom, ACES tonemapping and colour grading. It also handles dynamic resolution and context-loss handling. Traffic uses mesh instances; pedestrians and trees use thin instances.
- **`src/app.ts`** owns menus, mode routing, pause and results, records, settings and remapping, ghost playback, and the gamepad-disconnect and context-loss overlays. **`src/ui/hud.ts`** draws the HUD, minimap and full map. **`src/audio/audio.ts`** synthesizes all sound.

## Verification

These are the commands I ran in the final clean state, after deleting `node_modules` and `dist`:

| Command | Real result |
| --- | --- |
| `npm ci` | Completed, "found 0 vulnerabilities". |
| `npm test` | `Test Files 6 passed (6)`, `Tests 53 passed (53)`. |
| `npm run build` | `tsc --noEmit` is clean. Vite reports `✓ built`: `dist/index.html` plus `assets/app-*.js` at 6,495.79 kB (1,474.50 kB gzip). `dist` totals 8.2 MB. |
| `node scripts/screenshot.mjs` (SHOTS=menu,select,play) | Serves `dist/` under `/play/claude-opus-5.5-high/farestorm/` in headless Edge 1280×720. It loaded the menu, opened Arcade → taxi select → Start shift, forced the results screen, and captured `oneshot/screenshot.png` mid-shift at 60 FPS. That shot is a real frame from the `?autodrive=1` demo driver at the moment it picked up a passenger. |
| `node scripts/flows.mjs` | Exercised Time Trial, two Skill School lessons, Quick Shift and every menu screen. It reported `errors: none`. This run also found a crash when starting a second session (Retry); I fixed it. |
| `node scripts/keyboard.mjs` | With real key events and no autopilot: 63 km/h after holding W for 3 s, Snap Drift engaged with D + Space, Esc paused. No page errors. |

The test suites cover:
- world validity: connectivity, reachability, landmarks, corridors, gates, water;
- handling: acceleration, top speed, braking, drift, surge, grip turn, ramps, collisions;
- Pulse and Tailwind anti-farm, grades, awards and breakdowns;
- session rules: pickup, delivery, bail-out, shift end, reset, splash, VIP;
- determinism across frame rates and fixed Time Trial chains;
- an autopilot completing fares through traffic;
- lessons and save migrations.

**What I could not verify:**
- That the handling *feels* good to a human. I tuned it from telemetry and checked it only with scripted inputs.
- The audio, because headless capture has no sound output.
- Gamepad play on hardware.
- Firefox or Safari.
- Performance on a real GPU at 1080p with a dense benchmark; the only number I have is the headless 60 FPS.
- That every shortcut is actually fun to drive. I sanity-checked the geometry for collisions; the Seawall Kicker and Garage paths are exercised by tests.

## Assumptions and deviations

- **Physics.** I used a custom deterministic raycast-wheel controller on an analytic height field with SAT box collisions instead of Rapier WASM. It is fully testable in Node, bit-reproducible across frame rates, and much easier to tune for arcade feel in one session. The trade-off is that the cab cannot flip or tumble: body pitch and roll are visual only.
- **UI.** Menus and HUD are vanilla DOM and TypeScript instead of React, which means less tooling with the same result.
- **Shift-time awards.** The brief's +3/+2/+1/+0 grade seconds plus +1/+2/+3 tier seconds cannot sustain its own 5–12 minute session target when par times are 20–80 s. I kept those numbers as the grade and tier bonus and added a distance credit of `0.65 × par`, capped at 45 s per fare. Late deliveries get `0.3 × par` and failed ones get 0.
- **Arcade rendering.** No baked lightmaps, reflection probes, LOD/HLOD, KTX2 or glTF. The city is merged procedural geometry with one real-time shadow map, hemispheric fill, bloom and colour grading. There is no WebGPU path.
- **"Highline".** It is an at-grade fast boulevard over hill crests rather than a true multi-level viaduct, because the height field has a single level. Parking decks and the ferry deck are raised plateaus.
- **Style tips** ride with the passenger and are paid on delivery; a failed fare pays half. Tips earned with no passenger aboard are banked immediately.
- **Not built:** no service worker or PWA offline cache, to avoid stale-cache risk on shared arcade hosting. There is also no online leaderboard or verifier, no daily seed, and no developer tools or editor.
- **Camera-cycle key** is V; glances are on Z and C as the brief suggests.
- **Unlocks.** All three cabs are unlocked from the start, so reviewers can compare handling. Skill School and medals unlock liveries instead.

## Known issues and limitations

- Handling is unplaytested by humans. Drift tuning, steering speed and par times may need adjustment after real play.
- AI cars never collide with each other. At unsignalised junctions they can briefly overlap, since a deadlock breaker lets them ghost through.
- A collision can knock a traffic car into a position where it ends up stranded; it despawns once you are more than 60 m away.
- Landing on a deck's vertical face (for example a short Overpass Gap jump) stops the cab dead. Some one-way shortcuts (terraces, garage) block driving against the flow with a wall-like ledge.
- There is no visual damage; severe damage only reduces acceleration until repaired.
- The minified JS bundle is 6.5 MB (1.5 MB gzip) because Babylon is imported from its root. Deep imports would shrink it.
- Changing the shadows setting takes effect only if shadows were enabled at boot; otherwise a reload is needed.
- The `?autodrive=1` demo driver is simplistic. It is used only for screenshots and smoke tests.

## Self-assessment

- **Playability: 6/10.** The complete loop runs end to end with real decisions (fare tiers, shortcuts, Pulse and boost), but the feel has never been tuned by a human hand.
- **Visual polish: 6/10.** The late-afternoon coastal city with neon, landmarks, beams, particles and a chunky HUD reads clearly, but everything is low-poly boxes with simple lighting.
- **Brief fidelity: 6/10.** The core gameplay systems, modes, 32 destinations, 18 shortcuts and 24 archetypes are in. Rapier, React, LOD and streaming, the online leaderboard, tools and PWA were deliberately left out.
