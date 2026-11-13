import type { PlayerClass as PlayerClassType } from "@raid-survival/shared/player-class-catalog";

/**
 * A player's class, from the skin they picked. Read by the movement, revive and loot systems.
 *
 * @component
 * @side server
 */
export class PlayerClass {
  name = "PlayerClass";

  constructor(
    /** Healer, ninja or fighter. */
    public playerClass: PlayerClassType = "healer",
  ) {}
}
