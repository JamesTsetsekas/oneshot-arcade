# Crownfall: Oneshot Report

Model: Sonnet 5.5 (Claude Code, high effort). Started 2026-11-11T17:16:32Z.

## Summary

Crownfall is a playable single-player 3v3 vertical slice of the brief: a full match from menu and hero draft through lane,
jungle, objective and base play to the destroyed Crown Engine, a results screen and a persistent match history, all in the browser
with no backend. It ships six fully implemented original heroes, a symmetric lane-and-jungle map with fog of war and brush, 32
items with a shop, minion waves, towers/Seals/Cores/Engine rules, Twin Catalysts, the Aether Colossus, and utility-scored bots that
obey the same rules and information as the player. The simulation is a deterministic 30 Hz core behind a command/event protocol
(tested with 47 headless tests); real networking, matchmaking and reconnect were **not** built, and real-GPU frame rate was not measured.

## Brief coverage

Done = implemented and exercised by tests or a recorded playthrough. Partial = implemented in reduced form (see note).
Not started = absent.

| System / acceptance criterion | Status | Note |
| --- | --- | --- |
| Launch from a URL, capability check, error screens | Done | WebGL 2 check, context-lost and settings-corruption states; static build works from any sub-path (verified under `/play/claude-sonnet-5.5-high/crownfall/`) |
| MVP format 3v3, compact two-lane map, jungle pockets | Done | The Broken Diadem, 150x115 m, 180-degree rotational symmetry (test) |
| Core loop: menu, tutorial, draft, load, play, results, requeue | Partial | All screens exist for solo vs bots; "queue" is replaced by an instant bot match (no matchmaker) |
| Six original heroes with passive + Q/W/E/R | Done | Brannoch, Suri Vale, Oru, Kesh, Ilyra Quill, Vey; every ability cast/validated in tests; tooltips generated from data |
| Hero kits: VFX / SFX / animation | Partial | Procedural primitives, code-driven rig animation (run/attack/cast), per-ability VFX and synthesised SFX; no authored clips, no voice lines |
| Two viable build paths per hero | Done | Two named builds per hero with explanations in draft and shop; bots pick one |
| 32 items, shop, buy/sell/undo, recommendations | Done | 6/10/12/2/2 split verified by test; recipes, component discounts, 65% sell, undo, search, filters; a few passives simplified |
| Universal Talents (6, pick 2) | Done | Skyhop, Mend, Aegis Pulse, Windrunner, Cinder Mark, Purify |
| Combat model: damage types, armor/ward formula, shields, CC tags | Done | `defense/(100+abs(defense))`, bounded negative amplification, shield layer, slow strongest-only, stun/root/silence/disarm/airborne; no crit |
| Basic attacks with windup/release/backswing, missiles | Done | Move-after-release cancels backswing |
| Death, respawn 7 to 34 s, kill/assist gold, bounties | Done | Contribution window assists, streak and lead bounties capped, no global kill gold |
| Recall (7 s, cancelled by damage/move), fountain, shop-at-fountain | Done | Tested |
| Lane waves: 3 Guard + 3 Bolt, Siege every 3rd wave | Done | Interpreted as a wave in each lane every 30 s (brief says "alternating") |
| Minion aggro, last-hit gold, shared XP, passive gold | Done | Tested; no deny |
| Towers: target priority, visible ramp, backdoor mitigation | Done | Hero-aggro rule, minion-first targeting, tether line and FOCUS multiplier in the HUD |
| Seals, Core Towers, Crown Engine, Vanguards, victory once | Done | Invulnerability rules, 4-minute one-time Seal respawn, single victory event (tests) |
| Jungle: camps, leash/reset, 4 small + 2 buff per side | Done | Six creature families as simple models; buff boons |
| Twin Catalysts and Aether Colossus | Done | 3:30 / 9:00 spawn, 4 / 6 min respawn, team buffs, public HP and timers in the HUD |
| Fog of war, brush, wards, 100 ms grace | Done | Visibility is computed in the simulation; enemy units are never exposed by the HUD or renderer unless visible. Wall line-of-sight only, no true-sight items |
| Navigation: path graph + A*, corner shortening, blocked endpoints | Done | 0.75 m grid with string-pulled A* (tests); lane splines for minions |
| Physics: circles, swept projectiles, dynamic walls, knockback/dash clipping | Done | Rampart Fold is not part of the nav grid (units slide along it) |
| Camera: 52 degree pitch, 45 degree yaw, 34 height, zoom 28 to 42, follow/lock/centre | Partial | Pan is on arrow keys, edge scroll and middle-drag because WASD are ability/command keys in the same brief; lock defaults to on |
| Controls: right-click, A-move, QWER, rank keys, D/F, 1-6, B, P, T, S/H, Tab, M | Done | T is the ward key (the brief's "4" collides with item slot 4) |
| Quick cast / indicator cast / normal cast, remapping | Partial | Three global cast modes and remapping of 15 actions; not per-ability |
| Pings, team chat | Partial | Alt+click danger ping (rate-limited, world + minimap); no ping wheel, no chat |
| HUD: minimap, portrait, abilities, items, feed, scoreboard, death recap, results | Done | Expanded map with debug overlays (walkability, brush, tower range) on F3 |
| Tutorial | Partial | A 10-step guided checklist over a live easy match (passive enemies), not scripted scenarios |
| Game modes: Tutorial, Unranked, Practice | Partial | Tutorial + a single vs-bots match (difficulty selectable) with pause; no matchmaking, no practice tools besides game speed in the tutorial |
| Bots: roles, lane/last-hit/harass/ward/gank/jungle/buy/recall/team fight/retreat/defend/push/finish | Partial | Utility-lite state machine with team plan; no shared blackboard of last-known positions; one dedicated jungler (Kesh); no stat or vision cheats (tests) |
| Persistent progression: mastery, profile level, history | Partial | Local only (`localStorage`); no cosmetics |
| Authoritative server, 30 Hz, deltas, prediction, interpolation | Partial | 30 Hz authoritative sim behind a sequenced command protocol with deterministic replay (test); the "server" runs in-page, renderer interpolates between ticks; no WebSocket rooms, interest filtering or prediction |
| Reconnect, matchmaker, AFK, services, anti-cheat | Not started | Out of scope for a one-shot slice |
| Audio: adaptive music, spatial SFX, captions | Partial | Procedural 3-layer music keyed to nearby combat, distance-attenuated SFX with a voice budget, captions as banners; not verified by ear |
| Accessibility: colorblind palette, effects-low, UI scale 100/125/150, remap, captions | Partial | Implemented and screenshot-checked at 150% on 1280x720; the 150% shop is cramped |
| Performance budgets | Partial | About 82 to 109 draw calls and 26k triangles per frame (measured in headless Chrome); sim tick measured 4 to 10 ms worst case in Node; real-GPU FPS and p95 tick not measured |
| Tools: ability sandbox, item optimizer, replay/net/perf labs, balance headless matches | Partial | Headless batch runner and fairness mirror (`tools/`), debug map overlays; no editors or labs |
| Original assets, no proprietary content | Done | Everything is procedural (see `ASSETS.md`) |

## Architecture

- **Stack:** TypeScript (strict), Vite 6, Three.js 0.170 `WebGLRenderer`, Vitest. Vanilla DOM for the shell/HUD with one canvas
  overlay for health bars and floating text; no framework. Chosen to keep the slice dependency-light and to guarantee no
  per-frame DOM churn (the HUD read model updates at about 10 Hz).
- **`src/shared`**: schema-typed content (`content.ts`: heroes, abilities with numeric tables per rank, items, talents,
  constants) and the map (`map.ts`: lanes, structures, camps, obstacles, brush, 0.75 m navigation grid, line-of-sight, A*).
  Used by the simulation, renderer, minimap and tests so they cannot disagree.
- **`src/sim`**: the authoritative simulation. `sim.ts` owns all mutation (units, projectiles, zones, walls, damage, economy,
  vision) and is advanced only by `step()` and driven by `command()`. `heroes.ts` holds the kits as small typed code modules,
  `rules.ts` waves/towers/jungle/objectives/victory, `items.ts` shop and passives, `bots.ts` the bot brains. Randomness comes
  from a seeded RNG; a recorded command log replays to an identical state hash.
- **`src/client`**: `app.ts` (state machine, fixed-step loop with interpolation, match controller, tutorial), `renderer.ts`
  (scene, instanced minions, fog overlay, picking, indicators), `models.ts` (procedural rigs), `vfx.ts` (point-sprite particles
  and pooled decals), `hud.ts`/`shop.ts`/`screens.ts` (UI), `input.ts` (intent to commands), `audio.ts`, `storage.ts`.
- **Deliberate deviations from the brief's stack:** no React, no ECS framework (plain object arrays with a spatial scan), no
  Colyseus/WebSocket (the command protocol is the seam where a network transport would go), abilities are closures not an effect
  graph. These trade fidelity to the technical direction for a complete, tested, playable slice.

## Verification

All commands were run from a clean state (`node_modules` and `dist` deleted first) in `crownfall/`:

- `npm ci`: succeeded.
- `npm test`: **3 test files, 47 tests passed, 0 failed** (`tests/rules.test.ts` 25, `tests/combat.test.ts` 19, `tests/protocol.test.ts` 3).
  Covers content counts, map symmetry/reachability, waves, last hits and XP, respawn, recall, shop (discounts, undo, sell, boots,
  full inventory), item effects, determinism, fog and brush, camps/leash/reset, Catalysts and Colossus, tower targeting and ramp,
  Seal/Core/Engine rules and single victory, backdoor mitigation, fountain, every ability of all six heroes, cast validation,
  talents, skill-rank rules, command-log replay, and two full bot matches (one to a single authoritative victory).
- `npm run build`: succeeded (`tsc --noEmit` then Vite). `dist/index.html` 0.76 kB, CSS 29.3 kB (7.2 kB gzip), JS 750.7 kB (211 kB gzip).
- Sub-path check: `tools/serve.mjs` serves `dist/` under `/play/claude-sonnet-5.5-high/crownfall/`; every browser run below loaded from there.
- `npm run dev` started on port 5540 and responded 200 (then stopped).
- Browser playthroughs (headless Chrome, software WebGL via SwiftShader, 1280x720 to 1920x1080) with real mouse/keyboard events:
  menu, draft, loading, match start, shop double-click buy, skill rank (Ctrl+Q), right-click move, ward (T), aim indicator (hold Q),
  casts of Q/W/R for Brannoch, Ilyra, Suri, Kesh, Vey and Oru, scoreboard (Tab), expanded map (M), pause, settings, tutorial
  checklist progress, fast-forward to a Defeat and the results screen. **No console errors or warnings in any run.**
  Screenshots are in `oneshot/` (`screenshot.png` is a 1920x1080 mid-game fight from the production build; for that capture the
  player's hero was driven by the bot controller so the state was organic).
- Bot-vs-bot batches (`npm run sim:batch`, 12 seeds, normal difficulty): every game ended in a victory, 20.2 to 32.9 minutes
  (median about 23), team 0 won 8 and team 1 won 4 with varying hero compositions. A mirror-match fairness check
  (`npm run sim:fairness`) found and fixed a real first-mover bias caused by staggered bot think phases; after the fix last hits,
  gold and damage are balanced between sides. Match length is above the brief's 14 to 22 minutes for bot-only games.
- Sim cost: worst single 30 Hz tick 4 to 10 ms in Node with six bots and about 100 units (no p95 measurement).

**Could not verify:** real-GPU frame rate and frame-time budgets, audio by ear, Firefox/Safari/Edge behaviour, behaviour on
displays other than those emulated, long-session memory growth, any network behaviour (none exists).

## Assumptions and deviations

- Single-player vs bots stands in for matchmaking/multiplayer; "Unranked" and "Practice" collapse into one bot match plus the Tutorial.
- Waves spawn in both lanes every 30 s (first wave at 0:14), reading "alternating toward both lanes" as "toward both lanes".
- Camera pan uses arrow keys, edge scroll and middle-drag because W, A, S, D are ability / attack-move / stop / talent keys; camera
  lock is on by default so a new player never loses their hero (Y toggles it).
- Ward trinket is on T (the brief's 4 collides with item slot 4).
- Map is 180-degree rotationally symmetric (lane 0 for blue is the rotation of lane 1 for red) rather than mirrored; Core Towers
  become vulnerable once a Seal of the same team is down; Seal respawn re-hides the Cores.
- Items: no critical-strike stat, Quiet Index refunds 1 s of the used skill's cooldown when hitting beyond 7 m, Beacon Loom reveals 6 m for 3 s.
- Numbers (HP, damage, gold, XP, tower stats) are my own tuning, not derived from any game.
- Difficulty changes bot reaction rate, aim error, group-up time and ward use only (never stats or vision).

## Known issues and limitations

1. No real multiplayer: no server, matchmaking, reconnect, prediction or interest management; the protocol seam exists but nothing sits behind it.
2. Bot-only matches run longer than the target (20 to 33 min). Bots play a sensible but simple game: they retreat and re-engage
   inefficiently, rarely contest wards, and only Kesh jungles.
3. Real-hardware performance is unmeasured; every performance claim in this report comes from headless/software rendering or Node.
4. Heroes, monsters and structures are readable procedural primitives, not authored models; there are no animation clips, voice
   lines, or authored music.
5. Rampart Fold is not in the nav grid (units slide along it, paths can aim through it); wall line-of-sight is the only vision blocker.
6. The tutorial is a checklist, not scripted scenarios, and its later steps (tower rules, objectives) rely on the player finding them.
7. Per-ability cast mode, ping wheel, team chat, spectator, surrender, cosmetics and rating are absent; no dead buttons are shown for them.
8. UI scale 150% at 1280x720 uses a compact HUD layout and a cramped shop.

## Self-assessment

- **Playability: 7/10.** A complete, fair-feeling loop from draft to a destroyed Engine with readable telegraphs, but bots are
  simple and bot-only games run long.
- **Visual polish: 7/10.** Cohesive stylised look, fog, VFX, HUD and results are consistent, but all models are primitives and there is no authored animation.
- **Brief fidelity: 5/10.** Gameplay systems are broadly covered and tested; the networked server, services, tools, audio depth and asset pipeline are largely not.
