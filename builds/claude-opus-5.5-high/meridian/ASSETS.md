# Assets and licenses

Meridian Run ships **no external art, audio, music, fonts or data files**. Every asset is either generated at runtime by code in this repository or hand-written as part of it.

| Asset | Source | License |
|---|---|---|
| District layout, buildings, roads, props, interiors (geometry) | Procedural, `src/world/district.ts` + `src/render/world-render.ts` | Original, part of this project |
| Facade, asphalt, paving, ground, container, water-normal, particle textures | Generated on canvas at runtime, `src/render/textures.ts` | Original, part of this project |
| Characters (Rowan, pedestrians, police, guards, rivals) and their animation | Procedural box rig + procedural pose code, `src/render/actors.ts` | Original, part of this project |
| Eight vehicles (geometry, livery, names) | Procedural, `src/render/actors.ts`; names/specs in `src/sim/vehicle.ts` | Original, part of this project |
| Sky shader | Hand-written GLSL in `src/render/renderer.ts` | Original, part of this project |
| All sound effects, engine/tire/siren layers, ambience | Synthesized with the Web Audio API, `src/audio/audio.ts` | Original, part of this project |
| Two radio stations (music, station IDs) | Generative sequencer in `src/audio/audio.ts`; IDs are original text | Original, part of this project |
| Dialogue, barks, mission text, place/character/brand names | Written for this project | Original, part of this project |
| App icon (`public/icon.svg`) | Hand-written SVG | Original, part of this project |
| UI typography | System fonts only (Bahnschrift / Segoe UI / system-ui); nothing is downloaded | — |

## Third-party code (npm)

| Package | Use | License |
|---|---|---|
| @babylonjs/core 7.54.3 | Rendering | Apache-2.0 |
| react / react-dom 18.3.1 | Menus, map, phone, shops, settings | MIT |
| vite 6.4.6 | Build | MIT |
| typescript 5.9.3 | Type checking | Apache-2.0 |
| vitest 3.2.7 | Tests | MIT |
| playwright-core 1.65.0 | Headless screenshot capture (dev only) | Apache-2.0 |
