# Last Protocol

A self-contained, first-person tactical shooter at Aperture Annex. Lead a five-operative team against five bots, breach either research vault, arm a Cipher Spike, and survive the retake. Rounds have persistent money, equipment purchases, no respawns, and a side swap; first to four wins.

## Run

Node 22.12+ and npm are required.

```sh
npm ci
npm run dev
npm test
npm run build
```

Development uses http://127.0.0.1:5230. Deploy the contents of `dist` to any static hosting path; assets use relative URLs. No backend, accounts, external assets, or network services are needed. Desktop WebGL 2 and keyboard/mouse required. Tests use Node's built-in test runner and experimental TypeScript stripping on Node 22.12.

## Controls

| Input | Action |
| --- | --- |
| WASD / mouse | Move / aim |
| Left mouse / R | Fire / reload |
| Shift / Ctrl | Slow walk / crouch view and speed |
| E held | Arm (3.2 sec), disarm (8 sec, 5 with tool) |
| 4 | Throw a Veil sight-denial canister |
| B | Requisitions during buy phase |
| Tab / M | Team scoreboard / tactical map |
| Escape | Pause, sensitivity, audio toggle, controls |

Click Deploy to capture the cursor. The 15-second requisition period freezes movement. Starting credits are $800: buy armor or save for a rifle. The standard sidearm is lethal with an accurate headshot. Stop moving to shoot accurately. Win $3,000; losses award $1,900 increasing by $400. Surviving operatives retain gear. Three weapons, armor, Veil canisters, and a defender disarm tool are available.

Carry the Spike into either amber marked vault and hold E. Protect the armed Spike for 35 seconds. After arming, attacker elimination does not stop the clock. On defense, reach the device and hold E to disarm. You cannot fire while interacting. A dropped carrier's Spike is automatically recovered by a nearby attacker. Death switches to a living teammate's view until the next round. Side swap occurs after round three and resets equipment and credits. A match concludes at four wins with a round timeline and personal statistics.

## Slice and boundaries

Babylon.js renders an original procedural concrete research campus with a turbine hall, hydroponics wing, central chamber, shared cover/collision geometry, original viewmodel, characters, signs, shadows, tracers, and synthesized audio. A shared TypeScript fixed-step 64 Hz local simulation owns bots, movement, damage, inventory, objective, economy, and rounds. This is an offline practice vertical slice, not a multiplayer service or a competitive-ready implementation. See `ONESHOT-REPORT.md` for deviations and honest verification limits.

`tools/capture.mjs` hosts the production bundle under `/arcade/protocol/`, runs Chromium checks, and captures screenshots. Install a Chromium browser with Playwright before running it. The tool closes its browser and server on completion.
