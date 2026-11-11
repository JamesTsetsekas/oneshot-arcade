# Asset manifest

Shardfront ships **no binary art, audio, font or model files**. Every asset is original and generated procedurally from
source code at runtime.

| Asset class | Source | License |
|---|---|---|
| 15 unit models + 12 structure models + resource nodes, vents, Watch Pylons, salvage pods, crystal barriers | Authored as primitive-composition tables in `src/render/models.ts` (boxes, cylinders, cones, ellipsoids, octahedra merged per render group) | Original work, same licence as the repository |
| Terrain mesh, cliffs, bridges, brush, rock / crystal scenery, fog-of-war shading, plate grid and mineral-vein surface detail | Generated from the glyph map in `src/sim/map.ts` and `src/render/terrain.ts` (value noise, GLSL injected into `MeshStandardMaterial`) | Original |
| Command / unit / structure / upgrade icons and portraits | Drawn with Canvas 2D paths in `src/ui/icons.ts`, cached as data URLs | Original |
| VFX (muzzle flashes, tracers, beams, shock rings, debris, dust, telegraph decals) | Procedural particles / meshes in `src/render/vfx.ts` | Original |
| Sound effects (weapons, impacts, alerts, UI, victory / defeat) | Synthesised with the Web Audio API (oscillators + filtered noise) in `src/audio/audio.ts` | Original |
| Adaptive music (drone pad, rhythmic and lead stems, intensity hysteresis) | Synthesised at runtime in `src/audio/audio.ts` | Original |
| UI typography | System font stack (`Segoe UI`, `system-ui`, `Roboto`); no web fonts are downloaded | n/a |
| Favicon | Inline SVG data URI in `index.html` | Original |

## Libraries (code, not assets)

| Package | Version | Licence | Use |
|---|---|---|---|
| three | 0.170.0 | MIT | WebGL 2 rendering, geometry merging |
| vite | 6.0.3 | MIT | build / dev server |
| typescript | 5.6.3 | Apache-2.0 | language / type checking |
| vitest | 2.1.8 | MIT | tests |
| playwright-core | 1.49.1 | Apache-2.0 | dev-only browser automation for screenshots / E2E (uses the machine's installed Edge/Chrome; nothing is downloaded or bundled) |

No names, factions, units, buildings, maps, silhouettes, lore, sounds, music, voice lines or balance values were taken from any
existing game; the two factions use original terminology and geometry.
