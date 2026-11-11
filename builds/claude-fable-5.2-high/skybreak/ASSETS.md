# Assets

Skybreak ships **no binary art, audio, font or map files**. Every asset is original and generated in code at load or
at runtime. Nothing was downloaded, traced or copied from an existing game.

| Asset | Source | License |
| --- | --- | --- |
| Island terrain, locations, structures, collision, nav grid | Authored procedurally in `src/shared/world/island.ts`, `kit.ts`, `nav.ts` | Original work for this project |
| Character rigs (four cosmetic bodies), weapons, items, chests, skiff, caravan drone, wing-sail | Built from primitives in `src/client/renderer/meshes.ts`, `actors.ts` | Original work for this project |
| Sky, void-sea and Riftstorm shaders | Hand-written GLSL in `src/client/renderer/shaders.ts` | Original work for this project |
| Terrain grain texture, island map image | Generated on a canvas at startup (`world.ts`, `ui/mapRender.ts`) | Original work for this project |
| HUD and inventory icons, rarity shapes, favicon | Hand-authored inline SVG (`src/client/ui/icons.tsx`, `index.html`) | Original work for this project |
| Sound effects, ambience and music | Synthesised with the Web Audio API (`src/client/audio/audio.ts`); no samples | Original work for this project |
| Names (Skybreak, the Highwake, Calmfield, Riftstorm, locations, weapons, items, bot callsigns) | From the brief or invented for this build | Original |
| Typography | System font stack (`Trebuchet MS`, `Segoe UI`, sans-serif); no font files shipped | n/a |

## Third-party code (npm, not assets)

| Package | Use | License |
| --- | --- | --- |
| `@babylonjs/core` | WebGL 2 rendering | Apache-2.0 |
| `react`, `react-dom` | Menus, HUD panels, overlays | MIT |
| `vite`, `typescript`, `vitest`, `tsx`, `playwright-core`, `@types/*` | Build, tests, tooling (dev only) | MIT / Apache-2.0 |
