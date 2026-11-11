# Last Protocol

An original browser 5v5 tactical shooter. This is a vertical slice of **Cipher Breach** on **Aperture Annex**. Two security teams fight with no respawns inside each round. **Intrusion** carries the Cipher Spike and tries to arm it in one of two network vaults. **Custodians** defend, retake, and disarm it. Money carries over between rounds. Both teams buy weapons, armor and utility in a 20-second buy phase and play a 105-second round. An armed Spike runs a 35-second timer. Sides swap at halftime.

In this build you play with four bots against five bots. All of them run in an in-browser authoritative room that ticks at 64 Hz. The game needs no server. Static file hosting is enough.

## Run it

Requires Node.js 22.12+ and npm.

```bash
npm ci          # install exact locked dependencies
npm run dev     # dev server on http://localhost:5430
npm run build   # static site in dist/ (relative URLs, works from any sub-path)
npm test        # 52 headless Vitest tests: simulation, rules, map analysis, full bot matches
```

Optional tools, which use a locally installed Chrome or Edge through `playwright-core`:

```bash
node tools/serve.mjs                # serve dist/ at http://localhost:5432/play/claude-opus-5.5-high/protocol/
node tools/screenshot.mjs           # production-build browser check + screenshots into oneshot/
node tools/play-check.mjs           # drives real keyboard/mouse input against the build
```

Target: desktop Chrome or Edge with WebGL 2, keyboard and mouse, 1280×720 or larger. If WebGL 2 is missing, an error screen appears. If the GPU context is lost, a recovery screen appears.

## Controls

| Action | Key |
|---|---|
| Move / silent walk / crouch / jump | `WASD` / `Shift` / `Ctrl` / `Space` |
| Fire / alternate (scope, burst↔semi, grenade lob) | `LMB` / `RMB` |
| Reload / interact (arm, disarm, pick up) / inspect | `R` / `E` / `F` |
| Primary / sidearm / tool (press again: Cipher) | `1` / `2` / `3` |
| Utility slots / previous weapon / mouse-wheel cycle | `4`–`7` / `Q` / wheel |
| Drop current weapon or the Cipher | `G` |
| Buy menu (number keys: category, then item) | `B` |
| Scoreboard / tactical map / radio | hold `Tab` / hold `M` / `Z` then `1`–`8` |
| Menu / release mouse | `Esc` |

You can rebind every key in Settings → Controls. Crouch and walk can be set to toggle.

## What is in the slice

- **Full match loop.** Choose your starting side, then play either a Quick match (first to 5) or a Full match (first to 9, swap after 8, win by 2, at most 20 rounds, with overtime). Each round runs buy → live → armed → round end. Every round ends with a stated reason: eliminated, time expired, Cipher detonated, or Cipher disarmed. The match ends on a results screen with the round timeline, an economy chart, a turning point, and per-player stats. Results are saved to local Match History.
- **Economy.** Start money, the win reward, a loss-bonus ladder (each win drops it one tier), arm rewards (personal and team), defuse reward, kill rewards by weapon class, and a $12,000 cap. A survivor who timed out without arming gets a reduced bonus. Refunds work during the buy phase. The game enforces per-item and total utility caps. Survivors keep their gear and money resets at halftime.
- **12 original weapons** plus the Breach Tool. Each has data-driven damage, armor penetration, head multiplier, falloff, penetration power, a fixed learnable recoil path with seeded deviation, and inaccuracy that depends on movement, air time and landing. Weapon types include auto, semi, 3-round burst, pump, bolt-action with a two-stage scope, and a scoped DMR. Reloads are authoritative and staged, and shotguns reload one shell at a time.
- **5 utility types.** Veil smoke (17 s, the same opaque boundary on every preset), Arc Flash (blinds based on angle, distance and occlusion), Thermite (burns authored floor cells and draws a crisp border), Pulse Shard (two pings that reveal enemy direction in wedges, and you can shoot it), and Fragment Charge (falloff, blocked by cover). Grenade physics is deterministic, and Practice shows a trajectory preview from the same function the server uses.
- **Aperture Annex.** Freight Yard spawn and Security Atrium spawn. Vault A is the Turbine Hall, with a gantry and a penetrable service wall. Vault B is Hydroponics, with planters, grow racks, a long glass corridor and a maintenance crawl. The Calibration chamber in the middle is split-level. The map has 26 callouts, which appear on the HUD, the tactical map and wall signs.
- **Bots.** They perceive only through line of sight, field of view and smoke, plus hearing with uncertainty. They follow a team plan: rush, execute with validated smoke and flash lineups, split, or default. They take roles (lurk, anchor), rotate on intel, plant, hold post-plant positions, regroup and retake, disarm, and save. They make economy decisions and send short radio callouts.
- **Practice range.** Unlimited money and ammo, the ability to buy anywhere, armored dummy targets that respawn, a damage log, and grenade trajectory preview.
- **Settings.** Sensitivity (exportable), scoped multiplier, FOV 80–105, a crosshair editor, quality presets, audio volumes, captions for critical events, reduced flash, reduced motion, colorblind team-color presets, a left-handed viewmodel, bot difficulty, and key rebinding.

See `ONESHOT-REPORT.md` for exactly what was built, what was verified, and what was not.
