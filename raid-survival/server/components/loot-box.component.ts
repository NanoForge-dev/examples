export type LootType = "heal" | "gold" | "ammo";

// Marker + which effect it grants on pickup - see zombie-death.system.ts (spawns these) and
// loot-box-pickup.system.ts (applies the effect and removes it).
export class LootBox {
  name = this.constructor.name;

  constructor(public lootType: LootType) {}
}

// * Required to generate code
export default LootBox.name;
