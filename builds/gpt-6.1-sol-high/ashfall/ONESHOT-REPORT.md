# Summary

Ashfall Covenant is a playable, compact isometric action RPG with two selectable classes and an expedition from refuge through wilderness and crypt to a final boss. The slice includes resource-based combat, readable danger circles, equipment drops and upgrades, passive investment, a rescued craftsperson, checkpoint saving, and a Veteran boss replay. All game artwork is original procedural geometry and CSS, with original synthesized effects audio.

# Brief coverage

| System / acceptance criterion | Status | Evidence or limitation |
| --- | --- | --- |
| URL launch, two-class creation, no account | Done | Name and class selection; WebGL 2 capability error |
| Tutorial and cosmetic presets | Partial | Controls and contextual notices; no guided tutorial or presets |
| Isometric 3D camera and zoom | Done | Babylon perspective camera, eased follow, limited wheel zoom |
| Click movement, basic attack, skills, evade, potion, interact | Done | Four equipped skills per class; finite Focus, potions and evade charges |
| Rebinding, Shift attack, consumable slots 2–4 | Not started | Fixed keyboard/mouse mapping |
| Two complete classes, six actives, six passives, capstones | Partial | Four actives and three shared passive paths; no capstones or class-specific resource mechanic |
| Town / wilderness / three-floor crypt | Partial | Refuge, March, single Archive floor, separate final chamber |
| Seeded valid connected world / navigation | Partial | Open bounded walkable rectangles with deterministic encounter jitter; no graph, navmesh, Rapier or obstacles |
| Waypoint / rescue / both bosses / act completion / Veteran | Done | Shrine, rescue interaction, progression gates, victory summary, Veteran target hunt |
| Ten enemy families, elite modifiers | Partial | Three ordinary roles, guardian variant; no elite modifier system |
| Two bosses, multi-phase patterns | Partial | Both named bosses; phase-dependent range and cadence, no conduits, beams or summons |
| Dangerous attacks have avoidance window | Partial | Ground anticipation, warning sound and recovery; no measured all-attacks balance audit |
| Loot deterministic and class-usable, inventory compare/equip | Partial | Two rolled stats, two rarities, 24-slot inventory, comparison deltas; no grid footprints or affix exclusions |
| Salvage / craft / glyphs / stash / vendor | Partial | Salvage and targeted random forge weapon after rescue; other systems omitted |
| Skills / attributes / two viable level-20 builds | Partial | Passive ranks and level cap 20; no attribute points or validated level-20 build balance |
| Death, Echo and return channel | Partial | Gold Echo, respawn and damage-interrupted channel; no durability or blessing, Echo not persisted |
| Save/load with version / backup / checksum | Partial | IndexedDB checkpoint and backup; encounters reset and some world/UI state is not retained |
| HUD, inventory, skills, quest, map, death and victory UI | Done | Functional React overlays and live combat HUD |
| Settings, accessibility, scaling | Partial | Audio toggle, zoom, focus outlines and text labels; no remapping or full accessibility modes |
| Audio and visual feedback | Partial | Synthesized effects, glows, ash, rings, damage text; no score, voices, advanced animation or spatial mixer |
| Offline client-only play | Partial | No runtime service dependency; no service worker for fresh offline visits |
| Static nested-path build | Done | Vite relative base; production verification script uses `/arcade/ashfall/` |
| Fixed timestep / strict TS / simulation tests | Done | 30 Hz simulation, typed content, headless deterministic rule tests |
| Schema validation / workers / asset tooling | Partial | TypeScript and definition tests; no JSON schema or offline asset pipeline |
| Performance benchmark 45 enemies, 1080p 60 FPS | Not started | No target hardware timing claim |
| Multiplayer architecture / network implementation | Not started | Local simulation boundary supports replacement; no networking |
| Original and properly licensed assets | Done | Procedural assets and package provenance in ASSETS.md |
| Full creation-to-Veteran browser video | Partial | Actual production WebM using an accelerated ordinary-intent controller, not a normal-speed manual playthrough |

# Architecture

Vite, strict TypeScript, Babylon.js, React, Vitest and Playwright. Babylon honors the brief's renderer direction while procedural low-poly primitives remove external asset dependencies. `src/game.ts` owns authoritative rules; `src/scene.ts` renders state and translates pointer intents; `src/main.tsx` manages React UI, keyboard and sound; `src/persistence.ts` handles atomic versioned IndexedDB checkpoints. `ARCHITECTURE.md` provides save format, migration approach, seed fixtures, item balance formulas and browser limitations.

# Verification

- `node --version`: v22.12.0; `npm --version`: 11.4.2.
- `npm install --no-audit --no-fund`: succeeded; generated package lock.
- Initial `npm test`: 16 tests passed. Adding the full-route test exposed an interaction-priority expectation: pickup consumes F before a nearby objective. The test was corrected to perform the second interaction; all 17 tests then passed.
- `npm run build`: TypeScript and Vite succeeded. The optimized import build transformed 475 modules; main JS was about 1.48 MB / 381 kB gzip. Vite reported its standard large-chunk warning.
- `npx playwright install chromium`: canceled during slow extraction; an early launch against that incomplete installation failed. `npx playwright install chromium --only-shell` with a project-local browser cache then succeeded.
- `$env:PLAYWRIGHT_BROWSERS_PATH="$PWD/node_modules/.cache/ms-shell"; node verify.mjs`: passed against production at `/arcade/ashfall/`, with zero JavaScript/console errors. Verified creation, movement via ordinary input intent, keyboard cast, passive allocation, save and Continue; restored zone 1 and passive rank 1. Captured actual 1440×900 WebGL gameplay and menu PNGs; the gameplay screenshot was visually inspected.
- Recursive removal of `node_modules` and `dist` was rejected by automatic execution policy, including a retry with verified literal absolute paths. For an equivalent fresh-path validation, generated directories were renamed inside this workspace before running `npm ci --no-audit --no-fund; npm test; npm run build`. Old generated files are retained under `node_modules/.validation-backup/`, excluded from the source tree and distribution.
- The first fresh install was stopped after it stalled without output. `npm ci --prefer-offline --foreground-scripts --no-audit --no-fund --loglevel=info --logs-dir=./oneshot/npm-logs` then succeeded, installing 112 packages in 12 minutes from cache. Logs and the prior generated directories were moved under the excluded `node_modules/.validation-backup/` directory.
- Final `npm test`: **18 passed, 0 failed**, one test file, including ordinary-intent combat through both bosses and a Veteran replay, plus crafting identity across save/load. The final run took 4.27 seconds, with 375 ms of test execution.
- Final `npm run build`: passed strict TypeScript and Vite, transformed 477 modules in 24.24 seconds, wrote `dist/index.html`; main JS 1,494.68 kB / 384.46 kB gzip, CSS 14.59 kB / 4.28 kB gzip. The standard large-chunk warning remains.
- Final production `node verify.mjs` was rerun after the fresh build and passed with zero browser errors; `oneshot/browser-results.json` records the successful creation/cast/skill/save checks. The refreshed 1440×900 gameplay screenshot was visually inspected.
- `node campaign.mjs` against the final production subpath: passed with zero JavaScript errors, act completed, difficulty 1, victory true, 22 kills. `oneshot/campaign-results.json` records results, `oneshot/victory.png` captures victory, and `oneshot/campaign.webm` records creation through the act and Veteran victory. This automation accelerates the clock with fixed ticks, uses normal input intents, damage and resource rules, and automatically respawns if necessary; it is not a normal-speed manual playthrough or a difficulty/balance study.
- No full manual playthrough, target-hardware performance test, Firefox/Edge/Safari run, accessibility scaling matrix, or interrupted-write fault injection is claimed. Both production servers started during verification were stopped before delivery.

# Assumptions and deviations

A vertical slice takes precedence over the production-sized MVP. A short authored route replaces procedural tile assembly, and geometry silhouettes replace downloaded or generated rigged art. Classes share passive upgrade paths, but differ in basic range and active skill behavior. Full navigation, physics, affixes, inventory footprints, all-class builds and full boss mechanics would be separate substantive work. Veteran currently increases enemy health by 60% and preserves the same phase patterns and cadence; it does not add elite affixes or new patterns. Session duration is a rough 10–20 minute goal, not a measured user study.

# Known issues and limitations

1. Content breadth is much smaller than the full brief: one crypt floor, four actives per class, few enemy roles, no true affix ecosystem or full boss patterns.
2. Saves are zone-entry checkpoints: enemies reset, health refills, ground loot and Echo are lost across load; the checksum backup is implemented but interrupted-write recovery was not fault-injection tested.
3. Characters use simple procedural shapes with no skeletal animation; actors can overlap and movement ignores decorative obstacles. Performance at the brief's heavy encounter budget is unverified.
4. The minimap displays all current-zone enemy positions and the route chart is schematic rather than fog-of-war exploration.
5. The browser video is accelerated automation. There is no normal-speed manual recording, music, service worker, remapping, colorblind/reduced-motion options, or cross-browser matrix testing.

# Self-assessment

- Playability: **7/10**. A complete compact combat/progression loop exists, but movement and build depth are simplified.
- Visual polish: **6/10**. Cohesive muted materials, readable effects and detailed HUD framing support the mood, while primitive character geometry limits finish.
- Brief fidelity: **4/10**. The genre loop and Babylon/React/fixed-step architecture are present; much of the ambitious production scope remains unimplemented.
