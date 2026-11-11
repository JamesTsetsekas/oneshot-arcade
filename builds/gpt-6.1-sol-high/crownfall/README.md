# Crownfall — The Broken Diadem

A self-contained, offline 3v3 lane-and-objective game on a floating mythic-industrial island. Choose one of six champions, escort waves through two causeways, buy equipment, contest the Aether Colossus, and break the opposing Crown Engine. This is a deliberately reduced vertical slice, not the production multiplayer MVP.

## Run

Requires Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
npm test
npm run build
```

The development server uses port 5240. `dist/` is a static site with relative asset paths and can be hosted under any directory. For a local production check, run `node tools/serve.mjs`, then open `http://127.0.0.1:5240/play/crownfall/`.

## Play

- Right-click (or left-click) the ground to move; click an enemy to pursue and attack. Your hero automatically attacks visible enemies in range.
- Aim at the world with the mouse and press **Q / W / E / R**. Hover the HUD buttons for kit descriptions. R unlocks at level 6. Energy regenerates.
- **P** opens the shop; purchases require being near your fountain. You begin with enough gold for a starter purchase.
- **B** channels a four-second recall; taking damage interrupts it. The fountain rapidly restores health.
- **4** places a ward within 20 units; at most two can be active, each lasting 60 seconds.
- **S / H** stop movement. **Arrows** pan; **Space / F1** pan toward your hero; **M** restores the full-map view; mouse wheel zooms.
- Hold **Tab** for the scoreboard. **Escape** pauses and shows controls. The top-right music symbol toggles simple synthesized action cues (off initially).
- Click the minimap to move. The guided match offers a checklist while the same complete battle runs.

Stay with your minions: structures take only 28% damage without a nearby allied wave. Destroy a lane's outer tower to unlock that lane's Seal. Breaking either Seal unlocks both Core Towers; destroying both unlocks the Engine. The neutral Colossus at the centre grants 70 seconds of empowered minion attacks and team gold. You must explicitly target it; bots concentrate on lanes. Level, gold, and wave strength rise during the match. Results save to local browser history, with a return to champion selection.

## Scope and source

- Strict TypeScript simulation at 30 Hz, Three.js renderer, React draft/HUD/shop/results.
- Six selectable hero stat profiles and reduced kits, five bots, two lanes, minion waves, towers, seals, cores, boss, gold/XP/levels, six items, death/respawn, recall, wards and proximity visibility.
- Procedural meshes, original CSS portraits and UI, no downloaded art, remote calls, tracking, accounts, or backend.
- Tests exercise rules and a complete accelerated bot match. `tools/capture.mjs` exercises the production UI with Playwright and writes real screenshots; install its Chromium with Playwright before running it.

See `ONESHOT-REPORT.md` for explicit deviations, omissions and verification. The simulation is cleanly separated from rendering, but is browser-owned and must not be represented as multiplayer-authoritative.
