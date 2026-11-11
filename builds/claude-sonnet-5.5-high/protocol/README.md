# Last Protocol

An original browser tactical 5v5 shooter. **Cipher Breach** on **Aperture Annex**: Intrusion carries a Cipher Spike and must arm it at vault A or B; Custodians stop them. One life per round, a real buy economy, utility, recoil you can learn, and bots that obey fog of war.

This repository is a **playable vertical slice** (single player against bots, no backend). The authoritative simulation runs locally in a room object behind a serialised protocol, so the architecture matches the brief's server/client split even though there is no network hop.

## Run

```bash
npm ci
npm run dev      # http://localhost:5530
npm run build    # static site in dist/ (relative URLs, works from any sub-path)
npm test         # headless simulation, rules, netcode and bot tests
npm run scan     # automated map analysis report
```

Requires Node 22.12+. Target: desktop Chrome or Edge with WebGL 2, keyboard and mouse (1280x720 or 1920x1080). A missing capability shows a clear error screen.

## Controls

| Key | Action |
| --- | --- |
| W A S D | move |
| Mouse | aim (Pointer Lock, raw input) |
| LMB / RMB | fire / scope (scoped weapons) or lob (grenades) |
| Shift (hold) | silent walk, 52% speed |
| Ctrl or C | crouch, 40% speed (hold or toggle in settings) |
| Space | jump (no bunny-hop gain) |
| R / G / Q / F | reload / drop weapon / quick switch / inspect |
| 1 / 2 / 3 | primary / sidearm / tool |
| 4 to 7 | utility slots |
| Wheel | cycle items |
| E (hold) | arm the Spike inside a vault, disarm it, pick up a dropped weapon |
| B | buy menu (buy phase only): number = category, then number = item; click an owned unused item to refund |
| Tab (hold) | scoreboard with team economy |
| M | tactical map |
| Esc | pause menu and settings |

When dead, click or use the arrow keys to spectate living teammates. You only see what your team sees.

## What is in the slice

- **Full round loop**: 20 s buy, 105 s action clock, arm (3.2 s), 35 s fuse with an accelerating beep, disarm 8 s or 5 s with a kit (release resets), detonation, eliminations, time expiry, round-end banner and highlight.
- **Match flow**: first to 9 / swap after 8 / win by 2 / max 20 (Full), or first to 5 (Quick), halftime side swap with economy reset, overtime swaps, match result with round timeline, economy chart and per-player stats.
- **Economy**: $800 start, $12,000 cap, win $3,000, loss ladder $1,900 to $3,100 (steps back a tier after a win), arm bonus $300 + $600 team, defuse $300, kill rewards by weapon class, survivors keep gear, refunds during buy, idempotent purchases.
- **12 weapons plus tool**, all data-driven: auto, semi, burst, bolt, pump; deterministic recoil paths with seeded deviation; movement, air, crouch and sustained-fire spread; armour, helmet, hit zones, falloff; wall penetration by material; scoped weapons with zoom levels and a narrow-angle glint.
- **5 utility types**: Veil Canister (opaque volume, same on every quality setting), Arc Flash (angle/LOS based), Thermite Vial (burns authored cells only), Pulse Shard (two coarse directional pings, shootable), Fragment Charge (occlusion and falloff). Swept-sphere grenade physics with material bounce.
- **Aperture Annex**: original two-vault map authored on a grid, with gantry, planters, glass corridor, crawl duct, penetrable service wall, split-level mid, and a collision hash.
- **Bots**: server-side planner (default, execute, post-plant, save, rotate, retake), roles, hearing with uncertainty, LOS and view-cone vision, smoke and flash occlusion, reaction time, recoil compensation, utility throws solved with the real grenade physics, 3 skill levels.
- **Netcode path**: sequenced inputs, schema validation, message quotas, interest-filtered snapshots (no hidden enemy transforms), client-side prediction and reconciliation using the shared movement code, snapshot interpolation, lag-compensated hitscan (capped at 200 ms), simulated latency/jitter/loss link for tests.
- **UI**: title, play setup, Practice, Learn, Settings (sensitivity, FOV, volume, quality, colourblind palettes, reduced flash and motion, captions, crosshair editor), pause, buy menu, HUD, radar, tactical map, scoreboard, spectating, end screen.
- **Audio**: all synthesised at runtime with spatial panning, distance, occlusion low-pass, voice limits.

## Practice mode

Unlimited money, buy anywhere at any time, a grenade trajectory preview while holding a grenade, bots on both sides, endless rounds.

## Developer URL flags

`?dev=1&start=1&autoplay=1&seed=7&side=int` starts a match immediately with the player seat driven by the bot brain (used for the automated screenshot and smoke tests). `window.__lp.state()` returns frame, draw-call and tick timings.

## Layout

```
src/content   weapon, economy and ruleset data
src/protocol  versioned wire schemas and validation
src/sim       authoritative simulation: map, collision, nav, movement, combat, grenades, match, bots, scanner
src/server    room (validation, quotas, interest filtering, lag-comp history) and the simulated link
src/client    netcode (prediction, reconciliation, interpolation), input, settings, game shell
src/render    three.js world, characters, viewmodel, VFX
src/ui        HUD, menus, buy menu, overlays
src/audio     procedural Web Audio
tests         vitest suites
tools         map scanner, headless browser harness, bot sims
```

See `ONESHOT-REPORT.md` for coverage against the brief, verification evidence and known limitations.
