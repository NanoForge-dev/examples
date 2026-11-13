/**
 * How fast the velocity of an entity changes, in pixels per second, per second. Needs
 * `Velocity2D` and the `move2D` system.
 *
 * @component
 * @side shared
 * @group Acceleration color=#f0a33a - Pixels per second, per second.
 */
export class Acceleration2D {
  name = "Acceleration2D";

  constructor(
    /** Added to the horizontal velocity every second. @group Acceleration @preset vector.x */
    public x = 0,
    /** Added to the vertical velocity every second. @group Acceleration @preset vector.y */
    public y = 0,
  ) {}
}
