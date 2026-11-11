/// <reference lib="webworker" />
import { generateZone } from "../world";

/** Off-main-thread dungeon/wilderness plan generation. */
self.onmessage = (e: MessageEvent<{ req: number; id: any; seed: number; difficulty: any }>) => {
  const { req, id, seed, difficulty } = e.data;
  try {
    const z = generateZone(id, seed, difficulty);
    (self as unknown as Worker).postMessage({ req, zone: z }, [z.cells.buffer]);
  } catch (err) {
    (self as unknown as Worker).postMessage({ req, error: String(err) });
  }
};
