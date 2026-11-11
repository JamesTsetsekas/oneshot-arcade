# Summary

Crownfall is a playable offline 3v3 lane siege on an original procedural floating island. The slice includes hero selection, five allied/enemy bots, two wave lanes, combat abilities, gold and levels, a six-item fountain shop, recall, wards, a neutral siege boss, gated base destruction, results and local history. It prioritizes a complete short match and readable presentation over the brief's production multiplayer breadth.

# Brief coverage

| System / acceptance criterion | Status | Delivered / limitation |
|---|---|---|
| Launch → draft → battle → victory/defeat → results → requeue | Done | Local match, six selectable profiles, results, local history, return to draft. |
| Tutorial teaches all mechanics and leads to Practice | Partial | Guided checklist during a full bot match; no separate scripted tutorial or sandbox controls. |
| Six clients draft and reach authoritative victory | Not started | Single local human plus five bots; no rooms, network or server. |
| Six fully original passive/Q/W/E/R kits | Partial | Six profiles, portraits, stats, named abilities and reduced spell behavior; shared primitives, no passives or full authored kits. |
| Camera and controls | Partial | Ground/enemy clicks, aimed abilities, zoom, arrow pan, approximate hero centering, minimap movement, stop, pause, scoreboard. No remapping or cast modes. |
| Pure fixed-step simulation independent of renderer | Done | Data-oriented entity records, 30 Hz step, validated gameplay methods, no render state required. Local authority only. |
| Combat, gold, last hits, XP, resource, deaths, respawn | Partial | Implemented basic combat/economy; no full defense formulas, assists, bounties, windups or CC taxonomy. |
| Minion aggro, lane navigation and wave pressure | Partial | Four guards per team/lane every 14 seconds, nearest valid targets, waypoints, increasing strength. No bolt/siege classes or advanced collision. |
| Tower/Seal/Core/Engine prerequisite fixtures | Done | Lane tower protects its Seal; any fallen Seal unlocks both Cores; both Cores must fall before Engine; victory freezes simulation. |
| Complete structure roster, targeting ramp, Vanguard and Seal respawn | Partial | One lane tower per lane, permanent Seals, two Cores per base; wave HP/damage empowered after Seal loss; basic minion-first tower targeting and backdoor reduction. |
| Jungle, fog, brush, wards, hidden transform security | Partial | Proximity/ward-based enemy visibility; two 60-second wards. No brush, camps, fog overlay or secure serialization; all state exists locally. |
| Twin Catalysts / Colossus spawn, leash, team buffs | Partial | Central Colossus available immediately, attacks nearby heroes, respawns, grants team gold and 70-second minion damage buff. No Catalysts or leash/reset. |
| Bots demonstrate full tactical state machine | Partial | Bots follow lanes, acquire legal visible targets, cast Q/R, retreat at low HP, heal, push and finish. No buying, ganks, warding or coordinated objectives. |
| 32-item recipes, undo/sell and build recommendations | Partial | Six distinct stat items, purchase range/funds/capacity checks, persistent six-slot inventory during match. No recipes, actives, undo or selling. |
| Level/skill ranks, Talents, mastery | Partial | Levels 1–12, automatic stat growth and R at level 6; no skill allocation, Talents or mastery. |
| Networking impairment and reconnect | Not started | No networking; these criteria do not apply to the local simulation. |
| Match history and progression | Partial | Ten most recent results in localStorage with safe failure handling; no accounts or cosmetic progression. |
| Three.js map, PBR/unlit hybrid, assets and VFX | Partial | Original low-poly geometry, batched static map, stylized lighting, team rings, health bars, spell lines/rings, CSS portraits. No rigs, authored clips or compressed asset pipeline. |
| Audio, captions and accessibility | Partial | Optional synthesized action cues, visual event chronicle, textual controls/tooltips and keyboard shortcuts. No voice, music, full remapping or colorblind settings. |
| Performance budget at 1080p / scaling / browser matrix | Not started | No representative hardware benchmark or browser matrix; Chromium production smoke check only. |
| Original IP and asset provenance | Done | All visuals and sounds procedurally or manually authored; see ASSETS.md. |
| Full requested tooling/artifact suite | Partial | Static build, source, setup guide, rules tests, browser smoke script and screenshots. No server build, replay inspector, full recording or load lab. |

# Architecture

The implementation uses strict TypeScript, Three.js, React and Vite with `base: './'`. React updates its HUD readout at approximately 10 Hz while the animation loop accumulates fixed 30 Hz simulation steps and renders separately. No external service, asset host or API is required at runtime.

- `src/content.ts`: hero profiles, kit descriptions, item stats, cooldowns and deterministic lane waypoints.
- `src/simulation.ts`: entities, fixed-step world, commands, casts, delayed effects, bots, visibility, minion waves, economy, shop, recall, death, objectives and victory. Gameplay mutations occur here; rendering only reads state.
- `src/renderer.ts`: procedural floating island and characters, material batching, isometric orthographic camera, ground picking, world health bars and presentation effects.
- `src/main.tsx`: draft, controls, battle HUD, minimap, shop, scoreboard, pause, results, local history and synthesized sound.
- `tests/simulation.test.ts`: deterministic fixtures and complete bot battle.
- `tools/serve.mjs`: static production server mounted under `/play/crownfall/` on port 5240.
- `tools/capture.mjs`: production browser smoke workflow and genuine screenshots.

The two lanes are mirrored in route length and structure placement; this is an explicit reduction of the brief's asymmetrical map. Navigation is open-ground click movement and lane waypoints, not a navmesh. Decorative foliage does not claim collision. Shared definitions and a render-independent simulation leave a useful seam for a future server, but no networking security is claimed.

# Verification

Initial `npm install` succeeded with zero reported vulnerabilities. Initial `npm test` passed 20 tests with zero failures (including a complete base victory); the bot-control condition was then improved and passed again in the clean run. TypeScript passed; the first Vite build exposed an unnecessary CSS import, which was removed; the following `npm run build` succeeded with 34 modules and a static `dist/index.html`.

Final verification, after deleting both dependency and build directories:

- `node tools/clean.mjs`: removed only workspace `node_modules` and `dist`, with explicit root/path checks.
- `npm ci`: exit 0, 84 packages installed, zero reported vulnerabilities.
- `npm test`: exit 0, **20 passed, 0 failed**, 71.426 seconds; includes six active bots reaching a legal base victory.
- `npm run build`: exit 0, strict TypeScript check and Vite static build, 34 modules; approximately 0.45 kB HTML, 18.02 kB CSS and 782.10 kB JS (217.34 kB gzipped JS). Vite warns about a bundle larger than 500 kB. A renderer-only terrain elevation correction was subsequently rebuilt and recaptured.
- `node tools/serve.mjs`: production files served under `http://127.0.0.1:5240/play/crownfall/`. Server stopped after verification.
- `$env:PLAYWRIGHT_BROWSERS_PATH=Join-Path (Get-Location) '.browser'; node tools/capture.mjs`: exit 0; real headless Chromium at **1440 × 900**, 0 page/console errors. Initial fountain purchase and owned inventory verified: **true**; pause/resume verified: **true**; safe recall followed by in-range shop verified: **true**. Movement, Q cast and ward placement were exercised through the UI.
- Screenshots: `oneshot/screenshot.png` (active lane gameplay), `draft.png`, `scoreboard.png`, `shop.png`; machine-readable smoke results in `oneshot/browser-check.json`.
- Browser setup: the first full Chromium installation was interrupted after slow extraction; a direct curl fallback failed TLS transfer. `npx playwright install chromium --only-shell` with a workspace-local browser path succeeded. The runtime was moved into ignored `node_modules/.cache/crownfall-browser` after capture, keeping the source tree small.

The browser smoke check is a short interaction sequence, not a full human match. The simulation fixtures verify the complete base victory separately.

Not verified: human end-to-end victory, real GPU frame-time budgets, 1080p late-game performance, Firefox/Edge/Safari, 125/150% UI scaling, multiplayer or network impairment. The full-match automated rule test is not a video recording or a human playtest.

# Assumptions and deviations

- Offline single-player practice is the deliverable. No account, queue, backend, multiplayer service or telemetry is present.
- Match cadence is accelerated: 14-second waves, 4-second recall, short respawns, smaller map and fewer defenses. The target is a few minutes, not 14–22 minutes; exact duration depends on participation.
- Six profiles use deliberately reduced shared spell primitives. The draft's models are CSS art; the in-world models are procedural meshes. Names and gameplay come from the provided brief.
- The camera is orthographic for whole-map legibility. Movement is clamped to a rectangular play region; props and cliff edges are not navigation blockers.
- Basic attacks fire automatically at nearby visible targets; explicitly selecting an enemy pursues it. Ability progression is automatic except R's level gate.
- The guided match is optional and does not block normal play. Sound is optional and initially off.
- Match history is local to the browser and gracefully degrades when storage is unavailable.

# Known issues and limitations

1. Local simulation only; the production network/server architecture and most of the brief's breadth are absent.
2. Simplified kits and AI: shared abilities, no passives, terrain collision, skill ranks, full shop, advanced tactics or coordinated objective behavior.
3. Limited hardware/browser coverage and performance optimization; effect meshes allocate during rendering, bodies can overlap, and the whole map exposes structure state even when heroes are hidden.

There is no adaptive music or voice, no replay/recording, no true brush, no surrender and no settings persistence. The game favors readable lane pressure over mechanical depth. The minion-last-hit economy rewards the local hero, while nearby allied heroes receive XP; there are no assists or contribution windows. The HUD's hero-centering shortcut moves the camera partway toward the hero to preserve battlefield context.

# Self-assessment

- **Playability: 7/10.** The complete local loop and structure rules exist, but AI and combat have limited tactical depth.
- **Visual polish: 7/10.** The original island, restrained brass-and-teal UI and procedural silhouettes make a cohesive slice, without production animation or hero art.
- **Brief fidelity: 4/10.** The recognizable lane/objective progression and requested client stack are present, but the multiplayer MVP and much of its content are not.
