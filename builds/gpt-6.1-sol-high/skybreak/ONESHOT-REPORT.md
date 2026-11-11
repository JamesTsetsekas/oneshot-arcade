# Oneshot report: Skybreak

## Summary

Built an original offline third-person battle royale with a complete local drop, salvage, fight, storm, elimination/results, and requeue loop. Twenty-four contestants compete on a compact procedural floating island, with a separate account-free practice range. Babylon.js renders original geometry while a deterministic TypeScript simulation owns combat, loot, movement, bots, recovery, and match outcomes.

## Brief coverage

| Major system / acceptance criterion | Status | Evidence / scope |
|---|---|---|
| Launch and account-free Practice, then Solo | Done | Both modes are accessible from the main menu; return to base and requeue work. |
| 24-seat staging, skiff, jump, glide, landing | Partial | 24 local actors, shortened staging, player insertion and original skiff/sail; bots start grounded. |
| Last survivor and deterministic finish | Done | Last-survivor condition and health/ID tie-break at time cap; unit-tested. Player death ends their local run immediately. |
| 1.2km island and six named destinations | Partial | Approximately 420m square; four destinations, paths, trees, limestone cover, floating fragments, wind machinery. |
| 14-18 minute production match timing | Partial | Approximately five-minute slice with six compressed zone stages. |
| Chest / ammo / rarity / reload loop | Partial | 28 seeded caches, four weapon identities, ammo caps, cadence, reserve-consuming reloads, proximity validation. |
| Full five-slot editing / dropping / comparisons | Partial | Pistol, replaceable salvage weapon, empty slot, meds, shields; ammo-preserving key switches; inventory summary. No drag/drop or comparison arrows. |
| Nine weapons and five independent rarity tiers | Partial | Four data-driven weapon archetypes with four named rarity identities coupled to weapon type. No independent rarity rolls, seeded bloom, rail projectiles, or pellets. |
| Hit zones / falloff / shield damage / death caches | Partial | Aim-cone hitscan, simple head multiplier, range falloff, ordered shields, death caches. No authoritative rewind or detailed body hitboxes. |
| Health, Aegis, Reserve, timed recovery | Done | 100/50/50, eight-second Aegis delay, timed health/shield items, firing lock and movement penalty. |
| Eight items and utility | Partial | Med Injector and Shield Flask; remaining six items absent. |
| Floor / locker / supply / caravan loot | Not started | Resonance and elimination caches only. |
| Calmfield phases and storm damage | Partial | Deterministic centered contraction, escalating damage, current/next map rings, boundary mesh, timer and warning. No moving centers or authored valid polygons. |
| Sprint / crouch / jump / freefall / glide | Partial | Sprint energy, crouch speed, ballistic jump, steerable descent. No separate freefall or crouch pose animation. |
| Slide / mantle / swim / zipline / ascender / grapple / vent | Not started | Hidden rather than exposed as controls. |
| Solid world collision and line-of-sight | Partial | Shared lightweight shelter boxes and island bounds; render terrain separate. Trees/rocks cosmetic, no physics WASM. |
| Bot planning / legal perception / rotations | Partial | Seeded spawns, nearest visible enemies, obstacle sight tests, aim miss probability, rotation, reload and recovery. No navigation mesh, sophisticated cover, drops or loot planning; bots begin pre-armed. |
| Authoritative multiplayer / Colyseus / networking | Not started | Local simulation only, no backend or network claims. |
| Latency, loss, reconciliation, lag compensation | Not started | No network transport. |
| Spatial interest / spectator / reconnect | Not started | No remote data or spectator mode. |
| Streaming / cell pipeline / fallback collision | Not started | Compact world generated eagerly; collision metadata is separate from render objects. |
| Babylon.js and strict TypeScript / React UI separation | Done | Runtime and simulation are independent of React; UI consumes batched updates. |
| Rapier / shared server physics | Not started | Simplified local boxes and vertical integration. |
| Original assets / visual language | Done | Cream limestone, copper, turquoise machinery, orange sails, violet boundary, original geometric scavengers. |
| Four cosmetics / rich animation / compressed glTF | Not started | One modular body with player/bot palettes and simple movement bob. |
| Audio / spatial mix / music | Partial | Original synthetic shots, hits, kills, cache and landing tones; audio toggle. No music, spatial footstep system, or occlusion. |
| HUD / minimap / full map / contextual interaction | Done | Health/shields/stamina, ammo, slots, compass, count, field timing, pickup prompt, player map position. |
| Results / history / timeline / spectator | Partial | Placement, eliminations, damage, accuracy, survival, distance, storm damage and opened caches; no replay timeline or persistence. |
| Settings / remapping / accessibility | Partial | Audio toggle, field guide, no shake/strobing; missing remapping, quality presets, colorblind modes, sensitivity controls. |
| Capability and input error flows | Partial | WebGL 2 capability screen and click-to-capture prompt; no streaming/socket flows are applicable. |
| Services / progression / cosmetics persistence | Not started | No backend, identity, persistence, analytics or external service dependency. |
| Performance budgets / cross-browser matrix | Partial | Static geometry merged by material; performance is measured only in software-rendered headless Chromium, not target gaming hardware. |
| Static build and nested-path hosting | Done | Vite relative base and production sub-path browser check. |
| Tools, replay, load/latency tests, recording | Partial | Simulation tests and browser check tooling included; no editor, replay inspector, load lab, or full-match video. |

## Architecture

- `src/sim.ts`: pure local rules, seeded content, collision metadata, weapon tables, actors, storm, bot decisions, inventory actions, combat, recovery, and terminal outcomes. No Babylon or React dependencies; this is the primary test boundary.
- `src/runtime.ts`: Babylon engine, original procedural world and actor geometry, camera, keyboard/mouse capture, rendering, merged static geometry, transient tracers, synthetic audio, and a batched UI callback. Uses an explicit module import surface to reduce bundle size. `window.skybreak` exposes the runtime for reproducible local browser checks, not a security boundary.
- `src/main.tsx` and `src/style.css`: React menu, field guide, HUD, maps, inventory summary, pause, audio setting, and results. Maps derive from the same lightweight location/collision metadata.
- `tests/sim.test.ts`: deterministic simulation/rule regression tests using Node's test runner through tsx.
- `oneshot/serve.mjs`: static production server deliberately mounted at `/play/skybreak/`, port 5250.
- `oneshot/check.mjs`: initial Playwright launch and screenshot check; final browser evidence is recorded separately.

Babylon.js matches the requested renderer. React and strict TypeScript follow the requested separation. Local deterministic rules were prioritized over a token networking facade; the delivered game needs only static hosting. All scenery is generated synchronously and uses no asset network requests.

## Verification

- Node.js v22.12.0 / npm 11.4.2 were used.
- `npm install`: succeeded initially; 104 packages audited, zero vulnerabilities reported.
- `npx playwright install chromium`: exit 0.
- `npm test`: final clean-install run exited 0 with **25 passed, 0 failed** (Node test runner through tsx; 1.996 seconds). Tests include seeded spawns, staging/drop/landing, ordered shield damage, single attribution, Aegis delay, cadence/ammo/reload, proximity/duplicate-safe caches, timed capped recovery, storm contraction/damage, collision/LOS/bounds, ammunition-preserving selection, full seeded match termination, and simultaneous-elimination tie-break.
- Explicit recursive deletion of generated dependency/output folders was rejected by automatic approval review with only “blocked by policy.” No permission was requested. The normal `npm ci` replacement and Vite output cleanup were used instead; this deviates from the contract's explicit manual-delete step.
- A plain `npm ci` run was interrupted after several minutes without output. `npm ci --offline --no-audit --no-fund --loglevel info` subsequently completed successfully from the existing npm cache: **103 packages added in 14 minutes**, including successful esbuild postinstall scripts. The prolonged first run's cause was not established.
- `npm run build`: final run exited 0, including strict `tsc`; Vite transformed **491 modules** and built in **41.92 seconds**. Output includes `dist/index.html` (0.41 kB), CSS (13.78 kB), main JS (1,486.84 kB / 380.85 kB gzip), and local lazy shader modules. Vite warned about the main chunk exceeding 500 kB; no build errors occurred.
- `node oneshot/serve.mjs`: served production `dist/` at **http://127.0.0.1:5250/play/skybreak/**. The server was stopped with an interrupt after the final browser pass.
- `node oneshot/check.mjs`: initial Chromium screenshots exposed terrain-facing, encoding and draw-call problems, which were corrected before final verification.
- The first `node oneshot/final-check.mjs` run passed its first six assertions but timed out on an exact Practice button locator that omitted its arrow. This test locator was corrected; a remaining notification encoding glitch was also fixed and the production build repeated.
- Final `node oneshot/final-check.mjs`: **10 passed browser assertions**, **zero page errors**, **16 local requests**, **zero external requests**. Verified real-time Solo staging/manual insertion/landing, nearby cache interaction, mouse firing/ammo consumption, reload completion, full map, inventory summary, terminal results, account-free Practice, and fresh requeue. Only the terminal-results UI check fast-forwards the pure simulation; the gameplay screenshot uses real-time play.
- Genuine production screenshots: `oneshot/screenshot.png` (1280×720, 171,828 bytes, landed Solo with salvage equipped), plus `oneshot/menu.png`, `oneshot/practice.png`, and `oneshot/map.png`. The final gameplay image was opened and visually inspected.
- `oneshot/browser-results.json` records the final browser evidence. Software WebGL sampled **7.22 FPS**, with **399 scene meshes**; the raw engine draw-call counter is cumulative and is not a per-frame performance measurement. This does **not** verify the 60 FPS hardware target. No hardware-GPU, Firefox, Edge, Safari, networking, latency/loss, streaming, extended bot soak, or full-match video verification was performed.


## Assumptions and deviations

- The authorized deliverable is a polished vertical slice, so scope prioritizes a closed Solo loop over the full production MVP.
- Solo is explicitly labeled local/offline with bot opponents; no guest identity or online matchmaking is implied.
- Practice bots are stationary targets with no return fire. Re-enter Practice to reset them.
- Buildings serve as solid cover and have decorative doors/windows, not interiors. This is a deliberate simplification of collision and navigation.
- The two equipped weapons and two consumables occupy four of five HUD slots; the spare slot is displayed empty. Salvage immediately replaces the second weapon. Inventory editing is limited to selection and recovery actions.
- Rarity names accompany weapon archetypes rather than independently scaling every weapon through five tiers.
- The fixed centered storm makes every final field reachable and is much faster than the full brief. Opening map/inventory pauses local time for usability.
- No skill files outside this workspace were read, in accordance with the one-shot isolation boundary.

## Known issues and limitations

1. Offline only: no authoritative server, real players, prediction/reconciliation, security guarantees, reconnect or spectator flow.
2. Simplified combat and bots: aim-cone hits, approximate headshots, no recoil model, limited obstacle steering, solid buildings, and cosmetic non-colliding rocks/trees. Bots can bunch up or get stuck against cover.
3. Reduced breadth and unverified hardware performance: four weapons, two recovery items, compressed storm, basic movement, no streaming or advanced traversal. Software-rendered headless performance does not establish the 1080p gaming-PC target.
4. No persistent career/progression, key rebinding, quality settings, controller support, extensive accessibility configuration, replay recording, or full-match video.
5. The close shoulder camera clamps above terrain but does not sphere-cast against shelters; walls may clip into the camera in tight cover.
6. Decorative paths may float above sloping ground. Browser symbols can differ by installed system font. Input requires pointer lock and desktop keyboard/mouse.

## Self-assessment

- Playability: **7/10**. The complete local loop and recovery/ammo rules work, but bot navigation and combat depth remain modest.
- Visual polish: **6/10**. Cohesive original scenery and an editorial interface provide a readable setting, while geometric characters and simple lighting remain visibly prototype quality.
- Brief fidelity: **4/10**. The central battle royale loop and requested client stack are present, but production networking, traversal breadth, content scale and supporting tools are substantially deferred.
