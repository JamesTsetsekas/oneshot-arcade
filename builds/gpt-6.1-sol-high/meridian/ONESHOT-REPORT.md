# One-shot report

## Summary

Built an original, static browser courier sandbox set in a compact procedural South Quay district. The playable loop runs from motorcycle delivery through cash and Trust rewards, a patrol-escape evidence job, workshop spending, safe checkpoint saving, and continued free roam. The slice uses strict TypeScript, Babylon.js, fixed-step gameplay, Rapier dynamic props, original geometry and synthesized sound.

## Brief coverage

| Major system / acceptance area | Status | Evidence / limitation |
|---|---|---|
| URL launch, tutorial delivery, free roam, save and Continue | Done | Two-stop motorcycle job returns to dispatch, pays once and unlocks the evidence job; safe checkpoints use IndexedDB. |
| South Quay world and landmarks | Partial | 360 × 360 m grid, harbor, docks, cranes, elevated tram, shops and market signs; smaller than the 900 m district, no interiors. |
| Character movement and traversal | Partial | Jog, sprint, crouch speed, jump, collision and vehicle transitions; no vault, mantle, ladders, swimming or animation blending. |
| Vehicle classes and stable driving | Partial | Bike, compact car and van; braking, reverse, steering, handbrake, impact damage, exit speed guard and repairs. Planar arcade collision, no suspension, stall, deforming damage or eight vehicle types. |
| Traffic / signals / recovery | Partial | 19 lane-route vehicles alternate signal phases and brake for obstacles. No lane changes, crosswalk yielding or robust congestion recovery. |
| Pedestrian AI | Partial | 28 walking residents with simple nearby danger avoidance. No navmesh, schedules, conversations or independent witnesses. |
| Evidence / Alert / pursuit / search / cooldown | Partial | Delayed reports, two capped patrols, building-occluded visibility, search and 14-second escape cooldown. Reports are simplified; five segments do not implement five different response tiers. |
| Arrest and escalation | Not started | Health depletion offers retry; no compliance, fines, roadblocks or tactical units. |
| Weapons, health, healing and recovery | Partial | Nonlethal area pulse with ammunition/recharge, health, medical purchase, patrol/contact damage and checkpoint retry. No firearm arsenal, cover, aim ray or inventory wheel. |
| Four story missions and mission graph | Partial | First Shift and a simplified Lost Manifest have objectives, rewards, recovery and abandon. No stealth investigation branch; remaining two missions absent. |
| Repeatable activities and grading | Partial | Repeat courier route and time bonus; no procedural pairing, circuit ghost or vehicle recovery activity. |
| Economy, Trust, repair and gear | Partial | Cash, Trust, time bonus, paid medical kit and combined workshop refill/repair. No clothing, garage slots or milestone unlocks. |
| Map / GPS / HUD / phone | Partial | North-up district map, orthogonal GPS route, compact HUD, prompts, health, speed, condition and labelled Alert. Phone shares map; no filters, waypoint placement or inventory. |
| Save migration, interrupted-write recovery | Partial | Version check, numeric validation and atomic IndexedDB transaction. Safe dispatch snapshots only; no rolling backup, migration chain, import/export or cloud. |
| Streaming / navigation workers / no void | Partial | Entire small district stays resident; fixed boundary prevents leaving land. No cell streaming, workers, HLOD pipeline or hitch guarantee. |
| Lighting / weather / art / audio | Partial | Original pastel low-poly coastal city, shadows, distance haze and synthesized vehicle/UI/pulse audio. Fixed afternoon, no rain, licensed radio or voiced dialogue. |
| Settings and accessibility | Partial | Pause, sound mute, reduced camera motion, render resolution, high-contrast text, focus states and written controls. No rebinding, colorblind presets or screen-reader gameplay. |
| PWA / static hosting / no backend | Done | Relative Vite assets, generated precache service worker, manifest, original SVG icon, local-only storage. |
| Performance / browser compatibility targets | Partial | Static merging and finite populations; functional Chromium software-WebGL smoke only. No claimed FPS or memory budget compliance. |
| Original IP / no proprietary assets | Done | Procedural original art, names, signs and synthesized sound; dependencies documented in ASSETS.md. |
| Tools / schemas / capture | Partial | Rule tests, production smoke script, screenshots, tuning and contracts in DELIVERY.md. No world editor, telemetry dashboard or complete gameplay video. |

## Architecture

`src/sim.ts` owns fixed-step vehicle/character integration, footprint collision, road routing, traffic, pursuit, economy, checkpoints and job transitions. `src/render.ts` builds and merges original Babylon meshes, maintains actor presentation, chase camera and Rapier workshop props. `src/main.ts` composes the session, DOM HUD/menu/map, input, Web Audio and IndexedDB repository; `src/style.css` defines the original visual interface. `oneshot/pwa.mjs` generates a build-specific offline precache; `oneshot/serve.mjs` hosts the production build at a nested path, and `oneshot/qa.mjs` exercises it with Playwright.

Babylon.js follows the brief's rendering direction; strict TypeScript and fixed 60 Hz simulation keep rules independent of frame rate. Rapier is deliberately limited to small dynamic props; the slice uses simpler planar arcade movement for reliable scope. UI uses small DOM updates rather than React. District, lane, save, vehicle and mission contracts, tuning, AI states, hosting and accessibility details are in DELIVERY.md.

## Verification

- Node.js v22.12.0; npm 11.4.2. Initial `npm install` succeeded and reported zero vulnerabilities.
- `node oneshot/clean.mjs` deleted the verified workspace-local `node_modules` and `dist` directories. A plain `npm ci` was interrupted after prolonged silence; `npm ci --offline --no-audit --no-fund --loglevel info` then completed successfully, adding 71 packages in 15 minutes from the existing cache. File counts confirmed slow extraction was continuing.
- Final `npm test`: **12 passed, 0 failed**, no skipped tests. Tests cover district collision, single payout, objective progression, theft/report delay, driving bounds, Alert cooldown, safe restore validation, workshop spending, pulse limits, route/visibility, manifest escape and traffic braking.
- Final `npm run build`: strict TypeScript check and Vite production build succeeded; generated `dist/index.html` and PWA precache. 29 production files total 8.30 MB; main JS 8.25 MB raw / 2.15 MB gzip. Vite warns about the large main chunk. An intermediate build failed because Windows PowerShell added a BOM to package.json; this was removed before final validation.
- `node oneshot/serve.mjs` served only the production directory at `http://127.0.0.1:5260/arcade/meridian/`. `node oneshot/qa.mjs` passed 7 browser checks: new shift shows gameplay HUD; keyboard throttle changes speed; city map opens and closes; braking and dismount work; safe checkpoint save action; reload and Continue restore gameplay; offline reload loads cached game and save. No page exceptions or console errors were recorded. The first early smoke attempt ran before the build was available and timed out; final captures use the completed production build.
- Real Playwright Chromium screenshots: `oneshot/screenshot.png` (1280 × 720, in-game driving), `oneshot/menu.png`, and `oneshot/map.png`. Browser evidence is recorded in `oneshot/qa-results.json`.
- Not verified: full missions by natural browser play, human driving feel, native GPU FPS/1% lows, memory budgets, physical Edge/Firefox/Safari, installed-PWA launch, context-loss recovery, or real interrupted IndexedDB writes. No gameplay video was recorded. The static server was stopped after capture.

## Assumptions and deviations

The one-shot prioritizes a complete short core loop over production-MVP breadth. The district is approximately 0.13 km² and always resident; it has no enterable interiors. Lost Manifest is an evidence collection/escape job, rather than the full authored stealth investigation. The courier starts mounted to make the first action immediately playable; vehicle switching remains available with F/E. Repeat jobs use the same route. Vehicles have no fuel model, which the brief allows omitting.

There is no backend, external runtime service, telemetry, account, multiplayer, downloaded art, AI text service or proprietary reference content. Saves intentionally restore only earned progression at a safe dispatch checkpoint; in-flight missions restart. A $60 workshop service and $40 instant medical purchase compress the larger inventory/shop design. The nonlethal pulse is a proximity effect against visible patrols rather than a fully aimed weapon. Formal machine-readable content schemas, content editors, journal/backup recovery and the full tool suite were not delivered.

## Known issues and limitations

1. The compact city is visually repetitive and contains no interiors, hills or full streaming system. Camera boom shortening checks the desired camera point rather than a true sphere cast and can clip briefly near corners.
2. Vehicle handling and collision are planar arcade approximations. Traffic can bunch or overlap, police routing can stick at some block corners, pedestrians have no collision/navmesh, and automatic reports lack the full witness evidence model.
3. Most production breadth is omitted: eight vehicle types/tools, two story jobs, arrest, circuits, recovery calls, clothing, weather, advanced combat, rebinding and full save recovery. No native-hardware FPS benchmark or human end-to-end mission playthrough was performed.

## Self-assessment

- **Playability: 7/10.** A short complete loop, readable navigation, driving, pressure, spending and safe recovery are present; handling and AI remain simple.
- **Visual polish: 6/10.** The authored coastal palette, harbor silhouettes, clean navigation and restrained interface establish a coherent style, with visibly primitive characters and repeated buildings.
- **Brief fidelity: 4/10.** The slice honors the city/courier premise, Babylon/TypeScript direction and basic systemic loop, while omitting most production simulation and campaign scope.
