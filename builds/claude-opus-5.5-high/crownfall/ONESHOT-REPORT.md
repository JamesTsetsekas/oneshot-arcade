# Crownfall — Oneshot Report (claude-opus-5.5-high)

## Summary

I built Crownfall, an original browser 3v3 lane-and-objective MOBA vertical slice: menu → tutorial/unranked/practice → simultaneous draft of six original heroes with Talents → a full match on The Broken Diadem against server-side bots → results, progression and requeue. The match runs on an authoritative 30 Hz simulation inside a Web Worker "room" that receives only sequenced intents and streams team-fog-filtered snapshots at 15 Hz to a Three.js/WebGL2 renderer with a React shell. Everything (models, map, VFX, icons, music, SFX) is procedural and original; there is no networked multiplayer.

## Brief coverage

| System / acceptance criterion | Status | Note |
|---|---|---|
| Launch → tutorial/queue → draft → load → match → results → progression → requeue | Done | Full loop verified in a headless browser (see Verification). |
| Tutorial (move, attack, cast, last hit, recall, shop, ward, tower, objective, victory) | Done | 11 guided steps driven by real game events; enemy structures at 30% HP. Not played through to the final step in automation. |
| Unranked 3v3 with named-bot backfill + ready check | Partial | Local matchmaker only; no humans, regions or rating. |
| Practice (bots config, pause, time scale, gold/level, ranges) | Done | Server validates practice ops by mode. |
| Six heroes: passive + Q/W/E/R, data tooltips, bot use, 2 builds | Done | All 30 abilities implemented server-side and unit-tested; animations are procedural (no rigs/skins). |
| Hero VFX/SFX/animations per ability | Partial | Every ability has distinct VFX/telegraph and a cast sound; SFX are generic per category, no voice lines. |
| 32 items, shallow recipes, buy/sell 65%/undo rules, actives, recommended builds by enemy profile | Done | Ctrl-compare in the shop is not implemented. |
| 6 universal Talents, pick two | Done | |
| Map: two curving lanes, jungle quadrants, 4 small + 2 buff camps per side, river, pit with 2 entrances, Catalyst pockets | Done | Pit "vision ledge" not built. Route-time targets partly met (see deviations). |
| Fairness checks | Partial | 180° rotational symmetry + automated route-time equality test. |
| Minion waves (3 Guard/3 Bolt, Siege every 3rd, Vanguards) and aggro/call-for-help/leash | Done | |
| Towers: minion-first targeting, hero-aggression rule, visible ramp | Done | Tower→hero target line drawn, thicker as ramp grows. |
| Structure chain: Seal invulnerable until Guard, Seal respawns once after 4 min, Core/Engine vulnerability, backdoor mitigation, single victory | Done | Unit-tested. |
| Last hits, shared XP with penalty, passive gold, kill/assist gold, bounties, respawn 7–34 s, recall 7 s, fountain | Done | Unit-tested. |
| Fog of war, mistwood LOS, brush, wards (2 charges, 90 s, cap, true sight), 100 ms grace, server-side filtering | Done | Hidden enemies never enter snapshots (tested). |
| Twin Catalysts (3:30, 4 min respawn, predictable buffs) and Aether Colossus (9:00, 6 min, empowerment + fast recall), leash/reset, public timers | Done | Bots secure Catalysts; bots rarely take the Colossus in headless runs. |
| Bots: lane, last-hit, harass, ward, gank, jungle, buy (build graph w/ branches), recall, contest, team fight, retreat, defend, push, finish; difficulty without stat cheats | Done | Behaviour is functional but simple; see known issues. |
| Camera (52° pitch, 45° yaw, zoom 28–42, follow, F1, Y lock with look-ahead, edge/middle-drag/arrow pan) | Done | WASD panning replaced by arrows (key conflict in brief). |
| Controls incl. quick-cast variants and full key remapping | Done | |
| HUD, shop, scoreboard, death recap, pings, chat, advanced stats, expanded map | Done | Report button omitted (no backend). |
| Accessibility: UI scale 100/125/150, colorblind palette, captions, low effects keep telegraphs, shake toggle | Partial | Colorblind toggles live for bars/minimap; structure crystals keep their original color until next match. |
| Audio: adaptive music layers, spatialized cues, priority ult warnings, voice cap | Partial | Synthesized; no announcer voice (text banners + captions instead). |
| Networking: authoritative room, sequenced commands, dedupe, rate limit, interest/fog filtering, interpolation | Partial | In-browser Worker room; full snapshots (not deltas); no WebSocket server, reconnect, AFK bot takeover or anti-cheat analytics. |
| Reconnect / disconnect bot takeover | Not started | No network = nothing to reconnect. |
| Persistent profile, mastery, match history, corrupted-storage recovery | Done | localStorage with try/catch and reset notice. |
| Explicit error states (WebGL2 missing, worker error, version mismatch, context loss) | Done | Surrender/AFK/server pause states not applicable offline. |
| Performance budget | Partial | ~45–85 draw calls, ~80k triangles, sim avg 1.5–3.5 ms/tick headless. No 1080p GPU benchmark on target hardware. |
| Tools: headless match, screenshot/playtest harness | Partial | No ability editor, replay inspector, nav/fog viewer or net lab. |
| No proprietary IP | Done | All names, kits, items and the map are original. |

## Architecture

- **Stack**: TypeScript (strict), Vite 6, Three.js 0.170 (WebGLRenderer), React 18 for the shell/HUD, Vitest. Chosen to match the brief's technical direction and to keep the build fully static.
- `src/shared/` (shared-content): map definition and nav/fog grids (`map.ts`), hero/ability data with templated tooltips (`heroes.ts`, `types.ts`), items/talents (`items.ts`), rule formulas and balance constants (`rules.ts`).
- `src/sim/` (server-simulation): `match.ts` (fixed-tick loop, command validation, orders, attacks, projectiles, zones, economy, deaths, objectives, victory), `combat.ts` (stats, mitigation, shields, CC), `abilities.ts` (six kits as typed code modules with validate/start/release/recast hooks), `units.ts` (minion/tower/monster AI), `fog.ts`, `shop.ts`, `talents.ts`, `nav.ts` (A* on a 0.5 m clearance grid with string pulling, static collision, wall raycasts), `snapshot.ts` (team-filtered serialization).
- `src/ai/` (server-ai): `bot.ts` (team planner blackboard + per-hero state machine), `botkits.ts` (kit-authored utility-scored casting).
- `src/protocol/`: message schemas and transport (Worker, with an in-thread fallback). `src/server/`: `MatchHost` room + worker entry.
- `src/client/runtime/`: session (sequencing, snapshot buffer, interpolation), batched HUD store (≤10 Hz React updates), controller (input, camera, presentation hooks, tutorial).
- `src/client/render/`: renderer, procedural models, map view, fog shader patch, VFX pools, 2D overlay, minimap.
- `src/client/ui/`: React screens. `src/audio/`: Web Audio mixer and adaptive music. `src/services/`: matchmaker and local profile.

## Verification

All commands run on Windows 11, Node 22.12.0, npm 11.4.2.

From a clean state (`rm -rf node_modules dist`):

| Command | Result |
|---|---|
| `npm ci` | Installed from `package-lock.json`, no errors. |
| `npx tsc --noEmit` | 0 errors (strict). |
| `npm test` | **7 files, 65 tests passed, 0 failed** (99.9 s). Includes a deterministic-seed check and a full six-bot match: seed 7 ended in a Dusk victory at 27.1 min, 11 kills, 286 CS, avg tick 1.63 ms, worst 63.7 ms, with every bot state observed. |
| `npm run build` | `tsc --noEmit && vite build` succeeded; `dist/index.html` references `./assets/...` only (relative). Main chunk 944 kB (273 kB gzip), worker 150 kB. |
| `node tools/screenshot.mjs menu draft playtest demo:11` | Served `dist/` from `/play/claude-opus-5.5-high/crownfall/` with a local static server and drove headless Chrome (Edge launch failed once in that run, Chrome was used). Page loaded, worker transport active, **no console errors or warnings**. |

Browser checks performed through real input (playwright-core, 1280×720):
- Tutorial: right-click moved the hero ~10 m; Ctrl+Q learned Q; holding/releasing Q cast it (cooldown started); key 4 placed a ward (charges 2→1); B recalled to the fountain after 7 s; P opened the shop; searching and clicking Buy purchased Traveler's Wraps (gold 500→200); Tab showed the scoreboard.
- `?demo=11`: an 11-minute fast-forwarded bot match rendered at ~144 fps headless, 49 draw calls, ~79k triangles (`oneshot/screenshot.png`).
- `?demo=40` (earlier build in this session): a full bot match ended, the Results screen showed timeline/gold graph/stats, and Match History recorded it (`oneshot/results.png`, `oneshot/history.png`). That build's balance was older; that match took 44 min.
- Headless balance runs (`tools/timeline-match.ts`, final balance): seeds 7/13/21/5 ended at 27.1 / 20.2 / 19.4 / 17.6 min. Bots secured Catalysts 3–4 times per match; **no bot took the Aether Colossus in these runs**.

What I could **not** verify: performance on a real 1080p GPU (headless Edge with ANGLE/D3D11 reported ~140 fps at 1280×720 but that is not a benchmark), Firefox/Safari, behaviour under real network latency (only a simulated lossy channel in tests), a full human playthrough of a complete unranked match, and the tutorial's final steps by a human.

## Assumptions and deviations

- **No real server.** The authoritative room is a Web Worker running the same `MatchHost` a Node WebSocket room would run; single-player needs no backend. Snapshots are full team-filtered state at 15 Hz rather than deltas.
- **Waves spawn in both lanes every 30 s** (read "alternating toward both lanes" as both lanes each interval).
- **Camera pan on arrow keys** (WASD collides with W/E/S/D/A commands); ward trinket shares key 4 with item slot 4 when that slot has no active.
- **Tower order**: inner/guard towers are invulnerable until the previous tower in the lane falls (in addition to the brief's Seal/Core/Engine rules).
- **Route timing**: fountain→outer tower is ~18–21 s at 3.6 m/s (in range). Lane-to-lane rotations through the center are longer than the brief's 8–16 s because the lanes bow far apart on a 150×115 map.
- **Wards** are revealed by enemy heroes within 5 m (proximity true sight) rather than by a separate sweeper item.
- **Talents** (Phase Step, Mend, Scorch Brand, Bulwark, Tailwind, Reaping Spark) are original but genre-familiar utility.
- **Tutorial** uses Suri Vale with no enemy heroes and fragile enemy structures so a full loop fits in a few minutes.
- **Animations** are procedural transforms on primitive-built heroes, not skinned glTF rigs; no LODs or KTX2 pipeline.

## Known issues and limitations

- Match length varies by seed (about 17–27 min in headless six-bot runs, one earlier-build browser match took 44 min); the Seal respawn and the long tower chain can stall bots.
- Bots almost never take the Aether Colossus and spend a lot of time rotating to objectives; team fights are small and kill counts are low (about 10–15 per match).
- No networked multiplayer, reconnect, AFK takeover or real matchmaking: the "server" is an in-page Worker. Snapshots are full state, not deltas.
- Heroes are built from primitives with procedural animation; no skins, LODs, voice lines or announcer audio.
- The minimap is north-up, while the camera is yawed 45°, so screen and minimap directions differ.
- Changing the colorblind palette mid-match does not recolor structure crystals until the next match.
- The ground texture is painted from 0.5 m nav cells (blurred), so forest edges are slightly soft.
- Large main JS chunk (944 kB) because the simulation is bundled for the in-thread fallback as well as the worker.
- The `?demo` URL fast-forward runs synchronously in the worker, so long warm-ups take a while before the first frame.

## Self-assessment

- **Playability: 6/10** — The full loop works and matches end in victory, but bots are predictable, fights are small, and match length varies widely by seed.
- **Visual polish: 6/10** — Cohesive sky-island look with readable telegraphs, fog and HUD, but heroes are primitive-built and animation is basic.
- **Brief fidelity: 5/10** — Most gameplay rules and content counts are implemented and tested, but networking, reconnect, services, tooling and asset-pipeline requirements are absent or simulated locally.
