# Assets and licenses

Meridian Run ships **no third-party art, audio, fonts, maps or text**. Every asset is generated at runtime by code in this repository, or is a small file authored for this project.

| Asset | Source | License |
|---|---|---|
| South Quay district layout, street and place names | Authored data in `src/world/district.ts`, `src/world/lots.ts` | Original, part of this project |
| Buildings, props, landmarks, terrain, bridges | Procedural geometry: `src/world/lots.ts`, `src/renderer/city.ts`, `src/renderer/geo.ts` | Original |
| Ground and facade textures, particle sprites, water normal map | Drawn on canvases at boot: `src/renderer/textures.ts` | Original |
| Eight vehicles (Kestrel Dart, Moreno Tern, Halden Coaster, Brask Cutlass, Halden Portage, Halden Warden Interceptor, Kestrel Swift 250, Ostrava Sirocco) | Procedural meshes from the tuning sheet: `src/renderer/vehicleMesh.ts`, `src/vehicles/specs.ts`. Fictional makers and models. | Original |
| Characters (Rowan, pedestrians, officers, guards, rivals) | Box-part figures animated in code: `src/renderer/renderer.ts` | Original |
| All sound effects, engine and siren loops, ambience, rain | Synthesised with the Web Audio API: `src/audio/audio.ts`. No sample files. | Original |
| Radio stations "Tideline 98.2" and "Lantern Indie 104" | Generative sequencers in `src/audio/audio.ts`; station idents are text only | Original |
| Dialogue, barks, mission text, UI copy | `src/missions/data.ts`, `src/pedestrians/barks.ts`, UI sources | Original |
| App icon | `public/icon.svg`, hand-written SVG | Original |
| UI typography | System font stacks only (Segoe UI / system-ui, Georgia). No font files are bundled. | n/a |

## Open-source libraries (runtime)

| Library | Use | License |
|---|---|---|
| `@babylonjs/core` | WebGL 2 rendering | Apache-2.0 |
| `@dimforge/rapier3d-compat` | Physics (WASM inlined in the bundle) | Apache-2.0 |
| `react`, `react-dom` | Menu, map, phone, shop and settings screens | MIT |

Development only: `vite`, `vitest`, `typescript`, `fake-indexeddb`, `playwright-core`, `@types/*`.

No analytics, trackers, accounts, API keys or network services are used.
