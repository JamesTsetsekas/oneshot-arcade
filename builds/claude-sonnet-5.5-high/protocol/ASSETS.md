# Assets and licences

Everything the player sees and hears is generated at runtime from code in this repository. There are no image, model, audio or font files.

| Asset | Source | Licence |
| --- | --- | --- |
| Map geometry (Aperture Annex) | Authored in `src/sim/map.ts` with a grid painter | Original, this repository |
| Textures (walls, floors, crates, foliage, signs, glow) | Canvas 2D procedural generation, `src/render/textures.ts` | Original |
| Weapon, character, grenade and Spike models | Primitive geometry assembled in `src/render/models.ts` | Original |
| Sounds and menu music | Web Audio oscillators and filtered noise, `src/audio/audio.ts` | Original |
| Fonts | System font stack (Bahnschrift, Segoe UI, system-ui); nothing is bundled | OS-provided |
| three.js 0.187 | npm package `three` | MIT |
| Vite, TypeScript, Vitest, tsx, Playwright Core (dev only) | npm | MIT / Apache-2.0 |

Names, weapons, economy numbers, recoil patterns, map layout, callouts and UI are original and were not derived from any existing game.
