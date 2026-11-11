# Skybreak

An original, offline third-person battle royale set on the floating island of The Highwake. Drop from a copper transit skiff, steer a wing-sail into four salvage settlements, find a better weapon, and outlast 23 bots and the closing Riftstorm. This is a compact playable vertical slice, not the production multiplayer game described by BRIEF.md.

## Run

Node.js 22.12+ and npm are required.

```sh
npm ci
npm run dev
npm test
npm run build
```

Open the URL printed by Vite (port 5250). The production output is `dist/`; serve it with any static host, including beneath a sub-path. For the included production check server, run `node oneshot/serve.mjs` and open `http://127.0.0.1:5250/play/skybreak/`.

## Play

Choose Quick Drop for a 24-seat local match, or Practice Range for stationary target practice. Click the game to capture the mouse; Escape pauses and releases it. The short staging countdown leads into a skiff route: press Space to jump, or wait for automatic insertion. Steer while gliding with WASD. Copper caches have turquoise seams and beacons; approach within 5m and press E to open and equip their salvage. Stay within the pale map circle. A match lasts up to about five minutes, ending on your elimination or the last survivor, followed by results and requeue.

| Input | Action |
|---|---|
| WASD / Mouse | Move or steer / aim |
| Left click / Right click | Fire / aim down sights |
| Shift / Ctrl | Sprint with stamina / crouch speed |
| Space | Jump from skiff / ground jump |
| E / R | Open nearest cache / reload |
| 1 / 2 | Harbor Pistol / most recently salvaged weapon |
| 4 / 5 | Timed Med Injector / Shield Flask |
| M / Tab | Map / inventory summary (local simulation pauses) |
| X / Escape | Shoulder swap / pause menu |

Damage consumes Aegis, then Reserve, then Health. Aegis regenerates eight seconds after the last hit. Med Injectors restore 35 Health after three seconds; flasks restore 25 Reserve after 2.5 seconds. Healing slows movement and prevents firing. Reloading and fire cadence use simulation time. Salvage replaces the second weapon slot; switching preserves ammunition. Slot three is empty in this slice.

## Included

Four procedurally modeled settlements, four weapons, four named rarity identities, 24 contestants, deterministic local rules, original synthesized effects, solid building collision, basic line-of-sight bot combat and storm rotation, elimination caches, regeneration/consumables, minimap/full map, results, settings for audio, and a field guide. No accounts, remote APIs, analytics, or art downloads. WebGL 2 is required and has an explicit error screen.

## Scope

The map is approximately 420m square and matches are compressed. No online networking, Rapier, streaming, complex traversal, progression, utility items, or full inventory editing is included. Buildings are solid cover rather than enterable interiors. Practice targets do not respawn until re-entry. See ONESHOT-REPORT.md for coverage and verification evidence.
