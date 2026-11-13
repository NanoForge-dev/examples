/**
 * A tower's level and fire cooldown, on top of its `Building`, `Hitbox` and `Health`. The level
 * goes up with an E press (`buildingInteractSystem`); `towerSystem` derives its fire rate and
 * damage from it.
 *
 * @component
 * @side server
 */
export class Tower {
  name = "Tower";

  level = 1;
  /** Seconds before the next shot. */
  cooldownRemaining = 0;
}
