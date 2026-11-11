# Ashfall Covenant

A compact, original isometric action RPG set on the ash-covered frontier of Varrow. Create a Cinder Vow battlemage or Veil Ranger, cross the Soot March, defeat the Toll-Keeper, rescue the Artificer, and silence the Orison Engine. Return to the refuge to forge equipment or launch a Veteran boss hunt.

## Run

Requires Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
npm test
npm run build
```

Development uses port 5210. Deploy the contents of `dist/` to any static host, including a nested path. No accounts, API keys, backend, external fonts, or runtime network APIs are required. `node serve.mjs` serves the production build at `http://127.0.0.1:5210/arcade/ashfall/` for subpath verification. Stop it with Ctrl+C.

## Controls

| Input | Action |
| --- | --- |
| Left click ground | Move |
| Left click enemy model | Follow and repeatedly basic attack; restore Focus |
| Right click | Core area skill at cursor / around self |
| Q, W, E | Rush or focused shot; delayed area skill; sustain skill |
| Space | Evade toward cursor, three rechargeable charges |
| 1 | Health potion, five per expedition |
| F | Collect nearby equipment, activate shrine, rescue Artificer, use gate |
| T | Three-second return channel; damage interrupts |
| I / K / C / J | Inventory / passive skills / character / quests |
| M or Tab | Route chart |
| Escape | Close panel or pause |
| Mouse wheel | Zoom |

Walk north to reach subsequent areas. In the March, the cyan western shrine restores health; the northern gate opens after the Toll-Keeper dies. In the Archive, rescue the Artificer at the eastern cage with F and clear all enemies before using the northern exit. In the final chamber, step out of orange attack circles during their anticipation and strike during recovery. Health and potions replenish at the refuge. Press F near purple loot beams, then I to compare and equip.

## In the slice

- Babylon.js WebGL 2 procedural 3D world and React overlays; fixed 30 Hz simulation.
- Two classes, four class-specific active skills apiece, three passive investment paths, leveling up to 20.
- Four zones, seeded pack placement, three ordinary enemy roles, guardian variant, two bosses with health-dependent danger radius/cadence.
- Seeded equipment power/armor rolls, two rarities, swapping, salvage, forge after rescue.
- Local IndexedDB checkpoints with schema version, checksum, and previous-save backup; automatic saving every 20 seconds and explicit save in pause menu.
- Defeat, gold Echo retrieval, potions, Focus, evades, victory summary and repeatable Veteran hunt.
- Original synthesized effects audio, mute, zoom, minimap, quest tracking.

The production-scale brief is intentionally narrowed. See `ONESHOT-REPORT.md` for omissions. Save loads restore the character and objectives at the zone entrance; living encounters reset, and ground loot and Echo positions do not persist. Leaving a zone also resets its encounters. Save manually before closing if the last 20 seconds matter.

## Verification tools

`verify.mjs` captures actual production WebGL output and checks creation, a cast, passive allocation, and IndexedDB continuation. Run with the production server already active, and Playwright Chromium installed (`npx playwright install chromium`). `?verify` exposes a test bridge for ordinary game commands and projection; it does not alter combat stats. This bridge is absent on the normal URL.

`campaign.mjs` records an accelerated ordinary-intent run through the act and a Veteran rematch. The captured `oneshot/campaign.webm` is an automated demonstration, not a normal-speed manual playthrough. `oneshot/browser-results.json` and `oneshot/campaign-results.json` contain production browser results.

See `ASSETS.md` for provenance and `ARCHITECTURE.md` for design, data, persistence and extension notes.
