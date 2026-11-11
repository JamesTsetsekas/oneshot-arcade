# Oneshot report: Last Protocol

Model: Fable 5.2 (Claude Code, high effort). One autonomous session, no human input.

## Summary

I built a playable single-player vertical slice of Last Protocol: full Cipher Breach matches on an original two-vault map, with one human, four bot teammates and five bot opponents, all 12 firearms, all five utility items, the complete round, objective and economy rules, and a finished menu-to-result flow. The match runs on an authoritative 64 Hz simulation inside an in-process "room" that the client talks to only through sequenced inputs, filtered snapshots and reliable events, with client-side prediction, interpolation and lag compensation in place. Online multiplayer, matchmaking, accounts, rating, reconnect and replay tooling are not built; the slice is local only.

## Brief coverage

| System / criterion | Status | Note |
| --- | --- | --- |
| Launch from a URL, capability check, error screen | Done | Static build, relative URLs, WebGL 2 check, context-loss and version-mismatch screens. |
| Core loop: buy, action, arm, disarm, round end, economy, swap, result | Done | Playable start to finish; verified by tests and a scripted browser run. |
| Match rules (first to 9, swap after 8, win by 2, max 20) | Done | Plus a Quick preset (first to 5). Overtime keeps the running economy (assumption). |
| Round timings (20 s buy, 105 s action, 35 s Spike, 3.2 s arm, 8 s / 5 s disarm) | Done | From one ruleset table; fixture-tested. Buy phase can be ended early with Enter. |
| Movement (weapon speeds, walk 52%, crouch 40%, accel 24, counter-strafe 30, jump 0.78 m, jump fatigue, landing penalty) | Done | Shared pure function for server and client prediction. No ladders, mantle, slide or prone. |
| Hitscan, hit zones, armor and helmet, falloff, penetration | Done | Head, chest, abdomen, arm, leg volumes; material-based penetration with energy loss. |
| Deterministic recoil paths, spread, recovery | Done | Fixed per-weapon path plus seeded spread from (match seed, shooter, shot sequence). |
| 12 weapons, Edge Tool, armor, kit | Done | All purchasable and usable. Numbers are original and only lightly tuned. |
| Five utility types | Done | Veil, Arc Flash, Thermite, Pulse Shard, Fragment Charge. Veil carving omitted, as the brief allows. |
| Economy (start, cap, win/loss ladder, arm and disarm rewards, refunds, drops, carry-over) | Done | Idempotent purchases; every transaction folded into a log hash. |
| Objective rules and win resolution | Done | Carry, drop, pick up, arm at either vault, disarm with both timings, detonation. |
| Aperture Annex map | Done | Two vaults, split-level mid, gantry, glass corridor, crawl, penetrable service wall, staging, signage, callouts. |
| Automated map analysis | Partial | Spawn sightlines, route timings, entries, stuck points, vault bounds, grenade containment, callouts are tested. Light contrast and render-vs-collision are not tested (render is generated from the same data). |
| Bots: senses, team plan, takes, rotations, retakes, disarm, utility, buying | Partial | Works end to end and obeys fog and hearing rules. No fakes, save logic or role system worth the name; utility use is basic. |
| Authoritative server, input sequencing, snapshots, interest filter | Partial | Real architecture, but in-process. Snapshots are full JSON at 32 Hz, not delta-compressed. |
| Client prediction, reconciliation, interpolation, clock handling | Partial | Movement only; weapon effects are driven by server events. Tested at 100 ms RTT with jitter and loss. |
| Lag compensation (250 ms history, 200 ms cap) | Done | Tested with a strafing target and clamped stale claims. |
| Spectating (team-only first person, fixed tactical camera) | Done | Spectated views come from the same filtered frames. No delayed observer mode. |
| HUD, buy menu, scoreboard, tactical map, round and match results | Done | Results include round timeline, economy chart and per-player stats. |
| Settings and accessibility | Partial | Sensitivity, FOV, crosshair editor, palettes, reduced flash and motion, captions persist. No key rebinding, no radio wheels or pings. |
| Audio | Partial | Fully synthesized and spatialized with occlusion low-pass; no reverb zones, no authored variants per distance. |
| Practice mode | Partial | Unlimited money, buy anywhere, trajectory preview. No recoil wall, grenade camera or debug views. |
| Ten human clients, matchmaking, Competitive, rating, parties | Not started | No network transport, queue or services. |
| Reconnect, abandon handling | Not started | |
| Replays, replay viewer, signed results | Not started | Matches are deterministic and carry a log hash and ruleset/collision versions, but nothing is stored or replayed. |
| Anti-cheat layers | Partial | Server authority, input validation, message quota, bounded input backlog, interest filter. No analytics, reporting or signed manifests. |
| Performance targets | Partial | See Verification. Measured only in headless Chromium on the build machine. |
| Cosmetics, progression, finishes | Not started | |
| No proprietary names, models, maps, audio or UI | Done | Everything is original and procedural; see `ASSETS.md`. |

## Architecture

Stack: TypeScript, Vite, Babylon.js (WebGL 2), React for menus and overlays, a plain DOM adapter for the in-frame HUD, Web Audio, Vitest. Playwright (core, using an installed browser) drives the build for capture and end-to-end checks.

Why this shape: the brief's technical direction is an authoritative server with thin clients, so the slice keeps that boundary even though both sides live in one page. Moving the room to a Node process and swapping the transport is the intended next step and should not touch the simulation, bots or renderer.

- `content`: weapon, utility, equipment and rule tables. One spread function is shared by the server (shots) and the HUD (crosshair).
- `protocol`: versioned input, command, snapshot and event types. Clients can send only inputs and commands.
- `map`: axis-aligned box collision in a bucket grid with a hash fingerprint; a builder that turns carved rooms plus props into collision, zones and lights; a multi-layer 1 m navigation grid with walk, drop and crouch edges generated from collision.
- `sim`: pure movement step, hit volumes, projectile step, vision rules, and `Match` (rounds, combat, utility, objective, economy). No wall clock and no `Math.random`.
- `bots`: perception with field of view and line of sight, hearing with position error, a team blackboard, attack plans, defensive setups with listening posts, rotations, retakes, a throw solver that uses the shared projectile step.
- `server`: `Room` validates input, steps bots and the match, records pose history, and builds per-client frames with the interest filter.
- `netcode`: a loopback transport with latency, jitter and loss; `ClientSession` for prediction, reconciliation, interpolation and once-only events.
- `renderer`: map mesh generated from the collision data with lighting baked into vertex colours (static, identical on every setting), procedural textures and models, pooled effects, authoritative Veil and Thermite shapes.
- `ui`, `client`, `audio`: React shell, HUD, input, loop, synthesized sound.

Substitutions from the brief: custom AABB collision instead of Rapier (simpler to keep bit-identical between prediction and server); an in-process room instead of Colyseus and WebSockets; no PostgreSQL, Redis or object storage because there are no services.

## Verification

Run from a clean state (`node_modules` and `dist` deleted first) on Windows 11, Node 22.12.0, npm 11.4.2.

| Command | Result |
| --- | --- |
| `npm ci` | Completed, 0 vulnerabilities reported. |
| `npm test` | 7 files, **96 tests passed, 0 failed**, 12 to 22 s across runs. |
| `npm run build` | `tsc --noEmit` clean, Vite build succeeded. `dist/` is 2.0 MB; main bundle 1.35 MB (359 kB gzip). |
| `node tools/playtest.mjs` | **20 of 20** scripted checks passed, no browser console errors. |
| `node tools/screenshot.mjs` | Screenshots captured from `dist/` served at `/play/claude-fable-5.2-high/protocol/`, no console errors. |

What the tests cover: economy fixtures (affordability, idempotent requests, caps, refunds, loss ladder, arming reward on a loss, reduced save reward, carry-over, side-swap reset, money cap); objective rules (arm, interrupt, both disarm timings, range and wall checks, every win condition, Spike drop and pickup, overtime and draw); combat (hit zones, armor, the Aster/Krait helmet rule, Longglass and Sable profiles, rate of fire, burst, reload, drop and pickup ammo, seeded spread reproducibility, recoil path, penetration by material, melee direction, kill credit); all five utility items; movement; map analysis; prediction on ideal and degraded links; input validation; the interest filter; lag compensation; complete bot matches with determinism; bot fog-of-war; tick cost.

What the browser run covers, with real key and mouse events against the production build: menu from a nested sub-path, buy menu by keyboard, server-side rejection, purchase, right-click refund, ready-up, barriers, movement, mouse aim, firing, jump, scoreboard, tactical map, pause freezing the room, resume, a complete fast-forwarded bot match to the result screen, return to menu.

Measured numbers:

- Bot-only matches: 20 quick matches, 154 rounds, attackers won 59%; the Spike was armed in 25% of rounds; 13 disarms. Six test seeds gave 63%.
- Server tick with ten bots: mean 0.03 ms, p95 0.06 to 0.15 ms across runs.
- At 100 ms RTT, 20 ms jitter, 1% loss: largest prediction correction 8.1 cm; client and server agree to under 2 cm after input stops. On an ideal link the correction is exactly zero.
- Headless Edge at 1280x720 reported about 130 frames per second in a live round.
- Map timings at 4.9 m/s: attacker first contact 8.7 s (A) and 10.7 s (B); defenders reach the vault centres 2.3 s before attackers; rotation 12.4 s through mid, 19.5 s the long way.
- Downstream traffic: 137 kB/s as uncompressed JSON. This misses the brief's 30 KB/s budget.

Not verified:

- I did not play it by hand. Mouse feel under real Pointer Lock, the fullscreen and keyboard-lock flow, recoil feel and the audio mix have never been judged by a person. In the scripted run pointer capture is forced because headless browsers cannot grant Pointer Lock.
- Only Chromium (Edge, headless) was exercised. Firefox and Safari are untested.
- 1080p performance on a real display and GPU, memory budgets, draw-call and triangle budgets were not measured.
- The frame rate above comes from a headless run; I did not confirm whether it used the GPU or a software rasterizer.
- Nothing about multiple human clients could be verified, because it does not exist.

The gameplay screenshots come from attract mode (`autopilot=1`): the local seat is driven by the same bot code as the others, so they show real, unscripted play from the production build. `human-play.png`, `buy-menu.png`, `scoreboard.png`, `tactical-map.png`, `pause.png` and `result.png` come from the scripted input run.

## Assumptions and deviations

- **Single-player scope.** "Ten clients" is replaced by one human plus nine bots. Unranked is the only queue; Competitive is not shown.
- **Quick match is the default length** (first to 5, swap after 4, max 12). The brief's full rules are one click away.
- **Warmup** is a 4-second frozen countdown, not a free-fire warmup.
- **Ready-up** (Enter) shortens the buy phase when every human is ready. Added because a lone player should not have to wait 20 seconds each round.
- **Pause** stops the local room. Acceptable only because the server is local.
- **Friction** when no key is held is 18 m/s², lower than the 30 m/s² counter-strafe figure, so counter-strafing is rewarded.
- **Arming reward**: $300 to the planter at once, and $600 to every attacker at round end, win or lose.
- **Reduced save reward**: applies to attackers who are still alive when time expires without an arm ($900 instead of the loss bonus).
- **Ammunition** is refilled at the start of every round, including for survivors.
- **Team damage** is off (the brief's Unranked default).
- **Overtime** continues the existing economy.
- **No player-to-player collision.** Players can pass through each other.
- **Fall damage** is not implemented; the highest drop on the map is 2.6 m.
- **Bolt-action** shots unscope and the player re-scopes manually.
- **Map scale**: rotations are longer than the brief's targets (12.4 s and 19.5 s against 8 to 10 s and 13 to 16 s), and attacker contact at A is 8.7 s against 10 to 13 s.
- **Outdoor wall collision** extends above the visible 8 m wall tops so thrown utility cannot leave the playfield.
- **Bot defenders** have their reaction time cut by 55% and aim 30% tighter while settled on an assigned angle before the arm. This models holding an angle; it applies to both teams' bots when they defend, and does not use hidden information.
- **Spotted enemies** appear as radar blips for the whole team while a teammate has line of sight.
- **Custom collision** instead of Rapier; **vertex-baked lighting** instead of lightmap textures; **procedural box models** instead of glTF assets with LODs.

## Known issues and limitations

1. No networking. The room, transport and session are structured for it, but only the in-process path exists.
2. Bot matches lean toward attackers (about 60%), most rounds end by elimination, and bots arm the Spike in only about a quarter of rounds. Bot flashes almost never blind anyone.
3. Never hand-played; see "Not verified".
4. Snapshots are full, uncompressed JSON. No delta encoding or binary packing.
5. Projectiles and dropped weapons are sent to every client regardless of sight. Enemy players and a dropped Spike are filtered; these are not.
6. No key rebinding, radio wheels, pings, text chat or jump-throw bind.
7. Character and weapon models are simple boxes with procedural animation: no skeletal animation, ragdolls or LODs.
8. Bots do not save, fake, or coordinate utility beyond one Veil or flash per execute; teammates cannot be given orders.
9. Lighting is baked per vertex on a 1 m grid, so shadows are soft and coarse.
10. Refunding a weapon restores the one it displaced only if that weapon is still on the floor.
11. The "Play again" flow re-requests fullscreen and Pointer Lock from a click, which browsers may delay by about a second after an Esc exit; the pause overlay is the fallback.
12. A clipped line of small text at the bottom of the result panel can require scrolling at 720p.

## Self-assessment

- **Playability: 7/10.** The whole match loop works with competent bots, readable feedback and a full economy, but nobody has played it by hand and the bots favour the attacking side.
- **Visual polish: 7/10.** A coherent look with baked lighting, a complete HUD and finished menus, held back by blocky procedural characters and weapons and simple effects.
- **Brief fidelity: 5/10.** Rules, economy, weapons, utility, map features and the authoritative architecture follow the brief closely, while multiplayer, services, replays, rating and much of the tooling are absent.
