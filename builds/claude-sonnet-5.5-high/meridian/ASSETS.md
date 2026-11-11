# Assets, sources and licenses

Meridian Run ships **no external art, audio, font, model or texture files**. Everything is generated at runtime by original code in this repository.

| Asset class | How it is made | Source file(s) | License |
|---|---|---|---|
| City geometry (roads, sidewalks, buildings, props, landmarks, boats) | Procedural geometry (merged boxes, cylinders, spheres), seeded by `World(1107)` | `src/sim/world.ts`, `src/render/worldBuilder.ts`, `src/render/geo.ts` | Original, MIT-style (project code) |
| Facade, asphalt, pavement, plaza, deck and sign textures | Procedural canvas drawing (`DynamicTexture`) with seeded noise | `src/render/textures.ts` | Original |
| Sky, clouds, stars, harbor water | Custom GLSL shaders | `src/render/atmosphere.ts`, `src/render/worldBuilder.ts` | Original |
| Eight vehicles (three cars, muscle coupe, van, interceptor, two motorcycles) | Procedural low-poly meshes with vertex colours; names and badges are fictional | `src/render/actors.ts`, `src/sim/vehicle.ts` | Original |
| Characters (Rowan, pedestrians, police) | Procedural articulated low-poly rigs; palettes by variant | `src/render/actors.ts` | Original |
| VFX (tracers, sparks, smoke, rain, tyre smoke) | Babylon.js particle systems and pooled meshes, generated radial-gradient texture | `src/render/vfx.ts` | Original |
| Sound effects (engines, tyres, sirens, weapons, horn, UI, ambience) | Web Audio API synthesis (oscillators + filtered noise) at runtime | `src/audio/audio.ts` | Original |
| Radio: "Quay FM - Harbor Beat" and "Lantern 91 - Local Indie" | Procedural step sequencers (kick/hat/bass/arp and plucked chords) | `src/audio/audio.ts` | Original |
| Dialogue, barks, mission text, district and business names | Written for this project; all names are fictional | `src/sim/missionDefs.ts`, `src/sim/peds.ts`, `src/sim/police.ts` | Original |
| UI layout, panels, typography | HTML/CSS; font stack uses system fonts (Bahnschrift / Segoe UI / system-ui), none bundled | `src/ui/styles.css` | Original |
| App icon | Hand-written SVG | `public/icon.svg` | Original |

## Third-party software (dependencies, not assets)

| Package | Use | License |
|---|---|---|
| `@babylonjs/core` 8.x | WebGL 2 rendering engine | Apache-2.0 |
| `vite` 7.x | Dev server and bundler | MIT |
| `typescript` 5.9 | Type checking | Apache-2.0 |
| `vitest` 3.x | Automated tests | MIT |
| `playwright-core` | Headless browser screenshots/smoke checks (dev only, `scripts/`) | Apache-2.0 |

No IP from any existing game is used: the city (Port Meridian / South Quay), characters, missions, vehicles, brands, UI and audio are original. No analytics, trackers, telemetry or network services are included; the game runs from static files.
