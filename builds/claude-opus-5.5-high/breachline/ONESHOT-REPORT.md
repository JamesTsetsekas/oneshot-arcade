# ONESHOT REPORT: Breachline (claude-opus-5.5-high)

## Summary

I built a playable single-player vertical slice of Breachline: a complete Team Clash Practice match on an
original map, Relay Station K-17. It is 6v6 with perception-limited bots and runs from menu and loadout
editing, through warmup, combat, death recap and respawn, to the match end, results with XP and unlocks,
and Play Again. Matches run on an authoritative 60 Hz room simulation (`src/server`) that owns movement,
weapons, damage, Momentum, support actions, spawns, score and the clock. It has no rendering or UI
imports and runs headless in tests. A Babylon.js renderer, a batched DOM HUD, a React shell and a
synthesized Web Audio mix turn that simulation's snapshots and events into a readable, responsive FPS.
The online stack (real WebSocket rooms, prediction and reconciliation, matchmaking, services) is not
built. The architecture keeps those seams (protocol types, input commands, snapshots, a lag-compensation
history), but the shipped game is local Practice only, and the menu says so instead of showing a dead
Quick Play button.

## Brief coverage

| System / acceptance criterion | Status | Note |
|---|---|---|
| Launch → Practice without account → loadout → spawn → full match → results → play again | **Done** | Verified in a headless browser (menu, practice setup, match, results, Play Again requeue) |
| Team Clash rules (75 pts / 8 min, sudden death +5 in 60 s, warmup < 20 s, post-match ≤ 25 s auto-requeue) | **Done** | Unit-tested; 25 s auto Play Again with "Stay on results" opt-out |
| 6v6 with bots filling seats; configurable bots/score/time in Practice | **Done** | 6v6/3v3/1v1, Easy/Normal/Hard, 25/50/75 pts, 5/8/10 min. No latency simulation or aim diagnostics |
| Movement: walk/sprint/crouch/jump/mantle/ADS slowdown/collision, no bunny-hop gain | **Done** | Data-driven values from the brief; tested. No moving doors |
| Camera: 90° default hFOV 75–110 with correct vFOV, viewmodel FOV, ADS zoom per optic, decorative layers off the aim ray | **Done** | Viewmodel FOV is emulated by scaling the weapon layer (equivalent projection) |
| Nine weapons fire, recoil, consume ammo, staged reloads, falloff/hit zones, can kill | **Done** | Tested through the room for all nine |
| Attachments (11, max 3, visible tradeoffs + exact stats), 9 perks (no damage/health boosts) | **Done** | Every perk has a gameplay effect; tests enforce the no-power rule |
| Equipment: frag (cook), adhesive, breach mine (laser), flash (LOS + angle), obscurant (blocks sight), signal dart | **Done** | Fixed-step projectile physics with swept ray collision; equipment recharges |
| Momentum 3/5/8 with six support actions; support kills don't extend Momentum; one Tier-8 per team | **Done** | Recon Sweep, Ammo Pod, Hunter Drone, Mortar Mark, Interdiction Flight, Team Uplink; tested |
| Spawn director (enemy distance, LOS, recent deaths, teammates, danger, audit reason) | **Done** | 10,000-respawn safety test passes |
| Bots: perception (cones, occlusion, obscurant, hearing, damage, team radar), states, reaction delay, aim noise, equipment, support, heat maps | **Done** | No wall vision (tested). Strategic states are a compact subset (spawn/route/seek/hold/push/flank/retreat) |
| Death recap: attacker, weapon, distance, hit timeline, final direction, no hidden info | **Done** | Built from the server damage log (tested). Shortened killer view not done |
| HUD: crosshair, ammo, health, equipment, support, minimap, score/timer, kill feed, Momentum, hit markers, damage direction, medals, scoreboard | **Done** | Minimap shows only revealed/firing enemies, pings, devices, strikes |
| Loadouts: five slots, validation (owned/unlocked/ruleset), death-screen switch applies next spawn | **Done** | Tampered loadouts rejected (tested) |
| Progression: XP, levels 1–30, sidegrade unlocks, reticles, five onboarding challenges, idempotent results, export/reset | **Done** | localStorage instead of IndexedDB. No weapon mastery tracks |
| Settings (video, mouse, ADS/scoped multipliers, hold/toggle, full remap, audio, colorblind, reduced motion, photosensitivity, shake/bob) | **Partial** | No texture-quality or AA toggles separate from the preset; quality/shadows apply next match |
| Error states (Pointer Lock refusal, tab hidden, context loss, missing WebGL 2) | **Partial** | Implemented. Context-loss recovery not exercised. Socket/version/server-full states don't apply offline |
| Map: K-17 ~115×95 m, five zones, three lanes, tunnel, catwalk power position, ridge marksman lane, utility pipes, breakable glass, spawn blockers | **Done** | Box-built geometry; travel metric tested (spawn to centre ≈ 8–14 s walking) |
| Penetration through thin materials only; breakable interior glass | **Done** | Material-tagged energy model |
| Audio: synthesized weapons (close/tail/suppressed), reloads, footsteps, equipment/support telegraphs, HRTF, occlusion, reverb, voice limit, adaptive music, announcer | **Partial** | The announcer is text subtitles plus tonal stingers, not voiced lines |
| Visuals: sky/ocean/fog, cascaded shadows, post-processing by tier, decals (cap 250), particles, team kits with IFF accents | **Partial** | Simple primitive art; no baked GI or lightmaps (vertex-colour AO only), no GPU particles, no ragdolls (static death poses) |
| First-person animation (sway, bob, sprint, ADS, recoil, staged and empty reloads, swap, melee, inspect, throw, mantle) | **Partial** | All layers present but procedural and blocky |
| Rapier physics | **Not started** | Deterministic custom AABB/capsule-approximation collision instead (see deviations) |
| Online: Colyseus-style rooms, prediction/reconciliation, interpolation buffer, delta snapshots, matchmaker, profile service, Postgres/Redis | **Not started** | Protocol shapes, input commands, snapshots and a clamped lag-compensation history exist; transport is in-process |
| 12-client online acceptance test, net-emulation (150 ms/2%/30 ms) test | **Not started** | No network layer |
| Performance benchmark at 60 FPS 1080p medium | **Partial** | Headless 1280×720 Edge reported 25–140 FPS across runs on a heavily loaded machine; no controlled 1080p benchmark |
| Replay inspector, recoil viewer, asset validator, load tests | **Not started** | Headless deterministic match test only |
| Future modes (Zone Control etc.) | **Not started** | Out of scope per brief |

## Architecture

**Stack**: strict TypeScript 7, Vite 8 (`base: "./"`), Babylon.js 9 (WebGL 2), React 19 for the shell,
Vitest 5 for tests, and playwright-core for screenshot and UI scripts. Practice has no backend.

- `src/shared`: pure, deterministic code used by the room (and ready for client prediction):
  `math.ts` (vectors, seeded RNG, FOV conversion), `collision.ts` (static AABB world with a spatial
  grid, ray casts, penetration traversal, line of sight, smoke segment tests), `movement.ts`
  (fixed-step capsule-ish movement, step-up, mantling, crouch clearance), `weapon-sim.ts` (stats
  composition, cadence, ammo, staged reloads, ADS, spread, recoil), `hitbox.ts` (zoned hitboxes), and
  `protocol.ts` (versioned inputs, snapshots, events, results).
- `src/content`: data with schemas and versions: tuning, weapons, attachments, perks, equipment,
  support actions, loadout validation, progression and challenges, and the K-17 map (collision boxes,
  decor, zones, spawn candidates).
- `src/server`: the authoritative room (`room.ts`: match lifecycle, ticks, damage/kill/assist/score,
  Momentum, equipment, support actions, radar visibility, snapshots, signed result, rewind history),
  `bots.ts` (perception-limited bot brains that emit normal `InputCommand`s), `nav.ts` (navmesh grid
  baked from collision with walkability tests, A* with heat costs) and `spawn.ts` (spawn director). It
  never imports renderer or UI code.
- `src/client`: `session.ts` (fixed-step loop, local transport, snapshot interpolation, event routing to
  HUD/audio/renderer, pause/visibility/context-loss handling) and `input.ts` (binds, hold/toggle, Pointer
  Lock with raw input).
- `src/renderer`: Babylon scene. `world.ts` covers sky, ocean shader, fog, CSM shadows, merged map
  meshes with world-space UVs and baked contact darkening, decor and the post pipeline. `characters.ts`
  has team kits and IFF accents, `viewmodel.ts` and `weaponModel.ts` the procedural guns and arms,
  `vfx.ts` the pooled effects, and `textures.ts` the canvas-painted textures.
- `src/ui`: the React shell (`App.tsx`, `screens.tsx`), the batched DOM HUD (`hud.ts`, not React) and
  CSS. `src/audio/audio.ts` is the synthesized audio engine. `src/profile/profile.ts` holds the guest
  profile, settings, schema migration and idempotent result application.
- Code splitting: the menu shell is about 104 KB gzipped. The engine and simulation chunk (about
  1.45 MB gzipped) loads when a match starts.

## Verification

All commands were run in the workspace on Windows 11 with Node 22.12.0 / npm 11.4.2.

1. Clean state: `rm -rf node_modules dist`, then `npm ci`. Result: "found 0 vulnerabilities".
2. `npm test`: **Test Files 5 passed (5), Tests 44 passed (44)**, about 24 s. It covers:
   - movement speeds, sprint delay, accel/decel, jump apex, no bunny-hop gain, walls, stairs, mantle
     limits, crouch-only pipes, and the tunnel descent on the real map;
   - weapon RPM cadence, semi-auto gating, ordered reload stages, interrupt semantics, burst,
     sprint-to-fire, ADS window, falloff and Warden range lethality, TTK > 150 ms, deterministic recoil;
   - room rules: regen, friendly fire, spawn protection, scoring/assists/respawn, Momentum tiers and
     support-kill rule, every weapon killing through the room, recap accuracy, score/time/sudden-death
     endings, loadout rejection, lag-compensation rewind, and smoke/wall sight blocking;
   - spawn director over 10,000 random respawns (0 unsafe picks when a safe one existed), nav
     connectivity through all lanes and the tunnel, and the travel-time metric;
   - bots: no wall vision, smoke and vision-cone respect, reaction delay before firing, and a full
     deterministic 6v6 match reaching one result (same seed gives an identical result);
   - loadout tamper cases, the no-power-creep rule, level curve, idempotent results and challenges,
     and corrupt-profile migration.
3. `npm run build` (`tsc --noEmit && vite build`): success. `dist/index.html` references `./assets/...`
   only.
4. `node scripts/screenshot.mjs oneshot` served `dist/` from `/play/claude-opus-5.5-high/breachline/`
   and drove headless Microsoft Edge at 1280×720 in demo/autopilot mode. It loaded with no console
   errors or page errors. I used its third capture (live match, player alive) as
   `oneshot/screenshot.png`. Its first capture happened to land on the death recap and is kept as
   `death-recap.png`; `gameplay-2.png` and `menu.png` come from the same run. The reported FPS was
   25–101 (the machine was about 77% CPU-busy with other processes). `results.png`, `loadouts.png`,
   `scoreboard.png`, `tunnel.png` and `support-actions.png` were captured from the dev server during
   step 5. `support-actions.png` uses devices and markers injected through the debug hook.
5. Against `npm run dev` (port 5420, stopped afterwards):
   - `ui-check.mjs` walked through Loadouts, Settings, Profile and Practice, then Deploy. Clicking the
     canvas acquired Pointer Lock in headless Edge. Holding W moved the player 7.5 m in 1.5 s, holding
     the mouse fired 10 rounds in 0.8 s, and R reloaded.
   - `results-check.mjs` played a 6-point match to the end. The results screen showed XP lines, a level
     up and an unlock; the profile saved 1 match with the processed match id. Play Again started a new
     warmup.
   - `tour.mjs` and `feature-check.mjs` captured the ops wing, ridge, utility, tunnel, bay, a scoped
     Warden view, and smoke, ammo pod and mortar markers.
6. Headless sim benchmark (`npx rolldown scripts/sim-probe.ts --platform node --format esm -o probe.mjs && node probe.mjs 7`):
   a full 12-bot match ran in 10,555 ticks. Average tick was 0.29–0.6 ms on a lightly loaded run and up
   to 1.7 ms with a 117 ms max spike under heavy machine load. Navmesh bake takes 0.5–1.1 s (3,727 nodes).

**Not verified**:
- Playing with a real mouse and keyboard by a human. All gameplay checks were automated or autopilot.
- Firefox and Safari.
- Real GPU context loss and restore.
- The Escape-to-pause flow, because synthetic Escape did not release Pointer Lock in headless Edge.
- 1080p performance targets.
- Audio output. Audio is generated and routed, but it was never listened to.
- Long-session memory.

## Assumptions and deviations

- **No online play.** The brief's matchmaker, WebSocket rooms, prediction, reconciliation and services
  are a multi-week backend effort. The authoritative room runs in-process with zero latency, so client
  prediction and reconciliation are not exercised, and remote players are interpolated between 60 Hz
  local snapshots rather than through a 20 Hz/100 ms buffer. The menu explains this instead of showing a
  dead Quick Play button.
- **Rapier was replaced** by a small deterministic AABB collision world and capsule-approximating
  movement. The map is all boxes, and this is trivially headless and testable, which matches the
  "identical client/server movement code" intent.
- **Persistence** uses `localStorage` (schema-versioned with migration), not IndexedDB.
- **No glTF/KTX2 assets.** Everything is procedural (see `ASSETS.md`), so there are no LODs or
  compressed textures. Static map geometry is merged per material, and contact AO is baked into vertex
  colours instead of lightmaps.
- "All gameplay unlocks are also available in private Practice": this is an opt-in **Practice: all
  unlocks** toggle. With it on by default, progression would be meaningless in a Practice-only build.
- The viewmodel FOV slider is a vertical FOV for the weapon layer (55–75°).
- **Announcer**: subtitled text with tonal stingers. Browser TTS was avoided because some voices call
  network services.
- **Strategic bot states are merged.** Regroup is folded into retreat, and Use Support is an action
  taken from route/seek.
- **Equipment recharges** (28/22 s, 3× during Team Uplink), because the brief's Team Uplink implies
  recharge.
- Sudden death is interpreted as "first team to score 5 more within 60 s; otherwise the leader wins,
  else a draw".

## Known issues and limitations

1. The art is primitive and boxy. Weapons, arms and soldiers are assembled cubes, so the first-person
   presentation is readable but far from the brief's flagship animation quality.
2. Normal-difficulty bots are quick and accurate in groups, and matches against 11 bots end in about
   3–4 minutes. Bot tactics are simple: no real cover selection, and they sometimes bunch up or get
   stuck briefly before repathing.
3. There is no networking, matchmaking, reconnect or anti-cheat. The lag-compensation history and the
   result "signature" are stand-ins (an FNV hash, not cryptographic).
4. Doors are static openings. There are no moving doors, no ragdolls and no killcam.
5. The obscurant is drawn as translucent spheres plus particles. It is opaque in gameplay, but visually
   it is a soft blob.
6. Some settings (quality preset, shadows) apply only from the next match. There are no separate texture
   or anti-aliasing controls.
7. Pointer Lock and pause behaviour depend on the browser; the Escape path was not verified headless.
8. The bundle includes most of Babylon (about 1.45 MB gzipped game chunk). It is loaded lazily after the
   menu.

## Self-assessment

- **Playability: 7/10.** The full loop works end to end: the gunplay, Momentum, equipment, support
  actions, recap and results are all functional and tested. Bot balance and tactics are rough, and no
  human has playtested it.
- **Visual polish: 5/10.** It has a coherent sky, ocean, shadows, readable HUD and menus, but the
  procedural box models and viewmodel look crude next to a produced shooter.
- **Brief fidelity: 5/10.** Single-player coverage of the brief's systems is broad and faithful (rules,
  weapons, loadouts, Momentum, spawns, bots, progression), but the online authoritative netcode and
  services stack, a core pillar of the brief, is not built.
