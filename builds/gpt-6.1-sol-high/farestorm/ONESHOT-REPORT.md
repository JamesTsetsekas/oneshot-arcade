# Summary

Farestorm is a playable, original 3D taxi score chase in a compact procedural Galeport. It includes cab selection, automatic pickup, timed destinations, fare and shift-time rewards, traffic, drift/near-miss style, Pulse, Tailwind, results and local records. The slice concentrates on one repeatable Arcade Shift rather than representing the brief's production MVP as finished.

# Brief coverage

| Major system / acceptance criterion | Status | Evidence / scope |
| --- | --- | --- |
| Launch → taxi → pickup → delivery → rank → retry | Done | Complete Arcade Shift state flow; Skill School portion omitted. |
| Three taxi variants, keyboard/gamepad | Partial | Three acceleration, steering, speed and grip profiles; shared body geometry and collision response, mass is metadata; physical pad unverified. |
| Surge / Snap Drift / Grip Turn / jumps / near miss / oncoming / shortcuts / clean sector / precision stop | Partial | Snap Drift, near miss and arrival accuracy bonus; other detectors absent. |
| Pulse, decay, collision loss, anti-farming | Partial | Movement requirement and per-action cooldown tests; no full category-variety policy or hard-crash reset. |
| Passenger candidates, stop, patience, guidance, payout, time, failure, barks | Partial | Six candidates, twelve identities, all mechanical fare stages; written boarding notices, no voice/personality preferences. |
| 32 destinations and 18 authored shortcuts | Partial | Twelve reachable road destinations in one 470 m district; no authored shortcut triggers. |
| Traffic rules, signals, avoidance, recovery | Partial | Thirty-two deterministic lane followers and taxi collision; no signals, traffic avoidance, turns or rigid-body recovery. |
| Pedestrian safety | Partial | Stationary stylized rider figures only; no pedestrian collision or injury simulation. |
| Fixed-seed Time Trial consistency | Not started | Fixed-step replay and traffic determinism are tested, but Time Trial mode is absent. |
| Reset with penalty and recovery | Done | R snaps to a road, clamps map position, stops motion, costs 3 s and $150. No upside-down state exists in planar physics. |
| Local score, ghosts, verified leaderboard | Partial | Guarded versioned localStorage best score; no ghost or server. Future verifier boundary described in DESIGN.md. |
| Performance / streaming budget | Partial | Resident compact city and instanced windows; no streaming or target-hardware benchmark certification. |
| Readable HUD / accessibility / settings | Partial | Separate clock, patience, route, score, minimap, boost; pause, audio and camera toggles, arrow-key alternative, CSS reduced motion; no remapping/full settings. |
| Original IP, asset provenance | Done | Procedural original meshes, city, interface and synthesized audio; ASSETS.md lists dependencies and sources. |
| Rapier raycast vehicle / suspension / surfaces / props | Not started | Custom fixed-step planar vehicle controller substitutes for full 3D vehicle physics. |
| World streaming, HLOD, LOD, compressed production assets | Not started | Entire small procedural district is resident, no downloaded model or texture pack. |
| React menus / strict TypeScript / Babylon.js | Partial | Strict TypeScript and Babylon.js/WebGL 2; lightweight DOM menus instead of React. |
| Web Audio engine / music / passenger voices | Partial | Synthesized engine and three-note arrival/results chime; no music, voice or city audio. |
| Arcade, Quick Shift, Time Trial, Skill School | Partial | Arcade Shift only; unfinished modes have no visible buttons. |
| PWA / offline installation / IndexedDB migrations | Not started | Static self-contained site after loading, no installed offline guarantee or service worker. |
| Editor, telemetry plots, soak test, benchmark, full-shift video | Not started | Source data and formulas supplied; no full tool suite or recorded video. |

# Architecture

Babylon.js provides the requested WebGL 2 rendering baseline with directional sunlight, soft shadows, procedural meshes, instanced windows, and a speed-responsive chase camera. Strict TypeScript and Vite produce a relative-path static build; the interface uses ordinary DOM/CSS to keep the slice small. All city, vehicle and sound assets are authored in code, avoiding runtime services and asset licensing ambiguity.

`src/sim.ts` is rendering-independent: versioned data, 60 Hz movement, collision, traffic trajectories, fares, style, time and rank. `src/main.ts` handles scene construction, keyboard/standard gamepad input, camera, audio, HUD, menu/results, and guarded best-score storage. `src/style.css` supplies the editorial arcade interface, while `tests/sim.test.ts` exercises twelve rule scenarios. `DESIGN.md` contains formulas, taxi tuning, source-data locations, anti-farm boundaries and the future leaderboard verification boundary. The canvas exposes read-only JSON state in a data attribute for browser-driving diagnostics; it does not grant a mutation API.

# Verification

Initial `node --version` returned v22.12.0 and `npm --version` returned 11.4.2. `npm install` installed 97 packages with zero reported vulnerabilities. Initial `npm test` passed all 12 tests with zero failures; initial `npm run build` passed TypeScript and Vite, with a main-bundle size warning (about 6 MB uncompressed / 1.32 MB gzip). An empty CSS import warning was identified and removed from source before final validation.

Final npm ci completed with 97 packages installed and zero audit vulnerabilities. Final npm test passed 12/12 tests, zero failures. Final npm run build passed strict TypeScript and produced dist/index.html with relative asset references; Vite reported an advisory main-bundle warning.

node tools/serve.mjs served production at http://127.0.0.1:5270/arcade/farestorm/. With PLAYWRIGHT_BROWSERS_PATH set to the workspace browser tools, node tools/capture.mjs ran real Chromium with software WebGL 2 at 1280x720. It used keyboard inputs and a test-only keyboard bot, without mutating simulation state. Browser errors: 0; boarding: ON BOARD · Mira · night-shift cook; pause freezes clock: true; retry starts at zero: true; delivered fares observed: 1. Screenshots are in oneshot/screenshot.png, menu.png, delivery-or-end.png and results.png. Results were reached by allowing the clock to expire naturally.

Physical controllers, Firefox/Edge/Safari, 1080p performance, FPS percentiles, 125/150% scaling, installed offline operation and ghost compatibility were not verified. The local production server was stopped after capture.

Explicit PowerShell removal of `node_modules` and `dist` was rejected by automatic approval review with the reason “blocked by policy,” including a literal-path attempt. The safe validation alternative uses `npm ci` (which refreshes dependencies) and Vite's normal clean-output behavior. Thus the requested explicit delete-both-folders sequence was not completed exactly.

# Assumptions and deviations

- A polished single-mode vertical slice takes precedence over all production-MVP quantities and additional modes.
- A flat 470 m city and custom arcade physics replace a 1.4 × 1 km streamed, hilly world with Rapier suspension.
- Passenger par uses direct distance and a generous constant, rather than a legal-road graph solver. Route dots use road-grid heuristics.
- Shift extensions are intentionally 5–12 seconds to let short-session deliveries meaningfully extend the run; boarding does not pause the shift clock, and there is no final destination grace after overall time expires.
- The third-person camera, UI layout, vehicle designs, world coordinates and sound cues are original. No external images, fonts, game source, remote repositories or services were used.
- DOM menus replace React; localStorage replaces IndexedDB; audio is synthesis rather than recorded/compressed content.
- A generated main bundle over 1.8 MB produces an advisory build warning, not a failed build.

# Known issues and limitations

1. City and handling are deliberately compact and planar. There are no authored jumps, elevation, terrain surfaces, destructible props or shortcut scoring, and the chase camera can intersect buildings near tight turns.
2. Traffic follows repeating straight lanes without signals, avoidance, or mutual collisions. Mass does not change collision response; style cooldown protection is simpler than the production brief and repeated moving actions remain farmable.
3. Only Arcade Shift is shipped. No Skill School, other modes, ghosts, verified leaderboard, PWA, progression, full accessibility/settings suite, or certified 60 FPS hardware benchmark is present.

# Self-assessment

- **Playability: 7/10.** A complete pickup/delivery score loop with three tunings and readable feedback, limited by simple traffic and compact routes.
- **Visual polish: 7/10.** Cohesive original coastal colors, modeled cabs, sunlit streets and a deliberate interface, with primitive geometry and no bespoke character animation.
- **Brief fidelity: 4/10.** The essential taxi-shift loop and Babylon/TypeScript direction are retained, but production scale, Rapier, modes and several advanced systems are omitted.
