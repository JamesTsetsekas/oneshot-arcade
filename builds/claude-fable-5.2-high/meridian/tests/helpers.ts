import { Sim } from '../src/game-session/sim';
import { Physics } from '../src/physics/physics';
import { roadRoute } from '../src/world/roads';
import { steerToward } from '../src/vehicles/vehicle';
import { surfaceY } from '../src/world/district';

/** A quiet sim: no ambient traffic, pedestrians or patrols unless a test turns them on. */
export async function quietSim(seed = 7): Promise<Sim> {
  const sim = new Sim(await Physics.create(), seed);
  sim.traffic.enabled = false; sim.peds.enabled = false; sim.dispatch.enabled = false;
  return sim;
}
export function run(sim: Sim, seconds: number, each?: (t: number) => boolean | void): boolean {
  const n = Math.round(seconds * 60);
  for (let i = 0; i < n; i++) { if (each && each(i / 60) === true) return true; sim.step(); }
  return false;
}
export function place(sim: Sim, x: number, z: number, yaw = 0) {
  const p = sim.player;
  if (p.vehicle) p.vehicle.teleport(x, surfaceY(x, z), z, yaw); else p.body.teleport(x, sim.phys.groundBelow(x, 30, z), z, yaw);
  sim.step();
}
/** Hold E at the nearest interactable until it fires (or time runs out). */
export function holdInteract(sim: Sim, seconds = 4) {
  run(sim, seconds, () => { sim.input.interactHeld = true; sim.input.interact = true; });
  sim.input.interactHeld = false;
}
/** Drive the player's current vehicle along the GPS route to a point. Returns true on arrival. */
export function autodrive(sim: Sim, tx: number, tz: number, maxSeconds = 150, cruise = 12, arriveR = 5): boolean {
  const v = sim.player.vehicle!;
  const route = roadRoute(v.x, v.z, tx, tz);
  let k = 2;
  const ok = run(sim, maxSeconds, () => {
    const veh = sim.player.vehicle;
    if (!veh) return true;
    while (k < route.length - 2 && Math.hypot(route[k] - veh.x, route[k + 1] - veh.z) < 11) k += 2;
    const gx = route[k], gz = route[k + 1];
    const dEnd = Math.hypot(tx - veh.x, tz - veh.z);
    const steer = steerToward(veh, gx, gz);
    const want = dEnd < 25 ? Math.max(2.5, dEnd * 0.35) : Math.abs(steer) > 0.5 ? 6 : cruise;
    sim.input.moveX = steer; sim.input.moveZ = veh.speed < want ? 1 : veh.speed > want + 2 ? -1 : 0;
    if (dEnd < arriveR) { sim.input.moveZ = veh.speed > 0.8 ? -1 : 0; sim.input.moveX = 0; if (veh.speedAbs < 0.9) return true; }
    return false;
  });
  sim.input.moveX = 0; sim.input.moveZ = 0;
  run(sim, 0.5);
  return ok;
}
/** Walk the player toward a point by steering the camera-relative input. */
export function walkTo(sim: Sim, tx: number, tz: number, maxSeconds = 20, r = 1.2): boolean {
  const ok = run(sim, maxSeconds, () => {
    const b = sim.player.body, dx = tx - b.x, dz = tz - b.z;
    if (Math.hypot(dx, dz) < r) return true;
    sim.input.camYaw = Math.atan2(dx, dz); sim.input.moveZ = 1; sim.input.moveX = 0;
    return false;
  });
  sim.input.moveZ = 0;
  return ok;
}
