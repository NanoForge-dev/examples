import type { BuildingType } from "@raid-survival/shared/building-catalog";

/**
 * A wall or a tower built by the players. Blocking, combat and HP are on its `CollisionBox`,
 * `Hitbox` and `Health`.
 *
 * @component
 * @side server
 */
export class Building {
  name = "Building";

  constructor(
    /** Its entry in the building catalog. */
    public buildingType: BuildingType = "wall",
  ) {}
}
