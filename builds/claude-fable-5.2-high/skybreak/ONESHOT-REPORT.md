# Skybreak — one-shot report

Model: Fable 5.2 (Claude Code, high effort). Run date: 2026-11-11.

## Summary

I built a playable vertical slice of Skybreak: a third-person battle royale on an original 1.2 km island where one
human and 23 bots stage on a pier, ride a skiff, drop on wing-sails, loot nine weapons across five rarities, fight,
and rotate through the brief's full Calmfield / Riftstorm schedule until one survivor remains and a results screen
offers a requeue. The match is an authoritative, deterministic 30 Hz simulation that bots and the human drive through
the same input frames, exposed to the client only through interest-filtered snapshots over an in-process link, with
Babylon.js rendering, a React shell and fully procedural art and audio. It is a single-player "local bot mode": there
is no network server, no client prediction and no asset pipeline, and several of the brief's production systems are
simplified or absent as listed below.

## Brief coverage

| System / criterion | Status | Note |
| --- | --- | --- |
| Complete loop: launch, stage, skiff, drop, glide, loot, fight, heal, rotate, win, results, requeue | Done | Verified end to end in a headless browser, including the elimination, spectate and win paths. |
| 24-player Solo with bots filling seats | Done | Local only: 1 human + 23 bots. |
| Match duration 14-18 min | Partial | Storm table is exact (850 s of phases). Bot-only standard matches end at ~12.4 min (phase 5-6). Blitz option runs ~6 min. |
| Authoritative 30 Hz simulation | Partial | Authoritative and deterministic, but it runs in the browser tab, not on a server. |
| Networking: WebSockets, deltas, prediction / reconciliation, reconnect | Not started | `MatchLink` transport interface and loopback only. |
| Interest management | Done | 240 m actor radius, far gunfire degraded to direction-only events, private hit events; tested. |
| Lag-compensated hitscan (clamped 180 ms) | Done | Per-actor history ring; in loopback it compensates the interpolation delay. |
| Rendering: Babylon.js, WebGL 2 | Partial | Terrain chunks, thin-instanced kit, cascaded shadows, FXAA + bloom, dynamic resolution, 3 presets. No WebGPU, HLOD, impostors, baked lighting, occlusion culling. |
| Physics: Rapier | Not started | Shared simplified collision (heightfield + yaw-rotated boxes) is used by sim and camera instead. |
| World streaming / cell bundles | Not started | The whole island is generated at boot (~1 s). Collision is always present. |
| Camera | Done | 3.1 m boom, 0.55 m shoulder, ADS boom / FOV per weapon, shoulder swap, collision probe with damped return, glide and skiff cameras, spectator follow. No free camera. |
| Controls and full remapping | Done | All brief actions except inspect (V) and holster (H). No controller. |
| Movement: sprint energy, crouch, slide, jump, mantle, swim, fall damage | Done | Brief numbers; unit-tested. |
| Traversal: zipline, ascender, air vent, freefall, wing-sail, grapple | Done | Unit-tested. Bots do not use the links. |
| Health / Aegis / Reserve model | Done | Order, 8 s delay, 10/s recharge tested. |
| Nine weapons, data-driven stats | Done | Hitscan + projectile (Longwake Rail charge, Gale Launcher orbs). Cadence, ammo, zones, falloff, shotgun caps tested on representative weapons, not all nine individually. |
| Five rarity tiers with shape + colour | Done | Masterwork / Prototype are fixed stat perks with a drawback; Prototype capped per match and limited to top-tier sources. |
| Deterministic recoil + seeded bloom | Done | Recoil moves the camera so the crosshair stays truthful. |
| Aim: camera ray then muzzle obstruction check | Done | Tested against cover. |
| Eight consumables / utilities | Done | Injector, Trauma Kit, Flask, Aegis Cell, Mist Capsule, Grapple Spool, Echo Beacon (trail history only), Wind Orb. |
| Inventory: five slots, ammo caps, swap, drop, compare | Done | Hold-E swap, drag-to-swap, stat comparison arrows. No stack splitting. |
| Loot sources: floor, chests, lockers, death cache, supply capsules, caravan drone | Done | Vault at Kilnworks. Death cache holds exact items and ammo. |
| The Highwake: six named locations, eight landmarks | Done | Stylised and procedural; interiors are simple rooms; no doors. |
| Calmfield / Riftstorm: all phases, nesting, valid final centres, moving endgame | Done | Tested over 60 seeds. |
| Supply capsules after zone 2, caravan that avoids the final zone | Done | Capsule pings are global; caravan pings are approximate. |
| Practice Range | Done | All weapons / items, dummies, damage readout, movement course. No graphics benchmark. |
| Bots: drop, loot, loadout, rotate, engage, heal, loot kills, final field | Partial | Perception by sight cone, LOS, mist, gunfire and damage direction. Cover use is basic, no traversal links, and a pacing rule lowers bot-vs-bot aggression when the lobby is ahead of the storm. |
| Main menu, appearance, career, settings, credits | Done | No queue screen (the local match starts immediately). |
| HUD: vitals, slots, ammo, minimap, timer, compass, pings, prompts, feed, hit markers, damage direction | Done | Plus damage numbers. |
| Full map with field, skiff path, marker, locations, legal pings | Done | No enemy positions are ever drawn. |
| Spectator | Partial | Follow / next / previous after elimination; no delay, no report flow. |
| Results | Done | Placement, eliminations, assists, damage, accuracy, survival, distance, storm damage, loot history, timeline, route map, standings. |
| Settings and accessibility | Partial | Preset, dynamic resolution, FOV, sensitivities, toggles, key binds, audio, visual sound indicators, reduced motion. No captions, colour-blind presets or per-feature video options. |
| Error flows | Partial | WebGL 2 missing, renderer start failure, context lost, pointer-lock fallback. Network flows do not apply. |
| Audio | Partial | Synthesised effects, loops and adaptive score; distance and simple line-of-sight filtering on gunfire. No reverb zones or captions. |
| Progression | Partial | Local mastery XP, career stats, four bodies and colours. No challenges, emotes or skins catalogue. |
| Tools | Partial | Bot soak, loot report, storm seed viewer, capture tool. No editor, replay inspector or network lab. |
| Acceptance: Practice then Solo without an account | Done | |
| Acceptance: 24-seat match stages, drops everyone, progresses phases, exactly one winner or deterministic tie-break | Done | Test + soak. All phases are exercised by the storm test; bot-only matches usually finish before the final collapse. |
| Acceptance: loot, slots, ammo caps, compare, reload, heal, Reserve, Aegis, utility | Done | |
| Acceptance: weapon rules applied by the server | Done | See weapon note above. |
| Acceptance: storm centres, display and damage | Done | |
| Acceptance: movement set server-validated, safe interruption | Partial | Validation yes; interruption recovery only partly tested. |
| Acceptance: bots without aim / vision cheats | Partial | No hidden transforms are read; behaviour depth is limited. |
| Acceptance: 120 ms RTT / jitter / loss | Not started | No network. |
| Acceptance: interest filtering incl. spectator payloads | Done | Reconnect does not exist. |
| Acceptance: streaming never exposes missing collision | Not started | No streaming, so the failure mode cannot occur. |
| Acceptance: 60 FPS target, server tick p95 | Partial | Measured on one machine only (below). |
| Acceptance: low-quality parity, remap, reduced motion, visual sound, captions | Partial | No captions or colour-blind presets. |
| Acceptance: no proprietary content | Done | Everything is procedural and original. |

## Architecture

- **Stack:** strict TypeScript, Vite, Babylon.js (`@babylonjs/core`) on WebGL 2, React 19 for menus and HUD panels,
  Web Audio for sound, Vitest for tests, Playwright (system Edge) for captures. No backend, no runtime assets.
- **Why:** it follows the brief's direction (Babylon, React shell, authoritative shared simulation) while keeping
  the whole thing a static site. The simulation has no DOM or engine imports, so the same code runs in the browser,
  in tests and in the soak tool.
- **Modules** (mapped to the brief's names):
  - `src/shared/protocol`: inputs, action requests, snapshots, events, `MatchLink`.
  - `src/shared/content`: weapons and rarity, items, loot tables, storm phases, movement constants.
  - `src/shared/world`: island source (heightfield, kit, locations, sockets, links), collision, nav grid.
  - `src/server/match`: lifecycle, actors, movement controller, combat, loot rolls, storm, results.
  - `src/server/spatial`: interest filtering. `src/server/bots`: bot brains.
  - `src/client/runtime`: loopback link, input, settings / profile. `src/client/renderer`: world, rigs, VFX.
  - `src/client/audio`, `src/client/ui`, and `src/client/game.ts` (camera, event presentation, HUD read model).
- More detail in `docs/ARCHITECTURE.md`; threat model, accessibility checklist and compatibility in `docs/NOTES.md`;
  generated reports in `docs/reports/`.

## Verification

Final pass from a clean state (`node_modules` and `dist` deleted first), Node v22.12.0, npm 11.4.2, Windows 11:

| Command | Result |
| --- | --- |
| `npm ci` | Installed cleanly, 0 vulnerabilities reported. |
| `npm test` | **54 passed, 0 failed** across 4 files (content / storm / loot, movement, combat, match + inventory + interest). ~5.5 s. |
| `npm run build` | `tsc --noEmit` clean, then Vite build: `dist/index.html` 16 kB, main chunk 6,804.68 kB (1,549.93 kB gzip), CSS 15.95 kB, 217 files in `dist/assets`, 8.1 MB total. `index.html` contains no root-absolute URLs. |
| `npm run soak -- 8 standard` | 8/8 matches ended with exactly one winner; active duration 658-676 s (732-749 s including staging and skiff); highest storm phase 5-6; 20-23 eliminations; server tick mean 0.05-0.13 ms, p95 <= 0.43 ms. Output in `docs/reports/bot-soak-standard.txt`. |
| `npm run soak -- 8 blitz` | 8/8 OK, 268-304 s active. `docs/reports/bot-soak-blitz.txt`. |
| `npm run loot-report` | ~3.75 floor weapons per player, ~6.35 including containers; every location had at least one floor weapon in all 40 setups. `docs/reports/loot-report.txt`. |
| `npm run storm-seeds` | All sampled seeds nested; lowest land coverage of any phase 3-5 field was 96%. `docs/reports/storm-seeds.txt`. |
| `npm run dev` | Smoke-tested: server on port 5350 returned 200 for the page and source modules; stopped afterwards. |

Browser checks: `node tools/screenshot.mjs <scenario>` serves `dist/` from
`http://127.0.0.1:5351/play/claude-fable-5.2-high/skybreak/` and drives headless Microsoft Edge (ANGLE D3D11 on an
NVIDIA RTX 2080 Ti, WebGL 2). Every scenario finished with **no console errors and no failed requests**:

- `menu`: boot to the main menu from the sub-path.
- `practice`: walk to the rack, pick up a weapon with E, fire at a dummy, switch quality low / high / medium live,
  pick up and throw a Mist Capsule. Measured 130 fps at 1280x720.
- `match`: staging, ready-up, skiff, full map, jump, freefall, early sail deploy, glide, landing, walking to loot and
  picking it up, inventory screen. Measured 131 fps at 1280x720 and 129 fps at 1920x1080 (earlier build, same scene).
- `hero`: drop on the Aerie Market, loot a weapon, get shot at and return fire. This produced `oneshot/screenshot.png`.
- `flow`: an idle player, fast-forwarded with a capture-only time scale: auto-drop, elimination card, spectating,
  match end, results screen, "Drop again" requeue.
- `victory`: all other players eliminated through the server's damage call, to confirm the win banner and results.
- `survey`: aerial captures of the locations to eyeball world-building.

What I could **not** verify:

- **No human played this build.** All browser input was synthetic keyboard and mouse events, and headless Chromium
  cannot take pointer lock, so the capture tool uses a debug hook that treats the pointer as captured. Real
  pointer-lock mouse look, mouse feel and sensitivity are untested.
- **Audio was never listened to.** The Web Audio code ran without errors in the muted headless browser; mix, loudness
  and whether the synthesised sounds are pleasant are unknown.
- Firefox, Safari and Chrome proper were not run. Only Edge on one Windows machine with a strong GPU was measured,
  so the frame rates say nothing about mid-range hardware. Draw calls and memory were not measured.
- Nothing about networking (latency, loss, reconnect) could be tested because there is no network layer.
- A complete match played by a human from drop to win was not performed; the win path was checked with forced
  eliminations and bot-only matches.

## Assumptions and deviations

- **Local bot mode stands in for the server.** The brief's server, matchmaking, services, replay and anti-cheat
  pipeline are out of scope for a static one-shot; the code keeps the server / client split so a socket could replace
  the loopback.
- **Rapier is replaced** by a small shared collision layer. Mantle targets must be structures or rocks, not terrain,
  to prevent cliff climbing.
- **Jump speed is 6.66 m/s**, tuned so the discrete 30 Hz integration reaches the brief's ~0.9 m apex.
- **Phase 0 interpretation:** the island is safe for 90 s with the first 430 m field shown dormant; at phase 1 the wall
  becomes lethal and contracts from 430 m.
- **The Riftstorm, falls and nothing else bypass shields.** Storm damage hits Health directly so Aegis recharge cannot
  cancel low-phase storms; heat channels go through shields.
- **Staging can be shortened** with Enter because every other seat is a bot. The storm clock starts when the jump
  window closes, not at skiff launch.
- **Blitz pace** (0.4x storm timers) was added so a full match can be seen in about six minutes. Standard is default.
- **Bot pacing rule:** when fewer players are alive than the storm phase expects, bots avoid optional fights with each
  other (they still defend themselves and always contest the human). Without it bot-only matches ended in ~5 minutes.
- **Heals are consumed at the start** of the channel and heal gradually; shield items are consumed on completion.
- **Ammo is picked up automatically** when walked over; other loot uses E.
- **Attachments** are represented as fixed stat perks on Masterwork / Prototype weapons, not separate items.
- **G** selects a throwable if one is not selected, then throws on the next press.
- **No queue screen, doors, squads UI, vehicles or crafting.** Unfinished features are hidden rather than stubbed.
- **Capture hooks:** `window.__skybreak` exposes the game object, and the loopback link has a `timeScale` field
  (always 1 in play) used only by the capture tool.

## Known issues and limitations

- Untested by a human and unheard, as stated above. Treat feel and audio as unverified.
- The local player is rendered from interpolated authoritative state with no prediction, so movement responds one to
  two ticks (33-66 ms) after input. Camera rotation is immediate.
- Bots can get stuck on geometry, cluster around the next field, never use ziplines, ascenders, vents or grapples,
  and use cover only when healing. Their aim is noise-limited but not human-like.
- Characters do not collide with each other.
- Interiors are bare rooms, ground surfaces are flat colour with a grain texture, and characters are blocky
  procedural rigs with procedural animation. There are no LODs.
- Shadows are convincing near the camera and weak at distance; hills do not cast shadows.
- The JavaScript bundle is 6.8 MB (1.55 MB gzip) because Babylon is imported from its barrel and not code-split.
- `Ctrl+W` cannot be intercepted by a web page. Crouch is also on `C`, and a leave-page confirmation is armed during
  matches, but crouch-walking forward with Ctrl will still raise the browser's close prompt.
- Re-acquiring pointer lock immediately after pressing Esc can be refused by the browser; a "Click to take control"
  overlay covers that case.
- Bot-only standard matches finish a little under the brief's 14-minute floor.
- The results "survived" tile and the standings row for a winner can differ by a few seconds.
- No captions, colour-blind presets, controller support, free camera, reports or replays.
- The island is generated on the main thread at boot; there is a loading screen but no progressive streaming.

## Self-assessment

- **Playability: 7/10.** The full loop works start to finish with real combat, looting, storm pressure and a results
  screen, but it has not been felt by a human hand and has no client prediction.
- **Visual polish: 6/10.** The island, sky, storm, HUD and menus are cohesive and readable, while characters,
  interiors and ground detail are clearly procedural placeholders.
- **Brief fidelity: 6/10.** Gameplay rules, content tables, storm, loot, UI and module boundaries follow the brief
  closely, but networking, Rapier, streaming, the asset pipeline and most services are absent or simulated locally.
