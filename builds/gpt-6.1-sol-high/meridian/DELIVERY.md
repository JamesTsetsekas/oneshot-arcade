
## Delivery notes

This is a compact, original 360 × 360 m interpretation of South Quay, not the full production MVP.

### Runtime contracts

- World building schema: `{ x, z, w, d, h, tone }`, metres, Y-up. Roads form a five-by-five orthogonal lane graph with 72 m spacing; buildings are solid axis-aligned collision footprints. `createBlocks()` is the authored procedural district source.
- Vehicles: `{ id, kind, x, z, yaw, speed, hp, owned }`. Kestrel bike: 32 m/s, Aster car: 29 m/s, Brine van: 23 m/s. Forward acceleration 13 m/s², opposing input brakes at 26 m/s², reverse limited to 10 m/s. Speed-sensitive steering, drag, handbrake, health-limited performance. These are arcade planar vehicles, not suspension vehicles.
- Mission graph: delivery stages `Tide Market -> Breakwater -> Dispatch -> reward`; manifest stages `Archive -> clear alert -> Dispatch -> reward`. Objective transitions run through `interact()` or Alert cooldown. Rewards are applied only when transitioning to free roam. Checkpoint retry resets the current job to its initial objective. Repeat deliveries reuse the first route.
- Traffic: Cruise / StopSignal / FollowObstacle. Nineteen vehicles on three rectangular routes; alternating eight-second signal phases. Nearby obstruction causes braking. Vehicles do not perform lane changes or car-to-car rigid-body collisions.
- Pedestrians: sidewalk route / danger avoidance. Twenty-eight original modular residents. This is a visual population, not a full navmesh, schedule or witness simulation.
- Police: Reporting (2.8 seconds) / Pursuit (65 m visibility plus building occlusion) / Search / Clear (14 seconds unseen). Two finite, physically travelling patrol vehicles. Nonlethal pulse temporarily stuns units for six seconds. Five Alert segments exist, but higher tiers do not add tactical units. There is no arrest mechanic.
- Physics: fixed 60 Hz planar character/vehicle collision and integration. Rapier WASM separately handles dynamic workshop crates and their ground contacts at the same tick rate. No vehicle suspension or character capsules are claimed.
- Save V1: `{ version: 1, cash, trust, deliveries, storyDone, health }`. IndexedDB object store `checkpoints`, key `safe`; an atomic transaction replaces a safe checkpoint. Invalid numeric fields are rejected on restore. Continue returns to dispatch with full health and a courier bike. No mid-job/vehicle position persistence, backups, migration chain or import/export.

### Hosting

Run `npm ci && npm run build`; upload the **contents** of `dist/` to any static directory. HTTPS or localhost enables the service worker. No SPA rewrite or backend is required. All build assets, the manifest and service-worker scope are relative. The generated service worker precaches the complete static build and removes old Meridian cache versions. First-load PWA installation needs a network connection. Browser storage may be denied; the game gives a save-unavailable toast and remains playable.

### Benchmark and browser matrix

The reproducible smoke route is in `oneshot/qa.mjs`: new shift, throttle for 1.8 seconds from dispatch, map, pause, save, reload, Continue. It uses a headless 1280 × 720 Chromium production session at `/arcade/meridian/`. This is a functional smoke route, not a validated FPS benchmark. No 60 FPS, 1% low or hardware performance claim is made. Chromium software WebGL is the verified rendering target; native Edge, Firefox, Safari and mobile are unverified.

### Accessibility

High-contrast DOM objectives, labelled buttons with keyboard focus outlines, written control hints, numeric health and condition, labelled identification status, and shapes as well as color on the map. Pause freezes simulation; map freezes simulation; reduced camera motion and render-resolution toggles are available. No rapid siren flashes or graphic violence. Sound can be muted. Screen-reader gameplay, key rebinding, sensitivity sliders, colorblind presets and gamepad support are not implemented.
