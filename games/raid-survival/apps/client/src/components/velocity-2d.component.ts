/**
 * How fast an entity moves, in pixels per second. Needs `Position2D` and the `move2D` system.
 *
 * @example
 * `new Velocity2D(100, 0)` moves 100 pixels to the right every second.
 *
 * @component
 * @side shared
 * @group Velocity color=#36c5a0 - Pixels per second.
 */
export class Velocity2D {
  name = "Velocity2D";

  constructor(
    /** Pixels per second to the right (negative: to the left). @group Velocity @preset vector.x */
    public x = 0,
    /** Pixels per second downward (negative: upward). @group Velocity @preset vector.y */
    public y = 0,
  ) {}
}
