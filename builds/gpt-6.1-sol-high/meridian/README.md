# Meridian Run

An original browser urban courier sandbox in Port Meridian's South Quay. Ride through pastel harbor blocks, deliver parcels, borrow a car or van, and recover a port manifest while losing patrols around the city. Complete a shift, earn cash and Trust, repair your gear, save at dispatch, and continue exploring.

## Run

Requires Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
npm test
npm run build
```

Development uses http://127.0.0.1:5260. Production output is `dist/`. For the nested-path production smoke server, run `node oneshot/serve.mjs` and open http://127.0.0.1:5260/arcade/meridian/. Stop it with Ctrl+C. `node oneshot/qa.mjs` runs the Playwright smoke capture against that server (requires a Playwright Chromium installation).

## Controls

| Input | Action |
|---|---|
| W / S | Throttle / brake and reverse; forward / backward on foot |
| A / D | Steer; strafe on foot |
| Space | Handbrake / jump |
| Shift / Ctrl | Sprint / crouch on foot |
| E | Deliver, collect, accept job, workshop, enter/exit nearby vehicle |
| F | Enter / exit (slow below 25 km/h) |
| Right mouse drag | Orbit chase camera |
| C | Near / far chase camera |
| Left click | Nonlethal pulse; stuns nearby visible patrols |
| R | Recharge pulse cells over two seconds |
| Q | Buy/use $40 medical kit when injured |
| H | Horn |
| M / P | City map |
| Esc | Pause, checkpoint retry, abandon, save, sound and camera options |

## The slice

Start mounted on your Kestrel courier bike. Follow the amber road route to Tide Market, then Breakwater, then dispatch. Stop in each amber circle and press E. First Shift pays $250 plus a $75 time bonus under 150 seconds and one Trust. At dispatch, press E again for Lost Manifest: retrieve the archive evidence, escape patrol sight for 14 seconds, then bring it home for $500 and two Trust. Further shifts repeat the courier route.

The workshop just south of dispatch services health, all vehicles and pulse cells for $60. F lets you explore on foot; E near an unlocked vehicle takes it, which triggers a delayed theft report. Pulse use also attracts patrols. Use alleys and buildings to break sight, or outrun them on your bike. Death offers checkpoint recovery. Jobs autosave on completion; the pause menu can save and return you to the safe dispatch point while clear of police. Continue restores earned progression, not an in-flight mission.

Includes three vehicle classes, 19 traffic vehicles, 28 walking residents, two patrols, a full-district map, procedural coastal geometry, Web Audio engine/horn/pulse cues, IndexedDB checkpoints and a generated offline precache. It omits the full-size map, most combat/traversal, interiors, four-mission campaign, production streaming, and advanced crowd/evidence simulation. See `DELIVERY.md` for schemas, tuning, hosting, accessibility and technical limitations, and `ONESHOT-REPORT.md` for verified results.
