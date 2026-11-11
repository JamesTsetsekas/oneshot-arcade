// server-match: seeded loot rolls. The server owns every roll; tables live in shared-content.
import { ITEMS, type ItemId, type LootDesc } from "../../shared/content/items";
import {
  AMMO_WEIGHTS, FLOOR_CATEGORY_WEIGHTS, HEAL_WEIGHTS, ITEM_SPAWN_COUNT, RARITY_WEIGHTS, SHIELD_WEIGHTS, UTILITY_WEIGHTS,
  WEAPON_WEIGHTS, type LootCategory,
} from "../../shared/content/rules";
import { AMMO_PICKUP, PROTOTYPE_CAP, RARITY_PROTOTYPE, WEAPONS, WEAPON_IDS, weaponStats, type AmmoType, type WeaponClass, type WeaponId } from "../../shared/content/weapons";
import type { Rng } from "../../shared/math";

export class LootRoller {
  prototypes = 0;
  constructor(private rng: Rng) {}

  rarity(tier: number): number {
    const weights = RARITY_WEIGHTS[Math.max(1, Math.min(4, tier))]!;
    const ids = [0, 1, 2, 3, 4];
    let r = this.rng.weighted(ids, (i) => weights[i]!);
    if (r === RARITY_PROTOTYPE) {
      if (this.prototypes >= PROTOTYPE_CAP) r = 3;
      else this.prototypes++;
    }
    return r;
  }

  weapon(tier: number, avoid?: WeaponClass): LootDesc {
    const pool = WEAPON_IDS.filter((id) => WEAPONS[id].cls !== avoid);
    const id: WeaponId = this.rng.weighted(pool, (w) => WEAPON_WEIGHTS[w]);
    const rarity = this.rarity(tier);
    const st = weaponStats(id, rarity);
    const def = WEAPONS[id];
    return { kind: "weapon", weapon: id, rarity, mag: st.mag, bonus: AMMO_PICKUP[def.ammo] * (def.ammo === "charge" ? 2 : 2), count: 1 };
  }

  private pickPair<T>(list: readonly [T, number][]): T {
    return this.rng.weighted(list, (e) => e[1])[0];
  }

  item(id: ItemId): LootDesc {
    return { kind: "item", item: id, count: Math.min(ITEMS[id].stack, ITEM_SPAWN_COUNT[id]) };
  }
  heal(): LootDesc {
    return this.item(this.pickPair(HEAL_WEIGHTS));
  }
  shield(): LootDesc {
    return this.item(this.pickPair(SHIELD_WEIGHTS));
  }
  utility(): LootDesc {
    return this.item(this.pickPair(UTILITY_WEIGHTS));
  }
  ammo(type?: AmmoType): LootDesc {
    const t = type ?? this.pickPair(AMMO_WEIGHTS);
    return { kind: "ammo", ammo: t, count: AMMO_PICKUP[t] };
  }

  floor(tier: number, guaranteedWeapon: boolean): LootDesc {
    if (guaranteedWeapon) return this.weapon(tier);
    const cats = Object.keys(FLOOR_CATEGORY_WEIGHTS) as LootCategory[];
    const cat = this.rng.weighted(cats, (c) => FLOOR_CATEGORY_WEIGHTS[c]);
    switch (cat) {
      case "weapon": return this.weapon(tier);
      case "ammo": return this.ammo();
      case "heal": return this.heal();
      case "shield": return this.shield();
      default: return this.utility();
    }
  }

  /** Resonance chest: two item rolls (no duplicate weapon class) plus ammo and a heal or shield. */
  chest(tier: number): LootDesc[] {
    const out: LootDesc[] = [];
    const first = this.weapon(tier);
    out.push(first);
    const firstCls = WEAPONS[first.weapon!].cls;
    if (this.rng.chance(0.45)) out.push(this.weapon(tier, firstCls));
    else out.push(this.rng.chance(0.5) ? this.utility() : this.shield());
    out.push(this.ammo(WEAPONS[first.weapon!].ammo));
    out.push(this.rng.chance(0.5) ? this.heal() : this.shield());
    return out;
  }

  /** Supply locker: predictable ammo, healing and utility. */
  locker(): LootDesc[] {
    return [this.ammo("light"), this.ammo(this.rng.chance(0.5) ? "shell" : "heavy"), this.heal(), this.rng.chance(0.6) ? this.shield() : this.utility()];
  }

  /** Vault / supply capsule / caravan: high rarity. */
  highTier(count: number): LootDesc[] {
    const out: LootDesc[] = [];
    let cls: WeaponClass | undefined;
    for (let i = 0; i < count; i++) {
      if (i < 2) {
        const w = this.weapon(4, cls);
        cls = WEAPONS[w.weapon!].cls;
        out.push(w);
        out.push(this.ammo(WEAPONS[w.weapon!].ammo));
      } else out.push(i % 2 ? this.shield() : this.heal());
    }
    return out;
  }
}

export function lootName(d: LootDesc): string {
  if (d.kind === "weapon") return WEAPONS[d.weapon!].name;
  if (d.kind === "item") return ITEMS[d.item!].name;
  return `${d.ammo![0]!.toUpperCase()}${d.ammo!.slice(1)} ammo`;
}
