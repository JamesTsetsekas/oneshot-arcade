# Assets

Skybreak ships **no external art, audio, font, or model files**. Everything is generated at runtime by
code in this repository, written for this project.

| Asset | Source | License |
| --- | --- | --- |
| Island terrain, coastline, terraces, basin, plateaus (The Highwake) | Procedural heightfield + hand-placed layout in `src/shared/world/island.ts` | Original, project license |
| Buildings, ruins, warehouses, foundry halls, pier, crates, containers | Axis-aligned boxes from the same layout, vertex-coloured in `src/client/render/world.ts` | Original |
| Trees, boulders, grass tufts | Babylon.js primitive meshes, GPU thin-instanced | Original (primitives from Babylon.js, Apache-2.0) |
| Sky with atmospheric fracture seams | GLSL shader in `src/client/render/world.ts` | Original |
| Riftstorm wall + crystal motes | GLSL shader + instanced polyhedra in `src/client/render/fx.ts` | Original |
| Characters (Scout, Tinker, Drifter, Warden), wing-sails, nine weapon models | Box-built procedural meshes in `src/client/render/actors.ts` | Original |
| Transit skiff, supply capsule, caravan drone, chests, lockers, caches | Primitive meshes in `src/client/render/fx.ts` | Original |
| Map / minimap image | Rendered at runtime from the heightfield (`src/client/ui/mapdraw.ts`) | Original |
| Logo and favicon | Inline SVG path | Original |
| All sound effects (gunshots, footsteps, shields, chest hum, storm, UI) | Web Audio synthesis in `src/client/audio/audio.ts` | Original |
| Music (menu pad progression, match tension drone) | Web Audio synthesis in `src/client/audio/audio.ts` | Original |
| Fonts | System UI fonts only (no font files are bundled) | n/a |

Third-party code (npm, bundled into `dist/`):

| Package | License |
| --- | --- |
| @babylonjs/core 7.x | Apache-2.0 |
| react / react-dom 18.3 | MIT |

Dev-only tools: TypeScript (Apache-2.0), Vite (MIT), @vitejs/plugin-react (MIT), Vitest (MIT), playwright-core (Apache-2.0; drives the system Edge/Chrome for screenshots, downloads no browser).

All names (Skybreak, The Highwake, Calmfield, Riftstorm, Aegis, location, weapon and item names) are original to this project.
