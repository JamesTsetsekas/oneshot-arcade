// One fixed-step input sample. This is what replays record and what the simulation consumes.

export interface InputFrame {
  throttle: number; // 0..1
  brake: number; // 0..1
  steer: number; // -1..1 (right positive)
  handbrake: boolean;
  boost: boolean;
  reset: boolean;
  horn: boolean;
  interact: boolean;
}

export const NO_INPUT: InputFrame = {
  throttle: 0, brake: 0, steer: 0, handbrake: false, boost: false, reset: false, horn: false, interact: false,
};

export function input(p: Partial<InputFrame>): InputFrame {
  return { ...NO_INPUT, ...p };
}

/** Pack an input frame into 4 bytes for compact replay storage. */
export function packInput(f: InputFrame): number {
  const t = Math.round(f.throttle * 15) & 15;
  const b = Math.round(f.brake * 15) & 15;
  const s = (Math.round(f.steer * 127) + 128) & 255;
  const bits = (f.handbrake ? 1 : 0) | (f.boost ? 2 : 0) | (f.reset ? 4 : 0) | (f.horn ? 8 : 0) | (f.interact ? 16 : 0);
  return (t | (b << 4) | (s << 8) | (bits << 16)) >>> 0;
}

export function unpackInput(v: number): InputFrame {
  const bits = (v >>> 16) & 255;
  return {
    throttle: (v & 15) / 15,
    brake: ((v >>> 4) & 15) / 15,
    steer: ((((v >>> 8) & 255) - 128) / 127),
    handbrake: !!(bits & 1), boost: !!(bits & 2), reset: !!(bits & 4), horn: !!(bits & 8), interact: !!(bits & 16),
  };
}

/** Quantize so live play and replay feed identical values into the simulation. */
export function quantizeInput(f: InputFrame): InputFrame {
  return unpackInput(packInput(f));
}
