/**
 * Where an entity's drawable is in the stack: a higher `z` is drawn over a lower one. A system
 * applies it: `drawOrder2D` for the `Drawable*2D` shapes, or the game's own.
 *
 * @remarks
 * Without such a system, a shape is drawn over the shapes that appeared before it, and a scene
 * loaded again can stack its shapes in another order.
 *
 * @component
 * @side client
 * @group Order color=#b18cff - Drawing order.
 */
export class DrawOrder2D {
  name = "DrawOrder2D";

  /** The `z` the shape was last stacked at, set by `drawOrder2D`. */
  stackedZ?: number;

  constructor(
    /** Higher is drawn over lower; entities without it are under every one with it. @group Order */
    public z = 0,
  ) {}
}
