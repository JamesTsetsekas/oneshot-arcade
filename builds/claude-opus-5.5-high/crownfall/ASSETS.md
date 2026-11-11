# Assets and licenses

Crownfall ships **no external art, audio, fonts or data files**. Everything is generated at runtime by code in this repository.

| Asset | Source | License |
|---|---|---|
| Hero models (Brannoch, Suri Vale, Oru, Kesh, Ilyra Quill, Vey) | Procedural Three.js primitives, `src/client/render/models.ts` | Original, same license as this repo |
| Minion, monster, Catalyst, Colossus, tower, Seal, Core, Crown Engine models | Procedural merged geometry, `src/client/render/models.ts` | Original |
| Map (The Broken Diadem): island, painted ground texture, cliffs, mistwood, brush, props, sky | Generated from shared map data, `src/shared/map.ts`, `src/client/render/mapView.ts` | Original |
| VFX (particles, decals, rings, beams) and shaders | `src/client/render/vfx.ts`, `fogShader.ts` | Original |
| Item, ability, talent icons and hero portraits | Inline SVG drawn in code, `src/client/ui/icons.tsx` | Original |
| Sound effects and adaptive music | Synthesized live with the Web Audio API, `src/audio/audio.ts` | Original |
| UI fonts | System font stacks only (Segoe UI / system-ui, Palatino / Georgia) | Installed on the player's system; nothing bundled |
| Favicon | Unicode ♛ character in an inline SVG data URI | — |

Libraries (npm, bundled into the build):

| Package | License |
|---|---|
| three | MIT |
| react, react-dom | MIT |
| vite, @vitejs/plugin-react (build only) | MIT |
| typescript (build only) | Apache-2.0 |
| vitest (tests only) | MIT |
| playwright-core (screenshot tooling only, uses the system Edge/Chrome) | Apache-2.0 |

All hero names, kits, item names/effects, objective names, terminology and the map layout are original to this project.
