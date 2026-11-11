# Breachline

An original offline arcade FPS vertical slice at Relay Station K-17. Join five Aegis bots against six Helix bots, earn eliminations and Recon Sweep, and play through a match to results and requeue. No accounts, backend, external assets, or network services are needed.

## Run

Requires Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
npm test
npm run build
```

The dev server uses port 5220. The static production site is `dist/`; its asset URLs are relative. To inspect production under a nested URL, run `node serve.mjs` and open `http://127.0.0.1:5220/play/breachline/`.

## Controls

- WASD: move; mouse: look; left mouse: fire; right mouse: aim.
- Shift: sprint; C: toggle crouch; Space: jump.
- R: reload; 1/2: primary/sidearm; F: short-range melee.
- G: fragmentation blast (two per life); 3 or 4: deploy earned Recon Sweep.
- Q: local signal notification; Tab (hold): roster; Escape: release mouse / pause.

Select one of three primary weapons before deploying. Quick Clash is first to 30 or three minutes; Full Clash is first to 75 or eight minutes. Ties extend by 60 seconds with a five-point sudden-death target. All ammunition reserves are unlimited; magazines and reload time still matter. Health regenerates after five damage-free seconds. Three Momentum unlocks a once-per-life Recon Sweep; death resets Momentum. Friendly fire is disabled. XP, matches and wins persist locally; XP has no combat effect.

## Slice boundaries

Babylon.js rendering, strict TypeScript fixed-step simulation, React shell, Web Audio synthesis and original procedural geometry. The local embedded room is authoritative relative to the renderer, but is client-owned and has no online cheat resistance. Network play, Rapier physics, nine-weapon catalogue, attachments, mantle, persistent sidegrade unlocks and the full equipment/support suite are absent. See ONESHOT-REPORT.md for detailed coverage.

## Checks

`npm test` runs simulation rules and an entire seeded bot match. `node capture.mjs` needs Playwright Chromium (`npx playwright install chromium`) and the production server on port 5220; it records real 1280x720 browser screenshots and JavaScript errors in `oneshot/`.
