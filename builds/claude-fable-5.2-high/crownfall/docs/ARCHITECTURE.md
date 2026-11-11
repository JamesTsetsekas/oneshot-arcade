# Crownfall — architecture notes

Short reference for the slice: module map, protocol, content schemas, bot behaviour, map fairness
and the accessibility / compatibility checklists. `ONESHOT-REPORT.md` says what is and is not done.

## Module map (brief → code)

| Brief module | Code | Notes |
| --- | --- | --- |
| `shared-content` | `src/shared/heroes.ts`, `items.ts`, `units.ts`, `map.ts` | Pure data + pure functions. Tooltips are rendered from the same numbers the sim uses. |
| `protocol` | `src/shared/protocol.ts` | `Command` (client → server), `Snapshot` / views / `GameEvent` (server → client), transport messages. |
| `server-simulation` | `src/sim/*` | `World` (tick, movement, attacks, NPC brains, projectiles, zones, spawners), `combat.ts` (stats, damage, rewards), `hero.ts` (command validation, orders, casting, shop), `abilities.ts` (kits), `vision.ts`, `view.ts` (fog filter), `server.ts` (room), `worker.ts` (host). |
| `server-ai` | `src/ai/bots.ts` | Hero bots. Minion / monster / tower brains live in `World`. |
| `client-runtime` | `src/client/runtime/*`, `game.ts`, `input.ts` | Link (worker or in-process), snapshot interpolation, intent commands, HUD read model, persistence. |
| `client-renderer` | `src/client/render/*` | Three.js behind `GameRenderer`; terrain, models, instanced minions, VFX, fog, overlay, minimap. |
| `client-ui` | `src/client/ui/*` | React shell, draft, HUD, shop, scoreboard, results, settings. |
| `audio` | `src/client/audio/audio.ts` | Web Audio mixer, synthesised cues, adaptive music. |
| `tools` | `tools/*.mjs`, `tests/*` | Screenshot + real-input playtest of the production build; headless matches and fixtures. |
| `services` | — | Not built (no backend in a static slice). Profile/history use `localStorage`. |

Dependency direction: `shared` ← `sim`/`ai` ← (worker boundary) ← `client`. The client imports the
sim only to *host* it (worker entry / in-process fallback); the renderer and UI never read `World`.

## Simulation

- Fixed 30 Hz (`TICK_RATE`), seeded `mulberry32` RNG, no wall clock, no `Math.random`. Same seed and
  commands → identical world (`World.hash()`, tested).
- Entities are plain objects with optional component blocks (`hero`, `npc`, `struct`) in flat arrays.
  This is a data-oriented entity list rather than a strict archetype ECS.
- Per tick: spawners → bot think → per-unit upkeep/brain/movement/attack → soft separation →
  projectiles (swept, sub-stepped) → zones → cleanup → vision (every 3 ticks).
- 2.5D custom collision: circles, capsules (dynamic walls), cones/rects/circles for zones, an SDF for
  terrain. Knockbacks/dashes validate endpoints (`lastWalkable`, `throughEnd`) and never embed units.
- Measured cost: ~0.15 ms per tick for a full six-bot match in Node on the dev machine (budget 18 ms).

## Protocol

Client → server `Command`s are *intent only*, each wrapped with a sequence number:

`move{x,y}`, `attack{id}`, `amove{x,y}`, `stop`, `hold`, `cast{slot,x,y,id?}`, `rank{slot}`,
`item{slot}`, `ward{x,y}`, `recall`, `buy{item}`, `sell{slot}`, `undo`, `ping{kind,x,y}`,
`cheat{kind}` (practice mode only).

The server (`GameServer`) drops stale/duplicate sequence numbers, rate-limits to 60 commands/s,
validates every command against the world (range, cooldown, resource, CC, visibility, fountain,
gating) and answers invalid ones with a private `reject{reason}` event. A client can never send a
transform, damage or gold value.

Server → client `Snapshot` (currently every tick over the worker `postMessage` channel; the rate is
one line in `worker.ts`):

- `units[]`: only own-team units, structures (public) and enemy/neutral units whose `visUntil` is
  current — the **fog filter runs before serialisation** (`view.ts`, tested with a JSON scan).
- `projs[]`, `zones[]`, `events[]`: filtered by sight (`pointVisible`), by team, or private to a hero.
- `heroes[]`: public scoreboard rows; a hidden enemy carries only its *last seen* position.
- `you`: the local hero's private view (gold, cooldowns, inventory, buffs, death recap).
- `teams`, `objectives` (objective HP and timers are public), `vision` (own sight sources for the fog
  texture), `over`.

The client interpolates between the two latest snapshots (`GameRenderer.frame`) and shows local
feedback immediately (click markers, aim indicators). Because the transport is in-page there is no
movement prediction/reconciliation layer yet — see the report.

## Content schemas

- `HeroDef` — base stats and per-level growth, passive text, four `AbilityDef`s, build graph
  (`starter`, two `paths` with a rationale, `vsPhysical`, `vsArcane`, `skillOrder`).
- `AbilityDef` — `target` (direction/point/unit/ally/self), `shape` (line/cone/circle/rect), range,
  width/radius/arc, per-rank `cost`, `cd`, `castTime`, a `vals` table and a `desc` template
  (`{dmg}` → current rank or `60/95/130/165`).
- `ItemDef` — tier, category, total cost, `from` recipe, `stats`, optional passive text / active.
- `NpcDef` / `STRUCTS` / `RULES` — minions, monsters, structures and global constants.
- Map — capsule "carves" tagged with a surface, structure slots placed by lane arc length, camps,
  brush capsules, ward spots. Baked once into SDF / surface / brush grids (≈100 ms).

## Bots

Bots run inside the simulation and call the same `issue()` as a player. Perception is limited to
units with a current `visUntil` for their team (plus public structure state). States:

`Lane`, `LastHit`, `Harass`, `Push`, `AvoidThreat`, `Retreat`, `RecallBuy`, `JungleCamp`, `Gank`,
`Defend`, `RotateObjective`, `TeamFight`, `ChaseLimited`, plus opportunistic warding.

- **Roles**: one jungler per team (Kesh/Vey when present), other heroes lane; a lane bot swaps lanes
  if the human player settles in its lane and the other lane is uncovered. Junglers group with the
  strongest push late.
- **Laning**: position relative to the allied wave front; last-hit when a minion is inside the
  bot's damage × tolerance; hit structures only while ≥2 allied minions tank; step out when a
  tower targets them or the wave dies.
- **Fights**: power estimate (health × level) decides harass / commit / retreat; chases are limited
  to 16 m from where they started; no tower dives except Hard finishing blows.
- **Abilities**: per-hero rules gated on range, target health, allies nearby, resource reserve and
  danger; skillshots lead the target with difficulty-scaled accuracy.
- **Shopping**: build graph (starter → path, with a conditional defensive branch from the enemy damage
  profile), components bought when the full item is unaffordable, recall trips when gold is banked.
- **Difficulty** changes think interval (18/12/7 ticks), aim error and lead, last-hit tolerance,
  ability usage rate and retreat threshold. It never changes stats, vision or gold (tested).

Known simplification: bots read the alive/dead state of their *own-side* jungle camps directly.

## Map fairness

Teams are mirrored across x = 75, so travel times, structure spacing, camp access and brush are
identical by construction; `tests/map.test.ts` asserts SDF/brush/structure symmetry and compares
fountain → outer tower / Colossus / Catalyst path lengths for both teams (difference < 1.5 m).
Upper and lower lanes are deliberately different (≈123 m vs ≈114 m, different jungle layouts).
Headless side-swap matches (same compositions, sides swapped) showed no side bias.

## Accessibility / readability checklist

- [x] Team affiliation by ground ring, health-bar colour, accent tint and minimap — models are not recoloured.
- [x] Colour-blind option swaps red for amber on enemies, danger zones, bars and minimap.
- [x] Danger zones: saturated edge + striped fill + fill-up timer; allied zones: cool edge, no stripes.
- [x] Low quality removes shadows and most particles but keeps every zone, projectile and telegraph.
- [x] Crowd control is spelled out above the unit (STUNNED / ROOTED / SILENCED / AIRBORNE / MARKED).
- [x] Shields are a distinct striped cyan segment; bars have threshold ticks.
- [x] Captions for critical events (structures, objectives, first blood, tower aggro) — banner + feed.
- [x] Screen shake is subtle and can be disabled; damage numbers aggregate and can be disabled.
- [x] UI scale 100 / 125 / 150%; rebindable action keys; three cast modes.
- [ ] Screen-reader support, full controller support, voice lines: not built.

## Browser compatibility

| Browser | Status |
| --- | --- |
| Edge 157 (Chromium), headless, Windows 11 | Verified: build loads from a sub-path, 25 input checks, full match, screenshots. |
| Chrome (Chromium) | Expected identical; not separately run. |
| Firefox | Not run. Uses only standard WebGL 2 / module workers / Web Audio; CSS `zoom` (UI scale) needs Firefox 126+. |
| Safari | Not run. |
