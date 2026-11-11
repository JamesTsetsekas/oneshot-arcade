# ONESHOT REPORT — Crownfall (claude-fable-5.2-high)

## Summary

I built a playable single-player vertical slice of Crownfall: a full 3v3 match on The Broken Diadem
(you plus two allied bots against three bots) from menu and hero draft through laning, jungle,
objectives and base destruction to a results screen, with all six heroes, 32 items, fog of war and
the complete structure/victory rules implemented in a deterministic 30 Hz simulation. The simulation
is authoritative and isolated in a Web Worker behind a sequenced-command / team-filtered-snapshot
protocol, covered by 83 headless tests, and rendered with Three.js using only procedural, original
art and synthesised audio. There is no real networking, matchmaking or multiplayer — that whole
layer of the brief is designed-for but not built.

## Brief coverage

| System / acceptance criterion | Status | Note |
| --- | --- | --- |
| Launches from a URL as a static site, any sub-path | Done | `base: './'`; verified served from `/play/claude-fable-5.2-high/crownfall/`. |
| Complete loop: menu → draft → load → match → victory → results → requeue | Done | Verified end-to-end in a real browser (two full matches, one Defeat, one Victory). |
| Queue / matchmaking / ready check | Not started | "Play" seats you and five named bots instantly. |
| The Broken Diadem (~150×115 m, two lanes, jungle, river, pit, ledge, brush) | Done | Lanes differ from each other; teams are mirrored for fairness. Lane-to-lane via centre is ~20 s, slower than the brief's 8–11 s. |
| Six heroes: passive + Q/W/E/R behaviour, legal targeting, tooltips from data | Done | All 24 abilities + 6 passives in the sim with tests. Simplifications listed below. |
| Hero models, animation, VFX, SFX | Partial | Original but primitive-built models with procedural animation; shared VFX vocabulary; generic synthesised SFX, no voice lines. |
| Two viable build paths per hero, bot use of kits | Done | Two explained paths + situational defence pick per hero; bots use every kit (Vey's decoy only when fleeing). |
| Six universal Talents, pick two | Done | Skyhop, Mend, Bulwark, Surge, Smolder, Sunder. |
| 32 items (6/10/12/2/2), recipes, buy / undo / sell, shop UI | Done | All listed unique effects implemented; search, filters, recipe tree, recommendations. "Ctrl compares item" not built. |
| Stat / damage model (3 damage types, armor/ward formula, penetration, crit, shields) | Done | Formula incl. mirrored negative defence is unit-tested. |
| Basic attacks (windup / release / backswing, missiles, attack-move, hold, stop) | Done | Moving before release cancels and refunds; after release only the backswing. |
| Crowd control tags | Partial | Stun, root, slow (strongest-only), silence, airborne implemented with labels. Disarm, blind-as-CC, cripple, suppression are not. |
| Movement / pathfinding | Partial | A* on a nav grid + string pulling, endpoint snapping, wall sliding, soft unit separation, stuck replanning. Enemy heroes do not hard-block. |
| Minion waves, aggro, last hits, shared XP, passive gold | Done | 30 s cadence alternating lanes, Siege every third wave; deterministic fixtures. |
| Towers: priority, hero aggro, damage ramp, backdoor mitigation, visible targeting | Done | Tested; red dashed target line, range ring and "tower is targeting you" caption. |
| Seals / Vanguards / Seal respawn once / Core Towers / Crown Engine / victory fires once | Done | Ordered vulnerability and single victory are tested. |
| Jungle: 4 small + 2 buff camps per side, leash, reset, buffs | Done | Four creature families (brief asks for six). |
| Twin Catalysts (3:30, 4 min) and Aether Colossus (9:00, 6 min) with team buffs and timers | Done | Tested at brief timings in Standard pace; public HP/timers in the top bar. |
| Fog of war, brush, wards, no hidden transforms sent | Done | Server-side LOS + brush + true sight + 100 ms grace; snapshot filter tested, including a JSON scan. |
| Death, respawn scaling (7–34 s), bounties, assists, death recap | Done | Recap shows the last 8 s grouped by source. No "crowd control chain" view. |
| Recall (7 s, interrupt rules), fountain heal, fountain-only shop | Done | |
| Bots: lane, last-hit, trade, ward, gank, jungle, buy, recall, contest, fight, retreat, defend, push, finish | Partial | All states exist and bots finish matches without hidden info or stat cheats (tested). Coordination is shallow, they are fairly passive, and kill counts are low. |
| Authoritative 30 Hz server | Partial | Authoritative, deterministic, validated commands, rate limit — but hosted in a Web Worker in the same page. No Node server, rooms or WebSockets. |
| 10–20 Hz interest-filtered deltas, prediction, reconciliation | Partial | Team-filtered full snapshots every tick; client interpolates. No delta compression, interest radius, or movement prediction (not needed in-page). |
| Six human clients, reconnect, AFK, 120 ms / jitter / loss behaviour | Not started | Single human seat only. |
| Camera: 52° pitch, 45° yaw, height 34, zoom 28–42, edge / middle-drag pan, lock with look-ahead, Space, F1 | Done | WASD panning replaced by arrow keys (WASD conflicts with the brief's own W/A/S/D bindings). No dither-fade of foreground props (trees are kept short and set back instead). |
| Controls | Partial | Everything in the README table works. Missing: chat, C advanced stats panel, M expanded map, full ping wheel (two ping types), per-ability cast mode (global setting only), Ctrl+W (browser-reserved; Shift+key and + buttons provided). |
| HUD: minimap, portrait/stats, abilities/items, gold/XP, top bar, feed, health bars, indicators, rejection reasons | Done | HUD reads a 10 Hz store; nothing in React runs per frame. |
| Scoreboard, results with timeline / build / damage / gold / vision / objectives / commendation | Done | Skill-order history is not recorded. |
| Tutorial | Partial | A real match against easy bots with softened enemy structures and a 10-step tracked checklist with hints. Not scripted lesson scenes; I did not play it to completion. |
| Practice mode | Done | Gold, level, cooldown reset, heal, 0.5–4× time scale, pause, Alt range display. |
| Persistence: mastery, profile level, match history, settings (with corruption handling) | Done | `localStorage` only. |
| Audio: adaptive music, cues for all major events, priority, spatialisation, captions | Partial | Synthesised cues and a three-layer generative score; distance/pan attenuation and voice cap; captions for critical events. No announcer voice, no per-hero lines. I have not listened to it (headless verification only). |
| Accessibility: UI scale 100/125/150, remapping, cast modes, colour-blind palette, low effects keep telegraphs | Partial | Implemented; 125% + colour-blind + low quality smoke-checked in a browser. Not audited beyond that. |
| Performance budgets | Partial | Measured on one machine, not benchmarked on target hardware — see Verification. Draw calls are typically 180–290 (budget 260); one 420 peak was observed (budget 400). |
| Tools (ability editor, replay inspector, net lab, item optimiser, asset validators) | Not started | What exists: headless full-match and fixture tests, screenshot / real-input playtest / variant scripts. |
| Services (identity, profiles, rating, reports), anti-cheat pipeline, replays | Not started | |
| No proprietary designs, names, art or audio | Done | Everything is authored for this project; see `ASSETS.md`. |
| Delivery artifacts (deployment guide, protocol/schemas, bot docs, fairness report, compat matrix, a11y checklist) | Partial | Condensed into `README.md` and `docs/ARCHITECTURE.md`. No replay inspector, load tests or match recording video (screenshots only). |

## Architecture

- **Stack**: TypeScript (strict) + Vite 8, Three.js r187 for rendering, React 19 for shell and HUD,
  Vitest for tests, playwright-core (dev only) to drive an installed Edge/Chrome. No backend.
- **Why**: the brief's central constraint is "server owns truth, renderer independent of gameplay".
  I kept that boundary real even without a network: `src/sim` has no DOM/Three/React imports, runs
  at a fixed 30 Hz with a seeded RNG, and is hosted in a Web Worker. The client can only send
  `Command`s and only receives a `Snapshot` filtered by its team's vision. Swapping the worker for
  a WebSocket room would not touch the simulation, renderer or UI.
- **Main modules** (details in `docs/ARCHITECTURE.md`):
  - `src/shared` — content and protocol: map (capsule carves → signed-distance grid used for
    collision, A*, line of sight, brush, terrain mesh and minimap), heroes/abilities, items/talents,
    units/rules, commands and views.
  - `src/sim` — `world.ts` (tick, movement, attacks, minion/monster/tower brains, projectiles,
    zones, spawners), `combat.ts` (stats, effects, damage, kills, rewards), `hero.ts` (command
    validation, orders, casting, recall, wards, shop), `abilities.ts` (24 abilities as small
    modules behind one interface), `vision.ts`, `view.ts` (fog filter), `server.ts`, `worker.ts`.
  - `src/ai/bots.ts` — hero bots issuing the same commands as a player.
  - `src/client` — `runtime` (worker/in-process link, HUD store, persistence), `game.ts`
    (snapshot buffer, events → VFX/audio/feed), `input.ts` (intent + aim indicators + camera),
    `render` (terrain, procedural models, instanced minions, VFX, fog texture, 2D overlay, minimap),
    `audio`, `ui` (React).
- The simulation is an entity list with optional component blocks, not a strict archetype ECS.

## Verification

Environment: Windows 11, Node v22.12.0, npm 11.4.2, Microsoft Edge 157 (headless, via
playwright-core). All commands were run from the project root.

Final clean-state sequence (after deleting `node_modules` and `dist`):

| Command | Result |
| --- | --- |
| `npm ci` | exit 0, 0 vulnerabilities |
| `npm test` | exit 0 — **5 test files, 83 tests passed, 0 failed** (9.9 s) |
| `npm run build` (`tsc --noEmit && vite build`) | exit 0 — `dist/index.html` 0.58 kB, `assets/index-*.js` 1,035.89 kB (296.66 kB gzip), `assets/worker-*.js` 121.44 kB, `assets/index-*.css` 26.78 kB; `index.html` references `./assets/...` only |
| `node tools/screenshot.mjs` | Served `dist/` at `http://127.0.0.1:5340/play/claude-fable-5.2-high/crownfall/`; menu, draft, tutorial, shop and gameplay captured; **no page errors**, no failed requests |
| `node tools/playtest.mjs` (final build) | **25 passed, 0 failed**, no page errors |
| `node tools/playtest.mjs full` (final build) | **29 passed, 0 failed**, no page errors — the fast-forwarded unranked match (scripted player + five bots) ran about 19 game-minutes to a Defeat results screen, at 93–130 fps and 163–311 draw calls |
| `node tools/variants.mjs` (final build) | 2/2 pass: low quality + colour-blind + 125% UI (worker sim, 130 fps, 139 draws) and high quality with the in-process sim fallback (127 fps, 291 draws) |

What the tests cover (`tests/`): map symmetry / connectivity / route parity / LOS; item and hero
schemas; damage formula; wave composition and cadence; last-hit gold and shared XP; passive gold;
minion aggro; tower priority, hero aggro, ramp and backdoor mitigation; ordered structure
vulnerability, Vanguards, single Seal respawn, single victory; kill bounty, assists, respawn curve;
recall and fountain; level/rank rules; shop buy/recipe/undo/sell/limits; cast validation reasons;
32 ability/passive/talent/item behaviours across all six heroes; fog (range, walls, brush, wards,
grace, ward cap/duration); snapshot filtering and event privacy; command sequencing, rate limit and
hostile input; jungle leash/reset; Catalyst and Colossus timing and buffs; bot build graphs, bot
rule-compliance, difficulty-does-not-change-stats; determinism (same seed → same hash); and one
complete six-bot match to a single authoritative victory inside the tick budget.

What the real-input playtest checks (Playwright driving the production build with actual mouse and
keyboard events): menu → practice draft → talent selection → loading → match; shop open, double-click
buy, server-side gold deduction, undo, Escape; `+` and Shift+key rank-ups; practice level tools;
right-click move; S stop; hold-Q aim indicator and release-to-cast; ward key; dash; camera lock
toggle; Tab scoreboard; Escape pause actually freezing sim time and resume; recall and its
cancellation; then (`full`) an entire unranked match fast-forwarded at 8× with a scripted player
issuing ordinary commands, the results screen, the timeline, and match-history persistence.

Other measurements:

- Earlier full-match browser runs during development: a practice match at 4× ended in Defeat at
  25:36 (29/29 checks), and an unranked match at 8× on the pre-final build ended in Victory after
  about 31 game-minutes (29/29 checks). Frame rate reported by the game during those runs: 85–132
  fps at 1600×900 on medium quality, 142–420 draw calls (typically 180–290).
- Headless six-bot matches in Node (quick pace): six runs finished in 13.2–29.5 game-minutes at
  0.12–0.18 ms per simulation tick. With sides swapped the same composition kept winning, i.e. no
  side bias but a composition/bot-skill imbalance (see Known issues).

**Not verified**

- Firefox and Safari were not run at all. Only headless Edge was used; I never saw the game in a
  headed window and never played it by hand.
- Audio was never heard (headless). It is exercised without errors, nothing more.
- No human-skill playtest: the two browser matches were played by bots plus a simple script.
- The tutorial was only started and screenshotted; its checklist hooks are driven by the same
  events the tests exercise, but I did not complete it end-to-end.
- Performance on the brief's target hardware, the 60-minion late-game benchmark, memory over long
  sessions, and 1% lows were not measured. The fps numbers above come from one development machine.
- 150% UI scale and 1280×720 were not screenshot-checked (125% at 1600×900 was). The HUD is
  expected to overlap at 150% on small windows.
- Standard pace was only exercised by rule fixtures (objective timers, Seal respawn), not by a full
  match.

## Assumptions and deviations

- **Single-player slice.** The brief's "server" is a Web Worker in the page. Everything that needs
  real networking (rooms, matchmaking, reconnect, latency handling, six humans) is absent.
- **Two paces.** Draft defaults to *Quick* (≈1.6× XP, 1.5× gold, objectives 1.8× earlier, 0.6×
  structure health) so an arcade session reaches the late game sooner; *Standard* uses the brief's
  timings. Bot-only Quick matches still ran 13–30 minutes, longer than I intended.
- **WASD camera pan → arrow keys**, because the brief also binds W, A, S and D to gameplay.
- **Rank-up is Shift+Q/W/E/R** (and `+` buttons); Ctrl works except Ctrl+W, which a browser tab
  cannot intercept.
- **Ward key is T**, with 4 as the fallback when slot 4 holds no active item.
- **Map routes**: fountain → outer tower ≈ 64 m (≈17.5 s, brief 18–22 s); lane-to-lane through
  the centre ≈ 75 m (≈20 s, brief 8–11 s). The map dimensions in the brief did not allow both.
- **Vision threshold**: sight is blocked by terrain thicker than about 1 m; the Colossus "vision
  ledge" is a thin-walled alcove beside the pit.
- **Hero damage to structures** adds 60% of ability power so mages and supports can siege.
- **Ability simplifications**: Rampart Fold blocks enemy movement/projectiles only (allies pass);
  Anchor Line's cooldown starts on the first cast; Sinkstep crosses any thin wall; Mirror Decoy
  walks a straight line and bots are not fooled by it; Refraction triggers from brush or being
  unseen but ignores "new angle"; Hush Field also slows; Footnote's repeat prefers the nearest
  visible enemy hero; Prism Sentence deals 40% without the blink when line of sight is broken.
- **Abilities do not damage structures**; wards take three basic attacks.
- **Bots** read the alive/dead state of their own-side jungle camps directly; otherwise they use
  only team-visible information.
- **Entity model** is a component-style entity list rather than a formal ECS; GLB/KTX2 asset
  pipelines are irrelevant because there are no imported assets.

## Known issues and limitations

1. **No multiplayer or backend of any kind.** One human, five bots, local simulation.
2. **Bots are passive and unevenly skilled.** Kill counts are low, they rarely dive or coordinate,
   and Brannoch/Suri/Kesh beat Ilyra/Oru/Vey in 5 of 6 bot-only matches. Matches can drag.
3. **Presentation is programmer art.** Models are boxes/cones with procedural motion, hero
   silhouettes are readable but crude, SFX/music are synthesised and unheard by me, and bright
   additive flashes can blow out to white over the ivory lane paving.
4. Enemy heroes do not body-block; minion blocking is soft separation only.
5. Draw calls can spike above the 400 budget in large fights (420 observed) because transient VFX
   and hero model parts are separate meshes.
6. Missing controls/UI from the brief: chat, ping wheel, expanded map, advanced stats panel,
   per-ability cast modes, surrender, spectator rules, item compare.
7. The minimap shows no last-known enemy markers, and enemy camps are only drawn while visible.
8. HUD panels overlap at 150% UI scale on windows narrower than about 1920 px.
9. The tutorial is a guided checklist over a normal match, not authored lessons.
10. The time-scale message is not mode-gated in the worker (the UI only exposes it in Practice;
    the tools use it to fast-forward). The `window.__crownfall` debug handle and `?autostart=`
    URL parameter exist for the screenshot/playtest tools.
11. Only four jungle creature families and five crowd-control tags exist.

## Self-assessment

- **Playability: 7/10** — the whole loop works with responsive controls, readable telegraphs and a
  functioning shop/level/objective game, but it was verified by scripts rather than by a person and
  the bots do not put up a sharp fight.
- **Visual polish: 6/10** — a cohesive, legible stylised look with fog, shadows, clear HUD and
  decent VFX, held back by primitive-built characters and no authored animation.
- **Brief fidelity: 6/10** — rules, heroes, items, map, fog, bots and the architectural boundary
  are faithfully implemented and tested, while networking, services, tooling and production art —
  a large share of the brief — are not.
