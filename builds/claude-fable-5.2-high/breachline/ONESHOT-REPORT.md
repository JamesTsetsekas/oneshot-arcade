# ONESHOT REPORT — Breachline (`claude-fable-5.2-high`)

## Summary

I built a playable vertical slice of Breachline: an offline 6v6 Team Clash against bots on an original map, Relay
Station K-17, with the full loop from menu and loadout editor through spawn, gunfights, Momentum support actions,
death recap, respawn, match end, results, XP and play-again. It runs on the architecture the brief asks for — an
authoritative room (hosted in a Web Worker for Practice) speaking a binary input/snapshot protocol to a client that
predicts with the same Rapier-backed simulation, reconciles, interpolates and is lag-compensated — rendered with
Babylon.js and a React shell. Everything visible and audible is procedural and original; there is no backend, and
the online services (matchmaking, hosted rooms, accounts) are not built.

## Brief coverage

| System / criterion | Status | Note |
| --- | --- | --- |
| Complete loop: launch → Practice → loadout → spawn → fight → die/respawn → match end → results → play again | Done | Played end to end by an automated browser run on the production build (see Verification). |
| Team Clash rules (75 points / 8 min, sudden death +5 / 60 s, 3 s respawn, warmup) | Done | Server-owned clock and score; rules covered by tests. Warmup is a 7 s freeze. |
| Practice mode with configurable bots, score/time, latency simulation | Done | Difficulty, team size 1–6, score, time, side, latency presets. No aim-diagnostics screen (only a performance/netcode overlay). |
| Online: matchmaking, regional rooms, 12 browser clients in one room, guest auth, requeue | Not started | No backend shipped. The room class is transport-agnostic and runs headless in Node (tests), but no WebSocket host, matchmaker or services exist. Quick Play is hidden rather than shown dead. |
| Authoritative simulation (movement, ammo, cadence, spread seed, hits, damage, Momentum, spawns, score, clock) | Done | `src/server/room.ts`; the client only sends input commands. |
| Client prediction, reconciliation, interpolation | Done | Shared `stepPlayer`; float32-quantized state keeps client and server bit-identical; error smoothing < 1.5 m, snap + counter beyond. |
| Lag-compensated hitscan (≤ 200 ms rewind) | Done | Per-tick position history, fractional rewind, clamp at 12 ticks; tested with a moving target. |
| Binary protocol, bandwidth budget | Partial | 26-byte inputs, ~230-byte snapshots at 20 Hz (measured 7–10 KB/s down). Low-rate events are structured objects, not binary. No delta compression or interest filtering. |
| Movement: walk, sprint, crouch, jump, mantle, ADS slowdown, collision | Done | Tuned to the brief's numbers and tested. No slide, prone or lean (as specified). |
| Camera: FOV 75–110 with vertical conversion, separate viewmodel FOV, Pointer Lock, per-optic sensitivity, additive layers | Done | Bob/shake/sway are decorative and never move the aim ray. Viewmodel FOV is emulated by scaling the weapon layer. |
| Combat: 100 HP, regen after 5 s, hit zones, falloff, seeded spread, recoil patterns, penetration, staged reloads, melee, spawn protection | Done | Melee has no lunge. Recoil-envelope validation on the server is not implemented (cadence, ammo and state are enforced). |
| Nine weapons with distinct identity | Done | All fire, recoil, reload by stages and can kill (tested per weapon). Models are procedural and blocky. Fire-mode toggle not implemented (hidden). |
| Attachments (5 slots, max 3, visible tradeoffs) | Done | 11 attachments; several change the weapon model (optics, suppressor, grips, magazines, stocks). |
| Perks (3 groups × 3) | Done | All nine have gameplay effects; none touches damage or health (tested). |
| Equipment (3 lethal, 3 tactical) | Done | Frag with cooking, adhesive charge, directional mine with visible laser, flash with LOS/facing, opaque obscurant that blocks bot sight, signal dart. Each has one charge that recharges on a timer. |
| Momentum support actions (3 / 5 / 8) | Done | Recon Sweep, Ammo Pod, Hunter Drone, Mortar Mark, Interdiction Flight, Team Uplink; warnings, counterplay, sky/indoor validation, one tier-8 per team, support kills give score but no Momentum (tested). |
| Map Relay Station K-17 with five districts, three lanes, four connectors | Done | ≈116 × 96 m, authored as data; traversal metrics and "no spawn-to-spawn sightline" are tested. No doors (open doorways); glass is breakable. |
| Bots: perception, routes, weapons, equipment, support, retreat, legal aim delays | Done | No wall vision; respects smoke and flash; three difficulties change skill only. Bots do not mantle and nav is not rebaked when glass breaks. |
| Spawn director with audit reason; 10,000-respawn safety test | Done | 0 unsafe picks in 10,000 randomized respawns. |
| Death recap matching server damage history | Partial | Attacker, weapon, distance, hit timeline, direction, death camera. No shortened killer-view replay. |
| HUD (crosshair, ammo, health, minimap, score/timer, kill feed, Momentum, hit/kill feedback, damage direction) | Done | Batched DOM layer outside React. Fixed pixel sizes (does not scale for 4K). |
| Menus: main, practice, loadouts, profile, settings, credits, pause, results | Done | Matchmaking/lobby screens do not exist (no online). |
| Loadouts ×5, persistence, tamper rejection | Done | Stored locally; the room re-validates on join; stale/corrupt saves are repaired. |
| Progression: XP, levels 1–30, unlock track, five onboarding challenges, stats, export/reset | Done | Everything is usable in Practice (as the brief states); level gates exist in the validator for an online ruleset. Weapon-mastery cosmetics are listed on the track but not applied to models. |
| Settings and accessibility | Partial | FOV, viewmodel FOV, sensitivity, toggles, key remap, quality presets, render scale, audio buses, colour-blind accents, reduced motion, dark flash, subtitles. No dynamic resolution, texture-quality or separate AA option. |
| Audio: weapon layers, footsteps by surface, spatial mix, occlusion, reverb zones, compression, voice cap, music, announcer | Partial | All synthesized (Web Audio). Announcer is tones + subtitles, not voice. I could not listen to it (see Verification). |
| Visual direction (sky, sea mist, bleached composite, safety orange, cyan comms, silhouette-based teams) | Partial | Coherent but low-fidelity procedural art; no baked lightmaps, GLB assets, LODs or GPU particle systems. |
| Performance: 60 FPS at 1080p medium, server tick budget | Done (on my hardware) | ~110–120 fps at 1080p medium on an RTX 2080 Ti in headless Chrome; room tick p95 ≈ 1.4 ms in Node. Not measured on weaker hardware. |
| Error handling: missing capabilities, Pointer Lock refusal, server loss, context loss, tab hide | Partial | Capability error screen, pointer-lock and worker-failure modals, context-lost notice, snapshot-buffer reset on tab return. Only the capability check and happy paths were exercised. |
| No proprietary names / assets | Done | Original names and procedural assets; a test scans source text for a list of franchise and branded-weapon terms. |
| Reconnect, backfill, anti-cheat telemetry, replays, load tests, WebGPU, glTF/KTX2 pipeline | Not started | Outside the slice. |

## Architecture

**Stack.** Strict TypeScript, Vite, Babylon.js 9 (WebGL 2), Rapier (`rapier3d-compat`, WASM), React 19 for the
shell, Vitest for tests, `playwright-core` (driving an installed Chrome/Edge) for the smoke/screenshot tool. One
npm package; folders mirror the brief's modules.

**Why this shape.** The brief's hardest requirement is that Practice behave like the real game, so Practice is the
real game with the server moved into a Web Worker. `Room` never touches the DOM or the renderer (enforced by a
test), takes a `send` callback and decoded messages, and is exercised headless in Node. The client talks to it
only through `Connection`, so a WebSocket transport could replace `WorkerConnection` without touching game code;
`LatencySim` wraps any connection to inject delay, jitter and loss.

- `src/content/` — data: weapons (+ `resolveWeapon`, damage curves), attachments, perks, equipment, support
  actions, loadout validation, progression, tuning tables, and the K-17 map as boxes/ramps/cylinders with
  materials, spawns, zones, lamps and bot interest nodes.
- `src/sim/` — `stepPlayer` (movement, stance, mantle, weapon state machine, ammo, equipment charges) used
  verbatim by server and client; `World` (Rapier static world, kinematic capsule moves, rays, bullet penetration,
  breakable glass); analytic hit zones (so rewinds need no physics state); a layered nav grid baked from map data.
- `src/protocol/` — message types, `encodeCmd`/`decodeCmd` (26 bytes), `encodeSnapshot`/`decodeSnapshot`.
- `src/server/` — `Room` (phases, per-command simulation with a banked command budget, lag-comp history, damage,
  kills, assists, Momentum, equipment and device entities, support actions, results), `BotBrain` (perception →
  mode → synthesized input commands through the same step), `chooseSpawn` (scored, audited), worker entry.
- `src/client/` — `Predictor` (predict, RTT-projected warmup freeze, replay, error smoothing), `Interp`
  (adaptive 100–200 ms buffer), `Input`, transport, `Game` (fixed 60 Hz ticks decoupled from rendering), and a
  demo `Autopilot` for automation.
- `src/render/` — scene/lighting/quality, map mesher (merged per material, world-projected UVs, per-vertex baked
  sky occlusion and lamp light), procedural textures, sky/ocean shader, instanced characters, weapon builder and
  viewmodel animation, thin-instanced particles/tracers/decals, entity views.
- `src/audio/`, `src/ui/` (React screens + DOM HUD), `src/profile/` (local profile, idempotent result apply).

A finding worth recording: feeding gravity into Rapier's kinematic character controller every tick while grounded
clipped the horizontal move on ~2% of ticks (visible hitching). The step now passes zero vertical motion while
grounded and relies on snap-to-ground; a test walks curves for 3,000 ticks and asserts zero clipped moves.

## Verification

All commands were run in the workspace on Windows 11, Node 22.12.0, npm 11.4.2.

**Clean install, tests, build** (after deleting `node_modules` and `dist`):

- `npm ci` → installed, 0 vulnerabilities.
- `npm test` → **57 passed, 0 failed** (5 files, ≈10 s). Notable output:
  - `[bot match] 33-40 in 146s sim | tick p95 1.37 ms` — a full headless 6v6 match to 40.
  - `[spawn] 10000 respawns: unsafe picks 0, no-safe-candidate cases 0`.
  - `[map metrics] centre W 11.2s E 10.0s | cross 20.7s | via ridge 23.0s | via utility 24.4s | nav nodes 35882`.
  - Netcode: lock-step on a clean link; at 80 ms RTT / 10 ms jitter and at 150 ms / 30 ms / 2% loss the predicted
    shot count and ammo equal the server's, with 0 snaps and a bounded input backlog.
- `npm run build` (`tsc --noEmit && vite build`) → succeeded. `dist/` is 11 MB: shell 293 KB (91 KB gzip), game
  chunk 1.24 MB (308 KB gzip), Rapier 4.33 MB (1.67 MB gzip) plus a 4.44 MB worker chunk.

**Sub-path serving and gameplay** — `SHOT_SCORE=20 node tools/screenshot.mjs` serves `dist/` at
`/play/claude-fable-5.2-high/breachline/` and drives headless Chrome:

- 0 console errors, 0 page errors, 0 failed requests.
- Menu, Practice and Loadouts screens rendered and were clicked through (`oneshot/menu.png`, `practice.png`,
  `loadouts.png`, `loadouts-attachments.png`).
- A full match to 20 ran to the results screen with the demo autopilot (final 20–6; 13 eliminations, 1 death):
  `oneshot/screenshot.png`, `gameplay-*.png`, `death-recap.png`, `results.png`. Details in `oneshot/smoke.json`.
- Measured in that run: median 113 fps / minimum 87 at 1280×720 medium (ANGLE D3D11 on an RTX 2080 Ti),
  10.1 KB/s of snapshots, 1 reconciliation, 0 snaps.

**Other browser checks I ran** (dev server and `vite preview`, headless Chrome):

- The real input path: Practice → Deploy → Pointer Lock was granted; holding `W`, moving the mouse and holding
  fire moved the player 8.6 m, turned the view and spent 7 rounds with 0 reconciliations.
- 1920×1080: ≈121 fps medium, ≈132 low, ≈109 high on the same machine; switching presets at runtime produced no
  errors (`oneshot/gameplay-1080p.png`, `quality-low.png`, `quality-high.png`).
- Screenshots I inspected by eye during development: menu, map overviews, interiors, hip and ADS viewmodels for
  three weapons, bullet decals, obscurant cloud, flash burst, signal dart pulse, mine lasers, death recap, results.

**What I could not verify**

- **No human has played this build.** Feel, difficulty and balance were tuned from bot-versus-bot statistics and an
  autopilot, not from hands-on play. The autopilot beats Normal bots easily, so difficulty for a person is unknown.
- **Audio was never heard.** The synthesis code runs without errors, but the automated browser was muted; mix
  levels and timbre are unverified.
- The pause menu (Esc releasing Pointer Lock), key rebinding, profile export/reset and the settings sliders were
  not exercised by automation; they are simple, but untested in a browser.
- Hunter Drone, Ammo Pod, Mortar Mark and Interdiction Flight are tested headlessly for rules, and their views ran
  in bot matches without errors, but I did not capture and inspect screenshots of each effect.
- `quality-high.png` was captured but not inspected; only its error-free run and frame rate were checked.
- Firefox, Edge and Safari were not run (only Chrome). Weaker GPUs and integrated graphics were not measured.
- Error paths other than the capability check (worker crash, context loss, Pointer Lock refusal) were not triggered.

## Assumptions and deviations

- **Practice only.** Matchmaker, hosted rooms, profile service, PostgreSQL/Redis and guest accounts are not built.
  The room runs in a Web Worker over `postMessage`; Colyseus/WebSockets are not used.
- **Navigation** is a baked 0.5 m layered grid with A* and string-pulling, not a navmesh.
- **Lighting** uses real-time cascaded sun shadows plus per-vertex baked sky occlusion and lamp light, not
  lightmaps. The Low preset bakes sun shadows per vertex instead.
- **Assets** are procedural: no glTF/GLB, KTX2, Draco/meshopt or Opus pipeline, no LODs.
- **Storage** is `localStorage`, not IndexedDB.
- **Equipment** has one charge per slot that recharges (24–28 s lethal, 20–24 s tactical) instead of per-life
  counts; this is what makes Team Uplink's "faster equipment recharge" meaningful.
- **Momentum** resets on death, but support actions already banked stay available.
- **Spawn protection** is read as "protected players take no damage"; it ends after 2 s, on firing, or after 5 m.
- **Death recap** has no killer-view replay; the camera pulls back from your body and turns to the killer.
- **Loadout on death** uses `1`–`5` directly on the recap panel instead of an `M` menu.
- **Not implemented and therefore not shown:** fire-mode toggle (`V`), interact (`E`, there is nothing to interact
  with), doors, lunge on melee, physics ragdolls (a scripted fall pose is used), voice announcer.
- **Unlock levels** are displayed, but everything is equipped freely in Practice, as the brief allows.
- **Snapshots** always include every player's position (no interest filtering); the minimap only shows enemies the
  server flags as revealed, but a modified client could read the rest.
- **Viewmodel FOV** (55–75) is treated as a vertical angle for the weapon layer.
- **Post-match** stays on the results screen until the player chooses Play Again or Main Menu.
- **Pause** does not stop the match, because the room is authoritative and keeps ticking.

## Known issues and limitations

1. Unplaytested by a human; pacing (≈5 minutes to 75 on Normal in bot simulations) and difficulty may be off.
2. Audio is synthesized and unauditioned; it may sound harsh or unbalanced.
3. Art is blocky: box-built operators and weapons, simple forearms, no finger or reload-hand detail.
4. Rapier's WASM is inlined as base64 in both the main and worker bundles (~4.3 MB each before gzip).
5. Shotgun bots underperform, and bots never mantle, so some routes are human-only.
6. The death camera can clip into geometry in tight spaces.
7. HUD sizes are fixed in pixels and get small above 1440p.
8. Bots' nav grid is not updated when glass breaks, so they never walk through broken windows.
9. Events (kill feed, shots, hits) are sent as structured objects rather than a binary schema.
10. Only Chrome was tested; behaviour on other browsers is unknown.

## Self-assessment

- **Playability: 7/10** — the whole loop works and survives an automated full match with no errors, but nobody has
  played it by hand, so feel and difficulty are unproven.
- **Visual polish: 6/10** — consistent art direction, readable HUD and decent lighting, held back by procedural,
  low-detail models and animation.
- **Brief fidelity: 6/10** — the offline slice follows the brief's architecture and content list closely (all
  weapons, attachments, perks, equipment and support actions), while the entire online half is absent.
