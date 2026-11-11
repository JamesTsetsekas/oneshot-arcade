# Assets and licenses

Crownfall ships **no external art, audio, font, model or texture files**. Every asset is generated at runtime from code in
this repository, so there is nothing to license beyond the open-source libraries listed below.

| Asset | Source | License |
| --- | --- | --- |
| Hero, minion, monster, structure and prop models | Procedural low-poly geometry built in `src/client/models.ts` and `src/client/renderer.ts` (boxes, cones, icosahedra, tori, merged/instanced) | Original, same license as this project |
| Ground art, minimap, brush, lanes, river, pit | Painted at start-up from the map data with Canvas 2D in `src/client/mapart.ts` | Original |
| Hero portraits | Rendered once at runtime from the procedural hero models (`src/client/portraits.ts`) | Original |
| Particles, decals, telegraph textures | Generated Canvas 2D textures and a custom point-sprite shader (`src/client/vfx.ts`) | Original |
| Ability and item icons | Unicode glyphs/emoji rendered by the user's system fonts, colour-tinted in CSS | Glyphs come from the viewer's installed fonts; no font files are bundled |
| Sound effects | Synthesised with the Web Audio API (oscillators and filtered noise) in `src/client/audio.ts` | Original |
| Music | Procedural three-layer generative bed (pad, arpeggio, pulse) in `src/client/audio.ts` | Original |
| UI | Hand-written CSS in `src/client/style.css` | Original |
| Hero, ability, item, map and objective names, lore and numbers | Authored for this project (`src/shared/content.ts`, `src/shared/map.ts`) | Original |

Libraries (not bundled assets):

| Package | Use | License |
| --- | --- | --- |
| three 0.170 | WebGL rendering | MIT |
| vite 6, typescript 5.6, vitest 2 | Build, type-check, tests | MIT / Apache-2.0 |
| playwright-core | Dev-only screenshot and playthrough scripts in `tools/` (not shipped) | Apache-2.0 |

No code, art, audio, maps, names or formulas were copied from any existing game. Hero kits, items, objective names, map geometry
and UI were designed from genre-level principles only.
