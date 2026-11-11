# Meridian Run — technical notes

## Module map (brief architecture → source)

| Brief module | Source | Notes |
|---|---|---|
| app-shell | `src/main.ts`, `src/ui/app.tsx` | boot, WebGL 2 check, loading, menus, error/recovery screens, PWA registration, benchmark |
| game-session | `src/sim/game.ts` (`advance`, `step`) | fixed 60 Hz step with render interpolation, pause, clock/weather, autosave hooks |
| world-streaming | `src/world/district.ts`, `src/render/world-render.ts` | always-loaded data layer; 9×9 visual cells built in priority rings within a per-frame budget |
| character | `src/sim/character.ts`, player parts of `game.ts` | capsule locomotion, vault/mantle/swim, interaction, combat |
| vehicles | `src/sim/vehicle.ts`, `src/sim/drive-ai.ts` | dynamics, damage, assists, AI steering controller |
| traffic | `src/sim/traffic.ts`, `src/world/roadgraph.ts` | lane graph, signals, IDM drivers, recovery, parked cars |
| pedestrians | `src/sim/peds.ts` | schedules on the sidewalk graph, activities, reactions, witnesses |
| police | `src/sim/police.ts`, `src/sim/combat-ai.ts` | crime evidence, identification, dispatch, pursuit/search, arrest |
| missions | `src/sim/missions/*` | graph runtime, four story graphs, three generated activities |
| renderer | `src/render/*` | Babylon.js scene, thin-instanced actors/props, sky, water, VFX |
| audio | `src/audio/audio.ts` | procedural engine/tire/siren/weapons/ambience, two generative radio stations |
| ui | `src/ui/hud.ts`, `src/ui/app.tsx` | DOM HUD with batched writes and canvas minimap; React for menus/map/phone/shops/settings |
| persistence | `src/persistence/save.ts` | storage adapters, journal, backups, migrations, import/export |
| tools | `scripts/*`, Settings → benchmark, `tests/*` | sub-path server, headless capture, benchmark flight, simulation tests |

The simulation (`src/sim`, `src/world`, `src/persistence`) never imports Babylon or the DOM, so all of it runs headless under vitest.

## World data ("cell" contract)

- `District` (`generateDistrict(seed)`): `blocks`, `buildings` (AABB footprints with base/top Y, style, palette, cell index), `props` (type, transform, breakable flag), `colliders` (AABB plus a Y range, with `kind` and a `thin` cover tag), `interiors` (rect, doors, partitions), `interacts`, `landmarks`, `reserved`, `spawns`.
- Terrain is an analytic height function: Lantern Hill is a smoothstep rise, the harbor and canal are cut-outs, bridge decks override the canal. Water surfaces are flat at −0.8 m.
- Cells are 100 m squares (`cellIndexOf`). The render side merges each cell's ground, roads, sidewalks, markings, facades and interiors into about 8 meshes. Collision and navigation data are always loaded, so there is a safety ring ahead of the visuals.

## Road and pedestrian graphs

- `RoadGraph.nodes`: 81 intersection slots on the irregular grid, minus removed edges (plaza, freight block, two canal crossings without bridges, Lantern park). Each node carries `signal` (degree ≥ 3) and half-widths.
- `Lane`: a directed lane with an index from the inside lane. Stop lines sit outside the crosswalks. `nextLanes` enforces lane discipline: left turns from the inner lane, right turns from the outer lane, no U-turns. `connector()` builds quadratic Bézier turn paths.
- Signals use a 34 s two-phase cycle: green 13 s, yellow 3 s, all-red 1 s. Each node has an offset to create green waves. Pedestrians walk during the parallel green, first 9 s only. Missions may only call `requestPhase(node, axis, now, duration ≤ 20 s)`.
- The pedestrian graph is built from sidewalk strips with merged corner nodes. Its crosswalk edges carry a signal reference. Points of interest (stalls, benches, viewpoint) attach to nearby nodes when there is line of sight.
- GPS: A* over intersections, projected onto the nearest road at both ends and recomputed every 0.8 s, so it updates after a missed turn.

## Mission graph schema (v1)

`MissionDef { schema, id, title, giver, kind, blurb, reward, parTime, start, nodes, fail[], rewardKey }`

Node types are `start`, `objective`, `dialogue`, `branch`, `trigger`, `spawn`, `world`, `checkpoint`, `fail`, `reward`, `cleanup` and `end`. Objective kinds:

- `reach`
- `enterVehicle`
- `interact`
- `interactAll`
- `lockpick`
- `survive`
- `escapeAlert`
- `leaveArea`
- `stopVehicle`
- `deliverVehicle`
- `circuit`

Optional goals are `time`, `noAlert`, `noDamage`, `flag` and `noCivHarm`. Global fail conditions are `playerDead`, `vehicleDestroyed`, `cargoBelow`, `vehicleEscaped`, `alertAbove` and `packageBroken`.

Missions talk to the world only through `MissionHost`, a set of typed queries and commands. Spawn requests are `guard`, `npc`, `vehicle`, `wave` and `door`. Vehicles that chase or flee are placed on lanes 120–260 m away and out of camera view. `validateMission()` checks node references and that an end node is reachable.

Rewards are keyed (`story:<id>`, `courier_<seed>`, `circuit:first_finish`, `recovery_<seed>`) and paid once. Replays never pay.

## Save schema (v3) and recovery

`SaveSnapshot { version, savedAt, label, player{x,z,yaw,health}, inventory, progress{storyDone, grades, rewarded, discovered, circuitBest, circuitGhost, circuitAssists, courierRuns, recoveries}, world{hour, rain, day}, stats }`

- Each save is wrapped in an envelope with an FNV-1a checksum.
- Write order: journal → rotate backups (3) → slot → delete journal.
- On boot, `recover()` commits any valid journal that is newer than its slot.
- `load()` falls back from slot to journal to backups.
- Migrations: v1 renames `money` to `cash` and adds the world block; v2 adds activity progress and stats.
- Fixtures for the migrations and for an interrupted write are in `tests/save.test.ts`.
- The player's position is saved only at a safe location (last on-foot, unwanted, dry spot outside a mission), so a save never captures the middle of a crash.

## Vehicle tuning sheet

| Model | Class | Mass kg | Drive | Engine N | Top m/s | Brake N | μ | Stiff F/R | Max steer | Durability |
|---|---|---|---|---|---|---|---|---|---|---|
| Pella Compact | compact | 1050 | FWD | 5200 | 44 | 11000 | 1.05 | 9 / 9.5 | 0.62 | 85 |
| Varro Sedan | sedan | 1380 | FWD | 6800 | 50 | 14500 | 1.05 | 9 / 10 | 0.58 | 100 |
| Osprey Tourer | sedan | 1520 | AWD | 8200 | 53 | 16000 | 1.10 | 9.5 / 10 | 0.56 | 110 |
| Brava GT | muscle | 1560 | RWD | 11500 | 62 | 17000 | 1.08 | 9.5 / 8.8 | 0.56 | 115 |
| Quayline Hauler | van | 2300 | RWD | 9000 | 38 | 20000 | 0.95 | 8.5 / 9.5 | 0.60 | 140 |
| Warden Interceptor | police | 1650 | AWD | 11000 | 58 | 18500 | 1.12 | 9.8 / 10.2 | 0.56 | 140 |
| Kestrel 250 | moto | 230 | RWD | 1650 | 38 | 3400 | 1.15 | 11 / 11.5 | 0.70 | 60 |
| Vanta 800 | moto | 260 | RWD | 2700 | 56 | 4400 | 1.20 | 11.5 / 11 | 0.65 | 60 |

Surface grip multipliers: asphalt 1.0 (−15% when wet), concrete 0.96, metal 0.82, gravel 0.72, dirt 0.70, grass 0.66, shallow water 0.55.

**Model:**
- Bicycle-model slip angles with a saturating tire curve that falls off slightly past its peak.
- Longitudinal load transfer, and a traction circle on each axle.
- The handbrake cuts rear grip to the per-model `handbrakeGrip` value.
- Speed-sensitive steering and smoothed keyboard input.
- Below 1.5 m/s the model blends into a kinematic model; above that it applies a stability assist (yaw damping toward the kinematic target).
- Slope gravity, an airborne state, and per-wheel height sampling that drives the visual suspension.

Telemetry: `window.__meridian.game.player.vehicle` exposes `rpm`, `gear`, `slip`, `susp[]`, `health` and `lastImpact` in the browser console.

## AI state documentation

- **Traffic** (`TrafficState`): Cruise, Follow, StopSignal, Yield (left turn or blocked box), Turn, PullOverEmergency, Panic, CollisionRecovery, Rejoin, Abandoned.
  - Rails drivers use the IDM with a cautious, normal or impatient profile.
  - After a contact the car switches to full physics, brakes, then steers back onto the nearest lane. If it can't within 15 s, the driver abandons it.
  - Despawning only happens out of view or beyond 260 m.
- **Pedestrians** (`PedState`): WalkRoute, WaitSignal, CrossStreet, Browse, Sit, Talk, WorkLoop, ReactCurious, AvoidObstacle, Panic, Flee, Hide, CallEmergency, AssistInjured, Down, Despawn.
  - Each pedestrian has its own reaction delay and bravery, so a crowd doesn't react as one.
  - The 18 nearest run decisions every tick; the rest decide every third tick.
- **Combat** (`CombatState`): Patrol, Guard, Investigate, Engage, Cover, Flank, Retreat, Chase, Arrest, Search, Return.
  - Cover points are sampled positions where a crouched line of sight is blocked but a standing one is clear.
  - Guards build suspicion based on distance, crouch, sprint and night.
- **Police** (`IdState`): Unnoticed, Witness Reporting, Identified, Pursuit, Search, Cooling.
  - Search times by tier: 22 / 30 / 40 / 52 / 65 s.
  - Units per tier: 1 / 2 / 3 / 4 / 5, with a global cap of 6 cars and an incident budget of 2 + 2×tier.

## Performance notes

- Actors are drawn with thin instances: about 10 draw calls for every human and about 20 for every vehicle.
- Props are thin-instanced globally, and each cell merges its geometry into about 8 meshes.
- Headless simulation profile (Node, 39 vehicles and 29 pedestrians around the player): about 1.7 ms per 60 Hz step. Traffic takes 0.8 ms, pedestrians 0.38 ms, police 0.18 ms.
- The browser frame rate was only measured on this machine in headless Edge; see the report.

## Deployment

`npm run build` produces a fully static `dist/` with relative URLs (`base: "./"`) and a generated `sw.js`. It can be hosted on any static host under any sub-path, with no server logic. To verify sub-path hosting locally, run `node scripts/serve.mjs` and open `http://localhost:5461/play/claude-opus-5.5-high/meridian/`.

## Browser compatibility (as verified)

| Browser | Status |
|---|---|
| Edge 157 (headless, Windows, ANGLE/D3D11) | Verified: loads, renders, plays scripted scenarios with no console errors |
| Chrome | Not separately verified; same Chromium engine |
| Firefox | Not verified |
| Safari | Not verified (best effort per brief) |

## Accessibility checklist

| Feature | Status |
|---|---|
| Subtitles for all dialogue, barks, dispatch and radio IDs (toggle and size) | Implemented |
| Reduced motion (no camera shake or recoil kick) | Implemented |
| Photosensitivity mode (steady lightbars, no flashing beacon; lightbars flash at ≤ 2 Hz otherwise) | Implemented |
| Colorblind markers (patterned beacon, yellow search area) | Implemented |
| Rebindable keys with per-context conflict warnings; hold or toggle for aim and sprint | Implemented |
| Driving assists (stability, traction control) | Implemented |
| Density settings for traffic and pedestrians | Implemented |
| Reduced quick-time input | Not applicable: there are no QTEs; the only timing minigame is the optional lock bypass, and the front-gate route skips it |
| Screen reader support for menus | Not done |
