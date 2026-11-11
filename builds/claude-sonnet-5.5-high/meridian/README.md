# Meridian Run

An original browser-based, third-person open-world urban action sandbox. You are **Rowan Vey**, an independent courier in **Port Meridian**, a sunlit vertical harbor city. This repository is a playable **vertical slice** of the *South Quay* district: a living street grid with traffic, pedestrians, enterable vehicles, on-foot combat, a five-tier police response, missions, activities, shops, saves and an afternoon-to-night cycle.

Everything (city, vehicles, characters, UI, sounds, music) is original and generated procedurally at runtime - see [ASSETS.md](ASSETS.md). The game runs entirely from static files; there is no backend, no telemetry and no external service.

## Run it

Requires Node.js 22.12 or newer and npm.

```bash
npm ci            # install exact dependencies from package-lock.json
npm run dev       # dev server on http://localhost:5560
npm run build     # type-check + static production build in dist/ (relative URLs, works from any sub-path)
npm test          # headless simulation/rules tests (vitest)
npm run preview   # serve dist/ on http://localhost:5560
```

Target: desktop Chrome / Edge (Firefox works, Safari best effort) with WebGL 2, keyboard and mouse, at 1280x720 or 1920x1080. If WebGL 2 is unavailable the game shows an explanatory error screen instead of a blank page. The build is a static site, so it can be hosted under any path (for example `https://host/play/claude-sonnet-5.5-high/meridian/`).

## Playing

Click **New Game**. A short call from Dispatch starts the tutorial delivery *First Shift*: climb onto your **Kestrel** courier bike (parked beside your loft), ride to the print shop in Tide Market, collect the parcel, and park it in the marked zone at Halyard Tower in Glassline. After that the district is yours: steal a car, drive through live traffic, fight, run from the police, shop at the convenience store, change outfit at the kiosk, repair at the garage, take the next story mission (*Hot Cargo*) or repeatable jobs from the phone (**P**), and save at your loft.

### Controls (all keys are rebindable in Settings)

| On foot | |
|---|---|
| `W A S D` | Move (jog) |
| `Shift` / `Ctrl` | Sprint (8 s stamina) / crouch |
| `Space` | Jump; vault (0.5-1.0 m) and mantle (1.0-1.6 m) low obstacles when moving into them |
| Mouse / `X` | Camera / shoulder swap |
| `RMB` / `LMB` | Aim (tightens camera and FOV) / fire or swing |
| `R`, `H`, `1-5`, mouse wheel / `Tab` | Reload, holster, pick weapon (1 baton, 2 sidearm, 3 long gun, 4-5 gadget), cycle weapon |
| `F` / `G` / `Z` | Melee strike (non-lethal baton) / throw gadget (smoke, chirper) / use medkit |
| `E` | Interact: enter vehicle, doors, shops, witnesses, mission actions |
| `M` / `P` / `Esc` | Map (click to set waypoint) / phone / pause |

| In a vehicle | |
|---|---|
| `W` / `S` | Throttle / brake, then reverse |
| `A` / `D` | Steer (smoothed, speed-sensitive) |
| `Space` | Handbrake (rear steps out) |
| `H` | Horn |
| `C` / `X` | Cycle camera (chase, far, hood) / hold to look back |
| `F` | Exit (slow down first) |
| `T` | Radio: Quay FM (electronic harbor beat), Lantern 91 (local indie), off |

`F3` toggles an FPS counter, `F1` toggles the on-screen key hints.

## What is in the slice

* **District**: South Quay, a 7x7 road grid about 490 m across (roughly 0.25 km² of streets and blocks, inside a 600 m world with a harbor to the south; smaller than the brief's 0.8 km² target) with Tide Market (plaza, stalls, copper dome), Foundry Row (warehouses, container yards), Glassline (glass towers, police substation), Lantern Hill (tiered residences), Breakwater (docks, crane, lighthouse, quay with harbor swimming) and Canal Loop (park with a shallow canal and footbridge). Seven CCTV cameras, six discoverable landmarks.
* **Vehicles (8)**: Tern compact, Hollis sedan, Mistral GT, Cormorant V8 muscle coupe, Dray delivery van, Sentinel police interceptor, Kestrel courier bike, Wren sport bike - data-driven, bicycle-model tyre physics with friction circle, handbrake oversteer, damage, stalling and repair.
* **Living city**: ~22 traffic cars obeying lanes, signals, following gaps, siren pull-over and panic; ~40 pedestrians with sidewalk graph routes, crossings on walk signals, browsing, talking (subtitled barks), vendors, fear/courage-based reactions, witness phone calls.
* **Crime and police**: evidence only through valid witnesses, cameras or officers; 2-5 s call delay that you can interrupt non-violently; five-tier segmented beacon, units spawn outside view and drive in on the road graph, roadblocks (tier 3+), spike strips and a harbor drone (tier 4), search area on the map, vehicle/outfit change lowers identification, cooldown back to tier 0, arrest at low threat with fine and confiscation.
* **Combat**: hitscan pistol, machine pistol, carbine, pump shotgun, marksman rifle, stun projector, baton, smoke canister and distraction chirper with range falloff, recoil/bloom, reload, head/torso/limb zones, non-lethal knock-outs; armor, medkits, health regen to 30.
* **Missions**: a data-driven mission graph (dialogue, objective, spawn, branch, choice, checkpoint, reward, cleanup, fail conditions) running *First Shift* and *Hot Cargo*, plus generated **Courier Runs** (fragile / urgent / quiet), **Street Circuit** (3 laps through traffic) and **Recovery Calls**. Grades S-C, optional goals, retry-from-checkpoint, abandon, replay without duplicate rewards.
* **Economy**: cash, Trust 0-5 (unlocks gear, not stats), convenience store, clothing kiosk, garage repair.
* **UI**: main menu, HUD with minimap + GPS route, objective/optional goals, segmented Alert beacon with identification state, speedometer, interaction prompts that name consequences, subtitles, full map with legend and filters, phone, shops, mission fail/complete screens, settings (graphics preset, FOV, density, sensitivity, rebinding, audio buses, subtitles, reduced motion, reduced flashes, colour-blind mode, driving assists, streamer mode).
* **Time and weather**: compressed afternoon -> golden hour -> dusk -> neon night with rain that changes tyre grip.
* **Persistence**: versioned, checksummed, journaled saves in IndexedDB with a rolling backup, v1 -> v2 migration, JSON import/export. Manual save at the loft, automatic saves at safe checkpoints.

Not in the slice (hidden rather than shown as dead buttons): the *Lost Manifest* and *Signal at the Breakwater* story missions, enterable interiors, ghost replays, online features, cloud saves. See `ONESHOT-REPORT.md` for the full coverage table and honest limitations.

## Project layout

```
src/sim/       pure TypeScript simulation (no DOM / WebGL): world, nav graphs, vehicles, collision, character, combat,
               traffic, pedestrians, police, missions, economy, camera rig, game orchestrator
src/render/    Babylon.js renderer: procedural city, atmosphere/sky, actors, VFX, shadows, glow
src/ui/        DOM HUD, minimap/map renderer, menus and panels
src/audio/     Web Audio synthesis (SFX, engines, sirens, ambience, two radio stations)
src/input/     keyboard/mouse input with rebinding
src/persistence/ IndexedDB save repository (journal, backup, migration)
tests/         vitest suites (vehicle dynamics, collisions, police/evidence, missions, saves, world/nav, perf)
scripts/       Playwright helpers used for screenshots and smoke checks
```

## License

Project code is original. Third-party dependencies and their licenses are listed in [ASSETS.md](ASSETS.md).
