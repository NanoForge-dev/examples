/**
 * Scrolls an entity to the left, and brings it back on the right once it has left the screen: a
 * few tiles side by side make an endless strip. Needs `Position2D`, `DrawableRect2D` and the
 * `scrollGround` system.
 *
 * @example
 * Three 336-pixel tiles at x 0, 336 and 672, each with `new ScrollLoop(150, 1008)`.
 *
 * @component
 * @side client
 * @group Scroll color=#36c5a0 - How the entity scrolls.
 */
export class ScrollLoop {
  name = "ScrollLoop";

  constructor(
    /** Pixels per second to the left. @group Scroll */
    public speed = 150,
    /** Pixels it jumps to the right once out of the screen: the width of all the tiles. @group Scroll */
    public span = 1008,
  ) {}
}
