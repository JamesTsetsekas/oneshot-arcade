# Skybreak architecture

The slice keeps the brief's module boundaries so the local bot mode can be lifted onto a real server without
rewriting gameplay. The only thing missing between `client` and `server` today is a socket.

```
                    shared/protocol  (InputFrame, ActionRequest, Snapshot, MatchEvent, Welcome, MatchLink)
                    shared/content   (weapons, rarity, items, loot tables, storm phases, movement constants)
                    shared/world     (island source -> heightfield + boxes + sockets + links, collision, nav)
                           |
        +------------------+-------------------+
        |                                      |
 server/match   lifecycle, actors,       client/runtime   LocalLink (loopback transport), Input, settings
 server/spatial interest filtering       client/renderer  Babylon.js world, actor rigs, VFX pools
 server/bots    drop/loot/rotate/fight   client/audio     Web Audio synthesis, loops, score
                                         client/ui        React shell + HUD read model, canvas HUD layer
```

## Authority

`server/match/match.ts` owns everything that matters: positions and movement modes, stamina, inventory, ammo, fire
cadence, recoil and the bloom seed, hit zones, shields, heals, loot rolls, the storm, eliminations and the winner.
It runs at a fixed 30 Hz and is deterministic for a given seed (verified by a test that replays a match).

The client sends one sequenced `InputFrame` per tick (move axes, look, held buttons, edge-latched presses, requested
slot, shoulder, and the match time it was rendering) plus reliable `ActionRequest`s (drop, swap slots, marker, ready,
spectate). It receives a per-viewer `Snapshot` built by `snapshotFor()`.

Bots are server actors. `server/bots/bot.ts` writes the same `InputFrame` a human would and goes through the same
validation; it reads perception-limited state (sight cone, line of sight, mist, audible gunfire, damage direction).

## Interest management

`server/spatial/interest.ts` decides what a viewer may know:

- actor transforms only inside `INTEREST_RADIUS` (240 m) of the viewed actor; loot inside 90 m; containers 140 m;
- tracers only inside the interest radius; gunfire beyond it degrades to a direction-only `gunfar` sound with no
  shooter id; shots beyond audible range are dropped;
- hit events are private to attacker and victim; the kill feed is global but far death positions are stripped;
- spectating re-centres interest on the spectated player.

## Aim model and lag compensation

`shared/aim.ts` defines the over-shoulder pivot. The camera sits on the line through the pivot along `-aim`, so the
crosshair ray *is* the server's aim ray. A shot first traces from the pivot to find the target point, then from the
muzzle to that point; anything in between takes the hit (no shooting around corners). Each actor keeps an 8-tick
position ring; hitscan tests rewind targets to the shooter's `viewTime`, clamped to 180 ms. In loopback this
compensates the one-tick interpolation delay.

## World source of truth

`shared/world/island.ts` authors the Highwake once, deterministically. It emits two separate things:

- **gameplay metadata**: heightfield, yaw-rotated collision boxes in a uniform grid, loot / chest sockets, ziplines,
  ascenders, vents, hazards, valid final-field centres, a nav grid, and a `collisionHash`;
- **render descriptors**: decor shapes, trees, rocks, spinners (consumed only by `client/renderer`).

The nav grid is flood-filled through the real character rules (step height, wall clearance, wading and swimming), so
every walkable cell is reachable; long routes use a 16 m coarse grid refined by bounded A* on the 1 m grid.

## Client presentation

`client/game.ts` advances the link, interpolates between the last two snapshots, turns `MatchEvent`s into VFX, audio
and HUD updates, and owns the camera (boom 3.1 m, shoulder 0.55 m, ADS boom by weapon, collision probe with damped
return, glide / skiff / spectate variants). React (`client/ui`) renders menus and HUD panels from a batched read
model updated ~12 times a second; the crosshair, compass, minimap and indicators are drawn every frame on a canvas.

## What would change for real multiplayer

Replace `LocalLink` with a WebSocket link implementing `MatchLink`, serialise `Snapshot` as deltas, add client
prediction and reconciliation for the local actor (the controller in `server/match/movement.ts` is already pure and
shared-safe), and host `Match` in a room process. None of the gameplay, content, bots or UI code depends on the
transport.
