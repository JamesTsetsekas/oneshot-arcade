# Summary

Built an offline, first-person Cipher Breach practice match with ten local operatives on an original two-vault Aperture Annex map. The playable loop includes requisitions, lethal hitscan combat, bots, finite sight-denial utility, planting and disarming, persistent money, death spectating, halftime, and a first-to-four result screen. Babylon.js renders procedural research architecture and original geometric characters and weapon art without external services or downloaded game assets.

# Brief coverage

| Major system / acceptance criterion | Status | Evidence / scope |
| --- | --- | --- |
| Start-to-finish playable match | Done | Local practice match, first to four, up to seven rounds, halftime after three |
| Ten connected clients, acceptance, warmup, both halves and overtime | Not started | Ten local actors, one human; no transport, queues or multiplayer |
| Babylon.js / WebGL 2 / static sub-path deployment | Done | Vite relative base, WebGL check, original procedural scene |
| TypeScript fixed-step simulation/render separation | Done | Simulation advances at 64 Hz; rendering and HUD separately updated |
| React menus, Rapier capsules | Not started | DOM menus and deterministic AABB queries replace these in this slice |
| Buy and invalid-purchase rejection | Done | Weapon, armor, utility and side-specific tool purchases validate credits and phase |
| Refund, weapon drop/pickup, offers, idempotent request log | Not started | No network transactions or gear trading UI |
| Economy carryover, loss bonus, cap, objective rewards, halftime reset | Partial | Implemented; no timer-loss penalty, no refunds or team prediction |
| Cipher arm at either vault, interruption, 35 sec detonation | Done | 3.2 sec arm, held interaction, legal-zone validation |
| Both disarm timings and post-arm elimination rules | Done | 8 sec / 5 sec tool, all attackers dead does not stop armed clock |
| Cipher carried, dropped and recovered | Partial | Carrier death drops position; automatic proximity pickup; no deliberate drop control |
| Movement accuracy, recoil, rate of fire, reload, armor and hit zones | Partial | Seeded spread/climb, head/body, armor, magazines and cooldowns; local authority only |
| Penetration, full recoil patterns, falloff, grenades | Partial | Basic distance falloff and Veil; no penetration or ballistic projectiles |
| 12 weapons, five utility types, models and animations | Partial | Three data-driven weapons, one shared original viewmodel, one utility, procedural kick/reload |
| Original Annex with two vaults and distinct routes | Partial | Turbine, garden, freight and calibration lanes; no playable gantry/crawl or measured rotation timings |
| Collision consistency and map analysis | Partial | Rendered cover uses simulation geometry; route and wall tests; no complete fairness scanner |
| Bot take, hold, rotate, plant, retake, disarm | Partial | A* navigation, alternating site plans, line-of-sight targeting and smoke occlusion; no hearing/FOV/advanced planner |
| Team-only death spectating and tactical map | Partial | Living teammate perspective and own-team map; no authorized broadcast modes |
| Reconnect, simultaneous session exclusion | Not started | No server or sessions |
| Netcode: snapshots, prediction, lag compensation, network lab | Not started | No transport; tests make no claims about latency behavior |
| Matchmaking, rating, durable results, cosmetic progression | Not started | Match result exists only for current session |
| Post-match round timeline and combat statistics | Partial | Round winners/reasons, score, player eliminations and deaths; no economy graph or full analytics |
| Settings and accessibility persistence | Partial | Local sensitivity and audio toggle persist; no rebinding, crosshair editor, colorblind or flash options |
| Original tactical audio and spatial cues | Partial | Synthesized weapon, hit and objective tones; no positional footsteps or HRTF |
| Performance budget: 60 FPS and server tick load | Not started | No hardware/load benchmark; headless software rendering is not a representative FPS test |
| Privacy and anti-cheat | Partial | No telemetry or external services; no multiplayer integrity or trusted execution claims |
| Original IP, licensed assets, source/build/test artifacts | Done | Original geometry/audio/UI; dependency licenses in ASSETS.md |
| Fleet guide, replay format/viewer, threat model, collision hashes | Not started | No server fleet, replay system, or deployment infrastructure |
| Recorded full match | Not started | Full match verified in simulation; gameplay screenshots only |

# Architecture

Vite and strict TypeScript build a static Babylon.js application. The bundled `babylonjs` npm distribution matches the brief's renderer choice and provides WebGL 2, geometry, shadows, material lighting, and camera transforms; all assets are generated locally. Node's built-in test runner executes the shared TypeScript simulation through Node 22.12's experimental type stripping, avoiding a separate browser or network dependency for rules testing.

- `src/simulation.ts`: ruleset identifier, actor/content types, weapon/economy tables, shared collision source, pathfinding, seeded combat, visibility, bots, objective, rounds and match result. No DOM or renderer dependency. `botsEnabled` allows focused rules fixtures with autonomous actors disabled.
- `src/main.ts`: Babylon scene, original environment/character/viewmodel construction, static geometry batching, input/pointer lock, synthesized audio, local fixed-step adapter, HTML menus and non-React HUD. Read-only diagnostics expose phase, local actor location and rendering information for QA.
- `src/style.css`: visual identity, HUD, buy panel, map, pause/settings and result layout.
- `tests/simulation.test.mjs`: rules fixtures and complete deterministic bot-filled match.
- `tools/capture.mjs`: temporary static server under a non-root URL and production Chromium smoke/capture checks, with cleanup in a finally block.

The simulation owns all mutable game truth within this one local process. This is an architectural separation for future server extraction, not server authority or anti-cheat. Wall line-of-sight currently uses 2D conservative obstacles; short cover blocks bullets at all heights.

# Verification

Final verification commands and observed results:

- `npm ci`: initial standard reinstall was stopped after prolonged extraction during concurrent machine activity; no successful result is claimed for that attempt.
- `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`: passed after switching from Babylon's many-file modular distribution to the `babylonjs` bundled distribution.
- `npm ci --prefer-offline --no-audit --no-fund`: passed, 69 packages installed in approximately one minute. Fresh dependencies were used for the following checks.
- `npm test`: **19 passed, 0 failed**, approximately 4.08 seconds in the final clean-install sequence. This includes a deterministic complete bot-filled match, both sides, a single winner, and objective resolution.
- `npm run build`: passed strict TypeScript and Vite production bundling in 4 minutes 11 seconds on this loaded machine. Output: `dist/index.html`, CSS 11.54 kB, JS 7,915.54 kB (1,674.66 kB gzip). Vite emitted its large-chunk warning.
- `node --experimental-strip-types check-match.mjs`: earlier temporary simulation probe completed 36,186 ticks with a 4-3 score over seven rounds, three vault-security wins followed by four Cipher-disarm wins. The temporary probe was removed; the permanent nineteenth test covers complete-match behavior.

Direct recursive deletion of `node_modules` and `dist` was rejected by execution policy. The final check used npm ci's dependency replacement and Vite's standard output cleanup instead; the requested separate manual deletion step was therefore not performed. Earlier install attempts using the modular Babylon package were stopped after prolonged file extraction; switching to the bundled package reduced file count without changing the renderer API.

- `node tools/capture.mjs`: passed the production build at `http://127.0.0.1:5230/arcade/protocol/` in headless Chromium with software WebGL 2. Zero page errors and zero failed HTTP asset responses. Verified deploy, buy armor, close buy, forward movement, scoreboard, firing, reload, pause, sensitivity input and resume. Diagnostics confirmed live round 1, ten actors, local movement to z=-14.075, 100 health and a loaded magazine.
- Captured and visually inspected `oneshot/screenshot.png` at **1280x720** during the live phase, plus menu, requisitions and scoreboard screenshots. Machine-readable evidence is in `oneshot/browser-check.json`.
- The software-rendered capture reported **4 FPS**. This is a real limitation of this verification run, not evidence that the 60 FPS hardware target is met. Desktop GPU performance, Edge, Firefox, long browser matches, network conditions, multiplayer and production load were not verified.

The capture tool closes its own browser and temporary server. No deployment, git remote access, telemetry, account system or external game service was used.

 Initial development runs found three objective fixture failures caused by active bots interfering with isolated objective tests; adding an explicit bot-disable seam fixed those fixtures. A CSS data import caused an initial build failure and was removed. An initial browser check found that pausing did not release pointer lock, preventing menu clicks; pause now releases the cursor.

# Assumptions and deviations

The broad production brief is treated as direction for a complete offline vertical slice. Practice is the only surfaced mode, so no matchmaking, ranked, unavailable buttons, backend or accounts are advertised. Matches use a 15-second buy and 85-second action phase, first to four with a side swap after three; the 3.2/35/8/5-second objective timings are retained. Halftime resets to $2,400 so defenders can demonstrate a meaningful buy in this shorter match.

Movement uses direct deterministic collision queries and instant stopping, without acceleration, jumping, crouch hitboxes or Rapier. Ctrl lowers the view and movement speed; the shot origin and hitboxes remain standing-height simplifications. Bots use the same damage, reload, visibility and objective functions as the player, but do not implement the brief's complete perception model or utility planner. There is no promise of a fair competitive ruleset or authoritative multiplayer security.

# Known issues and limitations

1. Offline practice only: multiplayer, lag compensation, rating, reconnect, storage and replay infrastructure are absent.
2. Simplified geometry and combat: 2D collision and bullet blocking, shared weapon silhouette, standing hitboxes, no jump or penetration, basic bot tactics and audio. Dropped Cipher uses a simple world device and tactical-map marker with automatic pickup.
3. Content/performance breadth: three weapons and one utility; no rigorous GPU/FPS/load benchmarks or Firefox/Edge verification. Large Babylon entry bundle emits a build size warning. Software WebGL capture can run substantially below real-time.

# Self-assessment

- Playability: **7/10** — Complete short offline match with consequential death, economy and objective interactions, held back by basic AI and movement.
- Visual polish: **6/10** — Cohesive original architecture, tactical HUD, menus and procedural presentation, with geometric character/weapon art and limited animation.
- Brief fidelity: **5/10** — Core Cipher Breach rules and Babylon rendering are represented, while authoritative multiplayer and most production services/content are absent.
