# Ashfall Covenant — One-shot report

## Summary

I built a playable isometric action-RPG vertical slice in TypeScript, Babylon.js and React. It has two complete classes, a hub town, a seeded wilderness made from authored tiles, a three-floor procedural/handcrafted crypt, ten enemy types with elite modifiers, and two multi-phase bosses. The full expedition loop runs through quests, waypoints, death and Echo recovery, randomized affix loot, and Artificer crafting, then on to Veteran difficulty, Target Hunt and reseeded farming. The simulation is a deterministic, seeded 30 Hz model with 109 headless tests, and all art and audio are generated procedurally at runtime.

## Brief coverage

| System / acceptance criterion | Status | Note |
|---|---|---|
| Launch → capability check → Continue / Create Warden | Done | WebGL 2 check with an error screen. Main menu has Continue (with save timestamp), Create Warden, Characters, Settings, Credits. |
| Two classes, body/voice preset (cosmetic) | Done | Cinder Vow and Veil Ranger. Body, voice and cloth presets; voice is stored only and has no audible effect. |
| Input tutorial in the refuge | Done | Six-step primer checklist, skippable, stored in the profile. |
| Ember Refuge (stash, vendor, healer, Artificer, waypoint, NPCs, dummies, portals) | Done | Handcrafted single chunk with no combat. Training dummies and a Training Cell door. |
| Soot March: 20 authored tiles, 4×4 grid, 10–12 per seed, required anchors, loop + shortcut | Done | Anchors: gate, tollhouse, waypoint, hunter camp, elite ring, boss gate. Validated over 30 seeds in tests. Tiles are not literally rotated; openings are carved per edge (see deviations). |
| Hollow Archive: 3 floors, traps / scholars + lever shortcut / handcrafted boss approach, landmarks, repeat caps | Done | Room-graph floors 1–2 (repeat cap 2, no identical adjacent rooms). Floor 3 is handcrafted with a checkpoint waypoint before the arena. |
| Click-to-move, hold to move/attack, invalid-click projection | Done | Grid A* with string-pulling. Off-mesh clicks project to the nearest walkable point; >1.5 m shows an invalid marker. |
| Evade 4.5 m / 320 ms, 3 charges, 2.8 s recovery, small-enemy phasing | Done | Covered by a test. |
| Combat model: Health, Focus, Heat/Trace, armor (DR by hit size), capped resists, crits, ailments, CC → boss stagger | Done | 4 damage types. Burn, chill, blight, slow, root, stun, stagger, knockback. Stun has diminishing returns. |
| Six actives + basic + 6 passives + 2 exclusive capstones per class, data-driven with all required fields | Done | `src/data/skills.ts` is schema-checked. Tooltips are derived from the same data. Two distinct capstone builds per class. Balance at level 20 has not been verified. |
| 10 normal enemies with distinct AI, state machine, attack slots, heavy-attacker tokens, LOS/search | Done | Dormant / Investigate / Approach / Telegraph / Execute / Recover / Flee. Up to 6 melee slots; 2 (Normal) or 3 (Veteran) simultaneous heavy attackers. |
| Elite modifiers (≥3) with exclusions and threat budget | Done | Five: Ember Wake, Frost Pulse, Rallying, Mirror Shell, Vampiric Bond. One on Normal, two on Veteran. |
| Toll-Keeper (chain sweeps, lanterns, breakable armor) | Done | Armor meter → 4 s stagger. Anti-repeat weighting, Veteran double sweep, enrage at 180 s. |
| Orison Engine (3 phases: rotating beams + repair scribes / conduits + quadrant blight / slower beams + stagger race) | Done | Overload donut if the stagger race fails. Veteran counter-rotating beams. Enrage at 300 s. No cutscenes. |
| Death Echo (10% gold, +8% health blessing, no compounding), respawn at waypoint, −5% durability | Done | Covered by a test. |
| Items: 10 slots, 2H rules, 10×6 grid (1×1/1×2/2×3), sort, compare, favorite, drop, equip, salvage, filter | Done | Drag to move or equip. Side-by-side compare with stat deltas. Search/filter. Context menu. Items cannot be rotated (no art requires it). |
| Rarity tiers, affix model (tiers, groups, exclusions, class tags), ~80 bases, ≥45 affixes, 8 Relics | Done | 81 bases, 65 affixes, 8 Relics with coded special powers. Rarity uses a shape glyph plus colour. |
| Seeded loot, first-kill Inscribed guarantee, Relic bad-luck protection | Done | Loot RNG state is saved. Covered by tests. |
| Potions (4 kinds, stack 5), glyphs (combine 3→1), Artificer identify/salvage/reroll-one/repair/socket | Done | Hunter quest raises the belt cap to 6. |
| Vendor, stash, gold/dust economy | Done | Vendor stock is seeded per town visit. |
| Progression: XP, cap 20, skill point per level, attribute point every other level, respec (free ≤8), 2 loadouts | Done | |
| Quests: waypoint, Toll-Keeper/open Archive, rescue Artificer, defeat Engine, optional hunter event | Done | |
| Normal → Veteran, Target Hunt with times, Training Cell with damage breakdown | Done | Veteran: −20% resists, elite density, 2 mods, better tiers, enemy levels +12. |
| Save: IndexedDB, versioning, checksum, backup, recovery, migrations | Done | One atomic transaction: backup ← old primary, primary ← new. Migrations v1→v3. Corrupt-save UI. |
| HUD (orbs, skill bar, potions, XP, minimap, quest tracker, buffs, boss bar), inventory, skills, character, map, vendor/crafting UIs | Done | Automap shows explored cells only. |
| Ground labels (rarity priority, collision avoidance, distance fade, Alt) | Done | |
| Settings: quality, dynamic resolution, shadows, particles, gore, shake, damage numbers, labels, keybinds, audio buses, subtitles, reduced flash/motion, colorblind | Done | Rebinding includes mouse buttons 4/5 and a left-handed preset. |
| Camera spec (38°/45°/42° FOV, zoom 13–24 eased, 70 ms lag, lookahead, boss framing, capped layered shake, unshaken picking) | Done | Occluder fade is implemented as a height cutaway of walls and tall props (see deviations). Middle-mouse orbit is optional. |
| Audio: buses, ducking, ≤40 voices, telegraph cues, UI cues, adaptive score (town/wilds/crypt/boss/victory/low health) | Partial | All synthesised. Stereo panning only, no HRTF or reverb zones. **Not audibly verified** (headless runs only). |
| Workers for dungeon generation | Done | Zone plans are generated in a module worker, with a synchronous fallback. |
| Rapier physics, Recast navmesh, glTF/KTX2 assets, WebGPU, service worker | Not started | Replaced by grid nav plus circle collision and procedural meshes (see deviations). No offline service worker. |
| Explosive braziers, levers, gates, urns, chests, traps | Done | Braziers show a radius telegraph and damage both enemies and the player. |
| Performance targets (60 fps with 45 enemies, budgets) | Partial | 60 fps reported in headless Chrome during the scripted runs. No 45-enemy benchmark was run. |
| UI at 125/150% browser scaling | Not verified | Tested at 1280×720 and 1920×1080 only. |
| Co-op architecture readiness | Partial | The simulation consumes input intents and emits typed events, and the UI never mutates sim state directly. No networking. |

## Architecture

**Stack**
- **TypeScript (strict), Vite, Babylon.js 8 (WebGL 2), React 18, Vitest.** Babylon and React follow the brief's direction.
- **No Rapier or Recast.** At this scale a 1 m walkability grid with A* plus string-pulling, circle-vs-grid collision, and crowd separation is deterministic and easy to test.

**Modules** (`src/`)
- `app/`: boot and capability check, controller (fixed-step loop, autosave, zone streaming via the worker), input → intents, settings and keybinds.
- `sim/`: `Game` session (zones, ticks, interactables, loot, quests, economy), `combat` (damage pipeline, ailments), `player` (actions, abilities, projectiles), `ai` (enemy state machine, slots, elites), `boss` (Toll-Keeper and Engine directors), `nav` (A*, LOS, flood fill).
- `data/`: content schemas and tables (skills, enemies, items, affixes, Relics, glyphs) plus `validate.ts` (schema checks, run in tests).
- `items/`: item model, generation, rerolls and costs, inventory grid.
- `progression/`: character and save model, XP, skill tree rules, derived stats with formula text, quests.
- `world/`: zone builder, Soot March tile generator, Archive room-graph generator, refuge, training cell, hunts.
- `render/`: renderer, camera rig, terrain and props (thin instances), actor rigs (instanced prototypes, procedural animation), VFX (GPU-instanced particles, telegraph decals), DOM overlay.
- `ui/`: React HUD, panels and menus over a tiny external store (HUD updated at about 12 Hz).
- `audio/`: Web Audio synthesis.
- `persistence/`: IndexedDB repository, checksums, backup and migrations.
- `workers/`: zone generation.

The simulation owns all truth. Rendering, audio and UI only read state or consume typed `GameEvent`s, and React components call `Game` methods rather than mutating state.

## Verification

All commands ran in the workspace on Windows 11 with Node 22.12.0 and npm 11.4.2.

- `rm -rf node_modules dist && npm ci`: added 158 packages in 26 s. npm audit reports 3 advisories, all in dev-only test tooling (`@vitest/mocker`, `tinypool` via vitest); `npm audit --omit=dev` reports **0 vulnerabilities**.
- `npm test`: **4 files, 109 tests passed, 0 failed** (≈2 s).
  - World generation: 30 March seeds and 20 Archive seeds checked for anchors, loops, shortcut, reachability with and without gates, repeat caps, pack budgets and elite rules.
  - Simulation: determinism hash; class bots clearing early packs; every class skill cast against a dummy; evade distance; town-gate interruption; Echo rules; full belt and full inventory; heavy-attacker cap; both boss phase flows; arena reset on death; quest, lever, guardian, hunter, training and hunt flows.
  - Items: content schema; loot rules over 3,000 rolls; determinism; reroll, identify, repair, socket and glyph; destruction guards; vendor; level, skill and respec rules.
  - Saves: IndexedDB round-trip via fake-indexeddb; corrupt-primary → backup recovery; migrations.
- `npm run build`: `tsc --noEmit` plus `vite build` succeeded.
  - JS gzip total ≈1.47 MB: Babylon 1.31 MB, app 115 KB, vendor 46 KB, CSS 6 KB, worker 37 KB.
  - All asset URLs are relative.
- `node scripts/screenshot.mjs --out=oneshot --size=1920x1080`:
  - Serves `dist/` from the sub-path `/play/claude-opus-5.5-high/ashfall/` with a plain static server and drives headless Chrome.
  - Flow: menu → Create Warden → refuge → Soot March fight driven by real mouse and keyboard events → inventory and skills panels → Archive floor 1 → Toll-Keeper and Orison Engine arenas.
  - Result: **0 console errors**, renderer reported 60 fps.
  - Screenshots are in `oneshot/`.
  - The script stages positions and levels (teleports next to a pack, sets levels for the boss shots) to reach those scenes quickly. The rendering and the fighting itself are real.

**Not verified**
- A full human playthrough from creation to Engine victory in a browser. The flow is covered by simulation tests, but not by hand in the real UI.
- Session length and balance over a 20–35 minute run, and level 15–20 Veteran balance. In one scripted 1280×720 run the clicking bot (no dodging) died at level 4 to a pack with an elite.
- Audio output; Firefox and Safari; 125%/150% browser zoom; the 45-enemy performance target; real-GPU frame timing.

## Assumptions and deviations

- **Physics and navigation.** Rapier and Recast are replaced by a deterministic grid (A* with string-pulling, circle collision, separation). Doorways and corridors are at least 3 m wide.
- **Assets.** There are no glTF or KTX2 assets. All meshes are runtime primitives with procedural animation, which gives eight-direction locomotion implicitly. There are no LODs, ragdolls or SSAO.
- **Occluders.** Fading is done as a height "cutaway" of walls and tall props between the camera and the player, not alpha dithering.
- **Tile rotation.** March tiles are not rotated; tile templates carve their openings per connected edge instead.
- **Artificer timing.** The Artificer is rescued on Archive floor 1 after the Toll-Keeper falls. Inscribed items and Relics stay unidentified, showing only implicit stats, until then.
- **Veteran.** Veteran resets quests and waypoints with a new seed, keeps the rescued Artificer, and adds 12 enemy levels. "New expedition" reseeds the zones at the same difficulty for farming.
- **Telemetry.** Encounter "telemetry for cause of death" is local only: in-memory counters plus death causes stored in the save. Nothing leaves the browser.
- **Not implemented.** No service worker or offline cache, no WebGPU, no cloud saves or co-op.

## Known issues and limitations

- **Balance is lightly tuned.** Numbers come from formulas and bot tests, not playtesting. Early packs with an elite can overwhelm a player who doesn't dodge, and late Veteran is untested.
- **Readable but simple visuals.** Primitive-built characters with procedural animation. Some props (stone, waypoint) can bloom brightly under the player light. The Babylon bundle is large (1.3 MB gzip) because it is imported whole.
- **Audio is unverified.** It was never heard during development, so the mix and levels may need adjustment.
- The minimap and automap are rotated to match the camera; labels can overlap in dense loot piles beyond 8 stacked labels.
- **Inventory items cannot be rotated**, and the stash is a single tab.
- **Some inputs not built.** No gamepad. Hold-to-attack uses the basic attack only, not hold-to-cast for Q–R skills.

## Self-assessment

- **Playability: 6/10.** The full loop works and combat has real telegraphs, evades and builds, but balance and pacing have not been tested by a human.
- **Visual polish: 5/10.** The lighting, VFX and telegraphs read clearly, but primitive-built characters and props look placeholder next to the brief's painterly target.
- **Brief fidelity: 7/10.** Nearly every gameplay system and acceptance flow in the MVP exists and is tested; the main gaps are the specified tech (Rapier, Recast, glTF, service worker) and the performance and accessibility checks.
