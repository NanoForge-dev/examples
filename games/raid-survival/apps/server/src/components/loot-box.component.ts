import type { LootType } from "@raid-survival/shared/protocol";

/**
 * A box dropped by a zombie (`zombieDeathSystem`), picked up by the first player that walks on it
 * (`lootBoxPickupSystem`).
 *
 * @component
 * @side server
 */
export class LootBox {
  name = "LootBox";

  constructor(
    /** What it gives. */
    public lootType: LootType = "gold",
  ) {}
}
