/**
 * Blocks other moving boxes (players, walls, the lobby), from the entity's `Position2D` (its
 * top-left corner). Different from `Hitbox`, the combat range.
 *
 * @component
 * @side server
 */
export class CollisionBox {
  name = "CollisionBox";

  constructor(
    /** In pixels. */
    public width = 16,
    /** In pixels. */
    public height = 16,
  ) {}
}
