# Farestorm rules, formulas and tuning

All numbers below are the values in the code at the time of writing; the source files are the authority. Rules are
versioned (`WORLD_VERSION`, `TAXI_RULES_VERSION`, `SCORE_RULES_VERSION`, `FARE_RULES_VERSION`) and combined into one
`RULES_VERSION` stored with every local record.

## Taxi tuning sheet (`src/vehicle/taxiSpecs.ts`)

| | Gull Compact | Breaker Sedan | Tempest Wagon |
| --- | --- | --- | --- |
| Mass | 1040 kg | 1340 kg | 1880 kg |
| Launch acceleration | 6.8 m/s2 | 6.1 m/s2 | 5.4 m/s2 |
| Measured 0-100 km/h | 4.8 s | 5.3 s | 5.9 s |
| Measured top speed | 154 km/h | 163 km/h | 170 km/h |
| Braking 150+ km/h to 0 | 55 m | 63 m | 73 m |
| Lateral grip front / rear | 1.78 / 1.70 | 1.72 / 1.76 | 1.66 / 1.84 |
| Steering rate | 3.4 rad/s | 3.0 rad/s | 2.5 rad/s |
| Rear grip while sliding | 0.60x | 0.68x | 0.78x |
| Snap Drift yaw kick | 1.35 rad/s | 1.15 rad/s | 0.95 rad/s |

"Measured" values come from `npm run telemetry` (flat Harbor boulevard, full throttle). The same run prints a corner
study: all three cabs enter a 90 degree junction at about 110 km/h, handbrake-turn, and exit at about 125 km/h.

Vehicle model summary (`src/vehicle/vehicle.ts`): a Rapier rigid body with four suspension raycasts (spring 1.6 Hz,
damping ratio 0.6), impulse-based lateral and longitudinal tyre forces with a friction limit per wheel, speed-sensitive
steering lock derived from the grip limit, bounded angular velocity, upright recovery torque, subtle air control, and
an arcade drift layer: handbrake pivots and scrubs speed (slide limited to about 57 degrees), releasing it pulls the
velocity onto the heading. Tailwind: up to 2.2 s, 1.85x acceleration + 2 m/s2, 1.14x top speed, cannot recharge while
active, needs 20% charge to start.

Surfaces (grip, extra drag m/s2, style eligible): asphalt 1.00 / 0 / yes; paving 0.97 / 0.1 / yes; cobble 0.90 / 0.35 /
yes; deck 0.88 / 0.15 / yes; dirt 0.80 / 0.8 / yes; grass 0.72 / 2.2 / no; sand 0.62 / 3.2 / no; shallow water 0.45 /
7.5 / no.

## Fares (`src/fares/fares.ts`)

- Route distance `d` is the shortest legal road distance between the pickup and the destination.
- Par time `= (6 + d / 20) s`, times 0.95 / 1.00 / 1.06 for low / medium / high traffic. Special fares use 0.88x par.
- Tiers by `d`: short 280-580 m (par 20-35 s), medium 580-980 m (35-55 s), long 980-1500 m (55-81 s),
  special 800-1500 m.
- Base fare `= 120 + 1.15 d` (special: doubled).
- Grade by patience left at arrival: Blazing >= 25%, Fast 10-24%, Close 1-9%, Late 0% within a 2 s personal grace,
  otherwise the fare fails and its tips are lost.
- Fare score `= base + time bonus + style tips + accuracy + discovery + passenger bonus`
  - time bonus = base x 0.5 / 0.25 / 0.1 / 0 by grade (hurried passengers add another 50% of it)
  - accuracy = 150 within 2.5 m of the ring centre, 60 within 5 m
  - discovery = 300 per shortcut found for the first time during the trip
  - fragile-cargo passengers add 300 for a collision-free trip and deduct tips per collision
- Shift time on delivery `= min(6, grade 3/2/1/0 + tier 1/2/3)`; trips under 150 m get no tier bonus.
- **Pickup advance (deviation from the brief)**: Arcade Shift also adds `par x max(0.46, 0.74 - 0.012 x deliveries)`
  seconds at pickup. Without it the brief's delivery awards alone cannot reach the brief's 5-12 minute session target.
- Pickup: stop below 5 km/h within 7.5 m of the stand ring. Clean (within 3.5 m, entered below 35 km/h) = 250 style;
  rough pickups cost 4% patience. Delivery: stop below 8 km/h within 9.5 m.
- Candidates: 7 kept alive (5 in Skill School), at least 3 within 450 m of road distance, never at the site you just
  delivered to, recent pickup and destination sites excluded, tier weights 45 / 35 / 20%.

## Pulse and style (`src/score/pulse.ts`, `src/game-session/session.ts`)

| Event | Base points | Charge | Condition |
| --- | --- | --- | --- |
| Near Miss | 100 + 4 per m/s above 50 km/h (+50 oncoming) | 1.0 | pass a moving vehicle with under 1.7 m gap at over 50 km/h, 5 s cooldown per vehicle |
| Thread the Needle | 300 | 2.0 | second near miss on a different vehicle within 0.7 s |
| Drift | 16 x speed x slide angle per second | 0.5-2.5 | above 35 km/h and 10 degrees, banked on a clean exit, scaled by net displacement (donuts score nothing) |
| Airtime | 150 x t^1.3 (+100 aligned landing) | 0.9-3.0 | at least 0.45 s airborne |
| Against the Flow | 80 per second | 0.7 | wrong side of a boulevard or the Highline at over 60 km/h |
| Shortcut | 300 (800 on first discovery) | 2.5 | entry, midpoint and exit volumes in order, 15 s cooldown |
| Clean Sector | 200 | 1.5 | 10 s above 70 km/h with a passenger and no collision |
| Precision Stop / Clean Pickup | 150 / 250 | 1.0 | centred stops |
| Surge Start / Grip Turn | 100 / 150 | 1.0 / 1.5 | technique inputs |

- Multiplier tiers 1x, 2x, 3x, 5x at 0 / 3 / 7 / 13 charge.
- Repeating the same category in a row multiplies charge by 0.6^n (floor 0.12) and points by 0.8^n (floor 0.4).
- 3.5 s without an event drops one tier; at 1x the chain ends. A collision drops one tier, a hard crash resets.
- With a passenger, style becomes trip tips (paid on delivery). Without one, half of it is banked directly.
- Tailwind charge: 5.5% per charge unit, plus 25 / 15 / 8 / 3% per delivery by grade. Boosting itself never scores.
- Rank: Arcade S 32,000 / A 18,000 / B 9,000 / C 3,500. Quick Shift S 60,000 / A 36,000 / B 20,000 / C 9,000.

## Determinism and replays

The simulation is a fixed 60 Hz step driven only by `InputFrame { throttle, brake, steer, handbrake, boost, reset }`
and a 32-bit seed. `Session.hash()` mixes cab, score, clock, Pulse and traffic positions; the test suite checks that
two sessions with the same seed and inputs produce identical hashes at every checkpoint. Time Trials use fixed seeds
(`7771 + 13 x route`). A replay is therefore `{ rulesVersion, seed, mode, taxi, traffic, InputFrame[] }`; recording,
ghost playback and a server-side verifier are **not implemented** in this build.

## Tools

- `tools/screenshot.mjs`: screenshot/benchmark capture against the production build.
- `src/tools/autopilot.ts`: pure-pursuit driver used by tests (complete shifts, time trials) and by `?autopilot`.
- `tests/session.test.ts` "Traffic soak": two simulated minutes of high-density traffic with invariants.
