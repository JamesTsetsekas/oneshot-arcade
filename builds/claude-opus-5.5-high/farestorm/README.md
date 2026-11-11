# Farestorm

An original browser arcade taxi game. You drive a "storm cab" around **Galeport**, an invented coastal
city of harbor quays, beach boardwalks, neon canal alleys, steep cobbled terraces, a civic plaza and a fast
hillside Highline. Pick fares by risk and reward, race their patience timers, carve shortcuts, drift, skim
traffic and jump ramps to build **Pulse** (a tip multiplier) and charge your **Tailwind** boost, and keep the
Shift Clock alive by delivering well.

Everything (city, cabs, passengers, textures, music, sound) is generated in code at load time. No external
assets, fonts, analytics or network services.

## Run it

Requires Node.js 22.12+ and npm.

```bash
npm ci          # install exact locked dependencies
npm run dev     # dev server on http://localhost:5470
npm run build   # type-check + static production build into dist/ (relative URLs, works from any sub-path)
npm test        # headless simulation/rules tests (Vitest)
```

Optional helpers (use a locally installed Edge/Chrome through `playwright-core`; no browser download):

```bash
node scripts/serve.mjs        # serve dist/ under /play/claude-opus-5.5-high/farestorm/ on port 5472
npm run screenshot            # capture oneshot/menu.png + oneshot/screenshot.png from the production build
node scripts/flows.mjs        # smoke-test every mode in a real browser and report page errors
node scripts/keyboard.mjs     # verify keyboard driving / drift / pause through the real UI
```

`?autodrive=1` on the URL starts an Arcade Shift driven by the built-in route-following demo driver (used for
screenshots and smoke tests; `&seed=N` fixes the run).

## Controls

| Action | Keyboard | Gamepad (standard mapping) |
| --- | --- | --- |
| Throttle / brake-reverse | W / S (or arrows) | RT / LT |
| Steer | A / D | Left stick |
| Handbrake / drift | Space | A |
| Tailwind boost | Shift | B |
| Pick up / confirm (pickup is automatic when you stop in a ring) | E | X |
| Horn (cars ahead make room) | H | Left stick press |
| Reset (hold, 3 s penalty) | R | Back/View |
| Glance left / right, look back | Z / C, X | LB / RB, Y |
| Free look | Drag with the mouse | Right stick |
| Cycle camera (near / far / bumper) | V | D-pad up |
| City map | M or Tab | D-pad down |
| Pause | Esc or P | Start |

All keyboard bindings can be remapped in Settings. Menus work with mouse, arrow keys + Enter, or the D-pad + A/B.

**Advanced moves** (practise them in Skill School):
- **Surge Start** - stopped, hold brake, release it, then tap throttle within 0.22 s.
- **Snap Drift** - above 35 km/h steer hard and tap Space. Hold the slide with throttle and steering; countersteer to exit. A clean exit banks the points.
- **Grip Turn** - while drifting, tap brake then throttle to tighten the line.
- **One-button drift preset** (Settings / shift setup): the drift lasts exactly as long as you hold Space.

## What is in this slice

- **Galeport**: ~1.4 x 1.0 km, 6 districts, 75 junctions (56 signalised) and 127 road segments, ~700 buildings, 4 "Hill crest"
  launches, a canal with bridges, beach, harbor quay with an inlet, 32 destinations with big procedural landmarks
  and signage, and **18 authored shortcuts** (alleys, covered arcade, canal leap, stair street, grass terraces,
  tram lane, beach runs, hotel forecourt, seawall kicker, ferry deck, container lane, parking-deck cut, lawn cut,
  stadium service road, construction deck, overpass gap) with gate arches and first-discovery bonuses.
- **Three cabs** with distinct tuning (Gull Compact, Breaker Sedan, Tempest Wagon) and six liveries each (four
  unlocked through Skill School and medals).
- **Arcade Shift** (60 s clock, deliveries extend it), **Quick Shift** (fixed 5 min), **Time Trial** (6 fixed fare
  chains, medals, saved ghost car), **Skill School** (10 lessons).
- **24 passenger archetypes** with preferences that change tips, subtitled chirp-voice barks, short / medium /
  long / VIP fares with colour + shape coding, patience timers, Blazing/Fast/Close/Late/Failed grades, fare
  breakdown, shift-time awards, rank S-D, local records.
- **Style system**: close shaves, needle threads, slides, airtime, rush lanes (marked oncoming segments),
  shortcuts, clean sectors, pinpoint stops, surge starts, grip turns; Pulse 1x/2x/3x/5x with decay, tier drop on
  bumps, reset on hard crashes and diminishing returns for repeated actions.
- **Traffic** on a lane graph with signals, following, lane changes, turning, horn reactions, knock-back and
  recovery, and spawn/despawn that avoids the camera; **pedestrians** that leap clear (safety assist + penalty,
  never contact).
- Pickups: Tailwind tokens, Clock sparks (max 3 per shift), repair arches; scattering props that reset.
- Procedural Web Audio: per-cab engine, tyres, wind, surface rumble, district ambience, cues, and an adaptive
  original surf-breakbeat soundtrack that layers up with Pulse.
- Settings: audio buses, quality/shadows/bloom/dynamic resolution, traffic and crowd density, shake, FOV,
  reduced motion, photosensitivity, steering sensitivity/speed, dead zone, vibration, assists, route-arrow mode,
  HUD scale 100/125/150%, subtitles, colour-blind-safe fare colours, minimap, key remapping.

See `ONESHOT-REPORT.md` for exact coverage, verification and known issues.

## Project layout

```
src/sim/        deterministic simulation (no DOM / Babylon): world, vehicle, traffic, fares, score, session
src/render/     Babylon.js scene: procedural city/vehicles/people, camera rig, particles, post-processing
src/audio/      Web Audio synthesis (engine, SFX, music, voices)
src/ui/         HUD, minimap and styles;   src/app.ts  menus, mode routing, game loop, records
src/input/      keyboard / mouse / gamepad mapping;   src/persist/  versioned IndexedDB saves
tests/          Vitest suites for world validity, handling, scoring, rules, determinism, persistence
scripts/        sub-path static server, screenshot + browser smoke tests
```
