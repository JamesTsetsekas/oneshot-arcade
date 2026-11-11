# Shardfront

An original browser real-time strategy game (vertical slice). Command one of two asymmetric factions on a fractured alien
moon — **Glass Ravine** — mine Prism Ore and Flux, build a base, scout through fog of war, expand, tech up, and destroy the
enemy Core Relay before the AI destroys yours.

* **Helix Directorate** – durable walkers, braced firing lines, siege. Fabricators build on site and can repair.
* **Verdant Chorus** – fast, cheaper, regenerating bio-synthetic units. Tenders plant structures that grow on their own.

Everything (models, icons, terrain, sounds, music) is generated procedurally at runtime; there are no third-party assets and
nothing is derived from any existing franchise.

## Run it

Requires Node.js 22.12+ and npm.

```bash
npm ci
npm run dev        # http://localhost:5500  (strict port 5500)
npm run build      # static site in dist/  (relative URLs: works from any sub-path)
npm test           # headless simulation / rules / map / replay tests (Vitest)
npm run preview    # serve dist/ on :5500
```

Target: desktop Chrome / Edge with WebGL 2, keyboard + mouse, 1280×720 or 1920×1080. If WebGL 2 is missing the game shows an
actionable error screen instead of starting. Single-player needs nothing but static file hosting.

Extra tooling (needs `npm run build` first, uses an installed Edge/Chrome through `playwright-core`):

```bash
node tools/e2e.mjs            # real mouse/keyboard UI flow: box-select, build, train, groups, attack-move (15 checks)
node tools/e2e2.mjs           # Verdant flow, post-game, replay playback with hash verification, settings persistence
node tools/tutorial-e2e.mjs   # drives all 11 tutorial steps
node tools/battle-shot.mjs    # fast-forwards a real AI-vs-AI skirmish and captures a battle screenshot
npx vite-node tools/headless.ts helix verdant normal normal 15   # headless AI-vs-AI match with a status line per minute
npx vite-node tools/balance.ts                                   # win-rate matrix for the AI
```

Open `index.html?bench=1` (built or dev) to run the reproducible benchmark scene: 220 active units fighting in the central
basin for 20 s, then it prints median FPS / 1 % low (also stored in `window.__bench`).

## How to play

1. **Skirmish → faction → difficulty → Start.** (Or **Tutorial**, an 11-step guided scenario that validates actions, never
   pauses, and ends by destroying a small outpost.)
2. Your six workers already mine. Train more at your Core Relay / Heartgrove (**Q**), build a supply structure (**B**), a
   production structure and a **Flux Tap** on a vent, scout, expand to the natural, tech up, then win with a combined army.
3. You lose when every Core Relay / Heartgrove you own is destroyed. After 18:00 wells yield +15 % and a map-wide reveal pulse
   fires every 90 s so no match stalls forever.

### Controls

| Input | Action |
|---|---|
| Left click / drag / double-click | select / box select / select visible units of the same type (Ctrl+click too) |
| Shift+click | add / remove from the selection |
| Right click | contextual order: move, attack, gather, repair / resume build, capture pylon, set rally for producers |
| Shift + order | queue waypoints / actions · **Alt + right-click** = force move (no auto-acquire) |
| **A** then click | attack-move · **S** stop · **H** hold · **P** patrol · **M** move hint |
| **B** | build palette (workers) · **R** rally mode (production structures) |
| **Q W E R / A S D F / Z X C V** | command-card slots (production, research, build palette); unit abilities use their own key (Q) |
| Ctrl+1–9 / 1–9 / Shift+n / double-tap n | assign / select / add / centre on a control group |
| Tab / Shift+Tab | cycle unit subtype in a mixed selection · **F** focus selection |
| Arrow keys, middle-mouse drag, wheel | pan, drag-pan, eased zoom (24–68 units). Edge-scroll and WASD pan are optional settings |
| **Space** | jump to the latest alert · **Home** centre on base |
| **Esc** | cancel mode / back / pause menu · **F10** menu · **F3** surface debug overlay · **\`** performance panel (dev builds) |

All bindings in the table above (except the fixed digit groups and slot grid) can be rebound in **Settings → Controls**.
Minimap: left-click/drag moves the camera, right-click orders, **A** + click attack-moves.

### What is in the slice

* One map: **Glass Ravine** — two high-ground mains with ramps, two naturals behind gates, two risky side expansions, a
  canyon with two bridges, a lower route through a central basin with a depleted ore field, crystal barriers that plug a back
  door, vision-blocking brush, two capturable Watch Pylons, salvage pods. Walkable / blocked / hover-only / brush / bridge /
  ramp surfaces can be shown with **F3**.
* Both complete faction rosters (7 + 8 units, 6 structures each, 3 attack + 3 armor upgrades each plus a heavy-tech unlock),
  data-driven and schema-validated (`src/data`).
* Economy with finite seams, 1.6 s gathering, visible carried load, per-base saturation / efficiency read-out, supply with
  visible queue pausing, construction progress, 75 % cancel refund, rally points, production queues.
* Fog of war with line of sight, high ground (+2 sight, hides cliffs from below) and brush; fogged enemy structures stay as
  desaturated "last seen m:ss" silhouettes; fogged mobile units disappear.
* Utility AI (Easy / Normal / Hard) that obeys fog and the same command protocol: scouting, memory, composition counters,
  expansion, defence, worker evacuation, waves, retreat, no resource or vision cheats.
* Abilities: Brace, Curl, Sensor Spike, Emergency Weld, Rootstep, Silence Patch, Mender / Mend Spores, directional Aegis
  shield, Crownbeast regeneration aura, slows, overpenetrating lance, delayed eruptions, mortar shells with minimum range.
* Tutorial, post-game summary (metrics, timeline, army / economy graphs), rematch, local replays that re-simulate and verify
  periodic state hashes, tech archive, settings (graphics preset, render scale, shadows, effects, audio buses, camera, key
  rebinding, colour-blind palettes, reduced motion), IndexedDB persistence of settings / history / replays / profile XP.

## Project layout

```
src/data        faction-data: schema + balance tables (helix.ts, verdant.ts) + validation
src/sim         simulation-core: map, nav (flow fields), vision, commands, economy, production, combat, units
src/ai          utility AI (memory, planner, squads)
src/render      Three.js renderer: terrain + fog shader, instanced procedural models, VFX
src/input       camera + pointer/keyboard command mapping
src/ui          DOM HUD, minimap, icons, styles
src/audio       Web Audio mixer, synthesised SFX + adaptive score
src/app         app shell: screens, game loop, tutorial, persistence
tests/          Vitest: data, map fairness, economy, combat rules, fog, determinism, replay, nav, AI
tools/          browser E2E, screenshots, headless AI-vs-AI, balance matrix, static server
```

See `ONESHOT-REPORT.md` for architecture notes, verification evidence and known limitations, and `ASSETS.md` for the asset
manifest.
