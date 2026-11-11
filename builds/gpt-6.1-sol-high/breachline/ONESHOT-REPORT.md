# ONESHOT REPORT

## Summary

Breachline is a playable offline 6v6 FPS slice with original procedural industrial scenery, weapons, characters and synthesized audio. Players choose a weapon, deploy alongside five bots, fight six opposing bots, respawn, earn a Recon Sweep, complete a scored/timed match, receive XP and deploy again. It prioritizes the account-free Practice loop over the brief's production multiplayer and extensive content catalogue.

## Brief coverage

| Major system / acceptance criterion | Status | Evidence / limitation |
|---|---|---|
| Launch, Practice, loadout, spawn, match, results, play again | Done | Implemented complete local flow; headless rules test completes a match. |
| Online 12-client authoritative room, idempotent results/requeue | Not started | No backend or fake online option. |
| Local 6v6 bot Team Clash | Done | Twelve actors, 30/3-minute quick or 75/8-minute full match. |
| Deterministic winner, time limit and sudden death | Done | Pure simulation with explicit tie extension. |
| Walk, sprint, crouch, jump, ADS slowdown, collision | Partial | Present; no mantle, capsule/step/slopes, Rapier, or reconciliation. |
| Nine weapons, stage reload, recoil, falloff, hit zones | Partial | Three primary profiles plus sidearm; shared viewmodel, basic reload, head/body damage and falloff. |
| Lethal/tactical equipment and all support actions | Partial | Immediate fragmentation blast and timed recon only; no thrown projectile/fuse or tactical suite. |
| All three Momentum tiers; support kills exclude Momentum | Partial | Three-kill recon; no tier 5/8 actions; support-kill exclusion tested. |
| Health, feedback, friendly fire and protection | Partial | Regen, hit marker, kill feed, damage vignette, protection, friendly-fire rules; no received-hit timeline. |
| Death recap truth and privacy | Partial | Killer name and respawn countdown; no replay or detailed damage history. |
| Safe spawn director and 10,000-case acceptance | Partial | Distance/visibility scoring; legal-spawn unit test only, not 10,000-respawn guarantee. |
| Bots perception/routes/reload and legal delays | Partial | Occlusion checks, BFS navigation, strafing, acquisition delays, magazines; no cone, hearing, tactical equipment or teamwork tree. |
| Five loadouts, attachments, perks, validation | Partial | Three fixed primary choices, sidearm; no attachment/perk editor or ownership validator. |
| Profile persistence and sidegrades without power | Partial | XP, matches, wins stored locally; no unlock catalogue, levels merely derived XP display. |
| 150ms/loss/jitter networking acceptance | Not started | No network transport. |
| 60 FPS hardware benchmark / server p95 budget | Not started | No representative hardware measurement or server. |
| Pointer lock / hidden tab / context error recovery | Partial | Lock loss/blur pauses and clears held inputs; context loss offers reload; socket states inapplicable. |
| Minimap, HUD, scoreboard, results, settings | Partial | Core HUD plus sensitivity/audio; no full remapping, graphics, colorblind or reduced-motion settings. |
| Relay Station K-17 lanes and original industrial/oceanic art | Partial | Compact original deck, two wings, dish, cover and outer routes; smaller and simpler than production map. |
| First/third-person animation and assets | Partial | Procedural weapon/hands/soldiers, ADS/reload/sway; no rigged animation catalogue or LODs. |
| Audio and accessibility | Partial | Original oscillator reports, feedback and UI muting; no spatial footsteps, announcer, music or reverb. |
| No copied/proprietary assets or branding | Done | All visual/audio content authored in this workspace; sources listed in ASSETS.md. |
| Static sub-path deployment and no external dependency at play time | Done | Relative Vite assets; production served at /play/breachline/ in Chromium. |
| Production artifacts: net lab, replay inspector, video, migrations | Not started | Source/map/balance/profile notes delivered in ARCHITECTURE.md; absent artifacts are not represented as complete. |

## Architecture

Strict TypeScript and Vite build a fully static client. Babylon.js renders the world; React manages shell and HUD; Web Audio generates short original feedback sounds. No rendering package is imported by the shared simulation.

`src/simulation.ts` contains data-driven weapons, shared collision boxes, 60 Hz combat/movement, seeded bots, spawn scoring and match rules. `src/runtime.ts` handles input, pointer lock, camera, procedural meshes, grouped static geometry, shadows, animation and sound; it submits input to the embedded room. `src/main.tsx` owns menu, settings, results and a small local profile. `ARCHITECTURE.md` documents map/nav source, balance tables, profile shape, protocol boundary and security/accessibility limitations.

## Verification

- Node `v22.12.0`; npm package-lock included as a delivered file (no Git commit or remotes used).
- `npm install` completed. Initial audit identified vulnerable test-tool transitive dependencies; `npm install -D vitest@latest` upgraded to Vitest 5.1.0 and reported zero vulnerabilities.
- `npm test`: 18 passed, 0 failed, including full seeded bot-match completion, cadence/ammo, hit damage, collision/occlusion, friendly fire, spawn protection, score, death/respawn, regen, reload, recon, support kill Momentum and sudden death.
- `npm run build`: TypeScript checking and Vite production build succeeded. Main Babylon-containing JS bundle is approximately 6.27 MB / 1.40 MB gzip; Vite emits a large-chunk advisory.
- `npx playwright install chromium`: completed successfully.
- `node serve.mjs` served the production build at `http://127.0.0.1:5220/play/breachline/`.
- `node capture.mjs` exercised launch, deploy, movement, firing, roster key and Escape using real headless Chromium WebGL2. Captured 1280x720 gameplay, menu, roster and pause artifacts. Browser log contains no JavaScript errors; full results/requeue is covered by implementation and simulation termination, not a completed browser-driven match.
- Explicit deletion of node_modules and dist was attempted twice after resolving absolute in-workspace paths, but automatic command review rejected recursive cleanup with "blocked by policy". `npm ci`, `npm test` and `npm run build` were run instead; the explicit dist deletion requirement could not be verified.
- `node full-loop.mjs`: deployed and observed real bot scoring (14 to 10 after about 60 simulation seconds), but timed out after 300 wall-clock seconds in software rendering before results. Browser-driven full-match/requeue completion remains unverified.
- Final install recovery: standard `npm ci` completed successfully after 16 minutes with zero vulnerabilities. A retry using `npm ci --offline --no-audit --no-fund` failed with Windows ENOTEMPTY in node_modules/.vitest-cache, leaving dependencies incomplete; its subsequent test/build commands could not find their executables. `npm install --offline --no-audit --no-fund` then repaired dependencies successfully in 13 minutes, followed by a final 18/18 passing test run and production rebuild.
- Desktop hardware performance, audio perceptual quality, Firefox/Edge/Safari, networking, long-session memory, exploit resistance and production acceptance load tests were not verified.

## Assumptions and deviations

This is a scoped vertical slice rather than the full production MVP. Practice is the sole mode, defaults to a faster 30-point/three-minute session, and offers the brief's 75/eight-minute rules in the selector. There is no warmup queue because the embedded room is immediately available. Full-auto behavior is shared across selected weapon profiles, including Mesa and the sidearm; models are shared.

Collision uses custom deterministic horizontal bounds and boxes, not Rapier. Bots use forgiving probabilistic fire with lower damage than the player. Structural cover blocks all shots even when the player's camera jumps above it; waist-high cover cannot be vaulted or shot over. Fragmentation is an immediate forward area blast rather than thrown equipment. Only Recon Sweep is available; it reveals enemies on the minimap for 12 seconds. Reserves are unlimited. XP never affects health or damage. Local data is intentionally editable, with no online trust claims.

No installed skills outside this directory were read because the task explicitly forbids accessing files outside the workspace. No delegates, external services, copied assets, git remotes or deployments were used.

## Known issues and limitations

1. Offline only; no network transport, server authority against client tampering, lag compensation, matchmaking or shared progression.
2. Simplified collision and combat: no mantle, vertical cover shooting, stage reload, projectile grenade, full loadout catalogue or support tiers 5/8. Bots can occasionally crowd routes or reposition poorly.
3. Procedural block-style art, visible shadow-map artifacts and shared gun model are intentionally limited; performance budgets and cross-browser support remain unverified. Software WebGL capture is slower than typical hardware and is not a valid FPS benchmark.

Other limits: melee has only a short distance gate; reserve ammo is infinite; no full remapping or motion-accessibility controls; HUD updates at 10 Hz; local profile has no schema migration/export UI. Re-entering the menu resets current match. The delivery omits gameplay video, replay tools and online server artifacts.

## Self-assessment

- Playability: **7/10**. A complete fast local team-match loop with responsive inputs and bots, tempered by simplified cover, equipment and AI.
- Visual polish: **6/10**. Cohesive editorial menus, readable HUD and original industrial scene, but primitive models and limited animation/lighting detail.
- Brief fidelity: **5/10**. The requested core Practice cadence and rendering/client direction are represented; most production networking and content breadth is absent.
