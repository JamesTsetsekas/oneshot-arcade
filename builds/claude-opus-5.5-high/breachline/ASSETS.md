# Assets and licenses

Breachline ships **no external art, model, audio or font files**. Everything you see or hear is generated
at runtime by code in this repository, which is original work written for this project.

| Asset | Source | License |
|---|---|---|
| Map geometry (Relay Station K-17), collision and navigation | `src/content/map-k17.ts`, `src/server/nav.ts`: hand-authored boxes and a baked walkability graph | Original, part of this project |
| Environment textures (concrete, composite panels, metal, grate, crates, containers, rock, tiles, sand) and normal maps | `src/renderer/textures.ts`: painted procedurally on canvas | Original, part of this project |
| Signage text, name tags | Canvas text rendered with the system UI font | Original; uses fonts already installed on the system |
| Sky dome, clouds, sun, ocean shader | `src/renderer/world.ts`: vertex-colored dome, procedural sprites, custom GLSL water | Original, part of this project |
| Weapons, viewmodel arms, soldiers, drone, ammo pod, jet, equipment | `src/renderer/weaponModel.ts`, `characters.ts`, `vfx.ts`, `viewmodel.ts`: assembled from primitives | Original, part of this project |
| Particles, decals, muzzle flashes, smoke | `src/renderer/vfx.ts` with procedural sprite textures | Original, part of this project |
| Sound effects and music | `src/audio/audio.ts`: synthesized with the Web Audio API (noise, oscillators, filters) | Original, part of this project |
| UI icons / favicon | Inline SVG / CSS | Original, part of this project |

## Third-party software (npm)

| Package | Use | License |
|---|---|---|
| @babylonjs/core | WebGL 2 rendering engine | Apache-2.0 |
| react, react-dom | Menus, loadout editor, settings and results shell | MIT |
| vite, @vitejs/plugin-react | Dev server and bundler | MIT |
| typescript | Type checking | Apache-2.0 |
| vitest | Test runner | MIT |
| playwright-core | Screenshot and UI verification scripts (dev only; drives the system Edge/Chrome) | Apache-2.0 |

All faction names (Halyard Security, Vantor Response), weapon designations, perk, equipment and
support-action names, map names, and announcer lines are fictional and were written for this project.
