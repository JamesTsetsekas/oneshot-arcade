# Assets

Last Protocol ships **no downloaded or third-party art, audio, map, font or data files**. Every asset is authored in code in this repository and generated when the game loads.

| Asset | Source | License |
| --- | --- | --- |
| Map geometry, collision and navigation for Aperture Annex | Authored in `src/map/annex.ts`, built by `src/map/build.ts` and `src/map/nav.ts` | Original work for this project |
| Baked lighting | Computed at load time in `src/renderer/mapmesh.ts` from the map's light list | Original |
| Surface textures (concrete, acoustic panel, asphalt, tile, metal, plate, wood, perforated panel, foliage, soil), signage, decals, particles, muzzle flash | Drawn with the Canvas 2D API in `src/renderer/textures.ts` and `src/renderer/mapmesh.ts` | Original |
| Weapon, utility and Spike models (12 firearms, Edge Tool, 5 utility items, Spike) | Box and prism geometry in `src/renderer/models.ts` | Original |
| Character rigs for both factions, first-person arms | `src/renderer/characters.ts`, `src/renderer/viewmodel.ts` | Original |
| All sound effects and the menu music | Synthesized with the Web Audio API in `src/audio/audio.ts` (oscillators and filtered noise; no samples) | Original |
| Interface, icons, HUD | HTML, CSS and inline SVG in `src/ui/` and `src/styles.css`; the page icon is an inline SVG data URL in `index.html` | Original |
| Fonts | System fonts only (`Bahnschrift`, `Segoe UI`, fallbacks). No font files are bundled or fetched. | Not applicable |
| Names (Last Protocol, Cipher Breach, Aperture Annex, Intrusion, Custodian, weapon and utility names, bot call signs) | Taken from the project brief or invented here | Original |

## Third-party software

Bundled into the build:

| Package | Use | License |
| --- | --- | --- |
| `@babylonjs/core` | WebGL 2 rendering | Apache-2.0 |
| `react`, `react-dom` | Menu and overlay interface | MIT |

Development only (not shipped): `vite`, `@vitejs/plugin-react`, `typescript`, `vitest`, `playwright-core`, `@types/react`, `@types/react-dom`, each under its own open-source license (MIT or Apache-2.0).

No existing game's source, art, audio, maps or names were downloaded, copied or referenced.
