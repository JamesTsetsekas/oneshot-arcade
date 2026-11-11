# Skybreak

An original, browser-based **battle royale vertical slice**: drop from a transit skiff onto **The Highwake**, a 1.2 km floating island, loot weapons and gear, fight 23 bots, rotate through the shrinking **Calmfield** as the **Riftstorm** closes in, and be the last one standing. No building, no backend, no accounts: it runs entirely in your browser from static files.

* Third-person over-the-shoulder shooter, 24-player Solo (you + 23 server-style bots), ~13 minutes per match
* Staging pier → skiff → freefall → wing-sail glide → loot → fight → storm rotations → results → requeue
* Practice Range with every weapon/rarity, targets, a movement course and live damage/recoil readout
* TypeScript (strict) + three.js, all assets procedural (see `ASSETS.md`)

## Run

Requires Node.js 22.12+ and a desktop Chrome/Edge (or Firefox) with WebGL 2.

```bash
npm ci
npm run dev        # http://localhost:5550
npm run build      # static site in dist/ (relative URLs: works from any sub-path)
npm test           # headless simulation/rules tests (vitest)
npm run preview    # serve dist/ on http://localhost:5551
```

`dist/` is a plain static site (`base: "./"`); serve it from any directory, e.g. `https://host/play/claude-sonnet-5.5-high/skybreak/`.

## Controls (rebindable in Settings → Controls)

| Action | Default |
| --- | --- |
| Move / aim / fire / aim-down-sights | `WASD` / mouse / `LMB` / `RMB` (hold or toggle) |
| Sprint (5 s energy bar) / crouch / slide (crouch while sprinting) | `Shift` / `Ctrl` or `C` |
| Jump · mantle ledges 0.6–1.5 m (hold near a ledge) · deploy wing-sail in the air | `Space` |
| Interact / pick up / open chest / board zipline (hold to swap when inventory is full) | `E` |
| Select slot 1–5 / cycle | `1`–`5` / mouse wheel |
| Reload · drop selected · quick melee · swap shoulder | `R` · `Q` · `F` · `X` |
| Throw Wind Orb / Mist Capsule | `G` (or select it and fire) |
| Use heal / shield: select the slot, then fire (click again to cancel) | `LMB` |
| Wing-sail deploy / stow | `Z` (or `Space`); auto-deploys at 140 m |
| Inventory · full map (click to set a marker) · middle-click ping | `Tab` · `M` · `MMB` |
| Menu / pause · skip staging countdown | `Esc` · `Enter` |

Freefall: `W` dive, `S` slow, mouse to steer. Wing-sail: `W` boost, `S` brake. The skiff jump needs you to be above the island.

## What is in the slice

* **Loop**: menu → queue (local room, bot fill) → 35 s staging pier → skiff along a seeded path → choose your jump with the map → freefall/glide → loot → fight → heal/shield → rotate → last survivor → results → requeue. Eliminated? Spectate legal players (with a ×4 fast-forward) or jump to results.
* **The Highwake**: six named locations (Aerie Market, Sunken Array, Kilnworks, Orchard Steps, Wind Abbey, Breaker Docks) plus eight landmarks, ridges, gullies, boulders, trees, buildings with doors, ziplines, air vents, a lethal heat-channel hazard, swimmable water.
* **Combat**: nine data-driven weapons (hitscan, pump/auto shotguns with a per-shot damage cap, projectile Longwake Rail, Gale Launcher), five rarities with distinct shapes, deterministic recoil pattern + seeded spread, head/torso/limb zones, falloff, health + Aegis (rechargeable) + Reserve shield.
* **Inventory/loot**: five universal slots, four capped ammo types, eight consumables/utilities (Med Injector, Trauma Kit, Shield Flask, Aegis Cell, Mist Capsule, Grapple Spool, Echo Beacon, Wind Orb), floor loot, resonance chests, supply lockers, death caches, supply capsules, per-match Prototype cap.
* **Movement**: walk/run/sprint/crouch, slide, jump, mantle, swim, zipline, grapple, air vents, freefall and wing-sail glide — all in one authoritative character controller.
* **Calmfield/Riftstorm**: the brief's phases and damage numbers, deterministic seeded centres taken from authored valid-zone candidates, minimap/map with current + next circle, timers, storm vignette.
* **Bots**: perception-limited (sight cone, line of sight, mist clouds, audible gunshots/footsteps), reaction time and aim noise by skill, loot/rotate/engage/flee/heal behaviour; no health/vision cheats.
* **UI/UX**: HUD, compass, minimap, full map with marker, inventory screen with exact stats, pickup comparison arrows, hit markers, damage arcs, kill feed, spectator, results (placement, elims/assists, damage, accuracy, survival, distance, storm, loot history, timeline, route), settings (graphics presets, dynamic resolution, FOV, sensitivities, remapping, audio, reduced motion, colorblind palette, visual sound indicators, captions), career/mastery with cosmetic outfits (local storage).
* **Audio**: procedural Web Audio — spatialised gunshots, footsteps, pickups, hits, heals, storm cues and a sparse generative score that tenses as the field closes.

## Architecture (short)

```
src/shared   content.ts (weapons, rarity, items, loot tiers, storm, movement constants), math, seeded RNG
src/sim      world (island + collision), movement (character controller), match (authoritative 30 Hz
             rules host), combat/damage, inventory, loot tables, storm schedule, bots
src/client   three.js renderer (worldview, gameview, models), HUD/screens (DOM), input, audio, game loop
tests        vitest: content, world, controller, combat, inventory/loot, storm, full 24-seat matches
tools        static server + Playwright scripts used for the production-build verification
```

The simulation is a pure TypeScript module with no rendering dependency; the client feeds it inputs at 30 Hz and renders interpolated state, exactly the boundary a networked server would sit behind. See `ONESHOT-REPORT.md` for coverage, deviations and honest limitations.
