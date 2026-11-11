# Farestorm

A compact, original 3D arcade taxi game in the sunlit coastal city of Galeport. Pick a cab, stop for passengers, beat their patience timer, and turn deliveries into cash and more shift time. Your best score stays in this browser.

## Run

Node.js 22.12 or newer and npm are required.

```sh
npm ci
npm run dev
npm test
npm run build
```

The development URL is `http://127.0.0.1:5270`. Upload the contents of `dist/` to any static host, including a nested directory. The build uses relative asset paths. No accounts, network gameplay, or backend are required. Browser-managed caching is supported; an installed offline PWA is not implemented.

To reproduce the nested-path production check, run `node tools/serve.mjs`, then visit `http://127.0.0.1:5270/arcade/farestorm/`. Stop that server with Ctrl+C. `tools/capture.mjs` uses Playwright Chromium to record a real keyboard-driven pickup and screenshots; install Chromium first with `npx playwright install chromium` (use a project-local `PLAYWRIGHT_BROWSERS_PATH` if desired).

## Controls

| Input | Action |
| --- | --- |
| W / Up | Accelerate |
| S / Down | Brake, then reverse |
| A/D or Left/Right | Steer |
| Space | Handbrake / Snap Drift |
| Shift | Consume Tailwind charge for a speed burst |
| C | Near / far chase camera |
| X | Hold to look back |
| R | Road reset; costs 3 seconds and $150 |
| M | Mute / unmute synthesized audio |
| Escape | Pause / resume |
| Enter | Start / retry |

Standard-mapping gamepad: RT throttle, LT brake, left stick steering, A drift, B boost. Menus use mouse/keyboard. Physical gamepad operation has not been verified.

Stop below 8 km/h in a mint ring to board. Follow the mint road dots, bearing indicator, or minimap to the gold destination ring. Stop below 9 km/h to deliver. Brake early: overshooting is recoverable. Fares extend the initially 60-second shift by 5–12 seconds, capped at 85 seconds. The passenger has a separate timer; losing a rider does not end the shift. Drift at speed and pass traffic closely to build Pulse, multiply style earnings, and recharge Tailwind. When the clock expires, results show rank, earnings, delivered fares, collisions, and best Pulse.

## Slice contents

- One procedural 470 m coastal district with interconnected roads, 64 buildings, harbor, palms, signs, and distant headlands.
- Three distinct tuning profiles, 12 destinations/passenger identities, six available pickup candidates, and 32 deterministic traffic vehicles.
- Complete selection → pickup → delivery → repeat → results → retry loop.
- Fixed 60 Hz simulation, collision/reset rules, scoring, timer, fare grade, Pulse decay, boost, generated audio, minimap, and local best score.
- Twelve automated simulation/rule tests. See `ONESHOT-REPORT.md` for the deliberately reduced scope and verification limits.

## Source map

`src/sim.ts` owns taxi tuning, destination/road/building data, deterministic traffic, movement, collision, fare and scoring rules. `src/main.ts` creates Babylon.js geometry, camera, input, Web Audio, menus and HUD. `src/style.css` supplies the interface. `tests/sim.test.ts` covers rules without rendering. `DESIGN.md` documents formulas and implementation boundaries. All visual and audio assets are generated locally in code.
