import { describe, it, expect } from "vitest";
import { Game } from "../src/sim/game";
import { Character } from "../src/sim/character";

function arena() {
  const g = new Game();
  g.attract = false;
  g.placePlayer(10, -60, 0);
  g.inv.unlocked.push("pistol"); g.inv.sidearm = "pistol"; g.inv.mags.pistol = 12; g.inv.ammo.pistol = 24;
  const target = new Character("guard", "security", g.makeLook("security", g.rng), 10, -50, g.groundAt(10, -50));
  target.yaw = 0; // facing away
  g.combat.add(target, "security", { weapon: "baton" });
  const steps = (n: number) => { for (let i = 0; i < n; i++) g.step(1 / 60); };
  const aimAt = () => {
    const P = g.player;
    g.cam.yaw = 0; g.cam.pitch = 0;
    g.cam.update(1 / 60, g.world, P, null, true, false, 0);
    // camera ray aimed at the target's chest
    const dx = target.x - g.cam.pos.x, dy = target.chestY - g.cam.pos.y, dz = target.z - g.cam.pos.z, L = Math.hypot(dx, dy, dz);
    g.cam.fwd = { x: dx / L, y: dy / L, z: dz / L };
  };
  return { g, target, steps, aimAt };
}

describe("combat", () => {
  it("hitscan pistol fire hurts the target, consumes ammo and is heard as gunfire", () => {
    const { g, target, aimAt } = arena();
    g.player.weapon = "pistol";
    for (let k = 0; k < 4; k++) {
      g.input.aimHeld = true; g.input.firePressed = true;
      g.player.fireCooldown = 0;
      aimAt();
      (g as any).playerFire(require_weapon("pistol"));
    }
    expect(target.health).toBeLessThan(100);
    expect(g.inv.mags.pistol).toBe(8);
    expect(g.police.crimes.some((c) => c.type === "gunfire")).toBe(true);
    expect(g.combat.brains.get(target.id)!.hostile).toBe(true);
  });
  it("baton takedown from behind subdues an unaware guard (nonlethal)", () => {
    const { g, target } = arena();
    g.placePlayer(10, -51.3, 0); // right behind the guard, same facing
    g.player.yaw = 0;
    (g as any).playerMelee("baton");
    expect(target.status).toBe("subdued");
    expect(target.alive).toBe(true);
  });
  it("stun projector disables a security camera", () => {
    const g = new Game();
    g.attract = false;
    const cam = g.police.cameras.find((c) => c.id === "store")!;
    g.placePlayer(cam.x - 6, cam.z + 2, 0);
    g.cam.pos = { x: cam.x - 6, y: cam.y, z: cam.z + 2 };
    const dx = cam.x - g.cam.pos.x, dz = cam.z - g.cam.pos.z, L = Math.hypot(dx, dz);
    g.cam.fwd = { x: dx / L, y: 0, z: dz / L };
    (g as any).resolveShot(g.cam.pos.x, cam.y, g.cam.pos.z, dx / L, 0, dz / L, 16, require_weapon("stun"), g.player, null);
    expect(cam.disabledUntil).toBeGreaterThan(g.time);
    expect(g.police.cameraSees(cam, cam.x + 1, cam.y - 2, cam.z - 3)).toBe(false);
  });
  it("smoke canister blocks guard sight lines", () => {
    const { g, target, steps } = arena();
    target.yaw = Math.PI; // facing the player
    g.inv.gadgets.smoke = 1; g.inv.selectedGadget = "smoke";
    g.smoke.push({ x: 10, y: 1.5, z: -55, r: 6.5, until: g.time + 14 });
    steps(30);
    expect(g.combat.brains.get(target.id)!.sees).toBe(false);
  });
});

import { WEAPONS } from "../src/sim/weapons";
function require_weapon(id: keyof typeof WEAPONS) { return WEAPONS[id]; }
