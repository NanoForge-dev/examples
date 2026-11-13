/**
 * Combat range (what attacks, bullets and pickups reach), distinct from `CollisionBox` (physical
 * blocking).
 *
 * @component
 * @side server
 */
export class Hitbox {
  name = "Hitbox";

  constructor(
    /** In pixels. */
    public width = 16,
    /** In pixels. */
    public height = 16,
    /** From the `Position2D` (top-left corner), in pixels. */
    public offsetX = 0,
    /** From the `Position2D` (top-left corner), in pixels. */
    public offsetY = 0,
  ) {}
}
