# Shardfront — one-shot report (claude-sonnet-5.5-high)

## Summary

Shardfront is a playable browser RTS vertical slice: a Three.js (WebGL 2) top-down 3D client over a deterministic 20 Hz TypeScript
simulation, with two asymmetric factions (Helix Directorate, Verdant Chorus), one hand-built point-symmetric map (Glass Ravine),
a full economy → supply → production → tech → expansion → combat → victory loop, fog of war, and a fog-obeying utility AI at
Easy / Normal / Hard. Around the core loop sit a validating Tutorial, minimap, control groups, abilities, post-game statistics,
local replays that re-simulate and verify state hashes, settings with key rebinding, and IndexedDB persistence. All art and
audio are procedural; the production build is a 0.7 MB static site that works from any sub-path.

## Brief coverage

| System / acceptance criterion | Status | Note |
|---|---|---|
| Launch from URL, capability detection, loading shell, error screens | Done | WebGL 2 check with actionable error; boot shell; loading screen; error screen on data/start failure; context-lost overlay (pauses, offers menu; auto-resumes on restore — not exercised in a real GPU reset) |
| Main menu: Play, Tutorial, Tech Archive, Replays, Settings, Credits | Done | all functional, no dead buttons |
| Pre-match: faction cards, difficulty text, map preview | Done | |
| Core loop (6 workers + scout, ore, flux tap, supply, production, expand, scout, army, destroy Core Relay, results, rematch) | Done | verified by AI-vs-AI full matches, UI E2E and tests |
| Late-game rule (after 18:00 +15 % yield, reveal pulse every 90 s) | Done | implemented in sim; exercised only by AI matches that run past 18:00 (not asserted in a test) |
| Two factions, full rosters | Partial | 7 + 8 units and 6 structures each (brief lists 8 + 8 units, 5 structures; Helix lacks a second late unit, Flux Tap is a shared structure, Mender/Bloom Sage heal rather than "repair/mend" variants) |
| Faction asymmetry | Done | Helix: attend-to-build, repair, sturdy. Verdant: seed-and-grow structures, regeneration, speed, cheaper |
| Abilities | Partial | Brace, Curl, Sensor Spike, Emergency Weld, Rootstep, Silence Patch, healing, Aegis shield, Crownbeast aura. Not done: Glimmerwing cloak-reveal, Kestrel "detectable" rule is visibility-only |
| Upgrades (3 attack + 3 armor each, ≤12 % alone) | Done | +8 % damage / +1 armor per level, tested |
| Economy details (1.6 s gather, carried load, drop-off, saturation read-out, supply pause) | Done | per-base "workers / ideal" chips and inefficiency read-out; queue pauses visibly with reason |
| Construction (foundation, progress, HP, cancel refund, placement rules) | Partial | progress/HP/75 % refund/field/terrain/resource-gap/vent/site rules and preview done; no slope rule, no power-grid overlay beyond field circles |
| Map: Glass Ravine (mains, naturals, side expansions, canyon, bridges, lower route, barriers, brush, pylons, pods) | Done | symmetry + fairness tested (rush/expansion distance, resources within 3 %) |
| Fairness tests | Partial | rush, expansion distance, resources tested; sight-line and choke-width comparisons not tested (exact rotational symmetry makes them equal by construction) |
| Walkable/blocked/hover-only/vision-blocking debug visualisation | Done | F3 overlay + minimap |
| Fog of war (LoS, high ground, brush, last-known structures, AI fog obedience) | Done | tested for targeting; AI memory only updated from its own vision grid |
| Camera (55° pitch, 45° FOV, 24–68 zoom easing, edge-scroll option, middle-drag, Shift speed, clamp, Space/Home) | Done | rotation on keys behind a setting; unscaled-time easing |
| Occlusion fade of terrain/structures over selected units | Not started | |
| Controls (select/box/dbl/shift/ctrl, A/S/H/P, queueing, Alt force-move, groups, Tab, F, hotkeys) | Done | G guard/follow not implemented |
| Rebinding | Partial | order/camera/utility keys rebindable; digit groups and card-slot grid fixed |
| Navigation (flow fields, avoidance, stuck recovery, formation slots, no overlap) | Partial | cached Dijkstra flow fields + LOS shortcut + group slots + soft separation + stuck/timeout logic, all tested; **no hierarchical regions, no Web Worker pathing** (main thread, budgeted 3 fields/tick) |
| Combat feedback chain (anticipation, flash, projectile, impact, health response, sound, alert) | Done | windups, tracers/beams/shells, hit sparks, health bars, synth sounds, "under attack" alerts |
| Death states / pooled debris | Partial | collapse/dissolve animation + particles; particles are a pooled CPU-updated system (the brief prohibits CPU gameplay particles — these are cosmetic only) |
| HUD (minimap, selection, command card, resources/supply/workers/timer, objective, alerts, tooltips with 350 ms expansion) | Done | |
| Tutorial (8–10 min, validates actions) | Done | 11 steps, E2E-driven end to end |
| Skirmish with Easy/Normal/Hard AI | Done | |
| AI (fog-obeying, memory, planner, squads, scouting, raids/evacuation, no cheats) | Partial | utility planner with memory, composition counters, expansion, defence, evacuation, waves/retreat; **no harassment squads, simple squad states, no kiting micro** |
| Post-game (metrics, timeline, graphs, rematch/replay) | Done | |
| Replays | Done | seed + command log + periodic hashes; playback verifies hashes; spectator view with fog toggle and speed controls. Stores the 8 newest |
| Persistence (IndexedDB repository: settings, history, replays, XP/badges) | Done | corrupt/unavailable store falls back to defaults |
| Audio (buses, positional, adaptive score, unique alert signatures) | Partial | fully synthesised; buses, pan/attenuation, voice cap, intensity-hysteresis score; per-unit voice barks and 32-voice virtualisation not done; **not audibly verified** (headless) |
| Settings (preset, render scale, shadows, effects, AA, audio, camera, keys, colour-blind palettes, reduced motion) | Done | subtitle option is a text-alert toggle label only |
| Renderer: WebGPU adapter | Not started | WebGL 2 only |
| UI in React | Not started | vanilla TypeScript DOM (deliberate, to keep per-frame state out of any framework) |
| Monorepo packages | Partial | one package with the brief's module boundaries as folders |
| LODs, texture compression, glTF assets, KTX2, meshopt | Not started | procedural primitives only |
| Online multiplayer, lobby, snapshots | Not started | command protocol (`Command`, versioned) and deterministic hashes are the groundwork |
| Benchmark scene | Partial | `?bench=1`; measured only on a software rasteriser (see below) |
| Sandbox mode | Not started | |
| Service worker, CSP | Partial | restrictive CSP injected in the production build; no service worker |

## Architecture

* **Stack:** TypeScript (strict), Vite 6, Three.js 0.170 (WebGL 2), Vitest, Web Audio. A thin custom renderer instead of a game
  engine: the RTS needs instancing, fog, selection and a simulation that is independent of rendering.
* **`src/data`** – schema + balance tables for both factions and neutrals, `validateData()` run at boot and in tests.
* **`src/sim`** – `Sim` (fixed 20 Hz, typed-array hot state: position, hp, owner, type; sparse per-entity `Ext` records; seeded
  RNG; ordered iteration), `map.ts` (glyph-grid → organic raster, point-symmetric), `nav.ts` (occupancy + cached Dijkstra flow
  fields + LOS), `vision.ts` (LoS, high ground, brush), `units.ts` (orders, gather/build/repair/abilities, separation),
  `combat.ts` (acquisition, windup/projectile/splash/eruption/slow/silence/pierce, damage formula, structures), `move.ts`.
  Everything mutates only through `Command`s (`sim.issue` / `submit`), which are what the UI, AI, replay and a future server use.
* **`src/ai`** – utility AI reading only its own visibility grid + memory records; Easy/Normal/Hard are parameter profiles.
* **`src/render`** – instanced procedural models (4 draw groups per type), terrain with injected fog + surface-detail shader,
  particles/beams/rings, per-unit team base rings, 2D overlay for selection/health/orders. Render code never decides gameplay.
* **`src/input`, `src/ui`, `src/audio`, `src/app`** – camera/input, DOM HUD + minimap, synthesised audio, app shell/game loop.

## Verification

All commands were run from a clean state (`rm -rf node_modules dist`, then `npm ci`).

* `npm ci` → OK.
* `npm test` → **2 files, 35 tests passed, 0 failed** (data validation; map symmetry/connectivity/fairness; economy, supply
  pausing, refunds, placement, flux/tap, Verdant seeding; research; abilities; combat rules incl. armor formula, shield,
  mortar min range, slow, healing, silence; fog targeting; victory; **determinism with identical hashes across 30/60/144 fps
  loops; record-then-replay hash equality**; 40-unit group movement with no overlaps/strandings; narrow-gate crossing with
  stuck < 3–4 s; a full 16-minute Normal-vs-Normal AI match that expands, attacks and ends in victory).
* `npm run build` → `tsc --noEmit` clean, Vite build OK, `dist/` 732 KB, JS 742 KB (208 KB gzip), asset paths relative
  (`./assets/…`).
* Served `dist/` from `/play/claude-sonnet-5.5-high/shardfront/` with the included static server and loaded it in headless Edge
  (WebGL via SwiftShader) with the CSP active: no console errors in any run.
* `node tools/e2e.mjs` → **15/15** (real mouse/keyboard: box select, B palette, placement preview, build, Q train, Ctrl+1 / 1
  groups, A+click attack-move, right-click move, S stop).
* `node tools/e2e2.mjs` → **10/10** (settings persist across reload, Verdant seeding + Rootstep cooldown, victory → post-game,
  replay playback reaches matching hashes, history persisted).
* `node tools/tutorial-e2e.mjs` → **14/14** (all 11 tutorial steps validated; badge persisted). Some steps use commands rather
  than key presses to keep the run short, and Bulwarks are teleported near the outpost for the attack-move step.
* AI-vs-AI (Normal, 8 games, both seat orders, before the final stalemate fix): Helix 3 / Verdant 3, two games reached the
  20-minute cap without a winner; after adding late-game commitment one of those re-ran to a Helix win at 16.1 min. Typical match
  length 9–17 min. The other stalemate (seed 4) was not re-run.
* Sim cost: ≈1.1 ms/tick early, ≈2–3 ms/tick with ~250 entities (measured on this dev machine, no concurrent load).
* `screenshot.png`: real gameplay (a skirmish played by the AI on both sides, fast-forwarded headlessly inside the page to the
  first major fight, then rendered by the production build; Helix selection vs Verdant at 7:18). Additional captures in `oneshot/`
  (menu, pre-match, base, gallery, post-game, replay, tutorial, benchmark).

**Not verified:** frame rate on a real GPU (the only renderer available was software, 4.4 FPS median in the 220-unit benchmark,
which says nothing about the 60 FPS target); audio output; behaviour at 125 %/150 % browser scaling; Firefox/Safari; real
WebGL context loss; the 18-minute late-game pulse in a UI session; human win-rate against the AI levels.

## Assumptions and deviations

* One package, vanilla DOM HUD, WebGL 2 only, main-thread navigation, no React / WebGPU / workers / glTF / KTX2 (time).
* Balance data is TypeScript objects validated at runtime rather than JSON files.
* Unit speeds and the 144×144 map are tuned so a match lasts ~10–17 minutes; supply costs and numbers are original.
* Armor is a percentage formula (`100/(100+10·armor)`); upgrades: +8 % damage or +1 armor per level.
* Friendly fire is disabled everywhere (the brief allows it only for marked siege effects; omitted for MVP clarity).
* Camera rotation uses `,` / `.` (Q/E conflict with ability hotkeys); WASD pan is an opt-in setting for the same reason.
* A hall counts as the loss condition when **all** Core Relays / Heartgroves are destroyed.
* New workers from an un-rallied hall start mining automatically (quality-of-life).
* Replay keeps hashes every 5 s; seed + human commands are enough because the AI is deterministic.

## Known issues and limitations

* Performance and visual parity are unmeasured on real hardware; draw-call count is modest (instanced) but untested at 400 units.
* AI is competent but simple: no harassment, little micro, can stall in stand-offs until the late-game commitment rule fires
  (one 20-minute stalemate remained in my 8-game sample).
* Workers that finish a Helix build resume mining only if they were mining before; otherwise they idle (idle count is shown in the HUD).
* No occlusion fade, no LODs, no guard/follow order, no sandbox, no online mode, no service worker.
* The terrain is soft near cliffs (1 vertex per cell); bridges are slabs without animated detail.
* Replay list keeps the 8 newest local replays; very long matches store large command logs in IndexedDB.

## Self-assessment

* **Playability: 7/10** – the whole loop works and was driven end-to-end with real input and by two AIs, but I could not play
  long human sessions, balance is only checked AI-vs-AI, and navigation/micro are simpler than a production RTS.
* **Visual polish: 6/10** – readable team rings, fog, animated procedural models, VFX and a coherent HUD; but terrain and
  models are low-poly and dark, there are no LODs/textures, and nothing was tuned on a real GPU.
* **Brief fidelity: 6/10** – the gameplay systems are broad and honest to the brief's intent (asymmetry, fog, AI, replays,
  tutorial, determinism), while the technical direction (React, WebGPU, workers, asset pipeline, multiplayer) is mostly absent.
