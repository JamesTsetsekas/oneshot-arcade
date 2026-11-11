# Skybreak

An original browser battle royale vertical slice. You start on a staging pier, ride a transit skiff
over **The Highwake** (a 1.2 km island caught in an atmospheric fracture), jump, freefall, glide in on
a wing-sail, scavenge weapons and supplies, and stay inside the shrinking **Calmfield** while the
violet **Riftstorm** closes in. 24 seats: you plus 23 server bots. Last one standing wins. There is
no building; you move with sprint, slide, mantle, ziplines, ascenders, air vents, swimming and a
grapple.

Everything runs locally in the browser. The authoritative 30 Hz match simulation (the "server") runs
in-process behind a message-shaped transport. There are no accounts, no network calls and no
telemetry.

## Run

Requires Node.js 22.12+ and npm, plus a desktop browser with WebGL 2 (Chrome/Edge recommended).

```bash
npm ci          # install exact dependencies
npm run dev     # dev server on http://localhost:5450
npm run build   # static site in dist/ (relative URLs, works from any sub-path)
npm test        # headless rules/simulation tests (Vitest)
```

Extra tools:

```bash
npm run soak    # headless 24-bot match soak with per-30s state dump and final standings
npm run shot    # serve dist/ under /play/claude-opus-5.5-high/skybreak/ on :5452 and screenshot with headless Edge/Chrome
```

`?autoplay=solo&seed=N` starts a short match where the bot AI drives your seat (attract mode, used
for automated screenshots). `?autoplay=practice` opens the Practice Range.

## Controls (remappable in Settings → Controls)

| Action | Default |
| --- | --- |
| Move / aim | WASD / mouse |
| Fire / aim down sights | LMB / RMB (hold or toggle) |
| Sprint / crouch (slide while sprinting) / walk | Shift / Ctrl / CapsLock |
| Jump, mantle, ride zipline, use ascender | Space |
| Interact, pick up (hold to swap when full), open chests | E |
| Reload / quick melee | R / F |
| Slots | 1–5, mouse wheel |
| Throw equipped throwable / use utility | G (or LMB with it selected) |
| Swap shoulder | X |
| Deploy / stow wing-sail | Z |
| Free-look (skiff, freefall, glide) | Alt |
| Inventory / full map | Tab / M |
| Place marker | Middle mouse (or click on the full map) |
| Ready up on the staging pier | Enter |
| Pause / menu | Esc |

## What's in the slice

- **Full match loop**: menu → local queue/loading with real progress steps → 35 s staging pier
  (movement and equipment practice, no damage) → seeded skiff path → jump, freefall, auto or
  manual wing-sail → loot → fight → heal → rotate through 10 Calmfield phases (brief timings,
  moving 30 m endgame, final collapse) → winner → spectate after death → results → requeue.
- **Combat**: 100 Health + 50 rechargeable Aegis (8 s delay, 10/s) + up to 50 Reserve Shield.
  Head/torso/limb hitboxes, deterministic recoil patterns and seeded bloom, falloff, shotgun
  pellet damage caps, a charged projectile rail with scope glint, a wind-orb launcher with
  knockback, kill attribution over a 12 s window, assists, and death caches that keep exact items.
- **Nine original weapons x five rarities** (Field ● / Tuned ⌃ / Advanced ◆ / Masterwork ♛ /
  Prototype ★). Masterwork attachments and capped Prototype identity modifiers are data-driven.
- **Eight items**: Med Injector, Trauma Kit, Shield Flask, Aegis Cell, Mist Capsule, Grapple Spool,
  Echo Beacon, Wind Orb. Five universal slots, four capped ammo types, stacking, hold-to-swap,
  drop and split-drop ammo.
- **Loot**: floor sockets (every building cluster gets a weapon), resonance chests that hum,
  supply lockers, death caches, supply capsules from zone 3 onward, and a shielded caravan drone
  that pings its approximate position.
- **The Highwake**: six named locations (Aerie Market, Sunken Array, Kilnworks with heat-channel
  hazards, Orchard Steps, Wind Abbey, Breaker Docks), eight landmarks, ziplines, ascenders, air
  vents, flooded areas, about 1,500 trees and 420 boulders for cover.
- **Bots**: drop selection from the skiff path, loot planner, A* navigation on a 1 m grid,
  perception limited to sight, line of sight, mist, hearing and damage direction, reaction delay and
  aim noise by skill, strafing, burst control, heal/retreat, utility use, storm rotation and
  final-field behaviour.
- **Practice Range**: all weapons and items on respawning racks, strafing target dummies,
  mantle blocks, ascender tower, zipline, air vent, swim pool, and live damage/DPS readout with
  advanced weapon stats.
- **HUD**: vitals, slots and ammo, minimap with field state, compass with marker, kill feed,
  alive/elimination counters, rarity loot cards with stat arrows against the equipped weapon,
  hit markers (shield/health/head/break), damage numbers, damage-direction arcs, visual sound
  indicators and captions, full map, inventory, spectator panel and results with route map,
  timeline and loot history.
- **Settings**: quality presets, render scale, dynamic resolution, shadows, view distance,
  foliage, effects, FXAA, FOV 80–105°, sensitivity and scoped sensitivity, invert Y, hold/toggle
  options, full key remapping, volume, captions, visual sound indicators, colour-blind palette,
  reduced motion, photosensitivity mode.
- **Career**: local guest profile with mastery XP, match history, four outfits and four
  wing-sail skins (cosmetic only; two unlock with mastery).

See `ONESHOT-REPORT.md` for exact coverage, verification and known issues.
