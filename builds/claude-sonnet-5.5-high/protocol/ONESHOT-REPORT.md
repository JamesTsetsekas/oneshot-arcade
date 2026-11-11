# Last Protocol: one-shot report

## Summary

Last Protocol is a playable single-player vertical slice of the brief: a full Cipher Breach match (buy, arm, defend, disarm, economy, halftime swap, overtime, result analysis) on an original two-vault map, **Aperture Annex**, played from first person against bot squads. The simulation is an authoritative 64 Hz fixed-step room behind a validated, serialised protocol with client prediction, interpolation and lag-compensated hitscan, running in-process with no backend. It ships 12 weapons plus a tool, 5 utility types, server-side bots that obey fog of war, procedural visuals and audio, and a full UI (menus, buy menu, HUD, radar, tactical map, scoreboard, spectating, end screen, settings and accessibility).

## Brief coverage

| System / acceptance criterion | Status | Note |
| --- | --- | --- |
| Round structure (20 s buy, 105 s clock, 35 s fuse, 3.2 s arm, 8/5 s disarm) | Done | Tested; disarm resets on release |
| Match rules: first to 9, swap after 8, win by 2, cap 20 | Done | Also a Quick preset (first to 5); overtime swap every 2 rounds with $2,400 |
| Economy (start, cap, win/loss ladder, arm/defuse bonus, kill rewards, carryover, refunds, idempotent buys) | Done | Fixture tests; kill rewards by weapon class; no teammate "drop to buddy" offers or buy requests |
| Objective (carry, drop, pickup, arm at either vault, defend, disarm, detonate, win resolution) | Done | Tested for both sites and both disarm timings |
| 12 weapons, armour/helmet, hit zones, falloff, penetration, recoil, spread, reload stages | Done | Data-driven; recoil paths deterministic; bolt/burst/pump/scoped modes |
| 5 utility types | Done | Veil, Arc Flash, Thermite, Pulse Shard, Fragment; deterministic swept-sphere physics; "carve sight gaps" omitted as the brief allows |
| Aperture Annex map | Partial | Two vaults, gantry, glass corridor, crawl duct, penetrable wall, split-level mid, material tags, collision hash. Grid-authored blocky geometry; no baked lighting, route times only approximate the brief |
| Map analysis tooling | Done | `npm run scan` and tests: reachability, spawn sightlines, route times, zone bounds, stuck cells, grenade clipping |
| Server authority, lag compensation, validation | Done | Room validates schema, quotas, sequence dedup; rewind capped at 12 ticks (187 ms); local in-process, not over a socket |
| Client prediction, reconciliation, interpolation, clock estimate | Done | Same movement code as the room; tested with 100 ms RTT, jitter, loss, duplicates |
| Interest filtering (no hidden enemy state) | Done | Tested; roster and Spike position are team-scoped. Footstep/shot audibility events carry positions |
| Bots (senses, planner, roles, utility, retake, save) | Partial | Default, execute, post-plant, rotate, retake, defuse, save all run. No per-grenade lineup library beyond authored targets, simple tactics, no callout speech |
| Spectating, death rules | Partial | Follow living teammates only; no delayed broadcast, tactical camera after team wipe, text/pings, radio wheels |
| UI: main menu, buy, HUD, scoreboard, tactical map, round end, match end graph and timeline | Done | Loadout/Finish, Match History, Lobby/party/queue not built (hidden, not shown as dead buttons) |
| Settings and accessibility | Partial | Sensitivity, FOV, volume, quality, colourblind palettes, reduced flash/motion, captions, crosshair editor, hold/toggle, left hand. No key rebinding |
| Audio | Partial | Fully procedural, spatialised with occlusion and voice limits; weapon sounds are synthesised approximations |
| Modes: Competitive/Unranked queue, rating, reconnect | Not started | Practice mode done (infinite money, buy anywhere, trajectory preview). No matchmaker, rating, services, persistence |
| Ten browser clients in one match | Not started | One human seat plus bots; the protocol path supports more seats but was not exercised with several clients |
| Babylon.js, React, Rapier, Colyseus, glTF/KTX2, PostgreSQL/Redis | Not started | Replaced by three.js, DOM UI, in-house AABB collision, in-process room, procedural assets |
| Performance targets | Partial | Draw calls ~75-110 (budget <220); sim tick avg 0.1-0.6 ms with 10 players; 60 fps not measurable here (software WebGL only) |
| Required delivery artifacts (threat model, fleet guide, replay viewer, load test, compatibility matrix) | Not started | Replay determinism is covered by tests; no viewer |

## Architecture

- **Stack**: TypeScript, Vite, three.js (WebGL 2), Vitest. DOM for UI and HUD. No backend.
- `src/content`: weapon, economy, utility and ruleset tables (ruleset version stamped on matches).
- `src/sim`: the pure, deterministic, seeded simulation: `map` (grid-painted level to material-tagged boxes, zones, hash), `collision` (AABB body queries, slab raycasts, swept spheres), `nav` (auto-built grid, A*, string pulling), `movement`, `combat` (hit zones, armour, penetration), `weapons`, `grenades`, `match` (rounds, economy, objective, lag-comp history), `bots`, `hints`, `scanner`.
- `src/protocol`, `src/server`: versioned schemas with validation; `ServerRoom` applies quotas, builds interest-filtered snapshots (compact player tuples, roster at ~2 Hz); `NetLink` simulates latency, jitter, loss and duplication over JSON.
- `src/client`: `ClientNet` (sequenced inputs, prediction, reconciliation, interpolation at 94 ms), `InputState` (Pointer Lock raw input), `Game` shell with a fixed 64 Hz tick decoupled from rendering.
- `src/render`: world built from the same collision boxes (glass and foliage match ballistic behaviour), baked vertex-coloured characters and weapons, instanced decals/particles, a smoke shader whose boundary equals the authoritative sphere, fire cells, viewmodel.
- `src/ui`, `src/audio`: HUD, menus, buy menu, overlays; procedural Web Audio.

Why the deviations: one session cannot ship Babylon + React + Rapier + a Colyseus fleet. The simulation, protocol and netcode boundary were kept real so a socket transport could replace `NetLink` later.

## Verification

Commands run on the final tree after deleting `node_modules` and `dist`:

- `npm ci`: succeeded.
- `npm test`: **59 passed, 0 failed** (5 files: economy, rules and objective, combat/weapons/movement/lag comp, netcode and snapshot hiding, map scan, utility and bots). Includes full headless bot matches (quick match to a result), a determinism replay test, a fog-of-war test, and a 100 ms RTT / 10 ms+ jitter / 1% loss netcode test (no duplicate purchases, bounded corrections).
- `npm run build`: succeeded (`tsc --noEmit` then Vite; `dist/` is ~768 kB JS, 211 kB gzip).
- `npm run scan`: no issues; route timings (rifle speed): intrusion to lane entries 13.6 s (A) and 14.0 s (B), defenders to holds 6.2 s (A) and 8.1 s (B), A to B rotation 13.1 s, mid to B 7.8 s. These do not match the brief's 10-13 s attacker contact, which was not tuned further.
- Browser checks (headless Edge, software WebGL, production build served from `/play/claude-sonnet-5.5-high/protocol/`): menu to deploy to pointer lock, auto-opened buy menu, keyboard buy (category then item), buy close and re-lock, WASD movement, scoreboard, tactical map, pause and resume all worked. A bot-driven full round rendered with HUD. No console errors beyond a Three.js shadow-map notice that was then removed.
- Measured in the browser: draw calls 75-110, ~28 KB/s downstream JSON, per-tick sim cost avg 0.3 ms.

Could not verify: real GPU frame rate (software rendering ran ~10 fps), audio output (no sound device, so sounds are untested by ear), multiple human clients, Firefox/Safari, 1280x720 gameplay visuals other than the menu flow screenshots, long full-match (first to 9) playthrough by a human.

## Assumptions and deviations

- Three.js and DOM UI instead of Babylon.js and React; AABB boxes and a nav grid instead of Rapier capsules and a navmesh.
- No players-vs-players movement collision in the brief's sense; a simple separation push keeps bodies from overlapping.
- Team damage is off (the brief's Unranked default); friendly utility damages only the thrower.
- The map has a roof (for enclosed rooms and to stop grenades lobbing over walls); the sim treats the ceiling as a hard cap.
- Bots start with `vela` and buy using their own heuristics. Player and bots share the same input path and rules.
- Overtime: each 2 rounds sides swap and everyone gets $2,400.
- Snapshots are JSON (~21 Hz) rather than binary deltas; bandwidth is near, not safely under, the 30 KB/s target.
- Crouch is also bound to C because Ctrl+W closes a tab.

## Known issues and limitations

- Visual polish is modest: blocky primitive models, a large simple viewmodel, no animation beyond gait, aim and a fall.
- Bots are competent but simple; they can still stall at times (idle holds) and do not coordinate trades or flashes with precision. The attack plan is chosen at random per round.
- No reconnect, no real matchmaking or rating, no replay viewer, no key rebinding, no cosmetics.
- Players can rarely clip into each other at spawns/corners.
- Hitch spikes of 25-40 ms on bot pathfinding bursts were observed on a loaded machine.
- Score and balance of the economy have only been lightly simulated; bot-vs-bot results skew by chance.

## Self-assessment

- **Playability: 7/10.** The core loop works end to end with a keyboard and mouse (verified), but bot behaviour and feel are only lightly tuned and I could not play it on real hardware.
- **Visual polish: 5/10.** Cohesive palette, signage, shadows, glass, smoke and fire shaders, but the models and viewmodel are crude.
- **Brief fidelity: 6/10.** Round, economy, objective, weapons, utility, bots and the netcode boundary are faithful; services, rating, multi-client rooms, assets pipeline and the named tech stack are not.
