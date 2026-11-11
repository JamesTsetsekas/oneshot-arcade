# ONESHOT REPORT: Breachline

## Summary
Breachline is a playable offline vertical slice of the brief: a 6v6 Team Clash on an original ~115 x 95 m map (Relay Station K-17) against simulation-driven bots, running from a static site. It contains the whole Practice loop (menu, loadout, warm-up, fight, Momentum support actions, recap/respawn, sudden death, results with XP, play again) on a headless-testable fixed-step simulation that is separate from the Babylon.js renderer. Online multiplayer (room server, netcode, matchmaker, database) was **not** built; `src/shared` imports no rendering/UI code so it can be hosted later.

## Brief coverage
| System / criterion | Status | Note |
|---|---|---|
| Launch, Practice without account, loadout, spawn, full match, results, play again | Done | Verified in headless Chromium (fast-forwarded match to results and back into a new match) |
| Team Clash rules (6v6, 75 pts / 8 min, warm-up, sudden death +5 / 60 s, draw) | Done | Unit tested |
| Online authoritative 6v6, 12 clients, matchmaker, profile service, Postgres/Redis | Not started | Practice only; profile is localStorage |
| Prediction, reconciliation, interpolation, lag-compensated hitscan | Not started | Sim is in-process; render interpolates between 60 Hz states. No lag compensation, no latency simulation |
| 60 Hz fixed sim, shared simulation code | Done | Pure TS, headless tests; about 0.26 ms/tick for 12 bots in Node |
| Movement (walk/sprint/crouch/jump/mantle/ADS slow, stairs) | Done | Box body instead of a capsule; mantle 0.6-1.35 m; no moving doors |
| Combat: 9 weapons, recoil, spread, falloff, zones, penetration, reload stages, melee, regen, spawn protection | Done | Per-weapon tests; every weapon kills an opponent in tests |
| Attachments (max 3, tradeoffs), 9 perks | Partial | 11 attachments; all 9 perks implemented, but Trace Reader = radar footprints only and Munitions Eye = radar icons only |
| Equipment: frag (cook), adhesive, mine, flash, obscurant, signal dart | Done | Fixed-step bouncing projectiles; obscurant blocks sight for bots and players |
| Momentum + 6 support actions | Done | All tiers earnable in one life (tested); sky/indoor validation, telegraphs, one Tier-8 per team. Drone does not fire. Support visuals are simple |
| Death recap (attacker, weapon, distance, timeline, direction) | Done | Matches damage log (tested); death cam looks at the killer rather than using a sanitized replay buffer |
| Spawn director + 10,000-respawn test | Done | Test passes with zero violations when a safe candidate exists |
| Bots (perception, routes, hold, retreat, equipment, support) | Done | Nav graph from collision, A*, heat avoidance; no wall vision (tested). Hold angles are auto-derived, not baked cover nodes |
| Map K-17 | Partial | Mirrored layout, 3 lanes, 4 connectors, catwalk, glass, thin panels. No underground tunnel (roofed corridors instead), no moving doors; only spawn-to-centre travel time is tested |
| Loadouts (5 slots), validation, progression 1-30, unlocks, profile export/reset | Done | Practice has all unlocks open per brief; XP persisted locally |
| UI: menu, loadout editor with exact stats, settings, remap, scoreboard, results, errors | Done | Matchmaking and lobby screens omitted (no online) |
| HUD (crosshair, hit markers, damage direction, minimap, kill feed, momentum) | Done | Minimap draws only legitimately known information |
| Audio | Partial | All sounds and music synthesized at runtime, HRTF, occlusion low-pass, reverb zones, voice cap. No announcer voice lines (tone stingers + text); not listened to on real hardware |
| Visuals: procedural art, shadows, post FX, first-person animation | Partial | Primitive-built art; CSM + ACES + bloom. Animation is procedural, not authored; no baked GI, no GPU particles, no LODs |
| Performance budgets (draw calls, 60 fps) | Not verified | Only software-rendered (SwiftShader) Chromium was available. Scene instrumentation reported about 1,200 draw calls per frame including 3 shadow cascades, which is likely above the 220 budget |
| Accessibility (colour-blind palettes, reduced motion, hold/toggle, remap, sound cues) | Done | |
| Pointer Lock loss / tab hide / context loss recovery | Partial | Pause overlay and re-lock flow implemented; real Pointer Lock could not be exercised headless (automation hook used) |

## Architecture
- **Stack**: TypeScript (strict), Vite, Babylon.js (WebGL 2), React shell, DOM HUD, Web Audio, Vitest. No backend.
- `src/shared/content`: weapons, attachments, perks, equipment, support, loadout validation, progression (data-driven).
- `src/shared/map/k17.ts`: grid-authored, x-mirrored map producing the AABB collision set, spawns and route goals.
- `src/shared/sim`: `world.ts` (movement, weapons, hitscan with penetration, damage, kills, Momentum, match rules), `collision.ts`, `equipment.ts`, `support.ts`, `spawn.ts`.
- `src/shared/bots`: nav graph/A* and the bot brain (emits the same `InputCmd` a human would).
- `src/client/renderer`: map meshing, procedural textures, instanced characters, viewmodel animation layers, pooled VFX.
- `src/client/runtime`: input (Pointer Lock, per-optic sensitivity), game session loop, settings, profile.
- `src/client/ui`: React menus/panels, DOM HUD, minimap. `src/client/audio`: synthesized audio engine.

## Verification
Commands run from a clean state (`rm -rf node_modules dist`):
- `npm ci`: ok.
- `npm test`: **5 files, 58 tests passed, 0 failed** (map 9, sim 21, rules 17, bots 6, client 5).
- `npm run build` (tsc + vite): ok. App JS 381 kB, Babylon chunk 5.09 MB (1.12 MB gzip). `dist/index.html` uses relative `./assets/...` URLs.
- Served `dist/` from `/play/claude-sonnet-5.5-high/breachline/` with a static server; the page loaded and a match ran (screenshots in `oneshot/`, taken from this build).
- Headless Chromium (SwiftShader) driven by `tools/play.mjs` against the dev build: menu, Practice, loadout/profile/settings/key-binding screens, warm-up, live combat, ADS and fire, scoreboard, death recap, equipment and Momentum HUD, match end to results to Play Again, and a roughly 270 s (10x speed) soak routing every event through renderer, HUD and audio with no console errors.
- `tools/botstats.ts`: a bot-only normal 6v6 reaches 75 points in about 230 s with a sensible K/D spread.

**Not verified**: real GPU frame rate, real Pointer Lock behaviour, audio quality by ear, Firefox/Safari, 1920x1080 layout (checked at 1280x720 only), anything online.

## Assumptions and deviations
- Practice-only slice: no online, matchmaking, netcode, lag compensation, reconnect.
- Player body is a vertical box; players do not collide with each other.
- Profile uses localStorage rather than IndexedDB; the "server" is the in-process sim.
- Map is symmetric by mirroring (fair spawns); the wings differ only in dressing.
- Level unlock table exists, but Practice opens everything.
- Viewmodel FOV is emulated with a non-uniform scale on a separate rendering group (single camera).
- Ping key places a visual marker only. Interact and fire-mode keys are bound but unused (hidden in the UI).
- Automation hooks (`window.__breachline`, `forceRun`, `timeScale`) are present in the build.

## Known issues and limitations
- Visuals are blocky primitives; viewmodel arms and weapons are crude and large; no LODs or baked lighting.
- Draw-call and triangle budgets are likely exceeded; no occlusion culling. The Low preset may be needed on weak GPUs.
- Bots can look repetitive, do not use mines or the catwalk, and sometimes clump.
- Support visuals (drone, pod, jet) are simple; the Interdiction hit area is approximate.
- Audio is synthesized and basic; no announcer.
- Dynamic resolution and quality presets are lightly tested.

## Self-assessment
- **Playability: 7/10**: complete, tested loop with readable combat, bots, equipment and support, but unverified on real hardware.
- **Visual polish: 5/10**: consistent, readable look and a decent HUD, but primitive geometry and crude viewmodels.
- **Brief fidelity: 4/10**: strong on gameplay systems and architecture direction, but online multiplayer, prediction, lag compensation and performance budgets are missing.
