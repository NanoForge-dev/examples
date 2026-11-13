/**
 * Serves a `Ball`: after `delay` seconds it leaves horizontally at `speed`, toward each side in
 * turn. A goal puts it back at (`x`, `y`) and serves it again. Needs `Velocity2D` and the
 * `serveBall` system.
 *
 * @component
 * @side shared
 * @group Serve color=#f0a33a - Where and how the ball is served.
 */
export class Serve {
  name = "Serve";

  /** Seconds left before the serve, 0 once served. */
  wait: number;
  /** The side the next serve goes to: 1 right, -1 left. */
  side = 1;

  constructor(
    /** Where a goal puts the ball back, from the left. @group Serve @preset vector.x */
    public x = 0,
    /** Where a goal puts the ball back, from the top. @group Serve @preset vector.y */
    public y = 0,
    /** In pixels per second. @group Serve */
    public speed = 600,
    /** Seconds before each serve. @group Serve */
    public delay = 3,
  ) {
    this.wait = delay;
  }
}
