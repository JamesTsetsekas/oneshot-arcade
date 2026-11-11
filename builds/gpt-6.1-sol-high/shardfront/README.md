# Shardfront

An original, local 3D RTS skirmish on Glass Ravine. Harvest Prism Ore, extract Flux, establish production, expand supply, and cross the canyon to destroy the opposing headquarters.

## Run

Node.js 22.12+ and npm:

```
npm ci
npm run dev
npm test
npm run build
```

Development uses port 5200. The production site is in `dist/` and supports arbitrary hosting sub-paths. `npx tsx tools/serve.ts` serves the production build at `http://127.0.0.1:5200/play/shardfront/`. `npm run benchmark` runs the CPU-only simulation stress scene.

## Play

Choose a faction and difficulty, then deploy. Six workers begin mining automatically. Select a worker, open Construct, and place an Assembly Bay / Brood Hollow on clear ground near your base. Select that building to train basic troops. Place a Flux Tap on a violet vent, build a Signal Foundry / Memory Bloom, and train ranged specialists or siege units. Build supply pylons when production is blocked. Siege outranges headquarters defenses; protect it with basic troops. Stand near neutral Watch Pylons for vision. Destroy all opposing headquarters to win.

- Left click selects; drag selects mobile units. Shift adds/removes; double click selects the same type.
- Right click moves, gathers from crystals, attacks visible enemies, or sets a production rally point.
- A then click: attack move. Shift orders append waypoints.
- B: worker construction palette. Q: restore selected combat units, 10 Flux each, 20-second cooldown.
- Ctrl+S: stop. Ctrl+1–9: assign groups; 1–9: select groups.
- WASD / arrows pan, wheel zooms, Home / Space returns to base, F focuses selection.
- Minimap left click moves camera; right click orders selected units.
- Escape cancels placement or pauses. Pause menu offers audio mute and return to menu.
- F3 toggles a fog debug view. This is a local developer aid, not an online security boundary.

## Slice

Both factions have distinct procedural mechanical/organic silhouettes and names; Chorus units have faster movement and passive regeneration. Each has workers, scouts, basic troops, ranged specialists, siege, headquarters, production, supply, Flux extraction, technology, and static defense. Includes three assault thresholds for AI, guided objectives, fog and exploration, watch captures, production queues and refunds, one damage upgrade, repair ability, victory/defeat statistics, and rematch.

The guided operation is contextual help over a skirmish, not the full scripted tutorial. Unit definitions, map metadata, and command types are in `src/data.ts` and `src/simulation.ts`. See `ONESHOT-REPORT.md` for candid coverage and limitations. No external runtime services or downloaded art are used.
