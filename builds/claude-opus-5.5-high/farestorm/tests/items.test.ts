import { it, expect } from "vitest";
import { getWorld } from "../src/sim/world/city";
it("items never float over water", () => {
  const w = getWorld();
  for (const i of w.items) expect(w.waterAt(i.x, i.z) === null || w.heightAt(i.x, i.z) > 0.5, `${i.kind} ${i.x},${i.z}`).toBe(true);
  
});
