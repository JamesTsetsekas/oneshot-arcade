# Assets and third-party material

## Original, generated in code (no files shipped)

Everything visible and audible in Farestorm is produced at runtime by code in this repository. There are no image,
model, audio or map files in the source tree.

| Asset | Where it comes from | License |
| --- | --- | --- |
| City of Galeport: terrain, roads, buildings, landmarks, props | `src/world/*`, `src/renderer/city.ts` (procedural meshes) | Original work for this project |
| Storm cabs, traffic vehicles, passenger figures, markers | `src/renderer/vehicles.ts`, `src/renderer/gameView.ts` | Original work for this project |
| Textures: roads, facades, shopfronts, ground map, sea, particles | `src/renderer/textures.ts` (Canvas 2D at load) | Original work for this project |
| Sound effects, engine, passenger voice blips | `src/audio/audio.ts` (Web Audio oscillators and noise) | Original work for this project |
| Music loop | `src/audio/audio.ts` (step sequencer, original pattern) | Original work for this project |
| Names: Farestorm, Galeport, districts, destinations, shortcuts, passengers, bark lines | `src/world/galeport.ts`, `src/fares/passengers.ts` | Original work for this project |
| Favicon | Inline SVG in `index.html` | Original work for this project |
| Screenshots in `oneshot/` | Captured from this build with `tools/screenshot.mjs` | Original work for this project |

## Fonts (bundled through npm)

| Font | Package | License |
| --- | --- | --- |
| Lilita One | `@fontsource/lilita-one` | SIL Open Font License 1.1 |
| Rubik | `@fontsource/rubik` | SIL Open Font License 1.1 |

## Runtime libraries

| Library | Package | License |
| --- | --- | --- |
| Babylon.js core | `@babylonjs/core` | Apache-2.0 |
| Rapier 3D (WASM, compat build) | `@dimforge/rapier3d-compat` | Apache-2.0 |
| React, React DOM | `react`, `react-dom` | MIT |

## Development-only tools

Vite, `@vitejs/plugin-react`, Vitest, TypeScript (Apache-2.0 / MIT) and `playwright-core` (Apache-2.0, used only by
`tools/screenshot.mjs` to drive an installed Edge or Chrome).

No analytics, trackers, API keys, accounts or external services are used. The game makes no network requests after
its static files have loaded.
