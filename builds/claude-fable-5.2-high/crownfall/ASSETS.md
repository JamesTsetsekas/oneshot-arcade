# Assets

Crownfall ships **no imported art, audio, font or map files**. Everything below is original and is
generated procedurally by code in this repository at run time. The source tree (excluding
`node_modules` and `dist`) is well under 1 MB plus the screenshots in `oneshot/`.

| Asset | Where it comes from | License |
| --- | --- | --- |
| Map "The Broken Diadem" (terrain, lanes, river, brush, camps) | `src/shared/map.ts` (capsule carves → signed-distance grid) and `src/client/render/terrain.ts` (heightfield, instanced trees/brush/pylons) | Original, this project |
| Hero, monster, minion, structure and ward models | Built from Three.js primitives in `src/client/render/models.ts` and `minions.ts` | Original, this project |
| Animation | Procedural, driven by simulation timing (`animateRig` in `models.ts`) | Original, this project |
| VFX (particles, rings, cones, beams, zone decals, projectiles) | `src/client/render/vfx.ts`, GLSL written for this project | Original, this project |
| Fog-of-war texture and minimap | `src/client/render/fog.ts`, `minimap.ts` (2D canvas) | Original, this project |
| Icons (heroes, abilities, items, talents, UI) | Inline SVG paths authored in `src/client/ui/icons.tsx` | Original, this project |
| Sound effects and adaptive music | Synthesised with the Web Audio API in `src/client/audio/audio.ts` (oscillators + filtered noise) | Original, this project |
| Fonts | System fonts only (`Segoe UI` / `system-ui` / `Georgia` stacks); nothing is downloaded | n/a |
| Names, lore, hero kits, items, terminology | Written for this project from the brief | Original, this project |

## Third-party code (npm)

| Package | Use | License |
| --- | --- | --- |
| three | WebGL renderer | MIT |
| react, react-dom | UI shell, HUD | MIT |
| vite, @vitejs/plugin-react | dev server / bundler | MIT |
| typescript | type checking | Apache-2.0 |
| vitest | test runner | MIT |
| playwright-core | drives an installed browser for screenshots / playtests (dev only, not shipped) | Apache-2.0 |
| @types/* | typings (dev only) | MIT |

No analytics, trackers, accounts, API keys or external network requests are present in the build.
