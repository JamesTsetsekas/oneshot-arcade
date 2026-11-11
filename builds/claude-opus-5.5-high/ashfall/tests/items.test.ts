import { describe, expect, it } from "vitest";
import { Rng } from "../src/core/rng";
import { AFFIX_BY_ID, BASE_BY_ID, BASE_ITEMS, AFFIXES, RELICS } from "../src/data/items";
import { generateItem, rerollAffix, eligibleBases } from "../src/items/generate";
import { Grid } from "../src/items/inventory";
import { itemSize, itemStats } from "../src/items/item";
import { validateContent } from "../src/data/validate";
import { goto, newGame } from "./helpers";
import { canRankUp, rankUp, respec } from "../src/progression/skilltree";
import { addXp, xpToNext } from "../src/progression/character";

let uid = 1;
const ctx = (ilvl: number, extra: any = {}) => ({ ilvl, classHint: "cinder" as const, nextUid: () => uid++, ...extra });

describe("content schemas", () => {
  it("all content tables validate", () => {
    expect(validateContent()).toEqual([]);
  });
  it("MVP content volume", () => {
    expect(BASE_ITEMS.length).toBeGreaterThanOrEqual(78);
    expect(AFFIXES.length).toBeGreaterThanOrEqual(45);
    expect(RELICS.length).toBe(8);
  });
});

describe("loot generation", () => {
  it("is deterministic per seed", () => {
    const a = Array.from({ length: 20 }, (_, i) => generateItem(new Rng(1000 + i), ctx(10)));
    const b = Array.from({ length: 20 }, (_, i) => generateItem(new Rng(1000 + i), ctx(10)));
    expect(JSON.stringify(a.map((x) => ({ ...x, uid: 0 })))).toBe(JSON.stringify(b.map((x) => ({ ...x, uid: 0 }))));
  });

  it("respects rarity budgets, affix groups, exclusions, slots, class tags, and item level", () => {
    const rng = new Rng(7);
    for (let i = 0; i < 3000; i++) {
      const ilvl = 1 + (i % 26);
      const cls = i % 2 ? "cinder" : "ranger";
      const it = generateItem(rng, { ...ctx(ilvl), classHint: cls });
      const base = BASE_BY_ID[it.baseId];
      expect(base.ilvl).toBeLessThanOrEqual(Math.max(ilvl, 8));
      const n = it.affixes.length;
      if (it.rarity === "worn") expect(n).toBe(0);
      if (it.rarity === "tempered") { expect(n).toBeGreaterThanOrEqual(1); expect(n).toBeLessThanOrEqual(2); }
      if (it.rarity === "inscribed") { expect(n).toBeGreaterThanOrEqual(3); expect(n).toBeLessThanOrEqual(4); }
      if (it.rarity === "relic") { expect(it.relicId).toBeTruthy(); expect(n).toBeGreaterThanOrEqual(2); expect(n).toBeLessThanOrEqual(3); }
      const groups = it.affixes.map((a) => AFFIX_BY_ID[a.id].group);
      expect(new Set(groups).size).toBe(groups.length);
      const pre = it.affixes.filter((a) => AFFIX_BY_ID[a.id].kind === "prefix").length;
      expect(pre).toBeLessThanOrEqual(2);
      expect(n - pre).toBeLessThanOrEqual(2);
      for (const a of it.affixes) {
        const d = AFFIX_BY_ID[a.id];
        expect(d.slots).toContain(base.slot);
        if (d.classTag) expect(d.classTag).toBe(base.classReq ?? cls);
        const tier = d.tiers[a.tier - 1];
        expect(tier.ilvl).toBeLessThanOrEqual(Math.max(it.ilvl, base.ilvl));
        expect(a.value).toBeGreaterThanOrEqual(tier.min);
        expect(a.value).toBeLessThanOrEqual(tier.max);
      }
      if (it.rarity === "inscribed" || it.rarity === "relic") expect(it.identified).toBe(false);
    }
  });

  it("drops mostly target the active class", () => {
    const rng = new Rng(3);
    let own = 0, other = 0;
    for (let i = 0; i < 2000; i++) {
      const it = generateItem(rng, ctx(12));
      const req = BASE_BY_ID[it.baseId].classReq;
      if (req === "cinder") own++; else if (req === "ranger") other++;
    }
    expect(own).toBeGreaterThan(other * 3);
  });

  it("minRarity and forced relics are honoured", () => {
    const rng = new Rng(11);
    for (let i = 0; i < 200; i++) expect(["inscribed", "relic"]).toContain(generateItem(rng, ctx(10, { minRarity: "inscribed" })).rarity);
    expect(generateItem(rng, ctx(10, { forceRelic: true })).rarity).toBe("relic");
  });

  it("reroll changes exactly one affix and keeps groups exclusive", () => {
    const rng = new Rng(19);
    let it = generateItem(rng, ctx(15, { minRarity: "inscribed" }));
    while (it.rarity !== "inscribed") it = generateItem(rng, ctx(15, { minRarity: "inscribed" }));
    const before = it.affixes.map((a) => a.id);
    const n = rerollAffix(new Rng(5), it, 0, "cinder", false)!;
    it.affixes[0] = n;
    const groups = it.affixes.map((a) => AFFIX_BY_ID[a.id].group);
    expect(new Set(groups).size).toBe(groups.length);
    expect(it.affixes.slice(1).map((a) => a.id)).toEqual(before.slice(1));
  });

  it("bosses guarantee an Inscribed-or-better on first completion and relic bad-luck protection triggers by the 4th kill", () => {
    const g = newGame("cinder", 404);
    let relicSeen = false;
    for (let k = 0; k < 4 && !relicSeen; k++) {
      goto(g, k % 2 ? "refuge" : "march");
      if (k % 2) continue;
      g.ch.zoneStates = {};
      goto(g, "refuge"); goto(g, "march");
      const boss = g.enemies.find((e) => e.isBoss)!;
      g.pickups = [];
      g.killEnemy(boss);
      const items = g.pickups.filter((p) => p.kind === "item").map((p) => p.item!);
      if (k === 0) expect(items.some((i) => i.rarity === "inscribed" || i.rarity === "relic")).toBe(true);
      if (items.some((i) => i.rarity === "relic")) relicSeen = true;
    }
    // force pity path
    g.ch.loot.relicPity = 3;
    g.ch.zoneStates = {};
    goto(g, "refuge"); goto(g, "march");
    g.pickups = [];
    g.killEnemy(g.enemies.find((e) => e.isBoss)!);
    expect(g.pickups.some((p) => p.item?.rarity === "relic")).toBe(true);
    expect(g.ch.loot.relicPity).toBe(0);
  });
});

describe("inventory grid", () => {
  it("places 1×1, 1×2 and 2×3 items without overlap and sorts", () => {
    const g = new Grid(10, 6);
    const rng = new Rng(2);
    const items = Array.from({ length: 30 }, () => generateItem(rng, ctx(8)));
    let placed = 0;
    for (const it of items) if (g.add(it)) placed++;
    expect(placed).toBeGreaterThan(5);
    const cells = new Set<string>();
    for (const p of g.placed) {
      const [w, h] = itemSize(p.item);
      for (let x = p.x; x < p.x + w; x++) for (let y = p.y; y < p.y + h; y++) { expect(cells.has(`${x},${y}`)).toBe(false); cells.add(`${x},${y}`); expect(x).toBeLessThan(10); expect(y).toBeLessThan(6); }
    }
    const before = g.placed.length;
    g.sort();
    expect(g.placed.length).toBe(before);
  });
});

describe("equipment and economy rules", () => {
  it("class and level requirements; two-handed mauls displace the off-hand", () => {
    const g = newGame("cinder", 1);
    const rng = new Rng(4);
    const bow = generateItem(rng, ctx(1, { baseId: "ashwood_bow" }));
    const inv = g.inv(); inv.add(bow); g.ch.inventory = inv.toData();
    expect(g.equip(bow.uid)).toBe(false);
    const maul = generateItem(rng, ctx(1, { baseId: "grave_maul" }));
    const inv2 = g.inv(); inv2.add(maul); g.ch.inventory = inv2.toData();
    expect(g.ch.equipment.offhand).not.toBeNull();
    expect(g.equip(maul.uid)).toBe(true);
    expect(g.ch.equipment.offhand).toBeNull();
    expect(g.ch.equipment.mainhand!.uid).toBe(maul.uid);
    const high = generateItem(rng, ctx(20, { baseId: "covenant_plate" }));
    const inv3 = g.inv(); inv3.add(high); g.ch.inventory = inv3.toData();
    expect(g.equip(high.uid)).toBe(false);
  });

  it("favorited items are protected and Relics require confirmation", () => {
    const g = newGame("cinder", 1);
    g.ch.flags.artificer_rescued = true;
    const rng = new Rng(6);
    const a = generateItem(rng, ctx(5, { baseId: "iron_cap" }));
    const r = generateItem(rng, ctx(10, { forceRelic: true }));
    const inv = g.inv(); inv.add(a); inv.add(r); g.ch.inventory = inv.toData();
    g.toggleFavorite(a.uid);
    expect(g.salvage(a.uid)).toMatch(/protected/);
    expect(g.sell(a.uid)).toMatch(/protected/);
    expect(g.salvage(r.uid)).toBe("confirm");
    expect(g.salvage(r.uid, true)).toBeNull();
    expect(g.ch.dust).toBeGreaterThan(0);
  });

  it("identify, reroll, repair, socket and glyph combination at the Artificer", () => {
    const g = newGame("cinder", 1);
    g.ch.flags.artificer_rescued = true;
    g.ch.gold = 100000; g.ch.dust = 1000;
    const rng = new Rng(8);
    const it = generateItem(rng, ctx(12, { minRarity: "inscribed", baseId: "kilnplate" }));
    const inv = g.inv(); inv.add(it); g.ch.inventory = inv.toData();
    expect(g.reroll(it.uid, 0)).not.toBeNull(); // unidentified
    expect(g.identify(it.uid)).toBeNull();
    const ids = it.affixes.map((a) => a.id);
    const gold = g.ch.gold;
    expect(g.reroll(it.uid, 1)).toBeNull();
    expect(g.ch.gold).toBeLessThan(gold);
    expect(it.affixes[0].id).toBe(ids[0]);
    expect(it.rerolls).toBe(1);
    it.durability = 10;
    expect(g.repair(it.uid)).toBeNull();
    expect(it.durability).toBe(it.maxDurability);
    it.sockets = 0; it.glyphs = []; it.socketAdded = false;
    expect(g.addSocket(it.uid)).toBeNull();
    expect(g.addSocket(it.uid)).not.toBeNull();
    const inv2 = g.inv();
    for (let i = 0; i < 3; i++) inv2.add({ uid: 7000 + i, baseId: "glyph_ember_1", kind: "glyph", ilvl: 6, rarity: "worn", affixes: [], sockets: 0, glyphs: [], identified: true, favorite: false, durability: 1, maxDurability: 1, rerolls: 0 });
    g.ch.inventory = inv2.toData();
    expect(g.combineGlyphs("glyph_ember_1")).toBeNull();
    const higher = g.inv().items().find((i) => i.baseId === "glyph_ember_2")!;
    expect(higher).toBeTruthy();
    expect(g.socketGlyph(it.uid, higher.uid)).toBeNull();
    expect(itemStats(it).flatEmber).toBeGreaterThan(0);
  });

  it("vendor buys and sells; potion belt caps at 5", () => {
    const g = newGame("ranger", 1);
    g.ch.gold = 5000;
    expect(g.vendorStock.length).toBe(8);
    const n = g.inv().items().length;
    expect(g.buy(0)).toBeNull();
    expect(g.inv().items().length).toBe(n + 1);
    const bought = g.inv().items()[0];
    const gold = g.ch.gold;
    expect(g.sell(bought.uid)).toBeNull();
    expect(g.ch.gold).toBeGreaterThan(gold);
    while (g.ch.belt.health < 5) expect(g.buyPotion("health")).toBeNull();
    expect(g.buyPotion("health")).toBe("Belt slot full");
  });
});

describe("progression", () => {
  it("levels grant skill points every level and attribute points every other level, cap 20", () => {
    const g = newGame();
    const sp = g.ch.skillPoints;
    let total = 0;
    for (let l = 1; l < 20; l++) total += xpToNext(l);
    addXp(g.ch, total + 5000);
    expect(g.ch.level).toBe(20);
    expect(g.ch.skillPoints - sp).toBe(19);
    expect(g.ch.attrPoints).toBe(10);
  });

  it("skill prerequisites, level gates, exclusive capstones and respec refunds", () => {
    const g = newGame("cinder");
    g.ch.level = 20; g.ch.skillPoints = 30;
    expect(canRankUp(g.ch, "living_crucible").ok).toBe(false); // needs Kindled Plate
    expect(rankUp(g.ch, "kindled_plate")).toBe(true);
    expect(rankUp(g.ch, "bulwark_doctrine")).toBe(true);
    expect(rankUp(g.ch, "living_crucible")).toBe(true);
    expect(canRankUp(g.ch, "unbroken_oath").ok).toBe(false);
    const lowly = newGame("ranger");
    lowly.ch.skillPoints = 5;
    expect(canRankUp(lowly.ch, "horizon_call").ok).toBe(false);
    const before = g.ch.skillPoints;
    g.ch.gold = 10000;
    expect(respec(g.ch).ok).toBe(true);
    expect(g.ch.skillPoints).toBe(before + 3);
    expect(g.ch.ranks.living_crucible).toBeUndefined();
  });

  it("each class has two distinct capstone builds that change derived stats", () => {
    for (const [cls, a, b, pa, pb] of [["cinder", "living_crucible", "unbroken_oath", "kindled_plate", "bulwark_doctrine"], ["ranger", "thousand_trails", "patient_hunter", "keen_trail", "trapwright"]] as const) {
      const g1 = newGame(cls), g2 = newGame(cls);
      for (const g of [g1, g2]) { g.ch.level = 20; g.ch.skillPoints = 30; }
      rankUp(g1.ch, pa); rankUp(g1.ch, a);
      rankUp(g2.ch, pb); rankUp(g2.ch, b);
      g1.recomputeStats(); g2.recomputeStats();
      expect(JSON.stringify(g1.stats.raw)).not.toBe(JSON.stringify(g2.stats.raw));
    }
  });

  it("respec is free through level 8 and costs gold after", () => {
    const g = newGame();
    g.ch.level = 8; g.ch.gold = 0;
    expect(respec(g.ch).ok).toBe(true);
    g.ch.level = 9;
    expect(respec(g.ch).ok).toBe(false);
  });

  it("eligible bases respect class filters", () => {
    expect(eligibleBases(20, "cinder").every((b) => !b.classReq || b.classReq === "cinder")).toBe(true);
  });
});
