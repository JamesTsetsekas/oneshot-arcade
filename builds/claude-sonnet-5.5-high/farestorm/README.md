# FARESTORM — Galeport Shift

An original browser arcade taxi game. You drive a "storm cab" around **Galeport**, a bright coastal city of market terraces, neon alleys, a harbour and a beach. Race a shift clock, pick fares by risk and reward, take shortcuts, drift and thread traffic to build **Pulse** (a tip multiplier) and charge **Tailwind** (a speed burst), deliver before each passenger's patience runs out, extend your shift, and chase a rank from D to S.

All code, geometry, audio and UI are original and generated at runtime — there are no external assets (see [ASSETS.md](ASSETS.md)).

## Run it

Requires Node.js 22.12+ and a desktop browser with WebGL 2 (Chrome / Edge / Firefox).

```bash
npm ci          # install exactly what package-lock.json pins
npm run dev     # dev server on http://localhost:5570
npm run build   # typecheck + static site in dist/ (works from any sub-path)
npm test        # headless simulation/rules tests (vitest)
npm run preview # serve dist/ on http://localhost:5570
```

The production build uses relative URLs only (`base: "./"`), so `dist/` can be hosted at any path, for example `https://host/play/claude-sonnet-5.5-high/farestorm/`. Single-player needs nothing but static file hosting.

## Controls

| Action | Keyboard | Gamepad |
| --- | --- | --- |
| Throttle / brake & reverse | `W` `S` or arrows | RT / LT |
| Steer | `A` `D` or arrows | Left stick |
| Handbrake / drift | `Space` | A |
| Tailwind boost | `Shift` | B |
| Camera (near / far / bumper) | `C` | D-pad up/down |
| Look back (hold) | `X` | Y |
| Reset a stuck taxi (hold 1 s, costs time and points) | `R` | — |
| Full map | `M` | Back |
| Pause | `Esc` / `P` | Start |

**Moves** (small vocabulary, tolerant windows):

* **Surge Start** – stop, release the brake, then tap throttle within ~0.25 s for a launch burst. Every pickup stop is a chance to use it.
* **Snap Drift** – above 35 km/h, steer hard and tap `Space`. Hold with throttle and steering; exit by counter-steering. Drift points are banked on a clean exit.
* **Grip Turn** – during a drift, tap the brake then throttle to tighten the line.
* **Tailwind** – hold `Shift` once the meter has charge (up to 2.2 s per full bar; it cannot recharge while active).

## How a shift works

1. Pick a mode, taxi and colour (Garage), then start. You get a 3-2-1 countdown.
2. Coloured beacons mark waiting passengers: **green circle** = short fare, **amber diamond** = medium, **magenta star** = long. Roll below 35 km/h into the ring and stop (<5 km/h) — a centred stop pays a bonus.
3. The passenger boards; the top-centre panel shows destination, distance, the patience bar (white tick = par time). A floating arrow above the cab and the minimap follow the road network — it is **not always the fastest way**: alleys, plazas, beach dunes, yards and ramps are shortcuts you learn.
4. Stop in the arrival ring (<8 km/h). Grade (Blazing / Fast / Close / Late), fare, time bonus, style tips and passenger bonuses are paid; Arcade Shift adds time based on grade and distance.
5. Style builds Pulse: near misses, thread-the-needle, drifts, airtime, oncoming lanes on boulevards, shortcuts, clean sectors, precision stops. A collision drops a tier, a hard crash loses the chain, repeating one trick pays less.
6. When the clock hits zero you get a 2-second grace if you are already in the destination ring; otherwise the shift ends and you see your rank and stats.

## What is in this slice

* **Galeport** – 48 blocks in five districts (Lantern Ward, Old Steps, Civic Crown, Sunward Beach, Harbor Loop), 32 named destinations with oversized landmark silhouettes, 32 authored shortcuts (alleys, tunnels, garage cut, deck, ferry hold, tram lane, plaza/park/dune/yard cuts, 14 with jump ramps), sea, shallows, perimeter walls, three spawn hubs.
* **Three taxis** – Gull Compact (agile), Breaker Sedan (balanced), Tempest Wagon (heavy, shoves traffic) with real, tested differences in acceleration, top speed, steering, drift authority and mass.
* **24 passenger archetypes** with eight tip preferences (thrill-seeker, fragile courier, tourist, late worker, musician, calm, foodie, racer), short barks with subtitles and cooldowns.
* **Fares** – at least five candidates always live near you (short/medium/long mix, destination variety), par time from the shortest legal route, patience timer, personal grace, delivery overlay.
* **Scoring** – Pulse tiers 1×/2×/3×/5×, 3.5 s decay, chain banking, anti-farm falloff, Tailwind meter, tokens and clock sparks (max 3 per shift).
* **Traffic** – lane-graph vehicles (5 body types × 10 colours) with signals, following distance, turning arcs, honking, overtaking a stopped taxi, shoving physics, wrecks that clear themselves.
* **Modes** – Arcade Shift (60 s + earned time), Quick Shift (fixed 5:00), Time Trial (fixed four-fare chain with identical traffic and medals).
* **UI** – menus, taxi/colour garage, records, settings (volume, shadows, render scale, dynamic resolution, FOV, shake, HUD scale 100/125/150 %, reduced motion, photosensitivity, colour-blind-safe markers, subtitles, guidance mode, gamepad dead zone), pause, results with rank S–D, full-map (`M`), heading-up minimap, off-screen markers.
* **Presentation** – chase camera with speed FOV, drift tilt and impact shake; tyre smoke, skid marks, boost trail, sparks, confetti; sun that drifts toward sunset over a run; procedural engine/tyre/wind/collision audio and an original adaptive music loop.
* **Persistence** – best scores, discovered shortcuts, settings, taxi and colour in `localStorage` (versioned, corruption-safe).

Not in this slice (see `ONESHOT-REPORT.md` for the honest list): Skill School, ghosts/replays, online leaderboard, Rapier/Babylon, key remapping, pedestrian crossing logic.

## Verification aids

* `?autostart=arcade|quick|trial&taxi=gull|breaker|tempest&traffic=calm|normal|dense&seed=N` skips the menus.
* `?bot=1` runs a simple autopilot that follows the same guidance a player sees — used by the headless tests and `scripts/capture.mjs` to exercise pickup → delivery → results end to end.
* `node scripts/capture.mjs shots` captures screenshots from `dist/` served under a sub-path (needs a local Chrome/Edge).

## Layout

```
src/sim/      pure, deterministic simulation (world, vehicle, traffic, fares, score, session) — no DOM
src/render/   three.js city, vehicles, camera, particles
src/ui/       DOM HUD, menus, minimap
src/audio/    Web Audio synthesis
tests/        vitest suites for the simulation and rules
scripts/      headless capture / verification
```
