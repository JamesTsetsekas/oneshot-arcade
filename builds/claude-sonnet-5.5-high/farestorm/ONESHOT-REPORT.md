# ONESHOT REPORT — Farestorm (claude-sonnet-5.5-high)

## Summary

I built a complete, playable vertical slice of Farestorm: a three.js/TypeScript arcade taxi game set in an original, fully drivable city (Galeport) with a menu → garage → shift → results loop, three taxis with measurably different handling, 24 passenger archetypes, 32 destinations, 32 shortcuts, live traffic, Pulse/Tailwind scoring, and Arcade, Quick and Time Trial modes. The simulation is a pure, deterministic, fixed-60 Hz TypeScript core (no DOM) covered by 61 automated tests, with a procedural renderer, DOM HUD, procedural audio and local persistence on top. It is a slice, not the whole brief: Skill School, ghosts/leaderboards, Rapier/Babylon, key remapping and real pedestrian logic are not built, and I could not play it on a real GPU or listen to the audio.

## Brief coverage

| System / acceptance item | Status | Note |
| --- | --- | --- |
| Launch from URL, static, sub-path safe | Done | `base: "./"`; verified from `/play/claude-sonnet-5.5-high/farestorm/` |
| Core loop: choose taxi → shift → pickup → deliver → chain → end → rank → retry | Done | Verified headlessly end to end (autopilot) and by unit tests |
| Galeport, ~1.4×1.0 km, six districts | Partial | ~0.95×0.65 km flat grid; five districts (Harbor Loop, Old Steps, Sunward Beach, Civic Crown, Lantern Ward). No elevated Highline, no real hills/steps |
| Three taxi handling variants | Done | Gull / Breaker / Tempest; tests assert 0–100 in 4.5–7.5 s, top speed 150–180 km/h, differing accel/mass/steer/drift/shove |
| 24 passenger archetypes | Done | Names, colours, 8 tip preferences, 6 bark types each, subtitles + cooldowns. Visuals are one figure model recoloured, no voice acting |
| 32 destinations | Done | Named, oversized landmark silhouettes (12 designs), reachable by road (tested) |
| ≥18 shortcuts with entry/exit | Done | 32 (alleys, tunnels, garage cut, deck, ferry hold, tram lane, plaza/park/dune/yard cuts; 14 with jump ramps). Corridors tested collision-free; discovery tracked and persisted |
| Arcade Shift / Quick Shift | Done | 60 s + earned time / fixed 5:00 |
| Time Trial | Partial | One fixed four-fare chain with fixed traffic seed and medal times; not six authored chains |
| Skill School | Not started | Hidden (no dead buttons); in-HUD control coaching instead |
| Fare system (markers, pickup rules, patience, par, grades, payouts, extension, failure) | Done | Rules in `src/sim/rules.ts`; grace and clock-zero grace tested |
| Pickup stop rules (<35 km/h in ring, <5 km/h within 3.5 m, rough-stop penalty, ≤1 s clock pause) | Done | Tested |
| Passenger preferences modifying tips | Done | Applied at delivery; shown in breakdown |
| Vehicle: raycast wheels + Rapier | Not started | Custom arcade solver instead (see deviations) |
| Handling: speed-sensitive steering, stability, bounded collision spin | Done | Unit-tested bounces/yaw bounds |
| Surfaces (asphalt, wet, cobble, grass, sand, metal, shallow water) | Partial | All except wet; affect grip/drag/accel/particles; water respawns with penalty |
| Surge Start / Snap Drift / Grip Turn / Tailwind | Done | Each tested for the conditions it needs and for not firing otherwise |
| Jumps / landing / airtime | Done | Real ramp launches, airtime scoring needs ≥0.35 s and alignment; tested on world ramps |
| Style: near miss, needle, drift, oncoming, shortcut, clean sector, precision stop | Done | Per-condition tests; oncoming only on marked boulevards |
| Pulse tiers, decay, collision tier loss / chain break, anti-farm | Done | 1×/2×/3×/5×, 3.5 s decay, same-category falloff floor, drift needs ≥35 km/h, long drifts pay less |
| Tailwind meter (2.2 s, no recharge while active, boost scores nothing) | Done | Tested |
| Pickups (Tailwind tokens, Clock sparks ≤3, Repair arch) | Partial | Tokens and sparks done (21 in world, no respawn); repair arch not built (damage clears on delivery) |
| Traffic (lane graph, signals, following, turns, reacts to taxi, collide/recover) | Partial | 30/44/56 agents, 5 body types × 10 colours; signals, car-following, bezier turns, honk + overtake a stopped taxi, shove physics, self-clearing wrecks. No lane changes in normal flow, no panic/emergency set pieces |
| Pedestrians | Partial | 100 decorative sidewalk walkers that hop away from the taxi; no crossing logic, no safety deflection or penalty |
| Stuck / void reset | Done | Hold R 1 s (−3 s, −150 pts); water respawn; tested |
| Camera (chase, FOV, look-ahead, tilt, shake, look-back, C cycle) | Partial | Near/far/bumper, geometry push-out. No mouse/stick free-look or side glances |
| Keyboard + gamepad | Partial | Both read; gamepad code untested on hardware; no remapping, vibration or one-button drift preset |
| HUD (clock, patience, route arrow, score, Pulse, Tailwind, speed, minimap, edge markers, callouts) | Done | Checked visually at 1280×720 |
| Menus, garage, records, settings, pause, results S–D | Done | Credits too; screenshots in `oneshot/` |
| Accessibility (subtitles, reduced motion, photosensitivity, colour-blind markers, HUD 100/125/150 %) | Partial | Implemented; only 100 % HUD scale visually checked |
| Audio (engine layers, tyres, collisions, UI cues, adaptive music, bark blips) | Partial | All procedural and original; no city-zone beds except surf, no voices, no Doppler. Not audibly verified |
| Persistence (settings, scores, unlocks, shortcuts) | Partial | `localStorage` with versioned migration and corruption fallback; not IndexedDB; no ghosts, no medal gallery |
| Ghost replay, verified leaderboard, daily seed, replay format | Not started | Deterministic stepping + `stateHash()` exist as groundwork |
| PWA / offline | Not started | Static site only |
| Tools (editor, telemetry, benchmark) | Partial | Autopilot bot, headless capture script, tests; no editors or benchmark route |
| Performance target (60 FPS dense traffic) | Not verified | See Verification |
| Error states | Partial | WebGL 2 missing, renderer init failure, context loss, save corruption, gamepad disconnect (pauses). No asset retry / leaderboard errors (no such features) |

## Architecture

* **Stack:** TypeScript (strict), Vite, three.js (WebGL 2), Vitest. DOM for HUD/menus; Web Audio for sound. No runtime dependencies besides three.js.
* **`src/sim/` (pure, deterministic, fixed 60 Hz):** `world.ts` (seeded city: roads graph, blocks, lots, colliders in a spatial hash, destinations, shortcuts, ramps, tokens, surfaces, route queries), `vehicle.ts` (arcade model: world-space velocity with grip damping, drift state machine, Surge/Snap/Grip logic, airborne state, circle-proxy collisions), `traffic.ts` (lane graph agents, signals, wrecks), `fares.ts` (candidate generation, par/tier maths), `score.ts` (Pulse, banking, Tailwind, anti-farm), `sim.ts` (session: clocks, modes, detectors, fares, delivery maths, respawns, results), `rules.ts` (versioned constants), `data.ts` (taxis, archetypes, names). Score logic consumes typed events/awards and never reads render transforms.
* **`src/render/`:** merged vertex-coloured geometry per block (few draw calls), 12 landmark builders, instanced traffic per body type, taxi rig with steering/spin/turbine/boost flame, pooled soft particles, skid marks, chase camera with push-out, animated sea/sky shaders, sun that drifts toward sunset, dynamic resolution.
* **`src/ui/`:** DOM HUD (with canvas minimap and speed lines), menus, results. **`src/audio/`:** engine/tyre/wind layers and a step-sequenced original loop. **`src/persist.ts`, `src/input.ts`, `src/bot.ts`** (verification autopilot only).
* **Why:** the one-shot budget favoured a deterministic custom solver and a lean renderer I could test headlessly over heavyweight physics/engine integration; the sim/render split keeps the brief's technical direction (fixed-step core, typed events, versioned rules) so Rapier/Babylon/workers could be slotted in later.

## Verification

Commands run from a clean state (`node_modules` and `dist` deleted first):

* `npm ci` → installed, `found 0 vulnerabilities`.
* `npm test` → `Test Files 6 passed (6)`, `Tests 61 passed (61)`, ~6 s. Suites: world (9: 32 destinations, ≥18 shortcuts, reachability, collision-free corridors/ramps, closed world, determinism), vehicle (14: 0–100 km/h per taxi, top speeds, taxi differences, braking, Snap Drift/Surge/Grip Turn conditions, drift slip + countersteer, no stationary drift, Tailwind, wall bounce, determinism), score (7: tiers, anti-farm falloff, decay/banking, collision tier loss/chain break, Tailwind charge, ranks), sim (25: fare maths, ≥5 candidates, destination variety, countdown, pickup→delivery loop with clock extension, rough/fast pickups, chaining, Late/failed grace, clock-zero grace, Quick Shift, boarding pause, reset penalty, water respawn, determinism hash, Time Trial chain identity, near-miss, shortcut order/discovery, traffic population/signals/wrecks), style (5: oncoming, clean sector, ramp airtime, precision stop, crash recovery), bot (autopilot completes a fare with each taxi and reaches results).
* `npm run build` → `tsc --noEmit` clean, Vite build: `dist/index.html` 1.09 kB, CSS 16.5 kB, JS 678 kB (190 kB gzip).
* Browser (system Chrome via `playwright-core`, SwiftShader software WebGL, 1280×720, `dist/` served under `/play/claude-sonnet-5.5-high/farestorm/`): no console errors or warnings in any run. `node scripts/capture.mjs shots breaker 7`: menu → garage → arcade run with the autopilot: pickup, delivery (1,215 points, grade shown, shift time added), second fare, shift end at 115 s with 2 deliveries / 2,134 points, results screen rendered. `capture.mjs ui`: records, settings, credits, garage, Time Trial setup, pause overlay (Esc), Time Trial run to results with a bronze medal. `capture.mjs drift`: real keyboard input produced a Snap Drift at 111–130 km/h with slip angle ≈ 0.4–0.55 rad, smoke and skid marks.
* Render stats seen under software GL: ~70–125 draw calls, ~95–100k triangles per frame.
* Screenshots: `oneshot/screenshot.png` (gameplay), plus `menu.png`, `garage.png`, `delivery.png`, `results.png`, `drift-*.png`, `boost.png`.

**Could not verify:** real-GPU frame rate (software rendering ran at roughly 5–10 fps and dynamic resolution dropped to 55–100 %, so the 60 FPS target is unmeasured); audio audibility/mix (code ran without errors but I cannot listen); gamepad on hardware; Firefox/Safari; 1920×1080; HUD at 125/150 %; long soak tests; hand-play feel of handling (tuned by numbers and tests, not by a human driving); Time Trial determinism across frame rates beyond the headless fixed-step test.

## Assumptions and deviations

* **three.js instead of Babylon.js; custom arcade physics instead of Rapier raycast wheels; plain TypeScript DOM instead of React; `localStorage` instead of IndexedDB; no Web Workers.** Chosen for delivery risk; the sim is renderer-independent.
* **City:** a flat grid of ~0.95×0.65 km, five districts, authored by a seeded generator (constant seed, identical every launch). No hills, steps or elevated roads.
* **Shift-time awards:** the brief's +3/+2/+1 base seconds cannot sustain a 5–12 minute run when trips take 25–80 s, so awards are `par × grade factor (1.1 / 0.88 / 0.68 / 0.42) + tier bonus (1/2/3 s)`, capped at 40 s per delivery. Quick Shift and Time Trial grant none.
* **Par:** `path length / 17 m/s + 5 s`, clamped 20–80 s; patience = 1.25 × par. Grades use the brief's fractions of patience left.
* **Pickup is automatic** (no `E` interact); boarding is instant with a ≤1 s clock pause rather than an animation. Side glances not built; `C` cycles the camera.
* **Pedestrians** are decorative; the brief's safety-deflection/penalty is not implemented.
* **Rank thresholds (S 9000 / A 6000 / B 3500 / C 1800) and Time Trial medal times (150/190/240 s)** are my estimates from autopilot runs, not human playtests.
* **Autopilot (`?bot=1`)** is a test aid, clearly not a game feature; URL params `autostart`, `taxi`, `traffic`, `seed` skip menus for verification.

## Known issues and limitations

1. Performance on real hardware is unmeasured; the renderer is draw-call-light but unoptimised for overdraw (large translucent particles/beacons) and the 2048² shadow map follows the taxi.
2. Handling feel is untested by a human; drift/grip constants may need tuning, and the autopilot (which crashes often) is not evidence of good feel.
3. Pedestrians don't interact with scoring; traffic doesn't change lanes in normal flow and could still queue behind a shoved vehicle until its wreck times out (a 9 s wait lets it creep through).
4. No Skill School, ghost, leaderboard, daily seed, remapping, vibration, PWA/offline, or Repair arch pickup; Time Trial has one chain.
5. Audio is synthesized and unheard by me; the mix and music loop may need adjustment.
6. Visuals are stylised low-poly with a procedural look: buildings are boxes with a window texture, passengers are capsule figures, and there is no baked lighting, reflection probes or LOD system.

## Self-assessment

* **Playability: 7/10** — the loop is complete, readable and exercised end to end, with guidance, risk/reward and recovery tools; the unknown is how the handling feels under a human's hands.
* **Visual polish: 7/10** — coherent colourful look, strong HUD, effects and landmarks for procedural art, but geometry is simple and nothing has been seen on a real GPU.
* **Brief fidelity: 5/10** — core loop, scoring, taxis, passengers, destinations, shortcuts and UI are faithfully covered; the tech stack, ghosts/leaderboard, Skill School, pedestrians, remapping and scale of the world are not.
