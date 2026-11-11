# ONESHOT REPORT — Meridian Run (claude-opus-5.5-high)

## Summary

I built a playable vertical slice of Meridian Run. It is an original Babylon.js/TypeScript urban sandbox set in a procedurally built 900 × 900 m South Quay district, with walking, eight drivable vehicles, live traffic and pedestrians, weapons, and a five-tier evidence-based Alert police system. The core loop runs end to end: New Game, the motorcycle tutorial job, free roam, four story jobs and three repeatable activities, cash and Trust, shops and gear, and saving and reloading (IndexedDB with journal, backups and migrations). The simulation is deterministic, has no DOM dependencies and is covered by 83 headless tests. Rendering uses thin instances, district cells streamed in priority rings, and procedural textures and audio, so the game ships zero external assets.

## Brief coverage

| System / acceptance criterion | Status | Note |
|---|---|---|
| URL launch → New Game → tutorial delivery → free roam → save → reload | Done | Covered end to end by a sim test (`missions.test.ts`). The browser run was scripted through New Game and gameplay scenarios. |
| Walk / jog / sprint / crouch / jump / vault / mantle / swim | Done | Tested (stamina, jump apex 0.85 m, vault, mantle, swim-out). No ladders or fire escapes. |
| Aim / fire / reload / gadgets / damage / heal / death & checkpoint recovery | Done | Hitscan with camera ray then muzzle ray, hit zones, thin-cover penetration, armor, regen up to 30, medkits, clinic respawn with a fee. |
| Eight vehicles, enter/exit all, drive/brake/reverse/handbrake, collide, damage, stall, repair, motorcycles | Done | Tire-slip model with assists. Enter/exit tested for all eight. Damage, stall and garage repair work. Motorcycle lean and crash ejection. Damage has no deformation; paint just darkens and smoke appears. |
| Carjacking occupied vehicles; locked/unlocked tags | Done | Driver flees and the theft is reported through witnesses. About 30% of parked cars are locked. |
| Traffic: lanes, signals, crosswalks, obstruction, emergency pull-over, recovery, no spawn in view | Done | IDM drivers. A 2-minute test shows zero red-light runs and every spawn ≥ 89 m away. Only one lane change rule (lane chosen at spawn); there is no mid-block lane changing. |
| Pedestrians: routes, crossings, activities, conversations, varied danger reactions, witness calls, despawn | Done | Tested. About 42 nearby at density 1. The 18 nearest are full thinkers. No impostors or far LOD. |
| Crime evidence via witnesses/cameras/police; escalation; portals; pursuit→search; disguise; cooldown | Done | Covered by 11 police tests: LOS witness, 2–5 s call, chirper interrupt, police-instant, outfit disguise, cooldown to 0. |
| Arrest at low threat; capped escalation | Done | Comply by holding E: fine, long-gun ammo confiscated, respawn at precinct. Resisting escalates. Max 6 cars. Tier 5 is reserved for missions; no mission uses it. |
| Roadblocks (T3), spike strips & drone (T4) | Partial | Implemented and they spawn out of view ahead of you. Only verified that they run without errors, not tuned for fun. |
| 4 story missions: start/complete/fail/retry/abandon/replay/cleanup | Done | Graphs validated. First Shift completed in the live sim. The other three are tested through the runtime with a mock host (branching, failure, checkpoint retry, abandon cleanup). Missions 2–4 have **not** been hand-played end to end in a browser. |
| 3 activities generating valid targets, scoring, paying once | Done | Courier (fragile/urgent/quiet), Street Circuit (3 laps, local ghost, reset penalty, assists recorded), Recovery Calls. |
| Six+ enterable interiors | Done | Safehouse, store, kiosk, garage, police lobby, freight shed and port office, built as walk-in rooms whose roofs hide when you're inside. |
| Map / GPS / phone, legend & filters, waypoint | Done | GPS uses A* on the road graph and recomputes every 0.8 s. |
| Economy / Trust (no stat grind) | Done | Trust unlocks stock and outfits only. |
| Day→night & weather transition | Done | The clock covers 8 game hours per 45 real minutes. Rain and wet roads after the finale, or when resting at night after it. |
| Save/load/recovery, migrations, interrupted write | Done | Tested with fixtures. Saves happen at the safehouse and after each job. |
| Settings & accessibility | Done | Quality, dynamic resolution, FOV, densities, rebinds with conflict detection, assists, subtitles, reduced motion, photosensitivity, colorblind mode. |
| Audio: vehicles, weapons, ambience, sirens, two radio stations, streamer mode | Partial | All procedural Web Audio. Engine sound for the player's vehicle only. No reverb or occlusion zones. |
| Streaming: cells, priority rings, no void | Partial | 81 cells built within a per-frame budget, with velocity look-ahead and an always-loaded collision layer. It is construction streaming, not asset download. No HLOD or impostors. |
| Benchmark route / results | Partial | A 30 s camera flight in Settings reports median FPS and the 1% low. I did not record a result on target hardware. |
| 60 FPS target hardware | Not verified | Babylon reported 60 FPS in headless Edge on this machine, which is not a meaningful benchmark. |
| Rapier physics, Web Worker routing, KTX2/glTF pipeline, cloud adapter, leaderboards | Not started | Deliberate deviations; see below. |
| No proprietary IP | Done | Everything is original and generated at runtime; see `ASSETS.md`. |

## Architecture

- **Stack:**
  - TypeScript (strict) + Vite 6, `base: "./"`.
  - **Babylon.js 7.54** for rendering, using WebGL 2 with no WebGPU path.
  - **React 18** only for the menus, map, phone, shops, inventory, mission screens and settings.
  - A plain-DOM HUD with change-only writes and a canvas minimap.
  - Web Audio synthesis.
  - IndexedDB saves with a localStorage fallback.
  - Vitest for tests; playwright-core with system Edge for headless capture.
- **Simulation core** (`src/sim`, `src/world`): a fixed 60 Hz step with render interpolation. `Game` composes these modules:
  - `TrafficSystem`, `PedSystem`, `PoliceSystem`, `CombatSystem` and `CameraRig`.
  - The mission runtime.
  - Economy (`weapons.ts`) and persistence snapshots.

  None of it imports Babylon or the DOM, which is why the rules can be tested headlessly.
- **World:** `district.ts` deterministically generates blocks, buildings, props, colliders, interiors, anchors, terrain and water from a seed. `collision.ts` provides an AABB spatial hash, SAT for oriented boxes, ray casts and smoke-aware line of sight. `roadgraph.ts` holds the lane graph, signals, GPS and the sidewalk graph.
- **Rendering** (`src/render`):
  - Per-cell merged meshes with world-space UV facade textures and night emissive maps.
  - Thin-instanced props, characters (a shared procedural rig) and vehicles.
  - A shadow-casting sun whose frustum follows the player, plus a sky shader, glow layer, particles, and a night spot light for headlights.
- **Missions:** schema-versioned graphs that use only the `MissionHost` command/query interface. Spawns are tagged and cleaned up, rewards are keyed so they pay once, and replays use a clean authored loadout and restore your real inventory afterwards.

Main modules are listed in `docs/TECHNICAL.md`, which also holds the schemas, vehicle tuning sheet, AI state lists, compatibility matrix and accessibility checklist.

## Verification

All commands were run in the workspace on Windows 11 with Node 22.12.0 and npm 11.4.2.

| Command | Real result |
|---|---|
| `rm -rf node_modules dist && npm ci` | Succeeded. `npm audit` reports 3 vulnerabilities (1 moderate, 2 critical) in **dev-only** vitest 3.2.7 dependencies (`@vitest/mocker`, `tinypool`). An attempt to move to vitest 4.1.12 failed with an npm internal error, so I kept 3.2.7. |
| `npm test` | **8 files, 83 tests passed, 0 failed** (about 13 s wall). |
| `npm run build` | `tsc --noEmit` clean, then `vite build` succeeded in about 45 s. `dist/index.html` uses only `./` URLs. The main JS chunk is 5.37 MB (1.23 MB gzip) because Babylon tree-shakes poorly; this triggers a size warning. `sw.js` caches 15 files. |
| `node scripts/screenshot.mjs` | Served `dist/` under `http://localhost:5461/play/claude-opus-5.5-high/meridian/` and ran headless Edge 157 with ANGLE/D3D11. It reached the menu, then New Game: 25 vehicles and 23 characters. It drove a Brava with real `W` key presses to 21.5 m/s with 12 vehicles and 9 pedestrians within 80/60 m. It opened the map, phone and shop panels, forced Tier 3 and saw 3 units dispatched. **Console errors: none.** Babylon reported 60 FPS. |
| Headless sim profile (temporary test) | About 1.7 ms per 60 Hz step with 39 vehicles and 29 pedestrians. Traffic 0.8 ms, pedestrians 0.38 ms, police 0.18 ms. Props took 2.9 ms before I optimized them into a spatial grid. |

Screenshots in `oneshot/` are real captures from the production build. The main one, `screenshot.png`, shows driving with traffic. The others are `tide-market.png`, `night-rain.png`, `alert.png`, `map.png`, `phone.png`, `shop.png`, `start.png` and `menu.png`.

**Not verified:**
- No human played the game interactively with mouse look and pointer lock. All browser checks were scripted, and pointer lock does not engage in headless mode.
- Story missions 2–4 were never played through in a browser; only their graphs and runtime were tested.
- Real-GPU frame rates were not measured.
- Firefox and Safari were not tested.
- Audio was never listened to; Web Audio only starts after a user gesture, and it was not audible in headless capture.
- The rain particles did not show clearly in the headless capture.

## Assumptions and deviations

- **Physics:** custom deterministic 2.5D physics instead of Rapier WASM. It uses a planar rigid body with tire slip and per-wheel height sampling, plus AABB/OBB collision. I chose this for determinism, headless testability and one-shot risk; it sits behind small interfaces, so Rapier could replace it.
- **Routing:** route queries run on the main thread rather than in Web Workers. The graphs are small; A* takes well under 0.1 ms.
- **Streaming:** cells are built procedurally on the client, so "streaming" means budgeted mesh construction. There are no glTF/KTX2/Draco assets, HLOD, impostors or baked lightmaps.
- **Characters:** box-rig characters with procedural animation instead of skinned glTF rigs or blend trees.
- **Controls:**
  - Q cycles gadgets instead of opening a gadget wheel. In vehicles, Q changes the radio station.
  - B uses a medkit; the brief doesn't bind it.
  - Left Alt walks.
- **Clock and weather:** the clock is continuous (8 game hours per 45 real minutes) and loops through the next day. The rain-slick neon evening is triggered by finishing the finale.
- **Optional backend:** cloud saves, signed leaderboards and the content manifest are omitted. Circuit times are marked local and unverified, with assists recorded.
- **Doors:** interiors are open rooms with gap doorways. Only the freight-shed doors physically lock, as dynamic blockers during Lost Manifest.
- **Tier 5:** the district lockdown can be reached only through a mission API (`forceTier`); no shipped mission uses it.

## Known issues and limitations

- **No hands-on tuning:** without hands-on playtesting, driving feel, camera spring and AI difficulty are tuned only from numbers and tests. Story missions 2–4 may have rough spots, such as guard perception being too strict or lenient, or the van chase being too easy or hard.
- **Traffic limits:** traffic does not change lanes mid-block. Left-turn yielding is approximate, and rail cars can occasionally clip through each other inside intersections. Police AI drives the physics model with a simple pursuit controller and can get stuck on geometry; it reverses out after about 1.6 s.
- **Missing world features:** no tunnel, parking-garage levels, ladders, breakable glass or swing doors. There are no ambulances or fire trucks. Enemies don't throw grenades and there is no lean or peek. Bodies are static knocked-down poses, not ragdolls.
- **Audio gaps:** no engine sounds for other cars, no reverb zones, and no positional footsteps.
- **Bundle size:** the 5.4 MB main chunk loads in one piece, with no progressive asset download.
- **Night lighting:** street lamps are emissive only, with no light falling on the ground. The player's headlight is the only dynamic local light, so night streets read dark away from lit facades.

## Self-assessment

- **Playability: 6/10.** The full loop works and is tested end to end in the sim, with real traffic, pedestrians, police and four jobs, but the feel has never been tuned by a human playing it.
- **Visual polish: 5/10.** It is a coherent, readable stylized city with day-to-night lighting, shadows and lit windows, but the box-rig characters, flat facades and empty night streets look clearly prototype-grade.
- **Brief fidelity: 6/10.** Most systems and acceptance criteria exist in working form and honor the module split and data-driven mission graph, but several pipeline items (Rapier, workers, asset streaming, HLOD, cloud) are deliberately substituted or missing.
