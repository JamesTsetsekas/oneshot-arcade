# Threat model, accessibility and compatibility notes

## Threat model (as it applies to this slice)

The slice has no network surface: no sockets, accounts, storage beyond `localStorage`, or third-party requests. The
design choices below are what a networked build would inherit.

| Risk | Mitigation in the code today |
| --- | --- |
| Speed / teleport / fly hacks | The client never sends positions. `server/match/movement.ts` computes every mode from inputs; move axes and pitch are clamped in `Match.setInput`. |
| Rapid fire, infinite ammo, no reload | Cadence, magazine, reserve, reload and equip timers live on the server (`combat.ts`). |
| Aim through walls / corner shots | Camera ray then muzzle-to-target obstruction check, both server-side. |
| Inventory duplication | Pickups, drops and swaps are server actions validated for range, ownership and slot bounds. |
| Wallhacks / ESP via snapshot data | Interest filtering: no distant transforms, no far tracers, private hit events, stripped far death positions. |
| Lag-compensation abuse | Rewind is clamped to 180 ms and never interpolates across a teleport. |
| Tampered content | `CONTENT_VERSION`, `MAP_VERSION` and a collision hash are exposed for a server handshake. |

Not implemented: message quotas and rate limiting, signed content manifests, movement / fire anomaly detection,
replay storage, a report pipeline. A browser client can always be inspected; nothing here relies on hiding code.

## Accessibility and visibility parity checklist

| Item | Status |
| --- | --- |
| Rarity by shape as well as colour (circle, chevron, diamond, crown, star) in world, HUD and inventory | Done |
| Distinct hit markers and sounds for shield, health, headshot, shield break, elimination | Done |
| Damage direction indicator | Done |
| Visual sound indicators (gunfire and nearby footsteps, quantised to 16 sectors so they never give an exact bearing) | Done, toggle |
| Reduced motion (no camera shake, no sprint FOV push, no pulsing screen edges) | Done, toggle |
| Full key rebinding, hold / toggle for aim and crouch, separate ADS sensitivity, invert Y, FOV 80-105 | Done |
| Riftstorm never strobes; outside-storm effect is a soft violet edge | Done |
| Mist, storm wall and cover are identical on every quality preset (presets change shadows, post and resolution only) | Done by construction |
| Low scatter foliage never tall enough to hide a standing player | Done by construction |
| Captions for audio events | Not done |
| Colour-blind palette presets, photosensitivity mode beyond reduced motion | Not done |
| Controller support | Not done (out of MVP scope in the brief) |

## Browser compatibility

| Browser | Status |
| --- | --- |
| Edge (Chromium), Windows 11, headless with GPU | Verified by the automated capture run |
| Chrome desktop | Expected to work (same engine); not separately verified |
| Firefox desktop | Not verified |
| Safari | Not verified |
| Mobile / touch | Not supported |

Requires WebGL 2 and Pointer Lock. Missing WebGL 2 and lost graphics contexts show an explicit error screen.
