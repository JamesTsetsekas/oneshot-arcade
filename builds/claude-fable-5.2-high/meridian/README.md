# Meridian Run

An original browser open-world urban action sandbox, built as a one-shot vertical slice for Oneshot Arcade.

You are Rowan Vey, a courier in **Port Meridian**, a harbor city of floodwalls, tram viaducts and steep hillside streets. The slice covers the **South Quay** district (about 900 × 900 m): walk, ride and drive through live traffic and pedestrians, take courier jobs, and deal with a police response that only reacts to what somebody actually saw.

Everything in the build is procedural or hand-authored for this project: city, vehicles, characters, textures, audio and text. See `ASSETS.md`.

## Run it

Requires Node.js 22.12+ and npm.

```bash
npm ci
npm run dev      # dev server on http://localhost:5360
npm run build    # typecheck + static production build in dist/
npm test         # 65 headless simulation tests (Vitest)
npm run preview  # serve dist/ on http://localhost:5361
npm run smoke    # optional: boots dist/ in headless Edge/Chrome from a sub-path and captures screenshots
```

The production build is fully static and uses only relative URLs, so `dist/` can be hosted from any sub-path. There is no backend. `npm run smoke` needs a locally installed Microsoft Edge or Google Chrome (it uses `playwright-core` with the system browser; nothing is downloaded).

Target: desktop Chrome or Edge with WebGL 2, keyboard and mouse, 1280×720 or larger. A clear error screen appears if WebGL 2 or WebAssembly is missing.

## Controls

All keys are rebindable in **Settings → Key bindings**.

| On foot | |
|---|---|
| `W A S D` | Move |
| Mouse | Look / aim |
| `Shift` | Sprint (8 s of stamina) |
| `Ctrl` | Crouch (quieter, harder to spot) |
| `Space` | Jump, vault, mantle; climb out of water |
| `E` | Interact, enter a vehicle (hold where a bar appears) |
| Right mouse / Left mouse | Aim / fire |
| `R` | Reload |
| `F` | Baton (nonlethal); also gets into a vehicle if nothing is in reach |
| `1` `2` `3` | Sidearm, long gun, stun projector |
| `H` | Holster |
| `G` / `Q` | Throw gadget / switch gadget (distraction chirper, smoke) |
| `Z` | Use medkit |
| `X` | Swap camera shoulder |
| `Tab` | Weapon wheel (pauses) |

| Vehicle | |
|---|---|
| `W` / `S` | Throttle / brake, then reverse |
| `A` / `D` | Steer |
| `Space` | Handbrake |
| `F` | Get out |
| `H` | Horn |
| `C` | Cycle camera: near, far, hood |
| `X` | Look back |
| `N` | Next radio station |
| `R` (hold) | Street Circuit only: reset to the last gate (+5 s) |

| Anywhere | |
|---|---|
| `M` | Map (click to set a GPS waypoint) |
| `P` | Phone: jobs, activities, contacts, stats |
| `Esc` | Pause |

Click the game once to capture the mouse.

## What is in the slice

- **South Quay**: six neighbourhoods (Tide Market, Glassline, Lantern Hill, Foundry Row, Breakwater, Canal Loop) on a hand-authored road grid with an arterial loop, a drivable flood channel with bridges and slipways, a real hill, harbor water, landmarks, and tunnel portals where traffic enters and leaves.
- **Eight original vehicles** on one raycast-suspension physics model: three compact/sedan cars, a muscle coupe, a delivery van, a police interceptor and two motorcycles. Damage affects the engine, steering and tyres; the garage repairs and resprays.
- **Living city**: lane-following traffic that obeys signals, yields to pedestrians, pulls over for sirens, panics at gunfire and changes lane around obstructions; pedestrians with roles, errands, crossings, chatter and varied reactions to danger.
- **Evidence-based Alert system** (five tiers, segmented beacon): crimes matter only when an officer, a camera or a phoning witness observed them. Pursuit turns into a search of the last known area, then cools. Changing vehicle or clothes out of sight weakens the description. Low tiers try to arrest; you can comply (fine) or run.
- **Four story missions** on a data-driven mission graph with checkpoints, retry, abandon and replay: *First Shift*, *Lost Manifest*, *Hot Cargo*, *Signal at the Breakwater*. **Three repeatable activities**: Courier Runs, Street Circuit (with a ghost of your best run), Recovery Calls.
- **Economy**: cash and Trust; Quay Mart, Harbor Supply, Thread & Tide and Breakwater Auto as walk-up shops.
- **Afternoon-to-night cycle** (45 minutes) with a rainy neon evening, wet-road grip and lighting.
- **Saves** in IndexedDB with a write journal, rolling backups, migration and export/import. Rest at the safehouse on Tide Street to save; jobs autosave.
- **Settings**: quality presets, densities, FOV, sensitivity, hold/toggle options, driving assists, audio buses, streamer mode, subtitles, reduced motion, reduced flashes, colourblind-safe beacon, key rebinding.
- **Procedural audio**: engine, tyres, sirens, weapons, zone ambience, rain, and two generative radio stations.

What is simplified or missing is listed honestly in `ONESHOT-REPORT.md` and `docs/OPERATIONS.md`.

## Tips

- Your own Swift is never a theft. Taking anyone else's vehicle is, if someone sees it.
- Witnesses need a couple of seconds on the phone. You can talk a caller down (`E`) if you are unarmed and calm.
- To shake a search: break line of sight, leave the red circle on the map, and consider a new jacket or a different car.
- `?benchmark=1` on the URL runs a 60-second scripted benchmark lap after you press New Game.

## Project layout

```
src/app-shell      React menus, map, phone, shops, settings
src/game-session   Sim (headless fixed-step simulation) and Game (browser loop, saves)
src/world          district source, terrain, lots, lane/sidewalk graphs, signals, routing
src/physics        Rapier world, collision groups, ray queries
src/vehicles       tuning sheet and raycast vehicle dynamics
src/character      character controller, player, weapons, foot NPCs
src/traffic        civilian and scripted drivers
src/pedestrians    pedestrian agents and barks
src/police         evidence, Alert state machine, dispatch units
src/missions       mission graph runtime and mission data
src/renderer       Babylon.js scene, cell streaming, instanced actors, camera
src/audio          procedural Web Audio
src/ui             HUD and map painter
src/persistence    IndexedDB save repository
tests              Vitest simulation tests
tools              smoke test and debugging scripts
docs               design notes, schemas, AI states, operations
```
