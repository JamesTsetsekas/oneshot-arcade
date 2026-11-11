# Assets and licenses

Last Protocol ships **no external art, audio, fonts or model files**. Every asset is generated at runtime by code in this repository. That code was written for this project and is covered by the project itself.

| Asset | Source | License |
|---|---|---|
| Surface textures: concrete, acoustic panels, tile, asphalt, crates, containers, planters, grow racks, turbines, drywall (with a hatched marker for penetrable surfaces), glass, grass, smoke, flame, decals, sky gradient, wall signs | Procedural canvas generation in `src/render/textures.ts` | Original, project code |
| Map geometry for Aperture Annex | Authored data in `src/map/annex.ts`, meshed by `src/render/mapMesh.ts` | Original, project code |
| Weapon, utility, Cipher Spike and kit models | Built from primitive shapes in `src/render/models.ts`. Silhouettes are original. | Original, project code |
| Operatives (two team silhouettes, IFF strips) and first-person arms | Primitive rigs in `src/render/characters.ts` and `src/render/viewmodel.ts` | Original, project code |
| All sound effects (gunshots per weapon, footsteps per surface, reloads, grenade bounces, smoke, flash, thermite, pulse ping, Cipher beeps, UI) and the sparse menu pad | Synthesized at runtime with WebAudio in `src/audio/audio.ts`. No samples are used. | Original, project code |
| UI typography | The system font stack (Segoe UI, system-ui, …). No web fonts are downloaded. | System fonts |
| Favicon | An inline SVG diamond in `index.html` | Original |

Runtime libraries come from npm (see `package-lock.json`):

| Library | License |
|---|---|
| @babylonjs/core 8.56.2 | Apache-2.0 |
| react / react-dom 18.3.1 | MIT |

Build and test tooling: Vite (MIT), @vitejs/plugin-react (MIT), TypeScript (Apache-2.0), Vitest (MIT), playwright-core (Apache-2.0). playwright-core drives a locally installed browser and is not bundled into the game.

All names are fictional: Last Protocol, Aperture Annex, Intrusion, Custodians, Cipher Spike, and the weapon and utility names. The economy numbers, recoil paths and callouts are also original.
