# Assets and licenses

Breachline ships **no third-party media files**. Everything visual and audible is original and generated in code at load time.

| Asset class | Source | License |
|---|---|---|
| Textures (concrete, floor tiles, metal, wood, rock, sky, ocean, decals, signs) | Drawn procedurally on `<canvas>` (`src/client/renderer/textures.ts`) | Original, project license |
| Environment geometry (Relay Station K-17) | Authored as a cell grid + AABB list (`src/shared/map/k17.ts`), meshed at runtime | Original |
| Characters, weapons, hands, equipment, drones, pods, jet | Primitive-assembled meshes (`characters.ts`, `weaponModels.ts`, `scene.ts`) | Original |
| Sound effects and music | Synthesized with the Web Audio API at runtime (`src/client/audio/audio.ts`) | Original |
| UI icons | Inline SVG paths (`src/client/ui/hud.ts`) | Original |
| Fonts | System font stack only (Bahnschrift / Segoe UI / Roboto Condensed / Arial Narrow) | n/a (not bundled) |
| Faction, weapon, perk and map names | Fictional; no branded or real-game names | Original |

## Libraries (npm)

| Package | License |
|---|---|
| @babylonjs/core | Apache-2.0 |
| react, react-dom | MIT |
| vite, @vitejs/plugin-react, vitest, tsx | MIT |
| typescript | Apache-2.0 |
| playwright (dev only, screenshots) | Apache-2.0 |
