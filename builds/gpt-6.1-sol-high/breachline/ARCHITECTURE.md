# Slice architecture and content reference

## Modules

- `src/simulation.ts`: fixed 60 Hz gameplay, weapon balance, collision boxes, grid route search, bot decisions, damage, score, spawn director and match termination. It has no browser or rendering imports.
- `src/runtime.ts`: Babylon scene, original mesh generation, camera/viewmodel, input submission, Web Audio feedback and transient effects. Rendering consumes simulation events.
- `src/main.tsx`: React loadout shell, HUD, minimap, pause/settings, scoreboard, results and local profile storage.
- `src/simulation.test.ts`: headless rule verification.

## Embedded protocol

Inputs: movement axes, yaw/pitch, fire, ADS, sprint, crouch and jump. Events: shot, reload, hit, kill, explosion and recon with actor IDs and positions. This is an in-process interface, not a network wire schema. No networking, matchmaking, database migration or hosted game room is delivered. A future server can reuse the pure simulation, but must add validation, clock ownership, hit history, snapshots and prediction before it is safe for online play.

## Map source

`walls` in simulation.ts is the shared collision/rendering source. Deck bounds are x +/-38, z +/-32 metres. Route search builds a 2 m occupancy grid and uses four-connected BFS around static cover. Two large opposing wings, center dish, outer pipe routes and smaller cover create connected lanes. Visual railings and lamps are decorative; boundary walls are simulation-owned. No moving platforms, interiors, tunnels or catwalk traversal.

## Balance

Weapon data live in `weapons`: Jackal 26 damage / 30 rounds / .084 s cadence; Kestrel 21 / 36 / .067; Mesa 43 / 18 / .22; Relay 27 / 12 / .19. Head multiplier is 1.6; range falloff is .72 beyond each weapon's tuned range. Base HP 100, regen 22 HP/s after 5 seconds. Bot shots use slower cadence, probabilistic accuracy and 11 damage; this is a forgiving offline slice, not parity competitive AI. Spawn protection lasts 2 seconds and ends on firing. Spawn selection maximizes the nearest enemy distance, with a direct-visibility penalty. No claimed 10,000-spawn safety guarantee.

## Persistence and security

Local storage `breachline-profile` holds xp, matches and wins. No identity, secrets or telemetry. Local profile values can be edited and are not trusted by any service. Reset via browser site data. No anti-cheat claims. Settings last for the current app session. No replay inspector, network/latency lab, video, load test or hardware benchmark is delivered.

## Accessibility and browser matrix

Readable opposing IFF accents and team names, adjustable sensitivity and audio mute are included. Full remapping, colorblind presets, reduced-motion controls, subtitles, separate scoped sensitivity and comprehensive keyboard menu navigation are not implemented. Chromium headless WebGL2 is checked; desktop Edge, Firefox and Safari are unverified. Pointer lock loss pauses and clears input; graphics loss offers reload. No service connection recovery is applicable offline.
