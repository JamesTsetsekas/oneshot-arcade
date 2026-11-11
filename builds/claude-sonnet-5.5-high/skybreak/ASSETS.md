# Assets

Skybreak ships **no external art, audio, fonts, maps or models**. Everything is original and generated in code at load time.

| Asset | Source | License |
| --- | --- | --- |
| Island terrain, collision, buildings, trees, rocks, ziplines, vents ("The Highwake") | Procedural generator in `src/sim/world.ts` (seeded value-noise + authored layouts) | Original work, MIT-style project code |
| Scavenger characters (4 outfits) and wing-sail, skiff, supply capsule, chests/lockers | Built from primitive meshes in `src/client/models.ts` | Original |
| Nine weapons (wind-instrument / ceramic / copper inspired) and eight consumables/utilities, pickup + HUD icons | Primitive meshes (`models.ts`) and 2D canvas drawings (`hud.ts`, `gameview.ts`) | Original |
| Sky, clouds, water normal map, storm wall shader, vent and beam effects | GLSL/canvas generated in `src/client/worldview.ts` | Original |
| Rarity shapes (circle, chevron, diamond, crown, star) | Canvas paths in `src/client/gameview.ts` | Original |
| Sound effects and score | Web Audio synthesis in `src/client/audio.ts` (noise bursts, oscillators, generative pad) | Original |
| UI (menus, HUD, map) | HTML/CSS in `src/client/style.css`, `hud.ts`, `screens.ts`; system fonts only ("Segoe UI" / "Trebuchet MS" / sans-serif fallbacks) | Original |
| Favicon | Inline SVG in `index.html` | Original |

## Third-party code

| Package | Use | License |
| --- | --- | --- |
| [three](https://github.com/mrdoob/three.js) 0.170.0 | WebGL 2 rendering | MIT |
| [vite](https://vitejs.dev) 6, [typescript](https://www.typescriptlang.org) 5, [vitest](https://vitest.dev) 2 | Build, type-check, tests (dev only) | MIT / Apache-2.0 |
| [playwright-core](https://playwright.dev) 1.49 | Headless browser verification scripts in `tools/` (dev only, not shipped) | Apache-2.0 |

## IP boundary

No island, character, weapon, item name, glider, UI layout, music, sound or effect from any existing battle royale game is used. Weapon, item, location and mode names (Wayfarer Rifle, Aegis, Calmfield, Riftstorm, Aerie Market, ...) are invented for this project.
