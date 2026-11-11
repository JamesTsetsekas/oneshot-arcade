# Shardfront

An original browser real-time strategy game. Two asymmetric factions, the industrial **Helix Directorate** and the bio-synthetic **Verdant Chorus**, fight over **Glass Ravine**, a fractured moon map with a hover-only chasm, two bridges, a barrier-sealed lower route and contested Watch Pylons. You mine Prism Ore and Flux, build a base, scout through fog of war, tech up, and break the enemy headquarters. The opponent is a utility AI that obeys the same fog and economy rules you do.

Everything (models, terrain, effects, sound, music) is generated in code. There are no external assets, services, accounts or telemetry.

## Run it

Requires Node.js 22.12+ and npm.

```bash
npm ci            # install exact locked dependencies
npm run dev       # dev server on http://localhost:5400
npm run build     # type-check + static production build into dist/
npm test          # headless simulation/rules test suite (Vitest)
npm run preview   # serve dist/ on http://localhost:5401
```

`dist/` is fully static and uses relative URLs, so it can be hosted from any sub-path (for example `https://host/play/claude-opus-5.5-high/shardfront/`). `node tools/serve.mjs 5401 /play/x/` serves `dist/` under a sub-path for checking.

Extra tools (they need a local Chrome or Edge and a running `tools/serve.mjs`):

- `node tools/screenshot.mjs [url] [outDir]` captures real gameplay screenshots from the production build.
- `node tools/playtest.mjs [url]` drives the game with real mouse and keyboard input at 100%, 125% and 150% device scale and checks how the simulation responds.
- `?benchmark=1` on the URL, or **Settings → Benchmark**, runs a reproducible 220-unit combat scene and reports median FPS and 1% lows.

Target: desktop Chrome or Edge with WebGL 2 (Firefox should work but is untested). Without WebGL 2 you get a clear error screen.

## Controls

| Input | Action |
|---|---|
| Left click / drag | Select one / box select. Double-click or Ctrl+click selects all visible units of that type. Shift+click adds or removes. |
| Right click | Contextual order: move, attack, gather, repair (Fabricator), capture pylon, guard a friendly, set rally (structure selected). Shift queues waypoints and actions. Alt+right-click force-moves. |
| A / S / H / P / G | Attack-move / stop / hold / patrol / guard |
| B | Construction palette (workers), then Q W E D F C |
| Q W E (D F C G) | Abilities on units; training and research slots on structures |
| R | Rally mode for production structures |
| Ctrl+1–9 / 1–9 / Shift+1–9 | Assign / select / add to control group. Double-tap a number to center on the group. |
| Tab / Shift+Tab | Cycle the selection subgroup |
| F / Space / Home | Focus selection / jump to latest alert / center on base |
| Arrow keys, middle-drag, minimap, wheel | Pan (Shift is faster) and zoom. Edge scrolling is optional in Settings. |
| Esc / F10 | Cancel the current mode, or open the pause menu |
| F11 | Browser fullscreen |
| ` / F9 | Performance panel / navigation debug overlay (walkable, blocked, hover-only, brush, buildable) |

Every key is rebindable in Settings → Key bindings.

## What's in the slice

- **Modes:** Skirmish against Easy, Normal or Hard AI as either faction, and a 13-step guided Tutorial that validates what you do rather than exact clicks. Replays of every finished match can be watched at 1–8× speed, with state-hash verification shown on screen.
- **Economy:** two resources. Workers mine 1.6 s per load and haul it back, and over-saturation is visible and inefficient. Flux needs an extractor on a vent. Supply blocks pause the production queue visibly. Construction cancels refund 75%. Salvage pods give a one-time bundle. After 18 minutes, yields rise 15% and the center pulses a map-wide reveal every 90 s.
- **Factions:** Helix has 7 units and 6 structures; Fabricators stay on site to build and can repair, and the faction's structures need a construction field. Verdant has 8 units and 6 structures; Tenders plant seeds that grow on their own, root zones heal, and biological units regenerate. Abilities: Brace, Curl, Sensor Spike (cloaked), Emergency Weld, Rootstep, Mend Spores, and a telegraphed Silence Patch. Passives: Mortar setup and minimum range, Arc Lancer overpenetration, Aegis frontal shield, Mender auto-repair, Thornling frenzy, Crownbeast regeneration aura, Sporecaster slow, Needle Pod scout priority, and the Sentry Arc firing cone. Each faction has three attack and three armor upgrades plus a unit-unlock tech.
- **Fog of war:** high ground blocks vision from below and adds +2 sight. Brush hides units inside it. Last-known enemy structures appear as desaturated ghosts. The AI perceives only what its own player can see.
- **Map:** protected mains, naturals with a defensible choke and a back path, two risky side expansions, a depleted center, two bridges over a hover-only chasm, destructible crystal barriers, flanking brush, and two capturable Watch Pylons. Map fairness is tested automatically.
- **UI:** main menu, faction cards, difficulty explanations, map preview, HUD (minimap, selection panel, command card with layered tooltips, resources, supply, workers, timer, objective), alerts, a post-game screen with metrics, army and resource graphs and an event timeline, rematch, settings (graphics, audio buses, camera, colorblind team palettes, reduced motion, key bindings), Tech Archive, match history, and a cosmetic profile (mastery XP, banners, badges) stored in IndexedDB.

See `ONESHOT-REPORT.md` for exact coverage, verification and known limitations.
