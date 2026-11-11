# Meridian Run: hosting, compatibility, accessibility, benchmark, limitations

## Hosting

`npm run build` writes a static site to `dist/`. Serve that folder with any static file host, at the root or under any sub-path; every URL in the build is relative (`base: "./"`). No server code, headers or rewrites are required. HTTPS (or `localhost`) is needed for the service worker and for pointer lock in some browsers.

- `dist/sw.js` caches same-origin GET responses after the first load (navigation is network-first), so the game starts offline afterwards. `manifest.webmanifest` makes it installable. Bump `CACHE` in `public/sw.js` when publishing a new build.
- Saves live in the player's browser (IndexedDB database `meridian-run`), settings in `localStorage`. Clearing site data removes both. The safehouse screen can export and import the save as a JSON file.
- The JavaScript bundle is about 11.2 MB (3.2 MB gzipped), mostly Babylon.js imported through its barrel module, with the Rapier WASM inlined. There are no other downloads.

## Browser compatibility

| Browser | Status |
|---|---|
| Microsoft Edge (Chromium), Windows, headless with GPU | **Verified** by `tools/smoke.mjs`: boots from a sub-path, new game, scripted scenes, save, reload, continue, benchmark route. No page errors. |
| Google Chrome desktop | Expected to match Edge (same engine). Not separately run. |
| Firefox desktop | **Not verified.** Uses only WebGL 2, WebAssembly, pointer lock, Web Audio and IndexedDB, which Firefox supports. |
| Safari | **Not verified.** Best effort. |
| Mobile / touch | Not supported: there are no touch controls. |

Interactive play with a real mouse (pointer lock, aiming feel) could not be exercised in the headless environment used to build this. The input path is covered only through the simulation's input interface in tests and keyboard events in the smoke run.

## Accessibility checklist

| Item | State |
|---|---|
| Rebindable keys for every action | Done (Settings → Key bindings) |
| Hold or toggle for aim, crouch, sprint | Done |
| Mouse and steering sensitivity, invert Y | Done |
| Subtitles for all dialogue, barks, dispatch and radio idents, with size control | Done (on by default) |
| Reduced motion: no camera shake, no speed FOV | Done |
| Reduced flashes: lightbars cross-fade slowly, dimmer muzzle flash; lightbars stay under 3 Hz even when off | Done |
| Colourblind-safe Alert beacon (blue/orange, hatch pattern for Search, text label always shown) | Done |
| Driving assists: traction control, counter-steer assist | Done |
| Density, resolution scale and detail distance | Done |
| Streamer mode (radio off) | Done |
| OS "prefers reduced motion" respected for UI animation | Done |
| Keyboard focus styles in menus | Done |
| Full keyboard navigation of the map screen | Not done (waypoints need the mouse) |
| Gamepad support | Not done |
| Screen-reader labelling of the HUD | Not done |
| Gore setting | Not applicable: there is no gore; incapacitated characters simply lie down |

## Benchmark route

Open the game with `?benchmark=1` and press New Game. A scripted driver takes a Tern around the arterial loop for 60 seconds, then a results panel appears and `BENCHMARK_RESULT {...}` is logged.

Measured once on the build machine by `node tools/smoke.mjs --benchmark` (headless Edge, hardware GPU, 1280×720, Medium preset):

| Metric | Value |
|---|---|
| Median frame rate | 131.6 fps |
| 1% low | 108.7 fps |
| Longest frame | 17.1 ms |
| Simulation time per frame (smoothed) | 2.2 ms |
| Draw calls (last frame) | 261 |
| Slowest streamed cell build | 9.1 ms |

This is one run at 720p on one machine, not the brief's 1080p target hardware matrix. The cell build peak is above the brief's 3 ms integration budget.

## Known limitations

World and presentation
- Buildings are not enterable. Shops, the safehouse, contacts and the police substation are walk-up markers; the garage, warehouse hall, port office and server annex are open sheds you can walk into.
- Characters and vehicles are stylised box models with code-driven poses. There are no skeletal animations, vault hand markers or door animations; entering a vehicle is a short walk to the door and a snap.
- Lighting is one shadowed sun or moon plus ambient, emissive windows and additive light pools. No baked lighting, probes or reflections. Lamp pools on steep streets can clip through walls.
- No occlusion culling; frustum culling and fog only. Draw calls stay low because geometry is merged per cell.
- The kerb is a 12 cm ramp in the collision heightfield, so feet can sink slightly at the kerb edge.
- The tram on the viaduct is scenery.

Gameplay
- Weapons work on foot only; there is no shooting from vehicles.
- Enemy AI advances, strafes and fires, and guards patrol and investigate, but nobody uses cover or flanks. No thrown grenades from enemies.
- Thin-cover bullet penetration is not modelled.
- Police: no tactical vans, spike strips or drone. Roadblocks are two parked interceptors on a predicted intersection. Officers who lose their car are retired once out of sight.
- Parked cars never pull out; traffic never parks. Locked cars simply refuse entry (no bypass minigame outside the mission door).
- Swimming is limited to the harbor; you climb out anywhere along the quay with `Space`.
- Mission checkpoints are in memory only. Quitting mid-mission and continuing restarts that mission from the beginning.
- Street Circuit times are local and unverified; there is no leaderboard backend.
- Only one save slot. The main menu has no separate Load screen: Continue loads the slot, and import/export lives at the safehouse.
- Time advances only up to night; resting at the safehouse resets the day.

Engineering
- The simulation step is fixed at 60 Hz with up to four catch-up steps per frame; there is no 30 Hz simulation mode. Below about 15 fps the game slows down rather than skipping.
- Route queries run on the main thread (they are small); there are no Web Workers.
- Babylon.js is imported whole rather than tree-shaken, which makes the bundle larger than the brief's 10 MB shell target.
- WebGPU is not used. On WebGL context loss the game shows a recovery message and asks for a reload; it does not rebuild the scene in place.
- No editor tooling (cell, road, mission or pursuit editors). Debugging is through `window.__meridian` and `tools/debug.mjs`.
