# Assets and licences

Ashfall Covenant ships **no binary art, audio or font files**. Everything the player sees and hears is generated at runtime from code in this repository.

| Asset | Source | Licence |
| --- | --- | --- |
| 3D meshes (two player rigs, ten enemy families plus support entities, two bosses, four NPCs, props, loot pickups, waypoints, portals) | Authored in code (`src/render/models.ts`, `src/render/props.ts`) from three.js primitives with vertex colours | Original, same licence as the project |
| Floor and wall textures | Drawn on a Canvas 2D context at load (`src/render/textures.ts`) with a seeded hash | Original |
| Item, skill and potion icons | Drawn on a Canvas 2D context and cached as data URLs (`src/ui/icons.ts`) | Original |
| Telegraph decals, particles, projectiles, beams | GLSL shaders and three.js geometry written for this project (`src/render/vfx.ts`) | Original |
| Sound effects | Synthesised with the Web Audio API (oscillators, filtered noise, convolution reverb) in `src/audio/audio.ts` | Original |
| Music | Procedural drones, bell tones and a rhythm generator in `src/audio/audio.ts`; no melodies copied or imitated | Original |
| UI frames and layout | Plain CSS in `src/style.css` | Original |
| Fonts | None bundled. The UI uses the system font stack `Palatino Linotype, Palatino, Book Antiqua, Georgia, serif` | System fonts, not redistributed |
| Names, items, monsters, skills, quests, dialogue | Written for this project; only genre-level principles are shared with other ARPGs | Original |

## Third-party code (npm packages)

| Package | Use | Licence |
| --- | --- | --- |
| [three](https://github.com/mrdoob/three.js) | WebGL rendering | MIT |
| vite, vitest, typescript, @types/three, @types/node | Build and test tooling (dev only) | MIT / Apache-2.0 |
| playwright-core | Headless-browser screenshot and smoke tooling (dev only; not shipped) | Apache-2.0 |

No analytics, trackers, accounts, API keys or network calls are included.
