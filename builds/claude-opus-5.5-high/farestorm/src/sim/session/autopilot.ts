// Simple route-following driver. Used by tests and the optional ?autodrive demo (attract mode).

import { clamp } from "../math";
import { input, type InputFrame } from "../vehicle/input";
import type { Session } from "./session";

export function autopilot(s: Session): InputFrame {
  const t = s.target;
  if (!t) return input({ brake: 1 });
  const ang = s.arrowAngle;
  const d = Math.hypot(t.x - s.v.x, t.z - s.v.z);
  const sp = s.speed;
  const want = d < 30 ? Math.max(1.0, d * 0.35) : Math.abs(ang) > 0.6 ? 9 : 17;
  return input({
    steer: clamp(ang * 2.2, -1, 1),
    throttle: sp < want ? 1 : 0,
    brake: sp > want + 2 ? 1 : 0,
    reset: s.v.stuckTime > 2,
  });
}
