# Breachline — Relay Station K-17 (vertical slice)

Breachline is an original fast-respawn arcade military FPS that runs in the browser. This slice is a
complete **Team Clash Practice** loop. You fight 6v6 with server-style bots on one original map,
**Relay Station K-17**, an island communications facility. The loop runs: menu → loadout → warmup →
fight → earn Momentum support actions → die and get a recap → respawn → match end → results with XP
and unlocks → play again.

The match runs on an **authoritative 60 Hz room simulation** (`src/server`). It never imports
rendering or UI code. In Practice it runs embedded in the page behind an in-process transport, so no
backend is needed.

## Run it

Requires Node.js 22.12+ and npm.

```bash
npm ci            # install exact locked dependencies
npm run dev       # dev server on http://localhost:5420
npm run build     # type-check + static build to dist/ (relative URLs, works from any sub-path)
npm run preview   # serve dist/ on http://localhost:5421
npm test          # headless Vitest suite (simulation, rules, bots, spawns, loadouts, progression)
```

Optional dev tools:

- `node scripts/screenshot.mjs [outDir]` serves `dist/` under `/play/claude-opus-5.5-high/breachline/` and captures
  gameplay screenshots with the system Edge/Chrome (via `playwright-core`).
- `ui-check.mjs`, `results-check.mjs`, `tour.mjs` and `feature-check.mjs` drive a running dev server through
  `BASE_URL`.
- URL flags: `?autostart=1` jumps straight into a match. `?demo=1` hands the local player to the bot AI
  (an attract mode, also used for screenshots). `&warmup=N` and `&score=N` shorten a match.

Target: desktop Chrome/Edge (Firefox should work) with WebGL 2, keyboard and mouse. If WebGL 2 is missing,
the game shows an explanatory error screen instead of a broken page.

## Controls (all remappable in Settings → Key bindings)

| Action | Default |
|---|---|
| Move / look | WASD / mouse (Pointer Lock, raw input when available, no added acceleration) |
| Fire / aim down sights | Left mouse / right mouse (hold or toggle) |
| Sprint / crouch / jump-mantle | Shift / Ctrl or C (toggle or hold) / Space |
| Reload / melee / fire mode / inspect | R / F / V / B |
| Lethal (hold to cook) / tactical | G / Q |
| Primary / sidearm | 1 / 2 / mouse wheel |
| Cycle / deploy support action | 3 / 4 |
| Ping / scoreboard | X / Tab (hold) |
| Change loadout while dead | M, then 1–5 |
| Pause (Practice pauses the sim) | Esc |

## What is in the slice

- **Team Clash rules**: 6v6 (or 3v3/1v1) with bots. One point per elimination; the first team to 75
  (or 25/50) wins, otherwise the leader at 8:00 (or 5/10). A tie goes to 60 s of sudden death, first to +5.
  There is an 8 s warmup, a 3 s respawn, and 2 s spawn protection that ends early when you fire or move
  5 m. Friendly fire is off. Health regenerates after 5 s at 22 HP/s.
- **Movement**: walk 5.2, crouch 2.8, sprint 7.1 m/s (120 ms sprint delay), ADS slowdown by weapon,
  32/38 m/s² acceleration/deceleration, 20% air control, a 0.85 m jump apex, 0.6–1.35 m mantles, step-up
  stairs, and crouch-only gaps. There is no bunny-hop speed gain.
- **Weapons**: nine original weapons: AR-4 Jackal, M7 Kestrel, BR-12 Mesa, SG-8 Breacher, LMG-60 Anchor,
  MR-1 Warden, P9 Relay, H3 Rook and Cinder Auto. Each has hitscan with seeded spread, deterministic recoil
  climb plus seeded variance, damage falloff, four hit zones, and thin-material penetration with breakable
  glass. Reloads run through tactical and empty stages (mag-out / mag-in / chamber), and an interrupted
  reload keeps the new magazine if it was already inserted. There are auto, burst and semi fire modes,
  quick melee with a capped lunge, and a scope with glint on the Warden.
- **Loadouts**: five editable slots. Each holds a primary with up to three of eleven attachments (all
  with visible tradeoffs and exact stats), a sidearm, one perk from each of three groups (nine perks), one
  lethal and one tactical item, and three support actions. Loadouts are validated against level, unlocks
  and the ruleset version.
- **Equipment**: frag charge (cookable), adhesive charge, breach mine (laser trip line), flash pulse (line
  of sight plus view angle), obscurant canister (opaque, blocks bot sight) and signal dart (reveal pulses).
  Equipment recharges over time.
- **Momentum support actions** at 3/5/8: Recon Sweep, Ammo Pod, Hunter Drone (marks only, can be shot
  down), Mortar Mark (needs an outdoor target, with a red marker and whistle), Interdiction Flight (siren,
  then a strafing band that misses anyone under a roof) and Team Uplink. Only one Tier-8 action can be
  active per team. Momentum resets on death, and support kills do not add Momentum.
- **Bots**: vision cones with occlusion, obscurant and flash checks. They hear gunfire and sprinting,
  react to damage direction and use team radar. They have reaction delays and aim noise, fire in bursts,
  strafe and crouch, and prefer each weapon's range. They switch weapons, reload, retreat, throw grenades
  with safety checks, flash targets, and use all support actions. They follow a baked navmesh with A*,
  choose lanes and flanks, and avoid death heat. Difficulty changes skill only, never health or damage.
- **Spawn director** scores each candidate by enemy distance, line of sight, recent deaths, teammates and
  danger, and keeps an audit reason. It always picks a safe candidate when one exists (tested over 10,000
  respawns).
- **HUD**: crosshair sized by real spread, hit markers (normal, head, kill, protected, device), damage
  direction arcs, low-health desaturation, rotating minimap that shows only legitimately revealed enemies,
  score and timer, kill feed, Momentum meter, support cards, score popups and medals, announcer subtitles,
  pings, a 2.5 s death recap (killer, weapon, distance, hit timeline, final hit direction), and a Tab
  scoreboard.
- **Progression**: XP for participation, kills, assists, headshots, support destroyed, winning and
  finishing a match. Levels run 1–30 and unlock sidegrade weapons, attachments, perks, equipment, support
  actions and reticles. There are five onboarding challenges. Results are applied idempotently by match
  id. The profile can be exported or reset, and it persists in `localStorage`.
- **Settings**: quality preset, shadows, render scale, horizontal FOV 75–110 (converted to vertical
  correctly), viewmodel FOV, sensitivity with ADS and scoped multipliers, invert Y, hold/toggle modes,
  full key remapping, master/effects/music volume, hit-marker audio, subtitles, colorblind IFF, reduced
  motion, photosensitivity mode, and shake, bob and crosshair options.
- **Audio**: everything is synthesized with Web Audio. It uses HRTF panning, distance and occlusion
  low-pass, an interior reverb send, bus compression and a 48-voice limit. Each weapon class has its own
  report and distant tail, and there are suppressed shots, reload stages, material footsteps, equipment
  and support telegraphs, flash tinnitus, and procedural music that drops in combat and rises near the
  score limit.

See `ONESHOT-REPORT.md` for exact coverage, verification results and known gaps.
