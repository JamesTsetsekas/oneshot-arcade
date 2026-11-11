// server-spatial: interest management. Decides which transforms and events a client is allowed to receive.
// Distant enemies are never sent as live transforms; far gunfire degrades to a direction-only sound event.
import { INTEREST_RADIUS } from "../../shared/content/rules";
import { WEAPONS } from "../../shared/content/weapons";
import type { MatchEvent } from "../../shared/protocol/protocol";
import type { Actor } from "../match/actor";
import type { QueuedEvent } from "../match/match";

export function inInterest(vx: number, vz: number, x: number, z: number, radius: number): boolean {
  const dx = x - vx,
    dz = z - vz;
  return dx * dx + dz * dz <= radius * radius;
}

const LOCAL_EVENT_RADIUS = 130;

export function filterEvents(queue: readonly QueuedEvent[], viewerId: number, target: Actor, actors: readonly Actor[]): MatchEvent[] {
  const out: MatchEvent[] = [];
  for (const q of queue) {
    const ev = q.ev;
    if (q.to >= 0) {
      // private events follow the actor being viewed (self, or the spectated player)
      if (q.to === viewerId || q.to === target.id) out.push(ev);
      continue;
    }
    switch (ev.t) {
      case "shot": {
        const d = Math.hypot(ev.ox - target.x, ev.oz - target.z);
        if (d <= INTEREST_RADIUS) out.push(ev);
        else if (d <= WEAPONS[ev.weapon].audible * 1.6) {
          // event-only: audible, but no tracer and no shooter transform
          out.push({ t: "sound", kind: "gunfar", x: ev.ox, y: ev.oy, z: ev.oz, actor: -1 });
        }
        break;
      }
      case "sound":
      case "explode":
        if (inInterest(target.x, target.z, ev.x, ev.z, ev.t === "explode" ? INTEREST_RADIUS : LOCAL_EVENT_RADIUS)) out.push(ev);
        break;
      case "land":
      case "launch": {
        const a = actors[ev.actor];
        if (a && inInterest(target.x, target.z, a.x, a.z, LOCAL_EVENT_RADIUS)) out.push(ev);
        break;
      }
      case "hit":
        break; // only ever delivered privately
      case "kill":
        // the feed is global, the death location is not
        if (inInterest(target.x, target.z, ev.x, ev.z, INTEREST_RADIUS)) out.push(ev);
        else out.push({ ...ev, x: 0, y: -1000, z: 0 });
        break;
      default:
        out.push(ev); // kill feed, storm, pings, phase: global by design
    }
  }
  return out;
}
