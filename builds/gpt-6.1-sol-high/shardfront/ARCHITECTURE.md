# Architecture and protocol

The browser owns a local authoritative `Simulation`. It advances at 20 ticks per simulated second and receives typed commands containing team, selected integer IDs, action, target/position, and queue modifier. Render and React code never calculate damage, harvesting, spending, or victory. Quantized movement limits numerical drift; the simulation has no wall-clock dependency. Commands accepted by the simulation are logged with their tick.

- `src/data.ts`: typed balance records, faction display names, map metadata, terrain validity.
- `src/navigation.ts`: bounded deterministic coarse-grid A*.
- `src/simulation.ts`: entity records, fixed-tick economy, visibility, construction, queues, abilities, combat, capture, local AI, victory, and diagnostic state hash.
- `src/renderer.ts`: Three.js WebGL 2 scene adapter, procedural assets, camera, selection, health bars, tracers, canvas fog.
- `src/main.tsx`: React menu/HUD/results, input-to-command adapter, audio, local last-result persistence.
- `tools/benchmark.ts`: reproducible simulation load test.
- `tools/serve.ts`: static nested-path verification server, not a runtime dependency.

Map schema is the typed MAP object: width/height, paired spawn points, bridge z coordinates, vent coordinates, and neutral pylon coordinates. Walkable topology is a central vertical canyon with three passable crossing lanes. Resources are finite seams positioned in mirrored clusters.

Command schema is exported as the TypeScript `Command` type. Ownership, numeric coordinates, visibility for targeted attacks, cost, production producer, supply at release, prerequisites, and placement are checked. This is an internal typed interface, not hardened untrusted network input. Before online use, add runtime schema validation, sequence/tick/rate-limit enforcement, fog-filtered snapshots, authenticating sessions, and an actual server process. Current records are object-based, not a structure-of-arrays ECS. Navigation is synchronous; there are no worker threads or hierarchical flow fields.

A diagnostic hash serializes core simulation state for deterministic tests; it is not a cryptographic checksum or complete replay snapshot. The command log has no playback UI. localStorage stores only the most recent result. No telemetry or account data is collected.
