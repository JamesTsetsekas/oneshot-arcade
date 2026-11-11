# Assets

Farestorm ships **no external assets**. Everything is generated in code or authored inline.

| Asset | Source | License |
| --- | --- | --- |
| City, buildings, landmarks, taxis, traffic, props, passengers, particles | Procedural geometry built at load time in `src/render/*` (three.js primitives merged into vertex-coloured meshes) | Original to this project (MIT-style, no restrictions) |
| Window/wall texture | Drawn on a 64x64 `<canvas>` at runtime (`windowTexture()` in `src/render/geo.ts`) | Original |
| Sky, water | GLSL shaders written for this project (`src/render/view.ts`, `src/render/city.ts`) | Original |
| HUD icons (circle / diamond / star / pin), destination labels | Drawn on `<canvas>` at runtime | Original |
| Typography | System font stack (`Trebuchet MS`, `Segoe UI`, Arial fallback); no web fonts are downloaded | System fonts |
| Music, engine, tyre, collision and UI sounds | Synthesised live with the Web Audio API (`src/audio/audio.ts`): oscillators and filtered noise. The tune is an original progression (Dm-Bb-F-C) with an original bass/arp/brass-stab pattern | Original |
| Favicon | Inline SVG data URI in `index.html` | Original |
| Passenger names, bark lines, destination and shortcut names | Written for this project | Original |

## Third-party code

| Package | Use | License |
| --- | --- | --- |
| [three](https://github.com/mrdoob/three.js) 0.170 | WebGL 2 rendering | MIT |
| [vite](https://github.com/vitejs/vite), [typescript](https://github.com/microsoft/TypeScript), [vitest](https://github.com/vitest-dev/vitest) | Build / typecheck / tests (dev only) | MIT / Apache-2.0 |
| [playwright-core](https://github.com/microsoft/playwright) | Headless screenshots in `scripts/capture.mjs` (dev only) | Apache-2.0 |

No existing game's city layout, characters, taxis, phrases, arrow design, UI layout, soundtrack or logos were used or referenced.
