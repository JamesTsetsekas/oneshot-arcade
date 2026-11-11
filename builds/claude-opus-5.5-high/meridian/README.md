# Meridian Run — South Quay vertical slice

An original browser open-world urban action sandbox. You play Rowan Vey, an independent courier in **Port Meridian**, a sunlit harbor city of floodwalls, tram viaducts, markets and hillside stairs. The slice is the **South Quay** district (900 × 900 m, six neighbourhoods). You can walk, drive cars and motorcycles, take on four story jobs and three repeatable activities, and deal with a five-tier Alert police response. All of it runs client-side from a static URL.

Everything you see and hear is generated at runtime: procedural geometry, canvas textures and Web Audio synthesis. No external art, audio or fonts are used.

## Run it

Requires Node.js 22.12+ and npm.

```bash
npm ci          # install exact dependencies
npm run dev     # dev server on http://localhost:5460
npm run build   # static production build in dist/ (relative URLs, works from any sub-path)
npm test        # headless simulation/rules tests (vitest)
npm run preview # serve dist/ on port 5460
```

Optional: `node scripts/screenshot.mjs` serves `dist/` under `/play/claude-opus-5.5-high/meridian/` and captures screenshots into `oneshot/` with headless Edge, using Playwright. Set `PW_CHANNEL=chrome` to use Chrome instead.

Target: desktop Chrome or Edge with WebGL 2, keyboard and mouse. If WebGL 2 is missing, the game shows an error screen instead of starting.

## Controls (rebindable in Settings → Controls)

| On foot | | In a vehicle | |
|---|---|---|---|
| WASD | move (jog) | W / S | throttle / brake & reverse |
| Mouse | camera | A / D | steer |
| Shift | sprint (8 s stamina) | Space | handbrake |
| Left Alt | walk | F | exit vehicle |
| Ctrl | crouch (toggle) | H | horn |
| Space | jump / vault / mantle / climb out of water | C | camera: near / far / hood |
| E | interact, enter or steal a vehicle | X | look back |
| Right mouse | aim (tightens FOV) | Q | next radio station |
| Left mouse | fire / melee | Right + left mouse | drive-by with sidearm |
| R | reload | R (hold, races only) | reset to last checkpoint (+5 s) |
| F | melee; baton takedown from behind | | |
| G / Q | throw gadget / cycle gadget | **Anywhere** | |
| Tab (hold) | weapon wheel (pauses) | M | map (click to set a GPS waypoint) |
| 1–4 | unarmed / melee / sidearm / long gun | P | phone (jobs, contacts, progress) |
| B | use medkit | Esc | pause |
| X / H | shoulder swap / holster | | |

## What's in the slice

- **World:** six districts (Tide Market, Foundry Row, Glassline, Lantern Hill, Breakwater, Canal Loop). They include an arterial loop, collector streets, alleys through courtyards, a tram viaduct with a moving tram, canal bridges, piers and cranes, a hill that rises about 34 m, landmarks you discover by visiting, and seven walk-in interiors: safehouse, store, clothing kiosk, garage, police lobby, freight shed and port office. The district is split into 81 cells of 100 m, built in priority rings around the camera.
- **Vehicles:** eight original models: Pella Compact, Varro Sedan, Osprey Tourer, Brava GT muscle coupe, Quayline Hauler van, Warden Interceptor police car, and two motorcycles (Kestrel 250, Vanta 800). Driving uses a tire-slip model with load transfer, handbrake oversteer, a stability assist and traction control. Surfaces change grip. Damage weakens the engine and steering, and enough of it stalls the car. You can drive off the quay into the harbor, take spike-strip punctures, and get thrown off a motorcycle in a hard crash.
- **City life:** traffic follows lanes and stops at synchronized signals. Drivers keep their distance, yield on left turns, honk, pull over for sirens and panic at gunfire. A car that gets hit recovers and rejoins its lane, or the driver abandons it. Pedestrians walk sidewalks on routes, wait at crossings, browse stalls, chat in short subtitled exchanges, and react differently to danger (curious, panic, flee, hide, call the police, help someone injured). Vendors and a busker stay at their spots.
- **Combat:** unarmed, baton, stun projector, compact pistol, machine pistol, carbine, pump shotgun and marksman rifle, plus smoke canisters and a distraction chirper. Hits have head, torso and limb zones, damage falls off with range, and bullets go through thin cover. Armor absorbs damage, and health regenerates up to 30. Guards and rivals take cover, flank and retreat.
- **Police and the Alert system:** police learn about a crime only if an officer or camera sees it (immediate) or a civilian witnesses it and finishes a 2–5 s phone call, which a chirper can interrupt. There are five Alert tiers, shown as a segmented beacon with an identification state (Unnoticed, Witness Reporting, Identified, Pursuit, Search, Cooling). Units spawn out of view and drive in physically. Higher tiers bring roadblocks (Tier 3) and spike strips plus a drone (Tier 4). When police lose sight of you, they search the last-known area, and the Alert then cools down. Changing outfit out of sight or switching vehicles breaks identification. At low tiers you can be arrested; complying costs a fine. The number of units and reinforcements is capped.
- **Missions:** a versioned, data-driven mission graph with four story jobs: *First Shift* (motorcycle delivery tutorial), *Lost Manifest* (stealth, or bluff your way in through the front), *Hot Cargo* (follow witness clues, stop a fleeing van without destroying the cargo, deliver it while rivals chase you) and *Signal at the Breakwater* (infiltrate, upload, hold out against a counterattack, choose a motorcycle or car, break a Tier-3 search). Three repeatable activities: **Courier Runs** (procedural, with fragile, urgent and quiet modifiers), **Street Circuit** (three laps in live traffic with a ghost of your best run, reset penalty and recorded assist settings) and **Recovery Calls**. Every job has checkpoints, fail reasons, retry, abandon, replay from the safehouse board without paying twice, and a grade.
- **Economy and progression:** cash buys ammo, medkits, armor, gadgets, outfits, repairs, weapons and a garage slot. Trust (0–5) unlocks stock and outfits; it never raises damage or health.
- **Presentation:** a sun that moves from afternoon into sunset and night, lit windows and street lamps, rain on wet roads after the finale, a minimap with GPS routing, a full map with legend and filters, a phone, subtitles, and a dispatch radio that reports only what the evidence supports. Two generated radio stations play in vehicles.
- **Saves:** stored in IndexedDB with checksummed, journaled writes, three rolling backups, recovery from interrupted writes, migrations from v1 and v2, and JSON import/export. Saves happen when you rest at the safehouse and after each job.
- **Settings:** quality preset, shadows, dynamic resolution, FOV, traffic and pedestrian density, sensitivity, invert Y, aim and sprint toggles, key bindings with conflict warnings, audio buses, streamer mode, subtitle size, reduced motion, photosensitivity mode, colorblind markers and driving assists. Settings also has a 30 s benchmark flight.
- **PWA:** the build includes a manifest and service worker, so the game works offline after the first load.

See `ONESHOT-REPORT.md` for what was and wasn't verified and `docs/TECHNICAL.md` for the architecture, schemas and tuning data.
