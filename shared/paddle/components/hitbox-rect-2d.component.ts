/**
 * Makes an entity collide as a rectangle whose top-left corner is its `Position2D`.
 *
 * @remarks
 * The library's `HitboxRect2D` (`@nanoforge/physics-2d`) has the same parameters, plus the
 * `collisions` that its `detectCollisions2D` system fills. Here `bounceBall`, `blockPaddles` and
 * `scoreGoals` test the hitboxes they need themselves.
 *
 * @component
 * @side shared
 * @group Size color=#5ec26a - Size of the hitbox.
 */
export class HitboxRect2D {
  name = "HitboxRect2D";

  constructor(
    /** In pixels. @group Size @preset size.width */
    public width = 50,
    /** In pixels. @group Size @preset size.height */
    public height = 50,
  ) {}
}
