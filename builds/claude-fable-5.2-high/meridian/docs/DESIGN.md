# Meridian Run: design notes, schemas and AI states

This describes what the slice actually implements. Where it is thinner than the brief, that is said here or in `OPERATIONS.md`.

## Layers

`Sim` (`src/game-session/sim.ts`) is a headless, fixed-step (60 Hz) simulation with no rendering, audio or DOM code. It owns every gameplay system and is what the tests run. `Game` (`src/game-session/game.ts`) wraps it in the browser: an accumulator steps the sim up to four times per frame, the renderer interpolates vehicles and characters between the last two steps, and screens other than play pause the sim.

Step order: clock/weather → signals → player → traffic → pedestrians → foot actors → dispatch → Alert state → missions → gadgets → vehicle forces → Rapier step → vehicle read-back and impacts → character/vehicle contact resolution → prop streaming.

Systems talk through typed calls on `Sim` and a small typed event bus (`src/core/events.ts`): noise, sfx, vfx, subtitles, impacts, alert changes.

## World data

### District source (`src/world/district.ts`)

- Two arrays of grid lines (`XE`, `ZE`), each with a road class (`arterial` 16 m, `collector` 12 m, `street` 8 m). Index 0 and 9 are the district border.
- A segment between two intersections is `road`, `ped` (pedestrianised) or `none` (lot strip). Overrides are authored: Market Street beside the plaza and the Lantern Hill stair street are pedestrian; Anchor Street and Ledger Street have no canal bridge.
- A 9 × 9 block table assigns each block a zone and a lot type (`bld`, `plaza`, `park`, `yard`, `docks`, `parking`, `canal`, `warehouse`, `port`, `police`, `safehouse`, `tower`, `garage`, margins and quays).
- `terrainH(x, z)` is the single height function (hill, kerbs, flood channel, slipways, sea floor). The physics heightfield samples it on a 2 m grid, and the ground meshes sample it at the same points for canal and coast blocks. `surfaceY` adds bridge decks for kinematic agents.
- `ANCHORS` is the list of named gameplay positions. Missions, shops and spawns refer to anchors, not raw coordinates. A test checks that no anchor sits inside a building.

### Lots (`src/world/lots.ts`)

Deterministic generation from a fixed seed produces: `buildings` (footprint, base, top, facade style, tint), `parts` (boxes, cylinders, ellipsoids, cones, prisms with a colour, a collide flag and a glow mode), `dynProps`, `lamps`, `parkSpots`, `cameras`, `vendorSpots`, `browseSpots`, and the two mission compounds (`WAREHOUSE`, `PORT`) with their own anchors and patrol routes. Colliders are always simple cuboids or cylinders built from this data, never render meshes.

### Cells and streaming (`src/renderer/city.ts`)

The district is cut into 100 m cells. Per cell:

| Always resident | Streamed (detail) |
|---|---|
| Ground mesh (whole district is built at load) | Textured facades (one merged mesh) |
| Landmark parts (anything ≥ 4.5 m, beacons) | Small props |
| Banded HLOD boxes for the buildings | Night-glow and always-glow parts |

Each frame the nearest cell inside the detail radius that lacks detail is built (one per frame); the ring is evaluated around both the camera and a point 2.5 s ahead along its velocity. Cells beyond the radius plus 60 m drop their detail and show the HLOD again. Physics colliders and the lane, sidewalk and route graphs are always loaded, so collision and navigation never wait for visuals. Dynamic props exist physically only within about 85 m of the player.

### Road, lane and sidewalk graphs (`src/world/roads.ts`)

- `Lane`: a polyline with cumulative lengths, speed, direction, lane index, the intersection it runs into, and `next` connectors. Arterials have two lanes each way with an `adjacent` link for lane changes. Traffic keeps right.
- Connectors are generated per intersection for straight, right and left movements (quadratic curves for turns). No lane is a dead end unless it leaves through a portal.
- `Signals`: a 24 s cycle per signalised intersection with a per-intersection offset. `walkAllowed` gives pedestrians a protected phase. `requestPhase` is the narrow mission API.
- `routeNodes` + `roadRoute`: A* over intersections for the GPS. `laneRoute`: Dijkstra over lanes and connectors for AI drivers.
- `walkNodes`: sidewalk corner and mid-block door nodes per block, crosswalk edges tagged with the intersection and the axis they cross, plaza/park points of interest, and canal crossings only where a bridge exists.

## Vehicles (`src/vehicles`)

One model for every vehicle. Per wheel, each step:

1. Ray from the hard point along the body's down axis against static world only.
2. Suspension force `k·compression − c·compressionRate`, with a stiff bump stop, applied along the ground normal.
3. Tyre: the contact velocity is split into forward and side components on the ground plane. The side impulse tries to cancel side slip; drive and brake impulses act along the forward axis; both are limited by a friction circle `μ·N·dt` with slightly lower sliding friction. The handbrake locks the rear wheels and cuts their side grip.
4. Impulses are applied part-way up towards the centre of mass (`rollInfluence`) to tame roll.

On top: speed-sensitive steering with input smoothing, traction control, counter-steer assist, drag and rolling resistance, light downforce, airborne levelling, motorcycle auto-balance (the physics body stays upright; lean is visual), automatic flip recovery, and a custom sleep state for empty parked vehicles. Impacts are detected from the horizontal velocity change across the physics step and feed damage zones (front: engine; side: steering pull; tyres can burst from gunfire).

Tuning sheet (`src/vehicles/specs.ts`), with numbers measured by `tests/vehicle.test.ts` on a flat arterial:

| Vehicle | Class | Mass kg | Drive | Speed after 5 s (m/s) | Stop distance from that speed (m) |
|---|---|---|---|---|---|
| Kestrel Dart | compact | 1050 | FWD | 21.6 | 20.6 |
| Moreno Tern | sedan | 1350 | FWD | 21.7 | 21.1 |
| Halden Coaster | hatch | 1180 | FWD | 20.4 | 18.9 |
| Brask Cutlass | muscle | 1600 | RWD | 27.3 | 30.9 |
| Halden Portage | van | 2300 | RWD | 16.7 | 14.7 |
| Halden Warden Interceptor | police | 1750 | AWD | 30.0 | 36.6 |
| Kestrel Swift 250 | motorcycle | 280 | RWD | 27.6 | 30.3 |
| Ostrava Sirocco | motorcycle | 320 | RWD | 33.4 | 40.8 |

## AI states

### Traffic drivers (`src/traffic/traffic.ts`)

`Cruise`, `Follow`, `StopSignal`, `YieldCrosswalk`, `Turn`, `ChangeLane`, `AvoidObstacle`, `Panic`, `Flee`, `PullOverEmergency`, `CollisionRecovery`, `Despawn`.

- Longitudinal control is the Intelligent Driver Model against the nearest constraint: stop line, intersection priority, or the closest vehicle or person in a corridor sampled along the path ahead. Three driver profiles (cautious, normal, impatient) change headway, speed and horn patience.
- Intersections: compatible movements share the box; cross traffic and opposing left turns wait. Entries time out so the box cannot deadlock.
- A stationary blocker triggers the horn, then a lane change where a second lane exists. Cars that end up far off their lane adopt the lane that matches their heading.
- Gunfire nearby or a hard ram by the player causes panic (flee at speed), a stop, or the driver bailing out as a pedestrian who may phone it in.
- Spawns happen on lanes 65 to 190 m away that the camera cannot see, or inside tunnel portals. Despawns need distance and no line of sight. `Park` and `PullOut` from the brief are not implemented: parked cars are static until someone takes them.

### Pedestrians (`src/pedestrians/pedestrians.ts`)

`Spawn`, `WalkRoute`, `WaitSignal`, `CrossStreet`, `Browse`, `Sit`, `Talk`, `WorkLoop`, `ReactCurious`, `AvoidObstacle`, `Panic`, `Flee`, `Hide`, `CallEmergency`, `AssistInjured`, `Down`, `Despawn`.

- Roles: commuter, vendor, dock worker, tourist, courier, musician, resident. Each has fear, curiosity, a walking speed and usually a phone.
- Errands: A* over the sidewalk graph to a weighted destination, an activity there, one to three errands, then into a doorway to despawn.
- Crossings wait for the walk phase, or for a gap on unsignalled streets.
- Only the 18 nearest agents run line-of-sight perception each quarter second; the rest react by distance.
- Reactions differ by trait and distance: gunfire can produce panic, flight, hiding or staring; screams can produce flight, staring or going to help; a drawn weapon makes people back off or freeze.
- Vehicles moving faster than about 3 m/s knock pedestrians down (they get up again unless hit hard); slower vehicles push them aside. Nearby agents dodge.

### Police and Alert (`src/police`)

Evidence (`police.ts`): `crime(type, x, z)` creates a record with type, severity, time, place, suspect outfit, vehicle description and plate. It becomes a report only if an officer has sight, an active camera has sight, or a civilian witness with a phone completes a 2 to 5 s call. Witnesses need line of sight (gunfire can also be heard, which gives a location with no description). A call can be cancelled by talking the caller down while unarmed, or by a chirper.

Alert: heat from reports sets tier 0 to 4; tier 5 is mission-only. Status is one of `Unnoticed`, `Witness Reporting`, `Identified`, `Pursuit`, `Search`, `Cooling`. With no recognised sight for 1.5 s the status becomes `Search`, the search radius grows from the last known position, and after a tier-dependent time unseen (longer if you stay inside the circle) the alert cools and clears. `recognises(distance)` is where vehicle and clothing changes matter.

Units (`units.ts`): `Patrol`, `Respond`, `Pursue`, `Search`, `Dismounted`, `Roadblock`, `Return`. Units enter from tunnel portals, the substation yard, or an out-of-sight patrol beat, and drive there on the vehicle physics. Concurrent vehicles are capped per tier (1, 1, 2, 3, 4, 6) and each incident has a dispatch budget (0, 2, 4, 7, 10, 14). Searching units pull unvisited route nodes from a shared blackboard, biased toward the last known heading. Finding the described vehicle abandoned re-centres the search on foot.

Foot officers (`src/character/actors.ts`): `Chase`, `Arrest`, `Attack`, `Search`, `Return`, `Stunned`. Tiers 1 and 2 chase and open a five-second detain window at arm's length: hold `E` to comply (fine, long guns confiscated, released at the substation) or move away, which is `resistArrest`. Tier 2 officers fire stun rounds at a runner. Tier 3 and above use firearms. Security guards patrol routes, investigate chirpers and raise trespass; rivals advance, strafe and fire bursts.

Not implemented from the brief: tactical vans, spike strips, the harbor drone, and officers using cover.

## Missions (`src/missions`)

`MissionDef` is plain data: `nodes` keyed by id, a `start`, mission-wide `fails`, reward and par time. Node kinds: `dialogue`, `objective`, `spawn`, `set` (world state), `branch`, `choice`, `checkpoint`, `reward`, `cleanup`, `end`. Goals: `goto`, `enter`, `interact`, `multi`, `anyOf`, `wait`, `alertClear`, `vehStopped`, `deliver`, `leave`, `lock`. Conditions: vehicle dead, cargo gone or below a level, alert at least N, flag, impacts, timer over. `validateMission` checks references, reachability and the presence of reward and end nodes; it runs before every start and in tests.

The runner reserves vehicles and actor groups by reference, exposes markers, objective text, optional goals, a timer, a dialogue choice and the lock minigame, and supports `retry()` (release everything, restore the checkpoint, re-run its setup nodes) and `abandon()` (release everything, clear restricted zones, cameras and forced alert). Story rewards pay once; replays only improve the recorded grade. Grades use time against par, collisions, civilians harmed, alert peak (unless the alert is scripted) and optional goals.

## Saves (`src/persistence/saveRepo.ts`)

IndexedDB stores: `snapshots` (current), `journal` (write intent), `backups` (last three). A save writes the journal, rotates the previous snapshot into backups, writes the snapshot, then clears the journal. On load an intact journal newer than the snapshot is committed; a snapshot whose checksum fails is replaced by the newest valid backup. `migrate` upgrades version 1 saves to version 2. Export and import are checksummed JSON.

`Sim.serialize` never stores an unsafe position: in a vehicle, in the air, under an alert, downed, in water or mid-mission, it stores the safehouse door instead. Mission checkpoints are not written to disk; an interrupted mission restarts from its beginning.
