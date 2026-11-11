# BREACHLINE

An original fast-respawn **6v6 browser FPS** (Team Clash) on a fictional island relay station. This repository is a **playable vertical slice**: the full Practice loop (menu → loadout → warm-up → match → recap/respawn → results → play again) with server-style bots, built on a deterministic fixed-step simulation that is separate from rendering.

Stack: TypeScript (strict), Vite, Babylon.js (WebGL 2), React for the shell/menus, a plain-DOM HUD, Web Audio (all sounds synthesized), Vitest.

## Run

```bash
npm ci
npm run dev       # http://localhost:5520
npm run build     # static site in dist/ (relative URLs: works from any sub-path)
npm run preview   # serves dist/ on :5521
npm test          # headless simulation / rules / bots / client-logic tests
```

Desktop Chrome or Edge with WebGL 2, keyboard and mouse (Pointer Lock). A clear error screen is shown if WebGL 2 or Web Audio is missing. Practice needs no backend.

## Controls

| Input | Action | Input | Action |
|---|---|---|---|
| W A S D | Move | Shift | Sprint (starts after 120 ms) |
| Mouse | Aim | Ctrl / C | Crouch |
| LMB / RMB | Fire / aim down sights | Space | Jump / mantle (0.6-1.35 m ledges) |
| R | Reload | F | Quick melee |
| G (hold to cook) / Q | Lethal / tactical equipment | 1 / 2 / wheel | Primary / sidearm |
| 3 / 4 | Select / deploy Momentum support | Tab | Scoreboard |
| M | Loadout switch (while dead, then 1-5) | X | Ping |
| B | Inspect weapon (cancels instantly) | Esc | Pause menu |

All keys can be remapped in Settings. Hold/toggle for ADS, crouch and sprint, separate ADS sensitivity, FOV 75-110, viewmodel FOV 55-75, colour-blind palettes, reduced motion and photosensitivity options are included.

## What is in the slice

- **Relay Station K-17**: ~115 x 95 m, mirrored for team balance. Operations wing (control room with breakable glass, service tunnels), central dish courtyard (cover, catwalk with stairs, thin penetrable panels), North Ridge long lane with container baffles, Utility Pipeway short lane, 4 courtyard connectors, spawn rooms with two exits and sight blockers.
- **Team Clash**: 75 points or 8:00, warm-up countdown, 60 s sudden death (+5), post-match results; Practice setup for bot difficulty, score/time limit and team fill.
- **Combat**: 6 primaries, 3 sidearms, 11 attachments (max 3, one per slot, visible tradeoffs), recoil patterns, spread, falloff, hit zones, penetration through thin materials, staged reloads, melee, health regen, spawn protection, fast respawn with 2.5 s death recap.
- **Equipment**: frag (cook), adhesive charge, breach mine with laser, flash pulse (angle + LOS), obscurant cloud (blocks sight for players and bots), signal dart.
- **Momentum**: kills/assists/device kills build Momentum (resets on death); tiers 3/5/8 unlock Recon Sweep, Ammo Pod, Hunter Drone, Mortar Mark, Interdiction Flight, Team Uplink (one Tier 8 per team, outdoor/sky validation, telegraphs, destructible devices). Support kills add score, not Momentum.
- **Bots**: vision cones with occlusion, heard footsteps/shots, damage direction, last-known positions, reaction delay, nav-graph routing, hold angles, retreat/reload, equipment and support use. Easy/Normal/Hard change skill parameters only.
- **Spawn director** with an audit reason string, **loadout validation**, 5 loadout slots, XP/levels 1-30 with sidegrade unlock table, local guest profile, export/reset.
- **HUD**: crosshair with live spread, hit markers (normal/head/kill), damage direction, kill feed, score popups and medals, minimap that never leaks hidden state, momentum meter, scoreboard, death recap, directional sound cues.
- **Audio**: synthesized weapons, footsteps, impacts, explosions, HRTF panning, occlusion low-pass, interior/exterior reverb, bus compression, 48-voice limit, adaptive music.

## Project layout

```
src/shared/   content-data, map, simulation (world, weapons, equipment, support, spawn), bots, protocol types
src/client/   renderer (Babylon), runtime (input, game loop, settings, profile), audio, ui (React shell + DOM HUD)
tests/        Vitest suites (map, sim, rules, bots, client)
tools/        mapdump, botstats, Playwright driver used for screenshots
```

The simulation (`src/shared`) imports no rendering/UI code and runs headless in the tests. See `ONESHOT-REPORT.md` for coverage, deviations (notably: no online multiplayer in this slice) and verification results, and `ASSETS.md` for asset licensing.
