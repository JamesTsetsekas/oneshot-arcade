# Shardfront — One-shot Report (claude-opus-5.5-high)

## Summary

I built a playable browser RTS vertical slice on an original 1v1 map, Glass Ravine, with two complete asymmetric factions: Helix Directorate (7 units, 6 structures) and Verdant Chorus (8 units, 6 structures). Both run on a deterministic 20 Hz TypeScript simulation, with a Three.js WebGL 2 renderer and a React UI. The full loop works: two-resource economy, construction, supply, production queues, tech and upgrades, fog of war with last-known ghosts, scouting, abilities, combat, expansion, and a fog-respecting Easy/Normal/Hard utility AI, ending in HQ-destruction victory. After the match come a post-game summary with graphs and a timeline, rematch, and a hash-verified replay. A 13-step guided tutorial, settings with rebindable keys and colorblind palettes, a Tech Archive, match history and a cosmetic profile in IndexedDB round out the slice. All art and audio are procedural.

## Brief coverage

| System / acceptance criterion | Status | Note |
|---|---|---|
| Loading shell, capability detection, error screen | Done | Inline boot shell; WebGL 2 check shows an actionable error screen; React error boundary; staged loading bar. |
| Main menu (Play, Tutorial, Tech Archive, Replays, Settings, Credits) | Done | All entries work; there are no dead buttons. |
| Pre-match: faction cards, difficulty explanations, map preview | Done | |
| Start state: HQ, 6 workers, 1 scout, supply cap | Done | Skirmish workers auto-mine at start (tutorial workers do not). |
| Two-resource economy (Prism Ore, Flux via extractor on vent) | Done | 1.6 s gather, visible carried load, nearest drop-off, seam reservation, re-evaluation; tested. |
| Saturation display, over-saturation inefficient | Done | Per-base workers/ideal shown above the minimap; test shows 6/seam is less than 75% as efficient per worker as 2/seam. |
| Supply; blocked queue pauses visibly | Done | The paused item shows a red "Supply blocked" chip and an alert; tested. |
| Construction: foundation, progress, HP ∝ progress, cancel refund, placement preview | Done | Cell-by-cell valid/invalid footprint, reason text, build-zone circles, defense range ring and Sentry cone. Slope and path blockage are shown as cell rules rather than as separate overlays. |
| Production queue: cost, time, prerequisites, hotkeys, pause reason, cancel, rally | Done | Layered tooltips: label, cost and hotkey immediately; stats after 350 ms. |
| Helix roster and abilities | Done | Emergency Weld, Sensor Spike (cloaked, detectable), Brace, overpenetration, Mender auto-repair, Mortar setup/min range/arc, Aegis frontal shield. |
| Verdant roster and abilities | Done | Rootstep, Glimmerwing detection, Thornling frenzy, Sporecaster slow, Curl, Mend Spores, telegraphed Silence Patch, Rift Stag delayed eruptions, Crownbeast aura, Needle Pod scout priority. |
| Shared combat rules (tags, bonuses, armor, no friendly fire, tooltips) | Done | Damage formula unit-tested; weapon stats shown in tooltips and the Tech Archive. |
| 3 attack + 3 armor upgrades in two tiers, ≤ 12% each | Done | +6% damage / −5% damage taken per level, plus one unlock tech per faction. |
| High ground +2 sight, cliffs block vision from below, brush | Done | Tested. |
| Fog of war, last-known ghost structures, AI cannot see through fog | Done | Ghosts render desaturated. A test asserts every AI memory record was visible at that tick. |
| Glass Ravine features | Done | Mains, naturals (choke + back path), side expansions, depleted center, two bridges, hover-only chasm, destructible barriers, brush, two Watch Pylons (3 s capture, contest), salvage pods. |
| Spawn-fairness test within 3% | Done | Rush distance, expansion distance, resources, brush sight lines, choke-width proxy. Gameplay layout is point-symmetric; decoration is not. |
| Debug visualization of walkable / blocked / hover-only / brush / buildable | Done | F9 overlay. |
| 18-minute anti-stalemate (yield +15%, 90 s reveal pulse) | Done | Tested. |
| Camera (55° pitch, 45° FOV, 24–68 eased zoom, pan scaled by zoom, Shift +60%, clamp, middle drag, edge scroll option, Space/Home/F, double-tap group) | Partial | Arrow keys pan, not WASD (A and S are attack/stop). No Q/E rotation and no occlusion fade. |
| Controls (box/double/ctrl/shift select, contextual right-click, A/S/H/P/G, Shift queue, Alt force-move, control groups, Tab, B, R, Q/W/E, F10/F11/`) | Done | Verified with real input at 100/125/150% DPR (see Verification). All keys are rebindable. |
| Selection decals, health bars (selected/damaged/hovered), command paths, path failure | Done | Team rings, accent stripes, HP/shield/energy bars, dashed order queues, "Path blocked" alert. |
| Attack feedback chain and death states | Partial | Windup lean, muzzle flash, tracers and projectiles, impact sparks, hit flash, sound, collapse/dissolve corpses (0.6–1.2 s), subtle shake for siege that respects reduced motion. No skeletal animation; units animate procedurally (bob, lean, recoil, brace/curl scale). |
| Tutorial (8–10 min, validates actions) | Done | 13 steps: camera, select, move, gather, train, supply, production, Flux, army, control group, ability, attack-move, destroy objective. An automated test completes it in under 12 game-minutes. |
| Skirmish vs Easy/Normal/Hard, either faction | Done | |
| AI: utility states, memory with confidence decay, build planner, squads, scouting, evacuation, repair, no cheats | Done / Partial | All 11 strategic states, supply/saturation/prereq-aware planner, counter composition from scouted tags, retreat/regroup/kite, harassment (Hard), worker evacuation, Helix repair. Squad logic is one main army plus one harass squad. |
| Post-game: result, metrics, army/resource graphs, timeline, rematch, replay | Done | |
| Replays (seed + command log, periodic state hashes) | Done | Hash check shown live in the replay viewer; test proves identical hashes and outcome. |
| Persistence: settings, tutorial badge, match history, mastery XP, banners (IndexedDB, repository interface, corrupt-save recovery) | Done | Unit-tested migration and recovery. |
| Settings: graphics preset, render scale, shadows, effects, AA, audio buses, camera, keybinds, colorblind, reduced motion | Done | There are no subtitle options because the game has no voice lines. |
| Audio: buses, positional falloff, voice cap, faction palettes, unique alert signatures, adaptive 4-stem score with hysteresis | Partial | Fully synthesized in Web Audio. No per-unit bark sets; select/ack sounds are per faction, not per unit. |
| Command protocol (sequenced commands, input delay, validation, quotas) | Done | Ownership, visibility, cost, prerequisite, target legality and rate-limit checks; strict parser for untrusted input. |
| Multiplayer server, lobby, snapshots, reconnect, spectators | Not started | Out of the MVP critical path; the headless `MatchRunner` and protocol are server-ready. |
| Navigation: regions, flow fields shared per group, local avoidance, stuck recovery, barrier updates | Partial | Static region labels, cached shared flow fields, string-pulled steering, separation, deterministic stuck/repath/give-up. Paths run synchronously in the sim (no Web Worker) and occupancy changes invalidate the whole cache instead of doing localized region updates. |
| Choke test: no permanent overlap, not stuck > 3 s | Done | 40 units through the natural choke; tested. |
| Context loss recovery | Partial | Pauses and shows recovery UI (resume or return to menu). It does not rebuild the renderer from a snapshot if the browser fails to restore the context. |
| Benchmark: 60 FPS median at 1080p medium with 220 units | Not verified | A reproducible benchmark scene exists (`?benchmark=1`), but I could only run headless software GL here. |
| WebGPU renderer path | Not started | WebGL 2 only (allowed fallback). |
| glTF/KTX2/Opus pipeline, LODs, asset validation | Not started | All assets are procedural, so there is no import pipeline. |
| Sandbox mode | Not started | Optional in the brief; the benchmark scene covers the "spawn and measure" need. |
| No proprietary names, assets, layouts | Done | Original names, geometry, map and synthesized audio. |

## Architecture

- **Stack.** TypeScript (strict), Vite 8, Three.js 0.187 (WebGLRenderer), React 19, Vitest, playwright-core for browser automation. Three.js suits a custom instanced RTS renderer. React handles menus and HUD only and reads throttled read-model snapshots through a tiny external store (`src/ui/store.ts`), so it never owns per-frame entity state.
- **`src/simulation-core`**: a deterministic fixed-step sim (`sim.ts`). Hot entity components are structure-of-arrays typed arrays (position, hp, owner, kind, def, facing, cooldown); variable data lives in `Ext`. Positions are floor-quantized to 1/1024. Systems: `orders.ts` (production, construction, worker FSM, abilities), `movement.ts`, `combat.ts` (projectiles, splash, statuses, auras, zones, pylons, pods), `vision.ts`, plus `rng.ts` and an FNV state hash every 100 ticks.
- **`src/faction-data`**: all balance as typed data plus `validateFactionData()`.
- **`src/world/map.ts`**: Glass Ravine generator (levels, flags, render heights, resources, neutrals).
- **`src/navigation/nav.ts`**: walk grid, dynamic occupancy, region labels, Dijkstra flow-field cache, LOS string pulling, spatial hash.
- **`src/ai/ai.ts`**: fog-limited utility AI that only issues protocol commands.
- **`src/network-protocol`**: versioned commands, parse/encode, replay file format, label sanitizing.
- **`src/game/runner.ts`**: headless `MatchRunner` (sim plus AI seats plus replay playback, server-reusable). `client.ts` is the browser loop, input, overlays, minimap and HUD read model; `tutorial.ts` and `scenario.ts` complete the module.
- **`src/renderer`**: instanced procedural models (body, glow and team-accent parts per type), terrain mesh with a fog-of-war and debug shader patch, stateless GPU particles, tracers, zone decals, ghosts, and placement preview.
- **`src/input-camera`, `src/audio`, `src/persistence`, `src/ui`, `src/app-shell`**: as their names say.
- **Security.** A restrictive CSP meta tag is injected in production builds. There is no eval, no network calls, and no telemetry.

## Verification

All commands were run in this workspace on Windows 11 with Node 22.12.0 and npm 11.4.2.

- `rm -rf node_modules dist && npm ci` → installed, "found 0 vulnerabilities".
- `npm test` (Vitest) → **Test Files 10 passed | 1 skipped (11); Tests 52 passed | 1 skipped (53)**, 185.5 s, exit 0. The skipped test is an opt-in map-PNG debug tool (`MAP_PNG` env).
  - Full AI-vs-AI matches end in HQ destruction (Normal vs Normal, Hard beats Easy).
  - A replay reproduces every periodic hash and the outcome.
  - Results are independent of render frame rate.
  - Fog/AI-memory, brush, high ground, economy, supply block, construction, combat formulas, map fairness, choke/stuck, tutorial completion, protocol and persistence each have their own tests.
- `npm run build` → `tsc --noEmit` clean; Vite output `dist/index.html` 1.68 kB, CSS 14.9 kB, JS 1,000 kB (278.7 kB gzip). Asset URLs are relative (`./assets/...`) and the CSP meta is present.
- Sub-path hosting check: `node tools/serve.mjs 5401` serves `dist/` only under `/play/claude-opus-5.5-high/shardfront/`. Index and JS return 200 there, `/` returns 404, and the game loads and plays from that path.
- Browser checks (headless Edge, SwiftShader software WebGL 2, 1280×720), all against that served production build:
  - `node tools/screenshot.mjs` produced `oneshot/screenshot.png` (real 7:16 in-game battle: Helix Bulwarks vs Verdant army, with a Mend Spores zone and a silence telegraph), plus `menu.png`, `setup.png`, `opening.png`, `base.png`, `debug-nav-perf.png` (nav overlay plus perf panel), `postgame.png` and `tutorial.png`. For the battle shot, an AI was attached to the player's seat and the sim fast-forwarded to the first visible engagement; the frame itself is a normal render of that state.
  - `node tools/playtest.mjs` uses real mouse and keyboard input at deviceScaleFactor 1, 1.25 and 1.5. All 9 checks passed at every scale (click-select, B→Q placement creates a build order, drag-box select, right-click move, Ctrl+1 / 1 groups, minimap camera, minimap right-click order, Home key, command-card hotkey trains), with no page errors.
- **Not verified:**
  - Real-GPU frame rate and the 60 FPS / 220-unit benchmark target. Headless software rendering ran at roughly 15–35 FPS, which says nothing about GPU performance.
  - Firefox and Safari.
  - Real context-loss recovery.
  - A full human-played match start to finish. Full matches were verified through AI-vs-AI runs and scripted input, not by hand.
  - Audio quality: it compiles and runs, but I could not listen in headless mode.

## Assumptions and deviations

- **Package layout.** Single npm package with folders mirroring the requested packages (`app-shell`, `simulation-core`, …) instead of a monorepo.
- **No WebGPU.** WebGL 2 only.
- **Pathfinding in the sim.** Path queries run synchronously inside the deterministic sim, not in Web Workers, so replays stay deterministic. Expensive work is bounded by sharing one cached flow field per group goal.
- **Victory.** Destroy every enemy HQ (Core Relay or Heartgrove), not only the starting one.
- **Roster size.** The brief's Verdant list has 8 units, so the game has 15 units, not 14.
- **Upgrade tiers.** Interpreted as levels I (tier 1), II and III (tier 2), each +6% damage / −5% damage taken.
- **Verdant construction.** Tenders plant a seed and leave; Helix Fabricators must stay to build. This is the asymmetry I chose for "germinate". Construction zones are a field around the HQ and supply structures for both factions.
- **Panning.** Arrow keys by default instead of WASD, because A and S are attack-move and stop. Camera rotation is not implemented.
- **Assets.** All procedural, so there are no glTF/KTX2/Opus assets, LODs or asset validation tooling. No ESLint config; strict `tsc` is the lint gate. playwright-core scripts are used instead of a Playwright test runner.
- **Performance panel.** The ` panel and F9 overlay are available in production builds too, so reviewers can capture debug views.
- **Hidden tab.** Local play pauses while the tab is hidden.

## Known issues and limitations

- Performance on a real GPU is unmeasured. Draw calls were about 85 in a large mid-game scene. Shadows plus many instanced parts may need tuning on weaker GPUs; Low preset disables shadows.
- AI is competent but simple. It sometimes issues construction on spots that just became occupied ("Blocked by another object") and can leave units waiting at a rally. Its squad micro is coarse.
- Models are simple procedural primitives. Silhouettes are distinct but not hero-quality. Units have no skeletal animation, only procedural bob, lean, recoil, scale and dissolve.
- The navigation cache is invalidated globally when occupancy changes (structures, barriers). Very large armies can still bunch at chokes; they resolve via separation and stuck handling (tested to < 3 s at the natural choke).
- Context loss: if the browser does not restore the WebGL context, the only option is returning to the menu.
- No online multiplayer, server, spectator mode or sandbox mode.
- The main JS bundle is about 1 MB (279 KB gzip) in a single chunk.

## Self-assessment

- **Playability: 6/10.** The complete loop works end to end and is verified through AI-vs-AI matches, the tutorial test and real-input automation, but I could not play a full match by hand on real hardware.
- **Visual polish: 5/10.** The UI is clean and readable and the fog, effects and team colors are clear, but the procedural box-and-primitive models and dark terrain look like a prototype next to authored art.
- **Brief fidelity: 5/10.** Most gameplay systems, both full rosters, the map features, AI, tutorial, replays and persistence are in. Multiplayer, WebGPU, the asset pipeline, workers-based pathing and the performance validation are not.
