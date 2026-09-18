export type LootType = "heal" | "gold" | "ammo";

// Marker + effect granted on pickup; spawned by zombie-death.system.ts, applied by
// loot-box-pickup.system.ts.
export class LootBox {
  name = this.constructor.name;

  constructor(public lootType: LootType) {}
}

// * Required to generate code
export default LootBox.name;
