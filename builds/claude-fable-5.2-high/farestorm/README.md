# Farestorm

An original browser arcade taxi game. You drive a "storm cab" through **Galeport**, a steep coastal city of harbor piers,
stair streets, a beach boardwalk, a canal quarter and an elevated Highline. Pick up hailing passengers, race their
patience meter to a destination beacon, chain stylish driving into a Pulse multiplier, and keep the Shift Clock alive.

Everything in the build is generated in code: the city, the cabs, traffic, passengers, textures, sound effects and the
music. There are no third-party art, audio or map assets.

## Run it

Requires Node.js 22.12+ and npm.

```bash
npm ci
npm run dev        # dev server on http://localhost:5370
npm run build      # typecheck + static production build in dist/
npm run preview    # serve dist/ on http://localhost:5371
npm test           # headless simulation and rules tests (Vitest)
```

The production build is fully static and uses relative URLs only, so `dist/` can be hosted from any sub-path
(for example `https://host/play/claude-fable-5.2-high/farestorm/`). No backend is needed.

Target: desktop Chrome or Edge with WebGL 2, keyboard and mouse, 1280x720 or larger. If WebGL 2 or WebAssembly is
missing, the game shows an error screen instead of starting.

### Tooling

```bash
node tools/serve.mjs            # serve dist/ under /play/claude-fable-5.2-high/farestorm/ on port 5372
node tools/screenshot.mjs all   # capture real screenshots of the production build into oneshot/ (needs Edge or Chrome)
node tools/screenshot.mjs final # capture oneshot/screenshot.png during gameplay
node tools/screenshot.mjs tour  # fixed-camera views of each district
npm run telemetry               # taxi tuning telemetry (0-100, top speed, braking, corner study)
```

URL parameters used by the tools (they also work by hand): `?autostart=arcade|quick|trial|school`, `&taxi=gull|breaker|tempest`,
`&seed=123`, `&hub=0..2`, `&traffic=low|medium|high`, `&autopilot` (a simple route-following driver takes the wheel), `&mute`.

## Controls

| Action | Keyboard | Gamepad |
| --- | --- | --- |
| Throttle / brake and reverse | W / S (or Up / Down) | RT / LT |
| Steer | A / D (or Left / Right) | Left stick or D-pad |
| Handbrake / drift | Space | A |
| Tailwind boost | Shift | B |
| Glance left / right, look back | Q / E, X | Right stick, Y |
| Free look | Drag the mouse | Right stick |
| Cycle camera (near, far, bumper) | C | D-pad up |
| City map | M | D-pad down |
| Reset to road (hold, costs 3 s) | R | X |
| Horn | H | - |
| Pause | Esc or P | Start |

Keys can be rebound in Settings > Controls. Gamepad support is implemented but was not tested on hardware (see the report).

### Techniques

- **Surge Start** - at a standstill tap brake, release it, and hit the throttle within 0.22 s.
- **Snap Drift** - above 35 km/h steer hard and tap the handbrake. Holding the handbrake pivots the cab and scrubs
  speed; releasing it pulls the cab onto its new heading. Straighten up to bank the drift points.
- **Grip Turn** - mid-drift, tap brake then throttle to bite and tighten the line.
- **Tailwind** - style and good deliveries charge the meter; Shift spends it as a burst of up to 2.2 s.

## What is in the slice

- **Galeport**: one 1.4 x 1.0 km city with six districts (Harbor Loop, Sunward Beach, Old Steps, Civic Crown, Lantern
  Ward, Highline), about 760 buildings, a canal with bridges, two harbor piers, an elevated Highline viaduct with an
  off-ramp, 32 named destinations with their own landmark silhouettes, and 18 authored shortcuts (stair streets,
  alleys, a tunnel, a covered arcade, a park path, a plaza cut, the boardwalk, pier and canal jumps, a parking-deck
  drop and a Highline rail gap).
- **Three cabs** with different mass, acceleration, top speed, steering and drift behaviour: Gull Compact, Breaker
  Sedan, Tempest Wagon. Raycast-wheel physics on Rapier at a fixed 60 Hz with render interpolation.
- **Fares**: 24 passenger archetypes with five preference types that change tips, short / medium / long / special fare
  tiers (circle / diamond / star / hexagon), patience grading (Blazing, Fast, Close, Late, failed), payout breakdown,
  shift-time awards, subtitle barks.
- **Scoring**: near miss, thread the needle, drift, airtime and landing, against-the-flow, shortcut (with first
  discovery bonus), clean sector, precision stop, clean pickup, Surge Start, Grip Turn. Pulse chain 1x > 2x > 3x > 5x
  with decay, diminishing returns for repeats, tier loss on collisions.
- **Traffic**: 26 / 40 / 54 lane-following vehicles (five body styles) with signals, gap keeping, reactions to the cab,
  struck-vehicle physics and recovery. A decorative sidewalk crowd hops clear of the cab.
- **Modes**: Arcade Shift (60 s, extends), Quick Shift (fixed 5 minutes), Time Trial (three fixed fare chains with
  medal times), Skill School (ten lessons).
- **Presentation**: React menus, DOM HUD with minimap and full city map, three camera modes with free look, procedural
  Web Audio (engine, tyres, impacts, cues, voice blips, adaptive music), settings with remapping, assists, HUD scale
  and reduced motion, local records and discovered shortcuts in IndexedDB.

Not in the slice: ghost replays, the optional online leaderboard, PWA/offline caching, pedestrian gameplay penalties,
the repair arch pickup, and asset streaming (the whole city is resident). See `ONESHOT-REPORT.md` for the full table.

## Project layout

```
src/
  app-shell/      boot, error handling, mode routing, fixed-step loop (game.ts, main.tsx)
  game-session/   Session: mode rules, clock, style detectors, shortcuts, guidance, results
  vehicle/        taxi tuning sheets, raycast-wheel controller, techniques, collision/landing detection
  physics/        Rapier world built from the world model (heightfield, cuboids, hulls)
  traffic/        lane graph, signals, agents, strike/recover, near-miss detection
  world/          authored Galeport data and the pure-data world model (terrain, roads, nav, buildings)
  fares/          passenger archetypes, candidates, pickup, patience, delivery payout
  score/          Pulse chain, style categories, rank thresholds
  camera-input/   keyboard/gamepad input with remapping, chase camera
  renderer/       Babylon.js scene, procedural meshes and textures, markers, particles
  audio/          procedural Web Audio engine and music
  ui/             React menus, DOM HUD, minimap, styles
  persistence/    IndexedDB store with migrations
  tools/          autopilot driver used by tests and capture
tests/            Vitest suites (world, vehicle, rules, session)
tools/            static sub-path server and screenshot capture
docs/RULES.md     fare and scoring formulas, taxi tuning sheet, determinism notes
```

The simulation (`world`, `physics`, `vehicle`, `traffic`, `fares`, `score`, `game-session`) has no dependency on the
renderer or the DOM and runs headlessly under Node, which is how the tests exercise complete shifts.

## Deployment

Run `npm run build` and upload the contents of `dist/` to any static host. No server configuration, headers or
rewrites are required. The entry chunk is large (about 11 MB, 3.2 MB gzipped) because the whole Babylon.js core is
bundled; enable gzip or brotli on the host.

## License and assets

Game code and all generated content were written for this project. Third-party libraries and fonts are listed with
their licenses in `ASSETS.md`.
