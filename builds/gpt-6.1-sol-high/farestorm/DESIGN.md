# Rules and source data

Rules version: 1. The authoritative score and clock data live in `Session`; renderer transforms are consumers. Inputs are sampled once per render frame, then simulated at 60 Hz with catch-up capped at 100 ms. Slower rendering therefore slows wall-clock simulation rather than executing an unbounded catch-up. No cross-platform replay guarantee is claimed.

## Tuning

| Cab | Acceleration m/s² | Speed cap m/s | Steering | Grip | Relative mass |
| --- | ---: | ---: | ---: | ---: | ---: |
| Breaker | 13 | 44 | 1.9 | 7 | 1.2 |
| Gull | 14 | 40 | 2.25 | 6 | 0.9 |
| Tempest | 11 | 49 | 1.65 | 9 | 1.6 |

Mass is tuning metadata only: collision response is shared. Speed is capped after exponential drag. Steering is attenuated by speed and increased by handbrake; velocity follows heading with exponential lateral-grip smoothing. These are custom planar arcade equations, not a rigid-body or raycast-wheel solver. Static collision tests an expanded building footprint every 60 Hz step. At the maximum boosted speed, travel per step is under 1.1 m, below the thinnest building footprint. Boundaries collide at ±230 m.

Road centerlines are the Cartesian product of `[-180,-90,0,90,180]`, 25 m wide, with open intersections. Source destination coordinates, names, figures and tuning are exported in `src/sim.ts`; no generated binary maps are needed. Guidance follows nearest grid lines; it is a heuristic, not shortest-path search.

## Fare formulas

- Boarding: distance ≤10 m and |speed| ≤2.2 m/s. Destination selection is deterministic from pickup ID and delivery count, rejects trips under 95 m.
- Patience: `22 + straight_line_distance * 0.075` seconds.
- Base fare: `round(350 + straight_line_distance * 2)`.
- Payout: base + `max(0, round(remaining_patience * 12))` + accuracy (250 within 5 m, otherwise 100).
- Arrival: distance ≤12 m and |speed| ≤2.5 m/s.
- Grade: Blazing ≥25% patience, Fast ≥10%, Close >0%, Late during 2-second personal grace.
- Shift extension: 12 / 9 / 5 seconds by grade group, capped at an 85-second clock. Close and Late share 5 seconds in this slice.
- Failed fare: after personal grace, rider leaves, Pulse resets; no payout or shift extension.
- Rank: S ≥10,000; A ≥6,000; B ≥3,000; C ≥1,000; D otherwise.

## Style and anti-farm boundaries

Moving above 10 m/s is mandatory for style scoring. Snap Drift requires throttle-speed movement, steering magnitude >0.3, handbrake, and one accumulated second. Named actions have a 2-second cooldown; individual traffic IDs have independent near-miss cooldowns. Near misses require >14 m/s and 4–8 m proximity. Pulse thresholds are 160 / 400 / 800 for 2× / 3× / 5×; after 3.5 seconds without an action it decays by 90 units/second. Hits remove 240 units with a 1.2-second contact cooldown. Style adds points × current multiplier and charges 0.13 meter units per raw point. Boost consumes 34 meter units/second, increases acceleration 1.85× and speed cap 1.3×, and awards no score itself. Delivery charges 25 units.

This is basic cooldown protection, not the brief's full varied-category/diminishing-return policy. Repeated laps can still earn style. No competitive verification is shipped. A future verified leaderboard must issue a signed seed/nonce and validate versioned input replays and score events on a server; accepting the local record is explicitly unsuitable.

## Compatibility and accessibility

Automated Chromium/WebGL 2 is the tested browser path. Firefox, Edge, Safari and real controllers remain unverified. WASD and arrow controls coexist; text names supplement mint/gold colors; camera distance and sound are toggleable; operating-system reduced motion disables CSS transitions and crash flash. Steering remapping, explicit colorblind palettes, reduced-motion camera, subtitles beyond written passenger names, UI scaling settings and screen-reader playable driving are not implemented.

No runtime external requests are needed after the static build is loaded. Local best-score writes are guarded against unavailable storage. There is no PWA service worker, replay recorder, IndexedDB, external leaderboard, analytics, crash reporting, or network identity.
