# ONESHOT REPORT — Last Protocol (claude-opus-5.5-high)

## Summary

I built a playable vertical slice of Last Protocol: a complete single-player Cipher Breach match on an original map, Aperture Annex. You play with 4 bots against 5 bots, through buy phases, live rounds, arming and disarming, halftime side swap, overtime rules and a results screen. An in-browser authoritative room runs the whole thing at 64 Hz. It owns movement, ballistics, recoil, utility, the objective, economy and rounds, and it sends each viewer a filtered snapshot with reliable events. The Babylon.js renderer, React shell and WebAudio layer consume only those snapshots. The slice includes 12 original weapons, 5 utility types, perception-limited bots, a Practice range, settings and accessibility options, and 52 headless tests covering rules, map analysis and full bot matches.

## Brief coverage

| System / acceptance criterion | Status | Note |
|---|---|---|
| Cipher Breach round structure (20 s buy, 105 s round, 35 s armed timer, 8 s / 5 s disarm) | Done | Data-driven in `content/rules.ts`. Tested. |
| Match format (first to 9, swap after 8, win by 2, max 20 rounds, OT) | Done | Full and Quick (first to 5) rulesets. Overtime gives $10k and swaps every 2 OT rounds; this is my own choice. 10–10 is a draw. |
| Economy (start $800, cap $12k, win $3k, loss ladder 1900→3100 stepping down one tier per win, arm $300 + $600 team, disarm $300, kill rewards by class, reduced timeout bonus, refunds, side reset) | Done | Fixture-tested in `tests/economy.test.ts`. |
| Buy UI (money, time, next-round minimum, teammate money and equipment, refunds, number-key shortcuts) | Done | "Requests" and "dropped offers" are not implemented. Teammates can drop weapons with G. |
| 12 weapons + tool, armor, helmet, kit | Done | Original names, stats, silhouettes and recoil paths. Modes: auto, semi, burst, pump, bolt, scoped DMR, staged and shell reloads. |
| Hit zones, armor, falloff, tagged-surface penetration | Done | Drywall, glass, crates, racks and rails can be penetrated; concrete stops bullets. Tested. |
| Movement (per-weapon speeds, walk 52%, crouch 40%, accel 24 / decel 30, 0.78 m jump, landing penalty, jump fatigue, rate-limited crouch) | Done | AABB-capsule approximation with step-up. Tested. |
| Learnable recoil + seeded deviation, movement/air inaccuracy | Done | Deterministic per (match seed, shooter, shot index). |
| Lag compensation (250 ms history, ≤200 ms rewind, never rewinds the shooter) | Partial | Implemented and tested in the room. The only human client is in-process at 0 ms, so it has never been exercised over a real network. |
| Utility: Veil, Arc Flash, Thermite cells, Pulse Shard, Fragment Charge | Done | Fixed-step deterministic grenades. The preview matches the server within 5 cm (tested). No smoke carving, per the brief's MVP allowance. |
| Objective: carry, drop, pickup, arm at A/B, disarm both timings, detonation, all win conditions | Done | `tests/objective.test.ts`. |
| Aperture Annex: 2 vaults, mid, spawns, gantry, penetrable service wall, glass corridor, crawl, callouts | Done | 26 named regions; signage, HUD callout and tactical map. |
| Automated map analysis | Partial | Covered: connectivity, stuck pockets, spawn sightlines, callout coverage, zone bounds, route lengths, collision hash. Not covered: grenade-clipping and light-contrast scanners. |
| Route timings | Partial | Attackers reach a site in 13–14 s (rifle). Defenders arrive about 3–4 s earlier. Rotations are about 19–21 s, longer than the brief's 8–10 s (mid) and 13–16 s (long). |
| Bots (LOS/FOV/smoke perception, hearing uncertainty, team plans, lineups, rotate, plant, post-plant, retake, disarm, save, buy logic, callouts) | Partial | All of these behaviours exist and run in full matches. Bots are attacker-favoured: about 65–75% of rounds go to the attackers, and disarms are rare. No navmesh: bots use A* on a grid derived from collision. |
| Spectating (teammates first-person; fixed camera after team wipe; no enemy free-cam) | Done | Dead players' snapshots contain only what the spectated teammate can see (tested). |
| Interest filtering / no wallhack data | Done | Enemies appear in a snapshot only with LOS (smoke counts as a blocker). Sounds are radius-filtered. The tactical map shows teammates and the known objective only. Tested. |
| HUD (crosshair, ammo, HP/armor, utility, money, score/timer, alive strip, objective, callout, kill feed, radar, hit/damage feedback, captions) | Done | |
| Scoreboard, round-end reason + decisive event, match-end timeline + economy chart + stats | Done | Stats: K/D/A, ADR, HS%, opening duels, trades, plants/disarms, utility damage, enemies flashed, accuracy. |
| Settings (sensitivity export, zoom multiplier, FOV 80–105, crosshair editor, binds, audio, captions, reduced flash/motion, colorblind, quality presets) | Done | Saved to localStorage. Quality affects only cost: shadows, bloom, resolution. |
| Practice (infinite money and ammo, dummies, damage log, trajectory preview) | Done | No recoil-wall or nav-debug overlays. |
| Audio (procedural weapons, surface footsteps, occlusion low-pass, HRTF, beep schedule, critical captions, menu-only music) | Done | |
| Unranked / Competitive queues, matchmaking, 10 human clients, reconnect, rating, services | Not started | Offline build. Competitive is hidden rather than shown as a dead button. |
| Network transport (WebSockets, Colyseus, client prediction/reconciliation, jitter lab) | Not started | The protocol types and room are transport-agnostic, but they have not been wired to a socket. |
| Replays | Partial | The room records an input/request log and a running event hash. Same-seed replays reproduce the identical signed result (tested). There is no replay viewer. |
| Rapier physics, glTF/KTX2 assets, PBR, baked lightmaps, LODs, ragdolls | Not started | See deviations. |
| Cosmetic finishes, progression, match-history privacy | Partial | Local match history only. No cosmetics. |

## Architecture

**Stack:** TypeScript, Vite 6, Babylon.js 8 (WebGL 2), React 18 for menus, Vitest 3, and playwright-core for browser checks against a locally installed Chrome. I chose Babylon.js because the brief asks for it. React handles shell and overlay screens, and the in-frame HUD is a plain DOM adapter, again as the brief specifies.

Main modules, mapped to the brief's architecture:

- `src/protocol/messages.ts`: versioned input, snapshot, event and result schemas. Clients send only intent (buttons, view angles, item select, buy/refund/drop/radio requests with idempotent ids).
- `src/content/`: weapon table, utility, economy and match rules, with `RULESET_VERSION` stored in every result.
- `src/map/`: the Annex source (regions plus props on a 0.5 m grid) and the runtime. The runtime turns that source into collision boxes, raycasts, zones, callouts and a versioned collision hash. It also builds a nav grid with A*.
- `src/sim/`: `room.ts` is the authoritative match. Pure helpers sit beside it: `movement.ts`, `combat.ts` (spread, recoil, hitboxes, damage, penetration), `grenades.ts` (shared with the Practice preview) and `rng.ts` (seeded, deterministic).
- `src/bots/`: a team planner (blackboard) and per-bot brains. They act only through the same input/request path as a human, and perceive only through the room's sight and sound queries. Tactical data and grenade lineups are validated against the grenade simulation at load.
- `src/client/`: the session runs a fixed 64 Hz step. Each step samples input, ticks the room, builds the filtered snapshot and drains events. The session then interpolates between ticks for rendering. It also handles input (pointer lock, rebinding) and settings.
- `src/render/`: map meshing from the same grid as collision, procedural textures, original models, character rigs, the viewmodel, pooled effects and the menu backdrop.
- `src/audio/`: a fully synthesized WebAudio engine.
- `src/ui/`: React shell (menu, play, buy, scoreboard, match end, settings, learn, credits, history) plus the DOM HUD.

## Verification

All commands below were run on Windows 11 with Node 22.12.0 and npm 11.4.2.

- **Clean install.** I deleted `node_modules` and `dist`, then ran `npm ci`, which succeeded. npm reported audit advisories in dev dependencies; I did not change them.
- **`npm test`:** **6 files, 52 tests passed, 0 failed**, in about 60 s. The suite covers:
  - map analysis: hash stability, reachability, stuck pockets, spawn sightlines, callouts and route bands. Measured routes: T→A 64.9 m, T→B 62.6 m, CT→A 46.0 m, CT→B 49.4 m, long rotation 97.3 m, mid rotation 87.4 m.
  - economy fixtures, the objective, ballistics, movement, utility, interest filtering, sound radius, and lag-compensation rewind and clamp.
  - full 10-bot matches, which complete with a winner. Standard matches ran 17.7–19.8 simulated minutes.
  - determinism: the same seed gives the identical signature and event hash.
- **`npm run build`:** `tsc --noEmit` passes. Vite writes `dist/index.html` plus a 6.4 MB JS bundle (1.44 MB gzipped). Asset URLs are relative (`./assets/...`).
- **Sub-path serving:** `node tools/serve.mjs` serves `dist/` at `/play/claude-opus-5.5-high/protocol/`.
  - `tools/screenshot.mjs` loaded the production build in headless Chrome on a real GPU (ANGLE D3D11). It captured the menu, buy menu, gameplay, scoreboard, tactical map and match end. The match end was reached by fast-forwarding the same room.
  - The average fps reported during capture was about 120–144 at 1280×720 on the medium preset.
  - Earlier runs sometimes logged a page error (`reading '0'`). The cause was a negative first-frame dt in the menu backdrop, which I fixed. The final run after the fix reported **no page errors**, averaged about 142 fps, and fast-forwarded the room to the match-end screen (5–2). Its log is in `oneshot/browser-check.log`.
- **Real input:** `tools/play-check.mjs` used trusted mouse and keyboard events. Clicking the deploy button engaged pointer lock. `B` → `5` → `1` bought a vest ($800 → $150, armor 100). Esc closed the menu. W moved the player 7.4 m. Mouse movement turned the view. LMB fired one round (mag 15 → 14). `3` selected the tool. No console errors.
- **Screenshots:** `oneshot/screenshot.png` is a real in-game frame from the production build. The local seat is driven by the harness autopilot (`?harness=1&autopilot=1`), which uses the same bot brain as the bots so that a live engagement appears on camera. The final frame shows Hydroponics after the Cipher was armed at Vault B, with a Custodian 15 m away in the crosshair. The other frames in `oneshot/` came from the same pipeline. The `tour-*.png` files are Practice-mode frames where the harness teleported the player to show each area.
- **Not verified:** Firefox and Safari; the 1080p frame budgets (no profiler run); network conditions (no transport exists); a full human-played match. I played the loop only through scripted input and autopilot, not by hand. A long-running memory or GC profile was not done. One server tick spiked to about 60 ms in Node during a full match test, so the 64 Hz p95 budget is not demonstrated.

## Assumptions and deviations

- **Single-player only.** The authoritative room runs in the browser page as a listen server. There is no WebSocket or Colyseus transport, no client prediction or reconciliation, and no matchmaking or services. The rules require single-player play with no backend. The room's API (intent in, filtered snapshots and events out) is shaped so that a socket transport could be added.
- **Custom collision instead of Rapier.** Static map collision is simplified axis-aligned boxes generated from the map source. The same code serves the room, the bots and the renderer, and a versioned hash pins it. Player capsules are approximated by AABBs. Players do not collide with each other.
- **No external assets.** Rendering uses StandardMaterial with procedural textures plus a hemispheric light, a shadowed sun, bloom and glow. There are no PBR materials, baked lightmaps, glTF/KTX2 files or LODs, and every model is built from primitives.
- **Unranked only.** Team damage is off, which the brief allows for the Unranked MVP. Competitive is hidden.
- **Ammo.** Survivors keep their current magazine and reserve into the next round; ammo is not refilled, which is my reading of "persists through a round".
- **Buy phase.** Players can move only inside their spawn region and cannot fire.
- **Harness hooks.** The query parameters `harness=1`, `autostart` and `autopilot` exist only for automated checks.
- **Rule details I chose.** Overtime gives $10,000 per OT half with a swap every 2 rounds. A Cipher detonation deals lethal damage within 22 m. Other values I picked are in `content/rules.ts`.

## Known issues and limitations

1. Bot balance favours the attackers, at roughly 65–75% of rounds in simulated matches. Disarms are rare because retakes usually fail against attackers holding post-plant positions.
2. Rotation times are longer than the brief's targets (about 19–21 s against 8–10 s for mid and 13–16 s for long), and the map has a lot of tall concrete canyon walls.
3. There is no networking, multiplayer, reconnect or rating, and lag compensation has only been exercised in tests.
4. The JS bundle is large (6.4 MB) because it imports all of Babylon.js. It is still under the 8 MB shell budget.
5. Visuals are made of primitives: boxy characters and weapons, and limited animation (procedural walk, crouch, pitch and death tilt). There is no reload animation on third-person models.
6. Players do not collide with each other. Bots can occasionally get stuck; a repath and jump recovery exists.
7. The Practice trajectory preview reads the local room's player state directly, which a networked client could not do.

## Self-assessment

- **Playability: 6/10.** The whole loop plays in the browser with responsive input, readable feedback and real stakes, but bot balance and the lack of long human playtesting hold it back.
- **Visual polish: 5/10.** The space reads clearly and has a coherent style (pale concrete, dark panels, magenta conduits, clean HUD), but the models and animation are primitive.
- **Brief fidelity: 5/10.** The rules, economy, objective, weapons, utility, map, bots and anti-wallhack snapshotting closely follow the brief, while the networked or production half (transport, matchmaking, services, assets pipeline) is not started.
