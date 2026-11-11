# Skybreak — One-shot Report (Opus 5.5, Claude Code, high effort)

## Summary

I built a playable single-player battle royale vertical slice. Its core is an authoritative,
deterministic 30 Hz match simulation (staging pier, skiff insertion, freefall and wing-sail, loot,
combat, ten Calmfield phases, a winner, results) written in strict TypeScript and rendered with
Babylon.js, with React handling the shell and HUD. You play against 23 server bots on an original
1.2 km island. The slice includes nine data-driven weapons across five rarities, eight items,
traversal (sprint, slide, mantle, swim, zipline, ascender, vent, grapple), a Practice Range,
spectating, a results screen, settings, accessibility options and a local cosmetic profile. The
authoritative "server" runs in the browser behind a message-shaped local transport, so no backend
exists or is needed. Real networking, services, asset streaming and the production tool suite are
not built.

## Brief coverage

| System / acceptance criterion | Status | Note |
| --- | --- | --- |
| Launch → menu → Practice → Quick Drop, no account | Done | Guest profile, no login |
| Queue / matchmaking screen | Partial | Local "room" with real load steps, elapsed time, cancel; no real matchmaker |
| 24 seats, bot fill, 35 s staging pier (non-damaging) | Done | Tested: staging blocks damage; Enter readies up |
| Skiff on seeded paths, jump, freefall, auto/manual wing-sail | Done | Auto-eject at far shore; deploy at 60 m AGL or manually with Z |
| Every Calmfield phase, brief timings, valid centres, moving endgame, final collapse | Done | Tests check timings, valid authored centres and containment. "Short" pace option scales timings by 0.45 |
| Storm damage, current/next field, timer, distance, route line | Done | Minimap and full map; storm damage bypasses shields (my choice) |
| Exactly one winner / deterministic tie-break | Done | Tested over full 24-bot matches; tie-break by kills, then damage, then id |
| Chests, lockers, floor loot with a weapon in every cluster, death cache, capsules, caravan | Done | Capsules from phase 3; caravan drone with 600 shield that avoids the final field |
| Five slots, ammo caps, stacks, hold-to-swap, drop, split ammo | Done | Tested |
| Heal Health, restore Reserve, trigger Aegis recharge, cancel rules | Done | Tested: Med is not interruptible, Trauma is |
| Utilities: mist, grapple, echo, wind orb | Done | Echo shows direction and age trails only, never live positions |
| Nine weapons: cadence, ammo, recoil pattern, seeded spread, hit zones, falloff/projectile, rarity, shields, death | Done | Server-side; recoil is a deterministic view kick |
| Rarity tuning: data-driven, never doubles damage, Masterwork attachment, capped Prototype | Done | Tested; Tuned DPS lands at about +3–7% depending on reload |
| Sprint, slide, crouch, jump, mantle, swim, zipline, ascender, freefall, glide, vent, grapple | Done | Shared controller, server-authoritative; tested |
| Fall damage, heat-channel hazards | Done | |
| Bots: legal drops, loadouts, rotation, perception without cheats, heal, cover/utility, final field | Partial | All present; cover use is implicit (strafe/retreat), not real cover-point search. Some bots still die to the storm or get stuck on geometry |
| Third-person camera: boom 3.1, shoulder 0.55, ADS boom/FOV, shoulder swap, collision, aim via camera ray then muzzle check | Done | Horizontal FOV 80–105; free-look in the air |
| HUD layout, hit markers by type, shield break, damage direction, kill feed | Done | |
| Full map with markers, pings, skiff path; no enemies on the map | Done | |
| Spectator, results (placement, kills, assists, damage, accuracy, survival, distance, storm, loot history, timeline, route), requeue | Done | Spectator follows the killer, LMB cycles players |
| Settings: presets, dynamic resolution, shadows, view distance, FOV, sensitivities, remapping, hold/toggle, audio, captions, visual sound, colour-blind, reduced motion, photosensitivity | Done | Smoke, storm and cover look the same on every preset |
| Practice Range: all weapons, movement course, target bots, damage data | Partial | No graphics benchmark mode |
| Persistence: cosmetics/mastery only | Done | localStorage, every access guarded |
| Procedural audio: spatial gunshots with distance tails, footsteps, cues, chest hum, music | Done | No surface-specific footsteps; no occlusion |
| Networking: WebSocket rooms, prediction/reconciliation, delta compression, lag compensation | Not started | Protocol types, sequenced inputs, interest-filtered snapshots and a LocalTransport seam exist |
| Interest filtering incl. spectators | Done | Tested: 260 m relevance; far gunshots are event-only with quantised position |
| Replay (seed + inputs) | Partial | Input log recorded, replay reproduces state (tested); no inspector UI |
| Rapier physics, glTF/KTX2 assets, streamed cells, services, tooling suite | Not started | Own AABB/heightfield collision; procedural meshes; island built at load |
| 120 ms RTT/jitter/loss behaviour, 60 FPS hardware benchmark | Not started | Not verifiable here |
| Original IP (no copied names, assets or UI) | Done | See ASSETS.md |

## Architecture

- **Stack.** TypeScript (strict), Vite 6, Babylon.js 7 (WebGL 2), React 18 for shell and HUD,
  Vitest for tests, playwright-core for screenshots.
- **`src/shared/content`** (≈ shared-content). Weapons, rarity curves, items, storm phases,
  movement constants and the ruleset version. All of it is data.
- **`src/shared/world`**. `island.ts` builds The Highwake from a fixed seed: heightfield, AABB
  collision boxes, ziplines, ascenders, vents, hazards, loot sockets, containers and valid storm
  centres, plus render-only decor kept separate. It also produces a manifest hash.
  `collision.ts` holds the spatial hash, support/blocked queries and raycasts.
- **`src/shared/sim`**. The character controller (`movement.ts`) and the camera/aim rig
  (`aim.ts`). Both client and server use them.
- **`src/shared/protocol`** (≈ shared-protocol). Input frames with a button bitmask, inventory
  actions, snapshots, events and results.
- **`src/server`** (≈ server-match / server-spatial / server-bots). `match.ts` covers
  lifecycle, players, weapons, items, damage and attribution, projectiles, capsules, the caravan,
  interest-filtered snapshots and events, and replay. The other modules are `storm.ts`,
  `loot.ts`, `combat.ts` (hitboxes, hitscan, pellet caps), `bots/nav.ts` (1 m grid and windowed
  A*) and `bots/brain.ts` (state machine). Bots emit ordinary InputFrames.
- **`src/client`** (≈ client-runtime / renderer-world / client-ui / audio).
  - `game.ts` runs the fixed-step loop through a LocalTransport. It handles interpolation, the
    camera and its collision, events to VFX and audio, dynamic resolution, and a batched HUD read
    model.
  - `render/` covers terrain cells, vertex-coloured static cells, thin-instanced foliage, shaders,
    actors and FX.
  - `ui/` covers the React screens, HUD, map and inventory.
  - `audio/` is a procedural Web Audio engine.
- **Why this shape.** The brief wants an authoritative server and parity between client and
  server. A deterministic, DOM-free simulation shared through a transport seam gives that, makes
  the whole match testable headlessly in Node, and keeps single-player independent of any backend.

## Verification

All commands were run in the workspace on Windows 11 with Node 22.12.0 and npm 11.4.2.

- `rm -rf node_modules dist && npm ci` → `added 159 packages`. `npm audit` reports 3 advisories,
  all in the dev-only Vitest runner (`tinypool`, `@vitest/mocker`). `npm audit --omit=dev` →
  `found 0 vulnerabilities`.
- `npm test` → **6 files, 49 tests passed, 0 failed** (≈ 19 s). Coverage:
  - content curves and loot tables
  - storm timings and validity
  - shields and Aegis recharge order
  - weapon cadence, semi-auto, reload, hit zones, pellet caps, rail projectile
  - kill attribution, assists, exact death cache and winner
  - inventory: stacking, ammo caps, hold-to-swap, swap/drop, chests
  - heals and cancellation, shield flask and Aegis cell
  - utilities: mist, grapple
  - movement: speeds, stamina, slide, jump apex, mantle, swim, zipline, ascender, vent, freefall, fall damage, walls
  - a full 24-bot match to a single winner with unique placements 1–24
  - determinism and replay-log reproduction
  - interest filtering for players and spectators
  - action validation
  - island manifest, a weapon in every cluster, nav pathing into Aerie Market
- `npm run soak` (24 bots, standard pace, seed 42) ran to completion several times while I tuned.
  One run went the full schedule to a winner at an 861 s match clock (≈ 14.4 min plus staging),
  at 0.74 ms per tick. Other seeds ended earlier (495–602 s) because the bots eliminated each other.
- `npm run build` → `tsc --noEmit` clean, then `vite build` gives `dist/index.html` plus one JS
  bundle of 5.43 MB (1.24 MB gzip) and CSS. All asset URLs are relative (`./assets/...`).
- `node scripts/screenshot.mjs --practice=1 --seed=21 --shots=45,60,90,120 --main=60` serves
  `dist/` only under `/play/claude-opus-5.5-high/skybreak/` on port 5452 (stopped afterwards). It
  drives headless system Edge with SwiftShader WebGL 2 and loads the menu, the Practice Range and
  an autopilot solo match with **0 console errors**. Screenshots:
  - `oneshot/screenshot.png`: a fight in Aerie Market with a shield hit marker and damage number, 1280×720
  - `oneshot/menu.png`
  - `oneshot/practice.png`
  - `oneshot/gameplay-45s.png`: insertion
  - `oneshot/gameplay-90s.png`: the autopilot seat was eliminated (#20); spectator panel following another player, kill feed, Riftstorm wall
  - `oneshot/gameplay-120s.png`
- **Not verified**:
  - I did not play with a real mouse and keyboard; pointer lock cannot be exercised headlessly.
    Interactive controls are verified only through simulation tests and the autopilot run.
  - Frame rate on real GPU hardware (SwiftShader timing is meaningless).
  - Firefox and Safari.
  - Audio output (procedural; no audible check).
  - Any network-condition behaviour.

## Assumptions and deviations

- **No backend.** Per the one-shot rules, the authoritative match runs in-process. That means no
  real client prediction, reconciliation, lag compensation, delta compression or reconnect, though
  the protocol has sequence numbers and interest-filtered snapshots ready for it. Snapshots go to
  the client every tick (30 Hz), and remote actors are interpolated one tick behind.
- **Physics.** I used shared custom AABB/heightfield collision rather than Rapier WASM. It is the
  same code on "client" and "server", and the island manifest hash covers it.
- **Assets.** Everything is procedural; there are no glTF/KTX2 files. The island is generated at
  load (≈ 0.5 s) rather than streamed in cells.
- **Phase 0.** The brief's first circle is 430 m, so the field "forms" at 430 m after 90 s of a
  whole-island field. Storm, fall and hazard damage go straight to Health.
- **Timings.** Supply capsules arrive at phases 3–5 (after zone 2). The endgame is three moving
  45 s legs at 30 m and then a 45 s collapse.
- **Short pace.** An optional "Short" match length (timings × 0.45) is offered in the menu for
  quicker sessions. Standard follows the brief.
- **Pausing.** Single-player only: the local simulation pauses while the pause menu is open (the
  mouse is not captured), but not while the map or inventory is open, or while spectating.
- **Grapple.** Grapple Spool is a single slot with 3 charges (the `stack` field holds the charge
  count).
- **Free-look and walk.** Free-look is limited to the skiff, freefall and glide. Walk is on
  CapsLock because Alt is free-look.
- **Not implemented.** Melee is a simple 20-damage cone. There are no doors, no Duos/Squads, and
  no H holster or V inspect.
- **Autopilot.** `?autoplay=` drives your seat with the bot AI so screenshots can be captured
  headlessly. The screenshots are genuine frames of the production build, but the "player" in
  them is AI-controlled.

## Known issues and limitations

1. Bots navigate a 1 m grid with local A*. They sometimes snag on building corners or
   foundations, waste time, and a few die to the storm. Combat cover use is implicit.
2. Performance is unmeasured on real hardware. Actors are about 8 draw calls each, loot uses
   instancing and per-weapon merged meshes, and shadows re-render static cells near the player.
   The 60 FPS target is plausible but unproven. The JS bundle is 5.4 MB (Babylon is not
   tree-shaken).
3. No real multiplayer or services, and the network acceptance tests (RTT/loss) are not addressed.
4. The camera can clip close to walls in tight interiors.
5. The visuals are stylised low-poly boxes: no animation rigs, ragdoll or LOD/impostors.
6. Supply capsules and the caravan are simple. The caravan follows waypoints at a fixed altitude,
   and its shield takes damage from any hitscan ray that passes near it.
7. There are no surface-specific footsteps and no audio occlusion. Captions and visual sound
   indicators give an eight-way direction only.

## Self-assessment

- **Playability: 6/10.** The full loop works end to end with readable feedback, but I couldn't
  hand-test feel with a real mouse, and bot pathing is imperfect.
- **Visual polish: 5/10.** The palette and HUD are cohesive, and the storm, sky and wing-sails
  read well, but characters and buildings are primitive box art.
- **Brief fidelity: 5/10.** The rules, content tables, storm, traversal, items, bots and UI follow
  the brief closely, while networking, Rapier, streamed assets, services and tooling are missing.
