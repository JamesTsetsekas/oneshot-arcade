# ONESHOT REPORT — Skybreak (claude-sonnet-5.5-high)

## Summary

Skybreak is an original browser battle royale vertical slice: you queue for a 24-player Solo match on a procedurally built 1.2 km island ("The Highwake"), stage on a pier, ride a skiff, free-fall and wing-sail onto the island, loot nine wind-instrument-themed weapons across five rarities, fight 23 perception-limited bots, rotate through the brief's Calmfield/Riftstorm phases, and see a full results screen before requeueing. The simulation is a strict-TypeScript, headless-testable 30 Hz authoritative module (character controller, combat, loot, storm, bots) hosted locally in the tab, rendered with three.js at 60 FPS-class performance in software WebGL, with a Practice Range, HUD/map/inventory/settings/accessibility options and procedural audio. The loop is complete start to finish; the multiplayer/service layers of the brief are intentionally not built (single-player local bot mode only).

## Brief coverage

| Area / acceptance criterion | Status | Note |
| --- | --- | --- |
| Launch from URL, menu, Quick Drop, Practice (no account) | Done | Static site, guest profile in localStorage |
| Queue / matchmaker / regional room / bundle download | Partial | Local "queue" screen fills seats with bots; no real matchmaking or bundles |
| 35 s staging pier, skiff along seeded path, jump, freefall, wing-sail | Done | Pier + skiff + 5 seeded end points, auto-deploy at 140 m, manual Space/Z, map marker |
| 24 players on one 1.2 km island, bot fill | Done | 1 human + 23 bots, 14-18 min including staging (tested) |
| Named locations (6) + landmarks (8) | Done | Procedural layouts; Wind Abbey, Kilnworks hazard channels, flooded Array, terraces, docks |
| Third-person camera (boom 3.1, shoulder 0.55, ADS, swap, collision) | Done | Shared camera model used by server aim and client; reduced-motion camera layer |
| Movement: walk/run/sprint/crouch/slide/jump/mantle/swim/zipline/glide/grapple/vents | Done | One controller, covered by tests. No ascenders (vents + grapple + ziplines only) |
| Health + Aegis + Reserve, recharge, damage order | Done | Tested |
| Nine weapons, hitscan + projectile, recoil pattern, seeded spread, zones, falloff, shotgun cap | Done | Data-driven (`shared/content.ts`) and tested |
| Five rarities (shape + color), modest stat curves, Prototype cap | Done | Prototype only from supply capsules, capped at 3 |
| 5-slot inventory, ammo caps, 8 consumables/utilities, hold-to-swap, pickup compare | Done | Inventory screen, drop, stacking tests |
| Loot: floor, chests, lockers, death caches, supply capsules | Done | Server-seeded tables with tier weights, duplicate suppression |
| Caravan drone | Not started | Omitted; capsules cover mid/late-game high-tier loot |
| Calmfield/Riftstorm phases, valid centres, damage, UI | Done | Brief radii/waits/damage; endgame moving legs + collapse; storm bypasses shields |
| Bots: perception limited, drop/loot/rotate/fight/heal, no cheats | Partial | No navmesh (door waypoints + rect avoidance); no cover points, no zipline/grapple/vent use |
| Results screen, mastery/cosmetic persistence, requeue | Done | Placement, elims/assists, damage, accuracy, time, distance, storm, loot, timeline, route |
| Spectator after death | Partial | Follows living players (killer first), prev/next, fast-forward; no report/leave-to-lobby split |
| Practice Range | Done | All weapons x 5 rarities, ammo, items, targets, movement course, readout |
| HUD, full map, marker, compass, kill feed, hit markers, damage arcs | Done | |
| Settings & accessibility (presets, FOV, sens, remap, colorblind, reduced motion, captions, visual sound indicators) | Done | Antialiasing needs a reload |
| Audio (spatial, priority, music) | Partial | Fully procedural; simple panning + distance, no occlusion/zones |
| Server-authoritative networking, prediction, interest management, lag compensation, replays, anti-cheat | Not started | Sim is authoritative *behind an input/event boundary* but runs in-tab; no sockets |
| Services (identity, matchmaking, profile API, reports, telemetry) | Not started | Local storage only; none by design (no external services) |
| Rapier physics / Babylon.js / React / glTF/KTX2 pipeline / HLOD | Not started | Simplified custom collision, three.js, DOM UI, procedural assets |
| Tools (cell editor, loot heatmap, storm viewer, soak tests) | Partial | Headless bot-match soak and storm/loot tests in `tests/`; Playwright scripts in `tools/` |

## Architecture

* **Stack**: TypeScript (strict) + Vite + three.js 0.170 (WebGL 2). Tests with Vitest. No runtime services.
* **`src/shared`**: `content.ts` (all data: weapons, rarity curves, items, ammo caps, loot tier tables, storm phases, movement and combat constants, match constants), `math.ts`, `rng.ts` (seeded PRNG + noise).
* **`src/sim`** (no DOM/three imports): `world.ts` (seeded island, heightfield + box/cylinder collision with a spatial grid, ray casts, loot sockets, ziplines/vents/hazards, valid storm centres), `movement.ts` (character controller), `camera.ts` (shared camera model/aim ray), `match.ts` (30 Hz authoritative match: lifecycle, combat, damage/kill attribution, loot interaction, projectiles, smoke, capsules, events), `storm.ts` (seeded schedule), `inventory.ts`, `loot.ts`, `bots.ts` (perception + planners). The client talks to it only through a per-tick `PlayerInput` and a drained `GameEvent` list plus read-only state, which is the seam a socket server would replace.
* **`src/client`**: `game.ts` (fixed-step loop, interpolation, camera, spectate, results), `gameview.ts` + `worldview.ts` + `models.ts` (three.js scene: chunked terrain, instanced buildings/foliage, actors, loot, FX, storm wall, sky), `hud.ts`, `screens.ts`, `minimap.ts`, `input.ts` (latched inputs), `audio.ts` (Web Audio synthesis), `settings.ts` (settings + profile).
* **Why**: the brief's centre of gravity is an authoritative rules engine; building that as a pure, deterministic, unit-testable core first and rendering it second maximises what can be verified in one session.

## Verification

Commands actually run in this workspace (Windows, Node 22.12, headless Google Chrome driven by Playwright, SwiftShader software WebGL):

* Final clean run: `rm -rf node_modules dist; npm ci; npm test; npm run build` -> 8 test files, **68 tests passed, 0 failed** (content, world, movement, combat/healing/utility, inventory/loot, storm, bots, full 24-seat matches); build succeeded.
* Full headless 24-bot matches (seed 42 and others) run staging -> skiff -> drop -> every storm phase -> exactly one winner, with unique placements 1..24 in about 4 s wall time per match.
* `npm run build` -> `tsc --noEmit && vite build`, output `dist/` (about 710 kB JS, 199 kB gzip, 17 kB CSS).
* `tools/shot.mjs`, `shot2.mjs`, `hero.mjs`, `flow.mjs` drive the **production build served from the sub-path** `/play/claude-sonnet-5.5-high/skybreak/` with Playwright: main menu, practice range pickup/fire/heal/inventory/map, queue -> staging -> skiff -> freefall -> glide -> landing, a firefight with hit markers, pause menu, death -> spectate -> results -> requeue, and a forced victory -> results. Screenshots are in `oneshot/`. Measured about 50 FPS at 1280x720 in *software* WebGL (SwiftShader) during staging.

Not verified (be sceptical of these): real GPU frame rate (target hardware benchmark not run), real pointer-lock mouse feel (automation sets look angles directly), audio output (muted in automation; no errors thrown), Firefox/Safari, memory/draw-call budgets, 120 ms RTT behaviour (no network), long-session soak beyond headless matches.

## Assumptions and deviations

* **three.js, not Babylon.js; DOM UI, not React; custom collision, not Rapier; procedural assets, not glTF/KTX2.** Chosen for one-session reliability and zero external assets.
* **No server.** The "server" is the in-tab authoritative simulation. No prediction/reconciliation/interpolation buffers beyond render interpolation, no lag compensation or interest management (nothing leaves the tab). The protocol seam exists (inputs in, events + state out).
* Phase 0 whole-island field is 560 m; the first field (430 m) arrives via a 10 s "Riftstorm sweeping in" contraction, then 430->320 over 120 s as in the brief. The storm clock starts 25 s after skiff departure. Storm and heat channels bypass Aegis/Reserve and hit Health directly.
* Doors are open gaps (not stateful). Building interiors are compact single rooms; roofs are standable via exterior stairs/mantle.
* Prototype rarity: +8% damage, +14% fire rate, +30% recoil, wider spread; only from supply capsules (max 3/match).
* Match length is ~13-14 minutes in all-bot soaks (storm schedule totals 815 s plus staging and insertion).
* Spectating is allowed while any player is alive with a 2.2 s delay, following living players only (no free camera).
* Camera aim uses the camera ray to a target point, then a muzzle-to-target ray (obstruction-checked), as the brief describes.

## Known issues and limitations

* Bots have no navmesh: they route around buildings with door waypoints and rectangle avoidance, can still get snagged on trees/boulders, never climb stairs on purpose (they step off roofs), and do not use ziplines, vents or grapples.
* Combat feel is tuned only by reasoning and headless matches, not by long human playtesting; recoil/spread values may need adjustment. Bot lethality is moderate: in soak matches many eliminations are Riftstorm deaths.
* Performance on weak GPUs is unmeasured. Instanced foliage is not frustum-culled per instance; dynamic resolution (0.55-1.0) and a Low preset exist as mitigations.
* Procedural character/weapon models are blocky and the human weapon is small from the over-the-shoulder camera; no skeletal animation (limbs are posed procedurally).
* Settings: antialiasing changes need a page reload; shadow-map size changes recreate the shadow map.
* Pointer lock must be granted by a click (a hint appears if it is not); Ctrl+W still closes the tab, so crouch also accepts `C`.
* No caravan drone, ascenders, destructibles, stateful doors, voice, ranked or squads (deferred by the brief or not reached).

## Self-assessment

* **Playability: 7/10** — the full loop works and is verified end to end, controls are conventional, bots fight and the storm forces movement; feel has had little human tuning.
* **Visual polish: 6/10** — bright, readable low-poly look with sky, water, shadows, instanced foliage and a clean HUD, but blocky procedural characters, no animation clips and simple VFX.
* **Brief fidelity: 5/10** — the single-player gameplay slice follows the brief's numbers closely, while networking, services, physics middleware, asset pipeline and several bot/audio details are explicitly out of scope.
