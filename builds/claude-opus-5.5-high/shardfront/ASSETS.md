# Assets

Shardfront ships **no imported art, audio, fonts or data files**. Every asset is created at runtime by original code in this repository.

| Asset | Source | License |
|---|---|---|
| Unit, structure and neutral models (15 units, 12 structures, ore, vents, pylons, barriers, pods, sensor spikes) | Built procedurally from Three.js primitives in `src/renderer/models.ts` | Original work, part of this project |
| Terrain, cliffs, chasm, bridges, brush, crystals and rocks for Glass Ravine | Generated in `src/world/map.ts` and `src/renderer/terrain.ts`, `src/renderer/renderer.ts` | Original work |
| VFX (GPU particles, tracers, area-effect decals, fog of war) | Shaders and code in `src/renderer/vfx.ts`, `src/renderer/terrain.ts` | Original work |
| Sound effects and adaptive music | Synthesized live with the Web Audio API in `src/audio/audio.ts` | Original work |
| UI icons | Unicode symbols rendered with the system font, chosen in `src/game/client.ts` (`iconFor`) | System fonts (no font files bundled) |
| Favicon / logo | Inline SVG in `index.html` and CSS text | Original work |
| Map layout "Glass Ravine" | Authored in `src/world/map.ts` | Original work |

Runtime libraries (bundled from npm, not assets): Three.js (MIT), React and React DOM (MIT). Build and test tooling: Vite (MIT), TypeScript (Apache-2.0), Vitest (MIT), playwright-core (Apache-2.0), @vitejs/plugin-react (MIT).
