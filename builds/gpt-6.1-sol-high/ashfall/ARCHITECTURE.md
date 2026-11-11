# Architecture and content notes

`game.ts` owns simulation state, 30 Hz intent resolution, damage, resource economy, progression, deterministic encounters and items. React has no damage or loot generation logic. UI actions call simulation methods. `scene.ts` owns Babylon presentation and pointer picking. `main.tsx` owns React overlays, keyboard input, lifecycle and the synthesized sound sink. `persistence.ts` owns versioned IndexedDB writes and fallback reads. This small-module approach permits future replacement of local simulation by snapshot/event adapters, but no multiplayer implementation is claimed.

## Data contract

`HeroClass`, `Skill`, `Item`, `Enemy`, `Effect` and `Vec` are strict TypeScript definitions. Skills declare tags, cost, cooldown, radius, coefficient, targeting, anticipation, cancel metadata, ailment metadata, VFX/SFX identifiers and threat metadata. Tests validate minimal content requirements. Only costs, cooldowns, targeting, anticipation, coefficients and radius are authoritative in this slice; cancel, ailment and threat metadata reserve future behavior rather than pretending to implement it. No external JSON schema validator is installed.

## Balance tables

Basic damage is 17 + weapon power + 5 per Tempered Edge rank, at 0.5 second cadence, with a 12% chance to deal 1.7x damage. A basic hit restores 9 Focus; idle recovery is 2 Focus/second. Passive skill damage increases 15% per rank. Equipment provides additional power and armor. Physical mitigation is a simple subtraction of 0.4 per armor point, minimum one damage, rather than the production brief's formula.

Equipment levels use `3 + 2*level + [0,7]` power and `1 + level + [0,5]` armor, rounded. Inscribed items are guaranteed from bosses; ordinary drops use a 45% chance. The rarity label does not grant an extra multiplier. The forge produces level +2 Inscribed gear for 30 gold and 5 dust. Salvaging yields 2 dust (Tempered) or 5 dust (Inscribed). No full affix pool is implemented.

Seeds: 7319 is the default; the per-zone RNG uses seed + zone + 100*difficulty. Loot uses seed + 37*kills. Tests pin deterministic behavior. Zones are connected rectangular authored spaces with seeded encounter jitter, not the brief's procedural tile graph.

## Save format and recovery

Database `ashfall-covenant`, IndexedDB version 1, object store `saves`. Keys `current` and `backup` hold `{body, hash, date}`; body is a JSON v1 snapshot, hash is FNV-1a. One atomic transaction moves the previous record to backup and writes the current record. Load checks the checksum and version and tries backup after failure. Unsupported versions are rejected rather than guessed; a future v2 needs an explicit v1-to-v2 migration before validation.

Retained: class/name, seed, zone, difficulty, act/waypoint/rescue/gate flags, player build and resources, inventory, equipped item and kills. Zone entrance and full health are restored; enemies reset. Ground drops, Echo, enemy health, elapsed timer, cooldowns and sound settings are not saved. This is a checkpoint system, not a full world snapshot.

## Performance and browser matrix

Floor tiles merge by material. Ordinary bodies are lightweight primitives. No texture downloads or skeletal assets exist. Dynamic ring creation is not pooled and is a known allocation cost; no target hardware benchmark is claimed. The test bridge at `?verify` allows inspection without introducing remote telemetry. There are no analytics hooks or recorded player identifiers.

Chrome-compatible headless Chromium is the verification browser. Edge is expected from its Chromium engine but unverified; Firefox and Safari are unverified. No service worker is installed: already-loaded gameplay requires no network, but a fresh offline navigation is not guaranteed. There is no Rapier, Recast, worker generation, performance benchmark scene, external asset compiler or CI glTF validation in this slice.
