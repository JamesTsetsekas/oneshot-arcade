# Crownfall

An original browser 3v3 lane-and-objective MOBA set on **The Broken Diadem**, a shattered sky-island. Two guilds (Dawn and Dusk) push minion waves down two curving causeways, fight over a central mistwood, contest the Twin Catalysts and the Aether Colossus, break a Seal and destroy the enemy **Crown Engine**.

This is a vertical slice built in one session for Oneshot Arcade. It runs fully offline: the authoritative 30 Hz simulation and all bots run in a Web Worker "room" inside the page; the client only sends intents and renders fog-filtered snapshots.

## Run it

Requires Node.js 22.12+ and npm.

```bash
npm ci
npm run dev      # http://localhost:5440
npm run build    # static site in dist/ (relative URLs, works from any sub-path)
npm test         # vitest, headless: rules, map, combat, fog, abilities, netcode, full bot match
npm run preview  # serve dist/ on port 5441
```

Extra tooling:

- `npx vite-node tools/headless-match.ts <seed> <maxMinutes>` — seeded headless six-bot balance match with per-minute summary and tick timing.
- `npx vite-node tools/timeline-match.ts <seed>` — full bot match printing the structure/objective timeline and time spent per bot state.
- `node tools/screenshot.mjs menu draft playtest demo:10` — serves `dist/` under `/play/claude-opus-5.5-high/crownfall/` and captures screenshots with the system Edge/Chrome via playwright-core.
- `?demo=<minutes>&seed=<n>` URL parameter — spectator-style demo: your hero is bot-controlled and the room fast-forwards `<minutes>` before streaming (used for screenshots).

## Controls (all rebindable in Settings)

| Input | Action |
|---|---|
| Right-click ground / enemy | Move / attack |
| A then left-click | Attack-move |
| Q W E R | Abilities (quick-cast with indicator by default; release to cast) |
| Ctrl + Q/W/E/R or the `+` button | Rank up an ability |
| D / F | Talents |
| 1–6 | Item actives; 4 = ward trinket when slot 4 has no active |
| B | Recall (7 s) |
| P | Shop (buy only in the fountain or while dead) |
| S / H | Stop / hold position |
| Space (hold) / F1 | Follow / center hero |
| Y | Camera lock with soft look-ahead |
| Arrow keys, edge scroll, middle-drag | Pan camera; mouse wheel zooms (28–42) |
| Tab (hold) / C / M | Scoreboard / advanced stats / expanded map |
| G or Alt + click | Ping wheel (danger, on my way, assist, missing, defend, objective) |
| Alt (hold) | Show attack range |
| Enter | Team chat |
| Esc | Cancel targeting / close panels / match menu |

Camera panning uses arrow keys rather than WASD because W/E/S/D/A are ability and command keys in the brief's control scheme.

## What is in the slice

- **Full loop**: main menu → Tutorial / Unranked (local matchmaker seats named bots, ready check) / Practice → simultaneous draft (6 heroes, roles, difficulty, kit, 3D turntable preview, two Talents, ally/enemy picks, countdown) → loading → match → results (timeline, gold graph, damage/vision/objective stats, skill order, MVP, commend) → profile XP, hero mastery and match history persisted → requeue or build review.
- **Six original heroes**, each with passive + Q/W/E/R implemented server-side, data-driven tooltips, two build paths, bot ability logic, procedural model and animations: Brannoch (tank), Suri Vale (marksman), Oru (support), Kesh (jungler), Ilyra Quill (artillery mage), Vey (assassin).
- **32 items** (6 starters, 10 components, 12 completed, 2 boots, 2 consumables) with shallow recipes, component discounts, buy/sell (65%)/undo rules, item actives and passives, recommended builds that adapt to the enemy damage profile.
- **Six universal Talents** (Phase Step, Mend, Scorch Brand, Bulwark, Tailwind, Reaping Spark).
- **Map**: two curving lanes with outer/inner/guard towers and a Seal per lane, two Core Towers and the Crown Engine per base, river skybridge, Colossus pit with two entrances, two Catalyst pockets, four small camps and two buff camps per side, 16 brush patches, fountains with shops and turrets.
- **Rules**: minion waves (3 Guard + 3 Bolt, Siege every third wave, Vanguards while an enemy Seal is down), tower targeting with hero-aggression rule and visible ramp, backdoor mitigation, structure vulnerability chain, Seal respawn once after 4 min, last-hit gold, shared XP with group penalty, passive gold, kill/assist gold, streak and gold-lead bounties, respawn 7–34 s, 7 s recall, fountain heal, levels 1–12 with R at 6/11.
- **Vision**: team fog grid with mistwood line-of-sight, brush concealment, stealthed wards with proximity true-sight, reveals; hidden enemies are filtered out *before* snapshots are built.
- **Bots** (server-side, same commands and information as players): laning, last-hitting, harass, push, defend, recall/buy along conditional build graphs, wards, jungle routes and ganks, team-planned Catalyst/Colossus contests, late-game grouping, team fights with kit-specific utility-scored casts, retreat, three difficulties.
- **Presentation**: Three.js WebGL2 renderer, instanced minions/props, fog-of-war shader, foreground fade, telegraph decals with shape language (enemy danger = saturated edge + stripes), pooled particles, minimap, health bars with shield/segments/CC tags, damage numbers, pings, death recap, captions for critical events, synthesized SFX and adaptive music, colorblind palette, UI scale 100/125/150%, effects low/high.

See `ONESHOT-REPORT.md` for the honest coverage table, verification log and known issues.
