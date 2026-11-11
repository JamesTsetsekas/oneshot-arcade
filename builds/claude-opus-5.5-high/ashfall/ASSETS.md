# Asset manifest and licenses

This build ships **no external art, audio, font, or model files**. Every asset is generated at runtime by code in this repository, written for this project.

| Asset | Source | License |
|---|---|---|
| All 3D meshes (characters, enemies, bosses, props, terrain, walls, interactables) | Procedurally assembled from Babylon.js primitives at runtime (`src/render/actors.ts`, `src/render/environment.ts`, `src/render/fx.ts`) | Original, part of this project |
| Textures (ash ground, refuge dirt, stone tiles, wall bricks, particle sprites, stripe pattern) | Painted on canvases at runtime (`src/render/kit.ts`) | Original, part of this project |
| Sound effects, ambience, music | Synthesised live with the Web Audio API (`src/audio/audio.ts`); melodies are random walks on a scale, not imitations of any existing tune | Original, part of this project |
| UI icons | Unicode symbols rendered with the system serif font | System fonts, not redistributed |
| Fonts | System fonts only (Palatino Linotype / Book Antiqua / Georgia fallbacks); nothing downloaded | Not redistributed |
| Favicon | Inline SVG data URI in `index.html` | Original |

## Code libraries (npm)

| Package | License |
|---|---|
| @babylonjs/core 8.56.2 | Apache-2.0 |
| react / react-dom 18.3.1 | MIT |
| vite 7.3.8, @vitejs/plugin-react 5.2.0 | MIT |
| typescript 5.9.3 | Apache-2.0 |
| vitest 3.2.7 (dev) | MIT |
| fake-indexeddb 6.2.8 (dev, tests only) | Apache-2.0 |
| playwright-core 1.65.0 (dev, screenshot script only) | Apache-2.0 |

All names (classes, skills, enemies, bosses, places, items, Relics) are original to this project.
