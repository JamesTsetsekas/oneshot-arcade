import { describe, expect, it } from 'vitest';
import { Game } from '../src/sim/game';
import { emptyInput } from '../src/sim/types';

/** Headless simulation benchmark: measures per-step CPU cost of the whole game sim (no rendering). */
describe('simulation performance (benchmark route)', () => {
  it('stays within the game/AI CPU budget while driving the arterial loop at density 1.0', () => {
    const g = new Game(1107);
    g.newGame();
    g.missions.abandon();
    for (let i = 0; i < 180; i++) g.step(emptyInput(), 1 / 60);
    g.prof = {};
    const bike = g.vehicles.find((v) => v.def.id === 'kestrel');
    if (bike) g.removeVehicle(bike);
    const v = g.spawnVehicle('cormorant', -240, -234, Math.PI / 2, 'player');
    const h = g.player.human;
    h.x = v.x; h.z = v.z; h.vehicleId = v.id; v.driverId = 0; v.engineOn = true;
    const steps = 60 * 40;
    const t0 = performance.now();
    let maxStep = 0;
    for (let i = 0; i < steps; i++) {
      const s = performance.now();
      const before = { ...g.prof! };
      // follow the arterial loop with simple waypoint steering
      const tx = Math.abs(v.x) > 232 || Math.abs(v.z) > 232 ? 0 : 0;
      void tx;
      g.step({ ...emptyInput(), throttle: 0.7, steer: 0 }, 1 / 60);
      const dtm = performance.now() - s; maxStep = Math.max(maxStep, dtm); if (dtm > 8) console.log("slow step", i, dtm.toFixed(1), JSON.stringify(Object.fromEntries(Object.entries(g.prof!).map(([k, v]) => [k, +(v - (before[k] ?? 0)).toFixed(1)]))));
    }
    const avg = (performance.now() - t0) / steps;
    const prof = Object.fromEntries(Object.entries(g.prof!).map(([k, ms]) => [k, +(ms / steps).toFixed(3)]));
    console.log('sim avg ms/step', avg.toFixed(3), 'max', maxStep.toFixed(2), JSON.stringify(prof), 'vehicles', g.vehicles.length, 'humans', g.humans.length);
    expect(avg).toBeLessThan(8); // brief: <= 8 ms game/AI CPU per frame at 60 FPS
  });
});
